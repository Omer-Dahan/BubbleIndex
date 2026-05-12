import json
import logging
from datetime import date, timedelta

import pandas as pd
from sqlalchemy.orm import Session

from app.config import Settings
from app.core.cache import FileCache
from app.data.fetchers.fred import FREDFetcher, FRED_SERIES
from app.data.fetchers.yfinance_fetcher import YFinanceFetcher
from app.data.fetchers.finnhub import FinnhubFetcher
from app.data.processors.indicators import (
    compute_buffett_indicator, compute_yield_curve_spread,
    compute_vix_level, compute_vix_trend, compute_unemployment_trend,
    compute_sp500_pe, compute_hy_spread, compute_fed_funds_level,
    compute_concentration, get_data_date,
)
from app.scoring.percentile import PercentileNormalizer
from app.scoring.weights import WEIGHT_CONFIG, score_to_label, ALL_INDICATOR_NAMES
from app.scoring.crisis_similarity import compute_similarities
from app.db.models.risk_snapshot import RiskSnapshot
from app.db.models.indicator_series import IndicatorSeries
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

logger = logging.getLogger(__name__)

# FRED series needed for current score (daily window only)
FRED_SERIES_MAP = {
    "SP500":             "SP500",
    "VIX":               "VIXCLS",
    "YIELD_2Y":          "DGS2",
    "YIELD_10Y":         "DGS10",
    "WILSHIRE5000":      "WILL5000IND",
    "GDP":               "GDP",
    "BUFFETT_INDICATOR": "DDDM01USA156NWDB",
    "UNEMPLOYMENT":      "UNRATE",
    "FED_FUNDS":         "FEDFUNDS",
    "HY_SPREAD":         "BAMLH0A0HYM2",
}


