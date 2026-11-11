# AyuAahar - Progress tracking routes
from flask import Blueprint, abort, jsonify, request

from models import Patient, Progress, db
from schemas import ProgressIn, ProgressUpdateIn, parse, parse_partial
from services.report_service import ReportService
from utils.auth import can_access_patient, dietitian_required, get_patient_or_404, token_required

progress_bp = Blueprint("progress", __name__)


def _progress_or_404(progress_id: int) -> Progress:
    log = db.session.get(Progress, progress_id)
    if not log or not can_access_patient(log.patient):
        abort(404, description="Progress log not found")
    return log


@progress_bp.get("/progress")
@token_required
def get_progress_logs():
    if patient_id := request.args.get("patient_id", type=int):
        query = Progress.query.filter_by(patient_id=get_patient_or_404(patient_id).id)
    else:
        col = Patient.user_id if request.user_role == "dietitian" else Patient.patient_user_id
        ids = db.session.query(Patient.id).filter(col == request.user_id)
        query = Progress.query.filter(Progress.patient_id.in_(ids))
    logs = query.order_by(Progress.week_number).all()
    return jsonify(progress_logs=[pl.to_dict() for pl in logs], count=len(logs)), 200


@progress_bp.get("/progress/<int:progress_id>")
@token_required
def get_progress_log(progress_id):
    return jsonify(progress_log=_progress_or_404(progress_id).to_dict()), 200


@progress_bp.post("/progress")
@token_required
def create_progress_log():
    """Dietitians log for their patients; patients may self-report their own weekly check-in."""
    data = parse(ProgressIn)
    get_patient_or_404(data.patient_id)  # ownership check (404 otherwise)
    log = Progress(**data.model_dump())
    db.session.add(log)
    db.session.commit()
    return jsonify(message="Progress log created successfully", progress_log=log.to_dict()), 201


@progress_bp.put("/progress/<int:progress_id>")
@token_required
@dietitian_required
def update_progress_log(progress_id):
    log = _progress_or_404(progress_id)
    for field, value in parse_partial(ProgressUpdateIn).items():
        setattr(log, field, value)
    db.session.commit()
    return jsonify(message="Progress log updated successfully", progress_log=log.to_dict()), 200


@progress_bp.delete("/progress/<int:progress_id>")
@token_required
@dietitian_required
def delete_progress_log(progress_id):
    db.session.delete(_progress_or_404(progress_id))
    db.session.commit()
    return jsonify(message="Progress log deleted successfully"), 200


def _logs(patient_id: int):
    patient = get_patient_or_404(patient_id)
    return patient, Progress.query.filter_by(patient_id=patient.id).order_by(Progress.week_number).all()


@progress_bp.get("/progress/<int:patient_id>/report")
@token_required
def generate_progress_report(patient_id):
    patient, logs = _logs(patient_id)
    return jsonify(
        message="Progress report generated successfully",
        report=ReportService.generate_progress_report(patient, logs),
    ), 200


@progress_bp.get("/progress/<int:patient_id>/stats")
@token_required
def get_progress_stats(patient_id):
    _, logs = _logs(patient_id)
    return jsonify(stats=ReportService.progress_stats(logs)), 200
