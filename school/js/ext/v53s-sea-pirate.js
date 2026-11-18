// ================= v53s · TÀU HẢI TẶC RÂU CAM: nhảy sang tàu, thử thách không bạo lực, thắng thì hải tặc giương buồm đi xa =================
// 4 thử thách: 🗑️ dọn rác biển · 🪢 kéo co · 🧩 ghép bản đồ kho báu kiểu Rubik · ❓ đố vui. Không đánh nhau, không ai bị thương.
const V53S_ST = ['jump', 'trash', 'tug', 'rubik', 'quiz', 'end'];
const V53S_SAY = {
  trash:'🏴‍☠️ Râu Cam: "Ta lỡ đổ rác xuống biển… Các cháu vớt sạch giúp ta nhé!"',
  tug:'🏴‍☠️ Râu Cam: "Giỏi lắm! Giờ kéo co với thủy thủ Bông của ta xem nào!"',
  rubik:'🏴‍☠️ Râu Cam: "Bản đồ kho báu bị xáo như khối Rubik. Xoay hàng, cột cho đúng hình mẫu!"',
  quiz:'🏴‍☠️ Râu Cam: "Câu đố cuối cùng của thuyền trưởng! Trả lời đúng 2 câu là thắng."',
  end:'🏴‍☠️ Râu Cam: "Ta chịu thua! Cảm ơn các cháu đã dạy ta giữ biển sạch. Giương buồm thôi!"'};
const V53S_Q = [
  ['Nước biển mặn vì có nhiều chất gì?', ['Muối', 'Đường', 'Dầu', 'Cát']], ['Cá thở bằng bộ phận nào?', ['Mang', 'Phổi', 'Da', 'Vây']],
  ['Cá voi thuộc nhóm động vật nào?', ['Thú có vú', 'Cá', 'Bò sát', 'Lưỡng cư']], ['7 × 8 = ?', ['56', '54', '64', '48']],
  ['Bạch tuộc có mấy xúc tu?', ['8', '6', '10', '4']], ['Thủy triều lên xuống chủ yếu do sức hút của…', ['Mặt Trăng', 'Sao Hỏa', 'Gió', 'Cá voi']],
  ['Hải đăng dùng để làm gì?', ['Chỉ đường cho tàu', 'Bắt cá', 'Làm nhà ở', 'Đo mưa']], ['Mỗi mặt khối Rubik 3×3 có bao nhiêu ô?', ['9', '6', '12', '16']],
  ['12 thủy thủ chia đều lên 3 thuyền nhỏ. Mỗi thuyền mấy người?', ['4', '3', '6', '9']], ['Rác nhựa ra biển gây hại gì?', ['Rùa, cá ăn nhầm bị bệnh', 'Nước ngọt hơn', 'Cá lớn nhanh', 'Không sao cả']],
  ['Kim la bàn luôn chỉ về hướng nào?', ['Bắc', 'Đông', 'Tây', 'Lên trời']], ['Đại dương lớn nhất Trái Đất là…', ['Thái Bình Dương', 'Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương']],
  ['45 + 27 = ?', ['72', '62', '71', '82']], ['Khối Rubik có mấy mặt?', ['6', '4', '8', '9']], ['Biển Đông nằm ở phía nào của Việt Nam?', ['Phía đông', 'Phía tây', 'Phía bắc', 'Phía nam']]];
