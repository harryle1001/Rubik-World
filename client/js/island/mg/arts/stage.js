// stage.js — Sân khấu dùng chung cho mini game 3D nhóm Mỹ thuật · Thư viện · Thiên văn.
// Mỗi game có cảnh 3D riêng (scene + camera riêng) vẽ bằng renderer của đảo: khi game mở, post.render của đảo được thay
// tạm bằng hàm vẽ cảnh game (đảo không phải vẽ → nhẹ máy), đóng game thì trả lại. HUD DOM gọn, nút ✖ Thoát, phím Esc,
// chạm/kéo trên điện thoại. Kích thước theo φ (HUD, cỡ chữ 13 → 21 px ≈ ×φ, bo góc 8/13 px).
// Logic game chạy trong tick(dt) — gọi từ update(dt) của host (mg/host.js); nếu chưa có host, sân khấu tự gọi mỗi khung hình.
import * as THREE from 'three';
import { toon, gradientMap, addOutline, outlineMat } from '../../style.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { PHI } from '../../layout.js';
export { PHI };
export const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
export const T = (c, o) => toon(c, o);

// ---------- Lưu tiến độ (localStorage, try/catch) ----------
export const store = {
  get(k, d) { try { const v = localStorage.getItem('mg.arts.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mg.arts.' + k, JSON.stringify(v)); } catch (e) {} },
};

