// ================= v75u · 🎛️ STUDIO GIAO DIỆN: người chơi tự sắp xếp mọi khối giao diện + chỉnh cách chơi =================
// Mở: ô "🎛️ Studio giao diện" trong ☰ Menu, nút nhỏ 🎛️ cố định trên màn chơi, phím U. Không cần tải lại trang.
// Kéo-thả: dời chỗ bằng `translate` (cộng thêm vào vị trí gốc, không phá transform/hiệu ứng sẵn có), cỡ bằng `scale`.
// Vị trí lưu dạng tỉ lệ (fx, fy) trong khoảng trống của màn → xoay máy / đổi cỡ vẫn giữ chỗ tương đối.
// Lưu riêng 3 kiểu màn (điện thoại dọc / ngang / máy tính) ở localStorage 'truong-v75u' và PROF.v75u. Tên toàn cục tiền tố v75u/V75U.
const V75U_PHI = 1.618033988749895;
const V75U_KEY = 'truong-v75u';
const V75U_G = 8;                               // lề an toàn quanh mép màn
const V75U_SNAP = 13;                           // khoảng hít (px)
const V75U_KN = {phone:'📱 Điện thoại dọc', land:'📱 Điện thoại ngang', desk:'💻 Máy tính'};
// danh sách khối: [khoá, bộ chọn, tên tiếng Việt, tuỳ chọn] · min = cỡ nhỏ nhất (giữ chữ ≥16px) · lock = không cho ẩn · click = trong menu bấm là mở
// panel = bảng chữ (áp độ trong) · tmp = chỉ hiện lúc có việc (vẽ khung mờ để đặt chỗ trước) · g = [rộng, cao, fx, fy] khung mờ mặc định
const V75U_B = [
  ['hud', '#stage > .hud', 'Thanh trên (giờ · mùa · thời tiết)', {min:1, panel:1, fit:'hud'}],
  ['prof', '#prof', 'Thẻ người chơi (tên · level · tiền)', {min:1, panel:1, fit:'prof'}],
  ['quick', '#quick', 'Hàng nút menu', {min:1, fit:'quick'}],
  ['menubtn', '#v32MenuBtn', 'Nút ☰ Menu', {min:.85, lock:1}],
  ['mini', '#mini', 'Bản đồ tròn (minimap)', {min:.618, click:1}],
  ['misbtn', '#v32MisBtn', 'Nút Nhiệm vụ', {min:.85, click:1}],
  ['logbtn', '#v32LogBtn', 'Nút Nhật ký', {min:.85, click:1}],
  ['bookbtn', '#v70sIc', 'Nút Sổ Hành trình 📖', {min:.85, click:1}],
  ['col', '#v41Col', 'Nút tròn Đèn · Xe đạp · Máy bay · Hành tinh', {min:.85, fit:'col'}],
  ['mtrack', '#mtrack', 'Bảng Nhiệm vụ', {min:1, panel:1, fit:'panel'}],
  ['mlog', '#mlog', 'Nhật ký gợi ý & sự kiện', {min:1, panel:1, fit:'panel'}],
  ['mentor', '#mentor', 'Thẻ Mentor (Người Thầy)', {min:1, panel:1, fit:'mentor'}],
  ['fest', '#v70eGo', 'Nút Lễ hội / sự kiện hôm nay', {min:.85, tmp:1, click:1, g:[240, 56, .5, .86]}],
  ['toast', '#toast', 'Thông báo nhanh', {min:1, tmp:1, panel:1, nomenu:1, flt:1, fit:'toast', g:[300, 44, .5, .1]}],
  ['hint', '#hint', 'Dòng gợi ý phím', {min:1, panel:1, fit:'line'}],
  ['area', '#v26Area', 'Bảng tên khu vực', {min:1, tmp:1, nomenu:1, flt:1, g:[200, 34, .5, .2]}],
  ['pill', '#v70sPill', 'Thẻ nhắc Hành trình', {min:1, tmp:1, panel:1, flt:1, g:[260, 44, 0, .2]}],
  ['pay', '#v67lPop', 'Thông báo lương', {min:1, tmp:1, nomenu:1, flt:1, g:[280, 44, .5, .08]}],
  ['ach', '#v70eAch', 'Huy hiệu thành tựu mới', {min:1, tmp:1, nomenu:1, flt:1, g:[320, 64, .5, .1]}],
  ['boost', '#v73aBoost', 'Nút Tăng tốc máy bay', {min:.85, tmp:1, flt:1, g:[80, 80, 1, .72]}],
  ['studio', '#v75uFab', 'Nút 🎛️ Studio giao diện', {min:.85, lock:1, click:1}]
];
const V75U_PDEF = {spd:1, swipe:1, zoom:0, guide:'foot', door:true, ui:1, alpha:1};
const V75U = {B:{}, kind:'desk', S:null, arr:false, sel:null, comp:new Map(), obs:new Map(), lay:null, frames:new Map(), raf:0, css:null, panel:null, tab:'lay', prof:null, zoomed:false, pk:{}, sw:null, warn:''};

// ---------- 1. lưu / tải ----------
function v75uBlank(){ return {v:1, t:0, lay:{phone:{}, land:{}, desk:{}}, play:Object.assign({}, V75U_PDEF)}; }
function v75uLoad(){
  let s = null; try { s = JSON.parse(localStorage.getItem(V75U_KEY) || 'null'); } catch(e){}
  const b = v75uBlank(); if(s && s.lay){ b.t = s.t || 0; for(const k in b.lay) b.lay[k] = s.lay[k] || {}; b.play = Object.assign(b.play, s.play || {}); } V75U.S = b;
}
function v75uSave(){
  const S = V75U.S; S.t = Date.now(); try { localStorage.setItem(V75U_KEY, JSON.stringify(S)); } catch(e){}
  clearTimeout(V75U.svT); V75U.svT = setTimeout(() => { try { if(typeof PROF !== 'undefined' && PROF && typeof saveProfile === 'function'){ PROF.v75u = JSON.parse(JSON.stringify(V75U.S)); saveProfile(); } } catch(e){} }, 1200);
}
// hồ sơ mới đăng nhập: bản trong hồ sơ mới hơn bản trên máy → dùng bản hồ sơ (chơi máy khác vẫn giữ bố cục)
function v75uProf(){
  const P = typeof PROF !== 'undefined' ? PROF : null; if(P === V75U.prof) return; V75U.prof = P; V75U.zoomed = false;
  if(P && Object.keys(V75U.S.lay[V75U.kind]).length){ clearTimeout(V75U.rsT); V75U.rsT = setTimeout(() => { v75uAll(); v75uResolve(); }, 1500); }
  if(!P) return; const s = P.v75u;
  if(s && s.lay && (s.t || 0) > (V75U.S.t || 0)){ const b = v75uBlank(); b.t = s.t; for(const k in b.lay) b.lay[k] = s.lay[k] || {}; b.play = Object.assign(b.play, s.play || {}); V75U.S = b;
    try { localStorage.setItem(V75U_KEY, JSON.stringify(b)); } catch(e){} v75uAll(); }
  else if(!s && V75U.S.t) v75uSave();
}

// ---------- 2. kiểu màn + toạ độ ----------
function v75uKindNow(){
  let touch = false; try { touch = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && matchMedia('(hover: none)').matches); } catch(e){}
  return touch ? (innerHeight >= innerWidth ? 'phone' : 'land') : 'desk';
}
const v75uEl = k => document.querySelector(V75U.B[k].sel);
const v75uD = k => V75U.S.lay[V75U.kind][k];
function v75uDx(k){ const L = V75U.S.lay[V75U.kind]; return L[k] || (L[k] = {}); }
const v75uVis = e => !!e && e.isConnected && e.getClientRects().length > 0;
function v75uXY(d, w, h){
  const W = innerWidth, H = innerHeight, g = V75U_G, fw = W - w - 2*g, fh = H - h - 2*g;
  return [fw > 0 ? g + d.fx*fw : (W - w)/2, fh > 0 ? g + d.fy*fh : (H - h)/2];
}
function v75uF(x, y, w, h){
  const W = innerWidth, H = innerHeight, g = V75U_G, fw = W - w - 2*g, fh = H - h - 2*g, c = v => Math.max(0, Math.min(1, v));
  return [fw > 0 ? c((x - g)/fw) : .5, fh > 0 ? c((y - g)/fh) : .5];
}
function v75uScale(k){ const d = v75uD(k); return Math.round(((d && d.s) || 1)*(V75U.S.play.ui || 1)*1000)/1000; }

