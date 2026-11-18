// ================= v52 · MINI GAME NẤU ĂN (toàn màn hình, chỉ cảm ứng) =================
// 5 bước: 🧺 chọn nguyên liệu → 🚿 rửa (chà) → 🔪 thái (vuốt dọc) → 🔥 nấu (giữ để tăng lửa, canh vùng xanh) → 🍽 bày đĩa (kéo thả).
// Không có thua: làm chưa khéo chỉ ít sao hơn. Thoát giữa chừng được trả lại nguyên liệu. Mọi tên có tiền tố v52l / V52L.
const V52LC_STEPS = [['pick', '🧺', 'Chọn'], ['wash', '🚿', 'Rửa'], ['cut', '🔪', 'Thái'], ['cook', '🔥', 'Nấu'], ['plate', '🍽', 'Bày']];
const V52LC_HEAT = {boil:[.45, .75, '🍲 Nồi luộc'], fry:[.55, .8, '🍳 Chảo chiên'], grill:[.5, .78, '♨️ Vỉ nướng'], bake:[.4, .65, '🔥 Lò nướng'], mix:[0, 0, '🥣 Tô trộn']};
const V52LC = {open:false, r:null, where:'home', si:0, step:null, el:null, cv:null, g:null, W:0, H:0, dpr:1, raf:0, last:0, t:0, P:[], ptr:null, sc:null, bg:null, bgKey:'', hintT:0, done:false, used:null, noise:null, fpsN:0, fpsT:0, fps:0};

// ---------- mở / đóng ----------
function v52lcEl(){
  if(V52LC.el) return V52LC.el; const E = document.createElement('div'); E.id = 'v52lc'; E.hidden = true;
  E.innerHTML = '<canvas aria-label="Bếp nấu ăn: chạm, vuốt và kéo để nấu"></canvas>' +
    '<div class="v52lc-top"><div class="l"><span class="em"></span><b class="nm"></b></div><div class="c" role="list"></div><div class="r"><button type="button" class="hb" aria-label="Hướng dẫn">?</button><button type="button" class="xb" aria-label="Thoát">✕</button></div></div>' +
    '<div class="v52lc-hint" aria-live="polite"></div>' +
    '<div class="v52lc-help" hidden><h3>👩‍🍳 Cách nấu</h3><p>🧺 <b>Chọn</b>: chạm đúng nguyên liệu của món.</p><p>🚿 <b>Rửa</b>: chà ngón tay qua lại trên rau, thịt cho sạch đốm bẩn.</p><p>🔪 <b>Thái</b>: vuốt dọc từ trên xuống qua vạch đứt, càng gần vạch càng đều.</p><p>🔥 <b>Nấu</b>: giữ tay để tăng lửa, thả tay để hạ lửa. Giữ kim trong <b style="color:#2fbf71">vùng xanh</b>. Món trộn thì khuấy vòng tròn.</p><p>🍽 <b>Bày</b>: kéo đồ trang trí vào các vòng sáng trên đĩa.</p><p>⌨️ Máy tính: giữ <b>Space</b> để tăng lửa, <b>Esc</b> để thoát.</p><button type="button" class="primary ok">Đã hiểu</button></div>' +
    '<div class="v52lc-end" hidden><div class="box"><canvas width="96" height="80"></canvas><h3></h3><p class="stars"></p><p class="info"></p><div class="row"><button type="button" class="primary eat">😋 Ăn ngay</button><button type="button" class="give">🎁 Mời bạn</button><button type="button" class="keep">🧺 Cất vào tủ</button></div><button type="button" class="again">Play again</button></div></div>';
  document.body.appendChild(E); V52LC.el = E; V52LC.cv = E.querySelector('canvas'); V52LC.g = V52LC.cv.getContext('2d');
  E.querySelector('.xb').onclick = () => v52lcClose(); E.querySelector('.hb').onclick = () => { const h = E.querySelector('.v52lc-help'); h.hidden = !h.hidden; };
  E.querySelector('.v52lc-help .ok').onclick = () => { E.querySelector('.v52lc-help').hidden = true; };
  E.querySelector('.eat').onclick = () => { const r = V52LC.r, S = v52lS(); if(S.dish[r.id] > 0){ S.dish[r.id]--; if(!S.dish[r.id]) delete S.dish[r.id]; } v52lcClose(true); v52lEat({name:r.vi, em:r.em, no:r.no, veg:r.ing.some(k => /veg|fruit/.test(V52L_ING[k][6]))}); };
  E.querySelector('.give').onclick = () => { const w = V52LC.where; v52lcClose(true); V52L.give = V52LC.r.id; v52lPanel(w === 'market' ? 'home' : w, 'give'); };
  E.querySelector('.keep').onclick = () => { v52lcClose(true); toast(`🧺 Đã cất ${V52LC.r.vi} vào tủ. Mở 🍚 trên thanh trên cùng để ăn hoặc mời bạn.`); };
  E.querySelector('.again').onclick = () => { const r = V52LC.r, w = V52LC.where; v52lcClose(true); if(v52lMissing(r).length) v52lPanel(w, 'cook'); else v52lcOpen(r.id, w); };
  v52lcInput(V52LC.cv); return E;
}
function v52lcOpen(id, where){
  const r = v52lRec(id); if(!r || V52LC.open) return false; if(typeof PROF === 'undefined' || !PROF){ try { openLogin(); } catch(e){} return false; }
  const miss = v52lMissing(r); if(miss.length){ toast('Còn thiếu: ' + miss.map(k => V52L_ING[k][0]).join(', ')); return false; }
  r.ing.forEach(k => v52lAdd(k, -1)); V52LC.used = r.ing.slice(); v52lSave();
  const E = v52lcEl(); V52LC.r = r; V52LC.where = where || 'home'; V52LC.open = true; V52LC.done = false; V52LC.P = []; V52LC.ptr = null;
  V52LC.sc = {miss:0, cut:[], burn:0, cookT:0, plate:[], t0:performance.now()};
  E.hidden = false; E.querySelector('.v52lc-end').hidden = true; E.querySelector('.v52lc-help').hidden = true;
  E.querySelector('.em').textContent = r.em; E.querySelector('.nm').textContent = r.vi;
  try { if(typeof keys !== 'undefined') keys.up = keys.down = keys.left = keys.right = false; } catch(e){}
  v52lcResize(); v52lcGo(0); V52LC.last = performance.now(); cancelAnimationFrame(V52LC.raf); V52LC.raf = requestAnimationFrame(v52lcFrame); return true;
}
function v52lcClose(finished){
  if(!V52LC.open) return; V52LC.open = false; cancelAnimationFrame(V52LC.raf); v52lcNoise(0); if(V52LC.el) V52LC.el.hidden = true;
  if(!finished && !V52LC.done && V52LC.used){ V52LC.used.forEach(k => v52lAdd(k, 1)); v52lSave(); toast('Đã cất lại nguyên liệu vào tủ. Lúc nào rảnh nấu tiếp nhé!'); }
  V52LC.used = null;
}
function v52lcResize(){
  if(!V52LC.open) return; const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; V52LC.dpr = dpr; V52LC.W = W; V52LC.H = H;
  V52LC.cv.width = Math.round(W*dpr); V52LC.cv.height = Math.round(H*dpr); V52LC.cv.style.width = W + 'px'; V52LC.cv.style.height = H + 'px'; V52LC.bgKey = '';
  if(V52LC.step) v52lcLayout();
}
// bố cục tỷ lệ vàng: khay dưới cao ≈ vùng chơi / φ³, tâm bàn bếp ở giữa phần trên
function v52lcLayout(){
  const W = V52LC.W, H = V52LC.H, top = 52, ah = H - top, th = Math.max(96, Math.min(150, Math.round(ah/(V52L_PHI*V52L_PHI*V52L_PHI)))), wh = ah - th;
  const L = V52LC.L = {top, th, wh, ty:H - th, cx:W/2, cy:top + wh*.52, U:Math.min(W*.92, wh*.9), land:W > H};
  L.S = Math.min(L.U*.36, 190); return L;
}
function v52lcHint(s){ const h = V52LC.el.querySelector('.v52lc-hint'); h.textContent = s; h.classList.remove('off'); V52LC.hintT = 3.2; }
function v52lcSteps(){
  const c = V52LC.el.querySelector('.v52lc-top .c'); c.innerHTML = V52LC_STEPS.map((s, i) => `<span role="listitem" class="${i < V52LC.si ? 'ok' : i === V52LC.si ? 'on' : ''}">${s[1]}<i>${s[2]}</i></span>`).join('');
}

