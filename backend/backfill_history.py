"""
One-time script to backfill monthly BubbleIndex risk snapshots from 1990 to today.
Run after bootstrap has populated indicator_series with historical data:

    cd backend
    python backfill_history.py

Each month uses the last calendar day. Skips months that already have a snapshot.
Imputes missing indicators (e.g. HY spread pre-2003) as neutral 50.
"""
import calendar
import logging
import sys
from datetime import date
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

BACKFILL_START = date(1990, 1, 1)


def last_day_of_month(year: int, month: int) -> date:
    last = calendar.monthrange(year, month)[1]
    return date(year, month, last)


def iter_month_end_dates(start: date, end: date):
    year, month = start.year, start.month
    while True:
        d = last_day_of_month(year, month)
        if d > end:
            break
        if d >= start:
            yield d
        month += 1
        if month > 12:
            month = 1
            year += 1


def main() -> None:
    # Add backend to path so app imports work
    sys.path.insert(0, str(Path(__file__).parent))

    from app.db.base import Base
    from app.db.session import get_engine, get_session_factory
    import app.db.models.risk_snapshot  # noqa: register model
    import app.db.models.indicator_series  # noqa: register model
    from app.scoring.backfill_engine import HistoricalBackfillEngine

    engine = get_engine()
    Base.metadata.create_all(engine)
    SessionFactory = get_session_factory()
    session = SessionFactory()

    backfill_engine = HistoricalBackfillEngine(session)
    today = date.today()
    dates = list(iter_month_end_dates(BACKFILL_START, today))

    logger.info("Starting backfill: %d months (%s → %s)", len(dates), BACKFILL_START, today)

    skipped = computed = failed = 0
    for i, d in enumerate(dates, 1):
        try:
            result = backfill_engine.compute_snapshot(d)
            if result is None:
                skipped += 1
                logger.debug("[%d/%d] %s — skipped (already exists)", i, len(dates), d)
            else:
                computed += 1
                logger.info(
                    "[%d/%d] %s → composite=%.1f  label=%-8s  warnings=%d",
                    i, len(dates), d,
                    result["composite_score"],
                    result["risk_label"],
                    len(result["warnings"]),
                )
        except Exception as e:
            failed += 1
            logger.error("[%d/%d] %s — FAILED: %s", i, len(dates), d, e)

    session.close()
    logger.info("Done — computed=%d  skipped=%d  failed=%d", computed, skipped, failed)


if __name__ == "__main__":
    main()
