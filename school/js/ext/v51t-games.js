// ================= v51t · MINI GAME 1: lập trình khối · 2: thuật toán Rubik · 6: tìm lỗi (debug) =================
// ---------- khối lệnh (thiết kế gốc: màu theo loại, biểu tượng + chữ Việt + chữ Anh) ----------
const V51T_BLK = {
  F:{ic:'⬆️', vi:'Đi', en:'Move', c:'#2fbf71'}, L:{ic:'↩️', vi:'Quay trái', en:'Turn left', c:'#3d7bff'}, R:{ic:'↪️', vi:'Quay phải', en:'Turn right', c:'#3d7bff'},
  P:{ic:'🔁', vi:'Lặp', en:'Repeat', c:'#ff8a2b'}, E:{ic:'⤴️', vi:'Hết lặp', en:'End', c:'#c56a1a'}, I:{ic:'❓', vi:'Nếu trống thì đi, không thì rẽ phải', en:'If clear: move, else turn right', c:'#9b6bff', s:'Nếu trống'}
};
// mê cung: # tường · . đường · S xuất phát · G cờ đích · c khối Rubik cần nhặt. d = hướng đầu (0 Đông, 1 Nam, 2 Tây, 3 Bắc). opt = số khối tốt nhất
const V51T_MAZES = [
  {m:['#######', '#S.c.G#', '#######'], d:0, pal:'F', opt:4, sol:'FFFF', tip:'Robot đi thẳng tới cờ. Kéo 4 khối ⬆️ Đi.'},
  {m:['######', '#S.c##', '###.##', '###.G#', '######'], d:0, pal:'FLR', opt:7, sol:'FFRFFLF', tip:'Tới chỗ rẽ thì quay ↪️ phải hoặc ↩️ trái.'},
  {m:['######', '#S.c.#', '####.#', '#G...#', '######'], d:0, pal:'FLR', opt:10, sol:'FFFRFFRFFF', tip:'Nhặt khối Rubik rồi rẽ hai lần về cờ.'},
  {m:['#########', '#S.....c#', '#######.#', '#######G#', '#########'], d:0, pal:'FLRPE', opt:6, sol:'P6FERP2F', tip:'Dùng 🔁 Lặp: "Lặp 6 lần ⬆️ Đi" ngắn hơn 6 khối Đi!'},
  {m:['#######', '#S.####', '##..###', '###c.##', '####..#', '#####G#', '#######'], d:0, pal:'FLRPE', opt:6, sol:'FP4RFLF', tip:'Bậc thang lặp lại: ↪️ ⬆️ ↩️ ⬆️. Bỏ chúng vào 🔁 Lặp.'},
  {m:['#######', '#S...c#', '#####.#', '#G....#', '#######'], d:0, pal:'FLRPEI', opt:2, sol:'P20I', tip:'Khối ❓ Nếu: phía trước trống thì đi, gặp tường thì rẽ phải. Lặp nó nhiều lần!'},
  {m:['#######', '#...cG#', '#.#####', '#S#####', '#######'], d:3, pal:'FLRPEI', opt:6, sol:'P2FERP4F', tip:'Robot nhìn lên phía Bắc. Đi lên rồi rẽ phải.'},
  {m:['########', '#S..c..#', '#.####.#', '#c#G...#', '########'], d:0, pal:'FLRPEI', opt:9, sol:'RFFRRFFP20I', tip:'Nhặt khối Rubik bên dưới trước, quay lại rồi dùng ❓ Nếu + 🔁 Lặp.'}
];
// tìm lỗi: chương trình có MỘT khối sai. bug = vị trí khối sai, fix = khối đúng (dùng để gợi ý)
const V51T_BUGS = [
  {z:1, p:'FFLFFLF', bug:2, fix:'R', tip:'Robot rẽ nhầm hướng ở khúc quanh đầu tiên.'},
  {z:2, p:'FFFRFFLFFF', bug:6, fix:'R', tip:'Lần rẽ thứ hai sai hướng.'},
  {z:3, p:'P5FERP2F', bug:0, fix:'P6', tip:'Robot dừng sớm một bước: số lần lặp chưa đúng.'},
  {z:4, p:'FP4LFLF', bug:2, fix:'R', tip:'Bậc thang đi xuống bên phải, nhưng khối đầu tiên trong vòng lặp quay sai.'},
  {z:6, p:'P2FELP4F', bug:3, fix:'R', tip:'Sau khi đi lên, robot phải rẽ về phía cờ.'},
  {z:7, p:'RFFRLFFP20I', bug:4, fix:'R', tip:'Muốn quay đầu lại thì quay hai lần cùng một phía.'}
];
// chuỗi "P6FER" → [{k:'P',n:6},{k:'F'},...]
function v51tParse(s){ const out = []; for(let i = 0; i < s.length; i++){ const k = s[i]; if(k === 'P'){ let n = ''; while(/\d/.test(s[i + 1] || '')) n += s[++i]; out.push({k:'P', n:+n || 2}); } else out.push({k}); } return out; }
function v51tMaze(z){ const M = V51T_MAZES[z], g = M.m.map(r => r.split('')); let s = null, goal = null, cubes = 0; g.forEach((r, y) => r.forEach((ch, x) => { if(ch === 'S') s = [x, y]; if(ch === 'G') goal = [x, y]; if(ch === 'c') cubes++; })); return {M, g, s, goal, cubes}; }
const V51T_DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// ---------- khung chung cho 🧩 và 🐞: bản đồ robot (canvas) + dải chương trình + bảng khối ----------
function v51tMazeUi(G, z, prog, opts){
  const S = G.st, mz = v51tMaze(z); S.mz = mz; S.prog = prog; S.z = z; S.run = null; S.runs = 0; S.opts = opts || {};
  G.body.innerHTML = '<div class="v51tmz"><canvas class="v51tmzc"></canvas><div class="v51ttip">' + (opts.tip || mz.M.tip) + '</div></div>' +
    '<div class="v51tprog" aria-label="Chương trình"><div class="v51tpl"></div></div>' +
    '<div class="v51tctl"><button type="button" class="v51tbtn v51tgo">▶ Chạy <small>Run</small></button><button type="button" class="v51tbtn v51tclr">' + (opts.debug ? '↺ Làm lại <small>Reset</small>' : '🧹 Xoá hết <small>Clear</small>') + '</button></div>' +
    '<div class="v51tpal"></div>';
  S.cv = G.body.querySelector('.v51tmzc'); S.list = G.body.querySelector('.v51tpl'); S.pal = G.body.querySelector('.v51tpal');
  G.body.querySelector('.v51tgo').onclick = () => v51tRun(G); G.body.querySelector('.v51tclr').onclick = () => { if(S.run) return; if(opts.debug){ S.prog = v51tParse(opts.orig); S.sel = -1; } else S.prog = []; v51tProgDraw(G); v51tPalDraw(G); v51tMzReset(G); };
  v51tMzReset(G); v51tProgDraw(G); v51tPalDraw(G); v51tMazeSize(G);
  v51tGLoop(G, dt => v51tMzStep(G, dt));
}
function v51tMazeSize(G){ const S = G.st; if(!S.cv) return; const mz = S.mz, cols = mz.g[0].length, rows = mz.g.length, wrap = S.cv.parentNode, W = Math.min(wrap.clientWidth - 8, 560), Hm = Math.max(120, Math.min(innerHeight*.34, 320));
  const cs = Math.floor(Math.min(W/cols, Hm/rows)); S.cs = cs; const dpr = Math.min(2, devicePixelRatio || 1); S.cv.width = cols*cs*dpr; S.cv.height = rows*cs*dpr; S.cv.style.width = cols*cs + 'px'; S.cv.style.height = rows*cs + 'px'; S.dpr = dpr; }
