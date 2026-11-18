// ================= v48 · MAP & HOUSE: sắp xếp bản đồ trong game + mẫu nhà chuẩn tỷ lệ vàng (5 kiểu) =================
// Mọi tên toàn cục ở đây có tiền tố v48m / V48M. Gắn vào v46/v47 bằng cách bọc hàm, không sửa file cũ.
const V48M_PHI = 1.618033988749895;
const V48M = {KEY:'truong-v48m-layout', def:{}, ed:null, spr:new Map(), json:null,
  // khu trường học + tượng đài: phiên lâu đài đang làm, khoá lại không cho kéo
  LOCK:{rubik:1, chess:1, music:1, hall:1, rubikyard:1, office:1, attend:1, elec:1, field:1, rubikpark:1}};

// ---------- 0. bố cục đã lưu: áp vào V46L TRƯỚC khi v46Init dựng đảo (file này nạp trước main.js) ----------
Object.entries(V46L.zones).forEach(([id, c]) => { V48M.def[id] = [c.x, c.y]; });
function v48mLoad(){ try { const s = JSON.parse(localStorage.getItem(V48M.KEY) || 'null'); return s && s.zones ? s.zones : null; } catch(e){ return null; } }
(function(){ const s = v48mLoad(); if(!s) return; for(const id in s){ const c = V46L.zones[id], p = s[id]; if(c && !V48M.LOCK[id] && Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])){ c.x = Math.round(p[0]); c.y = Math.round(p[1]); } } })();

// dựng lại đảo sau khi dời khu: khu, đường, cây, ô nền, ảnh toàn cảnh, bản đồ
function v48mRebuild(){
  V46.Z = []; V46.ZI = {}; v46Build(); v46Roads(); V46RC.clear(); v46Deco();
  V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; for(const k in V46ZC) delete V46ZC[k];
  V47W.pc = {}; V47W.band = null; MAP.places46 = null; V46G.key = ''; V46G.from = null;
  agents.forEach(a => { a.v46t = null; a._lx = null; }); try { v46NormAll(); } catch(e){}
}

