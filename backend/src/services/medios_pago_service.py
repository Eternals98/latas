from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models import MedioPago

INITIAL_MEDIOS_PAGO: tuple[tuple[str, str], ...] = (
    ("efectivo", "Efectivo"),
    ("entrega", "Entrega"),
    ("tarjeta_latas", "Tarjeta Latas"),
    ("tarjeta_tomas", "Tarjeta Tomas"),
    ("bancolombia_latas", "Bancolombia Latas"),
    ("bancolombia_tomas", "Bancolombia Tomas"),
    ("bbva_latas", "BBVA Latas"),
    ("bbva_tomas", "BBVA Tomas"),
    ("nequi", "Nequi"),
    ("davivienda", "Davivienda"),
    ("otro", "Otro"),
)


def _active_medios_pago_stmt():
    return (
        select(MedioPago)
        .where(MedioPago.activo.is_(True))
        .order_by(func.lower(MedioPago.nombre).asc(), MedioPago.id.asc())
    )


def list_active_medios_pago(db: Session) -> list[MedioPago]:
    return list(db.execute(_active_medios_pago_stmt()).scalars().all())


def ensure_initial_catalog(db: Session) -> None:
    existing_codes = set(db.execute(select(MedioPago.codigo)).scalars().all())

    for codigo, nombre in INITIAL_MEDIOS_PAGO:
        if codigo in existing_codes:
            continue
        db.add(MedioPago(codigo=codigo, nombre=nombre, activo=True))

    db.commit()
