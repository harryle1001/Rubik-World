// telescope.js — ĐÀI THIÊN VĂN 3D (khoá 'telescope', cửa "Kính viễn vọng"): chơi ngay trong thế giới qua khung mg/host.js.
// Sân ngắm sao tròn có kính viễn vọng + thầy Thiên Văn. Bấm "👁 Nhìn qua kính" → bầu trời đêm (vòm sao bán kính 55 m) quanh mắt kính,
// kéo để xoay kính, chạm vào ngôi sao/hành tinh đúng đề bài → nối hình chòm sao + kể kiến thức. 5 lượt / ván, nhanh được nhiều điểm.
// Kiến thức: Bắc Đẩu chỉ Sao Bắc Cực (độ cao = vĩ độ nơi em đứng), Thợ Săn, Thiên Hậu, Bọ Cạp, Nam Thập Tự, Sao Kim, Sao Mộc, Sao Hỏa.
// Tỷ lệ vàng: sân bán kính 8 m, vòm sao 55 m, 377 sao nền, 5 lượt (Fibonacci); ống kính dài φ m; vạch ngắm tròn kiểu thị kính.
import * as THREE from 'three';
import { PHI } from '../../layout.js';

const D = Math.PI / 180, SKY = 55, EYE = [0, 2.2, 0], PAD = 0.62;
// Mục tiêu: az (độ, 0 = Bắc, 90 = Đông), el (độ cao), sao [dx, dy] (độ, lệch so với tâm), nét nối, màu
const TARGETS = [
  { id: 'dipper', n: 'chòm Bắc Đẩu', az: 8, el: 38, s: [[-15, 0], [-9, 1], [-4, 0], [0, -1], [1, -7], [7, -8], [8, -1]], l: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 3], hint: 'Phía <b>Bắc</b>, 7 sao hình <b>cái gáo</b>.',
    fact: 'Bắc Đẩu có 7 sao hình cái gáo. Kéo dài 2 sao ở miệng gáo khoảng 5 lần sẽ gặp <b>Sao Bắc Cực</b> — cách tìm hướng Bắc của người đi biển xưa.' },
  { id: 'polaris', n: 'Sao Bắc Cực', az: 0, el: 16, s: [[0, 0]], l: [], big: 1.4, hint: 'Phía <b>Bắc</b>, thấp, đứng một mình — dưới chòm Bắc Đẩu.',
    fact: 'Sao Bắc Cực gần như đứng yên trên bầu trời. <b>Độ cao của nó bằng vĩ độ nơi em đứng</b>: ở Huế khoảng 16°, ở Hà Nội khoảng 21°.' },
  { id: 'orion', n: 'chòm Thợ Săn (Lạp Hộ)', az: 180, el: 50, s: [[-5, 8], [5, 7], [-2, 0], [0, 0.5], [2, 1], [-4, -8], [5, -7]], l: [0, 1, 0, 2, 1, 4, 2, 3, 3, 4, 2, 5, 4, 6], c: ['#ff9a6b', '#cfe0ff', '#fff', '#fff', '#fff', '#cfe0ff', '#bcd4ff'], hint: 'Phía <b>Nam</b>, cao: tìm <b>3 sao thẳng hàng</b> làm thắt lưng.',
    fact: 'Thợ Săn có 3 sao thẳng hàng làm thắt lưng. Sao đỏ <b>Betelgeuse</b> (vai trái) là sao siêu khổng lồ, to gấp khoảng 700 lần Mặt Trời!' },
  { id: 'cass', n: 'chòm Thiên Hậu', az: 325, el: 30, s: [[-10, 0], [-5, -4], [0, 1], [5, -3], [10, 2]], l: [0, 1, 1, 2, 2, 3, 3, 4], hint: 'Phía <b>Tây Bắc</b>, 5 sao xếp hình chữ <b>W</b>.',
    fact: 'Thiên Hậu có hình chữ W, nằm đối diện Bắc Đẩu qua Sao Bắc Cực: khi Bắc Đẩu xuống thấp thì Thiên Hậu lên cao.' },
  { id: 'scorp', n: 'chòm Bọ Cạp (Thiên Yết)', az: 140, el: 22, s: [[0, 0], [5, 6], [6, 3], [7, 0], [-2, -3], [-4, -7], [-5, -11], [-3, -14], [0, -15], [2, -13]], l: [0, 1, 0, 2, 0, 3, 0, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9], c: ['#ff5a3a'], hint: 'Phía <b>Đông Nam</b>, thấp: một sao <b>đỏ rực</b> và đuôi cong.',
    fact: '<b>Sao Tâm (Antares)</b> đỏ rực là “trái tim” con bọ cạp. Mùa hè ở Việt Nam, chòm này hiện rõ trên trời phía Nam.' },
  { id: 'crux', n: 'chòm Nam Thập Tự', az: 195, el: 10, s: [[0, 4], [0, -4], [-3, 0], [3, 1]], l: [0, 1, 2, 3], hint: 'Phía <b>Nam</b>, rất thấp sát chân trời: 4 sao hình <b>chữ thập</b>.',
    fact: 'Nam Thập Tự là chòm sao <b>nhỏ nhất</b> trong 88 chòm sao. Trục dài của nó chỉ về hướng Nam.' },
  { id: 'venus', n: 'Sao Kim', az: 265, el: 14, s: [[0, 0]], l: [], big: 2.2, c: ['#fff6c8'], hint: 'Phía <b>Tây</b>, thấp, <b>sáng nhất</b> bầu trời (sau Mặt Trăng).',
    fact: 'Sao Kim không tự phát sáng: nó phản chiếu ánh Mặt Trời. Người xưa gọi là <b>Sao Hôm</b> (chiều tối) và <b>Sao Mai</b> (sáng sớm).' },
  { id: 'jupiter', n: 'Sao Mộc', az: 110, el: 44, s: [[0, 0]], l: [], big: 1.8, c: ['#ffe2b0'], hint: 'Phía <b>Đông</b>, khá cao, sáng vàng nhạt, <b>không nhấp nháy</b>.',
    fact: 'Sao Mộc là hành tinh <b>lớn nhất</b> Hệ Mặt Trời, có thể chứa hơn 1.300 Trái Đất. Hành tinh sáng đều, sao thì nhấp nháy.' },
  { id: 'mars', n: 'Sao Hỏa', az: 60, el: 26, s: [[0, 0]], l: [], big: 1.6, c: ['#ff7a4a'], hint: 'Phía <b>Đông Bắc</b>, chấm <b>đỏ cam</b>.',
    fact: 'Sao Hỏa màu đỏ vì đất đá có nhiều <b>gỉ sắt</b>. Nó có ngọn núi lửa cao nhất Hệ Mặt Trời: Olympus Mons, cao khoảng 22 km.' },
];
const dirOf = (az, el, v = new THREE.Vector3()) => v.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));   // cục bộ: +z = Bắc

