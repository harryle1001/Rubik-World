// ================= v46 · 6/9 AGENTS: học sinh/NPC đi giữa các khu theo đường mới của đảo =================
// Trong một khu: đi như cũ (toạ độ cũ). Khi điểm kế tiếp nằm ở khu khác: đi bộ trên đường đảo (toạ độ mới) rồi vào khu đó.
function v46NormAgent(a){
  if(!a.visible){ a.v46t = null; return; }
  if(a.v16fly || a.inSub || a.v46t) return;
  if(v46Raw(a.x)){ a._z = null;
    if(a.controlled || !a.path || !a.path.length){ const x = a.x - V46E, y = a.y, z = v46ZoneNew(x, y); if(z){ const o = v46O(z, x, y); if(v46OldFree(z, o[0], o[1])){ a.x = o[0]; a.y = o[1]; a._z = z.id; } } }
    a._lx = a.x; a._ly = a.y; return; }
  let z = a._z && V46.ZI[a._z];
  if(z && v46In(z.e, a.x, a.y)){ a._lx = a.x; a._ly = a.y; return; }
  if(z && z.flip && !a.controlled && a.y > 780){ a._lx = a.x; a._ly = a.y; return; }   // swimmers/boats in the old sea stay with the harbour
  const walked = z && a._lx != null && !v46Raw(a._lx) && Math.hypot(a.x - a._lx, a.y - a._ly) < 70;
  if(walked){ const n = v46N(z, a.x, a.y), z2 = v46ZoneNew(n[0], n[1]);
    if(z2 && z2 !== z){ const o = v46O(z2, n[0], n[1]); a.x = o[0]; a.y = o[1]; a._z = z2.id; } else { a.x = n[0] + V46E; a.y = n[1]; a._z = null; } }
  else { z = v46ZoneOld(a.x, a.y); if(z) a._z = z.id; else { const p = v46ToNew(a.x, a.y); a.x = p[0] + V46E; a.y = p[1]; a._z = null; } }
  a._lx = a.x; a._ly = a.y;
}
function v46NormAll(){ if(!V46.on || V46.sky) return; agents.forEach(v46NormAgent); }
// is this old point free to stand on (not inside a walled room except at its door, not in the sea)
function v46OldFree(z, x, y){
  if(z.flip && (y > (onPier(x, y) ? 978 : 1010) || y < 790)) return false;
  for(const id of ['rubik', 'chess', 'music', 'hall', 'rubikyard', 'office', 'elec']){ const r = R[id]; if(inside(r, x, y) && dist(x, y, r.dw[0], r.dw[1]) > 26) return false; }
  return true;
}
function v46TravelStep(a, dt){
  const T = a.v46t;
  if(a.path !== T.path){ a.v46t = null; return false; }      // a new plan replaced the old one
  a.moving = false; if(down(a)) return true;
  let st = ((a.bike || (a.task || '').startsWith('Đạp xe')) ? 150 : (a.speed || 68)*1.6)*dt;
  while(st > 0 && T.i < T.P.length){ const t = T.P[T.i], x = a.x - V46E, dx = t[0] - x, dy = t[1] - a.y, d = Math.hypot(dx, dy);
    if(Math.abs(dx) > .5) a.dir = dx < 0 ? -1 : 1;
    if(d <= st){ a.x = t[0] + V46E; a.y = t[1]; st -= d; T.i++; } else { a.x += dx/d*st; a.y += dy/d*st; st = 0; } }
  a.moving = true; a.walk += dt*7; a._z = null;
  if(T.i >= T.P.length){ a.v46t = null; a.x = T.to[0]; a.y = T.to[1]; a._z = T.z; a._lx = a.x; a._ly = a.y; if(a.path === T.path && a.path.length) a.path.shift(); }
  return true;
}
function v46AgentsInit(){
  const ua0 = updateAgent;
  updateAgent = function(a, dt){
    if(!V46.on || V46.sky || !a.visible || a.inSub || a.flying || a.controlled) return ua0(a, dt);
    if(a.v46t && v46TravelStep(a, dt)) return;
    if(a.path && a.path.length){
      const za = v46Raw(a.x) ? null : (a._z || ((v46ZoneOld(a.x, a.y) || {}).id) || null), t = a.path[0], zt = v46ZoneOld(t[0], t[1]);
      if(!zt || zt.id !== za){
        // jump straight to the last stretch of the path that lies in the destination's zone (skip old roads/yards)
        const fin = a.path[a.path.length - 1], zf = v46ZoneOld(fin[0], fin[1]); let k = a.path.length - 1;
        if(zf) while(k > 0 && v46ZoneOld(a.path[k - 1][0], a.path[k - 1][1]) === zf) k--;
        const tgt = a.path[k], zk = zf;
        if(zk && za && zk.id === za){ a.path.splice(0, k); return ua0(a, dt); }
        const from = v46Pos(a), to = v46ToNew(tgt[0], tgt[1]); a.path.splice(0, k);
        a.v46t = {P:v46Route(from, to).slice(1), i:0, to:zk ? [tgt[0], tgt[1]] : [to[0] + V46E, to[1]], z:zk ? zk.id : null, path:a.path};
        if(!v46Raw(a.x)){ a.x = from[0] + V46E; a.y = from[1]; a._z = null; }
        v46TravelStep(a, dt); return;
      }
    }
    return ua0(a, dt);
  };
}
