// intro.js — 🎬 CLIP MỞ ĐẦU (lần đầu vào game, xem lại ở menu ☰): dựng bằng chính engine 3D + camera điện ảnh, không video.
// Lớp 5A (Toà học tập, school-interior.stage) chiều nắng vàng → thầy giảng Rubik, em ngủ gật → phấn bay lấp lánh, khối Rubik trên bàn
// sáng & xoay → xoáy ốc vàng (xoắn ốc Fibonacci) → em tỉnh dậy giữa Đảo Rubik, camera vòng quanh rồi trả quyền điều khiển.
// Tải lười: ocean.js chỉ import() file này khi cần. Lưu "đã xem" vào tài khoản (profile.introSeen) + máy (island.intro).
// Nhịp cảnh theo Fibonacci (5 · 5 · 5 · 3 · 8 s = 26 s), chữ 13 → 21 px (×φ), nút 44 px.
import * as THREE from 'three';
import { loadHero } from './characters.js';
import { PHI, SPAWN } from './layout.js';

const CSS = `
body.intro-on>*:not(canvas):not(#intro){visibility:hidden!important}
#intro{position:fixed;inset:0;z-index:60;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff}
#intro .grade{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%,#ffcf7a55,#ff9a3c22 45%,#1a0a0066 100%);mix-blend-mode:soft-light;transition:opacity 1.618s}
#intro .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,#000a 100%)}
#intro .bar{position:absolute;left:0;right:0;height:8.3vh;background:#000;transition:transform .618s}#intro .bar.t{top:0}#intro .bar.b{bottom:0}
#intro canvas{position:absolute;inset:0;width:100%;height:100%}
#intro .blk{position:absolute;inset:0;background:#000;transition:opacity .618s}
#intro .ttl{position:absolute;left:0;right:0;top:34%;text-align:center;opacity:0;transition:opacity 1s;text-shadow:0 3px 21px #000c}
#intro .ttl b{display:block;font:900 clamp(26px,7vw,42px)/1.15 system-ui;letter-spacing:.08em;background:linear-gradient(#fff3c4,#ffb340);-webkit-background-clip:text;background-clip:text;color:transparent}
#intro .ttl small{display:block;margin-top:8px;font:700 13px system-ui;letter-spacing:.3em;opacity:.8}
#intro .cap{position:absolute;left:50%;bottom:calc(8.3vh + 21px);transform:translateX(-50%);width:min(92vw,610px);text-align:center;font:700 clamp(16px,4.4vw,21px)/1.45 system-ui;text-shadow:0 2px 8px #000,0 0 21px #000a;opacity:0;transition:opacity .618s}
#intro .say{position:absolute;left:50%;top:calc(8.3vh + 21px);transform:translateX(-50%);width:min(88vw,520px);text-align:center;font:italic 600 clamp(14px,3.8vw,17px)/1.45 system-ui;color:#fff6d8;text-shadow:0 2px 8px #000;opacity:0;transition:opacity .618s}
#intro .btns{position:absolute;top:calc(max(12px,env(safe-area-inset-top)) + 8.3vh + 8px);right:max(12px,env(safe-area-inset-right));display:flex;gap:8px;pointer-events:auto}
#intro button{white-space:nowrap;min-height:44px;min-width:44px;padding:0 16px;border-radius:22px;border:2px solid #fff8;background:#0009;color:#fff;font:800 15px system-ui;cursor:pointer;touch-action:manipulation;backdrop-filter:blur(4px)}
#intro .prep{position:absolute;left:50%;top:58%;transform:translateX(-50%);font:600 13px system-ui;opacity:.7;letter-spacing:.1em}`;

