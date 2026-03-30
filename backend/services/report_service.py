# AyuAahar - Report Generation Service
from datetime import datetime
import json

class ReportService:
    """Service for generating patient reports"""
    
    @classmethod
    def generate_diet_report(cls, patient, diet_plan):
        """Generate a comprehensive diet report for a patient"""
        
        report = {
            'report_title': 'AyuAahar - Personalized Diet Report',
            'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'patient_info': {
                'name': patient.name,
                'age': patient.age,
                'gender': patient.gender,
                'prakriti': patient.prakriti,
                'health_conditions': patient.condition or 'None specified',
                'lifestyle': patient.lifestyle or 'Not specified'
            },
            'diet_plan': diet_plan.get_plan_data() if diet_plan else None,
            'nutritional_summary': {
                'total_calories': diet_plan.total_calories if diet_plan else 0,
                'total_protein': diet_plan.total_protein if diet_plan else 0,
                'total_carbs': diet_plan.total_carbs if diet_plan else 0,
                'total_fats': diet_plan.total_fats if diet_plan else 0
            },
            'ayurvedic_analysis': {
                'vata_score': diet_plan.vata_score if diet_plan else 0,
                'pitta_score': diet_plan.pitta_score if diet_plan else 0,
                'kapha_score': diet_plan.kapha_score if diet_plan else 0
            },
            'recommendations': cls.get_prakriti_recommendations(patient.prakriti)
        }
        
        return report
    
    @classmethod
    def get_prakriti_recommendations(cls, prakriti):
        """Get lifestyle and dietary recommendations based on prakriti"""
        recommendations = {
            'Vata': {
                'general_lifestyle': [
                    'Maintain regular daily routine',
                    'Get adequate sleep (7-8 hours)',
                    'Practice grounding activities like yoga',
                    'Avoid excessive travel and stress'
                ],
                'dietary_tips': [
                    'Favor warm, cooked foods over cold/raw',
                    'Use healthy oils like ghee and sesame oil',
                    'Eat at regular times each day',
                    'Avoid skipping meals'
                ],
                'herbs': ['Ashwagandha', 'Brahmi', 'Triphala'],
                'exercise': 'Gentle exercises like yoga, tai chi, walking'
            },
            'Pitta': {
                'general_lifestyle': [
                    'Avoid excessive heat and sun exposure',
                    'Practice cooling breathing exercises',
                    'Manage anger and stress',
                    'Take time to relax and unwind'
                ],
                'dietary_tips': [
                    'Favor cooling foods and drinks',
                    'Reduce spicy, salty, and sour foods',
                    'Eat fresh, sweet fruits',
                    'Avoid skipping meals when hungry'
                ],
                'herbs': ['Brahmi', 'Shatavari', 'Guduchi'],
                'exercise': 'Moderate exercise, swimming, walking in nature'
            },
            'Kapha': {
                'general_lifestyle': [
                    'Wake up early (before 6 AM)',
                    'Stay active throughout the day',
                    'Avoid daytime napping',
                    'Keep environment warm and dry'
                ],
                'dietary_tips': [
                    'Favor light, warm, and spicy foods',
                    'Reduce heavy, oily, and cold foods',
                    'Eat smaller portions',
                    'Allow 3-4 hours between meals'
                ],
                'herbs': ['Trikatu', 'Guggulu', 'Triphala'],
                'exercise': 'Vigorous exercise, running, aerobics'
            },
            'Vata-Pitta': {
                'general_lifestyle': [
                    'Balance activity with rest',
                    'Maintain moderate routine',
                    'Practice stress management',
                    'Avoid extremes of hot or cold'
                ],
                'dietary_tips': [
                    'Favor warm but not hot foods',
                    'Include both grounding and cooling foods',
                    'Eat regular, moderate meals',
                    'Stay hydrated with room temperature water'
                ],
                'herbs': ['Triphala', 'Brahmi', 'Shatavari'],
                'exercise': 'Moderate yoga, swimming, walking'
            },
            'Vata-Kapha': {
                'general_lifestyle': [
                    'Keep warm and active',
                    'Early to bed, early to rise',
                    'Regular exercise is essential',
                    'Avoid cold and damp environments'
                ],
                'dietary_tips': [
                    'Warm, light, and well-spiced foods',
                    'Avoid cold drinks and heavy meals',
                    'Include warming spices like ginger',
                    'Eat at regular intervals'
                ],
                'herbs': ['Trikatu', 'Ashwagandha', 'Chyawanprash'],
                'exercise': 'Brisk walking, yoga, light cardio'
            },
            'Pitta-Kapha': {
                'general_lifestyle': [
                    'Stay active and engaged',
                    'Avoid excessive heat and humidity',
                    'Practice cooling activities',
                    'Maintain regular exercise routine'
                ],
                'dietary_tips': [
                    'Light, warm, and dry foods',
                    'Include bitter and astringent tastes',
                    'Avoid heavy, oily, and sweet foods',
                    'Eat moderately sized meals'
                ],
                'herbs': ['Guggulu', 'Brahmi', 'Kutki'],
                'exercise': 'Active sports, running, competitive activities'
            },
            'Tridosha': {
                'general_lifestyle': [
                    'Maintain balanced routine',
                    'Adjust according to season',
                    'Practice all-around wellness',
                    'Listen to your body\'s needs'
                ],
                'dietary_tips': [
                    'Varied diet with all six tastes',
                    'Adjust according to seasonal changes',
                    'Eat fresh, wholesome foods',
                    'Practice mindful eating'
                ],
                'herbs': ['Triphala', 'Chyawanprash', 'Amalaki'],
                'exercise': 'Balanced mix of yoga, cardio, and strength training'
            }
        }
        
        return recommendations.get(prakriti, recommendations['Tridosha'])
    
    @classmethod
    def generate_progress_report(cls, patient, progress_logs):
        """Generate a progress tracking report"""
        
        # Calculate statistics
        if progress_logs:
            avg_adherence = sum(log.adherence_score for log in progress_logs) / len(progress_logs)
            weights = [log.weight for log in progress_logs if log.weight]
            weight_change = None
            if len(weights) >= 2:
                weight_change = weights[-1] - weights[0]
        else:
            avg_adherence = 0
            weight_change = None
        
        report = {
            'report_title': 'AyuAahar - Progress Tracking Report',
            'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'patient_info': {
                'name': patient.name,
                'prakriti': patient.prakriti
            },
            'summary': {
                'total_weeks_tracked': len(progress_logs),
                'average_adherence': round(avg_adherence, 1),
                'weight_change': round(weight_change, 1) if weight_change else None
            },
            'weekly_logs': [log.to_dict() for log in progress_logs],
            'trends': cls.analyze_trends(progress_logs)
        }
        
        return report
    
    @classmethod
    def analyze_trends(cls, progress_logs):
        """Analyze trends in progress logs"""
        if len(progress_logs) < 2:
            return {'message': 'Insufficient data for trend analysis'}
        
        # Sort by week
        sorted_logs = sorted(progress_logs, key=lambda x: x.week_number)
        
        adherence_trend = []
        weight_trend = []
        
        for log in sorted_logs:
            adherence_trend.append({'week': log.week_number, 'score': log.adherence_score})
            if log.weight:
                weight_trend.append({'week': log.week_number, 'weight': log.weight})
        
        return {
            'adherence_trend': adherence_trend,
            'weight_trend': weight_trend,
            'improving': adherence_trend[-1]['score'] > adherence_trend[0]['score'] if len(adherence_trend) > 1 else None
        }
