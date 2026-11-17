// ================= v46 · 9/9 INIT: bật thế giới tròn (gọi từ main.js) =================
function v46Init(){
  v46Build(); v46Roads(); v46Deco(); V46.on = true;
  v46AgentsInit(); v46PlayerInit(); v46MapsInit();
  const r0 = render;
  render = function(dt){
    if(!V46.on) return r0(dt);
    const fly = !!(PLAYER && PLAYER.v16fly); if(fly !== V46.sky) v46Sky(fly);
    if(V46.sky) return r0(dt);
    if(typeof v39Covered === 'function' && v39Covered()) return;
    v46Render(dt);
  };
  // night lights: positions are pushed in old coordinates → put them on the island
  const vp0 = v25Push; v25Push = function(x, y, r, a, k){ if(!V46.on || V46.sky || V46.raw) return vp0(x, y, r, a, k); if(!v46Raw(x) && !v46ZoneOld(x, y)) return; const p = v46ToNew(x, y); return vp0(p[0], p[1], r, a, k); };
  const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(!V46.on || V46.sky || !V46T.lamps) return; const on = v25Ramp(clock, 1080, 330), V = V46.VBn || VB; if(on <= 0) return;
    for(const [x, y] of V46T.lamps){ if(x > V.x0 - 150 && x < V.x1 + 150 && y > V.y0 - 150 && y < V.y1 + 150) vp0(x, y - 44, 110, on, 2); } };
  ['v25Lanterns', 'v25BikeLights'].forEach(n => { const f = n === 'v25Lanterns' ? v25Lanterns : v25BikeLights, w = function(){ if(!V46.on || V46.sky) return f.apply(this, arguments); return v46WithNew(() => f.apply(this, arguments)); };
    if(n === 'v25Lanterns') v25Lanterns = w; else v25BikeLights = w; });
  const fl0 = v25FleetLights; v25FleetLights = function(dk){ if(!V46.on || V46.sky) return fl0(dk); };
  // everyone already in the world gets a place on the island
  agents.forEach(a => { a._lx = null; v46NormAgent(a); });
  if(PLAYER && PLAYER.visible){ const G = v46Gate(); PLAYER.x = G[0] + V46E; PLAYER.y = G[1] + 40; PLAYER._z = null; }
  const p = PLAYER && PLAYER.visible ? v46Pos(PLAYER) : v46Gate(); cam.x = p[0]; cam.y = p[1]; clampCam();
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v46 = {V46, V46L, V46R, V46T, v46ToNew, v46ToOld, v46Pos, agents:() => agents, player:() => PLAYER, cam};
}
