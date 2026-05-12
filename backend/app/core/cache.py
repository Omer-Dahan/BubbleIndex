import json
import hashlib
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path


class FileCache:
    def __init__(self, cache_dir: str, default_ttl_hours: int = 6):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_ttl_hours = default_ttl_hours

    def _key_to_path(self, key: str) -> Path:
        h = hashlib.sha256(key.encode()).hexdigest()[:20]
        return self.cache_dir / f"{h}.json"

    def get(self, key: str) -> dict | None:
        path = self._key_to_path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            expires_at = datetime.fromisoformat(data["expires_at"])
            if datetime.now(timezone.utc) > expires_at:
                return None
            return data["payload"]
        except Exception:
            return None

    def set(self, key: str, payload: dict, ttl_hours: int | None = None) -> None:
        ttl = ttl_hours if ttl_hours is not None else self.default_ttl_hours
        expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl)
        path = self._key_to_path(key)
        path.write_text(
            json.dumps({"expires_at": expires_at.isoformat(), "payload": payload}),
            encoding="utf-8",
        )

    def get_stale(self, key: str) -> dict | None:
        """Return cached payload even if expired (stale-while-revalidate)."""
        path = self._key_to_path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return data.get("payload")
        except Exception:
            return None

    def invalidate(self, key: str) -> None:
        path = self._key_to_path(key)
        if path.exists():
            path.unlink()

    def clear_all(self) -> int:
        count = 0
        for f in self.cache_dir.glob("*.json"):
            f.unlink()
            count += 1
        return count

    def clear_expired(self) -> int:
        count = 0
        now = datetime.now(timezone.utc)
        for f in self.cache_dir.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if datetime.fromisoformat(data["expires_at"]) < now:
                    f.unlink()
                    count += 1
            except Exception:
                pass
        return count
