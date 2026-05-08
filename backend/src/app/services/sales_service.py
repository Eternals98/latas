from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from src.app.schemas.transactions.sales import (
    SaleCreateRequest,
    SaleResponse,
    SaleDetailRecord,
    SaleListFilters,
)
from src.app.schemas.transactions.base import (
    TransactionCancelRequest,
    to_money
)
from src.app.services.transaction_service import create_transaction, cancel_transaction
from src.models.audit_log import AuditLog
from src.models.cash_movement import CashMovement
from src.models.company import Company
from src.models.customer import Customer
from src.models.payment_method import PaymentMethod
from src.models.profile import Profile
from src.models.transaction import Transaction
from src.models.transaction_payment import TransactionPayment
from src.services.cash_service import get_open_cash_session_by_date


class SalesValidationError(Exception):
    pass


class SalesConflictError(Exception):
    pass


class SalesNotFoundError(Exception):
    pass


class SalesPermissionError(Exception):
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


def _validate_payments(db: Session, payload: SaleCreateRequest) -> dict[str, PaymentMethod]:
    if not payload.payments:
        raise SalesValidationError("Debe enviar al menos un pago.")

    method_ids = {item.payment_method_id for item in payload.payments}
    if len(method_ids) != len(payload.payments):
        raise SalesValidationError("No se permiten métodos de pago repetidos en la misma venta.")

    found_methods = (
        db.execute(
            select(PaymentMethod).where(
                PaymentMethod.id.in_(method_ids),
                PaymentMethod.is_active.is_(True),
            )
        )
        .scalars()
        .all()
    )
    if len(found_methods) != len(method_ids):
        raise SalesValidationError("Hay métodos de pago inexistentes, inactivos o faltantes en catálogo.")

    for method in found_methods:
        if method.name.strip().upper() == "ENTREGA":
            raise SalesValidationError("El método de pago ENTREGA no se puede usar en una venta. Use el botón Entrega a bóveda.")

    payment_total = sum((to_money(payment.amount) for payment in payload.payments), start=Decimal("0.00"))
    if payment_total != to_money(payload.total_amount):
        raise SalesValidationError("La suma de pagos no coincide con total_amount.")
    return {method.id: method for method in found_methods}


def create_sale(
    db: Session,
    *,
    payload: SaleCreateRequest,
    actor: Profile,
) -> SaleDetailRecord:
    _validate_company_active(db, payload.company_id)
    session = get_open_cash_session_by_date(db, session_date=payload.transaction_date.date())
    if session is None:
        raise SalesConflictError("No se puede registrar la venta porque la caja está cerrada para la fecha indicada.")
    
    customer_id = payload.customer_id
    if customer_id is None:
        customer_id = _get_generic_customer_id(db)
    else:
        _validate_customer_active(db, customer_id)
        
    _validate_payments(db, payload)
    
    transaction = create_transaction(
        db,
        payload=payload,
        transaction_type="sale",
        actor=actor,
        customer_id=customer_id,
        document_number=payload.document_number,
        cash_session_id=session.id if any(
            # Check if any payment method affects cash
            db.get(PaymentMethod, p.payment_method_id).affects_cash for p in payload.payments
        ) else None,
    )
    
    return get_sale_by_id(db, sale_id=transaction.id)


def _build_sales_query(filters: SaleListFilters):
    conditions = [Transaction.transaction_type == "sale"]
    if filters.date_from:
        conditions.append(Transaction.transaction_date >= filters.date_from)
    if filters.date_to:
        conditions.append(Transaction.transaction_date < datetime.combine(filters.date_to + timedelta(days=1), datetime.min.time(), tzinfo=UTC))
    if filters.company_id:
        conditions.append(Transaction.company_id == filters.company_id)
    if filters.company_ids:
        conditions.append(Transaction.company_id.in_(filters.company_ids))
    if filters.search:
        pattern = f"%{filters.search}%"
        conditions.append(
            or_(
                Transaction.document_number.ilike(pattern),
                Customer.name.ilike(pattern),
                Customer.phone.ilike(pattern),
            )
        )
    if filters.payment_method_ids:
        matching_transactions = (
            select(TransactionPayment.transaction_id)
            .where(TransactionPayment.payment_method_id.in_(filters.payment_method_ids))
            .distinct()
        )
        conditions.append(Transaction.id.in_(matching_transactions))

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


