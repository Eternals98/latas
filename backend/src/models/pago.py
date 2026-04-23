from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class Pago(Base):
    __tablename__ = "pago"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("venta.id", ondelete="CASCADE"), nullable=False)
    medio: Mapped[str] = mapped_column(String(60), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    venta = relationship("Venta", back_populates="pagos")

    def __init__(self, **kwargs):
        monto = kwargs.get("monto")
        if monto is None or Decimal(str(monto)) <= 0:
            raise ValueError("monto must be > 0")
        super().__init__(**kwargs)
