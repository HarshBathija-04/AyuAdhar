# AyuAahar - Authentication Utilities
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    """Hash a password for storing"""
    return generate_password_hash(password)

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return check_password_hash(hashed, password)

def generate_token(user_id, role, secret_key):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')

def decode_token(token, secret_key):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token format invalid'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            secret_key = current_app.config['SECRET_KEY']
            payload = decode_token(token, secret_key)
            if not payload:
                return jsonify({'message': 'Token is invalid or expired'}), 401
            
            # Add user info to request context
            request.user_id = payload['user_id']
            request.user_role = payload['role']
            
        except Exception as e:
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def dietitian_required(f):
    """Decorator to ensure only dietitians can access"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user_role != 'dietitian':
            return jsonify({'message': 'Dietitian access required'}), 403
        return f(*args, **kwargs)
    
    return decorated

def patient_or_dietitian_required(f):
    """Decorator to allow both patients (own data) and dietitians"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # This decorator assumes token_required has already been applied
        # Additional logic can be added for patient-specific access control
        return f(*args, **kwargs)
    
    return decorated
