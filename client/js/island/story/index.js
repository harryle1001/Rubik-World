// story/index.js — ĐỘNG CƠ CỐT TRUYỆN "Khối Rubik Pha Lê": 8 chương (story/data.js), nhiệm vụ lần lượt, mảnh pha lê,
// đoạn dẫn chuyện điện ảnh (camera bay + thoại chữ + giọng đọc vi-VN tuỳ chọn, bỏ qua được), dẫn đường (mũi tên vàng + đường chấm
// sáng + cột sáng ở đích), HUD nhiệm vụ gọn, thế giới mất màu theo số mảnh còn thiếu (độ bão hoà 0,618 → 1).
// Tiến độ lưu trong TÀI KHOẢN (profile.story). Sổ tay, cấp độ, kỹ năng, danh hiệu: journal.js. Thung lũng Rồng: valley.js.
// φ: thanh điện ảnh cao 8 % (≈ 1/φ⁵), chấm dẫn đường 13 cái cách 2,6 m, cột sáng 34 m, mảnh pha lê xoay 1/φ vòng/s, HUD rộng 233.
// Hiệu năng: dẫn đường = 3 draw call (mũi tên, InstancedMesh chấm, cột), vật nhặt = 2 (InstancedMesh), mảnh = 2.
import * as THREE from 'three';
import { CHAPTERS, WHO, VALLEY, setEggCounter } from './data.js';
import { createValley } from './valley.js';
import { createJournal } from './journal.js';
import { blocked, PHI } from '../layout.js';
import { CFG } from '../config.js';

const GOLD = Math.PI * (3 - Math.sqrt(5));   // góc vàng
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DIRS = ['Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc', 'Bắc', 'Đông Bắc'];
const dirName = (dx, dz) => DIRS[((Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) % 8) + 8) % 8];

