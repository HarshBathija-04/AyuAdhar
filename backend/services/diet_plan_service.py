# AyuAahar - Diet Plan Generation Service
# Calorie target: Mifflin-St Jeor BMR -> TDEE -> BMI-adjusted goal
from models import FoodItem, DietPlan, db
import random
import os
import csv

# ---------------------------------------------------------------------------
# Load dataset once at import so every request reuses it
# ---------------------------------------------------------------------------
_DATASET_ROWS = []

# Look for CSV alongside the backend files first (for Render), then in root Dataset/ folder
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.join(_BACKEND_DIR, '..')   # services/ -> backend/
_POSSIBLE_PATHS = [
    os.path.join(_BACKEND_DIR, 'AyurGenixAI_Dataset.csv'),
    os.path.join(_BACKEND_DIR, '..', 'Dataset', 'AyurGenixAI_Dataset.csv'),
]

def _load_dataset():
    global _DATASET_ROWS
    for path in _POSSIBLE_PATHS:
        path = os.path.abspath(path)
        if os.path.exists(path):
            try:
                with open(path, newline='', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    _DATASET_ROWS = list(reader)
                break
            except Exception:
                continue

_load_dataset()


class DietPlanService:
    """Service for generating personalised Ayurvedic diet plans."""

    # ------------------------------------------------------------------
    # Prakriti-based guidelines (tastes, qualities, virya)
    # ------------------------------------------------------------------
    PRAKRITI_GUIDELINES = {
        'Vata': {
            'description': 'Vata types need warm, moist, grounding foods',
            'favored_tastes': ['sweet', 'sour', 'salty'],
            'avoid_tastes': ['pungent', 'bitter', 'astringent'],
            'favored_qualities': ['heavy', 'oily', 'moist', 'warm'],
            'avoid_qualities': ['light', 'dry', 'cold'],
            'favored_virya': 'heating',
            'activity_multiplier': 1.375,   # lightly active default
        },
        'Pitta': {
            'description': 'Pitta types need cool, soothing, moderate foods',
            'favored_tastes': ['sweet', 'bitter', 'astringent'],
            'avoid_tastes': ['pungent', 'sour', 'salty'],
            'favored_qualities': ['heavy', 'cool', 'dry'],
            'avoid_qualities': ['light', 'hot', 'oily'],
            'favored_virya': 'cooling',
            'activity_multiplier': 1.55,
        },
        'Kapha': {
            'description': 'Kapha types need light, warm, stimulating foods',
            'favored_tastes': ['pungent', 'bitter', 'astringent'],
            'avoid_tastes': ['sweet', 'sour', 'salty'],
            'favored_qualities': ['light', 'warm', 'dry'],
            'avoid_qualities': ['heavy', 'cold', 'oily'],
            'favored_virya': 'heating',
            'activity_multiplier': 1.2,    # Kapha tends to lower activity
        },
        'Vata-Pitta': {
            'description': 'Vata-Pitta types need balancing warm and cool foods',
            'favored_tastes': ['sweet', 'bitter'],
            'avoid_tastes': ['pungent', 'sour'],
            'favored_qualities': ['moderate', 'moist'],
            'avoid_qualities': ['extreme'],
            'favored_virya': 'neutral',
            'activity_multiplier': 1.375,
        },
        'Vata-Kapha': {
            'description': 'Vata-Kapha types need warm, light foods',
            'favored_tastes': ['pungent', 'bitter'],
            'avoid_tastes': ['sweet', 'sour', 'salty'],
            'favored_qualities': ['warm', 'light'],
            'avoid_qualities': ['cold', 'heavy'],
            'favored_virya': 'heating',
            'activity_multiplier': 1.375,
        },
        'Pitta-Kapha': {
            'description': 'Pitta-Kapha types need warm, light, dry foods',
            'favored_tastes': ['pungent', 'bitter', 'astringent'],
            'avoid_tastes': ['sweet', 'sour', 'salty'],
            'favored_qualities': ['light', 'warm', 'dry'],
            'avoid_qualities': ['heavy', 'cold', 'oily'],
            'favored_virya': 'heating',
            'activity_multiplier': 1.375,
        },
        'Tridosha': {
            'description': 'Balanced constitution - varied diet recommended',
            'favored_tastes': ['all in moderation'],
            'avoid_tastes': ['excess of any'],
            'favored_qualities': ['balanced'],
            'avoid_qualities': ['extreme'],
            'favored_virya': 'neutral',
            'activity_multiplier': 1.55,
        },
    }

    # ------------------------------------------------------------------
    # BMR / TDEE / BMI helpers
    # ------------------------------------------------------------------
    @staticmethod
    def calculate_bmr(age: int, gender: str, weight_kg: float, height_cm: float) -> float:
        """Mifflin-St Jeor BMR equation (kcal/day)."""
        if gender == 'female':
            return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
        else:
            return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5

    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        """Body Mass Index."""
        height_m = height_cm / 100
        return weight_kg / (height_m ** 2)

    @classmethod
    def calculate_target_calories(cls, patient) -> int:
        """
        Derive target calories from BMR * activity multiplier,
        then apply a BMI-based adjustment:
          - Underweight (BMI < 18.5): +300 kcal
          - Normal        (18.5-24.9): maintenance
          - Overweight   (25-29.9):   -300 kcal
          - Obese        (≥30):       -500 kcal
        Falls back to prakriti-based defaults if weight/height are missing.
        """
        prakriti = patient.prakriti
        guidelines = cls.PRAKRITI_GUIDELINES.get(prakriti, cls.PRAKRITI_GUIDELINES['Tridosha'])

        weight = getattr(patient, 'weight_kg', None)
        height = getattr(patient, 'height_cm', None)

        # Fallback if weight/height not recorded
        if not weight or not height:
            base = 2000 if patient.gender != 'female' else 1800
            if patient.age > 60:
                base -= 200
            elif patient.age < 25:
                base += 100
            return base

        bmr = cls.calculate_bmr(patient.age, patient.gender, weight, height)
        activity = guidelines.get('activity_multiplier', 1.375)
        tdee = bmr * activity

        bmi = cls.calculate_bmi(weight, height)
        if bmi < 18.5:
            tdee += 300        # Underweight – slight surplus
        elif bmi < 25:
            pass               # Normal – maintenance
        elif bmi < 30:
            tdee -= 300        # Overweight – mild deficit
        else:
            tdee -= 500        # Obese – moderate deficit

        # Keep within a sensible range
        return max(1200, min(int(round(tdee)), 3500))

    # ------------------------------------------------------------------
    # Dataset lookup
    # ------------------------------------------------------------------
    @classmethod
    def get_dataset_recommendations(cls, patient) -> dict:
        """
        Search the loaded CSV for rows whose Prakriti matches the patient and
        whose Disease/Symptoms overlap with the patient's recorded condition.
        Returns a dict with dataset-sourced tips.
        """
        if not _DATASET_ROWS:
            return {}

        prakriti = (patient.prakriti or '').lower()
        condition = (patient.condition or '').lower()
        condition_words = set(condition.split()) if condition else set()

        best_row = None
        best_score = 0

        for row in _DATASET_ROWS:
            row_prakriti = row.get('Constitution/Prakriti', '').lower()
            row_disease  = row.get('Disease', '').lower()
            row_symptoms = row.get('Symptoms', '').lower()

            score = 0
            # Prakriti match
            if prakriti in row_prakriti or row_prakriti in prakriti:
                score += 5
            # Condition keyword overlap
            for word in condition_words:
                if len(word) > 3 and (word in row_disease or word in row_symptoms):
                    score += 2

            if score > best_score:
                best_score = score
                best_row = row

        if best_row and best_score > 0:
            return {
                'disease_match':      best_row.get('Disease', ''),
                'diet_advice':        best_row.get('Diet and Lifestyle Recommendations', ''),
                'yoga_therapy':       best_row.get('Yoga & Physical Therapy', ''),
                'ayurvedic_herbs':    best_row.get('Ayurvedic Herbs', ''),
                'formulation':        best_row.get('Formulation', ''),
                'prevention':         best_row.get('Prevention', ''),
                'patient_recommendations': best_row.get('Patient Recommendations', ''),
            }
        return {}

    # ------------------------------------------------------------------
    # Food scoring
    # ------------------------------------------------------------------
    @classmethod
    def get_food_score(cls, food, prakriti):
        """Compatibility score for a food item based on prakriti."""
        score = 0
        guidelines = cls.PRAKRITI_GUIDELINES.get(prakriti, cls.PRAKRITI_GUIDELINES['Tridosha'])

        suitable_prakritis = [p.strip() for p in food.suitable_for.split(',')]
        if prakriti in suitable_prakritis or 'all' in suitable_prakritis:
            score += 10

        food_rasas = [r.strip().lower() for r in food.rasa.split(',')]
        for rasa in food_rasas:
            if rasa in guidelines['favored_tastes']:
                score += 5
            elif rasa in guidelines['avoid_tastes']:
                score -= 5

        if food.virya == guidelines['favored_virya']:
            score += 3
        elif guidelines['favored_virya'] == 'neutral':
            score += 2

        if 'Vata' in prakriti:
            score += food.vata_effect * 2
        if 'Pitta' in prakriti:
            score += food.pitta_effect * 2
        if 'Kapha' in prakriti:
            score += food.kapha_effect * 2

        return score

    @classmethod
    def select_foods_for_meal(cls, meal_type, prakriti, target_calories, exclude_foods=None):
        """Select appropriate foods for a specific meal."""
        if exclude_foods is None:
            exclude_foods = []

        foods = FoodItem.query.filter(
            (FoodItem.meal_type == meal_type) | (FoodItem.meal_type == 'any')
        ).all()

        scored_foods = []
        for food in foods:
            if food.name not in exclude_foods:
                base_score = cls.get_food_score(food, prakriti)
                randomized_score = base_score * random.uniform(0.8, 1.2)
                scored_foods.append((food, randomized_score))

        scored_foods.sort(key=lambda x: x[1], reverse=True)

        selected_foods = []
        current_calories = 0

        for food, score in scored_foods:
            if score > 0 and current_calories < target_calories:
                if current_calories + food.calories <= target_calories * 1.15:
                    selected_foods.append(food)
                    current_calories += food.calories
                elif not selected_foods:
                    selected_foods.append(food)
                    current_calories += food.calories

        return selected_foods

    # ------------------------------------------------------------------
    # Full meal plan
    # ------------------------------------------------------------------
    @classmethod
    def generate_meal_plan(cls, patient):
        """Generate a complete daily meal plan for a patient."""
        prakriti  = patient.prakriti
        guidelines = cls.PRAKRITI_GUIDELINES.get(prakriti, cls.PRAKRITI_GUIDELINES['Tridosha'])

        # --- Accurate calorie target from age + weight + height -------
        base_calories = cls.calculate_target_calories(patient)

        # BMI info to include in response
        bmi_info = None
        weight = getattr(patient, 'weight_kg', None)
        height = getattr(patient, 'height_cm', None)
        if weight and height:
            bmi = cls.calculate_bmi(weight, height)
            bmi_info = {
                'bmi': round(bmi, 1),
                'category': (
                    'Underweight' if bmi < 18.5 else
                    'Normal'      if bmi < 25   else
                    'Overweight'  if bmi < 30   else
                    'Obese'
                ),
                'weight_kg': weight,
                'height_cm': height,
            }

        # Distribute across meals (25 / 40 / 30 / 5)
        breakfast_calories = base_calories * 0.25
        lunch_calories     = base_calories * 0.40
        dinner_calories    = base_calories * 0.30
        snack_calories     = base_calories * 0.05

        breakfast_foods = cls.select_foods_for_meal('breakfast', prakriti, breakfast_calories)
        lunch_foods     = cls.select_foods_for_meal('lunch',     prakriti, lunch_calories)
        dinner_foods    = cls.select_foods_for_meal('dinner',    prakriti, dinner_calories)
        snack_foods     = cls.select_foods_for_meal('snack',     prakriti, snack_calories)

        meal_plan = {
            'breakfast': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in breakfast_foods],
                'total_calories': sum(f.calories for f in breakfast_foods),
                'recommendations': cls.get_meal_recommendations('breakfast', prakriti),
                'target_calories': round(breakfast_calories),
            },
            'lunch': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in lunch_foods],
                'total_calories': sum(f.calories for f in lunch_foods),
                'recommendations': cls.get_meal_recommendations('lunch', prakriti),
                'target_calories': round(lunch_calories),
            },
            'dinner': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in dinner_foods],
                'total_calories': sum(f.calories for f in dinner_foods),
                'recommendations': cls.get_meal_recommendations('dinner', prakriti),
                'target_calories': round(dinner_calories),
            },
            'snacks': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in snack_foods],
                'total_calories': sum(f.calories for f in snack_foods),
                'recommendations': cls.get_meal_recommendations('snack', prakriti),
                'target_calories': round(snack_calories),
            },
        }

        all_foods = breakfast_foods + lunch_foods + dinner_foods + snack_foods
        total_nutrition = {
            'calories': sum(f.calories for f in all_foods),
            'protein':  sum(f.protein  for f in all_foods),
            'carbs':    sum(f.carbs    for f in all_foods),
            'fats':     sum(f.fats     for f in all_foods),
            'fiber':    sum(f.fiber    for f in all_foods),
            'target_calories': base_calories,
        }

        ayurvedic_balance = cls.calculate_ayurvedic_balance(all_foods)
        dataset_recs      = cls.get_dataset_recommendations(patient)

        return {
            'meal_plan':         meal_plan,
            'total_nutrition':   total_nutrition,
            'ayurvedic_balance': ayurvedic_balance,
            'prakriti_guidelines': guidelines['description'],
            'bmi_info':          bmi_info,
            'dataset_recommendations': dataset_recs,
            'foods':             all_foods,
        }

    # ------------------------------------------------------------------
    # Meal-level text recommendations
    # ------------------------------------------------------------------
    @classmethod
    def get_meal_recommendations(cls, meal_type, prakriti):
        """Get specific recommendations for each meal based on prakriti."""
        recommendations = {
            'Vata': {
                'breakfast': 'Warm, cooked foods. Avoid cold cereals.',
                'lunch':     'Largest meal of the day. Include warm soups.',
                'dinner':    'Light, warm meal. Eat 2-3 hours before bed.',
                'snack':     'Warm milk, nuts, or ripe fruits.',
            },
            'Pitta': {
                'breakfast': 'Cool or room temperature foods. Sweet fruits.',
                'lunch':     'Moderate portions. Include cooling vegetables.',
                'dinner':    'Light, early dinner. Avoid spicy foods.',
                'snack':     'Sweet fruits, coconut water, or cool milk.',
            },
            'Kapha': {
                'breakfast': 'Light or skip breakfast. Warm spices.',
                'lunch':     'Main meal. Include pungent spices.',
                'dinner':    'Very light, early dinner. No heavy foods.',
                'snack':     'Honey water or light fruits. Avoid heavy snacks.',
            },
        }
        base_prakriti = prakriti.split('-')[0] if '-' in prakriti else prakriti
        return recommendations.get(base_prakriti, recommendations['Vata']).get(meal_type, '')

    # ------------------------------------------------------------------
    # Ayurvedic balance
    # ------------------------------------------------------------------
    @classmethod
    def calculate_ayurvedic_balance(cls, foods):
        vata_score  = sum(f.vata_effect  for f in foods)
        pitta_score = sum(f.pitta_effect for f in foods)
        kapha_score = sum(f.kapha_effect for f in foods)

        total = abs(vata_score) + abs(pitta_score) + abs(kapha_score)
        if total > 0:
            vata_pct  = (vata_score  + total / 2) / total * 100
            pitta_pct = (pitta_score + total / 2) / total * 100
            kapha_pct = (kapha_score + total / 2) / total * 100
        else:
            vata_pct = pitta_pct = kapha_pct = 33.33

        return {
            'vata':             round(vata_score, 1),
            'pitta':            round(pitta_score, 1),
            'kapha':            round(kapha_score, 1),
            'vata_percentage':  round(vata_pct, 1),
            'pitta_percentage': round(pitta_pct, 1),
            'kapha_percentage': round(kapha_pct, 1),
            'balance_status':   cls.get_balance_status(vata_score, pitta_score, kapha_score),
        }

    @classmethod
    def get_balance_status(cls, vata, pitta, kapha):
        scores = {'Vata': vata, 'Pitta': pitta, 'Kapha': kapha}
        max_dosha = max(scores, key=scores.get)
        min_dosha = min(scores, key=scores.get)

        if scores[max_dosha] - scores[min_dosha] < 3:
            return 'Well Balanced'
        elif scores[max_dosha] > 5:
            return f'{max_dosha} Dominant - Consider balancing foods'
        else:
            return 'Moderately Balanced'

    # ------------------------------------------------------------------
    # Create & persist
    # ------------------------------------------------------------------
    @classmethod
    def create_diet_plan(cls, patient_id, plan_name="Personalized Diet Plan"):
        """Create and save a diet plan for a patient."""
        from models import Patient

        patient = Patient.query.get(patient_id)
        if not patient:
            return None

        plan_data = cls.generate_meal_plan(patient)

        # Deactivate previous active plans
        DietPlan.query.filter_by(patient_id=patient_id, is_active=True).update({'is_active': False})
        db.session.flush()

        diet_plan = DietPlan(
            patient_id=patient_id,
            plan_name=plan_name,
            total_calories=plan_data['total_nutrition']['calories'],
            total_protein=plan_data['total_nutrition']['protein'],
            total_carbs=plan_data['total_nutrition']['carbs'],
            total_fats=plan_data['total_nutrition']['fats'],
            vata_score=plan_data['ayurvedic_balance']['vata'],
            pitta_score=plan_data['ayurvedic_balance']['pitta'],
            kapha_score=plan_data['ayurvedic_balance']['kapha'],
            is_active=True,
        )

        diet_plan.set_plan_data({
            'meal_plan':         plan_data['meal_plan'],
            'total_nutrition':   plan_data['total_nutrition'],
            'ayurvedic_balance': plan_data['ayurvedic_balance'],
            'prakriti_guidelines': plan_data['prakriti_guidelines'],
            'bmi_info':          plan_data['bmi_info'],
            'dataset_recommendations': plan_data['dataset_recommendations'],
        })

        # Associate unique foods
        seen_ids = set()
        unique_foods = []
        for food in plan_data['foods']:
            if food.id not in seen_ids:
                seen_ids.add(food.id)
                unique_foods.append(food)
        diet_plan.foods = unique_foods

        db.session.add(diet_plan)
        db.session.commit()

        return diet_plan
