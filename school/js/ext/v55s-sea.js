// ================= v55s · BIỂN RỘNG: biển bao quanh đất liền, sâu dần ra khơi, tàu thuyền + sinh vật biển chạy vòng quanh =================
// Thế giới nới ra 4 phía bằng toạ độ ÂM (KHÔNG dời tâm đảo): mọi khu trên đảo + đất liền giữ nguyên toạ độ cũ.
// Một hàm "là nước?" dùng chung cho mọi thứ: v55sWater(x, y, m) (thuyền, độ sâu, câu cá, thủy phi cơ, kiểm tra kẹt).
// Mọi tên toàn cục có tiền tố v55s / V55S. Chỉ bọc (gán lại) hàm cũ, không sửa file cũ.
const V55S_PHI = 1.618033988749895, V55S_E = Math.round(V46L.W/V55S_PHI**3);   // 24400/φ³ ≈ 5760: biển nới thêm mỗi phía
const V55S_DEEP = 6000;                                                          // khoảng cách tới bờ để tới vùng sâu nhất
const V55S = {on:false, X0:-V55S_E, Y0:-V55S_E, X1:V46L.W + V55S_E, Y1:V46L.H + V55S_E, far:null, farKey:'', isl:[], lanes:[], movers:[], byShip:new Map(),
  buoys:[], flocks:[], paths:null, area:null, drawn:0, stuck:0, msg:{}, roMin:0, bad:0};
const V55S_LEN = {navy:100, cargo:82, tour:74, pirate2:48, pirate:48, sail:36, fish:30, speed:32, parasail:28};
// dải màu độ sâu (khoảng cách tới bờ ngoài): nông → sâu
const V55S_BANDS = [[170, 'sea', 'sea2', .4], [700, 'sea', 'sea2', .72], [1400, 'sea2', 'sea2', 0], [2600, 'sea2', '#0d3b66', .32], [3800, 'sea2', '#0a2c52', .58], [5200, 'sea2', '#071f3d', .78]];
const v55sRnd = (s => () => (s = (s*16807) % 2147483647)/2147483647)(5501);

// ---------- 1. hình học: bờ, nước, độ sâu ----------
function v55sMain(){ return typeof V52W !== 'undefined' && V52W.on; }
function v55sPol(x, y){ const dx = x - V46L.CX, dy = y - V46L.CY; return [Math.hypot(dx, dy), Math.atan2(dy, dx)]; }
function v55sRo(a){ return v55sMain() ? v52wRout(a) : V46L.ISLAND; }          // bờ ngoài cùng (đất liền, hoặc đảo nếu chưa có đất liền)
function v55sIsl(x, y, m){ for(const s of V55S.isl){ const dx = x - s.x, dy = y - s.y, R = s.r + m; if(dx*dx + dy*dy < R*R) return s; } return null; }
// "là nước?": trong thế giới, ngoài đảo, ngoài đất liền (trừ lòng sông), ngoài đảo nhỏ/bãi đá; m = lề an toàn
function v55sWater(x, y, m){
  m = m || 0; const X = V55S;
  if(x < X.X0 + 60 || y < X.Y0 + 60 || x > X.X1 - 60 || y > X.Y1 - 60) return false;
  const [r, a] = v55sPol(x, y);
  if(r < V46L.ISLAND + 50 + m) return false;
  if(v55sMain()){ const ri = v52wRin(a), ro = v52wRout(a); if(r > ri - 40 - m && r < ro + 40 + m) return m < 30 && v52wRiverD(x, y) < 40 - m; }
  return !v55sIsl(x, y, 30 + m);
}
// đất thật (không lề) — dùng đo diện tích + mặt đất dưới thủy phi cơ
function v55sLandAt(x, y, noIsl){ const [r, a] = v55sPol(x, y); if(r < V46L.ISLAND) return true;
  if(v55sMain() && r > v52wRin(a) && r < v52wRout(a) && v52wRiverD(x, y) > 52) return true; return !noIsl && !!v55sIsl(x, y, 0); }
function v55sDepth(x, y){ const [r, a] = v55sPol(x, y), L = V46L; let d;
  if(!v55sMain()) d = r - L.ISLAND; else { const ri = v52wRin(a), ro = v52wRout(a); d = r < ri ? Math.min(r - L.ISLAND, ri - r) : r > ro ? r - ro : 0; }
  for(const s of V55S.isl){ const e = Math.hypot(x - s.x, y - s.y) - s.r; if(e < d) d = e; }
  return Math.max(0, d); }
// điểm đi bộ được gần nhất (vòng tròn nở dần)
function v55sNearWalk(x, y, R, step){ step = step || 30; if(v46Walk(x, y)) return [x, y];
  for(let d = step; d <= R; d += step){ const n = Math.max(12, Math.round(d/40)); for(let i = 0; i < n; i++){ const a = i/n*Math.PI*2, px = x + Math.cos(a)*d, py = y + Math.sin(a)*d;
    if(v46Walk(px, py) && v46Walk(px + Math.cos(a)*24, py + Math.sin(a)*24)) return [px + Math.cos(a)*24, py + Math.sin(a)*24]; } }
  return null; }

