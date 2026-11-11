# AyuAahar - environment-driven configuration helpers
import os
import re

_SCHEMA_RE = re.compile(r"^[a-z_][a-z0-9_]*$")


def database_url() -> str:
    url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ayuaahar")
    # Render/Heroku style URLs use the deprecated postgres:// scheme
    return re.sub(r"^postgres://", "postgresql://", url)


def db_schema() -> str:
    schema = os.environ.get("DB_SCHEMA", "ayuadhar").lower()
    if not _SCHEMA_RE.match(schema):
        raise RuntimeError("DB_SCHEMA must be a simple lowercase identifier")
    return schema


def is_production() -> bool:
    return os.environ.get("APP_ENV", os.environ.get("FLASK_ENV", "development")) == "production"
