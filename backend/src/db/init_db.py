from sqlalchemy.orm import Session

from src.core.config import settings
from src.db.base import Base
from src.db.session import SessionLocal, engine
from src.models.audit_log import AuditLog  # noqa: F401
from src.models.cash_movement import CashMovement  # noqa: F401
from src.models.cash_session import CashSession  # noqa: F401
from src.models.company import Company  # noqa: F401
from src.models.customer import Customer  # noqa: F401
from src.models.payment_method import PaymentMethod  # noqa: F401
from src.models.profile import Profile  # noqa: F401
from src.models.transaction import Transaction  # noqa: F401
from src.models.transaction_payment import TransactionPayment  # noqa: F401


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def init_db() -> None:
    # Politica oficial:
    # - Solo SQLite local puede inicializarse con create_all.
    # - Supabase/Postgres se gestiona por SQL versionado (supabase/schema.sql).
    # Nunca ejecutar create_all sobre Supabase/Postgres porque omite RLS/policies.
    if not _is_sqlite(settings.database_url):
        return

    Base.metadata.create_all(bind=engine)
    session: Session = SessionLocal()
    session.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized")
