# AyuAahar - Diet Plan Routes
from flask import Blueprint, request, jsonify
from models import db, DietPlan, Patient, FoodItem
from utils.auth import token_required, dietitian_required
from services.diet_plan_service import DietPlanService
from services.report_service import ReportService

diet_plans_bp = Blueprint('diet_plans', __name__)

@diet_plans_bp.route('/diet-plans', methods=['GET'])
@token_required
def get_diet_plans():
    """Get all diet plans"""
    patient_id = request.args.get('patient_id', type=int)
    is_active = request.args.get('is_active')
    
    if request.user_role == 'dietitian':
        # Get diet plans for patients under this dietitian
        patient_ids = [p.id for p in Patient.query.filter_by(user_id=request.user_id).all()]
        query = DietPlan.query.filter(DietPlan.patient_id.in_(patient_ids))
    else:
        # Patients can see their own diet plans
        # This would need patient-user linking in a real scenario
        return jsonify({'diet_plans': [], 'count': 0}), 200
    
    # Apply filters
    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == 'true')
    
    diet_plans = query.order_by(DietPlan.created_at.desc()).all()
    
    return jsonify({
        'diet_plans': [dp.to_dict() for dp in diet_plans],
        'count': len(diet_plans)
    }), 200

@diet_plans_bp.route('/diet-plans/<int:diet_plan_id>', methods=['GET'])
@token_required
def get_diet_plan(diet_plan_id):
    """Get a specific diet plan"""
    diet_plan = DietPlan.query.get(diet_plan_id)
    
    if not diet_plan:
        return jsonify({'message': 'Diet plan not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian':
        patient = Patient.query.get(diet_plan.patient_id)
        if patient.user_id != request.user_id:
            return jsonify({'message': 'Unauthorized access'}), 403
    
    return jsonify({'diet_plan': diet_plan.to_dict()}), 200

@diet_plans_bp.route('/generate-diet-plan/<int:patient_id>', methods=['POST'])
@token_required
@dietitian_required
def generate_diet_plan(patient_id):
    """Generate a new diet plan for a patient"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check authorization
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    data = request.get_json() or {}
    plan_name = data.get('plan_name', 'Personalized Diet Plan')
    
    try:
        # Generate diet plan using the service
        diet_plan = DietPlanService.create_diet_plan(patient_id, plan_name)
        
        if not diet_plan:
            return jsonify({'message': 'Failed to generate diet plan'}), 500
        
        return jsonify({
            'message': 'Diet plan generated successfully',
            'diet_plan': diet_plan.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'message': 'Failed to generate diet plan', 'error': str(e)}), 500

@diet_plans_bp.route('/diet-plans/<int:diet_plan_id>', methods=['PUT'])
@token_required
@dietitian_required
def update_diet_plan(diet_plan_id):
    """Update a diet plan"""
    diet_plan = DietPlan.query.get(diet_plan_id)
    
    if not diet_plan:
        return jsonify({'message': 'Diet plan not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(diet_plan.patient_id)
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if 'plan_name' in data:
        diet_plan.plan_name = data['plan_name']
    if 'is_active' in data:
        diet_plan.is_active = data['is_active']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Diet plan updated successfully',
            'diet_plan': diet_plan.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Update failed', 'error': str(e)}), 500

@diet_plans_bp.route('/diet-plans/<int:diet_plan_id>', methods=['DELETE'])
@token_required
@dietitian_required
def delete_diet_plan(diet_plan_id):
    """Delete a diet plan"""
    diet_plan = DietPlan.query.get(diet_plan_id)
    
    if not diet_plan:
        return jsonify({'message': 'Diet plan not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(diet_plan.patient_id)
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    try:
        db.session.delete(diet_plan)
        db.session.commit()
        return jsonify({'message': 'Diet plan deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Delete failed', 'error': str(e)}), 500

@diet_plans_bp.route('/diet-plan/<int:patient_id>', methods=['GET'])
@token_required
def get_patient_active_diet_plan(patient_id):
    """Get the active diet plan for a specific patient"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian' and patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    # Get active diet plan
    diet_plan = DietPlan.query.filter_by(patient_id=patient_id, is_active=True).first()
    
    if not diet_plan:
        return jsonify({'message': 'No active diet plan found', 'diet_plan': None}), 200
    
    return jsonify({'diet_plan': diet_plan.to_dict()}), 200

@diet_plans_bp.route('/diet-plans/<int:diet_plan_id>/report', methods=['GET'])
@token_required
def generate_diet_report(diet_plan_id):
    """Generate a report for a diet plan"""
    diet_plan = DietPlan.query.get(diet_plan_id)
    
    if not diet_plan:
        return jsonify({'message': 'Diet plan not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(diet_plan.patient_id)
    if request.user_role == 'dietitian' and patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    try:
        report = ReportService.generate_diet_report(patient, diet_plan)
        return jsonify({
            'message': 'Report generated successfully',
            'report': report
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to generate report', 'error': str(e)}), 500

@diet_plans_bp.route('/food-items', methods=['GET'])
@token_required
def get_food_items():
    """Get all food items with optional filtering"""
    category = request.args.get('category')
    meal_type = request.args.get('meal_type')
    suitable_for = request.args.get('suitable_for')
    search = request.args.get('search')
    
    query = FoodItem.query
    
    if category:
        query = query.filter_by(category=category)
    if meal_type:
        query = query.filter((FoodItem.meal_type == meal_type) | (FoodItem.meal_type == 'any'))
    if suitable_for:
        query = query.filter(FoodItem.suitable_for.ilike(f'%{suitable_for}%'))
    if search:
        query = query.filter(FoodItem.name.ilike(f'%{search}%'))
    
    food_items = query.order_by(FoodItem.category, FoodItem.name).all()
    
    return jsonify({
        'food_items': [fi.to_dict() for fi in food_items],
        'count': len(food_items)
    }), 200

@diet_plans_bp.route('/food-items/<int:food_item_id>', methods=['GET'])
@token_required
def get_food_item(food_item_id):
    """Get a specific food item"""
    food_item = FoodItem.query.get(food_item_id)
    
    if not food_item:
        return jsonify({'message': 'Food item not found'}), 404
    
    return jsonify({'food_item': food_item.to_dict()}), 200

@diet_plans_bp.route('/food-items', methods=['POST'])
@token_required
@dietitian_required
def create_food_item():
    """Add a new food item"""
    data = request.get_json()
    
    required_fields = ['name', 'category', 'calories', 'protein', 'carbs', 'fats', 
                       'rasa', 'guna', 'virya', 'vipaka', 'suitable_for', 'meal_type']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'{field} is required'}), 400
    
    try:
        food_item = FoodItem(
            name=data['name'],
            category=data['category'],
            calories=data['calories'],
            protein=data['protein'],
            carbs=data['carbs'],
            fats=data['fats'],
            fiber=data.get('fiber', 0),
            rasa=data['rasa'],
            guna=data['guna'],
            virya=data['virya'],
            vipaka=data['vipaka'],
            vata_effect=data.get('vata_effect', 0),
            pitta_effect=data.get('pitta_effect', 0),
            kapha_effect=data.get('kapha_effect', 0),
            suitable_for=data['suitable_for'],
            meal_type=data['meal_type']
        )
        
        db.session.add(food_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Food item created successfully',
            'food_item': food_item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create food item', 'error': str(e)}), 500

@diet_plans_bp.route('/analyze-nutrition', methods=['POST'])
@token_required
def analyze_nutrition():
    """Analyze nutrition for a list of food items"""
    data = request.get_json()
    
    if not data or 'food_items' not in data:
        return jsonify({'message': 'food_items array is required'}), 400
    
    food_items_data = data['food_items']
    
    total_nutrition = {
        'calories': 0,
        'protein': 0,
        'carbs': 0,
        'fats': 0,
        'fiber': 0
    }
    
    ayurvedic_summary = {
        'rasa_counts': {},
        'virya_counts': {'heating': 0, 'cooling': 0},
        'vipaka_counts': {'sweet': 0, 'sour': 0, 'pungent': 0}
    }
    
    food_details = []
    
    for item in food_items_data:
        food_id = item.get('food_id')
        quantity = item.get('quantity', 100)  # Default 100g
        
        food = FoodItem.query.get(food_id)
        if food:
            # Calculate nutrition based on quantity
            ratio = quantity / 100
            
            total_nutrition['calories'] += food.calories * ratio
            total_nutrition['protein'] += food.protein * ratio
            total_nutrition['carbs'] += food.carbs * ratio
            total_nutrition['fats'] += food.fats * ratio
            total_nutrition['fiber'] += food.fiber * ratio
            
            # Ayurvedic summary
            for rasa in food.rasa.split(','):
                rasa = rasa.strip()
                ayurvedic_summary['rasa_counts'][rasa] = ayurvedic_summary['rasa_counts'].get(rasa, 0) + 1
            
            ayurvedic_summary['virya_counts'][food.virya] += 1
            ayurvedic_summary['vipaka_counts'][food.vipaka] += 1
            
            food_details.append({
                'name': food.name,
                'quantity': quantity,
                'calories': round(food.calories * ratio, 1)
            })
    
    # Round values
    for key in total_nutrition:
        total_nutrition[key] = round(total_nutrition[key], 1)
    
    return jsonify({
        'total_nutrition': total_nutrition,
        'ayurvedic_summary': ayurvedic_summary,
        'food_details': food_details
    }), 200
