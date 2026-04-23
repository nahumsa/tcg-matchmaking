import hashlib
import hmac


def hash_reconnect_code(raw_code: str, pepper: str) -> str:
    return hmac.new(
        key=pepper.encode("utf-8"),
        msg=raw_code.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
