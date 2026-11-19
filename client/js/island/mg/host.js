// mg/host.js — KHUNG CHUNG MINI GAME 3D (dùng cho cả 3 nhóm game).
// Mỗi mini game là một "khu chơi" 3D đặt NGAY TRONG thế giới (sân/phòng cạnh toà nhà): camera bay mượt vào, nhân vật người chơi
// xuất hiện và có hoạt ảnh, NPC học sinh/thầy cô làm đối thủ/cổ vũ, HUD gọn (điểm, thời gian, kỷ lục, nút Thoát), Esc để thoát,
// thoát xong trả người chơi về đúng chỗ đứng trước cửa. Không còn mini game 2D: cửa chưa có bản 3D chỉ báo "Sắp mở" (school-town.js).
//
// ===== CÁCH ĐĂNG KÝ (mỗi nhóm 1 file register) =====
//   // mg/<nhom>/index.js
//   import { startChess } from './chess.js';
//   export function register(ctx) {
//     ctx.miniGames.chess = { name: '♟️ Cờ vua khổng lồ', radius: 21, start: startChess };
//   }
//   // ocean.js: 1 dòng import + 1 dòng gọi (đặt cạnh dòng của nhóm board)
//   import { register as regBoard } from './island/mg/board/index.js';   …   regBoard(ctx);
//
// ===== HỢP ĐỒNG CỦA 1 GAME =====
//   ctx.miniGames[key] = {
//     name,                 // tên hiện trên HUD
//     radius = 13,          // bán kính khu chơi (m) → host tìm chỗ đất phẳng, trống quanh cửa (Fibonacci: 8, 13, 21, 34)
//     spot(ctx, door) → [x, z, yaw] | null   // (tuỳ chọn) chọn sẵn chỗ đặt khu chơi, vd giữa công viên cờ
//     doors: [/regex/],     // (tuỳ chọn) thêm cửa mở game này, ngoài bảng DOOR_KEYS bên dưới
//     start(ctx, opts) → { update(dt, t), dispose(), down?(e), move?(e), up?(e), tap?(e), key?(e) }
//   }
//   opts = { key, door, api }  — api là bộ công cụ của host (xem makeApi):
//     api.root            THREE.Group đặt ở tâm khu chơi (y = mặt đất, đã xoay theo yaw). Mọi thứ của game add vào đây,
//                         toạ độ CỤC BỘ; host tự gỡ + dispose geometry/material khi thoát.
//     api.cam             { x, y, z, yaw, pitch, dist } (cục bộ) — đổi bất kỳ lúc nào, camera bám theo mượt. api.orbit = true: vuốt để xoay.
//     api.me              nhân vật người chơi (actor). api.actor(kind, { look, height, name }) → Promise<actor> NPC.
//                         actor: place(x, z, yaw) · walkTo(x, z, { speed }) → Promise · face(x, z) · emote('cheer'|'interact'|'pickup'|'no'|'hit'|'use')
//                                · sit('sit'|'floor'|false) · say(text, ms) · model (Group) · pos (Vector3 cục bộ)
//     api.hud             score(v) · time(giây) · msg(html, ms) · button(label, fn, cls) → <button> · bar (div dưới cùng) · clearBar()
//     api.end({ score, title, text, lowerBetter }) → thẻ kết quả + lưu kỷ lục (localStorage 'mg.best.<key>')
//     api.best(lowerBetter?) · api.saveBest(score, lowerBetter) · api.restart() · api.exit()
//     api.pick(e, objects) → giao điểm raycast đầu tiên (e: PointerEvent) · api.ray(e) → THREE.Raycaster
//     api.on(target, type, fn) — gắn sự kiện, host tự gỡ khi thoát · api.sfx(tên) · api.mat(color) vật liệu toon dùng chung
//   Sự kiện chạm: down(e) trả true = game "giữ" ngón tay này (move/up gửi cho game); ngược lại host dùng để xoay camera
//   (nếu api.orbit) và gửi tap(e) khi chạm nhẹ không kéo.
//
// ===== BẢNG ÁNH XẠ CỬA → KHOÁ GAME (door.n trong RS.doors() của trường 2D) =====
// Khoá ổn định, KHÔNG đổi tên. Nhóm nào làm game nào thì đăng ký đúng khoá đó; chưa đăng ký → cửa báo "Sắp mở".
//   Nhóm 1 (board, phiên này): chess, caro, go, rubik
//   Nhóm 2 (thể thao/arcade/câu cá): olympics, football, basketball, skate, patin, ski, kart, animal-race, balloon, arcade, missile, fishing, fishing-boat
//   Nhóm 3 (nghệ thuật/tri thức):    music, art, library, reader, academy, telescope, zen, garden
export const DOOR_KEYS = [
  // --- nhóm 1: cờ & Rubik ---
  [/^Khu cờ vua|^Bàn cờ Ikigai|Thầy Đức · Lớp cờ vua|Ông Tư · Cờ vua/, 'chess'],
  [/Cờ caro/, 'caro'],
  [/Cờ vây/, 'go'],
  [/^Lớp Rubik|Cô Lan · Lớp Rubik|Bạn Minh · Rubik 3D/, 'rubik'],
  // --- nhóm 2: thể thao, arcade, câu cá ---
  [/Thế vận hội/, 'olympics'],
  [/Bóng đá mini/, 'football'],
  [/Bóng rổ/, 'basketball'],
  [/Trượt ván/, 'skate'],
  [/Trượt patin/, 'patin'],
  [/Trượt tuyết/, 'ski'],
  [/Rubik Kart/, 'kart'],
  [/Đua thú/, 'animal-race'],
  [/Khinh khí cầu/, 'balloon'],
  [/Game 2 người|Đấu online/, 'arcade'],
  [/Tàu hải quân|Hầm tên lửa/, 'missile'],
  [/Câu cá hồ/, 'fishing'],
  [/Câu cá biển/, 'fishing-boat'],
  // --- nhóm 3: nghệ thuật, tri thức ---
  [/^Phòng nhạc|Chị Mai · Phòng nhạc/, 'music'],
  [/Vẽ tranh/, 'art'],
  [/^Thư viện Tri Thức|Cô Thư · Thư viện/, 'library'],
  [/^Hội trường|Nghe Người Thầy Ánh Sáng/, 'reader'],
  [/Học viện trí tuệ|Lắp ráp điện/, 'academy'],
  [/Kính viễn vọng/, 'telescope'],
  [/^Vườn thiền|Ngồi thiền/, 'zen'],
  [/Khu vườn mở bán/, 'garden'],
];
// Khoá game của 1 cửa (null nếu không có) — ưu tiên regex riêng trong đăng ký của game
export function doorKey(ctx, d) {
  const n = (d && d.n) || '', G = ctx.miniGames || {};
  for (const [k, g] of Object.entries(G)) if (g.doors && g.doors.some(r => r.test(n))) return k;
  for (const [r, k] of DOOR_KEYS) if (r.test(n)) return k;
  return null;
}

