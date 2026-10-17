import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container = document.getElementById("network-view");

// Node er normal glow (kom rakhle color fade hoy na)
const GLOW = 0.15;

// Scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 60, 400); // onek dure grid mishbe

const camera = new THREE.PerspectiveCamera(
  60, container.clientWidth / container.clientHeight, 0.05, 2000
);
camera.position.set(0, 4, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Mouse control: ghorano ar sorano (zoom ta nicher custom code e)
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.8;
controls.enablePan = true;   // right click / Shift + drag
controls.enableZoom = false; // zoom amra nije korbo
controls.update();

// ---------- Custom zoom: limit chara, soman step ----------
const offset = new THREE.Vector3();
const viewDir = new THREE.Vector3();

renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // ek scroll e max 60 dhora hoy, tai step kokhono beshi boro hobe na
    const delta = Math.max(-60, Math.min(60, e.deltaY));
    const amount = delta * 0.0015;
    const factor = Math.exp(amount);

    offset.copy(camera.position).sub(controls.target);
    offset.multiplyScalar(factor);
    camera.position.copy(controls.target).add(offset);

    // onek kache gele target o samne soriye dei, jate thamte na hoy
    if (amount < 0 && offset.length() < 1.5) {
      camera.getWorldDirection(viewDir);
      const step = Math.abs(amount) * 5;
      camera.position.addScaledVector(viewDir, step);
      controls.target.addScaledVector(viewDir, step);
    }
  },
  { passive: false }
);

// Double click korle camera ager position e fire ashbe
renderer.domElement.addEventListener("dblclick", () => {
  camera.position.set(0, 4, 11);
  controls.target.set(0, -0.5, 0);
  controls.update();
});

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(5, 8, 6);
scene.add(sun);

// Background grid floor
const grid = new THREE.GridHelper(40, 40, 0x2a5bd7, 0x16264d);
grid.position.y = -5;
scene.add(grid);

// Node er upore naam lekhar jonno label
function makeLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d7e3ff";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 40);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      fog: false, // label kokhono fog e mishbe na
    })
  );
  sprite.scale.set(3, 0.75, 1);
  return sprite;
}

// ---------- 3D shape banano er helper ----------
function makeMat(color, glow = GLOW, emissive = color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: glow,
    roughness: 0.5,
    fog: false, // node kokhono fog e mishbe na
  });
}

function box(w, h, d, color, glow, emissive) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMat(color, glow, emissive));
}

function cyl(rTop, rBottom, h, color, glow, emissive) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, 32),
    makeMat(color, glow, emissive)
  );
}

function ball(r, color, glow, emissive) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), makeMat(color, glow, emissive));
}

// mesh ke x, y, z position e boshay
function put(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

// ---------- Internet: cloud ----------
function buildCloud(color) {
  const g = new THREE.Group();
  const puffs = [
    [0, 0, 0, 0.55],
    [-0.6, -0.12, 0, 0.42],
    [0.6, -0.12, 0, 0.44],
    [-0.3, 0.33, 0.05, 0.42],
    [0.3, 0.36, 0, 0.4],
    [0, -0.1, 0.3, 0.45],
  ];
  for (const [x, y, z, r] of puffs) g.add(put(ball(r, color), x, y, z));
  return g;
}

// ---------- Router: chapta box + antenna + LED ----------
function buildRouter(color) {
  const g = new THREE.Group();
  g.add(put(box(1.5, 0.28, 0.9, color), 0, -0.1, 0));

  // samner LED light
  for (const x of [-0.45, -0.15, 0.15, 0.45]) {
    g.add(put(ball(0.045, 0x00ff9c, 1), x, -0.1, 0.46));
  }

  // 2 ta antenna
  for (const side of [-1, 1]) {
    const antenna = put(cyl(0.03, 0.03, 0.7, 0xffe082), side * 0.6, 0.39, -0.25);
    antenna.rotation.z = -side * 0.2;
    g.add(antenna);
    g.add(put(ball(0.06, 0xffe082), side * 0.6, 0.04, -0.25));
  }
  return g;
}

// ---------- Server: rack + slot + LED ----------
function buildServer(color) {
  const g = new THREE.Group();
  g.add(put(box(1.0, 1.5, 0.8, color), 0, 0, 0));

  for (const y of [0.45, 0.05, -0.35]) {
    g.add(put(box(0.8, 0.28, 0.04, 0x0a2433, 0.05), 0, y, 0.41)); // slot
    g.add(put(ball(0.04, 0x00ff9c, 1), 0.3, y, 0.44));            // LED
  }
  return g;
}

// ---------- Database: 3 ta disk stack ----------
function buildDatabase(color) {
  const g = new THREE.Group();
  for (const y of [-0.5, 0, 0.5]) {
    g.add(put(cyl(0.6, 0.6, 0.38, color), 0, y, 0));            // disk
    g.add(put(cyl(0.62, 0.62, 0.04, 0xb388ff), 0, y + 0.13, 0)); // upor er band
    g.add(put(ball(0.04, 0x00ff9c, 1), 0.3, y - 0.08, 0.55));     // LED
  }
  return g;
}

// ---------- PC: monitor + stand + base + keyboard ----------
function buildPC(color) {
  const g = new THREE.Group();
  g.add(put(box(1.2, 0.8, 0.1, color), 0, 0.25, 0));                        // monitor frame
  g.add(put(box(1.04, 0.64, 0.02, 0x0a1a2f, 0.7, 0x2aa7ff), 0, 0.25, 0.055)); // screen (glow)
  g.add(put(cyl(0.07, 0.07, 0.35, color), 0, -0.325, 0));                   // stand
  g.add(put(cyl(0.4, 0.4, 0.06, color), 0, -0.53, 0));                      // base
  g.add(put(box(0.9, 0.05, 0.3, 0x3fbf88), 0, -0.5, 0.7));                  // keyboard
  return g;
}

// Network nodes (build = kon design, rotY = ghurano, labelY = naam er uchchota)
const nodeData = {
  Internet: { pos: [0, 3, 0],   color: 0xff5252, type: "External network", ip: "External",  build: buildCloud,    rotY: 0,    labelY: 1.1 },
  Router:   { pos: [0, 1, 0],   color: 0xffc107, type: "Router",           ip: "10.0.0.1",  build: buildRouter,   rotY: 0,    labelY: 1.0 },
  Server:   { pos: [-4, -1, 0], color: 0x00e5ff, type: "Web server",       ip: "10.0.0.5",  build: buildServer,   rotY: 0.4,  labelY: 1.2 },
  Database: { pos: [-4, -4, 0], color: 0x7c4dff, type: "Database",         ip: "10.0.0.6",  build: buildDatabase, rotY: 0.4,  labelY: 1.2 },
  PC1:      { pos: [3, -1, 2],  color: 0x69f0ae, type: "Workstation",      ip: "10.0.0.10", build: buildPC,       rotY: -0.4, labelY: 1.1 },
  PC2:      { pos: [4, -1, -2], color: 0x69f0ae, type: "Workstation",      ip: "10.0.0.11", build: buildPC,       rotY: -0.4, labelY: 1.1 },
};

const nodes = {};
const nodeStatus = {};  // "Normal" ba "Under attack"
const nodeMats = {};    // proti node er sob material (red flash er jonno)
const flashTimers = {};

for (const name in nodeData) {
  const d = nodeData[name];

  const group = d.build(d.color);
  group.position.set(...d.pos);
  group.rotation.y = d.rotY;
  group.userData.name = name; // click e kon node bujhte

  const label = makeLabel(name);
  label.position.set(0, d.labelY, 0);
  label.raycast = () => {}; // naam e click korle jeno kichu na hoy
  group.add(label);

  scene.add(group);
  nodes[name] = group;
  nodeStatus[name] = "Normal";

  // ager color mone rakhi, flash shesh hole fire dewar jonno
  nodeMats[name] = [];
  group.traverse((o) => {
    if (o.isMesh) {
      nodeMats[name].push({
        m: o.material,
        color: o.material.emissive.getHex(),
        glow: o.material.emissiveIntensity,
      });
    }
  });
}

// Connections (link)
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
    new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x3a4a80, fog: false }))
  );
}

