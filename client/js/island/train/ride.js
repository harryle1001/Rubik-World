// train/ride.js — CHUYẾN TÀU: lịch chạy theo giờ trong game, lên tàu (đứng ở tiền sảnh toa gần nhất) → tự chọn ghế trống,
// chạy 144 s (Fibonacci) có tăng–giảm tốc, camera điện ảnh khi ngồi (camera.js) hoặc camera trong toa (cabin.js),
// âm thanh tổng hợp (sound.js), nút bỏ qua, tự xuống tàu ở ga đến, khứ hồi. Tàu chỉ khởi hành khi có bạn trên tàu.
import * as THREE from 'three';
import { at, nearest, S_A0, S_A1, S_B1, YA, YB, PLAT_H, TUNNEL } from './route.js';
import { TRAIN_LEN, CL } from './consist.js';
import { EDGE, SIDE_A, SIDE_B } from './stations.js';
import { createDirector, MODES, MODE_NAME } from './camera.js';
import { createTrainSound } from './sound.js';
import { createCabin } from './cabin.js';
import { CAB } from './coaches.js';
const CAB_STAND = CAB.stand;

export const DUR = 144, TA = 21, TD = 21;                  // thời gian chạy, tăng tốc, giảm tốc (s)
// chỗ đỗ: ga đi (đầu tàu ở phía s lớn khi đi Học viện; ở phía s nhỏ khi vừa về), ga đến tương tự
export const PARK = {
  A: { lo: S_A0 + 1, hi: S_A0 + 1 + TRAIN_LEN, side: SIDE_A, top: YA + PLAT_H, name: 'đảo Rubik' },
  B: { lo: S_B1 - 1 - TRAIN_LEN, hi: S_B1 - 1, side: SIDE_B, top: YB + PLAT_H, name: 'Học viện Pha Lê' },
};
const fmt = h => `${String(Math.floor(h) % 24).padStart(2, '0')}:00`;