// ---------- các bước ----------
function v52lcWashable(r){ return r.ing.filter(k => /veg|fruit|protein/.test(V52L_ING[k][6]) && !/bean|egg/.test(V52L_ING[k][3])).slice(0, 3); }
function v52lcCuttable(r){ return r.ing.filter(k => /round|long|meat|bread|leaf|cheese|fish|corn/.test(V52L_ING[k][3])).slice(0, 2); }
function v52lcGo(i){
  const r = V52LC.r; V52LC.si = i; v52lcLayout(); v52lcNoise(0);
  if(i >= V52LC_STEPS.length){ v52lcFinish(); return; }
  const k = V52LC_STEPS[i][0], L = V52LC.L;
  if(k === 'pick'){ const pool = Object.keys(V52L_ING).filter(x => !r.ing.includes(x)); const dec = []; while(dec.length < Math.min(3, 7 - r.ing.length)){ const x = pick(pool); if(!dec.includes(x)) dec.push(x); }
    V52LC.step = {k, tiles:shuffle(r.ing.concat(dec)).map(id => ({id, need:r.ing.includes(id), got:false, shake:0})), fly:[], got:0}; v52lcHint('🧺 Chạm đúng nguyên liệu của món ' + r.vi); }
  if(k === 'wash'){ const it = v52lcWashable(r); if(!it.length){ v52lcGo(i + 1); return; } V52LC.step = {k, it, j:0, dirt:v52lcDirt()}; v52lcHint('🚿 Chà ngón tay qua lại cho sạch đốm bẩn'); }
  if(k === 'cut'){ const it = v52lcCuttable(r); if(!it.length){ v52lcGo(i + 1); return; } V52LC.step = {k, it, j:0, g:v52lcGuides(), stroke:null, cuts:0}; v52lcHint('🔪 Vuốt dọc từ trên xuống qua vạch đứt'); }
  if(k === 'cook'){ const H = V52LC_HEAT[r.cook]; V52LC.step = {k, heat:0, prog:0, lo:H[0], hi:H[1], mix:r.cook === 'mix', ang:null, hold:false, puff:0}; v52lcHint(r.cook === 'mix' ? '🥣 Khuấy vòng tròn quanh tô' : '🔥 Giữ tay để tăng lửa, giữ kim trong vùng xanh'); if(r.cook !== 'mix') v52lcNoise(1); }
  if(k === 'plate'){ const S = L.S*1.1, spots = []; for(let q = 0; q < 4; q++){ const a = q*2.39996 + .6, rr = S*(.42 + .14*(q % 2)); spots.push({x:Math.cos(a)*rr, y:Math.sin(a)*rr*.62, id:null, err:0}); }
    const pieces = []; for(let q = 0; q < 4; q++) pieces.push({id:r.ing[q % r.ing.length], used:false}); V52LC.step = {k, spots, pieces, drag:null}; v52lcHint('🍽 Kéo đồ trang trí vào các vòng sáng trên đĩa'); }
  v52lcSteps();
}
function v52lcDirt(){ const D = []; for(let q = 0; q < 7; q++){ const a = Math.random()*6.28, rr = Math.random()*.7; D.push({x:Math.cos(a)*rr, y:Math.sin(a)*rr*.8, r:.12 + Math.random()*.1, a:1}); } return D; }
function v52lcGuides(){ const n = 4, G = []; for(let q = 0; q < n; q++) G.push({u:-.6 + 1.2*(q + .5)/n, cut:false, err:0}); return G; }
function v52lcNext(){ setTimeout(() => { if(V52LC.open && !V52LC.done) v52lcGo(V52LC.si + 1); }, 650); }
function v52lcFinish(){
  const r = V52LC.r, sc = V52LC.sc, S = v52lS(), avg = a => a.length ? a.reduce((x, y) => x + y, 0)/a.length : 1;
  const pickS = Math.max(0, 1 - sc.miss*.25), cutS = avg(sc.cut.map(e => 1 - Math.min(1, e*1.6))), cookS = Math.max(0, 1 - Math.min(1, sc.burn/4) - Math.min(.3, Math.max(0, sc.cookT - 14)/30)), plateS = avg(sc.plate.map(e => 1 - Math.min(1, e*.8)));
  const tot = .2*pickS + .25*cutS + .35*cookS + .2*plateS, stars = tot > .85 ? 3 : tot > .6 ? 2 : 1; V52LC.done = true; V52LC.used = null;
  S.dish[r.id] = (S.dish[r.id] || 0) + 1; S.cooked = (S.cooked || 0) + 1; S.best[r.id] = Math.max(S.best[r.id] || 0, stars);
  const today = new Date().toDateString(); if(S.rday.d !== today) S.rday = {d:today, n:0}; S.rday.n++;
  let money = Math.max(1, Math.min(20, Math.round(2 + tot*10))), exp = Math.round(8 + tot*24); if(S.rday.n > 10){ money = Math.max(1, Math.round(money/2)); exp = Math.round(exp/2); }
  try { reward(exp, money, 'Nấu ' + r.vi, true); } catch(e){} v52lSave(); v52lSnd('ok');
  for(let q = 0; q < 40; q++) v52lcPart(V52LC.L.cx, V52LC.L.cy, 'star');
  const E = V52LC.el.querySelector('.v52lc-end'); E.hidden = false; const c = E.querySelector('canvas'), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 80); g.drawImage(v52lDishSpr(r), 0, 0, 96, 80);
  E.querySelector('h3').textContent = `${r.em} ${r.vi} ${r.o}`; E.querySelector('.stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  const veg = r.ing.some(k => /veg|fruit/.test(V52L_ING[k][6]));
  E.querySelector('.info').textContent = `+$${money} · +${exp} EXP · Ăn vào +${r.no} no bụng${veg ? ' · 🥬 có rau, rất lành mạnh!' : ' · 💡 Ăn kèm rau hoặc trái cây nhé!'}`;
  V52LC.si = V52LC_STEPS.length; v52lcSteps(); V52LC.el.querySelector('.v52lc-hint').classList.add('off');
  try { log('event', `${PROF.name} nấu xong món ${r.vi} (${stars}★).`); } catch(e){}
}

