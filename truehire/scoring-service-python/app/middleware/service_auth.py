import hashlib
import hmac
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

# Public paths that don't require the internal service signature
# (health checks only — every real scoring route must be signed).
EXEMPT_PATHS = {"/", "/health", "/docs", "/openapi.json"}


def _expected_signature(body_bytes: bytes, timestamp: str) -> str:
    message = f"{timestamp}.".encode() + body_bytes
    return hmac.new(
        settings.service_shared_secret.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()


class ServiceAuthMiddleware(BaseHTTPMiddleware):
    """
    Verifies that every request came from backend-node, not the public internet.
    backend-node signs each request with HMAC-SHA256 over `${timestamp}.${body}`
    using SERVICE_SHARED_SECRET. We recompute it here and reject on mismatch or
    on a stale timestamp (replay protection).
    """

    async def dispatch(self, request: Request, call_next):
        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        signature = request.headers.get("x-service-signature")
        timestamp = request.headers.get("x-service-timestamp")

        if not signature or not timestamp:
            return JSONResponse(
                status_code=401,
                content={"data": None, "error": "Missing service authentication headers"},
            )

        try:
            age = abs(time.time() - int(timestamp) / 1000)
        except ValueError:
            return JSONResponse(status_code=401, content={"data": None, "error": "Invalid timestamp"})

        if age > settings.service_signature_max_age_seconds:
            return JSONResponse(status_code=401, content={"data": None, "error": "Stale request"})

        body_bytes = await request.body()
        expected = _expected_signature(body_bytes, timestamp)

        if not hmac.compare_digest(expected, signature):
            return JSONResponse(status_code=401, content={"data": None, "error": "Invalid signature"})

        return await call_next(request)
