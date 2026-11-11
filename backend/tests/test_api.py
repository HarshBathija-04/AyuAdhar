from types import SimpleNamespace

import groq
import httpx

from services import ai_service


def test_health_runs_db_probe(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok", "db": "ok"}
    assert res.headers["X-Content-Type-Options"] == "nosniff"


def test_validation_errors_are_consistent(client):
    res = client.post("/api/login", json={"email": "not-an-email"})
    body = res.get_json()
    assert res.status_code == 400
    assert body["code"] == "validation_error"
    assert {d["field"] for d in body["details"]} >= {"email", "password"}


def test_patient_registration_requires_measurements(client):
    res = client.post(
        "/api/register", json={"name": "A", "email": "a@x.io", "password": "longenough", "role": "patient"}
    )
    assert res.status_code == 400


def test_register_then_login(client):
    payload = {
        "name": "New Patient",
        "email": "New.Patient@Example.com",
        "password": "s3cretpass",
        "role": "patient",
        "age": 31,
        "gender": "female",
        "weight_kg": 60,
        "height_cm": 160,
    }
    assert client.post("/api/register", json=payload).status_code == 201
    assert client.post("/api/register", json=payload).status_code == 409
    res = client.post("/api/login", json={"email": "new.patient@example.com", "password": "s3cretpass"})
    assert res.status_code == 200
    me = client.get("/api/patient/my-data", headers={"Authorization": f"Bearer {res.get_json()['token']}"})
    assert me.status_code == 200 and me.get_json()["patient"]["weight_kg"] == 60


def test_wrong_password(client):
    assert client.post("/api/login", json={"email": "dietitian@ayuaahar.com", "password": "nope"}).status_code == 401


def test_auth_required(client):
    assert client.get("/api/patients").status_code == 401
    assert client.get("/api/patients", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_dietitian_patient_crud_and_plan(client, dietitian):
    res = client.post(
        "/api/patients",
        headers=dietitian,
        json={"name": "Crud Test", "age": 40, "gender": "male", "prakriti": "Pitta", "weight_kg": 80, "height_cm": 178},
    )
    assert res.status_code == 201
    pid = res.get_json()["patient"]["id"]

    assert client.put(f"/api/patients/{pid}", headers=dietitian, json={"age": 41}).get_json()["patient"]["age"] == 41
    assert client.put(f"/api/patients/{pid}", headers=dietitian, json={"prakriti": "Unknown"}).status_code == 400

    plan = client.post(f"/api/generate-diet-plan/{pid}", headers=dietitian, json={})
    assert plan.status_code == 201
    data = plan.get_json()["diet_plan"]["plan_data"]
    assert data["bmi_info"]["category"] == "Overweight"
    assert data["meal_plan"]["dinner"]["foods"], "dinner should have dishes"

    appt = client.post(
        "/api/appointments", headers=dietitian, json={"patient_id": pid, "appointment_date": "2030-01-02T09:30"}
    )
    assert appt.status_code == 201
    assert client.delete(f"/api/patients/{pid}", headers=dietitian).status_code == 200
    assert client.get(f"/api/patients/{pid}", headers=dietitian).status_code == 404


def test_patient_cannot_read_other_patients(client, patient, dietitian):
    others = [p["id"] for p in client.get("/api/patients", headers=dietitian).get_json()["patients"]]
    mine = client.get("/api/patient/my-data", headers=patient).get_json()["patient"]["id"]
    other = next(i for i in others if i != mine)
    assert client.get(f"/api/patients/{other}", headers=patient).status_code == 404
    assert client.get(f"/api/progress/{other}/stats", headers=patient).status_code == 404
    assert client.get(f"/api/patients/{mine}", headers=patient).status_code == 200
    assert client.get("/api/patients", headers=patient).status_code == 403


def _fake_client(reply=None, exc=None):
    def create(**kwargs):
        assert kwargs["model"] == "openai/gpt-oss-120b"
        assert kwargs["messages"][0]["role"] == "system"
        if exc:
            raise exc
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=reply))])

    return lambda: SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


def test_ai_chat_returns_reply_with_disclaimer(client, patient, monkeypatch):
    monkeypatch.setattr(ai_service, "_client", _fake_client("Eat warm, cooked meals."))
    res = client.post("/api/ai/chat", headers=patient, json={"messages": [{"role": "user", "content": "Tips?"}]})
    assert res.status_code == 200
    body = res.get_json()
    assert body["reply"] == "Eat warm, cooked meals."
    assert "not a doctor" in body["disclaimer"]


def test_ai_chat_rate_limit_is_graceful(client, patient, monkeypatch):
    response = httpx.Response(429, request=httpx.Request("POST", "http://groq.test"))
    monkeypatch.setattr(
        ai_service, "_client", _fake_client(exc=groq.RateLimitError("slow", response=response, body=None))
    )
    res = client.post("/api/ai/chat", headers=patient, json={"messages": [{"role": "user", "content": "Hi"}]})
    assert res.status_code == 429
    assert res.get_json()["code"] == "ai_unavailable"


def test_ai_chat_without_key(client, patient, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY")
    res = client.post("/api/ai/chat", headers=patient, json={"messages": [{"role": "user", "content": "Hi"}]})
    assert res.status_code == 503


def test_ai_chat_validates_messages(client, patient):
    res = client.post("/api/ai/chat", headers=patient, json={"messages": [{"role": "assistant", "content": "x"}]})
    assert res.status_code == 400


def test_patient_can_self_report_progress_only_for_self(client, patient, dietitian):
    mine = client.get("/api/patient/my-data", headers=patient).get_json()["patient"]["id"]
    ok = client.post(
        "/api/progress", headers=patient, json={"patient_id": mine, "week_number": 9, "adherence_score": 88}
    )
    assert ok.status_code == 201
    other = next(
        p["id"] for p in client.get("/api/patients", headers=dietitian).get_json()["patients"] if p["id"] != mine
    )
    denied = client.post("/api/progress", headers=patient, json={"patient_id": other, "week_number": 9})
    assert denied.status_code == 404


def test_patient_can_request_appointment_for_self_only(client, patient):
    mine = client.get("/api/patient/my-data", headers=patient).get_json()["patient"]["id"]
    res = client.post(
        "/api/appointments",
        headers=patient,
        json={"patient_id": mine, "appointment_date": "2030-03-04T05:30:00Z", "status": "completed"},
    )
    assert res.status_code == 201
    appt = res.get_json()["appointment"]
    assert appt["status"] == "pending"
    assert appt["appointment_date"] == "2030-03-04T05:30:00Z"


def test_dashboard_stats_are_computed(client, dietitian):
    stats = client.get("/api/patients/stats", headers=dietitian).get_json()
    assert stats["active_diet_plans"] >= 1
    assert 0 < stats["average_adherence"] <= 100
