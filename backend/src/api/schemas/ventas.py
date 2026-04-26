from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_serializer, field_validator

from src.models import Cliente, Pago, Venta

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def format_payment_method_display(value: str) -> str:
    cleaned = " ".join(value.replace("_", " ").replace("-", " ").split())
    if not cleaned:
        return value
    return cleaned.title()


def resolve_sale_code(venta: Venta) -> str:
    if venta.codigo_venta and venta.codigo_venta.strip():
        return venta.codigo_venta.strip()
    return f"{venta.id:03d}{venta.fecha_venta.month:02d}{venta.fecha_venta.year:04d}"


class CreatePagoRequest(BaseModel):
    medio: str = Field(min_length=1)
    monto: Decimal

    @field_validator("medio")
    @classmethod
    def validate_medio(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("medio is required")
        return cleaned

    @field_validator("monto")
    @classmethod
    def validate_monto(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount == 0:
            raise ValueError("monto must be != 0")
        return amount


class CreateVentaRequest(BaseModel):
    empresa: str = Field(min_length=1)
    tipo: str = Field(min_length=1)
    numero_referencia: str = Field(min_length=1)
    descripcion: str = Field(min_length=1)
    fecha_venta: date | None = None
    valor_total: Decimal
    cliente_id: int | None = None
    pagos: list[CreatePagoRequest] = Field(min_length=1)

    @field_validator("empresa", "tipo", "numero_referencia", "descripcion")
    @classmethod
    def validate_non_empty_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("field is required")
        return cleaned

    @field_validator("valor_total")
    @classmethod
    def validate_valor_total(cls, value: Decimal) -> Decimal:
        total = to_money(value)
        if total == 0:
            raise ValueError("valor_total must be != 0")
        return total


class UpdatePagoRequest(CreatePagoRequest):
    pass


class UpdateVentaRequest(CreateVentaRequest):
    pagos: list[UpdatePagoRequest] = Field(min_length=1)


class PagoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    venta_id: int
    medio: str
    monto: Decimal

    @field_serializer("medio", when_used="json")
    def serialize_medio(self, value: str) -> str:
        return format_payment_method_display(value)

    @field_serializer("monto", when_used="json")
    def serialize_monto(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class VentaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo_venta: str
    empresa: str
    tipo: str
    numero_referencia: str
    descripcion: str
    fecha_venta: str
    valor_total: Decimal
    cliente_id: int | None
    estado: str
    creado_en: str
    modificado_en: str
    pagos: list[PagoResponse]

    @field_serializer("valor_total", when_used="json")
    def serialize_valor_total(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class ErrorResponse(BaseModel):
    detail: str


class ClienteReporte(BaseModel):
    id: int
    nombre: str
    telefono: str | None


class PagoReporteItem(BaseModel):
    id: int
    medio: str
    monto: Decimal

    @field_serializer("medio", when_used="json")
    def serialize_medio(self, value: str) -> str:
        return format_payment_method_display(value)

    @field_serializer("monto", when_used="json")
    def serialize_monto(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class VentaReporteItem(BaseModel):
    id: int
    codigo_venta: str
    fecha: str
    empresa: str
    tipo: str
    numero_referencia: str
    descripcion: str
    cliente: ClienteReporte | None
    valor_total: Decimal
    estado: str
    pagos: list[PagoReporteItem]

    @field_serializer("valor_total", when_used="json")
    def serialize_valor_total(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class ResumenMensualVentas(BaseModel):
    mes: int
    anio: int
    cantidad_ventas: int
    valor_total: Decimal

    @field_serializer("valor_total", when_used="json")
    def serialize_valor_total(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class VentasMensualesResponse(BaseModel):
    mes: int
    anio: int
    items: list[VentaReporteItem]
    resumen_mensual: ResumenMensualVentas


class ImportVentasExcelResponse(BaseModel):
    creadas: int
    omitidas: int
    hojas_procesadas: int
    hojas_omitidas: list[str]
    errores: list[str]


class ControlCajaDiarioResponse(BaseModel):
    fecha: str
    tipo: str
    total_ventas: Decimal
    efectivo_neto: Decimal
    entregas: Decimal
    efectivo_en_caja: Decimal
    cantidad_ventas: int

    @field_serializer("total_ventas", "efectivo_neto", "entregas", "efectivo_en_caja", when_used="json")
    def serialize_money(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


def cliente_to_report(cliente: Cliente | None) -> ClienteReporte | None:
    if cliente is None:
        return None
    return ClienteReporte(id=cliente.id, nombre=cliente.nombre, telefono=cliente.telefono)


def venta_to_report_item(venta: Venta) -> VentaReporteItem:
    return VentaReporteItem(
        id=venta.id,
        codigo_venta=resolve_sale_code(venta),
        fecha=venta.fecha_venta.isoformat(),
        empresa=venta.empresa,
        tipo=venta.tipo,
        numero_referencia=venta.numero_referencia,
        descripcion=venta.descripcion,
        cliente=cliente_to_report(venta.cliente),
        valor_total=to_money(venta.valor_total),
        estado=venta.estado,
        pagos=[
            PagoReporteItem(
                id=pago.id,
                medio=pago.medio,
                monto=to_money(pago.monto),
            )
            for pago in venta.pagos
        ],
    )


def parse_create_venta_payload(payload: dict) -> CreateVentaRequest:
    return CreateVentaRequest.model_validate(payload)


def parse_update_venta_payload(payload: dict) -> UpdateVentaRequest:
    return UpdateVentaRequest.model_validate(payload)


def venta_to_response(venta: Venta) -> VentaResponse:
    return VentaResponse(
        id=venta.id,
        codigo_venta=resolve_sale_code(venta),
        empresa=venta.empresa,
        tipo=venta.tipo,
        numero_referencia=venta.numero_referencia,
        descripcion=venta.descripcion,
        fecha_venta=venta.fecha_venta.isoformat(),
        valor_total=to_money(venta.valor_total),
        cliente_id=venta.cliente_id,
        estado=venta.estado,
        creado_en=venta.creado_en.isoformat(),
        modificado_en=venta.modificado_en.isoformat(),
        pagos=[
            PagoResponse(
                id=pago.id,
                venta_id=pago.venta_id,
                medio=pago.medio,
                monto=to_money(pago.monto),
            )
            for pago in venta.pagos
        ],
    )


def get_first_validation_message(exc: ValidationError) -> str:
    first_error = exc.errors()[0]
    location = ".".join(str(part) for part in first_error.get("loc", ()))
    message = first_error.get("msg", "Invalid payload")
    if location:
        return f"{location}: {message}"
    return message
