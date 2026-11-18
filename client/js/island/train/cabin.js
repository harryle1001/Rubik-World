// train/cabin.js — TRONG TOA: đứng dậy đi lại dọc lối đi qua cả 4 toa (cửa thông giữa các toa), xe quà vặt ở cuối
// toa cuối (chọn món → ăn → học 1 điều thú vị), vài bạn học sinh ngồi sẵn trên tàu.
// Toạ độ "dọc tàu" u: 0 = đầu toa khách thứ nhất, tăng về phía cuối tàu (4 toa × 8 m + 3 khe nối 0,8 m).
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV } from '../sample/palette.js';
import { loadHero } from '../characters.js';
import { CARS, FLOOR, GAP, WIN } from './consist.js';

const C0 = CARS.findIndex(c => c.kind === 'coach'), NC = CARS.length - C0, CL = 8;
export const U_LEN = NC * CL + (NC - 1) * GAP;
const AISLE = 0.32, DOOR = 0.34, CAM_BACK = 2.6;
// u → (toa, z cục bộ); khe nối thuộc toa phía trước (z vượt quá −4 một chút)
export function carAt(u) { const k = Math.min(NC - 1, Math.max(0, Math.floor(u / (CL + GAP)))), lu = u - k * (CL + GAP); return { car: C0 + k, z: CL / 2 - lu }; }
const SNACKS = [
  { e: '🥥', n: 'Kẹo dừa', f: 'Nước dừa chứa nhiều <b>kali</b> — chất điện giải giúp cơ thể giữ nước và cơ bắp hoạt động.' },
  { e: '🍠', n: 'Khoai lang nướng', f: 'Ruột khoai lang cam có nhiều <b>beta-carotene</b> — cơ thể đổi thành vitamin A, tốt cho mắt.' },
  { e: '🥖', n: 'Bánh mì que', f: 'Bột nở nhờ <b>nấm men</b>: men ăn đường và thải khí CO₂, bọt khí làm bánh xốp.' },
  { e: '🥛', n: 'Sữa đậu nành', f: 'Hạt đậu nành nhiều <b>đạm thực vật</b> — 1 cốc sữa đậu nành có khoảng 7 g đạm.' },
  { e: '🍊', n: 'Quýt', f: 'Quýt giàu <b>vitamin C</b>, giúp vết thương mau lành và tăng sức đề kháng.' },
];
const TROLLEY_U = U_LEN - 1.3;                             // xe quà vặt: cuối toa cuối

function trolleyGeo() {   // xe đẩy gỗ 0,6 × 1,0 × 1,0 m, 2 tầng khay đầy bánh kẹo
  const b = new Batch(), W = '#a8744a', D = '#6e4a30';
  b.box(-0.3, 0.3, 0.12, 0.18, -0.5, 0.5, W); b.box(-0.3, 0.3, 0.62, 0.68, -0.5, 0.5, W); b.box(-0.32, 0.32, 0.98, 1.02, -0.52, 0.52, D);
  for (const x of [-0.27, 0.27]) for (const z of [-0.47, 0.47]) b.box(x - 0.03, x + 0.03, 0.06, 1.0, z - 0.03, z + 0.03, D);
  for (const x of [-0.18, 0.18]) for (const z of [-0.47, 0.47]) b.cyl(x, 0, z, 0.06, 0.12, '#2a2630', 6);
  b.box(-0.04, 0.04, 1.0, 1.25, 0.5, 0.56, '#d4a24a'); b.box(-0.3, 0.3, 1.2, 1.26, 0.5, 0.56, '#d4a24a');   // tay đẩy đồng
  const goods = ['#f2c443', '#e0503e', '#efe3c8', '#ee93a8', '#7fbf5e', '#c8763a'];
  let k = 0; for (const y of [0.18, 0.68, 1.02]) for (let i = 0; i < 6; i++) { const c = goods[k++ % 6], x = -0.2 + (i % 3) * 0.2, z = -0.3 + Math.floor(i / 3) * 0.55; b.box(x - 0.08, x + 0.08, y, y + (y > 1 ? 0.1 : 0.16), z - 0.1, z + 0.1, c); }
  return b.build();
}

