# SQLite storage: events ar alerts
import sqlite3

DB_FILE = "cyberscope.db"


def get_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # row ke dict-er moto use korar jonno
    return conn


def init_db():
    # table na thakle toiri kore
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                source TEXT,
                event_type TEXT,
                src_ip TEXT,
                dst_ip TEXT,
                details TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                rule_name TEXT,
                severity TEXT,
                reason TEXT
            )
        """)


def save_event(e):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO events (source, event_type, src_ip, dst_ip, details) "
            "VALUES (?, ?, ?, ?, ?)",
            (e["source"], e["event_type"], e["src_ip"], e["dst_ip"], e["details"]),
        )


def save_alert(a):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO alerts (rule_name, severity, reason) VALUES (?, ?, ?)",
            (a["rule_name"], a["severity"], a["reason"]),
        )


def get_events(limit=30):
    # shobcheye notun event age
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


def get_alerts():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM alerts ORDER BY id DESC").fetchall()
    return [dict(r) for r in rows]


def get_stats():
    with get_conn() as conn:
        events = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        alerts = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
        high = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE severity = 'high'"
        ).fetchone()[0]
        medium = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE severity = 'medium'"
        ).fetchone()[0]
    return {
        "events": events,
        "alerts": alerts,
        "high_alerts": high,
        "medium_alerts": medium,
    }