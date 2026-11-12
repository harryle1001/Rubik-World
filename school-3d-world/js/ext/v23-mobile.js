// ================= EXT28 (v23): Mobile — full-height map on phones, touch joystick + action buttons, pinch to zoom =================
const MOB = {touch:false, joy:null, pins:new Map(), pinch:null};
function mobIsTouch(){ return (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window || navigator.maxTouchPoints > 0; }
function mobControl(){ if(!agents.some(a => a.controlled)){ try { if(PLAYER && PLAYER.visible){ select(PLAYER, false); setControl(true); } else takeKeys(); } catch(e){} } }
function mobJoyInit(){
  const pad = $('#mJoy'), knob = $('#mJoyK'); if(!pad) return; let id = null, cx = 0, cy = 0;
  const set = (dx, dy) => { const R0 = pad.clientWidth/2 - 18, L = Math.hypot(dx, dy), k = L > R0 ? R0/L : 1; knob.style.transform = `translate(${dx*k}px, ${dy*k}px)`;
    const nx = dx/Math.max(R0, 1), ny = dy/Math.max(R0, 1), T = .35; keys.left = nx < -T; keys.right = nx > T; keys.up = ny < -T; keys.down = ny > T; };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; pad.setPointerCapture(id); const r = pad.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2; mobControl(); set(e.clientX - cx, e.clientY - cy); pad.classList.add('on'); });
  pad.addEventListener('pointermove', e => { if(e.pointerId !== id) return; e.preventDefault(); set(e.clientX - cx, e.clientY - cy); });
  const end = e => { if(e.pointerId !== id) return; id = null; set(0, 0); keys.left = keys.right = keys.up = keys.down = false; knob.style.transform = ''; pad.classList.remove('on'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => pad.addEventListener(ev, end));
  const B = (bid, f) => { const b = $('#' + bid); if(b) b.addEventListener('click', e => { e.preventDefault(); f(); }); };
  B('mBtnE', () => { if(!doorEnter()) toast('Đi tới gần một cánh cửa hoặc bảng sáng rồi bấm E.'); });
  B('mBtnFly', () => { try { flyToggle(); } catch(e){} });
  B('mBtnMap', () => { try { openBigMap(); } catch(e){} });
}
// two-finger pinch on the map zooms; one finger keeps dragging the camera as before
function mobPinchInit(){
  const c = cvs; const dist2 = () => { const p = [...MOB.pins.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
  c.addEventListener('pointerdown', e => { if(e.pointerType !== 'touch') return; MOB.pins.set(e.pointerId, {x:e.clientX, y:e.clientY}); if(MOB.pins.size === 2){ MOB.pinch = dist2(); e.stopImmediatePropagation(); } }, true);
  c.addEventListener('pointermove', e => { if(!MOB.pins.has(e.pointerId)) return; MOB.pins.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(MOB.pins.size === 2 && MOB.pinch){ const d = dist2(), r = c.getBoundingClientRect(), p = [...MOB.pins.values()]; if(d > 0){ zoomAt(d/MOB.pinch, (p[0].x + p[1].x)/2 - r.left, (p[0].y + p[1].y)/2 - r.top); MOB.pinch = d; } e.stopImmediatePropagation(); } }, true);
  const up = e => { MOB.pins.delete(e.pointerId); if(MOB.pins.size < 2) MOB.pinch = null; };
  ['pointerup', 'pointercancel'].forEach(ev => c.addEventListener(ev, up, true));
}
function v23Init(){
  MOB.touch = mobIsTouch(); document.body.classList.toggle('touchdev', MOB.touch);
  if(MOB.touch){ mobJoyInit(); mobPinchInit();
    try { if(localStorage.getItem('truong-mtrack-fold') === null && window.innerWidth < 900){ $('#mtrackList').hidden = true; $('#mtrackFold').textContent = '▸'; } } catch(e){} }
}

