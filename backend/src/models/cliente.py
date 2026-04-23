from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class Cliente(Base):
    __tablename__ = "cliente"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    telefono: Mapped[str] = mapped_column(String(40), nullable=True)
    nombre_normalizado: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    estado: Mapped[str] = mapped_column(String(16), default="activo", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    modificado_en: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    ventas = relationship("Venta", back_populates="cliente")

    def __init__(self, **kwargs):
        nombre = kwargs.get("nombre")
        if nombre is None or not str(nombre).strip():
            raise ValueError("nombre is required")

        cleaned_name = str(nombre).strip()
        kwargs["nombre"] = cleaned_name

        telefono = kwargs.get("telefono")
        if telefono is not None:
            cleaned_phone = str(telefono).strip()
            kwargs["telefono"] = cleaned_phone or None

        kwargs["nombre_normalizado"] = kwargs.get("nombre_normalizado") or cleaned_name.lower()
        super().__init__(**kwargs)
