// ================= v46 · 5/9 RENDER: vẽ đảo + dán từng khu (translate + clip) + biển phía bắc (lật dọc) =================
const V46SCHOOL = {rubik:1, chess:1, music:1, hall:1, rubikyard:1, office:1, attend:1, elec:1, field:1};
function v46TileStatics(){}
function v46OldVB(z, V){
  const n = z.n, a = Math.max(V.x0, n.x0), b = Math.min(V.x1, n.x1), c = Math.max(V.y0, n.y0), d = Math.min(V.y1, n.y1);
  if(z.flip) return {x0:a - z.d[0], x1:b - z.d[0], y0:z.d[1] - d, y1:z.d[1] - c};
  return {x0:a - z.d[0], x1:b - z.d[0], y0:c - z.d[1], y1:d - z.d[1]};
}
// static-ish part of a zone (buildings, rooms, soft corners) — cached per zone, refreshed in turns
function v46ZoneStatic(z){
  const id = z.id;
  if(V46SCHOOL[id]){ try { drawBuildings(); } catch(e){} }
  try { v20Soft(); } catch(e){} try { v20Rooms(); } catch(e){}
  if(V46SCHOOL[id]){ try { drawCameras(); } catch(e){} }
}
const V46ZC = {};
function v46ZoneCache(z, force){
  let c = V46ZC[z.id]; const e = z.e, w = Math.ceil(e.x1 - e.x0), h = Math.ceil(e.y1 - e.y0);
  if(c && !force) return c;
  if(!c){ c = V46ZC[z.id] = {cv:document.createElement('canvas'), t:0}; c.cv.width = w; c.cv.height = h; }
  const g = c.cv.getContext('2d'), prev = ctx, vb = VB; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.imageSmoothingEnabled = false;
  g.translate(-e.x0, -e.y0); g.beginPath(); g.rect(e.x0, e.y0, w, h); z.holes.forEach(o => { const x0 = Math.max(o.x, e.x0), y0 = Math.max(o.y, e.y0), x1 = Math.min(o.x + o.w, e.x1), y1 = Math.min(o.y + o.h, e.y1); if(x1 > x0 && y1 > y0) g.rect(x0, y0, x1 - x0, y1 - y0); }); g.clip('evenodd');
  ctx = g; VB = {x0:e.x0, y0:e.y0, x1:e.x1, y1:e.y1}; try { v46ZoneStatic(z); } catch(e){} ctx = prev; VB = vb; c.t = realT;
  return c;
}
// draw the content of one zone in OLD coordinates (caller has set the transform and VB)
function v46ZoneContent(z, dt, withLife){
  const id = z.id;
  if(withLife){ const c = V46ZC[z.id]; if(c){ ctx.drawImage(c.cv, z.e.x0, z.e.y0); V46.seen.push(z); } else v46ZoneStatic(z); }
  else v46ZoneStatic(z);
  if(cracks.length){ ctx.strokeStyle = '#2a1e14'; ctx.lineWidth = 3; cracks.forEach(c => { ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }); }
  if(z.o.y < 0){ try { drawNorthDyn(); } catch(e){} }
  if(z.o.x >= 2636 && z.o.y >= 0){ try { drawForestDyn(); } catch(e){} }
  if(!withLife) return;
  const sp = [], far = cam.z < .3;
  TREES.forEach((t, i) => { if(inVB(t[0], t[1])) sp.push({y:t[1], f:() => drawTree(t, i)}); });
  FOREST_TREES.forEach((t, i) => { if(inVB(t[0], t[1])) sp.push({y:t[1], f:() => t[2] === 'pine' ? drawPine(t[0], t[1], i) : drawTree(t, i)}); });
  agents.forEach(a => { if(a.visible && !a.inSub && a._z === id && !v46Raw(a.x) && inVB(a.x, a.y)) sp.push({y:a.y, f:() => drawPerson(a)}); });
  npcs.forEach(n => { if(npcShown(n) && inVB(n.x, n.y) && v46ZoneOld(n.x, n.y) === z) sp.push({y:n.y, f:() => drawNpc(n)}); });
  if(id === 'attend' && season === 'dong') sp.push({y:452, f:drawXmasTree});
  if(inVB(truck.x, truck.y)) sp.push({y:truck.y + 6, f:drawTruck});
  if(inVB(ball.x, ball.y)) sp.push({y:ball.y, f:drawBall});
  if(!far){ try { extSprites(sp); } catch(e){ console.warn('v46 sprites', e); } }
  sp.sort((p, q) => p.y - q.y); sp.forEach(s => { try { s.f(); } catch(e){} });
}
// refresh the cached zones in turns: close up ~8×/s, far away ~1×/s
function v46ZoneCaches(){
  const list = V46.seen, near = cam.z >= .8, age = near ? .12 : .9; let n = near ? 2 : 1;
  list.sort((a, b) => V46ZC[a.id].t - V46ZC[b.id].t).forEach(z => { if(n > 0 && realT - V46ZC[z.id].t > age){ n--; v46ZoneCache(z, true); } });
}
function v46ZonePass(z, VBn, dt){
  const vb = VB; ctx.save(); v46ClipZone(ctx, z, 0);
  VB = v46OldVB(z, VBn); VB.x0 -= 60; VB.x1 += 60; VB.y0 -= 90; VB.y1 += 120;
  try { if(z.flip) v46HarborPass(z, dt); else { ctx.translate(z.d[0], z.d[1]); v46ZoneContent(z, dt, true); } }
  catch(e){ console.warn('v46 zone', z.id, e); }
  VB = vb; ctx.restore();
}
// harbor: the sea floor is mirrored (top-down, so it reads fine); people, ships and the lighthouse stay upright
function v46Up(z, y, f){ ctx.save(); ctx.translate(z.d[0], z.d[1] - 2*y); try { f(); } catch(e){} ctx.restore(); }
function v46ShipX(s){ const h = V46L.harbor.src; return h[0] + 120 + ((s.x - 90)/(W - 180))*(h[2] - 240); }
function v46HarborPass(z, dt){
  const se = S(), w = WEATHERS[weather], amp = 4 + w.wind*7, h = V46L.harbor.src;
  ctx.save(); ctx.translate(z.d[0], z.d[1]); ctx.scale(1, -1);
  try { drawSeaLife(); } catch(e){} try { drawOceanExt(); } catch(e){}
  ctx.fillStyle = 'rgba(255,255,255,.75)'; for(let x = Math.max(h[0], Math.floor(VB.x0/8)*8); x < Math.min(h[0] + h[2], VB.x1); x += 8){ const y = 872 + Math.sin(x*.025 + realT*1.6)*amp*.6 + Math.sin(x*.07 - realT)*2; ctx.fillRect(x, y - 2, 8, 3); }
  ctx.fillStyle = 'rgba(255,255,255,.2)'; for(let r = 0; r < 18; r++){ const yy = 920 + r*44; if(yy < VB.y0 || yy > VB.y1) continue; for(let x = (r*40 + realT*20*(1 + w.wind)) % 80 - 80 + Math.floor(Math.max(h[0], VB.x0)/80)*80; x < Math.min(h[0] + h[2], VB.x1); x += 80) ctx.fillRect(x, yy + Math.sin(x*.05 + realT*2 + r)*amp*.5, 30, 3); }
  rect('#7a4b2a', 1298, 820, 44, 156); for(let y = 822; y < 976; y += 10) rect('#5a3418', 1298, y, 44, 2);
  rect('#4a2c16', 1296, 830, 4, 150); rect('#4a2c16', 1340, 830, 4, 150);
  ctx.restore();
  v46Up(z, 830, () => { ctx.font = "700 15px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = '#fff'; ctx.fillText('Bến tàu ngầm', 1350, 830); });
  v46Up(z, 806, () => { rect('#e8e2d0', 772, 806, 4, 26); rect('#e8e2d0', 792, 806, 4, 26); rect('#ef4b4b', 768, 800, 32, 8); rect('#ffd23f', 770, 790, 28, 10); });
  v46Up(z, 800, () => drawFlagPlaza());
  const sp = [];
  ships.forEach(s => { const sx = v46ShipX(s); if(sx > VB.x0 - 200 && sx < VB.x1 + 200 && s.y > VB.y0 - 60 && s.y < VB.y1 + 200) sp.push({y:s.y, f:() => { ctx.translate(sx - s.x, 0); drawShip(s); }}); });
  sp.push({y:sub.y, f:drawSub}); sp.push({y:LIGHTHOUSE[1], f:drawLighthouse});
  agents.forEach(a => { if(a.visible && !a.inSub && a._z === 'harbor' && !v46Raw(a.x) && inVB(a.x, a.y)) sp.push({y:a.y, f:() => drawPerson(a)}); });
  npcs.forEach(n => { if(npcShown(n) && inVB(n.x, n.y) && v46ZoneOld(n.x, n.y) === z) sp.push({y:n.y, f:() => drawNpc(n)}); });
  const ext = []; try { extSprites(ext); } catch(e){}
  ext.forEach(s => { if(s.y < 1e8 && s.y > VB.y0 - 100 && s.y < VB.y1 + 100) sp.push(s); });
  sp.sort((p, q) => q.y - p.y); sp.forEach(s => v46Up(z, s.y, s.f));
}
// agents walking on the island roads (raw new coordinates): drawn at a safe old "road" spot, then moved
function v46DrawRaw(a){
  const P = v46Pos(a), ox = a.x, oy = a.y; a.x = 1605; a.y = 400;
  ctx.save(); ctx.translate(Math.round(P[0] - 1605), Math.round(P[1] - 400)); try { drawPerson(a); } catch(e){} ctx.restore(); a.x = ox; a.y = oy;
}
function v46Shore(VBn){
  const L = V46L, C = [L.CX, L.CY], w = WEATHERS[weather], amp = 6 + w.wind*8, R0 = L.ISLAND, z = V46.ZI.harbor.n;
  const cxA = Math.max(VBn.x0, C[0] - R0 - 40), cxB = Math.min(VBn.x1, C[0] + R0 + 40); if(cxA >= cxB) return;
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for(let i = 0; i < 720; i++){ const a = i/720*Math.PI*2, x = C[0] + Math.cos(a)*R0, y = C[1] + Math.sin(a)*R0;
    if(x < VBn.x0 || x > VBn.x1 || y < VBn.y0 || y > VBn.y1 || v46In(z, x, y)) continue;
    const o = Math.sin(a*60 + realT*1.6)*amp*.5 + Math.sin(a*170 - realT)*2; ctx.fillRect(x + Math.cos(a)*o - 5, y + Math.sin(a)*o - 1, 10, 3); }
}
function v46Lighting(VBn){
  const d = lightLevel(), x0 = VBn.x0, y0 = VBn.y0, w = VBn.x1 - VBn.x0, h = VBn.y1 - VBn.y0;
  ctx.fillStyle = S().tint; ctx.fillRect(x0, y0, w, h);
  if(weather === 'nangnong'){ ctx.fillStyle = 'rgba(255,140,40,.12)'; ctx.fillRect(x0, y0, w, h); }
  if(weather === 'tuyet' || weather === 'baotuyet'){ ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0, y0, w, h); }
  if(weather === 'suongmu'){ ctx.fillStyle = 'rgba(225,230,238,.5)'; ctx.fillRect(x0, y0, w, h); }
  if(d > 0 && !v25Dark(d)){ ctx.fillStyle = `rgba(12,18,48,${d})`; ctx.fillRect(x0, y0, w, h); }
  const z = V46.ZI.harbor, beamA = Math.max(.07, d*.9, weather === 'suongmu' ? .5 : 0, isStorm() ? .35 : 0);
  if(v26Beam(beamA)){ const lx = LIGHTHOUSE[0] + z.d[0], ly = z.d[1] - LIGHTHOUSE[1] - 206; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [lhAng, lhAng + Math.PI].forEach((ang, k) => { if(k === 1 && pirate) return; const L = 1300, sp = .1, g = ctx.createRadialGradient(lx, ly, 10, lx, ly, L);
      g.addColorStop(0, `rgba(255,240,170,${beamA})`); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(ang - sp)*L, ly + Math.sin(ang - sp)*L*.55); ctx.lineTo(lx + Math.cos(ang + sp)*L, ly + Math.sin(ang + sp)*L*.55); ctx.closePath(); ctx.fill(); });
    ctx.restore(); }
  if(flash > 0){ ctx.fillStyle = `rgba(235,240,255,${flash*.22})`; ctx.fillRect(x0, y0, w, h); }
  if(fade > 0){ ctx.fillStyle = `rgba(5,8,20,${fade})`; ctx.fillRect(x0, y0, w, h); }
}
// run fn while agents/sub/ships/lighthouse hold their NEW coordinates (for code that only reads positions)
function v46WithNew(fn){
  const keep = [], hz = V46.ZI.harbor;
  agents.forEach(a => { const p = v46Pos(a); keep.push(a.x, a.y); a.x = p[0]; a.y = p[1]; });
  const sx = sub.x, sy = sub.y, lx = LIGHTHOUSE[0], ly = LIGHTHOUSE[1], shp = ships.map(s => [s.x, s.y]);
  const sp = v46N(hz, sub.x, sub.y); sub.x = sp[0]; sub.y = sp[1]; LIGHTHOUSE[0] = lx + hz.d[0]; LIGHTHOUSE[1] = hz.d[1] - ly;
  ships.forEach(s => { const p = v46N(hz, v46ShipX(s), s.y); s.x = p[0]; s.y = p[1]; });
  V46.raw = true;
  try { fn(); } finally { V46.raw = false; let i = 0; agents.forEach(a => { a.x = keep[i++]; a.y = keep[i++]; }); sub.x = sx; sub.y = sy; LIGHTHOUSE[0] = lx; LIGHTHOUSE[1] = ly; ships.forEach((s, k) => { s.x = shp[k][0]; s.y = shp[k][1]; }); }
}
function v46OverviewBuildings(g){
  const vb = VB; V46.Z.forEach(z => { if(z.flip) return; g.save(); v46ClipZone(g, z, 0); g.translate(z.d[0], z.d[1]); VB = {x0:z.e.x0, y0:z.e.y0, x1:z.e.x1, y1:z.e.y1}; try { v46ZoneContent(z, 0, false); } catch(e){} g.restore(); }); VB = vb;
  const z = V46.ZI.harbor; g.save(); g.translate(z.d[0], z.d[1]); g.scale(1, -1); g.fillStyle = '#7a4b2a'; g.fillRect(1298, 820, 44, 156); g.restore();
}
function v46View(){ return {x0:cam.x - cw/cam.z/2 - 140, x1:cam.x + cw/cam.z/2 + 140, y0:cam.y - ch/cam.z/2 - 160, y1:cam.y + ch/cam.z/2 + 180}; }
function v46Render(dt){
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#0a0f22'; ctx.fillRect(0, 0, cw, ch);
  const sh = (shake > 0 && !RM.matches) ? shake*7 : 0, ox = rnd(-sh, sh), oy = rnd(-sh, sh);
  ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z + ox)), Math.round(DPR*(ch/2 - cam.y*cam.z + oy)));
  ctx.imageSmoothingEnabled = false;
  const VBn = v46View(); VB = VBn; V46.VBn = VBn;
  v46DrawGround(VBn); v46Shore(VBn);
  const far = cam.z < .2; V46.seen = [];
  if(!far) V46.Z.filter(z => z.n.x1 > VBn.x0 && z.n.x0 < VBn.x1 && z.n.y1 > VBn.y0 && z.n.y0 < VBn.y1).sort((a, b) => a.n.y0 - b.n.y0).forEach(z => v46ZonePass(z, VBn, dt));
  VB = VBn; try { v46ZoneCaches(); } catch(e){}
  V46.Z.forEach(z => { if(!V46ZC[z.id] && !far && z.n.x1 > VBn.x0 && z.n.x0 < VBn.x1 && z.n.y1 > VBn.y0 && z.n.y0 < VBn.y1 && !z.flip && !V46.zcBuilt){ V46.zcBuilt = 1; v46ZoneCache(z); } }); V46.zcBuilt = 0;
  const raw = agents.filter(a => a.visible && !a.inSub && v46Raw(a.x)).map(a => [v46Pos(a), a]).filter(([p]) => p[0] > VBn.x0 && p[0] < VBn.x1 && p[1] > VBn.y0 && p[1] < VBn.y1);
  raw.sort((p, q) => p[0][1] - q[0][1]).forEach(([, a]) => v46DrawRaw(a));
  try { v46DrawGuide(); } catch(e){}
  try { drawParticles(dt); } catch(e){} try { drawMapClouds(); } catch(e){}
  try { v46Lighting(VBn); } catch(e){ console.warn('v46 light', e); }
  try { v46WithNew(drawLabels); } catch(e){ console.warn('v46 labels', e); }
}
