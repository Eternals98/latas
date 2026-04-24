from time import perf_counter
from datetime import datetime
from decimal import Decimal

from src.models import Pago, Venta


def test_create_venta_performance_under_one_second(client, db_session):
    payload = {
        "empresa": "latas_sas",
        "tipo": "formal",
        "numero_referencia": "V-PERF-001",
        "descripcion": "Prueba de rendimiento",
        "valor_total": "50000.00",
        "pagos": [
            {"medio": "efectivo", "monto": "10000.00"},
            {"medio": "transferencia", "monto": "10000.00"},
            {"medio": "nequi", "monto": "10000.00"},
            {"medio": "daviplata", "monto": "10000.00"},
            {"medio": "tarjeta", "monto": "10000.00"},
        ],
    }

    started = perf_counter()
    response = client.post("/api/ventas", json=payload)
    elapsed = perf_counter() - started

    assert response.status_code == 201
    assert elapsed < 1.0


def test_monthly_listing_and_export_performance_smoke(client, db_session):
    for index in range(25):
        venta = Venta(
            empresa="latas_sas",
            tipo="formal" if index % 2 == 0 else "informal",
            numero_referencia=f"V-PERF-RPT-{index:03d}",
            descripcion="Venta para reporte",
            fecha_venta=datetime(2026, 4, 1, 8, 0, 0).date(),
            valor_total=Decimal("1000.00"),
            estado="activo",
            creado_en=datetime(2026, 4, 1, 8, 0, 0),
            modificado_en=datetime(2026, 4, 1, 8, 0, 0),
        )
        db_session.add(venta)
        db_session.flush()
        db_session.add(Pago(venta_id=venta.id, medio="efectivo", monto=Decimal("1000.00")))
    db_session.commit()

    started = perf_counter()
    listing_response = client.get("/api/ventas?mes=4&anio=2026")
    listing_elapsed = perf_counter() - started

    started = perf_counter()
    export_response = client.get("/api/ventas/export?tipo=formal&mes=4&anio=2026")
    export_elapsed = perf_counter() - started

    assert listing_response.status_code == 200
    assert export_response.status_code == 200
    assert listing_elapsed < 10.0
    assert export_elapsed < 15.0
