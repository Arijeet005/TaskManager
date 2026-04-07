from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, select
from sqlalchemy.orm import Session, selectinload

from .db import SessionLocal, init_db
from .models import Subtask, Task
from .schemas import (
  BulkIds,
  SubtaskCreate,
  SubtaskOut,
  SubtaskUpdate,
  TaskBulkUpdate,
  TaskCreate,
  TaskOut,
  TaskUpdate,
)
from .settings import settings


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()


DbDep = Annotated[Session, Depends(get_db)]

app = FastAPI(title="Task Management API", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()] or ["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
  init_db()


@app.get("/health")
def health():
  return {"ok": True}


def _task_query(include_subtasks: bool):
  query = select(Task).order_by(case((Task.status == 'completed', 1), else_=0), Task.created_at.desc())
  if include_subtasks:
    query = query.options(selectinload(Task.subtasks))
  return query


@app.get("/api/tasks", response_model=list[TaskOut])
def list_tasks(
  db: DbDep,
  status: str | None = Query(default=None),
  q: str | None = Query(default=None, min_length=1),
  include_subtasks: bool = Query(default=True),
):
  query = _task_query(include_subtasks)
  if status:
    query = query.where(Task.status == status)
  if q:
    like = f"%{q.strip()}%"
    query = query.where(Task.title.ilike(like) | Task.description.ilike(like))
  return list(db.scalars(query).all())


@app.get("/api/tasks/{task_id}", response_model=TaskOut)
def get_task(
  task_id: str,
  db: DbDep,
  include_subtasks: bool = Query(default=True),
):
  query = select(Task).where(Task.id == task_id)
  if include_subtasks:
    query = query.options(selectinload(Task.subtasks))
  task = db.scalars(query).first()
  if not task:
    raise HTTPException(status_code=404, detail="Task not found.")
  return task


@app.post("/api/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: DbDep):
  task = Task(
    title=payload.title,
    description=payload.description,
    status=payload.status,
    progress=payload.progress,
    category=payload.category,
    priority=payload.priority,
    due_date=payload.due_date,
  )
  if payload.status == "completed" or payload.progress == 100:
    task.status = "completed"
    task.progress = 100
    task.completed_at = datetime.now(timezone.utc)
  db.add(task)
  db.commit()
  db.refresh(task)
  return task


@app.post("/api/tasks/bulk", response_model=list[TaskOut], status_code=status.HTTP_201_CREATED)
def create_tasks_bulk(payload: list[TaskCreate], db: DbDep):
  if not payload:
    raise HTTPException(status_code=400, detail="Payload must contain at least one task.")
  tasks: list[Task] = []
  now = datetime.now(timezone.utc)
  for item in payload:
    task = Task(
      title=item.title,
      description=item.description,
      status=item.status,
      progress=item.progress,
      category=item.category,
      priority=item.priority,
      due_date=item.due_date,
    )
    if item.status == "completed" or item.progress == 100:
      task.status = "completed"
      task.progress = 100
      task.completed_at = now
    tasks.append(task)
  db.add_all(tasks)
  db.commit()
  for task in tasks:
    db.refresh(task)
  return tasks


@app.patch("/api/tasks/bulk", response_model=list[TaskOut])
def update_tasks_bulk(payload: TaskBulkUpdate, db: DbDep):
  ids = list(dict.fromkeys(payload.ids))
  tasks = list(db.scalars(select(Task).where(Task.id.in_(ids))).all())
  tasks_by_id = {t.id: t for t in tasks}
  missing = [task_id for task_id in ids if task_id not in tasks_by_id]
  if missing:
    raise HTTPException(status_code=404, detail={"message": "Some tasks not found.", "missing": missing})

  data = payload.data.model_dump(exclude_unset=True)
  if "due_date" in data and data["due_date"] is not None:
    violating_task_ids = list(
      db.scalars(
        select(Subtask.task_id)
        .where(
          Subtask.task_id.in_(ids),
          Subtask.due_date.is_not(None),
          Subtask.due_date >= data["due_date"],
        )
        .distinct()
      ).all()
    )
    if violating_task_ids:
      raise HTTPException(
        status_code=400,
        detail={
          "message": "Task due date must be after all subtask due dates.",
          "task_ids": violating_task_ids,
        },
      )
  now = datetime.now(timezone.utc)
  for task in tasks:
    for key, value in data.items():
      setattr(task, key, value)
    if "progress" in data:
      if task.progress >= 100:
        task.progress = 100
        task.status = "completed"
        task.completed_at = task.completed_at or now
      elif task.progress > 0 and task.status == "pending":
        task.status = "in-progress"
    if data.get("status") == "completed":
      task.progress = 100
      task.completed_at = task.completed_at or now

  db.commit()
  for task in tasks:
    db.refresh(task)
  return tasks


@app.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: str, payload: TaskUpdate, db: DbDep):
  task = db.get(Task, task_id)
  if not task:
    raise HTTPException(status_code=404, detail="Task not found.")

  data = payload.model_dump(exclude_unset=True)
  if "due_date" in data and data["due_date"] is not None:
    violating = list(
      db.scalars(
        select(Subtask.id).where(
          Subtask.task_id == task_id,
          Subtask.due_date.is_not(None),
          Subtask.due_date >= data["due_date"],
        )
      ).all()
    )
    if violating:
      raise HTTPException(status_code=400, detail="Task due date must be after all subtask due dates.")
  for key, value in data.items():
    setattr(task, key, value)

  if payload.progress is not None:
    if payload.progress >= 100:
      task.progress = 100
      task.status = "completed"
      task.completed_at = task.completed_at or datetime.now(timezone.utc)
    elif payload.progress > 0 and task.status == "pending":
      task.status = "in-progress"

  if payload.status == "completed":
    task.progress = 100
    task.completed_at = task.completed_at or datetime.now(timezone.utc)
  if payload.status in ("pending", "in-progress") and task.progress == 100:
    task.progress = 0
    task.completed_at = None

  db.commit()
  db.refresh(task)
  return task


@app.delete("/api/tasks/bulk", status_code=status.HTTP_204_NO_CONTENT)
def delete_tasks_bulk(payload: BulkIds, db: DbDep):
  ids = list(dict.fromkeys(payload.ids))
  tasks = list(db.scalars(select(Task).where(Task.id.in_(ids))).all())
  if len(tasks) != len(ids):
    found = {t.id for t in tasks}
    missing = [i for i in ids if i not in found]
    raise HTTPException(status_code=404, detail={"message": "Some tasks not found.", "missing": missing})
  for task in tasks:
    db.delete(task)
  db.commit()
  return None


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: DbDep):
  task = db.get(Task, task_id)
  if not task:
    raise HTTPException(status_code=404, detail="Task not found.")
  db.delete(task)
  db.commit()
  return None


