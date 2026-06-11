from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_engine
from app.db.models.indicator_series import IndicatorSeries
from app.scoring.engine import ScoringEngine
from app.scoring.weights import VALID_SERIES_IDS

router = APIRouter(prefix="/indicators", tags=["indicators"])


class SeriesPoint(BaseModel):
    date: str
    value: float


class IndicatorHistoryResponse(BaseModel):
    series_id: str
    data: list[SeriesPoint]


@router.get("/current")
def get_current_indicators(engine: ScoringEngine = Depends(get_engine)):
    snap = engine.get_latest_snapshot()
    if snap is None:
        raise HTTPException(404, "No data yet")
    return snap


@router.get("/{indicator_name}/history", response_model=IndicatorHistoryResponse)
def get_indicator_history(
    indicator_name: str,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    session: Session = Depends(get_db),
):
    if indicator_name not in VALID_SERIES_IDS:
        raise HTTPException(status_code=404, detail="Indicator not found")

    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=730)

    rows = (
        session.query(IndicatorSeries)
        .filter(
            IndicatorSeries.series_id == indicator_name,
            IndicatorSeries.date >= start_date,
            IndicatorSeries.date <= end_date,
        )
        .order_by(IndicatorSeries.date)
        .all()
    )
    return IndicatorHistoryResponse(
        series_id=indicator_name,
        data=[SeriesPoint(date=str(r.date), value=r.value) for r in rows],
    )
