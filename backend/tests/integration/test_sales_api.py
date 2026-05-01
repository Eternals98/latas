from datetime import date, datetime, timezone
from decimal import Decimal

from src.api.main import app
from src.models.audit_log import AuditLog
from src.models.cash_session import CashSession
from src.models.company import Company
from src.models.customer import Customer
from src.models.payment_method import PaymentMethod
from src.models.profile import Profile
from src.models.transaction import Transaction
from src.models.transaction_payment import TransactionPayment
from src.services.supabase_auth import require_user


def _seed_core(db_session):
    actor = db_session.query(Profile).filter(Profile.id == "11111111-1111-1111-1111-111111111111").first()
    if actor is None:
        actor = Profile(
            id="11111111-1111-1111-1111-111111111111",
            full_name="Tester",
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(actor)

    company = db_session.query(Company).filter(Company.name == "Latas S.A.S").first()
    if company is None:
        company = Company(
            id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            name="Latas S.A.S",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(company)

    customer_generic = db_session.query(Customer).filter(Customer.is_generic.is_(True)).first()
    if customer_generic is None:
        customer_generic = Customer(
            id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            name="Cliente Genérico",
            phone=None,
            normalized_phone=None,
            is_generic=True,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=None,
        )
        db_session.add(customer_generic)

    customer_named = db_session.query(Customer).filter(Customer.name == "Cliente Uno").first()
    if customer_named is None:
        customer_named = Customer(
            id="cccccccc-cccc-cccc-cccc-cccccccccccc",
            name="Cliente Uno",
            phone="3001234567",
            normalized_phone="3001234567",
            is_generic=False,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=None,
        )
        db_session.add(customer_named)

    method_cash = db_session.query(PaymentMethod).filter(PaymentMethod.code == "CASH").first()
    if method_cash is None:
        method_cash = PaymentMethod(
            id="dddddddd-dddd-dddd-dddd-dddddddddddd",
            name="Efectivo",
            code="CASH",
            affects_cash=True,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(method_cash)

    method_transfer = db_session.query(PaymentMethod).filter(PaymentMethod.code == "TRF").first()
    if method_transfer is None:
        method_transfer = PaymentMethod(
            id="eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
            name="Transferencia",
            code="TRF",
            affects_cash=False,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(method_transfer)

    db_session.commit()
    return actor, company, customer_generic, customer_named, method_cash, method_transfer


def _open_cash_session(db_session, *, actor_id: str, session_date: date):
    existing = db_session.query(CashSession).filter(CashSession.session_date == session_date).first()
    if existing is not None:
        return existing
    session = CashSession(
        id="99999999-9999-9999-9999-999999999999",
        session_date=session_date,
        opening_cash=Decimal("0.00"),
        closing_cash_expected=None,
        closing_cash_counted=None,
        difference_amount=None,
        status="open",
        opened_by=actor_id,
        closed_by=None,
        opened_at=datetime.now(timezone.utc),
        closed_at=None,
    )
    db_session.add(session)
    db_session.commit()
    return session


def test_create_sale_with_multiple_payments_and_audit(client, db_session):
    actor, company, _, customer, method_cash, method_transfer = _seed_core(db_session)
    _open_cash_session(db_session, actor_id=actor.id, session_date=date(2026, 4, 30))

    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 4, 30).isoformat(),
                "document_number": "REF-1001",
                "description": "Venta mostrador",
                "total_amount": "2000.00",
                "customer_id": customer.id,
                "payments": [
                    {"payment_method_id": method_cash.id, "amount": "1200.00"},
                    {"payment_method_id": method_transfer.id, "amount": "800.00"},
                ],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 201
    body = response.json()
    assert body["company"]["id"] == company.id
    assert body["customer"]["id"] == customer.id
    assert body["total_amount"] == "2000.00"
    assert len(body["payments"]) == 2

    tx = db_session.query(Transaction).filter(Transaction.id == body["id"]).first()
    assert tx is not None
    assert tx.transaction_type == "sale"
    assert tx.status == "confirmed"
    payments = db_session.query(TransactionPayment).filter(TransactionPayment.transaction_id == body["id"]).all()
    assert len(payments) == 2
    audit = db_session.query(AuditLog).filter(AuditLog.entity_id == body["id"], AuditLog.action == "CREATE_SALE").first()
    assert audit is not None


def test_create_sale_rejects_total_mismatch(client, db_session):
    actor, company, _, _, method_cash, _ = _seed_core(db_session)
    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 4, 30).isoformat(),
                "document_number": "REF-1002",
                "description": "Venta descuadrada",
                "total_amount": "1000.00",
                "payments": [{"payment_method_id": method_cash.id, "amount": "900.00"}],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 400
    assert response.json()["detail"] == "La suma de pagos no coincide con total_amount."


def test_create_sale_rejects_inactive_payment_method(client, db_session):
    actor, company, _, _, method_cash, _ = _seed_core(db_session)
    method_cash.is_active = False
    db_session.commit()

    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 4, 30).isoformat(),
                "document_number": "REF-1003",
                "description": "Venta medio inactivo",
                "total_amount": "1000.00",
                "payments": [{"payment_method_id": method_cash.id, "amount": "1000.00"}],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 400
    assert response.json()["detail"] == "Hay métodos de pago inexistentes, inactivos o faltantes en catálogo."


def test_create_sale_assigns_generic_customer_when_missing(client, db_session):
    actor, company, customer_generic, _, method_cash, _ = _seed_core(db_session)
    _open_cash_session(db_session, actor_id=actor.id, session_date=date(2026, 4, 30))
    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 4, 30).isoformat(),
                "document_number": "REF-1004",
                "description": "Venta sin cliente",
                "total_amount": "1000.00",
                "payments": [{"payment_method_id": method_cash.id, "amount": "1000.00"}],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 201
    assert response.json()["customer"]["id"] == customer_generic.id


