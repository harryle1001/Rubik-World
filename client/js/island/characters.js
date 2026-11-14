// characters.js — Nhân vật có animation dùng chung cho người chơi, bạn bè online và học sinh/thầy cô trong trường.
// - Học sinh (Kenney Mini Characters, CC0): STUDENTS — có cặp sách và khăn quàng đỏ gắn vào xương "torso".
// - Bộ phiêu lưu (KayKit, CC0): 'hero-knight' … (vẫn dùng được nếu muốn).
// Animation theo trạng thái: driveHero(). Hành động một lần (vẫy tay, nhặt đồ…): emote().
import * as THREE from 'three';
import { loadAnimated, animator } from './models.js';
import { addOutline, toon, gradientMap } from './style.js';

// Học sinh Việt Nam dáng chibi low-poly dễ thương (Kenney Mini Characters, CC0, ~700 tam giác):
// tô lại thành áo sơ mi trắng, quần/váy xanh đậm; thêm khăn quàng đỏ và cặp sách gắn vào xương ngực.
export const STUDENTS = ['male-a', 'female-a', 'male-b', 'female-b', 'male-c', 'female-c', 'male-d', 'female-d', 'male-e', 'female-e', 'male-f', 'female-f'].map(v => 'student-' + v);
export const KINDS = STUDENTS;
const KAYKIT = { 'hero-knight': 'Knight', 'hero-rogue': 'Rogue', 'hero-mage': 'Mage', 'hero-barbarian': 'Barbarian' };
const NAMES = {
  kaykit: { idle: 'Idle', walk: 'Walking_A', run: 'Running_A', jump: 'Jump_Idle', cheer: 'Cheer', interact: 'Interact', pickup: 'PickUp', sit: 'Sit_Floor_Idle' },
  student: { idle: 'idle', walk: 'walk', run: 'sprint', jump: 'jump', cheer: 'emote-yes', interact: 'interact-right', pickup: 'pick-up', sit: 'sit', no: 'emote-no' },
};
const UNIFORM = { shirt: new THREE.Color('#f8f8f4'), pants: new THREE.Color('#203063') };

// Nạp nhân vật, chỉnh cỡ (height m), thêm viền. Trả về { model, anim, set } hoặc null.
export async function loadHero(kind, height = 1.25) {
  const g = await loadAnimated(kind); if (!g) return null;
  const model = g.scene, kay = KAYKIT[kind], student = kind.startsWith('student-');
  if (kay) model.traverse(o => { if (o.isMesh && !o.name.startsWith(kay)) o.visible = false; }); // ẩn vũ khí
  if (student) uniform(model);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3(); model.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
  const h = box.max.y - box.min.y || 1; model.scale.multiplyScalar(height / h);
  if (student) dressStudent(model);
  addOutline(model);
  return { model, anim: animator(model, g.animations, n => n.split('|').pop()), set: student ? NAMES.student : NAMES.kaykit };
}

// Đổi màu thân theo xương: thân & tay → áo trắng, chân → quần xanh (giữ màu da ở cổ/tay và màu giày)
const pixCache = new Map();
function texReader(map) {
  if (!map || !map.image) return null;
  if (pixCache.has(map.uuid)) return pixCache.get(map.uuid);
  const img = map.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
  const f = (u, v) => { const x = Math.min(W - 1, Math.max(0, Math.floor(u * W))), y = Math.min(H - 1, Math.max(0, Math.floor((map.flipY ? 1 - v : v) * H))), i = (y * W + x) * 4; return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]; };
  pixCache.set(map.uuid, f); return f;
}
function uniform(model) {
  model.traverse(o => {
    if (!o.isSkinnedMesh || o.name !== 'body-mesh') return;
    const geo = o.geometry;
    if (!geo.userData.uniform) {
      const read = texReader(o.material.map), pos = geo.attributes.position, uv = geo.attributes.uv, J = geo.attributes.skinIndex, Wt = geo.attributes.skinWeight;
      let ymin = Infinity, ymax = -Infinity; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
      const col = new Float32Array(pos.count * 3), c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        let bi = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = Wt.getComponent(i, k); if (w > bw) { bw = w; bi = J.getComponent(i, k); } }
        const bone = (o.skeleton.bones[bi] || {}).name || '', orig = read && uv ? read(uv.getX(i), uv.getY(i)) : [1, 1, 1];
        const [r, gg, b] = orig, skin = r > 0.55 && r > gg && gg > b && r - b > 0.12, dark = r + gg + b < 0.55, t = (pos.getY(i) - ymin) / (ymax - ymin || 1);
        if (/leg/.test(bone)) c.setRGB(...((dark || t < 0.08) ? orig : UNIFORM.pants.toArray()));
        else if (/torso|arm/.test(bone)) c.setRGB(...(skin ? orig : UNIFORM.shirt.toArray()));
        else c.setRGB(r, gg, b);
        col.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.userData.uniform = true;
    }
    o.material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
  });
}

