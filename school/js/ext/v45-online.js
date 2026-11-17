// ================= v45: ĐẤU TRƯỜNG ONLINE 1–4 NGƯỜI (phòng chơi + máy điền chỗ trống) =================
// Lớp mạng nhỏ: V45NET = {ready, list, create, join, leave, start, send, onMessage}.
// Backend: claude room (claude.ai) → BroadcastChannel (nhiều tab cùng máy) → ngoại tuyến (chỉ chơi với máy).
// Firebase (bản Netlify): viết 1 transport {kind, emit(topic, data), on(topic, fn(data, meta{peer}))} rồi gọi v45UseTransport(t).
const V45_PHI = 1.618;
const V45 = {uid:Math.random().toString(36).slice(2, 10), T:null, rooms:{}, room:null, view:'lobby', sel:'math4', seats:4, chat:[], subs:[], hb:0, gs:null, sel2:null};
const V45_BOTS = ['🦊 Máy Cáo', '🐻 Máy Gấu', '🦉 Máy Cú', '🐢 Máy Rùa'];
const V45_CHAT = ['Chào cả nhà! 👋', 'Sẵn sàng! ✅', 'Chờ mình chút ⏳', 'Hay quá! 👏', 'Chúc may mắn 🍀', 'Cảm ơn nhé! 🙏', '😀', '🎉', '👍', '🔥', '😮', '❤️'];
const V45_BAD = /(đ[ịi]t|đ[ụu]|lồn|l[oồ]n|cặc|c[aặ]c|buồi|đéo|đ[eé]o|vãi|chó đẻ|fuck|shit|bitch|dick|sex|địt)/gi;
// g: id, n: tên, i: icon, max: số người tối đa, t: kiểu (native = chơi trong đấu trường, legacy = mở game có sẵn)
const V45_GAMES = [
  {g:'math4', n:'Đấu toán nhanh', i:'➗', max:4, t:'native', d:'Ai trả lời đúng 10 câu trước thắng.'},
  {g:'race', n:'Đua kart toán', i:'🏎️', max:4, t:'native', d:'Né nón, lái qua cổng có đáp án đúng để tăng tốc.'},
  {g:'caro4', n:'Cờ caro bàn lớn', i:'⭕', max:4, t:'native', d:'2 người: 5 ô liền. 3–4 người: 4 ô liền.'},
  {g:'caro', n:'Cờ caro 15×15', i:'❌', max:2, t:'legacy', d:'Cờ caro cổ điển, 5 ô liền thắng.'},
  {g:'c4', n:'Cờ thả 4', i:'🔴', max:2, t:'legacy', d:'Thả quân, 4 quân liền thắng.'},
  {g:'chess', n:'Cờ vua', i:'♟️', max:2, t:'legacy', d:'Đấu 2 người cần mở trên claude.ai.'},
  {g:'oaq', n:'Ô ăn quan', i:'🪨', max:1, t:'legacy', d:'Trò dân gian, đấu với máy.'}
];
const v45G = g => V45_GAMES.find(x => x.g === g) || V45_GAMES[0];
const v45Max = g => { const G = v45G(g); return G.g === 'chess' && (!V45.T || V45.T.kind !== 'claude') ? 1 : G.max; };
function v45Clean(s){ return String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\S*@\S*/g, '').replace(/\d{6,}/g, '').replace(V45_BAD, '***').trim().slice(0, 14) || 'Bạn nhỏ'; }
const v45Name = () => v45Clean(PROF && PROF.name);
const v45Now = () => Date.now();

