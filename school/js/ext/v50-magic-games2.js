// ================= v50 · MINI GAME HỌC VIỆN (tiếp): Xem sao trên tháp thiên văn · Chăm sinh vật phép thuật · Giải đố rune Rubik =================
// ---------- 5. XEM SAO: tìm chòm sao thật giữa bầu trời ----------
const V50_CONST = [
  {vi:'Bắc Đẩu', en:'Big Dipper', p:[[0, .1], [.18, .05], [.34, .12], [.5, .2], [.56, .44], [.82, .48], [.86, .22]], l:[[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], f:'7 sao hình cái gáo. Hai sao ở miệng gáo chỉ về sao Bắc Cực ⭐ (hướng Bắc).'},
  {vi:'Thiên Hậu', en:'Cassiopeia', p:[[0, .2], [.24, .7], [.5, .35], [.74, .75], [1, .25]], l:[[0, 1], [1, 2], [2, 3], [3, 4]], f:'Hình chữ W (hoặc M). Nằm đối diện Bắc Đẩu qua sao Bắc Cực.'},
  {vi:'Lạp Hộ', en:'Orion', p:[[.1, 0], [.8, .05], [.36, .48], [.46, .5], [.56, .52], [.18, 1], [.86, .96]], l:[[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]], f:'3 sao thẳng hàng ở giữa gọi là "Thắt lưng". Dễ thấy vào mùa đông.'},
  {vi:'Nam Thập Tự', en:'Southern Cross', p:[[.5, 0], [.5, 1], [0, .45], [.9, .4], [.66, .62]], l:[[0, 1], [2, 3]], f:'Chòm sao nhỏ hình chữ thập. Trục dài chỉ về hướng Nam.'},
  {vi:'Thiên Cầm', en:'Lyra', p:[[.45, 0], [.3, .35], [.62, .35], [.25, .95], [.58, 1]], l:[[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]], f:'Có sao Chức Nữ (Vega), một trong những sao sáng nhất mùa hè.'},
  {vi:'Thiên Yết', en:'Scorpius', p:[[0, .05], [.12, .2], [.25, .32], [.34, .5], [.4, .7], [.55, .88], [.75, .95], [.9, .82], [.86, .62]], l:[[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]], f:'Hình con bọ cạp có đuôi cong. Sao đỏ Antares là "trái tim" của nó.'}
];
V50_GAMES.stars = {name:'Xem Sao Tháp Thiên Văn', en:'Stargazing', icon:'🔭', modes:[['🔭', 'Dễ: có nét mờ'], ['✨', 'Khó: không gợi ý']], hint:'Chạm vào các ngôi sao của chòm sao', gest:'tap',
  help:['🔭 Góc trên có <b>hình mẫu</b> của chòm sao cần tìm.', '👆 <b>Chạm</b> từng ngôi sao thuộc chòm sao đó trên bầu trời (thứ tự nào cũng được).', '✨ Tìm đủ sao thì các đường nối sáng lên và em học một điều thú vị.', '⏱ 90 giây cho 5 chòm sao.'],
  start(G){ const S = G.st; S.n = 0; S.left = 90; S.found = 0; S.ord = V50_CONST.map((c, i) => i).sort(() => Math.random() - .5); this.next(G); },
  next(G){ const S = G.st, W = V50G.W, H = V50G.H; S.n++; S.c = V50_CONST[S.ord[(S.n - 1) % V50_CONST.length]]; S.msg = null; const sz = Math.min(W, H)*.36, x0 = W*.12 + Math.random()*(W*.76 - sz), y0 = H*.3 + Math.random()*(H*.52 - sz);
    S.cs = S.c.p.map(p => ({x:x0 + p[0]*sz, y:y0 + p[1]*sz, on:false})); S.bg = []; let k = 0; while(S.bg.length < 70 && k++ < 800){ const x = 10 + Math.random()*(W - 20), y = H*.2 + Math.random()*H*.75; if(S.cs.some(s => Math.hypot(s.x - x, s.y - y) < 34)) continue; S.bg.push({x, y, b:Math.random(), ph:Math.random()*6}); } },
  update(G, dt){ const S = G.st; S.left -= dt; if(S.left <= 0) return this.fin(G); if(S.msg){ S.msg.t -= dt; if(S.msg.t <= 0){ if(S.n >= 5) return this.fin(G); this.next(G); } } },
  fin(G){ const S = G.st; v50GEnd(G, G.score, Math.min(1, S.found/(5*6)), null, 'Em đã tìm ' + (S.n - (S.msg ? 0 : 1)) + ' chòm sao.'); },
  down(G, x, y){ const S = G.st; if(S.msg) return; const s = S.cs.find(s => !s.on && Math.hypot(s.x - x, s.y - y) < 30); if(s){ s.on = true; S.found++; G.score += 10; v50Snd('pop'); for(let k = 0; k < 10; k++){ const a = k/10*6.28; v50P(s.x, s.y, Math.cos(a)*70, Math.sin(a)*70, .6, 6, v50Shape('star', '#fff3b0'), 0); }
      if(S.cs.every(q => q.on)){ G.score += Math.round(S.left/3); S.msg = {t:3.6, s:'🌟 ' + S.c.vi + ' (' + S.c.en + ')', f:S.c.f}; v50Snd('ok'); V50FX.flash = .2; V50FX.fcol = '#9fb2ff'; } }
    else { v50P(x, y, 0, -20, .5, 10, v50Glow('#7a8ab8'), 0); } },
  draw(G, g, W, H){ const S = G.st, t = performance.now()/1000; v50GSky(g, W, H, 1, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .18; g.drawImage(v50Glow('#7a6bff'), -W*.2, H*.2, W*1.4, H*.5); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    S.bg.forEach(s => { const r = 1 + s.b*1.8, tw = .5 + .5*Math.sin(t*2 + s.ph); g.fillStyle = '#fff'; g.globalAlpha = .4 + tw*.6; g.fillRect(s.x - r/2, s.y - r/2, r, r); }); g.globalAlpha = 1;
    if(G.mode === 0 || S.msg){ g.strokeStyle = S.msg ? 'rgba(255,233,168,.9)' : 'rgba(255,255,255,.12)'; g.lineWidth = S.msg ? 2.5 : 1.5; g.beginPath(); S.c.l.forEach(([a, b]) => { g.moveTo(S.cs[a].x, S.cs[a].y); g.lineTo(S.cs[b].x, S.cs[b].y); }); g.stroke(); }
    else { g.strokeStyle = 'rgba(255,233,168,.7)'; g.lineWidth = 2; g.beginPath(); S.c.l.forEach(([a, b]) => { if(S.cs[a].on && S.cs[b].on){ g.moveTo(S.cs[a].x, S.cs[a].y); g.lineTo(S.cs[b].x, S.cs[b].y); } }); g.stroke(); }
    S.cs.forEach((s, i) => { const tw = .7 + .3*Math.sin(t*3 + i); g.fillStyle = s.on ? '#ffe9a8' : '#fff'; g.fillRect(s.x - 1.8, s.y - 1.8, 3.6, 3.6); if(s.on){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = tw*.8; g.drawImage(v50Glow('#ffd27a'), s.x - 18, s.y - 18, 36, 36); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
    // vòng kính thiên văn
    g.fillStyle = 'rgba(0,0,0,.55)'; const TR = Math.max(W, H)*.62; g.beginPath(); g.rect(0, 0, W, H); g.moveTo(W/2 + TR, H*.58); g.arc(W/2, H*.58, TR, 0, Math.PI*2, true); g.fill('evenodd');
    // hình mẫu
    const bw = Math.min(150, W*.32), bx = W - bw - 14, by = 60; g.fillStyle = 'rgba(11,16,32,.8)'; v50RR(g, bx, by, bw, bw/V50_PHI + 34, 14); g.fill(); g.strokeStyle = '#ffe9a8'; g.lineWidth = 2; g.beginPath();
    S.c.l.forEach(([a, b]) => { const A = S.c.p[a], B = S.c.p[b]; g.moveTo(bx + 14 + A[0]*(bw - 28)*.62 + bw*.12, by + 10 + A[1]*(bw/V50_PHI - 14)); g.lineTo(bx + 14 + B[0]*(bw - 28)*.62 + bw*.12, by + 10 + B[1]*(bw/V50_PHI - 14)); }); g.stroke();
    g.fillStyle = '#fff'; S.c.p.forEach(A => g.fillRect(bx + 12 + A[0]*(bw - 28)*.62 + bw*.12, by + 8 + A[1]*(bw/V50_PHI - 14), 4, 4)); v50Txt(g, S.c.vi, bx + bw/2, by + bw/V50_PHI + 18, 16, '#ffe9a8');
    if(S.msg){ v50Pill(g, S.msg.s, W/2, H*.2, 18, 'rgba(11,16,32,.88)', '#ffe9a8'); const words = S.msg.f.split(' '), lines = []; let cur = ''; g.font = "800 16px Nunito, sans-serif"; words.forEach(w => { if(g.measureText(cur + ' ' + w).width > W*.8){ lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
      lines.forEach((l, i) => v50Pill(g, l, W/2, H*.2 + 46 + i*38, 16, 'rgba(61,123,255,.85)')); } },
  stat(G){ const S = G.st; return '🔭 Chòm ' + Math.min(5, S.n) + '/5 · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.left)) + 's'; }};

// ---------- 6. CHĂM SINH VẬT PHÉP THUẬT ----------
const V50_PETS = [{vi:'Bông Mây', en:'Puffcloud', ic:'☁️', c:'#f4f4ff', c2:'#c8d0f0'}, {vi:'Rùa Rêu', en:'Mossback', ic:'🐢', c:'#6aa84f', c2:'#4a8a3a'}, {vi:'Đom Đóm Lumi', en:'Lumi Firefly', ic:'✨', c:'#ffe066', c2:'#c8a020'}];
const V50_NEEDS = [{k:'eat', ic:'🍓', vi:'Đói bụng', how:'Kéo quả dâu vào miệng'}, {k:'pet', ic:'💗', vi:'Muốn được vuốt ve', how:'Vuốt qua lại trên bạn ấy'}, {k:'wash', ic:'🫧', vi:'Muốn tắm', how:'Chạm vỡ các bong bóng'}, {k:'sleep', ic:'💤', vi:'Buồn ngủ', how:'Chạm đèn để tắt'}];
V50_GAMES.creature = {name:'Chăm Sinh Vật Phép', en:'Creature Care', icon:'🐣', modes:[['☁️', 'Bông Mây'], ['🐢', 'Rùa Rêu'], ['✨', 'Đom Đóm Lumi']], hint:'Xem bong bóng nhu cầu rồi làm theo', gest:'tap',
  help:['🐣 Bạn nhỏ sẽ hiện <b>bong bóng</b> cho biết đang cần gì.', '🍓 Đói: <b>kéo</b> quả dâu vào bạn ấy.', '💗 Muốn vuốt ve: <b>vuốt qua lại</b> trên bạn ấy.', '🫧 Muốn tắm: <b>chạm</b> vỡ các bong bóng.', '💤 Buồn ngủ: <b>chạm đèn</b> để tắt đèn.', '⏱ 60 giây. Chăm nhanh và đúng để được nhiều tim ❤️.'],
  start(G){ const S = G.st; S.left = 60; S.need = null; S.wait = 1; S.done = 0; S.tot = 0; S.happy = .7; S.rub = 0; S.lx = null; S.drag = null; S.bub = []; S.dark = 0; S.msg = null; S.jump = 0; },
  geo(W, H){ return {cx:W/2, cy:H/V50_PHI, r:Math.min(W, H)*.16, berry:[W*.16, H - 90], lamp:[W*.84, H*.3]}; },
  update(G, dt){ const S = G.st, o = this.geo(V50G.W, V50G.H); S.left -= dt; if(S.left <= 0) return v50GEnd(G, G.score, S.tot ? S.done/Math.max(8, S.tot) : 0, null, 'Em đã chăm ' + S.done + ' lần cho ' + V50_PETS[G.mode].vi + ' ❤️'); S.jump = Math.max(0, S.jump - dt*2);
    if(S.msg){ S.msg.t -= dt; if(S.msg.t <= 0) S.msg = null; } S.dark = Math.max(0, S.dark - dt*.3);
    if(!S.need){ S.wait -= dt; if(S.wait <= 0){ const nd = V50_NEEDS[Math.floor(Math.random()*4)]; S.need = {d:nd, t:9}; S.tot++; S.rub = 0; if(nd.k === 'wash'){ S.bub = []; for(let i = 0; i < 6; i++){ const a = i/6*6.28; S.bub.push({x:o.cx + Math.cos(a)*o.r*1.3, y:o.cy + Math.sin(a)*o.r*1.0, r:14 + Math.random()*8, on:true}); } } } }
    else { S.need.t -= dt; if(S.need.t <= 0){ S.need = null; S.wait = 1; S.happy = Math.max(0, S.happy - .1); S.msg = {t:1.5, s:'😢 Bạn ấy đợi lâu quá…'}; } } },
  ok(G){ const S = G.st, o = this.geo(V50G.W, V50G.H), pts = 10 + Math.round(S.need.t*2); G.score += pts; S.done++; S.happy = Math.min(1, S.happy + .15); S.msg = {t:1.4, s:'❤️ Cảm ơn! +' + pts}; S.need = null; S.wait = 1.2 + Math.random(); S.jump = 1; v50Snd('ok');
    for(let k = 0; k < 14; k++){ const a = k/14*6.28; v50P(o.cx, o.cy - o.r*.5, Math.cos(a)*120, Math.sin(a)*90 - 40, .9, 8, v50Shape('heart', '#ff6f91'), -20); } },
  down(G, x, y){ const S = G.st, o = this.geo(V50G.W, V50G.H); if(!S.need) { if(Math.hypot(x - o.cx, y - o.cy) < o.r){ S.jump = 1; v50Snd('pop'); } return; } const k = S.need.d.k;
    if(k === 'eat' && Math.hypot(x - o.berry[0], y - o.berry[1]) < 46) S.drag = [x, y];
    if(k === 'wash'){ const b = S.bub.find(b => b.on && Math.hypot(x - b.x, y - b.y) < b.r + 14); if(b){ b.on = false; v50Snd('pop'); for(let i = 0; i < 6; i++) v50P(b.x, b.y, (Math.random() - .5)*80, (Math.random() - .5)*80, .4, 5, v50Shape('bubble', '#c9ecff'), 0); if(S.bub.every(q => !q.on)) this.ok(G); } }
    if(k === 'sleep' && Math.hypot(x - o.lamp[0], y - o.lamp[1]) < 50){ S.dark = 1; this.ok(G); }
    if(k === 'pet' && Math.hypot(x - o.cx, y - o.cy) < o.r*1.2) S.lx = x; },
  move(G, x, y, d){ const S = G.st, o = this.geo(V50G.W, V50G.H); if(!d) return; if(S.drag){ S.drag = [x, y]; if(S.need && Math.hypot(x - o.cx, y - o.cy) < o.r*.9){ S.drag = null; this.ok(G); } return; }
    if(S.lx != null && S.need && S.need.d.k === 'pet' && Math.hypot(x - o.cx, y - o.cy) < o.r*1.4){ S.rub += Math.abs(x - S.lx); S.lx = x; if(Math.random() < .3) v50P(x, y, 0, -40, .7, 6, v50Shape('heart', '#ff8fc4'), -10); if(S.rub > o.r*5) { S.lx = null; this.ok(G); } } },
  up(G){ const S = G.st; S.drag = null; S.lx = null; },
  draw(G, g, W, H){ const S = G.st, o = this.geo(W, H), t = performance.now()/1000, P = V50_PETS[G.mode];
    if(!V50G.petBg || V50G.petBg.width !== Math.round(W)){ const c = V50G.petBg = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); const x = c.getContext('2d'); x.fillStyle = '#cfeee6'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ffffff'; x.lineWidth = 3;
      for(let i = 0; i < W; i += 60){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H*.7); x.stroke(); } x.beginPath(); x.moveTo(0, H*.38); x.lineTo(W, H*.38); x.stroke(); x.fillStyle = '#7fd07a'; x.fillRect(0, H*.7, W, H*.3); x.fillStyle = '#4fa36a';
      for(let i = 0; i < 26; i++){ x.beginPath(); x.arc(Math.random()*W, H*.7 + Math.random()*20, 10 + Math.random()*14, 0, 7); x.fill(); } x.fillStyle = '#ff8fc4'; for(let i = 0; i < 14; i++) x.fillRect(Math.random()*W, H*.72 + Math.random()*H*.2, 5, 5); }
    g.drawImage(V50G.petBg, 0, 0, W, H);
    // đèn
    g.fillStyle = '#5a3a22'; g.fillRect(o.lamp[0] - 2, o.lamp[1], 4, 60); g.fillStyle = S.dark > 0 ? '#5a5a6a' : '#ffe9a8'; g.beginPath(); g.arc(o.lamp[0], o.lamp[1], 16, 0, 7); g.fill(); if(!S.dark){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(v50Glow('#ffb347'), o.lamp[0] - 50, o.lamp[1] - 50, 100, 100); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // sinh vật
    const b = Math.sin(t*3)*4 - S.jump*30*Math.sin(S.jump*Math.PI), cx = o.cx, cy = o.cy + b, r = o.r, sl = S.need && S.need.d.k === 'sleep';
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(cx, o.cy + r*.95, r*.9, r*.22, 0, 0, 7); g.fill();
    if(G.mode === 0){ g.fillStyle = P.c; [[-.45, .1, .55], [.45, .05, .6], [0, -.25, .62], [-.2, .3, .5], [.25, .32, .5]].forEach(a => { g.beginPath(); g.arc(cx + a[0]*r, cy + a[1]*r, a[2]*r, 0, 7); g.fill(); }); g.fillStyle = P.c2; g.fillRect(cx - r*.8, cy + r*.6, r*1.6, r*.12); }
    else if(G.mode === 1){ g.fillStyle = '#c8b07a'; g.beginPath(); g.ellipse(cx + r*.9, cy + r*.2, r*.35, r*.28, 0, 0, 7); g.fill(); g.fillRect(cx - r*.7, cy + r*.4, r*.3, r*.4); g.fillRect(cx + r*.4, cy + r*.4, r*.3, r*.4); g.fillStyle = P.c; g.beginPath(); g.ellipse(cx, cy + r*.1, r, r*.75, 0, Math.PI, 0); g.fill(); g.fillStyle = P.c2; for(let k = 0; k < 5; k++){ g.beginPath(); g.arc(cx - r*.6 + k*r*.3, cy - r*.25 + (k % 2)*r*.15, r*.13, 0, 7); g.fill(); } g.fillStyle = '#2fbf71'; g.fillRect(cx - r*.2, cy - r*.7, r*.4, r*.12); }
    else { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6 + .3*Math.sin(t*4); g.drawImage(v50Glow('#ffe066'), cx - r*1.6, cy - r*1.4, r*3.2, r*3.2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(220,240,255,.7)'; const fl = Math.sin(t*20)*r*.15; g.beginPath(); g.ellipse(cx - r*.5, cy - r*.4 - fl, r*.5, r*.25, -.5, 0, 7); g.ellipse(cx + r*.5, cy - r*.4 - fl, r*.5, r*.25, .5, 0, 7); g.fill();
      g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(cx, cy - r*.1, r*.45, r*.5, 0, 0, 7); g.fill(); g.fillStyle = P.c; g.beginPath(); g.ellipse(cx, cy + r*.45, r*.4, r*.35, 0, 0, 7); g.fill(); }
    // mặt
    const ey = G.mode === 1 ? cy + r*.15 : cy - r*.1, ex = G.mode === 1 ? cx + r*.95 : cx; g.fillStyle = '#1a1a22'; if(sl || S.dark > 0){ g.fillRect(ex - r*.28, ey, r*.16, 3); g.fillRect(ex + r*.12, ey, r*.16, 3); } else { g.beginPath(); g.arc(ex - r*.2, ey, r*.08, 0, 7); g.arc(ex + r*.2, ey, r*.08, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(ex - r*.22, ey - r*.05, 3, 3); g.fillRect(ex + r*.18, ey - r*.05, 3, 3); }
    g.fillStyle = '#ff9ac0'; g.globalAlpha = .7; g.beginPath(); g.arc(ex - r*.36, ey + r*.15, r*.08, 0, 7); g.arc(ex + r*.36, ey + r*.15, r*.08, 0, 7); g.fill(); g.globalAlpha = 1; g.strokeStyle = '#1a1a22'; g.lineWidth = 2; g.beginPath(); g.arc(ex, ey + r*.12, r*.1, .2, Math.PI - .2); g.stroke();
    if(S.dark > 0){ g.fillStyle = `rgba(10,14,44,${S.dark*.5})`; g.fillRect(0, 0, W, H); v50Txt(g, 'z z Z', cx + r, cy - r - Math.sin(t*2)*6, 20, '#c8d0ff'); }
    // dâu
    const bp = S.drag || o.berry; g.fillStyle = '#ef4b4b'; g.beginPath(); g.ellipse(bp[0], bp[1], 16, 19, 0, 0, 7); g.fill(); g.fillStyle = '#2fbf71'; g.fillRect(bp[0] - 8, bp[1] - 22, 16, 6); g.fillStyle = '#ffe9a8'; for(let k = 0; k < 5; k++) g.fillRect(bp[0] - 8 + (k % 3)*7, bp[1] - 6 + Math.floor(k/3)*9, 2, 2);
    // bong bóng
    if(S.need && S.need.d.k === 'wash') S.bub.forEach(q => { if(q.on) g.drawImage(v50Shape('bubble', '#9fd8ff'), q.x - q.r, q.y - q.r + Math.sin(t*3 + q.x)*4, q.r*2, q.r*2); });
    // bong bóng nhu cầu
    if(S.need){ const n = S.need.d; v50Pill(g, n.ic + ' ' + n.vi, cx, o.cy - r*1.7, 18, 'rgba(255,255,255,.95)', '#1a1430'); v50Pill(g, n.how + ' · ' + Math.ceil(S.need.t) + 's', cx, o.cy - r*1.7 + 44, 16, 'rgba(11,16,32,.8)'); }
    v50Pill(g, P.ic + ' ' + P.vi + ' · Vui ' + Math.round(S.happy*100) + '%', W/2, H - 34, 16, 'rgba(11,16,32,.75)'); if(S.msg) v50Pill(g, S.msg.s, W/2, H*.16, 18, 'rgba(11,16,32,.85)', '#ffe9a8'); },
  stat(G){ const S = G.st; return '🐣 ❤️ ' + S.done + ' · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.left)) + 's'; }};

// ---------- 7. GIẢI ĐỐ RUNE RUBIK trong thư viện: vuốt hàng / cột để xoay vòng ----------
const V50_RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ'];
V50_GAMES.runes = {name:'Giải Đố Rune Rubik', en:'Rune Puzzle', icon:'📚', modes:[['🟢', 'Dễ: 2 bước xáo'], ['🔴', 'Khó: 4 bước xáo']], hint:'Vuốt ngang một hàng hoặc dọc một cột', gest:'swipe',
  help:['📜 Góc trên là <b>mặt mẫu</b> 3×3 của cuốn sách cổ.', '👉 <b>Vuốt ngang</b> trên một hàng để đẩy hàng đó (ô cuối vòng lại đầu).', '👇 <b>Vuốt dọc</b> trên một cột để đẩy cột đó.', '🧩 Xếp lại cho giống mẫu với ít bước nhất. 5 câu đố.', '🧠 Luyện tư duy không gian giống xoay mặt Rubik.'],
  start(G){ const S = G.st; S.n = 0; S.left = 150; S.res = []; this.next(G); },
  next(G){ const S = G.st; S.n++; S.tg = Array.from({length:9}, () => Math.floor(Math.random()*6)); if(new Set(S.tg).size < 3) S.tg = [0, 1, 2, 3, 4, 5, 0, 2, 4].sort(() => Math.random() - .5);
    S.b = S.tg.slice(); S.k = G.mode ? 4 : 2; let last = -1; for(let i = 0; i < S.k; i++){ let m; do { m = Math.floor(Math.random()*12); } while(Math.floor(m/2) === Math.floor(last/2)); this.shift(S.b, m); last = m; } if(S.b.join() === S.tg.join()) this.shift(S.b, 0);
    S.mv = 0; S.msg = null; S.p = null; S.anim = null; },
  shift(b, m){ if(m < 6){   // 0–5: hàng (trái/phải), 6–11: cột (lên/xuống)
     const r = Math.floor(m/2), d = m % 2 ? 1 : -1, row = [b[r*3], b[r*3 + 1], b[r*3 + 2]]; for(let c = 0; c < 3; c++) b[r*3 + (c + d + 3) % 3] = row[c]; }
    else { const c = Math.floor((m - 6)/2), d = m % 2 ? 1 : -1, col = [b[c], b[3 + c], b[6 + c]]; for(let r = 0; r < 3; r++) b[((r + d + 3) % 3)*3 + c] = col[r]; } },
  geo(W, H){ const s = Math.min(W*.8, H*.46), x0 = W/2 - s/2, y0 = H/V50_PHI - s/2 + 20; return {s, x0, y0, c:s/3}; },
  update(G, dt){ const S = G.st; S.left -= dt; if(S.left <= 0) return this.fin(G); if(S.msg){ S.msg.t -= dt; if(S.msg.t <= 0){ if(S.n >= 5) return this.fin(G); this.next(G); } } },
  fin(G){ const S = G.st; v50GEnd(G, G.score, S.res.length ? S.res.reduce((a, b) => a + b, 0)/5 : 0, null, 'Giải được ' + S.res.length + '/5 trang sách cổ.'); },
  down(G, x, y){ G.st.p = [x, y]; },
  up(G, x, y){ const S = G.st, o = this.geo(V50G.W, V50G.H); if(!S.p || S.msg) return; const dx = x - S.p[0], dy = y - S.p[1]; S.p0 = S.p; S.p = null; if(Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    const sx = S.p0[0] - o.x0, sy = S.p0[1] - o.y0; let m; if(Math.abs(dx) > Math.abs(dy)){ const r = Math.floor(sy/o.c); if(r < 0 || r > 2) return; m = r*2 + (dx > 0 ? 1 : 0); } else { const c = Math.floor(sx/o.c); if(c < 0 || c > 2) return; m = 6 + c*2 + (dy > 0 ? 1 : 0); }
    this.shift(S.b, m); S.mv++; v50Snd('pop'); S.anim = {m, t:.18};
    if(S.b.join() === S.tg.join()){ const sc = Math.max(.3, 1 - Math.max(0, S.mv - S.k)*.12), pts = Math.round(sc*100); G.score += pts; S.res.push(sc); S.msg = {t:2, s:'📖 Mở khoá trang sách! +' + pts + ' (' + S.mv + ' bước)'}; v50Burst(V50G.W/2, o.y0 + o.s/2, V50_WANDS[11], true); } },
  draw(G, g, W, H){ const S = G.st, o = this.geo(W, H), t = performance.now()/1000;
    if(!V50G.libBg || V50G.libBg.width !== Math.round(W)){ const c = V50G.libBg = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); const x = c.getContext('2d'); x.fillStyle = '#3a2a22'; x.fillRect(0, 0, W, H);
      for(let sy = 20; sy < H; sy += 70){ x.fillStyle = '#5a3a22'; x.fillRect(0, sy + 52, W, 10); for(let bx = 6; bx < W; ){ const bw = 8 + Math.random()*10, bh = 34 + Math.random()*16; x.fillStyle = ['#7a1f2b', '#1d2a5c', '#1f4a33', '#6a4a8a', '#8a6a10', '#5a3a22'][Math.floor(Math.random()*6)]; x.fillRect(bx, sy + 52 - bh, bw, bh); x.fillStyle = 'rgba(232,194,122,.6)'; x.fillRect(bx, sy + 52 - bh + 6, bw, 2); bx += bw + 2; } }
      x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, 0, W, H); }
    g.drawImage(V50G.libBg, 0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .3; g.drawImage(v50Glow('#ffb347'), W/2 - o.s, o.y0 - o.s*.5, o.s*2, o.s*2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // trang sách
    g.fillStyle = '#e8dcc0'; v50RR(g, o.x0 - 16, o.y0 - 16, o.s + 32, o.s + 32, 10); g.fill(); g.fillStyle = 'rgba(120,90,50,.25)'; g.fillRect(o.x0 - 16, o.y0 + o.s/2 - 1, o.s + 32, 2);
    const tile = (x, y, c, v, glow) => { g.fillStyle = '#1a1430'; v50RR(g, x + 3, y + 3, c - 6, c - 6, 8); g.fill(); g.fillStyle = V50_RUBIK[v]; v50RR(g, x + 6, y + 6, c - 12, c - 12, 6); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 6 + (c - 12)/V50_PHI, y + 6, (c - 12) - (c - 12)/V50_PHI, c - 12);
      g.font = '800 ' + Math.round(c*.42) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = v === 4 || v === 1 ? '#3a2a1a' : '#ffffff'; g.fillText(V50_RUNES[v], x + c/2, y + c/2 + 1); };
    if(S.anim){ S.anim.t -= 1/60; if(S.anim.t <= 0) S.anim = null; }
    for(let i = 0; i < 9; i++){ let ox = 0, oy = 0; if(S.anim){ const k = S.anim.t/.18, m = S.anim.m; if(m < 6 && Math.floor(i/3) === Math.floor(m/2)) ox = (m % 2 ? -1 : 1)*k*o.c*.5; if(m >= 6 && i % 3 === Math.floor((m - 6)/2)) oy = (m % 2 ? -1 : 1)*k*o.c*.5; } tile(o.x0 + (i % 3)*o.c + ox, o.y0 + Math.floor(i/3)*o.c + oy, o.c, S.b[i]); }
    // mẫu
    const mc = Math.min(30, W*.07), mx = W - mc*3 - 22, my = 64; g.fillStyle = 'rgba(11,16,32,.8)'; v50RR(g, mx - 10, my - 10, mc*3 + 20, mc*3 + 40, 12); g.fill(); for(let i = 0; i < 9; i++){ g.fillStyle = V50_RUBIK[S.tg[i]]; g.fillRect(mx + (i % 3)*mc + 1, my + Math.floor(i/3)*mc + 1, mc - 2, mc - 2); } v50Txt(g, 'Mẫu', mx + mc*1.5, my + mc*3 + 16, 16, '#ffe9a8');
    v50Pill(g, '👉 Vuốt hàng · 👇 Vuốt cột · Bước: ' + S.mv, W/2, o.y0 + o.s + 50, 16); if(S.msg) v50Pill(g, S.msg.s, W/2, o.y0 - 44, 17, 'rgba(11,16,32,.88)', '#ffe9a8'); },
  stat(G){ const S = G.st; return '📚 Trang ' + Math.min(5, S.n) + '/5 · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.left)) + 's'; }};
