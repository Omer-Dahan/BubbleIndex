import logging
from datetime import date, timedelta

import numpy as np
from scipy import stats
from sqlalchemy.orm import Session

from app.db.models.indicator_series import IndicatorSeries

logger = logging.getLogger(__name__)


class PercentileNormalizer:
    def __init__(self, session: Session):
        self.session = session
        self._cache: dict[str, np.ndarray] = {}

    def warm_cache(self, indicator_names: list[str], years: int = 20) -> None:
        for name in indicator_names:
            arr = self._load_historical(name, years)
            if len(arr) > 10:
                self._cache[name] = arr
                logger.info("Warmed cache for %s: %d points", name, len(arr))
            else:
                logger.warning("Insufficient history for %s: %d points", name, len(arr))

    def _load_historical(self, series_id: str, years: int) -> np.ndarray:
        cutoff = date.today() - timedelta(days=years * 365)
        rows = (
            self.session.query(IndicatorSeries.value)
            .filter(
                IndicatorSeries.series_id == series_id,
                IndicatorSeries.date >= cutoff,
            )
            .order_by(IndicatorSeries.date)
            .all()
        )
        return np.array([r[0] for r in rows], dtype=float)

    def normalize(self, series_id: str, current_value: float, invert: bool = False) -> float:
        arr = self._cache.get(series_id)
        if arr is None or len(arr) < 10:
            arr = self._load_historical(series_id, 20)
            if len(arr) < 10:
                logger.warning("No history for %s, returning 50", series_id)
                return 50.0
            self._cache[series_id] = arr

        pct = float(stats.percentileofscore(arr, current_value, kind="rank"))
        return 100.0 - pct if invert else pct
