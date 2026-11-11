# AyuAahar - request validation schemas (pydantic v2)
from datetime import UTC, datetime
from typing import Annotated, Literal

from flask import request
from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, StringConstraints, model_validator

Prakriti = Literal["Vata", "Pitta", "Kapha", "Vata-Pitta", "Vata-Kapha", "Pitta-Kapha", "Tridosha"]
Gender = Literal["male", "female", "other"]
Status = Literal["pending", "completed", "cancelled"]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]
# Stored as naive UTC; timezone-aware input (e.g. ISO strings ending in Z) is converted first
UtcDateTime = Annotated[datetime, AfterValidator(lambda d: d.astimezone(UTC).replace(tzinfo=None) if d.tzinfo else d)]


class Strict(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


def parse(model: type[BaseModel]):
    """Validate the JSON body against `model`; ValidationError is turned into a 400 centrally."""
    return model.model_validate(request.get_json(silent=True) or {})


def parse_partial(model: type[BaseModel]) -> dict:
    """Validate a partial update: only fields present in the body are returned."""
    return parse(model).model_dump(exclude_unset=True)


class RegisterIn(Strict):
    name: Name
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]
    role: Literal["dietitian", "patient"]
    age: int | None = Field(default=None, ge=1, le=120)
    gender: Gender | None = None
    weight_kg: float | None = Field(default=None, gt=10, le=400)
    height_cm: float | None = Field(default=None, gt=50, le=260)
    prakriti: Prakriti | Literal["Not Known"] | None = None
    condition: LongText | None = None

    @model_validator(mode="after")
    def patient_fields(self):
        if self.role == "patient":
            for f in ("age", "gender", "weight_kg", "height_cm"):
                if getattr(self, f) is None:
                    raise ValueError(f"{f} is required for patient registration")
        return self


class LoginIn(Strict):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=1, max_length=128)]


class ProfileUpdateIn(Strict):
    name: Name


class PatientIn(Strict):
    name: Name
    age: int = Field(ge=1, le=120)
    gender: Gender
    prakriti: Prakriti
    weight_kg: float | None = Field(default=None, gt=10, le=400)
    height_cm: float | None = Field(default=None, gt=50, le=260)
    condition: LongText | None = ""
    lifestyle: LongText | None = ""


class PatientUpdateIn(Strict):
    name: Name | None = None
    age: int | None = Field(default=None, ge=1, le=120)
    gender: Gender | None = None
    prakriti: Prakriti | None = None
    weight_kg: float | None = Field(default=None, gt=10, le=400)
    height_cm: float | None = Field(default=None, gt=50, le=260)
    condition: LongText | None = None
    lifestyle: LongText | None = None


class AppointmentIn(Strict):
    patient_id: int = Field(gt=0)
    appointment_date: UtcDateTime
    notes: LongText | None = ""
    status: Status = "pending"


class AppointmentUpdateIn(Strict):
    appointment_date: UtcDateTime | None = None
    notes: LongText | None = None
    status: Status | None = None


class ProgressIn(Strict):
    patient_id: int = Field(gt=0)
    week_number: int = Field(ge=1, le=520)
    adherence_score: int = Field(default=0, ge=0, le=100)
    weight: float | None = Field(default=None, gt=10, le=400)
    notes: LongText | None = ""
    symptoms: LongText | None = ""


class ProgressUpdateIn(Strict):
    week_number: int | None = Field(default=None, ge=1, le=520)
    adherence_score: int | None = Field(default=None, ge=0, le=100)
    weight: float | None = Field(default=None, gt=10, le=400)
    notes: LongText | None = None
    symptoms: LongText | None = None


class GeneratePlanIn(Strict):
    plan_name: Name | None = None


class DietPlanUpdateIn(Strict):
    plan_name: Name | None = None
    is_active: bool | None = None


Short = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class FoodItemIn(Strict):
    name: Short
    category: Short
    calories: float = Field(ge=0, le=1000)
    protein: float = Field(ge=0, le=100)
    carbs: float = Field(ge=0, le=100)
    fats: float = Field(ge=0, le=100)
    fiber: float = Field(default=0, ge=0, le=100)
    rasa: Short
    guna: Short
    virya: Literal["heating", "cooling"]
    vipaka: Literal["sweet", "sour", "pungent"]
    vata_effect: int = Field(default=0, ge=-1, le=1)
    pitta_effect: int = Field(default=0, ge=-1, le=1)
    kapha_effect: int = Field(default=0, ge=-1, le=1)
    suitable_for: Short
    meal_type: Literal["breakfast", "lunch", "dinner", "snack", "any"]


class NutritionItem(Strict):
    food_id: int = Field(gt=0)
    quantity: float = Field(default=100, gt=0, le=5000)


class AnalyzeNutritionIn(Strict):
    food_items: list[NutritionItem] = Field(min_length=1, max_length=100)


class ChatMessage(Strict):
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class ChatIn(Strict):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    patient_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def last_is_user(self):
        if self.messages[-1].role != "user":
            raise ValueError("the last message must come from the user")
        return self
