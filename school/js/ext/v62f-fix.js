// ================= v62f · sửa lỗi chủ game báo (ảnh iPhone v62) =================
// 1) Xe đạp / thú cưỡi không vào trong lớp có tường: tự xuống khi bước qua cửa, không bật xe / gọi thú trong lớp.
// 2) Mép khu (v46): lỗ khoét khu bên cạnh nới rộng → hết vệt tường nâu dài, nhãn/bảng tỉ số bị cắt nửa, nhân vật bị cắt dọc.
// 3) HUD mờ khi đứng yên: bớt mờ (không còn giống lớp phủ/hộp thoại vô hình), không mờ khi đang cưỡi/đạp xe.
// 4) Tiền giảm: luôn hiện "−$X · lý do" cạnh số tiền + ghi vào Hộp thư; gửi heo đất báo rõ tiền vẫn là của em.
// 5) Nhãn thế giới nằm dưới cột nút trái: mờ đi để không chồng lên nút.
var V62F = {col:null, colT:0, m:null, why:'', whyT:0, rideMsg:0};

// ---------- 5) nhãn dưới cột nút trái ----------
function v62fColRect(){ const now = performance.now(); if(now - V62F.colT > 700){ V62F.colT = now; V62F.col = null;
    const els = ['#v41Col', '#prof', '.mini', '.v32ic'].map(s => document.querySelector(s)).filter(e => e && e.offsetParent); const R = els.map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
    V62F.col = R.length ? R : null; }
  return V62F.col; }
function v62fLblA(x, y, w, h){ try { const L = v62fColRect(); if(!L) return 1; const m = ctx.getTransform(), d = DPR || 1;
    const x0 = (m.a*x + m.e)/d, y0 = (m.d*y + m.f)/d, x1 = (m.a*(x + w) + m.e)/d, y1 = (m.d*(y + h) + m.f)/d;
    for(const r of L) if(x0 < r.right && x1 > r.left && y0 < r.bottom && y1 > r.top) return .22;
  } catch(e){} return 1; }

// ---------- 2) mép khu ----------
function v62fHoles(){ if(typeof V46 === 'undefined' || !V46.ready) return; const PAD = 30, G = 8;
  V46.Z.forEach(z => { const e = z.e, zo = {x0:z.o.x - G, y0:z.o.y - G, x1:z.o.x + z.o.w + G, y1:z.o.y + z.o.h + G};
    z.holes = V46.Z.filter(q => q !== z && !q.flip).map(q => { const o = q.o; let x0 = o.x - PAD, y0 = o.y - PAD, x1 = o.x + o.w + PAD, y1 = o.y + o.h + PAD;
      if(x1 <= e.x0 || x0 >= e.x1 || y1 <= e.y0 || y0 >= e.y1) return null;
      // không khoét vào phòng của chính khu này
      if(x0 < zo.x1 && x1 > zo.x0 && y0 < zo.y1 && y1 > zo.y0){
        if(o.x >= zo.x1) x0 = Math.max(x0, zo.x1); else if(o.x + o.w <= zo.x0) x1 = Math.min(x1, zo.x0);
        else if(o.y >= zo.y1) y0 = Math.max(y0, zo.y1); else if(o.y + o.h <= zo.y0) y1 = Math.min(y1, zo.y0);
        else { x0 = o.x; y0 = o.y; x1 = o.x + o.w; y1 = o.y + o.h; } }
      return {x:x0, y:y0, w:x1 - x0, h:y1 - y0}; }).filter(Boolean); });
  try { Object.keys(V46ZC).forEach(k => delete V46ZC[k]); } catch(e){} try { V46RC.clear(); } catch(e){}
}
// nhân vật đứng sát mép khu: vẽ lại không bị cắt (trước đây chỉ còn một dải dọc)
function v62fEdge(){ const P = PLAYER; if(!P || !P.visible || P.inSub || v46Raw(P.x) || V46.sky) return; const z = (P._z && V46.ZI[P._z]) || v46ZoneOld(P.x, P.y); if(!z || z.flip) return;
  const e = z.e, x0 = P.x - 22, x1 = P.x + 22, y0 = P.y - 64, y1 = P.y + 10;
  const cut = x0 < e.x0 || x1 > e.x1 || y0 < e.y0 || y1 > e.y1 || z.holes.some(o => x1 > o.x && x0 < o.x + o.w && y1 > o.y && y0 < o.y + o.h);
  if(cut) v46DrawRaw(P); }

// ---------- 1) xe / thú không vào lớp ----------
function v62fRoomAt(x, y){ if(typeof V46 !== 'undefined' && V46.on && v46Raw(x)) return null; for(const id of ['rubik', 'chess', 'music', 'hall', 'office', 'elec']){ const r = R[id]; if(r && r.walls && inside(r, x, y)) return r; } return null; }
function v62fOffRide(why){ const P = PLAYER; if(!P) return; const was = P.cycling ? 'xe' : P.mount ? 'thú' : '';
  if(P.cycling){ P.cycling = false; } if(P.mount){ try { dismount(P, true); } catch(e){ P.mount = null; } }
  try { updateExtButtons(); updatePanel(); } catch(e){} try { v45Act(); } catch(e){}
  const now = performance.now(); if(was && now - V62F.rideMsg > 2500){ V62F.rideMsg = now; toast(why || (was === 'xe' ? '🚲 Vào lớp rồi: xuống xe đi bộ nhé!' : '🐴 Vào lớp rồi: xuống khỏi lưng thú, đi bộ nhé!')); } }