// ---------- 3. đặt khối: đo vị trí gốc (bỏ translate) rồi cộng độ lệch tới chỗ đã chọn ----------
function v75uBusy(el){ try { return (el.getAnimations ? el.getAnimations() : []).some(a => a.playState === 'running' && ((typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) || (a.effect && a.effect.getTiming().iterations !== Infinity))); } catch(e){ return false; } }
// ---------- 3b. VỪA KHUNG: khung (fw×fh) do chủ game vẽ → nội dung co theo khung, chữ luôn ≥16px (cuộn / xuống dòng / rút gọn phần phụ) ----------
const V75U_FP = ['width', 'height', 'max-width', 'max-height', 'min-width', 'min-height', 'overflow', 'overflow-x', 'overflow-y', 'flex-direction', 'flex-wrap', 'white-space', 'text-overflow', 'box-sizing', 'align-content', 'align-items', 'justify-content', 'gap', '--v75uBs'];
function v75uFitOff(el){
  if(!el.__v75uO) return; const o = el.__v75uO; V75U_FP.forEach(q => { const v = o[q]; if(v && v[0]) el.style.setProperty(q, v[0], v[1]); else el.style.removeProperty(q); });
  delete el.__v75uO; ['v75uFit', 'v75uLow', 'v75uOpen', 'v75uNL', 'v75uRow'].forEach(c => { if(el.classList.contains(c)) el.classList.remove(c); }); delete el.dataset.v75uf;
  el.querySelectorAll('.v75uCut').forEach(c => c.classList.remove('v75uCut'));
}
function v75uFit(k, el, d){
  if(!d){ v75uFitOff(el); return; }
  const t = V75U.B[k].o.fit, W = innerWidth, H = innerHeight, g = V75U_G, st = el.style;
  if(!el.__v75uO){ el.__v75uO = {}; V75U_FP.forEach(q => el.__v75uO[q] = [st.getPropertyValue(q), st.getPropertyPriority(q)]); }
  const set = (q, v) => st.setProperty(q, v, 'important');
  let fw = Math.max(44, Math.min(d.fw, W - 2*g)), fh = Math.max(40, Math.min(d.fh || 44, H - 2*g));
  if(!el.classList.contains('v75uFit')) el.classList.add('v75uFit'); if(el.dataset.v75uf !== t) el.dataset.v75uf = t; set('box-sizing', 'border-box'); set('min-width', '0'); set('min-height', '0'); set('max-width', 'none'); set('max-height', 'none');
  if(t === 'panel'){ set('width', fw + 'px'); set('height', fh + 'px'); set('overflow', 'auto'); }
  else if(t === 'line'){ set('width', fw + 'px'); set('height', 'auto'); set('max-height', fh + 'px'); set('overflow', 'hidden'); set('white-space', 'nowrap'); set('text-overflow', 'ellipsis'); }
  else if(t === 'toast'){ set('max-width', fw + 'px'); }
  else if(t === 'prof'){ el.classList.toggle('v75uLow', fh < 70); set('width', fw + 'px'); set('height', 'auto'); set('max-height', Math.max(fh, 40) + 'px'); set('overflow', 'hidden'); }
  else if(t === 'mentor'){ set('width', fw + 'px'); const op = el.classList.contains('v75uOpen'); set('max-height', op ? 'none' : fh + 'px'); set('overflow', 'hidden');
    if(!el.__v75uM){ el.__v75uM = 1; el.addEventListener('click', e => { if(!el.classList.contains('v75uFit') || el.classList.contains('mini') || (e.target.closest && e.target.closest('.v39x'))) return; el.classList.toggle('v75uOpen'); const D = v75uD('mentor'); if(D) v75uPlace('mentor', true); }); } }
  else if(t === 'hud'){ set('width', fw + 'px'); set('overflow', 'hidden'); set('flex-wrap', 'nowrap'); el.querySelectorAll('.v75uCut').forEach(c => c.classList.remove('v75uCut'));
    for(const q of ['#v27Brand', '#hudPeriod', '#hudWeather']){ if(el.scrollWidth <= el.clientWidth + 1) break; const c = el.querySelector(q); if(c) c.classList.add('v75uCut'); } }
  else if(t === 'quick'){ const row = fw >= fh; set('width', fw + 'px'); set('height', fh + 'px'); set('flex-direction', row ? 'row' : 'column'); set('flex-wrap', row ? 'wrap' : 'nowrap');
    set('align-content', 'flex-start'); set('align-items', row ? 'center' : 'stretch'); set('overflow', 'auto'); }
  else if(t === 'col'){ const row = fw > fh, B = [...el.children].filter(c => c.getClientRects().length), n = Math.max(1, B.length), gap = 4;
    let cross = row ? fh : fw, main = row ? fw : fh; const lbl = row ? (cross >= 64 && main >= n*64) : (cross >= 76 && main >= n*62);
    const bs = Math.round(Math.max(40, Math.min(56, cross, (main - (n - 1)*gap)/n))); cross = Math.max(cross, lbl ? cross : bs + 4); main = Math.max(main, n*(lbl ? (row ? 64 : 62) : bs) + (n - 1)*gap);
    main = Math.min(main, row ? W - 2*g : H - 2*g); el.classList.toggle('v75uRow', row); el.classList.toggle('v75uNL', !lbl); set('--v75uBs', bs + 'px');
    set('flex-direction', row ? 'row' : 'column'); set('flex-wrap', 'nowrap'); set('gap', gap + 'px'); set('align-items', 'center'); set('justify-content', 'flex-start');
    set('width', (row ? main : cross) + 'px'); set('height', (row ? cross : main) + 'px'); set('overflow', 'auto'); }
}
function v75uPlace(k, force){
  const el = v75uEl(k); if(!el) return false; const st = el.style, d = v75uD(k), fit = !!(d && d.fw && V75U.B[k].o.fit), sc = fit ? 1 : v75uScale(k);
  v75uFit(k, el, fit ? d : null);
  if(sc !== 1){ st.setProperty('scale', String(sc), 'important'); st.setProperty('transform-origin', '0 0', 'important'); }
  else if(st.getPropertyValue('scale')){ st.removeProperty('scale'); st.removeProperty('transform-origin'); }
  if(!d || d.fx == null){ if(st.getPropertyValue('translate')) st.removeProperty('translate'); V75U.comp.delete(k); return true; }
  if(!v75uVis(el) || (!force && v75uBusy(el))) return false;
  const t0 = st.getPropertyValue('translate'), tr = st.getPropertyValue('transition'), tp = st.getPropertyPriority('transition');
  st.setProperty('transition', 'none', 'important'); st.setProperty('translate', 'none', 'important');
  const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const off = r.right <= 0 || r.bottom <= 0 || r.left >= W || r.top >= H;
  let tv = t0;
  if(!off && d.rw != null && !V75U.rwBusy){ const base = r.width/sc, q = d.rw/base/(V75U.S.play.ui || 1), B = V75U.B[k];
    let ns = Math.abs(q - 1) < .04 ? 1 : Math.round(Math.max(B.o.min || .85, Math.min(V75U_PHI, q))*1000)/1000;
    if(Math.abs(ns - (d.s || 1)) > .01){ if(ns === 1) delete d.s; else d.s = ns;
      if(tr) st.setProperty('transition', tr, tp); else st.removeProperty('transition'); if(t0) st.setProperty('translate', t0, 'important'); else st.removeProperty('translate');
      V75U.rwBusy = true; try { return v75uPlace(k, true); } finally { V75U.rwBusy = false; } } }
  if(!off){ const [x, y] = v75uXY(d, r.width, r.height); tv = Math.round(x - r.left) + 'px ' + Math.round(y - r.top) + 'px';
    V75U.comp.set(k, {nx:r.left, ny:r.top, w:r.width, h:r.height, tv, dx:Math.round(x - r.left), dy:Math.round(y - r.top)}); d.lw = Math.round(r.width); d.lh = Math.round(r.height); }
  if(tv) st.setProperty('translate', tv, 'important'); else st.removeProperty('translate');
  el.getBoundingClientRect(); if(tr) st.setProperty('transition', tr, tp); else st.removeProperty('transition');
  return !off;
}
// kiểm nhẹ mỗi giây: chỉ đọc vị trí; gốc đổi (chữ dài ra, game dời khối, translate bị ghi đè) thì đặt lại
function v75uCheck(){
  v75uMt(); const L = V75U.S.lay[V75U.kind];
  for(const k in L){ if(!V75U.B[k]) continue; const el = v75uEl(k); if(!el) continue; v75uWatch(k, el);
    const d = L[k]; if(d.fx == null && !d.s && (V75U.S.play.ui || 1) === 1){ if(el.style.getPropertyValue('scale') || el.style.getPropertyValue('translate')) v75uPlace(k); continue; }
    if(!v75uVis(el)) continue; const c = V75U.comp.get(k); if(d.fx == null || !c){ v75uPlace(k); continue; }
    if(d.fw && (V75U.B[k].o.fit === 'hud') && el.scrollWidth > el.clientWidth + 1){ v75uPlace(k, true); continue; }
    const r = el.getBoundingClientRect(), nx = r.left - c.dx, ny = r.top - c.dy;
    if(el.style.getPropertyValue('translate') !== c.tv || Math.abs(nx - c.nx) > 2 || Math.abs(ny - c.ny) > 2 || Math.abs(r.width - c.w) > 2 || Math.abs(r.height - c.h) > 2) v75uPlace(k);
  }
}
// khối hiện/ẩn hoặc đổi lớp → đặt lại ngay trước khi vẽ (MutationObserver chạy trước khung hình)
function v75uWatch(k, el){
  const o = V75U.obs.get(k); if(o && o.el === el) return; if(o) o.mo.disconnect();
  const strip = v => String(v || '').split(/\s+/).filter(c => c && !/^v75u/.test(c)).sort().join(' ');
  const mo = new MutationObserver(R => { if(!R.some(r => r.attributeName !== 'class' || strip(r.oldValue) !== strip(el.getAttribute('class')))) return; const d = v75uD(k); if(d && (d.fx != null || d.s || d.fw)) v75uPlace(k); });
  mo.observe(el, {attributes:true, attributeFilter:['hidden', 'class'], attributeOldValue:true}); V75U.obs.set(k, {el, mo});
}
// v44 đặt --v44mt theo đáy #prof (đo cả translate) → nút ☰, cột nút tròn đi theo thẻ. Giữ chúng ở chỗ gốc: ghi đè trên #stage bằng đáy gốc
function v75uMt(){
  const st = document.getElementById('stage'), p = document.getElementById('prof'), c = V75U.comp.get('prof'), d = v75uD('prof'); if(!st) return;
  if(!p || !d || (d.fx == null && !d.s) || !v75uVis(p)){ if(st.style.getPropertyValue('--v44mt')) st.style.removeProperty('--v44mt'); return; }
  const sc = v75uScale('prof'), r = p.getBoundingClientRect(), top = c ? c.ny : r.top, h = (c ? c.h : r.height)/sc, v = Math.round(top + h - st.getBoundingClientRect().top + 10) + 'px';
  if(st.style.getPropertyValue('--v44mt') !== v) st.style.setProperty('--v44mt', v);
}
function v75uAll(){ V75U.comp.clear(); v75uPlace('prof', true); v75uMt(); for(const k in V75U.B) v75uPlace(k, true); v75uCss(); }

