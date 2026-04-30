from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from src.api.schemas.sales import (
    SaleCreateRequest,
    SaleDetailRecord,
    SaleListFilters,
    SalePaymentResponse,
    to_money,
)
from src.models.audit_log import AuditLog
from src.models.company import Company
from src.models.customer import Customer
from src.models.payment_method import PaymentMethod
from src.models.profile import Profile
from src.models.transaction import Transaction
from src.models.transaction_payment import TransactionPayment


class SalesValidationError(Exception):
    pass


class SalesConflictError(Exception):
    pass


class SalesNotFoundError(Exception):
    pass


def _now() -> datetime:
    return datetime.now(UTC)


def _get_generic_customer_id(db: Session) -> str:
    generic = (
        db.execute(
            select(Customer).where(
                Customer.is_generic.is_(True),
                Customer.is_active.is_(True),
            )
        )
        .scalars()
        .first()
    )
    if generic is not None:
        return generic.id
    raise SalesConflictError("No existe un cliente genérico activo configurado.")


def _validate_company_active(db: Session, company_id: str) -> None:
    exists = (
        db.execute(
            select(Company.id).where(
                Company.id == company_id,
                Company.is_active.is_(True),
            )
        )
        .scalars()
        .first()
    )
    if not exists:
        raise SalesValidationError("company_id no corresponde a una empresa activa.")


def _validate_customer_active(db: Session, customer_id: str) -> None:
    exists = (
        db.execute(
            select(Customer.id).where(
                Customer.id == customer_id,
                Customer.is_active.is_(True),
            )
        )
        .scalars()
        .first()
    )
    if not exists:
        raise SalesValidationError("customer_id no corresponde a un cliente activo.")


def _validate_payments(db: Session, payload: SaleCreateRequest) -> None:
    if not payload.payments:
        raise SalesValidationError("Debe enviar al menos un pago.")

    method_ids = {item.payment_method_id for item in payload.payments}
    if len(method_ids) != len(payload.payments):
        raise SalesValidationError("No se permiten métodos de pago repetidos en la misma venta.")

    found_methods = (
        db.execute(
            select(PaymentMethod.id).where(
                PaymentMethod.id.in_(method_ids),
                PaymentMethod.is_active.is_(True),
            )
        )
        .scalars()
        .all()
    )
    if len(found_methods) != len(method_ids):
        raise SalesValidationError("Hay métodos de pago inexistentes, inactivos o faltantes en catálogo.")

    payment_total = sum((to_money(payment.amount) for payment in payload.payments), start=Decimal("0.00"))
    if payment_total != to_money(payload.total_amount):
        raise SalesValidationError("La suma de pagos no coincide con total_amount.")


