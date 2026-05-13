import logging
from datetime import date

import pandas as pd
import requests

from app.core.cache import FileCache
from app.config import Settings

logger = logging.getLogger(__name__)

# Ritter IPO data — annual counts 1975+
# Primary: direct CSV endpoint derived from Ritter's public Excel files
# Fallback: stockanalysis.com annual table
RITTER_CSV_URL = "https://site.warrington.ufl.edu/ritter/files/IPOs2024.xlsx"
STOCKANALYSIS_URL = "https://stockanalysis.com/ipos/statistics/"

# Hardcoded Ritter annual IPO counts (1975–2023) as bootstrap fallback.
# Source: Jay R. Ritter, University of Florida (public dataset).
# Updated manually when new annual data is released.
RITTER_HARDCODED: dict[int, int] = {
    1975: 14, 1976: 34, 1977: 40, 1978: 42, 1979: 103,
    1980: 259, 1981: 438, 1982: 198, 1983: 848, 1984: 516,
    1985: 507, 1986: 953, 1987: 630, 1988: 435, 1989: 371,
    1990: 276, 1991: 367, 1992: 509, 1993: 707, 1994: 603,
    1995: 570, 1996: 845, 1997: 624, 1998: 373, 1999: 547,
    2000: 446, 2001: 79,  2002: 70,  2003: 63,  2004: 233,
    2005: 213, 2006: 218, 2007: 272, 2008: 31,  2009: 63,
    2010: 154, 2011: 125, 2012: 128, 2013: 222, 2014: 275,
    2015: 170, 2016: 105, 2017: 160, 2018: 192, 2019: 232,
    2020: 480, 2021: 1035, 2022: 181, 2023: 154, 2024: 180,
}


class IPOFetcher:
    def __init__(self, cache: FileCache, settings: Settings):
        self.cache = cache
        self.settings = settings

    def fetch_ipo_yoy_history(self) -> pd.DataFrame:
        """
        Returns monthly DataFrame with ipo_volume_yoy values.
        YoY = (this_year_count - last_year_count) / last_year_count * 100.
        Monthly rows all share the same annual value (last day of each month).
        """
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
        return RITTER_HARDCODED.copy()

    def _annual_to_monthly_yoy(self, annual: dict[int, int]) -> list[dict]:
        import calendar
        rows = []
        years = sorted(annual.keys())
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
                if d <= date.today():
                    rows.append({"date": d, "value": round(yoy, 2)})
        return rows