export function startTelescope(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat, sfx = api.sfx;
  // ---------- Sân ngắm sao ----------
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(8, 8.3, 0.62, 34), M('#c9c2b4')); pad.position.y = 0.31;   // sân cao 0,618 m: nổi trên đường/bậc thềm quanh đó pad.receiveShadow = true; root.add(pad);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(5, 34).rotateX(-Math.PI / 2), M('#2c3966')); inner.position.y = 0.63; root.add(inner);
  // la bàn 8 hướng trên sân (π: chia đều vòng tròn)
  const dirs = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'];
  dirs.forEach((t, i) => { const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d'); k.fillStyle = i % 2 ? '#cfd8ff' : '#ffd36e'; k.font = 'bold 72px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(t, 64, 64);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); const a = i * Math.PI / 4; m.position.set(Math.sin(a) * 4.2, 0.65, Math.cos(a) * 4.2); m.rotation.y = a; root.add(m); });
  // kính viễn vọng: chân 3 càng + ống dài φ m (xoay theo hướng ngắm)
  const scope = new THREE.Group(); scope.position.set(0, 0.62, 0); root.add(scope);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.3, 6), M('#3b3b4a')); leg.position.set(Math.sin(a) * 0.3, 0.6, Math.cos(a) * 0.3); leg.rotation.set(Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4); scope.add(leg); }
  const head = new THREE.Group(); head.position.y = 1.25; scope.add(head);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, PHI, 12).rotateX(Math.PI / 2), M('#e8eef7')); tube.position.z = 0.35; tube.castShadow = true; head.add(tube);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.12, 12).rotateX(Math.PI / 2), M('#d9a441')); lens.position.z = 0.35 + PHI / 2; head.add(lens);

  // ---------- Bầu trời đêm (chỉ hiện khi nhìn qua kính) ----------
  const sky = new THREE.Group(); sky.position.set(...EYE); sky.visible = false; root.add(sky);
  { const g = new THREE.SphereGeometry(SKY + 3, 34, 13), col = []; const p = g.attributes.position, c = new THREE.Color(); for (let i = 0; i < p.count; i++) { const y = p.getY(i) / (SKY + 3); c.set(y < 0.05 ? '#1d2a4a' : '#060b1f').lerp(new THREE.Color('#0d1838'), Math.max(0, 0.3 - y)); col.push(c.r, c.g, c.b); } g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    sky.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, depthTest: false, transparent: true }))); }
  // chân trời: vành đồi tối để biết đâu là mặt đất
  { const g = new THREE.CylinderGeometry(SKY, SKY, 6, 55, 1, true), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { const a = Math.atan2(p.getX(i), p.getZ(i)); p.setY(i, 3 + Math.sin(a * 5) * 1.6 + Math.sin(a * 13) * 0.7); } g.translate(0, -1.6, 0); g.computeVertexNormals();
    sky.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#05070f', side: THREE.BackSide, fog: false, depthWrite: false, depthTest: false, transparent: true }))); }
  // vẽ vòm sao SAU CÙNG và không thử độ sâu → nhà cửa, cây gần đó không lọt vào khung kính (như nhìn qua thị kính thật)
  sky.children.forEach((o, i) => { o.renderOrder = 1000 + i; });
  const starMat = sz => new THREE.PointsMaterial({ size: sz, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false, depthTest: false });
  { const pos = [], col = [], c = new THREE.Color(), v = new THREE.Vector3(); for (let i = 0; i < 377; i++) { const y = Math.random() ** 0.8, a = i * 2 * Math.PI / (PHI * PHI) + Math.random(); dirOf(a, Math.asin(y), v).multiplyScalar(SKY); pos.push(v.x, v.y, v.z); c.setHSL(0.6 - Math.random() * 0.5, 0.3, 0.45 + Math.random() * 0.4); col.push(c.r, c.g, c.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const bg = new THREE.Points(g, starMat(2.2 * Math.min(2, devicePixelRatio))); bg.renderOrder = 1003; sky.add(bg); }
  // sao của các mục tiêu (sáng, to hơn) + nét nối (ẩn, hiện khi tìm thấy)
  const pick = [], v = new THREE.Vector3();
  for (const T of TARGETS) {
    const pos = [], col = [], c = new THREE.Color(); T.dirs = [];
    T.s.forEach(([dx, dy], i) => { const el = (T.el + dy) * D, az = (T.az + dx / Math.cos(T.el * D)) * D; const d = dirOf(az, el, new THREE.Vector3()); T.dirs.push(d); v.copy(d).multiplyScalar(SKY - 1); pos.push(v.x, v.y, v.z); c.set((T.c && (T.c[i] || T.c[0])) || '#ffffff'); col.push(c.r, c.g, c.b); pick.push({ T, d }); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    T.pts = new THREE.Points(g, starMat((T.big || 1) * 4.2 * Math.min(2, devicePixelRatio))); T.pts.renderOrder = 1005; sky.add(T.pts);
    if (T.l.length) { const lp = T.l.map(i => pos.slice(i * 3, i * 3 + 3)).flat(); const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); T.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#ffd36e', transparent: true, opacity: 0, fog: false, depthWrite: false, depthTest: false })); T.lines.renderOrder = 1004; sky.add(T.lines); }
    T.found = false;
  }

  // ---------- Thị kính: vòng tối quanh màn hình (CSS) ----------
  const eye = document.createElement('div'); eye.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:29;opacity:0;transition:opacity .62s;background:radial-gradient(circle at 50% 50%,transparent 0,transparent min(42vw,42vh),#000d min(50vw,50vh),#000 100%)';
  eye.innerHTML = '<div style="position:absolute;left:50%;top:50%;width:21px;height:21px;margin:-11px;border:2px solid #ffd36e88;border-radius:50%"></div>'; document.body.appendChild(eye);

  // ---------- Nhân vật ----------
  me.place(1.3, 1.3, -Math.PI * 0.75); me.pos.y = PAD; me.face(0, 0);
  let teacher = null;
  api.actor('student-male-c', { name: 'Thầy Thiên Văn', height: 1.68, look: { role: 'adult', shirt: '#3b4a7a', pants: '#2a2a3a', glasses: true } }).then(a => { if (!a) return; teacher = a; a.place(-2.2, 1.4, 0); a.pos.y = PAD; a.face(0, 0); a.say('Chào em! Đêm nay trời trong lắm.', 3000); });

  // ---------- Điều khiển kính: hướng ngắm (az, el) ----------
  let az = 0, el = 0.6, looking = false, round = 0, list = [], cur = null, score = 0, tRound = 0, t0 = 0, over = false, drag = null;
  const outside = () => { api.cam.x = 0; api.cam.y = 1.2; api.cam.z = 0; api.cam.yaw = Math.PI * 0.8; api.cam.pitch = 0.5; api.cam.dist = 13; };
  outside();
  function aimCam() {   // camera đặt tại mắt kính, nhìn theo (az, el): host đặt camera = tâm + cầu(yaw, pitch, dist) → đảo hướng
    const d = 2, dir = dirOf(az, el, v);
    api.cam.x = EYE[0] + dir.x * d; api.cam.y = EYE[1] + dir.y * d; api.cam.z = EYE[2] + dir.z * d; api.cam.yaw = az + Math.PI; api.cam.pitch = -el; api.cam.dist = d;
  }
  function look(on) {
    looking = on; sky.visible = on; eye.style.opacity = on ? 1 : 0; tube.visible = lens.visible = !on; sfx('ui');
    if (on) aimCam(); else outside();
    bar();
  }
  function newGame() {
    over = false; score = 0; round = 0; t0 = performance.now() / 1000; hud.score(0);
    for (const T of TARGETS) { T.found = false; if (T.lines) T.lines.material.opacity = 0; }
    list = TARGETS.slice().sort(() => Math.random() - 0.5).slice(0, 5); next();
  }
  function next() {
    cur = list[round]; tRound = 0;
    if (!cur) return finish();
    hud.msg(`🔭 Lượt ${round + 1}/5 — Tìm <b>${cur.n}</b><br><small>${cur.hint}</small>`, 0);
    if (teacher) teacher.say(`Tìm ${cur.n} nhé!`, 2200);
    if (!looking) look(true);
  }
  function finish() {
    over = true; const t = Math.round(performance.now() / 1000 - t0);
    if (teacher) teacher.emote('cheer'); me.emote('cheer'); look(false);
    api.end({ score, title: '🌌 Nhà thiên văn nhí!', text: `Em tìm đủ 5 mục tiêu trong ${Math.floor(t / 60)} phút ${t % 60} giây. Ngắm sao thật: chọn đêm không trăng, xa đèn đường, chờ 5 phút cho mắt quen bóng tối nhé!` });
  }
  function tapSky(e) {
    if (!cur || over) return;
    const r = api.ray(e).ray, dl = r.direction.clone(); root.worldToLocal(dl.add(root.getWorldPosition(new THREE.Vector3()))).normalize();   // hướng tia trong hệ cục bộ
    let best = null, bd = 0.9965;   // ≈ 4,8° (dễ chạm trên điện thoại)
    for (const p of pick) { const k = p.d.dot(dl); if (k > bd) { bd = k; best = p; } }
    if (!best) { hud.msg(`Chưa đúng chỗ. <small>${cur.hint}</small>`, 2200); sfx('land'); return; }
    if (best.T !== cur) { sfx('land'); hud.msg(`Đó là <b>${best.T.n}</b>. Mình đang tìm <b>${cur.n}</b> — <small>${cur.hint}</small>`, 3000); return; }
    // tìm thấy!
    cur.found = true; const pts = Math.max(21, 100 - Math.floor(tRound) * 3); score += pts; hud.score(score); sfx('ok');
    const T = cur, a0 = performance.now(); if (T.lines) { const fade = () => { const k = Math.min(1, (performance.now() - a0) / 1000 / PHI); T.lines.material.opacity = k * 0.9; if (k < 1 && !over) requestAnimationFrame(fade); }; fade(); }
    hud.msg(`✨ <b>${T.n}</b> +${pts}<br><small>${T.fact}</small>`, 0); if (teacher) teacher.emote('cheer');
    cur = null; round++;
    api.hud.clearBar(); hud.button('➡ Tiếp tục', () => { bar(); next(); }, 'on');
  }
  function bar() {
    if (!cur && round > 0 && !over) return;
    hud.clearBar();
    if (!looking) hud.button('👁 Nhìn qua kính', () => { if (!list.length || over) newGame(); else look(true); }, 'on');
    else { hud.button('🔙 Rời kính', () => look(false)); hud.button('💡 Gợi ý', () => { if (!cur) return; const d = cur.dirs[0]; az = Math.atan2(d.x, d.z); el = Math.asin(d.y) ; aimCam(); hud.msg(`💡 Kính đã quay về phía ${cur.n}. Chạm vào đó!`, 2500); score = Math.max(0, score - 13); hud.score(score); }); }
  }
  bar(); hud.msg('Bấm <b>👁 Nhìn qua kính</b> để ngắm sao. Kéo để xoay kính, chạm vào ngôi sao cần tìm.', 0);

  return {
    down(e) { if (!looking) return false; drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, id: e.pointerId }; return true; },
    move(e) { if (!drag || e.pointerId !== drag.id) return; const s = 1.1 / Math.min(innerWidth, innerHeight); az -= (e.clientX - drag.x) * s * 1.6; el = Math.max(0.05, Math.min(1.45, el + (e.clientY - drag.y) * s * 1.6)); drag.x = e.clientX; drag.y = e.clientY; aimCam(); },
    up(e) { if (!drag || e.pointerId !== drag.id) return; const moved = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8; drag = null; if (!moved && e.type === 'pointerup') tapSky(e); },
    key(e) { if (!looking) return; const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1], KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, 1], KeyS: [0, -1] }[e.code]; if (k) { az += k[0] * 0.13; el = Math.max(0.05, Math.min(1.45, el + k[1] * 0.08)); aimCam(); } },
    update(dt) {
      tRound += dt; if (t0 && !over && list.length) hud.time(performance.now() / 1000 - t0);
      // ống kính quay theo hướng ngắm; sao nhấp nháy nhẹ, hành tinh thì không
      head.rotation.set(-el, az, 0, 'YXZ');
      if (looking) { const t = performance.now() / 1000; for (const T of TARGETS) if (!T.big || T.big < 1.5) T.pts.material.opacity = 0.82 + Math.sin(t * 5 + T.az) * 0.18; }
    },
    dispose() { over = true; eye.remove(); },
  };
}