// ---------- 4. CSS sinh ra: ẩn / vào menu / độ trong (đổi theo kiểu màn) ----------
function v75uCss(){
  const L = V75U.S.lay[V75U.kind], a = V75U.S.play.alpha || 1; let s = '';
  for(const k in V75U.B){ const B = V75U.B[k], d = L[k];
    if(d && (d.hide || d.menu) && !B.o.lock){ s += `html:not(.v75uArr):not([data-v75upk~="${k}"]) ${B.sel}{display:none!important}html.v75uArr ${B.sel}{filter:opacity(.38)!important}`; }
    else if(B.o.panel && a < 1) s += `html:not(.v75uArr) ${B.sel}{filter:opacity(${a})!important}`; }
  if(L.toast) s += '#toast{pointer-events:none!important}';   // thông báo chỉ để đọc: đặt chỗ mới thì không chặn nút bên dưới
  V75U.css.textContent = s;
}
// dời vào menu: bấm ô trong ☰ → nút thì bấm luôn, bảng/hàng nút thì hiện tạm 12 giây
function v75uPeek(k){
  const B = V75U.B[k], el = v75uEl(k); if(!el) return;
  if(B.o.click){ try { el.click(); } catch(e){} return; }
  V75U.pk[k] = 1; v75uPkSet(); v75uPlace(k, true);
  clearTimeout(V75U.pkT); V75U.pkT = setTimeout(() => { V75U.pk = {}; v75uPkSet(); }, 12000);
}
function v75uPkSet(){ const v = Object.keys(V75U.pk).join(' '); if(v) document.documentElement.dataset.v75upk = v; else delete document.documentElement.dataset.v75upk; }
function v75uMenuHook(){
  if(typeof v32Items !== 'function') return;
  const mi = v32Items; v32Items = function(){ const L = mi();
    L.push({ic:'tools', en:'UI Studio', vi:'🎛️ Studio giao diện', grp:'system', f:() => v75uOpen()});
    const D = V75U.S.lay[V75U.kind]; for(const k in D){ const B = V75U.B[k]; if(B && D[k].menu && v75uEl(k)) L.push({ic:'spark', en:B.n, vi:'📌 ' + B.n, grp:'system', f:() => v75uPeek(k)}); }
    return L; };
}

// ---------- 5. cách chơi: chỉ dùng tuỳ chọn có thật trong game, áp dụng ngay ----------
function v75uPlayHooks(){
  if(typeof v35Sp === 'function'){ const f = v35Sp; v35Sp = function(c, sp){ const r = f.apply(this, arguments); return (typeof PLAYER !== 'undefined' && c === PLAYER && !c.mount) ? r*(V75U.S.play.spd || 1) : r; }; }
  if(typeof v46DrawGuide === 'function'){ const f = v46DrawGuide; v46DrawGuide = function(){ if(V75U.S.play.guide === 'none') return; return f.apply(this, arguments); }; }
  if(typeof v32Tap === 'function'){ const f = v32Tap; v32Tap = function(wx, wy){
    if(V75U.S.play.door === false && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible && typeof v32Target === 'function'){ let d = null; try { d = v32Target(wx, wy); } catch(e){}
      if(d && Math.hypot(d.x - PLAYER.x, d.y - PLAYER.y) >= 46){ try { toast('🚶 Đã tắt “tự đi tới khi chạm cửa” — vuốt để đi tới rồi chạm cửa.'); } catch(e){} return; } }
    return f.apply(this, arguments); }; }
  // độ nhạy vuốt: phóng đại quãng vuốt đầu tiên (trước khi v34 bắt đầu cho đi) — chạy ở window (capture) nên tới trước canvas
  addEventListener('pointermove', e => { const k = V75U.S.play.swipe || 1; if(k === 1 || typeof SW === 'undefined' || e.pointerId !== SW.id || SW.on) { if(V75U.sw && V75U.sw.id !== SW.id) V75U.sw = null; return; }
    if(!V75U.sw || V75U.sw.id !== e.pointerId) V75U.sw = {id:e.pointerId, x:SW.x0, y:SW.y0};
    SW.x0 = e.clientX - (e.clientX - V75U.sw.x)*k; SW.y0 = e.clientY - (e.clientY - V75U.sw.y)*k; }, true);
}
function v75uZoom(force){
  const z = V75U.S.play.zoom; if(!z || typeof cam !== 'object') return; if(!force && V75U.zoomed) return;
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return; V75U.zoomed = true;
  try { cam.z = z; if(typeof clampCam === 'function') clampCam(); } catch(e){}
}
function v75uPlaySet(k, v){
  const P = V75U.S.play; P[k] = v; v75uSave();
  if(k === 'zoom') v75uZoom(true);
  if(k === 'ui') v75uAll();
  if(k === 'alpha') v75uCss();
  v75uPanelFill();
}
// các tuỳ chọn đang có sẵn của game (đọc/ghi thẳng hệ cũ)
function v75uGfx(){ return typeof V70F === 'object' ? V70F.q : -1; }
function v75uVol(){ try { return Math.max(V39S.vol.amb, V39S.vol.sfx); } catch(e){ return -1; } }
function v75uPace(){ try { return v53vChill() ? 'chill' : 'normal'; } catch(e){ return ''; } }