export function createRide(ctx, { consist, interior }) {
  const { player, camera, sky } = ctx;
  const director = createDirector(ctx, consist), snd = createTrainSound(ctx), cabin = createCabin(ctx, consist, interior);
  cabin.state.toCab = () => blink(() => { cabin.walkMode(0, CAB_STAND.x, CAB_STAND.z, 0); ctx.toast('🚂 <b>Buồng lái</b>: bác lái tàu điều khiển van hơi, chú đốt lò xúc than vào lò. Than cháy đun sôi nước → <b>hơi nước</b> đẩy pít-tông → quay bánh xe!', 7000); });
  cabin.state.back = () => blink(() => cabin.walkMode(2, 0, 5.95, Math.PI));   // buồng lái → tiền sảnh toa khách đầu
  cabin.state.taken = id => interior.occupiedByNpc(id) || !!(ctx.trainSeats && ctx.trainSeats(id));
  // trạng thái: tàu đỗ ở ga nào, chạy theo chiều nào khi khởi hành
  const st = { at: 'A', dir: 1, sHead: PARK.A.hi, phase: 'wait', t: 0, dep: null, wait: 0, s0: 0, s1: 0, L: 0, vmax: 0, aboard: false, speed: 0, mode: 1, clack: 0 };   // mode 1 = 🪑 Trong toa (camera của mình); 🎥 đổi sang điện ảnh
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
  mkBtn('cam', MODE_NAME.seat, () => { st.mode = (st.mode + 1) % MODES.length; btns.cam.textContent = MODE_NAME[MODES[st.mode]]; director.reset(); });
  mkBtn('off', '🚪 Xuống tàu', () => alight());
  mkBtn('skip', '⏭ Tới nơi', () => { if (st.phase !== 'run') return; if (online()) ride.net.emit({ op: 'skip' }); else st.t = DUR; });
  document.body.append(fade, bar);
  const narrow = () => innerWidth < 610;
  const showUI = on => { bar.style.display = on ? 'flex' : 'none'; bar.style.top = narrow() ? 'calc(max(12px,env(safe-area-inset-top)) + 76px)' : 'max(10px,env(safe-area-inset-top))'; for (const id of ['bRun', 'bJump', 'bBike', 'bBalloon']) { const b = document.getElementById(id); if (b) b.style.visibility = on ? 'hidden' : ''; } };
  const blink = fn => { fade.style.opacity = 1; setTimeout(() => { fn(); fade.style.opacity = 0; }, 400); };

  // ---------- lịch chạy: giờ tròn kế tiếp (giờ trong game); giờ bị khoá (nút ☀️) → 21 s ----------
  // có server: 1 đoàn tàu chung, lịch theo giờ server (sync.js gọi netState); không có: lịch giờ trong game, chạy một mình
  let srv = null, clock = Date.now;
  const online = () => !!(srv && ride.net && ride.net.online);
  function schedule() { if (online()) { st.locked = true; st.wait = srv.phase === 'board' ? (srv.dep - clock()) / 1000 : 21; return; } const h = sky.state.hour; st.dep = Math.floor(h) + 1; st.locked = sky.state.lock != null; st.wait = st.locked ? 21 : 0; }
  const untilDep = () => {
    if (st.locked) return st.wait;
    let d = st.dep - sky.state.hour; if (d < -12) d += 24; return d * 480 / 24 / (sky.state.hour > 9 && sky.state.hour < 16.5 ? 0.6 : 1);   // giây thật (sky.js: ngày 480 s, ban ngày chậm 0,6)
  };

  // ---------- lên / xuống tàu ----------
  const V = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'idle', seat: 0, seatZ: 0, camAdd: 0, train: true };
  const coachIdx = consist.cars.map((c, i) => i).filter(i => consist.cars[i].kind === 'coach');
  function board() {
    if (st.aboard || st.phase === 'run' || player.vehicle || (ctx.aircraft && ctx.aircraft.flying) || (ctx.ferry && ctx.ferry.riding)) return;
    const q = nearest(player.pos.x, player.pos.z, PARK[st.at].lo - 13, PARK[st.at].hi + 13);
    if (st.at === 'A' && ctx.premium && !ctx.premium.allow('academy')) return;   // tàu tới cao nguyên Học viện: Gói Phụ huynh
    blink(() => {
      face(st.at === 'A' ? 1 : -1);
      st.aboard = true; st.phase = 'board'; schedule(); if (online()) ride.net.emit({ op: 'board' });
      player.vehicle = V; showUI(true); btns.skip.hidden = true; btns.off.hidden = false;
      // toa gần chỗ người chơi đứng nhất → tiền sảnh đầu toa phía gần, mặt hướng vào trong toa
      let ci = coachIdx[0], bd = 1e9; for (const i of coachIdx) { const d = Math.abs(consist.cars[i].s - q.s); if (d < bd) { bd = d; ci = i; } }
      const c = consist.cars[ci], zl = Math.max(-1, Math.min(1, (q.s - c.s) * st.dir / (CL / 2))) >= 0 ? 1 : -1;
      cabin.walkMode(ci, 0, zl * (CL / 2 - 0.5), zl > 0 ? Math.PI : 0);
      ctx.toast(`🚂 Chào mừng lên <b>Tàu Pha Lê</b>! Đi dọc toa, tới ghế trống bấm <b>E</b> để ngồi. Tàu khởi hành lúc <b>${st.locked ? 'vài giây nữa' : fmt(st.dep)}</b>.`, 5000);
    });
  }
  function alight() {
    if (!st.aboard || st.phase === 'run') return;
    blink(() => {
      if (online()) ride.net.emit({ op: 'leave' });
      cabin.stop(); st.aboard = false; st.phase = 'wait'; player.vehicle = null; showUI(false); director.reset();
      const P = PARK[st.at], c = consist.cars[cabin.state.car] || consist.cars[2];
      const p = at(st.at === 'B' ? S_B1 - 5 : Math.max(S_A0 + 3, Math.min(S_A1 - 3, c.s))), lat = P.side * (EDGE + 1.8);   // ga Học viện: cuối sân ga, ngoài mái chờ (camera không kẹt mái)
      player.teleport(p.x - p.tz * lat, p.z + p.tx * lat, P.top); player.root.quaternion.identity();
      const f = st.at === 'B' ? 1 : -1;   // ga Học viện: nhìn về cuối sân ga (cửa tây lâu đài); ga đảo Rubik: về phía cuối tàu
      const vx = p.tx * st.dir * f - p.tz * P.side * 0.6, vz = p.tz * st.dir * f + p.tx * P.side * 0.6;   // chếch ra phía sân ga
      player.cam.yaw = Math.atan2(-vx, -vz); player.snapCamera && player.snapCamera();
      ctx.toast(st.at === 'B' ? '🏰 Ga <b>Học viện Pha Lê</b>. Đi tới cuối sân ga, rẽ phải vào <b>cửa tây lâu đài</b> (cầu có mái). Bến thuyền ⚓ ở cổng trước, đường băng ✈ ở cổng sau.' : '🏝️ Ga <b>đảo Rubik</b>. Chúc bạn một ngày vui!', 5000);
    });
  }
  function depart() {
    st.phase = 'run'; st.t = 0; st.s0 = st.sHead; st.s1 = headFor(st.at === 'A' ? 'B' : 'A', st.dir); st.L = Math.abs(st.s1 - st.s0);
    st.vmax = st.L / (DUR - (TA + TD) / 2); btns.skip.hidden = false; btns.off.hidden = true; st.titled = false; st.whistled = 0; st.near = 0;
    snd.whistle(1.6); if (!st.aboard) return;
    const to = st.dir > 0 ? 'Học viện Pha Lê' : 'đảo Rubik';
    snd.announce(`Tàu Pha Lê khởi hành đi <b>${to}</b>. Thời gian chạy 144 giây — mời quý khách ngồi ghế, cô Lam sẽ đẩy xe đồ ăn qua các toa.`, `Tàu Pha Lê khởi hành đi ${to}. Chúc quý khách thượng lộ bình an.`);
  }
  const distAt = t => {   // quãng đường sau t giây (tăng tốc đều – chạy đều – giảm tốc đều)
    if (t <= TA) return 0.5 * st.vmax / TA * t * t;
    if (t <= DUR - TD) return 0.5 * st.vmax * TA + st.vmax * (t - TA);
    const r = DUR - t; return st.L - 0.5 * st.vmax / TD * r * r;
  };
  function arrive() {
    st.at = st.at === 'A' ? 'B' : 'A'; st.sHead = st.s1; st.phase = st.aboard ? 'board' : 'wait'; consist.place(st.sHead, st.dir); st.speed = 0;
    snd.hiss(2); if (st.aboard) { const n = st.at === 'B' ? 'Học viện Pha Lê' : 'đảo Rubik'; snd.announce(`Tàu đã tới ga <b>${n}</b>. Quý khách nhớ mang theo hành lý!`, `Tàu đã tới ga ${n}. Quý khách nhớ mang theo hành lý.`); }
    setTimeout(alight, 2600);
  }

  const lp = new THREE.Vector3();

  // ---------- mỗi khung hình ----------
  function update(dt) {
    let prevS = st.sHead;
    if (st.phase === 'run') {
      st.t = online() && srv.phase === 'run' ? Math.max(st.t, Math.min(DUR, (clock() - srv.t0) / 1000)) : online() ? DUR : Math.min(DUR, st.t + dt); st.sHead = st.s0 + st.dir * distAt(st.t); consist.place(st.sHead, st.dir);
      st.speed = Math.abs(st.sHead - prevS) / Math.max(dt, 1e-3);
      // mối ray mỗi 13 m (Fibonacci) dưới toa bạn ngồi; còi trước khi vào hầm
      const sc = (consist.cars[cabin.state.car] || consist.cars[2]).s; if (Math.floor(sc / 13) !== st.clack) { st.clack = Math.floor(sc / 13); if (st.speed > 1) snd.clack(1.4 / st.speed); }
      const toTun = st.dir > 0 ? TUNNEL.s0 - st.sHead : st.sHead - TUNNEL.s1; if (!st.whistled && toTun < 55 && toTun > 0) { st.whistled = 1; snd.whistle(1.2); }
      if (st.t >= DUR) arrive();
    }
    consist.animate(dt, st.phase === 'run' ? st.speed : 0, sp => snd.chuff(sp)); snd.engine(st.phase === 'run' ? st.speed : 0);
    // sắp tới ga (còn ~21 s): thông báo trước
    if (st.aboard && st.phase === 'run' && !st.near && DUR - st.t < 21) { st.near = 1; const n = st.dir > 0 ? 'Học viện Pha Lê' : 'đảo Rubik'; snd.announce(`Sắp tới ga <b>${n}</b> — còn khoảng 21 giây.`, `Sắp tới ga ${n}.`); }
    if (st.phase === 'run') consist.place(st.sHead, st.dir);   // cập nhật lắc toa
    if (st.aboard) {
      const cm = cabin.update(dt), cine = cm === 'seat' && MODES[st.mode] !== 'seat';   // ngồi + chế độ điện ảnh → đạo diễn camera
      if (st.phase === 'board') {
        if (online()) st.wait = srv.phase === 'board' ? (srv.dep - clock()) / 1000 : 21; else if (st.locked) st.wait -= dt;
        const left = Math.max(0, Math.ceil(untilDep()));
        label.textContent = narrow() ? `🚂 ${st.locked ? '' : fmt(st.dep) + ' · '}còn ${left} s` : `🚂 Tàu Pha Lê → ${st.at === 'A' ? PARK.B.name : PARK.A.name} · khởi hành ${st.locked ? 'ngay' : fmt(st.dep)} · còn ${left} s`;
        if (!online() && untilDep() <= 0) depart();
        snd.mix(3, true, false);
      } else if (st.phase === 'run') {
        const left = Math.ceil(DUR - st.t); label.textContent = narrow() ? `🚂 còn ${left} s` : `🚂 Tàu Pha Lê · ${st.dir > 0 ? 'tới Học viện Pha Lê' : 'về đảo Rubik'} · còn ${left} s`;
        const from = PARK[st.at], to = PARK[st.at === 'A' ? 'B' : 'A'];   // st.at đổi khi tới ga
        const R = { s: st.sHead, dir: st.dir, t: st.t, left: Math.abs(st.s1 - st.sHead), sFrom: st.s0, sTo: st.s1, from, to, seat: cabin.state.seat, mode: MODES[st.mode] };
        if (st.titled) R.titled = true;
        if (cine) {
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
    if ((pp.x - pS.x) ** 2 + (pp.z - pS.z) ** 2 < 55 * 55 && Math.abs(pp.y - P.top) < 1.6) ctx.offer(`🚂 Lên tàu${st.at === 'A' && ctx.premium && !ctx.premium.on() ? ' 🔒' : ''} (${fmt(Math.floor(sky.state.hour) + 1)} → ${st.at === 'A' ? PARK.B.name : PARK.A.name})`, board, 9);
  }
  // tàu đang đỗ ở ga xa, người chơi ở ga kia (đi thuyền/máy bay sang) → chuyển tàu về ga gần khi không ai thấy
  function relocate(stn) { if (online()) { if (srv.phase === 'wait' && !srv.n && srv.at !== stn) ride.net.emit({ op: 'reloc', at: stn }); return; } if (st.aboard || st.phase === 'run' || st.at === stn) return; st.at = stn; st.dir = stn === 'A' ? 1 : -1; st.sHead = headFor(stn, st.dir); consist.place(st.sHead, st.dir); }
  // trạng thái server mới: khởi hành / dời ga cùng mọi người
  function netState(d, clk) {
    srv = d; clock = clk;
    if (d.phase === 'run' && st.phase !== 'run') {   // tàu chung lăn bánh (cả khi mình chưa lên: thấy tàu chạy)
      if (st.aboard && st.at !== d.at) return;
      if (!st.aboard) { st.at = d.at; st.dir = d.dir; st.sHead = headFor(d.at, d.dir); consist.place(st.sHead, st.dir); }
      else face(d.dir);
      depart(); st.t = Math.max(0, (clock() - d.t0) / 1000);
    } else if ((d.phase === 'wait' || d.phase === 'board') && st.phase === 'wait' && !st.aboard && (st.at !== d.at || st.dir !== d.dir)) {
      st.at = d.at; st.dir = d.dir; st.sHead = headFor(d.at, d.dir); consist.place(st.sHead, st.dir);
    }
  }
  function seatRefused() { if (cabin.state.mode === 'seat') { cabin.standUp(); ctx.toast('🪑 Bạn khác vừa ngồi ghế này trước — tìm ghế khác nhé!', 3000); } }
  // ---------- kiểm thử tự động (tools/train-test.mjs) ----------
  const debug = {
    debugStops: () => coachIdx.map(i => ({ car: i, kind: consist.cars[i].type })).concat([{ car: 0, kind: 'cab' }]),
    debugGo: car => { if (car === 0) cabin.walkMode(0, CAB_STAND.x, CAB_STAND.z, 0); else cabin.walkMode(car, consist.cars[car].type === 'compart' ? 1.04 : 0, 4.2, Math.PI); },
    debugSit: () => { const s = interior.seats.find(s => s.car === cabin.state.car && !cabin.state.taken(s.id)) || interior.seats.find(s => !cabin.state.taken(s.id)); return cabin.sit(s) && s.id; },
  };
  const ride = { snd, netState, seatRefused, net: null, update, board, alight, depart: () => st.phase === 'board' && depart(), relocate, state: st, cabin, seek: t => { if (st.phase === 'run') st.t = t; }, get riding() { return st.aboard; }, ...debug };
  return ride;
}
