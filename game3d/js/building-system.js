// building-system.js — XÂY DỰNG BẰNG KHỐI GỖ: khối mờ xem trước, xoay, đặt, gỡ, lưu vào localStorage.
// - Hình dáng từng loại khối: BLOCK_SHAPES      - Danh sách & giá đổi khối: CONFIG.BLOCKS (config.js)
// - Nhân vật đứng/leo lên khối: supportAt()        - Khoảng cách đặt trước mặt: CONFIG.build.reach
// Phím: X bật/tắt · 1–8 chọn khối · R xoay · Enter/chuột trái đặt · Q/Delete gỡ · Esc thoát
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Mesher, flatMat, wedgeGeo } from './utils.js';

const W1 = '#b07a45', W2 = '#c48c52', W3 = '#8a5a34';
const box = (m, w, h, d, c, x, y, z, top) => m.add(new THREE.BoxGeometry(w, h, d), c, { p: [x, y + h / 2, z], top });
const BLOCK_SHAPES = {
  cube: m => { box(m, 1, 1, 1, W1, 0, 0, 0, W2); for (const y of [0.33, 0.66]) box(m, 1.01, 0.03, 1.01, W3, 0, y, 0); },
  floor: m => { for (let i = 0; i < 3; i++) box(m, 1, 0.2, 0.325, i % 2 ? W1 : W2, 0, 0, -0.33 + i * 0.33); },
  wall: m => { box(m, 1, 1, 0.2, W1, 0, 0, -0.4, W2); for (const x of [-0.25, 0.25]) box(m, 0.03, 1, 0.21, W3, x, 0, -0.4); },
  slope: m => { m.add(wedgeGeo(1, 1, 1), W2, { top: '#d39a5c' }); },
  pillar: m => { box(m, 0.42, 0.12, 0.42, W3, 0, 0, 0); m.add(new THREE.CylinderGeometry(0.16, 0.18, 0.76, 6), W1, { p: [0, 0.5, 0] }); box(m, 0.42, 0.12, 0.42, W3, 0, 0.88, 0); },
  stairs: m => { for (let k = 0; k < 3; k++) box(m, 1, (k + 1) / 3, 1 / 3, k % 2 ? W1 : W2, 0, 0, 1 / 3 - k / 3); },
  door: m => { for (const x of [-0.44, 0.44]) box(m, 0.12, 1, 0.22, W3, x, 0, -0.4); box(m, 1, 0.12, 0.22, W3, 0, 0.88, -0.4); box(m, 0.76, 0.88, 0.08, '#7a4a2a', 0, 0, -0.4, '#8a5a34'); m.add(new THREE.IcosahedronGeometry(0.04, 0), '#f2c14e', { p: [0.25, 0.45, -0.34] }); },
  fence: m => { for (const x of [-0.42, 0.42]) box(m, 0.12, 0.9, 0.12, '#9a7a3a', x, 0, 0); for (const y of [0.3, 0.65]) box(m, 1, 0.08, 0.06, '#b8a050', 0, y, 0); },
};
// standable: đứng lên được (độ cao mặt trên); climb: leo được dù cao 1m; pass: đi xuyên qua
const PHYS = { cube: { top: 1 }, floor: { top: 0.2 }, slope: { top: 1, climb: true }, stairs: { top: 1, climb: true }, wall: { top: 1, solid: true }, pillar: { top: 1, solid: true }, fence: { top: 0.9, solid: true }, door: { pass: true } };

