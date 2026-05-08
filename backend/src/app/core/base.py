"""
Base model for SQLAlchemy declarative base.
Provides the core foundation for all database models in the application.
"""
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    SQLAlchemy Declarative Base.
    All database models inherit from this class to enable ORM mapping.
    """
    pass
