from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.schemas.medios_pago import MedioPagoResponse, medios_pago_to_response
from src.db.session import get_db
from src.services.medios_pago_service import list_active_medios_pago

router = APIRouter(prefix="/api/medios-pago", tags=["MediosPago"])

_MEDIOS_PAGO_RESPONSE_EXAMPLE = [
    {
        "id": 1,
        "codigo": "efectivo",
        "nombre": "Efectivo",
        "activo": True,
        "creado_en": "2026-04-23T15:10:00",
        "modificado_en": "2026-04-23T15:10:00",
    }
]


@router.get(
    "",
    response_model=list[MedioPagoResponse],
    responses={
        200: {
            "description": "Lista de medios de pago activos para consumo de selectores frontend.",
            "content": {"application/json": {"example": _MEDIOS_PAGO_RESPONSE_EXAMPLE}},
        }
    },
)
def list_medios_pago_api(db: Session = Depends(get_db)) -> list[MedioPagoResponse]:
    medios_pago = list_active_medios_pago(db=db)
    return medios_pago_to_response(medios_pago)