// ---------- 4) tiền ----------
function v62fWhy(t){ V62F.why = t; V62F.whyT = performance.now(); }
function v62fGuessWhy(){ if(performance.now() - V62F.whyT < 2500 && V62F.why) return V62F.why;
  const h = [...document.querySelectorAll('.modal:not([hidden]) h2, .modal:not([hidden]) h3, [id$="Pan"]:not([hidden]) h2, [id$="Panel"]:not([hidden]) h2, #v52s:not([hidden]) h2')].find(e => e.offsetParent);
  return h ? h.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : 'chi tiêu'; }
function v62fMoneyTick(){ if(typeof PROF === 'undefined' || !PROF){ V62F.m = null; return; } const m = +PROF.money || 0;
  if(V62F.m === null || V62F.uid !== PROF.name){ V62F.m = m; V62F.uid = PROF.name; return; }
  if(m < V62F.m){ const d = V62F.m - m, w = v62fGuessWhy(); V62F.why = ''; v62fChip('−$' + d + ' · ' + w);
    try { mlog(`💸 −$${d} · ${w} (còn $${m})`); } catch(e){}
    if(w === 'chi tiêu') try { toast(`💸 Đã trừ $${d} (còn $${m}).`); } catch(e){} }
  V62F.m = m; }
function v62fChip(t){ const a = document.getElementById('profMoney'); if(!a) return; const r = a.getBoundingClientRect(); const c = document.createElement('div'); c.className = 'v62fChip'; c.textContent = t;
  c.style.left = Math.round(r.left) + 'px'; c.style.top = Math.round(r.bottom + 4 + 34*document.querySelectorAll('.v62fChip').length) + 'px'; document.body.appendChild(c); setTimeout(() => c.remove(), 3600); }

function v62fInit(){
  const st = document.createElement('style'); st.textContent = '#stage.v32idle .v32ic,#stage.v32idle .mobctl,#stage.v32idle .mini,#stage.v32idle .prof,#stage.v32idle #v41Col{opacity:.78!important}'
    + '.v62fChip{position:fixed;z-index:70;pointer-events:none;padding:4px 10px;border-radius:12px;background:rgba(15,21,48,.92);color:#ffb4b4;font:800 16px Nunito,"Be Vietnam Pro",sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);animation:v62fUp 3.6s ease forwards;max-width:min(320px,80vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '@keyframes v62fUp{0%{opacity:0;transform:translateY(6px)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}';
  document.head.appendChild(st);
  // (2) mép khu
  if(typeof v46Build === 'function'){ const b0 = v46Build; v46Build = function(){ const r = b0.apply(this, arguments); v62fHoles(); return r; }; v62fHoles(); }
  if(typeof v47wWorld === 'function'){ const w0 = v47wWorld; v47wWorld = function(){ try { if(V46.on) v62fEdge(); } catch(e){} return w0.apply(this, arguments); }; }
  // (1) bước qua cửa lớp khi đang đạp xe / cưỡi thú → tự xuống
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ const ok = cm0(ox, oy, nx, ny); const P = PLAYER;
    if(ok && P && (P.cycling || P.mount) && Math.abs(P.x - ox) < 3 && Math.abs(P.y - oy) < 3 && !v62fRoomAt(ox, oy) && v62fRoomAt(nx, ny)) v62fOffRide(); return ok; };
  const tb0 = toggleBike; toggleBike = function(){ const P = PLAYER; if(P && !P.cycling && v62fRoomAt(P.x, P.y)){ toast('🚲 Trong lớp không đạp xe. Ra khỏi cửa rồi lên xe nhé!'); return; } return tb0.apply(this, arguments); };
  const mt0 = mount; mount = function(kind){ const P = PLAYER; if(P && v62fRoomAt(P.x, P.y)){ toast('🐴 Trong lớp không cưỡi thú. Ra sân rồi cưỡi nhé!'); return; } return mt0.apply(this, arguments); };
  const eu0 = extUpdate; extUpdate = function(dt){ eu0(dt); const P = PLAYER; if(P && P.visible && (P.cycling || P.mount) && !P.v16fly && v62fRoomAt(P.x, P.y)) v62fOffRide(); };
  // (3) HUD không mờ khi đang cưỡi / đạp xe
  setInterval(() => { const P = PLAYER; if(P && P.visible && (P.cycling || P.mount || P.moving)) try { v32Wake(); } catch(e){} try { v62fMoneyTick(); } catch(e){} }, 300);
  // (4) lý do trừ tiền
  if(typeof v51aBankMove === 'function'){ const bm0 = v51aBankMove; v51aBankMove = function(n){ const before = PROF ? PROF.money : 0; if(n > 0) v62fWhy('Gửi heo đất 🐷'); const r = bm0.apply(this, arguments);
      if(r && n > 0 && PROF){ const d = before - PROF.money; if(d > 0) toast(`🐷 Đã gửi $${d} vào Heo đất. Tiền vẫn là của em, rút lại ở Ngõ phố bất cứ lúc nào.`); } return r; }; }
  const W = (name, why) => { try { const f = eval(name); if(typeof f !== 'function') return; const g = function(){ v62fWhy(typeof why === 'function' ? why.apply(this, arguments) : why); return f.apply(this, arguments); }; eval(name + ' = g'); } catch(e){} };
  W('v51aPay', 'Mua ở Ngõ phố'); W('v52wMoney', (n, w) => w || 'Mua sắm'); W('gBuySeed', 'Mua hạt giống'); W('gBuyBed', 'Mua luống đất'); W('v52wmFilm', 'Vé xem phim 🎬'); W('buyP2P', 'Mua ở cửa hàng bạn');
  try { const sh = $('#mShop'); if(sh) sh.addEventListener('click', () => v62fWhy('Cửa hàng'), true); } catch(e){}
  try { if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v62f = {V62F, v62fHoles, v62fRoomAt}; } catch(e){}
}
