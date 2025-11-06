#!/bin/sh
set -e

cd /app

# Run migrations (safe to run on every start)
python3 manage.py migrate --noinput

# Start Gunicorn
HOST="0.0.0.0"
PORT="${PORT:-8000}"
WORKERS="${GUNICORN_WORKERS:-3}"

exec gunicorn tar.wsgi:application \
  --bind ${HOST}:${PORT} \
  --workers ${WORKERS} \
  --access-logfile '-' --error-logfile '-'
