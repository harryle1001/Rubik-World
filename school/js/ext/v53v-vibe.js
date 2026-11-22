// ================= v53v: nhịp chill (đồng hồ chậm, NPC thong thả, ít thông báo, ít thiên tai, camera/menu mượt)
// + nhân vật rõ nét (sprite cache theo trang phục/khung hình, vẽ đúng pixel màn hình, viền tối, bóng, vòng sáng người chơi, tên Nunito) =================
const V53V = {K:1.25, clockK:.6, walkK:.78, cache:new Map(), px:0, budget:6e6, hit:0, miss:0,
  tq:[], tBusy:0, tLast:{}, logSeen:new Map(), logType:{}, lastWild:-1e9, wOrig:null, bgmOrig:null, cx:null, cy:null,
  pc:null, sc:null, oc:null, BX:30, BY:66, BW:60, BH:76};
const V53V_WILD = ['bao', 'sieubao', 'loc', 'dongdat', 'songthan', 'baotuyet', 'samset', 'muada'];
const V53V_REST = ['Trời đẹp quá…', 'Nghỉ chân chút đã', 'Gió mát ghê', 'Ngắm mây tí nào', 'Hít thở sâu…'];
function v53vChill(){ return !(typeof SETTINGS === 'object' && SETTINGS && SETTINGS.pace === 'normal'); }

// ---------- 1. nhịp chill ----------
function v53vApplyPace(){
  const ch = v53vChill(); document.body.classList.toggle('v53chill', ch);
  if(!V53V.wOrig){ V53V.wOrig = {}; for(const s in W_WEIGHTS) V53V.wOrig[s] = Object.assign({}, W_WEIGHTS[s]); }
  for(const s in W_WEIGHTS) for(const k in W_WEIGHTS[s]) W_WEIGHTS[s][k] = V53V.wOrig[s][k] * (ch && V53V_WILD.includes(k) ? .2 : 1);
  if(typeof V45A_BGM === 'object'){ if(!V53V.bgmOrig){ V53V.bgmOrig = {}; for(const z in V45A_BGM) V53V.bgmOrig[z] = V45A_BGM[z].bpm; }
    for(const z in V45A_BGM) V45A_BGM[z].bpm = Math.round(V53V.bgmOrig[z] * (ch ? .85 : 1)); }
}
function v53vToastNext(){
  V53V.tBusy = 0; const m = V53V.tq.shift(); if(m == null) return;
  V53V.tBusy = 1; V53V.t0(m); setTimeout(v53vToastNext, 3000);
}
function v53vLogOK(type, text){
  const now = performance.now()/1000, k = type + '|' + text, s = V53V.logSeen.get(k);
  if(s != null && now - s < 120) return false; // cùng một tin trong 2 phút: bỏ
  V53V.logSeen.set(k, now); if(V53V.logSeen.size > 300) V53V.logSeen.delete(V53V.logSeen.keys().next().value);
  if(!['event', 'hazard', 'weather', 'nam'].includes(type)){ const l = V53V.logType[type] || 0; if(now - l < 6) return false; V53V.logType[type] = now; }
  return true;
}
function v53vRest(a){ // NPC dừng lại nghỉ: đứng ngắm cảnh hoặc ngồi nghỉ
  const sit = Math.random() < .4 && regionAt(a.x, a.y) !== 'road';
  a._v53r = {until:realT + 2.5 + Math.random()*3.5, sit, flip:realT + 1.2, d0:a.dir};
  if(Math.random() < .3) say(a, V53V_REST[Math.floor(Math.random()*V53V_REST.length)]);
}
function v53vSettingsRow(){
  if($('#stPace')) return; const ts = $('#stTScale'), row = ts && ts.closest('.strow'); if(!row) return;
  const r = document.createElement('label'); r.className = 'strow';
  r.innerHTML = '<span>Nhịp game</span><select id="stPace"><option value="chill">🌿 Nhịp chill (mặc định)</option><option value="normal">⚡ Bình thường</option></select>';
  row.after(r); const s = r.querySelector('#stPace'); s.value = v53vChill() ? 'chill' : 'normal';
  s.onchange = () => { SETTINGS.pace = s.value; setSave(); v53vApplyPace(); toast(s.value === 'chill' ? '🌿 Nhịp chill: thời gian trôi chậm, mọi người thong thả hơn.' : '⚡ Nhịp bình thường.'); };
}

