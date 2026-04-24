from decimal import Decimal

import pytest
from sqlalchemy import select

from src.api.schemas.ventas import UpdateVentaRequest
from src.models import Cliente, EstadoVentaEnum, Pago, Venta
from src.services.ventas_service import (
    VentaConflictError,
    VentaNotFoundError,
    VentaValidationError,
    annul_venta,
    update_venta_with_pagos,
)


def _payload(**overrides) -> UpdateVentaRequest:
    data = {
        "empresa": "tomas_gomez",
        "tipo": "informal",
        "numero_referencia": "ADM-EDIT",
        "descripcion": "Venta editada",
        "valor_total": "150.00",
        "cliente_id": None,
        "pagos": [
            {"medio": "efectivo", "monto": "100.00"},
            {"medio": "transferencia", "monto": "50.00"},
        ],
    }
    data.update(overrides)
    return UpdateVentaRequest.model_validate(data)


def test_update_venta_replaces_fields_and_payments(db_session, active_sale):
    original_id = active_sale.id
    original_created = active_sale.creado_en

    updated = update_venta_with_pagos(db_session, active_sale.id, _payload())

    assert updated.id == original_id
    assert updated.creado_en == original_created
    assert updated.estado == EstadoVentaEnum.ACTIVO.value
    assert updated.numero_referencia == "ADM-EDIT"
    assert updated.valor_total == Decimal("150.00")
    assert [pago.monto for pago in updated.pagos] == [Decimal("100.00"), Decimal("50.00")]


def test_update_venta_rejects_payment_total_mismatch(db_session, active_sale):
    with pytest.raises(VentaValidationError):
        update_venta_with_pagos(
            db_session,
            active_sale.id,
            _payload(valor_total="151.00"),
        )


def test_update_venta_rejects_nonexistent_cliente_id(db_session, active_sale):
    with pytest.raises(VentaValidationError):
        update_venta_with_pagos(db_session, active_sale.id, _payload(cliente_id=9999))


def test_update_venta_accepts_existing_cliente_id(db_session, active_sale):
    cliente = Cliente(nombre="Cliente Admin", telefono=None)
    db_session.add(cliente)
    db_session.commit()

    updated = update_venta_with_pagos(db_session, active_sale.id, _payload(cliente_id=cliente.id))

    assert updated.cliente_id == cliente.id


def test_update_venta_not_found(db_session):
    with pytest.raises(VentaNotFoundError):
        update_venta_with_pagos(db_session, 9999, _payload())


def test_update_venta_rejects_annulled_sale(db_session, annulled_sale):
    with pytest.raises(VentaConflictError):
        update_venta_with_pagos(db_session, annulled_sale.id, _payload())


def test_annul_venta_sets_estado_without_deleting(db_session, active_sale):
    annulled = annul_venta(db_session, active_sale.id)

    assert annulled.id == active_sale.id
    assert annulled.estado == EstadoVentaEnum.ANULADO.value
    persisted = db_session.execute(select(Venta).where(Venta.id == active_sale.id)).scalar_one()
    assert persisted.estado == EstadoVentaEnum.ANULADO.value


def test_annul_venta_is_idempotent_and_preserves_payments(db_session, annulled_sale):
    first = annul_venta(db_session, annulled_sale.id)
    second = annul_venta(db_session, annulled_sale.id)

    assert first.id == second.id == annulled_sale.id
    pagos = db_session.execute(select(Pago).where(Pago.venta_id == annulled_sale.id)).scalars().all()
    assert len(pagos) == 1


def test_annul_venta_not_found(db_session):
    with pytest.raises(VentaNotFoundError):
        annul_venta(db_session, 9999)