// ---------- 1. chế độ sắp xếp ----------
const V48M_G = Math.round(V46L.GRASS/Math.pow(V48M_PHI, 7));      // ô lưới = R cỏ / φ⁷ ≈ 163px
function v48mFoot(){   // khung từng khu so với tâm khu (toạ độ đảo, tâm đảo = 0,0)
  const F = {}; V46.Z.forEach(z => { if(z.flip) return; const c = V46L.zones[z.id]; if(!c) return; const cx = V46L.CX + c.x, cy = V46L.CY + c.y;
    F[z.id] = {e:[z.n.x0 - cx, z.n.y0 - cy, z.n.x1 - cx, z.n.y1 - cy], r:[z.nr.x0 - cx, z.nr.y0 - cy, z.nr.x1 - cx, z.nr.y1 - cy]}; });
  return F;
}
function v48mThumbs(F){
  const ov = v46Overview(), s = V46T.OVS, T = {};
  for(const id in F){ const z = V46.ZI[id], n = z.n, w = Math.max(2, Math.round((n.x1 - n.x0)*s)), h = Math.max(2, Math.round((n.y1 - n.y0)*s)), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(ov, n.x0*s, n.y0*s, (n.x1 - n.x0)*s, (n.y1 - n.y0)*s, 0, 0, w, h); T[id] = c; }
  return T;
}
function v48mName(id){ const i = (typeof MAP_INFO !== 'undefined' && MAP_INFO[id]) || null; return [(i && i[0]) || '📍', (R[id] && R[id].name) || (id === 'houses' ? 'Khu nhà học sinh' : id === 'dalat' ? 'Phố nhà Đà Lạt' : id)]; }
function v48mOpen(){
  if(!V46.on) return; let E = V48M.ed;
  if(!E){ v48mUi(); E = V48M.ed; }
  const F = v48mFoot(); E.F = F; E.T = v48mThumbs(F); E.pos = {}; for(const id in F) E.pos[id] = [V46L.zones[id].x, V46L.zones[id].y];
  E.sel = null; E.drag = null; E.pins.clear(); E.pinch = 0; E.bad = null; E.dirty = true; E.changed = false;
  const cv = E.cv; E.z = Math.min(cv.clientWidth || innerWidth, cv.clientHeight || innerHeight)/(V46L.ISLAND*2.15); E.cx = 0; E.cy = 0;
  E.root.hidden = false; E.open = true; v48mInfo(); cancelAnimationFrame(E.raf); E.raf = requestAnimationFrame(v48mDraw);
}
function v48mClose(){ const E = V48M.ed; if(!E) return; E.root.hidden = true; E.open = false; cancelAnimationFrame(E.raf); E.T = null; }
function v48mRect(E, id, p, k){ const f = E.F[id][k || 'r'], q = p || E.pos[id]; return [f[0] + q[0], f[1] + q[1], f[2] + q[0], f[3] + q[1]]; }
// hợp lệ: nằm trong vòng cỏ, không đè khu khác, không lấn quảng trường cổng trường và bến tàu
function v48mOk(E, id, p){
  const r = v48mRect(E, id, p), e = v48mRect(E, id, p, 'e'), lim = V46L.GRASS - 60;
  for(const [x, y] of [[e[0], e[1]], [e[2], e[1]], [e[0], e[3]], [e[2], e[3]]]) if(Math.hypot(x, y) > lim) return 'Ra ngoài bãi cỏ';
  if(Math.hypot(Math.max(r[0], Math.min(0, r[2])), Math.max(r[1], Math.min(0, r[3]))) < 330) return 'Đè lên cổng trường';
  const hb = V46.ZI.harbor.n, H = [hb.x0 - V46L.CX, hb.y0 - V46L.CY, hb.x1 - V46L.CX, hb.y1 - V46L.CY], gap = 36;
  const hit = q => r[0] < q[2] + gap && r[2] > q[0] - gap && r[1] < q[3] + gap && r[3] > q[1] - gap;
  if(hit(H)) return 'Đè lên bến tàu';
  for(const k in E.pos){ if(k === id) continue; if(hit(v48mRect(E, k))) return 'Đè lên ' + v48mName(k)[1]; }
  return '';
}
// lưới hút tỷ lệ vàng: ô R/φ⁷, và hút vào các vòng đường bán kính R/φ², R/φ khi ở gần
function v48mSnap(x, y){
  const rr = Math.hypot(x, y); for(const R0 of V46L.roads.rings){ const t = R0 + (rr > R0 ? 1 : -1)*(V46L.roads.width + 260); if(Math.abs(rr - t) < V48M_G*.35 && rr > 1){ return [Math.round(x/rr*t), Math.round(y/rr*t)]; } }
  return [Math.round(x/V48M_G)*V48M_G, Math.round(y/V48M_G)*V48M_G];
}
function v48mW2S(E, x, y){ const c = E.cv; return [c.clientWidth/2 + (x - E.cx)*E.z, c.clientHeight/2 + (y - E.cy)*E.z]; }
function v48mS2W(E, cx, cy){ const r = E.cv.getBoundingClientRect(); return [E.cx + (cx - r.left - r.width/2)/E.z, E.cy + (cy - r.top - r.height/2)/E.z]; }
function v48mHit(E, x, y){ let best = null, ba = 1e18; for(const id in E.pos){ const r = v48mRect(E, id, null, 'e'); if(x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]){ const a = (r[2] - r[0])*(r[3] - r[1]); if(a < ba){ ba = a; best = id; } } } return best; }
function v48mInfo(){
  const E = V48M.ed, el = E.info; if(!E.sel){ el.textContent = E.changed ? '✏️ Đã dời khu. Bấm 💾 Lưu để áp dụng.' : '👆 Chạm và kéo một khu để dời. Khu 🔒 là trường học, giữ nguyên.'; el.className = ''; return; }
  const [ic, nm] = v48mName(E.sel), p = E.pos[E.sel], lk = V48M.LOCK[E.sel];
  el.textContent = `${ic} ${nm} · x ${p[0]}, y ${p[1]}` + (lk ? ' · 🔒 khu trường học' : E.bad ? ' · ⛔ ' + E.bad : ''); el.className = E.bad ? 'bad' : '';
}
function v48mDraw(){
  const E = V48M.ed; if(!E || !E.open) return; E.raf = requestAnimationFrame(v48mDraw); if(!E.dirty) return; E.dirty = false;
  const cv = E.cv, g = E.g, dpr = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth, Hc = cv.clientHeight, L = V46L, se = S(), tau = Math.PI*2;
  if(cv.width !== Math.round(Wc*dpr) || cv.height !== Math.round(Hc*dpr)){ cv.width = Math.round(Wc*dpr); cv.height = Math.round(Hc*dpr); }
  E.z = Math.max(Math.min(Wc, Hc)/(L.ISLAND*2.6), Math.min(.6, E.z)); E.cx = Math.max(-L.ISLAND, Math.min(L.ISLAND, E.cx)); E.cy = Math.max(-L.ISLAND, Math.min(L.ISLAND, E.cy));
  const z = E.z; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = se.sea2; g.fillRect(0, 0, Wc, Hc);
  g.setTransform(dpr*z, 0, 0, dpr*z, dpr*(Wc/2 - E.cx*z), dpr*(Hc/2 - E.cy*z));
  const ring = (r, c) => { g.fillStyle = c; g.beginPath(); g.arc(0, 0, r, 0, tau); g.fill(); };
  ring(L.ISLAND + 420, se.sea); ring(L.ISLAND, se.sand); ring(L.GRASS, se.grass);
  // lưới φ (mờ) + các vòng đường tỷ lệ vàng
  g.save(); g.beginPath(); g.arc(0, 0, L.GRASS, 0, tau); g.clip();
  if(E.snap && V48M_G*z > 9){ g.strokeStyle = 'rgba(255,255,255,.13)'; g.lineWidth = 1/z; g.beginPath(); for(let v = -Math.ceil(L.GRASS/V48M_G)*V48M_G; v <= L.GRASS; v += V48M_G){ g.moveTo(v, -L.GRASS); g.lineTo(v, L.GRASS); g.moveTo(-L.GRASS, v); g.lineTo(L.GRASS, v); } g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(255,210,63,.75)'; g.lineWidth = 3/z; g.setLineDash([12/z, 8/z]); L.roads.rings.forEach(r => { g.beginPath(); g.arc(0, 0, r, 0, tau); g.stroke(); }); g.setLineDash([]);
  // quảng trường + cổng trường, bến tàu (cố định)
  ring(300, '#d9d2c3'); ring(300/V48M_PHI, '#cfc7b6');
  const hb = V46.ZI.harbor.n; g.fillStyle = 'rgba(30,60,110,.55)'; g.fillRect(hb.x0 - L.CX, hb.y0 - L.CY, hb.x1 - hb.x0, hb.y1 - hb.y0);
  // các khu
  const ids = Object.keys(E.pos).sort((a, b) => (a === E.sel) - (b === E.sel));
  ids.forEach(id => { const e = v48mRect(E, id, null, 'e'), t = E.T && E.T[id];
    if(t){ g.imageSmoothingEnabled = true; g.drawImage(t, e[0], e[1], e[2] - e[0], e[3] - e[1]); } else { g.fillStyle = '#c9b98f'; g.fillRect(e[0], e[1], e[2] - e[0], e[3] - e[1]); }
    const sel = id === E.sel, lk = V48M.LOCK[id];
    g.lineWidth = (sel ? 4 : 2)/z; g.strokeStyle = sel ? (E.bad ? '#ff4d4d' : '#ffd23f') : lk ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.85)';
    if(lk) g.setLineDash([8/z, 6/z]); g.strokeRect(e[0], e[1], e[2] - e[0], e[3] - e[1]); g.setLineDash([]);
    if(sel && E.bad){ g.fillStyle = 'rgba(255,60,60,.28)'; g.fillRect(e[0], e[1], e[2] - e[0], e[3] - e[1]); } });
  // nhãn (toạ độ màn hình, chữ ≥ 14px)
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
  const sGate = v48mW2S(E, 0, 0); g.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText('🏫', sGate[0], sGate[1]);
  ids.forEach(id => { const e = v48mRect(E, id, null, 'e'), a = v48mW2S(E, (e[0] + e[2])/2, (e[1] + e[3])/2), [ic, nm] = v48mName(id), sel = id === E.sel, wpx = (e[2] - e[0])*z;
    if(a[0] < -80 || a[0] > Wc + 80 || a[1] < -40 || a[1] > Hc + 40) return;
    const showName = sel || wpx > 74 || z > .09; g.font = '16px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText((V48M.LOCK[id] ? '🔒' : '') + ic, a[0], a[1] - (showName ? 11 : 0));
    if(!showName) return; g.font = "700 14px 'Be Vietnam Pro', Nunito, sans-serif"; const tw = g.measureText(nm).width + 10;
    g.fillStyle = sel ? '#ffd23f' : 'rgba(10,15,34,.82)'; g.fillRect(a[0] - tw/2, a[1] + 1, tw, 20); g.fillStyle = sel ? '#1a1206' : '#fff'; g.fillText(nm, a[0], a[1] + 11); });
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
function v48mUi(){
  const m = document.createElement('div'); m.id = 'v48mEd'; m.hidden = true; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Sắp xếp bản đồ đảo');
  m.innerHTML = '<canvas id="v48mCv" aria-label="Kéo khu để dời, chụm hai ngón để phóng to"></canvas>'
    + '<div class="v48m-top"><b>🧩 Sắp xếp đảo</b><button type="button" id="v48mClose" aria-label="Đóng, không lưu">✕</button></div>'
    + '<div id="v48mInfo" aria-live="polite"></div>'
    + '<div class="v48m-bar"><button type="button" id="v48mSnap" aria-pressed="true">🧲 Lưới φ</button><button type="button" id="v48mZo" aria-label="Thu nhỏ">－</button><button type="button" id="v48mZi" aria-label="Phóng to">＋</button>'
    + '<button type="button" id="v48mReset">↺ Mặc định</button><button type="button" id="v48mCopy">📋 Sao chép bố cục</button><button type="button" id="v48mSave" class="primary">💾 Lưu</button></div>'
    + '<textarea id="v48mOut" hidden readonly aria-label="Bố cục JSON"></textarea>';
  document.body.appendChild(m);
  const cv = $('#v48mCv'), E = V48M.ed = {root:m, cv, g:cv.getContext('2d'), info:$('#v48mInfo'), pins:new Map(), pinch:0, snap:true, z:.05, cx:0, cy:0, open:false, dirty:true, raf:0};
  const zoom = (f, sx, sy) => { const r = cv.getBoundingClientRect(); sx = sx == null ? r.left + r.width/2 : sx; sy = sy == null ? r.top + r.height/2 : sy; const a = v48mS2W(E, sx, sy); E.z *= f; E.z = Math.max(.02, Math.min(.6, E.z)); const b = v48mS2W(E, sx, sy); E.cx += a[0] - b[0]; E.cy += a[1] - b[1]; E.dirty = true; };
  $('#v48mClose').onclick = () => { if(E.changed && !confirm('Đóng mà không lưu các thay đổi?')) return; v48mClose(); };
  $('#v48mZi').onclick = () => zoom(1.35); $('#v48mZo').onclick = () => zoom(1/1.35);
  $('#v48mSnap').onclick = () => { E.snap = !E.snap; $('#v48mSnap').setAttribute('aria-pressed', E.snap); E.dirty = true; };
  $('#v48mReset').onclick = () => { for(const id in E.pos) if(V48M.def[id]) E.pos[id] = V48M.def[id].slice(); E.sel = null; E.bad = null; E.changed = true; E.dirty = true; v48mInfo(); toast('↺ Đã đưa về bố cục mặc định. Bấm 💾 Lưu để áp dụng.'); };
  $('#v48mSave').onclick = v48mSave; $('#v48mCopy').onclick = v48mCopy;
  cv.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : .87, e.clientX, e.clientY); }, {passive:false});
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); E.pins.set(e.pointerId, [e.clientX, e.clientY]);
    if(E.pins.size === 1){ const [wx, wy] = v48mS2W(E, e.clientX, e.clientY), id = v48mHit(E, wx, wy);
      E.drag = {id, sx:e.clientX, sy:e.clientY, lx:e.clientX, ly:e.clientY, moved:false, p0:id ? E.pos[id].slice() : null, gx:id ? wx - E.pos[id][0] : 0, gy:id ? wy - E.pos[id][1] : 0};
      if(id){ E.sel = id; E.bad = null; v48mInfo(); E.dirty = true; } }
    else { const d = E.drag; if(d && d.id && d.p0){ E.pos[d.id] = d.p0; E.bad = null; } E.drag = null; const p = [...E.pins.values()]; E.pinch = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); E.dirty = true; } });
  cv.addEventListener('pointermove', e => { if(!E.pins.has(e.pointerId)) return; E.pins.set(e.pointerId, [e.clientX, e.clientY]);
    if(E.pins.size === 2){ const p = [...E.pins.values()], d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); if(E.pinch) zoom(d/E.pinch, (p[0][0] + p[1][0])/2, (p[0][1] + p[1][1])/2); E.pinch = d; return; }
    const d = E.drag; if(!d) return; if(Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true; if(!d.moved) return;
    if(d.id && !V48M.LOCK[d.id]){ const [wx, wy] = v48mS2W(E, e.clientX, e.clientY); let x = Math.round(wx - d.gx), y = Math.round(wy - d.gy); if(E.snap) [x, y] = v48mSnap(x, y); E.pos[d.id] = [x, y]; E.bad = v48mOk(E, d.id, E.pos[d.id]); v48mInfo(); }
    else { E.cx -= (e.clientX - d.lx)/E.z; E.cy -= (e.clientY - d.ly)/E.z; }
    d.lx = e.clientX; d.ly = e.clientY; E.dirty = true; });
  const up = e => { E.pins.delete(e.pointerId); if(E.pins.size < 2) E.pinch = 0; const d = E.drag; if(!d || E.pins.size) return; E.drag = null;
    if(d.id && d.moved && !V48M.LOCK[d.id]){ if(E.bad){ toast('⛔ ' + E.bad + ' · khu đã về chỗ cũ'); E.pos[d.id] = d.p0; E.bad = null; } else if(d.p0[0] !== E.pos[d.id][0] || d.p0[1] !== E.pos[d.id][1]) E.changed = true; }
    if(!d.id && !d.moved){ E.sel = null; E.bad = null; } v48mInfo(); E.dirty = true; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  window.addEventListener('resize', () => { if(E.open) E.dirty = true; });
  window.addEventListener('keydown', e => { if(!E.open) return;
    if(e.key === 'Escape'){ e.stopImmediatePropagation(); $('#v48mClose').click(); return; }
    const k = {ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1]}[e.key]; if(!k || !E.sel || V48M.LOCK[E.sel]) return; e.preventDefault(); e.stopImmediatePropagation();
    const p0 = E.pos[E.sel], p = [p0[0] + k[0]*V48M_G, p0[1] + k[1]*V48M_G], bad = v48mOk(E, E.sel, p); if(bad){ toast('⛔ ' + bad); return; } E.pos[E.sel] = p; E.changed = true; v48mInfo(); E.dirty = true; }, true);
}
function v48mSave(){
  const E = V48M.ed, out = {}; let diff = false;
  for(const id in E.pos){ if(V48M.LOCK[id]) continue; out[id] = E.pos[id].slice(); const d = V48M.def[id]; if(!d || d[0] !== out[id][0] || d[1] !== out[id][1]) diff = true; }
  for(const id in E.pos) if(!V48M.LOCK[id] && (E.pos[id][0] !== V46L.zones[id].x || E.pos[id][1] !== V46L.zones[id].y) && v48mOk(E, id, E.pos[id])){ E.sel = id; E.bad = v48mOk(E, id, E.pos[id]); v48mInfo(); E.dirty = true; toast('⛔ ' + v48mName(id)[1] + ': ' + E.bad); return; }
  try { if(diff) localStorage.setItem(V48M.KEY, JSON.stringify({v:1, zones:out})); else localStorage.removeItem(V48M.KEY); } catch(e){}
  for(const id in out) if(V46L.zones[id]){ V46L.zones[id].x = out[id][0]; V46L.zones[id].y = out[id][1]; }
  try { v48mRebuild(); } catch(e){ console.warn('v48m rebuild', e); }
  E.changed = false; v48mClose(); toast('💾 Đã lưu bố cục · đường đi đã vẽ lại');
}
// JSON giống SO_DO_THE_GIOI.json (mỗi khu một dòng) để gửi Claude đặt cố định cho mọi người
async function v48mCopy(){
  const E = V48M.ed; if(!V48M.json){ try { V48M.json = await fetch('SO_DO_THE_GIOI.json', {cache:'no-cache'}).then(r => r.json()); } catch(e){ V48M.json = {islandRadius:V46L.ISLAND, grassRadius:V46L.GRASS, center:'tâm đảo = (0,0)', zones:{}}; } }
  const J = JSON.parse(JSON.stringify(V48M.json)), Z = J.zones || (J.zones = {});
  for(const id in E.pos){ const z = V46.ZI[id], o = z ? z.o : {x:0, y:0, w:0, h:0}; Z[id] = Object.assign({name:v48mName(id)[1], w:o.w, h:o.h, gameX:o.x, gameY:o.y}, Z[id] || {}, {x:E.pos[id][0], y:E.pos[id][1]}); }
  J.v48_layout = 'Bố cục sắp xếp trong game (v48, ' + new Date().toISOString().slice(0, 10) + '). Toạ độ x,y = tâm khu, tâm đảo (0,0).';
  const head = Object.keys(J).filter(k => k !== 'zones').map(k => JSON.stringify(k) + ':' + JSON.stringify(J[k])).join(',');
  const txt = '{' + head + ',"zones":{\n' + Object.keys(Z).map(k => JSON.stringify(k) + ':' + JSON.stringify(Z[k])).join(',\n') + '\n}}\n';
  const ta = $('#v48mOut'); ta.value = txt; let ok = false;
  try { await navigator.clipboard.writeText(txt); ok = true; } catch(e){}
  if(!ok){ ta.hidden = false; ta.focus(); ta.select(); try { ok = document.execCommand('copy'); } catch(e){} }
  toast(ok ? '📋 Đã chép bố cục (JSON). Dán gửi Claude để đặt cố định cho mọi người.' : '📋 Chọn toàn bộ chữ trong ô rồi chép.');
  if(ok) setTimeout(() => { ta.hidden = true; }, 200);
}

