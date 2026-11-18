// ================= v60t · GÓC NHÌN THỨ 3 SAU LƯNG 2/2: nút 🎥 / phím V, điều khiển vuốt (lên = đi tới, trái/phải = quay, xuống = lùi chậm), chạm cửa, tự về góc trên xuống =================
// Lựa chọn lưu ở 'truong-v60t-view' ('tps' | 'top'). Khi vào mini game / cửa sổ, thuyền, máy bay, khinh khí cầu, hành tinh v56p… tự vẽ góc trên xuống; thoát ra thì trở lại.
const V60T = {on:false, act:false, hdg:-Math.PI/2, ch:-Math.PI/2, k:{up:false, down:false, left:false, right:false}, px:null, py:null, dn:null, ms:null, turn:0, fw:0, mv:false, walk:0, lp:null, why:''};
const V60T_KEY = 'truong-v60t-view';

// có vẽ góc sau lưng ở khung hình này không (lựa chọn bật + không bị chặn)
function v60tWhy(){
  const P = typeof PLAYER !== 'undefined' ? PLAYER : null;
  if(typeof V46 === 'undefined' || !V46.on) return 'v46';
  if(V46.sky) return 'balloon';
  if(!P || !P.visible) return 'player';
  if(P.boat) return 'boat'; if(P.v16fly || P.flying) return 'fly'; if(P.inSub) return 'sub'; if(P.mount) return 'mount';
  if(typeof openModal !== 'undefined' && openModal) return 'modal';
  if(typeof V50 !== 'undefined' && V50.open) return 'magic';
  if(typeof V51P !== 'undefined' && V51P.on) return 'plane';
  if(typeof V53C !== 'undefined' && V53C.mode) return 'car';
  if(typeof V52LD !== 'undefined' && V52LD.on) return 'drone';
  try { if(typeof v56pActive === 'function' && v56pActive()) return 'planet'; } catch(e){}
  if(typeof immersive !== 'undefined' && immersive) return 'immersive';
  if(document.body.classList.contains('v52wScene') || document.querySelector('.mgFull:not([hidden])')) return 'scene';
  return '';
}
function v60tCan(){ if(!V60T.on) return false; V60T.why = v60tWhy(); return !V60T.why; }

// ---------- bật / tắt ----------
function v60tSet(on, quiet){
  V60T.on = !!on; try { localStorage.setItem(V60T_KEY, V60T.on ? 'tps' : 'top'); } catch(e){}
  if(V60T.on){ const P = PLAYER; let h = -Math.PI/2; if(P && (Math.abs(P._gx || 0) + Math.abs(P._gy || 0) > 5)) h = Math.atan2(P._gy, P._gx); V60T.hdg = V60T.ch = h; V60T.lp = null; }
  v60tBtn();
  if(!quiet){ const why = v60tWhy(); toast(V60T.on ? (why ? '🎥 Góc sau lưng sẽ bật khi bạn đi bộ hoặc đạp xe trên đảo.' : '🎥 Góc sau lưng · vuốt lên để đi tới, trái/phải để quay, xuống để lùi') : '🗺️ Góc nhìn từ trên xuống'); }
}
function v60tBtn(){
  const col = document.getElementById('v41Col'); if(!col) return; let b = document.getElementById('v60tView');
  if(!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'v60tView'; b.className = 'v41b'; b.innerHTML = '<span class="ic" aria-hidden="true"></span><small></small>';
    b.addEventListener('click', e => { e.stopPropagation(); v60tSet(!V60T.on); b.blur(); });
    const ref = document.getElementById('v51pBtn') || null; col.insertBefore(b, ref); }
  const ic = V60T.on ? '🗺️' : '🎥', lb = V60T.on ? 'Trên' : 'Sau lưng';
  if(b.firstChild.textContent !== ic){ b.firstChild.textContent = ic; b.lastChild.textContent = lb; }
  b.setAttribute('aria-label', V60T.on ? 'Đổi sang góc nhìn từ trên xuống (phím V)' : 'Đổi sang góc nhìn sau lưng nhân vật (phím V)'); b.setAttribute('aria-pressed', V60T.on ? 'true' : 'false'); b.classList.toggle('on', V60T.on);
}

