import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const container = document.getElementById("network-view");

// Neon glow (bloom). Phone/laptop slow hole false kore dao
const USE_BLOOM = true;

// ---------- Scene, camera, renderer ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 60, 400);

const camera = new THREE.PerspectiveCamera(
  60, container.clientWidth / container.clientHeight, 0.05, 2000
);
camera.position.set(0, 4, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Metal er reflection er jonno soft environment light
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// Bloom (neon glow)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.8,  // strength
    0.55, // radius
    0.9   // threshold (shudhu khub ujjol jinis glow korbe)
  )
);
composer.addPass(new OutputPass());

// ---------- Mouse control (zoom nicher custom code e) ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.8;
controls.enablePan = true;
controls.enableZoom = false;
controls.update();

const offset = new THREE.Vector3();
const viewDir = new THREE.Vector3();

renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = Math.max(-60, Math.min(60, e.deltaY));
    const amount = delta * 0.0015;
    const factor = Math.exp(amount);

    offset.copy(camera.position).sub(controls.target);
    offset.multiplyScalar(factor);
    camera.position.copy(controls.target).add(offset);

    if (amount < 0 && offset.length() < 1.5) {
      camera.getWorldDirection(viewDir);
      const step = Math.abs(amount) * 5;
      camera.position.addScaledVector(viewDir, step);
      controls.target.addScaledVector(viewDir, step);
    }
  },
  { passive: false }
);

// Double click = ager position e fire asha
renderer.domElement.addEventListener("dblclick", () => {
  camera.position.set(0, 4, 11);
  controls.target.set(0, -0.5, 0);
  controls.update();
});

// ---------- Lighting ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(5, 8, 6);
scene.add(sun);

// Background grid floor
const grid = new THREE.GridHelper(40, 40, 0x2a5bd7, 0x16264d);
grid.position.y = -5;
scene.add(grid);

// ---------- Helper: material, shape ----------
// Neon color (1 er beshi hole bloom e glow kore)
const neon = (hex, k = 2.2) => new THREE.Color(hex).multiplyScalar(k);

function std(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: o.metal ?? 0.5,
    roughness: o.rough ?? 0.45,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.glow ?? 0,
    envMapIntensity: o.env ?? 0.6,
    fog: false,
  });
}

// Neon LED / strip material
function ledMat(hex, glow = 2.4) {
  return std(0x050505, { emissive: hex, glow, metal: 0, rough: 0.6, env: 0 });
}
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const rbox = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m);
const cyl = (rt, rb, h, m, seg = 40) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
const ball = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), m);
const torus = (R, t, m) => new THREE.Mesh(new THREE.TorusGeometry(R, t, 12, 72), m);

function put(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

const spinners = []; // ghurte thaka jinis
const blinkers = []; // jholmol korte thaka LED

// ---------- Texture: PC screen (dashboard) ----------
function makeScreenTexture(seed) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");
  const rnd = (n) => {
    const x = Math.sin(n * 12.9898 + seed) * 43758.5453;
    return x - Math.floor(x);
  };

  const bg = g.createLinearGradient(0, 0, 0, 200);
  bg.addColorStop(0, "#06183a");
  bg.addColorStop(1, "#0a3a6e");
  g.fillStyle = bg;
  g.fillRect(0, 0, 320, 200);

  g.fillStyle = "#0b2a55"; // header
  g.fillRect(0, 0, 320, 26);
  g.fillStyle = "#7fd8ff";
  g.fillRect(12, 9, 70, 8);
  g.fillStyle = "#ff3b4f";
  g.beginPath();
  g.arc(302, 13, 6, 0, 6.28);
  g.fill();

  for (let i = 0; i < 8; i++) { // bar chart
    const h = 30 + rnd(i) * 95;
    g.fillStyle = i % 3 === 0 ? "#18e6ff" : "#2a9dff";
    g.fillRect(16 + i * 17, 180 - h, 11, h);
  }

  g.strokeStyle = "#3dff9a"; // line chart
  g.lineWidth = 3;
  g.beginPath();
  for (let x = 0; x <= 150; x += 4) {
    const y = 105 + Math.sin((x + seed * 20) / 16) * 26 + Math.sin(x / 5) * 6;
    if (x === 0) g.moveTo(166 + x, y);
    else g.lineTo(166 + x, y);
  }
  g.stroke();

  g.fillStyle = "#5aa8e8"; // text lines
  for (let i = 0; i < 3; i++) g.fillRect(166, 150 + i * 14, 60 + rnd(i + 20) * 70, 5);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Texture: backlit keyboard ----------
function makeKeyTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, 256, 96);
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, "#00e5ff");
  grad.addColorStop(0.5, "#7a5cff");
  grad.addColorStop(1, "#ff4fd8");
  g.fillStyle = grad;
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 14; k++) g.fillRect(8 + k * 17.2, 8 + r * 17, 13, 12);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Node designs ----------
// Internet: neon globe + orbit ring + satellite
function buildGlobe() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 48, 32),
    std(0x07163a, { metal: 0.4, rough: 0.15, emissive: 0x0b3a9a, glow: 0.55, env: 0.9 })
  ));

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(0.83, 20, 12),
    new THREE.MeshBasicMaterial({
      color: neon(0x20d8ff, 1.8), wireframe: true, transparent: true, opacity: 0.6, fog: false,
    })
  );
  g.add(wire);
  spinners.push({ o: wire, ry: 0.004 });

  const tilt = new THREE.Group();
  tilt.rotation.x = 1.0;
  tilt.rotation.y = 0.3;
  tilt.add(torus(1.25, 0.022, ledMat(0x20d8ff, 2.4)));
  const orbit = new THREE.Group();
  orbit.add(put(ball(0.075, ledMat(0x9fffe0, 3)), 1.25, 0, 0));
  tilt.add(orbit);
  spinners.push({ o: orbit, rz: 0.02 });
  g.add(tilt);
  return g;
}

