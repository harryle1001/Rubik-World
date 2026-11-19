// ================= v68m · 3/4 HIỆU ỨNG THẬT: cần câu trong 4 mini game câu cá · tốc độ xe · thuyền du lịch tự chạy =================
// ---------- câu cá: chọn cá gần lưỡi câu (cần may mắn ưu tiên cá hiếm) ----------
function v68mNear(s, R){ const c = s.fish.filter(f => f.st === 'swim'); if(!c.length) return null;
  c.sort((a, b) => Math.hypot(a.x - s.hx, a.y - s.hy) - Math.hypot(b.x - s.hx, b.y - s.hy));
  if(R.luck && Math.random() < R.luck){ const best = c.slice(0, 6).sort((a, b) => (b.sp.r || 0) - (a.sp.r || 0))[0]; if(best) return best; } return c[0]; }
// bọc 1 mini game kiểu arcade (hồ câu v45 + câu ngoài khơi v53s có cùng trạng thái: wait → nib → bite → fight)
function v68mArcWrap(id){ const G = typeof GAMES !== 'undefined' && GAMES[id]; if(!G || G._v68m) return; G._v68m = 1; const u0 = G.update, d0 = G.draw, cap = id === 'pond' ? 72 : 76;
  G.update = function(s, dt){ const R = v68mRod();
    if(R && R.quick && !s.over && s.st === 'wait' && !s.fish.some(f => f.st === 'go' || f.st === 'nib')){ const f = v68mNear(s, R); if(f){ f.st = 'nib'; f.t = .12; s.nib = 0; f.x = s.hx; f.y = s.hy; if(f.vx != null) f.vx = (f.vx < 0 ? -1 : 1)*Math.abs(f.vx || 20); } }
    const r = u0.apply(this, arguments);
    if(R && !s.over){ if(R.quick && s.st === 'bite') s.bt = Math.max(s.bt, 1.2);
      if(s.st === 'fight'){ if(R.strong){ s.ten = Math.min(s.ten, cap); if(id !== 'pond' && s.ten < 38) s.ten = 38; s.strain = 0; s.lo = 0; } if(R.pull) s.prog += (R.pull - 1)*24*dt; } }
    return r; };
  G.draw = function(s, c){ const R = v68mRod(); if(!R) return d0.apply(this, arguments); let r; v68mRodCtx(c, R, s.tip, () => { r = d0.call(this, s, c); }); if(!s.over && s.st !== 'card') try { v68mRodFx(c, R, s.tip, s.vw); } catch(e){} return r; };
}
// cần may mắn: rút thêm vài lần, giữ con hiếm nhất
function v68mLuckPick(p0){ return function(){ const a = p0.apply(this, arguments), R = v68mRod(); if(!R || !R.luck || Math.random() > R.luck) return a; let b = a; for(let i = 0; i < 3; i++){ const c = p0.apply(this, arguments); if(c && (c.r || 0) > (b.r || 0)) b = c; } return b; }; }
function v68mTreasAfter(f0, msg){ return function(s){ const r = f0.apply(this, arguments), R = v68mRod(); if(R && R.treas && Math.random() < R.treas){ const x = v68mTreasGot(); if(x && s && typeof s === 'object'){ s.msg = `🎁 Kèm theo: ${x.ic} ${x.n}!`; s.msgT = 3.2; } } return r; }; }
function v68mFishInit(){
  v68mArcWrap('pond'); v68mArcWrap('v53sfish');
  if(typeof v45pPick === 'function') v45pPick = v68mLuckPick(v45pPick);
  if(typeof v53sPick === 'function') v53sPick = v68mLuckPick(v53sPick);
  if(typeof v45pCaught === 'function') v45pCaught = v68mTreasAfter(v45pCaught);
  if(typeof v53sCaught === 'function') v53sCaught = v68mTreasAfter(v53sCaught);
  // câu cá bến tàu (modal cũ)
  if(typeof fishUpdate === 'function'){ const fu = fishUpdate; fishUpdate = function(dt){ const R = v68mRod();
      if(R && R.quick && FS.state === 'wait') FS.wait = Math.min(FS.wait, FS.t + .15);
      const r = fu.apply(this, arguments);
      if(R && FS.state === 'fight'){ if(R.strong) FS.ten = Math.min(FS.ten, 82); if(R.pull) FS.prog = Math.min(100, FS.prog + (R.pull - 1)*24*dt); } return r; }; }
  if(typeof fishCatch === 'function'){ const fc = fishCatch; fishCatch = function(){ const R = v68mRod(); let r;
      r = fc.apply(this, arguments);
      if(R && R.luck && Math.random() < R.luck && FS.last){ const L = FS.spot === 'pond' ? FISH_POND : (isNight() ? FISH_SEA_NIGHT : FISH_SEA_DAY), [n, a, b] = L.reduce((m, q) => (q[2] || 0) > (m[2] || 0) ? q : m, L[0]), w = +(a + Math.random()*(b - a)).toFixed(2);
        FS.last = {n, w}; const e = FS.bag[FS.bag.length - 1]; if(e){ e.n = n; e.w = w; } try { localStorage.setItem('truong-fishbag-v1', JSON.stringify(FS.bag)); fishMsg(`🍀 May mắn! Bạn câu được ${n} nặng ${w} kg!`); renderBag(); } catch(e){} }
      if(R && R.treas && Math.random() < R.treas) v68mTreasGot(); return r; }; }
  if(typeof fishDraw === 'function'){ const fd = fishDraw; fishDraw = function(){ const R = v68mRod(), cv = document.getElementById('fishCv'); if(!R || !cv) return fd.apply(this, arguments);
      const g = cv.getContext('2d'), w = cv.clientWidth, h = cv.clientHeight, tip = [w*.42, h*.36]; let r; v68mRodCtx(g, R, tip, () => { r = fd.apply(this, arguments); }); try { v68mRodFx(g, R, tip, w); } catch(e){} return r; }; }
  // câu biển sâu trên tàu (modal cũ): cắn ngay, dây khoẻ, cá hiếm hơn, đồ quý
  if(typeof dfUpdate === 'function'){ const du = dfUpdate; dfUpdate = function(dt){ const R = v68mRod(), F = DF;
      if(R && F && R.quick && (F.phase === 'sink' || F.phase === 'wait') && F.ld > 2 && !F.bite && F.fish.length){ let f = F.fish.slice().sort((a, b) => Math.hypot((a.x - F.lx)/6, a.d - F.ld) - Math.hypot((b.x - F.lx)/6, b.d - F.ld))[0];
        if(R.luck) f = F.fish.slice().sort((a, b) => b.sp.r - a.sp.r)[0]; F.biter = f; F.bite = 1.4; F.phase = 'bite'; f.x = F.lx; f.d = F.ld; F.msg = 'CÁ CẮN CÂU! Bấm ngay!'; F.msgT = 1.4; try { blipSfx(1760); } catch(e){} }
      const r = du.apply(this, arguments); if(R && F && F.phase === 'fight' && R.strong) F.T = Math.min(F.T, 86); return r; }; }
  if(typeof dfSpawn === 'function'){ const ds = dfSpawn; dfSpawn = function(){ const r = ds.apply(this, arguments), R = v68mRod(); if(R && R.luck && DF){ const pool = SPECIES.filter(s => s.z === DF.zone && (!s.night || DF.night) && s.r >= 2);
      if(pool.length) DF.fish.forEach(f => { if(f.sp.r < 2 && Math.random() < R.luck*.5){ const sp = pool[Math.floor(Math.random()*pool.length)]; f.sp = sp; f.d = Math.max(1, sp.d[0] + Math.random()*(Math.min(sp.d[1], DF.maxD) - sp.d[0])); f.w = +(sp.w[0] + Math.random()*(sp.w[1] - sp.w[0])*.6).toFixed(2); } }); } return r; }; }
  if(typeof dfLand === 'function'){ const dl = dfLand; dfLand = function(){ const r = dl.apply(this, arguments), R = v68mRod(); if(R && R.treas && Math.random() < R.treas) v68mTreasGot(); return r; }; }
}

