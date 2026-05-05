from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes.auth import router as auth_router
from src.api.routes.cash import router as cash_router
from src.api.routes.companies import router as companies_router
from src.api.routes.customers import router as customers_router
from src.api.routes.dashboard import router as dashboard_router
from src.api.routes.historic_migration import router as historic_migration_router
from src.api.routes.health import router as health_router
from src.api.routes.payment_methods import router as payment_methods_router
from src.api.routes.sales import router as sales_router
from src.core.config import get_cors_origins


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(title="LATAS Ventas API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(cash_router)
app.include_router(payment_methods_router)
app.include_router(companies_router)
app.include_router(customers_router)
app.include_router(dashboard_router)
app.include_router(sales_router)
app.include_router(historic_migration_router)
