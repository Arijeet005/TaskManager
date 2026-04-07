from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["pending", "in-progress", "completed"]
PriorityLevel = Literal["Low", "Medium", "High"]


class SubtaskCreate(BaseModel):
  title: str = Field(min_length=1, max_length=200)
  due_date: datetime | None = None


class SubtaskUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=1, max_length=200)
  is_done: bool | None = None
  due_date: datetime | None = None


class SubtaskOut(BaseModel):
  id: str
  task_id: str
  title: str
  is_done: bool
  due_date: datetime | None = None
  created_at: datetime

  model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
  title: str = Field(min_length=1, max_length=200)
  description: str | None = None
  status: TaskStatus = "pending"
  progress: int = Field(default=0, ge=0, le=100)
  category: str | None = Field(default=None, max_length=64)
  priority: PriorityLevel | None = None
  due_date: datetime | None = None


class TaskUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=1, max_length=200)
  description: str | None = None
  status: TaskStatus | None = None
  progress: int | None = Field(default=None, ge=0, le=100)
  category: str | None = Field(default=None, max_length=64)
  priority: PriorityLevel | None = None
  due_date: datetime | None = None
  completed_at: datetime | None = None


class TaskOut(BaseModel):
  id: str
  title: str
  description: str | None
  status: TaskStatus
  progress: int
  category: str | None
  priority: PriorityLevel | None
  due_date: datetime | None
  created_at: datetime
  updated_at: datetime
  completed_at: datetime | None
  subtasks: list[SubtaskOut] = []

  model_config = {"from_attributes": True}


class BulkIds(BaseModel):
  ids: list[str] = Field(min_length=1)


class TaskBulkUpdate(BaseModel):
  ids: list[str] = Field(min_length=1)
  data: TaskUpdate
