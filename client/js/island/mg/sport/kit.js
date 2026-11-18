// kit.js — Đồ dùng chung cho nhóm mini game Thể thao (Olympics, Arcade, Câu cá):
//   arena()  : sân khấu 3D riêng (scene + camera + ánh sáng toon), mượn RenderPass của hậu kỳ để vẫn có tone mapping/bloom
//   hud()    : thanh trên (tên, điểm, Thoát/Esc), lời nhắc, bảng chọn, nút lớn cho 1 tay
//   tapper() : nhập 1 tay: chạm / giữ / vuốt (điện thoại) = Space / phím mũi tên (máy tính)
//   sfx()    : âm thanh tự tổng hợp bằng WebAudio (không cần file)
//   kid()    : học sinh toon (people-model.js) · crowd(): khán đài cổ vũ (InstancedMesh) · store(): điểm cao (localStorage)
// Tỷ lệ vàng: khoảng cách camera, cỡ chữ, nhịp hiệu ứng theo φ / Fibonacci.
import * as THREE from 'three';
import { PHI, FIB } from '../../layout.js';
import { gradientMap } from '../../style.js';
import { loadHero } from '../../characters.js';
export { PHI, FIB };
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------- Lưu điểm cao (an toàn khi trình duyệt chặn bộ nhớ) ----------
export const store = {
  get(k, d = null) { try { const v = localStorage.getItem('mg.sport.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mg.sport.' + k, JSON.stringify(v)); } catch (e) {} },
  best(k, v, lower = false) { const b = store.get('best.' + k); if (b == null || (lower ? v < b : v > b)) { store.set('best.' + k, v); return true; } return false; },
};

// ---------- Vật liệu toon theo đỉnh màu (gộp khối → ít draw call) ----------
const _c = new THREE.Color();
export const vmat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
export function paint(geo, color) {
  if (geo.index) geo = geo.toNonIndexed();
  for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  _c.set(color); const n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo;
}
// Gom nhiều khối: b.add(geo, màu, x, y, z, ry, sx, sy, sz) → b.mesh()
export function batch() {
  const list = [], o = new THREE.Object3D();
  return {
    add(geo, color, x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
      o.position.set(x, y, z); o.rotation.set(rx, ry, rz, 'YXZ'); o.scale.set(sx, sy, sz); o.updateMatrix();
      list.push(paint(geo.clone().applyMatrix4(o.matrix), color)); return this;
    },
    box(w, h, d, x, y0, z, color, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), color, x, y0 + h / 2, z, ry); },
    mesh(mat = vmat, shadow = true) {
      if (!list.length) return new THREE.Group();
      let n = 0; for (const g of list) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let k = 0;
      for (const g of list) { pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3); col.set(g.attributes.color.array, k * 3); k += g.attributes.position.count; g.dispose(); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeBoundingSphere(); const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; list.length = 0; return m;
    },
  };
}
// Chữ trên mặt phẳng (biển số, đáp án): canvas → texture
export function textSprite(text, { size = 1, color = '#fff', bg = 'rgba(27,22,38,.78)', font = 'bold 64px system-ui', w = 256, h = 128 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const k = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false })); sp.scale.set(size * w / h, size, 1);
  sp.userData.set = (t, cc = color, bb = bg) => { k.clearRect(0, 0, w, h); if (bb) { k.fillStyle = bb; k.beginPath(); k.roundRect(4, 4, w - 8, h - 8, h / PHI / 2); k.fill(); } k.fillStyle = cc; k.font = font; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(t, w / 2, h / 2 + 4, w - 16); tex.needsUpdate = true; };
  sp.userData.set(text); return sp;
}

