import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.base import Base
from app.db.session import get_engine, get_session_factory
from app.db.models import indicator_series, risk_snapshot, crisis_profile  # noqa: F401 — registers models
from app.core.cache import FileCache
from app.scoring.percentile import PercentileNormalizer
from app.scoring.weights import ALL_INDICATOR_NAMES
from app.scoring.engine import ScoringEngine
from app.data.loaders.historical_bootstrap import HistoricalBootstrapper
from app.api.v1.router import router as v1_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

PERCENTILE_SERIES = [
    "DDDM01USA156NWDB", "sp500_pe",
    "yield_curve_spread",
    "FEDFUNDS", "unemp_trend",
    "VIXCLS", "BAMLH0A0HYM2",
    "vix_trend", "top10_concentration",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.cache_dir).mkdir(parents=True, exist_ok=True)
    Path("data").mkdir(parents=True, exist_ok=True)

    engine = get_engine()
    Base.metadata.create_all(engine)

    factory = get_session_factory()
    session = factory()

    cache = FileCache(settings.cache_dir)
    app.state.file_cache = cache

    # Historical bootstrap
    bootstrapper = HistoricalBootstrapper(session, settings)
    try:
        bootstrapper.run_if_needed()
    except Exception as e:
        logger.warning("Bootstrap warning: %s", e)

    # Warm percentile normalizer
    normalizer = PercentileNormalizer(session)
    try:
        normalizer.warm_cache(PERCENTILE_SERIES)
    except Exception as e:
        logger.warning("Percentile warm failed: %s", e)

    scoring_engine = ScoringEngine(session, settings, normalizer)
    app.state.scoring_engine = scoring_engine
    app.state.db_session = session

    logger.info("BubbleIndex API ready")
    yield

    session.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="BubbleIndex API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(v1_router)

    @app.get("/health")
    def health():
        engine = getattr(app.state, "scoring_engine", None)
        return {"status": "ok", "ready": engine is not None}

    return app


app = create_app()
