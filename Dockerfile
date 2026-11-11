# AyuAahar API - production-style image (also used by docker-compose for local dev)
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PORT=5000
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 5000
# Migrate + idempotent seed, then serve with gunicorn
CMD ["sh", "-c", "alembic upgrade head && python seed.py && exec gunicorn app:app --bind 0.0.0.0:${PORT} --workers 2 --threads 4 --timeout 120"]