// ---------- Âm thanh tự tổng hợp ----------
let AC = null, OUT = null;
export function sfx(ctx) {
  const get = () => {
    if (!AC) { AC = THREE.AudioContext.getContext(); const L = ctx.camera.children.find(o => o.isAudioListener); OUT = L ? L.getInput() : AC.destination; }
    if (AC.state !== 'running') AC.resume().catch(() => {}); return AC;
  };
  const tone = (f, d = 0.12, type = 'sine', vol = 0.18, f2 = null, delay = 0) => {
    try {
      const a = get(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(OUT); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  };
  const noise = (d = 0.3, type = 'bandpass', f = 1200, vol = 0.2, q = 0.8, delay = 0) => {
    try {
      const a = get(), t = a.currentTime + delay, n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = vol;
      s.connect(fl).connect(g).connect(OUT); s.start(t);
    } catch (e) {}
  };
  return {
    tone, noise,
    tap: () => tone(660, 0.05, 'triangle', 0.08),
    ok: () => { tone(523, 0.1, 'triangle', 0.16); tone(784, 0.16, 'triangle', 0.16, null, 0.09); },
    bad: () => tone(220, 0.25, 'sawtooth', 0.08, 150),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, null, i * 0.12)),
    whistle: () => { tone(2300, 0.45, 'square', 0.05, 2500); },
    beep: (hi) => tone(hi ? 988 : 494, hi ? 0.4 : 0.18, 'square', 0.07),
    splash: () => noise(0.5, 'lowpass', 900, 0.35),
    plop: () => { tone(380, 0.12, 'sine', 0.2, 120); noise(0.15, 'bandpass', 900, 0.12); },
    cheer: (d = 1.6) => { noise(d, 'bandpass', 1400, 0.16, 0.4); noise(d * 0.8, 'bandpass', 2600, 0.07, 1.2, 0.1); },
    kick: () => { tone(160, 0.1, 'sine', 0.3, 60); noise(0.06, 'highpass', 2000, 0.1); },
    reel: () => noise(0.05, 'highpass', 3500, 0.05),
    engine: null,
  };
}

// ---------- Sân khấu 3D riêng: mượn RenderPass của hậu kỳ (giữ màu/tone mapping chung của game) ----------
// api (mg/host.js): có host → sân đặt NGAY TRONG thế giới: scene = nhóm con của api.root (dời center về tâm khu chơi), bầu trời/đèn/sương
// của thế giới, camera riêng (cục bộ) được host đổi sang camera thế giới. Không host → sân khấu riêng như cũ.
export function arena(ctx, { sky = ['#7cc6ff', '#dff1ff'], fog = [60, 260], sun = [30, 55, 20], shadow = 60, api = null, center = [0, 0] } = {}) {
  if (api) {
    const scene = new THREE.Group(), cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 700); scene.position.set(-center[0], 0, -center[1]); api.root.add(scene);
    api.useCamera(cam, scene); api.hidePlayer();
    const resize = () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }; addEventListener('resize', resize);
    const dl = new THREE.Object3D(); dl.target = new THREE.Object3D();
    return { scene, cam, sun: dl, dome: new THREE.Object3D(), inWorld: true, follow() {}, begin(hook) { this._hook = hook; }, end() {}, dispose() { removeEventListener('resize', resize); scene.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (m === vmat) m.userData.shared = true; }); } };
  }
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 700);
  scene.fog = new THREE.Fog(sky[1], fog[0], fog[1]);
  // bầu trời: bán cầu màu chuyển (không ảnh hưởng sương mù)
  const sg = new THREE.SphereGeometry(500, 24, 12), sp = sg.attributes.position, sc = new Float32Array(sp.count * 3), a = new THREE.Color(sky[0]), b = new THREE.Color(sky[1]);
  for (let i = 0; i < sp.count; i++) { _c.copy(b).lerp(a, clamp(sp.getY(i) / 260, 0, 1) ** (1 / PHI)); sc.set([_c.r, _c.g, _c.b], i * 3); }
  sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const dome = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -1; scene.add(dome);
  scene.add(new THREE.HemisphereLight('#fff6e8', '#7a8f6a', 1.25));
  const dl = new THREE.DirectionalLight('#fff2d8', 2.2); dl.position.set(...sun); dl.castShadow = true;
  const S = dl.shadow; S.mapSize.set(1024, 1024); S.camera.left = S.camera.bottom = -shadow / 2; S.camera.right = S.camera.top = shadow / 2; S.camera.far = 200; S.bias = -0.0006; S.normalBias = 0.02;
  scene.add(dl, dl.target);
  const rp = ctx.post && ctx.post.composer && ctx.post.composer.passes[0];
  let saved = null, on = false, origRender = null, hook = null;
  const resize = () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  const self = {
    scene, cam, sun: dl, dome,
    // gắn đèn theo điểm nhìn (bóng đổ sắc nét quanh nhân vật)
    follow(x, z) { dl.position.set(x + sun[0], sun[1], z + sun[2]); dl.target.position.set(x, 0, z); dome.position.set(x, 0, z); },
    begin(beforeRender) {
      if (on) return; on = true; hook = beforeRender || null;
      if (rp) { saved = { scene: rp.scene, camera: rp.camera }; rp.scene = scene; rp.camera = cam; }
      origRender = ctx.post.render; const g = ctx.post.grade;
      ctx.post.render = () => { if (g && g.uRays) g.uRays.value = 0; hook && hook(); origRender.call(ctx.post); };
      addEventListener('resize', resize); resize();
    },
    end() {
      if (!on) return; on = false; removeEventListener('resize', resize);
      if (rp && saved) { rp.scene = saved.scene; rp.camera = saved.camera; }
      ctx.post.render = origRender;
    },
    dispose() {
      self.end();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { if (m !== vmat) { m.map && m.map.dispose(); m.dispose(); } }); });
      dl.shadow.map && dl.shadow.map.dispose();
    },
  };
  return self;
}
// Chỉ chèn 1 hàm chạy ngay trước khi vẽ (dùng khi chơi ngay trong thế giới, vd câu cá: đặt camera sau player.update)
export function preRender(ctx, fn) {
  const orig = ctx.post.render; ctx.post.render = () => { fn(); orig.call(ctx.post); };
  return () => { ctx.post.render = orig; };
}

