import logging
import os
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy import func

from app.db.models.indicator_series import IndicatorSeries
from app.config import Settings
from app.core.cache import FileCache
from app.data.fetchers.fred import FREDFetcher, FRED_SERIES
from app.data.fetchers.yfinance_fetcher import YFinanceFetcher
from app.data.fetchers.multpl import MultplFetcher
from app.data.fetchers.shiller import ShillerFetcher
from app.data.fetchers.ipo import IPOFetcher

logger = logging.getLogger(__name__)

DERIVED_SERIES = ["yield_curve_spread", "vix_trend", "unemp_trend", "sp500_pe"]


class HistoricalBootstrapper:
    def __init__(self, session: Session, settings: Settings):
        self.session = session
        self.settings = settings
        self.cache = FileCache(settings.cache_dir)
        self.fred = FREDFetcher(self.cache, settings)
        self.yf = YFinanceFetcher(self.cache, settings)
        self.multpl = MultplFetcher(self.cache, settings)
        self.shiller = ShillerFetcher(self.cache, settings)
        self.ipo = IPOFetcher(self.cache, settings)
        self._flag_path = Path(settings.cache_dir) / "bootstrap_done.flag"

    def run_if_needed(self) -> bool:
        if self._flag_path.exists():
            logger.info("Bootstrap already done, skipping")
            return False
        logger.info("Starting historical bootstrap (20yr)...")
        self._run()
        self._flag_path.write_text(str(date.today()))
        logger.info("Bootstrap complete")
        return True

    def force_run(self) -> None:
        if self._flag_path.exists():
            self._flag_path.unlink()
        self._run()
        self._flag_path.write_text(str(date.today()))

    def _run(self) -> None:
        end = date.today()
        start = end - timedelta(days=self.settings.historical_lookback_years * 365)

        logger.info("Fetching FRED series from %s to %s", start, end)
        fred_data: dict[str, pd.DataFrame] = {}
        for name, fred_id in FRED_SERIES.items():
            try:
                df = self.fred.fetch_series(fred_id, start, end)
                fred_data[name] = df
                self._store_series(fred_id, "fred", df)
                logger.info("  Stored %s: %d rows", fred_id, len(df))
            except Exception as e:
                logger.warning("  Failed %s: %s", fred_id, e)
                fred_data[name] = pd.DataFrame({"date": [], "value": []})

        # Compute derived series
        self._compute_yield_curve_spread(fred_data)
        self._compute_vix_trend_history(fred_data.get("VIX", pd.DataFrame()))
        self._compute_unemp_trend_history(fred_data.get("UNEMPLOYMENT", pd.DataFrame()))
        self._load_sp500_pe()
        self._load_shiller_cape()
        self._load_sp500_ps()
        self._compute_cpi_yoy_history(fred_data.get("CPI", pd.DataFrame()))
        self._compute_margin_debt_yoy_history(fred_data.get("MARGIN_DEBT", pd.DataFrame()))
        self._load_ipo_volume()

        logger.info("Fetching yfinance series")
        for name, ticker in [("SP500_YF", "^GSPC"), ("VIX_YF", "^VIX")]:
            try:
                df = self.yf.fetch_series(ticker, start, end)
                self._store_series(f"yf_{ticker}", "yfinance", df)
                logger.info("  Stored %s: %d rows", ticker, len(df))
            except Exception as e:
                logger.warning("  Failed yfinance %s: %s", ticker, e)

        self.session.commit()

    def _store_series(self, series_id: str, source: str, df: pd.DataFrame) -> None:
        if df.empty:
            return
        rows = []
        for _, row in df.iterrows():
            d = row["date"]
            if isinstance(d, str):
                d = pd.to_datetime(d).date()
            elif hasattr(d, "date"):
                d = d.date()
            rows.append({"series_id": series_id, "source": source, "date": d, "value": float(row["value"])})
        stmt = sqlite_insert(IndicatorSeries).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["series_id", "date"],
            set_={"value": stmt.excluded.value}
        )
        self.session.execute(stmt)

    def get_last_stored_date(self, series_id: str) -> date | None:
        result = self.session.query(func.max(IndicatorSeries.date)).filter(
            IndicatorSeries.series_id == series_id
        ).scalar()
        return result

    def _compute_yield_curve_spread(self, fred_data: dict[str, pd.DataFrame]) -> None:
        df10 = fred_data.get("YIELD_10Y", pd.DataFrame())
        df2 = fred_data.get("YIELD_2Y", pd.DataFrame())
        if df10.empty or df2.empty:
            return

        merged = pd.merge(
            df10.rename(columns={"value": "y10"}),
            df2.rename(columns={"value": "y2"}),
            on="date", how="inner"
        )
        merged["value"] = merged["y10"] - merged["y2"]
        spread_df = merged[["date", "value"]]
        self._store_series("yield_curve_spread", "computed", spread_df)
        logger.info("  Computed yield_curve_spread: %d rows", len(spread_df))

    def _compute_vix_trend_history(self, vix_df: pd.DataFrame) -> None:
        if vix_df.empty or len(vix_df) < 31:
            return
        rows = []
        for i in range(30, len(vix_df)):
            current = vix_df.iloc[i]["value"]
            past_30 = vix_df.iloc[i - 30]["value"]
            if past_30 != 0:
                trend = (current - past_30) / past_30 * 100
                rows.append({
                    "date": vix_df.iloc[i]["date"],
                    "value": trend
                })
        if rows:
            trend_df = pd.DataFrame(rows)
            self._store_series("vix_trend", "computed", trend_df)
            logger.info("  Computed vix_trend: %d rows", len(trend_df))

    def _compute_unemp_trend_history(self, unrate_df: pd.DataFrame) -> None:
        if unrate_df.empty or len(unrate_df) < 7:
            return
        rows = []
        for i in range(6, len(unrate_df)):
            current = unrate_df.iloc[i]["value"]
            past_6 = unrate_df.iloc[i - 6]["value"]
            trend = current - past_6
            rows.append({
                "date": unrate_df.iloc[i]["date"],
                "value": trend
            })
        if rows:
            trend_df = pd.DataFrame(rows)
            self._store_series("unemp_trend", "computed", trend_df)
            logger.info("  Computed unemp_trend: %d rows", len(trend_df))

    def _load_sp500_pe(self) -> None:
        df = self.multpl.fetch_pe_history()
        if df.empty:
            logger.warning("  sp500_pe: multpl returned no data")
            return
        rows = [
            {"series_id": "sp500_pe", "source": "multpl", "date": row["date"], "value": row["value"]}
            for _, row in df.iterrows()
        ]
        stmt = sqlite_insert(IndicatorSeries).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["series_id", "date"],
            set_={"value": stmt.excluded.value},
        )
        self.session.execute(stmt)
        self.session.commit()
        logger.info("  Loaded sp500_pe from multpl: %d rows", len(rows))

    def _load_shiller_cape(self) -> None:
        df = self.shiller.fetch_cape_history()
        if df.empty:
            logger.warning("  shiller_cape: no data")
            return
        rows = [
            {"series_id": "shiller_cape", "source": "multpl", "date": row["date"], "value": row["value"]}
            for _, row in df.iterrows()
        ]
        stmt = sqlite_insert(IndicatorSeries).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["series_id", "date"],
            set_={"value": stmt.excluded.value},
        )
        self.session.execute(stmt)
        self.session.commit()
        logger.info("  Loaded shiller_cape: %d rows", len(rows))

    def _load_sp500_ps(self) -> None:
        df = self.multpl.fetch_ps_history()
        if df.empty:
            logger.warning("  sp500_ps: no data")
            return
        rows = [
            {"series_id": "sp500_ps", "source": "multpl", "date": row["date"], "value": row["value"]}
            for _, row in df.iterrows()
        ]
        stmt = sqlite_insert(IndicatorSeries).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["series_id", "date"],
            set_={"value": stmt.excluded.value},
        )
        self.session.execute(stmt)
        self.session.commit()
        logger.info("  Loaded sp500_ps: %d rows", len(rows))

    def _compute_cpi_yoy_history(self, cpi_df: pd.DataFrame) -> None:
        if cpi_df.empty or len(cpi_df) < 13:
            logger.warning("  cpi_yoy: insufficient CPI data (%d rows)", len(cpi_df))
            return
        rows = []
        for i in range(12, len(cpi_df)):
            try:
                latest = float(cpi_df.iloc[i]["value"])
                past = float(cpi_df.iloc[i - 12]["value"])
                if past == 0:
                    continue
                yoy = (latest - past) / past * 100
                rows.append({"series_id": "cpi_yoy", "source": "computed",
                              "date": cpi_df.iloc[i]["date"], "value": round(yoy, 4)})
            except (ValueError, KeyError):
                continue
        if rows:
            stmt = sqlite_insert(IndicatorSeries).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=["series_id", "date"],
                set_={"value": stmt.excluded.value},
            )
            self.session.execute(stmt)
            self.session.commit()
            logger.info("  Computed cpi_yoy: %d rows", len(rows))

    def _compute_margin_debt_yoy_history(self, margin_df: pd.DataFrame) -> None:
        if margin_df.empty or len(margin_df) < 5:
            logger.warning("  margin_debt_yoy: insufficient data (%d rows)", len(margin_df))
            return
        rows = []
        for i in range(4, len(margin_df)):
            try:
                latest = float(margin_df.iloc[i]["value"])
                past = float(margin_df.iloc[i - 4]["value"])
                if past == 0:
                    continue
                yoy = (latest - past) / past * 100
                rows.append({"series_id": "margin_debt_yoy", "source": "computed",
                              "date": margin_df.iloc[i]["date"], "value": round(yoy, 4)})
            except (ValueError, KeyError):
                continue
        if rows:
            stmt = sqlite_insert(IndicatorSeries).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=["series_id", "date"],
                set_={"value": stmt.excluded.value},
            )
            self.session.execute(stmt)
            self.session.commit()
            logger.info("  Computed margin_debt_yoy: %d rows", len(rows))

    def _load_ipo_volume(self) -> None:
        df = self.ipo.fetch_ipo_yoy_history()
        if df.empty:
            logger.warning("  ipo_volume_yoy: no data")
            return
        rows = [
            {"series_id": "ipo_volume_yoy", "source": "ritter", "date": row["date"], "value": row["value"]}
            for _, row in df.iterrows()
        ]
        stmt = sqlite_insert(IndicatorSeries).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["series_id", "date"],
            set_={"value": stmt.excluded.value},
        )
        self.session.execute(stmt)
        self.session.commit()
        logger.info("  Loaded ipo_volume_yoy: %d rows", len(rows))

    def _ensure_derived_series_populated(self) -> None:
        if self._count_series("vix_trend") < 100:
            logger.info("Backfilling vix_trend from VIXCLS...")
            vix_rows = self.session.query(IndicatorSeries).filter(
                IndicatorSeries.series_id == "VIXCLS"
            ).order_by(IndicatorSeries.date).all()
            if len(vix_rows) >= 31:
                df = pd.DataFrame([{"date": r.date, "value": r.value} for r in vix_rows])
                self._compute_vix_trend_history(df)

        if self._count_series("unemp_trend") < 50:
            logger.info("Backfilling unemp_trend from UNRATE...")
            unrate_rows = self.session.query(IndicatorSeries).filter(
                IndicatorSeries.series_id == "UNRATE"
            ).order_by(IndicatorSeries.date).all()
            if len(unrate_rows) >= 7:
                df = pd.DataFrame([{"date": r.date, "value": r.value} for r in unrate_rows])
                self._compute_unemp_trend_history(df)

        if self._count_series("sp500_pe") < 100:
            logger.info("Loading sp500_pe from multpl...")
            self._load_sp500_pe()

        self.session.commit()

    def _count_series(self, series_id: str) -> int:
        return self.session.query(IndicatorSeries).filter(
            IndicatorSeries.series_id == series_id
        ).count()

    def run_incremental_if_stale(self, staleness_days: int = 2) -> bool:
        last_date = self.get_last_stored_date("VIXCLS")
        today = date.today()

        # Derived series need substantial history (not just 1 daily point)
        vix_trend_count = self._count_series("vix_trend")
        unemp_trend_count = self._count_series("unemp_trend")
        has_vix_trend = vix_trend_count >= 100
        has_unemp_trend = unemp_trend_count >= 50

        logger.info("Derived series counts — vix_trend: %d, unemp_trend: %d", vix_trend_count, unemp_trend_count)

        if last_date is None or (today - last_date).days > staleness_days or not (has_vix_trend and has_unemp_trend):
            if last_date is None:
                logger.info("No VIXCLS data found, running full bootstrap")
                self._run()
            elif not (has_vix_trend and has_unemp_trend):
                logger.info("Missing derived series (vix_trend/unemp_trend), backfilling from existing data...")
                self._ensure_derived_series_populated()
            else:
                logger.info("Data is %d days stale, running incremental fetch from %s", (today - last_date).days, last_date)
                start = last_date + timedelta(days=1)
                end = today

                fred_data: dict[str, pd.DataFrame] = {}
                for name, fred_id in FRED_SERIES.items():
                    try:
                        df = self.fred.fetch_series(fred_id, start, end)
                        fred_data[name] = df
                        self._store_series(fred_id, "fred", df)
                        if not df.empty:
                            logger.info("  Incrementally updated %s: %d rows", fred_id, len(df))
                    except Exception as e:
                        logger.warning("  Failed incremental %s: %s", fred_id, e)
                        fred_data[name] = pd.DataFrame({"date": [], "value": []})

                # Recompute derived series
                self._compute_yield_curve_spread(fred_data)
                self._compute_vix_trend_history(fred_data.get("VIX", pd.DataFrame()))
                self._compute_unemp_trend_history(fred_data.get("UNEMPLOYMENT", pd.DataFrame()))
                self._load_sp500_pe()
                self._compute_cpi_yoy_history(fred_data.get("CPI", pd.DataFrame()))
                self._compute_margin_debt_yoy_history(fred_data.get("MARGIN_DEBT", pd.DataFrame()))

                self.session.commit()

        # Always ensure derived series are populated (migration path for upgrades)
        self._ensure_derived_series_populated()

        # Update flag with today's date
        self._flag_path.write_text(str(date.today()))

        return True
