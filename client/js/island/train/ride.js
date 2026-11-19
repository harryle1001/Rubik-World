// train/ride.js — CHUYẾN TÀU: lịch chạy theo giờ trong game, lên tàu / ngồi ghế, chạy 144 s (Fibonacci) có tăng–giảm tốc,
// camera điện ảnh (camera.js), âm thanh tổng hợp (sound.js), nút bỏ qua, tự xuống tàu ở ga đến, khứ hồi.
// Tàu chỉ khởi hành khi có bạn trên tàu (đúng giờ tròn kế tiếp trong game).
import * as THREE from 'three';
import { at, S_A0, S_B1, YA, YB, PLAT_H, TUNNEL } from './route.js';
import { TRAIN_LEN, FLOOR } from './consist.js';
import { EDGE, SIDE_A, SIDE_B } from './stations.js';
import { createDirector, MODES, MODE_NAME } from './camera.js';
import { createTrainSound } from './sound.js';
import { createCabin } from './cabin.js';

export const DUR = 144, TA = 21, TD = 21;                  // thời gian chạy, tăng tốc, giảm tốc (s)
// chỗ đỗ: ga đi (đầu tàu ở phía s lớn khi đi Học viện; ở phía s nhỏ khi vừa về), ga đến tương tự
export const PARK = {
  A: { lo: S_A0 + 1, hi: S_A0 + 1 + TRAIN_LEN, side: SIDE_A, top: YA + PLAT_H, name: 'đảo Rubik' },
  B: { lo: S_B1 - 1 - TRAIN_LEN, hi: S_B1 - 1, side: SIDE_B, top: YB + PLAT_H, name: 'Học viện Pha Lê' },
};
export const SEAT_CAR = 3;                                 // toa khách thứ 2 (chỉ số trong CARS)
const fmt = h => `${String(Math.floor(h) % 24).padStart(2, '0')}:00`;

