// Flask API call korar function gulo

export async function runScenario(name) {
  const res = await fetch(`/api/simulate/${name}`, { method: "POST" });
  return res.json();
}

export async function getEvents() {
  const res = await fetch("/api/events");
  return res.json();
}

export async function getAlerts() {
  const res = await fetch("/api/alerts");
  return res.json();
}

export async function getStats() {
  const res = await fetch("/api/stats");
  return res.json();
}