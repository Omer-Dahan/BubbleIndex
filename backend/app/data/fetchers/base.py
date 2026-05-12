import time
import logging
from abc import ABC, abstractmethod
from datetime import date

import pandas as pd
import requests

from app.core.cache import FileCache
from app.config import Settings
from app.core.exceptions import DataFetchError

logger = logging.getLogger(__name__)


class BaseFetcher(ABC):
    def __init__(self, cache: FileCache, settings: Settings):
        self.cache = cache
        self.settings = settings

    @abstractmethod
    def fetch_series(self, series_id: str, start_date: date, end_date: date) -> pd.DataFrame:
        ...

    def _make_cache_key(self, *parts: str) -> str:
        return ":".join(str(p) for p in parts)

    def _fetch_with_retry(self, url: str, params: dict, max_retries: int = 3) -> dict:
        delay = 1.0
        for attempt in range(max_retries):
            try:
                resp = requests.get(url, params=params, timeout=30)
                if resp.status_code == 429:
                    wait = int(resp.headers.get("Retry-After", 60))
                    logger.warning("Rate limited, waiting %ds", wait)
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp.json()
            except requests.RequestException as e:
                if attempt == max_retries - 1:
                    raise DataFetchError(f"Failed after {max_retries} attempts: {e}") from e
                logger.warning("Request failed (attempt %d/%d): %s", attempt + 1, max_retries, e)
                time.sleep(delay)
                delay *= 2
        raise DataFetchError("Exhausted retries")
