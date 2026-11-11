# AyuAahar - AI wellness assistant routes (Groq, server-side only)
from flask import Blueprint, jsonify, request

from extensions import limiter
from models import DietPlan, Patient
from schemas import ChatIn, parse
from services import ai_service
from utils.auth import get_patient_or_404, token_required

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/ai/chat")
@token_required
@limiter.limit("15 per minute; 200 per day")
def chat():
    data = parse(ChatIn)
    if data.patient_id:
        patient = get_patient_or_404(data.patient_id)
    elif request.user_role == "patient":
        patient = Patient.query.filter_by(patient_user_id=request.user_id).first()
    else:
        patient = None

    plan = None
    if patient is not None:
        plan = (
            DietPlan.query.filter_by(patient_id=patient.id, is_active=True).order_by(DietPlan.created_at.desc()).first()
        )

    try:
        reply = ai_service.chat(
            [m.model_dump() for m in data.messages],
            ai_service.patient_context(patient, plan),
        )
    except ai_service.AIUnavailable as e:
        return jsonify(message=e.message, code="ai_unavailable", disclaimer=ai_service.DISCLAIMER), e.status

    return jsonify(reply=reply, model=ai_service.TEXT_MODEL, disclaimer=ai_service.DISCLAIMER), 200


@ai_bp.get("/ai/disclaimer")
def disclaimer():
    return jsonify(disclaimer=ai_service.DISCLAIMER), 200
