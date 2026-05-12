from fastapi import APIRouter, Request, HTTPException
from app.scoring.crisis_similarity import CRISIS_PROFILES, compute_similarities
import json

router = APIRouter(prefix="/crisis", tags=["crisis"])


def _get_engine(request: Request):
    engine = getattr(request.app.state, "scoring_engine", None)
    if engine is None:
        raise HTTPException(503, "Scoring engine not ready")
    return engine


@router.get("/similarity")
def get_similarity(request: Request):
    snap = _get_engine(request).get_latest_snapshot()
    if snap is None:
        raise HTTPException(404, "No snapshots yet")
    return snap.get("crisis_similarities", [])


@router.get("/profiles")
def get_profiles():
    return [
        {
            "id": k,
            "display_name": v["display_name"],
            "peak_date": v["peak_date"],
            "peak_score": v["peak_score"],
            "drawdown_pct": v["drawdown_pct"],
        }
        for k, v in CRISIS_PROFILES.items()
    ]
