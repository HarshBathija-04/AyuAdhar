# AyuAahar - Diet Plan Generation Service
from models import FoodItem, DietPlan, db
import random

class DietPlanService:
    """Service for generating personalized Ayurvedic diet plans"""
    
    # Prakriti-based dietary guidelines
    PRAKRITI_GUIDELINES = {
        'Vata': {
            'description': 'Vata types need warm, moist, grounding foods',
            'favored_tastes': ['sweet', 'sour', 'salty'],
            'avoid_tastes': ['pungent', 'bitter', 'astringent'],
            'favored_qualities': ['heavy', 'oily', 'moist', 'warm'],
            'avoid_qualities': ['light', 'dry', 'cold'],
            'favored_virya': 'heating',
            'daily_calories': {'min': 1800, 'max': 2200}
        },
        'Pitta': {
            'description': 'Pitta types need cool, soothing, moderate foods',
            'favored_tastes': ['sweet', 'bitter', 'astringent'],
            'avoid_tastes': ['pungent', 'sour', 'salty'],
            'favored_qualities': ['heavy', 'cool', 'dry'],
            'avoid_qualities': ['light', 'hot', 'oily'],
            'favored_virya': 'cooling',
            'daily_calories': {'min': 1800, 'max': 2200}
        },
        'Kapha': {
            'description': 'Kapha types need light, warm, stimulating foods',
            'favored_tastes': ['pungent', 'bitter', 'astringent'],
            'avoid_tastes': ['sweet', 'sour', 'salty'],
            'favored_qualities': ['light', 'warm', 'dry'],
            'avoid_qualities': ['heavy', 'cold', 'oily'],
            'favored_virya': 'heating',
            'daily_calories': {'min': 1600, 'max': 2000}
        },
        'Vata-Pitta': {
            'description': 'Vata-Pitta types need balancing warm and cool foods',
            'favored_tastes': ['sweet', 'bitter'],
            'avoid_tastes': ['pungent', 'sour'],
            'favored_qualities': ['moderate', 'moist'],
            'avoid_qualities': ['extreme'],
            'favored_virya': 'neutral',
            'daily_calories': {'min': 1800, 'max': 2200}
        },
        'Vata-Kapha': {
            'description': 'Vata-Kapha types need warm, light foods',
            'favored_tastes': ['pungent', 'bitter'],
            'avoid_tastes': ['sweet', 'sour', 'salty'],
            'favored_qualities': ['warm', 'light'],
            'avoid_qualities': ['cold', 'heavy'],
            'favored_virya': 'heating',
            'daily_calories': {'min': 1700, 'max': 2100}
        },
        'Pitta-Kapha': {
            'description': 'Pitta-Kapha types need warm, light, dry foods',
            'favored_tastes': ['pungent', 'bitter', 'astringent'],
            'avoid_tastes': ['sweet', 'sour', 'salty'],
            'favored_qualities': ['light', 'warm', 'dry'],
            'avoid_qualities': ['heavy', 'cold', 'oily'],
            'favored_virya': 'heating',
            'daily_calories': {'min': 1700, 'max': 2100}
        },
        'Tridosha': {
            'description': 'Balanced constitution - varied diet recommended',
            'favored_tastes': ['all in moderation'],
            'avoid_tastes': ['excess of any'],
            'favored_qualities': ['balanced'],
            'avoid_qualities': ['extreme'],
            'favored_virya': 'neutral',
            'daily_calories': {'min': 1800, 'max': 2200}
        }
    }
    
    # Incompatible food combinations (Viruddha Ahara)
    INCOMPATIBLE_COMBINATIONS = [
        ('milk', 'sour fruits'),
        ('milk', 'fish'),
        ('honey', 'hot water'),
        ('yogurt', 'fruits'),
        ('ghee', 'honey in equal parts'),
    ]
    
    @classmethod
    def get_food_score(cls, food, prakriti):
        """Calculate compatibility score for a food item based on prakriti"""
        score = 0
        guidelines = cls.PRAKRITI_GUIDELINES.get(prakriti, cls.PRAKRITI_GUIDELINES['Tridosha'])
        
        # Check if food is suitable for this prakriti
        suitable_prakritis = [p.strip() for p in food.suitable_for.split(',')]
        if prakriti in suitable_prakritis or 'all' in suitable_prakritis:
            score += 10
        
        # Check rasa compatibility
        food_rasas = [r.strip().lower() for r in food.rasa.split(',')]
        for rasa in food_rasas:
            if rasa in guidelines['favored_tastes']:
                score += 5
            elif rasa in guidelines['avoid_tastes']:
                score -= 5
        
        # Check virya compatibility
        if food.virya == guidelines['favored_virya']:
            score += 3
        elif guidelines['favored_virya'] == 'neutral':
            score += 2
        
        # Check dosha effects
        if 'Vata' in prakriti:
            score += food.vata_effect * 2
        if 'Pitta' in prakriti:
            score += food.pitta_effect * 2
        if 'Kapha' in prakriti:
            score += food.kapha_effect * 2
        
        return score
    
    @classmethod
    def select_foods_for_meal(cls, meal_type, prakriti, target_calories, exclude_foods=None):
        """Select appropriate foods for a specific meal"""
        if exclude_foods is None:
            exclude_foods = []
        
        # Get all foods suitable for this meal type
        foods = FoodItem.query.filter(
            (FoodItem.meal_type == meal_type) | (FoodItem.meal_type == 'any')
        ).all()
        
        # Filter out excluded foods and calculate scores
        scored_foods = []
        for food in foods:
            if food.name not in exclude_foods:
                base_score = cls.get_food_score(food, prakriti)
                # Subtly randomize score to introduce variety without ruining compatibility
                # E.g. score of 10 becomes 8-12
                randomized_score = base_score * random.uniform(0.8, 1.2)
                scored_foods.append((food, randomized_score))
        
        # Sort by randomized score (highest first)
        scored_foods.sort(key=lambda x: x[1], reverse=True)
        
        # Select foods to meet calorie target
        selected_foods = []
        current_calories = 0
        
        for food, score in scored_foods:
            if score > 0 and current_calories < target_calories:
                # Add if it doesn't grossly exceed the calorie limit
                if current_calories + food.calories <= target_calories * 1.15:
                    selected_foods.append(food)
                    current_calories += food.calories
                # Or if we have nothing yet (so we at least get something)
                elif not selected_foods:
                    selected_foods.append(food)
                    current_calories += food.calories
        
        return selected_foods
    
    @classmethod
    def generate_meal_plan(cls, patient):
        """Generate a complete daily meal plan for a patient"""
        prakriti = patient.prakriti
        guidelines = cls.PRAKRITI_GUIDELINES.get(prakriti, cls.PRAKRITI_GUIDELINES['Tridosha'])
        
        # Calculate target calories based on age and gender
        base_calories = guidelines['daily_calories']['max']
        if patient.age > 60:
            base_calories -= 200
        elif patient.age < 25:
            base_calories += 100
        
        if patient.gender == 'female':
            base_calories -= 200
        
        # Distribute calories across meals
        breakfast_calories = base_calories * 0.25
        lunch_calories = base_calories * 0.40
        dinner_calories = base_calories * 0.30
        snack_calories = base_calories * 0.05
        
        # Generate each meal
        breakfast_foods = cls.select_foods_for_meal('breakfast', prakriti, breakfast_calories)
        lunch_foods = cls.select_foods_for_meal('lunch', prakriti, lunch_calories)
        dinner_foods = cls.select_foods_for_meal('dinner', prakriti, dinner_calories)
        snack_foods = cls.select_foods_for_meal('snack', prakriti, snack_calories)
        
        # Build meal plan structure
        meal_plan = {
            'breakfast': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in breakfast_foods],
                'total_calories': sum(f.calories for f in breakfast_foods),
                'recommendations': cls.get_meal_recommendations('breakfast', prakriti)
            },
            'lunch': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in lunch_foods],
                'total_calories': sum(f.calories for f in lunch_foods),
                'recommendations': cls.get_meal_recommendations('lunch', prakriti)
            },
            'dinner': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in dinner_foods],
                'total_calories': sum(f.calories for f in dinner_foods),
                'recommendations': cls.get_meal_recommendations('dinner', prakriti)
            },
            'snacks': {
                'foods': [{'name': f.name, 'calories': f.calories, 'quantity': '100g'} for f in snack_foods],
                'total_calories': sum(f.calories for f in snack_foods),
                'recommendations': cls.get_meal_recommendations('snack', prakriti)
            }
        }
        
        # Calculate nutritional totals
        all_foods = breakfast_foods + lunch_foods + dinner_foods + snack_foods
        total_nutrition = {
            'calories': sum(f.calories for f in all_foods),
            'protein': sum(f.protein for f in all_foods),
            'carbs': sum(f.carbs for f in all_foods),
            'fats': sum(f.fats for f in all_foods),
            'fiber': sum(f.fiber for f in all_foods)
        }
        
        # Calculate Ayurvedic balance
        ayurvedic_balance = cls.calculate_ayurvedic_balance(all_foods)
        
        return {
            'meal_plan': meal_plan,
            'total_nutrition': total_nutrition,
            'ayurvedic_balance': ayurvedic_balance,
            'prakriti_guidelines': guidelines['description'],
            'foods': all_foods
        }
    
    @classmethod
    def get_meal_recommendations(cls, meal_type, prakriti):
        """Get specific recommendations for each meal based on prakriti"""
        recommendations = {
            'Vata': {
                'breakfast': 'Warm, cooked foods. Avoid cold cereals.',
                'lunch': 'Largest meal of the day. Include warm soups.',
                'dinner': 'Light, warm meal. Eat 2-3 hours before bed.',
                'snack': 'Warm milk, nuts, or ripe fruits.'
            },
            'Pitta': {
                'breakfast': 'Cool or room temperature foods. Sweet fruits.',
                'lunch': 'Moderate portions. Include cooling vegetables.',
                'dinner': 'Light, early dinner. Avoid spicy foods.',
                'snack': 'Sweet fruits, coconut water, or cool milk.'
            },
            'Kapha': {
                'breakfast': 'Light or skip breakfast. Warm spices.',
                'lunch': 'Main meal. Include pungent spices.',
                'dinner': 'Very light, early dinner. No heavy foods.',
                'snack': 'Honey water or light fruits. Avoid heavy snacks.'
            }
        }
        
        # Get base recommendation
        base_prakriti = prakriti.split('-')[0] if '-' in prakriti else prakriti
        return recommendations.get(base_prakriti, recommendations['Vata']).get(meal_type, '')
    
    @classmethod
    def calculate_ayurvedic_balance(cls, foods):
        """Calculate the Ayurvedic balance (dosha effects) of selected foods"""
        vata_score = sum(f.vata_effect for f in foods)
        pitta_score = sum(f.pitta_effect for f in foods)
        kapha_score = sum(f.kapha_effect for f in foods)
        
        # Normalize scores
        total = abs(vata_score) + abs(pitta_score) + abs(kapha_score)
        if total > 0:
            vata_pct = (vata_score + total/2) / total * 100
            pitta_pct = (pitta_score + total/2) / total * 100
            kapha_pct = (kapha_score + total/2) / total * 100
        else:
            vata_pct = pitta_pct = kapha_pct = 33.33
        
        return {
            'vata': round(vata_score, 1),
            'pitta': round(pitta_score, 1),
            'kapha': round(kapha_score, 1),
            'vata_percentage': round(vata_pct, 1),
            'pitta_percentage': round(pitta_pct, 1),
            'kapha_percentage': round(kapha_pct, 1),
            'balance_status': cls.get_balance_status(vata_score, pitta_score, kapha_score)
        }
    
    @classmethod
    def get_balance_status(cls, vata, pitta, kapha):
        """Determine the balance status based on dosha scores"""
        scores = {'Vata': vata, 'Pitta': pitta, 'Kapha': kapha}
        max_dosha = max(scores, key=scores.get)
        min_dosha = min(scores, key=scores.get)
        
        if scores[max_dosha] - scores[min_dosha] < 3:
            return 'Well Balanced'
        elif scores[max_dosha] > 5:
            return f'{max_dosha} Dominant - Consider balancing foods'
        else:
            return 'Moderately Balanced'
    
    @classmethod
    def create_diet_plan(cls, patient_id, plan_name="Personalized Diet Plan"):
        """Create and save a diet plan for a patient"""
        from models import Patient
        
        patient = Patient.query.get(patient_id)
        if not patient:
            return None
        
        # Generate meal plan
        plan_data = cls.generate_meal_plan(patient)
        
        # Deactivate previous active plans FIRST (before adding new one)
        DietPlan.query.filter_by(patient_id=patient_id, is_active=True).update({'is_active': False})
        db.session.flush()
        
        # Create diet plan record
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
            is_active=True
        )
        
        # Set plan data as JSON
        diet_plan.set_plan_data({
            'meal_plan': plan_data['meal_plan'],
            'total_nutrition': plan_data['total_nutrition'],
            'ayurvedic_balance': plan_data['ayurvedic_balance'],
            'prakriti_guidelines': plan_data['prakriti_guidelines']
        })
        
        # Associate unique foods with the plan (deduplicate - same food can appear in multiple meals)
        seen_ids = set()
        unique_foods = []
        for food in plan_data['foods']:
            if food.id not in seen_ids:
                seen_ids.add(food.id)
                unique_foods.append(food)
        diet_plan.foods = unique_foods
        
        # Save new plan
        db.session.add(diet_plan)
        db.session.commit()
        
        return diet_plan
