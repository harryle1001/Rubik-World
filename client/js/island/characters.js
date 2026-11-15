// characters.js — Nhân vật có animation dùng chung cho người chơi, bạn bè online và học sinh/thầy cô/người dân.
// - Dáng "Zelda toon" (people-model.js): khối low-poly gắn lên xương + 14 animation của KayKit Adventurers (CC0),
//   chân tay kéo dài cho cân đối, mắt to, tóc nhiều mảng. Học sinh: sơ mi trắng, khăn quàng đỏ, quần/váy xanh đậm, ba lô.
// - Bộ phiêu lưu gốc (KayKit, CC0): 'hero-knight' … (vẫn dùng được nếu muốn).
// Animation theo trạng thái: driveHero(). Hành động một lần (vẫy tay, nhặt đồ…): emote().
import * as THREE from 'three';
import { loadAnimated, animator } from './models.js';
import { addOutline, outlineMat } from './style.js';
import { RIG, BUILD, stretchRig, rigClips, buildPerson, jointsOf, skinTo } from './people-model.js';

// 12 học sinh để người chơi chọn (theo màu): 6 bạn nam, 6 bạn nữ — khác kiểu tóc, màu da, màu ba lô, phụ kiện
export const STUDENTS = ['male-a', 'female-a', 'male-b', 'female-b', 'male-c', 'female-c', 'male-d', 'female-d', 'male-e', 'female-e', 'male-f', 'female-f'].map(v => 'student-' + v);
export const KINDS = STUDENTS;
const SKIN = ['#f5cfa8', '#efc09a', '#e6b48c', '#f7d8b8', '#e9b991', '#f2c6a0'];
const HAIR = ['#1f1714', '#2b1d16', '#1a1412', '#3a2618', '#231915', '#2e2019'];
const BAG = ['#3d7bd9', '#e0564a', '#4caf6a', '#f2b134', '#9a5ad6', '#2bb3b3'];
const BASE = {};
'abcdef'.split('').forEach((v, i) => {
  BASE['student-male-' + v] = { gender: 'm', hairStyle: ['short', 'spiky', 'side', 'buzz', 'short', 'side'][i], skin: SKIN[i], hair: HAIR[i], bag: BAG[i], glasses: i === 4, shoes: ['#2a2630', '#f2f2f2', '#2a2630', '#3b4a6b', '#2a2630', '#f2f2f2'][i], sole: ['#e9e4da', '#d24a3a', '#e9e4da', '#f2f2f2', '#e9e4da', '#3d7bd9'][i] };
  BASE['student-female-' + v] = { gender: 'f', hairStyle: ['pony', 'twin', 'bob', 'long', 'pony', 'bun'][i], skin: SKIN[(i + 3) % 6], hair: HAIR[(i + 2) % 6], bag: BAG[(i + 1) % 6], acc: ['bow', null, 'clip', 'bow', null, 'clip'][i], accColor: ['#ff5a8a', '#ffd23f', '#7fd1ff', '#ff8a2b', '#b06bff', '#ff5a8a'][i], shoes: ['#2a2630', '#f2f2f2', '#5a3a2a', '#2a2630', '#f2f2f2', '#2a2630'][i], sole: ['#e9e4da', '#ff7aa8', '#e9e4da', '#e9e4da', '#7fd1ff', '#e9e4da'][i] };
});
const NAMES = {
  kaykit: { idle: 'Idle', walk: 'Walking_A', run: 'Running_A', jump: 'Jump_Idle', cheer: 'Cheer', interact: 'Interact', pickup: 'PickUp', sit: 'Sit_Floor_Idle' },
  person: { idle: 'Idle', walk: 'Walking_A', run: 'Running_A', jump: 'Jump_Idle', cheer: 'Cheer', interact: 'Interact', pickup: 'PickUp', sit: 'Sit_Chair', floor: 'Sit_Floor_Idle', no: 'Head_No', hit: 'Hit_A', use: 'Use_Item' },
};

// Trang phục cuối cùng = đặc điểm người (BASE theo kind) + vai trò (look)
//   look: { role:'student'|'teacher'|'adult', shirt, pants, bag, acc, accColor|bowColor, aodai, skirt, cap, brim, hat, hatStyle, glasses, sun, tie, prop, propColor }
function personLook(kind, look) {
  const b = BASE[kind] || BASE['student-male-a'], L = look || {}, f = b.gender === 'f';
  if (!L.role || L.role === 'student') return { ...b, scarf: '#d8232a', shirt: L.shirt || '#f7f7f2', pants: L.pants || '#1f2a5a', skirt: f, belt: f ? null : '#2a1f1a', bag: L.bag || b.bag, acc: L.acc !== undefined ? L.acc : b.acc, accColor: L.bowColor || L.accColor || b.accColor, glasses: L.glasses || (L.acc === 'glasses') || (L.acc === undefined && b.glasses) };
  const teacher = L.role === 'teacher';
  return { gender: b.gender, adult: true, skin: b.skin, hair: b.hair, hairStyle: L.aodai ? 'long' : f ? (L.skirt || teacher ? 'bun' : 'bob') : (teacher ? 'side' : 'short'),
    shirt: L.shirt || '#9fc3e8', pants: L.pants || '#3a3a44', aodai: !!L.aodai, skirt: !!L.skirt && !L.aodai, longSleeve: teacher && !L.aodai, belt: !f && !L.aodai ? '#2a1f1a' : null, tie: L.tie || null,
    cap: L.cap || null, brim: L.brim || null, hat: L.hat || null, hatStyle: L.hatStyle || null, glasses: !!L.glasses, sun: !!L.sun, prop: L.prop || null, propColor: L.propColor || null, shoes: L.aodai ? '#c8a882' : '#2a2226', sole: '#4a3a30' };
}

