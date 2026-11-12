// ================= EXT: CARO (GOMOKU) =================
var CARO = {n:15, b:null, turn:1, mode:'ai', over:false, last:-1, win:null, block2:false, busy:false};
function caroNew(){ CARO.b = new Int8Array(CARO.n*CARO.n); CARO.turn = 1; CARO.over = false; CARO.last = -1; CARO.win = null; CARO.hist = []; caroDraw(); caroStatus(); }
function caroLine(b, i, p, dx, dy){
  const n = CARO.n, x0 = i % n, y0 = Math.floor(i/n); let c = 1, open = 0, cells = [i];
  for(const s of [1, -1]){ let x = x0 + dx*s, y = y0 + dy*s; while(x >= 0 && y >= 0 && x < n && y < n && b[y*n + x] === p){ c++; cells.push(y*n + x); x += dx*s; y += dy*s; } if(x >= 0 && y >= 0 && x < n && y < n && b[y*n + x] === 0) open++; }
  return {c, open, cells};
}
function caroWin(b, i, p){ for(const [dx, dy] of [[1,0],[0,1],[1,1],[1,-1]]){ const L = caroLine(b, i, p, dx, dy); if(L.c >= 5 && (!CARO.block2 || L.open > 0)) return L.cells; } return null; }
function caroScore(b, i, p){ let s = 0; for(const [dx, dy] of [[1,0],[0,1],[1,1],[1,-1]]){ const {c, open} = caroLine(b, i, p, dx, dy); if(c >= 5) s += 100000; else if(open === 0) continue; else if(c === 4) s += open === 2 ? 12000 : 1500; else if(c === 3) s += open === 2 ? 1200 : 120; else if(c === 2) s += open === 2 ? 100 : 12; else s += open; } return s; }
function caroAI(){
  const b = CARO.b, n = CARO.n; let best = -1, bs = -1;
  for(let i=0;i<n*n;i++){ if(b[i]) continue; const x = i % n, y = Math.floor(i/n); let near = false;
    for(let dy=-2; dy<=2 && !near; dy++) for(let dx=-2; dx<=2; dx++){ const xx = x + dx, yy = y + dy; if(xx >= 0 && yy >= 0 && xx < n && yy < n && b[yy*n + xx]){ near = true; break; } }
    if(!near) continue;
    b[i] = 2; const a = caroScore(b, i, 2); b[i] = 1; const d = caroScore(b, i, 1); b[i] = 0;
    const s = a*1.05 + d + Math.random()*5; if(s > bs){ bs = s; best = i; } }
  if(best < 0) best = Math.floor(n*n/2);
  return best;
}
function caroPlay(i){
  if(CARO.over || CARO.b[i]) return false;
  CARO.b[i] = CARO.turn; CARO.last = i; CARO.hist.push(i); chessSfx('move');
  const w = caroWin(CARO.b, i, CARO.turn);
  if(w){ CARO.over = true; CARO.win = w; chessSfx('end'); if(CARO.mode !== 'two' && (CARO.mode === 'ai' ? CARO.turn === 1 : CARO.turn === CARO.side)){ mprog('caro'); reward(50, 10, 'Thắng cờ caro'); } }
  else if(CARO.hist.length === CARO.n*CARO.n) CARO.over = true;
  else CARO.turn = 3 - CARO.turn;
  caroDraw(); caroStatus(); return true;
}
function caroClick(e){
  if(CARO.busy || CARO.over) return; if(CARO.mode === 'ai' && CARO.turn !== 1) return; if(CARO.mode === 'online' && CARO.turn !== CARO.side) return;
  const cv = $('#caroCv'), r = cv.getBoundingClientRect(), n = CARO.n, cs = cv.width/n;
  const x = Math.floor((e.clientX - r.left)/r.width*cv.width/cs), y = Math.floor((e.clientY - r.top)/r.height*cv.height/cs);
  if(x < 0 || y < 0 || x >= n || y >= n) return;
  if(!caroPlay(y*n + x)) return;
  if(CARO.mode === 'online'){ onlineSend({i:y*n + x}); if(CARO.over) onlineEnd(); return; }
  if(CARO.mode === 'ai' && !CARO.over){ CARO.busy = true; setTimeout(() => { CARO.busy = false; caroPlay(caroAI()); }, 260); }
}
function caroDraw(){
  const cv = $('#caroCv'); if(!cv || !CARO.b) return; const c = cv.getContext('2d'), n = CARO.n, cs = cv.width/n;
  c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, cv.width, cv.height); c.strokeStyle = '#b9a98a'; c.lineWidth = 1;
  for(let i=0;i<=n;i++){ c.beginPath(); c.moveTo(i*cs, 0); c.lineTo(i*cs, cv.height); c.moveTo(0, i*cs); c.lineTo(cv.width, i*cs); c.stroke(); }
  for(let i=0;i<n*n;i++){ const p = CARO.b[i]; if(!p) continue; const x = (i % n)*cs, y = Math.floor(i/n)*cs;
    if(i === CARO.last){ c.fillStyle = 'rgba(255,210,63,.45)'; c.fillRect(x + 1, y + 1, cs - 2, cs - 2); }
    if(CARO.win && CARO.win.includes(i)){ c.fillStyle = 'rgba(47,191,113,.4)'; c.fillRect(x + 1, y + 1, cs - 2, cs - 2); }
    c.lineWidth = 4; if(p === 1){ c.strokeStyle = '#d32f2f'; c.beginPath(); c.moveTo(x + 7, y + 7); c.lineTo(x + cs - 7, y + cs - 7); c.moveTo(x + cs - 7, y + 7); c.lineTo(x + 7, y + cs - 7); c.stroke(); }
    else { c.strokeStyle = '#1565c0'; c.beginPath(); c.arc(x + cs/2, y + cs/2, cs/2 - 7, 0, Math.PI*2); c.stroke(); } }
}
function caroStatus(){
  const who = p => p === 1 ? 'X (đỏ)' : 'O (xanh)';
  $('#caroSt').textContent = CARO.over ? (CARO.win ? `${who(CARO.turn)} thắng với 5 quân liên tiếp!` + (CARO.mode === 'ai' ? (CARO.turn === 1 ? ' Bạn thắng máy!' : ' Máy thắng rồi.') : '') : 'Hòa: bàn cờ đã kín.') : `Lượt ${who(CARO.turn)}` + (CARO.mode === 'ai' ? (CARO.turn === 1 ? ' · tới bạn' : ' · máy đang nghĩ…') : '');
}
function caroUndo(){ if(CARO.busy || !CARO.hist.length) return; const k = CARO.mode === 'ai' ? Math.min(2, CARO.hist.length) : 1; for(let j=0;j<k;j++){ CARO.b[CARO.hist.pop()] = 0; } CARO.turn = CARO.mode === 'ai' ? 1 : (CARO.hist.length % 2 ? 2 : 1); CARO.over = false; CARO.win = null; CARO.last = CARO.hist.length ? CARO.hist[CARO.hist.length - 1] : -1; caroDraw(); caroStatus(); }