// ---------- di chuyển ở góc sau lưng: phím / vuốt → đi tới, quay, lùi ----------
function v60tStick(){
  // vuốt (điện thoại, v34) hoặc kéo chuột (máy tính): cần analog, mốc của v34 bám theo ngón tay ở bán kính 70px
  const dz = v => { v = Math.max(-1, Math.min(1, v)); return Math.abs(v) < .24 ? 0 : (v - Math.sign(v)*.24)/.76; };
  if(typeof SW !== 'undefined' && SW.on && SW.id !== null && V60T.px != null) return [dz((V60T.px - SW.x0)/70), dz(-(V60T.py - SW.y0)/70)];
  const m = V60T.ms; if(m && m.on) return [dz((m.x - m.x0)/70), dz(-(m.y - m.y0)/70)];
  return null;
}
function v60tMove(dt){
  const c = typeof agents !== 'undefined' ? agents.find(a => a.controlled) : null, P = PLAYER, K = V60T.k; if(!P) return;
  let turn = (K.right ? 1 : 0) - (K.left ? 1 : 0), fw = (K.up ? 1 : 0) - (K.down ? 1 : 0); const st = v60tStick(); if(st){ turn = st[0]; fw = st[1]; }
  V60T.turn += (turn - V60T.turn)*Math.min(1, dt*10); V60T.fw = fw;
  if(c === P && !paused && !down(P)){
    if(turn) V60T.hdg += turn*dt*(fw < 0 ? 1.6 : 2.4);
    if(fw){ const back = fw < 0; let base = 150; try { base = P.cycling ? bikeSpeed() : (P.bike && side(P.x) === 'E') ? 260 : 150; } catch(e){}
      const sp = v35Sp(P, base)*(back ? .42 : 1)*Math.min(1, Math.abs(fw)*1.15), sg = back ? -1 : 1; let ux = Math.cos(V60T.hdg)*sg, uy = Math.sin(V60T.hdg)*sg;
      if(!v46Raw(P.x)){ const z = V46.ZI[P._z]; if(z && z.flip) uy = -uy; }
      const nx = P.x + ux*sp*dt, ny = P.y + uy*sp*dt;
      if(canMove(P.x, P.y, nx, ny)){ P.x = nx; P.y = ny; } else if(canMove(P.x, P.y, nx, P.y)) P.x = nx; else if(canMove(P.x, P.y, P.x, ny)) P.y = ny;
      P.moving = true; P.walk = (P.walk || 0) + dt*(back ? 7 : 10); if(Math.abs(ux) > .2) P.dir = ux < 0 ? -1 : 1; }
    P._gx = P._gy = 0;
  }
  // tự đi (chạm cửa / bản đồ): hướng nhìn quay theo hướng nhân vật đang đi
  const pp = v46Pos(P); if(V60T.lp && !fw && !turn){ const dx = pp[0] - V60T.lp[0], dy = pp[1] - V60T.lp[1]; if(dx*dx + dy*dy > .25 && dx*dx + dy*dy < 2500){ let d = Math.atan2(dy, dx) - V60T.hdg; d = Math.atan2(Math.sin(d), Math.cos(d)); V60T.hdg += d*Math.min(1, dt*4); } }
  V60T.lp = pp; V60T.mv = !!P.moving; if(P.moving) V60T.walk = P.walk || 0;
}
// ---------- chạm: chỉ mở cửa / điểm mini game ở gần (không chạm-để-đi lên đất) ----------
function v60tTap(cx, cy){
  const P = PLAYER; if(!P || !P.visible){ try { openLogin(); } catch(e){} return; } if(down(P)){ try { v25StandUp(P); } catch(e){} return; }
  const r = cvs.getBoundingClientRect(), x = cx - r.left, y = cy - r.top; let best = null, bd = 56;
  for(const [d, sx, sy] of V60T_M.doors){ const dd = Math.hypot(sx - x, sy - y); if(dd < bd){ bd = dd; best = d; } }
  if(!best) return;
  if(Math.hypot(best.x - P.x, best.y - P.y) < 46){ try { best.f(); } catch(e){} return; }
  try { if(typeof v58tGo === 'function'){ V32.door = best; v58tGo(best.x, best.y, () => { V32.door = null; try { best.f(); } catch(e){} }); } else v32Nav(best.x, best.y, best.n, true, () => { try { best.f(); } catch(e){} }); } catch(e){}
}

