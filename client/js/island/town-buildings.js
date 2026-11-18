// town-buildings.js — KIẾN TRÚC THỊ TRẤN TRƯỜNG RUBIK (low-poly toon, thay cho greybox).
// Chỉ lo phần NHÌN: lớp học, hội trường, văn phòng, cổng, cột cờ, ghế đá, nhà ở, phố Đà Lạt, sân bóng, cờ khổng lồ,
// tượng đài Rubik, hồ/đầm sen, nông trại, cây. Va chạm tường/nhà vẫn do school-town.js đẩy vào ctx.boxes như cũ.
// Tối ưu: mọi khối dùng chung 1 vật liệu toon tô màu theo đỉnh, gộp (merge) theo khu → vài draw call;
//         cây, hoa, lá sen dùng InstancedMesh; chữ bảng tên gom vào 1 tấm atlas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, addOutline, outlineMat, gradientMap } from './style.js';
import { BLOCKS, EXTRA, blockOf2D, SPAWN, WORLD, PHI, ISLAND_R, ZONES_N, zoneAngle, LOTS, LOTS_N, HOUSE_LOTS, GARDEN_LOTS, lotToWorld, HOUSE_W, HOUSE_D, HOUSE_V1, LOT_W, LOT_L, LOT_BACK,
  RING_ROAD_R, ROAD_W, RADIALS, LAGOON, MEADOWS, lotAt, landDist, pathDist, PATH_W, blocked, houseAt, roadDist, lagoonDist } from './layout.js';
import { Batch, DetailGrid, createLife, detailMats } from './decor.js';
import { buildSchoolZone, rubikCube as rubikCubeReal } from './zone-school.js';
import { buildZoneEast } from './zone-east.js';
import { buildExtraZones, buildBoats, placePalms } from './zone-extra.js';
import { buildNorth, house } from './zone-north.js';
import { buildZen } from './zone-zen.js';
import * as MAP from './data/map.js';

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

// ---------- Dữ liệu phụ của bản đồ (hồ, đèn, cây, lều, phố Đà Lạt…) — lớp dữ liệu riêng island/data/map.js ----------
const D_KEYS = ['LAKE', 'LOTUS', 'POND', 'GBOARD', 'RMON', 'FLAG', 'LAMPS', 'TREES', 'FOREST_TREES', 'TENTS', 'DALAT', 'BOOTH', 'CHESS_T', 'MUSIC_SPOTS', 'TRAIL', 'FOREST_GATES'];
const readExtra = () => Object.fromEntries(D_KEYS.map(k => [k, MAP[k]]));

