# Threat detection rules (rule-based, ML na)


def detect_failed_logins(events, threshold=5):
    # failed_login event gulo gune dekhe
    count = sum(1 for e in events if e["event_type"] == "failed_login")
    if count >= threshold:
        return {
            "rule_name": "Repeated Failed Logins",
            "severity": "high",
            "reason": f"{count} failed logins (threshold {threshold})",
        }
    return None


def detect_port_scan(events, threshold=10):
    # alada alada port koyta probe hoyeche
    ports = {e["details"] for e in events if e["event_type"] == "port_probe"}
    if len(ports) >= threshold:
        return {
            "rule_name": "Port Scan",
            "severity": "medium",
            "reason": f"{len(ports)} different ports probed (threshold {threshold})",
        }
    return None


def detect_traffic_spike(events, baseline=10, factor=3):
    # http_request er sonkhya baseline er factor gun hole spike
    count = sum(1 for e in events if e["event_type"] == "http_request")
    limit = baseline * factor
    if count >= limit:
        return {
            "rule_name": "Traffic Spike",
            "severity": "medium",
            "reason": f"{count} requests, {count / baseline:.1f}x baseline ({baseline})",
        }
    return None


def run_detection(events):
    # shob rule chalay, jegulo match kore segulo alert hishebe return kore
    rules = [detect_failed_logins, detect_port_scan, detect_traffic_spike]
    alerts = []
    for rule in rules:
        result = rule(events)
        if result:
            alerts.append(result)
    return alerts