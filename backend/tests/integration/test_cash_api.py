from datetime import date, datetime, timezone

from src.api.main import app
from src.models.company import Company
from src.models.customer import Customer
from src.models.payment_method import PaymentMethod
from src.models.profile import Profile
from src.services.supabase_auth import require_user


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


def test_cash_flow_open_to_close(client, db_session):
    admin, _, company, cash_method = _seed_core(db_session)
    app.dependency_overrides[require_user] = lambda: admin
    try:
        open_response = client.post("/api/cash/open", json={"session_date": "2026-04-30", "opening_cash": "1000.00"})
        assert open_response.status_code == 200

        sale_response = client.post(
            "/api/sales",
            json={
                "company_id": company.id,
                "transaction_date": "2026-04-30",
                "document_number": "CASH-001",
                "description": "Venta efectivo",
                "total_amount": "700.00",
                "payments": [{"payment_method_id": cash_method.id, "amount": "700.00"}],
            },
        )
        assert sale_response.status_code == 201

        delivery_response = client.post("/api/cash/delivery", json={"movement_date": "2026-04-30", "amount": "300.00"})
        assert delivery_response.status_code == 200

        withdrawal_response = client.post(
            "/api/cash/vault-withdrawal",
            json={"movement_date": "2026-04-30", "amount": "100.00", "description": "Retiro jefe"},
        )
        assert withdrawal_response.status_code == 200

        adjustment_response = client.post(
            "/api/cash/adjustment",
            json={"movement_date": "2026-04-30", "direction": "out", "amount": "50.00", "reason": "Faltante menor"},
        )
        assert adjustment_response.status_code == 200

        today_response = client.get("/api/cash/today", params={"session_date": "2026-04-30"})
        assert today_response.status_code == 200
        today_payload = today_response.json()
        assert today_payload["session"]["cash_balance"] == "1350.00"
        assert today_payload["session"]["vault_balance"] == "200.00"
        assert len(today_payload["movements"]) >= 5

        close_response = client.post("/api/cash/close", json={"session_date": "2026-04-30", "counted_cash": "1340.00"})
        assert close_response.status_code == 200
        close_payload = close_response.json()
        assert close_payload["status"] == "closed"
        assert close_payload["closing_cash_expected"] == "1350.00"
        assert close_payload["difference_amount"] == "-10.00"
    finally:
        app.dependency_overrides.pop(require_user, None)


def test_cash_permissions_enforced(client, db_session):
    admin, cashier, _, _ = _seed_core(db_session)

    app.dependency_overrides[require_user] = lambda: admin
    try:
        open_response = client.post("/api/cash/open", json={"session_date": "2026-05-01", "opening_cash": "0.00"})
        assert open_response.status_code == 200
    finally:
        app.dependency_overrides.pop(require_user, None)

    app.dependency_overrides[require_user] = lambda: cashier
    try:
        delivery_response = client.post("/api/cash/delivery", json={"movement_date": "2026-05-01", "amount": "1.00"})
        assert delivery_response.status_code == 409

        adjustment_response = client.post(
            "/api/cash/adjustment",
            json={"movement_date": "2026-05-01", "direction": "in", "amount": "1.00", "reason": "test"},
        )
        assert adjustment_response.status_code == 403
    finally:
        app.dependency_overrides.pop(require_user, None)
