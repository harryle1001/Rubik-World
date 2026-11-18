// ================= v46 · 7/9 PLAYER & CAMERA: kéo để đi, vào/ra khu, bay khinh khí cầu, thuyền =================
// hooks used by the small edits in weather-sim-camera.js and loop.js
function v46TS(x, y){ return (!V46 || !V46.on || V46.sky || V46.raw) ? [x, y] : v46ToNew(x, y); }
function v46TW(x, y){ return (!V46 || !V46.on || V46.sky) ? [x, y] : v46ToOld(x, y); }
function v46CamOld(){ if(!V46 || !V46.on || V46.sky) return [cam.x, cam.y]; const p = v46ToOld(cam.x, cam.y); return v46Raw(p[0]) ? [p[0], 400] : p; }
function v46CamT(a){ if(a.inSub) return v46TS(sub.x, sub.y); if(!V46 || !V46.on || V46.sky) return [a.x, a.y]; return v46Pos(a); }
function v46OldMove(z, ox, oy, nx, ny){
  if(!gateOK(ox, oy, nx, ny)) return false;
  if(z.flip && ny > (onPier(nx, ny) ? 978 : 1010)) return false;
  for(const id of ['rubik', 'chess', 'music', 'hall', 'rubikyard', 'office', 'elec']){ const r = R[id]; if(V46.ZI[id] && V46.ZI[id] !== z) continue; /* v62f: phòng của khu khác đã dời đi chỗ khác trên đảo → không còn là tường vô hình ở mép khu này */ if(inside(r, ox, oy) !== inside(r, nx, ny) && dist(nx, ny, r.dw[0], r.dw[1]) > 26) return false; }
  return true;
}
function v46PlayerInit(){
  const cm0 = canMove;
  canMove = function(ox, oy, nx, ny){
    if(!V46.on || V46.sky) return cm0(ox, oy, nx, ny);
    if(v46Raw(ox)){ const x = nx - V46E, y = ny; if(!v46Walk(x, y)) return false; const z = v46ZoneNew(x, y); if(z){ const o = v46O(z, x, y); return v46OldFree(z, o[0], o[1]); } return true; }
    const c = agents.find(a => a.controlled), z = (c && c._z && V46.ZI[c._z] && v46In(V46.ZI[c._z].e, ox, oy)) ? V46.ZI[c._z] : v46ZoneOld(ox, oy);
    if(!z) return cm0(ox, oy, nx, ny);
    if(v46In(z.e, nx, ny)) return v46OldMove(z, ox, oy, nx, ny);
    if(!v46OldMove(z, ox, oy, nx, ny)) return false;
    const n = v46N(z, nx, ny); if(!v46Walk(n[0], n[1])) return false;
    const z2 = v46ZoneNew(n[0], n[1]); if(z2 && z2 !== z){ const o = v46O(z2, n[0], n[1]); return v46OldFree(z2, o[0], o[1]); }
    return true;
  };
  // the harbour is mirrored: flip the controls there so "drag up" still goes up on screen
  let swapped = 0; const swap = c => { if(c.boat){ const t = keys.left; keys.left = keys.right; keys.right = t; } else { const t = keys.up; keys.up = keys.down; keys.down = t; } };
  const eu0 = extUpdate; extUpdate = function(dtR){ eu0(dtR); const c = agents.find(a => a.controlled); swapped = 0; if(V46.on && !V46.sky && c && c._z === 'harbor' && !c.v16fly){ swap(c); swapped = c; } };
  const it0 = immTick; immTick = function(dtR){ if(swapped){ swap(swapped); swapped = 0; } v46NormAll(); return it0(dtR); };
  // the camera lives on the island
  const cc0 = clampCam; clampCam = function(){
    if(!V46.on) return cc0(); if(V46.sky){ cc0(); cam.y = Math.min(cam.y, NY - ch/cam.z/2); return; }
    const L = V46L; cam.z = Math.max(Math.min(cw/L.W, ch/L.H)*.95, Math.min(3, cam.z)); const vw = cw/cam.z, vh = ch/cam.z;
    cam.x = vw >= L.W ? L.W/2 : Math.max(vw/2, Math.min(L.W - vw/2, cam.x)); cam.y = vh >= L.H ? L.H/2 : Math.max(vh/2, Math.min(L.H - vh/2, cam.y)); };
  const sel0 = select; select = function(a, focus){ const r = sel0.apply(this, arguments); if(V46.on && !V46.sky && focus && a && a.visible && !followCam){ const p = v46CamT(a); cam.x = p[0]; cam.y = p[1]; clampCam(); } return r; };
  const go0 = goTo; goTo = function(x, y, z){ const p = v46TS(x, y); return go0(p[0], p[1], z); };
  const la0 = locateAgent; locateAgent = function(a, q){ const r = la0(a, q); if(V46.on && !V46.sky){ const p = v46CamT(a); cam.x = p[0]; cam.y = p[1] - 20; clampCam(); } return r; };
  // a player who was standing in the old world starts again at the school gate of the island
  const eg0 = enterGame; enterGame = function(first){ const r = eg0(first); if(V46.on && PLAYER){ const G = v46Gate(); PLAYER.x = G[0] + V46E + (Math.random()*40 - 20); PLAYER.y = G[1] + 40; PLAYER._z = null; PLAYER.v46t = null; const p = v46Pos(PLAYER); cam.x = p[0]; cam.y = p[1]; clampCam(); } return r; };
  const sp0 = spawn; spawn = function(a){ sp0(a); if(V46.on){ const G = v46Gate(); a.x = G[0] + V46E + (Math.random()*60 - 30); a.y = G[1] + 30 + Math.random()*20; a._z = null; a.v46t = null; } };
  // balloon: take off only from the balloon field; flying happens in the sky above (old sky world)
  const ft0 = flyToggle; flyToggle = function(){
    const P = PLAYER; if(!V46.on || !P || !P.visible || P.v16fly) return ft0();
    if(P._z !== 'bpad'){ const now = performance.now(); if(now - (V46.flyMsg || 0) > 4000){ V46.flyMsg = now; toast('🎈 Khinh khí cầu chỉ cất cánh ở Khu khinh khí cầu. Đường vàng sẽ chỉ bạn tới đó!'); const b = R.bpad; try { setGuide(b.x + b.w/2, b.y + b.h - 18, b.name); } catch(e){} } return; }
    ft0(); if(P.v16fly) v46Sky(true);
  };
  flyLand = function(){ const P = PLAYER; if(!P) return; P.v16fly = false; P.glide = false; const b = R.bpad; P.x = b.x + b.w/2; P.y = b.y + b.h - 30; P._z = 'bpad'; P._lx = P.x; P._ly = P.y;
    toast('🪂 Hạ cánh an toàn ở Khu khinh khí cầu!'); try { flyBtn(); } catch(e){} SKY.layer = null; v46Sky(false); };
  const fm0 = v16FlyMove; v16FlyMove = function(c, dt){ if(V46.on && c.glide){ flyLand(); return; } fm0(c, dt); if(V46.on) c.y = Math.min(c.y, NY - 700); };
  // boats stay inside the harbour bay
  const bz0 = boatZoneOK; boatZoneOK = function(c, ny){ if(!V46.on) return bz0(c, ny); const h = V46L.harbor.src; return bz0(c, ny) && c.x > h[0] + 30 && c.x < h[0] + h[2] - 30 && ny < h[1] + h[3] - 30; };
  // boats leave from the harbour (north shore) only
  const bb0 = boardBoat; boardBoat = function(){ const c = agents.find(a => a.controlled) || PLAYER;
    if(V46.on && !V46.sky && c && !c.boat && c._z !== 'harbor'){ toast('⛵ Thuyền ở Bến tàu phía bắc đảo. Đường vàng sẽ chỉ bạn tới đó!'); try { setGuide(1380, 840, 'Bến tàu'); } catch(e){} return; }
    const r = bb0(); if(V46.on && c && c.boat){ const h = V46L.harbor.src; c.x = Math.max(h[0] + 60, Math.min(h[0] + h[2] - 60, c.x)); } return r; };
  const md = DESTS.find(d => d[0] === 'marina'); if(md){ md[2] = 1380; md[3] = 840; }
  // on the island roads (new coordinates) the old "region by y" rules must not fire (beach, boat at the shore…)
  const ra0 = regionAt; regionAt = function(x, y){ return v46Raw(x) ? 'road' : ra0(x, y); };
  const ow0 = openWorldTick; openWorldTick = function(dt){ const c = agents.find(a => a.controlled); if(V46.on && c && v46Raw(c.x)){ const y = c.y; c.y = 500; try { ow0(dt); } finally { if(c.y === 500) c.y = y; } return; } return ow0(dt); };
  const sky0 = $('#skyBtn'); if(sky0) sky0.onclick = () => flyToggle();
}
function v46Sky(on){
  if(on === V46.sky) return; const P = PLAYER;
  if(on){ V46.camN = {x:cam.x, y:cam.y, z:cam.z}; V46.sky = true; P.y = Math.min(P.y, NY - 900); cam.x = P.x; cam.y = P.y; clampCam(); }
  else { V46.sky = false; const p = v46Pos(P); cam.x = p[0]; cam.y = p[1]; if(V46.camN) cam.z = V46.camN.z; clampCam(); }
}
