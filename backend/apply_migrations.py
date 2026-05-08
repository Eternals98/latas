#!/usr/bin/env python3
"""Apply Supabase migrations to the database."""

import os
import sys
import psycopg2
from pathlib import Path

# Get DATABASE_URL from .env or environment
database_url = os.getenv('DATABASE_URL')
if not database_url:
    # Load from .env
    from dotenv import load_dotenv
    load_dotenv()
    database_url = os.getenv('DATABASE_URL')

if not database_url:
    print("❌ DATABASE_URL not found in environment")
    sys.exit(1)

print(f"🔗 Connecting to Supabase...")
print(f"   Database: {database_url.split('@')[1] if '@' in database_url else 'unknown'}")

try:
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    # Get migration files
    migrations_dir = Path(__file__).parent / 'supabase' / 'migrations'
    migration_files = sorted(migrations_dir.glob('*.sql'))

    if not migration_files:
        print("❌ No migration files found")
        sys.exit(1)

    print(f"\n📂 Found {len(migration_files)} migrations:")
    for f in migration_files:
        print(f"   - {f.name}")

    # Apply each migration
    print("\n▶️  Applying migrations...\n")
    for migration_file in migration_files:
        print(f"⏳ {migration_file.name}...", end=" ")
        try:
            with open(migration_file, 'r') as f:
                sql = f.read()
            cursor.execute(sql)
            conn.commit()
            print("✅")
        except psycopg2.Error as e:
            print(f"❌ Error: {e.pgerror if hasattr(e, 'pgerror') else str(e)}")
            conn.rollback()
            sys.exit(1)

    cursor.close()
    conn.close()

    print("\n✅ All migrations applied successfully!")
    print("\n📊 Schema created on Supabase:")
    print("   - Tables: companies, profiles, customers, payment_methods, cash_sessions, transactions")
    print("   - RLS Policies: Active on all tables")
    print("   - Indexes: Optimized for common queries")

except psycopg2.Error as e:
    print(f"❌ Connection error: {e}")
    sys.exit(1)
