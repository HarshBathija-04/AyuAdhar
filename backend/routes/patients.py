# AyuAahar - Patient Management Routes
from flask import Blueprint, request, jsonify
from models import db, Patient, User
from utils.auth import token_required, dietitian_required

patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/patients', methods=['GET'])
@token_required
@dietitian_required
def get_patients():
    """Get all patients for the logged-in dietitian"""
    # Get query parameters for filtering
    prakriti = request.args.get('prakriti')
    search = request.args.get('search')
    
    # Base query
    query = Patient.query.filter_by(user_id=request.user_id)
    
    # Apply filters
    if prakriti:
        query = query.filter(Patient.prakriti.ilike(f'%{prakriti}%'))
    if search:
        query = query.filter(Patient.name.ilike(f'%{search}%'))
    
    # Order by creation date
    patients = query.order_by(Patient.created_at.desc()).all()
    
    return jsonify({
        'patients': [patient.to_dict() for patient in patients],
        'count': len(patients)
    }), 200

@patients_bp.route('/patients/<int:patient_id>', methods=['GET'])
@token_required
def get_patient(patient_id):
    """Get a specific patient by ID"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian' and patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    # Include related data
    patient_data = patient.to_dict()
    patient_data['diet_plans'] = [dp.to_dict() for dp in patient.diet_plans]
    patient_data['appointments'] = [ap.to_dict() for ap in patient.appointments]
    patient_data['progress_logs'] = [pl.to_dict() for pl in patient.progress_logs]
    
    return jsonify({'patient': patient_data}), 200

@patients_bp.route('/patient/my-data', methods=['GET'])
@token_required
def get_my_patient_data():
    """Get dashboard data for logged-in patient"""
    if request.user_role != 'patient':
        return jsonify({'message': 'Access restricted to patients'}), 403

    patient = Patient.query.filter_by(patient_user_id=request.user_id).first()
    if not patient:
        return jsonify({'message': 'Patient record not found'}), 404

    diet_plan = next((dp for dp in patient.diet_plans if dp.is_active), None)
    if not diet_plan and patient.diet_plans:
        diet_plan = patient.diet_plans[-1]  # fallback to most recent

    progress_logs = [pl.to_dict() for pl in patient.progress_logs]
    
    return jsonify({
        'patient': patient.to_dict(),
        'diet_plan': diet_plan.to_dict() if diet_plan else None,
        'progress_logs': progress_logs
    }), 200

@patients_bp.route('/patients', methods=['POST'])
@token_required
@dietitian_required
def create_patient():
    """Create a new patient"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'age', 'gender', 'prakriti']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Validate prakriti
    valid_prakriti = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Vata-Kapha', 'Pitta-Kapha', 'Tridosha']
    if data['prakriti'] not in valid_prakriti:
        return jsonify({'message': f'Prakriti must be one of: {", ".join(valid_prakriti)}'}), 400
    
    try:
        new_patient = Patient(
            user_id=request.user_id,
            name=data['name'],
            age=data['age'],
            gender=data['gender'],
            weight_kg=data.get('weight_kg'),
            height_cm=data.get('height_cm'),
            prakriti=data['prakriti'],
            condition=data.get('condition', ''),
            lifestyle=data.get('lifestyle', '')
        )
        
        db.session.add(new_patient)
        db.session.commit()
        
        return jsonify({
            'message': 'Patient created successfully',
            'patient': new_patient.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create patient', 'error': str(e)}), 500

@patients_bp.route('/patients/<int:patient_id>', methods=['PUT'])
@token_required
@dietitian_required
def update_patient(patient_id):
    """Update an existing patient"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check if this dietitian owns this patient
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    updatable_fields = ['name', 'age', 'gender', 'weight_kg', 'height_cm', 'prakriti', 'condition', 'lifestyle']
    for field in updatable_fields:
        if field in data:
            setattr(patient, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Patient updated successfully',
            'patient': patient.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Update failed', 'error': str(e)}), 500

@patients_bp.route('/patients/<int:patient_id>', methods=['DELETE'])
@token_required
@dietitian_required
def delete_patient(patient_id):
    """Delete a patient"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check if this dietitian owns this patient
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    try:
        db.session.delete(patient)
        db.session.commit()
        return jsonify({'message': 'Patient deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Delete failed', 'error': str(e)}), 500

@patients_bp.route('/patients/stats', methods=['GET'])
@token_required
@dietitian_required
def get_patient_stats():
    """Get statistics for dietitian's patients"""
    from sqlalchemy import func
    
    # Total patients
    total_patients = Patient.query.filter_by(user_id=request.user_id).count()
    
    # Patients by prakriti
    prakriti_distribution = db.session.query(
        Patient.prakriti,
        func.count(Patient.id).label('count')
    ).filter_by(user_id=request.user_id).group_by(Patient.prakriti).all()
    
    # Recent patients (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_patients = Patient.query.filter(
        Patient.user_id == request.user_id,
        Patient.created_at >= thirty_days_ago
    ).count()
    
    return jsonify({
        'total_patients': total_patients,
        'prakriti_distribution': [{'prakriti': p[0], 'count': p[1]} for p in prakriti_distribution],
        'recent_patients': recent_patients
    }), 200
