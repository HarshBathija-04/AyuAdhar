# AyuAahar - Database Models
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

# Association tables for many-to-many relationships
diet_plan_foods = db.Table('diet_plan_foods',
    db.Column('diet_plan_id', db.Integer, db.ForeignKey('diet_plans.id'), primary_key=True),
    db.Column('food_item_id', db.Integer, db.ForeignKey('food_items.id'), primary_key=True)
)

class User(db.Model):
    """User model for authentication - Dietitians and Patients"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'dietitian' or 'patient'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patients = db.relationship('Patient', backref='dietitian', lazy=True, foreign_keys='Patient.user_id')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Patient(db.Model):
    """Patient model - stores patient information for dietitians"""
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Dietitian who manages this patient
    patient_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # The actual patient user account
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)  # 'male', 'female', 'other'
    prakriti = db.Column(db.String(50), nullable=False)  # 'Vata', 'Pitta', 'Kapha', or combinations
    condition = db.Column(db.Text, nullable=True)  # Health conditions
    lifestyle = db.Column(db.Text, nullable=True)  # Lifestyle details
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    diet_plans = db.relationship('DietPlan', backref='patient', lazy=True, cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', backref='patient', lazy=True, cascade='all, delete-orphan')
    progress_logs = db.relationship('Progress', backref='patient', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'prakriti': self.prakriti,
            'condition': self.condition,
            'lifestyle': self.lifestyle,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class FoodItem(db.Model):
    """Food item model with nutritional and Ayurvedic properties"""
    __tablename__ = 'food_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # 'grain', 'vegetable', 'fruit', 'protein', 'dairy', 'spice', 'beverage'
    
    # Nutritional information (per 100g)
    calories = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float, nullable=False)  # in grams
    carbs = db.Column(db.Float, nullable=False)  # in grams
    fats = db.Column(db.Float, nullable=False)  # in grams
    fiber = db.Column(db.Float, default=0)  # in grams
    
    # Ayurvedic properties
    rasa = db.Column(db.String(100), nullable=False)  # Taste: sweet, sour, salty, pungent, bitter, astringent
    guna = db.Column(db.String(100), nullable=False)  # Qualities: heavy, light, oily, dry, etc.
    virya = db.Column(db.String(20), nullable=False)  # Potency: 'heating' or 'cooling'
    vipaka = db.Column(db.String(20), nullable=False)  # Post-digestive effect: 'sweet', 'sour', 'pungent'
    
    # Dosha effects (1 = increases, -1 = decreases, 0 = neutral)
    vata_effect = db.Column(db.Integer, default=0)
    pitta_effect = db.Column(db.Integer, default=0)
    kapha_effect = db.Column(db.Integer, default=0)
    
    # Suitable for which prakriti types (comma-separated)
    suitable_for = db.Column(db.String(100), nullable=False)
    
    # Meal type
    meal_type = db.Column(db.String(50), nullable=False)  # 'breakfast', 'lunch', 'dinner', 'snack', 'any'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fats': self.fats,
            'fiber': self.fiber,
            'rasa': self.rasa,
            'guna': self.guna,
            'virya': self.virya,
            'vipaka': self.vipaka,
            'vata_effect': self.vata_effect,
            'pitta_effect': self.pitta_effect,
            'kapha_effect': self.kapha_effect,
            'suitable_for': self.suitable_for,
            'meal_type': self.meal_type
        }

class DietPlan(db.Model):
    """Diet plan model - stores generated diet plans for patients"""
    __tablename__ = 'diet_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    plan_name = db.Column(db.String(100), default="Personalized Diet Plan")
    plan_data = db.Column(db.Text, nullable=False)  # JSON string with meal details
    
    # Nutritional summary
    total_calories = db.Column(db.Float, default=0)
    total_protein = db.Column(db.Float, default=0)
    total_carbs = db.Column(db.Float, default=0)
    total_fats = db.Column(db.Float, default=0)
    
    # Ayurvedic summary
    vata_score = db.Column(db.Integer, default=0)
    pitta_score = db.Column(db.Integer, default=0)
    kapha_score = db.Column(db.Integer, default=0)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    foods = db.relationship('FoodItem', secondary=diet_plan_foods, lazy='subquery',
                           backref=db.backref('diet_plans', lazy=True))
    
    def get_plan_data(self):
        """Parse JSON plan data"""
        return json.loads(self.plan_data) if self.plan_data else {}
    
    def set_plan_data(self, data):
        """Set plan data as JSON string"""
        self.plan_data = json.dumps(data)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'plan_name': self.plan_name,
            'plan_data': self.get_plan_data(),
            'total_calories': self.total_calories,
            'total_protein': self.total_protein,
            'total_carbs': self.total_carbs,
            'total_fats': self.total_fats,
            'vata_score': self.vata_score,
            'pitta_score': self.pitta_score,
            'kapha_score': self.kapha_score,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'foods': [f.to_dict() for f in self.foods]
        }

class Appointment(db.Model):
    """Appointment model for scheduling consultations"""
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.name if self.patient else None,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Progress(db.Model):
    """Progress tracking model for patient diet adherence"""
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    adherence_score = db.Column(db.Integer, default=0)  # 0-100
    weight = db.Column(db.Float, nullable=True)  # Current weight in kg
    notes = db.Column(db.Text, nullable=True)
    symptoms = db.Column(db.Text, nullable=True)  # Any symptoms or improvements
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'week_number': self.week_number,
            'adherence_score': self.adherence_score,
            'weight': self.weight,
            'notes': self.notes,
            'symptoms': self.symptoms,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class FoodLog(db.Model):
    """Daily food log for patients to track what they actually ate"""
    __tablename__ = 'food_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    food_item_id = db.Column(db.Integer, db.ForeignKey('food_items.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String(20), nullable=False)  # 'breakfast', 'lunch', 'dinner', 'snack'
    quantity = db.Column(db.Float, default=100)  # in grams
    
    # Relationships
    food_item = db.relationship('FoodItem', backref='food_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'food_item': self.food_item.to_dict() if self.food_item else None,
            'date': self.date.isoformat() if self.date else None,
            'meal_type': self.meal_type,
            'quantity': self.quantity
        }
