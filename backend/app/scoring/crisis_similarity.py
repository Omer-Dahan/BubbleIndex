import numpy as np
from dataclasses import dataclass
from datetime import date


@dataclass
class CrisisSimilarityResult:
    crisis_id: str
    display_name: str
    peak_date: str
    peak_score: float
    drawdown_pct: float
    similarity_score: float  # 0–100
    closest_indicators: list[str]


CRISIS_PROFILES: dict[str, dict] = {
    "1929_crash": {
        "display_name": "1929 · Wall St. Crash",
        "peak_date": "1929-09-03",
        "peak_score": 89.0,
        "drawdown_pct": -89.0,
        "vector": {
            "buffett_indicator":  72.0,
            "sp500_pe":           88.0,
            "yield_curve_spread": 45.0,
            "fed_funds_level":    55.0,
            "unemployment_trend": 10.0,
            "vix_level":          40.0,
            "hy_spread":          35.0,
            "vix_trend":          55.0,
            "top10_concentration":65.0,
        },
    },
    "2000_dotcom": {
        "display_name": "2000 · Dot-com Bubble",
        "peak_date": "2000-03-10",
        "peak_score": 94.0,
        "drawdown_pct": -78.0,
        "vector": {
            "buffett_indicator":  92.0,
            "sp500_pe":           98.0,
            "yield_curve_spread": 35.0,
            "fed_funds_level":    80.0,
            "unemployment_trend": 20.0,
            "vix_level":          55.0,
            "hy_spread":          45.0,
            "vix_trend":          60.0,
            "top10_concentration":88.0,
        },
    },
    "2007_gfc": {
        "display_name": "2008 · Subprime / GFC",
        "peak_date": "2007-10-09",
        "peak_score": 81.0,
        "drawdown_pct": -57.0,
        "vector": {
            "buffett_indicator":  78.0,
            "sp500_pe":           72.0,
            "yield_curve_spread": 30.0,
            "fed_funds_level":    70.0,
            "unemployment_trend": 15.0,
            "vix_level":          80.0,
            "hy_spread":          90.0,
            "vix_trend":          85.0,
            "top10_concentration":55.0,
        },
    },
    "2020_covid": {
        "display_name": "2020 · Covid Crash",
        "peak_date": "2020-02-19",
        "peak_score": 67.0,
        "drawdown_pct": -34.0,
        "vector": {
            "buffett_indicator":  70.0,
            "sp500_pe":           65.0,
            "yield_curve_spread": 40.0,
            "fed_funds_level":    25.0,
            "unemployment_trend": 30.0,
            "vix_level":          95.0,
            "hy_spread":          88.0,
            "vix_trend":          95.0,
            "top10_concentration":72.0,
        },
    },
    "2021_meme": {
        "display_name": "2021 · Meme / SPAC Era",
        "peak_date": "2021-11-22",
        "peak_score": 86.0,
        "drawdown_pct": -25.0,
        "vector": {
            "buffett_indicator":  95.0,
            "sp500_pe":           90.0,
            "yield_curve_spread": 60.0,
            "fed_funds_level":    5.0,
            "unemployment_trend": 20.0,
            "vix_level":          45.0,
            "hy_spread":          30.0,
            "vix_trend":          40.0,
            "top10_concentration":80.0,
        },
    },
}


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def compute_similarities(current_vector: dict[str, float]) -> list[CrisisSimilarityResult]:
    results = []
    indicator_keys = list(current_vector.keys())

    for crisis_id, profile in CRISIS_PROFILES.items():
        crisis_vec = profile["vector"]
        keys = [k for k in indicator_keys if k in crisis_vec]
        if len(keys) < 3:
            continue

        a = np.array([current_vector[k] for k in keys], dtype=float)
        b = np.array([crisis_vec[k] for k in keys], dtype=float)

        sim = _cosine_similarity(a, b)
        sim_pct = round(sim * 100, 1)

        diffs = {k: abs(current_vector[k] - crisis_vec[k]) for k in keys}
        closest = sorted(diffs, key=lambda k: diffs[k])[:3]

        results.append(CrisisSimilarityResult(
            crisis_id=crisis_id,
            display_name=profile["display_name"],
            peak_date=profile["peak_date"],
            peak_score=profile["peak_score"],
            drawdown_pct=profile["drawdown_pct"],
            similarity_score=sim_pct,
            closest_indicators=closest,
        ))

    results.sort(key=lambda r: r.similarity_score, reverse=True)
    return results
