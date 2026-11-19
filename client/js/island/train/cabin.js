// train/cabin.js — TRONG TÀU: đi lại qua 6 toa khách (cửa thông giữa các toa), tham quan buồng lái, chọn ghế trống để ngồi / đứng dậy.
// Vị trí người chơi lưu theo toạ độ CỤC BỘ của toa (car, x, z) → tàu chạy, vào cua vẫn đứng vững, không trễ.
// Va chạm: tâm người phải nằm trong hợp các hình chữ nhật "đi được" của toa (coaches.js) — thử trượt từng trục khi vướng.
// Camera: cần máy sau lưng (2,2 m), co lại khi chạm vách/ghế (dò theo vùng "trống" của toa) → không kẹt trong tường; kéo màn hình để xoay.
import * as THREE from 'three';
import { CARS, FLOOR, GAP, CL } from './consist.js';
import { layout, inRects, GAPZ, CAB } from './coaches.js';

const BOOM = 2.2, EYE = 1.62, HEAD = 1.32;
// tâm toa cách đầu tàu (m) — dùng đổi toạ độ khi bước qua khe nối
const OFF = CARS.map(c => c.off);

export function createCabin(ctx, consist, interior) {
  const { player, camera } = ctx, cars = consist.cars;
  const rectsOf = car => car === 0 ? CAB : layout(cars[car].type);
  const floorOf = car => car === 0 ? CAB.floor : FLOOR;
  const st = { mode: 'off', car: 2, x: 0, z: 0, seat: null, yawL: 0, lastYaw: 0, speed: 0, back: null, taken: () => false };
  const P = new THREE.Vector3(), cp = new THREE.Vector3(), cl = new THREE.Vector3(), Q = new THREE.Quaternion(), dl = new THREE.Vector3(), E = new THREE.Euler();
  const worldOf = (car, x, y, z, out) => out.set(x, y, z).applyMatrix4(cars[car].o.matrixWorld);
  const carYaw = car => cars[car].o.rotation.y;
  // khe nối: đổi sang toa kế bên theo khoảng cách tới đầu tàu
  function hop() {
    if (st.car === 0 || Math.abs(st.z) <= GAPZ) return;
    const d = OFF[st.car] - st.z, nc = st.z > 0 ? st.car - 1 : st.car + 1;
    if (nc < 2 || nc >= cars.length) { st.z = Math.sign(st.z) * GAPZ; return; }
    st.yawL += carYaw(st.car) - carYaw(nc); st.car = nc; st.z = OFF[nc] - d;
  }
  // va chạm: chỉ nhận bước nếu tâm còn trong vùng đi được; vật cản tròn (xe đẩy…): st.block = [{ car, x, z, r }]
  const ok = (x, z) => inRects(rectsOf(st.car).walk, x, z) && !(st.block || []).some(b => b.car === st.car && (x - b.x) ** 2 + (z - b.z) ** 2 < b.r * b.r);
  function move(dx, dz) {
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
    for (let i = 0; i < n; i++) {
      const x = st.x + dx / n, z = st.z + dz / n;
      if (ok(x, z)) { st.x = x; st.z = z; } else if (ok(x, st.z)) st.x = x; else if (ok(st.x, z)) st.z = z;
      hop();
    }
  }
  // ---------- chế độ ----------
  const V = () => player.vehicle;
  function walkMode(car, x, z, faceL) {
    st.mode = car === 0 ? 'cab' : 'walk'; st.car = car; st.x = x; st.z = z; st.seat = null;
    if (faceL !== undefined) { st.yawL = faceL + Math.PI; player.setRot(carYaw(car) + faceL); }
    Object.assign(V(), { speed: 1.9, turn: 10, accel: 9, anim: 'idle' });
    place(true);
  }
  function sit(seat) {
    if (!seat || st.taken(seat.id)) return false;
    st.mode = 'seat'; st.seat = seat; st.car = seat.car; st.x = seat.x; st.z = seat.z; st.yawL = seat.ry;   // camera trước mặt, nhìn lại người ngồi
    Object.assign(V(), { speed: 0, turn: 0, accel: 4, anim: 'sit' });
    place(true); ctx.sfx && ctx.sfx('ui'); st.onSit && st.onSit(seat); return true;
  }
  // điểm đứng ở lối đi gần ghế nhất (khi đứng dậy)
  function standUp() {
    const s = st.seat; if (!s) return; const R = layout(cars[s.car].type).walk;
    let best = null; for (let k = 0; k <= 13; k++) for (const sgn of [1, -1]) { const t = k * 0.12 * sgn; for (const [x, z] of [[s.x + t, s.z], [s.x, s.z + t], [s.x + t, s.z + t]]) if (!best && inRects(R, x, z)) best = [x, z]; }
    if (!best) best = [0, s.z]; st.seat = null; st.onStand && st.onStand(); walkMode(s.car, best[0], best[1]);
  }
  // ---------- đặt người + camera ----------
  function place(snap) {
    const car = st.car, o = cars[car].o; o.updateMatrixWorld();
    if (st.mode === 'seat') {
      const s = st.seat; worldOf(car, s.x, FLOOR + 0.02 + (s.y || 0), s.z, P);
      player.pos.copy(P); player.root.position.copy(P);
      Q.setFromEuler(E.set(0, s.ry, 0)); player.root.quaternion.copy(o.quaternion).multiply(Q); player.setRot(carYaw(car) + s.ry);
    } else { worldOf(car, st.x, floorOf(car), st.z, P); player.pos.copy(P); player.root.position.copy(P); }
    st.last = P.clone();
    if (snap) { st.lastYaw = player.cam.yaw = carYaw(car) + st.yawL; }
  }
  // cần máy: lùi dần tới khi chạm biên vùng trống (lề 0,18 m)
  function boom(dirX, dirZ, len) {
    const A = rectsOf(st.car).air; let d = 0.3;
    while (d < len && inRects(A, st.x + dirX * (d + 0.18), st.z + dirZ * (d + 0.18))) d += 0.08;
    return Math.max(0.3, Math.min(len, d));
  }
  function camUpdate(dt) {
    const car = st.car, f = floorOf(car), seated = st.mode === 'seat';
    // xoay do người chơi kéo màn hình (player.js cộng vào cam.yaw) → cộng vào góc cục bộ
    const dy = player.cam.yaw - st.lastYaw; st.yawL += Math.atan2(Math.sin(dy), Math.cos(dy));
    // đang đi: camera tự xoay dần ra sau lưng hướng đi
    if (!seated && player.speed > 0.4 && st.move) { const want = Math.atan2(-st.move.x, -st.move.z), d = Math.atan2(Math.sin(want - st.yawL), Math.cos(want - st.yawL)); st.yawL += d * Math.min(1, dt * 2.6); }
    if (!Number.isFinite(st.yawL)) st.yawL = seated ? st.seat.ry : 0;
    const pitch = seated ? 0.3 : Math.min(0.7, Math.max(0.05, player.cam.pitch)), cx = Math.sin(st.yawL), cz = Math.cos(st.yawL);
    const ox = seated ? st.seat.x : st.x, oz = seated ? st.seat.z : st.z;
    const len = boom(cx, cz, seated ? 1.5 : BOOM), hy = Math.min(2.3, (seated ? 0.95 : HEAD) + Math.sin(pitch) * len * 0.6 + 0.25);
    worldOf(car, ox + cx * len, f + hy, oz + cz * len, cp); worldOf(car, ox - cx * 0.6, f + (seated ? 0.82 : HEAD), oz - cz * 0.6, cl);
    camera.position.copy(cp); camera.lookAt(cl);
    player.cam.yaw = st.lastYaw = carYaw(car) + st.yawL;
    if (player.hero) player.hero.model.visible = len > 0.55;   // camera sát đầu → ẩn thân mình (không thấy trong đầu)
  }
  // ---------- mỗi khung hình (sau player.update) ----------
  function update(dt) {
    if (st.mode === 'off') return false;
    if (st.mode !== 'seat') {
      dl.subVectors(player.pos, st.last); dl.y = 0;
      Q.copy(cars[st.car].o.quaternion).invert(); dl.applyQuaternion(Q);
      st.move = dl.lengthSq() > 1e-6 ? { x: dl.x, z: dl.z } : null;
      move(dl.x, dl.z);
      V().anim = player.speed > 0.4 ? 'walk' : 'idle';
    }
    place(false); camUpdate(dt);
    offers();
    return st.mode === 'seat' ? 'seat' : 'walk';
  }
  // ---------- ✋ gần ghế: ngồi; ghế có người: báo ----------
  function nearestSeat() {
    let best = null, bd = 1.1 * 1.1;
    for (const s of interior.seats) if (s.car === st.car && (!s.room || inRects([s.room], st.x, st.z))) { const d = (s.x - st.x) ** 2 + (s.z - st.z) ** 2; if (d < bd) { bd = d; best = s; } }
    return best;
  }
  function offers() {
    if (st.mode === 'seat') { ctx.offer('🚶 Đứng dậy', standUp, 9); return; }
    if (st.mode === 'cab') { if (st.z > -3.4) return; ctx.offer('↩ Về toa khách', () => st.back && st.back(), 9); return; }
    if (st.car === 2 && st.z > 5.5 && st.toCab) { ctx.offer('🚂 Thăm buồng lái', st.toCab, 8); return; }
    const s = nearestSeat();
    if (s) { if (st.taken(s.id)) ctx.offer('🚫 Ghế có người rồi', () => ctx.toast('🪑 Ghế này có bạn ngồi rồi — tìm ghế trống khác nhé!', 2600), 5); else ctx.offer('🪑 Ngồi ghế này', () => sit(s), 9); }
  }
  function stop() { st.mode = 'off'; st.seat = null; if (player.hero) player.hero.model.visible = true; }
  return { update, walkMode, sit, standUp, stop, state: st, nearestSeat, get mode() { return st.mode; } };
}
