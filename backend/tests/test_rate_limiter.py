from collections import deque

from backend.app.core.rate_limiter import InMemoryRateLimiter, SlidingWindowLimit


def test_register_failure_prunes_untouched_expired_keys():
    limiter = InMemoryRateLimiter(SlidingWindowLimit(max_attempts=2, window_seconds=10))
    limiter._attempts["stale"] = deque([0.0])
    limiter._last_global_prune = 0.0

    limiter.register_failure("fresh")

    assert "stale" not in limiter._attempts
    assert "fresh" in limiter._attempts


def test_is_limited_prunes_untouched_expired_keys():
    limiter = InMemoryRateLimiter(SlidingWindowLimit(max_attempts=2, window_seconds=10))
    limiter._attempts["stale"] = deque([0.0])
    limiter._last_global_prune = 0.0

    assert limiter.is_limited("fresh") is False
    assert "stale" not in limiter._attempts
