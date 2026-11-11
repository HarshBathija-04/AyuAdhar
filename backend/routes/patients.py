# AyuAahar - Patient management routes
from datetime import datetime, timedelta

from flask import Blueprint, abort, jsonify, request
from sqlalchemy import func

from models import Patient, db
from schemas import PatientIn, PatientUpdateIn, parse, parse_partial
from utils.auth import dietitian_required, get_patient_or_404, token_required

patients_bp = Blueprint("patients", __name__)


def _owned_patient_or_404(patient_id: int) -> Patient:
    patient = db.session.get(Patient, patient_id)
    if not patient or patient.user_id != request.user_id:
        abort(404, description="Patient not found")
    return patient


@patients_bp.get("/patients")
@token_required
@dietitian_required
def get_patients():
    query = Patient.query.filter_by(user_id=request.user_id)
    if prakriti := request.args.get("prakriti", "").strip()[:50]:
        query = query.filter(Patient.prakriti.ilike(f"%{prakriti}%"))
    if search := request.args.get("search", "").strip()[:100]:
        query = query.filter(Patient.name.ilike(f"%{search}%"))
    patients = query.order_by(Patient.created_at.desc()).all()
    return jsonify(patients=[p.to_dict() for p in patients], count=len(patients)), 200


@patients_bp.get("/patients/<int:patient_id>")
@token_required
def get_patient(patient_id):
    patient = get_patient_or_404(patient_id)
    data = patient.to_dict()
    data["diet_plans"] = [dp.to_dict() for dp in patient.diet_plans]
    data["appointments"] = [ap.to_dict() for ap in patient.appointments]
    data["progress_logs"] = [pl.to_dict() for pl in sorted(patient.progress_logs, key=lambda p: p.week_number)]
    return jsonify(patient=data), 200


@patients_bp.get("/patient/my-data")
@token_required
def get_my_patient_data():
    if request.user_role != "patient":
        abort(403, description="Access restricted to patients")
    patient = Patient.query.filter_by(patient_user_id=request.user_id).first()
    if not patient:
        abort(404, description="Patient record not found")

    plans = sorted(patient.diet_plans, key=lambda d: d.created_at or datetime.min)
    diet_plan = next((dp for dp in reversed(plans) if dp.is_active), plans[-1] if plans else None)
    return jsonify(
        patient=patient.to_dict(),
        diet_plan=diet_plan.to_dict() if diet_plan else None,
        progress_logs=[pl.to_dict() for pl in sorted(patient.progress_logs, key=lambda p: p.week_number)],
        appointments=[a.to_dict() for a in sorted(patient.appointments, key=lambda a: a.appointment_date)],
    ), 200


@patients_bp.post("/patients")
@token_required
@dietitian_required
def create_patient():
    data = parse(PatientIn)
    patient = Patient(user_id=request.user_id, **data.model_dump())
    db.session.add(patient)
    db.session.commit()
    return jsonify(message="Patient created successfully", patient=patient.to_dict()), 201


@patients_bp.put("/patients/<int:patient_id>")
@token_required
@dietitian_required
def update_patient(patient_id):
    patient = _owned_patient_or_404(patient_id)
    for field, value in parse_partial(PatientUpdateIn).items():
        setattr(patient, field, value)
    db.session.commit()
    return jsonify(message="Patient updated successfully", patient=patient.to_dict()), 200


@patients_bp.delete("/patients/<int:patient_id>")
@token_required
@dietitian_required
def delete_patient(patient_id):
    patient = _owned_patient_or_404(patient_id)
    db.session.delete(patient)
    db.session.commit()
    return jsonify(message="Patient deleted successfully"), 200


@patients_bp.get("/patients/stats")
@token_required
@dietitian_required
def get_patient_stats():
    total = Patient.query.filter_by(user_id=request.user_id).count()
    distribution = (
        db.session.query(Patient.prakriti, func.count(Patient.id))
        .filter_by(user_id=request.user_id)
        .group_by(Patient.prakriti)
        .all()
    )
    recent = Patient.query.filter(
        Patient.user_id == request.user_id,
        Patient.created_at >= datetime.utcnow() - timedelta(days=30),
    ).count()
    return jsonify(
        total_patients=total,
        prakriti_distribution=[{"prakriti": p, "count": c} for p, c in distribution],
        recent_patients=recent,
    ), 200
