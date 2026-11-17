// ================= v46 · 3/9 ROADS: đường vòng + đường hướng tâm + lối rẽ vào từng khu, tìm đường =================
const V46R = {lines:[], nodes:[], adj:[], cell:{}, ready:false};
function v46Obst(pad){ return V46.Z.map(z => ({x0:z.n.x0 - pad, y0:z.n.y0 - pad, x1:z.n.x1 + pad, y1:z.n.y1 + pad, z})); }
function v46Push(p, obs, skip){
  for(let k = 0; k < 4; k++){ let moved = false;
    for(const r of obs){ if(r.z === skip || p[0] < r.x0 || p[0] > r.x1 || p[1] < r.y0 || p[1] > r.y1) continue;
      const dl = p[0] - r.x0, dr = r.x1 - p[0], dt = p[1] - r.y0, db = r.y1 - p[1], m = Math.min(dl, dr, dt, db);
      if(m === dl) p[0] = r.x0 - 1; else if(m === dr) p[0] = r.x1 + 1; else if(m === dt) p[1] = r.y0 - 1; else p[1] = r.y1 + 1; moved = true; }
    if(!moved) break; }
  const L = V46L, dx = p[0] - L.CX, dy = p[1] - L.CY, rr = Math.hypot(dx, dy), lim = L.GRASS - 140;
  if(rr > lim){ p[0] = L.CX + dx/rr*lim; p[1] = L.CY + dy/rr*lim; }
  return p;
}
function v46Smooth(P, obs, closed, it, skip){
  for(let n = 0; n < it; n++){
    const Q = P.map(p => p.slice());
    for(let i = 0; i < P.length; i++){ if(!closed && (i === 0 || i === P.length - 1)) continue;
      const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length]; Q[i][0] = (a[0] + 2*P[i][0] + b[0])/4; Q[i][1] = (a[1] + 2*P[i][1] + b[1])/4; v46Push(Q[i], obs, skip); }
    P = Q; }
  return P;
}
function v46Roads(){
  const L = V46L, C = [L.CX, L.CY], obs = v46Obst(46), lines = [];
  // rings (golden ratio radii)
  L.roads.rings.forEach(r => { const n = Math.round(Math.PI*2*r/56); let P = [];
    for(let i = 0; i < n; i++){ const a = i/n*Math.PI*2; P.push(v46Push([C[0] + Math.cos(a)*r, C[1] + Math.sin(a)*r], obs)); }
    lines.push({P:v46Smooth(P, obs, true, 6), closed:true, w:L.roads.width, k:'ring'}); });
  // radial roads at golden-angle steps, from the school plaza to the outer ring
  const R1 = L.roads.rings[L.roads.rings.length - 1];
  for(let k = 0; k < L.roads.radials; k++){ const a = -Math.PI/2 + k*2.39996; let P = [];
    for(let r = 250; r <= R1; r += 56) P.push(v46Push([C[0] + Math.cos(a)*r, C[1] + Math.sin(a)*r], obs));
    lines.push({P:v46Smooth(P, obs, false, 6), closed:false, w:Math.round(L.roads.width/Math.sqrt(PHI)), k:'radial'}); }
  V46R.lines = lines; v46Graph(); 
  // a spoke from every zone's entrance to the nearest road
  V46.Z.forEach(z => { const e = v46Entry(z); z.entry = e; const q = v46Nearest(e[0], e[1]), t = V46R.nodes[q];
    const len = Math.hypot(t[0] - e[0], t[1] - e[1]), n = Math.max(2, Math.ceil(len/50)); let P = [];
    for(let i = 0; i <= n; i++) P.push([e[0] + (t[0] - e[0])*i/n, e[1] + (t[1] - e[1])*i/n]);
    P = P.map((p, i) => i === 0 || i === n ? p : v46Push(p, obs, z)); P = v46Smooth(P, obs, false, 3, z);
    lines.push({P, closed:false, w:L.roads.path, k:'spoke', z:z.id}); });
  v46Graph(); V46R.ready = true;
}
// zone entrance in new coordinates: the door when there is one, else the side facing the island centre
function v46Entry(z){
  const r = R[z.id];
  if(r && r.dout && r.walls){ const p = v46N(z, r.dout[0], r.dout[1]); return [p[0], p[1] + (r.side === 'b' ? 20 : r.side === 't' ? -20 : 0)]; }
  const n = z.n, cx = (n.x0 + n.x1)/2, cy = (n.y0 + n.y1)/2, dx = V46L.CX - cx, dy = V46L.CY - cy;
  if(z.flip) return [cx + 60, n.y1 + 30];
  if(Math.abs(dx)*(n.y1 - n.y0) > Math.abs(dy)*(n.x1 - n.x0)) return [dx > 0 ? n.x1 + 4 : n.x0 - 4, cy];
  return [cx, dy > 0 ? n.y1 + 4 : n.y0 - 4];
}
function v46Graph(){
  const nodes = [], adj = [], cell = {}, key = (x, y) => (Math.floor(x/100)) + ',' + (Math.floor(y/100));
  const owner = [];
  V46R.lines.forEach((l, li) => { const base = nodes.length;
    l.P.forEach((p, i) => { nodes.push(p); adj.push([]); owner.push(li); const k = key(p[0], p[1]); (cell[k] = cell[k] || []).push(base + i);
      if(i){ adj[base + i].push(base + i - 1); adj[base + i - 1].push(base + i); } });
    if(l.closed){ const a = base, b = base + l.P.length - 1; adj[a].push(b); adj[b].push(a); } });
  // join different roads where they meet
  nodes.forEach((p, i) => { const cx = Math.floor(p[0]/100), cy = Math.floor(p[1]/100);
    for(let gx = cx - 1; gx <= cx + 1; gx++) for(let gy = cy - 1; gy <= cy + 1; gy++) (cell[gx + ',' + gy] || []).forEach(j => {
      if(j <= i || owner[j] === owner[i]) return; if(Math.hypot(nodes[j][0] - p[0], nodes[j][1] - p[1]) < 64){ adj[i].push(j); adj[j].push(i); } }); });
  V46R.nodes = nodes; V46R.adj = adj; V46R.cell = cell;
}
function v46Nearest(x, y){
  const cx = Math.floor(x/100), cy = Math.floor(y/100); let best = -1, bd = 1e18;
  for(let rad = 1; rad < 60 && best < 0; rad += 3){ for(let gx = cx - rad; gx <= cx + rad; gx++) for(let gy = cy - rad; gy <= cy + rad; gy++) (V46R.cell[gx + ',' + gy] || []).forEach(j => { const d = (V46R.nodes[j][0] - x)**2 + (V46R.nodes[j][1] - y)**2; if(d < bd){ bd = d; best = j; } }); }
  return best < 0 ? 0 : best;
}
// shortest road route between two new-space points (list of points, ends included)
const V46RC = new Map();
function v46Route(a, b){
  if(Math.hypot(b[0] - a[0], b[1] - a[1]) < 420) return [a, b];
  const s = v46Nearest(a[0], a[1]), t = v46Nearest(b[0], b[1]), ck = s + ':' + t;
  let mid = V46RC.get(ck);
  if(!mid){ const N = V46R.nodes, dist = new Float64Array(N.length).fill(1e18), prev = new Int32Array(N.length).fill(-1), heap = [[0, s]]; dist[s] = 0;
    while(heap.length){ let bi = 0; for(let i = 1; i < heap.length; i++) if(heap[i][0] < heap[bi][0]) bi = i; const [d, u] = heap[bi]; heap[bi] = heap[heap.length - 1]; heap.pop();
      if(d > dist[u]) continue; if(u === t) break;
      for(const v of V46R.adj[u]){ const nd = d + Math.hypot(N[v][0] - N[u][0], N[v][1] - N[u][1]); if(nd < dist[v]){ dist[v] = nd; prev[v] = u; heap.push([nd, v]); } } }
    mid = []; for(let u = t; u >= 0; u = prev[u]){ mid.push(N[u]); if(u === s) break; } mid.reverse();
    if(V46RC.size > 600) V46RC.clear(); V46RC.set(ck, mid); }
  return [a].concat(mid, [b]);
}
// open land you can walk on (outside the zones)
function v46Walk(x, y){ const L = V46L; return Math.hypot(x - L.CX, y - L.CY) < L.ISLAND - 40; }
