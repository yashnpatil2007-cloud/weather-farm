"""Lightweight, idempotent schema migrations for SQLite.

`Base.metadata.create_all` creates missing tables but does NOT add columns to
existing tables. This module runs small ALTER TABLE statements to bring an
existing prototype database up to date without wiping farmer data.

For production PostgreSQL deployments, consider using Alembic migrations.
"""
from sqlalchemy import text

from .database import engine


def _column_exists(table: str, column: str) -> bool:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return any(row[1] == column for row in rows)


def run_migrations() -> None:
    if engine.dialect.name != "sqlite":
        return  # use Alembic for PostgreSQL
    if not _column_exists("users", "preferred_language"):
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(8) DEFAULT 'en' NOT NULL"))
            conn.commit()
