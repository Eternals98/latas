import pytest

from src.models import Pago, Venta


def test_venta_allows_nullable_cliente(db_session):
    venta = Venta(
        empresa="tomas_gomez",
        tipo="informal",
        numero_referencia="NOT-001",
        descripcion="Venta sin cliente",
        valor_total=500.0,
        cliente_id=None,
        estado="activo",
    )
    db_session.add(venta)
    db_session.commit()

    assert venta.id is not None
    assert venta.cliente_id is None


def test_multi_pago_per_venta(db_session):
    venta = Venta(
        empresa="latas_sas",
        tipo="formal",
        numero_referencia="FAC-002",
        descripcion="Venta con dos pagos",
        valor_total=1200.0,
        cliente_id=None,
        estado="activo",
    )
    db_session.add(venta)
    db_session.flush()

    pago_1 = Pago(venta_id=venta.id, medio="efectivo", monto=600.0)
    pago_2 = Pago(venta_id=venta.id, medio="nequi", monto=600.0)
    db_session.add_all([pago_1, pago_2])
    db_session.commit()

    assert len(venta.pagos) == 2


def test_invalid_constraints_raise():
    with pytest.raises(ValueError):
        Venta(
            empresa="latas_sas",
            tipo="formal",
            numero_referencia="FAC-003",
            descripcion="Invalida",
            valor_total=-1,
            cliente_id=None,
            estado="activo",
        )

    with pytest.raises(ValueError):
        Pago(venta_id=1, medio="efectivo", monto=0)