def _validate_admin_can_mutate(actor: Profile, transaction: Transaction) -> None:
    if actor.role != "admin":
        raise SalesPermissionError("Solo un administrador puede editar o anular transacciones.")
    if transaction.status.lower() not in {"confirmed", "confirmada"}:
        raise SalesValidationError("Solo se pueden mutar transacciones activas.")


def _load_payment_methods(db: Session, payment_method_ids: list[str]) -> dict[str, PaymentMethod]:
    found_methods = (
        db.execute(
            select(PaymentMethod).where(
                PaymentMethod.id.in_(payment_method_ids),
                PaymentMethod.is_active.is_(True),
            )
        )
        .scalars()
        .all()
    )
    if len(found_methods) != len(payment_method_ids):
        raise SalesValidationError("Hay métodos de pago inexistentes, inactivos o faltantes en catálogo.")
    return {method.id: method for method in found_methods}


def _load_sale_transaction(db: Session, sale_id: str) -> Transaction:
    transaction = db.get(Transaction, sale_id)
    if transaction is None or transaction.transaction_type != "sale":
        raise SalesNotFoundError("Venta no encontrada.")
    return transaction


def update_sale_with_payments(
    db: Session,
    *,
    sale_id: str,
    payload: SaleUpdateRequest,
    actor: Profile,
) -> SaleDetailRecord:
    transaction = _load_sale_transaction(db, sale_id)
    _validate_admin_can_mutate(actor, transaction)
    _validate_company_active(db, payload.company_id)

    methods_map = _load_payment_methods(db, [item.payment_method_id for item in payload.payments])

    session = get_open_cash_session_by_date(db, session_date=payload.transaction_date.date())
    if session is None:
        raise SalesConflictError("No se puede editar la venta porque la caja está cerrada para la fecha indicada.")

    payment_total = sum((to_money(item.amount) for item in payload.payments), start=Decimal("0.00"))
    if payment_total <= Decimal("0.00"):
        raise SalesValidationError("La venta debe conservar un total mayor a cero.")

    cash_total = sum(
        (to_money(item.amount) for item in payload.payments if methods_map[item.payment_method_id].affects_cash),
        start=Decimal("0.00"),
    )

    transaction.company_id = payload.company_id
    transaction.transaction_date = payload.transaction_date
    transaction.description = payload.description
    transaction.updated_by = actor.id
    transaction.updated_at = _now()
    transaction.cash_session_id = session.id if cash_total > 0 else None
    transaction.total_amount = payment_total
    transaction.status = "confirmed"

    old_payments = (
        db.execute(
            select(TransactionPayment).where(TransactionPayment.transaction_id == sale_id)
        )
        .scalars()
        .all()
    )
    for payment in old_payments:
        db.delete(payment)
    db.flush()

    created_at = _now()
    for item in payload.payments:
        db.add(
            TransactionPayment(
                id=str(uuid4()),
                transaction_id=sale_id,
                payment_method_id=item.payment_method_id,
                amount=to_money(item.amount),
                created_at=created_at,
            )
        )

    db.add(
        AuditLog(
            id=str(uuid4()),
            entity_name="transactions",
            entity_id=sale_id,
            action="UPDATE_SALE",
            old_data=None,
            new_data={
                "transaction_id": sale_id,
                "company_id": payload.company_id,
                "description": payload.description,
                "transaction_date": payload.transaction_date.isoformat(),
                "payment_count": len(payload.payments),
                "total_amount": f"{payment_total:.2f}",
            },
            reason=None,
            created_by=actor.id,
            created_at=created_at,
        )
    )
    db.commit()
    return get_sale_by_id(db, sale_id=sale_id)


def cancel_sale(
    db: Session,
    *,
    sale_id: str,
    payload: TransactionCancelRequest,
    actor: Profile,
) -> SaleDetailRecord:
    transaction = _load_sale_transaction(db, sale_id)
    _validate_admin_can_mutate(actor, transaction)
    opened_session = get_open_cash_session_by_date(db, session_date=transaction.transaction_date)
    if opened_session is None:
        raise SalesConflictError("No se puede anular la venta porque la caja está cerrada.")
    
    cancel_transaction(
        db,
        transaction_id=sale_id,
        reason=payload.reason,
        impact_cash=payload.impact_cash,
        actor=actor,
        cash_session_id=opened_session.id,
    )
    
    return get_sale_by_id(db, sale_id=sale_id)
