from fastapi import APIRouter
from app.api.v1 import risk_score, history, indicators, crisis

router = APIRouter(prefix="/api/v1")
router.include_router(risk_score.router)
router.include_router(history.router)
router.include_router(indicators.router)
router.include_router(crisis.router)
