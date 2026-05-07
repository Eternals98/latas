from sqlalchemy.orm import Session

from src.models.company import Company
from src.models.customer import Customer
from src.models.payment_method import PaymentMethod


def ensure_phase1_seeds(db: Session) -> None:
    if not db.query(Company).filter(Company.name == "Latas S.A.S").first():
        db.add_all([
            Company(name="Latas S.A.S", is_active=True),
            Company(name="Tomás Gómez", is_active=True),
            Company(name="Genérico", is_active=True),
        ])

    if not db.query(Customer).filter(Customer.is_generic.is_(True)).first():
        db.add(Customer(name="Cliente Genérico", is_generic=True, is_active=True))

    if not db.query(PaymentMethod).filter(PaymentMethod.code == "CASH").first():
        db.add(PaymentMethod(name="Efectivo", code="CASH", affects_cash=True, is_active=True))

    db.commit()