// ---------- 2. nhân vật rõ nét ----------
function v53vCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function v53vSimple(a){ // tư thế đứng/đi thường: được cache; còn lại vẽ trực tiếp (phóng to K)
  if(a.flying || a.boat || a.mount || a.v16fly || a.cycling || a.lion || down(a)) return false;
  if(a.getUpT && realT - a.getUpT < .6) return false;
  const t = a.task || ''; if(t.startsWith('Ngủ trưa') && !a.moving) return false;
  if(a.y > 880 && (t.startsWith('Lướt sóng') || regionAt(a.x, a.y) === 'beach')) return false;
  if(typeof tornado !== 'undefined' && tornado && dist(a.x, a.y, tornado.x, tornado.y) < 140) return false;
  if(weather === 'sieubao') return false;
  if(fight && (a === fight.a || a === fight.b)) return false;
  return true;
}
function v53vKey(a, R){
  const ph = a.moving ? Math.floor(a.walk*1.5) % 6 : 0, t = a.task || '';
  const ic = a.icon || (a.drum ? 'drum' : a.gift ? 'gift' : t.includes('Rubik') ? 'cube' : /mạch|điện/.test(t) ? 'bolt' : t.includes('cờ vua') ? 'chess' : /(piano|đàn|Hát|nhạc)/i.test(t) ? 'note' : a.saoDo ? 'star' : '');
  if(!a._v53s || realT - a._v53st > 2){ a._v53st = realT; a._v53s = a.style ? (typeof a.style === 'string' ? a.style : JSON.stringify(a.style)) : ''; }
  const fb = a.planKey && a.planKey.startsWith('fb-') ? a.team : '', ride = a.bike && regionAt(a.x, a.y) === 'road' || t.startsWith('Đạp xe quanh') ? 1 : 0;
  const sit = a._v53r && a._v53r.sit ? 1 : 0, noel = a.id === 'nam' && festival && festival.kind === 'noel' ? 1 : 0;
  return [R.toFixed(2), a.shirt, a.pants, a.skin, a.hair, a.long ? 1 : 0, a.glasses ? 1 : 0, a.cap, a.brim, a._v53s, a.skirt ? 1 : 0, a.aodai ? 1 : 0,
    a.student ? 1 : 0, a.bag, a.saoDo ? 1 : 0, a.dir, ph, ic, fb, ride, sit, noel].join('|');
}
function v53vDetail(g, a){ // chi tiết thêm: mắt sáng, má hồng, miệng, tóc bóng, áo có khối (toạ độ thế giới, gốc ở chân)
  const ph = a.moving ? Math.floor(a.walk*1.5) % 6 : 0, by = a.moving && (ph === 1 || ph === 4) ? -1 : 0, d = a.dir > 0 ? 1 : -1;
  const ride = a.bike && regionAt(a.x, a.y) === 'road' || (a.task || '').startsWith('Đạp xe quanh'); if(ride) return;
  const ex1 = d > 0 ? 0 : -3, ex2 = d > 0 ? 3 : 0;
  g.fillStyle = '#ffffff'; g.fillRect(ex1, -27 + by, .8, .8); g.fillRect(ex2, -27 + by, .8, .8);
  g.fillStyle = 'rgba(255,120,130,.55)'; g.fillRect(d > 0 ? -3.5 : -5, -24.5 + by, 2, 1); g.fillRect(d > 0 ? 4 : 2.5, -24.5 + by, 1.5, 1);
  g.fillStyle = 'rgba(90,30,30,.85)'; g.fillRect(d > 0 ? 1 : -3, -23.2 + by, 2, .7);
  if(!(a === PLAYER && a.cap)){ g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(d > 0 ? -3 : -2, -32.6 + by, 5, .8); }
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(d > 0 ? 4 : -6, -21 + by, 2, 12);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-4, -21 + by, 8, .8);
}
function v53vRender(a, R, dp0){ // vẽ nhân vật vào canvas phụ ở tỉ lệ R, rồi tạo viền tối mảnh
  const BW = Math.ceil(V53V.BW*R), BH = Math.ceil(V53V.BH*R);
  if(!V53V.sc || V53V.sc.width < BW || V53V.sc.height < BH){ V53V.sc = v53vCanvas(BW + 8, BH + 8); }
  const S = V53V.sc, g = S.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S.width, S.height); g.imageSmoothingEnabled = false;
  const X = Math.round(a.x), Y = Math.round(a.y);
  g.setTransform(R, 0, 0, R, (V53V.BX - X)*R, (V53V.BY - Y)*R);
  const c0 = ctx, r0 = rect; ctx = g;
  rect = function(c, x, y, w, h){ if(w === 16 && h === 4 && c === 'rgba(0,0,0,.25)') return; r0(c, x, y, w, h); }; // bỏ bóng cũ (vẽ bóng mới mềm hơn)
  try { dp0(a); g.setTransform(R, 0, 0, R, V53V.BX*R, V53V.BY*R); v53vDetail(g, a); } finally { ctx = c0; rect = r0; }
  let F; if(a === PLAYER){ F = V53V.pc; if(!F || F.width !== BW + 4 || F.height !== BH + 4) F = V53V.pc = v53vCanvas(BW + 4, BH + 4); else F.getContext('2d').clearRect(0, 0, F.width, F.height); }
  else F = v53vCanvas(BW + 4, BH + 4);
  const f = F.getContext('2d'), o = Math.max(1, Math.round(R*.42));
  for(const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]]) f.drawImage(S, 2 + dx, 2 + dy);
  f.globalCompositeOperation = 'source-in'; f.fillStyle = 'rgba(18,14,34,.92)'; f.fillRect(0, 0, F.width, F.height);
  f.globalCompositeOperation = 'source-over'; f.drawImage(S, 2, 2);
  return F;
}
function v53vPick(sc){ // tỉ lệ vẽ: ưu tiên số nguyên (sắc nét tuyệt đối) nếu gần K
  const want = sc*V53V.K; for(const n of [Math.round(want), Math.floor(want), Math.ceil(want)]) if(n >= 1 && n/sc >= 1.1 && n/sc <= 1.45) return n;
  return want;
}
function v53vDrawPerson(a, dp0){
  if(!a || a.inSub || !a.visible || (a === PLAYER && typeof V51P === 'object' && V51P.on)) return dp0(a);
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b);
  if(Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || sc < .3 || !v53vSimple(a) || V53V.off){ // vẽ trực tiếp, phóng to quanh chân
    const x = Math.round(a.x), y = Math.round(a.y); ctx.save(); ctx.translate(x, y); ctx.scale(V53V.K, V53V.K); ctx.translate(-x, -y); try { dp0(a); } finally { ctx.restore(); } return;
  }
  const R = v53vPick(sc), X = Math.round(a.x), Y = Math.round(a.y), live = a === PLAYER, rs = a._v53r;
  let F;
  if(live) F = v53vRender(a, R, dp0);
  else { const k = v53vKey(a, R); F = V53V.cache.get(k);
    if(F){ V53V.hit++; V53V.cache.delete(k); V53V.cache.set(k, F); }
    else { V53V.miss++; F = v53vRender(a, R, dp0); V53V.cache.set(k, F); V53V.px += F.width*F.height;
      while(V53V.px > V53V.budget && V53V.cache.size > 1){ const [k0, c0] = V53V.cache.entries().next().value; V53V.cache.delete(k0); V53V.px -= c0.width*c0.height; } } }
  const sx = m.a*X + m.e, sy = m.d*Y + m.f;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // bóng mềm dưới chân + vòng sáng người chơi
  const s = sc*V53V.K;
  if(live){ const pu = .5 + .5*Math.sin(realT*2.2); ctx.fillStyle = `rgba(255,226,120,${.16 + .1*pu})`; ctx.beginPath(); ctx.ellipse(sx, sy, 14*s, 5.5*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(255,236,150,${.55 + .3*pu})`; ctx.lineWidth = Math.max(1.5, s*.9); ctx.beginPath(); ctx.ellipse(sx, sy, 12*s, 4.6*s, 0, 0, Math.PI*2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(10,8,20,.28)'; ctx.beginPath(); ctx.ellipse(sx, sy, 8.5*s, 2.8*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.imageSmoothingEnabled = false;
  const dx = Math.round(sx - V53V.BX*R) - 2, dy = Math.round(sy - V53V.BY*R) - 2;
  if(rs && rs.sit){ const h = F.height*.78; ctx.drawImage(F, dx, Math.round(dy + F.height - h + 3*R*.3), F.width, Math.round(h)); }
  else ctx.drawImage(F, dx, dy);
  ctx.restore();
}
function v53vPill(text, sx, sy, bg){
  ctx.font = '700 16px Nunito, "Be Vietnam Pro", sans-serif'; const w = Math.ceil(ctx.measureText(text).width) + 16, h = 24, x = Math.round(sx - w/2), y = Math.round(sy - h/2);
  ctx.fillStyle = bg; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, 12); else ctx.rect(x, y, w, h); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillText(text, Math.round(sx), y + h/2 + 1);
  return y;
}
function v53vLabels(dl0, args){
  const keepN = v35Name, saved = [];
  v35Name = () => false; // tên và bong bóng thoại do v53v vẽ (to, rõ, cao hơn vì nhân vật to hơn)
  for(const a of agents) if(a.bubble && a.bubbleT > realT){ saved.push(a, a.bubbleT); a.bubbleT = 0; }
  try { dl0.apply(this, args); } finally { v35Name = keepN; for(let i = 0; i < saved.length; i += 2) saved[i].bubbleT = saved[i + 1]; }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const small = cam.z < .5;
  for(const a of agents){
    if(!a.visible || a.inSub) continue;
    const top = ((a.y > 880 ? 44 : 50) + (typeof v72Lift === 'function' ? v72Lift(a) : 0))*V53V.K + 4, [sx, sy] = toScreen(a.x, a.y - top - (a.flying ? a.lift : 0));
    if(sx < -80 || sx > cw + 80 || sy < -60 || sy > ch + 60) continue;
    let ty = sy;
    if(keepN(a) && (!small || a === selected || !a.student)) ty = v53vPill(a.name + (a.saoDo && !small ? ' ★' : ''), sx, sy, a === PLAYER ? 'rgba(18,110,72,.86)' : a.student ? 'rgba(15,21,48,.72)' : 'rgba(64,24,78,.76)') - 4;
    if(a.bubble && realT < a.bubbleT){
      ctx.font = '700 16px Nunito, "Be Vietnam Pro", sans-serif'; const w = Math.min(260, Math.ceil(ctx.measureText(a.bubble).width) + 20), h = 26, bx = Math.round(sx - w/2), byy = Math.round(ty - h - 6);
      ctx.fillStyle = '#fff'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx, byy, w, h, 10); else ctx.rect(bx, byy, w, h); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - 5, byy + h); ctx.lineTo(sx + 5, byy + h); ctx.lineTo(sx, byy + h + 6); ctx.fill();
      ctx.strokeStyle = '#0f1530'; ctx.lineWidth = 2; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx, byy, w, h, 10); else ctx.rect(bx, byy, w, h); ctx.stroke();
      ctx.fillStyle = '#0f1530'; ctx.fillText(a.bubble, Math.round(sx), byy + h/2 + 1, w - 12);
    }
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

// ---------- init ----------
function v53vInit(){
  v53vApplyPace();
  // đồng hồ: nhịp chill chậm còn 60% (×10 → ×6, một ngày ≈ 4 giờ thật); NPC vẫn đi theo thời gian thật
  const rt1 = rtStep; rtStep = function(dtR, ff){ const mm = rt1(dtR, ff);
    if(v53vChill() && REALT.on && (V25.mode === 'x10' || V25.mode === 'x30') && mm > 0){ V25MK /= V53V.clockK; return mm*V53V.clockK; } return mm; };
  // NPC: đi chậm hơn, thỉnh thoảng dừng lại ngắm cảnh / ngồi nghỉ
  const ua0 = updateAgent; updateAgent = function(a, dt){
    if(!v53vChill() || a === PLAYER || a.isPlayer || a.controlled || !a.visible || a.flying || a.inSub) return ua0(a, dt);
    const r = a._v53r;
    if(r){ if(realT < r.until && !down(a) && !isStorm()){ a.moving = false; if(!r.sit && realT > r.flip){ a.dir = -a.dir; r.flip = realT + 1.2 + Math.random(); } return; } a._v53r = null; a.dir = r.d0 || a.dir; }
    const walking = (a.path && a.path.length) || a.v46t;
    if(walking && !a.bike && !isStorm() && realT - (a._v53c || 0) > 1){ a._v53c = realT; if(realT - (a._v53e || 0) > 14 && Math.random() < .045){ a._v53e = realT; v53vRest(a); return; } }
    return ua0(a, dt*V53V.walkK);
  };
  // thiên tai hiếm: ngoài trọng số ×0.2, cách nhau ít nhất 2 ngày trong game
  const sw0 = setWeather; setWeather = function(w, manual){
    if(v53vChill() && !manual && V53V_WILD.includes(w)){ const now = day*1440 + clock; if(now - V53V.lastWild < 2880) w = Math.random() < .5 ? 'nang' : 'gio'; else V53V.lastWild = now; }
    return sw0.call(this, w, manual);
  };
  // thông báo: gộp tin trùng, giãn cách 3 giây, hàng chờ tối đa 3
  V53V.t0 = toast; toast = function(m){
    if(!v53vChill()) return V53V.t0.apply(this, arguments);
    const s = String(m), now = performance.now()/1000; if(V53V.tLast[s] && now - V53V.tLast[s] < 20) return; V53V.tLast[s] = now;
    if(V53V.tq.includes(s)) return; V53V.tq.push(s); if(V53V.tq.length > 3) V53V.tq.shift();
    if(!V53V.tBusy) v53vToastNext();
  };
  // nhật ký: bỏ tin lặp, tin vặt cùng loại cách nhau ≥ 6 giây
  const lg0 = log; log = function(type, text, who){ if(v53vChill() && !v53vLogOK(type, String(text))) return; return lg0.apply(this, arguments); };
  // camera mượt hơn (giảm tốc độ bám từ 5/s xuống ~3/s); nhảy xa thì đi theo luôn
  const r0 = render; render = function(dt){
    if(v53vChill() && followCam && V53V.cx != null && !immersive){ const dx = cam.x - V53V.cx, dy = cam.y - V53V.cy;
      if(Math.abs(dx) + Math.abs(dy) < 300){ cam.x = V53V.cx + dx*.6; cam.y = V53V.cy + dy*.6; } }
    V53V.cx = cam.x; V53V.cy = cam.y; return r0(dt);
  };
  // nhân vật: vẽ qua sprite cache (bọc ngoài cùng, giữ áo choàng v50 / emote v39 / v51p bên trong)
  const dp0 = drawPerson; drawPerson = function(a){ return v53vDrawPerson(a, dp0); };
  const dl0 = drawLabels; drawLabels = function(){ return v53vLabels.call(this, dl0, arguments); };
  // độ phân giải canvas vẫn theo devicePixelRatio + tự hạ khi FPS thấp (v26); nhân vật vẽ ở đúng tỉ lệ pixel màn hình, tắt làm mịn ảnh
  v53vSettingsRow(); const os = openSettings; openSettings = function(){ const r = os.apply(this, arguments); try { v53vSettingsRow(); } catch(e){} return r; };
  if(location.hostname === 'localhost') window.__v53v = V53V;
}
