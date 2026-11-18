// ================= v50 · HỌC VIỆN PHÉP THUẬT RUBIK (Rubik Spellcraft Academy): dữ liệu, lưu, thưởng, hiệu ứng phép =================
// Thiết kế gốc: tên nhà, đũa, áo choàng, lâu đài đều tự đặt / tự vẽ. Mọi tên toàn cục có tiền tố v50 / V50.
// Hình đũa: atlas CC0 "Simple Wands" (Jardson Jean, OpenGameArt) – xem assets/CREDITS.txt. Hạt/phép vẽ bằng code, có pool.
const V50_PHI = 1.618;
const V50_FONT = "800 16px Nunito, 'Be Vietnam Pro', sans-serif";
// 6 nhà theo 6 màu Rubik (tên gốc). sym = hình huy hiệu vẽ bằng code
const V50_HOUSES = [
  {id:'ember', vi:'Nhà Lửa Hồng', en:'Ember House', c:'#ef4b4b', c2:'#7a1f1f', sym:'flame', virtue:'Dũng cảm 🔥'},
  {id:'comb', vi:'Nhà Tổ Ong', en:'Honeycomb House', c:'#ffd23f', c2:'#8a6a10', sym:'hex', virtue:'Chăm chỉ 🐝'},
  {id:'wave', vi:'Nhà Sóng Biếc', en:'Wave House', c:'#3d7bff', c2:'#1a2f7a', sym:'wave', virtue:'Ham học 📘'},
  {id:'leaf', vi:'Nhà Lá Ngọc', en:'Jade Leaf House', c:'#2fbf71', c2:'#145a34', sym:'leaf', virtue:'Kiên nhẫn 🌱'},
  {id:'plume', vi:'Nhà Lông Vũ', en:'Feather House', c:'#f4f4f4', c2:'#6b7080', sym:'feather', virtue:'Tử tế 🤍'},
  {id:'star', vi:'Nhà Sao Cam', en:'Amber Star House', c:'#ff8a2b', c2:'#7a3a08', sym:'star', virtue:'Sáng tạo ✨'}
];
// 12 đũa: ô thứ i trong assets/magic/wands-cc0.png (48×48). fx = kiểu phép
const V50_WANDS = [
  {vi:'Đũa Sao Gỗ Sồi', en:'Oak Star', fx:'spark', c:'#ffd23f', c2:'#fff3b0', lvl:1, $:0, pw:'Tia sao vàng lấp lánh'},
  {vi:'Đũa Than Hồng', en:'Ember Orb', fx:'fire', c:'#ff7a1a', c2:'#ffd27a', lvl:2, $:60, pw:'Đốm lửa cam ấm áp (thắp đèn)'},
  {vi:'Đũa Băng Tuyết', en:'Frost Star', fx:'ice', c:'#7fe3ff', c2:'#e8fbff', lvl:3, $:90, pw:'Mảnh băng xanh và vòng sương'},
  {vi:'Đũa Lá Ngọc', en:'Jade Heart', fx:'leaf', c:'#3fd36a', c2:'#c8ffb0', lvl:4, $:120, pw:'Lốc lá xanh làm hoa nở'},
  {vi:'Đũa Sấm Tím', en:'Storm Eye', fx:'thunder', c:'#b26bff', c2:'#f0d8ff', lvl:5, $:160, pw:'Tia sét tím ngoằn ngoèo'},
  {vi:'Đũa Ánh Dương', en:'Sunlight Orb', fx:'sun', c:'#ffe066', c2:'#ffffff', lvl:6, $:200, pw:'Chùm sáng vàng xua bóng tối'},
  {vi:'Đũa Thủy Triều', en:'Tide Orb', fx:'tide', c:'#3da5ff', c2:'#c9ecff', lvl:7, $:240, pw:'Bong bóng nước xanh biển'},
  {vi:'Đũa Hoa Hồng', en:'Blossom Heart', fx:'petal', c:'#ff8fc4', c2:'#ffe0ef', lvl:8, $:300, pw:'Mưa cánh hoa hồng'},
  {vi:'Đũa Trái Tim', en:'Kindness Heart', fx:'heart', c:'#ff4d6d', c2:'#ffc2cf', lvl:9, $:360, pw:'Trái tim tử tế bay lên'},
  {vi:'Đũa Ánh Trăng', en:'Moonbeam', fx:'moon', c:'#e9ecff', c2:'#9fb2ff', lvl:10, $:420, pw:'Trăng khuyết bạc xoay vòng'},
  {vi:'Đũa Thiên Hà', en:'Galaxy Eye', fx:'galaxy', c:'#e45bd8', c2:'#7a6bff', lvl:12, $:500, pw:'Xoáy thiên hà đầy sao'},
  {vi:'Đũa Cầu Vồng Rubik', en:'Rubik Rainbow', fx:'rainbow', c:'#ffffff', c2:'#ffd23f', lvl:15, $:800, pw:'Dải cầu vồng 6 màu Rubik'}
];
const V50_ROBE_COLS = [['#7a1f2b', 'Đỏ rượu'], ['#1d2a5c', 'Xanh nửa đêm'], ['#2b2b33', 'Than đá'], ['#4a2a6a', 'Tím mận'], ['#1f4a33', 'Xanh rừng'], ['#2f5f8a', 'Xanh trời đêm'],
  ['#ef4b4b', 'Đỏ Rubik'], ['#d9a400', 'Vàng Rubik'], ['#3d7bff', 'Lam Rubik'], ['#2fbf71', 'Lục Rubik'], ['#e9e9ee', 'Trắng Rubik'], ['#ff8a2b', 'Cam Rubik']];