export function createCabin(ctx, consist) {
  const { player, camera } = ctx;
  const cars = consist.cars;
  // xe quà vặt (con của toa cuối → đi cùng toa)
  const tr = carAt(TROLLEY_U), trolley = new THREE.Mesh(trolleyGeo(), matV()); trolley.position.set(0, FLOOR, tr.z); trolley.castShadow = true;
  cars[tr.car].o.add(trolley);
  // bạn học sinh ngồi sẵn (hàng ghế, bên, kiểu)
  const RIDERS = [[C0, 1, 1, 'student-female-b', '#ff8a2b'], [C0 + 1, 3, 1, 'student-male-c', '#2b6cb0'], [C0 + 2, 0, -1, 'student-female-d', '#ffd23f'], [C0 + 2, 2, 1, 'student-male-e', '#e0564a']];
  const riders = [];
  for (const [ci, row, side, kind, bag] of RIDERS) loadHero(kind, 1.5, { role: 'student', bag }).then(h => {
    if (!h) return; h.model.position.set(side * 0.8, FLOOR + 0.02, WIN.z(row) - 0.09); cars[ci].o.add(h.model); h.anim.play('sit', 0); riders.push(h);
  });
  const vendorP = loadHero('student-female-a', 1.62, { role: 'adult', shirt: '#2c6455', pants: '#3a3344', hat: null }).then(h => {
    if (!h) return null; h.model.position.set(0.0, FLOOR, tr.z - 0.85); h.model.rotation.y = Math.PI; cars[tr.car].o.add(h.model); h.anim.play('idle', 0); return h;
  });

  // ---------- bảng chọn món ----------
  const menu = document.createElement('div'); menu.hidden = true;
  menu.style.cssText = 'position:fixed;inset:0;z-index:35;display:grid;place-items:center;background:#0a1220aa;padding:13px';
  menu.innerHTML = `<div style="width:min(100%,377px);background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:16px 16px 13px;border-top:8px solid #2c6455;font:15px system-ui">
    <div style="font:800 18px system-ui;margin-bottom:4px">🛒 Xe quà vặt Tàu Pha Lê</div><div style="opacity:.7;font-size:13px;margin-bottom:10px">Chọn một món — miễn phí cho học sinh!</div>
    <div id="snk" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>
    <button id="snkX" style="margin-top:10px;width:100%;padding:10px;border:0;border-radius:13px;background:#efe3cc;font:700 15px system-ui">Đóng</button></div>`;
  document.body.appendChild(menu);
  const grid = menu.querySelector('#snk');
  for (const s of SNACKS) { const b = document.createElement('button'); b.innerHTML = `<div style="font-size:30px">${s.e}</div>${s.n}`; b.style.cssText = 'padding:10px 6px;border:2px solid #e6d6b8;border-radius:13px;background:#fff;font:700 14px system-ui;color:#3a2a1a;cursor:pointer'; b.onclick = () => eat(s); grid.appendChild(b); }
  const close = () => { menu.hidden = true; player.frozen = false; };
  menu.querySelector('#snkX').onclick = close; menu.onclick = e => { if (e.target === menu) close(); };
  let eaten = +(localStorage.getItem('island.snacks') || 0);
  function eat(s) {
    close(); eaten++; try { localStorage.setItem('island.snacks', eaten); } catch (e) {}
    player.emote && player.emote('use'); ctx.sfx && ctx.sfx('ok');
    vendorP.then(h => h && h.anim.play('Interact', 0.2, true));
    ctx.toast(`${s.e} <b>${s.n}</b> — ngon quá! 😋<br><small>${s.f}</small>${eaten === 5 ? '<br>🏅 <b>Sành ăn Tàu Pha Lê</b>: đã thử 5 món!' : ''}`, 7000);
  }

  // ---------- đứng dậy / đi lại ----------
  const st = { walking: false, u: 0, x: 0, face: -1, camU: 0, last: new THREE.Vector3(), t: 0 };
  const P = new THREE.Vector3(), cp = new THREE.Vector3(), cl = new THREE.Vector3(), Q = new THREE.Quaternion(), dl = new THREE.Vector3();
  const worldOf = (u, x, y, out) => { const c = carAt(u), o = cars[c.car].o; o.updateMatrixWorld(); return out.set(x, y, c.z).applyMatrix4(o.matrixWorld); };
  function stand(V, seatU) {
    st.walking = true; st.u = seatU; st.x = -AISLE; st.face = -1; st.camU = seatU + CAM_BACK; st.snap = true;
    Object.assign(V, { speed: 1.9, turn: 10, accel: 9, anim: 'idle' });
    worldOf(st.u, st.x, FLOOR, st.last); player.pos.copy(st.last); player.root.quaternion.identity();
  }
  function sit(V) { st.walking = false; Object.assign(V, { speed: 0, turn: 0, accel: 4, anim: 'sit' }); menu.hidden = true; }
  // gọi sau player.update: lấy độ dời do cần điều khiển, đổi sang hệ toa, giới hạn trong lối đi
  function update(dt, V) {
    if (!st.walking) return false;
    const c = carAt(st.u), o = cars[c.car].o;
    dl.subVectors(player.pos, st.last); dl.y = 0;
    Q.copy(o.quaternion).invert(); dl.applyQuaternion(Q);
    st.u = Math.min(U_LEN - 0.35, Math.max(0.35, st.u - dl.z)); st.x += dl.x;
    const nc = carAt(st.u), inGap = nc.z < -CL / 2 + 0.05 || nc.z > CL / 2 - 0.05, lim = inGap ? 0.05 : Math.abs(nc.z) > CL / 2 - 0.45 ? DOOR : AISLE;
    st.x = Math.max(-lim, Math.min(lim, st.x));
    if (Math.abs(st.u - TROLLEY_U) < 0.75) st.u = Math.min(st.u, TROLLEY_U - 0.75);   // xe đẩy chắn lối
    if (Math.abs(dl.z) > 0.004) st.face = dl.z > 0 ? -1 : 1;   // -1: đang đi về phía đầu tàu
    worldOf(st.u, st.x, FLOOR, P); player.pos.copy(P); player.root.position.copy(P); st.last.copy(P);
    V.anim = player.speed > 0.4 ? 'walk' : 'idle';
    // camera sau lưng 2,6 m, cao 1,85 m, giữa lối đi; làm mượt theo toạ độ dọc tàu (không trễ khi tàu chạy)
    const cuT = Math.min(U_LEN - 0.2, Math.max(0.2, st.u - st.face * CAM_BACK));
    st.camU = st.snap ? cuT : st.camU + (cuT - st.camU) * Math.min(1, dt * 3); st.snap = false;
    const sg = Math.sign(st.u - st.camU) || -st.face;
    worldOf(st.camU, 0, FLOOR + 1.85, cp); worldOf(st.u + sg * 1.6, 0, FLOOR + 1.1, cl);
    camera.position.copy(cp); camera.lookAt(cl); const cu = st.camU;
    player.cam.yaw = Math.atan2(cp.x - cl.x, cp.z - cl.z);
    // xe quà vặt
    if (Math.abs(st.u - (TROLLEY_U - 0.75)) < 0.9 && menu.hidden) ctx.offer('🛒 Mua quà vặt', () => { menu.hidden = false; player.frozen = true; }, 10);
    return carAt(cu).car - C0;   // toa có camera (ẩn kính sáng toa đó)
  }
  // hoạt hình người trên tàu (chỉ khi camera ở gần đoàn tàu)
  const lp = new THREE.Vector3();
  function animate(dt) {
    cars[tr.car].o.getWorldPosition(lp); if (lp.distanceToSquared(camera.position) > 55 * 55) return;
    for (const h of riders) h.anim.update(dt); vendorP.then(h => h && h.anim.update(dt));
  }
  return { update, stand, sit, animate, state: st, uOfSeat: (car, z) => (car - C0) * (CL + GAP) + CL / 2 - z };
}
