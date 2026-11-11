# AyuAahar - Appointment routes
import calendar
from datetime import datetime, timedelta

from flask import Blueprint, abort, jsonify, request
from sqlalchemy import func

from models import Appointment, Patient, db
from schemas import AppointmentIn, AppointmentUpdateIn, parse, parse_partial
from utils.auth import can_access_patient, dietitian_required, token_required

appointments_bp = Blueprint("appointments", __name__)


def _visible_patient_ids():
    """Subquery of patient ids the caller may see (own roster or own record)."""
    col = Patient.user_id if request.user_role == "dietitian" else Patient.patient_user_id
    return db.session.query(Patient.id).filter(col == request.user_id)


def _appointment_or_404(appointment_id: int) -> Appointment:
    appt = db.session.get(Appointment, appointment_id)
    if not appt or not can_access_patient(appt.patient):
        abort(404, description="Appointment not found")
    return appt


def _parse_date(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        abort(400, description="Dates must be ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:MM)")


@appointments_bp.get("/appointments")
@token_required
def get_appointments():
    query = Appointment.query.filter(Appointment.patient_id.in_(_visible_patient_ids()))
    if status := request.args.get("status"):
        query = query.filter_by(status=status)
    if patient_id := request.args.get("patient_id", type=int):
        query = query.filter_by(patient_id=patient_id)
    if date_from := _parse_date(request.args.get("date_from")):
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to := _parse_date(request.args.get("date_to")):
        query = query.filter(Appointment.appointment_date <= date_to)
    appointments = query.order_by(Appointment.appointment_date).all()
    return jsonify(appointments=[a.to_dict() for a in appointments], count=len(appointments)), 200


@appointments_bp.get("/appointments/<int:appointment_id>")
@token_required
def get_appointment(appointment_id):
    return jsonify(appointment=_appointment_or_404(appointment_id).to_dict()), 200


@appointments_bp.post("/appointments")
@token_required
@dietitian_required
def create_appointment():
    data = parse(AppointmentIn)
    patient = db.session.get(Patient, data.patient_id)
    if not patient or patient.user_id != request.user_id:
        abort(404, description="Patient not found")
    appt = Appointment(**data.model_dump())
    db.session.add(appt)
    db.session.commit()
    return jsonify(message="Appointment created successfully", appointment=appt.to_dict()), 201


@appointments_bp.put("/appointments/<int:appointment_id>")
@token_required
@dietitian_required
def update_appointment(appointment_id):
    appt = _appointment_or_404(appointment_id)
    for field, value in parse_partial(AppointmentUpdateIn).items():
        if value is not None or field == "notes":
            setattr(appt, field, value)
    db.session.commit()
    return jsonify(message="Appointment updated successfully", appointment=appt.to_dict()), 200


@appointments_bp.delete("/appointments/<int:appointment_id>")
@token_required
@dietitian_required
def delete_appointment(appointment_id):
    db.session.delete(_appointment_or_404(appointment_id))
    db.session.commit()
    return jsonify(message="Appointment deleted successfully"), 200


@appointments_bp.get("/appointments/calendar")
@token_required
@dietitian_required
def get_calendar_view():
    now = datetime.now()
    year = request.args.get("year", now.year, type=int)
    month = request.args.get("month", now.month, type=int)
    if not (1 <= month <= 12 and 1970 <= year <= 2100):
        abort(400, description="month must be 1-12 and year 1970-2100")
    start = datetime(year, month, 1)
    end = datetime(year, month, calendar.monthrange(year, month)[1], 23, 59, 59)

    appointments = (
        Appointment.query.filter(
            Appointment.patient_id.in_(_visible_patient_ids()),
            Appointment.appointment_date.between(start, end),
        )
        .order_by(Appointment.appointment_date)
        .all()
    )
    events = [
        {
            "id": a.id,
            "title": f"{a.patient.name} - {a.status}",
            "date": a.appointment_date.strftime("%Y-%m-%d"),
            "time": a.appointment_date.strftime("%H:%M"),
            "status": a.status,
            "patient_id": a.patient_id,
            "patient_name": a.patient.name,
        }
        for a in appointments
    ]
    return jsonify(year=year, month=month, events=events, count=len(events)), 200


@appointments_bp.get("/appointments/stats")
@token_required
@dietitian_required
def get_appointment_stats():
    ids = _visible_patient_ids()
    total = Appointment.query.filter(Appointment.patient_id.in_(ids)).count()
    status_counts = (
        db.session.query(Appointment.status, func.count(Appointment.id))
        .filter(Appointment.patient_id.in_(ids))
        .group_by(Appointment.status)
        .all()
    )
    now = datetime.utcnow()
    upcoming = Appointment.query.filter(
        Appointment.patient_id.in_(ids),
        Appointment.appointment_date.between(now, now + timedelta(days=7)),
        Appointment.status == "pending",
    ).count()
    return jsonify(
        total_appointments=total,
        status_breakdown=[{"status": s, "count": c} for s, c in status_counts],
        upcoming_this_week=upcoming,
    ), 200
