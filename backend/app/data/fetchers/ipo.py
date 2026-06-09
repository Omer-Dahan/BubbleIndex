import calendar
import logging
import re
from datetime import date

import pandas as pd
import requests

from app.core.cache import FileCache
from app.config import Settings

logger = logging.getLogger(__name__)

STOCKANALYSIS_URL = "https://stockanalysis.com/ipos/statistics/"

# Ritter annual IPO counts (1975–2025).
# Sources: Jay R. Ritter, University of Florida (public dataset).
# 2025 value is estimated (~160) pending Ritter's official annual release.
RITTER_HARDCODED: dict[int, int] = {
    1975: 14,  1976: 34,  1977: 40,  1978: 42,  1979: 103,
    1980: 259, 1981: 438, 1982: 198, 1983: 848, 1984: 516,
    1985: 507, 1986: 953, 1987: 630, 1988: 435, 1989: 371,
    1990: 276, 1991: 367, 1992: 509, 1993: 707, 1994: 603,
    1995: 570, 1996: 845, 1997: 624, 1998: 373, 1999: 547,
    2000: 446, 2001: 79,  2002: 70,  2003: 63,  2004: 233,
    2005: 213, 2006: 218, 2007: 272, 2008: 31,  2009: 63,
    2010: 154, 2011: 125, 2012: 128, 2013: 222, 2014: 275,
    2015: 170, 2016: 105, 2017: 160, 2018: 192, 2019: 232,
    2020: 480, 2021: 1035, 2022: 181, 2023: 154, 2024: 180,
    2025: 160,  # estimated — replace with Ritter official figure when available
}


class IPOFetcher:
    def __init__(self, cache: FileCache, settings: Settings):
        self.cache = cache
        self.settings = settings

    def fetch_ipo_yoy_history(self) -> pd.DataFrame:
        cache_key = "ipo:volume_yoy_history"
        cached = self.cache.get(cache_key)
        if cached:
            df = pd.DataFrame(cached)
            df["date"] = pd.to_datetime(df["date"]).dt.date
            return df

        annual = self._get_annual_counts()
        rows = self._annual_to_monthly_yoy(annual)

        if rows:
            df = pd.DataFrame(rows)
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), ttl_hours=24 * 7)
            logger.info("ipo_volume_yoy: %d monthly rows built", len(rows))
            return df

        return pd.DataFrame({"date": [], "value": []})

    def _get_annual_counts(self) -> dict[int, int]:
        base = RITTER_HARDCODED.copy()
        live = self._fetch_from_stockanalysis()
        if live:
            # Live data takes precedence for years it covers
            base.update(live)
            logger.info("ipo: merged live data for years: %s", sorted(live.keys()))
        return base

    def _fetch_from_stockanalysis(self) -> dict[int, int]:
        try:
            resp = requests.get(
                STOCKANALYSIS_URL,
                timeout=20,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.warning("stockanalysis.com IPO fetch failed: %s", e)
            return {}

        # Table rows: <td>2025</td><td>NNN</td> (various formats)
        pattern = re.compile(
            r"<td[^>]*>\s*(\d{4})\s*</td>\s*<td[^>]*>\s*([\d,]+)\s*</td>",
            re.IGNORECASE,
        )
        results: dict[int, int] = {}
        current_year = date.today().year
        for m in pattern.finditer(resp.text):
            try:
                year = int(m.group(1))
                count = int(m.group(2).replace(",", ""))
                if 1975 <= year <= current_year and count > 0:
                    results[year] = count
            except ValueError:
                continue

        if results:
            logger.info("stockanalysis.com: parsed IPO counts for %d years", len(results))
        else:
            logger.warning("stockanalysis.com: no IPO counts parsed (HTML may have changed)")
        return results

    def _annual_to_monthly_yoy(self, annual: dict[int, int]) -> list[dict]:
        rows = []
        years = sorted(annual.keys())
        today = date.today()
        for i, year in enumerate(years):
            if i == 0:
                continue
            prev_year = years[i - 1]
            prev_count = annual[prev_year]
            if prev_count == 0:
                continue
            yoy = (annual[year] - prev_count) / prev_count * 100
            for month in range(1, 13):
                last_day = calendar.monthrange(year, month)[1]
                d = date(year, month, last_day)
                if d <= today:
                    rows.append({"date": d, "value": round(yoy, 2)})
        return rows