function v51tMzReset(G){ const S = G.st, mz = S.mz; S.bot = {x:mz.s[0], y:mz.s[1], d:mz.M.d, fx:mz.s[0], fy:mz.s[1], fa:mz.M.d*Math.PI/2, bump:0}; S.got = {}; S.trail = []; S.run = null; v51tMzStat(G); }
function v51tMzStat(G){ const S = G.st; v51tGStat('🧩 <b>' + S.prog.length + '</b> khối · 🧊' + Object.keys(S.got).length + '/' + S.mz.cubes + (S.opts.debug ? ' · ▶' + S.runs : ' · 🏁≤' + S.mz.M.opt)); }
// vẽ dải chương trình (kéo thả để đổi chỗ, kéo ra ngoài để xoá, chạm 🔁 để đổi số lần)
function v51tBlockEl(b, small){ const d = V51T_BLK[b.k], e = v51tEl('div', 'v51tblk', '<span>' + d.ic + '</span><b>' + (b.k === 'P' ? 'Lặp ×' + b.n : (d.s || d.vi)) + '</b>' + (small ? '' : '<small>' + d.en + '</small>')); e.style.setProperty('--c', d.c); return e; }
function v51tProgDraw(G){
  const S = G.st, L = S.list; L.innerHTML = ''; let depth = 0;
  S.prog.forEach((b, i) => { if(b.k === 'E') depth = Math.max(0, depth - 1); const e = v51tBlockEl(b, true); e.dataset.i = i; e.style.marginLeft = (depth*12) + 'px'; if(b.k === 'P') depth++;
    if(S.sel === i) e.classList.add('sel'); if(S.run && S.run.cur === i) e.classList.add('cur'); v51tDrag(G, e, 'prog', i); L.appendChild(e); });
  if(!S.prog.length) L.innerHTML = '<div class="v51tempty">' + (S.opts.debug ? '' : '👇 Kéo khối lệnh vào đây · Drag blocks here') + '</div>'; v51tMzStat(G);
}
function v51tPalDraw(G){
  const S = G.st, P = S.pal; P.innerHTML = '';
  if(S.opts.debug){ if(S.sel == null || S.sel < 0){ P.innerHTML = '<div class="v51tempty">🐞 Chạm vào khối em nghĩ là sai, rồi chọn khối thay thế · Tap the buggy block</div>'; return; }
    const cur = S.prog[S.sel], opts = ['F', 'L', 'R', 'I'].filter(k => k !== cur.k).map(k => ({k})); if(cur.k === 'P') [2, 3, 4, 5, 6, 7, 8, 20].filter(n => n !== cur.n).slice(0, 6).forEach(n => opts.unshift({k:'P', n}));
    opts.slice(0, 8).forEach(b => { const e = v51tBlockEl(b); e.onclick = () => { if(S.run) return; S.prog[S.sel] = Object.assign({}, b); S.sel = -1; v51tSnd('pick'); v51tProgDraw(G); v51tPalDraw(G); v51tMzReset(G); }; P.appendChild(e); }); return; }
  S.mz.M.pal.split('').forEach(k => { const b = k === 'P' ? {k, n:3} : {k}, e = v51tBlockEl(b); v51tDrag(G, e, 'pal', b); P.appendChild(e); });
}
// kéo thả bằng ngón tay (pointer events, không cần chuột)
function v51tDrag(G, el, from, data){
  el.addEventListener('pointerdown', e => { const S = G.st; if(S.run || G.end) return; e.preventDefault(); const r = el.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY; let ghost = null, moved = false;
    try { el.setPointerCapture(e.pointerId); } catch(err){}
    const mv = ev => { const dx = ev.clientX - x0, dy = ev.clientY - y0; if(!moved && Math.hypot(dx, dy) > 10){ moved = true; ghost = el.cloneNode(true); ghost.classList.add('v51tghost'); ghost.style.width = r.width + 'px'; document.body.appendChild(ghost); if(from === 'prog') el.classList.add('drag'); }
      if(ghost){ ghost.style.left = (ev.clientX - r.width/2) + 'px'; ghost.style.top = (ev.clientY - r.height/2) + 'px'; v51tDropMark(G, ev.clientX, ev.clientY); } };
    const up = ev => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); if(ghost) ghost.remove(); el.classList.remove('drag'); const S2 = G.st; S2.list.querySelectorAll('.v51tmark').forEach(m => m.remove());
      if(!moved){ v51tTapBlock(G, from, data); return; }
      const at = v51tDropAt(G, ev.clientX, ev.clientY);
      if(from === 'pal'){ if(at >= 0 && !S2.opts.debug){ if(S2.prog.length >= 24){ v51tSay('Tối đa 24 khối nhé!'); return; } S2.prog.splice(at, 0, Object.assign({}, data)); v51tSnd('pick'); } }
      else { const b = S2.prog.splice(data, 1)[0]; if(S2.opts.debug){ S2.prog.splice(data, 0, b); } else if(at >= 0){ S2.prog.splice(at > data ? at - 1 : at, 0, b); v51tSnd('tap'); } else v51tSnd('tap'); }
      v51tProgDraw(G); v51tMzReset(G); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); });
}
function v51tDropAt(G, x, y){ const S = G.st, box = S.list.parentNode.getBoundingClientRect(); if(x < box.left - 10 || x > box.right + 10 || y < box.top - 24 || y > box.bottom + 24) return -1;
  const items = [...S.list.querySelectorAll('.v51tblk')]; for(const it of items){ const r = it.getBoundingClientRect(); if(y < r.top + r.height/2) return +it.dataset.i; } return S.prog.length; }
