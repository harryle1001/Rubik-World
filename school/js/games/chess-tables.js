// ================= EXT: CHESS PIECES & DRAG =================
var cDrag = null, cSuppress = false;
function chessPieceImg(p){ const im = el('img', {src:PIECE_SRC[pKey(p)], alt:'', draggable:false, className:'pimg'}); return im; }
function chessDragInit(){
  const bd = $('#cboard');
  bd.addEventListener('pointerdown', e => {
    const sq = e.target.closest('.sq'); if(!sq || !chessGame || chessGame.game_over() || cAiBusy) return;
    const p = chessGame.get(sq.dataset.sq), mine = myColor();
    if(!p || p.color !== chessGame.turn() || mine !== chessGame.turn()) return;
    cDrag = {from:sq.dataset.sq, x0:e.clientX, y0:e.clientY, on:false, ghost:null, src:sq.querySelector('.pimg'), w:sq.getBoundingClientRect().width};
  });
  window.addEventListener('pointermove', e => {
    if(!cDrag) return;
    if(!cDrag.on && Math.hypot(e.clientX - cDrag.x0, e.clientY - cDrag.y0) > 6){
      cDrag.on = true; cSel = cDrag.from; renderChess();
      const g = el('img', {src:PIECE_SRC[pKey(chessGame.get(cDrag.from))], alt:'', className:'pghost'}); g.style.width = g.style.height = cDrag.w + 'px'; document.body.appendChild(g); cDrag.ghost = g;
      const s = $('#cboard').querySelector(`[data-sq="${cDrag.from}"] .pimg`); if(s) s.style.opacity = '.25';
    }
    if(cDrag.on && cDrag.ghost){ cDrag.ghost.style.left = (e.clientX - cDrag.w/2) + 'px'; cDrag.ghost.style.top = (e.clientY - cDrag.w/2) + 'px'; }
  });
  window.addEventListener('pointerup', e => {
    if(!cDrag) return; const d = cDrag; cDrag = null;
    if(!d.on) return;
    if(d.ghost) d.ghost.remove();
    cSuppress = true; setTimeout(() => { cSuppress = false; }, 0);
    const t = document.elementFromPoint(e.clientX, e.clientY), sq = t && t.closest && t.closest('#cboard .sq');
    if(sq && sq.dataset.sq !== d.from){
      if(chessGame.moves({square:d.from, verbose:true}).some(m => m.to === sq.dataset.sq)){ cSel = d.from; chessClick(sq.dataset.sq); return; }
      chessSfx('illegal');
    }
    renderChess();
  });
}

