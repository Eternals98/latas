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
            empresa="tomas_gomez",
            tipo="informal",
            numero_referencia="REL-001",
            descripcion="Validacion de relaciones",
            valor_total=300,
            cliente_id=None,
            estado="activo",
        )
        db.add(venta)
        db.flush()

        pago = Pago(venta_id=venta.id, medio="efectivo", monto=300)
        db.add(pago)
        db.commit()

        assert venta.id is not None
        assert pago.id is not None
        print("Relations validated")
    finally:
        db.close()


if __name__ == "__main__":
    main()
