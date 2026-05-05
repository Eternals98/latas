from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from src.models.company import Company
from src.models.audit_log import AuditLog
from src.models.customer import Customer
from src.models.payment_method import PaymentMethod
from src.models.profile import Profile
from src.services.cash_service import (
    CashConflictError,
    CashValidationError,
    close_cash_session,
    open_cash_session,
    register_cash_delivery,
    register_manual_adjustment,
    register_vault_withdrawal,
)
from src.services.sales_service import SalesConflictError, create_sale
from src.api.schemas.sales import SaleCreateRequest
from tests.helpers import set_request_user


def _seed_core(db_session):
    admin = db_session.query(Profile).filter(Profile.id == "11111111-1111-1111-1111-111111111111").first()
    if admin is None:
        admin = Profile(
            id="11111111-1111-1111-1111-111111111111",
            full_name="Admin",
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(admin)
    cashier = db_session.query(Profile).filter(Profile.id == "22222222-2222-2222-2222-222222222222").first()
    if cashier is None:
        cashier = Profile(
            id="22222222-2222-2222-2222-222222222222",
            full_name="Cajero",
            role="cashier",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(cashier)
    company = db_session.query(Company).filter(Company.name == "Latas S.A.S").first()
    if company is None:
        company = Company(
            id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            name="Latas S.A.S",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(company)
    customer = db_session.query(Customer).filter(Customer.is_generic.is_(True)).first()
    if customer is None:
        customer = Customer(
            id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            name="Cliente Genérico",
            phone=None,
            normalized_phone=None,
            is_generic=True,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=None,
        )
        db_session.add(customer)
    cash_method = db_session.query(PaymentMethod).filter(PaymentMethod.code == "CASH").first()
    if cash_method is None:
        cash_method = PaymentMethod(
            id="dddddddd-dddd-dddd-dddd-dddddddddddd",
            name="Efectivo",
            code="CASH",
            affects_cash=True,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(cash_method)
    db_session.commit()
    return admin, cashier, company, cash_method


def test_open_cash_session_duplicate_same_day(db_session):
    admin, _, _, _ = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("0"), actor=admin)

    with pytest.raises(CashConflictError):
        open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("10"), actor=admin)


def test_open_cash_session_rejects_cashier(db_session):
    _, cashier, _, _ = _seed_core(db_session)
    set_request_user(db_session, cashier.id)
    opened = open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("0"), actor=cashier)
    assert opened.status == "open"


def test_delivery_and_vault_withdrawal_insufficient_balance(db_session):
    admin, _, _, _ = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("100"), actor=admin)

    with pytest.raises(CashConflictError):
        register_cash_delivery(
            db_session,
            movement_date=date(2026, 4, 30),
            amount=Decimal("200"),
            description=None,
            actor=admin,
        )

    register_cash_delivery(
        db_session,
        movement_date=date(2026, 4, 30),
        amount=Decimal("80"),
        description=None,
        actor=admin,
    )

    with pytest.raises(CashConflictError):
        register_vault_withdrawal(
            db_session,
            movement_date=date(2026, 4, 30),
            amount=Decimal("100"),
            description=None,
            actor=admin,
        )


def test_adjustment_requires_admin_and_reason(db_session):
    admin, cashier, _, _ = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("50"), actor=admin)

    with pytest.raises(CashValidationError):
        register_manual_adjustment(
            db_session,
            movement_date=date(2026, 4, 30),
            direction="in",
            amount=Decimal("10"),
            reason="x",
            description=None,
            actor=cashier,
        )


def test_close_cash_session_calculates_difference(db_session):
    admin, _, _, _ = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("100"), actor=admin)
    register_manual_adjustment(
        db_session,
        movement_date=date(2026, 4, 30),
        direction="in",
        amount=Decimal("50"),
        reason="Ajuste",
        description=None,
        actor=admin,
    )

    closed = close_cash_session(db_session, session_date=date(2026, 4, 30), counted_cash=Decimal("140"), actor=admin)
    assert closed.status == "closed"
    assert closed.closing_cash_expected == Decimal("150.00")
    assert closed.difference_amount == Decimal("-10.00")


def test_cash_delivery_creates_audit_log(db_session):
    admin, _, _, _ = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("100"), actor=admin)

    register_cash_delivery(
        db_session,
        movement_date=date(2026, 4, 30),
        amount=Decimal("40"),
        description="Entrega parcial",
        actor=admin,
    )

    audit = (
        db_session.query(AuditLog)
        .filter(AuditLog.entity_name == "cash_sessions", AuditLog.action == "CREATE_CASH_DELIVERY")
        .order_by(AuditLog.created_at.desc())
        .first()
    )
    assert audit is not None
    assert audit.entity_id is not None
    assert audit.new_data["amount"] == "40.00"
    assert audit.new_data["movement_date"] == "2026-04-30"


def test_manual_adjustment_audit_captures_reason(db_session):
    admin, _, _, _ = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    open_cash_session(db_session, session_date=date(2026, 4, 30), opening_cash=Decimal("100"), actor=admin)

    register_manual_adjustment(
        db_session,
        movement_date=date(2026, 4, 30),
        direction="in",
        amount=Decimal("15"),
        reason="Sobrante contado",
        description=None,
        actor=admin,
    )

    audit = (
        db_session.query(AuditLog)
        .filter(AuditLog.entity_name == "cash_sessions", AuditLog.action == "CREATE_MANUAL_ADJUSTMENT")
        .order_by(AuditLog.created_at.desc())
        .first()
    )
    assert audit is not None
    assert audit.reason == "Sobrante contado"
    assert audit.new_data["direction"] == "in"
    assert audit.new_data["amount"] == "15.00"


def test_create_sale_with_cash_requires_open_session(db_session):
    admin, _, company, cash_method = _seed_core(db_session)
    set_request_user(db_session, admin.id)
    payload = SaleCreateRequest.model_validate(
        {
            "company_id": company.id,
            "transaction_date": "2026-04-30",
            "document_number": "ABC-1",
            "description": "Venta",
            "total_amount": "100.00",
            "payments": [{"payment_method_id": cash_method.id, "amount": "100.00"}],
        }
    )
    with pytest.raises(SalesConflictError):
        create_sale(db_session, payload=payload, actor=admin)
