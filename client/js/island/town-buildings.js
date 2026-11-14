// town-buildings.js — KIẾN TRÚC THỊ TRẤN TRƯỜNG RUBIK (low-poly toon, thay cho greybox).
// Chỉ lo phần NHÌN: lớp học, hội trường, văn phòng, cổng, cột cờ, ghế đá, nhà ở, phố Đà Lạt, sân bóng, cờ khổng lồ,
// tượng đài Rubik, hồ/đầm sen, nông trại, cây. Va chạm tường/nhà vẫn do school-town.js đẩy vào ctx.boxes như cũ.
// Tối ưu: mọi khối dùng chung 1 vật liệu toon tô màu theo đỉnh, gộp (merge) theo khu → vài draw call;
//         cây, hoa, lá sen dùng InstancedMesh; chữ bảng tên gom vào 1 tấm atlas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, addOutline, outlineMat, gradientMap } from './style.js';

const _o = new THREE.Object3D(), _m = new THREE.Matrix4(), _c = new THREE.Color();
const RUBIK_COL = ['#e8392f', '#2f9e44', '#2b63d9', '#f5c518', '#ff8a1f', '#ffffff'];

// ---------- Gom khối có màu đỉnh, gộp thành 1 mesh ----------
class Batch {
  constructor(name) { this.name = name; this.geos = []; this.pre = null; this.tris = 0; }
  push(g, col, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz, 'YXZ'); _o.scale.set(sx, sy, sz); _o.updateMatrix();
    _m.copy(_o.matrix); if (this.pre) _m.premultiply(this.pre); g.applyMatrix4(_m); g.computeVertexNormals();
    _c.set(col); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); this.geos.push(g); this.tris += n / 3; return this;
  }
  // khối hộp: y0 = đáy
  box(w, h, d, x, y0, z, col, ry = 0, rx = 0, rz = 0) { return this.push(new THREE.BoxGeometry(w, h, d), col, x, y0 + h / 2, z, ry, rx, rz); }
  cyl(rt, rb, h, x, y0, z, col, seg = 8, ry = 0, rx = 0, rz = 0) { return this.push(new THREE.CylinderGeometry(rt, rb, h, seg), col, x, y0 + h / 2, z, ry, rx, rz); }
  cone(r, h, x, y0, z, col, seg = 6, ry = 0) { return this.push(new THREE.ConeGeometry(r, h, seg), col, x, y0 + h / 2, z, ry); }
  ball(r, x, y, z, col, sx = 1, sy = 1, sz = 1) { return this.push(new THREE.IcosahedronGeometry(r, 0), col, x, y, z, 0, 0, 0, sx, sy, sz); }
  plane(w, h, x, y, z, col, ry = 0, rx = 0) { return this.push(new THREE.PlaneGeometry(w, h), col, x, y, z, ry, rx); }
  // mái 2 mái (đỉnh chạy dọc trục x), đáy ở y0
  prism(w, h, d, x, y0, z, col, ry = 0) { return this.push(prismGeo(w, h, d), col, x, y0, z, ry); }
  // mái 4 mái (chóp cụt nhọn), đáy w×d
  hip(w, h, d, x, y0, z, col, ry = 0) { return this.push(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), col, x, y0 + h / 2, z, ry, 0, 0, w, h, d); }
  // nhóm: các lệnh trong fn dùng toạ độ cục bộ (gốc x,y,z, xoay ry; +z cục bộ = mặt tiền)
  group(x, y, z, ry, fn) {
    const old = this.pre; _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.set(1, 1, 1); _o.updateMatrix();
    this.pre = old ? old.clone().multiply(_o.matrix) : _o.matrix.clone(); fn(); this.pre = old; return this;
  }
  mesh(mat, shadow = true) {
    if (!this.geos.length) return null;
    const m = new THREE.Mesh(mergeGeometries(this.geos), mat); this.geos.length = 0;
    m.castShadow = shadow; m.receiveShadow = true; m.name = 'town-' + this.name; return m;
  }
}
function prismGeo(w, h, d) {
  const x = w / 2, z = d / 2, p = [
    -x, 0, z, -x, h, 0, -x, 0, -z, x, 0, -z, x, h, 0, x, 0, z,
    -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0,
    x, 0, -z, -x, 0, -z, -x, h, 0, x, 0, -z, -x, h, 0, x, h, 0,
    -x, 0, -z, x, 0, -z, x, 0, z, -x, 0, -z, x, 0, z, -x, 0, z];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}

// ---------- Atlas chữ (bảng tên lớp, biển hiệu, lá cờ) ----------
function makeAtlas() {
  const ROW = 128, rows = 24, c = document.createElement('canvas'); c.width = 1024; c.height = ROW * rows;
  const k = c.getContext('2d'); let used = 0; const items = [];
  const api = {
    // trả về vùng uv [u0,v0,u1,v1]
    sign(text, bg = '#1f3b63', fg = '#fff', border = '#f2c14e', w = 1024) {
      if (used >= rows) return null; const y = used++ * ROW;
      k.fillStyle = border; k.beginPath(); k.roundRect(4, y + 4, w - 8, ROW - 8, 22); k.fill();
      k.fillStyle = bg; k.beginPath(); k.roundRect(14, y + 14, w - 28, ROW - 28, 16); k.fill();
      k.fillStyle = fg; k.font = 'bold 66px system-ui, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, w / 2, y + ROW / 2 + 3, w - 60);
      return [0, 1 - (y + ROW) / c.height, w / 1024, 1 - y / c.height];
    },
    flag() { // cờ đỏ sao vàng 192×128
      if (used >= rows) return null; const y = used++ * ROW;
      k.fillStyle = '#da251d'; k.fillRect(0, y, 192, ROW); k.fillStyle = '#ffde00'; k.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 17 : 42, a = -Math.PI / 2 + i * Math.PI / 5; k.lineTo(96 + Math.cos(a) * r, y + 66 + Math.sin(a) * r); } k.fill();
      return [0, 1 - (y + ROW) / c.height, 192 / 1024, 1 - y / c.height];
    },
    add(uv, w, h, mat4) { if (!uv) return; const g = new THREE.PlaneGeometry(w, h), a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + a.getX(i) * (uv[2] - uv[0]), uv[1] + a.getY(i) * (uv[3] - uv[1])); g.applyMatrix4(mat4); items.push(g); },
    mesh() {
      if (!items.length) return null; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const m = new THREE.Mesh(mergeGeometries(items), new THREE.MeshToonMaterial({ map: tex, gradientMap, side: THREE.DoubleSide })); m.name = 'town-signs'; return m;
    },
  };
  return api;
}

// ---------- Dữ liệu phụ của bản đồ 2D (hằng số trong iframe, không nằm trong RS) ----------
function readExtra(win) {
  try { return win.eval('({LAKE, LOTUS, POND, GBOARD, RMON, FLAG, LAMPS, TREES, FOREST_TREES, TENTS, DALAT, BOOTH, CHESS_T, MUSIC_SPOTS, TRAIL, FOREST_GATES})'); } catch (e) { return {}; }
}

