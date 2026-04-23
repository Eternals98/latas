from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.core.config import settings


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


engine = create_engine(
    settings.database_url,
    future=True,
    connect_args={"check_same_thread": False} if _is_sqlite(settings.database_url) else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
