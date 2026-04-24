from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_serializer

from src.api.schemas.ventas import to_money


class VentasPorMesItem(BaseModel):
    anio: int
    mes: int
    periodo: str
    cantidad_ventas: int
    valor_total: Decimal

    @field_serializer("valor_total", when_used="json")
    def serialize_valor_total(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class VentasPorEmpresaItem(BaseModel):
    empresa: str
    cantidad_ventas: int
    valor_total: Decimal

    @field_serializer("valor_total", when_used="json")
    def serialize_valor_total(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class MetodoPagoDashboardItem(BaseModel):
    medio: str
    cantidad_pagos: int
    valor_total: Decimal
    porcentaje: Decimal

    @field_serializer("valor_total", "porcentaje", when_used="json")
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
