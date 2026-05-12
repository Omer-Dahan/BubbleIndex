import logging
import os
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.db.models.indicator_series import IndicatorSeries
from app.config import Settings
from app.core.cache import FileCache
from app.data.fetchers.fred import FREDFetcher, FRED_SERIES
from app.data.fetchers.yfinance_fetcher import YFinanceFetcher

logger = logging.getLogger(__name__)

DERIVED_SERIES = ["yield_curve_spread"]


class HistoricalBootstrapper:
    def __init__(self, session: Session, settings: Settings):
        self.session = session
        self.settings = settings
        self.cache = FileCache(settings.cache_dir)
        self.fred = FREDFetcher(self.cache, settings)
        self.yf = YFinanceFetcher(self.cache, settings)
        self._flag_path = Path(settings.cache_dir) / "bootstrap_done.flag"

    def run_if_needed(self) -> bool:
        if self._flag_path.exists():
            logger.info("Bootstrap already done, skipping")
            return False
        logger.info("Starting historical bootstrap (20yr)...")
        self._run()
        self._flag_path.write_text("done")
        logger.info("Bootstrap complete")
        return True

    def force_run(self) -> None:
        if self._flag_path.exists():
            self._flag_path.unlink()
        self._run()
        self._flag_path.write_text("done")

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

        # Compute derived: yield_curve_spread = DGS10 - DGS2
        self._compute_yield_curve_spread(fred_data)

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
