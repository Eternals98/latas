from decimal import Decimal

import pytest
from pydantic import ValidationError

from src.api.schemas.ventas import CreateVentaRequest
from src.services.ventas_service import (
    VentaValidationError,
    calculate_payment_total,
    validate_total_equals_payments,
)


def build_valid_request() -> CreateVentaRequest:
    return CreateVentaRequest.model_validate(
        {
            "empresa": "latas_sas",
            "tipo": "formal",
            "numero_referencia": "V-UNIT-001",
            "descripcion": "Venta unitaria",
            "valor_total": "1000.00",
            "cliente_id": None,
            "pagos": [
                {"medio": "efectivo", "monto": "600.00"},
                {"medio": "nequi", "monto": "400.00"},
            ],
        }
    )


def test_calculate_payment_total_success():
    payload = build_valid_request()

    total = calculate_payment_total(payload)

    assert total == Decimal("1000.00")
    validate_total_equals_payments(payload)


def test_validate_total_equals_payments_raises_on_mismatch():
    payload = CreateVentaRequest.model_validate(
        {
            "empresa": "latas_sas",
            "tipo": "formal",
            "numero_referencia": "V-UNIT-002",
            "descripcion": "Venta invalida",
            "valor_total": "1000.00",
            "cliente_id": None,
            "pagos": [{"medio": "efectivo", "monto": "999.99"}],
        }
    )

    with pytest.raises(VentaValidationError):
        validate_total_equals_payments(payload)


def test_request_validation_requires_empresa_tipo_and_pagos():
    with pytest.raises(ValidationError):
        CreateVentaRequest.model_validate(
            {
                "numero_referencia": "V-UNIT-003",
                "descripcion": "Sin datos requeridos",
                "valor_total": "1000.00",
                "pagos": [],
            }
        )


def test_request_validation_requires_positive_payment_amount():
    with pytest.raises(ValidationError):
        CreateVentaRequest.model_validate(
            {
                "empresa": "latas_sas",
                "tipo": "formal",
                "numero_referencia": "V-UNIT-004",
                "descripcion": "Pago invalido",
                "valor_total": "1000.00",
                "pagos": [{"medio": "efectivo", "monto": "0.00"}],
            }
        )
