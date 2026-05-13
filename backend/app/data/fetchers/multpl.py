import logging
import re
from datetime import date, datetime

import pandas as pd
import requests

from app.core.cache import FileCache
from app.config import Settings

logger = logging.getLogger(__name__)

PE_URL = "https://www.multpl.com/s-p-500-pe-ratio/table/by-month"
PS_URL = "https://www.multpl.com/s-p-500-price-to-sales/table/by-month"


class MultplFetcher:
    def __init__(self, cache: FileCache, settings: Settings):
        self.cache = cache
        self.settings = settings

    def fetch_ps_history(self) -> pd.DataFrame:
        cache_key = "multpl:sp500_ps_history"
        cached = self.cache.get(cache_key)
        if cached:
            df = pd.DataFrame(cached)
            df["date"] = pd.to_datetime(df["date"]).dt.date
            return df

        try:
            resp = requests.get(PS_URL, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        except requests.RequestException as e:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("multpl P/S fetch failed, serving stale cache: %s", e)
                return pd.DataFrame(stale)
            logger.warning("multpl P/S fetch failed: %s", e)
            return pd.DataFrame({"date": [], "value": []})

        rows = self._parse_ps(resp.text)
        if rows:
            df = pd.DataFrame(rows)
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), ttl_hours=12)
            return df

        return pd.DataFrame({"date": [], "value": []})

    def _parse_ps(self, html: str) -> list[dict]:
        pattern = re.compile(
            r"<td>\s*([A-Za-z]+ \d{1,2},\s*\d{4})\s*</td>\s*<td>.*?([\d]+\.[\d]+)\s*</td>",
            re.DOTALL | re.IGNORECASE,
        )
        rows = []
        for m in pattern.finditer(html):
            try:
                d = datetime.strptime(m.group(1).strip(), "%b %d, %Y").date()
                v = float(m.group(2).strip())
                if 0.1 < v < 10.0:
                    rows.append({"date": d, "value": v})
            except (ValueError, AttributeError):
                continue
        if rows:
            df_temp = pd.DataFrame(rows)
            df_temp.sort_values("date", inplace=True)
            rows = df_temp.to_dict(orient="records")
        logger.info("multpl: parsed %d sp500_ps rows", len(rows))
        return rows

    def fetch_pe_history(self) -> pd.DataFrame:
        cache_key = "multpl:sp500_pe_history"
        cached = self.cache.get(cache_key)
        if cached:
            df = pd.DataFrame(cached)
            df["date"] = pd.to_datetime(df["date"]).dt.date
            return df

        try:
            resp = requests.get(PE_URL, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        except requests.RequestException as e:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("multpl fetch failed, serving stale cache: %s", e)
                return pd.DataFrame(stale)
            logger.warning("multpl fetch failed: %s", e)
            return pd.DataFrame({"date": [], "value": []})

        rows = self._parse(resp.text)
        if rows:
            df = pd.DataFrame(rows)
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            # Cache for 12 hours — monthly data changes rarely
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), ttl_hours=12)
            return df

        return pd.DataFrame({"date": [], "value": []})

    def _parse(self, html: str) -> list[dict]:
        # HTML structure (multiline):
        # <td>May 11, 2026</td>
        # <td>\n  <abbr ...>†</abbr>\n  31.91\n</td>
        pattern = re.compile(
            r"<td>\s*([A-Za-z]+ \d{1,2},\s*\d{4})\s*</td>\s*<td>.*?([\d]+\.[\d]+)\s*</td>",
            re.DOTALL | re.IGNORECASE,
        )
        rows = []
        for m in pattern.finditer(html):
            try:
                d = datetime.strptime(m.group(1).strip(), "%b %d, %Y").date()
                v = float(m.group(2).strip())
                if 5 < v < 200:
                    rows.append({"date": d, "value": v})
            except (ValueError, AttributeError):
                continue
        if rows:
            df_temp = pd.DataFrame(rows)
            df_temp.sort_values("date", inplace=True)
            df_temp.reset_index(drop=True, inplace=True)
            rows = df_temp.to_dict(orient="records")
        logger.info("multpl: parsed %d sp500_pe rows", len(rows))
        return rows
