from datetime import date, timedelta
from typing import Optional

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
        start_date = date(1990, 1, 1)

    snaps = _get_engine(request).get_snapshots(start_date, end_date)
    return [_snap_to_summary(s) for s in snaps]


@router.get("/snapshots/{snapshot_date}", response_model=SnapshotSummary)
def get_snapshot_by_date(
    snapshot_date: date,
    request: Request,
):
    snaps = _get_engine(request).get_snapshots(snapshot_date, snapshot_date)
    if not snaps:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"No snapshot found for {snapshot_date}")
    return _snap_to_summary(snaps[0])


class RecomputeResult(BaseModel):
    seeded_rows: int
    recomputed: int
    skipped: int


@router.post("/recompute", response_model=RecomputeResult)
def recompute_snapshots(request: Request):
    """Seed historical concentration data and force-recompute all existing snapshots."""
    session = getattr(request.app.state, "db_session", None)
    if session is None:
        raise HTTPException(503, "DB session not available")

    from app.data.loaders.concentration_seed import seed_concentration_history
    from app.scoring.backfill_engine import HistoricalBackfillEngine
    from app.db.models.risk_snapshot import RiskSnapshot

    # 1. Seed concentration history
    seeded = seed_concentration_history(session)

    # 2. Warm percentile normalizer with new data
    scoring_engine = _get_engine(request)
    try:
        scoring_engine.normalizer.warm_cache(["top10_concentration"])
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
        except Exception as e:
            skipped += 1

    return RecomputeResult(seeded_rows=seeded, recomputed=recomputed, skipped=skipped)


def _snap_to_summary(s: dict) -> SnapshotSummary:
    cats = s.get("categories", [])
    return SnapshotSummary(
        snapshot_date=s["snapshot_date"],
        composite_score=s["composite_score"],
        risk_label=s["risk_label"],
        valuation_score=cats[0]["score"] if len(cats) > 0 else 50.0,
        macro_stress_score=cats[1]["score"] if len(cats) > 1 else 50.0,
        leverage_credit_score=cats[2]["score"] if len(cats) > 2 else 50.0,
        sentiment_score=cats[3]["score"] if len(cats) > 3 else 50.0,
        concentration_score=cats[4]["score"] if len(cats) > 4 else 50.0,
    )
