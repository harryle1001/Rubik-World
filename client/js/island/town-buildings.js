// town-buildings.js — KIẾN TRÚC THỊ TRẤN TRƯỜNG RUBIK (low-poly toon, thay cho greybox).
// Chỉ lo phần NHÌN: lớp học, hội trường, văn phòng, cổng, cột cờ, ghế đá, nhà ở, phố Đà Lạt, sân bóng, cờ khổng lồ,
// tượng đài Rubik, hồ/đầm sen, nông trại, cây. Va chạm tường/nhà vẫn do school-town.js đẩy vào ctx.boxes như cũ.
// Tối ưu: mọi khối dùng chung 1 vật liệu toon tô màu theo đỉnh, gộp (merge) theo khu → vài draw call;
//         cây, hoa, lá sen dùng InstancedMesh; chữ bảng tên gom vào 1 tấm atlas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, addOutline, outlineMat, gradientMap } from './style.js';
import { BLOCKS, EXTRA, blockOf2D, SPAWN, WORLD, PHI, ISLAND_R, ZONES_N, zoneAngle, LOTS, LOTS_N, HOUSE_LOTS, GARDEN_LOTS, lotToWorld, HOUSE_W, HOUSE_D, HOUSE_V1, LOT_W, LOT_L, LOT_BACK,
  RING_ROAD_R, ROAD_W, RADIALS, LAGOON, blocked, houseAt, roadDist, lagoonDist } from './layout.js';
import { Batch, DetailGrid, createLife, detailMats } from './decor.js';
import { buildSchoolZone, rubikCube as rubikCubeReal } from './zone-school.js';