// ---------- 2. đảo nhỏ, bãi đá, phao, tuyến chạy (dựng 1 lần, cố định theo seed) ----------
function v55sBuildIsles(){
  const L = V46L, rnd = v55sRnd, isl = V55S.isl = [], X = V55S, tau = Math.PI*2;
  // thủy phi cơ: 4 đảo học tập của sân bay v51p ra biển ngoài (cách bờ ngoài 1618 = φ × 1000)
  if(typeof V51P_ISL !== 'undefined' && v55sMain()) V51P_ISL.forEach(s => { s.r = Math.round(v52wRout(s.a) + 1618); const p = [L.CX + Math.cos(s.a)*s.r, L.CY + Math.sin(s.a)*s.r]; isl.push({x:p[0], y:p[1], r:300, k:'plane'}); });
  const ok = (x, y, r, gap) => x > X.X0 + r + 500 && y > X.Y0 + r + 500 && x < X.X1 - r - 500 && y < X.Y1 - r - 500 && !isl.some(s => Math.hypot(s.x - x, s.y - y) < s.r + r + gap);
  const ring = (off, n, r0, r1, k) => { for(let i = 0; i < n; i++){ const a = i/n*tau + (rnd() - .5)*.3 + off*.0003, r = Math.round(r0 + rnd()*(r1 - r0)), R = v55sRo(a) + off, x = L.CX + Math.cos(a)*R, y = L.CY + Math.sin(a)*R;
    if(ok(x, y, r, 900)) isl.push({x, y, r, k, ph:rnd()*6, palms:k === 'isle' ? 1 + Math.floor(rnd()*4) : 0}); } };
  ring(1618, 10, 150, 270, 'isle'); ring(3320, 14, 120, 225, 'isle');
  // quần đảo ở 4 góc biển xa (rất rộng)
  for(let i = 0, n = 0; i < 4000 && n < 18; i++){ const x = X.X0 + rnd()*(X.X1 - X.X0), y = X.Y0 + rnd()*(X.Y1 - X.Y0), [r, a] = v55sPol(x, y), rr = Math.round(140 + rnd()*160);
    if(r - v55sRo(a) < 5800 || !ok(x, y, rr, 1300)) continue; isl.push({x, y, r:rr, k:rnd() < .25 ? 'rock' : 'isle', ph:rnd()*6, palms:Math.floor(rnd()*4)}); n++; }
  // đèn biển trên vài đảo (vàng: cứ 1/φ² số đảo)
  isl.filter(s => s.k === 'isle').forEach((s, i) => { if(i % 5 === 2) s.light = true; });
  // bãi đá ngầm sát bờ ngoài (tránh bãi tắm, cửa sông)
  if(v55sMain()) for(let i = 0; i < 30; i++){ const a = i/30*tau + rnd()*.12, B = V52W_L.beach, R = V52W_L.river;
    if(Math.abs(v52wAng(a - B.a)) < B.w + .12 || (a > R.a0 - .2 && a < R.a1 + .2)) continue;
    const r = Math.round(42 + rnd()*26), off = 300 + rnd()*70, Rr = v55sRo(a) + off; isl.push({x:L.CX + Math.cos(a)*Rr, y:L.CY + Math.sin(a)*Rr, r, k:'reef', ph:rnd()*6}); }
  // phao: cửa sông (đỏ/xanh), cảnh báo bãi đá (vàng-đen), mốc tuyến (vàng)
  const B = V55S.buoys = [], P = v55sMain() ? V52W.river : null;
  if(P && P.length > 6){ [[0, 1], [P.length - 1, P.length - 2]].forEach(([i, j]) => { const p = P[i], q = P[j], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (p[0] - q[0])/d, uy = (p[1] - q[1])/d, nx = -uy, ny = ux;
    [0, 220].forEach(o => [1, -1].forEach(sg => { const x = p[0] + ux*o + nx*sg*92, y = p[1] + uy*o + ny*sg*92; if(v55sWater(x, y, 0)) B.push({x, y, c:sg > 0 ? '#e53935' : '#43a047', ph:rnd()*6}); })); }); }
  isl.filter(s => s.k === 'reef').forEach(s => { const [, a] = v55sPol(s.x, s.y), x = s.x + Math.cos(a)*(s.r + 70), y = s.y + Math.sin(a)*(s.r + 70); if(v55sWater(x, y, 0)) B.push({x, y, c:'#ffca28', k:'warn', ph:rnd()*6}); });
  for(let a = 0; a < tau; a += .11){ const R = v55sRo(a) + 1380, x = L.CX + Math.cos(a)*R, y = L.CY + Math.sin(a)*R; if(v55sWater(x, y, 60)) B.push({x, y, c:'#ffd23f', ph:rnd()*6}); }
  // đàn chim trên các đảo
  V55S.flocks = isl.filter(s => s.k === 'isle' && rnd() < .5).map(s => ({x:s.x, y:s.y - 40, n:3 + Math.floor(rnd()*4), rad:70 + rnd()*60, ph:rnd()*6}));
}
// tuyến chạy: bảng bán kính theo góc (1440 mẫu), đã né khu bến + đảo nhỏ và kiểm tra luôn là nước
function v55sNearZone(x, y, m){ for(const z of V46.Z){ const n = z.n; if(x > n.x0 - m && x < n.x1 + m && y > n.y0 - m && y < n.y1 + m) return true; } return false; }
function v55sLane(o){
  const N = 1440, T = new Float32Array(N), L = V46L, tau = Math.PI*2, m = o.m || 90;
  for(let i = 0; i < N; i++){ const a = i/N*tau;
    if(o.k === 's'){ const ri = v55sMain() ? v52wRin(a) : L.ISLAND + 1400; let r = L.ISLAND + (ri - L.ISLAND)*o.f;
      for(let k = 0; k < 24 && v55sNearZone(L.CX + Math.cos(a)*r, L.CY + Math.sin(a)*r, 150); k++) r += 30; T[i] = r; }
    else T[i] = v55sRo(a) + o.off + 40*Math.sin(3*a + o.off*.01); }
  for(let p = 0; p < 3; p++){ const S = T.slice(); for(let i = 0; i < N; i++){ let s = 0; for(let k = -4; k <= 4; k++) s += S[(i + k + N) % N]; T[i] = Math.max(S[i], s/9)*(o.k === 's' ? 1 : 0) + (o.k === 's' ? 0 : s/9); } }
  let bad = 0, sum = 0;
  for(let i = 0; i < N; i++){ const a = i/N*tau, c = Math.cos(a), s = Math.sin(a); let r = T[i];
    if(!v55sWater(L.CX + c*r, L.CY + s*r, m)){ let f = 0; for(let k = 1; k < 16 && !f; k++) for(const sg of [1, -1]){ const rr = r + sg*k*25; if(v55sWater(L.CX + c*rr, L.CY + s*rr, m)){ r = rr; f = 1; break; } } if(!f) bad++; T[i] = r; }
    sum += T[i]; }
  const l = Object.assign({tab:T, R:sum/N, bad}, o); V55S.bad += bad; V55S.lanes.push(l); return l;
}
function v55sLaneR(l, u){ const N = l.tab.length, f = (((u/(Math.PI*2)) % 1) + 1) % 1*N, i = Math.floor(f), k = f - i; return l.tab[i % N]*(1 - k) + l.tab[(i + 1) % N]*k; }
function v55sLanePos(l, u){ const r = v55sLaneR(l, u), du = .003, dr = (v55sLaneR(l, u + du) - v55sLaneR(l, u - du))/(2*du), c = Math.cos(u), s = Math.sin(u);
  let tx = (dr*c - r*s)*l.dir, ty = (dr*s + r*c)*l.dir; const tl = Math.hypot(tx, ty) || 1; return [V46L.CX + c*r, V46L.CY + s*r, tx/tl, ty/tl]; }
