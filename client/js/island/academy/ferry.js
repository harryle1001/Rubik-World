// academy/ferry.js — THUYỀN ĐÈN LỒNG: bến ở đảo chính ⇄ bến dưới chân lâu đài, tự chạy 55 s (Fibonacci) qua 610 m nước.
// Camera điện ảnh: sau lưng thuyền, ngước nhìn lâu đài hiện dần trong sương. Có nút "⏭ Tới nơi" để bỏ qua.
import * as THREE from 'three';
import { T, dampV3 } from '../motion.js';
import { CFG } from '../config.js';
import { Batch } from './geo.js';
import { matV, mat } from '../sample/palette.js';

const DUR = 55, TA = 5, TD = 8;   // thời gian chạy, tăng tốc, giảm tốc (s)
const FACTS = [
  '🌫️ <b>Sương mù</b> là đám mây nằm sát mặt nước: hơi nước gặp lạnh ngưng tụ thành giọt li ti lơ lửng.',
  '🏮 Giấy đèn lồng làm ánh nến <b>khuếch tán</b>: ánh sáng toả đều mọi phía nên dịu mắt, không chói.',
  '⚓ Thuyền nổi nhờ <b>lực đẩy Ác-si-mét</b>: nước đẩy lên bằng trọng lượng phần nước bị thân thuyền chiếm chỗ.',
];

function boatGeo() {
  // thuyền dài 5 m, rộng 5/φ² ≈ 1,9 m; 3 cột đèn lồng (mũi, giữa, lái)
  const b = new Batch(), wood = '#a8744a', woodD = '#6e4a30';
  // thân: hộp 1,9 × 0,7 × 5 m nắn lại — đáy hẹp 1/φ, mũi vuốt nhọn và cong lên, lái thu nhỏ
  const hull = new THREE.BoxGeometry(1.9, 0.7, 5, 1, 1, 4), hp = hull.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    let x = hp.getX(i), y = hp.getY(i); const z = hp.getZ(i), t = (z + 2.5) / 5;
    if (y < 0) x /= 1.618;
    if (t > 0.75) { const k = (t - 0.75) / 0.25; x *= 1 - 0.9 * k; y += 0.3 * k * k; }
    if (t < 0.25) x *= 0.82 + 0.72 * t;
    hp.setXYZ(i, x, y, z);
  }
  hull.computeVertexNormals(); b.add(hull, wood, 0, 0.2, 0);
  b.box(-0.97, -0.87, 0.5, 0.62, -1.9, 1.9, woodD); b.box(0.87, 0.97, 0.5, 0.62, -1.9, 1.9, woodD);                       // mép mạn
  b.box(-0.8, 0.8, 0.3, 0.38, -0.9, -0.3, woodD); b.box(-0.8, 0.8, 0.3, 0.38, 0.8, 1.4, woodD);                          // 2 băng ghế
  for (const z of [2.3, 0.25, -2.0]) b.cyl(0, 0.45, z, 0.05, z === 0.25 ? 2.1 : 1.6, '#3a3344', 5);
  b.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), '#3a3344', 0, 2.06, 2.75);   // cần treo đèn mũi
  return b.build();
}
function lanternGeo() {
  const b = new Batch();
  for (const [z, y] of [[3.15, 1.75], [0.25, 2.62], [-2.0, 2.1]]) b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 6), '#ffe3a0', 0, y, z);
  return b.build();
}

