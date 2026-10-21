import sys
from pathlib import Path
import numpy as np
import json
from PIL import Image

sys.path.insert(0, str(Path(__file__).parents[1]))
sys.path.insert(0, str(Path(__file__).parents[1] / "training"))
from app.main import zone_for, who_band, quality_check, FEATURES as API_FEATURES, ROI as API_ROI
from features import FEATURES, ROI, features_from_rgb
from app.oral_triage import triage_oral

FIXTURES = Path(__file__).parents[2] / "shared" / "oral_triage_cases.json"


def test_oral_shared_contract_cases():
    for case in json.loads(FIXTURES.read_text(encoding="utf-8")):
        result = triage_oral(case["input"])
        assert result.get("category") == case["category"], case["name"]
        assert [rule["code"] for rule in result["rules"]] == case["codes"], case["name"]


def test_oral_http_routes_and_consent(monkeypatch, tmp_path):
    from fastapi.testclient import TestClient
    import app.main as api
    import app.security as security

    monkeypatch.setattr(api, "DB_PATH", tmp_path / "oral.sqlite")
    monkeypatch.setattr(security, "SECRET", "test-secret-that-is-long-enough-for-token-signing")
    con = api.db()
    con.execute(
        "INSERT INTO users(username,password_hash,role,village_id) VALUES(?,?,?,?)",
        ("worker", security.password_hash("password123"), "client", "v1"),
    )
    con.commit()
    con.close()
    with TestClient(api.app) as client:
        token = client.post(
            "/api/auth/login", json={"username": "worker", "password": "password123"}
        ).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        changed = client.post(
            "/api/auth/change-password",
            headers=headers,
            json={"current_password": "password123", "new_password": "changed-password-2026"},
        )
        assert changed.status_code == 200
        token = client.post(
            "/api/auth/login", json={"username": "worker", "password": "changed-password-2026"}
        ).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        denied = client.post("/api/oral/screen", headers=headers, json={"consent": False})
        assert denied.status_code == 400
        response = client.post(
            "/api/oral/screen",
            headers=headers,
            json={"consent": True, "village": "v1", "findings": [{"type": "red"}]},
        )
        assert response.status_code == 200
        saved = response.json()
        assert saved["category"] == "urgent"
        assert client.get("/api/oral/logs", headers=headers).status_code == 403
        con = api.db()
        con.execute("UPDATE users SET role='admin' WHERE username='worker'")
        con.commit()
        con.close()
        admin = client.post(
            "/api/auth/login", json={"username": "worker", "password": "changed-password-2026"}
        ).json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin}"}
        assert (
            client.get("/api/oral/logs", headers=admin_headers).json()["logs"][0]["triage"]
            == "urgent"
        )
        assert client.post(
            f"/api/oral/logs/{saved['id']}/outcome",
            headers=admin_headers,
            json={"outcome": "OPMD confirmed", "referral_status": "attended"},
        ).json()["saved"]
        summary = client.get("/api/oral/stats", headers=admin_headers).json()
        assert (
            summary["screened"] == 1 and summary["villages"][0]["referral_completion_rate"] == 100
        )


def test_zones_and_danger():
    assert zone_for(10, 0.2, 11, False) == "red"
    assert zone_for(11, 0.2, 11, False) == "amber"
    assert zone_for(12, 0.2, 11, False) == "green"
    assert zone_for(14, 0.1, 11, True) == "red"


def test_who_bands():
    assert who_band(6.9, "child_6_59m") == "Severe"
    assert who_band(9, "child_6_59m") == "Moderate"
    assert who_band(10.5, "child_6_59m") == "Mild"
    assert who_band(12, "child_6_59m") == "No anaemia by listed threshold"


def test_quality_checks_reject_blank():
    result = quality_check(Image.new("RGB", (200, 200), (255, 255, 255)))
    assert not result["passed"] and not result["checks"]["glare"]


def test_training_feature_parity():
    assert FEATURES == API_FEATURES and ROI == API_ROI
    pixels = np.arange(6 * 7 * 3, dtype=np.uint8).reshape(6, 7, 3)
    assert np.allclose(
        features_from_rgb(pixels),
        __import__("app.main", fromlist=["features_from_rgb"]).features_from_rgb(pixels),
    )


def test_auth_roles_village_scope_and_idempotent_sync(monkeypatch, tmp_path):
    from fastapi.testclient import TestClient
    import app.main as api
    import app.security as security

    monkeypatch.setattr(api, "DB_PATH", tmp_path / "portals.sqlite")
    monkeypatch.setattr(security, "SECRET", "test-secret-that-is-long-enough-for-token-signing")
    con = api.db()
    con.execute(
        "INSERT INTO users(username,password_hash,role,village_id,force_password_change) VALUES(?,?,?,?,0)",
        ("worker", security.password_hash("worker-password-2026"), "client", "village-a"),
    )
    con.execute(
        "INSERT INTO users(username,password_hash,role,force_password_change) VALUES(?,?,?,0)",
        ("admin", security.password_hash("admin-password-2026"), "admin"),
    )
    con.commit()
    con.close()
    with TestClient(api.app) as client:
        worker = client.post(
            "/api/auth/login", json={"username": "worker", "password": "worker-password-2026"}
        ).json()["access_token"]
        wh = {"Authorization": f"Bearer {worker}"}
        for route in api.app.routes:
            if not route.path.startswith("/api/admin/"):
                continue
            for method in route.methods & {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                assert client.request(method, route.path, headers=wh, json={}).status_code == 403, (
                    method,
                    route.path,
                )
        packet = {
            "records": [
                {
                    "client_key": "device-key-0001",
                    "patient_id": "village-a-01",
                    "village_id": "village-a",
                    "age_band": "adult",
                    "sex": "not recorded",
                    "kind": "oral",
                    "consent": True,
                    "payload": {"demo_data": True},
                    "triage": "routine",
                }
            ]
        }
        first = client.post("/api/sync", headers=wh, json=packet)
        assert first.status_code == 200
        second = client.post("/api/sync", headers=wh, json=packet)
        assert second.status_code == 200
        assert first.json()["accepted"] == second.json()["accepted"]
        con = api.db()
        assert con.execute("SELECT COUNT(*) FROM screenings").fetchone()[0] == 1
        con.close()
        packet["records"][0]["village_id"] = "village-b"
        assert client.post("/api/sync", headers=wh, json=packet).status_code == 403
        admin = client.post(
            "/api/auth/login", json={"username": "admin", "password": "admin-password-2026"}
        ).json()["access_token"]
        ah = {"Authorization": f"Bearer {admin}"}
        assert client.get("/api/admin/overview", headers=ah).status_code == 200
        assert client.get("/api/admin/audit", headers=ah).json()["events"]
