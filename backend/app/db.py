from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .settings import settings


class Base(DeclarativeBase):
  pass


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
  from . import models  # noqa: F401

  Base.metadata.create_all(bind=engine)
  _migrate_sqlite()


def _migrate_sqlite() -> None:
  if not settings.database_url.startswith("sqlite"):
    return

  with engine.connect() as conn:
    try:
      cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(subtasks)").fetchall()]
      if "due_date" not in cols:
        conn.exec_driver_sql("ALTER TABLE subtasks ADD COLUMN due_date DATETIME")
        conn.commit()
    except Exception:
      # Best-effort migration for local SQLite dev DB.
      return