function v53sPirOpen(){ if(!v53sPirHere()){ toast('🌊 Hải tặc đã đi xa rồi.'); return; } const c = v53sMe(); V53S.pirBoat = c && c.boat ? c.boat.item : null; openArcade('v53spir', 0); }
function v53sShuf(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function v53sPirStage(s, k){ s.stage = k; s.sk = V53S_ST[k]; s.st0 = s.t; s.say = V53S_SAY[s.sk] || ''; s.sayT = 4.5; s.btn = [];
  if(s.sk === 'trash'){ s.junk = []; s.got = 0; s.need = 10; for(let i = 0; i < 7; i++) s.junk.push(v53sJunk(s)); }
  if(s.sk === 'tug'){ s.rope = 50; s.tugW = 0; s.cur = 0; s.gz = .3 + Math.random()*.4; s.hitT = 0; s.miss = 0; }
  if(s.sk === 'rubik'){ s.grid = [0, 1, 2, 3, 4, 5, 6, 7, 8]; s.moves = 0; for(let n = 0; n < 3 || v53sSolved(s.grid); n++) v53sShift(s.grid, Math.floor(Math.random()*6)); }
  if(s.sk === 'quiz'){ s.qs = v53sShuf(V53S_Q.slice()).slice(0, 3).map(([q, a]) => { const o = a.map((t, i) => ({t, ok:!i})); return {q, o:v53sShuf(o)}; }); s.qi = 0; s.right = 0; s.ans = -1; s.ansT = 0; }
  if(s.sk === 'end'){ s.endT = 0; } }
function v53sJunk(s){ const k = Math.floor(Math.random()*4); return {k, x:Math.random()*s.vw, y:0, ph:Math.random()*6, vx:(Math.random() < .5 ? -1 : 1)*(10 + Math.random()*16), up:0}; }
function v53sShift(g, op){ const n = op % 3; if(op < 3){ const r = n*3, t = g[r + 2]; g[r + 2] = g[r + 1]; g[r + 1] = g[r]; g[r] = t; } else { const t = g[6 + n]; g[6 + n] = g[3 + n]; g[3 + n] = g[n]; g[n] = t; } }
function v53sSolved(g){ return g.every((v, i) => v === i); }
function v53sPirLay(s){ const W = s.vw, H = s.vh, port = H > W; s.deck = Math.round(H*(port ? .618 : .58)); s.water = s.deck + Math.round(H*(port ? .07 : .1)); }
GAMES.v53spir = {
  title:'Tàu hải tặc Râu Cam', opts:[], v44own:true,
  help:'🏴‍☠️ Không đánh nhau! Vượt 4 thử thách để hải tặc chịu thua: 🗑️ chạm vào rác trôi trên biển để vớt lên · 🪢 kéo co: chạm khi kim chạy vào vạch xanh · 🧩 bản đồ: chạm ▶ để xoay hàng, ▼ để xoay cột cho giống hình mẫu · ❓ đố vui: chọn đáp án đúng. Thắng xong, hải tặc cảm ơn và giương buồm đi xa. Vài ngày sau họ có thể quay lại chơi tiếp.',
  init(){ const [vw, vh] = v45pSize(), cv = $('#arcCv'); if(cv && (cv.width !== vw || cv.height !== vh)){ cv.width = vw; cv.height = vh; }
    const s = {vw, vh, t:0, look:v53sLook(), item:V53S.pirBoat, tod:v53sTod(), lay:null, fx:[]}; s.lay = () => v53sPirLay(s); v53sPirLay(s); v53sPirStage(s, 0); return s; },
  pointer(s, ty, ax, ay){ if(ty !== 'down' || s.over) return; const x = ax*s.vw/AW, y = ay*s.vh/AH;
    if(s.sayT > 0 && s.t - s.st0 > .6) s.sayT = Math.min(s.sayT, .4);
    if(s.sk === 'trash'){ const j = s.junk.find(j => !j.up && Math.hypot(j.x - x, j.y - y) < 46); if(j){ j.up = .01; s.got++; s.fx.push({x:j.x, y:j.y, t:0}); try { v45pSplash(.2, 1000 + s.got*60); } catch(e){} } }
    else if(s.sk === 'tug'){ if(s.hitT > 0) return; const ok = Math.abs(s.cur - s.gz) < .118; s.hitT = .25; if(ok){ s.rope += 13; s.gz = .2 + Math.random()*.6; try { kickSfx(.7); } catch(e){} s.good = .5; } else { s.rope -= 4; s.miss = .5; try { blipSfx(300); } catch(e){} } }
    else if(s.sk === 'rubik'){ const b = s.btn.find(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h); if(b){ v53sShift(s.grid, b.op); s.moves++; try { woodKnock(AC.currentTime, 700 + b.op*60, .4, .05); } catch(e){} if(v53sSolved(s.grid)){ s.solvedT = 1.6; try { cheerSfx(); } catch(e){} } } }
    else if(s.sk === 'quiz'){ if(s.ans >= 0) return; const b = s.btn.find(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h); if(b){ s.ans = b.i; s.ansT = 1.8; const ok = s.qs[s.qi].o[b.i].ok; if(ok){ s.right++; try { blipSfx(1500); } catch(e){} } else try { blipSfx(260); } catch(e){} } } },
  update(s, dt){ if(s.over) return; s.t += dt; s.sayT -= dt; s.fx.forEach(p => p.t += dt); s.fx = s.fx.filter(p => p.t < .8); const el = s.t - s.st0;
    if(s.sk === 'jump'){ if(el > 1.8) v53sPirStage(s, 1); return; }
    if(s.sk === 'trash'){ s.junk.forEach(j => { j.ph += dt; if(j.up){ j.up += dt*1.6; j.y -= 260*dt; return; } j.x += j.vx*dt; if(j.x < 20) j.vx = Math.abs(j.vx); if(j.x > s.vw - 20) j.vx = -Math.abs(j.vx); j.y = s.water + 24 + ((j.k*37 + j.ph*3) % 1)*0 + (s.vh - s.water - 60)*((j.k + 1)/5) + Math.sin(j.ph*1.3)*5; });
      s.junk = s.junk.filter(j => !j.up || j.up < 1); while(s.junk.length < 6 && s.got + s.junk.length < s.need + 3) s.junk.push(v53sJunk(s)); if(s.got >= s.need){ s.done = (s.done || 0) + dt; if(s.done > 1.2){ s.done = 0; v53sPirStage(s, 2); } } }
    else if(s.sk === 'tug'){ s.hitT -= dt; s.good = Math.max(0, (s.good || 0) - dt); s.miss = Math.max(0, (s.miss || 0) - dt); s.cur = .5 + .5*Math.sin(s.t*2.2); if(s.rope >= 100) s.tugW = 1; if(el > 1.5 && !s.tugW) s.rope -= 3.2*dt;
      if(s.tugW){ s.rope = 100; s.done = (s.done || 0) + dt; if(s.done > 1){ s.done = 0; v53sPirStage(s, 3); } } else if(s.rope <= 0){ s.rope = 50; s.say = '🏴‍☠️ Bông: "Hì hì, ta thắng ván này! Chơi lại nhé, lần này chạm đúng vạch xanh!"'; s.sayT = 3.5; } }
    else if(s.sk === 'rubik'){ if(s.solvedT > 0){ s.solvedT -= dt; if(s.solvedT <= 0) v53sPirStage(s, 4); } }
    else if(s.sk === 'quiz'){ if(s.ans >= 0){ s.ansT -= dt; if(s.ansT <= 0){ s.ans = -1; s.qi++; if(s.qi >= 3){ if(s.right >= 2) v53sPirStage(s, 5); else { v53sPirStage(s, 4); s.say = '🏴‍☠️ Râu Cam: "Chưa đủ 2 câu đúng. Ta hỏi câu khác nhé!"'; } } } } }
    else if(s.sk === 'end'){ s.endT += dt; if(s.endT > 3.2 && !s.over) v53sPirWin(s); } },
  draw(s, c){ v53sPirDraw(s, c); }
};
function v53sPirWin(s){ const plays = v45pDay('v53s-pir-day', true), half = plays > 10; let money = 20, exp = 45; if(half){ money = 10; exp = 22; } s.rw = [money, exp];
  s.over = 'Hải tặc chịu thua! 🎉'; s.sub = PROF ? `+$${money} · +${exp} EXP · tàu Râu Cam giương buồm đi xa` : 'Đăng nhập để nhận tiền và EXP'; try { v53sPirSail(); mprog('pirate'); confetti(); } catch(e){} }
// ---------- vẽ: nền boong tàu cache một lần theo cỡ màn hình + giờ ----------
function v53sDeckBg(s){ const key = [s.vw, s.vh, s.tod].join(); if(V53S.dkKey === key) return V53S.dk; const cv = V53S.dk || document.createElement('canvas'); cv.width = s.vw; cv.height = s.vh; const g = cv.getContext('2d'), W = s.vw, H = s.vh, D = s.deck, N = s.tod === 'night';
  let gr = g.createLinearGradient(0, 0, 0, D); gr.addColorStop(0, N ? '#0a1030' : s.tod === 'dusk' ? '#5b4b9a' : '#6cb8f6'); gr.addColorStop(1, N ? '#283a6a' : s.tod === 'dusk' ? '#ffab6b' : '#d6f0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, D);
  gr = g.createLinearGradient(0, D, 0, H); gr.addColorStop(0, N ? '#123456' : '#2b9ac4'); gr.addColorStop(1, N ? '#06121f' : '#0d4a6e'); g.fillStyle = gr; g.fillRect(0, D, W, H - D);
  // cột buồm + buồm vá màu Rubik + cờ Râu Cam (khối Rubik thay cho đầu lâu)
  const mx = Math.round(W*.618); g.fillStyle = '#4e342e'; g.fillRect(mx - 6, Math.round(D*.08), 12, D - Math.round(D*.08)); g.fillRect(mx - Math.round(W*.2), Math.round(D*.2), Math.round(W*.4), 8);
  g.fillStyle = '#efe6d2'; g.beginPath(); g.moveTo(mx - W*.19, D*.2 + 8); g.quadraticCurveTo(mx, D*.42, mx + W*.19, D*.2 + 8); g.lineTo(mx + W*.17, D*.66); g.quadraticCurveTo(mx, D*.72, mx - W*.17, D*.66); g.closePath(); g.fill();
  const C = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#f4f4f4'], cs = Math.round(Math.min(W, D)*.05); for(let i = 0; i < 9; i++){ g.fillStyle = C[(i*5) % 6]; g.fillRect(mx - cs*1.5 + (i % 3)*cs + 1, D*.36 + Math.floor(i/3)*cs + 1, cs - 2, cs - 2); }
  g.fillStyle = '#212121'; g.fillRect(mx + 6, Math.round(D*.08), Math.round(W*.09), Math.round(D*.08)); g.fillStyle = '#ff8a2b'; g.fillRect(mx + 6 + Math.round(W*.03), Math.round(D*.1), Math.round(W*.03), Math.round(D*.04));
  // boong gỗ + mạn tàu
  g.fillStyle = '#8d6e47'; g.fillRect(0, D - 8, W, 16); g.fillStyle = '#6d4c2e'; g.fillRect(0, D + 8, W, s.water - D - 8); g.fillStyle = '#5d3f24'; for(let x = 0; x < W; x += 46) g.fillRect(x, D + 8, 3, s.water - D - 8);
  g.fillStyle = '#4e342e'; g.fillRect(0, D - 28, W, 6); for(let x = 10; x < W; x += 38) g.fillRect(x, D - 28, 5, 22); g.fillStyle = '#ffd23f'; for(let x = 60; x < W; x += 150){ g.beginPath(); g.arc(x, D + 30, 7, 0, 6.283); g.fill(); }
  V53S.dk = cv; V53S.dkKey = key; return cv; }
function v53sPirate(c, x, y, sc, k, dir){ const f = agentLook(k, {}); try { drawGuy(c, f, x, y, sc, dir, false); } catch(e){}
  // mũ hải tặc + râu cam (chỉ là trang phục, vẽ bằng khối pixel)
  const hy = y - 31*sc; c.fillStyle = '#212121'; c.fillRect(Math.round(x - 8*sc), Math.round(hy), Math.round(16*sc), Math.round(3*sc)); c.fillRect(Math.round(x - 5*sc), Math.round(hy - 4*sc), Math.round(10*sc), Math.round(4*sc)); c.fillStyle = '#ffd23f'; c.fillRect(Math.round(x - 1*sc), Math.round(hy - 3*sc), Math.round(2*sc), Math.round(2*sc));
  if(k === 7){ c.fillStyle = '#ff8a2b'; c.fillRect(Math.round(x - 4*sc), Math.round(y - 21*sc), Math.round(8*sc), Math.round(4*sc)); c.fillRect(Math.round(x - 2*sc), Math.round(y - 17*sc), Math.round(4*sc), Math.round(2*sc)); } }
function v53sBubble(c, s, t){ const W = s.vw, port = s.vh > W, fs = port ? 19 : 18, bw = Math.min(W - 24, port ? W - 24 : 560); c.font = `800 ${fs}px Nunito, sans-serif`; const words = t.split(' '), L = []; let line = '';
  words.forEach(w => { const tt = line ? line + ' ' + w : w; if(c.measureText(tt).width > bw - 28){ L.push(line); line = w; } else line = tt; }); if(line) L.push(line);
  const bh = L.length*(fs + 6) + 20, bx = (W - bw)/2, by = port ? 128 : 86; c.fillStyle = 'rgba(255,248,225,.96)'; v45pRound(c, bx, by, bw, bh, 14); c.fill(); c.fillStyle = '#3e2723'; c.textAlign = 'center'; L.forEach((l, i) => c.fillText(l, W/2, by + 12 + fs + i*(fs + 6))); c.textAlign = 'left'; return by + bh; }
function v53sPirDraw(s, c){ const W = s.vw, H = s.vh, D = s.deck, port = H > W, t = s.t, fs = port ? 22 : 20, sc = port ? 2.6 : 2.2;
  c.imageSmoothingEnabled = false; c.drawImage(v53sDeckBg(s), 0, 0);
  c.fillStyle = 'rgba(255,255,255,.45)'; for(let x = 0; x < W; x += 10) c.fillRect(x, Math.round(s.water + Math.sin(x*.03 + t*1.6)*3), 8, 2);
  const px = Math.round(W*.2), cx = Math.round(W*.8);
  // người chơi (bên trái) và thuyền trưởng Râu Cam (bên phải)
  if(s.sk === 'jump'){ const k = Math.min(1, (t - s.st0)/1.4), bx = Math.round(W*.12), by = s.water + 30, jx = bx + (px - bx)*k, jy = by + (D - by)*k - Math.sin(k*Math.PI)*H*.22;
    withCtx(c, () => { ctx.save(); ctx.translate(bx, by + 10); ctx.scale(sc*.9, sc*.9); try { drawBoatModel(0, 0, s.item || {zone:1, col:'#ff8a2b'}, [], 1); } catch(e){} ctx.restore(); });
    try { drawGuy(c, s.look, jx, jy, sc, 1, k < 1, t*8); } catch(e){} v53sTxt(c, k < 1 ? '🦘 Nhảy sang tàu!' : '👋 Lên tàu rồi!', W/2, H*.382, fs + 4, '#ffd23f'); }
  else { try { drawGuy(c, s.look, px, D - 6, sc, 1, false); } catch(e){} v53sPirate(c, cx, D - 6, sc, 7, -1); }
  const prog = ['🗑️', '🪢', '🧩', '❓'].map((e, i) => (s.stage > i + 1 ? '✅' : s.stage === i + 1 ? e : '⬜')).join(' ');
  v53sTxt(c, `🏴‍☠️ Thử thách ${prog}`, W/2, port ? 112 : 74, fs - 2, '#fff');
  if(s.sk === 'trash'){ s.junk.forEach(j => v53sJunkDraw(c, j)); s.fx.forEach(p => { c.strokeStyle = `rgba(255,255,255,${1 - p.t/.8})`; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 10 + p.t*40, 0, 6.283); c.stroke(); });
    v53sTxt(c, `🗑️ Đã vớt ${Math.min(s.got, s.need)}/${s.need} rác · 👆 chạm vào rác trôi`, W/2, H - 18, fs - 2, '#ffd23f'); if(s.got >= s.need) v53sTxt(c, '🐢 Biển sạch rồi! Một chai nhựa cần hàng trăm năm mới phân huỷ.', W/2, H*.5, fs - 2, '#a5d6a7'); }
  else if(s.sk === 'tug'){ const mid = W/2 + (50 - s.rope)/50*W*.18, ry = D - 34*sc*.5; c.strokeStyle = '#d7b98a'; c.lineWidth = 6; c.beginPath(); c.moveTo(px + 10, ry); c.lineTo(cx - 10, ry); c.stroke();
    c.fillStyle = '#ef4b4b'; c.fillRect(Math.round(mid) - 5, Math.round(ry) - 14, 10, 28); c.fillStyle = '#fff'; c.fillRect(Math.round(W/2) - 1, Math.round(ry) + 18, 2, 18);
    const bw = Math.round(W*.618), bx = (W - bw)/2, by = Math.round((D + H)/2 + 10); c.fillStyle = 'rgba(6,14,30,.7)'; c.fillRect(bx - 8, by - 40, bw + 16, 80); c.fillStyle = '#37474f'; c.fillRect(bx, by, bw, 22); c.fillStyle = '#2fbf71'; c.fillRect(bx + (s.gz - .118)*bw, by, .236*bw, 22);
    c.fillStyle = s.good ? '#ffd23f' : s.miss ? '#ff5252' : '#fff'; c.fillRect(bx + s.cur*bw - 3, by - 6, 6, 34); v53sTxt(c, s.good ? '💪 Kéo!' : s.miss ? '😅 Hụt rồi' : '👆 Chạm khi kim vào vạch xanh', W/2, by - 12, fs - 2, '#fff');
    c.fillStyle = '#263238'; c.fillRect(bx, by + 30, bw, 8); c.fillStyle = '#4fc3f7'; c.fillRect(bx, by + 30, bw*Math.max(0, Math.min(1, s.rope/100)), 8); }
  else if(s.sk === 'rubik') v53sMapDraw(s, c);
  else if(s.sk === 'quiz') v53sQuizDraw(s, c);
  else if(s.sk === 'end'){ const k = Math.min(1, s.endT/3); v53sTxt(c, '⛵ Hải tặc giương buồm đi xa…', W/2, H*.382 + 80, fs + 2, '#ffd23f'); c.globalAlpha = 1 - k; c.fillStyle = '#efe6d2'; c.fillRect(Math.round(W*.618 + k*W*.4) - 20, Math.round(D*.5), 40, 30); c.globalAlpha = 1; }
  if(s.sayT > 0 && s.say && !s.over) v53sBubble(c, s, s.say);
  if(s.over){ const oy = port ? H*.382 : H*.26; c.fillStyle = 'rgba(5,8,20,.72)'; c.fillRect(0, 0, W, H); v53sTxt(c, s.over, W/2, oy, port ? 30 : 32, '#ffd23f'); v53sTxt(c, s.sub || '', W/2, oy + 44, fs - 2, '#fff'); v53sTxt(c, '💚 Không ai bị thương · biển sạch hơn', W/2, oy + 80, fs - 2, '#a5d6a7'); } }
function v53sJunkDraw(c, j){ const x = 0, y = 0, a = j.up ? 1 - j.up : 1; c.globalAlpha = Math.max(0, a); c.save(); c.translate(Math.round(j.x), Math.round(j.y)); c.scale(1.6, 1.6);
  if(j.k === 0){ c.fillStyle = 'rgba(178,235,242,.9)'; c.fillRect(x - 14, y - 6, 24, 12); c.fillRect(x + 10, y - 3, 6, 6); c.fillStyle = '#1e88e5'; c.fillRect(x + 16, y - 3, 3, 6); }
  else if(j.k === 1){ c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(x, y, 16, 10, Math.sin(j.ph)*.3, 0, 6.283); c.fill(); c.fillRect(x - 12, y - 16, 4, 8); c.fillRect(x + 8, y - 16, 4, 8); }
  else if(j.k === 2){ c.fillStyle = '#e53935'; c.fillRect(x - 8, y - 11, 16, 22); c.fillStyle = '#cfd8dc'; c.fillRect(x - 8, y - 11, 16, 3); c.fillRect(x - 8, y + 8, 16, 3); }
  else { c.strokeStyle = '#8d6e47'; c.lineWidth = 2; for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(x - 18, y + i*5); c.lineTo(x + 18, y + i*5); c.stroke(); c.beginPath(); c.moveTo(x + i*7, y - 12); c.lineTo(x + i*7, y + 12); c.stroke(); } }
  c.restore(); c.globalAlpha = 1; }
