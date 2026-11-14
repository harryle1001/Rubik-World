// ================= EXT10: OLYMPICS, SWIMMING, ARCHERY, GYMNASTICS, KART =================
const OLY_IDS = new Set(['sprint','hurdles','longjump','highjump','polevault','javelin','shotput','lift','diving','gymnast','swim','archery','kart']);
const GAME_EXP = {football:30, basket:25, skate:25, patin:25, ski:30, balloon:30, bbq:30, race:30, airhockey:25, tanks:25};
function arcReward(id, s){
  if(!PROF){ loginNudge(); return; }
  const medal = s.medal || 0, base = OLY_IDS.has(id) ? 35 : (GAME_EXP[id] || 20), bonus = [0, 60, 35, 20][medal] || 0;
  if(medal){ PROF.stats.medals++; mprog('medal'); }
  reward(base + bonus, OLY_IDS.has(id) ? 10 + (medal === 1 ? 10 : 0) : 0, `${GAMES[id].title}${medal ? ' · huy chương ' + ['','vàng','bạc','đồng'][medal] : ''}`);
  if(OLY_IDS.has(id)) mprog('olympic');
  try { mentorResult(id, medal); } catch(e){}
}
const MEDAL_TXT = ['', '🥇 HUY CHƯƠNG VÀNG', '🥈 HUY CHƯƠNG BẠC', '🥉 HUY CHƯƠNG ĐỒNG'];
const medalFor = (v, g, s2, b, lowerBetter) => lowerBetter ? (v <= g ? 1 : v <= s2 ? 2 : v <= b ? 3 : 0) : (v >= g ? 1 : v >= s2 ? 2 : v >= b ? 3 : 0);
// shared stadium scene
function stadiumBg(c, camX, groundY, night){
  const g = c.createLinearGradient(0, 0, 0, groundY); g.addColorStop(0, night ? '#0d1b3a' : '#6fb7ff'); g.addColorStop(1, night ? '#2a3a6a' : '#cfe9ff'); c.fillStyle = g; c.fillRect(0, 0, AW, groundY);
  c.fillStyle = '#546e7a'; c.fillRect(0, groundY - 150, AW, 110);
  for(let r=0;r<5;r++) for(let x = -((camX*.4) % 14); x < AW; x += 14){ c.fillStyle = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#fff','#ff8a2b'][(Math.floor((x + camX*.4)/14) + r*3) % 6] || '#fff'; c.fillRect(x, groundY - 140 + r*18 + Math.sin(realT*8 + x)*1.5, 8, 8); }
  c.fillStyle = '#37474f'; c.fillRect(0, groundY - 40, AW, 6);
  c.fillStyle = '#c0533a'; c.fillRect(0, groundY - 34, AW, AH - groundY + 34); c.fillStyle = '#fff'; for(let k=0;k<4;k++) c.fillRect(0, groundY - 30 + k*24, AW, 2);
  for(let x = -(camX % 100); x < AW; x += 100){ c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x, groundY - 34, 2, 100); c.font = '14px VT323, monospace'; c.fillText(Math.round((x + camX)/50) + 'm', x + 4, groundY + 76); }
}
function athlete(c, look, x, y, sc, opts){ withCtx(c, () => { ctx.save(); ctx.translate(x, y); if(opts.rot) ctx.rotate(opts.rot); ctx.scale(sc, sc); look.dir = opts.dir || 1; look.moving = !!opts.run; look.walk = opts.walk || 0; drawBody(look, false); ctx.restore(); }); }
const myLook = () => PLAYER ? Object.assign({}, PLAYER, {flying:null}) : agentLook(2, {shirt:'#3d7bff'});
const tapAlt = s => { const L = pressed('ArrowLeft') || pressed('KeyA') || pressed('Left'), Rr = pressed('ArrowRight') || pressed('KeyD') || pressed('Right'); let n = 0; if(L && s.lastTap !== 'L'){ n++; s.lastTap = 'L'; } if(Rr && s.lastTap !== 'R'){ n++; s.lastTap = 'R'; } return n; };
const jumpKey = () => pressed('Space') || pressed('Act') || pressed('ArrowUp') || pressed('KeyW') || pressed('Up');
const holdKey = () => KA() || KU() || ARC.ptr.down;
function centerText(c, t, y, size, col){ c.textAlign = 'center'; c.font = `${size || 26}px Bungee, sans-serif`; c.fillStyle = col || '#ffd23f'; c.fillText(t, AW/2, y); c.textAlign = 'left'; }
function startCount(s, dt){ if(s.cd > 0){ const p = Math.ceil(s.cd); s.cd -= dt; if(Math.ceil(s.cd) !== p) blipSfx(s.cd <= 0 ? 1320 : 660); return true; } return false; }
// ---------- sprint & hurdles ----------
function runEvent(id, title, dist, hurdles, wr){
  return {title, opts:['Thi đấu'], help:`Bấm luân phiên trái, phải (hoặc ◀ ▶) thật nhanh để chạy${hurdles ? ', bấm Space hoặc lên để nhảy qua rào' : ''}. Kỷ lục thế giới ${wr} giây.`,
    init(){ const L = dist*50, hs = []; if(hurdles) for(let k=0;k<10;k++) hs.push(650 + k*((L - 1100)/9)); return {L, hs, cd:3.2, t:0, me:{x:0, v:0, y:0, vy:0, w:0}, ai:[0,1,2].map(i => ({x:0, v:0, y:0, vy:0, w:0, tgt:(wr + 1.2 + i*.6 + Math.random()*.5)*(hurdles ? 1 : 1), look:agentLook(20 + i)})), fin:[], lastTap:''}; },
    update(s, dt){
      if(s.over) return; if(startCount(s, dt)){ if(tapAlt(s)) { s.false = (s.false || 0) + 1; } return; } s.t += dt;
      const me = s.me; me.v += tapAlt(s)*30; me.v -= me.v*1.0*dt; me.v = clampV(me.v, 0, hurdles ? 470 : 560);
      if(hurdles && jumpKey() && me.y >= 0) me.vy = -430;
      [me, ...s.ai].forEach((r, i) => {
        if(r !== me){ const want = s.L/r.tgt; r.v += (want*1.06 - r.v)*dt*1.6; const h = s.hs.find(x => x > r.x && x - r.x < 60); if(h && r.y >= 0) r.vy = -430; }
        if(r.y < 0 || r.vy < 0){ r.vy += 1400*dt; r.y = Math.min(0, r.y + r.vy*dt); if(r.y >= 0) r.vy = 0; }
        const px = r.x; if(!r.done) r.x += r.v*dt; r.w += r.v*dt*.06;
        if(hurdles && r.y > -22 && s.hs.some(h => px < h && r.x >= h)){ r.v *= .45; if(r === me) kickSfx(.8); }
        if(!r.done && r.x >= s.L){ r.done = true; r.time = s.t; s.fin.push(r); if(r === me){ const place = s.fin.length; s.medal = place <= 3 ? place : 0; s.over = `${title}: ${s.t.toFixed(2)} giây · hạng ${place}`; s.sub = MEDAL_TXT[s.medal] || 'Cố gắng lần sau nhé!'; if(s.medal) cheerSfx(); } }
      });
    },
    draw(s, c){
      const camX = s.me.x - 160, gy = 300; stadiumBg(c, camX, gy);
      const fx = s.L - camX; c.fillStyle = '#fff'; c.fillRect(fx, gy - 34, 6, 100);
      s.hs.forEach(h => { const x = h - camX; if(x < -30 || x > AW + 30) return; for(let k=0;k<4;k++){ c.fillStyle = '#fff'; c.fillRect(x, gy - 54 + k*24, 3, 22); c.fillStyle = '#ef4b4b'; c.fillRect(x - 6, gy - 56 + k*24, 15, 5); } });
      [...s.ai, s.me].forEach((r, i) => { const lane = r === s.me ? 3 : i, y = gy - 18 + lane*24 + r.y; athlete(c, r === s.me ? myLook() : r.look, r.x - camX, y, 2.3, {run:r.v > 20, walk:r.w}); });
      hud(c, `${title} · ${Math.max(0, (s.L - s.me.x)/50).toFixed(0)} m còn lại`, `${s.t.toFixed(2)} giây`);
      c.fillStyle = 'rgba(10,15,34,.7)'; c.fillRect(20, 44, 160, 12); c.fillStyle = '#2fbf71'; c.fillRect(22, 46, s.me.v/(hurdles ? 470 : 560)*156, 8);
      if(s.cd > 0) centerText(c, s.cd > 2 ? 'VÀO CHỖ' : s.cd > 1 ? 'SẴN SÀNG' : 'CHẠY!', 140, 40);
      if(s.over) overlay(c, s.over, s.sub);
    }};
}
GAMES.sprint = runEvent('sprint', 'Chạy 100 m', 100, false, 9.58);
GAMES.hurdles = runEvent('hurdles', 'Chạy 110 m vượt rào', 110, true, 12.80);
// ---------- jumps & throws (field events) ----------
function fieldEvent(id, title, cfg){
  return {title, opts:['3 lượt'], help:cfg.help,
    init(){ return {phase:'run', x:0, v:0, w:0, y:0, vy:0, ang:0, angDir:1, pow:0, tries:0, best:0, last:null, msg:'', msgT:0, fly:null, bar:cfg.bar0 || 0, fails:0, lastTap:''}; },
    reset(s){ Object.assign(s, {phase:'run', x:0, v:0, w:0, y:0, vy:0, ang:0, pow:0, fly:null}); },
    finish(s, val, txt){ s.tries++; s.last = val; if(val > s.best) s.best = val; s.msg = txt; s.msgT = 2.2;
      const end = cfg.bars ? s.fails >= 3 : s.tries >= 3;
      if(end){ setTimeout(() => { if(ARC.s !== s) return; s.medal = medalFor(s.best, ...cfg.medals); s.over = `${title}: thành tích tốt nhất ${s.best.toFixed(2)} m`; s.sub = (MEDAL_TXT[s.medal] || 'Chưa có huy chương, thử lại nhé!') + ` · Kỷ lục thế giới ${cfg.wr} m`; if(s.medal) cheerSfx(); }, 1400); }
      else setTimeout(() => { if(ARC.s === s) this.reset(s); }, 1600); },
    update(s, dt){
      if(s.over) return; s.msgT -= dt; cfg.update.call(this, s, dt);
    },
    draw(s, c){ const camX = Math.max(0, s.x - 220), gy = 300; stadiumBg(c, camX, gy); cfg.draw.call(this, s, c, camX, gy);
      hud(c, `${title} · lượt ${Math.min(3, s.tries + 1)}${cfg.bars ? ` · xà ${s.bar.toFixed(2)} m · trượt ${s.fails}/3` : '/3'}`, `Tốt nhất ${s.best.toFixed(2)} m`);
      if(s.msgT > 0) centerText(c, s.msg, 110, 26); if(s.over) overlay(c, s.over, s.sub); }};
}
const runUp = (s, dt, max) => { s.v += tapAlt(s)*30; s.v -= s.v*.9*dt; s.v = clampV(s.v, 0, max); s.x += s.v*dt; s.w += s.v*dt*.06; };
GAMES.longjump = fieldEvent('longjump', 'Nhảy xa', {wr:8.95, medals:[7.5, 6.5, 5.5],
  help:'Bấm luân phiên trái/phải để chạy đà. Tới gần ván giậm (vạch trắng) thì GIỮ Space để chọn góc bật, THẢ ra để nhảy. Giậm quá vạch là phạm quy. Góc đẹp khoảng 20–25 độ.',
  update(s, dt){ const board = 1600;
    if(s.phase === 'run'){ runUp(s, dt, 560); if(holdKey()){ s.phase = 'angle'; s.ang = 0; } if(s.x > board + 40){ this.finish(s, 0, 'Phạm quy! Quá ván giậm'); s.phase = 'done'; } }
    else if(s.phase === 'angle'){ s.x += s.v*dt; s.ang = Math.min(50, s.ang + 55*dt); if(!holdKey() || s.x > board + 30){ if(s.x > board + 8){ this.finish(s, 0, 'Phạm quy! Giậm quá vạch'); s.phase = 'done'; return; } const a = s.ang*Math.PI/180, v = s.v/50*1.05, loss = (board - s.x)/50; s.dist = Math.max(0, (v*v*Math.sin(2*a))/9.81*1.2 - loss); s.fly = {x0:s.x, t:0, T:Math.max(.3, 2*v*Math.sin(a)/9.81)}; s.phase = 'fly'; kickSfx(.5); } }
    else if(s.phase === 'fly'){ s.fly.t += dt; const k = Math.min(1, s.fly.t/s.fly.T); s.x = s.fly.x0 + s.dist*50*k; s.y = -Math.sin(k*Math.PI)*s.dist*14; if(k >= 1){ s.y = 0; s.phase = 'done'; this.finish(s, s.dist, `${s.dist.toFixed(2)} m!`); } } },
  draw(s, c, camX, gy){ const bx = 1600 - camX; c.fillStyle = '#e8d7a8'; c.fillRect(bx + 10, gy - 30, 600, 90); c.fillStyle = '#fff'; c.fillRect(bx, gy - 34, 8, 94); for(let m=1;m<=9;m++){ c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText(m + 'm', bx + m*50, gy + 66); }
    athlete(c, myLook(), s.x - camX, gy + 20 + s.y, 2.4, {run:s.phase === 'run' || s.phase === 'angle', walk:s.w, rot:s.phase === 'fly' ? -.3 : 0});
    if(s.phase === 'angle'){ c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.moveTo(s.x - camX, gy - 20); c.lineTo(s.x - camX + Math.cos(-s.ang*Math.PI/180)*80, gy - 20 + Math.sin(-s.ang*Math.PI/180)*80); c.stroke(); c.font = '20px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(Math.round(s.ang) + '°', s.x - camX + 40, gy - 70); } }});
GAMES.highjump = fieldEvent('highjump', 'Nhảy cao', {wr:2.45, medals:[2.20, 2.05, 1.90], bars:true, bar0:1.75,
  help:'Chạy đà bằng trái/phải, tới gần xà bấm Space để bật nhảy, rồi bấm Space lần nữa đúng lúc qua xà để uốn lưng (kiểu Fosbury). Mỗi lần qua xà, xà nâng 5 cm. Trượt 3 lần là hết.',
  update(s, dt){ const bar = 1300;
    if(s.phase === 'run'){ runUp(s, dt, 420); if(jumpKey() && s.x > bar - 260){ const dist = bar - s.x, opt = Math.abs(dist - 120) < 60; s.jumpH = 1.2 + s.v/420*.9 + (opt ? .25 : 0) + Math.random()*.05; s.phase = 'up'; s.vy = -560; s.arched = 0; } if(s.x > bar - 20){ s.phase = 'done'; s.fails++; this.finish(s, s.best, 'Chạy qua xà, tính trượt!'); } }
    else if(s.phase === 'up'){ s.x += 140*dt; s.vy += 1100*dt; s.y += s.vy*dt; if(jumpKey() && !s.arched){ s.arched = Math.abs(s.x - bar) < 50 ? 1 : .5; } if(s.y >= 0 && s.vy > 0){ s.y = 0; s.phase = 'done'; const h = s.jumpH + (s.arched === 1 ? .2 : 0); if(h >= s.bar){ const v = s.bar; this.finish(s, v, `Qua xà ${v.toFixed(2)} m!`); s.bar = +(s.bar + .05).toFixed(2); s.fails = 0; } else { s.fails++; this.finish(s, s.best, `Trượt xà ${s.bar.toFixed(2)} m`); } } } },
  draw(s, c, camX, gy){ const bx = 1300 - camX, bh = s.bar*90; c.fillStyle = '#9e9e9e'; c.fillRect(bx - 4, gy - bh - 10, 4, bh + 10); c.fillRect(bx + 60, gy - bh - 10, 4, bh + 10); c.fillStyle = '#ffd23f'; c.fillRect(bx - 4, gy - bh, 68, 4); c.fillStyle = '#1e88e5'; c.fillRect(bx + 10, gy - 20, 160, 40);
    athlete(c, myLook(), s.x - camX, gy + 10 + s.y, 2.4, {run:s.phase === 'run', walk:s.w, rot:s.phase === 'up' ? (s.arched ? -1.5 : -.6) : 0}); }});
GAMES.polevault = fieldEvent('polevault', 'Nhảy sào', {wr:6.26, medals:[5.6, 5.2, 4.8], bars:true, bar0:4.4,
  help:'Chạy đà thật nhanh, bấm Space đúng lúc đầu sào chạm hộp cắm (vạch vàng) để cắm sào, rồi bấm Space lần nữa ở điểm cao nhất để buông sào. Tốc độ càng cao bay càng cao.',
  update(s, dt){ const box = 1500;
    if(s.phase === 'run'){ runUp(s, dt, 520); if(jumpKey()){ const off = Math.abs(box - 30 - s.x); s.plant = off < 25 ? 1 : off < 60 ? .8 : .55; s.phase = 'vault'; s.t = 0; s.pk = s.v/520; } if(s.x > box){ s.phase = 'done'; s.fails++; this.finish(s, s.best, 'Không cắm được sào!'); } }
    else if(s.phase === 'vault'){ s.t += dt; const k = s.t/1.2; s.x += 90*dt; s.y = -Math.sin(Math.min(1, k)*Math.PI/2)*s.pk*s.plant*560; if(jumpKey() && !s.rel){ s.rel = Math.abs(k - 1) < .15 ? 1 : .8; } if(k > 1.35){ const h = 3.6 + s.pk*s.plant*2.4*(s.rel || .7); s.phase = 'fall'; s.vy = 0; s.res = h; } }
    else if(s.phase === 'fall'){ s.vy += 1200*dt; s.y = Math.min(0, s.y + s.vy*dt); s.x += 60*dt; if(s.y >= 0){ s.phase = 'done'; s.rel = 0; if(s.res >= s.bar){ const v = s.bar; this.finish(s, v, `Qua xà ${v.toFixed(2)} m!`); s.bar = +(s.bar + .1).toFixed(2); s.fails = 0; } else { s.fails++; this.finish(s, s.best, `Trượt xà ${s.bar.toFixed(2)} m`); } } } },
  draw(s, c, camX, gy){ const bx = 1500 - camX, bh = s.bar*55; c.fillStyle = '#ffd23f'; c.fillRect(bx - 30, gy - 34, 10, 6); c.fillStyle = '#9e9e9e'; c.fillRect(bx, gy - bh - 10, 4, bh + 10); c.fillRect(bx + 70, gy - bh - 10, 4, bh + 10); c.fillStyle = '#ef4b4b'; c.fillRect(bx, gy - bh, 74, 4); c.fillStyle = '#1e88e5'; c.fillRect(bx + 10, gy - 22, 200, 40);
    const px = s.x - camX, py = gy + 10 + s.y; c.strokeStyle = '#ffe082'; c.lineWidth = 3; c.beginPath(); if(s.phase === 'run'){ c.moveTo(px + 10, py - 40); c.lineTo(px + 120, py - 10); } else if(s.phase === 'vault'){ c.moveTo(bx - 25, gy - 30); c.lineTo(px, py - 30); } c.stroke();
    athlete(c, myLook(), px, py, 2.4, {run:s.phase === 'run', walk:s.w, rot:s.phase === 'vault' ? -1.2 : s.phase === 'fall' ? -2.4 : 0}); }});
function throwEvent(id, title, wr, medals, maxV, help, implement){
  return fieldEvent(id, title, {wr, medals, help,
    update(s, dt){ const line = implement === 'shot' ? 300 : 1400;
      if(s.phase === 'run'){ if(implement === 'shot'){ s.phase = 'power'; s.x = 260; } else { runUp(s, dt, maxV); if(holdKey()){ s.phase = 'angle'; s.ang = 10; } if(s.x > line){ s.phase = 'done'; this.finish(s, 0, 'Phạm quy! Giẫm vạch ném'); } } }
      else if(s.phase === 'power'){ s.pow += s.angDir*dt*1.4; if(s.pow > 1){ s.pow = 1; s.angDir = -1; } if(s.pow < 0){ s.pow = 0; s.angDir = 1; } if(jumpKey()){ s.v = maxV*(.5 + s.pow*.5); s.phase = 'angle'; s.ang = 10; s.angDir = 1; } }
      else if(s.phase === 'angle'){ if(implement !== 'shot'){ s.x += s.v*dt*.6; } s.ang += s.angDir*60*dt; if(s.ang > 70 || s.ang < 5) s.angDir *= -1; const go = implement === 'shot' ? jumpKey() : !holdKey(); if(go || s.x > line + 10){ if(s.x > line + 10){ s.phase = 'done'; this.finish(s, 0, 'Phạm quy!'); return; } const a = s.ang*Math.PI/180, v = s.v/50*(implement === 'shot' ? 1.25 : 2.9); s.dist = Math.max(0, v*v*Math.sin(2*a)/9.81*(implement === 'shot' ? .88 : 1) * (1 - Math.abs(s.ang - (implement === 'shot' ? 40 : 36))/120)); s.fly = {x0:s.x, t:0, T:1.2 + s.dist/60}; s.phase = 'fly'; kickSfx(.6); } }
      else if(s.phase === 'fly'){ s.fly.t += dt; if(s.fly.t >= s.fly.T){ s.phase = 'done'; this.finish(s, s.dist, `${s.dist.toFixed(2)} m!`); } } },
    draw(s, c, camX, gy){ const line = (implement === 'shot' ? 300 : 1400) - camX; c.fillStyle = '#fff'; c.fillRect(line, gy - 34, 5, 94);
      const scale = implement === 'shot' ? 25 : 6; for(let m=10;m<=100;m+=10){ if(implement === 'shot' && m > 30) break; const xx = line + (implement === 'shot' ? m/10*10*scale : m*scale); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(xx, gy - 34, 2, 94); c.font = '14px VT323, monospace'; c.fillText((implement === 'shot' ? m/10*10/10*10 : m) + 'm', xx + 3, gy + 64); }
      const px = Math.min(s.x, (implement === 'shot' ? 300 : 1400)) - camX; athlete(c, myLook(), px, gy + 20, 2.4, {run:s.phase === 'run' || (s.phase === 'angle' && implement !== 'shot'), walk:s.w});
      if(s.phase === 'angle' || s.phase === 'power'){ c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.moveTo(px, gy - 30); c.lineTo(px + Math.cos(-s.ang*Math.PI/180)*90, gy - 30 + Math.sin(-s.ang*Math.PI/180)*90); c.stroke(); c.font = '20px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(Math.round(s.ang) + '°', px + 50, gy - 80); if(s.phase === 'power'){ c.fillStyle = 'rgba(10,15,34,.7)'; c.fillRect(px - 40, gy - 150, 20, 100); c.fillStyle = '#ef4b4b'; c.fillRect(px - 38, gy - 52 - s.pow*96, 16, s.pow*96); } }
      if(s.phase === 'fly'){ const k = s.fly.t/s.fly.T, x = line + (s.dist*(implement === 'shot' ? 25 : 6))*k, y = gy - 40 - Math.sin(k*Math.PI)*(80 + s.dist*1.5); if(implement === 'shot'){ c.fillStyle = '#455a64'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); } else { c.save(); c.translate(x, y); c.rotate(-.6 + k*1.2); c.fillStyle = '#ffe082'; c.fillRect(-30, -1.5, 60, 3); c.fillStyle = '#455a64'; c.fillRect(24, -2, 8, 4); c.restore(); } }
      if(s.phase === 'done' && s.last){ const x = line + s.last*(implement === 'shot' ? 25 : 6); c.fillStyle = '#ffd23f'; c.fillRect(x - 2, gy - 34, 4, 94); } }});
}
GAMES.javelin = throwEvent('javelin', 'Ném lao', 98.48, [75, 62, 50], 520, 'Chạy đà bằng trái/phải. GIỮ Space để giương lao, góc lao dao động, THẢ ra để ném trước vạch trắng. Góc đẹp khoảng 34–38 độ.', 'javelin');
GAMES.shotput = throwEvent('shotput', 'Đẩy tạ', 23.37, [19, 16, 13], 520, 'Bấm Space để chốt lực khi thanh đỏ lên cao nhất, sau đó bấm Space lần nữa để chốt góc đẩy (đẹp khoảng 38–42 độ).', 'shot');
// ---------- weightlifting ----------
GAMES.lift = {title:'Cử tạ', opts:['Thi đấu'], help:'Bấm luân phiên trái/phải thật nhanh để nâng tạ lên quá đầu, sau đó giữ thăng bằng bằng trái/phải cho thanh tạ không nghiêng quá 3 giây. Mỗi lần thành công tạ nặng thêm 10 kg.',
  init(){ return {kg:60, phase:'lift', h:0, tilt:0, tv:0, hold:0, fails:0, best:0, msg:'', msgT:0, lastTap:''}; },
  update(s, dt){ if(s.over) return; s.msgT -= dt;
    if(s.phase === 'lift'){ s.h += tapAlt(s)*(.085 - s.kg*.00028); s.h -= dt*.35; s.h = clampV(s.h, 0, 1); if(s.h >= 1){ s.phase = 'hold'; s.hold = 0; s.tilt = 0; s.tv = (Math.random() - .5)*.4; } }
    else if(s.phase === 'hold'){ s.tv += ((Math.random() - .5)*1.6*(s.kg/100) + s.tilt*1.4)*dt; s.tv -= ((KR() ? 1 : 0) - (KL() ? 1 : 0))*1.8*dt; s.tv *= .98; s.tilt += s.tv*dt*2; s.hold += dt;
      if(Math.abs(s.tilt) > .5){ s.fails++; s.msg = 'Rơi tạ!'; s.msgT = 1.5; kickSfx(1); this.next(s, false); } else if(s.hold >= 3){ s.best = s.kg; s.msg = `Thành công ${s.kg} kg!`; s.msgT = 1.5; cheerSfx(); s.kg += 10; this.next(s, true); } } },
  next(s, ok){ s.phase = 'rest'; setTimeout(() => { if(ARC.s !== s) return; if(s.fails >= 3){ s.medal = medalFor(s.best, 140, 120, 100); s.over = `Cử tạ: thành tích ${s.best} kg`; s.sub = MEDAL_TXT[s.medal] || 'Chưa có huy chương'; return; } s.phase = 'lift'; s.h = 0; }, 1600); },
  draw(s, c){ stadiumBg(c, 0, 320); c.fillStyle = '#5d4037'; c.fillRect(250, 330, 300, 30);
    const L = myLook(), y = 330, bh = s.phase === 'hold' || s.phase === 'rest' && s.best ? 1 : s.h; athlete(c, L, 400, y, 3, {}); const by = y - 60 - bh*80;
    c.save(); c.translate(400, by); c.rotate(s.tilt); c.fillStyle = '#cfd8dc'; c.fillRect(-130, -3, 260, 6); const n = Math.min(5, Math.floor(s.kg/40) + 1); for(let k=0;k<n;k++){ c.fillStyle = ['#e53935','#1e88e5','#fdd835','#43a047','#212121'][k]; c.fillRect(-120 + k*8, -26 + k*2, 7, 52 - k*4); c.fillRect(113 - k*8, -26 + k*2, 7, 52 - k*4); } c.restore();
    hud(c, `Cử tạ · ${s.kg} kg · thất bại ${s.fails}/3`, `Tốt nhất ${s.best} kg`);
    if(s.phase === 'lift'){ c.fillStyle = 'rgba(10,15,34,.7)'; c.fillRect(620, 80, 30, 220); c.fillStyle = '#2fbf71'; c.fillRect(624, 296 - s.h*212, 22, s.h*212); }
    if(s.phase === 'hold'){ c.fillStyle = 'rgba(10,15,34,.7)'; c.fillRect(250, 80, 300, 16); c.fillStyle = Math.abs(s.tilt) > .35 ? '#ef4b4b' : '#2fbf71'; c.fillRect(398 + s.tilt*290, 80, 6, 16); centerText(c, `Giữ thăng bằng ${Math.max(0, 3 - s.hold).toFixed(1)}`, 130, 22, '#fff'); }
    if(s.msgT > 0) centerText(c, s.msg, 180, 30); if(s.over) overlay(c, s.over, s.sub); }};
// ---------- diving ----------
GAMES.diving = {title:'Nhảy cầu 10 m', opts:['3 lượt'], help:'Bấm Space để bật nhảy. GIỮ Space (hoặc xuống) để co người xoay lộn, THẢ ra để duỗi thẳng trước khi chạm nước. Vào nước càng thẳng đứng, càng ít bọt nước thì điểm càng cao.',
  init(){ return {phase:'stand', y:0, vy:0, rot:0, tries:0, total:0, last:null, msg:'', msgT:0, splash:[]}; },
  update(s, dt){ if(s.over) return; s.msgT -= dt; s.splash.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 400*dt; p.t -= dt; }); s.splash = s.splash.filter(p => p.t > 0);
    if(s.phase === 'stand'){ if(jumpKey()){ s.phase = 'air'; s.vy = -260; s.y = 0; s.rot = 0; s.x = 0; } }
    else if(s.phase === 'air'){ s.vy += 620*dt; s.y += s.vy*dt; s.x = (s.x || 0) + 30*dt; const tuck = holdKey() || KD(); s.tuck = tuck; s.rot += (tuck ? 9 : 1.2)*dt; s.flips = s.rot/(Math.PI*2);
      if(s.y >= 300){ const ang = ((s.rot % (Math.PI*2)) + Math.PI*2) % (Math.PI*2), off = Math.min(Math.abs(ang - Math.PI), Math.abs(ang - Math.PI) ); const vertical = Math.abs(((s.rot + Math.PI) % Math.PI) - Math.PI/2) ; const err = Math.min(Math.abs((s.rot % Math.PI)), Math.abs(Math.PI - (s.rot % Math.PI))); const clean = s.tuck ? 0 : Math.max(0, 1 - err/1.0); const half = Math.round(s.rot/Math.PI); const dd = 1 + Math.min(4, half)*.4; const score = +(Math.max(0, (clean*7 + 3*(half > 0 ? 1 : .3)))*dd).toFixed(1);
        s.phase = 'water'; s.total += score; s.tries++; s.msg = `${half/2} vòng · ${clean > .8 ? 'vào nước đẹp!' : clean > .4 ? 'hơi nghiêng' : 'bọt nước nhiều'} · ${score} điểm`; s.msgT = 2.4;
        for(let k=0;k<Math.round(6 + (1 - clean)*40);k++) s.splash.push({x:420 + (Math.random() - .5)*20, y:390, vx:(Math.random() - .5)*200, vy:-Math.random()*300*(1.3 - clean), t:1});
        kickSfx(.8);
        setTimeout(() => { if(ARC.s !== s) return; if(s.tries >= 3){ s.medal = medalFor(s.total, 60, 45, 32); s.over = `Nhảy cầu: tổng ${s.total.toFixed(1)} điểm`; s.sub = MEDAL_TXT[s.medal] || 'Chưa có huy chương'; } else s.phase = 'stand'; }, 2200); } } },
  draw(s, c){ const g = c.createLinearGradient(0, 0, 0, AH); g.addColorStop(0, '#81d4fa'); g.addColorStop(1, '#e1f5fe'); c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    c.fillStyle = '#90a4ae'; c.fillRect(260, 60, 30, 340); c.fillStyle = '#eceff1'; c.fillRect(260, 60, 160, 10); c.fillStyle = '#0288d1'; c.fillRect(0, 390, AW, 60); c.fillStyle = 'rgba(255,255,255,.4)'; for(let x=0;x<AW;x+=40) c.fillRect(x + Math.sin(realT*2 + x)*4, 396, 20, 2);
    const L = myLook(); if(s.phase === 'stand') athlete(c, L, 400, 60, 2.4, {}); else if(s.phase === 'air') athlete(c, L, 400 + s.x, 60 + s.y, 2.4, {rot:s.rot});
    s.splash.forEach(p => { c.fillStyle = `rgba(255,255,255,${p.t})`; c.fillRect(p.x, p.y, 4, 4); });
    hud(c, `Nhảy cầu · lượt ${Math.min(3, s.tries + 1)}/3`, `Tổng ${s.total.toFixed(1)} điểm`);
    if(s.phase === 'air'){ c.font = '20px VT323, monospace'; c.fillStyle = '#1a1206'; c.fillText(`${(s.flips || 0).toFixed(1)} vòng ${s.tuck ? '(đang co người)' : ''}`, 560, 120); }
    if(s.msgT > 0) centerText(c, s.msg, 100, 22, '#0d47a1'); if(s.over) overlay(c, s.over, s.sub); }};
// ---------- gymnastics (rhythm routine) ----------
GAMES.gymnast = {title:'Thể dục dụng cụ', opts:['Thể dục tự do','Cầu thăng bằng'], help:'Các mũi tên bay tới vạch vàng: bấm đúng phím mũi tên (hoặc nút) khi mũi tên chạm vạch để thực hiện động tác lộn, xoay. Cuối bài bấm Space khi kim thăng bằng ở giữa để tiếp đất đẹp. Điểm tối đa 10.',
  init(o){ const seq = [], keys = ['ArrowLeft','ArrowUp','ArrowDown','ArrowRight']; let t = 2; for(let i=0;i<22;i++){ seq.push({k:keys[Math.floor(Math.random()*4)], t, j:null}); t += .55 + Math.random()*.35; } return {beam:o === 1, seq, t:0, hit:0, perf:0, miss:0, rot:0, rotV:0, phase:'routine', bal:0, balV:1.6, msg:'', msgT:0, end:t + 1}; },
  update(s, dt){ if(s.over) return; s.msgT -= dt; s.t += dt; s.rot += s.rotV*dt; s.rotV *= Math.pow(.2, dt);
    if(s.phase === 'routine'){ const map = {ArrowLeft:['ArrowLeft','KeyA','Left'], ArrowUp:['ArrowUp','KeyW','Up'], ArrowDown:['ArrowDown','KeyS','Down'], ArrowRight:['ArrowRight','KeyD','Right']};
      Object.keys(map).forEach(k => { if(map[k].some(pressed)){ const n = s.seq.find(n => n.j == null && n.k === k && Math.abs(n.t - s.t) < .28); if(n){ const d = Math.abs(n.t - s.t); n.j = d < .1 ? 'p' : 'g'; s.hit++; if(d < .1) s.perf++; s.rotV = 14; s.msg = d < .1 ? 'Hoàn hảo!' : 'Tốt!'; s.msgT = .5; } } });
      s.seq.forEach(n => { if(n.j == null && s.t > n.t + .28){ n.j = 'm'; s.miss++; s.msg = 'Hụt nhịp'; s.msgT = .5; } });
      if(s.t > s.end){ s.phase = 'land'; s.bal = -1; } }
    else if(s.phase === 'land'){ s.bal += s.balV*dt; if(s.bal > 1 || s.bal < -1){ s.balV *= -1; s.bal = clampV(s.bal, -1, 1); }
      if(jumpKey()){ const land = 1 - Math.abs(s.bal), n = s.seq.length; const score = +(Math.min(10, (s.hit/n)*5.2 + (s.perf/n)*2.3 + land*2.5)).toFixed(2); s.phase = 'done'; s.medal = medalFor(score, 9, 8, 7); s.over = `${s.beam ? 'Cầu thăng bằng' : 'Thể dục tự do'}: ${score} điểm`; s.sub = (MEDAL_TXT[s.medal] || 'Chưa có huy chương') + ` · tiếp đất ${land > .8 ? 'hoàn hảo' : land > .5 ? 'khá' : 'loạng choạng'}`; if(s.medal) cheerSfx(); } } },
  draw(s, c){ c.fillStyle = '#ede7f6'; c.fillRect(0, 0, AW, AH); c.fillStyle = '#b39ddb'; c.fillRect(0, 0, AW, 160); for(let k=0;k<30;k++){ c.fillStyle = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71'][k%4]; c.fillRect(k*27, 120 + Math.sin(realT*6 + k)*2, 18, 18); }
    if(s.beam){ c.fillStyle = '#8d6e4a'; c.fillRect(150, 330, 500, 12); c.fillRect(200, 342, 8, 70); c.fillRect(590, 342, 8, 70); } else { c.fillStyle = '#1e88e5'; c.fillRect(100, 340, 600, 70); }
    athlete(c, myLook(), 400 + Math.sin(s.t*.8)*(s.beam ? 80 : 180), s.beam ? 330 : 345, 2.6, {rot:s.rot, walk:s.t*6, run:s.phase === 'routine'});
    const lanes = {ArrowLeft:0, ArrowUp:1, ArrowDown:2, ArrowRight:3}, ar = ['◀','▲','▼','▶'];
    c.fillStyle = 'rgba(10,15,34,.75)'; c.fillRect(560, 40, 220, 280); c.fillStyle = '#ffd23f'; c.fillRect(560, 270, 220, 3);
    s.seq.forEach(n => { const y = 270 - (n.t - s.t)*240; if(y < 40 || y > 320 || n.j === 'p' || n.j === 'g') return; c.font = '30px VT323, monospace'; c.fillStyle = n.j === 'm' ? '#5a3a4a' : '#fff'; c.fillText(ar[lanes[n.k]], 575 + lanes[n.k]*52, y + 10); });
    if(s.phase === 'land'){ c.fillStyle = 'rgba(10,15,34,.75)'; c.fillRect(200, 60, 400, 20); c.fillStyle = '#2fbf71'; c.fillRect(380, 60, 40, 20); c.fillStyle = '#fff'; c.fillRect(398 + s.bal*190, 56, 4, 28); centerText(c, 'Bấm Space để tiếp đất!', 120, 24, '#4527a0'); }
    hud(c, `${s.beam ? 'Cầu thăng bằng' : 'Thể dục tự do'} · đúng ${s.hit} · hoàn hảo ${s.perf}`, `Hụt ${s.miss}`);
    if(s.msgT > 0) centerText(c, s.msg, 210, 24, '#4527a0'); if(s.over) overlay(c, s.over, s.sub); }};
// ---------- swimming: 5 lanes ----------
GAMES.swim = {title:'Bơi lội 5 làn Olympic', opts:['50 m tự do','100 m tự do'], help:'Bấm trái, phải luân phiên đúng nhịp: bấm khi kim trên thanh nhịp nằm trong vùng xanh sẽ bơi nhanh nhất. Khi hiện chữ "THỞ!" bấm phím lên. Tới thành bể ở cự ly 100 m, bấm xuống khi hiện "LẬT!" để đạp thành bể.',
  init(o){ const L = o ? 100 : 50; return {L, x:0, v:0, t:0, cd:3.2, beat:0, o2:1, breathe:0, turned:L === 50, turnWin:0, lastTap:'', ai:[0,1,2,3].map(i => ({x:0, v:0, name:STU()[i + 4] || 'VĐV', tgt:(L === 50 ? 23 : 50) + i*1.4 + Math.random()*1.5, look:agentLook(30 + i)})), fin:[], strokes:0, msg:'', msgT:0}; },
  update(s, dt){ if(s.over) return; s.msgT -= dt; if(startCount(s, dt)) return; s.t += dt; s.beat = (s.beat + dt*1.6) % 1;
    const taps = tapAlt(s); if(taps){ const good = Math.abs(s.beat - .5) < .15, ok = Math.abs(s.beat - .5) < .3; s.v += good ? 0.55 : ok ? .32 : .12; s.strokes++; if(!good && !ok){ s.msg = 'Lệch nhịp'; s.msgT = .4; } if(s.strokes % 7 === 0) s.breathe = 1.2; }
    if(s.breathe > 0){ s.breathe -= dt; if(pressed('ArrowUp') || pressed('KeyW') || pressed('Up')){ s.breathe = 0; s.o2 = 1; s.msg = 'Thở!'; s.msgT = .5; } else if(s.breathe <= 0){ s.o2 = Math.max(.4, s.o2 - .25); } }
    s.v -= s.v*.55*dt; s.v = clampV(s.v, 0, 2.2*s.o2); s.x += s.v*dt;
    if(!s.turned && s.x >= s.L/2 - 2){ s.turnWin += dt; if(pressed('ArrowDown') || pressed('KeyS') || pressed('Down')){ s.turned = true; s.v += .9; s.msg = 'Lật đẹp!'; s.msgT = .8; } else if(s.x >= s.L/2){ s.turned = true; s.v *= .4; s.msg = 'Lật chậm'; s.msgT = .8; } }
    s.ai.forEach(a => { if(a.done) return; const want = s.L/a.tgt; a.v += (want - a.v)*dt*1.2; a.x += a.v*dt; if(a.x >= s.L){ a.done = true; a.time = s.t; s.fin.push(a); } });
    if(s.x >= s.L && !s.meDone){ s.meDone = true; s.fin.push({me:true}); const place = s.fin.length; s.medal = place <= 3 ? place : 0; s.over = `${s.L} m tự do: ${s.t.toFixed(2)} giây · hạng ${place}/5`; s.sub = MEDAL_TXT[s.medal] || 'Cố gắng lần sau nhé!'; if(s.medal) cheerSfx(); } },
  draw(s, c){ c.fillStyle = '#cfd8dc'; c.fillRect(0, 0, AW, AH); c.fillStyle = '#0288d1'; c.fillRect(40, 60, 720, 360);
    for(let k=1;k<5;k++) for(let x=40;x<760;x+=14) { c.fillStyle = (x/14)%2 ? '#ef4b4b' : '#fff'; c.fillRect(x, 60 + k*72 - 2, 14, 4); }
    c.fillStyle = 'rgba(255,255,255,.12)'; for(let k=0;k<12;k++) c.fillRect(((k*90 + realT*30) % 760) + 20, 70 + (k*53) % 330, 40, 2);
    const half = s.L === 100, toX = d => { const p = half ? (d < 50 ? d/50 : 2 - d/50) : d/50; return 60 + p*660; };
    const all = [...s.ai.slice(0, 2), {me:true, x:s.x}, ...s.ai.slice(2)];
    all.forEach((a, lane) => { const x = toX(Math.min(a.x, s.L)), y = 96 + lane*72, back = half && a.x > 50 ? -1 : 1; c.fillStyle = 'rgba(255,255,255,.7)'; for(let k=0;k<4;k++) c.fillRect(x - back*(18 + k*10), y + Math.sin(realT*9 + k + lane)*3, 8, 3);
      withCtx(c, () => { ctx.save(); ctx.translate(x, y + 8); ctx.scale(1.8, 1.8); const f = a.me ? myLook() : a.look; f.cap = a.me ? '#ffd23f' : ['#ef4b4b','#3d7bff','#2fbf71','#fff'][lane % 4]; f.dir = back; drawBody(f, true); ctx.restore(); });
      c.font = '16px VT323, monospace'; c.fillStyle = a.me ? '#ffd23f' : '#fff'; c.fillText(a.me ? 'BẠN' : a.name, 44, y - 20); });
    c.fillStyle = 'rgba(10,15,34,.8)'; c.fillRect(250, 424, 300, 20); c.fillStyle = '#2fbf71'; c.fillRect(250 + .35*300, 424, .3*300, 20); c.fillStyle = '#ffd23f'; c.fillRect(250 + s.beat*300 - 2, 420, 4, 28);
    hud(c, `Bơi ${s.L} m · còn ${Math.max(0, s.L - s.x).toFixed(1)} m · oxy ${Math.round(s.o2*100)}%`, `${s.t.toFixed(2)} giây`);
    if(s.breathe > 0) centerText(c, 'THỞ! (phím lên)', 140, 30, '#fff'); if(!s.turned && s.x > s.L/2 - 4) centerText(c, 'LẬT! (phím xuống)', 180, 30, '#ff8a2b');
    if(s.cd > 0) centerText(c, s.cd > 1 ? 'CHUẨN BỊ...' : 'BƠI!', 240, 40, '#fff'); if(s.msgT > 0) centerText(c, s.msg, 210, 22, '#fff'); if(s.over) overlay(c, s.over, s.sub); }};
// ---------- archery ----------
GAMES.archery = {title:'Bắn cung Olympic', opts:['18 m','30 m','50 m','70 m'], help:'Di chuột (hoặc phím mũi tên) để ngắm. GIỮ chuột hoặc Space để kéo dây cung, THẢ ra để bắn. Tâm ngắm rung theo nhịp thở, bấm B (phím X) để nín thở cho tâm ổn định. Để ý gió thổi lệch mũi tên. 2 lượt × 6 mũi tên.',
  init(o){ return {dist:[18, 30, 50, 70][o], ax:400, ay:225, draw:0, breath:1, holding:0, arrows:[], n:0, total:0, wind:(Math.random() - .5)*6, fly:null, msg:'', msgT:0, t:0}; },
  update(s, dt){ if(s.over) return; s.t += dt; s.msgT -= dt;
    if(ARC.ptr.x || ARC.ptr.y){ s.ax += (ARC.ptr.x - s.ax)*Math.min(1, dt*6); s.ay += (ARC.ptr.y - s.ay)*Math.min(1, dt*6); }
    s.ax += ((KR() ? 1 : 0) - (KL() ? 1 : 0))*160*dt; s.ay += ((KD() ? 1 : 0) - (KU() ? 1 : 0))*160*dt;
    const pulling = KA() || ARC.ptr.down; if(s.fly){ s.fly.t += dt; if(s.fly.t >= s.fly.T){ this.land(s); } return; }
    if(pulling){ s.draw = Math.min(1, s.draw + dt*1.4); s.holding += dt; } else if(s.draw > .2){ this.shoot(s); } else s.draw = Math.max(0, s.draw - dt*3);
    if(KX() && s.breath > 0){ s.calm = true; s.breath = Math.max(0, s.breath - dt*.5); } else { s.calm = false; s.breath = Math.min(1, s.breath + dt*.15); }
    if(Math.random() < dt*.3) s.wind = clampV(s.wind + (Math.random() - .5)*2, -6, 6); },
  sway(s){ const amp = (s.calm ? 3 : 10 + s.holding*4) * (s.dist/40), t = s.t; return [Math.sin(t*1.7)*amp + Math.sin(t*3.1)*amp*.4, Math.cos(t*1.3)*amp*.8 + Math.sin(t*2.3)*amp*.3]; },
  shoot(s){ const [sx, sy] = this.sway(s); const drop = (1 - s.draw)*60*(s.dist/40), wind = s.wind*s.dist*.35; s.fly = {t:0, T:.25 + s.dist/120, x0:400, y0:420, tx:s.ax + sx + wind + (Math.random() - .5)*4, ty:s.ay + sy + drop + (Math.random() - .5)*4}; s.draw = 0; s.holding = 0; kickSfx(.4); },
  land(s){ const f = s.fly; s.fly = null; const tr = 120*(30/s.dist) + 20, d = Math.hypot(f.tx - 400, f.ty - 225)/tr; const sc = d > 1 ? 0 : Math.min(10, 10 - Math.floor(d*10)); s.arrows.push({x:f.tx, y:f.ty, sc, x10:d < .05}); s.total += sc; s.n++; s.msg = sc === 10 ? (d < .05 ? 'X! Hồng tâm tuyệt đối!' : '10 điểm!') : sc ? sc + ' điểm' : 'Trượt bia'; s.msgT = 1.3; kickSfx(.6);
    if(s.n % 6 === 0 && s.n < 12){ s.msg = `Hết lượt 1: ${s.total} điểm. Thay bia mới!`; s.msgT = 2; setTimeout(() => { if(ARC.s === s) s.arrows = []; }, 1500); s.wind = (Math.random() - .5)*6; }
    if(s.n >= 12){ s.medal = medalFor(s.total, 105, 95, 85); s.over = `Bắn cung ${s.dist} m: ${s.total}/120 điểm`; s.sub = MEDAL_TXT[s.medal] || 'Chưa có huy chương, luyện thêm nhé!'; if(s.medal) cheerSfx(); } },
  draw(s, c){ const g = c.createLinearGradient(0, 0, 0, AH); g.addColorStop(0, '#9fd4ff'); g.addColorStop(.55, '#e8f6ff'); g.addColorStop(.56, '#8bc34a'); g.addColorStop(1, '#558b2f'); c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    const tr = 120*(30/s.dist) + 20; c.fillStyle = '#5d4037'; c.fillRect(392, 225 + tr*.8, 16, 160);
    [['#fafafa','#ddd'],['#fafafa','#ddd'],['#212121','#424242'],['#212121','#424242'],['#1e88e5','#64b5f6'],['#1e88e5','#64b5f6'],['#e53935','#ef9a9a'],['#e53935','#ef9a9a'],['#fdd835','#fff59d'],['#fdd835','#fff59d']].forEach(([c1], k) => { c.fillStyle = c1; c.beginPath(); c.arc(400, 225, tr*(1 - k/10), 0, Math.PI*2); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke(); });
    c.strokeStyle = '#111'; c.beginPath(); c.arc(400, 225, tr*.05, 0, Math.PI*2); c.stroke();
    s.arrows.forEach(a => { c.fillStyle = '#3e2723'; c.fillRect(a.x - 1.5, a.y - 1.5, 3, 3); c.fillStyle = '#ef4b4b'; c.fillRect(a.x + 2, a.y - 6, 3, 5); });
    if(s.fly){ const k = s.fly.t/s.fly.T, x = s.fly.x0 + (s.fly.tx - s.fly.x0)*k, y = s.fly.y0 + (s.fly.ty - s.fly.y0)*k - Math.sin(k*Math.PI)*30, sz = 1 - k*.8; c.fillStyle = '#3e2723'; c.fillRect(x - 2*sz, y - 30*sz, 4*sz, 30*sz); c.fillStyle = '#ef4b4b'; c.fillRect(x - 4*sz, y, 8*sz, 6*sz); }
    else { const [sx, sy] = this.sway(s); const rx = s.ax + sx, ry = s.ay + sy; c.strokeStyle = s.draw >= 1 ? '#2fbf71' : '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, 14, 0, Math.PI*2); c.moveTo(rx - 22, ry); c.lineTo(rx + 22, ry); c.moveTo(rx, ry - 22); c.lineTo(rx, ry + 22); c.stroke(); }
    c.strokeStyle = '#5d4037'; c.lineWidth = 6; c.beginPath(); c.arc(400, 520, 140, Math.PI*1.15, Math.PI*1.85); c.stroke(); c.strokeStyle = '#eee'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(400 + Math.cos(Math.PI*1.15)*140, 520 + Math.sin(Math.PI*1.15)*140); c.lineTo(400, 460 + s.draw*50); c.lineTo(400 + Math.cos(Math.PI*1.85)*140, 520 + Math.sin(Math.PI*1.85)*140); c.stroke();
    c.fillStyle = 'rgba(10,15,34,.75)'; c.fillRect(20, 50, 170, 70); c.font = '18px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(`Gió ${s.wind > 0 ? '→' : '←'} ${Math.abs(s.wind).toFixed(1)} m/s`, 30, 72); c.fillText(`Nín thở ${Math.round(s.breath*100)}%`, 30, 92); c.fillText(`Lực kéo ${Math.round(s.draw*100)}%`, 30, 112);
    hud(c, `Bắn cung ${s.dist} m · mũi ${Math.min(12, s.n + 1)}/12`, `${s.total} điểm`); if(s.msgT > 0) centerText(c, s.msg, 90, 26, '#d84315'); if(s.over) overlay(c, s.over, s.sub); }};
// ---------- RUBIK KART (mode-7 pseudo 3D) ----------
var KT = null;
function kartTrack(){
  if(KT) return KT;
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  const pts = []; for(let i=0;i<64;i++){ const a = i/64*Math.PI*2, r = 340 + 90*Math.sin(a*3) + 40*Math.cos(a*5); pts.push([S/2 + Math.cos(a)*r, S/2 + Math.sin(a)*r*.82]); }
  c.fillStyle = '#4caf50'; c.fillRect(0, 0, S, S); for(let i=0;i<S;i+=32) for(let j=0;j<S;j+=32) if(((i + j)/32) % 2){ c.fillStyle = '#47a64b'; c.fillRect(i, j, 32, 32); }
  for(let k=0;k<160;k++){ c.fillStyle = k%2 ? '#2e7d32' : '#388e3c'; c.beginPath(); c.arc((k*397) % S, (k*211) % S, 10 + k%8, 0, Math.PI*2); c.fill(); }
  const path = () => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = '#fff'; c.lineWidth = 92; c.setLineDash([]); path(); c.stroke(); c.strokeStyle = '#e53935'; c.setLineDash([16, 16]); path(); c.stroke(); c.setLineDash([]);
  c.strokeStyle = '#616161'; c.lineWidth = 80; path(); c.stroke(); c.strokeStyle = '#757575'; c.lineWidth = 2; c.setLineDash([20, 20]); path(); c.stroke(); c.setLineDash([]);
  const [sx, sy] = pts[0], [nx, ny] = pts[1], ang = Math.atan2(ny - sy, nx - sx); c.save(); c.translate(sx, sy); c.rotate(ang); for(let i=-5;i<5;i++) for(let j=0;j<2;j++){ c.fillStyle = (i + j) % 2 ? '#111' : '#fff'; c.fillRect(j*8 - 8, i*8, 8, 8); } c.restore();
  const data = new Uint32Array(c.getImageData(0, 0, S, S).data.buffer.slice(0));
  const boxes = []; [10, 26, 44].forEach(i => { const [x, y] = pts[i], [x2, y2] = pts[i + 1], a = Math.atan2(y2 - y, x2 - x) + Math.PI/2; for(let k=-1.5;k<=1.5;k++) boxes.push({x:x + Math.cos(a)*k*16, y:y + Math.sin(a)*k*16, t:0}); });
  KT = {S, pts, data, boxes}; return KT;
}
const KART_COLS = ['#ef4b4b','#3d7bff','#2fbf71','#ffd23f','#b06bff','#ff8a2b'];
const KITEMS = [['boost','Tăng tốc'], ['oil','Vũng dầu'], ['shield','Khiên'], ['star','Siêu sao']];
GAMES.kart = {title:'Rubik Kart · đua xe 3D', opts:['50cc dễ','100cc','150cc khó'], help:'Lên/A: ga · Xuống: phanh · Trái/phải: lái · Giữ X (nút B) khi đang cua để drift tích tia lửa, thả ra để tăng tốc · Chạy qua hộp quà để nhận vật phẩm, bấm Space dùng. Đua 3 vòng!',
  init(o){ const T = kartTrack(), [x0, y0] = T.pts[0], [x1, y1] = T.pts[1], a0 = Math.atan2(y1 - y0, x1 - x0);
    const mk = (i, me) => { const side = (i%2 ? 1 : -1)*14, back = Math.floor(i/2)*24 + 10; return {me, x:x0 - Math.cos(a0)*back - Math.sin(a0)*side, y:y0 - Math.sin(a0)*back + Math.cos(a0)*side, a:a0, v:0, lap:0, wp:0, prog:0, item:null, boost:0, spin:0, shield:0, drift:0, dsp:0, col:KART_COLS[i % 6], name:me ? 'Bạn' : (STU()[i] || 'Máy'), skill:.86 + i*.02 + o*.04, fin:0}; };
    const karts = [mk(5, true)].concat([0,1,2,3,4].map(i => mk(i, false)));
    karts.forEach(k => { let b = 0, bd = 1e9; T.pts.forEach((p, i) => { const d = (p[0] - k.x)**2 + (p[1] - k.y)**2; if(d < bd){ bd = d; b = i; } }); k.wp = b; k.lap = b < 8 ? 1 : 0; });
    return {karts, me:karts[0], oil:[], cd:3.5, t:0, diff:o, fin:[], img:null, msg:'', msgT:0}; },
  update(s, dt){ if(s.over) return; const T = KT; s.msgT -= dt; const cnt = startCount(s, dt); if(!cnt) s.t += dt;
    T.boxes.forEach(b => { b.t = Math.max(0, b.t - dt); });
    s.karts.forEach(k => {
      if(cnt){ k.v = 0; return; }
      const maxV = (150 + s.diff*25)*(k.boost > 0 ? 1.45 : 1)*(k.me ? 1 : k.skill);
      let steer = 0, gas = 0;
      if(k.me){ gas = KU() || kd('KeyZ') ? 1 : KD() ? -1 : 0; steer = (KR() ? 1 : 0) - (KL() ? 1 : 0);
        const dr = KX() && Math.abs(steer) > 0 && k.v > 60; if(dr){ k.drift += dt; k.dsp = Math.min(3, k.dsp + dt*1.3); } else if(k.drift > 0){ if(k.dsp > .8){ k.boost = .4 + k.dsp*.35; s.msg = 'Drift tăng tốc!'; s.msgT = .8; } k.drift = 0; k.dsp = 0; }
        if(pressed('Space') || pressed('Act')) useItem(s, k); }
      else { const tgt = T.pts[(k.wp + 3) % T.pts.length], da = Math.atan2(tgt[1] - k.y, tgt[0] - k.x) - k.a; steer = clampV(Math.atan2(Math.sin(da), Math.cos(da))*2.5, -1, 1); gas = 1; if(k.item && Math.random() < dt*.4) useItem(s, k); }
      if(k.spin > 0){ k.spin -= dt; k.a += dt*10; k.v *= Math.pow(.2, dt); }
      else { k.v += gas*(gas > 0 ? 120 : 220)*dt; k.a += steer*dt*(1.6 + (k.drift > 0 ? .9 : 0))*Math.min(1, k.v/70); }
      k.boost = Math.max(0, k.boost - dt); k.shield = Math.max(0, k.shield - dt);
      const px = Math.floor(k.x), py = Math.floor(k.y), col = T.data[(py & 1023)*T.S + (px & 1023)] || 0, g = (col >> 8) & 255, r = col & 255, off = g > 130 && r < 100;
      k.v = Math.min(k.v, off ? maxV*.45 : maxV); k.v -= k.v*(off ? 1.2 : .25)*dt; if(gas === 0) k.v -= k.v*.5*dt; k.v = Math.max(-40, k.v);
      k.x = clampV(k.x + Math.cos(k.a)*k.v*dt, 10, T.S - 10); k.y = clampV(k.y + Math.sin(k.a)*k.v*dt, 10, T.S - 10);
      let best = k.wp, bd = 1e9; for(let d=-2; d<=4; d++){ const i = (k.wp + d + T.pts.length) % T.pts.length, p = T.pts[i], dd = (p[0] - k.x)**2 + (p[1] - k.y)**2; if(dd < bd){ bd = dd; best = i; } }
      if(best < 8 && k.wp > T.pts.length - 8){ k.lap++; if(k.me && k.lap < 4 && k.lap > 1){ s.msg = k.lap === 3 ? 'VÒNG CUỐI!' : `Vòng ${k.lap}/3`; s.msgT = 1.5; blipSfx(1320); } }
      if(best > T.pts.length - 8 && k.wp < 8 && k.lap > 0) k.lap--;
      k.wp = best; k.prog = k.lap*1000 + k.wp;
      T.boxes.forEach(b => { if(b.t <= 0 && (b.x - k.x)**2 + (b.y - k.y)**2 < 160){ b.t = 4; if(!k.item){ k.item = KITEMS[Math.floor(Math.random()*KITEMS.length)]; if(k.me){ s.msg = 'Nhận: ' + k.item[1]; s.msgT = 1; blipSfx(1500); } } } });
      s.oil.forEach(o => { if(!o.hit && o.owner !== k && (o.x - k.x)**2 + (o.y - k.y)**2 < 120){ o.hit = true; if(k.shield > 0) return; k.spin = 1.1; if(k.me){ s.msg = 'Trượt vũng dầu!'; s.msgT = 1; } } });
      if(k.lap >= 4 && !k.fin){ k.fin = s.t; s.fin.push(k); if(k.me){ const p = s.fin.length; s.medal = p <= 3 ? p : 0; s.over = `Về đích hạng ${p}/6 · ${s.t.toFixed(2)} giây`; s.sub = MEDAL_TXT[s.medal] || 'Thử lại để lên bục nhé!'; if(p <= 3) cheerSfx(); kartEngine(false); } }
    });
    for(let i=0;i<s.karts.length;i++) for(let j=i+1;j<s.karts.length;j++){ const a = s.karts[i], b = s.karts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if(d < 12 && d > 0){ const p = (12 - d)/2; a.x -= dx/d*p; a.y -= dy/d*p; b.x += dx/d*p; b.y += dy/d*p; } }
    s.oil = s.oil.filter(o => !o.hit);
    kartEngine(true, s.me.v);
  },
  draw(s, c){ kartRender(s, c); }
};
function useItem(s, k){ if(!k.item) return; const it = k.item[0]; k.item = null; if(it === 'boost') k.boost = 1.6; else if(it === 'shield') k.shield = 6; else if(it === 'star'){ k.boost = 2.4; k.shield = 3; } else if(it === 'oil') s.oil.push({x:k.x - Math.cos(k.a)*18, y:k.y - Math.sin(k.a)*18, owner:k}); if(k.me) blipSfx(990); }
var KENG = null;
function kartEngine(on, v){ try { if(on && !KENG){ ensureAC(); const o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter(); o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 600; g.gain.value = .04; o.connect(lp); lp.connect(g); g.connect(sfx()); o.start(); KENG = {o, g}; } if(KENG){ if(!on){ KENG.o.stop(); KENG = null; return; } KENG.o.frequency.value = 50 + Math.abs(v || 0)*.9; } } catch(e){} }
var KBUF = null;
function kartRender(s, c){
  const T = KT, Wb = 400, Hb = 225, hor = 72; if(!KBUF){ const cv = document.createElement('canvas'); cv.width = Wb; cv.height = Hb; KBUF = {cv, ctx:cv.getContext('2d'), img:null}; KBUF.img = KBUF.ctx.createImageData(Wb, Hb); KBUF.u32 = new Uint32Array(KBUF.img.data.buffer); }
  const me = s.me, ca = Math.cos(me.a), sa = Math.sin(me.a), camX = me.x - ca*34, camY = me.y - sa*34, camH = 22, F = 190, u = KBUF.u32, S = T.S, D = T.data;
  for(let y = hor + 1; y < Hb; y++){ const z = camH*F/(y - hor), rowX = camX + ca*z, rowY = camY + sa*z, half = z*Wb/(2*F), lx = rowX + sa*half, ly = rowY - ca*half, dx = -sa*2*half/Wb, dy = ca*2*half/Wb; let wx = lx, wy = ly; const fog = Math.min(1, (y - hor)/50);
    for(let x=0;x<Wb;x++){ const px = wx | 0, py = wy | 0; let col = (px < 0 || py < 0 || px >= S || py >= S) ? 0xff2e7d32 : D[py*S + px]; if(fog < 1){ const r = col & 255, g = (col >> 8) & 255, b = (col >> 16) & 255, f = fog, k = 1 - f; col = 0xff000000 | (((b*f + 230*k) | 0) << 16) | (((g*f + 220*k) | 0) << 8) | ((r*f + 200*k) | 0); } u[y*Wb + x] = col; wx += dx; wy += dy; } }
  const g = KBUF.ctx; g.putImageData(KBUF.img, 0, 0);
  const sk = g.createLinearGradient(0, 0, 0, hor); sk.addColorStop(0, '#4fa3e0'); sk.addColorStop(1, '#d9f0ff'); g.fillStyle = sk; g.fillRect(0, 0, Wb, hor + 1);
  const off = ((me.a/(Math.PI*2))*800) % 400; g.fillStyle = '#7e8fa6'; for(let k=-1;k<3;k++){ const bx = k*200 - off; g.beginPath(); g.moveTo(bx, hor + 1); g.lineTo(bx + 60, hor - 30); g.lineTo(bx + 110, hor - 12); g.lineTo(bx + 160, hor - 40); g.lineTo(bx + 220, hor + 1); g.fill(); }
  const spr = [];
  const proj = (x, y) => { const dx = x - camX, dy = y - camY, fz = dx*ca + dy*sa, sd = -dx*sa + dy*ca; if(fz < 4) return null; return {sx:Wb/2 + sd/fz*F, sy:hor + camH*F/fz, k:F/fz, fz}; };
  T.boxes.forEach(b => { if(b.t > 0) return; const p = proj(b.x, b.y); if(p) spr.push({p, f:p2 => { const sz = 10*p2.k; g.fillStyle = `hsl(${(realT*200) % 360},80%,60%)`; g.fillRect(p2.sx - sz/2, p2.sy - sz*1.2 - Math.sin(realT*4)*2*p2.k, sz, sz); g.fillStyle = '#fff'; g.font = `${Math.max(6, sz*.8) | 0}px Bungee`; g.fillText('?', p2.sx - sz*.25, p2.sy - sz*.4); }}); });
  s.oil.forEach(o => { const p = proj(o.x, o.y); if(p) spr.push({p, f:p2 => { g.fillStyle = 'rgba(20,20,30,.85)'; g.beginPath(); g.ellipse(p2.sx, p2.sy, 12*p2.k, 4*p2.k, 0, 0, Math.PI*2); g.fill(); }}); });
  s.karts.forEach(k => { if(k.me) return; const p = proj(k.x, k.y); if(p) spr.push({p, f:p2 => drawKart(g, p2.sx, p2.sy, p2.k*.9, k, me.a - k.a)}); });
  spr.sort((a, b) => b.p.fz - a.p.fz).forEach(o => o.f(o.p));
  drawKart(g, Wb/2, Hb - 22, 1.15, me, 0, true);
  c.imageSmoothingEnabled = false; c.drawImage(KBUF.cv, 0, 0, AW, AH); c.imageSmoothingEnabled = true;
  const rank = [...s.karts].sort((a, b) => (b.fin ? 1e6 - b.fin : b.prog) - (a.fin ? 1e6 - a.fin : a.prog)).indexOf(me) + 1;
  hud(c, `Vòng ${Math.min(3, Math.max(1, me.lap))}/3 · Hạng ${rank}/6 · ${Math.round(me.v*.6)} km/h`, me.item ? 'Vật phẩm: ' + me.item[1] + ' (Space)' : `${s.t.toFixed(1)} giây`);
  c.fillStyle = 'rgba(10,15,34,.6)'; c.fillRect(AW - 130, 44, 120, 100); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); T.pts.forEach(([x, y], i) => { const mx = AW - 125 + x/1024*110, my = 48 + y/1024*92; i ? c.lineTo(mx, my) : c.moveTo(mx, my); }); c.closePath(); c.stroke();
  s.karts.forEach(k => { c.fillStyle = k.col; c.fillRect(AW - 128 + k.x/1024*110, 45 + k.y/1024*92, k.me ? 7 : 5, k.me ? 7 : 5); });
  if(me.dsp > .2){ c.fillStyle = me.dsp > 2 ? '#b06bff' : me.dsp > .8 ? '#ff8a2b' : '#4fc3f7'; for(let k=0;k<6;k++) c.fillRect(AW/2 - 50 + Math.random()*100, AH - 30 + Math.random()*20, 4, 4); }
  if(s.cd > 0) centerText(c, s.cd > 3 ? 'SẴN SÀNG' : String(Math.ceil(s.cd)), 160, 60);
  if(s.msgT > 0) centerText(c, s.msg, 120, 26); if(s.over) overlay(c, s.over, s.sub);
}
function drawKart(g, x, y, k, kt, rel, me){
  g.save(); g.translate(x, y); g.scale(k, k); if(kt.spin > 0) g.rotate(Math.sin(realT*20)*.4);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 2, 26, 6, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#212121'; g.fillRect(-26, -12, 10, 14); g.fillRect(16, -12, 10, 14);
  g.fillStyle = kt.col; g.fillRect(-18, -18, 36, 18); g.fillStyle = '#fff'; g.fillRect(-4, -18, 8, 18); g.fillStyle = '#ffd23f'; g.fillRect(-20, -6, 6, 4); g.fillRect(14, -6, 6, 4);
  g.fillStyle = '#333'; g.fillRect(-10, -26, 20, 8); const hc = me && PLAYER ? PLAYER.hair : '#3a2418'; g.fillStyle = me && PLAYER ? PLAYER.shirt : kt.col; g.fillRect(-7, -34, 14, 10); g.fillStyle = hc; g.fillRect(-7, -44, 14, 10); g.fillStyle = '#fff'; g.fillRect(-7, -40, 14, 3);
  if(kt.boost > 0){ g.fillStyle = Math.random() < .5 ? '#ff9800' : '#ffeb3b'; g.fillRect(-8, -2, 6, 6 + Math.random()*6); g.fillRect(2, -2, 6, 6 + Math.random()*6); }
  if(kt.shield > 0){ g.strokeStyle = 'rgba(79,195,247,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(0, -16, 30, 0, Math.PI*2); g.stroke(); }
  g.restore();
}
// ---------- Olympic hub ----------
const OLY_LIST = [['sprint','Chạy 100 m'],['hurdles','110 m vượt rào'],['longjump','Nhảy xa'],['highjump','Nhảy cao'],['polevault','Nhảy sào'],['javelin','Ném lao'],['shotput','Đẩy tạ'],['lift','Cử tạ'],['gymnast','Thể dục dụng cụ'],['diving','Nhảy cầu 10 m'],['swim','Bơi lội 5 làn'],['archery','Bắn cung'],['kart','Rubik Kart']];
function openOlympics(){ showModal('mOly'); const g = $('#olyGrid'); g.innerHTML = ''; OLY_LIST.forEach(([id, n], i) => { const b = el('button', {type:'button', className:'olyb'}); b.style.animationDelay = i*35 + 'ms'; const lv = id === 'gymnast' ? GAME_LVL.gym : GAME_LVL[id] || GAME_LVL.olympic; b.innerHTML = `<b></b><span></span>`; b.firstChild.textContent = n; b.lastChild.textContent = PROF && PROF.level >= lv ? 'Thưởng EXP + $10' : `Mở khóa Level ${lv}`; b.onclick = () => { if(!lvlOK(id === 'gymnast' ? 'gym' : GAME_LVL[id] ? id : 'olympic', n)) return; openArcade(id); }; g.appendChild(b); }); }