// ---------- Khoá điều khiển thế giới khi đang chơi ----------
export function lockWorld(ctx) {
  const was = ctx.player.frozen; ctx.player.frozen = true; document.body.classList.add('mg-on', 'rs-modal');
  return () => { ctx.player.frozen = was; document.body.classList.remove('mg-on', 'rs-modal'); };
}

// ---------- HUD (giao diện chung, cỡ chữ theo φ) ----------
const CSS = `
#mgS{position:fixed;inset:0;z-index:40;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;-webkit-user-select:none;user-select:none}
#mgS *{box-sizing:border-box}
#mgS .top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) 10px max(12px,env(safe-area-inset-left));background:linear-gradient(#1b1626cc,#1b162600)}
#mgS .ttl{font:800 16px system-ui;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mgS .sc{margin-left:auto;font:800 16px system-ui;color:#ffd27a;white-space:nowrap}
#mgS button{pointer-events:auto;font:800 15px system-ui;border:2px solid #fff8;border-radius:21px;padding:8px 13px;background:#1b1626b8;color:#fff;cursor:pointer;touch-action:manipulation}
#mgS .x{background:#d2553fd8}
#mgS .msg{position:absolute;left:50%;top:21%;transform:translate(-50%,-50%);font:900 clamp(26px,6.5vw,42px) system-ui;text-align:center;text-shadow:0 3px 0 #3d2b3f,0 0 13px #0008;opacity:0;transition:opacity .25s;white-space:pre-line;width:92%}
#mgS .tip{position:absolute;left:50%;bottom:calc(max(13px,env(safe-area-inset-bottom)) + 8px);transform:translateX(-50%);background:#1b1626c8;border-radius:13px;padding:8px 13px;font:600 14px system-ui;text-align:center;width:min(92%,520px);line-height:1.38}
#mgS .tip:empty{display:none}
#mgS.inw{z-index:29}#mgS.inw .msg{top:28%}
#mgS .bar{position:absolute;left:50%;transform:translateX(-50%);width:min(70%,340px);height:13px;border-radius:8px;background:#0006;border:2px solid #fff9;overflow:hidden}
#mgS .bar i{display:block;height:100%;width:0;background:#ffd27a;border-radius:6px}
#mgS .act{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 55px);display:flex;flex-direction:column;gap:8px;align-items:flex-end}
#mgS .act button{min-width:89px;min-height:55px;font-size:17px;border-radius:28px;background:#f0a23aee;border-color:#fff}
#mgS .panel{position:absolute;inset:0;display:grid;place-items:center;background:#0a1a2a99;pointer-events:auto;padding:13px}
#mgS .card{width:min(100%,440px);max-height:88vh;overflow:auto;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:16px 16px 13px;border-top:8px solid #f0a23a;text-align:center;box-shadow:0 8px 34px #0006}
#mgS .card h2{margin:2px 0 8px;font:900 22px system-ui}#mgS .card p{margin:6px 0;font:500 14px/1.5 system-ui}
#mgS .card .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
#mgS .card button{background:#efe3cc;color:#3a2a1a;border:2px solid transparent;border-radius:13px;padding:12px 8px;font:800 15px system-ui;line-height:1.25}
#mgS .card button small{display:block;font:600 12px system-ui;opacity:.7;margin-top:3px}
#mgS .card button.go{background:#f0a23a;color:#fff}#mgS .card button.ok{background:#c9efc9;border-color:#3fa36b}#mgS .card button.no{background:#ffd0c8;border-color:#d2553f}
#mgS .card .wide{grid-column:1/-1}
@media(max-width:380px){#mgS .card .grid{grid-template-columns:1fr}}
@media(max-width:600px){#mgS .act{bottom:calc(max(18px,env(safe-area-inset-bottom)) + 89px)}}
body.mg-on #bAct,body.mg-on .btns,body.mg-on .topbtns,body.mg-on #joy,body.mg-on #bSound,body.mg-on #inv,body.mg-on .vbtns,body.mg-on #bMap,body.mg-on #brightBox,body.mg-on #hud,body.mg-on #info{display:none!important}`;
// api (mg/host.js): có host → dùng thanh trên của host (tên, điểm, ✕ Thoát, Esc) — HUD này chỉ còn lời nhắc, nút lớn, bảng chọn
export function hud(title, onExit, api = null) {
  if (!document.getElementById('mgSCss')) { const s = document.createElement('style'); s.id = 'mgSCss'; s.textContent = CSS; document.head.appendChild(s); }
  const root = document.createElement('div'); root.id = 'mgS';
  root.innerHTML = `<div class="top"><button class="x">✕ Thoát</button><div class="ttl"></div><div class="sc"></div></div><div class="msg"></div><div class="tip"></div><div class="act"></div>`;
  if (api) { root.classList.add('inw'); root.querySelector('.top').remove(); api.hud.title(title); }
  document.body.appendChild(root);
  const $ = s => root.querySelector(s), msgEl = $('.msg'); let mt = 0;
  if (!api) { $('.ttl').textContent = title; $('.x').onclick = () => onExit && onExit(); }
  const esc = e => { if (e.code === 'Escape') { e.preventDefault(); onExit && onExit(); } }; if (!api) addEventListener('keydown', esc);   // có host: Esc do host xử lý
  const h = {
    root,
    title: t => api ? api.hud.title(t) : $('.ttl').textContent = t,
    score: t => api ? api.hud.info(t) : $('.sc').innerHTML = t,
    tip: t => $('.tip').innerHTML = t || '',
    msg(t, ms = 1300) { msgEl.textContent = t; msgEl.style.opacity = 1; clearTimeout(mt); if (ms) mt = setTimeout(() => msgEl.style.opacity = 0, ms); },
    bar(top = '58px', color = '#ffd27a') { const b = document.createElement('div'); b.className = 'bar'; b.style.top = top; b.innerHTML = '<i></i>'; b.firstChild.style.background = color; root.appendChild(b); return { el: b, set: v => b.firstChild.style.width = (clamp(v, 0, 1) * 100).toFixed(1) + '%', color: c => b.firstChild.style.background = c, show: v => b.style.display = v ? '' : 'none' }; },
    // nút hành động lớn bên phải (1 tay); trả về phần tử nút
    action(label, fn) { const b = document.createElement('button'); b.textContent = label; b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); fn(e); }); $('.act').appendChild(b); return b; },
    clearActions() { $('.act').innerHTML = ''; },
    // bảng: { title, html, buttons:[{label, sub, cls, wide, fn}] }
    panel({ title: t = '', html = '', buttons = [], color }) {
      h.closePanel(); const p = document.createElement('div'); p.className = 'panel';
      p.innerHTML = `<div class="card"${color ? ` style="border-top-color:${color}"` : ''}><h2></h2><div class="body">${html}</div><div class="grid"></div></div>`;
      p.querySelector('h2').textContent = t; const g = p.querySelector('.grid');
      for (const b of buttons) { const el = document.createElement('button'); el.innerHTML = b.label + (b.sub ? `<small>${b.sub}</small>` : ''); if (b.cls) el.className = b.cls; if (b.wide) el.classList.add('wide'); el.onclick = e => { e.stopPropagation(); b.fn && b.fn(el); }; g.appendChild(el); }
      p.addEventListener('pointerdown', e => e.stopPropagation()); root.appendChild(p); h._p = p; return p;
    },
    closePanel() { if (h._p) { h._p.remove(); h._p = null; } },
    get open() { return !!h._p; },
    dispose() { removeEventListener('keydown', esc); clearTimeout(mt); root.remove(); },
  };
  return h;
}

