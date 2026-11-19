// sea/village.js — LÀNG CHÀI VỊNH ÉN (vịnh cát hướng đông – đông nam):
//   cầu tàu chữ T dài 44 m (bến phà + bến cá), 5 nhà sàn trên cọc có cầu ván, lưới phơi, giàn phơi cá khô, chợ cá sáng sớm
//   (quầy mái vải, sọt cá chỉ bày lúc 5 h – 8 h 30), lồng bè nuôi cá, giàn rong biển, đèn cầu tàu, biển tên.
//   Dựng: phần gỗ/cọc/sàn gộp 1 mesh màu đỉnh (Batch); nhà, quầy, thùng, cá dùng model kit CC0 (instancing); lưới = 1 mesh cắt alpha.
//   Sàn đi được: hình chữ nhật trong hệ (u ra khơi, v dọc bờ) của vịnh — bọc ctx.groundExtra / ctx.surfaceAt.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { placeKit } from '../kit.js';
import { CFG } from '../config.js';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { PHI, BAY, toW, NAME, DECK_Y, PIER_V, PIER_U0, PIER_U1, PIER_W, HEAD_W, HEAD_D, HOUSES, DECKS, CAGES, SEAWEED, WEST, PONTOON } from './site.js';

const WOOD = '#b07a48', WOOD_D = '#7a5232', WOOD_L = '#c99a62', POST = '#5c4030', BAMBOO = '#c9b06a', ROPE = '#d9c9a0';
const WALLS = ['#3f9c9a', '#e8d9b0', '#d9785a', '#5f8fc9', '#e3b85a'];