// bản đồ kho báu 3×3 (cache theo cỡ ô): mỗi ô một màu Rubik + nét bản đồ
function v53sMapImg(ts){ if(V53S.mapTs === ts) return V53S.map; const cv = document.createElement('canvas'); cv.width = cv.height = ts*3; const g = cv.getContext('2d'), S = ts*3, C = ['#ef4b4b', '#ff8a2b', '#ffd23f', '#2fbf71', '#f4f4f4', '#3d7bff', '#ffd23f', '#2fbf71', '#ef4b4b'];
  for(let i = 0; i < 9; i++){ g.fillStyle = C[i]; g.fillRect((i % 3)*ts, Math.floor(i/3)*ts, ts, ts); } g.globalAlpha = .55; g.fillStyle = '#f3e5c0'; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
  g.fillStyle = '#7cb342'; g.beginPath(); g.ellipse(S*.3, S*.36, S*.2, S*.14, -.3, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(S*.74, S*.7, S*.16, S*.12, .4, 0, 6.283); g.fill();
  g.strokeStyle = '#5d4037'; g.lineWidth = Math.max(2, ts*.05); g.setLineDash([ts*.12, ts*.1]); g.beginPath(); g.moveTo(S*.2, S*.3); g.quadraticCurveTo(S*.5, S*.2, S*.55, S*.5); g.quadraticCurveTo(S*.6, S*.75, S*.74, S*.7); g.stroke(); g.setLineDash([]);
  g.strokeStyle = '#c62828'; g.lineWidth = Math.max(3, ts*.08); const xx = S*.74, yy = S*.7, r = ts*.18; g.beginPath(); g.moveTo(xx - r, yy - r); g.lineTo(xx + r, yy + r); g.moveTo(xx + r, yy - r); g.lineTo(xx - r, yy + r); g.stroke();
  g.fillStyle = '#3e2723'; g.font = `800 ${Math.round(ts*.3)}px Nunito, sans-serif`; g.fillText('N', S*.85, S*.18); g.beginPath(); g.moveTo(S*.87, S*.2); g.lineTo(S*.84, S*.3); g.lineTo(S*.9, S*.3); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; for(let i = 1; i < 3; i++){ g.beginPath(); g.moveTo(i*ts, 0); g.lineTo(i*ts, S); g.moveTo(0, i*ts); g.lineTo(S, i*ts); g.stroke(); }
  V53S.map = cv; V53S.mapTs = ts; return cv; }
function v53sMapDraw(s, c){ const W = s.vw, H = s.vh, port = H > W, ts = Math.round(Math.min(port ? W*.55/3 : H*.46/3, 120)), M = v53sMapImg(ts), pw = Math.round(ts*.9), x0 = Math.round((W - (58 + ts*3 + 16 + pw))/2), gx = x0 + 58, gy = Math.round(H*.236) + (port ? 30 : 16);
  c.fillStyle = 'rgba(6,14,30,.6)'; c.fillRect(gx - 64, gy - 60, ts*3 + 82 + pw, ts*3 + 100); s.btn = [];
  for(let i = 0; i < 9; i++){ const v = s.grid[i]; c.drawImage(M, (v % 3)*ts, Math.floor(v/3)*ts, ts, ts, gx + (i % 3)*ts, gy + Math.floor(i/3)*ts, ts, ts); }
  c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.strokeRect(gx, gy, ts*3, ts*3);
  for(let r = 0; r < 3; r++){ const b = {x:gx - 58, y:gy + r*ts + ts/2 - 24, w:50, h:48, op:r}; s.btn.push(b); c.fillStyle = '#3d7bff'; v45pRound(c, b.x, b.y, b.w, b.h, 10); c.fill(); v53sTxt(c, '▶', b.x + 25, b.y + 33, 24, '#fff'); }
  for(let k = 0; k < 3; k++){ const b = {x:gx + k*ts + ts/2 - 24, y:gy - 56, w:48, h:50, op:3 + k}; s.btn.push(b); c.fillStyle = '#2fbf71'; v45pRound(c, b.x, b.y, b.w, b.h, 10); c.fill(); v53sTxt(c, '▼', b.x + 24, b.y + 34, 24, '#fff'); }
  const pX = gx + ts*3 + 16, pY = gy; c.drawImage(M, 0, 0, ts*3, ts*3, pX, pY, pw, pw); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(pX, pY, pw, pw);
  v53sTxt(c, '🗺️ Hình mẫu', pX + pw/2, pY + pw + 22, 18, '#fff'); v53sTxt(c, s.solvedT > 0 ? '🎉 Bản đồ kho báu đã ghép xong!' : `Đã xoay ${s.moves} lần`, W/2, gy + ts*3 + 30, port ? 20 : 19, s.solvedT > 0 ? '#ffd23f' : '#fff'); }
function v53sQuizDraw(s, c){ const W = s.vw, H = s.vh, port = H > W, Q = s.qs[Math.min(2, s.qi)], fs = port ? 22 : 20, top = port ? Math.round(H*.236) : Math.round(H*.2); if(!Q) return;
  c.fillStyle = 'rgba(6,14,30,.72)'; const bw = Math.round(Math.min(W - 24, port ? W - 24 : W*.618 + 120)), bx = Math.round((W - bw)/2); v45pRound(c, bx, top - 10, bw, port ? H*.42 : H*.52, 16); c.fill();
  c.font = `800 ${fs}px Nunito, sans-serif`; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; const words = (`❓ Câu ${s.qi + 1}/3: ` + Q.q).split(' '); let line = '', ly = top + fs + 4;
  words.forEach(w => { const tt = line ? line + ' ' + w : w; if(c.measureText(tt).width > bw - 30){ c.fillText(line, W/2, ly); line = w; ly += fs + 6; } else line = tt; }); if(line) c.fillText(line, W/2, ly); c.textAlign = 'left';
  s.btn = []; const cols = port ? 1 : 2, gw = bw - 30, bh = port ? 54 : 48, gap = 10, w = (gw - gap*(cols - 1))/cols, y0 = ly + 18;
  Q.o.forEach((o, i) => { const b = {x:bx + 15 + (i % cols)*(w + gap), y:y0 + Math.floor(i/cols)*(bh + gap), w, h:bh, i}; s.btn.push(b);
    c.fillStyle = s.ans < 0 ? '#2a3b66' : o.ok ? '#2fbf71' : i === s.ans ? '#ef5350' : '#2a3b66'; v45pRound(c, b.x, b.y, b.w, b.h, 12); c.fill(); v53sTxt(c, ['🅰', '🅱', '©', 'Ⓓ'][i] + ' ' + o.t, b.x + b.w/2, b.y + bh/2 + 7, port ? 19 : 18, '#fff'); });
  v53sTxt(c, `✅ Đúng ${s.right} câu · cần 2`, W/2, y0 + (port ? 4 : 2)*(bh + gap) + 20, 18, '#a5d6a7'); }
function v53sPirInit(){}