// ---------- âm thanh: tiếng xèo xèo / lửa (nhiễu lọc), tiếng dao ----------
function v52lcNoise(on){
  try {
    if(!on){ if(V52LC.noise){ const n = V52LC.noise; n.g.gain.setTargetAtTime(0, AC.currentTime, .05); setTimeout(() => { try { n.s.stop(); } catch(e){} }, 300); V52LC.noise = null; } return; }
    if(V52LC.noise || (typeof V39S !== 'undefined' && V39S.vol && V39S.vol.sfx <= 0)) return; ensureAC(); const len = AC.sampleRate*1.5, b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0); for(let q = 0; q < len; q++) d[q] = Math.random()*2 - 1;
    const s = AC.createBufferSource(); s.buffer = b; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = .7; const g = AC.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(typeof v39Bus === 'function' ? v39Bus() : AC.destination); s.start(); V52LC.noise = {s, f, g};
  } catch(e){}
}
function v52lcChop(){ try { if(typeof V39S !== 'undefined' && V39S.vol && V39S.vol.sfx <= 0) return; ensureAC(); const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(300, t + .06);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .09); o.connect(g); g.connect(typeof v39Bus === 'function' ? v39Bus() : AC.destination); o.start(t); o.stop(t + .1); } catch(e){} }

// ---------- hạt (có giới hạn) ----------
function v52lcPart(x, y, kind){
  if(V52LC.P.length > 140) V52LC.P.shift(); const a = Math.random()*6.28, sp = kind === 'star' ? 80 + Math.random()*160 : kind === 'steam' ? 20 : 30 + Math.random()*40;
  V52LC.P.push({x, y, vx:Math.cos(a)*sp*(kind === 'steam' ? .3 : 1), vy:kind === 'steam' ? -40 - Math.random()*30 : kind === 'bubble' ? -20 - Math.random()*30 : Math.sin(a)*sp, life:kind === 'star' ? 1.1 : .9, max:kind === 'star' ? 1.1 : .9, kind, s:kind === 'steam' ? 6 + Math.random()*8 : 3 + Math.random()*4});
}

