// ================= v50 · MINI GAME HỌC VIỆN: khung chung (tràn màn hình, thanh trên mỏng, ? / ✕, "Play again") + 4 trò đầu =================
// Pha chế thuốc (trộn màu RYB) · Bay chổi qua vòng · Đấu phép với hình nộm · Vẽ ký hiệu. Chỉ cảm ứng/chuột, có gợi ý vuốt.
const V50_GAMES = {};
const V50G = {cv:null, g:null, W:0, H:0, dpr:1, ptr:null, statT:0};
function v50Txt(g, s, x, y, size, col, al, wt){ g.font = (wt || 800) + ' ' + Math.max(16, Math.round(size)) + "px Nunito, 'Be Vietnam Pro', sans-serif"; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillStyle = col || '#fff'; g.fillText(s, x, y); }
function v50Pill(g, s, x, y, size, bg, col){ g.font = '800 ' + Math.max(16, Math.round(size)) + "px Nunito, sans-serif"; const w = g.measureText(s).width + size*1.4, h = size*2; g.fillStyle = bg || 'rgba(11,16,32,.72)'; v50RR(g, x - w/2, y - h/2, w, h, h/2); g.fill(); v50Txt(g, s, x, y + 1, size, col || '#fff'); return [x - w/2, y - h/2, w, h]; }
function v50In(b, x, y){ return b && x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]; }
// ---------- khung ----------
function v50GOpen(id){
  const def = V50_GAMES[id]; if(!def) return; v50Panel(null); v50ActBtn(null); const box = document.getElementById('v50G'); box.hidden = false; V50G.cv = document.getElementById('v50GCv'); V50G.g = V50G.cv.getContext('2d', {alpha:false});
  if(!V50G.bound){ V50G.bound = true; v50GInput(V50G.cv); document.getElementById('v50GX').onclick = () => v50GClose(); document.getElementById('v50GHelp').onclick = () => { const h = document.getElementById('v50GHow'); h.hidden = !h.hidden; if(V50.game) V50.game.pause = !h.hidden; }; }
  const G = V50.game = {id, def, mode:0, pause:false, end:false, t:0, score:0, hint:3.2, st:{}}; const L = box.querySelector('.v50gl'); L.innerHTML = '';
  (def.modes || []).forEach((m, i) => { const b = v50El('button', 'v50ib' + (i === 0 ? ' on' : ''), m[0]); b.type = 'button'; b.title = m[1]; b.setAttribute('aria-label', m[1]); b.onclick = () => { G.mode = i; L.querySelectorAll('button').forEach((x, k) => x.classList.toggle('on', k === i)); v50GStart(); }; L.appendChild(b); });
  const how = document.getElementById('v50GHow'); how.hidden = true; how.innerHTML = '<div class="v50card"><h2>' + def.icon + ' ' + v50Esc(def.name) + ' <small>' + v50Esc(def.en) + '</small></h2><ul class="v50how">' + def.help.map(s => '<li>' + s + '</li>').join('') + '</ul><button type="button" class="v50wide" id="v50HowOk">Đã hiểu ✓</button></div>';
  how.querySelector('#v50HowOk').onclick = () => { how.hidden = true; G.pause = false; };
  v50GResize(); v50GStart(); v50Snd('whoosh');
}
function v50GStart(){ const G = V50.game; if(!G) return; G.t = 0; G.score = 0; G.end = false; G.pause = false; G.hint = 3.2; G.st = {}; document.getElementById('v50GEnd').hidden = true; v50PClear(); v50BClear(); try { G.def.start(G); } catch(e){ console.warn('v50 start', e); } }
function v50GClose(silent){ const G = V50.game; V50.game = null; const b = document.getElementById('v50G'); if(b) b.hidden = true; v50PClear(); v50BClear(); V50W.near = null; V50W.lt = 0; }
function v50GResize(){ if(!V50G.cv) return; const dpr = Math.min(2, window.devicePixelRatio || 1); V50G.dpr = dpr; V50G.W = innerWidth; V50G.H = innerHeight; V50G.cv.width = Math.round(V50G.W*dpr); V50G.cv.height = Math.round(V50G.H*dpr); const G = V50.game; if(G && G.def.resize) G.def.resize(G); }
function v50GInput(cv){
  cv.style.touchAction = 'none'; const pos = e => [e.offsetX, e.offsetY];
  cv.addEventListener('pointerdown', e => { const G = V50.game; if(!G || G.pause || G.end) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(err){} V50G.ptr = e.pointerId; G.hint = Math.min(G.hint, .4); const [x, y] = pos(e); if(G.def.down) G.def.down(G, x, y); });
  cv.addEventListener('pointermove', e => { const G = V50.game; if(!G || G.pause || G.end) return; const [x, y] = pos(e); if(G.def.move) G.def.move(G, x, y, V50G.ptr === e.pointerId); });
  const up = e => { const G = V50.game; if(V50G.ptr !== e.pointerId) return; V50G.ptr = null; if(!G || G.pause || G.end) return; const [x, y] = pos(e); if(G.def.up) G.def.up(G, x, y); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
function v50GFrame(dt){
  const G = V50.game, g = V50G.g, W = V50G.W, H = V50G.H; g.setTransform(V50G.dpr, 0, 0, V50G.dpr, 0, 0); g.imageSmoothingEnabled = false;
  if(!G.pause && !G.end){ G.t += dt; try { G.def.update(G, dt); } catch(e){ console.warn('v50 upd', e); } }
  const sh = v50Shake(G.pause ? 0 : dt); g.save(); g.translate(sh[0], sh[1]); G.def.draw(G, g, W, H, G.pause ? 0 : dt); v50BDraw(g, G.pause ? 0 : dt); v50PDraw(g, G.pause ? 0 : dt); g.restore(); v50Flash(g, W, H, dt);
  if(G.hint > 0 && !G.end){ G.hint -= dt; g.globalAlpha = Math.min(1, G.hint); v50Pill(g, G.def.hint, W/2, H*.62, 16, 'rgba(11,16,32,.82)'); const tt = performance.now()/1000, gx = W/2 + (G.def.gest === 'circle' ? Math.cos(tt*4)*36 : G.def.gest === 'vert' ? 0 : Math.sin(tt*3)*46), gy = H*.62 + 50 + (G.def.gest === 'circle' ? Math.sin(tt*4)*20 : G.def.gest === 'vert' ? Math.sin(tt*3)*30 : 0); g.font = '30px sans-serif'; g.textAlign = 'center'; g.fillText('👆', gx, gy); g.globalAlpha = 1; }
  V50G.statT -= dt; if(V50G.statT <= 0){ V50G.statT = .25; const s = document.getElementById('v50GStat'), v = G.def.stat(G); if(s && s.textContent !== v) s.textContent = v; }
}
// kết thúc: thưởng + kỷ lục + bảng xếp hạng + "Play again"
function v50GEnd(G, score, perf, title, note){
  if(G.end) return; G.end = true; const r = v50Reward(G.id, perf, G.def.name), lb = v50LBAdd(G.id, score), stars = perf >= .85 ? 3 : perf >= .5 ? 2 : perf > .1 ? 1 : 0; v50Snd(stars >= 2 ? 'ok' : 'pop');
  const e = document.getElementById('v50GEnd'); e.innerHTML = '<div class="v50card v50end"><h2>' + (title || (stars >= 2 ? '🎉 Tuyệt vời!' : '👍 Cố lên nhé!')) + '</h2><div class="v50stars">' + '★'.repeat(stars) + '<span>' + '★'.repeat(3 - stars) + '</span></div>' +
    '<p class="v50big">' + Math.round(score) + ' điểm</p><p>+' + r.exp + ' EXP · +$' + r.money + (lb.rec ? ' · 🏆 Kỷ lục mới!' : ' · Kỷ lục: ' + lb.best) + '</p>' + (note ? '<p class="v50note">' + note + '</p>' : '') +
    '<h3>Bảng xếp hạng (máy này)</h3><ol class="v50lb">' + lb.top.map(x => '<li><b>' + v50Esc(x.n) + '</b><span>' + x.s + '</span></li>').join('') + '</ol><button type="button" class="v50wide v50again" id="v50Again">▶ Play again</button></div>';
  e.hidden = false; e.querySelector('#v50Again').onclick = () => v50GStart();
  if(stars >= 2) for(let i = 0; i < 3; i++) setTimeout(() => { if(V50.game === G) v50Burst(V50G.W*(.25 + i*.25), V50G.H*.3, V50_WANDS[11], true); }, i*220);
}
// nền chung: bầu trời theo chế độ
function v50GSky(g, W, H, night, k){ const gr = V50G['sky' + night + H]; let c = gr; if(!c){ c = V50G['sky' + night + H] = document.createElement('canvas'); c.width = 2; c.height = 256; const x = c.getContext('2d'), lg = x.createLinearGradient(0, 0, 0, 256);
  if(night){ lg.addColorStop(0, '#070b26'); lg.addColorStop(.7, '#1c2456'); lg.addColorStop(1, '#3a3f7a'); } else { lg.addColorStop(0, '#4a98f0'); lg.addColorStop(.7, '#a8d8ff'); lg.addColorStop(1, '#ffe2b0'); } x.fillStyle = lg; x.fillRect(0, 0, 2, 256); }
  g.drawImage(c, 0, 0, 2, 256, 0, 0, W, H); if(night){ const t = performance.now()/1000; g.fillStyle = '#fff'; for(let i = 0; i < 80; i++){ g.globalAlpha = .3 + .7*Math.abs(Math.sin(t + i)); g.fillRect((i*137.5 + (k || 0)*.1*(i % 3 + 1)) % W, (i*71.3) % (H*.7), i % 9 ? 1.5 : 2.5, i % 9 ? 1.5 : 2.5); } g.globalAlpha = 1; } }

// ================= 1. PHA CHẾ THUỐC (trộn màu theo bánh xe RYB của hoạ sĩ) =================
function v50Ryb(r, y, b){ // nội suy ba chiều Gossett–Chen: RYB → RGB
  const C = [[1, 1, 1], [1, 0, 0], [1, 1, 0], [.163, .373, .6], [1, .5, 0], [.5, 0, .5], [0, .66, .2], [.2, .094, 0]];
  const L = (a, b2, t) => a + (b2 - a)*t, out = [0, 0, 0]; for(let i = 0; i < 3; i++){ const x0 = L(C[0][i], C[1][i], r), x1 = L(C[3][i], C[5][i], r), x2 = L(C[2][i], C[4][i], r), x3 = L(C[6][i], C[7][i], r); out[i] = L(L(x0, x2, y), L(x1, x3, y), b); } return out; }
function v50Mix(d){ const m = Math.max(d[0], d[1], d[2]); if(!m && !d[3]) return [.42, .36, .5]; let c = m ? v50Ryb(d[0]/m, d[1]/m, d[2]/m) : [1, 1, 1]; const tot = d[0] + d[1] + d[2] + d[3], w = tot ? d[3]/tot : 0; return c.map(v => v + (1 - v)*w*.85); }
const v50Css = c => 'rgb(' + c.map(v => Math.round(Math.max(0, Math.min(1, v))*255)).join(',') + ')';
const V50_POT_NAMES = [[[1, 1, 0, 0], 'Cam', 'Đỏ + Vàng = Cam 🧡'], [[0, 1, 1, 0], 'Xanh lá', 'Vàng + Lam = Xanh lá 💚'], [[1, 0, 1, 0], 'Tím', 'Đỏ + Lam = Tím 💜'], [[1, 0, 0, 1], 'Hồng', 'Đỏ + Trắng = Hồng 🩷'], [[0, 0, 1, 1], 'Xanh nhạt', 'Lam + Trắng = Xanh da trời 🩵'],
  [[2, 1, 0, 0], 'Cam đỏ', '2 Đỏ + 1 Vàng = Cam đỏ'], [[0, 2, 1, 0], 'Vàng chanh', '2 Vàng + 1 Lam = Xanh vàng chanh'], [[1, 0, 2, 0], 'Tím than', '1 Đỏ + 2 Lam = Tím xanh'], [[1, 1, 1, 0], 'Nâu', 'Đỏ + Vàng + Lam = Nâu 🤎'], [[0, 1, 0, 1], 'Vàng kem', 'Vàng + Trắng = Vàng kem'], [[1, 2, 0, 1], 'Cam đào', 'Đỏ + 2 Vàng + Trắng = Cam đào 🍑']];
V50_GAMES.potion = {name:'Pha Chế Thuốc', en:'Potion Mixing', icon:'⚗️', modes:[['🟢', 'Dễ: 2 màu'], ['🔴', 'Khó: 3 màu + trắng']], hint:'Chạm lọ màu để nhỏ giọt · Vuốt vòng tròn trên vạc để khuấy', gest:'circle',
  help:['🎯 Nhìn <b>bình mẫu</b> ở góc trên: pha cho đúng màu đó.', '🧪 <b>Chạm</b> các lọ Đỏ, Vàng, Lam, Trắng để nhỏ từng giọt vào vạc.', '🌀 <b>Vuốt vòng tròn</b> trên vạc để khuấy và nấu thuốc.', '↺ Chạm nút ↺ để đổ vạc làm lại.', '🎨 Học trộn màu: Đỏ + Vàng = Cam, Vàng + Lam = Xanh lá, Đỏ + Lam = Tím.'],
  start(G){ const S = G.st; S.round = 0; S.res = []; this.next(G); },
  next(G){ const S = G.st; S.round++; S.d = [0, 0, 0, 0]; S.stir = 0; S.la = null; S.msg = null; S.rt = 30; const pool = G.mode ? V50_POT_NAMES : V50_POT_NAMES.slice(0, 5); const p = pool[Math.floor(Math.random()*pool.length)]; S.tg = p; S.tc = v50Mix(p[0]); S.cur = v50Mix(S.d); },
  geo(W, H){ if(W > H*1.25){ const cx = W/V50_PHI/V50_PHI + 40, cy = H*.56, cr = Math.min(H*.26, W*.2, 150), vw = Math.min(84, H*.22); // ngang: vạc bên trái (W/φ²), lọ 2×2 bên phải
      return {cx, cy, cr, vw, vx:i => W*.66 + (i % 2)*vw*1.25, vy:i => H*.48 + Math.floor(i/2)*vw*1.45, rb:[cx + cr + 10, cy - cr - 30, 52, 44]}; }
    const cx = W/2, cy = H/V50_PHI + 10, cr = Math.min(W*.3, H*.17, 150), vw = Math.min(92, W/4.6), vy0 = H - Math.min(110, H*.14); return {cx, cy, cr, vw, vx:i => W/2 + (i - 1.5)*vw*1.15, vy:() => vy0, rb:[cx + cr + 6, cy - cr - 40, 52, 44]}; },
  update(G, dt){ const S = G.st; if(S.msg){ S.msg.t -= dt; if(S.msg.t <= 0){ S.msg = null; if(S.round >= 5) return this.fin(G); this.next(G); } return; } S.rt -= dt; if(S.rt <= 0) this.brew(G);
    S.cur = S.cur.map((v, i) => v + (v50Mix(S.d)[i] - v)*Math.min(1, dt*3)); },
  brew(G){ const S = G.st, c = v50Mix(S.d), d = Math.hypot(c[0] - S.tc[0], c[1] - S.tc[1], c[2] - S.tc[2]), acc = S.d.some(x => x) ? Math.max(0, 1 - d/.55) : 0, pts = Math.round(acc*100); G.score += pts; S.res.push(acc);
    S.msg = {t:2.4, s:acc > .85 ? '🎉 Hoàn hảo! +' + pts : acc > .6 ? '👍 Gần đúng! +' + pts : '🤔 Chưa đúng màu +' + pts, f:S.tg[2]}; const geo = this.geo(V50G.W, V50G.H); v50Burst(geo.cx, geo.cy - 20, Object.assign({}, V50_WANDS[acc > .6 ? 11 : 6]), acc > .85); },
  fin(G){ const S = G.st, p = S.res.reduce((a, b) => a + b, 0)/S.res.length; v50GEnd(G, G.score, p, null, 'Em đã pha ' + S.res.filter(x => x > .6).length + '/5 bình thuốc đúng màu.'); },
  down(G, x, y){ const S = G.st, o = this.geo(V50G.W, V50G.H); if(S.msg) return; if(v50In(o.rb, x, y)){ S.d = [0, 0, 0, 0]; S.stir = 0; v50Snd('pop'); return; }
    for(let i = 0; i < 4; i++){ if(Math.abs(x - o.vx(i)) < o.vw/2 && y > o.vy(i) - o.vw*.9 && y < o.vy(i) + o.vw*.6){ if(S.d.reduce((a, b) => a + b, 0) >= 8) return; S.d[i]++; S.stir = 0; v50Snd('pop'); const col = ['#ef4b4b', '#ffd23f', '#3d7bff', '#ffffff'][i];
      for(let k = 0; k < 10; k++) v50P(o.vx(i), o.vy(i) - o.vw*.6, (o.cx - o.vx(i))*1.4 + (Math.random() - .5)*40, -Math.abs(o.vy(i) - o.cy)*1.6 - 120 - Math.random()*60, .7, 6, v50Glow(col), 600); return; } }
    if(Math.hypot(x - o.cx, y - o.cy) < o.cr*1.3) S.la = Math.atan2(y - o.cy, x - o.cx); },
  move(G, x, y, d){ const S = G.st, o = this.geo(V50G.W, V50G.H); if(!d || S.la == null || S.msg) return; const a = Math.atan2(y - o.cy, x - o.cx); let da = a - S.la; if(da > Math.PI) da -= 6.283; if(da < -Math.PI) da += 6.283; S.la = a; if(Math.hypot(x - o.cx, y - o.cy) > o.cr*1.6) return;
    S.stir += Math.abs(da); if(Math.random() < .5) v50P(x, y, 0, -20, .5, 5, v50Glow(v50Css(S.cur)), 0); if(S.stir > 6.283*1.5 && S.d.some(v => v)){ S.la = null; this.brew(G); } },
  up(G){ G.st.la = null; },
  draw(G, g, W, H, dt){ const S = G.st, o = this.geo(W, H), t = performance.now()/1000;
    if(!V50G.potBg || V50G.potBg.width !== Math.round(W)){ const c = V50G.potBg = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); const x = c.getContext('2d'); x.fillStyle = '#2a2436'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,.2)';
      for(let yy = 0; yy < H; yy += 22) for(let xx = (yy/22 % 2)*20; xx < W; xx += 40) x.fillRect(xx, yy, 38, 20); x.fillStyle = 'rgba(255,255,255,.04)'; for(let yy = 0; yy < H; yy += 22) x.fillRect(0, yy, W, 2);
      for(let k = 0; k < 2; k++){ const sy = 70 + k*H/V50_PHI/V50_PHI/1.4; x.fillStyle = '#5a3a22'; x.fillRect(0, sy, W, 8); for(let i = 0; i < W/34; i++){ const bc = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#b26bff', '#ff8a2b'][(i + k*2) % 6]; x.fillStyle = 'rgba(200,220,255,.35)'; x.fillRect(10 + i*34, sy - 26, 16, 26); x.fillStyle = bc; x.fillRect(12 + i*34, sy - 14, 12, 14); x.fillStyle = '#8a5a32'; x.fillRect(14 + i*34, sy - 32, 8, 6); } } }
    g.drawImage(V50G.potBg, 0, 0, W, H);
    // lửa dưới vạc
    for(let k = 0; k < 5; k++){ const fx = o.cx - o.cr*.6 + k*o.cr*.3, f = .7 + .3*Math.sin(t*10 + k*2); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .8; g.drawImage(v50Glow('#ff7a1a'), fx - 22*f, o.cy + o.cr*.75 - 26*f, 44*f, 44*f); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // vạc
    g.fillStyle = '#1a1a22'; g.beginPath(); g.ellipse(o.cx, o.cy + o.cr*.25, o.cr, o.cr*.82, 0, 0, Math.PI); g.lineTo(o.cx - o.cr, o.cy); g.fill(); g.fillStyle = '#2c2c38'; g.beginPath(); g.ellipse(o.cx, o.cy, o.cr*1.05, o.cr*.32, 0, 0, 7); g.fill();
    g.fillStyle = v50Css(S.cur); g.beginPath(); g.ellipse(o.cx, o.cy + 2, o.cr*.92, o.cr*.26, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; for(let k = 0; k < 6; k++){ const bx = o.cx + Math.sin(t*1.7 + k*2)*o.cr*.6, by = o.cy + Math.cos(t*2.1 + k)*o.cr*.1, br = 3 + (k % 3)*2 + Math.sin(t*4 + k)*1.5; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill(); }
    if(S.la != null) { g.save(); g.translate(o.cx, o.cy); g.rotate(t*3); g.fillStyle = '#8a5a32'; g.fillRect(o.cr*.3, -4, o.cr*.5, 8); g.restore(); }
    // nút đổ lại
    g.fillStyle = 'rgba(11,16,32,.7)'; v50RR(g, o.rb[0], o.rb[1], o.rb[2], o.rb[3], 12); g.fill(); v50Txt(g, '↺', o.rb[0] + o.rb[2]/2, o.rb[1] + o.rb[3]/2, 22);
    // bình mẫu (góc trên phải) – rộng theo φ
    const fx = W - Math.min(110, W*.24), fy = 84, fr = Math.min(36, W*.08); g.fillStyle = 'rgba(11,16,32,.7)'; v50RR(g, fx - fr - 16, fy - fr - 12, fr*2 + 32, fr*2*V50_PHI + 16, 16); g.fill();
    g.fillStyle = 'rgba(220,235,255,.5)'; g.beginPath(); g.arc(fx, fy + fr*.9, fr, 0, 7); g.fill(); g.fillRect(fx - fr*.3, fy - fr*.6, fr*.6, fr*.9); g.fillStyle = v50Css(S.tc); g.beginPath(); g.arc(fx, fy + fr*.9, fr - 4, 0, 7); g.fill(); g.fillStyle = '#8a5a32'; g.fillRect(fx - fr*.35, fy - fr*.8, fr*.7, fr*.3);
    v50Txt(g, 'Mẫu: ' + S.tg[1], fx, fy + fr*2.3, 16, '#ffe9a8');
    // lọ màu
    ['Đỏ', 'Vàng', 'Lam', 'Trắng'].forEach((n, i) => { const x = o.vx(i), y = o.vy(i), w = o.vw*.62, col = ['#ef4b4b', '#ffd23f', '#3d7bff', '#f4f4f4'][i]; g.fillStyle = 'rgba(220,235,255,.45)'; v50RR(g, x - w/2, y - w*1.1, w, w*1.3, 8); g.fill(); g.fillStyle = col; v50RR(g, x - w/2 + 4, y - w*.6, w - 8, w*.76, 6); g.fill(); g.fillStyle = '#8a5a32'; g.fillRect(x - w*.22, y - w*1.28, w*.44, w*.22);
      v50Txt(g, n + (S.d[i] ? ' ×' + S.d[i] : ''), x, y + w*.55, 16, '#fff'); });
    v50Txt(g, 'Khuấy: ' + Math.min(100, Math.round(S.stir/(6.283*1.5)*100)) + '%', o.cx, o.cy - o.cr*.62, 16, '#ffe9a8');
    if(S.msg){ v50Pill(g, S.msg.s, W/2, H*.3, 20, 'rgba(11,16,32,.85)', '#ffe9a8'); v50Pill(g, S.msg.f, W/2, H*.3 + 50, 16, 'rgba(47,191,113,.85)'); } },
  stat(G){ const S = G.st; return '⚗️ Bình ' + Math.min(5, S.round) + '/5 · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.rt || 0)) + 's'; }};

// ================= 2. BAY CHỔI QUA VÒNG (chậm, mượt, có quán tính) =================
V50_GAMES.broom = {name:'Bay Chổi Qua Vòng', en:'Broom Flight', icon:'🧹', modes:[['☀️', 'Bay ban ngày'], ['🌙', 'Bay ban đêm']], hint:'Kéo ngón tay lên xuống để lái chổi', gest:'vert',
  help:['👆 <b>Kéo ngón tay</b> lên/xuống ở bất kỳ đâu: chổi bay theo nhẹ nhàng.', '⭕ Bay xuyên qua tâm vòng màu để ghi điểm (giữa tâm được thêm điểm).', '⭐ Nhặt sao để cộng thêm.', '⏱ 60 giây. Bay chậm rãi, không có chướng ngại nguy hiểm.'],
  start(G){ const S = G.st; S.y = V50G.H*.5; S.ty = S.y; S.vy = 0; S.rings = []; S.stars = []; S.sp = 0; S.dist = 0; S.pass = 0; S.tot = 0; S.combo = 0; S.left = 60; },
  update(G, dt){ const S = G.st, W = V50G.W, H = V50G.H, px = W*.28, v = Math.max(140, W*.22); S.left -= dt; if(S.left <= 0){ return v50GEnd(G, G.score, S.tot ? S.pass/S.tot : 0, null, 'Qua ' + S.pass + '/' + S.tot + ' vòng.'); }
    S.vy += ((S.ty - S.y)*4 - S.vy*2.6)*dt; S.y += S.vy*dt; S.y = Math.max(60, Math.min(H - 40, S.y)); S.dist += v*dt; S.sp -= dt;
    if(S.sp <= 0){ S.sp = 2.2; const r = Math.max(36, H*.075); S.rings.push({x:W + 60, y:H*.22 + Math.random()*H*.6, r, c:V50_RUBIK[Math.floor(Math.random()*6)], done:false}); if(Math.random() < .6) S.stars.push({x:W + 60 + v*1.1, y:H*.2 + Math.random()*H*.6, got:false}); }
    S.rings.forEach(o => { o.x -= v*dt; if(!o.done && o.x < px){ o.done = true; S.tot++; const d = Math.abs(S.y - o.y); if(d < o.r*.78){ S.pass++; S.combo++; const pts = 10 + (d < o.r*.3 ? 5 : 0) + Math.min(10, S.combo*2); G.score += pts; v50Snd('ok'); for(let k = 0; k < 18; k++){ const a = k/18*6.28; v50P(o.x, o.y, Math.cos(a)*120, Math.sin(a)*120, .6, 7, v50Shape('star', o.c), 0); } } else S.combo = 0; } });
    S.stars.forEach(s => { s.x -= v*dt; if(!s.got && Math.hypot(s.x - px, s.y - S.y) < 34){ s.got = true; G.score += 5; v50Snd('pop'); for(let k = 0; k < 8; k++) v50P(s.x, s.y, (Math.random() - .5)*160, (Math.random() - .5)*160, .5, 6, v50Glow('#ffe066'), 0); } });
    S.rings = S.rings.filter(o => o.x > -80); S.stars = S.stars.filter(s => s.x > -40 && !s.got);
    if(Math.random() < .6*V50.q) v50P(px - 30, S.y + 6, -80 - Math.random()*40, (Math.random() - .5)*20, .6, 5, v50Glow(G.mode ? '#9fb2ff' : '#fff3b0'), 0); },
  down(G, x, y){ G.st.ty = y; }, move(G, x, y, d){ if(d) G.st.ty = y; },
  draw(G, g, W, H){ const S = G.st, night = G.mode === 1, t = performance.now()/1000; v50GSky(g, W, H, night, S.dist);
    const mt = v50Mountains(); g.globalAlpha = .9; const mw = mt.width*(H*.55/mt.height); g.drawImage(mt, -((S.dist*.15) % mw), H*.45, mw, H*.55); g.drawImage(mt, mw - ((S.dist*.15) % mw), H*.45, mw, H*.55); g.globalAlpha = 1;
    const cl = v50CloudImg(); g.globalAlpha = night ? .3 : .85; for(let i = 0; i < 5; i++){ const x = W - ((S.dist*(.3 + i*.08) + i*300) % (W + 200)); g.drawImage(cl, x, 40 + i*H*.12, 140, 52); } g.globalAlpha = 1;
    S.rings.forEach(o => { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 10; g.beginPath(); g.ellipse(o.x + 3, o.y + 3, o.r*.45, o.r, 0, 0, 7); g.stroke(); g.strokeStyle = o.done ? 'rgba(255,255,255,.4)' : o.c; g.lineWidth = 8; g.beginPath(); g.ellipse(o.x, o.y, o.r*.45, o.r, 0, 0, 7); g.stroke();
      if(night){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35; g.drawImage(v50Glow(o.c), o.x - o.r, o.y - o.r*1.2, o.r*2, o.r*2.4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
    S.stars.forEach(s => { g.drawImage(v50Shape('star', '#ffd23f'), s.x - 12, s.y - 12 + Math.sin(t*4 + s.x)*3, 24, 24); });
    // chổi + người cưỡi (áo choàng)
    const px = W*.28, py = S.y, tilt = Math.max(-.4, Math.min(.4, S.vy/400)); g.save(); g.translate(px, py); g.rotate(tilt); g.scale(2, 2); g.fillStyle = '#8a5a32'; g.fillRect(-20, -1, 34, 3); g.fillStyle = '#d8b86a'; g.beginPath(); g.moveTo(-20, -4); g.lineTo(-32, -6); g.lineTo(-32, 7); g.lineTo(-20, 4); g.fill();
    v50MeLook(); v50Person(g, 0, 1, Object.assign({}, V50W.me, {moving:false, dir:1}), t); g.restore(); },
  stat(G){ const S = G.st; return '🧹 ' + S.pass + '/' + S.tot + ' vòng · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.left)) + 's'; }};

// ================= 3. ĐẤU PHÉP VỚI HÌNH NỘM LUYỆN TẬP (lửa / nước / băng) =================
const V50_EL = [{ic:'🔥', vi:'Lửa', w:1, beats:2}, {ic:'💧', vi:'Nước', w:6, beats:0}, {ic:'❄️', vi:'Băng', w:2, beats:1}];   // beats: phá được khiên loại nào
V50_GAMES.duel = {name:'Đấu Phép Hình Nộm', en:'Training Duel', icon:'🎯', modes:[['🟢', 'Dễ'], ['🔴', 'Khó: bia di chuyển']], hint:'Chọn phép bên dưới rồi chạm vào hình nộm', gest:'tap',
  help:['🎯 Hình nộm rơm và bia gỗ đeo <b>khiên</b>: 🔥, 💧 hoặc ❄️.', '🪄 Chọn phép ở dưới rồi <b>chạm</b> mục tiêu để phóng.', '🧠 Luật: <b>🔥 Lửa</b> làm tan ❄️ Băng · <b>💧 Nước</b> dập 🔥 Lửa · <b>❄️ Băng</b> đóng băng 💧 Nước.', '✅ Đúng phép: vỡ khiên, cộng điểm. Sai: phép bật ra lấp lánh, thử lại!', '💛 Chỉ luyện với hình nộm – không bao giờ phóng phép vào người hay con vật.'],
  start(G){ const S = G.st; S.sel = 0; S.tg = []; S.sp = .5; S.left = 45; S.ok = 0; S.bad = 0; S.msg = null; },
  btn(W, H, i){ const bw = Math.min(110, W/3.6), y = H - bw*.62 - 14; return [W/2 + (i - 1)*(bw + 12) - bw/2, y - bw*.31, bw, bw*.62]; },
  update(G, dt){ const S = G.st, W = V50G.W, H = V50G.H; S.left -= dt; if(S.left <= 0) return v50GEnd(G, G.score, Math.min(1, S.ok/(G.mode ? 22 : 16)), null, 'Phá ' + S.ok + ' khiên · ' + S.bad + ' lần chọn nhầm phép.');
    S.sp -= dt; if(S.sp <= 0 && S.tg.length < 3){ S.sp = G.mode ? 1.1 : 1.8; const slots = [.22, .5, .78], used = S.tg.map(o => o.slot); const free = [0, 1, 2].filter(i => !used.includes(i)); if(free.length){ const sl = free[Math.floor(Math.random()*free.length)];
      S.tg.push({slot:sl, x:W*slots[sl], y:H*(.36 + Math.random()*.16), bx:W*slots[sl], el:Math.floor(Math.random()*3), kind:Math.random() < .5 ? 'dummy' : 'disc', wob:0, life:G.mode ? 5 : 7, dead:0, ph:Math.random()*6}); } }
    S.tg.forEach(o => { o.life -= dt; o.wob *= Math.pow(.03, dt); if(G.mode && o.kind === 'disc' && !o.dead) o.x = o.bx + Math.sin(G.t*1.6 + o.ph)*W*.08; if(o.dead) o.dead += dt; });
    S.tg = S.tg.filter(o => o.life > 0 && o.dead < .8); if(S.msg){ S.msg.t -= dt; if(S.msg.t <= 0) S.msg = null; } },
  down(G, x, y){ const S = G.st, W = V50G.W, H = V50G.H; for(let i = 0; i < 3; i++) if(v50In(this.btn(W, H, i), x, y)){ S.sel = i; v50Snd('pop'); return; }
    const o = S.tg.find(o => !o.dead && Math.hypot(x - o.x, y - (o.y - 30)) < 56); const sx = W/2, sy = H - Math.min(110, W/3.6) - 40, el = V50_EL[S.sel];
    if(!o){ v50Cast(sx, sy, x, y, el.w); return; }
    v50Cast(sx, sy, o.x, o.y - 30, el.w, () => { if(o.dead) return; if(el.beats === o.el){ o.dead = .01; o.wob = 1; S.ok++; G.score += 10 + Math.round(o.life*2); v50Snd('ok'); S.msg = {t:1, s:'✅ ' + el.vi + ' thắng ' + V50_EL[o.el].vi + '!'}; }
      else { o.wob = .6; S.bad++; v50Snd('bad'); S.msg = {t:1.4, s:'✨ Phép bật ra! ' + V50_EL[V50_EL.findIndex(e => e.beats === o.el)].ic + ' mới phá được ' + V50_EL[o.el].ic}; } }); },
  draw(G, g, W, H){ const S = G.st, t = performance.now()/1000;
    if(!V50G.duelBg || V50G.duelBg.width !== Math.round(W) || V50G.duelBg.height !== Math.round(H)){ const c = V50G.duelBg = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); const x = c.getContext('2d'); const hz = H/V50_PHI/V50_PHI;
      const lg = x.createLinearGradient(0, 0, 0, hz); lg.addColorStop(0, '#6aa8e8'); lg.addColorStop(1, '#d0e8ff'); x.fillStyle = lg; x.fillRect(0, 0, W, hz); x.drawImage(v50Mountains(), 0, 120, 2400, 300, 0, hz - H*.2, W*2.2, H*.2);
      x.fillStyle = '#8e94a8'; x.fillRect(0, hz - 30, W, 34); x.fillStyle = '#aeb2c2'; for(let i = 0; i < W; i += 22) x.fillRect(i, hz - 42, 12, 12); x.fillStyle = '#d6ccb0'; x.fillRect(0, hz, W, H - hz);
      x.fillStyle = 'rgba(120,100,70,.25)'; x.beginPath(); x.ellipse(W/2, H*.62, W*.46, H*.2, 0, 0, 7); x.fill(); for(let k = 0; k < 6; k++){ x.fillStyle = V50_RUBIK[k]; x.globalAlpha = .3; const a = k/6*6.283; x.beginPath(); x.moveTo(W/2, H*.62); x.lineTo(W/2 + Math.cos(a - .2)*W*.42, H*.62 + Math.sin(a - .2)*H*.18); x.lineTo(W/2 + Math.cos(a + .2)*W*.42, H*.62 + Math.sin(a + .2)*H*.18); x.fill(); } x.globalAlpha = 1; }
    g.drawImage(V50G.duelBg, 0, 0, W, H); v50Pill(g, '🔥 > ❄️ · 💧 > 🔥 · ❄️ > 💧', W/2, 70, 16);
    S.tg.forEach(o => { g.save(); g.translate(o.x, o.y); g.globalAlpha = o.dead ? Math.max(0, 1 - o.dead/.8) : Math.min(1, o.life*2); g.rotate(Math.sin(t*24)*o.wob*.3 + (o.dead ? o.dead*2 : 0)); g.scale(2.2, 2.2);
      if(o.kind === 'dummy') v50Dummy(g, {x:0, y:0, wob:0}, t); else { g.fillStyle = '#6b4a2a'; g.fillRect(-1.5, -14, 3, 14); g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(0, -24, 11, 0, 7); g.fill(); g.fillStyle = '#ef4b4b'; g.beginPath(); g.arc(0, -24, 7.5, 0, 7); g.fill(); g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(0, -24, 4, 0, 7); g.fill(); }
      g.restore(); if(!o.dead){ const col = ['#ff7a1a', '#3da5ff', '#7fe3ff'][o.el]; g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5 + .2*Math.sin(t*5); g.drawImage(v50Glow(col), o.x - 46, o.y - 86, 92, 92); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(o.x, o.y - 40, 36, 0, 7); g.stroke(); v50Pill(g, V50_EL[o.el].ic, o.x, o.y - 96, 16, 'rgba(11,16,32,.75)'); } });
    for(let i = 0; i < 3; i++){ const b = this.btn(W, H, i), e = V50_EL[i]; g.fillStyle = S.sel === i ? '#ffd23f' : 'rgba(11,16,32,.78)'; v50RR(g, b[0], b[1], b[2], b[3], 16); g.fill(); v50Txt(g, e.ic + ' ' + e.vi, b[0] + b[2]/2, b[1] + b[3]/2, 17, S.sel === i ? '#1a1430' : '#fff'); }
    if(S.msg) v50Pill(g, S.msg.s, W/2, H*.24, 17, 'rgba(11,16,32,.85)', '#ffe9a8'); },
  stat(G){ const S = G.st; return '🎯 ' + S.ok + ' khiên · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.left)) + 's'; }};

// ================= 4. VẼ KÝ HIỆU BẰNG NGÓN TAY (nhận dạng hình bằng so khớp điểm) =================
function v50Resample(pts, n){ let D = 0; for(let i = 1; i < pts.length; i++) D += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); const I = D/(n - 1); if(!I) return null; const out = [pts[0].slice()]; let acc = 0, P = pts.map(p => p.slice());
  for(let i = 1; i < P.length; i++){ const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if(acc + d >= I){ const k = (I - acc)/d, q = [P[i - 1][0] + k*(P[i][0] - P[i - 1][0]), P[i - 1][1] + k*(P[i][1] - P[i - 1][1])]; out.push(q); P.splice(i, 0, q); acc = 0; } else acc += d; }
  while(out.length < n) out.push(P[P.length - 1].slice()); out.length = n; return out; }
function v50Norm(pts){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, cx = 0, cy = 0; pts.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length; const s = Math.max(x1 - x0, y1 - y0) || 1; return pts.map(p => [(p[0] - cx)/s, (p[1] - cy)/s]); }
function v50Shapes(){ if(V50G.shapes) return V50G.shapes; const C = (n, f) => Array.from({length:n}, (_, i) => f(i/(n - 1))), poly = (P) => { const out = []; for(let i = 0; i < P.length - 1; i++) for(let k = 0; k < 12; k++){ const u = k/12; out.push([P[i][0] + (P[i + 1][0] - P[i][0])*u, P[i][1] + (P[i + 1][1] - P[i][1])*u]); } out.push(P[P.length - 1]); return out; };
  const star = []; for(let k = 0; k <= 5; k++){ const a = -Math.PI/2 + k*4*Math.PI/5; star.push([Math.cos(a), Math.sin(a)]); }
  V50G.shapes = [
    {vi:'Hình tròn', sp:'Vòng Bảo Vệ', en:'Shield Circle', w:9, closed:true, pts:C(64, u => [Math.cos(u*6.283 - Math.PI/2), Math.sin(u*6.283 - Math.PI/2)])},
    {vi:'Tam giác', sp:'Lửa Trại Ấm', en:'Campfire', w:1, closed:true, pts:poly([[0, -1], [.9, .7], [-.9, .7], [0, -1]])},
    {vi:'Hình vuông', sp:'Tường Đá Che Mưa', en:'Stone Wall', w:0, closed:true, pts:poly([[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]])},
    {vi:'Tia chớp', sp:'Sấm Tím', en:'Storm Zigzag', w:4, closed:false, pts:poly([[-.6, -1], [.5, -.25], [-.5, .25], [.6, 1]])},
    {vi:'Ngôi sao 5 cánh', sp:'Sao Sáng Dẫn Đường', en:'Guiding Star', w:5, closed:true, pts:poly(star)},
    {vi:'Xoắn ốc', sp:'Gió Xoáy Nhẹ', en:'Gentle Whirl', w:10, closed:false, tol:.32, pts:C(64, u => [Math.cos(u*12.566)*u, Math.sin(u*12.566)*u])}
  ]; V50G.shapes.forEach(s => { s.n = v50Norm(v50Resample(s.pts, 48)); }); return V50G.shapes; }
function v50Dist(a, sh){ const b = sh.n, n = a.length, step = sh.closed ? 3 : n; let best = 1e9;
  [a, a.slice().reverse()].forEach(arr => { for(let o = 0; o < n; o += step){ let d = 0; for(let i = 0; i < n; i++){ const p = arr[(i + o) % n]; d += Math.hypot(p[0] - b[i][0], p[1] - b[i][1]); } best = Math.min(best, d/n); } }); return best; }
// điểm 0–1: gần mẫu thì cao; nếu nét giống một hình KHÁC hơn thì bị trừ mạnh
function v50Score(stroke, sh){ const r = v50Resample(stroke, 48); if(!r) return 0; const a = v50Norm(r), d = v50Dist(a, sh), other = v50Shapes().some(o => o !== sh && v50Dist(a, o) < d);
  const base = Math.max(0, Math.min(1, 1 - (d - .04)/(sh.tol || .16))); return other ? base*.35 : base; }
V50_GAMES.sigil = {name:'Vẽ Ký Hiệu Phép', en:'Sigil Drawing', icon:'✍️', modes:[['👁', 'Có nét mờ gợi ý'], ['🙈', 'Không gợi ý']], hint:'Vẽ theo nét mờ bằng một ngón tay', gest:'circle',
  help:['✍️ Nhìn <b>tên hình</b> ở trên (tròn, tam giác, vuông, tia chớp, ngôi sao, xoắn ốc).', '👆 <b>Vẽ một nét liền</b> bằng ngón tay, nhấc tay ra là xong.', '✨ Vẽ càng giống, phép càng đẹp và điểm càng cao.', '🙈 Chế độ khó: không có nét mờ gợi ý.'],
  start(G){ const S = G.st; S.round = 0; S.res = []; S.order = v50Shapes().map((s, i) => i).sort(() => Math.random() - .5); this.next(G); },
  next(G){ const S = G.st; S.round++; S.cur = v50Shapes()[S.order[(S.round - 1) % 6]]; S.stroke = []; S.msg = null; S.rt = 20; },
  box(W, H){ const s = Math.min(W*.78, H*.5); return [W/2, H/V50_PHI - 20, s/2]; },
  update(G, dt){ const S = G.st; if(S.msg){ S.msg.t -= dt; if(S.msg.t <= 0){ if(S.round >= 6) return v50GEnd(G, G.score, S.res.reduce((a, b) => a + b, 0)/S.res.length, null, 'Em đã vẽ ' + S.res.filter(x => x >= .55).length + '/6 ký hiệu thành phép.'); this.next(G); } return; } S.rt -= dt; if(S.rt <= 0) this.judge(G); },
  judge(G){ const S = G.st, acc = S.stroke.length > 8 ? v50Score(S.stroke, S.cur) : 0, pts = Math.round(acc*100); G.score += pts; S.res.push(acc); const [cx, cy] = this.box(V50G.W, V50G.H);
    if(acc >= .55){ v50Burst(cx, cy, V50_WANDS[S.cur.w], acc > .8); S.msg = {t:2.2, s:'✨ ' + S.cur.sp + '! +' + pts}; } else S.msg = {t:2, s:'🤔 Chưa giống lắm +' + pts + ' · thử nét to, liền hơn'}; S.stroke = []; },
  down(G, x, y){ if(G.st.msg) return; G.st.stroke = [[x, y]]; }, move(G, x, y, d){ const S = G.st; if(!d || S.msg || !S.stroke.length) return; const l = S.stroke[S.stroke.length - 1]; if(Math.hypot(x - l[0], y - l[1]) > 3){ S.stroke.push([x, y]); if(S.stroke.length % 3 === 0) v50P(x, y, 0, -10, .5, 6, v50Glow(V50_WANDS[S.cur.w].c), 0); } },
  up(G){ const S = G.st; if(S.msg || S.stroke.length < 8) { S.stroke = []; return; } this.judge(G); },
  draw(G, g, W, H){ const S = G.st, t = performance.now()/1000, [cx, cy, r] = this.box(W, H);
    if(!V50G.sigBg || V50G.sigBg.width !== Math.round(W)){ const c = V50G.sigBg = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); const x = c.getContext('2d'); const lg = x.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, '#1c2456'); lg.addColorStop(1, '#3a7fc0'); x.fillStyle = lg; x.fillRect(0, 0, W, H);
      x.fillStyle = '#4fae4f'; x.fillRect(0, H*.82, W, H*.18); for(let k = 0; k < 7; k++){ const a = k/7*6.283, sx = W/2 + Math.cos(a)*W*.42, sy = H*.86 + Math.sin(a)*H*.05; x.fillStyle = '#8a8698'; x.fillRect(sx - 10, sy - 50, 20, 50); x.fillStyle = V50_RUBIK[k % 6]; x.fillRect(sx - 4, sy - 36, 8, 8); } }
    g.drawImage(V50G.sigBg, 0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.arc(cx, cy, r*1.15, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,233,168,.35)'; g.lineWidth = 2; g.stroke();
    if(S.cur && G.mode === 0 && !S.msg){ g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); S.cur.pts.forEach((p, i) => { const X = cx + p[0]*r*.82, Y = cy + p[1]*r*.82; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); g.setLineDash([]); }
    if(S.stroke.length > 1){ const col = V50_WANDS[S.cur.w].c; g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = .45; g.beginPath(); S.stroke.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.globalCompositeOperation = 'source-over'; }
    if(S.cur) v50Pill(g, '✍️ Vẽ: ' + S.cur.vi + ' → ' + S.cur.sp, W/2, cy - r*1.15 - 30, 17, 'rgba(11,16,32,.8)', '#ffe9a8');
    if(S.msg) v50Pill(g, S.msg.s, W/2, cy + r*1.15 + 34, 17, 'rgba(11,16,32,.85)', '#ffe9a8'); },
  stat(G){ const S = G.st; return '✍️ ' + Math.min(6, S.round) + '/6 · ★ ' + G.score + ' · ⏱ ' + Math.max(0, Math.ceil(S.rt || 0)) + 's'; }};
