// ================= v51p · MÁY BAY 3/3: mini game bay, Hangar, bảng hướng dẫn, nút cột + menu, khởi động =================
const V51P_GAMES = [
  {id:'rings', ic:'⭕', vi:'Vòng số', en:'Number Rings', desc:'Bay xuyên qua vòng có đáp án đúng của phép tính.'},
  {id:'mail',  ic:'📦', vi:'Giao bưu phẩm', en:'Air Mail', desc:'Bay thấp qua vòng đích để thả bưu phẩm tới các đảo và khu.'},
  {id:'sky',   ic:'☁️', vi:'Viết chữ bằng khói', en:'Sky Writing', desc:'Bay qua các chấm để viết một chữ cái bằng khói trên trời.'},
  {id:'race',  ic:'🏁', vi:'Bay đua giờ', en:'Air Race', desc:'Bay qua 8 cột mốc quanh đảo nhanh nhất có thể.'}
];
const V51P_LETTERS = {
  O:(() => { const a = []; for(let i = 0; i <= 16; i++){ const t = i/16*Math.PI*2 - Math.PI/2; a.push([.5 + Math.cos(t)*.5, .5 + Math.sin(t)*.5]); } return a; })(),
  L:[[0, 0], [0, 1], [.68, 1]], V:[[0, 0], [.5, 1], [1, 0]], Z:[[0, 0], [1, 0], [0, 1], [1, 1]], N:[[0, 1], [0, 0], [.8, 1], [.8, 0]],
  C:(() => { const a = []; for(let i = 0; i <= 12; i++){ const t = -Math.PI*.25 - i/12*Math.PI*1.5; a.push([.55 + Math.cos(t)*.5, .5 + Math.sin(t)*.5]); } return a; })()
};
const v51pRnd = (a, b) => a + Math.floor(Math.random()*(b - a + 1));
function v51pMgStartPos(){ const C = v51pC(), A = V51P_AP; return [C[0] + A.rx0 - 200, C[1] + A.ry - 300, 0, 300]; }
function v51pMgStart(id){
  const g = V51P_GAMES.find(q => q.id === id); if(!g) return; v51pPanel(null);
  const sp = v51pMgStartPos();
  if(!V51P.on){ if(!v51pBoard(v51pState().sel, sp)) return; }
  else { const P = V51P.P; P.x = sp[0]; P.y = sp[1]; P.hdg = 0; P.alt = sp[3]; P.vs = 0; P.spd = P.pl.hover ? 80 : P.pl.vmax*.65; P.ground = false; P.tOff = realT - 30; V51P.thr = .6; }
  V51P.smoke.length = 0;
  const C = v51pC(), m = V51P.mg = {id, t:0, cd:3, score:0, done:false, hud:0};
  if(id === 'rings'){ m.N = 6; m.i = 0; m.ok = 0; m.gates = [];
    for(let i = 0; i < m.N; i++){ const x = C[0] - 100 + i*720, y = C[1] + 4300 + Math.sin(i*1.3)*420, alt = 220 + (i % 3)*110, a = v51pRnd(2, 9), b = v51pRnd(2, 9), add = i % 2 === 1, ans = add ? a + b + 10 : a*b;
      let wrong = ans + (Math.random() < .5 ? -1 : 1)*v51pRnd(1, add ? 5 : a); if(wrong === ans || wrong < 1) wrong = ans + 2; const left = Math.random() < .5;
      m.gates.push({x, y, alt, q:(add ? (a + 10) + ' + ' + b : a + ' × ' + b) + ' = ?', ans, R:[{x, y:y - 170, v:left ? ans : wrong}, {x, y:y + 170, v:left ? wrong : ans}], near:false}); }
    m.tl = 150;
  } else if(id === 'mail'){
    const T = V51P_ISL.filter(s => !s.magic).map(s => { const p = v51pIslPos(s); return {x:p[0], y:p[1] - 40, n:s.ic + ' ' + s.vi, fact:s.fact}; });
    [['library', '📚 Thư viện'], ['farm', '🐄 Nông trại'], ['stadium', '🏟️ Sân vận động'], ['art', '🎨 Khu nghệ thuật'], ['pool', '🏊 Hồ bơi']].forEach(([z, n]) => { const Z = V46.ZI[z]; if(Z) T.push({x:(Z.nr.x0 + Z.nr.x1)/2, y:(Z.nr.y0 + Z.nr.y1)/2, n, fact:'📦 Đã giao bưu phẩm tới ' + n + '! Cảm ơn bác phi công nhí.'}); });
    for(let i = T.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [T[i], T[j]] = [T[j], T[i]]; }
    m.T = [T.find(q => /Đảo/.test(q.n)) || T[0]].concat(T.filter(q => !/Đảo/.test(q.n)).slice(0, 2)); m.i = 0; m.drops = []; m.tl = 240;
  } else if(id === 'sky'){
    const keys = Object.keys(V51P_LETTERS), L = keys[Math.floor(Math.random()*keys.length)], S0 = 760, ox = C[0] + 900, oy = C[1] + 3200, pts = V51P_LETTERS[L], dots = [];
    for(let i = 1; i < pts.length; i++){ const a = pts[i - 1], b = pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1])*S0, n = Math.max(1, Math.round(len/95)); for(let k = (i === 1 ? 0 : 1); k <= n; k++){ const t = k/n; dots.push({x:ox + (a[0] + (b[0] - a[0])*t)*S0, y:oy + (a[1] + (b[1] - a[1])*t)*S0, hit:false}); } }
    m.L = L; m.dots = dots; m.hit = 0; m.tl = 90; m.ox = ox; m.oy = oy; m.S = S0;
    const P = V51P.P; P.x = ox - 500; P.y = oy + S0*.5 + 600*.22; P.alt = 600; P.hdg = 0;
  } else if(id === 'race'){
    m.N = 8; m.i = 0; m.G = []; for(let i = 0; i < m.N; i++){ const a = Math.PI/2 - .55 - i*(Math.PI*2/m.N), r = 3700; m.G.push({x:C[0] + Math.cos(a)*r, y:C[1] + Math.sin(a)*r, alt:260 + (i % 2)*140}); }
    m.G.push({x:C[0] + V51P_AP.rx0 + 200, y:C[1] + V51P_AP.ry - 400, alt:280}); m.N = m.G.length; let d = 0, px = sp[0], py = sp[1]; m.G.forEach(q => { d += Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y; }); m.par = d/(V51P.P.pl.vmax*.92); m.tl = 0;
  }
  v51pMsg(g.ic + ' ' + g.vi + ': ' + g.desc, 4.5); v51pMgHud(true);
}
function v51pMgTick(dt){
  const m = V51P.mg, P = V51P.P; if(!m || !P) return;
  if(m.cd > 0){ const c0 = Math.ceil(m.cd); m.cd -= dt; const c1 = Math.ceil(m.cd); if(c1 !== c0) v51pBeep(c1 > 0 ? 'ring' : 'up'); v51pMgHud(); return; }
  if(m.done) return; m.t += dt; if(m.tl && m.t >= m.tl){ v51pMgFinish(); return; }
  if(m.id === 'rings'){ const g = m.gates[m.i]; if(!g) return v51pMgFinish(); const d = Math.hypot(P.x - g.x, P.y - g.y); if(d < 500) g.near = true;
    for(const r of g.R){ if(Math.hypot(P.x - r.x, P.y - r.y) < 85 && Math.abs(P.alt - g.alt) < 130){ const ok = r.v === g.ans; if(ok){ m.ok++; m.score += 100; v51pBeep('ring'); v51pMsg('✅ Đúng! ' + g.q.replace('?', g.ans), 2.2); } else { v51pBeep('bad'); v51pMsg('❌ Chưa đúng: ' + g.q.replace('?', g.ans) + '. Vòng sau cố lên!', 2.6); } m.i++; break; } }
    if(m.gates[m.i] === g && g.near && d > 700){ m.i++; v51pMsg('↩️ Bỏ lỡ vòng: ' + g.q.replace('?', g.ans), 2.2); }
    if(m.i >= m.N) v51pMgFinish();
  } else if(m.id === 'mail'){ const T = m.T[m.i]; if(!T) return v51pMgFinish();
    if(Math.hypot(P.x - T.x, P.y - T.y) < 190 && P.alt < 300 && P.alt > 0){ m.drops.push({x:P.x, y:P.y, alt:P.alt, t:realT}); m.score += 100; m.i++; v51pBeep('drop'); v51pMsg(T.fact, 5); if(m.i >= m.T.length) setTimeout(() => { if(V51P.mg === m && !m.done) v51pMgFinish(); }, 1600); }
    else if(Math.hypot(P.x - T.x, P.y - T.y) < 380 && P.alt >= 300 && realT - (m.lowT || 0) > 4){ m.lowT = realT; v51pMsg('⬇️ Bay thấp hơn (dưới 180 m) để thả bưu phẩm!', 2.5); }
  } else if(m.id === 'sky'){ const D = v51pProj(P); if(P.alt > 150) for(const q of m.dots){ if(!q.hit && Math.hypot(D[0] - q.x, D[1] - q.y) < 85){ q.hit = true; m.hit++; v51pBeep('ring'); } }
    if(m.hit >= m.dots.length) v51pMgFinish();
  } else if(m.id === 'race'){ const g = m.G[m.i]; if(!g) return v51pMgFinish(); if(Math.hypot(P.x - g.x, P.y - g.y) < 170 && Math.abs(P.alt - g.alt) < 220){ m.i++; v51pBeep('ring'); if(m.i >= m.N) v51pMgFinish(); else v51pMsg('🏁 Cột mốc ' + m.i + '/' + m.N + ' · ' + m.t.toFixed(1) + ' giây', 1.8); } }
  v51pMgHud();
}
function v51pMgHud(force){
  const m = V51P.mg, e = document.getElementById('v51pMg'); if(!e) return; if(!m){ e.hidden = true; return; }
  if(!force && realT - m.hud < .25 && m.cd <= 0) return; m.hud = realT; e.hidden = false; let s = '';
  const tm = s2 => Math.floor(s2/60) + ':' + String(Math.floor(s2 % 60)).padStart(2, '0'), left = m.tl ? '⏱ ' + tm(Math.max(0, m.tl - m.t)) : '⏱ ' + m.t.toFixed(1) + ' s';
  if(m.cd > 0) s = '<b class="v51pCd">' + Math.ceil(m.cd) + '</b>';
  else if(m.done) s = '<b>🏆 Hoàn thành!</b>';
  else if(m.id === 'rings'){ const g = m.gates[m.i]; s = '<b>❓ ' + (g ? g.q : '') + '</b><span>Vòng ' + Math.min(m.N, m.i + 1) + '/' + m.N + ' · ✅ ' + m.ok + '</span><span>' + left + '</span>'; }
  else if(m.id === 'mail'){ const T = m.T[m.i]; s = '<b>📦 Giao tới: ' + (T ? T.n : '—') + '</b><span>' + m.i + '/' + m.T.length + '</span><span>' + left + '</span>'; }
  else if(m.id === 'sky') s = '<b>☁️ Viết chữ "' + m.L + '"</b><span>Chấm ' + m.hit + '/' + m.dots.length + '</span><span>' + left + '</span>';
  else if(m.id === 'race') s = '<b>🏁 Cột mốc ' + Math.min(m.N, m.i + 1) + '/' + m.N + '</b><span>' + left + '</span>';
  if(e._s !== s){ e._s = s; e.innerHTML = s; }
}
function v51pMgFinish(){
  const m = V51P.mg; if(!m || m.done) return; m.done = true; const g = V51P_GAMES.find(q => q.id === m.id); let perf = 0, score = 0, rec, line = '';
  if(m.id === 'rings'){ perf = m.ok/m.N; score = m.ok*100 + Math.max(0, Math.round((m.tl - m.t)*2)); rec = v51pBest('rings', score); line = '✅ Đúng ' + m.ok + '/' + m.N + ' phép tính'; }
  else if(m.id === 'mail'){ const n = m.i; perf = n/m.T.length*(n === m.T.length ? Math.max(.6, 1 - m.t/m.tl*.5) : .8); score = n*100 + (n === m.T.length ? Math.round((m.tl - m.t)*2) : 0); rec = v51pBest('mail', score); line = '📦 Đã giao ' + n + '/' + m.T.length + ' bưu phẩm'; }
  else if(m.id === 'sky'){ perf = m.hit/m.dots.length; score = Math.round(perf*1000); rec = v51pBest('sky', score); line = '☁️ Chữ "' + m.L + '": ' + Math.round(perf*100) + '% nét'; }
  else if(m.id === 'race'){ const fin = m.i >= m.N; perf = fin ? v51pClamp((m.par*1.7 - m.t)/(m.par*.9), .25, 1) : m.i/m.N*.3; score = fin ? Math.round(m.t*10)/10 : 0; rec = fin ? v51pBest('race', score, true) : {rec:false, best:v51pState().best.race}; line = fin ? '🏁 Thời gian: ' + score + ' giây' : '🏁 Chưa về đích'; }
  const r = v51pReward(m.id, perf, g.vi), stars = perf >= .9 ? 3 : perf >= .6 ? 2 : perf >= .25 ? 1 : 0; v51pBeep(stars >= 2 ? 'win' : 'ok');
  V51P.res = {g, line, stars, score:m.id === 'race' ? (score ? score + ' s' : '—') : score, rec:rec.rec, best:rec.best, money:r.money, exp:r.exp};
  v51pMgHud(true); v51pPanel('result');
}
function v51pMgEnd(abort){ V51P.mg = null; v51pMgHud(true); if(abort) v51pMsg('⏹️ Đã dừng mini game. Bay tự do nhé!', 2.5); }
// ---------- vẽ vật thể mini game (0 = dưới máy bay, 1 = trên máy bay) ----------
function v51pMgDraw(VBn, layer){
  const m = V51P.mg, P = V51P.P; if(!m || !P) return; const pa = P.alt, t = realT;
  const arrow = (tx, ty) => { if(layer !== 1) return; const D = v51pProj(P), a = Math.atan2(ty - D[1], tx - D[0]), d = Math.hypot(tx - D[0], ty - D[1]); if(d < 260) return; const r = 70/cam.z*.7, x = D[0] + Math.cos(a)*r, y = D[1] + Math.sin(a)*r, s = 1/cam.z;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1d2238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); };
  const label = (x, y, s, fs, col) => { ctx.font = '800 ' + fs + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(s).width + fs; ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(x - w/2, y - fs*.75, w, fs*1.5); ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y); };
  const fs = Math.round(Math.max(18, 18/cam.z*.8));
  if(m.id === 'rings'){ m.gates.forEach((g, gi) => { if(gi < m.i) return; const up = g.alt > pa; if((layer === 1) !== up) return; const act = gi === m.i;
      g.R.forEach(r => { const y = r.y - g.alt*.22; if(layer === 0 || true){ ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(r.x + g.alt*.18, r.y + g.alt*.05, 60, 26, 0, 0, 7); ctx.fill(); }
        ctx.lineWidth = 12; ctx.strokeStyle = act ? (Math.sin(t*5) > 0 ? '#ffd23f' : '#ffb020') : 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(r.x, y, 72, 72, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d3557'; ctx.stroke();
        if(act) label(r.x, y, String(r.v), fs + 6, '#ffe9a8'); });
      if(act) label(g.x, g.y - g.alt*.22 - 250, g.q + ' · ⛰️ ' + Math.round(g.alt*.6) + ' m', fs, '#fff'); });
    const g = m.gates[m.i]; if(g) arrow(g.x, g.y - g.alt*.22);
  } else if(m.id === 'mail'){ if(layer === 0){ const T = m.T[m.i]; if(T){ const pr = 1 + Math.sin(t*4)*.06; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,210,63,.9)'; ctx.beginPath(); ctx.arc(T.x, T.y, 190*pr, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,210,63,.18)'; ctx.fill();
        ctx.fillStyle = '#ef4b4b'; ctx.fillRect(T.x - 3, T.y - 70, 6, 70); ctx.fillStyle = '#ffd23f'; ctx.fillRect(T.x + 3, T.y - 70, 36, 22); label(T.x, T.y + 230, T.n, fs, '#ffe9a8'); }
      m.drops.forEach(d => { const k = Math.min(1, (realT - d.t)/1.6), alt = d.alt*(1 - k); ctx.fillStyle = '#c98a3a'; ctx.fillRect(d.x - 10, d.y - alt*.22 - 10, 20, 18); ctx.fillStyle = '#7a4b2a'; ctx.fillRect(d.x - 10, d.y - alt*.22 - 2, 20, 3);
        if(k < 1){ ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(d.x, d.y - alt*.22 - 40, 24, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d.x - 22, d.y - alt*.22 - 40); ctx.lineTo(d.x - 8, d.y - alt*.22 - 10); ctx.moveTo(d.x + 22, d.y - alt*.22 - 40); ctx.lineTo(d.x + 8, d.y - alt*.22 - 10); ctx.stroke(); } }); }
    const T = m.T[m.i]; if(T) arrow(T.x, T.y);
  } else if(m.id === 'sky'){ if(layer === 0){ ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.font = '800 ' + Math.round(m.S*1.2) + 'px Nunito, sans-serif'; m.dots.forEach((q, i) => { const r = q.hit ? 16 : 11 + Math.sin(t*4 + i)*2; ctx.fillStyle = q.hit ? 'rgba(120,255,160,.9)' : 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(29,53,87,.7)'; ctx.lineWidth = 3; ctx.stroke(); });
      label(m.ox + m.S*.5, m.oy - 110, '☁️ Chữ "' + m.L + '" · bay qua các chấm', fs, '#ffe9a8'); }
    const nx = m.dots.find(q => !q.hit); if(nx) arrow(nx.x, nx.y);
  } else if(m.id === 'race'){ m.G.forEach((g, gi) => { if(gi < m.i) return; const up = g.alt > pa; if((layer === 1) !== up) return; const y = g.y - g.alt*.22, act = gi === m.i;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(g.x + g.alt*.18, g.y + g.alt*.05, 40, 16, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, y + 40); ctx.stroke();
      const col = gi === m.N - 1 ? '#ffffff' : ['#ef4b4b', '#3da5ff', '#43c463', '#ffd23f'][gi % 4]; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(g.x, y, act ? 46 : 36, act ? 54 : 42, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(g.x - 12, y - 16, 10, 16, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7a4b2a'; ctx.fillRect(g.x - 9, y + 50, 18, 12); if(act){ ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(g.x, y, 170, 0, 7); ctx.stroke(); }
      label(g.x, y, gi === m.N - 1 ? '🏁' : String(gi + 1), fs, '#1d2238'); });
    const g = m.G[m.i]; if(g) arrow(g.x, g.y - g.alt*.22);
  }
}
// ---------- bảng: Hangar / mini game / hướng dẫn / kết quả ----------
function v51pPanel(kind){
  let p = document.getElementById('v51pPanel'); if(!p){ p = document.createElement('div'); p.id = 'v51pPanel'; p.hidden = true; p.setAttribute('role', 'dialog'); (document.getElementById('stage') || document.body).appendChild(p);
    p.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if(!b) return; const a = b.dataset.a, v = b.dataset.v; e.stopPropagation();
      if(a === 'x') v51pPanel(null); else if(a === 'sel'){ v51pState().sel = v; v51pSave(); v51pPanel('hangar'); }
      else if(a === 'buy') v51pBuy(v); else if(a === 'fly'){ v51pPanel(null); if(V51P.on){ if(V51P.P.ground && V51P.P.spd < 20 && v51pNearAirportPlane()){ const s = v51pState().sel; v51pExit(true); v51pBoard(s); } else v51pMsg('🛬 Hạ cánh về sân bay để đổi máy bay nhé!'); } else v51pBoard(v51pState().sel); }
      else if(a === 'go'){ v51pPanel(null); v51pGuideOn(); toast('✈️ Mũi tên vàng chỉ đường tới Sân bay Rubik.'); }
      else if(a === 'play') v51pMgStart(v); else if(a === 'games') v51pPanel('games'); else if(a === 'hangar') v51pPanel('hangar'); else if(a === 'help') v51pPanel('help'); });
  }
  V51P.panelK = kind; if(!kind){ p.hidden = true; p.innerHTML = ''; return; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]), st = v51pState(), money = (typeof PROF !== 'undefined' && PROF) ? PROF.money : 0;
  let h = '<div class="v51pBox"><div class="v51pHd"><b>';
  if(kind === 'hangar'){
    h += '🛩️ Hangar · Máy bay của bạn</b><button type="button" class="v51pIb" data-a="x" aria-label="Đóng">✕</button></div><div class="v51pGrid">';
    V51P_PLANES.forEach(pl => { const un = v51pUnlocked(pl), sel = st.sel === pl.id, bar = (n, v) => '<div class="v51pBar"><span>' + n + '</span><i style="width:' + Math.round(v*100) + '%"></i></div>';
      h += '<div class="v51pCard' + (sel ? ' on' : '') + (un ? '' : ' lock') + '"><canvas data-k="' + pl.kind + '" width="96" height="96"></canvas><div class="v51pCi"><b>' + esc(pl.vi) + ' <small>' + pl.en + '</small></b><p>' + esc(pl.desc) + '</p>' +
        bar('Tốc độ', pl.vmax/380) + bar('Độ lượn', pl.hover ? .5 : 1 - pl.sink/50) + bar('Rẽ', pl.turn/2.1) +
        (un ? (sel ? '<span class="v51pTag">✓ Đang chọn</span>' : '<button type="button" data-a="sel" data-v="' + pl.id + '">Chọn</button>')
            : '<span class="v51pTag">🔒 Level ' + pl.lv + '</span><button type="button" data-a="buy" data-v="' + pl.id + '"' + (money >= pl.cost ? '' : ' disabled') + '>Mua $' + pl.cost + '</button>') + '</div></div>'; });
    h += '</div><div class="v51pFt"><button type="button" class="v51pGo" data-a="' + (V51P.on || v51pNearAirport() ? 'fly' : 'go') + '">' + (V51P.on || v51pNearAirport() ? '🛫 Lên máy bay' : '🧭 Đi tới Sân bay') + '</button><button type="button" data-a="games">🎯 Mini game bay</button><button type="button" data-a="help">❓ Cách lái</button></div>';
  } else if(kind === 'games'){
    h += '🎯 Mini game bay</b><button type="button" class="v51pIb" data-a="x" aria-label="Đóng">✕</button></div><div class="v51pList">';
    V51P_GAMES.forEach(g => { const b = st.best[g.id]; h += '<div class="v51pRow"><span class="v51pBig">' + g.ic + '</span><div><b>' + g.vi + ' <small>' + g.en + '</small></b><p>' + g.desc + '</p><small>🏆 Kỷ lục: ' + (b == null ? '—' : b + (g.id === 'race' ? ' giây' : ' điểm')) + '</small></div><button type="button" data-a="play" data-v="' + g.id + '">Bay!</button></div>'; });
    h += '</div><div class="v51pFt"><button type="button" data-a="hangar">🛩️ Hangar</button></div>';
  } else if(kind === 'help'){
    h += '❓ Cách lái máy bay</b><button type="button" class="v51pIb" data-a="x" aria-label="Đóng">✕</button></div><ul class="v51pHelp">' +
      '<li>📱 <b>Điện thoại:</b> chạm và kéo trên màn hình. Kéo ← → để rẽ, kéo ↑ để bay lên, kéo ↓ để hạ xuống.</li><li>⛽ Kéo <b>cần GA</b> bên phải lên để chạy nhanh, kéo xuống để chậm lại.</li>' +
      '<li>⌨️ <b>Máy tính:</b> ← → (A D) rẽ · ↑ ↓ (W S) lên/xuống · Space/E tăng ga · Q/X giảm ga · Esc thoát.</li><li>🛫 <b>Cất cánh:</b> đẩy ga hết, chạy trên đường băng, đủ nhanh thì kéo ↑.</li>' +
      '<li>🛬 <b>Hạ cánh:</b> giảm ga, nhắm đường băng, hạ thật nhẹ. Hạ mềm được thưởng; hạ mạnh thì máy bay nảy lên an toàn.</li><li>🌊 Thủy phi cơ đậu được trên mặt nước. 🚁 Trực thăng lên thẳng và đậu mọi bãi đất.</li>' +
      '<li>🌀 Hạ cánh ở <b>Đảo Phép Thuật</b> để vào Học viện Phép thuật.</li></ul><div class="v51pFt"><button type="button" data-a="x">Đã hiểu</button></div>';
  } else if(kind === 'result'){
    const R = V51P.res; h += R.g.ic + ' ' + R.g.vi + '</b><button type="button" class="v51pIb" data-a="x" aria-label="Đóng">✕</button></div><div class="v51pRes"><div class="v51pStars">' + '★'.repeat(R.stars) + '<i>' + '★'.repeat(3 - R.stars) + '</i></div><p>' + R.line + '</p>' +
      '<p>Điểm: <b>' + R.score + '</b>' + (R.rec ? ' · 🎉 <b>Kỷ lục mới!</b>' : ' · Kỷ lục: ' + (R.best == null ? '—' : R.best)) + '</p><p>+$' + R.money + ' · +' + R.exp + ' EXP</p></div>' +
      '<div class="v51pFt"><button type="button" class="v51pGo" data-a="play" data-v="' + R.g.id + '">Play again</button><button type="button" data-a="games">🎯 Game khác</button><button type="button" data-a="x">Bay tự do</button></div>';
  }
  h += '</div>'; p.innerHTML = h; p.hidden = false;
  p.querySelectorAll('canvas[data-k]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(48, 48); g.rotate(-Math.PI/2); g.scale(1.35, 1.35); g.drawImage(v51pSprite(c.dataset.k), -32, -32); });
  if(kind === 'result'){ const m = V51P.mg; if(m) V51P.mg = null; v51pMgHud(true); }
}
function v51pNearAirportPlane(){ const P = V51P.P, C = v51pC(); return P && Math.abs(P.y - C[1] - 4900) < 260 && P.x > C[0] + V51P_AP.rx0 - 200 && P.x < C[0] + V51P_AP.rx1 + 200; }
function v51pBuy(id){
  const pl = v51pPlane(id), st = v51pState(); if(v51pUnlocked(pl)) return;
  if(typeof PROF === 'undefined' || !PROF){ toast('Đăng nhập để mua máy bay nhé!'); return; } if(PROF.money < pl.cost){ toast('💰 Chưa đủ tiền. Chơi mini game để kiếm thêm nhé!'); return; }
  PROF.money -= pl.cost; st.own.push(pl.id); st.sel = pl.id; try { renderProfHud(); } catch(e){} v51pSave(); v51pBeep('win'); toast('🛩️ Đã mua ' + pl.vi + '! Máy bay đã vào Hangar.'); v51pPanel('hangar');
}
// mở từ nút / menu: gần sân bay thì lên luôn, xa thì mở Hangar
function v51pMenu(){ if(V51P.on){ v51pExit(); return; } if(v51pNearAirport()) v51pBoard(); else v51pPanel('hangar'); }
function v51pIslLanded(s){ if(s.magic) v51pMsg('🌀 Đảo Phép Thuật! Bấm nút bên dưới để vào Học viện.', 4); else v51pMsg(s.fact, 5); }

// ---------- khởi động (gọi từ extFinalInit) ----------
function v51pInit(){
  if(typeof V46 === 'undefined' || !V46.on) return;
  addEventListener('keydown', e => v51pKey(e, true), true); addEventListener('keyup', e => v51pKey(e, false), true);
  addEventListener('blur', () => { V51P.k = {}; });
  // nền: sân bay + đảo nhỏ vẽ ngay sau bờ biển
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); try { v51pDrawGround(VBn); } catch(e){ console.warn('v51p ground', e); } };
  // lớp trên cùng: máy bay, khói, mây, đèn
  const vr0 = v46Render; v46Render = function(dt){ vr0(dt); try { v51pOverlay(dt); } catch(e){ console.warn('v51p overlay', e); } };
  const r0 = render; render = function(dt){ if(V51P.on && V46.on && !V46.sky){ v51pCam(dt); v51pFps(dt); } return r0(dt); };
  const eu0 = extUpdate; extUpdate = function(dtR){ if(V51P.on){ try { v51pTick(dtR); } catch(e){ console.warn('v51p tick', e); } } return eu0(dtR); };
  // người chơi "ngồi trong máy bay": không vẽ, không đi, không tự lên thuyền / khinh khí cầu
  if(typeof drawLabels === 'function'){ const dl0 = drawLabels; drawLabels = function(){ if(!V51P.on || !PLAYER) return dl0.apply(this, arguments); const v = PLAYER.visible; PLAYER.visible = false; try { return dl0.apply(this, arguments); } finally { PLAYER.visible = v; } }; }
  const dp0 = drawPerson; drawPerson = function(a){ if(V51P.on && a === PLAYER) return; return dp0.apply(this, arguments); };
  const ow0 = openWorldTick; openWorldTick = function(dt){ if(V51P.on) return; return ow0(dt); };
  const bb0 = boardBoat; boardBoat = function(){ if(V51P.on){ v51pMsg('✈️ Đang lái máy bay — xuống máy bay rồi mới lên thuyền nhé!'); return; } return bb0.apply(this, arguments); };
  const ft0 = flyToggle; flyToggle = function(){ if(V51P.on){ v51pMsg('✈️ Đang lái máy bay rồi!'); return; } return ft0.apply(this, arguments); };
  // không đi xuyên hangar và tháp điều khiển
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ if(v46Raw(nx)){ const C = v51pC(), A = V51P_AP, x = nx - V46E - C[0], y = ny - C[1], H = A.hangar;
      if((x > H[0] && x < H[0] + H[2] && y > H[1] && y < H[1] + H[3] - 8) || (Math.abs(x - A.tower[0]) < 22 && Math.abs(y - A.tower[1]) < 22)) return false; } return cm0(ox, oy, nx, ny); };
  // đèn đường băng khoét sáng màn đêm
  if(typeof v25Collect === 'function'){ const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); try { const on = v25Ramp(clock, 1080, 330); if(on <= 0) return; const C = v51pC(), A = V51P_AP;
      for(let x = A.rx0 + 40; x <= A.rx1; x += 160) v25Push(C[0] + x + V46E, C[1] + A.ry, 90, on*.8, 2); v25Push(C[0] + A.tower[0] + V46E, C[1] + A.tower[1], 80, on, 2); v25Push(C[0] + A.hangar[0] + 100 + V46E, C[1] + A.hangar[1] + A.hangar[3] + 20, 110, on, 2); } catch(e){} }; }
  // nút "Máy bay" trong cột nút + mục trong menu
  try { V39_P.plane = '<path d="M2.5 13.5l7.5-2V5.2a2 2 0 0 1 4 0v6.3l7.5 2v2.2l-7.5-1.6v4.1l2.2 1.6v1.7L12 20.4l-4.2 1.1v-1.7l2.2-1.6v-4.1l-7.5 1.6z"/>'; } catch(e){}
  const col = document.getElementById('v41Col'); if(col){ const b = document.createElement('button'); b.type = 'button'; b.id = 'v51pBtn'; b.className = 'v41b'; b.setAttribute('aria-label', 'Máy bay'); b.innerHTML = '<span class="ic">' + (typeof v41Svg === 'function' ? v41Svg(V39_P.plane) : '✈️') + '</span><small>Plane</small>';
    b.onclick = e => { e.stopPropagation(); try { v32Wake(); } catch(er){} v51pMenu(); }; col.appendChild(b);
    setInterval(() => { b.classList.toggle('on', V51P.on); b.setAttribute('aria-pressed', V51P.on); const s = b.querySelector('small'), t = V51P.on ? 'Land' : 'Plane'; if(s.textContent !== t) s.textContent = t; }, 300); }
  if(typeof v32Items === 'function'){ const mi = v32Items; v32Items = function(){ const L = mi(); L.push({ic:'plane', en:'Airplane', vi:'Máy bay', grp:'world', f:() => v51pMenu()}); return L; }; }
  setInterval(() => { try { v51pHud(); } catch(e){} }, 250);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v51p = {V51P, v51pBoard, v51pExit, v51pMgStart, v51pPanel, v51pState};
}
// đo FPS khi bay (để kiểm tra), lưu trung bình mỗi giây vào V51P.fps
function v51pFps(dt){ V51P.fpsN++; V51P.fpsT += dt; if(V51P.fpsT >= 1){ V51P.fps = V51P.fpsN/V51P.fpsT; V51P.fpsN = 0; V51P.fpsT = 0; } }