class ScoringEngine:
    def __init__(self, session: Session, settings: Settings, normalizer: PercentileNormalizer):
        self.session = session
        self.settings = settings
        cache = FileCache(settings.cache_dir)
        self.fred = FREDFetcher(cache, settings)
        self.yf = YFinanceFetcher(cache, settings)
        self.finnhub = FinnhubFetcher(cache, settings)
        self.normalizer = normalizer

    def compute_current_score(self) -> dict:
        today = date.today()

        # Return cached DB snapshot if computed within last hour
        existing = (
            self.session.query(RiskSnapshot)
            .filter(RiskSnapshot.snapshot_date == today)
            .first()
        )
        if existing:
            return self._snapshot_to_dict(existing)

        return self._compute_and_save(today)

    def get_latest_snapshot(self) -> dict | None:
        snap = (
            self.session.query(RiskSnapshot)
            .order_by(RiskSnapshot.snapshot_date.desc())
            .first()
        )
        if snap is None:
            return None
        return self._snapshot_to_dict(snap)

    def refresh(self) -> dict:
        today = date.today()
        # Delete today's snapshot if exists
        self.session.query(RiskSnapshot).filter(RiskSnapshot.snapshot_date == today).delete()
        self.session.commit()
        return self._compute_and_save(today)

    def get_snapshots(self, start: date, end: date) -> list[dict]:
        snaps = (
            self.session.query(RiskSnapshot)
            .filter(RiskSnapshot.snapshot_date >= start, RiskSnapshot.snapshot_date <= end)
            .order_by(RiskSnapshot.snapshot_date)
            .all()
        )
        return [self._snapshot_to_dict(s) for s in snaps]

    def _compute_and_save(self, today: date) -> dict:
        warnings: list[str] = []
        end = today
        start = today - timedelta(days=90)  # fetch last 90 days of data

        # Fetch data
        data = {}
        for name, fred_id in FRED_SERIES_MAP.items():
            try:
                data[name] = self.fred.fetch_series(fred_id, start, end)
            except Exception as e:
                logger.warning("Failed to fetch %s: %s", name, e)
                data[name] = pd.DataFrame({"date": [], "value": []})

        pe_yf = self.yf.fetch_pe_ratio()
        pe_finnhub = self.finnhub.fetch_pe_ratio()
        pe = pe_yf or pe_finnhub
        top10 = self.yf.fetch_top_holdings_concentration()

        # Compute raw indicators
        buffett_val, buffett_src = compute_buffett_indicator(
            data.get("BUFFETT_INDICATOR"),
            data.get("WILSHIRE5000"),
            data.get("GDP"),
        )
        yield_spread = compute_yield_curve_spread(data.get("YIELD_10Y", pd.DataFrame()), data.get("YIELD_2Y", pd.DataFrame()))
        vix_level = compute_vix_level(data.get("VIX", pd.DataFrame()))
        vix_trend = compute_vix_trend(data.get("VIX", pd.DataFrame()))
        unemp_trend = compute_unemployment_trend(data.get("UNEMPLOYMENT", pd.DataFrame()))
        sp500_pe = compute_sp500_pe(pe)
        hy_spread = compute_hy_spread(data.get("HY_SPREAD", pd.DataFrame()))
        fed_funds = compute_fed_funds_level(data.get("FED_FUNDS", pd.DataFrame()))
        concentration = compute_concentration(top10)

        raw = {
            "buffett_indicator":   buffett_val,
            "sp500_pe":            sp500_pe,
            "yield_curve_spread":  yield_spread,
            "fed_funds_level":     fed_funds,
            "unemployment_trend":  unemp_trend,
            "vix_level":           vix_level,
            "hy_spread":           hy_spread,
            "vix_trend":           vix_trend,
            "top10_concentration": concentration,
        }

        # Normalize each indicator to 0–100 percentile
        normalized: dict[str, float] = {}
        for cat_id, cat in WEIGHT_CONFIG.items():
            for ind_id, ind_cfg in cat["indicators"].items():
                val = raw.get(ind_id)
                if val is None:
                    warnings.append(f"{ind_id}: unavailable, using neutral (50)")
                    normalized[ind_id] = 50.0
                else:
                    # Use FRED series_id or indicator name for percentile lookup
                    series_map = {
                        "buffett_indicator":   "DDDM01USA156NWDB",
                        "sp500_pe":            "sp500_pe",
                        "yield_curve_spread":  "yield_curve_spread",
                        "fed_funds_level":     "FEDFUNDS",
                        "unemployment_trend":  "unemp_trend",
                        "vix_level":           "VIXCLS",
                        "hy_spread":           "BAMLH0A0HYM2",
                        "vix_trend":           "vix_trend",
                        "top10_concentration": "top10_concentration",
                    }
                    sid = series_map.get(ind_id, ind_id)
                    normalized[ind_id] = self.normalizer.normalize(sid, val, invert=ind_cfg["invert"])

        # Compute category scores
        cat_scores: dict[str, float] = {}
        for cat_id, cat in WEIGHT_CONFIG.items():
            ind_weights = cat["indicators"]
            total_w = sum(v["weight"] for v in ind_weights.values())
            cat_score = sum(
                normalized.get(ind_id, 50.0) * ind_cfg["weight"]
                for ind_id, ind_cfg in ind_weights.items()
            )
            cat_scores[cat_id] = cat_score / total_w if total_w > 0 else 50.0

        # Composite score
        composite = sum(
            cat_scores[cat_id] * cat["weight"]
            for cat_id, cat in WEIGHT_CONFIG.items()
        )
        composite = round(composite, 1)
        label, verb = score_to_label(composite)

        # Crisis similarity
        similarities = compute_similarities(normalized)

        # Data freshness
        freshness = {}
        for name, fred_id in FRED_SERIES_MAP.items():
            d = get_data_date(data.get(name, pd.DataFrame()))
            if d:
                freshness[fred_id] = str(d)

        # Build indicator details for each category
        categories = []
        for cat_id, cat in WEIGHT_CONFIG.items():
            inds = []
            for ind_id, ind_cfg in cat["indicators"].items():
                raw_val = raw.get(ind_id)
                inds.append({
                    "name": ind_id,
                    "display_name": ind_cfg["display_name"],
                    "raw_value": raw_val,
                    "raw_unit": ind_cfg["unit"],
                    "normalized_score": round(normalized.get(ind_id, 50.0), 1),
                    "is_imputed": raw_val is None,
                })
            categories.append({
                "id": cat_id,
                "display_name": cat["display_name"],
                "weight": cat["weight"],
                "score": round(cat_scores[cat_id], 1),
                "indicators": inds,
            })

        # Persist snapshot
        snap = RiskSnapshot(
            snapshot_date=today,
            composite_score=composite,
            risk_label=label,
            valuation_score=round(cat_scores.get("valuation", 50.0), 1),
            macro_stress_score=round(cat_scores.get("macro_stress", 50.0), 1),
            leverage_credit_score=round(cat_scores.get("leverage_credit", 50.0), 1),
            sentiment_score=round(cat_scores.get("sentiment", 50.0), 1),
            concentration_score=round(cat_scores.get("concentration", 50.0), 1),
            indicator_vector=json.dumps(normalized),
            data_freshness=json.dumps(freshness),
            warnings=json.dumps(warnings),
        )
        self.session.add(snap)
        self.session.commit()

        # Also upsert computed derived indicators for history
        self._store_derived(today, raw, normalized)

        return {
            "composite_score": composite,
            "risk_label": label,
            "risk_verb": verb,
            "snapshot_date": str(today),
            "categories": categories,
            "data_freshness": freshness,
            "warnings": warnings,
            "crisis_similarities": [
                {
                    "crisis_id": s.crisis_id,
                    "display_name": s.display_name,
                    "peak_date": s.peak_date,
                    "peak_score": s.peak_score,
                    "drawdown_pct": s.drawdown_pct,
                    "similarity_score": s.similarity_score,
                    "closest_indicators": s.closest_indicators,
                }
                for s in similarities
            ],
        }

    def _store_derived(self, today: date, raw: dict, normalized: dict) -> None:
        from sqlalchemy.dialects.sqlite import insert as si
        rows = []
        for key, val in {**raw, **{f"norm_{k}": v for k, v in normalized.items()}}.items():
            if val is not None:
                rows.append({"series_id": key, "source": "computed", "date": today, "value": float(val)})
        if rows:
            stmt = si(IndicatorSeries).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=["series_id", "date"],
                set_={"value": stmt.excluded.value},
            )
            try:
                self.session.execute(stmt)
                self.session.commit()
            except Exception as e:
                logger.warning("Failed to store derived indicators: %s", e)
                self.session.rollback()

    def _snapshot_to_dict(self, snap: RiskSnapshot) -> dict:
        from app.scoring.weights import WEIGHT_CONFIG
        _, verb = score_to_label(snap.composite_score)
        categories_raw = [
            {"id": "valuation",       "display_name": "Valuation",         "weight": 0.30, "score": snap.valuation_score or 50.0,       "indicators": []},
            {"id": "macro_stress",    "display_name": "Macro Stress",      "weight": 0.20, "score": snap.macro_stress_score or 50.0,     "indicators": []},
            {"id": "leverage_credit", "display_name": "Leverage & Credit", "weight": 0.20, "score": snap.leverage_credit_score or 50.0,  "indicators": []},
            {"id": "sentiment",       "display_name": "Sentiment",         "weight": 0.15, "score": snap.sentiment_score or 50.0,        "indicators": []},
            {"id": "concentration",   "display_name": "Concentration",     "weight": 0.15, "score": snap.concentration_score or 50.0,    "indicators": []},
        ]
        vec = json.loads(snap.indicator_vector or "{}")
        similarities = compute_similarities(vec)
        return {
            "composite_score": snap.composite_score,
            "risk_label": snap.risk_label,
            "risk_verb": verb,
            "snapshot_date": str(snap.snapshot_date),
            "categories": categories_raw,
            "data_freshness": json.loads(snap.data_freshness or "{}"),
            "warnings": json.loads(snap.warnings or "[]"),
            "crisis_similarities": [
                {
                    "crisis_id": s.crisis_id,
                    "display_name": s.display_name,
                    "peak_date": s.peak_date,
                    "peak_score": s.peak_score,
                    "drawdown_pct": s.drawdown_pct,
                    "similarity_score": s.similarity_score,
                    "closest_indicators": s.closest_indicators,
                }
                for s in similarities
            ],
        }
