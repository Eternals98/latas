from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.core.middleware import setup_middleware

from app.api.v1.router import router
from app.services.sales_service import (
    SalesValidationError,
    SalesConflictError,
    SalesNotFoundError,
    SalesPermissionError,
)
from app.services.cash_service import (
    CashValidationError,
    CashConflictError,
    CashNotFoundError,
)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield

app = FastAPI(title="LATAS Ventas API", version="1.0.0", lifespan=lifespan)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Map custom exceptions to HTTP status codes
    error_map = {
        (SalesValidationError, CashValidationError): status.HTTP_400_BAD_REQUEST,
        (SalesConflictError, CashConflictError): status.HTTP_409_CONFLICT,
        (SalesNotFoundError, CashNotFoundError): status.HTTP_404_NOT_FOUND,
        (SalesPermissionError,): status.HTTP_403_FORBIDDEN,
    }

    for exceptions, code in error_map.items():
        if isinstance(exc, exceptions):
            return JSONResponse(
                status_code=code,
                content={"detail": str(exc)},
            )

    # Fallback for unhandled exceptions
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

setup_middleware(app)

app.include_router(router, prefix="/api/v1")