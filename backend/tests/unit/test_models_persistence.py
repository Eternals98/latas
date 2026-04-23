from src.models import Cliente, EstadoVentaEnum, Pago, Venta


def test_models_are_persisted(db_session):
    cliente = Cliente(nombre="Cliente Test", telefono="3000000000")
    db_session.add(cliente)
    db_session.flush()

    venta = Venta(
        empresa="latas_sas",
        tipo="formal",
        numero_referencia="FAC-001",
        descripcion="Venta inicial",
        valor_total=1000.0,
        cliente_id=cliente.id,
        estado=EstadoVentaEnum.ACTIVO.value,
    )
    db_session.add(venta)
    db_session.flush()

    pago = Pago(venta_id=venta.id, medio="efectivo", monto=1000.0)
    db_session.add(pago)
    db_session.commit()

    assert cliente.id is not None
    assert venta.id is not None
    assert pago.id is not None