// ---------- Âm thanh tự tổng hợp (WebAudio, không file, không bản quyền) ----------
let AC = null, OUT = null;
const soundOn = () => { try { return localStorage.getItem('island.sound') !== '0'; } catch (e) { return true; } };
export function ac() {
  if (!AC) { try { AC = THREE.AudioContext.getContext(); OUT = AC.createGain(); OUT.gain.value = 0.55; OUT.connect(AC.destination); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume().catch(() => {});
  return AC;
}
export const NOTE_VI = ['Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
// kind: 'piano' | 'bau' (đàn bầu: 1 dây, luyến cao độ) | 'drum' | 'tom' | 'bell' | 'pop' | 'ok' | 'bad' | 'whoosh'
export function play(kind, hz = 440, dur = 0.6, vol = 0.5) {
  if (!soundOn()) return; const a = ac(); if (!a) return; const t = a.currentTime;
  const env = (g, at, peak, rel) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + rel); };
  const osc = (type, f, g0, at, rel, bend) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (bend) bend(o.frequency); env(g, at, g0, rel); o.connect(g).connect(OUT); o.start(t); o.stop(t + rel + 0.05); return o; };
  const noise = (d, type, f, v) => { const n = a.sampleRate * d | 0, b = a.createBuffer(1, n, a.sampleRate), c = b.getChannelData(0); for (let i = 0; i < n; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = type; fl.frequency.value = f; g.gain.value = v; s.connect(fl).connect(g).connect(OUT); s.start(t); };
  if (kind === 'piano') { osc('triangle', hz, vol * 0.7, 0.005, dur * 1.6); osc('sine', hz * 2, vol * 0.18, 0.005, dur * 0.8); osc('sine', hz * 3, vol * 0.06, 0.005, dur * 0.4); }
  else if (kind === 'bau') { const v = (f) => { f.setValueAtTime(hz, t); f.linearRampToValueAtTime(hz * 1.03, t + dur * 0.5); f.linearRampToValueAtTime(hz, t + dur); }; osc('sine', hz, vol * 0.8, 0.02, dur * 1.8, v); osc('sine', hz * 2, vol * 0.25, 0.02, dur * 1.2, v); }
  else if (kind === 'drum') { osc('sine', 150, vol, 0.003, 0.45, f => f.exponentialRampToValueAtTime(48, t + 0.4)); noise(0.06, 'lowpass', 900, vol * 0.4); }
  else if (kind === 'tom') { osc('sine', 260, vol * 0.8, 0.003, 0.25, f => f.exponentialRampToValueAtTime(140, t + 0.22)); noise(0.03, 'highpass', 2500, vol * 0.3); }
  else if (kind === 'bell') { osc('sine', hz, vol * 0.5, 0.003, dur * 2); osc('sine', hz * 2.76, vol * 0.15, 0.003, dur); }
  else if (kind === 'pop') { osc('sine', hz, vol * 0.5, 0.003, 0.12, f => f.exponentialRampToValueAtTime(hz * 1.6, t + 0.1)); }
  else if (kind === 'ok') { [0, 4, 7, 12].forEach((s, i) => setTimeout(() => play('bell', midiHz(72 + s), 0.3, vol * 0.6), i * 89)); }
  else if (kind === 'bad') { osc('square', 196, vol * 0.18, 0.005, 0.3, f => f.linearRampToValueAtTime(140, t + 0.28)); }
  else if (kind === 'whoosh') noise(0.4, 'bandpass', 700, vol * 0.5);
}

// ---------- Chữ trên canvas → texture ----------
export function textTex(lines, { w = 512, h = 256, bg = '#fff6df', fg = '#3b2a1e', size = 34, font = 'system-ui', align = 'left', pad = 26, title } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const k = c.getContext('2d');
  if (bg) { k.fillStyle = bg; k.fillRect(0, 0, w, h); }
  k.fillStyle = fg; k.textBaseline = 'top'; k.textAlign = align; let y = pad; const x = align === 'center' ? w / 2 : pad;
  if (title) { k.font = `800 ${Math.round(size * PHI)}px ${font}`; for (const ln of wrap(k, title, w - pad * 2)) { k.fillText(ln, x, y); y += size * PHI * 1.2; } y += size * 0.4; }
  k.font = `${size}px ${font}`;
  for (const para of [].concat(lines)) { for (const ln of wrap(k, para, w - pad * 2)) { if (y > h - size - 4) break; k.fillText(ln, x, y); y += size * 1.3; } y += size * 0.35; }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
}
export function wrap(k, s, maxW) { const out = []; for (const raw of String(s).split('\n')) { let cur = ''; for (const wd of raw.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (k.measureText(t).width > maxW && cur) { out.push(cur); cur = wd; } else cur = t; } out.push(cur); } return out; }
export function labelSprite(text, { size = 0.5, bg = 'rgba(27,22,38,.78)', fg = '#fff' } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d'); k.font = 'bold 44px system-ui';
  const w = Math.min(500, k.measureText(text).width + 40); k.fillStyle = bg; k.beginPath(); k.roundRect((512 - w) / 2, 12, w, 72, 30); k.fill(); k.fillStyle = fg; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 49, 480);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthWrite: false, depthTest: false })); sp.scale.set(5.33 * size, size, 1); sp.renderOrder = 10; return sp;
}
// viền cho lưới mặt phẳng (non-indexed): gộp đỉnh trùng → pháp tuyến mượt → viền liền, không thủng/lòi mép
export function smoothOutline(m) { const g = m.geometry.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); const mg = mergeVertices(g); mg.computeVertexNormals(); const e = new THREE.Mesh(mg, outlineMat); e.userData.outline = true; e.raycast = () => {}; m.add(e); return e; }
// lưới toon có viền (giống nhân vật)
export function mesh(geo, color, { outline = true } = {}) { const m = new THREE.Mesh(geo, T(color)); if (outline) addOutline(m); return m; }   // MeshToonMaterial không có flatShading

