import logging
from datetime import date

import pandas as pd

from app.data.fetchers.base import BaseFetcher
from app.core.exceptions import DataFetchError

logger = logging.getLogger(__name__)

FRED_SERIES = {
    "SP500":             "SP500",
    "VIX":               "VIXCLS",
    "YIELD_2Y":          "DGS2",
    "YIELD_10Y":         "DGS10",
    # WILL5000IND / WILL5000PR removed — both return 400 from FRED. Scoring engine uses SP500 as proxy.
    "GDP":               "GDP",
    "BUFFETT_INDICATOR": "DDDM01USA156NWDB",
    "UNEMPLOYMENT":      "UNRATE",
    "FED_FUNDS":         "FEDFUNDS",
    "HY_SPREAD":         "BAMLH0A0HYM2",
    "CPI":               "CPIAUCSL",
    # BOGZ1FL663067003Q removed — returns 502 from FRED (series discontinued ca. 2020).
    # Existing margin_debt_yoy derived points in DB are preserved for percentile history.
}

# Series that are quarterly/annual — cannot request daily frequency
LOW_FREQUENCY_SERIES = {
    "GDP", "DDDM01USA156NWDB", "UNRATE", "FEDFUNDS", "SP500PE",
    "CPIAUCSL",
}

# max staleness in days per series
STALENESS_DAYS = {
    "VIXCLS": 5, "DGS2": 5, "DGS10": 5, "FEDFUNDS": 40, "UNRATE": 40,
    "GDP": 100, "DDDM01USA156NWDB": 400, "BAMLH0A0HYM2": 5,
    "SP500": 5, "WILL5000IND": 5, "SP500PE": 40,
    "CPIAUCSL": 40,
}

BASE_URL = "https://api.stlouisfed.org/fred/series/observations"


class FREDFetcher(BaseFetcher):
    def fetch_series(self, series_id: str, start_date: date, end_date: date) -> pd.DataFrame:
        cache_key = self._make_cache_key("fred", series_id, str(start_date), str(end_date))
        cached = self.cache.get(cache_key)
        if cached:
            return pd.DataFrame(cached)

        if not self.settings.fred_api_key:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("No FRED API key, serving stale cache for %s", series_id)
                return pd.DataFrame(stale)
            raise DataFetchError("FRED_API_KEY not configured")

        params: dict = {
            "series_id": series_id,
            "observation_start": str(start_date),
            "observation_end": str(end_date),
            "api_key": self.settings.fred_api_key,
            "file_type": "json",
        }
        # Only request daily aggregation for daily series
        if series_id not in LOW_FREQUENCY_SERIES:
            params["frequency"] = "d"
            params["aggregation_method"] = "last"

        try:
            raw = self._fetch_with_retry(BASE_URL, params)
        except DataFetchError:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("FRED fetch failed, serving stale cache for %s", series_id)
                return pd.DataFrame(stale)
            raise

        df = self._parse_observations(raw)
        if not df.empty:
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), self.settings.fred_cache_ttl_hours)
        return df

    def fetch_all_required(self, start_date: date, end_date: date) -> dict[str, pd.DataFrame]:
        results = {}
        for name, fred_id in FRED_SERIES.items():
            try:
                results[name] = self.fetch_series(fred_id, start_date, end_date)
            except Exception as e:
                logger.warning("Could not fetch %s (%s): %s", name, fred_id, e)
                results[name] = pd.DataFrame({"date": [], "value": []})
        return results

    def _parse_observations(self, raw: dict) -> pd.DataFrame:
        obs = raw.get("observations", [])
        rows = []
        for o in obs:
            if o.get("value") == ".":
                continue
            try:
                rows.append({"date": pd.to_datetime(o["date"]).date(), "value": float(o["value"])})
            except (ValueError, KeyError):
                continue
        if not rows:
            return pd.DataFrame({"date": [], "value": []})
        df = pd.DataFrame(rows)
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df
