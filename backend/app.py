# AyuAahar - Main Flask Application
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta, datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import models
from models import db, User, Patient, FoodItem, DietPlan, Appointment, Progress, FoodLog

# Import routes
from routes.auth import auth_bp
from routes.patients import patients_bp
from routes.appointments import appointments_bp
from routes.diet_plans import diet_plans_bp
from routes.progress import progress_bp

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ayuaahar-dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        'postgresql://postgres:postgres@localhost:5432/ayuaahar'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=7)
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Authorization", "Content-Type"]
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints with URL prefix
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(patients_bp, url_prefix='/api')
    app.register_blueprint(appointments_bp, url_prefix='/api')
    app.register_blueprint(diet_plans_bp, url_prefix='/api')
    app.register_blueprint(progress_bp, url_prefix='/api')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'message': 'Internal server error'}), 500
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'AyuAahar API',
            'version': '1.0.0'
        }), 200
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Welcome to AyuAahar API',
            'documentation': '/api/health',
            'version': '1.0.0'
        }), 200
    
    return app

def init_database():
    """Initialize database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")
        
        # Check if food items already exist
        if FoodItem.query.first() is None:
            print("Initializing sample food data...")
            init_sample_foods()
            print("Sample food data initialized!")
        
        # Create a default dietitian user for testing
        if User.query.filter_by(email='dietitian@ayuaahar.com').first() is None:
            from utils.auth import hash_password
            default_dietitian = User(
                name='Dr. Ayurveda',
                email='dietitian@ayuaahar.com',
                password=hash_password('password123'),
                role='dietitian'
            )
            db.session.add(default_dietitian)
            db.session.commit()
            print("Default dietitian user created: dietitian@ayuaahar.com / password123")
        
        # Create a default patient user for testing
        if User.query.filter_by(email='patient@ayuaahar.com').first() is None:
            from utils.auth import hash_password
            default_patient = User(
                name='Harsh Bathija',
                email='patient@ayuaahar.com',
                password=hash_password('password123'),
                role='patient'
            )
            db.session.add(default_patient)
            db.session.commit()
            print("Default patient user created: patient@ayuaahar.com / password123")

def init_sample_foods():
    """Initialize sample food items with Ayurvedic properties"""
    sample_foods = [
        # Grains
        FoodItem(name='Brown Rice', category='grain', calories=111, protein=2.6, carbs=23, fats=0.9, fiber=1.8,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta,Tridosha', meal_type='lunch'),
        
        FoodItem(name='Quinoa', category='grain', calories=120, protein=4.4, carbs=21, fats=1.9, fiber=2.8,
                 rasa='sweet, astringent', guna='light, dry', virya='cooling', vipaka='sweet',
                 vata_effect=0, pitta_effect=-1, kapha_effect=-1, suitable_for='Pitta,Kapha,Tridosha', meal_type='lunch'),
        
        FoodItem(name='Oats', category='grain', calories=389, protein=16.9, carbs=66, fats=6.9, fiber=10.6,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='breakfast'),
        
        FoodItem(name='Wheat Bread', category='grain', calories=265, protein=9, carbs=49, fats=3.2, fiber=2.7,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='breakfast'),
        
        # Vegetables
        FoodItem(name='Spinach', category='vegetable', calories=23, protein=2.9, carbs=3.6, fats=0.4, fiber=2.2,
                 rasa='bitter, astringent', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=1, pitta_effect=-1, kapha_effect=-1, suitable_for='Pitta,Kapha', meal_type='lunch'),
        
        FoodItem(name='Carrots', category='vegetable', calories=41, protein=0.9, carbs=9.6, fats=0.2, fiber=2.8,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=0, suitable_for='Vata,Pitta,Kapha,Tridosha', meal_type='any'),
        
        FoodItem(name='Broccoli', category='vegetable', calories=34, protein=2.8, carbs=7, fats=0.4, fiber=2.6,
                 rasa='bitter, pungent', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=1, pitta_effect=-1, kapha_effect=-1, suitable_for='Pitta,Kapha', meal_type='lunch'),
        
        FoodItem(name='Sweet Potato', category='vegetable', calories=86, protein=1.6, carbs=20, fats=0.1, fiber=3,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='lunch'),
        
        FoodItem(name='Bitter Gourd', category='vegetable', calories=17, protein=1, carbs=3.7, fats=0.2, fiber=2.6,
                 rasa='bitter', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=0, pitta_effect=-1, kapha_effect=-1, suitable_for='Pitta,Kapha', meal_type='lunch'),
        
        # Fruits
        FoodItem(name='Apple', category='fruit', calories=52, protein=0.3, carbs=14, fats=0.2, fiber=2.4,
                 rasa='sweet, astringent', guna='light, dry', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=0, suitable_for='Vata,Pitta,Kapha,Tridosha', meal_type='breakfast'),
        
        FoodItem(name='Banana', category='fruit', calories=89, protein=1.1, carbs=23, fats=0.3, fiber=2.6,
                 rasa='sweet, astringent', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='breakfast'),
        
        FoodItem(name='Orange', category='fruit', calories=47, protein=0.9, carbs=12, fats=0.1, fiber=2.4,
                 rasa='sour, sweet', guna='light, oily', virya='cooling', vipaka='sour',
                 vata_effect=0, pitta_effect=-1, kapha_effect=0, suitable_for='Vata,Kapha', meal_type='breakfast'),
        
        FoodItem(name='Pomegranate', category='fruit', calories=83, protein=1.7, carbs=19, fats=1.2, fiber=4,
                 rasa='sweet, astringent, sour', guna='light', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=-1, suitable_for='Tridosha', meal_type='any'),
        
        FoodItem(name='Mango', category='fruit', calories=60, protein=0.8, carbs=15, fats=0.4, fiber=1.6,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='breakfast'),
        
        # Proteins
        FoodItem(name='Moong Dal', category='protein', calories=347, protein=24, carbs=63, fats=1.2, fiber=16,
                 rasa='sweet, astringent', guna='light, dry', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=-1, suitable_for='Tridosha', meal_type='lunch'),
        
        FoodItem(name='Tofu', category='protein', calories=76, protein=8, carbs=1.9, fats=4.8, fiber=0.3,
                 rasa='sweet, astringent', guna='heavy', virya='cooling', vipaka='sweet',
                 vata_effect=0, pitta_effect=-1, kapha_effect=0, suitable_for='Pitta,Kapha,Tridosha', meal_type='lunch'),
        
        FoodItem(name='Chickpeas', category='protein', calories=164, protein=8.9, carbs=27, fats=2.6, fiber=7.6,
                 rasa='astringent, sweet', guna='heavy, dry', virya='cooling', vipaka='sweet',
                 vata_effect=0, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='lunch'),
        
        FoodItem(name='Lentils', category='protein', calories=116, protein=9, carbs=20, fats=0.4, fiber=7.9,
                 rasa='sweet', guna='light, dry', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=-1, suitable_for='Tridosha', meal_type='lunch'),
        
        # Dairy
        FoodItem(name='Milk', category='dairy', calories=42, protein=3.4, carbs=5, fats=1, fiber=0,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='breakfast'),
        
        FoodItem(name='Yogurt', category='dairy', calories=59, protein=10, carbs=3.6, fats=0.4, fiber=0,
                 rasa='sour', guna='heavy, oily', virya='heating', vipaka='sour',
                 vata_effect=0, pitta_effect=1, kapha_effect=1, suitable_for='Vata', meal_type='lunch'),
        
        FoodItem(name='Ghee', category='dairy', calories=900, protein=0, carbs=0, fats=100, fiber=0,
                 rasa='sweet', guna='heavy, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='any'),
        
        # Spices
        FoodItem(name='Turmeric', category='spice', calories=312, protein=9.7, carbs=67, fats=3.3, fiber=22.7,
                 rasa='bitter, pungent, astringent', guna='light, dry', virya='heating', vipaka='pungent',
                 vata_effect=0, pitta_effect=1, kapha_effect=-1, suitable_for='Kapha', meal_type='any'),
        
        FoodItem(name='Ginger', category='spice', calories=80, protein=1.8, carbs=18, fats=0.8, fiber=2,
                 rasa='pungent', guna='light, dry', virya='heating', vipaka='sweet',
                 vata_effect=-1, pitta_effect=1, kapha_effect=-1, suitable_for='Vata,Kapha', meal_type='any'),
        
        FoodItem(name='Cumin', category='spice', calories=375, protein=18, carbs=44, fats=22, fiber=11,
                 rasa='pungent, bitter', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=-1, pitta_effect=0, kapha_effect=-1, suitable_for='Vata,Kapha,Tridosha', meal_type='any'),
        
        FoodItem(name='Coriander', category='spice', calories=298, protein=12, carbs=55, fats=17, fiber=41,
                 rasa='bitter, pungent, astringent', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=-1, suitable_for='Tridosha', meal_type='any'),
        
        FoodItem(name='Black Pepper', category='spice', calories=251, protein=10, carbs=64, fats=3.3, fiber=25,
                 rasa='pungent', guna='light, dry', virya='heating', vipaka='pungent',
                 vata_effect=-1, pitta_effect=1, kapha_effect=-1, suitable_for='Vata,Kapha', meal_type='any'),
        
        FoodItem(name='Cardamom', category='spice', calories=311, protein=11, carbs=68, fats=6.7, fiber=28,
                 rasa='pungent, sweet', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=-1, suitable_for='Tridosha', meal_type='any'),
        
        # Beverages
        FoodItem(name='Green Tea', category='beverage', calories=1, protein=0.2, carbs=0, fats=0, fiber=0,
                 rasa='bitter, astringent', guna='light, dry', virya='cooling', vipaka='pungent',
                 vata_effect=1, pitta_effect=-1, kapha_effect=-1, suitable_for='Pitta,Kapha', meal_type='any'),
        
        FoodItem(name='Warm Water', category='beverage', calories=0, protein=0, carbs=0, fats=0, fiber=0,
                 rasa='sweet', guna='light', virya='heating', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=-1, suitable_for='Tridosha', meal_type='any'),
        
        FoodItem(name='Herbal Tea', category='beverage', calories=2, protein=0, carbs=0.5, fats=0, fiber=0,
                 rasa='bitter, astringent', guna='light', virya='cooling', vipaka='pungent',
                 vata_effect=0, pitta_effect=-1, kapha_effect=-1, suitable_for='Pitta,Kapha', meal_type='any'),
        
        # Nuts and Seeds
        FoodItem(name='Almonds', category='nuts', calories=579, protein=21, carbs=22, fats=50, fiber=12.5,
                 rasa='sweet', guna='heavy, oily', virya='heating', vipaka='sweet',
                 vata_effect=-1, pitta_effect=1, kapha_effect=1, suitable_for='Vata', meal_type='snack'),
        
        FoodItem(name='Sesame Seeds', category='nuts', calories=573, protein=17, carbs=23, fats=50, fiber=11.8,
                 rasa='sweet, bitter, pungent', guna='heavy, oily', virya='heating', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Kapha', meal_type='any'),
        
        FoodItem(name='Sunflower Seeds', category='nuts', calories=584, protein=21, carbs=20, fats=51, fiber=8.6,
                 rasa='sweet, astringent', guna='light, oily', virya='cooling', vipaka='sweet',
                 vata_effect=-1, pitta_effect=-1, kapha_effect=0, suitable_for='Vata,Pitta', meal_type='snack'),
        
        # Snacks
        FoodItem(name='Roasted Chickpeas', category='snack', calories=160, protein=7, carbs=24, fats=4, fiber=6,
                 rasa='sweet, astringent', guna='light, dry', virya='heating', vipaka='sweet',
                 vata_effect=0, pitta_effect=0, kapha_effect=-1, suitable_for='Kapha', meal_type='snack'),
        
        FoodItem(name='Dates', category='snack', calories=282, protein=2.5, carbs=75, fats=0.4, fiber=8,
                 rasa='sweet', guna='heavy, oily', virya='heating', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='snack'),
        
        FoodItem(name='Raisins', category='snack', calories=299, protein=3.1, carbs=79, fats=0.5, fiber=3.7,
                 rasa='sweet, sour', guna='heavy, oily', virya='heating', vipaka='sweet',
                 vata_effect=-1, pitta_effect=0, kapha_effect=1, suitable_for='Vata,Pitta', meal_type='snack')
    ]
    
    db.session.add_all(sample_foods)
    db.session.commit()

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Initialize database
    with app.app_context():
        db.create_all()
        
        # Initialize sample data if empty
        if FoodItem.query.first() is None:
            init_sample_foods()
        
        # Create default dietitian
        if User.query.filter_by(email='dietitian@ayuaahar.com').first() is None:
            from utils.auth import hash_password
            default_dietitian = User(
                name='Dr. Ayurveda',
                email='dietitian@ayuaahar.com',
                password=hash_password('password123'),
                role='dietitian'
            )
            db.session.add(default_dietitian)
            db.session.commit()
            print("Default dietitian created: dietitian@ayuaahar.com / password123")
        
        # Create default patient
        if User.query.filter_by(email='patient@ayuaahar.com').first() is None:
            from utils.auth import hash_password
            default_patient = User(
                name='Harsh Bathija',
                email='patient@ayuaahar.com',
                password=hash_password('password123'),
                role='patient'
            )
            db.session.add(default_patient)
            db.session.commit()
            print("Default patient created: patient@ayuaahar.com / password123")
        
        # Create demo patients for the dietitian dashboard
        dietitian = User.query.filter_by(email='dietitian@ayuaahar.com').first()
        if dietitian and Patient.query.filter_by(user_id=dietitian.id).count() == 0:
            from datetime import timedelta
            demo_patients = [
                Patient(
                    user_id=dietitian.id,
                    name='Harsh Bathija',
                    age=22,
                    gender='male',
                    prakriti='Vata',
                    condition='Mild digestive issues, low appetite',
                    lifestyle='Sedentary, irregular meals, student'
                ),
                Patient(
                    user_id=dietitian.id,
                    name='Priya Sharma',
                    age=34,
                    gender='female',
                    prakriti='Pitta',
                    condition='Hyperacidity, skin inflammation',
                    lifestyle='Active, regular exercise, stressful work'
                ),
                Patient(
                    user_id=dietitian.id,
                    name='Rahul Verma',
                    age=45,
                    gender='male',
                    prakriti='Kapha',
                    condition='Weight management, sluggish metabolism',
                    lifestyle='Moderate activity, desk job'
                ),
                Patient(
                    user_id=dietitian.id,
                    name='Anjali Patel',
                    age=28,
                    gender='female',
                    prakriti='Vata-Pitta',
                    condition='Anxiety, irregular digestion',
                    lifestyle='Yoga practitioner, vegetarian'
                ),
                Patient(
                    user_id=dietitian.id,
                    name='Vikram Singh',
                    age=52,
                    gender='male',
                    prakriti='Pitta-Kapha',
                    condition='Diabetes Type 2, joint pain',
                    lifestyle='Low activity, non-vegetarian'
                ),
            ]
            db.session.add_all(demo_patients)
            db.session.commit()
            print(f"Created {len(demo_patients)} demo patients for dietitian")
            
            # Create demo appointments
            now = datetime.utcnow()
            demo_appointments = [
                Appointment(
                    patient_id=demo_patients[0].id,
                    appointment_date=now + timedelta(days=1, hours=10),
                    notes='Initial consultation - Vata balancing diet',
                    status='pending'
                ),
                Appointment(
                    patient_id=demo_patients[1].id,
                    appointment_date=now + timedelta(days=2, hours=14),
                    notes='Follow-up - Pitta cooling diet review',
                    status='pending'
                ),
                Appointment(
                    patient_id=demo_patients[2].id,
                    appointment_date=now + timedelta(days=3, hours=11),
                    notes='Weight management progress check',
                    status='pending'
                ),
                Appointment(
                    patient_id=demo_patients[3].id,
                    appointment_date=now - timedelta(days=3),
                    notes='Diet plan adjustment completed',
                    status='completed'
                ),
                Appointment(
                    patient_id=demo_patients[4].id,
                    appointment_date=now - timedelta(days=7),
                    notes='Initial assessment done',
                    status='completed'
                ),
            ]
            db.session.add_all(demo_appointments)
            db.session.commit()
            print(f"Created {len(demo_appointments)} demo appointments")
    
    # Run the application
    app.run(host='0.0.0.0', port=5000, debug=True)