// ---------- transports ----------
function v45BcTransport(){
  if(typeof BroadcastChannel === 'undefined') return null;
  const ch = new BroadcastChannel('rs-v45-arena'), fns = {};
  ch.onmessage = e => { const m = e.data; if(!m || !m.t || !fns[m.t]) return; fns[m.t].forEach(f => { try { f(m.d, {peer:m.p}); } catch(err){ console.warn('v45', err); } }); };
  return {kind:'tab', emit:(t, d) => { try { ch.postMessage({t, d, p:V45.uid}); } catch(e){} return Promise.resolve(); }, on:(t, f) => { (fns[t] = fns[t] || []).push(f); }};
}
function v45ClaudeTransport(r){ return {kind:'claude', emit:(t, d) => r.emit(t, d).catch(() => {}), on:(t, f) => r.on(t, m => { if(m && !(m.isMe && m.sameTab)) f(m.data, m); })}; }
function v45UseTransport(T){
  V45.T = T; if(!T) return;
  T.on('invite', (d, m) => { if(!d || d.v45 !== 1) return; if(d.k === 'ad' && d.r && typeof d.r.id === 'string'){ const r = d.r; if(r.h === V45.uid) return; r.seen = v45Now(); r.pp = m && m.peer; const sig = v45Sig(); V45.rooms[r.id] = r; if(V45.room && V45.room.id === r.id && !v45IsHost()) v45SyncRoom(r); if(sig !== v45Sig()) v45Paint(); } else if(d.k === 'gone' && typeof d.id === 'string'){ delete V45.rooms[d.id]; if(V45.room && V45.room.id === d.id && !v45IsHost()){ v45Left('Chủ phòng đã đóng phòng.'); } v45Paint(); } });
  T.on('move', (d, m) => { if(!d || d.v45 !== 1 || !V45.room || d.ar !== V45.room.id || d.from === V45.uid) return; v45OnMsg(d, m || {}); V45.subs.forEach(f => { try { f(d); } catch(e){} }); });
}
async function v45Ready(){
  if(V45.T) return V45.T;
  let r = null; try { r = await onlineInit(); } catch(e){}
  if(r){ v45UseTransport(v45ClaudeTransport(r)); return V45.T; }
  const bc = v45BcTransport(); v45UseTransport(bc);
  if(bc && !ONLINE.room){ // cho các game 2 người có sẵn (caro, cờ thả 4) chạy qua nhiều tab
    const mv = []; ONLINE.room = {emit:(t, d) => bc.emit(t, d), on:(t, f) => { if(t === 'move') mv.push(f); }, presence:() => Promise.resolve(), onPeers(){}};
    ONLINE.myPeer = V45.uid; bc.on('move', (d, m) => { if(d && !d.v45 && d.rid && d.rid === ONLINE.rid && m.peer === ONLINE.opp) onlineMove(d); });
  }
  return V45.T;
}
const v45Emit = (topic, d) => V45.T ? V45.T.emit(topic, Object.assign({v45:1, from:V45.uid}, d)) : Promise.resolve();
const v45Send = d => V45.room && v45Emit('move', Object.assign({ar:V45.room.id}, d));
const v45IsHost = () => !!(V45.room && V45.room.h === V45.uid);
const v45Me = () => V45.room ? V45.room.pl.findIndex(p => p.u === V45.uid) : -1;
function v45Ad(){ if(!v45IsHost()) return; const r = V45.room; if(ONLINE.myPeer) r.pl[0].pp = ONLINE.myPeer; v45Emit('invite', {k:'ad', r:{id:r.id, g:r.g, h:r.h, hn:r.hn, max:r.max, st:r.st, pl:r.pl.map(p => ({u:p.u, n:p.n, b:p.b ? 1 : 0, pp:p.pp || ''}))}}); }