// ---------- Nhập 1 tay ----------
// taps: số lần chạm từ khung trước · held: đang giữ · dx: vuốt ngang chuẩn hoá (-1..1) · swipe: {dx, dy, t} khi thả tay
export function tapper(el = document.body) {
  const st = { taps: 0, held: false, holdT: 0, x: 0, y: 0, x0: 0, y0: 0, t0: 0, dx: 0, swipe: null, side: 0, keys: new Set(), enabled: true };
  const down = e => {
    if (!st.enabled || e.target.closest && e.target.closest('button,.panel')) return;
    st.taps++; st.held = true; st.holdT = 0; st.x = st.x0 = e.clientX; st.y = st.y0 = e.clientY; st.t0 = performance.now(); st.side = e.clientX < innerWidth / 2 ? -1 : 1;
  };
  const move = e => { if (!st.held) return; st.x = e.clientX; st.y = e.clientY; st.dx = clamp((st.x - st.x0) / (innerWidth / PHI / 2), -1, 1); };
  const up = e => { if (!st.held) return; st.held = false; st.swipe = { dx: (st.x - st.x0) / innerHeight, dy: (st.y - st.y0) / innerHeight, t: (performance.now() - st.t0) / 1000 }; st.dx = 0; st.side = 0; };
  const kd = e => { if (e.repeat) return; st.keys.add(e.code); if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { st.taps++; st.held = true; st.holdT = 0; e.preventDefault(); } };
  const ku = e => { st.keys.delete(e.code); if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && st.held) { st.held = false; st.swipe = { dx: 0, dy: -0.3, t: 0.3, key: true }; } };
  el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  st.steer = () => { const k = (st.keys.has('ArrowRight') || st.keys.has('KeyD') ? 1 : 0) - (st.keys.has('ArrowLeft') || st.keys.has('KeyA') ? 1 : 0); return k || (st.held ? (Math.abs(st.dx) > 0.08 ? st.dx : st.side * 0.85) : 0); };
  st.take = () => { const n = st.taps; st.taps = 0; return n; };
  st.takeSwipe = () => { const s = st.swipe; st.swipe = null; return s; };
  st.tick = dt => { if (st.held) st.holdT += dt; };
  st.dispose = () => { el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); removeEventListener('keydown', kd); removeEventListener('keyup', ku); };
  return st;
}