def test_list_sales_with_filters(client, db_session):
    actor, company, _, customer, method_cash, _ = _seed_core(db_session)

    first_tx = Transaction(
        id="f1111111-1111-1111-1111-111111111111",
        company_id=company.id,
        customer_id=customer.id,
        cash_session_id=None,
        transaction_date=date(2026, 4, 10),
        document_type="other",
        document_number="ABC-001",
        description="Venta abril",
        transaction_type="sale",
        total_amount=Decimal("300.00"),
        status="confirmed",
        payment_difference_amount=Decimal("0.00"),
        payment_difference_reason=None,
        created_by=actor.id,
        updated_by=actor.id,
        cancelled_by=None,
        created_at=datetime(2026, 4, 10, tzinfo=timezone.utc),
        updated_at=datetime(2026, 4, 10, tzinfo=timezone.utc),
        cancelled_at=None,
        cancellation_reason=None,
    )
    second_tx = Transaction(
        id="f2222222-2222-2222-2222-222222222222",
        company_id=company.id,
        customer_id=customer.id,
        cash_session_id=None,
        transaction_date=date(2026, 4, 20),
        document_type="other",
        document_number="XYZ-010",
        description="Venta abril 2",
        transaction_type="sale",
        total_amount=Decimal("500.00"),
        status="confirmed",
        payment_difference_amount=Decimal("0.00"),
        payment_difference_reason=None,
        created_by=actor.id,
        updated_by=actor.id,
        cancelled_by=None,
        created_at=datetime(2026, 4, 20, tzinfo=timezone.utc),
        updated_at=datetime(2026, 4, 20, tzinfo=timezone.utc),
        cancelled_at=None,
        cancellation_reason=None,
    )
    db_session.add_all([first_tx, second_tx])
    db_session.flush()
    db_session.add_all(
        [
            TransactionPayment(
                id="a1111111-1111-1111-1111-111111111111",
                transaction_id=first_tx.id,
                payment_method_id=method_cash.id,
                amount=Decimal("300.00"),
                created_at=datetime(2026, 4, 10, tzinfo=timezone.utc),
            ),
            TransactionPayment(
                id="a2222222-2222-2222-2222-222222222222",
                transaction_id=second_tx.id,
                payment_method_id=method_cash.id,
                amount=Decimal("500.00"),
                created_at=datetime(2026, 4, 20, tzinfo=timezone.utc),
            ),
        ]
    )
    db_session.commit()

    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.get(
            "/api/sales",
            params={
                "date_from": "2026-04-15",
                "date_to": "2026-04-30",
                "search": "XYZ",
                "limit": 20,
                "offset": 0,
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["document_number"] == "XYZ-010"


def test_get_sale_by_id_returns_detail(client, db_session):
    actor, company, _, customer, method_cash, _ = _seed_core(db_session)
    tx = Transaction(
        id="f3333333-3333-3333-3333-333333333333",
        company_id=company.id,
        customer_id=customer.id,
        cash_session_id=None,
        transaction_date=date(2026, 4, 21),
        document_type="other",
        document_number="DET-001",
        description="Detalle por id",
        transaction_type="sale",
        total_amount=Decimal("1500.00"),
        status="confirmed",
        payment_difference_amount=Decimal("0.00"),
        payment_difference_reason=None,
        created_by=actor.id,
        updated_by=actor.id,
        cancelled_by=None,
        created_at=datetime(2026, 4, 21, tzinfo=timezone.utc),
        updated_at=datetime(2026, 4, 21, tzinfo=timezone.utc),
        cancelled_at=None,
        cancellation_reason=None,
    )
    db_session.add(tx)
    db_session.flush()
    db_session.add(
        TransactionPayment(
            id="a3333333-3333-3333-3333-333333333333",
            transaction_id=tx.id,
            payment_method_id=method_cash.id,
            amount=Decimal("1500.00"),
            created_at=datetime(2026, 4, 21, tzinfo=timezone.utc),
        )
    )
    db_session.commit()

    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.get(f"/api/sales/{tx.id}")
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == tx.id
    assert body["document_number"] == "DET-001"
    assert len(body["payments"]) == 1


def test_get_sale_by_id_not_found(client, db_session):
    actor, *_ = _seed_core(db_session)
    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.get("/api/sales/00000000-0000-0000-0000-000000000000")
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 404
    assert response.json()["detail"] == "Venta no encontrada."


def test_create_sale_fails_when_generic_customer_missing(client, db_session):
    actor, company, customer_generic, _, method_cash, _ = _seed_core(db_session)
    _open_cash_session(db_session, actor_id=actor.id, session_date=date(2026, 4, 30))
    db_session.delete(customer_generic)
    db_session.commit()

    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 4, 30).isoformat(),
                "document_number": "REF-1005",
                "description": "Venta sin cliente genérico",
                "total_amount": "1000.00",
                "payments": [{"payment_method_id": method_cash.id, "amount": "1000.00"}],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 409
    assert response.json()["detail"] == "No existe un cliente genérico activo configurado."


def test_create_sale_fails_when_company_is_inactive(client, db_session):
    actor, company, _, _, method_cash, _ = _seed_core(db_session)
    company.is_active = False
    db_session.commit()

    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 4, 30).isoformat(),
                "document_number": "REF-1006",
                "description": "Venta empresa inactiva",
                "total_amount": "1000.00",
                "payments": [{"payment_method_id": method_cash.id, "amount": "1000.00"}],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 400
    assert response.json()["detail"] == "company_id no corresponde a una empresa activa."


def test_create_sale_with_cash_requires_open_session(client, db_session):
    actor, company, _, _, method_cash, _ = _seed_core(db_session)
    app.dependency_overrides[require_user] = lambda: actor
    try:
        response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": date(2026, 5, 1).isoformat(),
                "document_number": "REF-CAJA-001",
                "description": "Venta efectivo sin caja abierta",
                "total_amount": "1000.00",
                "payments": [{"payment_method_id": method_cash.id, "amount": "1000.00"}],
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 409
    assert response.json()["detail"] == "No existe una caja abierta para la fecha de la venta en efectivo."
