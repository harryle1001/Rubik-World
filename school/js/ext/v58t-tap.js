// ================= v58t · CHẠM ĐỂ ĐI: không chữ, không mũi tên vàng =================
// 1. Chạm đất → nhân vật tự đi tới (tìm đường v32Nav/navFind, cả trên đảo tròn v46, xe đạp vẫn chạy).
// 2. Chạm cửa / điểm mini game / toà nhà / NPC → tự đi tới rồi MỞ LUÔN khi tới nơi.
// 3. Chạm nước → không đi. Kéo/vuốt để đi tay giữ nguyên. Hành tinh v56p, máy bay v51p, xe v53c, flycam v52l: giữ cách chạm cũ.
// 4. Khi đi bằng chạm: không vẽ đường kẻ vàng, mũi tên, thẻ chỉ đường, nhãn chữ "Đang đi tới… / Chạm để vào"; chỉ một chấm sáng nhẹ.
const V58T = {upT:-1e9, dn:null, tap:false, next:false, dest:null, t0:0, rubik:null};
function v58tBlocked(){
  const P = PLAYER;
  if(!P || !P.visible || P.boat || P.v16fly || P.mount) return true;
  if(typeof V46 !== 'undefined' && V46.sky) return true;
  if(typeof V56P !== 'undefined' && typeof v56pActive === 'function' && v56pActive()) return true;
  if(typeof V51P !== 'undefined' && V51P.on) return true;
  if(typeof V53C !== 'undefined' && V53C.mode) return true;
  if(typeof V52LD !== 'undefined' && V52LD.on) return true;
  if(typeof V57P !== 'undefined' && V57P.on) return true;
  return false;
}
// đi tới (x, y) bằng chạm: chỉ đường ẩn, tới nơi thì gọi cb
function v58tGo(x, y, cb){
  V58T.next = true; V58T.dest = {x, y, t:realT}; document.body.classList.add('v58tgo');
  try { v32Nav(x, y, ' ', true, cb); } finally { V58T.next = false; }
  if(!V32.nav){ V58T.tap = false; V58T.dest = null; }   // khu bị khoá level: v47w đã báo, không đi
}
function v58tGround(wx, wy){ try { return canMove(wx, wy, wx, wy) && !v58tWaterPx(); } catch(e){ return false; } }
// nước nhìn thấy trên màn hình (hồ, biển, băng mùa đông): xanh dương rõ hơn đỏ/xanh lá
function v58tWaterPx(){
  const s = V58T.sp; if(!s) return false;
  try { const k = cvs.width/cvs.clientWidth, g = mainCtx.getImageData(Math.round(s[0]*k), Math.round(s[1]*k), 1, 1).data; return g[2] > g[0] + 40 && g[2] >= g[1] - 6; } catch(e){ return false; }
}
function v58tTapFn(prev){
  return function(wx, wy){
    if(!PLAYER || !PLAYER.visible){ openLogin(); return; }
    if(down(PLAYER)){ v25StandUp(PLAYER); return; }
    if(v58tBlocked()) return prev.apply(this, arguments);
    const d = v32Target(wx, wy);
    if(d){ if(Math.hypot(d.x - PLAYER.x, d.y - PLAYER.y) < 46){ try { d.f(); } catch(e){} return; }
      V32.door = d; v58tGo(d.x, d.y, () => { V32.door = null; try { d.f(); } catch(e){} }); return; }
    V32.door = null;
    if(v58tGround(wx, wy)) v58tGo(wx, wy);
  };
}
// chấm sáng nhẹ thay cho chữ: ở điểm đến (đang đi) và trên cửa đang đứng cạnh
function v58tDot(x, y, a){
  const p = 1 + .18*Math.sin(realT*4); ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,233,168,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 16*p, 7*p, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(x, y - 1, 3.2, 0, 7); ctx.fill(); ctx.restore();
}
function v58tSprites(sp){
  sp.push({y:1e9 - 2, f:() => { if(typeof NEAR_DOOR !== 'undefined' && NEAR_DOOR && !V32.nav) v58tDot(NEAR_DOOR.x, NEAR_DOOR.y - 2, .75); }});
}
function v58tTapInit(){
  // chạm để đi + mở luôn
  v32Tap = v58tTapFn(v32Tap);
  // phân biệt chuyến đi bằng chạm (ẩn chỉ đường) với chỉ đường từ bản đồ/sự kiện (giữ nguyên)
  const nav0 = v32Nav; v32Nav = function(x, y, n, walk){ V58T.tap = V58T.next || (!!walk && performance.now() - V58T.upT < 60); if(!V58T.next) V58T.dest = V58T.tap ? {x, y, t:realT} : null; return nav0.apply(this, arguments); };
  // v32 gọi v32NavTick qua setInterval (đã giữ tham chiếu cũ) → tự canh riêng: ẩn thẻ/mũi tên, huỷ khi kéo tay
  setInterval(() => {
    if(V58T.tap && V32.nav && PLAYER && PLAYER.controlled && V58T.dest && realT - V58T.dest.t > .4){ V32.nav = null; GUIDE = null; V32.walk = null; V32.door = null; }
    // đi hết mức được (vd. điểm sát mép nước) mà đứng yên > 0.6s → coi như đã tới: mở luôn
    if(V58T.tap && V32.nav && PLAYER){ const k = Math.round(PLAYER.x) + ',' + Math.round(PLAYER.y); V58T.still = k === V58T.lastK ? (V58T.still || 0) + 1 : 0; V58T.lastK = k;
      if(V58T.still > 6 && !openModal){ const cb = V32.nav.onArrive; V32.nav = null; GUIDE = null; V32.walk = null; V58T.still = 0; if(PLAYER.planKey === 'auto') PLAYER.path = []; if(cb) setTimeout(cb, 60); } }
    if(V58T.tap && !V32.nav){ V58T.tap = false; V58T.dest = null; V58T.endT = realT; }
    document.body.classList.toggle('v58tgo', !!(V58T.tap && V32.nav));
  }, 100);
  const t0 = toast; toast = function(m){ if((V58T.tap || realT - (V58T.endT || -9) < 3) && /^Đã tới /.test(String(m))) return; return t0.apply(this, arguments); };
  try { const g0 = v46DrawGuide; v46DrawGuide = function(){ if(!V58T.tap) return g0.apply(this, arguments); if(GUIDE){ const p = v46ToNew(GUIDE.x, GUIDE.y); v58tDot(p[0], p[1], .9); } }; } catch(e){}
  try { const g1 = drawGuideWorld; drawGuideWorld = function(){ if(!V58T.tap) return g1.apply(this, arguments); if(GUIDE) v58tDot(GUIDE.x, GUIDE.y, .9); }; } catch(e){}
  // không còn nhãn "Đang đi tới… / 👆 Chạm để vào": chỉ chấm sáng
  v32Sprites = v58tSprites;
  // mũi tên vàng tới sân bay (v51p) và vòng "PING" vàng: bỏ
  try { v51pDrawGuide = function(){}; } catch(e){}
  try { if(typeof drawPing === 'function') drawPing = function(){ PING = null; }; } catch(e){}
  // đánh dấu lúc nhấc ngón (để biết v32Nav gọi từ một cú chạm, kể cả chạm vào điểm HOTSPOT)
  stage.addEventListener('pointerdown', e => { V58T.dn = [e.clientX, e.clientY, performance.now()]; }, true);
  stage.addEventListener('pointerup', e => { if(e.target !== cvs) return; V58T.upT = performance.now(); const r = cvs.getBoundingClientRect(); V58T.sp = [e.clientX - r.left, e.clientY - r.top]; }, true);
  // chạm trúng một điểm mini game nằm trong toà nhà (vd. bục Sudoku trong Học viện) → mở đúng game đó, không mở menu cả toà
  stage.addEventListener('pointerup', e => { const d = V58T.dn; const ms = e.pointerType === 'mouse'; if(e.target !== cvs || (ms ? (V32.phone || e.button !== 0) : !V32.phone) || !d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > (ms ? 6 : 10) || performance.now() - d[2] > (ms ? 400 : 300)) return;
    if(!PLAYER || !PLAYER.visible || down(PLAYER) || v58tBlocked() || (typeof MOB !== 'undefined' && MOB.pins && MOB.pins.size > 1)) return;
    const r = cvs.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top); let best = null, bd = 44;
    DOORS().forEach(q => { const dd = Math.hypot(q.x - wx, q.y - wy); if(dd < bd){ bd = dd; best = q; } }); if(!best) return;
    if(!HOTSPOTS.concat(XHOT).some(h => inside(h.r, wx, wy))) return;   // ngoài HOTSPOT: v32Tap tự lo
    e.stopImmediatePropagation(); try { drag = null; } catch(er){} try { cvs.releasePointerCapture(e.pointerId); } catch(er){} cvs.classList.remove('dragging'); V58T.upT = performance.now();
    if(Math.hypot(best.x - PLAYER.x, best.y - PLAYER.y) < 46){ try { best.f(); } catch(er){} return; }
    V32.door = best; v58tGo(best.x, best.y, () => { V32.door = null; try { best.f(); } catch(er){} }); }, true);
  // máy tính: bấm chuột (không kéo) lên đất / cửa cũng đi tới như chạm trên điện thoại
  cvs.addEventListener('pointerup', e => { const d = V58T.dn; if(e.pointerType !== 'mouse' || e.button !== 0 || V32.phone || !d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6 || performance.now() - d[2] > 400) return;
    const r = cvs.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top);
    if(HOTSPOTS.concat(XHOT).some(h => inside(h.r, wx, wy))) return;
    if(agents.some(a => a.visible && a !== PLAYER && dist(wx, wy, a.x, a.y - 16) < 30)) return;
    V58T.upT = performance.now(); v32Tap(wx, wy); });
  document.body.classList.add('v58t');
}
function v58tInit(){
  try { v58tTapInit(); } catch(e){ console.warn('v58t tap', e); }
  try { v58tRubikInit(); } catch(e){ console.warn('v58t rubik', e); }
}
