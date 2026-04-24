from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from src.models import Cliente


class CreateClienteRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=160)
    telefono: str | None = Field(default=None, max_length=40)

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("nombre is required")
        return cleaned

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ClienteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    telefono: str | None
    creado_en: str
    modificado_en: str
    estado: str


class ErrorResponse(BaseModel):
    detail: str


class UpdateClienteRequest(CreateClienteRequest):
    pass


def parse_create_cliente_payload(payload: dict) -> CreateClienteRequest:
    return CreateClienteRequest.model_validate(payload)


def parse_update_cliente_payload(payload: dict) -> UpdateClienteRequest:
    return UpdateClienteRequest.model_validate(payload)


def cliente_to_response(cliente: Cliente) -> ClienteResponse:
    return ClienteResponse(
        id=cliente.id,
        nombre=cliente.nombre,
        telefono=cliente.telefono,
        creado_en=cliente.creado_en.isoformat(),
        modificado_en=cliente.modificado_en.isoformat(),
        estado=cliente.estado,
    )


def clientes_to_response(clientes: list[Cliente]) -> list[ClienteResponse]:
    return [cliente_to_response(cliente) for cliente in clientes]


def get_first_validation_message(exc: ValidationError) -> str:
    first_error = exc.errors()[0]
    location = ".".join(str(part) for part in first_error.get("loc", ()))
    message = first_error.get("msg", "Invalid payload")
    if location:
        return f"{location}: {message}"
    return message
