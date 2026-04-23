from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.db.session import SessionLocal
from src.models import Pago, Venta


def main() -> None:
    db = SessionLocal()
    try:
        venta = Venta(
            empresa="latas_sas",
            tipo="formal",
            numero_referencia="MULTI-001",
            descripcion="Venta con multiples pagos",
            valor_total=1000,
            cliente_id=None,
            estado="activo",
        )
        db.add(venta)
        db.flush()

        db.add_all(
            [
                Pago(venta_id=venta.id, medio="efectivo", monto=500),
                Pago(venta_id=venta.id, medio="nequi", monto=500),
            ]
        )
        db.commit()

        db.refresh(venta)
        assert len(venta.pagos) >= 2
        print("Multi-payment scenario validated")
    finally:
        db.close()


if __name__ == "__main__":
    main()
