// ================= EXT11: RUBIK LAB (2x2..5x5, PYRAMINX) & CHESS SCHOOL =================
const V3 = {add:(a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub:(a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul:(a, k) => [a[0]*k, a[1]*k, a[2]*k], dot:(a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], cross:(a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]], norm:a => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0]/l, a[1]/l, a[2]/l]; }};
function rotV(v, ax, ang){ const c = Math.cos(ang), s = Math.sin(ang), d = V3.dot(ax, v), cr = V3.cross(ax, v); return [v[0]*c + cr[0]*s + ax[0]*d*(1 - c), v[1]*c + cr[1]*s + ax[1]*d*(1 - c), v[2]*c + cr[2]*s + ax[2]*d*(1 - c)]; }
const CUBE_COL = ['#ffffff','#ffd500','#009b48','#0046ad','#b71234','#ff5800']; // U D F B R L
const PYR_COL = ['#ffd500','#009b48','#0046ad','#b71234'];
function buildCube(N){
  const h = N/2, faces = [[[0,1,0],[1,0,0],[0,0,1]], [[0,-1,0],[1,0,0],[0,0,-1]], [[0,0,1],[1,0,0],[0,-1,0]], [[0,0,-1],[-1,0,0],[0,-1,0]], [[1,0,0],[0,0,-1],[0,-1,0]], [[-1,0,0],[0,0,1],[0,-1,0]]];
  const slots = [];
  faces.forEach(([n, u, v], f) => { for(let i=0;i<N;i++) for(let j=0;j<N;j++){ const a = i - (N - 1)/2, b = j - (N - 1)/2, c = V3.add(V3.mul(n, h), V3.add(V3.mul(u, a), V3.mul(v, b))); const vs = [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x, y]) => V3.add(c, V3.add(V3.mul(u, x), V3.mul(v, y)))); slots.push({c, n, vs, f}); } });
  const X = [1,0,0], Y = [0,1,0], Z = [0,0,1], M = {};
  const layer = (ax, lo, hi) => s => { const d = V3.dot(s.c, ax); return d > lo && d < hi; };
  const add = (name, ax, ang, pred) => { M[name] = {ax, ang, pred}; M[name + "'"] = {ax, ang:-ang, pred}; M[name + '2'] = {ax, ang:ang*2, pred}; };
  [['R', X, -1], ['L', V3.mul(X, -1), -1], ['U', Y, -1], ['D', V3.mul(Y, -1), -1], ['F', Z, -1], ['B', V3.mul(Z, -1), -1]].forEach(([n, ax, sg]) => {
    add(n, ax, sg*Math.PI/2, layer(ax, h - 1, h + 1));
    if(N >= 4){ add(n + 'w', ax, sg*Math.PI/2, layer(ax, h - 2, h + 1)); add(n.toLowerCase(), ax, sg*Math.PI/2, layer(ax, h - 2, h - 1)); }
    else if(N === 3) add(n.toLowerCase(), ax, sg*Math.PI/2, layer(ax, h - 2, h + 1));
  });
  if(N % 2){ add('M', V3.mul(X, -1), -Math.PI/2, layer(X, -.5, .5)); add('E', V3.mul(Y, -1), -Math.PI/2, layer(Y, -.5, .5)); add('S', Z, -Math.PI/2, layer(Z, -.5, .5)); }
  add('x', X, -Math.PI/2, () => true); add('y', Y, -Math.PI/2, () => true); add('z', Z, -Math.PI/2, () => true);
  return finishPuzzle({kind:'cube', N, slots, M, colors:CUBE_COL, size:N, faceOf:s => s.f, moveSet:N === 2 ? ['U','D','L','R','F','B'] : N === 3 ? ['U','D','L','R','F','B','M','E','S'] : N === 4 ? ['U','D','L','R','F','B','Uw','Rw','Fw','r','u','f'] : ['U','D','L','R','F','B','Uw','Rw','Fw','M','r','u']});
}
function buildPyra(){
  const k = 3, A = [0, k, 0], ang = Math.acos(-1/3), B = rotV(A, [1,0,0], ang), C = rotV(B, [0,1,0], 2*Math.PI/3), D = rotV(B, [0,1,0], -2*Math.PI/3);
  const V = {U:A, L:B, R:C, B:D}, verts = [A, B, C, D], faceVs = [[A, C, B], [A, D, C], [A, B, D], [B, C, D]];
  const slots = [];
  faceVs.forEach(([p, q, r], f) => { let n = V3.norm(V3.cross(V3.sub(q, p), V3.sub(r, p))); if(V3.dot(n, V3.add(V3.add(p, q), r)) < 0) n = V3.mul(n, -1); const P = (i, j) => V3.add(p, V3.add(V3.mul(V3.sub(q, p), i/3), V3.mul(V3.sub(r, p), j/3)));
    for(let i=0;i<3;i++) for(let j=0;j<3 - i;j++){ const t1 = [P(i, j), P(i + 1, j), P(i, j + 1)]; slots.push({vs:t1, c:V3.mul(V3.add(V3.add(t1[0], t1[1]), t1[2]), 1/3), n, f}); if(i + j < 2){ const t2 = [P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]; slots.push({vs:t2, c:V3.mul(V3.add(V3.add(t2[0], t2[1]), t2[2]), 1/3), n, f}); } } });
  const M = {}, L = Math.hypot(...A);
  Object.keys(V).forEach(n => { const ax = V3.norm(V[n]); const two = s => V3.dot(s.c, ax) > L/9, tip = s => V3.dot(s.c, ax) > 5*L/9;
    M[n] = {ax, ang:-2*Math.PI/3, pred:two}; M[n + "'"] = {ax, ang:2*Math.PI/3, pred:two}; M[n.toLowerCase()] = {ax, ang:-2*Math.PI/3, pred:tip}; M[n.toLowerCase() + "'"] = {ax, ang:2*Math.PI/3, pred:tip}; });
  return finishPuzzle({kind:'pyra', N:3, slots, M, colors:PYR_COL, size:5, faceOf:s => s.f, moveSet:['U','L','R','B','u','l','r','b']});
}
function finishPuzzle(P){
  P.state = P.slots.map(s => s.f);
  const near = c => { let b = 0, bd = 1e9; P.slots.forEach((s, i) => { const d = (s.c[0] - c[0])**2 + (s.c[1] - c[1])**2 + (s.c[2] - c[2])**2; if(d < bd){ bd = d; b = i; } }); return b; };
  Object.values(P.M).forEach(m => { m.inL = P.slots.map(m.pred); m.perm = P.slots.map((s, i) => m.inL[i] ? near(rotV(s.c, m.ax, m.ang)) : i); });
  return P;
}
function applyMove(P, name){ const m = P.M[name]; if(!m) return false; const ns = P.state.slice(); m.perm.forEach((j, i) => { ns[j] = P.state[i]; }); P.state = ns; return true; }
const solvedP = P => { const g = {}; return P.slots.every((s, i) => { const f = s.f; if(g[f] == null) g[f] = P.state[i]; return g[f] === P.state[i]; }); };
var LAB = {P:null, kind:'3', yaw:-.6, pitch:.5, queue:[], anim:null, hist:[], timer:0, timing:false, scrambled:false, raf:0, drag:null, tutStep:-1};
const invMove = m => m.endsWith("'") ? m.slice(0, -1) : m.endsWith('2') ? m : m + "'";
const parseAlg = s => s.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
function labNew(kind){ LAB.kind = kind; LAB.P = kind === 'pyra' ? buildPyra() : buildCube(+kind); LAB.queue = []; LAB.anim = null; LAB.hist = []; LAB.timing = false; LAB.timer = 0; LAB.scrambled = false; labButtons(); labTut(); labStatus(); try { LF = {alg:null, idx:-1, mode:null, name:'', expect:[], pos:0}; renderFormula(); coachMsg('Chọn một công thức ở bảng bên phải, bấm "Luyện cùng thầy" để thầy hướng dẫn từng bước.'); } catch(e){} }
function labMove(m, record){ if(!LAB.P.M[m]) return; LAB.queue.push({m, record:record !== false}); }
function labScramble(){ const ms = LAB.P.moveSet.filter(m => !/^[xyz]$/.test(m)), n = LAB.kind === 'pyra' ? 14 : LAB.kind === '2' ? 12 : LAB.kind === '3' ? 22 : 40; let last = ''; LAB.queue = []; LAB.anim = null; for(let i=0;i<n;i++){ let m; do { m = ms[Math.floor(Math.random()*ms.length)]; } while(m[0].toLowerCase() === last); last = m[0].toLowerCase(); const v = m + ['', "'", LAB.kind === 'pyra' ? '' : '2'][Math.floor(Math.random()*3)]; if(LAB.P.M[v]) applyMove(LAB.P, v); } LAB.hist = []; LAB.scrambled = true; LAB.timing = false; LAB.timer = 0; labStatus('Đã xáo trộn! Đồng hồ chạy khi bạn xoay bước đầu tiên.'); }
function labSolve(){ if(!LAB.hist.length){ labStatus(LAB.scrambled ? 'Phải tự xoay ít nhất một bước rồi mới giải giúp được (giải giúp sẽ đi ngược lại các bước bạn đã xoay).' : 'Khối đang được giải sẵn.'); return; } LAB.queue = LAB.hist.slice().reverse().map(m => ({m:invMove(m), record:false})); LAB.hist = []; LAB.timing = false; labStatus('Đang đi ngược các bước bạn đã xoay…'); }
function labLoop(now){
  if(!openModal || openModal.id !== 'mLab'){ LAB.raf = 0; return; }
  const dt = Math.min(.05, (now - (LAB.last || now))/1000); LAB.last = now;
  if(LAB.timing){ LAB.timer += dt; $('#labTimer').textContent = LAB.timer.toFixed(1) + ' s'; }
  if(!LAB.anim && LAB.queue.length){ const q = LAB.queue.shift(); LAB.anim = {m:q.m, t:0, record:q.record, dur:LAB.queue.length > 6 ? .09 : .2}; if(q.record && LAB.scrambled && !LAB.timing && LAB.timer === 0) LAB.timing = true; }
  if(LAB.anim){ LAB.anim.t += dt/LAB.anim.dur; if(LAB.anim.t >= 1){ applyMove(LAB.P, LAB.anim.m); if(LAB.anim.record){ LAB.hist.push(LAB.anim.m); try { kickSfx(.15); labOnUserMove(LAB.anim.m); } catch(e){} } LAB.anim = null;
    if(LAB.scrambled && solvedP(LAB.P)){ const t = LAB.timer; LAB.scrambled = false; LAB.timing = false; if(LAB.hist.length){ labStatus(`Giải xong ${labName()} trong ${t.toFixed(1)} giây, ${LAB.hist.length} bước!`); reward(40 + (LAB.kind === 'pyra' ? 10 : (+LAB.kind)*15), 10, 'Giải ' + labName()); mprog('rubiklab'); confetti(); cheerSfx(); } } } }
  labDraw(); LAB.raf = requestAnimationFrame(labLoop);
}
const labName = () => LAB.kind === 'pyra' ? 'Rubik tam giác Pyraminx' : `Rubik ${LAB.kind}×${LAB.kind}`;
function labDraw(){
  const cv = $('#labCv'), c = cv.getContext('2d'), P = LAB.P, Wc = cv.width, Hc = cv.height; c.clearRect(0, 0, Wc, Hc);
  const g = c.createRadialGradient(Wc/2, Hc*.45, 20, Wc/2, Hc/2, Wc*.7); g.addColorStop(0, '#2a3668'); g.addColorStop(1, '#0a0f22'); c.fillStyle = g; c.fillRect(0, 0, Wc, Hc);
  const cy = Math.cos(LAB.yaw), sy = Math.sin(LAB.yaw), cp = Math.cos(LAB.pitch), sp = Math.sin(LAB.pitch);
  const view = v => { const x = v[0]*cy + v[2]*sy, z = -v[0]*sy + v[2]*cy, y = v[1]*cp - z*sp, z2 = v[1]*sp + z*cp; return [x, y, z2]; };
  const sc = Math.min(Wc, Hc)/(P.size*1.9), persp = z => 1/(1 - z*.06);
  const A = LAB.anim, m = A ? P.M[A.m] : null, ang = A ? m.ang*easeIO(Math.min(1, A.t)) : 0;
  const polys = [];
  P.slots.forEach((s, i) => { let vs = s.vs, n = s.n, c0 = s.c; if(m && m.inL[i]){ vs = vs.map(v => rotV(v, m.ax, ang)); n = rotV(n, m.ax, ang); c0 = rotV(c0, m.ax, ang); }
    const nv = view(n); if(nv[2] <= 0.02) return; const cv0 = view(c0); polys.push({z:cv0[2], pts:vs.map(view), cc:cv0, col:P.colors[P.state[i]], lit:.55 + .45*nv[2]}); });
  polys.sort((a, b) => a.z - b.z);
  const P2 = p => [Wc/2 + p[0]*sc*persp(p[2]), Hc/2 - p[1]*sc*persp(p[2])];
  polys.forEach(p => { c.fillStyle = '#111'; c.beginPath(); p.pts.forEach((q, k) => { const [x, y] = P2(q); k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fill();
    c.fillStyle = p.col; c.globalAlpha = 1; c.beginPath(); p.pts.forEach((q, k) => { const r = V3.add(p.cc, V3.mul(V3.sub(q, p.cc), .86)); const [x, y] = P2(r); k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fill();
    c.fillStyle = `rgba(0,0,0,${(1 - p.lit)*.6})`; c.fill(); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill(); });
}
function labButtons(){
  const box = $('#labMoves'); box.innerHTML = '';
  LAB.P.moveSet.forEach(m => [m, m + "'"].forEach(v => { if(!LAB.P.M[v]) return; const b = el('button', {type:'button'}); b.textContent = v; b.onclick = () => labMove(v); box.appendChild(b); }));
  if(LAB.kind !== 'pyra') ['x','y'].forEach(v => { const b = el('button', {type:'button'}); b.textContent = v + ' (xoay cả khối)'; b.className = 'wide'; b.onclick = () => labMove(v, false); box.appendChild(b); });
  document.querySelectorAll('#labKinds button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === LAB.kind));
}
function labStatus(t){ $('#labState').textContent = t || `${labName()} · ${LAB.scrambled ? 'đang xáo trộn' : 'đã giải'} · ${LAB.hist.length} bước`; }
const TUTS = {
  notation:[['Ký hiệu xoay', "Mỗi chữ cái là một mặt: U trên, D dưới, L trái, R phải, F trước, B sau. Chữ cái đơn = xoay mặt đó 90° theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó. Thêm dấu ' = ngược chiều kim đồng hồ, thêm số 2 = xoay 180°.", "R U R' U'"], ['Xoay cả khối', 'x xoay cả khối theo trục R (lật lên), y theo trục U (quay ngang), z theo trục F. Dùng để đổi góc nhìn mà không làm rối khối.', 'y y y y']],
  '3':[['Bước 1 · Dấu cộng trắng', 'Đưa 4 viên cạnh trắng lên quanh tâm trắng sao cho màu thứ hai của mỗi cạnh trùng với tâm mặt bên. Làm bằng trực giác. Mẹo: nếu cạnh đã ở dưới đáy đúng vị trí, xoay F2 để đưa lên.', 'F2'],
    ['Bước 2 · Bốn góc trắng', 'Lật mặt trắng xuống dưới. Đặt góc có màu trắng ngay trên vị trí của nó (tầng trên, góc phải trước), rồi lặp lại công thức "cú sexy" cho tới khi góc vào đúng chỗ.', "R U R' U'"],
    ['Bước 3 · Tầng giữa (đưa sang phải)', 'Tìm cạnh không có màu vàng ở tầng trên, xoay U cho màu trước khớp tâm mặt trước. Nếu cạnh cần đi sang phải:', "U R U' R' U' F' U F"],
    ['Bước 3 · Tầng giữa (đưa sang trái)', 'Nếu cạnh cần đi sang trái thì dùng công thức đối xứng:', "U' L' U L U F U' F'"],
    ['Bước 4 · Dấu cộng vàng', 'Mặt vàng lên trên. Nếu thấy chấm, chữ L hoặc đường ngang, dùng công thức này (chữ L để ở góc trái sau, đường ngang để nằm ngang), lặp lại tới khi có dấu cộng.', "F R U R' U' F'"],
    ['Bước 5 · Cạnh vàng đúng chỗ', 'Xoay U để 2 cạnh khớp màu tâm. Đặt hai cạnh đúng ở sau và phải rồi làm:', "R U R' U R U2 R' U"],
    ['Bước 6 · Góc vàng đúng chỗ', 'Tìm một góc đã đúng vị trí, đặt nó ở góc phải trước, rồi làm công thức này tới khi cả 4 góc đúng chỗ:', "U R U' L' U R' U' L"],
    ['Bước 7 · Xoay góc vàng', 'Cầm khối giữ yên, góc cần xoay ở phải trước trên. Lặp R\' D\' R D tới khi mặt vàng của góc lên trên, rồi U để chuyển góc kế tiếp. Đừng lo khi khối bị rối tạm thời!', "R' D' R D R' D' R D"]],
  '2':[['Bước 1 · Mặt trắng', 'Rubik 2×2 chỉ có góc. Làm mặt trắng giống bước góc trắng của 3×3: đặt góc trên chỗ cần vào rồi lặp công thức.', "R U R' U'"], ['Bước 2 · Mặt vàng (Sune)', 'Lật trắng xuống dưới. Dùng Sune nhiều lần để đưa các góc vàng lên trên.', "R U R' U R U2 R'"], ['Bước 3 · Đặt góc đúng chỗ', 'Tìm hai góc kề nhau đã đúng, để chúng ở phía sau rồi làm:', "U R U' L' U R' U' L"], ['Bước 4 · Xoay góc', 'Giống bước 7 của 3×3:', "R' D' R D R' D' R D"]],
  '4':[['Phương pháp rút gọn', 'Ghép 4 viên tâm cùng màu thành 6 tâm, ghép từng đôi cạnh thành 12 cạnh, rồi giải như Rubik 3×3. Ký hiệu Rw = xoay 2 lớp bên phải, r = chỉ lớp thứ hai.', "Rw U Rw'"], ['Ghép cạnh', 'Đặt hai nửa cạnh cùng màu ở mặt trước bên trái và bên phải, rồi dùng công thức "free slice":', "Uw' R U R' F R' F' R Uw"], ['Lỗi chẵn lẻ PLL', 'Khi hai cạnh đối nhau bị đổi chỗ ở bước cuối:', "r2 U2 r2 Uw2 r2 Uw2"], ['Lỗi chẵn lẻ OLL', 'Khi một cạnh bị lật ngược ở mặt vàng:', "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'"]],
  '5':[['Phương pháp rút gọn', 'Giải 6 tâm 3×3, ghép 3 viên thành mỗi cạnh (12 cạnh), rồi giải như 3×3. M là lớp giữa.', "M U M'"], ['Ghép cạnh', 'Đặt viên cạnh cần ghép ở mặt trước, dùng công thức tách - ghép lớp:', "Uw' R U R' F R' F' R Uw"]],
  'pyra':[['Ký hiệu Pyraminx', 'Rubik tam giác có 4 đỉnh: U trên, L trái, R phải, B sau. Chữ in hoa xoay 2 lớp quanh đỉnh 120°, chữ thường (u, l, r, b) chỉ xoay viên chóp nhỏ ở đỉnh.', 'u l r b'], ['Bước 1 · Chóp và tâm', 'Xoay 4 viên chóp cho khớp màu với 3 viên tâm bên dưới nó. Rồi xoay các lớp để mỗi đỉnh có 3 màu tâm khớp nhau.', "R U R'"], ['Bước 2 · Ba cạnh cuối', 'Khi chỉ còn các cạnh sai, dùng công thức xoay vòng 3 cạnh. Lặp lại, xoay khối để thử góc khác.', "R' L R L'"], ['Bước 2 · Đối xứng', 'Công thức đối xứng để xoay vòng 3 cạnh theo chiều ngược lại:', "L R' L' R"]]
};
function labTut(){
  const box = $('#labTut'); box.innerHTML = '';
  const list = (LAB.kind === 'pyra' ? [] : TUTS.notation).concat(TUTS[LAB.kind] || []);
  list.forEach(([t, d, alg]) => { const it = el('div', {className:'tut'}); const h = el('b'); h.textContent = t; it.appendChild(h); const p = el('p'); p.textContent = d; it.appendChild(p); const r = el('div', {className:'row'}); const code = el('code'); code.textContent = alg; r.appendChild(code); const b = el('button', {type:'button'}); b.textContent = '▶ Xem xoay mẫu'; b.onclick = () => { parseAlg(alg).forEach(m => labMove(m)); labStatus('Đang xoay mẫu: ' + alg); activity('tut', 6); }; r.appendChild(b); const u = el('button', {type:'button'}); u.textContent = '↺ Đảo ngược'; u.onclick = () => parseAlg(alg).reverse().forEach(m => labMove(invMove(m))); r.appendChild(u); it.appendChild(r); box.appendChild(it); });
}
function openLab(kind){ showModal('mLab'); if(!LAB.P || (kind && kind !== LAB.kind)) labNew(kind || LAB.kind); const cv = $('#labCv'); cv.width = 560; cv.height = 520; cancelAnimationFrame(LAB.raf); LAB.last = performance.now(); LAB.raf = requestAnimationFrame(labLoop); }
function labClose(){ LAB.timing = false; }
function labInit(){
  const cv = $('#labCv');
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); LAB.drag = {x:e.clientX, y:e.clientY, yaw:LAB.yaw, pitch:LAB.pitch}; });
  cv.addEventListener('pointermove', e => { if(!LAB.drag) return; LAB.yaw = LAB.drag.yaw + (e.clientX - LAB.drag.x)*.01; LAB.pitch = clampV(LAB.drag.pitch + (e.clientY - LAB.drag.y)*.01, -1.4, 1.4); });
  ['pointerup','pointercancel'].forEach(ev => cv.addEventListener(ev, () => { LAB.drag = null; }));
  document.querySelectorAll('#labKinds button').forEach(b => b.onclick = () => labNew(b.dataset.k));
  $('#labScr').onclick = labScramble; $('#labSolve').onclick = labSolve; $('#labReset').onclick = () => labNew(LAB.kind); $('#labUndo').onclick = () => { const m = LAB.hist.pop(); if(m) labMove(invMove(m), false); };
  $('#labAlgGo').onclick = () => { const a = parseAlg($('#labAlg').value), bad = a.filter(m => !LAB.P.M[m]); if(bad.length){ labStatus('Không hiểu bước: ' + bad.join(' ')); return; } a.forEach(m => labMove(m)); };
}
function labKey(e){ if(e.target.tagName === 'INPUT') return false; const k = e.key; const map = {u:'U', d:'D', l:'L', r:'R', f:'F', b:'B'}; const base = map[k.toLowerCase()]; if(!base) return false; let m = LAB.kind === 'pyra' ? (base === 'U' || base === 'L' || base === 'R' || base === 'B' ? base : null) : base; if(!m) return false; if(e.shiftKey) m += "'"; labMove(m); return true; }

// ================= CHESS SCHOOL =================
const CLESSONS = [
  {n:'Vua ♔', fen:'7k/8/8/8/3K4/8/8/8 w - - 0 1', sq:'d4', d:'Vua đi 1 ô theo mọi hướng (ngang, dọc, chéo). Vua là quân quan trọng nhất: nếu Vua bị chiếu mà không thoát được thì thua. Vua không được đi vào ô đang bị quân đối phương tấn công. Bấm một ô xanh để thử đi.'},
  {n:'Hậu ♕', fen:'7k/8/8/8/3Q4/8/8/K7 w - - 0 1', sq:'d4', d:'Hậu là quân mạnh nhất (giá trị 9 điểm): đi bao nhiêu ô cũng được theo hàng ngang, hàng dọc và đường chéo, miễn không bị quân khác chặn.'},
  {n:'Xe ♖', fen:'7k/8/8/8/3R4/8/8/K7 w - - 0 1', sq:'d4', d:'Xe (5 điểm) đi thẳng theo hàng ngang hoặc hàng dọc, bao nhiêu ô cũng được. Xe rất mạnh ở cột mở và hàng 7.'},
  {n:'Tượng ♗', fen:'7k/8/8/8/3B4/8/8/K7 w - - 0 1', sq:'d4', d:'Tượng (3 điểm) đi chéo bao nhiêu ô cũng được. Mỗi Tượng chỉ ở mãi trên một màu ô: Tượng ô trắng và Tượng ô đen.'},
  {n:'Mã ♘', fen:'7k/8/8/8/3N4/8/8/K7 w - - 0 1', sq:'d4', d:'Mã (3 điểm) đi hình chữ L: 2 ô theo một hướng rồi rẽ 1 ô. Mã là quân duy nhất nhảy qua đầu quân khác được.'},
  {n:'Tốt ♙', fen:'7k/8/8/2p1p3/8/8/3P4/K7 w - - 0 1', sq:'d2', d:'Tốt (1 điểm) đi thẳng 1 ô về phía trước; ở nước đầu tiên được đi 2 ô. Tốt ăn quân theo đường chéo 1 ô phía trước. Tốt không bao giờ đi lùi.'},
  {n:'Nhập thành', fen:'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', sq:'e1', d:'Nhập thành: Vua đi 2 ô về phía Xe, Xe nhảy qua đứng cạnh Vua. Điều kiện: Vua và Xe chưa đi lần nào, giữa chúng không có quân, Vua không đang bị chiếu và không đi qua ô bị tấn công. Bấm g1 hoặc c1.'},
  {n:'Bắt tốt qua đường', fen:'7k/8/8/3pP3/8/8/8/K7 w - d6 0 1', sq:'e5', d:'Khi Tốt đối phương vừa đi 2 ô và đứng ngay cạnh Tốt của bạn, ở nước kế tiếp bạn được ăn nó như thể nó chỉ đi 1 ô. Bấm d6 để bắt tốt qua đường.'},
  {n:'Phong cấp', fen:'7k/3P4/8/8/8/8/8/K7 w - - 0 1', sq:'d7', d:'Tốt đi tới hàng cuối cùng sẽ được phong cấp thành Hậu, Xe, Tượng hoặc Mã (thường chọn Hậu). Bấm d8.'},
  {n:'Chiếu hết', fen:'6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', sq:'a1', d:'Chiếu hết là khi Vua bị chiếu và không còn cách thoát. Thử tìm nước chiếu hết trong 1 nước: Vua đen bị chính các Tốt của mình chặn đường (chiếu hết hàng cuối).', goal:'mate'},
  {n:'Giá trị quân', fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', sq:'e2', d:'Giá trị quy ước: Tốt 1 · Mã 3 · Tượng 3 · Xe 5 · Hậu 9 · Vua vô giá. Khi đổi quân hãy so điểm. Nguyên tắc khai cuộc: chiếm trung tâm, ra quân nhẹ (Mã, Tượng) sớm, nhập thành để bảo vệ Vua.'}
];
var CL = {i:0, g:null, sel:null, last:null, msg:''};
function openChessSchool(i){ showModal('mChessLearn'); clLoad(i || 0); }
function clLoad(i){ CL.i = i; const L = CLESSONS[i]; CL.g = new Chess(L.fen); CL.sel = L.sq; CL.last = null; CL.msg = ''; clRender(); }
function clRender(){
  const L = CLESSONS[CL.i]; const tabs = $('#clTabs'); tabs.innerHTML = '';
  CLESSONS.forEach((x, k) => { const b = el('button', {type:'button'}); b.textContent = x.n; b.setAttribute('aria-pressed', k === CL.i); b.onclick = () => clLoad(k); tabs.appendChild(b); });
  $('#clText').textContent = L.d; $('#clMsg').textContent = CL.msg;
  const bd = $('#clBoard'); bd.innerHTML = ''; const b = CL.g.board(), legal = CL.sel ? CL.g.moves({square:CL.sel, verbose:true}) : [];
  for(let r=0;r<8;r++) for(let f=0;f<8;f++){ const name = 'abcdefgh'[f] + (8 - r), p = b[r][f]; const d = el('button', {type:'button', className:'sq ' + ((f + r) % 2 ? 'd' : 'l')}); d.dataset.sq = name;
    if(p) d.appendChild(chessPieceImg(p)); if(name === CL.sel) d.classList.add('sel'); if(CL.last && (CL.last.from === name || CL.last.to === name)) d.classList.add('last');
    if(legal.some(m => m.to === name)) d.appendChild(el('span', {className:p ? 'cap' : 'dot'}));
    d.onclick = () => clClick(name); bd.appendChild(d); }
}
function clClick(sq){
  const L = CLESSONS[CL.i];
  if(CL.sel && CL.g.moves({square:CL.sel, verbose:true}).some(m => m.to === sq)){ const r = CL.g.move({from:CL.sel, to:sq, promotion:'q'}); chessSfxFor(r, CL.g); CL.last = {from:r.from, to:r.to}; CL.sel = null;
    if(L.goal === 'mate') CL.msg = CL.g.in_checkmate() ? 'Chính xác! Chiếu hết hàng cuối. +EXP' : 'Chưa phải chiếu hết, bấm "Làm lại" để thử nước khác.';
    else CL.msg = r.flags.includes('k') || r.flags.includes('q') ? 'Bạn vừa nhập thành!' : r.flags.includes('e') ? 'Bạn vừa bắt tốt qua đường!' : r.flags.includes('p') ? 'Tốt đã phong cấp thành Hậu!' : `Đã đi ${r.san}. Bấm quân để thử tiếp.`;
    if(L.goal === 'mate' && CL.g.in_checkmate()){ reward(30, 0, 'Giải bài chiếu hết'); mprog('chesslearn'); } else activity('chesslearn', 6);
    if(CL.g.turn() === 'b' && !CL.g.game_over()){ setTimeout(() => { const f = CL.g.fen().split(' '); f[1] = 'w'; f[3] = '-'; try { CL.g.load(f.join(' ')); } catch(e){} clRender(); }, 10); }
    clRender(); return; }
  const p = CL.g.get(sq); CL.sel = p && p.color === 'w' ? sq : null; clRender();
}
function ext11Init(){ labInit(); $('#clReset').onclick = () => clLoad(CL.i); }