// Router: gunmetal body, neon strip, blinking LED, antenna
function buildRouter() {
  const g = new THREE.Group();
  const leds = [];
  g.add(rbox(1.7, 0.24, 1.0, 0.06, std(0x1a2236, { metal: 0.7, rough: 0.35 })));
  g.add(put(box(1.5, 0.022, 0.02, ledMat(0xffb020, 2.2)), 0, -0.06, 0.505));

  for (let i = 0; i < 4; i++) {
    const m = ledMat(0x3dffa0, 2.6);
    leds.push(m);
    g.add(put(ball(0.04, m), -0.6 + i * 0.25, 0.045, 0.505));
  }
  for (const s of [-1, 1]) {
    const a = put(cyl(0.028, 0.028, 0.85, std(0x0d1220, { metal: 0.8, rough: 0.3 }), 16), s * 0.62, 0.55, -0.3);
    a.rotation.z = -s * 0.18;
    g.add(a);
    g.add(put(ball(0.06, ledMat(0xffb020, 2.4)), s * 0.696, 0.968, -0.3));
    g.add(put(ball(0.07, std(0x0d1220, { metal: 0.8 })), s * 0.62, 0.13, -0.3));
  }
  g.userData.leds = leds;
  return g;
}

// Server: dark rack, drive bay, LED, neon edge
function buildServer() {
  const g = new THREE.Group();
  const leds = [];
  g.add(rbox(1.1, 1.7, 0.9, 0.05, std(0x151b2b, { metal: 0.85, rough: 0.4 })));

  for (let i = 0; i < 4; i++) {
    const y = 0.55 - i * 0.3;
    g.add(put(box(0.9, 0.2, 0.02, std(0x070a12, { metal: 0.6, rough: 0.5 })), 0, y, 0.455));
    g.add(put(box(0.5, 0.028, 0.02, ledMat(0x00e5ff, 1.6)), -0.12, y, 0.47));
    const m = ledMat(i % 2 ? 0x4aa8ff : 0x3dffa0, 2.8);
    leds.push(m);
    g.add(put(ball(0.035, m), 0.34, y, 0.47));
  }
  for (const s of [-1, 1]) g.add(put(box(0.02, 1.6, 0.02, ledMat(0x00e5ff, 2.2)), s * 0.545, 0, 0.45));
  g.add(put(box(0.8, 0.02, 0.02, ledMat(0x00e5ff, 2.0)), 0, 0.82, 0.45));
  g.userData.leds = leds;
  return g;
}

