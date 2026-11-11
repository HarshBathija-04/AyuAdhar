# Alembic environment: every table lives in the Postgres schema named by DB_SCHEMA
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

from config import database_url, db_schema  # noqa: E402
from models import db  # noqa: E402

if context.config.config_file_name:
    fileConfig(context.config.config_file_name)

SCHEMA = db_schema()


def run_migrations_online() -> None:
    engine = create_engine(database_url(), connect_args={"options": f"-csearch_path={SCHEMA}"})
    with engine.connect() as connection:
        connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA}"'))
        connection.commit()
        context.configure(
            connection=connection,
            target_metadata=db.metadata,
            version_table_schema=SCHEMA,
            compare_type=True,
            include_object=lambda obj, name, type_, reflected, compare_to: name != "alembic_version",
        )
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
