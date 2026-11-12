// ================= EXT: ARCADE MINI GAMES =================
var ARC = {id:null, g:null, s:null, raf:0, last:0, code:{}, ptr:{down:false, x:0, y:0}, opt:0, paused:false, done:false};
const AW = 800, AH = 450;
function withCtx(c, fn){ const prev = ctx; ctx = c; try { fn(); } finally { ctx = prev; } }
const kd = (...cs) => cs.some(c => ARC.code[c]);
const KL = () => kd('ArrowLeft','KeyA','Left'), KR = () => kd('ArrowRight','KeyD','Right'), KU = () => kd('ArrowUp','KeyW','Up'), KD = () => kd('ArrowDown','KeyS','Down'), KA = () => kd('Space','Act'), KX = () => kd('KeyX','Enter','Alt');
function pressed(code){ return ARC.code[code] && !ARC.prev[code]; }
ARC.prev = {};
function agentLook(i, extra){ return Object.assign(lookFor(i), extra || {}); }
function drawGuy(c, f, x, y, sc, dir, moving, walk){ withCtx(c, () => { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); f.dir = dir; f.moving = moving; f.walk = walk || 0; drawBody(f, false); ctx.restore(); }); }
function hud(c, left, right){ c.fillStyle = 'rgba(10,15,34,.72)'; c.fillRect(0, 0, AW, 34); c.font = '22px VT323, monospace'; c.fillStyle = '#ffd23f'; c.textAlign = 'left'; c.fillText(left, 12, 24); c.textAlign = 'right'; c.fillStyle = '#fff'; c.fillText(right, AW - 12, 24); c.textAlign = 'left'; }
function overlay(c, t1, t2){ c.fillStyle = 'rgba(5,8,20,.72)'; c.fillRect(0, 0, AW, AH); c.textAlign = 'center'; c.font = '30px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(t1, AW/2, AH/2 - 10); c.font = '24px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(t2 || 'Bấm "Chơi lại" để chơi ván mới', AW/2, AH/2 + 28); c.textAlign = 'left'; }
const clampV = (v, a, b) => Math.max(a, Math.min(b, v));
const STU = () => students.map(s => s.name);