// ================= EXT: 5 LIVE CHESS TABLES =================
var TABLES = [];
function initTables(){
  if(typeof Chess !== 'function') return;
  for(let i=0;i<5;i++) TABLES.push({g:new Chess(), next:2 + i*.7, over:0, result:'', moves:0, last:null});
}
const seatPos = (t, s) => [CHESS_T[t][0] + (s ? 30 : -30), CHESS_T[t][1] + 14];
function seatAgent(t, s){ const [x, y] = seatPos(t, s); return agents.find(a => a.visible && !a.inSub && !a.flying && !a.moving && !a.boat && Math.abs(a.x - x) < 14 && Math.abs(a.y - y) < 14); }
function seatFill(t, s){ return isDay() && !(festival) ? Object.assign(lookFor(t*2 + s + 3), {x:seatPos(t,s)[0], y:seatPos(t,s)[1], dir:s ? -1 : 1, icon:'chess', npcName:NPC_NAMES[(t*2 + s) % NPC_NAMES.length]}) : null; }
function tablePlayers(t){ return [0,1].map(s => { const a = seatAgent(t, s); return a ? {name:a.name, a} : (seatFill(t, s) ? {name:'Bạn ' + NPC_NAMES[(t*2 + s) % NPC_NAMES.length], f:true} : null); }); }
function tableMove(g){
  const ms = g.moves({verbose:true}); if(!ms.length) return null;
  let best = null, bs = -1e9;
  for(const m of ms){
    let s = Math.random()*90;
    if(m.captured) s += PV[m.captured] - PV[m.piece]*.1;
    if(m.flags.includes('p')) s += 700;
    g.move(m); if(g.in_checkmate()) s += 5000; else if(g.in_check()) s += 40;
    const opp = g.moves({verbose:true}); let worst = 0; for(const o of opp) if(o.captured) worst = Math.max(worst, PV[o.captured]); s -= worst*.85;
    g.undo();
    if(s > bs){ bs = s; best = m; }
  }
  return best;
}
function updateTables(dtR){
  TABLES.forEach((T, i) => {
    const pl = tablePlayers(i); if(!pl[0] || !pl[1]) return;
    T.next -= dtR; if(T.next > 0) return;
    if(T.over){ T.g.reset(); T.over = 0; T.result = ''; T.moves = 0; T.last = null; T.next = 2; if(watchT === i) renderWatch(); return; }
    const m = tableMove(T.g); const r = m ? T.g.move(m) : null; T.moves++;
    if(r) T.last = {from:r.from, to:r.to};
    T.next = 2.2 + Math.random()*3.2;
    const near = cam.z > .9 && inVB(CHESS_T[i][0], CHESS_T[i][1]) && !openModal;
    if(r && (near || watchT === i)) chessSfxFor(r, T.g);
    if(T.g.game_over() || T.moves > 220){
      T.over = 1; T.next = 6;
      const w = T.g.in_checkmate() ? (T.g.turn() === 'w' ? pl[1].name : pl[0].name) : null;
      T.result = w ? `${w} chiếu hết, thắng ván!` : 'Ván cờ hòa.';
      if(near || watchT === i) log('event', `Bàn cờ ${i+1}: ${T.result}`);
    }
    if(watchT === i) renderWatch();
  });
}
function drawChessTable(i, x, y){
  rect('#4a2a12', x-27, y-25, 54, 48); rect('#6b3e1e', x-25, y-23, 50, 44);
  const T = TABLES[i], s = 5, bx = x - 20, by = y - 22;
  for(let r=0;r<8;r++) for(let f=0;f<8;f++) rect((r + f)%2 ? '#739552' : '#ebecd0', bx + f*s, by + r*s, s, s);
  if(!T) return;
  if(T.last){ ['from','to'].forEach(k => { const f = T.last[k].charCodeAt(0) - 97, r = 8 - +T.last[k][1]; rect('rgba(255,255,51,.55)', bx + f*s, by + r*s, s, s); }); }
  const bd = T.g.board();
  const big = cam.z*s >= 7;
  for(let r=0;r<8;r++) for(let f=0;f<8;f++){ const p = bd[r][f]; if(!p) continue;
    const im = PIMG[pKey(p)];
    if(big && im.complete && im.naturalWidth) ctx.drawImage(im, bx + f*s - .3, by + r*s - .6, s + .6, s + .6);
    else { rect(p.color === 'w' ? '#fff' : '#111', bx + f*s + 1, by + r*s + 1, 3, 3); }
  }
  ctx.font = '11px VT323, monospace'; ctx.fillStyle = '#3a2410'; ctx.textAlign = 'center'; ctx.fillText('Bàn ' + (i+1), x, y + 32); ctx.textAlign = 'left';
}
function tableSprites(sp){
  CHESS_T.forEach((_, t) => [0,1].forEach(s => { if(seatAgent(t, s)) return; const f = seatFill(t, s); if(f && inVB(f.x, f.y)) sp.push({y:f.y, f:() => { ctx.save(); ctx.translate(f.x, f.y); drawBody(f, false); ctx.restore(); }}); }));
}
var watchT = -1;
function openWatch(i){ watchT = i; showModal('mWatch'); renderWatch(); }
function renderWatch(){
  if(watchT < 0) return;
  const T = TABLES[watchT]; if(!T) return;
  const bd = $('#wboard'); bd.innerHTML = '';
  const b = T.g.board();
  for(let r=0;r<8;r++) for(let f=0;f<8;f++){
    const d = el('div', {className:'sq ' + ((f + r) % 2 ? 'd' : 'l')}); const name = 'abcdefgh'[f] + (8 - r);
    if(T.last && (T.last.from === name || T.last.to === name)) d.classList.add('last');
    const p = b[r][f]; if(p) d.appendChild(chessPieceImg(p));
    if(p && p.type === 'k' && p.color === T.g.turn() && T.g.in_check()) d.classList.add('chk');
    bd.appendChild(d);
  }
  const pl = tablePlayers(watchT);
  $('#wplayers').textContent = `Trắng: ${pl[0] ? pl[0].name : 'ghế trống'}   ·   Đen: ${pl[1] ? pl[1].name : 'ghế trống'}`;
  $('#wstatus').textContent = T.result || (!pl[0] || !pl[1] ? 'Bàn đang chờ đủ 2 người chơi.' : `Lượt ${T.g.turn() === 'w' ? 'Trắng' : 'Đen'} đang nghĩ…` + (T.g.in_check() ? ' (đang bị chiếu)' : ''));
  const h = T.g.history(); $('#wmoves').textContent = h.slice(-12).map((m, k) => m).join('  ');
  document.querySelectorAll('#wtabs button').forEach((x, k) => x.setAttribute('aria-pressed', k === watchT));
}
function chessRoomClick(wx, wy){
  const i = CHESS_T.findIndex(([x, y]) => Math.abs(wx - x) < 40 && Math.abs(wy - y) < 34);
  if(i >= 0 && TABLES[i]) openWatch(i); else openChess();
}

