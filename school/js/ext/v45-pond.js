// ================= EXT53 (v45 · Session 5): every pond/lake opens a full-screen, chill fishing game — your own
// character sits on a wooden dock, many kinds of fish swim below, tap the water to cast, tap the 🍞 to feed them;
// the World Flags plaza is spread out wider and every flag asks one question about its country (once a day per player) =================
const V45P = {spots:['🎣 Hồ câu', '🐟 Hồ Koi', '🪷 Đầm sen'], bg:null, bgKey:''};
const V45P_DAYK = 'v45-pond-day', V45P_FLAGK = 'v45-flag-day';
const v45pToday = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const v45pWho = () => (typeof PROF !== 'undefined' && PROF && PROF.name) || 'guest';
function v45pDay(key, bump){ let o = {}; try { o = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch(e){} const t = v45pToday(), w = v45pWho(); if(!o[w] || o[w].d !== t) o[w] = {d:t, n:0}; if(bump){ o[w].n++; try { localStorage.setItem(key, JSON.stringify(o)); } catch(e){} } return o[w].n; }
// ---------- fish: name, colours, length px, depth band (0 top … 1 bottom), speed, kg, rarity, shape, fact ----------
const V45P_FISH = [
  {n:'Cá rô phi', c:['#8fa3a8', '#5d7378'], L:40, d:[.1, .55], v:34, w:[.3, 1.2], r:0, sh:'carp', f:'Cá rô phi ăn rong tảo và lớn rất nhanh.'},
  {n:'Cá chép', c:['#d9a441', '#9c6b1f'], L:54, d:[.45, .95], v:24, w:[.8, 3.5], r:0, sh:'carp', f:'Cá chép có râu để dò thức ăn dưới bùn.'},
  {n:'Cá vàng', c:['#ffb347', '#ff7a1a'], L:26, d:[.05, .4], v:38, w:[.05, .2], r:0, sh:'round', f:'Cá vàng nhớ được đường đi tới vài tháng.'},
  {n:'Cá trắm cỏ', c:['#9bb07a', '#5f7140'], L:62, d:[.2, .7], v:30, w:[1.5, 6], r:1, sh:'long', f:'Cá trắm cỏ ăn cỏ, giúp ao bớt rong.'},
  {n:'Cá trê', c:['#5b5249', '#2f2a25'], L:50, d:[.7, 1], v:20, w:[.6, 2.4], r:1, sh:'cat', f:'Cá trê có râu dài, kiếm ăn giỏi trong nước đục.'},
  {n:'Cá mè', c:['#c9d3d8', '#8e9ea6'], L:52, d:[.1, .5], v:32, w:[1, 4], r:1, sh:'carp', f:'Cá mè lọc sinh vật phù du nhỏ li ti trong nước.'},
  {n:'Cá lóc', c:['#6e7a55', '#3a4230'], L:64, d:[.3, .8], v:40, w:[.8, 3], r:2, sh:'long', f:'Cá lóc ngoi lên mặt nước để đớp không khí.'},
  {n:'Cá rô đồng', c:['#7b8f5e', '#4a5a34'], L:30, d:[.3, .8], v:36, w:[.1, .4], r:1, sh:'round', f:'Cá rô đồng có thể trườn trên cạn một đoạn ngắn.'},
  {n:'Cá koi', c:['#fff4ea', '#e5482e'], L:52, d:[.1, .6], v:26, w:[.5, 2.5], r:1, sh:'koi', f:'Cá koi có thể sống hơn 50 năm!'},
  {n:'Rùa nhỏ (thả lại hồ)', c:['#7aa15a', '#3f6b2f'], L:36, d:[.6, 1], v:14, w:[.3, 1], r:2, sh:'turtle', f:'Rùa thở bằng phổi nên phải ngoi lên lấy hơi.'},
  {n:'Cá chép vàng', c:['#ffe066', '#e0a800'], L:58, d:[.2, .8], v:30, w:[2, 5], r:3, sh:'koi', f:'Truyền thuyết kể cá chép vượt Vũ Môn hoá rồng.'}
];
// spawn weights for the three waters (pond · koi lake · lotus marsh)
const V45P_MIX = [[6, 5, 3, 3, 3, 3, 1, 2, 1, 1, .4], [3, 3, 4, 1, 1, 2, 0, 1, 8, 1, .8], [4, 3, 1, 2, 4, 1, 3, 5, 0, 2, .4]];
function v45pPick(sp){ const w = V45P_MIX[sp] || V45P_MIX[0]; let t = 0; w.forEach(x => t += x); let r = Math.random()*t; for(let i=0;i<w.length;i++){ r -= w[i]; if(r <= 0) return V45P_FISH[i]; } return V45P_FISH[0]; }
function v45pSize(){ const W = innerWidth, H = innerHeight, side = W > H && typeof MOB !== 'undefined' && MOB.touch, aw = W - (side ? 116 : 0); if(H > aw) return [480, Math.round(Math.max(600, Math.min(1100, 480*H/aw)))]; return [800, Math.round(Math.max(360, Math.min(700, 800*H/aw)))]; }
function v45pFish(s, x){ const sp = v45pPick(s.spot), d = sp.d[0] + Math.random()*(sp.d[1] - sp.d[0]), y = s.sy + 26 + d*(s.bot - s.sy - 46); return {sp, x:x != null ? x : s.vw*.15 + Math.random()*s.vw*.85, y, by:y, dir:Math.random() < .5 ? -1 : 1, v:sp.v*(.7 + Math.random()*.5), ph:Math.random()*6, st:'swim', t:0, k:.85 + Math.random()*.35}; }
GAMES.pond = {
  title:'Câu cá thư giãn', opts:V45P.spots.slice(), v44own:true,
  help:'Chạm xuống nước để thả lưỡi câu tới đó. Khi phao chìm và hiện ❗ thì chạm ngay để giật cần. Giữ ngón tay để kéo dây, thả ra khi dây căng đỏ. Chạm 🍞 để cho cá ăn: cá vui sẽ dễ cắn câu hơn. Mỗi lượt có 8 mồi câu.',
  init(o){ const [vw, vh] = v45pSize(), cv = $('#arcCv'); if(cv && (cv.width !== vw || cv.height !== vh)){ cv.width = vw; cv.height = vh; }
    const s = {vw, vh, spot:o || 0, sy:Math.round(vh*.382), bot:vh - 34, t:0, st:'idle', bait:8, food:5, happy:0, fish:[], fx:[], food_:[], bag:[], msg:'👆 Chạm xuống nước để thả câu', msgT:99, night:(() => { try { return isNight(); } catch(e){ return false; } })()};
    s.dock = Math.round(vw*(vh > vw ? .382 : .236)); s.px = s.dock - 26; s.tip = [s.dock + (vh > vw ? 84 : 104), s.sy - (vh > vw ? 150 : 120)];
    for(let i=0;i<(vh > vw ? 11 : 10);i++) s.fish.push(v45pFish(s)); return s; },
  pointer(s, ty, ax, ay){ if(ty !== 'down' || s.over) return; const x = ax*s.vw/AW, y = ay*s.vh/AH;
    if(s.st === 'card'){ s.st = 'idle'; s.card = null; if(s.bait <= 0) v45pEnd(s); return; }
    if(Math.hypot(x - (s.vw - 50), y - (s.vh - 52)) < 40){ v45pFeed(s); return; }
    if(s.st === 'bite'){ s.st = 'fight'; s.ten = 25; s.prog = 22; s.msg = '✊ Giữ để kéo · thả ra khi dây căng đỏ'; s.msgT = 3; kickSfx(.6); return; }
    if(s.st === 'fight' || s.st === 'cast') return;
    if(y > s.sy + 14 && x > s.dock + 20){ if(s.bait <= 0){ s.msg = '🪱 Hết mồi rồi!'; s.msgT = 2; return; } v45pCast(s, x, Math.min(y, s.bot - 14)); } },
  update(s, dt){
    if(s.over) return; s.t += dt; s.msgT -= dt; s.happy = Math.max(0, s.happy - dt);
    const hold = (typeof holdKey === 'function' ? holdKey() : ARC.ptr.down);
    // fish
    s.fish.forEach(f => { f.ph += dt*3; f.t -= dt;
      if(f.st === 'swim' || f.st === 'flee'){ const sp = f.st === 'flee' ? 3.2 : 1; f.x += f.dir*f.v*sp*dt; f.y += (f.by - f.y)*Math.min(1, dt*1.5); f.y += Math.sin(f.ph*.7)*.25; if(f.x < 18){ f.dir = 1; } if(f.x > s.vw - 18){ f.dir = -1; } if(f.st === 'flee' && f.t <= 0) f.st = 'swim'; if(Math.random() < dt*.08) f.dir *= -1; }
      else if(f.st === 'eat' || f.st === 'go'){ const tx = f.st === 'go' ? s.hx : f.tx, tyy = f.st === 'go' ? s.hy : f.ty, dx = tx - f.x, dy = tyy - f.y, d = Math.hypot(dx, dy); if(Math.abs(dx) > 3) f.dir = dx > 0 ? 1 : -1; const v = f.v*1.1*dt; if(d > 10){ f.x += dx/d*v; f.y += dy/d*v; } else if(f.st === 'go'){ f.st = 'nib'; f.t = .7; s.nib = 1 + Math.floor(Math.random()*3); } else { f.st = 'swim'; f.by = f.y; } if(f.st === 'eat' && f.t <= 0){ f.st = 'swim'; f.by = f.y; } } });
    // food pellets sink; nearby fish come to eat
    s.food_.forEach(p => { p.y = Math.min(s.bot - 6, p.y + 16*dt); p.t += dt; });
    s.fish.forEach(f => { if(f.st !== 'swim' || f === s.on) return; const p = s.food_.find(p => Math.hypot(p.x - f.x, p.y - f.y) < 260); if(p && Math.random() < dt*2){ f.st = 'eat'; f.tx = p.x; f.ty = p.y; f.t = 6; } });
    s.food_ = s.food_.filter(p => { const f = s.fish.find(f => f.st === 'eat' && Math.hypot(p.x - f.x, p.y - f.y) < 14); if(f){ s.fx.push({k:'heart', x:p.x, y:p.y - 10, t:0}); f.st = 'swim'; f.by = f.y; return false; } return p.t < 14; });
    // line states
    if(s.st === 'cast'){ s.ct += dt/.6; if(s.ct >= 1){ s.st = 'wait'; s.bob = 0; s.fx.push({k:'ring', x:s.hx, y:s.sy, t:0}); try { v45pSplash(.35); } catch(e){} s.msg = '⏳ Chờ cá cắn câu…'; s.msgT = 2.5; s.look = .6; } }
    else if(s.st === 'wait'){ s.look -= dt; s.bob = Math.sin(s.t*2)*1.2;
      const on = s.fish.find(f => f.st === 'go' || f.st === 'nib');
      if(!on && s.look <= 0){ s.look = .5; const R = s.happy > 0 ? 340 : 210, c = s.fish.filter(f => f.st === 'swim' && Math.hypot(f.x - s.hx, f.y - s.hy) < R); if(c.length && Math.random() < (s.happy > 0 ? .55 : .3)){ const f = c[Math.floor(Math.random()*c.length)]; if(Math.random() < 1/(1 + f.sp.r*.5)) f.st = 'go'; } }
      if(on && on.st === 'nib'){ on.x = s.hx - on.dir*on.sp.L*.45*on.k; on.y = s.hy; if(on.t <= 0){ if(s.nib-- > 0){ on.t = .55 + Math.random()*.5; s.bob = 5; s.fx.push({k:'ring', x:s.hx, y:s.sy, t:.3}); } else { s.st = 'bite'; s.bt = 1.7; s.on = on; s.msg = '❗ Chạm ngay để giật cần!'; s.msgT = 1.7; blipSfx(1320); } } else on.t -= dt; } }
    else if(s.st === 'bite'){ s.bt -= dt; s.bob = 12 + Math.sin(s.t*30)*2; if(s.bt <= 0){ v45pLost(s, '🐟 Cá nhả mồi rồi, chờ con khác nhé'); s.st = 'wait'; } }
    else if(s.st === 'fight'){ const f = s.on, pw = .5 + f.sp.r*.35 + f.sp.w[1]*.06, pull = pw*(.55 + .7*Math.max(0, Math.sin(s.t*2.1 + f.ph))); if(hold){ s.prog += 20/(.7 + pw*.5)*dt; s.ten += (24*pull + 6)*dt; } else { s.ten -= 36*dt; s.prog -= 5*pull*dt; } s.ten = Math.max(0, s.ten); s.bob = 6 + Math.sin(s.t*14)*3;
      const k = Math.min(1, s.prog/100), tx = s.dock + 30; f.x = s.hx + (tx - s.hx)*k + Math.sin(s.t*7)*8*(1 - k); f.y = s.hy + (s.sy + 14 - s.hy)*k; f.dir = Math.sin(s.t*3 + f.ph) > 0 ? 1 : -1; s.lx = f.x; s.ly = f.y;
      if(s.ten >= 100){ v45pLost(s, '💥 Dây đứt! Lần sau thả tay sớm hơn nhé'); s.st = 'idle'; if(s.bait <= 0) v45pEnd(s); }
      else if(s.prog <= 0){ v45pLost(s, '🐟 Cá thoát rồi, thử lại nhé'); s.st = 'idle'; if(s.bait <= 0) v45pEnd(s); }
      else if(s.prog >= 100) v45pCaught(s); }
    else if(s.st === 'card'){ s.ct -= dt; if(s.ct <= 0){ s.st = 'idle'; s.card = null; if(s.bait <= 0) v45pEnd(s); } }
    else if(s.st === 'idle' && s.bait <= 0 && !s.over) v45pEnd(s);
    s.fx.forEach(p => p.t += dt); s.fx = s.fx.filter(p => p.t < (p.k === 'heart' ? 1.4 : p.k === 'drop' ? .8 : 1.6));
    if(Math.random() < dt*1.2){ const f = s.fish[Math.floor(Math.random()*s.fish.length)]; if(f) s.fx.push({k:'bub', x:f.x + f.dir*f.sp.L*.5, y:f.y - 4, t:0}); }
  },
  draw(s, c){ v45pDraw(s, c); }
};
function v45pCast(s, x, y){ s.bait--; s.st = 'cast'; s.ct = 0; s.hx = x; s.hy = Math.max(s.sy + 26, y); s.on = null; s.fish.forEach(f => { if(f.st === 'go' || f.st === 'nib') f.st = 'swim'; }); s.msgT = 0; try { v45pSplash(.15, 900); } catch(e){} }
function v45pLost(s, m){ const f = s.on || s.fish.find(f => f.st === 'go' || f.st === 'nib'); if(f){ f.st = 'flee'; f.t = 1.8; f.by = Math.max(s.sy + 30, Math.min(s.bot - 20, f.y)); f.dir = f.x < s.hx ? -1 : 1; } s.on = null; s.msg = m; s.msgT = 2.6; }
function v45pFeed(s){ if(s.food <= 0){ s.msg = '🍞 Hết thức ăn cho cá rồi'; s.msgT = 2; return; } s.food--; s.happy = 20; const cx = s.st === 'wait' || s.st === 'bite' ? s.hx : s.dock + (s.vw - s.dock)*.45;
  for(let i=0;i<7;i++){ const x = Math.max(s.dock + 30, Math.min(s.vw - 20, cx + (Math.random() - .5)*120)); s.food_.push({x, y:s.sy + 4, t:0}); s.fx.push({k:'drop', x, y:s.sy, t:Math.random()*.2}); }
  s.feeds = (s.feeds || 0) + 1; s.msg = '💖 Cá đang vui, dễ cắn câu hơn!'; s.msgT = 2.6; try { v45pSplash(.12, 1400); } catch(e){} }
function v45pCaught(s){ const f = s.on, sp = f.sp, w = +(sp.w[0] + Math.random()*(sp.w[1] - sp.w[0])*f.k).toFixed(2), isNew = !s.bag.some(b => b.n === sp.n);
  s.bag.push({n:sp.n, w, r:sp.r}); s.card = {sp, w, isNew}; s.st = 'card'; s.ct = 3.8; s.on = null; s.fx.push({k:'ring', x:f.x, y:s.sy, t:0}, {k:'ring', x:f.x, y:s.sy, t:.4});
  s.fish.splice(s.fish.indexOf(f), 1); setTimeout(() => { if(ARC.s === s) s.fish.push(v45pFish(s, Math.random() < .5 ? 10 : s.vw - 10)); }, 1500);
  try { v45pSplash(.5, 600); blipSfx(1760); } catch(e){}
  try { FS.bag.push({n:sp.n, w, p:['hồ', 'hồ Koi', 'đầm sen'][s.spot]}); if(FS.bag.length > 200) FS.bag.shift(); localStorage.setItem('truong-fishbag-v1', JSON.stringify(FS.bag)); } catch(e){}
  try { if(PROF){ const d = PROF.fish[sp.n] || {n:0, best:0}; d.n++; d.best = Math.max(d.best, w); PROF.fish[sp.n] = d; PROF.stats.catches = (PROF.stats.catches || 0) + 1; } mprog('fish3'); if(sp.sh === 'koi') mprog('koi'); } catch(e){} }
function v45pEnd(s){ if(s.over) return; const n = s.bag.length, kinds = new Set(s.bag.map(b => b.n)).size, pts = s.bag.reduce((a, b) => a + 2 + b.r*3 + b.w*1.5, 0) + (s.feeds || 0);
  const plays = v45pDay(V45P_DAYK, true), half = plays > 10; let money = Math.max(1, Math.min(20, Math.round(1 + pts*.6))), exp = Math.max(6, Math.min(40, Math.round(6 + pts*1.4)));
  if(half){ money = Math.max(1, Math.ceil(money/2)); exp = Math.max(1, Math.ceil(exp/2)); } s.rw = [money, exp, half];
  s.over = n ? `Câu được ${n} con · ${kinds} loài` : 'Hết mồi câu!'; s.sub = (typeof PROF !== 'undefined' && PROF) ? `+$${money} · +${exp} EXP${half ? ' (lượt thứ ' + plays + ' hôm nay, thưởng một nửa)' : ''}` : 'Đăng nhập để nhận tiền và EXP'; }
function v45pSplash(v, f){ try { sfx(); const t = AC.currentTime; if(f) tone(t, f, .08, v*.4, 'sine'); woodKnock(t, 180 + Math.random()*60, v, .12); } catch(e){} }
// ---------- drawing (static backdrop cached offscreen; only water life is drawn each frame) ----------
const V45P_PAL = [{w:['#5fb7c9', '#1d5f78', '#123c52'], t:'#3f7d4a', t2:'#2e5f3a'}, {w:['#7fd0e0', '#2a7f9e', '#174f6a'], t:'#4b8a52', t2:'#356b3c'}, {w:['#79b59a', '#2f6e5a', '#1c4a3c'], t:'#5a8f45', t2:'#3c6b32'}];
function v45pBack(s){ const key = [s.vw, s.vh, s.spot, s.night].join(); if(V45P.bgKey === key) return V45P.bg; const cv = V45P.bg || document.createElement('canvas'); cv.width = s.vw; cv.height = s.vh; const c = cv.getContext('2d'), W = s.vw, H = s.vh, SY = s.sy, P = V45P_PAL[s.spot], N = s.night;
  // sky
  let g = c.createLinearGradient(0, 0, 0, SY); if(N){ g.addColorStop(0, '#141a44'); g.addColorStop(1, '#3d3f7a'); } else { g.addColorStop(0, '#8fd0ee'); g.addColorStop(.7, '#d9f0f4'); g.addColorStop(1, '#fbeed2'); } c.fillStyle = g; c.fillRect(0, 0, W, SY);
  if(N){ for(let i=0;i<70;i++){ c.fillStyle = `rgba(255,250,220,${.3 + (i % 5)*.14})`; c.fillRect((i*97) % W, (i*53) % (SY*.7), i % 9 ? 2 : 3, i % 9 ? 2 : 3); } c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(W*.618, SY*.382, 21, 0, 7); c.fill(); }
  else { c.fillStyle = 'rgba(255,246,200,.95)'; c.beginPath(); c.arc(W*.618, SY*.382, 26, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.85)'; [[.146, .236], [.382, .618], [.854, .5]].forEach(([x, y]) => { c.beginPath(); c.ellipse(W*x, SY*y, 46, 13, 0, 0, 7); c.ellipse(W*x + 28, SY*y - 8, 30, 12, 0, 0, 7); c.fill(); }); }
  // far hills + tree line
  c.fillStyle = N ? '#262a55' : '#a9cfb4'; c.beginPath(); c.moveTo(0, SY); for(let x=0;x<=W;x+=10) c.lineTo(x, SY - 40 - Math.sin(x*.011)*16 - Math.sin(x*.027 + 1)*8); c.lineTo(W, SY); c.fill();
  c.fillStyle = N ? '#1b1f40' : P.t; for(let x = -10; x < W + 20; x += 22){ const h = 18 + ((x*7) % 13); c.beginPath(); c.arc(x, SY - 8, h*.7, Math.PI, 0); c.fill(); }
  c.fillStyle = N ? '#14182f' : P.t2; for(let x = 6; x < W; x += 58){ const h = 34 + ((x*13) % 22); c.beginPath(); c.moveTo(x - 12, SY - 4); c.lineTo(x + 12, SY - 4); c.lineTo(x, SY - 4 - h); c.fill(); }
  if(s.spot === 1){ // red arched bridge
    const bx0 = W*.5, bx1 = W*.95, top = SY - 46; c.strokeStyle = N ? '#7a2a2a' : '#c0392b'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx0, SY - 4); c.quadraticCurveTo((bx0 + bx1)/2, top - 20, bx1, SY - 4); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(bx0, SY - 18); c.quadraticCurveTo((bx0 + bx1)/2, top - 38, bx1, SY - 18); c.stroke(); for(let i=1;i<8;i++){ const u = i/8, x = bx0 + (bx1 - bx0)*u, y1 = SY - 4 - 2*u*(1 - u)*(top + 16 - SY), y2 = y1 - 14; c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.stroke(); } }
  // water body
  g = c.createLinearGradient(0, SY, 0, H); g.addColorStop(0, N ? '#2b4f78' : P.w[0]); g.addColorStop(.35, N ? '#183456' : P.w[1]); g.addColorStop(1, N ? '#0c1b33' : P.w[2]); c.fillStyle = g; c.fillRect(0, SY, W, H - SY);
  // light rays
  if(!N){ c.fillStyle = 'rgba(255,255,255,.06)'; for(let i=0;i<4;i++){ const x = W*(.3 + i*.2); c.beginPath(); c.moveTo(x - 20, SY); c.lineTo(x + 30, SY); c.lineTo(x - 30 + i*10, H); c.lineTo(x - 110 + i*10, H); c.fill(); } }
  // sandy bottom, stones
  c.fillStyle = N ? '#2a2f3a' : '#c9b48a'; c.beginPath(); c.moveTo(0, H); for(let x=0;x<=W;x+=12) c.lineTo(x, s.bot + Math.sin(x*.03)*5 + Math.sin(x*.009)*6); c.lineTo(W, H); c.fill();
  c.fillStyle = N ? '#3a3f4c' : '#9c8a68'; for(let i=0;i<14;i++){ const x = (i*131) % W, y = s.bot + 8 + (i % 3)*5; c.beginPath(); c.ellipse(x, y, 8 + (i % 4)*3, 5, 0, 0, 7); c.fill(); }
  // dock: posts into water, planks
  const D = s.dock; c.fillStyle = N ? '#3a2c20' : '#6d4c2e'; for(const x of [14, D - 22]) c.fillRect(x, SY - 12, 12, s.bot - SY + 10);
  c.fillStyle = N ? '#5a4330' : '#9a6b3f'; c.fillRect(0, SY - 22, D, 14); c.fillStyle = N ? '#4a3626' : '#7a5230'; for(let x=0;x<D;x+=18) c.fillRect(x, SY - 22, 2, 14); c.fillRect(0, SY - 9, D, 3);
  // shore grass at far right edge for spot 2: reeds
  if(s.spot === 2){ c.strokeStyle = N ? '#2f4a2a' : '#4f7a32'; c.lineWidth = 3; for(let i=0;i<10;i++){ const x = W - 12 - i*9; c.beginPath(); c.moveTo(x, SY + 6); c.quadraticCurveTo(x - 6, SY - 30, x - 2, SY - 54 - (i % 3)*10); c.stroke(); } }
  V45P.bg = cv; V45P.bgKey = key; return cv; }
function v45pDrawFish(c, f, t){ const sp = f.sp, L = sp.L*f.k, h = L*(sp.sh === 'round' ? .55 : sp.sh === 'long' ? .28 : .38), [c1, c2] = sp.c, wag = Math.sin(f.ph*2.6)*(f.st === 'swim' ? .25 : .5);
  c.save(); c.translate(f.x, f.y); c.scale(f.dir, 1);
  if(sp.sh === 'turtle'){ c.fillStyle = '#8fbf6a'; c.beginPath(); c.ellipse(L*.5, 0, 7, 5, 0, 0, 7); c.fill(); for(const [x, y] of [[-L*.3, h*.6], [L*.3, h*.6], [-L*.3, -h*.6], [L*.3, -h*.6]]){ c.beginPath(); c.ellipse(x, y + Math.sin(f.ph*2)*2, 6, 3, 0, 0, 7); c.fill(); } c.fillStyle = c2; c.beginPath(); c.ellipse(0, 0, L*.45, h*.55, 0, 0, 7); c.fill(); c.fillStyle = c1; c.beginPath(); c.ellipse(0, 0, L*.34, h*.42, 0, 0, 7); c.fill(); c.restore(); return; }
  // tail
  c.fillStyle = c2; c.beginPath(); c.moveTo(-L*.42, 0); c.lineTo(-L*.68, -h*.7 + wag*h); c.lineTo(-L*.62, 0); c.lineTo(-L*.68, h*.7 + wag*h); c.closePath(); c.fill();
  // body
  c.fillStyle = c1; c.beginPath(); c.ellipse(0, 0, L/2, h/2, 0, 0, 7); c.fill(); c.fillStyle = c2; c.beginPath(); c.ellipse(0, -h*.18, L*.44, h*.28, 0, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,250,240,.55)'; c.beginPath(); c.ellipse(L*.02, h*.24, L*.34, h*.18, 0, 0, Math.PI); c.fill();
  if(sp.sh === 'koi'){ c.fillStyle = c2; c.beginPath(); c.ellipse(L*.1, -h*.12, L*.14, h*.24, .3, 0, 7); c.ellipse(-L*.2, h*.02, L*.1, h*.18, 0, 0, 7); c.fill(); }
  // fin + eye
  c.fillStyle = c2; c.globalAlpha = .8; c.beginPath(); c.moveTo(-L*.05, -h*.45); c.lineTo(L*.12, -h*.85); c.lineTo(L*.2, -h*.42); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#fff'; c.beginPath(); c.arc(L*.32, -h*.1, Math.max(2, h*.14), 0, 7); c.fill(); c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(L*.34, -h*.1, Math.max(1.2, h*.08), 0, 7); c.fill();
  if(sp.sh === 'cat' || sp.n === 'Cá chép'){ c.strokeStyle = c2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(L*.46, h*.08); c.quadraticCurveTo(L*.6, h*.3, L*.56 + Math.sin(t*3)*3, h*.5); c.moveTo(L*.46, h*.1); c.quadraticCurveTo(L*.66, h*.12, L*.7, h*.3); c.stroke(); }
  if(sp.r >= 3){ c.fillStyle = 'rgba(255,240,160,.9)'; const a = t*4 + f.ph; c.fillRect(Math.cos(a)*L*.4, Math.sin(a)*h*.8, 3, 3); }
  c.restore(); }
function v45pRound(c, x, y, w, h, r){ c.beginPath(); if(c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
function v45pDraw(s, c){ const W = s.vw, H = s.vh, SY = s.sy, t = s.t;
  c.drawImage(v45pBack(s), 0, 0);
  // lotus pads / lily pads on the surface
  if(s.spot !== 1){ for(let i=0;i<(s.spot === 2 ? 9 : 3);i++){ const x = s.dock + 40 + ((i*173) % (W - s.dock - 60)), y = SY + 2 + Math.sin(t*.8 + i)*1.2; c.fillStyle = s.night ? '#2f5a3a' : '#4f9a45'; c.beginPath(); c.ellipse(x, y, 22, 6, 0, .3, Math.PI*2 - .1); c.lineTo(x, y); c.fill(); if(s.spot === 2 && i % 2 === 0){ c.fillStyle = '#ff9ec0'; c.beginPath(); c.moveTo(x - 7, y - 3); c.quadraticCurveTo(x - 9, y - 16, x, y - 20); c.quadraticCurveTo(x + 9, y - 16, x + 7, y - 3); c.fill(); c.fillStyle = '#fff1f6'; c.beginPath(); c.ellipse(x, y - 9, 3, 7, 0, 0, 7); c.fill(); } } }
  // swaying weeds
  c.strokeStyle = s.night ? 'rgba(60,110,80,.8)' : 'rgba(60,140,70,.85)'; c.lineWidth = 4; c.lineCap = 'round'; for(let i=0;i<12;i++){ const x = 30 + (i*97) % (W - 40), hh = 40 + (i*29) % 70, sw = Math.sin(t*1.1 + i)*10; c.beginPath(); c.moveTo(x, s.bot + 4); c.quadraticCurveTo(x + sw, s.bot - hh*.5, x + sw*1.6, s.bot - hh); c.stroke(); } c.lineCap = 'butt';
  // food pellets
  c.fillStyle = '#d7a35a'; s.food_.forEach(p => c.fillRect(p.x - 2, p.y - 2, 4, 4));
  // fish
  s.fish.forEach(f => v45pDrawFish(c, f, t));
  // surface shimmer
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; for(let i=0;i<7;i++){ const x = ((i*151 + t*14) % (W + 60)) - 30; c.beginPath(); c.moveTo(x, SY + 3 + (i % 3)*4); c.lineTo(x + 26, SY + 3 + (i % 3)*4); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(0, SY - 1, W, 3);
  // effects
  s.fx.forEach(p => { if(p.k === 'ring'){ const r = 6 + p.t*34; c.strokeStyle = `rgba(255,255,255,${Math.max(0, .8 - p.t*.5)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, r, r*.28, 0, 0, 7); c.stroke(); } else if(p.k === 'bub'){ c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.2; c.beginPath(); c.arc(p.x + Math.sin(p.t*6)*2, p.y - p.t*40, 2.5 + p.t, 0, 7); c.stroke(); } else if(p.k === 'heart'){ c.globalAlpha = Math.max(0, 1 - p.t/1.4); c.font = '18px Nunito, sans-serif'; c.fillText('💖', p.x - 9, p.y - p.t*30); c.globalAlpha = 1; } else if(p.k === 'drop' && p.t > 0){ c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(p.x - 1, p.y - 14 + p.t*14, 3, 4); } });
  // fireflies at night
  if(s.night){ for(let i=0;i<10;i++){ const x = (i*113 + Math.sin(t*.4 + i)*40 + W) % W, y = SY*.55 + Math.sin(t*.7 + i*2)*SY*.2, a = .4 + .6*Math.abs(Math.sin(t*2 + i)); c.fillStyle = `rgba(220,255,140,${a})`; c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); } }
  // the player sitting on the dock with the rod
  v45pAngler(s, c);
  // line + bobber
  const [tx, ty] = s.tip; let bx = s.hx, by = SY + (s.bob || 0);
  if(s.st === 'cast'){ const u = s.ct; bx = tx + (s.hx - tx)*u; by = ty + (SY - ty)*u - Math.sin(u*Math.PI)*80; }
  if(s.st !== 'idle' && s.st !== 'card'){ c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + bx)/2, Math.max(ty, by) + (s.st === 'fight' ? 0 : 30), bx, by); c.stroke();
    if(s.st !== 'cast'){ const hx = s.st === 'fight' ? s.lx : s.hx, hy = s.st === 'fight' ? s.ly : s.hy; c.strokeStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(bx, by); c.lineTo(hx, hy); c.stroke(); c.strokeStyle = '#cfd8dc'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy - 3, 3, 0, Math.PI); c.stroke(); }
    c.fillStyle = '#e53935'; c.beginPath(); c.arc(bx, by - 2, 6, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by - 2, 6, 0, Math.PI); c.fill(); c.fillStyle = '#263238'; c.fillRect(bx - 1, by - 14, 2, 7);
    if(s.st === 'bite'){ c.font = '900 34px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText('❗', bx, by - 26 - Math.abs(Math.sin(t*10))*6); c.textAlign = 'left'; } }
  // fight meters
  if(s.st === 'fight'){ const mw = Math.min(260, W*.6), mx = (W - mw)/2, my = SY + 76; c.fillStyle = 'rgba(10,15,34,.55)'; v45pRound(c, mx - 10, my - 8, mw + 20, 50, 14); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(mx, my, mw, 10); c.fillStyle = '#2fbf71'; c.fillRect(mx, my, mw*Math.min(1, s.prog/100), 10);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(mx, my + 20, mw, 10); c.fillStyle = s.ten > 75 ? '#ef4b4b' : s.ten > 50 ? '#ffb020' : '#4fc3f7'; c.fillRect(mx, my + 20, mw*Math.min(1, s.ten/100), 10);
    c.font = '800 13px Nunito, sans-serif'; c.fillStyle = '#fff'; c.fillText('🐟', mx - 2 + mw*Math.min(1, s.prog/100) - 6, my + 9); c.fillText('〰', mx - 2 + mw*Math.min(1, s.ten/100) - 6, my + 30); }
  // HUD pill: bait · catches · feed button
  c.font = '800 21px Nunito, sans-serif'; const v47hud = `🪱 ${s.bait}   🐟 ${s.bag.length}`, v47hw = Math.max(144, Math.ceil(c.measureText(v47hud).width) + 42); c.fillStyle = 'rgba(10,15,34,.5)'; v45pRound(c, 13, H - 55, v47hw, 42, 21); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(v47hud, 34, H - 27);
  c.fillStyle = s.happy > 0 ? 'rgba(255,170,200,.85)' : 'rgba(10,15,34,.55)'; c.beginPath(); c.arc(W - 55, H - 68, 34, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke(); c.font = '26px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('🍞', W - 55, H - 59); c.font = '800 16px Nunito, sans-serif'; c.fillStyle = '#fff'; c.fillText('×' + s.food, W - 55, H - 13); c.textAlign = 'left';
  // message
  if(s.msgT > 0 && s.msg && !s.over){ c.globalAlpha = Math.min(1, s.msgT*2); c.font = '800 21px Nunito, sans-serif'; const mw = c.measureText(s.msg).width + 42, mx = (W - mw)/2, my = SY + 21; c.fillStyle = 'rgba(10,15,34,.6)'; v45pRound(c, mx, my, mw, 42, 21); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(s.msg, W/2, my + 28); c.textAlign = 'left'; c.globalAlpha = 1; }
  // catch card
  if(s.card) v45pCard(s, c);
  if(s.over){ c.fillStyle = 'rgba(5,8,20,.55)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = '900 30px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(s.over, W/2, H*.382); c.font = '800 21px Nunito, sans-serif'; c.fillStyle = '#fff'; c.fillText(s.sub || '', W/2, H*.382 + 34);
    const kinds = [...new Set(s.bag.map(b => b.n))].slice(0, 6); kinds.forEach((n, i) => { const sp = V45P_FISH.find(f => f.n === n); v45pDrawFish(c, {sp, x:W/2 + (i - (kinds.length - 1)/2)*Math.min(90, W/7), y:H*.382 + 89, dir:1, ph:t, k:.9, st:'swim'}, t); }); c.textAlign = 'left'; }
}
function v45pAngler(s, c){ const x = s.px, y = s.sy - 20, sc = s.vh > s.vw ? 2.8 : 2.6, look = (typeof myLook === 'function' ? myLook() : agentLook(2, {}));
  const breathe = Math.sin(s.t*1.6)*.6, [tx, ty] = s.tip;
  // rod (drawn behind the hands)
  const hx = x + 9*sc, hy = y - 15*sc, bend = s.st === 'fight' ? 26 + Math.sin(s.t*12)*4 : s.st === 'bite' ? 12 : 4; c.strokeStyle = s.night ? '#c8a27a' : '#6d4c2e'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(hx - 8, hy + 10); c.quadraticCurveTo((hx + tx)/2, (hy + ty)/2 + bend, tx, ty); c.stroke(); c.strokeStyle = '#3e2723'; c.lineWidth = 5; c.beginPath(); c.moveTo(hx - 8, hy + 10); c.lineTo(hx + 6, hy - 2); c.stroke();
  // upper body (clipped above the hip) + legs dangling over the dock edge
  c.save(); c.beginPath(); c.rect(x - 40*sc, y - 60*sc, 80*sc, 60*sc + 1); c.clip();
  try { drawGuy(c, look, x, y + 10*sc + breathe, sc, 1, false); } catch(e){} c.restore();
  const pants = look.pants || '#37474f'; c.fillStyle = pants; c.fillRect(x - 5*sc, y, 15*sc, 4*sc); c.fillRect(x + 6*sc, y, 4*sc, 9*sc + Math.sin(s.t*1.2)*2); c.fillRect(x + 1*sc, y, 4*sc, 8*sc + Math.sin(s.t*1.2 + 1.5)*2);
  c.fillStyle = '#222'; c.fillRect(x + 6*sc, y + 9*sc + Math.sin(s.t*1.2)*2, 5*sc, 2*sc); c.fillRect(x + 1*sc, y + 8*sc + Math.sin(s.t*1.2 + 1.5)*2, 5*sc, 2*sc);
  // bucket next to the player
  c.fillStyle = '#4f7fb0'; c.beginPath(); c.moveTo(x - 22*sc, y - 1); c.lineTo(x - 12*sc, y - 1); c.lineTo(x - 13*sc, y - 9*sc); c.lineTo(x - 21*sc, y - 9*sc); c.fill(); c.strokeStyle = '#cfd8dc'; c.lineWidth = 1.5; c.beginPath(); c.arc(x - 17*sc, y - 9*sc, 4*sc, Math.PI, 0); c.stroke();
  if(s.bag.length){ c.font = `${Math.round(5*sc)}px Nunito, sans-serif`; c.fillText('🐟', x - 21*sc, y - 9*sc); } }
function v45pCard(s, c){ const W = s.vw, H = s.vh, cw = Math.min(380, W - 42), {sp, w, isNew} = s.card;
  // v47 golden card: cw × cw/φ, fish in the top 0.382, card centred on the golden line of the water
  c.font = '700 20px Nunito, sans-serif'; const words = ('💡 ' + sp.f).split(' '), lines = []; let line = ''; for(const wd of words){ const tt = line ? line + ' ' + wd : wd; if(c.measureText(tt).width > cw - 42 && line){ lines.push(line); line = wd; } else line = tt; } lines.push(line);
  const ch = Math.max(Math.round(cw/1.618), 152 + lines.length*26 + 13), cx = (W - cw)/2, cy = Math.max(21, Math.round(Math.min(H*.618, s.sy + (H - s.sy)*.382) - ch/2));
  c.fillStyle = '#fffbf0'; v45pRound(c, cx, cy, cw, ch, 21); c.fill(); c.strokeStyle = sp.r >= 3 ? '#e0a800' : '#8bc34a'; c.lineWidth = 3; c.stroke();
  v45pDrawFish(c, {sp, x:W/2, y:cy + 55, dir:1, ph:s.t*2, k:1.5, st:'swim'}, s.t);
  c.textAlign = 'center'; c.fillStyle = '#1b2a33'; c.font = '900 26px Nunito, sans-serif'; c.fillText(`${sp.n}${isNew ? ' · MỚI ✨' : ''}`, W/2, cy + 110); c.font = '800 21px Nunito, sans-serif'; c.fillStyle = '#3d5a66'; c.fillText(`⚖️ ${w} kg · ${['Thường gặp', 'Khá hiếm', 'Hiếm', 'Huyền thoại'][sp.r]}`, W/2, cy + 139);
  c.font = '700 20px Nunito, sans-serif'; c.fillStyle = '#2e4b3a'; lines.forEach((l, k) => c.fillText(l, W/2, cy + 173 + k*26)); c.textAlign = 'left'; }
function v45pOpenPond(spot){ openArcade('pond', spot || 0); }
// ---------- world flags: wider plaza, tap a flag = one question a day ----------
const V45P_FQ = {
  vn:['Hà Nội', 'Việt Nam có hình dáng giống chữ cái nào?', ['S', 'C', 'L', 'O'], 'Dải đất hình chữ S trải dài hơn 3.200 km bờ biển.'],
  jp:['Tokyo', 'Ngọn núi nổi tiếng nhất Nhật Bản là?', ['Núi Phú Sĩ', 'Everest', 'Kilimanjaro', 'Núi Alps'], 'Nhật Bản được gọi là “xứ sở mặt trời mọc”.'],
  us:['Washington, D.C.', 'Lá cờ Hoa Kỳ có bao nhiêu ngôi sao?', ['50', '13', '48', '51'], 'Mỗi ngôi sao là một bang; 13 sọc là 13 bang đầu tiên.'],
  fr:['Paris', 'Ngọn tháp sắt nổi tiếng ở Paris là?', ['Tháp Eiffel', 'Tháp Pisa', 'Big Ben', 'Tháp Tokyo'], 'Tháp Eiffel cao khoảng 330 m.'],
  gb:['London', 'Chiếc đồng hồ nổi tiếng ở London tên là?', ['Big Ben', 'Eiffel', 'Colosseum', 'Rolex'], 'Big Ben thật ra là tên quả chuông lớn trong tháp.'],
  kr:['Seoul', 'Món rau muối nổi tiếng của Hàn Quốc là?', ['Kim chi', 'Sushi', 'Phở', 'Pizza'], 'Chữ viết Hàn Quốc tên là Hangul.'],
  de:['Berlin', 'Nước Đức nằm ở châu lục nào?', ['Châu Âu', 'Châu Á', 'Châu Phi', 'Châu Mỹ'], 'Đức nổi tiếng với ô tô và hơn 1.500 loại xúc xích.'],
  in:['New Delhi', 'Lăng mộ bằng đá trắng nổi tiếng ở Ấn Độ là?', ['Taj Mahal', 'Angkor Wat', 'Kim tự tháp Giza', 'Colosseum'], 'Ấn Độ là một trong những nước đông dân nhất thế giới.'],
  au:['Canberra', 'Con vật có túi nổi tiếng của Úc là?', ['Kangaroo', 'Gấu trúc', 'Lạc đà', 'Hổ'], 'Thủ đô Úc là Canberra, không phải Sydney.'],
  br:['Brasília', 'Rừng mưa nhiệt đới lớn nhất thế giới ở Brazil là?', ['Rừng Amazon', 'Sa mạc Sahara', 'Rừng Siberia', 'Rừng Cúc Phương'], 'Người Brazil nói tiếng Bồ Đào Nha.'],
  ca:['Ottawa', 'Chiếc lá trên cờ Canada là lá gì?', ['Lá phong', 'Lá sen', 'Lá tre', 'Lá thông'], 'Canada là nước rộng thứ hai thế giới.'],
  it:['Roma', 'Món ăn nổi tiếng thế giới đến từ Ý là?', ['Pizza', 'Kim chi', 'Bánh mì', 'Taco'], 'Đất nước Ý có hình chiếc ủng.'],
  th:['Bangkok', 'Con vật biểu tượng của Thái Lan là?', ['Con voi', 'Con gấu', 'Con kangaroo', 'Chim cánh cụt'], 'Thái Lan được gọi là “xứ sở chùa vàng”.'],
  id:['Jakarta', 'Indonesia được tạo thành từ hàng nghìn…?', ['Hòn đảo', 'Sa mạc', 'Sông băng', 'Núi tuyết'], 'Indonesia có hơn 17.000 hòn đảo.'],
  es:['Madrid', 'Người Tây Ban Nha nói tiếng gì?', ['Tiếng Tây Ban Nha', 'Tiếng Pháp', 'Tiếng Đức', 'Tiếng Nhật'], 'Tây Ban Nha nổi tiếng với điệu nhảy flamenco.'],
  nl:['Amsterdam', 'Hà Lan nổi tiếng với loài hoa nào?', ['Hoa tulip', 'Hoa sen', 'Hoa đào', 'Hoa mai'], 'Hà Lan có rất nhiều cối xay gió và kênh đào.'],
  se:['Stockholm', 'Giải thưởng khoa học nổi tiếng mang tên người Thụy Điển là?', ['Giải Nobel', 'Giải Oscar', 'Giải Grammy', 'Quả bóng vàng'], 'Alfred Nobel là nhà khoa học người Thụy Điển.'],
  mx:['Mexico City', 'Người Maya cổ xây công trình gì ở Mexico?', ['Kim tự tháp', 'Tháp Eiffel', 'Vạn Lý Trường Thành', 'Cầu Vàng'], 'Mexico là quê hương của cây ca cao và sô-cô-la.'],
  ar:['Buenos Aires', 'Argentina vô địch World Cup 2022 ở môn nào?', ['Bóng đá', 'Bóng rổ', 'Quần vợt', 'Bơi lội'], 'Điệu tango nổi tiếng ra đời ở Argentina.']
};
// 64 px apart (was 35), with a gap around the lighthouse
const V45P_FL = {x0:1600, dx:65, y:856}; // v47 golden: 40φ ≈ 65 between flag poles
const v45pFlagXY = i => { const x = V45P_FL.x0 + i*V45P_FL.dx; return [x > LIGHTHOUSE[0] - 70 ? x + 150 : x, V45P_FL.y]; };
function v45pPlaza(){ const x1 = v45pFlagXY(WORLD_FLAGS.length - 1)[0] + 40; if(VB.x1 < V45P_FL.x0 - 60 || VB.x0 > x1) return;
  const y = V45P_FL.y, done = v45pDay(V45P_FLAGK) > 0; rect('rgba(214,196,160,.55)', V45P_FL.x0 - 28, y - 6, LIGHTHOUSE[0] - 60 - V45P_FL.x0, 12); rect('rgba(214,196,160,.55)', LIGHTHOUSE[0] + 80, y - 6, x1 - LIGHTHOUSE[0] - 80, 12);
  WORLD_FLAGS.forEach(([c], i) => { const [x] = v45pFlagXY(i); rect('#eceff1', x, y - 66, 3, 66); rect('#90a4ae', x - 4, y - 3, 11, 5); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + 1.5, y - 67, 2.5, 0, 7); ctx.fill(); drawFlag(c, x + 3, y - 66 + Math.sin(realT*2.4 + i*.7)*.8, 29, 18); });
  const lb = done ? '🌍 CỜ CÁC NƯỚC · hẹn câu hỏi mới ngày mai' : '🌍 CỜ CÁC NƯỚC · chạm lá cờ để nhận câu hỏi 🎁'; ctx.font = '800 14px Nunito, sans-serif'; const lw = ctx.measureText(lb).width + 20; ctx.fillStyle = 'rgba(255,248,230,.92)'; ctx.fillRect(V45P_FL.x0 - 30, y - 107, lw, 21); ctx.fillStyle = '#5a4a2a'; ctx.fillText(lb, V45P_FL.x0 - 20, y - 92); }
function v45pFlagOpen(i){ const [code, name] = WORLD_FLAGS[i] || []; const Q = V45P_FQ[code]; if(!Q) return; const asked = v45pDay(V45P_FLAGK) > 0;
  let box = $('#v45pQ'); if(!box){ box = document.createElement('div'); box.id = 'v45pQ'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); document.body.appendChild(box); box.addEventListener('click', e => { if(e.target === box) box.hidden = true; }); addEventListener('keydown', e => { if(e.key === 'Escape' && !box.hidden) box.hidden = true; }); }
  box.innerHTML = '<div class="v45pcard"><button type="button" class="v45px" aria-label="Đóng">✕</button><canvas width="84" height="56"></canvas><h3></h3><p class="v45pcap"></p><p class="v45pq"></p><div class="v45popts"></div><p class="v45pfact"></p></div>';
  box.hidden = false; box.querySelector('.v45px').onclick = () => { box.hidden = true; };
  const fc = box.querySelector('canvas'); try { withCtx(fc.getContext('2d'), () => drawFlag(code, 2, 2, 80, 52)); } catch(e){}
  box.querySelector('h3').textContent = name; box.querySelector('.v45pcap').textContent = '🏛️ Thủ đô: ' + Q[0];
  const fact = box.querySelector('.v45pfact'), qp = box.querySelector('.v45pq'), ob = box.querySelector('.v45popts');
  if(asked){ qp.textContent = '📅 Hôm nay bạn đã trả lời câu hỏi rồi. Hẹn ngày mai nhé!'; fact.textContent = '💡 ' + Q[3]; return; }
  // alternate between a capital question and a fun-fact question by day
  const capQ = new Date().getDate() % 2 === 0, codes = Object.keys(V45P_FQ).filter(k => k !== code);
  let q, opts, ans; if(capQ){ q = `Thủ đô của ${name} là?`; ans = Q[0]; opts = [ans]; while(opts.length < 4){ const o = V45P_FQ[codes[Math.floor(Math.random()*codes.length)]][0]; if(!opts.includes(o)) opts.push(o); } box.querySelector('.v45pcap').textContent = '🌍 Câu hỏi hôm nay'; }
  else { q = Q[1]; ans = Q[2][0]; opts = Q[2].slice(); }
  opts.sort(() => Math.random() - .5); qp.textContent = '❓ ' + q;
  opts.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o; b.onclick = () => { if(ob.dataset.done) return; ob.dataset.done = 1; v45pDay(V45P_FLAGK, true); const ok = o === ans;
    ob.querySelectorAll('button').forEach(x => { x.disabled = true; if(x.textContent === ans) x.classList.add('ok'); else if(x === b) x.classList.add('no'); });
    fact.textContent = (ok ? '🎉 Chính xác! ' : '🙂 Chưa đúng, đáp án là: ' + ans + '. ') + '💡 ' + Q[3];
    if(ok){ try { reward(25, 15, `Câu hỏi cờ ${name}`); } catch(e){} try { blipSfx(1760); } catch(e){} } else { try { blipSfx(330); } catch(e){} }
    if(typeof PROF === 'undefined' || !PROF) fact.textContent += ' (Đăng nhập để nhận thưởng)'; }; ob.appendChild(b); }); }
// ---------- init ----------
function v45PondInit(){
  // every pond/lake: the new fishing game (the sea pier keeps the old fishing window)
  const of = openFishing; openFishing = function(spot){ if(spot === 'pond') return v45pOpenPond(0); return of.apply(this, arguments); };
  XHOT.push({r:{x:LAKE.cx - LAKE.rx*.9, y:LAKE.cy - LAKE.ry*.85, w:LAKE.rx*1.8, h:LAKE.ry*1.7}, f:() => v45pOpenPond(1)}, {r:{x:LOTUS.cx - LOTUS.rx*.9, y:LOTUS.cy - LOTUS.ry*.85, w:LOTUS.rx*1.8, h:LOTUS.ry*1.7}, f:() => v45pOpenPond(2)});
  // flag plaza: wider spacing, every flag is tappable
  drawFlagPlaza = v45pPlaza;
  WORLD_FLAGS.forEach((f, i) => { const [x, y] = v45pFlagXY(i); XHOT.unshift({r:{x:x - 16, y:y - 80, w:48, h:92}, f:() => v45pFlagOpen(i)}); });
  // canvas sizing: the pond canvas follows the screen shape like the balloon
  const oa = openArcade; openArcade = function(id){ const r = oa.apply(this, arguments); document.body.classList.toggle('v45pond', id === 'pond'); if(id === 'pond') try { v44Fit(); } catch(e){} return r; };
  addEventListener('resize', () => { if(ARC.id === 'pond' && document.body.classList.contains('v44arc') && ARC.s){ const [vw, vh] = v45pSize(), cv = $('#arcCv'); if(cv.width !== vw || cv.height !== vh){ cv.width = vw; cv.height = vh; const s = ARC.s, k = vh/s.vh; s.vw = vw; s.vh = vh; s.sy = Math.round(vh*.382); s.bot = vh - 34; s.dock = Math.round(vw*(vh > vw ? .382 : .236)); s.px = s.dock - 26; s.tip = [s.dock + (vh > vw ? 84 : 104), s.sy - (vh > vw ? 150 : 120)]; s.fish.forEach(f => { f.x = Math.min(vw - 20, f.x); f.y = f.by = s.sy + 26 + (f.by - s.sy)*k; }); } v44Fit(); } });
  // the edge fill behind the canvas: plain water colour for the pond (no blurred stretch)
  const fl = v44Fill; v44Fill = function(){ if(ARC.id === 'pond'){ const bg = $('#v44Bg'); if(bg){ if(bg.width !== 4){ bg.width = 4; bg.height = 4; } const g = bg.getContext('2d'); g.fillStyle = ARC.s && ARC.s.night ? '#0c1b33' : '#1d5f78'; g.fillRect(0, 0, 4, 4); } return; } return fl.apply(this, arguments); };
  // rewards: $1–20 with half pay from the 11th round of the day (computed in v45pEnd)
  const ar = arcReward; arcReward = function(id, s){ if(id === 'pond'){ if(!PROF){ loginNudge(); return; } const [m, e] = s.rw || [1, 6]; reward(e, m, 'Câu cá thư giãn'); return; } return ar.apply(this, arguments); };
}
