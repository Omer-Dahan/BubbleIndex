import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

from app.config import get_settings
from app.db.base import Base
from app.db.session import get_engine, get_session_factory
from app.db.models import indicator_series, risk_snapshot, crisis_profile  # noqa: F401 — registers models
from app.core.cache import FileCache
from app.scoring.percentile import PercentileNormalizer
from app.scoring.weights import ALL_INDICATOR_NAMES
from app.data.loaders.historical_bootstrap import HistoricalBootstrapper
from app.data.loaders.daily_sync import run_daily_sync
from app.data.loaders.concentration_seed import seed_concentration_history
from app.api.v1.router import router as v1_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

PERCENTILE_SERIES = [
    "DDDM01USA156NWDB", "shiller_cape", "sp500_pe", "sp500_ps",
    "yield_curve_spread",
    "FEDFUNDS", "unemp_trend", "cpi_yoy",
    "VIXCLS", "BAMLH0A0HYM2", "margin_debt_yoy",
    "vix_trend", "ipo_volume_yoy", "top10_concentration",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.cache_dir).mkdir(parents=True, exist_ok=True)
    Path("data").mkdir(parents=True, exist_ok=True)

    engine = get_engine()
    Base.metadata.create_all(engine)

    factory = get_session_factory()

    cache = FileCache(settings.cache_dir)
    app.state.file_cache = cache

    # Bootstrap work uses a dedicated short-lived session
    session = factory()
    try:
        # Historical bootstrap
        bootstrapper = HistoricalBootstrapper(session, settings)
        try:
            bootstrapper.run_if_needed()
        except Exception as e:
            logger.warning("Bootstrap warning: %s", e)

        # Incremental gap-fill (handles restarts after downtime + migration for upgrades)
        try:
            bootstrapper.run_incremental_if_stale(staleness_days=2)
        except Exception as e:
            logger.warning("Incremental sync warning: %s", e)

        # Seed historical concentration data (no-op if already seeded)
        try:
            seed_concentration_history(session)
        except Exception as e:
            logger.warning("Concentration seed warning: %s", e)
    finally:
        session.close()

    # Warm percentile normalizer (thread-safe: opens its own sessions)
    normalizer = PercentileNormalizer(factory)
    try:
        normalizer.warm_cache(PERCENTILE_SERIES)
    except Exception as e:
        logger.warning("Percentile warm failed: %s", e)

    # Endpoints build a per-request session + engine from these (see app/api/deps.py)
    app.state.settings = settings
    app.state.normalizer = normalizer
    app.state.session_factory = factory

    # Setup APScheduler for nightly sync
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        run_daily_sync,
        CronTrigger(hour=settings.daily_sync_hour_utc, minute=0, timezone="UTC"),
        args=[factory, settings, normalizer, PERCENTILE_SERIES],
        id="nightly_sync",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.start()
    app.state.scheduler = scheduler
    logger.info("Nightly sync scheduled at %02d:00 UTC", settings.daily_sync_hour_utc)

    logger.info("BubbleIndex API ready")
    yield

    scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="BubbleIndex API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )
    app.include_router(v1_router)

    @app.get("/health")
    def health():
        ready = getattr(app.state, "session_factory", None) is not None
        return {"status": "ok", "ready": ready}

    return app


app = create_app()
