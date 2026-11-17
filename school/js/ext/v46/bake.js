// ================= v46 · 4/9 BAKE: nền tĩnh của đảo theo ô (tile) + ảnh toàn cảnh nhỏ =================
const V46T = {L0:new Map(), L1:new Map(), ov:null, key:'', deco:[], TS:1024, OVS:2048/11200, budget:0};
const v46Rnd = (s => () => (s = (s*16807) % 2147483647) / 2147483647)(4601);
function v46Mix(a, b, k){ const h = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)], A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v)*k).toString(16).padStart(2, '0')).join(''); }
// trees, bushes and flowers between the zones (never on a road, never inside a zone)
function v46Deco(){
  const L = V46L, out = [], obs = v46Obst(26), rnd = v46Rnd;
  const nearRoad = (x, y, m) => { const cx = Math.floor(x/100), cy = Math.floor(y/100); for(let gx = cx - 1; gx <= cx + 1; gx++) for(let gy = cy - 1; gy <= cy + 1; gy++){ const c = V46R.cell[gx + ',' + gy]; if(c) for(const j of c){ const p = V46R.nodes[j]; if((p[0] - x)**2 + (p[1] - y)**2 < m*m) return true; } } return false; };
  const ok = (x, y, m) => { const r = Math.hypot(x - L.CX, y - L.CY); if(r > L.GRASS - 70 || r < 330) return false; for(const o of obs) if(x > o.x0 && x < o.x1 && y > o.y0 - 30 && y < o.y1) return false; return !nearRoad(x, y, m); };
  for(let i = 0; i < 5200 && out.length < 1500; i++){ const a = rnd()*Math.PI*2, r = Math.sqrt(rnd())*L.GRASS, x = L.CX + Math.cos(a)*r, y = L.CY + Math.sin(a)*r;
    if(!ok(x, y, 52)) continue; if(out.some(t => t.k < 3 && Math.abs(t.x - x) < 46 && Math.abs(t.y - y) < 38)) continue;
    const k = rnd() < .45 ? 0 : rnd() < .62 ? 1 : 2; out.push({x, y, k, s:.8 + rnd()*.5, c:rnd()}); }
  for(let i = 0; i < 2600; i++){ const a = rnd()*Math.PI*2, r = Math.sqrt(rnd())*L.GRASS, x = L.CX + Math.cos(a)*r, y = L.CY + Math.sin(a)*r; if(!ok(x, y, 34)) continue; out.push({x, y, k:3 + Math.floor(rnd()*2), s:1, c:rnd()}); }
  // signposts where each spoke leaves the road
  V46R.lines.forEach(l => { if(l.k !== 'spoke') return; const p = l.P[l.P.length - 1], q = l.P[Math.max(0, l.P.length - 3)]; out.push({x:p[0] + (q[1] - p[1] > 0 ? 34 : -34), y:p[1] + 6, k:9, z:l.z}); });
  // street lamps along the rings and radials, one every 1.618 × 260 px
  V46T.lamps = []; V46R.lines.forEach(l => { if(l.k === 'spoke') return; let acc = 0; for(let i = 1; i < l.P.length; i++){ const a = l.P[i - 1], b = l.P[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += d;
    if(acc > 260*PHI){ acc = 0; const nx = -(b[1] - a[1])/d, ny = (b[0] - a[0])/d, s = (i % 2 ? 1 : -1)*(l.w/2 + 16); const x = b[0] + nx*s, y = b[1] + ny*s; if(!v46ZoneNew(x, y)){ out.push({x, y, k:8}); V46T.lamps.push([x, y]); } } } });
  out.sort((a, b) => a.y - b.y); V46T.deco = out;
}
function v46Tree(g, t, se){
  const s = t.s, x = t.x, y = t.y, dong = season === 'dong';
  g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(x, y + 2, 18*s, 6*s, 0, 0, Math.PI*2); g.fill();
  if(t.k === 1){ g.fillStyle = '#6b4a2a'; g.fillRect(x - 3, y - 12*s, 6, 12*s); const c = dong ? '#e8eef2' : '#2f7d4a'; for(let k = 0; k < 3; k++){ g.fillStyle = k ? (dong ? '#f6f9fb' : '#3d9459') : c; g.beginPath(); g.moveTo(x, y - (52 - k*12)*s); g.lineTo(x - (20 - k*3)*s, y - (12 + k*12)*s); g.lineTo(x + (20 - k*3)*s, y - (12 + k*12)*s); g.fill(); } return; }
  if(t.k === 2){ const c = dong ? '#dfe7ec' : se.leaf || '#4cae49'; g.fillStyle = c; g.beginPath(); g.arc(x - 8*s, y - 6*s, 10*s, 0, Math.PI*2); g.arc(x + 8*s, y - 6*s, 10*s, 0, Math.PI*2); g.arc(x, y - 12*s, 11*s, 0, Math.PI*2); g.fill();
    if(!dong && season === 'xuan'){ g.fillStyle = '#ffb3d1'; g.fillRect(x - 6, y - 14*s, 3, 3); g.fillRect(x + 5, y - 9*s, 3, 3); } return; }
  g.fillStyle = '#7a5230'; g.fillRect(x - 3, y - 18*s, 6, 18*s);
  const leaf = dong ? '#e9eff3' : (t.c < .3 && se.leaf2) ? se.leaf2 : (se.leaf || '#4cae49');
  g.fillStyle = v46Mix(leaf.length === 7 ? leaf : '#4cae49', '#000000', .18); g.beginPath(); g.arc(x, y - 30*s, 20*s, 0, Math.PI*2); g.fill();
  g.fillStyle = leaf; g.beginPath(); g.arc(x - 5*s, y - 34*s, 15*s, 0, Math.PI*2); g.arc(x + 7*s, y - 30*s, 13*s, 0, Math.PI*2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x - 9*s, y - 40*s, 6*s, 0, Math.PI*2); g.fill();
}
function v46Flower(g, t){
  const cols = season === 'dong' ? ['#ffffff', '#dfe9f0'] : season === 'thu' ? ['#ffb347', '#e0832d', '#f5d76e'] : ['#ff8fc4', '#ffd23f', '#ffffff', '#b06bff', '#ff6f61'];
  if(t.k === 3){ for(let i = 0; i < 5; i++){ g.fillStyle = cols[(i + Math.floor(t.c*9)) % cols.length]; g.fillRect(Math.round(t.x + Math.cos(i*2.4)*9), Math.round(t.y + Math.sin(i*2.4)*5), 4, 4); } g.fillStyle = 'rgba(40,110,40,.5)'; g.fillRect(t.x - 1, t.y + 2, 2, 4); return; }
  g.fillStyle = 'rgba(30,90,40,.35)'; g.fillRect(Math.round(t.x - 6), Math.round(t.y), 3, 6); g.fillRect(Math.round(t.x + 2), Math.round(t.y - 1), 3, 7); g.fillRect(Math.round(t.x - 1), Math.round(t.y - 3), 2, 9);
}
function v46Sign(g, t){
  const z = V46.ZI[t.z], nm = z && R[z.id] ? R[z.id].name : z && z.id === 'harbor' ? 'Bến tàu & Hải đăng' : z && z.id === 'houses' ? 'Khu nhà học sinh' : ''; if(!nm) return;
  g.fillStyle = '#6b4a2a'; g.fillRect(t.x - 2, t.y - 30, 4, 30);
  g.font = "700 15px 'Be Vietnam Pro', Nunito, sans-serif"; const w = g.measureText(nm).width + 14;
  g.fillStyle = '#8b5e34'; g.fillRect(t.x - w/2, t.y - 50, w, 22); g.fillStyle = '#a8784a'; g.fillRect(t.x - w/2 + 2, t.y - 48, w - 4, 18);
  g.fillStyle = '#fff8e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, t.x, t.y - 39); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
// paint the static island into g for world box [x0,y0,x0+w,y0+h]; g is already scaled to world units
function v46Paint(g, x0, y0, w, h, lod){
  const L = V46L, se = S(), C = [L.CX, L.CY], x1 = x0 + w, y1 = y0 + h, tau = Math.PI*2;
  g.fillStyle = se.sea2; g.fillRect(x0, y0, w, h);
  const ring = (r, c) => { g.fillStyle = c; g.beginPath(); g.arc(C[0], C[1], r, 0, tau); g.fill(); };
  ring(L.ISLAND + 900, v46Mix(se.sea2, se.sea, .55)); ring(L.ISLAND + 420, se.sea); ring(L.ISLAND + 110, v46Mix(se.sea, '#bff3ff', .35));
  ring(L.ISLAND, v46Mix(se.sand, '#c9b48a', .22)); ring(L.ISLAND - 26, se.sand);
  ring(L.GRASS + 18, v46Mix(se.sand, se.grass, .5)); ring(L.GRASS, se.grass);
  if(lod === 0){ g.save(); g.beginPath(); g.arc(C[0], C[1], L.GRASS, 0, tau); g.clip(); g.fillStyle = se.grass2;
    const ys = Math.floor(y0/20)*20; for(let y = ys; y < y1; y += 20){ const xs = Math.floor(x0/40)*40 + (((y/20) % 2 + 2) % 2)*20; for(let x = xs; x < x1; x += 40) g.fillRect(x, y, 20, 20); }
    g.restore();
    g.fillStyle = 'rgba(190,170,130,.22)'; for(let i = 0; i < 900; i++){ const a = i*2.39996, r = L.GRASS + 40 + (i*37 % 440); const x = C[0] + Math.cos(a)*r, y = C[1] + Math.sin(a)*r; if(x > x0 && x < x1 && y > y0 && y < y1) g.fillRect(x, y, 3, 3); } }
  // roads
  g.lineJoin = 'round'; g.lineCap = 'round';
  const pathOf = l => { g.beginPath(); l.P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if(l.closed) g.closePath(); };
  const dong = season === 'dong', edge = dong ? '#c9c4b8' : '#c3a874', fill = dong ? '#ece8e0' : '#e6d5ab', fill2 = dong ? '#f4f2ec' : '#efe2be';
  V46R.lines.forEach(l => { pathOf(l); g.strokeStyle = edge; g.lineWidth = l.w + 10; g.stroke(); });
  V46R.lines.forEach(l => { pathOf(l); g.strokeStyle = fill; g.lineWidth = l.w; g.stroke(); if(lod === 0){ g.strokeStyle = fill2; g.lineWidth = l.w*.38; g.setLineDash([10, 26]); g.stroke(); g.setLineDash([]); } });
  // school plaza + gate (golden ratio rings)
  ring(300, edge); ring(292, '#d9d2c3'); ring(292/PHI, '#cfc7b6'); ring(292/PHI/PHI, se.grass);
  if(lod === 0){ g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 2; for(let r = 40; r < 292; r += 26){ g.beginPath(); g.arc(C[0], C[1], r, 0, tau); g.stroke(); }
    for(let i = 0; i < 12; i++){ const a = i/12*tau; g.fillStyle = ['#ff8fc4', '#ffd23f', '#ffffff'][i % 3]; g.fillRect(C[0] + Math.cos(a)*(292/PHI/PHI - 14), C[1] + Math.sin(a)*(292/PHI/PHI - 14), 6, 6); } }
  const G = v46Gate(); g.fillStyle = '#7a3b2a'; g.fillRect(G[0] - 92, G[1] - 70, 18, 70); g.fillRect(G[0] + 74, G[1] - 70, 18, 70);
  g.fillStyle = '#b0472f'; g.fillRect(G[0] - 104, G[1] - 96, 208, 30); g.fillStyle = '#2b1c14'; g.fillRect(G[0] - 104, G[1] - 70, 208, 4);
  g.font = "700 17px 'Be Vietnam Pro', Nunito, sans-serif"; g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CỔNG TRƯỜNG RUBIK', G[0], G[1] - 81); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  // decorations
  for(const t of V46T.deco){ if(t.x < x0 - 60 || t.x > x1 + 60 || t.y < y0 - 10 || t.y > y1 + 70) continue;
    if(lod === 2){ if(t.k < 3){ g.fillStyle = t.k === 1 ? '#2f7d4a' : se.leaf || '#cfd8dc'; g.fillRect(t.x - 14, t.y - 24, 28, 24); } continue; }
    if(t.k === 8){ g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(t.x - 5, t.y - 1, 12, 4); g.fillStyle = '#3a3f4f'; g.fillRect(t.x - 2, t.y - 40, 4, 40); g.fillRect(t.x - 6, t.y - 2, 12, 3); g.fillStyle = '#2b2f3a'; g.fillRect(t.x - 7, t.y - 48, 14, 9); g.fillStyle = '#ffe39a'; g.fillRect(t.x - 5, t.y - 46, 10, 5); continue; }
    if(t.k < 3) v46Tree(g, t, se); else if(t.k < 9){ if(lod === 0) v46Flower(g, t); } else v46Sign(g, t); }
  // zone ground patches cut from the old baked ground
  for(const z of V46.Z){ const n = z.n; if(n.x1 < x0 || n.x0 > x1 || n.y1 < y0 || n.y0 > y1) continue;
    if(z.flip){ v46PaintHarbor(g, z, se); continue; }
    g.save(); v46ClipZone(g, z, 0); g.translate(z.d[0], z.d[1]);
    const e = z.e, src = (cv, sy0, sy1, oy) => { if(!cv) return; const ya = Math.max(e.y0, sy0), yb = Math.min(e.y1, sy1), xa = Math.max(0, e.x0), xb = Math.min(W, e.x1); if(yb <= ya || xb <= xa) return; g.drawImage(cv, xa, ya - oy, xb - xa, yb - ya, xa, ya, xb - xa, yb - ya); };
    src(groundCache, 0, 790, 0); src(northCache, NY, 0, NY);
    g.restore(); }
}
// clip to a zone's cut-out (expanded rect minus the real rects of other zones that poke in)
function v46ClipZone(g, z, pad){
  const e = z.e; g.beginPath(); const P = (x0, y0, x1, y1) => { const a = v46N(z, x0, y0), b = v46N(z, x1, y1); g.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); };
  P(e.x0 - pad, e.y0 - pad, e.x1 + pad, e.y1 + pad);
  z.holes.forEach(o => { const x0 = Math.max(o.x, e.x0), y0 = Math.max(o.y, e.y0), x1 = Math.min(o.x + o.w, e.x1), y1 = Math.min(o.y + o.h, e.y1); if(x1 > x0 && y1 > y0) P(x0, y0, x1, y1); });
  g.clip('evenodd');
}
function v46PaintHarbor(g, z, se){
  const n = z.n, sh = z.d[1] - 872, sb = z.d[1] - 786, r = 180;
  g.save(); g.beginPath(); g.arc(V46L.CX, V46L.CY, V46L.ISLAND + 110, 0, Math.PI*2); g.clip(); g.fillStyle = se.sea; g.beginPath(); g.moveTo(n.x0, n.y0); g.lineTo(n.x1, n.y0); g.lineTo(n.x1, sh - r); g.quadraticCurveTo(n.x1, sh, n.x1 - r, sh); g.lineTo(n.x0 + r, sh); g.quadraticCurveTo(n.x0, sh, n.x0, sh - r); g.closePath(); g.fill();
  g.fillStyle = v46Mix(se.sea, '#bff3ff', .35); g.fillRect(n.x0 + r, sh - 60, n.x1 - n.x0 - 2*r, 60);
  g.restore(); g.fillStyle = se.sand; g.fillRect(n.x0 + r*.6, sh, n.x1 - n.x0 - r*1.2, sb - sh + 4);
}
function v46TileKey(){ return season + '|' + (groundCache ? 1 : 0) + (northCache ? 1 : 0); }
function v46CheckCaches(){
  if(!groundCache || groundSeason !== season) buildGround(); if(!northCache || northSeason !== season) buildNorth();
  const k = season, gc = groundCache;
  if(V46T.key !== k || V46T.gc !== gc || V46T.nc !== northCache){ V46T.key = k; V46T.gc = gc; V46T.nc = northCache; V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; }
}
function v46Tile(lod, i, j){
  const M = lod ? V46T.L1 : V46T.L0, k = i + ',' + j; let c = M.get(k);
  if(c){ M.delete(k); M.set(k, c); return c; }
  if(V46T.budget <= 0) return null; V46T.budget--;
  c = document.createElement('canvas'); c.width = c.height = V46T.TS; const g = c.getContext('2d'), span = V46T.TS*(lod ? 2 : 1), sc = 1/(lod ? 2 : 1);
  g.imageSmoothingEnabled = false; g.setTransform(sc, 0, 0, sc, -i*span*sc, -j*span*sc); const prev = ctx; ctx = g;
  try { v46Paint(g, i*span, j*span, span, span, lod); if(lod === 0) v46TileStatics(g, i*span, j*span, span); } catch(e){ console.warn('v46 tile', e); }
  ctx = prev; M.set(k, c); const cap = lod ? 16 : 26; while(M.size > cap) M.delete(M.keys().next().value);
  return c;
}
function v46Overview(){
  if(V46T.ov) return V46T.ov; const c = document.createElement('canvas'), N = 2048; c.width = c.height = N; const g = c.getContext('2d'), s = V46T.OVS;
  g.setTransform(s, 0, 0, s, 0, 0); const prev = ctx; ctx = g;
  try { v46Paint(g, 0, 0, V46L.W, V46L.H, 2); v46OverviewBuildings(g); } catch(e){ console.warn('v46 overview', e); }
  ctx = prev; V46T.ov = c; return c;
}
// draw the static island under the camera: tiles when close, the small overview when far
function v46DrawGround(VBn){
  v46CheckCaches(); V46T.budget = V46T.L0.size < 4 ? 6 : 1;
  const ov = v46Overview(), s = V46T.OVS, z = cam.z;
  const ax = Math.max(0, VBn.x0), ay = Math.max(0, VBn.y0), bx = Math.min(V46L.W, VBn.x1), by = Math.min(V46L.H, VBn.y1);
  ctx.fillStyle = S().sea2; ctx.fillRect(VBn.x0, VBn.y0, VBn.x1 - VBn.x0, VBn.y1 - VBn.y0);
  if(bx > ax && by > ay) ctx.drawImage(ov, ax*s, ay*s, (bx - ax)*s, (by - ay)*s, ax, ay, bx - ax, by - ay);
  if(z < .2) return;
  const lod = z >= .55 ? 0 : 1, span = V46T.TS*(lod ? 2 : 1);
  for(let j = Math.floor(ay/span); j*span < by; j++) for(let i = Math.floor(ax/span); i*span < bx; i++){ const t = v46Tile(lod, i, j); if(t) ctx.drawImage(t, i*span, j*span, span, span); }
}
