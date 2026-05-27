from fastapi import APIRouter, Depends, HTTPException, Request

from app.schemas.risk_score import RiskScoreResponse
from app.core.limiter import limiter

router = APIRouter(prefix="/risk-score", tags=["risk-score"])


def _get_engine(request: Request):
    engine = getattr(request.app.state, "scoring_engine", None)
    if engine is None:
        raise HTTPException(503, "Scoring engine not ready")
    return engine


@router.get("/current", response_model=RiskScoreResponse)
def get_current_score(request: Request):
    return _get_engine(request).compute_current_score()


@router.get("/latest", response_model=RiskScoreResponse)
def get_latest_score(request: Request):
    result = _get_engine(request).get_latest_snapshot()
    if result is None:
        raise HTTPException(404, "No snapshots yet — call /current first")
    return result


@router.post("/refresh", response_model=RiskScoreResponse)
@limiter.limit("5/minute")
def refresh_score(request: Request):
    engine = _get_engine(request)
    cache = getattr(request.app.state, "file_cache", None)
    if cache:
        cache.clear_all()
    return engine.refresh()