export function createFerry(ctx, { pierA, dockB, pathAB, toAcademy, toMain }) {
  const { scene, camera, player, terrain } = ctx;
  const g = new THREE.Group(); g.name = 'ferry';
  const hull = new THREE.Mesh(boatGeo(), matV()); hull.castShadow = true; g.add(hull);
  g.add(new THREE.Mesh(lanternGeo(), mat('lampGlow')));
  scene.add(g);
  const curve = new THREE.CatmullRomCurve3(pathAB.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal', 0.5);
  const L = curve.getLength(), VMAX = L / (DUR - (TA + TD) / 2);
  const distAt = t => {   // quãng đường đã đi sau t giây (tăng tốc đều – chạy đều – giảm tốc đều)
    if (t <= TA) return 0.5 * VMAX / TA * t * t;
    if (t <= DUR - TD) return 0.5 * VMAX * TA + VMAX * (t - TA);
    const r = DUR - t; return L - 0.5 * VMAX / TD * r * r;
  };
  let ride = null, idle = 'A';   // idle: thuyền đậu ở bến A (đảo chính) hay B (lâu đài)
  const P = new THREE.Vector3(), Tn = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camV = new THREE.Vector3(), lookV = new THREE.Vector3(), tmp = new THREE.Vector3(), seat = new THREE.Vector3();
  const place = (u, dir) => {   // u: 0..1 theo đường A→B; dir: +1 đi tới học viện, -1 về
    curve.getPointAt(Math.min(1, Math.max(0, u)), P); curve.getTangentAt(Math.min(1, Math.max(0, u)), Tn); if (dir < 0) Tn.negate();
    const t = performance.now() / 1000, y = terrain.waveHeight ? terrain.waveHeight(P.x, P.z) : 0;
    g.position.set(P.x, y - 0.12, P.z); g.rotation.set(Math.sin(t * 1.3) * 0.025, Math.atan2(Tn.x, Tn.z), Math.sin(t * 1.7 + 1) * 0.035, 'YXZ');
  };
  place(0, 1);

  // nút bỏ qua + bảng thời gian
  const btns = document.querySelector('.btns');
  const bSkip = document.createElement('button'); bSkip.textContent = '⏭ Tới nơi'; bSkip.hidden = true; bSkip.style.background = '#2c6455cc';
  bSkip.onclick = () => { if (ride) ride.t = DUR; }; btns && btns.appendChild(bSkip);
  const hud = document.createElement('div');
  const narrow = () => CFG.isMobile || innerWidth < 610;   // điện thoại dọc: dòng giờ nằm dưới hàng nút trên cùng
  hud.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);z-index:26;padding:6px 14px;border-radius:16px;background:#0f1a2acc;color:#f7ecd0;font:700 14px system-ui;white-space:nowrap;display:none;pointer-events:none';
  document.body.appendChild(hud);
  const setUI = on => { bSkip.hidden = !on; hud.style.display = on ? 'block' : 'none'; hud.style.top = narrow() ? 'calc(max(12px,env(safe-area-inset-top)) + 76px)' : 'max(12px,env(safe-area-inset-top))'; for (const id of ['bRun', 'bJump']) { const b = document.getElementById(id); if (b) b.hidden = on; } };

  function start(dir) {
    if (ride || player.vehicle || (ctx.aircraft && ctx.aircraft.flying)) return;
    ride = { dir, t: 0, fact: 0 }; idle = null;
    player.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'sit', seat: 0, seatZ: 0, camAdd: 0, ferry: true };
    camPos.copy(camera.position); camV.set(0, 0, 0); lookV.set(0, 0, 0); camLook.copy(g.position);
    setUI(true); ctx.sfx && ctx.sfx('splash');
    ctx.toast(dir > 0 ? '⛵ Thuyền đèn lồng rời bến… hướng về <b>Học viện Pha Lê</b>' : '⛵ Thuyền đèn lồng đưa bạn về <b>đảo Rubik</b>', 3500);
  }
  function finish() {
    const dir = ride.dir; ride = null; idle = dir > 0 ? 'B' : 'A';
    player.vehicle = null; setUI(false);
    const [x, z, y] = dir > 0 ? toAcademy : toMain;
    player.teleport(x, z, y); player.root.quaternion.identity();
    const [lx, lz] = dir > 0 ? dockB : pierA, ex = dir > 0 ? ctx.academyLook : null;   // lâu đài: nhìn lên dốc đá; đảo chính: nhìn vào bờ
    player.cam.yaw = ex ? Math.atan2(-ex[0], -ex[1]) : Math.atan2(lx - x, lz - z); player.snapCamera && player.snapCamera();
    ctx.toast(dir > 0 ? '🏰 Chào mừng tới <b>Học viện Pha Lê</b>! Đi theo dốc đá lên cổng lâu đài.' : '🏝️ Đã về <b>đảo Rubik</b>.', 4500);
  }

  function update(dt) {
    if (!ride) { place(idle === 'B' ? 1 : 0, idle === 'B' ? -1 : 1); return; }
    ride.t = Math.min(DUR, ride.t + dt);
    const d = distAt(ride.t) / L, u = ride.dir > 0 ? d : 1 - d; place(u, ride.dir);
    // người chơi ngồi băng ghế giữa
    seat.set(0, 0.36, -0.6).applyMatrix4(g.matrixWorld.compose(g.position, g.quaternion, g.scale));
    player.pos.copy(seat); player.root.position.copy(seat); player.root.quaternion.copy(g.quaternion);
    // camera điện ảnh: sau lưng 9 m, cao 3,4 m; nhìn trước 34 m, ngước 8 m (về phía lâu đài)
    const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y);
    tmp.set(g.position.x - fx * 9, g.position.y + 3.4, g.position.z - fz * 9); dampV3(camPos, tmp, camV, T.soft, dt); camera.position.copy(camPos);
    dampV3(camLook, tmp.set(g.position.x + fx * 34, g.position.y + 8, g.position.z + fz * 34), lookV, T.slow, dt); camera.lookAt(camLook);
    const left = Math.ceil(DUR - ride.t); hud.textContent = narrow() ? `⛵ ${ride.dir > 0 ? 'Tới Học viện' : 'Về đảo Rubik'} · còn ${left} s` : `⛵ Thuyền đèn lồng · ${ride.dir > 0 ? 'tới Học viện Pha Lê' : 'về đảo Rubik'} · còn ${left} s`;
    const fi = Math.floor(ride.t / 13); if (fi >= 1 && fi <= FACTS.length && ride.fact < fi) { ride.fact = fi; ctx.toast(FACTS[fi - 1], 7000); }
    if (ride.t >= DUR) finish();
  }
  return { update, start, seek: t => { if (ride) ride.t = t; }, get riding() { return !!ride; }, get idle() { return idle; }, group: g };
}