def create_sale(
    db: Session,
    *,
    payload: SaleCreateRequest,
    actor: Profile,
) -> SaleDetailRecord:
    _validate_company_active(db, payload.company_id)
    customer_id = payload.customer_id
    if customer_id is None:
        customer_id = _get_generic_customer_id(db)
    else:
        _validate_customer_active(db, customer_id)
    _validate_payments(db, payload)

    transaction_id = str(uuid4())
    created_at = _now()

    try:
        transaction = Transaction(
            id=transaction_id,
            company_id=payload.company_id,
            customer_id=customer_id,
            cash_session_id=None,
            transaction_date=payload.transaction_date,
            document_type="other",
            document_number=payload.document_number,
            description=payload.description,
            transaction_type="sale",
            total_amount=to_money(payload.total_amount),
            status="confirmed",
            payment_difference_amount=Decimal("0.00"),
            payment_difference_reason=None,
            created_by=actor.id,
            updated_by=actor.id,
            cancelled_by=None,
            created_at=created_at,
            updated_at=created_at,
            cancelled_at=None,
            cancellation_reason=None,
        )
        db.add(transaction)

        for payment in payload.payments:
            db.add(
                TransactionPayment(
                    id=str(uuid4()),
                    transaction_id=transaction_id,
                    payment_method_id=payment.payment_method_id,
                    amount=to_money(payment.amount),
                    created_at=created_at,
                )
            )

        db.add(
            AuditLog(
                id=str(uuid4()),
                entity_name="transactions",
                entity_id=transaction_id,
                action="CREATE_SALE",
                old_data=None,
                new_data={
                    "transaction_id": transaction_id,
                    "company_id": payload.company_id,
                    "total_amount": f"{to_money(payload.total_amount):.2f}",
                    "payment_count": len(payload.payments),
                },
                reason=None,
                created_by=actor.id,
                created_at=created_at,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_sale_by_id(db, sale_id=transaction_id)


def _build_sales_query(filters: SaleListFilters):
    conditions = [Transaction.transaction_type == "sale"]
    if filters.date_from:
        conditions.append(Transaction.transaction_date >= filters.date_from)
    if filters.date_to:
        conditions.append(Transaction.transaction_date <= filters.date_to)
    if filters.company_id:
        conditions.append(Transaction.company_id == filters.company_id)
    if filters.search:
        pattern = f"%{filters.search}%"
        conditions.append(
            or_(
                Transaction.document_number.ilike(pattern),
                Customer.name.ilike(pattern),
                Customer.phone.ilike(pattern),
            )
        )

    base = (
        select(
            Transaction.id,
            Transaction.company_id,
            Company.name.label("company_name"),
            Transaction.customer_id,
            Customer.name.label("customer_name"),
            Customer.phone.label("customer_phone"),
            Transaction.transaction_date,
            Transaction.document_number,
            Transaction.description,
            Transaction.total_amount,
            Transaction.status,
            Transaction.created_at,
        )
        .join(Company, Company.id == Transaction.company_id)
        .join(Customer, Customer.id == Transaction.customer_id, isouter=True)
        .where(and_(*conditions))
    )
    return base


def _payments_for_transactions(db: Session, transaction_ids: list[str]) -> dict[str, list[SalePaymentResponse]]:
    if not transaction_ids:
        return {}
    rows = db.execute(
        select(
            TransactionPayment.id,
            TransactionPayment.transaction_id,
            TransactionPayment.payment_method_id,
            PaymentMethod.name.label("payment_method_name"),
            TransactionPayment.amount,
        )
        .join(PaymentMethod, PaymentMethod.id == TransactionPayment.payment_method_id)
        .where(TransactionPayment.transaction_id.in_(transaction_ids))
        .order_by(TransactionPayment.created_at.asc())
    ).all()
    grouped: dict[str, list[SalePaymentResponse]] = {}
    for row in rows:
        grouped.setdefault(row.transaction_id, []).append(
            SalePaymentResponse(
                id=row.id,
                payment_method_id=row.payment_method_id,
                payment_method_name=row.payment_method_name,
                amount=to_money(row.amount),
            )
        )
    return grouped


def list_sales(db: Session, *, filters: SaleListFilters) -> tuple[list[SaleDetailRecord], int]:
    base = _build_sales_query(filters).subquery()
    total = db.execute(select(func.count()).select_from(base)).scalar_one()

    rows = db.execute(
        select(base)
        .order_by(base.c.transaction_date.desc(), base.c.created_at.desc())
        .limit(filters.limit)
        .offset(filters.offset)
    ).all()
    transaction_ids = [row.id for row in rows]
    payments_map = _payments_for_transactions(db, transaction_ids)

    items = [
        SaleDetailRecord(
            id=row.id,
            company_id=row.company_id,
            company_name=row.company_name,
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            customer_phone=row.customer_phone,
            transaction_date=row.transaction_date,
            document_number=row.document_number,
            description=row.description or "",
            total_amount=to_money(row.total_amount),
            status=row.status,
            created_at=row.created_at,
            payments=payments_map.get(row.id, []),
        )
        for row in rows
    ]
    return items, int(total)


def get_sale_by_id(db: Session, *, sale_id: str) -> SaleDetailRecord:
    row = db.execute(
        select(
            Transaction.id,
            Transaction.company_id,
            Company.name.label("company_name"),
            Transaction.customer_id,
            Customer.name.label("customer_name"),
            Customer.phone.label("customer_phone"),
            Transaction.transaction_date,
            Transaction.document_number,
            Transaction.description,
            Transaction.total_amount,
            Transaction.status,
            Transaction.created_at,
        )
        .join(Company, Company.id == Transaction.company_id)
        .join(Customer, Customer.id == Transaction.customer_id, isouter=True)
        .where(Transaction.id == sale_id, Transaction.transaction_type == "sale")
    ).first()
    if row is None:
        raise SalesNotFoundError("Venta no encontrada.")

    payments_map = _payments_for_transactions(db, [row.id])
    return SaleDetailRecord(
        id=row.id,
        company_id=row.company_id,
        company_name=row.company_name,
        customer_id=row.customer_id,
        customer_name=row.customer_name,
        customer_phone=row.customer_phone,
        transaction_date=row.transaction_date,
        document_number=row.document_number,
        description=row.description or "",
        total_amount=to_money(row.total_amount),
        status=row.status,
        created_at=row.created_at,
        payments=payments_map.get(row.id, []),
    )
