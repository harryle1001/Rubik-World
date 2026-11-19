// ================= v71d · CHỦ GAME QUYẾT 6 VIỆC (sau báo cáo v69) =================
// 1 Cần câu Kho Báu: tối đa 5 đồ quý / ngày thật · 2 Ghi rõ "theo ngày thật" ở bảng lương & Cây thần kỳ
// 3 Menu ☰ chỉ tiếng Việt, chữ ≥16px · 4 Hàng nút máy tính xếp 2 hàng · 5 Thông báo dời xuống giữa, dưới HUD
// 6 Máy tính: chữ ≥16px, nhãn dưới nút tròn tiếng Việt. Chỉ bọc hàm cũ. Mọi tên toàn cục có tiền tố v71d / V71D.
const V71D = {on:false, cap:false, chip:null, seen:new WeakSet(), q:[], qT:0};
const V71D_TREAS_MAX = 5;
const V71D_CAP_MSG = 'Hôm nay biển đã tặng đủ 5 món quý, mai quay lại nhé!';
const V71D_DAY_NOTE = '🗓️ Công và quà làm mới mỗi ngày (theo ngày thật)';
// nhãn tiếng Anh dưới nút tròn (cột đi lại bên trái) → tiếng Việt
const V71D_LABEL = {'Lamp on':'Đèn', 'Lamp':'Đèn tắt', 'Bike':'Xe đạp', 'Walk':'Đi bộ', 'Boat':'Thuyền', 'Leave boat':'Rời thuyền', 'Fly':'Bay', 'Land':'Hạ cánh', 'Plane':'Máy bay', 'Planet':'Hành tinh'};
const V71D_CSS = `
/* 3 · menu ☰: chỉ tiếng Việt, chữ ≥16px, không tràn */
#v32Menu .v39tile b{font-size:16px!important;line-height:1.25}
#v32Menu .v39tab b{font-size:16px!important}
#v32Menu .v39chip{font-size:16px!important}
#v32Menu .v39tile,#v32Menu .v39tab{min-width:0;overflow:hidden}
/* 5 · thông báo: giữa màn hình, ngay dưới HUD (điện thoại: chừa nút tròn hai bên) */
html body #stage #toast.toast{top:var(--v71dTT, 64px)!important;bottom:auto!important}
html body.v32phone #stage #toast.toast{top:var(--v71dTT, 100px)!important;width:max-content;max-width:min(calc(100% - 136px), 460px)!important;font-size:16px!important;line-height:1.3}
/* 4 · máy tính: hàng nút trên cùng xếp 2 hàng, chừa chỗ bản đồ nhỏ */
body:not(.touchdev) #stage .quick{flex-wrap:wrap!important;overflow:visible!important;max-width:calc(100% - 196px)!important;gap:5px!important;align-items:center}
body:not(.touchdev) #stage .quick button,body:not(.touchdev) #stage .quick select{font-size:16px!important;padding:3px 10px!important;min-height:32px!important}
body:not(.touchdev) #stage .quick .ambname{font-size:16px!important}
body:not(.touchdev) #stage #v26Area{top:calc(var(--v71dTT, 64px) + 4px)!important}
/* 6 · máy tính: chữ HUD / Nhiệm vụ / Nhật ký / nhãn nút tròn ≥16px */
body:not(.touchdev) #v27Brand{font-size:16px!important}
body:not(.touchdev) #profName,body:not(.touchdev) #profLvl,body:not(.touchdev) #profMoney,body:not(.touchdev) #v45Heart,body:not(.touchdev) #v52lHun,body:not(.touchdev) #v52lHun b{font-size:16px!important}
body:not(.touchdev) #mtrack,body:not(.touchdev) #mtrack *,body:not(.touchdev) #mlog,body:not(.touchdev) #mlog *{font-size:16px!important}
body:not(.touchdev) #mtrack li,body:not(.touchdev) #mlog li{line-height:1.3}
body:not(.touchdev) #v41Col .v41b small{font-size:16px!important;white-space:nowrap;font-family:Nunito,system-ui,sans-serif;font-weight:800;font-style:normal;text-shadow:0 1px 2px rgba(0,0,0,.85),0 0 4px rgba(0,0,0,.6)}
body:not(.touchdev) #mentor.v39m .mtx b,body:not(.touchdev) #mentor.v39m .mtx p,body:not(.touchdev) #mentor.v39m .mtx q{font-size:16px!important}
body:not(.touchdev) #stage #v41Col{bottom:56px!important}
@media (min-width:900px){html body:not(.touchdev):not(.v71dNo) #mentor.mentor.v39m{left:132px!important;bottom:60px!important}}
/* 1 · số lượt đồ quý còn lại */
#v71dChip{position:fixed;left:50%;top:max(10px, env(safe-area-inset-top));transform:translateX(-50%);z-index:200;pointer-events:none;background:rgba(11,16,32,.9);color:#ffe08a;border:2px solid #ffb300;border-radius:999px;padding:4px 14px;font:800 16px Nunito,system-ui,sans-serif;white-space:nowrap}
body.v32phone #v71dChip{top:calc(max(10px, env(safe-area-inset-top)) + 54px)}
.v71dTreas{font-size:16px;font-weight:800;color:#8a5a00;background:#fff3cd;border-radius:8px;padding:3px 8px}
.v71dTreas.out{color:#6d5a48;background:#efe6d6}
.v71dDay{font-size:16px!important;opacity:.85}
`;

