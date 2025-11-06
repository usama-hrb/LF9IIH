FROM python:3.12-slim AS base

# Environment optimizations
ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PIP_NO_CACHE_DIR=on \
	POETRY_VERSION=none

# System deps needed for cryptography / bcrypt wheels build fallback
RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential libffi-dev libssl-dev curl \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python deps first (better layer caching)
COPY app/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip \
	&& pip install -r /tmp/requirements.txt

# Copy project (only what we need for runtime)
COPY app /app

# Expose port
EXPOSE 8000

# Entry script runs migrations then starts gunicorn
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV DJANGO_SETTINGS_MODULE=tar.settings \
	GUNICORN_WORKERS=3 \
	SQLITE_PATH=/data/db.sqlite3

# Create mount point directory (Render persistent disk will attach here if configured)
RUN mkdir -p /data && chown -R root:root /data

ENTRYPOINT ["/entrypoint.sh"]