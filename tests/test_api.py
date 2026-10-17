# Flask API er test (alada temporary database e, asol data nosto hobe na)
import pytest

from app import app
from backend import database


@pytest.fixture
def client(tmp_path, monkeypatch):
    # test er jonno alada database file
    monkeypatch.setattr(database, "DB_FILE", str(tmp_path / "test.db"))
    database.init_db()
    app.config["TESTING"] = True
    return app.test_client()


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_brute_force_creates_alert(client):
    res = client.post("/api/simulate/brute_force")
    assert res.status_code == 200
    assert res.get_json()["alerts"][0]["severity"] == "high"


def test_normal_creates_no_alert(client):
    res = client.post("/api/simulate/normal")
    assert res.get_json()["alerts"] == []


def test_unknown_scenario(client):
    res = client.post("/api/simulate/unknown")
    assert res.status_code == 404


def test_alerts_are_saved(client):
    client.post("/api/simulate/port_scan")
    alerts = client.get("/api/alerts").get_json()
    assert len(alerts) == 1
    assert alerts[0]["rule_name"] == "Port Scan"


def test_csv_export(client):
    client.post("/api/simulate/brute_force")
    res = client.get("/api/export/alerts")
    assert res.mimetype == "text/csv"
    assert b"Repeated Failed Logins" in res.data