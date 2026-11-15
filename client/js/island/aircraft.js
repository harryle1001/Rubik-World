// aircraft.js — SÂN BAY CÁNH DIỀU + máy bay cổ điển (2 tầng cánh, thủy phi cơ, máy bay đua thập niên 30) + đàn chim.
// Người chơi lên máy bay đỗ ở sân bay, cất cánh trên đường băng và bay khắp bản đồ (camera thứ 3 bám đuôi).
// Tự chứa: chỉ cần ocean.js gọi createAircraft(ctx) và aircraft.update(dt, t) sau vehicles.update.
import * as THREE from 'three';
import { CFG } from './config.js';
import { gradientMap, addOutline } from './style.js';
import { mergeGeos } from './terrain.js';
import { TOWN_Y, BLOCKS, EXTRA } from './layout.js';

const AIR = EXTRA.find(e => e.id === 'K').r;                // khu sân bay [x0,z0,x1,z1]
const RWY = { x0: AIR[0] + 6, x1: AIR[2] - 6, z: AIR[3] - 13, w: 12 }; // đường băng chạy theo trục x
const GY = TOWN_Y;                                            // cao độ mặt sân bay
const CENTER = [65, 0], BOUND = 215;                          // tâm thế giới & bán kính bay tối đa

const FACTS = [
  'Mặt trên cánh máy bay cong hơn: gió chạy nhanh hơn, áp suất giảm → tạo <b>lực nâng</b> đỡ máy bay.',
  'Anh em nhà Wright bay chuyến đầu tiên năm <b>1903</b>: chỉ 12 giây và xa 37 mét!',
  'Máy bay <b>2 tầng cánh</b> có nhiều diện tích cánh nên bay chậm vẫn không bị rơi.',
  'Càng lên cao không khí càng loãng và lạnh: lên 1000 m nhiệt độ giảm khoảng <b>6°C</b>.',
  'Cánh quạt đẩy không khí ra sau, máy bay tiến về trước: đó là <b>định luật 3 Newton</b>.',
  'Ống gió ở sân bay chỉ hướng gió. Máy bay cất cánh <b>ngược chiều gió</b> để dễ bay lên.',
  'Chim bay thành hình chữ <b>V</b> để đỡ mệt: con sau bay trong luồng khí nâng của con trước.',
  'Mặt Trời mọc ở hướng <b>Đông</b>, lặn ở hướng <b>Tây</b>: phi công xưa dùng nó để định hướng.',
  'Thủy phi cơ có <b>phao</b> thay bánh xe nên cất và hạ cánh được ngay trên mặt nước.',
  'Không khí cũng có khối lượng: 1 mét khối không khí nặng khoảng <b>1,2 kg</b>.',
];
const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];

// ---------- dựng hình bằng khối cơ bản, gộp thành 1 mesh màu theo đỉnh ----------
const C = new THREE.Color();
function part(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  let g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv');
  g.scale(sx, sy, sz); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz); g.translate(x, y, z);
  C.set(color); const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const vmat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
const lampMat = new THREE.MeshBasicMaterial({ vertexColors: true });
function meshOf(parts, mat = vmat, outline = true) {
  const m = new THREE.Mesh(mergeGeos(parts), mat); m.castShadow = true; m.receiveShadow = true;
  if (outline) addOutline(m); return m;
}

// Kiểu máy bay: màu thân, cánh, viền trang trí
const STYLES = {
  chimlua:  { name: 'Chim Lửa',  kind: 'bi',   body: '#c8302a', wing: '#f2e6c8', trim: '#f0c040', strut: '#5a3a22' },
  hoanggia: { name: 'Hoàng Gia', kind: 'bi',   body: '#1f3f8a', wing: '#f4ecd2', trim: '#e2b33c', strut: '#e2b33c' },
  bacgio:   { name: 'Bạc Gió',   kind: 'mono', body: '#c9ced6', wing: '#c9ced6', trim: '#c8302a', strut: '#3a3a44' },
  nghe:     { name: 'Chim Nghệ', kind: 'bi',   body: '#f2b632', wing: '#f7eccc', trim: '#2a5a9a', strut: '#5a3a22' },
  hailau:   { name: 'Hải Âu',    kind: 'sea',  body: '#f3ead4', wing: '#2f6db0', trim: '#c8302a', strut: '#3a3a44' },
  tim:      { name: 'Tử Đằng',   kind: 'bi',   body: '#6a3a8a', wing: '#efe3f4', trim: '#e2b33c', strut: '#e2b33c' },
  luc:      { name: 'Lục Bảo',   kind: 'mono', body: '#2f7a4a', wing: '#e9e2c6', trim: '#f2f2f2', strut: '#3a3a44' },
};

