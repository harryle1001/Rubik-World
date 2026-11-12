// ================= CHESS =================
const PNAME = {k:'Vua', q:'Hậu', r:'Xe', b:'Tượng', n:'Mã', p:'Tốt'};
const PV = {p:100, n:320, b:330, r:500, q:900, k:0};
let chessGame = (typeof Chess === 'function') ? new Chess() : null;
let cMode = 'local', cFlip = false, cSel = null, cLast = null, cAiColor = 'b', cAiBusy = false, cOverCounted = false;
const cOnline = {db:null, user:null, me:null, ref:null, unsub:null, code:'', data:null, tried:false};
function openChess(){ showModal('mChess'); renderChess(); }
function chessStatus(){
  if(!chessGame) return 'Không tải được thư viện cờ vua.';
  const turn = chessGame.turn();
  if(chessGame.in_checkmate()) return `Chiếu hết! ${turn === 'w' ? 'Đen' : 'Trắng'} thắng.`;
  if(chessGame.in_stalemate()) return 'Hết nước đi hợp lệ: hòa.';
  if(chessGame.in_threefold_repetition()) return 'Lặp lại thế cờ 3 lần: hòa.';
  if(chessGame.insufficient_material()) return 'Không đủ quân để chiếu hết: hòa.';
  if(chessGame.in_draw()) return 'Hòa theo luật 50 nước.';
  return `Lượt ${turn === 'w' ? 'Trắng' : 'Đen'} đi${chessGame.in_check() ? ' · đang bị chiếu!' : ''}`;
}
function renderChess(){
  const bd = $('#cboard');
  if(!chessGame){ bd.textContent = 'Không tải được thư viện cờ vua. Kiểm tra mạng rồi mở lại trang.'; return; }
  bd.innerHTML = '';
  const board = chessGame.board(), legal = cSel ? chessGame.moves({square:cSel, verbose:true}) : [], turn = chessGame.turn(), inChk = chessGame.in_check();
  for(let row=0; row<8; row++) for(let col=0; col<8; col++){
    const r = cFlip ? row : 7 - row, f = cFlip ? 7 - col : col, name = 'abcdefgh'[f] + (r + 1), piece = board[7 - r][f];
    const b = el('button', {type:'button', className:'sq ' + ((f + r) % 2 ? 'l' : 'd')});
    b.dataset.sq = name; if(piece) b.appendChild(chessPieceImg(piece));
    b.setAttribute('aria-label', piece ? `${name}: ${PNAME[piece.type]} ${piece.color === 'w' ? 'Trắng' : 'Đen'}` : name);
    if(name === cSel) b.classList.add('sel');
    if(cLast && (name === cLast.from || name === cLast.to)) b.classList.add('last');
    if(inChk && piece && piece.type === 'k' && piece.color === turn) b.classList.add('chk');
    if(legal.some(m => m.to === name)) b.appendChild(el('span', {className: piece ? 'cap' : 'dot'}));
    if(col === 0){ const c = el('span', {className:'coord r'}); c.textContent = r + 1; b.appendChild(c); }
    if(row === 7){ const c = el('span', {className:'coord f'}); c.textContent = 'abcdefgh'[f]; b.appendChild(c); }
    b.onclick = () => { if(!cSuppress) chessClick(name); };
    bd.appendChild(b);
  }
  $('#cstatus').textContent = chessStatus();
  const h = chessGame.history(), ol = $('#cmoves'); ol.innerHTML = '';
  for(let i=0;i<h.length;i+=2){ const li = el('li'); li.textContent = h[i] + (h[i+1] ? '   ' + h[i+1] : ''); ol.appendChild(li); }
  ol.scrollTop = ol.scrollHeight;
  $('#cundo').disabled = cMode === 'online' || !h.length;
  renderPlayers();
}
function myColor(){
  if(cMode === 'local') return chessGame.turn();
  if(cMode === 'ai') return cAiColor === 'b' ? 'w' : 'b';
  const d = cOnline.data; if(!d || !cOnline.me) return null;
  if(d.white === cOnline.me && d.black === cOnline.me) return chessGame.turn();
  return d.white === cOnline.me ? 'w' : d.black === cOnline.me ? 'b' : null;
}
function chessClick(sq){
  if(!chessGame || chessGame.game_over() || cAiBusy) return;
  const mine = myColor();
  if(!mine || mine !== chessGame.turn()){ if(cMode === 'online') $('#conlineMsg').textContent = mine ? 'Chưa tới lượt bạn.' : 'Bạn đang xem. Bấm Ngồi quân Trắng hoặc Đen để chơi.'; return; }
  if(cSel && chessGame.moves({square:cSel, verbose:true}).some(m => m.to === sq)){ doChessMove({from:cSel, to:sq, promotion:'q'}); return; }
  const p = chessGame.get(sq);
  cSel = (p && p.color === chessGame.turn() && cSel !== sq) ? sq : null;
  renderChess();
}
function doChessMove(m){
  const r = chessGame.move(m); if(!r) return;
  chessSfxFor(r, chessGame);
  cSel = null; cLast = {from:r.from, to:r.to};
  renderChess(); chessOver();
  if(cMode === 'online') pushOnline();
  if(cMode === 'ai' && !chessGame.game_over() && chessGame.turn() === cAiColor) setTimeout(aiMove, 200);
}
function chessOver(){
  if(!chessGame.game_over() || cOverCounted) return;
  cOverCounted = true; mprog('chess');
  if(cMode === 'ai' && chessGame.in_checkmate() && chessGame.turn() === cAiColor){ mprog('chessai'); reward(60, 20, 'Thắng cờ vua với máy'); } else reward(20, 8, 'Chơi xong một ván cờ vua');
  log('event', 'Ván cờ vua kết thúc: ' + chessStatus());
}
function evalBoard(g){
  let s = 0; const b = g.board();
  for(let r=0;r<8;r++) for(let f=0;f<8;f++){ const p = b[r][f]; if(!p) continue; let v = PV[p.type];
    if(p.type === 'p') v += (p.color === 'w' ? 6 - r : r - 1)*6;
    if(p.type === 'n' || p.type === 'b') v += (3.5 - Math.abs(3.5 - f))*4 + (3.5 - Math.abs(3.5 - r))*4;
    s += p.color === 'w' ? v : -v; }
  return s;
}
function cSearch(g, depth, alpha, beta, maxi){
  if(g.in_checkmate()) return maxi ? -99999 - depth : 99999 + depth;
  if(g.game_over()) return 0;
  if(depth === 0) return evalBoard(g);
  const moves = g.moves({verbose:true}); moves.sort((a, b) => (b.captured ? PV[b.captured] : 0) - (a.captured ? PV[a.captured] : 0));
  let best = maxi ? -Infinity : Infinity;
  for(const m of moves){ g.move(m); const v = cSearch(g, depth - 1, alpha, beta, !maxi); g.undo();
    if(maxi){ best = Math.max(best, v); alpha = Math.max(alpha, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
    if(beta <= alpha) break; }
  return best;
}
function aiMove(){
  if(cAiBusy || !chessGame || chessGame.game_over() || chessGame.turn() !== cAiColor || cMode !== 'ai') return;
  cAiBusy = true; $('#cstatus').textContent = 'Máy đang nghĩ...';
  setTimeout(() => {
    const g = new Chess(chessGame.fen()), maxi = cAiColor === 'w', moves = shuffle(g.moves({verbose:true}));
    let best = null, bestV = maxi ? -Infinity : Infinity;
    for(const m of moves){ g.move(m); const v = cSearch(g, 2, -Infinity, Infinity, !maxi); g.undo(); if(maxi ? v > bestV : v < bestV){ bestV = v; best = m; } }
    cAiBusy = false; if(best && cMode === 'ai') doChessMove({from:best.from, to:best.to, promotion:'q'});
  }, 40);
}
async function renderPlayers(){
  const box = $('#cplayers');
  if(cMode !== 'online'){ box.textContent = cMode === 'ai' ? `Bạn cầm quân ${cAiColor === 'b' ? 'Trắng' : 'Đen'}, máy cầm quân ${cAiColor === 'b' ? 'Đen' : 'Trắng'}.` : 'Hai người thay phiên đi trên cùng máy này.'; return; }
  const d = cOnline.data; if(!d){ box.textContent = ''; return; }
  const ids = [d.white, d.black].filter(Boolean); let ps = {};
  if(cOnline.user && ids.length) ps = await cOnline.user.profiles(ids);
  const nm = id => !id ? '(còn trống)' : id === cOnline.me ? 'Bạn' : ((ps[id] && ps[id].name) || 'Một người bạn');
  box.textContent = `Trắng: ${nm(d.white)} · Đen: ${nm(d.black)}`;
}
function setChessMode(mode){
  cMode = mode; cSel = null; cLast = null; cOverCounted = false;
  document.querySelectorAll('#cmodes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
  $('#conline').hidden = mode !== 'online';
  if(cOnline.unsub && mode !== 'online'){ cOnline.unsub(); cOnline.unsub = null; cOnline.ref = null; cOnline.data = null; }
  if(chessGame) chessGame.reset();
  if(mode === 'online') initOnline();
  renderChess();
}
async function initOnline(){
  if(!cOnline.tried){
    cOnline.tried = true; updateOnlineUI();
    try { if(window.claude && window.claude.use){ const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); cOnline.db = db; cOnline.user = user; cOnline.me = user ? await user.id() : null; } } catch(e){}
  }
  updateOnlineUI();
}
function updateOnlineUI(){
  const ok = !!(cOnline.db && cOnline.me), waiting = cOnline.tried && !cOnline.db && !cOnline.me && !cOnline.done;
  $('#cjoin').disabled = $('#cnew').disabled = !ok;
  $('#cseatW').disabled = $('#cseatB').disabled = !ok || !cOnline.ref;
  if(!ok) $('#conlineMsg').textContent = 'Chơi online cần mở trang trên claude.ai khi đã đăng nhập. Bạn bè cần được chia sẻ trang với quyền Contributor trở lên để đi cờ; người có quyền xem chỉ xem được. Bạn vẫn chơi được 2 người 1 máy hoặc đấu với máy.';
  else if(!cOnline.ref) $('#conlineMsg').textContent = 'Bấm Tạo phòng để lấy mã, gửi mã cho bạn bè. Bạn bè mở trang này, chọn Online với bạn bè, nhập mã rồi bấm Vào phòng.';
}
function joinRoom(code){
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if(!code){ $('#conlineMsg').textContent = 'Nhập mã phòng gồm chữ và số.'; return; }
  if(cOnline.unsub) cOnline.unsub();
  cOnline.code = code; $('#croom').value = code; cOnline.data = null;
  cOnline.ref = cOnline.db.doc('chess/' + code);
  $('#conlineMsg').textContent = `Đang mở phòng ${code}...`;
  const timer = setTimeout(() => { $('#conlineMsg').textContent = `Chưa kết nối được phòng ${code}. Dữ liệu có thể chưa mới, chờ thêm hoặc kiểm tra mạng.`; }, 10000);
  cOnline.unsub = cOnline.ref.onSnapshot(snap => {
    if(!snap.metadata.fromCache) clearTimeout(timer);
    if(!snap.exists){ cOnline.data = null; chessGame.reset(); cLast = null; cOverCounted = false; $('#conlineMsg').textContent = `Phòng ${code} đang trống. Bấm Ngồi quân Trắng hoặc Đen, rồi gửi mã ${code} cho bạn.`; renderChess(); updateOnlineUI(); return; }
    const d = snap.data(); cOnline.data = d;
    const pl = chessGame.history().length; let lr = null; chessGame.reset(); (d.moves || []).forEach(m => { lr = chessGame.move(m); }); if((d.moves || []).length === pl + 1 && lr) chessSfxFor(lr, chessGame);
    const mv = d.moves || []; cLast = mv.length ? mv[mv.length - 1] : null; cSel = null;
    if(!chessGame.game_over()) cOverCounted = false;
    $('#conlineMsg').textContent = `Phòng ${code} · gửi mã này cho bạn bè để cùng vào chơi hoặc xem.`;
    renderChess(); updateOnlineUI(); chessOver();
  }, () => { clearTimeout(timer); $('#conlineMsg').textContent = 'Mất kết nối phòng cờ. Mở lại trang để vào lại.'; });
  updateOnlineUI();
}
async function claimSeat(color){
  const ref = cOnline.ref; if(!ref) return;
  try {
    const lease = await ref.acquire({holder: cOnline.me, ttlMs: 4000});
    if(!lease.acquired){ $('#conlineMsg').textContent = 'Có người đang vào chỗ, thử lại sau giây lát.'; return; }
    const s = await ref.get(); const d = s.exists ? JSON.parse(JSON.stringify(s.data())) : {moves:[], white:null, black:null};
    const key = color === 'w' ? 'white' : 'black';
    if(d[key] && d[key] !== cOnline.me){ $('#conlineMsg').textContent = 'Chỗ này đã có người ngồi.'; return; }
    d[key] = cOnline.me; d.moves = d.moves || []; d.updatedAt = Date.now();
    await ref.set(d);
  } catch(e){ $('#conlineMsg').textContent = e && e.code === 'invalid_argument' ? 'Bạn chỉ có quyền xem phòng này. Chủ trang cần chia sẻ với quyền Contributor trở lên.' : 'Chưa vào được chỗ ngồi, thử lại.'; }
}
async function pushOnline(reset){
  const ref = cOnline.ref; if(!ref) return;
  const d = Object.assign({white:null, black:null}, cOnline.data ? JSON.parse(JSON.stringify(cOnline.data)) : {});
  d.moves = reset ? [] : chessGame.history({verbose:true}).map(m => m.promotion ? {from:m.from, to:m.to, promotion:m.promotion} : {from:m.from, to:m.to});
  d.updatedAt = Date.now();
  try { await ref.set(d); } catch(e){ $('#conlineMsg').textContent = e && e.code === 'invalid_argument' ? 'Nước đi chưa lưu được: bạn chỉ có quyền xem.' : 'Nước đi chưa lưu được, đi lại nước đó.'; }
}
document.querySelectorAll('#cmodes button').forEach(b => b.onclick = () => setChessMode(b.dataset.mode));
$('#cflip').onclick = () => { cFlip = !cFlip; renderChess(); };
$('#cnewgame').onclick = () => {
  cSel = null; cLast = null; cOverCounted = false;
  if(cMode === 'online'){ if(!myColor()){ $('#conlineMsg').textContent = 'Chỉ người đang ngồi chơi mới bắt đầu ván mới được.'; return; } chessGame.reset(); pushOnline(true); }
  else { chessGame.reset(); if(cMode === 'ai' && cAiColor === 'w') setTimeout(aiMove, 200); }
  renderChess();
};
$('#cundo').onclick = () => { if(cMode === 'online' || cAiBusy) return; chessGame.undo(); if(cMode === 'ai' && chessGame.turn() === cAiColor) chessGame.undo(); cSel = null; cLast = null; cOverCounted = false; renderChess(); };
$('#cjoin').onclick = () => joinRoom($('#croom').value);
$('#cnew').onclick = () => { const c = Array.from({length:5}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join(''); joinRoom(c); };
$('#croom').addEventListener('keydown', e => { if(e.key === 'Enter') joinRoom($('#croom').value); });
$('#cseatW').onclick = () => claimSeat('w');
$('#cseatB').onclick = () => claimSeat('b');

