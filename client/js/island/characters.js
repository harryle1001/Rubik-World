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
// look (tuỳ chọn, chỉ cho bộ student-*): trang phục theo vai trò, xem dressLook(). Không có look → đồng phục học sinh.
//   { role:'student'|'teacher'|'adult', shirt, pants, bag, aodai, skirt, cap, brim, glasses, prop:'book'|'clip'|'cam'|'rod'|'hat' }
export async function loadHero(kind, height = 1.25, look = null) {
  const g = await loadAnimated(kind); if (!g) return null;
  const model = g.scene, kay = KAYKIT[kind], student = kind.startsWith('student-');
  if (kay) model.traverse(o => { if (o.isMesh && !o.name.startsWith(kay)) o.visible = false; }); // ẩn vũ khí
  const dress = student && look && look.role !== 'student';
  if (student) uniform(model, dress ? look : (look && look.shirt ? look : null));
  model.updateMatrixWorld(true);
  const box = new THREE.Box3(); model.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
  const h = box.max.y - box.min.y || 1; model.scale.multiplyScalar(height / h);
  if (dress) dressLook(model, look); else if (student) dressStudent(model, look && look.bag);
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
const geoCache = new Map();
function uniform(model, look) {
  const shirt = look ? new THREE.Color(look.shirt || '#f8f8f4') : UNIFORM.shirt;
  const pants = look ? new THREE.Color(look.aodai ? '#f4f1ea' : (look.pants || '#203063')) : UNIFORM.pants;
  model.traverse(o => {
    if (!o.isSkinnedMesh || o.name !== 'body-mesh') return;
    const key = o.geometry.uuid + shirt.getHexString() + pants.getHexString();
    if (!geoCache.has(key)) { const g = o.geometry.clone(); g.userData = {}; geoCache.set(key, g); } // mỗi bộ màu 1 geometry dùng chung (userData không bị chia sẻ)
    const geo = o.geometry = geoCache.get(key);
    if (!geo.userData.uniform) {
      const read = texReader(o.material.map), pos = geo.attributes.position, uv = geo.attributes.uv, J = geo.attributes.skinIndex, Wt = geo.attributes.skinWeight;
      let ymin = Infinity, ymax = -Infinity; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
      const col = new Float32Array(pos.count * 3), c = new THREE.Color(), v = new THREE.Vector3();
      // khoảng cách mỗi đỉnh tới gốc xương chính: da chỉ ở đầu xa (cổ, bàn tay) → áo có hoa văn màu da không bị giữ nhầm
      const BI = new Uint8Array(pos.count), DI = new Float32Array(pos.count), dmax = {};
      for (let i = 0; i < pos.count; i++) {
        let bi = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = Wt.getComponent(i, k); if (w > bw) { bw = w; bi = J.getComponent(i, k); } }
        const inv = o.skeleton.boneInverses[bi]; v.fromBufferAttribute(pos, i).applyMatrix4(o.bindMatrix); if (inv) v.applyMatrix4(inv);
        BI[i] = bi; DI[i] = v.length(); dmax[bi] = Math.max(dmax[bi] || 0, DI[i]);
      }
      for (let i = 0; i < pos.count; i++) {
        const bi = BI[i], far = DI[i] > dmax[bi] * 0.62;
        const bone = (o.skeleton.bones[bi] || {}).name || '', orig = read && uv ? read(uv.getX(i), uv.getY(i)) : [1, 1, 1];
        const [r, gg, b] = orig, skin = far && r > 0.55 && r > gg && gg > b && r - b > 0.12, dark = r + gg + b < 0.55, t = (pos.getY(i) - ymin) / (ymax - ymin || 1);
        if (/leg/.test(bone)) c.setRGB(...((dark || t < 0.08) ? orig : pants.toArray()));
        else if (/torso|arm/.test(bone)) c.setRGB(...(skin ? orig : shirt.toArray()));
        else c.setRGB(r, gg, b);
        col.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.userData.uniform = true;
    }
    o.material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
  });
}

// Gắn vật dụng vào xương: đặt ở toạ độ thế giới (wx, wy, wz) lúc nhân vật đứng tư thế gốc
function boneAttach(model, boneName) {
  const bone = model.getObjectByName(boneName);
  return (mesh, wx, wy, wz) => {
    if (!bone) return; bone.updateWorldMatrix(true, false);
    const want = new THREE.Matrix4().compose(new THREE.Vector3(wx, wy, wz), model.getWorldQuaternion(new THREE.Quaternion()), model.getWorldScale(new THREE.Vector3()));
    new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(want).decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.castShadow = true; bone.add(mesh);
  };
}
function bodyBox(model) {
  model.updateMatrixWorld(true);
  const body = model.getObjectByName('body-mesh'), head = model.getObjectByName('head-mesh'); if (!body) return null;
  const wb = new THREE.Box3().setFromObject(body), hb = head ? new THREE.Box3().setFromObject(head) : wb;
  return { wb, hb, H: wb.max.y - wb.min.y, W: wb.max.x - wb.min.x, D: wb.max.z - wb.min.z, cx: (wb.min.x + wb.max.x) / 2, s: 1 / model.scale.x };
}

// Khăn quàng đỏ + cặp sách (màu cặp theo từng bạn), gắn vào xương ngực (đặt theo khung thân đo được)
function dressStudent(model, bagColor) {
  const B = bodyBox(model); if (!B) return;
  const { wb, H, W, D, cx, s } = B, at = boneAttach(model, 'torso'), red = toon('#d8232a');
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(W * 0.13 * s, H * 0.22 * s, 3), red); scarf.geometry.rotateX(Math.PI); scarf.geometry.scale(1, 1, 0.4);
  at(scarf, cx, wb.min.y + H * 0.7, wb.max.z + 0.002);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42 * s, H * 0.07 * s, D * 0.2 * s), red); at(knot, cx, wb.min.y + H * 0.86, wb.max.z - D * 0.08);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42 * s, H * 0.3 * s, D * 0.3 * s), toon(bagColor || '#3d7bd9')); at(bag, cx, wb.min.y + H * 0.58, wb.min.z - D * 0.1);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(W * 0.44 * s, H * 0.09 * s, D * 0.32 * s), toon('#f2b134')); at(flap, cx, wb.min.y + H * 0.71, wb.min.z - D * 0.1);
}

