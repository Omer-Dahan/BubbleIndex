import logging
from datetime import date

from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings
from app.scoring.percentile import PercentileNormalizer
from app.scoring.engine import ScoringEngine
from app.data.loaders.historical_bootstrap import HistoricalBootstrapper

logger = logging.getLogger(__name__)


def run_daily_sync(session_factory: sessionmaker, settings: Settings, normalizer: PercentileNormalizer, percentile_series: list[str]) -> None:
    session = session_factory()
    try:
        bootstrapper = HistoricalBootstrapper(session, settings)
        bootstrapper.run_incremental_if_stale(staleness_days=1)

        # Refresh sp500_pe monthly data from multpl
        bootstrapper._load_sp500_pe()

        engine = ScoringEngine(session, settings, normalizer)
        engine.refresh()

        normalizer.warm_cache(percentile_series)

        logger.info("Daily sync completed successfully")
    except Exception as e:
        logger.exception("Daily sync failed: %s", e)
    finally:
        session.close()