// ---------- xe đạp: tốc độ thật + yên gel; phụ kiện vẽ lên xe; tháo/gắn phụ kiện ----------
function v68mBikeInit(){
  const bs0 = bikeSpeed; bikeSpeed = function(){ let v = bs0.apply(this, arguments); if(has('seat') && v68mOff('seat')) v -= 10; if(v68mAccOn('v68a_gel')) v += 15; return v; };
  if(typeof v45DrawBike === 'function'){ const db0 = v45DrawBike, wrap = function(x, y, bk, accs, spin, still){ accs = accs || []; if(!still && PROF && PROF.v68m && PROF.v68m.off) accs = accs.filter(a => !v68mOff(a));
      const A = db0.call(this, x, y, bk, accs, spin, still); try { if(A && accs.some(a => a.startsWith('v68a_'))) v68mAccDraw(x, y, A, accs, still); } catch(e){ if(!V68M.msg.acc){ V68M.msg.acc = 1; console.warn('v68m acc', e); } } return A; };
    const same = drawFancyBike === db0; v45DrawBike = wrap; if(same) drawFancyBike = wrap; }
  if(typeof v45Fish === 'function'){ const vf = v45Fish; v45Fish = function(P, it){ if(it && it.v68 && it.cat === 'rod') return v68mRodArt(P, it); return vf.apply(this, arguments); }; }
  if(typeof v45Stat === 'function'){ const st = v45Stat; v45Stat = function(it){ if(it && it.v68 && it.cat === 'bike') return ['⚡', it.s, Math.round(Math.max(6, Math.min(100, it.s/V68M_SMAX*100)))]; return st.apply(this, arguments); }; }
}
// ---------- thuyền: hình riêng khi lái + hành trình du lịch tự chạy ----------
const V68M_ISLE = ['Đảo Hải Âu', 'Đảo Dừa Xanh', 'Hòn San Hô', 'Đảo Ngọc Trai', 'Hòn Rùa', 'Đảo Mặt Trời', 'Hòn Cá Heo', 'Đảo Gió'];
const V68M_SEAF = ['Rạn san hô chỉ chiếm phần rất nhỏ đáy biển nhưng là nhà của khoảng 1/4 loài sinh vật biển.', 'Thuỷ triều lên xuống mỗi ngày là do lực hút của Mặt Trăng.',
  'Nước biển mặn vì sông suối mang muối khoáng từ đất đá đổ ra biển hàng triệu năm.', 'Hải âu có thể bay rất xa trên biển, nghỉ ngơi ngay trên mặt nước.',
  'Cá heo ngủ bằng một nửa bộ não, nửa kia vẫn thức để bơi và thở.', 'Đảo có thể hình thành từ núi lửa dưới biển hoặc do san hô bồi đắp lâu năm.',
  'Đèn biển giúp tàu thuyền ban đêm biết chỗ có đá ngầm để tránh.', 'Rùa biển đẻ trứng trên bãi cát, rùa con tự bò ra biển khi nở.'];
