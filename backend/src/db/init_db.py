from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from src.db.base import Base
from src.db.session import SessionLocal, engine
from src.models import cliente, medio_pago, pago, venta  # noqa: F401
from src.services.medios_pago_service import ensure_initial_catalog


def _ensure_venta_fecha_venta_column() -> None:
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "venta" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("venta")}
    if "fecha_venta" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE venta ADD COLUMN fecha_venta DATE NOT NULL DEFAULT '1970-01-01'"))
        connection.execute(text("UPDATE venta SET fecha_venta = substr(creado_en, 1, 10) WHERE fecha_venta = '1970-01-01'"))


def _ensure_venta_codigo_venta_column() -> None:
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "venta" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("venta")}
    if "codigo_venta" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE venta ADD COLUMN codigo_venta VARCHAR(9)"))

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                UPDATE venta
                SET codigo_venta = (
                    SELECT printf(
                        '%03d%02d%04d',
                        ranked.seq,
                        CAST(strftime('%m', ranked.fecha_venta) AS INTEGER),
                        CAST(strftime('%Y', ranked.fecha_venta) AS INTEGER)
                    )
                    FROM (
                        SELECT
                            id,
                            fecha_venta,
                            ROW_NUMBER() OVER (
                                PARTITION BY strftime('%Y-%m', fecha_venta)
                                ORDER BY fecha_venta, id
                            ) AS seq
                        FROM venta
                    ) AS ranked
                    WHERE ranked.id = venta.id
                )
                WHERE codigo_venta IS NULL OR trim(codigo_venta) = ''
                """
            )
        )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_venta_fecha_venta_column()
    _ensure_venta_codigo_venta_column()
    session: Session = SessionLocal()
    try:
        ensure_initial_catalog(session)
    finally:
        session.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized")
