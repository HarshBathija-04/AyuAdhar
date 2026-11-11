# AyuAahar - Authentication routes
from flask import Blueprint, abort, current_app, jsonify, request

from extensions import limiter
from models import Patient, User, db
from schemas import LoginIn, ProfileUpdateIn, RegisterIn, parse
from utils.auth import generate_token, hash_password, token_required, verify_password

auth_bp = Blueprint("auth", __name__)

# Equalises timing between "unknown email" and "wrong password"
_DUMMY_HASH = hash_password("timing-equaliser")


def _session(user: User, status: int, message: str):
    token = generate_token(user.id, user.role, current_app.config["SECRET_KEY"])
    return jsonify(message=message, user=user.to_dict(), token=token), status


@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data = parse(RegisterIn)
    email = data.email.lower()
    if User.query.filter(db.func.lower(User.email) == email).first():
        abort(409, description="Email already registered")

    user = User(name=data.name, email=email, password=hash_password(data.password), role=data.role)
    db.session.add(user)
    db.session.flush()

    if user.role == "patient":
        dietitian = User.query.filter_by(role="dietitian").order_by(User.id).first()
        db.session.add(
            Patient(
                # Without any dietitian yet, the patient owns their own record so the FK stays valid
                user_id=dietitian.id if dietitian else user.id,
                patient_user_id=user.id,
                name=data.name,
                age=data.age,
                gender=data.gender,
                weight_kg=data.weight_kg,
                height_cm=data.height_cm,
                prakriti=data.prakriti or "Not Known",
                condition=data.condition or "",
                lifestyle="",
            )
        )
    db.session.commit()
    return _session(user, 201, "User registered successfully")


@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    data = parse(LoginIn)
    user = User.query.filter(db.func.lower(User.email) == data.email.lower()).first()
    if not verify_password(data.password, user.password if user else _DUMMY_HASH) or not user:
        abort(401, description="Invalid email or password")
    return _session(user, 200, "Login successful")


@auth_bp.get("/profile")
@token_required
def get_profile():
    user = db.session.get(User, request.user_id)
    if not user:
        abort(404, description="User not found")
    return jsonify(user=user.to_dict()), 200


@auth_bp.put("/profile")
@token_required
def update_profile():
    user = db.session.get(User, request.user_id)
    if not user:
        abort(404, description="User not found")
    user.name = parse(ProfileUpdateIn).name
    db.session.commit()
    return jsonify(message="Profile updated successfully", user=user.to_dict()), 200
