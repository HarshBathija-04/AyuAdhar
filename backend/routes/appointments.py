# AyuAahar - Appointment Management Routes
from flask import Blueprint, request, jsonify
from models import db, Appointment, Patient
from utils.auth import token_required, dietitian_required
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/appointments', methods=['GET'])
@token_required
def get_appointments():
    """Get all appointments"""
    # Get query parameters
    status = request.args.get('status')
    patient_id = request.args.get('patient_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Base query
    if request.user_role == 'dietitian':
        # Get appointments for all patients under this dietitian
        patient_ids = [p.id for p in Patient.query.filter_by(user_id=request.user_id).all()]
        query = Appointment.query.filter(Appointment.patient_id.in_(patient_ids))
    else:
        # Patients can only see their own appointments
        # For now, patients don't have direct appointments - they're linked to patient records
        return jsonify({'appointments': [], 'count': 0}), 200
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from)
            query = query.filter(Appointment.appointment_date >= from_date)
        except:
            pass
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to)
            query = query.filter(Appointment.appointment_date <= to_date)
        except:
            pass
    
    # Order by appointment date
    appointments = query.order_by(Appointment.appointment_date).all()
    
    return jsonify({
        'appointments': [appt.to_dict() for appt in appointments],
        'count': len(appointments)
    }), 200

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@token_required
def get_appointment(appointment_id):
    """Get a specific appointment"""
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    # Check authorization
    if request.user_role == 'dietitian':
        patient = Patient.query.get(appointment.patient_id)
        if patient.user_id != request.user_id:
            return jsonify({'message': 'Unauthorized access'}), 403
    
    return jsonify({'appointment': appointment.to_dict()}), 200

@appointments_bp.route('/appointments', methods=['POST'])
@token_required
@dietitian_required
def create_appointment():
    """Create a new appointment"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['patient_id', 'appointment_date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Verify patient exists and belongs to this dietitian
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    # Parse appointment date
    try:
        appointment_date = datetime.fromisoformat(data['appointment_date'])
    except:
        return jsonify({'message': 'Invalid appointment_date format. Use ISO format (YYYY-MM-DDTHH:MM)'}), 400
    
    try:
        new_appointment = Appointment(
            patient_id=data['patient_id'],
            appointment_date=appointment_date,
            notes=data.get('notes', ''),
            status=data.get('status', 'pending')
        )
        
        db.session.add(new_appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment': new_appointment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create appointment', 'error': str(e)}), 500

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@token_required
@dietitian_required
def update_appointment(appointment_id):
    """Update an existing appointment"""
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(appointment.patient_id)
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if 'appointment_date' in data:
        try:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'])
        except:
            return jsonify({'message': 'Invalid appointment_date format'}), 400
    
    if 'notes' in data:
        appointment.notes = data['notes']
    
    if 'status' in data:
        valid_statuses = ['pending', 'completed', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'message': f'Status must be one of: {", ".join(valid_statuses)}'}), 400
        appointment.status = data['status']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Appointment updated successfully',
            'appointment': appointment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Update failed', 'error': str(e)}), 500

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@token_required
@dietitian_required
def delete_appointment(appointment_id):
    """Delete an appointment"""
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    # Check authorization
    patient = Patient.query.get(appointment.patient_id)
    if patient.user_id != request.user_id:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'message': 'Appointment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Delete failed', 'error': str(e)}), 500

@appointments_bp.route('/appointments/calendar', methods=['GET'])
@token_required
@dietitian_required
def get_calendar_view():
    """Get appointments formatted for calendar view"""
    year = request.args.get('year', datetime.now().year, type=int)
    month = request.args.get('month', datetime.now().month, type=int)
    
    # Get date range for the month
    from datetime import date
    import calendar
    
    _, last_day = calendar.monthrange(year, month)
    start_date = datetime(year, month, 1)
    end_date = datetime(year, month, last_day, 23, 59, 59)
    
    # Get appointments for this dietitian's patients
    patient_ids = [p.id for p in Patient.query.filter_by(user_id=request.user_id).all()]
    
    appointments = Appointment.query.filter(
        Appointment.patient_id.in_(patient_ids),
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date
    ).order_by(Appointment.appointment_date).all()
    
    # Format for calendar
    calendar_events = []
    for appt in appointments:
        calendar_events.append({
            'id': appt.id,
            'title': f"{appt.patient.name} - {appt.status}",
            'date': appt.appointment_date.strftime('%Y-%m-%d'),
            'time': appt.appointment_date.strftime('%H:%M'),
            'status': appt.status,
            'patient_id': appt.patient_id,
            'patient_name': appt.patient.name
        })
    
    return jsonify({
        'year': year,
        'month': month,
        'events': calendar_events,
        'count': len(calendar_events)
    }), 200

@appointments_bp.route('/appointments/stats', methods=['GET'])
@token_required
@dietitian_required
def get_appointment_stats():
    """Get appointment statistics"""
    from sqlalchemy import func
    
    patient_ids = [p.id for p in Patient.query.filter_by(user_id=request.user_id).all()]
    
    # Total appointments
    total = Appointment.query.filter(Appointment.patient_id.in_(patient_ids)).count()
    
    # By status
    status_counts = db.session.query(
        Appointment.status,
        func.count(Appointment.id).label('count')
    ).filter(Appointment.patient_id.in_(patient_ids)).group_by(Appointment.status).all()
    
    # Upcoming appointments (next 7 days)
    from datetime import timedelta
    next_week = datetime.utcnow() + timedelta(days=7)
    upcoming = Appointment.query.filter(
        Appointment.patient_id.in_(patient_ids),
        Appointment.appointment_date >= datetime.utcnow(),
        Appointment.appointment_date <= next_week,
        Appointment.status == 'pending'
    ).count()
    
    return jsonify({
        'total_appointments': total,
        'status_breakdown': [{'status': s[0], 'count': s[1]} for s in status_counts],
        'upcoming_this_week': upcoming
    }), 200
