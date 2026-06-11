from datetime import date

from fastapi import APIRouter, Depends, Request, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.db.models.risk_snapshot import RiskSnapshot
from app.core.limiter import limiter

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


def _row_to_summary(s: RiskSnapshot) -> SnapshotSummary:
    return SnapshotSummary(
        snapshot_date=str(s.snapshot_date),
        composite_score=s.composite_score,
        risk_label=s.risk_label,
        valuation_score=s.valuation_score if s.valuation_score is not None else 50.0,
        macro_stress_score=s.macro_stress_score if s.macro_stress_score is not None else 50.0,
        leverage_credit_score=s.leverage_credit_score if s.leverage_credit_score is not None else 50.0,
        sentiment_score=s.sentiment_score if s.sentiment_score is not None else 50.0,
        concentration_score=s.concentration_score if s.concentration_score is not None else 50.0,
    )


@router.get("/snapshots", response_model=list[SnapshotSummary])
def get_snapshots(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    session: Session = Depends(get_db),
):
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = date(1990, 1, 1)

    rows = (
        session.query(RiskSnapshot)
        .filter(RiskSnapshot.snapshot_date >= start_date, RiskSnapshot.snapshot_date <= end_date)
        .order_by(RiskSnapshot.snapshot_date)
        .all()
    )
    return [_row_to_summary(r) for r in rows]


@router.get("/snapshots/{snapshot_date}", response_model=SnapshotSummary)
def get_snapshot_by_date(
    snapshot_date: date,
    session: Session = Depends(get_db),
):
    row = (
        session.query(RiskSnapshot)
        .filter(RiskSnapshot.snapshot_date == snapshot_date)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail=f"No snapshot found for {snapshot_date}")
    return _row_to_summary(row)


class RecomputeResult(BaseModel):
    seeded_rows: int
    recomputed: int
    skipped: int


@router.post("/recompute", response_model=RecomputeResult, dependencies=[Depends(require_admin)])
@limiter.limit("2/minute")
def recompute_snapshots(request: Request, session: Session = Depends(get_db)):
    """Seed historical concentration data and force-recompute all existing snapshots."""
    from app.data.loaders.concentration_seed import seed_concentration_history
    from app.scoring.backfill_engine import HistoricalBackfillEngine

    # 1. Seed concentration history
    seeded = seed_concentration_history(session)

    # 2. Warm percentile normalizer with new data
    normalizer = getattr(request.app.state, "normalizer", None)
    if normalizer is not None:
        try:
            normalizer.warm_cache(["top10_concentration"])
        except Exception:
            pass

    # 3. Force-recompute all existing snapshots
    backfill = HistoricalBackfillEngine(session)
    all_dates = [
        row[0]
        for row in session.query(RiskSnapshot.snapshot_date).order_by(RiskSnapshot.snapshot_date).all()
    ]

    recomputed = 0
    skipped = 0
    for ref_date in all_dates:
        try:
            result = backfill.compute_snapshot(ref_date, force=True)
            if result is not None:
                recomputed += 1
            else:
                skipped += 1
        except Exception:
            session.rollback()
            skipped += 1

    return RecomputeResult(seeded_rows=seeded, recomputed=recomputed, skipped=skipped)
