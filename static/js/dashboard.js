import { runScenario, getEvents, getAlerts, getStats } from "./api.js";
import { triggerAttack } from "./network3d.js";

const alertList = document.getElementById("alert-list");
const eventList = document.getElementById("event-list");

// Severity chart (Chart.js)
Chart.defaults.color = "#d7e3ff";
const chart = new Chart(document.getElementById("severity-chart"), {
  type: "bar",
  data: {
    labels: ["High", "Medium"],
    datasets: [{
      data: [0, 0],
      backgroundColor: ["#ff5252", "#ffc107"],
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  },
});

// Counter + chart update kore
async function refreshStats() {
  const s = await getStats();
  document.getElementById("stat-events").textContent = s.events;
  document.getElementById("stat-alerts").textContent = s.alerts;
  document.getElementById("stat-high").textContent = s.high_alerts;

  chart.data.datasets[0].data = [s.high_alerts, s.medium_alerts];
  chart.update();
}

// Alert list update kore
async function refreshAlerts() {
  const alerts = await getAlerts();
  alertList.innerHTML = "";

  if (alerts.length === 0) {
    alertList.innerHTML = "<li class='empty'>No alerts yet</li>";
    return;
  }

  for (const a of alerts) {
    const li = document.createElement("li");
    li.className = `alert ${a.severity}`;

    const title = document.createElement("strong");
    title.textContent = `${a.rule_name} (${a.severity})`;

    const reason = document.createElement("p");
    reason.textContent = a.reason;

    li.append(title, reason);
    alertList.appendChild(li);
  }
}

// Event list update kore
async function refreshEvents() {
  const events = await getEvents();
  eventList.innerHTML = "";

  if (events.length === 0) {
    eventList.innerHTML = "<li class='empty'>No events yet</li>";
    return;
  }

  for (const e of events) {
    const li = document.createElement("li");
    li.className = "event";

    const title = document.createElement("strong");
    title.textContent = e.event_type;

    const info = document.createElement("p");
    info.textContent = `${e.src_ip} -> ${e.dst_ip} | ${e.details} | ${e.source}`;

    li.append(title, info);
    eventList.appendChild(li);
  }
}

async function refresh() {
  await refreshStats();
  await refreshAlerts();
  await refreshEvents();
}

// Button click hole: 3D animation + backend scenario
document.querySelectorAll("button[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    triggerAttack(btn.dataset.scenario);
    await runScenario(btn.dataset.scenario);
    refresh();
  });
});

refresh();