// ---------- Node click: details box ----------
const infoBox = document.getElementById("node-info");
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
}

function selectNode(name) {
  if (selected) selected.scale.set(1, 1, 1); // ager node ager size e
  selected = name ? nodes[name] : null;
  if (selected) {
    selected.scale.set(1.3, 1.3, 1.3); // selected node ektu boro
    showInfo(name);
  } else {
    infoBox.classList.add("hidden");
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
  // beshi nore gele eta drag, click na
  if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(Object.values(nodes), true);

  // je part e click korse, tar parent group theke node er naam ber kori
  let name = null;
  if (hits.length > 0) {
    let o = hits[0].object;
    while (o && !o.userData.name) o = o.parent;
    if (o) name = o.userData.name;
  }
  selectNode(name);
});

// ---------- Packets ----------
const packets = [];
for (let i = 0; i < 12; i++) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff9c, fog: false })
  );
  scene.add(mesh);
  packets.push({
    mesh,
    link: Math.floor(Math.random() * links.length),
    t: Math.random(),
    speed: 0.004 + Math.random() * 0.006,
  });
}

// Attack path: kon scenario te packet kon node diye jabe
const attackPaths = {
  brute_force: ["Internet", "Router", "Server"],
  port_scan: ["Internet", "Router", "PC1"],
  traffic_spike: ["Internet", "Router", "Server"],
};

// Traffic spike e packet onek beshi pathano hoy
const packetCounts = {
  brute_force: 10,
  port_scan: 10,
  traffic_spike: 30,
};

const attackPackets = [];

// Target node er sob part kichukkhon er jonno red kore
function flashNode(name) {
  for (const p of nodeMats[name]) {
    p.m.emissive.setHex(0xff0000);
    p.m.emissiveIntensity = 1.0;
  }

  nodeStatus[name] = "Under attack";
  if (selected === nodes[name]) showInfo(name); // box khola thakle update

  clearTimeout(flashTimers[name]);
  flashTimers[name] = setTimeout(() => {
    for (const p of nodeMats[name]) {
      p.m.emissive.setHex(p.color);
      p.m.emissiveIntensity = p.glow;
    }
    nodeStatus[name] = "Normal";
    if (selected === nodes[name]) showInfo(name);
  }, 3000);
}

// Dashboard theke call hoy: red packet pathay
export function triggerAttack(scenario) {
  const path = attackPaths[scenario];
  if (!path) return; // normal e kono attack animation nei

  const count = packetCounts[scenario] || 10;

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff1744, fog: false })
    );
    mesh.visible = false;
    scene.add(mesh);
    attackPackets.push({ mesh, path, seg: 0, t: 0, delay: i * 12 });
  }

  flashNode(path[path.length - 1]);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

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

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Window size change hole adjust
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});