from types import SimpleNamespace

import pytest

from services.diet_plan_service import DietPlanService
from services.report_service import ReportService


def make_patient(**kw):
    base = dict(age=30, gender="male", weight_kg=70.0, height_cm=175.0, prakriti="Vata", condition="")
    return SimpleNamespace(**{**base, **kw})


def test_bmr_mifflin_st_jeor():
    assert DietPlanService.calculate_bmr(30, "male", 70, 175) == pytest.approx(1648.75)
    assert DietPlanService.calculate_bmr(30, "female", 70, 175) == pytest.approx(1482.75)


def test_bmi():
    assert DietPlanService.calculate_bmi(70, 175) == pytest.approx(22.86, abs=0.01)


def test_target_calories_bmi_adjustments_and_clamp():
    assert DietPlanService.calculate_target_calories(make_patient()) == round(1648.75 * 1.375)
    # obese patients get a 500 kcal deficit relative to their own TDEE
    tdee = (10 * 120 + 6.25 * 175 - 5 * 30 + 5) * 1.375
    assert DietPlanService.calculate_target_calories(make_patient(weight_kg=120)) == round(tdee - 500)
    tiny = make_patient(weight_kg=20, height_cm=60, age=90, gender="female")
    assert DietPlanService.calculate_target_calories(tiny) == 1200


def test_target_calories_fallback_without_measurements():
    assert DietPlanService.calculate_target_calories(make_patient(weight_kg=None)) == 2000
    assert DietPlanService.calculate_target_calories(make_patient(weight_kg=None, gender="female", age=70)) == 1600


def food(**kw):
    base = dict(
        name="F",
        calories=100,
        protein=10,
        carbs=20,
        fats=5,
        fiber=2,
        rasa="sweet, sour",
        virya="heating",
        vipaka="sweet",
        suitable_for="Vata",
        vata_effect=-1,
        pitta_effect=0,
        kapha_effect=1,
    )
    return SimpleNamespace(**{**base, **kw})


def test_food_score_prefers_matching_prakriti():
    good = DietPlanService.get_food_score(food(), "Vata")
    bad = DietPlanService.get_food_score(food(rasa="bitter", virya="cooling", suitable_for="Kapha"), "Vata")
    assert good > bad


def test_analyze_nutrition_scales_by_quantity():
    result = DietPlanService.analyze_nutrition([(food(), 150), (food(rasa="bitter", virya="cooling"), 50)])
    assert result["total_nutrition"]["calories"] == 200
    assert result["ayurvedic_summary"]["rasa_counts"] == {"sweet": 1, "sour": 1, "bitter": 1}
    assert result["ayurvedic_summary"]["virya_counts"] == {"heating": 1, "cooling": 1}


def test_progress_stats():
    logs = [SimpleNamespace(adherence_score=s, weight=w) for s, w in [(50, 80.0), (70, None), (90, 78.5)]]
    stats = ReportService.progress_stats(logs)
    assert stats["average_adherence"] == 70
    assert stats["weight_change"] == -1.5
    assert ReportService.progress_stats([]) is None


def test_balance_status():
    assert DietPlanService.get_balance_status(1, 1, 2) == "Well Balanced"
    assert DietPlanService.get_balance_status(8, 0, 1).startswith("Vata Dominant")
