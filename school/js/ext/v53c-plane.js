// ================= v53c · THÀNH PHỐ AN TOÀN 5/6: máy bay bay ra khắp biển + sự cố động cơ bốc khói (luôn an toàn, dạy kỹ năng xử lý) =================
// Bọc v51pTick (không sửa file v51p). Bước xử lý: 😌 bình tĩnh → ⬇️ giảm ga → 🧯 bình chữa cháy → 🛬 hạ cánh khẩn cấp (đường băng gần nhất / mặt nước với thủy phi cơ).
const V53C_EMSTEP = [
  {ic:'⬇️', vi:'Giảm ga', how:'Kéo cần GA xuống dưới một nửa (hoặc bấm nút).', btn:'⬇️ Giảm ga'},
  {ic:'🧯', vi:'Bật bình chữa cháy động cơ', how:'Bấm nút đỏ để phun bọt dập lửa trong động cơ.', btn:'🧯 Phun bình chữa cháy'},
  {ic:'🛬', vi:'Hạ cánh khẩn cấp', how:'Theo mũi tên đỏ tới đường băng gần nhất, hạ nhẹ rồi dừng hẳn.', btn:''}
];
// đường băng gần nhất (sân bay chính + các đảo nhỏ)
function v53cNearRunway(x, y){
  const C = v51pC(), L = [[C[0], C[1] + V51P_AP.ry, 'Sân bay Rubik']]; for(const s of V51P_ISL){ const p = v51pIslPos(s); L.push([p[0], p[1] + 143, s.vi]); }
  let b = L[0], bd = 1e18; for(const q of L){ const d = Math.hypot(q[0] - x, q[1] - y); if(d < bd){ bd = d; b = q; } } return b;
}
// ---------- 1. bắt đầu / kết thúc sự cố ----------
function v53cEmStart(){
  const P = V51P.P; if(!P || V53C.em) return; const pl = P.pl, water = !!pl.water, heli = !!pl.hover;
  V53C.em = {ph:0, t0:realT, water, heli, rw:null, rwName:'', bell:0, ext:false};
  if(!water && !heli){ const r = v53cNearRunway(P.x, P.y); V53C.em.rw = [r[0], r[1]]; V53C.em.rwName = r[2]; }
  v53cEmUi(); document.body.classList.add('v53cEmOn'); v53cCaution(); V53C.drill = false;
  const s = v53cState(); s.em = (s.em || 0) + 1; v53cSave();
}
function v53cEmEnd(ok){
  const E = V53C.em; if(!E) return; V53C.em = null; document.body.classList.remove('v53cEmOn'); const u = document.getElementById('v53cEm'); if(u) u.hidden = true;
  if(!ok) return; const P = V51P.P, r = v53cReward('em', .9, 'Xử lý sự cố bình tĩnh'); v53cSnd('win');
  // xe cứu hỏa tới làm mát động cơ nếu đáp ở sân bay chính
  if(P && Math.hypot(P.x - V46L.CX, P.y - V46L.CY) < V46L.ISLAND){ const f = v53cFireAt('plane', P.x, P.y); f.hp = .5; v53cDispatch(f); }
  v51pMsg('✅ An toàn rồi! Không ai bị thương. 🚒 Xe cứu hỏa tới kiểm tra động cơ.', 5);
  v53cPanel('done', {ic:'🎖️', t:'Bạn đã hạ cánh an toàn!', r, lesson:'Khi gặp sự cố: 1) Bình tĩnh, hít thở sâu. 2) Làm theo hướng dẫn từng bước. 3) Báo cho đài kiểm soát ("Mayday!"). 4) Tới nơi an toàn gần nhất. Ở mặt đất cũng vậy: thấy khói hãy bình tĩnh, ra ngoài, gọi 114.'});
  setTimeout(() => v53cBadge('calm'), 400);
}
// ---------- 2. mỗi khung hình khi đang có sự cố ----------
function v53cEmTick(dt){
  const E = V53C.em, P = V51P.P; if(!E || !P){ if(E && !V51P.on) v53cEmEnd(false); return; }
  if(E.ph === 0 && V51P.thr <= .42){ E.ph = 1; v53cSnd('ok'); v51pMsg('👍 Tốt lắm! Giờ bật bình chữa cháy động cơ.', 3); v53cEmUi(); }
  if(E.ph === 2 && !E.water && !E.heli){ const r = v53cNearRunway(P.x, P.y); E.rw = [r[0], r[1]]; E.rwName = r[2]; }
  // chuông báo (nhanh khi còn lửa, chậm sau khi đã dập)
  if(realT > E.bell){ E.bell = realT + (E.ext ? 4.5 : 1.7); v53cCaution(); }
  // khói từ động cơ (mũi máy bay)
  const sc = 1.3*(1 + P.alt/650), D = v51pProj(P), ex = D[0] + Math.cos(P.hdg)*22*sc, ey = D[1] + Math.sin(P.hdg)*22*sc;
  if((E.emit = (E.emit || 0) - dt) <= 0){ E.emit = E.ext ? .22 : .07; const p = v53cPuffAddRaw(ex, ey, !E.ext, E.ext ? .7 : 1.1); p.vx = -Math.cos(P.hdg)*30; p.vy = -Math.sin(P.hdg)*30 - 8; }
  // hạ cánh xong & dừng = thành công
  if(E.ph >= 2 && P.ground && P.spd < 35){ const surf = v51pSurface(P.x, P.y); if(surf === 'runway' || (E.water && surf === 'water') || (E.heli && surf !== 'water')) v53cEmEnd(true); }
  else if(E.ph < 2 && P.ground && P.spd < 35) { E.ph = 2; v53cEmEnd(true); }
}
function v53cPuffAddRaw(x, y, dark, r){ const p = v53cPuffAdd(x, y, dark, r); p.x = x; p.life = 2.2; return p; }
function v53cEmAct(){
  const E = V53C.em; if(!E) return;
  if(E.ph === 0){ V51P.thr = .3; try { v51pHudThr(); } catch(e){} return; }
  if(E.ph === 1){ E.ext = true; E.ph = 2; v53cSnd('spray', 1); for(let i = 0; i < 12; i++) setTimeout(() => v53cSnd('spray', .6), i*60);
    v51pMsg(E.water ? '🧯 Lửa đã tắt! Hạ cánh ngay trên mặt nước: giảm ga, kéo ↓ nhẹ nhàng.' : E.heli ? '🧯 Lửa đã tắt! Đáp xuống bãi đất trống gần nhất.' : '🧯 Lửa đã tắt! Theo mũi tên đỏ tới ' + E.rwName + ' để hạ cánh.', 5); v53cEmUi(); }
}
// lửa nhỏ ở mũi máy bay (vẽ sau máy bay)
function v53cEmDraw(){
  const E = V53C.em, P = V51P.P; if(!E || !P || E.ext) return; const sc = 1.3*(1 + P.alt/650), D = v51pProj(P), ex = D[0] + Math.cos(P.hdg)*24*sc, ey = D[1] + Math.sin(P.hdg)*24*sc;
  ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z)));
  const img = v53cFlameSpr(Math.floor(realT*12) % 4), s = .9*sc; ctx.drawImage(img, ex - 12*s, ey - 26*s, 24*s, 32*s);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .7; ctx.drawImage(v53cGlow('rgba(255,140,40,1)'), ex - 40*s, ey - 40*s, 80*s, 80*s); ctx.restore();
}
// ---------- 3. bảng hướng dẫn (DOM) ----------
function v53cEmUi(){
  let u = document.getElementById('v53cEm'); const st = document.getElementById('stage') || document.body;
  if(!u){ u = document.createElement('div'); u.id = 'v53cEm'; u.innerHTML = '<div id="v53cEmV"></div><div class="v53cEmBox"><div class="v53cEmHd"><i id="v53cLamp"></i><b>Sự cố động cơ</b><span>😌 Bình tĩnh · làm từng bước</span></div><ol id="v53cEmL"></ol><button type="button" id="v53cEmB"></button></div>';
    st.appendChild(u); u.querySelector('#v53cEmB').onclick = () => v53cEmAct(); }
  const E = V53C.em; if(!E){ u.hidden = true; return; } u.hidden = false;
  const steps = V53C_EMSTEP.map((s, i) => { let how = s.how; if(i === 2) how = E.water ? 'Thủy phi cơ: hạ cánh ngay trên mặt nước, giảm ga, kéo ↓ nhẹ.' : E.heli ? 'Trực thăng: đáp xuống bãi đất trống gần nhất.' : 'Theo mũi tên đỏ tới ' + (E.rwName || 'đường băng') + ', hạ nhẹ rồi dừng hẳn.';
    return '<li class="' + (i < E.ph ? 'ok' : i === E.ph ? 'now' : '') + '"><b>' + (i < E.ph ? '✅' : s.ic) + ' ' + s.vi + '</b>' + (i === E.ph ? '<span>' + how + '</span>' : '') + '</li>'; }).join('');
  u.querySelector('#v53cEmL').innerHTML = steps; const b = u.querySelector('#v53cEmB'), t = (V53C_EMSTEP[E.ph] || {}).btn; b.textContent = t || ''; b.hidden = !t; b.className = E.ph === 1 ? 'red' : '';
}
// ---------- 4. gắn vào máy bay v51p ----------
function v53cPlaneInit(){
  if(typeof v51pTick !== 'function') return;
  const t0 = v51pTick; v51pTick = function(dt){
    const P = V51P.P; if(!P) return t0(dt); const C = v51pC(), dx = P.x - C[0], dy = P.y - C[1], r = Math.hypot(dx, dy); let ox = 0, oy = 0;
    // bay ra xa: dời tạm về bán kính 7700 để v51p không tự quay đầu, xong trả lại vị trí thật
    if(r > 7700 && !V51P.mg){ const k = (r - 7700)/r; ox = dx*k; oy = dy*k; P.x -= ox; P.y -= oy; }
    try { t0(dt); } finally { if(ox || oy){ P.x += ox; P.y += oy; for(const p of V51P.smoke) if(p.t0 === realT){ p.x += ox; p.y += oy; } } }
    const r2 = Math.hypot(P.x - C[0], P.y - C[1]);
    if(r2 > V53C_SEA){ const want = Math.atan2(C[1] - P.y, C[0] - P.x); let d = want - P.hdg; d = Math.atan2(Math.sin(d), Math.cos(d)); P.hdg += Math.max(-1.2*dt, Math.min(1.2*dt, d)); if(realT - (V53C.farT || 0) > 6){ V53C.farT = realT; v51pMsg('🌊 Tới rìa vùng biển rồi — máy bay tự quay về đảo nhé!'); } }
    else if(r2 > 8000 && realT - (V53C.seaT || 0) > 40){ V53C.seaT = realT; v51pMsg('🌊 Đang bay trên biển khơi · cách đảo ' + Math.round((r2 - V46L.ISLAND)*.06) + ' km. Nhớ theo dõi đường về!', 4); }
    // sự cố hiếm: chỉ khi bay cao, đã bay ≥ 35 giây, không trong mini game
    if(!V53C.em && !V51P.mg && P.alt > 140 && realT - (P.tOff || realT) > 35){ const drill = V53C.drill && realT - (P.tOff || realT) > 20;
      if(drill || (v53cSet().inc && realT - (V53C.lastEm || -1e9) > 600 && Math.random() < dt/700)){ V53C.lastEm = realT; v53cEmStart(); v51pMsg('🚨 Động cơ bốc khói! Bình tĩnh nhé — làm theo từng bước trong bảng đỏ.', 5); } }
    if(V53C.em) v53cEmTick(dt);
  };
  const ex0 = v51pExit; v51pExit = function(){ const r = ex0.apply(this, arguments); if(!V51P.on && V53C.em) v53cEmEnd(false); return r; };
  const ov0 = v51pOverlay; v51pOverlay = function(dt){ ov0(dt); try { if(V51P.on) v53cEmDraw(); } catch(e){} };
  // đang lái xe / ở trên tháp thì không lên máy bay
  const bd0 = v51pBoard; v51pBoard = function(){ if(V53C.mode){ toast('🚗 Xuống xe / ra khỏi tháp trước đã nhé.'); return false; } return bd0.apply(this, arguments); };
}
