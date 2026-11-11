# AyuAahar - Diet Plan Generation Service
# Calorie target: Mifflin-St Jeor BMR -> TDEE -> BMI-adjusted goal
import csv
import os
import random

from models import DietPlan, FoodItem, db


def _load_dataset() -> list[dict]:
    """AyurGenix rows, loaded once at import. The CSV sits in backend/ on Render and in Dataset/ locally."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for path in (
        os.path.join(backend_dir, 'AyurGenixAI_Dataset.csv'),
        os.path.join(backend_dir, '..', 'Dataset', 'AyurGenixAI_Dataset.csv'),
    ):
        if os.path.exists(path):
            with open(path, newline='', encoding='utf-8') as f:
                return list(csv.DictReader(f))
    return []


_DATASET_ROWS = _load_dataset()


class DietPlanService:
    """Service for generating personalised Ayurvedic diet plans."""

    PRAKRITI_GUIDELINES = {
        'Vata': {
            'description': 'Vata types need warm, moist, grounding foods',
            'favored_tastes': ['sweet', 'sour', 'salty'],
            'avoid_tastes': ['pungent', 'bitter', 'astringent'],
            'favored_qualities': ['heavy', 'oily', 'moist', 'warm'],
            'avoid_qualities': ['light', 'dry', 'cold'],
            'favored_virya': 'heating',
            'activity_multiplier': 1.375,  # lightly active default
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
            'activity_multiplier': 1.2,  # Kapha tends to lower activity
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

    @classmethod
    def _guidelines(cls, prakriti):
        return cls.PRAKRITI_GUIDELINES.get(prakriti, cls.PRAKRITI_GUIDELINES['Tridosha'])

    @staticmethod
    def calculate_bmr(age: int, gender: str, weight_kg: float, height_cm: float) -> float:
        """Mifflin-St Jeor BMR equation (kcal/day)."""
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + (-161 if gender == 'female' else 5)

    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        return weight_kg / (height_cm / 100) ** 2

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
        weight, height = patient.weight_kg, patient.height_cm
        if not weight or not height:
            base = 2000 if patient.gender != 'female' else 1800
            if patient.age > 60:
                base -= 200
            elif patient.age < 25:
                base += 100
            return base

        activity = cls._guidelines(patient.prakriti)['activity_multiplier']
        tdee = cls.calculate_bmr(patient.age, patient.gender, weight, height) * activity

        bmi = cls.calculate_bmi(weight, height)
        if bmi < 18.5:
            tdee += 300
        elif 25 <= bmi < 30:
            tdee -= 300
        elif bmi >= 30:
            tdee -= 500
        return max(1200, min(int(round(tdee)), 3500))

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
            row_disease = row.get('Disease', '').lower()
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
                'disease_match': best_row.get('Disease', ''),
                'diet_advice': best_row.get('Diet and Lifestyle Recommendations', ''),
                'yoga_therapy': best_row.get('Yoga & Physical Therapy', ''),
                'ayurvedic_herbs': best_row.get('Ayurvedic Herbs', ''),
                'formulation': best_row.get('Formulation', ''),
                'prevention': best_row.get('Prevention', ''),
                'patient_recommendations': best_row.get('Patient Recommendations', ''),
            }
        return {}

    @classmethod
    def get_food_score(cls, food, prakriti):
        """Compatibility score for a food item based on prakriti."""
        score = 0
        guidelines = cls._guidelines(prakriti)

        suitable_prakritis = [p.strip() for p in food.suitable_for.split(',')]
        if prakriti in suitable_prakritis or 'all' in suitable_prakritis:
            score += 10

        for rasa in (r.strip().lower() for r in food.rasa.split(',')):
            if rasa in guidelines['favored_tastes']:
                score += 5
            elif rasa in guidelines['avoid_tastes']:
                score -= 5

        if food.virya == guidelines['favored_virya']:
            score += 3
        elif guidelines['favored_virya'] == 'neutral':
            score += 2

        for dosha in ('Vata', 'Pitta', 'Kapha'):
            if dosha in prakriti:
                score += getattr(food, f'{dosha.lower()}_effect') * 2
        return score

    @classmethod
    def select_foods_for_meal(cls, meal_type, prakriti, target_calories):
        """Best-scoring foods (with a little randomness for variety) until the meal's calorie target is met."""
        foods = FoodItem.query.filter(FoodItem.meal_type.in_([meal_type, 'any'])).all()
        scored = sorted(
            ((food, cls.get_food_score(food, prakriti) * random.uniform(0.8, 1.2)) for food in foods),
            key=lambda x: x[1],
            reverse=True,
        )

        selected, calories = [], 0
        for food, score in scored:
            if score <= 0 or calories >= target_calories:
                continue
            if calories + food.calories <= target_calories * 1.15 or not selected:
                selected.append(food)
                calories += food.calories
        return selected

    @classmethod
    def generate_meal_plan(cls, patient):
        """Generate a complete daily meal plan for a patient."""
        prakriti = patient.prakriti
        base_calories = cls.calculate_target_calories(patient)

        bmi_info = None
        weight, height = patient.weight_kg, patient.height_cm
        if weight and height:
            bmi = cls.calculate_bmi(weight, height)
            bmi_info = {
                'bmi': round(bmi, 1),
                'category': (
                    'Underweight' if bmi < 18.5 else 'Normal' if bmi < 25 else 'Overweight' if bmi < 30 else 'Obese'
                ),
                'weight_kg': weight,
                'height_cm': height,
            }

        meal_plan, all_foods = {}, []
        # (plan key, food meal_type, share of daily calories)
        for key, meal_type, share in (
            ('breakfast', 'breakfast', 0.25),
            ('lunch', 'lunch', 0.40),
            ('dinner', 'dinner', 0.30),
            ('snacks', 'snack', 0.05),
        ):
            target = base_calories * share
            foods = cls.select_foods_for_meal(meal_type, prakriti, target)
            all_foods += foods
            meal_plan[key] = {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in foods],
                'total_calories': sum(f.calories for f in foods),
                'recommendations': cls.get_meal_recommendations(meal_type, prakriti),
                'target_calories': round(target),
            }

        total_nutrition = {
            'calories': sum(f.calories for f in all_foods),
            'protein': sum(f.protein for f in all_foods),
            'carbs': sum(f.carbs for f in all_foods),
            'fats': sum(f.fats for f in all_foods),
            'fiber': sum(f.fiber for f in all_foods),
            'target_calories': base_calories,
        }

        return {
            'meal_plan': meal_plan,
            'total_nutrition': total_nutrition,
            'ayurvedic_balance': cls.calculate_ayurvedic_balance(all_foods),
            'prakriti_guidelines': cls._guidelines(prakriti)['description'],
            'bmi_info': bmi_info,
            'dataset_recommendations': cls.get_dataset_recommendations(patient),
            'foods': all_foods,
        }

    @classmethod
    def get_meal_recommendations(cls, meal_type, prakriti):
        """Get specific recommendations for each meal based on prakriti."""
        recommendations = {
            'Vata': {
                'breakfast': 'Warm, cooked foods. Avoid cold cereals.',
                'lunch': 'Largest meal of the day. Include warm soups.',
                'dinner': 'Light, warm meal. Eat 2-3 hours before bed.',
                'snack': 'Warm milk, nuts, or ripe fruits.',
            },
            'Pitta': {
                'breakfast': 'Cool or room temperature foods. Sweet fruits.',
                'lunch': 'Moderate portions. Include cooling vegetables.',
                'dinner': 'Light, early dinner. Avoid spicy foods.',
                'snack': 'Sweet fruits, coconut water, or cool milk.',
            },
            'Kapha': {
                'breakfast': 'Light or skip breakfast. Warm spices.',
                'lunch': 'Main meal. Include pungent spices.',
                'dinner': 'Very light, early dinner. No heavy foods.',
                'snack': 'Honey water or light fruits. Avoid heavy snacks.',
            },
        }
        base_prakriti = prakriti.split('-')[0]
        return recommendations.get(base_prakriti, recommendations['Vata']).get(meal_type, '')

    @classmethod
    def calculate_ayurvedic_balance(cls, foods):
        vata_score = sum(f.vata_effect for f in foods)
        pitta_score = sum(f.pitta_effect for f in foods)
        kapha_score = sum(f.kapha_effect for f in foods)

        total = abs(vata_score) + abs(pitta_score) + abs(kapha_score)
        if total > 0:
            vata_pct = (vata_score + total / 2) / total * 100
            pitta_pct = (pitta_score + total / 2) / total * 100
            kapha_pct = (kapha_score + total / 2) / total * 100
        else:
            vata_pct = pitta_pct = kapha_pct = 33.33

        return {
            'vata': round(vata_score, 1),
            'pitta': round(pitta_score, 1),
            'kapha': round(kapha_score, 1),
            'vata_percentage': round(vata_pct, 1),
            'pitta_percentage': round(pitta_pct, 1),
            'kapha_percentage': round(kapha_pct, 1),
            'balance_status': cls.get_balance_status(vata_score, pitta_score, kapha_score),
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

    @staticmethod
    def analyze_nutrition(items):
        """Totals and Ayurvedic summary for [(FoodItem, grams), ...]; nutrition values are per 100 g."""
        total = {'calories': 0.0, 'protein': 0.0, 'carbs': 0.0, 'fats': 0.0, 'fiber': 0.0}
        summary = {
            'rasa_counts': {},
            'virya_counts': {'heating': 0, 'cooling': 0},
            'vipaka_counts': {'sweet': 0, 'sour': 0, 'pungent': 0},
        }
        details = []
        for food, quantity in items:
            ratio = quantity / 100
            for key in total:
                total[key] += (getattr(food, key) or 0) * ratio
            for rasa in (r.strip() for r in food.rasa.split(',') if r.strip()):
                summary['rasa_counts'][rasa] = summary['rasa_counts'].get(rasa, 0) + 1
            summary['virya_counts'][food.virya] = summary['virya_counts'].get(food.virya, 0) + 1
            summary['vipaka_counts'][food.vipaka] = summary['vipaka_counts'].get(food.vipaka, 0) + 1
            details.append({'name': food.name, 'quantity': quantity, 'calories': round(food.calories * ratio, 1)})
        return {
            'total_nutrition': {k: round(v, 1) for k, v in total.items()},
            'ayurvedic_summary': summary,
            'food_details': details,
        }

    @classmethod
    def create_diet_plan(cls, patient_id, plan_name="Personalized Diet Plan"):
        """Create and save a diet plan for a patient."""
        from models import Patient

        patient = db.session.get(Patient, patient_id)
        if not patient:
            return None

        plan_data = cls.generate_meal_plan(patient)
        foods = plan_data.pop('foods')
        nutrition, balance = plan_data['total_nutrition'], plan_data['ayurvedic_balance']

        DietPlan.query.filter_by(patient_id=patient_id, is_active=True).update({'is_active': False})
        diet_plan = DietPlan(
            patient_id=patient_id,
            plan_name=plan_name,
            total_calories=nutrition['calories'],
            total_protein=nutrition['protein'],
            total_carbs=nutrition['carbs'],
            total_fats=nutrition['fats'],
            vata_score=balance['vata'],
            pitta_score=balance['pitta'],
            kapha_score=balance['kapha'],
            is_active=True,
            foods=list({f.id: f for f in foods}.values()),
        )
        diet_plan.set_plan_data(plan_data)
        # Single commit: the previous plan is only deactivated if the new one is saved too
        db.session.add(diet_plan)
        db.session.commit()
        return diet_plan
