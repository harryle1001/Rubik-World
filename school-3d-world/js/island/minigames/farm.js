// Five farm mini games drawn on a 2D canvas inside the MG frame: Egg Collector, Herding, Pig Feeding, Milking Rhythm, Harvest.
import { MG } from '../ui.js';
const W = 800, H = 500, rnd = (a, b) => a + Math.random()*(b - a);
const sky = (g, top = '#bfe6ff', bot = '#e8f7ff') => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
const grass = (g, y = 380) => { g.fillStyle = '#7cc36a'; g.fillRect(0, y, W, H - y); g.fillStyle = '#6ab35a'; for(let i=0;i<40;i++) g.fillRect((i*97) % W, y + (i*53) % (H - y), 6, 3); };
const txt = (g, t, x, y, s = 28, c = '#0f1530', a = 'center') => { g.font = `800 ${s}px Nunito, sans-serif`; g.fillStyle = c; g.textAlign = a; g.fillText(t, x, y); };
function hen(g, x, y){ g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 30, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + 24, y - 16, 13, 0, 7); g.fill(); g.fillStyle = '#e53935'; g.fillRect(x + 20, y - 34, 10, 8); g.fillStyle = '#ffa000'; g.beginPath(); g.moveTo(x + 36, y - 16); g.lineTo(x + 46, y - 12); g.lineTo(x + 36, y - 9); g.fill(); g.fillStyle = '#111'; g.fillRect(x + 27, y - 20, 4, 4); }
function sheep(g, x, y, c = '#fafafa'){ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 18, 13, 0, 0, 7); g.fill(); g.fillStyle = '#424242'; g.beginPath(); g.arc(x + 16, y - 4, 7, 0, 7); g.fill(); }
function pig(g, x, y, mood){ g.fillStyle = mood < 0 ? '#f48fb1' : '#f8bbd0'; g.beginPath(); g.ellipse(x, y, 40, 28, 0, 0, 7); g.fill(); g.fillStyle = '#f06292'; g.beginPath(); g.ellipse(x + 36, y - 2, 12, 10, 0, 0, 7); g.fill(); g.fillStyle = '#ad1457'; g.fillRect(x + 32, y - 4, 3, 4); g.fillRect(x + 39, y - 4, 3, 4); g.fillStyle = '#111'; g.fillRect(x + 20, y - 14, 4, 4); }
const FOOD = [['🌽', 'Corn', 'Ngô'], ['🍎', 'Apple', 'Táo'], ['🥕', 'Carrot', 'Cà rốt']];

