// ================= LOOP =================
const keys = {};
function frame(now){
  const dtR = Math.min(.1, (now - tPrev)/1000); tPrev = now; realT += dtR;
  SKYST = skyState(); if(!paused) updateSky(dtR);
  const p = period(clock);
  const ff = (p === 'dem' || p === 'nghi') && clock < 1080 && !students.some(s => s.visible) && !agents.some(a => a.controlled) && !concert && !festival;
  hudFF.hidden = !ff || paused || REALT.on;
  if(!paused){ simulate(rtStep(dtR, ff)); v25AfterSim(); updateHazards(dtR); updateShips(dtR); updateNpcs(dtR); updateCars(dtR); updateSea(dtR); extUpdate(dtR); }
  if(pirate){ const ta = Math.atan2((pirate.y - (LIGHTHOUSE[1]-206))/.55, pirate.x - LIGHTHOUSE[0]); lhAng += (ta - lhAng)*Math.min(1, dtR*2); }
  else lhAng += dtR * (RM.matches ? .2 : .6);
  flash = Math.max(0, flash - dtR*3); fade = Math.max(0, fade - dtR*1.2);
  const c = agents.find(a => a.controlled);
  if(c && c.v16fly && !paused){ v16FlyMove(c, dtR); }
  else if(c && c.boat && !paused && !c.flying){ boatMove(c, dtR); }
  else if(c && !paused && !c.flying && !down(c) && !c.inSub){
    const dx = (keys.right?1:0) - (keys.left?1:0), dy = (keys.down?1:0) - (keys.up?1:0);
    c.moving = !!(dx || dy);
    if(c.moving){
      const L = Math.hypot(dx,dy), sp = v35Sp(c, c.mount ? ANI[c.mount].sp : c.cycling ? bikeSpeed() : (c.bike && side(c.x) === 'E') ? 260 : 150);
      const nx = c.x + dx/L*sp*dtR, ny = c.y + dy/L*sp*dtR;
      if(canMove(c.x, c.y, nx, ny)){ c.x = nx; c.y = ny; }
      else if(canMove(c.x, c.y, nx, c.y)) c.x = nx; else if(canMove(c.x, c.y, c.x, ny)) c.y = ny;
      if(dx) c.dir = dx < 0 ? -1 : 1; c.walk += dtR*10;
    }
  } else if(c) c.moving = false;
  immTick(dtR);
  if(followCam && selected && selected.visible && !immersive){ const tx = selected.inSub ? sub.x : selected.x, ty = (selected.inSub ? sub.y : selected.y) - 20 - (selected.flying ? selected.lift : 0); cam.x += (tx - cam.x)*Math.min(1, dtR*5); cam.y += (ty - cam.y)*Math.min(1, dtR*5); clampCam(); }
  spawnParticles(paused ? 0 : dtR);
  render(paused ? 0 : dtR);
  drawConfetti(dtR);
  renderFeeds();
  renderMini();
  requestAnimationFrame(frame);
}
function canMove(ox, oy, nx, ny){
  if(!gateOK(ox, oy, nx, ny)) return false;
  if(nx < 4 || nx > W-4 || ny < NY + 20) return false;
  if(nx < 1572 && (oy >= 30) !== (ny >= 30) && Math.abs(nx - 1150) > 22) return false;
  if(ny > (onPier(nx, ny) ? 978 : 1010)) return false;
  for(const id of ['rubik','chess','music','hall','rubikyard','office','elec']){
    const r = R[id];
    if(inside(r,ox,oy) !== inside(r,nx,ny) && dist(nx, ny, r.dw[0], r.dw[1]) > 26) return false;
  }
  if((ox < 1572) !== (nx < 1572) && ny < 786 && (ny < 686 || ny > 730)) return false;
  return true;
}