// ---------- 6. giao diện Studio ----------
const V75U_CSS = `
#v75uFab{position:absolute;z-index:6;right:max(10px,env(safe-area-inset-right));top:calc(var(--v32t,60px) + 250px);width:46px;height:46px;border-radius:50%;border:2px solid #ffd23f;background:rgba(14,20,44,.88);color:#fff;font-size:21px;line-height:1;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.35);padding:0}
body:not(.v32phone) #v75uFab{top:25px;right:calc(29px + 150px + 13px)}
#v75uFab:focus-visible,.v75uP button:focus-visible{outline:3px solid #7fd0ff;outline-offset:2px}
.v75uP,#v75uLay{font-family:Nunito,'Be Vietnam Pro',system-ui,sans-serif;font-size:16px;color:#fff;-webkit-tap-highlight-color:transparent}
.v75uP{position:fixed;z-index:2147482500;background:rgba(11,16,32,.96);border:2px solid #ffd23f;box-shadow:0 13px 34px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;
  right:13px;top:13px;width:min(382px,calc(100vw - 26px));max-height:calc(100vh - 26px);border-radius:21px}
body.v32phone .v75uP{left:0;right:0;top:auto;bottom:0;width:auto;max-height:61.8vh;height:61.8vh;border-radius:21px 21px 0 0;border-bottom:0;padding-bottom:env(safe-area-inset-bottom)}
@media (orientation:landscape){body.v32phone .v75uP{left:auto;right:8px;top:8px;bottom:8px;width:min(420px,61.8vw);height:auto;max-height:none;border-radius:21px;border-bottom:2px solid #ffd23f}}
.v75uP[hidden],#v75uLay[hidden],.v75uP [hidden]{display:none!important}
.v75uH{display:flex;align-items:center;gap:8px;padding:13px 13px 8px}
.v75uH b{flex:1;font-size:19px;font-weight:800;color:#ffd23f}
.v75uP button,#v75uLay button{font:inherit;font-size:16px;font-weight:700;min-height:44px;min-width:44px;border-radius:13px;border:2px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;padding:6px 13px;cursor:pointer;touch-action:manipulation}
.v75uP button.on,#v75uLay button.on{background:#ffd23f;color:#1a1400;border-color:#ffd23f}
.v75uP button.pri,#v75uLay button.pri{background:#2bb34a;border-color:#2bb34a}
.v75uP button:disabled,#v75uLay button:disabled{opacity:.4;cursor:not-allowed}
.v75uTabs{display:flex;gap:8px;padding:0 13px 8px}
.v75uTabs button{flex:1}
.v75uC{overflow:auto;padding:8px 13px 13px;flex:1;overscroll-behavior:contain}
.v75uC p{margin:0 0 8px;line-height:1.45;color:#d6dcf0}
.v75uRow{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.1);flex-wrap:wrap}
.v75uRow>span{flex:1 1 140px;line-height:1.35}
.v75uRow>span small{display:block;color:#aab3cf;font-size:16px}
.v75uRow.off>span{opacity:.55}
.v75uSeg{display:flex;gap:6px;flex-wrap:wrap}
.v75uRow input[type=range]{flex:1 1 160px;accent-color:#ffd23f;height:44px}
.v75uBig{width:100%;margin:0 0 13px;min-height:55px!important;font-size:18px!important}
.v75uFoot{display:flex;gap:8px;flex-wrap:wrap;padding-top:13px}
#prof.v75uLow .pinfo>:not(.prow),#prof.v75uLow .pbar,#prof.v75uLow #profExp,#prof.v75uLow #v45Heart,#prof.v75uLow #v52lHun,#prof.v75uLow #v37Info{display:none!important}
#prof.v75uFit .prow{flex-wrap:nowrap!important;white-space:nowrap;min-width:0;overflow:hidden}#prof.v75uFit .pinfo{min-width:0;flex:1 1 auto}
#prof.v75uFit #profName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto}#prof.v75uLow #profAv{max-height:calc(100% - 4px);width:auto}
#mentor.v75uFit:not(.v75uOpen) #mtQuote,#mentor.v75uFit:not(.v75uOpen) #mtSrc{display:none!important}
#mentor.v75uFit:not(.v75uOpen) .mtx{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
#mentor.v75uFit:not(.v75uOpen){cursor:pointer}#mentor.v75uFit .mtx{min-width:0;font-size:16px}
.hud.v75uFit>*{flex:none}.v75uCut{display:none!important}
#quick.v75uFit>*{flex:none}#quick.v75uFit{scrollbar-width:thin;-webkit-mask-image:linear-gradient(#000 calc(100% - 13px),transparent);mask-image:linear-gradient(#000 calc(100% - 13px),transparent)}#quick.v75uFit[style*="column"]>*{width:100%}
#v41Col.v75uFit .v41b{flex:none}#v41Col.v75uNL .v41b{width:var(--v75uBs)!important;height:var(--v75uBs)!important;min-width:0!important;min-height:0!important;padding:0!important}
#v41Col.v75uNL .v41b small{display:none!important}#v41Col.v75uNL .v41b .ic{width:100%!important;height:100%!important}
#mtrack.v75uFit,#mlog.v75uFit{overscroll-behavior:contain}#mtrack.v75uFit ol,#mlog.v75uFit ol{max-height:none!important}
.v75uNote{background:rgba(255,138,138,.14);border:1px solid rgba(255,138,138,.5);border-radius:13px;padding:8px 13px;margin:0 0 13px;color:#ffd0d0}
html.v75uArr .modal:not([hidden]),html.v75uArr #v70ePanel,html.v75uArr #v67lPanel,html.v75uArr #v66tPanel,html.v75uArr #v70sBook,html.v75uArr #v70sDlg,html.v75uArr #v32Menu,html.v75uArr #v32Map{visibility:hidden!important}
#v75uLay{position:fixed;inset:0;z-index:2147482000;touch-action:none;background:rgba(10,14,30,.12)}
.v75uFr{position:fixed;border:2px dashed #ffd23f;border-radius:10px;background:rgba(255,210,63,.08);cursor:grab;box-sizing:border-box;touch-action:none}
.v75uFr.ghost{border-style:dotted;background:rgba(127,208,255,.12);border-color:#7fd0ff}
.v75uFr.hid{border-color:#ff8a8a;background:rgba(255,80,80,.1)}
.v75uFr.sel{z-index:2;border-style:solid;border-width:3px;box-shadow:0 0 0 3px rgba(255,210,63,.35)}
.v75uFr i{position:absolute;left:2px;top:2px;max-width:calc(100% - 4px);box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:normal;font-size:16px;font-weight:800;line-height:26px;padding:0 8px;border-radius:8px;background:rgba(11,16,32,.9);color:#ffd23f;pointer-events:none}
.v75uFr.tiny i{display:none}.v75uFr.sel i{display:block;left:-3px;top:-32px;max-width:min(300px,90vw)}.v75uFr.sel.low i{top:auto;bottom:-32px}
.v75uRz{position:absolute;right:-16px;bottom:-16px;width:32px;height:32px;border-radius:50%;background:#ffd23f;border:3px solid #1a1400;cursor:nwse-resize;display:none}
.v75uFr.sel .v75uRz{display:block}
.v75uGd{position:fixed;background:#ffd23f;opacity:.85;pointer-events:none;display:none}
.v75uBar{position:fixed;left:50%;width:max-content;transform:translateX(-50%);bottom:max(13px,env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:8px;border-radius:21px;background:rgba(11,16,32,.94);border:2px solid #ffd23f;max-width:calc(100vw - 16px);box-sizing:border-box}
.v75uBar.top{bottom:auto;top:max(13px,env(safe-area-inset-top))}
.v75uAct{bottom:calc(max(13px,env(safe-area-inset-bottom)) + 76px)}
.v75uAct.top{bottom:auto;top:calc(max(13px,env(safe-area-inset-top)) + 76px)}
.v75uAct b{width:100%;text-align:center;color:#ffd23f;font-size:16px}
.v75uWarn{width:100%;text-align:center;color:#ffb3b3;font-weight:700}
#v75uChip{position:fixed;left:50%;top:max(13px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147482000}
@media (max-width:420px){.v75uBar button{padding:6px 10px}}
`;
function v75uUi(){
  const st = document.createElement('style'); st.id = 'v75uCss0'; st.textContent = V75U_CSS; document.head.appendChild(st);
  V75U.css = document.createElement('style'); V75U.css.id = 'v75uCss'; document.head.appendChild(V75U.css);
  const stage = document.getElementById('stage');
  if(stage && !document.getElementById('v75uFab')){ const b = document.createElement('button'); b.type = 'button'; b.id = 'v75uFab'; b.textContent = '🎛️';
    b.title = 'Studio giao diện: tự sắp xếp các bảng, nút và chỉnh cách chơi (phím U)'; b.setAttribute('aria-label', 'Mở Studio giao diện'); b.onclick = () => v75uOpen(); stage.appendChild(b); }
  // bảng Studio
  const p = document.createElement('div'); p.className = 'v75uP'; p.id = 'v75uPanel'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Studio giao diện');
  p.innerHTML = '<div class="v75uH"><b>🎛️ Studio giao diện</b><button type="button" data-x aria-label="Đóng">✕</button></div>'
    + '<div class="v75uTabs" role="tablist"><button type="button" data-t="lay" role="tab">🧩 Sắp xếp</button><button type="button" data-t="play" role="tab">🎮 Cách chơi</button></div><div class="v75uC" id="v75uBody"></div>';
  document.body.appendChild(p); V75U.panel = p;
  p.querySelector('[data-x]').onclick = () => v75uClose();
  p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { V75U.tab = b.dataset.t; v75uPanelFill(); });
  ['pointerdown', 'wheel', 'keydown'].forEach(ev => p.addEventListener(ev, e => e.stopPropagation()));
  // lớp kéo-thả
  const lay = document.createElement('div'); lay.id = 'v75uLay'; lay.hidden = true;
  lay.innerHTML = '<div id="v75uFrs"></div><div class="v75uGd" id="v75uGx"></div><div class="v75uGd" id="v75uGy"></div>'
    + '<div class="v75uBar v75uAct" id="v75uAct" hidden></div>'
    + '<div class="v75uBar" id="v75uBar"><b class="v75uWarn" id="v75uWarn" hidden></b><button type="button" class="pri" data-a="done">✓ Xong</button><button type="button" data-a="prev">👁 Xem trước</button>'
    + '<button type="button" data-a="list">📋 Danh sách</button><button type="button" data-a="reset">↩️ Mặc định</button><button type="button" data-a="flip" aria-label="Đưa thanh này lên trên / xuống dưới">⇅</button></div>';
  document.body.appendChild(lay); V75U.lay = lay;
  lay.querySelector('#v75uBar').onclick = e => { const a = e.target.closest('[data-a]'); if(!a) return; const k = a.dataset.a;
    if(k === 'done') v75uArr(false, true); else if(k === 'prev') v75uPreview(); else if(k === 'list'){ v75uArr(false); v75uOpen('lay'); }
    else if(k === 'reset'){ if(confirm('Đưa mọi khối của kiểu màn “' + V75U_KN[V75U.kind] + '” về chỗ cũ?')) v75uResetAll(); }
    else if(k === 'flip'){ V75U.flip = true; lay.querySelectorAll('.v75uBar').forEach(b => b.classList.toggle('top')); } };
  lay.addEventListener('pointerdown', e => { if(e.target === lay || e.target.id === 'v75uFrs') v75uSelect(null); });
  ['wheel', 'contextmenu'].forEach(ev => lay.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); }, {passive:false}));
}
function v75uOpen(tab){
  if(V75U.arr) v75uArr(false);
  try { if(typeof V32 === 'object' && V32.menuOpen) v32MenuToggle(false); } catch(e){}
  if(tab) V75U.tab = tab; V75U.panel.hidden = false; v75uPanelFill();
  const f = V75U.panel.querySelector('[data-t="' + V75U.tab + '"]'); if(f) try { f.focus({preventScroll:true}); } catch(e){}
}
function v75uClose(){ V75U.panel.hidden = true; }
function v75uSeg(k, opts, cur, set){ return '<div class="v75uSeg" role="radiogroup">' + opts.map(([v, t]) => `<button type="button" role="radio" aria-checked="${v === cur}" class="${v === cur ? 'on' : ''}" data-k="${k}" data-v="${v}">${t}</button>`).join('') + '</div>'; }
function v75uPanelFill(){
  const p = V75U.panel; if(!p || p.hidden) return; const body = p.querySelector('#v75uBody');
  p.querySelectorAll('[data-t]').forEach(b => { b.classList.toggle('on', b.dataset.t === V75U.tab); b.setAttribute('aria-selected', b.dataset.t === V75U.tab); });
  const sc = body.scrollTop; let h = '';
  if(V75U.tab === 'lay'){
    if(V75U.notes && V75U.notes.length) h += '<div class="v75uNote" role="status"><b>🧩 Tự dời để không chồng:</b><br>' + V75U.notes.map(t => t.replace(/[<&]/g, '')).join('<br>') + '</div>';
    h += `<button type="button" class="pri v75uBig" data-go>✋ Bật chế độ kéo-thả</button><p>Đang sửa cho <b>${V75U_KN[V75U.kind]}</b> — mỗi kiểu màn lưu bố cục riêng. Kéo khung để dời chỗ (tự hít vào mép và đường tỷ lệ vàng), kéo chấm vàng ở góc để đổi cỡ.</p>`;
    for(const k in V75U.B){ const B = V75U.B[k], el = v75uEl(k); if(!el) continue; const d = v75uD(k) || {}, on = !d.hide && !d.menu, here = v75uVis(el) || B.o.tmp || d.hide || d.menu;
      h += `<div class="v75uRow${on ? '' : ' off'}" data-b="${k}"><span>${B.n}<small>${!here ? 'Không dùng ở kiểu màn này' : d.menu ? '📥 Đang nằm trong ☰ Menu' : d.hide ? '🙈 Đang ẩn' : (d.fx != null || d.s) ? '✏️ Đã chỉnh' : 'Vị trí gốc'}</small></span>`
        + `<button type="button" data-h="${k}" ${B.o.lock ? 'disabled title="Khối này luôn cần có trên màn"' : ''} aria-label="${d.hide ? 'Hiện' : 'Ẩn'} ${B.n}">${d.hide ? '🙈' : '👁'}</button>`
        + `<button type="button" data-m="${k}" ${B.o.lock || B.o.nomenu ? 'disabled' : ''} class="${d.menu ? 'on' : ''}" aria-label="${d.menu ? 'Đưa ra màn hình' : 'Dời vào menu'}">${d.menu ? '📤 Ra ngoài' : '📥 Vào menu'}</button>`
        + `<button type="button" data-r="${k}" aria-label="Về mặc định ${B.n}">↩️</button></div>`; }
    h += '<div class="v75uFoot"><button type="button" data-ra>↩️ Về mặc định toàn bộ bố cục</button></div>'
      + '<div class="v75uRow"><span>📋 Bố cục dạng JSON<small>Dán bố cục đã xếp trên trang Claude, hoặc sao chép bố cục hiện tại</small></span>'
      + '<textarea id="v75uJson" rows="3" aria-label="Bố cục JSON" style="flex:1 1 100%;min-height:66px;font:16px/1.4 ui-monospace,monospace;border-radius:13px;border:2px solid rgba(255,255,255,.22);background:rgba(0,0,0,.35);color:#fff;padding:8px"></textarea>'
      + '<button type="button" data-ij>📥 Nhập</button><button type="button" data-ej>📤 Xuất ra ô trên</button></div>';
  } else {
    const P = V75U.S.play, g = v75uGfx(), vol = v75uVol(), pace = v75uPace();
    const row = (t, sub, ctl) => `<div class="v75uRow"><span>${t}<small>${sub}</small></span>${ctl}</div>`;
    h += row('🚶 Tốc độ đi', 'Nhân vật của em khi đi bộ', v75uSeg('spd', [[.8, 'Chậm'], [1, 'Vừa'], [1.25, 'Nhanh']], P.spd));
    h += row('👆 Độ nhạy vuốt', 'Vuốt ngắn đã đi (điện thoại)', v75uSeg('swipe', [[.7, 'Thấp'], [1, 'Vừa'], [1.6, 'Cao']], P.swipe));
    h += row('🔍 Phóng to camera', 'Khi vào game · áp dụng ngay', v75uSeg('zoom', [[0, 'Như cũ'], [.75, 'Xa'], [1, 'Vừa'], [1.35, 'Gần']], P.zoom));
    h += row('👣 Dẫn đường', 'Khi chọn điểm đến trên bản đồ', v75uSeg('guide', [['foot', '👣 Dấu chân'], ['none', 'Không']], P.guide));
    h += row('🚪 Chạm cửa là tự đi tới', 'Tắt: phải tới gần rồi chạm', v75uSeg('door', [[true, 'Bật'], [false, 'Tắt']], P.door !== false));
    h += row('🔠 Cỡ chữ & nút', 'Phóng các khối giao diện (chữ luôn ≥ 16px)', v75uSeg('ui', [[1, 'Vừa'], [1.12, 'Lớn'], [1.25, 'Rất lớn']], P.ui));
    h += row('🪟 Độ rõ của bảng', Math.round((P.alpha || 1)*100) + '% · bảng chữ trên màn chơi', `<input type="range" min="0.5" max="1" step="0.05" value="${P.alpha || 1}" data-rg="alpha" aria-label="Độ rõ của bảng">`);
    if(vol >= 0) h += row('🔊 Âm lượng nhanh', Math.round(vol*100) + '% · tiếng nền + hiệu ứng', `<input type="range" min="0" max="1" step="0.05" value="${vol}" data-rg="vol" aria-label="Âm lượng">`);
    if(g >= 0) h += row('✨ Đồ hoạ', 'Thấp mượt nhất cho máy yếu', v75uSeg('gfx', [[0, 'Thấp'], [1, 'Vừa'], [2, 'Cao']], g));
    if(pace) h += row('🌿 Nhịp game', 'Chill: thời gian trôi chậm, thong thả', v75uSeg('pace', [['chill', '🌿 Chill'], ['normal', '⚡ Bình thường']], pace));
    h += '<div class="v75uFoot"><button type="button" data-rp>↩️ Về mặc định cách chơi</button></div>';
  }
  body.innerHTML = h; body.scrollTop = sc;
  body.onclick = e => { const b = e.target.closest('button'); if(!b || b.disabled) return; const ds = b.dataset;
    if('go' in ds){ v75uClose(); v75uArr(true); return; }
    if(ds.h){ const d = v75uDx(ds.h); d.hide = !d.hide; if(d.hide) d.menu = false; v75uChanged(ds.h); return; }
    if(ds.m){ const d = v75uDx(ds.m); d.menu = !d.menu; if(d.menu) d.hide = false; v75uChanged(ds.m); if(d.menu) try { toast('📥 “' + V75U.B[ds.m].n + '” đã vào ☰ Menu.'); } catch(er){} return; }
    if(ds.r){ v75uReset(ds.r); return; }
    if('ij' in ds){ const t = document.getElementById('v75uJson'); let o = null; try { o = JSON.parse(t.value); } catch(er){}
      if(!o || !o.screens){ try { toast('⚠️ JSON chưa đúng định dạng bố cục (cần "screens").'); } catch(er){} return; } v75uApplyLayout(o); try { toast('📥 Đã nhập bố cục.'); } catch(er){} return; }
    if('ej' in ds){ const t = document.getElementById('v75uJson'); t.value = JSON.stringify(v75uExportLayout()); t.select(); try { navigator.clipboard && navigator.clipboard.writeText(t.value).catch(() => {}); } catch(er){} return; }
    if('ra' in ds){ if(confirm('Đưa mọi khối của kiểu màn “' + V75U_KN[V75U.kind] + '” về chỗ cũ?')) v75uResetAll(); return; }
    if('rp' in ds){ v75uPlayReset(); return; }
    if(ds.k){ let v = ds.v; v = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v;
      if(ds.k === 'gfx'){ try { V70F.slow = 0; V70F.down = performance.now(); v70fSet(v); } catch(er){} v75uPanelFill(); return; }
      if(ds.k === 'pace'){ try { SETTINGS.pace = v; setSave(); v53vApplyPace(); const s = document.getElementById('stPace'); if(s) s.value = v; } catch(er){} v75uPanelFill(); return; }
      v75uPlaySet(ds.k, v); } };
  body.oninput = e => { const r = e.target.closest('[data-rg]'); if(!r) return; const v = +r.value;
    if(r.dataset.rg === 'alpha'){ V75U.S.play.alpha = v; v75uCss(); clearTimeout(V75U.rgT); V75U.rgT = setTimeout(() => { v75uSave(); v75uPanelFill(); }, 400); }
    if(r.dataset.rg === 'vol'){ try { V39S.vol.amb = v; V39S.vol.sfx = v; v39VolApply(); } catch(er){} clearTimeout(V75U.rgT); V75U.rgT = setTimeout(v75uPanelFill, 400); } };
}
function v75uChanged(k){ v75uCss(); v75uPlace(k, true); v75uSave(); v75uPanelFill(); if(V75U.arr){ v75uFrames(); v75uActFill(); } }
function v75uReset(k){ delete V75U.S.lay[V75U.kind][k]; const el = v75uEl(k); if(el){ v75uFitOff(el); el.style.removeProperty('translate'); el.style.removeProperty('scale'); el.style.removeProperty('transform-origin'); } V75U.comp.delete(k); v75uPlace(k, true); v75uChanged(k); }
function v75uResetAll(){ const L = V75U.S.lay[V75U.kind]; V75U.notes = []; Object.keys(L).forEach(k => { delete L[k]; const el = v75uEl(k); if(el){ v75uFitOff(el); el.style.removeProperty('translate'); el.style.removeProperty('scale'); el.style.removeProperty('transform-origin'); } });
  V75U.comp.clear(); v75uAll(); v75uSave(); v75uPanelFill(); if(V75U.arr){ v75uSelect(null); v75uFrames(); } try { toast('↩️ Bố cục ' + V75U_KN[V75U.kind] + ' đã về mặc định.'); } catch(e){} }
