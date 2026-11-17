// ================= v46 · 2/9 COORDS: đổi toạ độ cũ (logic game) <-> mới (đảo tròn) =================
// Logic cũ (cửa, chỗ ngồi, mini game, NPC) vẫn chạy trong toạ độ cũ. Mỗi khu được "dán" sang đảo
// bằng một độ dời d = vị trí mới − vị trí cũ (làm tròn 40px cho cỏ khớp vân).
// Ngoài các khu (đường, bãi cỏ giữa đảo) là toạ độ mới thuần: lưu là x + V46E để code cũ coi như "rất xa".
const V46E = 1e6, v46Raw = x => x > V46E/2;
var V46 = {on:false, Z:[], ZI:{}, raw:false, sky:false, ready:false};
function v46Build(){
  const L = V46L, r40 = v => Math.round(v/40)*40;
  const add = (id, o, m, d, flip) => {
    const e = {x0:o.x - m[3], y0:o.y - m[0], x1:o.x + o.w + m[1], y1:o.y + o.h + m[2]};
    if(o.y < 0) e.y0 = Math.max(e.y0, NY + 4);
    const z = {id, o, e, d, flip:!!flip};
    z.nr = v46RectN(z, {x0:o.x, y0:o.y, x1:o.x + o.w, y1:o.y + o.h}); z.n = v46RectN(z, e);
    V46.Z.push(z); V46.ZI[id] = z; return z;
  };
  Object.entries(L.zones).forEach(([id, c]) => {
    const s = c.src || [R[id].x, R[id].y, R[id].w, R[id].h], o = {x:s[0], y:s[1], w:s[2], h:s[3]};
    const d = [r40(L.CX + c.x - (o.x + o.w/2)), r40(L.CY + c.y - (o.y + o.h/2))];
    add(id, o, c.m || [40, 40, 40, 40], d, false);
  });
  const hb = L.harbor, s = hb.src; add('harbor', {x:s[0], y:s[1], w:s[2], h:s[3]}, [0, 0, 0, 0], [hb.dx, hb.dy], hb.flip);
  // holes: other zones' real rects that poke into this zone's cut-out area (so a neighbour never shows twice)
  V46.Z.forEach(z => { z.holes = V46.Z.filter(q => q !== z && q.o.x < z.e.x1 && q.o.x + q.o.w > z.e.x0 && q.o.y < z.e.y1 && q.o.y + q.o.h > z.e.y0).map(q => q.o); });
  V46.ready = true;
}
function v46RectN(z, r){
  if(z.flip) return {x0:r.x0 + z.d[0], x1:r.x1 + z.d[0], y0:z.d[1] - r.y1, y1:z.d[1] - r.y0};
  return {x0:r.x0 + z.d[0], x1:r.x1 + z.d[0], y0:r.y0 + z.d[1], y1:r.y1 + z.d[1]};
}
const v46In = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const v46RDist = (r, x, y) => Math.hypot(Math.max(r.x - x, 0, x - r.x - r.w), Math.max(r.y - y, 0, y - r.y - r.h));
function v46ZoneOld(x, y){
  if(v46Raw(x)) return null; let best = null, bd = 1e9;
  for(const z of V46.Z){ if(!v46In(z.e, x, y)) continue; const dd = v46RDist(z.o, x, y); if(dd < bd){ bd = dd; best = z; } }
  return best;
}
function v46ZoneNew(x, y){
  let best = null, bd = 1e9;
  for(const z of V46.Z){ if(!v46In(z.n, x, y)) continue; const r = z.nr, dd = Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1)); if(dd < bd){ bd = dd; best = z; } }
  return best;
}
const v46N = (z, x, y) => z.flip ? [x + z.d[0], z.d[1] - y] : [x + z.d[0], y + z.d[1]];
const v46O = (z, x, y) => z.flip ? [x - z.d[0], z.d[1] - y] : [x - z.d[0], y - z.d[1]];
// old point that lies in no zone (old schoolyard, old roads, forest…) → nearest zone edge, or the school gate
function v46Fallback(x, y){
  if(x < 70 && y > 330 && y < 470) return null;           // old school gate → new gate
  if(y >= 786) return V46.ZI.harbor;                      // the old sea → the harbour bay
  let best = null, bd = 1e9; for(const z of V46.Z){ if(z.flip) continue; const r = z.e, dd = Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1)); if(dd < bd){ bd = dd; best = z; } }
  if(!best || bd > 900) return null;
  return best;
}
function v46Gate(){ return [V46L.CX + V46L.GATE[0], V46L.CY + V46L.GATE[1]]; }
// old → new (zh = sticky zone id of an agent, optional)
function v46ToNew(x, y, zh){
  if(v46Raw(x)) return [x - V46E, y];
  let z = zh && V46.ZI[zh]; if(!z || !v46In(z.e, x, y)) z = v46ZoneOld(x, y);
  if(z) return v46N(z, x, y);
  const f = v46Fallback(x, y); if(!f) return v46Gate();
  if(f.flip) return v46N(f, Math.max(f.o.x + 60, Math.min(f.o.x + f.o.w - 60, x)), Math.max(900, Math.min(f.o.y + f.o.h - 60, y)));
  return v46N(f, Math.max(f.e.x0, Math.min(f.e.x1, x)), Math.max(f.e.y0, Math.min(f.e.y1, y)));
}
// new → old (or raw-encoded new when it is open land)
function v46ToOld(nx, ny){ const z = v46ZoneNew(nx, ny); return z ? v46O(z, nx, ny) : [nx + V46E, ny]; }
function v46Pos(a){ return a.v46p || v46ToNew(a.x, a.y, a._z); }
