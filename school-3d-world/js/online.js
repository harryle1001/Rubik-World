// ================= EXT13: ONLINE LOBBY, 2-PLAYER GAMES, ACADEMY =================
var ONLINE = {room:null, peers:[], myPeer:null, tried:false, game:null, rid:null, opp:null, seeking:null, invites:[], side:0, chat:[]};
async function onlineInit(){
  if(ONLINE.tried) return ONLINE.room; ONLINE.tried = true;
  try { if(!window.claude || !claude.use) return null; const room = await claude.use('room'); if(!room) return null; ONLINE.room = room;
    room.onPeers(ch => { ONLINE.peers = ch.peers.filter(p => !p.sameTab && p.kind === 'viewer'); try { renderOnlineRoster(); } catch(e){} const me = ch.peers.find(p => p.sameTab); if(me) ONLINE.myPeer = me.peer; if(ONLINE.opp && ch.left.some(p => p.peer === ONLINE.opp)){ toast('Đối thủ đã rời trận.'); onlineEnd(); } renderLobby(); autoMatch(); });
    room.on('invite', m => { if(m.isMe || !m.data || m.data.to !== ONLINE.myPeer) return; ONLINE.invites = ONLINE.invites.filter(i => i.peer !== m.peer); ONLINE.invites.push({peer:m.peer, game:m.data.game, rid:m.data.rid, name:String(m.data.name || 'Ai đó').slice(0, 20), code:m.data.code}); toast(`${String(m.data.name || 'Một bạn').slice(0, 20)} mời bạn chơi ${GAME_NAMES[m.data.game] || 'một trận'}! Mở Đấu trường online để nhận lời.`); renderLobby(); });
    room.on('reply', m => { if(m.isMe || !m.data || m.data.to !== ONLINE.myPeer || m.data.rid !== ONLINE.pending) return; if(m.data.ok){ startOnline(m.data.game, m.data.rid, m.peer, 1, m.data.code); } else { toast('Lời mời bị từ chối.'); ONLINE.pending = null; renderLobby(); } });
    room.on('move', m => { if(m.isMe || !m.data || m.data.rid !== ONLINE.rid || m.peer !== ONLINE.opp) return; onlineMove(m.data); });
    room.on('chat', m => { if(!m.data || typeof m.data.t !== 'string') return; ONLINE.chat.push({n:String(m.data.n || '?').slice(0, 20), t:m.data.t.slice(0, 140), me:m.isMe}); ONLINE.chat = ONLINE.chat.slice(-30); renderChat(); });
    onlinePresence(); return room;
  } catch(e){ ONLINE.room = null; return null; }
}
function onlineHello(){ onlineInit().then(() => onlinePresence()); }
function onlinePresence(){ if(!ONLINE.room) return; ONLINE.room.presence({n:PROF ? PROF.name : 'Khách', l:PROF ? PROF.level : 0, st:ONLINE.game ? 'busy' : ONLINE.seeking ? 'seek' : 'lobby', g:ONLINE.seeking || ONLINE.game || ''}).catch(() => {}); }
const GAME_NAMES = {caro:'Cờ caro', c4:'Cờ thả 4', math:'Đấu toán nhanh', chess:'Cờ vua'};
function openLobby(){ showModal('mLobby'); $('#lbMsg').textContent = 'Đang kết nối đấu trường…'; onlineInit().then(r => { $('#lbMsg').textContent = r ? 'Mời một người đang online, hoặc bấm Tìm trận nhanh để hệ thống tự ghép đối thủ.' : 'Đấu trường online cần mở trang trên claude.ai (và người chơi cùng được chia sẻ trang). Bạn vẫn có thể chơi 2 người trên cùng một máy ở Nhà game 2 người.'; renderLobby(); }); }
function renderLobby(){
  const box = $('#lbList'); if(!box) return; box.innerHTML = '';
  const inv = $('#lbInv'); inv.innerHTML = '';
  ONLINE.invites.forEach(i => { const d = el('div', {className:'lbrow inv'}); const s = el('span'); s.textContent = `${i.name} mời bạn chơi ${GAME_NAMES[i.game] || i.game}`; d.appendChild(s); const a = el('button', {type:'button', className:'primary'}); a.textContent = 'Nhận lời'; a.onclick = () => acceptInvite(i); const r = el('button', {type:'button'}); r.textContent = 'Từ chối'; r.onclick = () => { ONLINE.room && ONLINE.room.emit('reply', {to:i.peer, rid:i.rid, ok:false}).catch(() => {}); ONLINE.invites = ONLINE.invites.filter(x => x !== i); renderLobby(); }; d.appendChild(a); d.appendChild(r); inv.appendChild(d); });
  const peers = ONLINE.peers;
  $('#lbCount').textContent = `${peers.length} người khác đang online`;
  if(!peers.length){ box.appendChild(el('p', {className:'now'}, 'Chưa có ai khác online. Chia sẻ trang này cho bạn bè (quyền Contributor) để cùng thi đấu.')); }
  peers.forEach(p => { const pr = p.presence || {}; const d = el('div', {className:'lbrow'}); const s = el('span'); s.textContent = `${String(pr.n || 'Khách').slice(0, 20)} · Level ${+pr.l || 0} · ${pr.st === 'busy' ? 'đang thi đấu' : pr.st === 'seek' ? 'đang tìm trận ' + (GAME_NAMES[pr.g] || '') : 'đang rảnh'}`; d.appendChild(s); const loc = el('button', {type:'button'}); loc.textContent = 'Xem vị trí'; loc.onclick = () => locatePeer(p); d.appendChild(loc);
    Object.keys(GAME_NAMES).forEach(g => { const b = el('button', {type:'button'}); b.textContent = GAME_NAMES[g]; b.disabled = pr.st === 'busy' || !!ONLINE.game; b.onclick = () => sendInvite(p.peer, g); d.appendChild(b); }); box.appendChild(d); });
  document.querySelectorAll('#lbSeek button').forEach(b => b.setAttribute('aria-pressed', ONLINE.seeking === b.dataset.g));
}
function sendInvite(peer, game){ if(!ONLINE.room) return; const rid = Math.random().toString(36).slice(2, 10), code = game === 'chess' ? Array.from({length:5}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('') : ''; ONLINE.pending = rid; ONLINE.room.emit('invite', {to:peer, game, rid, name:PROF ? PROF.name : 'Khách', code}).then(() => { $('#lbMsg').textContent = `Đã gửi lời mời ${GAME_NAMES[game]}. Chờ đối thủ nhận lời…`; }).catch(() => { $('#lbMsg').textContent = 'Không gửi được lời mời (trang cần quyền Contributor trở lên).'; }); ONLINE.pendingCode = code; }
function acceptInvite(i){ ONLINE.invites = ONLINE.invites.filter(x => x !== i); ONLINE.room.emit('reply', {to:i.peer, rid:i.rid, ok:true, game:i.game, code:i.code}).catch(() => {}); startOnline(i.game, i.rid, i.peer, 2, i.code); }
function autoMatch(){ if(!ONLINE.seeking || ONLINE.game || ONLINE.pending) return; const p = ONLINE.peers.find(p => p.presence && p.presence.st === 'seek' && p.presence.g === ONLINE.seeking); if(p && ONLINE.myPeer && ONLINE.myPeer < p.peer) sendInvite(p.peer, ONLINE.seeking); }
function startOnline(game, rid, opp, side, code){
  Object.assign(ONLINE, {game, rid, opp, side, seeking:null, pending:null}); onlinePresence(); toast(`Bắt đầu trận ${GAME_NAMES[game]} online! Bạn đi ${side === 1 ? 'trước' : 'sau'}.`);
  if(game === 'caro'){ showModal('mCaro'); CARO.mode = 'online'; CARO.side = side; caroNew(); }
  else if(game === 'c4'){ openC4('online', side); }
  else if(game === 'math'){ openMath('online', rid); }
  else if(game === 'chess'){ openChess(); setChessMode('online'); setTimeout(() => { joinRoom(code); setTimeout(() => claimSeat(side === 1 ? 'w' : 'b'), 1800); }, 600); }
}
function onlineSend(d){ if(ONLINE.room && ONLINE.rid) ONLINE.room.emit('move', Object.assign({rid:ONLINE.rid}, d)).catch(() => {}); }
function onlineMove(d){
  if(ONLINE.game === 'caro' && typeof d.i === 'number'){ caroPlay(d.i); if(CARO.over) onlineEnd(); }
  else if(ONLINE.game === 'c4' && typeof d.col === 'number'){ c4Drop(d.col, true); }
  else if(ONLINE.game === 'math' && typeof d.n === 'number'){ MQ.opp = d.n; mathRender(); if(d.n >= 10 && !MQ.over){ MQ.over = true; mathRender('Đối thủ đã đạt 10 điểm trước. Thua trận này!'); onlineEnd(); } }
  else if(d.bye){ toast('Đối thủ đã rời trận.'); onlineEnd(); }
}
function onlineEnd(){ ONLINE.game = null; ONLINE.rid = null; ONLINE.opp = null; onlinePresence(); renderLobby(); }
function renderChat(){ const b = $('#lbChat'); if(!b) return; b.innerHTML = ''; ONLINE.chat.forEach(m => { const d = el('div'); d.textContent = `${m.n}: ${m.t}`; if(m.me) d.className = 'me'; b.appendChild(d); }); b.scrollTop = b.scrollHeight; }
// ---------- CONNECT 4 ----------
var C4 = {b:null, turn:1, mode:'ai', side:1, over:false, win:null, last:-1};
function openC4(mode, side){ showModal('mC4'); C4.mode = mode || C4.mode; C4.side = side || 1; c4New(); }
function c4New(){ C4.b = Array.from({length:6}, () => Array(7).fill(0)); C4.turn = 1; C4.over = false; C4.win = null; C4.last = -1; c4Draw(); }
function c4WinAt(b, r, c, p){ for(const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]){ const cells = [[r, c]]; for(const s of [1, -1]){ let rr = r + dr*s, cc = c + dc*s; while(rr >= 0 && rr < 6 && cc >= 0 && cc < 7 && b[rr][cc] === p){ cells.push([rr, cc]); rr += dr*s; cc += dc*s; } } if(cells.length >= 4) return cells; } return null; }
function c4Drop(col, remote){
  if(C4.over) return false; const b = C4.b; let r = 5; while(r >= 0 && b[r][col]) r--; if(r < 0) return false;
  if(!remote && C4.mode === 'online' && C4.turn !== C4.side) return false;
  b[r][col] = C4.turn; C4.last = r*7 + col; chessSfx('move'); if(!remote && C4.mode === 'online') onlineSend({col});
  const w = c4WinAt(b, r, col, C4.turn); if(w){ C4.over = true; C4.win = w; chessSfx('end'); const iWon = C4.mode === 'two' || (C4.mode === 'ai' ? C4.turn === 1 : C4.turn === C4.side); if(iWon && C4.mode !== 'two'){ reward(50, 10, 'Thắng Cờ thả 4'); mprog('c4'); } if(C4.mode === 'online') onlineEnd(); }
  else if(b[0].every(Boolean)) C4.over = true; else C4.turn = 3 - C4.turn;
  c4Draw(); if(C4.mode === 'ai' && C4.turn === 2 && !C4.over) setTimeout(() => c4Drop(c4AI()), 350); return true;
}
function c4Score(b, p){ let s = 0; const o = 3 - p; const win = (v) => { const a = v.filter(x => x === p).length, e = v.filter(x => !x).length, z = v.filter(x => x === o).length; if(a === 4) return 1e5; if(a === 3 && e === 1) return 50; if(a === 2 && e === 2) return 6; if(z === 3 && e === 1) return -60; return 0; };
  for(let r=0;r<6;r++) for(let c=0;c<7;c++) for(const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]){ const v = []; for(let k=0;k<4;k++){ const rr = r + dr*k, cc = c + dc*k; if(rr < 0 || rr >= 6 || cc < 0 || cc >= 7) break; v.push(b[rr][cc]); } if(v.length === 4) s += win(v); } for(let r=0;r<6;r++) if(b[r][3] === p) s += 4; return s; }