export function createVillage(ctx) {
  const { scene, terrain } = ctx, H = terrain.heightAt, MOB = CFG.isMobile;
  const shoreU = v => { let u = -30; while (u < 60 && H(...toW(u, v)) > 0) u += 0.5; return u; };
  const root = new THREE.Group(); root.name = 'sea-village'; root.position.set(BAY.O[0], 0, BAY.O[1]); root.rotation.y = BAY.ry; scene.add(root);
  const b = new Batch(), glow = new Batch(), nets = [], decks = DECKS.map(d => d.slice());
  // hộp theo hệ (u, v): x cục bộ = −v, z cục bộ = u
  const bx = (u0, u1, v0, v1, y0, y1, col, B = b) => B.box(-v1, -v0, y0, y1, u0, u1, col);
  const post = (u, v, y0, y1, r = 0.14, col = POST) => b.cyl(-v, y0, u, r, y1 - y0, col, 6);
  const seabed = (u, v) => Math.min(-0.3, H(...toW(u, v)));
  const collide = (u, v, r) => { const [x, z] = toW(u, v); ctx.colliders.push({ x, z, r }); };
  // sàn ván + cọc + gờ mép
  function deck(u0, u1, v0, v1, y, { rail = true, step = 4 } = {}) {
    bx(u0, u1, v0, v1, y - 0.16, y, WOOD);
    for (let u = u0 + 0.05; u < u1 - 0.3; u += 1.1) bx(u, u + 0.06, v0, v1, y, y + 0.006, WOOD_D);                // khe ván
    if (rail) { bx(u0, u1, v0, v0 + 0.14, y, y + 0.12, WOOD_D); bx(u0, u1, v1 - 0.14, v1, y, y + 0.12, WOOD_D); }
    for (let u = u0 + 0.5; u <= u1 - 0.3; u += step) for (const v of [v0 + 0.25, v1 - 0.25]) post(u, v, seabed(u, v) - 0.4, y + (rail ? 0.5 : 0));
  }

  // ---------- cầu tàu chính + đầu chữ T (bến phà / bến cá) ----------
  deck(PIER_U0, PIER_U1 - HEAD_D, PIER_V - PIER_W / 2, PIER_V + PIER_W / 2, DECK_Y, { step: 5 });
  deck(PIER_U1 - HEAD_D, PIER_U1, PIER_V - HEAD_W / 2, PIER_V + HEAD_W / 2, DECK_Y, { step: 3.5 });
  for (let v = PIER_V - HEAD_W / 2 + 1.5; v < PIER_V + HEAD_W / 2; v += 3) b.add(new THREE.TorusGeometry(0.32, 0.12, 5, 10), '#22262b', -v, DECK_Y - 0.45, PIER_U1 + 0.1);   // lốp chống va
  for (const v of [PIER_V - 8, PIER_V + 8]) { b.cyl(-v, DECK_Y, PIER_U1 - 0.7, 0.2, 0.5, '#2b2f36', 8, 0.26); }                                                           // cọc bích buộc tàu
  // cột đèn cầu tàu (lồng đèn phát sáng)
  const lamps = [[2, -1.25], [13, 1.25], [24, -1.25], [PIER_U1 - HEAD_D + 0.6, -HEAD_W / 2 + 0.6], [PIER_U1 - HEAD_D + 0.6, HEAD_W / 2 - 0.6]];
  for (const [u, dv] of lamps) { const v = PIER_V + dv; post(u, v, DECK_Y, DECK_Y + 2.9, 0.07, '#3a3344'); bx(u - 0.3, u + 0.3, v - 0.04, v + 0.04, DECK_Y + 2.84, DECK_Y + 2.9, '#3a3344'); glow.add(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 6), '#ffe3a0', -v, DECK_Y + 2.6, u + 0.24); }
  // cổng chào đầu cầu + mái che bến phà (khung gỗ, mái lá)
  for (const dv of [-1.6, 1.6]) post(PIER_U0 + 1.5, PIER_V + dv, H(...toW(PIER_U0 + 1.5, PIER_V + dv)) - 0.2, DECK_Y + 3.6, 0.13, WOOD_D);
  bx(PIER_U0 + 1.36, PIER_U0 + 1.64, PIER_V - 2.2, PIER_V + 2.2, DECK_Y + 3.4, DECK_Y + 3.62, WOOD_D);
  { const u0 = PIER_U1 - HEAD_D + 0.5, v0 = PIER_V + 3, v1 = PIER_V + 9.5;   // nhà chờ phà
    for (const u of [u0, u0 + 3.2]) for (const v of [v0, v1]) post(u, v, DECK_Y, DECK_Y + 2.5, 0.09, WOOD_D);
    b.gable(-v1 - 0.5, -v0 + 0.5, u0 - 0.6, u0 + 3.8, DECK_Y + 2.5, 1.0, '#c9a15a');
    bx(u0 + 0.3, u0 + 0.8, v0 + 0.6, v1 - 0.6, DECK_Y + 0.4, DECK_Y + 0.5, WOOD_L); for (const v of [v0 + 0.9, v1 - 0.9]) bx(u0 + 0.35, u0 + 0.75, v - 0.06, v + 0.06, DECK_Y, DECK_Y + 0.4, WOOD_D);   // ghế dài
  }

  // ---------- 5 nhà sàn: sàn 7 × 8 m trên cọc, cầu ván nối bãi cát; thân nhà = model kit dock_hut ----------
  const huts = [], hutPos = [];
  HOUSES.forEach(({ v, i }) => {
    const su = shoreU(v), u0 = su + 1.5, u1 = su + 8.5, y = 1.3;
    deck(u0, u1, v - 4, v + 4, y, { step: 3.3 }); deck(su - 5, u0, v - 0.9, v + 0.9, y, { rail: false, step: 3 });
    decks.push([u0, u1, v - 4, v + 4, y], [su - 5, u0, v - 0.9, v + 0.9, y]);
    const hu = u0 + 4.3, hv = v + (i % 2 ? 0.9 : -0.9), [x, z] = toW(hu, hv);
    huts.push([x, y, z, 1.62, BAY.ry + Math.PI]); hutPos.push({ u: hu, v: hv, su, i }); collide(hu, hv, 2.5);   // cửa quay vào bờ
    bx(hu - 2.7, hu + 2.7, hv - 2.75, hv + 2.75, y, y + 0.1, WALLS[i]);                                           // thềm sơn màu riêng mỗi nhà
    // dây phơi đồ + chum nước + thang xuống thuyền
    post(u0 + 0.4, v - 3.6, y, y + 1.9, 0.05, WOOD_D); post(u0 + 0.4, v + 3.6, y, y + 1.9, 0.05, WOOD_D); bx(u0 + 0.38, u0 + 0.42, v - 3.6, v + 3.6, y + 1.84, y + 1.87, ROPE);
    for (let k = 0; k < 4; k++) bx(u0 + 0.36, u0 + 0.44, v - 2.6 + k * 1.5, v - 1.8 + k * 1.5, y + 1.1, y + 1.84, ['#f4efe2', '#e0564a', '#3d8fd9', '#f2c443'][(k + i) % 4]);
    b.cyl(-(v + (i % 2 ? -3 : 3)), y, u1 - 0.9, 0.42, 0.75, '#8a5a3c', 8, 0.3);
    for (let k = 0; k < 4; k++) bx(u1, u1 + 0.12, v - 0.4, v + 0.4, y - 0.3 - k * 0.38, y - 0.24 - k * 0.38, WOOD_D);
  });
  const kitIM = [];   // InstancedMesh của model kit (nằm ngoài root) → ẩn/hiện cùng làng
  placeKit(scene, 'dock_hut', huts, { shadow: !MOB }).then(L => kitIM.push(...L));

  // ---------- lưới phơi trên bãi (2 giàn) + lưới vắt lan can cầu tàu ----------
  const netQuad = (u0, v0, u1, v1, y0, y1, lean = 0.5, rep = 3) => {
    const w = Math.hypot(u1 - u0, v1 - v0), g = new THREE.PlaneGeometry(w, y1 - y0, 4, 2), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const t = p.getX(i) / w + 0.5, s = p.getY(i) / (y1 - y0) + 0.5; p.setZ(i, (1 - s) * lean + Math.sin(t * Math.PI) * 0.18 * (1 - s)); p.setY(i, p.getY(i) - Math.sin(t * Math.PI) * 0.22 * s); uv.setXY(i, t * w / 2 * rep / 3, s * (y1 - y0) / 2 * rep / 3); }
    g.rotateY(Math.atan2(-(u1 - u0), -(v1 - v0))).translate(-(v0 + v1) / 2, (y0 + y1) / 2, (u0 + u1) / 2); g.computeVertexNormals(); nets.push(g);
  };
  const racks = [];
  for (const v of [-44.5, -33]) {
    const u = shoreU(v) - 8.5, gy = H(...toW(u, v)), v0 = v - 3.2, v1 = v + 3.2;
    for (const vv of [v0, v, v1]) post(u, vv, gy - 0.2, gy + 2.3, 0.06, BAMBOO); bx(u - 0.04, u + 0.04, v0, v1, gy + 2.26, gy + 2.33, BAMBOO);
    netQuad(u, v0, u, v1, gy + 0.15, gy + 2.28, 1.1); racks.push({ u, v, gy });
    for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.16, 6, 4), k % 2 ? '#e8642a' : '#f4efe2', -(v0 + 0.8 + k * 1.2), gy + 0.2, u + 1.25);   // phao lưới
  }
  netQuad(22, PIER_V - 1.48, 28, PIER_V - 1.48, DECK_Y - 0.5, DECK_Y + 0.5, 0.05);

  // ---------- giàn phơi cá khô (2 giàn tre nghiêng 21°) ----------
  const fishDry = new THREE.SphereGeometry(0.19, 5, 3).scale(1, 0.22, 0.42);
  const dry = [];
  for (const v of [6.5, 13.5]) {
    const u = shoreU(v) - 9, gy = H(...toW(u, v)), w = 3.6, d = 1.9, tilt = 21 * Math.PI / 180;
    for (const [du, dv] of [[-d / 2, -w / 2], [-d / 2, w / 2], [d / 2, -w / 2], [d / 2, w / 2]]) post(u + du, v + dv, gy - 0.2, gy + 0.95 + (du > 0 ? -0.33 : 0.33), 0.045, BAMBOO);
    b.add(new THREE.BoxGeometry(w, 0.05, d + 0.2), '#d9c48a', -v, gy + 0.95, u, 0, tilt, 0);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) b.add(fishDry, (r + c) % 3 ? '#c9a27a' : '#b88a5e', -(v - w / 2 + 0.35 + c * 0.48), gy + 1.0 - (r - 1.5) * 0.45 * Math.sin(tilt), u + (r - 1.5) * 0.45 * Math.cos(tilt), 0, tilt, 0);
    dry.push({ u, v, gy }); collide(u, v, 1.4);
  }

  // ---------- chợ cá: 3 quầy mái vải cạnh gốc cầu tàu + sọt, thùng, chiếu bày cá (cá chỉ bày buổi sáng sớm) ----------
  const kits = {}, K = (name, u, v, s, ry = 0, dy = 0) => { const [x, z] = toW(u, v); (kits[name] = kits[name] || []).push([x, H(x, z) + dy, z, s, BAY.ry + ry]); };
  const stalls = [], fresh = [];
  [[-9.5, -9.5, 'prop_stall_red'], [-9.5, -4.5, 'prop_stall_green'], [-10.5, -24.5, 'prop_stall_red']].forEach(([du, v, name], i) => {
    const u = shoreU(v) + du; K(name, u, v, 2.3, Math.PI / 2); collide(u, v, 1.3); stalls.push({ u, v, gy: H(...toW(u, v)) });
    for (let k = 0; k < 5; k++) fresh.push([u + 0.25 + (k % 2) * 0.3, v - 0.8 + k * 0.4, 1.15, k * 1.3]);                   // cá tươi trên quầy
  });
  // chiếu + mẹt cá trên cát, sọt tre, thùng đá
  const mats = [[-6.5, -12.5], [-6.2, -7], [-6.4, -1.5]];
  for (const [du, v] of mats) { const u = shoreU(v) + du, gy = H(...toW(u, v)); b.add(new THREE.BoxGeometry(2.2, 0.04, 1.5), '#d9c48a', -v, gy + 0.05, u, 0.2); b.add(new THREE.CylinderGeometry(0.62, 0.55, 0.14, 10), BAMBOO, -v + 0.3, gy + 0.12, u); for (let k = 0; k < 4; k++) fresh.push([u - 0.1 + (k % 2) * 0.25, v - 0.55 + k * 0.12, 0.2, 0.8 + k]); }
  for (const [du, v, s] of [[-8, -11.5, 2.6], [-8.6, -2.6, 2.4], [-4.5, -19.5, 2.5], [-4, -13.2, 2.2]]) K('barrels', shoreU(v) + du, v, s, v);
  for (const [u, dv, c] of [[30.6, 1, '#3d8fd9'], [31.5, -1.05, '#8a5a3c'], [PIER_U1 - 1.2, 2.2, '#3d8fd9'], [PIER_U1 - 1.4, -7.5, '#8a5a3c']]) { b.cyl(-(PIER_V + dv), DECK_Y, u, 0.34, 0.78, c, 8); b.cyl(-(PIER_V + dv), DECK_Y + 0.78, u, 0.36, 0.05, '#2b2f36', 8); }   // thùng phuy, thùng gỗ trên cầu
  for (const [u, dv] of [[32.5, 0.9], [PIER_U1 - 2.6, 7.2]]) b.cyl(-(PIER_V + dv), DECK_Y, u, 0.45, 0.5, BAMBOO, 9, 0.52);   // sọt tre trên cầu
  for (const name in kits) placeKit(scene, name, kits[name], { shadow: false }).then(L => kitIM.push(...L));
  let freshIM = [];
  placeKit(scene, 'fish', fresh.map(([u, v, dy, r]) => { const [x, z] = toW(u, v); return [x, H(x, z) + dy, z, 0.9, r]; }), { shadow: false }).then(L => { freshIM = L; for (const m of L) m.visible = false; });

  // ---------- biển tên + biển bến phà (1 mesh, 1 texture) ----------
  {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const k = c.getContext('2d');
    const plate = (y, h, bg, t1, t2) => { k.fillStyle = bg; k.beginPath(); k.roundRect(6, y + 6, 500, h - 12, 18); k.fill(); k.strokeStyle = '#3a2a16'; k.lineWidth = 6; k.stroke(); k.fillStyle = '#fff8e6'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = '800 50px system-ui'; k.fillText(t1, 256, y + h * (t2 ? 0.38 : 0.5), 470); if (t2) { k.font = '700 26px system-ui'; k.fillText(t2, 256, y + h * 0.74, 470); } };
    plate(0, 128, '#1f6fb5', '⚓ ' + NAME.toUpperCase()); plate(128, 128, '#2c6455', '⛴️ BẾN PHÀ', 'Làng nổi · Bến Tây');
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const q = (w, h, v0, x, y, z, ry) => { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * 0.5); return g.rotateY(ry).translate(x, y, z); };
    const sg = mergeGeometries([q(4.2, 1.05, 0.5, -PIER_V, DECK_Y + 3.0, PIER_U0 + 1.34, Math.PI), q(4.2, 1.05, 0.5, -PIER_V, DECK_Y + 3.0, PIER_U0 + 1.66, 0),
      q(3.2, 0.8, 0, -(PIER_V + 6.25), DECK_Y + 2.1, PIER_U1 - HEAD_D + 0.42, Math.PI), q(3.2, 0.8, 0, -(PIER_V + 6.25), DECK_Y + 2.1, PIER_U1 - HEAD_D + 0.46, 0)]);
    const sign = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ map: tex })); sign.name = 'sea-sign'; root.add(sign);
  }

  // ---------- lồng bè nuôi cá: bè gỗ 13 × 8 m (13/8 ≈ φ) nổi trên thùng phuy xanh, 6 ô lưới, chòi canh ----------
  const cage = new THREE.Group(); { const [x, z] = toW(CAGES.u, CAGES.v); cage.position.set(x, 0, z); cage.rotation.y = BAY.ry; cage.name = 'sea-cage'; scene.add(cage); }
  const cb = new Batch(), cageNets = [], CL = 13, CW = 8, CY = 0.5;
  for (let i = 0; i <= 3; i++) cb.box(-CW / 2, CW / 2, CY - 0.14, CY, -CL / 2 + i * CL / 3 - 0.45, -CL / 2 + i * CL / 3 + 0.45, WOOD);       // ván ngang
  for (let j = 0; j <= 2; j++) cb.box(-CW / 2 + j * CW / 2 - 0.45, -CW / 2 + j * CW / 2 + 0.45, CY - 0.14, CY, -CL / 2, CL / 2, WOOD_L);  // ván dọc
  for (let i = 0; i <= 3; i++) for (let j = 0; j <= 2; j++) cb.add(new THREE.CylinderGeometry(0.34, 0.34, 0.95, 8), '#2f6fc0', -CW / 2 + j * CW / 2, CY - 0.5, -CL / 2 + i * CL / 3, 0, Math.PI / 2, 0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {   // lưới ô nuôi (4 vách) + cọc góc
    const x0 = -CW / 2 + j * CW / 2 + 0.5, x1 = x0 + CW / 2 - 1, z0 = -CL / 2 + i * CL / 3 + 0.5, z1 = z0 + CL / 3 - 1;
    for (const [ax, az, bx2, bz2] of [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]]) { const w = Math.hypot(bx2 - ax, bz2 - az), g = new THREE.PlaneGeometry(w, 1.5); const uv = g.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * w / 1.4, uv.getY(q)); g.rotateY(Math.atan2(-(bz2 - az), bx2 - ax)).translate((ax + bx2) / 2, CY - 0.85, (az + bz2) / 2); cageNets.push(g); }
  }
  cb.box(CW / 2 - 3.2, CW / 2 - 0.4, CY, CY + 0.08, CL / 2 - 3.6, CL / 2 - 0.5, WOOD_D);                                                   // nền chòi
  for (const [x, z] of [[CW / 2 - 3, CL / 2 - 3.4], [CW / 2 - 0.6, CL / 2 - 3.4], [CW / 2 - 3, CL / 2 - 0.7], [CW / 2 - 0.6, CL / 2 - 0.7]]) cb.cyl(x, CY, z, 0.07, 2.0, WOOD_D, 5);
  cb.gable(CW / 2 - 3.5, CW / 2 - 0.1, CL / 2 - 3.9, CL / 2 - 0.2, CY + 2.0, 0.9, '#c9a15a'); cb.box(CW / 2 - 3, CW / 2 - 0.6, CY + 0.08, CY + 1.0, CL / 2 - 0.78, CL / 2 - 0.7, WOOD);
  cb.cyl(-CW / 2 + 0.3, CY, -CL / 2 + 0.3, 0.3, 0.55, '#3d8fd9', 8); cb.cyl(0, CY, 0.2, 0.42, 0.42, BAMBOO, 9, 0.5);                    // thùng thức ăn, sọt
  const cageMesh = new THREE.Mesh(cb.build(), matV()); cageMesh.castShadow = !MOB; cage.add(cageMesh);
  decks.push([CAGES.u - CL / 2, CAGES.u + CL / 2, CAGES.v - CW / 2, CAGES.v + CW / 2, CY]);

  // ---------- giàn rong biển: 5 dây × 21 m, phao nhựa + búi rong sụn xanh/đỏ nổi sát mặt nước ----------
  const weed = new THREE.Group(); { const [x, z] = toW(SEAWEED.u, SEAWEED.v); weed.position.set(x, 0, z); weed.rotation.y = BAY.ry; weed.name = 'sea-weed'; scene.add(weed); }
  const wb = new Batch(), tuft = new THREE.SphereGeometry(0.34, 5, 3).scale(1.5, 0.3, 1);
  for (let r = 0; r < 5; r++) {
    const x = (r - 2) * 3.2; wb.box(x - 0.025, x + 0.025, 0.02, 0.06, -10.5, 10.5, ROPE);
    for (const z of [-10.5, 10.5]) wb.cyl(x, -0.5, z, 0.07, 1.5, BAMBOO, 5);
    for (let k = 0; k < 8; k++) { const z = -9.2 + k * 2.63 + (r % 2) * 0.6; wb.add(new THREE.SphereGeometry(0.2, 6, 4), k % 2 ? '#f2c443' : '#e8642a', x, 0.1, z); wb.add(tuft, (k + r) % 3 ? '#3f8f4f' : '#a8453f', x + 0.15, -0.02, z + 1.3, k); }
  }
  const weedMesh = new THREE.Mesh(wb.build(), matV()); weed.add(weedMesh);

  // ---------- Bến Tây: cầu phà chữ T ở vịnh tây nam (hệ u, v của WEST) + bậc xuống từ bờ cao; ponton Làng nổi (toạ độ thế giới) ----------
  const westDecks = [];
  {
    const J = WEST, wroot = new THREE.Group(); wroot.name = 'sea-jetty-west'; wroot.position.set(J.O[0], 0, J.O[1]); wroot.rotation.y = J.ry; scene.add(wroot);
    const jb = new Batch(), jg = new Batch(), y = J.y, tw = (u, v) => [J.O[0] + J.D[0] * u + J.T[0] * v, J.O[1] + J.D[1] * u + J.T[1] * v], sb = (u, v) => Math.min(-0.3, H(...tw(u, v)));
    const dk = (u0, u1, v0, v1, yy, posts = true) => { jb.box(-v1, -v0, yy - 0.16, yy, u0, u1, WOOD); jb.box(-v0 - 0.14, -v0, yy, yy + 0.12, u0, u1, WOOD_D); jb.box(-v1, -v1 + 0.14, yy, yy + 0.12, u0, u1, WOOD_D);
      if (posts) for (let u = u0 + 0.5; u <= u1 - 0.3; u += 4) for (const v of [v0 + 0.25, v1 - 0.25]) jb.cyl(-v, sb(u, v) - 0.4, u, 0.14, yy + 0.5 - sb(u, v) + 0.4, POST, 6); westDecks.push([u0, u1, v0, v1, yy]); };
    for (const [u0, u1, yy] of [[-7.5, -5, 2.9], [-5, -2.5, 2.4], [-2.5, 0, 1.85]]) { dk(u0, u1, -J.W / 2, J.W / 2, yy, false); jb.box(-J.W / 2, J.W / 2, H(...tw((u0 + u1) / 2, 0)) - 1.2, yy - 0.16, u0, u1, WOOD_D); }   // 3 bậc xuống từ bờ cao
    dk(0, J.U1 - J.headD, -J.W / 2, J.W / 2, y); dk(J.U1 - J.headD, J.U1, -J.headW / 2, J.headW / 2, y);
    for (let v = -J.headW / 2 + 1.5; v < J.headW / 2; v += 3) jb.add(new THREE.TorusGeometry(0.32, 0.12, 5, 10), '#22262b', -v, y - 0.45, J.U1 + 0.1);
    for (const [u, v] of [[J.U1 - J.headD + 0.6, -J.headW / 2 + 0.6], [J.U1 - J.headD + 0.6, J.headW / 2 - 0.6], [8, 1.25], [19, -1.25]]) { jb.cyl(-v, y, u, 0.07, 2.9, '#3a3344', 6); jb.box(-v - 0.04, -v + 0.04, y + 2.84, y + 2.9, u - 0.3, u + 0.3, '#3a3344'); jg.add(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 6), '#ffe3a0', -v, y + 2.6, u + 0.24); }
    for (const u of [J.U1 - 4.3, J.U1 - 1.1]) for (const v of [3, 9.5]) jb.cyl(-v, y, u, 0.09, 2.5, WOOD_D, 6);   // nhà chờ
    jb.gable(-10, -2.5, J.U1 - 4.9, J.U1 - 0.5, y + 2.5, 1.0, '#c9a15a'); jb.box(-8.6, -3.8, y + 0.4, y + 0.5, J.U1 - 4.1, J.U1 - 3.6, WOOD_L);
    jb.box(-1.36, -1.64 + 0.56, y + 3.3, y + 3.5, 1.4, 1.6, WOOD_D); for (const v of [-1.5, 1.5]) jb.cyl(-v, y, 1.5, 0.11, 3.4, WOOD_D, 6);   // cổng đầu cầu
    const jm = new THREE.Mesh(jb.build(), matV()); jm.castShadow = true; jm.receiveShadow = true; wroot.add(jm); wroot.add(new THREE.Mesh(jg.build(), mat('lampGlow')));
  }
  {
    const jb = new Batch(), jg = new Batch();
    // ponton bến phà ở Làng nổi: sàn 4 × 4 m trên 4 thùng phuy, nối đầu cầu sẵn có
    { const Q = PONTOON, x0 = Q.x - Q.r, x1 = Q.x + Q.r, z0 = Q.z - Q.r, z1 = Q.z + Q.r; jb.box(x0, x1, Q.y - 0.16, Q.y, z0, z1, WOOD_L); for (const x of [x0 + 0.5, x1 - 0.5]) for (const z of [z0 + 0.5, z1 - 0.5]) jb.add(new THREE.CylinderGeometry(0.36, 0.36, 1.0, 8), '#2f6fc0', x, Q.y - 0.62, z);
      jb.cyl(x0 + 0.3, Q.y, z0 + 0.3, 0.07, 2.6, '#3a3344', 6); jg.add(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 6), '#ffe3a0', x0 + 0.3, Q.y + 2.6, z0 + 0.3); jb.box(x0 + 0.6, x0 + 0.72, Q.y + 1.5, Q.y + 2.2, z0 + 0.1, z0 + 1.7, '#2c6455'); ctx.decks.push({ x0, x1, z0, z1, y: Q.y }); }
    const jm = new THREE.Mesh(jb.build(), matV()); jm.castShadow = true; jm.receiveShadow = true; jm.name = 'sea-pontoon'; scene.add(jm); scene.add(new THREE.Mesh(jg.build(), mat('lampGlow')));
  }

  // ---------- lưới rùng (kéo lúc chiều): dây phao chữ U từ 2 người kéo trên bãi vòng ra biển 13 m ----------
  const seine = new THREE.Group(); seine.visible = false; root.add(seine);
  { const sb = new Batch(), v0 = 22.6, v1 = 25.6, n = 21, su0 = shoreU(24);
    let prev = null; for (let i = 0; i <= n; i++) { const t = i / n, a = t * Math.PI, u = su0 - 0.6 + Math.sin(a) * 13.6, v = v0 + (v1 - v0) * t + (t - 0.5) * 9 * Math.sin(a), y = Math.max(0.03, H(...toW(u, v)) + 0.05);
      sb.add(new THREE.SphereGeometry(0.17, 6, 4), i % 2 ? '#f4efe2' : '#e8642a', -v, y + 0.05, u);
      if (prev) { const du = u - prev[0], dv = v - prev[1], L = Math.hypot(du, dv); sb.add(new THREE.BoxGeometry(0.05, 0.05, L), '#2f6b4a', -(v + prev[1]) / 2, (y + prev[2]) / 2, (u + prev[0]) / 2, Math.atan2(-dv, du)); }
      prev = [u, v, y]; }
    seine.add(new THREE.Mesh(sb.build(), matV())); }

  // ---------- gom mesh tĩnh ----------
  const mesh = new THREE.Mesh(b.build(), matV()); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'sea-village-wood'; root.add(mesh);
  const lampMesh = new THREE.Mesh(glow.build(), mat('lampGlow')); root.add(lampMesh);
  // lưới: texture mắt lưới quả trám, cắt alpha
  const nc = document.createElement('canvas'); nc.width = nc.height = 64; { const k = nc.getContext('2d'); k.strokeStyle = '#2f7a5f'; k.lineWidth = 3; for (let i = -64; i < 128; i += 16) { k.beginPath(); k.moveTo(i, 0); k.lineTo(i + 64, 64); k.stroke(); k.beginPath(); k.moveTo(i + 64, 0); k.lineTo(i, 64); k.stroke(); } }
  const nt = new THREE.CanvasTexture(nc); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.colorSpace = THREE.SRGBColorSpace;
  const netMat = new THREE.MeshLambertMaterial({ map: nt, alphaTest: 0.35, side: THREE.DoubleSide });
  const netMesh = new THREE.Mesh(mergeGeometries(nets), netMat); netMesh.name = 'sea-nets'; root.add(netMesh);
  const cageNet = new THREE.Mesh(mergeGeometries(cageNets), netMat); cage.add(cageNet);

  // ---------- sàn đi được + tiếng chân gỗ ----------
  const [Ox, Oz] = BAY.O;
  const frames = [{ O: BAY.O, D: BAY.D, T: BAY.T, R2: 110 * 110, decks }, { O: WEST.O, D: WEST.D, T: WEST.T, R2: 55 * 55, decks: westDecks }];
  const prevG = ctx.groundExtra, prevS = ctx.surfaceAt;
  const deckAt = (x, z, y) => {
    let h = -99;
    for (const F of frames) {
      const dx = x - F.O[0], dz = z - F.O[1]; if (dx * dx + dz * dz > F.R2) continue;
      const u = dx * F.D[0] + dz * F.D[1], v = dx * F.T[0] + dz * F.T[1];
      for (const d of F.decks) if (u >= d[0] && u <= d[1] && v >= d[2] && v <= d[3] && d[4] <= (y ?? 99) + 1.1 && d[4] > h) h = d[4];
    }
    return h;
  };
  ctx.groundExtra = (x, z, y) => Math.max(prevG ? prevG(x, z, y) : -99, deckAt(x, z, y));
  if (prevS) ctx.surfaceAt = (x, z, y) => { const d = deckAt(x, z, y == null ? 99 : y + 0.3); return d > -50 && (y == null || y > d - 0.3) ? 'wood' : prevS(x, z, y); };
  // âm thanh: sóng vỗ cầu tàu, hải âu
  if (ctx.addSoundZone) { const [x, z] = toW(20, PIER_V); ctx.addSoundZone({ file: 'amb-wave1', x, y: 0.5, z, ref: 8, vol: 0.8 }); ctx.addSoundSpot({ files: ['sfx-gull1', 'sfx-gull2'], x, y: 9, z, ref: 13, vol: 0.5, every: [8, 21], when: 'day' }); }

  // ---------- cập nhật: ẩn khi xa, chợ sáng, bè nhấp nhô ----------
  let vis = true, tick = 0, westT = 0; const westRoot = scene.getObjectByName('sea-jetty-west');
  function update(dt, t) {
    // xa hơn 233 m (điện thoại) / sương + 55 m (máy tính): làng đã chìm trong sương → tắt hẳn (cả model kit) để không tốn draw call ở giữa đảo
    const p = ctx.player.pos, d = Math.hypot(p.x - Ox, p.z - Oz), fogFar = scene.fog ? scene.fog.far : 300, want = d < (MOB ? Math.min(233, fogFar) : fogFar + 55);
    if (want !== vis) { vis = want; root.visible = cage.visible = weed.visible = want; for (const m of kitIM) m.visible = want; if (!want) for (const m of freshIM) m.visible = false; }
    if ((westT -= dt) <= 0) { westT = 0.5; const wv = Math.hypot(p.x - WEST.O[0], p.z - WEST.O[1]) < (MOB ? Math.min(233, fogFar) : fogFar + 55); if (westRoot && westRoot.visible !== wv) westRoot.visible = wv; }
    if (!vis) return;
    const hr = ctx.sky.state.hour, market = hr >= 4.9 && hr < 8.5;
    if ((tick -= dt) <= 0) { tick = 0.5; for (const m of freshIM) if (m.visible !== market) m.visible = market; const pull = hr >= 15.8 && hr < 18.4; if (seine.visible !== pull) seine.visible = pull; }
    if (d < 233) { const cy = terrain.waveHeight(cage.position.x, cage.position.z) * 0.5; cage.position.y += (cy - cage.position.y) * Math.min(1, dt * 3); cage.rotation.z = Math.sin(t * 0.8) * 0.012; weed.position.y = terrain.waveHeight(weed.position.x, weed.position.z) * 0.8; }
  }
  return { update, root, decks, shoreU, hutPos, racks, dry, stalls, mats: mats.map(([du, v]) => ({ u: shoreU(v) + du, v })), cage, weed, get market() { const h = ctx.sky.state.hour; return h >= 4.9 && h < 8.5; } };
}
export { PHI };
