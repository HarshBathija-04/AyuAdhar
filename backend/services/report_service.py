# AyuAahar - Report Generation Service
from datetime import datetime


class ReportService:
    """Diet and progress reports for a patient."""

    @classmethod
    def generate_diet_report(cls, patient, diet_plan):
        return {
            'report_title': 'AyuAahar - Personalized Diet Report',
            'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'patient_info': {
                'name': patient.name,
                'age': patient.age,
                'gender': patient.gender,
                'prakriti': patient.prakriti,
                'health_conditions': patient.condition or 'None specified',
                'lifestyle': patient.lifestyle or 'Not specified',
            },
            'diet_plan': diet_plan.get_plan_data(),
            'nutritional_summary': {
                k: getattr(diet_plan, k) for k in ('total_calories', 'total_protein', 'total_carbs', 'total_fats')
            },
            'ayurvedic_analysis': {k: getattr(diet_plan, k) for k in ('vata_score', 'pitta_score', 'kapha_score')},
            'recommendations': cls.get_prakriti_recommendations(patient.prakriti),
        }

    @classmethod
    def get_prakriti_recommendations(cls, prakriti):
        recommendations = {
            'Vata': {
                'general_lifestyle': [
                    'Maintain regular daily routine',
                    'Get adequate sleep (7-8 hours)',
                    'Practice grounding activities like yoga',
                    'Avoid excessive travel and stress',
                ],
                'dietary_tips': [
                    'Favor warm, cooked foods over cold/raw',
                    'Use healthy oils like ghee and sesame oil',
                    'Eat at regular times each day',
                    'Avoid skipping meals',
                ],
                'herbs': ['Ashwagandha', 'Brahmi', 'Triphala'],
                'exercise': 'Gentle exercises like yoga, tai chi, walking',
            },
            'Pitta': {
                'general_lifestyle': [
                    'Avoid excessive heat and sun exposure',
                    'Practice cooling breathing exercises',
                    'Manage anger and stress',
                    'Take time to relax and unwind',
                ],
                'dietary_tips': [
                    'Favor cooling foods and drinks',
                    'Reduce spicy, salty, and sour foods',
                    'Eat fresh, sweet fruits',
                    'Avoid skipping meals when hungry',
                ],
                'herbs': ['Brahmi', 'Shatavari', 'Guduchi'],
                'exercise': 'Moderate exercise, swimming, walking in nature',
            },
            'Kapha': {
                'general_lifestyle': [
                    'Wake up early (before 6 AM)',
                    'Stay active throughout the day',
                    'Avoid daytime napping',
                    'Keep environment warm and dry',
                ],
                'dietary_tips': [
                    'Favor light, warm, and spicy foods',
                    'Reduce heavy, oily, and cold foods',
                    'Eat smaller portions',
                    'Allow 3-4 hours between meals',
                ],
                'herbs': ['Trikatu', 'Guggulu', 'Triphala'],
                'exercise': 'Vigorous exercise, running, aerobics',
            },
            'Vata-Pitta': {
                'general_lifestyle': [
                    'Balance activity with rest',
                    'Maintain moderate routine',
                    'Practice stress management',
                    'Avoid extremes of hot or cold',
                ],
                'dietary_tips': [
                    'Favor warm but not hot foods',
                    'Include both grounding and cooling foods',
                    'Eat regular, moderate meals',
                    'Stay hydrated with room temperature water',
                ],
                'herbs': ['Triphala', 'Brahmi', 'Shatavari'],
                'exercise': 'Moderate yoga, swimming, walking',
            },
            'Vata-Kapha': {
                'general_lifestyle': [
                    'Keep warm and active',
                    'Early to bed, early to rise',
                    'Regular exercise is essential',
                    'Avoid cold and damp environments',
                ],
                'dietary_tips': [
                    'Warm, light, and well-spiced foods',
                    'Avoid cold drinks and heavy meals',
                    'Include warming spices like ginger',
                    'Eat at regular intervals',
                ],
                'herbs': ['Trikatu', 'Ashwagandha', 'Chyawanprash'],
                'exercise': 'Brisk walking, yoga, light cardio',
            },
            'Pitta-Kapha': {
                'general_lifestyle': [
                    'Stay active and engaged',
                    'Avoid excessive heat and humidity',
                    'Practice cooling activities',
                    'Maintain regular exercise routine',
                ],
                'dietary_tips': [
                    'Light, warm, and dry foods',
                    'Include bitter and astringent tastes',
                    'Avoid heavy, oily, and sweet foods',
                    'Eat moderately sized meals',
                ],
                'herbs': ['Guggulu', 'Brahmi', 'Kutki'],
                'exercise': 'Active sports, running, competitive activities',
            },
            'Tridosha': {
                'general_lifestyle': [
                    'Maintain balanced routine',
                    'Adjust according to season',
                    'Practice all-around wellness',
                    'Listen to your body\'s needs',
                ],
                'dietary_tips': [
                    'Varied diet with all six tastes',
                    'Adjust according to seasonal changes',
                    'Eat fresh, wholesome foods',
                    'Practice mindful eating',
                ],
                'herbs': ['Triphala', 'Chyawanprash', 'Amalaki'],
                'exercise': 'Balanced mix of yoga, cardio, and strength training',
            },
        }

        return recommendations.get(prakriti, recommendations['Tridosha'])

    @classmethod
    def generate_progress_report(cls, patient, progress_logs):
        weights = [log.weight for log in progress_logs if log.weight]
        avg_adherence = sum(log.adherence_score for log in progress_logs) / len(progress_logs) if progress_logs else 0
        return {
            'report_title': 'AyuAahar - Progress Tracking Report',
            'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'patient_info': {'name': patient.name, 'prakriti': patient.prakriti},
            'summary': {
                'total_weeks_tracked': len(progress_logs),
                'average_adherence': round(avg_adherence, 1),
                'weight_change': round(weights[-1] - weights[0], 1) if len(weights) >= 2 else None,
            },
            'weekly_logs': [log.to_dict() for log in progress_logs],
            'trends': cls.analyze_trends(progress_logs),
        }

    @staticmethod
    def analyze_trends(progress_logs):
        if len(progress_logs) < 2:
            return {'message': 'Insufficient data for trend analysis'}
        logs = sorted(progress_logs, key=lambda x: x.week_number)
        return {
            'adherence_trend': [{'week': log.week_number, 'score': log.adherence_score} for log in logs],
            'weight_trend': [{'week': log.week_number, 'weight': log.weight} for log in logs if log.weight],
            'improving': logs[-1].adherence_score > logs[0].adherence_score,
        }

    @staticmethod
    def progress_stats(progress_logs):
        """Summary statistics for a patient's weekly progress logs (None when empty)."""
        if not progress_logs:
            return None
        scores = [pl.adherence_score or 0 for pl in progress_logs]
        weights = [pl.weight for pl in progress_logs if pl.weight]
        stats = {
            'total_weeks': len(progress_logs),
            'average_adherence': round(sum(scores) / len(scores), 1),
            'adherence_trend': scores,
            'latest_adherence': scores[-1],
            'highest_adherence': max(scores),
            'lowest_adherence': min(scores),
        }
        if len(weights) >= 2:
            stats['weight_change'] = round(weights[-1] - weights[0], 1)
            stats['current_weight'] = weights[-1]
            stats['weight_trend'] = weights
        return stats