// ---------- CSS HUD (chèn 1 lần) ----------
let cssDone = false;
function css() {
  if (cssDone) return; cssDone = true; const s = document.createElement('style');
  s.textContent = `.mga{position:fixed;inset:0;z-index:30;touch-action:none;user-select:none;-webkit-user-select:none;font:13px/1.45 system-ui,sans-serif;color:#3b2a1e}
.mga .top{position:absolute;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));display:flex;gap:8px;align-items:center;pointer-events:none}
.mga .ttl{background:#fff6dfee;border:2px solid #7a5a2e;border-radius:13px;padding:5px 13px;font-weight:800;font-size:15px;pointer-events:auto}
.mga .sc{white-space:nowrap;background:#2a1f3acc;color:#ffe9a8;border-radius:13px;padding:5px 13px;font-weight:700}
.mga .sp{flex:1}
.mga button{font:800 13px system-ui;border-radius:13px;border:2px solid #7a5a2e;background:#ffd36e;color:#3b2a1e;padding:8px 13px;min-height:34px;cursor:pointer;pointer-events:auto}
.mga button.on{background:#7a5a2e;color:#fff6df}.mga button:disabled{opacity:.5}
.mga .x{background:#fff6df}
.mga .bar{position:absolute;left:8px;right:8px;bottom:max(10px,env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:8px;justify-content:center;pointer-events:none}
.mga .tip{position:absolute;left:8px;right:8px;margin:0 auto;width:fit-content;top:calc(max(8px,env(safe-area-inset-top)) + 52px);max-width:min(92vw,560px);background:#fff6dfee;border:2px solid #7a5a2e;border-radius:13px;padding:8px 13px;text-align:center;font-size:14px;pointer-events:none;transition:opacity .3s}
.mga .card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,520px);max-height:80vh;overflow:auto;background:#fff6df;border:3px solid #7a5a2e;border-radius:21px;padding:13px 21px;box-shadow:0 8px 30px #0008;font-size:15px;pointer-events:auto}
.mga .card h3{margin:0 0 8px;font-size:21px}.mga .card .opts{display:grid;gap:8px;margin-top:13px}
.mga .sw{width:34px;height:34px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #7a5a2e;padding:0;min-height:0}.mga .sw.on{box-shadow:0 0 0 4px #e0564a}
body.mga-open>*:not(.mga):not(canvas):not(style):not(script){visibility:hidden!important}
.mga.inw{z-index:29}.mga.inw .ttl,.mga.inw .x,.mga.inw .top .sc{display:none}
.mga.inw .top{top:calc(max(8px,env(safe-area-inset-top)) + 55px)}.mga.inw .tip{top:calc(max(8px,env(safe-area-inset-top)) + 107px)}
@media (max-width:600px){.mga button{padding:6px 10px}.mga .ttl{display:none}.mga:not(.inw) .tip{top:calc(max(8px,env(safe-area-inset-top)) + 96px)}}`;
  document.head.appendChild(s);
}