export function createBuildingSystem(ctx, world) {
  const { scene, camera } = ctx; const inv = ctx.inventory;
  const types = CONFIG.BLOCKS.map(b => b.id);
  const mat = flatMat({ side: THREE.DoubleSide });
  const meshes = {}, geos = {};
  for (const id of types) {
    const m = new Mesher(); BLOCK_SHAPES[id](m); geos[id] = m.geometry();
    const im = new THREE.InstancedMesh(geos[id], mat, CONFIG.build.maxBlocks); im.count = 0; im.castShadow = im.receiveShadow = true; im.frustumCulled = false; im.userData.type = id;
    scene.add(im); meshes[id] = im;
  }
  let blocks = []; const cells = new Map();
  const key = (x, y, z) => x + ',' + y + ',' + z;
  try { blocks = JSON.parse(localStorage.getItem(CONFIG.save.blocks) || '[]').map(([t, x, y, z, r]) => ({ t, x, y, z, r })).filter(b => meshes[b.t]); } catch (e) {}
  blocks.forEach(b => cells.set(key(b.x, b.y, b.z), b));
  const save = () => { try { localStorage.setItem(CONFIG.save.blocks, JSON.stringify(blocks.map(b => [b.t, b.x, b.y, b.z, b.r]))); } catch (e) {} };

  const _o = new THREE.Object3D();
  function rebuild() {
    const idx = {}; for (const id of types) idx[id] = 0;
    for (const b of blocks) { const im = meshes[b.t]; if (idx[b.t] >= CONFIG.build.maxBlocks) continue; _o.position.set(b.x, b.y, b.z); _o.rotation.set(0, b.r * Math.PI / 2, 0); _o.updateMatrix(); b.idx = idx[b.t]; im.setMatrixAt(idx[b.t]++, _o.matrix); }
    for (const id of types) { meshes[id].count = idx[id]; meshes[id].instanceMatrix.needsUpdate = true; }
  }
  rebuild();

  // ---------- Vật lý cho nhân vật ----------
  function supportAt(x, z, feetY) {
    const ix = Math.round(x), iz = Math.round(z); let top = null, blocked = false;
    for (let y = Math.floor(feetY) - 2; y <= Math.floor(feetY) + 2; y++) {
      const b = cells.get(key(ix, y, iz)); if (!b) continue; const ph = PHYS[b.t]; if (ph.pass) continue;
      const t = y + ph.top, step = ph.climb ? 1.05 : CONFIG.player.stepUp;
      if (!ph.solid && t <= feetY + step) { if (top == null || t > top) top = t; }
      else if (y < feetY + 1.6 && t > feetY + 0.05) blocked = true;
    }
    return { top, blocked };
  }

  // ---------- Chế độ xây ----------
  let on = false, sel = types[0], rot = 0, tapCell = null, tapRemove = null, tapFrom = null;
  const ghost = new THREE.Mesh(geos[sel], new THREE.MeshBasicMaterial({ color: '#7dff9a', transparent: true, opacity: 0.45, depthWrite: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }));
  ghost.visible = edges.visible = false; ghost.renderOrder = 5; scene.add(ghost, edges);
  const bar = document.getElementById('buildBar'), list = document.getElementById('bbBlocks');

  function columnTop(ix, iz, ref) {
    let top = null;
    for (let y = Math.round(ref) - 4; y <= Math.round(ref) + 6; y++) if (cells.has(key(ix, y, iz))) top = y;
    return top != null ? top + 1 : Math.round(world.groundAt(ix, iz));
  }
  function frontCell() {
    const p = ctx.player.pos, r = ctx.player.rot, d = CONFIG.build.reach;
    const ix = Math.round(p.x + Math.sin(r) * d), iz = Math.round(p.z + Math.cos(r) * d);
    return { x: ix, z: iz, y: columnTop(ix, iz, p.y) };
  }
  function target() {
    if (tapCell && tapFrom && ctx.player.pos.distanceTo(tapFrom) > 1.5) tapCell = tapRemove = null;
    return tapCell || frontCell();
  }
  function canPlace(c) {
    if (cells.has(key(c.x, c.y, c.z))) return false;
    const p = ctx.player.pos; if (Math.round(p.x) === c.x && Math.round(p.z) === c.z && c.y < p.y + 1.7 && c.y + 1 > p.y + 0.05) return false;
    return true;
  }
  function place() {
    const c = target(); if (!canPlace(c)) { ctx.toast('Không đặt được ở đây'); return; }
    if (inv.count('block_' + sel) < 1) { ctx.toast('Hết khối này. Mở 🎒 Túi đồ để đổi gỗ lấy khối.'); return; }
    if (blocks.length >= CONFIG.build.maxBlocks) { ctx.toast('Đã đạt số khối tối đa'); return; }
    inv.add('block_' + sel, -1);
    const b = { t: sel, x: c.x, y: c.y, z: c.z, r: rot }; blocks.push(b); cells.set(key(c.x, c.y, c.z), b);
    rebuild(); save(); ctx.sfx && ctx.sfx('place');
    if (tapCell) { tapCell = { x: c.x, y: c.y + 1, z: c.z }; tapRemove = { x: c.x, y: c.y, z: c.z }; }
  }
  function remove() {
    let c = tapRemove;
    if (!c) { const f = frontCell(); c = { x: f.x, y: f.y - 1, z: f.z }; }
    const b = cells.get(key(c.x, c.y, c.z)); if (!b) { ctx.toast('Không có khối nào để gỡ'); return; }
    cells.delete(key(b.x, b.y, b.z)); blocks.splice(blocks.indexOf(b), 1); inv.add('block_' + b.t, 1);
    rebuild(); save(); ctx.sfx && ctx.sfx('pop'); tapCell = tapRemove = null;
  }

  // chạm/bấm lên màn hình để chọn chỗ đặt (máy tính: bấm là đặt luôn)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  ctx.onTap = (sx, sy) => {
    if (!on) return;
    ndc.set((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); ray.far = 30;
    const hits = ray.intersectObjects([...Object.values(meshes), world.terrain], false);
    if (!hits.length) return;
    const h = hits[0], d = ray.ray.direction;
    if (h.object !== world.terrain) {
      const a = h.point.clone().addScaledVector(d, -0.02), r = h.point.clone().addScaledVector(d, 0.02);
      tapCell = { x: Math.round(a.x), y: Math.floor(a.y + 0.001), z: Math.round(a.z) }; tapRemove = { x: Math.round(r.x), y: Math.floor(r.y), z: Math.round(r.z) };
    } else { const ix = Math.round(h.point.x), iz = Math.round(h.point.z); tapCell = { x: ix, z: iz, y: columnTop(ix, iz, h.point.y) }; tapRemove = null; }
    tapFrom = ctx.player.pos.clone();
    if (!ctx.isTouch) place();
  };

  function renderBar() {
    list.innerHTML = CONFIG.BLOCKS.map((b, i) => `<button class="blk${b.id === sel ? ' sel' : ''}" data-id="${b.id}" title="${b.name} (${i + 1})"><span>${b.icon}</span><small>${b.name}</small><b>${inv.count('block_' + b.id)}</b></button>`).join('');
    list.querySelectorAll('button').forEach(btn => btn.onclick = () => select(btn.dataset.id));
  }
  function select(id) { sel = id; ghost.geometry = geos[id]; renderBar(); }
  function toggle(v = !on) {
    on = v; ctx.buildMode = on; bar.hidden = !on; ghost.visible = edges.visible = on; tapCell = tapRemove = null;
    document.body.classList.toggle('building', on);
    if (on) { renderBar(); const total = CONFIG.BLOCKS.reduce((s, b) => s + inv.count('block_' + b.id), 0); ctx.toast(total ? 'Chế độ xây: chạm lên mặt đất/khối để chọn chỗ, bấm ✔ Đặt' : 'Bạn chưa có khối. Mở 🎒 Túi đồ để đổi gỗ lấy khối nhé!'); }
  }
  document.getElementById('bbRot').onclick = () => { rot = (rot + 1) % 4; };
  document.getElementById('bbPlace').onclick = place;
  document.getElementById('bbRemove').onclick = remove;
  document.getElementById('bbExit').onclick = () => toggle(false);
  addEventListener('keydown', e => {
    if (!on || e.target.tagName === 'INPUT') return;
    if (e.code === 'KeyR') rot = (rot + 1) % 4;
    else if (e.code === 'Enter') place();
    else if (e.code === 'KeyQ' || e.code === 'Delete' || e.code === 'Backspace') remove();
    else if (/^Digit[1-8]$/.test(e.code)) select(types[+e.code.slice(5) - 1]);
  });
  ctx.onInventory = () => { if (on) renderBar(); };

  function update(t) {
    if (!on) return;
    const c = target(), ok = canPlace(c) && inv.count('block_' + sel) > 0;
    ghost.position.set(c.x, c.y, c.z); ghost.rotation.y = rot * Math.PI / 2; ghost.material.color.set(ok ? '#7dff9a' : '#ff6b6b'); ghost.material.opacity = 0.35 + Math.sin(t * 5) * 0.1;
    edges.position.set(c.x, c.y + 0.5, c.z);
  }
  return { update, toggle, supportAt, get on() { return on; } };
}
