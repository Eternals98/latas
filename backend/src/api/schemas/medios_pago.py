from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from src.models import MedioPago


class MedioPagoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    activo: bool
    creado_en: str
    modificado_en: str


def medio_pago_to_response(medio_pago: MedioPago) -> MedioPagoResponse:
    return MedioPagoResponse(
        id=medio_pago.id,
        codigo=medio_pago.codigo,
        nombre=medio_pago.nombre,
        activo=medio_pago.activo,
        creado_en=medio_pago.creado_en.isoformat(),
        modificado_en=medio_pago.modificado_en.isoformat(),
    )


def medios_pago_to_response(medios_pago: list[MedioPago]) -> list[MedioPagoResponse]:
    return [medio_pago_to_response(medio_pago) for medio_pago in medios_pago]
