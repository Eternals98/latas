"""
FastAPI middleware configurations.
Implements logging, CORS, GZip compression, and rate limiting.
"""
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_cors_origins, settings

logger = logging.getLogger(__name__)

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address)

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    HTTP middleware for logging request details.
    Logs the method, path, status code, and response duration.
    """
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        logger.info(
            f"{request.method} {request.url.path} "
            f"- {response.status_code} "
            f"- {duration:.2f}s"
        )
        return response

def setup_middleware(app: FastAPI) -> None:
    """
    Configures and adds all required middleware to the FastAPI application.
    Sets up CORS, Compression, Trusted Hosts, Logging, and Rate Limiting.
    """
    # CORS: Configures cross-origin resource sharing
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Compression: Reduces response size for payloads > 1000 bytes
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Trusted Hosts: Prevents HTTP Host Header attacks
    allowed_hosts = ["localhost", "127.0.0.1"]
    if settings.app_env == "production":
        allowed_hosts = ["axentria.vercel.app", "localhost", "127.0.0.1"]
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # Logging: Adds request/response logging
    app.add_middleware(LoggingMiddleware)

    # Rate limiting: Prevents API abuse using SlowAPI
    app.state.limiter = limiter
    app.add_exception_handler(
        RateLimitExceeded,
        lambda req, exc: JSONResponse(
            status_code=429,
            content={"detail": "Demasiadas solicitudes, intenta más tarde."}
        )
    )
    app.add_middleware(SlowAPIMiddleware)