function v55sMovePos(m){ const l = m.l; return v55sLanePos(l, m.a0 + l.dir*m.sp*realT/l.R); }
function v55sBuildLanes(){
  V55S.lanes = []; V55S.movers = []; V55S.byShip = new Map(); V55S.bad = 0; const rnd = v55sRnd, tau = Math.PI*2;
  const LN = {
    s1:v55sLane({k:'s', f:.382, dir:1, sp:22, t:'ship'}), s2:v55sLane({k:'s', f:.618, dir:-1, sp:22, t:'ship'}),
    c1:v55sLane({k:'o', off:650, dir:1, sp:26, t:'ship'}), c2:v55sLane({k:'o', off:800, dir:-1, sp:26, t:'ship'}),
    m1:v55sLane({k:'o', off:2350, dir:-1, sp:20, t:'ship'}), m2:v55sLane({k:'o', off:2500, dir:1, sp:20, t:'ship'}),
    f1:v55sLane({k:'o', off:3950, dir:1, sp:16, t:'ship'}), f2:v55sLane({k:'o', off:4100, dir:-1, sp:16, t:'ship'}), f3:v55sLane({k:'o', off:5150, dir:-1, sp:13, t:'ship'}),
    d1:v55sLane({k:'o', off:1130, dir:1, sp:46, t:'life', m:40}), d2:v55sLane({k:'o', off:2930, dir:-1, sp:40, t:'life', m:40}), w1:v55sLane({k:'o', off:4600, dir:-1, sp:9, t:'life', m:60})
  };
  // tàu lớn cũ (v47) chia đều lên các tuyến theo loại
  const pref = {fish:['c1', 'c2', 's1'], sail:['m1', 'm2', 's2'], tour:['s2', 'm2', 'm1'], navy:['f1', 'f2', 'f3'], cargo:['f2', 'f1', 'f3'], pirate2:['f3', 'm1']}, slots = {};
  Object.keys(LN).forEach(k => slots[k] = []);
  const big = (typeof ships !== 'undefined' ? ships : []).filter(s => s !== (typeof pirate !== 'undefined' ? pirate : null) && V47W_BIG[s.k]);
  big.forEach((s, i) => { const P = pref[s.k] || ['m1']; slots[P[i % P.length]].push({s}); });
  // thêm thuyền mới cho đủ dày: eo biển ~1 tàu / 4200 px, biển ngoài ~1 tàu / 3000 px đường đi
  const extra = {s1:['fish', 'speed', 'sail'], s2:['tour', 'sail', 'parasail'], c1:['fish', 'speed', 'sail', 'parasail'], c2:['fish', 'sail', 'speed'], m1:['sail', 'tour', 'fish'], m2:['sail', 'fish', 'tour'], f1:['cargo', 'sail'], f2:['sail', 'cargo'], f3:['sail', 'cargo']};
  const cols = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#ab47bc'];
  Object.keys(extra).forEach(k => { const l = LN[k], want = Math.round(l.R*tau/(l.k === 's' ? 4200 : 3000)); for(let i = 0; slots[k].length < want; i++){ const kk = extra[k][i % extra[k].length]; slots[k].push({s:{k:kk, x:0, y:0, dir:1, v:0, c:cols[(i*3 + k.length) % cols.length], v55:1}}); } });
  Object.keys(slots).forEach(k => { const l = LN[k], S = slots[k], ph = rnd()*tau; S.forEach((o, i) => { const m = {l, t:'ship', s:o.s, a0:ph + i/S.length*tau + (rnd() - .5)*.04, sp:l.sp}; V55S.movers.push(m); V55S.byShip.set(o.s, m); }); });
  // sinh vật: đàn cá heo (2 tuyến) + cá voi
  [['d1', 'dol'], ['d2', 'dol'], ['w1', 'wha']].forEach(([k, t]) => { const l = LN[k], n = Math.round(l.R*tau/(t === 'wha' ? 9000 : 6500)), ph = rnd()*tau;
    for(let i = 0; i < n; i++) V55S.movers.push({l, t, a0:ph + i/n*tau, sp:l.sp*(.9 + rnd()*.2), n:t === 'dol' ? 2 + Math.floor(rnd()*3) : 1, ph:rnd()*9}); });
  // tốc độ trong một tuyến giống nhau → không bao giờ dồn cục (cá heo được nhanh/chậm chút vì nhỏ)
}

// ---------- 3. vẽ tĩnh vào ô nền + ảnh toàn cảnh ----------
function v55sHex(c, d){ return c && c[0] === '#' && c.length === 7 ? c : d; }
function v55sCol(se, b){ const a = b[1][0] === '#' ? b[1] : v55sHex(se[b[1]], '#1d5f99'), c = b[2][0] === '#' ? b[2] : v55sHex(se[b[2]], '#1d5f99'); return b[3] ? v46Mix(a, c, b[3]) : a; }
// màu tại khoảng cách off (nội suy giữa các mốc V55S_BANDS) → nhiều bậc nhỏ, chuyển màu mượt
function v55sColAt(se, off){ const K = V55S_BANDS; if(off <= K[0][0]) return v55sCol(se, K[0]);
  for(let i = 1; i < K.length; i++) if(off <= K[i][0]) return v46Mix(v55sCol(se, K[i - 1]), v55sCol(se, K[i]), (off - K[i - 1][0])/(K[i][0] - K[i - 1][0]));
  return v55sCol(se, K[K.length - 1]); }
function v55sBandPaths(){ if(V55S.paths) return V55S.paths; const X = V55S, N = 900, tau = Math.PI*2, out = [];
  for(let off = 170; off <= 6400; off += off < 1400 ? 250 : 400){ const p = new Path2D(), wig = off > 300 ? 76 : 0; p.rect(X.X0 - 200, X.Y0 - 200, X.X1 - X.X0 + 400, X.Y1 - X.Y0 + 400);
    for(let i = 0; i <= N; i++){ const a = i/N*tau, r = v55sRo(a) + off + (wig ? 50*Math.sin(5*a + off*.001) + 26*Math.sin(13*a + off*.002) : 0), x = V46L.CX + Math.cos(a)*r, y = V46L.CY + Math.sin(a)*r; i ? p.lineTo(x, y) : p.moveTo(x, y); }
    p.closePath(); out.push({p, off, lo:X.roMin + off - wig - 4, hi:X.roMax + off + wig + 4}); }
  return (V55S.paths = out); }
