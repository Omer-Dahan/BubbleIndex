from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    fred_api_key: str = ""
    finnhub_api_key: str = ""
    # Required (via X-Admin-Key header) for mutating endpoints (/refresh, /recompute).
    # When empty, those endpoints are disabled.
    admin_api_key: str = ""
    database_url: str = "sqlite:///./data/bubble_index.db"
    cache_dir: str = "./data/cache"
    fred_cache_ttl_hours: int = 6
    yfinance_cache_ttl_hours: int = 1
    finnhub_cache_ttl_hours: int = 4
    historical_lookback_years: int = 20
    min_data_points_for_percentile: int = 252
    app_name: str = "BubbleIndex"
    debug: bool = False
    cors_origins: List[str] = ["http://localhost:3000"]
    daily_sync_hour_utc: int = 18
    model_config = SettingsConfigDict(
        env_file=os.path.join(Path(__file__).resolve().parent.parent, ".env"),
        extra="ignore"
    )


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
