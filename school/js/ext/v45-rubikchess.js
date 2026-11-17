// ================= EXT50 (v45 · Session 8): Rubik & chess =================
// 1. Rubik mini games (mRubik 3D + Phòng Rubik mLab): full-screen golden layout, "Giải giúp" turns the cube step by step on screen
//    with an arrow on the layer being turned, ⏮ / ▶ / ⏭ controls and a move history (R U F L D B, with ') under the cube.
// 2. Tượng đài Rubik + Khu chơi Rubik → one school emblem: a big Rubik statue on a golden-ratio plaza (rubikpark) and an open
//    Rubik court without walls (rubikyard). Everything is drawn relative to R.<zone> so it follows the zone if it moves.
// 3. Chess: redrawn giant board and the 5 small tables; tapping / walking into the Chess room opens a chess game at once.
const PHI = 1.618;
const V45 = {baked:new Map(), sol:{}, park:null, parkKey:'', yard:null, yardKey:'', board:null, boardKey:'', inChess:false};

// ---------- small 3D helpers ----------
const v45Cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const v45Norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
// basis (u, v) of the plane ⟂ ax with u × v = ax, so increasing θ = positive (right-hand) turn about ax
function v45Basis(ax){ const a = Math.abs(ax[0]) < .9 ? [1, 0, 0] : [0, 1, 0], u = v45Norm(v45Cross(ax, a)); return [u, v45Cross(ax, u)]; }
// draws a curved arrow through screen points + a notation label
function v45Arrow(c, pts, label, k, alpha){
  if(pts.length < 2) return; c.save(); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineJoin = 'round';
  const line = (w, col) => { c.strokeStyle = col; c.lineWidth = w*k; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
  line(11, 'rgba(10,15,34,.85)'); line(6, '#ffd23f');
  const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1], an = Math.atan2(y2 - y1, x2 - x1), h = 17*k;
  const head = (grow, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x2 + Math.cos(an)*(h*.55 + grow), y2 + Math.sin(an)*(h*.55 + grow)); c.lineTo(x2 + Math.cos(an + 2.45)*(h + grow), y2 + Math.sin(an + 2.45)*(h + grow)); c.lineTo(x2 + Math.cos(an - 2.45)*(h + grow), y2 + Math.sin(an - 2.45)*(h + grow)); c.closePath(); c.fill(); };
  head(4*k, 'rgba(10,15,34,.85)'); head(0, '#ffd23f');
  if(label){ const [mx, my] = pts[0]; c.font = `800 ${Math.round(17*k)}px Nunito, system-ui, sans-serif`; const w = c.measureText(label).width + 16*k, hh = 26*k;
    c.fillStyle = '#ffd23f'; c.beginPath(); c.roundRect ? c.roundRect(mx - w/2, my - hh/2, w, hh, hh/2) : c.rect(mx - w/2, my - hh/2, w, hh); c.fill();
    c.fillStyle = '#1a1206'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, mx, my + 1); }
  c.restore();
}
const V45_FACE = {U:'mặt Trên', D:'mặt Dưới', L:'mặt Trái', R:'mặt Phải', F:'mặt Trước', B:'mặt Sau', M:'tầng giữa dọc', E:'tầng giữa ngang', S:'tầng giữa trước', x:'cả khối (trục x)', y:'cả khối (trục y)', z:'cả khối (trục z)'};
function v45Say(n, pyra){ const b = n.replace(/['2]$/, ''), f = V45_FACE[b] || V45_FACE[b.toUpperCase()] || ('tầng ' + b);
  const w = /w$/.test(b) ? ' (2 tầng)' : (b !== b.toUpperCase() && !pyra && !/[xyz]/.test(b)) ? ' (tầng trong)' : (pyra && b === b.toLowerCase()) ? ' (chỉ đỉnh)' : '';
  return `${f}${w} · ${n.endsWith('2') ? 'xoay 2 lần' : n.endsWith("'") ? '↺ ngược chiều kim đồng hồ' : '↻ theo chiều kim đồng hồ'}`; }

// ---------- generic step-by-step solver UI ----------
// A = adapter: {busy(), apply(step), inv(step), name(step), plan() → steps, solved()}
function v45SolUI(key, host, A){
  const box = document.createElement('div'); box.className = 'v45sol'; box.innerHTML =
    '<div class="v45bar"><button type="button" class="v45b v45go" data-a="solve">🪄 Giải giúp</button><span class="v45ctl" hidden>' +
    '<button type="button" class="v45b" data-a="back" aria-label="Bước lùi">⏮</button><button type="button" class="v45b v45play" data-a="play" aria-label="Tự chạy">▶</button>' +
    '<button type="button" class="v45b" data-a="next" aria-label="Bước tiếp">⏭</button><button type="button" class="v45b" data-a="stop" aria-label="Thoát giải">✕</button></span>' +
    '<span class="v45cnt"></span></div><p class="v45say" aria-live="polite"></p>' +
    '<div class="v45hist"><b>📜 Lịch sử nước đi</b><div class="v45mv"></div></div><div class="v45plan" hidden><b>🪄 Lời giải</b><div class="v45mv"></div></div>';
  host.appendChild(box);
  const S = V45.sol[key] = {A, box, on:false, plan:[], idx:0, play:false, wait:0, cur:null, logN:-1, planN:-1, self:false, log:[]};
  box.querySelector('[data-a=solve]').onclick = () => v45Start(S);
  box.querySelector('[data-a=back]').onclick = () => { S.play = false; v45Back(S); };
  box.querySelector('[data-a=next]').onclick = () => { S.play = false; v45Next(S); };
  box.querySelector('[data-a=play]').onclick = () => { S.play = !S.play; S.wait = 0; v45Ctl(S); };
  box.querySelector('[data-a=stop]').onclick = () => v45Stop(S, 'Đã thoát chế độ giải giúp.');
  return S;
}
function v45Ctl(S){ const b = S.box; b.querySelector('.v45ctl').hidden = !S.on; b.querySelector('.v45go').hidden = S.on; b.querySelector('.v45plan').hidden = !S.on;
  b.querySelector('.v45play').textContent = S.play ? '⏸' : '▶'; b.querySelector('.v45play').setAttribute('aria-label', S.play ? 'Tạm dừng' : 'Tự chạy');
  b.querySelector('.v45cnt').textContent = S.on ? `Bước ${S.idx}/${S.plan.length}` : ''; S.planN = -1; }
function v45Msg(S, t){ S.box.querySelector('.v45say').textContent = t; }
function v45Start(S){
  if(S.A.busy()) { v45Msg(S, '⏳ Chờ khối xoay xong đã nhé.'); return; }
  const plan = S.A.plan(); if(!plan.length){ v45Msg(S, S.A.solved() ? '✅ Khối đang được giải sẵn. Bấm Xáo trộn trước nhé!' : '🤔 Chưa có nước nào để giải.'); return; }
  Object.assign(S, {on:true, plan, idx:0, play:true, wait:.5, cur:null}); S.A.begin && S.A.begin(); v45Ctl(S);
  v45Msg(S, `🪄 Lời giải có ${plan.length} bước. Xem mũi tên vàng: tầng đó sẽ xoay. Bấm ⏸ để dừng, ⏮ ⏭ để đi từng bước.`);
}
function v45Stop(S, t){ S.on = false; S.play = false; S.cur = null; v45Ctl(S); if(t) v45Msg(S, t); }
function v45Next(S){ if(!S.on || S.A.busy() || S.idx >= S.plan.length) return; const st = S.plan[S.idx++]; S.cur = st; S.self = true; S.A.apply(st); S.self = false; v45Ctl(S); v45Msg(S, `▶ Bước ${S.idx}: ${S.A.name(st)} — ${v45Say(S.A.name(st), S.A.pyra && S.A.pyra())}`); }
function v45Back(S){ if(!S.on || S.A.busy() || S.idx <= 0) return; const st = S.plan[--S.idx]; S.cur = S.A.inv(st); S.self = true; S.A.apply(S.cur); S.self = false; v45Ctl(S); v45Msg(S, `◀ Lùi lại bước ${S.idx + 1}: xoay ngược ${S.A.name(st)}`); }
// each frame: auto-run + finish + history chips
function v45Tick(S, dt){
  if(S.on){ const busy = S.A.busy(); if(!busy) S.cur = null;
    if(!busy && S.idx >= S.plan.length){ if(S.A.solved()){ v45Stop(S, `🎉 Xong! Khối đã được giải sau ${S.plan.length} bước. Thử tự giải lại nhé!`); try { S.A.done && S.A.done(); } catch(e){} try { cheerSfx(); } catch(e){} } else if(S.play){ S.play = false; v45Ctl(S); } }
    else if(S.play && !busy){ S.wait -= dt; if(S.wait <= 0){ S.wait = .45; v45Next(S); } } }
  if(S.log.length !== S.logN){ S.logN = S.log.length; const box = S.box.querySelector('.v45hist .v45mv'); box.innerHTML = ''; const L = S.log.slice(-60);
    if(!L.length) box.innerHTML = '<i>Chưa xoay nước nào</i>'; L.forEach(m => { const s = document.createElement('span'); s.className = 'v45m ' + (m.t || ''); s.textContent = m.n; box.appendChild(s); }); box.scrollLeft = box.scrollWidth; }
  if(S.on && S.planN !== S.idx){ S.planN = S.idx; const box = S.box.querySelector('.v45plan .v45mv'); box.innerHTML = ''; S.plan.forEach((st, i) => { const s = document.createElement('span'); s.className = 'v45m' + (i < S.idx ? ' done' : i === S.idx ? ' now' : ''); s.textContent = S.A.name(st); box.appendChild(s); });
    const now = box.querySelector('.now') || box.lastChild; if(now) box.scrollLeft = Math.max(0, now.offsetLeft - box.clientWidth/2); }
}
const v45Log = (S, n, t) => { S.log.push({n, t}); if(S.log.length > 400) S.log.splice(0, 100); };

// ---------- Phòng Rubik (mLab): moves are names like R, U', R2, Rw, M, x ----------
const V45L = {P:null, seq:[], tag:''};
const v45LN = () => LAB.kind === 'pyra' ? 3 : 4;
const v45LB = m => m.replace(/['2]$/, '');
const v45LA = m => m.endsWith('2') ? 2 : m.endsWith("'") ? v45LN() - 1 : 1;
const v45LNm = (b, k) => k === 1 ? b : k === v45LN() - 1 ? b + "'" : b + '2';
function v45LP(seq, m){ const t = seq[seq.length - 1]; if(t && v45LB(t) === v45LB(m)){ const k = (v45LA(t) + v45LA(m)) % v45LN(); seq.pop(); if(k) seq.push(v45LNm(v45LB(m), k)); } else seq.push(m); }
function v45Lab(){
  const cv = $('#labCv'); if(!cv) return; const main = cv.parentElement;
  const S = v45SolUI('lab', main, {
    busy:() => !!(LAB.anim || LAB.queue.length), pyra:() => LAB.kind === 'pyra',
    apply:m => labMove(m, false), inv:m => invMove(m), name:m => m, solved:() => solvedP(LAB.P),
    plan:() => { if(V45L.P !== LAB.P) return []; const p = []; V45L.seq.slice().reverse().forEach(m => v45LP(p, invMove(m))); return p; },
    begin:() => { LAB.hist = []; LAB.timing = false; },
    done:() => { LAB.scrambled = false; labStatus(); }
  });
  // every move really applied to the lab cube is tracked (scramble, buttons, keys, formulas, coach setup)
  const am = applyMove; applyMove = function(P, name){ const r = am.apply(this, arguments);
    if(r && typeof LAB !== 'undefined' && P === LAB.P){ if(V45L.P !== P){ V45L.P = P; V45L.seq = []; } v45LP(V45L.seq, name); v45Log(S, name, V45L.tag || (S.self || S.on ? 'sol' : ''));
      if(!V45L.tag && solvedP(P)) V45L.seq = []; }
    return r; };
  const sc = labScramble; labScramble = function(){ v45Stop(S); V45L.tag = 'scr'; try { return sc.apply(this, arguments); } finally { V45L.tag = ''; if(solvedP(LAB.P)) V45L.seq = []; v45Msg(S, '🔀 Đã xáo trộn. Tự giải thử, hoặc bấm 🪄 Giải giúp để xem từng bước.'); } };
  const ln = labNew; labNew = function(){ v45Stop(S); const r = ln.apply(this, arguments); V45L.P = LAB.P; V45L.seq = []; S.log = []; v45Msg(S, ''); return r; };
  const lm = labMove; labMove = function(m, rec){ if(S.on && !S.self && LAB.P && LAB.P.M[m]) v45Stop(S, '✋ Bạn đã tự xoay, chế độ giải giúp tạm dừng. Bấm 🪄 để giải tiếp.'); return lm.apply(this, arguments); };
  $('#labSolve').onclick = () => v45Start(S);
  // after each frame of the cube: run the solver + draw the arrow on the layer that turns
  const ld = labDraw; let last = 0; labDraw = function(){ ld.apply(this, arguments); const now = performance.now(), dt = Math.min(.1, (now - (last || now))/1000); last = now; v45Tick(S, dt);
    const m = S.cur || (S.on && S.idx < S.plan.length ? S.plan[S.idx] : null); if(m) v45LabArrow(m, S.cur ? 1 : .75 + .2*Math.sin(now/260)); };
}
function v45LabArrow(name, alpha){
  const P = LAB.P, mv = P && P.M[name]; if(!mv) return; const cv = $('#labCv'), c = cv.getContext('2d'), Wc = cv.width, Hc = cv.height;
  const cy = Math.cos(LAB.yaw), sy = Math.sin(LAB.yaw), cp = Math.cos(LAB.pitch), sp = Math.sin(LAB.pitch);
  const view = v => { const x = v[0]*cy + v[2]*sy, z = -v[0]*sy + v[2]*cy; return [x, v[1]*cp - z*sp, v[1]*sp + z*cp]; };
  const sc = Math.min(Wc, Hc)/(P.size*1.9), persp = z => 1/(1 - z*.06), P2 = p => [Wc/2 + p[0]*sc*persp(p[2]), Hc/2 - p[1]*sc*persp(p[2])];
  const ax = mv.ax; let d = 0, n = 0; P.slots.forEach((s, i) => { if(mv.inL[i]){ d += s.c[0]*ax[0] + s.c[1]*ax[1] + s.c[2]*ax[2]; n++; } }); d = n ? d/n : 0;
  const [u, v] = v45Basis(ax), r = P.kind === 'pyra' ? 2.7 : P.N*.82, s = Math.sign(mv.ang) || 1, tc = Math.atan2(view(v)[2], view(u)[2]), pts = [];
  for(let i=0;i<=18;i++){ const t = tc + s*(-1.05 + 2.1*i/18), w = [0, 1, 2].map(j => ax[j]*d + r*(u[j]*Math.cos(t) + v[j]*Math.sin(t))); pts.push(P2(view(w))); }
  v45Arrow(c, pts, name, Wc/560, alpha);
}

// ---------- Rubik 3D (mRubik): moves are {axis, layer, dir} quarter turns ----------
const V45R = {seq:[]}; // seq: [{axis, layer, k}] k = quarter turns in + direction
function r3Name(st){ const n = st.n === 2;
  for(const [k, m] of Object.entries(RMOVES)) if(m[0] === st.axis && m[1] === st.layer) return k + (n ? '2' : st.dir === m[2] ? '' : "'");
  const mid = {x:['M', 1], y:['E', 1], z:['S', -1]}[st.axis]; return mid[0] + (n ? '2' : st.dir === mid[1] ? '' : "'"); }
function r3Push(seq, axis, layer, k){ const t = seq[seq.length - 1]; if(t && t.axis === axis && t.layer === layer){ const q = (t.k + k) % 4; seq.pop(); if(q) seq.push({axis, layer, k:q}); } else seq.push({axis, layer, k}); }
function v45Rubik(){
  const cv = $('#rubikCv'); if(!cv) return; const wrap = cv.parentElement, col = document.createElement('div'); col.className = 'v45col'; const stage = document.createElement('div'); stage.className = 'v45stage';
  wrap.insertBefore(col, cv); col.appendChild(stage); stage.appendChild(cv); const ov = document.createElement('canvas'); ov.className = 'v45ov'; ov.setAttribute('aria-hidden', 'true'); stage.appendChild(ov);
  const S = v45SolUI('r3', col, {
    busy:() => !!(R3 && (R3.anim || R3.queue.length)), name:r3Name, solved:() => !!R3 && rubikSolved(),
    inv:st => ({axis:st.axis, layer:st.layer, dir:st.n === 2 ? st.dir : -st.dir, n:st.n}),
    apply:st => { R3.solving = true; R3.timing = false; for(let i=0;i<(st.n || 1);i++) R3.queue.push({axis:st.axis, layer:st.layer, dir:st.dir, record:false, speed:.85, v45:1}); },
    plan:() => V45R.seq.slice().reverse().map(e => { const k = (4 - e.k) % 4; return {axis:e.axis, layer:e.layer, dir:k === 3 ? -1 : 1, n:k === 2 ? 2 : 1}; }),
    begin:() => { if(R3){ R3.hist = []; R3.timing = false; } }
  });
  const rs = rubikStep; rubikStep = function(){ const a = R3 && R3.anim, scr = R3 && R3.scrambling; const r = rs.apply(this, arguments);
    if(a && R3.anim !== a){ const q = a.q; r3Push(V45R.seq, q.axis, q.layer, q.dir > 0 ? 1 : 3); v45Log(S, r3Name({axis:q.axis, layer:q.layer, dir:q.dir}), scr ? 'scr' : q.v45 ? 'sol' : ''); if(!R3.queue.length && rubikSolved()) V45R.seq = []; }
    return r; };
  const ut = userTurn; userTurn = function(){ if(S.on && R3 && !R3.solving) v45Stop(S, '✋ Bạn đã tự xoay, chế độ giải giúp tạm dừng. Bấm 🪄 để giải tiếp.'); return ut.apply(this, arguments); };
  $('#rsolve').onclick = () => v45Start(S);
  const scr = $('#rscramble').onclick; $('#rscramble').onclick = function(){ v45Stop(S); const r = scr.apply(this, arguments); v45Msg(S, '🔀 Đang xáo trộn…'); return r; };
  const rst = $('#rreset').onclick; $('#rreset').onclick = function(){ v45Stop(S); const r = rst.apply(this, arguments); V45R.seq = []; S.log = []; v45Msg(S, ''); return r; };
  let last = 0; const loop = now => { if(!openModal || openModal.id !== 'mRubik' || !R3){ V45R.raf = 0; return; } const dt = Math.min(.1, (now - (last || now))/1000); last = now; v45Tick(S, dt); v45R3Arrow(S, ov, now); V45R.raf = requestAnimationFrame(loop); };
  const or = openRubik; openRubik = function(){ const r = or.apply(this, arguments); cancelAnimationFrame(V45R.raf); V45R.raf = requestAnimationFrame(loop); return r; };
}
function v45R3Arrow(S, ov, now){
  const w = ov.clientWidth, h = ov.clientHeight, dpr = Math.min(2, devicePixelRatio || 1); if(!w) return;
  if(ov.width !== Math.round(w*dpr) || ov.height !== Math.round(h*dpr)){ ov.width = Math.round(w*dpr); ov.height = Math.round(h*dpr); }
  const c = ov.getContext('2d'); c.clearRect(0, 0, ov.width, ov.height);
  const st = S.cur || (S.on && S.idx < S.plan.length ? S.plan[S.idx] : null); if(!st || typeof THREE === 'undefined') return;
  const ax = [st.axis === 'x' ? 1 : 0, st.axis === 'y' ? 1 : 0, st.axis === 'z' ? 1 : 0], [u, v] = v45Basis(ax), cam = R3.camera.position, r = 2.25, s = st.dir;
  const tc = Math.atan2(cam.x*v[0] + cam.y*v[1] + cam.z*v[2], cam.x*u[0] + cam.y*u[1] + cam.z*u[2]), pts = [], p = new THREE.Vector3();
  for(let i=0;i<=18;i++){ const t = tc + s*(-1.05 + 2.1*i/18); p.set(...[0, 1, 2].map(j => ax[j]*st.layer + r*(u[j]*Math.cos(t) + v[j]*Math.sin(t)))).project(R3.camera); pts.push([(p.x + 1)/2*ov.width, (1 - p.y)/2*ov.height]); }
  v45Arrow(c, pts, r3Name(st), ov.width/520, S.cur ? 1 : .75 + .2*Math.sin(now/260));
}

// ---------- world: Rubik statue plaza (rubikpark) ----------
function v45Off(w, h){ const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
function v45With(c, f){ const prev = ctx; ctx = c.getContext('2d'); try { f(ctx); } finally { ctx = prev; } }
const v45Rr = (c, x, y, w, h, r) => { c.beginPath(); if(c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
function v45ParkGeo(r){ const cx = r.x + r.w/2, base = r.y + r.h/PHI + r.h/(PHI**4), R1 = r.w/2 - 24; return {cx, base, R1, R2:R1/PHI, R3:R1/PHI/PHI, stepsW:r.w/PHI}; }
function v45BuildPark(r){
  const g = v45ParkGeo(r), c = v45Off(r.w, r.h), dong = season === 'dong', se = S();
  v45With(c, x => { x.translate(-r.x, -r.y);
    // lawn with rounded corners (the soft hedge around the zone stays visible)
    x.fillStyle = se.grass; v45Rr(x, r.x + 10, r.y + 10, r.w - 20, r.h - 20, 34); x.fill();
    x.fillStyle = 'rgba(255,255,255,.05)'; for(let yy = r.y + 16; yy < r.y + r.h - 16; yy += 18) x.fillRect(r.x + 14, yy, r.w - 28, 8);
    // path toward the school (south) and the outer ring path
    const pw = g.R3*1.2; x.fillStyle = dong ? '#e9eef1' : '#e6dcc8'; x.fillRect(g.cx - pw/2, g.base, pw, r.y + r.h - 10 - g.base);
    x.strokeStyle = 'rgba(120,100,70,.25)'; x.lineWidth = 1; for(let yy = g.base + 12; yy < r.y + r.h - 10; yy += 16){ x.beginPath(); x.moveTo(g.cx - pw/2, yy); x.lineTo(g.cx + pw/2, yy); x.stroke(); }
    // golden rings: R1 → R2 → R3 (each 1/φ of the one before), squashed by 1/φ for a gentle top-down look
    const ring = (R, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(g.cx, g.base - 8, R, R/PHI, 0, 0, 7); x.fill(); };
    ring(g.R1 + 6, dong ? '#cfd8dc' : '#cdbf9f'); ring(g.R1, dong ? '#eef3f5' : '#ece2cc');
    x.strokeStyle = dong ? 'rgba(90,110,120,.25)' : 'rgba(140,115,75,.28)'; x.lineWidth = 1.2;
    for(let i=0;i<16;i++){ const a = i/16*Math.PI*2; x.beginPath(); x.moveTo(g.cx + Math.cos(a)*g.R2, g.base - 8 + Math.sin(a)*g.R2/PHI); x.lineTo(g.cx + Math.cos(a)*g.R1, g.base - 8 + Math.sin(a)*g.R1/PHI); x.stroke(); }
    ring(g.R2 + 3, dong ? '#b0bec5' : '#b9a57e'); ring(g.R2, dong ? '#dfe7ea' : '#ddd0b2'); ring(g.R3, dong ? '#cfd8dc' : '#cbb994');
    // flower beds in the corners (quarter circles, radius = zone width / φ³)
    const fr = r.w/(PHI*PHI*PHI), cols = dong ? ['#fff', '#e3f2fd'] : ['#ff6f91', '#ffd23f', '#f4f4f4', '#b06bff', '#ff8a2b'];
    [[r.x + 14, r.y + 14, 0], [r.x + r.w - 14, r.y + 14, Math.PI/2], [r.x + 14, r.y + r.h - 14, -Math.PI/2], [r.x + r.w - 14, r.y + r.h - 14, Math.PI]].forEach(([fx, fy, a0], k) => {
      x.fillStyle = dong ? '#dfe6e9' : '#5d8f3a'; x.beginPath(); x.moveTo(fx, fy); x.arc(fx, fy, fr, a0, a0 + Math.PI/2); x.closePath(); x.fill();
      for(let i=0;i<26;i++){ const a = a0 + .12 + (i*0.618 % 1)*(Math.PI/2 - .24), d = 14 + ((i*37) % 100)/100*(fr - 22); x.fillStyle = cols[(i + k) % cols.length]; x.beginPath(); x.arc(fx + Math.cos(a)*d, fy + Math.sin(a)*d, 3, 0, 7); x.fill(); } });
    // trimmed hedge arc behind the statue
    x.strokeStyle = dong ? '#c5d3d8' : '#3f7a34'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.ellipse(g.cx, g.base - 8, g.R1 - 2, (g.R1 - 2)/PHI, 0, Math.PI*1.12, Math.PI*1.88); x.stroke();
    x.strokeStyle = dong ? '#e4ecef' : '#4f9440'; x.lineWidth = 5; x.stroke();
    // benches on the ring, facing the statue
    [-1, 1].forEach(sd => { const bx = g.cx + sd*(g.R1 - 18), by = g.base + 20; x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(bx - 16, by + 6, 32, 4); x.fillStyle = '#8d6e4a'; x.fillRect(bx - 16, by - 6, 32, 10); x.fillStyle = '#6d4c2e'; x.fillRect(bx - 16, by - 10, 32, 4); x.fillRect(bx - 14, by + 4, 3, 6); x.fillRect(bx + 11, by + 4, 3, 6); });
    // title banner (short, readable)
    const t = 'TƯỢNG ĐÀI RUBIK'; x.font = '800 13px Nunito, system-ui, sans-serif'; const tw = x.measureText(t).width + 26;
    const by = r.y + r.h - 40; x.fillStyle = 'rgba(15,21,48,.88)'; v45Rr(x, g.cx - tw/2, by, tw, 22, 11); x.fill(); x.strokeStyle = '#e8c27a'; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = '#ffe9a8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, g.cx, by + 11);
  });
  return c;
}
const V45_STK = {top:'#f4f4f4', left:'#2fbf71', right:'#ef4b4b'};
function v45StatueDraw(r, mode){ const st = mode !== 'f', fx = mode !== 's';
  const g = v45ParkGeo(r), X = g.cx, Y = g.base, night = typeof isNight === 'function' && isNight();
  // proportions: cube : pedestal height = φ ; steps width = zone width / φ
  const cw = g.stepsW*.8, a = cw/(2*Math.cos(Math.PI/6)), cubeH = 2*a, pedH = cubeH/PHI, stepH = pedH/(PHI*PHI*PHI), plH = pedH - 2*stepH, plW = cw + 20;
  if(st){ ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(X + 8, Y + 2, g.stepsW/2 + 10, 14, 0, 0, 7); ctx.fill(); }
  const box = (w, h, y, front, top) => { rect(front, X - w/2, y - h, w, h); rect(top, X - w/2, y - h - 6, w, 6); rect('rgba(255,255,255,.18)', X - w/2, y - h, w, 2); rect('rgba(0,0,0,.12)', X + w/2 - 8, y - h, 8, h); };
  if(st){ box(g.stepsW, stepH, Y, '#9e9483', '#c9bfac'); box(g.stepsW - 22, stepH, Y - stepH, '#a99f8d', '#d3c9b6'); }
  const pTop = Y - 2*stepH - plH; if(st) box(plW, plH, Y - 2*stepH, '#b9ae9a', '#ddd3c0');
  // plaque (gold, golden rectangle)
  const qw = plW/PHI, qh = qw/PHI/PHI*1.25, qy = pTop + (plH - qh)/2 + 3; if(st){ ctx.fillStyle = '#b8862e'; v45Rr(ctx, X - qw/2 - 2, qy - 2, qw + 4, qh + 4, 4); ctx.fill(); ctx.fillStyle = '#e8c27a'; v45Rr(ctx, X - qw/2, qy, qw, qh, 3); ctx.fill();
  ctx.fillStyle = '#4a3010'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${Math.round(qh*.3)}px Nunito, system-ui, sans-serif`; ctx.fillText('THE RUBIK', X, qy + qh*.33); ctx.fillText('SCHOOL', X, qy + qh*.7); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; }
  // the cube: isometric, sitting on the plinth
  const B = [X, pTop - 6 + a*.0], Fc = [X, B[1] - a], L = [X - cw/2, Fc[1] - a/2], Rt = [X + cw/2, Fc[1] - a/2], T = [X, Fc[1] - a];
  const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill(); };
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]], mul = (p, k) => [p[0]*k, p[1]*k], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  if(st){ poly([T, Rt, Fc, L], '#24262e'); poly([L, Fc, B, add(L, [0, a])], '#17181e'); poly([Fc, Rt, add(Rt, [0, a]), B], '#101116'); }
  if(st){ const face = (O, u, v, col, shade) => { for(let i=0;i<3;i++) for(let j=0;j<3;j++){ const gp = .08, s = .84, o = add(O, add(mul(u, i + gp), mul(v, j + gp))), q = [o, add(o, mul(u, s)), add(o, add(mul(u, s), mul(v, s))), add(o, mul(v, s))];
      poly(q, col); if(shade) poly(q, shade); poly([q[0], add(q[0], mul(u, s)), add(add(q[0], mul(u, s)), mul(v, .16)), add(q[0], mul(v, .16))], 'rgba(255,255,255,.28)'); } };
  face(T, mul(sub(Rt, T), 1/3), mul(sub(L, T), 1/3), V45_STK.top, null);
  face(L, mul(sub(Fc, L), 1/3), [0, a/3], V45_STK.left, 'rgba(0,0,0,.1)');
  face(Fc, mul(sub(Rt, Fc), 1/3), [0, a/3], V45_STK.right, 'rgba(0,0,0,.24)');
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(T[0], T[1]); ctx.lineTo(Rt[0], Rt[1]); ctx.stroke(); }
  // slow light glint sweeping across the cube + twinkles (chill, every ~7 s)
  if(fx){ const ph = (realT*.14) % 1; if(ph < .35){ const k = ph/.35, gx = X - cw/2 + k*(cw + 40) - 20; ctx.save(); ctx.beginPath(); [T, Rt, add(Rt, [0, a]), B, add(L, [0, a]), L].forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.clip();
    const gr = ctx.createLinearGradient(gx - 24, 0, gx + 24, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(gx - 24, T[1], 48, cubeH + 4); ctx.restore(); }
  for(let i=0;i<3;i++){ const tw = Math.max(0, Math.sin(realT*1.3 + i*2.1)); if(tw < .6) continue; const sx = X + [-.55, .5, .1][i]*cw, sy = T[1] + [.25, .1, -.12][i]*cubeH, k = (tw - .6)*14;
    ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.moveTo(sx, sy - k); ctx.lineTo(sx + k*.25, sy); ctx.lineTo(sx, sy + k); ctx.lineTo(sx - k*.25, sy); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx - k, sy); ctx.lineTo(sx, sy + k*.25); ctx.lineTo(sx + k, sy); ctx.lineTo(sx, sy - k*.25); ctx.closePath(); ctx.fill(); } }
  // lamp posts flanking the statue (glow at night)
  if(st) [-1, 1].forEach(sd => { const lx = X + sd*(g.stepsW/2 + 22), ly = Y + 4; if(night){ const gl = ctx.createRadialGradient(lx, ly - 64, 2, lx, ly - 64, 46); gl.addColorStop(0, 'rgba(255,214,120,.55)'); gl.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = gl; ctx.fillRect(lx - 46, ly - 110, 92, 92); }
    rect('rgba(0,0,0,.18)', lx - 6, ly - 2, 14, 4); rect('#2f3442', lx - 2, ly - 60, 4, 60); rect('#3d4354', lx - 5, ly - 4, 10, 4); rect('#2f3442', lx - 7, ly - 72, 14, 4); rect(night ? '#ffe39a' : '#f6efd9', lx - 5, ly - 68, 10, 10); rect('#2f3442', lx - 6, ly - 59, 12, 2); });
}

// statue = cached image (rebuilt only when the zone/season/day-night changes) + a cheap glint on top
function v45Statue(r){
  const g = v45ParkGeo(r), night = typeof isNight === 'function' && isNight(), key = V45.parkKey + night, ox = g.cx - g.stepsW/2 - 80, oy = g.base - 380, w = g.stepsW + 160, h = 410;
  if(V45.stKey !== key){ V45.stKey = key; const k = Math.min(2, devicePixelRatio || 1), c = v45Off(w*k, h*k); v45With(c, x => { x.scale(k, k); x.translate(-ox, -oy); v45StatueDraw(r, 's'); }); V45.st = c; }
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(V45.st, ox, oy, w, h); ctx.imageSmoothingEnabled = sm; v45StatueDraw(r, 'f');
}

// ---------- world: open Rubik court (rubikyard, no walls) ----------
function v45BuildYard(r){
  const c = v45Off(r.w + 20, r.h + 20), dong = season === 'dong', se = S();
  v45With(c, x => { x.translate(-r.x + 10, -r.y + 10);
    x.fillStyle = se.grass; x.fillRect(r.x - 10, r.y - 10, r.w + 20, r.h + 20);
    x.fillStyle = dong ? '#e8eef1' : '#e9e0cc'; v45Rr(x, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 26); x.fill();
    x.strokeStyle = dong ? 'rgba(90,110,120,.18)' : 'rgba(140,115,75,.22)'; x.lineWidth = 1; for(let xx = r.x + 26; xx < r.x + r.w - 10; xx += 20){ x.beginPath(); x.moveTo(xx, r.y + 8); x.lineTo(xx, r.y + r.h - 8); x.stroke(); } for(let yy = r.y + 26; yy < r.y + r.h - 10; yy += 20){ x.beginPath(); x.moveTo(r.x + 8, yy); x.lineTo(r.x + r.w - 8, yy); x.stroke(); }
    // floor mosaic: one Rubik face (3×3) centred on the court at height / φ
    const cx = r.x + r.w/2, cy = r.y + r.h/PHI, t = 22, cols = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b', '#2fbf71', '#ef4b4b', '#ffd23f'];
    x.fillStyle = 'rgba(30,30,40,.85)'; v45Rr(x, cx - 1.5*t - 6, cy - 1.5*t - 6, 3*t + 12, 3*t + 12, 10); x.fill();
    for(let i=0;i<9;i++){ x.fillStyle = cols[i]; v45Rr(x, cx - 1.5*t + (i%3)*t + 2, cy - 1.5*t + Math.floor(i/3)*t + 2, t - 4, t - 4, 4); x.fill(); }
    // short hedges in the four corners instead of walls (open on every side)
    [[r.x + 8, r.y + 8], [r.x + r.w - 44, r.y + 8], [r.x + 8, r.y + r.h - 20], [r.x + r.w - 44, r.y + r.h - 20]].forEach(([hx, hy]) => { x.fillStyle = dong ? '#c5d3d8' : '#3f7a34'; v45Rr(x, hx, hy, 36, 12, 6); x.fill(); x.fillStyle = dong ? '#e4ecef' : '#5aa04a'; v45Rr(x, hx + 2, hy + 1, 32, 5, 3); x.fill(); });
    // benches where students practise, each with a small cube
    RY_SPOTS.forEach(([bx, by], k) => { const lx = bx - 60 + r.x, ly = by - 480 + r.y - 22; x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(lx - 17, ly + 12, 34, 4); x.fillStyle = '#8d6e4a'; x.fillRect(lx - 17, ly, 34, 10); x.fillStyle = '#6d4c2e'; x.fillRect(lx - 17, ly, 34, 3); x.fillRect(lx - 15, ly + 10, 3, 5); x.fillRect(lx + 12, ly + 10, 3, 5);
      for(let i=0;i<4;i++){ x.fillStyle = cols[(i + k) % 9]; x.fillRect(lx + 6 + (i%2)*4, ly + 2 + Math.floor(i/2)*4, 3, 3); } });
    const tt = 'SÂN RUBIK'; x.font = '800 13px Nunito, system-ui, sans-serif'; const tw = x.measureText(tt).width + 24;
    x.fillStyle = 'rgba(15,21,48,.88)'; v45Rr(x, r.x + 4, r.y - 8, tw, 22, 11); x.fill(); x.strokeStyle = '#2fbf71'; x.lineWidth = 1.5; x.stroke(); x.fillStyle = '#d9ffe8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(tt, r.x + 4 + tw/2, r.y + 3);
  });
  return c;
}
function v45MiniCube(x, y, a){ const cw = 2*a*Math.cos(Math.PI/6), Fc = [x, y - a], L = [x - cw/2, Fc[1] - a/2], Rt = [x + cw/2, Fc[1] - a/2], T = [x, Fc[1] - a];
  const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill(); };
  rect('rgba(0,0,0,.2)', x - cw/2 - 2, y + 8, cw + 8, 5); rect('#b9ae9a', x - cw/2 - 4, y - 2, cw + 8, 12); rect('#ddd3c0', x - cw/2 - 4, y - 5, cw + 8, 4);
  poly([T, Rt, Fc, L], V45_STK.top); poly([L, Fc, [x, y], [L[0], L[1] + a]], V45_STK.left); poly([Fc, Rt, [Rt[0], Rt[1] + a], [x, y]], '#c93a3a');
  ctx.strokeStyle = '#15161c'; ctx.lineWidth = 1.2; ctx.beginPath();
  for(let i=1;i<3;i++){ const k = i/3; ctx.moveTo(T[0] + (Rt[0] - T[0])*k, T[1] + (Rt[1] - T[1])*k); ctx.lineTo(L[0] + (Fc[0] - L[0])*k, L[1] + (Fc[1] - L[1])*k); ctx.moveTo(T[0] + (L[0] - T[0])*k, T[1] + (L[1] - T[1])*k); ctx.lineTo(Rt[0] + (Fc[0] - Rt[0])*k, Rt[1] + (Fc[1] - Rt[1])*k);
    ctx.moveTo(L[0] + (Fc[0] - L[0])*k, L[1] + (Fc[1] - L[1])*k); ctx.lineTo(L[0] + (Fc[0] - L[0])*k, L[1] + (Fc[1] - L[1])*k + a); ctx.moveTo(Fc[0] + (Rt[0] - Fc[0])*k, Fc[1] + (Rt[1] - Fc[1])*k); ctx.lineTo(Fc[0] + (Rt[0] - Fc[0])*k, Fc[1] + (Rt[1] - Fc[1])*k + a);
    ctx.moveTo(L[0], L[1] + a*k); ctx.lineTo(Fc[0], Fc[1] + a*k); ctx.lineTo(Rt[0], Rt[1] + a*k); }
  ctx.stroke(); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(T[0], T[1]); ctx.lineTo(Rt[0], Rt[1]); ctx.lineTo(Rt[0], Rt[1] + a); ctx.lineTo(x, y); ctx.lineTo(L[0], L[1] + a); ctx.closePath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(Fc[0], Fc[1]); ctx.lineTo(Rt[0], Rt[1]); ctx.moveTo(Fc[0], Fc[1]); ctx.lineTo(x, y); ctx.stroke(); }

// ---------- world: giant chess board (redrawn) ----------
function v45BoardGeo(r){ const s = (typeof GBOARD !== 'undefined' && GBOARD.s) || 48; return {s, bw:s*8, x:r.x + 140, y:r.y + 60}; }
function v45BuildBoard(r){
  const g = v45BoardGeo(r), m = 30, c = v45Off(r.w, r.h), dong = season === 'dong', se = S();
  v45With(c, x => { x.translate(-r.x, -r.y);
    x.fillStyle = se.grass; v45Rr(x, r.x + 4, r.y + 2, r.w - 8, r.h - 6, 34); x.fill();
    // stone terrace around the board
    x.fillStyle = dong ? '#e9eef1' : '#e6dcc8'; v45Rr(x, g.x - m - 18, g.y - m - 18, g.bw + 2*m + 36, g.bw + 2*m + 50, 18); x.fill();
    x.strokeStyle = dong ? 'rgba(90,110,120,.2)' : 'rgba(140,115,75,.25)'; x.lineWidth = 1; for(let yy = g.y - m - 6; yy < g.y + g.bw + m + 30; yy += 18){ x.beginPath(); x.moveTo(g.x - m - 16, yy); x.lineTo(g.x + g.bw + m + 16, yy); x.stroke(); }
    // wooden frame with a gold inlay
    x.fillStyle = 'rgba(0,0,0,.22)'; v45Rr(x, g.x - m + 6, g.y - m + 8, g.bw + 2*m, g.bw + 2*m, 12); x.fill();
    x.fillStyle = '#6b3e1e'; v45Rr(x, g.x - m, g.y - m, g.bw + 2*m, g.bw + 2*m, 12); x.fill();
    x.fillStyle = '#8a5530'; v45Rr(x, g.x - m + 4, g.y - m + 4, g.bw + 2*m - 8, g.bw + 2*m - 8, 9); x.fill();
    x.strokeStyle = '#e8c27a'; x.lineWidth = 2; x.strokeRect(g.x - 5, g.y - 5, g.bw + 10, g.bw + 10);
    for(let i=0;i<8;i++) for(let j=0;j<8;j++){ x.fillStyle = (i + j)%2 ? '#b07a4a' : '#f0d9b5'; x.fillRect(g.x + i*g.s, g.y + j*g.s, g.s, g.s); }
    x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(g.x, g.y, g.bw, g.bw/2);
    x.font = '800 14px Nunito, system-ui, sans-serif'; x.fillStyle = '#ffe9c4'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for(let i=0;i<8;i++){ x.fillText('abcdefgh'[i], g.x + i*g.s + g.s/2, g.y + g.bw + m/2); x.fillText(String(8 - i), g.x - m/2, g.y + i*g.s + g.s/2); }
    const t = 'CỜ VUA KHỔNG LỒ · BẤM ĐỂ CHƠI'; x.font = '800 13px Nunito, system-ui, sans-serif'; const tw = x.measureText(t).width + 26, ty = g.y + g.bw + m + 6;
    x.fillStyle = 'rgba(15,21,48,.88)'; v45Rr(x, g.x + g.bw/2 - tw/2, ty, tw, 22, 11); x.fill(); x.strokeStyle = '#e8c27a'; x.lineWidth = 1.5; x.stroke(); x.fillStyle = '#ffe9a8'; x.fillText(t, g.x + g.bw/2, ty + 11);
  });
  return c;
}
function v45BoardPieces(r){
  if(typeof chessGame === 'undefined' || !chessGame) return; const g = v45BoardGeo(r), fen = chessGame.fen();
  if(V45.pcKey !== fen + g.s){ V45.pcKey = fen + g.s; const k = Math.min(2, devicePixelRatio || 1), c = v45Off(g.bw*k, (g.bw + g.s)*k); v45With(c, x => { x.scale(k, k); x.translate(0, g.s);
      const bd = chessGame.board(), hist = chessGame.history({verbose:true}), lm = hist[hist.length - 1];
      if(lm) [lm.from, lm.to].forEach(sq => { const f = sq.charCodeAt(0) - 97, rr = 8 - +sq[1]; rect('rgba(255,214,64,.42)', f*g.s, rr*g.s, g.s, g.s); });
      for(let rr=0;rr<8;rr++) for(let f=0;f<8;f++){ const p = bd[rr][f]; if(!p) continue; const px = f*g.s, py = rr*g.s, im = PIMG[pKey(p)];
        x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(px + g.s/2 + 3, py + g.s - 7, g.s*.32, g.s*.09, 0, 0, 7); x.fill();
        if(im && im.complete && im.naturalWidth) x.drawImage(im, px + g.s*.06, py - g.s*.08, g.s*.88, g.s*.88); else { V45.pcKey = ''; circ(px + g.s/2, py + g.s/2, g.s*.3, p.color === 'w' ? '#fafafa' : '#222'); } } }); V45.pc = c; }
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(V45.pc, g.x, g.y - g.s, g.bw, g.bw + g.s); ctx.imageSmoothingEnabled = sm;
}

// ---------- world: the 5 small chess tables (redrawn, readable at any zoom) ----------
function v45ChessTable(i, x, y){
  const T = typeof TABLES !== 'undefined' ? TABLES[i] : null, C = V45.tb || (V45.tb = []), key = (T ? T.g.fen() : '-') + x + ',' + y;
  if(!C[i] || C[i].key !== key){ const k = 3, c = v45Off(72*k, 80*k); v45With(c, cx => { cx.scale(k, k); cx.translate(36 - x, 40 - y); v45ChessTableDraw(i, x, y); }); C[i] = {key, c}; }
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(C[i].c, x - 36, y - 40, 72, 80); ctx.imageSmoothingEnabled = sm;
}
function v45ChessTableDraw(i, x, y){
  const s = 6, bw = s*8, bx = x - bw/2, by = y - bw/2 - 4, T = typeof TABLES !== 'undefined' ? TABLES[i] : null;
  rect('rgba(0,0,0,.18)', x - 30, y + 22, 64, 6); rect('#5a3418', x - 27, y + 18, 5, 10); rect('#5a3418', x + 22, y + 18, 5, 10);
  ctx.fillStyle = '#6b3e1e'; v45Rr(ctx, x - 30, y - 34, 60, 56, 6); ctx.fill(); ctx.fillStyle = '#8a5530'; v45Rr(ctx, x - 28, y - 32, 56, 52, 5); ctx.fill();
  rect('#3d2410', bx - 2, by - 2, bw + 4, bw + 4);
  for(let r=0;r<8;r++) for(let f=0;f<8;f++) rect((r + f)%2 ? '#b07a4a' : '#f0d9b5', bx + f*s, by + r*s, s, s);
  if(T){ if(T.last) ['from', 'to'].forEach(k => { const f = T.last[k].charCodeAt(0) - 97, r = 8 - +T.last[k][1]; rect('rgba(255,214,64,.6)', bx + f*s, by + r*s, s, s); });
    const bd = T.g.board(), big = true;
    for(let r=0;r<8;r++) for(let f=0;f<8;f++){ const p = bd[r][f]; if(!p) continue; const px = bx + f*s + s/2, py = by + r*s + s/2, im = PIMG[pKey(p)];
      if(big && im && im.complete && im.naturalWidth) ctx.drawImage(im, bx + f*s - .4, by + r*s - .8, s + .8, s + .8);
      else { const rad = p.type === 'p' ? 1.6 : p.type === 'k' || p.type === 'q' ? 2.6 : 2.2; ctx.fillStyle = p.color === 'w' ? '#5a3a1e' : '#f0d9b5'; ctx.beginPath(); ctx.arc(px, py, rad + .8, 0, 7); ctx.fill(); ctx.fillStyle = p.color === 'w' ? '#ffffff' : '#1d1d24'; ctx.beginPath(); ctx.arc(px, py, rad, 0, 7); ctx.fill(); } } }
  ctx.font = '800 10px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#fff4dc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(15,21,48,.8)'; v45Rr(ctx, x - 17, y + 27, 34, 13, 6); ctx.fill(); ctx.fillStyle = '#fff4dc'; ctx.fillText('Bàn ' + (i + 1), x, y + 34); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

const v45Key = r => season + r.x + ',' + r.y + ',' + r.w + ',' + r.h;
function v45ParkImg(r){ const k = v45Key(r); if(V45.parkKey !== k){ V45.park = v45BuildPark(r); V45.parkKey = k; } return V45.park; }
function v45BoardImg(r){ const k = v45Key(r); if(V45.boardKey !== k){ V45.board = v45BuildBoard(r); V45.boardKey = k; } return V45.board; }
const v45Baked = r => { const b = V45.baked.get(r); return !!(b && northCache && b.c === northCache && b.k === v45Key(r) && northSeason === season); };

// chess from the map: open the board at once; a fresh board starts against the computer
function v45PlayChess(){ openChess(); try { if(chessGame && !chessGame.history().length && (typeof cMode === 'undefined' || cMode === 'local')) $('#cmodes [data-mode=ai]').click(); } catch(e){} }
function v45World(){
  try { R.rubikpark.name = 'Tượng đài Rubik · biểu tượng trường'; R.rubikyard.name = 'Sân Rubik'; R.rubikyard.walls = false; R.rubikyard.fence = false; R.rubikyard.open = true; } catch(e){}
  try { MAP_INFO.rubikpark = ['🧊', 'Tượng đài Rubik: biểu tượng của trường']; MAP_INFO.rubikyard = ['🧊', 'Sân Rubik mở: ngồi giải Rubik']; } catch(e){}
  try { const k = SOFT_ROOMS.indexOf('rubikyard'); if(k >= 0) SOFT_ROOMS.splice(k, 1); } catch(e){}
  const vis = r => r && !(VB.x1 < r.x - 30 || VB.x0 > r.x + r.w + 30 || VB.y1 < r.y - 40 || VB.y0 > r.y + r.h + 30);
  // ground layer: drawn after the buildings and before people / trees
  const vr = v20Rooms; v20Rooms = function(){ vr.apply(this, arguments); if(typeof FEED !== 'undefined' && FEED) return;
    let r = R.rubikpark; if(vis(r)){ v45ParkImg(r); if(!v45Baked(r)) ctx.drawImage(V45.park, r.x, r.y); }
    r = R.rubikyard; if(vis(r)){ const key = season + r.x + ',' + r.y + ',' + r.w; if(V45.yardKey !== key){ V45.yard = v45BuildYard(r); V45.yardKey = key; } ctx.drawImage(V45.yard, r.x - 10, r.y - 10); }
    r = R.giantchess; if(vis(r)){ v45BoardImg(r); if(!v45Baked(r)) ctx.drawImage(V45.board, r.x, r.y); v45BoardPieces(r); } };
  // zones lying in the northern park are baked once into its static picture (no extra full-zone draw each frame)
  const bn = buildNorth; buildNorth = function(){ const res = bn.apply(this, arguments); try { if(northCache){ const x = northCache.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, -NY);
      [[R.rubikpark, v45ParkImg], [R.giantchess, v45BoardImg]].forEach(([r, mk]) => { if(r && r.y >= NY && r.y + r.h <= 0){ x.drawImage(mk(r), r.x, r.y); V45.baked.set(r, {c:northCache, k:v45Key(r)}); } }); x.restore(); } } catch(e){} return res; };
  northCache = null;
  // the old animated monument cube and the old giant-board pieces sit under the new drawings: skip them
  const nd = drawNorthDyn; drawNorthDyn = function(){ const cg = chessGame, rx = RMON.x; try { chessGame = null; RMON.x = -1e5; return nd.apply(this, arguments); } finally { chessGame = cg; RMON.x = rx; } };
  // statue + court cube as y-sorted sprites (people walk in front / behind them)
  const es = extSprites; extSprites = function(sp){ es(sp); const rp = R.rubikpark, ry = R.rubikyard; if(vis(rp)) sp.push({y:v45ParkGeo(rp).base, f:() => v45Statue(rp)});
    if(vis(ry)) sp.push({y:ry.y + ry.h/PHI + 12, f:() => v45MiniCube(ry.x + ry.w/2, ry.y + ry.h/PHI + 4, 16)}); };
  // small tables
  drawChessTable = v45ChessTable;
  const sg = sign; sign = function(r, text){ if(r === R.rubikyard) return; return sg.apply(this, arguments); };
  // taps: statue / court → Rubik 3D, giant board / chess room → chess game right away
  const hot = (rf, f) => HOTSPOTS.unshift({get r(){ return rf(); }, f});
  hot(() => { const r = R.rubikpark, g = v45ParkGeo(r); return {x:g.cx - g.stepsW/2, y:g.base - 300, w:g.stepsW, h:310}; }, () => openRubik());
  hot(() => { const r = R.rubikyard; return {x:r.x + r.w/2 - 50, y:r.y + r.h/PHI - 60, w:100, h:90}; }, () => openRubik());
  hot(() => { const r = R.giantchess, g = v45BoardGeo(r); return {x:g.x - 30, y:g.y - 30, w:g.bw + 60, h:g.bw + 70}; }, () => v45PlayChess());
  chessRoomClick = function(){ v45PlayChess(); };
  // walking into the Chess room opens a game straight away (once per visit)
  const eu = extUpdate; extUpdate = function(dt){ eu.apply(this, arguments); const P = PLAYER; if(!P || !P.visible || !R.chess) return; const inC = inside(R.chess, P.x, P.y);
    if(inC && !V45.inChess && !openModal && P.controlled !== false){ v45PlayChess(); toast('♟️ Khu cờ vua: chơi ngay với máy!'); } V45.inChess = inC; };
}

function v45RubikChessInit(){
  try { v45Lab(); } catch(e){ console.warn('v45 lab', e); }
  try { v45Rubik(); } catch(e){ console.warn('v45 r3', e); }
  try { v45World(); } catch(e){ console.warn('v45 world', e); }
}