const FACE = ['#c41e3a', '#ff8c00', '#ffffff', '#ffd500', '#009e60', '#0051ba'];   // +x −x +y −y +z −z
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export async function playIntro(ctx, { first = false } = {}) {
  if (ctx.intro.open) return; ctx.intro.open = true;
  const { scene, camera, player: P } = ctx, SI = ctx.schoolInterior;
  // ---------- giao diện phủ ----------
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ui = document.createElement('div'); ui.id = 'intro';
  ui.innerHTML = `<div class="grade"></div><div class="vig"></div><canvas></canvas><div class="bar t"></div><div class="bar b"></div><div class="blk"></div>
  <div class="ttl"><b>KHỐI RUBIK PHA LÊ</b><small>MỞ ĐẦU</small></div><div class="say"></div><div class="cap"></div><div class="prep">Đang chuẩn bị…</div>
  <div class="btns"><button class="vo" type="button" title="Giọng đọc">🔈</button><button class="sk" type="button">Bỏ qua ⏭</button></div>`;
  document.body.appendChild(ui); document.body.classList.add('intro-on');
  const $ = s => ui.querySelector(s), blk = $('.blk'), cap = $('.cap'), say = $('.say'), cv = $('canvas'), g2 = cv.getContext('2d');
  let voice = localStorage.getItem('island.voice') === '1';
  const vo = $('.vo'); const vSet = () => { vo.textContent = voice ? '🔊' : '🔈'; vo.setAttribute('aria-pressed', voice); }; vSet();
  vo.onclick = () => { voice = !voice; try { localStorage.setItem('island.voice', voice ? '1' : '0'); } catch (e) {} vSet(); if (!voice && window.speechSynthesis) speechSynthesis.cancel(); };
  const speak = (t, vol = 1, rate = 1) => { if (!voice || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, '')); u.lang = 'vi-VN'; const v = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)); if (v) u.voice = v; u.volume = vol; u.rate = rate; speechSynthesis.speak(u); } catch (e) {} };
  let done = false, t = -1, built = false; $('.sk').onclick = () => finish(true);
  const keySkip = e => { if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') finish(true); }; addEventListener('keydown', keySkip);

  // ---------- nhạc CC0 (assets/audio, CREDITS.txt) ----------
  const soundOn = !ctx.audio || ctx.audio.on, music = soundOn ? new Audio('/assets/audio/bgm-school.mp3') : null;
  if (music) { music.loop = true; music.volume = 0; music.play().catch(() => {}); }
  const sfx = k => soundOn && ctx.sfx && ctx.sfx(k);

  // ---------- chuẩn bị (lười): lớp 5A + học sinh, thầy giáo, nhân vật VRM của em ----------
  const save = { pos: P.pos.clone(), yaw: P.cam.yaw, pitch: P.cam.pitch, dist: P.cam.dist, lock: ctx.sky ? ctx.sky.state.lock : null, rot: P.rot };
  const wake = first || ctx.indoor || P.vehicle ? [SPAWN[0], SPAWN[1]] : [save.pos.x, save.pos.z];
  const tmo = ms => new Promise(r => setTimeout(r, ms));
  const vrmReady = (async () => { for (let i = 0; i < 40 && !(ctx.playerVrm && (ctx.playerVrm.active || ctx.playerVrm.weak)); i++) await tmo(150); })();
  const [S, teacher] = await Promise.all([
    Promise.race([SI.stage('p5a', 8), tmo(8000).then(() => null)]),
    loadHero('student-male-c', 1.72, { role: 'teacher', shirt: '#f4efe2', pants: '#3a3f5a', glasses: true, tie: '#8e5bd6' }).catch(() => null),
    Promise.race([vrmReady, tmo(6000)]),
  ]);
  if (done) { SI.stage(null); return; }   // bỏ qua lúc đang chuẩn bị
  if (!S) return finish(true);
  const X = S.X, Z = S.Z, Y0 = S.Y, V = (x, y, z) => new THREE.Vector3(X(x), Y0 + y, Z(z));
  ctx.freeCam = true; P.frozen = true;
  if (ctx.sky) ctx.sky.state.lock = 16.8;   // chiều nắng vàng
  const G = new THREE.Group(); G.name = 'intro'; scene.add(G);
  // thầy giáo trên bục, quay về phía học sinh (+x)
  if (teacher) { teacher.model.position.copy(V(1.7, 0.15, 3.4)); teacher.model.rotation.y = Math.PI / 2 - 0.25; G.add(teacher.model); teacher.anim.play(teacher.set.interact || teacher.set.idle, 0); }
  // bảng: bài Rubik (đè lên bảng đen của lớp)
  { const c = document.createElement('canvas'); c.width = 512; c.height = 192; const q = c.getContext('2d');
    q.fillStyle = '#23402f'; q.fillRect(0, 0, 512, 192); q.fillStyle = '#eef3e6'; q.font = '700 30px system-ui'; q.fillText('Khối Rubik 3 × 3', 24, 44);
    q.font = '600 23px system-ui'; q.fillText('6 mặt × 9 ô = 54 ô màu', 24, 92); q.fillText('Xoay 1 mặt = 1 phép biến đổi', 24, 132); q.fillText('φ ≈ 1,618 · π ≈ 3,14', 24, 172);
    for (let i = 0; i < 9; i++) { q.fillStyle = FACE[(i * 5) % 6]; q.fillRect(392 + (i % 3) * 34, 40 + Math.floor(i / 3) * 34, 30, 30); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.copy(V(0.2, 1.6, 4)); m.rotation.y = Math.PI / 2; G.add(m); }
  // tia nắng xiên qua cửa sổ (tường bắc z = 0): tấm cộng màu, không đổ bóng
  { const c = document.createElement('canvas'); c.width = 16; c.height = 128; const q = c.getContext('2d'), gr = q.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#ffd58a'); gr.addColorStop(1, '#ffd58a00'); q.fillStyle = gr; q.fillRect(0, 0, 16, 128);
    const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 5.5), mat); m.position.copy(V(3 + i * 2.1, 1.6, 1.9)); m.rotation.set(0.75, 0, 0.3); G.add(m); } }
  // đèn vàng ấm (giờ chiều) + đèn nhỏ ở khối Rubik (sáng dần)
  const sun = new THREE.PointLight('#ffb35c', 6, 13, 1.6); sun.position.copy(V(7, 2.6, 0.8)); G.add(sun);
  const glow = new THREE.PointLight('#ffd36e', 0, 3.4, 2); G.add(glow);
  // khối Rubik 3×3 trên bàn (27 khối con; lớp trên xoay được)
  const cube = new THREE.Group(), top = new THREE.Group(), s = 0.05, geo = new THREE.BoxGeometry(s * 0.94, s * 0.94, s * 0.94);
  const mats = FACE.map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0, roughness: 0.4 })), inner = new THREE.MeshStandardMaterial({ color: '#111' });
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    const m = new THREE.Mesh(geo, [i > 0 ? mats[0] : inner, i < 0 ? mats[1] : inner, j > 0 ? mats[2] : inner, j < 0 ? mats[3] : inner, k > 0 ? mats[4] : inner, k < 0 ? mats[5] : inner]);
    m.position.set(i * s, j * s, k * s); (j > 0 ? top : cube).add(m);
  }
  cube.add(top); const cubeAt = V(4.3, 0.84, 5.62); cube.position.copy(cubeAt); cube.rotation.y = 0.5; G.add(cube); glow.position.copy(cubeAt).y += 0.2;
  // phấn bay lấp lánh (Points cộng màu)
  const N = 89, pos = new Float32Array(N * 3), seed = Array.from({ length: N }, () => [Math.random(), Math.random(), Math.random(), Math.random()]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const q = c.getContext('2d'), gr = q.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#ffe39a'); gr.addColorStop(1, '#ffb34000'); q.fillStyle = gr; q.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const pm = new THREE.PointsMaterial({ map: dot, size: 0.09, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), pts = new THREE.Points(pg, pm); pts.frustumCulled = false; G.add(pts);
  // Z z z bay lên từ đầu em
  const zs = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'); q.font = '900 52px system-ui'; q.fillStyle = '#fff'; q.strokeStyle = '#2a3a6a'; q.lineWidth = 6; q.strokeText('Z', 16, 52); q.fillText('Z', 16, 52);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false })); sp.scale.setScalar(0.18 + i * 0.05); G.add(sp); return sp; });

  // ---------- em ngồi ghế đầu bàn, gục đầu ngủ ----------
  const seat = V(5.02, 0.42, 5.35), hero = () => P.hero;
  const place = (p, ry) => { P.pos.copy(p); P.root.position.copy(p); P.root.rotation.set(0, ry, 0); const h = hero(); if (h) { h.model.position.set(0, 0, 0); h.model.rotation.set(0, 0, 0); } };
  place(seat, Math.PI / 2);   // người chơi: model nhìn −z cục bộ → yaw π/2 = nhìn −x (bảng)
  let anim = null, animH = null, want = ['sit', 0, false]; const play = (n, f = 0.3, once = false) => { want = [n, f, once]; const h = hero(); if (!h) return; const k = h.set[n] || (n === 'floor' && h.set.sit) || h.set.idle; if (anim !== k || animH !== h || h.anim.current !== h.anim.actions[k]) { anim = k; animH = h; h.anim.play(k, animH === h ? f : 0, once); } };
  // hướng mặt: đo từ 2 vai (VRM và chibi khác quy ước) → lật π nếu đang không nhìn về hướng mong muốn
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const face = dir => { const B = bones(); if (!B || !B.armL || !B.armR) return; P.root.updateMatrixWorld(true); B.armL.getWorldPosition(_a); B.armR.getWorldPosition(_b); _a.sub(_b).cross(UP); if (_a.x * dir.x + _a.z * dir.z < 0) P.root.rotation.y += Math.PI; };
  let faced = null; const keepFace = dir => { const h = hero(); if (h && faced !== h) { faced = h; P.root.rotation.y = Math.PI / 2; h.anim.update(0); face(dir); } };
  play('sit', 0);
  // gục đầu: xoay xương (sau animation mỗi khung) quanh trục ngang thế giới, đổi sang hệ cha của xương
  const qa = new THREE.Quaternion(), qp = new THREE.Quaternion(), ax = new THREE.Vector3();
  const bend = (b, a, axis) => { if (!b || !a) return; b.parent.getWorldQuaternion(qp); ax.copy(axis).applyQuaternion(qp.invert()); qa.setFromAxisAngle(ax, a); b.quaternion.premultiply(qa); b.updateMatrixWorld(true); };
  const bones = () => { const h = hero(); if (!h) return null; if (h._ib) return h._ib; const H = h.vrm && h.vrm.humanoid, n = k => H ? H.getRawBoneNode(k) : null, o = k => h.model.getObjectByName(k);
    return (h._ib = { spine: n('spine'), chest: n('upperChest') || n('chest') || o('chest'), neck: n('neck'), head: n('head') || o('head'), armL: n('leftUpperArm') || o('upperarml'), armR: n('rightUpperArm') || o('upperarmr'), foreL: n('leftLowerArm') || o('lowerarml'), foreR: n('rightLowerArm') || o('lowerarmr') }); };
  const RIGHT = new THREE.Vector3(0, 0, 1), FWD = new THREE.Vector3(-1, 0, 0);   // em nhìn về −x (bảng): trục ngang = z
  let sleepK = 1;
  function pose() {
    const B = bones(); if (!B || sleepK <= 0) return; P.root.updateMatrixWorld(true);
    const k = sleepK, br = 0.06 * Math.sin(performance.now() / 1300);   // thở
    bend(B.spine, (0.38 + br) * k, RIGHT); bend(B.chest, 0.32 * k, RIGHT); bend(B.neck, 0.25 * k, RIGHT); bend(B.head, 0.45 * k, RIGHT);
    for (const [a, f, sg] of [[B.armL, B.foreL, 1], [B.armR, B.foreR, -1]]) { bend(a, -1.05 * k, RIGHT); bend(a, sg * 0.35 * k, FWD); bend(f, sg * 1.25 * k, new THREE.Vector3(0, 1, 0)); }
  }

  // ---------- kịch bản (giây) ----------
  const NARR = [[0.8, 'Một buổi chiều nắng vàng ở Trường Rubik…'], [5.2, '…có một bạn nhỏ đã ngủ gật trên bàn. Khò… khò…'], [10.2, 'Bỗng khối Rubik trên bàn phát sáng và tự xoay!'], [15.0, 'Một vòng xoáy vàng cuốn em đi…'], [18.6, 'Em tỉnh dậy giữa <b>Đảo Rubik</b>!'], [21.6, '8 mảnh <b>Khối Rubik Pha Lê</b> đang chờ em tìm lại. Đi thôi!']];
  const SAY = [[1.2, '👨‍🏫 “Khối Rubik có 6 mặt, mỗi mặt 3 × 3 = 9 ô nhỏ…”', 1], [4.4, '👨‍🏫 “…vậy cả khối có 6 × 9 = 54 ô màu, các em nhé…”', 0.75], [7.4, '👨‍🏫 “Mỗi lần xoay một mặt là một phép biến đổi…”', 0.45], [9.4, '👨‍🏫 “…biến… đổi…”', 0.22], [11.5, '', 0]];
  const END = 26; let ni = 0, si = 0;
  const shot = (a, b, la, lb, k, roll = 0) => { camera.position.lerpVectors(a, b, ease(k)); _l.lerpVectors(la, lb, ease(k)); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(_l); };
  const _l = new THREE.Vector3(), head = () => { const B = bones(); return B && B.head ? B.head.getWorldPosition(new THREE.Vector3()) : P.pos.clone().setY(P.pos.y + 1.2); };
  const C = { a0: V(12.3, 2.5, 1.0), a1: V(9.8, 2.0, 1.9), la0: V(1.2, 1.5, 4.2), la1: V(1.6, 1.3, 4.0),
    b0: V(5.6, 1.7, 3.0), b1: V(4.9, 1.4, 3.6), c0: V(3.1, 1.3, 4.5), c1: V(3.7, 1.05, 4.95) };
  let last = performance.now(), moved = false; t = 0;
  $('.prep').remove(); blk.style.opacity = 0; const ttl = $('.ttl');
  cv.width = Math.min(innerWidth, 900); cv.height = Math.round(cv.width * innerHeight / innerWidth);
  ctx.intro.tick = tick; built = true;

  function tick() {
    if (done) return;
    const now = performance.now(), step = window.__introDt || (now - last) / 1000, dt = Math.min(0.05, step); last = now; t += step; window.__introT = t;   // __introDt: bước cố định khi kiểm thử
    ttl.style.opacity = t < 2.618 ? 1 : 0;
    while (ni < NARR.length && t >= NARR[ni][0]) { const [, x] = NARR[ni++]; cap.style.opacity = 0; setTimeout(() => { if (done) return; cap.innerHTML = x; cap.style.opacity = 1; }, 250); speak(x); }
    while (si < SAY.length && t >= SAY[si][0]) { const [, x, v] = SAY[si++]; say.innerHTML = x; say.style.opacity = v; if (x && ni < 2) speak(x.replace(/[“”👨‍🏫]/gu, ''), v, 0.95); }
    if (music) music.volume = Math.max(0, Math.min(0.38, t < 2 ? t * 0.19 : t < 10 ? 0.38 - (t - 2) * 0.03 : t < 15 ? 0.14 : t < 18 ? 0.14 * (18 - t) / 3 : 0));
    const h = hero(); if (h) play(...want);   // giữ đúng động tác (hệ khác có thể gọi emote) if (h) h.anim.update(dt);
    if (teacher) teacher.anim.update(dt);
    // ----- cảnh lớp học (0 – 16,6 s) -----
    if (t < 16.6) {
      keepFace(FWD); pose();
      if (t < 5) shot(C.a0, C.a1, C.la0, C.la1, t / 5);
      else if (t < 10) { const hd = head(); shot(C.b0, C.b1, hd, hd, (t - 5) / 5); }
      else shot(C.c0, C.c1, cubeAt, cubeAt, (t - 10) / 6.6, t > 14.5 ? (t - 14.5) * 0.9 : 0);
      // Z z z
      const hp = head(); zs.forEach((z, i) => { const q = ((t * 0.5 + i / 3) % 1); z.visible = t > 4 && t < 13; z.position.set(hp.x - 0.1 - q * 0.15, hp.y + 0.25 + q * 0.6, hp.z + Math.sin(q * 6 + i) * 0.12); z.material.opacity = Math.sin(q * Math.PI) * (t < 11 ? 1 : (13 - t) / 2); });
      // phấn bay: từ bảng trôi khắp lớp, rồi xoáy về khối Rubik
      const pull = ease((t - 9.5) / 5); pm.opacity = Math.min(1, Math.max(0, (t - 3) / 3)); pm.size = 0.06 + pull * 0.04;
      for (let i = 0; i < N; i++) { const [a, b, c, d] = seed[i], w = t * (0.1 + a * 0.15) + d * 9;
        const fx = 0.4 + ((a * 13 + t * 0.35 * (0.4 + b)) % 12), fy = 0.6 + b * 1.9 + Math.sin(w * 2) * 0.15, fz = 1 + c * 6.5 + Math.cos(w) * 0.3;
        const r = 0.08 + d * 0.5 * (1 - pull * 0.7), an = w * 3 + t * 2.5 * pull;
        pos[i * 3] = X(lerp(fx, 4.3 + Math.cos(an) * r, pull)); pos[i * 3 + 1] = Y0 + lerp(fy, 0.84 + (b - 0.3) * r * 0.8, pull); pos[i * 3 + 2] = Z(lerp(fz, 5.62 + Math.sin(an) * r, pull)); }
      pg.attributes.position.needsUpdate = true;
      // khối Rubik sáng dần + xoay lớp trên + bay lên khỏi bàn
      const gk = ease((t - 9.6) / 3); mats.forEach(m => { m.emissiveIntensity = gk * (0.8 + 0.4 * Math.sin(t * 9)); }); glow.intensity = gk * 5;
      if (t > 10.4) { top.rotation.y = Math.floor((t - 10.4) / 0.618) * Math.PI / 2 + ease(((t - 10.4) % 0.618) / 0.382) * Math.PI / 2; cube.rotation.y = 0.5 + (t - 10.4) * 0.8 * (1 + gk); cube.position.y = cubeAt.y + ease((t - 12.5) / 2) * 0.12 + Math.sin(t * 3) * 0.008 * gk; }
      if (t > 10 && !moved) { moved = true; sfx('win'); }
    } else if (!G.userData.moved) {
      // ----- giữa xoáy (màn trắng vàng): đổi sang Đảo Rubik -----
      G.userData.moved = true; SI.stage(null); G.clear(); sleepK = 0; if (teacher) teacher.model.removeFromParent();
      if (ctx.sky) ctx.sky.state.lock = save.lock;
      P.teleport(wake[0], wake[1]); const y = ctx.terrain.heightAt(wake[0], wake[1]); P.pos.y = Math.max(P.pos.y, y, 1.2);
      place(P.pos, save.rot); play('floor', 0); $('.grade').style.opacity = 0;
    }
    // ----- đảo: nằm → ngồi dậy → đứng → reo; camera vòng quanh (18 – 26 s) -----
    if (t >= 16.6) {
      const k = (t - 16.6) / (END - 16.6), hd = P.pos.clone(); hd.y += lerp(0.6, 1.3, ease((t - 19.8) / 1.5));
      if (t > 19.8) play('idle', 0.5); if (t > 21.4 && t < 21.6) { play('cheer', 0.25, true); sfx('open'); }
      const a = save.rot + Math.PI * (0.25 + 1.2 * ease(k)), r = lerp(2.6, 9, ease(k)), y = lerp(0.9, 4.2, ease(k));
      camera.up.set(0, 1, 0); camera.position.set(hd.x + Math.sin(a) * r, hd.y + y, hd.z + Math.cos(a) * r); camera.lookAt(hd);
    }
    drawSwirl();
    if (t >= END) finish(false);
  }
  // ---------- xoáy ốc vàng (canvas 2D, 14,4 – 18,6 s) ----------
  function drawSwirl() {
    const W = cv.width, H = cv.height; g2.clearRect(0, 0, W, H); if (t < 14.4 || t > 18.6) return;
    const k = (t - 14.4) / 2.2, out = Math.max(0, (t - 16.6) / 2), m = Math.min(1, k) * (1 - out), cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2;
    g2.save(); g2.globalCompositeOperation = 'lighter'; g2.translate(cx, cy); g2.rotate(t * (2 + k * 4));
    for (let arm = 0; arm < 5; arm++) {   // 5 nhánh xoắn ốc vàng r = a·φ^(2θ/π)
      g2.rotate(Math.PI * 2 / 5); g2.beginPath();
      for (let th = 0; th < 4.5 * Math.PI; th += 0.08) { const r = 2 * Math.pow(PHI, th * 2 / Math.PI) * (0.6 + k); if (r > R * 1.4) break; g2.lineTo(Math.cos(th) * r, Math.sin(th) * r); }
      g2.strokeStyle = `rgba(255,${190 + arm * 12},90,${0.55 * m})`; g2.lineWidth = 3 + k * 13; g2.stroke();
    }
    g2.restore();
    const wk = Math.max(0, Math.min(1, (k - 0.55) / 0.45)) * (1 - out);   // trắng vàng ở giữa
    const gr = g2.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, `rgba(255,250,225,${wk})`); gr.addColorStop(0.5, `rgba(255,214,120,${wk * 0.9})`); gr.addColorStop(1, `rgba(255,160,40,${m * 0.5})`);
    g2.fillStyle = gr; g2.fillRect(0, 0, W, H);
  }
  // ---------- kết thúc / bỏ qua: dọn sạch, trả quyền điều khiển ----------
  async function finish(skip) {
    if (done) return; done = true; ctx.intro.tick = null; removeEventListener('keydown', keySkip);
    if (window.speechSynthesis) speechSynthesis.cancel();
    blk.style.opacity = 1; await tmo(skip ? 300 : 618);
    if (built && !G.userData.moved) { SI.stage(null); if (teacher) teacher.model.removeFromParent(); if (ctx.sky) ctx.sky.state.lock = save.lock; if (S) { P.teleport(wake[0], wake[1]); P.pos.y = Math.max(P.pos.y, 1.2); } }
    if (built) { G.removeFromParent(); G.traverse(o => { if (o.geometry) o.geometry.dispose(); }); geo.dispose(); mats.forEach(m => m.dispose()); pm.dispose(); dot.dispose(); }
    if (music) { music.pause(); music.src = ''; }
    camera.up.set(0, 1, 0); P.root.rotation.set(0, 0, 0);
    if (P.hero) P.hero.anim.play(P.hero.set.idle, 0.2);
    Object.assign(P.cam, { yaw: save.yaw, pitch: save.pitch, dist: save.dist }); P.snapCamera && P.snapCamera();
    ctx.freeCam = false; P.frozen = false;
    const a = ctx.account; if (a && a.profile) { a.profile.introSeen = Date.now(); a.save(); }
    try { localStorage.setItem('island.intro', '1'); } catch (e) {}
    document.body.classList.remove('intro-on'); ui.style.transition = 'opacity .618s'; ui.style.opacity = 0;
    setTimeout(() => { ui.remove(); st.remove(); ctx.intro.open = false; }, 700);
  }
}
