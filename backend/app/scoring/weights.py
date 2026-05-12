from typing import NamedTuple


WEIGHT_CONFIG = {
    "valuation": {
        "weight": 0.30,
        "display_name": "Valuation",
        "indicators": {
            "buffett_indicator": {"weight": 0.60, "invert": False, "display_name": "Buffett Indicator", "unit": "%"},
            "sp500_pe":          {"weight": 0.40, "invert": False, "display_name": "S&P 500 P/E Ratio",  "unit": "×"},
        },
    },
    "macro_stress": {
        "weight": 0.20,
        "display_name": "Macro Stress",
        "indicators": {
            "yield_curve_spread": {"weight": 0.40, "invert": True,  "display_name": "Yield Curve (10Y−2Y)",  "unit": "%"},
            "fed_funds_level":    {"weight": 0.35, "invert": False, "display_name": "Fed Funds Rate",         "unit": "%"},
            "unemployment_trend": {"weight": 0.25, "invert": False, "display_name": "Unemployment Δ 6M",      "unit": "pp"},
        },
    },
    "leverage_credit": {
        "weight": 0.20,
        "display_name": "Leverage & Credit",
        "indicators": {
            "vix_level": {"weight": 0.50, "invert": False, "display_name": "VIX Level",      "unit": "pts"},
            "hy_spread": {"weight": 0.50, "invert": False, "display_name": "HY Credit Spread","unit": "%"},
        },
    },
    "sentiment": {
        "weight": 0.15,
        "display_name": "Sentiment",
        "indicators": {
            "vix_trend": {"weight": 1.00, "invert": False, "display_name": "VIX Trend 30D",  "unit": "%"},
        },
    },
    "concentration": {
        "weight": 0.15,
        "display_name": "Concentration",
        "indicators": {
            "top10_concentration": {"weight": 1.00, "invert": False, "display_name": "Top-10 Cap Share", "unit": "%"},
        },
    },
}

RISK_BANDS = [
    (0,  20,  "LOW",      "BUY"),
    (21, 40,  "MODERATE", "HOLD"),
    (41, 60,  "ELEVATED", "WATCH"),
    (61, 80,  "HIGH",     "CAUTION"),
    (81, 100, "BUBBLE",   "SELL"),
]


def score_to_label(score: float) -> tuple[str, str]:
    for lo, hi, label, verb in RISK_BANDS:
        if lo <= score <= hi:
            return label, verb
    return "EXTREME", "SELL"


ALL_INDICATOR_NAMES = [
    ind_name
    for cat in WEIGHT_CONFIG.values()
    for ind_name in cat["indicators"]
]