const jointCache = new Map(), geoCache = new Map();
// Nạp nhân vật, chỉnh cỡ (height m), thêm viền. Trả về { model, anim, set, height, outlines, head } hoặc null.
export async function loadHero(kind, height = 1.65, look = null) {
  if (kind.startsWith('hero-')) return loadKayKit(kind, height);
  const g = await loadAnimated(RIG); if (!g) return null;
  const model = g.scene, L = personLook(kind, look), B = L.adult ? BUILD.adult : BUILD.kid, bk = L.adult ? 'adult' : 'kid';
  const kill = []; model.traverse(o => { if (o.isMesh) kill.push(o); }); for (const o of kill) o.parent.remove(o); // chỉ giữ xương
  stretchRig(model, B);
  if (!jointCache.has(bk)) jointCache.set(bk, jointsOf(model));
  const key = JSON.stringify(L);
  if (!geoCache.has(key)) geoCache.set(key, buildPerson(jointCache.get(bk), L));
  const G = geoCache.get(key);
  skinTo(model, G); model.scale.setScalar(height / G.top);
  addOutline(model);
  const outlines = []; model.traverse(o => { if (o.userData.outline && o.material === outlineMat) outlines.push(o); });
  const anim = animator(model, rigClips(g.animations, B, model));
  const N = NAMES.person; for (const [k, v] of Object.entries({ ...N, drive: N.sit })) if (!anim.actions[k] && anim.actions[v]) anim.actions[k] = anim.actions[v]; // tên cũ (vehicles: 'drive', 'sit', 'idle')
  return { model, anim, set: N, height, outlines, head: model.getObjectByName('head'), outlineOn: true, tris: G.tris };
}
// Bộ KayKit gốc (hiệp sĩ, phù thuỷ…): ẩn vũ khí
const KAYKIT = { 'hero-knight': 'Knight', 'hero-rogue': 'Rogue', 'hero-mage': 'Mage', 'hero-barbarian': 'Barbarian' };
async function loadKayKit(kind, height) {
  const g = await loadAnimated(kind); if (!g) return null;
  const model = g.scene, kay = KAYKIT[kind];
  model.traverse(o => { if (o.isMesh && !o.name.startsWith(kay)) o.visible = false; });
  model.updateMatrixWorld(true); const box = new THREE.Box3(); model.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
  model.scale.multiplyScalar(height / (box.max.y - box.min.y || 1)); addOutline(model);
  const outlines = []; model.traverse(o => { if (o.userData.outline && o.material === outlineMat) outlines.push(o); });
  return { model, anim: animator(model, g.animations, n => n.split('|').pop()), set: NAMES.kaykit, height, outlines, head: model.getObjectByName('head'), outlineOn: true };
}

// Bật/tắt viền (chỉ người gần mới cần viền: đỡ 1 lần vẽ mỗi người ở xa)
export function setOutline(hero, on) { if (hero.outlineOn === on) return; hero.outlineOn = on; for (const o of hero.outlines) o.visible = on; }

// Quay đầu nhìn mục tiêu (gọi SAU anim.update, mỗi khung hình): quay quanh trục đứng, tối đa ±65°, mượt theo w (0..1)
const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3();
// state.facing: hướng thân (nếu model nằm trong nhóm đã xoay, vd người chơi) · dt: làm mượt không phụ thuộc FPS
export function lookAtTarget(hero, target, state, dt = 1 / 60) {
  const head = hero.head; if (!head || !head.parent) return;
  if (state.after && head.quaternion.equals(state.after)) head.quaternion.copy(state.base); // animation không ghi đè xương đầu → bỏ phần xoay cũ (không cộng dồn)
  let want = 0;
  if (target) {
    head.getWorldPosition(_v); const yawTo = Math.atan2(target.x - _v.x, target.z - _v.z);
    let d = yawTo - (state.facing ?? hero.model.rotation.y); d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 2.2) want = Math.max(-1.13, Math.min(1.13, d));
  }
  state.look = (state.look || 0) + (want - (state.look || 0)) * (1 - Math.exp(-dt * 7.5));
  if (Math.abs(state.look) < 0.002) { state.after = null; return; }
  (state.base || (state.base = new THREE.Quaternion())).copy(head.quaternion);
  head.parent.getWorldQuaternion(_qp); _q.setFromAxisAngle(_up, state.look); _qi.copy(_qp).invert();
  head.quaternion.premultiply(_qi.multiply(_q).multiply(_qp)); // xoay theo trục đứng của thế giới
  (state.after || (state.after = new THREE.Quaternion())).copy(head.quaternion);
}