// Trang phục người lớn: thầy cô (áo dài / váy / sơ mi + sách), bảo vệ (mũ), người dân (đồ thường + vật dụng)
function dressLook(model, L) {
  const B = bodyBox(model); if (!B) return;
  const { wb, hb, H, W, D, cx, s } = B, torso = boneAttach(model, 'torso'), head = boneAttach(model, 'head'), hand = boneAttach(model, 'arm-right');
  const box = (w, h, d, c, thin) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, d * s), toon(c)); if (thin) m.userData.outline = true; return m; }; // thin: không viền (đỡ răng cưa)
  const hip = wb.min.y + H * 0.42, hx = cx - W * 0.34, hy = wb.min.y + H * 0.42, hz = wb.max.z + D * 0.06; // tay phải (nhân vật nhìn +z)
  if (L.aodai) { // áo dài: hai vạt trước/sau dài tới gối, quần trắng
    for (const z of [wb.max.z - D * 0.18, wb.min.z + D * 0.18]) torso(box(W * 0.46, H * 0.3, D * 0.06, L.shirt, true), cx, hip - H * 0.12, z);
  } else if (L.skirt) { // chân váy xoè
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.3 * s, W * 0.42 * s, H * 0.18 * s, 8), toon(L.pants || L.shirt)); torso(sk, cx, hip - H * 0.06, (wb.min.z + wb.max.z) / 2);
  }
  const hw = hb.max.x - hb.min.x, hh = hb.max.y - hb.min.y, hd = hb.max.z - hb.min.z, hcx = (hb.min.x + hb.max.x) / 2, hcz = (hb.min.z + hb.max.z) / 2;
  if (L.cap) { // mũ lưỡi trai (bảo vệ, thuyền trưởng…): chụp phần trên đầu + lưỡi trai phía trước
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(hw * 0.5, hw * 0.56, hh * 0.32, 10).scale(s, s, s), toon(L.cap)); head(cap, hcx, hb.max.y - hh * 0.1, hcz);
    head(box(hw * 0.8, hh * 0.05, hd * 0.4, L.brim || L.cap, true), hcx, hb.max.y - hh * 0.24, hb.max.z + hd * 0.1);
  }
  if (L.hat) { const hat = new THREE.Mesh(new THREE.CylinderGeometry(hw * 0.42, hw * 0.9, hh * 0.22, 10).scale(s, s, s), toon(L.hat)); head(hat, hcx, hb.max.y - hh * 0.04, hcz); }
  if (L.glasses) { const gy = hb.min.y + hh * 0.47; for (const k of [-1, 1]) head(box(hw * 0.2, hh * 0.035, hd * 0.03, '#3a2a20', true), hcx + k * hw * 0.17, gy, hb.max.z + 0.004); }
  if (L.prop === 'book') { hand(box(W * 0.34, H * 0.24, D * 0.12, L.propColor || '#c0392b'), hx, hy, hz); hand(box(W * 0.3, H * 0.21, D * 0.125, '#fff7e0', true), hx + W * 0.03, hy, hz); }
  else if (L.prop === 'clip') { hand(box(W * 0.34, H * 0.27, D * 0.06, '#8a5a34'), hx, hy, hz); hand(box(W * 0.29, H * 0.21, D * 0.07, '#ffffff', true), hx, hy - H * 0.015, hz); }
  else if (L.prop === 'cam') { hand(box(W * 0.22, H * 0.15, D * 0.36, '#2a2a33'), hx, hy + H * 0.04, hz); hand(box(W * 0.1, H * 0.08, D * 0.06, '#7fd1ff', true), hx, hy + H * 0.05, hz + D * 0.2); }
  else if (L.prop === 'rod') { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * s, 0.02 * s, H * 1.1 * s, 4), toon('#6b4a2b')); r.geometry.rotateX(0.9); hand(r, hx, hy + H * 0.25, hz + H * 0.35); }
}

// Chọn animation theo trạng thái di chuyển
export function driveHero(hero, { speed, grounded, walk = 5.5, oneShot, sitting }) {
  const a = hero.anim, N = hero.set || NAMES.student;
  if (oneShot && oneShot.until > performance.now()) return;
  if (sitting) { a.play(sitting === 'drive' && a.has('drive') ? 'drive' : N.sit, 0.3); return; }
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
