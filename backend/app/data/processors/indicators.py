import logging
from datetime import date

import pandas as pd

logger = logging.getLogger(__name__)


def _latest(df: pd.DataFrame) -> float | None:
    if df is None or df.empty:
        return None
    try:
        return float(df.iloc[-1]["value"])
    except (KeyError, IndexError, ValueError):
        return None


def _value_n_days_ago(df: pd.DataFrame, n: int) -> float | None:
    if df is None or len(df) <= n:
        return None
    try:
        return float(df.iloc[-(n + 1)]["value"])
    except (IndexError, ValueError):
        return None


# DDDM01USA156NWDB is an annual World Bank series published with a multi-year
# lag, so a wide staleness window is expected. A price-index/GDP proxy is NOT a
# valid fallback: it is dimensionally different from market-cap/GDP and breaks
# percentile normalization against the DDDM history.
def compute_buffett_indicator(
    buffett_df: pd.DataFrame | None,
    max_stale_days: int = 1100,
) -> tuple[float | None, str]:
    v = _latest(buffett_df)
    if v is not None and not buffett_df.empty:
        last_date = buffett_df.iloc[-1]["date"]
        if isinstance(last_date, str):
            last_date = pd.to_datetime(last_date).date()
        elif hasattr(last_date, "date"):
            last_date = last_date.date()
        if (date.today() - last_date).days <= max_stale_days:
            return v, "DDDM01USA156NWDB"
    return None, "unavailable"


def compute_yield_curve_spread(
    yield_10y_df: pd.DataFrame,
    yield_2y_df: pd.DataFrame,
) -> float | None:
    v10 = _latest(yield_10y_df)
    v2 = _latest(yield_2y_df)
    if v10 is None or v2 is None:
        return None
    return v10 - v2


def compute_vix_level(vix_df: pd.DataFrame) -> float | None:
    return _latest(vix_df)


def compute_vix_trend(vix_df: pd.DataFrame, lookback_days: int = 30) -> float | None:
    current = _latest(vix_df)
    past = _value_n_days_ago(vix_df, lookback_days)
    if current is None or past is None or past == 0:
        return None
    return (current - past) / past * 100


def compute_unemployment_trend(unemp_df: pd.DataFrame, lookback_months: int = 6) -> float | None:
    current = _latest(unemp_df)
    if current is None or unemp_df is None or unemp_df.empty:
        return None
    # UNRATE is monthly — need at least lookback_months+1 rows
    if len(unemp_df) >= lookback_months + 1:
        past = float(unemp_df.iloc[-(lookback_months + 1)]["value"])
        return current - past
    return None


def compute_sp500_pe(pe: float | None) -> float | None:
    if pe is not None and 5 < pe < 200:
        return pe
    return None


def compute_hy_spread(hy_df: pd.DataFrame) -> float | None:
    return _latest(hy_df)


def compute_fed_funds_level(ff_df: pd.DataFrame) -> float | None:
    return _latest(ff_df)


def compute_concentration(top10_pct: float | None) -> float | None:
    if top10_pct is not None and 0 < top10_pct <= 100:
        return top10_pct
    return None


def compute_shiller_cape(df: pd.DataFrame) -> float | None:
    v = _latest(df)
    if v is not None and 5.0 < v < 100.0:
        return v
    return None


def compute_sp500_ps(df: pd.DataFrame) -> float | None:
    v = _latest(df)
    if v is not None and 0.1 < v < 10.0:
        return v
    return None


def compute_cpi_yoy(df: pd.DataFrame) -> float | None:
    # df contains pre-computed cpi_yoy values — just take the latest
    return _latest(df)


def compute_margin_debt_yoy(df: pd.DataFrame) -> float | None:
    # df contains pre-computed margin_debt_yoy values — just take the latest
    return _latest(df)


def compute_ipo_volume_yoy(df: pd.DataFrame) -> float | None:
    return _latest(df)


def get_data_date(df: pd.DataFrame) -> date | None:
    if df is None or df.empty:
        return None
    try:
        return df.iloc[-1]["date"]
    except (KeyError, IndexError):
        return None