function v55sBlob(g, s, r){ g.beginPath(); for(let i = 0; i <= 40; i++){ const a = i/40*Math.PI*2, k = r*(.9 + .07*Math.sin(3*a + s.ph) + .04*Math.sin(7*a + s.ph*2)), x = s.x + Math.cos(a)*k, y = s.y + Math.sin(a)*k*.92; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
function v55sLighthouse(g, x, y){ g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 6, y + 2, 22, 7, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#eceff1'; g.fillRect(x - 11, y - 74, 22, 74); g.fillStyle = '#e53935'; for(let k = 0; k < 3; k++) g.fillRect(x - 11, y - 66 + k*24, 22, 10);
  g.fillStyle = '#37474f'; g.fillRect(x - 15, y - 82, 30, 8); g.fillStyle = '#fff59d'; g.fillRect(x - 8, y - 96, 16, 14); g.fillStyle = '#b71c1c'; g.beginPath(); g.moveTo(x - 12, y - 96); g.lineTo(x, y - 108); g.lineTo(x + 12, y - 96); g.fill(); }
function v55sIslePaint(g, s, lod, se){
  const sea = v55sHex(se.sea, '#2f93d2'), sand = v55sHex(se.sand, '#f6f0dc'), grass = v55sHex(se.grass, '#71c45a'), dong = season === 'dong';
  if(s.k === 'plane') return;
  g.fillStyle = v46Mix(sea, '#bff3ff', .28); v55sBlob(g, s, s.r + (s.k === 'reef' ? 60 : 150)); g.fill();
  g.fillStyle = v46Mix(sea, '#ffffff', .42); v55sBlob(g, s, s.r + 30); g.fill();
  if(s.k === 'reef' || s.k === 'rock'){ const n = s.k === 'reef' ? 4 : 7; for(let i = 0; i < n; i++){ const a = i*2.39996 + s.ph, d = s.r*.55*Math.sqrt((i + .5)/n), sz = s.r*(.35 + .25*((i*7) % 3)/2);
      const x = Math.round(s.x + Math.cos(a)*d), y = Math.round(s.y + Math.sin(a)*d*.8); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - sz, y - 3, sz*2, 7);
      g.fillStyle = dong ? '#cfd8dc' : '#8a9aa3'; g.beginPath(); g.moveTo(x - sz, y); g.lineTo(x - sz*.6, y - sz*.9); g.lineTo(x + sz*.3, y - sz*1.1); g.lineTo(x + sz, y - sz*.4); g.lineTo(x + sz*.8, y); g.closePath(); g.fill();
      if(lod < 2){ g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x - sz*.4, y - sz*.85, sz*.6, 3); } }
    if(s.light) v55sLighthouse(g, s.x, s.y); return; }
  g.fillStyle = sand; v55sBlob(g, s, s.r); g.fill();
  g.fillStyle = dong ? '#e8eef2' : v46Mix(grass, sand, .25); v55sBlob(g, s, s.r*.66); g.fill();
  g.fillStyle = dong ? '#f4f7f9' : grass; v55sBlob(g, s, s.r*.5); g.fill();
  if(lod === 2) return;
  for(let i = 0; i < s.palms; i++){ const a = s.ph + i*2.39996, d = s.r*.32, t = {x:s.x + Math.cos(a)*d, y:s.y + Math.sin(a)*d*.8 + 10, s:.9 + (i % 2)*.25}; try { v52wPalm(g, t); } catch(e){} }
  if(s.light) v55sLighthouse(g, s.x + s.r*.12, s.y - s.r*.1);
}
// vẽ phần biển ngoài vào g (đã scale về toạ độ thế giới) cho vùng [x0,y0,w,h]
function v55sSeaPaint(g, x0, y0, w, h, lod){
  if(!V55S.on) return; const x1 = x0 + w, y1 = y0 + h, se = S(), L = V46L;
  const far = Math.max(Math.hypot(x0 - L.CX, y0 - L.CY), Math.hypot(x1 - L.CX, y0 - L.CY), Math.hypot(x0 - L.CX, y1 - L.CY), Math.hypot(x1 - L.CX, y1 - L.CY));
  // chỉ dải nào cắt qua ô mới cần tô theo đường cong; dải phủ trọn ô thì tô hình chữ nhật (nhanh)
  const near = Math.hypot(Math.max(x0 - L.CX, 0, L.CX - x1), Math.max(y0 - L.CY, 0, L.CY - y1));
  if(far > V55S.roMin + 160) for(const B of v55sBandPaths()){ if(far < B.lo) break; const c = v55sColAt(se, B.off); g.fillStyle = c;
    if(near > B.hi){ g.fillRect(x0, y0, w, h); continue; } g.fill(B.p, 'evenodd'); if(B.off > 300){ g.strokeStyle = c; g.globalAlpha = .45; g.lineWidth = 130; g.stroke(B.p); g.globalAlpha = 1; } }   // mép dải mềm
  // vân sóng tĩnh (chỉ ô gần)
  if(lod === 0){ g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 3; g.beginPath(); const st = 96;
    for(let y = Math.floor(y0/st)*st; y < y1; y += st) for(let x = Math.floor(x0/st)*st; x < x1; x += st){ const hsh = Math.abs(Math.sin(x*12.9898 + y*78.233)*43758.5453) % 1; if(hsh > .34) continue;
      const px = x + hsh*st*2.4 % st, py = y + (hsh*7.7 % 1)*st; if(!v55sWater(px, py, 40)) continue; g.moveTo(px - 14, py); g.quadraticCurveTo(px - 7, py - 6, px, py); g.quadraticCurveTo(px + 7, py - 6, px + 14, py); }
    g.stroke(); }
  for(const s of V55S.isl){ const R = s.r + 160; if(s.x + R < x0 || s.x - R > x1 || s.y + R < y0 || s.y - R > y1) continue; v55sIslePaint(g, s, lod, se); }
}
// ảnh toàn cảnh biển (phủ cả vùng toạ độ âm), mịn, nằm DƯỚI ảnh toàn cảnh đảo + đất liền cũ
function v55sFar(){
  const k = season; if(V55S.far && V55S.farKey === k) return V55S.far; const X = V55S, N = 1536, WW = X.X1 - X.X0, s = N/WW;
  const c = V55S.far || document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), se = S();
  g.setTransform(s, 0, 0, s, -X.X0*s, -X.Y0*s); g.fillStyle = v55sHex(se.sea2, '#1d5f99'); g.fillRect(X.X0, X.Y0, WW, WW);
  try { v55sSeaPaint(g, X.X0, X.Y0, WW, WW, 2); } catch(e){ console.warn('v55s far', e); }
  V55S.far = c; V55S.farKey = k; return c;
}
function v55sDeep(){ return v55sColAt(S(), 1e9); }

// ---------- 4. lớp động: sóng, bọt bờ, phao, tàu, sinh vật (chỉ thứ trong màn hình) ----------
function v55sIn(VBn, x, y, m){ return x > VBn.x0 - m && x < VBn.x1 + m && y > VBn.y0 - m && y < VBn.y1 + m; }
function v55sWaves(VBn){
  const k0 = Math.max(1, .45/cam.z), st = 150*k0, t = realT, w = (typeof WEATHERS !== 'undefined' && WEATHERS[weather]) ? WEATHERS[weather].wind || 0 : 0;   // nhìn xa: sóng thưa + to hơn
  ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 2.5*k0; ctx.beginPath(); let n = 0;
  for(let y = Math.floor(VBn.y0/st)*st; y < VBn.y1; y += st) for(let x = Math.floor(VBn.x0/st)*st; x < VBn.x1; x += st){
    const hsh = Math.abs(Math.sin(x*3.17 + y*7.31)*9137.13) % 1, k = (t*.22 + hsh) % 1; if(k > .62) continue;
    const px = x + hsh*st, py = y + (hsh*13.7 % 1)*st - k*10, a = Math.sin(k/.62*Math.PI), half = (8 + 10*a + w*6)*k0; if(!v55sWater(px, py, 20)) continue;
    ctx.moveTo(px - half, py); ctx.quadraticCurveTo(px, py - (5 + 4*a)*k0, px + half, py); n++; }
  ctx.stroke(); return n; }
function v55sSurf(VBn){
  if(!v55sMain()) return; const L = V46L, t = realT, N = 2600; ctx.fillStyle = 'rgba(255,255,255,.66)';
  const [rc] = v55sPol((VBn.x0 + VBn.x1)/2, (VBn.y0 + VBn.y1)/2), half = Math.hypot(VBn.x1 - VBn.x0, VBn.y1 - VBn.y0)/2; if(Math.abs(rc - 11200) > half + 1200) return;
  for(let i = 0; i < N; i++){ const a = i/N*Math.PI*2, r = v52wRout(a) + 46 + Math.sin(a*90 + t*1.4)*7, x = L.CX + Math.cos(a)*r, y = L.CY + Math.sin(a)*r; if(!v55sIn(VBn, x, y, 0)) continue;
    if(v52wRiverD(x, y) < 70) continue; ctx.fillRect(x - 6, y - 1, 12, 3); }
}
function v55sIsleFoam(VBn){ const t = realT; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
  for(const s of V55S.isl){ if(s.k === 'plane' || !v55sIn(VBn, s.x, s.y, s.r + 80)) continue; const R = s.r + 40 + Math.sin(t*1.3 + s.ph)*6; ctx.beginPath(); ctx.ellipse(s.x, s.y, R, R*.92, 0, 0, Math.PI*2); ctx.setLineDash([16, 22]); ctx.lineDashOffset = -t*12; ctx.stroke(); }
  ctx.setLineDash([]); }
