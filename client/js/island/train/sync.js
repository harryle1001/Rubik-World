// train/sync.js — NHIỀU NGƯỜI CHƠI CÙNG CHUYẾN (Socket.io /island qua net.js): 1 đoàn tàu chung chạy theo GIỜ SERVER,
// ghế giữ chỗ trên server (ai ngồi trước được trước), người khác trên tàu đặt theo toạ độ cục bộ toa → đi lại / ngồi mượt dù tàu đang chạy.
// Không có server (bản link tĩnh): không làm gì, ride.js tự chạy lịch một mình như cũ.
import * as THREE from 'three';
import { FLOOR } from './consist.js';
import { CAB } from './coaches.js';
import { driveHero } from '../characters.js';

export function createTrainSync(ctx, { ride, consist, interior }) {
  const net = ctx.net; if (!net || !net.on) return { netPose: () => null, placeOther: () => false };
  let off = 0; const owner = new Map();
  const clock = () => Date.now() + off;   // giờ server (ms)
  net.on('tr', d => { off = d.now - Date.now(); owner.clear(); for (const [k, v] of d.seats || []) owner.set(k, v); ride.netState(d, clock); });
  net.on('trSeat', r => { if (!r.ok) ride.seatRefused(r.id); });
  ctx.trainSeats = id => { const w = owner.get(id); return !!w && w !== net.id; };
  ride.net = { emit: d => net.emit('tr', d), get online() { return net.connected; } };

  const cs = ride.cabin.state, cars = consist.cars;
  // gói vị trí gửi đi (net.js gọi 10 lần/giây)
  function netPose() {
    if (!ride.riding || cs.mode === 'off') return null;
    return { c: cs.car, x: +cs.x.toFixed(2), z: +cs.z.toFixed(2), r: +(ctx.player.rot - cars[cs.car].o.rotation.y).toFixed(2), st: cs.seat ? cs.seat.id : -1 };
  }
  // người khác trên tàu: toạ độ cục bộ → thế giới (nội suy trong hệ toa), ngồi đúng ghế
  const v = new THREE.Vector3(), lp = new THREE.Vector3();
  function placeOther(o, dt) {
    const t = o.tr, car = cars[t.c]; if (!car) return false;
    const seat = t.st >= 0 ? interior.byId.get(t.st) : null;
    const tx = seat ? seat.x : t.x, tz = seat ? seat.z : t.z;
    if (!o.tl || o.tl.c !== t.c || seat) o.tl = { c: t.c, x: tx, z: tz }; else { const k = Math.min(1, dt * 10); o.tl.x += (tx - o.tl.x) * k; o.tl.z += (tz - o.tl.z) * k; }
    const y = t.c === 0 ? CAB.floor : FLOOR + (seat ? 0.02 + (seat.y || 0) : 0);
    car.o.updateMatrixWorld(); v.set(o.tl.x, y, o.tl.z).applyMatrix4(car.o.matrixWorld);
    const root = o.h.root; root.position.copy(v); root.rotation.set(0, car.o.rotation.y + (seat ? seat.ry : o.r), 0);
    if (o.hero) {
      const d = v.distanceTo(ctx.camera.position); o.hero.model.visible = d < 89;
      driveHero(o.hero, { speed: seat ? 0 : o.s, grounded: true, sitting: !!seat });
      if (d < 34) o.hero.anim.update(dt);
    }
    return true;
  }
  return { netPose, placeOther, clock };
}