// ================= EXT: GO (CỜ VÂY) =================
var GO = {n:9, b:null, turn:1, prev:'', cap:[0,0,0], pass:0, mode:'ai', over:false, last:-1, busy:false, hist:[]};
function goNew(n){ if(n) GO.n = n; GO.b = new Int8Array(GO.n*GO.n); GO.turn = 1; GO.prev = ''; GO.cap = [0,0,0]; GO.pass = 0; GO.over = false; GO.last = -1; GO.hist = []; goDraw(); goStatus(); }
function goNb(i){ const n = GO.n, x = i % n, y = Math.floor(i/n), r = []; if(x > 0) r.push(i - 1); if(x < n - 1) r.push(i + 1); if(y > 0) r.push(i - n); if(y < n - 1) r.push(i + n); return r; }
function goGroup(b, i){ const p = b[i], st = [i], seen = new Set([i]), libs = new Set(); while(st.length){ const k = st.pop(); for(const j of goNb(k)){ if(b[j] === 0) libs.add(j); else if(b[j] === p && !seen.has(j)){ seen.add(j); st.push(j); } } } return {stones:[...seen], libs}; }
function goTry(b, i, p){
  if(b[i]) return null;
  const nb = b.slice(); nb[i] = p; let caps = 0;
  for(const j of goNb(i)) if(nb[j] === 3 - p){ const g = goGroup(nb, j); if(!g.libs.size){ g.stones.forEach(k => nb[k] = 0); caps += g.stones.length; } }
  if(!goGroup(nb, i).libs.size) return null;
  const key = nb.join(''); if(key === GO.prev) return null;
  return {nb, caps};
}
function goPlay(i){
  const r = goTry(GO.b, i, GO.turn); if(!r) return false;
  GO.hist.push({b:GO.b, prev:GO.prev, cap:GO.cap.slice(), turn:GO.turn, last:GO.last, pass:GO.pass});
  GO.prev = GO.b.join(''); GO.b = r.nb; GO.cap[GO.turn] += r.caps; GO.last = i; GO.pass = 0; GO.turn = 3 - GO.turn;
  r.caps ? chessSfx('capture') : chessSfx('move');
  goDraw(); goStatus(); return true;
}
function goPassMove(){
  if(GO.over) return; GO.hist.push({b:GO.b, prev:GO.prev, cap:GO.cap.slice(), turn:GO.turn, last:GO.last, pass:GO.pass});
  GO.pass++; GO.prev = GO.b.join(''); GO.turn = 3 - GO.turn; GO.last = -1;
  if(GO.pass >= 2){ GO.over = true; mprog('go'); chessSfx('end'); reward(40, 0, 'Chơi xong một ván cờ vây'); }
  goDraw(); goStatus();
}
function goScore(){
  const b = GO.b, n = GO.n, sc = [0, 0, 0], seen = new Uint8Array(n*n);
  for(let i=0;i<n*n;i++){ if(b[i]){ sc[b[i]]++; continue; } if(seen[i]) continue; const st = [i], area = []; const own = new Set(); seen[i] = 1;
    while(st.length){ const k = st.pop(); area.push(k); for(const j of goNb(k)){ if(b[j]) own.add(b[j]); else if(!seen[j]){ seen[j] = 1; st.push(j); } } }
    if(own.size === 1) sc[[...own][0]] += area.length; }
  sc[2] += 6.5; return sc;
}
function goAI(){
  const b = GO.b, n = GO.n, p = GO.turn, o = 3 - p; let best = -1, bs = -40;
  for(let i=0;i<n*n;i++){
    const r = goTry(b, i, p); if(!r) continue;
    let s = r.caps*60 + Math.random()*12;
    const nbs = goNb(i); if(nbs.every(j => b[j] === p) ) { const eye = nbs.every(j => goGroup(b, j).libs.size > 1); if(eye) s -= 120; }
    const g = goGroup(r.nb, i); if(g.libs.size === 1 && !r.caps) s -= 90; else if(g.libs.size === 2) s -= 8;
    for(const j of nbs){ if(b[j] === p && goGroup(b, j).libs.size === 1) s += 70; if(b[j] === o){ const og = goGroup(r.nb, j); if(og.libs.size === 1) s += 35; } if(b[j]) s += 4; }
    const x = i % n, y = Math.floor(i/n), edge = Math.min(x, y, n - 1 - x, n - 1 - y); if(edge === 0) s -= 10; else if(edge === 2) s += 6;
    if(GO.hist.length < 6 && edge >= 2) s += 10;
    if(s > bs){ bs = s; best = i; }
  }
  if(best < 0) goPassMove(); else goPlay(best);
}
function goClick(e){
  if(GO.busy || GO.over) return; if(GO.mode === 'ai' && GO.turn !== 1) return;
  const cv = $('#goCv'), r = cv.getBoundingClientRect(), n = GO.n, m = cv.width/(n + 1);
  const x = Math.round((e.clientX - r.left)/r.width*cv.width/m) - 1, y = Math.round((e.clientY - r.top)/r.height*cv.height/m) - 1;
  if(x < 0 || y < 0 || x >= n || y >= n) return;
  if(!goPlay(y*n + x)){ chessSfx('illegal'); $('#goSt').textContent = 'Nước này không hợp lệ (tự sát hoặc phạm luật cướp ko).'; return; }
  if(GO.mode === 'ai' && !GO.over){ GO.busy = true; setTimeout(() => { GO.busy = false; goAI(); }, 300); }
}
function goDraw(){
  const cv = $('#goCv'); if(!cv || !GO.b) return; const c = cv.getContext('2d'), n = GO.n, m = cv.width/(n + 1);
  c.fillStyle = '#dcb35c'; c.fillRect(0, 0, cv.width, cv.height); c.strokeStyle = '#3a2410'; c.lineWidth = 1.2;
  for(let i=0;i<n;i++){ c.beginPath(); c.moveTo(m, m*(i + 1)); c.lineTo(m*n, m*(i + 1)); c.moveTo(m*(i + 1), m); c.lineTo(m*(i + 1), m*n); c.stroke(); }
  const hs = n === 9 ? [2, 4, 6] : n === 13 ? [3, 6, 9] : [3, 9, 15]; hs.forEach(x => hs.forEach(y => { if(n === 9 && (x === 4) !== (y === 4)) return; c.fillStyle = '#3a2410'; c.beginPath(); c.arc(m*(x + 1), m*(y + 1), 3.5, 0, Math.PI*2); c.fill(); }));
  for(let i=0;i<n*n;i++){ const p = GO.b[i]; if(!p) continue; const x = m*(i % n + 1), y = m*(Math.floor(i/n) + 1), rr = m*.46;
    const g = c.createRadialGradient(x - rr*.35, y - rr*.35, rr*.1, x, y, rr); if(p === 1){ g.addColorStop(0, '#666'); g.addColorStop(1, '#111'); } else { g.addColorStop(0, '#fff'); g.addColorStop(1, '#cfcfcf'); }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(x + 2, y + 2, rr, 0, Math.PI*2); c.fill(); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, Math.PI*2); c.fill();
    if(i === GO.last){ c.strokeStyle = p === 1 ? '#fff' : '#111'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, rr*.45, 0, Math.PI*2); c.stroke(); } }
}
function goStatus(){
  const nm = p => p === 1 ? 'Đen' : 'Trắng';
  if(GO.over){ const s = goScore(); $('#goSt').textContent = `Hết ván! Đen ${s[1]} · Trắng ${s[2]} (đã cộng 6,5 điểm komi). ${s[1] > s[2] ? 'Đen' : 'Trắng'} thắng.`; return; }
  $('#goSt').textContent = `Lượt ${nm(GO.turn)}` + (GO.mode === 'ai' ? (GO.turn === 1 ? ' · tới bạn (Đen)' : ' · máy đang nghĩ…') : '') + ` · Bắt được: Đen ${GO.cap[1]}, Trắng ${GO.cap[2]}` + (GO.pass ? ' · bên kia vừa bỏ lượt' : '');
}
function goUndo(){ if(GO.busy || !GO.hist.length) return; let k = GO.mode === 'ai' ? Math.min(2, GO.hist.length) : 1, h; while(k--) h = GO.hist.pop(); Object.assign(GO, {b:h.b, prev:h.prev, cap:h.cap, turn:h.turn, last:h.last, pass:h.pass, over:false}); goDraw(); goStatus(); }

