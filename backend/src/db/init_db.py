from sqlalchemy.orm import Session

from src.db.session import SessionLocal
from src.models.audit_log import AuditLog  # noqa: F401
from src.models.cash_event import CashEvent  # noqa: F401
from src.models.cash_movement import CashMovement  # noqa: F401
from src.models.cash_session import CashSession  # noqa: F401
from src.models.company import Company  # noqa: F401
from src.models.customer import Customer  # noqa: F401
from src.models.payment_method import PaymentMethod  # noqa: F401
from src.models.profile import Profile  # noqa: F401
from src.models.transaction import Transaction  # noqa: F401
from src.models.transaction_payment import TransactionPayment  # noqa: F401


def init_db() -> None:
    # Postgres/Supabase se gestiona con migraciones SQL versionadas.
    # Este helper se conserva solo para compatibilidad local y no materializa el esquema.
    session: Session = SessionLocal()
    session.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized")