function v55sBuoyDraw(b, night){ const bob = Math.sin(realT*2 + b.ph)*2.5, x = Math.round(b.x), y = Math.round(b.y + bob);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 16 + Math.sin(realT*2 + b.ph)*2, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = b.c; ctx.beginPath(); ctx.moveTo(x - 11, y + 2); ctx.lineTo(x - 5, y - 20); ctx.lineTo(x + 5, y - 20); ctx.lineTo(x + 11, y + 2); ctx.closePath(); ctx.fill();
  if(b.k === 'warn'){ ctx.fillStyle = '#212121'; ctx.fillRect(x - 8, y - 10, 16, 5); } else { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - 7, y - 10, 14, 3); }
  ctx.fillStyle = '#37474f'; ctx.fillRect(x - 1, y - 30, 3, 10); const on = (realT + b.ph) % 2 < .7;
  ctx.fillStyle = night && on ? '#fff59d' : '#b0bec5'; ctx.fillRect(x - 3, y - 34, 7, 6);
  if(night && on){ ctx.fillStyle = 'rgba(255,245,157,.25)'; ctx.beginPath(); ctx.arc(x, y - 31, 16, 0, Math.PI*2); ctx.fill(); } }
function v55sWake(x, y, tx, ty, len, sp){ const nx = -ty, ny = tx, sx = x - tx*len*.45, sy = y + 10 - ty*len*.35, L = 30 + len*.9, t = realT;
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath();
  for(const sg of [1, -1]){ ctx.moveTo(sx, sy); ctx.lineTo(sx - tx*L + nx*sg*L*.32, sy - ty*L*.8 + ny*sg*L*.26); } ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; for(let i = 0; i < 6; i++){ const k = ((t*sp*.04 + i/6) % 1), d = 8 + k*L*1.1; ctx.globalAlpha = .7*(1 - k); ctx.fillRect(Math.round(sx - tx*d + nx*Math.sin(i*2.1)*6) - 3, Math.round(sy - ty*d*.8 + ny*Math.sin(i*2.1)*5) - 1, 6, 3); }
  ctx.globalAlpha = 1; }
function v55sShipAt(m){ // vị trí tàu: tàu cũ qua v47wShipPos (giữ các lớp bọc của phiên khác, vd. né tàu hải tặc), luôn kiểm tra là nước
  const P = v55sMovePos(m); if(m.s.v55) return P;
  let q = null; try { q = v47wShipPos(m.s); } catch(e){} if(q && v55sWater(q[0], q[1], 40)) return [q[0], q[1], P[2], P[3]]; return P; }
function v55sDrawShip(m, P){ const s = m.s, len = V55S_LEN[s.k] || 40;
  v55sWake(P[0], P[1], P[2], P[3], len, m.sp);
  const ox = s.x, oy = s.y, od = s.dir; s.x = P[0]; s.y = P[1]; s.dir = P[2] < 0 ? -1 : 1; try { drawShip(s); } catch(e){} s.x = ox; s.y = oy; s.dir = od; }