// ---------- Học sinh toon (cùng kiểu với nhân vật chính) ----------
const KIDS = ['male-a', 'female-a', 'male-b', 'female-b', 'male-c', 'female-c', 'male-d', 'female-d', 'male-e', 'female-e', 'male-f', 'female-f'].map(v => 'student-' + v);
export async function kid(kind, look, height = 1.25) {
  const h = await loadHero(kind || pick(KIDS), height, look || null);
  if (!h) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 3, 8), new THREE.MeshToonMaterial({ color: '#f0a23a', gradientMap }))); g.children[0].position.y = 0.6; return { model: g, anim: { play() {}, update() {}, has: () => false, actions: {} }, set: {}, fake: true }; }
  h.model.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return h;
}
export const kidKinds = KIDS;
// đồng phục thể thao theo đội (sơ mi = áo thi đấu)
export const TEAM = ['#e8453c', '#3d8fd9', '#3fa36b', '#f2b134', '#9a5ad6', '#ff7aa8'];
export const sportLook = i => ({ role: 'student', shirt: TEAM[i % TEAM.length], pants: '#2a2f4a', bag: null, acc: null });
// chạy animation theo tên (bỏ qua nếu thiếu)
export function play(h, name, fade = 0.2, ts = 1, once = false) { if (!h || !h.anim) return null; const N = h.set || {}; const a = h.anim.play(N[name] || name, fade, once); if (a) a.timeScale = ts; return a; }

