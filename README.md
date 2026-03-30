# AyuAahar - Ayurvedic Practice Management System

AyuAahar is a comprehensive cloud-based practice management and nutrient analysis system designed for Ayurvedic dietitians. It integrates modern nutrition science with traditional Ayurvedic dietary principles to help practitioners deliver personalized diet plans based on an individual's Prakriti (body constitution), Dosha balance, health conditions, and lifestyle.

## Features

### Core Functionality

- **Authentication System**: JWT-based secure login with role-based access (Dietitian/Patient)
- **Patient Management**: Add, edit, delete patients with detailed Ayurvedic profiles
- **Appointment System**: Schedule consultations with calendar view
- **Diet Plan Generation**: AI-powered personalized diet plans based on Prakriti and Dosha
- **Nutrient Analysis**: Calculate total nutrition with Ayurvedic balance summary
- **Progress Tracking**: Track patient diet adherence with visual charts
- **Report Generation**: Downloadable PDF reports with patient details and diet plans
- **Food Database**: Comprehensive database with nutritional and Ayurvedic properties

### Ayurvedic Features

- **Prakriti Assessment**: Support for all seven prakriti types (Vata, Pitta, Kapha, combinations)
- **Dosha Analysis**: Vata, Pitta, Kapha scoring and balance visualization
- **Ayurvedic Properties**: Rasa (taste), Guna (qualities), Virya (potency), Vipaka (post-digestive effect)
- **Food Compatibility**: Rule-based food recommendations based on prakriti

## Tech Stack

### Backend
- **Framework**: Python Flask
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API design

### Frontend
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Chart.js with react-chartjs-2
- **State Management**: React Context API
- **Routing**: React Router

## Project Structure

```
ayuaahar/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── models/
│   │   └── __init__.py        # Database models
│   ├── routes/
│   │   ├── auth.py            # Authentication routes
│   │   ├── patients.py        # Patient management routes
│   │   ├── appointments.py    # Appointment routes
│   │   ├── diet_plans.py      # Diet plan routes
│   │   └── progress.py        # Progress tracking routes
│   ├── services/
│   │   ├── diet_plan_service.py   # Diet plan generation logic
│   │   └── report_service.py      # Report generation
│   └── utils/
│       └── auth.py            # JWT utilities
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.tsx     # Sidebar layout component
    │   ├── contexts/
    │   │   └── AuthContext.tsx    # Authentication context
    │   ├── pages/
    │   │   ├── Login.tsx      # Login page
    │   │   ├── Register.tsx   # Registration page
    │   │   ├── Dashboard.tsx  # Main dashboard
    │   │   ├── Patients.tsx   # Patient list
    │   │   ├── PatientForm.tsx    # Add/Edit patient
    │   │   ├── PatientDetail.tsx  # Patient details
    │   │   ├── DietPlan.tsx   # Diet plan view
    │   │   ├── Appointments.tsx   # Calendar & appointments
    │   │   └── FoodDatabase.tsx   # Food items database
    │   ├── services/
    │   │   └── api.ts         # API service
    │   ├── types/
    │   │   └── index.ts       # TypeScript types
    │   ├── App.tsx            # Main app component
    │   └── main.tsx           # Entry point
    ├── package.json
    └── index.html
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database**:
   ```bash
   # Create database
   createdb ayuaahar
   
   # Or use psql
   psql -c "CREATE DATABASE ayuaahar;"
   ```

5. **Configure environment variables** (optional):
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/ayuaahar"
   export SECRET_KEY="your-secret-key-here"
   ```

6. **Initialize database**:
   ```bash
   python app.py
   ```
   The app will automatically create tables and seed sample data.

7. **Run the backend server**:
   ```bash
   python app.py
   ```
   The server will start at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API URL** (optional):
   Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will start at `http://localhost:5173`

5. **Build for production**:
   ```bash
   npm run build
   ```

## Default Login Credentials

After initial setup, you can log in with:
- **Email**: dietitian@ayuaahar.com
- **Password**: password123

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/stats` - Get patient statistics

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/appointments/calendar` - Get calendar events

### Diet Plans
- `GET /api/diet-plans` - List diet plans
- `POST /api/generate-diet-plan/:patient_id` - Generate diet plan
- `GET /api/diet-plan/:patient_id` - Get patient's active diet plan
- `GET /api/diet-plans/:id/report` - Generate diet report

### Food Items
- `GET /api/food-items` - List food items
- `POST /api/food-items` - Add new food item

### Progress
- `GET /api/progress` - List progress logs
- `POST /api/progress` - Create progress log
- `GET /api/progress/:patient_id/stats` - Get progress statistics

## Database Schema

### Users
- id (Primary Key)
- name
- email (Unique)
- password (Hashed)
- role (dietitian/patient)
- created_at

### Patients
- id (Primary Key)
- user_id (Foreign Key to Users)
- name
- age
- gender
- prakriti
- condition
- lifestyle
- created_at
- updated_at

### FoodItems
- id (Primary Key)
- name
- category
- calories, protein, carbs, fats, fiber
- rasa, guna, virya, vipaka
- vata_effect, pitta_effect, kapha_effect
- suitable_for
- meal_type

### DietPlans
- id (Primary Key)
- patient_id (Foreign Key)
- plan_name
- plan_data (JSON)
- total_calories, total_protein, total_carbs, total_fats
- vata_score, pitta_score, kapha_score
- is_active
- created_at

### Appointments
- id (Primary Key)
- patient_id (Foreign Key)
- appointment_date
- notes
- status
- created_at

### Progress
- id (Primary Key)
- patient_id (Foreign Key)
- week_number
- adherence_score
- weight
- notes
- symptoms
- created_at

## Ayurvedic Concepts

### Prakriti (Body Constitution)
- **Vata**: Air & Space elements - light, dry, cold
- **Pitta**: Fire & Water elements - hot, sharp, oily
- **Kapha**: Earth & Water elements - heavy, cold, oily

### Food Properties
- **Rasa**: Taste (sweet, sour, salty, pungent, bitter, astringent)
- **Guna**: Qualities (heavy, light, oily, dry, etc.)
- **Virya**: Potency (heating or cooling)
- **Vipaka**: Post-digestive effect

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@ayuaahar.com or create an issue in the repository.

---

**AyuAahar** - Bridging traditional Ayurvedic knowledge with modern health technology.
