// ================= EXT47 (v42): gentle nature sounds instead of the harsh square-wave blip (doors, the Light Teacher, menus);
// mini games are touch-only: no ▲▼◀▶ pad and no A/B buttons — swipe to move, tap / hold for A, two-finger tap for B =================
const V42 = {last:0};
// a soft wooden wind-chime (door nearby) or a water-drop pluck (everything else) — sine partials, slow attack, low volume
function v42Tone(t, f, dur, vol, out, glide){ const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); if(glide) o.frequency.exponentialRampToValueAtTime(f*glide, t + dur*.6);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .025); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .05); }
function v42Out(){ try { return v39Bus(); } catch(e){ ensureAC(); return AC.destination; } }
function v42Chime(){ try { ensureAC(); const t = AC.currentTime, out = v42Out(), pent = [1046.5, 1174.7, 1318.5, 1568, 1760]; for(let k=0;k<3;k++){ const f = pent[Math.floor(Math.random()*pent.length)]; v42Tone(t + k*.11 + Math.random()*.04, f, 1.6, .045, out); v42Tone(t + k*.11, f*2.01, .7, .012, out); } } catch(e){} }
function v42Drop(f){ try { ensureAC(); const t = AC.currentTime, out = v42Out(), base = Math.max(420, Math.min(1400, (f || 880)*.6)); v42Tone(t, base*1.5, .28, .06, out, .62); v42Tone(t + .01, base*3, .12, .015, out, .7); } catch(e){} }
blipSfx = function(f){ const now = performance.now(); if(now - V42.last < 70) return; V42.last = now; if(f === 1500) v42Chime(); else v42Drop(f); };

// ---------- mini games: gestures on the play area ----------
function v42Arcade(){
  const cv = $('#arcCv'); if(!cv) return; const DIR = ['Left', 'Right', 'Up', 'Down'], pts = new Map(); let st = null, actT = 0;
  const own = () => !!(ARC.g && typeof ARC.g.pointer === 'function' && String(ARC.g.pointer).replace(/\s/g, '') !== 'pointer(s,type,x,y){}');
  const clearDir = () => DIR.forEach(k => ARC.code[k] = false);
  cv.addEventListener('pointerdown', e => { if(!MOB.touch || own()) return; pts.set(e.pointerId, 1);
    if(pts.size === 2){ clearTimeout(actT); ARC.code.Act = false; clearDir(); st = null; ARC.code.Alt = true; setTimeout(() => { ARC.code.Alt = false; }, 160); return; }
    st = {id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now(), moved:false, held:false}; clearTimeout(actT); actT = setTimeout(() => { if(st && !st.moved){ st.held = true; ARC.code.Act = true; } }, 110); });
  cv.addEventListener('pointermove', e => { if(!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x, dy = e.clientY - st.y; if(Math.hypot(dx, dy) < 14) return;
    if(!st.moved){ st.moved = true; clearTimeout(actT); if(st.held){ ARC.code.Act = false; st.held = false; } } clearDir();
    if(Math.abs(dx) > Math.abs(dy)*.55) ARC.code[dx < 0 ? 'Left' : 'Right'] = true; if(Math.abs(dy) > Math.abs(dx)*.55) ARC.code[dy < 0 ? 'Up' : 'Down'] = true; });
  const up = e => { pts.delete(e.pointerId); if(!st || e.pointerId !== st.id) return; clearTimeout(actT);
    if(!st.moved && !st.held){ ARC.code.Act = true; setTimeout(() => { ARC.code.Act = false; }, 130); } else if(st.held) ARC.code.Act = false; clearDir(); st = null; };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, up));
  cv.style.touchAction = 'none';
}
function v42Init(){
  v42Arcade();
  try { if(typeof MGH !== 'undefined' && MGH){ MGH.mArcade = Object.assign({}, MGH.mArcade || {}, {name:(MGH.mArcade && MGH.mArcade.name) || 'Trò chơi', touch:[['👆', 'Vuốt: di chuyển'], ['👇', 'Chạm: nhảy / sút'], ['✋', 'Giữ: lấy lực'], ['✌️', '2 ngón: chiêu B']], steps:[]}); } } catch(e){}
  const h = $('#mArcade .legend'); if(h) h.dataset.touch = 'Vuốt để di chuyển · Chạm để nhảy/sút · Giữ để lấy lực · Chạm 2 ngón = chiêu B';
}