// Database: 3 ta metal disk + glowing ring
function buildDatabase() {
  const g = new THREE.Group();
  const leds = [];
  const diskMat = std(0x2a3350, { metal: 0.9, rough: 0.3, env: 0.9 });
  for (let i = 0; i < 3; i++) {
    const y = -0.45 + i * 0.45;
    g.add(put(cyl(0.62, 0.62, 0.34, diskMat, 56), 0, y, 0));
    const m = ledMat(0x3dffa0, 2.8);
    leds.push(m);
    g.add(put(ball(0.035, m), 0.28, y, 0.6));
  }
  for (const y of [-0.225, 0.225]) {
    const r = put(torus(0.625, 0.03, ledMat(0x9b6bff, 2.8)), 0, y, 0);
    r.rotation.x = Math.PI / 2;
    g.add(r);
  }
  const top = put(torus(0.55, 0.018, ledMat(0x00e5ff, 2.4)), 0, 0.63, 0);
  top.rotation.x = Math.PI / 2;
  g.add(top);
  g.userData.leds = leds;
  return g;
}

// PC: monitor + dashboard screen + neon + backlit keyboard
function buildPC(seed, accent) {
  const g = new THREE.Group();
  const leds = [];
  const dark = std(0x12182a, { metal: 0.8, rough: 0.35, env: 0.8 });
  const silver = std(0x8a93a8, { metal: 0.9, rough: 0.3, env: 1.0 });

  g.add(put(rbox(1.28, 0.84, 0.08, 0.03, dark), 0, 0.35, 0));

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.14, 0.7),
    new THREE.MeshBasicMaterial({
      map: makeScreenTexture(seed), color: new THREE.Color(1.3, 1.3, 1.3), toneMapped: false, fog: false,
    })
  );
  screen.position.set(0, 0.35, 0.042);
  g.add(screen);

  // monitor er chare neon strip
  g.add(put(box(1.2, 0.018, 0.02, ledMat(accent, 2.6)), 0, -0.07, 0.045));
  g.add(put(box(1.2, 0.018, 0.02, ledMat(accent, 2.6)), 0, 0.77, 0.045));
  for (const s of [-1, 1]) g.add(put(box(0.018, 0.8, 0.02, ledMat(accent, 2.6)), s * 0.6, 0.35, 0.045));

  const m = ledMat(0x3dffa0, 3);
  leds.push(m);
  g.add(put(ball(0.025, m), 0.5, -0.04, 0.05));

  g.add(put(box(0.12, 0.4, 0.06, silver), 0, -0.15, -0.05));
  g.add(put(cyl(0.3, 0.34, 0.05, silver, 48), 0, -0.4, -0.02));
  const ring = put(torus(0.33, 0.012, ledMat(accent, 2.6)), 0, -0.375, -0.02);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  const kb = box(0.92, 0.035, 0.32, new THREE.MeshStandardMaterial({
    color: 0x0a0f1c, metalness: 0.6, roughness: 0.5,
    emissive: 0xffffff, emissiveMap: makeKeyTexture(), emissiveIntensity: 1.1, fog: false,
  }));
  kb.position.set(0, -0.41, 0.6);
  kb.rotation.x = -0.06;
  g.add(kb);

  const mouse = ball(0.075, std(0x0a0f1c, { metal: 0.7, rough: 0.3 }));
  mouse.scale.set(1, 0.5, 1.6);
  mouse.position.set(0.66, -0.41, 0.6);
  g.add(mouse);
  g.add(put(box(0.012, 0.012, 0.1, ledMat(accent, 3)), 0.66, -0.38, 0.6));

  g.userData.leds = leds;
  return g;
}

// Pad: node er niche glass plate + glowing ring
function addPad(g, y, accent) {
  g.add(put(cyl(0.95, 0.95, 0.05, std(0x070d1f, { metal: 0.6, rough: 0.3, env: 0.4 }), 56), 0, y, 0));
  const ring = put(torus(0.93, 0.022, ledMat(accent, 2.6)), 0, y + 0.026, 0);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
}
// ---------- Label: naam er pill ----------
function makeLabel(text) {
  const W = 384, H = 96;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 44px Arial";
  const w = ctx.measureText(text).width + 56;
  const x = (W - w) / 2, y = 12, h = 72, r = 36;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = "rgba(10,20,48,0.88)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#4a82e6";
  ctx.stroke();

  ctx.fillStyle = "#cfe0ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, fog: false, depthTest: false, transparent: true })
  );
  sprite.scale.set(3.2, 0.8, 1);
  sprite.renderOrder = 10;
  sprite.raycast = () => {}; // naam e click korle kichu hobe na
  sprite.userData.halfW = (w / W) * 3.2 / 2; // pill er ordhek chowra
  return sprite;
}