function v55sDolphins(m, P){ const t = realT, d = P[2] < 0 ? -1 : 1;
  for(let i = 0; i < m.n; i++){ const ph = (t*.45 + m.ph + i*.31) % 1, ox = P[0] - P[2]*i*46 + P[3]*((i % 2) ? 22 : -18), oy = P[1] - P[3]*i*34 + ((i % 2) ? 14 : -10);
    const j = Math.sin(ph*Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(ox, oy + 6, 20, 5, 0, 0, Math.PI*2); ctx.fill();
    if(j < .15){ ctx.fillStyle = '#3d5a73'; ctx.beginPath(); ctx.moveTo(ox - 6*d, oy + 4); ctx.lineTo(ox + 2*d, oy - 12); ctx.lineTo(ox + 8*d, oy + 4); ctx.fill(); continue; }
    ctx.save(); ctx.translate(ox, oy - j*30); ctx.rotate(-Math.cos(ph*Math.PI*2)*.55*d); ctx.scale(d, 1);
    ctx.fillStyle = '#5b7f99'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#dbe9f2'; ctx.beginPath(); ctx.ellipse(2, 3, 15, 3.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a6a82'; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(4, -15); ctx.lineTo(8, -5); ctx.fill(); ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-30, -7); ctx.lineTo(-27, 0); ctx.lineTo(-30, 7); ctx.fill();
    ctx.fillStyle = '#5b7f99'; ctx.fillRect(20, -1, 7, 3); ctx.fillStyle = '#10202c'; ctx.fillRect(12, -3, 2, 2); ctx.restore(); } }
function v55sWhale(m, P){ const t = realT, d = P[2] < 0 ? -1 : 1, x = P[0], y = P[1], cyc = (t*.11 + m.ph) % 1;
  ctx.fillStyle = 'rgba(10,30,50,.42)'; ctx.beginPath(); ctx.ellipse(x, y, 92, 26, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2f4a62'; ctx.beginPath(); ctx.ellipse(x + 10*d, y - 4, 58, 13, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x - 40, y - 2, 96, 3);
  if(cyc > .7){ const k = (cyc - .7)/.3; ctx.fillStyle = '#2f4a62'; const fx = x - 78*d; ctx.beginPath(); ctx.moveTo(fx, y - 4); ctx.lineTo(fx - 26*d, y - 30*k - 6); ctx.lineTo(fx - 4*d, y - 18*k - 4); ctx.lineTo(fx + 18*d, y - 30*k - 6); ctx.closePath(); ctx.fill(); }
  if(cyc < .3){ const k = cyc/.3; ctx.fillStyle = 'rgba(235,248,255,' + (.85*(1 - k)) + ')'; for(let i = 0; i < 9; i++){ const a = -Math.PI/2 + (i - 4)*.16; ctx.beginPath(); ctx.arc(x + 36*d + Math.cos(a)*k*30, y - 14 + Math.sin(a)*k*58, 3 + k*3, 0, Math.PI*2); ctx.fill(); } } }
function v55sLayer(VBn){
  if(!V55S.on || !V46.on || V46.sky) return; const z = cam.z; let n = 0;
  if(z >= .2) v55sWaves(VBn);
  if(z >= .2){ v55sSurf(VBn); v55sIsleFoam(VBn); const night = lightLevel() > .3; for(const b of V55S.buoys) if(v55sIn(VBn, b.x, b.y, 40)) v55sBuoyDraw(b, night); }
  const vis = [];
  for(const m of V55S.movers){ if(m.t === 'ship' && !m.s.v55 && !v47wBigShip(m.s)) continue; const P = m.t === 'ship' ? v55sShipAt(m) : v55sMovePos(m); m.P = P; if(v55sIn(VBn, P[0], P[1], 220)) vis.push(m); }
  vis.sort((a, b) => a.P[1] - b.P[1]);
  for(const m of vis){ try { if(m.t === 'ship') v55sDrawShip(m, m.P); else if(m.t === 'dol'){ if(z >= .2) v55sDolphins(m, m.P); } else v55sWhale(m, m.P); n++; } catch(e){} }
  V55S.drawn = n;
}
// lớp trên cùng: chim biển (đảo + bay theo tàu cá) và chùm sáng đèn biển ban đêm
function v55sBird(x, y, f, sc){ ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2*sc; ctx.beginPath(); const w = 11*sc, h = f ? -6*sc : 3*sc; ctx.moveTo(x - w, y + h); ctx.quadraticCurveTo(x - w*.4, y - 4*sc, x, y); ctx.quadraticCurveTo(x + w*.4, y - 4*sc, x + w, y + h); ctx.stroke(); }
function v55sTop(VBn){
  if(!V55S.on || !V46.on || V46.sky || cam.z < .2) return; const t = realT;
  const flock = (cx, cy, n, rad, ph) => { for(let i = 0; i < n; i++){ const a = t*.5 + ph + i*Math.PI*2/n, x = cx + Math.cos(a)*rad, y = cy - 110 + Math.sin(a)*rad*.4 + Math.sin(t*2 + i)*6; v55sBird(x, y, ((t*5 + i) | 0) % 2, 1.2); } };
  for(const f of V55S.flocks) if(v55sIn(VBn, f.x, f.y, 260)) flock(f.x, f.y, f.n, f.rad, f.ph);
  for(const m of V55S.movers) if(m.t === 'ship' && m.s.k === 'fish' && m.P && v55sIn(VBn, m.P[0], m.P[1], 200)) flock(m.P[0] - m.P[2]*40, m.P[1], 3, 46, m.a0);
}
// sau lớp tối ban đêm: chùm sáng đèn biển + đèn phao, đèn tàu (nổi rõ trong đêm)
function v55sNight(VBn){
  if(!V55S.on || !V46.on || V46.sky || cam.z < .15) return; const t = realT;
  if(lightLevel() <= .3) return;
  for(const s of V55S.isl){ if(!s.light || !v55sIn(VBn, s.x, s.y, 1000)) continue; const x = s.k === 'isle' ? s.x + s.r*.12 : s.x, y = (s.k === 'isle' ? s.y - s.r*.1 : s.y) - 90, a = t*.6 + s.ph;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(x, y, 4, x, y, 900); gr.addColorStop(0, 'rgba(255,245,170,.45)'); gr.addColorStop(1, 'rgba(255,245,170,0)'); ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 900, a - .16, a + .16); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,250,200,.6)'; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(const b of V55S.buoys){ if(!v55sIn(VBn, b.x, b.y, 40) || (realT + b.ph) % 2 >= .7) continue; ctx.fillStyle = 'rgba(255,240,150,.5)'; ctx.beginPath(); ctx.arc(b.x, b.y - 31, 12, 0, Math.PI*2); ctx.fill(); }
  for(const m of V55S.movers){ if(m.t !== 'ship' || !m.P || !v55sIn(VBn, m.P[0], m.P[1], 100)) continue; ctx.fillStyle = 'rgba(255,230,150,.45)'; ctx.beginPath(); ctx.arc(m.P[0], m.P[1] - 14, 9, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255,80,80,.6)'; ctx.fillRect(m.P[0] + (m.P[2] < 0 ? -1 : 1)*((V55S_LEN[m.s.k] || 40)*.8) - 2, m.P[1] - 4, 4, 4); }
  ctx.restore();
}

// ---------- 5. bản đồ nhỏ + bản đồ lớn: biển rộng + tàu thuyền ----------
function v55sMapShips(g){ const tr = g.getTransform(), sc = Math.hypot(tr.a, tr.b) || 1, k = Math.min(2, window.devicePixelRatio || 1)*4/sc;
  for(const m of V55S.movers){ if(m.t !== 'ship' || (!m.s.v55 && !v47wBigShip(m.s))) continue; const P = v55sMovePos(m), d = P[2] < 0 ? -1 : 1;
    g.fillStyle = m.s.k === 'pirate2' ? '#3e2723' : m.s.k === 'cargo' ? '#ff8a2b' : m.s.k === 'navy' ? '#90a4ae' : '#ffffff';
    g.beginPath(); g.moveTo(P[0] + 1.6*k*d, P[1]); g.lineTo(P[0] - 1.2*k*d, P[1] - .9*k); g.lineTo(P[0] - 1.2*k*d, P[1] + .9*k); g.closePath(); g.fill(); }
  for(const m of V55S.movers){ if(m.t !== 'wha') continue; const P = v55sMovePos(m); g.fillStyle = 'rgba(15,40,60,.75)'; g.beginPath(); g.ellipse(P[0], P[1], 2*k, k, 0, 0, Math.PI*2); g.fill(); } }

// ---------- 6. thay hàm cũ ở cấp file (trước khi các phiên khác bọc lại lúc init) ----------
const v55sPaint0 = v46Paint;
v46Paint = function(g, x0, y0, w, h, lod){ v55sPaint0(g, x0, y0, w, h, lod); try { v55sSeaPaint(g, x0, y0, w, h, lod); } catch(e){ if(!V55S.msg.paint){ V55S.msg.paint = 1; console.warn('v55s paint', e); } } };
// nền: ảnh biển xa (cả vùng âm) → ảnh toàn cảnh cũ → các ô gần (lặp cả vùng biển mới)
v46DrawGround = function(VBn){
  v46CheckCaches(); V46T.budget = V46T.L0.size < 4 ? 6 : 1;
  const ov = v46Overview(), s = V46T.OVS, z = cam.z, X = V55S;
  ctx.fillStyle = V55S.on ? v55sDeep() : S().sea2; ctx.fillRect(VBn.x0, VBn.y0, VBn.x1 - VBn.x0, VBn.y1 - VBn.y0);
  if(V55S.on){ const fv = v55sFar(), fs = fv.width/(X.X1 - X.X0), ax = Math.max(X.X0, VBn.x0), ay = Math.max(X.Y0, VBn.y0), bx = Math.min(X.X1, VBn.x1), by = Math.min(X.Y1, VBn.y1);
    if(bx > ax && by > ay){ ctx.imageSmoothingEnabled = true; ctx.drawImage(fv, (ax - X.X0)*fs, (ay - X.Y0)*fs, (bx - ax)*fs, (by - ay)*fs, ax, ay, bx - ax, by - ay); ctx.imageSmoothingEnabled = false; } }
  const ax = Math.max(0, VBn.x0), ay = Math.max(0, VBn.y0), bx = Math.min(V46L.W, VBn.x1), by = Math.min(V46L.H, VBn.y1);
  if(bx > ax && by > ay) ctx.drawImage(ov, ax*s, ay*s, (bx - ax)*s, (by - ay)*s, ax, ay, bx - ax, by - ay);
  if(z < .2) return;
  const lod = z >= .55 ? 0 : 1, span = V46T.TS*(lod ? 2 : 1), T0x = V55S.on ? X.X0 : 0, T0y = V55S.on ? X.Y0 : 0, T1x = V55S.on ? X.X1 : V46L.W, T1y = V55S.on ? X.Y1 : V46L.H;
  const tx0 = Math.max(T0x, VBn.x0), ty0 = Math.max(T0y, VBn.y0), tx1 = Math.min(T1x, VBn.x1), ty1 = Math.min(T1y, VBn.y1);
  for(let j = Math.floor(ty0/span); j*span < ty1; j++) for(let i = Math.floor(tx0/span); i*span < tx1; i++){ const t = v46Tile(lod, i, j); if(t) ctx.drawImage(t, i*span, j*span, span, span); }
};
v46MapBg = function(g, x0, y0, x1, y1){ const ov = v46Overview(), s = V46T.OVS, X = V55S;
  g.fillStyle = V55S.on ? v55sDeep() : S().sea2; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.imageSmoothingEnabled = true;
  if(V55S.on){ const fv = v55sFar(), fs = fv.width/(X.X1 - X.X0), ax = Math.max(X.X0, x0), ay = Math.max(X.Y0, y0), bx = Math.min(X.X1, x1), by = Math.min(X.Y1, y1);
    if(bx > ax && by > ay) g.drawImage(fv, (ax - X.X0)*fs, (ay - X.Y0)*fs, (bx - ax)*fs, (by - ay)*fs, ax, ay, bx - ax, by - ay); }
  const ax = Math.max(0, x0), ay = Math.max(0, y0), bx = Math.min(V46L.W, x1), by = Math.min(V46L.H, y1); if(bx > ax && by > ay) g.drawImage(ov, ax*s, ay*s, (bx - ax)*s, (by - ay)*s, ax, ay, bx - ax, by - ay);
  if(V55S.on) try { v55sMapShips(g); } catch(e){} };
// tàu lớn cũ: vẽ ở lớp biển của v55s (dưới người + thuyền người chơi), không vẽ vòng quanh đảo nữa
v47wShips = function(){};
const v55sShipPos0 = v47wShipPos;
v47wShipPos = function(s){ const m = V55S.on && V55S.byShip.get(s); if(!m) return v55sShipPos0(s); const P = v55sMovePos(m); return [P[0], P[1], P[2] < 0 ? -1 : 1]; };
// độ sâu = khoảng cách tới bờ gần nhất (đảo, đất liền, đảo nhỏ): xa bờ → vùng hạng cao hơn
v47wDepthY = function(x, y){ if(!V55S.on) return v55sDepth0(x, y); const t = Math.max(0, Math.min(1, (v55sDepth(x, y) - 50)/V55S_DEEP)); return 905 + t*(H - 940); };
const v55sDepth0 = (x, y) => { const L = V46L, t = Math.max(0, Math.min(1, (Math.hypot(x - L.CX, y - L.CY) - L.ISLAND - 50)/2500)); return 905 + t*(H - 940); };
// drone: độ cao tính theo cả thế giới mới
v52ldAlt = function(){ const WW = V55S.X1 - V55S.X0, zmin = Math.min(innerWidth/WW, innerHeight/WW)*.95, k = Math.max(0, Math.min(1, Math.log(3/cam.z)/Math.log(3/zmin))); return Math.round(12 + k*k*480); };
// thủy phi cơ / trực thăng: đất liền + đảo nhỏ là "land", không phải "water"
const v55sSurf0 = v51pSurface;
v51pSurface = function(x, y){ const s = v55sSurf0(x, y); return s === 'water' && V55S.on && v55sLandAt(x, y) ? 'land' : s; };
// điểm câu đặc biệt (chim săn cá / nước sủi bọt): rải khắp eo biển + biển ngoài, luôn trên nước
v53sSpots = function(){ const key = day + ':' + Math.floor(clock/120); if(V53S.spotKey === key) return V53S.spots; V53S.spotKey = key;
  const R = v53sRng(day*977 + Math.floor(clock/120)*131 + 7), L = V46L, out = [], pir = v53sPirPos();
  for(let i = 0, n = 0; i < 12 && n < 400; n++){ let x, y;
    if(i < 2){ const a = -Math.PI/2 + (i ? 1 : -1)*(.32 + R()*.3), r = L.ISLAND + 160 + R()*220; x = L.CX + Math.cos(a)*r; y = L.CY + Math.sin(a)*r; }
    else if(i < 6 && v55sMain()){ const a = R()*Math.PI*2, ri = v52wRin(a), r = L.ISLAND + 260 + R()*Math.max(60, ri - L.ISLAND - 520); x = L.CX + Math.cos(a)*r; y = L.CY + Math.sin(a)*r; }
    else { const a = R()*Math.PI*2, r = v55sRo(a) + 450 + R()*4200; x = L.CX + Math.cos(a)*r; y = L.CY + Math.sin(a)*r; }
    if(!v55sWater(x, y, 140) || Math.hypot(x - pir[0], y - pir[1]) < 500 || v55sNearZone(x, y, 260)) continue; i++;
    out.push({x, y, k:i % 2 ? 'bub' : 'bird', ph:R()*6, n:5 + Math.floor(R()*3)}); }
  V53S.spots = out; return out; };

// ---------- 7. đo diện tích biển/đất + kiểm tra tàu trên đất (dùng cho QA) ----------
function v55sArea(){ const st = 150, X = V55S, W = V46L.W; let bl = 0, bs = 0, al = 0, as = 0;
  for(let y = X.Y0 + st/2; y < X.Y1; y += st) for(let x = X.X0 + st/2; x < X.X1; x += st){ const inOld = x >= 0 && y >= 0 && x < W && y < W;
    if(inOld){ if(v55sLandAt(x, y, true)) bl++; else bs++; } if(v55sLandAt(x, y)) al++; else as++; }
  const k = st*st/1e6; V55S.area = {before:{sea:Math.round(bs*k), land:Math.round(bl*k), ratio:+(bs/bl).toFixed(2)}, after:{sea:Math.round(as*k), land:Math.round(al*k), ratio:+(as/al).toFixed(2)}, unit:'triệu px²'}; return V55S.area; }
function v55sAudit(secs){ secs = secs || 1800; let bad = 0, n = 0; const keep = realT;
  try { for(let t = 0; t <= secs; t += 30){ realT = keep + t; for(const m of V55S.movers){ const P = m.t === 'ship' ? v55sShipAt(m) : v55sMovePos(m); n++; if(!v55sWater(P[0], P[1], 0)) bad++; } } } finally { realT = keep; }
  return {samples:n, onLand:bad, movers:V55S.movers.length, ships:V55S.movers.filter(m => m.t === 'ship').length, laneBad:V55S.bad}; }

// ---------- 8. người chơi: không kẹt dưới biển, cập bờ ở đất liền, gợi ý đường ra biển lớn ----------
function v55sMe(){ return typeof agents !== 'undefined' ? agents.find(a => a.controlled) : null; }
function v55sTick(){
  if(!V55S.on || !V46.on || V46.sky) return; const c = v55sMe();
  if(!c || !c.visible || c.inSub || !v46Raw(c.x)){ V55S.stuck = 0; return; }
  const x = c.x - V46E, y = c.y;
  if(c.boat){ V55S.stuck = 0; if(!v55sMain()) return; const [r, a] = v55sPol(x, y);
    if(r < v52wRin(a) && !V55S.msg.river && realT - (V55S.msg.t0 || (V55S.msg.t0 = realT)) > 6){ V55S.msg.river = 1; toast('🧭 Ra biển lớn: chèo theo sông Bạc ở tây nam (phao đỏ, xanh ở cửa sông).'); }
    if(r > v52wRout(a) && !V55S.msg.open){ V55S.msg.open = 1; toast('🌊 Biển lớn! Xa bờ nước sâu hơn, cá hiếm hơn. Vùng sâu cần thuyền hạng cao.'); }
    return; }
  if(c.v16fly || document.body.classList.contains('v51pOn') || (typeof openModal !== 'undefined' && openModal)){ V55S.stuck = 0; return; }
  if(v46Walk(x, y) || !v55sWater(x, y, -45)){ V55S.stuck = 0; return; }
  if(++V55S.stuck < 3) return; V55S.stuck = 0;
  const q = v55sNearWalk(x, y, 9000, 60) || v46Gate();
  c.x = q[0] + V46E; c.y = q[1]; c._z = null; c.v46t = null; c.path = []; c.moving = false;
  try { cam.x = q[0]; cam.y = q[1]; clampCam(); } catch(e){}
  toast('🏖️ Bạn đang ở dưới nước mà không có thuyền, nên được đưa về bờ gần nhất. Muốn ra khơi thì bấm nút Thuyền nhé!');
}

// ---------- 9. khởi động (gọi cuối extFinalInit) ----------
function v55sInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return;
  V55S.on = true; V55S.roMin = 1e9; V55S.roMax = 0; for(let i = 0; i < 720; i++){ const r = v55sRo(i/720*Math.PI*2); V55S.roMin = Math.min(V55S.roMin, r); V55S.roMax = Math.max(V55S.roMax, r); }
  v55sBuildIsles(); v55sBuildLanes(); V55S.paths = null; V55S.far = null;
  V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null;
  // "là nước?" dùng chung: thuyền ngoài khơi (v47 + v53s) giờ đi được cả eo biển, sông Bạc và biển lớn
  v47wSea = function(x, y){ return v55sWater(x, y); };
  // vị trí tàu lớn: lớp bọc của phiên khác (né tàu hải tặc) không được đẩy tàu lên đất
  const ps1 = v47wShipPos; v47wShipPos = function(s){ const P = ps1(s), m = V55S.byShip.get(s); if(!m || v55sWater(P[0], P[1], 40)) return P; const Q = v55sMovePos(m); return [Q[0], Q[1], Q[2] < 0 ? -1 : 1]; };
  // lớp biển động: sau nền + bờ, trước các khu và người (người chơi trên thuyền luôn nổi trên)
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); try { v55sLayer(VBn); } catch(e){ if(!V55S.msg.layer){ V55S.msg.layer = 1; console.warn('v55s layer', e); } } };
  const ww0 = v47wWorld; v47wWorld = function(VBn){ ww0(VBn); try { v55sTop(VBn); } catch(e){} };
  // ban đêm: lớp tối cũ (v25) chỉ phủ từ mốc NY xuống → phủ nốt vùng biển mới phía trên; đèn biển vẽ sau lớp tối
  const dk0 = v25Dark; v25Dark = function(d){ const r = dk0(d); if(r && V55S.on && V46.on && !V46.sky){ const V = V46.VBn, dk = Math.min(.42, d*.66); if(dk > .01 && V && V.y0 < NY){ ctx.fillStyle = `rgba(20,18,62,${dk})`; ctx.fillRect(V.x0, V.y0, V.x1 - V.x0, NY - V.y0); } } return r; };
  const lt0 = v46Lighting; v46Lighting = function(VBn){ lt0(VBn); try { v55sNight(VBn); } catch(e){} };
  // camera + bản đồ: đi được ra cả vùng biển mới (toạ độ âm)
  const cc0 = clampCam; clampCam = function(){ if(!V46.on || V46.sky || !V55S.on) return cc0(); const X = V55S, WW = X.X1 - X.X0, HH = X.Y1 - X.Y0;
    cam.z = Math.max(Math.min(cw/WW, ch/HH)*.95, Math.min(3, cam.z)); const vw = cw/cam.z, vh = ch/cam.z;
    cam.x = vw >= WW ? (X.X0 + X.X1)/2 : Math.max(X.X0 + vw/2, Math.min(X.X1 - vw/2, cam.x)); cam.y = vh >= HH ? (X.Y0 + X.Y1)/2 : Math.max(X.Y0 + vh/2, Math.min(X.Y1 - vh/2, cam.y)); };
  try { const src = mapDraw.toString(), a = 'Math.min(Wc, Hc)/L.W*.9', b = 'MAP.cx = Math.max(0, Math.min(L.W, MAP.cx)); MAP.cy = Math.max(0, Math.min(L.H, MAP.cy));';
    if(src.includes(a) && src.includes(b)) mapDraw = eval('(' + src.replace(a, 'Math.min(Wc, Hc)/(V55S.X1 - V55S.X0)*.9').replace(b, 'MAP.cx = Math.max(V55S.X0, Math.min(V55S.X1, MAP.cx)); MAP.cy = Math.max(V55S.Y0, Math.min(V55S.Y1, MAP.cy));') + ')');
    else console.warn('v55s: mapDraw đã đổi, giữ nguyên giới hạn bản đồ cũ'); } catch(e){ console.warn('v55s map', e); }
  // cập bờ: gần đảo như cũ; gần đất liền / bến sông thì lên bờ ngay chỗ đó
  const lb0 = leaveBoat; leaveBoat = function(c){ if(!c || !c.boat || !V46.on || !v46Raw(c.x) || !V55S.on) return lb0(c);
    const x = c.x - V46E, y = c.y, L = V46L; if(Math.hypot(x - L.CX, y - L.CY) <= L.ISLAND + 320) return lb0(c);
    const q = v55sNearWalk(x, y, 380, 25); if(!q){ toast('⛵ Lái thuyền vào sát bờ (đảo, đất liền hoặc bờ sông) rồi bấm Cập bờ nhé!'); return; }
    c.boat = null; c.x = q[0] + V46E; c.y = q[1]; c._z = null; toast(`🏖️ ${c.name} cập bờ.`); try { updateExtButtons(); updatePanel(); } catch(e){} };
  setInterval(() => { try { v55sTick(); } catch(e){} }, 500);
  try { v55sArea(); } catch(e){}
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v55s = {V55S, v55sWater, v55sDepth, v55sAudit, v55sArea, v55sLandAt};
}