function v68mBoatItem(c){ const it = c && c.boat && c.boat.item; return it && it.v68 ? it : null; }
function v68mAtSea(c){ try { return typeof v53sAtSea === 'function' ? v53sAtSea(c) : !!(c && c.boat && V46.on && v46Raw(c.x)); } catch(e){ return false; } }
function v68mZoneOK(it, x, y){ try { return oceanAt(v47wDepthY(x, y)).z <= it.zone; } catch(e){ return true; } }
function v68mWater(x, y, m){ try { return typeof v55sWater === 'function' ? v55sWater(x, y, m) : v47wSea(x, y); } catch(e){ return false; } }
function v68mTourStart(){
  const c = typeof v53sMe === 'function' ? v53sMe() : PLAYER, it = v68mBoatItem(c); if(!it || !v68mAtSea(c)){ toast('⛵ Lái thuyền du lịch ra biển rồi bấm Du lịch nhé.'); return; }
  const x = c.x - V46E, y = c.y, isl = (typeof V55S !== 'undefined' && V55S.isl || []).filter(s => s.k === 'isle' || s.k === 'plane'), used = new Set(), pts = [];
  let px = x, py = y; const far = it.v68b === 'far', minD = far ? 900 : 300, maxD = far ? 9000 : 3800;
  for(let n = 0; n < it.tour; n++){ let best = null, bd = 1e9;
    isl.forEach((s, i) => { if(used.has(i)) return; const d = Math.hypot(s.x - px, s.y - py), a = Math.atan2(py - s.y, px - s.x), qx = s.x + Math.cos(a)*(s.r + 190), qy = s.y + Math.sin(a)*(s.r + 190);
      if(d < minD*(n ? .5 : 1) || d > maxD || !v68mWater(qx, qy, 30) || !v68mZoneOK(it, qx, qy)) return; const sc = d + (far && n === 0 ? -Math.min(1500, d*.3) : 0); if(sc < bd){ bd = sc; best = {i, x:qx, y:qy, s}; } });
    if(!best) break; used.add(best.i); pts.push({x:best.x, y:best.y, n:V68M_ISLE[(best.i*7 + 3) % V68M_ISLE.length], f:V68M_SEAF[(best.i*5 + n) % V68M_SEAF.length]}); px = best.x; py = best.y; }
  if(!pts.length){ toast('🧭 Quanh đây chưa thấy đảo nào thuyền này tới được. Lái ra xa bờ hơn rồi thử lại nhé.'); return; }
  pts.push({x, y, n:'Bến xuất phát', home:1});
  V68M.tour = {c, it, pts, i:0, wait:0, stuck:0, last:1e9, far, t0:realT};
  c.boat.v = Math.max(c.boat.v, 20); try { keys.up = keys.down = keys.left = keys.right = false; } catch(e){}
  toast(`🧭 Bắt đầu ${far ? 'Du lịch biển' : 'Dạo vịnh'}: ${pts.length - 1} đảo · thuyền tự chạy, ngồi ngắm biển nhé! Chạm phím lái để tự cầm lái.`); try { blipSfx(990); } catch(e){}
}
function v68mTourEnd(msg, done){ const T = V68M.tour; if(!T) return; V68M.tour = null; if(msg) toast(msg);
  if(done && PROF){ const o = v68mDb(); o.tours++; try { reward(T.far ? 30 : 15, 0, T.far ? 'Du lịch biển xa' : 'Dạo vịnh bằng thuyền'); } catch(e){} try { mprog('boat'); } catch(e){} v68mSave(); } }
