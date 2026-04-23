from fastapi import FastAPI

from src.api.routes.clientes import router as clientes_router
from src.api.routes.health import router as health_router
from src.api.routes.ventas import router as ventas_router

app = FastAPI(title="LATAS Ventas API", version="0.1.0")
app.include_router(health_router)
app.include_router(ventas_router)
app.include_router(clientes_router)
