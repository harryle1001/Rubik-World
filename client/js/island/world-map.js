// world-map.js — BẢN ĐỒ kiểu bản đồ kho báu (phím M hoặc nút 🗺️).
// Nền vẽ 1 lần từ độ cao địa hình (đảo) + vùng của trường Rubik (thị trấn), rồi mỗi khung hình vẽ thêm:
//   tên địa danh, con vật (🦌🦊…), mọi người (thầy cô, học sinh, khách), vị trí của bạn (mũi tên).
// Bật/tắt từng lớp bằng các nút trên bản đồ; "Gần tôi" chỉ hiện những thứ trong bán kính NEAR mét.
// Kéo để di chuyển, lăn chuột / chụm 2 ngón / nút +− để phóng to. Bấm vào biểu tượng để xem tên (con vật: điều thú vị).
import { TEMPLES } from './temple.js';
import { SPECIES } from './animals.js';
import { FAUNA_INFO } from './fauna.js';
import { REGION_COL, Y_MIN, Y_MAX } from './school-town.js';
import { WORLD, BLOCKS, EXTRA, to2, to3, LOTS, LOT_W, LOT_L, RING_ROAD_R, ROAD_W, RADIALS, HOUSE_LOTS, lotToWorld, HOUSE_W, HOUSE_D, HOUSE_V1, flatDist, lagoonDist } from './layout.js';

const B = WORLD; // khung thế giới (m), theo bố cục layout.js
const EXTRA_COL = { F: '#c9c27a', G: '#e9cfa0', H: '#f1dca2', K: '#cfc8b8' };
const PPM = 2, NEAR = 60;                       // ảnh nền: 2 điểm ảnh / mét; "Gần tôi": 60 m
const ANIMAL_ICON = { duck: '🦆', dragonfly: '🪰', firefly: '✨', gull: '🕊️', sparrow: '🐦', butterfly: '🦋', fish: '🐟', 'animal-deer': '🦌', 'animal-fox': '🦊', 'animal-shiba': '🐕', 'animal-cat': '🐈', 'animal-frog': '🐸', 'animal-crab': '🦀' };
const NPC_ICON = { swim: '🏊', surf: '🏄', sun: '😎', bike: '🚲', camp: '⛺', picnic: '🧺', fishing: '🎣', walk: '🚶', kite: '🪁' };
const NPC_NAME = { swim: 'Người tắm biển', surf: 'Bạn lướt sóng', sun: 'Khách du lịch', bike: 'Người đạp xe', camp: 'Bạn cắm trại', picnic: 'Dã ngoại', fishing: 'Bác câu cá', walk: 'Người đi dạo', kite: 'Bạn thả diều' };
const OPT_KEY = 'island.mapOpts';

