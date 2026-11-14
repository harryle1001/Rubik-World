// characters.js — Nhân vật có animation dùng chung cho người chơi, bạn bè online và học sinh/thầy cô trong trường.
// - Học sinh (Kenney Mini Characters, CC0): STUDENTS — có cặp sách và khăn quàng đỏ gắn vào xương "torso".
// - Bộ phiêu lưu (KayKit, CC0): 'hero-knight' … (vẫn dùng được nếu muốn).
// Animation theo trạng thái: driveHero(). Hành động một lần (vẫy tay, nhặt đồ…): emote().
import * as THREE from 'three';
import { loadAnimated, animator } from './models.js';
import { addOutline, toon } from './style.js';

export const STUDENTS = ['male-a', 'female-a', 'male-b', 'female-b', 'male-c', 'female-c', 'male-d', 'female-d', 'male-e', 'female-e', 'male-f', 'female-f'].map(v => 'student-' + v);
export const KINDS = STUDENTS;
const KAYKIT = { 'hero-knight': 'Knight', 'hero-rogue': 'Rogue', 'hero-mage': 'Mage', 'hero-barbarian': 'Barbarian' };
// tên animation chung → tên trong từng bộ
const NAMES = {
  kaykit: { idle: 'Idle', walk: 'Walking_A', run: 'Running_A', jump: 'Jump_Idle', cheer: 'Cheer', interact: 'Interact', pickup: 'PickUp', sit: 'Sit_Floor_Idle' },
  kenney: { idle: 'idle', walk: 'walk', run: 'sprint', jump: 'jump', cheer: 'emote-yes', interact: 'interact-right', pickup: 'pick-up', sit: 'sit', no: 'emote-no' },
};

// Nạp nhân vật: chỉnh cỡ (height m), thêm viền; học sinh có cặp sách + khăn quàng đỏ. Trả về { model, anim, set } hoặc null.
export async function loadHero(kind, height = 1.55) {
  const g = await loadAnimated(kind); if (!g) return null;
  const model = g.scene, kay = KAYKIT[kind];
  if (kay) model.traverse(o => { if (o.isMesh && !o.name.startsWith(kay)) o.visible = false; }); // ẩn vũ khí
  model.updateMatrixWorld(true);
  const box = new THREE.Box3(); model.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
  const h = box.max.y - box.min.y || 1, s = height / h; model.scale.multiplyScalar(s);
  if (!kay) dressStudent(model, h);
  addOutline(model);
  const set = kay ? NAMES.kaykit : NAMES.kenney;
  return { model, anim: animator(model, g.animations, n => n.split('|').pop()), set };
}

// Cặp sách + khăn quàng đỏ, gắn vào xương ngực để chuyển động theo người
function dressStudent(model, h) {
  let torso = null; model.traverse(o => { if (!torso && /torso|spine|chest/i.test(o.name) && (o.isBone || o.type === 'Bone' || o.type === 'Object3D')) torso = o; });
  if (!torso) return;
  const inv = 1 / (torso.getWorldScale(new THREE.Vector3()).x || 1), u = h * inv; // đơn vị theo chiều cao nhân vật
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.26 * u, 0.3 * u, 0.12 * u), toon('#3d7bd9')); bag.position.set(0, 0.12 * u, -0.17 * u);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.27 * u, 0.1 * u, 0.13 * u), toon('#f2b134')); flap.position.set(0, 0.24 * u, -0.17 * u);
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.07 * u, 0.16 * u, 3), toon('#d8332a')); scarf.rotation.x = Math.PI; scarf.position.set(0, 0.22 * u, 0.13 * u);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.2 * u, 0.04 * u, 0.06 * u), toon('#d8332a')); knot.position.set(0, 0.3 * u, 0.1 * u);
  for (const m of [bag, flap, scarf, knot]) { m.castShadow = true; torso.add(m); }
}

// Chọn animation theo trạng thái di chuyển
export function driveHero(hero, { speed, grounded, walk = 5.5, oneShot, sitting }) {
  const a = hero.anim, N = hero.set || NAMES.kenney;
  if (oneShot && oneShot.until > performance.now()) return;
  if (sitting) { a.play(N.sit, 0.3); return; }
  if (!grounded) { a.play(N.jump, 0.15); return; }
  if (speed > walk * 1.15) { const r = a.play(N.run, 0.2); if (r) r.timeScale = Math.min(1.5, speed / 7); }
  else if (speed > 0.3) { const w = a.play(N.walk, 0.2); if (w) w.timeScale = Math.max(0.6, speed / 2.6); }
  else a.play(N.idle, 0.3);
}

// Hành động một lần (cheer, interact, pickup…) rồi quay lại di chuyển
export function emote(hero, state, name) {
  const N = hero.set || NAMES.kenney, act = hero.anim.play(N[name] || name, 0.15, true); if (!act) return;
  state.oneShot = { until: performance.now() + act.getClip().duration * 1000 / (act.timeScale || 1) - 120 };
}
