# AyuAahar - Diet plan, food item and nutrition routes
from flask import Blueprint, abort, jsonify, request

from models import DietPlan, FoodItem, Patient, db
from schemas import AnalyzeNutritionIn, DietPlanUpdateIn, FoodItemIn, GeneratePlanIn, parse, parse_partial
from services.diet_plan_service import DietPlanService
from services.report_service import ReportService
from utils.auth import can_access_patient, dietitian_required, get_patient_or_404, token_required

diet_plans_bp = Blueprint("diet_plans", __name__)


def _plan_or_404(diet_plan_id: int) -> DietPlan:
    plan = db.session.get(DietPlan, diet_plan_id)
    if not plan or not can_access_patient(plan.patient):
        abort(404, description="Diet plan not found")
    return plan


@diet_plans_bp.get("/diet-plans")
@token_required
def get_diet_plans():
    col = Patient.user_id if request.user_role == "dietitian" else Patient.patient_user_id
    query = DietPlan.query.filter(DietPlan.patient_id.in_(db.session.query(Patient.id).filter(col == request.user_id)))
    if patient_id := request.args.get("patient_id", type=int):
        query = query.filter_by(patient_id=patient_id)
    if (is_active := request.args.get("is_active")) is not None:
        query = query.filter_by(is_active=is_active.lower() == "true")
    plans = query.order_by(DietPlan.created_at.desc()).all()
    return jsonify(diet_plans=[dp.to_dict() for dp in plans], count=len(plans)), 200


@diet_plans_bp.get("/diet-plans/<int:diet_plan_id>")
@token_required
def get_diet_plan(diet_plan_id):
    return jsonify(diet_plan=_plan_or_404(diet_plan_id).to_dict()), 200


@diet_plans_bp.post("/generate-diet-plan/<int:patient_id>")
@token_required
@dietitian_required
def generate_diet_plan(patient_id):
    patient = get_patient_or_404(patient_id)
    data = parse(GeneratePlanIn)
    plan = DietPlanService.create_diet_plan(patient.id, data.plan_name or "Personalized Diet Plan")
    return jsonify(message="Diet plan generated successfully", diet_plan=plan.to_dict()), 201


@diet_plans_bp.put("/diet-plans/<int:diet_plan_id>")
@token_required
@dietitian_required
def update_diet_plan(diet_plan_id):
    plan = _plan_or_404(diet_plan_id)
    for field, value in parse_partial(DietPlanUpdateIn).items():
        if value is not None:
            setattr(plan, field, value)
    db.session.commit()
    return jsonify(message="Diet plan updated successfully", diet_plan=plan.to_dict()), 200


@diet_plans_bp.delete("/diet-plans/<int:diet_plan_id>")
@token_required
@dietitian_required
def delete_diet_plan(diet_plan_id):
    db.session.delete(_plan_or_404(diet_plan_id))
    db.session.commit()
    return jsonify(message="Diet plan deleted successfully"), 200


@diet_plans_bp.get("/diet-plan/<int:patient_id>")
@token_required
def get_patient_active_diet_plan(patient_id):
    patient = get_patient_or_404(patient_id)
    plan = DietPlan.query.filter_by(patient_id=patient.id, is_active=True).order_by(DietPlan.created_at.desc()).first()
    if not plan:
        return jsonify(message="No active diet plan found", diet_plan=None), 200
    return jsonify(diet_plan=plan.to_dict()), 200


@diet_plans_bp.get("/diet-plans/<int:diet_plan_id>/report")
@token_required
def generate_diet_report(diet_plan_id):
    plan = _plan_or_404(diet_plan_id)
    return jsonify(
        message="Report generated successfully",
        report=ReportService.generate_diet_report(plan.patient, plan),
    ), 200


@diet_plans_bp.get("/food-items")
@token_required
def get_food_items():
    query = FoodItem.query
    if category := request.args.get("category"):
        query = query.filter_by(category=category)
    if meal_type := request.args.get("meal_type"):
        query = query.filter(FoodItem.meal_type.in_([meal_type, "any"]))
    if suitable_for := request.args.get("suitable_for", "").strip()[:50]:
        query = query.filter(FoodItem.suitable_for.ilike(f"%{suitable_for}%"))
    if search := request.args.get("search", "").strip()[:100]:
        query = query.filter(FoodItem.name.ilike(f"%{search}%"))
    items = query.order_by(FoodItem.category, FoodItem.name).all()
    return jsonify(food_items=[fi.to_dict() for fi in items], count=len(items)), 200


@diet_plans_bp.get("/food-items/<int:food_item_id>")
@token_required
def get_food_item(food_item_id):
    item = db.session.get(FoodItem, food_item_id)
    if not item:
        abort(404, description="Food item not found")
    return jsonify(food_item=item.to_dict()), 200


@diet_plans_bp.post("/food-items")
@token_required
@dietitian_required
def create_food_item():
    item = FoodItem(**parse(FoodItemIn).model_dump())
    db.session.add(item)
    db.session.commit()
    return jsonify(message="Food item created successfully", food_item=item.to_dict()), 201


@diet_plans_bp.post("/analyze-nutrition")
@token_required
def analyze_nutrition():
    data = parse(AnalyzeNutritionIn)
    foods = {f.id: f for f in FoodItem.query.filter(FoodItem.id.in_([i.food_id for i in data.food_items])).all()}
    return jsonify(
        DietPlanService.analyze_nutrition(
            [(foods[i.food_id], i.quantity) for i in data.food_items if i.food_id in foods]
        )
    ), 200
