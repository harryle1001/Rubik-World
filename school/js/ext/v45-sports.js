// ================= EXT53 (v45 · Session 7): sports mini games redrawn for the real screen shape —
// Ski (5 mountain maps, one mode each), Football 3 vs 3 on a bigger pitch, Tanks (5 different tanks, big map with
// obstacles). Full screen like the v44 balloon, touch only on phones: swipe = move, tap = pass/shoot/fire, hold = power.
// Money follows the game rule: $1–20 per mini game, halved from the 11th reward of the day =================
// v47 golden: φ constants + tank obstacles placed on golden lines (0.146 · 0.382 · 0.618 · 0.854)
const V47G = {P:1.618, a:.382, b:.618};
function v47gTankWalls(W, H){ const o = [], t = 40, hl = 233, vl = 144;
  for(const [fx, sx] of [[.146, 1], [.854, -1]]) for(const [fy, sy] of [[.146, 1], [.854, -1]]){ const x = Math.round(W*fx), y = Math.round(H*fy);
    o.push([sx > 0 ? x : x - hl, sy > 0 ? y : y - t, hl, t], [sx > 0 ? x : x - t, sy > 0 ? y : y - vl, t, vl]); }
  o.push([Math.round(W/2 - 89), Math.round(H/2 - 55), 178, 110]); // golden rectangle in the centre
  for(const f of [.382, .618]) o.push([Math.round(W*f - t/2), Math.round(H/2 - 89), t, 178]);
  for(const f of [.236, .764]) o.push([Math.round(W/2 - 34), Math.round(H*f - 55), 68, 110]);
  return o; }