import * as THREE from 'three';
import { PHI, TOWN_Y } from '../layout.js';
import { gradientMap } from '../style.js';
import { DetailGrid } from '../decor.js';
import { loadHero, driveHero, emote as emoteHero } from '../characters.js';

const CSS = `
#mgHud{position:fixed;inset:0;z-index:30;pointer-events:none;font:600 13px/1.4 system-ui,sans-serif;color:#fff;--g:8px;--G:13px}
#mgHud>*{pointer-events:auto}
#mgHud .mg-top{position:absolute;left:50%;top:max(var(--g),env(safe-area-inset-top));transform:translateX(-50%);display:flex;gap:var(--g);align-items:center;
  padding:var(--g) var(--G);border-radius:21px;background:#1b1626c4;box-shadow:0 5px 21px #0005;white-space:nowrap;max-width:calc(100vw - 16px)}
#mgHud .mg-name{font-weight:800;overflow:hidden;text-overflow:ellipsis;max-width:34vw}
#mgHud .mg-chip{padding:3px var(--g);border-radius:13px;background:#ffffff1f;font:800 13px system-ui;font-variant-numeric:tabular-nums}
#mgHud .mg-chip b{font-size:16px;color:#ffd36e}
#mgHud .mg-x{border:0;border-radius:13px;padding:var(--g) var(--G);background:#e0564a;color:#fff;font:800 13px system-ui;cursor:pointer}
#mgHud .mg-msg{position:absolute;left:50%;top:calc(max(var(--g),env(safe-area-inset-top)) + 55px);transform:translateX(-50%);max-width:min(92vw,520px);text-align:center;
  padding:var(--g) var(--G);border-radius:13px;background:#fff6dfee;color:#3b2a1e;font:600 15px/1.45 system-ui;box-shadow:0 5px 21px #0004;opacity:0;transition:opacity .3s;pointer-events:none}
#mgHud .mg-bar{position:absolute;left:8px;right:8px;bottom:max(13px,env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;justify-content:safe center;gap:var(--g);pointer-events:none}#mgHud .mg-bar>*{pointer-events:auto}
#mgHud .mg-bar button,#mgHud .mg-card button{min-width:44px;min-height:44px;padding:var(--g) var(--G);border-radius:13px;border:2px solid #fff8;background:#1b1626d0;color:#fff;font:800 15px system-ui;cursor:pointer;touch-action:manipulation}
#mgHud .mg-bar button.on,#mgHud .mg-card button.pri{background:#f0a23a;color:#2a1a0a;border-color:#fff}
#mgHud .mg-bar button.sm{min-width:40px;padding:6px 8px;font-size:14px}
#mgHud .mg-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88vw,377px);padding:21px;border-radius:21px;background:#fff6df;color:#3b2a1e;
  border:4px solid #7a5a2e;text-align:center;box-shadow:0 8px 34px #0008}
#mgHud .mg-card h3{margin:0 0 8px;font:900 21px system-ui}#mgHud .mg-card .big{font:900 34px system-ui;color:#c0662a;margin:8px 0}
#mgHud .mg-card p{margin:8px 0 13px;font:600 15px/1.5 system-ui}#mgHud .mg-card button{background:#efe3cc;color:#3b2a1e;border-color:#7a5a2e;margin:0 4px}
@media (max-height:500px){#mgHud .mg-bar{flex-wrap:nowrap;overflow-x:auto;bottom:max(8px,env(safe-area-inset-bottom));gap:5px}#mgHud .mg-bar button{min-height:40px;padding:5px 8px;font-size:13px;flex:none}#mgHud .mg-bar button.sm{min-width:36px;padding:5px}}
body.mg-on #hud,body.mg-on #info,body.mg-on #school,body.mg-on #bMap,body.mg-on #brightBox{display:none!important}`;