// ---------- Network nodes ----------
// label: naam kon dike boshbe (top / bottom / right)
const nodeData = {
  Internet: { pos: [0, 3, 0],   color: 0xff5252, type: "External network", ip: "External",  build: buildGlobe,              pad: null,     rotY: 0,    label: "top" },
  Router:   { pos: [0, 1, 0],   color: 0xffc107, type: "Router",           ip: "10.0.0.1",  build: buildRouter,             pad: 0xffb020, rotY: 0,    label: "right" },
  Server:   { pos: [-4, -1, 0], color: 0x00e5ff, type: "Web server",       ip: "10.0.0.5",  build: buildServer,             pad: 0x00e5ff, rotY: 0.4,  label: "top" },
  Database: { pos: [-4, -4, 0], color: 0x7c4dff, type: "Database",         ip: "10.0.0.6",  build: buildDatabase,           pad: 0x9b6bff, rotY: 0.4,  label: "bottom" },
  PC1:      { pos: [3, -1, 2],  color: 0x69f0ae, type: "Workstation",      ip: "10.0.0.10", build: () => buildPC(1, 0x3dffa0), pad: 0x3dffa0, rotY: -0.4, label: "top" },
  PC2:      { pos: [4, -1, -2], color: 0x69f0ae, type: "Workstation",      ip: "10.0.0.11", build: () => buildPC(2, 0x3dffa0), pad: 0x3dffa0, rotY: -0.4, label: "top" },
};

const nodes = {};
const nodeStatus = {}; // "Normal" ba "Under attack"
const nodeMats = {};   // red flash er jonno proti node er sob material
const flashTimers = {};

for (const name in nodeData) {
  const d = nodeData[name];
  const group = d.build();

  // size mepe pad ar label er jayga thik kori
  const bb = new THREE.Box3().setFromObject(group);
  if (d.pad) addPad(group, bb.min.y - 0.06, d.pad);

  const label = makeLabel(name);
  if (d.label === "top") label.position.set(0, bb.max.y + 0.5, 0);
  else if (d.label === "bottom") label.position.set(0, bb.min.y - 0.65, 0);
  else label.position.set(bb.max.x + label.userData.halfW + 0.3, 0, 0);
  group.add(label);

  group.position.set(...d.pos);
  group.rotation.y = d.rotY;
  group.userData.name = name; // click e kon node bujhte
  scene.add(group);

  nodes[name] = group;
  nodeStatus[name] = "Normal";

  // ager color mone rakhi (flash shesh e fire dewar jonno)
  nodeMats[name] = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    nodeMats[name].push({
      m,
      hasEmissive: "emissive" in m,
      emissive: m.emissive ? m.emissive.clone() : null,
      intensity: m.emissiveIntensity,
      color: m.color ? m.color.clone() : null,
    });
  });

  for (const m of group.userData.leds || []) {
    blinkers.push({
      m, name, base: m.emissiveIntensity,
      phase: Math.random() * 6.28, speed: 2 + Math.random() * 3,
    });
  }
}

// ---------- Connections (link) ----------
const links = [
  ["Internet", "Router"],
  ["Router", "Server"],
  ["Server", "Database"],
  ["Router", "PC1"],
  ["Router", "PC2"],
];
for (const [a, b] of links) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    nodes[a].position, nodes[b].position,
  ]);
  scene.add(
    new THREE.Line(geo, new THREE.LineBasicMaterial({ color: neon(0x4a78ff, 1.6), fog: false }))
  );
}

// ---------- Node click: details bar ----------
const infoBox = document.getElementById("node-info");
const hint = document.getElementById("node-hint");
let selected = null;

function showInfo(name) {
  const d = nodeData[name];
  document.getElementById("node-name").textContent = name;
  document.getElementById("node-type").textContent = d.type;
  document.getElementById("node-ip").textContent = d.ip;

  const status = document.getElementById("node-status");
  status.textContent = nodeStatus[name];
  status.className = nodeStatus[name] === "Normal" ? "ok" : "bad";

  infoBox.classList.remove("hidden");
  hint.classList.add("hidden");
}

function selectNode(name) {
  if (selected) selected.scale.set(1, 1, 1);
  selected = name ? nodes[name] : null;
  if (selected) {
    selected.scale.set(1.25, 1.25, 1.25);
    showInfo(name);
  } else {
    infoBox.classList.add("hidden");
    hint.classList.remove("hidden");
  }
}

// Drag (ghorano) ar click alada kora
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let downX = 0;
let downY = 0;

renderer.domElement.addEventListener("pointerdown", (e) => {
  downX = e.clientX;
  downY = e.clientY;
});

