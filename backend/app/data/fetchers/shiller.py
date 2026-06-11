import logging
import re
from datetime import datetime

import pandas as pd
import requests

from app.core.cache import FileCache
from app.config import Settings

logger = logging.getLogger(__name__)

CAPE_URL = "https://www.multpl.com/shiller-pe/table/by-month"


class ShillerFetcher:
    def __init__(self, cache: FileCache, settings: Settings):
        self.cache = cache
        self.settings = settings

    def fetch_cape_history(self) -> pd.DataFrame:
        return self._fetch_multpl_table(
            url=CAPE_URL,
            cache_key="multpl:shiller_cape_history",
            valid_range=(5.0, 100.0),
            series_name="shiller_cape",
        )

    def _fetch_multpl_table(
        self,
        url: str,
        cache_key: str,
        valid_range: tuple[float, float],
        series_name: str,
    ) -> pd.DataFrame:
        cached = self.cache.get(cache_key)
        if cached:
            df = pd.DataFrame(cached)
            df["date"] = pd.to_datetime(df["date"]).dt.date
            return df

        try:
            resp = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        except requests.RequestException as e:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("%s fetch failed, serving stale cache: %s", series_name, e)
                df = pd.DataFrame(stale)
                df["date"] = pd.to_datetime(df["date"]).dt.date
                return df
            logger.warning("%s fetch failed: %s", series_name, e)
            return pd.DataFrame({"date": [], "value": []})

        rows = self._parse_table(resp.text, valid_range)
        if rows:
            df = pd.DataFrame(rows)
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), ttl_hours=12)
            logger.info("%s: parsed %d rows", series_name, len(rows))
            return df

        return pd.DataFrame({"date": [], "value": []})

    def _parse_table(self, html: str, valid_range: tuple[float, float]) -> list[dict]:
        # <td[^>]*> tolerates class/attribute variants on multpl.com table cells
        pattern = re.compile(
            r"<td[^>]*>\s*([A-Za-z]+ \d{1,2},\s*\d{4})\s*</td>\s*<td[^>]*>.*?([\d]+\.[\d]+)\s*</td>",
            re.DOTALL | re.IGNORECASE,
        )
        lo, hi = valid_range
        rows = []
        for m in pattern.finditer(html):
            try:
                d = datetime.strptime(m.group(1).strip(), "%b %d, %Y").date()
                v = float(m.group(2).strip())
                if lo < v < hi:
                    rows.append({"date": d, "value": v})
            except (ValueError, AttributeError):
                continue
        if rows:
            df_temp = pd.DataFrame(rows)
            df_temp.sort_values("date", inplace=True)
            rows = df_temp.to_dict(orient="records")
        return rows
