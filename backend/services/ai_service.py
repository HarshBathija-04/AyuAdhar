# AyuAahar - Groq-backed wellness assistant
import logging
import os

import groq

log = logging.getLogger("ayuaahar.ai")

TEXT_MODEL = "openai/gpt-oss-120b"

DISCLAIMER = (
    "AyuAahar's assistant shares general Ayurvedic and nutrition education. It is not a doctor and "
    "does not diagnose, treat or replace professional medical advice. Talk to a qualified clinician "
    "before changing medication or treatment, and seek emergency care for urgent symptoms."
)

SYSTEM_PROMPT = """You are Ayu, the wellness assistant inside AyuAahar, a practice-management app for \
Ayurvedic dietitians and their patients.

Scope: explain Ayurvedic concepts (prakriti, doshas, rasa, guna, virya, vipaka), the patient's diet plan, \
food choices, meal timing, and general lifestyle habits, combining Ayurveda with mainstream nutrition science.

Rules:
- You are not a medical professional. Never diagnose, never prescribe or change medication or dosages, and \
never contradict a clinician's instructions.
- If the user describes red-flag symptoms (chest pain, trouble breathing, fainting, severe pain, suicidal \
thoughts, signs of stroke, very high or low blood sugar), tell them to seek emergency care immediately.
- Herbs and supplements can interact with medicines and pregnancy: always advise checking with their \
doctor or pharmacist first.
- Be warm, concise and practical, under 250 words unless asked for more.
- Format as plain text: short paragraphs and "- " bullet lists, **bold** for key terms. No tables, headings or HTML.
- Use the patient context below when relevant. If it is missing, ask a brief clarifying question.
- Politely decline topics unrelated to diet, wellness or using the app."""


class AIUnavailable(Exception):
    """Raised when the assistant cannot answer; carries an HTTP status and user-safe message."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _client() -> groq.Groq:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise AIUnavailable(503, "The AI assistant is not configured on this server.")
    return groq.Groq(api_key=key, timeout=30.0, max_retries=1)


def patient_context(patient, plan) -> str:
    """Compact, non-identifying summary of a patient for the model (no name or contact details)."""
    if patient is None:
        return "No patient selected."
    lines = [
        f"Age: {patient.age}, gender: {patient.gender}",
        f"Prakriti: {patient.prakriti}",
        f"Weight: {patient.weight_kg or 'unknown'} kg, height: {patient.height_cm or 'unknown'} cm",
        f"Health conditions: {patient.condition or 'none recorded'}",
        f"Lifestyle: {patient.lifestyle or 'not recorded'}",
    ]
    if plan is not None:
        data = plan.get_plan_data()
        meals = data.get("meal_plan", {})
        for meal in ("breakfast", "lunch", "dinner", "snacks"):
            foods = ", ".join(f["name"] for f in meals.get(meal, {}).get("foods", [])) or "none"
            lines.append(f"Plan {meal}: {foods}")
        nutrition = data.get("total_nutrition", {})
        lines.append(
            f"Plan totals: {round(nutrition.get('calories', 0))} kcal "
            f"(target {nutrition.get('target_calories', 'n/a')}), "
            f"balance: {data.get('ayurvedic_balance', {}).get('balance_status', 'n/a')}"
        )
    return "\n".join(lines)


def chat(messages: list[dict], context: str) -> str:
    client = _client()
    try:
        completion = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[{"role": "system", "content": f"{SYSTEM_PROMPT}\n\nPatient context:\n{context}"}, *messages],
            temperature=0.4,
            max_completion_tokens=1024,
            reasoning_effort="low",
        )
    except groq.RateLimitError:
        raise AIUnavailable(429, "The assistant is busy right now. Please try again in a minute.") from None
    except (groq.APIConnectionError, groq.APITimeoutError):
        raise AIUnavailable(504, "The assistant took too long to respond. Please try again.") from None
    except groq.APIError as e:
        log.warning("Groq API error: %s", type(e).__name__)
        raise AIUnavailable(502, "The assistant is temporarily unavailable. Please try again later.") from None

    reply = (completion.choices[0].message.content or "").strip()
    if not reply:
        raise AIUnavailable(502, "The assistant returned an empty answer. Please rephrase and try again.")
    return reply
