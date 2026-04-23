from src.api.routes.clientes import router as clientes_router
from src.api.routes.health import router as health_router
from src.api.routes.ventas import router as ventas_router

__all__ = ["health_router", "ventas_router", "clientes_router"]
