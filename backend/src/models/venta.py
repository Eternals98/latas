from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class EmpresaEnum(str, Enum):
    LATAS_SAS = "latas_sas"
    TOMAS_GOMEZ = "tomas_gomez"


class TipoVentaEnum(str, Enum):
    FORMAL = "formal"
    INFORMAL = "informal"


class EstadoVentaEnum(str, Enum):
    ACTIVO = "activo"
    ANULADO = "anulado"


class Venta(Base):
    __tablename__ = "venta"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    empresa: Mapped[str] = mapped_column(String(32), nullable=False)
    tipo: Mapped[str] = mapped_column(String(16), nullable=False)
    numero_referencia: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str] = mapped_column(String, nullable=False)
    fecha_venta: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    valor_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("cliente.id"), nullable=True)
    estado: Mapped[str] = mapped_column(String(16), default=EstadoVentaEnum.ACTIVO.value, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    modificado_en: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    cliente = relationship("Cliente", back_populates="ventas", foreign_keys=[cliente_id])
    pagos = relationship("Pago", back_populates="venta", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        valor_total = kwargs.get("valor_total")
        if valor_total is not None and Decimal(str(valor_total)) < 0:
            raise ValueError("valor_total must be >= 0")
        super().__init__(**kwargs)
