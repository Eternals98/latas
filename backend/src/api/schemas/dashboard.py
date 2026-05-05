from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from pydantic import BaseModel, field_serializer

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class VentasPorMesItem(BaseModel):
    anio: int
    mes: int
    periodo: str
    cantidad_ventas: int
    valor_total: Decimal

    @field_serializer("valor_total", when_used="json")
    def serialize_decimal(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class VentasPorEmpresaItem(BaseModel):
    empresa: str
    cantidad_ventas: int
    valor_total: Decimal

    @field_serializer("valor_total", when_used="json")
    def serialize_decimal(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class MetodoPagoDashboardItem(BaseModel):
    medio: str
    cantidad_pagos: int
    transacciones: int
    porcentaje: Decimal
    monto_total: Decimal

    @field_serializer("porcentaje", when_used="json")
    def serialize_percentage(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"

    @field_serializer("monto_total", when_used="json")
    def serialize_decimal(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class DashboardResponse(BaseModel):
    ventas_por_mes: list[VentasPorMesItem]
    ventas_por_empresa: list[VentasPorEmpresaItem]
    metodos_pago: list[MetodoPagoDashboardItem]
    ticket_promedio: Decimal
    total_ventas: Decimal
    total_mes_actual: Decimal
    cantidad_ventas: int
    generado_en: datetime

    @field_serializer("ticket_promedio", "total_ventas", "total_mes_actual", when_used="json")
    def serialize_money(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"
