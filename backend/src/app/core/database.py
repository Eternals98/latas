"""
Database session and engine management.
Handles the connection to PostgreSQL/Supabase and provides database session generators.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# SQLAlchemy engine for database connectivity
engine = create_engine(
    settings.database_url,
    future=True,
)

# Session factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

def get_db():
    """
    Dependency that provides a database session.
    Ensures the session is closed after the request is processed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
