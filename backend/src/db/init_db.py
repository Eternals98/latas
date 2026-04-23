from sqlalchemy.orm import Session

from src.db.base import Base
from src.db.session import SessionLocal, engine
from src.models import cliente, medio_pago, pago, venta  # noqa: F401
from src.services.medios_pago_service import ensure_initial_catalog


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    session: Session = SessionLocal()
    try:
        ensure_initial_catalog(session)
    finally:
        session.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized")