// ---------- vòng vẽ ----------
function v52lcFrame(now){
  if(!V52LC.open) return; V52LC.raf = requestAnimationFrame(v52lcFrame); const dt = Math.min(.05, (now - V52LC.last)/1000); V52LC.last = now; V52LC.t += dt;
  V52LC.fpsN++; if(now - V52LC.fpsT > 1000){ V52LC.fps = V52LC.fpsN*1000/(now - V52LC.fpsT); V52LC.fpsN = 0; V52LC.fpsT = now; }
  if(V52LC.hintT > 0){ V52LC.hintT -= dt; if(V52LC.hintT <= 0) V52LC.el.querySelector('.v52lc-hint').classList.add('off'); }
  const g = V52LC.g, L = V52LC.L; g.setTransform(V52LC.dpr, 0, 0, V52LC.dpr, 0, 0); g.imageSmoothingEnabled = false;
  g.drawImage(v52lcBg(), 0, 0, V52LC.W, V52LC.H);
  try { if(!V52LC.done) v52lcUpdate(dt); v52lcDraw(g, L, dt); } catch(e){ console.warn('v52lc', e); }
  // hạt
  for(let q = V52LC.P.length - 1; q >= 0; q--){ const p = V52LC.P[q]; p.life -= dt; if(p.life <= 0){ V52LC.P.splice(q, 1); continue; } p.x += p.vx*dt; p.y += p.vy*dt; if(p.kind === 'star') p.vy += 160*dt;
    const k = p.life/p.max; g.globalAlpha = Math.min(1, k*1.4);
    if(p.kind === 'steam'){ g.fillStyle = '#ffffff'; g.beginPath(); g.arc(p.x, p.y, p.s*(1.6 - k), 0, 7); g.fill(); }
    else if(p.kind === 'bubble'){ g.strokeStyle = '#e3f6ff'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.stroke(); }
    else { g.fillStyle = ['#ffd23f', '#ff8fc4', '#7fe3ff', '#9be38a'][q % 4]; g.fillRect(p.x - 2, p.y - 2, 5, 5); } }
  g.globalAlpha = 1;
}
// nền bếp vẽ một lần (cache): tường gạch men + mặt bàn gỗ, căn tin thì men xanh thép
function v52lcBg(){
  const key = V52LC.W + 'x' + V52LC.H + V52LC.where; if(V52LC.bg && V52LC.bgKey === key) return V52LC.bg; const W = V52LC.W, H = V52LC.H, L = V52LC.L || v52lcLayout();
  const c = V52LC.bg || document.createElement('canvas'); c.width = Math.round(W*V52LC.dpr); c.height = Math.round(H*V52LC.dpr); const g = c.getContext('2d'); g.setTransform(V52LC.dpr, 0, 0, V52LC.dpr, 0, 0);
  const cant = V52LC.where === 'canteen', t1 = cant ? '#cfe3ef' : '#f6e6c8', t2 = cant ? '#b9d2e2' : '#ecd5ae', T = 28;
  g.fillStyle = t1; g.fillRect(0, 0, W, H); for(let y = 0; y < H; y += T) for(let x = (y/T % 2)*T/2 - T; x < W; x += T){ g.fillStyle = (x/T + y/T) % 2 < 1 ? t1 : t2; g.fillRect(x + 1, y + 1, T - 2, T - 2); }
  const cy = L.top + L.wh*.3; g.fillStyle = cant ? '#8aa1b1' : '#8a5a33'; g.fillRect(0, cy, W, H - cy); g.fillStyle = cant ? '#9fb6c6' : '#a06b40'; for(let x = 0; x < W; x += 54) g.fillRect(x, cy + 4, 50, H - cy);
  g.fillStyle = cant ? '#6e8696' : '#6e4426'; g.fillRect(0, cy, W, 6); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, L.ty, W, L.th); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, L.ty, W, 2);
  // kệ treo + cửa sổ nhỏ (tỷ lệ vàng)
  const ww = Math.min(180, W*.28), wh = ww/V52L_PHI; g.fillStyle = '#5b3a22'; g.fillRect(16, L.top + 10, ww + 8, wh + 8); g.fillStyle = cant ? '#bfe8ff' : '#9fd8ff'; g.fillRect(20, L.top + 14, ww, wh); g.fillStyle = '#ffffff'; g.fillRect(20 + ww/2 - 1, L.top + 14, 3, wh); g.fillRect(20, L.top + 14 + wh/2 - 1, ww, 3);
  V52LC.bg = c; V52LC.bgKey = key; return c;
}
function v52lcUpdate(dt){
  const st = V52LC.step; if(!st) return; const L = V52LC.L;
  if(st.k === 'cook'){
    if(st.mix){ if(st.prog >= 1) return; }
    else { const up = st.hold || (V52LC.ptr && V52LC.ptr.down) || V52LC.space; st.heat = Math.max(0, Math.min(1, st.heat + (up ? .45 : -.35)*dt)); V52LC.sc.cookT += dt;
      const inZ = st.heat >= st.lo && st.heat <= st.hi, over = st.heat > st.hi; st.prog = Math.min(1, st.prog + dt/7*(inZ ? 1 : over ? .5 : .25)); if(over){ V52LC.sc.burn += dt*(st.heat > st.hi + .1 ? 1.5 : .6); if(Math.random() < dt*8) v52lcPart(L.cx + (Math.random() - .5)*L.S, L.cy - L.S*.3, 'steam'); if(!st.warn && st.heat > st.hi + .08){ st.warn = 1; v52lcHint('🔥 Nóng quá! Thả tay ra cho lửa nhỏ lại'); } } else st.warn = 0;
      if(V52LC.noise) V52LC.noise.g.gain.setTargetAtTime(.012 + st.heat*.05, AC.currentTime, .1);
      if(Math.random() < dt*(2 + st.heat*6)) v52lcPart(L.cx + (Math.random() - .5)*L.S*.8, L.cy - L.S*.25, st.heat > .4 ? 'steam' : 'bubble'); }
    if(st.prog >= 1 && !st.fin){ st.fin = 1; v52lSnd('ok'); for(let q = 0; q < 14; q++) v52lcPart(L.cx, L.cy - L.S*.2, 'steam'); v52lcHint('✨ Chín rồi! Thơm quá!'); v52lcNext(); }
  }
}
function v52lcDraw(g, L, dt){
  const st = V52LC.step, r = V52LC.r, t = V52LC.t; if(!st) return; const S = L.S;
  const spr = (k, x, y, s, rot) => { const c = v52lIngSpr(k); g.save(); g.translate(x, y); if(rot) g.rotate(rot); g.drawImage(c, -s/2, -s/2, s, s); g.restore(); };
  const shadow = (x, y, w) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, w, w*.22, 0, 0, 7); g.fill(); };
  const label = (s, x, y, col) => { g.font = V52L_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(s).width + 16; g.fillStyle = 'rgba(11,16,32,.72)'; g.fillRect(x - w/2, y - 13, w, 26); g.fillStyle = col || '#fff6dc'; g.fillText(s, x, y); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; };
  if(st.k === 'pick'){
    // rổ ở giữa + các ô công thức phía trên rổ
    shadow(L.cx, L.cy + S*.55, S*.9); g.fillStyle = '#8d5a33'; g.beginPath(); g.ellipse(L.cx, L.cy + S*.2, S*.9, S*.38, 0, 0, Math.PI); g.fill(); g.fillStyle = '#b07a46'; g.fillRect(L.cx - S*.9, L.cy - S*.05, S*1.8, S*.26);
    for(let q = 0; q < 6; q++){ g.fillStyle = '#7a4b28'; g.fillRect(L.cx - S*.85 + q*S*.32, L.cy - S*.05, 4, S*.4); }
    const n = r.ing.length, sw = Math.min(S*.5, (V52LC.W - 40)/n - 10); r.ing.forEach((k, q) => { const x = L.cx + (q - (n - 1)/2)*(sw + 10), y = L.cy - S*.62, got = st.tiles.find(T => T.id === k).got;
      g.fillStyle = got ? 'rgba(47,191,113,.35)' : 'rgba(11,16,32,.35)'; g.fillRect(x - sw/2, y - sw/2, sw, sw); g.globalAlpha = got ? 1 : .35; spr(k, x, y, sw*.8); g.globalAlpha = 1; if(got){ g.fillStyle = '#2fbf71'; g.fillRect(x + sw/2 - 14, y - sw/2, 14, 14); g.fillStyle = '#fff'; g.font = V52L_FONT; g.fillText('✓', x + sw/2 - 13, y - sw/2 + 13); } });
    st.fly.forEach(f => { f.k = Math.min(1, f.k + dt*2.6); const e = 1 - Math.pow(1 - f.k, 3); spr(f.id, f.x + (L.cx - f.x)*e, f.y + (L.cy - f.y)*e - Math.sin(e*Math.PI)*S*.6, S*.42*(1 - e*.3)); });
    st.fly = st.fly.filter(f => f.k < 1); st.got = st.tiles.filter(T => T.got).length; st.got && st.tiles.filter(T => T.got).forEach((T, q) => spr(T.id, L.cx - S*.45 + q*S*.3, L.cy + S*.02 - (q % 2)*6, S*.36));
    v52lcTiles(st).forEach(T => { T.shake = Math.max(0, T.shake - dt); const dx = T.shake ? Math.sin(t*60)*6 : 0; g.fillStyle = T.got ? 'rgba(255,255,255,.12)' : '#fff8e7'; g.fillRect(T.x - T.s/2 + dx, T.y - T.s/2, T.s, T.s); g.strokeStyle = '#3b2a1f'; g.lineWidth = 2; g.strokeRect(T.x - T.s/2 + dx, T.y - T.s/2, T.s, T.s);
      if(!T.got) spr(T.id, T.x + dx, T.y - 6, T.s*.62); g.font = "700 16px Nunito, sans-serif"; g.textAlign = 'center'; g.fillStyle = T.got ? 'rgba(255,255,255,.4)' : '#2b1d14'; const nm = V52L_ING[T.id][0].replace(/^Ổ /, '').replace('Nước cốt', 'Cốt'), tw = g.measureText(nm).width, k = Math.min(1, (T.s - 6)/tw);
      g.save(); g.translate(T.x + dx, T.y + T.s/2 - 6); g.scale(k, 1); g.fillText(nm, 0, 0); g.restore(); g.textAlign = 'left'; });
  }
  if(st.k === 'wash'){
    const k = st.it[st.j], x = L.cx, y = L.cy; g.fillStyle = '#9aa5b1'; g.fillRect(x - S*1.05, y - S*.2, S*2.1, S*.9); g.fillStyle = '#cfe7f5'; g.fillRect(x - S*.98, y - S*.12, S*1.96, S*.74); g.fillStyle = '#bcd9ea'; g.fillRect(x - S*.98, y + S*.3, S*1.96, S*.32);
    g.fillStyle = '#8a96a3'; g.fillRect(x - 8, L.top + 8, 16, S*.32); g.fillRect(x - 8, L.top + 8, S*.5, 14); g.fillStyle = 'rgba(160,220,255,.75)'; const sh = (y - S*.2) - (L.top + 8 + S*.32); g.fillRect(x - 5 + Math.sin(t*30), L.top + 8 + S*.32, 10, sh + S*.3);
    spr(k, x, y + S*.1, S*.95); st.dirt.forEach(D => { if(D.a <= .02) return; g.globalAlpha = D.a; g.fillStyle = '#6d4c2e'; g.beginPath(); g.arc(x + D.x*S*.45, y + S*.1 + D.y*S*.45, D.r*S*.45, 0, 7); g.fill(); }); g.globalAlpha = 1;
    label(`🚿 ${V52L_ING[k][0]} · ${st.j + 1}/${st.it.length}`, x, y + S*.85);
  }
  if(st.k === 'cut'){
    const k = st.it[st.j], x = L.cx, y = L.cy, bw = Math.min(V52LC.W*.86, S*2.6), bh = bw/V52L_PHI/V52L_PHI*1.4; g.fillStyle = '#5d3a1f'; g.fillRect(x - bw/2 - 4, y - bh/2 - 4, bw + 8, bh + 8); g.fillStyle = '#d8a86a'; g.fillRect(x - bw/2, y - bh/2, bw, bh); g.fillStyle = '#c9965a'; for(let q = 0; q < 5; q++) g.fillRect(x - bw/2, y - bh/2 + q*bh/5 + 6, bw, 2);
    const iw = bw*.78, ih = bh*.62, n = st.g.length; st.g.forEach((G2, q) => { const gx = x + G2.u*iw*.83; if(!G2.cut){ g.strokeStyle = 'rgba(255,255,255,.9)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(gx, y - ih*.7); g.lineTo(gx, y + ih*.7); g.stroke(); g.setLineDash([]); } });
    // các miếng đã thái tách nhẹ ra
    const c = v52lIngSpr(k), cuts = st.g.filter(G2 => G2.cut).map(G2 => G2.cx).sort((a, b) => a - b), edges = [x - iw/2].concat(cuts, [x + iw/2]);
    for(let q = 0; q < edges.length - 1; q++){ const a = edges[q], b = edges[q + 1], off = (q - (edges.length - 2)/2)*5; g.save(); g.beginPath(); g.rect(a + off, y - ih, b - a, ih*2); g.clip(); g.drawImage(c, x - iw/2 + off, y - ih/2, iw, ih); g.restore(); }
    const P = V52LC.ptr; if(P && P.down){ g.save(); g.translate(P.x, P.y); g.fillStyle = '#5d3a1f'; g.fillRect(-5, -54, 10, 22); g.fillStyle = '#dfe6ee'; g.fillRect(-7, -32, 14, 44); g.fillStyle = '#ffffff'; g.fillRect(-7, -32, 3, 44); g.restore(); if(st.stroke){ g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); st.stroke.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } }
    label(`🔪 ${V52L_ING[k][0]} · ${st.g.filter(G2 => G2.cut).length}/${n} nhát`, x, y + bh/2 + 26);
  }
  if(st.k === 'cook'){
    const x = L.cx, y = L.cy, typ = r.cook; shadow(x, y + S*.5, S);
    if(!st.mix){ // bếp + lửa
      g.fillStyle = '#2b2f36'; g.fillRect(x - S*.95, y + S*.32, S*1.9, S*.26); g.fillStyle = '#3d434c'; g.fillRect(x - S*.95, y + S*.32, S*1.9, 6);
      const fh = 6 + st.heat*S*.32; for(let q = 0; q < 7; q++){ const fx = x - S*.6 + q*S*.2, f2 = fh*(.7 + .3*Math.sin(t*14 + q*1.7)); g.fillStyle = '#ff8a2b'; g.beginPath(); g.moveTo(fx - 9, y + S*.33); g.quadraticCurveTo(fx, y + S*.33 - f2*1.4, fx + 9, y + S*.33); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(fx - 5, y + S*.33); g.quadraticCurveTo(fx, y + S*.33 - f2*.8, fx + 5, y + S*.33); g.fill(); }
    }
    if(typ === 'boil' || typ === 'mix'){ g.fillStyle = '#2b1d14'; g.fillRect(x - S*.72, y - S*.42, S*1.44, S*.78); g.fillStyle = typ === 'mix' ? '#f5f5f5' : '#9aa5b1'; g.fillRect(x - S*.68, y - S*.38, S*1.36, S*.7); g.fillStyle = typ === 'mix' ? r.c[0] : '#cfe7f5'; g.fillRect(x - S*.64, y - S*.36, S*1.28, S*.16); if(typ !== 'mix'){ g.fillStyle = '#7b8794'; g.fillRect(x - S*.86, y - S*.3, S*.16, 10); g.fillRect(x + S*.7, y - S*.3, S*.16, 10); } }
    else if(typ === 'fry'){ g.fillStyle = '#2b1d14'; g.beginPath(); g.ellipse(x, y, S*.78, S*.3, 0, 0, 7); g.fill(); g.fillStyle = '#4a4f57'; g.beginPath(); g.ellipse(x, y - 4, S*.72, S*.25, 0, 0, 7); g.fill(); g.fillStyle = '#2b1d14'; g.fillRect(x + S*.7, y - 8, S*.6, 14); }
    else if(typ === 'grill'){ g.fillStyle = '#2b1d14'; g.fillRect(x - S*.8, y - S*.12, S*1.6, S*.36); for(let q = 0; q < 8; q++){ g.fillStyle = '#9aa5b1'; g.fillRect(x - S*.76 + q*S*.2, y - S*.12, 5, S*.36); } }
    else { g.fillStyle = '#2b1d14'; g.fillRect(x - S*.85, y - S*.62, S*1.7, S*1.0); g.fillStyle = '#c0533a'; g.fillRect(x - S*.8, y - S*.58, S*1.6, S*.92); g.fillStyle = `rgba(255,${160 - st.heat*90 | 0},40,${.4 + st.heat*.5})`; g.fillRect(x - S*.6, y - S*.42, S*1.2, S*.6); g.fillStyle = '#ffd23f'; for(let q = 0; q < 4; q++) g.fillRect(x - S*.55 + q*S*.32, y + S*.22, 10, 6); }
    // nguyên liệu trong nồi/chảo dập dềnh, chuyển màu khi chín
    r.ing.forEach((k, q) => { const a = q*2.4 + t*(st.mix ? 2.2 : .8), rr = S*.32; g.globalAlpha = 1 - st.prog*.25; spr(k, x + Math.cos(a)*rr, y - S*.22 + Math.sin(a)*rr*.25 + Math.sin(t*5 + q)*3, S*.34, Math.sin(t*3 + q)*.3); });
    g.globalAlpha = 1; if(st.mix){ const P = V52LC.ptr, sx = P && P.down ? P.x : x + Math.cos(t*2)*S*.3, sy = P && P.down ? P.y : y - S*.2 + Math.sin(t*2)*S*.1; g.fillStyle = '#8d5a33'; g.save(); g.translate(sx, sy); g.rotate(-.5); g.fillRect(-4, -S*.6, 8, S*.6); g.beginPath(); g.ellipse(0, 0, 12, 8, 0, 0, 7); g.fill(); g.restore(); }
    // thước nhiệt bên phải (vùng xanh) + thanh chín
    if(!st.mix){ const gx = V52LC.W - Math.max(40, V52LC.W*.06) - 18, gh = L.wh*.62, gy = L.top + L.wh*.19; g.fillStyle = 'rgba(11,16,32,.75)'; g.fillRect(gx - 4, gy - 4, 36, gh + 8); g.fillStyle = '#ef4b4b'; g.fillRect(gx, gy, 28, gh*(1 - st.hi)); g.fillStyle = '#2fbf71'; g.fillRect(gx, gy + gh*(1 - st.hi), 28, gh*(st.hi - st.lo)); g.fillStyle = '#3d7bff'; g.fillRect(gx, gy + gh*(1 - st.lo), 28, gh*st.lo);
      const hy = gy + gh*(1 - st.heat); g.fillStyle = '#ffffff'; g.fillRect(gx - 10, hy - 3, 48, 6); g.fillStyle = '#0b1020'; g.fillRect(gx - 10, hy - 1, 48, 2); g.font = V52L_FONT; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('🔥', gx + 14, gy - 12); g.textAlign = 'left'; }
    const bw = Math.min(S*1.6, V52LC.W*.6), by = L.top + 16; g.fillStyle = 'rgba(11,16,32,.75)'; g.fillRect(L.cx - bw/2 - 4, by - 4, bw + 8, 22); g.fillStyle = '#ffd23f'; g.fillRect(L.cx - bw/2, by, bw*st.prog, 14); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(L.cx - bw/2, by, bw, 14);
    label(st.mix ? '🥣 Khuấy vòng tròn' : (V52LC_HEAT[typ][2] + ' · ' + (st.heat < st.lo ? 'lửa nhỏ' : st.heat > st.hi ? 'nóng quá!' : 'vừa lửa ✓')), L.cx, by + 40, st.heat > st.hi ? '#ffb4a8' : '#fff6dc');
    if(!st.mix){ const bt = v52lcFireBtn(); g.fillStyle = st.hold || (V52LC.ptr && V52LC.ptr.down) ? '#ff8a2b' : '#ef4b4b'; g.fillRect(bt.x, bt.y, bt.w, bt.h); g.strokeStyle = '#2b1d14'; g.lineWidth = 3; g.strokeRect(bt.x, bt.y, bt.w, bt.h); g.font = "800 18px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('🔥 Giữ để tăng lửa', bt.x + bt.w/2, bt.y + bt.h/2); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
  }
  if(st.k === 'plate'){
    const x = L.cx, y = L.cy, R0 = S*1.1; shadow(x, y + R0*.62, R0); g.fillStyle = '#2b1d14'; g.beginPath(); g.ellipse(x, y, R0 + 4, R0*.62 + 4, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y, R0, R0*.62, 0, 0, 7); g.fill(); g.fillStyle = '#e6eaf2'; g.beginPath(); g.ellipse(x, y, R0*.72, R0*.45, 0, 0, 7); g.fill();
    const d = v52lDishSpr(r); g.drawImage(d, x - S*.7, y - S*.62, S*1.4, S*1.16);
    st.spots.forEach(p => { const sx = x + p.x, sy = y + p.y; if(p.id){ spr(p.id, sx, sy, S*.34); } else { g.strokeStyle = `rgba(255,210,63,${.55 + .45*Math.sin(t*5)})`; g.lineWidth = 3; g.beginPath(); g.arc(sx, sy, S*.17, 0, 7); g.stroke(); } });
    v52lcPieces(st).forEach(Pc => { if(Pc.used || (st.drag && st.drag.pc === Pc)) return; g.fillStyle = '#fff8e7'; g.fillRect(Pc.x - Pc.s/2, Pc.y - Pc.s/2, Pc.s, Pc.s); g.strokeStyle = '#3b2a1f'; g.lineWidth = 2; g.strokeRect(Pc.x - Pc.s/2, Pc.y - Pc.s/2, Pc.s, Pc.s); spr(Pc.id, Pc.x, Pc.y, Pc.s*.7); });
    if(st.drag) spr(st.drag.pc.id, st.drag.x, st.drag.y, S*.4);
  }
}
// ô nguyên liệu ở khay dưới (bước chọn) và đồ trang trí (bước bày)
function v52lcTiles(st){ const L = V52LC.L, n = st.tiles.length, one = (V52LC.W - 16)/n - 8 >= 64, cols = one ? n : Math.ceil(n/2), rows = one ? 1 : 2, s = Math.min(88, (V52LC.W - 16)/cols - 8, (L.th - 12)/rows - 6);
  st.tiles.forEach((T, q) => { const r = Math.floor(q/cols), c = q % cols, inRow = r < rows - 1 ? cols : n - cols*(rows - 1); T.s = s; T.x = V52LC.W/2 + (c - (inRow - 1)/2)*(s + 8); T.y = L.ty + L.th/2 + (r - (rows - 1)/2)*(s + 6); }); return st.tiles; }
function v52lcPieces(st){ const L = V52LC.L, n = st.pieces.length, s = Math.min(84, L.th - 22); st.pieces.forEach((P, q) => { P.s = s; P.x = V52LC.W/2 + (q - (n - 1)/2)*(s + 14); P.y = L.ty + L.th/2; }); return st.pieces; }
function v52lcFireBtn(){ const L = V52LC.L, w = Math.min(320, V52LC.W*.7), h = Math.min(64, L.th - 24); return {x:V52LC.W/2 - w/2, y:L.ty + (L.th - h)/2, w, h}; }

// ---------- cảm ứng / chuột (pointer) + phím trên máy tính ----------
function v52lcInput(cv){
  const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.addEventListener('pointerdown', e => { if(!V52LC.open || V52LC.done) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(er){} const [x, y] = pos(e); V52LC.ptr = {id:e.pointerId, down:true, x, y, px:x, py:y}; v52lcDown(x, y); });
  cv.addEventListener('pointermove', e => { const P = V52LC.ptr; if(!P || P.id !== e.pointerId || !V52LC.open) return; const [x, y] = pos(e); P.px = P.x; P.py = P.y; P.x = x; P.y = y; if(P.down) v52lcMove(P); });
  const up = e => { const P = V52LC.ptr; if(!P || P.id !== e.pointerId) return; P.down = false; if(V52LC.open && !V52LC.done) v52lcUp(P); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  addEventListener('keydown', e => { if(!V52LC.open) return; if(e.key === 'Escape'){ v52lcClose(); e.preventDefault(); return; } if(e.code === 'Space'){ V52LC.space = true; e.preventDefault(); } e.stopPropagation(); }, true);
  addEventListener('keyup', e => { if(!V52LC.open) return; if(e.code === 'Space') V52LC.space = false; e.stopPropagation(); }, true);
  addEventListener('resize', v52lcResize);
}
function v52lcDown(x, y){
  const st = V52LC.step; if(!st) return; const L = V52LC.L;
  if(st.k === 'pick'){ const T = v52lcTiles(st).find(T => !T.got && Math.abs(x - T.x) < T.s/2 && Math.abs(y - T.y) < T.s/2); if(!T) return;
    if(T.need){ T.got = true; st.fly.push({id:T.id, x:T.x, y:T.y, k:0}); v52lSnd('tap'); if(st.tiles.filter(q => q.need && !q.got).length === 0){ v52lSnd('ok'); v52lcHint('👍 Đủ nguyên liệu rồi!'); v52lcNext(); } }
    else { T.shake = .4; V52LC.sc.miss++; v52lcHint(`🙂 Món ${V52LC.r.vi} không cần ${V52L_ING[T.id][0]}`); } }
  if(st.k === 'cut') st.stroke = {pts:[[x, y]], y0:y, y1:y, xs:[x]};
  if(st.k === 'cook'){ if(st.mix) st.ang = Math.atan2(y - L.cy, x - L.cx); else st.hold = true; }
  if(st.k === 'plate'){ const Pc = v52lcPieces(st).find(P => !P.used && Math.abs(x - P.x) < P.s/2 && Math.abs(y - P.y) < P.s/2); if(Pc){ st.drag = {pc:Pc, x, y}; v52lSnd('tap'); }
    else if(st.sel){ v52lcDrop(st, st.sel, x, y); st.sel = null; } }
}
function v52lcMove(P){
  const st = V52LC.step; if(!st) return; const L = V52LC.L, S = L.S;
  if(st.k === 'wash'){ const dd = Math.hypot(P.x - P.px, P.y - P.py); if(dd < 1) return; let clean = true;
    st.dirt.forEach(D => { const dx = L.cx + D.x*S*.45 - P.x, dy = L.cy + S*.1 + D.y*S*.45 - P.y; if(Math.hypot(dx, dy) < D.r*S*.45 + 26) D.a = Math.max(0, D.a - dd/140); if(D.a > .05) clean = false; });
    if(Math.random() < .5) v52lcPart(P.x, P.y, 'bubble');
    if(clean && !st.wait){ st.wait = 1; v52lSnd('ok'); for(let q = 0; q < 10; q++) v52lcPart(L.cx, L.cy, 'star'); setTimeout(() => { if(!V52LC.open || V52LC.step !== st) return; st.wait = 0; if(++st.j >= st.it.length) v52lcGo(V52LC.si + 1); else { st.dirt = v52lcDirt(); } }, 450); } }
  if(st.k === 'cut' && st.stroke){ const s = st.stroke; s.pts.push([P.x, P.y]); s.xs.push(P.x); s.y0 = Math.min(s.y0, P.y); s.y1 = Math.max(s.y1, P.y); if(s.pts.length > 40) s.pts.shift(); }
  if(st.k === 'cook' && st.mix && st.ang != null){ const a = Math.atan2(P.y - L.cy, P.x - L.cx); let d = a - st.ang; if(d > Math.PI) d -= 2*Math.PI; if(d < -Math.PI) d += 2*Math.PI; st.ang = a; if(Math.hypot(P.x - L.cx, P.y - L.cy) > 20) st.prog = Math.min(1, st.prog + Math.abs(d)/(2*Math.PI*5)); if(Math.random() < .2) v52lcPart(P.x, P.y, 'bubble');
    if(st.prog >= 1 && !st.fin){ st.fin = 1; v52lSnd('ok'); v52lcHint('✨ Trộn đều rồi!'); for(let q = 0; q < 10; q++) v52lcPart(L.cx, L.cy, 'star'); v52lcNext(); } }
  if(st.k === 'plate' && st.drag){ st.drag.x = P.x; st.drag.y = P.y; }
}
function v52lcUp(P){
  const st = V52LC.step; if(!st) return; const L = V52LC.L, S = L.S;
  if(st.k === 'cook'){ st.hold = false; st.ang = null; }
  if(st.k === 'cut' && st.stroke){ const s = st.stroke, bw = Math.min(V52LC.W*.86, S*2.6), bh = bw/V52L_PHI/V52L_PHI*1.4, iw = bw*.78, ih = bh*.62; st.stroke = null;
    if(s.y1 - s.y0 < ih*.7 || s.y0 > L.cy || s.y1 < L.cy){ v52lcHint('🔪 Vuốt dài từ trên xuống qua cả miếng nhé'); return; }
    const cx = s.xs.reduce((a, b) => a + b, 0)/s.xs.length, free = st.g.filter(G2 => !G2.cut); if(!free.length) return;
    let best = free[0], bd = 1e9; free.forEach(G2 => { const d = Math.abs(L.cx + G2.u*iw*.83 - cx); if(d < bd){ bd = d; best = G2; } });
    const sp = iw*.83*1.2/st.g.length; best.cut = true; best.cx = Math.max(L.cx - iw/2 + 6, Math.min(L.cx + iw/2 - 6, cx)); best.err = bd/sp; V52LC.sc.cut.push(best.err); v52lcChop(); for(let q = 0; q < 4; q++) v52lcPart(best.cx, L.cy, 'bubble');
    if(best.err < .2) v52lcHint('👌 Đều tay!'); if(st.g.every(G2 => G2.cut)){ if(st.j + 1 >= st.it.length){ if(!st.fin){ st.fin = 1; v52lcNext(); } } else { st.j++; st.g = v52lcGuides(); } } }
  if(st.k === 'plate' && st.drag){ const d = st.drag; st.drag = null; if(Math.abs(P.x - d.pc.x) < d.pc.s/2 && Math.abs(P.y - d.pc.y) < d.pc.s/2){ st.sel = d.pc; v52lcHint('👉 Chạm vào vòng sáng để đặt'); return; } v52lcDrop(st, d.pc, P.x, P.y); }
}
function v52lcDrop(st, pc, x, y){
  const L = V52LC.L, S = L.S; let best = null, bd = 1e9; st.spots.forEach(p => { if(p.id) return; const d = Math.hypot(L.cx + p.x - x, L.cy + p.y - y); if(d < bd){ bd = d; best = p; } });
  if(!best || bd > S*.55){ v52lcHint('↩️ Thả gần vòng sáng hơn nhé'); return; }
  best.id = pc.id; pc.used = true; best.err = bd/(S*.17); V52LC.sc.plate.push(Math.max(0, best.err - .3)); v52lSnd('tap'); for(let q = 0; q < 5; q++) v52lcPart(L.cx + best.x, L.cy + best.y, 'star');
  if(st.spots.every(p => p.id)){ v52lcHint('🍽 Đẹp mắt quá!'); v52lcNext(); }
}
function v52lcInit(){ /* tạo khi cần: v52lcEl() dựng giao diện ở lần mở đầu tiên */ }
