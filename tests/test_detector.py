# Detection rule er test: threshold er niche, soman, ar upore
from backend.detector import (
    detect_failed_logins,
    detect_port_scan,
    detect_traffic_spike,
    run_detection,
)


def make_logins(n):
    return [{"event_type": "failed_login", "details": "ssh"} for _ in range(n)]


def make_probes(n):
    return [{"event_type": "port_probe", "details": str(p)} for p in range(n)]


def make_requests(n):
    return [{"event_type": "http_request", "details": "GET /"} for _ in range(n)]


def test_failed_logins_below_threshold():
    assert detect_failed_logins(make_logins(4)) is None


def test_failed_logins_at_threshold():
    result = detect_failed_logins(make_logins(5))
    assert result["severity"] == "high"


def test_failed_logins_above_threshold():
    result = detect_failed_logins(make_logins(8))
    assert result["rule_name"] == "Repeated Failed Logins"


def test_port_scan_below_threshold():
    assert detect_port_scan(make_probes(9)) is None


def test_port_scan_at_threshold():
    result = detect_port_scan(make_probes(10))
    assert result["severity"] == "medium"


def test_same_port_not_counted_twice():
    # ek-i port 20 bar probe korle scan na
    events = [{"event_type": "port_probe", "details": "22"} for _ in range(20)]
    assert detect_port_scan(events) is None


def test_traffic_spike_below_limit():
    # baseline 10, factor 3, tai 29 request e alert hobe na
    assert detect_traffic_spike(make_requests(29)) is None


def test_traffic_spike_at_limit():
    result = detect_traffic_spike(make_requests(30))
    assert result["rule_name"] == "Traffic Spike"
    assert result["severity"] == "medium"


def test_traffic_spike_above_limit():
    result = detect_traffic_spike(make_requests(40))
    assert "4.0x" in result["reason"]


def test_run_detection_normal_events():
    events = [{"event_type": "login_success", "details": "ssh"}] * 3
    assert run_detection(events) == []