@app.post("/api/tasks/{task_id}/subtasks", response_model=SubtaskOut, status_code=status.HTTP_201_CREATED)
def create_subtask(task_id: str, payload: SubtaskCreate, db: DbDep):
  task = db.get(Task, task_id)
  if not task:
    raise HTTPException(status_code=404, detail="Task not found.")
  if payload.due_date is not None and task.due_date is not None and payload.due_date >= task.due_date:
    raise HTTPException(status_code=400, detail="Subtask due date must be before the parent task due date.")
  subtask = Subtask(task_id=task_id, title=payload.title)
  if payload.due_date is not None:
    subtask.due_date = payload.due_date
  db.add(subtask)
  db.commit()
  db.refresh(subtask)
  return subtask


@app.patch("/api/subtasks/{subtask_id}", response_model=SubtaskOut)
def update_subtask(subtask_id: str, payload: SubtaskUpdate, db: DbDep):
  subtask = db.get(Subtask, subtask_id)
  if not subtask:
    raise HTTPException(status_code=404, detail="Subtask not found.")
  data = payload.model_dump(exclude_unset=True)
  if "due_date" in data:
    task = db.get(Task, subtask.task_id)
    if task and data["due_date"] is not None and task.due_date is not None and data["due_date"] >= task.due_date:
      raise HTTPException(status_code=400, detail="Subtask due date must be before the parent task due date.")
  for key, value in data.items():
    setattr(subtask, key, value)
  db.commit()
  db.refresh(subtask)
  return subtask


@app.delete("/api/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(subtask_id: str, db: DbDep):
  subtask = db.get(Subtask, subtask_id)
  if not subtask:
    raise HTTPException(status_code=404, detail="Subtask not found.")
  db.delete(subtask)
  db.commit()
  return None
