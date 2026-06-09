import calendar
import logging
import re
from datetime import date, datetime

import pandas as pd
import requests

from app.core.cache import FileCache
from app.config import Settings

logger = logging.getLogger(__name__)

PE_URL   = "https://www.multpl.com/s-p-500-pe-ratio/table/by-month"
PS_URL   = "https://www.multpl.com/s-p-500-price-to-sales/table/by-month"
PS_YEAR_URL = "https://www.multpl.com/s-p-500-price-to-sales/table/by-year"


class MultplFetcher:
    def __init__(self, cache: FileCache, settings: Settings):
        self.cache = cache
        self.settings = settings

    # ------------------------------------------------------------------ P/S --

    def fetch_ps_history(self) -> pd.DataFrame:
        cache_key = "multpl:sp500_ps_history"
        cached = self.cache.get(cache_key)
        if cached:
            df = pd.DataFrame(cached)
            df["date"] = pd.to_datetime(df["date"]).dt.date
            return df

        # multpl.com P/S data is annual snapshots (one value per year + current YTD).
        # Spread each snapshot across all months of that year so any lookback window hits data.
        df_annual = self._fetch_url(PS_URL, valid_lo=0.1, valid_hi=10.0, label="sp500_ps")
        if df_annual.empty:
            df_annual = self._fetch_url(PS_YEAR_URL, valid_lo=0.1, valid_hi=10.0, label="sp500_ps/year")
        if df_annual.empty:
            return pd.DataFrame({"date": [], "value": []})

        df = self._spread_annual_to_monthly(df_annual)

        if not df.empty:
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), ttl_hours=12)
            logger.info("sp500_ps: %d monthly rows (spread from %d annual snapshots)", len(df), len(df_annual))
            return df

        return pd.DataFrame({"date": [], "value": []})

    def _spread_annual_to_monthly(self, df_year: pd.DataFrame) -> pd.DataFrame:
        rows = []
        today = date.today()
        for _, row in df_year.iterrows():
            year = row["date"].year
            for month in range(1, 13):
                last_day = calendar.monthrange(year, month)[1]
                d = date(year, month, last_day)
                if d <= today:
                    rows.append({"date": d, "value": row["value"]})
        if not rows:
            return pd.DataFrame({"date": [], "value": []})
        result = pd.DataFrame(rows)
        result.sort_values("date", inplace=True)
        result.reset_index(drop=True, inplace=True)
        return result

    # ------------------------------------------------------------------ P/E --

    def fetch_pe_history(self) -> pd.DataFrame:
        cache_key = "multpl:sp500_pe_history"
        cached = self.cache.get(cache_key)
        if cached:
            df = pd.DataFrame(cached)
            df["date"] = pd.to_datetime(df["date"]).dt.date
            return df

        df = self._fetch_url(PE_URL, valid_lo=5.0, valid_hi=200.0, label="sp500_pe")
        if not df.empty:
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), ttl_hours=12)
        return df

    # ----------------------------------------------------------- shared fetch --

    def _fetch_url(self, url: str, valid_lo: float, valid_hi: float, label: str) -> pd.DataFrame:
        try:
            resp = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.warning("multpl %s fetch failed: %s", label, e)
            return pd.DataFrame({"date": [], "value": []})

        rows = self._parse(resp.text, valid_lo, valid_hi)
        logger.info("multpl %s: parsed %d rows", label, len(rows))
        if not rows:
            return pd.DataFrame({"date": [], "value": []})
        df = pd.DataFrame(rows)
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df

    def _parse(self, html: str, valid_lo: float, valid_hi: float) -> list[dict]:
        # Use <td[^>]*> to handle any class/attribute variants on multpl.com table cells
        # Primary pattern: "Month DD, YYYY"
        pat_full = re.compile(
            r"<td[^>]*>\s*([A-Za-z]+ \d{1,2},\s*\d{4})\s*</td>\s*<td[^>]*>.*?([\d]+(?:\.[\d]+)?)\s*</td>",
            re.DOTALL | re.IGNORECASE,
        )
        # Fallback pattern: by-year pages may show just "YYYY" as the date cell
        pat_year = re.compile(
            r"<td[^>]*>\s*(\d{4})\s*</td>\s*<td[^>]*>.*?([\d]+(?:\.[\d]+)?)\s*</td>",
            re.DOTALL | re.IGNORECASE,
        )

        rows: list[dict] = []
        seen: set[date] = set()

        for pat, fmt in [(pat_full, "full"), (pat_year, "year")]:
            for m in pat.finditer(html):
                try:
                    raw_date = m.group(1).strip()
                    if fmt == "year":
                        d = date(int(raw_date), 1, 1)
                    else:
                        d = datetime.strptime(raw_date, "%b %d, %Y").date()
                    if d in seen:
                        continue
                    v = float(m.group(2).strip())
                    if valid_lo < v < valid_hi:
                        rows.append({"date": d, "value": v})
                        seen.add(d)
                except (ValueError, AttributeError):
                    continue

        rows.sort(key=lambda r: r["date"])
        return rows