const V45SP = {pts:new Map(), spr:{}, ids:new Set(['ski', 'football', 'tanks'])};
const v45R = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
const v45On = () => !!(ARC.g && ARC.g.v45 && openModal && openModal.id === 'mArcade');
const v45AD = (a, b) => ((b - a + Math.PI*3) % (Math.PI*2)) - Math.PI;
const v45AL = (a, b, k) => a + v45AD(a, b)*Math.min(1, k);
const v45H = (a, b) => { const x = Math.sin(a*127.1 + b*311.7)*43758.5453; return x - Math.floor(x); };
function v45Size(){ const W = innerWidth, H = innerHeight; return H > W ? [480, Math.round(Math.min(1400, 480*H/W))] : [Math.round(Math.min(1400, 480*W/H)), 480]; }
function v45Canvas(){ const [vw, vh] = v45Size(), cv = $('#arcCv'); if(cv && (cv.width !== vw || cv.height !== vh)){ cv.width = vw; cv.height = vh; } return [vw, vh]; }
function v45spStart(){ V45SP.pts.clear(); }
function v45Spr(k, w, h, fn){ let s = V45SP.spr[k]; if(!s){ s = document.createElement('canvas'); s.width = w; s.height = h; fn(s.getContext('2d'), w, h); V45SP.spr[k] = s; } return s; }
function v45RR(c, x, y, w, h, r){ c.beginPath(); if(c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
// ---------- touch: swipe (floating stick) · tap · hold ----------
function v45Ptr(e, type){ if(!v45On()) return; const cv = $('#arcCv'), r = cv.getBoundingClientRect(), x = (e.clientX - r.left)/r.width*cv.width, y = (e.clientY - r.top)/r.height*cv.height, now = performance.now()/1000, P = V45SP.pts;
  if(type === 'down'){ const port = cv.height > cv.width; P.set(e.pointerId, {x0:x, y0:y, x, y, t0:now, moved:false, side:port ? (y > cv.height/2 ? 0 : 1) : (x < cv.width/2 ? 0 : 1)}); return; }
  const p = P.get(e.pointerId); if(!p) return;
  if(type === 'move'){ p.x = x; p.y = y; const dx = x - p.x0, dy = y - p.y0, d = Math.hypot(dx, dy); if(d > 14) p.moved = true; if(d > 70){ p.x0 = x - dx/d*70; p.y0 = y - dy/d*70; } return; }
  P.delete(e.pointerId); if(type !== 'up' || ARC.paused || !ARC.s || ARC.s.over || p.moved) return; const dur = now - p.t0, G = ARC.g;
  if(dur < .28){ if(G.tap) G.tap(ARC.s, p); } else if(G.release) G.release(ARC.s, p, dur); }
function v45Drag(side){ for(const p of V45SP.pts.values()){ if(!p.moved || (side != null && p.side !== side)) continue; const dx = p.x - p.x0, dy = p.y - p.y0, len = Math.hypot(dx, dy); if(len < 6) return {dx:0, dy:0, len:0, nx:0, ny:0}; return {dx, dy, len, nx:dx/len, ny:dy/len, k:Math.min(1, len/55)}; } return null; }
function v45Hold(side){ const now = performance.now()/1000; let m = 0; for(const p of V45SP.pts.values()) if(!p.moved && (side == null || p.side === side)) m = Math.max(m, now - p.t0); return m > .28 ? m : 0; }
function v45Stick(c){ for(const p of V45SP.pts.values()){ if(!p.moved) continue; c.fillStyle = 'rgba(255,255,255,.14)'; c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x0, p.y0, 56, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(p.x0 + clampV(p.x - p.x0, -56, 56), p.y0 + clampV(p.y - p.y0, -56, 56), 22, 0, 7); c.fill(); } }
// keyboard tap / hold on a key group (returns {tap} on a short press, {rel:seconds} on a long one, {hold} while down)
function v45Key(s, id, codes){ s._k = s._k || {}; const down = codes.some(c => ARC.code[c]), t0 = s._k[id];
  if(down){ if(t0 == null) s._k[id] = s.t; return {hold:s.t - (t0 == null ? s.t : t0)}; }
  if(t0 != null){ s._k[id] = null; const d = s.t - t0; return d < .25 ? {tap:1} : {rel:d}; } return {}; }
// ---------- shared HUD ----------
function v45Panel(c, W, H, h){ h = Math.max(h, 55); const w = Math.min(W - 26, Math.round(h*V47G.P*V47G.P*V47G.P*V47G.P)), x = (W - w)/2, y = H - h - 13; c.fillStyle = 'rgba(10,15,34,.84)'; v45RR(c, x, y, w, h, Math.round(h/V47G.P/V47G.P)); c.fill(); return [x, y, w]; }
function v45End(c, s, W, H){ c.fillStyle = 'rgba(5,8,20,.62)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = '900 34px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(s.over, W/2, H*V47G.a);
  c.font = '800 21px Nunito, sans-serif'; c.fillStyle = '#fff'; String(s.sub || '').split('\n').forEach((l, i) => c.fillText(l, W/2, H*V47G.a + 42 + i*34));
  if(s.paid){ c.font = '900 26px Nunito, sans-serif'; c.fillStyle = '#7cf29c'; c.fillText(`+$${s.paid}` + (s.half ? '  (từ lượt 11: ½)' : ''), W/2, H*V47G.a + 42 + String(s.sub || '').split('\n').length*34 + 13); } c.textAlign = 'left'; }
// reward: $1–20 by how well you played; from the 11th mini game reward of the day the money is halved
function v45Pay(s){ let k = {}; const d = new Date().toDateString(); try { k = JSON.parse(localStorage.getItem('truong-mini-day') || '{}'); } catch(e){} if(k.d !== d) k = {d, n:0}; k.n++; try { localStorage.setItem('truong-mini-day', JSON.stringify(k)); } catch(e){}
  let m = Math.round(1 + 19*clampV(s.perf || 0, 0, 1)); if(k.n > 10){ m = Math.max(1, Math.round(m/2)); s.half = true; } s.paid = m; return m; }

// ================= SKI: 5 mountain maps =================
// sky = skyline colours above the start, mt = mountain shape, edge = what lines the run, fall = snowfall strength
const V45SKI = [
  {n:'🌲 Đồi thông', L:11000, hw:y => 300 + Math.sin(y*.0007)*40, cx:y => Math.sin(y*.0011)*140, snow:'#f6faff', mark:'rgba(120,160,210,.22)', out:'#e4eef7', edge:'pine', grip:4, sky:['#8ec9f5', '#e9f6ff'], mt:'round', mc:['#a9c7e4', '#ffffff'], fall:0, goal:'Qua cổng cờ'},
  {n:'🧊 Sông băng', L:12500, hw:y => 235 + Math.sin(y*.0013)*30, cx:y => Math.sin(y*.0006)*90, snow:'#eaf6ff', mark:'rgba(80,150,210,.3)', out:'#bfe0f4', edge:'ice', grip:1.7, sky:['#5fa8e6', '#dff3ff'], mt:'jag', mc:['#7fb6e0', '#eefaff'], fall:0, goal:'Lao nhanh, nhảy qua khe băng'},
  {n:'🌙 Rừng đêm', L:10500, hw:() => 270, cx:y => Math.sin(y*.0009)*160 + Math.sin(y*.0023)*50, snow:'#d4dcf3', mark:'rgba(90,100,170,.25)', out:'#9aa6cf', edge:'birch', grip:3.6, sky:['#0b1036', '#2a2f6b'], mt:'twin', mc:['#26315f', '#dde4ff'], fall:1, dark:1, goal:'Nhặt đèn lồng trong đêm'},
  {n:'🪨 Hẻm đá', L:11000, hw:y => 155 + Math.sin(y*.0017)*35, cx:y => Math.sin(y*.0016)*190 + Math.sin(y*.0041)*40, snow:'#eef0f2', mark:'rgba(110,100,90,.25)', out:'#8d7b6a', edge:'rock', grip:3.4, sky:['#f1b27a', '#ffe2c0'], mt:'mesa', mc:['#9c6b4b', '#f4ece4'], fall:0, wall:1, goal:'Bay qua dốc nhảy'},
  {n:'🌨️ Bão tuyết', L:11500, hw:y => 290 + Math.sin(y*.001)*50, cx:y => Math.sin(y*.0008)*120, snow:'#f2f5f8', mark:'rgba(150,165,185,.35)', out:'#cbd3dd', edge:'drift', grip:3, sky:['#7d8a99', '#cfd8e2'], mt:'spire', mc:['#66768a', '#f4f7fb'], fall:2, wind:1, goal:'Cứu cờ hiệu trong bão'}
];
function v45Peak(kind, t){ const tri = x => 1 - Math.abs(2*(x - Math.floor(x)) - 1);
  if(kind === 'round') return .3 + .42*Math.sin(t*Math.PI) + .06*Math.sin(t*11);
  if(kind === 'jag') return .25 + .5*tri(t*3.2) + .06*tri(t*17) + .1*Math.sin(t*Math.PI);
  if(kind === 'twin') return .2 + .62*Math.max(Math.exp(-(((t - .382)/.13)**2)), .82*Math.exp(-(((t - .618)/.15)**2)));
  if(kind === 'mesa') return .25 + .5*Math.min(1, Math.max(0, Math.round((Math.sin(t*6.5) + 1)*1.5)/3)) + .04*Math.sin(t*40);
  return .12 + .82*Math.pow(Math.max(0, 1 - Math.abs(t - .618)*2.3), 1.5) + .04*tri(t*9); }
function v45Skyline(c, M, x, y, w, h){ const pts = []; for(let i=0;i<=48;i++){ const t = i/48; pts.push([x + t*w, y - v45Peak(M.mt, t)*h]); }
  c.fillStyle = M.mc[0]; c.beginPath(); c.moveTo(x, y); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(x + w, y); c.fill();
  c.save(); c.beginPath(); c.rect(x, y - h, w, h*.382); c.clip(); c.fillStyle = M.mc[1]; c.beginPath(); c.moveTo(x, y); pts.forEach(p => c.lineTo(p[0], p[1] + (M.mt === 'mesa' ? 2 : 0))); c.lineTo(x + w, y); c.fill(); c.restore(); }
function v45spTree(kind){ return v45Spr('tree-' + kind, 44, 64, (g) => {
  if(kind === 'pine'){ g.fillStyle = '#5a3a1e'; g.fillRect(19, 50, 6, 12); [[22, 6, 14, 26], [22, 18, 18, 38], [22, 30, 21, 52]].forEach(([x, t, w, b]) => { g.fillStyle = '#2e6b4a'; g.beginPath(); g.moveTo(x - w, b); g.lineTo(x + w, b); g.lineTo(x, t); g.fill(); g.fillStyle = '#245a3d'; g.beginPath(); g.moveTo(x, t); g.lineTo(x + w, b); g.lineTo(x, b); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - w*.45, t + (b - t)*.45); g.lineTo(x, t); g.lineTo(x + w*.35, t + (b - t)*.4); g.lineTo(x, t + (b - t)*.3); g.fill(); }); }
  else if(kind === 'birch'){ g.fillStyle = '#e8ecf5'; g.fillRect(19, 18, 6, 44); g.fillStyle = '#2a2f45'; for(let i=0;i<5;i++) g.fillRect(i % 2 ? 19 : 22, 24 + i*8, 3, 2); g.fillStyle = '#3d4a7a'; g.beginPath(); g.ellipse(22, 18, 17, 16, 0, 0, 7); g.fill(); g.fillStyle = '#56649c'; g.beginPath(); g.ellipse(17, 13, 9, 8, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(230,236,255,.85)'; g.beginPath(); g.ellipse(22, 7, 13, 5, 0, 0, 7); g.fill(); }
  else if(kind === 'ice'){ g.fillStyle = '#8fd3f4'; g.beginPath(); g.moveTo(6, 60); g.lineTo(14, 14); g.lineTo(24, 4); g.lineTo(32, 20); g.lineTo(40, 60); g.fill(); g.fillStyle = '#d8f3ff'; g.beginPath(); g.moveTo(14, 14); g.lineTo(24, 4); g.lineTo(22, 40); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(26, 12); g.lineTo(30, 44); g.stroke(); }
  else if(kind === 'rock'){ g.fillStyle = '#6d5b4d'; g.beginPath(); g.moveTo(3, 60); g.lineTo(9, 30); g.lineTo(22, 18); g.lineTo(36, 28); g.lineTo(41, 60); g.fill(); g.fillStyle = '#8f7a68'; g.beginPath(); g.moveTo(9, 30); g.lineTo(22, 18); g.lineTo(24, 40); g.lineTo(12, 46); g.fill(); g.fillStyle = '#f4f4f4'; g.beginPath(); g.moveTo(16, 23); g.lineTo(22, 18); g.lineTo(30, 23); g.lineTo(22, 26); g.fill(); }
  else { g.fillStyle = '#e3e9f0'; g.beginPath(); g.ellipse(22, 52, 21, 11, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(18, 48, 14, 7, 0, 0, 7); g.fill(); g.fillStyle = '#c62828'; g.fillRect(30, 18, 3, 34); g.fillStyle = '#fff'; g.fillRect(30, 24, 3, 4); g.fillRect(30, 36, 3, 4); } }); }
GAMES.ski = {
  title:'Trượt tuyết 5 ngọn núi', opts:V45SKI.map(m => m.n), v45:1, v44top:0,
  help:'👆 Vuốt trái/phải để nghiêng ván rẽ. 👇 Vuốt xuống để lao nhanh, 👆 vuốt lên để phanh. 👉 Chạm để bật nhảy. 🌲 Đồi thông: qua cổng cờ. 🧊 Sông băng: mặt băng trơn, nhảy qua khe nứt. 🌙 Rừng đêm: nhặt đèn lồng. 🪨 Hẻm đá: bay qua dốc nhảy. 🌨️ Bão tuyết: gió đẩy ngang, cứu cờ hiệu. ⌨️ Mũi tên + Space.',
  init(o){ o = o || 0; const [vw, vh] = v45Canvas(); v45spStart(); const M = V45SKI[o], R = v45R(77 + o*31), obs = [], it = [], L = M.L;
    const inC = (y, m) => M.cx(y) + (R()*2 - 1)*(M.hw(y) - m), near = (x, y, d) => it.some(q => Math.abs(q.y - y) < d && Math.abs((q.x != null ? q.x : M.cx(q.y)) - x) < d*1.6);
    if(o === 0) for(let y=420, k=0; y < L - 300; y += 300, k++) it.push({k:'gate', y, x:M.cx(y) + (R()*2 - 1)*(M.hw(y) - 100), w:62, c:k % 2});
    if(o === 1){ for(let y=500; y < L - 400; y += 230 + R()*120) it.push({k:'ice', y, x:inC(y, 80), rx:70 + R()*70, ry:26 + R()*22}); for(let y=1100; y < L - 400; y += 700 + R()*200){ const g = inC(y, 90); it.push({k:'crev', y, gx:g, gw:96}); } for(let y=800; y < L - 400; y += 520) it.push({k:'boost', y:y + 90, x:inC(y + 90, 60)}); }
    if(o === 2) for(let y=300; y < L - 200; y += 120){ const x = M.cx(y) + Math.sin(y*.004)*M.hw(y)*.6; it.push({k:'lamp', y, x}); }
    if(o === 3) for(let y=700; y < L - 300; y += 560 + R()*120) it.push({k:'ramp', y, x:inC(y, 70), w:84});
    if(o === 4){ for(let y=600; y < L - 300; y += 480) it.push({k:'flag', y, x:inC(y, 60)}); for(let y=400; y < L - 300; y += 300 + R()*200) it.push({k:'drift', y, x:inC(y, 60), rx:80 + R()*50, ry:30}); }
    const nObs = [95, 60, 120, 80, 76][o], kinds = [['pine', 'pine', 'rock'], ['ice', 'rock'], ['birch'], ['rock', 'rock'], ['rock', 'drift']][o];
    for(let i=0;i<nObs;i++){ const y = 380 + R()*(L - 600), x = inC(y, 28); if(near(x, y, 60)) continue; obs.push({x, y, k:kinds[Math.floor(R()*kinds.length)], r:16}); }
    obs.sort((a, b) => a.y - b.y); it.sort((a, b) => a.y - b.y);
    const fl = []; for(let i=0;i<(M.fall === 2 ? 150 : M.fall ? 70 : 24);i++) fl.push({x:R(), y:R(), z:.4 + R()*.8});
    const cnt = k => it.filter(q => q.k === k).length;
    return {o, M, vw, vh, x:M.cx(0), y:0, a:0, ta:0, sp:0, vx:0, z:0, vz:0, cam:M.cx(0), t:0, pen:0, miss:0, crash:0, crashes:0, stars:0, starsN:cnt('lamp'), flags:0, flagsN:cnt('flag'), rampN:cnt('ramp'), air:0, airBig:0, boost:0, wind:0, windT:0, wg:2, obs, it, fl, trail:[], tt:0, look:PLAYER ? Object.assign({}, PLAYER) : agentLook(4, {shirt:'#ef4b4b'}), msg:M.goal, msgT:2.4}; },
  tap(s){ this.jump(s, 330); },
  jump(s, v, ramp){ if(s.z > 0 || s.crash > 0) return; s.fromRamp = !!ramp; s.vz = v; s.z = .1; blipSfx(660); },
  update(s, dt){
    if(s.over) return; const M = s.M; s.t += dt; s.msgT -= dt;
    s.cam += (s.x - s.cam)*Math.min(1, dt*3);
    if(s.crash > 0){ s.crash -= dt; s.sp *= Math.pow(.05, dt); s.y += s.sp*dt*.3; s.vx *= .9; return; }
    const d = v45Drag(); let tuck = KD(), brake = KU();
    if(d){ s.ta = clampV(d.dx/50, -1, 1)*1.25; s.a += (s.ta - s.a)*Math.min(1, dt*5); if(d.dy > 30) tuck = true; if(d.dy < -30) brake = true; s.tch = 1; }
    else { if(KL()) s.a -= dt*2.4; if(KR()) s.a += dt*2.4; if(s.tch && !KL() && !KR()) s.a *= Math.pow(.25, dt); }
    if(pressed('Space') || pressed('Act')) this.jump(s, 330);
    s.a = clampV(s.a, -1.35, 1.35);
    const cx = M.cx(s.y), hw = M.hw(s.y), off = Math.abs(s.x - cx) - hw; let onIce = false, inDrift = false;
    for(const q of s.it){ if(q.y < s.y - 80) continue; if(q.y > s.y + 80) break;
      if(q.k === 'ice' && ((s.x - q.x)/q.rx)**2 + ((s.y - q.y)/q.ry)**2 < 1) onIce = true;
      if(q.k === 'drift' && ((s.x - q.x)/q.rx)**2 + ((s.y - q.y)/q.ry)**2 < 1) inDrift = true; }
    const grip = M.grip*(onIce ? .3 : 1); let tgt = 150 + 380*Math.cos(s.a); if(tuck) tgt += 150; if(brake) tgt *= .35; if(onIce) tgt *= 1.12; if(inDrift && s.z <= 0) tgt *= .5; if(off > 0 && !M.wall) tgt *= .42; if(s.boost > 0){ s.boost -= dt; tgt += 240; }
    s.sp += (tgt - s.sp)*Math.min(1, dt*1.4);
    s.vx += (Math.sin(s.a)*s.sp - s.vx)*Math.min(1, dt*grip);
    if(M.wind){ s.wg -= dt; if(s.wg <= 0){ s.wg = 2.5 + Math.random()*2.5; s.windT = (Math.random()*2 - 1)*170; } s.wind += (s.windT - s.wind)*Math.min(1, dt*.8); s.vx += s.wind*dt*1.2; }
    const py = s.y; s.x += s.vx*dt; s.y += Math.cos(s.a)*s.sp*dt;
    if(s.z > 0){ s.vz -= 900*dt; s.z += s.vz*dt; if(s.fromRamp) s.air += dt; if(s.z <= 0){ s.z = 0; s.vz = 0; kickSfx(.3); } }
    if(M.wall){ const c2 = M.cx(s.y), h2 = M.hw(s.y) - 10; if(Math.abs(s.x - c2) > h2){ s.x = c2 + Math.sign(s.x - c2)*h2; s.vx *= -.4; s.a *= .3; if(s.sp > 200){ s.sp *= .72; kickSfx(.6); } } }
    else s.x = clampV(s.x, cx - hw - 260, cx + hw + 260);
    s.tt -= dt; if(s.tt <= 0){ s.tt = .04; s.trail.push([s.x, s.y, s.a, s.z > 0]); if(s.trail.length > 70) s.trail.shift(); }
    if(s.z < 10) for(const ob of s.obs){ if(ob.y < s.y - 30) continue; if(ob.y > s.y + 30) break; if(Math.hypot(ob.x - s.x, ob.y - s.y) < ob.r){ s.crash = .9; s.pen += 1; s.crashes++; s.sp *= .2; s.y += 22; kickSfx(1); s.msg = 'Ối! +1 giây'; s.msgT = 1; break; } }
    for(const q of s.it){ if(q.y < py - 120) continue; if(q.y > s.y + 120) break;
      if(q.k === 'gate' && !q.done && py < q.y && s.y >= q.y){ q.done = 1; q.ok = Math.abs(s.x - q.x) < q.w; if(q.ok) blipSfx(1320); else { s.pen += 3; s.miss++; blipSfx(220); s.msg = 'Lỡ cổng +3 giây'; s.msgT = 1.2; } }
      if(q.k === 'crev' && !q.done && py < q.y && s.y >= q.y){ q.done = 1; if(s.z <= 4 && Math.abs(s.x - q.gx) > q.gw/2){ s.crash = 1.3; s.pen += 2; s.crashes++; s.sp *= .2; s.y += 30; kickSfx(1); s.msg = 'Rơi khe băng! +2 giây'; s.msgT = 1.4; } else blipSfx(1100); }
      if(q.k === 'boost' && !q.done && Math.hypot(q.x - s.x, q.y - s.y) < 40){ q.done = 1; s.boost = 1.3; blipSfx(1500); }
      if(q.k === 'lamp' && !q.done && Math.hypot(q.x - s.x, q.y - s.y) < 34){ q.done = 1; s.stars++; blipSfx(1760); }
      if(q.k === 'flag' && !q.done && Math.hypot(q.x - s.x, q.y - s.y) < 40){ q.done = 1; s.flags++; blipSfx(1500); s.msg = `Cứu cờ hiệu ${s.flags}/${s.flagsN}`; s.msgT = 1; }
      if(q.k === 'ramp' && !q.done && s.z <= 0 && Math.abs(s.x - q.x) < q.w/2 && py < q.y && s.y >= q.y){ q.done = 1; this.jump(s, 360 + s.sp*.35, 1); s.msg = 'Bay nào! ✨'; s.msgT = 1; } }
    if(s.y >= M.L){ const tot = s.t + s.pen, par = M.L/430, ts = clampV((par*1.7 - tot)/(par*.9), 0, 1);
      s.perf = [ts*.6 + (1 - Math.min(1, s.miss/6))*.4, ts, (s.starsN ? s.stars/s.starsN : 0)*.75 + ts*.25, ts*.6 + Math.min(1, s.air/Math.max(1, s.rampN*.9))*.4, (s.flagsN ? s.flags/s.flagsN : 0)*.6 + ts*.4][s.o];
      const key = s.o ? 'truong-ski-best-' + s.o : 'truong-ski-best'; let best = null; try { best = +localStorage.getItem(key) || null; if(!best || tot < best) localStorage.setItem(key, tot.toFixed(2)); } catch(e){}
      s.over = `Về đích: ${tot.toFixed(1)} giây`;
      s.sub = [`Lỡ ${s.miss} cổng · phạt +${s.pen} giây`, `Ngã ${s.crashes} lần · phạt +${s.pen} giây`, `🏮 ${s.stars}/${s.starsN} đèn lồng`, `Bay ${s.air.toFixed(1)} giây trên không`, `🚩 Cứu ${s.flags}/${s.flagsN} cờ hiệu`][s.o] + (best ? `\nKỷ lục: ${Math.min(best, tot).toFixed(1)} giây` : '');
      cheerSfx(); if(s.perf >= .5) mprog('ski'); }
  },
  draw(s, c){ const W = c.canvas.width, H = c.canvas.height, M = s.M, py = H*.382, oy = s.y - py, ox = s.cam - W/2, y0 = oy - 70, y1 = oy + H + 70;
    c.fillStyle = M.snow; c.fillRect(0, 0, W, H);
    // snow texture: moguls / ice cracks / gravel / drifts — fixed in the world
    c.strokeStyle = M.mark; c.lineWidth = 2; c.beginPath();
    for(let r = Math.floor(y0/54); r*54 < y1; r++) for(let k=0;k<3;k++){ const wy = r*54 + v45H(r, k)*40, wx = M.cx(wy) + (v45H(k, r)*2 - 1)*(M.hw(wy) + 120), x = wx - ox, y = wy - oy;
      if(s.o === 1){ c.moveTo(x, y); c.lineTo(x + 18, y + 6); c.lineTo(x + 30, y + 2); } else if(s.o === 3){ c.moveTo(x + 2, y); c.arc(x, y, 2, 0, 7); } else { c.moveTo(x - 20, y); c.quadraticCurveTo(x, y - 9, x + 20, y); } }
    c.stroke();
    // trail
    if(s.trail.length > 1){ c.strokeStyle = 'rgba(120,140,170,.35)'; c.lineWidth = 2; for(const sd of [-5, 5]){ c.beginPath(); let pen = false; s.trail.forEach(([tx, ty, ta, air]) => { if(air){ pen = false; return; } const X = tx - ox + Math.cos(ta)*sd, Y = ty - oy; if(pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; } }); c.stroke(); } }
    // outside the run (deep snow, ice walls, canyon walls, drifts)
    const edgeCol = M.out; c.fillStyle = edgeCol;
    for(const sg of [-1, 1]){ c.beginPath(); c.moveTo(sg < 0 ? -10 : W + 10, -20); for(let sy = -20; sy <= H + 20; sy += 16){ const wy = sy + oy; c.lineTo(M.cx(wy) + sg*M.hw(wy) - ox + sg*(M.wall ? 0 : 6), sy); } c.lineTo(sg < 0 ? -10 : W + 10, H + 20); c.fill();
      if(M.wall || s.o === 1){ c.strokeStyle = M.wall ? '#5d4c3e' : '#7cc1e8'; c.lineWidth = 4; c.beginPath(); for(let sy = -20; sy <= H + 20; sy += 16){ const wy = sy + oy, X = M.cx(wy) + sg*M.hw(wy) - ox; sy === -20 ? c.moveTo(X, sy) : c.lineTo(X, sy); } c.stroke(); } }
    // edge scenery
    const spr = v45spTree(M.edge === 'drift' ? 'drift' : M.edge);
    for(let r = Math.floor(y0/64); r*64 < y1; r++) for(const sg of [-1, 1]) for(let k=0;k<2;k++){ const wy = r*64 + v45H(r, sg + k*3)*30, X = M.cx(wy) + sg*(M.hw(wy) + 26 + k*70 + v45H(sg, r + k)*40) - ox, Y = wy - oy; if(X < -40 || X > W + 40) continue; c.drawImage(spr, X - 22, Y - 58); }
    // start banner + summit skyline above the start
    if(oy < H){ const ty = -oy; if(ty > -10){ const g = c.createLinearGradient(0, 0, 0, ty); g.addColorStop(0, M.sky[0]); g.addColorStop(1, M.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, ty - 20); v45Skyline(c, M, -40, ty - 18, W + 80, Math.min(260, ty + 40)); c.fillStyle = M.snow; c.fillRect(0, ty - 22, W, 26); }
      const sx = M.cx(0) - ox, hw0 = M.hw(0); c.fillStyle = '#455a64'; c.fillRect(sx - hw0*.6, ty - 46, 5, 50); c.fillRect(sx + hw0*.6 - 5, ty - 46, 5, 50); c.fillStyle = '#ef4b4b'; c.fillRect(sx - hw0*.6, ty - 50, hw0*1.2, 20); c.font = '900 16px Nunito, sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('XUẤT PHÁT', sx, ty - 35); c.textAlign = 'left'; }
    // items
    for(const q of s.it){ if(q.y < y0) continue; if(q.y > y1) break; const y = q.y - oy;
      if(q.k === 'gate'){ const col = q.c ? '#3d7bff' : '#ef4b4b'; [q.x - q.w, q.x + q.w].forEach(x => { x -= ox; c.fillStyle = '#555'; c.fillRect(x - 1, y - 26, 3, 28); c.fillStyle = col; c.fillRect(x + 2, y - 26, 14, 10); }); if(q.done){ c.font = '900 20px Nunito, sans-serif'; c.fillStyle = q.ok ? '#2fbf71' : '#ef4b4b'; c.fillText(q.ok ? '✓' : '+3s', q.x - ox - 8, y - 32); } }
      else if(q.k === 'ice'){ c.fillStyle = 'rgba(150,215,245,.7)'; c.beginPath(); c.ellipse(q.x - ox, y, q.rx, q.ry, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(q.x - ox - q.rx*.5, y - 4); c.lineTo(q.x - ox + q.rx*.3, y - q.ry*.4); c.stroke(); }
      else if(q.k === 'crev'){ const cx = M.cx(q.y), hw = M.hw(q.y); c.fillStyle = '#1d5f8a'; for(const [a, b] of [[cx - hw - 60, q.gx - q.gw/2], [q.gx + q.gw/2, cx + hw + 60]]){ c.beginPath(); c.moveTo(a - ox, y); for(let x = a; x <= b; x += 24) c.lineTo(x - ox, y - 7 + (v45H(x, q.y) - .5)*6); c.lineTo(b - ox, y + 8); c.lineTo(a - ox, y + 8); c.fill(); } c.fillStyle = '#7fd3ff'; c.fillRect(q.gx - q.gw/2 - ox, y - 2, q.gw, 4); }
      else if(q.k === 'boost'){ c.fillStyle = q.done ? 'rgba(255,210,63,.35)' : '#ffd23f'; for(let i=0;i<3;i++){ const yy = y - 16 + i*14; c.beginPath(); c.moveTo(q.x - ox - 16, yy); c.lineTo(q.x - ox, yy + 10); c.lineTo(q.x - ox + 16, yy); c.lineTo(q.x - ox + 16, yy + 5); c.lineTo(q.x - ox, yy + 15); c.lineTo(q.x - ox - 16, yy + 5); c.fill(); } }
      else if(q.k === 'lamp' && !q.done){ const b = Math.sin(s.t*3 + q.y)*3; c.fillStyle = 'rgba(255,200,80,.25)'; c.beginPath(); c.arc(q.x - ox, y + b, 20, 0, 7); c.fill(); c.fillStyle = '#ff7043'; v45RR(c, q.x - ox - 8, y - 10 + b, 16, 20, 6); c.fill(); c.fillStyle = '#ffe082'; c.fillRect(q.x - ox - 4, y - 5 + b, 8, 10); }
      else if(q.k === 'ramp'){ c.fillStyle = '#90a4ae'; c.beginPath(); c.moveTo(q.x - ox - q.w/2, y + 14); c.lineTo(q.x - ox + q.w/2, y + 14); c.lineTo(q.x - ox + q.w/2 - 8, y - 18); c.lineTo(q.x - ox - q.w/2 + 8, y - 18); c.fill(); c.fillStyle = '#fff'; c.fillRect(q.x - ox - q.w/2 + 8, y - 18, q.w - 16, 8); c.fillStyle = '#ff8a2b'; c.fillRect(q.x - ox - q.w/2, y + 10, q.w, 4); }
      else if(q.k === 'drift'){ c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(q.x - ox, y, q.rx, q.ry, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(160,175,195,.35)'; c.beginPath(); c.ellipse(q.x - ox, y + q.ry*.4, q.rx*.9, q.ry*.45, 0, 0, 7); c.fill(); }
      else if(q.k === 'flag' && !q.done){ c.fillStyle = '#455a64'; c.fillRect(q.x - ox - 1, y - 34, 3, 36); c.fillStyle = '#ff7043'; c.beginPath(); c.moveTo(q.x - ox + 2, y - 34); c.lineTo(q.x - ox + 24, y - 27 + Math.sin(s.t*8)*2); c.lineTo(q.x - ox + 2, y - 20); c.fill(); c.fillStyle = 'rgba(255,112,67,.25)'; c.beginPath(); c.arc(q.x - ox, y, 26, 0, 7); c.fill(); } }
    // obstacles
    for(const ob of s.obs){ if(ob.y < y0) continue; if(ob.y > y1) break; c.drawImage(v45spTree(ob.k), ob.x - ox - 22, ob.y - oy - 56); }
    // finish line
    const fy = M.L - oy; if(fy < H + 20){ const cx = M.cx(M.L) - ox, hw = M.hw(M.L); for(let x = cx - hw; x < cx + hw; x += 20){ c.fillStyle = Math.round((x - cx)/20) % 2 ? '#111' : '#fff'; c.fillRect(x, fy, 20, 10); c.fillStyle = Math.round((x - cx)/20) % 2 ? '#fff' : '#111'; c.fillRect(x, fy + 10, 20, 10); } }
    // skier
    const sx = s.x - ox, sy = py - s.z*.55; c.fillStyle = 'rgba(40,60,90,.22)'; c.beginPath(); c.ellipse(sx, py + 12, 14 - Math.min(6, s.z*.04), 5, 0, 0, 7); c.fill();
    withCtx(c, () => { ctx.save(); ctx.translate(sx, sy); if(s.crash > 0) ctx.rotate(1.3); ctx.save(); ctx.rotate(-s.a); ctx.fillStyle = '#263238'; ctx.fillRect(-7, -6, 4, 26); ctx.fillRect(3, -6, 4, 26); ctx.fillStyle = '#ef4b4b'; ctx.fillRect(-7, 16, 4, 4); ctx.fillRect(3, 16, 4, 4); ctx.restore(); ctx.rotate(-s.a*.35); ctx.translate(0, 10); ctx.scale(1.5, 1.5); const f = s.look; f.dir = s.a < 0 ? -1 : 1; f.moving = false; f.walk = 0; drawBody(f, false); ctx.restore(); });
    if(s.boost > 0){ c.fillStyle = 'rgba(255,210,63,.5)'; for(let i=0;i<4;i++) c.fillRect(sx - 10 + i*6, py - 40 - Math.random()*14, 2, 12); }
    // night: lantern light around you
    if(M.dark){ const dk = v45Spr('dark', 128, 128, (g) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(8,10,40,0)'); r.addColorStop(.25, 'rgba(8,10,40,.1)'); r.addColorStop(.6, 'rgba(8,10,40,.68)'); r.addColorStop(1, 'rgba(6,8,30,.9)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), S = Math.max(W, H)*2.3; c.drawImage(dk, sx - S/2, py - S/2, S, S);
      c.fillStyle = 'rgba(120,255,200,.13)'; c.beginPath(); c.moveTo(0, 0); for(let x=0;x<=W;x+=20) c.lineTo(x, 40 + Math.sin(x*.012 + s.t*.5)*18); c.lineTo(W, 0); c.fill(); }
    // snowfall / blizzard
    if(M.fall || s.o === 1){ const blz = M.fall === 2, wx = blz ? s.wind*.0006 : 0; c.fillStyle = blz ? 'rgba(255,255,255,.85)' : s.o === 1 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.8)';
      for(const f of s.fl){ const x = ((f.x + s.t*wx*f.z + s.cam*.0004*f.z) % 1 + 1) % 1*W, y = ((f.y - (blz ? s.t*.5 : s.t*.08)*f.z + s.y*.0009*f.z) % 1 + 1) % 1*H; if(s.o === 1){ if(v45H(f.x, Math.floor(s.t*2)) > .7) c.fillRect(x, y, 2, 2); } else if(blz) c.fillRect(x, y, 2 + f.z*2, 1.5); else c.fillRect(x, y, 2*f.z + 1, 2*f.z + 1); }
      if(blz){ c.fillStyle = 'rgba(225,232,240,.28)'; c.fillRect(0, 0, W, H); const ar = s.wind/170; c.save(); c.translate(W/2, 86); c.globalAlpha = Math.min(1, Math.abs(ar)*1.5); c.fillStyle = '#fff'; c.font = '900 28px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText(ar < 0 ? '⟵ gió' : 'gió ⟶', 0, 0); c.restore(); } }
    v45Stick(c);
    // HUD: mini mountain with your progress + time
    const [px, pyy, pw] = v45Panel(c, W, H, 68), prog = clampV(s.y/M.L, 0, 1), mx = px + 13, my = pyy + 55, mw = 89, mh = 34; v45Skyline(c, M, mx, my, mw, mh);
    const t0 = M.mt === 'twin' ? .382 : M.mt === 'spire' ? .618 : M.mt === 'round' ? .5 : .4, tt = t0 + (1 - t0)*prog; c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(mx + tt*mw, my - v45Peak(M.mt, tt)*mh, 5, 0, 7); c.fill();
    c.font = '800 21px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(`⏱ ${(s.t + s.pen).toFixed(1)}s` + (s.pen ? ` (+${s.pen})` : ''), px + 115, pyy + 29);
    c.fillStyle = '#fff'; c.fillText([`🚩 ${s.it.filter(q => q.done && q.ok).length}/${s.it.length} cổng`, `${Math.round(s.sp/6)} km/h`, `🏮 ${s.stars}/${s.starsN}`, `✈ ${s.air.toFixed(1)}s`, `🚩 ${s.flags}/${s.flagsN}`][s.o] + ` · ${Math.max(0, Math.ceil((M.L - s.y)/10))} m`, px + 115, pyy + 55);
    if(s.msgT > 0 && !s.over){ c.globalAlpha = Math.min(1, s.msgT*2); c.font = '900 26px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = 'rgba(10,15,34,.7)'; c.strokeText(s.msg, W/2, H*V47G.b); c.fillStyle = '#fff'; c.fillText(s.msg, W/2, H*V47G.b); c.textAlign = 'left'; c.globalAlpha = 1; }
    if(s.over) v45End(c, s, W, H);
  }
};

// ================= FOOTBALL 3 vs 3 (+ robot keepers) =================
const V45FB = {L:1300, Wd:803, GW:210}; // v47 golden: L/Wd = φ
GAMES.football = {
  title:'Bóng đá 3 đánh 3', opts:['Đấu máy · dễ', 'Đấu máy · khó', '2 người 1 máy'], v45:1, v44top:0,
  help:'👆 Vuốt để chạy theo hướng ngón tay. 👉 Chạm nhanh: chuyền bóng cho bạn (gần khung thành thì sút). ✊ Giữ lâu rồi thả: sút thật mạnh. 🏃 Không có bóng: chạm để lao vào cướp bóng. Người có vòng vàng là bạn. ⌨️ Mũi tên/WASD + Space. 2 người: WASD + Space và mũi tên + Enter (điện thoại: mỗi người một nửa màn hình). Trận 2 phút rưỡi.',
  init(o){ o = o || 0; const [vw, vh] = v45Canvas(); v45spStart(); const L = V45FB.L, Wd = V45FB.Wd, home = [[.236, .5], [.382, .236], [.5, .764]], p = [];
    for(const team of [0, 1]) for(let r=0;r<3;r++) p.push({team, role:r, u:0, v:0, vu:0, vv:0, fu:team ? -1 : 1, fv:0, walk:0, cd:0, dash:0, think:0, sd:team ? -1 : 1, look:agentLook(team*3 + r + 2, {shirt:team ? '#ef4b4b' : '#3d7bff', pants:team ? '#7a1f1f' : '#1b2f6b'})});
    const k = [0, 1].map(team => ({team, gk:true, u:team ? L - 24 : 24, v:Wd/2, vu:0, vv:0, fu:team ? -1 : 1, fv:0, walk:0, cd:0, dash:0, hold:0, sd:team ? -1 : 1, look:agentLook(team + 9, {shirt:team ? '#ffb300' : '#2fbf71', pants:'#263238'})}));
    if(PLAYER){ try { p[0].look = Object.assign({}, PLAYER, {shirt:'#3d7bff'}); } catch(e){} }
    const s = {port:vh > vw, L, Wd, home, p, k, b:{u:L/2, v:Wd/2, vu:0, vv:0, owner:null, rot:0}, sc:[0, 0], time:150, freeze:1.6, msg:'Bắt đầu! ⚽', msgT:1.6, two:o === 2, diff:o === 1 ? 1 : 0, ctl:[0, 3], sw:[0, 0], act:[null, null], charge:[0, 0], t:0, camx:0, camy:0};
    this.kickoff(s); const [fx, fy] = this.ts(s, L/2, Wd/2); s.camx = fx; s.camy = fy; return s; },
  ts(s, u, v){ return s.port ? [v, s.L - u] : [u, v]; },
  sd(s, dx, dy){ return s.port ? [-dy, dx] : [dx, dy]; },
  kickoff(s){ s.p.forEach(p => { const [hu, hv] = s.home[p.role]; p.u = (p.team ? 1 - hu*.85 : hu*.85)*s.L; p.v = hv*s.Wd; p.vu = p.vv = 0; p.cd = 0; }); s.k.forEach(k => { k.u = k.team ? s.L - 24 : 24; k.v = s.Wd/2; }); Object.assign(s.b, {u:s.L/2, v:s.Wd/2, vu:0, vv:0, owner:null}); s.freeze = 1.6; },
  side(s, p){ return s.two ? p.side : 0; },
  tap(s, p){ s.act[this.side(s, p)] = {k:'tap'}; },
  release(s, p, dur){ s.act[this.side(s, p)] = {k:'shot', pw:Math.min(1, (dur - .2)/1)}; },
  kick(s, p, du, dv, sp){ const B = s.b, d = Math.hypot(du, dv) || 1; B.owner = null; B.vu = du/d*sp; B.vv = dv/d*sp; B.u = p.u + du/d*15; B.v = p.v + dv/d*15; p.cd = .35; kickSfx(Math.min(1, sp/700)); },
  shoot(s, p, pw, aim){ const k = s.k[1 - p.team], gu = p.team ? -10 : s.L + 10, GW = V45FB.GW; let tv = s.Wd/2 + (k.v > s.Wd/2 ? -1 : 1)*GW*.34; if(aim) tv += aim*GW*.3; if(!p.human) tv += (Math.random() - .5)*GW*(s.diff ? .5 : .95); this.kick(s, p, gu - p.u, tv - p.v, 380 + 560*pw); },
  passTo(s, p, m){ const tu = m.u + m.vu*.35, tv = m.v + m.vv*.35, d = Math.hypot(tu - p.u, tv - p.v); this.kick(s, p, tu - p.u, tv - p.v, Math.min(760, d*1.15 + 110)); m.cd = 0; if(s.p.includes(m) && (m.team === 0 || s.two) && s.p.some(q => q.human && q.team === m.team)) s.ctl[m.team] = s.p.indexOf(m); },
  pass(s, p){ const dir = p.team ? -1 : 1; let best = null, bs = -1e9; s.p.forEach(m => { if(m === p || m.team !== p.team) return; const d = Math.hypot(m.u - p.u, m.v - p.v), opp = Math.min(...s.p.filter(q => q.team !== p.team).map(q => Math.hypot(q.u - m.u, q.v - m.v))), sc = (m.u - p.u)*dir*.8 - Math.abs(d - 280)*.4 + Math.min(opp, 160)*.8; if(sc > bs){ bs = sc; best = m; } }); if(best) this.passTo(s, p, best); },
  gd(s, p){ return Math.hypot((p.team ? 0 : s.L) - p.u, s.Wd/2 - p.v); },
  human(s, team, dt){ const P = s.p, B = s.b; let ci = s.ctl[team];
    if(B.owner && B.owner.team === team && !B.owner.gk) ci = P.indexOf(B.owner);
    else { s.sw[team] -= dt; if(s.sw[team] <= 0){ s.sw[team] = .35; let bd = 1e9; P.forEach((p, i) => { if(p.team !== team) return; const d = Math.hypot(p.u - B.u, p.v - B.v) - (i === ci ? 50 : 0); if(d < bd){ bd = d; ci = i; } }); } }
    s.ctl[team] = ci; P.forEach((p, i) => { if(p.team === team) p.human = i === ci; }); const me = P[ci];
    const d = v45Drag(s.two ? team : null); let mu = 0, mv = 0, mag = 0;
    if(d && d.len){ [mu, mv] = this.sd(s, d.nx, d.ny); mag = d.k; }
    else { const L2 = s.two ? (team ? kd('ArrowLeft') : kd('KeyA')) : KL(), R2 = s.two ? (team ? kd('ArrowRight') : kd('KeyD')) : KR(), U2 = s.two ? (team ? kd('ArrowUp') : kd('KeyW')) : KU(), D2 = s.two ? (team ? kd('ArrowDown') : kd('KeyS')) : KD(); const dx = (R2 ? 1 : 0) - (L2 ? 1 : 0), dy = (D2 ? 1 : 0) - (U2 ? 1 : 0); if(dx || dy){ const n = Math.hypot(dx, dy); [mu, mv] = this.sd(s, dx/n, dy/n); mag = 1; } }
    const sp = (me.dash > 0 ? 400 : 220)*(B.owner === me ? .9 : 1); me.vu += (mu*sp*mag - me.vu)*Math.min(1, dt*(me.dash > 0 ? 3 : 10)); me.vv += (mv*sp*mag - me.vv)*Math.min(1, dt*(me.dash > 0 ? 3 : 10));
    const key = v45Key(s, 'k' + team, team ? ['Enter'] : s.two ? ['Space'] : ['Space', 'Act']); let act = s.act[team]; s.act[team] = null;
    if(!act && key.tap) act = {k:'tap'}; if(!act && key.rel) act = {k:'shot', pw:Math.min(1, (key.rel - .2)/1)}; if(!act && !team && pressed('KeyX')) act = {k:'shot', pw:.7};
    s.charge[team] = Math.min(1, Math.max(0, (Math.max(v45Hold(s.two ? team : null), key.hold || 0) - .2)/1));
    if(!act) return; const aim = mv;
    if(B.owner === me){ if(act.k === 'shot') this.shoot(s, me, .5 + .5*act.pw, aim); else if(this.gd(s, me) < 430) this.shoot(s, me, .55, aim); else this.pass(s, me); }
    else { me.dash = .3; const du = B.u - me.u, dv = B.v - me.v, n = Math.hypot(du, dv) || 1; me.vu = du/n*400; me.vv = dv/n*400; } },
  ai(s, p, dt){ const B = s.b, L = s.L, Wd = s.Wd, dir = p.team ? -1 : 1, hasBall = B.owner && B.owner.team === p.team, humanTeam = p.team === 0 || s.two; let run = p.team === 1 && !s.two ? (s.diff ? 214 : 172) : 196, tu, tv;
    if(B.owner === p){ tu = p.team ? 0 : L; tv = Wd/2 + Math.sin(s.t*1.3 + p.role*2)*90; run *= .86; p.think -= dt;
      if(p.think <= 0){ p.think = .3; const opp = Math.min(...s.p.filter(q => q.team !== p.team).map(q => Math.hypot(q.u - p.u, q.v - p.v))); if(this.gd(s, p) < 420 && Math.random() < (s.diff ? .65 : .45)) this.shoot(s, p, .5 + Math.random()*.4); else if(opp < 55 && Math.random() < .55) this.pass(s, p); } }
    else { let ch = null; if(!humanTeam){ let bd = 1e9; s.p.forEach(q => { if(q.team !== p.team) return; const d = Math.hypot(q.u - B.u, q.v - B.v); if(d < bd){ bd = d; ch = q; } }); }
      if(ch === p && !hasBall){ tu = B.u + B.vu*.25; tv = B.v + B.vv*.25; if(B.owner && B.owner.team !== p.team && Math.hypot(B.owner.u - p.u, B.owner.v - p.v) < 20 && Math.random() < (s.diff ? .9 : .5)*dt) this.steal(s, p); }
      else { const [hu, hv] = s.home[p.role]; let fu = hu + (hasBall ? .2 : 0); fu = p.team ? 1 - fu : fu; tu = clampV(fu*L + (B.u - L/2)*.45, 40, L - 40); tv = hv*Wd + (B.v - Wd/2)*.3; run *= .8; } }
    const du = tu - p.u, dv = tv - p.v, d = Math.hypot(du, dv); if(d > 8){ p.vu += (du/d*run - p.vu)*Math.min(1, dt*6); p.vv += (dv/d*run - p.vv)*Math.min(1, dt*6); } else { p.vu *= .8; p.vv *= .8; } },
  keeper(s, k, dt){ const B = s.b, Wd = s.Wd, GW = V45FB.GW, gu = k.team ? s.L - 24 : 24, dir = k.team ? -1 : 1;
    if(B.owner === k){ k.vu = k.vv = 0; k.hold -= dt; if(k.hold <= 0){ const mates = s.p.filter(m => m.team === k.team); let best = mates[0], bs = -1e9; mates.forEach(m => { const f = Math.min(...s.p.filter(q => q.team !== k.team).map(q => Math.hypot(q.u - m.u, q.v - m.v))); if(f > bs){ bs = f; best = m; } }); this.passTo(s, k, best); } return; }
    const far = Math.abs(B.u - gu); let tv = clampV(B.v, Wd/2 - GW/2 + 10, Wd/2 + GW/2 - 10), tu = gu + dir*(far < 300 ? 26 : 8), sp = 150 + (k.team === 1 && !s.two ? s.diff*60 : 30);
    if(!B.owner && Math.sign(B.vu) === -dir && Math.abs(B.vu) > 150){ const tt = (gu - B.u)/B.vu; if(tt > 0 && tt < 1.6){ tv = clampV(B.v + B.vv*tt, Wd/2 - GW/2 - 6, Wd/2 + GW/2 + 6); sp = 230 + (k.team === 1 && !s.two ? s.diff*50 : 20); } }
    const du = tu - k.u, dv = tv - k.v, d = Math.hypot(du, dv); if(d > 3){ k.vu = du/d*Math.min(sp, d*8); k.vv = dv/d*Math.min(sp, d*8); } else k.vu = k.vv = 0; },
  steal(s, p){ const o = s.b.owner; if(!o || o.prot > 0) return; p.prot = .9; o.cd = .55; s.b.owner = p; p.cd = 0; kickSfx(.4); },
  goal(s, team){ s.sc[team]++; s.msg = team === 0 ? (s.two ? 'Đội Xanh ghi bàn! ⚽' : 'VÀOOO! ⚽') : (s.two ? 'Đội Đỏ ghi bàn! ⚽' : 'Máy ghi bàn…'); s.msgT = 2; try { cheerSfx(); } catch(e){} this.kickoff(s); s.freeze = 2; },
  update(s, dt){
    if(s.over) return; s.t += dt; s.msgT -= dt; const B = s.b, L = s.L, Wd = s.Wd, GW = V45FB.GW, all = s.p.concat(s.k);
    if(s.freeze > 0){ s.freeze -= dt; if(s.freeze <= 0) whistleSfx(); this.cam(s, dt); return; }
    s.time -= dt; if(s.time <= 0){ const [a, b] = s.sc; s.over = s.two ? (a === b ? 'Hòa!' : a > b ? 'Đội Xanh thắng! 🏆' : 'Đội Đỏ thắng! 🏆') : a > b ? 'Chiến thắng! 🏆' : a === b ? 'Hòa!' : 'Thua rồi, cố lên!'; s.sub = `Tỉ số ${a} – ${b}`;
      s.perf = s.two ? .5 : Math.min(1, (a > b ? .72 : a === b ? .45 : .18) + Math.min(.2, a*.05) + (a > b ? s.diff*.1 : 0)); cheerSfx(); if(!s.two && a > b) mprog('football'); return; }
    s.p.forEach(p => { if(p.team === 1 && !s.two) p.human = false; }); for(const team of s.two ? [0, 1] : [0]) this.human(s, team, dt);
    s.p.forEach(p => { if(!p.human) this.ai(s, p, dt); }); s.k.forEach(k => this.keeper(s, k, dt));
    all.forEach(p => { p.cd -= dt; p.dash -= dt; p.prot = (p.prot || 0) - dt; p.u = clampV(p.u + p.vu*dt, p.gk ? -4 : 8, p.gk ? L + 4 : L - 8); p.v = clampV(p.v + p.vv*dt, 8, Wd - 8); const sp = Math.hypot(p.vu, p.vv); if(sp > 12){ p.fu = p.vu/sp; p.fv = p.vv/sp; p.walk += dt*sp*.06; const vx = s.port ? p.vv : p.vu; if(Math.abs(vx) > 8) p.sd = vx < 0 ? -1 : 1; } });
    // players do not stack on each other
    for(let i=0;i<all.length;i++) for(let j=i+1;j<all.length;j++){ const a = all[i], b = all[j], du = b.u - a.u, dv = b.v - a.v, d = Math.hypot(du, dv); if(d > 0 && d < 20){ const push = (20 - d)/2; a.u -= du/d*push; a.v -= dv/d*push; b.u += du/d*push; b.v += dv/d*push; } }
    if(B.owner){ const o = B.owner; B.u = o.u + o.fu*13; B.v = o.v + o.fv*13; B.vu = o.vu; B.vv = o.vv;
      s.p.forEach(q => { if(q.team === o.team || q.cd > 0) return; const d = Math.hypot(q.u - B.u, q.v - B.v); if(d < 22 && q.human && (q.dash > 0 ? Math.random() < .85 : Math.random() < .9*dt)) this.steal(s, q); else if(d < 18 && q.dash > 0 && Math.random() < .5) this.steal(s, q); }); }
    else { B.u += B.vu*dt; B.v += B.vv*dt; const f = Math.exp(-1.05*dt); B.vu *= f; B.vv *= f;
      if(B.v < 6){ B.v = 6; B.vv = Math.abs(B.vv)*.7; } if(B.v > Wd - 6){ B.v = Wd - 6; B.vv = -Math.abs(B.vv)*.7; }
      const mouth = Math.abs(B.v - Wd/2) < GW/2 - 4;
      for(const gu of [0, L]) for(const pv of [Wd/2 - GW/2, Wd/2 + GW/2]){ const du = B.u - gu, dv = B.v - pv, d = Math.hypot(du, dv); if(d < 11 && d > 0){ const nu = du/d, nv = dv/d, dot = B.vu*nu + B.vv*nv; if(dot < 0){ B.vu -= 1.6*dot*nu; B.vv -= 1.6*dot*nv; kickSfx(.5); } } }
      if(B.u < 0){ if(mouth){ if(B.u < -10){ this.goal(s, 1); return; } } else { B.u = 0; B.vu = Math.abs(B.vu)*.7; } }
      if(B.u > L){ if(mouth){ if(B.u > L + 10){ this.goal(s, 0); return; } } else { B.u = L; B.vu = -Math.abs(B.vu)*.7; } }
      const bs = Math.hypot(B.vu, B.vv);
      for(const p of all){ if(p.cd > 0) continue; const d = Math.hypot(p.u - B.u, p.v - B.v); if(d > (p.gk ? 26 : 17)) continue;
        if(p.gk){ const ch = bs < 420 ? 1 : (p.team === 1 && !s.two ? (s.diff ? .62 : .45) : .55) - (bs > 800 ? .18 : 0); if(Math.random() < ch){ B.owner = p; p.hold = .8; kickSfx(.3); } else { B.vu *= -.35; B.vv += (Math.random() - .5)*260; p.cd = .5; kickSfx(.6); } break; }
        if(bs < 600 || Math.random() < .5){ B.owner = p; break; } else { B.vu *= .5; B.vv *= .5; p.cd = .15; } } }
    B.rot += Math.hypot(B.vu, B.vv)*dt*.05; this.cam(s, dt);
  },
  cam(s, dt){ const c = $('#arcCv'), W = c.width, H = c.height, [bx, by] = this.ts(s, s.b.u, s.b.v), fw = s.port ? s.Wd : s.L, fh = s.port ? s.L : s.Wd, m = 70;
    let tx = bx, ty = by; tx = fw + 2*m <= W ? fw/2 : clampV(tx, W/2 - m, fw + m - W/2); ty = fh + 2*m <= H ? fh/2 : clampV(ty, H/2 - m, fh + m - H/2);
    s.camx += (tx - s.camx)*Math.min(1, dt*4); s.camy += (ty - s.camy)*Math.min(1, dt*4); },
  draw(s, c){ const W = c.canvas.width, H = c.canvas.height, L = s.L, Wd = s.Wd, GW = V45FB.GW, fw = s.port ? Wd : L, fh = s.port ? L : Wd, ox = Math.round(s.camx - W/2), oy = Math.round(s.camy - H/2), T = (u, v) => this.ts(s, u, v);
    c.fillStyle = '#23412c'; c.fillRect(0, 0, W, H); c.save(); c.translate(-ox, -oy);
    // track + boards + crowd dots
    c.fillStyle = '#b35a3c'; c.fillRect(-60, -60, fw + 120, fh + 120); c.fillStyle = '#2e5c3a'; c.fillRect(-30, -30, fw + 60, fh + 60);
    const bc = ['#ffd23f', '#3d7bff', '#ef4b4b', '#fff']; for(let i=0, x=-60; x < fw + 60; x += 80, i++){ c.fillStyle = bc[i % 4]; c.fillRect(x, -74, 76, 12); c.fillRect(x, fh + 62, 76, 12); }
    for(let i=0, y=-60; y < fh + 60; y += 80, i++){ c.fillStyle = bc[(i + 1) % 4]; c.fillRect(-74, y, 12, 76); c.fillRect(fw + 62, y, 12, 76); }
    // stripes along the length
    const n = 13; for(let i=0;i<n;i++){ c.fillStyle = i % 2 ? '#3f9a4b' : '#4aa856'; if(s.port) c.fillRect(0, i*fh/n, fw, fh/n + 1); else c.fillRect(i*fw/n, 0, fw/n + 1, fh); }
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.strokeRect(0, 0, fw, fh);
    const line = (u1, v1, u2, v2) => { const [a, b] = T(u1, v1), [x, y] = T(u2, v2); c.moveTo(a, b); c.lineTo(x, y); }, box = (u1, v1, u2, v2) => { line(u1, v1, u2, v1); line(u2, v1, u2, v2); line(u2, v2, u1, v2); };
    c.beginPath(); line(L/2, 0, L/2, Wd); const pb = GW*V47G.P*V47G.P/2, pd = pb*2/V47G.P/V47G.P, gb = GW*V47G.P/2, gd = gb*2/V47G.P/V47G.P/V47G.P; box(0, Wd/2 - pb, pd, Wd/2 + pb); box(L, Wd/2 - pb, L - pd, Wd/2 + pb); box(0, Wd/2 - gb, gd, Wd/2 + gb); box(L, Wd/2 - gb, L - gd, Wd/2 + gb); c.stroke();
    const [cx, cy] = T(L/2, Wd/2); c.beginPath(); c.arc(cx, cy, Math.round(GW/V47G.P), 0, 7); c.stroke(); c.fillStyle = '#fff'; [[L/2, Wd/2], [Math.round(pd/V47G.P), Wd/2], [L - Math.round(pd/V47G.P), Wd/2]].forEach(([u, v]) => { const [x, y] = T(u, v); c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); });
    // goals: net + posts
    for(const [gu, dd] of [[0, -1], [L, 1]]){ const [x1, y1] = T(gu, Wd/2 - GW/2), [x2, y2] = T(gu + dd*38, Wd/2 + GW/2), rx = Math.min(x1, x2), ry = Math.min(y1, y2), rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(rx, ry, rw, rh); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.beginPath(); for(let k=0;k<=rw;k+=9){ c.moveTo(rx + k, ry); c.lineTo(rx + k, ry + rh); } for(let k=0;k<=rh;k+=9){ c.moveTo(rx, ry + k); c.lineTo(rx + rw, ry + k); } c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(rx, ry, rw, rh); }
    // people + ball, back to front
    const ents = s.p.concat(s.k).map(p => { const [x, y] = T(p.u, p.v); return {p, x, y}; }); const [bx, by] = T(s.b.u, s.b.v); ents.push({ball:1, x:bx, y:by}); ents.sort((a, b) => a.y - b.y);
    for(const e of ents){ if(e.ball){ c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(e.x + 2, e.y + 5, 7, 3, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.y, 6.5, 0, 7); c.fill(); c.fillStyle = '#222'; for(let k=0;k<3;k++){ const a = s.b.rot + k*2.1; c.beginPath(); c.arc(e.x + Math.cos(a)*3.4, e.y + Math.sin(a)*3.4, 1.8, 0, 7); c.fill(); } continue; }
      const p = e.p; c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(e.x, e.y + 13, 11, 4, 0, 0, 7); c.fill();
      if(p.human){ c.strokeStyle = p.team ? '#ff8a2b' : '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.ellipse(e.x, e.y + 13, 17, 7, 0, 0, 7); c.stroke(); }
      drawGuy(c, p.look, e.x, e.y + 14, 1.5, p.sd, Math.hypot(p.vu, p.vv) > 20, p.walk);
      if(p.human){ c.fillStyle = p.team ? '#ff8a2b' : '#ffd23f'; c.beginPath(); c.moveTo(e.x - 7, e.y - 52); c.lineTo(e.x + 7, e.y - 52); c.lineTo(e.x, e.y - 43); c.fill(); const ch = s.charge[p.team]; if(ch > 0){ c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(e.x - 22, e.y - 64, 44, 7); c.fillStyle = ch > .8 ? '#ef4b4b' : '#ffd23f'; c.fillRect(e.x - 21, e.y - 63, 42*ch, 5); } }
      if(p.gk){ c.fillStyle = '#fff'; c.font = '800 12px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('🧤', e.x, e.y - 40); c.textAlign = 'left'; } }
    c.restore(); v45Stick(c);
    const [px, py, pw] = v45Panel(c, W, H, 55), mm = Math.floor(Math.max(0, s.time)/60), ss = String(Math.floor(Math.max(0, s.time) % 60)).padStart(2, '0');
    c.font = '900 24px Nunito, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#7fb0ff'; c.fillText(s.two ? 'Xanh' : 'Bạn', px + pw*.146, py + 36); c.fillStyle = '#fff'; c.fillText(`${s.sc[0]}  –  ${s.sc[1]}`, px + pw*.382, py + 36); c.fillStyle = '#ff8a80'; c.fillText(s.two ? 'Đỏ' : 'Máy', px + pw*.618, py + 36); c.fillStyle = '#ffd23f'; c.fillText(`⏱ ${mm}:${ss}`, px + pw*.854, py + 36); c.textAlign = 'left';
    if(s.msgT > 0 && !s.over){ c.globalAlpha = Math.min(1, s.msgT*2); c.font = '900 32px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = 'rgba(10,15,34,.75)'; c.strokeText(s.msg, W/2, H*V47G.a); c.fillStyle = '#ffd23f'; c.fillText(s.msg, W/2, H*V47G.a); c.textAlign = 'left'; c.globalAlpha = 1; }
    if(s.over) v45End(c, s, W, H);
  }
};

// ================= TANKS: 5 different tanks, big map with obstacles =================
const V45TK = [
  {n:'🟩 Lục Báo', col:'#43a047', dark:'#1b5e20', acc:'#c5e1a5', sp:175, hp:4, rof:.42, bs:440, dmg:1, bounce:2, shape:'scout'},
  {n:'🟥 Hỏa Long', col:'#e53935', dark:'#7f1d1d', acc:'#ffcc80', sp:108, hp:7, rof:.95, bs:360, dmg:1, bounce:1, shape:'heavy', twin:1},
  {n:'🟦 Băng Hà', col:'#1e88e5', dark:'#0d3c78', acc:'#b3e5fc', sp:138, hp:5, rof:.85, bs:640, dmg:2, bounce:3, shape:'sniper'},
  {n:'🟨 Kim Ưng', col:'#fbc02d', dark:'#7a5c00', acc:'#fff59d', sp:150, hp:5, rof:.2, bs:430, dmg:1, bounce:0, shape:'gatling'},
  {n:'🟪 Tử Điện', col:'#8e24aa', dark:'#4a148c', acc:'#ea80fc', sp:142, hp:5, rof:.7, bs:400, dmg:1, bounce:4, shape:'tesla', spread:1}
];
function v45Hull(ty){ const T = V45TK[ty]; return v45Spr('hull' + ty, 64, 64, (g) => { g.translate(32, 32); const rr = (x, y, w, h, r, f) => { g.fillStyle = f; v45RR(g, x, y, w, h, r); g.fill(); };
  if(T.shape === 'scout'){ rr(-17, -16, 34, 8, 3, '#222'); rr(-17, 8, 34, 8, 3, '#222'); g.fillStyle = T.col; g.beginPath(); g.moveTo(-15, -10); g.lineTo(12, -10); g.lineTo(21, 0); g.lineTo(12, 10); g.lineTo(-15, 10); g.closePath(); g.fill(); rr(-11, -6, 18, 12, 4, T.dark); g.fillStyle = T.acc; g.fillRect(-14, -2, 6, 4); g.fillStyle = '#fff59d'; g.fillRect(16, -5, 3, 3); g.fillRect(16, 2, 3, 3); }
  else if(T.shape === 'heavy'){ rr(-22, -21, 44, 10, 3, '#1f1f1f'); rr(-22, 11, 44, 10, 3, '#1f1f1f'); g.fillStyle = T.dark; g.beginPath(); g.moveTo(-20, -13); g.lineTo(14, -13); g.lineTo(21, -6); g.lineTo(21, 6); g.lineTo(14, 13); g.lineTo(-20, 13); g.closePath(); g.fill(); rr(-17, -10, 32, 20, 3, T.col); g.fillStyle = T.acc; for(const [x, y] of [[-14, -8], [10, -8], [-14, 7], [10, 7]]){ g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } g.fillStyle = '#555'; g.fillRect(-24, -9, 4, 5); g.fillRect(-24, 4, 4, 5); }
  else if(T.shape === 'sniper'){ rr(-20, -15, 38, 6, 3, '#222'); rr(-20, 9, 38, 6, 3, '#222'); g.fillStyle = T.col; g.beginPath(); g.moveTo(-19, -10); g.lineTo(13, -8); g.lineTo(23, 0); g.lineTo(13, 8); g.lineTo(-19, 10); g.closePath(); g.fill(); g.fillStyle = T.dark; g.beginPath(); g.moveTo(-19, -10); g.lineTo(-8, 0); g.lineTo(-19, 10); g.fill(); g.fillStyle = T.acc; g.beginPath(); g.moveTo(6, -6); g.lineTo(18, 0); g.lineTo(6, 6); g.fill(); }
  else if(T.shape === 'gatling'){ g.fillStyle = '#222'; for(const x of [-13, 0, 13]) for(const y of [-14, 14]){ g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill(); } g.fillStyle = '#9e9e9e'; for(const x of [-13, 0, 13]) for(const y of [-14, 14]){ g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    g.fillStyle = T.col; g.beginPath(); g.moveTo(-18, -10); g.lineTo(15, -10); g.lineTo(19, -6); g.lineTo(19, 6); g.lineTo(15, 10); g.lineTo(-18, 10); g.closePath(); g.fill(); g.save(); g.beginPath(); g.rect(-18, -10, 8, 20); g.clip(); g.fillStyle = '#222'; for(let k=-30;k<20;k+=6){ g.beginPath(); g.moveTo(k, 12); g.lineTo(k + 3, 12); g.lineTo(k + 13, -12); g.lineTo(k + 10, -12); g.fill(); } g.restore(); }
  else { g.shadowColor = T.acc; g.shadowBlur = 10; g.fillStyle = T.acc; for(const [x, y] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]){ g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } g.shadowBlur = 0; g.fillStyle = T.dark; g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.fillStyle = T.col; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill(); g.strokeStyle = T.acc; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 15.5, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(14, 0); g.lineTo(19, -3); g.lineTo(19, 3); g.fill(); } }); }
function v45Turret(ty){ const T = V45TK[ty]; return v45Spr('tur' + ty, 90, 90, (g) => { g.translate(45, 45); const bar = (y, len, w) => { g.fillStyle = '#37474f'; g.fillRect(4, y - w/2, len, w); g.fillStyle = '#263238'; g.fillRect(len, y - w/2 - 1, 4, w + 2); };
  if(T.shape === 'scout'){ bar(0, 22, 4); g.fillStyle = T.dark; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.fillStyle = T.acc; g.beginPath(); g.arc(-2, -2, 3, 0, 7); g.fill(); }
  else if(T.shape === 'heavy'){ bar(-4, 26, 4); bar(4, 26, 4); g.fillStyle = T.dark; v45RR(g, -11, -10, 20, 20, 4); g.fill(); g.fillStyle = T.col; v45RR(g, -8, -7, 14, 14, 3); g.fill(); g.fillStyle = T.acc; g.beginPath(); g.moveTo(-4, 4); g.quadraticCurveTo(-6, -2, 0, -6); g.quadraticCurveTo(0, 0, 3, 4); g.fill(); }
  else if(T.shape === 'sniper'){ bar(0, 36, 3); g.fillStyle = '#263238'; g.fillRect(30, -3.5, 7, 7); g.fillStyle = T.dark; g.beginPath(); g.ellipse(0, 0, 10, 7, 0, 0, 7); g.fill(); g.fillStyle = T.acc; g.fillRect(-2, -5, 6, 2); }
  else if(T.shape === 'gatling'){ for(const y of [-3.5, 0, 3.5]){ g.fillStyle = '#455a64'; g.fillRect(4, y - 1.2, 24, 2.4); } g.fillStyle = '#263238'; g.fillRect(22, -6, 4, 12); g.fillStyle = T.dark; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(-4, -2, 8, 4); }
  else { g.fillStyle = T.dark; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.fillStyle = '#b0bec5'; g.fillRect(4, -2, 14, 4); g.strokeStyle = T.acc; g.lineWidth = 2; for(const x of [9, 14]){ g.beginPath(); g.ellipse(x, 0, 1.5, 5, 0, 0, 7); g.stroke(); } g.shadowColor = T.acc; g.shadowBlur = 12; g.fillStyle = T.acc; g.beginPath(); g.arc(21, 0, 4, 0, 7); g.fill(); } }); }
function v45Ground(){ return v45Spr('ground', 256, 256, (g) => { g.fillStyle = '#6e9450'; g.fillRect(0, 0, 256, 256); const R = v45R(9); for(let i=0;i<220;i++){ g.fillStyle = R() < .5 ? 'rgba(40,80,30,.18)' : 'rgba(170,200,110,.16)'; const x = R()*256, y = R()*256, r = 2 + R()*7; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.strokeStyle = 'rgba(40,70,30,.35)'; g.lineWidth = 1; for(let i=0;i<70;i++){ const x = R()*256, y = R()*256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 5); g.stroke(); } }); }
GAMES.tanks = {
  title:'Đấu xe tăng', opts:V45TK.map(t => t.n), v45:1, v44top:0,
  help:'👆 Vuốt về hướng nào, xe tăng chạy về hướng đó. 👉 Chạm để bắn — nòng tự ngắm xe gần nhất. ✊ Giữ ngón tay để bắn liên tục. 5 xe tăng đấu tự do: hạ 5 xe trước là thắng. 📦 Bắn vỡ hộp gỗ để nhặt 🔧 hồi máu hoặc ⚡ tăng tốc. Đạn nảy tường tùy loại xe. ⌨️ Mũi tên/WASD + Space · Người 2 bấm Enter để vào (mũi tên + Enter).',
  init(o){ o = o || 0; const [vw, vh] = v45Canvas(); v45spStart(); const port = vh > vw, WW = port ? 1300 : 2103, WH = port ? 2103 : 1300, R = v45R(4242 + o), tr = a => port ? [a[1], a[0], a[3], a[2]] : a;
    const walls = [[0, 0, WW, 30], [0, WH - 30, WW, 30], [0, 0, 30, WH], [WW - 30, 0, 30, WH]];
    v47gTankWalls(2103, 1300).forEach(a => walls.push(tr(a)));
    const ponds = [[Math.round(2103*.236), Math.round(1300*.382), 55], [Math.round(2103*.764), Math.round(1300*.618), 89]].map(([x, y, r]) => port ? {x:y, y:x, r} : {x, y, r}), spawns = [[130, 130], [1973, 130], [130, 1170], [1973, 1170], [1052, Math.round(1300*.382)]].map(([x, y]) => port ? [y, x] : [x, y]);
    const free = (x, y, r) => x > 50 + r && y > 50 + r && x < WW - 50 - r && y < WH - 50 - r && !walls.some(([wx, wy, ww, wh]) => x > wx - r && x < wx + ww + r && y > wy - r && y < wy + wh + r) && !ponds.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r) && !spawns.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 110);
    const crates = [], rocks = []; for(let i=0;i<300 && crates.length < 22;i++){ const x = 80 + R()*(WW - 160), y = 80 + R()*(WH - 160); if(free(x, y, 30) && !crates.some(q => Math.hypot(q.x - x, q.y - y) < 60)) crates.push({x, y, hp:2}); }
    for(let i=0;i<400 && rocks.length < 34;i++){ const x = 80 + R()*(WW - 160), y = 80 + R()*(WH - 160), r = 14 + R()*10; if(free(x, y, r + 10) && !crates.some(q => Math.hypot(q.x - x, q.y - y) < 50) && !rocks.some(q => Math.hypot(q.x - x, q.y - y) < 50)) rocks.push({x, y, r, k:R() < .6 ? 'tree' : 'rock'}); }
    const T = []; for(let i=0;i<5;i++){ const ty = (o + i) % 5, S = V45TK[ty], [x, y] = spawns[i]; T.push({i, ty, x, y, a:Math.atan2(WH/2 - y, WW/2 - x), ta:0, hp:S.hp, max:S.hp, cd:1, kills:0, dead:0, shield:2, human:i === 0 ? 1 : 0, tread:0, think:0, mvA:0, strafe:i % 2 ? 1 : -1, boost:0, name:i === 0 ? 'Bạn' : S.n.slice(3)}); T[i].ta = T[i].a; }
    return {port, WW, WH, walls, ponds, crates, rocks, spawns, T, b:[], fx:[], pk:[], pkT:6, t:0, time:180, camx:clampV(T[0].x, vw/2 - 60, WW - vw/2 + 60), camy:clampV(T[0].y, vh/2 - 60, WH - vh/2 + 60), msg:'Hạ 5 xe tăng để thắng!', msgT:2.2, fire:0, p2:false}; },
  tap(s){ s.fire = (s.fire || 0) + 1; },
  blocked(s, x, y, r){ if(s.walls.some(([wx, wy, ww, wh]) => x > wx - r && x < wx + ww + r && y > wy - r && y < wy + wh + r)) return true; if(s.crates.some(q => Math.abs(q.x - x) < 17 + r && Math.abs(q.y - y) < 17 + r)) return true;
    return s.ponds.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r - 6) || s.rocks.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r - 4); },
  los(s, a, b){ const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d/26); for(let k=1;k<n;k++){ const x = a.x + (b.x - a.x)*k/n, y = a.y + (b.y - a.y)*k/n; if(s.walls.some(([wx, wy, ww, wh]) => x > wx && x < wx + ww && y > wy && y < wy + wh) || s.crates.some(q => Math.abs(q.x - x) < 17 && Math.abs(q.y - y) < 17)) return false; } return true; },
  fire(s, t){ const S = V45TK[t.ty]; t.cd = S.rof; const shots = S.twin ? [[0, -5], [0, 5]] : S.spread ? [[-.2, 0], [0, 0], [.2, 0]] : [[S.shape === 'gatling' ? (Math.random() - .5)*.12 : 0, 0]];
    for(const [da, off] of shots){ const a = t.ta + da, mx = t.x + Math.cos(t.ta)*38 - Math.sin(t.ta)*off, my = t.y + Math.sin(t.ta)*38 + Math.cos(t.ta)*off; s.b.push({x:mx, y:my, vx:Math.cos(a)*S.bs, vy:Math.sin(a)*S.bs, own:t, bo:S.bounce, dmg:S.dmg, life:2.6, col:S.acc, r:S.twin ? 5 : 3.5, gone:0}); }
    s.fx.push({x:t.x + Math.cos(t.ta)*32, y:t.y + Math.sin(t.ta)*32, t:.12, k:'flash'}); if(t.human || Math.hypot(t.x - s.camx, t.y - s.camy) < 600) kickSfx(.35); },
  boom(s, x, y, big){ for(let i=0;i<(big ? 16 : 5);i++){ const a = Math.random()*7, v = 40 + Math.random()*(big ? 160 : 60); s.fx.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, t:.5 + Math.random()*.4, k:'spark', c:Math.random() < .5 ? '#ffb300' : '#ff7043'}); } if(big){ s.fx.push({x, y, t:.6, k:'ring'}); kickSfx(1); } },
  respawn(s, t){ const S = V45TK[t.ty]; let best = s.spawns[0], bd = -1; s.spawns.forEach(([x, y]) => { const d = Math.min(...s.T.filter(q => q !== t && q.dead <= 0).map(q => Math.hypot(q.x - x, q.y - y))); if(d > bd){ bd = d; best = [x, y]; } }); t.x = best[0]; t.y = best[1]; t.hp = S.hp; t.shield = 2; t.cd = .6; },
  ai(s, t, dt){ let tg = null, td = 1e9; s.T.forEach(q => { if(q === t || q.dead > 0) return; const d = Math.hypot(q.x - t.x, q.y - t.y) - (q.human ? 60 : 0); if(d < td){ td = d; tg = q; } });
    t.think -= dt; if(t.think <= 0){ t.think = .35 + Math.random()*.3; let ang = 0;
      const pk = t.hp <= 2 ? s.pk.find(p => p.k === 'fix' && Math.hypot(p.x - t.x, p.y - t.y) < 500) : null;
      if(pk) ang = Math.atan2(pk.y - t.y, pk.x - t.x); else if(tg){ ang = Math.atan2(tg.y - t.y, tg.x - t.x); const d = Math.hypot(tg.x - t.x, tg.y - t.y); if(Math.random() < .08) t.strafe *= -1; if(d < 230) ang += t.strafe*1.7; else if(d < 480) ang += t.strafe*.8; } else ang = t.mvA + (Math.random() - .5);
      for(const k of [0, .7, -.7, 1.4, -1.4, 2.2, -2.2, Math.PI]){ const a2 = ang + k; if(!this.blocked(s, t.x + Math.cos(a2)*46, t.y + Math.sin(a2)*50, 22)){ ang = a2; break; } } t.mvA = ang; }
    let fire = false; if(tg){ const d = Math.hypot(tg.x - t.x, tg.y - t.y), lead = d/V45TK[t.ty].bs*.6, aim = Math.atan2(tg.y + (tg.vy || 0)*lead - t.y, tg.x + (tg.vx || 0)*lead - t.x); t.aim = aim; if(t.cd <= 0 && d < 620 && Math.abs(v45AD(t.ta, aim)) < .22 && this.los(s, t, tg)) fire = Math.random() < .55; }
    return [Math.cos(t.mvA), Math.sin(t.mvA), fire]; },
  update(s, dt){
    if(s.over) return; s.t += dt; s.time -= dt; s.msgT -= dt;
    if(!s.p2 && pressed('Enter')){ s.p2 = true; const t = s.T[1]; t.human = 2; t.name = 'Người 2'; s.msg = '👥 Người 2 đã vào!'; s.msgT = 1.5; }
    const hold = v45Hold();
    for(const t of s.T){ if(t.dead > 0){ t.dead -= dt; if(t.dead <= 0) this.respawn(s, t); continue; } t.cd -= dt; t.shield -= dt; t.boost -= dt; let mx = 0, my = 0, fire = false;
      if(t.human === 1){ const d = v45Drag(); if(d && d.len){ mx = d.nx*d.k; my = d.ny*d.k; } else { const L2 = s.p2 ? kd('KeyA') : KL(), R2 = s.p2 ? kd('KeyD') : KR(), U2 = s.p2 ? kd('KeyW') : KU(), D2 = s.p2 ? kd('KeyS') : KD(); mx = (R2 ? 1 : 0) - (L2 ? 1 : 0); my = (D2 ? 1 : 0) - (U2 ? 1 : 0); const n = Math.hypot(mx, my); if(n){ mx /= n; my /= n; } }
        fire = s.fire > 0 || hold > 0 || kd('Space', 'Act'); if(t.cd <= 0) s.fire = 0; }
      else if(t.human === 2){ mx = (kd('ArrowRight') ? 1 : 0) - (kd('ArrowLeft') ? 1 : 0); my = (kd('ArrowDown') ? 1 : 0) - (kd('ArrowUp') ? 1 : 0); const n = Math.hypot(mx, my); if(n){ mx /= n; my /= n; } fire = kd('Enter'); }
      else [mx, my, fire] = this.ai(s, t, dt);
      const S = V45TK[t.ty], spd = S.sp*(t.boost > 0 ? 1.45 : 1)*(t.human ? 1 : .92), m = Math.hypot(mx, my); t.vx = t.vy = 0;
      if(m > .1){ const want = Math.atan2(my, mx), k = Math.min(1, m); t.a = v45AL(t.a, want, dt*9); const ddx = Math.cos(want)*spd*k*dt, ddy = Math.sin(want)*spd*k*dt;
        if(!this.blocked(s, t.x + ddx, t.y, 22)){ t.x += ddx; t.vx = ddx/dt; } if(!this.blocked(s, t.x, t.y + ddy, 22)){ t.y += ddy; t.vy = ddy/dt; } t.tread += spd*k*dt; }
      let aim = t.human ? null : t.aim; if(t.human){ let bd = 640; s.T.forEach(q => { if(q === t || q.dead > 0) return; const d = Math.hypot(q.x - t.x, q.y - t.y); if(d < bd){ bd = d; aim = Math.atan2(q.y - t.y, q.x - t.x); } }); }
      t.ta = v45AL(t.ta, aim == null ? t.a : aim, dt*(t.human ? 9 : 5));
      if(fire && t.cd <= 0) this.fire(s, t); }
    // bullets
    for(const b of s.b){ if(b.gone) continue; b.life -= dt; if(b.life <= 0){ b.gone = 1; continue; } const nx = b.x + b.vx*dt, ny = b.y + b.vy*dt;
      const w = s.walls.find(([wx, wy, ww, wh]) => nx > wx && nx < wx + ww && ny > wy && ny < wy + wh);
      if(w){ if(b.bo-- <= 0){ b.gone = 1; this.boom(s, b.x, b.y); continue; } const [wx, wy, ww, wh] = w; if(b.x <= wx || b.x >= wx + ww) b.vx *= -1; else b.vy *= -1; b.bounced = 1; blipSfx(300); continue; }
      b.x = nx; b.y = ny;
      const cr = s.crates.find(q => Math.abs(q.x - b.x) < 17 && Math.abs(q.y - b.y) < 17); if(cr){ b.gone = 1; cr.hp -= b.dmg; this.boom(s, b.x, b.y); if(cr.hp <= 0){ s.crates.splice(s.crates.indexOf(cr), 1); this.boom(s, cr.x, cr.y, 1); if(Math.random() < .6) s.pk.push({x:cr.x, y:cr.y, k:Math.random() < .55 ? 'fix' : 'zap', t:0}); } continue; }
      if(s.rocks.some(p => Math.hypot(p.x - b.x, p.y - b.y) < p.r)){ b.gone = 1; this.boom(s, b.x, b.y); continue; }
      for(const t of s.T){ if(t.dead > 0 || (t === b.own && !b.bounced) || Math.hypot(t.x - b.x, t.y - b.y) > 24) continue; b.gone = 1; this.boom(s, b.x, b.y); if(t.shield > 0) break; t.hp -= b.dmg;
        if(t.hp <= 0){ t.dead = 3; this.boom(s, t.x, t.y, 1); const k = b.own; if(k !== t){ k.kills++; s.msg = `${k.human ? '💥 ' + k.name : k.name} hạ ${t.human ? 'bạn' : t.name}!`; s.msgT = 1.6; } if(k.human === 1 && k !== t) blipSfx(1500); }
        break; } }
    s.b = s.b.filter(b => !b.gone);
    // pick-ups
    s.pkT -= dt; if(s.pkT <= 0 && s.pk.length < 3){ s.pkT = 9; for(let i=0;i<20;i++){ const x = 80 + Math.random()*(s.WW - 160), y = 80 + Math.random()*(s.WH - 160); if(!this.blocked(s, x, y, 24)){ s.pk.push({x, y, k:Math.random() < .5 ? 'fix' : 'zap', t:0}); break; } } }
    s.pk = s.pk.filter(p => { p.t += dt; const t = s.T.find(q => q.dead <= 0 && Math.hypot(q.x - p.x, q.y - p.y) < 28); if(!t) return true; if(p.k === 'fix') t.hp = Math.min(t.max, t.hp + 2); else t.boost = 6; if(t.human) blipSfx(1200); return false; });
    s.fx.forEach(f => { f.t -= dt; if(f.vx != null){ f.x += f.vx*dt; f.y += f.vy*dt; f.vx *= .92; f.vy *= .92; } }); s.fx = s.fx.filter(f => f.t > 0);
    // camera
    const me = s.T[0], two = s.p2 ? s.T[1] : null, tx = two ? (me.x + two.x)/2 : me.x, ty = two ? (me.y + two.y)/2 : me.y, cv = $('#arcCv'), W = cv.width, H = cv.height;
    const mg = H > W ? 90 : 60; s.camx += (clampV(tx, W/2 - mg, s.WW - W/2 + mg) - s.camx)*Math.min(1, dt*4); s.camy += (clampV(ty, H/2 - mg, s.WH - H/2 + mg) - s.camy)*Math.min(1, dt*4);
    // end
    const win = s.T.find(t => t.kills >= 5); if(win || s.time <= 0){ const rank = s.T.filter(t => t.kills > me.kills).length + 1, top = s.T.slice().sort((a, b) => b.kills - a.kills)[0];
      s.over = rank === 1 ? 'Chiến thắng! 🏆' : `Hạng ${rank}/5`; s.sub = `Bạn hạ ${me.kills} xe tăng\n${top === me ? 'Bạn dẫn đầu!' : top.name + ' thắng với ' + top.kills + ' xe'}`; s.perf = [1, .72, .5, .34, .2][rank - 1]*.7 + Math.min(1, me.kills/5)*.3; cheerSfx(); }
  },
  draw(s, c){ const W = c.canvas.width, H = c.canvas.height, ox = Math.round(s.camx - W/2), oy = Math.round(s.camy - H/2), vis = (x, y, m) => x > ox - m && x < ox + W + m && y > oy - m && y < oy + H + m;
    if(!V45SP.pat || V45SP.patC !== c){ V45SP.pat = c.createPattern(v45Ground(), 'repeat'); V45SP.patC = c; }
    c.save(); c.translate(-ox, -oy); c.fillStyle = '#3b4a2c'; c.fillRect(ox, oy, W, H); c.fillStyle = V45SP.pat; c.fillRect(Math.max(0, ox), Math.max(0, oy), Math.min(s.WW, ox + W) - Math.max(0, ox), Math.min(s.WH, oy + H) - Math.max(0, oy));
    // dirt roads
    c.fillStyle = 'rgba(150,115,70,.5)'; if(s.port){ c.fillRect(s.WW/2 - 40, 0, 80, s.WH); c.fillRect(0, s.WH*.5 - 30, s.WW, 60); } else { c.fillRect(0, s.WH/2 - 40, s.WW, 80); c.fillRect(s.WW*.5 - 30, 0, 60, s.WH); }
    // ponds
    for(const p of s.ponds){ if(!vis(p.x, p.y, p.r + 10)) continue; c.fillStyle = '#c2b280'; c.beginPath(); c.arc(p.x, p.y, p.r + 7, 0, 7); c.fill(); c.fillStyle = '#3f8fd1'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.r*(.4 + (s.t*.3 % .5)), 0, 7); c.stroke(); }
    // pick-ups
    c.textAlign = 'center'; c.font = '20px Nunito, sans-serif'; for(const p of s.pk){ if(!vis(p.x, p.y, 30)) continue; const b = Math.sin(p.t*4)*3; c.fillStyle = p.k === 'fix' ? 'rgba(124,242,156,.35)' : 'rgba(255,210,63,.35)'; c.beginPath(); c.arc(p.x, p.y + b, 17, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillText(p.k === 'fix' ? '🔧' : '⚡', p.x, p.y + 7 + b); } c.textAlign = 'left';
    // obstacles
    for(const [x, y, w, h] of s.walls){ if(x > ox + W || x + w < ox || y > oy + H || y + h < oy) continue; c.fillStyle = '#6d6f78'; c.fillRect(x, y + 6, w, h); c.fillStyle = '#9da1ab'; c.fillRect(x, y, w, h - 4); c.strokeStyle = 'rgba(60,62,70,.6)'; c.lineWidth = 1; c.beginPath(); for(let yy = y + 12; yy < y + h - 4; yy += 12){ c.moveTo(x, yy); c.lineTo(x + w, yy); } for(let xx = x + 20; xx < x + w; xx += 24){ c.moveTo(xx, y); c.lineTo(xx, y + Math.min(12, h - 4)); } c.stroke(); }
    for(const q of s.crates){ if(!vis(q.x, q.y, 30)) continue; c.fillStyle = '#7a4f24'; c.fillRect(q.x - 17, q.y - 13, 34, 34); c.fillStyle = q.hp > 1 ? '#c58b4a' : '#a8743c'; c.fillRect(q.x - 17, q.y - 17, 34, 32); c.strokeStyle = '#7a4f24'; c.lineWidth = 3; c.beginPath(); c.moveTo(q.x - 15, q.y - 15); c.lineTo(q.x + 15, q.y + 13); c.moveTo(q.x + 15, q.y - 15); c.lineTo(q.x - 15, q.y + 13); c.stroke(); c.strokeRect(q.x - 16, q.y - 16, 32, 30); }
    for(const p of s.rocks){ if(!vis(p.x, p.y, 40)) continue; if(p.k === 'tree'){ c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(p.x + 5, p.y + 6, p.r + 4, 0, 7); c.fill(); c.fillStyle = '#2e6b3a'; c.beginPath(); c.arc(p.x, p.y, p.r + 4, 0, 7); c.fill(); c.fillStyle = '#3f8a4a'; c.beginPath(); c.arc(p.x - 4, p.y - 4, p.r - 2, 0, 7); c.fill(); c.fillStyle = '#5aa860'; c.beginPath(); c.arc(p.x - 7, p.y - 7, p.r*.45, 0, 7); c.fill(); }
      else { c.fillStyle = '#5f646b'; c.beginPath(); c.ellipse(p.x, p.y + 3, p.r + 2, p.r, 0, 0, 7); c.fill(); c.fillStyle = '#8a9099'; c.beginPath(); c.ellipse(p.x - 2, p.y - 1, p.r - 1, p.r - 4, 0, 0, 7); c.fill(); c.fillStyle = '#b0b6bf'; c.beginPath(); c.ellipse(p.x - 6, p.y - 5, p.r*.35, p.r*.25, 0, 0, 7); c.fill(); } }
    // tanks
    for(const t of s.T){ if(t.dead > 0 || !vis(t.x, t.y, 50)) continue; const S = V45TK[t.ty]; c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(t.x + 5, t.y + 7, 30, 23, 0, 0, 7); c.fill();
      c.save(); c.translate(t.x, t.y); c.scale(1.3, 1.3); c.rotate(t.a); if(S.shape === 'tesla'){ c.fillStyle = `rgba(234,128,252,${.25 + .15*Math.sin(s.t*8)})`; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill(); } c.drawImage(v45Hull(t.ty), -32, -32);
      if(S.shape !== 'tesla' && S.shape !== 'gatling'){ c.fillStyle = 'rgba(255,255,255,.18)'; const ty = S.shape === 'heavy' ? 16 : S.shape === 'sniper' ? 12 : 12, o2 = -(t.tread % 7); for(let x = -17 + o2; x < 17; x += 7){ c.fillRect(x, -ty - 3, 2, 6); c.fillRect(x, ty - 3, 2, 6); } }
      c.rotate(t.ta - t.a); c.drawImage(v45Turret(t.ty), -45, -45); c.restore();
      if(t.shield > 0){ c.strokeStyle = `rgba(160,220,255,${.4 + .3*Math.sin(s.t*10)})`; c.lineWidth = 3; c.beginPath(); c.arc(t.x, t.y, 34, 0, 7); c.stroke(); }
      if(t.boost > 0){ c.fillStyle = 'rgba(255,210,63,.6)'; c.fillRect(t.x - Math.cos(t.a)*26 - 2, t.y - Math.sin(t.a)*26 - 2, 4, 4); }
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(t.x - 21, t.y - 48, 42, 7); c.fillStyle = t.hp/t.max > .4 ? '#2fbf71' : '#ef4b4b'; c.fillRect(t.x - 20, t.y - 47, 40*t.hp/t.max, 5);
      c.font = '800 13px Nunito, sans-serif'; c.textAlign = 'center'; c.fillStyle = t.human ? '#ffd23f' : '#fff'; c.fillText(`${t.name} ★${t.kills}`, t.x, t.y - 53); c.textAlign = 'left'; }
    // bullets + effects
    for(const b of s.b){ if(!vis(b.x, b.y, 10)) continue; c.fillStyle = b.col; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(b.x, b.y, b.r*.45, 0, 7); c.fill(); }
    for(const f of s.fx){ if(f.k === 'flash'){ c.fillStyle = `rgba(255,236,140,${f.t*7})`; c.beginPath(); c.arc(f.x, f.y, 8, 0, 7); c.fill(); } else if(f.k === 'ring'){ c.strokeStyle = `rgba(255,160,60,${f.t*1.5})`; c.lineWidth = 4; c.beginPath(); c.arc(f.x, f.y, 50 - f.t*60, 0, 7); c.stroke(); } else { c.fillStyle = f.c; c.globalAlpha = Math.min(1, f.t*2); c.fillRect(f.x - 2, f.y - 2, 4, 4); c.globalAlpha = 1; } }
    c.restore(); v45Stick(c);
    // mini map
    const mw = 120, mh = Math.round(mw*s.WH/s.WW), small = W < 700, mxp = W - mw - 12, myp = small ? 64 : H - mh - 12; c.fillStyle = 'rgba(10,15,34,.6)'; v45RR(c, mxp - 4, myp - 4, mw + 8, mh + 8, 8); c.fill(); const k = mw/s.WW; c.fillStyle = '#7a8a6a';
    for(const [x, y, w, h] of s.walls) c.fillRect(mxp + x*k, myp + y*k, Math.max(1, w*k), Math.max(1, h*k)); c.fillStyle = '#3f8fd1'; for(const p of s.ponds){ c.beginPath(); c.arc(mxp + p.x*k, myp + p.y*k, p.r*k, 0, 7); c.fill(); }
    for(const t of s.T){ if(t.dead > 0) continue; c.fillStyle = V45TK[t.ty].col; c.beginPath(); c.arc(mxp + t.x*k, myp + t.y*k, t.human ? 4 : 3, 0, 7); c.fill(); if(t.human){ c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); } }
    // HUD
    const me = s.T[0], [px, py, pw] = v45Panel(c, W, H, 55), mm = Math.floor(Math.max(0, s.time)/60), ss = String(Math.floor(Math.max(0, s.time) % 60)).padStart(2, '0');
    c.font = '800 21px Nunito, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(`❤️ ${Math.max(0, me.hp)}/${me.max}`, px + pw*.146, py + 35); c.fillStyle = '#ffd23f'; c.fillText(`★ ${me.kills}/5`, px + pw*.382, py + 35);
    const lead = s.T.slice().sort((a, b) => b.kills - a.kills)[0]; c.fillStyle = '#cfe3ff'; c.fillText(`👑 ${lead.name} ${lead.kills}`, px + pw*.618, py + 35); c.fillStyle = '#fff'; c.fillText(`⏱ ${mm}:${ss}`, px + pw*.854, py + 35); c.textAlign = 'left';
    if(me.dead > 0 && !s.over){ c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H); c.font = '900 28px Nunito, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(`Quay lại sau ${Math.ceil(me.dead)}…`, W/2, H*V47G.a); c.textAlign = 'left'; }
    if(s.msgT > 0 && !s.over){ c.globalAlpha = Math.min(1, s.msgT*2); c.font = '900 24px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = 'rgba(10,15,34,.75)'; const yy = small ? 64 + mh + 40 : 92; c.strokeText(s.msg, W/2, yy); c.fillStyle = '#fff'; c.fillText(s.msg, W/2, yy); c.textAlign = 'left'; c.globalAlpha = 1; }
    if(s.over) v45End(c, s, W, H);
  }
};

// ---------- hooks: full-screen fit, touch listeners, pause card, reward ----------
function v45SportsInit(){
  const cv = $('#arcCv'); if(!cv) return;
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, e => v45Ptr(e, t.slice(7))));
  const fit = v44Fit; v44Fit = function(){ if(ARC.g && ARC.g.v45){ const c2 = $('#arcCv'); if(!c2) return; document.body.classList.toggle('v44side', innerWidth > innerHeight && MOB.touch); document.body.classList.add('v45arc'); c2.style.setProperty('width', innerWidth + 'px', 'important'); c2.style.setProperty('height', innerHeight + 'px', 'important'); c2.style.setProperty('object-fit', 'fill', 'important'); return; } document.body.classList.remove('v45arc'); return fit.apply(this, arguments); };
  const fill = v44Fill; v44Fill = function(){ if(ARC.g && ARC.g.v45) return; return fill.apply(this, arguments); };
  const ov = overlay; overlay = function(c, t1, t2){ if(ARC.g && ARC.g.v45 && c && c.canvas){ const W = c.canvas.width, H = c.canvas.height; c.fillStyle = 'rgba(5,8,20,.6)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = '900 34px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(t1 === 'Tạm dừng' ? '⏸ Tạm dừng' : t1, W/2, H/2 - 8); c.font = '800 21px Nunito, sans-serif'; c.fillStyle = '#fff'; c.fillText(t1 === 'Tạm dừng' ? 'Bấm ▶ để chơi tiếp' : (t2 || ''), W/2, H/2 + 30); c.textAlign = 'left'; return; } return ov.apply(this, arguments); };
  const ar = arcReward; arcReward = function(id, s){ if(!(V45SP.ids.has(id) && GAMES[id] && GAMES[id].v45)) return ar.apply(this, arguments);
    if(!PROF){ loginNudge(); return; } const m = v45Pay(s); reward(GAME_EXP[id] || 25, m, GAMES[id].title); try { mentorResult(id, 0); } catch(e){} };
  const oa = openArcade; openArcade = function(id){ V45SP.pts.clear(); const r = oa.apply(this, arguments); if(GAMES[id] && GAMES[id].v45) v44Fit(); return r; };
  addEventListener('resize', () => { if(!v45On()) return; const [vw, vh] = v45Canvas(); if(ARC.s){ ARC.s.vw = vw; ARC.s.vh = vh; } v44Fit(); });
}
