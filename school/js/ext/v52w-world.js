// ================= v52w · 1/4 THẾ GIỚI RỘNG: đất liền vòng ngoài nối đảo bằng cầu — đồi, sông, rừng, đồng lúa, bãi biển, làng, phố đi bộ, TTTM =================
// Đảo tròn cũ giữ NGUYÊN toạ độ tương đối (mọi khu V46L.zones tính từ tâm đảo). Thế giới chỉ nới rộng ra ngoài:
// V46L.W/H tăng thêm 2×D, tâm đảo dời +D (bến tàu dời theo) → các khu (kể cả khu mới của phiên khác) vẫn đúng chỗ.
// Đất liền là một vành đai quanh đảo: bờ trong r≈6.5k, bờ ngoài r≈11k (tỷ lệ diện tích đất sau/trước ≈ 4×).
// Mọi tên toàn cục có tiền tố v52w / V52W.
const V52W_PHI = 1.618033988749895, V52W_D = 6600;
V46L.W = V46L.H = 11200 + 2*V52W_D; V46L.CX += V52W_D; V46L.CY += V52W_D; V46L.harbor.dx += V52W_D; V46L.harbor.dy += V52W_D; V46T.OVS = 2048/V46L.W;

// ---------- bảng bố cục (toạ độ tính từ tâm đảo; sửa tay ở đây) ----------
const V52W_L = {
  ring: 7900,                                            // đại lộ vành đai trên đất liền
  bridges: [0.05, 1.3, 2.7, -2.55, -1.35, -0.6],          // góc (rad) của các cầu nối đảo ↔ đất liền (tự né khu trên đảo)
  beach: {a:-1.45, w:.42},                               // bãi cát rộng ở bờ ngoài phía bắc
  street: {x:8700, y:-600, w:382, h:1618},               // phố đi bộ: dài 1618, rộng 1618/φ³
  mall: {x:8391, y:-1240, w:1000, h:618},                // TTTM: 1000 × 1000/φ, mặt tiền nhìn xuống phố
  village: {a:1.36, r:9150},                             // làng Gió Xanh
  river: {a0:2.02, a1:2.22},                             // sông Bạc: từ biển ngoài chảy vào eo biển
  forest: [2.36, 3.5], camp: {a:2.9, r:9600},            // rừng thông + khu cắm trại
  hills: {a:-2.6, r:9350},                               // đồi Mây + đường leo núi
  flowers: {a:-0.72, r:9250},                            // cánh đồng hoa + cối xay gió
  rice: [[0.86, 1.14], [1.58, 1.86]]                     // đồng lúa hai bên làng
};
const V52W = {on:false, isle:null, lines:[], deco:[], buck:new Map(), river:[], rcell:new Map(), bridges:[], rdeck:[], fields:[], flowers:[], hills:[], trail:[],
  blocks:[], bcell:new Map(), houses:[], places:[], doors:[], lamps:[], sp:[], spi:0, pool:[], peds:null, mills:[], umb:[], tents:[], paths:null, A:null,
  area:{before:0, after:0}, mallSpr:null, msg:{}};
const v52wAng = a => Math.atan2(Math.sin(a), Math.cos(a));
const v52wC = () => [V46L.CX, V46L.CY];
const v52wP = (a, r) => [V46L.CX + Math.cos(a)*r, V46L.CY + Math.sin(a)*r];
const v52wRel = (x, y) => [V46L.CX + x, V46L.CY + y];
function v52wRin(a){ return 6560 + 210*Math.sin(3*a + 1.1) + 120*Math.sin(7*a + .4) + 60*Math.sin(13*a); }
function v52wRout(a){ return 11200 + 260*Math.sin(4*a + 2) + 160*Math.sin(9*a + .5) + 70*Math.sin(17*a + 1); }
function v52wSandW(a){ const B = V52W_L.beach, d = Math.abs(v52wAng(a - B.a)); return d < B.w ? 150 + 430*Math.cos(d/B.w*Math.PI/2) : 150; }
const v52wRnd = (s => () => (s = (s*16807) % 2147483647)/2147483647)(5201);
function v52wPolar(x, y){ const dx = x - V46L.CX, dy = y - V46L.CY; return [Math.hypot(dx, dy), Math.atan2(dy, dx)]; }
function v52wLand(x, y, m){ const [r, a] = v52wPolar(x, y); m = m || 0; return r > v52wRin(a) + 30 + m && r < v52wRout(a) - 40 - m; }