// ---------- giao diện phòng: V45NET ----------
const V45NET = {
  ready:v45Ready,
  list:() => Object.values(V45.rooms).filter(r => v45Now() - r.seen < 8000),
  create(g, max){ const id = Math.random().toString(36).slice(2, 8); V45.room = {id, g, h:V45.uid, hn:v45Name(), max:Math.max(1, Math.min(v45Max(g), max)), st:'wait', pl:[{u:V45.uid, n:v45Name(), pp:ONLINE.myPeer || V45.uid}]}; V45.chat = []; v45Ad(); return V45.room; },
  join(id){ const r = V45.rooms[id]; if(!r || r.st !== 'wait' || r.pl.length >= r.max) return false; V45.room = Object.assign({}, r, {pl:r.pl.concat([{u:V45.uid, n:v45Name()}])}); V45.chat = []; V45.joinT = v45Now(); v45Send({k:'join', n:v45Name(), pp:ONLINE.myPeer || V45.uid}); return true; },
  leave(){ if(!V45.room) return; if(v45IsHost()) v45Emit('invite', {k:'gone', id:V45.room.id}); else v45Send({k:'leave'}); v45GameStop(); V45.room = null; },
  start(){ if(!v45IsHost() || V45.room.st !== 'wait') return; const r = V45.room, G = v45G(r.g); let need = r.max; if(r.g === 'caro4' || G.t === 'legacy') need = Math.max(2, need); if(r.g === 'oaq') need = 2; let k = 0; while(r.pl.length < need) r.pl.push({u:'bot' + k, n:V45_BOTS[k++ % 4], b:1}); r.st = 'play'; r.seed = Math.floor(Math.random()*1e9); const code = r.g === 'chess' ? Array.from({length:5}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('') : ''; v45Ad(); v45Send({k:'start', pl:r.pl, seed:r.seed, code}); v45Begin(code); },
  send:d => v45Send({k:'g', d}),
  onMessage:f => { V45.subs.push(f); return () => { V45.subs = V45.subs.filter(x => x !== f); }; }
};
window.V45NET = V45NET;

function v45SyncRoom(r){ if(V45.room.st === 'play') return; V45.room.pl = r.pl; V45.room.max = r.max; if(!r.pl.some(p => p.u === V45.uid)){ if(v45Now() - (V45.joinT || 0) < 5000){ V45.room.pl = r.pl.concat([{u:V45.uid, n:v45Name()}]); return; } v45Left('Phòng đã đủ người hoặc bạn đã rời phòng.'); } }
function v45Left(msg){ v45GameStop(); V45.room = null; V45.view = 'lobby'; toast(msg); v45Paint(); }
function v45OnMsg(d, m){
  const r = V45.room;
  if(d.k === 'join' && v45IsHost()){ if(r.st !== 'wait' || r.pl.length >= r.max || r.pl.some(p => p.u === d.from)){ v45Ad(); return; } r.pl.push({u:String(d.from).slice(0, 12), n:v45Clean(d.n), pp:String(m.peer || d.pp || d.from).slice(0, 40)}); v45ChatAdd(v45Clean(d.n), 'đã vào phòng 🚪'); v45Ad(); v45Paint(); }
  else if(d.k === 'leave' && v45IsHost()){ const i = r.pl.findIndex(p => p.u === d.from); if(i < 0) return; if(r.st === 'wait') r.pl.splice(i, 1); else { Object.assign(r.pl[i], {b:1, n:'🤖 ' + r.pl[i].n.slice(0, 10)}); if(V45.gs && V45.gs.onLeave) V45.gs.onLeave(i); } v45Ad(); v45Paint(); }
  else if(d.k === 'start' && d.from === r.h && r.st === 'wait' && Array.isArray(d.pl)){ r.pl = d.pl.slice(0, 4).map(p => ({u:String(p.u), n:v45Clean(p.n), b:p.b ? 1 : 0, pp:String(p.pp || '')})); r.st = 'play'; r.seed = +d.seed || 1; v45Begin(String(d.code || '').slice(0, 5)); }
  else if(d.k === 'chat' && typeof d.c === 'number' && V45_CHAT[d.c]){ const p = r.pl.find(p => p.u === d.from); v45ChatAdd(p ? p.n : 'Bạn', V45_CHAT[d.c]); }
  else if(d.k === 'g' && d.d && V45.gs && V45.gs.onMsg){ V45.gs.onMsg(d.d, d.from); }
}
function v45ChatAdd(n, t){ V45.chat.push({n, t}); V45.chat = V45.chat.slice(-20); const b = document.getElementById('v45Chat'); if(b) v45PaintChat(b); }

// ---------- bắt đầu trận ----------
function v45Begin(code){
  const r = V45.room, G = v45G(r.g), me = v45Me();
  if(G.t === 'legacy'){
    const humans = r.pl.filter(p => !p.b), opp = r.pl.find(p => !p.b && p.u !== V45.uid);
    hideModal(); const room = r; V45.room = null; V45.view = 'lobby'; if(room.h === V45.uid) setTimeout(() => v45Emit('invite', {k:'gone', id:room.id}), 400);
    if(humans.length >= 2 && opp){ startOnline(r.g === 'oaq' ? 'c4' : r.g, room.id, opp.pp || opp.u, me === 0 ? 1 : 2, code); return; }
    if(r.g === 'caro'){ showModal('mCaro'); CARO.mode = 'ai'; caroNew(); } else if(r.g === 'c4') openC4('ai'); else if(r.g === 'chess'){ openChess(); setChessMode('ai'); } else { showModal('mOAQ'); oqNew('ai'); }
    toast('Bắt đầu! Máy chơi giúp chỗ trống 🤖'); return;
  }
  V45.view = 'play'; v45Paint(); V45.gs = ({math4:v45Math, race:v45Race, caro4:v45Caro})[r.g](r, me); toast(`Bắt đầu ${G.n}! ${r.pl.some(p => p.b) ? 'Máy chơi giúp chỗ trống 🤖' : ''}`);
}
function v45GameStop(){ if(V45.gs && V45.gs.stop) V45.gs.stop(); V45.gs = null; }
function v45Win(seat, label){ const r = V45.room; if(!r) return; const w = r.pl[seat]; const mine = seat === v45Me(); try { chessSfx('end'); } catch(e){} if(mine){ try { reward(40, 8, 'Thắng Đấu trường: ' + v45G(r.g).n); } catch(e){} } const box = document.getElementById('v45Over'); if(box){ box.hidden = false; box.querySelector('b').textContent = mine ? '🏆 Bạn thắng!' : `🏅 ${w ? w.n : '?'} thắng`; box.querySelector('span').textContent = label || ''; } }
const V45_COL = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'];
const V45_SYM = ['✕', '◯', '△', '□'];

// ---------- GAME 1: đấu toán 1–4 người ----------
function v45Math(r, me){
  const host = v45IsHost(), sc = r.pl.map(() => 0), R = rng(r.seed + me*7919); let q = null, lock = 0, over = false; const timers = [];
  const stage = document.getElementById('v45Stage');
  stage.innerHTML = '<div class="v45mq"><div class="v45q" id="v45Q"></div><div class="v45opts" id="v45Opts"></div><p class="v45tip" id="v45Tip">Trả lời đúng 10 câu trước để thắng!</p></div>';
  const mk = () => { const t = Math.floor(R()*4); let a, b, s, ans; if(t === 0){ a = 2 + Math.floor(R()*48); b = 2 + Math.floor(R()*48); s = `${a} + ${b}`; ans = a + b; } else if(t === 1){ a = 20 + Math.floor(R()*60); b = 2 + Math.floor(R()*a); s = `${a} − ${b}`; ans = a - b; } else if(t === 2){ a = 2 + Math.floor(R()*8); b = 2 + Math.floor(R()*8); s = `${a} × ${b}`; ans = a*b; } else { b = 2 + Math.floor(R()*8); ans = 2 + Math.floor(R()*9); a = b*ans; s = `${a} : ${b}`; } const o = new Set([ans]); while(o.size < 4){ const v = ans + Math.floor(R()*11) - 5; if(v >= 0) o.add(v); } return {s, ans, o:[...o].sort(() => R() - .5)}; };
  const draw = () => { if(over) return; q = q || mk(); document.getElementById('v45Q').textContent = `${q.s} = ?`; const o = document.getElementById('v45Opts'); o.innerHTML = ''; q.o.forEach(v => { const b = el('button', {type:'button', className:'v45opt'}); b.textContent = v; b.onclick = () => pick(v, b); o.appendChild(b); }); };
  const pick = (v, b) => { if(over || v45Now() < lock) return; if(v === q.ans){ chessSfx('move'); q = null; if(host) point(me); else NET({a:'pt'}); draw(); } else { b.classList.add('bad'); lock = v45Now() + 1000; document.getElementById('v45Tip').textContent = 'Sai rồi, chờ 1 giây nhé ⏳'; setTimeout(() => { const t = document.getElementById('v45Tip'); if(t) t.textContent = 'Cố lên!'; }, 1000); } };
  const NET = d => V45NET.send(d);
  const point = s => { if(over || !(s >= 0)) return; sc[s]++; const w = sc[s] >= 10 ? s : -1; NET({a:'st', sc, w}); apply(sc, w); };
  const apply = (S, w) => { S.forEach((v, i) => { sc[i] = v; }); v45Board(r.pl.map((p, i) => ({n:p.n, v:sc[i] + '/10', f:sc[i]/10}))); if(w >= 0 && !over){ over = true; v45Win(w, 'Đấu toán nhanh'); } };
  const botGo = i => { const tick = () => { if(over) return; point(i); timers.push(setTimeout(tick, 2600 + Math.random()*2600)); }; timers.push(setTimeout(tick, 3000 + Math.random()*2000)); }; if(host) r.pl.forEach((p, i) => { if(p.b) botGo(i); });
  draw(); apply(sc, -1);
  return {onMsg(d, from){ if(host && d.a === 'pt'){ const s = r.pl.findIndex(p => p.u === from); if(s >= 0 && !r.pl[s].b) point(s); } else if(!host && d.a === 'st' && from === r.h && Array.isArray(d.sc)) apply(d.sc.map(v => +v || 0), +d.w); }, onLeave:i => botGo(i), stop(){ over = true; timers.forEach(clearTimeout); }};
}

// ---------- GAME 2: cờ caro bàn lớn 2–4 người ----------
function v45Caro(r, me){
  const n = r.pl.length, N = n <= 2 ? 13 : 12, K = n <= 2 ? 5 : 4, host = v45IsHost(); const S = {b:new Array(N*N).fill(-1), t:0, last:-1, w:-1, wl:[]}; let tm = 0;
  const stage = document.getElementById('v45Stage');
  stage.innerHTML = `<div class="v45cw"><canvas id="v45Cv" width="600" height="600" aria-label="Bàn cờ caro ${N}×${N}"></canvas></div><p class="v45tip" id="v45Tip"></p>`;
  const cv = document.getElementById('v45Cv'), cx = cv.getContext('2d');
  const line = (i, p, b) => { const x = i % N, y = Math.floor(i / N); let best = null; for(const [dx, dy] of [[1,0],[0,1],[1,1],[1,-1]]){ const c = [i]; for(const s of [1, -1]){ let xx = x + dx*s, yy = y + dy*s; while(xx >= 0 && yy >= 0 && xx < N && yy < N && b[yy*N + xx] === p){ c.push(yy*N + xx); xx += dx*s; yy += dy*s; } } if(!best || c.length > best.length) best = c; } return best; };
  const draw = () => { const z = 600 / N; cx.fillStyle = '#f4ead2'; cx.fillRect(0, 0, 600, 600); cx.strokeStyle = '#c7b48a'; cx.lineWidth = 1; for(let k=0;k<=N;k++){ cx.beginPath(); cx.moveTo(k*z, 0); cx.lineTo(k*z, 600); cx.moveTo(0, k*z); cx.lineTo(600, k*z); cx.stroke(); }
    if(S.last >= 0){ cx.fillStyle = 'rgba(255,212,59,.45)'; cx.fillRect((S.last % N)*z, Math.floor(S.last / N)*z, z, z); }
    S.wl.forEach(i => { cx.fillStyle = 'rgba(81,207,102,.45)'; cx.fillRect((i % N)*z, Math.floor(i / N)*z, z, z); });
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = `900 ${Math.floor(z*.72)}px Nunito, sans-serif`;
    S.b.forEach((p, i) => { if(p < 0) return; cx.fillStyle = ['#d6336c', '#1c7ed6', '#2b8a3e', '#e67700'][p]; cx.fillText(V45_SYM[p], (i % N + .5)*z, (Math.floor(i / N) + .5)*z + 1); });
    v45Board(r.pl.map((p, i) => ({n:`${V45_SYM[i]} ${p.n}`, v:i === S.t && S.w < 0 ? '◀ lượt' : '', f:i === S.t ? 1 : 0, c:V45_COL[i]})));
    const tip = document.getElementById('v45Tip'); if(tip) tip.textContent = S.w >= 0 ? '' : S.t === me ? `👉 Tới lượt bạn (${V45_SYM[me]}) · ${K} ô liền thắng` : `⏳ Chờ ${r.pl[S.t].n}…`; };
  const play = (i, s) => { if(S.w >= 0 || s !== S.t || S.b[i] !== -1) return false; S.b[i] = s; S.last = i; const l = line(i, s, S.b); if(l.length >= K){ S.w = s; S.wl = l; } else if(S.b.every(v => v >= 0)) S.w = 9; else S.t = (S.t + 1) % n; chessSfx('move'); return true; };
  const pub = () => { V45NET.send({a:'st', b:S.b.map(v => v < 0 ? '.' : v).join(''), t:S.t, l:S.last, w:S.w, wl:S.wl}); };
  const after = () => { draw(); if(S.w >= 0 && S.w < 9) v45Win(S.w, 'Cờ caro bàn lớn'); if(host) botTurn(); };
  const botTurn = () => { clearTimeout(tm); if(S.w >= 0 || !r.pl[S.t].b) return; tm = setTimeout(() => { const s = S.t; let bi = -1, bs = -1; for(let i=0;i<N*N;i++){ if(S.b[i] !== -1) continue; let near = false; for(let dy=-2;dy<=2&&!near;dy++) for(let dx=-2;dx<=2;dx++){ const x = i % N + dx, y = Math.floor(i / N) + dy; if(x >= 0 && y >= 0 && x < N && y < N && S.b[y*N + x] >= 0){ near = true; break; } } if(!near && S.b.some(v => v >= 0)) continue; let sc = Math.random(); for(let p=0;p<n;p++){ const c = line(i, p, S.b).length - 1, v = Math.pow(10, Math.min(c, K)); sc += p === s ? v*1.2 : v; } if(sc > bs){ bs = sc; bi = i; } } if(bi < 0) bi = Math.floor(N*N/2); if(play(bi, s)){ pub(); after(); } }, 500 + Math.random()*400); };
  cv.addEventListener('pointerdown', e => { const b = cv.getBoundingClientRect(), i = Math.floor((e.clientY - b.top)/b.height*N)*N + Math.floor((e.clientX - b.left)/b.width*N); if(S.t !== me || S.w >= 0) return; if(host){ if(play(i, me)){ pub(); after(); } } else if(S.b[i] === -1) V45NET.send({a:'mv', i}); });
  if(host){ pub(); botTurn(); } draw();
  return {onMsg(d, from){ if(host && d.a === 'mv'){ const s = r.pl.findIndex(p => p.u === from); if(s >= 0 && play(+d.i, s)){ pub(); after(); } } else if(!host && d.a === 'st' && from === r.h && typeof d.b === 'string' && d.b.length === N*N){ const prevW = S.w; S.b = [...d.b].map(c => c === '.' ? -1 : +c); S.t = +d.t || 0; S.last = +d.l; S.w = +d.w; S.wl = Array.isArray(d.wl) ? d.wl.slice(0, 12).map(Number) : []; draw(); if(prevW < 0 && S.w >= 0 && S.w < 9) v45Win(S.w, 'Cờ caro bàn lớn'); } }, onLeave:() => { pub(); botTurn(); }, stop(){ clearTimeout(tm); S.w = 99; }};
}

// ---------- GAME 3: đua kart toán 1–4 người ----------
function v45Race(r, me){
  const D = 1500, host = v45IsHost(), R = rng(r.seed), obs = [], gates = []; for(let d=120; d<D-40; d+=55 + Math.floor(R()*45)){ if(d % 300 < 60) continue; obs.push({d, l:Math.floor(R()*3)}); }
  for(let d=300; d<D; d+=300){ const a = 2 + Math.floor(R()*8), b = 2 + Math.floor(R()*8), op = R() < .5, ans = op ? a*b : a + b, o = new Set([ans]); while(o.size < 3){ const v = ans + Math.floor(R()*9) - 4; if(v > 0) o.add(v); } gates.push({d, s:`${a} ${op ? '×' : '+'} ${b}`, ans, o:[...o].sort(() => R() - .5), done:false}); }
  const P = r.pl.map(() => 0); let lane = 1, x = 1, v = 0, slow = 0, boost = 0, t0 = v45Now() + 3000, last = v45Now(), over = false, fin = false, raf = 0, sendT = 0, fx = '', fxT = 0;
  const stage = document.getElementById('v45Stage');
  stage.innerHTML = '<div class="v45rw"><canvas id="v45Cv" width="360" height="582" aria-label="Đường đua, chạm trái hoặc phải để đổi làn"></canvas></div><p class="v45tip">👈 Chạm trái / phải 👉 để đổi làn · qua cổng có đáp án đúng!</p>';
  const cv = document.getElementById('v45Cv'), cx = cv.getContext('2d'), W = 360, H = 582, LW = W/3;
  const steer = k => { lane = Math.max(0, Math.min(2, lane + k)); };
  cv.addEventListener('pointerdown', e => { const b = cv.getBoundingClientRect(); steer(e.clientX - b.left < b.width/2 ? -1 : 1); });
  const key = e => { if(e.key === 'ArrowLeft'){ steer(-1); e.preventDefault(); } if(e.key === 'ArrowRight'){ steer(1); e.preventDefault(); } }; document.addEventListener('keydown', key);
  const bots = r.pl.map((p, i) => p.b ? {i, v:27 + Math.random()*5, slowT:0} : null).filter(Boolean);
  const finish = s => { if(over) return; over = true; V45NET.send({a:'over', w:s}); v45Win(s, 'Đua kart toán'); };
  const loop = () => { raf = requestAnimationFrame(loop); const now = v45Now(), dt = Math.min(.05, (now - last)/1000); last = now; if(now < t0 || over){ render(now); return; }
    const target = now < slow ? 12 : now < boost ? 44 : 32; v += (target - v)*Math.min(1, dt*2.2); P[me] = Math.min(D, P[me] + v*dt); x += (lane - x)*Math.min(1, dt*12);
    obs.forEach(o => { if(!o.hit && Math.abs(o.d - P[me]) < 4 && o.l === lane){ o.hit = true; slow = now + 900; fx = '💥 Va nón!'; fxT = now + 900; try { chessSfx('illegal'); } catch(e){} } });
    gates.forEach(g => { if(!g.done && P[me] >= g.d){ g.done = true; if(g.o[lane] === g.ans){ boost = now + 2200; fx = '⚡ Đúng! Tăng tốc'; try { chessSfx('move'); } catch(e){} } else { slow = now + 1100; fx = `🐢 Sai · ${g.s} = ${g.ans}`; } fxT = now + 1400; } });
    if(host) bots.forEach(b => { if(now < b.slowT) P[b.i] += 13*dt; else { P[b.i] += b.v*dt; if(Math.random() < dt*.35) b.slowT = now + 700 + Math.random()*600; } P[b.i] = Math.min(D, P[b.i]); if(P[b.i] >= D) finish(b.i); });
    if(now - sendT > 300){ sendT = now; V45NET.send(host ? {a:'p', ps:P.map(Math.round)} : {a:'p', p:Math.round(P[me])}); }
    if(P[me] >= D){ if(host) finish(me); else if(!over && !fin){ fin = true; V45NET.send({a:'fin'}); } }
    render(now); };
  const car = (X, Y, z) => { cx.save(); cx.translate(X, Y); cx.rotate(-Math.PI/2); cx.font = z + 'px sans-serif'; cx.fillText('🏎️', 0, 0); cx.restore(); };
  const render = now => { cx.fillStyle = '#3a4a3a'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#555c66'; cx.fillRect(8, 0, W - 16, H); const cam = P[me] - 4, py = d => H - 110 - (d - cam)*8;
    cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 4; cx.setLineDash([22, 22]); cx.lineDashOffset = (cam*8) % 44; [1, 2].forEach(k => { cx.beginPath(); cx.moveTo(k*LW, 0); cx.lineTo(k*LW, H); cx.stroke(); }); cx.setLineDash([]);
    const fy = py(D); if(fy > -20 && fy < H){ for(let k=0;k<12;k++){ cx.fillStyle = k % 2 ? '#fff' : '#111'; cx.fillRect(8 + k*(W - 16)/12, fy - 8, (W - 16)/12, 16); } }
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    obs.forEach(o => { const y = py(o.d); if(y < -30 || y > H + 30) return; cx.font = '34px sans-serif'; cx.fillText(o.hit ? '💨' : '🚧', (o.l + .5)*LW, y); });
    gates.forEach(g => { const y = py(g.d); if(y < -60 || y > H + 40) return; g.o.forEach((val, k) => { cx.fillStyle = g.done ? 'rgba(255,255,255,.15)' : 'rgba(77,171,247,.85)'; cx.fillRect(k*LW + 10, y - 22, LW - 20, 44); cx.fillStyle = '#fff'; cx.font = '800 26px Nunito, sans-serif'; cx.fillText(val, (k + .5)*LW, y + 1); }); cx.fillStyle = '#ffd43b'; cx.font = '800 22px Nunito, sans-serif'; if(!g.done) cx.fillText(`${g.s} = ?`, W/2, y - 40); });
    r.pl.forEach((p, i) => { if(i === me) return; const y = py(P[i]); if(y < -40 || y > H + 40) return; cx.globalAlpha = .6; car((i % 3 + .5)*LW, y, 34); cx.globalAlpha = 1; });
    car((x + .5)*LW, H - 110, 48);
    if(now < t0){ cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#ffd43b'; cx.font = '900 96px Nunito, sans-serif'; cx.fillText(Math.ceil((t0 - now)/1000), W/2, H/2); }
    const ng = gates.find(g => !g.done); cx.fillStyle = 'rgba(11,16,32,.8)'; cx.fillRect(0, 0, W, 44); cx.fillStyle = '#fff'; cx.font = '800 19px Nunito, sans-serif'; cx.fillText(`${Math.round(P[me])}/${D} m${ng ? ' · Cổng tới: ' + ng.s + ' = ?' : ' · Về đích!'}`, W/2, 23);
    if(now < fxT){ cx.fillStyle = 'rgba(11,16,32,.85)'; cx.fillRect(40, H/2 - 30, W - 80, 56); cx.fillStyle = '#fff'; cx.font = '800 22px Nunito, sans-serif'; cx.fillText(fx, W/2, H/2 - 2); }
    if(!raf || now - (render.b || 0) > 250){ render.b = now; v45Board(r.pl.map((p, i) => ({n:p.n, v:Math.round(P[i]) + ' m', f:P[i]/D, c:V45_COL[i]}))); } };
  loop();
  return {onMsg(d, from){ const s = r.pl.findIndex(p => p.u === from); if(d.a === 'p'){ if(Array.isArray(d.ps) && from === r.h) d.ps.forEach((val, i) => { if(i !== me && (r.pl[i].b || i === 0)) P[i] = Math.min(D, +val || 0); }); else if(s >= 0 && s !== me) P[s] = Math.min(D, +d.p || 0); } else if(d.a === 'fin' && host && s >= 0) finish(s); else if(d.a === 'over' && from === r.h && !over){ over = true; v45Win(+d.w, 'Đua kart toán'); } }, onLeave:i => bots.push({i, v:29, slowT:0}), stop(){ over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', key); }};
}

// ---------- vẽ giao diện ----------
function v45Board(rows){ const b = document.getElementById('v45Score'); if(!b) return; b.innerHTML = ''; rows.forEach((x, i) => { const d = el('div', {className:'v45srow'}); const n = el('span'); n.textContent = x.n + (V45.room && V45.room.pl[i] && V45.room.pl[i].u === V45.uid ? ' (bạn)' : ''); if(x.c) n.style.color = x.c; const v = el('b'); v.textContent = x.v; const bar = el('i'); bar.style.width = Math.round(Math.max(0, Math.min(1, x.f || 0))*100) + '%'; if(x.c) bar.style.background = x.c; d.appendChild(n); d.appendChild(v); d.appendChild(bar); b.appendChild(d); }); }
function v45PaintChat(b){ b.innerHTML = ''; V45.chat.forEach(m => { const d = el('div'); const n = el('b'); n.textContent = m.n + ': '; d.appendChild(n); d.appendChild(document.createTextNode(m.t)); b.appendChild(d); }); b.scrollTop = b.scrollHeight; }
function v45Net(){ const k = V45.T ? V45.T.kind : 'off'; return k === 'claude' ? ['🟢', 'Online'] : k === 'tab' ? ['🟡', 'Cùng máy'] : ['⚪', 'Ngoại tuyến · chơi với máy']; }
const v45Sig = () => JSON.stringify([V45NET.list().map(r => [r.id, r.st, r.pl.length]), V45.room && V45.room.pl.map(p => p.n)]);
function v45Paint(){
  const M = document.getElementById('mArena'); if(!M || M.hidden) return; const body = M.querySelector('.v45body'), [dot, lab] = v45Net();
  M.querySelector('#v45Net').textContent = `${dot} ${lab}`;
  if(V45.view === 'play' && V45.room){ if(!body.classList.contains('play')){ body.className = 'v45body play'; body.innerHTML = '<section class="v45main"><div id="v45Stage" class="v45stage"></div></section><aside class="v45side"><h3>🏁 Bảng điểm</h3><div id="v45Score"></div><div class="v45over" id="v45Over" hidden><b></b><span></span><button type="button" class="v45btn pri" id="v45Again">Về sảnh</button></div><h3>💬 Nói nhanh</h3><div id="v45Chat" class="v45chat"></div><div class="v45quick" id="v45Quick"></div><button type="button" class="v45btn" id="v45Quit">🚪 Rời trận</button></aside>'; v45Quick(); body.querySelector('#v45Quit').onclick = () => { V45NET.leave(); V45.view = 'lobby'; v45Paint(); }; body.querySelector('#v45Again').onclick = () => { V45NET.leave(); V45.view = 'lobby'; v45Paint(); }; v45PaintChat(body.querySelector('#v45Chat')); } return; }
  const keep = [...body.children].map(c => c.scrollTop); body.className = 'v45body' + (V45.room ? ' inroom' : '');
  const rooms = V45NET.list().filter(r => r.st === 'wait');
  body.innerHTML = `<section class="v45main"><h3>🚪 Phòng đang chờ <small>${rooms.length ? rooms.length + ' phòng' : ''}</small></h3><div class="v45rooms" id="v45Rooms"></div><h3>🎮 Tất cả game</h3><div class="v45games" id="v45Games"></div></section><aside class="v45side" id="v45Side"></aside>`;
  const rl = body.querySelector('#v45Rooms');
  if(!rooms.length) rl.appendChild(el('p', {className:'v45empty'}, V45.T ? 'Chưa có phòng nào. Chọn game bên dưới rồi bấm “Tạo phòng” nhé!' : 'Không có mạng: vẫn chơi được với máy 🤖'));
  rooms.forEach(r => { const G = v45G(r.g), full = r.pl.length >= r.max; const b = el('button', {type:'button', className:'v45room'}); b.disabled = full || !!V45.room; b.innerHTML = `<span class="ic">${G.i}</span><span class="tx"><b></b><small></small></span><span class="ct">${r.pl.length}/${r.max}</span>`; b.querySelector('b').textContent = G.n; b.querySelector('small').textContent = `Chủ phòng: ${v45Clean(r.hn)}${full ? ' · đã đủ' : ' · bấm để vào'}`; b.onclick = () => { if(V45NET.join(r.id)){ V45.view = 'room'; v45Paint(); } }; rl.appendChild(b); });
  const gl = body.querySelector('#v45Games');
  V45_GAMES.forEach(G => { const b = el('button', {type:'button', className:'v45game'}); b.setAttribute('aria-pressed', V45.sel === G.g); b.disabled = !!V45.room; const mx = v45Max(G.g); b.innerHTML = `<span class="ic">${G.i}</span><b></b><small>${mx > 1 ? '1–' + mx : '1'} người</small>`; b.querySelector('b').textContent = G.n; b.onclick = () => { V45.sel = G.g; V45.seats = Math.min(V45.seats, mx) || mx; v45Paint(); }; gl.appendChild(b); });
  v45PaintSide(body.querySelector('#v45Side')); [...body.children].forEach((c, i) => { c.scrollTop = keep[i] || 0; });
}
function v45PaintSide(s){
  if(!V45.room){ const G = v45G(V45.sel), mx = v45Max(G.g); if(V45.seats > mx) V45.seats = mx;
    s.innerHTML = `<div class="v45hero"><span class="ic">${G.i}</span><div><h3></h3><p></p></div></div><h4>👥 Số người trong trận</h4><div class="v45seg" id="v45Seats"></div><p class="v45tip">Chỗ trống sẽ do máy 🤖 chơi.</p><button type="button" class="v45btn pri" id="v45Create">➕ Tạo phòng</button><button type="button" class="v45btn" id="v45Solo">🤖 Chơi ngay với máy</button>`;
    s.querySelector('h3').textContent = G.n; s.querySelector('p').textContent = G.d;
    const seg = s.querySelector('#v45Seats'); [1, 2, 3, 4].forEach(k => { const b = el('button', {type:'button'}); b.textContent = k; b.disabled = k > mx; b.setAttribute('aria-pressed', k === V45.seats); b.onclick = () => { V45.seats = k; v45Paint(); }; seg.appendChild(b); });
    s.querySelector('#v45Create').onclick = () => { V45NET.create(G.g, V45.seats); V45.view = 'room'; v45ChatAdd('Hệ thống', 'Đã tạo phòng. Chờ bạn bè vào nhé! ⏳'); v45Paint(); };
    s.querySelector('#v45Solo').onclick = () => { V45NET.create(G.g, V45.seats); V45NET.start(); };
    return; }
  const r = V45.room, G = v45G(r.g), host = v45IsHost();
  s.innerHTML = `<div class="v45hero"><span class="ic">${G.i}</span><div><h3></h3><p></p></div></div><h4>👥 Chỗ ngồi (${r.pl.length}/${r.max})</h4><div class="v45seats" id="v45SeatL"></div><h4>💬 Nói nhanh</h4><div id="v45Chat" class="v45chat"></div><div class="v45quick" id="v45Quick"></div><div class="v45act"></div>`;
  s.querySelector('h3').textContent = G.n; s.querySelector('p').textContent = host ? 'Bạn là chủ phòng. Bấm Bắt đầu khi sẵn sàng.' : 'Chờ chủ phòng bấm Bắt đầu…';
  const sl = s.querySelector('#v45SeatL'); for(let i=0;i<r.max;i++){ const p = r.pl[i], d = el('div', {className:'v45seat' + (p ? '' : ' bot')}); d.style.borderColor = V45_COL[i]; d.textContent = p ? `${i === 0 ? '👑 ' : '🙂 '}${p.n}${p.u === V45.uid ? ' (bạn)' : ''}` : '🤖 Máy sẽ chơi'; sl.appendChild(d); }
  v45PaintChat(s.querySelector('#v45Chat')); v45Quick();
  const act = s.querySelector('.v45act');
  if(host){ const b = el('button', {type:'button', className:'v45btn pri', id:'v45Start'}); b.textContent = '▶ Bắt đầu'; b.onclick = () => V45NET.start(); act.appendChild(b); }
  const l = el('button', {type:'button', className:'v45btn'}); l.textContent = '🚪 Rời phòng'; l.onclick = () => { V45NET.leave(); V45.view = 'lobby'; v45Paint(); }; act.appendChild(l);
}
function v45Quick(){ const q = document.getElementById('v45Quick'); if(!q) return; q.innerHTML = ''; V45_CHAT.forEach((t, i) => { const b = el('button', {type:'button'}); b.textContent = t; b.onclick = () => { if(!V45.room) return; v45Send({k:'chat', c:i}); v45ChatAdd(v45Name() + ' (bạn)', t); }; q.appendChild(b); }); }

function v45Open(){
  let M = document.getElementById('mArena');
  if(!M){ M = el('div', {className:'modal', id:'mArena'}); M.setAttribute('role', 'dialog'); M.setAttribute('aria-modal', 'true'); M.setAttribute('aria-label', 'Đấu trường online'); M.hidden = true;
    M.innerHTML = '<div class="v45box"><header class="v45top"><h2>⚔️ Đấu trường</h2><span class="v45net" id="v45Net"></span><button type="button" class="v45x" id="v45Old" title="Mời theo người (kiểu cũ)">👥</button><button type="button" class="v45x" data-close aria-label="Đóng">✕</button></header><div class="v45body"></div></div>';
    document.body.appendChild(M); M.querySelector('[data-close]').onclick = () => { if(V45.room) V45NET.leave(); V45.view = 'lobby'; hideModal(); }; M.querySelector('#v45Old').onclick = () => V45.oldLobby(); }
  if(!V45.room) V45.view = 'lobby'; showModal('mArena'); v45Paint(); v45Ready().then(() => v45Paint());
}
function v45Beat(){
  const M = document.getElementById('mArena');
  if(V45.room && M && M.hidden){ V45NET.leave(); V45.view = 'lobby'; return; }
  if(v45IsHost()) v45Ad();
  else if(V45.room && V45.room.st === 'wait'){ const r = V45.rooms[V45.room.id]; if(!r || v45Now() - r.seen > 8000) v45Left('Mất kết nối với chủ phòng.'); }
  if(V45.view === 'lobby' && M && !M.hidden){ const n = V45NET.list().length; if(n !== V45.lastN){ V45.lastN = n; v45Paint(); } }
}
function v45OnlineInit(){
  V45.oldLobby = openLobby;
  openLobby = v45Open; // mọi nút "Đấu trường / Chơi cùng bạn" mở đấu trường mới; nút 👥 mở sảnh mời cũ
  setInterval(v45Beat, 2000);
  window.addEventListener('pagehide', () => { if(V45.room) V45NET.leave(); });
}
