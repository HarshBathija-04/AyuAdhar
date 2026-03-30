# AyuAahar - Progress Tracking Routes
from flask import Blueprint, request, jsonify
from models import db, Progress, Patient
from utils.auth import token_required, dietitian_required
from services.report_service import ReportService

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/progress', methods=['GET'])
@token_required
def get_progress_logs():
    """Get progress logs"""
    patient_id = request.args.get('patient_id', type=int)
    
    if request.user_role == 'dietitian':
        # Get progress for patients under this dietitian
        if patient_id:
            # Check if patient belongs to this dietitian
            patient = Patient.query.get(patient_id)
            if not patient or patient.user_id != request.user_id:
                return jsonify({'message': 'Unauthorized access'}), 403
            query = Progress.query.filter_by(patient_id=patient_id)
        else:
            patient_ids = [p.id for p in Patient.query.filter_by(user_id=request.user_id).all()]
            query = Progress.query.filter(Progress.patient_id.in_(patient_ids))
    else:
        # Patient role - would need patient-user linking
        return jsonify({'progress_logs': [], 'count': 0}), 200
    
    progress_logs = query.order_by(Progress.week_number).all()
    
    return jsonify({
        'progress_logs': [pl.to_dict() for pl in progress_logs],
        'count': len(progress_logs)
    }), 200

@progress_bp.route('/progress/<int:progress_id>', methods=['GET'])
@token_required
def get_progress_log(progress_id):
    """Get a specific progress log"""
    progress = Progress.query.get(progress_id)
    
    if not progress:
        return jsonify({'message': 'Progress log not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian':
        patient = Patient.query.get(progress.patient_id)
        if patient.user_id != request.user_id:
            return jsonify({'message': 'Unauthorized access'}), 403
    
    return jsonify({'progress_log': progress.to_dict()}), 200

@progress_bp.route('/progress', methods=['POST'])
@token_required
@dietitian_required
def create_progress_log():
    """Create a new progress log"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['patient_id', 'week_number']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Verify patient exists and belongs to this dietitian
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    try:
        progress = Progress(
            patient_id=data['patient_id'],
            week_number=data['week_number'],
            adherence_score=data.get('adherence_score', 0),
            weight=data.get('weight'),
            notes=data.get('notes', ''),
            symptoms=data.get('symptoms', '')
        )
        
        db.session.add(progress)
        db.session.commit()
        
        return jsonify({
            'message': 'Progress log created successfully',
            'progress_log': progress.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create progress log', 'error': str(e)}), 500

@progress_bp.route('/progress/<int:progress_id>', methods=['PUT'])
@token_required
@dietitian_required
def update_progress_log(progress_id):
    """Update an existing progress log"""
    progress = Progress.query.get(progress_id)
    
    if not progress:
        return jsonify({'message': 'Progress log not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(progress.patient_id)
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    updatable_fields = ['week_number', 'adherence_score', 'weight', 'notes', 'symptoms']
    for field in updatable_fields:
        if field in data:
            setattr(progress, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Progress log updated successfully',
            'progress_log': progress.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Update failed', 'error': str(e)}), 500

@progress_bp.route('/progress/<int:progress_id>', methods=['DELETE'])
@token_required
@dietitian_required
def delete_progress_log(progress_id):
    """Delete a progress log"""
    progress = Progress.query.get(progress_id)
    
    if not progress:
        return jsonify({'message': 'Progress log not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(progress.patient_id)
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    try:
        db.session.delete(progress)
        db.session.commit()
        return jsonify({'message': 'Progress log deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Delete failed', 'error': str(e)}), 500

@progress_bp.route('/progress/<int:patient_id>/report', methods=['GET'])
@token_required
def generate_progress_report(patient_id):
    """Generate a progress report for a patient"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian' and patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    # Get all progress logs for this patient
    progress_logs = Progress.query.filter_by(patient_id=patient_id).order_by(Progress.week_number).all()
    
    try:
        report = ReportService.generate_progress_report(patient, progress_logs)
        return jsonify({
            'message': 'Progress report generated successfully',
            'report': report
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to generate report', 'error': str(e)}), 500

@progress_bp.route('/progress/<int:patient_id>/stats', methods=['GET'])
@token_required
def get_progress_stats(patient_id):
    """Get progress statistics for a patient"""
    patient = Patient.query.get(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian' and patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    progress_logs = Progress.query.filter_by(patient_id=patient_id).order_by(Progress.week_number).all()
    
    if not progress_logs:
        return jsonify({
            'message': 'No progress data available',
            'stats': None
        }), 200
    
    # Calculate statistics
    adherence_scores = [pl.adherence_score for pl in progress_logs]
    weights = [pl.weight for pl in progress_logs if pl.weight]
    
    stats = {
        'total_weeks': len(progress_logs),
        'average_adherence': round(sum(adherence_scores) / len(adherence_scores), 1),
        'adherence_trend': adherence_scores,
        'latest_adherence': adherence_scores[-1] if adherence_scores else 0,
        'highest_adherence': max(adherence_scores) if adherence_scores else 0,
        'lowest_adherence': min(adherence_scores) if adherence_scores else 0
    }
    
    if len(weights) >= 2:
        stats['weight_change'] = round(weights[-1] - weights[0], 1)
        stats['current_weight'] = weights[-1]
        stats['weight_trend'] = weights
    
    return jsonify({
        'stats': stats
    }), 200
