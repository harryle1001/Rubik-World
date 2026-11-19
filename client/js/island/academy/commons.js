// academy/commons.js — 4 PHÒNG SINH HOẠT CHUNG của 4 Nhà Tứ Linh + 4 lối vào bí mật ở 4 góc sân lâu đài.
// Lối vào (plan.js HOUSE_AT): Long = cánh cửa đá · Phụng = bức tranh đố toán · Lân = cây cổ thụ có hốc · Quy = thác nước.
// Chỉ học sinh của nhà đó vào được; mỗi ngày giải 1 câu đố toán để mở (ctx.houses.event('riddle') cộng điểm nhà).
// Phòng = "không gian phép" 21 × 13 × 8 m ngay trên lối vào (HOUSE_ROOM.y): lò sưởi, sofa, bàn học, kệ sách, ký túc xá 4 giường,
// linh vật, cờ nhà, bảng tin nhiệm vụ. Đồ nội thất = model CC0 (kit/furn_*, Kenney Furniture Kit) tô màu nhà bằng instance color.
// Hiệu năng: mỗi lối vào ≤ 4 draw call (chỉ hiện trong 89 m); chỉ dựng 1 phòng (nhà gần nhất) khi cách lối vào < 89 m, chỉ hiện khi ở trong.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { toon } from '../style.js';
import { loadModel, scatterModel } from '../models.js';
import { HOUSES, HOUSE, DOOR_SAY, mathRiddle } from './houses-data.js';
import { HOUSE_AT, HOUSE_ROOM as RM } from './plan.js';
import { bannerTex } from './houses.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const today = () => new Date().toISOString().slice(0, 10);
const dispose = g => g.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); if (o.material && (!o.userData.shared || o.userData.ownMat)) { for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); } } });
const label = (txt, col) => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
  k.font = 'bold 40px system-ui'; k.fillStyle = 'rgba(20,16,34,.82)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.strokeStyle = col; k.lineWidth = 5; k.stroke();
  k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(txt, 256, 50, 460);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(5.3, 1, 1); return sp;
};

// đặt model kit theo hộp bao (tâm đáy về đúng chỗ), co theo chiều cao h; tint: tô màu instance
const boxes = new Map();
async function kitBox(name) { if (!boxes.has(name)) boxes.set(name, loadModel('kit/' + name).then(m => m ? new THREE.Box3().setFromObject(m) : null)); return boxes.get(name); }
async function place(group, name, items, h, tint) {
  const bb = await kitBox(name); if (!bb) return [];
  const sz = bb.getSize(new THREE.Vector3()), s = h > 0 ? h / sz.y : -h / sz.x,   // h < 0: co theo bề rộng |h|
    cx = (bb.min.x + bb.max.x) / 2 * s, cz = (bb.min.z + bb.max.z) / 2 * s;
  const tr = items.map(([x, y, z, ry]) => [x - (cx * Math.cos(ry) + cz * Math.sin(ry)), y - bb.min.y * s, z - (-cx * Math.sin(ry) + cz * Math.cos(ry)), s, ry]);
  const list = await scatterModel(group, 'kit/' + name, tr);
  if (tint) for (const im of list) {   // tô màu nhà: màu đỉnh gốc → độ sáng, nhân màu instance (sofa xanh vẫn ra đúng đỏ/lục/tím)
    const c = new THREE.Color(tint); for (let i = 0; i < im.count; i++) im.setColorAt(i, c); im.instanceColor.needsUpdate = true;
    im.material = im.material.clone(); im.userData.ownMat = true; im.material.customProgramCacheKey = () => 'kit-tint';
    im.material.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', THREE.ShaderChunk.color_vertex.replace('vColor *= color;', 'vColor *= vec3(min(1.0, dot(color.rgb, vec3(0.299, 0.587, 0.114)) * 1.6));')); };
  }
  for (const im of list) { im.castShadow = false; im.userData.shared = true; }   // geometry/vật liệu thuộc cache models.js
  return list;
}