const V50_ROBE_STY = [['classic', 'Cổ điển', '🧥'], ['hood', 'Mũ trùm', '🧙'], ['star', 'Viền sao', '⭐'], ['cape', 'Choàng ngắn', '🦸']];
const V50_RUBIK = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'];
const V50 = {open:false, S:null, img:null, q:1, glow:new Map(), shp:new Map(), lb:null};

// ---------- lưu ----------
function v50Def(){ return {house:-1, robe:{c:1, s:0}, own:[0], wand:0, wear:true, best:{}, day:{d:'', n:{}}}; }
function v50State(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v50) PROF.v50 = Object.assign(v50Def(), v50Guest()); const s = PROF.v50; if(!s.own || !s.own.length) s.own = [0]; if(!s.day) s.day = {d:'', n:{}}; if(!s.best) s.best = {}; return s; }
  return v50Guest();
}
function v50Guest(){ if(V50.G) return V50.G; let g = null; try { g = JSON.parse(localStorage.getItem('truong-v50-guest') || 'null'); } catch(e){} V50.G = Object.assign(v50Def(), g || {}); return V50.G; }
function v50Save(){ try { if(typeof PROF !== 'undefined' && PROF){ saveProfile(); } else localStorage.setItem('truong-v50-guest', JSON.stringify(v50Guest())); } catch(e){} }
function v50House(){ const s = v50State(); return s.house >= 0 ? V50_HOUSES[s.house] : null; }
function v50Wand(){ const s = v50State(); return V50_WANDS[s.wand] || V50_WANDS[0]; }
function v50Today(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

// ---------- thưởng: $1–$20 mỗi lượt, từ lượt 11 trong ngày chỉ còn một nửa ----------
function v50Reward(id, perf, name){
  perf = Math.max(0, Math.min(1, perf || 0)); const s = v50State(), t = v50Today(); if(s.day.d !== t) s.day = {d:t, n:{}}; s.day.n[id] = (s.day.n[id] || 0) + 1;
  let money = Math.max(1, Math.min(20, Math.round(1 + perf*19))), exp = Math.round(8 + perf*32); if(s.day.n[id] > 10){ money = Math.max(1, Math.round(money/2)); exp = Math.round(exp/2); }
  try { if(typeof PROF !== 'undefined' && PROF) reward(exp, money, name || 'Học viện Phép thuật', true); else if(typeof loginNudge === 'function') loginNudge(); } catch(e){}
  v50Save(); return {money, exp};
}
// ---------- bảng xếp hạng (máy này) ----------
function v50LB(){ if(V50.lb) return V50.lb; try { V50.lb = JSON.parse(localStorage.getItem('truong-v50-lb') || '{}') || {}; } catch(e){ V50.lb = {}; } return V50.lb; }
function v50LBAdd(id, score){
  const L = v50LB(), n = (typeof PROF !== 'undefined' && PROF && PROF.name) || 'Khách', a = L[id] = L[id] || [];
  a.push({n, s:Math.round(score), d:v50Today()}); a.sort((x, y) => y.s - x.s); a.length = Math.min(a.length, 5);
  try { localStorage.setItem('truong-v50-lb', JSON.stringify(L)); } catch(e){}
  const s = v50State(), best = s.best[id] || 0, rec = score > best; if(rec){ s.best[id] = Math.round(score); v50Save(); } return {rec, best:Math.max(best, Math.round(score)), top:a};
}

// ---------- âm thanh (WebAudio, không file) ----------
function v50Snd(k){
  try { if(typeof V39S !== 'undefined' && V39S.vol.sfx <= 0) return; ensureAC(); const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    const N = {cast:[880, 1320, .12, 'triangle'], hit:[520, 260, .18, 'sine'], ok:[660, 990, .25, 'sine'], bad:[300, 220, .2, 'sine'], pop:[1200, 600, .08, 'sine'], buy:[784, 1568, .3, 'triangle'], whoosh:[220, 660, .25, 'sawtooth']}[k] || [700, 900, .1, 'sine'];
    const o = AC.createOscillator(), g = AC.createGain(); o.type = N[3]; o.frequency.setValueAtTime(N[0], t); o.frequency.exponentialRampToValueAtTime(N[1], t + N[2]);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(k === 'whoosh' ? .03 : .09, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + N[2] + .05); o.connect(g); g.connect(out); o.start(t); o.stop(t + N[2] + .08);
  } catch(e){}
}

// ---------- sprite cache: quầng sáng & hình hạt (tạo một lần) ----------
function v50Glow(col){
  let c = V50.glow.get(col); if(c) return c; c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); V50.glow.set(col, c); return c;
}
// hình hạt pixel 16×16: star, heart, petal, leaf, shard, moon, bubble, dot
function v50Shape(kind, col){
  const key = kind + col; let c = V50.shp.get(key); if(c) return c; c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.fillStyle = col;
  const P = (pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  if(kind === 'star'){ P([[8, 0], [10, 6], [16, 8], [10, 10], [8, 16], [6, 10], [0, 8], [6, 6]]); g.fillStyle = '#fff'; g.fillRect(7, 7, 2, 2); }
  else if(kind === 'heart'){ g.beginPath(); g.arc(5, 6, 4, 0, 7); g.arc(11, 6, 4, 0, 7); g.fill(); P([[1, 7], [15, 7], [8, 15]]); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(3, 4, 2, 2); }
  else if(kind === 'petal'){ g.beginPath(); g.ellipse(8, 8, 3.5, 7, .6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(7, 5, 2, 3); }
  else if(kind === 'leaf'){ g.beginPath(); g.ellipse(8, 8, 3, 7, -.7, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,60,0,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(3, 13); g.lineTo(13, 3); g.stroke(); }
  else if(kind === 'shard'){ P([[8, 0], [11, 8], [8, 16], [5, 8]]); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(7, 3, 2, 6); }
  else if(kind === 'moon'){ g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(11, 6, 6, 0, 7); g.fill(); }
  else if(kind === 'bubble'){ g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.arc(8, 8, 6, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(5, 4, 2, 2); }
  else { g.fillRect(6, 6, 4, 4); }
  V50.shp.set(key, c); return c;
}

// ---------- pool hạt (cố định, không tạo object trong vòng vẽ) ----------
const V50_PMAX = 320;
const V50P = {n:0, i:0, x:new Float32Array(V50_PMAX), y:new Float32Array(V50_PMAX), vx:new Float32Array(V50_PMAX), vy:new Float32Array(V50_PMAX), a:new Float32Array(V50_PMAX),
  l:new Float32Array(V50_PMAX), s:new Float32Array(V50_PMAX), gr:new Float32Array(V50_PMAX), im:new Array(V50_PMAX).fill(null), rot:new Float32Array(V50_PMAX), ad:new Uint8Array(V50_PMAX)};
function v50P(x, y, vx, vy, life, size, img, grav){
  if(V50.q < 1 && Math.random() < .45) return; const P = V50P, i = P.i; P.i = (i + 1) % V50_PMAX;
  P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.a[i] = 0; P.l[i] = life; P.s[i] = size; P.im[i] = img; P.gr[i] = grav || 0; P.rot[i] = Math.random()*6.28; P.ad[i] = img && img.width === 32 ? 1 : 0;
}
function v50PClear(){ V50P.l.fill(0); V50P.a.fill(0); }
function v50PDraw(g, dt){
  const P = V50P; let mode = 1; g.globalCompositeOperation = 'lighter';
  for(let i = 0; i < V50_PMAX; i++){ const L = P.l[i]; if(L <= 0) continue; P.a[i] += dt; const a = P.a[i]; if(a >= L){ P.l[i] = 0; continue; }
    if(P.ad[i] !== mode){ mode = P.ad[i]; g.globalCompositeOperation = mode ? 'lighter' : 'source-over'; }
    P.vy[i] += P.gr[i]*dt; P.vx[i] *= .985; P.vy[i] *= .985; P.x[i] += P.vx[i]*dt; P.y[i] += P.vy[i]*dt;
    const k = 1 - a/L, s = P.s[i]*(.5 + k*.5); g.globalAlpha = k > .8 ? 1 : k*1.25; const im = P.im[i];
    if(im) g.drawImage(im, P.x[i] - s, P.y[i] - s, s*2, s*2); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- phép thuật: đạn phép + vệt + lóe sáng + rung ----------
const V50_FXSH = {spark:'star', fire:'dot', ice:'shard', leaf:'leaf', thunder:'dot', sun:'star', tide:'bubble', petal:'petal', heart:'heart', moon:'moon', galaxy:'star', rainbow:'star'};
const V50B = [];   // đạn phép (tối đa 10, tái dùng)
const V50FX = {flash:0, fcol:'#fff', shake:0, bolts:[], rings:[], k:1};
function v50Col(w, i){ return w.fx === 'rainbow' ? V50_RUBIK[(i + Math.floor(performance.now()/90)) % 6] : (i % 3 === 0 ? w.c2 : w.c); }
function v50Cast(x, y, tx, ty, wi, onHit){
  const w = V50_WANDS[wi == null ? v50State().wand : wi] || V50_WANDS[0]; let b = V50B.find(o => !o.on); if(!b){ if(V50B.length >= 10) return null; b = {}; V50B.push(b); }
  const d = Math.hypot(tx - x, ty - y) || 1; Object.assign(b, {on:true, x, y, sx:x, sy:y, tx, ty, w, t:0, T:Math.min(.75, .18 + d/900), hit:onHit || null, k:0});
  for(let i = 0; i < 8; i++){ const a = Math.random()*6.28, s = 40 + Math.random()*60; v50P(x, y, Math.cos(a)*s, Math.sin(a)*s, .35, 6, v50Glow(v50Col(w, i))); }
  v50Snd(w.fx === 'thunder' ? 'whoosh' : 'cast'); return b;
}
function v50Burst(x, y, w, big){
  const sh = V50_FXSH[w.fx] || 'dot', n = Math.round((big ? 34 : 22)*V50.q);
  for(let i = 0; i < n; i++){ const a = i/n*6.28 + Math.random()*.3, s = (big ? 90 : 60) + Math.random()*120, col = v50Col(w, i);
    const img = sh === 'dot' ? v50Glow(col) : v50Shape(sh, col), gr = w.fx === 'fire' ? -60 : w.fx === 'ice' || w.fx === 'petal' || w.fx === 'leaf' ? 70 : w.fx === 'heart' || w.fx === 'tide' ? -50 : 0;
    v50P(x, y, Math.cos(a)*s*V50FX.k, Math.sin(a)*s*V50FX.k*(w.fx === 'moon' || w.fx === 'galaxy' ? .6 : 1), .6 + Math.random()*.6, (sh === 'dot' ? 11 : 8 + Math.random()*4)*V50FX.k, img, gr); }
  for(let i = 0; i < 6; i++) v50P(x, y, (Math.random() - .5)*30, (Math.random() - .5)*30, .3, 26*V50FX.k, v50Glow(w.c));
  V50FX.rings.push({x, y, t:0, c:w.fx === 'rainbow' ? null : w.c, c2:w.c2, big:!!big, fx:w.fx, k:V50FX.k, rot:Math.random()*6.28}); if(V50FX.rings.length > 6) V50FX.rings.shift();
  V50FX.flash = Math.max(V50FX.flash, big ? .35 : .22); V50FX.fcol = w.fx === 'rainbow' ? '#fff8e0' : w.c2; V50FX.shake = Math.max(V50FX.shake, big ? .22 : .14); v50Snd('hit');
}
// ---------- hiệu ứng Kenney Particle Pack (CC0): atlas 10 ô 64px, nhuộm màu & cache ----------
// 0 vòng phép · 1 lóe chữ thập · 2 vòng sóng · 3 sao lấp lánh · 4 nổ sáng · 5 tia sét · 6 xoáy · 7 trái tim · 8 vòng rune · 9 ngọn lửa
function v50KImg(){ if(!V50.kimg){ V50.kimg = new Image(); V50.kimg.src = 'assets/magic/fx-kenney-cc0.png'; } return V50.kimg; }
function v50KTex(i, col){ const im = v50KImg(); if(!im.complete || !im.naturalWidth) return null; const key = 'k' + i + col; let c = V50.shp.get(key); if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.drawImage(im, i*64, 0, 64, 64, 0, 0, 64, 64); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 64, 64);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45; g.drawImage(im, i*64, 0, 64, 64, 0, 0, 64, 64); V50.shp.set(key, c); return c; }
function v50KDraw(g, i, col, x, y, s, rot, a){ const t = v50KTex(i, col); if(!t) return false; g.globalAlpha = Math.max(0, Math.min(1, a)); if(rot){ g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(t, -s/2, -s/2, s, s); g.restore(); } else g.drawImage(t, x - s/2, y - s/2, s, s); g.globalAlpha = 1; return true; }
// tia sét: đường gấp khúc vẽ vài khung
function v50Bolt(x0, y0, x1, y1, col){ const pts = [x0, y0], n = 7; for(let i = 1; i < n; i++){ const u = i/n; pts.push(x0 + (x1 - x0)*u + (Math.random() - .5)*28, y0 + (y1 - y0)*u + (Math.random() - .5)*28); } pts.push(x1, y1); V50FX.bolts.push({pts, t:0, col}); if(V50FX.bolts.length > 4) V50FX.bolts.shift(); }
// cập nhật + vẽ đạn phép (trong toạ độ đang dùng của g)
function v50BDraw(g, dt){
  for(let j = 0; j < V50B.length; j++){ const b = V50B[j]; if(!b.on) continue; b.t += dt; const u = Math.min(1, b.t/b.T), e = 1 - (1 - u)*(1 - u), w = b.w;
    const wob = w.fx === 'leaf' || w.fx === 'galaxy' || w.fx === 'moon' ? Math.sin(u*12)*14*(1 - u) : 0, nx = -(b.ty - b.sy), ny = b.tx - b.sx, nl = Math.hypot(nx, ny) || 1;
    b.x = b.sx + (b.tx - b.sx)*e + nx/nl*wob; b.y = b.sy + (b.ty - b.sy)*e + ny/nl*wob - Math.sin(u*Math.PI)*(w.fx === 'tide' || w.fx === 'heart' ? 30 : 12);
    b.k += dt; const em = w.fx === 'sun' ? .006 : .016; while(b.k > em){ b.k -= em; const sh = V50_FXSH[w.fx], col = v50Col(w, j + Math.floor(b.t*60));
      const img = (sh === 'dot' || Math.random() < .55) ? v50Glow(col) : v50Shape(sh, col); v50P(b.x + (Math.random() - .5)*6, b.y + (Math.random() - .5)*6, (Math.random() - .5)*30, (Math.random() - .5)*30 + (w.fx === 'fire' ? -30 : 0), .45 + Math.random()*.3, (sh === 'dot' || img === V50.glow.get(col) ? 9 : 7)*V50FX.k, img, w.fx === 'fire' ? -40 : 0); }
    g.globalCompositeOperation = 'lighter'; const gc = v50Glow(v50Col(w, j)); const K = V50FX.k; g.drawImage(gc, b.x - 22*K, b.y - 22*K, 44*K, 44*K); g.drawImage(v50Glow('#ffffff'), b.x - 8*K, b.y - 8*K, 16*K, 16*K); v50KDraw(g, 3, v50Col(w, j), b.x, b.y, 46*K, b.t*6, 1);
    if(w.fx === 'sun'){ g.globalAlpha = .55*(1 - u*.5); g.strokeStyle = w.c; g.lineWidth = 6; g.beginPath(); g.moveTo(b.sx, b.sy); g.lineTo(b.x, b.y); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'source-over';
    if(u >= 1){ b.on = false; if(w.fx === 'thunder') v50Bolt(b.sx, b.sy, b.tx, b.ty, w.c); v50Burst(b.tx, b.ty, w, w.fx === 'rainbow' || w.fx === 'galaxy'); if(b.hit) try { b.hit(b.tx, b.ty, w); } catch(e){ console.warn('v50 hit', e); } } }
  for(let i = V50FX.rings.length - 1; i >= 0; i--){ const r = V50FX.rings[i]; r.t += dt; const T = r.big ? .8 : .55; if(r.t > T){ V50FX.rings.splice(i, 1); continue; } const u = r.t/T, K = r.k || 1, R = (14 + u*(r.big ? 90 : 60))*K, col = r.c || V50_RUBIK[Math.floor(r.t*20) % 6];
    g.globalCompositeOperation = 'lighter';
    if(v50KTex(2, col)){ // vòng sóng, lóe chữ thập, vòng phép (Kenney CC0)
      v50KDraw(g, 2, col, r.x, r.y, R*2.4, 0, (1 - u)*1.1); if(u < .45) v50KDraw(g, 1, r.c2, r.x, r.y, (40 + u*160)*K, r.rot, 1 - u/.45);
      if(r.big) v50KDraw(g, r.fx === 'galaxy' ? 0 : 8, col, r.x, r.y, (70 + u*60)*K, r.rot + r.t*2, (1 - u)*.9);
      const sp = {thunder:5, fire:9, heart:7, galaxy:6, rainbow:6, moon:6, tide:6, sun:4, spark:4}[r.fx];
      if(sp != null){ const a = 1 - u; if(sp === 9) v50KDraw(g, 9, col, r.x, r.y - 30*K*u, 70*K, 0, a); else if(sp === 5) v50KDraw(g, 5, col, r.x, r.y - 30*K, 90*K, 0, a*(Math.floor(r.t*30) % 2 ? .4 : 1)); else if(sp === 7) v50KDraw(g, 7, col, r.x, r.y - 40*K*u, 36*K, 0, a); else v50KDraw(g, sp, col, r.x, r.y, (50 + u*70)*K, r.rot - r.t*4, a); } }
    else { g.globalAlpha = 1 - u; g.lineWidth = (r.big ? 7 : 5)*(1 - u) + 1; g.strokeStyle = col; g.beginPath(); g.ellipse(r.x, r.y, R, R*.7, 0, 0, 6.2832); g.stroke(); g.strokeStyle = r.c2; g.lineWidth = 2; g.beginPath(); g.ellipse(r.x, r.y, R*.62, R*.43, 0, 0, 6.2832); g.stroke(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  for(let i = V50FX.bolts.length - 1; i >= 0; i--){ const o = V50FX.bolts[i]; o.t += dt; if(o.t > .32){ V50FX.bolts.splice(i, 1); continue; }
    if(Math.floor(o.t*30) % 2) continue; g.globalCompositeOperation = 'lighter'; { const x0 = o.pts[0], y0 = o.pts[1], x1 = o.pts[o.pts.length - 2], y1 = o.pts[o.pts.length - 1], tx = v50KTex(5, o.col); if(tx){ g.save(); g.translate((x0 + x1)/2, (y0 + y1)/2); g.rotate(Math.atan2(y1 - y0, x1 - x0) + Math.PI/2); const L = Math.hypot(x1 - x0, y1 - y0); g.globalAlpha = .9; g.drawImage(tx, -30, -L/2, 60, L); g.restore(); } } g.strokeStyle = o.col; g.lineWidth = 5; g.globalAlpha = .7; g.beginPath(); for(let k = 0; k < o.pts.length; k += 2) k ? g.lineTo(o.pts[k], o.pts[k + 1]) : g.moveTo(o.pts[k], o.pts[k + 1]); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.globalAlpha = 1; g.stroke(); g.globalCompositeOperation = 'source-over'; }
}
function v50BClear(){ V50B.forEach(b => { b.on = false; }); V50FX.bolts.length = 0; V50FX.rings.length = 0; V50FX.flash = 0; V50FX.shake = 0; }
// lớp lóe sáng màn hình (toạ độ màn hình)
function v50Flash(g, W, H, dt){ if(V50FX.flash <= 0) return; g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(.5, V50FX.flash); g.fillStyle = V50FX.fcol; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; V50FX.flash = Math.max(0, V50FX.flash - dt*1.6); }
function v50Shake(dt){ if(V50FX.shake <= 0) return [0, 0]; V50FX.shake = Math.max(0, V50FX.shake - dt); const k = V50FX.shake*22; return [(Math.random() - .5)*k, (Math.random() - .5)*k]; }

// ---------- hình đũa (atlas CC0) + dự phòng vẽ bằng code ----------
function v50WandImg(){ v50KImg();
  if(V50.img) return V50.img; const im = new Image(); im.src = 'assets/magic/wands-cc0.png'; V50.img = im; return im;
}
function v50DrawWand(g, i, x, y, s){
  const im = v50WandImg(); if(im.complete && im.naturalWidth){ const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(im, i*48, 0, 48, 48, x, y, s, s); g.imageSmoothingEnabled = sm; return; }
  const w = V50_WANDS[i] || V50_WANDS[0]; g.save(); g.translate(x + s/2, y + s/2); g.rotate(-.78); g.fillStyle = '#6b4226'; g.fillRect(-s*.05, -s*.1, s*.1, s*.5); g.fillStyle = w.c; g.beginPath(); g.arc(0, -s*.22, s*.14, 0, 7); g.fill(); g.restore();
}
function v50WandCanvas(i, s){ const c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); const draw = () => { g.clearRect(0, 0, s, s); v50DrawWand(g, i, 0, 0, s); }; draw(); const im = v50WandImg(); if(!im.complete) im.addEventListener('load', draw, {once:true}); return c; }

// ---------- huy hiệu nhà (vẽ bằng code, cache) ----------
function v50Crest(hi, s){
  const H = V50_HOUSES[hi], key = 'crest' + hi + '_' + s; let c = V50.shp.get(key); if(c) return c; c = document.createElement('canvas'); c.width = s; c.height = Math.round(s*1.18); const g = c.getContext('2d'), w = s, h = c.height;
  const shield = (inset, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(inset, inset); g.lineTo(w - inset, inset); g.lineTo(w - inset, h*.55); g.quadraticCurveTo(w - inset, h*.85, w/2, h - inset); g.quadraticCurveTo(inset, h*.85, inset, h*.55); g.closePath(); g.fill(); };
  shield(0, '#e8c27a'); shield(s*.06, H.c2); shield(s*.12, H.c);
  // dải tỷ lệ vàng: vạch ngang ở h/φ²
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(s*.12, h/V50_PHI/V50_PHI, w - s*.24, s*.05);
  const cx = w/2, cy = h*.5, r = s*.24, ink = hi === 4 ? '#5a6070' : '#ffffff'; g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = Math.max(1.5, s*.05); g.lineCap = 'round';
  if(H.sym === 'flame'){ g.beginPath(); g.moveTo(cx, cy - r*1.3); g.quadraticCurveTo(cx + r*1.1, cy - r*.2, cx + r*.6, cy + r*.8); g.quadraticCurveTo(cx, cy + r*1.2, cx - r*.6, cy + r*.8); g.quadraticCurveTo(cx - r*1.1, cy - r*.2, cx, cy - r*1.3); g.fill(); g.fillStyle = H.c; g.beginPath(); g.ellipse(cx, cy + r*.45, r*.3, r*.5, 0, 0, 7); g.fill(); }
  else if(H.sym === 'hex'){ for(let k = 0; k < 3; k++){ const hx = cx + [-r*.55, r*.55, 0][k], hy = cy + [-r*.35, -r*.35, r*.6][k], q = r*.52; g.beginPath(); for(let a = 0; a < 6; a++) g.lineTo(hx + Math.cos(a*Math.PI/3)*q, hy + Math.sin(a*Math.PI/3)*q); g.closePath(); g.stroke(); } }
  else if(H.sym === 'wave'){ for(let k = 0; k < 3; k++){ g.beginPath(); const yy = cy - r*.7 + k*r*.7; g.moveTo(cx - r*1.1, yy); g.bezierCurveTo(cx - r*.5, yy - r*.5, cx, yy + r*.5, cx + r*.5, yy - r*.1); g.lineTo(cx + r*1.1, yy - r*.3); g.stroke(); } }
  else if(H.sym === 'leaf'){ g.beginPath(); g.ellipse(cx, cy, r*.62, r*1.25, .6, 0, 7); g.fill(); g.strokeStyle = H.c; g.beginPath(); g.moveTo(cx - r*.7, cy + r*.9); g.lineTo(cx + r*.6, cy - r*.8); g.stroke(); }
  else if(H.sym === 'feather'){ g.beginPath(); g.moveTo(cx - r, cy + r*1.1); g.quadraticCurveTo(cx - r*.2, cy - r*.2, cx + r*.9, cy - r*1.2); g.quadraticCurveTo(cx + r*.6, cy + r*.4, cx - r, cy + r*1.1); g.fill(); g.strokeStyle = H.c; g.beginPath(); g.moveTo(cx - r, cy + r*1.1); g.lineTo(cx + r*.5, cy - r*.6); g.stroke(); }
  else { g.beginPath(); for(let a = 0; a < 10; a++){ const rr = a % 2 ? r*.5 : r*1.15, an = -Math.PI/2 + a*Math.PI/5; g.lineTo(cx + Math.cos(an)*rr, cy + Math.sin(an)*rr); } g.closePath(); g.fill(); }
  // 3 ô Rubik nhỏ ở chân huy hiệu
  for(let k = 0; k < 3; k++){ g.fillStyle = V50_RUBIK[(hi + k*2) % 6]; g.fillRect(cx - s*.18 + k*s*.12, h*.8, s*.1, s*.08); }
  V50.shp.set(key, c); return c;
}

// ---------- áo choàng: vẽ lên người (toạ độ cục bộ, chân ở y=0, giống drawBody) ----------
function v50Robe(g, col, sty, hc, dir, moving, walk){
  const sw = moving ? Math.sin(walk*1.6)*1.5 : 0, dk = 'rgba(0,0,0,.28)';
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if(sty === 3){ R(col, -8, -22, 16, 4); R(col, -8 - sw*.5, -18, 4, 9); R(col, 4 + sw*.5, -18, 4, 9); R(dk, -8, -11, 16, 1); }
  else { R(col, -8, -22, 16, 4); R(col, -8 - sw*.4, -18, 4, 16); R(col, 4 + sw*.4, -18, 4, 16); R(col, -9 - sw, -6, 5, 4); R(col, 4 + sw, -6, 5, 4); R(dk, -4, -18, 1, 16); R(dk, 3, -18, 1, 16); }
  if(sty === 1){ R(col, dir > 0 ? -7 : 2, -26, 5, 5); R(dk, dir > 0 ? -7 : 2, -22, 5, 1); }
  if(sty === 2){ R('#ffd23f', -8, -18, 1, 16); R('#ffd23f', 7, -18, 1, 16); R('#fff3b0', -7, -12, 1, 1); R('#fff3b0', 6, -8, 1, 1); }
  if(hc){ R(hc, dir > 0 ? 1 : -4, -19, 3, 3); R('#e8c27a', dir > 0 ? 1 : -4, -20, 3, 1); }
  R('rgba(255,255,255,.18)', -8, -22, 16, 1);
}