// ---------- Sân khấu ----------
// api (mg/host.js): có host → chơi NGAY TRONG thế giới: cảnh = api.root, camera riêng (cục bộ) được host đổi sang camera thế giới,
// đèn/sương/nền của thế giới, HUD host là thanh duy nhất (tên, điểm, ✕ Thoát, Esc). Không host → sân khấu riêng như cũ.
export function createStage(ctx, { title = 'Mini game', bg = '#bfe3f5', fov = 50, near = 0.1, far = 300, fog = null, onExit, api = null } = {}) {
  css();
  const inw = !!api, renderer = ctx.renderer, scene = inw ? api.root : new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, near, far);
  if (!inw) { scene.background = new THREE.Color(bg); if (fog) scene.fog = new THREE.Fog(fog[0], fog[1], fog[2]); }
  const hemi = new THREE.HemisphereLight('#fff8e8', '#8a7a9a', 1.4), sun = new THREE.DirectionalLight('#fff2dc', 2.2); sun.position.set(5, 13, 8); if (!inw) scene.add(hemi, sun);
  if (inw) { api.useCamera(camera); api.hidePlayer(); api.hud.title(title); }
  const st = { ticks: [], disposed: false, hostT: 0, last: performance.now(), score: 0 };

  // HUD
  const root = document.createElement('div'); root.className = 'mga';
  root.innerHTML = `<div class="top"><div class="ttl"></div><div class="sc" hidden></div><div class="tabs" style="display:flex;gap:6px;flex-wrap:wrap"></div><div class="sp"></div><button class="x">✖ Thoát</button></div><div class="tip" style="opacity:0"></div><div class="bar"></div>`;
  if (inw) root.classList.add('inw'); document.body.appendChild(root); if (!inw) document.body.classList.add('mga-open');
  const $ = s => root.querySelector(s), tabs = $('.tabs'), ttl = $('.ttl'), sc = $('.sc'), tipEl = $('.tip'), bar = $('.bar');
  ttl.textContent = title;
  let tipT = 0;
  const S = {
    ctx, scene, camera, renderer, root, bar, tabs, hemi, sun, THREE,
    fit: () => Math.max(1, 0.9 / camera.aspect),   // màn hình dọc (điện thoại) → lùi camera cho vừa khung
    setTitle: t => { ttl.textContent = t; if (inw) api.hud.title(t); },
    setScore: t => { sc.hidden = t == null; sc.textContent = t; if (inw) api.hud.info(t == null ? '' : t); },
    tip(t, ms = 3400) { tipEl.innerHTML = t; tipEl.style.opacity = 1; tipT = ms / 1000; },
    // nút ở thanh dưới; trả về element
    button(label, fn, parent = bar) { const b = document.createElement('button'); b.innerHTML = label; b.onclick = e => { e.stopPropagation(); ac(); play('pop', 660, 0.1, 0.25); fn(b); }; parent.appendChild(b); return b; },
    clearBar() { bar.innerHTML = ''; },
    // thẻ giữa màn hình (câu hỏi, đọc sách…): opts = [{label, fn}]
    card(html, opts = [], { close = true } = {}) {
      S.closeCard(); const c = document.createElement('div'); c.className = 'card'; c.innerHTML = html; const o = document.createElement('div'); o.className = 'opts'; c.appendChild(o);
      for (const it of opts) S.button(it.label, () => { if (it.keep !== true) S.closeCard(); it.fn && it.fn(); }, o);
      if (close && !opts.length) S.button('Đóng', () => S.closeCard(), o);
      c.addEventListener('pointerdown', e => e.stopPropagation()); root.appendChild(c); S.cardEl = c; return c;
    },
    closeCard() { if (S.cardEl) { S.cardEl.remove(); S.cardEl = null; } },
    onTick(fn) { st.ticks.push(fn); },
    // trong thế giới: chiếu tia từ camera thế giới (đang hiện) → điểm chạm là toạ độ thế giới; S.local(v) đổi về toạ độ cảnh game
    pick(list, e) { const r = renderer.domElement.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), inw ? ctx.camera : camera); return ray.intersectObjects(list, true)[0] || null; },
    rayFrom(e) { const r = renderer.domElement.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), inw ? ctx.camera : camera); if (inw) { scene.updateMatrixWorld(); ray.ray.applyMatrix4(_inv.copy(scene.matrixWorld).invert()); } return ray.ray; },
    local: v => scene.worldToLocal(v),
    exit() { if (st.disposed) return; S.dispose(); onExit && onExit(); },
  };
  const ray = new THREE.Raycaster(), _inv = new THREE.Matrix4();
  $('.x').onclick = e => { e.stopPropagation(); S.exit(); };

  // chạm / kéo: S.onDown(e, hit?) S.onDrag(dx, dy, e) S.onUp(e) S.onPinch(k) S.onWheel(dy)
  const pts = new Map(); let pinch0 = 0;
  root.addEventListener('pointerdown', e => { if (e.target.closest('button,.card')) return; ac(); root.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } else S.onDown && S.onDown(e); });
  root.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) { S.onHover && S.onHover(e); return; }
    if (pts.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 && S.onPinch) S.onPinch(d / pinch0); pinch0 = d; return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; S.onDrag && S.onDrag(dx, dy, e);
  });
  const up = e => { if (pts.delete(e.pointerId) && pts.size === 0) S.onUp && S.onUp(e); pinch0 = 0; };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('wheel', e => { e.preventDefault(); S.onWheel && S.onWheel(e.deltaY); }, { passive: false });
  // phím: chặn phím của đảo (M bản đồ, E, WASD…) khi đang chơi; Esc thoát
  // Esc: đóng thẻ nếu đang mở; không có thẻ → trong thế giới để host thoát (không chặn), sân khấu riêng thì tự thoát
  const onKey = e => { if (st.disposed) return; if (e.code === 'Escape') { if (e.type !== 'keydown') return; if (S.cardEl) { e.stopImmediatePropagation(); S.closeCard(); } else if (!inw) { e.stopImmediatePropagation(); S.exit(); } return; }
    e.stopImmediatePropagation(); if (e.type === 'keydown') S.onKey && S.onKey(e); };
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true);

  // vẽ cảnh game thay cho đảo
  const post = inw ? null : ctx.post, prevRender = post && post.render, frozen0 = ctx.player && ctx.player.frozen;
  if (ctx.player && !inw) ctx.player.frozen = true;
  const resize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize);
  const tick = dt => { if (tipT > 0 && (tipT -= dt) <= 0) tipEl.style.opacity = 0; for (const f of st.ticks) f(dt); };
  const draw = () => {
    const now = performance.now(), dt = Math.min(0.05, (now - st.last) / 1000); st.last = now;
    if (now - st.hostT > 200) tick(dt);   // chưa có host gọi update → tự chạy logic
    const sh = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.render(scene, camera); renderer.shadowMap.enabled = sh;
  };
  if (post) post.render = draw;
  S.update = dt => { if (st.disposed) return; st.hostT = performance.now(); tick(dt); };
  S.dispose = () => {
    if (st.disposed) return; st.disposed = true; S.disposed = true;
    if (post && post.render === draw) post.render = prevRender;
    if (ctx.player && !inw) ctx.player.frozen = !!frozen0;
    removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKey, true); removeEventListener('resize', resize);
    root.remove(); if (!document.querySelector('.mga')) document.body.classList.remove('mga-open');
    if (inw) scene.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) { if (m.map && !m.map.userData.shared) m.map.dispose(); if (!(m.userData && m.userData.own)) m.userData.shared = true; } });   // texture riêng của game (nhãn chữ, bìa sách): giải phóng GPU (dùng lại thì three tự nạp lại); trước: rò ~40 texture mỗi lần vào xưởng   // vật liệu toon dùng chung (style.js) → host không dispose
    else scene.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : []; for (const m of ms) { if (m.map) m.map.dispose(); if (m.userData && m.userData.own) m.dispose(); } });
  };
  return S;
}

// Xoay camera quanh mục tiêu (kéo 1 ngón, chụm 2 ngón / lăn chuột để zoom)
export function orbit(S, target, { r = 8, yaw = 0, pitch = 0.4, rMin = 3, rMax = 21, pMin = -0.2, pMax = 1.3 } = {}) {
  const o = { target: new THREE.Vector3().copy(target), r, yaw, pitch, enabled: true };
  o.apply = () => { const c = Math.cos(o.pitch); S.camera.position.set(o.target.x + Math.sin(o.yaw) * c * o.r, o.target.y + Math.sin(o.pitch) * o.r, o.target.z + Math.cos(o.yaw) * c * o.r); S.camera.lookAt(o.target); };
  o.drag = (dx, dy) => { if (!o.enabled) return; o.yaw -= dx * 0.008; o.pitch = Math.max(pMin, Math.min(pMax, o.pitch + dy * 0.006)); o.apply(); };
  o.zoom = k => { o.r = Math.max(rMin, Math.min(rMax, o.r / k)); o.apply(); };
  o.apply(); return o;
}
export { gradientMap };