export function createWorldMap(ctx) {
  let opts = { places: true, animals: true, people: true, eggs: true, near: false };
  try { Object.assign(opts, JSON.parse(localStorage.getItem(OPT_KEY) || '{}')); } catch (e) {}

  // ---------- Giao diện ----------
  const css = document.createElement('style');
  css.textContent = `#wmap{position:fixed;inset:0;z-index:30;background:#16323a;display:flex;flex-direction:column;touch-action:none;font-family:system-ui,sans-serif}
#wmap canvas{flex:1;width:100%;min-height:0;display:block;cursor:grab}
#wmap .bar{position:absolute;left:0;right:0;top:max(13px,env(safe-area-inset-top));display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:0 62px;pointer-events:none}
@media (max-width:700px){#wmap .bar{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;right:62px;padding:0 8px 5px 21px;pointer-events:auto}#wmap .bar::-webkit-scrollbar{display:none}#wmap .bar button{flex:none;font-size:13px;padding:6px 10px}}
#wmap .bar button,#wmap .zoom button,#wmap .x{pointer-events:auto;border:2px solid #7a5a2e;background:#fff3d6;color:#5a3d1a;font:800 14px system-ui;border-radius:20px;padding:7px 12px;box-shadow:0 3px 0 #7a5a2e}
#wmap .bar button.off{background:#d9cdb3;color:#8a7a62;box-shadow:none;transform:translateY(3px)}
#wmap .x{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));width:42px;height:42px;padding:0;font-size:18px}
#wmap .zoom{position:absolute;right:max(10px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px}
#wmap .zoom button{width:44px;height:44px;padding:0;font-size:20px}
#wmap .hint{position:absolute;left:34px;bottom:max(34px,calc(env(safe-area-inset-bottom) + 21px));max-width:calc(100% - 130px);background:rgba(58,42,22,.72);color:#fff3d6;font:700 12px/1.35 system-ui;padding:5px 11px;border-radius:13px;pointer-events:none}
@media (max-width:700px){#wmap .hint .pc{display:none}}@media (min-width:701px){#wmap .hint .ph{display:none}}
#wmap .dex{position:absolute;left:50%;top:64px;transform:translateX(-50%);width:min(92vw,460px);max-height:calc(100% - 140px);overflow:auto;background:#fff3d6;border:3px solid #7a5a2e;border-radius:16px;padding:10px 14px;color:#4a3218;font:14px system-ui;box-shadow:0 6px 0 #7a5a2e}#wmap .dex h3{margin:4px 0 8px;font-size:16px}#wmap .dex .it{display:flex;flex-direction:column;gap:2px;padding:7px 0;border-top:1px dashed #c9a86a}#wmap .dex .it.no{opacity:.55}#wmap .dex b{font-size:15px}
#bMap{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));width:42px;padding:0;font-size:20px;z-index:26}
body.rs-modal #bMap{display:none}`;
  document.head.appendChild(css);
  const root = document.createElement('div'); root.id = 'wmap'; root.hidden = true;
  root.innerHTML = `<canvas></canvas><div class="bar">
<button data-k="places">📍 Địa danh</button><button data-k="animals">🐾 Con vật</button><button data-k="people">🧑 Mọi người</button><button data-d="1">📗 Sổ sinh vật</button><button data-k="eggs">🔎 Bí mật đã tìm</button><button data-k="near">⭕ Gần tôi</button></div>
<button class="x" title="Đóng (M)">✕</button><div class="zoom"><button data-z="1.4">＋</button><button data-z="0.7">－</button><button data-z="me" title="Về chỗ tôi">🎯</button></div>
<div class="hint"><span class="pc">M: đóng bản đồ · kéo để xem · bấm biểu tượng để xem tên</span><span class="ph">Kéo để xem · chạm biểu tượng để xem tên</span></div>`;
  document.body.appendChild(root);
  const btn = document.createElement('button'); btn.id = 'bMap'; btn.textContent = '🗺️'; btn.title = 'Bản đồ (M)'; document.body.appendChild(btn);
  const cv = root.querySelector('canvas'), g = cv.getContext('2d');
  const chips = [...root.querySelectorAll('.bar [data-k]')];
  const syncChips = () => chips.forEach(b => b.classList.toggle('off', !opts[b.dataset.k]));
  chips.forEach(b => b.onclick = () => { opts[b.dataset.k] = !opts[b.dataset.k]; if (b.dataset.k === 'near' && opts.near) focusMe(4); try { localStorage.setItem(OPT_KEY, JSON.stringify(opts)); } catch (e) {} syncChips(); tip = null; });
  syncChips();

  // ---------- Ảnh nền (vẽ khi mở lần đầu; vẽ lại phần thị trấn khi trường tải xong) ----------
  const base = document.createElement('canvas'); let baseTown = false, baseDone = false;
  function buildBase() {
    const W = Math.round((B.x1 - B.x0) * PPM), H = Math.round((B.z1 - B.z0) * PPM); base.width = W; base.height = H;
    const b = base.getContext('2d'), img = b.createImageData(W, H), d = img.data, land = new Uint8Array(W * H);
    const RS = ctx.school && ctx.school.RS, rgb = {}, hex = h => rgb[h] || (rgb[h] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
    const lerp = (a, c, t) => a.map((v, i) => v + (c[i] - v) * t);
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const x = B.x0 + px / PPM, z = B.z0 + py / PPM, i = py * W + px; let c;
      const p2 = RS && to2(x, z), ex = !p2 && EXTRA.find(e => !e.sea && !e.wild && x >= e.r[0] && x <= e.r[2] && z >= e.r[1] && z <= e.r[3]);
      if (p2) { let reg = 'north'; try { reg = RS.regionAt(p2[0], p2[1]); } catch (e) {} c = hex(REGION_COL[reg] || '#d8cdb5'); land[i] = 1; }
      else if (ex) { c = hex(EXTRA_COL[ex.id] || '#e6d6a8'); land[i] = 1; }
      else {
        const h = ctx.destiny && ctx.destiny.mapHide(x, z) ? -6 : ctx.terrain.heightAt(x, z);   // Rừng Thiên Định: chưa tìm ra thì chỉ là biển
        if (h < 0.15) { const t = Math.min(1, Math.max(0, -h / 6)); c = lerp([116, 214, 205], [52, 160, 168], t); }
        else if (h < 1.1 && !(flatDist(x, z) < 3 && lagoonDist(x, z) > 4)) { c = [244, 221, 156]; land[i] = 1; }
        else { const t = Math.min(1, (h - 1.1) / 12); c = h > 13 ? [205, 186, 140] : lerp([166, 216, 115], [96, 158, 72], t); land[i] = 1; }
      }
      const n = ((px * 7 + py * 13) % 11) / 11 * 6 - 3; // hạt giấy nhẹ
      d[i * 4] = c[0] + n; d[i * 4 + 1] = c[1] + n; d[i * 4 + 2] = c[2] + n; d[i * 4 + 3] = 255;
    }
    // viền bờ biển đậm (giống nét vẽ tay)
    for (let py = 1; py < H - 1; py++) for (let px = 1; px < W - 1; px++) {
      const i = py * W + px; if (!land[i]) continue;
      if (!land[i - 1] || !land[i + 1] || !land[i - W] || !land[i + W]) { d[i * 4] = 150; d[i * 4 + 1] = 110; d[i * 4 + 2] = 60; }
    }
    b.putImageData(img, 0, 0);
    // sóng nước nhỏ
    b.strokeStyle = 'rgba(255,255,255,.55)'; b.lineWidth = 2; b.lineCap = 'round';
    for (let k = 0; k < 260; k++) {
      const px = (k * 97.13) % W, py = (k * 53.77 + (k % 7) * 31) % H, i = Math.floor(py) * W + Math.floor(px);
      if (land[i] || land[Math.min(W * H - 1, i + 14)]) continue;
      b.beginPath(); b.moveTo(px, py); b.quadraticCurveTo(px + 4, py - 4, px + 8, py); b.quadraticCurveTo(px + 12, py + 4, px + 16, py); b.stroke();
    }
    // đường vòng quanh trường + 8 đường hướng tâm, lô đất có sân vườn
    b.strokeStyle = '#cbb48a'; b.lineWidth = ROAD_W * PPM; b.lineCap = 'round';
    b.beginPath(); b.arc(-B.x0 * PPM, -B.z0 * PPM, RING_ROAD_R * PPM, 0, Math.PI * 2); b.stroke();
    for (const R of RADIALS) { b.beginPath(); b.moveTo((R.c * R.r0 - B.x0) * PPM, (R.s * R.r0 - B.z0) * PPM); b.lineTo((R.c * R.r1 - B.x0) * PPM, (R.s * R.r1 - B.z0) * PPM); b.stroke(); }
    const quad = (L, u0, v0, u1, v1) => { b.beginPath(); for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) { const [x, z] = lotToWorld(L, u, v); b.lineTo((x - B.x0) * PPM, (z - B.z0) * PPM); } b.closePath(); };
    b.lineWidth = 1.5; b.strokeStyle = '#3f7a32';
    for (const L of LOTS) { b.fillStyle = '#9bd67a'; quad(L, -LOT_W / 2, -LOT_L / 2, LOT_W / 2, LOT_L / 2); b.fill(); b.stroke(); }
    b.fillStyle = 'rgba(122,86,52,.85)'; for (const L of HOUSE_LOTS) { quad(L, -HOUSE_W / 2, HOUSE_V1 - HOUSE_D, HOUSE_W / 2, HOUSE_V1); b.fill(); }
    // nhà, tường của thị trấn
    b.fillStyle = 'rgba(122,86,52,.75)';
    for (const r of ctx.boxes || []) b.fillRect((r.x0 - B.x0) * PPM, (r.z0 - B.z0) * PPM, Math.max(1.5, (r.x1 - r.x0) * PPM), Math.max(1.5, (r.z1 - r.z0) * PPM));
    // sàn gỗ, bến nổi (làng nổi trên biển)
    b.fillStyle = '#b07f4e'; b.strokeStyle = '#6b4a2b'; b.lineWidth = 1;
    for (const k of ctx.decks || []) { if (ctx.destiny && ctx.destiny.mapHide(k.x0, k.z0, 1)) continue; const r = [(k.x0 - B.x0) * PPM, (k.z0 - B.z0) * PPM, (k.x1 - k.x0) * PPM, (k.z1 - k.z0) * PPM]; b.fillRect(...r); b.strokeRect(...r); }
    baseTown = !!RS; baseDone = true;
  }

  // ---------- Địa danh ----------
  function places() {
    const L = [];
    for (const b of BLOCKS) L.push({ n: b.name.toUpperCase(), x: (b.r[0] + b.r[2]) / 2, z: b.r[1] + 6, big: 2 });
    for (const e of EXTRA) L.push({ n: e.name.toUpperCase(), x: (e.r[0] + e.r[2]) / 2, z: (e.r[1] + e.r[3]) / 2, big: 2 });
    for (const t of TEMPLES) L.push({ n: t.name, x: t.x, z: t.z, ic: '⛩️' });
    if (ctx.destiny) L.push(...ctx.destiny.places());
    if (ctx.eggs && ctx.eggs.spots) for (const q of ctx.eggs.spots()) if (!q.hide) L.push({ n: q.n, x: q.x, z: q.z, ic: q.ic, spot: true });
    { const t = ctx.story && ctx.story.state().started && ctx.story.target(); if (t) L.push({ n: '🧩 Nhiệm vụ cốt truyện', x: t[0], z: t[1], ic: '🧩' }); }   // story/: điểm cần tới tiếp theo
    for (const q of ctx.mapPlaces || []) L.push(q);   // địa danh do phần khác thêm (sea/index.js: làng chài, bến phà)
    const sc = ctx.school; if (!sc) return L;
    if (sc.gate) L.push({ n: 'Cổng trường', x: sc.gate[0], z: sc.gate[1], ic: '🏫' });
    const RS = sc.RS;
    if (RS && RS.R) for (const k in RS.R) { const r = RS.R[k]; if (!r || !r.name || r.w == null || r.y + r.h / 2 < Y_MIN || r.y + r.h / 2 > Y_MAX) continue; const [cx, cz] = to3(r.x + r.w / 2, r.y + r.h / 2); L.push({ n: r.name, x: cx, z: cz, ext: Math.min(r.w, r.h, 2400) * 0.05 }); }
    for (const q of sc.doors || []) L.push({ n: q.d.n.split('·')[0].trim(), x: q.x, z: q.z, door: true });
    for (const g of ctx.mgSigns || []) L.push({ n: '🎮 ' + g.n, x: g.x, z: g.z, ic: '🎮' });   // mini game 3D (mg/signs.js)
    return L;
  }

  // ---------- Xem / phóng to ----------
  let open = false, cx = 0, cz = 0, zoom = 3, tip = null, frozenBefore = false, placeList = [];
  const W = () => cv.clientWidth, H = () => cv.clientHeight;
  const sx = x => (x - cx) * zoom + W() / 2, sy = z => (z - cz) * zoom + H() / 2;
  const clampView = () => { const V = ctx.mapBounds || B; cx = Math.max(V.x0, Math.min(V.x1, cx)); cz = Math.max(V.z0, Math.min(V.z1, cz)); zoom = Math.max(ctx.mapBounds ? 0.3 : 0.8, Math.min(14, zoom)); };   // ctx.mapBounds: vùng ngoài khơi (regions/index.js)
  const focusMe = z => { const p = ctx.player.pos; cx = p.x; cz = p.z; if (z) zoom = z; clampView(); };
  root.querySelector('.zoom').onclick = e => { const z = e.target.dataset.z; if (!z) return; if (z === 'me') focusMe(); else { zoom *= +z; clampView(); } };
  root.querySelector('.x').onclick = () => toggle(false);
  btn.onclick = () => toggle(true);
  // Phím M mở/đóng bản đồ 3D (pha capture)
  const typing = el => el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable);
  const onKey = w => e => {
    if (e.code === 'KeyM') { if (typing(e.target) || typing(w.document.activeElement)) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.repeat) return; toggle(); }
    else if (e.code === 'Escape' && open) { e.preventDefault(); e.stopImmediatePropagation(); toggle(false); }
  };
  addEventListener('keydown', onKey(window), true);
  // kéo / chụm 2 ngón / lăn chuột
  const pts = new Map(); let pinch = 0, moved = 0;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; pinch = 0; });
  cv.addEventListener('pointermove', e => {
    const o = pts.get(e.pointerId); if (!o) return;
    if (pts.size === 1) { cx -= (e.clientX - o[0]) / zoom; cz -= (e.clientY - o[1]) / zoom; moved += Math.abs(e.clientX - o[0]) + Math.abs(e.clientY - o[1]); }
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom *= d / pinch; pinch = d; moved = 99; }
    clampView();
  });
  const up = e => { const was = pts.has(e.pointerId); pts.delete(e.pointerId); pinch = 0; if (was && moved < 6 && e.type === 'pointerup') pick(e.offsetX, e.offsetY); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); const k = Math.exp(-e.deltaY * 0.0015), wx = (e.offsetX - W() / 2) / zoom + cx, wz = (e.offsetY - H() / 2) / zoom + cz; zoom *= k; clampView(); cx = wx - (e.offsetX - W() / 2) / zoom; cz = wz - (e.offsetY - H() / 2) / zoom; clampView(); }, { passive: false });

  // ---------- Sổ sinh vật: lại gần (≤ 7 m) hoặc bấm vào con vật → ghi vào sổ (lưu trên máy) ----------
  const DEX_KEY = 'island.dex', ALL = [...SPECIES.map(S => ({ id: S.id, name: S.name, fact: S.fact })), ...Object.values(FAUNA_INFO)];
  let dex = {}; try { dex = JSON.parse(localStorage.getItem(DEX_KEY) || '{}'); } catch (e) {}
  const dexBtn = root.querySelector('[data-d]'), dexBox = document.createElement('div'); dexBox.className = 'dex'; dexBox.hidden = true; root.appendChild(dexBox);
  const dexCount = () => ALL.filter(S => dex[S.id]).length;
  const dexLabel = () => { dexBtn.textContent = `📗 Sổ sinh vật ${dexCount()}/${ALL.length}`; };
  const renderDex = () => { dexBox.innerHTML = `<h3>📗 Sổ sinh vật · ${dexCount()}/${ALL.length} loài</h3>` + [...ALL].sort((a, b) => (dex[b.id] ? 1 : 0) - (dex[a.id] ? 1 : 0)).map(S => dex[S.id]
    ? `<div class="it"><b>${ANIMAL_ICON[S.id] || S.icon || '🐾'} ${S.name}</b><span>${S.fact}</span></div>` : `<div class="it no"><b>❓ ???</b><span>Chưa gặp — đi khám phá đảo để tìm nhé!</span></div>`).join(''); };
  dexBtn.onclick = () => { dexBox.hidden = !dexBox.hidden; if (!dexBox.hidden) renderDex(); };
  ctx.discover = S => { if (!S || !S.id || dex[S.id]) return; dex[S.id] = Date.now(); try { localStorage.setItem(DEX_KEY, JSON.stringify(dex)); } catch (e) {} dexLabel();
    ctx.toast && ctx.toast(`📗 Loài mới trong Sổ sinh vật: <b>${ANIMAL_ICON[S.id] || S.icon || ''} ${S.name}</b> (${dexCount()}/${ALL.length})<br>${S.fact}`, 6000); ctx.sfx && ctx.sfx('ok'); };
  ctx.dexAdd = list => { for (const S of list) if (!ALL.some(a => a.id === S.id)) ALL.push(S); dexLabel(); };   // thẻ thêm (sinh vật Rừng Phép Thuật…)
  dexLabel();
  let dexT = 0;
  function scanDex(dt) { // 2 lần/giây: con vật nào trong 7 m quanh người chơi
    if ((dexT -= dt) > 0 || !ctx.animals) return; dexT = 0.5; const p = ctx.player.pos;
    const amb = ctx.ambience; // cá nhảy & đom đóm do ambience.js vẽ
    if (amb && amb.fish && amb.fish.visible) ctx.discover(FAUNA_INFO.fish);
    if (amb && ctx.sky && ctx.sky.state.night > 0.8) ctx.discover(FAUNA_INFO.firefly);
    for (const A of ctx.animals.list.concat(ctx.animals.flocks || [])) { const q = A.root.position; if (!dex[A.S.id] && Math.abs(q.x - p.x) < 7 && Math.abs(q.z - p.z) < 7 && (A.S.id !== 'firefly' || Math.hypot(q.x - p.x, q.z - p.z) < 40)) ctx.discover(A.S); }
  }

  function toggle(v = !open) {
    if (v && !open && ctx.mapHook && ctx.mapHook()) return;   // nơi khác (vd. nội thất Học viện) tự mở bản đồ riêng
    if (v === open) return; open = v; ctx.mapOpen = v; root.hidden = !v; tip = null;
    if (v) {
      ctx.sfx && ctx.sfx('ui');
      if (!baseDone || (!baseTown && ctx.school && ctx.school.RS)) buildBase();
      placeList = places().sort((a, b) => (b.ic ? 1 : 0) - (a.ic ? 1 : 0));   // biểu tượng giữ chỗ trước, chữ to tự né focusMe(opts.near ? 4 : zoom); frozenBefore = ctx.player.frozen; ctx.player.frozen = true;
    } else ctx.player.frozen = frozenBefore;
  }

  // ---------- Vẽ mỗi khung hình khi đang mở ----------
  let icons = [];
  function bubble(x, y, emoji, r, ring) {
    g.beginPath(); g.arc(x, y + 2, r, 0, 7); g.fillStyle = 'rgba(0,0,0,.25)'; g.fill();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#fffaf0'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = ring || '#7fb8d8'; g.stroke();
    g.font = `${Math.round(r * 1.15)}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, x, y + 1);
  }
  function text(t, x, y, size, fill = '#fff', stroke = '#3a2a16') {
    g.font = `900 ${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = Math.max(3, size / 4); g.strokeStyle = stroke; g.strokeText(t, x, y); g.fillStyle = fill; g.fillText(t, x, y);
  }
  // ---------- Câu chào riêng khi bước vào từng khu (thay câu "Chào mừng đến Trường Rubik" lặp lại) ----------
  const GREET = {
    A: '🏫 <b>Trường Rubik</b> — chào bạn! Bước vào cửa có chấm cam để chơi mini game học tập.',
    B: '🌲 <b>Đồi thông & Phố Đà Lạt</b> — gió thông reo mát rượi. Gợi ý: trên đồi phía Bắc có cái giếng cổ biết "trả lời".',
    C: '📚 <b>Thư viện & Phố mua sắm</b> — đọc sách, mua đồ. Gợi ý: trên đồi gần Thư viện có trò xếp đĩa mang tên thủ đô.',
    D: '🏅 <b>Thể thao & Rubik Kart</b> — vận động cho khoẻ! Gợi ý: đỉnh đồi phía sau có hòn đá in hình xoắn ốc.',
    E: '🛶 <b>Làng nổi trên biển</b> — nhà sàn trên mặt nước. Nhớ đi trên cầu gỗ cẩn thận nhé!',
    K: '✈️ <b>Sân bay Cánh Diều</b> — bấm Lái máy bay, thử bay xuyên 3 vòng mây trên trời.',
    F: '🦒 <b>Công viên Safari</b> — lại gần con vật để ghi vào 📗 Sổ sinh vật.',
    G: '🌸 <b>Học viện Hoa Phượng</b> — Gợi ý: bên đường vào có tấm bia đá khắc chữ cổ.',
    H: '🏖️ <b>Resort Biển Xanh</b> — tắm biển, lặn ngắm san hô. Kiên nhẫn ngắm biển, biết đâu cá voi nhảy!',
    I: '⛩️ <b>Rừng & Đền Tri Thức</b> — nói khẽ thôi nhé. Gợi ý: trong rừng có cây đa nghìn năm tuổi.',
  };
  const ZONES = [...BLOCKS, ...EXTRA].filter(z => z.r && GREET[z.id]);
  let zoneT = 0;
  function scanZone(dt) { // 2 lần/giây; ra khỏi khu phải cách mép 8 m mới tính là rời (khỏi chào lại khi đi dọc mép)
    if ((zoneT -= dt) > 0) return; zoneT = 0.5; const p = ctx.player.pos, cur = ZONES.find(z => z.id === ctx.zoneId);
    const inZ = (z, m) => p.x >= z.r[0] - m && p.x <= z.r[2] + m && p.z >= z.r[1] - m && p.z <= z.r[3] + m;
    if (cur && inZ(cur, 8)) return; const z = ZONES.find(q => inZ(q, 0)); ctx.zoneId = z ? z.id : null;
    if (!z || !ctx.school || !ctx.school.ready || ctx.zoneGreeted === z.id || p.y > ctx.terrain.heightAt(p.x, p.z) + 21) return;   // đang bay: aircraft.js tự báo tên khu
    ctx.zoneGreeted = z.id; ctx.toast && ctx.toast(GREET[z.id], 5500);
  }
  let lastT = performance.now();
  function update() {
    const now = performance.now(); scanDex(Math.min(0.1, (now - lastT) / 1000)); scanZone(Math.min(0.1, (now - lastT) / 1000)); lastT = now;
    if (!open) return;
    const dpr = Math.min(devicePixelRatio, 2), w = W(), h = H();
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#3aa3a9'; g.fillRect(0, 0, w, h);
    g.imageSmoothingEnabled = zoom < PPM * 2;
    g.drawImage(base, sx(B.x0), sy(B.z0), (B.x1 - B.x0) * zoom, (B.z1 - B.z0) * zoom);
    const p = ctx.player.pos, inView = (x, z, m = 30) => { const X = sx(x), Y = sy(z); return X > -m && X < w + m && Y > -m && Y < h + m; };
    const near = (x, z) => !opts.near || Math.hypot(x - p.x, z - p.z) < NEAR;
    if (opts.near) { g.beginPath(); g.arc(sx(p.x), sy(p.z), NEAR * zoom, 0, 7); g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeStyle = 'rgba(255,243,214,.9)'; g.stroke(); g.setLineDash([]); }
    icons = []; const taken = [];
    for (const el of root.querySelectorAll('.bar button, .x, .zoom, .hint')) { const r = el.getBoundingClientRect(), o = cv.getBoundingClientRect(); if (r.width) taken.push([r.left - o.left + r.width / 2, r.top - o.top + r.height / 2, r.width / 2 + 3, r.height / 2 + 3]); }
    taken.push([58, h - 110, 52, 52]);   // la bàn
    const topSafe = Math.max(30, ...taken.filter(q => q[1] < h / 3).map(q => q[1] + q[3]));
    const free = (x, y, r, rh = r) => { for (const q of taken) if (Math.abs(q[0] - x) < q[2] + r && Math.abs(q[1] - y) < q[3] + rh) return false; taken.push([x, y, r, rh]); return true; }; // chống chồng chữ/biểu tượng
    for (const f of ctx.mapLayers || []) f({ g, sx, sy, zoom, text, bubble, icons, free });   // lớp thêm: vùng ngoài khơi (regions/index.js)
    // địa danh
    if (opts.places) for (const L of placeList) {
      if (!inView(L.x, L.z, 200) || !near(L.x, L.z)) continue; const X = sx(L.x), Y = sy(L.z);
      if (L.big) { const fs = Math.round(Math.max(13, Math.min(26, zoom * 9))); g.font = `900 ${fs}px system-ui`; const hw = g.measureText(L.n).width / 2 + 4, Y0 = Math.max(Y, topSafe + fs);   // tên khu sát mép trên → hạ xuống dưới hàng nút
        for (const k of [0, -1.6, 1.6, -3.2, 3.2, 4.8, 6.4]) { const yy = Y0 + k * fs; if (free(X, yy, hw, fs * 0.7)) { text(L.n, X, yy, fs, '#fff3d6'); break; } } if (L.ic) { bubble(X, Y, L.ic, 15, '#e0a030'); icons.push({ x: X, y: Y, t: L.n }); } continue; }
      if (L.door) { if (zoom < 5) continue; g.beginPath(); g.arc(X, Y, 4, 0, 7); g.fillStyle = '#f0a23a'; g.fill(); if (zoom > 8) { g.font = '900 11px system-ui'; if (free(X, Y - 12, g.measureText(L.n).width / 2 + 3, 8)) text(L.n, X, Y - 12, 11); } icons.push({ x: X, y: Y, t: '🚪 ' + L.n }); continue; }
      if (L.ic) { if (!free(X, Y, 15) && L.spot) continue; bubble(X, Y, L.ic, 14, L.spot ? '#c77dd8' : '#e0a030'); icons.push({ x: X, y: Y, t: L.n }); if (zoom > 1.6) { g.font = '900 13px system-ui'; const hw = g.measureText(L.n).width / 2 + 3; for (const yy of [Y + 24, Y - 24]) if (free(X, yy, hw, 9)) { text(L.n, X, yy, 13); break; } } continue; }
      const ext = (L.ext || 10) * zoom; if (ext < 34) continue;
      const fs = Math.max(11, Math.min(18, ext / 6)), T = L.n.toUpperCase(); g.font = `900 ${fs}px system-ui`; if (free(X, Y, g.measureText(T).width / 2 + 4, fs * 0.7)) text(T, X, Y, fs);
    }
    // con vật
    if (opts.animals && ctx.animals) for (const A of ctx.animals.list.concat(ctx.animals.flocks || [])) {
      const q = A.root.position; if (!inView(q.x, q.z) || !near(q.x, q.z)) continue; const X = sx(q.x), Y = sy(q.z);
      if (!free(X, Y, 12)) continue; bubble(X, Y, ANIMAL_ICON[A.S.id] || '🐾', 13); icons.push({ x: X, y: Y, t: `${ANIMAL_ICON[A.S.id] || ''} ${A.S.name}: ${A.S.fact}` });
    }
    // mọi người (trường Rubik)
    const RS = ctx.school && ctx.school.RS;
    if (opts.people && RS && zoom > 1.5) {
      const list = []; for (const a of RS.agents) if (a.visible && !a.inSub) list.push(a); for (const n of RS.npcs) if (RS.npcShown(n)) list.push(n);
      for (const a of list) {
        const [x, z] = to3(a.x, a.y); if (a.y < Y_MIN || a.y > Y_MAX || !inView(x, z) || !near(x, z)) continue; const X = sx(x), Y = sy(z);
        const teacher = !a.kind && a.student === false, ic = a.kind ? NPC_ICON[a.kind] || '🧍' : teacher ? (a.long ? '👩‍🏫' : '👨‍🏫') : '🧒';
        if (!free(X, Y, 10)) continue; bubble(X, Y, ic, 11, teacher ? '#ffd23f' : a.kind ? '#9ad26e' : '#ff8a8a');
        icons.push({ x: X, y: Y, t: a.kind ? NPC_NAME[a.kind] || 'Người dân' : teacher ? `${a.name} · ${String(a.role || '').split(',')[0]}` : `${a.name} (học sinh)` });
      }
    }
    // bí mật đã tìm: dấu ✔ xanh (khối Rubik, vòng mây… cũng hiện khi đã lấy)
    if (opts.eggs && ctx.eggs && ctx.eggs.spots) for (const q of ctx.eggs.spots()) {
      if (!q.done || !inView(q.x, q.z) || !near(q.x, q.z)) continue; const X = sx(q.x) + (q.hide ? 0 : 12), Y = sy(q.z) - (q.hide ? 0 : 12);
      if (q.hide) { bubble(X, Y, q.ic, 11, '#3bb54a'); icons.push({ x: X, y: Y, t: '✔ ' + q.n }); }
      g.beginPath(); g.arc(X + (q.hide ? 9 : 0), Y - (q.hide ? 9 : 0), 8, 0, 7); g.fillStyle = '#3bb54a'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
      g.font = '900 11px system-ui'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✔', X + (q.hide ? 9 : 0), Y - (q.hide ? 9 : 0) + 1);
    }
    // bạn: mũi tên theo hướng đi
    { const X = sx(p.x), Y = sy(p.z), r = ctx.player.rot; g.save(); g.translate(X, Y); g.rotate(Math.PI - r);
      g.beginPath(); g.moveTo(0, -15); g.lineTo(11, 11); g.lineTo(0, 5); g.lineTo(-11, 11); g.closePath(); g.fillStyle = '#ff5a3c'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); g.restore(); text('BẠN', X, Y + 22, 12, '#ffe08a'); }
    frame(w, h);
    if (tip) { // ô tên khi bấm vào biểu tượng
      g.font = '700 14px system-ui'; const lines = wrap(tip.t, Math.min(300, w - 40)), bw = Math.max(...lines.map(l => g.measureText(l).width)) + 24, bh = lines.length * 19 + 14;
      const bx = Math.max(10, Math.min(w - bw - 10, tip.x - bw / 2)), by = Math.max(60, tip.y - bh - 22);
      g.fillStyle = '#fff3d6'; g.strokeStyle = '#7a5a2e'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(bx, by, bw, bh, 12); g.fill(); g.stroke();
      g.fillStyle = '#4a3218'; g.textAlign = 'left'; g.textBaseline = 'top'; lines.forEach((l, i) => g.fillText(l, bx + 12, by + 8 + i * 19));
    }
  }
  function wrap(t, maxW) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const s = cur ? cur + ' ' + wd : wd; if (g.measureText(s).width > maxW && cur) { out.push(cur); cur = wd; } else cur = s; } if (cur) out.push(cur); return out; }
  function pick(x, y) { let best = null, bd = 22; for (const q of icons) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = q; } } tip = best; best && ctx.sfx && ctx.sfx('ui'); }
  // khung giấy viền nét đứt + la bàn
  function frame(w, h) {
    const m = 10; g.lineWidth = 14; g.strokeStyle = '#f3dfa6'; g.strokeRect(m - 3, m - 3, w - 2 * m + 6, h - 2 * m + 6);
    g.lineWidth = 4; g.setLineDash([18, 12]); g.strokeStyle = '#fff8e0'; g.strokeRect(m + 10, m + 10, w - 2 * m - 20, h - 2 * m - 20); g.setLineDash([]);
    const X = 58, Y = h - 110; g.save(); g.translate(X, Y);
    g.fillStyle = 'rgba(255,248,224,.85)'; g.strokeStyle = '#7a5a2e'; g.lineWidth = 2;
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -30); g.lineTo(7, 0); g.lineTo(-7, 0); g.closePath(); g.fill(); g.stroke(); }
    g.restore(); text('B', X, Y - 40, 13, '#fff3d6'); text('Đ', X + 40, Y, 12); text('N', X, Y + 40, 12); text('T', X - 40, Y, 12);
  }

  return { update, toggle, get open() { return open; }, redraw() { baseDone = false; } };
}
