from time import perf_counter

from src.models import Cliente


def test_get_clientes_performance_under_one_second(client, db_session):
    for index in range(1, 31):
        db_session.add(Cliente(nombre=f"Cliente Andino {index:02d}", telefono="3000000000"))
    db_session.commit()

    started = perf_counter()
    response = client.get("/api/clientes", params={"search": "andino"})
    elapsed = perf_counter() - started

    assert response.status_code == 200
    assert len(response.json()) == 10
    assert elapsed < 1.0
