from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class Cliente(Base):
    __tablename__ = "cliente"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    telefono: Mapped[str] = mapped_column(String(40), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    ventas = relationship("Venta", back_populates="cliente")

    def __init__(self, **kwargs):
        nombre = kwargs.get("nombre")
        if nombre is None or not str(nombre).strip():
            raise ValueError("nombre is required")
        super().__init__(**kwargs)
