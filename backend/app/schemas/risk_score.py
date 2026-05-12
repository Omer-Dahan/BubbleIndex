from pydantic import BaseModel
from typing import Optional


class IndicatorDetail(BaseModel):
    name: str
    display_name: str
    raw_value: Optional[float]
    raw_unit: str
    normalized_score: float
    is_imputed: bool


class CategoryScore(BaseModel):
    id: str
    display_name: str
    weight: float
    score: float
    indicators: list[IndicatorDetail]


class CrisisSimilarity(BaseModel):
    crisis_id: str
    display_name: str
    peak_date: str
    peak_score: float
    drawdown_pct: float
    similarity_score: float
    closest_indicators: list[str]


class RiskScoreResponse(BaseModel):
    composite_score: float
    risk_label: str
    risk_verb: str
    snapshot_date: str
    categories: list[CategoryScore]
    data_freshness: dict[str, str]
    warnings: list[str]
    crisis_similarities: list[CrisisSimilarity]
