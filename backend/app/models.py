from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Task(Base):
  __tablename__ = "tasks"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)

  status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
  progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

  category: Mapped[str | None] = mapped_column(String(64), nullable=True)
  priority: Mapped[str | None] = mapped_column(String(32), nullable=True)
  due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    onupdate=func.now(),
    nullable=False,
  )
  completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

  subtasks: Mapped[list["Subtask"]] = relationship(
    "Subtask",
    back_populates="task",
    cascade="all, delete-orphan",
    passive_deletes=True,
  )


class Subtask(Base):
  __tablename__ = "subtasks"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  is_done: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
  due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

  task: Mapped["Task"] = relationship("Task", back_populates="subtasks")