function c4AI(){ const b = C4.b; let best = 3, bs = -1e9; const drop = (bb, c, p) => { let r = 5; while(r >= 0 && bb[r][c]) r--; if(r < 0) return -1; bb[r][c] = p; return r; };
  for(let c=0;c<7;c++){ const bb = b.map(r => r.slice()), r = drop(bb, c, 2); if(r < 0) continue; if(c4WinAt(bb, r, c, 2)) return c; let worst = 1e9; for(let c2=0;c2<7;c2++){ const b2 = bb.map(x => x.slice()), r2 = drop(b2, c2, 1); if(r2 < 0) continue; if(c4WinAt(b2, r2, c2, 1)){ worst = -1e6; break; } worst = Math.min(worst, c4Score(b2, 2)); } const s = (worst === 1e9 ? c4Score(bb, 2) : worst) + Math.random()*3; if(s > bs){ bs = s; best = c; } } return best; }
function c4Draw(){
  const cv = $('#c4Cv'); if(!cv) return; const c = cv.getContext('2d'), S = 64; cv.width = 7*S; cv.height = 6*S + 10; c.fillStyle = '#1565c0'; c.fillRect(0, 0, cv.width, cv.height);
  for(let r=0;r<6;r++) for(let k=0;k<7;k++){ const p = C4.b[r][k], x = k*S + S/2, y = r*S + S/2 + 5; c.fillStyle = p === 1 ? '#ef4b4b' : p === 2 ? '#ffd23f' : '#0d1230'; c.beginPath(); c.arc(x, y, S*.4, 0, 7); c.fill(); if(C4.win && C4.win.some(([a, b2]) => a === r && b2 === k)){ c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke(); } if(r*7 + k === C4.last){ c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } }
  const who = p => p === 1 ? 'Đỏ' : 'Vàng';
  $('#c4St').textContent = C4.over ? (C4.win ? `${who(C4.turn)} thắng với 4 quân liên tiếp!` : 'Hòa!') : `Lượt ${who(C4.turn)}` + (C4.mode === 'ai' ? (C4.turn === 1 ? ' (bạn)' : ' (máy đang nghĩ)') : C4.mode === 'online' ? (C4.turn === C4.side ? ' · tới lượt bạn' : ' · chờ đối thủ') : '');
  document.querySelectorAll('#c4Modes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === C4.mode));
}
// ---------- Ô ĂN QUAN ----------
var OQ = null;
function oqNew(mode){ OQ = {b:[10, 5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5], quan:[true, true], score:[0, 0], turn:0, mode:mode || (OQ && OQ.mode) || 'ai', sel:null, over:false, msg:'', anim:null}; oqDraw(); }
// indices: 0 = quan trái, 1..5 = hàng dưới (người 1), 6 = quan phải, 7..11 = hàng trên (người 2, đi ngược)
const oqSide = i => i >= 1 && i <= 5 ? 0 : i >= 7 && i <= 11 ? 1 : -1;
function oqSim(st, start, dir){
  const b = st.b.slice(); let got = 0, i = start, hand = b[i]; b[i] = 0; const step = k => (k + dir + 12) % 12;
  if(start === 0 || start === 6) return null;
  for(let guard=0; guard<200; guard++){
    while(hand > 0){ i = step(i); b[i]++; hand--; }
    const n1 = step(i);
    if(n1 === 0 || n1 === 6){ if(b[n1] > 0) break; const n2 = step(n1); if(b[n1] === 0 && b[n2] > 0){ got += b[n2]; b[n2] = 0; i = n2; let a = step(i), c2 = step(a); while(b[a] === 0 && b[c2] > 0){ got += b[c2]; b[c2] = 0; i = c2; a = step(i); c2 = step(a); } } break; }
    if(b[n1] > 0){ hand = b[n1]; b[n1] = 0; i = n1; continue; }
    const n2 = step(n1); if(b[n2] > 0){ got += b[n2]; b[n2] = 0; i = n2; let a = step(i), c2 = step(a); while(b[a] === 0 && b[c2] > 0){ got += b[c2]; b[c2] = 0; i = c2; a = step(i); c2 = step(a); } }
    break;
  }
  return {b, got};
}
function oqMove(start, dir){
  if(OQ.over || oqSide(start) !== OQ.turn || !OQ.b[start]) return;
  const r = oqSim(OQ, start, dir); if(!r) return; OQ.b = r.b; OQ.score[OQ.turn] += r.got; OQ.msg = r.got ? `${OQ.turn ? 'Người 2' : 'Người 1'} ăn được ${r.got} điểm!` : 'Mất lượt.'; chessSfx(r.got ? 'capture' : 'move');
  if(OQ.b[0] === 0 && OQ.b[6] === 0){ OQ.over = true; for(let k=1;k<=5;k++){ OQ.score[0] += OQ.b[k]; OQ.b[k] = 0; } for(let k=7;k<=11;k++){ OQ.score[1] += OQ.b[k]; OQ.b[k] = 0; } const w = OQ.score[0] > OQ.score[1] ? 0 : OQ.score[1] > OQ.score[0] ? 1 : -1; OQ.msg = w < 0 ? 'Hòa!' : `${w ? 'Người 2' : 'Người 1'} thắng ${Math.max(...OQ.score)} - ${Math.min(...OQ.score)}!`; if(w === 0 && OQ.mode === 'ai'){ reward(60, 10, 'Thắng Ô ăn quan'); mprog('oaq'); } chessSfx('end'); oqDraw(); return; }
  OQ.turn = 1 - OQ.turn; OQ.sel = null; oqRefill(); oqDraw();
  if(OQ.mode === 'ai' && OQ.turn === 1 && !OQ.over) setTimeout(oqAI, 700);
}
function oqRefill(){ const rows = OQ.turn ? [7,8,9,10,11] : [1,2,3,4,5]; if(rows.every(k => !OQ.b[k])){ rows.forEach(k => { OQ.b[k] = 1; }); OQ.score[OQ.turn] -= 5; OQ.msg += ` ${OQ.turn ? 'Người 2' : 'Người 1'} hết quân, phải rải 5 viên ra.`; } }
function oqAI(){ let best = null, bs = -1e9; [7,8,9,10,11].forEach(k => { if(!OQ.b[k]) return; [1, -1].forEach(d => { const r = oqSim(OQ, k, d); if(!r) return; let s = r.got*10 + Math.random(); if(s > bs){ bs = s; best = [k, d]; } }); }); if(best) oqMove(best[0], best[1]); }
function oqXY(i){ if(i === 0) return [40, 70, 80, 140]; if(i === 6) return [600, 70, 80, 140]; if(i <= 5) return [120 + (i - 1)*96, 140, 96, 70]; return [120 + (11 - i)*96, 70, 96, 70]; }
function oqDraw(){
  const cv = $('#oqCv'); if(!cv || !OQ) return; const c = cv.getContext('2d'); cv.width = 720; cv.height = 300; c.fillStyle = '#6d4c2e'; c.fillRect(0, 0, 720, 300); c.fillStyle = '#d7b98a'; c.fillRect(30, 60, 660, 160);
  for(let i=0;i<12;i++){ const [x, y, w, h] = oqXY(i); c.strokeStyle = '#3e2723'; c.lineWidth = 3; if(i === 0 || i === 6){ c.beginPath(); c.ellipse(x + w/2, y + h/2, w/2, h/2, 0, i === 0 ? Math.PI/2 : -Math.PI/2, i === 0 ? Math.PI*1.5 : Math.PI/2); c.closePath(); c.stroke(); } else c.strokeRect(x, y, w, h);
    if(OQ.sel === i){ c.fillStyle = 'rgba(255,210,63,.4)'; c.fillRect(x, y, w, h); }
    const n = OQ.b[i]; for(let k=0;k<Math.min(n, 24);k++){ const big = (i === 0 || i === 6) && k === 0 && OQ.b[i] >= 10 && OQ.quan[i === 0 ? 0 : 1]; c.fillStyle = big ? '#455a64' : ['#5d4037','#795548','#3e2723'][k%3]; c.beginPath(); c.arc(x + w/2 + Math.cos(k*2.4)*(6 + k*1.2), y + h/2 + Math.sin(k*2.4)*(6 + k), big ? 12 : 4, 0, 7); c.fill(); }
    c.fillStyle = '#1a1206'; c.font = '18px VT323, monospace'; c.fillText(String(n), x + 6, y + 18); }
  c.fillStyle = '#fff'; c.font = '20px VT323, monospace'; c.fillText(`Người 1 (dưới): ${OQ.score[0]} điểm`, 30, 250); c.fillText(`${OQ.mode === 'ai' ? 'Máy' : 'Người 2'} (trên): ${OQ.score[1]} điểm`, 30, 40);
  $('#oqSt').textContent = OQ.over ? OQ.msg : `${OQ.msg ? OQ.msg + ' · ' : ''}Lượt ${OQ.turn ? (OQ.mode === 'ai' ? 'máy' : 'Người 2 (hàng trên)') : 'Người 1 (hàng dưới)'}: bấm một ô của mình rồi chọn hướng rải.`;
  $('#oqDirs').hidden = OQ.sel == null;
}
// ---------- AIR HOCKEY & TANKS (arcade, 2 players) ----------
GAMES.airhockey = {title:'Khúc côn cầu trên bàn', opts:['Đấu máy','2 người 1 máy'], help:'Người 1 (bên trái): WASD hoặc kéo chuột/ngón tay. Người 2 (bên phải): phím mũi tên. Đánh đĩa vào khung thành đối phương. Ai được 7 điểm trước thì thắng.',
  init(o){ return {p:[{x:120, y:225, vx:0, vy:0}, {x:680, y:225, vx:0, vy:0}], d:{x:400, y:225, vx:0, vy:0}, sc:[0, 0], two:o === 1, msg:'', msgT:0}; },
  update(s, dt){ if(s.over) return; s.msgT -= dt; const d = s.d;
    s.p.forEach((p, i) => { const ox = p.x, oy = p.y; let tx = p.x, ty = p.y;
      if(i === 0){ if(ARC.ptr.down){ tx = ARC.ptr.x; ty = ARC.ptr.y; } else { tx += (kd('KeyD') - kd('KeyA') + (s.two ? 0 : (kd('ArrowRight','Right') - kd('ArrowLeft','Left'))))*420*dt; ty += (kd('KeyS') - kd('KeyW') + (s.two ? 0 : (kd('ArrowDown','Down') - kd('ArrowUp','Up'))))*420*dt; } }
      else if(s.two){ tx += (kd('ArrowRight') - kd('ArrowLeft'))*420*dt; ty += (kd('ArrowDown') - kd('ArrowUp'))*420*dt; }
      else { const gx = d.x > 400 ? d.x + 18 : 690, gy = d.x > 400 ? d.y : 225 + (d.y - 225)*.5; tx += clampV(gx - p.x, -330*dt, 330*dt); ty += clampV(gy - p.y, -330*dt, 330*dt); }
      p.x = clampV(tx, i ? 420 : 40, i ? 760 : 380); p.y = clampV(ty, 40, 410); p.vx = (p.x - ox)/dt; p.vy = (p.y - oy)/dt;
      const dx = d.x - p.x, dy = d.y - p.y, dist = Math.hypot(dx, dy); if(dist < 38){ const nx = dx/dist, ny = dy/dist; d.x = p.x + nx*38; d.y = p.y + ny*38; const rel = (d.vx - p.vx)*nx + (d.vy - p.vy)*ny; if(rel < 0){ d.vx -= 1.9*rel*nx; d.vy -= 1.9*rel*ny; kickSfx(.5); } } });
    const sp = Math.hypot(d.vx, d.vy); if(sp > 1100){ d.vx *= 1100/sp; d.vy *= 1100/sp; } d.vx *= Math.pow(.7, dt); d.vy *= Math.pow(.7, dt); d.x += d.vx*dt; d.y += d.vy*dt;
    if(d.y < 28 || d.y > 422){ d.vy *= -.9; d.y = clampV(d.y, 28, 422); kickSfx(.2); }
    const goalY = d.y > 165 && d.y < 285;
    if(d.x < 20){ if(goalY){ s.sc[1]++; this.goal(s, 1); } else { d.vx = Math.abs(d.vx); d.x = 20; } } if(d.x > 780){ if(goalY){ s.sc[0]++; this.goal(s, 0); } else { d.vx = -Math.abs(d.vx); d.x = 780; } } },
  goal(s, who){ s.msg = who ? (s.two ? 'Người 2 ghi điểm!' : 'Máy ghi điểm!') : 'Người 1 ghi điểm!'; s.msgT = 1.2; cheerSfx(); s.d = {x:400, y:225, vx:who ? -120 : 120, vy:0}; if(s.sc[who] >= 7){ s.over = who ? (s.two ? 'Người 2 thắng!' : 'Máy thắng!') : 'Người 1 thắng!'; s.sub = `Tỉ số ${s.sc[0]} - ${s.sc[1]}`; if(!who && !s.two) s.medal = 1; } },
  draw(s, c){ c.fillStyle = '#e3f2fd'; c.fillRect(0, 0, AW, AH); c.strokeStyle = '#ef4b4b'; c.lineWidth = 4; c.beginPath(); c.moveTo(400, 20); c.lineTo(400, 430); c.stroke(); c.beginPath(); c.arc(400, 225, 60, 0, 7); c.stroke(); c.strokeStyle = '#1e88e5'; c.strokeRect(20, 20, 760, 410);
    c.fillStyle = '#263238'; c.fillRect(8, 165, 14, 120); c.fillRect(778, 165, 14, 120);
    const d = s.d; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.arc(d.x + 3, d.y + 4, 16, 0, 7); c.fill(); c.fillStyle = '#212121'; c.beginPath(); c.arc(d.x, d.y, 16, 0, 7); c.fill();
    s.p.forEach((p, i) => { c.fillStyle = i ? '#ffd23f' : '#ef4b4b'; c.beginPath(); c.arc(p.x, p.y, 24, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(p.x, p.y, 10, 0, 7); c.fill(); });
    hud(c, `Người 1  ${s.sc[0]} - ${s.sc[1]}  ${s.two ? 'Người 2' : 'Máy'}`, 'Ai 7 điểm trước thắng'); if(s.msgT > 0) centerText(c, s.msg, 100, 26, '#1565c0'); if(s.over) overlay(c, s.over, s.sub); }};
const TANK_WALLS = [[180, 80, 20, 140], [180, 300, 20, 100], [600, 50, 20, 140], [600, 260, 20, 140], [300, 210, 200, 20], [390, 60, 20, 90], [390, 300, 20, 90], [80, 210, 60, 16], [660, 210, 60, 16]];
GAMES.tanks = {title:'Đấu xe tăng', opts:['Đấu máy','2 người 1 máy'], help:'Người 1: WASD để chạy và quay, Space để bắn. Người 2: phím mũi tên, Enter để bắn. Đạn nảy khỏi tường tối đa 4 lần. Ai trúng 5 phát trước thì thắng.',
  init(o){ return {t:[{x:70, y:80, a:0, cd:0, hp:5, col:'#43a047'}, {x:730, y:370, a:Math.PI, cd:0, hp:5, col:'#e53935'}], b:[], two:o === 1, msg:'', msgT:0}; },
  hitWall(x, y, r){ if(x < 20 + r || x > 780 - r || y < 40 + r || y > 430 - r) return true; return TANK_WALLS.some(([wx, wy, ww, wh]) => x > wx - r && x < wx + ww + r && y > wy - r && y < wy + wh + r); },
  update(s, dt){ if(s.over) return; s.msgT -= dt;
    s.t.forEach((t, i) => { t.cd -= dt; let mv = 0, rt = 0, fire = false;
      if(i === 0){ mv = (kd('KeyW') || (!s.two && kd('ArrowUp','Up')) ? 1 : 0) - (kd('KeyS') || (!s.two && kd('ArrowDown','Down')) ? .6 : 0); rt = (kd('KeyD') || (!s.two && kd('ArrowRight','Right')) ? 1 : 0) - (kd('KeyA') || (!s.two && kd('ArrowLeft','Left')) ? 1 : 0); fire = kd('Space','Act'); }
      else if(s.two){ mv = (kd('ArrowUp') ? 1 : 0) - (kd('ArrowDown') ? .6 : 0); rt = (kd('ArrowRight') ? 1 : 0) - (kd('ArrowLeft') ? 1 : 0); fire = kd('Enter','Alt'); }
      else { const e = s.t[0], want = Math.atan2(e.y - t.y, e.x - t.x), da = Math.atan2(Math.sin(want - t.a), Math.cos(want - t.a)); rt = clampV(da*3, -1, 1); mv = Math.hypot(e.x - t.x, e.y - t.y) > 200 ? .8 : -.2; if(this.hitWall(t.x + Math.cos(t.a)*30, t.y + Math.sin(t.a)*30, 14)) { rt = 1; mv = .3; } fire = Math.abs(da) < .15 && Math.random() < .05; }
      t.a += rt*2.6*dt; const nx = t.x + Math.cos(t.a)*mv*150*dt, ny = t.y + Math.sin(t.a)*mv*150*dt; if(!this.hitWall(nx, ny, 16)){ t.x = nx; t.y = ny; }
      if(fire && t.cd <= 0){ t.cd = .6; s.b.push({x:t.x + Math.cos(t.a)*22, y:t.y + Math.sin(t.a)*22, vx:Math.cos(t.a)*380, vy:Math.sin(t.a)*380, n:0, own:i, life:4}); kickSfx(.4); } });
    s.b.forEach(b => { b.life -= dt; const nx = b.x + b.vx*dt, ny = b.y + b.vy*dt; if(this.hitWall(nx, b.y, 3)){ b.vx *= -1; b.n++; } else b.x = nx; if(this.hitWall(b.x, ny, 3)){ b.vy *= -1; b.n++; } else b.y = ny;
      s.t.forEach((t, i) => { if(b.life > 0 && Math.hypot(t.x - b.x, t.y - b.y) < 16 && !(i === b.own && b.n === 0)){ b.life = 0; t.hp--; kickSfx(1); s.msg = i ? (s.two ? 'Người 1 bắn trúng!' : 'Bắn trúng!') : (s.two ? 'Người 2 bắn trúng!' : 'Bị trúng đạn!'); s.msgT = 1;
        if(t.hp <= 0){ s.over = i ? 'Người 1 thắng!' : (s.two ? 'Người 2 thắng!' : 'Máy thắng!'); s.sub = `Máu còn lại: ${s.t[0].hp} - ${s.t[1].hp}`; if(i && !s.two) s.medal = 1; } } }); });
    s.b = s.b.filter(b => b.life > 0 && b.n <= 4); },
  draw(s, c){ c.fillStyle = '#c5b28a'; c.fillRect(0, 0, AW, AH); c.fillStyle = '#8d6e4a'; c.fillRect(20, 40, 760, 390); c.fillStyle = '#d7c49b'; c.fillRect(24, 44, 752, 382);
    c.fillStyle = '#5d4037'; TANK_WALLS.forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
    s.t.forEach(t => { c.save(); c.translate(t.x, t.y); c.rotate(t.a); c.fillStyle = '#333'; c.fillRect(-16, -14, 32, 6); c.fillRect(-16, 8, 32, 6); c.fillStyle = t.col; c.fillRect(-13, -9, 26, 18); c.fillStyle = '#222'; c.fillRect(0, -3, 22, 6); c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fill(); c.restore(); });
    s.b.forEach(b => { c.fillStyle = '#212121'; c.beginPath(); c.arc(b.x, b.y, 4, 0, 7); c.fill(); });
    hud(c, `Xanh ${'♥'.repeat(Math.max(0, s.t[0].hp))}`, `${'♥'.repeat(Math.max(0, s.t[1].hp))} Đỏ`); if(s.msgT > 0) centerText(c, s.msg, 100, 24, '#3e2723'); if(s.over) overlay(c, s.over, s.sub); }};
// ---------- ACADEMY: SUDOKU, QUICK MATH, MEMORY ----------
var SDK = {g:null, sol:null, given:null, sel:-1, err:0, t0:0, diff:1, done:false};
function sdkSolve(g, count){ const a = g.slice(); let n = 0; const ok = (i, v) => { const r = Math.floor(i/9), c = i % 9; for(let k=0;k<9;k++){ if(a[r*9 + k] === v || a[k*9 + c] === v) return false; } const br = r - r%3, bc = c - c%3; for(let y=0;y<3;y++) for(let x=0;x<3;x++) if(a[(br + y)*9 + bc + x] === v) return false; return true; };
  const rec = () => { const i = a.indexOf(0); if(i < 0){ n++; return n >= (count || 1); } const vs = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - .5); for(const v of vs){ if(ok(i, v)){ a[i] = v; if(rec()) return true; a[i] = 0; } } return false; };
  rec(); return count ? n : a; }
function sdkNew(diff){ SDK.diff = diff != null ? diff : SDK.diff; const sol = sdkSolve(Array(81).fill(0)); const g = sol.slice(); const keep = [40, 32, 27][SDK.diff]; const order = [...Array(81).keys()].sort(() => Math.random() - .5); let filled = 81;
  for(const i of order){ if(filled <= keep) break; const v = g[i]; g[i] = 0; if(sdkSolve(g, 2) !== 1){ g[i] = v; } else filled--; }
  Object.assign(SDK, {g, sol, given:g.map(v => v > 0), sel:-1, err:0, t0:Date.now(), done:false}); sdkDraw(); }
function sdkDraw(){ const box = $('#sdkGrid'); if(!box) return; box.innerHTML = ''; SDK.g.forEach((v, i) => { const b = el('button', {type:'button', className:'sc' + (SDK.given[i] ? ' given' : '') + (i === SDK.sel ? ' sel' : '') + (v && !SDK.given[i] && v !== SDK.sol[i] ? ' bad' : '')}); const r = Math.floor(i/9), c = i % 9; if(c % 3 === 2 && c < 8) b.classList.add('br'); if(r % 3 === 2 && r < 8) b.classList.add('bb'); if(SDK.sel >= 0 && v && SDK.g[SDK.sel] === v) b.classList.add('same'); b.textContent = v || ''; b.onclick = () => { SDK.sel = i; sdkDraw(); }; box.appendChild(b); }); $('#sdkSt').textContent = SDK.done ? `Hoàn thành trong ${Math.round((SDK.doneT - SDK.t0)/1000)} giây!` : `Lỗi: ${SDK.err} · đã điền ${SDK.g.filter(Boolean).length}/81`; }
function sdkPut(v){ const i = SDK.sel; if(i < 0 || SDK.given[i] || SDK.done) return; SDK.g[i] = v; if(v && v !== SDK.sol[i]){ SDK.err++; chessSfx('illegal'); } else if(v) blipSfx(1200); if(SDK.g.every((x, k) => x === SDK.sol[k])){ SDK.done = true; SDK.doneT = Date.now(); reward([40, 70, 110][SDK.diff], 10, 'Giải xong Sudoku'); mprog('sudoku'); confetti(); } sdkDraw(); }
var MQ = {t:0, sc:0, q:null, mode:'solo', opp:0, over:false, rng:Math.random, raf:0, lvl:1};
function mathQ(){ const R2 = MQ.rng, L = Math.min(5, 1 + Math.floor(MQ.sc/4)), A = n => 1 + Math.floor(R2()*n); let a, b, op, ans;
  const t = Math.floor(R2()*(L >= 3 ? 4 : 3)); if(t === 0){ a = A(10*L); b = A(10*L); op = '+'; ans = a + b; } else if(t === 1){ a = A(10*L) + 5; b = A(a); op = '−'; ans = a - b; } else if(t === 2){ a = A(3 + L*2); b = A(9); op = '×'; ans = a*b; } else { b = A(9) + 1; ans = A(10); a = ans*b; op = '÷'; }
  const opts = new Set([ans]); while(opts.size < 4){ opts.add(Math.max(0, ans + Math.floor(R2()*11) - 5)); } return {q:`${a} ${op} ${b} = ?`, opts:[...opts].sort((x, y) => x - y), a:ans}; }
function openMath(mode, seed){ showModal('mMath'); MQ.mode = mode || 'solo'; MQ.sc = 0; MQ.opp = 0; MQ.over = false; MQ.t = MQ.mode === 'solo' ? 60 : 9999; MQ.rng = seed ? rng([...String(seed)].reduce((a, ch) => a*31 + ch.charCodeAt(0), 7)) : Math.random; MQ.q = mathQ(); mathRender(); cancelAnimationFrame(MQ.raf); MQ.last = performance.now(); MQ.raf = requestAnimationFrame(mathTick); }
function mathTick(now){ if(!openModal || openModal.id !== 'mMath'){ if(MQ.mode === 'online' && !MQ.over){ onlineSend({bye:1}); onlineEnd(); } return; } const dt = (now - MQ.last)/1000; MQ.last = now; if(MQ.mode === 'solo' && !MQ.over){ MQ.t -= dt; if(MQ.t <= 0){ MQ.over = true; mathRender(`Hết giờ! Bạn trả lời đúng ${MQ.sc} câu.`); if(MQ.sc >= 15){ mprog('math'); } reward(10 + MQ.sc*3, MQ.sc >= 15 ? 10 : 0, 'Toán nhanh ' + MQ.sc + ' câu'); return; } $('#mqTime').textContent = Math.ceil(MQ.t) + ' giây'; } MQ.raf = requestAnimationFrame(mathTick); }
function mathAnswer(v, b){ if(MQ.over) return; if(v === MQ.q.a){ MQ.sc++; blipSfx(1320); if(MQ.mode === 'online'){ onlineSend({n:MQ.sc}); if(MQ.sc >= 10){ MQ.over = true; mathRender('Bạn đạt 10 điểm trước. THẮNG!'); reward(60, 10, 'Thắng đấu toán online'); mprog('online'); onlineEnd(); return; } } } else { chessSfx('illegal'); if(MQ.mode === 'solo') MQ.t -= 3; b.classList.add('bad'); } MQ.q = mathQ(); setTimeout(() => mathRender(), 120); }
function mathRender(msg){ $('#mqQ').textContent = MQ.over ? (msg || 'Kết thúc') : MQ.q.q; const box = $('#mqOpts'); box.innerHTML = ''; if(!MQ.over) MQ.q.opts.forEach(v => { const b = el('button', {type:'button', className:'bqo'}); b.textContent = v; b.onclick = () => mathAnswer(v, b); box.appendChild(b); }); $('#mqScore').textContent = MQ.mode === 'online' ? `Bạn ${MQ.sc} · Đối thủ ${MQ.opp} (ai tới 10 trước thắng)` : `Đúng ${MQ.sc} câu`; if(MQ.mode === 'online') $('#mqTime').textContent = 'Online'; }
var MEM = {cards:[], open:[], done:0, moves:0, lock:false};
const MEM_SYM = ['★','♥','♦','♣','♠','☀','☂','♪','✿','☯','⚓','✈'];
function memNew(){ const n = 8, sy = MEM_SYM.slice().sort(() => Math.random() - .5).slice(0, n); MEM.cards = sy.concat(sy).sort(() => Math.random() - .5).map(s => ({s, up:false, ok:false})); MEM.open = []; MEM.done = 0; MEM.moves = 0; MEM.t0 = Date.now(); memDraw(); }
function memDraw(){ const box = $('#memGrid'); if(!box) return; box.innerHTML = ''; MEM.cards.forEach((c, i) => { const b = el('button', {type:'button', className:'mc' + (c.up || c.ok ? ' up' : '') + (c.ok ? ' ok' : '')}); b.textContent = c.up || c.ok ? c.s : '?'; b.onclick = () => memFlip(i); box.appendChild(b); }); $('#memSt').textContent = MEM.done === 8 ? `Hoàn thành sau ${MEM.moves} lượt, ${Math.round((Date.now() - MEM.t0)/1000)} giây!` : `Lượt lật: ${MEM.moves} · đã ghép ${MEM.done}/8 cặp`; }
function memFlip(i){ const c = MEM.cards[i]; if(MEM.lock || c.up || c.ok) return; c.up = true; MEM.open.push(i); blipSfx(900); if(MEM.open.length === 2){ MEM.moves++; const [a, b] = MEM.open.map(k => MEM.cards[k]); if(a.s === b.s){ a.ok = b.ok = true; MEM.done++; MEM.open = []; blipSfx(1500); if(MEM.done === 8){ reward(MEM.moves <= 14 ? 60 : 35, 10, 'Lật thẻ nhớ'); mprog('memory'); } } else { MEM.lock = true; setTimeout(() => { a.up = b.up = false; MEM.open = []; MEM.lock = false; memDraw(); }, 700); } } memDraw(); }
// ---------- hubs ----------
function openAcademy(){ showModal('mAcademy'); }
function openHall2p(){ showModal('mHall'); }
function ext13Init(){
  document.querySelectorAll('#c4Modes button').forEach(b => b.onclick = () => { C4.mode = b.dataset.m; c4New(); });
  $('#c4Cv').addEventListener('click', e => { const r = e.target.getBoundingClientRect(), col = Math.floor((e.clientX - r.left)/r.width*7); if(C4.mode === 'ai' && C4.turn !== 1) return; c4Drop(col); });
  $('#c4New').onclick = c4New;
  $('#oqCv').addEventListener('click', e => { if(!OQ || OQ.over) return; const r = e.target.getBoundingClientRect(), x = (e.clientX - r.left)/r.width*720, y = (e.clientY - r.top)/r.height*300; for(let i=0;i<12;i++){ const [bx, by, w, h] = oqXY(i); if(x > bx && x < bx + w && y > by && y < by + h && oqSide(i) === OQ.turn && !(OQ.mode === 'ai' && OQ.turn === 1) && OQ.b[i]){ OQ.sel = i; oqDraw(); } } });
  $('#oqL').onclick = () => { if(OQ.sel != null) oqMove(OQ.sel, OQ.sel <= 5 ? -1 : 1); }; $('#oqR').onclick = () => { if(OQ.sel != null) oqMove(OQ.sel, OQ.sel <= 5 ? 1 : -1); };
  document.querySelectorAll('#oqModes button').forEach(b => b.onclick = () => { document.querySelectorAll('#oqModes button').forEach(x => x.setAttribute('aria-pressed', x === b)); oqNew(b.dataset.m); });
  document.querySelectorAll('#sdkDiff button').forEach(b => b.onclick = () => { document.querySelectorAll('#sdkDiff button').forEach(x => x.setAttribute('aria-pressed', x === b)); sdkNew(+b.dataset.d); });
  const pad = $('#sdkPad'); for(let v=0; v<=9; v++){ const b = el('button', {type:'button'}); b.textContent = v || 'Xóa'; b.onclick = () => sdkPut(v); pad.appendChild(b); }
  $('#memNew').onclick = memNew; $('#mqNew').onclick = () => openMath('solo');
  document.querySelectorAll('#lbSeek button').forEach(b => b.onclick = () => { ONLINE.seeking = ONLINE.seeking === b.dataset.g ? null : b.dataset.g; onlinePresence(); renderLobby(); $('#lbMsg').textContent = ONLINE.seeking ? `Đang tìm đối thủ ${GAME_NAMES[ONLINE.seeking]}…` : 'Đã dừng tìm trận.'; autoMatch(); });
  $('#lbSend').onclick = () => { const t = $('#lbText').value.trim().slice(0, 140); if(!t || !ONLINE.room) return; ONLINE.room.emit('chat', {n:PROF ? PROF.name : 'Khách', t}).catch(() => {}); $('#lbText').value = ''; };
  const hub = (sel, list) => { const g = $(sel); list.forEach(([n, d, f], i) => { const b = el('button', {type:'button', className:'olyb'}); b.style.animationDelay = i*40 + 'ms'; b.innerHTML = '<b></b><span></span>'; b.firstChild.textContent = n; b.lastChild.textContent = d; b.onclick = f; g.appendChild(b); }); };
  hub('#acGrid', [['Phòng Rubik', '2×2 · 3×3 · 4×4 · 5×5 · tam giác, có hướng dẫn', () => openLab('3')], ['Học cờ vua', 'Cách đi từng quân, nhập thành, chiếu hết', () => openChessSchool(0)], ['Sudoku', 'Dễ · vừa · khó, luôn có 1 lời giải', () => { showModal('mSudoku'); if(!SDK.g) sdkNew(1); else sdkDraw(); }], ['Toán nhanh', '60 giây, càng đúng càng khó', () => openMath('solo')], ['Lật thẻ nhớ', 'Rèn trí nhớ với 8 cặp thẻ', () => { showModal('mMemory'); memNew(); }], ['Cờ vây', 'Rèn tư duy chiến lược', () => { showModal('mGo'); goDraw(); }]]);
  hub('#hallGrid', [['Khúc côn cầu', '2 người hoặc đấu máy', () => openArcade('airhockey')], ['Đấu xe tăng', 'Đạn nảy tường, 2 người', () => openArcade('tanks')], ['Cờ thả 4', 'Connect 4: 2 người, máy, online', () => openC4('two')], ['Ô ăn quan', 'Trò chơi dân gian Việt Nam', () => { showModal('mOAQ'); oqNew(); }], ['Cờ caro', '2 người hoặc đấu máy', () => { showModal('mCaro'); caroDraw(); }], ['Bóng đá mini', 'Chế độ 2 người 1 máy', () => openArcade('football', 1)], ['Đấu trường online', 'Thi đấu với người chơi khác', () => openLobby()]]);
}

