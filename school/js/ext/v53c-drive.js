// ================= v53c · THÀNH PHỐ AN TOÀN 4/6: người chơi lái xe cứu hỏa / xe cảnh sát, nhiệm vụ giúp đỡ (không bạo lực), mũi tên chỉ đường =================
// Điện thoại: kéo ở đâu cũng được — kéo về hướng nào xe chạy hướng đó. Máy tính: phím mũi tên / WASD.
const V53C_DK = {ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right'};
// nhiệm vụ cảnh sát: điểm đến lấy theo khu có sẵn trên đảo (toạ độ mới)
const V53C_MIS = [
  {k:'lost', ic:'🧒', vi:'Bé lạc mẹ', a:['rubikpark', 'garden', 'plaza'], b:['shopst', 'houses', 'zen'], ta:'Đón bé đang khóc ở {A}', tb:'Đưa bé về với mẹ ở {B}', lesson:'Khi bị lạc: đứng yên ở chỗ đông người, nhờ chú cảnh sát hoặc cô bảo vệ, đọc số điện thoại của bố mẹ. Không đi theo người lạ.'},
  {k:'item', ic:'🎒', vi:'Đồ rơi', a:['field', 'arena', 'pond'], b:['library', 'academy', 'hall2p'], ta:'Nhặt chiếc ba lô rơi ở {A}', tb:'Trả ba lô cho bạn ở {B}', lesson:'Nhặt được của rơi: mang tới đồn cảnh sát hoặc thầy cô để trả người mất. Trung thực là đức tính đẹp!'},
  {k:'cross', ic:'🚸', vi:'Qua đường an toàn', a:['gate'], ta:'Tới cổng trường giúp các bạn qua đường', quiz:'cross', lesson:'Qua đường: đi trên vạch kẻ, nhìn trái – phải – trái, chờ đèn xanh cho người đi bộ, nắm tay người lớn.'},
  {k:'traffic', ic:'🚦', vi:'Điều tiết giao thông', a:['rubik', 'stadium', 'farm'], ta:'Tới ngã tư gần {A} để điều tiết xe', quiz:'traffic', lesson:'Đèn đỏ dừng lại, đèn vàng đi chậm và dừng, đèn xanh mới được đi. Đội mũ bảo hiểm khi ngồi xe máy.'}
];
const V53C_ZNAME = {rubikpark:'Công viên Rubik', garden:'Vườn hoa', plaza:'Quảng trường', shopst:'Phố mua sắm', houses:'Khu nhà', zen:'Vườn thiền', field:'Sân bóng', arena:'Đấu trường', pond:'Ao cá', library:'Thư viện', academy:'Học viện', hall2p:'Hội trường', rubik:'Lớp Rubik', stadium:'Sân vận động', farm:'Nông trại', gate:'Cổng trường'};
function v53cZonePt(id){
  if(id === 'gate') return [V46L.CX + V46L.GATE[0], V46L.CY + V46L.GATE[1] + 160]; const z = V46.ZI && V46.ZI[id]; if(!z) return null;
  const e = z.entry || [(z.n.x0 + z.n.x1)/2, z.n.y1 + 10]; let p = [e[0], e[1] + 40]; try { const q = V46R.nodes[v46Nearest(p[0], p[1])]; if(q && Math.hypot(q[0] - p[0], q[1] - p[1]) < 260) p = [q[0], q[1]]; } catch(e){} return p;
}
const v53cPick = A => A[Math.floor(Math.random()*A.length)];

// ---------- 1. lên / xuống xe ----------
function v53cDrive(id){
  const Pl = typeof PLAYER !== 'undefined' ? PLAYER : null; if(!Pl || !Pl.visible){ toast('🚗 Hãy vào thế giới trước nhé!'); return false; }
  if(typeof V51P !== 'undefined' && V51P.on){ toast('✈️ Đang lái máy bay — hạ cánh trước đã.'); return false; } if(Pl.v16fly){ toast('🎈 Hạ khinh khí cầu trước đã nhé!'); return false; }
  try { if(Pl.boat) leaveBoat(Pl); } catch(e){} try { if(Pl.cycling) toggleBike(); } catch(e){} try { if(Pl.mount && typeof dismount === 'function') dismount(Pl, true); } catch(e){} try { cancelAuto(); } catch(e){}
  const v = V53C.veh[id], G = v53cGeo(id); if(v.st !== 'home' && Math.hypot(v.x - G.park[0], v.y - G.park[1]) > 300){ v.x = G.park[0]; v.y = G.park[1]; } v.path = null; v.st = 'drive'; v.spd = 0; v.hdg = Math.PI/2; v.help = null;
  if(id === 'fire' && V53C.fires.some(f => !f.out)){ v.lights = v.siren = true; } else v.lights = id === 'police';
  V53C.mode = 'drive'; V53C.drv = id; V53C.k = {}; V53C.stick.x = V53C.stick.y = 0; V53C.fc = followCam; followCam = false; V53C.cz = cam.z;
  document.body.classList.add('v53cOn'); v53cPanel(null); v53cHudBuild(); v53cHudShow(true);
  v53cMsg(id === 'fire' ? (V53C.fires.some(f => !f.out) ? '🚒 Có đám cháy! Theo mũi tên đỏ, tới gần rồi dừng xe. Bật 🚨 để xe khác nhường đường.' : '🚒 Kéo về hướng nào xe chạy hướng đó. Bấm 💦 ở sân tập để luyện dập lửa!') : '🚓 Bấm 📋 để nhận nhiệm vụ giúp đỡ người dân. Theo mũi tên xanh nhé!', 5);
  if(id === 'police' && !V53C.mis) setTimeout(() => { if(V53C.mode === 'drive' && V53C.drv === 'police' && !V53C.mis) v53cMisPanel(); }, 900);
  return true;
}
function v53cCanExit(){ const v = V53C.drv && V53C.veh[V53C.drv]; return v && Math.abs(v.spd) < 30; }
function v53cExit(force){
  if(V53C.mode !== 'drive') return; const id = V53C.drv, v = V53C.veh[id]; if(!force && !v53cCanExit()){ v53cMsg('⏹️ Thả tay để xe dừng hẳn rồi mới xuống nhé.'); return; }
  if(V53C.mg) v53cMgClose(true);
  let x = v.x - Math.sin(v.hdg)*40, y = v.y + Math.cos(v.hdg)*40 + 10; if(!v46Walk(x, y)){ const G = v53cGeo(id); x = G.exit[0]; y = G.exit[1]; }
  const Pl = PLAYER; if(Pl){ Pl.x = x + V46E; Pl.y = y; Pl._z = null; Pl.v46t = null; Pl._lx = Pl.x; Pl._ly = Pl.y; Pl.moving = false; }
  V53C.mode = ''; V53C.drv = ''; V53C.k = {}; v53cHudShow(false); document.body.classList.remove('v53cOn'); v.spd = 0; v.siren = false;
  // xe tự về trạm
  if(id === 'fire' && V53C.fires.some(f => !f.out)){ v.st = 'go'; v.path = []; } else { v.lights = false; v53cGoTo(v, v53cHome(v), 'back'); }
  followCam = V53C.fc !== false; cam.z = Math.max(.6, Math.min(1.4, V53C.cz || 1)); cam.x = x; cam.y = y; try { clampCam(); } catch(e){}
  try { select(PLAYER, true); if(!PLAYER.controlled) setControl(true); followCam = true; } catch(e){}
  if(!force) toast('👋 Đã xuống xe. ' + V53C_VEH[id].vi + ' tự chạy về ' + V53C_Z[id].vi + '.');
}
function v53cKey(e, on){
  const t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; if(V53C.mode !== 'drive' || V53C.mg) return;
  if(e.code === 'Escape' && on){ if(V53C.panelK) v53cPanel(null); else v53cExit(); e.preventDefault(); e.stopPropagation(); return; }
  if(e.code === 'KeyH' && on){ v53cSirenToggle(); e.preventDefault(); e.stopPropagation(); return; }
  const k = V53C_DK[e.code]; if(!k) return; V53C.k[k] = on; e.preventDefault(); e.stopPropagation();
}
// ---------- 2. vật lý lái ----------
function v53cDriveOk(x, y, id){
  if(Math.hypot(x - V46L.CX, y - V46L.CY) > V46L.ISLAND - 90) return false;
  for(const q of v53cIds()){ const G = v53cGeo(q); if(x > G.b.x0 - 10 && x < G.b.x1 + 10 && y > G.b.y0 - 10 && y < G.gy + 12) return false; }
  for(const z of V46.Z){ const n = z.n; if(x > n.x0 + 20 && x < n.x1 - 20 && y > n.y0 + 20 && y < n.y1 - 20){ const q = V46R.nodes[v46Nearest(x, y)]; if(!q || Math.hypot(q[0] - x, q[1] - y) > 70) return false; } }
  return true;
}
function v53cDriveTick(dt){
  const v = V53C.veh[V53C.drv]; if(!v || dt <= 0) return; const S = V53C_VEH[V53C.drv], k = V53C.k, st = V53C.stick;
  if(V53C.mg || V53C.panelK){ v.spd += (0 - v.spd)*Math.min(1, dt*4); return; }
  const m = Math.min(1, Math.hypot(st.x, st.y));
  if(m > .15){ const a = Math.atan2(st.y, st.x); let da = Math.atan2(Math.sin(a - v.hdg), Math.cos(a - v.hdg)); const back = Math.abs(da) > 2.6 && v.spd < 40;
    if(back){ v.spd += (-S.vmax*.3*m - v.spd)*Math.min(1, dt*2); } else { v.hdg += Math.max(-3.2*dt, Math.min(3.2*dt, da)); v.spd += (S.vmax*m*(1 - Math.min(.55, Math.abs(da)/3)) - v.spd)*Math.min(1, dt*1.6); } }
  else { const turn = (k.right ? 1 : 0) - (k.left ? 1 : 0), acc = (k.up ? 1 : 0) - (k.down ? 1 : 0); v.hdg += turn*2.4*dt*Math.min(1, Math.abs(v.spd)/40 + .2)*(v.spd < 0 ? -1 : 1);
    if(acc > 0) v.spd += (S.vmax - v.spd)*Math.min(1, dt*1.2); else if(acc < 0) v.spd += (-S.vmax*.35 - v.spd)*Math.min(1, dt*1.5); else v.spd += (0 - v.spd)*Math.min(1, dt*2.2); }
  const nx = v.x + Math.cos(v.hdg)*v.spd*dt, ny = v.y + Math.sin(v.hdg)*v.spd*dt;
  if(v53cDriveOk(nx, ny)){ v.x = nx; v.y = ny; } else if(v53cDriveOk(nx, v.y)){ v.x = nx; v.spd *= .9; } else if(v53cDriveOk(v.x, ny)){ v.y = ny; v.spd *= .9; } else { v.spd *= -.25; if(realT - (V53C.bumpT || 0) > 2){ V53C.bumpT = realT; v53cSnd('horn', .6); } }
  v53cMisTick();
  if(realT > V53C.msgT){ const m2 = document.getElementById('v53cMsg'); if(m2 && !m2.hidden) m2.hidden = true; }
}
function v53cSirenToggle(){ const v = V53C.veh[V53C.drv]; if(!v) return; v.siren = !v.siren; v.lights = v.siren || V53C.drv === 'police'; v53cSnd('tap'); v53cMsg(v.siren ? '🚨 Bật đèn và còi ưu tiên: các xe khác sẽ nhường đường.' : '🔕 Tắt còi. Chỉ bật còi khi đi làm nhiệm vụ khẩn cấp nhé.', 3); v53cHud(true); }
function v53cCam(dt){
  const v = V53C.veh[V53C.drv]; if(!v) return; const small = Math.min(cw, ch) < 520, zT = (small ? .72 : .95) - Math.min(.2, Math.abs(v.spd)/1500), k = Math.min(1, dt*3);
  const tx = v.x + Math.cos(v.hdg)*v.spd*.5, ty = v.y + Math.sin(v.hdg)*v.spd*.5; cam.x += (tx - cam.x)*k; cam.y += (ty - cam.y)*k; cam.z += (zT - cam.z)*Math.min(1, dt*1.5);
}

// ---------- 3. nhiệm vụ cảnh sát ----------
function v53cMisStart(i){
  const M = V53C_MIS[i]; if(!M) return; const A = M.a.map(v53cZonePt).filter(Boolean); if(!A.length){ toast('Không tìm thấy điểm đến.'); return; }
  const ai = Math.floor(Math.random()*M.a.length), aId = M.a[ai], a = v53cZonePt(aId) || A[0]; let bId = null, b = null;
  if(M.b){ for(let k = 0; k < 6 && !b; k++){ bId = v53cPick(M.b); b = v53cZonePt(bId); } }
  V53C.mis = {M, step:0, pts:b ? [a, b] : [a], names:[V53C_ZNAME[aId] || aId, V53C_ZNAME[bId] || bId || ''], t0:realT};
  v53cPanel(null); v53cMsg(M.ic + ' ' + v53cMisText(), 5); v53cSnd('ok'); v53cHud(true);
}
function v53cMisText(){ const m = V53C.mis; if(!m) return ''; const M = m.M; return (m.step === 0 ? M.ta : M.tb).replace('{A}', m.names[0]).replace('{B}', m.names[1]); }
function v53cMisTick(){
  const m = V53C.mis, v = V53C.veh.police; if(!m || V53C.drv !== 'police' || m.wait) return; const p = m.pts[m.step]; if(!p) return;
  const d = Math.hypot(v.x - p[0], v.y - p[1]); if(d > 130 || Math.abs(v.spd) > 40) return;
  const M = m.M;
  if(M.quiz){ m.wait = 1; v.spd = 0; v53cQuiz(M.quiz, ok => { m.wait = 0; v53cMisDone(ok); }); return; }
  if(m.step === 0){ m.step = 1; v53cSnd('pick'); v53cMsg(M.k === 'lost' ? '🧒 Bé đã lên xe, thắt dây an toàn rồi. Giờ tìm mẹ của bé nào!' : '🎒 Đã nhặt ba lô. Trong có vở ghi tên chủ — mình mang trả bạn ấy nhé!', 4); v53cHud(true); }
  else v53cMisDone(true);
}
function v53cMisDone(ok){
  const m = V53C.mis; if(!m) return; V53C.mis = null; const M = m.M, s = v53cState();
  if(ok !== false){ s.helps = (s.helps || 0) + 1; v53cSave(); const r = v53cReward('police', .55 + Math.random()*.3, 'Giúp đỡ người dân'); v53cSnd('win');
    v53cPanel('done', {ic:M.ic, t:M.k === 'lost' ? 'Bé đã gặp lại mẹ! 🥰' : M.k === 'item' ? 'Bạn ấy vui lắm vì tìm lại được ba lô!' : 'Cảm ơn chú cảnh sát nhí!', r, lesson:M.lesson, again:() => v53cMisPanel()}); v53cBadge('police'); }
  else v53cPanel('done', {ic:M.ic, t:'Chưa đúng hết — thử lại lần sau nhé!', lesson:M.lesson, again:() => v53cMisPanel()});
  v53cHud(true);
}

// ---------- 4. mũi tên chỉ đường + vòng đánh dấu điểm đến (lớp trên cùng) ----------
function v53cTarget(){
  if(V53C.mode === 'drive' && V53C.drv === 'police' && V53C.mis){ const p = V53C.mis.pts[V53C.mis.step]; return p ? {p, col:'#4f8bff', ic:V53C.mis.M.ic} : null; }
  if(V53C.mode === 'drive' && V53C.drv === 'fire'){ const f = V53C.fires.find(q => !q.out && q.k !== 'plane') || V53C.fires.find(q => !q.out); if(f) return {p:[f.x, f.y], col:'#ff4d3d', ic:'🔥'};
    return null; }
  if(V53C.em && V53C.em.rw && V53C.em.ph >= 1) return {p:V53C.em.rw, col:'#ff4d3d', ic:'🛬'};
  const Gd = V53C.guide; if(Gd && !V53C.mode && !(typeof V51P !== 'undefined' && V51P.on)){ if(realT > Gd.until || V53C.near === Gd.id){ V53C.guide = null; return null; } const G = v53cGeo(Gd.id); return {p:[G.door[0], G.gy + 30], col:'#ffd23f', ic:V53C_Z[Gd.id].ic}; }
  return null;
}
function v53cOverlay(){
  const VBn = V46.VBn; if(!VBn) return; const T = v53cTarget(); if(!T) return; const p = T.p, t = realT;
  ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z)));
  if(p[0] > VBn.x0 - 100 && p[0] < VBn.x1 + 100 && p[1] > VBn.y0 - 100 && p[1] < VBn.y1 + 100){ const r = 60 + Math.sin(t*4)*8; ctx.strokeStyle = T.col; ctx.lineWidth = 6/Math.max(.5, cam.z); ctx.globalAlpha = .85; ctx.beginPath(); ctx.ellipse(p[0], p[1], r, r*.6, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    if(V53C.mis && V53C.mis.M.k !== 'cross' && V53C.mis.M.k !== 'traffic' && V53C.drv === 'police'){ const K = V53C.misKid || (V53C.misKid = v51tRandKid(7)); K.dir = 1; if(V53C.mis.step === 0 && V53C.mis.M.k === 'lost') v51tKid(ctx, p[0] + 20, p[1], K, t); else if(V53C.mis.step === 0){ ctx.font = '800 26px Nunito, sans-serif'; ctx.fillText('🎒', p[0] - 13, p[1]); } else { const A = v51tRandKid(2); A.sc = 1.25; A.long = true; v51tKid(ctx, p[0] + 24, p[1], A, t); } }
    if(V53C.mis && (V53C.mis.M.k === 'cross' || V53C.mis.M.k === 'traffic') && V53C.drv === 'police'){ for(let i = 0; i < 3; i++){ const K = v51tRandKid(i + 4); K.dir = 1; v51tKid(ctx, p[0] - 40 + i*24, p[1] - 30, K, t); } } }
  // mũi tên ở mép màn hình khi điểm đến ngoài khung
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const sx = cw/2 + (p[0] - cam.x)*cam.z, sy = ch/2 + (p[1] - cam.y)*cam.z; if(sx > 30 && sx < cw - 30 && sy > 80 && sy < ch - 30) return;
  const a = Math.atan2(sy - ch/2, sx - cw/2), rr = Math.min(cw, ch)*.36, x = cw/2 + Math.cos(a)*rr, y = ch/2 + Math.sin(a)*rr, src = V53C.mode === 'drive' ? V53C.veh[V53C.drv] : (typeof V51P !== 'undefined' && V51P.P) || (PLAYER && PLAYER.visible ? (q => ({x:q[0], y:q[1]}))(v46Pos(PLAYER)) : {x:cam.x, y:cam.y});
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = T.col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-12, -17); ctx.lineTo(-4, 0); ctx.lineTo(-12, 17); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  ctx.font = '800 16px Nunito, sans-serif'; ctx.textAlign = 'center'; const s = T.ic + ' ' + Math.round(Math.hypot(p[0] - src.x, p[1] - src.y)/10) + ' m', w = ctx.measureText(s).width + 16; ctx.fillStyle = 'rgba(11,16,32,.85)'; ctx.fillRect(x - w/2, y + 22, w, 26); ctx.fillStyle = '#fff'; ctx.fillText(s, x, y + 40); ctx.textAlign = 'left';
}

