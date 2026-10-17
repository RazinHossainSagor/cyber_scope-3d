# Flask app: page + API routes
import csv
import io

from flask import Flask, render_template, jsonify, Response

from backend.database import (
    init_db, save_event, save_alert, get_events, get_alerts, get_stats,
)
from backend.detector import run_detection

app = Flask(__name__)
init_db()


def make_events(scenario):
    # simulation scenario onujayi fake event toiri kore
    if scenario == "brute_force":
        return [
            {"source": "simulation", "event_type": "failed_login",
             "src_ip": "10.0.0.99", "dst_ip": "10.0.0.5", "details": "ssh"}
            for _ in range(6)
        ]
    if scenario == "port_scan":
        return [
            {"source": "simulation", "event_type": "port_probe",
             "src_ip": "10.0.0.99", "dst_ip": "10.0.0.5", "details": str(port)}
            for port in range(20, 32)
        ]
    if scenario == "traffic_spike":
        return [
            {"source": "simulation", "event_type": "http_request",
             "src_ip": "10.0.0.99", "dst_ip": "10.0.0.5", "details": "GET /"}
            for _ in range(40)
        ]
    if scenario == "normal":
        return [
            {"source": "simulation", "event_type": "login_success",
             "src_ip": "10.0.0.10", "dst_ip": "10.0.0.5", "details": "ssh"}
            for _ in range(3)
        ]
    return None


def to_csv(rows):
    # dict list ke CSV text e convert kore
    if not rows:
        return "no data\n"
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/events")
def events():
    return jsonify(get_events())


@app.get("/api/alerts")
def alerts():
    return jsonify(get_alerts())


@app.get("/api/stats")
def stats():
    return jsonify(get_stats())


@app.get("/api/export/<kind>")
def export(kind):
    # kind = events ba alerts
    if kind == "events":
        rows = get_events(100000)
    elif kind == "alerts":
        rows = get_alerts()
    else:
        return jsonify({"error": "unknown report"}), 404

    return Response(
        to_csv(rows),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={kind}_report.csv"},
    )


@app.post("/api/simulate/<scenario>")
def simulate(scenario):
    events = make_events(scenario)
    if events is None:
        return jsonify({"error": "unknown scenario"}), 404

    for e in events:
        save_event(e)

    found = run_detection(events)
    for a in found:
        save_alert(a)

    return jsonify({"events": events, "alerts": found})


if __name__ == "__main__":
    app.run(debug=True)