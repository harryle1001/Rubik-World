// photo.js — Chế độ chụp ảnh 📷 (menu ☰ hoặc phím O): dừng thời gian (ocean.js bỏ qua mọi cập nhật thế giới), camera xoay quanh tự do
//   (kéo: xoay · lăn chuột/chụm 2 ngón: gần-xa · WASD/QE: dời điểm nhìn), 7 bộ lọc màu (chỉnh thẳng uniform hậu kỳ post.js → ảnh lưu có màu lọc),
//   ẩn HUD, lưu ảnh PNG về máy trong khung có logo game, tên vùng, ngày giờ. Khung theo tỷ lệ vàng. 0 draw call thêm.
import * as THREE from 'three';
import { PHI } from './layout.js';

// bộ lọc: nhân/ghi đè lên giá trị hậu kỳ lúc vào chế độ chụp (sat bão hoà · con tương phản · warm ấm · lift/gain tông màu · vig viền tối)
const FILTERS = [
  ['Gốc', {}],
  ['Rực rỡ', { sat: 1.38, con: 1.13 }],
  ['Ấm áp', { warm: 0.07, gain: [1.06, 1.0, 0.9] }],
  ['Mát lạnh', { warm: -0.05, gain: [0.92, 1.0, 1.1] }],
  ['Hoài cổ', { sat: 0.38, warm: 0.09, lift: [0.035, 0.025, 0.0], con: 0.92, vig: 0.38 }],
  ['Đen trắng', { sat: 0, con: 1.21 }],
  ['Điện ảnh', { sat: 0.86, con: 1.13, lift: [0, 0.012, 0.03], gain: [1.08, 1.0, 0.9], vig: 0.33 }],
];