// ---------- đường đi bộ hợp lệ trên đất liền / cầu ----------
function v52wSegD(px, py, ax, ay, bx, by){ const dx = bx - ax, dy = by - ay, L = dx*dx + dy*dy, t = L ? Math.max(0, Math.min(1, ((px - ax)*dx + (py - ay)*dy)/L)) : 0; return Math.hypot(px - ax - dx*t, py - ay - dy*t); }
function v52wOnBridge(x, y){ for(const b of V52W.bridges){ if(x < b.bx0 || x > b.bx1 || y < b.by0 || y > b.by1) continue; const P = b.P; for(let i = 1; i < P.length; i++) if(v52wSegD(x, y, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]) < b.w/2 + 4) return true; } return false; }
function v52wCellKey(x, y, s){ return Math.floor(x/s) + ',' + Math.floor(y/s); }
function v52wRiverD(x, y){ const c = V52W.rcell.get(v52wCellKey(x, y, 240)); if(!c) return 1e9; let d = 1e9; for(const i of c){ const P = V52W.river; d = Math.min(d, v52wSegD(x, y, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])); } return d; }
function v52wNearRoad(x, y, m){ const cx = Math.floor(x/100), cy = Math.floor(y/100); for(let gx = cx - 1; gx <= cx + 1; gx++) for(let gy = cy - 1; gy <= cy + 1; gy++){ const c = V46R.cell[gx + ',' + gy]; if(c) for(const j of c){ const p = V46R.nodes[j]; if((p[0] - x)**2 + (p[1] - y)**2 < m*m) return true; } } return false; }
function v52wBlocked(x, y){ const c = V52W.bcell.get(v52wCellKey(x, y, 400)); if(!c) return null; for(const b of c){ if(b.r){ if((x - b.x)**2 + (y - b.y)**2 < b.r*b.r) return b; } else if(x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return b; } return null; }
function v52wMainWalk(x, y){
  if(!v52wLand(x, y)) return false;
  if(v52wRiverD(x, y) < 52 && !v52wNearRoad(x, y, 44)) return false;
  return !v52wBlocked(x, y);
}
const v52wWalk0 = v46Walk;
v46Walk = function(x, y){ if(v52wWalk0(x, y)) return true; if(!V52W.on) return false; return v52wOnBridge(x, y) || v52wMainWalk(x, y); };
function v52wAddBlock(b){ V52W.blocks.push(b); const x0 = b.r ? b.x - b.r : b.x0, x1 = b.r ? b.x + b.r : b.x1, y0 = b.r ? b.y - b.r : b.y0, y1 = b.r ? b.y + b.r : b.y1;
  for(let gx = Math.floor(x0/400); gx <= Math.floor(x1/400); gx++) for(let gy = Math.floor(y0/400); gy <= Math.floor(y1/400); gy++){ const k = gx + ',' + gy; if(!V52W.bcell.has(k)) V52W.bcell.set(k, []); V52W.bcell.get(k).push(b); } }
function v52wInStreet(x, y){ const S = V52W.A && V52W.A.street; return !!S && x > S.x0 && x < S.x1 && y > S.y0 && y < S.y1; }

// ---------- dựng: đường, cầu, sông, đồng, đồi, làng, phố, cây ----------
function v52wLine(P, w, k, o){ const l = Object.assign({P, closed:false, w, k, v52:1}, o || {}); V52W.lines.push(l); return l; }
function v52wStraight(a, b, step){ const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d/(step || 56))), P = []; for(let i = 0; i <= n; i++) P.push([a[0] + (b[0] - a[0])*i/n, a[1] + (b[1] - a[1])*i/n]); return P; }
function v52wRingNode(p){ let best = null, bd = 1e18; V46R.lines.forEach(l => { if(l.k !== 'ring' || l.v52) return; l.P.forEach(q => { const d = (q[0] - p[0])**2 + (q[1] - p[1])**2; if(d < bd){ bd = d; best = q; } }); }); return best; }
function v52wNearOn(lines, p){ let best = null, bd = 1e18; lines.forEach(l => l.P.forEach(q => { const d = (q[0] - p[0])**2 + (q[1] - p[1])**2; if(d < bd){ bd = d; best = q; } })); return best; }
function v52wBridgeClear(a){
  const L = V46L, R1 = L.roads.rings[L.roads.rings.length - 1];
  for(let r = R1 + 40; r < L.ISLAND + 60; r += 30){ const p = v52wP(a, r); for(const z of V46.Z){ const n = z.n; if(p[0] > n.x0 - 70 && p[0] < n.x1 + 70 && p[1] > n.y0 - 70 && p[1] < n.y1 + 70) return false; } }
  return true;
}
function v52wBuild(){
  const L = V46L, A = V52W.A = {}, rnd = v52wRnd, se = null, RING = V52W_L.ring;
  V52W.lines = []; V52W.bridges = []; V52W.blocks = []; V52W.bcell.clear(); V52W.houses = []; V52W.doors = []; V52W.places = []; V52W.lamps = [];
  // 1. đại lộ vành đai
  const ringP = []; for(let i = 0, n = Math.round(Math.PI*2*RING/56); i < n; i++){ const a = i/n*Math.PI*2; ringP.push(v52wP(a, RING)); }
  const ring = v52wLine(ringP, 60, 'ring52', {closed:true, hw:1});
  // 2. cầu: tiếp nối đường vòng ngoài của đảo, né mọi khu trên đảo (kể cả khu mới thêm sau)
  V52W_L.bridges.forEach((a0, k) => { let a = a0; for(let t = 0; t < 40 && !v52wBridgeClear(a); t++) a = a0 + (t % 2 ? -1 : 1)*Math.ceil((t + 1)/2)*.025;
    const st = v52wRingNode(v52wP(a, L.roads.rings[L.roads.rings.length - 1])); if(!st) return; const aa = Math.atan2(st[1] - L.CY, st[0] - L.CX);
    const end = v52wNearOn([ring], v52wP(aa, RING)), P = v52wStraight(st, end, 56);
    const l = v52wLine(P, 52, 'bridge', {a:aa}); let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; P.forEach(p => { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
    V52W.bridges.push({P, w:52, a:aa, bx0:bx0 - 40, by0:by0 - 40, bx1:bx1 + 40, by1:by1 + 40, name:['Cầu Bình Minh', 'Cầu Lúa Vàng', 'Cầu Rừng Thông', 'Cầu Đồi Mây', 'Cầu Sóng Biển', 'Cầu Hoa Gió'][k]}); l.name = V52W.bridges[V52W.bridges.length - 1].name; });
  // 3. sông Bạc (uốn khúc) từ bờ ngoài vào eo biển
  const RV = V52W_L.river, rv = []; for(let i = 0; i <= 90; i++){ const t = i/90, a = RV.a0 + (RV.a1 - RV.a0)*t + .055*Math.sin(t*9.4), ro = v52wRout(a) + 80, ri = v52wRin(a) - 80; rv.push(v52wP(a, ro + (ri - ro)*t)); }
  V52W.river = rv; V52W.rcell.clear(); for(let i = 0; i < rv.length - 1; i++){ const p = rv[i], q = rv[i + 1]; for(let gx = Math.floor((Math.min(p[0], q[0]) - 120)/240); gx <= Math.floor((Math.max(p[0], q[0]) + 120)/240); gx++) for(let gy = Math.floor((Math.min(p[1], q[1]) - 120)/240); gy <= Math.floor((Math.max(p[1], q[1]) + 120)/240); gy++){ const k = gx + ',' + gy; if(!V52W.rcell.has(k)) V52W.rcell.set(k, []); V52W.rcell.get(k).push(i); } }
  // 4. phố đi bộ + TTTM (hình chữ nhật vàng)
  const S0 = V52W_L.street, M0 = V52W_L.mall, s0 = v52wRel(S0.x, S0.y), m0 = v52wRel(M0.x, M0.y);
  A.street = {x0:s0[0], y0:s0[1], x1:s0[0] + S0.w, y1:s0[1] + S0.h, cx:s0[0] + S0.w/2}; A.mall = {x0:m0[0], y0:m0[1], x1:m0[0] + M0.w, y1:m0[1] + M0.h, cx:m0[0] + M0.w/2};
  const S = A.street, M = A.mall; A.fountain = {x:S.cx, y:S.y0 + S0.h/V52W_PHI/V52W_PHI, r:92}; A.mallDoor = [M.cx, M.y1 + 14];
  v52wAddBlock({x0:M.x0, y0:M.y0, x1:M.x1, y1:M.y1 - 2, k:'mall'}); v52wAddBlock({x:A.fountain.x, y:A.fountain.y, r:A.fountain.r, k:'fountain'});
  const sStart = v52wNearOn([ring], [S.cx, S.y1 + 300]); v52wLine(v52wStraight(sStart, [S.cx, S.y1 + 6]), 44, 'road52');
  const fy = A.fountain.y, wl = [[S.cx, S.y1 + 6], [S.cx - 40, S.y1 - 20], [S.cx - 40, fy + 130], [S.cx - 128, fy], [S.cx - 40, fy - 130], [S.cx, M.y1 + 30]];   // lối đi bộ vô hình cho tự đi (né đài phun nước, xe đẩy)
  v52wLine(wl.slice(1).reduce((P, q, i) => P.concat(v52wStraight(wl[i], q).slice(i ? 1 : 0)), []), 0, 'walk');
  // planters, benches, carts, stage spots along the street (golden rhythm: 1618/φ⁴ ≈ 236)
  A.planters = []; A.benches = []; A.carts = []; A.acts = []; const step = S0.h/V52W_PHI**4;
  for(let y = S.y0 + 70; y < S.y1 - 40; y += step){ if(Math.abs(y - A.fountain.y) < 150) continue; [S.x0 + 26, S.x1 - 26].forEach((x, k) => { A.planters.push({x, y}); v52wAddBlock({x0:x - 22, y0:y - 18, x1:x + 22, y1:y + 6}); A.benches.push({x:x + (k ? -48 : 48), y:y + 40, v:k}); }); }
  [[.18, 0, '🥖', 'Bánh mì nóng', 4], [.52, 1, '🍦', 'Kem que mát lạnh', 3], [.86, 0, '🌽', 'Ngô nướng', 3], [.7, 1, '🧋', 'Trà sữa trân châu', 5]].forEach(([t, side, ic, n, p]) => {
    const x = side ? S.x1 - 78 : S.x0 + 78, y = S.y0 + S0.h*t; A.carts.push({x, y, ic, n, p}); v52wAddBlock({x0:x - 34, y0:y - 14, x1:x + 34, y1:y + 4}); });
  A.acts = [{x:S.cx + 100, y:A.fountain.y + 200, k:'guitar', n:'Nghệ sĩ guitar'}, {x:S.cx - 96, y:S.y0 + S0.h*.3, k:'juggle', n:'Nghệ sĩ tung bóng'}, {x:S.cx + 96, y:S.y0 + S0.h*.78, k:'paint', n:'Hoạ sĩ vẽ chân dung'}, {x:S.cx - 100, y:S.y0 + S0.h*.9, k:'mime', n:'Kịch câm', wk:1}, {x:S.cx + 40, y:S.y0 + 120, k:'violin', n:'Nghệ sĩ violin', wk:1}];
  // 5. làng Gió Xanh: 3 hàng nhà, ngõ nhỏ, giếng làng, cây đa
  const V = V52W_L.village, vc = v52wP(V.a, V.r); A.village = {x:vc[0], y:vc[1]}; const ta = V.a + Math.PI/2;
  const lanePts = []; const STY = ['vn', 'jp', 'eu', 'mod', 'wood'], COL = ['#c0504d', '#5b8def', '#e8a33d', '#6aa84f', '#a678de', '#e06c9f', '#3fb5a3', '#d98b4a'];
  for(let j = 0; j < 3; j++) for(let i = 0; i < 4; i++){ const ox = (i - 1.5)*300, oy = (j - 1)*330 + (i % 2 ? 40 : 0), gx = vc[0] + ox, gy = vc[1] + oy; if(!v52wLand(gx, gy, 120)) continue;
    const a = 132 + ((i + j) % 3)*12, F = v48mFrame(a), h = {i:V52W.houses.length, x:gx, y:gy, a, st:STY[(i + j*2) % 5], col:COL[(i*3 + j) % COL.length], flip:(i + j) % 2 === 1, seed:9001 + i*131 + j*977, F,
      name:['Nhà bác Tư', 'Nhà cô Lan', 'Nhà ông Ba', 'Nhà chị Mai', 'Nhà chú Hùng', 'Nhà bà Năm', 'Nhà anh Minh', 'Nhà cô Thảo', 'Nhà bác Sáu', 'Nhà chị Hoa', 'Nhà ông Bảy', 'Nhà cô Hạnh'][V52W.houses.length % 12]};
    V52W.houses.push(h); v52wAddBlock({x0:gx - a/2 - 4, y0:gy - F.Hb + 8, x1:gx + a/2 + 4, y1:gy - 4, k:'house'}); lanePts.push([gx, gy + 34]); }
  for(let j = 0; j < 3; j++){ const row = V52W.houses.filter(h => Math.abs(h.y - (vc[1] + (j - 1)*330)) < 80).sort((a, b) => a.x - b.x); if(row.length > 1) v52wLine(v52wStraight([row[0].x - 120, vc[1] + (j - 1)*330 + 74], [row[row.length - 1].x + 120, vc[1] + (j - 1)*330 + 74]), 30, 'lane'); }
  v52wLine(v52wStraight(v52wNearOn([ring], [vc[0], vc[1] - 520]), [vc[0], vc[1] - 256]), 34, 'lane'); v52wLine(v52wStraight([vc[0], vc[1] - 256], [vc[0], vc[1] + 404]), 30, 'lane');
  A.well = {x:vc[0] + 150, y:vc[1] + 165}; v52wAddBlock({x:A.well.x, y:A.well.y, r:26}); A.banyan = {x:vc[0] - 660, y:vc[1] - 30};
  // 6. đồng lúa: ô ruộng 300 × 185 (tỉ lệ φ), bờ đất xen
  V52W.fields = []; V52W_L.rice.forEach(([a0, a1]) => { for(let a = a0; a < a1; a += .021) for(let r = RING + 230; r < 10500; r += 205){ const p = v52wP(a, r), f = {x0:p[0] - 150, y0:p[1] - 92, x1:p[0] + 150, y1:p[1] + 92, s:rnd()};
    if(!v52wLand(f.x0, f.y0, 60) || !v52wLand(f.x1, f.y1, 60) || !v52wLand(f.x0, f.y1, 60) || !v52wLand(f.x1, f.y0, 60)) continue;
    if(V52W.fields.some(g => g.x0 < f.x1 + 14 && g.x1 > f.x0 - 14 && g.y0 < f.y1 + 14 && g.y1 > f.y0 - 14)) continue; if(Math.hypot(p[0] - vc[0], p[1] - vc[1]) < 760) continue; if(v52wRiverD(p[0], p[1]) < 260) continue; V52W.fields.push(f); } });
  // 7. cánh đồng hoa + cối xay gió
  const FL = v52wP(V52W_L.flowers.a, V52W_L.flowers.r); V52W.flowers = []; for(let j = 0; j < 9; j++) for(let i = 0; i < 3; i++){ const x = FL[0] - 640 + i*440, y = FL[1] - 360 + j*84; if(v52wLand(x, y, 40) && v52wLand(x + 400, y + 60, 40)) V52W.flowers.push({x, y, w:400, h:60, c:(i + j) % 5}); }
  V52W.mills = [[FL[0] - 760, FL[1] - 470], [FL[0] + 700, FL[1] - 520], [FL[0] + 820, FL[1] + 420]].filter(p => v52wLand(p[0], p[1], 80)).map(p => ({x:p[0], y:p[1]}));
  V52W.mills.forEach(m => v52wAddBlock({x:m.x, y:m.y - 10, r:30}));
  // 8. đồi Mây: các vòng đồng mức + đường leo núi xoắn ốc lên đỉnh
  const HC = v52wP(V52W_L.hills.a, V52W_L.hills.r); V52W.hills = [{x:HC[0], y:HC[1], rx:720, ry:445, n:5, top:1}, {x:HC[0] + 760, y:HC[1] + 520, rx:380, ry:235, n:3}, {x:HC[0] - 700, y:HC[1] + 470, rx:420, ry:260, n:3}, {x:HC[0] + 120, y:HC[1] - 640, rx:340, ry:210, n:3}].filter(h => v52wLand(h.x, h.y, 200));
  V52W.trail = []; for(let i = 0; i <= 80; i++){ const t = i/80, ang = t*Math.PI*3.2 + 1.2, k = 1 - t*.92; V52W.trail.push([HC[0] + Math.cos(ang)*640*k, HC[1] + Math.sin(ang)*395*k]); }
  A.peak = {x:HC[0], y:HC[1] - 6}; v52wLine(v52wStraight(v52wNearOn([ring], V52W.trail[0]), V52W.trail[0]), 34, 'road52'); v52wLine(V52W.trail.slice(), 0, 'walk');
  // 9. rừng + khu cắm trại
  const CP = v52wP(V52W_L.camp.a, V52W_L.camp.r); A.camp = {x:CP[0], y:CP[1]}; V52W.tents = [[-130, -70, '#e57373'], [120, -90, '#64b5f6'], [10, -150, '#ffb74d']].map(([dx, dy, c]) => ({x:CP[0] + dx, y:CP[1] + dy, c}));
  V52W.tents.forEach(t => v52wAddBlock({x0:t.x - 44, y0:t.y - 30, x1:t.x + 44, y1:t.y - 2})); v52wAddBlock({x:CP[0], y:CP[1] + 20, r:20});
  v52wLine(v52wStraight(v52wNearOn([ring], CP), [CP[0], CP[1] + 90]), 30, 'lane');
  // 10. bãi biển: lối dạo ven biển, ô dù, chòi cứu hộ, phao điểm lặn
  const B = V52W_L.beach, prom = []; for(let a = B.a - B.w*.8; a <= B.a + B.w*.8; a += .006) prom.push(v52wP(a, v52wRout(a) - v52wSandW(a) - 60));
  const promL = v52wLine(prom, 36, 'road52'); v52wLine(v52wStraight(v52wNearOn([ring], prom[Math.floor(prom.length/2)]), prom[Math.floor(prom.length/2)]), 40, 'road52');
  V52W.umb = []; for(let a = B.a - B.w*.7; a <= B.a + B.w*.7; a += .022){ const r = v52wRout(a) - v52wSandW(a)*.45, p = v52wP(a, r + (rnd() - .5)*90); V52W.umb.push({x:p[0], y:p[1], c:['#ef5350', '#42a5f5', '#ffca28', '#66bb6a', '#ab47bc'][V52W.umb.length % 5]}); }
  A.guard = v52wP(B.a + .05, v52wRout(B.a + .05) - v52wSandW(B.a + .05)*.6); A.dive = v52wP(B.a - .12, v52wRout(B.a - .12) + 160); A.diveShore = v52wP(B.a - .12, v52wRout(B.a - .12) - 70);
  // 11. hoa viên trước cầu + trạm xe buýt nhỏ: biển tên ở mỗi đầu cầu
  // 12. cây cối: rừng dày ở phía tây, rải rác nơi khác; không mọc trên đường, sông, đồng, nhà, phố
  v52wGraph();
  const okTree = (x, y, m) => { if(!v52wLand(x, y, 40)) return false; if(v52wRiverD(x, y) < 110) return false; if(v52wNearRoad(x, y, m)) return false; if(v52wBlocked(x, y)) return false;
    if(v52wInStreet(x, y) || (x > M.x0 - 60 && x < M.x1 + 60 && y > M.y0 - 60 && y < M.y1 + 80)) return false; if(Math.hypot(x - vc[0], y - vc[1]) < 640) return false; if(Math.hypot(x - CP[0], y - CP[1]) < 260) return false;
    for(const f of V52W.fields) if(x > f.x0 - 20 && x < f.x1 + 20 && y > f.y0 - 10 && y < f.y1 + 40) return false; for(const f of V52W.flowers) if(x > f.x0 - 20 && x < f.x1 + 20 && y > f.y0 - 10 && y < f.y1 + 40) return false;
    if(Math.hypot(x - HC[0], (y - HC[1])*1.6) < 300) return false; return true; };
  const deco = [], FA = V52W_L.forest;
  for(let i = 0; i < 26000 && deco.length < 7200; i++){ const a = rnd()*Math.PI*2 - Math.PI, rr = 6300 + rnd()*5000, p = v52wP(a, rr), inF = v52wAng(a - (FA[0] + FA[1])/2) > -(FA[1] - FA[0])/2 && v52wAng(a - (FA[0] + FA[1])/2) < (FA[1] - FA[0])/2;
    const beach = Math.abs(v52wAng(a - B.a)) < B.w; if(!inF && rnd() < (beach ? .82 : .62)) continue;
    if(!okTree(p[0], p[1], 56)) continue; const sand = rr > v52wRout(a) - v52wSandW(a) - 30; if(sand && !beach) continue;
    const k = beach && sand ? 7 : inF ? (rnd() < .62 ? 1 : 0) : (rnd() < .5 ? 0 : rnd() < .5 ? 2 : 1); deco.push({x:p[0], y:p[1], k, s:.85 + rnd()*.5, c:rnd()}); }
  for(let i = 0; i < 9000; i++){ const a = rnd()*Math.PI*2, p = v52wP(a, 6300 + rnd()*5000); if(!okTree(p[0], p[1], 30) || p[0] !== p[0]) continue; const [r] = v52wPolar(p[0], p[1]); if(r > v52wRout(a) - v52wSandW(a) - 20) continue; deco.push({x:p[0], y:p[1], k:3 + (rnd() < .5 ? 1 : 0), s:1, c:rnd()}); }
  for(let i = 0; i < 260; i++){ const a = V52W_L.hills.a + (rnd() - .5)*.6, p = v52wP(a, V52W_L.hills.r + (rnd() - .5)*1600); if(okTree(p[0], p[1], 30)) deco.push({x:p[0], y:p[1], k:6, s:.7 + rnd()*.8, c:rnd()}); }
  // đèn đường dọc đại lộ và đường nhánh: mỗi 260·φ px
  V52W.lamps = []; V52W.lines.forEach(l => { if(!l.w || l.k === 'bridge' || l.k === 'lane') return; let acc = 0; for(let i = 1; i < l.P.length; i++){ const a = l.P[i - 1], b = l.P[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += d;
    if(acc > 260*V52W_PHI){ acc = 0; const nx = -(b[1] - a[1])/d, ny = (b[0] - a[0])/d, s = (i % 2 ? 1 : -1)*(l.w/2 + 16), x = b[0] + nx*s, y = b[1] + ny*s; if(v52wLand(x, y) && v52wRiverD(x, y) > 90 && !v52wBlocked(x, y) && !v52wInStreet(x, y)){ deco.push({x, y, k:8}); V52W.lamps.push([x, y]); } } } });
  V52W.bridges.forEach(b => { [.2, .5, .8].forEach(t => { const i = Math.floor((b.P.length - 1)*t), p = b.P[i], q = b.P[Math.min(b.P.length - 1, i + 1)], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1])/d, ny = (q[0] - p[0])/d;
    [1, -1].forEach(s => V52W.lamps.push([p[0] + nx*s*(b.w/2 + 8), p[1] + ny*s*(b.w/2 + 8)])); }); });
  A.street.lights = []; for(let y = S.y0 + 30; y < S.y1; y += 118) A.street.lights.push([S.x0 + 8, y], [S.x1 - 8, y]);
  deco.sort((a, b) => a.y - b.y); V52W.deco = deco; V52W.buck.clear(); deco.forEach(t => { const k = Math.floor(t.x/1024) + ',' + Math.floor(t.y/1024); if(!V52W.buck.has(k)) V52W.buck.set(k, []); V52W.buck.get(k).push(t); });
  // cầu qua sông: đoạn đường nằm trên mặt sông
  V52W.rdeck = []; V52W.lines.forEach(l => { if(!l.w || l.k === 'bridge') return; for(let i = 1; i < l.P.length; i++){ const p = l.P[i - 1], q = l.P[i]; if(v52wRiverD((p[0] + q[0])/2, (p[1] + q[1])/2) < 90) V52W.rdeck.push([p, q, l.w]); } });
  V52W.paths = null; v52wArea();
}
// join my roads into the island road graph (pathfinding / auto-walk reach the new lands)
function v52wGraph(){
  if(!V52W.isle) V52W.isle = V46R.lines.filter(l => !l.v52);
  V46R.lines = V52W.isle.concat(V52W.lines); v46Graph(); V46RC.clear();
}
// land area (sampled): before = island disc, after = island + mainland
function v52wArea(){ let n = 0, m = 0; const st = 60; for(let i = 0; i < 720; i++){ const a = i/720*Math.PI*2; m += (v52wRout(a)**2 - v52wRin(a)**2)/2*(Math.PI*2/720); }
  n = Math.PI*V46L.ISLAND**2; V52W.area = {before:Math.round(n), after:Math.round(n + m), ratio:+((n + m)/n).toFixed(2)}; }

// ---------- vẽ tĩnh vào ô (tile) ----------
function v52wPaths(){
  if(V52W.paths) return V52W.paths; const mk = (fo, fi) => { const p = new Path2D(), N = 900; for(let i = 0; i <= N; i++){ const a = i/N*Math.PI*2, r = fo(a), x = V46L.CX + Math.cos(a)*r, y = V46L.CY + Math.sin(a)*r; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath();
    for(let i = N; i >= 0; i--){ const a = i/N*Math.PI*2, r = fi(a), x = V46L.CX + Math.cos(a)*r, y = V46L.CY + Math.sin(a)*r; i === N ? p.moveTo(x, y) : p.lineTo(x, y); } p.closePath(); return p; };
  const riv = new Path2D(); V52W.river.forEach((p, i) => i ? riv.lineTo(p[0], p[1]) : riv.moveTo(p[0], p[1]));
  V52W.paths = {shallow:mk(a => v52wRout(a) + 170, a => v52wRin(a) - 170), wet:mk(a => v52wRout(a) + 34, a => v52wRin(a) - 34), sand:mk(v52wRout, v52wRin),
    grass:mk(a => v52wRout(a) - v52wSandW(a), a => v52wRin(a) + 86), edge:mk(a => v52wRout(a) - v52wSandW(a) + 16, a => v52wRin(a) + 70), riv};
  return V52W.paths;
}
function v52wHex(c){ return c && c[0] === '#' && c.length === 7 ? c : '#4cae49'; }
function v52wPalm(g, t){ const x = t.x, y = t.y, s = t.s;
  g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(x + 8, y + 2, 20*s, 6*s, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#8d6e4a'; for(let k = 0; k < 8; k++) g.fillRect(Math.round(x - 3 + k*1.2*s), Math.round(y - k*7*s - 6), 6, 7);
  const tx = x + 10*s, ty = y - 60*s, lf = season === 'dong' ? '#7cb342' : '#43a047'; g.fillStyle = lf;
  for(let k = 0; k < 6; k++){ const a = k/6*Math.PI*2 + .3; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a)*24*s, ty + Math.sin(a)*12*s - 12*s, tx + Math.cos(a)*34*s, ty + Math.sin(a)*16*s + 4); g.lineTo(tx + Math.cos(a)*28*s, ty + Math.sin(a)*14*s + 6); g.closePath(); g.fill(); }
  g.fillStyle = '#6d4c2e'; g.fillRect(tx - 4, ty - 2, 4, 4); g.fillRect(tx + 1, ty, 4, 4); }
function v52wRock(g, t){ const x = Math.round(t.x), y = Math.round(t.y), s = t.s; g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x - 14*s, y - 2, 28*s, 5);
  g.fillStyle = season === 'dong' ? '#cfd8dc' : '#90a4ae'; g.beginPath(); g.moveTo(x - 14*s, y); g.lineTo(x - 9*s, y - 14*s); g.lineTo(x + 4*s, y - 18*s); g.lineTo(x + 14*s, y - 6*s); g.lineTo(x + 12*s, y); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - 6*s, y - 14*s, 8*s, 3); }