const _o = new THREE.Object3D(), _c = new THREE.Color();
const shade = (hex, l) => '#' + new THREE.Color(hex).offsetHSL(0, 0, l).getHexString();
const RUBIK_COL = ['#e8392f', '#2f9e44', '#2b63d9', '#f5c518', '#ff8a1f', '#ffffff'];

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
  const { scene } = ctx, { P, S, Y, H, T, gap } = env, R = RS.R, D = readExtra(env.win), low = !!ctx.lowEnd;
  // X3/Z3: đổi 1 toạ độ 2D sang 3D theo khối của bố cục; Z3 dùng khối của lần gọi X3 gần nhất (luôn gọi X3 trước Z3 cho cùng 1 điểm)
  let _b = BLOCKS[0]; const X3 = x => { _b = blockOf2D(x); return _b.o[0] + (x - _b.x2[0]) * S; }, Z3 = y => _b.o[1] + (Math.max(_b.y2[0], Math.min(_b.y2[1], y)) - _b.y2[0]) * S;
  const doors = RS.doors().map(d => P(d.x, d.y));
  const nearDoor = (x, z, r = 2.2) => doors.some(([a, b]) => Math.abs(a - x) < r && Math.abs(b - z) < r);
  const walled = Object.entries(R).filter(([, r]) => r.walls && r.w).map(([, r]) => r);
  const inRoom = (x2, y2, m = 30) => walled.some(r => x2 > r.x - m && x2 < r.x + r.w + m && y2 > r.y - m && y2 < r.y + r.h + m);
  const reg = (x2, y2) => { try { return RS.regionAt(x2, y2); } catch (e) { return 'north'; } };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const B = { gate: new Batch('gate'), school: new Batch('school'), homes: new Batch('homes'), dalat: new Batch('dalat'), parks: new Batch('parks'), farm: new Batch('farm'), ground: new Batch('ground') };
  const atlas = makeAtlas(), budget = {}, DG = new DetailGrid('detail', 40);
  const CURT = ['#f6d6a8', '#f2b6c6', '#cfe6f7', '#fff3c4', '#d8f0c8'];
  const measure = (b, name, fn) => { const t0 = b.tris; fn(); budget[name] = Math.round(b.tris - t0); };
  // bảng chữ gắn theo nhóm cục bộ của batch b
  const signAt = (b, uv, w, h, x, y, z, ry = 0) => { _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); const m = _o.matrix.clone(); if (b.pre) m.premultiply(b.pre); atlas.add(uv, w, h, m); };
  const trees = []; let flagAt = null;   // [x, z, kiểu 'leaf'|'pine'|'phuong'|'fruit', tỷ lệ]
  // NỀN CÔNG TRÌNH không có va chạm (để lọc cây/hoa): [x0,z0,x1,z1]; cùng ctx.boxes, nền nhà trong lô và mặt đường
  const foot = []; const addFoot = (x0, z0, x1, z1) => foot.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
  const extraMeshes = [];   // mesh riêng (bảng thông tin) — gộp vào danh sách xuất ở cuối
  const footC = []; const addFootC = (x, z, r) => footC.push([x, z, r]);
  const inRect = (q, x, z, m) => x > q[0] - m && x < q[2] + m && z > q[1] - m && z < q[3] + m;
  const isBuilt = (x, z, m = 0.6) => foot.some(q => inRect(q, x, z, m)) || footC.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + m) || ctx.boxes.some(q => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m) || !!houseAt(x, z, m) || roadDist(x, z) < ROAD_W / 2 + m;

  const lamp = (b, x, z, y = Y) => { b.box(0.16, 2.6, 0.16, x, y, z, '#6b4a2b'); b.box(0.7, 0.12, 0.12, x + 0.3, y + 2.5, z, '#6b4a2b'); b.box(0.32, 0.42, 0.32, x + 0.58, y + 2.0, z, '#ffd36e'); b.hip(0.42, 0.2, 0.42, x + 0.58, y + 2.42, z, '#6b4a2b'); };
  // ================= LỚP HỌC: xem zone-school.js (rubikCube/chessPiece dùng chung) =================
  const rubikCube = rubikCubeReal;   // khối Rubik 27 khối con: zone-school.js
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
        { const d = DG.follow(b); for (const s of [-1, 1]) d.plane(0.2, 0.8, u + s * 0.25, y + 0.52, 0.075, CURT[(f + i) % CURT.length]); if (f > 0 || !o.balcony) { d.box(0.85, 0.16, 0.2, u, y - 0.12, 0.12, '#8a5a34'); d.ball(0.12, u - 0.22, y + 0.08, 0.13, '#e85d8a'); d.ball(0.12, u + 0.22, y + 0.08, 0.13, '#f5c518'); } }
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
  // KHU TRƯỜNG (lớp học, cổng, quảng trường, cột cờ, sân trường, sân chơi, sân bóng): zone-school.js
  const SZ = buildSchoolZone({ ctx, RS, env, D, atlas, signAt, measure, budget, X3, Z3, DG, nearDoor, inRoom, rnd, chessPiece, addFoot }); flagAt = SZ.flagAt;

  // nhà ở: mỗi nhà 1 lô đất trên vòng quanh trường (layout.js), nền HOUSE_W × HOUSE_D ≈ lô/φ, mặt tiền nhìn về đường vòng
  for (const L of HOUSE_LOTS) {
    const h = L.house; if (!h) continue; const o = KIND[h.k] || KIND.nhago, [fx, fz] = lotToWorld(L, 0, HOUSE_V1);
    measure(B.homes, h.k, () => B.homes.group(fx, Y, fz, L.ry, () => house(B.homes, HOUSE_W, HOUSE_D, o)));
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

  // ================= KHU MỞ =================
  // Rừng thông, đồi thông, công viên: cây (InstancedMesh)
  for (const [x2, y2, k] of D.FOREST_TREES || []) if (!low || rnd() < 0.6) trees.push([X3(x2), Z3(y2), k === 'pine' ? 'pine' : 'leaf', 0.9 + rnd() * 0.5]);
  if (R.hills) { const h = R.hills; for (let y2 = h.y + 40; y2 < h.y + h.h - 20; y2 += low ? 90 : 64) for (let x2 = h.x + 30; x2 < h.x + h.w; x2 += low ? 90 : 64) { const px = x2 + (rnd() - 0.5) * 50, py = y2 + (rnd() - 0.5) * 40; if (reg(px, py) === 'hills' && !nearDoor(X3(px), Z3(py), 3)) trees.push([X3(px), Z3(py), 'pine', 0.9 + rnd() * 0.6]); } }
  for (const k of ['rubikpark', 'giantchess', 'pond']) { const r = R[k]; if (!r) continue; for (let i = 0; i < 9; i++) { const px = r.x + 25 + rnd() * (r.w - 50), py = r.y + 25 + rnd() * 120; if (reg(px, py) === k && !nearDoor(X3(px), Z3(py), 3)) trees.push([X3(px), Z3(py), rnd() < 0.5 ? 'leaf' : 'phuong', 1 + rnd() * 0.3]); } }
  // Cánh đồng hoa & vườn hoa Đà Lạt: luống hoa nhiều màu (instanced)
  const fl = [], FCOL = ['#e8392f', '#f5c518', '#e85d8a', '#9b59d0', '#ffffff', '#ff8a1f'];
  for (const k of ['flowerfield', 'garden']) { const r = R[k]; if (!r) continue; const step = low ? 46 : 32; let row = 0; for (let y2 = r.y + 30; y2 < r.y + r.h - 20; y2 += step, row++) for (let x2 = r.x + 24; x2 < r.x + r.w - 20; x2 += step * 0.7) { if (reg(x2, y2) !== k || nearDoor(X3(x2), Z3(y2), 1.5)) continue; fl.push([X3(x2) + (rnd() - 0.5) * 0.5, Z3(y2) + (rnd() - 0.5) * 0.3, FCOL[(row + (k === 'garden' ? Math.floor(x2 / 90) : 0)) % FCOL.length]]); } }

  // ================= 4 KHU MỚI QUANH ĐẢO (layout.js: EXTRA) =================
  const palms = [], boatsDeco = [];
  const ZR = Object.fromEntries(EXTRA.map(e => [e.id, e.r])), ALL = [...BLOCKS.map(b => b.r), ...EXTRA.map(e => e.r)];
  const hgt = (x, z) => ctx.terrain.heightAt(x, z);
  const deck = (b, x0, z0, x1, z1, y, posts = true, col = '#b07a48') => {   // sàn gỗ đi được (bến, cầu tàu)
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, along = w < d;
    b.box(w, 0.16, d, cx, y - 0.16, cz, col);
    const L = along ? d : w; for (let u = -L / 2 + 0.3; u < L / 2; u += 0.9) b.box(along ? w + 0.02 : 0.06, 0.02, along ? 0.06 : d + 0.02, along ? cx : cx + u, y, along ? cz + u : cz, '#8a5a34');
    if (posts) for (let u = -L / 2 + 0.2; u <= L / 2; u += 2.4) for (const s of [-1, 1]) { const px = along ? cx + s * (w / 2 - 0.1) : cx + u, pz = along ? cz + u : cz + s * (d / 2 - 0.1); b.cyl(0.13, 0.13, y + 2.2, px, -2.2, pz, '#6b4a2b', 6); }
    ctx.decks.push({ x0, x1, z0, z1, y });
  };
  const hut = (b, x, z, y, r, wall, roofC) => { addFootC(x, z, r * 1.1); b.cyl(r * 0.9, r, 2.0, x, y, z, wall, 8); b.cone(r * 1.45, 1.6, x, y + 2.0, z, roofC, 8); b.box(0.8, 1.4, 0.1, x, y, z + r * 0.95, '#6b4a2b'); };
  const dome = (b, x, z, y, r, col = '#dfe9ee') => { addFootC(x, z, r * 1.05); b.cyl(r, r, 0.5, x, y, z, '#b07a48', 10); b.push(new THREE.SphereGeometry(r * 0.95, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), col, x, y + 0.5, z, 0, 0, 0, 1, 0.75, 1); b.cyl(r * 0.3, r * 0.3, 0.15, x, y + 0.5 + r * 0.7, z, '#7fd0e8', 8); b.box(1.0, 1.6, 0.1, x, y + 0.5, z + r * 0.93, '#6b4a2b'); };
  // không trồng cây chắn tầm nhìn lúc vừa vào game (điểm xuất phát + đoạn camera phía sau)
  const clearView = (x, z) => Math.hypot(x - SPAWN[0], z - SPAWN[1]) > 9 && !(x > SPAWN[0] - 16 && x < SPAWN[0] + 3 && Math.abs(z - SPAWN[1]) < 5);
  const palmAt = (x, z, y, s = 1) => clearView(x, z) && palms.push({ x, z, y, s: s * (0.85 + rnd() * 0.4), ry: rnd() * 6.28, lean: 0.15 + rnd() * 0.25 });

  // --- E. Làng nổi trên biển: nhà mái vòm trên sàn gỗ, cầu tàu nối vào bờ nam của đảo, đèn lồng, thuyền buồm ---
  if (ZR.E) {
    const b = B.E = new Batch('E'), [x0, z0, x1, z1] = ZR.E, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y = 1.1;
    let sz = 30; while (sz < z0 && hgt(cx, sz) > 0.2) sz += 1;             // bờ nam của đảo
    measure(b, 'village', () => {
      // (đã bỏ cầu tàu nối đảo với làng nổi — đến làng bằng thuyền)
      deck(b, cx - 8, cz - 8, cx + 8, cz + 8, y, true, '#c08a52'); dome(b, cx, cz, y, 6.2, '#e8f1f4');      // nhà vòm trung tâm
      signAt(b, atlas.sign('LÀNG NỔI TRÊN BIỂN', '#1d5c7a', '#fff', '#ffd36e'), 4.4, 0.55, cx, y + 3.2, cz + 6.3);
      const pods = [[-22, -6], [22, -6], [-26, 16], [26, 16], [-10, 26], [10, 26]];
      for (const [dx, dz] of pods) {
        const px = cx + dx, pz = cz + dz; deck(b, px - 4.5, pz - 4.5, px + 4.5, pz + 4.5, y);
        if (Math.abs(dx) > 15) deck(b, Math.min(cx + Math.sign(dx) * 8, px - Math.sign(dx) * 4.5), pz - 1, Math.max(cx + Math.sign(dx) * 8, px - Math.sign(dx) * 4.5), pz + 1, y, false);   // lối ngang
        else deck(b, px - 1, Math.min(cz + 8, pz - 4.5), px + 1, Math.max(cz + 8, pz - 4.5), y, false);
        (dx + dz) % 4 ? dome(b, px, pz, y, 3.4) : hut(b, px, pz, y, 2.6, '#f2c99a', '#d9542b');
        lamp(b, px + 3.6, pz + 3.6, y); palmAt(px - 3.4, pz - 3.4, y, 0.8);
      }
      deck(b, cx + 6, cz + 2, cx + 22, cz + 4, y, false); deck(b, cx - 22, cz + 2, cx - 6, cz + 4, y, false);
      for (const [dx, dz] of [[-14, -14], [16, -16], [0, 36], [-30, 30]]) boatsDeco.push([cx + dx, cz + dz, rnd() * 6.28, ['#d8452f', '#3d8fd9', '#f2a23a'][boatsDeco.length % 3]]);
    });
  }
  // --- F. Công viên Safari: đường mòn uốn lượn, suối, thú (hươu cao cổ, ngựa vằn, voi, nai), chòi lá, cây dừa ---
  if (ZR.F) {
    const b = B.F = new Batch('F'), [x0, z0, x1, z1] = ZR.F, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    measure(b, 'safari', () => {
      b.plane(x1 - x0, z1 - z0, cx, Y + 0.01, cz, '#7cc45a', 0, -Math.PI / 2);
      for (let i = 0; i <= 60; i++) { const t = i / 60, x = x0 + 6 + t * (x1 - x0 - 12), z = cz + Math.sin(t * 9) * 18, a = Math.atan2(9 * 18 / (x1 - x0), 1) * Math.cos(t * 9); b.box(2.6, 0.04, 2.2, x, Y + 0.01, z, '#e3d3b0', -a + Math.PI / 2 * 0); }
      for (let i = 0; i <= 50; i++) { const t = i / 50, z = z0 + 4 + t * (z1 - z0 - 8), x = cx + 20 + Math.sin(t * 7 + 1) * 10; b.box(3.2, 0.03, 2.4, x, Y + 0.02, z, '#5fc8d8'); if (i % 4 === 0) b.ball(0.45, x + 1.9, Y + 0.2, z, '#b5aea3', 1.2, 0.6, 1); }
      const giraffe = (x, z, ry) => b.group(x, Y, z, ry, () => { for (const [u, v] of [[-0.35, -0.6], [0.35, -0.6], [-0.35, 0.6], [0.35, 0.6]]) b.box(0.18, 1.6, 0.18, u, 0, v, '#e8b74a'); b.box(0.9, 0.8, 1.7, 0, 1.6, 0, '#f2c14e'); b.box(0.35, 2.0, 0.35, 0, 2.2, 0.75, '#f2c14e', 0, 0.35); b.box(0.42, 0.42, 0.8, 0, 4.0, 1.4, '#f2c14e'); for (let i = 0; i < 5; i++) b.box(0.3, 0.3, 0.05, (i % 2 - 0.5) * 0.5, 1.8 + (i % 3) * 0.2, -0.6 + i * 0.3, '#9a5b2e'); });
      const zebra = (x, z, ry) => b.group(x, Y, z, ry, () => { for (const [u, v] of [[-0.25, -0.5], [0.25, -0.5], [-0.25, 0.5], [0.25, 0.5]]) b.box(0.14, 0.8, 0.14, u, 0, v, '#ffffff'); b.box(0.7, 0.65, 1.4, 0, 0.8, 0, '#ffffff'); for (let i = 0; i < 5; i++) b.box(0.72, 0.66, 0.08, 0, 0.8, -0.55 + i * 0.27, '#2b2633'); b.box(0.32, 0.65, 0.5, 0, 1.25, 0.8, '#ffffff', 0, -0.5); });
      const elephant = (x, z, ry) => b.group(x, Y, z, ry, () => { for (const [u, v] of [[-0.5, -0.7], [0.5, -0.7], [-0.5, 0.7], [0.5, 0.7]]) b.box(0.45, 1.1, 0.45, u, 0, v, '#9aa0a8'); b.box(1.5, 1.3, 2.2, 0, 1.0, 0, '#a8aeb6'); b.box(1.0, 1.0, 0.9, 0, 1.5, 1.4, '#a8aeb6'); for (const s of [-1, 1]) b.box(0.08, 0.9, 0.8, s * 0.6, 1.6, 1.3, '#9aa0a8'); b.box(0.25, 1.2, 0.25, 0, 0.5, 1.95, '#9aa0a8', 0, 0.2); });
      const deer = (x, z, ry) => b.group(x, Y, z, ry, () => { for (const [u, v] of [[-0.18, -0.35], [0.18, -0.35], [-0.18, 0.35], [0.18, 0.35]]) b.box(0.1, 0.6, 0.1, u, 0, v, '#b57a45'); b.box(0.45, 0.4, 0.95, 0, 0.6, 0, '#c98a52'); b.box(0.24, 0.4, 0.35, 0, 0.95, 0.5, '#c98a52', 0, -0.4); b.box(0.5, 0.05, 0.05, 0, 1.3, 0.55, '#7a5230'); });
      const herds = [[giraffe, 4], [zebra, 6], [elephant, 3], [deer, 7]];
      herds.forEach(([fn, n], k) => { const hx = x0 + 15 + (k % 2) * 55, hz = z0 + 18 + Math.floor(k / 2) * 55; for (let i = 0; i < n; i++) fn(hx + rnd() * 18, hz + rnd() * 18, rnd() * 6.28); });
      // hàng rào gỗ quanh 4 bãi thú
      for (let k = 0; k < 4; k++) { const hx = x0 + 11 + (k % 2) * 55, hz = z0 + 14 + Math.floor(k / 2) * 55; for (const [ax, az, bx2, bz2] of [[hx, hz, hx + 26, hz], [hx, hz + 26, hx + 26, hz + 26], [hx, hz, hx, hz + 26], [hx + 26, hz, hx + 26, hz + 26]]) { const L = Math.hypot(bx2 - ax, bz2 - az), ry = Math.atan2(bx2 - ax, bz2 - az) - Math.PI / 2; b.group((ax + bx2) / 2, Y, (az + bz2) / 2, ry, () => { for (let u = -L / 2; u <= L / 2; u += 3) b.box(0.18, 1.0, 0.18, u, 0, 0, '#8a5a34'); b.box(L, 0.1, 0.07, 0, 0.75, 0, '#a87445'); }); } }
      for (let i = 0; i < 4; i++) hut(b, x1 - 12 - i * 7, z0 + 8, Y, 2.2, '#c9a45c', '#a8743f');
      b.group(x1 - 2, Y, cz, Math.PI / 2, () => { for (const s of [-1, 1]) { b.box(0.6, 4.2, 0.6, s * 3, 0, 0, '#6b4a2b'); } b.box(7, 0.6, 0.5, 0, 4.2, 0, '#8a5a34'); signAt(b, atlas.sign('CÔNG VIÊN SAFARI', '#3f6b2a', '#fff', '#e8c45a'), 5.2, 0.6, 0, 4.5, 0.3); });
      for (let i = 0; i < 26; i++) { const x = x0 + 4 + rnd() * (x1 - x0 - 8), z = z0 + 4 + rnd() * (z1 - z0 - 8); if (Math.abs(z - (cz + Math.sin((x - x0 - 6) / (x1 - x0 - 12) * 9) * 18)) > 4) (i % 3 ? palmAt : (xx, zz) => trees.push([xx, zz, 'leaf', 1.2 + rnd() * 0.4]))(x, z, Y); }
    });
  }
  // --- G. Học viện Hoa Phượng (kiểu khuôn viên đối xứng, mái ngói cam 4 mái, sân phun nước, sân tennis, dãy biệt thự) ---
  if (ZR.G) {
    const b = B.G = new Batch('G'), [x0, z0, x1, z1] = ZR.G, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, OR = '#e8763a', WH = '#f6efe2';
    const blk = (x, z, w, d, h, name) => { b.box(w, h, d, x, Y, z, WH); b.box(w + 0.1, 0.3, d + 0.1, x, Y, z, '#cdbfa5'); b.hip(w + 1.2, Math.min(w, d) * 0.35, d + 1.2, x, Y + h, z, OR); for (let u = -w / 2 + 1.2; u < w / 2 - 0.6; u += 1.8) for (let f = 0; f < Math.floor(h / 2.2); f++) for (const s of [-1, 1]) b.plane(0.9, 1.1, x + u, Y + 1.3 + f * 2.2, z + s * (d / 2 + 0.02), '#4f86b8', s < 0 ? Math.PI : 0); ctx.boxes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: Y + h }); };
    measure(b, 'academy', () => {
      b.plane(x1 - x0, z1 - z0, cx, Y + 0.01, cz, '#8fcf6a', 0, -Math.PI / 2);
      b.box(10, 0.04, z1 - z0, cx, Y + 0.01, cz, '#e9e2d2'); b.box(x1 - x0, 0.04, 6, cx, Y + 0.012, cz + 10, '#d6d0c4');
      // nhà chính: 2 khối + khối giữa + sảnh, đối xứng
      for (const s of [-1, 1]) blk(cx + s * 12, cz - 14, 14, 12, 6.6);
      blk(cx, cz - 2, 18, 9, 6.6); blk(cx, cz + 4.5, 6, 5, 4.4);
      signAt(b, atlas.sign('HỌC VIỆN HOA PHƯỢNG', '#8a2b1e', '#fff3c4', '#e9b949'), 5.6, 0.62, cx, Y + 3.5, cz + 7.05);
      // sân phun nước + bồn hoa hình cá
      b.cyl(3.2, 3.4, 0.5, cx, Y, cz + 16, '#e2dccc', 12); b.cyl(2.8, 2.8, 0.06, cx, Y + 0.45, cz + 16, '#5fc8e8', 12); b.cyl(0.4, 0.6, 1.6, cx, Y, cz + 16, '#e2dccc', 8); b.ball(0.5, cx, Y + 1.9, cz + 16, '#bfe9f6');
      for (const s of [-1, 1]) { b.push(new THREE.SphereGeometry(1, 8, 4), '#3f8f3a', cx + s * 16, Y + 0.3, cz + 26, 0, 0, 0, 6, 0.4, 2); b.cone(1.6, 2.4, cx + s * 22.5, Y + 0.05, cz + 26, '#3f8f3a', 3, s * Math.PI / 2); }
      // khu bên trái: nhà chữ U + sân tennis
      blk(x0 + 12, z0 + 10, 16, 4, 4.4); blk(x0 + 5, z0 + 18, 4, 14, 4.4); blk(x0 + 19, z0 + 18, 4, 14, 4.4);
      for (let i = 0; i < 2; i++) { const tx = x0 + 8 + i * 9, tz = cz + 10; b.box(8, 0.05, 13, tx, Y + 0.01, tz, '#3fa7c8'); b.box(8, 0.06, 0.08, tx, Y + 0.02, tz, '#ffffff'); b.box(8.2, 1.0, 0.05, tx, Y, tz, '#2b2633'); }
      // khu bên phải: nhà vuông mái chóp + vườn tròn
      blk(x1 - 16, z0 + 10, 9, 9, 5.5); b.cyl(7, 7, 0.06, x1 - 16, Y + 0.01, cz + 8, '#bfe39a', 16); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; b.ball(0.7, x1 - 16 + Math.cos(a) * 5, Y + 0.6, cz + 8 + Math.sin(a) * 5, ['#e85d8a', '#f5c518', '#e8392f'][i % 3]); }
      // dãy biệt thự mái cam phía nam
      for (let i = 0; i < 8; i++) { const vx = x0 + 9 + i * ((x1 - x0 - 18) / 7), vz = z1 - 9; if (Math.abs(vx - cx) < 7) continue; blk(vx, vz, 7, 6, 3.6); }
      for (let i = 0; i < 14; i++) trees.push([x0 + 3 + i * (x1 - x0 - 6) / 13, z0 + 2.5, i % 2 ? 'phuong' : 'leaf', 1.1]);
      for (let i = 0; i < 10; i++) palmAt(cx + (i % 2 ? 1 : -1) * 6.5, cz + 10 + Math.floor(i / 2) * 5, Y, 1.0);
    });
  }
  // --- H. Resort Biển Xanh: khách sạn bậc thang, hồ bơi, chòi bát giác, dù bãi biển, biệt thự trên đồi ---
  if (ZR.H) {
    const b = B.H = new Batch('H'), [x0, z0, x1, z1] = ZR.H, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sandZ = z1 - 18;
    measure(b, 'resort', () => {
      b.plane(x1 - x0, sandZ - z0, cx, Y + 0.01, (z0 + sandZ) / 2, '#8fcf6a', 0, -Math.PI / 2); b.plane(x1 - x0, z1 - sandZ, cx, Y + 0.012, (sandZ + z1) / 2, '#f3d29a', 0, -Math.PI / 2);
      // khách sạn: khối chính + khối bậc thang + mái xanh
      const hx = cx - 8, hz = z0 + 14;
      b.box(30, 14, 9, hx, Y, hz, '#f4f6f8'); for (let f = 0; f < 6; f++) for (let u = -13.5; u <= 13.5; u += 1.8) b.plane(1.3, 1.4, hx + u, Y + 1.6 + f * 2.2, hz + 4.52, (f + Math.round(u)) % 3 ? '#7fc4e8' : '#a9dcf2');
      b.box(30.6, 0.5, 9.6, hx, Y + 14, hz, '#9ad26e');
      for (let i = 0; i < 5; i++) b.box(7, 12 - i * 2.4, 6, hx + 19 + i * 0.01, Y, hz + i * 2.2 - 2, i % 2 ? '#ffffff' : '#eef3f6');
      b.box(10, 6, 8, hx - 20, Y, hz + 1, '#e8f1f4'); b.plane(9, 5, hx - 20, Y + 3, hz + 5.02, '#8fd0ea');
      ctx.boxes.push({ x0: hx - 25, x1: hx + 23, z0: hz - 4.5, z1: hz + 6, top: Y + 14 });
      signAt(b, atlas.sign('RESORT BIỂN XANH', '#1d5c7a', '#fff', '#ffd36e'), 5.6, 0.6, hx, Y + 4.4, hz + 4.6);
      // hồ bơi uốn lượn + ghế nằm
      for (const [px, pz, rx, rz] of [[cx - 14, cz + 2, 7, 4], [cx + 4, cz + 4, 5, 3.4], [cx + 18, cz + 1, 4, 3]]) { b.push(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), '#e8e2d4', px, Y + 0.02, pz, 0, 0, 0, rx + 0.8, 1, rz + 0.8); b.push(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), '#3fd0e8', px, Y + 0.04, pz, 0, 0, 0, rx, 1, rz); }
      for (let i = 0; i < 10; i++) b.box(0.7, 0.3, 1.8, cx - 22 + i * 4.5, Y, cz + 9, '#ffffff');
      // chòi bát giác trên bãi biển + dù che nắng
      const gx = x0 + 18, gz = z1 - 6; b.cyl(4, 4, 0.4, gx, Y, gz, '#c08a52', 8); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; b.box(0.25, 2.6, 0.25, gx + Math.cos(a) * 3.6, Y + 0.4, gz + Math.sin(a) * 3.6, '#8a5a34'); } b.cone(5, 2.2, gx, Y + 3, gz, '#8a6a3a', 8); b.cone(1.2, 1.0, gx, Y + 5, gz, '#7a5a2a', 8);
      for (let i = 0; i < 9; i++) { const ux = x0 + 32 + i * 9, uz = z1 - 8 + (i % 2) * 4; b.cyl(0.05, 0.05, 2.2, ux, Y, uz, '#ffffff', 5); b.cone(1.5, 0.6, ux, Y + 2.0, uz, ['#e8392f', '#f5c518', '#3d8fd9'][i % 3], 8); b.box(0.6, 0.15, 1.6, ux + 1.2, Y + 0.25, uz, '#ffffff'); }
      // biệt thự nhỏ trên đồi phía sau (mái đỏ)
      for (let i = 0; i < 6; i++) addFoot(x0 + 5.5 + i * 20, z0 - 1.5, x0 + 10.5 + i * 20, z0 + 2.5);
      for (let i = 0; i < 6; i++) b.group(x0 + 8 + i * 20, Y, z0 + 2.5, 0, () => house(b, 5, 4, { wall: '#fff6e8', roof: '#c4452f', trim: '#ffffff', floors: 2, roofT: 'hip', balcony: true }));
      for (let i = 0; i < 18; i++) palmAt(x0 + 4 + rnd() * (x1 - x0 - 8), sandZ - 6 + rnd() * 14, Y, 1.1);
      if (hgt(x1 - 20, z1 + 18) < -0.5) { deck(b, x1 - 22, z1 - 1, x1 - 19, z1 + 22, 1.1); lamp(b, x1 - 18.9, z1 + 10, 1.1); boatsDeco.push([x1 - 16, z1 + 18, 0.4, '#3d8fd9']); }   // cầu tàu chỉ khi phía trước là biển
    });
  }
  // ================= VÒNG NHÀ Ở QUANH TRƯỜNG: đường vòng (π), 8 đường hướng tâm (2π/8), lô đất có sân vườn (φ) =================
  measure(B.ground, 'ring-roads', () => {
    const G = B.ground, rIn = RING_ROAD_R - ROAD_W / 2, rOut = RING_ROAD_R + ROAD_W / 2;
    G.push(new THREE.RingGeometry(rIn, rOut, 128, 1).rotateX(-Math.PI / 2), '#cbbd9f', 0, Y + 0.022, 0);
    for (const r of [rIn, rOut - 0.3]) G.push(new THREE.RingGeometry(r, r + 0.3, 128, 1).rotateX(-Math.PI / 2), '#a9a297', 0, Y + 0.03, 0);   // bó vỉa
    for (const R of RADIALS) {
      let r0 = R.r0, r1 = R.r1; const ry = Math.atan2(R.c, R.s), seg = (a, b, col, w = ROAD_W, y = 0.015) => { const m = (a + b) / 2; G.box(w, 0.04, b - a, R.c * m, Y + y - 0.02, R.s * m, col, ry); };
      // đoạn qua hồ bán nguyệt: cầu gỗ (đi được nhờ ctx.decks)
      const wet = []; for (let t = r0; t < r1; t += 0.5) if (lagoonDist(R.c * t, R.s * t) < 1.5) wet.push(t);
      if (wet.length) { const a = wet[0], b = wet[wet.length - 1]; seg(r0, a, '#cbbd9f'); seg(b, r1, '#cbbd9f'); const [x0, z0, x1, z1] = [R.c * a, R.s * a, R.c * b, R.s * b]; deck(G, Math.min(x0, x1) - 2, Math.min(z0, z1), Math.max(x0, x1) + 2, Math.max(z0, z1), Y, true, '#c08a52'); for (const sd of [-1, 1]) G.box(0.12, 0.9, b - a, R.c * (a + b) / 2 + sd * 2 * Math.abs(R.s), Y, R.s * (a + b) / 2 + sd * 2 * Math.abs(R.c), '#8a5a34', ry); }
      else seg(r0, r1, '#cbbd9f');
      for (const sd of [-1, 1]) { const ox = -R.s * sd * (ROAD_W / 2 - 0.15), oz = R.c * sd * (ROAD_W / 2 - 0.15); G.box(0.3, 0.06, r1 - r0, R.c * (r0 + r1) / 2 + ox, Y + 0.01, R.s * (r0 + r1) / 2 + oz, '#a9a297', ry); }
      // 2 đèn đường ở chỗ đường hướng tâm gặp đường vòng
      for (const sd of [-1, 1]) { const a = R.a + sd * (ROAD_W / 2 + 1.2) / RING_ROAD_R, rr = RING_ROAD_R + ROAD_W / 2 + 0.8; lamp(B.parks, Math.cos(a) * rr, Math.sin(a) * rr); }
    }
  });
  // một lô đất: thảm cỏ, bờ giậu thấp chừa cổng, lối đi lát đá từ cổng tới cửa nhà, bồn hoa trước nhà, 2 cây ăn quả, ghế
  const FRUIT = ['#ff8a1f', '#e8392f', '#f5c518'];
  const lotGarden = (L, withHouse) => {
    const b = B.parks, g = B.ground, hw = LOT_W / 2, hl = LOT_L / 2, gate = 1.1;
    g.group(L.cx, Y, L.cz, L.ry, () => {
      g.plane(LOT_W, LOT_L, 0, 0.012, 0, withHouse ? '#8fcf6a' : '#9bd67a', 0, -Math.PI / 2);
      if (withHouse) for (let v = HOUSE_V1 + 0.5, k = 0; v < hl - 0.3; v += 0.85, k++) g.box(1.15, 0.05, 0.6, (k % 2 - 0.5) * 0.18, 0.012, v, k % 2 ? '#d8cdb5' : '#cfc2a6');   // đá lát
      else { g.push(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), '#d8cdb5', 0, 0.02, 1.5, 0, 0, 0, 5.4, 1, 5.4); for (let v = 1.5 + 5.4, k = 0; v < hl - 0.3; v += 0.85, k++) g.box(1.15, 0.05, 0.6, 0, 0.012, v, k % 2 ? '#d8cdb5' : '#cfc2a6'); }
    });
    b.group(L.cx, Y, L.cz, L.ry, () => {
      // bờ giậu (chừa cổng rộng 2,2 m ở mặt tiền)
      b.box(LOT_W, 0.55, 0.45, 0, 0, -hl + 0.22, '#4f9a3a');
      for (const sd of [-1, 1]) { b.box(0.45, 0.55, LOT_L, sd * (hw - 0.22), 0, 0, '#4f9a3a'); b.box(hw - gate, 0.55, 0.45, sd * (gate + (hw - gate) / 2), 0, hl - 0.22, '#4f9a3a'); b.box(0.35, 0.9, 0.35, sd * gate, 0, hl - 0.22, '#e9e2d2'); }
      if (withHouse) {
        for (const sd of [-1, 1]) { b.box(3.2, 0.3, 0.9, sd * 3.6, 0, HOUSE_V1 + 0.8, '#a9744a'); const d = DG.follow(b); for (let i = 0; i < 6; i++) d.ball(0.24, sd * (2.35 + i * 0.5), 0.45, HOUSE_V1 + 0.8, ['#e8392f', '#f5c518', '#e85d8a', '#ffffff'][(i + L.j) % 4], 1, 0.8, 1); }
        b.group(-hw + 1.6, 0, HOUSE_V1 + 7, Math.PI / 2, () => { b.box(1.8, 0.14, 0.55, 0, 0.42, 0, '#bdb8ae'); for (const sd of [-1, 1]) b.box(0.18, 0.42, 0.5, sd * 0.7, 0, 0, '#a19c93'); });   // ghế đá
        b.box(0.3, 1.1, 0.3, gate + 0.6, 0, hl - 0.9, '#6b4a2b'); b.box(0.5, 0.35, 0.35, gate + 0.6, 1.1, hl - 0.9, '#e8392f');   // hòm thư
      } else {
        const d = DG.follow(b); for (let i = 0; i < 21; i++) { const a = i / 21 * Math.PI * 2; d.ball(0.3, Math.cos(a) * 4.2, 0.3, 1.5 + Math.sin(a) * 4.2, ['#e8392f', '#f5c518', '#e85d8a', '#9b59d0', '#ffffff'][i % 5], 1, 0.8, 1); }
        b.cyl(0.5, 0.6, 0.6, 0, 0, 1.5, '#e2dccc', 8); b.ball(0.45, 0, 0.9, 1.5, '#bfe9f6');
        for (const sd of [-1, 1]) b.group(sd * 6.6, 0, 1.5, sd * Math.PI / 2, () => { b.box(1.8, 0.14, 0.55, 0, 0.42, 0, '#bdb8ae'); for (const k of [-1, 1]) b.box(0.18, 0.42, 0.5, k * 0.7, 0, 0, '#a19c93'); });
      }
    });
    // cây ăn quả trong sân (cách nhà, lối đi và bờ giậu)
    for (const [u, v] of withHouse ? [[LOT_W * 0.3, HOUSE_V1 + 5], [-LOT_W * 0.27, HOUSE_V1 + 13], [LOT_W * 0.28, HOUSE_V1 + 15]] : [[-LOT_W * 0.3, -LOT_L * 0.3], [LOT_W * 0.3, -LOT_L * 0.3], [0, -LOT_L * 0.36]]) {
      const [x, z] = lotToWorld(L, u, v); trees.push([x, z, 'fruit', 0.7]);
      const d = DG.follow(null); for (let i = 0; i < 5; i++) { const a = i * 1.26 + L.j; d.ball(0.12, x + Math.cos(a) * 0.65, Y + 1.25 + (i % 2) * 0.35, z + Math.sin(a) * 0.65, FRUIT[(L.j + i) % 3]); }
    }
  };
  measure(B.parks, 'lots', () => { for (const L of HOUSE_LOTS) lotGarden(L, !!L.house); for (const L of GARDEN_LOTS) lotGarden(L, false); });
  // bờ giậu & nền nhà là chướng ngại: va chạm thấp cho bờ giậu (vòng tròn nhỏ dọc 3 cạnh, chừa cổng)
  for (const L of LOTS) { for (let v = -LOT_L / 2 + 0.6; v < LOT_L / 2; v += 1.2) for (const sd of [-1, 1]) { const [x, z] = lotToWorld(L, sd * (LOT_W / 2 - 0.22), v); ctx.colliders.push({ x, z, r: 0.35 }); }
    for (let u = -LOT_W / 2 + 0.4; u < LOT_W / 2; u += 1.1) { const [x, z] = lotToWorld(L, u, -LOT_L / 2 + 0.22); ctx.colliders.push({ x, z, r: 0.35 }); if (Math.abs(u) > 1.6) { const [x2, z2] = lotToWorld(L, u, LOT_L / 2 - 0.22); ctx.colliders.push({ x: x2, z: z2, r: 0.35 }); } } }

  // BẢNG THÔNG TIN ở quảng trường trước cổng: tỷ lệ vàng φ và số π (nội dung học)
  if (RS.GATE) {
    const gx = X3(RS.GATE[0]), gz = Z3(RS.GATE[1]), bx = SPAWN[0] - 1, bz = gz - 9.6;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const k = c.getContext('2d');
    k.fillStyle = '#fff6df'; k.fillRect(0, 0, 1024, 640); k.strokeStyle = '#7a5a2e'; k.lineWidth = 14; k.strokeRect(7, 7, 1010, 626);
    k.fillStyle = '#7a1f2b'; k.font = 'bold 50px system-ui'; k.textAlign = 'center'; k.fillText('Thị trấn của chúng mình xây bằng Toán!', 512, 70);
    k.textAlign = 'left'; const line = (t, x, y, f = '30px system-ui', col = '#3b2a1e') => { k.font = f; k.fillStyle = col; k.fillText(t, x, y, 470); };
    line('φ  Tỷ lệ vàng ≈ 1,618', 30, 140, 'bold 40px system-ui', '#b5432f');
    ['Dãy Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21…', 'mỗi số = tổng 2 số liền trước.', 'Lấy số sau chia số trước → gần 1,618.', `Mỗi lô đất: ${LOT_W} m × ${LOT_L} m (21 : 13 ≈ φ)`, `Ngôi nhà: ${HOUSE_W.toFixed(0)} m × ${HOUSE_D.toFixed(0)} m (8 : 5 ≈ φ)`, `Sân trước nhà dài ${Math.round(LOT_L / 2 - HOUSE_V1)} m.`].forEach((t, i) => line(t, 30, 195 + i * 50));
    line('π  Số Pi ≈ 3,14', 530, 140, 'bold 40px system-ui', '#2b63d9');
    ['Chu vi hình tròn = π × đường kính.', `Đường vòng quanh trường: bán kính ${RING_ROAD_R} m`, `→ dài 2 × π × ${RING_ROAD_R} ≈ ${Math.round(2 * Math.PI * RING_ROAD_R)} m.`, `${ZONES_N} khu vui chơi cách đều 2π/${ZONES_N} = 45°.`, `${LOTS_N} lô đất cách đều 2π/${LOTS_N} = 22,5°.`, 'Thử đếm bước đi hết một vòng nhé!'].forEach((t, i) => line(t, 530, 195 + i * 50));
    // hình minh hoạ: xoắn ốc vàng & hình tròn
    k.strokeStyle = '#e9b949'; k.lineWidth = 5; k.beginPath(); for (let t = 0; t < 12.6; t += 0.05) { const r = 3 * Math.pow(PHI, t * 2 / Math.PI); const x = 300 + Math.cos(t) * r, y = 560 - Math.sin(t) * r * 0.9; t ? k.lineTo(x, y) : k.moveTo(x, y); if (r > 70) break; } k.stroke();
    k.strokeStyle = '#2b63d9'; k.beginPath(); k.arc(770, 560, 55, 0, Math.PI * 2); k.stroke(); k.beginPath(); k.moveTo(715, 560); k.lineTo(825, 560); k.stroke(); k.fillStyle = '#2b63d9'; k.font = 'bold 26px system-ui'; k.fillText('d', 762, 552);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const g = new THREE.Group(); g.position.set(bx, Y, bz); g.rotation.y = -0.35; scene.add(g);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.0), new THREE.MeshToonMaterial({ map: tex, gradientMap })); panel.position.set(0, 2.3, 0.08); g.add(panel); extraMeshes.push(panel);
    B.gate.group(bx, Y, bz, -0.35, () => { B.gate.box(5.2, 3.4, 0.14, 0, 0.6, 0, '#8a5a34'); for (const sd of [-1, 1]) B.gate.box(0.22, 4.2, 0.22, sd * 2.5, 0, 0, '#6b4a2b'); B.gate.prism(5.8, 0.6, 0.6, 0, 4.2, 0, '#9c3b2e'); });
    ctx.colliders.push({ x: bx - 2.3, z: bz, r: 0.4 }, { x: bx + 2.3, z: bz, r: 0.4 });
    addFoot(bx - 2.7, bz - 0.6, bx + 2.7, bz + 0.6);
    const info = `<b>φ – Tỷ lệ vàng ≈ 1,618</b><br>Dãy Fibonacci 1, 1, 2, 3, 5, 8, 13, 21… (mỗi số bằng tổng 2 số liền trước). Chia số sau cho số trước: 21 : 13 ≈ 1,615 — càng về sau càng gần φ. Mỗi lô đất ở đây rộng ${LOT_W} m, sâu ${LOT_L} m; ngôi nhà ${HOUSE_W.toFixed(0)} × ${HOUSE_D.toFixed(0)} m.<br><br><b>π – Số Pi ≈ 3,14</b><br>Chu vi hình tròn = π × đường kính. Đường vòng quanh trường có bán kính ${RING_ROAD_R} m nên dài khoảng ${Math.round(2 * Math.PI * RING_ROAD_R)} m. ${ZONES_N} khu vui chơi xếp đều trên vòng tròn, mỗi khu cách nhau 2π/${ZONES_N} = 45°.`;
    env.infoBoard = { x: bx, z: bz, html: info };
  }

  // Cây dừa dọc bờ biển quanh đảo
  for (let i = 0; i < (low ? 60 : 120); i++) { const a = rnd() * 6.28, r = ISLAND_R * (0.72 + rnd() * 0.33), x = Math.cos(a) * r, z = Math.sin(a) * r, h = hgt(x, z); if (h > 0.5 && h < 1.6 && !blocked(x, z, 2)) palmAt(x, z, h - 0.05); }
  // dừa quanh hồ bán nguyệt
  for (let i = 0; i < (low ? 8 : 14); i++) { const a = Math.PI * (0.08 + 0.84 * i / ((low ? 8 : 14) - 1)), x = LAGOON.x + Math.cos(a) * (LAGOON.r + 3.5), z = LAGOON.z + Math.sin(a) * (LAGOON.r + 3.5), h = hgt(x, z); if (h > 0.4 && !blocked(x, z, 1.5)) palmAt(x, z, h - 0.05); }
  { const A = BLOCKS[0].r; for (let x = A[0] + 6; x < A[2]; x += low ? 14 : 9) { const z = A[3] - 3 - rnd() * 4; if (!nearDoor(x, z, 3)) palmAt(x, z, Y); } }

  // ================= CHI TIẾT SÂN TRƯỜNG & MÔI TRƯỜNG (lưới chi tiết, chỉ hiện gần người chơi) =================
  {
    const G = B.ground, d = DG.follow(null);
    const at = (x2, y2) => P(x2, y2);
    // ven hồ: lau sậy
    for (const e of [D.POND, D.LAKE, D.LOTUS]) { if (!e) continue; const [cx, cz] = at(e.cx, e.cy), rx = e.rx * S, rz = e.ry * S; for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, k = 0.93 + rnd() * 0.08; const x = cx + Math.cos(a) * rx * k, z = cz + Math.sin(a) * rz * k; for (let j = 0; j < 3; j++) d.cone(0.06, 0.9 + rnd() * 0.5, x + (j - 1) * 0.15, Y, z + (rnd() - 0.5) * 0.3, j % 2 ? '#6f9f3a' : '#8fbf4a', 3); if (i % 3 === 0) d.box(0.06, 0.2, 0.06, x, Y + 1.2, z, '#7a5230'); } }
    // thiên nhiên quanh đảo và giữa các khu: bụi cây có hoa, cụm hoa, cỏ cao, đá ven bờ
    const H_ = (x, z) => ctx.terrain.heightAt(x, z), SL = (x, z) => ctx.terrain.slopeAt(x, z);
    const N = low ? 2200 : 4200;
    for (let i = 0; i < N; i++) {
      const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * ISLAND_R * 1.08, x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = H_(x, z); if (h < 0.15) continue;
      let inside = false; for (const r of ALL) if (x > r[0] - 1 && x < r[2] + 1 && z > r[1] - 1 && z < r[3] + 1) { inside = true; break; } if (inside || blocked(x, z, 1.5) || isBuilt(x, z, 1.5)) continue;
      if (h < 0.9) { if (rnd() < 0.5) d.push(new THREE.DodecahedronGeometry(0.3 + rnd() * 0.6, 0), rnd() < 0.5 ? '#a7a29a' : '#bdb6aa', x, h, z, rnd() * 6, 0, 0, 1.2, 0.7, 1); continue; }
      if (SL(x, z) > 0.8) continue;
      const k = rnd();
      if (k < 0.35) { const c = ['#4f9a3a', '#5aa04a', '#3f8a3a'][i % 3]; d.ball(0.6, x, h + 0.35, z, c, 1.2, 0.8, 1.1); d.ball(0.45, x + 0.5, h + 0.25, z + 0.2, c, 1, 0.8, 1); if (i % 2) d.ball(0.12, x + 0.2, h + 0.85, z + 0.3, ['#e85d8a', '#f5c518', '#ffffff'][i % 3]); }
      else if (k < 0.7) { for (let j = 0; j < 5; j++) { const fx = x + (rnd() - 0.5) * 1.2, fz = z + (rnd() - 0.5) * 1.2; d.cone(0.03, 0.4, fx, h, fz, '#5aa04a', 3); d.ball(0.1, fx, h + 0.42, fz, ['#e8392f', '#f5c518', '#e85d8a', '#ffffff', '#9b59d0'][(i + j) % 5]); } }
      else { for (let j = 0; j < 4; j++) d.cone(0.09, 0.7 + rnd() * 0.5, x + (rnd() - 0.5) * 0.6, h, z + (rnd() - 0.5) * 0.6, j % 2 ? '#7cb84a' : '#9ccf5a', 3); }
    }
  }
  // sự sống: bướm ở vườn hoa/safari/học viện, hải âu trên biển, cờ bay
  const flies = [];
  for (const k of ['flowerfield', 'garden']) { const r = R[k]; if (!r) continue; for (let i = 0; i < (low ? 6 : 12); i++) { const [x, z] = P(r.x + rnd() * r.w, r.y + rnd() * r.h); flies.push({ x, y: Y, z }); } }
  for (const id of ['F', 'G', 'H']) { const r = ZR[id]; if (r) for (let i = 0; i < 5; i++) flies.push({ x: r[0] + rnd() * (r[2] - r[0]), y: Y, z: r[1] + rnd() * (r[3] - r[1]) }); }
  const gulls = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; gulls.push({ x: Math.cos(a) * (ISLAND_R + 15), y: 16 + rnd() * 10, z: Math.sin(a) * (ISLAND_R + 15), r: 10 + rnd() * 16, v: 0.25 + rnd() * 0.25, ph: rnd() * 6 }); }
  let flagTex = null; if (flagAt) { const c = document.createElement('canvas'); c.width = 96; c.height = 64; const k = c.getContext('2d'); k.fillStyle = '#da251d'; k.fillRect(0, 0, 96, 64); k.fillStyle = '#ffde00'; k.beginPath(); for (let i = 0; i < 10; i++) { const r2 = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; k.lineTo(48 + Math.cos(a) * r2, 34 + Math.sin(a) * r2); } k.fill(); flagTex = new THREE.CanvasTexture(c); flagTex.colorSpace = THREE.SRGBColorSpace; }
  const life = createLife(scene, { butterflies: flies, gulls, flag: flagAt && Object.assign({ tex: flagTex }, flagAt) });

  // ================= XUẤT RA SCENE =================
  const mat = toon('#ffffff', { vertexColors: true }), out = [...extraMeshes];
  for (const k of Object.keys(B)) { const m = B[k].mesh(mat, k !== 'ground'); if (!m) continue; if (k !== 'ground') addOutline(m); scene.add(m); out.push(m); }
  out.push(...SZ.meshes);
  { const [mb, mg] = detailMats(); DG.build(scene, mb, mg); }
  const sm = atlas.mesh(); if (sm) { sm.position.y = 0; scene.add(sm); out.push(sm); }
  // nước
  if (waters.length) {
    const wb = new Batch('water'); for (const [x, z, rx, rz] of waters) wb.push(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), '#ffffff', x, Y + 0.04, z, 0, 0, 0, rx, 1, rz);
    const wm = wb.mesh(toon('#3fa2d4', { transparent: true, opacity: 0.88, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, vertexColors: true }), false); wm.castShadow = false; scene.add(wm); out.push(wm);
  }
  // instanced: cây, hoa, lá sen
  const inst = (geo, material, list, setM, outline = false, shadow = true) => {
    if (!list.length) return null; const im = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach((q, i) => { const f = setM(q, _o); if (typeof f === 'function') f(q, _o); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); if (q.col) im.setColorAt(i, _c.set(q.col)); });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = shadow; im.receiveShadow = true; scene.add(im); out.push(im);
    if (outline) { const ol = new THREE.InstancedMesh(geo, outlineMat, list.length); ol.instanceMatrix = im.instanceMatrix; ol.frustumCulled = false; ol.raycast = () => {}; scene.add(ol); out.push(ol); }
    return im;
  };
  const set = (x, y, z, s, ry = 0) => (q, o) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(s, s, s); };
  const LEAF = ['#5aa04a', '#6cb84f', '#4f9a3a', '#7cc45a'], PHUONG = ['#e8452f', '#f05a2b', '#e83a3a'], PINE = ['#2f7a4a', '#3a8a52', '#2b6b44'];
  // lọc lần cuối: cây/hoa không bao giờ mọc trong nhà, tường, nền công trình, mặt đường (bán kính tán/thân)
  const plantR = k => k === 'pine' ? 1.0 : k === 'fruit' ? 0.7 : 1.1;
  const nT = trees.length; for (let i = trees.length - 1; i >= 0; i--) { const [x, z, k, s] = trees[i]; if (isBuilt(x, z, plantR(k) * s)) trees.splice(i, 1); }
  const nP = palms.length; for (let i = palms.length - 1; i >= 0; i--) if (isBuilt(palms[i].x, palms[i].z, 0.5)) palms.splice(i, 1);
  const nF = fl.length; for (let i = fl.length - 1; i >= 0; i--) if (isBuilt(fl[i][0], fl[i][1], 0.2)) fl.splice(i, 1);
  if (env.debug !== false) console.info('[town-buildings] bỏ cây/dừa/hoa trùng công trình:', nT - trees.length, nP - palms.length, nF - fl.length);
  const T2 = trees.map(([x, z, k, s]) => ({ x, z, k, s, ry: rnd() * 6.28, col: (k === 'pine' ? PINE : k === 'phuong' ? PHUONG : LEAF)[Math.floor(rnd() * 3)] }));
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.4, 5).translate(0, 0.7, 0);
  const crownGeo = mergeGeometries([new THREE.IcosahedronGeometry(1.0, 0).translate(0, 2.1, 0), new THREE.IcosahedronGeometry(0.7, 0).translate(0.55, 1.75, 0.2), new THREE.IcosahedronGeometry(0.65, 0).translate(-0.5, 1.85, -0.3), new THREE.IcosahedronGeometry(0.55, 0).translate(0.1, 2.85, 0.1)].map(g => { g.deleteAttribute('uv'); return g; }));
  const pineGeo = mergeGeometries([new THREE.ConeGeometry(1.1, 1.8, 7).translate(0, 1.9, 0), new THREE.ConeGeometry(0.8, 1.5, 7).translate(0, 2.8, 0), new THREE.ConeGeometry(0.5, 1.1, 7).translate(0, 3.6, 0)].map(g => g.toNonIndexed()).map(g => { g.deleteAttribute('uv'); g.computeVertexNormals(); return g; }));
  inst(trunkGeo, toon('#7a5230'), T2, q => set(q.x, Y, q.z, q.s * (q.k === 'pine' ? 1.1 : 1), q.ry), false);
  const leafy = T2.filter(q => q.k !== 'pine'), pines = T2.filter(q => q.k === 'pine');
  inst(crownGeo, toon('#ffffff'), leafy, q => set(q.x, Y, q.z, q.s, q.ry), true);
  inst(pineGeo, toon('#ffffff'), pines, q => set(q.x, Y, q.z, q.s, q.ry), true);
  inst(new THREE.CylinderGeometry(1, 1, 0.04, 7), toon('#4f9a3a'), pads, ([x, z, s]) => set(x, Y + 0.07, z, s, x * 3), false, false);
  inst(new THREE.ConeGeometry(0.22, 0.4, 5), toon('#ff9ec4'), flowers, ([x, z]) => set(x + 0.1, Y + 0.12, z, 1, 0), false, false);
  inst(new THREE.ConeGeometry(0.16, 0.42, 4).translate(0, 0.21, 0), toon('#ffffff'), fl.map(([x, z, col]) => ({ x, z, col })), q => set(q.x, Y, q.z, 1, q.x), false, false);

  // cây dừa: thân cong (4 đốt) + 7 tàu lá (InstancedMesh, có viền)
  if (palms.length) {
    const seg = [], frond = [];
    for (let i = 0; i < 4; i++) seg.push(new THREE.CylinderGeometry(0.16 - i * 0.02, 0.2 - i * 0.02, 1.25, 6).translate(i * i * 0.09, 0.62 + i * 1.18, 0));
    for (let i = 0; i < 7; i++) { const g = new THREE.BoxGeometry(0.5, 0.06, 2.4).translate(0, 0, 1.15); g.rotateX(0.38).rotateY(i / 7 * 6.28); g.translate(0.85, 4.75, 0); frond.push(g); }
    const tg = mergeGeometries(seg.map(g => { g.deleteAttribute('uv'); return g.toNonIndexed(); })), fg = mergeGeometries(frond.map(g => { g.deleteAttribute('uv'); return g.toNonIndexed(); }));
    fg.computeVertexNormals();
    const pset = q => (q2, o) => { o.position.set(q.x, q.y, q.z); o.rotation.set(0, q.ry, 0); o.scale.set(q.s, q.s, q.s); };
    inst(tg, toon('#9a6a3e'), palms, pset, false);
    inst(fg, toon('#ffffff'), palms.map(q => Object.assign({}, q, { col: ['#4fae47', '#5cbf4a', '#3f9a42'][Math.floor(rnd() * 3)] })), pset, true);
  }
  // thuyền buồm neo (trang trí, nhấp nhô nhẹ trong update)
  const decoBoats = [];
  if (boatsDeco.length) {
    const bb = new Batch('boat'); bb.group(0, 0, 0, 0, () => { bb.box(1.3, 0.5, 3.2, 0, -0.2, 0, '#ffffff'); bb.box(1.1, 0.06, 2.8, 0, 0.3, 0, '#a87445'); bb.cyl(0.05, 0.05, 3.2, 0, 0.3, 0.5, '#8a5a34', 5); bb.push(new THREE.ConeGeometry(1, 2.6, 3).scale(0.05, 1, 0.9), '#f4efe4', 0, 1.9, 0.05); });
    const bg = mergeGeometries(bb.geos);
    for (const [x, z, ry, col] of boatsDeco) { const m = new THREE.Mesh(bg, mat); m.position.set(x, 0, z); m.rotation.y = ry; m.castShadow = true; const band = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.16, 3.0), toon(col)); band.position.y = 0.05; m.add(band); addOutline(m); scene.add(m); decoBoats.push(m); out.push(m); }
  }
  // ẩn công trình ở quá xa (sau sương mù) để giữ FPS
  for (const m of decoBoats) m.updateMatrixWorld();
  const far = out.filter(m => m.isMesh && m.geometry && !decoBoats.includes(m)).map(m => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const c = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrixWorld); return { m, c, r: m.geometry.boundingSphere.radius }; });
  let upT = 0;
  function update(p, t, dt = 0.016) {
    life.update(t, p);
    SZ.update(p, dt);
    for (const [i, m] of decoBoats.entries()) { m.position.y = Math.sin(t * 1.4 + i) * 0.08; m.rotation.z = Math.sin(t * 1.1 + i * 2) * 0.05; }
    if ((upT -= dt) > 0) return; upT = 0.3; DG.update(p, 60);
    const fogFar = (scene.fog && scene.fog.far) || 300;
    for (const q of far) if (!q.m.isInstancedMesh) q.m.visible = q.c.distanceTo(p) - q.r < fogFar + 10;
  }
  if (env.debug !== false) console.info('[town-buildings] tam giác mỗi công trình:', budget, '— draw call kiến trúc:', out.length);
  const plants = [...T2.map(q => [q.x, q.z, plantR(q.k) * q.s, q.k]), ...palms.map(q => [q.x, q.z, 0.5, 'palm']), ...fl.map(([x, z]) => [x, z, 0.2, 'flower'])];
  return { meshes: out, budget, update, plants, foot, footC, isBuilt };
}