function v51tDropMark(G, x, y){ const S = G.st; S.list.querySelectorAll('.v51tmark').forEach(m => m.remove()); const at = v51tDropAt(G, x, y); if(at < 0) return; const m = v51tEl('div', 'v51tmark'); const it = S.list.querySelector('.v51tblk[data-i="' + at + '"]'); if(it) S.list.insertBefore(m, it); else S.list.appendChild(m); }
function v51tTapBlock(G, from, data){
  const S = G.st; if(from === 'pal'){ if(S.opts.debug) return; if(S.prog.length >= 24) return; S.prog.push(Object.assign({}, data)); v51tSnd('pick'); }
  else if(S.opts.debug){ S.sel = S.sel === data ? -1 : data; v51tSnd('tap'); v51tPalDraw(G); }
  else { const b = S.prog[data]; if(b.k === 'P'){ b.n = b.n >= 9 ? 2 : b.n + 1; if(b.n === 9) b.n = 20; v51tSnd('tap'); } else { S.prog.splice(data, 1); v51tSnd('tap'); } }
  v51tProgDraw(G); v51tMzReset(G);
}
// chạy chương trình: mỗi bước 0.32 s, có hoạt hình
function v51tRun(G){
  const S = G.st; if(S.run || G.end) return; if(!S.prog.length){ v51tSay('👇 Thêm khối lệnh trước đã!'); return; } v51tMzReset(G); S.runs++;
  const idx = []; (function walk(){ let i = 0; const blk = () => { const out = []; while(i < S.prog.length){ const j = i, b = S.prog[i++]; if(b.k === 'E') return out; if(b.k === 'P'){ const body = blk(); for(let r = 0; r < b.n && out.length < 400; r++) out.push(...body); } else out.push([b.k, j]); } return out; }; while(i < S.prog.length) idx.push(...blk()); })();
  S.run = {steps:idx.slice(0, 400), k:0, t:0, cur:-1}; v51tSnd('boot'); v51tMzStat(G);
}
function v51tMzStep(G, dt){
  const S = G.st, B = S.bot; if(!B) return; B.fx += (B.x - B.fx)*Math.min(1, dt*12); B.fy += (B.y - B.fy)*Math.min(1, dt*12); let ta = B.d*Math.PI/2; while(ta - B.fa > Math.PI) ta -= 2*Math.PI; while(ta - B.fa < -Math.PI) ta += 2*Math.PI; B.fa += (ta - B.fa)*Math.min(1, dt*12); if(B.bump > 0) B.bump -= dt;
  const R = S.run; if(R){ R.t += dt; if(R.t >= .32){ R.t = 0; v51tExec(G); } } v51tMzDraw(G);
}
function v51tExec(G){
  const S = G.st, R = S.run, B = S.bot, mz = S.mz; if(R.k >= R.steps.length){ return v51tRunEnd(G, false, 'Hết lệnh mà robot chưa tới cờ 🚩'); }
  const [k, j] = R.steps[R.k++]; if(R.cur !== j){ R.cur = j; S.list.querySelectorAll('.v51tblk').forEach(e => e.classList.toggle('cur', +e.dataset.i === j)); }
  const fwd = () => { const v = V51T_DIR[B.d], nx = B.x + v[0], ny = B.y + v[1], ch = (mz.g[ny] || [])[nx]; if(!ch || ch === '#'){ B.bump = .3; v51tSnd('bad'); return false; } B.x = nx; B.y = ny; S.trail.push([nx, ny]); v51tSnd('step');
    if(ch === 'c' && !S.got[nx + ',' + ny]){ S.got[nx + ',' + ny] = 1; v51tSnd('pick'); } return true; };
  if(k === 'F'){ if(!fwd()) return v51tRunEnd(G, false, 'Ối! Robot đụng tường 🧱'); }
  else if(k === 'L') B.d = (B.d + 3) % 4; else if(k === 'R') B.d = (B.d + 1) % 4;
  else if(k === 'I'){ const v = V51T_DIR[B.d], ch = (mz.g[B.y + v[1]] || [])[B.x + v[0]]; if(ch && ch !== '#') fwd(); else B.d = (B.d + 1) % 4; }
  v51tMzStat(G);
  if(B.x === mz.goal[0] && B.y === mz.goal[1]){ if(Object.keys(S.got).length >= mz.cubes) return v51tRunEnd(G, true); if(R.k >= R.steps.length) return v51tRunEnd(G, false, 'Tới cờ rồi nhưng còn khối Rubik chưa nhặt 🧊'); }
}
function v51tRunEnd(G, ok, why){
  const S = G.st; S.run = null; S.list.querySelectorAll('.v51tblk').forEach(e => e.classList.remove('cur'));
  if(!ok){ v51tSay('🤖 ' + why + ' Sửa chương trình rồi bấm ▶ nhé!'); setTimeout(() => { if(V51T.game === G && !S.run && !G.end) v51tMzReset(G); }, 900); return; }
  if(S.opts.debug){ const st = S.runs <= 1 ? 3 : S.runs === 2 ? 2 : 1; return v51tGEnd(G, {score:st*100 + Math.max(0, 50 - S.runs*10), stars:st, title:'🐞 Đã sửa xong lỗi!', note:'Em chạy thử ' + S.runs + ' lần. Lập trình viên giỏi luôn chạy thử để tìm lỗi.'}); }
  const n = S.prog.length, opt = S.mz.M.opt, st = n <= opt ? 3 : n <= opt + 3 ? 2 : 1;
  v51tGEnd(G, {score:st*100 + S.mz.cubes*20 + Math.max(0, 30 - n), stars:st, title:'🚩 Robot tới đích!', note:'Em dùng <b>' + n + '</b> khối (tốt nhất: ' + opt + '). ' + (st < 3 ? 'Thử dùng 🔁 Lặp' + (S.mz.M.pal.includes('I') ? ' và ❓ Nếu' : '') + ' cho ngắn hơn!' : 'Chương trình rất gọn! 👏')});
}
function v51tMzDraw(G){
  const S = G.st, c = S.cv, g = c.getContext('2d'), cs = S.cs, mz = S.mz, d = S.dpr, t = performance.now()/1000; g.setTransform(d, 0, 0, d, 0, 0); g.imageSmoothingEnabled = false;
  mz.g.forEach((r, y) => r.forEach((ch, x) => { const X = x*cs, Y = y*cs; if(ch === '#'){ g.fillStyle = '#2b3550'; g.fillRect(X, Y, cs, cs); g.fillStyle = '#3b4664'; g.fillRect(X, Y, cs, 4); return; }
    g.fillStyle = (x + y) % 2 ? '#eef3f8' : '#dde8f2'; g.fillRect(X, Y, cs, cs);
    if(ch === 'G'){ g.fillStyle = '#7d8496'; g.fillRect(X + cs*.3, Y + cs*.15, 3, cs*.7); g.fillStyle = '#ef4b4b'; g.fillRect(X + cs*.3 + 3, Y + cs*.15, cs*.38, cs*.26); }
    if(ch === 'c' && !S.got[x + ',' + y]){ const s = cs*.5, ox = X + cs*.25, oy = Y + cs*.25 + Math.sin(t*3 + x)*2; for(let a = 0; a < 3; a++) for(let b = 0; b < 3; b++){ g.fillStyle = V51T_RUBIK[(a + b*2 + x) % 6]; g.fillRect(ox + a*s/3, oy + b*s/3, s/3 - 1, s/3 - 1); } } }));
  g.fillStyle = 'rgba(255,210,63,.35)'; S.trail.forEach(([x, y]) => g.fillRect(x*cs + cs*.4, y*cs + cs*.4, cs*.2, cs*.2));
  const B = S.bot, bx = (B.fx + .5)*cs + (B.bump > 0 ? Math.sin(t*60)*3 : 0), by = (B.fy + .5)*cs; g.save(); g.translate(bx, by); g.rotate(B.fa); const u = cs/28;
  g.fillStyle = '#2a3048'; g.fillRect(-10*u, -12*u, 7*u, 5*u); g.fillRect(-10*u, 7*u, 7*u, 5*u); g.fillRect(3*u, -12*u, 7*u, 5*u); g.fillRect(3*u, 7*u, 7*u, 5*u);
  g.fillStyle = '#ffd23f'; g.fillRect(-10*u, -8*u, 20*u, 16*u); g.fillStyle = '#1b2235'; g.fillRect(2*u, -6*u, 7*u, 12*u); g.fillStyle = '#5ff0ff'; g.fillRect(5*u, -4*u, 2*u, 3*u); g.fillRect(5*u, 1*u, 2*u, 3*u); g.restore();
}
V51T_GAMES.blocks = {icon:'🧩', name:'Lập trình khối', en:'Block Coding', lv:8,
  help:['🤖 Đưa robot tới <b>cờ 🚩</b> và nhặt hết <b>khối Rubik 🧊</b>.', '👆 <b>Kéo</b> khối lệnh từ dưới lên dải chương trình (hoặc chạm để thêm vào cuối).', '⬆️ Đi · ↩️ Quay trái · ↪️ Quay phải (theo hướng robot đang nhìn).', '🔁 <b>Lặp</b>: chạm để đổi số lần. Các khối sau nó được lặp tới khi gặp ⤴️ <b>Hết lặp</b>.', '❓ <b>Nếu</b>: phía trước trống thì đi, gặp tường thì rẽ phải.', '✋ Kéo khối ra ngoài hoặc chạm để xoá. Bấm ▶ <b>Chạy</b>.', '⭐ Càng ít khối càng nhiều sao.'],
  start(G){ v51tMazeUi(G, G.lv - 1, [], {}); }, resize(G){ v51tMazeSize(G); }};
