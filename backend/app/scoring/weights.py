from typing import NamedTuple


WEIGHT_CONFIG = {
    "valuation": {
        "weight": 0.30,
        "display_name": "Valuation",
        "indicators": {
            "buffett_indicator": {"weight": 0.30, "invert": False, "display_name": "Buffett Indicator",   "unit": "%"},
            "shiller_cape":      {"weight": 0.25, "invert": False, "display_name": "Shiller CAPE",        "unit": "×"},
            "sp500_pe":          {"weight": 0.20, "invert": False, "display_name": "S&P 500 P/E Ratio",   "unit": "×"},
            "sp500_ps":          {"weight": 0.25, "invert": False, "display_name": "S&P 500 Price/Sales", "unit": "×"},
        },
    },
    "macro_stress": {
        "weight": 0.25,
        "display_name": "Macro Stress",
        "indicators": {
            "yield_curve_spread": {"weight": 0.30, "invert": True,  "display_name": "Yield Curve (10Y−2Y)", "unit": "%"},
            "fed_funds_level":    {"weight": 0.25, "invert": False, "display_name": "Fed Funds Rate",        "unit": "%"},
            "unemployment_trend": {"weight": 0.20, "invert": False, "display_name": "Unemployment Δ 6M",     "unit": "pp"},
            "cpi_yoy":            {"weight": 0.25, "invert": False, "display_name": "Inflation (CPI YoY)",   "unit": "%"},
        },
    },
    "leverage_credit": {
        "weight": 0.20,
        "display_name": "Leverage & Credit",
        "indicators": {
            "vix_level":        {"weight": 0.35, "invert": False, "display_name": "VIX Level",         "unit": "pts"},
            "hy_spread":        {"weight": 0.35, "invert": False, "display_name": "HY Credit Spread",  "unit": "%"},
            "margin_debt_yoy":  {"weight": 0.30, "invert": False, "display_name": "Margin Debt YoY",   "unit": "%"},
        },
    },
    "sentiment": {
        "weight": 0.15,
        "display_name": "Sentiment",
        "indicators": {
            "vix_trend":       {"weight": 0.60, "invert": False, "display_name": "VIX Trend 30D",    "unit": "%"},
            "ipo_volume_yoy":  {"weight": 0.40, "invert": False, "display_name": "IPO Volume YoY",   "unit": "%"},
        },
    },
    "concentration": {
        "weight": 0.10,
        "display_name": "Concentration",
        "indicators": {
            "top10_concentration": {"weight": 1.00, "invert": False, "display_name": "Top-10 Cap Share", "unit": "%"},
        },
    },
}

# Upper-bound-exclusive bands; matches frontend riskTier() in lib/utils.ts
RISK_BANDS = [
    (20,  "LOW",      "BUY"),
    (40,  "MODERATE", "HOLD"),
    (60,  "ELEVATED", "WATCH"),
    (80,  "HIGH",     "CAUTION"),
]


def score_to_label(score: float) -> tuple[str, str]:
    for hi, label, verb in RISK_BANDS:
        if score < hi:
            return label, verb
    return "BUBBLE", "SELL"


ALL_INDICATOR_NAMES = [
    ind_name
    for cat in WEIGHT_CONFIG.values()
    for ind_name in cat["indicators"]
]

# Raw FRED/derived series stored in the indicator_series table
_RAW_SERIES_IDS = {
    "DDDM01USA156NWDB", "shiller_cape", "sp500_pe", "sp500_ps",
    "yield_curve_spread", "FEDFUNDS", "unemp_trend", "cpi_yoy",
    "VIXCLS", "BAMLH0A0HYM2", "margin_debt_yoy",
    "vix_trend", "ipo_volume_yoy", "top10_concentration",
}

VALID_SERIES_IDS: frozenset[str] = frozenset(ALL_INDICATOR_NAMES) | _RAW_SERIES_IDS
