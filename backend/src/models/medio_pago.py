from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class MedioPago(Base):
    __tablename__ = "medio_pago"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    modificado_en: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def __init__(self, **kwargs):
        codigo = kwargs.get("codigo")
        nombre = kwargs.get("nombre")

        if codigo is None or not str(codigo).strip():
            raise ValueError("codigo is required")

        if nombre is None or not str(nombre).strip():
            raise ValueError("nombre is required")

        kwargs["codigo"] = str(codigo).strip().lower()
        kwargs["nombre"] = str(nombre).strip()
        kwargs["activo"] = bool(kwargs.get("activo", True))

        super().__init__(**kwargs)
