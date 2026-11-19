// olympics.js — THẾ VẬN HỘI RUBIK 3D: sân vận động có khán đài cổ vũ, học sinh toon chạy/nhảy/bơi thật bằng animation.
//   🏃 Chạy tiếp sức 4 × 21 m (chạm để chạy, bấm 🤝 trao gậy trong vùng vàng)
//   🦘 Nhảy xa (chạy đà, giữ để chọn góc bật, thả để bật — học về góc bay)
//   🏊 Bơi 25 m (chạm = 1 nhịp tay, 😮‍💨 thở đúng nhịp 3 tay)
//   🪶 Đá cầu (chạm đúng lúc quả cầu rơi tới chân — môn dân gian Việt Nam)
//   🪢 Kéo co 5 × 5 (chạm theo nhịp "Dô ta" + giải phép tính nhanh để cả đội kéo mạnh)
// Điều khiển 1 tay: chạm / giữ ở bất kỳ đâu + 1 nút lớn bên phải. Máy tính: Space, nút E/Enter cho nút lớn.
import * as THREE from 'three';
import { PHI, FIB, TAU, clamp, lerp, damp, rnd, pick, store, arena, hud, tapper, sfx, lockWorld, kid, sportLook, TEAM, play, crowd, batch, bunting, textSprite, mathQ, vmat } from './kit.js';

const MEDAL = ['', '🥇 Huy chương Vàng', '🥈 Huy chương Bạc', '🥉 Huy chương Đồng'];
const EVENTS = {
  relay: { n: 'Chạy tiếp sức', i: '🏃', unit: 's', lower: true, how: 'Chạm liên tục để chạy. Tới vùng vàng, bấm 🤝 khi đứng sát bạn để trao gậy.',
    fact: 'Tiếp sức: bạn nhận gậy chạy đà trước trong vùng trao gậy nên không mất tốc độ. Chạy xong, đi bộ chậm và thả lỏng để tim đập chậm lại từ từ.' },
  longjump: { n: 'Nhảy xa', i: '🦘', unit: 'm', how: 'Chạm liên tục để chạy đà. Gần ván giậm: GIỮ để chọn góc bật, THẢ tay để bật nhảy (đừng giẫm quá vạch đỏ!).',
    fact: 'Quãng bay ≈ 2·v<sub>ngang</sub>·v<sub>đứng</sub> / g. Vận động viên bật khoảng 20–30° (không phải 45°) vì chạy càng nhanh càng khó bật cao — tốc độ chạy đà quan trọng nhất!' },
  swim: { n: 'Bơi 25 m', i: '🏊', unit: 's', lower: true, how: 'Mỗi lần chạm là 1 nhịp tay. Bấm 😮‍💨 để lấy hơi — chuẩn nhất là sau mỗi 3 nhịp tay.',
    fact: 'Bơi sải thở mỗi 3 nhịp tay giúp đủ ô-xy và quay đầu đều cả hai bên. Luôn khởi động kỹ và chỉ xuống nước khi có người lớn trông chừng.' },
  dacau: { n: 'Đá cầu', i: '🪶', unit: 'quả', how: 'Chạm đúng lúc quả cầu rơi vào vòng sáng dưới chân (vòng chuyển xanh). Trượt 3 lần là hết lượt.',
    fact: 'Đá cầu là môn thể thao dân gian Việt Nam: rèn sự khéo léo, phản xạ và sự phối hợp tay – mắt – chân. Mắt luôn nhìn theo quả cầu, đá bằng má trong bàn chân.' },
  tug: { n: 'Kéo co', i: '🪢', unit: '', how: 'Chạm theo nhịp “Dô… TA!” để cả đội kéo. Trả lời đúng phép tính nhanh → cả đội kéo một cú thật mạnh!',
    fact: 'Kéo co: cả đội ngả người ra sau, chân bám chắc và hô “Dô ta” để kéo cùng một nhịp. Sức mạnh tập thể thắng sức mạnh một người!' },
};
// vị trí các khu trong sân (m) — sân gọn 105 × 63 m (trước 290 × 63 m quá lớn, đè lên nhiều khu của thế giới): 4 × 21 m tiếp sức, bể 25 m
const V = { relay: [-42, 0], longjump: [-30, 13], swim: [-12, -24], dacau: [8, 19], tug: [32, 19] };
const LEG = 21, FINISH = LEG * 4, POOL = 25;

