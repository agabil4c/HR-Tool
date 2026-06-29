#!/bin/sh
set -e

# Run alembic migrations
echo "Running alembic migrations..."
alembic upgrade head

# Start uvicorn server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
