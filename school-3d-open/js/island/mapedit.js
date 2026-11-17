// World map (Menu › Map, or key M): the whole open world from above — island, Rubik City, bridges, stream, paths,
// fixed zones and every movable building. View mode: tap a spot to travel there. Edit mode: drag buildings to new
// places, then "Save & rebuild" (saved in this browser as rubik3d-layout) or copy the layout to send to Claude.
import { edgeR, heightAt, STREAM, MOVABLE, LAYOUT } from './util.js';
import { TRAILS } from './terrain.js';
import { P } from './player.js';
import { CITY, CBRIDGE } from './zones5.js';
import { BRIDGE } from './zones4.js';
const $ = s => (window.ISL || document).querySelector(s);
const FIXED = [['Trường học', 0, -20], ['Khu trí tuệ', -300, 0], ['Thể thao', 300, -60], ['Khu vui chơi', 0, 300], ['Nông trại', 0, -330], ['Khu sáng tạo', 105, 255], ['Đường đua', 300, 205], ['Đồi trượt tuyết', 470, 40], ['Bến tàu', 0, 540]];
const COL = {land:'#ffb74d', city:'#64b5f6'};
const V = {s:.3, cx:0, cz:450, edit:false, drag:null, moved:{}, ptrs:new Map(), pinch:0, cv:null, g:null, raf:0};
const w2s = (x, z) => [(x - V.cx)*V.s + V.cv.clientWidth/2, (z - V.cz)*V.s + V.cv.clientHeight/2];
const s2w = (sx, sy) => [(sx - V.cv.clientWidth/2)/V.s + V.cx, (sy - V.cv.clientHeight/2)/V.s + V.cz];
function ui(){
  let el = $('#mapEd'); if(el) return el; el = document.createElement('div'); el.id = 'mapEd'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Bản đồ thế giới');
  el.innerHTML = `<canvas></canvas><div class="mTop"><b>Bản đồ · World Map</b><small id="mHint"></small><button type="button" data-k="close" aria-label="Đóng">✕</button></div>
  <div class="mBar"><button type="button" data-k="mode">✏️ Sửa vị trí</button><button type="button" data-k="save" class="gold" hidden>💾 Lưu & dựng lại</button><button type="button" data-k="copy" hidden>📋 Sao chép bố cục</button><button type="button" data-k="reset" hidden>↺ Mặc định</button><button type="button" data-k="in">＋</button><button type="button" data-k="out">－</button><button type="button" data-k="me">📍</button></div><textarea id="mJson" hidden readonly></textarea>`;
  (window.ISL || document.body).appendChild(el); V.cv = el.querySelector('canvas'); V.g = V.cv.getContext('2d');
  el.querySelectorAll('button').forEach(b => b.onclick = () => act(b.dataset.k));
  const cv = V.cv; let down = null;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); V.ptrs.set(e.pointerId, [e.clientX, e.clientY]); if(V.ptrs.size === 2){ const [a, b] = [...V.ptrs.values()]; V.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); V.drag = null; down = null; return; }
    const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; down = {sx, sy, x:e.clientX, y:e.clientY, moved:false, cx:V.cx, cz:V.cz};
    if(V.edit){ const it = hit(sx, sy); if(it){ const [wx, wz] = s2w(sx, sy); V.drag = {it, ox:it.x - wx, oz:it.z - wz}; } } draw(); });
  cv.addEventListener('pointermove', e => { if(!V.ptrs.has(e.pointerId)) return; V.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if(V.ptrs.size === 2){ const [a, b] = [...V.ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if(V.pinch) zoom(d/V.pinch); V.pinch = d; return; }
    if(!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if(Math.hypot(dx, dy) > 6) down.moved = true;
    if(V.drag){ const r = cv.getBoundingClientRect(), [wx, wz] = s2w(e.clientX - r.left, e.clientY - r.top); V.drag.it.x = Math.round(wx + V.drag.ox); V.drag.it.z = Math.round(wz + V.drag.oz); V.moved[V.drag.it.id] = [V.drag.it.x, V.drag.it.z]; hint(); }
    else { V.cx = down.cx - dx/V.s; V.cz = down.cz - dy/V.s; } draw(); });
  const up = e => { V.ptrs.delete(e.pointerId); if(V.ptrs.size < 2) V.pinch = 0; if(down && !down.moved && !V.drag && !V.edit){ const [wx, wz] = s2w(down.sx, down.sy); travel(wx, wz); } V.drag = null; down = null; draw(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? .88 : 1.14); draw(); }, {passive:false});
  ['keydown', 'touchmove'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation()));
  addEventListener('resize', () => { if(!el.hidden) size(); });
  return el;
}
function hint(){ const n = Object.keys(V.moved).length; $('#mHint').textContent = V.edit ? `Kéo công trình tới chỗ mới · đã dời ${n}` : 'Chạm vào bản đồ để đi tới đó · kéo để xem quanh'; }
function zoom(k){ V.s = Math.max(.08, Math.min(4, V.s*k)); }
function size(){ const d = devicePixelRatio || 1, cv = V.cv; cv.width = cv.clientWidth*d; cv.height = cv.clientHeight*d; V.g.setTransform(d, 0, 0, d, 0, 0); draw(); }
function hit(sx, sy){ let best = null, bd = 1e9; for(const it of MOVABLE){ const [x, y] = w2s(it.x, it.z), hw = Math.max(8, it.w*V.s/2), hd = Math.max(8, it.d*V.s/2); if(Math.abs(sx - x) <= hw && Math.abs(sy - y) <= hd){ const d = Math.hypot(sx - x, sy - y); if(d < bd){ bd = d; best = it; } } } return best; }
function travel(x, z){ if(heightAt(x, z) < .2){ $('#mHint').textContent = 'Chỗ đó là biển 🌊 · chọn chỗ trên đất nhé'; return; } P.x = x; P.z = z; P.y = heightAt(x, z) + 1; P.vx = P.vz = P.vy = 0; P.target = null; closeMap(); }
function draw(){
  const g = V.g, W = V.cv.clientWidth, H = V.cv.clientHeight; g.fillStyle = '#1e6fa8'; g.fillRect(0, 0, W, H);
  // main island outline + sand rim
  const poly = (f, fill) => { g.beginPath(); for(let i=0;i<=96;i++){ const a = i/96*Math.PI*2, r = f(a), [x, y] = w2s(Math.cos(a)*r, Math.sin(a)*r); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.fillStyle = fill; g.fill(); };
  poly(a => edgeR(Math.cos(a)*500, Math.sin(a)*500), '#e9d8a6'); poly(a => edgeR(Math.cos(a)*500, Math.sin(a)*500) - 30, '#7cc35a');
  const [ccx, ccz] = w2s(CITY.x, CITY.z); g.fillStyle = '#e9d8a6'; g.beginPath(); g.ellipse(ccx, ccz, (CITY.rx + 20)*V.s, (CITY.rz + 20)*V.s, 0, 0, 7); g.fill(); g.fillStyle = '#86cf62'; g.beginPath(); g.ellipse(ccx, ccz, (CITY.rx - 8)*V.s, (CITY.rz - 8)*V.s, 0, 0, 7); g.fill();
  const line = (pts, col, wd) => { g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); pts.forEach(([x, z], i) => { const [sx, sy] = w2s(x, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.stroke(); };
  for(const T of TRAILS) line(T, 'rgba(210,180,130,.8)', Math.max(1, 6*V.s)); line(STREAM, '#4fc3f7', Math.max(2, 10*V.s));
  line([[CBRIDGE.x, CBRIDGE.z0], [CBRIDGE.x, CBRIDGE.z1]], '#a1887f', Math.max(3, 7*V.s)); line([[BRIDGE.x - BRIDGE.half, BRIDGE.z], [BRIDGE.x + BRIDGE.half, BRIDGE.z]], '#b5532f', Math.max(3, 5*V.s));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for(const [n, x, z] of FIXED){ const [sx, sy] = w2s(x, z); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(sx, sy, Math.max(10, 60*V.s), 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 12px Nunito, sans-serif'; g.fillText(n, sx, sy); }
  for(const it of MOVABLE){ const [x, y] = w2s(it.x, it.z), w = Math.max(6, it.w*V.s), d = Math.max(6, it.d*V.s), wet = heightAt(it.x, it.z) < .2, moved = !!V.moved[it.id] || !!LAYOUT[it.id];
    g.fillStyle = COL[it.g] || '#fff'; g.globalAlpha = .9; g.fillRect(x - w/2, y - d/2, w, d); g.globalAlpha = 1; g.lineWidth = V.drag && V.drag.it === it ? 3 : 1.5; g.strokeStyle = wet ? '#ff1744' : moved ? '#ffd23f' : '#263238'; g.strokeRect(x - w/2, y - d/2, w, d);
    if(V.s > .55 || it.g === 'land' || (V.drag && V.drag.it === it)){ g.font = `700 ${it.g === 'land' ? 12 : 10}px Nunito, sans-serif`; g.fillStyle = '#10131f'; g.fillText(it.vi, x + 1, y + d/2 + 9); g.fillStyle = '#fff'; g.fillText(it.vi, x, y + d/2 + 8); } }
  const [px, py] = w2s(P.x, P.z); g.fillStyle = '#ef4b4b'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.font = '700 11px Nunito, sans-serif'; g.fillText('Bạn', px, py - 14);
  // scale bar
  const m = 100*V.s; g.fillStyle = '#fff'; g.fillRect(16, 84, m, 3); g.textAlign = 'left'; g.fillText('100 m', 16, 76);
}
function act(k){
  const el = $('#mapEd');
  if(k === 'close') return closeMap();
  if(k === 'in'){ zoom(1.3); return draw(); } if(k === 'out'){ zoom(1/1.3); return draw(); } if(k === 'me'){ V.cx = P.x; V.cz = P.z; V.s = Math.max(V.s, .9); return draw(); }
  if(k === 'mode'){ V.edit = !V.edit; el.querySelector('[data-k=mode]').textContent = V.edit ? '👀 Xem' : '✏️ Sửa vị trí'; ['save', 'copy', 'reset'].forEach(q => el.querySelector(`[data-k=${q}]`).hidden = !V.edit); el.classList.toggle('editing', V.edit); hint(); return draw(); }
  if(k === 'save'){ const L = Object.assign({}, LAYOUT, V.moved); try { localStorage.setItem('rubik3d-layout', JSON.stringify(L)); } catch(e){} $('#mHint').textContent = 'Đã lưu ✓ Đang dựng lại thế giới…'; setTimeout(() => location.reload(), 500); return; }
  if(k === 'reset'){ if(!confirm('Đưa tất cả công trình về chỗ cũ?')) return; try { localStorage.removeItem('rubik3d-layout'); } catch(e){} setTimeout(() => location.reload(), 300); return; }
  if(k === 'copy'){ const L = Object.assign({}, LAYOUT, V.moved), txt = JSON.stringify(L), ta = $('#mJson'); ta.hidden = false; ta.value = txt; ta.select();
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { $('#mHint').textContent = 'Đã sao chép ✓ Dán gửi cho Claude để đặt cố định cho mọi người'; }, () => { $('#mHint').textContent = 'Chọn và sao chép đoạn chữ bên dưới để gửi cho Claude'; }); }
}
export function openMap(){ const el = ui(); el.hidden = false; V.moved = {}; V.edit = false; ['save', 'copy', 'reset'].forEach(q => el.querySelector(`[data-k=${q}]`).hidden = true); el.querySelector('[data-k=mode]').textContent = '✏️ Sửa vị trí'; el.classList.remove('editing'); $('#mJson').hidden = true;
  V.cx = P.x; V.cz = P.z; size(); V.s = Math.min(V.cv.clientWidth, V.cv.clientHeight)/1500; V.cx = 0; V.cz = 420; hint(); size();
  cancelAnimationFrame(V.raf); const tick = () => { if(el.hidden) return; draw(); V.raf = requestAnimationFrame(tick); }; V.raf = requestAnimationFrame(tick); }
export function closeMap(){ const el = $('#mapEd'); if(el) el.hidden = true; cancelAnimationFrame(V.raf); }
addEventListener('keydown', e => { if(e.code !== 'KeyM' || !window.ISL_ON || /INPUT|TEXTAREA/.test(e.target.tagName) || document.querySelector('.modal:not([hidden])')) return; const el = $('#mapEd'); if(el && !el.hidden) closeMap(); else openMap(); });