export function createStory(ctx) {
  const { scene, camera, player, terrain } = ctx, W = CFG.island.waterLevel;
  const blank = () => ({ ch: 0, ti: 0, prog: 0, started: false, castN: 0, revOk: 0, titles: [], title: null, skills: {}, facts: [] });
  const local = blank();
  const S = () => { const p = ctx.account && ctx.account.profile; if (!p) return local; if (!p.story) p.story = blank(); return p.story; };
  const save = () => ctx.account && ctx.account.save();
  const P = a => typeof a === 'function' ? a(ctx) : a;
  const gy = (x, z) => { const e = ctx.groundExtra ? ctx.groundExtra(x, z) : -99; return Math.max(terrain.heightAt(x, z), e > -50 ? e : -99); };
  const chap = () => CHAPTERS[S().ch];
  const task = () => { const C = chap(); return C && C.tasks[S().ti]; };
  setEggCounter(() => ctx.eggs ? Object.keys(ctx.eggs.found || {}).length : 0);

  // ---------- giao diện: HUD nhiệm vụ + khung thoại + thanh điện ảnh ----------
  const css = document.createElement('style'); css.textContent = `
#stHud{position:fixed;left:max(12px,env(safe-area-inset-left));top:240px;z-index:26;box-sizing:border-box;width:min(233px,calc(100vw - 89px));background:#2a1d3ccc;color:#fff;border:2px solid #ffd23f99;border-radius:13px;font:13px/1.35 system-ui;padding:5px 8px 8px;cursor:pointer;-webkit-tap-highlight-color:transparent}
#stHud .t{display:flex;gap:5px;align-items:center;font-weight:800}#stHud .t span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#stHud .t small{font-weight:700;opacity:.85}
#stHud .k{margin-top:3px;font-weight:700;color:#ffe9a8}#stHud .d{font-size:12px;opacity:.85}#stHud .bar{height:5px;border-radius:3px;background:#ffffff33;margin-top:5px;overflow:hidden}#stHud .bar u{display:block;height:100%;background:linear-gradient(90deg,#ff5a4e,#ffd23f,#4cd964,#3aa0ff,#a78bfa)}
#stHud.go{animation:stP 1.618s ease-in-out infinite}@keyframes stP{50%{box-shadow:0 0 21px #ffd23f}}
body.rs-modal #stHud,body.mg-on #stHud,body.st-cut #stHud{display:none}
body.st-cut #questHud,body.st-cut #chipRow,body.st-cut #bAct,body.st-cut #info{visibility:hidden}
#stBars::before,#stBars::after{content:'';position:fixed;left:0;right:0;height:8vh;background:#000;z-index:39;transition:transform .618s}#stBars::before{top:0;transform:translateY(-100%)}#stBars::after{bottom:0;transform:translateY(100%)}
#stBars.on::before,#stBars.on::after{transform:none}
#stSay{position:fixed;left:50%;bottom:calc(8vh + 13px);transform:translateX(-50%);z-index:40;box-sizing:border-box;width:min(610px,calc(100vw - 26px));background:#fffaf0f5;color:#3a2a1a;border-radius:21px;border:2px solid #f0a23a;padding:13px 13px 8px;font:15px/1.5 system-ui;box-shadow:0 8px 34px #0006;cursor:pointer}
#stSay .w{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px}#stSay .w i{font-style:normal;font-size:34px;line-height:1}#stSay .w span{flex:1}
#stSay p{margin:5px 0 8px;font-size:16px;font-weight:600;min-height:44px}#stSay .r{display:flex;gap:5px;justify-content:flex-end;align-items:center}#stSay .r small{flex:1;opacity:.6}
#stSay button{min-height:44px;min-width:44px;border:0;border-radius:21px;padding:0 13px;font-weight:800;font-size:14px;background:#f3e3c3;color:#5a3a12;cursor:pointer;font-family:system-ui}#stSay button.nx{background:#f0a23a;color:#2a1a0a}
#stSay.plain{bottom:max(89px,calc(env(safe-area-inset-bottom) + 89px))}`;
  document.head.appendChild(css);
  const hud = document.createElement('div'); hud.id = 'stHud'; hud.hidden = true; document.body.appendChild(hud);
  const bars = document.createElement('div'); bars.id = 'stBars'; document.body.appendChild(bars);
  let sayEl = null;

  // ---------- giọng đọc (speechSynthesis vi-VN), tuỳ chọn ----------
  let voiceOn = localStorage.getItem('island.voice') === '1';
  const speak = t => {
    if (!voiceOn || !window.speechSynthesis) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g, '').replace(/\p{Extended_Pictographic}/gu, '')); u.lang = 'vi-VN'; const v = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)); if (v) u.voice = v; u.rate = 1; speechSynthesis.speak(u); } catch (e) {}
  };

  // ---------- thoại: say(lines, { cine, target }) → Promise ----------
  // cine: đoạn dẫn chuyện điện ảnh — camera rời nhân vật, bay vòng + nâng dần, cuối cùng nhìn về hướng mục tiêu; HUD ẩn, thanh đen trên/dưới.
  let cut = null;   // { t, T, target, from } khi đang chiếu
  function say(lines, o = {}) {
    return new Promise(res => {
      let i = 0; const cine = !!o.cine;
      if (cine) { document.body.classList.add('st-cut'); bars.classList.add('on'); ctx.freeCam = true; const p = player.pos; cut = { t: 0, T: Math.max(8, lines.length * 4.2), target: o.target || [p.x + 10, p.z], yaw: player.cam.yaw, p0: new THREE.Vector3(p.x, p.y, p.z) }; }
      const fz = player.frozen; if (!cine) player.frozen = true;
      const end = () => {
        if (!sayEl) return; sayEl.remove(); sayEl = null; removeEventListener('keydown', key, true); try { speechSynthesis.cancel(); } catch (e) {}
        if (cine) { document.body.classList.remove('st-cut'); bars.classList.remove('on'); ctx.freeCam = false; cut = null; } else player.frozen = fz;
        res();
      };
      const show = () => {
        if (i >= lines.length) return end();
        const [w, t] = lines[i], W0 = WHO[w] || WHO.me;
        if (!sayEl) { sayEl = document.createElement('div'); sayEl.id = 'stSay'; document.body.appendChild(sayEl); }
        sayEl.className = cine ? '' : 'plain';
        sayEl.innerHTML = `<div class="w"><i>${W0.i}</i><span>${esc(W0.n)}</span></div><p>${esc(t)}</p><div class="r"><small>${i + 1}/${lines.length}</small><button data-v title="Giọng đọc">${voiceOn ? '🔊' : '🔈'}</button>${cine ? '<button data-s>Bỏ qua ⏭</button>' : ''}<button class="nx">${i + 1 < lines.length ? 'Tiếp ▶' : 'Xong ✓'}</button></div>`;
        speak(t); ctx.sfx && ctx.sfx('ui');
      };
      const key = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); e.stopImmediatePropagation(); i++; show(); } else if (e.code === 'Escape') { e.stopImmediatePropagation(); end(); } };
      addEventListener('keydown', key, true);
      show();
      sayEl.onclick = e => {
        if (e.target.closest('[data-v]')) { voiceOn = !voiceOn; try { localStorage.setItem('island.voice', voiceOn ? '1' : '0'); } catch (er) {} if (voiceOn) speak(lines[i][1]); else try { speechSynthesis.cancel(); } catch (er) {} e.target.closest('[data-v]').textContent = voiceOn ? '🔊' : '🔈'; return; }
        if (e.target.closest('[data-s]')) return end();
        i++; show();
      };
    });
  }
  const _v = new THREE.Vector3();
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function camCut(dt) {   // camera điện ảnh: từ góc nhìn hiện tại cẩu dần lên cao 21 m (trên mái nhà), vòng π/φ², cuối cùng nhìn về hướng mục tiêu
    if (!cut) return; cut.t += dt; const k = Math.min(1, cut.t / cut.T), e = k * k * (3 - 2 * k), p = cut.p0;
    if (!cut.c0) { cut.c0 = camera.position.distanceTo(p) < 21 ? camera.position.clone() : p.clone().add(_a.set(-Math.sin(player.cam.yaw) * 6, 3.4, -Math.cos(player.cam.yaw) * 6)); const [tx, tz] = cut.target, a = Math.atan2(tx - p.x, tz - p.z) + Math.PI + Math.PI / (PHI * PHI); cut.c1 = new THREE.Vector3(p.x + Math.sin(a) * 13, p.y + 21, p.z + Math.cos(a) * 13); }
    _a.lerpVectors(cut.c0, cut.c1, e); _a.y += Math.sin(e * Math.PI) * 3; camera.position.copy(_a);
    const [tx, tz] = cut.target; _b.set(p.x + (tx - p.x) * e * 0.38, p.y + 1.4, p.z + (tz - p.z) * e * 0.38); camera.lookAt(_b);
  }
  // nhân vật dẫn chuyện tại chỗ nhiệm vụ nói chuyện / câu đố: biển hình tròn (chân dung + tên), 1 sprite, vẽ lại khi đổi nhiệm vụ
  const npcCv = document.createElement('canvas'); npcCv.width = 256; npcCv.height = 320; const npcTex = new THREE.CanvasTexture(npcCv); npcTex.colorSpace = THREE.SRGBColorSpace;
  const npc = new THREE.Sprite(new THREE.SpriteMaterial({ map: npcTex, depthWrite: false })); npc.scale.set(1.3, 1.6, 1); npc.visible = false; scene.add(npc);
  function drawNpc(w) { const g = npcCv.getContext('2d'), W0 = WHO[w] || WHO.ru; g.clearRect(0, 0, 256, 320); g.fillStyle = '#fffaf0'; g.strokeStyle = '#f0a23a'; g.lineWidth = 13; g.beginPath(); g.arc(128, 118, 105, 0, Math.PI * 2); g.fill(); g.stroke(); g.font = '130px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(W0.i, 128, 126); g.font = 'bold 34px system-ui'; g.fillStyle = '#2a1d3c'; g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeText(W0.n, 128, 288); g.fillText(W0.n, 128, 288); npcTex.needsUpdate = true; }
  // ---------- dẫn đường: mũi tên vàng trước mặt + 13 chấm sáng theo hướng + cột sáng ở đích ----------
  const arrowShape = new THREE.Shape(); arrowShape.moveTo(0, 0.62); arrowShape.lineTo(0.38, 0); arrowShape.lineTo(0.14, 0); arrowShape.lineTo(0.14, -0.38); arrowShape.lineTo(-0.14, -0.38); arrowShape.lineTo(-0.14, 0); arrowShape.lineTo(-0.38, 0); arrowShape.closePath();
  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.08, bevelEnabled: false }); arrowGeo.rotateX(-Math.PI / 2); arrowGeo.translate(0, 0, 0);
  const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#ffd23f', fog: false, depthTest: false, transparent: true, opacity: 0.92 })); arrow.renderOrder = 9; arrow.visible = false; scene.add(arrow);
  const DOTS = 13, dotGeo = new THREE.SphereGeometry(0.13, 6, 4), dotMat = new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, DOTS); dots.frustumCulled = false; dots.visible = false; scene.add(dots);
  const beamGeo = new THREE.CylinderGeometry(0.34, 0.89, 34, 8, 1, true); beamGeo.translate(0, 17, 0);
  const beamMat = new THREE.MeshBasicMaterial({ color: '#ffe48a', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.visible = false; scene.add(beam);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();

  // ---------- vật nhặt (giọt màu, chữ cái, vảy rồng…): InstancedMesh bát diện cao φ + cột sáng nhỏ ----------
  const MAXP = 5, pickGeo = new THREE.OctahedronGeometry(0.34, 0); pickGeo.scale(1, PHI, 1);
  const pickMat = new THREE.MeshBasicMaterial({ color: '#fff' }), picks = new THREE.InstancedMesh(pickGeo, pickMat, MAXP); picks.frustumCulled = false; scene.add(picks);
  const pbGeo = new THREE.CylinderGeometry(0.06, 0.21, 5, 6, 1, true); pbGeo.translate(0, 2.5, 0);
  const pbeams = new THREE.InstancedMesh(pbGeo, beamMat, MAXP); pbeams.frustumCulled = false; scene.add(pbeams);
  let pts = [], labels = [];   // [x, y, z] vị trí vật nhặt của nhiệm vụ hiện tại
  // chữ nổi trên vật nhặt: 5 sprite dựng sẵn, vẽ lại canvas khi đổi nhiệm vụ (không huỷ vật liệu → không lỗi khi biên dịch trước shader)
  const LBL = Array.from({ length: MAXP }, () => { const c = document.createElement('canvas'); c.width = c.height = 128; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false })); sp.scale.set(1.2, 1.2, 1); sp.visible = false; scene.add(sp); return sp; });
  const labelSprite = (t, i) => { const sp = LBL[i], c = sp.material.map.image, g = c.getContext('2d'); g.clearRect(0, 0, 128, 128); g.font = 'bold 96px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 13; g.strokeStyle = '#2a1d3c'; g.strokeText(t, 64, 70); g.fillStyle = '#ffd23f'; g.fillText(t, 64, 70); sp.material.map.needsUpdate = true; return sp; };
  function spread(at, n, r, water = false) {   // vị trí theo xoắn ốc hướng dương (góc vàng), bỏ chỗ vướng nhà / dưới nước
    const out = [];
    for (let k = 0; out.length < n && k < 89; k++) {
      const a = k * GOLD, d = r * Math.sqrt((k + 0.5) / Math.max(n, 3)), x = at[0] + Math.cos(a) * d, z = at[1] + Math.sin(a) * d, h = gy(x, z);
      if (!water && h < W + 0.3) continue;
      if (Math.abs(x) < 400 && Math.abs(z) < 400 && blocked(x, z, 1)) continue;
      if (ctx.colliders.some(c => Math.hypot(c.x - x, c.z - z) < (c.r || 1) + 0.8)) continue;
      if (out.some(p => Math.hypot(p[0] - x, p[2] - z) < 4)) continue;
      out.push([x, h, z]);
    }
    return out;
  }
  function buildPicks() {
    LBL.forEach(sp => sp.visible = false); labels = []; pts = [];
    const T = task(); if (!T || T.type !== 'collect') return;
    pts = spread(P(T.at), T.n, T.spread || 13); pickMat.color.set(T.col || '#9ad8ff');
    if (T.labels) labels = T.labels.slice(0, MAXP).map(labelSprite);
  }

  // ---------- mục tiêu niệm phép (cây pha lê xám → 7 màu) ----------
  let casts = [];
  const castGeo = new THREE.OctahedronGeometry(0.89, 0); castGeo.scale(1, PHI * PHI, 1);
  const CM = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(castGeo, new THREE.MeshLambertMaterial({ color: '#8a8a8a', flatShading: true })); m.visible = false; scene.add(m); return m; });   // dựng sẵn, dùng lại
  function clearCasts() { for (const c of casts) { c.m.visible = false; ctx.magic && ctx.magic.removeTarget(c.T); } casts = []; }
  function buildCasts() {
    clearCasts(); const T = task(); if (!T || T.type !== 'cast' || !ctx.magic) return;
    if (T.boss) { const T0 = ctx.magic.addTarget({ spell: T.spell, pos: boss.group.position.clone().setY(boss.group.position.y + 1.6), reach: 13, done: () => false, onCast: api => { boss.colorize(); api.burst(boss.group.position.clone().setY(boss.group.position.y + 2), new THREE.Vector3(0, 1, 0), '#ff6fae', 55, 5, 1); advance(); } }); const o = new THREE.Object3D(); o.visible = false; casts.push({ m: o, T: T0 }); return; }
    for (const [x, y, z] of spread(P(T.at), T.n, T.spread || 13)) {
      const m = CM[casts.length]; if (!m) break; m.material.color.set('#8a8a8a'); m.position.set(x, y + 1.6, z); m.visible = true;
      const c = { m, lit: false }; c.T = ctx.magic.addTarget({ spell: T.spell, pos: m.position, reach: 13, done: () => c.lit, onCast: api => {
        c.lit = true; m.material.color.setHSL((casts.indexOf(c) / 3 + 0.02) % 1, 0.85, 0.6); api.burst(m.position.clone(), new THREE.Vector3(0, 1, 0), '#' + m.material.color.getHexString(), 34, 4, 1);
        ctx.sfx && ctx.sfx('ok'); S().prog++; save(); ctx.toast(`🌈 Cây pha lê có màu trở lại! ${S().prog}/${T.n}`, 2500); if (S().prog >= T.n) advance();
      } });
      casts.push(c);
    }
  }
  // phép mới 🌈 Cầu Vồng (dạy ở chương 5): có sẵn trong vòng chọn phép khi đã học
  let rainbowAdded = false;
  function addRainbow() {
    if (rainbowAdded || !ctx.magic) return; rainbowAdded = true;
    ctx.magic.addSpell({ id: 'rainbow', name: 'Cầu Vồng', icon: '🌈', subjects: ['khoahoc'], learn: 'tách ánh sáng trắng thành 7 màu (đỏ, cam, vàng, lục, lam, chàm, tím).', hint: 'Niệm vào vật bị mất màu.',
      unlocked: () => S().ch > 4 || (S().ch === 4 && S().ti >= 2),
      cast: api => { api.burst(api.from, api.dir, '#ff6fae', 34, 8, 0.4); api.toast('🌈 <b>Cầu Vồng!</b> Ánh sáng trắng tách thành 7 màu: đỏ, cam, vàng, lục, lam, chàm, tím.', 4000); } });
  }

  // ---------- mảnh pha lê: khối lập phương trong suốt màu chương + viền trắng + cột sáng ----------
  const shard = new THREE.Group(); shard.visible = false; scene.add(shard);
  const shardMat = new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.86 });
  const sBox = new THREE.BoxGeometry(0.8, 0.8, 0.8); shard.add(new THREE.Mesh(sBox, shardMat)); shard.add(new THREE.LineSegments(new THREE.EdgesGeometry(sBox), new THREE.LineBasicMaterial({ color: '#fff' })));
  let shardPos = null;
  function placeShard() {
    const C = chap(); if (!C || S().ti < C.tasks.length) { shard.visible = false; shardPos = null; return; }
    const a = P(C.shard), o = C.shardOff || [0, 0], x = a[0] + o[0], z = a[1] + o[1];
    shardPos = [x, C.underwater ? terrain.heightAt(x, z) + 1.2 : gy(x, z) + 1.3, z]; shardMat.color.set(C.col); shard.visible = true;
  }

  // ---------- Bà Mù Màu (khối cơ bản, chương 8): xám → 7 màu sau phép Cầu Vồng ----------
  const boss = (() => {
    const g = new THREE.Group(), grey = () => new THREE.MeshLambertMaterial({ color: '#9a9a9a', flatShading: true });
    const parts = [[new THREE.CylinderGeometry(0.34, 0.89, 1.6, 8), 0.8], [new THREE.SphereGeometry(0.42, 10, 8), 1.9], [new THREE.ConeGeometry(0.62, 1.0, 8), 2.6], [new THREE.TorusGeometry(0.13, 0.04, 6, 12), 1.95]];
    const ms = parts.map(([geo, y], i) => { const m = new THREE.Mesh(geo, grey()); m.position.y = y; if (i === 3) { m.position.z = 0.4; const m2 = m.clone(); m2.material = m.material; m.position.x = -0.16; m2.position.x = 0.16; g.add(m2); } g.add(m); return m; });
    g.visible = false; scene.add(g);
    return { group: g, colorize() { ms.forEach((m, i) => m.material.color.setHSL(i / 4, 0.8, 0.62)); ctx.sfx && ctx.sfx('win'); }, grey() { ms.forEach(m => m.material.color.set('#9a9a9a')); } };
  })();

  const valley = createValley(ctx, VALLEY);
  const journal = createJournal(ctx, { S, save, CHAPTERS, say });

  // ---------- tiến trình ----------
  const target = () => {   // điểm dẫn đường hiện tại [x, z] (null: không có)
    const C = chap(); if (!C) return null; const T = task();
    if (!T) return shardPos ? [shardPos[0], shardPos[2]] : null;
    if (T.type === 'collect') { const left = pts.filter((_, i) => !(S().got || []).includes(i)); if (!left.length) return P(T.at); const p = player.pos; left.sort((a, b) => Math.hypot(a[0] - p.x, a[2] - p.z) - Math.hypot(b[0] - p.x, b[2] - p.z)); return [left[0][0], left[0][2]]; }
    if (T.type === 'cast' && T.boss) return [boss.group.position.x, boss.group.position.z];
    if (T.type === 'cast') { const c = casts.find(c => !c.lit && c.m.visible); if (c) return [c.m.position.x, c.m.position.z]; }
    return P(T.at);
  };
  function enterTask() {
    const s = S(); s.prog = 0; s.got = [];
    const T = task(); if (T && T.type === 'cond' && /bí mật/.test(T.text)) s.eggs0 = ctx.eggs ? Object.keys(ctx.eggs.found || {}).length : 0;
    if (T && T.type === 'cond' && /phép/.test(T.text)) s.castN = 0;
    if ((T && T.give === 'rainbow') || s.ch > 4 || (s.ch === 4 && s.ti >= 1)) addRainbow();   // đã học (kể cả khi tải lại giữa chừng)
    npc.visible = false; if (T && (T.type === 'talk' || T.type === 'quiz') && T.who !== 'mu' && T.who !== 'rong') { drawNpc(T.who); const [x, z] = P(T.at); npc.position.set(x, gy(x, z) + 2.6, z); npc.visible = true; }
    buildPicks(); buildCasts(); placeShard(); save(); render();
  }
  function advance() {
    const s = S(), T = task(); if (!T) return;
    s.ti++; ctx.sfx && ctx.sfx('ok'); journal.addXP(13, 'nhiệm vụ');
    if (s.ti >= chap().tasks.length) { enterTask(); ctx.toast(`✨ <b>${chap().name}</b> đã hiện ra! Theo cột sáng để nhặt.`, 5000); hud.classList.add('go'); }
    else { enterTask(); ctx.toast(`✅ Xong! Tiếp theo: <b>${esc(task().text)}</b>`, 4000); }
  }
  async function takeShard() {
    const s = S(), C = chap(); shard.visible = false; shardPos = null; if (!C) return; busy = true;
    ctx.sfx && ctx.sfx('win'); player.emote && player.emote('cheer');
    await say(C.outro, { cine: true, target: [player.pos.x, player.pos.z - 10] });
    journal.addXP(C.xp, C.name); ctx.reward && ctx.reward(C.sao, `Cốt truyện: ${C.name}`); journal.giveTitle(C.title);
    s.ch++; s.ti = 0; s.prog = 0; save();
    ctx.toast(`🧩 <b>${s.ch}/8 mảnh</b> Khối Rubik Pha Lê · +${C.xp} XP · +${C.sao} ⭐ · 🏅 ${C.title}`, 6000);
    if (s.ch >= CHAPTERS.length) { ctx.eggs && ctx.eggs.fireworks && ctx.eggs.fireworks(); boss.colorize(); busy = false; render(); return; }
    setTimeout(() => startChapter(), 2600);
  }
  let busy = false;
  async function startChapter() {
    const C = chap(); if (!C) return; busy = true;
    S().started = true; save(); enterTask();
    await say(C.intro, { cine: true, target: target() });
    busy = false; ctx.toast(`${C.icon} <b>Chương ${C.id}: ${C.name}</b> · ${C.region}<br>▸ ${esc(task() ? task().text : '')}`, 5000); render();
  }
  async function doTalk(T) {
    busy = true; await say(T.lines, {}); busy = false; advance();
  }
  async function doQuiz(T) {
    busy = true; if (T.lines && !S().prog) { await say(T.lines, {}); S().prog = 1; }
    const W0 = WHO[T.who] || WHO.ru, r = await ctx.learn.askSet({ s: T.s, tag: T.tag, n: T.n, need: T.need, title: `${W0.n}`, ava: W0.i });
    busy = false;
    if (r.ok) { ctx.toast(`🎉 Đúng ${r.n}/${T.n} câu — qua thử thách!`, 3000); advance(); }
    else ctx.toast(`💪 Đúng ${r.n}/${T.n} câu, cần ${T.need}. Ôn lại rồi thử lần nữa nhé — câu sai sẽ được hỏi lại!`, 5000);
  }

  // ---------- HUD ----------
  let lastHud = '';
  function render() {
    const s = S(), C = chap(), on = !!(ctx.account && ctx.account.profile) && s.started;
    hud.hidden = !on; if (!on) return;
    let h;
    if (!C) h = `<div class="t">🌈<span>Khối Rubik Pha Lê đã liền!</span><small>8/8</small></div><div class="d">Em là 🏅 Người Giữ Màu. Chạm để mở 📔 Sổ tay.</div>`;
    else {
      const T = task(), tgt = target(), p = player.pos, d = tgt ? Math.hypot(tgt[0] - p.x, tgt[1] - p.z) : 0;
      const sub = T ? (T.type === 'collect' ? ` (${(s.got || []).length}/${T.n})` : T.type === 'cast' && !T.boss ? ` (${s.prog}/${T.n})` : '') : '';
      h = `<div class="t">${C.icon}<span>Ch.${C.id} · ${esc(C.name)}</span><small>${Math.min(s.ti, C.tasks.length)}/${C.tasks.length} · 📔</small></div>
        <div class="k">▸ ${T ? esc(T.text) + sub : `Nhặt ${esc(C.name)} ✨`}</div>
        ${tgt && d > 5 ? `<div class="d">📍 ${d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1).replace('.', ',') + ' km'} · hướng ${dirName(tgt[0] - p.x, tgt[1] - p.z)}${T && T.hint ? ' · ' + esc(T.hint) : ''}</div>` : T && T.hint ? `<div class="d">${esc(T.hint)}</div>` : ''}
        <div class="bar"><u style="width:${(s.ch + Math.min(s.ti, C.tasks.length) / (C.tasks.length + 1)) / 8 * 100}%"></u></div>`;
    }
    if (h !== lastHud) { hud.innerHTML = h; lastHud = h; }
  }
  hud.onclick = () => journal.open();

  // ---------- vòng lặp ----------
  let t = 0, slow = 0, idle = 0, sat = 1, satMine = -1, satBase = 1;
  addEventListener('learn:answer', e => journal.onAnswer(e.detail));
  let mana0 = null;
  function update(dt) {
    t += dt; camCut(dt);
    const s = S(), C = chap(), T = task(), p = player.pos, logged = !!(ctx.account && ctx.account.profile);
    journal.update(dt);
    // thế giới mất màu: bão hoà = 0,618 + 0,382 × số mảnh / 8 (nhân vào giá trị ambience.js đặt mỗi khung)
    const G = ctx.post && ctx.post.grade; if (G) { const want = !logged || !s.started ? 1 : 0.618 + 0.382 * Math.min(8, s.ch) / 8; sat += (want - sat) * Math.min(1, dt * 0.618); if (G.uSat.value !== satMine) satBase = G.uSat.value; satMine = G.uSat.value = satBase * sat; }
    valley.update(dt, s.ch > 5 || (s.ch === 5 && s.ti >= 1));
    boss.group.visible = s.ch === 7 && s.ti >= 1;
    if (s.ch === 7 && !boss.placed) { const [x, z] = P(CHAPTERS[7].tasks[1].at); boss.group.position.set(x + 2, gy(x + 2, z), z - 2); boss.placed = true; }
    // tự mở chương 1 lần đầu: đã vào tài khoản, hướng dẫn chơi xong, không bảng nào mở, đứng 3 s
    if (logged && !s.started && !busy) { const now = performance.now(); if (player.frozen || (ctx.tutorial && ctx.tutorial.open) || (ctx.intro && ctx.intro.open) || document.body.classList.contains('rs-modal') || ctx.mgActive || !idle) idle = now; else if (now - idle > 3000) { idle = 0; startChapter(); } }   // đồng hồ thật (máy chậm: dt bị chặn)
    if (logged && s.started && C && !picks.userData.ok) { picks.userData.ok = true; enterTask(); }
    // mũi tên + chấm + cột sáng
    const tgt = s.started && C && !cut && !busy ? target() : null, guide = !!tgt && !player.frozen && !ctx.mgActive;
    let d = 0;
    if (guide) {
      const dx = tgt[0] - p.x, dz = tgt[1] - p.z; d = Math.hypot(dx, dz); const ux = dx / (d || 1), uz = dz / (d || 1), show = d > 4;
      arrow.visible = dots.visible = show;
      if (show) {
        arrow.position.set(p.x + ux * 1.6, p.y + 0.35 + Math.sin(t * PHI * 2) * 0.08, p.z + uz * 1.6); arrow.rotation.y = Math.atan2(ux, uz);
        const n = Math.min(DOTS, Math.floor((d - 3) / 2.6)), ph = (t * 1.618) % 1;
        for (let i = 0; i < DOTS; i++) {
          if (i >= n) { m4.makeScale(0, 0, 0); dots.setMatrixAt(i, m4); continue; }
          const k = 3 + (i + ph) * 2.6, x = p.x + ux * k, z = p.z + uz * k, y = Math.max(gy(x, z), W) + 0.3;
          const sc = 1 - i / DOTS * 0.618; m4.compose(p4.set(x, y, z), q4, s4.set(sc, sc, sc)); dots.setMatrixAt(i, m4);
        }
        dots.instanceMatrix.needsUpdate = true;
      }
      beam.visible = d > 8; if (beam.visible) beam.position.set(tgt[0], gy(tgt[0], tgt[1]), tgt[1]);
    } else arrow.visible = dots.visible = beam.visible = false;
    // vật nhặt
    const got = s.got || [];
    for (let i = 0; i < MAXP; i++) {
      const live = T && T.type === 'collect' && i < pts.length && !got.includes(i);
      if (labels[i]) labels[i].visible = !!live;
      if (!live) { m4.makeScale(0, 0, 0); picks.setMatrixAt(i, m4); pbeams.setMatrixAt(i, m4); continue; }
      const [x, y, z] = pts[i], yy = y + 1 + Math.sin(t * 2 + i) * 0.13;
      m4.compose(p4.set(x, yy, z), q4.setFromAxisAngle(_v.set(0, 1, 0), t * 2 * Math.PI / PHI + i), s4.set(1, 1, 1)); picks.setMatrixAt(i, m4);
      m4.compose(p4.set(x, y, z), q4.identity(), s4); pbeams.setMatrixAt(i, m4);
      if (labels[i]) labels[i].position.set(x, yy + 1.1, z);
      if (Math.hypot(p.x - x, p.z - z) < 1.8 && Math.abs(p.y - y) < 3) {
        got.push(i); s.got = got; ctx.sfx && ctx.sfx('ok'); save();
        ctx.toast(`${T.icon} ${T.labels ? `Chữ <b>${T.labels[i]}</b> · ` : ''}${got.length}/${T.n}${got.length >= T.n ? ' — đủ rồi!' : ''}`, 2200);
        if (got.length >= T.n) advance();
      }
    }
    picks.instanceMatrix.needsUpdate = pbeams.instanceMatrix.needsUpdate = true;
    // mảnh pha lê
    if (shard.visible && shardPos) {
      shard.position.set(shardPos[0], shardPos[1] + Math.sin(t * 2) * 0.15, shardPos[2]); shard.rotation.set(t * 0.618, t * 2 * Math.PI / PHI / 2, 0);
      const dd = Math.hypot(p.x - shardPos[0], p.z - shardPos[2]), dy = Math.abs(p.y - shardPos[1]);
      if (dd < 2 && dy < 3 && !busy) takeShard();
    } else if (!shardPos && C && s.ti >= C.tasks.length && s.started && !busy) placeShard();
    if (npc.visible && (npcT -= dt) <= 0) { npcT = 1; npc.position.y = gy(npc.position.x, npc.position.z) + 2.6; }
    if (ctx.magic) { const m = ctx.magic.mana; if (mana0 != null && m < mana0 - 1) s.castN = (s.castN | 0) + 1; mana0 = m; }   // niệm phép = năng lượng tụt
    // nhiệm vụ hiện tại
    if (T && s.started && !busy && !cut) {
      const at = P(T.at), dd = Math.hypot(p.x - at[0], p.z - at[1]);
      if (T.type === 'goto' && dd < (T.r || 8)) advance();
      else if (T.type === 'talk' && dd < (T.r || 5) + 3) ctx.offer(`💬 Nói chuyện với ${WHO[T.who].n}`, () => doTalk(T), 9);
      else if (T.type === 'quiz' && dd < 8) ctx.offer(`📚 ${esc(T.text)}`, () => doQuiz(T), 9);
      else if (T.type === 'cond') {
        const now = performance.now(); if (now - slow > 250) { slow = now; try { if (T.test(ctx, s)) advance(); } catch (e) {} }
      }
    }
    // HUD: ngay dưới ô nhiệm vụ hằng ngày
    if ((idleHud -= dt) <= 0) { idleHud = 0.5; const q = document.getElementById('questHud'); if (q && q.offsetHeight) { const b = Math.round(q.getBoundingClientRect().bottom + 8) + 'px'; if (hud.style.top !== b) hud.style.top = b; } render(); }
  }
  let idleHud = 0, npcT = 0;
  if (ctx.account) ctx.account.onChange(() => { picks.userData.ok = false; boss.placed = false; lastHud = ''; render(); });

  const api = ctx.story = {
    update, say, journal, state: S, start: startChapter, target,
    jump(ch, ti = 0) { const s = S(); s.ch = ch; s.ti = ti; s.started = true; boss.placed = false; enterTask(); },   // gỡ lỗi / chụp ảnh
    get busy() { return busy; }, get cut() { return !!cut; },
  };
  return api;
}
