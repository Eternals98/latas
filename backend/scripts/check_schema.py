from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.db.base import Base
from src.db.session import engine
from src.models import Cliente, Pago, Venta  # noqa: F401


def main() -> None:
    Base.metadata.create_all(bind=engine)
    tables = set(Base.metadata.tables.keys())
    expected = {"cliente", "venta", "pago"}

    missing = expected - tables
    if missing:
        raise SystemExit(f"Missing tables: {sorted(missing)}")

    print("Schema check passed")


if __name__ == "__main__":
    main()