// Bước chân khớp tốc độ: tốc độ tự nhiên (m/s) của clip ở timeScale 1, cho mỗi 1 m chiều cao (đo chân tiếp đất trong Walking_A / Running_A).
// Pha: chân trái bước lên trước ở 0,875 (đi) và 0 (chạy) → lệch 0,125 chu kỳ; chuyển đi ↔ chạy giữ đúng pha (không đổi chân giữa chừng).
export const STRIDE = { walk: 0.92 / 1.65, run: 1.65 / 1.65, phase: 0.125 };
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function playLoco(hero, name, fade, ts) {
  const a = hero.anim, N = hero.set || NAMES.person, prev = a.current, act = a.play(name, fade); if (!act) return act;
  if (prev && act !== prev) {
    const W = a.actions[N.walk], R = a.actions[N.run];
    if ((prev === W && act === R) || (prev === R && act === W)) { const off = act === R ? STRIDE.phase : -STRIDE.phase; act.time = (((prev.time / prev.getClip().duration + off) % 1) + 1) % 1 * act.getClip().duration; }
  }
  act.timeScale = ts; return act;
}
// Đứng → đi → chạy (có trễ để không nhấp nháy giữa 2 dáng), timeScale = tốc độ thật / tốc độ tự nhiên của bước (giới hạn cho đỡ "líu chân")
function loco(hero, st, speed, runAt, fadeIdle = 0.3) {
  const N = hero.set || NAMES.person, hh = hero.height || 1.65;
  st.run = st.run ? speed > runAt * 0.9 : speed > runAt;
  if (st.run) playLoco(hero, N.run, 0.25, clampN(speed / (STRIDE.run * hh), 0.8, 3.3));
  else if (speed > (st.walk ? 0.12 : 0.25)) { st.walk = true; playLoco(hero, N.walk, 0.25, clampN(speed / (STRIDE.walk * hh), 0.45, 2.9)); }
  else { st.walk = false; hero.anim.play(N.idle, fadeIdle); }
}
// Người chơi: bật nhảy (Jump_Start) → lơ lửng (Jump_Idle) → tiếp đất (Jump_Land, khi rơi mạnh mà đứng yên) → đi/chạy theo pha.
export function drivePlayer(hero, st, { speed, grounded, vy = 0, impact = 0, dt = 1 / 60, walk = 5.5, oneShot }) {
  const a = hero.anim, N = hero.set || NAMES.person;
  st.airT = grounded ? 0 : (st.airT || 0) + dt;
  if (impact > 7) st.landT = 0.3;
  if (oneShot && oneShot.until > performance.now()) return;
  if (!grounded) {
    if (vy > 0.5 && st.airT < 0.45 && a.has('Jump_Start')) a.play('Jump_Start', 0.08, true); else a.play(N.jump, 0.22);
    return;
  }
  if (st.landT > 0) { st.landT -= dt; if (speed < walk * 0.5 && a.has('Jump_Land')) { a.play('Jump_Land', 0.06, true); return; } st.landT = 0; }
  loco(hero, st, speed, walk * 1.15);
}

// Chọn animation theo trạng thái di chuyển
export function driveHero(hero, { speed, grounded, walk = 5.5, oneShot, sitting }) {
  const a = hero.anim, N = hero.set || NAMES.person;
  if (oneShot && oneShot.until > performance.now()) return;
  if (sitting) { a.play(sitting === 'drive' && a.has('drive') ? 'drive' : sitting === 'floor' && N.floor ? N.floor : N.sit, 0.3); return; }
  if (!grounded) { a.play(N.jump, 0.15); return; }
  const st = hero._loco || (hero._loco = {});
  if (hero.npc) { loco(hero, st, speed, 2.4 * (hero.height || 1.25), 0.35); return; } // người trong thị trấn: tốc độ chân khớp tốc độ đi thật
  loco(hero, st, speed, walk * 1.15);
}

// Hành động một lần (cheer, interact, pickup…) rồi quay lại di chuyển
export function emote(hero, state, name) {
  const N = hero.set || NAMES.person, act = hero.anim.play(N[name] || name, 0.15, true); if (!act) return;
  state.oneShot = { until: performance.now() + act.getClip().duration * 1000 / (act.timeScale || 1) - 120 };
}
