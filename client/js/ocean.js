import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06384d);
scene.fog = new THREE.FogExp2(0x06384d, 0.035);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
cam.position.set(0, 4, 14);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(cam, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.52; controls.maxDistance = 30; controls.target.set(0, 3, 0);

scene.add(new THREE.HemisphereLight(0x9fe8ff, 0x1a3a2a, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(5, 20, 5); scene.add(sun);

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.7, ...o });

// Đáy biển
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), mat(0xc9b27c));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const pos = floor.geometry.attributes.position;
for (let i = 0; i < pos.count; i++) pos.setZ(i, (Math.sin(pos.getX(i) * 0.4) + Math.cos(pos.getY(i) * 0.35)) * 0.25);
floor.geometry.computeVertexNormals();

// San hô
const coral = new THREE.Group(); scene.add(coral);
const coralCols = [0xff6b81, 0xff9f43, 0xfeca57, 0xa55eea, 0x1dd1a1];
for (let i = 0; i < 40; i++) {
  const g = new THREE.Group(), c = coralCols[i % 5], n = 3 + (i % 4);
  for (let k = 0; k < n; k++) {
    const h = 0.8 + Math.random() * 1.6;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.18 + Math.random() * 0.15, h, 5), mat(c));
    b.position.set((Math.random() - .5) * 0.7, h / 2, (Math.random() - .5) * 0.7);
    b.rotation.set((Math.random() - .5) * 0.5, 0, (Math.random() - .5) * 0.5); g.add(b);
  }
  const a = Math.random() * 6.28, r = 4 + Math.random() * 22;
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); coral.add(g);
}
// Rong biển (lắc theo sóng)
const weeds = [];
for (let i = 0; i < 35; i++) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 3 + Math.random() * 2, 5, 6), mat(0x2ecc71));
  const a = Math.random() * 6.28, r = 3 + Math.random() * 24;
  w.position.set(Math.cos(a) * r, 2, Math.sin(a) * r); w.userData.p = Math.random() * 6; weeds.push(w); scene.add(w);
}

// Sinh vật (kèm kiến thức học)
const creatures = [];
function fish(color, scale, name, fact) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(color)); body.scale.set(1.6, 0.9, 0.6); g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 4), mat(color)); tail.rotation.z = Math.PI / 2; tail.position.x = -1; g.add(tail); g.userData.tail = tail;
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0x111111)); e.position.set(0.55, 0.15, 0.25 * s); g.add(e); }
  g.scale.setScalar(scale);
  g.userData = { ...g.userData, name, fact, r: 5 + Math.random() * 14, a: Math.random() * 6.28, sp: 0.15 + Math.random() * 0.25, y: 2 + Math.random() * 7, ph: Math.random() * 6 };
  scene.add(g); creatures.push(g); return g;
}
const cols = [0xff7f50, 0x54a0ff, 0xfeca57, 0xff6b6b, 0x1dd1a1];
for (let i = 0; i < 18; i++) fish(cols[i % 5], 0.6 + Math.random() * 0.5, 'Cá nhiệt đới', 'Cá thở bằng mang: mang lọc oxy hòa tan trong nước.');
const shark = fish(0x7f8fa6, 2.6, 'Cá mập', 'Cá mập là cá sụn, không có xương cứng; bộ xương làm bằng sụn.');
shark.userData.r = 16; shark.userData.sp = 0.1; shark.userData.y = 6;

// Rùa biển
const turtle = new THREE.Group();
const shell = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), mat(0x6ab04c)); shell.scale.set(1, 0.5, 1.2); turtle.add(shell);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat(0xb8e994)); head.position.z = 1.2; turtle.add(head);
for (const [x, z] of [[1, .7], [-1, .7], [.8, -.8], [-.8, -.8]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.35), mat(0xb8e994)); f.position.set(x, 0, z); turtle.add(f); }
turtle.userData = { name: 'Rùa biển', fact: 'Rùa biển thở bằng phổi nên phải nổi lên mặt nước để lấy không khí.', r: 10, a: 1, sp: 0.07, y: 4, ph: 0 };
scene.add(turtle); creatures.push(turtle);

// Bong bóng
const bubbles = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xcff6ff, size: 0.18, transparent: true, opacity: 0.7 }));
const bp = new Float32Array(300 * 3); for (let i = 0; i < 300; i++) { bp[i * 3] = (Math.random() - .5) * 40; bp[i * 3 + 1] = Math.random() * 14; bp[i * 3 + 2] = (Math.random() - .5) * 40; }
bubbles.geometry.setAttribute('position', new THREE.BufferAttribute(bp, 3)); scene.add(bubbles);

// Nạp model Blender (.glb) nếu có: đặt file vào client/assets/models/ rồi thêm vào danh sách dưới
const MODELS = [/* { url: '/assets/models/ca-map.glb', pos: [0, 3, 0], scale: 1 } */];
const loader = new GLTFLoader();
for (const m of MODELS) loader.load(m.url, g => { g.scene.position.set(...m.pos); g.scene.scale.setScalar(m.scale || 1); scene.add(g.scene); });

// Chạm để học
const ray = new THREE.Raycaster(), info = document.getElementById('info'); let hide;
renderer.domElement.addEventListener('pointerdown', e => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
  const hit = ray.intersectObjects(creatures, true)[0]; if (!hit) return;
  let o = hit.object; while (o && !o.userData.name) o = o.parent;
  if (!o) return;
  info.innerHTML = `<b>${o.userData.name}</b><br>${o.userData.fact}`; info.style.opacity = 1;
  clearTimeout(hide); hide = setTimeout(() => info.style.opacity = 0, 4000);
});

addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  for (const c of creatures) {
    const u = c.userData; u.a += u.sp * 0.016;
    const x = Math.cos(u.a) * u.r, z = Math.sin(u.a) * u.r;
    c.position.set(x, u.y + Math.sin(t + u.ph) * 0.4, z);
    c.rotation.y = -u.a - (u.tail ? Math.PI / 2 : 0); // cá hướng mũi theo +x, rùa theo +z
    if (u.tail) u.tail.rotation.y = Math.sin(t * 8 + u.ph) * 0.5;
  }
  for (const w of weeds) w.rotation.z = Math.sin(t + w.userData.p) * 0.15;
  const p = bubbles.geometry.attributes.position;
  for (let i = 0; i < 300; i++) { let y = p.getY(i) + 0.02; if (y > 14) y = 0; p.setY(i, y); } p.needsUpdate = true;
  controls.update(); renderer.render(scene, cam);
});
