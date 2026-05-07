from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.middleware import setup_middleware

from app.api.v1.router import router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield

app = FastAPI(title="LATAS Ventas API", version="1.0.0", lifespan=lifespan)

setup_middleware(app)

app.include_router(router, prefix="/api/v1")