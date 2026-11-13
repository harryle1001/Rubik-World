// ================= EXT39 (v34): swipe to move on phones — no joystick; drag anywhere on the map in the direction to walk =================
const SW = {id:null, x0:0, y0:0, on:false};
function v34SwipeInit(){
  const ind = document.createElement('div'); ind.id = 'v34Swipe'; ind.hidden = true; ind.innerHTML = '<i></i>'; stage.appendChild(ind);
  const stop = () => { if(SW.on){ keys.left = keys.right = keys.up = keys.down = false; } SW.id = null; SW.on = false; ind.hidden = true; };
  cvs.addEventListener('pointerdown', e => { if(e.pointerType === 'mouse' || !V32.phone) return; if(SW.id !== null){ stop(); return; } // second finger: let pinch-zoom take over
    SW.id = e.pointerId; SW.x0 = e.clientX; SW.y0 = e.clientY; SW.on = false; }, true);
  cvs.addEventListener('pointermove', e => { if(e.pointerId !== SW.id || MOB.pins.size > 1) return; const dx = e.clientX - SW.x0, dy = e.clientY - SW.y0, L = Math.hypot(dx, dy);
    if(!SW.on){ if(L < 14) return; if(!PLAYER || !PLAYER.visible || down(PLAYER)) return; SW.on = true; try { cancelAuto(); } catch(err){} mobControl(); followCam = true; if(V32.nav && V32.walk){ V32.walk = null; } }
    e.stopImmediatePropagation(); e.preventDefault(); // the swipe drives the character instead of panning the camera
    if(L > 70){ SW.x0 = e.clientX - dx/L*70; SW.y0 = e.clientY - dy/L*70; } // the anchor follows the finger so turning feels instant
    const nx = dx/L, ny = dy/L, T = .38; keys.left = nx < -T; keys.right = nx > T; keys.up = ny < -T; keys.down = ny > T;
    const sr = stage.getBoundingClientRect(); ind.hidden = false; ind.style.left = (SW.x0 - sr.left) + 'px'; ind.style.top = (SW.y0 - sr.top) + 'px'; ind.firstChild.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`; }, true);
  ['pointerup', 'pointercancel'].forEach(ev => cvs.addEventListener(ev, e => { if(e.pointerId === SW.id) stop(); }, true));
  window.addEventListener('blur', stop);
}
function v34Init(){ v34SwipeInit(); }