// Máy bay mũi hướng +Z, bánh chạm đất ở y = 0. Trả về { group, prop, disc, seat }
function makePlane(st, pilot = false) {
  const p = [], { body, wing, trim, strut } = st, dark = '#2b2b30', wood = '#7a4a26', cream = '#efe3c2';
  // thân thuôn: mũi to, đuôi nhỏ
  p.push(part(cyl(0.56, 0.22, 5.2, 10), body, 0, 1.05, -0.2, Math.PI / 2));
  p.push(part(cyl(0.62, 0.6, 0.7, 12), dark, 0, 1.05, 2.55, Math.PI / 2));          // nắp động cơ
  p.push(part(cyl(0.57, 0.57, 0.12, 12), trim, 0, 1.05, 2.2, Math.PI / 2));         // vòng viền mạ vàng
  p.push(part(box(0.06, 0.12, 4.2), trim, 0.5, 1.15, -0.3)); p.push(part(box(0.06, 0.12, 4.2), trim, -0.5, 1.15, -0.3)); // sọc thân
  p.push(part(cyl(0.42, 0.42, 0.1, 10), '#1a1a1e', 0, 1.6, 0.05));                   // lỗ buồng lái
  p.push(part(box(0.8, 0.35, 0.05), '#bfe3f0', 0, 1.78, 0.6, -0.5));                 // kính chắn gió
  // đuôi
  p.push(part(box(2.8, 0.08, 0.8), wing, 0, 1.1, -2.55)); p.push(part(box(0.08, 1.1, 0.95), body, 0, 1.6, -2.6));
  p.push(part(box(0.1, 0.35, 0.5), trim, 0, 2.0, -2.7));
  // ống xả 2 bên
  for (const s of [-1, 1]) p.push(part(cyl(0.07, 0.07, 1.2, 6), '#555', s * 0.6, 0.9, 1.6, Math.PI / 2));
  if (st.kind === 'bi') {
    p.push(part(box(7.6, 0.12, 1.35), wing, 0, 0.62, 0.85)); p.push(part(box(8.2, 0.12, 1.35), wing, 0, 2.15, 1.05));
    for (const s of [-1, 1]) {
      p.push(part(box(0.9, 0.13, 1.37), trim, s * 3.4, 2.16, 1.05)); p.push(part(box(0.8, 0.13, 1.37), trim, s * 3.3, 0.63, 0.85));
      p.push(part(cyl(0.38, 0.38, 0.14, 12), trim, s * 2.4, 2.22, 1.05)); p.push(part(cyl(0.22, 0.22, 0.15, 10), body, s * 2.4, 2.24, 1.05)); // phù hiệu tròn
      for (const zz of [0.5, 1.4]) p.push(part(box(0.07, 1.5, 0.07), strut, s * 2.7, 1.4, zz));   // thanh chống cánh
      p.push(part(box(0.06, 0.7, 0.06), strut, s * 0.45, 1.85, 1.05));                              // chống giữa
      p.push(part(box(0.03, 1.7, 0.03), '#ddd', s * 1.9, 1.4, 0.95, 0, 0, s * 0.45));              // dây chéo
    }
  } else {
    const y = st.kind === 'sea' ? 1.75 : 0.72;                                                       // thủy phi cơ cánh cao
    p.push(part(box(8.6, 0.16, 1.6), wing, 0, y, 0.7)); p.push(part(box(8.7, 0.17, 0.25), trim, 0, y, 0.0));
    for (const s of [-1, 1]) p.push(part(cyl(0.3, 0.3, 0.18, 12), trim, s * 3.2, y + 0.06, 0.8));
    if (st.kind === 'sea') for (const s of [-1, 1]) p.push(part(box(0.07, 1.0, 0.07), strut, s * 1.6, 1.25, 0.7, 0, 0, s * 0.5));
  }
  // càng: bánh xe hoặc phao
  if (st.kind === 'sea') {
    for (const s of [-1, 1]) {
      p.push(part(box(0.45, 0.4, 4.2), cream, s * 1.2, 0.2, 0.3)); p.push(part(box(0.46, 0.08, 4.22), trim, s * 1.2, 0.36, 0.3));
      p.push(part(box(0.45, 0.3, 0.6), cream, s * 1.2, 0.35, 2.5, -0.5));
      for (const zz of [1.2, -0.4]) p.push(part(box(0.07, 0.75, 0.07), strut, s * 0.8, 0.65, zz, 0, 0, s * 0.6));
    }
  } else {
    for (const s of [-1, 1]) {
      p.push(part(cyl(0.34, 0.34, 0.16, 12), '#222', s * 0.85, 0.34, 1.25, 0, 0, Math.PI / 2));
      p.push(part(cyl(0.16, 0.16, 0.18, 8), trim, s * 0.85, 0.34, 1.25, 0, 0, Math.PI / 2));
      p.push(part(box(0.07, 0.8, 0.07), strut, s * 0.55, 0.65, 1.25, 0, 0, s * 0.5));
      if (st.kind === 'mono') p.push(part(box(0.24, 0.5, 0.7), body, s * 0.85, 0.42, 1.25)); // ốp bánh kiểu máy bay đua
    }
    p.push(part(box(0.06, 0.5, 0.06), strut, 0, 0.6, -2.5, 0.5));                           // nạng đuôi
  }
  if (pilot) { // phi công đội mũ da, kính bay
    p.push(part(new THREE.SphereGeometry(0.26, 8, 6), '#f1c9a0', 0, 1.88, 0));
    p.push(part(new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, 1.7), '#6b4226', 0, 1.92, -0.02));
    p.push(part(box(0.44, 0.09, 0.08), '#333', 0, 1.92, 0.24)); p.push(part(box(0.5, 0.25, 0.4), '#f2f2f2', 0, 1.6, 0));
  }
  const g = new THREE.Group(), m = meshOf(p); g.add(m);
  // cánh quạt (quay) + đĩa mờ khi quay nhanh
  const prop = meshOf([part(box(0.14, 2.3, 0.07), wood, 0, 0, 0), part(new THREE.ConeGeometry(0.2, 0.45, 8), trim, 0, 0, 0.18, Math.PI / 2)], vmat, false);
  prop.position.set(0, 1.05, 2.98); g.add(prop);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 18), new THREE.MeshBasicMaterial({ color: '#e8e2d0', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
  disc.position.set(0, 1.05, 3.0); g.add(disc);
  // đèn hàng hải đầu cánh: đỏ trái (+x), xanh phải (-x)
  const wy = st.kind === 'bi' ? 2.15 : st.kind === 'sea' ? 1.75 : 0.72, wx = st.kind === 'bi' ? 4.15 : 4.35;
  g.add(meshOf([part(new THREE.SphereGeometry(0.12, 6, 4), '#ff3a2a', wx, wy, 1), part(new THREE.SphereGeometry(0.12, 6, 4), '#2aff6a', -wx, wy, 1)], lampMat, false));
  g.scale.setScalar(1.35); g.rotation.order = 'YXZ';
  return { group: g, prop, disc, style: st, seat: new THREE.Vector3(0, 0.95, -0.05) };
}

// Âm thanh động cơ piston (tự tổng hợp, lặp 1 giây không vấp)
function engineBuffer(ac) {
  const sr = ac.sampleRate, n = sr, b = ac.createBuffer(1, n, sr), d = b.getChannelData(0); let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, beat = 0.55 + 0.45 * Math.max(0, Math.sin(2 * Math.PI * 18 * t));
    const s = 0.5 * Math.sin(2 * Math.PI * 54 * t) + 0.28 * Math.sin(2 * Math.PI * 108 * t) + 0.16 * Math.sign(Math.sin(2 * Math.PI * 27 * t)) + 0.12 * Math.sin(2 * Math.PI * 162 * t);
    lp += ((Math.random() * 2 - 1) - lp) * 0.08; d[i] = (s * beat + lp * 0.35) * 0.55;
  }
  return b;
}