renderer.domElement.addEventListener("pointerup", (e) => {
  if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(Object.values(nodes), true);

  let name = null;
  if (hits.length > 0) {
    let o = hits[0].object;
    while (o && !o.userData.name) o = o.parent;
    if (o) name = o.userData.name;
  }
  selectNode(name);
});

// ---------- Normal packets (sobuj) ----------
const packets = [];
for (let i = 0; i < 12; i++) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    new THREE.MeshBasicMaterial({ color: neon(0x00ff9c, 2.2), fog: false })
  );
  scene.add(mesh);
  packets.push({
    mesh,
    link: Math.floor(Math.random() * links.length),
    t: Math.random(),
    speed: 0.004 + Math.random() * 0.006,
  });
}

// ---------- Attack ----------
const attackPaths = {
  brute_force: ["Internet", "Router", "Server"],
  port_scan: ["Internet", "Router", "PC1"],
  traffic_spike: ["Internet", "Router", "Server"],
};

// Packet er sonkhya (kom, jate line block na hoy)
const packetCounts = {
  brute_force: 6,
  port_scan: 6,
  traffic_spike: 12,
};

const attackPackets = [];

// Target node er sob part kichukkhon er jonno red kore
function flashNode(name) {
  for (const p of nodeMats[name]) {
    if (p.hasEmissive) {
      p.m.emissive.setHex(0xff0000);
      p.m.emissiveIntensity = 1.6;
    } else if (p.color) {
      p.m.color.setRGB(2.2, 0.1, 0.15); // screen / wireframe red tint
    }
  }

  nodeStatus[name] = "Under attack";
  if (selected === nodes[name]) showInfo(name);

  clearTimeout(flashTimers[name]);
  flashTimers[name] = setTimeout(() => {
    for (const p of nodeMats[name]) {
      if (p.hasEmissive) {
        p.m.emissive.copy(p.emissive);
        p.m.emissiveIntensity = p.intensity;
      } else if (p.color) {
        p.m.color.copy(p.color);
      }
    }
    nodeStatus[name] = "Normal";
    if (selected === nodes[name]) showInfo(name);
  }, 3000);
}

// Dashboard theke call hoy: red packet pathay
export function triggerAttack(scenario) {
  const path = attackPaths[scenario];
  if (!path) return;
  if (attackPackets.length > 40) return; // onek beshi jome gele aro add korbo na

  const count = packetCounts[scenario] || 6;

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: neon(0xff2030, 3), fog: false })
    );
    mesh.visible = false;
    scene.add(mesh);
    // delay beshi = packet er majhe gap beshi
    attackPackets.push({ mesh, path, seg: 0, t: 0, delay: i * 22 });
  }

  flashNode(path[path.length - 1]);
}

// ---------- Animation loop ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  for (const p of packets) {
    p.t += p.speed;
    if (p.t > 1) {
      p.t = 0;
      p.link = Math.floor(Math.random() * links.length);
    }
    const [a, b] = links[p.link];
    p.mesh.position.lerpVectors(nodes[a].position, nodes[b].position, p.t);
  }

  for (let i = attackPackets.length - 1; i >= 0; i--) {
    const p = attackPackets[i];

    if (p.delay > 0) {
      p.delay--;
      continue;
    }

    p.mesh.visible = true;
    p.t += 0.02;

    if (p.t >= 1) {
      p.t = 0;
      p.seg++;
    }

    if (p.seg >= p.path.length - 1) {
      scene.remove(p.mesh);
      attackPackets.splice(i, 1);
      continue;
    }

    const from = nodes[p.path[p.seg]].position;
    const to = nodes[p.path[p.seg + 1]].position;
    p.mesh.position.lerpVectors(from, to, p.t);
  }

  // globe ar satellite ghorano
  for (const s of spinners) {
    if (s.ry) s.o.rotation.y += s.ry;
    if (s.rz) s.o.rotation.z += s.rz;
  }

  // LED jholmol (attack er somoy bondho thake)
  for (const l of blinkers) {
    if (nodeStatus[l.name] === "Normal") {
      l.m.emissiveIntensity = l.base * (0.5 + 0.5 * Math.sin(time * l.speed + l.phase));
    }
  }

  controls.update();
  if (USE_BLOOM) composer.render();
  else renderer.render(scene, camera);
}
animate();

// Window size change hole adjust
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  composer.setSize(container.clientWidth, container.clientHeight);
});