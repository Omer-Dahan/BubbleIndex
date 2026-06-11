from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_engine
from app.scoring.crisis_similarity import CRISIS_PROFILES
from app.scoring.engine import ScoringEngine

router = APIRouter(prefix="/crisis", tags=["crisis"])


@router.get("/similarity")
def get_similarity(engine: ScoringEngine = Depends(get_engine)):
    snap = engine.get_latest_snapshot()
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