export function createRide(ctx, { consist }) {
  const { player, camera, sky } = ctx;
  const director = createDirector(ctx, consist), snd = createTrainSound(ctx), cabin = createCabin(ctx, consist);
  // trạng thái: tàu đỗ ở ga nào, chạy theo chiều nào khi khởi hành
  const st = { at: 'A', dir: 1, sHead: PARK.A.hi, phase: 'wait', t: 0, dep: null, wait: 0, s0: 0, s1: 0, L: 0, vmax: 0, aboard: false, speed: 0, mode: 0, clack: 0 };
  const headFor = (stn, dir) => (dir > 0 ? PARK[stn].hi : PARK[stn].lo);
  // đổi đầu tàu sang phía bên kia (khi không ai thấy / lúc chuyển cảnh lên tàu): cùng chỗ đỗ, đổi chiều
  function face(dir) { if (st.dir === dir) return; st.dir = dir; st.sHead = headFor(st.at, dir); consist.place(st.sHead, st.dir); }
  consist.place(st.sHead, st.dir);

  // ---------- giao diện ----------
  const fade = document.createElement('div');
  fade.style.cssText = 'position:fixed;inset:0;background:#0b0f18;opacity:0;pointer-events:none;transition:opacity .38s;z-index:40';
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:30;display:none;gap:8px;align-items:center;padding:6px 8px 6px 14px;border-radius:21px;background:#0f1a2acc;color:#f7ecd0;font:700 14px system-ui;white-space:nowrap;max-width:calc(100vw - 16px);box-sizing:border-box';
  const label = document.createElement('span'), btns = {};
  label.style.cssText = 'overflow:hidden;text-overflow:ellipsis';
  bar.appendChild(label);
  const mkBtn = (k, t, fn) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'border:0;border-radius:13px;padding:6px 11px;background:#2c6455;color:#fff;font:700 13px system-ui;cursor:pointer;flex:none'; b.onclick = e => { e.stopPropagation(); fn(); }; bar.appendChild(b); btns[k] = b; return b; };
  mkBtn('cam', MODE_NAME.auto, () => { st.mode = (st.mode + 1) % MODES.length; btns.cam.textContent = MODE_NAME[MODES[st.mode]]; });
  mkBtn('walk', '🚶 Đứng dậy', () => { if (cabin.state.walking) { cabin.sit(V); btns.walk.textContent = '🚶 Đứng dậy'; director.reset(); } else { cabin.stand(V, cabin.uOfSeat(SEAT_CAR, WIN_SEAT_Z)); btns.walk.textContent = '🪑 Ngồi xuống'; } });
  mkBtn('off', '🚪 Xuống tàu', () => alight());
  mkBtn('skip', '⏭ Tới nơi', () => { if (st.phase === 'run') st.t = DUR; });
  document.body.append(fade, bar);
  const narrow = () => innerWidth < 610;
  const showUI = on => { bar.style.display = on ? 'flex' : 'none'; bar.style.top = narrow() ? 'calc(max(12px,env(safe-area-inset-top)) + 76px)' : 'max(10px,env(safe-area-inset-top))'; for (const id of ['bRun', 'bJump', 'bBike', 'bBalloon']) { const b = document.getElementById(id); if (b) b.style.visibility = on ? 'hidden' : ''; } };
  const blink = fn => { fade.style.opacity = 1; setTimeout(() => { fn(); fade.style.opacity = 0; }, 400); };

  // ---------- lịch chạy: giờ tròn kế tiếp (giờ trong game); giờ bị khoá (nút ☀️) → 21 s ----------
  function schedule() { const h = sky.state.hour; st.dep = Math.floor(h) + 1; st.locked = sky.state.lock != null; st.wait = st.locked ? 21 : 0; }
  const untilDep = () => {
    if (st.locked) return st.wait;
    let d = st.dep - sky.state.hour; if (d < -12) d += 24; return d * 480 / 24 / (sky.state.hour > 9 && sky.state.hour < 16.5 ? 0.6 : 1);   // giây thật (sky.js: ngày 480 s, ban ngày chậm 0,6)
  };

  // ---------- lên / xuống tàu ----------
  const seatCar = () => consist.cars[SEAT_CAR];
  const V = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'sit', seat: 0, seatZ: 0, camAdd: 0, train: true };
  function board() {
    if (st.aboard || player.vehicle || (ctx.aircraft && ctx.aircraft.flying) || (ctx.ferry && ctx.ferry.riding)) return;
    blink(() => {
      face(st.at === 'A' ? 1 : -1);
      st.aboard = true; st.phase = 'board'; schedule();
      player.vehicle = V; showUI(true); btns.skip.hidden = true; btns.off.hidden = false;
      ctx.toast(`🚂 Chào mừng lên <b>Tàu Pha Lê</b>! Tàu khởi hành lúc <b>${st.locked ? 'vài giây nữa' : fmt(st.dep)}</b>.`, 4000);
    });
  }
  function alight() {
    if (!st.aboard || st.phase === 'run') return;
    blink(() => {
      if (cabin.state.walking) { cabin.sit(V); btns.walk.textContent = '🚶 Đứng dậy'; }
      st.aboard = false; st.phase = 'wait'; player.vehicle = null; showUI(false); director.reset();
      const P = PARK[st.at], c = seatCar(), p = at(st.at === 'B' ? S_B1 - 5 : c.s), lat = P.side * (EDGE + 1.8);   // ga Học viện: cuối sân ga, ngoài mái chờ (camera không kẹt mái)
      player.teleport(p.x - p.tz * lat, p.z + p.tx * lat, P.top); player.root.quaternion.identity();
      const f = st.at === 'B' ? 1 : -1;   // ga Học viện: nhìn về cuối sân ga (cửa tây lâu đài); ga đảo Rubik: về phía cuối tàu
      const vx = p.tx * st.dir * f - p.tz * P.side * 0.6, vz = p.tz * st.dir * f + p.tx * P.side * 0.6;   // chếch ra phía sân ga
      player.cam.yaw = Math.atan2(-vx, -vz); player.snapCamera && player.snapCamera();
      ctx.toast(st.at === 'B' ? '🏰 Ga <b>Học viện Pha Lê</b>. Đi tới cuối sân ga, rẽ phải vào <b>cửa tây lâu đài</b> (cầu có mái). Bến thuyền ⚓ ở cổng trước, đường băng ✈ ở cổng sau.' : '🏝️ Ga <b>đảo Rubik</b>. Chúc bạn một ngày vui!', 5000);
    });
  }
  function depart() {
    st.phase = 'run'; st.t = 0; st.s0 = st.sHead; st.s1 = headFor(st.at === 'A' ? 'B' : 'A', st.dir); st.L = Math.abs(st.s1 - st.s0);
    st.vmax = st.L / (DUR - (TA + TD) / 2); btns.skip.hidden = false; btns.off.hidden = true; st.titled = false; st.whistled = 0;
    snd.whistle(1.6); ctx.toast(st.dir > 0 ? '🚂 Tu… tu…! Tàu Pha Lê lăn bánh tới <b>Học viện Pha Lê</b>' : '🚂 Tu… tu…! Tàu Pha Lê về <b>đảo Rubik</b>', 3500);
  }
  const distAt = t => {   // quãng đường sau t giây (tăng tốc đều – chạy đều – giảm tốc đều)
    if (t <= TA) return 0.5 * st.vmax / TA * t * t;
    if (t <= DUR - TD) return 0.5 * st.vmax * TA + st.vmax * (t - TA);
    const r = DUR - t; return st.L - 0.5 * st.vmax / TD * r * r;
  };
  function arrive() {
    st.at = st.at === 'A' ? 'B' : 'A'; st.sHead = st.s1; st.phase = 'board'; consist.place(st.sHead, st.dir); st.speed = 0;
    snd.hiss(2); setTimeout(alight, 1600);
  }

  // ---------- camera khi chờ khởi hành: trong toa, cuối lối đi nhìn về ghế của bạn ----------
  const seatPos = new THREE.Vector3(), cpos = new THREE.Vector3(), clook = new THREE.Vector3(), lp = new THREE.Vector3();
  function camBoard() {
    const o = seatCar().o; o.updateMatrixWorld();
    cpos.set(0.3, FLOOR + 1.62, 3.55).applyMatrix4(o.matrixWorld); clook.set(-0.4, FLOOR + 0.85, -0.6).applyMatrix4(o.matrixWorld);
    camera.position.copy(cpos); camera.lookAt(clook); consist.setHideGlow(SEAT_CAR - 2);
  }

  // ---------- mỗi khung hình ----------
  function update(dt) {
    let prevS = st.sHead;
    if (st.phase === 'run') {
      st.t = Math.min(DUR, st.t + dt); st.sHead = st.s0 + st.dir * distAt(st.t); consist.place(st.sHead, st.dir);
      st.speed = Math.abs(st.sHead - prevS) / Math.max(dt, 1e-3);
      // mối ray mỗi 13 m (Fibonacci) dưới toa bạn ngồi; còi trước khi vào hầm
      const sc = seatCar().s; if (Math.floor(sc / 13) !== st.clack) { st.clack = Math.floor(sc / 13); if (st.speed > 1) snd.clack(1.4 / st.speed); }
      const toTun = st.dir > 0 ? TUNNEL.s0 - st.sHead : st.sHead - TUNNEL.s1; if (!st.whistled && toTun < 55 && toTun > 0) { st.whistled = 1; snd.whistle(1.2); }
      if (st.t >= DUR) arrive();
    }
    consist.animate(dt, st.phase === 'run' ? st.speed : 0, sp => snd.chuff(sp));
    if (st.phase === 'run') consist.place(st.sHead, st.dir);   // cập nhật lắc toa
    cabin.animate(dt);
    if (st.aboard) {
      const camCar = cabin.update(dt, V);
      if (camCar === false) { const c = seatCar(); c.o.updateMatrixWorld(); seatPos.set(-0.8, FLOOR + 0.02, WIN_SEAT_Z).applyMatrix4(c.o.matrixWorld); player.pos.copy(seatPos); player.root.position.copy(seatPos); player.root.quaternion.copy(c.o.quaternion); }
      else consist.setHideGlow(camCar);
      if (st.phase === 'board') {
        if (st.locked) st.wait -= dt;
        const left = Math.max(0, Math.ceil(untilDep()));
        label.textContent = narrow() ? `🚂 ${st.locked ? '' : fmt(st.dep) + ' · '}còn ${left} s` : `🚂 Tàu Pha Lê → ${st.at === 'A' ? PARK.B.name : PARK.A.name} · khởi hành ${st.locked ? 'ngay' : fmt(st.dep)} · còn ${left} s`;
        if (untilDep() <= 0) depart();
        if (camCar === false) camBoard(); snd.mix(3, true, false);
      } else if (st.phase === 'run') {
        const left = Math.ceil(DUR - st.t); label.textContent = narrow() ? `🚂 còn ${left} s` : `🚂 Tàu Pha Lê · ${st.dir > 0 ? 'tới Học viện Pha Lê' : 'về đảo Rubik'} · còn ${left} s`;
        const from = PARK[st.at], to = PARK[st.at === 'A' ? 'B' : 'A'];   // st.at đổi khi tới ga
        const R = { s: st.sHead, dir: st.dir, t: st.t, left: Math.abs(st.s1 - st.sHead), sFrom: st.s0, sTo: st.s1, from, to, seatCar: SEAT_CAR, mode: MODES[st.mode] };
        if (st.titled) R.titled = true;
        if (camCar === false) {
          const info = director.update(dt, R); if (R.titled) st.titled = true;
          consist.cars[0].o.getWorldPosition(lp); snd.mix(lp.distanceTo(camera.position), info.inCar, info.inTun);
        } else snd.mix(6, true, false);
      }
      return;
    }
    consist.cars[0].o.getWorldPosition(lp); snd.mix(lp.distanceTo(camera.position), false, false);
    // chưa lên tàu: lời mời ở sân ga (cạnh thân tàu)
    if (player.vehicle) return;
    const P = PARK[st.at], pp = player.pos, pS = at((P.lo + P.hi) / 2);
    if ((pp.x - pS.x) ** 2 + (pp.z - pS.z) ** 2 < 55 * 55 && Math.abs(pp.y - P.top) < 1.6) ctx.offer(`🚂 Lên tàu (${fmt(Math.floor(sky.state.hour) + 1)} → ${st.at === 'A' ? PARK.B.name : PARK.A.name})`, board, 9);
  }
  // tàu đang đỗ ở ga xa, người chơi ở ga kia (đi thuyền/máy bay sang) → chuyển tàu về ga gần khi không ai thấy
  function relocate(stn) { if (st.aboard || st.phase === 'run' || st.at === stn) return; st.at = stn; st.dir = stn === 'A' ? 1 : -1; st.sHead = headFor(stn, st.dir); consist.place(st.sHead, st.dir); }
  return { update, board, alight, depart: () => st.phase === 'board' && depart(), relocate, state: st, cabin, seek: t => { if (st.phase === 'run') st.t = t; }, get riding() { return st.aboard; } };
}
const WIN_SEAT_Z = -0.15 + 0.06;   // ghế cạnh cửa sổ hàng giữa (WIN.z(2) − 0,15), ngồi lùi về lưng ghế
