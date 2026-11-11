import os
import sys

import pytest

# Isolated schema in the configured Postgres; never touches the app's real schema
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/portfolio"
)
os.environ["DB_SCHEMA"] = "ayuadhar_test"
os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-bytes-long"
os.environ["GROQ_API_KEY"] = "test-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text  # noqa: E402

from app import create_app  # noqa: E402
from models import db  # noqa: E402


@pytest.fixture(scope="session")
def app():
    app = create_app({"TESTING": True, "RATELIMIT_ENABLED": False})
    with app.app_context():
        db.session.execute(text('DROP SCHEMA IF EXISTS "ayuadhar_test" CASCADE'))
        db.session.execute(text('CREATE SCHEMA "ayuadhar_test"'))
        db.session.commit()
        db.create_all()
        from seed import seed

        seed()
        yield app
        db.session.remove()
        db.session.execute(text('DROP SCHEMA IF EXISTS "ayuadhar_test" CASCADE'))
        db.session.commit()


@pytest.fixture()
def client(app):
    return app.test_client()


def _login(client, email):
    res = client.post("/api/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200, res.get_json()
    return {"Authorization": f"Bearer {res.get_json()['token']}"}


@pytest.fixture()
def dietitian(client):
    return _login(client, "dietitian@ayuaahar.com")


@pytest.fixture()
def patient(client):
    return _login(client, "patient@ayuaahar.com")
