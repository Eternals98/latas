"""
API Router orchestration.
Aggregates all versioned endpoints into a single router for the FastAPI application.
"""
from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.cash import router as cash_router
from app.api.v1.endpoints.companies import router as companies_router
from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.historic_migration import router as historic_migration_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.payment_methods import router as payment_methods_router
from app.api.v1.endpoints.sales import router as sales_router
from app.api.v1.endpoints.movements import router as movements_router
from app.api.v1.endpoints.pays import router as pays_router
from app.api.v1.endpoints.returns import router as returns_router

router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(cash_router)
router.include_router(payment_methods_router)
router.include_router(companies_router)
router.include_router(customers_router)
router.include_router(dashboard_router)
router.include_router(sales_router)
router.include_router(movements_router)
router.include_router(pays_router)
router.include_router(returns_router)
router.include_router(historic_migration_router)
