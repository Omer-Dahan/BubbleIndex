import logging

from app.data.fetchers.base import BaseFetcher
from app.core.exceptions import DataFetchError
from datetime import date
import pandas as pd

logger = logging.getLogger(__name__)

BASE_URL = "https://finnhub.io/api/v1"


class FinnhubFetcher(BaseFetcher):
    def fetch_series(self, series_id: str, start_date: date, end_date: date) -> pd.DataFrame:
        return pd.DataFrame({"date": [], "value": []})

    def fetch_pe_ratio(self, symbol: str = "SPY") -> float | None:
        if not self.settings.finnhub_api_key:
            return None
        cache_key = self._make_cache_key("finnhub", "pe", symbol)
        cached = self.cache.get(cache_key)
        if cached and "pe" in cached:
            return cached["pe"]
        try:
            url = f"{BASE_URL}/stock/metric"
            params = {"symbol": symbol, "metric": "all", "token": self.settings.finnhub_api_key}
            raw = self._fetch_with_retry(url, params)
            pe = raw.get("metric", {}).get("peBasicExclExtraTTM")
            if pe and 5 < float(pe) < 200:
                self.cache.set(cache_key, {"pe": float(pe)}, self.settings.finnhub_cache_ttl_hours)
                return float(pe)
        except Exception as e:
            logger.warning("Finnhub PE fetch failed: %s", e)
        return None
