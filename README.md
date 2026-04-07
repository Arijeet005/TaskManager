# Task Manager (React + FastAPI + SQLite)

Simple task management app focused on **multi-select** and **bulk actions** (complete, set progress, delete), plus **subtasks**.

## Tech Stack

- Frontend: React + TypeScript (Vite)
- Backend: FastAPI (Python)
- Database: SQLite (local) - compatible with Postgres for deployment

## Local Setup

### Prerequisites

- Node.js + npm
- Python 3

### 1) Backend (FastAPI)

PowerShell shortcuts (recommended):

```powershell
npm run backend:setup
npm run backend:dev
```

Manual setup:

```powershell
cd backend
python -m venv .venv
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Optional env vars (create `backend/.env.local`):

```bash
DATABASE_URL=sqlite:///./tasks.db
CORS_ORIGINS=http://localhost:3000
```

### 2) Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Optional: create `frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:8000
```

## Database

- Default database is a local SQLite file at `backend/tasks.db`.
- On startup, the backend creates tables and applies a best-effort SQLite migration for new columns (dev-only convenience).

## Core Features

- Create tasks (single + multiple at once)
- View tasks with status, priority, category, due date, and progress
- Edit a task (includes single-task Complete / Progress / Delete actions)
- Multi-select tasks + bulk actions:
  - Set progress
  - Mark completed
  - Delete
- Subtasks under a task (create/toggle/delete) with optional due dates
  - Rule: subtask due date must be **before** the parent task due date

## API

Backend runs at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`

## Deploy (Vercel)

This repo includes a `vercel.json` and a Python serverless entry at `api/[...path].py` so the FastAPI backend is deployed at the same origin under `/api/*`.

Important: SQLite is not suitable for Vercel serverless (filesystem is ephemeral). For production, set `DATABASE_URL` to a hosted Postgres database in Vercel Project Settings.

Recommended Vercel env vars:

- `DATABASE_URL`: your hosted Postgres connection string
- `CORS_ORIGINS`: your Vercel URL (or leave default when frontend + API share the same origin)
