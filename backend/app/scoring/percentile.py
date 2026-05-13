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

    def _load_historical(self, series_id: str, years: int, as_of_date: date | None = None) -> np.ndarray:
        reference = as_of_date or date.today()
        cutoff = reference - timedelta(days=years * 365)
        rows = (
            self.session.query(IndicatorSeries.value)
            .filter(
                IndicatorSeries.series_id == series_id,
                IndicatorSeries.date >= cutoff,
                IndicatorSeries.date <= reference,
            )
            .order_by(IndicatorSeries.date)
            .all()
        )
        return np.array([r[0] for r in rows], dtype=float)

    # Synthetic historical baselines for series with insufficient DB history.
    # Values represent typical 20-year range; used only when DB has < 10 points.
    _SYNTHETIC_HISTORY: dict[str, list[float]] = {
        "top10_concentration": [
            15, 16, 16, 17, 17, 17, 18, 18, 18, 19,
            19, 20, 20, 21, 21, 22, 23, 24, 25, 26,
            27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
            37, 38, 39, 40,
        ],
    }

    def normalize(self, series_id: str, current_value: float, invert: bool = False, as_of_date: date | None = None) -> float:
        if as_of_date is not None:
            arr = self._load_historical(series_id, 20, as_of_date)
            if len(arr) < 10:
                logger.warning("No history for %s at %s, returning 50", series_id, as_of_date)
                return 50.0
            pct = float(stats.percentileofscore(arr, current_value, kind="rank"))
            return 100.0 - pct if invert else pct

        arr = self._cache.get(series_id)
        if arr is None or len(arr) < 10:
            arr = self._load_historical(series_id, 20)
            if len(arr) < 10:
                synthetic = self._SYNTHETIC_HISTORY.get(series_id)
                if synthetic:
                    arr = np.array(synthetic, dtype=float)
                    logger.info("Using synthetic history for %s (%d points)", series_id, len(arr))
                else:
                    logger.warning("No history for %s, returning 50", series_id)
                    return 50.0
            self._cache[series_id] = arr

        pct = float(stats.percentileofscore(arr, current_value, kind="rank"))
        return 100.0 - pct if invert else pct
