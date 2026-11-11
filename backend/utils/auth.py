# AyuAahar - Authentication utilities
from datetime import UTC, datetime, timedelta
from functools import wraps

import bcrypt
import jwt
from flask import abort, current_app, request
from werkzeug.security import check_password_hash


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    if hashed.startswith("$2"):
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    # Legacy Werkzeug (pbkdf2/scrypt) hashes created before the bcrypt switch
    return check_password_hash(hashed, password)


def generate_token(user_id: int, role: str, secret_key: str) -> str:
    now = datetime.now(UTC)
    payload = {"sub": str(user_id), "role": role, "iat": now, "exp": now + timedelta(days=7)}
    return jwt.encode(payload, secret_key, algorithm="HS256")


def decode_token(token: str, secret_key: str):
    try:
        return jwt.decode(token, secret_key, algorithms=["HS256"], options={"require": ["exp", "sub"]})
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Require a valid Bearer token; exposes request.user_id / request.user_role."""

    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        scheme, _, token = header.partition(" ")
        if scheme.lower() != "bearer" or not token:
            abort(401, description="Authentication required")
        payload = decode_token(token, current_app.config["SECRET_KEY"])
        if not payload:
            abort(401, description="Session expired or invalid. Please sign in again.")
        request.user_id = int(payload["sub"])
        request.user_role = payload.get("role")
        return f(*args, **kwargs)

    return decorated


def dietitian_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user_role != "dietitian":
            abort(403, description="Dietitian access required")
        return f(*args, **kwargs)

    return decorated


def can_access_patient(patient) -> bool:
    """Dietitians see their own patients; patients see only their own record."""
    if request.user_role == "dietitian":
        return patient.user_id == request.user_id
    return patient.patient_user_id == request.user_id


def get_patient_or_404(patient_id: int):
    from models import Patient, db

    patient = db.session.get(Patient, patient_id)
    if not patient or not can_access_patient(patient):
        # 404 (not 403) so ids of other practitioners' patients are not disclosed
        abort(404, description="Patient not found")
    return patient
