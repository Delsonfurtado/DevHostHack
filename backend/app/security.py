"""Small stdlib-only token and password helpers for the prototype API."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import bcrypt

SECRET = os.getenv("JWT_SECRET", "")


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def password_hash(password: str) -> str:
    return "bcrypt$" + _b64(bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)))


def password_verify(password: str, encoded: str) -> bool:
    try:
        scheme, value = encoded.split("$", 1)
        if scheme != "bcrypt":
            return False
        return bcrypt.checkpw(password.encode(), base64.urlsafe_b64decode(value + "=="))
    except (ValueError, TypeError):
        return False


def issue_token(user: dict, kind: str = "access", ttl: int = 900) -> str:
    if len(SECRET) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters")
    head = _b64(b'{"alg":"HS256","typ":"JWT"}')
    body = _b64(
        json.dumps(
            {
                "sub": user["id"],
                "role": user["role"],
                "village_id": user.get("village_id"),
                "type": kind,
                "exp": int(time.time()) + ttl,
            },
            separators=(",", ":"),
        ).encode()
    )
    message = f"{head}.{body}"
    return f"{message}.{_b64(hmac.new(SECRET.encode(), message.encode(), hashlib.sha256).digest())}"


def read_token(token: str, kind: str = "access") -> dict:
    if len(SECRET) < 32:
        raise ValueError("JWT_SECRET is not configured")
    head, body, signature = token.split(".")
    message = f"{head}.{body}"
    expected = _b64(hmac.new(SECRET.encode(), message.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        raise ValueError("Invalid token")
    claims = json.loads(base64.urlsafe_b64decode(body + "=="))
    if claims.get("exp", 0) < time.time() or claims.get("type") != kind:
        raise ValueError("Expired or wrong token")
    return claims