export function createPhoto(ctx) {
  const { camera, renderer } = ctx;
  const css = document.createElement('style');
  css.textContent = `body.fxPhoto>*:not(canvas):not(#photoUI):not(#fxVeil):not(#photoFlash){visibility:hidden!important}
#photoUI{position:fixed;inset:0;z-index:35;touch-action:none;display:none}body.fxPhoto #photoUI{display:block}
#photoUI .bar{position:absolute;left:50%;bottom:max(13px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:8px;border-radius:26px;background:#101a2ecc;box-shadow:0 6px 18px #0006;max-width:calc(100vw - 24px)}
#photoUI button{height:42px;min-width:42px;border-radius:21px;border:2px solid #fff6;background:#ffffff14;color:#fff;font:700 14px system-ui;padding:0 13px;cursor:pointer;white-space:nowrap}
#photoUI .shot{width:62px;height:62px;border-radius:50%;background:#fff;border:5px solid #ffc23e;font-size:24px;padding:0}
#photoUI .flt{position:absolute;left:50%;bottom:calc(max(13px,env(safe-area-inset-bottom)) + 78px);transform:translateX(-50%);display:flex;gap:6px;overflow-x:auto;max-width:calc(100vw - 24px);padding:2px}
#photoUI .flt button{height:34px;font-size:13px;background:#101a2ecc}#photoUI .flt button[aria-pressed=true]{background:#ffc23e;color:#231600;border-color:#ffc23e}
#photoUI .tip{position:absolute;top:max(13px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:6px 13px;border-radius:13px;background:#101a2eaa;color:#e8eeff;font:600 13px system-ui;white-space:nowrap}
#photoUI.bare .bar,#photoUI.bare .flt,#photoUI.bare .tip{display:none}
#photoFlash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:41}`;
  document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'photoUI';
  ui.innerHTML = `<div class="tip">📷 Kéo để xoay · lăn/chụm để gần-xa · WASD dời · Q/E lên-xuống</div>
    <div class="flt">${FILTERS.map(([n], i) => `<button data-f="${i}">${n}</button>`).join('')}</div>
    <div class="bar"><button data-a="hud" title="Ẩn nút (chạm màn hình để hiện lại)">🙈 Ẩn nút</button><button class="shot" data-a="shot" title="Chụp & lưu ảnh">📸</button><button data-a="exit">✖ Thoát</button></div>`;
  document.body.appendChild(ui);
  const flash = document.createElement('div'); flash.id = 'photoFlash'; document.body.appendChild(flash);
  const btn = document.createElement('button'); btn.id = 'bPhoto'; btn.textContent = '📷 Chụp ảnh'; btn.title = 'Chế độ chụp ảnh (phím O)';
  (document.getElementById('moreMenu') || document.body).appendChild(btn);
  const logo = new Image(); logo.src = '/icons/icon-192.png';

  const G = () => ctx.post && ctx.post.grade;
  let on = false, base = null, fi = 0, yaw = 0, pitch = 0.3, dist = 8, pivot = new THREE.Vector3(), keys = new Set();
  const savedCam = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  function applyFilter(i) {
    fi = i; const g = G(); if (!g || !base) return; const f = FILTERS[i][1];
    g.uSat.value = base.sat * (f.sat ?? 1); g.uCon.value = base.con * (f.con ?? 1); g.uWarm.value = base.warm + (f.warm || 0); g.uAmt.value = Math.max(base.vig, f.vig || 0);
    g.uLift.value.copy(base.lift).add(new THREE.Vector3(...(f.lift || [0, 0, 0]))); g.uGain.value.copy(base.gain).multiply(new THREE.Vector3(...(f.gain || [1, 1, 1])));
    for (const b of ui.querySelectorAll('.flt button')) b.setAttribute('aria-pressed', +b.dataset.f === i);
  }
  function enter() {
    if (on || document.body.classList.contains('rs-modal')) return;
    on = ctx.photoMode = true; document.body.classList.add('fxPhoto'); ui.classList.remove('bare');
    savedCam.p.copy(camera.position); savedCam.q.copy(camera.quaternion);
    const p = ctx.player.pos; pivot.set(p.x, p.y + 1.2, p.z); const d = camera.position.clone().sub(pivot); dist = Math.max(2, d.length()); yaw = Math.atan2(d.x, d.z); pitch = Math.asin(Math.max(-1, Math.min(1, d.y / dist)));
    const g = G(); if (g) base = { sat: g.uSat.value, con: g.uCon.value, warm: g.uWarm.value, vig: g.uAmt.value, lift: g.uLift.value.clone(), gain: g.uGain.value.clone() };
    applyFilter(0); ctx.sfx && ctx.sfx('ui');
  }
  function exit() {
    if (!on) return; const g = G(); if (g && base) { applyFilter(0); }
    on = ctx.photoMode = false; document.body.classList.remove('fxPhoto'); camera.position.copy(savedCam.p); camera.quaternion.copy(savedCam.q); keys.clear();
  }
  ctx.photo = { enter, exit, get on() { return on; } };
  btn.onclick = enter;
  addEventListener('keydown', e => { if (e.target.closest && e.target.closest('input,textarea')) return; if (e.code === 'KeyO') on ? exit() : enter(); else if (on && e.code === 'Escape') exit(); if (on) keys.add(e.code); });
  addEventListener('keyup', e => keys.delete(e.code));

  // ---------- điều khiển camera tự do ----------
  const ptr = new Map(); let pinch0 = 0, dist0 = 0;
  ui.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; ui.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = dist; } if (ui.classList.contains('bare') && ptr.size === 1) ui._tap = performance.now(); });
  ui.addEventListener('pointermove', e => {
    const q = ptr.get(e.pointerId); if (!q) return;
    if (ptr.size === 1) { yaw -= (e.clientX - q.x) * 0.006; pitch = Math.max(-0.35, Math.min(1.45, pitch + (e.clientY - q.y) * 0.005)); }
    q.x = e.clientX; q.y = e.clientY;
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; dist = Math.max(1.5, Math.min(89, dist0 * pinch0 / Math.max(13, Math.hypot(a.x - b.x, a.y - b.y)))); }
  });
  const up = e => { ptr.delete(e.pointerId); if (ui.classList.contains('bare') && ui._tap && performance.now() - ui._tap < 250) ui.classList.remove('bare'); ui._tap = 0; };
  ui.addEventListener('pointerup', up); ui.addEventListener('pointercancel', up);
  ui.addEventListener('wheel', e => { dist = Math.max(1.5, Math.min(89, dist * Math.exp(e.deltaY * 0.001))); }, { passive: true });
  ui.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.f) applyFilter(+b.dataset.f); else if (b.dataset.a === 'exit') exit(); else if (b.dataset.a === 'hud') ui.classList.add('bare'); else if (b.dataset.a === 'shot') shoot();
  });

  // ---------- chụp: vẽ 1 khung rồi đọc ngay bộ đệm (không cần preserveDrawingBuffer), ghép khung ảnh + logo ----------
  function shoot() {
    ctx.post.render(); const src = renderer.domElement, W = src.width, H = src.height;
    const pad = Math.round(Math.min(W, H) / PHI ** 6), band = Math.round(pad * PHI ** 2);   // viền ≈ 1/φ⁶ cạnh ngắn, dải chữ dưới = viền·φ²
    const cv = document.createElement('canvas'); cv.width = W + pad * 2; cv.height = H + pad + band; const g = cv.getContext('2d');
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(src, pad, pad);
    const ls = Math.round(band * 0.618), ly = H + pad + (band - ls) / 2; if (logo.complete && logo.naturalWidth) g.drawImage(logo, pad, ly, ls, ls);
    const p = ctx.player.pos, where = (ctx.regionAt && ctx.regionAt(p.x, p.z)) || 'Đảo Rubik', when = new Date().toLocaleDateString('vi-VN');
    g.fillStyle = '#2b2140'; g.font = `700 ${Math.round(ls * 0.42)}px Georgia, serif`; g.textBaseline = 'middle'; g.fillText('Đảo Rubik', pad + ls * 1.236, ly + ls * 0.32);
    g.fillStyle = '#7a6a8a'; g.font = `600 ${Math.round(ls * 0.27)}px system-ui, sans-serif`; g.fillText(`${where} · ${when}`, pad + ls * 1.236, ly + ls * 0.76);
    g.textAlign = 'right'; g.fillText('📷 ' + (ctx.playerName || ''), cv.width - pad, ly + ls * 0.5);
    flash.style.transition = 'none'; flash.style.opacity = 0.85; requestAnimationFrame(() => { flash.style.transition = 'opacity .618s'; flash.style.opacity = 0; });
    shutter(); ctx.vibrate && ctx.vibrate(21);
    cv.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `dao-rubik-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10000); ctx.lastPhoto = cv; }, 'image/png');
  }
  function shutter() {   // tiếng màn trập: 2 nhịp nhiễu ngắn
    const L = ctx.audio && ctx.audio.listener; if (!L || L.context.state !== 'running' || !ctx.audio.on) return;
    const ac = L.context, out = (ctx.audio.bus || {}).sfx || L.getInput(), n = ac.sampleRate * 0.05 | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    for (const dt of [0, 0.09]) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = 1800; gn.gain.value = 0.5; s.connect(f).connect(gn).connect(out); s.start(ac.currentTime + dt); }
  }

  const fwd = new THREE.Vector3(), right = new THREE.Vector3();
  function update(dt) {   // ocean.js gọi khi đang chụp ảnh (thế giới đứng yên)
    const sp = dist * 0.618 * dt;
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); right.set(-fwd.z, 0, fwd.x);
    if (keys.has('KeyW') || keys.has('ArrowUp')) pivot.addScaledVector(fwd, sp); if (keys.has('KeyS') || keys.has('ArrowDown')) pivot.addScaledVector(fwd, -sp);
    if (keys.has('KeyD') || keys.has('ArrowRight')) pivot.addScaledVector(right, sp); if (keys.has('KeyA') || keys.has('ArrowLeft')) pivot.addScaledVector(right, -sp);
    if (keys.has('KeyE')) pivot.y += sp; if (keys.has('KeyQ')) pivot.y -= sp;
    const cp = Math.cos(pitch); camera.position.set(pivot.x + Math.sin(yaw) * cp * dist, pivot.y + Math.sin(pitch) * dist, pivot.z + Math.cos(yaw) * cp * dist);
    const gh = ctx.terrain.heightAt(camera.position.x, camera.position.z) + 0.3; if (camera.position.y < gh) camera.position.y = gh;
    camera.lookAt(pivot);
  }
  return { update, enter, exit, shoot, FILTERS };
}