function v52wLamp(g, t){ g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(t.x - 5, t.y - 1, 12, 4); g.fillStyle = '#3a3f4f'; g.fillRect(t.x - 2, t.y - 40, 4, 40); g.fillRect(t.x - 6, t.y - 2, 12, 3); g.fillStyle = '#2b2f3a'; g.fillRect(t.x - 7, t.y - 48, 14, 9); g.fillStyle = '#ffe39a'; g.fillRect(t.x - 5, t.y - 46, 10, 5); }
function v52wSign(g, x, y, nm){ g.fillStyle = '#6b4a2a'; g.fillRect(x - 2, y - 30, 4, 30); g.font = "700 16px 'Be Vietnam Pro', Nunito, sans-serif"; const w = g.measureText(nm).width + 16;
  g.fillStyle = '#7a5230'; g.fillRect(x - w/2, y - 54, w, 26); g.fillStyle = '#a8784a'; g.fillRect(x - w/2 + 2, y - 52, w - 4, 22); g.fillStyle = '#fff8e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, x, y - 41); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
function v52wRiceCol(f){ const s = season; if(s === 'xuan') return ['#7fcf6a', '#9be07f', '#8ed3e8']; if(s === 'ha') return ['#4caf50', '#66bb6a', '#7fc8de']; if(s === 'thu') return ['#e3b63c', '#f2cf5b', '#c9a53a']; return ['#a1887f', '#bcaaa4', '#b3d4e0']; }
function v52wFlowerCol(c){ const P = season === 'dong' ? ['#eceff1', '#cfd8dc', '#ffffff', '#e3eef3', '#dfe7ec'] : season === 'thu' ? ['#ff9800', '#ffb74d', '#e65100', '#ffd54f', '#d84315'] : ['#ec407a', '#ffd23f', '#ab47bc', '#ff7043', '#ffffff']; return P[c % P.length]; }
function v52wHit(x0, y0, x1, y1, a, b, c, d){ return a < x1 && c > x0 && b < y1 && d > y0; }
function v52wPaint(g, x0, y0, w, h, lod){
  const L = V46L, x1 = x0 + w, y1 = y0 + h, se = S(), tau = Math.PI*2;
  // tile entirely inside the inner channel and far from my roads → nothing to add
  const far = Math.max(Math.hypot(x0 - L.CX, y0 - L.CY), Math.hypot(x1 - L.CX, y0 - L.CY), Math.hypot(x0 - L.CX, y1 - L.CY), Math.hypot(x1 - L.CX, y1 - L.CY));
  const P = v52wPaths(), dong = season === 'dong';
  if(far > 5900){
    g.fillStyle = v46Mix(se.sea, '#bff3ff', .25); g.fill(P.shallow, 'evenodd');
    g.fillStyle = v46Mix(se.sea, '#ffffff', .45); g.fill(P.wet, 'evenodd');
    g.fillStyle = se.sand; g.fill(P.sand, 'evenodd');
    g.fillStyle = v46Mix(se.sand, se.grass, .5); g.fill(P.edge, 'evenodd');
    g.fillStyle = se.grass; g.fill(P.grass, 'evenodd');
    if(lod === 0){ g.save(); g.clip(P.grass, 'evenodd'); g.fillStyle = se.grass2; const ys = Math.floor(y0/20)*20; for(let y = ys; y < y1; y += 20){ const xs = Math.floor(x0/40)*40 + (((y/20) % 2 + 2) % 2)*20; for(let x = xs; x < x1; x += 40) g.fillRect(x, y, 20, 20); } g.restore();
      g.fillStyle = 'rgba(190,170,130,.25)'; for(let i = 0; i < 160; i++){ const a = (x0*7 + y0*3 + i*2.39996), r = ((i*97) % 1000)/1000; const xx = x0 + ((i*211 + x0) % w + w) % w, yy = y0 + ((i*157 + y0) % h + h) % h; const [rr, aa] = v52wPolar(xx, yy); if(rr > v52wRout(aa) - v52wSandW(aa) + 10 && rr < v52wRout(aa) - 10) g.fillRect(xx, yy, 3, 3); } }
    // hills (contour rings)
    V52W.hills.forEach(H => { if(!v52wHit(x0, y0, x1, y1, H.x - H.rx, H.y - H.ry, H.x + H.rx, H.y + H.ry)) return;
      for(let k = 0; k < H.n; k++){ const f = 1 - k/H.n; g.fillStyle = dong ? v46Mix('#e8eef2', '#ffffff', k/H.n) : v46Mix(v52wHex(se.grass), k % 2 ? '#3f7d3a' : '#5b9a48', .35 + k*.08); g.beginPath(); g.ellipse(H.x, H.y - k*14, H.rx*f, H.ry*f, 0, 0, tau); g.fill();
        if(lod === 0){ g.strokeStyle = 'rgba(0,0,0,.10)'; g.lineWidth = 3; g.stroke(); } }
      if(H.top){ g.fillStyle = dong ? '#ffffff' : '#8d9e6a'; g.beginPath(); g.ellipse(H.x, H.y - H.n*14, H.rx*.14, H.ry*.14, 0, 0, tau); g.fill(); } });
    if(V52W.trail.length && lod < 2){ g.strokeStyle = dong ? '#d7ccc8' : '#c9a86a'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); V52W.trail.forEach((p, i) => i ? g.lineTo(p[0], p[1] - i*.7) : g.moveTo(p[0], p[1])); g.stroke(); if(lod === 0){ g.setLineDash([6, 14]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.stroke(); g.setLineDash([]); } }
    // rice paddies
    const RC = v52wRiceCol(); V52W.fields.forEach(f => { if(!v52wHit(x0, y0, x1, y1, f.x0, f.y0, f.x1, f.y1)) return; g.fillStyle = '#8d6e4a'; g.fillRect(f.x0 - 8, f.y0 - 8, f.x1 - f.x0 + 16, f.y1 - f.y0 + 16);
      g.fillStyle = season === 'dong' ? RC[2] : RC[0]; g.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0);
      if(lod < 2){ g.fillStyle = RC[1]; for(let y = f.y0 + 8; y < f.y1 - 4; y += 14) for(let x = f.x0 + 6 + ((y/14) % 2)*6; x < f.x1 - 4; x += 12) g.fillRect(x, y, season === 'dong' ? 2 : 4, season === 'dong' ? 2 : 7);
        if(season !== 'thu'){ g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(f.x0 + 20, f.y0 + 30 + f.s*60, (f.x1 - f.x0)*.38, 4); } } });
    // flower strips
    V52W.flowers.forEach(f => { if(!v52wHit(x0, y0, x1, y1, f.x, f.y, f.x + f.w, f.y + f.h)) return; g.fillStyle = '#6d4c2e'; g.fillRect(f.x, f.y, f.w, f.h); g.fillStyle = dong ? '#e0e6ea' : '#4e8a3a'; g.fillRect(f.x + 4, f.y + 6, f.w - 8, f.h - 12);
      if(lod < 2){ g.fillStyle = v52wFlowerCol(f.c); for(let x = f.x + 8; x < f.x + f.w - 6; x += 10) for(let y = f.y + 10; y < f.y + f.h - 10; y += 12) g.fillRect(x + ((y/12) % 2)*4, y, 6, 6); } });
    // river
    if(lod < 2 || true){ g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = dong ? '#c9c4b8' : '#b59b6a'; g.lineWidth = 150; g.stroke(P.riv); g.strokeStyle = v46Mix(se.sea, '#bff3ff', .2); g.lineWidth = 104; g.stroke(P.riv);
      if(lod === 0){ g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 6; g.setLineDash([18, 40]); g.stroke(P.riv); g.setLineDash([]); } }
    // pedestrian street paving
    const A = V52W.A, St = A.street; if(v52wHit(x0, y0, x1, y1, St.x0 - 40, St.y0 - 40, St.x1 + 40, St.y1 + 40)){
      g.fillStyle = dong ? '#d8d2c6' : '#c9b99a'; g.fillRect(St.x0 - 12, St.y0, St.x1 - St.x0 + 24, St.y1 - St.y0 + 8); g.fillStyle = dong ? '#ece8e0' : '#e9dcc0'; g.fillRect(St.x0, St.y0, St.x1 - St.x0, St.y1 - St.y0);
      if(lod === 0){ g.fillStyle = 'rgba(120,90,60,.10)'; for(let y = St.y0; y < St.y1; y += 24) for(let x = St.x0 + ((y/24) % 2)*20; x < St.x1; x += 40) g.fillRect(x, y, 38, 22);
        g.fillStyle = 'rgba(176,72,47,.35)'; g.fillRect(St.cx - 4, St.y0, 8, St.y1 - St.y0); }
      const F = A.fountain; g.fillStyle = '#b0bec5'; g.beginPath(); g.arc(F.x, F.y, F.r + 26, 0, tau); g.fill(); g.fillStyle = '#90a4ae'; g.beginPath(); g.arc(F.x, F.y, F.r, 0, tau); g.fill();
      g.fillStyle = dong ? '#dbe9f0' : v46Mix(se.sea, '#bff3ff', .4); g.beginPath(); g.arc(F.x, F.y, F.r - 10, 0, tau); g.fill(); g.fillStyle = '#cfd8dc'; g.beginPath(); g.arc(F.x, F.y, F.r/V52W_PHI/V52W_PHI, 0, tau); g.fill();
      A.planters.forEach(p => { g.fillStyle = '#8d6e63'; g.fillRect(p.x - 22, p.y - 18, 44, 24); g.fillStyle = '#6d4c41'; g.fillRect(p.x - 22, p.y + 2, 44, 4); });
      if(lod < 2) A.benches.forEach(b => { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(b.x - 24, b.y + 2, 48, 5); g.fillStyle = '#9e9e9e'; g.fillRect(b.x - 24, b.y - 10, 48, 10); g.fillStyle = '#bdbdbd'; g.fillRect(b.x - 24, b.y - 10, 48, 3); g.fillStyle = '#757575'; g.fillRect(b.x - 22, b.y, 5, 5); g.fillRect(b.x + 17, b.y, 5, 5); });
      if(lod < 2){ v52wSign(g, St.cx + 150, St.y1 + 40, '🚶 Phố đi bộ Hoa Phượng'); } }
    // mall forecourt
    const M = A.mall; if(v52wHit(x0, y0, x1, y1, M.x0 - 80, M.y0 - 80, M.x1 + 80, M.y1 + 120)){ g.fillStyle = dong ? '#e0dbd2' : '#d5cbb8'; g.fillRect(M.x0 - 60, M.y0 - 50, M.x1 - M.x0 + 120, M.y1 - M.y0 + 110); g.fillStyle = '#bcaa8e'; g.fillRect(M.x0 - 60, M.y1 + 56, M.x1 - M.x0 + 120, 6); }
    // village ground: beaten earth around the houses, well
    const Vc = A.village; if(v52wHit(x0, y0, x1, y1, Vc.x - 700, Vc.y - 600, Vc.x + 700, Vc.y + 600)){ g.fillStyle = dong ? 'rgba(236,232,224,.6)' : 'rgba(205,180,130,.42)'; g.beginPath(); g.ellipse(Vc.x, Vc.y + 30, 640, 520, 0, 0, tau); g.fill(); }
    // camp clearing
    const C = A.camp; if(v52wHit(x0, y0, x1, y1, C.x - 300, C.y - 300, C.x + 300, C.y + 300)){ g.fillStyle = dong ? '#eceff1' : '#a5c26b'; g.beginPath(); g.ellipse(C.x, C.y - 40, 250, 170, 0, 0, tau); g.fill();
      g.fillStyle = '#795548'; [[-70, 60], [70, 60], [0, 96]].forEach(([dx, dy]) => g.fillRect(C.x + dx - 26, C.y + dy - 4, 52, 10)); g.fillStyle = '#9e9e9e'; for(let k = 0; k < 8; k++){ const a = k/8*tau; g.fillRect(C.x + Math.cos(a)*22 - 4, C.y + 20 + Math.sin(a)*12 - 3, 8, 6); } }
    // beach props
    if(lod < 2) V52W.umb.forEach(u => { if(u.x < x0 - 60 || u.x > x1 + 60 || u.y < y0 - 60 || u.y > y1 + 60) return; g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(u.x + 10, u.y + 4, 34, 10, 0, 0, tau); g.fill();
      g.fillStyle = '#fff'; g.fillRect(u.x - 1, u.y - 44, 3, 46); g.fillStyle = u.c; g.beginPath(); g.arc(u.x, u.y - 44, 32, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(u.x, u.y - 76); g.lineTo(u.x - 10, u.y - 44); g.lineTo(u.x + 10, u.y - 44); g.fill();
      g.fillStyle = '#ffe0b2'; g.fillRect(u.x + 14, u.y - 2, 30, 8); g.fillStyle = u.c; g.fillRect(u.x + 14, u.y - 2, 30, 3); });
  }
  // roads + bridges (my lines; island tiles get the island part of the bridges too)
  const hit = l => { let ok = false; for(let i = 0; i < l.P.length; i += 4){ const p = l.P[i]; if(p[0] > x0 - 200 && p[0] < x1 + 200 && p[1] > y0 - 200 && p[1] < y1 + 200){ ok = true; break; } } return ok; };
  const path = l => { g.beginPath(); l.P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if(l.closed) g.closePath(); };
  const edge = dong ? '#c9c4b8' : '#c3a874', fill = dong ? '#ece8e0' : '#e6d5ab', fill2 = dong ? '#f4f2ec' : '#efe2be';
  g.lineJoin = 'round'; g.lineCap = 'round'; const vis = V52W.lines.filter(l => l.w && hit(l));
  vis.forEach(l => { if(l.k === 'bridge') return; path(l); g.strokeStyle = l.hw ? '#8f8a80' : edge; g.lineWidth = l.w + 10; g.stroke(); });
  vis.forEach(l => { if(l.k === 'bridge') return; path(l); g.strokeStyle = l.hw ? (dong ? '#9aa0a6' : '#7d8288') : fill; g.lineWidth = l.w; g.stroke(); if(lod === 0){ g.strokeStyle = l.hw ? '#f5f1e6' : fill2; g.lineWidth = l.hw ? 3 : l.w*.38; g.setLineDash(l.hw ? [26, 22] : [10, 26]); g.stroke(); g.setLineDash([]); } });
  // bridges over the channel: stone piers + wooden deck + railings
  V52W.bridges.forEach(b => { if(!hit(b)) return; const P = b.P; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.strokeStyle = 'rgba(10,30,60,.25)'; g.lineWidth = b.w + 30; g.stroke(); g.strokeStyle = '#6d5a48'; g.lineWidth = b.w + 18; g.stroke(); g.strokeStyle = '#efe6d6'; g.lineWidth = b.w + 8; g.stroke(); g.strokeStyle = dong ? '#d7ccc8' : '#b08a5c'; g.lineWidth = b.w; g.stroke();
    if(lod === 0){ g.strokeStyle = 'rgba(80,50,25,.35)'; g.lineWidth = b.w - 4; g.setLineDash([3, 11]); g.stroke(); g.setLineDash([]); g.fillStyle = '#efe6d6';
      for(let i = 3; i < P.length - 1; i += 4){ const p = P[i], q = P[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1])/d, ny = (q[0] - p[0])/d; [1, -1].forEach(s => g.fillRect(p[0] + nx*s*(b.w/2 + 5) - 5, p[1] + ny*s*(b.w/2 + 5) - 9, 10, 12)); } }
    if(lod < 2){ const e = P[P.length - 1], q = P[P.length - 6] || P[0]; const s = v52wLand(e[0], e[1]) ? e : null; if(s && lod === 0) v52wSign(g, q[0] + 70, q[1] + 40, '🌉 ' + b.name); } });
  // road bridges over the river
  V52W.rdeck.forEach(([p, q, w]) => { if(Math.max(p[0], q[0]) < x0 - 100 || Math.min(p[0], q[0]) > x1 + 100 || Math.max(p[1], q[1]) < y0 - 100 || Math.min(p[1], q[1]) > y1 + 100) return;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineCap = 'butt'; g.strokeStyle = '#5d4037'; g.lineWidth = w + 22; g.stroke(); g.strokeStyle = '#a1887f'; g.lineWidth = w + 4; g.stroke(); g.lineCap = 'round'; });
  if(far <= 5900) return;
  // decorations: trees, palms, rocks, flowers, lamps
  const bx0 = Math.floor((x0 - 60)/1024), bx1 = Math.floor((x1 + 60)/1024), by0 = Math.floor((y0 - 10)/1024), by1 = Math.floor((y1 + 80)/1024), list = [];
  for(let bx = bx0; bx <= bx1; bx++) for(let by = by0; by <= by1; by++){ const b = V52W.buck.get(bx + ',' + by); if(b) for(const t of b) if(t.x > x0 - 60 && t.x < x1 + 60 && t.y > y0 - 10 && t.y < y1 + 80) list.push(t); }
  if(bx1 - bx0 > 0 || by1 - by0 > 0) list.sort((a, b) => a.y - b.y);
  for(const t of list){ if(lod === 2){ if(t.k < 3 || t.k === 7){ g.fillStyle = t.k === 1 ? '#2f7d4a' : season === 'dong' ? '#cfd8dc' : '#3f8f45'; g.fillRect(t.x - 16, t.y - 26, 32, 26); } continue; }
    if(t.k === 8) v52wLamp(g, t); else if(t.k === 7) v52wPalm(g, t); else if(t.k === 6) v52wRock(g, t); else if(t.k < 3) v46Tree(g, t, se); else if(lod === 0) v46Flower(g, t); }
  if(lod === 2){ const A = V52W.A; V52W.houses.forEach(hh => { g.fillStyle = hh.col; g.fillRect(hh.x - hh.a/2, hh.y - 90, hh.a, 90); }); const M = A.mall; g.fillStyle = '#90caf9'; g.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0); g.fillStyle = '#ef5350'; g.fillRect(M.x0, M.y1 - 80, M.x1 - M.x0, 30); }
}