export function create(ctx, magic, { toWorld, toLocal, Y }) {
  const { player } = ctx, FY = Y + RM.y, hw = RM.w / 2, hd = RM.d / 2;
  const st = load('academy.doors', {});                                   // { [id]: ngày đã giải đố }
  const E = HOUSES.map(h => { const [u, v, a] = HOUSE_AT[h.id], [x, z] = toWorld(u, v); return { h, u, v, a, x, z, fx: Math.sin(a), fz: Math.cos(a), g: null, mov: null, open: 0 }; });
  const front = (e, d) => [e.x + e.fx * d, e.z + e.fz * d];

  // ---------- 4 lối vào (khung cục bộ: tường ở z = 0, +z quay ra sân) ----------
  function buildDoor(e) {
    const h = e.h, b = new Batch(), gl = new Batch(), g = new THREE.Group(); g.position.set(e.x, Y, e.z); g.rotation.y = e.a; g.name = 'house-door-' + h.id;
    const stone = '#8c8478', dark = '#4a4440', wood = '#6e4a30', gold = '#d4a24a';
    let mov = null;
    if (h.id === 'long') {   // cánh cửa đá: vòm đá + 2 lò lửa, cửa trượt sang bên
      b.box(-2.6, 2.6, 0, 6.5, 0, 0.6, dark); b.box(-3.4, -2.6, 0, 5.5, 0, 0.9, stone); b.box(2.6, 3.4, 0, 5.5, 0, 0.9, stone); b.box(-3.4, 3.4, 5.5, 6.5, 0, 0.9, stone);
      for (const s of [-1, 1]) { b.cyl(s * 4.2, 0, 1.2, 0.34, 1.3, dark, 8, 0.5); gl.add(new THREE.ConeGeometry(0.3, 0.8, 7), '#ff8a2a', s * 4.2, 1.7, 1.2); gl.add(new THREE.ConeGeometry(0.16, 0.55, 6), '#ffe08a', s * 4.2, 1.65, 1.2); }
      const d = new Batch(); d.box(-2.1, 2.1, 0, 5.5, 0, 0.5, '#6a625a');
      for (let r = 0; r < 5; r++) for (let k = -2; k <= 2; k++) d.add(new THREE.OctahedronGeometry(0.21), r % 2 ? h.col : h.col2, k * 0.75 + (r % 2) * 0.37, 0.9 + r * 0.9, 0.52, 0, 0, 0, 1, 1.3, 0.3);   // vảy rồng
      mov = new THREE.Mesh(d.build(), toon('#ffffff', { vertexColors: true })); mov.position.z = 0.62; mov.castShadow = true;
      mov.userData.anim = (m, k) => { m.position.x = -k * 4.3; };
    } else if (h.id === 'phung') {   // khung tranh vàng; tranh xoay mở quanh cạnh trái
      b.box(-2, 2, 0.6, 5.2, 0, 0.2, dark); b.box(-2.2, 2.2, 0.4, 0.7, 0, 0.5, gold); b.box(-2.2, 2.2, 5, 5.3, 0, 0.5, gold); b.box(-2.2, -1.9, 0.4, 5.3, 0, 0.5, gold); b.box(1.9, 2.2, 0.4, 5.3, 0, 0.5, gold);
      const c = document.createElement('canvas'); c.width = 256; c.height = 320; const k = c.getContext('2d'), gr = k.createLinearGradient(0, 0, 0, 320);
      gr.addColorStop(0, '#9fc9f0'); gr.addColorStop(1, '#f3e6c8'); k.fillStyle = gr; k.fillRect(0, 0, 256, 320);
      k.fillStyle = '#ffffffaa'; for (let i = 0; i < 5; i++) { k.beginPath(); k.ellipse(40 + i * 47, 60 + (i % 2) * 34, 34, 13, 0, 0, 6.29); k.fill(); }
      k.fillStyle = '#6a8a5a'; k.beginPath(); k.moveTo(0, 320); k.lineTo(70, 230); k.lineTo(130, 280); k.lineTo(200, 210); k.lineTo(256, 260); k.lineTo(256, 320); k.fill();
      k.font = '120px "Noto Color Emoji",system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('🦚', 128, 160);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const pg = new THREE.PlaneGeometry(3.8, 4.3).translate(1.9, 2.85, 0);
      mov = new THREE.Mesh(pg, new THREE.MeshToonMaterial({ map: t })); mov.position.set(-1.9, 0, 0.22);
      mov.userData.anim = (m, k) => { m.rotation.y = -k * 1.9; };
    } else if (h.id === 'lan') {   // cây cổ thụ: thân + rễ + tán, hốc cây phát sáng khi mở
      b.cyl(0, 0, 2.2, 2, 2.2, '#6e5038', 10, 1.6); b.cyl(0, 2.2, 2.2, 1.6, 4.6, '#7a5a3e', 10, 1.2);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; b.add(new THREE.ConeGeometry(0.45, 2.6, 5), '#5e4330', Math.cos(a) * 2, 0.3, 2.2 + Math.sin(a) * 2, 0, Math.PI / 2 * Math.sign(Math.cos(a) || 1), 0, 1, 1, 0.5); }
      for (let i = 0; i < 13; i++) { const a = i * 2.4, r = 1.3 + (i % 5) * 0.62; b.add(new THREE.IcosahedronGeometry(1.6 + (i % 3) * 0.5, 0), ['#3f7a3c', '#4f8a44', '#5f9a4a'][i % 3], Math.cos(a) * r, 7 + (i % 4) * 0.8, 2.2 + Math.sin(a) * r); }
      b.add(new THREE.CircleGeometry(0.9, 10).scale(1, 1.6, 1), '#1a120c', 0, 1.6, 4.17);
      for (let i = 0; i < 8; i++) gl.add(new THREE.SphereGeometry(0.13, 5, 4), i % 2 ? '#ffe08a' : '#b8f08a', Math.cos(i * 2.4) * 2.6, 5.5 + (i % 3), 2.2 + Math.sin(i * 2.4) * 2.6);   // hoa đom đóm
      mov = new THREE.Mesh(new THREE.CircleGeometry(0.85, 12).scale(1, 1.6, 1), new THREE.MeshBasicMaterial({ color: h.col2, transparent: true, opacity: 0 })); mov.position.set(0, 1.6, 4.19);
      mov.userData.anim = (m, k) => { m.material.opacity = k * 0.9; m.material.color.set(k > 0.5 ? '#ffe08a' : h.col2); };
    } else {   // thác nước: vách đá + màn nước cuộn + hồ nhỏ; nước rẽ đôi khi mở
      for (let i = 0; i < 9; i++) { const c = i % 3, r = Math.floor(i / 3); if (c === 1 && r < 2) continue; b.add(new THREE.DodecahedronGeometry(1.2 + (i % 2) * 0.4, 0), i % 2 ? '#6f6a64' : '#837c74', (c - 1) * 2.9, 1 + r * 2.4, -0.2); }   // vách đá 2 bên + trên, chừa giữa cho màn nước
      b.box(-1.7, 1.7, 0, 5.2, 0, 0.4, '#1d2a33');
      b.add(new THREE.RingGeometry(2.1, 2.6, 13).rotateX(-Math.PI / 2), '#6f6a64', 0, 0.12, 2.2);
      gl.add(new THREE.CircleGeometry(2.1, 13).rotateX(-Math.PI / 2), '#3fa8c8', 0, 0.1, 2.2);
      const c = document.createElement('canvas'); c.width = 64; c.height = 128; const k = c.getContext('2d');
      for (let x = 0; x < 64; x += 4) { k.fillStyle = `rgba(${200 + (x * 7) % 55},240,255,${0.45 + ((x * 13) % 7) / 20})`; k.fillRect(x, 0, 3, 128); k.fillStyle = '#ffffffcc'; k.fillRect(x, (x * 37) % 128, 3, 13); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
      mov = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.4).translate(0, 2.7, 0), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.85, depthWrite: false })); mov.position.z = 0.9;
      mov.userData.anim = (m, k, t) => { m.material.map.offset.y = t * 1.3; m.scale.x = 1 - k * 0.9; };
    }
    const m = new THREE.Mesh(b.build(), toon('#ffffff', { vertexColors: true })); m.castShadow = m.receiveShadow = true; g.add(m);
    if (gl.list.length) g.add(new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true })));
    g.add(mov); const sp = label(`${h.icon} ${h.name}`, h.col); sp.position.set(0, h.id === 'lan' ? 10.5 : 7.4, 1); g.add(sp);
    e.g = g; e.mov = mov; ctx.scene.add(g);
  }

  // ---------- phòng sinh hoạt chung (khung cục bộ: x = trục dài 21 m, z = 13 m; sàn y = 0) ----------
  let room = null;   // { e, g, ready }
  function buildRoom(e) {
    const h = e.h, g = new THREE.Group(); g.position.set(e.x, FY, e.z); g.name = 'house-room-' + h.id; g.visible = false;
    const R = { e, g, board: null, boardTex: null }; room = R;
    const b = new Batch(), gl = new Batch(), wood = '#6e4a30', woodL = '#a8744a', stone = '#8c8478', W = new THREE.Color(stone).lerp(new THREE.Color(h.col), 0.22).getStyle(), Hr = RM.h;
    b.box(-hw, hw, -0.3, 0, -hd, hd, '#7a5a3e'); b.box(-hw, hw, Hr, Hr + 0.3, -hd, hd, '#4a3426');                                   // sàn, trần
    b.box(-hw - 0.4, -hw, 0, Hr, -hd, hd, W); b.box(hw, hw + 0.4, 0, Hr, -hd, hd, W); b.box(-hw, hw, 0, Hr, -hd - 0.4, -hd, W); b.box(-hw, hw, 0, Hr, hd, hd + 0.4, W);
    for (const z of [-hd + 0.02, hd - 0.02]) b.box(-hw, hw, 0, 1.2, z - 0.05, z + 0.05, wood);                                     // ốp gỗ chân tường
    for (const x of [-hw + 0.02, hw - 0.02]) b.box(x - 0.05, x + 0.05, 0, 1.2, -hd, hd, wood);
    for (let x = -hw + 2.6; x < hw; x += 4.2) b.box(x - 0.2, x + 0.2, Hr - 0.5, Hr, -hd, hd, wood);                                  // xà trần
    b.box(-hw, hw, 3.1, 3.3, -hd + 0.02, -hd + 0.1, h.col); b.box(-hw, hw, 3.1, 3.3, hd - 0.1, hd - 0.02, h.col);                    // đường viền màu nhà
    // lò sưởi ở tường tây
    b.box(-hw, -hw + 0.9, 0, 3.4, -2.1, -1.3, stone); b.box(-hw, -hw + 0.9, 0, 3.4, 1.3, 2.1, stone); b.box(-hw, -hw + 0.9, 1.8, 3.4, -1.3, 1.3, stone); b.box(-hw, -hw + 0.06, 0, 1.8, -1.3, 1.3, '#1a1210');   // khung lò + hốc lửa b.box(-hw, -hw + 1.2, 3.4, 3.6, -2.6, 2.6, woodL); b.box(-hw, -hw + 0.7, 3.6, Hr, -1.4, 1.4, stone);
    for (let k = -2; k <= 2; k++) gl.add(new THREE.ConeGeometry(0.21 - Math.abs(k) * 0.03, 0.9 - Math.abs(k) * 0.15, 6), k % 2 ? '#ffb347' : '#ff7a2a', -hw + 0.6, 0.6, k * 0.42);
    gl.add(new THREE.BoxGeometry(0.4, 0.1, 2.4), '#ff5a1a', -hw + 0.6, 0.22, 0);
    // ký túc xá: vách ngăn x = 4,5 (lối giữa 2,6 m) + 4 giường có màn
    b.box(4.4, 4.6, 0, 2.6, -hd, -1.3, woodL); b.box(4.4, 4.6, 0, 2.6, 1.3, hd, woodL);
    for (const z of [-4.9, -1.65, 1.65, 4.9]) {
      b.box(7.6, 10.3, 0, 0.45, z - 0.62, z + 0.62, wood); b.box(7.7, 10.2, 0.45, 0.62, z - 0.55, z + 0.55, '#f3efe6'); b.box(7.7, 9.4, 0.62, 0.7, z - 0.57, z + 0.57, h.col); b.box(9.55, 10.1, 0.62, 0.8, z - 0.4, z + 0.4, '#ffffff');
      for (const x of [7.65, 10.25]) for (const s of [-1, 1]) b.cyl(x, 0, z + s * 0.58, 0.05, 2.6, wood, 5);
      b.box(7.6, 10.3, 2.6, 2.7, z - 0.65, z + 0.65, h.col2); b.box(6.9, 7.5, 0, 0.55, z - 0.4, z + 0.4, h.col2);                        // nóc màn · rương
    }
    // cửa ra (vòm sáng) ở tường nam
    b.box(0.2, 2.8, 3.3, 3.6, hd - 0.3, hd, '#d4a24a'); b.box(0.2, 0.5, 0, 3.3, hd - 0.3, hd, '#d4a24a'); b.box(2.5, 2.8, 0, 3.3, hd - 0.3, hd, '#d4a24a');
    gl.add(new THREE.PlaneGeometry(2, 3.3).translate(0, 1.65, 0), h.col2, 1.5, 0, hd - 0.05, Math.PI);
    // linh vật: bệ + tượng pha lê (sprite) ở tường nam; bảng tin + 2 cờ ở tường bắc
    b.cyl(-4.2, 0, hd - 1.6, 0.9, 0.8, stone, 10, 0.75); b.cyl(-4.2, 0.8, hd - 1.6, 0.95, 0.12, '#d4a24a', 10);
    b.box(-4.9, -1.9, 1.1, 3.1, -hd + 0.02, -hd + 0.14, wood);
    // điểm nhấn từng nhà
    if (h.id === 'long') for (let k = 0; k < 8; k++) gl.add(new THREE.BoxGeometry(0.9 + (k % 3) * 0.4, 0.02, 0.09), '#ff5a1a', -hw + 1.6 + (k % 4) * 0.9, 0.01, -1.8 + k * 0.5, k * 0.7);
    if (h.id === 'phung') for (const x of [-8, 5.5]) { b.box(x - 0.9, x + 0.9, 1.6, 5.2, -hd + 0.02, -hd + 0.08, '#d9e2ec'); gl.add(new THREE.PlaneGeometry(1.5, 3.3), '#bfe3ff', x, 3.4, -hd + 0.1); }
    if (h.id === 'quy') { b.add(new THREE.RingGeometry(1.6, 1.9, 13).rotateX(-Math.PI / 2), stone, -1.2, 0.03, hd - 1.9); gl.add(new THREE.CircleGeometry(1.6, 13).rotateX(-Math.PI / 2), '#3fa8c8', -1.2, 0.02, hd - 1.9); }
    const mm = new THREE.Mesh(b.build(), toon('#ffffff', { vertexColors: true })); mm.receiveShadow = true; g.add(mm);
    g.add(new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    const bt = bannerTex(h), bg = new THREE.PlaneGeometry(2.1, 3.4).translate(0, -1.7, 0);
    for (const x of [-7.6, 0.8]) { const o = new THREE.Mesh(bg, new THREE.MeshToonMaterial({ map: bt, transparent: true, alphaTest: 0.5 })); o.position.set(x, 6.4, -hd + 0.12); g.add(o); }
    // linh vật
    const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d'), rg = k.createRadialGradient(128, 128, 21, 128, 128, 128);
    rg.addColorStop(0, h.col2 + 'aa'); rg.addColorStop(1, h.col2 + '00'); k.fillStyle = rg; k.fillRect(0, 0, 256, 256);
    const ms = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); ms.scale.set(3.4, 3.4, 1); ms.position.set(-4.2, 2.1, hd - 1.6); g.add(ms);   // hào quang
    // linh vật = model CC0 trên bệ (v2, thay emoji): Long = rồng (Quaternius), Phụng = đại bàng tô màu phượng (Quaternius), Lân = hươu gạc (kỳ lân Việt có gạc), Quy = rùa
    const MS = { long: ['kit/qn_dragon', 1.6, 0], phung: ['kit/qn_eagle', 1.3, 0.45], lan: ['kit/qn_stag_statue', 1.5, 0.35], quy: ['rua', 0.9, 0.15] }[h.id] || ['rua', 1, 0];
    const mg = new THREE.Group(); mg.position.set(-4.2, 0.92, hd - 1.6); mg.rotation.y = Math.PI; g.add(mg); R.mascot = mg;
    loadModel(MS[0]).then(m => { if (!m || room !== R) return; const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3()), s = MS[1] / Math.max(sz.y, sz.x * 0.6, sz.z * 0.6);
      m.scale.setScalar(s); m.position.set(-(bb.min.x + bb.max.x) / 2 * s, -bb.min.y * s, -(bb.min.z + bb.max.z) / 2 * s);
      if (MS[2]) m.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(h.col), MS[2]); } });
      mg.add(m); });
    // bảng tin
    const bc = document.createElement('canvas'); bc.width = 512; bc.height = 384; R.board = bc; R.boardTex = new THREE.CanvasTexture(bc); R.boardTex.colorSpace = THREE.SRGBColorSpace;
    const bo = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.85), new THREE.MeshBasicMaterial({ map: R.boardTex })); bo.position.set(-3.4, 2.1, -hd + 0.16); g.add(bo); drawBoard(R);
    ctx.scene.add(g);
    // nội thất CC0 (Kenney Furniture Kit) — tô màu nhà
    const tint = new THREE.Color(h.col).lerp(new THREE.Color('#ffffff'), 0.13).getStyle();
    place(g, 'furn_rug', [[-6.4, 0.01, 0, Math.PI / 2]], -5.5, tint);
    place(g, 'furn_couch', [[-4.4, 0, 0, -Math.PI / 2]], 0.9, tint);
    place(g, 'furn_armchair', [[-7.4, 0, -2.8, 0], [-7.4, 0, 2.8, Math.PI]], 0.9, tint);
    place(g, 'furn_table', [[0.6, 0, -2.6, 0], [0.6, 0, 2.6, 0]], 0.78);
    place(g, 'furn_chair', [[-0.5, 0, -2.6, Math.PI / 2], [1.7, 0, -2.6, -Math.PI / 2], [-0.5, 0, 2.6, Math.PI / 2], [1.7, 0, 2.6, -Math.PI / 2]], 0.95);
    place(g, 'furn_bookshelf_full', [[2.9, 0, -hd + 0.35, 0], [-8.6, 0, hd - 0.35, Math.PI]], 2.6);
    if (h.id === 'lan') place(g, 'qn_bush_berry', [[-hw + 1, 0, -hd + 1, 0], [3.6, 0, hd - 1, 1], [-hw + 1, 0, hd - 1, 2], [3.6, 0, -hd + 1.6, 3]], 1.1);
    if (h.id === 'quy') loadModel('rua').then(m => { if (!m || room !== R) return; const bb = new THREE.Box3().setFromObject(m), s = 1.3 / Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z); m.scale.setScalar(s); m.position.set(-1.2, -bb.min.y * s + 0.05, hd - 1.9); g.add(m); });
    return R;
  }
  function drawBoard(R) {
    const k = R.board.getContext('2d'), h = R.e.h; k.fillStyle = '#5a3e28'; k.fillRect(0, 0, 512, 384); k.fillStyle = '#e9dcc0'; k.fillRect(13, 13, 486, 358);
    k.fillStyle = h.col; k.fillRect(13, 13, 486, 55); k.fillStyle = '#fff'; k.font = 'bold 30px system-ui'; k.textBaseline = 'middle'; k.fillText(`${h.name} — Bảng tin`, 34, 42);
    k.fillStyle = '#2a2018'; k.font = '22px system-ui';
    const lines = ctx.houses && ctx.houses.boardLines ? ctx.houses.boardLines(h.id) : [`“${h.motto}”`, `Phẩm chất: ${h.trait}`, '', 'Nhiệm vụ nhà: sắp có!'];
    lines.forEach((t, i) => k.fillText(t, 30, 100 + i * 34, 452));
    R.boardTex.needsUpdate = true;
  }
  function unbuildRoom() { if (!room) return; ctx.scene.remove(room.g); dispose(room.g); room = null; }

  // ---------- vào / ra ----------
  const inside = () => room && player.pos.y > FY - 1.5 && Math.abs(player.pos.x - room.e.x) < hw + 3 && Math.abs(player.pos.z - room.e.z) < hd + 3;
  let opening = null;   // { e, t }
  function tryDoor(e) {
    const my = ctx.houses && ctx.houses.houseId();
    if (!my) return ctx.toast(`🔒 ${e.h.door} của <b>${e.h.name}</b> chưa mở. Hãy tới <b>Quả cầu Tứ Linh</b> ở Đại sảnh để được chọn Nhà!`, 4200);
    if (my !== e.h.id) return ctx.toast(`🔒 Chỉ học sinh <b>${e.h.name}</b> ${e.h.icon} mới vào được lối này. Nhà của em là <b>${HOUSE[my].name}</b> ${HOUSE[my].icon}.`, 4200);
    if (st[e.h.id] === today()) return (opening = { e, t0: performance.now() });
    ctx.toast(DOOR_SAY[e.h.id], 3500);
    magic.ask(mathRiddle(), () => { st[e.h.id] = today(); save('academy.doors', st); ctx.houses && ctx.houses.event && ctx.houses.event('riddle'); opening = { e, t0: performance.now() }; }, `${e.h.icon} Câu đố của ${e.h.door.toLowerCase()}`);
  }
  function enter(e) {
    if (!room || room.e !== e) { unbuildRoom(); buildRoom(e); }
    room.g.visible = true; player.teleport(e.x + 1.5, e.z + hd - 2.2, FY);   // hiện trước khi dịch chuyển → camera tránh tường (cam-occlude dựng lại danh sách) player.setRot && player.setRot(Math.PI);
    ctx.toast(`${e.h.icon} Chào mừng về <b>phòng sinh hoạt chung ${e.h.name}</b>! Bảng tin ở tường đối diện, ký túc xá phía đông.`, 4200); ctx.sfx && ctx.sfx('confirm');
  }
  const leave = e => { const [x, z] = front(e, 3.4); player.teleport(x, z, Y); };

  // ---------- groundExtra: sàn phòng ----------
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => { let h = prevExtra ? prevExtra(x, z, y) : -99; if (room && Math.abs(x - room.e.x) < hw && Math.abs(z - room.e.z) < hd && y !== undefined && y > FY - 21) h = Math.max(h, FY); return h; };   // chỉ người ở trên cao (không kéo vật dưới sân lên)

  let built = false;
  function build() { if (built) return; built = true; for (const e of E) buildDoor(e); }
  function unbuild() { if (!built) return; built = false; for (const e of E) { ctx.scene.remove(e.g); dispose(e.g); e.g = null; } unbuildRoom(); }
  function update(dt, t) {
    if (!built) return;
    const p = player.pos, inR = inside();
    let best = null, bd = 1e9;
    for (const e of E) { const d = Math.hypot(p.x - e.x, p.z - e.z); e.g.visible = d < RM.load && !inR; if (d < bd) { bd = d; best = e; } }
    // dựng phòng của nhà gần nhất khi tới gần; dỡ khi xa
    if (!inR && bd < RM.load && (!room || room.e !== best) && ctx.houses && ctx.houses.houseId() === best.h.id) { unbuildRoom(); buildRoom(best); }
    else if (room && !inR && Math.hypot(p.x - room.e.x, p.z - room.e.z) > RM.load + 34) unbuildRoom();
    if (room) {
      room.g.visible = inR;
      if (inR) {   // giữ trong tường
        p.x = Math.max(room.e.x - hw + 0.45, Math.min(room.e.x + hw - 0.45, p.x)); p.z = Math.max(room.e.z - hd + 0.45, Math.min(room.e.z + hd - 0.45, p.z));
        room.mascot.position.y = 0.92 + Math.max(0, Math.sin(t * 1.3)) * 0.13; room.mascot.rotation.y = Math.PI + Math.sin(t * 0.4) * 0.5;   // linh vật nhún + ngoái nhìn
      }
    }
    for (const e of E) if (e.g.visible) { const k = opening && opening.e === e ? Math.min(1, (performance.now() - opening.t0) / 1300) : Math.max(0, e.open - dt); e.open = k; e.mov.userData.anim(e.mov, k, t); }
    if (opening) { if (performance.now() - opening.t0 > 1600) { const e = opening.e; opening = null; enter(e); } }
    if (player.vehicle || (ctx.houses && ctx.houses.card)) return;
    if (inR) {
      const lx = p.x - room.e.x, lz = p.z - room.e.z, h = room.e.h;
      if (Math.hypot(lx - 1.5, lz - hd) < 2.2) ctx.offer('🚪 Ra sân lâu đài', () => leave(room.e), 9);
      else if (Math.hypot(lx + 3.4, lz + hd) < 2.6) ctx.offer('📋 Xem bảng tin nhà', () => ctx.houses && ctx.houses.showTasks ? ctx.houses.showTasks() : ctx.toast(`📋 ${h.name}: “${h.motto}”`, 3500), 8);
      else if (lx > 6.5 && Math.abs(lz) < hd) ctx.offer('🛏️ Nghỉ ngơi một chút', () => { ctx.toast('😴 Em nằm nghỉ trên giường êm… +13 năng lượng phép!', 3000); magic.setMana && magic.setMana(magic.mana + 13); }, 7);
      else if (lx < -6 && Math.abs(lz) < 3.4) ctx.offer('🔥 Sưởi ấm bên lò', () => ctx.toast(`🔥 Lửa lò reo tí tách. ${h.icon} <i>“${h.motto}”</i>`, 3500), 6);
      return;
    }
    if (bd < 3 && Math.abs(p.y - Y) < 2.5 && !opening) ctx.offer(`${best.h.icon} ${best.h.door} — ${best.h.name}`, () => tryDoor(best), 9);
  }
  const api = { build, unbuild, update, redraw: () => room && drawBoard(room), tryDoor: id => tryDoor(E.find(e => e.h.id === id)), enter: id => enter(E.find(e => e.h.id === id)) };
  if (ctx.houses) ctx.houses.rooms = api;
  return api;
}
