from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import get_engine, require_admin
from app.schemas.risk_score import RiskScoreResponse
from app.scoring.engine import ScoringEngine
from app.core.limiter import limiter

router = APIRouter(prefix="/risk-score", tags=["risk-score"])


@router.get("/current", response_model=RiskScoreResponse)
def get_current_score(engine: ScoringEngine = Depends(get_engine)):
    return engine.compute_current_score()


@router.get("/latest", response_model=RiskScoreResponse)
def get_latest_score(engine: ScoringEngine = Depends(get_engine)):
    result = engine.get_latest_snapshot()
    if result is None:
        raise HTTPException(404, "No snapshots yet — call /current first")
    return result


@router.post("/refresh", response_model=RiskScoreResponse, dependencies=[Depends(require_admin)])
@limiter.limit("5/minute")
def refresh_score(request: Request, engine: ScoringEngine = Depends(get_engine)):
    cache = getattr(request.app.state, "file_cache", None)
    if cache:
        cache.clear_all()
    return engine.refresh()
