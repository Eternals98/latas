from time import perf_counter


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
