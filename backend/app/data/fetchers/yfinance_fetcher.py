import logging
from datetime import date

import pandas as pd
import yfinance as yf

from app.data.fetchers.base import BaseFetcher
from app.core.exceptions import DataFetchError

logger = logging.getLogger(__name__)

TICKERS = {
    "SP500": "^GSPC",
    "VIX":   "^VIX",
    "SPY":   "SPY",
    "QQQ":   "QQQ",
}


class YFinanceFetcher(BaseFetcher):
    def fetch_series(self, ticker: str, start_date: date, end_date: date) -> pd.DataFrame:
        cache_key = self._make_cache_key("yfinance", ticker, str(start_date), str(end_date))
        cached = self.cache.get(cache_key)
        if cached:
            return pd.DataFrame(cached)

        try:
            raw = yf.download(ticker, start=str(start_date), end=str(end_date),
                              auto_adjust=True, progress=False)
        except Exception as e:
            stale = self.cache.get_stale(cache_key)
            if stale:
                logger.warning("yfinance failed for %s, serving stale: %s", ticker, e)
                return pd.DataFrame(stale)
            raise DataFetchError(f"yfinance download failed for {ticker}: {e}") from e

        if raw is None or raw.empty:
            return pd.DataFrame({"date": [], "value": []})

        raw = raw.reset_index()

        # yfinance >=0.2.x may return MultiLevel columns: ("Close", ticker)
        if isinstance(raw.columns, pd.MultiIndex):
            raw.columns = raw.columns.get_level_values(0)

        close_col = "Close" if "Close" in raw.columns else raw.columns[-1]
        date_col  = "Date"  if "Date"  in raw.columns else raw.columns[0]

        df = pd.DataFrame({
            "date": pd.to_datetime(raw[date_col]).dt.date,
            "value": pd.to_numeric(raw[close_col], errors="coerce"),
        })
        df.dropna(inplace=True)
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)

        if not df.empty:
            cacheable = df.copy()
            cacheable["date"] = cacheable["date"].astype(str)
            self.cache.set(cache_key, cacheable.to_dict(orient="list"), self.settings.yfinance_cache_ttl_hours)
        return df

    def fetch_pe_ratio(self) -> float | None:
        try:
            info = yf.Ticker("^GSPC").fast_info
            pe = getattr(info, "pe_ratio", None)
            if pe and 5 < pe < 200:
                return float(pe)
        except Exception as e:
            logger.warning("Could not fetch PE ratio: %s", e)
        return None

    def fetch_top_holdings_concentration(self, etf: str = "SPY") -> float | None:
        cache_key = self._make_cache_key("yfinance_holdings", etf)
        cached = self.cache.get(cache_key)
        if cached and "concentration" in cached:
            return cached["concentration"]
        try:
            ticker = yf.Ticker(etf)
            data = ticker.funds_data
            if data and hasattr(data, "top_holdings"):
                holdings = data.top_holdings
                if not holdings.empty:
                    top10 = holdings.head(10)["Holding Percent"].sum() * 100
                    self.cache.set(cache_key, {"concentration": float(top10)},
                                   self.settings.yfinance_cache_ttl_hours * 24)
                    return float(top10)
        except Exception as e:
            logger.warning("Could not fetch SPY top holdings: %s", e)
        return None
