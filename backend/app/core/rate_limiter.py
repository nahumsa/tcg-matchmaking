from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from threading import Lock
from time import monotonic


@dataclass
class SlidingWindowLimit:
    max_attempts: int
    window_seconds: int


class InMemoryRateLimiter:
    def __init__(self, limit: SlidingWindowLimit):
        self.limit = limit
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        attempt_times = self._attempts[key]
        cutoff = now - self.limit.window_seconds
        while attempt_times and attempt_times[0] < cutoff:
            attempt_times.popleft()
        if not attempt_times:
            self._attempts.pop(key, None)
        return attempt_times

    def is_limited(self, key: str) -> bool:
        now = monotonic()
        with self._lock:
            attempt_times = self._prune(key, now)
            return len(attempt_times) >= self.limit.max_attempts

    def register_failure(self, key: str) -> None:
        now = monotonic()
        with self._lock:
            attempt_times = self._prune(key, now)
            attempt_times.append(now)
            self._attempts[key] = attempt_times

    def reset(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)
