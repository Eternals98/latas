"""
Health check endpoints.
Provides a simple endpoint to verify that the API is running and reachable.
"""
from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter(tags=["System"])

@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """
    Performs a basic health check of the application.
    Returns an 'ok' status if the server is responding.
    """
    return HealthResponse(status="ok")