MG.register({id:'eggs', name:'Egg Collector', vi:'Nhặt trứng', icon:'🥚', group:'Farm', howto:'Kéo giỏ sang trái/phải để hứng trứng. Trứng vàng +3. Đừng để trứng rơi vỡ!', skills:['Nhanh tay', 'Quan sát'],
  init(s){ s.t = 35; s.sc = 0; s.broke = 0; s.eggs = []; s.bx = W/2; s.next = .5; },
  update(s, dt){ s.t -= dt; s.next -= dt; if(s.next <= 0){ s.next = Math.max(.35, .9 - (35 - s.t)*.015); s.eggs.push({x:120 + Math.floor(Math.random()*5)*140, y:120, vy:rnd(120, 170) + (35 - s.t)*4, gold:Math.random() < .12}); }
    for(const e of s.eggs){ e.y += e.vy*dt; if(!e.done && e.y > 400 && Math.abs(e.x - s.bx) < 62){ e.done = 1; s.sc += e.gold ? 3 : 1; MG.sfx('ok'); } else if(!e.done && e.y > 455){ e.done = 2; s.broke++; s.sc = Math.max(0, s.sc - 1); MG.sfx('bad'); } } s.eggs = s.eggs.filter(e => !e.done); return s.t > 0; },
  draw(s, g){ sky(g); grass(g, 440); g.fillStyle = '#8d6e63'; g.fillRect(0, 150, W, 14); for(let i=0;i<5;i++) hen(g, 110 + i*140, 135); for(const e of s.eggs){ g.fillStyle = e.gold ? '#ffd23f' : '#fffdf2'; g.strokeStyle = '#c9b48a'; g.lineWidth = 2; g.beginPath(); g.ellipse(e.x, e.y, 13, 17, 0, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = '#a1887f'; g.fillRect(s.bx - 60, 405, 120, 40); g.fillStyle = '#6d4c41'; for(let i=0;i<6;i++) g.fillRect(s.bx - 60 + i*22, 405, 6, 40); txt(g, `🥚 ${s.sc}   💥 ${s.broke}   ⏱ ${Math.ceil(s.t)}`, W/2, 40); },
  pointer(s, t, x){ s.bx = Math.max(60, Math.min(W - 60, x)); }, key(s, k){ if(k === 'left') s.bx = Math.max(60, s.bx - 40); if(k === 'right') s.bx = Math.min(W - 60, s.bx + 40); },
  perf:s => Math.min(1, s.sc/30)});

MG.register({id:'herd', name:'Herding', vi:'Lùa cừu', icon:'🐑', group:'Farm', howto:'Chú chó đi theo ngón tay của bạn. Cừu sợ chó và chạy ra xa: hãy lùa cả đàn vào chuồng bên phải!', skills:['Chiến thuật', 'Kiên nhẫn'],
  init(s){ s.t = 50; s.dog = {x:120, y:250, tx:120, ty:250}; s.sh = []; for(let i=0;i<9;i++) s.sh.push({x:rnd(200, 420), y:rnd(120, 400), vx:0, vy:0, in:false}); },
  update(s, dt){ s.t -= dt; const d = s.dog; d.x += (d.tx - d.x)*Math.min(1, dt*5); d.y += (d.ty - d.y)*Math.min(1, dt*5);
    for(const q of s.sh){ if(q.in) continue; const dx = q.x - d.x, dy = q.y - d.y, L = Math.hypot(dx, dy); if(L < 150){ q.vx += dx/L*240*dt; q.vy += dy/L*240*dt; } else { q.vx += rnd(-20, 20)*dt; q.vy += rnd(-20, 20)*dt; }
      for(const o of s.sh) if(o !== q){ const ex = q.x - o.x, ey = q.y - o.y, e = Math.hypot(ex, ey); if(e < 30 && e > 0){ q.vx += ex/e*60*dt; q.vy += ey/e*60*dt; } }
      q.vx *= Math.pow(.2, dt); q.vy *= Math.pow(.2, dt); q.x = Math.max(20, Math.min(W - 20, q.x + q.vx*dt)); q.y = Math.max(80, Math.min(H - 20, q.y + q.vy*dt)); if(q.x > 640 && q.y > 170 && q.y < 330){ q.in = true; q.x = rnd(670, 760); q.y = rnd(190, 310); MG.sfx('ok'); } }
    return s.t > 0 && !s.sh.every(q => q.in); },
  draw(s, g){ g.fillStyle = '#8fd17a'; g.fillRect(0, 0, W, H); g.fillStyle = '#7cc36a'; for(let i=0;i<60;i++) g.fillRect((i*131) % W, (i*71) % H, 5, 3); g.fillStyle = '#c8a26b'; g.fillRect(640, 150, 160, 12); g.fillRect(640, 338, 160, 12); g.fillRect(788, 150, 12, 200); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(640, 162, 148, 176);
    for(const q of s.sh) sheep(g, q.x, q.y); const d = s.dog; g.fillStyle = '#8d5524'; g.beginPath(); g.ellipse(d.x, d.y, 20, 12, 0, 0, 7); g.fill(); g.beginPath(); g.arc(d.x + 16, d.y - 6, 9, 0, 7); g.fill(); g.fillStyle = '#3e2723'; g.fillRect(d.x + 18, d.y - 16, 5, 7);
    txt(g, `🐑 ${s.sh.filter(q => q.in).length}/${s.sh.length}   ⏱ ${Math.ceil(s.t)}`, W/2, 40); txt(g, 'CHUỒNG', 715, 140, 20, '#5d4037'); },
  pointer(s, t, x, y){ s.dog.tx = x; s.dog.ty = y; }, key(s, k){ const d = s.dog; if(k === 'left') d.tx -= 40; if(k === 'right') d.tx += 40; if(k === 'up') d.ty -= 40; if(k === 'down') d.ty += 40; },
  perf:s => s.sh.filter(q => q.in).length/s.sh.length});

MG.register({id:'pigs', name:'Pig Feeding', vi:'Cho heo ăn', icon:'🐷', group:'Farm', howto:'Mỗi chú heo muốn một món (xem bong bóng). Chạm món ăn ở dưới rồi chạm vào heo. Cho ăn trước khi heo quá đói!', skills:['Ghi nhớ', 'Nhanh tay'],
  init(s){ s.t = 45; s.sc = 0; s.sel = -1; s.pigs = [0, 1, 2, 3].map(i => ({x:130 + i*180, y:230, want:Math.floor(Math.random()*3), hunger:rnd(4, 8), mood:0})); },
  update(s, dt){ s.t -= dt; for(const p of s.pigs){ p.hunger -= dt; if(p.mood) p.mood -= Math.sign(p.mood)*dt; if(p.hunger <= 0){ p.hunger = rnd(5, 8); p.want = Math.floor(Math.random()*3); s.sc = Math.max(0, s.sc - 1); p.mood = -1.2; MG.sfx('bad'); } } return s.t > 0; },
  draw(s, g){ sky(g, '#ffe0b2', '#fff3e0'); g.fillStyle = '#8d6e63'; g.fillRect(0, 300, W, 200); g.fillStyle = '#6d4c41'; g.beginPath(); g.ellipse(W/2, 330, 300, 30, 0, 0, 7); g.fill();
    for(const p of s.pigs){ pig(g, p.x, p.y, p.mood); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(p.x, p.y - 80, 34, 26, 0, 0, 7); g.fill(); g.font = '30px serif'; g.textAlign = 'center'; g.fillText(FOOD[p.want][0], p.x, p.y - 70); g.fillStyle = p.hunger < 2 ? '#e53935' : '#2fbf71'; g.fillRect(p.x - 30, p.y + 36, 60*Math.max(0, p.hunger)/8, 6); }
    FOOD.forEach((f, i) => { const x = 220 + i*180; g.fillStyle = s.sel === i ? '#ffd23f' : '#fff8e1'; g.fillRect(x - 60, 400, 120, 80); g.font = '44px serif'; g.textAlign = 'center'; g.fillText(f[0], x, 455); txt(g, f[1], x, 478, 16, '#5d4037'); });
    txt(g, `⭐ ${s.sc}   ⏱ ${Math.ceil(s.t)}`, W/2, 40); },
  pointer(s, t, x, y){ if(t !== 'down') return; if(y > 400){ const i = Math.round((x - 220)/180); if(i >= 0 && i < 3) s.sel = i; return; } const p = s.pigs.find(q => Math.abs(q.x - x) < 55 && Math.abs(q.y - y) < 60); if(p && s.sel >= 0){ if(p.want === s.sel){ s.sc += 2; p.hunger = rnd(5, 9); p.want = Math.floor(Math.random()*3); p.mood = 1.2; MG.sfx('ok'); } else { s.sc = Math.max(0, s.sc - 1); p.mood = -1.2; MG.sfx('bad'); } s.sel = -1; } },
  perf:s => Math.min(1, s.sc/36)});

MG.register({id:'milk', name:'Milking Rhythm', vi:'Vắt sữa theo nhịp', icon:'🥛', group:'Farm', howto:'Giọt sữa rơi theo nhịp ở 2 làn. Chạm làn trái/phải (hoặc phím ←/→) đúng lúc giọt chạm vạch vàng.', skills:['Cảm nhạc', 'Phản xạ'],
  init(s){ s.t = 0; s.dur = 32; s.sc = 0; s.combo = 0; s.notes = []; const bpm = 96, beat = 60/bpm; for(let b=4;b<s.dur/beat;b++) if(Math.random() < .75) s.notes.push({at:b*beat, lane:Math.random() < .5 ? 0 : 1, hit:0}); s.msg = ''; s.mt = 0; s.milk = 0; },
  update(s, dt){ s.t += dt; s.mt -= dt; for(const n of s.notes) if(!n.hit && s.t - n.at > .18){ n.hit = -1; s.combo = 0; s.msg = 'Trượt!'; s.mt = .5; } return s.t < s.dur; },
  draw(s, g){ sky(g, '#e1f5fe', '#fff'); g.fillStyle = '#fafafa'; g.beginPath(); g.ellipse(W/2, 120, 230, 70, 0, 0, 7); g.fill(); g.fillStyle = '#212121'; g.beginPath(); g.ellipse(W/2 - 80, 100, 50, 30, 0, 0, 7); g.fill(); g.fillStyle = '#f8bbd0'; [-60, 60].forEach(dx => { g.fillRect(W/2 + dx - 14, 180, 28, 40); });
    [-60, 60].forEach((dx, lane) => { const x = W/2 + dx; g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x - 40, 220, 80, 260); for(const n of s.notes){ if(n.hit || n.lane !== lane) continue; const y = 420 - (n.at - s.t)*260; if(y < 220 || y > 470) continue; g.fillStyle = '#fff'; g.strokeStyle = '#90caf9'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.stroke(); } });
    g.fillStyle = '#ffd23f'; g.fillRect(W/2 - 110, 418, 220, 6); g.fillStyle = '#90caf9'; g.fillRect(W - 120, 470 - s.milk*2.2, 60, s.milk*2.2); g.strokeStyle = '#546e7a'; g.strokeRect(W - 120, 250, 60, 220);
    txt(g, `🥛 ${s.sc}   combo ${s.combo}`, W/2, 40); if(s.mt > 0) txt(g, s.msg, W/2, 300, 34, s.msg === 'Trượt!' ? '#e53935' : '#2fbf71'); },
  tap(s, lane){ const n = s.notes.filter(n => !n.hit && n.lane === lane).sort((a, b) => Math.abs(a.at - s.t) - Math.abs(b.at - s.t))[0]; if(!n) return; const d = Math.abs(n.at - s.t); if(d < .07){ n.hit = 1; s.combo++; s.sc += 3; s.msg = 'Tuyệt!'; s.milk = Math.min(100, s.milk + 4); MG.sfx('ok'); } else if(d < .16){ n.hit = 1; s.combo++; s.sc += 1; s.msg = 'Tốt'; s.milk = Math.min(100, s.milk + 2); MG.sfx('ok'); } else return; s.mt = .4; },
  pointer(s, t, x){ if(t === 'down') this.tap(s, x < W/2 ? 0 : 1); }, key(s, k){ if(k === 'left') this.tap(s, 0); if(k === 'right') this.tap(s, 1); },
  perf:s => Math.min(1, s.sc/(s.notes.length*2.2))});

MG.register({id:'harvest', name:'Harvest', vi:'Trồng và thu hoạch', icon:'🥕', group:'Farm', howto:'Chạm ô đất trống để gieo hạt. Cây lớn dần: chạm khi cây chín (có ánh vàng) để thu hoạch. Để quá lâu cây sẽ héo!', skills:['Canh thời gian', 'Sắp xếp'],
  init(s){ s.t = 45; s.sc = 0; s.plots = Array.from({length:12}, () => ({st:0, g:0})); },
  update(s, dt){ s.t -= dt; for(const p of s.plots){ if(p.st === 1){ p.g += dt; if(p.g > 3) p.st = 2, p.g = 0; } else if(p.st === 2){ p.g += dt; if(p.g > 3.2){ p.st = 3; MG.sfx('bad'); } } } return s.t > 0; },
  draw(s, g){ sky(g, '#c8e6c9', '#f1f8e9'); s.plots.forEach((p, i) => { const x = 140 + (i % 4)*170, y = 140 + Math.floor(i/4)*120; g.fillStyle = '#6d4c41'; g.fillRect(x - 60, y - 40, 120, 80); g.fillStyle = '#5d4037'; for(let k=0;k<3;k++) g.fillRect(x - 56, y - 30 + k*24, 112, 6);
    if(p.st === 1){ const h = 10 + p.g*10; g.fillStyle = '#66bb6a'; g.fillRect(x - 3, y - h, 6, h); g.beginPath(); g.ellipse(x - 10, y - h, 10, 5, -.5, 0, 7); g.ellipse(x + 10, y - h, 10, 5, .5, 0, 7); g.fill(); }
    if(p.st === 2){ g.fillStyle = 'rgba(255,214,0,.35)'; g.beginPath(); g.arc(x, y - 20, 42, 0, 7); g.fill(); g.font = '46px serif'; g.textAlign = 'center'; g.fillText('🥕', x, y); }
    if(p.st === 3){ g.fillStyle = '#8d6e63'; g.fillRect(x - 3, y - 26, 6, 26); g.fillStyle = '#a1887f'; g.beginPath(); g.ellipse(x - 8, y - 22, 9, 4, .8, 0, 7); g.fill(); } });
    txt(g, `🥕 ${s.sc}   ⏱ ${Math.ceil(s.t)}`, W/2, 50); },
  pointer(s, t, x, y){ if(t !== 'down') return; const i = s.plots.findIndex((p, k) => Math.abs(x - (140 + (k % 4)*170)) < 60 && Math.abs(y - (140 + Math.floor(k/4)*120)) < 40); if(i < 0) return; const p = s.plots[i]; if(p.st === 0 || p.st === 3){ p.st = 1; p.g = 0; MG.sfx('tap'); } else if(p.st === 2){ p.st = 0; s.sc += 2; MG.sfx('ok'); } },
  perf:s => Math.min(1, s.sc/30)});