function v75uPlayReset(){ V75U.S.play = Object.assign({}, V75U_PDEF); v75uSave(); v75uAll(); v75uPanelFill(); try { toast('↩️ Cách chơi đã về mặc định.'); } catch(e){} }

// ---------- 7. chế độ kéo-thả ----------
function v75uArr(on, saved){
  if(on === V75U.arr) return; V75U.arr = on; document.documentElement.classList.toggle('v75uArr', on); V75U.lay.hidden = !on;
  if(on){ try { if(typeof V32 === 'object' && V32.menuOpen) v32MenuToggle(false); } catch(e){} try { if(typeof openModal !== 'undefined' && openModal) hideModal(); } catch(e){}
    V75U.pk = {}; v75uPkSet(); v75uAll(); v75uSelect(null); v75uFrames(); const loop = () => { if(!V75U.arr) return; v75uFrameTick(); V75U.raf = requestAnimationFrame(loop); }; V75U.raf = requestAnimationFrame(loop); }
  else { cancelAnimationFrame(V75U.raf); V75U.sel = null; V75U.lay.querySelector('#v75uFrs').textContent = ''; V75U.frames.clear(); v75uAll(); v75uSave();
    if(saved){ try { toast('💾 Đã lưu bố cục cho ' + V75U_KN[V75U.kind] + '.'); } catch(e){} setTimeout(() => v75uResolve(), 300); } }
}
function v75uPreview(){
  v75uArr(false); let c = document.getElementById('v75uChip');
  if(!c){ c = document.createElement('button'); c.type = 'button'; c.id = 'v75uChip'; c.className = 'pri'; c.textContent = '✏️ Sửa tiếp bố cục'; c.style.cssText = 'font:800 16px Nunito,system-ui,sans-serif;min-height:44px;padding:6px 21px;border-radius:21px;border:2px solid #ffd23f;background:#2bb34a;color:#fff;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)';
    c.onclick = () => { c.remove(); v75uArr(true); }; document.body.appendChild(c); }
  clearTimeout(V75U.chT); V75U.chT = setTimeout(() => { const x = document.getElementById('v75uChip'); if(x) x.remove(); }, 8000);
}
// khung: khối đang hiện → khung theo hình thật; khối "tạm" chưa hiện → khung mờ đặt chỗ trước
function v75uFrames(){
  const box = V75U.lay.querySelector('#v75uFrs'); box.textContent = ''; V75U.frames.clear();
  const ks = Object.keys(V75U.B).filter(k => { const el = v75uEl(k); return el && (v75uVis(el) || V75U.B[k].o.tmp); }).map(k => [k, v75uRect(k)]).sort((a, b) => b[1].w*b[1].h - a[1].w*a[1].h);
  for(const [k] of ks){ const B = V75U.B[k];
    const f = document.createElement('div'); f.className = 'v75uFr'; f.dataset.k = k; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Khối ' + B.n + ': kéo để dời chỗ'); f.tabIndex = 0;
    f.innerHTML = '<i></i><div class="v75uRz" aria-label="Kéo để đổi cỡ"></div>'; f.querySelector('i').textContent = B.n; box.appendChild(f); V75U.frames.set(k, f); v75uDragBind(f, k); }
  v75uFrameTick(); v75uCover();
}
function v75uRect(k){
  const el = v75uEl(k), B = V75U.B[k]; if(el && v75uVis(el)){ const r = el.getBoundingClientRect(); if(r.width > 2 && r.height > 2 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight) return {x:r.left, y:r.top, w:r.width, h:r.height, g:false}; }
  const d = v75uD(k) || {}, gg = B.o.g || [160, 46, .5, .5], sc = v75uScale(k), w = Math.min(innerWidth - 16, (d.lw || gg[0]*sc)), h = d.lh || gg[1]*sc;
  const [x, y] = v75uXY(d.fx != null ? d : {fx:gg[2], fy:gg[3]}, w, h); return {x, y, w, h, g:true};
}
function v75uFrameTick(){
  V75U.frames.forEach((f, k) => { const r = v75uRect(k), d = v75uD(k) || {};
    const s = f.style, v = [Math.round(r.x) + 'px', Math.round(r.y) + 'px', Math.round(r.w) + 'px', Math.round(r.h) + 'px'];
    if(s.left !== v[0]) s.left = v[0]; if(s.top !== v[1]) s.top = v[1]; if(s.width !== v[2]) s.width = v[2]; if(s.height !== v[3]) s.height = v[3];
    f.classList.toggle('ghost', r.g); f.classList.toggle('hid', !!(d.hide || d.menu)); f.classList.toggle('sel', V75U.sel === k); f.classList.toggle('low', r.y < 36); f.classList.toggle('tiny', r.w < 110 || r.h < 30); });
}
// tỷ lệ màn bị các khối che (chỉ khối đang hiện, không tính khối tạm)
function v75uCover(){
  let a = 0; const W = innerWidth, H = innerHeight;
  V75U.frames.forEach((f, k) => { const d = v75uD(k) || {}; if(d.hide || d.menu || V75U.B[k].o.tmp) return; const r = v75uRect(k); a += Math.max(0, Math.min(r.w, W))*Math.max(0, Math.min(r.h, H)); });
  const p = a/(W*H), w = V75U.lay.querySelector('#v75uWarn'); V75U.cov = p;
  if(w){ w.hidden = p < .5; w.textContent = '⚠️ Các khối đang che ' + Math.round(p*100) + '% màn chơi — nên thu nhỏ hoặc ẩn bớt.'; }
  return p;
}
function v75uSelect(k){ V75U.sel = k; if(k && !V75U.flip){ const r = v75uRect(k), top = r.y + r.h/2 > innerHeight/2; V75U.lay.querySelectorAll('.v75uBar').forEach(b => b.classList.toggle('top', top)); } v75uActFill(); v75uFrameTick(); }
function v75uActFill(){
  const a = V75U.lay.querySelector('#v75uAct'), k = V75U.sel; if(!k){ a.hidden = true; return; } const B = V75U.B[k], d = v75uD(k) || {};
  a.hidden = false; a.classList.toggle('top', V75U.lay.querySelector('#v75uBar').classList.contains('top'));
  a.innerHTML = '<b></b>' + `<button type="button" data-q="h" ${B.o.lock ? 'disabled' : ''}>${d.hide ? '🙈 Hiện lại' : '👁 Ẩn'}</button>`
    + `<button type="button" data-q="m" ${B.o.lock || B.o.nomenu ? 'disabled' : ''} class="${d.menu ? 'on' : ''}">${d.menu ? '📤 Ra ngoài' : '📥 Vào menu'}</button>`
    + '<button type="button" data-q="-" aria-label="Thu nhỏ">−</button><button type="button" data-q="+" aria-label="Phóng to">+</button><button type="button" data-q="r">↩️ Mặc định</button>';
  a.querySelector('b').textContent = B.n + (d.s && d.s !== 1 ? ' · ' + Math.round(d.s*100) + '%' : '');
  a.onclick = e => { const b = e.target.closest('[data-q]'); if(!b || b.disabled) return; const q = b.dataset.q, D = v75uDx(k);
    if(q === 'h'){ D.hide = !D.hide; if(D.hide) D.menu = false; v75uChanged(k); }
    else if(q === 'm'){ D.menu = !D.menu; if(D.menu) D.hide = false; v75uChanged(k); }
    else if(q === 'r') v75uReset(k);
    else if(D.fw && B.o.fit){ const m = q === '+' ? 1.1 : 1/1.1, r = v75uRect(k); D.fw = Math.round(Math.max(44, Math.min(innerWidth - 16, D.fw*m))); D.fh = Math.round(Math.max(40, Math.min(innerHeight - 16, (D.fh || r.h)*m))); v75uPlace(k, true); v75uSave(); v75uActFill(); }
    else { const r = v75uRect(k); v75uResize(k, r, (D.s || 1)*(q === '+' ? 1.1 : 1/1.1)); v75uPlace(k, true); v75uSave(); v75uActFill(); } };
}
// đổi cỡ giữ góc trên-trái đứng yên; giới hạn để khối không tràn màn / không che quá nhiều
function v75uResize(k, r, s){
  const B = V75U.B[k], D = v75uDx(k), s0 = D.s || 1, W = innerWidth, H = innerHeight, k0 = r.w/s0/(V75U.S.play.ui || 1), h0 = r.h/s0/(V75U.S.play.ui || 1), ui = V75U.S.play.ui || 1;
  delete D.rw; delete D.rh; s = Math.max(B.o.min || .85, Math.min(V75U_PHI, s));
  const cap = Math.min((W - 2*V75U_G)/(k0*ui), (H*.618)/(h0*ui), Math.sqrt(W*H*.382/(k0*h0))/ui); if(s > s0 && s > cap) s = Math.max(s0, cap);
  if(s > s0 && (V75U.cov || 0) > .5) s = s0;
  const w = k0*s*ui, h = h0*s*ui, [fx, fy] = v75uF(r.x, r.y, w, h); D.s = Math.round(s*1000)/1000; D.fx = fx; D.fy = fy;
  const el = v75uEl(k); if(el && v75uVis(el)){ const c = V75U.comp.get(k); el.style.setProperty('scale', String(v75uScale(k)), 'important'); el.style.setProperty('transform-origin', '0 0', 'important'); if(!c) v75uPlace(k, true); }
  else { D.lw = Math.round(w); D.lh = Math.round(h); }
}
// hít: mép màn (lề 8px), tâm khối vào đường 0.382 · 0.5 · 0.618 (tỷ lệ vàng); không hít thì bắt lưới 8px
function v75uSnap(x, y, w, h){
  const W = innerWidth, H = innerHeight, g = V75U_G, gx = document.getElementById('v75uGx'), gy = document.getElementById('v75uGy');
  const one = (p, size, L, line) => { const c = [[g, null], [L - g - size, null]]; [.382, .5, .618].forEach(f => c.push([L*f - size/2, L*f])); let best = null;
    c.forEach(([v, ln]) => { if(Math.abs(p - v) <= V75U_SNAP && (!best || Math.abs(p - v) < Math.abs(p - best[0]))) best = [v, ln]; });
    if(best){ if(best[1] != null){ line.style.display = 'block'; return [best[0], best[1]]; } line.style.display = 'none'; return [best[0], null]; }
    line.style.display = 'none'; return [Math.round(p/8)*8, null]; };
  let [sx, lx] = one(x, w, W, gx), [sy, ly] = one(y, h, H, gy);
  if(lx != null) Object.assign(gx.style, {left:Math.round(lx) + 'px', top:'0', width:'2px', height:H + 'px'});
  if(ly != null) Object.assign(gy.style, {top:Math.round(ly) + 'px', left:'0', height:'2px', width:W + 'px'});
  sx = Math.max(g, Math.min(W - w - g, sx)); sy = Math.max(g, Math.min(H - h - g, sy)); if(w > W - 2*g) sx = (W - w)/2; if(h > H - 2*g) sy = (H - h)/2;
  return [sx, sy];
}
function v75uDragBind(f, k){
  let st = null;
  f.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const was = V75U.sel === k; v75uSelect(k); const r = v75uRect(k), rz = e.target.classList.contains('v75uRz');
    if(!rz){ const d = v75uDx(k); if(d.fx == null && !r.g){ [d.fx, d.fy] = v75uF(r.x, r.y, r.w, r.h); v75uPlace(k, true); } }
    st = {x:e.clientX, y:e.clientY, r, rz, s0:v75uDx(k).s || 1, mv:false, id:e.pointerId, was}; try { f.setPointerCapture(e.pointerId); } catch(er){} });
  f.addEventListener('pointermove', e => { if(!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x, dy = e.clientY - st.y; if(!st.mv && Math.hypot(dx, dy) < 4) return; st.mv = true;
    if(st.rz){ const D = v75uDx(k); if(D.fw && V75U.B[k].o.fit){ D.fw = Math.round(Math.max(44, Math.min(innerWidth - st.r.x - V75U_G, st.r.w + dx))); D.fh = Math.round(Math.max(40, Math.min(innerHeight - st.r.y - V75U_G, st.r.h + dy))); [D.fx, D.fy] = v75uF(st.r.x, st.r.y, D.fw, D.fh); v75uPlace(k, true); v75uActFill(); return; }
      const k1 = Math.max((st.r.w + dx)/st.r.w, (st.r.h + dy)/st.r.h); v75uResize(k, st.r, st.s0*k1); v75uActFill(); return; }
    const [x, y] = v75uSnap(st.r.x + dx, st.r.y + dy, st.r.w, st.r.h), d = v75uDx(k); [d.fx, d.fy] = v75uF(x, y, st.r.w, st.r.h);
    const c = V75U.comp.get(k), el = v75uEl(k);
    if(c && el && v75uVis(el) && !st.r.g){ c.dx = Math.round(x - c.nx); c.dy = Math.round(y - c.ny); c.tv = c.dx + 'px ' + c.dy + 'px'; el.style.setProperty('translate', c.tv, 'important'); }
    else if(el && v75uVis(el) && !st.r.g) v75uPlace(k, true); });
  const end = e => { if(!st || e.pointerId !== st.id) return; const mv = st.mv, was0 = st.was && !st.rz; st = null; ['v75uGx', 'v75uGy'].forEach(i => document.getElementById(i).style.display = 'none');
    if(mv){ v75uPlace(k, true); if(k === 'prof') v75uMt(); if(!V75U.B[k].o.flt){ const L = v75uBoxes(), me = L.find(b => b.k === k);
        if(me && L.some(b => b.k !== k && v75uHit(me, b, -1))){ me.ord = 1e9; const f = v75uFree(me, L.filter(b => b.k !== k)); if(f){ const d = v75uDx(k); [d.fx, d.fy] = v75uF(f.x, f.y, me.w, me.h); v75uPlace(k, true); } } }
      v75uSave(); v75uCover(); return; }
    // chạm lại khung đang chọn → chọn khung nằm bên dưới (các khối chồng nhau vẫn chọn được)
    if(e.type === 'pointerup' && was0){ const L = document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest && x.closest('.v75uFr')).filter((x, i, a) => x && a.indexOf(x) === i);
      if(L.length > 1){ const n = L[(L.indexOf(f) + 1) % L.length]; v75uSelect(n.dataset.k); } } };
  f.addEventListener('pointerup', end); f.addEventListener('pointercancel', end);
  f.addEventListener('keydown', e => { const m = {ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1]}[e.key]; if(!m) return; e.preventDefault(); e.stopPropagation();
    const r = v75uRect(k), n = e.shiftKey ? 1 : 8, d = v75uDx(k); [d.fx, d.fy] = v75uF(r.x + m[0]*n, r.y + m[1]*n, r.w, r.h); v75uPlace(k, true); v75uSave(); });
  f.addEventListener('focus', () => v75uSelect(k));
}

