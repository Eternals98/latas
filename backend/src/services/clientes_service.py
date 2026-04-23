from __future__ import annotations

from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.api.schemas.clientes import CreateClienteRequest
from src.models import Cliente


class ClienteValidationError(Exception):
    pass


class ClienteDuplicateError(Exception):
    pass


def normalize_name(value: str) -> str:
    return value.strip().lower()


def normalize_search(value: str | None) -> str:
    if value is None:
        return ""
    return value.strip()


def find_cliente_by_normalized_name(db: Session, normalized_name: str) -> Cliente | None:
    stmt = select(Cliente).where(Cliente.nombre_normalizado == normalized_name)
    return db.execute(stmt).scalar_one_or_none()


def search_clientes(db: Session, search: str | None) -> list[Cliente]:
    trimmed = normalize_search(search)
    if not trimmed:
        return []

    lowered_search = trimmed.lower()
    start_match = f"{lowered_search}%"
    contains_match = f"%{lowered_search}%"

    relevance = case((func.lower(Cliente.nombre).like(start_match), 0), else_=1)
    stmt = (
        select(Cliente)
        .where(func.lower(Cliente.nombre).like(contains_match))
        .order_by(relevance, func.lower(Cliente.nombre).asc(), Cliente.id.asc())
        .limit(10)
    )
    return list(db.execute(stmt).scalars().all())


def create_cliente(db: Session, payload: CreateClienteRequest) -> Cliente:
    cleaned_name = payload.nombre.strip()
    if not cleaned_name:
        raise ClienteValidationError("nombre is required")

    normalized_name = normalize_name(cleaned_name)
    if find_cliente_by_normalized_name(db, normalized_name) is not None:
        raise ClienteDuplicateError("Ya existe un cliente con ese nombre.")

    try:
        cliente = Cliente(
            nombre=cleaned_name,
            telefono=payload.telefono,
            nombre_normalizado=normalized_name,
            estado="activo",
        )
        db.add(cliente)
        db.commit()
        db.refresh(cliente)
        return cliente
    except IntegrityError as exc:
        db.rollback()
        raise ClienteDuplicateError("Ya existe un cliente con ese nombre.") from exc
    except Exception:
        db.rollback()
        raise
