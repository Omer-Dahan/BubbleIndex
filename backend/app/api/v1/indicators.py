from datetime import date, timedelta
from fastapi import APIRouter, Request, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.models.indicator_series import IndicatorSeries

router = APIRouter(prefix="/indicators", tags=["indicators"])


class SeriesPoint(BaseModel):
    date: str
    value: float


class IndicatorHistoryResponse(BaseModel):
    series_id: str
    data: list[SeriesPoint]


def _get_session(request: Request) -> Session:
    session = getattr(request.app.state, "db_session", None)
    if session is None:
        raise HTTPException(503, "DB not ready")
    return session


def _get_engine(request: Request):
    engine = getattr(request.app.state, "scoring_engine", None)
    if engine is None:
        raise HTTPException(503, "Scoring engine not ready")
    return engine


@router.get("/current")
def get_current_indicators(request: Request):
    snap = _get_engine(request).get_latest_snapshot()
    if snap is None:
        raise HTTPException(404, "No data yet")
    return snap


@router.get("/{indicator_name}/history", response_model=IndicatorHistoryResponse)
def get_indicator_history(
    indicator_name: str,
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
):
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=730)

    session = _get_session(request)
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