V51T_GAMES.debug = {icon:'🐞', name:'Tìm lỗi (debug)', en:'Bug Hunt', lv:6,
  help:['🐞 Chương trình của robot có <b>một khối bị sai</b> (bug).', '▶ Bấm <b>Chạy</b> để xem robot đi sai ở đâu.', '👆 Chạm vào khối em nghĩ là sai, rồi chọn khối đúng ở dưới.', '⭐ Tìm ra lỗi với ít lần chạy thử thì được nhiều sao.', '💡 Chạy thử, quan sát, sửa: đó là cách lập trình viên thật làm việc!'],
  start(G){ const B = V51T_BUGS[G.lv - 1]; G.st.sel = -1; v51tMazeUi(G, B.z, v51tParse(B.p), {debug:true, orig:B.p, tip:'🔎 Gợi ý: ' + B.tip}); }, resize(G){ v51tMazeSize(G); }};

// ================= 2. THUẬT TOÁN GIẢI RUBIK: xếp chuỗi bước để đưa mặt trước về một màu =================
// Khối 3×3 mô phỏng bằng 54 nhãn dán (toạ độ x phải, y lên, z ra phía người xem). Xoay mặt = quay 90° quanh trục.
const V51T_MV = {R:[[1, 0, 0], 'R ⬆', 'Cột phải lên'], "R'":[[1, 0, 0], 'R′ ⬇', 'Cột phải xuống'], L:[[-1, 0, 0], 'L ⬇', 'Cột trái xuống'], "L'":[[-1, 0, 0], 'L′ ⬆', 'Cột trái lên'],
  U:[[0, 1, 0], 'U ⬅', 'Hàng trên sang trái'], "U'":[[0, 1, 0], 'U′ ➡', 'Hàng trên sang phải'], D:[[0, -1, 0], 'D ➡', 'Hàng dưới sang phải'], "D'":[[0, -1, 0], 'D′ ⬅', 'Hàng dưới sang trái']};