// ---------- 2. mẫu nhà chuẩn tỷ lệ vàng ----------
// Khung chung (đơn vị px, a = rộng thân nhà):
//   thân nhà a × a/φ (hình chữ nhật vàng) = 1 ô vuông (gian chính, có cửa) + 1 hình chữ nhật vàng nhỏ (gian phụ, cửa sổ lớn)
//   mái cao = thân/φ · mái vươn = thân/φ⁴ · bệ = thân/φ⁵ · cửa rộng thân/φ³, cao thân/φ · cửa sổ tỉ lệ 1 : φ
const V48M_STY = ['vn', 'jp', 'eu', 'mod', 'wood'];
const V48M_STN = {vn:'Nhà ngói Việt', jp:'Nhà Nhật', eu:'Nhà châu Âu', mod:'Nhà hiện đại', wood:'Nhà gỗ'};
function v48mFrame(a){
  const P = V48M_PHI, r = Math.round, Hb = r(a/P), Hr = r(Hb/P), ov = r(Hb/P**4), pl = r(Hb/P**5), top = 26;
  const F = {a, Hb, Hr, ov, pl, top, W:a + 2*ov + 8, H:top + Hr + Hb + pl + 2}; F.bx = ov + 4; F.by = top + Hr; F.gy = F.by + Hb + pl; F.cx = F.bx + r(a/2);
  F.S = Hb; F.wing = a - Hb;                                       // ô vuông gian chính + gian phụ
  F.dw = r(Hb/P**3); F.dh = r(Hb/P); F.dx = F.bx + r((F.S - F.dw)/2); F.dy = F.by + Hb - F.dh;     // cửa giữa ô vuông
  const side = (F.S - F.dw)/2, ww = r(side/P), wh = r(ww*P);
  F.win = [{x:F.bx + r((side - ww)/2), y:F.dy, w:ww, h:wh}, {x:F.dx + F.dw + r((side - ww)/2), y:F.dy, w:ww, h:wh}];
  const bw = r(F.wing/P), bh = Math.min(r(bw*P), Hb - 2*pl - 6), bx = F.bx + F.S + r((F.wing - bw)/2), byy = F.by + r((Hb - bh)/P/P);
  F.big = {x:bx, y:byy, w:bw, h:bh};
  return F;
}
function v48mR(g, c, x, y, w, h){ g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function v48mPoly(g, pts, keep){ if(!keep) g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); }
// mái theo kiểu: trả về đường viền mái (để phủ tuyết) và vẽ mái
function v48mRoof(g, F, st, col){
  const {bx, by, a, Hr, ov, cx, top} = F, x0 = bx - ov, x1 = bx + a + ov, P = V48M_PHI, rows = (c1, c2, y0, y1, step) => { for(let y = y0, k = 0; y < y1; y += step, k++){ g.fillStyle = k % 2 ? c1 : c2; g.fillRect(x0 - 4, y, x1 - x0 + 8, 2); } };
  if(st === 'vn'){ const tw = Math.round(a/P), path = () => v48mPoly(g, [[x0, by], [x1, by], [cx + tw/2, top + 8], [cx - tw/2, top + 8]]);
    path(); g.fillStyle = '#b0522f'; g.fill(); g.save(); path(); g.clip(); for(let y = top + 10; y < by; y += 6){ g.fillStyle = '#c86a3d'; for(let x = x0 + ((y/6) % 2)*5; x < x1; x += 10) g.fillRect(x, y, 6, 3); g.fillStyle = '#8f3f22'; g.fillRect(x0, y + 4, x1 - x0, 1); } g.restore();
    v48mR(g, '#7a3218', cx - tw/2 - 6, top + 4, tw + 12, 5); v48mR(g, '#7a3218', cx - tw/2 - 10, top - 2, 6, 8); v48mR(g, '#7a3218', cx + tw/2 + 4, top - 2, 6, 8);     // bờ nóc cong vểnh
    v48mR(g, '#ffd23f', cx - 4, top - 4, 8, 6); v48mR(g, '#5a2512', x0, by - 3, x1 - x0, 4); return path; }
  if(st === 'jp'){ const m = top + Math.round(Hr/P), up = k => v48mPoly(g, [[x0 + ov*2, m + 4], [x1 - ov*2, m + 4], [cx + a/P/2 - 6, top + 6], [cx - a/P/2 + 6, top + 6]], k),
      lo = k => v48mPoly(g, [[x0 - 6, by], [x1 + 6, by], [x1 - ov, m], [x0 + ov, m]], k), path = () => { up(); g.rect(x0 - 6, m, x1 - x0 + 12, by - m); };
    lo(); g.fillStyle = '#353b48'; g.fill(); up(); g.fill(); g.save(); lo(); up(true); g.clip('nonzero'); rows('#4a5263', '#2a2f3a', top + 8, by, 5); g.restore();
    v48mR(g, '#1f232c', x0 - 8, by - 3, x1 - x0 + 16, 4); v48mR(g, '#1f232c', x0 - 10, by - 7, 5, 6); v48mR(g, '#1f232c', x1 + 5, by - 7, 5, 6);   // mái cong vểnh đầu
    v48mR(g, '#1f232c', cx - a/P/2 + 2, top + 3, a/P - 4, 4); v48mR(g, '#efe6d2', bx + 8, m + 6, a - 16, by - m - 10); for(let x = bx + 8; x < bx + a - 8; x += 14) v48mR(g, '#4a3426', x, m + 6, 2, by - m - 10);
    return path; }
  if(st === 'mod'){ const sx = bx + 4, sw = F.S - 4, path = () => { g.beginPath(); g.rect(sx - 6, top + 10, sw + 12, 5); g.rect(x0, by - 6, x1 - x0, 6); };
    v48mR(g, '#e9ebe6', sx, top + 14, sw, by - top - 14); v48mR(g, '#cfd3cc', sx, top + 14, 3, by - top - 14);
    const gw = Math.round(sw/P), gx = sx + Math.round((sw - gw)/2); v48mR(g, '#263a46', gx, top + 22, gw, by - top - 32); v48mR(g, 'rgba(255,255,255,.18)', gx + 3, top + 24, 4, by - top - 36);
    F.up = {x:gx, y:top + 22, w:gw, h:by - top - 32};
    for(let i = 0; i < 3; i++){ const px = sx + sw + 12 + i*Math.round((F.wing - 16)/3); v48mPoly(g, [[px, by - 8], [px + (F.wing - 22)/3, by - 8], [px + (F.wing - 22)/3 - 4, by - 22], [px - 4, by - 22]]); g.fillStyle = '#1f3a6b'; g.fill(); g.fillStyle = '#5b86c9'; g.fillRect(px - 2, by - 17, (F.wing - 22)/3 - 2, 1); }
    v48mR(g, '#f7f8f5', sx - 6, top + 10, sw + 12, 5); v48mR(g, '#4a4f55', sx - 6, top + 15, sw + 12, 2); v48mR(g, '#f7f8f5', x0, by - 6, x1 - x0, 6); v48mR(g, '#4a4f55', x0, by, x1 - x0, 2);
    return path; }
  // eu + wood: mái dốc hai mái, đỉnh ở điểm vàng của mái (cao Hr)
  const apex = top, path = () => v48mPoly(g, [[x0, by], [x1, by], [cx, apex]]);
  if(st === 'eu'){ const chx = cx + Math.round(a/P/P), chy = apex + Math.round(Hr*(chx - cx)/(x1 - cx)); v48mR(g, '#8e4a36', chx, chy - 26, 14, 30); v48mR(g, '#6b3426', chx - 2, chy - 30, 18, 5); for(let y = chy - 22; y < chy; y += 6) v48mR(g, '#a35a43', chx + ((y/6) % 2)*4, y, 6, 2); }
  else { const chx = cx - Math.round(a/P/P) - 14, chy = apex + Math.round(Hr*(cx - chx - 14)/(cx - x0)); v48mR(g, '#7d7f86', chx, chy - 24, 15, 28); for(let y = chy - 22; y < chy; y += 7) for(let x = chx + ((y/7) % 2)*4; x < chx + 13; x += 8) v48mR(g, '#9a9ca3', x, y, 6, 4); }
  path(); g.fillStyle = st === 'eu' ? '#7a3b3b' : '#4f7a46'; g.fill();
  g.save(); path(); g.clip();
  if(st === 'eu') for(let y = apex + 4, k = 0; y < by; y += 5, k++){ g.fillStyle = k % 2 ? '#8f4848' : '#6a3030'; for(let x = x0 + (k % 2)*4; x < x1; x += 8) g.fillRect(x, y, 7, 4); }
  else for(let y = apex + 4, k = 0; y < by; y += 6, k++){ g.fillStyle = k % 2 ? '#5f8f52' : '#3f6638'; for(let x = x0 + (k % 2)*5; x < x1; x += 10) g.fillRect(x, y, 9, 5); }
  g.restore();
  g.strokeStyle = st === 'eu' ? '#4a2020' : '#2c4a26'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, by); g.lineTo(cx, apex); g.lineTo(x1, by); g.stroke();
  // cửa sổ áp mái ở điểm vàng của mái
  const dwW = Math.round(F.dw*1.1), dwH = Math.round(dwW*P*.8), dwx = cx - Math.round(dwW/2), dwy = apex + Math.round(Hr/P) - Math.round(dwH/2);
  F.dorm = {x:dwx, y:dwy, w:dwW, h:dwH};
  if(st === 'eu'){ v48mR(g, '#f2e6cc', dwx - 3, dwy - 3, dwW + 6, dwH + 4); } else { v48mR(g, '#8a5a30', dwx - 3, dwy - 3, dwW + 6, dwH + 4); }
  return path;
}
function v48mWall(g, F, st, col){
  const {bx, by, a, Hb, pl, gy} = F;
  const wc = {vn:'#ecc983', jp:'#f3eee2', eu:'#f2e6cc', mod:'#f4f5f2', wood:'#9a6a3c'}[st];
  v48mR(g, wc, bx, by, a, Hb);
  if(st === 'vn'){ v48mR(g, '#d9b06a', bx, by, a, 4); for(const x of [bx, bx + F.S - 3, bx + a - 6]) v48mR(g, '#5a3018', x, by, 6, Hb); v48mR(g, 'rgba(0,0,0,.12)', bx, by + 4, a, 6); }
  if(st === 'jp'){ v48mR(g, '#4a3426', bx, by, a, 4); for(const x of [bx, bx + F.S - 2, bx + a - 4]) v48mR(g, '#4a3426', x, by, 4, Hb); v48mR(g, '#4a3426', bx, by + Math.round(Hb/V48M_PHI/V48M_PHI), a, 3); }
  if(st === 'eu'){ for(const x of [bx, bx + a - 7]) for(let y = by + 2, k = 0; y < by + Hb - 4; y += 9, k++) v48mR(g, '#cfc3a6', x + (k % 2 ? 0 : 1), y, k % 2 ? 7 : 5, 7); v48mR(g, '#d8ccb0', bx, by + Hb - 4, a, 4); }
  if(st === 'mod'){ v48mR(g, '#b7834f', bx + F.S, by, F.wing, Hb); for(let x = bx + F.S + 3; x < bx + a; x += 6) v48mR(g, '#9c6c3e', x, by, 2, Hb); v48mR(g, '#d5d8d2', bx + F.S - 2, by, 3, Hb); }
  if(st === 'wood'){ for(let y = by, k = 0; y < by + Hb; y += 7, k++){ v48mR(g, k % 2 ? '#a8763f' : '#8f5f30', bx, y, a, 7); v48mR(g, '#6d4422', bx, y + 6, a, 1); }
    for(let y = by + 3; y < by + Hb - 2; y += 7){ for(const x of [bx - 3, bx + a - 3]){ g.fillStyle = '#c8955a'; g.beginPath(); g.arc(x + 3, y, 3.5, 0, Math.PI*2); g.fill(); g.fillStyle = '#8f5f30'; g.fillRect(x + 2, y - 1, 2, 2); } } }
  // bệ nhà
  v48mR(g, {vn:'#8d8d86', jp:'#a58a62', eu:'#8f8a80', mod:'#5b6067', wood:'#7d7f86'}[st], bx - 3, by + Hb, a + 6, pl); v48mR(g, 'rgba(255,255,255,.22)', bx - 3, by + Hb, a + 6, 1);
  if(st === 'jp'){ v48mR(g, '#b88b55', bx - 6, by + Hb - 3, a + 12, 4); for(let x = bx - 6; x < bx + a + 6; x += 9) v48mR(g, '#9a7244', x, by + Hb - 3, 1, 4); }   // hiên engawa
}
// một ô cửa sổ, lit = vẽ lớp đèn ban đêm
function v48mWin(g, w, st, lit, big){
  const {x, y} = w, ww = w.w, hh = w.h, P = V48M_PHI, glass = lit ? '#ffd27a' : {vn:'#2f3b4a', jp:'#f6f0e0', eu:'#3c5a78', mod:'#22394a', wood:'#3a4f5e'}[st], inner = lit ? '#fff1c4' : null;
  const fr = {vn:'#5a3018', jp:'#4a3426', eu:'#ffffff', mod:'#2b2f33', wood:'#c8955a'}[st];
  if(!lit){ if(st === 'eu' && !big){ v48mR(g, '#3f7d4f', x - Math.round(ww/P/P) - 2, y, Math.round(ww/P/P) + 1, hh); v48mR(g, '#3f7d4f', x + ww + 1, y, Math.round(ww/P/P) + 1, hh); }
    v48mR(g, fr, x - 2, y - 2, ww + 4, hh + 4); }
  if(st === 'eu' && big && !lit){ g.fillStyle = fr; g.beginPath(); g.arc(x + ww/2, y, ww/2 + 2, Math.PI, 0); g.fill(); }
  if(st === 'eu' && big){ g.fillStyle = glass; g.beginPath(); g.arc(x + ww/2, y, ww/2, Math.PI, 0); g.fill(); }
  v48mR(g, glass, x, y, ww, hh);
  if(lit){ v48mR(g, inner, x + Math.round(ww/P/P/P), y + Math.round(hh/P/P/P), Math.round(ww/P), Math.round(hh/P)); }
  else if(st !== 'jp'){ v48mR(g, 'rgba(255,255,255,.22)', x + 2, y + 2, Math.max(2, Math.round(ww/P/P)), hh - 4); }
  // song cửa chia theo φ
  const mid = Math.round(hh/P);
  if(st === 'vn'){ for(let k = 1; k < 4; k++) v48mR(g, fr, x + Math.round(k*ww/4) - 1, y, 2, hh); }
  else if(st === 'jp'){ for(let k = 1; k < 3; k++) v48mR(g, fr, x + Math.round(k*ww/3), y, 1, hh); for(let k = 1; k < 4; k++) v48mR(g, fr, x, y + Math.round(k*hh/4), ww, 1); }
  else if(st === 'mod'){ v48mR(g, fr, x + Math.round(ww/P), y, 2, hh); }
  else { v48mR(g, fr, x + Math.round(ww/2) - 1, y, 2, hh); v48mR(g, fr, x, y + hh - mid - 1, ww, 2); }
  if(!lit && st === 'eu' && !big){ v48mR(g, '#7a4a2a', x - 3, y + hh + 2, ww + 6, 4); for(let k = 0; k < ww; k += 5) v48mR(g, ['#ef4b4b', '#ffd23f', '#ff8fc4'][(k/5) % 3], x + k, y + hh, 3, 3); }
  if(!lit && st === 'wood'){ v48mR(g, '#e57373', x, y, Math.round(ww/P/P), Math.round(hh/P)); v48mR(g, '#e57373', x + ww - Math.round(ww/P/P), y, Math.round(ww/P/P), Math.round(hh/P)); }
}
function v48mDoor(g, F, st, col, shop, lit){
  const {dx, dy, dw, dh} = F, P = V48M_PHI;
  if(lit){ if(st === 'jp') v48mR(g, '#ffd27a', dx, dy, dw, dh); else v48mR(g, '#ffd27a', dx + 2, dy + 2, dw - 4, Math.round(dh/P/P/P)); return; }
  if(st === 'vn'){ v48mR(g, '#7a3218', dx - 2, dy - 2, dw + 4, dh + 2); v48mR(g, '#a0522d', dx, dy, dw, dh); v48mR(g, '#7a3218', dx + Math.round(dw/2) - 1, dy, 2, dh);
    for(let y = dy + 4; y < dy + dh - 4; y += Math.round(dh/P/P/P)) v48mR(g, '#8a4424', dx + 2, y, dw - 4, 1);
    v48mR(g, '#d32f2f', dx - 9, dy + 4, 5, Math.round(dh/P)); v48mR(g, '#d32f2f', dx + dw + 4, dy + 4, 5, Math.round(dh/P)); v48mR(g, '#ffd23f', dx - 8, dy + 8, 3, 2); v48mR(g, '#ffd23f', dx + dw + 5, dy + 8, 3, 2);   // câu đối đỏ
    v48mR(g, '#3a1a0c', dx - 6, dy - 10, dw + 12, 7); v48mR(g, '#ffd23f', dx - 2, dy - 8, dw + 4, 3); }   // hoành phi
  else if(st === 'jp'){ v48mR(g, '#4a3426', dx - 2, dy - 2, dw + 4, dh + 2); v48mR(g, '#f6f0e0', dx, dy, dw, dh); for(let k = 1; k < 5; k++) v48mR(g, '#4a3426', dx, dy + Math.round(k*dh/5), dw, 1); v48mR(g, '#4a3426', dx + Math.round(dw/2), dy, 1, dh);
    v48mR(g, '#1f3a6b', dx - 3, dy, dw + 6, Math.round(dh/P/P)); v48mR(g, '#f6f0e0', dx + Math.round(dw/2) - 3, dy + 4, 6, 6); v48mR(g, '#f6f0e0', dx + Math.round(dw/2), dy, 1, Math.round(dh/P/P)); }   // rèm noren
  else if(st === 'eu'){ g.fillStyle = '#f2e6cc'; g.beginPath(); g.arc(dx + dw/2, dy + dw/2, dw/2 + 3, Math.PI, 0); g.fill(); v48mR(g, '#ffffff', dx - 3, dy + dw/2, dw + 6, dh - dw/2);
    g.fillStyle = col; g.beginPath(); g.arc(dx + dw/2, dy + dw/2, dw/2, Math.PI, 0); g.fill(); v48mR(g, col, dx, dy + dw/2, dw, dh - dw/2); v48mR(g, 'rgba(0,0,0,.18)', dx + 3, dy + dw/2 + 4, dw - 6, Math.round(dh/P/P)); v48mR(g, '#ffd23f', dx + dw - 6, dy + Math.round(dh/P), 3, 3);
    v48mR(g, '#2b2f3a', dx + dw + 6, dy + 6, 5, 8); v48mR(g, '#ffe39a', dx + dw + 7, dy + 8, 3, 4); }   // đèn tường
  else if(st === 'mod'){ v48mR(g, '#2b2f33', dx - 2, dy - 2, dw + 4, dh + 2); v48mR(g, '#3a4a55', dx, dy, dw, dh); v48mR(g, 'rgba(255,255,255,.16)', dx + 2, dy + 2, 3, dh - 4); v48mR(g, '#cfd3cc', dx + dw - 6, dy + Math.round(dh/P/P), 2, Math.round(dh/P/P)); }
  else { v48mR(g, '#5a3418', dx - 2, dy - 2, dw + 4, dh + 2); for(let y = dy; y < dy + dh; y += 5) v48mR(g, (y/5) % 2 ? '#7a4a24' : '#6a3e1c', dx, y, dw, 5);
    g.strokeStyle = '#4a2810'; g.lineWidth = 2; g.beginPath(); g.moveTo(dx + 2, dy + dh - 6); g.lineTo(dx + dw - 2, dy + 8); g.stroke(); v48mR(g, '#ffd23f', dx + dw - 6, dy + Math.round(dh/P), 3, 3); }
  // bậc thềm
  v48mR(g, '#bdb6a8', dx - 4, F.gy - 3, dw + 8, 3);
  if(shop){ const ax = F.bx + 2, aw = F.S - 4, ay = dy - 16; for(let k = 0; k < 7; k++) v48mR(g, k % 2 ? '#fff' : col, ax + Math.round(k*aw/7), ay, Math.ceil(aw/7), 9);
    g.fillStyle = col; for(let k = 0; k < 7; k++){ g.beginPath(); g.arc(ax + (k + .5)*aw/7, ay + 9, aw/14, 0, Math.PI); g.fill(); } }
}
function v48mSnowCap(g, F, path){
  g.save(); path(); g.clip(); g.fillStyle = '#f4f8fb'; const y0 = F.top - 6, y1 = F.top + Math.round(F.Hr/V48M_PHI/V48M_PHI) + 4;
  g.beginPath(); g.moveTo(0, y0); g.lineTo(F.W, y0); for(let x = F.W; x >= 0; x -= 8) g.lineTo(x, y1 + ((x/8) % 2 ? 4 : 0)); g.closePath(); g.fill();
  g.fillStyle = 'rgba(244,248,251,.9)'; g.fillRect(0, F.by - 4, F.W, 3); g.restore();
  g.fillStyle = '#e3f2fd'; for(let x = F.bx; x < F.bx + F.a; x += 9) g.fillRect(x, F.by, 2, 3 + (x % 3));
}
// sprite cache: ngày (đầy đủ) + lớp đèn cửa sổ ban đêm
function v48mSprite(st, a, col, shop, snow){
  const k = st + '|' + a + '|' + col + '|' + (shop ? 1 : 0) + '|' + (snow ? 1 : 0); let s = V48M.spr.get(k); if(s) return s;
  const F = v48mFrame(a), mk = () => { const c = document.createElement('canvas'); c.width = F.W; c.height = F.H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const [day, g] = mk(), [nite, n] = mk();
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(F.cx, F.gy, F.a/2 + F.ov, 6, 0, 0, Math.PI*2); g.fill();
  v48mWall(g, F, st, col); const path = v48mRoof(g, F, st, col);
  const wins = F.win.slice(); wins.forEach(w => v48mWin(g, w, st, false, false)); v48mWin(g, F.big, st, false, true);
  if(F.dorm) v48mWin(g, F.dorm, st, false, false);
  v48mDoor(g, F, st, col, shop, false);
  if(shop){ const sw = F.big.w + 8, sx = F.big.x - 4, sy = F.big.y - 13; v48mR(g, '#3a2a1a', sx, sy, sw, 9); v48mR(g, col, sx + 1, sy + 1, sw - 2, 7); }
  if(snow) v48mSnowCap(g, F, path);
  // đèn ban đêm: chỉ ô kính
  wins.forEach(w => v48mWin(n, w, st, true, false)); v48mWin(n, F.big, st, true, true); if(F.dorm) v48mWin(n, F.dorm, st, true, false); if(F.up) v48mWin(n, F.up, 'mod', true, true); v48mDoor(n, F, st, col, shop, true);
  s = {day, nite, F}; V48M.spr.set(k, s); if(V48M.spr.size > 80) V48M.spr.delete(V48M.spr.keys().next().value);
  return s;
}
function v48mPlotStyle(i){ return V48M_STY[i % V48M_STY.length]; }
function v48mNightK(i){ return v25Ramp(clock, 1082 + (i*7) % 40, 330 - (i*5) % 25); }
// vẽ một căn nhà tại chân nhà (gx, gy), lật gương khi flip
function v48mDrawHouse(g, st, a, col, shop, gx, gy, flip, lit){
  const s = v48mSprite(st, a, col, shop, season === 'dong'), F = s.F, x = Math.round(gx - F.cx), y = Math.round(gy - F.gy);
  if(flip){ g.save(); g.translate(x + F.W, y); g.scale(-1, 1); g.drawImage(s.day, 0, 0); if(lit > 0){ g.globalAlpha = lit; g.drawImage(s.nite, 0, 0); } g.restore(); return F; }
  g.drawImage(s.day, x, y); if(lit > 0){ const ga = g.globalAlpha; g.globalAlpha = lit; g.drawImage(s.nite, x, y); g.globalAlpha = ga; }
  return F;
}

// ---------- 3. init: nút Sắp xếp trên bản đồ lớn, phố nhà người chơi dùng mẫu nhà mới ----------
function v48mInit(){
  // nút mở chế độ sắp xếp trong thanh trên của bản đồ lớn
  const top = document.querySelector('#v32Map .v32mtop'), cl = $('#v32MapClose');
  if(top && !$('#v48mBtn')){ const b = document.createElement('button'); b.type = 'button'; b.id = 'v48mBtn'; b.textContent = '🧩 Sắp xếp'; b.setAttribute('aria-label', 'Sắp xếp bản đồ đảo'); b.onclick = v48mOpen; top.insertBefore(b, cl); }
  // phố nhà người chơi: 8 lô dùng mẫu nhà tỷ lệ vàng, 5 kiểu luân phiên
  streetSprites = function(sp){
    const r = R.pstreet; if(VB.x1 < r.x || VB.x0 > r.x + r.w || VB.y0 > r.y + r.h || VB.y1 < r.y) return;
    PLOTS.forEach((P, i) => { const s = STREET[i]; if(!s) return; sp.push({y:P.y + P.h - 6, f:() => {
      const x = P.x, y = P.y, w = P.w, gy = y + P.h - 6, isShop = s.kind === 'shop' || s.kind === 'pshop', st = v48mPlotStyle(i), lit = v48mNightK(i);
      rect('#b9ab8e', x + w/2 - 22, gy - 1, 44, 12); rect('#cfc3a6', x + w/2 - 16, gy + 1, 32, 8);     // lối vào
      const F = v48mDrawHouse(ctx, st, 156, s.col || '#90caf9', isShop, x + w/2, gy, i % 2 === 1, lit);
      for(let k = 0; k < 2; k++){ const bxx = x + 8 + k*(w - 16); circ(bxx, gy - 8, 9, '#2e7d32'); circ(bxx + 3, gy - 12, 3, ['#ff6f91', '#ffd23f'][(i + k) % 2]); }
      const near = PLAYER && Math.hypot(PLAYER.x - (x + w/2), PLAYER.y - (y + P.h + 4)) < 40, t = (s.name || '').slice(0, 26);
      ctx.font = "700 13px 'Be Vietnam Pro', Nunito, sans-serif"; const tw = ctx.measureText(t).width + 12, ty = gy - F.gy + F.top - 22;
      rect(near ? '#ffd23f' : 'rgba(42,28,16,.9)', x + w/2 - tw/2, ty, tw, 18); ctx.fillStyle = near ? '#1a1206' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + w/2, ty + 9); ctx.textBaseline = 'alphabetic';
      if(near){ ctx.fillStyle = '#ffd23f'; ctx.font = "700 14px 'Be Vietnam Pro', Nunito, sans-serif"; ctx.fillText('Vào nhà · ' + V48M_STN[st], x + w/2, y + P.h + 26); } ctx.textAlign = 'left';
    }}); });
  };
  // nhìn xa / ảnh toàn cảnh: cùng mẫu nhà, thu nhỏ
  v47wFarHouses = function(g, tiny){
    const z = V46.ZI.pstreet; if(!z || typeof PLOTS === 'undefined') return;
    PLOTS.forEach((P, i) => { const s = (typeof STREET !== 'undefined' && STREET[i]) || {col:['#90caf9', '#ce93d8', '#ffcc80', '#a5d6a7'][i % 4]};
      try { v48mDrawHouse(g, v48mPlotStyle(i), 156, s.col || '#90caf9', s.kind === 'shop' || s.kind === 'pshop', P.x + P.w/2 + z.d[0], P.y + P.h - 6 + z.d[1], i % 2 === 1, tiny ? 0 : v48mNightK(i)); } catch(e){} });
  };
  // quầng đèn ấm trước mỗi nhà khi tối
  const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(typeof PLOTS === 'undefined' || !STREET.length) return;
    PLOTS.forEach((P, i) => { const on = v48mNightK(i); if(on > 0) v25Push(P.x + P.w/2, P.y + P.h - 50, 92, on, 4); }); };
  V46T.ov = null;   // ảnh toàn cảnh vẽ lại với mẫu nhà mới
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v48m = {V48M, v48mOpen, v48mRebuild, v48mFrame, v48mSprite};
}
