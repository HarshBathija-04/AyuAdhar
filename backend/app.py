# AyuAahar - Flask application factory
import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pydantic import ValidationError
from sqlalchemy import text
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()

from config import database_url, db_schema, is_production  # noqa: E402
from extensions import limiter  # noqa: E402
from models import db  # noqa: E402
from routes.ai import ai_bp  # noqa: E402
from routes.appointments import appointments_bp  # noqa: E402
from routes.auth import auth_bp  # noqa: E402
from routes.diet_plans import diet_plans_bp  # noqa: E402
from routes.patients import patients_bp  # noqa: E402
from routes.progress import progress_bp  # noqa: E402

log = logging.getLogger("ayuaahar")


def create_app(overrides: dict | None = None) -> Flask:
    app = Flask(__name__)

    secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY")
    if not secret:
        if is_production():
            raise RuntimeError("JWT_SECRET must be set in production")
        secret = "dev-only-insecure-secret"
    schema = db_schema()

    app.config.update(
        SECRET_KEY=secret,
        SQLALCHEMY_DATABASE_URI=database_url(),
        SQLALCHEMY_ENGINE_OPTIONS={
            "pool_pre_ping": True,
            "pool_recycle": 280,
            "connect_args": {"options": f"-csearch_path={schema}"},
        },
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        DB_SCHEMA=schema,
        MAX_CONTENT_LENGTH=1 * 1024 * 1024,
    )
    app.json.sort_keys = False
    if overrides:
        app.config.update(overrides)

    origins = [
        o.strip().rstrip("/") for o in os.environ.get("FRONTEND_URL", "http://localhost:5173").split(",") if o.strip()
    ]
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=600,
    )

    # Render terminates TLS at a proxy; trust one hop so rate limits key on the real client IP
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    db.init_app(app)
    limiter.init_app(app)

    for bp in (auth_bp, patients_bp, appointments_bp, diet_plans_bp, progress_bp, ai_bp):
        app.register_blueprint(bp, url_prefix="/api")

    @app.after_request
    def security_headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "no-referrer")
        resp.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        resp.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        if is_production():
            resp.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        return resp

    def error(status: int, code: str, message: str, details=None):
        body = {"message": message, "code": code}
        if details is not None:
            body["details"] = details
        return jsonify(body), status

    @app.errorhandler(ValidationError)
    def validation_error(e: ValidationError):
        details = [
            {"field": ".".join(str(p) for p in err["loc"]) or "body", "message": err["msg"]}
            for err in e.errors(include_url=False, include_input=False)
        ]
        first = details[0]
        return error(400, "validation_error", f"{first['field']}: {first['message']}", details)

    @app.errorhandler(HTTPException)
    def http_error(e: HTTPException):
        code = (e.name or "error").lower().replace(" ", "_")
        if e.code == 429:
            return error(429, "rate_limited", "Too many requests. Please slow down and try again shortly.")
        return error(e.code or 500, code, e.description or e.name)

    @app.errorhandler(Exception)
    def unhandled(e: Exception):
        db.session.rollback()
        log.exception("Unhandled error on %s %s", request.method, request.path)
        return error(500, "internal_error", "Something went wrong on our side. Please try again.")

    @app.get("/health")
    @app.get("/api/health")
    @limiter.exempt
    def health():
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify(status="ok", db="ok"), 200
        except Exception:
            db.session.rollback()
            log.exception("Health check DB probe failed")
            return jsonify(status="error", db="error"), 503

    @app.get("/")
    def index():
        return jsonify(service="AyuAahar API", health="/health"), 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=os.environ.get("FLASK_DEBUG") == "1")
