# 🛡️ Cyber_Scope-3D

An interactive full-stack cybersecurity threat monitoring and attack simulation dashboard powered by a Three.js 3D network topology, Flask REST APIs, and rule-based anomaly detection engines.

---

## 🌟 Key Features

- **Interactive 3D Network Topology (Three.js):** 
  - Real-time visualization of interconnected nodes (Internet, Router, Web Server, Database, Workstations).
  - Custom camera navigation (orbit rotation, smooth logarithmic cursor zoom, pan, and double-click reset).
  - Node inspection raycasting — click any node to view its IP, device role, and live threat status.
- **Dynamic Threat Simulation:**
  - Animated packet streams routing along active network paths.
  - Attack scenario simulations: **Brute Force**, **Port Scan**, and **Traffic Spike**.
  - Node alert animation with visual glow and threat indicators.
- **Rule-Based Threat Detection:**
  - Automated threshold verification (failed login floods, distinct port scans, HTTP request traffic spikes).
  - Threat severity classification (`High` / `Medium`).
- **Live Metrics & Export:**
  - Chart.js severity metrics overview.
  - Real-time event and alert tracking tables.
  - CSV report generation for live audit trails (`/api/export/events`, `/api/export/alerts`).

---

## 🛠️ Tech Stack

- **Frontend:** Three.js (0.160.0), Chart.js (4.4.1), Vanilla JavaScript (ES Modules), Modern CSS Dark Theme
- **Backend:** Python, Flask, SQLite (`cyberscope.db`)
- **Testing:** Pytest (API endpoints & detector rule suite)

---

## 🚀 Getting Started

### 1. Clone the repository
git clone https://github.com/RazinHossainSagor/cyber_scope-3d.git
cd cyber_scope-3d

### 2. Create and activate a virtual environment
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

### 3. Install dependencies
pip install -r requirements.txt

### 4. Run the application
python app.py

Open your browser and navigate to: `http://127.0.0.1:5000`

---

## 🧪 Running Tests

Execute unit and integration tests using `pytest`:

pytest

---

## 📂 Project Structure

cyber_scope-3d/
├── backend/
│   ├── database.py       # SQLite connection and queries
│   └── detector.py       # Rule-based threat detection logic
├── static/
│   ├── css/style.css     # Dark dashboard styling
│   └── js/
│       ├── api.js        # Backend API communication
│       ├── dashboard.js  # State management and Chart.js integration
│       └── network3d.js  # Three.js 3D network visualization
├── templates/
│   └── index.html        # Main dashboard UI layout
├── tests/
│   ├── test_app.py       # Flask API integration tests
│   └── test_detector.py  # Anomaly detection unit tests
├── app.py                # Flask application entry point
├── pytest.ini            # Pytest configuration
└── requirements.txt      # Python dependencies