const V51T_RLV = [{n:1, m:['R', "R'"]}, {n:1, m:['R', "R'", 'U', "U'"]}, {n:2, m:['R', "R'", 'U', "U'"]}, {n:2, m:['R', "R'", 'L', "L'", 'U', "U'"]}, {n:3, m:['R', "R'", 'L', "L'", 'U', "U'"]}, {n:3, m:['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'"]}];
function v51tCube(){ const S = [], cols = {'0,0,1':0, '0,0,-1':5, '1,0,0':2, '-1,0,0':3, '0,1,0':4, '0,-1,0':1};   // trước đỏ, sau cam, phải lam, trái lục, trên trắng, dưới vàng
  for(let x = -1; x <= 1; x++) for(let y = -1; y <= 1; y++) for(let z = -1; z <= 1; z++){ [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(n => { if((n[0] && n[0] === x) || (n[1] && n[1] === y) || (n[2] && n[2] === z)) S.push({p:[x, y, z], n:n.slice(), c:cols[n.join(',')]}); }); }
  return S; }
function v51tTurn(cube, mv){ const def = V51T_MV[mv], e = def[0], prime = mv.length > 1, ax = e[0] ? 0 : e[1] ? 1 : 2, layer = e[ax], s = prime ? 1 : -1;     // chiều kim đồng hồ = −90° quanh pháp tuyến mặt
  const rot = v => { const cr = [e[1]*v[2] - e[2]*v[1], e[2]*v[0] - e[0]*v[2], e[0]*v[1] - e[1]*v[0]], dt = e[0]*v[0] + e[1]*v[1] + e[2]*v[2]; return [cr[0]*s + e[0]*dt*0, cr[1]*s + e[1]*dt*0, cr[2]*s + e[2]*dt*0].map((q, i) => q + e[i]*dt); };
  cube.forEach(st => { if(st.p[ax] !== layer) return; st.p = rot(st.p); st.n = rot(st.n); }); }
function v51tFace(cube, f){ const out = new Array(9).fill(0), n = {F:[0, 0, 1], B:[0, 0, -1], R:[1, 0, 0], L:[-1, 0, 0], U:[0, 1, 0], D:[0, -1, 0]}[f];
  cube.forEach(st => { if(st.n[0] !== n[0] || st.n[1] !== n[1] || st.n[2] !== n[2]) return; const [x, y, z] = st.p; let r, c;
    if(f === 'F'){ r = 1 - y; c = x + 1; } else if(f === 'B'){ r = 1 - y; c = 1 - x; } else if(f === 'R'){ r = 1 - y; c = 1 - z; } else if(f === 'L'){ r = 1 - y; c = z + 1; } else if(f === 'U'){ r = z + 1; c = x + 1; } else { r = 1 - z; c = x + 1; }
    out[r*3 + c] = st.c; }); return out; }
function v51tFDone(cube){ const f = v51tFace(cube, 'F'); return f.every(c => c === f[4]); }
const v51tInv = m => m.length > 1 ? m[0] : m + "'";
V51T_GAMES.rubik = {icon:'🧊', name:'Thuật toán Rubik', en:'Cube Algorithm', lv:6,
  help:['🧊 Mặt <b>trước (to ở giữa)</b> đang lộn màu. Hãy đưa nó về <b>một màu</b>.', '🃏 Chạm các thẻ bước (R ⬆, U ⬅…) để xếp thành <b>thuật toán</b> theo thứ tự.', '▶ Bấm <b>Chạy</b>: khối xoay lần lượt từng bước.', '🔄 Mẹo: mỗi bước đều có bước <b>ngược lại</b> (R ⬆ ↔ R′ ⬇). Làm ngược thứ tự xáo trộn là giải được!', '💡 Bấm gợi ý nếu bí (tối đa 2 sao).', '⭐ Đúng ngay lần đầu được 3 sao.'],
  start(G){ const S = G.st, L = V51T_RLV[G.lv - 1]; S.L = L; S.alg = []; S.tries = 0; S.hint = 0; S.cube = v51tCube(); S.scr = [];
    for(let k = 0; k < 40 && (S.scr.length < L.n || v51tFDone(S.cube)); k++){ if(S.scr.length >= L.n){ S.cube = v51tCube(); S.scr = []; } const m = L.m[Math.floor(Math.random()*L.m.length)]; if(S.scr.length && (S.scr[S.scr.length - 1] === v51tInv(m))) continue; S.scr.push(m); v51tTurn(S.cube, m); }
    S.start = JSON.parse(JSON.stringify(S.cube));
    G.body.innerHTML = '<div class="v51tcube"></div><div class="v51ttip">🎯 Làm mặt trước thành một màu · <i>Make the front face one color</i>. Đã xáo <b>' + S.scr.length + '</b> bước.</div><div class="v51talg"></div>' +
      '<div class="v51tctl"><button type="button" class="v51tbtn v51tgo">▶ Chạy <small>Run</small></button><button type="button" class="v51tbtn v51tclr">🧹 Xoá <small>Clear</small></button><button type="button" class="v51tbtn v51thint">💡 Gợi ý</button></div><div class="v51tmoves"></div>';
    const M = G.body.querySelector('.v51tmoves'); L.m.forEach(m => { const d = V51T_MV[m], b = v51tEl('button', 'v51tmv', '<b>' + d[1] + '</b><small>' + d[2] + '</small>'); b.type = 'button'; b.onclick = () => { if(S.anim) return; if(S.alg.length >= 6){ v51tSay('Tối đa 6 bước nhé!'); return; } S.alg.push(m); v51tSnd('pick'); this.draw(G); }; M.appendChild(b); });
    G.body.querySelector('.v51tgo').onclick = () => this.run(G); G.body.querySelector('.v51tclr').onclick = () => { if(S.anim) return; S.alg = []; this.draw(G); };
    G.body.querySelector('.v51thint').onclick = () => { if(S.anim) return; S.hint = 1; const h = v51tInv(S.scr[S.scr.length - 1]); v51tSay('💡 Bước đầu tiên nên là: ' + V51T_MV[h][1] + ' (' + V51T_MV[h][2] + ')'); };
    this.draw(G); },
  draw(G, hi){ const S = G.st, box = G.body.querySelector('.v51tcube'), A = G.body.querySelector('.v51talg'); if(!box) return; const fc = f => '<div class="v51tf v51tf' + f + '">' + v51tFace(S.cube, f).map(c => '<i style="background:' + V51T_RUBIK[c] + '"></i>').join('') + '</div>';
    box.innerHTML = '<div></div>' + fc('U') + '<div></div><div></div>' + fc('L') + fc('F') + fc('R') + fc('B') + '<div></div>' + fc('D') + '<div></div><div></div>';
    A.innerHTML = S.alg.length ? S.alg.map((m, i) => '<button type="button" data-i="' + i + '" class="' + (hi === i ? 'cur' : '') + '"><b>' + (i + 1) + '.</b> ' + V51T_MV[m][1] + '</button>').join('') : '<div class="v51tempty">👇 Chạm thẻ bước để xếp thuật toán · Tap steps</div>';
    A.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => { if(S.anim) return; S.alg.splice(+b.dataset.i, 1); v51tSnd('tap'); this.draw(G); }; });
    v51tGStat('🧊 <b>' + S.alg.length + '</b> bước · ▶' + S.tries); },
  run(G){ const S = G.st; if(S.anim || G.end) return; if(!S.alg.length){ v51tSay('👇 Xếp ít nhất một bước đã!'); return; } S.tries++; S.cube = JSON.parse(JSON.stringify(S.start)); S.anim = 1; let i = 0; this.draw(G);
    const tick = () => { if(V51T.game !== G) return; if(i >= S.alg.length){ S.anim = 0; return this.check(G); } v51tTurn(S.cube, S.alg[i]); v51tSnd('step'); this.draw(G, i); i++; setTimeout(tick, 650); }; setTimeout(tick, 400); },
  check(G){ const S = G.st; if(v51tFDone(S.cube)){ let st = S.tries <= 1 ? 3 : S.tries === 2 ? 2 : 1; if(S.hint) st = Math.min(st, 2); return v51tGEnd(G, {score:st*100 + Math.max(0, 6 - S.alg.length)*5 + G.lv*10, stars:st, title:'🧊 Mặt trước đã một màu!', note:'Thuật toán của em: <b>' + S.alg.map(m => V51T_MV[m][1]).join(' → ') + '</b>'}); }
    v51tSnd('bad'); v51tSay('🤔 Chưa đúng. Khối quay về như lúc đầu, thử lại nhé! Mẹo: làm ngược lại bước xáo trộn.'); setTimeout(() => { if(V51T.game === G && !G.end){ S.cube = JSON.parse(JSON.stringify(S.start)); this.draw(G); } }, 900); }
};