// ---------- Khán đài cổ vũ: bậc ngồi + khán giả (2 InstancedMesh) nhún nhảy theo mức phấn khích ----------
export function crowd(scene, { x = 0, z = 0, len = 34, rows = 5, ry = 0, step = 0.62, rise = 0.5 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const b = batch();
  for (let r = 0; r < rows; r++) b.box(len, rise * (r + 1), step, 0, 0, -r * step, r % 2 ? '#d9cfc0' : '#c9bfae');
  b.box(len + 0.4, rise * rows + 1.3, 0.3, 0, 0, -rows * step - 0.1, '#8fa3b8');
  for (let i = -1; i <= 1; i += 2) b.box(0.3, rise * rows + 1.6, rows * step + 0.4, i * len / 2, 0, -rows * step / 2 + 0.2, '#e8453c');
  g.add(b.mesh());
  const per = Math.floor(len / 0.8), n = per * rows;
  const body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.2, 0.32, 2, 6), new THREE.MeshToonMaterial({ gradientMap }), n);
  const head = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.19, 1), new THREE.MeshToonMaterial({ gradientMap }), n);
  const SK = ['#f5cfa8', '#efc09a', '#e6b48c', '#f7d8b8'], HA = '#2a1d16', seats = [];
  for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) {
    if (Math.random() < 0.13) continue; const k = seats.length;
    seats.push({ x: -len / 2 + 0.4 + i * 0.8 + rnd(-0.12, 0.12), y: rise * (r + 1), z: -r * step - step / 2, ph: Math.random() * TAU, sp: rnd(0.8, 1.3) });
    body.setColorAt(k, _c.set(pick(TEAM)).offsetHSL(0, 0, rnd(-0.06, 0.06))); head.setColorAt(k, _c.set(Math.random() < 0.85 ? HA : pick(SK)));
  }
  body.count = head.count = seats.length; body.castShadow = true; g.add(body, head);
  const o = new THREE.Object3D(); let t = 0, ex = 0.2, frame = 0;
  const place = () => {
    seats.forEach((s, k) => {
      const j = Math.max(0, Math.sin(t * 6.5 * s.sp + s.ph)) * 0.32 * ex, w = Math.sin(t * 3 + s.ph) * 0.05;
      o.position.set(s.x, s.y + 0.38 + j, s.z); o.rotation.set(0, 0, w); o.scale.setScalar(1); o.updateMatrix(); body.setMatrixAt(k, o.matrix);
      o.position.y += 0.42; o.updateMatrix(); head.setMatrixAt(k, o.matrix);
    });
    body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
  };
  place(); body.computeBoundingSphere(); head.computeBoundingSphere();
  return {
    group: g,
    excite(v) { ex = Math.max(ex, v); },
    update(dt) { t += dt; ex = Math.max(0.15, ex - dt * 0.38); if (++frame % 2 === 0) place(); },
  };
}

// cờ đuôi nheo, phông nền: dải tam giác màu
export function bunting(b, x0, z0, x1, z1, y, n = 21) {
  const tri = new THREE.ConeGeometry(0.22, 0.42, 3).rotateX(Math.PI);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, s = Math.sin(t * Math.PI) * 0.6; b.add(tri, TEAM[i % TEAM.length], lerp(x0, x1, t), y - s - 0.2, lerp(z0, z1, t), Math.atan2(x1 - x0, z1 - z0)); }
}

// Câu hỏi phép tính nhanh (theo độ khó 1..3): { q, a, choices }
export function mathQ(level = 1) {
  const L = clamp(level, 1, 3), r = (a, b) => Math.floor(rnd(a, b + 1));
  let q, a; const t = r(0, L >= 2 ? 3 : 1);
  if (t === 0) { const x = r(2, 9 + L * 10), y = r(2, 9 + L * 10); q = `${x} + ${y}`; a = x + y; }
  else if (t === 1) { const x = r(10, 20 + L * 15), y = r(1, x - 1); q = `${x} − ${y}`; a = x - y; }
  else if (t === 2) { const x = r(2, 9), y = r(2, L >= 3 ? 12 : 9); q = `${x} × ${y}`; a = x * y; }
  else { const y = r(2, 9), a0 = r(2, 9); q = `${a0 * y} : ${y}`; a = a0; }
  const set = new Set([a]); while (set.size < 3) { const d = a + pick([-10, -2, -1, 1, 2, 10, 3, -3]); if (d >= 0) set.add(d); }
  return { q, a, choices: [...set].sort(() => Math.random() - 0.5) };
}