function v68mTourStep(c, dt){
  const T = V68M.tour, b = c.boat, p = T.pts[T.i], x = c.x - V46E, y = c.y, max = T.it.s;
  b.v47t = b.v47t || []; b.v47t.forEach(q => q.t -= dt); b.v47t = b.v47t.filter(q => q.t > 0);
  if(T.wait > 0){ T.wait -= dt; b.v *= Math.pow(.25, dt); if(Math.abs(b.v) < 4) b.v = 0; const nx = x + Math.cos(b.h)*b.v*dt, ny = y + Math.sin(b.h)*b.v*dt*.75; if(v68mWater(nx, ny, 10)){ c.x = nx + V46E; c.y = ny; } c.moving = Math.abs(b.v) > 5; return; }
  const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
  if(d < 110){ if(p.home){ v68mTourEnd(`🏁 Về tới nơi xuất phát! Chuyến ${T.far ? 'du lịch biển' : 'dạo vịnh'} hoàn thành. +EXP`, true); return; }
    T.wait = 3.2; T.i++; T.stuck = 0; T.last = 1e9; toast(`📍 ${p.n} (${T.i}/${T.pts.length - 1}) · ${p.f}`); try { cheerSfx(); } catch(e){} return; }
  // né đảo/bờ: thử các hướng lệch dần quanh hướng tới đích
  const want = Math.atan2(dy/.75, dx); let go = null;
  for(const o of [0, .35, -.35, .7, -.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2]){ const a = want + o, lx = x + Math.cos(a)*90, ly = y + Math.sin(a)*68; if(v68mWater(lx, ly, 25) && v68mZoneOK(T.it, lx, ly)){ go = a; break; } }
  if(go == null) go = b.h + 1.2;
  let dd = go - b.h; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); b.h += Math.max(-1.7*dt, Math.min(1.7*dt, dd));
  const tg = max*(T.far ? 1 : .82)*Math.min(1, .3 + d/500)*(Math.abs(dd) > 1.2 ? .45 : 1); b.v += (tg - b.v)*Math.min(1, dt*(T.far ? 1.2 : .7));
  const nx = x + Math.cos(b.h)*b.v*dt, ny = y + Math.sin(b.h)*b.v*dt*.75;
  if(v68mWater(nx, ny, 0) && v68mZoneOK(T.it, nx, ny)){ c.x = nx + V46E; c.y = ny; } else { b.v *= .4; b.h += .6*dt*8; }
  c.dir = Math.cos(b.h) < 0 ? -1 : 1; c.moving = Math.abs(b.v) > 5; c._z = null;
  if(Math.abs(b.v) > 40 && Math.random() < .5) b.v47t.push({x:x - Math.cos(b.h)*30, y:y - Math.sin(b.h)*20, t:1.2});
  if(d < T.last - 30){ T.last = d; T.stuck = 0; } else { T.stuck += dt; if(T.stuck > 9){ T.stuck = 0; T.last = 1e9; if(p.home){ v68mTourEnd('🏁 Chuyến du lịch kết thúc gần bến. +EXP', true); return; } toast(`🧭 Đường tới ${p.n} bị chắn, thuyền đi tiếp điểm sau.`); T.i++; } }
}
function v68mBoatInit(){
  const dm = drawBoatModel; drawBoatModel = function(x, y, bt, gear, sc){ if(bt && bt.v68 && bt.v68b) return v68mBoatDraw(x, y, bt, gear || []); return dm.apply(this, arguments); };
  const bm = boatMove; boatMove = function(c, dt){ const T = V68M.tour; if(!T || c !== T.c) return bm.apply(this, arguments);
    const S = typeof V39 !== 'undefined' ? V39.steer : null;
    if(!c.boat || !v68mAtSea(c) || (typeof openModal !== 'undefined' && openModal && openModal.id === 'mArcade')){ v68mTourEnd(c.boat ? '' : '⛵ Đã rời thuyền, kết thúc hành trình.'); return bm.apply(this, arguments); }
    if(keys.up || keys.down || keys.left || keys.right || (S && S.drag)){ v68mTourEnd('🕹️ Bạn đã tự cầm lái. Hành trình dừng lại.'); return bm.apply(this, arguments); }
    try { v68mTourStep(c, dt); } catch(e){ console.warn('v68m tour', e); v68mTourEnd(); return bm.apply(this, arguments); } };
  const lb = leaveBoat; leaveBoat = function(c){ const r = lb.apply(this, arguments); if(V68M.tour && c === V68M.tour.c && !c.boat) v68mTourEnd(); return r; };
  // thế giới mở cũ coi "thuyền hướng lên bắc" là muốn cập bờ → khi thuyền đang tự chạy thì bỏ qua bước đó
  if(typeof openWorldTick === 'function'){ const ow = openWorldTick; openWorldTick = function(dt){ const T = V68M.tour; if(T && T.c && T.c.controlled && T.c.boat) return; return ow.apply(this, arguments); }; }
}