const GAMES = {};
// ---------- FOOTBALL ----------
GAMES.football = {
  title:'Bóng đá mini', opts:['Đấu với máy','2 người 1 máy'],
  help:'Người 1: mũi tên hoặc WASD để chạy, Space để sút. Chế độ 2 người: người 1 dùng WASD + Space, người 2 dùng mũi tên + Enter. Thủ môn tự bắt bóng. Trận đấu 2 phút.',
  init(o){ return {p:[{x:250, y:225, vx:0, vy:0, cd:0, team:0, look:agentLook(2, {shirt:'#3d7bff'})}, {x:550, y:225, vx:0, vy:0, cd:0, team:1, look:agentLook(5, {shirt:'#ef4b4b'})}], k:[{x:52, y:225}, {x:748, y:225}], b:{x:400, y:225, vx:0, vy:0}, sc:[0,0], time:120, freeze:1.2, msg:'Bắt đầu!', two:o === 1}; },
  reset(s, who){ s.p[0].x = 250; s.p[0].y = 225; s.p[1].x = 550; s.p[1].y = 225; s.b = {x:400, y:225, vx:who === 0 ? 40 : who === 1 ? -40 : 0, vy:0}; s.freeze = 1.4; },
  update(s, dt){
    if(s.over) return;
    if(s.freeze > 0){ s.freeze -= dt; if(s.freeze <= 0){ s.msg = ''; whistleSfx(); } return; }
    s.time -= dt; if(s.time <= 0){ s.time = 0; s.over = s.sc[0] > s.sc[1] ? 'Đội Xanh thắng!' : s.sc[0] < s.sc[1] ? (s.two ? 'Đội Đỏ thắng!' : 'Máy thắng rồi!') : 'Hòa!'; whistleSfx(); if(s.sc[0] > s.sc[1]) mprog('football'); return; }
    const b = s.b;
    s.p.forEach((p, i) => {
      let dx = 0, dy = 0, kick = false;
      if(i === 0){ dx = s.two ? (kd('KeyD') - kd('KeyA')) : (KR() - KL()); dy = s.two ? (kd('KeyS') - kd('KeyW')) : (KD() - KU()); kick = s.two ? kd('Space','Act') : KA(); }
      else if(s.two){ dx = kd('ArrowRight') - kd('ArrowLeft'); dy = kd('ArrowDown') - kd('ArrowUp'); kick = kd('Enter','Alt'); }
      else {
        const gx = 30, tx = b.x + 16, ty = b.y + (b.y - 225)*.08, ex = tx - p.x, ey = ty - p.y, d = Math.hypot(ex, ey);
        if(d > 4){ dx = ex/d; dy = ey/d; }
        kick = Math.hypot(b.x - p.x, b.y - p.y) < 24 && p.x > b.x - 4 && Math.random() < .08;
      }
      const L = Math.hypot(dx, dy) || 1, sp = i === 1 && !s.two ? 165 : 205;
      p.vx = dx/L*sp; p.vy = dy/L*sp; p.x = clampV(p.x + p.vx*dt, 34, 766); p.y = clampV(p.y + p.vy*dt, 34, 416); p.cd -= dt; p.walk = (p.walk || 0) + (dx || dy ? dt*10 : 0);
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if(kick && p.cd <= 0 && d < 26){
        const gx = p.team === 0 ? 790 : 10, gy = 225 + (i === 0 ? dy : (Math.random() - .5)*1.6)*45 + (p.y - 225)*.15, ex = gx - b.x, ey = gy - b.y, l = Math.hypot(ex, ey);
        b.vx = ex/l*560; b.vy = ey/l*560; p.cd = .35; kickSfx(1);
      } else if(d < 16){ const nx = (b.x - p.x)/(d || 1), ny = (b.y - p.y)/(d || 1), sp2 = Math.max(70, Math.hypot(p.vx, p.vy)*1.15); b.vx = nx*sp2; b.vy = ny*sp2; b.x = p.x + nx*16; b.y = p.y + ny*16; }
    });
    s.k.forEach((k, i) => { const ty = clampV(b.y, 185, 265); k.y += clampV(ty - k.y, -150*dt, 150*dt); if(Math.hypot(b.x - k.x, b.y - k.y) < 20 && Math.hypot(b.vx, b.vy) < 700){ b.vx = (i === 0 ? 1 : -1)*(300 + Math.random()*120); b.vy = (Math.random() - .5)*300; kickSfx(.7); } });
    b.x += b.vx*dt; b.y += b.vy*dt; const fr = Math.pow(.42, dt); b.vx *= fr; b.vy *= fr;
    if(b.y < 34 || b.y > 416){ b.vy *= -.8; b.y = clampV(b.y, 34, 416); }
    const inMouth = b.y > 180 && b.y < 270;
    if(b.x < 30){ if(inMouth){ s.sc[1]++; s.msg = s.two ? 'Đội Đỏ ghi bàn!' : 'Máy ghi bàn!'; cheerSfx(); this.reset(s, 0); } else { b.vx = Math.abs(b.vx)*.8; b.x = 30; } }
    if(b.x > 770){ if(inMouth){ s.sc[0]++; s.msg = 'VÀOOO! Đội Xanh ghi bàn!'; cheerSfx(); this.reset(s, 1); } else { b.vx = -Math.abs(b.vx)*.8; b.x = 770; } }
  },
  draw(s, c){
    for(let i=0;i<10;i++){ c.fillStyle = i%2 ? '#3f9a4a' : '#45a852'; c.fillRect(i*80, 0, 80, AH); }
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(30, 30, 740, 390); c.beginPath(); c.moveTo(400, 30); c.lineTo(400, 420); c.stroke(); c.beginPath(); c.arc(400, 225, 56, 0, Math.PI*2); c.stroke();
    c.strokeRect(30, 140, 80, 170); c.strokeRect(690, 140, 80, 170);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(8, 180, 22, 90); c.fillRect(770, 180, 22, 90);
    c.strokeStyle = '#ddd'; c.lineWidth = 1; for(let y=180; y<=270; y+=9){ c.beginPath(); c.moveTo(8, y); c.lineTo(30, y); c.moveTo(770, y); c.lineTo(792, y); c.stroke(); }
    const gk = [agentLook(7, {shirt:'#ffd23f'}), agentLook(9, {shirt:'#222'})];
    s.k.forEach((k, i) => drawGuy(c, gk[i], k.x, k.y + 14, 1.5, i ? -1 : 1, false));
    s.p.forEach((p, i) => { drawGuy(c, p.look, p.x, p.y + 14, 1.6, p.vx < 0 ? -1 : 1, !!(p.vx || p.vy), p.walk); c.font = '16px VT323, monospace'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(i === 0 ? (s.two ? 'P1' : 'BẠN') : (s.two ? 'P2' : 'MÁY'), p.x, p.y - 44); c.textAlign = 'left'; });
    const b = s.b; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(b.x + 2, b.y + 6, 8, 3, 0, 0, Math.PI*2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x, b.y, 7, 0, Math.PI*2); c.fill(); c.fillStyle = '#222'; c.fillRect(b.x - 2, b.y - 2, 4, 4);
    const m = Math.floor(s.time/60), sec = Math.floor(s.time%60);
    hud(c, `XANH ${s.sc[0]} - ${s.sc[1]} ĐỎ`, `${m}:${String(sec).padStart(2,'0')}`);
    if(s.msg){ c.font = '26px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText(s.msg, AW/2, 90); c.textAlign = 'left'; }
    if(s.over) overlay(c, s.over, `Tỉ số ${s.sc[0]} - ${s.sc[1]} · Bấm "Chơi lại"`);
  }
};
// ---------- BASKETBALL ----------
GAMES.basket = {
  title:'Bóng rổ ném rổ', opts:['60 giây','Ném tự do'],
  help:'Kéo chuột hoặc ngón tay để ngắm, giữ rồi thả để ném. Bàn phím: trái/phải chỉnh góc, giữ Space để lấy lực rồi thả. Ném từ xa được 3 điểm.',
  init(o){ return {sx:160, ang:-.95, pw:0, ch:false, ball:null, sc:0, made:0, shots:0, time:o === 1 ? 1e9 : 60, free:o === 1, msg:'', msgT:0, hoopY:190, hv:0}; },
  shoot(s){ const v = 420 + s.pw*480; s.ball = {x:s.sx + 14, y:330, vx:Math.cos(s.ang)*v, vy:Math.sin(s.ang)*v, t:0, scored:false, three:s.sx < 300}; s.shots++; s.ch = false; s.pw = 0; kickSfx(.5); },
  update(s, dt){
    if(s.over) return;
    if(!s.free){ s.time -= dt; if(s.time <= 0){ s.time = 0; s.over = `Hết giờ! ${s.sc} điểm`; whistleSfx(); if(s.sc >= 10) mprog('basket'); return; } }
    if(s.made >= 4) { s.hv = s.hv || 60; s.hoopY += s.hv*dt; if(s.hoopY < 130 || s.hoopY > 250) s.hv *= -1; }
    s.msgT -= dt;
    if(!s.ball){
      if(KL()) s.ang -= dt*1.2; if(KR()) s.ang += dt*1.2; s.ang = clampV(s.ang, -1.45, -.2);
      const hold = KA() || ARC.ptr.down;
      if(ARC.ptr.down){ s.ang = clampV(Math.atan2(ARC.ptr.y - 330, ARC.ptr.x - (s.sx + 14)), -1.45, -.2); }
      if(hold){ s.ch = true; s.pw = (s.pw + dt*.9) % 1.0001; }
      else if(s.ch) this.shoot(s);
      return;
    }
    const b = s.ball, hy = s.hoopY; b.t += dt; b.vy += 760*dt; const py = b.y; b.x += b.vx*dt; b.y += b.vy*dt;
    [[640, hy], [690, hy]].forEach(([rx, ry]) => { const dx = b.x - rx, dy = b.y - ry, d = Math.hypot(dx, dy); if(d < 13){ const nx = dx/d, ny = dy/d, dot = b.vx*nx + b.vy*ny; if(dot < 0){ b.vx -= 1.6*dot*nx; b.vy -= 1.6*dot*ny; } b.x = rx + nx*13; b.y = ry + ny*13; kickSfx(.3); } });
    if(b.x + 11 > 702 && b.y > hy - 80 && b.y < hy + 20){ b.vx = -Math.abs(b.vx)*.6; b.x = 691; kickSfx(.4); }
    if(!b.scored && py < hy && b.y >= hy && b.x > 648 && b.x < 682 && b.vy > 0){ b.scored = true; const p = b.three ? 3 : 2; s.sc += p; s.made++; s.msg = (p === 3 ? 'BA ĐIỂM! ' : 'VÀO RỔ! ') + '+' + p; s.msgT = 1.2; cheerSfx(); }
    if(b.y > 400){ b.y = 400; b.vy *= -.55; b.vx *= .8; }
    if(b.t > 3.2 || b.x < -30 || b.x > AW + 30){ s.ball = null; if(b.scored) s.sx = 90 + Math.random()*380; }
  },
  pointer(s, type, x, y){},
  draw(s, c){
    const g = c.createLinearGradient(0, 0, 0, AH); g.addColorStop(0, '#203a6b'); g.addColorStop(1, '#3a5a8f'); c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    c.fillStyle = '#c8743a'; c.fillRect(0, 400, AW, 50); c.fillStyle = '#b5652f'; for(let x=0;x<AW;x+=40) c.fillRect(x, 400, 2, 50);
    c.fillStyle = '#fff'; c.fillRect(300, 400, 3, 50); c.font = '16px VT323, monospace'; c.fillText('vạch 3 điểm', 230, 444);
    const hy = s.hoopY;
    c.fillStyle = '#9e9e9e'; c.fillRect(720, hy - 100, 8, 410 - hy + 100); c.fillStyle = '#fff'; c.fillRect(696, hy - 90, 10, 110); c.strokeStyle = '#ef4b4b'; c.lineWidth = 2; c.strokeRect(698, hy - 40, 6, 36);
    c.strokeStyle = '#e65100'; c.lineWidth = 4; c.beginPath(); c.moveTo(640, hy); c.lineTo(692, hy); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; for(let k=0;k<6;k++){ c.beginPath(); c.moveTo(642 + k*9, hy); c.lineTo(650 + k*6, hy + 34); c.stroke(); }
    const f = agentLook(3, {shirt:'#ff8a2b'});
    drawGuy(c, f, s.sx, 400, 2.4, 1, false);
    if(!s.ball){
      c.fillStyle = '#e65100'; c.beginPath(); c.arc(s.sx + 14, 330, 11, 0, Math.PI*2); c.fill();
      const v = 420 + s.pw*480; let x = s.sx + 14, y = 330, vx = Math.cos(s.ang)*v, vy = Math.sin(s.ang)*v; c.fillStyle = 'rgba(255,255,255,.7)';
      for(let i=0;i<14;i++){ for(let k=0;k<4;k++){ vy += 760*.012; x += vx*.012; y += vy*.012; } c.fillRect(x - 2, y - 2, 4, 4); }
      c.fillStyle = 'rgba(10,15,34,.7)'; c.fillRect(20, 60, 24, 150); c.fillStyle = s.pw > .75 ? '#ef4b4b' : '#2fbf71'; c.fillRect(22, 208 - s.pw*146, 20, s.pw*146);
    } else { const b = s.ball; c.fillStyle = '#e65100'; c.beginPath(); c.arc(b.x, b.y, 11, 0, Math.PI*2); c.fill(); c.strokeStyle = '#3a1a00'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(b.x - 11, b.y); c.lineTo(b.x + 11, b.y); c.moveTo(b.x, b.y - 11); c.lineTo(b.x, b.y + 11); c.stroke(); }
    hud(c, `Điểm: ${s.sc} · Vào rổ ${s.made}/${s.shots}`, s.free ? 'Ném tự do' : `Còn ${Math.ceil(s.time)} giây`);
    if(s.msgT > 0){ c.font = '28px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText(s.msg, AW/2, 100); c.textAlign = 'left'; }
    if(s.over) overlay(c, s.over);
  }
};
// ---------- SKATEBOARD ----------
GAMES.skate = {
  title:'Trượt ván', opts:['Bình thường','Khó'],
  help:'Space hoặc phím lên: bật nhảy (ollie). Khi đang bay bấm X để làm động tác lật ván (kickflip) lấy điểm, nhớ xong động tác trước khi chạm đất. Đáp lên thanh sắt hoặc ghế để trượt cạnh (grind).',
  init(o){ return {x:0, y:360, vy:0, ground:true, sp:o ? 330 : 260, acc:o ? 9 : 6, obs:[], next:300, sc:0, lives:3, inv:0, trick:0, rot:0, grind:null, combo:1, msg:'', msgT:0}; },
  update(s, dt){
    if(s.over) return;
    s.sp += s.acc*dt; s.x += s.sp*dt; s.sc += s.sp*dt/20; s.inv -= dt; s.msgT -= dt;
    if(s.x > s.next){ const r = Math.random(), k = r < .35 ? 'cone' : r < .6 ? 'bench' : r < .85 ? 'rail' : 'ramp'; const w = {cone:18, bench:64, rail:150, ramp:80}[k], h = {cone:24, bench:28, rail:36, ramp:40}[k]; s.obs.push({k, x:s.x + AW, w, h}); s.next = s.x + 260 + Math.random()*320; }
    s.obs = s.obs.filter(o => o.x + o.w > s.x - 200);
    if((pressed('Space') || pressed('ArrowUp') || pressed('KeyW') || pressed('Act') || pressed('Up')) && (s.ground || s.grind)){ s.vy = -580; s.ground = false; s.grind = null; kickSfx(.4); }
    if((pressed('KeyX') || pressed('Enter') || pressed('Alt')) && !s.ground && !s.grind && s.trick <= 0){ s.trick = .45; }
    const px = s.x + 160;
    if(s.trick > 0){ s.trick -= dt; s.rot += dt*14; if(s.trick <= 0){ s.rot = 0; const p = 100*s.combo; s.sc += p; s.combo++; s.msg = `Kickflip +${p}`; s.msgT = 1; blipSfx(1200); } }
    if(s.grind){ const o = s.grind; s.sc += 60*dt*s.combo; if(px > o.x + o.w){ s.grind = null; s.ground = false; s.vy = 0; } else { s.y = 360 - o.h; } }
    else if(!s.ground){ s.vy += 1500*dt; const ny = s.y + s.vy*dt;
      const top = s.obs.find(o => (o.k === 'rail' || o.k === 'bench') && px > o.x && px < o.x + o.w && s.y <= 360 - o.h + 2 && ny >= 360 - o.h);
      if(top && s.vy > 0){ if(s.trick > 0) this.bail(s); else { s.grind = top; s.y = 360 - top.h; s.vy = 0; s.msg = 'Grind!'; s.msgT = .8; } }
      else if(ny >= 360){ s.y = 360; s.vy = 0; s.ground = true; if(s.trick > 0) this.bail(s); else if(s.combo > 1){ s.combo = 1; } }
      else s.y = ny;
    }
    if(s.ground){ const rp = s.obs.find(o => o.k === 'ramp' && px > o.x && px < o.x + o.w); if(rp && px > rp.x + rp.w - 12){ s.vy = -760; s.ground = false; s.msg = 'Bay qua dốc!'; s.msgT = .8; } else if(rp){ s.y = 360 - (px - rp.x)/rp.w*rp.h; } else s.y = 360; }
    if(s.inv <= 0 && !s.grind){ const hit = s.obs.find(o => o.k !== 'ramp' && px + 10 > o.x && px - 10 < o.x + o.w && s.y > 360 - o.h + 4); if(hit) this.bail(s); }
  },
  bail(s){ s.lives--; s.inv = 1.6; s.trick = 0; s.rot = 0; s.combo = 1; s.y = 360; s.vy = 0; s.ground = true; s.grind = null; s.msg = 'Té rồi!'; s.msgT = 1; kickSfx(1); if(s.lives <= 0){ s.over = `Hết lượt! ${Math.floor(s.sc)} điểm`; if(s.sc >= 1500) mprog('skate'); } },
  draw(s, c){
    const g = c.createLinearGradient(0, 0, 0, AH); g.addColorStop(0, '#ffb877'); g.addColorStop(1, '#ffe0b2'); c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    c.fillStyle = '#c98b5a'; for(let i=0;i<8;i++){ const x = ((i*170 - s.x*.2) % 1360 + 1360) % 1360 - 160; c.fillRect(x, 200, 120, 160); c.fillStyle = '#b8794a'; c.fillRect(x + 10, 220, 30, 30); c.fillRect(x + 70, 220, 30, 30); c.fillStyle = '#c98b5a'; }
    c.fillStyle = '#8f969c'; c.fillRect(0, 360, AW, 90); c.fillStyle = '#7d848a'; for(let x = -(s.x % 60); x < AW; x += 60) c.fillRect(x, 360, 2, 90);
    s.obs.forEach(o => { const x = o.x - s.x;
      if(o.k === 'cone'){ c.fillStyle = '#ff6f00'; c.beginPath(); c.moveTo(x, 360); c.lineTo(x + o.w, 360); c.lineTo(x + o.w/2, 360 - o.h); c.fill(); c.fillStyle = '#fff'; c.fillRect(x + 5, 348, 8, 3); }
      else if(o.k === 'bench'){ c.fillStyle = '#795548'; c.fillRect(x, 360 - o.h, o.w, 6); c.fillRect(x + 4, 360 - o.h, 5, o.h); c.fillRect(x + o.w - 9, 360 - o.h, 5, o.h); }
      else if(o.k === 'rail'){ c.fillStyle = '#cfd8dc'; c.fillRect(x, 360 - o.h, o.w, 4); c.fillStyle = '#78909c'; for(let k=0;k<4;k++) c.fillRect(x + 6 + k*(o.w - 16)/3, 360 - o.h, 3, o.h); }
      else { c.fillStyle = '#a1887f'; c.beginPath(); c.moveTo(x, 360); c.lineTo(x + o.w, 360 - o.h); c.lineTo(x + o.w, 360); c.fill(); }
    });
    const f = agentLook(11, {shirt:'#26c6da', cap:'#ef4b4b'});
    if(!(s.inv > 0 && Math.floor(s.inv*10) % 2)){
      withCtx(c, () => { ctx.save(); ctx.translate(160, s.y); ctx.scale(2.2, 2.2); ctx.save(); ctx.rotate(s.rot); rect('#222', -12, -3, 24, 3); rect('#ff6f91', -11, -4, 22, 2); rect('#eee', -9, 0, 4, 3); rect('#eee', 5, 0, 4, 3); ctx.restore(); ctx.translate(0, -4); f.dir = 1; f.moving = false; drawBody(f, false); ctx.restore(); });
    }
    hud(c, `Điểm ${Math.floor(s.sc)}  ·  Combo x${s.combo}`, '♥'.repeat(Math.max(0, s.lives)));
    if(s.msgT > 0){ c.font = '26px Bungee, sans-serif'; c.fillStyle = '#d84315'; c.textAlign = 'center'; c.fillText(s.msg, AW/2, 100); c.textAlign = 'left'; }
    if(s.over) overlay(c, s.over);
  }
};
// ---------- ROLLER SKATING ----------
GAMES.patin = {
  title:'Trượt patin', opts:['90 giây','Tự do'],
  help:'Lên: đạp lấy đà · Trái/phải: đổi hướng · Xuống: phanh. Lượn quanh sân, nhặt ngôi sao, tránh va vào các bạn khác. Mỗi vòng sân được thưởng điểm.',
  init(o){ const st = []; for(let i=0;i<6;i++) st.push(this.star()); return {x:400, y:390, h:0, v:0, sc:0, laps:0, ang:Math.atan2(390 - 225, 0), acc:0, fall:0, time:o ? 1e9 : 90, free:!!o, stars:st, ai:[0,1,2,3].map(i => ({a:i*1.57, sp:.55 + i*.08, r:.25 + (i%2)*.5})), msg:'', msgT:0}; },
  star(){ const a = Math.random()*Math.PI*2, r = .2 + Math.random()*.6; return {x:400 + Math.cos(a)*(180 + r*150), y:225 + Math.sin(a)*(70 + r*100)}; },
  inRing(x, y){ const o = ((x - 400)/335)**2 + ((y - 225)/185)**2, i = ((x - 400)/175)**2 + ((y - 225)/65)**2; return o < 1 && i > 1; },
  update(s, dt){
    if(s.over) return;
    if(!s.free){ s.time -= dt; if(s.time <= 0){ s.over = `Hết giờ! ${s.sc} điểm, ${s.laps} vòng`; if(s.sc >= 150) mprog('patin'); return; } }
    s.msgT -= dt;
    if(s.fall > 0){ s.fall -= dt; return; }
    if(KL()) s.h -= dt*3; if(KR()) s.h += dt*3;
    if(KU() || KA()) s.v += 230*dt; if(KD()) s.v -= 300*dt; s.v *= Math.pow(.7, dt); s.v = clampV(s.v, 0, 340);
    const nx = s.x + Math.cos(s.h)*s.v*dt, ny = s.y + Math.sin(s.h)*s.v*dt;
    if(this.inRing(nx, ny)){ s.x = nx; s.y = ny; } else { s.v *= .35; s.h += Math.PI*.6; kickSfx(.3); }
    const a = Math.atan2(s.y - 225, s.x - 400); let da = a - s.ang; if(da > Math.PI) da -= Math.PI*2; if(da < -Math.PI) da += Math.PI*2; s.acc += da; s.ang = a;
    if(Math.abs(s.acc) >= Math.PI*2){ s.acc = 0; s.laps++; s.sc += 50; s.msg = `Hoàn thành vòng ${s.laps}! +50`; s.msgT = 1.3; blipSfx(1320); }
    s.stars.forEach((st, i) => { if(Math.hypot(st.x - s.x, st.y - s.y) < 20){ s.sc += 10; s.stars[i] = this.star(); blipSfx(1760); } });
    s.ai.forEach(b => { b.a += b.sp*dt; const x = 400 + Math.cos(b.a)*(180 + b.r*150), y = 225 + Math.sin(b.a)*(70 + b.r*100); b.x = x; b.y = y; if(Math.hypot(x - s.x, y - s.y) < 22){ s.fall = 1.2; s.v = 0; s.msg = 'Ối, va nhau rồi!'; s.msgT = 1.2; kickSfx(.8); } });
  },
  draw(s, c){
    c.fillStyle = '#56657a'; c.fillRect(0, 0, AW, AH);
    c.fillStyle = '#d6e4f0'; c.beginPath(); c.ellipse(400, 225, 340, 190, 0, 0, Math.PI*2); c.fill(); c.strokeStyle = '#ff6f91'; c.lineWidth = 6; c.stroke();
    c.strokeStyle = 'rgba(80,110,150,.3)'; c.lineWidth = 2; c.beginPath(); c.ellipse(400, 225, 255, 128, 0, 0, Math.PI*2); c.stroke();
    c.fillStyle = '#7b8fa6'; c.beginPath(); c.ellipse(400, 225, 170, 60, 0, 0, Math.PI*2); c.fill(); c.font = '24px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText('PATIN', 400, 234); c.textAlign = 'left';
    s.stars.forEach(st => { c.fillStyle = '#ffd23f'; c.font = '26px VT323, monospace'; c.fillText('★', st.x - 8, st.y + 8); });
    s.ai.forEach((b, i) => { if(b.x != null) drawGuy(c, agentLook(13 + i), b.x, b.y + 12, 1.5, Math.cos(b.a + Math.PI/2) > 0 ? 1 : -1, true, realT*8); });
    const f = agentLook(1, {shirt:'#b06bff'});
    withCtx(c, () => { ctx.save(); ctx.translate(s.x, s.y + 12); ctx.scale(1.7, 1.7); if(s.fall > 0) ctx.rotate(Math.PI/2); f.dir = Math.cos(s.h) < 0 ? -1 : 1; f.moving = s.v > 30; f.walk = realT*8; drawBody(f, false); rect('#e53935', -6, -1, 5, 2); rect('#e53935', 1, -1, 5, 2); ctx.restore(); });
    c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + Math.cos(s.h)*26, s.y + Math.sin(s.h)*26); c.stroke();
    hud(c, `Điểm ${s.sc} · ${s.laps} vòng`, s.free ? 'Tự do' : `Còn ${Math.ceil(s.time)} giây`);
    if(s.msgT > 0){ c.font = '22px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText(s.msg, AW/2, 80); c.textAlign = 'left'; }
    if(s.over) overlay(c, s.over);
  }
};
// ---------- SKI ----------
GAMES.ski = {
  title:'Trượt tuyết vượt cổng', opts:['Dốc xanh (dễ)','Dốc đen (khó)'],
  help:'Trái/phải: nghiêng ván đổi hướng · Xuống: thu người lao nhanh · Lên: phanh. Đi qua giữa hai cờ cùng màu, lỡ cổng bị cộng 3 giây. Tránh cây thông và đá.',
  init(o){ const gates = [], obs = [], L = 6000; for(let y=400; y<L - 200; y += o ? 240 : 300){ const cx = 160 + Math.random()*480; gates.push({y, cx, w:o ? 50 : 66, done:false}); }
    for(let i=0;i<(o ? 90 : 60);i++){ const y = 300 + Math.random()*(L - 400), x = 30 + Math.random()*740; if(gates.some(g => Math.abs(g.y - y) < 50 && Math.abs(g.cx - x) < g.w + 30)) continue; obs.push({x, y, k:Math.random() < .7 ? 'tree' : 'rock'}); }
    return {x:400, y:0, a:0, sp:0, L, gates, obs, t:0, pen:0, miss:0, crash:0, spray:[], fin:false}; },
  update(s, dt){
    if(s.over) return;
    s.t += dt;
    if(s.crash > 0){ s.crash -= dt; s.sp = 0; return; }
    if(KL()) s.a -= dt*2.4; if(KR()) s.a += dt*2.4; s.a = clampV(s.a, -1.3, 1.3);
    let tgt = 140 + 360*Math.cos(s.a); if(KD()) tgt += 140; if(KU()) tgt *= .35; s.sp += (tgt - s.sp)*Math.min(1, dt*1.4);
    const py = s.y; s.x = clampV(s.x + Math.sin(s.a)*s.sp*dt, 16, 784); s.y += Math.cos(s.a)*s.sp*dt;
    s.gates.forEach(g => { if(!g.done && py < g.y && s.y >= g.y){ g.done = true; if(Math.abs(s.x - g.cx) < g.w){ g.ok = true; blipSfx(1320); } else { g.ok = false; s.pen += 3; s.miss++; blipSfx(220); } } });
    s.obs.forEach(o => { if(Math.hypot(o.x - s.x, o.y - s.y) < (o.k === 'tree' ? 16 : 14)){ s.crash = 1; s.pen += 1; s.y += 20; kickSfx(1); } });
    if(Math.random() < s.sp/300) s.spray.push({x:s.x - Math.sin(s.a)*6, y:s.y, t:.6});
    s.spray.forEach(p => p.t -= dt); s.spray = s.spray.filter(p => p.t > 0);
    if(s.y >= s.L){ const tot = s.t + s.pen; let best = null; try { best = +localStorage.getItem('truong-ski-best') || null; if(!best || tot < best){ localStorage.setItem('truong-ski-best', tot.toFixed(2)); } } catch(e){}
      s.over = `Về đích: ${tot.toFixed(2)} giây`; s.sub = `Lỡ ${s.miss} cổng (+${s.pen} giây phạt)` + (best ? ` · Kỷ lục: ${Math.min(best, tot).toFixed(2)} giây` : ''); cheerSfx(); if(s.miss <= 2) mprog('ski'); }
  },
  draw(s, c){
    c.fillStyle = '#f4f8fb'; c.fillRect(0, 0, AW, AH); const oy = s.y - 140;
    c.fillStyle = 'rgba(160,190,220,.25)'; for(let i=0;i<30;i++){ const y = ((i*97 - oy) % 900 + 900) % 900 - 100; c.fillRect((i*233) % 760, y, 40, 3); }
    s.spray.forEach(p => { c.fillStyle = `rgba(200,220,240,${p.t})`; c.fillRect(p.x - 3, p.y - oy - 2, 6, 4); });
    s.gates.forEach(g => { const y = g.y - oy; if(y < -40 || y > AH + 20) return; const col = s.gates.indexOf(g) % 2 ? '#3d7bff' : '#ef4b4b'; [g.cx - g.w, g.cx + g.w].forEach(x => { c.fillStyle = '#555'; c.fillRect(x - 1, y - 24, 2, 26); c.fillStyle = col; c.fillRect(x + 1, y - 24, 12, 9); }); if(g.done){ c.font = '18px VT323, monospace'; c.fillStyle = g.ok ? '#2fbf71' : '#ef4b4b'; c.fillText(g.ok ? '✓' : '+3s', g.cx - 6, y - 28); } });
    s.obs.forEach(o => { const y = o.y - oy; if(y < -40 || y > AH + 30) return; if(o.k === 'tree'){ c.fillStyle = '#2e5a44'; c.beginPath(); c.moveTo(o.x - 14, y + 6); c.lineTo(o.x + 14, y + 6); c.lineTo(o.x, y - 30); c.fill(); c.fillStyle = '#fff'; c.fillRect(o.x - 6, y - 18, 12, 3); c.fillStyle = '#5a3a1e'; c.fillRect(o.x - 2, y + 6, 4, 6); } else { c.fillStyle = '#78909c'; c.beginPath(); c.ellipse(o.x, y, 14, 9, 0, 0, Math.PI*2); c.fill(); } });
    const fy = s.L - oy; if(fy < AH + 20){ for(let x=0;x<AW;x+=20){ c.fillStyle = (x/20)%2 ? '#111' : '#fff'; c.fillRect(x, fy, 20, 10); } }
    const f = agentLook(4, {shirt:'#ef4b4b', cap:'#3d7bff'});
    withCtx(c, () => { ctx.save(); ctx.translate(s.x, 140); ctx.rotate(-s.a*.4); if(s.crash > 0) ctx.rotate(Math.PI/2); rect('#263238', -4, -2, 3, 12); rect('#263238', 2, -2, 3, 12); ctx.scale(1.6, 1.6); f.dir = s.a < 0 ? -1 : 1; drawBody(f, false); ctx.restore(); });
    hud(c, `Thời gian ${(s.t + s.pen).toFixed(1)} giây · Phạt +${s.pen}`, `Còn ${Math.max(0, Math.ceil((s.L - s.y)/10))} m · ${Math.round(s.sp/6)} km/h`);
    if(s.over) overlay(c, s.over, s.sub);
  }
};
// ---------- HOT AIR BALLOON ----------
GAMES.balloon = {
  title:'Bay khinh khí cầu', opts:['Bay ngày','Bay hoàng hôn'],
  help:'Giữ Space, phím lên hoặc giữ chuột trên khung để đốt lửa bay lên, thả ra để hạ xuống. Mỗi tầng cao có gió khác nhau. Nhặt sao và bình gas, tránh chim và núi.',
  init(o){ return {x:0, y:220, vy:0, vx:60, fuel:100, stars:0, items:[], birds:[], next:300, nb:2, burn:false, sunset:o === 1, hit:0}; },
  gy(x){ return 380 + Math.sin(x*.004)*30 + Math.sin(x*.011 + 1)*18 + Math.max(0, Math.sin(x*.0017))*-120; },
  wind(y){ return y < 120 ? 170 + Math.sin(realT*.3)*30 : y < 220 ? 90 : y < 310 ? 130 + Math.sin(realT*.5)*40 : 55; },
  update(s, dt){
    if(s.over) return;
    s.burn = (KA() || KU() || ARC.ptr.down) && s.fuel > 0; s.hit -= dt;
    if(s.burn){ s.vy -= 230*dt; s.fuel = Math.max(0, s.fuel - 9*dt); } else s.vy += 80*dt;
    s.vy *= Math.pow(.5, dt); s.vy = clampV(s.vy, -140, 120); s.y += s.vy*dt; if(s.y < 50){ s.y = 50; s.vy = 0; }
    s.vx += (this.wind(s.y) - s.vx)*Math.min(1, dt*.8); s.x += s.vx*dt;
    if(s.x > s.next){ s.next = s.x + 220 + Math.random()*260; const r = Math.random(); s.items.push({x:s.x + AW, y:70 + Math.random()*260, k:r < .7 ? 'star' : 'gas'}); if(Math.random() < .55) s.birds.push({x:s.x + AW + 100, y:60 + Math.random()*250, ph:Math.random()*6}); }
    s.items = s.items.filter(it => { if(Math.hypot(it.x - (s.x + 200), it.y - (s.y - 30)) < 40){ if(it.k === 'star'){ s.stars++; blipSfx(1760); } else { s.fuel = Math.min(100, s.fuel + 35); blipSfx(990); } return false; } return it.x > s.x - 100; });
    s.birds.forEach(b => { b.x -= 70*dt; b.ph += dt*8; b.yy = b.y + Math.sin(b.ph*.3)*20; if(s.hit <= 0 && Math.hypot(b.x - (s.x + 200), b.yy - (s.y - 30)) < 34){ s.hit = 1.5; s.fuel = Math.max(0, s.fuel - 20); s.vy += 60; kickSfx(.6); } });
    s.birds = s.birds.filter(b => b.x > s.x - 100);
    if(s.y + 34 > this.gy(s.x + 200)){ const dist = Math.floor(s.x/10); s.over = s.fuel <= 0 ? `Hạ cánh! Bay được ${dist} m` : `Chạm núi! Bay được ${dist} m`; s.sub = `Nhặt ${s.stars} ngôi sao · Điểm ${dist + s.stars*50}`; if(dist >= 2000) mprog('balloon'); }
  },
  draw(s, c){
    const g = c.createLinearGradient(0, 0, 0, AH); if(s.sunset){ g.addColorStop(0, '#2b1d5a'); g.addColorStop(.6, '#ff8a65'); g.addColorStop(1, '#ffd180'); } else { g.addColorStop(0, '#4fa3e0'); g.addColorStop(1, '#cdeafc'); } c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    c.fillStyle = 'rgba(255,255,255,.75)'; for(let i=0;i<7;i++){ const x = ((i*260 - s.x*.3) % 1820 + 1820) % 1820 - 200, y = 60 + (i*53) % 200; c.beginPath(); c.ellipse(x, y, 60, 18, 0, 0, Math.PI*2); c.ellipse(x + 40, y - 10, 40, 16, 0, 0, Math.PI*2); c.fill(); }
    [[120,'rgba(255,255,255,.5)'],[220,'rgba(255,255,255,.4)'],[310,'rgba(255,255,255,.3)']].forEach(([y, col]) => { c.strokeStyle = col; c.setLineDash([6, 10]); c.beginPath(); c.moveTo(0, y); c.lineTo(AW, y); c.stroke(); c.setLineDash([]); });
    [60, 170, 265, 350].forEach(y => { c.font = '16px VT323, monospace'; c.fillStyle = 'rgba(20,30,60,.6)'; c.fillText(`gió ${Math.round(this.wind(y)/10)} → `, 8, y); });
    c.fillStyle = s.sunset ? '#4a3a5a' : '#4f8a3c'; c.beginPath(); c.moveTo(0, AH); for(let x=0;x<=AW;x+=10) c.lineTo(x, this.gy(s.x + x)); c.lineTo(AW, AH); c.fill();
    c.fillStyle = s.sunset ? '#3a2a4a' : '#235c34'; for(let x = -(s.x % 70); x < AW; x += 70){ const y = this.gy(s.x + x); c.beginPath(); c.moveTo(x - 9, y + 4); c.lineTo(x + 9, y + 4); c.lineTo(x, y - 18); c.fill(); }
    s.items.forEach(it => { const x = it.x - s.x; if(it.k === 'star'){ c.font = '30px VT323, monospace'; c.fillStyle = '#ffd23f'; c.fillText('★', x - 9, it.y + 9); } else { c.fillStyle = '#ef4b4b'; c.fillRect(x - 8, it.y - 12, 16, 22); c.fillStyle = '#fff'; c.fillRect(x - 4, it.y - 16, 8, 5); c.font = '14px VT323, monospace'; c.fillText('GAS', x - 8, it.y + 4); } });
    s.birds.forEach(b => { const x = b.x - s.x, w = Math.sin(b.ph)*6; c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 12, b.yy - w); c.lineTo(x, b.yy); c.lineTo(x + 12, b.yy - w); c.stroke(); });
    const bx = 200, by = s.y;
    if(!(s.hit > 0 && Math.floor(s.hit*10) % 2)){
      c.fillStyle = '#ef4b4b'; c.beginPath(); c.ellipse(bx, by - 60, 40, 48, 0, 0, Math.PI*2); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(bx - 22, by - 106, 10, 90); c.fillRect(bx + 12, by - 106, 10, 90); c.fillStyle = '#3d7bff'; c.fillRect(bx - 5, by - 108, 10, 96);
      c.strokeStyle = '#5a3a1e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx - 26, by - 24); c.lineTo(bx - 12, by + 4); c.moveTo(bx + 26, by - 24); c.lineTo(bx + 12, by + 4); c.stroke();
      if(s.burn){ c.fillStyle = '#ff9800'; c.beginPath(); c.moveTo(bx - 6, by - 8); c.lineTo(bx + 6, by - 8); c.lineTo(bx, by - 26 - Math.random()*10); c.fill(); c.fillStyle = '#fff59d'; c.beginPath(); c.moveTo(bx - 3, by - 8); c.lineTo(bx + 3, by - 8); c.lineTo(bx, by - 18); c.fill(); }
      withCtx(c, () => { ctx.save(); ctx.translate(bx - 4, by + 6); ctx.scale(1.2, 1.2); const f = agentLook(6); f.dir = 1; drawBody(f, false); ctx.restore(); });
      c.fillStyle = '#8d6e4a'; c.fillRect(bx - 14, by + 2, 28, 20); c.fillStyle = '#6d4c2e'; c.fillRect(bx - 14, by + 2, 28, 4);
    }
    hud(c, `Quãng đường ${Math.floor(s.x/10)} m · ★ ${s.stars}`, `Gas ${Math.round(s.fuel)}%`);
    c.fillStyle = 'rgba(10,15,34,.7)'; c.fillRect(AW - 140, 40, 128, 12); c.fillStyle = s.fuel < 25 ? '#ef4b4b' : '#2fbf71'; c.fillRect(AW - 138, 42, s.fuel*1.24, 8);
    if(s.over) overlay(c, s.over, s.sub);
  }
};
// ---------- CAMPFIRE BBQ ----------
const FOODS = [['Ngô nướng','#ffd54f'],['Xúc xích','#e57373'],['Tôm','#ff8a65'],['Nấm','#d7ccc8'],['Thịt xiên','#c62828'],['Khoai lang','#8d6e63'],['Kẹo dẻo','#fafafa']];
GAMES.bbq = {
  title:'Lửa trại & tiệc nướng BBQ', opts:['2 phút','Thư giãn'],
  help:'Bấm món ở khay dưới để đặt lên vỉ. Bấm vào món trên vỉ để lật mặt. Khi cả hai mặt chín vàng thì bấm để dọn cho bạn đang chờ đúng món. Space hoặc nút "Thêm củi" để lửa to hơn, coi chừng cháy khét!',
  init(o){ const names = STU(); return {slots:Array(6).fill(null), fire:.6, sc:0, served:0, time:o ? 1e9 : 120, free:!!o, orders:[0,1,2].map(i => this.order(names)), sparks:[], names, msg:'', msgT:0}; },
  order(names){ return {who:names[Math.floor(Math.random()*names.length)], food:Math.floor(Math.random()*FOODS.length), pat:1}; },
  slotXY(i){ return [270 + (i%3)*90, 210 + Math.floor(i/3)*64]; },
  update(s, dt){
    if(s.over) return;
    if(!s.free){ s.time -= dt; if(s.time <= 0){ s.over = `Tiệc tàn! Phục vụ ${s.served} món, ${s.sc} điểm`; if(s.served >= 5) mprog('bbq'); return; } }
    s.msgT -= dt;
    if(pressed('Space') || pressed('Act')) this.wood(s);
    s.fire = Math.max(.08, s.fire - dt*.035);
    const rate = .05 + .3*s.fire;
    s.slots.forEach(it => { if(!it) return; it.sd[it.top ? 0 : 1] += rate*dt*(it.food === 6 ? 2.2 : 1); });
    s.orders.forEach((o, i) => { o.pat -= dt/(s.free ? 80 : 40); if(o.pat <= 0){ s.orders[i] = this.order(s.names); s.sc = Math.max(0, s.sc - 5); s.msg = `${o.who} đói quá nên đi chỗ khác rồi`; s.msgT = 1.4; } });
    if(Math.random() < s.fire*.8) s.sparks.push({x:400 + (Math.random() - .5)*60, y:380, vy:-60 - Math.random()*80, t:1});
    s.sparks.forEach(p => { p.y += p.vy*dt; p.x += Math.sin(p.y*.05)*.5; p.t -= dt*.8; }); s.sparks = s.sparks.filter(p => p.t > 0);
  },
  wood(s){ s.fire = Math.min(1, s.fire + .28); kickSfx(.4); for(let i=0;i<12;i++) s.sparks.push({x:400 + (Math.random() - .5)*80, y:380, vy:-100 - Math.random()*140, t:1}); },
  pointer(s, type, x, y){
    if(type !== 'down' || s.over) return;
    if(x > 640 && y > 380){ this.wood(s); return; }
    if(y > 388 && x < 630){ const k = Math.floor((x - 10)/88); if(k >= 0 && k < FOODS.length){ const i = s.slots.indexOf(null); if(i < 0){ s.msg = 'Vỉ nướng đầy rồi!'; s.msgT = 1; return; } s.slots[i] = {food:k, sd:[0,0], top:false}; this.sizzle(); } return; }
    for(let i=0;i<6;i++){ const [sx, sy] = this.slotXY(i), it = s.slots[i]; if(!it || Math.abs(x - sx) > 40 || Math.abs(y - sy) > 28) continue;
      const burnt = it.sd[0] > 1.7 || it.sd[1] > 1.7, done = it.sd[0] >= .8 && it.sd[1] >= .8;
      if(burnt){ s.slots[i] = null; s.sc = Math.max(0, s.sc - 5); s.msg = 'Cháy khét mất rồi, bỏ đi thôi!'; s.msgT = 1.3; }
      else if(done){ s.slots[i] = null; const oi = s.orders.findIndex(o => o.food === it.food); const perfect = it.sd.every(v => v < 1.3);
        if(oi >= 0){ const o = s.orders[oi]; const p = 20 + Math.round(o.pat*10) + (perfect ? 10 : 0); s.sc += p; s.served++; s.msg = `${o.who}: "Ngon quá!" +${p}`; s.orders[oi] = this.order(s.names); cheerSfx(); } else { s.sc += 5; s.msg = `Bạn tự ăn ${FOODS[it.food][0].toLowerCase()} +5`; } s.msgT = 1.4; }
      else { it.top = !it.top; this.sizzle(); }
      return; }
  },
  sizzle(){ try { const out = sfx(), t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noise(); const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; const g = AC.createGain(); g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.0001, t + .5); s.connect(hp); hp.connect(g); g.connect(out); s.start(t); s.stop(t + .55); } catch(e){} },
  shade(base, v){ if(v > 1.7) return '#2a1a10'; const k = Math.min(1, v/1.2); const h = base.replace('#',''), r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16); const mix = (a, t) => Math.round(a*(1 - k*.55) + t*k*.55); return `rgb(${mix(r,140)},${mix(g,80)},${mix(b,30)})`; },
  draw(s, c){
    const g = c.createLinearGradient(0, 0, 0, AH); g.addColorStop(0, '#0b1030'); g.addColorStop(1, '#23305a'); c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    c.fillStyle = '#fff'; for(let i=0;i<60;i++){ c.globalAlpha = .4 + .6*Math.abs(Math.sin(realT + i)); c.fillRect((i*137) % AW, (i*53) % 160, 2, 2); } c.globalAlpha = 1;
    c.fillStyle = '#1b3a2a'; c.fillRect(0, 300, AW, 150);
    [[60,300,'#ef4b4b'],[720,300,'#3d7bff']].forEach(([x, y, col]) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - 50, y + 40); c.lineTo(x + 50, y + 40); c.lineTo(x, y - 30); c.fill(); });
    const glow = c.createRadialGradient(400, 380, 10, 400, 380, 260); glow.addColorStop(0, `rgba(255,150,60,${.35 + s.fire*.35})`); glow.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = glow; c.fillRect(0, 100, AW, 350);
    c.fillStyle = '#5a3418'; c.fillRect(350, 392, 100, 10); c.save(); c.translate(400, 396); c.rotate(.4); c.fillRect(-50, -5, 100, 10); c.restore();
    for(let k=0;k<5;k++){ const h = (40 + s.fire*90)*(1 - k*.15)*(0.85 + Math.random()*.3), w = 50 - k*8; c.fillStyle = ['#ff6d00','#ff9100','#ffab00','#ffd600','#fff59d'][k]; c.beginPath(); c.moveTo(400 - w/2, 392); c.quadraticCurveTo(400 - w/3, 392 - h*.6, 400 + (Math.random() - .5)*8, 392 - h); c.quadraticCurveTo(400 + w/3, 392 - h*.6, 400 + w/2, 392); c.fill(); }
    s.sparks.forEach(p => { c.fillStyle = `rgba(255,200,80,${p.t})`; c.fillRect(p.x, p.y, 2, 2); });
    c.fillStyle = '#37474f'; c.fillRect(220, 176, 360, 4); c.fillRect(220, 296, 360, 4); for(let x=220; x<=580; x+=20) c.fillRect(x, 176, 2, 124); c.fillRect(230, 300, 4, 90); c.fillRect(566, 300, 4, 90);
    s.slots.forEach((it, i) => { const [x, y] = this.slotXY(i); c.strokeStyle = 'rgba(255,255,255,.12)'; c.strokeRect(x - 40, y - 28, 80, 56); if(!it) return; const F = FOODS[it.food], top = it.sd[it.top ? 1 : 0], col = this.shade(F[1], top);
      c.fillStyle = '#9e9e9e'; c.fillRect(x - 34, y - 1, 68, 2); c.fillStyle = col; if(it.food === 0){ c.fillRect(x - 26, y - 9, 52, 18); c.fillStyle = 'rgba(0,0,0,.15)'; for(let k=0;k<8;k++) c.fillRect(x - 24 + k*6, y - 9, 1, 18); } else if(it.food === 3){ c.beginPath(); c.arc(x, y - 4, 14, Math.PI, 0); c.fill(); c.fillRect(x - 5, y - 4, 10, 12); } else if(it.food === 6){ c.fillRect(x - 10, y - 8, 20, 16); } else if(it.food === 2){ c.beginPath(); c.arc(x, y, 14, .3, Math.PI*1.6); c.lineWidth = 8; c.strokeStyle = col; c.stroke(); } else { c.beginPath(); c.ellipse(x, y, 28, 9, 0, 0, Math.PI*2); c.fill(); }
      c.fillStyle = 'rgba(10,15,34,.75)'; c.fillRect(x - 32, y + 14, 64, 8); it.sd.forEach((v, k) => { c.fillStyle = v > 1.7 ? '#222' : v > 1.3 ? '#ff8a2b' : v >= .8 ? '#2fbf71' : '#ffd23f'; c.fillRect(x - 31 + k*32, y + 15, Math.min(30, v/1.7*30), 6); });
      if(Math.random() < .3){ c.fillStyle = 'rgba(220,220,220,.4)'; c.fillRect(x + (Math.random() - .5)*40, y - 30 - Math.random()*20, 3, 3); } });
    s.orders.forEach((o, i) => { const x = 20 + i*262; c.fillStyle = 'rgba(10,15,34,.8)'; c.fillRect(x, 44, 250, 48); c.font = '20px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(`${o.who} muốn: ${FOODS[o.food][0]}`, x + 8, 66); c.fillStyle = o.pat < .3 ? '#ef4b4b' : '#2fbf71'; c.fillRect(x + 8, 76, o.pat*234, 8); });
    FOODS.forEach((F, k) => { const x = 10 + k*88; c.fillStyle = 'rgba(10,15,34,.85)'; c.fillRect(x, 392, 84, 52); c.fillStyle = F[1]; c.fillRect(x + 30, 400, 24, 14); c.font = '17px VT323, monospace'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(F[0], x + 42, 434); c.textAlign = 'left'; });
    c.fillStyle = '#ff8a2b'; c.fillRect(648, 392, 142, 52); c.font = '20px Bungee, sans-serif'; c.fillStyle = '#1a1206'; c.fillText('+ CỦI', 676, 426);
    hud(c, `Điểm ${s.sc} · Đã dọn ${s.served} món · Lửa ${Math.round(s.fire*100)}%`, s.free ? 'Thư giãn' : `Còn ${Math.ceil(s.time)} giây`);
    if(s.msgT > 0){ c.font = '22px VT323, monospace'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText(s.msg, AW/2, 124); c.textAlign = 'left'; }
    if(s.over) overlay(c, s.over);
  }
};
// ---------- ANIMAL RACE ----------
const RACERS = ['horse','buffalo','camel','ostrich'];
GAMES.race = {
  title:'Đua thú ở nông trại', opts:['Cưỡi ngựa','Cưỡi trâu','Cưỡi lạc đà','Cưỡi đà điểu'],
  help:'Bấm luân phiên trái, phải (hoặc nút ◀ ▶) thật nhanh để thú chạy. Space hoặc lên để nhảy qua rào. Trâu chậm nhưng bền, đà điểu nhanh nhất nhưng mau mệt.',
  stats:{horse:{acc:46, max:330, dec:.6}, buffalo:{acc:52, max:260, dec:.35}, camel:{acc:40, max:290, dec:.45}, ostrich:{acc:50, max:370, dec:.85}},
  init(o){ const me = RACERS[o], others = RACERS.filter(k => k !== me); const L = 3000, hs = []; for(let x=500; x<L - 200; x += 360 + Math.random()*120) hs.push(x);
    return {L, hs, lanes:[{k:me, x:0, v:0, y:0, vy:0, me:true, name:'Bạn', slow:0}].concat(others.slice(0, 2).map((k, i) => ({k, x:0, v:0, y:0, vy:0, name:STU()[i + 2] || 'Máy', slow:0, skill:.82 + Math.random()*.12}))), last:'', t:-3, places:[], ph:0}; },
  update(s, dt){
    if(s.over) return;
    if(s.t < 0){ const pt = s.t; s.t += dt; if(Math.ceil(pt) !== Math.ceil(s.t)) blipSfx(s.t >= 0 ? 1320 : 660); return; }
    s.t += dt;
    s.lanes.forEach((r, i) => {
      const st = this.stats[r.k];
      if(r.me){ const L = pressed('ArrowLeft') || pressed('KeyA') || pressed('Left'), Rr = pressed('ArrowRight') || pressed('KeyD') || pressed('Right'); if(L && s.last !== 'L'){ r.v += st.acc; s.last = 'L'; } if(Rr && s.last !== 'R'){ r.v += st.acc; s.last = 'R'; } if((pressed('Space') || pressed('ArrowUp') || pressed('KeyW') || pressed('Act') || pressed('Up')) && r.y >= 0) r.vy = -420; }
      else { r.v += st.acc*(5.2 + Math.random()*2)*r.skill*dt; const h = s.hs.find(x => x > r.x && x - r.x < 70 + r.v*.12); if(h && r.y >= 0 && Math.random() < r.skill*.25) r.vy = -420; }
      r.v -= r.v*st.dec*dt; r.v = clampV(r.v, 0, st.max*(r.slow > 0 ? .35 : 1)); r.slow -= dt;
      if(r.y < 0 || r.vy < 0){ r.vy += 1300*dt; r.y = Math.min(0, r.y + r.vy*dt); if(r.y >= 0) r.vy = 0; }
      const px = r.x; r.x += r.v*dt; r.ph += r.v*dt*.06;
      if(r.y > -18 && s.hs.some(h => px < h && r.x >= h)){ r.slow = .9; r.v *= .3; if(r.me) kickSfx(.8); }
      if(r.x >= s.L && !s.places.includes(r)){ s.places.push(r); if(r.me){ const p = s.places.length; s.over = p === 1 ? 'Về nhất! Vô địch nông trại!' : `Về thứ ${p}`; s.sub = `Thời gian ${s.t.toFixed(2)} giây`; if(p === 1){ mprog('race'); cheerSfx(); } } }
    });
  },
  draw(s, c){
    const me = s.lanes[0], cx = me.x - 200;
    const g = c.createLinearGradient(0, 0, 0, AH); g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#e0f4ff'); c.fillStyle = g; c.fillRect(0, 0, AW, AH);
    c.fillStyle = '#7cb35a'; c.beginPath(); c.moveTo(0, 150); for(let x=0;x<=AW;x+=20) c.lineTo(x, 130 + Math.sin((x + cx*.3)*.01)*20); c.lineTo(AW, 160); c.lineTo(0, 160); c.fill();
    c.fillStyle = '#a5d6a7'; c.fillRect(0, 150, AW, 300);
    s.lanes.forEach((r, i) => { const y = 230 + i*80; c.fillStyle = i%2 ? '#c8a26a' : '#d4b07a'; c.fillRect(0, y - 30, AW, 50); c.fillStyle = '#fff'; c.fillRect(0, y + 20, AW, 2); });
    for(let x = Math.floor(cx/100)*100; x < cx + AW; x += 100){ c.font = '16px VT323, monospace'; c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText(Math.round(x/10) + 'm', x - cx, 196); }
    const fx = s.L - cx; for(let y=0;y<4;y++) for(let k=0;k<12;k++){ c.fillStyle = (k + y)%2 ? '#111' : '#fff'; c.fillRect(fx + y*8, 200 + k*22, 8, 22); }
    s.hs.forEach(h => { const x = h - cx; if(x < -20 || x > AW + 20) return; s.lanes.forEach((r, i) => { const y = 230 + i*80; c.fillStyle = '#fff'; c.fillRect(x - 2, y - 24, 4, 24); c.fillStyle = '#ef4b4b'; c.fillRect(x - 3, y - 24, 6, 6); c.fillRect(x - 3, y - 12, 6, 6); }); });
    s.lanes.forEach((r, i) => { const y = 230 + i*80 + 10, x = r.x - cx; withCtx(c, () => { ctx.save(); ctx.translate(x, y + r.y); ctx.scale(1.55, 1.55); drawAnimal(r.k, 0, 0, 1, r.ph, r.v > 10); const f = agentLook(i*3 + 1); f.dir = 1; ctx.translate(-2, ANI[r.k].ride); drawBody(f, false); ctx.restore(); }); c.font = '18px VT323, monospace'; c.fillStyle = r.me ? '#ffd23f' : '#fff'; c.fillText(`${r.name} · ${ANI[r.k].name}`, x + 26, y - 30 + r.y); });
    hud(c, `Còn ${Math.max(0, Math.ceil((s.L - me.x)/10))} m · Tốc độ ${Math.round(me.v/5)}`, s.t < 0 ? 'Chuẩn bị...' : `${s.t.toFixed(1)} giây`);
    if(s.t < 0){ c.font = '60px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText(String(Math.ceil(-s.t)), AW/2, 200); c.textAlign = 'left'; }
    if(s.over) overlay(c, s.over, s.sub);
  }
};

function openArcade(id, opt){
  const G = GAMES[id]; if(!G) return;
  ARC.id = id; ARC.g = G; ARC.opt = opt != null ? opt : 0; ARC.code = {}; ARC.prev = {}; ARC.done = false;
  $('#arcT').textContent = G.title; $('#arcHelp').textContent = G.help;
  const seg = $('#arcOpts'); seg.innerHTML = '';
  G.opts.forEach((o, i) => { const b = el('button', {type:'button'}, o); b.setAttribute('aria-pressed', i === ARC.opt); b.onclick = () => { ARC.opt = i; seg.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-pressed', k === i)); arcNew(); }; seg.appendChild(b); });
  showModal('mArcade'); arcNew();
  cancelAnimationFrame(ARC.raf); ARC.last = performance.now(); ARC.raf = requestAnimationFrame(arcLoop);
  try { ensureAC(); } catch(e){}
}
function arcNew(){ ARC.s = ARC.g.init(ARC.opt); ARC.paused = false; $('#arcPause').textContent = 'Tạm dừng'; $('#arcCv').focus(); }
function arcLoop(now){
  if(!openModal || openModal.id !== 'mArcade'){ ARC.raf = 0; return; }
  const dt = Math.min(.05, (now - ARC.last)/1000); ARC.last = now;
  const c = $('#arcCv').getContext('2d');
  if(!ARC.paused) ARC.g.update(ARC.s, dt);
  if(ARC.s.over && !ARC.s._rw){ ARC.s._rw = 1; try { arcReward(ARC.id, ARC.s); } catch(e){} }
  ARC.prev = Object.assign({}, ARC.code);
  c.setTransform(1, 0, 0, 1, 0, 0); ARC.g.draw(ARC.s, c);
  if(ARC.paused) overlay(c, 'Tạm dừng', 'Bấm "Tiếp tục" để chơi tiếp');
  ARC.raf = requestAnimationFrame(arcLoop);
}
function arcInit(){
  const cv = $('#arcCv'); cv.width = AW; cv.height = AH;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left)/r.width*AW, (e.clientY - r.top)/r.height*AH]; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); ARC.ptr = {down:true, x, y}; if(ARC.g && ARC.g.pointer && !ARC.paused) ARC.g.pointer(ARC.s, 'down', x, y); });
  cv.addEventListener('pointermove', e => { const [x, y] = pos(e); ARC.ptr.x = x; ARC.ptr.y = y; });
  ['pointerup','pointercancel'].forEach(ev => cv.addEventListener(ev, () => { ARC.ptr.down = false; }));
  $('#arcNew').onclick = arcNew;
  $('#arcPause').onclick = () => { ARC.paused = !ARC.paused; $('#arcPause').textContent = ARC.paused ? 'Tiếp tục' : 'Tạm dừng'; };
  document.querySelectorAll('#arcPad button, #arcAct, #arcAlt').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); ARC.code[k] = true; });
    ['pointerup','pointerleave','pointercancel'].forEach(ev => b.addEventListener(ev, () => { ARC.code[k] = false; }));
  });
}