// ---------- init ----------
function v60tInit(){
  if(typeof V46 === 'undefined' || typeof v57pSkyImg !== 'function') return;
  try { V60T.on = localStorage.getItem(V60T_KEY) === 'tps'; } catch(e){}
  v60tBtn(); setInterval(() => { try { v60tBtn(); } catch(e){} }, 1500);
  // phím V (máy bay đã có V riêng của v57p)
  addEventListener('keydown', e => { if(e.code !== 'KeyV' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; if(typeof V51P !== 'undefined' && V51P.on) return; if(typeof openModal !== 'undefined' && openModal) return;
    const t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; v60tSet(!V60T.on); e.preventDefault(); }, true);
  // phím/vuốt: giữ trạng thái thật trong V60T.k, xoá keys trong lúc vòng lặp gốc di chuyển (để nó không đi theo hướng màn hình)
  const eu0 = extUpdate; extUpdate = function(dtR){ const on = V60T.act, K = V60T.k; if(on){ K.up = !!keys.up; K.down = !!keys.down; K.left = !!keys.left; K.right = !!keys.right; }
    const r = eu0(dtR); if(on && V60T.act){ keys.up = keys.down = keys.left = keys.right = false; V60T.hold = true; } return r; };
  const it0 = immTick; immTick = function(dtR){ const r = it0(dtR);
    if(V60T.hold){ V60T.hold = false; const K = V60T.k; keys.up = K.up; keys.down = K.down; keys.left = K.left; keys.right = K.right; if(V60T.act) try { v60tMove(Math.min(.1, dtR || 0)); } catch(e){ console.warn('v60t move', e); } }
    return r; };
  // vuốt: đọc vị trí ngón tay trước v34 (capture ở window chạy trước canvas)
  addEventListener('pointermove', e => { if(typeof SW !== 'undefined' && e.pointerId === SW.id){ V60T.px = e.clientX; V60T.py = e.clientY; } const m = V60T.ms; if(m && e.pointerId === m.id){ m.x = e.clientX; m.y = e.clientY; if(!m.on && Math.hypot(m.x - m.x0, m.y - m.y0) > 8){ m.on = true; try { cancelAuto(); } catch(er){} try { if(!PLAYER.controlled) takeKeys(); } catch(er){} } } }, true);
  addEventListener('pointerdown', e => { if(!V60T.act || e.target !== cvs) return; V60T.dn = [e.clientX, e.clientY, performance.now(), e.pointerId]; V60T.px = e.clientX; V60T.py = e.clientY;
    if(e.pointerType === 'mouse' && e.button === 0){ V60T.ms = {id:e.pointerId, x0:e.clientX, y0:e.clientY, x:e.clientX, y:e.clientY, on:false}; e.stopImmediatePropagation(); } }, true);
  const up = e => { const m = V60T.ms; if(m && e.pointerId === m.id) V60T.ms = null;
    if(!V60T.act || e.target !== cvs){ V60T.dn = null; return; } const d = V60T.dn; V60T.dn = null; if(!d || d[3] !== e.pointerId) return;
    const tap = e.type === 'pointerup' && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 12 && performance.now() - d[2] < 350;
    if(m && !tap){ e.stopImmediatePropagation(); return; }
    if(!tap) return;   // vuốt: để v34 dừng như cũ
    e.stopImmediatePropagation(); try { if(typeof SW !== 'undefined' && SW.id === e.pointerId){ SW.id = null; SW.on = false; const ind = document.getElementById('v34Swipe'); if(ind) ind.hidden = true; } } catch(er){}
    try { if(typeof drag !== 'undefined') drag = null; } catch(er){} cvs.classList.remove('dragging'); v60tTap(e.clientX, e.clientY); };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  addEventListener('click', e => { if(V60T.act && e.target === cvs) e.stopImmediatePropagation(); }, true);
  // khung hình
  const r0 = render; render = function(dt){
    const a = v60tCan();
    if(a !== V60T.act){ V60T.act = a; document.body.classList.toggle('v60tTps', a); if(a){ V60T.ch = V60T.hdg; V60T.lp = null; } else { try { followCam = true; const P = PLAYER; if(P && P.visible && !V46.sky){ const p = v46CamT(P); cam.x = p[0]; cam.y = p[1] - 20; clampCam(); } } catch(e){} } }
    if(!a) return r0(dt);
    try { VB = V46.VBn = v46View(); v60tFrame(dt); }
    catch(e){ console.warn('v60t view', e); V60T.on = false; V60T.act = false; document.body.classList.remove('v60tTps'); v60tBtn(); return r0(dt); }
  };
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v60t = {V60T, V60T_M, v60tSet, v60tWhy};
}