export function buildTownArchitecture(ctx, RS, env) {
  const { scene } = ctx, { X3, Z3, S, Y, H, T, gap } = env, R = RS.R, D = readExtra(env.win), low = !!ctx.lowEnd;
  const doors = RS.doors().map(d => [X3(d.x), Z3(d.y)]);
  const nearDoor = (x, z, r = 2.2) => doors.some(([a, b]) => Math.abs(a - x) < r && Math.abs(b - z) < r);
  const walled = Object.entries(R).filter(([, r]) => r.walls && r.w).map(([, r]) => r);
  const inRoom = (x2, y2, m = 30) => walled.some(r => x2 > r.x - m && x2 < r.x + r.w + m && y2 > r.y - m && y2 < r.y + r.h + m);
  const reg = (x2, y2) => { try { return RS.regionAt(x2, y2); } catch (e) { return 'north'; } };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const B = { school: new Batch('school'), homes: new Batch('homes'), dalat: new Batch('dalat'), parks: new Batch('parks'), farm: new Batch('farm'), ground: new Batch('ground') };
  const atlas = makeAtlas(), budget = {};
  const measure = (b, name, fn) => { const t0 = b.tris; fn(); budget[name] = Math.round(b.tris - t0); };
  // bảng chữ gắn theo nhóm cục bộ của batch b
  const signAt = (b, uv, w, h, x, y, z, ry = 0) => { _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); const m = _o.matrix.clone(); if (b.pre) m.premultiply(b.pre); atlas.add(uv, w, h, m); };
  const trees = [];   // [x, z, kiểu 'leaf'|'pine'|'phuong', tỷ lệ]

  // ================= LỚP HỌC =================
  const ROOM = {
    rubik:     { wall: '#f08a5d', trim: '#fff4e0', roof: '#c4452f', base: '#8a5a44', door: '#7a4a2a', sign: ['LỚP RUBIK', '#c4452f'] },
    chess:     { wall: '#7f9bd6', trim: '#f7f7f7', roof: '#2f3b59', base: '#3d4a6b', door: '#5a3a22', sign: ['KHU CỜ VUA', '#2f3b59'] },
    music:     { wall: '#d77fc0', trim: '#fff0fa', roof: '#6b3a8a', base: '#7a3d6b', door: '#5a3a22', sign: ['KHU ÂM NHẠC', '#6b3a8a'] },
    hall:      { wall: '#ecc76a', trim: '#fffaf0', roof: '#b5432f', base: '#8f6a35', door: '#6b3a1e', sign: ['HỘI TRƯỜNG LỚN', '#b5432f'] },
    office:    { wall: '#b4c3d6', trim: '#ffffff', roof: '#56657a', base: '#56657a', door: '#4a3a2a', sign: ['VĂN PHÒNG', '#3d4f6b'], flat: true },
    elec:      { wall: '#6cc0a8', trim: '#effff8', roof: '#2f5f6b', base: '#2f5f6b', door: '#4a3a2a', sign: ['LỚP LẮP RÁP ĐIỆN', '#2f5f6b'] },
    rubikyard: { wall: '#f2c14e', trim: '#ffffff', roof: '#e8392f', base: '#9a6a2a', door: '#7a4a2a', sign: ['KHU CHƠI RUBIK', '#d9542b'], yard: true },
  };
  const FACE = { t: Math.PI, b: 0, l: -Math.PI / 2, r: Math.PI / 2 };
  // một đoạn tường (đúng kích thước khối va chạm) + chân tường, gờ trên, cửa sổ phía ngoài
  function wallSeg(b, st, ax, az, bx, bz, ry, opts = {}) {
    const len = Math.hypot(bx - ax, bz - az); if (len < 0.2) return;
    b.group((ax + bx) / 2, Y, (az + bz) / 2, ry, () => {
      b.box(len, H, T, 0, 0, 0, st.wall);
      b.box(len + 0.02, 0.5, T + 0.1, 0, 0, 0, st.base);
      b.box(len + 0.08, 0.24, T + 0.18, 0, H - 0.24, 0, st.trim);
      if (opts.band) opts.band(len);
      if (opts.noWin) return;
      const n = Math.floor((len - 0.8) / 2.5); if (n < 1) return;
      for (let i = 0; i < n; i++) {
        const u = -len / 2 + (len - (n - 1) * 2.5) / 2 + i * 2.5;
        b.box(1.25, 1.45, 0.06, u, 1.0, T / 2 + 0.03, st.trim);
        b.plane(1.0, 1.2, u, 1.72, T / 2 + 0.065, '#3f6f9e');
        b.box(1.4, 0.08, 0.16, u, 0.94, T / 2 + 0.08, st.trim);
      }
    });
  }
  function rubikCube(b, x, y, z, s, ry = 0, tilt = false) {   // khối Rubik: lõi đen + 9 ô màu mỗi mặt (mặt phẳng → ít tam giác)
    const pre = b.pre; _o.position.set(x, y, z); _o.rotation.set(tilt ? 0.615 : 0, ry, tilt ? Math.PI / 4 : 0, 'YXZ'); _o.scale.set(1, 1, 1); _o.updateMatrix();
    b.pre = pre ? pre.clone().multiply(_o.matrix) : _o.matrix.clone();
    b.box(s, s, s, 0, -s / 2, 0, '#1b1626');
    const q = s / 3, f = s / 2 + 0.01, faces = [[0, 0, 0], [Math.PI / 2, 0, 1], [Math.PI, 0, 2], [-Math.PI / 2, 0, 3], [0, -Math.PI / 2, 4], [0, Math.PI / 2, 5]];
    for (const [fy, fx, ci] of faces) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const lu = (i - 1) * q, lv = (j - 1) * q; const p = new THREE.Vector3(lu, lv, f).applyEuler(new THREE.Euler(fx, fy, 0, 'YXZ'));
      b.plane(q * 0.86, q * 0.86, p.x, p.y, p.z, RUBIK_COL[(ci + (i * j + i) % 4 === 0 ? 0 : ci) % 6], fy, fx);
    }
    b.pre = pre;
  }
  function chessPiece(b, kind, x, z, s, col, y0 = Y) {   // quân cờ to (vòng tròn 8 cạnh)
    const dark = col === 'b', c = dark ? '#2b2633' : '#f4efe4', c2 = dark ? '#3d3747' : '#ffffff';
    b.cyl(0.55 * s, 0.62 * s, 0.25 * s, x, y0, z, c, 8);
    if (kind === 'p') { b.cyl(0.22 * s, 0.4 * s, 0.75 * s, x, y0 + 0.25 * s, z, c, 8); b.ball(0.33 * s, x, y0 + 1.25 * s, z, c2); return 1.55 * s; }
    if (kind === 'r') { b.cyl(0.4 * s, 0.45 * s, 1.1 * s, x, y0 + 0.25 * s, z, c, 8); b.cyl(0.52 * s, 0.48 * s, 0.35 * s, x, y0 + 1.35 * s, z, c2, 8); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; b.box(0.22 * s, 0.22 * s, 0.22 * s, x + Math.cos(a) * 0.38 * s, y0 + 1.7 * s, z + Math.sin(a) * 0.38 * s, c2); } return 1.9 * s; }
    if (kind === 'n') { b.cyl(0.3 * s, 0.45 * s, 0.7 * s, x, y0 + 0.25 * s, z, c, 8); b.box(0.45 * s, 0.9 * s, 0.55 * s, x, y0 + 0.9 * s, z, c, 0, -0.3); b.box(0.42 * s, 0.32 * s, 0.75 * s, x, y0 + 1.55 * s, z + 0.25 * s, c2, 0, 0.35); return 1.9 * s; }
    const tall = kind === 'k' ? 1.7 : 1.5;
    b.cyl(0.26 * s, 0.45 * s, tall * s, x, y0 + 0.25 * s, z, c, 8); b.cyl(0.42 * s, 0.3 * s, 0.25 * s, x, y0 + (0.25 + tall) * s, z, c2, 8);
    if (kind === 'k') { b.box(0.14 * s, 0.6 * s, 0.14 * s, x, y0 + (0.5 + tall) * s, z, '#f2c14e'); b.box(0.42 * s, 0.14 * s, 0.14 * s, x, y0 + (0.72 + tall) * s, z, '#f2c14e'); return (1.1 + tall) * s; }
    b.ball(0.24 * s, x, y0 + (0.65 + tall) * s, z, '#f2c14e'); return (0.9 + tall) * s;
  }
  function musicNote(b, x, y, z, s, col) {   // nốt nhạc móc đôi ♫
    for (const dx of [-0.5, 0.5]) { b.cyl(0.32 * s, 0.32 * s, 0.16 * s, x + dx * s, y, z, col, 8, 0, Math.PI / 2, 0.45); b.box(0.09 * s, 1.5 * s, 0.09 * s, x + dx * s + 0.27 * s, y, z, col); }
    b.box(1.1 * s, 0.22 * s, 0.1 * s, x + 0.27 * s, y + 1.3 * s, z, col, 0, 0, 0.18);
  }

  function classroom(id, r) {
    const st = ROOM[id] || ROOM.office, b = B.school;
    const ax = X3(r.x), az = Z3(r.y), bx = X3(r.x + r.w), bz = Z3(r.y + r.h), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const side = r.side || 'b', dx = r.dw ? X3(r.dw[0]) : cx, dz = r.dw ? Z3(r.dw[1]) : cz;
    const sides = { t: [ax, az, bx, az], b: [ax, bz, bx, bz], l: [ax, az, ax, bz], r: [bx, az, bx, bz] };
    for (const s of ['t', 'b', 'l', 'r']) {
      const [px, pz, qx, qz] = sides[s], horiz = s === 't' || s === 'b', ry = FACE[s];
      const band = id === 'chess' && s === side ? len => { b.box(len, 0.36, T + 0.06, 0, 2.62, 0, '#ffffff'); for (let u = -len / 2 + 0.18; u < len / 2 - 0.18; u += 0.72) b.box(0.36, 0.36, T + 0.08, u, 2.62, 0, '#2b2633'); }
        : id === 'music' && s === side ? len => { b.box(len, 0.42, T + 0.06, 0, 2.6, 0, '#ffffff'); for (let u = -len / 2 + 0.3; u < len / 2 - 0.2; u += 0.42) if ((Math.round(u / 0.42) % 7 + 7) % 7 % 3 !== 2) b.box(0.18, 0.26, T + 0.1, u, 2.76, 0, '#2b2633'); }
        : id === 'rubikyard' ? len => { for (let u = -len / 2 + 0.5, k = 0; u < len / 2 - 0.3; u += 1.15, k++) b.box(0.62, 0.62, 0.62, u, H, 0, RUBIK_COL[(k + s.charCodeAt(0)) % 6]); } : null;
      const opts = { band, noWin: st.yard };
      if (s !== side) wallSeg(b, st, px, pz, qx, qz, ry, opts);
      else if (horiz) { wallSeg(b, st, px, pz, dx - gap, qz, ry, opts); wallSeg(b, st, dx + gap, pz, qx, qz, ry, opts); }
      else { wallSeg(b, st, px, pz, qx, dz - gap, ry, opts); wallSeg(b, st, px, dz + gap, qx, qz, ry, opts); }
      // mái ngói viền quanh (để trống giữa sân trong cho camera nhìn được người chơi), văn phòng: mái bằng + lan can
      const L = horiz ? Math.abs(qx - px) : Math.abs(qz - pz);
      b.group((px + qx) / 2, Y, (pz + qz) / 2, ry, () => {
        if (st.yard) return;
        if (st.flat) { b.box(L + 0.3, 0.2, 1.4, 0, H, -0.45, st.roof); for (let u = -L / 2; u <= L / 2 + 0.01; u += 1.6) b.box(0.12, 0.7, 0.12, u, H + 0.2, 0.15, st.trim); b.box(L, 0.1, 0.12, 0, H + 0.82, 0.15, st.trim); return; }
        b.box(L + 1.2, 0.16, 1.9, 0, H + 0.05, 0.05, st.roof, 0, 0.42);
        b.box(L + 1.25, 0.1, 0.18, 0, H + 0.46, -0.78, st.trim, 0, 0.42);
      });
    }
    // góc tường
    for (const [x, z] of [[ax, az], [bx, az], [ax, bz], [bx, bz]]) b.box(0.6, H + 0.2, 0.6, x, Y, z, st.trim);
    // cửa ra vào + hiên + bảng tên + biểu tượng của lớp (toạ độ cục bộ: +z = ra ngoài)
    const ox = side === 'l' ? ax : side === 'r' ? bx : dx, oz = side === 't' ? az : side === 'b' ? bz : dz;
    const big = id === 'hall', pw = big ? 9 : 2 * gap + 1.8, pd = big ? 3.2 : 2.4;
    b.group(ox, Y, oz, FACE[side], () => {
      b.box(2 * gap, H - 2.75, T + 0.04, 0, 2.75, 0, st.trim);                                   // lanh tô
      for (const s of [-1, 1]) b.box(0.08, 2.6, 1.3, s * (gap - 0.12), 0.05, -0.8, st.door);    // 2 cánh cửa mở vào trong
      b.box(2 * gap + 0.6, 0.1, 1.0, 0, 0, 0.62, '#cfc6b4');                                   // bậc thềm
      const cols = big ? [-4, -2.6, 2.6, 4] : [-(gap + 0.5), gap + 0.5];
      for (const u of cols) { b.cyl(0.2, 0.24, H, u, 0, pd - 0.4, st.trim, 8); b.box(0.6, 0.2, 0.6, u, 0, pd - 0.4, st.base); }
      b.box(pw, 0.22, pd + 0.2, 0, H - 0.05, pd / 2 - 0.2, st.trim);
      const gh = big ? 2.4 : 1.4;
      b.prism(pd + 0.6, gh, pw + 0.5, 0, H + 0.15, pd / 2 - 0.2, st.roof, Math.PI / 2);         // trán hiên (mái tam giác)
      b.prism(pd + 0.1, gh * 0.72, pw - 0.6, 0, H + 0.17, pd / 2 - 0.12, st.wall, Math.PI / 2);
      signAt(b, atlas.sign(st.sign[0], st.sign[1]), big ? 5.2 : 3.6, big ? 0.65 : 0.45, 0, H - 0.5 + (big ? 0.0 : 0.02), pd - 0.08);
      const topY = H + 0.15 + gh, tz = pd / 2 - 0.2;
      if (id === 'rubik' || id === 'rubikyard') rubikCube(b, 0, topY + 0.95, tz, 1.5, 0.5, true);
      else if (id === 'chess') { chessPiece(b, 'k', -0.7, tz, 1.0, 'w', topY - 0.2); chessPiece(b, 'n', 0.8, tz, 0.85, 'b', topY - 0.35); }
      else if (id === 'music') musicNote(b, 0, topY + 0.2, tz, 0.9, '#2b2633');
      else if (id === 'hall') { b.cyl(0.75, 0.75, 0.14, 0, H + 0.9, pd + 0.02, '#fffaf0', 12, 0, Math.PI / 2); b.cyl(0.6, 0.6, 0.16, 0, H + 0.9, pd + 0.05, '#2b2633', 12, 0, Math.PI / 2); b.box(0.06, 0.45, 0.04, 0, H + 0.9, pd + 0.15, '#fffaf0'); b.box(0.32, 0.06, 0.04, 0.12, H + 1.1, pd + 0.15, '#fffaf0'); b.cone(0.5, 1.2, 0, topY - 0.1, tz, st.roof, 4); b.ball(0.18, 0, topY + 1.2, tz, '#f2c14e'); }
      else if (id === 'elec') { const by = topY + 0.1; b.box(0.35, 1.0, 0.18, 0.1, by + 0.55, tz, '#f5c518', 0, 0, -0.45); b.box(0.35, 1.0, 0.18, -0.1, by - 0.15, tz, '#f5c518', 0, 0, -0.45); b.box(0.7, 0.18, 0.2, 0, by + 0.42, tz, '#f5c518'); }
      else if (id === 'office') { b.cyl(0.04, 0.05, 2.4, 0, topY - 0.1, tz, '#d9d9d9', 6); }
    });
    // đồ bên trong: bảng đen sát tường đối diện cửa
    if (!st.yard && id !== 'office') {
      const opp = { b: 't', t: 'b', l: 'r', r: 'l' }[side], [px, pz, qx, qz] = sides[opp];
      b.group((px + qx) / 2, Y, (pz + qz) / 2, FACE[opp] + Math.PI, () => { b.box(Math.min(6, (opp === 't' || opp === 'b' ? r.w : r.h) * S * 0.4), 1.5, 0.08, 0, 1.2, T / 2 + 0.05, '#2f5d3f'); b.box(Math.min(6.2, (opp === 't' || opp === 'b' ? r.w : r.h) * S * 0.4 + 0.2), 0.1, 0.18, 0, 1.12, T / 2 + 0.1, '#8a6a44'); });
    }
    if (id === 'chess' && D.CHESS_T) for (const [x2, y2] of D.CHESS_T) { const x = X3(x2), z = Z3(y2); b.box(1.3, 0.08, 1.3, x, Y + 0.75, z, '#f4efe4'); b.box(0.66, 0.02, 0.66, x - 0.33, Y + 0.83, z - 0.33, '#2b2633'); b.box(0.66, 0.02, 0.66, x + 0.33, Y + 0.83, z + 0.33, '#2b2633'); b.box(0.2, 0.75, 0.2, x, Y, z, '#5a3a22'); }
    if (id === 'music' && D.MUSIC_SPOTS) { const [x2, y2] = D.MUSIC_SPOTS.piano, x = X3(x2), z = Z3(y2); b.box(2.0, 1.0, 0.8, x, Y, z, '#1b1626'); b.box(2.0, 0.06, 0.32, x, Y + 0.85, z + 0.5, '#ffffff'); for (let i = 0; i < 6; i++) b.box(0.08, 0.04, 0.2, x - 0.85 + i * 0.32, Y + 0.9, z + 0.45, '#1b1626'); b.box(0.8, 0.5, 0.4, x, Y, z + 1.0, '#5a3a22'); }
    if (id === 'hall') for (let i = 0; i < 4; i++) b.box(r.w * S * 0.6, 0.45, 0.5, cx + 1.5, Y, Z3(r.y + 300 + i * 68), '#a0522d');
  }

  // ================= NHÀ Ở HỌC SINH (RS.HOUSES) =================
  const KIND = {
    bietthu:     { wall: '#fff3d6', roof: '#7a3b2e', trim: '#ffffff', floors: 2, roofT: 'hip', chim: true, balcony: true },
    nhaong:      { wall: '#ffd36e', roof: '#c4452f', trim: '#ffffff', floors: 3, roofT: 'flat', balcony: true },
    nhago:       { wall: '#b07a48', roof: '#5a3a22', trim: '#e8d2a8', floors: 1, roofT: 'gable', chim: true },
    nhatron:     { wall: '#fff6e8', roof: '#e8392f', trim: '#ffffff', floors: 1, roofT: 'mush' },
    resort:      { wall: '#f4f9ff', roof: '#3fa7d6', trim: '#ffffff', floors: 2, roofT: 'pool' },
    nhat:        { wall: '#f1e6cf', roof: '#3b3f4a', trim: '#6b3a1e', floors: 1, roofT: 'hip', eave: 1.0 },
    laudai:      { wall: '#d8d2c8', roof: '#4a5fc4', trim: '#bfb7aa', floors: 2, roofT: 'castle' },
    nhasan:      { wall: '#a8743f', roof: '#c9a45c', trim: '#6b4a2b', floors: 1, roofT: 'gable', stilt: true, steep: 2.2 },
    nhakinh:     { wall: '#ffffff', roof: '#3d4a5c', trim: '#ffffff', floors: 2, roofT: 'flat', glass: true },
    diatrunghai: { wall: '#ffffff', roof: '#2b63d9', trim: '#2b63d9', floors: 2, roofT: 'dome' },
    thai:        { wall: '#f6e3b8', roof: '#d9542b', trim: '#8a3b1e', floors: 1, roofT: 'gable', steep: 2.6, layers: true },
    container:   { wall: '#e8392f', roof: '#2b63d9', trim: '#ffffff', floors: 2, roofT: 'container' },
    villa:       { wall: '#f4f4f0', roof: '#4a4f5a', trim: '#2b2633', floors: 2, roofT: 'flat', glass: true, balcony: true },
  };
  // nhà kiểu chung: gốc ở giữa mặt tiền dưới đất, +z = mặt tiền (hướng ra lối đi), w ngang, d sâu
  function house(b, w, d, o) {
    const fh = 1.9, base = o.stilt ? 1.1 : 0, Hh = base + fh * o.floors, zc = -d / 2, win = o.glass ? '#7fc4e8' : '#3f6f9e';
    if (o.stilt) for (const u of [-w / 2 + 0.3, w / 2 - 0.3]) for (const v of [-d + 0.3, -0.3]) b.box(0.22, base, 0.22, u, 0, v, o.trim);
    if (o.roofT === 'mush') {   // nhà tròn mái nấm
      const r = Math.min(w, d) / 2 - 0.05; b.cyl(r * 0.92, r, fh * 1.2, 0, 0, zc, o.wall, 10);
      b.push(new THREE.SphereGeometry(r * 1.35, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), o.roof, 0, fh * 1.2, zc, 0, 0, 0, 1, 0.8, 1);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; b.ball(0.2, Math.cos(a) * r * 0.9, fh * 1.2 + 0.75 + (i % 2) * 0.3, zc + Math.sin(a) * r * 0.9, '#ffffff', 1, 0.5, 1); }
      b.box(0.9, 1.6, 0.1, 0, 0, zc + r * 0.97, '#7a4a2a'); b.box(0.7, 0.7, 0.08, -r * 0.55, 1.0, zc + r * 0.8, win, -0.5); return;
    }
    if (o.roofT === 'container') {
      b.box(w, fh, d, 0, 0, zc, o.wall); b.box(w * 0.9, fh, d * 0.85, -w * 0.05, fh, zc - d * 0.07, o.roof);
      for (let u = -w / 2 + 0.2; u < w / 2; u += 0.35) b.box(0.08, fh * 0.9, 0.05, u, fh * 0.05, 0.02, '#b52a22');
      b.box(1.0, 1.7, 0.08, w * 0.25, 0, 0.04, '#2b2633'); b.box(w * 0.4, 0.9, 0.06, -w * 0.15, fh + 0.5, -d * 0.07 + 0.03, '#7fc4e8'); return;
    }
    b.box(w, Hh - base, d, 0, base, zc, o.wall);
    b.box(w + 0.06, 0.35, d + 0.06, 0, base, zc, o.trim);
    // cửa chính + bậc
    b.box(1.0, 1.75, 0.08, 0, base + 0.05, 0.04, o.glass ? '#2b2633' : '#7a4a2a'); b.box(1.3, 0.12, 0.7, 0, 0, 0.35, '#cfc6b4');
    if (o.stilt) for (let i = 0; i < 4; i++) b.box(1.0, 0.08, 0.3, 0, base - 0.25 - i * 0.27, 0.3 + i * 0.3, o.trim);
    // cửa sổ mặt tiền + 2 bên, mỗi tầng
    for (let f = 0; f < o.floors; f++) {
      const y = base + f * fh + 0.7, n = Math.max(1, Math.floor((w - 0.4) / 1.5));
      for (let i = 0; i < n; i++) {
        const u = -w / 2 + (i + 0.5) * w / n; if (f === 0 && Math.abs(u) < 0.8) continue;
        if (o.glass) { b.plane(w / n - 0.2, 1.3, u, y + 0.55, 0.05, win); continue; }
        b.box(0.9, 1.05, 0.06, u, y, 0.03, o.trim); b.plane(0.7, 0.85, u, y + 0.52, 0.07, win);
        if (!o.glass && o.roofT !== 'castle') for (const s of [-1, 1]) b.box(0.28, 1.0, 0.05, u + s * 0.6, y + 0.02, 0.05, '#4f8a5b');   // cửa chớp xanh
      }
      for (const s of [-1, 1]) if (d > 2.4) { b.box(0.06, 1.0, 0.85, s * (w / 2 + 0.03), y, zc, o.trim); b.plane(0.7, 0.8, s * (w / 2 + 0.07), y + 0.5, zc, win, s * Math.PI / 2); }
    }
    if (o.balcony && o.floors > 1) { b.box(Math.min(w - 0.4, 3.2), 0.12, 0.8, 0, base + fh, 0.4, o.trim); for (let u = -Math.min(w - 0.4, 3.2) / 2; u <= Math.min(w - 0.4, 3.2) / 2 + 0.01; u += 0.4) b.box(0.06, 0.6, 0.06, u, base + fh + 0.12, 0.76, o.trim); b.box(Math.min(w - 0.4, 3.2), 0.08, 0.1, 0, base + fh + 0.7, 0.76, o.trim); b.box(0.5, 0.25, 0.25, 0.9, base + fh + 0.12, 0.6, '#d9542b'); b.ball(0.3, 0.9, base + fh + 0.5, 0.6, '#e85d8a'); }
    const top = Hh, ov = o.eave || 0.35;
    if (o.roofT === 'gable') { b.prism(w + 2 * ov, o.steep || 1.5, d + 2 * ov, 0, top, zc, o.roof); if (o.layers) b.prism(w * 0.6, (o.steep || 1.5) * 0.7, d * 0.6, 0, top + (o.steep || 1.5) * 0.65, zc, o.trim); }
    else if (o.roofT === 'hip') { b.hip(w + 2 * ov, o.eave ? 1.3 : 1.7, d + 2 * ov, 0, top, zc, o.roof); }
    else if (o.roofT === 'flat' || o.roofT === 'pool') {
      b.box(w + 0.3, 0.22, d + 0.3, 0, top, zc, o.roof);
      for (const [u, v, L, ry] of [[0, 0.1, w, 0], [0, -d - 0.1, w, 0], [-w / 2 - 0.1, zc, d, Math.PI / 2], [w / 2 + 0.1, zc, d, Math.PI / 2]]) b.box(L + 0.2, 0.5, 0.12, u, top + 0.22, v, o.trim, ry);
      if (o.roofT === 'pool') { b.box(w * 0.7, 0.05, d * 0.6, -w * 0.08, top + 0.25, zc, '#3fbbe8'); for (let i = 0; i < 2; i++) b.box(0.5, 0.08, 1.2, w * 0.35, top + 0.25, zc - 0.8 + i * 1.4, '#ffffff'); b.cyl(0.04, 0.04, 1.4, w * 0.36, top + 0.22, zc + d * 0.3, '#ffffff', 5); b.cone(0.8, 0.4, w * 0.36, top + 1.5, zc + d * 0.3, '#ff8a1f', 8); }
    } else if (o.roofT === 'dome') { b.box(w + 0.2, 0.2, d + 0.2, 0, top, zc, '#e9dccb'); b.push(new THREE.SphereGeometry(Math.min(w, d) * 0.28, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), o.roof, w * 0.15, top + 0.2, zc); }
    else if (o.roofT === 'castle') {
      for (let u = -w / 2; u <= w / 2 + 0.01; u += 0.6) b.box(0.3, 0.4, 0.3, u, top, 0, o.trim);
      for (const [u, v] of [[-w / 2, 0], [w / 2, 0], [-w / 2, -d], [w / 2, -d]]) { b.cyl(0.55, 0.6, top + 1.2, u, 0, v, o.wall, 8); b.cone(0.75, 1.5, u, top + 1.2, v, o.roof, 8); b.cyl(0.02, 0.02, 0.6, u, top + 2.6, v, '#2b2633', 4); b.box(0.35, 0.22, 0.02, u + 0.17, top + 2.95, v, '#e8392f'); }
    }
    if (o.chim) b.box(0.45, 1.4, 0.45, w * 0.28, top + 0.2, zc - d * 0.15, '#9a5b3e');
  }

  // ================= DỰNG =================
  for (const [id, r] of Object.entries(R)) if (r.walls && r.w && r.y + r.h > env.Y_MIN && r.y < env.Y_MAX) measure(B.school, id, () => classroom(id, r));

  for (const h of RS.HOUSES || []) {
    const o = KIND[h.k] || KIND.nhago, w = h.w * S, d = h.h * S;
    measure(B.homes, h.k, () => B.homes.group(X3(h.x) + w / 2, Y, Z3(h.y) + d, 0, () => house(B.homes, w, d, o)));
    B.homes.box(1.4, 0.04, 0.9, X3(h.x) + w / 2, Y, Z3(h.y) + d + 0.75, '#d8cdb5');   // lối đi lát đá
    for (const s of [-1, 1]) B.homes.ball(0.35, X3(h.x) + w / 2 + s * 1.3, Y + 0.3, Z3(h.y) + d + 0.5, '#5aa04a', 1, 0.8, 1);   // bụi cây
  }

  // Phố Đà Lạt: nhà nhiều màu, mặt tiền nhìn ra đường (phía nam)
  const DSTYLE = [{ roofT: 'gable', floors: 2, balcony: true }, { roofT: 'hip', floors: 2, chim: true }, { roofT: 'gable', floors: 1, steep: 2.4, chim: true }, { roofT: 'flat', floors: 2, balcony: true }];
  for (const h of D.DALAT || []) {
    const w = h.w * S, d = h.h * S, st = DSTYLE[h.style % 4], o = Object.assign({ wall: h.wall, roof: h.roof, trim: '#ffffff', chim: h.chim }, st);
    measure(B.dalat, 'dalat' + h.idx, () => B.dalat.group(X3(h.x) + w / 2, Y, Z3(h.y) + d, 0, () => {
      house(B.dalat, w, d, o);
      if (h.sign) { B.dalat.box(w * 0.75, 0.08, 0.9, 0, 2.35, 0.45, h.idx % 2 ? '#e8392f' : '#2f9e44', 0, -0.25); signAt(B.dalat, atlas.sign(h.sign, '#3b2a1e', '#fff', '#f2c14e'), Math.min(3, w * 0.6), 0.38, 0, 2.95, 0.12); }
    }));
    ctx.boxes.push({ x0: X3(h.x), x1: X3(h.x) + w, z0: Z3(h.y), z1: Z3(h.y) + d, top: Y + 4 });
  }

  // Cổng trường (hướng tây), chốt bảo vệ, cột cờ, ghế đá, đèn
  if (RS.GATE) {
    const b = B.school, gx = X3(RS.GATE[0]), gz = Z3(RS.GATE[1]);
    b.group(gx, Y, gz, -Math.PI / 2, () => {
      for (const s of [-1, 1]) { b.box(0.9, 4.3, 0.9, s * 2.7, 0, 0, '#c8372d'); b.box(1.15, 0.3, 1.15, s * 2.7, 4.3, 0, '#f2c14e'); b.box(1.1, 0.4, 1.1, s * 2.7, 0, 0, '#8a3b2e'); b.ball(0.3, s * 2.7, 4.85, 0, '#f2c14e'); }
      b.box(6.4, 0.9, 0.5, 0, 3.4, 0, '#c8372d'); b.box(6.6, 0.16, 0.6, 0, 4.3, 0, '#f2c14e');
      signAt(b, atlas.sign('TRƯỜNG RUBIK', '#c8372d', '#ffe680', '#f2c14e'), 5.6, 0.7, 0, 3.85, 0.27);
      for (const s of [-1, 1]) { b.box(3.4, 0.6, 0.35, s * 4.9, 0, 0, '#d8cdb5'); for (let u = 0; u < 3.2; u += 0.35) b.box(0.06, 1.0, 0.06, s * (3.4 + u), 0.6, 0, '#2b2633'); b.box(3.4, 0.06, 0.08, s * 4.9, 1.5, 0, '#2b2633'); }
      for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { b.box(0.08, 2.0, 1.25, s * (1.85 - i * 0.05), 0.1, 0.65, '#2b2633', 0, 0, 0); }   // cánh cổng sắt mở
    });
    if (D.BOOTH) { const x = X3(D.BOOTH[0]), z = Z3(D.BOOTH[1]); b.box(1.6, 2.2, 1.6, x, Y, z, '#f4efe4'); b.plane(1.0, 0.7, x - 0.81, Y + 1.5, z, '#7fc4e8', -Math.PI / 2); b.hip(2.1, 0.8, 2.1, x, Y + 2.2, z, '#c8372d'); }
  }
  if (D.FLAG) {
    const b = B.school, x = X3(D.FLAG[0]), z = Z3(D.FLAG[1]);
    b.box(2.4, 0.25, 2.4, x, Y, z, '#cfc6b4'); b.box(1.6, 0.25, 1.6, x, Y + 0.25, z, '#e2dccc'); b.cyl(0.06, 0.09, 8.5, x, Y + 0.5, z, '#d9d9d9', 6); b.ball(0.14, x, Y + 9.05, z, '#f2c14e');
    _o.position.set(x + 0.95, Y + 8.1, z); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); atlas.add(atlas.flag(), 1.8, 1.2, _o.matrix.clone());
  }
  const bench = (b, x, z, ry) => b.group(x, Y, z, ry, () => { b.box(1.8, 0.14, 0.55, 0, 0.42, 0, '#bdb8ae'); for (const s of [-1, 1]) b.box(0.18, 0.42, 0.5, s * 0.7, 0, 0, '#a19c93'); });
  for (const [x2, y2] of [[200, 435], [500, 435], [1100, 435], [870, 700], [1180, 735], [1640, 700]]) if (!nearDoor(X3(x2), Z3(y2), 1.6)) bench(B.school, X3(x2), Z3(y2), 0);
  for (const [x2, y2] of D.LAMPS || []) { const x = X3(x2), z = Z3(y2); B.school.cyl(0.06, 0.09, 3.2, x, Y, z, '#2f4f4f', 6); B.school.box(0.3, 0.4, 0.3, x, Y + 3.2, z, '#fff3c4'); B.school.hip(0.5, 0.3, 0.5, x, Y + 3.6, z, '#2f4f4f'); }
  for (const [x2, y2] of D.TREES || []) trees.push([X3(x2), Z3(y2), 'phuong', 1.1 + rnd() * 0.3]);
  for (const [x2, y2] of [[120, 380], [380, 400], [700, 360], [1130, 370], [1640, 330], [1640, 450], [30, 300], [30, 520]]) if (!nearDoor(X3(x2), Z3(y2), 2) && !inRoom(x2, y2, 10)) trees.push([X3(x2), Z3(y2), x2 % 3 ? 'leaf' : 'phuong', 1.0 + rnd() * 0.3]);

  // ================= KHU MỞ =================
  // Sân bóng đá: cỏ sọc, vạch vôi, 2 khung thành
  if (R.field) {
    const f = R.field, b = B.ground, x0 = X3(f.x + 20), x1 = X3(f.x + f.w - 20), z0 = Z3(f.y + 20), z1 = Z3(f.y + f.h - 20), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = x1 - x0, W = z1 - z0, ly = Y + 0.03;
    for (let i = 0; i < 8; i++) b.plane(L / 8, W, x0 + (i + 0.5) * L / 8, Y + 0.015, cz, i % 2 ? '#4fa64a' : '#5cb455', 0, -Math.PI / 2);
    const line = (w, d, x, z) => b.box(w, 0.02, d, x, ly, z, '#ffffff');
    line(L, 0.12, cx, z0); line(L, 0.12, cx, z1); line(0.12, W, x0, cz); line(0.12, W, x1, cz); line(0.12, W, cx, cz);
    b.push(new THREE.RingGeometry(1.7, 1.82, 20).rotateX(-Math.PI / 2), '#ffffff', cx, ly + 0.02, cz);
    for (const s of [-1, 1]) {
      const gx = s < 0 ? x0 : x1; line(0.12, 6, gx - s * 3, cz); line(3, 0.12, gx - s * 1.5, cz - 3); line(3, 0.12, gx - s * 1.5, cz + 3);
      const g = B.parks; for (const v of [-1.8, 1.8]) { g.cyl(0.07, 0.07, 1.7, gx, Y, cz + v, '#ffffff', 6); g.cyl(0.05, 0.05, 1.7, gx + s * 1.0, Y, cz + v, '#e6e6e6', 6, 0, 0, -s * 0.0); g.box(1.0, 0.06, 0.06, gx + s * 0.5, Y + 1.7, cz + v, '#e6e6e6'); }
      g.box(0.12, 0.12, 3.72, gx, Y + 1.68, cz, '#ffffff'); g.box(0.06, 0.06, 3.6, gx + s * 1.0, Y + 1.68, cz, '#e6e6e6');
      g.plane(3.6, 1.7, gx + s * 1.0, Y + 0.85, cz, '#f4f4f4', Math.PI / 2);   // lưới sau
    }
  }
  // Quảng trường cờ khổng lồ: bàn cờ 8×8 + quân cờ to
  if (D.GBOARD) {
    const g = D.GBOARD, b = B.ground, s = g.s * S, bx = X3(g.x), bz = Z3(g.y), n = 8;
    b.box(s * n + 0.8, 0.1, s * n + 0.8, bx + s * n / 2, Y, bz + s * n / 2, '#8a6a44');
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) b.plane(s, s, bx + (i + 0.5) * s, Y + 0.11, bz + (j + 0.5) * s, (i + j) % 2 ? '#3d3747' : '#f4efe4', 0, -Math.PI / 2);
    const P = [['r', 0, 0, 'b'], ['k', 4, 0, 'b'], ['n', 6, 2, 'b'], ['p', 3, 3, 'b'], ['p', 5, 1, 'b'], ['q', 3, 6, 'w'], ['p', 4, 4, 'w'], ['p', 2, 5, 'w'], ['n', 5, 5, 'w'], ['k', 6, 7, 'w'], ['r', 0, 7, 'w']];
    measure(B.parks, 'chess-pieces', () => { for (const [k, i, j, c] of P) { const x = bx + (i + 0.5) * s, z = bz + (j + 0.5) * s, h = chessPiece(B.parks, k, x, z, 1.15, c, Y + 0.11); ctx.boxes.push({ x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, top: Y + 0.11 + h }); } });
  }
  // Tượng đài Rubik: bệ 2 bậc + khối Rubik khổng lồ đứng trên một góc + bồn hoa
  if (D.RMON) {
    const x = X3(D.RMON[0]), z = Z3(D.RMON[1]), b = B.parks;
    measure(b, 'rubik-statue', () => {
      b.cyl(3.4, 3.6, 0.3, x, Y, z, '#cfc6b4', 12); b.box(3.2, 0.8, 3.2, x, Y + 0.3, z, '#e2dccc'); b.box(2.4, 0.6, 2.4, x, Y + 1.1, z, '#f4efe4');
      rubikCube(b, x, Y + 1.7 + 2.6 * 0.87 + 0.05, z, 3.0, 0.3, true);
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; b.ball(0.35, x + Math.cos(a) * 3.0, Y + 0.45, z + Math.sin(a) * 3.0, RUBIK_COL[i % 6], 1, 0.7, 1); }
    });
    ctx.boxes.push({ x0: x - 1.6, x1: x + 1.6, z0: z - 1.6, z1: z + 1.6, top: Y + 1.7 });
  }
  // Hồ nước (hồ câu, hồ Koi, đầm sen): mặt nước toon hình elip + viền đá + lá sen + bến gỗ
  const pads = [], flowers = [], waters = [];
  const lake = (e, padN, flowerN) => {
    if (!e) return; const x = X3(e.cx), z = Z3(e.cy), rx = e.rx * S, rz = e.ry * S;
    waters.push([x, z, rx, rz]);
    B.ground.push(new THREE.RingGeometry(1, 1.12, 28).rotateX(-Math.PI / 2), '#cfc6b4', x, Y + 0.02, z, 0, 0, 0, rx, 1, rz);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + rnd() * 0.2; B.parks.ball(0.25 + rnd() * 0.25, x + Math.cos(a) * rx * 1.08, Y + 0.1, z + Math.sin(a) * rz * 1.08, rnd() < 0.5 ? '#9a948c' : '#b5aea3', 1.3, 0.6, 1); }
    for (let i = 0; i < padN; i++) { const a = rnd() * Math.PI * 2, q = Math.sqrt(rnd()) * 0.85; pads.push([x + Math.cos(a) * rx * q, z + Math.sin(a) * rz * q, 0.45 + rnd() * 0.35]); if (i < flowerN) flowers.push(pads[pads.length - 1]); }
  };
  lake(D.POND, 10, 0); lake(D.LAKE, 14, 3); lake(D.LOTUS, low ? 30 : 46, low ? 12 : 22);
  if (D.POND) { const x = X3(D.POND.cx), z = Z3(D.POND.cy + D.POND.ry), b = B.parks; b.box(1.4, 0.12, 4.2, x, Y + 0.12, z - 1.2, '#a87445'); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) b.box(0.15, 0.6, 0.15, x + s * 0.65, Y - 0.3, z - 3 + i * 1.4, '#6b4a2b'); }
  if (D.LAKE) for (let i = 0; i < 7; i++) { const a = i * 0.9, x = X3(D.LAKE.cx) + Math.cos(a) * D.LAKE.rx * S * 0.5, z = Z3(D.LAKE.cy) + Math.sin(a) * D.LAKE.ry * S * 0.5; B.parks.box(0.5, 0.06, 0.18, x, Y + 0.05, z, i % 3 ? '#ff8a1f' : '#ffffff', a); }
  for (const [x2, y2, col] of D.TENTS || []) { const x = X3(x2), z = Z3(y2); if (nearDoor(x, z, 1.5)) continue; B.parks.prism(1.9, 1.3, 1.7, x, Y, z, col, Math.atan2(X3(D.LAKE.cx) - x, Z3(D.LAKE.cy) - z) + Math.PI / 2); B.parks.box(0.08, 0.9, 0.05, x, Y, z, '#2b2633', Math.atan2(X3(D.LAKE.cx) - x, Z3(D.LAKE.cy) - z) + Math.PI / 2); }
  // Nông trại: chuồng đỏ, luống rau, hàng rào gỗ (chừa lối vào phía nam)
  if (R.farm) {
    const f = R.farm, b = B.farm, fx0 = X3(f.x), fx1 = X3(f.x + f.w), fz0 = Z3(f.y), fz1 = Z3(f.y + f.h);
    measure(b, 'barn', () => b.group(X3(f.x + 100), Y, Z3(f.y + 130), 0, () => {
      b.box(8, 3.2, 6, 0, 0, -3, '#c0392b'); b.prism(8.6, 2.2, 6.8, 0, 3.2, -3, '#5a3a22');
      b.box(2.6, 2.6, 0.1, 0, 0, 0.02, '#f4efe4'); b.box(2.2, 2.2, 0.12, 0, 0.1, 0.05, '#8e2b22'); b.box(2.9, 0.12, 0.14, 0, 1.2, 0.08, '#f4efe4', 0, 0, 0.75); b.box(2.9, 0.12, 0.14, 0, 1.2, 0.08, '#f4efe4', 0, 0, -0.75);
      b.box(1.0, 0.9, 0.1, 0, 3.6, 0.42, '#f4efe4'); b.cyl(1.0, 1.0, 1.0, 5.4, 0, -1.5, '#e8c45a', 8, 0, Math.PI / 2); b.cyl(0.9, 0.9, 0.9, 5.4, 0, 0.6, '#d9b44a', 8, 0, Math.PI / 2);
    }));
    ctx.boxes.push({ x0: X3(f.x + 100) - 4, x1: X3(f.x + 100) + 4, z0: Z3(f.y + 130) - 6, z1: Z3(f.y + 130), top: Y + 4 });
    const crops = ['#3f8f3a', '#6cbf4a', '#e8392f', '#ff8a1f', '#7fbf3a'];
    for (let r = 0; r < 6; r++) {
      const z = Z3(f.y + 70 + r * 58), x0 = X3(f.x + 300), x1 = X3(f.x + 820); if (nearDoor((x0 + x1) / 2, z, 1)) continue;
      b.box(x1 - x0, 0.28, 1.2, (x0 + x1) / 2, Y, z, '#7a5230');
      for (let x = x0 + 0.4; x < x1 - 0.3; x += 0.8) { if (nearDoor(x, z, 1.2)) continue; const c = crops[r % crops.length]; b.ball(0.28, x, Y + 0.45, z, '#4f9a3a', 1, 0.8, 1); if (c !== '#3f8f3a' && c !== '#6cbf4a') b.ball(0.12, x + 0.1, Y + 0.62, z + 0.1, c); }
    }
    const fence = (ax, az, bx2, bz2) => { const L = Math.hypot(bx2 - ax, bz2 - az), ry = Math.atan2(bx2 - ax, bz2 - az) - Math.PI / 2; b.group((ax + bx2) / 2, Y, (az + bz2) / 2, ry, () => { for (let u = -L / 2; u <= L / 2 + 0.01; u += 2) b.box(0.16, 1.1, 0.16, u, 0, 0, '#8a5a34'); b.box(L, 0.1, 0.06, 0, 0.45, 0, '#a87445'); b.box(L, 0.1, 0.06, 0, 0.85, 0, '#a87445'); }); };
    const gA = X3(4440), gB = X3(4800);
    fence(fx0, fz0, fx1, fz0); fence(fx0, fz0, fx0, fz1); fence(fx1, fz0, fx1, fz1); fence(fx0, fz1, gA, fz1); fence(gB, fz1, fx1, fz1);
    for (const gx of [gA, gB]) { b.box(0.3, 2.2, 0.3, gx, Y, fz1, '#6b4a2b'); }
    b.box(gB - gA + 0.3, 0.3, 0.3, (gA + gB) / 2, Y + 2.2, fz1, '#6b4a2b');
    signAt(b, atlas.sign('NÔNG TRẠI', '#5a3a22', '#fff', '#e8c45a'), 3.2, 0.42, (gA + gB) / 2, Y + 2.85, fz1 + 0.05);
  }
  // Rừng thông, đồi thông, công viên: cây (InstancedMesh)
  for (const [x2, y2, k] of D.FOREST_TREES || []) if (!low || rnd() < 0.6) trees.push([X3(x2), Z3(y2), k === 'pine' ? 'pine' : 'leaf', 0.9 + rnd() * 0.5]);
  if (R.hills) { const h = R.hills; for (let y2 = h.y + 40; y2 < h.y + h.h - 20; y2 += low ? 90 : 64) for (let x2 = h.x + 30; x2 < h.x + h.w; x2 += low ? 90 : 64) { const px = x2 + (rnd() - 0.5) * 50, py = y2 + (rnd() - 0.5) * 40; if (reg(px, py) === 'hills' && !nearDoor(X3(px), Z3(py), 3)) trees.push([X3(px), Z3(py), 'pine', 0.9 + rnd() * 0.6]); } }
  for (const k of ['rubikpark', 'giantchess', 'pond']) { const r = R[k]; if (!r) continue; for (let i = 0; i < 9; i++) { const px = r.x + 25 + rnd() * (r.w - 50), py = r.y + 25 + rnd() * 120; if (reg(px, py) === k && !nearDoor(X3(px), Z3(py), 3)) trees.push([X3(px), Z3(py), rnd() < 0.5 ? 'leaf' : 'phuong', 1 + rnd() * 0.3]); } }
  // Cánh đồng hoa & vườn hoa Đà Lạt: luống hoa nhiều màu (instanced)
  const fl = [], FCOL = ['#e8392f', '#f5c518', '#e85d8a', '#9b59d0', '#ffffff', '#ff8a1f'];
  for (const k of ['flowerfield', 'garden']) { const r = R[k]; if (!r) continue; const step = low ? 46 : 32; let row = 0; for (let y2 = r.y + 30; y2 < r.y + r.h - 20; y2 += step, row++) for (let x2 = r.x + 24; x2 < r.x + r.w - 20; x2 += step * 0.7) { if (reg(x2, y2) !== k || nearDoor(X3(x2), Z3(y2), 1.5)) continue; fl.push([X3(x2) + (rnd() - 0.5) * 0.5, Z3(y2) + (rnd() - 0.5) * 0.3, FCOL[(row + (k === 'garden' ? Math.floor(x2 / 90) : 0)) % FCOL.length]]); } }

  // ================= XUẤT RA SCENE =================
  const mat = toon('#ffffff', { vertexColors: true }), out = [];
  for (const k of Object.keys(B)) { const m = B[k].mesh(mat, k !== 'ground'); if (!m) continue; if (k !== 'ground') addOutline(m); scene.add(m); out.push(m); }
  const sm = atlas.mesh(); if (sm) { sm.position.y = 0; scene.add(sm); out.push(sm); }
  // nước
  if (waters.length) {
    const wb = new Batch('water'); for (const [x, z, rx, rz] of waters) wb.push(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), '#ffffff', x, Y + 0.04, z, 0, 0, 0, rx, 1, rz);
    const wm = wb.mesh(toon('#3fa2d4', { transparent: true, opacity: 0.88, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, vertexColors: true }), false); wm.castShadow = false; scene.add(wm); out.push(wm);
  }
  // instanced: cây, hoa, lá sen
  const inst = (geo, material, list, setM, outline = false, shadow = true) => {
    if (!list.length) return null; const im = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach((q, i) => { setM(q, _o); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); if (q.col) im.setColorAt(i, _c.set(q.col)); });
    im.castShadow = shadow; im.receiveShadow = true; scene.add(im); out.push(im);
    if (outline) { const ol = new THREE.InstancedMesh(geo, outlineMat, list.length); ol.instanceMatrix = im.instanceMatrix; ol.frustumCulled = false; ol.raycast = () => {}; scene.add(ol); out.push(ol); }
    return im;
  };
  const set = (x, y, z, s, ry = 0) => (q, o) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(s, s, s); };
  const LEAF = ['#5aa04a', '#6cb84f', '#4f9a3a', '#7cc45a'], PHUONG = ['#e8452f', '#f05a2b', '#e83a3a'], PINE = ['#2f7a4a', '#3a8a52', '#2b6b44'];
  const T2 = trees.map(([x, z, k, s]) => ({ x, z, k, s, ry: rnd() * 6.28, col: (k === 'pine' ? PINE : k === 'phuong' ? PHUONG : LEAF)[Math.floor(rnd() * 3)] }));
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.4, 5).translate(0, 0.7, 0);
  const crownGeo = mergeGeometries([new THREE.IcosahedronGeometry(1.0, 0).translate(0, 2.1, 0), new THREE.IcosahedronGeometry(0.7, 0).translate(0.55, 1.75, 0.2)].map(g => { g.deleteAttribute('uv'); return g; }));
  const pineGeo = mergeGeometries([new THREE.ConeGeometry(1.1, 1.8, 7).translate(0, 1.9, 0), new THREE.ConeGeometry(0.8, 1.5, 7).translate(0, 2.8, 0), new THREE.ConeGeometry(0.5, 1.1, 7).translate(0, 3.6, 0)].map(g => g.toNonIndexed()).map(g => { g.deleteAttribute('uv'); g.computeVertexNormals(); return g; }));
  inst(trunkGeo, toon('#7a5230'), T2, q => (q2, o) => {}, false);
  // (đặt ma trận thân cây)
  const trunks = out[out.length - 1]; if (trunks && trunks.isInstancedMesh) { T2.forEach((q, i) => { set(q.x, Y, q.z, q.s * (q.k === 'pine' ? 1.1 : 1), q.ry)(q, _o); _o.updateMatrix(); trunks.setMatrixAt(i, _o.matrix); }); trunks.instanceMatrix.needsUpdate = true; trunks.computeBoundingSphere(); }
  const leafy = T2.filter(q => q.k !== 'pine'), pines = T2.filter(q => q.k === 'pine');
  inst(crownGeo, toon('#ffffff'), leafy, q => set(q.x, Y, q.z, q.s, q.ry), true);
  inst(pineGeo, toon('#ffffff'), pines, q => set(q.x, Y, q.z, q.s, q.ry), true);
  inst(new THREE.CylinderGeometry(1, 1, 0.04, 7), toon('#4f9a3a'), pads, ([x, z, s]) => set(x, Y + 0.07, z, s, x * 3), false, false);
  inst(new THREE.ConeGeometry(0.22, 0.4, 5), toon('#ff9ec4'), flowers, ([x, z]) => set(x + 0.1, Y + 0.12, z, 1, 0), false, false);
  inst(new THREE.ConeGeometry(0.16, 0.42, 4).translate(0, 0.21, 0), toon('#ffffff'), fl.map(([x, z, col]) => ({ x, z, col })), q => set(q.x, Y, q.z, 1, q.x), false, false);

  if (env.debug !== false) console.info('[town-buildings] tam giác mỗi công trình:', budget, '— draw call kiến trúc:', out.length);
  return { meshes: out, budget };
}
