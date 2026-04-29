import argparse
import sqlite3
from decimal import Decimal

import psycopg


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite-path", required=True)
    parser.add_argument("--pg-dsn", required=True)
    return parser.parse_args()


def fetch_all(sqlite_conn, table):
    cur = sqlite_conn.cursor()
    cur.execute(f"select * from {table}")
    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    return columns, rows


def migrate_table(pg_conn, sqlite_conn, table, columns):
    _, rows = fetch_all(sqlite_conn, table)
    if not rows:
        return 0
    placeholders = ", ".join(["%s"] * len(columns))
    sql = f"insert into public.{table} ({', '.join(columns)}) values ({placeholders}) on conflict do nothing"
    with pg_conn.cursor() as cur:
        cur.executemany(sql, rows)
    return len(rows)


def validate(sqlite_conn, pg_conn):
    tables = ["cliente", "medio_pago", "venta", "pago"]
    for table in tables:
        s_cur = sqlite_conn.cursor()
        s_cur.execute(f"select count(*) from {table}")
        sqlite_count = s_cur.fetchone()[0]
        p_cur = pg_conn.cursor()
        p_cur.execute(f"select count(*) from public.{table}")
        pg_count = p_cur.fetchone()[0]
        print(f"{table}: sqlite={sqlite_count}, postgres={pg_count}")

    s_cur = sqlite_conn.cursor()
    s_cur.execute("select coalesce(sum(valor_total), 0) from venta")
    sqlite_total = Decimal(str(s_cur.fetchone()[0]))
    p_cur = pg_conn.cursor()
    p_cur.execute("select coalesce(sum(valor_total), 0) from public.venta")
    pg_total = Decimal(str(p_cur.fetchone()[0]))
    print(f"venta.valor_total sum: sqlite={sqlite_total} postgres={pg_total}")


def main():
    args = parse_args()
    sqlite_conn = sqlite3.connect(args.sqlite_path)
    pg_conn = psycopg.connect(args.pg_dsn)
    pg_conn.autocommit = False
    try:
        with pg_conn.cursor() as cur:
            cur.execute("truncate table public.pago, public.venta, public.cliente, public.medio_pago restart identity cascade")

        migrate_table(
            pg_conn,
            sqlite_conn,
            "cliente",
            ["id", "nombre", "telefono", "nombre_normalizado", "estado", "creado_en", "modificado_en"],
        )
        migrate_table(
            pg_conn,
            sqlite_conn,
            "medio_pago",
            ["id", "codigo", "nombre", "activo", "creado_en", "modificado_en"],
        )
        migrate_table(
            pg_conn,
            sqlite_conn,
            "venta",
            [
                "id",
                "empresa",
                "tipo",
                "numero_referencia",
                "codigo_venta",
                "descripcion",
                "fecha_venta",
                "valor_total",
                "cliente_id",
                "estado",
                "creado_en",
                "modificado_en",
            ],
        )
        migrate_table(pg_conn, sqlite_conn, "pago", ["id", "venta_id", "medio", "monto"])
        pg_conn.commit()
        validate(sqlite_conn, pg_conn)
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
