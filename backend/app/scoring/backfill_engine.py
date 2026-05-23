import json
import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.db.models.risk_snapshot import RiskSnapshot
from app.db.models.indicator_series import IndicatorSeries
from app.scoring.percentile import PercentileNormalizer
from app.scoring.weights import WEIGHT_CONFIG, score_to_label

logger = logging.getLogger(__name__)

# Series that are unavailable before a given date — imputed as 50.0
SERIES_START_DATES: dict[str, date] = {
    "BAMLH0A0HYM2":    date(2003, 1, 1),
    "margin_debt_yoy": date(1946, 1, 1),
    "ipo_volume_yoy":  date(1976, 1, 1),
}

INDICATOR_SERIES_MAP: dict[str, tuple[str, int]] = {
    # indicator_key: (series_id_in_db, lookback_days)
    "buffett_indicator":   ("DDDM01USA156NWDB",   600),
    "shiller_cape":        ("shiller_cape",         60),
    "sp500_pe":            ("sp500_pe",             60),
    "sp500_ps":            ("sp500_ps",             60),
    "yield_curve_spread":  ("yield_curve_spread",   90),
    "fed_funds_level":     ("FEDFUNDS",             60),
    "unemployment_trend":  ("unemp_trend",          60),
    "cpi_yoy":             ("cpi_yoy",              60),
    "vix_level":           ("VIXCLS",               30),
    "hy_spread":           ("BAMLH0A0HYM2",         30),
    "margin_debt_yoy":     ("margin_debt_yoy",     400),
    "vix_trend":           ("vix_trend",            30),
    "ipo_volume_yoy":      ("ipo_volume_yoy",      400),
    "top10_concentration": ("top10_concentration",  30),
}

INVERT_MAP: dict[str, bool] = {
    ind_id: cfg["invert"]
    for cat in WEIGHT_CONFIG.values()
    for ind_id, cfg in cat["indicators"].items()
}


class HistoricalBackfillEngine:
    def __init__(self, session: Session):
        self.session = session
        self.normalizer = PercentileNormalizer(session)

    def compute_snapshot(self, reference_date: date, force: bool = False) -> dict | None:
        existing = (
            self.session.query(RiskSnapshot)
            .filter(RiskSnapshot.snapshot_date == reference_date)
            .first()
        )
        if existing:
            if not force:
                return None
            # Delete and recompute when forced
            self.session.delete(existing)
            self.session.commit()

        warnings: list[str] = []
        raw = self._compute_raw_indicators(reference_date, warnings)
        normalized = self._normalize_indicators(raw, reference_date, warnings)
        cat_scores = self._compute_category_scores(normalized)
        composite = round(
            sum(cat_scores[cat_id] * cat["weight"] for cat_id, cat in WEIGHT_CONFIG.items()), 1
        )
        label, _ = score_to_label(composite)

        self._save_snapshot(reference_date, composite, label, cat_scores, normalized, warnings)

        return {
            "snapshot_date": str(reference_date),
            "composite_score": composite,
            "risk_label": label,
            "cat_scores": cat_scores,
            "warnings": warnings,
        }

    def _extract_value_as_of(self, series_id: str, as_of_date: date, lookback_days: int) -> float | None:
        cutoff = as_of_date - timedelta(days=lookback_days)
        row = (
            self.session.query(IndicatorSeries.value)
            .filter(
                IndicatorSeries.series_id == series_id,
                IndicatorSeries.date >= cutoff,
                IndicatorSeries.date <= as_of_date,
            )
            .order_by(IndicatorSeries.date.desc())
            .first()
        )
        return float(row[0]) if row else None

    def _compute_raw_indicators(self, as_of_date: date, warnings: list[str]) -> dict[str, float | None]:
        raw: dict[str, float | None] = {}
        for ind_id, (series_id, lookback) in INDICATOR_SERIES_MAP.items():
            start_date = SERIES_START_DATES.get(series_id)
            if start_date and as_of_date < start_date:
                raw[ind_id] = None
                warnings.append(f"{ind_id}: not available before {start_date}, imputed 50")
                continue
            raw[ind_id] = self._extract_value_as_of(series_id, as_of_date, lookback)
        return raw

    def _normalize_indicators(
        self,
        raw: dict[str, float | None],
        as_of_date: date,
        warnings: list[str],
    ) -> dict[str, float]:
        normalized: dict[str, float] = {}
        for ind_id, val in raw.items():
            if val is None:
                warnings.append(f"{ind_id}: unavailable, using neutral (50)")
                normalized[ind_id] = 50.0
                continue
            series_id = INDICATOR_SERIES_MAP[ind_id][0]
            invert = INVERT_MAP.get(ind_id, False)
            normalized[ind_id] = self.normalizer.normalize(
                series_id, val, invert=invert, as_of_date=as_of_date
            )
        return normalized

    def _compute_category_scores(self, normalized: dict[str, float]) -> dict[str, float]:
        cat_scores: dict[str, float] = {}
        for cat_id, cat in WEIGHT_CONFIG.items():
            ind_weights = cat["indicators"]
            total_w = sum(v["weight"] for v in ind_weights.values())
            cat_score = sum(
                normalized.get(ind_id, 50.0) * cfg["weight"]
                for ind_id, cfg in ind_weights.items()
            )
            cat_scores[cat_id] = cat_score / total_w if total_w > 0 else 50.0
        return cat_scores

    def _save_snapshot(
        self,
        ref_date: date,
        composite: float,
        label: str,
        cat_scores: dict[str, float],
        normalized: dict[str, float],
        warnings: list[str],
    ) -> None:
        snap = RiskSnapshot(
            snapshot_date=ref_date,
            composite_score=composite,
            risk_label=label,
            valuation_score=round(cat_scores.get("valuation", 50.0), 1),
            macro_stress_score=round(cat_scores.get("macro_stress", 50.0), 1),
            leverage_credit_score=round(cat_scores.get("leverage_credit", 50.0), 1),
            sentiment_score=round(cat_scores.get("sentiment", 50.0), 1),
            concentration_score=round(cat_scores.get("concentration", 50.0), 1),
            indicator_vector=json.dumps(normalized),
            data_freshness=json.dumps({}),
            warnings=json.dumps(warnings),
        )
        try:
            self.session.add(snap)
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            logger.warning("Failed to save snapshot for %s: %s", ref_date, e)
