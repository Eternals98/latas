from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.api.routes.admin import router as admin_router
from src.api.routes.clientes import router as clientes_router
from src.api.routes.dashboard import router as dashboard_router
from src.api.routes.health import router as health_router
from src.api.routes.medios_pago import router as medios_pago_router
from src.api.routes.ventas import router as ventas_router

app = FastAPI(title="LATAS Ventas API", version="0.1.0")


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    first_error = exc.errors()[0]
    location = ".".join(str(part) for part in first_error.get("loc", ()))
    message = first_error.get("msg", "Invalid payload")
    detail = f"{location}: {message}" if location else message
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": detail})


app.include_router(health_router)
app.include_router(admin_router)
app.include_router(ventas_router)
app.include_router(clientes_router)
app.include_router(medios_pago_router)
app.include_router(dashboard_router)