// ---------- 7a. KHÔNG CHO CHỒNG: khối đè khối trước → dời khối sau tới chỗ trống gần nhất (lưới 8px), ghi lại "Đã dời X vì chồng lên Y" ----------
function v75uBoxes(){
  const out = [];
  for(const k in V75U.B){ const B = V75U.B[k], el = v75uEl(k), d = v75uD(k) || {}; if(B.o.flt || d.hide || d.menu || !el || !v75uVis(el)) continue;
    const r = el.getBoundingClientRect(); if(r.width < 4 || r.height < 4 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) continue;
    out.push({k, x:r.left, y:r.top, w:r.width, h:r.height, ord:d.ord != null ? d.ord : (d.fx != null ? 500 : 900) + Object.keys(V75U.B).indexOf(k)}); }
  return out.sort((a, b) => a.ord - b.ord);
}
const v75uHit = (a, b, m) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
function v75uPairs(){ const L = v75uBoxes(), P = []; for(let i = 0; i < L.length; i++) for(let j = i + 1; j < L.length; j++) if(v75uHit(L[i], L[j], -1)) P.push([L[i].k, L[j].k]); return P; }
function v75uFree(b, placed){
  const W = innerWidth, H = innerHeight, g = V75U_G, s = 8; let best = null, bd = 1e18;
  for(let y = g; y + b.h <= H - g; y += s) for(let x = g; x + b.w <= W - g; x += s){ const dd = (x - b.x)*(x - b.x) + (y - b.y)*(y - b.y); if(dd >= bd) continue;
    const c = {x, y, w:b.w, h:b.h}; if(placed.some(p => v75uHit(c, p, 3))) continue; bd = dd; best = c; }
  return best;
}
function v75uResolve(only){
  const L = v75uBoxes(), placed = [], notes = [];
  for(const b of L){ const hit = placed.find(p => v75uHit(b, p, -1));
    if(hit && (!only || only === b.k)){ const f = v75uFree(b, placed);
      if(f){ const d = v75uDx(b.k); [d.fx, d.fy] = v75uF(f.x, f.y, b.w, b.h); v75uPlace(b.k, true); b.x = f.x; b.y = f.y; notes.push('Đã dời “' + V75U.B[b.k].n + '” vì chồng lên “' + V75U.B[hit.k].n + '”'); }
      else notes.push('“' + V75U.B[b.k].n + '” đang chồng lên “' + V75U.B[hit.k].n + '” — màn không còn chỗ trống, nên thu nhỏ hoặc ẩn bớt'); }
    placed.push(b); }
  if(notes.length){ V75U.notes = notes.concat(V75U.notes || []).slice(0, 8); v75uSave(); try { toast('🧩 ' + notes[0] + (notes.length > 1 ? ' (+' + (notes.length - 1) + ')' : '') + '.'); } catch(e){} v75uPanelFill(); }
  if(V75U.arr) v75uFrameTick(); return notes;
}