// ---------- 1 · Cần câu Kho Báu: tối đa 5 đồ quý mỗi ngày thật ----------
function v71dToday(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function v71dTreasLeft(){ if(typeof PROF === 'undefined' || !PROF) return V71D_TREAS_MAX; const o = v68mDb(), t = v71dToday(); if(o.tday !== t){ o.tday = t; o.tn = 0; } return Math.max(0, V71D_TREAS_MAX - (o.tn || 0)); }
function v71dTreas(){
  if(typeof v68mTreasGot !== 'function') return;
  const g0 = v68mTreasGot;
  v68mTreasGot = function(){
    if(typeof PROF === 'undefined' || !PROF) return g0.apply(this, arguments);
    if(v71dTreasLeft() <= 0){ V71D.cap = true; try { toast('🌊 ' + V71D_CAP_MSG); } catch(e){} return null; }   // hết lượt: chỉ ra cá thường
    const x = g0.apply(this, arguments); if(!x) return x;
    const o = v68mDb(); o.tn = (o.tn || 0) + 1; try { saveProfile(); } catch(e){}
    const left = v71dTreasLeft(); try { toast(`🎁 Kho báu! Bạn câu được ${x.ic} ${x.n}. ${x.f} · Hôm nay còn ${left}/${V71D_TREAS_MAX} món quý.`); } catch(e){}
    return x;
  };
  // mini game arcade (hồ câu, câu ngoài khơi): báo trong khung game luôn
  const capMsg = f0 => function(s){ V71D.cap = false; const r = f0.apply(this, arguments); if(V71D.cap && s && typeof s === 'object'){ s.msg = '🌊 Biển đã tặng đủ 5 món quý hôm nay'; s.msgT = 3.2; } V71D.cap = false; return r; };
  if(typeof v45pCaught === 'function') v45pCaught = capMsg(v45pCaught);
  if(typeof v53sCaught === 'function') v53sCaught = capMsg(v53sCaught);
  // thẻ cần câu ở quầy TTTM: số lượt còn lại
  if(typeof v68mCard === 'function'){ const c0 = v68mCard; v68mCard = function(it){ let h = c0.apply(this, arguments);
    if(it && it.k === 'treasure'){ const n = v71dTreasLeft(); h = h.replace('<div class="v68row">', `<span class="v71dTreas${n ? '' : ' out'}">💎 Đồ quý hôm nay: còn ${n}/${V71D_TREAS_MAX}</span><div class="v68row">`); }
    return h; }; }
}
// chip "💎 còn N/5" khi đang câu bằng cần Kho Báu
function v71dChipTick(){
  let show = false;
  try { const R = typeof v68mRod === 'function' && v68mRod(); if(R && R.treas && typeof openModal !== 'undefined' && openModal){ const id = openModal.id;
    show = id === 'mFish' || id === 'mFishDeep' || (id === 'mArcade' && typeof ARC !== 'undefined' && (ARC.id === 'pond' || ARC.id === 'v53sfish')); } } catch(e){}
  let c = V71D.chip; if(!show){ if(c && !c.hidden) c.hidden = true; return; }
  if(!c){ c = V71D.chip = document.createElement('div'); c.id = 'v71dChip'; c.setAttribute('role', 'status'); document.body.appendChild(c); }
  const n = v71dTreasLeft(), t = n ? `💎 Đồ quý hôm nay: còn ${n}/${V71D_TREAS_MAX}` : '🌊 Hôm nay đã đủ 5 món quý';
  if(c.textContent !== t) c.textContent = t; if(c.hidden) c.hidden = false;
}

// ---------- 2 · Lương & Cây thần kỳ: ghi rõ tính theo ngày thật (không đổi cách tính) ----------
function v71dDayNote(){
  if(typeof v67lRender === 'function'){ const r0 = v67lRender; v67lRender = function(){ const r = r0.apply(this, arguments);
    try { const p = V67L.panel, sec = p && p.querySelector('.v67lCard section'); if(sec && !p.querySelector('.v71dDay')){ const n = document.createElement('p'); n.className = 'v67lNote v71dDay'; n.textContent = V71D_DAY_NOTE; sec.appendChild(n); } } catch(e){}
    return r; }; }
  if(typeof v66tOpen === 'function'){ const o0 = v66tOpen; v66tOpen = function(){ const r = o0.apply(this, arguments);
    try { const p = document.getElementById('v66tPanel'), sec = p && p.querySelector('.v66tCard section'); if(sec && !p.querySelector('.v71dDay')){ const n = document.createElement('p'); n.className = 'v71dDay'; n.textContent = V71D_DAY_NOTE; const ref = sec.querySelector('.v66tChips'); sec.insertBefore(n, ref); } } catch(e){}
    return r; }; }
}

// ---------- 3 · Menu ☰: bỏ dòng tiếng Anh, chỉ còn tiếng Việt ----------
function v71dMenuVi(m){
  m.querySelectorAll('.v39tile, .v39tab, #v32Title').forEach(t => { const s = t.querySelector('small'), b = t.querySelector('b'); if(!s || !b) return; const vi = s.textContent.trim(); if(vi){ b.textContent = vi; } s.remove(); });
  m.querySelectorAll('.v39chip span').forEach(s => { const t = s.textContent, i = t.indexOf(' · '); if(i > 0 && /^[A-Za-z ]+$/.test(t.slice(0, i))) s.textContent = t.slice(i + 3); });
}
function v71dMenu(){
  const m = document.getElementById('v32Menu'); if(!m){ setTimeout(v71dMenu, 800); return; }
  let busy = false; const run = () => { if(busy) return; busy = true; try { v71dMenuVi(m); } catch(e){} busy = false; };
  new MutationObserver(run).observe(m, {childList:true, subtree:true}); run();
}

// ---------- 6b · nhãn dưới nút tròn → tiếng Việt ----------
function v71dLabels(){
  const col = document.getElementById('v41Col'); if(!col){ setTimeout(v71dLabels, 800); return; }
  const run = () => col.querySelectorAll('.v41b small').forEach(s => { const v = V71D_LABEL[s.textContent.trim()]; if(v && s.textContent !== v) s.textContent = v; });
  new MutationObserver(run).observe(col, {childList:true, subtree:true, characterData:true}); run();
  const lb = document.getElementById('v52ldBtn'); if(lb) lb.title = 'Flycam (máy quay bay) của chủ game · phím V';
}

// ---------- 5 · vị trí thông báo: ngay dưới HUD (đo thật mỗi giây, đổi khi xoay máy) ----------
function v71dToastPos(){
  const st = document.getElementById('stage'); if(!st) return; const sr = st.getBoundingClientRect(); let b = 0;
  const phone = document.body.classList.contains('v32phone');
  (phone ? ['#prof'] : ['#prof', '#quick', '.hud']).forEach(q => { const e = document.querySelector(q); if(!e || !e.offsetParent) return; const r = e.getBoundingClientRect(); if(r.height > 0 && r.top - sr.top < 260) b = Math.max(b, r.bottom - sr.top); });
  const v = Math.round((b || 56) + 6) + 'px'; if(V71D.tt !== v){ V71D.tt = v; st.style.setProperty('--v71dTT', v); }
}

// ---------- 6 · máy tính: chữ < 16px ở bảng cũ → 16px (chỉ phần tử có chữ, bỏ qua canvas/svg) ----------
function v71dDesk(){ return !document.body.classList.contains('touchdev') && !document.body.classList.contains('v32phone'); }
function v71dFix(e){
  if(!e || e.nodeType !== 1 || V71D.seen.has(e)) return; V71D.seen.add(e);
  const tg = e.tagName; if(tg === 'CANVAS' || tg === 'SCRIPT' || tg === 'STYLE' || e.closest('svg, #v71dChip, .v71dKeep')) return;
  let txt = false; for(const n of e.childNodes) if(n.nodeType === 3 && n.textContent.trim()){ txt = true; break; }
  if(!txt && tg !== 'INPUT' && tg !== 'SELECT' && tg !== 'TEXTAREA') return;
  const fs = parseFloat(getComputedStyle(e).fontSize); if(fs >= 6 && fs < 15.95) e.style.setProperty('font-size', '16px', 'important');
}
function v71dSweep(root){ if(!v71dDesk()) return; v71dFix(root); if(root.querySelectorAll) root.querySelectorAll('*').forEach(v71dFix); }
function v71dFonts(){
  v71dSweep(document.body);
  new MutationObserver(ms => { if(!v71dDesk()) return; for(const m of ms) m.addedNodes.forEach(n => { if(n.nodeType === 1) V71D.q.push(n); else if(n.nodeType === 3 && n.parentElement){ V71D.seen.delete(n.parentElement); V71D.q.push(n.parentElement); } });
    if(V71D.q.length && !V71D.qT) V71D.qT = requestAnimationFrame(() => { V71D.qT = 0; const q = V71D.q; V71D.q = []; q.forEach(n => { if(n.isConnected) v71dSweep(n); }); }); })
    .observe(document.body, {childList:true, subtree:true});
}

function v71dInit(){
  if(V71D.on || /[?&]nov71d/.test(location.search)) return; V71D.on = true;
  if(!document.getElementById('v71dCss')){ const s = document.createElement('style'); s.id = 'v71dCss'; s.textContent = V71D_CSS; document.head.appendChild(s); }
  const step = (n, f) => { try { f(); } catch(e){ console.warn('v71d ' + n, e); } };
  step('treas', v71dTreas); step('day', v71dDayNote); step('menu', v71dMenu); step('labels', v71dLabels); step('fonts', v71dFonts);
  step('toast', v71dToastPos); setInterval(() => { try { v71dToastPos(); v71dChipTick(); } catch(e){} }, 500);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v71d = {V71D, v71dTreasLeft};
}
