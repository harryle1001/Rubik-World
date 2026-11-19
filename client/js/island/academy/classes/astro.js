// classes/astro.js — LỚP THIÊN VĂN TRÊN THÁP: đài nổi phép thuật nhô ra từ ban công tháp thiên văn (cao 55 m), mái vòm đêm r 34 m.
//  1. Mặt Trăng theo LỊCH THẬT hôm nay (tính tuổi trăng từ kỳ trăng mới 06/01/2000, chu kỳ 29,53 ngày) → chọn đúng hình trăng.
//  2. Nối chòm Bắc Đẩu (7 sao, hình cái gáo) · 3. Xếp 8 hành tinh theo thứ tự xa dần Mặt Trời · 4. Nối chòm Thiên Hậu (chữ W) · 5. câu hỏi.
import * as THREE from 'three';
import { teacher, ask, finish, cleanup, wait, label, PHI } from './common.js';

const SYN = 29.530588853, D = Math.PI / 180;
export function moonAge(t = Date.now()) { return (((t - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % SYN + SYN) % SYN; }
const PHASES = ['🌑 Trăng mới (không thấy)', '🌒 Lưỡi liềm đầu tháng', '🌓 Bán nguyệt đầu tháng', '🌔 Trăng gần tròn (trước rằm)', '🌕 Trăng tròn (rằm)', '🌖 Trăng khuyết sau rằm', '🌗 Bán nguyệt cuối tháng', '🌘 Lưỡi liềm cuối tháng'];
const phaseIdx = age => Math.round(age / SYN * 8) % 8;
const DIPPER = [[-15, 0], [-9, 1], [-4, 0], [0, -1], [1, -7], [7, -8], [8, -1]], CASS = [[-10, 0], [-5, -4], [0, 1], [5, -3], [10, 2]];
const PLANETS = [['Sao Thủy', '#b9b2a8', 0.16], ['Sao Kim', '#f2d79a', 0.22], ['Trái Đất', '#3d8fd9', 0.23], ['Sao Hỏa', '#e0603e', 0.19], ['Sao Mộc', '#d9b08a', 0.42], ['Sao Thổ', '#e8d39a', 0.36], ['Thiên Vương', '#9fe0e8', 0.29], ['Hải Vương', '#4a6fe0', 0.28]];
const QEND = { q: 'Vì sao Mặt Trăng có lúc tròn, lúc khuyết?', choices: ['Ta thấy phần được Mặt Trời chiếu sáng thay đổi khi Mặt Trăng quay quanh Trái Đất', 'Mặt Trăng bị ăn mất một phần', 'Mây che Mặt Trăng', 'Mặt Trăng tự phát sáng yếu dần'], a: 0, explain: 'Mặt Trăng <b>không tự phát sáng</b>; nó phản chiếu ánh Mặt Trời. Mỗi 29,5 ngày ta thấy đủ các pha — nên có lịch âm.' };

function moonTex(age) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d'), r = 110, f = age / SYN, cs = Math.cos(2 * Math.PI * f), wax = f < 0.5;
  k.fillStyle = '#2b2f45'; k.beginPath(); k.arc(128, 128, r, 0, 7); k.fill();
  k.fillStyle = '#fff6d8'; k.beginPath(); wax ? k.arc(128, 128, r, -Math.PI / 2, Math.PI / 2) : k.arc(128, 128, r, Math.PI / 2, Math.PI * 1.5); k.fill();
  k.fillStyle = cs > 0 ? '#2b2f45' : '#fff6d8'; k.beginPath(); k.ellipse(128, 128, Math.max(0.5, r * Math.abs(cs)), r, 0, 0, 7); k.fill();
  k.fillStyle = '#0002'; for (const [x, y, s] of [[100, 95, 18], [150, 150, 13], [118, 165, 9]]) { k.beginPath(); k.arc(x, y, s, 0, 7); k.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function startAstro(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat, P = new THREE.Vector3(0, 0, -4.6), portrait = innerWidth < innerHeight;
  // đài nổi + vành sáng
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 3.4, 0.4, 34).translate(0, -0.08, 0), M('#3c3a5a')); pad.position.copy(P); root.add(pad);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.06, 4, 55).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9fd0ff' })); rim.position.set(P.x, 0.13, P.z); root.add(rim);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.2), M('#3c3a5a')); bridge.position.set(0, 0.02, -0.4); root.add(bridge);
  // vòm đêm: vẽ trước, ghi độ sâu → nhà cửa xa hơn 34 m bị che, gần hơn (tháp) vẫn thấy
  const SKY = 34, sky = new THREE.Group(); sky.position.copy(P); root.add(sky);
  { const g = new THREE.SphereGeometry(SKY, 34, 13), col = [], p = g.attributes.position, c = new THREE.Color(); for (let i = 0; i < p.count; i++) { const y = p.getY(i) / SKY; c.set('#060b1f').lerp(new THREE.Color('#1d2a5a'), Math.max(0, 0.35 - y) * 2); col.push(c.r, c.g, c.b); } g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })); m.renderOrder = -5; sky.add(m); }
  { const pos = []; for (let i = 0; i < 233; i++) { const y = 0.08 + 0.92 * Math.random(), a = i * 2 * Math.PI / (PHI * PHI), r = Math.sqrt(1 - y * y) * (SKY - 1); pos.push(Math.cos(a) * r, y * (SKY - 1), Math.sin(a) * r); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sky.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe8ff', size: 2 * Math.min(2, devicePixelRatio), sizeAttenuation: false, fog: false }))); }
  const dir = (az, el, d = 24) => new THREE.Vector3(Math.sin(az * D) * Math.cos(el * D) * d, Math.sin(el * D) * d + 1.6, -Math.cos(az * D) * Math.cos(el * D) * d).add(P);
  // Mặt Trăng (sprite, lúc đầu bị mây che "?")
  const age = moonAge(), pi = phaseIdx(age), moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(age), fog: false })); moon.scale.setScalar(4.2); moon.position.copy(dir(-24, 30)); moon.visible = false; root.add(moon);
  const cloud = label('☁️ Mặt Trăng tối nay ra sao?', 7); cloud.position.copy(moon.position); root.add(cloud);
  me.place(1.6, -6.2, Math.PI); me.face(0, -10);
  teacher(api, 'student-female-d', 'Cô Ngân Hà', { shirt: '#2c3966', pants: '#1d2238', aodai: true },
    ['Chào các em! Đây là đài thiên văn cao nhất học viện.', 'Bầu trời là chiếc đồng hồ và tấm bản đồ khổng lồ của loài người.', 'Hôm nay ta xem Mặt Trăng thật, nối chòm sao và xếp hàng các hành tinh!'], [-2.2, -6.8]);
  // ----- sao để chạm (cầu nhỏ + cầu vô hình to cho dễ chạm) -----
  const starG = new THREE.Group(); root.add(starG); let targets = [], seq = [], lines = null;
  const lineMat = new THREE.LineBasicMaterial({ color: '#ffd36e', fog: false });
  function stars(list, az0, el0) {
    starG.clear(); targets = []; seq = []; const s = portrait ? 0.85 : 1.2;
    list.forEach(([dx, dy], i) => { const p = dir(az0 + dx * s, el0 + dy * s), m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff7d0', fog: false })); m.position.copy(p);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(1.4, 6, 4), new THREE.MeshBasicMaterial({ visible: false })); hit.userData.i = i; m.add(hit); starG.add(m); targets.push(hit); });
    if (lines) { root.remove(lines); lines.geometry.dispose(); } lines = new THREE.Line(new THREE.BufferGeometry(), lineMat); root.add(lines);
  }
  const skyCam = new THREE.PerspectiveCamera(portrait ? 72 : 55, innerWidth / innerHeight, 0.1, 200);   // camera riêng khi ngắm trời (toạ độ cục bộ root)
  const look = (az, el) => { skyCam.aspect = innerWidth / innerHeight; skyCam.updateProjectionMatrix(); skyCam.position.set(P.x, 1.7, P.z + 2.6); skyCam.lookAt(dir(az, el)); api.useCamera(skyCam); };
  const fov0 = ctx.camera.fov;
  const lookPad = () => (api.camSrc = null, ctx.camera.fov = fov0, ctx.camera.updateProjectionMatrix(), Object.assign(api.cam, { x: 0, y: 0.8, z: P.z - 1, yaw: 0, pitch: 0.75, dist: portrait ? 10.5 : 8.5 }));
  // ----- hành tinh quanh "Mặt Trời" giữa đài -----
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 21, 13), new THREE.MeshBasicMaterial({ color: '#ffcf4a' })); sun.position.set(P.x, 1.4, P.z); sun.visible = false; root.add(sun);
  const pl = []; const order = PLANETS.map((_, i) => i).sort(() => Math.random() - 0.5);
  order.forEach((k, j) => { const [n, c, r] = PLANETS[k], a = j * Math.PI * 2 / 8 + 0.2, m = new THREE.Mesh(new THREE.SphereGeometry(r, 13, 8), M(c)); m.position.set(P.x + Math.sin(a) * 2.9, 1.2, P.z + Math.cos(a) * 2.9);
    if (k === 5) { const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.3, r * 2, 21).rotateX(-1.2), new THREE.MeshBasicMaterial({ color: '#d8c48a', side: THREE.DoubleSide })); m.add(ring); }
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.62, 6, 4), new THREE.MeshBasicMaterial({ visible: false })); hit.userData.k = k; m.add(hit); const lb = label(n, 1.7); lb.position.y = 0.55; m.add(lb); m.visible = false; root.add(m); pl.push({ m, hit, k }); });
  let step = 0, mode = '', score = 0, wrong = 0, time = 0, done = false, busy = false;
  const ROUND = n => { hud.info(`Phần <b>${n}</b>/5`); };
  async function run() {
    lookPad(); hud.score(0); await wait(7600); if (!root.parent) return;
    // 1. Mặt Trăng hôm nay
    ROUND(1); look(-24, 26); const d = new Date(), today = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const others = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => i !== pi).sort(() => Math.random() - 0.5).slice(0, 3);
    await wait(1600); const ok1 = await ask(api, { q: `🌙 Hôm nay ${today}, trăng đã ${Math.floor(age)} ngày tuổi (tính từ trăng mới). Mặt Trăng tối nay trông thế nào?`, choices: [PHASES[pi], ...others.map(i => PHASES[i])], a: 0,
      explain: `Đúng là <b>${PHASES[pi].slice(3)}</b>. Trăng tròn rơi vào ngày rằm (≈ 15 âm lịch), trăng mới vào mùng 1. Cứ 29,5 ngày lặp lại.` });
    if (!root.parent) return; cloud.visible = false; moon.visible = true; api.sfx('open'); if (ok1) { score += 21; hud.score(score); }
    await wait(2600); if (!root.parent) return;
    // 2. Bắc Đẩu
    ROUND(2); mode = 'stars'; stars(DIPPER, 14, 34); look(14, 32); wrong = 0; hud.msg('✨ Nối chòm <b>Bắc Đẩu</b>: chạm 7 sao lần lượt từ <b>đầu cán gáo</b> (sao bên trái) sang <b>miệng gáo</b>.', 0);
    await until(() => mode === 'next'); if (!root.parent) return;
    score += Math.max(8, 21 - wrong * 3); hud.score(score); hud.msg('🥄 Bắc Đẩu hình <b>cái gáo</b>. Kéo dài 2 sao miệng gáo khoảng 5 lần → <b>Sao Bắc Cực</b>, chỉ hướng Bắc!', 4600); await wait(4800); if (!root.parent) return;
    // 3. Hành tinh
    ROUND(3); starG.clear(); if (lines) lines.visible = false; mode = 'planets'; step = 0; wrong = 0; sun.visible = true; for (const q of pl) q.m.visible = true; lookPad(); api.cam.pitch = 0.9;
    hud.msg('🪐 Chạm 8 hành tinh theo thứ tự <b>từ gần đến xa Mặt Trời</b>.', 0);
    await until(() => mode === 'next'); if (!root.parent) return;
    score += Math.max(8, 34 - wrong * 3); hud.score(score); hud.msg('🌍 Thủy – Kim – Trái Đất – Hỏa – Mộc – Thổ – Thiên Vương – Hải Vương. Sao Mộc to nhất; Trái Đất là hành tinh thứ 3!', 5000); await wait(5200); if (!root.parent) return;
    for (const q of pl) q.m.visible = false; sun.visible = false;
    // 4. Thiên Hậu
    ROUND(4); mode = 'stars'; stars(CASS, -16, 36); if (lines) lines.visible = true; look(-16, 34); wrong = 0; hud.msg('✨ Nối chòm <b>Thiên Hậu</b> hình chữ <b>W</b>: chạm 5 sao từ trái sang phải.', 0);
    await until(() => mode === 'next'); if (!root.parent) return;
    score += Math.max(8, 21 - wrong * 3); hud.score(score); hud.msg('👑 Thiên Hậu nằm đối diện Bắc Đẩu qua Sao Bắc Cực.', 3600); await wait(3800); if (!root.parent) return;
    // 5. câu hỏi
    ROUND(5); look(-24, 26); hud.msg('', 0); if (await ask(api, QEND)) { score += 13; hud.score(score); } if (!root.parent) return;
    done = true; finish(ctx, api, { score, max: 110, title: 'Lớp Thiên Văn', text: `Mặt Trăng hôm nay: ${PHASES[pi]}. Tối nay em hãy ra sân nhìn thử nhé!` });
  }
  const until = f => new Promise(r => { const iv = setInterval(() => { if (f() || !root.parent) { clearInterval(iv); r(); } }, 200); });
  run();
  return {
    tap(e) {
      if (busy || done) return;
      if (mode === 'stars') {
        const h = api.pick(e, targets); if (!h) return; const i = h.object.userData.i;
        if (i !== seq.length) { wrong++; api.sfx('ui'); targets[seq.length].parent.scale.setScalar(2.2); hud.msg('💡 Sao tiếp theo đang <b>nhấp nháy to</b>.', 1800); return; }
        seq.push(i); api.sfx('ok'); h.object.parent.material.color.set('#ffd36e');
        lines.geometry.dispose(); lines.geometry = new THREE.BufferGeometry().setFromPoints(seq.map(k => targets[k].parent.position));
        if (seq.length === targets.length) { if (targets.length === 7) { lines.geometry.dispose(); lines.geometry = new THREE.BufferGeometry().setFromPoints([...seq, 3].map(k => targets[k].parent.position)); } api.sfx('win'); me.emote('cheer'); mode = 'next'; }
      } else if (mode === 'planets') {
        const h = api.pick(e, pl.map(q => q.hit)); if (!h) return; const k = h.object.userData.k;
        if (k !== step) { wrong++; api.sfx('ui'); hud.msg(`❌ Chưa phải ${PLANETS[k][0]}. Hành tinh thứ ${step + 1} tính từ Mặt Trời là…?`, 2200); return; }
        api.sfx('ok'); const q = pl.find(q => q.k === k); q.m.scale.setScalar(1.3); step++; hud.msg(`✅ ${step}. <b>${PLANETS[k][0]}</b>`, 1600);
        if (step === 8) { api.sfx('win'); me.emote('cheer'); mode = 'next'; }
      }
    },
    update(dt, t) {
      if (!done) { time += dt; hud.time(time); }
      rim.material.color.setHSL(0.58 + Math.sin(t) * 0.05, 0.8, 0.75);
      for (const [i, q] of pl.entries()) { q.m.rotation.y += dt * (0.5 + i * 0.1); }
      if (mode === 'stars' && targets[seq.length]) { const s = targets[seq.length].parent; s.scale.setScalar(Math.max(1, s.scale.x - dt) + Math.sin(t * 8) * 0.15); }
    },
    dispose() { cleanup(); },
  };
}