// ---------- 5. HUD lái xe (DOM, cập nhật 4 lần/giây) ----------
function v53cHudBuild(){
  if(document.getElementById('v53cHud')) return; const st = document.getElementById('stage') || document.body, h = document.createElement('div'); h.id = 'v53cHud'; h.hidden = true;
  h.innerHTML = '<div id="v53cPad" aria-label="Kéo để lái xe"><div id="v53cKnob"></div></div>' +
    '<div class="v51pTop"><button type="button" class="v51pIb" id="v53cX" aria-label="Xuống xe">✕</button><div id="v53cStat"></div><button type="button" class="v51pIb" id="v53cSir" aria-label="Đèn và còi">🚨</button><button type="button" class="v51pIb" id="v53cHelp" aria-label="Hướng dẫn">?</button></div>' +
    '<div id="v53cMis" hidden></div><div id="v53cMsg" hidden></div><div id="v53cBtns"><button type="button" id="v53cAct2" hidden></button><button type="button" id="v53cAct" hidden></button></div>';
  st.appendChild(h);
  h.querySelector('#v53cX').onclick = () => v53cExit(); h.querySelector('#v53cSir').onclick = () => v53cSirenToggle(); h.querySelector('#v53cHelp').onclick = () => v53cPanel('help');
  h.querySelector('#v53cAct').onclick = () => { const a = V53C.act; if(a) a.f(); }; h.querySelector('#v53cAct2').onclick = () => { const a = V53C.act2; if(a) a.f(); };
  const pad = h.querySelector('#v53cPad'), knob = h.querySelector('#v53cKnob'); let pid = null, ox = 0, oy = 0;
  pad.addEventListener('pointerdown', e => { if(pid !== null) return; pid = e.pointerId; ox = e.clientX; oy = e.clientY; try { pad.setPointerCapture(pid); } catch(er){} knob.style.cssText = 'display:block;left:' + ox + 'px;top:' + oy + 'px'; e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if(e.pointerId !== pid) return; const R = Math.min(80, Math.min(innerWidth, innerHeight)*.15), dx = Math.max(-1, Math.min(1, (e.clientX - ox)/R)), dy = Math.max(-1, Math.min(1, (e.clientY - oy)/R));
    V53C.stick.x = dx; V53C.stick.y = dy; const m = Math.hypot(dx, dy), q = m > 1 ? 1/m : 1; knob.style.transform = 'translate(' + (dx*R*q) + 'px,' + (dy*R*q) + 'px)'; });
  const up = e => { if(e.pointerId !== pid) return; pid = null; V53C.stick.x = V53C.stick.y = 0; knob.style.display = 'none'; knob.style.transform = ''; };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
}
function v53cHudShow(on){ const h = document.getElementById('v53cHud'); if(h) h.hidden = !on; if(on) v53cHud(true); }
function v53cHud(force){
  if(V53C.mode !== 'drive') return; const id = V53C.drv, v = V53C.veh[id], S = V53C_VEH[id]; if(!v) return;
  const s = '<b>' + S.ic + ' ' + S.vi + '</b><span>💨 ' + Math.round(Math.abs(v.spd)*.25) + ' km/h</span><span>' + (id === 'fire' ? '☎️ 114' : '☎️ 113') + '</span>';
  const e = document.getElementById('v53cStat'); if(e && (force || e._s !== s)){ e._s = s; e.innerHTML = s; }
  const sb = document.getElementById('v53cSir'); if(sb) sb.classList.toggle('on', !!v.siren);
  const mc = document.getElementById('v53cMis'); if(mc){ const t = V53C.mis ? V53C.mis.M.ic + ' ' + v53cMisText() : ''; if(mc._t !== t){ mc._t = t; mc.textContent = t; mc.hidden = !t; } }
  let a = null, a2 = null; const f = V53C.fires.find(q => !q.out);
  if(id === 'fire' && f && Math.hypot(v.x - f.x, v.y - f.y) < 230 && Math.abs(v.spd) < 30) a = {t:'💦 Dập lửa', f:() => v53cMgOpen(f.k, f)};
  else if(id === 'fire' && !f && Math.hypot(v.x - v53cGeo('fire').cx, v.y - v53cGeo('fire').cy) < 420 && Math.abs(v.spd) < 30) a = {t:'💦 Tập dập lửa', f:() => v53cMgOpen(v53cPick(['kitchen', 'forest', 'plane']))};
  if(id === 'police') a = V53C.mis ? null : {t:'📋 Nhận nhiệm vụ', f:() => v53cMisPanel()};
  if(v53cCanExit()) a2 = {t:'👋 Xuống xe', f:() => v53cExit()};
  V53C.act = a; V53C.act2 = a2;
  for(const [bid, q] of [['v53cAct', a], ['v53cAct2', a2]]){ const b = document.getElementById(bid); if(!b) continue; const t = q ? q.t : ''; if(b._t !== t){ b._t = t; b.textContent = t; b.hidden = !q; } }
}