export function createAircraft(ctx) {
  const { scene, camera, terrain, player } = ctx, W = CFG.island.waterLevel, mobile = CFG.isMobile;
  const ground = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99);

  // ================= SÂN BAY =================
  const air = new THREE.Group(); scene.add(air);
  const cx = (AIR[0] + AIR[2]) / 2, L = RWY.x1 - RWY.x0;
  {
    const p = [];
    p.push(part(box(L, 0.06, RWY.w), '#4a4d55', cx, GY + 0.03, RWY.z));                              // đường băng nhựa
    p.push(part(box(L + 1, 0.05, RWY.w + 1.2), '#e9e4d6', cx, GY + 0.015, RWY.z));                    // lề sáng
    for (let x = RWY.x0 + 14; x < RWY.x1 - 14; x += 7) p.push(part(box(3.6, 0.02, 0.4), '#fafafa', x, GY + 0.07, RWY.z)); // vạch giữa
    for (const e of [RWY.x0 + 3, RWY.x1 - 3]) for (let i = -4; i <= 4; i++) if (i) p.push(part(box(4, 0.02, 0.6), '#fafafa', e, GY + 0.07, RWY.z + i * 1.2)); // vạch ngưỡng
    p.push(part(box(70, 0.05, 16), '#8d8f94', AIR[0] + 45, GY + 0.025, AIR[1] + 12));                 // sân đỗ
    p.push(part(box(8, 0.05, RWY.z - AIR[1] - 20), '#8d8f94', AIR[0] + 45, GY + 0.025, (AIR[1] + 20 + RWY.z) / 2)); // đường lăn
    for (let x = AIR[0] + 14; x < AIR[0] + 78; x += 3) p.push(part(box(1.4, 0.02, 0.25), '#f2c94c', x, GY + 0.06, AIR[1] + 20)); // vạch vàng
    // nhà chứa máy bay mái vòm (2 cái)
    for (const hx of [AIR[0] + 20, AIR[0] + 42]) {
      p.push(part(new THREE.CylinderGeometry(7, 7, 16, 14, 1, false, 0, Math.PI), '#4f6b4a', hx, GY, AIR[1] + 4, Math.PI / 2, 0, Math.PI / 2));
      p.push(part(box(13.4, 6.6, 0.3), '#e8dcc0', hx, GY + 3.3, AIR[1] - 4.1));
      p.push(part(box(9, 5.4, 0.2), '#2a2a2e', hx, GY + 2.7, AIR[1] + 12.05));                          // cửa lớn mở
      p.push(part(box(13.6, 1, 0.4), '#e8dcc0', hx, GY + 6.0, AIR[1] + 12.1));
      for (const s of [-1, 1]) p.push(part(box(2.2, 5.6, 0.4), '#e8dcc0', hx + s * 5.6, GY + 2.8, AIR[1] + 12.1));
      ctx.boxes && ctx.boxes.push({ x0: hx - 7, z0: AIR[1] - 4.2, x1: hx + 7, z1: AIR[1] + 12, top: GY + 7 });
    }
    // tháp điều khiển
    const tx = AIR[0] + 70, tz = AIR[1] + 5;
    p.push(part(cyl(2.2, 2.6, 11, 10), '#efe6d0', tx, GY + 5.5, tz)); p.push(part(cyl(2.3, 2.3, 0.4, 10), '#c8302a', tx, GY + 3, tz));
    p.push(part(cyl(3.4, 3.4, 0.35, 12), '#d8cdb4', tx, GY + 11.2, tz)); p.push(part(cyl(3.1, 3.1, 2.4, 12), '#7fc4e0', tx, GY + 12.6, tz));
    p.push(part(cyl(3.5, 3.5, 0.3, 12), '#efe6d0', tx, GY + 13.9, tz)); p.push(part(new THREE.ConeGeometry(3.6, 2, 12), '#c8302a', tx, GY + 15, tz));
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.push(part(box(0.08, 0.8, 0.08), '#666', tx + Math.cos(a) * 3.35, GY + 11.8, tz + Math.sin(a) * 3.35)); }
    ctx.colliders.push({ x: tx, z: tz, r: 2.8 });
    // nhà ga kiểu xưa có đồng hồ
    const gx = AIR[0] + 96, gz = AIR[1] + 4;
    p.push(part(box(20, 5, 9), '#f1e7cf', gx, GY + 2.5, gz)); p.push(part(box(21, 0.5, 10), '#a0522d', gx, GY + 5.2, gz));
    p.push(part(cyl(5.8, 5.8, 21, 3), '#a0522d', gx, GY + 6.75, gz, 0, Math.PI / 2, Math.PI / 2, 1, 1, 0.45)); // mái dốc 2 bên
    for (let i = -3; i <= 3; i++) if (i) p.push(part(box(1.6, 2, 0.15), '#7fc4e0', gx + i * 2.6, GY + 2.2, gz + 4.55));
    p.push(part(box(2.6, 3.2, 0.2), '#6b4226', gx, GY + 1.6, gz + 4.6));
    // đồng hồ trên tháp điều khiển
    p.push(part(cyl(1.1, 1.1, 0.2, 16), '#fafafa', tx, GY + 8.5, tz + 2.45, Math.PI / 2)); p.push(part(cyl(1.25, 1.25, 0.15, 16), '#e2b33c', tx, GY + 8.5, tz + 2.38, Math.PI / 2));
    p.push(part(box(0.1, 0.8, 0.05), '#222', tx, GY + 8.75, tz + 2.6)); p.push(part(box(0.6, 0.1, 0.05), '#222', tx + 0.25, GY + 8.5, tz + 2.6));
    ctx.boxes && ctx.boxes.push({ x0: gx - 10, z0: gz - 4.5, x1: gx + 10, z1: gz + 4.5, top: GY + 8 });
    // ống gió + thùng xăng + hàng rào thấp
    const wx = RWY.x0 + 10, wz = RWY.z - RWY.w / 2 - 5;
    p.push(part(cyl(0.08, 0.1, 5, 6), '#ddd', wx, GY + 2.5, wz));
    for (let i = 0; i < 5; i++) p.push(part(box(0.6, 0.6, 0.6), '#555', AIR[0] + 58 + (i % 3) * 0.7, GY + 0.3 + (i > 2) * 0.6, AIR[1] + 16));
    for (let i = 0; i < 4; i++) p.push(part(cyl(0.35, 0.35, 0.9, 8), i % 2 ? '#c8302a' : '#2f6db0', AIR[0] + 62 + i * 0.8, GY + 0.45, AIR[1] + 17));
    for (let x = AIR[0]; x <= AIR[2]; x += 4) p.push(part(box(0.12, 0.9, 0.12), '#f4f0e6', x, GY + 0.45, AIR[3] - 0.5));
    p.push(part(box(AIR[2] - AIR[0], 0.1, 0.08), '#f4f0e6', cx, GY + 0.8, AIR[3] - 0.5));
    air.add(meshOf(p));
    // ống gió (đung đưa theo gió)
    const sock = meshOf([part(new THREE.CylinderGeometry(0.45, 0.2, 2.6, 8, 1, true), '#f07a2a', 0, -1.3, 0), part(new THREE.CylinderGeometry(0.33, 0.29, 0.5, 8, 1, true), '#fafafa', 0, -1.3, 0)]);
    sock.position.set(wx, GY + 4.8, wz); sock.rotation.z = Math.PI / 2; air.add(sock); ctx._sock = sock;
    // đèn viền đường băng (sáng hơn về đêm)
    const lp = []; for (let x = RWY.x0; x <= RWY.x1; x += 8) for (const s of [-1, 1]) lp.push(part(new THREE.SphereGeometry(0.18, 6, 4), x === RWY.x0 || x + 8 > RWY.x1 ? '#ff5a3a' : '#ffe08a', x, GY + 0.2, RWY.z + s * (RWY.w / 2 + 0.4)));
    air.add(meshOf(lp, lampMat, false));
    // biển tên sân bay (chữ vẽ bằng canvas)
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const g2 = cv.getContext('2d');
    g2.fillStyle = '#1f3f8a'; g2.fillRect(0, 0, 512, 96); g2.strokeStyle = '#e2b33c'; g2.lineWidth = 8; g2.strokeRect(6, 6, 500, 84);
    g2.fillStyle = '#f7ecd0'; g2.font = 'bold 46px Georgia, serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('✈ SÂN BAY CÁNH DIỀU', 256, 50);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.9), new THREE.MeshBasicMaterial({ map: tex })); sign.position.set(gx, GY + 4.15, gz + 4.62); air.add(sign);
  }

  // ================= MÁY BAY =================
  const planes = [];
  // 3 máy bay đỗ ở sân đỗ: người chơi chọn để bay
  [['chimlua', AIR[0] + 20], ['hoanggia', AIR[0] + 42], ['bacgio', AIR[0] + 64]].forEach(([k, x], i) => {
    const pl = makePlane(STYLES[k]); pl.group.position.set(x, GY, AIR[1] + 20); pl.yaw = 0; pl.pitch = 0.1; pl.roll = 0;
    pl.group.rotation.set(-0.1, 0, 0); scene.add(pl.group); pl.parked = true; pl.spin = 0; planes.push(pl);
  });
  // máy bay tự bay vòng quanh bầu trời (có phi công)
  const routes = [
    t => [CENTER[0] + Math.cos(t) * 190, 62 + Math.sin(t * 3) * 6, CENTER[1] + Math.sin(t) * 140],
    t => [CENTER[0] + Math.sin(t) * 160, 48 + Math.sin(t * 2) * 8, CENTER[1] + Math.sin(t * 2) * 90],          // hình số 8
    t => [CENTER[0] - 40 + Math.cos(-t) * 120, 78 + Math.cos(t * 2) * 5, CENTER[1] + 20 + Math.sin(-t) * 110],
    t => [CENTER[0] + 60 + Math.cos(t) * 150, 38 + Math.sin(t * 4) * 4, CENTER[1] - 30 + Math.sin(t) * 75],
    t => [CENTER[0] + Math.cos(-t) * 230, 92, CENTER[1] + Math.sin(-t) * 165],
  ];
  const AI = ['nghe', 'hailau', 'tim', 'luc', 'hoanggia'].slice(0, mobile ? 4 : 5).map((k, i) => {
    const pl = makePlane(STYLES[k], true); pl.route = routes[i]; pl.t = i * 1.7; pl.speed = 20 + i * 2.5; pl.roll = 0; pl.spin = 0;
    scene.add(pl.group); planes.push(pl); return pl;
  });

  // ---------- âm thanh động cơ ----------
  let eng = null, myEng = null;
  function initSound() {
    const L2 = ctx.audio && ctx.audio.listener; if (!L2 || L2.context.state !== 'running') return;
    const buf = engineBuffer(L2.context); eng = [];
    for (const pl of AI) { const a = new THREE.PositionalAudio(L2); a.setBuffer(buf); a.setLoop(true); a.setRefDistance(22); a.setRolloffFactor(1.4); a.setVolume(0.7); a.setPlaybackRate(0.9 + Math.random() * 0.25); pl.group.add(a); a.play(); eng.push(a); }
    myEng = new THREE.Audio(L2); myEng.setBuffer(buf); myEng.setLoop(true); myEng.setVolume(0);
  }

  // ================= ĐÀN CHIM (InstancedMesh: cánh trái + cánh phải vỗ) =================
  const NF = mobile ? 8 : 13, PER = mobile ? 7 : 9, NB = NF * PER;
  const wingL = new THREE.BufferGeometry(); wingL.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.32, 0, 0, -0.22, 0.95, 0.05, -0.12, 0, 0, 0.32, -0.08, 0.06, -0.2, 0, 0, -0.22], 3)); wingL.computeVertexNormals();
  const wingR = wingL.clone(); wingR.scale(-1, 1, 1);
  const bmat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const bL = new THREE.InstancedMesh(wingL, bmat, NB), bR = new THREE.InstancedMesh(wingR, bmat, NB);
  const flocks = [];
  for (let f = 0; f < NF; f++) {
    const gull = f % 3 === 0, col = new THREE.Color(gull ? '#f4f4f0' : f % 3 === 1 ? '#3a3640' : '#6a5544');
    flocks.push({ cx: CENTER[0] + (Math.random() - 0.5) * 380, cz: CENTER[1] + (Math.random() - 0.5) * 280, r: 30 + Math.random() * 70, a: Math.random() * 6.28, y: 22 + Math.random() * 40, sp: (0.08 + Math.random() * 0.08) * (f % 2 ? 1 : -1), s: gull ? 1.6 : 1.1, ph: Math.random() * 6 });
    for (let i = 0; i < PER; i++) { bL.setColorAt(f * PER + i, col); bR.setColorAt(f * PER + i, col); }
  }
  bL.frustumCulled = bR.frustumCulled = false; scene.add(bL, bR);
  const dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
  function updateBirds(dt, t) {
    const night = ctx.sky ? ctx.sky.state.night : 0; bL.visible = bR.visible = night < 0.6; if (!bL.visible) return;
    for (let f = 0; f < NF; f++) {
      const F = flocks[f]; F.a += F.sp * dt;
      const hx = F.cx + Math.cos(F.a) * F.r, hz = F.cz + Math.sin(F.a) * F.r * 0.7, yaw = Math.atan2(-Math.sin(F.a) * F.sp, Math.cos(F.a) * F.sp * 0.7);
      const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx;
      for (let i = 0; i < PER; i++) {
        const row = Math.ceil(i / 2), side = i === 0 ? 0 : i % 2 ? 1 : -1, w = Math.sin(t * 0.7 + i * 1.3 + F.ph) * 0.4;
        dummy.position.set(hx + rx * side * row * 1.7 * F.s - fx * row * 1.5 * F.s + w, F.y + Math.sin(t + i) * 0.4 - row * 0.15, hz + rz * side * row * 1.7 * F.s - fz * row * 1.5 * F.s);
        const glide = Math.sin(t * 0.35 + F.ph) > 0.5, flap = glide ? 0.12 : Math.sin(t * 9 + i * 0.9 + F.ph) * 0.7;
        dummy.scale.setScalar(F.s); dummy.rotation.set(0, yaw, flap); dummy.updateMatrix(); bL.setMatrixAt(f * PER + i, dummy.matrix);
        dummy.rotation.set(0, yaw, -flap); dummy.updateMatrix(); bR.setMatrixAt(f * PER + i, dummy.matrix);
      }
    }
    bL.instanceMatrix.needsUpdate = bR.instanceMatrix.needsUpdate = true;
  }

  // ================= NGƯỜI CHƠI LÁI MÁY BAY =================
  const keys = new Set(); addEventListener('keydown', e => keys.add(e.code)); addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
  const btns = document.querySelector('.btns'), vbtns = document.querySelector('.vbtns');
  const bBoost = document.createElement('button'); bBoost.id = 'bBoost'; bBoost.textContent = '🚀 Tăng tốc'; bBoost.hidden = true; bBoost.style.background = '#d8632acc'; btns && btns.appendChild(bBoost);
  let boostHeld = false; bBoost.addEventListener('pointerdown', e => { e.preventDefault(); boostHeld = true; }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) bBoost.addEventListener(ev, () => boostHeld = false);
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:26;padding:6px 14px;border-radius:16px;background:#0f1a2acc;color:#f7ecd0;font:700 14px system-ui;display:none;white-space:nowrap;pointer-events:none';
  document.body.appendChild(hud);

  let me = null, phase = 'none', spd = 0, yaw = 0, pitch = 0, roll = 0, factT = 8, factI = Math.floor(Math.random() * FACTS.length), zoneName = '', hudT = 0, baseFov = camera.fov;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3(), seatW = new THREE.Vector3();
  const setUI = on => {
    bBoost.hidden = !on; hud.style.display = on ? 'block' : 'none'; if (vbtns) vbtns.style.display = on ? 'none' : '';
    for (const id of ['bRun', 'bJump']) { const b = document.getElementById(id); if (b) b.hidden = on; }
  };
  const inAir = (x, z) => x > AIR[0] && x < AIR[2] && z > AIR[1] && z < AIR[3];
  function board(pl) {
    if (me || player.vehicle) return;
    me = pl; pl.parked = false; yaw = pl.yaw; pitch = 0.1; roll = 0; spd = 0; phase = 'takeoff';
    if (inAir(pl.group.position.x, pl.group.position.z)) { pl.group.position.set(RWY.x0 + 4, GY, RWY.z); yaw = Math.PI / 2; ctx.toast('🛫 Ra đường băng... cất cánh!', 2500); }
    else ctx.toast('🛫 Cất cánh!', 2000);
    player.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'sit', seat: 0, seatZ: 0, camAdd: 0, plane: true };
    camPos.copy(camera.position); camLook.copy(pl.group.position);
    setUI(true); if (myEng) { myEng.setVolume(0.35); myEng.isPlaying || myEng.play(); }
    setTimeout(() => ctx.toast('✈️ <b>Joystick/WASD</b>: ⬆ bay lên · ⬇ hạ thấp · ⬅➡ rẽ · <b>Shift/🚀</b> tăng tốc · <b>E</b> hạ cánh', 5000), 2600);
  }
  function leave() {
    const pl = me; if (!pl) return; me = null; phase = 'none'; pl.parked = true; pl.yaw = yaw; pl.pitch = 0.1; pl.group.rotation.set(-0.1, yaw, 0);
    const p = pl.group.position, rx = -Math.cos(yaw), rz = Math.sin(yaw), x = p.x - rx * 4, z = p.z - rz * 4;
    player.vehicle = null; player.teleport(x, z, ground(x, z)); player.setRot && player.setRot(yaw); player.cam.yaw = yaw + Math.PI;
    player.root.quaternion.identity(); player.root.rotation.y = yaw; camera.fov = baseFov; camera.updateProjectionMatrix();
    setUI(false); if (myEng && myEng.isPlaying) myEng.stop(); ctx.toast('🛬 Hạ cánh an toàn! Bấm <b>E</b> cạnh máy bay để bay tiếp.', 3000);
  }
  function land() {
    if (phase !== 'fly') return;
    phase = 'landing'; me._wtoast = false; ctx.toast('🛬 Đang hạ cánh... giữ cánh thăng bằng nhé!', 2500);
  }

  function fly(dt, t) {
    const pl = me, g = pl.group, P = g.position, inp = player.input;
    let ix = inp.x, iz = inp.z;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    ix = Math.max(-1, Math.min(1, ix)); iz = Math.max(-1, Math.min(1, iz));
    const boost = boostHeld || keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('Space');
    const gh = ground(P.x, P.z), alt = P.y - Math.max(gh, W);
    let wantSpd = boost ? 36 : 24, wantPitch = -iz * 0.5, wantRoll = ix * 0.75;
    if (phase === 'takeoff') { wantSpd = 26; wantRoll = 0; wantPitch = spd > 15 ? 0.3 : 0; ix *= 0.2; if (alt > 10) phase = 'fly'; }
    if (phase === 'landing') {
      wantSpd = alt < 1 ? 0 : 13; wantPitch = alt > 2.5 ? -0.16 : alt > 0.4 ? -0.03 : 0; wantRoll = ix * 0.3;
      if (gh < W + 0.3) { // dưới là biển: tự lượn về phía đảo rồi mới đáp
        if (alt < 4) wantPitch = 0.05;
        let d = Math.atan2(CENTER[0] - P.x, CENTER[1] - P.z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); ix = Math.max(-1, Math.min(1, -d * 1.5)); wantRoll = ix * 0.5;
        if (!pl._wtoast) { pl._wtoast = true; ctx.toast('🌊 Dưới là biển: máy bay tự bay về đảo rồi đáp', 2500); }
      }
    }
    // tránh ra khỏi bản đồ: tự rẽ về tâm
    const dx = P.x - CENTER[0], dz = P.z - CENTER[1];
    if (Math.hypot(dx, dz) > BOUND && phase === 'fly') { let d = Math.atan2(-dx, -dz) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); ix = -Math.sign(d) * Math.min(1, Math.abs(d) * 2); wantRoll = ix * 0.75; if (!pl._btoast) { pl._btoast = true; ctx.toast('🧭 Hết bản đồ rồi, quay về đảo nhé!', 2000); } } else pl._btoast = false;
    const onGround = alt < 0.35 && phase !== 'fly';
    spd += (wantSpd - spd) * Math.min(1, dt * (onGround && phase === 'landing' ? 0.9 : 0.8));
    pitch += (wantPitch - pitch) * Math.min(1, dt * 1.8); roll += (wantRoll - roll) * Math.min(1, dt * 2.5);
    if (!onGround) yaw -= (ix * 0.85 + roll * 0.3) * dt * (phase === 'takeoff' ? 0.5 : 1);
    else yaw -= ix * 0.6 * dt * Math.min(1, spd / 8);
    // độ cao trần/sàn: không bao giờ đâm đất
    const vy = (onGround && phase === 'takeoff' && spd < 15) ? 0 : Math.sin(pitch) * spd;
    P.x += Math.sin(yaw) * Math.cos(pitch) * spd * dt; P.z += Math.cos(yaw) * Math.cos(pitch) * spd * dt; P.y += vy * dt;
    const g2 = ground(P.x, P.z), floor = Math.max(g2, W + 0.2);
    if (phase === 'fly') { if (P.y < floor + 5) { P.y += (floor + 5 - P.y) * Math.min(1, dt * 3); pitch = Math.max(pitch, 0.08); } P.y = Math.min(P.y, 150); }
    else if (phase === 'landing' && g2 < W + 0.3) P.y = Math.max(P.y, W + 3.5);
    else if (P.y < g2) P.y = g2;
    if (phase === 'landing' && P.y - g2 < 0.05 && spd < 0.6) return leave();
    const tilt = onGround ? -0.1 : 0;
    g.rotation.set(-pitch + tilt, yaw, onGround ? 0 : roll);
    pl.spin = 30 + spd;
    // người chơi ngồi trong buồng lái
    seatW.copy(pl.seat).applyMatrix4(g.matrixWorld.compose(P, g.quaternion, g.scale));
    player.pos.copy(seatW); player.root.position.copy(seatW); player.root.quaternion.copy(g.quaternion);
    // camera thứ 3 bám đuôi (cao, xa hơn khi tăng tốc)
    const fx = Math.sin(yaw), fz = Math.cos(yaw), D = boost ? 20 : 16, H = 5.5 + Math.max(0, -pitch) * 6;
    tmp.set(P.x - fx * D, P.y + H, P.z - fz * D); tmp.y = Math.max(tmp.y, ground(tmp.x, tmp.z) + 1.5, W + 1);
    camPos.lerp(tmp, 1 - Math.exp(-dt * 3.5)); camera.position.copy(camPos);
    camLook.lerp(tmp.set(P.x + fx * 8, P.y + 1.5 + pitch * 4, P.z + fz * 8), 1 - Math.exp(-dt * 6)); camera.lookAt(camLook);
    const fov = baseFov + (spd / 36) * 12; if (Math.abs(camera.fov - fov) > 0.2) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 2); camera.updateProjectionMatrix(); }
    if (myEng) myEng.setPlaybackRate(0.75 + spd / 40), myEng.setVolume(0.22 + (boost ? 0.15 : 0.08));
    // bảng đồng hồ: độ cao, tốc độ, hướng la bàn (Bắc = -z) + tên vùng đang bay qua
    if ((hudT -= dt) <= 0) {
      hudT = 0.2; const h = ((Math.atan2(fx, -fz) * 180 / Math.PI) + 360 + 22.5) % 360;
      const zr = BLOCKS.find(b => P.x > b.r[0] && P.x < b.r[2] && P.z > b.r[1] && P.z < b.r[3]) || EXTRA.find(e => P.x > e.r[0] && P.x < e.r[2] && P.z > e.r[1] && P.z < e.r[3]);
      const zn = zr ? zr.name : (g2 < W ? 'Biển xanh' : 'Đảo Rubik');
      if (zn !== zoneName && phase === 'fly') { zoneName = zn; ctx.toast('🗺️ Đang bay qua: <b>' + zn + '</b>', 2200); factT = Math.max(factT, 4); }
      hud.textContent = `✈️ ${pl.style.name} · ⛰ ${Math.round(P.y - W)} m · ${Math.round(spd * 3.6)} km/h · 🧭 ${DIRS[Math.floor(h / 45) % 8]}`;
    }
    if (phase === 'fly' && (factT -= dt) <= 0) { factT = 22; ctx.toast('💡 ' + FACTS[factI++ % FACTS.length], 6500); }
  }

  let welcomed = false;
  function update(dt, t) {
    if (!eng) initSound();
    // máy bay AI bay theo quỹ đạo, nghiêng cánh khi rẽ
    for (const pl of AI) {
      const a = pl.route(pl.t), b = pl.route(pl.t + 0.01), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.01;
      pl.t += pl.speed * dt / Math.max(1, len);
      const hd = Math.atan2(b[0] - a[0], b[2] - a[2]), pt = Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2]));
      let dh = hd - (pl.yaw ?? hd); dh = Math.atan2(Math.sin(dh), Math.cos(dh)); pl.yaw = hd;
      pl.roll += (Math.max(-0.8, Math.min(0.8, -dh / Math.max(dt, 1e-3) * 1.2)) - pl.roll) * Math.min(1, dt * 2);
      pl.group.position.set(a[0], a[1], a[2]); pl.group.rotation.set(-pt, hd, pl.roll); pl.spin = 45;
    }
    for (const pl of planes) { pl.prop.rotation.z += pl.spin * dt; pl.disc.visible = pl.spin > 20; if (pl.parked) pl.spin = Math.max(0, pl.spin - dt * 20); }
    if (ctx._sock) ctx._sock.rotation.y = 0.4 + Math.sin(t * 0.7) * 0.25;
    updateBirds(dt, t);
    if (me) { fly(dt, t); if (phase === 'fly') ctx.offer('🛬 Hạ cánh', land, 9); return; }
    // ở dưới đất: lời mời lên máy bay đỗ gần
    const pp = player.pos;
    if (!welcomed && inAir(pp.x, pp.z)) { welcomed = true; ctx.toast('✈️ <b>Sân bay Cánh Diều</b>: chọn 1 chiếc máy bay cổ điển, bấm <b>E</b> để bay khắp đảo!', 4500); }
    if (player.vehicle) return;
    let best = null, bd = 5.5;
    for (const pl of planes) if (pl.parked) { const d = Math.hypot(pl.group.position.x - pp.x, pl.group.position.z - pp.z); if (d < bd && Math.abs(pl.group.position.y - pp.y) < 4) { bd = d; best = pl; } }
    if (best) ctx.offer('✈️ Lái máy bay ' + best.style.name, () => board(best), 7);
  }

  return { update, planes, birds: NB, board: () => board(planes[0]), land, get flying() { return !!me; }, get phase() { return phase; } };
}