export function buildTownArchitecture(ctx, RS, env) {
  const { scene } = ctx, { P, S, Y, H, T, gap } = env, R = RS.R, D = readExtra(), low = !!ctx.lowEnd;
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
  const isBuilt = (x, z, m = 0.6) => foot.some(q => inRect(q, x, z, m)) || footC.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + m) || ctx.boxes.some(q => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m) || !!houseAt(x, z, m) || roadDist(x, z) < ROAD_W / 2 + m || pathDist(x, z) < PATH_W / 2 + m;

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
  // ================= DỰNG =================
  // KHU TRƯỜNG (lớp học, cổng, quảng trường, cột cờ, sân trường, sân chơi, sân bóng): zone-school.js
  const SZ = buildSchoolZone({ ctx, RS, env, D, atlas, signAt, measure, budget, X3, Z3, DG, nearDoor, inRoom, rnd, chessPiece, addFoot }); flagAt = SZ.flagAt;

  // Khu phía bắc (nhà ở trên lô, phố Đà Lạt, bàn cờ khổng lồ, tượng đài, hồ, cánh đồng hoa, rừng thông, nông trại): zone-north.js
  const pads = [], flowers = [], waters = [], fl = [], north = buildNorth({ ctx, RS, R, D, B, DG, atlas, signAt, measure, chessPiece, rubikCube, X3, Z3, Y, S, nearDoor, reg, rnd, low, pads, flowers, waters, isBuilt });

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
  // không trồng cây chắn tầm nhìn lúc vừa vào game (điểm xuất phát + đoạn camera phía sau)
  const clearView = (x, z) => Math.hypot(x - SPAWN[0], z - SPAWN[1]) > 9 && !(x > SPAWN[0] - 16 && x < SPAWN[0] + 3 && Math.abs(z - SPAWN[1]) < 5);
  const palmAt = (x, z, y, s = 1) => clearView(x, z) && palms.push({ x, z, y, s: s * (0.85 + rnd() * 0.4), ry: rnd() * 6.28, lean: 0.15 + rnd() * 0.25 });

  // E Làng nổi · F Safari · G Học viện Hoa Phượng · H Resort + cầu gỗ/đá/cỏ bờ biển: xem zone-extra.js
  const extra = buildExtraZones(ctx, { B, ZR, ALL, Y, DG, atlas, signAt, measure, trees, rnd, low, palmAt, addFoot, addFootC });

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
      // lô mở (thế giới mở, không rào chắn): chỉ viền đá thấp sát đất + bụi tròn ở 4 góc, đi vào từ mọi phía
      for (const sd of [-1, 1]) { b.box(0.25, 0.1, LOT_L, sd * (hw - 0.12), 0, 0, '#cfc6b4'); b.ball(0.7, sd * (hw - 0.7), 0.45, -hl + 0.7, '#4f9a3a', 1, 0.75, 1); b.ball(0.7, sd * (hw - 0.7), 0.45, hl - 0.7, '#4f9a3a', 1, 0.75, 1); }
      b.box(LOT_W, 0.1, 0.25, 0, 0, -hl + 0.12, '#cfc6b4');
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
  // HÀNG CÂY & ĐÈN dọc đường vòng và 8 đường hướng tâm (cách nhau ≈ 13 m — Fibonacci), tránh lô, khu, hồ, nút giao
  {
    const okTree = (x, z) => !lotAt(x, z, 1.5) && landDist(x, z) > 2 && lagoonDist(x, z) > 3 && roadDist(x, z) > ROAD_W / 2 + 1.2 && pathDist(x, z) > PATH_W / 2 + 1.5;
    const nRing = 42;   // 2π·R / 42 ≈ 13 m
    for (const [rr, kind] of [[RING_ROAD_R - ROAD_W / 2 - 2.2, 'phuong'], [RING_ROAD_R + ROAD_W / 2 + 2.2, 'leaf']]) for (let i = 0; i < nRing; i++) {
      const a = (i + 0.5) / nRing * Math.PI * 2, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (RADIALS.some(R => Math.abs(Math.atan2(Math.sin(a - R.a), Math.cos(a - R.a))) * rr < 7)) continue;
      if (okTree(x, z)) trees.push([x, z, kind, 0.95 + rnd() * 0.15]);
    }
    for (const R of RADIALS) {
      const px = -R.s, pz = R.c, off = ROAD_W / 2 + 2.2;
      for (let t = R.r0 + 6, k = 0; t < R.r1 - 6; t += 13, k++) {
        if (Math.abs(t - RING_ROAD_R) < 9) continue;
        for (const sd of [-1, 1]) { const x = R.c * t + px * sd * off, z = R.s * t + pz * sd * off; if (okTree(x, z)) trees.push([x, z, k % 2 ? 'leaf' : 'phuong', 0.95 + rnd() * 0.15]); }
        if (k % 2 === 0 && t > RING_ROAD_R + 12) { const sd = k % 4 ? 1 : -1, x = R.c * (t + 6.5) + px * sd * (ROAD_W / 2 + 0.8), z = R.s * (t + 6.5) + pz * sd * (ROAD_W / 2 + 0.8); if (lagoonDist(x, z) > 2 && landDist(x, z) > 2) lamp(B.parks, x, z); }
      }
    }
  }
  // VƯỜN TRÒN (π) ở bãi cỏ trống giữa thị trấn và các khu: lối sỏi tròn, vòng hoa, cây phượng ở tâm, 3 ghế cách nhau 2π/3
  measure(B.parks, 'meadows', () => { for (const M of MEADOWS) {
    const g = B.ground, b = B.parks, d = DG.follow(null);
    g.push(new THREE.CircleGeometry(M.r, 32).rotateX(-Math.PI / 2), '#a6d97f', M.x, Y + 0.012, M.z);
    g.push(new THREE.RingGeometry(M.r * 0.62, M.r * 0.62 + 1.3, 40, 1).rotateX(-Math.PI / 2), '#d8cdb5', M.x, Y + 0.02, M.z);
    // lối nối vào đường gần nhất (hướng về tâm thế giới)
    { const P = M.path, L = Math.hypot(P.bx - P.ax, P.bz - P.az), ux = (P.bx - P.ax) / L, uz = (P.bz - P.az) / L, t0 = M.r * 0.62 + 1.3 - M.r * 0.7; for (let t = t0, k = 0; t < L + 0.3; t += 0.85, k++) g.box(1.2, 0.05, 0.6, P.ax + ux * t, Y + 0.012, P.az + uz * t, k % 2 ? '#d8cdb5' : '#cfc2a6', P.ry); }
    for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2, r = M.r * 0.88; d.ball(0.26, M.x + Math.cos(a) * r, Y + 0.28, M.z + Math.sin(a) * r, ['#e8392f', '#f5c518', '#e85d8a', '#9b59d0', '#ffffff'][(i + M.k) % 5], 1, 0.8, 1); }
    trees.push([M.x, M.z, M.k % 2 ? 'phuong' : 'leaf', 1.25]);
    for (let i = 0; i < 3; i++) { const a = M.a + Math.PI / 3 + i * 2 * Math.PI / 3, r = M.r * 0.62 - 1.1; b.group(M.x + Math.cos(a) * r, Y, M.z + Math.sin(a) * r, Math.atan2(-Math.cos(a), -Math.sin(a)), () => { b.box(1.8, 0.14, 0.55, 0, 0.42, 0, '#bdb8ae'); for (const s2 of [-1, 1]) b.box(0.18, 0.42, 0.5, s2 * 0.7, 0, 0, '#a19c93'); }); addFoot(M.x + Math.cos(a) * r - 1, M.z + Math.sin(a) * r - 1, M.x + Math.cos(a) * r + 1, M.z + Math.sin(a) * r + 1); }
  } });

  // BẢNG THÔNG TIN φ & π: dời vào quảng trường mẫu (sample/plaza.js)

  // Cây dừa dọc bờ biển quanh đảo
  for (let i = 0; i < (low ? 60 : 120); i++) { const a = rnd() * 6.28, r = ISLAND_R * (0.72 + rnd() * 0.33), x = Math.cos(a) * r, z = Math.sin(a) * r, h = hgt(x, z); if (h > 0.5 && h < 1.6 && !blocked(x, z, 2)) palmAt(x, z, h - 0.05); }
  // dừa quanh hồ bán nguyệt
  for (let i = 0; i < (low ? 8 : 14); i++) { const a = Math.PI * (0.08 + 0.84 * i / ((low ? 8 : 14) - 1)), x = LAGOON.x + Math.cos(a) * (LAGOON.r + 3.5), z = LAGOON.z + Math.sin(a) * (LAGOON.r + 3.5), h = hgt(x, z); if (h > 0.4 && !blocked(x, z, 1.5)) palmAt(x, z, h - 0.05); }
  { const A = BLOCKS[0].r; for (let x = A[0] + 6; x < A[2]; x += low ? 14 : 9) { const z = A[3] - 3 - rnd() * 4; if (!nearDoor(x, z, 3)) palmAt(x, z, Y); } }

  // ================= CHI TIẾT SÂN TRƯỜNG & MÔI TRƯỜNG (lưới chi tiết, chỉ hiện gần người chơi) =================
  {
    const G = B.ground, d = DG.follow(null);
    const at = (x2, y2) => P(x2, y2);
    // thiên nhiên quanh đảo và giữa các khu: bụi cây, cụm hoa, nấm, đá ven bờ — model kit CC0, instancing theo khoảng cách (terrain.nature)
    const H_ = (x, z) => ctx.terrain.heightAt(x, z), SL = (x, z) => ctx.terrain.slopeAt(x, z);
    const N = low ? 2200 : 4200, L = { bush: [], flowers: [], mushrooms: [], rockL: [], pebbles: [] };
    for (let i = 0; i < N; i++) {
      const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * ISLAND_R * 1.08, x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = H_(x, z); if (h < 0.15) continue;
      let inside = false; for (const r of ALL) if (x > r[0] - 1 && x < r[2] + 1 && z > r[1] - 1 && z < r[3] + 1) { inside = true; break; } if (inside || blocked(x, z, 1.5) || isBuilt(x, z, 1.5)) continue;
      if (h < 0.9) { if (rnd() < 0.5) (rnd() < 0.3 ? L.rockL : L.pebbles).push([x, h - 0.1, z, 1.2 + rnd() * 1.6]); continue; }   // đá ven bờ
      if (SL(x, z) > 0.8) continue;
      const k = rnd();
      if (k < 0.4) L.bush.push([x, h - 0.05, z, 2.6 + rnd() * 1.8]);
      else if (k < 0.85) L.flowers.push([x, h - 0.03, z, 1.8 + rnd() * 0.9]);
      else L.mushrooms.push([x, h - 0.03, z, 2.2 + rnd() * 1.0]);
    }
    for (const k of Object.keys(L)) ctx.terrain.nature.add(k, L[k]);
  }
  // sự sống: bướm ở vườn hoa/safari/học viện, hải âu trên biển, cờ bay
  const flies = [];
  for (const k of ['flowerfield', 'garden']) { const r = R[k]; if (!r) continue; for (let i = 0; i < (low ? 6 : 12); i++) { const [x, z] = P(r.x + rnd() * r.w, r.y + rnd() * r.h); flies.push({ x, y: Y, z }); } }
  for (const id of ['F', 'G', 'H']) { const r = ZR[id]; if (r) for (let i = 0; i < 5; i++) flies.push({ x: r[0] + rnd() * (r[2] - r[0]), y: Y, z: r[1] + rnd() * (r[3] - r[1]) }); }
  const gulls = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; gulls.push({ x: Math.cos(a) * (ISLAND_R + 15), y: 16 + rnd() * 10, z: Math.sin(a) * (ISLAND_R + 15), r: 10 + rnd() * 16, v: 0.25 + rnd() * 0.25, ph: rnd() * 6 }); }
  let flagTex = null; if (flagAt) { const c = document.createElement('canvas'); c.width = 96; c.height = 64; const k = c.getContext('2d'); k.fillStyle = '#da251d'; k.fillRect(0, 0, 96, 64); k.fillStyle = '#ffde00'; k.beginPath(); for (let i = 0; i < 10; i++) { const r2 = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; k.lineTo(48 + Math.cos(a) * r2, 34 + Math.sin(a) * r2); } k.fill(); flagTex = new THREE.CanvasTexture(c); flagTex.colorSpace = THREE.SRGBColorSpace; }
  const life = createLife(scene, { butterflies: flies, gulls, flag: flagAt && Object.assign({ tex: flagTex }, flagAt) });

  const east = buildZoneEast({ ctx, RS, env, B, DG, trees, lamp, measure, rnd, nearDoor, rubikCube });   // khối C & D (zone-east.js)
  const zen = buildZen({ ctx, low });   // rừng thiền quanh Đền Tri Thức (zone-zen.js)
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
  const LEAF = ['#7cc35e', '#6fb85a', '#8fcf6a', '#5faa4e'], PHUONG = ['#e8553f', '#f06a3b', '#e24a3a'], PINE = ['#3f8f55', '#4a9a5a', '#367f4c'];
  // lọc lần cuối: cây/hoa không bao giờ mọc trong nhà, tường, nền công trình, mặt đường (bán kính tán/thân)
  const plantR = k => k === 'pine' ? 1.0 : k === 'fruit' ? 0.7 : 1.1;
  const nT = trees.length; for (let i = trees.length - 1; i >= 0; i--) { const [x, z, k, s] = trees[i]; if (isBuilt(x, z, plantR(k) * s)) trees.splice(i, 1); }
  const nP = palms.length; for (let i = palms.length - 1; i >= 0; i--) if (isBuilt(palms[i].x, palms[i].z, 0.5)) palms.splice(i, 1);
  const nF = fl.length; for (let i = fl.length - 1; i >= 0; i--) if (isBuilt(fl[i][0], fl[i][1], 0.2)) fl.splice(i, 1);
  if (env.debug !== false) console.info('[town-buildings] bỏ cây/dừa/hoa trùng công trình:', nT - trees.length, nP - palms.length, nF - fl.length);
  const T2 = trees.map(([x, z, k, s]) => ({ x, z, k, s, ry: rnd() * 6.28, col: (k === 'pine' ? PINE : k === 'phuong' ? PHUONG : LEAF)[Math.floor(rnd() * 3)] }));
  // cây của thị trấn: model kit CC0 (tán tròn / phượng đỏ / thông) qua terrain.nature — instancing + LOD gần/xa dùng chung với cây đảo
  { const T = { oak: [], fat: [], round: [], pine: [], pineTall: [] };
    for (const q of T2) {
      const it = [q.x, Y - 0.05, q.z, 0, q.ry, q.col];
      if (q.k === 'pine') { it[3] = q.s * 3.2; (rnd() < 0.5 ? T.pine : T.pineTall).push(it); }
      else if (q.k === 'phuong') { it[3] = q.s * 2.4; T.round.push(it); }
      else { it[3] = q.s * 3.1; (rnd() < 0.6 ? T.oak : T.fat).push(it); }
    }
    for (const k of Object.keys(T)) if (T[k].length) ctx.terrain.nature.add(k, T[k]);
  }
  inst(new THREE.CylinderGeometry(1, 1, 0.04, 7), toon('#4f9a3a'), pads, ([x, z, s]) => set(x, Y + 0.07, z, s, x * 3), false, false);
  inst(new THREE.ConeGeometry(0.22, 0.4, 5), toon('#ff9ec4'), flowers, ([x, z]) => set(x + 0.1, Y + 0.12, z, 1, 0), false, false);
  inst(new THREE.ConeGeometry(0.16, 0.42, 4).translate(0, 0.21, 0), toon('#ffffff'), fl.map(([x, z, col]) => ({ x, z, col })), q => set(q.x, Y, q.z, 1, q.x), false, false);

  // cây dừa (model kit, chia ô 70 m) + model kit của 4 khu ven biển; thuyền neo (model kit, nhấp nhô)
  placePalms(scene, palms); extra.place(scene);
  const boats = buildBoats(scene, [...boatsDeco.map(([x, z, ry]) => [x, z, ry, 'boat_sail_a', 1.3]), ...extra.boats]);
  // ẩn công trình ở quá xa (sau sương mù) để giữ FPS
  const far = out.filter(m => m.isMesh && m.geometry && !m.isInstancedMesh).map(m => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const c = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrixWorld); return { m, c, r: m.geometry.boundingSphere.radius }; });
  let upT = 0;
  function update(p, t, dt = 0.016) {
    life.update(t, p); north.update(p, t);
    SZ.update(p, dt);
    boats.update(t); zen.update(p, t, dt);
    if ((upT -= dt) > 0) return; upT = 0.3; DG.update(p, 60);
    const fogFar = (scene.fog && scene.fog.far) || 300;
    for (const q of far) if (!q.m.isInstancedMesh) q.m.visible = q.c.distanceTo(p) - q.r < fogFar + 10;
  }
  if (env.debug !== false) console.info('[town-buildings] tam giác mỗi công trình:', budget, '— draw call kiến trúc:', out.length);
  const plants = [...T2.map(q => [q.x, q.z, plantR(q.k) * q.s, q.k]), ...palms.map(q => [q.x, q.z, 0.5, 'palm']), ...fl.map(([x, z]) => [x, z, 0.2, 'flower']), ...north.plants];
  return { meshes: out, budget, update, plants, foot, footC, isBuilt };
}