// Khăn quàng đỏ + cặp sách, gắn vào xương ngực (đặt theo khung thân đo được)
function dressStudent(model) {
  model.updateMatrixWorld(true);
  const body = model.getObjectByName('body-mesh'), torso = model.getObjectByName('torso'); if (!body || !torso) return;
  const wb = new THREE.Box3().setFromObject(body), H = wb.max.y - wb.min.y, W = wb.max.x - wb.min.x, D = wb.max.z - wb.min.z, cx = (wb.min.x + wb.max.x) / 2;
  const at = (mesh, wx, wy, wz) => {
    torso.updateWorldMatrix(true, false);
    const want = new THREE.Matrix4().compose(new THREE.Vector3(wx, wy, wz), model.getWorldQuaternion(new THREE.Quaternion()), model.getWorldScale(new THREE.Vector3()));
    new THREE.Matrix4().copy(torso.matrixWorld).invert().multiply(want).decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.castShadow = true; torso.add(mesh);
  };
  const s = 1 / model.scale.x, red = toon('#d8232a');
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(W * 0.13 * s, H * 0.22 * s, 3), red); scarf.geometry.rotateX(Math.PI); scarf.geometry.scale(1, 1, 0.4);
  at(scarf, cx, wb.min.y + H * 0.7, wb.max.z + 0.002);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42 * s, H * 0.07 * s, D * 0.2 * s), red); at(knot, cx, wb.min.y + H * 0.86, wb.max.z - D * 0.08);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42 * s, H * 0.3 * s, D * 0.3 * s), toon('#3d7bd9')); at(bag, cx, wb.min.y + H * 0.58, wb.min.z - D * 0.1);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(W * 0.44 * s, H * 0.09 * s, D * 0.32 * s), toon('#f2b134')); at(flap, cx, wb.min.y + H * 0.71, wb.min.z - D * 0.1);
}

// Chọn animation theo trạng thái di chuyển
export function driveHero(hero, { speed, grounded, walk = 5.5, oneShot, sitting }) {
  const a = hero.anim, N = hero.set || NAMES.student;
  if (oneShot && oneShot.until > performance.now()) return;
  if (sitting) { a.play(N.sit, 0.3); return; }
  if (!grounded) { a.play(N.jump, 0.15); return; }
  if (speed > walk * 1.15) { const r = a.play(N.run, 0.2); if (r) r.timeScale = Math.min(1.5, speed / 7); }
  else if (speed > 0.3) { const w = a.play(N.walk, 0.2); if (w) w.timeScale = Math.max(0.6, speed / 2.6); }
  else a.play(N.idle, 0.3);
}

// Hành động một lần (cheer, interact, pickup…) rồi quay lại di chuyển
export function emote(hero, state, name) {
  const N = hero.set || NAMES.student, act = hero.anim.play(N[name] || name, 0.15, true); if (!act) return;
  state.oneShot = { until: performance.now() + act.getClip().duration * 1000 / (act.timeScale || 1) - 120 };
}