export function createMiniGameHost(ctx) {
  ctx.miniGames = ctx.miniGames || {};
  const { scene, camera, renderer } = ctx, el = renderer.domElement;
  { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
  const hudEl = document.createElement('div'); hudEl.id = 'mgHud'; hudEl.hidden = true;
  hudEl.innerHTML = '<div class="mg-top"><span class="mg-name"></span><span class="mg-chip mg-score" hidden>⭐ <b>0</b></span><span class="mg-chip mg-info" hidden></span><span class="mg-chip mg-time" hidden>⏱ <b>0:00</b></span><span class="mg-chip mg-best" hidden></span><button class="mg-x">✕ Thoát</button></div><div class="mg-msg"></div><div class="mg-bar"></div><div class="mg-card" hidden></div>';
  document.body.appendChild(hudEl);
  const $ = s => hudEl.querySelector(s);
  $('.mg-x').onclick = () => host.exit();
  const matCache = new Map();
  const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); if (!matCache.has(k)) { const m = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap }, o)); m.userData.shared = true; matCache.set(k, m); } return matCache.get(k); };

  const host = { active: null, key: null };
  const G0 = k => ((ctx.miniGames[k] && ctx.miniGames[k].name) || k).replace(/^\P{L}+/u, '');
  let S = null;   // trạng thái phiên chơi hiện tại

  // ---------- Tìm chỗ đặt khu chơi: đất phẳng, không đè nhà/cây, xoắn ốc theo góc vàng (2π/φ²) quanh cửa ----------
  const groundAt = (x, z) => Math.max(ctx.terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 99) : -99);
  function freeAt(x, z, R) {
    const y0 = groundAt(x, z); if (y0 < TOWN_Y - 0.6) return false;
    for (let k = 0; k < 13; k++) { const a = k * 2 * Math.PI / 13, y = groundAt(x + Math.cos(a) * R, z + Math.sin(a) * R); if (Math.abs(y - y0) > 0.45) return false; }
    for (const b of ctx.boxes || []) { if (b.top < y0 + 0.4) continue; const dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.z0 - z, 0, z - b.z1); if (dx * dx + dz * dz < R * R) return false; }
    for (const c of ctx.colliders || []) { const dx = c.x - x, dz = c.z - z, r = R + (c.r || 0.5); if (dx * dx + dz * dz < r * r) return false; }
    // mái nhà, cây, đồ trang trí (không có trong danh sách va chạm): chiếu tia từ trên xuống ở 21 điểm (xoắn ốc góc vàng)
    if (!rayObjs) {   // chỉ lấy vật ở gần cửa (≤ 89 m) cho nhẹ
      rayObjs = []; tallInst = []; const sp = new THREE.Sphere(), m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
      scene.traverse(o => { if (!(o.isMesh || o.isInstancedMesh) || o.isSkinnedMesh || !o.visible || !o.geometry) return;
        if (o.material && o.material.isShaderMaterial) return;   // lớp cỏ (shader phủ cả vùng, bán kính ~100 m) không phải vật cản
        if (o.isInstancedMesh && o.count > 377) {   /* nhiều bản sao: chỉ lấy bản cao (cây) làm vòng tròn chắn, bỏ cỏ thấp */ if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; if (bb.max.y - bb.min.y < 1.2) return;
          for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.premultiply(o.matrixWorld); v3.setFromMatrixPosition(m4); if (Math.hypot(v3.x - x, v3.z - z) < 89 + R) tallInst.push([v3.x, v3.z, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.5 * m4.getMaxScaleOnAxis()]); } return; }   /* cỏ (rất nhiều bản sao, thấp): bỏ qua */ if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); sp.copy(o.boundingSphere); } else { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); sp.copy(o.geometry.boundingSphere); } sp.applyMatrix4(o.matrixWorld); if (Math.hypot(sp.center.x - x, sp.center.z - z) < sp.radius + 89) rayObjs.push(o); });
    }
    for (const c of tallInst) { const dx = c[0] - x, dz = c[1] - z, r = R + c[2]; if (dx * dx + dz * dz < r * r) return false; }   // cây trồng bằng instancing (cọ, thông…)
    for (let k = 0; k < 55; k++) {   // 55 tia (Fibonacci) phủ tới 1,15 R (khu chơi vuông có góc vượt ra ngoài R); dày để không lọt thân cây/tre mảnh
      const r = R * 1.15 * Math.sqrt((k + 0.5) / 55), a = k * 2 * Math.PI / (PHI * PHI); _o.set(x + Math.cos(a) * r, y0 + 21, z + Math.sin(a) * r); _rc.set(_o, _dn); _rc.far = 20.5;
      const h = _rc.intersectObjects(rayObjs, false); if (h.length && h[0].point.y > y0 + 0.35) return false;
    }
    // vật mảnh trong khối gộp của thị trấn (cột đèn, khung thành… tia dễ lọt): lưới 4 m các đỉnh hình → có đỉnh cao 0,35–8 m trong vòng chơi là loại
    if (!tallPts) { tallPts = new Map(); const v = new THREE.Vector3();
      for (const o of rayObjs) { const p = !o.isInstancedMesh && o.geometry.attributes.position; if (!p || p.count > 300000) continue;
        for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); const k = Math.floor(v.x / 4) * 4096 + Math.floor(v.z / 4); let a = tallPts.get(k); if (!a) tallPts.set(k, a = []); a.push(v.x, v.y, v.z); } } }
    const RV = R * 1.3, R2 = RV * RV;   // khu chơi vuông: góc bàn vượt bán kính
    for (let gx = Math.floor((x - RV) / 4); gx <= Math.floor((x + RV) / 4); gx++) for (let gz = Math.floor((z - RV) / 4); gz <= Math.floor((z + RV) / 4); gz++) {
      const a = tallPts.get(gx * 4096 + gz); if (!a) continue;
      for (let i = 0; i < a.length; i += 3) { const dx = a[i] - x, dz = a[i + 2] - z, y = a[i + 1]; if (y > y0 + 0.35 && y < y0 + 8 && dx * dx + dz * dz < R2) return false; }
    }
    return true;
  }
  let rayObjs = null, tallInst = [], tallPts = null; const _rc = new THREE.Raycaster(), _o = new THREE.Vector3(), _dn = new THREE.Vector3(0, -1, 0);
  function findSpot(x0, z0, R) {
    rayObjs = null; tallPts = null;
    const GA = 2 * Math.PI / (PHI * PHI);
    for (let i = 0; i < 610; i++) { const r = R * 0.6 + Math.sqrt(i) * 2.2, a = i * GA, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r; if (freeAt(x, z, R)) return [x, z]; }
    for (let i = 0; i < 377; i++) { const r = Math.sqrt(i) * 1.6, a = i * GA, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r; if (freeAt(x, z, R * 0.618)) return [x, z]; }
    return [x0, z0];
  }
  const spotCache = new Map();
  // Khu chơi hình chữ nhật dài (đường đua runner.js): rect = [nửa rộng, z gần, z xa] theo toạ độ cục bộ (+z hướng camera).
  // Tìm hành lang đất (không có nhà; cây/vật nhỏ sẽ được ẩn) mà mặt đất không cao hơn mặt đường và thấp hơn ≤ 2,6 m (đường đắp nền).
  // Trả [x, z, yaw, y] hoặc null (game tự lùi về cầu cạn).
  function findRect(x0, z0, [hw, zn, zf]) {
    const big = [], sp = new THREE.Sphere();   // vật lớn (nhà, mái, cầu) trong 233 m: không ẩn được → phải né; vật nhỏ, cây sẽ ẩn khi chơi
    scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || !o.geometry || (o.material && o.material.isShaderMaterial) || (o.parent && o.parent.name === 'detail-cell')) return;   // ô chi tiết gộp (decor.js) tắt cả ô khi chơi → không phải vật cản
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (o.name !== 'ground' && sp.radius >= 5 && sp.radius < 89 && Math.hypot(sp.center.x - x0, sp.center.z - z0) < sp.radius + 233) big.push(o); });
    const GA = 2 * Math.PI / (PHI * PHI), pts = [];
    for (let lz = zf; lz <= zn + 0.1; lz += (zn - zf) / 21) for (let k = 0; k <= 4; k++) pts.push([(k / 2 - 1) * hw, lz]);
    for (let i = 0; i < 233; i++) {
      const r = 8 + Math.sqrt(i) * 5.5, a = i * GA, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;
      for (let j = 0; j < 8; j++) {
        const yaw = a + j * Math.PI / 4, c = Math.cos(yaw), sn = Math.sin(yaw), W = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
        let y0 = -99, lo = 99, ok = true;
        for (const [lx, lz] of pts) { const [wx, wz] = W(lx, lz), h = groundAt(wx, wz); if (h > y0) y0 = h; if (h < lo) lo = h; if (y0 - lo > 2.6 || h < TOWN_Y - 3) { ok = false; break; } }
        if (!ok) continue;
        for (const b of ctx.boxes || []) { if (b.top < y0 + 0.4) continue; for (const [lx, lz] of pts) { const [wx, wz] = W(lx, lz); if (wx > b.x0 - 1 && wx < b.x1 + 1 && wz > b.z0 - 1 && wz < b.z1 + 1) { ok = false; break; } } if (!ok) break; }
        if (!ok) continue;
        for (const [lx, lz] of pts) { const [wx, wz] = W(lx, lz); _o.set(wx, y0 + 21, wz); _rc.set(_o, _dn); _rc.far = 20.5; const h = _rc.intersectObjects(big, false); if (h.length && h[0].point.y > y0 + 0.35) { ok = false; break; } }
        if (ok) return [x, z, yaw % (2 * Math.PI), y0];
      }
    }
    return null;
  }


  // ---------- Nhân vật (người chơi + NPC) ----------
  function makeActor(root, getHero, isPlayer) {
    const st = {}, A = { pos: new THREE.Vector3(), yaw: 0, model: root, target: null, speed: 0, sitting: false, _st: st, bubble: null, bt: 0 };
    Object.defineProperty(A, 'hero', { get: getHero });
    A.place = (x, z, yaw) => { A.pos.set(x, 0, z); if (yaw != null) A.yaw = yaw; A.target = null; A.speed = 0; if (A._res) { A._res(); A._res = null; } };
    A.face = (x, z) => { A.faceTo = Math.atan2(x - A.pos.x, z - A.pos.z); };
    A.walkTo = (x, z, o = {}) => new Promise(res => { if (A._res) A._res(); A.target = new THREE.Vector3(x, 0, z); A.maxSpeed = o.speed || 0; A._res = res; A.sitting = false; });
    A.emote = name => { const h = getHero(); if (h) emoteHero(h, st, name); };
    A.sit = s => { A.sitting = s; };
    A.say = (text, ms = 2600) => {
      if (!A.bubble) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; A.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, depthTest: false, transparent: true })); A.bubble.renderOrder = 9; A.bubble.scale.set(3.2, 0.8, 1); S.api.root.add(A.bubble); }
      const c = A.bubble.material.map.image, k = c.getContext('2d'); k.clearRect(0, 0, 512, 128); k.font = 'bold 40px system-ui'; const w = Math.min(500, k.measureText(text).width + 48);
      k.fillStyle = '#fffdf5'; k.strokeStyle = '#3b2a1e'; k.lineWidth = 5; k.beginPath(); k.roundRect((512 - w) / 2, 10, w, 92, 34); k.fill(); k.stroke();
      k.fillStyle = '#3b2a1e'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 57, 470); A.bubble.material.map.needsUpdate = true; A.bubble.visible = true; A.bt = ms / 1000;
    };
    A.update = dt => {
      let spd = 0;
      if (A.target) {
        const dx = A.target.x - A.pos.x, dz = A.target.z - A.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.05) { A.pos.x = A.target.x; A.pos.z = A.target.z; A.target = null; if (A._res) { const r = A._res; A._res = null; r(); } }
        else { spd = A.maxSpeed || Math.min(4.2, Math.max(1.6, d * PHI)); const s = Math.min(d, spd * dt); A.pos.x += dx / d * s; A.pos.z += dz / d * s; A.faceTo = Math.atan2(dx, dz); }
      }
      if (A.faceTo != null) { let df = A.faceTo - A.yaw; df = Math.atan2(Math.sin(df), Math.cos(df)); A.yaw += df * (1 - Math.exp(-dt * PHI ** 4)); }
      A.speed += (spd - A.speed) * (1 - Math.exp(-dt * 8));
      root.position.set(A.pos.x, A.pos.y, A.pos.z); root.rotation.set(0, A.yaw, 0);
      const h = getHero();
      if (h) { if (isPlayer) { h.model.position.set(0, 0, 0); h.model.rotation.set(0, 0, 0); } driveHero(h, { speed: A.speed, grounded: true, walk: 5.5, oneShot: st.oneShot, sitting: A.sitting }); h.anim.update(dt); }
      if (A.bubble && A.bt > 0) { A.bt -= dt; A.bubble.position.set(A.pos.x, A.pos.y + (h ? h.height : 1.4) + 0.8, A.pos.z); A.bubble.material.opacity = Math.min(1, A.bt * 3); if (A.bt <= 0) A.bubble.visible = false; }
    };
    return A;
  }

  // ---------- Bộ công cụ cho game ----------
  function makeApi(key, door, anchor, inPlace) {
    const root = new THREE.Group(); root.position.set(anchor[0], anchor[3], anchor[1]); root.rotation.y = anchor[2]; scene.add(root);
    const api = { key, door, root, anchor, orbit: false, cam: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0.75, dist: 21, ...(S && S.lastCam || {}) }, mat, actors: [], listeners: [] };
    api.groundY = () => anchor[3];
    api.sfx = n => ctx.sfx && ctx.sfx(n);
    api.on = (t, type, fn, o) => { t.addEventListener(type, fn, o); api.listeners.push([t, type, fn, o]); };
    const rc = new THREE.Raycaster(), v2 = new THREE.Vector2();
    api.ray = e => { const r = el.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); rc.setFromCamera(v2, camera); return rc; };
    api.pick = (e, objs) => api.ray(e).intersectObjects(objs, true)[0] || null;
    api.toLocal = v => root.worldToLocal(v.clone());
    // HUD
    const chip = (sel, v) => { const c = $(sel); c.hidden = v == null; if (v != null) c.querySelector('b').textContent = v; };
    let msgT = 0;
    api.hud = {
      bar: $('.mg-bar'),
      score: v => chip('.mg-score', v),
      time: s => chip('.mg-time', s == null ? null : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`),
      msg: (html, ms = 3000) => { const m = $('.mg-msg'); m.innerHTML = html; m.style.opacity = html ? 1 : 0; clearTimeout(msgT); if (html && ms > 0) msgT = setTimeout(() => m.style.opacity = 0, ms); },
      button: (label, fn, cls = '') => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = label; if (cls) b.className = cls; b.onclick = e => { e.stopPropagation(); ctx.audio && ctx.audio.start && ctx.audio.start(); fn(b); }; $('.mg-bar').appendChild(b); return b; },
      clearBar: () => { $('.mg-bar').innerHTML = ''; },
      title: t => { $('.mg-name').textContent = t; },   // đổi tên trên thanh host (vd môn đang thi)
      info: html => { const c = $('.mg-info'); c.hidden = !html; c.innerHTML = html || ''; },   // chip tự do (điểm dạng chữ của game có HUD riêng)
    };
    // game tự đặt camera (sân khấu riêng: stage.js, kit.js): cam là PerspectiveCamera KHÔNG gắn cha, toạ độ hiểu là cục bộ của frame (mặc định root)
    api.useCamera = (cam, frame = root) => { api.camSrc = cam; api.camFrame = frame; };
    api.hidePlayer = () => { ctx.player.root.visible = false; };   // game có nhân vật riêng → ẩn nhân vật của host
    // kỷ lục
    const BK = 'mg.best.' + key;
    api.best = () => { try { const v = localStorage.getItem(BK); return v == null ? null : +v; } catch (e) { return null; } };
    api.saveBest = (score, lowerBetter) => { const b = api.best(); const better = b == null || (lowerBetter ? score < b : score > b); if (better) try { localStorage.setItem(BK, score); } catch (e) {} showBest(lowerBetter); return better; };
    const fmt = (v, lb) => lb ? `${Math.floor(v / 60)}:${(v % 60).toFixed(1).padStart(4, '0')}` : v;
    const showBest = lb => { const b = api.best(), c = $('.mg-best'); c.hidden = b == null; if (b != null) c.innerHTML = '🏆 ' + fmt(b, lb); };
    api.showBest = showBest;
    api.end = ({ score, title = 'Hoàn thành!', text = '', lowerBetter = false, save = true }) => {
      const nb = save && score != null ? api.saveBest(score, lowerBetter) : false, b = api.best(), card = $('.mg-card');
      card.innerHTML = `<h3>${title}</h3>${score != null ? `<div class="big">${fmt(score, lowerBetter)}</div>` : ''}<p>${text}${nb ? '<br>🎉 <b>Kỷ lục mới!</b>' : b != null ? `<br>🏆 Kỷ lục: <b>${fmt(b, lowerBetter)}</b>` : ''}</p>`;
      const again = document.createElement('button'); again.className = 'pri'; again.textContent = '🔁 Chơi lại'; again.onclick = () => host.restart();
      const out = document.createElement('button'); out.textContent = '✕ Thoát'; out.onclick = () => host.exit();
      card.append(again, out); card.hidden = false; ctx.sfx && ctx.sfx(nb ? 'win' : 'open');
      if (ctx.reward && !S.rewarded) { S.rewarded = true; ctx.reward(nb ? 2 : 1, `Chơi ${G0(key)}${nb ? ' · kỷ lục mới' : ''}`); card.querySelector('p').insertAdjacentHTML('beforeend', `<br>⭐ +${nb ? 2 : 1} sao · ghi vào 📒 Sổ học tập`); }   // thưởng sao thay tiền, 1 lần mỗi lượt vào
    };
    api.restart = () => host.restart(); api.exit = () => host.exit();
    // nhân vật
    const pr = ctx.player.root;
    S.prRoot = inPlace ? null : { parent: pr.parent, pos: pr.position.clone(), rot: pr.rotation.y };
    if (!inPlace) root.add(pr);
    api.me = makeActor(pr, () => ctx.player.hero, true); api.actors.push(api.me);
    api.actor = async (kind, o = {}) => {
      const h = await loadHero(kind, o.height || 1.25, o.look || null); if (!h || S.api !== api) return null;
      h.npc = true; const g = new THREE.Group(); g.add(h.model); root.add(g); const A = makeActor(g, () => h, false); A.name = o.name; api.actors.push(A); return A;
    };
    return api;
  }

  // ---------- Vào / ra ----------
  function begin(key, door, opts = {}) {
    const G = ctx.miniGames[key]; if (!G) return false;
    if (host.active) host.exit(true);
    const P = ctx.player, R = G.radius || 13, dx = door ? door.x : P.pos.x, dz = door ? door.z : P.pos.z;
    let sp = G.inPlace ? [P.pos.x, P.pos.z, 0] : spotCache.get(key + ':' + Math.round(dx) + ':' + Math.round(dz));   // inPlace: game tự dùng thế giới quanh nhân vật (câu cá)
    if (!sp) { sp = (G.spot && G.spot(ctx, door)) || (G.rect && findRect(dx, dz, G.rect)) || null; if (!sp) { const [x, z] = findSpot(dx, dz, R); sp = [x, z, Math.atan2(dx - x, dz - z)]; } spotCache.set(key + ':' + Math.round(dx) + ':' + Math.round(dz), sp); }
    const anchor = [sp[0], sp[1], sp[2] || 0, G.inPlace ? P.pos.y : sp[3] != null ? sp[3] : groundAt(sp[0], sp[1])];
    S = S && S.restarting ? S : { saved: { pos: P.pos.clone(), yaw: P.cam.yaw, pitch: P.cam.pitch, far: camera.far, fov: camera.fov, rot: P.rot }, cam0: { p: camera.position.clone(), q: camera.quaternion.clone() }, blend: 0 };
    S.restarting = false; S.key = key; S.door = door; S.anchorR = R; S.inPlace = !!G.inPlace; S.zone = G.rect && sp[3] != null ? G.rect : null;
    const api = S.api = makeApi(key, door, anchor, !!G.inPlace); api.camFree = !!G.inPlace; api.onGround = !!S.zone;   // onGround: game dài (đường đua) đặt sát đất trong hành lang trống   // camFree: game tự điều khiển camera thế giới
    api.hud.clearBar(); $('.mg-card').hidden = true; api.hud.msg(''); api.hud.info(''); api.hud.score(null); api.hud.time(null); api.showBest(G.lowerBetter);
    $('.mg-name').textContent = G.name || key;
    host.active = true; host.key = key; ctx.mgActive = key;
    ctx.freeCam = !G.inPlace; P.frozen = true; if (!G.inPlace) P.pos.set(anchor[0], anchor[3], anchor[1]);   // inPlace: player.update vẫn chạy (đứng yên), game đặt camera sau đó   // thế giới (cỏ, cây, người) nạp quanh khu chơi
    document.body.classList.add('mg-on', 'rs-modal'); hudEl.hidden = false; camera.far = Math.min(S.saved.far, 233);
    if (ctx.school && ctx.school.labels) for (const l of ctx.school.labels) l.visible = false;
    // vật nhỏ của thế giới lọt vào khu chơi (cột đèn, khung thành, ghế…): ẩn tạm, thoát thì hiện lại
    for (const o of S.hidden || []) o.visible = true; S.hidden = []; for (const [o, list] of S.hiddenInst || []) { for (const [i, m] of list) o.setMatrixAt(i, m); o.instanceMatrix.needsUpdate = true; } S.hiddenInst = [];
    if (!G.inPlace) { hideWorld(api, anchor, R); S.rehide = [0.6, 1.6, 2.6, 4.2, 6.8, 8.9]; S.rehideT = 0; }   // chunk thế giới nạp muộn quanh khu chơi → ẩn lại vài lần
    if (!G.inPlace) api.me.place(0, R * 0.5, Math.PI);
    natureSkip(!G.inPlace);
    try { const ex = () => host.exit(); S.game = G.start(ctx, { ...opts, key, door, api, onExit: ex, exit: ex }) || {}; }   // mọi nút Thoát của game (stage.js, kit.js) gọi về host.exit
    catch (e) { console.error('[mg] lỗi khởi động', key, e); S.game = {}; host.exit(); return false; }
    S.camNow = null; S.occD = null; return true;
  }
  function hideWorld(api, anchor, R) { const sp = new THREE.Sphere(), c = new THREE.Vector3(anchor[0], anchor[3], anchor[1]), RR = R * 1.15;
      scene.traverse(o => { if (!(o.isMesh || o.isSprite) || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || !o.geometry) return; for (let q = o; q; q = q.parent) if (q === api.root || q === ctx.player.root) return;   // + nhãn chữ (Sprite) của thế giới
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
        if ((sp.radius < 5 ? inZone(sp.center.x, sp.center.z, sp.radius * 0.5, 1.15) : sp.radius < 13 && inZone(sp.center.x, sp.center.z, 0, S.zone ? 1 : 0.9)) && sp.center.y < c.y + 8 && sp.center.y > c.y - 3) { o.visible = false; S.hidden.push(o); } });   // vật lớn (cây to, cột đèn cao) có tâm trong khu chơi cũng ẩn
      // cây, tre, bụi trồng bằng instancing trong khu chơi: thu nhỏ về 0 tạm thời, thoát thì trả lại ma trận cũ
      const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
      scene.traverse(o => { if (!o.isInstancedMesh || !o.visible) return; for (let q = o; q; q = q.parent) if (q === api.root || q === ctx.player.root) return;
        const saved = []; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); if (m4.elements[0] === 0 && m4.elements[5] === 0) continue; v3.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); if (inZone(v3.x, v3.z, 1, 1.15) && v3.y < c.y + 8 && v3.y > c.y - 3) { saved.push([i, m4.clone()]); o.setMatrixAt(i, Z); } }
        if (saved.length) { o.instanceMatrix.needsUpdate = true; S.hiddenInst.push([o, saved]); } }); }
  function teardown() {
    if (!S || !S.api) return;
    const api = S.api;
    try { S.game && S.game.dispose && S.game.dispose(); } catch (e) { console.warn(e); }
    for (const [t, type, fn, o] of api.listeners) t.removeEventListener(type, fn, o);
    const pr = ctx.player.root; pr.visible = true; if (S.prRoot) { (S.prRoot.parent || scene).add(pr); pr.position.copy(S.prRoot.pos); pr.rotation.y = S.prRoot.rot; }
    scene.remove(api.root);
    api.root.traverse(o => {
      if (o.isSkinnedMesh) {   // nhân vật dùng chung geometry (cache) → không dispose; nhưng xương (bone texture) + vật liệu chi tiết là riêng từng NPC
        if (o.skeleton && !o.skeleton.__gone) { o.skeleton.__gone = true; o.skeleton.dispose(); }
        if (o.material && !o.userData.outline && !o.material.userData.shared && o.material.userData.blink) o.material.dispose(); return; }
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) { if (m.userData && m.userData.shared) continue; if (m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); }
    });
    S.lastCam = { ...api.cam }; S.api = null; S.game = null;
  }
  host.findSpot = findSpot;
  host.doorOf = key => ctx.school && ctx.school.doors && ctx.school.doors.find(q => doorKey(ctx, q.d) === key) || null;   // cửa đầu tiên mở game này
  Object.defineProperty(host, 'api', { get: () => S && S.api });   // (kiểm thử) bộ công cụ của phiên đang chơi   // game tự chọn chỗ (vd cờ vua cạnh công viên cờ)
  host.start = (key, door, opts) => begin(key, door, opts);
  host.skipFly = () => { if (S) { S.blend = 1; S.rehideT = 99; } };   // (kiểm thử) bỏ đoạn camera bay vào
  host.restart = () => { if (!S || !S.api) return; const { key, door } = S; teardown(); S.restarting = true; begin(key, door); };
  host.exit = (silent) => {
    if (!S || !S.api) return;
    teardown();
    for (const o of S.hidden || []) o.visible = true;
    for (const [o, list] of S.hiddenInst || []) { for (const [i, m] of list) o.setMatrixAt(i, m); o.instanceMatrix.needsUpdate = true; }
    const P = ctx.player; P.pos.copy(S.saved.pos); P.cam.yaw = S.saved.yaw; P.cam.pitch = S.saved.pitch; P.frozen = false; ctx.freeCam = false;
    if (S.saved.rot != null && P.setRot) P.setRot(S.saved.rot);
    camera.far = S.saved.far; camera.fov = S.saved.fov; camera.updateProjectionMatrix();
    hudEl.hidden = true; document.body.classList.remove('mg-on', 'rs-modal'); $('.mg-msg').style.opacity = 0;
    host.active = null; host.key = null; ctx.mgActive = null; S = null; natureSkip(false);
    if (!silent) ctx.toast && ctx.toast('👋 Đã rời khu chơi');
  };
  // người đi lại trong thị trấn: ẩn khi lọt vào khu chơi
  // điểm (x, z) thế giới nằm trong khu chơi (vòng tròn bán kính R·k, hoặc hình chữ nhật của đường đua) + lề pad
  function inZone(x, z, pad, k = 1) { const a = S.api.anchor, dx = x - a[0], dz = z - a[1]; if (!S.zone) { const r = S.anchorR * k + pad; return dx * dx + dz * dz < r * r; }
    const c = Math.cos(a[2]), s = Math.sin(a[2]), lx = dx * c - dz * s, lz = dx * s + dz * c, Z = S.zone; return Math.abs(lx) < Z[0] + pad && lz < Z[1] + pad && lz > Z[2] - pad; }
  ctx.mgHide = (x, z, pad = 0) => !!(S && S.api && !S.inPlace && inZone(x, z, 2 + pad));
  const natureSkip = on => { DetailGrid.skip = on ? ctx.mgHide : null; const N = ctx.terrain && ctx.terrain.nature; if (!N || !N.relayout) return; N.skip = on ? ctx.mgHide : null; N.relayout(); };   // + ô chi tiết gộp (gỗ, đá, gốc cây — decor.js)   // cây/cỏ/hoa của terrain (tự xếp lại khi người chơi đi) né khu chơi

  // ---------- Chạm / chuột: game "giữ" ngón tay, hoặc vuốt xoay camera, hoặc chạm nhẹ ----------
  const ptr = new Map();
  el.addEventListener('pointerdown', e => {
    if (!S || !S.game || !$('.mg-card').hidden) return;
    const own = S.game.down ? !!S.game.down(e) : false;
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, own, moved: false });
  });
  addEventListener('pointermove', e => {
    const p = ptr.get(e.pointerId); if (!p || !S || !S.game) return;
    if (p.own) { S.game.move && S.game.move(e); return; }
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 8) p.moved = true;
    if (p.moved && S.api.orbit && ptr.size === 1) { const c = S.api.cam; c.yaw -= (e.clientX - p.x) * 0.006; c.pitch = Math.max(0.2, Math.min(1.45, c.pitch + (e.clientY - p.y) * 0.004)); }
    p.x = e.clientX; p.y = e.clientY;
  });
  const up = e => {
    const p = ptr.get(e.pointerId); if (!p) return; ptr.delete(e.pointerId); if (!S || !S.game) return;
    if (p.own) { S.game.up && S.game.up(e); return; }
    if (!p.moved && e.type === 'pointerup') S.game.tap && S.game.tap(e);
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { if (S && S.api && S.api.orbit) S.api.cam.dist = Math.max(5, Math.min(55, S.api.cam.dist * (1 + e.deltaY * 0.001))); }, { passive: true });
  addEventListener('keydown', e => {
    if (!S || !S.api) return;
    if (e.code === 'Escape') { e.preventDefault(); host.exit(); return; }
    S.game && S.game.key && S.game.key(e);
  });

  // ---------- Camera: bay mượt từ góc nhìn cũ vào khu chơi (≈ φ giây), sau đó bám mục tiêu bằng lò xo ----------
  const _t = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);
  const _s = new THREE.Vector3();
  function camUpdate(dt) {
    if (S.api.camFree) return;
    if (S.api.camSrc) {   // camera riêng của game (cục bộ theo camFrame) → đổi sang toạ độ thế giới
      const src = S.api.camSrc; src.updateMatrix(); S.api.camFrame.updateMatrixWorld(); _m.multiplyMatrices(S.api.camFrame.matrixWorld, src.matrix); _m.decompose(_p, _q, _s);
      if (camera.fov !== src.fov) { camera.fov = src.fov; camera.updateProjectionMatrix(); }
    } else camPose(dt);
    if (S.blend < 1) { S.blend = Math.min(1, S.blend + dt / PHI); const e = S.blend * S.blend * (3 - 2 * S.blend); camera.position.lerpVectors(S.cam0.p, _p, e); camera.quaternion.slerpQuaternions(S.cam0.q, _q, e); }
    else { camera.position.copy(_p); camera.quaternion.copy(_q); }
    camera.updateMatrixWorld();
  }
  function camPose(dt) {
    const c = S.api.cam, k = 1 - Math.exp(-dt * PHI ** 3);
    if (!S.camNow) S.camNow = { ...c };
    const n = S.camNow; for (const f of ['x', 'y', 'z', 'pitch', 'dist']) n[f] += (c[f] - n[f]) * k;
    let dy = c.yaw - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); n.yaw += dy * k;
    const ry = S.api.root.rotation.y + n.yaw, cp = Math.cos(n.pitch);
    _t.set(n.x, n.y, n.z); S.api.root.localToWorld(_t);
    _p.set(_t.x + Math.sin(ry) * cp * n.dist, _t.y + Math.sin(n.pitch) * n.dist, _t.z + Math.cos(ry) * cp * n.dist);
    // cây/nhà/vòm của thế giới chắn giữa khu chơi và camera → kéo camera vào trước vật cản (co nhanh, giãn chậm), đồ của game không tính
    const want = Math.max(Math.min(n.dist, ctx.camOcc ? ctx.camOcc.clear(_t, _p, S.api.root) - 1 / PHI ** 2 : n.dist), Math.min(n.dist, 3));
    S.occD = S.occD == null ? want : S.occD + (want - S.occD) * (1 - Math.exp(-dt * (want < S.occD ? PHI ** 5 : PHI ** 2)));
    if (S.occD < n.dist - 1e-3) _p.sub(_t).multiplyScalar(S.occD / n.dist).add(_t);
    _m.lookAt(_p, _t, _up); _q.setFromRotationMatrix(_m);
  }

  host.update = (dt, t) => {
    if (!S || !S.api) return;
    const api = S.api;
    for (const a of api.actors) a.update(dt);
    if (S.rehide && S.rehide.length) { S.rehideT = (S.rehideT || 0) + dt; if (S.rehideT > S.rehide[0]) { S.rehide.shift(); hideWorld(api, api.anchor, S.anchorR); } }
    try { S.game && S.game.update && S.game.update(dt, t); } catch (e) { console.error('[mg]', e); host.exit(); return; }
    if (S && S.api) camUpdate(dt);
  };
  // gỡ lỗi: ?mg=chess mở thẳng game (sau khi trường nạp xong)
  const want = new URLSearchParams(location.search).get('mg');
  if (want) { const iv = setInterval(() => { if (ctx.school && ctx.school.ready && ctx.player.hero) { clearInterval(iv); const q = ctx.school.doors.find(q => doorKey(ctx, q.d) === want); host.start(want, q || null); } }, 500); }
  return host;
}
