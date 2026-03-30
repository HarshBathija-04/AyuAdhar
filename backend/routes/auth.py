# AyuAahar - Authentication Routes
from flask import Blueprint, request, jsonify, current_app
from models import db, User, Patient
from utils.auth import hash_password, verify_password, generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (dietitian or patient)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'role']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Validate role
    if data['role'] not in ['dietitian', 'patient']:
        return jsonify({'message': 'Role must be either dietitian or patient'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'message': 'Email already registered'}), 409
    
    # Create new user
    try:
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=hash_password(data['password']),
            role=data['role']
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        if new_user.role == 'patient':
            dietitian = User.query.filter_by(role='dietitian').first()
            dietitian_id = dietitian.id if dietitian else 1

            new_patient = Patient(
                user_id=dietitian_id,
                patient_user_id=new_user.id,
                name=data['name'],
                age=int(data.get('age', 25) or 25),
                gender=data.get('gender', 'not specified') or 'not specified',
                prakriti=data.get('prakriti', 'Not Known') or 'Not Known',
                condition=data.get('condition', ''),
                lifestyle=''
            )
            db.session.add(new_patient)
            db.session.commit()
        
        # Generate token
        token = generate_token(new_user.id, new_user.role, current_app.config['SECRET_KEY'])
        
        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Verify password
    if not verify_password(data['password'], user.password):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Generate token
    token = generate_token(user.id, user.role, current_app.config['SECRET_KEY'])
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'token': token
    }), 200

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile (requires token)"""
    from utils.auth import token_required
    
    @token_required
    def protected_route():
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        return jsonify({'user': user.to_dict()}), 200
    
    return protected_route()

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    from utils.auth import token_required
    
    @token_required
    def protected_route():
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name']
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Profile updated successfully',
                'user': user.to_dict()
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Update failed', 'error': str(e)}), 500
    
    return protected_route()
