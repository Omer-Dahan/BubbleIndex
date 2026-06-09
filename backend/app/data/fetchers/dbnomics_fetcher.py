import logging
from datetime import date

import pandas as pd

from app.data.fetchers.base import BaseFetcher
from app.core.exceptions import DataFetchError

logger = logging.getLogger(__name__)

BASE_URL = "https://api.db.nomics.world/v22/series"

# DBnomics series paths for discontinued FRED series
DBNOMICS_SERIES = {
    "MARGIN_DEBT": "FED/Z1/FL663067003.Q",
}


class DBnomicsFetcher(BaseFetcher):
    def fetch_series(self, series_path: str, start_date: date, end_date: date) -> pd.DataFrame:
        cache_key = self._make_cache_key("dbnomics", series_path, str(start_date), str(end_date))
        cached = self.cache.get(cache_key)
        if cached:
            return pd.DataFrame(cached)

        url = f"{BASE_URL}/{series_path}"
        try:
            raw = self._fetch_with_retry(url, params={"observations": 1})
        except DataFetchError:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("DBnomics fetch failed for %s, serving stale cache", series_path)
                return pd.DataFrame(stale)
            raise

        df = self._parse_observations(raw, start_date, end_date)

        if not df.empty:
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), self.settings.fred_cache_ttl_hours)

        return df

    def _parse_observations(self, raw: dict, start_date: date, end_date: date) -> pd.DataFrame:
        try:
            docs = raw["series"]["docs"]
            if not docs:
                return pd.DataFrame({"date": [], "value": []})
            doc = docs[0]
            periods = doc.get("period_start_day", [])
            values = doc.get("value", [])
        except (KeyError, IndexError, TypeError):
            logger.warning("DBnomics: unexpected response structure")
            return pd.DataFrame({"date": [], "value": []})

        rows = []
        for p, v in zip(periods, values):
            if v is None:
                continue
            try:
                d = pd.to_datetime(p).date()
                if d < start_date or d > end_date:
                    continue
                rows.append({"date": d, "value": float(v)})
            except (ValueError, TypeError):
                continue

        if not rows:
            return pd.DataFrame({"date": [], "value": []})

        df = pd.DataFrame(rows)
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df
