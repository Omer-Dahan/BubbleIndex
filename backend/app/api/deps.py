"""Per-request dependencies.

Each request gets its own SQLAlchemy session (sessions are not thread-safe and
FastAPI runs sync endpoints in a threadpool). The settings and the warmed
PercentileNormalizer are long-lived and shared via app.state.
"""
from typing import Generator

from fastapi import Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.scoring.engine import ScoringEngine


def get_db(request: Request) -> Generator[Session, None, None]:
    factory = getattr(request.app.state, "session_factory", None)
    if factory is None:
        raise HTTPException(503, "DB not ready")
    session = factory()
    try:
        yield session
    finally:
        session.close()


def get_engine(request: Request) -> Generator[ScoringEngine, None, None]:
    state = request.app.state
    factory = getattr(state, "session_factory", None)
    normalizer = getattr(state, "normalizer", None)
    settings = getattr(state, "settings", None)
    if factory is None or normalizer is None or settings is None:
        raise HTTPException(503, "Scoring engine not ready")
    session = factory()
    try:
        yield ScoringEngine(session, settings, normalizer)
    finally:
        session.close()


def require_admin(x_admin_key: str = Header(default="")) -> None:
    settings = get_settings()
    if not settings.admin_api_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(403, "Admin access required")
