// ================= v61f · 2/2 CHỐNG KHỰNG: việc nặng chạy dần nền (bàn cờ NPC, bầu trời sao) =================
// Bàn cờ NPC: tableMove thử ~30 nước, mỗi nước lại sinh ~30 nước của đối thủ bằng chess.js → 100–500 ms trong một khung
// (điện thoại, CPU chậm). Giờ cùng cách chọn nước, nhưng thử 2 nước mỗi khung. Bầu trời sao (30 000 chấm) dựng sẵn từng phần
// lúc rảnh thay vì dựng một lần khi người chơi lần đầu nhìn lên trời / bay khinh khí cầu.
const V61F_TM = 2;   // số nước thử mỗi khung
function* v61fTableMove(g){
  const ms = g.moves({verbose:true}); if(!ms.length) return null;
  let best = null, bs = -1e9, n = 0;
  for(const m of ms){
    let s = Math.random()*90;
    if(m.captured) s += PV[m.captured] - PV[m.piece]*.1;
    if(m.flags.includes('p')) s += 700;
    g.move(m); if(g.in_checkmate()) s += 5000; else if(g.in_check()) s += 40;
    const opp = g.moves({verbose:true}); let worst = 0; for(const o of opp) if(o.captured) worst = Math.max(worst, PV[o.captured]); s -= worst*.85;
    g.undo();
    if(s > bs){ bs = s; best = m; }
    if(++n % V61F_TM === 0) yield;
  }
  return best;
}
// như updateTables gốc (js/games/chess-tables.js), chỉ khác: nước đi được tính dần qua nhiều khung
function v61fUpdateTables(dtR){
  TABLES.forEach((T, i) => {
    if(T.v61f){ const r = T.v61f.next(); if(!r.done) return; T.v61f = null; v61fTableDone(T, i, r.value); return; }
    const pl = tablePlayers(i); if(!pl[0] || !pl[1]) return;
    T.next -= dtR; if(T.next > 0) return;
    if(T.over){ T.g.reset(); T.over = 0; T.result = ''; T.moves = 0; T.last = null; T.next = 2; if(watchT === i) renderWatch(); return; }
    T.v61f = v61fTableMove(T.g); const r = T.v61f.next(); if(r.done){ T.v61f = null; v61fTableDone(T, i, r.value); }
  });
}
function v61fTableDone(T, i, m){
  const pl = tablePlayers(i); if(!pl[0] || !pl[1]){ T.next = 1; return; }
  const r = m ? T.g.move(m) : null; T.moves++;
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
}

// bầu trời sao: đúng thuật toán buildStars (js/map.js), chia 2000 chấm mỗi bước
function* v61fStars(){
  if(starCache) return;
  const hgt = NY - SY0, c = document.createElement('canvas'); c.width = W; c.height = hgt; const g = c.getContext('2d');
  let s = 99; const r = () => (s = (s*16807) % 2147483647) / 2147483647;
  for(let i=0;i<14000;i++){ g.fillStyle = `rgba(${200 + r()*55|0},${210 + r()*45|0},255,${.15 + r()*.6})`; g.fillRect(r()*W, r()*hgt, 1, 1); if(i % 2000 === 1999){ yield; if(starCache) return; } }
  for(let i=0;i<16000;i++){ const t = r(); g.fillStyle = `rgba(220,215,255,${.03 + r()*.08})`; g.fillRect(t*W, hgt*.12 + t*hgt*.45 + (r() + r() + r() - 1.5)*70, 2, 2); if(i % 2000 === 1999){ yield; if(starCache) return; } }
  for(let i=0;i<500;i++){ g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(r()*W, r()*hgt, 2, 2); }
  if(!starCache) starCache = c;
}

function v61fPerfInit(){
  if(typeof updateTables === 'function' && typeof TABLES !== 'undefined'){ updateTables = v61fUpdateTables; }
  setTimeout(() => { if(typeof buildStars === 'function') V61F.bg.push(v61fStars()); }, 3000);
}
