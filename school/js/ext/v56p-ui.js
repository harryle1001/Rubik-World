// ================= v56p · 2/2 ĐIỀU KHIỂN: chụm/cuộn để ra hành tinh, chạm để bay tới, nút 🌍 và 🧍, khinh khí cầu nhìn từ trên cao =================
function v56pActive(){ return V46.on && !V46.sky && V56P.t > .35 && !openModal; }
// camera bay mượt (zoom theo log để cảm giác đều)
function v56pFlyTo(x, y, z, dur, end){
  try { cancelAuto(); } catch(e){}
  followCam = false; V56P.flown = true; V56P.fly = {x0:cam.x, y0:cam.y, z0:cam.z, x1:x, y1:y, z1:z, t:0, dur:dur || 1.3, end:end || null};
}
function v56pTick(dt){
  const F = V56P.fly; if(F){ F.t += Math.min(.05, dt || .016); const k = v56pSm(0, 1, F.t/F.dur);
    cam.z = Math.exp(Math.log(F.z0) + (Math.log(F.z1) - Math.log(F.z0))*k); cam.x = F.x0 + (F.x1 - F.x0)*k; cam.y = F.y0 + (F.y1 - F.y0)*k; clampCam();
    if(F.t >= F.dur){ V56P.fly = null; if(F.end === 'player' && PLAYER && PLAYER.visible){ try { if(!PLAYER.controlled) setControl(true); selected = PLAYER; } catch(e){} followCam = true; V56P.flown = false; } } }
  if(followCam) V56P.flown = false;
  const sk = V46.on && V46.sky && PLAYER && PLAYER.v16fly; if(!sk) V56P.skT = 0; V56P.sk += (V56P.skT - V56P.sk)*Math.min(1, (dt || .016)*2.4); if(V56P.sk < .002) V56P.sk = 0;
  if(sk && PLAYER.y < -2700 && !V56P.hint.sky){ V56P.hint.sky = 1; toast('🌍 Bay cao rồi! Bấm Hành tinh hoặc chụm 2 ngón để thấy cả biển lẫn trời.'); }
  const B = V56P.back; if(B){ const show = V46.on && !V46.sky && !!PLAYER && PLAYER.visible && (V56P.t > .3 || (V56P.flown && !followCam)); if(B.hidden === show) B.hidden = !show; }
  const P = V56P.btn; if(P){ const on = V56P.t > .5 || V56P.sk > .5; if(P.classList.contains('on') !== on) P.classList.toggle('on', on); }
}
function v56pToggle(){
  if(!V46.on) return; v56pCheck();
  if(V46.sky){ V56P.skT = V56P.skT > .5 ? 0 : 1; return; }
  if(v56pBlend(cam.z) > .5){ v56pBack(); return; }
  v56pFlyTo(V46L.CX, V46L.CY, v56pZFit()*.88, 1.6);
  if(!V56P.hint.tap){ V56P.hint.tap = 1; setTimeout(() => toast('🌍 Chạm vào một nơi trên hành tinh để bay tới đó.'), 1700); }
}
function v56pBack(){
  if(!PLAYER || !PLAYER.visible){ try { backToPlayer(); } catch(e){} return; }
  const p = v46Pos(PLAYER); v56pFlyTo(p[0], p[1] - 20, Math.max(.9, Math.min(1.4, V56P.z0 || .9)), 1.3, 'player');
}
// chạm vào hành tinh → bay tới chỗ đó
function v56pTap(sx, sy){
  const v = V56P.view || cam, wx = v.x + (sx - cw/2)/cam.z, wy = v.y + (sy - ch/2)/cam.z, L = V46L;
  if(Math.hypot(wx - L.CX, wy - L.CY) > V56P.Rp*.98){ toast('🌌 Đó là vũ trụ. Chạm vào mặt đất hoặc biển nhé!'); return; }
  v56pFlyTo(wx, wy, .55, 1.5);
}
// ---------- khinh khí cầu: nhìn xuống hành tinh từ trên cao ----------
function v56pSkyDraw(){
  const k0 = V56P.sk; if(k0 <= 0 || !PLAYER) return; v56pCheck();
  const L = V46L, P = PLAYER, Rp = V56P.Rp, alt = Math.max(0, Math.min(1, (NY - P.y)/(NY - Y0))), m = Math.min(cw, ch)/2, rs = m*(2.5 - 1.88*Math.sqrt(alt)), k = rs/Rp;
  const b = R.bpad, bx = b.x + b.w/2, bp = v46ToNew(bx, b.y + b.h/2); let gx = bp[0] + (P.x - bx)*.9, gy = bp[1] + Math.sin(realT*.05)*40;
  const d = Math.hypot(gx - L.CX, gy - L.CY), dm = Rp*.86; if(d > dm){ gx = L.CX + (gx - L.CX)*dm/d; gy = L.CY + (gy - L.CY)*dm/d; }
  const cx = cw/2 - (gx - L.CX)*k, cy = ch/2 - (gy - L.CY)*k, C = ctx;
  if(k0 > .98) v56pSpaceBg(1); else { C.save(); C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = k0; C.drawImage(v56pStarCache(), 0, 0, cw, ch); C.restore(); }
  C.save(); C.globalAlpha = k0; C.setTransform(DPR, 0, 0, DPR, 0, 0); C.beginPath(); C.arc(cx, cy, rs, 0, Math.PI*2); C.clip();
  C.fillStyle = S().sea2; C.fillRect(0, 0, cw, ch);
  C.setTransform(DPR*k, 0, 0, DPR*k, DPR*(cx - L.CX*k), DPR*(cy - L.CY*k)); C.imageSmoothingEnabled = false;
  try { const ov = v46Overview(); C.drawImage(ov, 0, 0, ov.width, ov.height, 0, 0, L.W, L.H); } catch(e){}
  C.globalAlpha = k0; v56pSeaPass(k0);
  C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = k0; const dk = lightLevel(); if(dk > 0){ C.fillStyle = `rgba(12,18,48,${dk})`; C.fillRect(0, 0, cw, ch); }
  C.restore();
  v56pSpace(cx, cy, rs, k0, true);
  // các tầng theo độ cao (vẽ từ thấp lên cao): chim · khinh khí cầu · mây · máy bay
  const ba = NY - P.y, L2 = [[420, () => v56pBirds(cx, cy, rs, k0)], [1500, () => { ctx.save(); v56pCloudRing(cx, cy, rs, k0, 0, 1e9); ctx.restore(); }], [3000, () => v56pPlanes(cx, cy, rs, k0)], [ba, () => v56pBalloon(alt, k0)]];
  L2.sort((p, q) => p[0] - q[0]).forEach(([, f]) => { try { f(); } catch(e){} });
}
function v56pBalloon(alt, a){
  const C = ctx, x = cw/2, y = ch/2, r = 24 - 13*alt, cols = ['#ef4b4b', '#ffd23f']; C.save(); C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = a;
  C.fillStyle = 'rgba(0,0,0,.22)'; C.beginPath(); C.ellipse(x + 10 + alt*26, y + 8 + alt*16, r*.8, r*.6, 0, 0, Math.PI*2); C.fill();
  for(let i = 0; i < 8; i++){ C.fillStyle = cols[i % 2]; C.beginPath(); C.moveTo(x, y); C.arc(x, y, r, i*Math.PI/4 + realT*.2, (i + 1)*Math.PI/4 + realT*.2); C.closePath(); C.fill(); }
  C.strokeStyle = '#1d2238'; C.lineWidth = 2; C.beginPath(); C.arc(x, y, r, 0, Math.PI*2); C.stroke();
  C.fillStyle = 'rgba(255,255,255,.5)'; C.beginPath(); C.arc(x - r*.35, y - r*.35, r*.28, 0, Math.PI*2); C.fill();
  C.font = '800 16px Nunito, sans-serif'; C.textAlign = 'center'; C.lineWidth = 4; C.strokeStyle = 'rgba(10,15,34,.85)'; const lb = (typeof skyLayerAt === 'function' && skyLayerAt(PLAYER.y)) ? skyLayerAt(PLAYER.y).n : 'Bầu trời thấp';
  C.strokeText('🎈 ' + lb, x, y + r + 24); C.fillStyle = '#fff'; C.fillText('🎈 ' + lb, x, y + r + 24);
  C.restore();
}
// ---------- khởi động (gọi từ extFinalInit) ----------
function v56pInit(){
  if(typeof V46 === 'undefined' || typeof V46L === 'undefined') return;
  v56pSprites(); v56pCheck(); V56P.on = true;
  // cho phép lùi camera xa hơn khung thế giới: tới mức thấy cả hành tinh + vũ trụ
  const cc0 = clampCam; clampCam = function(){ const z0 = cam.z; cc0(); if(!V46.on || V46.sky || !V56P.on) return; v56pCheck();
    if(z0 < cam.z){ cam.z = Math.max(v56pZMin(), z0); const L = V46L; if(cw/cam.z >= L.W) cam.x = L.W/2; if(ch/cam.z >= L.H) cam.y = L.H/2; } };
  // màu biển theo độ sâu: vẽ ngay sau mặt đất/bờ, dưới người, tàu, máy bay
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); try { const f = v56pZFit(); v56pSeaPass(1 - v56pSm(f*1.4, f*7, cam.z)); } catch(e){} };
  // khung hình: camera kéo dần về tâm hành tinh khi ra xa, rồi phủ vũ trụ + khí quyển + mây
  const r0 = render; render = function(dt){
    try { v56pTick(dt); } catch(e){ console.warn('v56p tick', e); }
    if(!V46.on) return r0(dt);
    if(V46.sky){ if(V56P.sk < .985) r0(dt); try { if(!(typeof v39Covered === 'function' && v39Covered())) v56pSkyDraw(); } catch(e){ console.warn('v56p sky', e); } return; }
    const t = v56pBlend(cam.z); V56P.t = t; V56P.view = null;
    if(t <= .001) return r0(dt);
    const L = V46L, ox = cam.x, oy = cam.y, s = v56pSm(0, 1, Math.min(1, t*1.25)); cam.x = ox + (L.CX - ox)*s; cam.y = oy + (L.CY - oy)*s; V56P.view = {x:cam.x, y:cam.y};
    if(typeof v39Covered === 'function' && v39Covered()){ cam.x = ox; cam.y = oy; return; }
    const v = V56P.view, cx = cw/2 + (L.CX - v.x)*cam.z, cy = ch/2 + (L.CY - v.y)*cam.z, rp = V56P.Rp*cam.z;
    // nền vũ trụ vẽ trước (1 ảnh), thế giới chỉ vẽ trong đĩa hành tinh → không phải phủ lại phần ngoài mỗi khung
    // clip chữ nhật quanh đĩa (không khử răng cưa → nhanh với các lớp đèn đêm), rồi vá 4 góc ngoài đĩa bằng nền sao
    const q = [Math.floor(cx - rp) - 1, Math.floor(cy - rp) - 1, Math.ceil(rp*2) + 2, Math.ceil(rp*2) + 2, cx, cy, rp];
    try { v56pSpaceBg(t); } catch(e){}
    ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.beginPath(); ctx.rect(q[0], q[1], q[2], q[3]); ctx.clip();
    try { r0(dt); } finally { ctx.restore(); cam.x = ox; cam.y = oy; }
    try { v56pSpaceBg(t, q); } catch(e){}
    try { v56pBirds(cx, cy, rp, t*.9); v56pSpace(cx, cy, rp, t, false); v56pPlanes(cx, cy, rp, t); } catch(e){ console.warn('v56p planet', e); }
  };
  // khinh khí cầu: chụm 2 ngón / cuộn ra ở tầng trời → nhìn xuống hành tinh; chụm vào → trở lại bầu trời
  const za0 = zoomAt; zoomAt = function(f, sx, sy){ V56P.fly = null;
    if(V46.on && V46.sky && PLAYER && PLAYER.v16fly){ if(f > 1 && V56P.skT > 0){ V56P.skT = 0; return; } const z = cam.z; za0(f, sx, sy); if(f < 1 && (cam.z >= z - 1e-6 || cam.z < .3)) V56P.skT = 1; return; }
    if(!followCam || V56P.t > .05) V56P.flown = true; const r = za0(f, sx, sy); if(f > 1) V56P.z0 = cam.z; return r; };
  // chạm (không kéo) khi đang nhìn hành tinh → bay tới; một ngón kéo không lái nhân vật
  const pts = new Set();
  stage.addEventListener('pointerdown', e => { if(e.target !== cvs) return; pts.add(e.pointerId); V56P.ptr = pts.size === 1 ? {id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now(), ok:true} : (V56P.ptr && (V56P.ptr.ok = false), V56P.ptr); }, true);
  stage.addEventListener('pointermove', e => { const p = V56P.ptr; if(!p || e.pointerId !== p.id) return; if(Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) p.ok = false;
    if(e.pointerType !== 'mouse' && pts.size === 1 && v56pActive()) e.stopImmediatePropagation(); }, true);
  const up = e => { pts.delete(e.pointerId); const p = V56P.ptr; if(!p || p.id !== e.pointerId) return; V56P.ptr = null;
    if(e.type !== 'pointerup' || !p.ok || performance.now() - p.t > 450 || !v56pActive()) return;
    try { drag = null; } catch(er){} const r = cvs.getBoundingClientRect(); v56pTap(e.clientX - r.left, e.clientY - r.top); };
  stage.addEventListener('pointerup', up, true); stage.addEventListener('pointercancel', up, true);
  // nút 🌍 Hành tinh (cột phải) + nút 🧍 Về nhân vật
  const col = document.getElementById('v41Col'), b = document.createElement('button'); b.type = 'button'; b.id = 'v56pBtn'; b.className = 'v41b'; b.setAttribute('aria-label', 'Góc nhìn hành tinh');
  b.innerHTML = '<span class="ic">🌍</span><small>Hành tinh</small>'; b.onclick = e => { e.stopPropagation(); try { v32Wake(); } catch(er){} v56pToggle(); };
  (col || stage).appendChild(b); if(!col) b.classList.add('v56p-float'); V56P.btn = b;
  const k = document.createElement('button'); k.type = 'button'; k.id = 'v56pBack'; k.hidden = true; k.innerHTML = '🧍 Về nhân vật'; k.onclick = e => { e.stopPropagation(); v56pBack(); };
  stage.appendChild(k); V56P.back = k;
  window.addEventListener('keydown', e => { if(e.code === 'KeyP' && !openModal && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) v56pToggle(); });
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v56p = {V56P, v56pToggle, v56pBack, v56pTap, v56pZFit, v56pBlend};
}
