from datetime import date, timedelta

from fastapi import APIRouter, Depends, Request, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/history", tags=["history"])


class SnapshotSummary(BaseModel):
    snapshot_date: str
    composite_score: float
    risk_label: str
    valuation_score: float
    macro_stress_score: float
    leverage_credit_score: float
    sentiment_score: float
    concentration_score: float


def _get_engine(request: Request):
    engine = getattr(request.app.state, "scoring_engine", None)
    if engine is None:
        raise HTTPException(503, "Scoring engine not ready")
    return engine


@router.get("/snapshots", response_model=list[SnapshotSummary])
def get_snapshots(
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
):
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=365)

    snaps = _get_engine(request).get_snapshots(start_date, end_date)
    return [
        SnapshotSummary(
            snapshot_date=s["snapshot_date"],
            composite_score=s["composite_score"],
            risk_label=s["risk_label"],
            valuation_score=s["categories"][0]["score"] if s["categories"] else 50.0,
            macro_stress_score=s["categories"][1]["score"] if len(s["categories"]) > 1 else 50.0,
            leverage_credit_score=s["categories"][2]["score"] if len(s["categories"]) > 2 else 50.0,
            sentiment_score=s["categories"][3]["score"] if len(s["categories"]) > 3 else 50.0,
            concentration_score=s["categories"][4]["score"] if len(s["categories"]) > 4 else 50.0,
        )
        for s in snaps
    ]