// ---------- 7b. nhập / xuất bố cục JSON (định dạng trang sắp xếp trên Claude) ----------
// {"ver":1,"screens":{"doc"|"ngang"|"pc":{"w","h","blocks":[{"id","x","y","w","h","hidden","inMenu"}]}},"play":{speed,swipe,zoom,font,alpha,gfx,pace,steps,autodoor}}
const V75U_SCR = {doc:'phone', ngang:'land', pc:'desk'};
const V75U_REF = {phone:[390, 844], land:[844, 390], desk:[1440, 900]};
function v75uIdKey(id){
  if(V75U.B[id]) return id; const q = '#' + id;
  for(const k in V75U.B){ const sel = V75U.B[k].sel; if(sel === q || (id === 'hud' && /\.hud$/.test(sel))) return k; }
  return null;
}
function v75uApplyLayout(o, quiet){
  if(!o || typeof o !== 'object') return false; const g = V75U_G;
  for(const sn in (o.screens || {})){ const kind = V75U_SCR[sn] || (V75U.S.lay[sn] ? sn : null), sc = o.screens[sn]; if(!kind || !sc || !Array.isArray(sc.blocks)) continue;
    const W = +sc.w || V75U_REF[kind][0], H = +sc.h || V75U_REF[kind][1], L = {};
    sc.blocks.forEach(b => { const k = b && v75uIdKey(String(b.id || '')); if(!k) return; const d = {};
      if(isFinite(b.x) && isFinite(b.y) && isFinite(b.w) && isFinite(b.h)){ const fw = W - b.w - 2*g, fh = H - b.h - 2*g, c = v => Math.max(0, Math.min(1, v));
        d.fx = fw > 0 ? c((b.x - g)/fw) : .5; d.fy = fh > 0 ? c((b.y - g)/fh) : .5; d.lw = Math.round(b.w); d.lh = Math.round(b.h);
        if(V75U.B[k].o.fit){ const kx = Math.min(1, innerWidth/W), ky = Math.min(1, innerHeight/H); d.fw = Math.round(+b.w*(kind === v75uKindNow() ? kx : 1)); d.fh = Math.round(+b.h*(kind === v75uKindNow() ? ky : 1)); }
        else { d.rw = +b.w; d.rh = +b.h; } }
      d.ord = sc.blocks.indexOf(b);
      if(b.hidden && !V75U.B[k].o.lock) d.hide = true; if(b.inMenu && !V75U.B[k].o.lock && !V75U.B[k].o.nomenu){ d.menu = true; d.hide = false; }
      L[k] = d; });
    V75U.S.lay[kind] = L; }
  const P = o.play, S = V75U.S.play;
  if(P && typeof P === 'object'){
    if(isFinite(P.speed)) S.spd = Math.max(.5, Math.min(2, +P.speed)); if(isFinite(P.swipe)) S.swipe = Math.max(.5, Math.min(2.5, +P.swipe));
    if(isFinite(P.zoom)) S.zoom = +P.zoom ? Math.max(.4, Math.min(2.5, +P.zoom)) : 0; if(isFinite(P.font)) S.ui = Math.max(1, Math.min(1.5, +P.font/16));
    if(isFinite(P.alpha)) S.alpha = Math.max(.5, Math.min(1, +P.alpha)); if(typeof P.steps === 'boolean') S.guide = P.steps ? 'foot' : 'none'; if(typeof P.autodoor === 'boolean') S.door = P.autodoor;
    if(P.gfx != null) try { if(String(P.gfx) === 'auto'){ V70F.auto = true; v70fSave(); } else if(/^[012]$/.test(String(P.gfx))){ V70F.slow = 0; V70F.down = performance.now(); v70fSet(+P.gfx); } } catch(e){}
    if(P.pace === 'chill' || P.pace === 'normal') try { SETTINGS.pace = P.pace; setSave(); v53vApplyPace(); } catch(e){}
    V75U.zoomed = false; }
  for(const key in V75U.B){ const el = v75uEl(key); if(el){ v75uFitOff(el); el.style.removeProperty('translate'); el.style.removeProperty('scale'); el.style.removeProperty('transform-origin'); } }
  if(!quiet) v75uSave(); v75uAll(); v75uZoom(); if(V75U.arr){ v75uSelect(null); v75uFrames(); } v75uPanelFill();
  clearTimeout(V75U.rsT); V75U.rsT = setTimeout(() => v75uResolve(), 1200); return true;
}
function v75uExportLayout(){
  const o = {ver:1, savedAt:new Date().toISOString(), screens:{}, play:{}}, g = V75U_G, P = V75U.S.play;
  for(const sn in V75U_SCR){ const kind = V75U_SCR[sn], cur = kind === V75U.kind, W = cur ? innerWidth : V75U_REF[kind][0], H = cur ? innerHeight : V75U_REF[kind][1], L = V75U.S.lay[kind], blocks = [];
    for(const k in V75U.B){ const d = L[k], el = v75uEl(k); let r = null;
      if(cur && el && v75uVis(el)){ const q = el.getBoundingClientRect(); r = [q.left, q.top, q.width, q.height]; }
      else if(d && d.fx != null && d.lw){ const w = d.lw, h = d.lh || 40; r = [g + d.fx*Math.max(0, W - w - 2*g), g + d.fy*Math.max(0, H - h - 2*g), w, h]; }
      if(!r && !(d && (d.hide || d.menu))) continue; const id = (V75U.B[k].sel.match(/#([\w-]+)$/) || [0, k === 'hud' ? 'hud' : k])[1];
      const b = {id}; if(r){ b.x = Math.round(r[0]); b.y = Math.round(r[1]); b.w = Math.round(r[2]); b.h = Math.round(r[3]); } b.hidden = !!(d && d.hide); b.inMenu = !!(d && d.menu); blocks.push(b); }
    o.screens[sn] = {w:W, h:H, blocks}; }
  o.play = {speed:P.spd, swipe:P.swipe, zoom:P.zoom, font:Math.round(16*(P.ui || 1)), alpha:P.alpha, gfx:typeof V70F === 'object' ? (V70F.auto ? 'auto' : String(V70F.q)) : 'auto', pace:v75uPace() || 'chill', steps:P.guide !== 'none', autodoor:P.door !== false};
  return o;
}

// ---------- 8. khởi động ----------
function v75uFabPos(){
  const b = document.getElementById('v75uFab'), st = document.getElementById('stage'); if(!b || !st) return; let y = 0, x = 0; const sr = st.getBoundingClientRect();
  ['#v32MisBtn', '#v32LogBtn', '#v70sIc'].forEach(q => { const e = document.querySelector(q); if(!e || !e.getClientRects().length) return; const r = e.getBoundingClientRect(); if(r.left > sr.left + sr.width/2 && r.bottom > y){ y = r.bottom; x = sr.right - r.right; } });
  if(y){ const v = Math.round(y - sr.top + 8) + 'px', h = Math.round(x) + 'px'; if(b.style.top !== v) b.style.top = v; if(b.style.right !== h) b.style.right = h; }
  else if(b.style.top){ b.style.top = ''; b.style.right = ''; }
}
function v75uOnResize(){
  const k = v75uKindNow(); if(k !== V75U.kind){ V75U.kind = k; for(const key in V75U.B){ const el = v75uEl(key); if(el){ v75uFitOff(el); el.style.removeProperty('translate'); el.style.removeProperty('scale'); el.style.removeProperty('transform-origin'); } } }
  v75uAll(); if(V75U.arr){ v75uSelect(null); v75uFrames(); } v75uPanelFill();
}
function v75uInit(){
  V75U_B.forEach(([k, sel, n, o]) => V75U.B[k] = {sel, n, o});
  v75uLoad(); V75U.kind = v75uKindNow(); v75uUi(); v75uMenuHook(); v75uPlayHooks();
  if(!V75U.S.t && typeof V75U_PRESET !== 'undefined' && V75U_PRESET) try { v75uApplyLayout(V75U_PRESET, true); } catch(e){ console.warn('v75u preset', e); }
  let rT = 0; const rs = () => { clearTimeout(rT); rT = setTimeout(v75uOnResize, 180); };
  addEventListener('resize', rs); addEventListener('orientationchange', rs);
  addEventListener('keydown', e => {
    if(e.code === 'Escape' && (V75U.arr || !V75U.panel.hidden)){ e.stopImmediatePropagation(); e.preventDefault(); if(V75U.arr) v75uArr(false, true); else v75uClose(); return; }
    if(e.code !== 'KeyU' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target;
    if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if(typeof openModal !== 'undefined' && openModal) return; e.preventDefault(); if(V75U.arr) v75uArr(false, true); else if(V75U.panel.hidden) v75uOpen(); else v75uClose(); }, true);
  setInterval(() => { try { v75uFabPos(); v75uProf(); v75uZoom(); if(!V75U.arr) v75uCheck(); } catch(e){ console.warn('v75u', e); } }, 1000);
  v75uFabPos(); v75uAll();
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v75u = {V75U, v75uOpen, v75uArr, v75uAll, v75uKindNow, v75uApplyLayout, v75uExportLayout, v75uPairs, v75uResolve};
}