function start(ctx, opts = {}) {
  const quit = () => (opts.onExit || opts.exit || opts.close || (() => self.dispose()))();
  const A = arena(ctx, { sky: ['#6fb7ff', '#e6f3ff'], fog: [89, 340], shadow: 55, api: opts.api, center: [0, -4] }), { scene, cam } = A, W = !!A.inWorld;   // W: sân đặt trong thế giới mở
  const H = hud('🏅 Thế vận hội Rubik', quit, opts.api), inp = tapper(document.body), S = sfx(ctx), unlock = lockWorld(ctx);
  const T = new THREE.Vector3(), camP = new THREE.Vector3(0, 4, 12), camL = new THREE.Vector3();
  let ev = null, evKey = null, t = 0, clockT = 0;

  // ---------- Sân vận động (greybox gộp khối: ít draw call) ----------
  const crowds = [];
  {
    const b = batch();
    // cỏ: lưới có màu loang nhẹ
    const g = W ? new THREE.PlaneGeometry(105, 63, 11, 6).rotateX(-Math.PI / 2) : new THREE.PlaneGeometry(420, 260, 42, 26).rotateX(-Math.PI / 2), p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
    for (let i = 0; i < p.count; i++) { col.set(((Math.floor(p.getX(i) / 10) + Math.floor(p.getZ(i) / 10)) & 1) ? '#7cc062' : '#72b758').offsetHSL(0, 0, rnd(-0.02, 0.02)); c.set([col.r, col.g, col.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.deleteAttribute('uv');
    const grass = new THREE.Mesh(g, vmat); grass.receiveShadow = true; grass.position.set(W ? 0 : 20, W ? 0.02 : 0, W ? -4 : 10); scene.add(grass);
    // đường chạy: 4 làn, vạch trắng, vùng trao gậy vàng, vạch đích ca-rô
    const [rx, rz] = V.relay;
    b.box(FINISH + 13, 0.04, 8, rx + FINISH / 2, 0, rz, '#c0533a');
    for (let i = 0; i <= 4; i++) b.box(FINISH + 13, 0.05, 0.07, rx + FINISH / 2, 0, rz + (i - 2) * 1.6, '#ffffff');
    for (let k = 1; k < 4; k++) { b.box(10, 0.045, 6.4, rx + k * LEG, 0.004, rz, '#f2c14e'); b.box(0.12, 0.06, 6.4, rx + k * LEG - 5, 0, rz, '#fff'); b.box(0.12, 0.06, 6.4, rx + k * LEG + 5, 0, rz, '#fff'); }
    for (let i = 0; i < 16; i++) b.box(0.4, 0.06, 0.4, rx + FINISH + (i % 2) * 0.4 - 0.2, 0, rz - 3 + i * 0.4, i % 2 ? '#222' : '#fff');
    b.box(0.2, 3.4, 0.2, rx + FINISH, 0, rz - 3.6, '#ddd'); b.box(0.2, 3.4, 0.2, rx + FINISH, 0, rz + 3.6, '#ddd'); b.box(0.3, 0.8, 7.6, rx + FINISH, 3.3, rz, '#e8453c');
    // nhảy xa: đường chạy đà, ván giậm, hố cát
    const [lx, lz] = V.longjump;
    b.box(LEG + 2, 0.04, 1.6, lx + LEG / 2, 0, lz, '#c0533a'); b.box(0.2, 0.06, 1.6, lx + LEG, 0, lz, '#ffffff'); b.box(0.08, 0.065, 1.6, lx + LEG + 0.14, 0, lz, '#e8453c');
    b.box(11, 0.1, 3.4, lx + LEG + 6, 0, lz, '#f0d9a0'); b.box(11.4, 0.16, 0.2, lx + LEG + 6, 0, lz - 1.8, '#d9cfc0'); b.box(11.4, 0.16, 0.2, lx + LEG + 6, 0, lz + 1.8, '#d9cfc0');
    for (let m = 3; m <= 8; m++) b.box(0.05, 0.12, 0.6, lx + LEG + m, 0, lz - 2.3, '#ffffff');
    // hồ bơi 25 m: thành bể, làn phao
    const [px, pz] = V.swim;
    b.box(POOL + 6, 0.35, 14, px + POOL / 2, 0, pz, '#e9eef2');
    for (let i = 0; i <= 4; i++) for (let k = 0; k < POOL; k++) b.add(new THREE.SphereGeometry(0.13, 6, 4), k % 5 ? (i % 2 ? '#e8453c' : '#3d8fd9') : '#ffffff', px + k + 0.5, 0.33, pz + (i - 2) * 2.4);
    for (let i = 0; i < 4; i++) b.box(0.8, 0.6, 1, px - 0.6, 0.35, pz + (i - 1.5) * 2.4, '#ffffff');
    // sân đá cầu: thảm tròn
    const [dx, dz] = V.dacau; b.add(new THREE.CylinderGeometry(5.5, 5.5, 0.05, 34), '#3d8fd9', dx + 1.7, 0.025, dz); b.add(new THREE.CylinderGeometry(5.2, 5.2, 0.06, 34), '#5aa0e0', dx + 1.7, 0.03, dz);
    // kéo co: vạch giữa + 2 vạch thắng
    const [tx, tz] = V.tug; b.box(0.15, 0.05, 4, tx, 0, tz, '#ffffff'); b.box(0.15, 0.05, 4, tx - 2.6, 0, tz, '#e8453c'); b.box(0.15, 0.05, 4, tx + 2.6, 0, tz, '#3d8fd9');
    // cờ đuôi nheo + cột
    bunting(b, rx - 5, rz - 9, rx + FINISH + 5, rz - 9, 6.5, 55); bunting(b, px - 3, pz - 11, px + POOL + 3, pz - 11, 5.5, 34);
    for (const [x, z] of [[rx - 5, rz - 9], [rx + FINISH + 5, rz - 9], [px - 3, pz - 11], [px + POOL + 3, pz - 11]]) b.box(0.2, 7, 0.2, x, 0, z, '#ffffff');
    // vòng Olympic 5 màu trên tường khán đài
    const ring = new THREE.TorusGeometry(0.8, 0.12, 6, 24);
    ['#3d8fd9', '#222222', '#e8453c', '#f2c14e', '#3fa36b'].forEach((cc, i) => b.add(ring, cc, rx + FINISH / 2 - 4 + i * 1.8, i % 2 ? 6.9 : 7.6, rz - 9.6));
    // cây quanh sân
    if (!W) for (let i = 0; i < 34; i++) { const a = i / 34 * TAU, x = 20 + Math.cos(a) * 160 + rnd(-6, 6), z = 10 + Math.sin(a) * 75 + rnd(-6, 6); b.add(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 5), '#7a5232', x, 1.1, z); b.add(new THREE.IcosahedronGeometry(1.9, 0), pick(['#4f9a45', '#5aa84f', '#3f8a3e']), x, 3.4, z); }
    const m = b.mesh(); scene.add(m);
    // mặt nước hồ bơi
    const water = new THREE.Mesh(new THREE.PlaneGeometry(POOL, 10).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: '#3fb6e0', transparent: true, opacity: 0.86 }));
    water.position.set(px + POOL / 2, 0.22, pz); scene.add(water); A.water = water;
    crowds.push(crowd(scene, { x: rx + FINISH / 2, z: rz - 5.6, len: 89, rows: 4 }), crowd(scene, { x: px + POOL / 2, z: pz - 7.6, len: 34, rows: 4 }), crowd(scene, { x: tx, z: tz - 4.5, len: 21, rows: 3 }), crowd(scene, { x: dx + 1.7, z: dz - 7, len: 13, rows: 3 }));
  }

  // ---------- Học sinh: đội Đỏ (bạn) + 3 đội bạn ----------
  // R[đội][k]: wrapper (vị trí, hướng) chứa model; người chơi = R[0][0]
  const R = [[], [], [], []], all = [];
  const mk = async (team, k, kind) => {
    const h = await kid(kind, sportLook(team), 1.25);
    const w = new THREE.Group(); w.add(h.model); scene.add(w); w.visible = false;
    const r = { h, w, team, k, x: 0, z: 0, v: 0, y: 0, ts: 1 }; R[team][k] = r; all.push(r); return r;
  };
  const kinds = ['student-male-a', 'student-female-b', 'student-male-c', 'student-female-d', 'student-male-e', 'student-female-f', 'student-male-b', 'student-female-a', 'student-male-d', 'student-female-c', 'student-male-f', 'student-female-e'];
  const loading = Promise.all([mk(0, 0, ctx.heroKind), ...[0, 1, 2, 3].flatMap(tm => [0, 1, 2, 3, 4].filter(k => !(tm === 0 && k === 0) && (k < 4 || tm < 2)).map(k => mk(tm, k, kinds[(tm * 5 + k) % 12])))]);
  const me = () => R[0][0];
  // gậy tiếp sức
  const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 6), new THREE.MeshToonMaterial({ color: '#f2c14e' })); baton.castShadow = true; scene.add(baton); baton.visible = false;
  // quả cầu (đá cầu): đế đỏ + lông vũ
  const shuttle = new THREE.Group(); { const b = batch(); b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 8), '#d2453a', 0, 0.025, 0); b.add(new THREE.ConeGeometry(0.11, 0.24, 6, 1, true).rotateX(Math.PI), '#ffffff', 0, 0.17, 0); b.add(new THREE.ConeGeometry(0.06, 0.12, 5).rotateX(Math.PI), '#3fa36b', 0, 0.2, 0); shuttle.add(b.mesh()); } scene.add(shuttle); shuttle.visible = false;
  const footRing = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 34).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthWrite: false })); scene.add(footRing); footRing.visible = false;
  const footTarget = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.27, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f2c14e', transparent: true, opacity: 0.9, depthWrite: false })); scene.add(footTarget); footTarget.visible = false;
  // dây kéo co + cờ giữa
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 14, 6).rotateZ(Math.PI / 2), new THREE.MeshToonMaterial({ color: '#d9b77a' })); rope.castShadow = true; scene.add(rope); rope.visible = false;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5).translate(0, -0.25, 0), new THREE.MeshToonMaterial({ color: '#e8453c', side: THREE.DoubleSide })); scene.add(flag); flag.visible = false;
  const label = textSprite('', { size: 0.62 }); scene.add(label); label.visible = false;
  const puffs = Array.from({ length: 13 }, () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: '#f0d9a0', transparent: true })); m.visible = false; m.userData.v = new THREE.Vector3(); scene.add(m); return m; });
  const puff = (x, y, z, col = '#f0d9a0', n = 8, sp = 2) => { for (let i = 0; i < n; i++) { const m = puffs[(puff.i = (puff.i || 0) + 1) % puffs.length]; m.visible = true; m.material.color.set(col); m.material.opacity = 1; m.position.set(x, y, z); m.userData.v.set(rnd(-sp, sp), rnd(1, 3), rnd(-sp, sp)); m.userData.t = 0; } };

  // vị trí + animation + hướng của 1 học sinh
  const place = (r, x, z, ry, y = 0) => { r.x = x; r.z = z; r.w.position.set(x, y, z); r.w.rotation.y = ry; r.w.visible = true; };
  const loco = (r, v) => { const ts = clamp(v / 1.3, 0.6, 3.3); if (v > 2.2) play(r.h, 'run', 0.2, ts); else if (v > 0.25) play(r.h, 'walk', 0.25, clamp(v / 0.7, 0.5, 2.6)); else play(r.h, 'idle', 0.3); };
  const hideAll = () => { for (const r of all) { r.w.visible = false; r.h.model.rotation.set(0, 0, 0); r.h.model.position.set(0, 0, 0); } for (const o of [baton, shuttle, footRing, footTarget, rope, flag, label]) o.visible = false; };
  const handOf = r => r.h.model.getObjectByName('handr');

  // ---------- Bảng chọn môn ----------
  const best = k => store.get('best.oly.' + k);
  const fmt = (k, v) => v == null ? '—' : k === 'tug' ? (v ? 'Thắng ' + v + ' lần' : '—') : (k === 'dacau' ? v + ' quả' : v.toFixed(k === 'longjump' ? 2 : 1) + ' ' + EVENTS[k].unit);
  function menu() {
    ev = null; evKey = null; H.clearActions(); H.tip(''); H.score(''); H.title('🏅 Thế vận hội Rubik'); hideAll();
    H.panel({ title: '🏅 Thế vận hội Rubik', html: '<p>Chọn môn thi đấu. Khán đài đang chờ cổ vũ bạn!</p>', buttons: [
      ...Object.entries(EVENTS).map(([k, e]) => ({ label: `${e.i} ${e.n}`, sub: 'Kỷ lục: ' + fmt(k, best(k)), fn: () => go(k) })),
      { label: '🚪 Về đảo', fn: quit }] });
  }
  function go(k) {
    H.closePanel(); hideAll(); evKey = k; const E = EVENTS[k]; H.title(`${E.i} ${E.n}`); t = 0;
    ev = EV[k](); H.tip(E.how);
  }
  function finish(k, value, medal, text) {
    const E = EVENTS[k], rec = k === 'tug' ? null : store.best('oly.' + k, value, !!E.lower);
    if (k === 'tug' && medal === 1) store.set('best.oly.tug', (best('tug') || 0) + 1);
    if (medal) { S.win(); S.cheer(2.6); for (const c of crowds) c.excite(1); } else S.bad();
    H.clearActions();
    setTimeout(() => H.panel({ title: medal ? MEDAL[medal] : 'Cố gắng lần sau nhé!', color: ['#7a8a7a', '#f2c14e', '#b8c4cc', '#c8834a'][medal], html: `<p style="font:900 20px system-ui">${text}</p>${rec ? '<p style="color:#2f7a4a"><b>Kỷ lục mới của bạn! 🎉</b></p>' : ''}<p style="background:#fff1d6;border-radius:12px;padding:8px 10px;text-align:left">💡 ${E.fact}</p>`,
      buttons: [{ label: '🔁 Thi lại', cls: 'go', fn: () => go(k) }, { label: '🏅 Môn khác', fn: menu }] }), 1300);
  }
  // đếm ngược 3-2-1 rồi gọi fn
  const countdown = fn => { let n = 3; const tick = () => { if (!ev) return; if (n > 0) { H.msg(String(n), 700); S.beep(false); n--; setTimeout(tick, 700); } else { H.msg('Bắt đầu!', 800); S.beep(true); S.whistle(); fn(); } }; tick(); };
  // tốc độ chạy theo nhịp chạm (taps/giây, làm mượt)
  const rate = { v: 0 }; const tapRate = (n, dt) => { rate.v = damp(rate.v, n / Math.max(dt, 1 / 120), 2.6, dt); return rate.v; };

  // ================= CÁC MÔN =================
  const EV = {};
  // ---------- Chạy tiếp sức ----------
  EV.relay = () => {
    const [ox, oz] = V.relay, laneZ = i => oz + (i - 1.5) * 1.6, teams = [0, 1, 2, 3].map(tm => ({ tm, leg: 0, done: false, time: 0, wait: 0, skill: tm ? rnd(6.2, 7.2) : 0 }));
    for (const tm of [0, 1, 2, 3]) for (let k = 0; k < 4; k++) { const r = R[tm][k]; r.v = 0; r.run = k === 0; r.passed = false; place(r, k ? ox + k * LEG - 5 : ox, laneZ(tm), Math.PI / 2); play(r.h, 'idle', 0); }
    let go = false, time = 0, place1 = 0, passBtn = null, active = R[0][0];
    rate.v = 0; baton.visible = true;
    passBtn = H.action('🤝 Trao gậy', () => tryPass()); passBtn.style.visibility = 'hidden';
    countdown(() => { go = true; S.cheer(1.2); });
    function pass(team, bonus) {
      const a = R[team.tm][team.leg], b = R[team.tm][team.leg + 1]; a.run = false; a.passed = true; b.run = true; b.v = Math.max(b.v, a.v * 0.92) + bonus; team.leg++;
      if (team.tm === 0) { active = b; S.ok(); }
    }
    function tryPass() {
      const tm = teams[0]; if (!go || tm.done || tm.leg >= 3) return;
      const a = R[0][tm.leg], b = R[0][tm.leg + 1], gap = b.x - a.x, zs = (tm.leg + 1) * LEG - 5;
      if (a.x < zs - 0.5) { H.msg('Chưa tới vùng trao gậy!', 900); S.bad(); return; }
      if (Math.abs(gap) > 2.3) { H.msg('Xa quá! Đuổi sát bạn đã', 900); S.bad(); return; }
      const perfect = Math.abs(gap) < 1.15; pass(tm, perfect ? 0.9 : 0.2); H.msg(perfect ? 'Trao gậy hoàn hảo! ⚡' : 'Trao gậy!', 900);
    }
    return {
      update(dt, taps) {
        if (go) time += dt;
        const myRate = tapRate(go ? taps : 0, dt);
        for (const team of teams) {
          if (team.done) continue;
          const a = R[team.tm][team.leg], b = team.leg < 3 ? R[team.tm][team.leg + 1] : null;
          // người đang cầm gậy
          if (go) { const target = team.tm === 0 ? clamp(myRate * 1.08, 0, 8.6) : team.skill + Math.sin(time * 1.7 + team.tm) * 0.3; a.v = damp(a.v, target, team.tm === 0 ? 2.4 : 1.6, dt); }
          a.x += a.v * dt;
          if (b) {
            const zs = (team.leg + 1) * LEG - 5, ze = zs + 10;
            if (!b.run && a.x > b.x - 7) b.run = true;   // bạn nhận gậy chạy đà trước
            if (b.run) { b.v = damp(b.v, Math.min(team.tm === 0 ? 6.4 : team.skill * 0.95, a.v + 0.6), 1.4, dt); if (b.x >= ze - 0.3) { b.x = ze - 0.3; b.v = 0; } b.x += b.v * dt; }
            if (team.tm !== 0 && b.x - a.x < 1.1 && a.x > zs) pass(team, 0.3);
            else if (a.x > b.x + 0.2) { pass(team, -1.2); if (team.tm === 0) { H.msg('Trao gậy chậm! 🐢', 1000); S.bad(); } }   // đuổi kịp mà chưa trao → mất đà
          } else if (a.x >= FINISH) { team.done = true; team.time = time; team.place = ++place1; if (team.tm === 0) end(team); }
        }
        // người đã trao gậy chạy chậm dần
        for (const tm of [0, 1, 2, 3]) for (let k = 0; k < 4; k++) { const r = R[tm][k]; if (r.passed || (teams[tm].done && k === 3)) { r.v = damp(r.v, 0, 1.2, dt); r.x += r.v * dt; } loco(r, r.v); r.w.position.x = r.x; }
        // gậy trong tay người đang chạy của đội mình
        const hd = handOf(active); if (hd) { hd.getWorldPosition(baton.position); baton.rotation.set(0, 0, Math.PI / 2 + Math.sin(time * 9) * 0.3); }
        const tm = teams[0]; passBtn.style.visibility = !tm.done && tm.leg < 3 && go && R[0][tm.leg + 1].x - R[0][tm.leg].x < 6 ? 'visible' : 'hidden';
        H.score(`⏱ ${time.toFixed(1)} s · Chặng ${Math.min(4, tm.leg + 1)}/4`);
        for (const c of crowds) c.excite(0.25 + active.v / 12);
        T.set(active.x + 2.5, 0.9, oz); return [active.x - 2, 3.4, oz + 10.5];
      },
    };
    function end(team) { const p = team.place, medal = p <= 3 ? p : 0; H.msg(`Về đích hạng ${p}!`, 1500); finish('relay', +team.time.toFixed(2), medal, `Hạng ${p} · ${team.time.toFixed(2)} giây`); }
  };

  // ---------- Nhảy xa ----------
  EV.longjump = () => {
    const [ox, oz] = V.longjump, r = me(); let st = 'ready', x = 0, v = 0, y = 0, vy = 0, vx = 0, ang = 0, tries = 0, bestD = 0, landX = 0, waitT = 0;
    const angBar = H.bar('calc(max(10px,env(safe-area-inset-top)) + 52px)', '#f2c14e'); angBar.show(false);
    angBar.el.style.background = 'linear-gradient(90deg,#0006 0 40%,#3fa36b99 40% 60%,#0006 60%)';
    const reset = () => { st = 'ready'; x = 0; v = 0; y = 0; ang = 0; rate.v = 0; place(r, ox, oz, Math.PI / 2); r.h.model.rotation.set(0, 0, 0); play(r.h, 'idle', 0.1); angBar.show(false); H.score(`Lượt ${tries + 1}/3 · Tốt nhất ${bestD.toFixed(2)} m`); H.tip(EVENTS.longjump.how); countdown(() => st = 'run'); };
    reset(); label.visible = false;
    return {
      update(dt, taps, held, released) {
        const board = ox + LEG;
        if (st === 'run' || st === 'aim') {
          const tr = tapRate(st === 'run' ? taps : 0, dt); v = damp(v, st === 'run' ? clamp(tr * 1.1, 0, 9) : v * 0.97, 2.2, dt); x += v * dt; place(r, x, oz, Math.PI / 2); loco(r, v);
          if (st === 'run' && held && x > board - 9 && inp.holdT > 0.12) { st = 'aim'; ang = 0; angBar.show(true); H.tip('Thả tay để bật! Góc đẹp: vùng xanh (25°–35°)'); }
          if (st === 'aim') { ang = Math.min(60, ang + dt * 55); angBar.set(ang / 75); if (!held) takeoff(); }
          if (x > board + 0.8 && st !== 'fly') foul('Giẫm vạch! ❌');
        } else if (st === 'fly') {
          vy -= 9.8 * dt; x += vx * dt; y += vy * dt; r.w.position.set(x, Math.max(0, y), oz); r.h.model.rotation.x = clamp(-vy * 0.06, -0.3, 0.4);
          if (y <= 0 && vy < 0) { st = 'land'; waitT = 0; landX = x - 0.15; y = 0; const d = Math.max(0, landX - board); puff(x, 0.1, oz, '#f0d9a0', 10, 1.6); S.splash(); play(r.h, 'Jump_Land', 0.05, 1, true) || play(r.h, 'floor', 0.1);
            tries++; bestD = Math.max(bestD, d); label.userData.set(d.toFixed(2) + ' m'); label.position.set(x, 1.9, oz); label.visible = true; H.msg(`${d.toFixed(2)} m!`, 1300); for (const c of crowds) c.excite(d / 5.5); S.cheer(1.2);
            H.tip(`Góc bật ${ang.toFixed(0)}° · tốc độ ${vx.toFixed(1)} m/s ngang, ${(vyT).toFixed(1)} m/s lên → bay ${d.toFixed(2)} m`); }
        } else if (st === 'land' || st === 'foul') { waitT += dt; r.w.position.y = 0; if (waitT > 2.6) { if (tries >= 3) done(); else reset(); waitT = -99; } }
        T.set(x + 4, 0.9, oz); return [x + 1, 3, oz + 9.5];
      },
    };
    let vyT = 0;
    function takeoff() { const board = ox + LEG; angBar.show(false); if (x > board + 0.1) return foul('Giẫm vạch! ❌'); const th = ang * Math.PI / 180; vx = v * Math.cos(th); vyT = Math.min(v * Math.sin(th), 4.3) + 0.3; vy = vyT; st = 'fly'; play(r.h, 'jump', 0.1); S.kick(); }
    function foul(m) { st = 'foul'; waitT = 0; tries++; H.msg(m, 1400); S.bad(); angBar.show(false); play(r.h, 'no', 0.2) || play(r.h, 'idle'); r.h.model.rotation.set(0, 0, 0); }
    function done() { const d = bestD, medal = d >= 5.4 ? 1 : d >= 4.8 ? 2 : d >= 4 ? 3 : 0; finish('longjump', +d.toFixed(2), medal, `Thành tích tốt nhất: ${d.toFixed(2)} m`); }
  };

  // ---------- Bơi 25 m ----------
  EV.swim = () => {
    const [ox, oz] = V.swim, laneZ = i => oz + (i - 1.5) * 2.4, sw = [0, 1, 2, 3].map(tm => ({ r: R[tm][tm ? 1 : 0], tm, x: ox, v: 0, done: false, skill: tm ? rnd(2.55, 3.1) : 0, br: 1, strokes: 0, breathT: 0, t: 0 }));
    let go = false, time = 0, pl1 = 0, breath = 1, sinceBreath = 0, breathing = 0, dive = 0;
    const bar = H.bar('calc(max(10px,env(safe-area-inset-top)) + 52px)', '#7fd1ff');
    for (const s of sw) { place(s.r, ox - 0.6, laneZ(s.tm), Math.PI / 2, 0.95); play(s.r.h, 'idle', 0); }
    H.action('😮‍💨 Thở', () => { if (!go || breathing > 0) return; breathing = 0.42; breath = 1; if (sinceBreath === 3) { H.msg('Nhịp 3 tay: chuẩn! 👍', 800); sw[0].v += 0.25; S.ok(); } sinceBreath = 0; });
    countdown(() => { go = true; dive = 0.01; S.splash(); });
    return {
      update(dt, taps) {
        if (go) time += dt;
        for (const s of sw) {
          if (!go) continue;
          if (s.dive === undefined) s.dive = 0;
          if (s.dive < 0.6) { s.dive += dt; const k = s.dive / 0.6; s.x = ox - 0.6 + k * 3; s.r.w.position.set(s.x, 0.95 * (1 - k) + 0.12 + Math.sin(k * Math.PI) * 0.5, laneZ(s.tm)); s.r.h.model.rotation.x = k * Math.PI / 2; play(s.r.h, 'jump', 0.1); if (s.dive >= 0.6) { puff(s.x, 0.3, laneZ(s.tm), '#ffffff', 6, 1.4); s.v = 2.2; } continue; }
          if (s.done) { s.v = damp(s.v, 0, 2, dt); }
          else if (s.tm === 0) {
            if (taps && breathing <= 0) { s.v = Math.min(breath > 0 ? 3.6 : 1.1, s.v + 0.55 * taps); breath = Math.max(0, breath - 0.1 * taps); sinceBreath += taps; s.strokes += taps; puff(s.x + 0.6, 0.3, laneZ(0), '#ffffff', 2, 0.6); S.tone(300 + Math.random() * 80, 0.08, 'sine', 0.05); }
            breath = Math.max(0, breath - dt * 0.03); breathing -= dt; s.v = damp(s.v, breathing > 0 ? 0.8 : 0, 0.55, dt);
            if (breath <= 0 && Math.random() < dt * 2) H.msg('Hết hơi! Bấm 😮‍💨', 700);
          } else { s.t += dt; s.v = damp(s.v, (s.t % 2.4 < 0.3) ? s.skill * 0.6 : s.skill, 2, dt); }
          s.x += s.v * dt; const z = laneZ(s.tm);
          if (!s.done && s.x >= ox + POOL - 0.8) { s.done = true; s.time = time; s.place = ++pl1; if (s.tm === 0) end(s); }
          s.r.w.position.set(Math.min(s.x, ox + POOL - 0.8), 0.12 + Math.sin(time * 6 + s.tm) * 0.03, z);
          s.r.h.model.rotation.set(Math.PI / 2, 0, s.tm === 0 && breathing > 0 ? 0.9 : Math.sin(time * 3 + s.tm) * 0.25);
          play(s.r.h, 'run', 0.2, clamp(s.v * 0.9, 0.3, 3)); if (Math.random() < dt * s.v * 2.5) puff(s.x + 0.4, 0.3, z, '#ffffff', 1, 0.5);
        }
        bar.set(breath); bar.color(breath < 0.25 ? '#d2553f' : '#7fd1ff');
        H.score(`⏱ ${time.toFixed(1)} s · ${Math.max(0, sw[0].x - ox).toFixed(0)}/${POOL} m · 💨`);
        for (const c of crowds) c.excite(0.3 + sw[0].v / 6);
        T.set(sw[0].x + 3, 0.2, oz); return [sw[0].x - 1, 6.2, oz + 10];
      },
    };
    function end(s) { const p = s.place; H.msg(`Chạm thành bể hạng ${p}!`, 1500); finish('swim', +s.time.toFixed(2), p <= 3 ? p : 0, `Hạng ${p} · ${s.time.toFixed(2)} giây`); }
  };

  // ---------- Đá cầu ----------
  EV.dacau = () => {
    const [ox, oz] = V.dacau, r = me(), mate = R[1][0], F = new THREE.Vector3(ox + 0.42, 0.35, oz), M = new THREE.Vector3(ox + 3.4 - 0.42, 0.35, oz);
    place(r, ox, oz, Math.PI / 2); place(mate, ox + 3.4, oz, -Math.PI / 2); play(r.h, 'idle', 0); play(mate.h, 'idle', 0);
    shuttle.visible = true; footRing.visible = footTarget.visible = true; footTarget.position.set(F.x, 0.07, F.z);
    let score = 0, lives = 3, combo = 0, fl = null, wait = 1.2, kickT = 0, mateKick = 0, hearts = () => '❤️'.repeat(lives) + '🤍'.repeat(3 - lives), dur = 1.5;
    const P0 = new THREE.Vector3(), P1 = new THREE.Vector3();
    const launch = (from, to, T, h) => { fl = { a: from.clone(), b: to.clone(), T, h, s: 0, toMe: to === F }; };
    const missed = m => { lives--; combo = 0; S.bad(); H.msg(m, 1000); fl = null; shuttle.position.y = 0.05; wait = 1.4; if (lives <= 0) { footRing.visible = false; const medal = score >= 21 ? 1 : score >= 13 ? 2 : score >= 8 ? 3 : 0; finish('dacau', score, medal, `Đá được ${score} quả cầu`); } };
    const legKick = (who, k) => { const b = who.h.model.getObjectByName('upperlegr'); if (!b || k <= 0) return; b.rotateX(-Math.sin(Math.min(1, k) * Math.PI) * 1.1); };
    H.score(`🪶 0 · ${hearts()}`);
    return {
      update(dt, taps) {
        dur = Math.max(0.95, 1.5 - score * 0.02);
        if (!fl && lives > 0) { wait -= dt; shuttle.position.set(M.x, 1.0, M.z); if (wait <= 0) { mateKick = 1; S.kick(); launch(M, F, dur, 2.6); } }
        if (fl) {
          fl.s += dt / fl.T; const s = Math.min(fl.s, 1.25);
          shuttle.position.lerpVectors(fl.a, fl.b, s); shuttle.position.y += 4 * fl.h * s * (1 - s); shuttle.rotation.z = (s - 0.5) * (fl.toMe ? 1 : -1) * 1.2;
          if (fl.toMe) {
            const left = fl.T * (1 - fl.s);   // giây còn lại tới chân
            const k = clamp(left / fl.T, 0, 1); footRing.scale.setScalar(0.26 + k * 1.6); footRing.position.set(F.x, 0.06, F.z); const ok = left < 0.24 && left > -0.12; footRing.material.color.set(ok ? '#3fa36b' : '#ffffff');
            if (taps) {
              if (left > 0.24) missed('Sớm quá! 🙈');
              else { const perfect = Math.abs(left - 0.05) < 0.08; score++; combo++; kickT = 0.001; S.kick(); H.msg(perfect ? 'Tuyệt! ✨' : 'Tốt!', 600); for (const c of crowds) c.excite(0.4 + combo * 0.08);
                if (combo % 5 === 0) { H.msg(`${combo} quả liên tiếp! 🎉`, 1100); S.cheer(1); }
                if (combo % 3 === 2) launch(F, F, dur * 0.8, 1.6); else launch(F, M, dur, 2.6);   // tâng cầu 1 lần rồi chuyền
                H.score(`🪶 ${score} · ${hearts()}`); }
            } else if (left < -0.12) missed('Trượt mất rồi!');
          } else if (fl.s >= 1) { mateKick = 1; S.kick(); launch(M, F, dur, 2.6); }
        }
        if (kickT > 0) kickT += dt * 4; if (kickT > 1) kickT = 0; if (mateKick > 0) mateKick -= dt * 4;
        r.h.anim.update(0); legKick(r, kickT); legKick(mate, 1 - mateKick);
        T.set(ox + 1.7, 1.1, oz); return [ox - 3.2, 2.6, oz + 4.6];
      },
      postAnim() { legKick(r, kickT); legKick(mate, mateKick > 0 ? 1 - mateKick : 0); },
    };
  };

  // ---------- Kéo co ----------
  EV.tug = () => {
    const [ox, oz] = V.tug, red = [0, 1, 2, 3, 4].map(k => R[0][k]), blue = [0, 1, 2, 3, 4].map(k => R[1][k]);
    let rp = 0, rv = 0, go = false, time = 0, beat = 0, q = null, qT = 4, push = 0, ended = false, blueF = 1.15, surge = 0;
    rope.visible = flag.visible = true;
    const lay = () => {
      red.forEach((r, k) => { place(r, ox + rp - 1.3 - k * 1.05, oz + (k % 2 ? 0.25 : -0.25), Math.PI / 2); r.h.model.rotation.x = -0.32 - push * 0.2; });
      blue.forEach((r, k) => { place(r, ox + rp + 1.3 + k * 1.05, oz + (k % 2 ? -0.25 : 0.25), -Math.PI / 2); r.h.model.rotation.x = -0.32 - surge * 0.2; });
      rope.position.set(ox + rp, 0.82, oz); flag.position.set(ox + rp, 0.82, oz); flag.rotation.y = Math.sin(time * 5) * 0.3;
    };
    lay(); red.concat(blue).forEach(r => play(r.h, 'idle', 0));
    const ask = () => { q = mathQ(1 + Math.floor(time / 15)); H.clearActions(); H.tip(`⚡ Tính nhanh: <b style="font-size:20px">${q.q} = ?</b>`); for (const c of q.choices) H.action(String(c), () => answer(c)); };
    const answer = c => { if (!q) return; if (c === q.a) { push = 1; H.msg('ĐÚNG! DÔ… TA!! 💪', 900); S.ok(); S.cheer(1); for (const cr of crowds) cr.excite(1); } else { surge = 0.7; H.msg(`Chưa đúng: ${q.q} = ${q.a}`, 1300); S.bad(); } q = null; qT = rnd(5, 8); H.clearActions(); H.tip(EVENTS.tug.how); };
    countdown(() => { go = true; });
    return {
      update(dt, taps) {
        if (!go || ended) { lay(); T.set(ox, 0.9, oz); return [ox, 3.6, oz + 10.5]; }
        time += dt; beat += dt; const B = 0.85, ph = (beat % B) / B;
        if (Math.floor((beat - dt) / B) !== Math.floor(beat / B)) { S.tone(ph < 0.5 ? 196 : 262, 0.12, 'square', 0.06); H.msg(Math.floor(beat / B) % 2 ? 'TA!' : 'Dô…', 400); }
        // chạm đúng nhịp mạnh hơn
        const onBeat = Math.min(ph, 1 - ph) < 0.18;
        const f = tapRate(taps, dt) * 0.16 * (onBeat ? 1.25 : 1), redF = 0.5 + f + push * 2.2;
        if (taps) for (const r of red) if (Math.random() < 0.5) r.h.model.rotation.x -= 0.05;
        if (Math.random() < dt / 3) surge = rnd(0.4, 1); surge = Math.max(0, surge - dt * 0.8); push = Math.max(0, push - dt * 1.4);
        blueF = 1.15 + Math.sin(time * 0.9) * 0.15 + surge * 1.1 + time * 0.006;
        rv = damp(rv, (blueF - redF) * 0.7, 3, dt); rp = clamp(rp + rv * dt, -3, 3);
        red.concat(blue).forEach((r, i) => { const toward = (i < 5 ? -1 : 1) * Math.sign(rv); play(r.h, Math.abs(rv) > 0.12 ? 'walk' : 'idle', 0.25, toward < 0 ? -1 : 1); });
        lay();
        qT -= dt; if (!q && qT <= 0) ask();
        H.score(`⏱ ${Math.max(0, 45 - time).toFixed(0)} s`);
        for (const c of crowds) c.excite(0.3 + Math.abs(rv) * 0.6);
        if (rp <= -2.6 || rp >= 2.6 || time >= 45) { ended = true; const win = rp < 0; H.clearActions(); H.tip(''); H.msg(win ? 'ĐỘI ĐỎ THẮNG! 🎉' : 'Đội Xanh thắng…', 1600); red.forEach(r => play(r.h, win ? 'cheer' : 'idle', 0.3)); blue.forEach(r => play(r.h, win ? 'idle' : 'cheer', 0.3)); red.concat(blue).forEach(r => r.h.model.rotation.x = 0); finish('tug', win ? 1 : 0, win ? 1 : 0, win ? 'Đội Đỏ kéo thắng!' : 'Đội Xanh kéo khỏe hơn lần này'); }
        T.set(ox + rp * 0.5, 0.9, oz); return [ox + rp * 0.5, 3.6, oz + 10.5];
      },
    };
  };

  // ---------- Vòng lặp ----------
  A.begin(); H.panel({ title: '🏅 Thế vận hội Rubik', html: '<p>Đang chuẩn bị sân vận động…</p>' });
  let ready = false; loading.then(() => { ready = true; menu(); }).catch(e => { console.error(e); menu(); });
  function update(dt) {
    clockT += dt; t += dt; inp.tick(dt);
    const taps = H.open ? (inp.take(), 0) : inp.take(), held = inp.held && !H.open; inp.takeSwipe();
    let cp = null;
    if (ready && ev) cp = ev.update(dt, taps, held);
    for (const r of all) if (r.w.visible) r.h.anim.update(dt);
    if (ev && ev.postAnim) ev.postAnim();
    for (const c of crowds) c.update(dt);
    for (const m of puffs) if (m.visible) { const u = m.userData; u.t += dt; u.v.y -= 9 * dt; m.position.addScaledVector(u.v, dt); m.material.opacity = 1 - u.t / 0.9; if (u.t > 0.9 || m.position.y < 0) m.visible = false; }
    // camera: đi theo môn đang chơi (mượt), menu: lượn quanh sân
    if (!cp) { const a = clockT * 0.08; cp = [20 + Math.cos(a) * 55, 21, 10 + Math.sin(a) * 40]; T.set(20, 0, 5); }
    camP.x = damp(camP.x, cp[0], 4, dt); camP.y = damp(camP.y, cp[1], 4, dt); camP.z = damp(camP.z, cp[2], 4, dt); camL.x = damp(camL.x, T.x, 5, dt); camL.y = damp(camL.y, T.y, 5, dt); camL.z = damp(camL.z, T.z, 5, dt);
    cam.position.copy(camP); cam.lookAt(camL); A.follow(camL.x, camL.z);
  }
  const self = {
    update,
    dispose() { ev = null; A.dispose(); H.dispose(); inp.dispose(); unlock(); },
    _dbg: { go, menu, get ev() { return evKey; }, R },
  };
  return self;
}

export const olympics = {
  olympics: { name: '🏅 Thế vận hội Rubik', radius: 34, start: (ctx, o = {}) => { const g = start(ctx, o); if (o.event) setTimeout(() => g._dbg.go(o.event), 50); return g; } },
};
