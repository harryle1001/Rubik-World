// ================= v67l · LƯƠNG CỦA EM 4/4: việc mới — 🧑‍🏫 giúp thầy cô mang đồ (v62k) · 💻 sửa máy phòng tin học (v51t) =================
// Mang đồ: thỉnh thoảng một thầy cô (10 thầy cô v62k) dừng lại, hiện bong bóng "📦 Giúp cô với!". Chạm → nhận thùng đồ (hiện trên tay nhân vật),
// đi theo dấu chân v59g tới phòng đích → được cảm ơn + 2 công. Phòng tin học: mỗi ngày vài máy hỏng (⚠️) — cắm dây đúng màu, lau bụi, khởi động lại.
const V67L_ITEMS = {
  toan:['📐', 'bộ thước kẻ và compa', 'attend'], ly:['🧲', 'hộp nam châm thí nghiệm', 'elec'], hoa:['🧪', 'khay ống nghiệm', 'academy'], sinh:['🌱', 'khay cây giống', 'garden'],
  su:['📜', 'cuộn tranh lịch sử', 'hall'], dia:['🌏', 'quả địa cầu', 'library'], van:['📚', 'chồng sách văn học', 'library'], anh:['🔤', 'hộp thẻ từ vựng', 'attend'],
  tin:['💻', 'chiếc máy tính xách tay', 'office'], nghe:['🎨', 'hộp màu vẽ và giá vẽ', 'art']
};
const V67L_ZN = {attend:'Lớp học', elec:'Lớp lắp ráp điện', academy:'Học viện', garden:'Vườn hoa', hall:'Hội trường lớn', library:'Thư viện', office:'Văn phòng', art:'Góc hoạ sĩ', music:'Khu âm nhạc', chess:'Sân cờ', rubik:'Tháp Rubik'};
const V67J = {req:null, job:null, nextT:0, ask:null, fix:null};
function v67lZName(id){ try { const r = typeof R !== 'undefined' && R[id]; if(r && r.name) return String(r.name).replace(/\s*[·(].*$/, ''); } catch(e){} return V67L_ZN[id] || id; }
function v67lZPt(id){ try { const z = V46.ZI[id]; if(!z) return null; return v46Entry(z); } catch(e){ return null; } }
function v67lJobsCss(){ return `
#v67lAsk .v67lSheet{width:min(560px,100%);border-radius:22px;background:#f6ecd2;border:4px solid #2b1a10;box-shadow:0 0 0 4px #3f9a4a,0 -10px 40px rgba(0,0,0,.45);padding:14px 16px 16px;margin-bottom:max(8px,env(safe-area-inset-bottom))}
#v67lAsk .v67lWho{display:grid;grid-template-columns:76px 1fr;gap:12px;align-items:center}#v67lAsk .v67lWho img{width:76px;height:auto;image-rendering:pixelated;background:#fff3d6;border-radius:14px;border:3px solid #dcb98a}
#v67lAsk .v67lWho b{font-size:19px;font-weight:900}#v67lAsk .v67lWho p{margin:4px 0 0;font-size:17px;line-height:1.4}
#v67lAsk .v67lBtns{display:grid;grid-template-columns:1.618fr 1fr;gap:8px;margin-top:12px}#v67lAsk .v67lBtns .v67lBtn{min-height:52px;font-size:17px}
#v67lFix{position:fixed;inset:0;z-index:98;display:flex;align-items:center;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));background:rgba(8,12,30,.78);font-family:Nunito,sans-serif;color:#1b2235;touch-action:manipulation}
#v67lFix .v67fCard{width:min(560px,100%);max-height:100%;overflow:auto;border-radius:20px;background:#eef3fb;border:4px solid #1b2235;box-shadow:0 0 0 4px #5ff0ff,0 20px 50px rgba(0,0,0,.6);padding:14px}
#v67lFix h2{margin:0 0 4px;font-size:22px;font-weight:900;display:flex;align-items:center;gap:8px}#v67lFix h2 .v67lX{margin-left:auto}#v67lFix p{margin:6px 0;font-size:17px;line-height:1.4}
#v67lFix .v67fPlay{position:relative;margin-top:8px;border-radius:16px;background:#1b2235;padding:10px;min-height:250px}
#v67lFix .v67fCab{display:grid;grid-template-columns:1fr 1fr;gap:10px 46px}
#v67lFix .v67fCab button{min-height:54px;border-radius:14px;border:3px solid #0b1028;font:900 16px Nunito,sans-serif;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;gap:6px;padding:0 10px}
#v67lFix .v67fCab button.sel{outline:4px solid #ffd23f;outline-offset:2px}#v67lFix .v67fCab button.ok{opacity:.45}#v67lFix .v67fCab button.bad{animation:v67fShake .35s}
#v67lFix .v67fCab .port{background:#2a3352!important;justify-content:flex-start}#v67lFix .v67fCab .port i{display:inline-block;width:18px;height:18px;border-radius:5px;border:2px solid #fff;flex:none}
@keyframes v67fShake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
#v67lFix canvas.v67fDust{display:block;width:100%;height:auto;border-radius:12px;touch-action:none;cursor:pointer}
#v67lFix .v67fSteps{display:grid;grid-template-columns:1fr 1fr;gap:10px}#v67lFix .v67fSteps button{min-height:64px;border-radius:14px;border:3px solid #0b1028;background:#fff;font:900 17px Nunito,sans-serif;color:#1b2235;cursor:pointer}
#v67lFix .v67fSteps button.ok{background:#b8f5a0}#v67lFix .v67fSteps button.bad{animation:v67fShake .35s;background:#ffd2d2}
#v67lFix .v67fBar{height:14px;border-radius:8px;background:#2a3352;overflow:hidden;margin-top:10px}#v67lFix .v67fBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#5ff0ff,#7dff9a);transition:width .2s}
#v67lFix .v67fDone{text-align:center;padding:18px 6px}#v67lFix .v67fDone b{display:block;font-size:46px}
#v67lFix .v67fLbl{color:#cfe3ff;font-size:16px;margin:0 0 8px;font-weight:800}
`; }

// ---------- 1. GIÚP THẦY CÔ MANG ĐỒ ----------
function v67lTeachOK(){ return typeof V62K !== 'undefined' && V62K.ready && typeof V46 !== 'undefined' && V46.on && !V46.sky && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible && !(typeof V51T !== 'undefined' && V51T.open) && !(typeof V67S !== 'undefined' && V67S.on); }
function v67lTeachTick(){
  const now = performance.now();
  if(V67J.req && now > V67J.req.until){ const t = V62K.T.find(x => x.id === V67J.req.tid); if(t) V62K.hold[t.id] = 0; V67J.req = null; V67J.nextT = now + 30000; }
  if(V67J.job){ v67lCarryTick(); return; }
  if(V67J.req || !v67lTeachOK() || now < V67J.nextT || typeof PROF === 'undefined' || !PROF) return;
  if(v67lState().today.teach >= V67L_CAP){ V67J.nextT = now + 120000; return; }
  // chọn thầy cô gần nhân vật nhất (đang không nói chuyện) để em dễ thấy bong bóng
  const p = v46Pos(PLAYER); let best = null, bd = 1e9; for(const t of V62K.T){ if(V62K.cur === t && V62K.dlg && !V62K.dlg.hidden) continue; const d = Math.hypot(t.p[0] - p[0], t.p[1] - p[1]); if(d < bd){ bd = d; best = t; } }
  if(!best){ V67J.nextT = now + 20000; return; }
  const it = V67L_ITEMS[best.id] || ['📦', 'thùng đồ dùng học tập', 'office']; let dest = it[2]; if(dest === best.zid || !v67lZPt(dest)) dest = dest === 'office' ? 'library' : 'office';
  V67J.req = {tid:best.id, ic:it[0], item:it[1], dest, until:now + 150000}; V62K.hold[best.id] = now + 150000; V67J.nextT = now + 60000 + Math.random()*40000;
  if(bd < 900) v67lPop(`${best.def.ic} ${best.def.n} đang cần giúp! Tìm bong bóng 📦 nhé.`);
}
// bong bóng trên đầu thầy cô cần giúp (chữ ≈ 17px trên màn hình ở mọi mức zoom)
function v67lTeachDraw(){
  const q = V67J.req; if(!q || !V62K.ready) return; const t = V62K.T.find(x => x.id === q.tid); if(!t) return;
  const z = Math.max(.22, cam.z), fs = 17/z, txt = q.ic + ' Giúp ' + t.def.g + ' với!', x = Math.round(t.p[0]), y = Math.round(t.p[1]) - 84/Math.max(1, z*1.2) - 30 + Math.sin(realT*3)*2/z;
  ctx.save(); ctx.font = `900 ${fs}px Nunito, sans-serif`; const w = ctx.measureText(txt).width + 18/z, h = fs*1.6;
  ctx.fillStyle = '#2b1a10'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x - w/2 - 2/z, y - h - 2/z, w + 4/z, h + 4/z, h/2); else ctx.rect(x - w/2, y - h, w, h); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x - w/2, y - h, w, h, h/2); else ctx.rect(x - w/2, y - h, w, h); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 6/z, y - 1/z); ctx.lineTo(x, y + 9/z); ctx.lineTo(x + 6/z, y - 1/z); ctx.fill();
  ctx.fillStyle = '#2b1a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y - h/2 + 1/z); ctx.restore();
}
function v67lAsk(t){
  const q = V67J.req; if(!q) return; let p = document.getElementById('v67lAsk');
  if(!p){ p = document.createElement('div'); p.id = 'v67lAsk'; p.onclick = e => { if(e.target === p) p.hidden = true; }; document.body.appendChild(p); }
  let img = ''; try { img = v62kPortrait(t, 5); } catch(e){}
  p.innerHTML = `<div class="v67lSheet" role="dialog" aria-label="Giúp thầy cô"><div class="v67lWho">${img ? `<img src="${img}" alt="">` : '<span style="font-size:48px">🧑‍🏫</span>'}<div><b>${t.def.ic} ${v67lEsc(t.def.n)}</b>
    <p>“Em ơi, em giúp ${t.def.g} mang ${q.ic} <b>${q.item}</b> tới <b>${v67lZName(q.dest)}</b> với nhé!”</p></div></div>
    <div class="v67lBtns"><button type="button" class="v67lBtn g" data-a="yes">🤝 Dạ, em giúp ạ!</button><button type="button" class="v67lBtn w" data-a="talk">💬 Trò chuyện</button></div></div>`;
  p.hidden = false;
  p.querySelector('[data-a="yes"]').onclick = () => { p.hidden = true; v67lCarryStart(t); };
  p.querySelector('[data-a="talk"]').onclick = () => { p.hidden = true; try { v62kOpen(t); } catch(e){} };
}
function v67lCarryStart(t){
  const q = V67J.req; if(!q) return; V67J.req = null; const pt = v67lZPt(q.dest); if(!pt){ v67lPop('Không tìm thấy phòng đích, thử lại sau nhé.'); return; }
  V67J.job = {tid:t.id, n:t.def.n, g:t.def.g, ic:q.ic, item:q.item, dest:q.dest, pt, t0:performance.now()};
  V62K.hold[t.id] = 0; try { t.route = v46Route(t.p.slice(), [pt[0] + 30, pt[1] + 8]).slice(1); t.ri = 0; t.wait = 0; } catch(e){}   // thầy cô cũng đi tới đó chờ em
  try { const o = v46ToOld(pt[0], pt[1] + 10); v32Nav(o[0], o[1], v67lZName(q.dest), false, () => v67lCarryDone()); } catch(e){}
  v67lPop(`📦 Em đang mang ${q.item} tới ${v67lZName(q.dest)} — đi theo dấu chân nhé!`);
}
function v67lCarryTick(){
  const J = V67J.job; if(!J) return; if(performance.now() - J.t0 > 600000){ V67J.job = null; v67lPop('📦 Hết giờ mang đồ rồi, lần sau em giúp tiếp nhé!'); return; }
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible || !V46.on) return; const p = v46Pos(PLAYER); if(Math.hypot(p[0] - J.pt[0], p[1] - J.pt[1]) < 110) v67lCarryDone();
}
function v67lCarryDone(){
  const J = V67J.job; if(!J) return; V67J.job = null; const s = v67lState(); s.cnt.carry++;
  const g = v67lAdd('teach', 2, 'v67lcarry' + Date.now(), true); V67L.self = 1; try { reward(15, 0, 'Giúp thầy cô mang đồ', true); } catch(e){} V67L.self = 0; v67lSave();
  try { cheerSfx(); } catch(e){} try { if(typeof GUIDE !== 'undefined' && GUIDE && GUIDE.name === v67lZName(J.dest)){ GUIDE = null; V32.nav = null; } } catch(e){}
  setTimeout(() => v67lPop(`💛 ${J.n}: “Cảm ơn em nhiều nhé! Em thật chu đáo.”${g ? ' +' + g + ' công 🧑‍🏫' : ''}`), 300);
}
// thùng đồ trên tay nhân vật (vẽ ngay sau người chơi)
function v67lBoxDraw(a){
  if(!V67J.job || a !== PLAYER || PLAYER.boat || PLAYER.v16fly) return; const P = v46Pos(a), x = Math.round(P[0]), y = Math.round(P[1]) - 15 - (a.moving ? (Math.floor(a.walk*3) % 2) : 0);
  ctx.save(); ctx.fillStyle = '#241a24'; ctx.fillRect(x - 8.5, y - 9.5, 17, 12); ctx.fillStyle = '#c98a4a'; ctx.fillRect(x - 8, y - 9, 16, 11); ctx.fillStyle = '#a8703a'; ctx.fillRect(x - 8, y - 4, 16, 1); ctx.fillStyle = '#f1d9a0'; ctx.fillRect(x - 1, y - 9, 2, 11);
  ctx.fillStyle = PLAYER.skin || '#f1c27d'; ctx.fillRect(x - 10, y - 3, 3, 3); ctx.fillRect(x + 7, y - 3, 3, 3);
  ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(V67J.job.ic, x, y - 3.5); ctx.restore();
}
function v67lTeachGo(){
  if(V67J.job){ const J = V67J.job; try { const o = v46ToOld(J.pt[0], J.pt[1] + 10); v32Nav(o[0], o[1], v67lZName(J.dest), false, () => v67lCarryDone()); } catch(e){} v67lPop(`📦 Mang ${J.item} tới ${v67lZName(J.dest)} nhé!`); return; }
  if(!V67J.req){ V67J.nextT = 0; v67lTeachTick(); }
  const q = V67J.req, t = q && V62K.T.find(x => x.id === q.tid); if(!t){ v67lPop('🧑‍🏫 Lát nữa sẽ có thầy cô cần giúp, em để ý bong bóng 📦 nhé!'); return; }
  try { v62kTouch(t); } catch(e){ v67lAsk(t); }
}

// ---------- 2. GIÚP PHÒNG TIN HỌC: máy hỏng mỗi ngày ----------
const V67L_FIXK = {cable:['🔌', 'Máy bị tuột dây', 'Cắm dây đúng màu'], dust:['🧽', 'Máy bám đầy bụi', 'Lau bụi màn hình'], reboot:['🔄', 'Máy bị treo', 'Khởi động lại đúng cách']};
function v67lIt(){
  const s = v67lState(); if(!s.it || s.it.d !== s.d){ const ks = ['cable', 'dust', 'reboot', ['cable', 'dust', 'reboot'][Math.floor(Math.random()*3)]], D = [4, 9];
    while(D.length < 4){ const i = Math.floor(Math.random()*12); if(!D.includes(i)) D.push(i); } s.it = {d:s.d, pcs:D.map((i, j) => ({i, k:ks[j], ok:0}))}; v67lSave(); }
  return s.it;
}
function v67lItSpots(){
  if(typeof V51T_SPOTS === 'undefined') return; for(let i = V51T_SPOTS.length - 1; i >= 0; i--) if(/^v67fix/.test(V51T_SPOTS[i].id)) V51T_SPOTS.splice(i, 1);
  const I = v67lIt(); I.pcs.forEach((p, j) => { const d = V51T_DESKS[p.i]; if(!d) return; const st = V51TI.st[p.i]; if(st) st.on = p.ok ? (p.i !== 4 && p.i !== 9) : false;
    if(!p.ok) V51T_SPOTS.push({id:'v67fix' + j, x:d.x, y:d.y + 62, r:50, ic:'🔧', vi:'Sửa máy ' + (p.i + 1), en:'Fix PC'}); });
}
function v67lItDraw(){
  if(typeof V51TI === 'undefined' || !V51TI.g) return; const I = v67lIt(), g = V51TI.g, z = V51TI.z, d = V51TI.dpr, cm = V51TI.cam, t = performance.now()/1000;
  g.setTransform(d*z, 0, 0, d*z, Math.round(d*(V51TI.W/2 - cm.x*z)), Math.round(d*(V51TI.H/2 - cm.y*z)));
  I.pcs.forEach(p => { if(p.ok) return; const D = V51T_DESKS[p.i]; if(!D) return; const x = D.x - 19, y = D.y - 37;
    if(p.k === 'reboot'){ g.fillStyle = '#0a0d18'; g.fillRect(x, y, 38, 26); g.fillStyle = '#3a6bff'; g.fillRect(x + 3, y + 3, 32, 20); g.fillStyle = '#fff'; g.fillRect(x + 8, y + 10, 22, 2); g.fillRect(x + 8, y + 15, 14, 2); }
    else if(p.k === 'dust'){ g.fillStyle = '#8f8676'; g.fillRect(x, y, 38, 26); g.fillStyle = 'rgba(200,190,170,.8)'; for(let k = 0; k < 14; k++) g.fillRect(x + (k*11) % 34, y + (k*7) % 22, 4, 3); }
    else { g.fillStyle = '#05070d'; g.fillRect(x, y, 38, 26); g.strokeStyle = '#ef4b4b'; g.lineWidth = 2; g.beginPath(); g.moveTo(D.x + 14, D.y - 8); g.quadraticCurveTo(D.x + 30, D.y + 4, D.x + 26, D.y + 16); g.stroke(); }
    const by = D.y - 52 + Math.sin(t*4 + p.i)*2; g.fillStyle = (Math.floor(t*2) % 2) ? '#ef4b4b' : '#ffb703'; g.beginPath(); g.moveTo(D.x, by - 10); g.lineTo(D.x + 9, by + 5); g.lineTo(D.x - 9, by + 5); g.closePath(); g.fill();
    g.fillStyle = '#1b1b1b'; g.fillRect(D.x - 1, by - 4, 2, 5); g.fillRect(D.x - 1, by + 2, 2, 2); });
  g.setTransform(d, 0, 0, d, 0, 0);
}
function v67lItGo(){
  if(typeof V51T !== 'undefined' && V51T.open) return; try { const G = v51tGeo(); v32Nav(G.door[0] + V46E, G.gy + 30, 'Trường Tin học', true, () => v51tOpen()); v67lPop('💻 Đang đi tới Trường Tin học…'); } catch(e){ try { v51tOpen(); } catch(er){} }
}
// ---------- mini game sửa máy (toàn màn hình) ----------
function v67lFixOpen(j){
  const I = v67lIt(), P = I.pcs[j]; if(!P || P.ok) return; const K = V67L_FIXK[P.k];
  let r = document.getElementById('v67lFix'); if(!r){ r = document.createElement('div'); r.id = 'v67lFix'; document.body.appendChild(r); }
  V67J.fix = {j, P}; document.body.classList.add('v67lFull');
  r.innerHTML = `<div class="v67fCard" role="dialog" aria-label="Sửa máy"><h2>${K[0]} Máy số ${P.i + 1}: ${K[1]}<button type="button" class="v67lX" aria-label="Đóng">✕</button></h2><p id="v67fTip"></p><div class="v67fPlay" id="v67fPlay"></div></div>`;
  r.hidden = false; r.querySelector('.v67lX').onclick = v67lFixClose;
  ({cable:v67lFixCable, dust:v67lFixDust, reboot:v67lFixReboot})[P.k](r.querySelector('#v67fPlay'), r.querySelector('#v67fTip'));
}
function v67lFixClose(){ const r = document.getElementById('v67lFix'); if(r){ r.hidden = true; r.innerHTML = ''; } V67J.fix = null; document.body.classList.remove('v67lFull'); }
function v67lFixWin(){
  const F = V67J.fix; if(!F) return; F.P.ok = 1; const s = v67lState(); s.cnt.fix++; v67lSave(); v67lItSpots();
  const g = v67lAdd('it', 2, 'v67lfix' + Date.now(), true); V67L.self = 1; try { reward(15, 0, 'Sửa máy phòng tin học', true); } catch(e){} V67L.self = 0;
  try { v51tSnd('win'); } catch(e){ try { cheerSfx(); } catch(er){} }
  const left = v67lIt().pcs.filter(p => !p.ok).length, box = document.getElementById('v67fPlay');
  if(box) box.innerHTML = `<div class="v67fDone"><b>🎉</b><p style="color:#fff;font-size:20px;font-weight:900">Máy số ${F.P.i + 1} chạy lại rồi!</p><p style="color:#cfe3ff">${g ? '💻 +' + g + ' công Giúp phòng tin học' : '💻 Hôm nay đã đủ công tin học'}${left ? ' · còn ' + left + ' máy hỏng' : ' · Phòng máy chạy tốt cả rồi! Báo cô Lam nhé 👩‍🏫'}</p><button type="button" class="v67lBtn g" style="margin-top:12px">👍 Xong</button></div>`;
  const b = box && box.querySelector('button'); if(b) b.onclick = v67lFixClose;
}
// a) cắm dây đúng màu: chạm đầu dây rồi chạm cổng cùng màu
function v67lFixCable(box, tip){
  const C = [['#ef4b4b', '🔌 Dây nguồn'], ['#3a86ff', '🖥️ Màn hình'], ['#9b5de5', '⌨️ Bàn phím'], ['#2fbf71', '🖱️ Chuột']], ports = C.map((c, i) => i).sort(() => Math.random() - .5);
  tip.innerHTML = 'Chạm một <b>đầu dây</b> (bên trái) rồi chạm <b>cổng cùng màu</b> phía sau máy (bên phải). Dây nguồn đỏ mang điện vào máy!';
  box.innerHTML = '<p class="v67fLbl">Đầu dây ➜ Cổng sau máy</p><div class="v67fCab">' + C.map((c, i) => `<button type="button" data-c="${i}" style="background:${c[0]}">${c[1]}</button><button type="button" class="port" data-p="${ports[i]}"><i style="background:${C[ports[i]][0]}"></i>Cổng ${C[ports[i]][1].split(' ').slice(1).join(' ')}</button>`).join('') + '</div><div class="v67fBar"><i></i></div>';
  let sel = null, n = 0; const bar = box.querySelector('.v67fBar i');
  box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if(b.classList.contains('ok')) return; box.querySelectorAll('[data-c]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; try { blipSfx(660); } catch(e){} });
  box.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if(!sel || b.classList.contains('ok')) return;
    if(sel.dataset.c === b.dataset.p){ sel.classList.add('ok'); b.classList.add('ok'); sel.classList.remove('sel'); sel = null; n++; bar.style.width = n*25 + '%'; try { blipSfx(1040); } catch(e){} if(n >= 4) setTimeout(v67lFixWin, 350); }
    else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); tip.innerHTML = '🤔 Chưa đúng màu! Nhìn kỹ <b>ô màu</b> ở cổng nhé.'; try { blipSfx(220); } catch(e){} } });
}
// b) lau bụi: chà ngón tay lên màn hình
function v67lFixDust(box, tip){
  tip.innerHTML = 'Dùng ngón tay <b>chà nhẹ</b> lên màn hình để lau sạch bụi. 💡 Nhớ: lau bằng khăn mềm, khô và tắt máy trước khi lau.';
  box.innerHTML = '<canvas class="v67fDust" width="480" height="300"></canvas><div class="v67fBar"><i></i></div>';
  const c = box.querySelector('canvas'), g = c.getContext('2d'), bar = box.querySelector('.v67fBar i');
  const scr = () => { const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, '#5ec8ff'); gr.addColorStop(1, '#2fbf71'); return gr; };
  const dust = document.createElement('canvas'); dust.width = 480; dust.height = 300; const dg = dust.getContext('2d', {willReadFrequently:true}); dg.fillStyle = '#9c9282'; dg.fillRect(0, 0, 480, 300);
  for(let i = 0; i < 900; i++){ dg.fillStyle = ['#b5ab98', '#857b6b', '#a69c8a'][i % 3]; dg.fillRect(Math.random()*480, Math.random()*300, 3 + Math.random()*8, 2 + Math.random()*5); }
  const paint = () => { g.fillStyle = scr(); g.fillRect(0, 0, 480, 300); g.fillStyle = '#fff'; g.font = '900 34px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText('🧊 Rubik OS', 240, 140); g.font = '800 20px Nunito, sans-serif'; g.fillText('Màn hình sạch bóng!', 240, 180); g.drawImage(dust, 0, 0); };
  paint(); let down = false, won = false, chk = 0;
  const rub = e => { if(!down || won) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left)/r.width*480, y = (e.clientY - r.top)/r.height*300;
    dg.globalCompositeOperation = 'destination-out'; dg.beginPath(); dg.arc(x, y, 34, 0, 7); dg.fill(); dg.globalCompositeOperation = 'source-over'; paint();
    if(++chk % 6 === 0){ const d = dg.getImageData(0, 0, 480, 300).data; let k = 0, n = 0; for(let i = 3; i < d.length; i += 64){ n++; if(d[i] > 40) k++; } const p = 1 - k/n; bar.style.width = Math.round(Math.min(1, p/.85)*100) + '%'; if(p > .85){ won = true; dg.clearRect(0, 0, 480, 300); paint(); setTimeout(v67lFixWin, 400); } } };
  c.addEventListener('pointerdown', e => { down = true; try { c.setPointerCapture(e.pointerId); } catch(er){} rub(e); }); c.addEventListener('pointermove', rub); ['pointerup', 'pointercancel'].forEach(ev => c.addEventListener(ev, () => { down = false; }));
}
// c) khởi động lại đúng thứ tự
function v67lFixReboot(box, tip){
  const S = ['💾 Lưu bài đang làm', '❎ Đóng các cửa sổ', '⏻ Tắt máy', '🔆 Bật máy lại'], order = S.map((s, i) => i).sort(() => Math.random() - .5);
  tip.innerHTML = 'Máy bị treo! Chạm các bước theo <b>đúng thứ tự</b> để khởi động lại an toàn (đừng để mất bài nhé).';
  box.innerHTML = '<p class="v67fLbl">Bước tiếp theo là gì?</p><div class="v67fSteps">' + order.map(i => `<button type="button" data-s="${i}">${S[i]}</button>`).join('') + '</div><div class="v67fBar"><i></i></div>';
  let n = 0; const bar = box.querySelector('.v67fBar i');
  box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { if(b.classList.contains('ok')) return;
    if(+b.dataset.s === n){ b.classList.add('ok'); n++; bar.style.width = n*25 + '%'; try { blipSfx(880 + n*120); } catch(e){} if(n >= 4){ tip.innerHTML = '🔆 Máy đang khởi động… Rubik OS đã sẵn sàng!'; setTimeout(v67lFixWin, 700); } }
    else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); tip.innerHTML = n === 0 ? '💡 Trước khi tắt máy phải <b>lưu bài</b> đã!' : '💡 Gợi ý: Lưu bài → Đóng cửa sổ → Tắt máy → Bật lại.'; try { blipSfx(220); } catch(e){} } });
}

// ---------- 3. móc vào game ----------
function v67lJobsInit(){
  // thầy cô
  if(typeof v62kDraw === 'function'){ const d0 = v62kDraw; v62kDraw = function(VBn){ const r = d0.apply(this, arguments); try { v67lTeachDraw(); } catch(e){} return r; }; }
  if(typeof v62kTouch === 'function'){ const t0 = v62kTouch; v62kTouch = function(t){ if(V67J.req && t && t.id === V67J.req.tid){ if(v62kPlayerD(t) < 170){ v67lAsk(t); return; }
    try { const o = v46ToOld(t.p[0] + 22, t.p[1] + 6); if(typeof v58tGo === 'function') v58tGo(o[0], o[1], () => v67lAsk(t)); else v32Nav(o[0], o[1], ' ', true, () => v67lAsk(t)); } catch(e){ v67lAsk(t); } return; } return t0.apply(this, arguments); }; }
  if(typeof v46DrawRaw === 'function'){ const r0 = v46DrawRaw; v46DrawRaw = function(a){ const r = r0.apply(this, arguments); try { v67lBoxDraw(a); } catch(e){} return r; }; }
  setInterval(() => { try { v67lTeachTick(); } catch(e){ console.warn('v67l teach', e); } }, 300);
  V67J.nextT = performance.now() + 25000;
  // phòng tin học
  if(typeof v51tOpen === 'function'){ const o0 = v51tOpen; v51tOpen = function(){ const r = o0.apply(this, arguments); try { v67lItSpots(); const n = v67lIt().pcs.filter(p => !p.ok).length; if(n) setTimeout(() => v67lPop(`⚠️ Phòng máy có ${n} máy bị hỏng — chạm máy có dấu ⚠️ để sửa!`), 1600); } catch(e){ console.warn('v67l it', e); } return r; }; }
  if(typeof v51tInDraw === 'function'){ const d1 = v51tInDraw; v51tInDraw = function(){ const r = d1.apply(this, arguments); try { v67lItDraw(); } catch(e){} return r; }; }
  if(typeof v51tSpot === 'function'){ const s0 = v51tSpot; v51tSpot = function(s){ const m = s && /^v67fix(\d+)$/.exec(s.id); if(m){ v67lFixOpen(+m[1]); return; } return s0.apply(this, arguments); }; }
  if(typeof v51tTeacher === 'function'){ const l0 = v51tTeacher; v51tTeacher = function(){ const r = l0.apply(this, arguments); try { v67lLam(); } catch(e){} return r; }; }
}
// cô Lam nhờ sửa máy / cảm ơn khi phòng máy chạy tốt
function v67lLam(){
  const c = document.querySelector('#v51tPan .v51tcard'); if(!c) return; const I = v67lIt(), left = I.pcs.filter(p => !p.ok).length, s = v67lState(), n = document.createElement('p'); n.className = 'v51tnote';
  n.style.cssText = 'background:#fff3c4;color:#3a2a00;border-radius:12px;padding:8px 10px;font-weight:800';
  if(left) n.innerHTML = `🔧 Cô Lam: “Hôm nay phòng máy có <b>${left} máy hỏng</b> (dấu ⚠️). Em giúp cô sửa nhé — mỗi máy được 2 công 💻!”`;
  else if(s.lam !== s.d){ s.lam = s.d; const g = v67lAdd('it', 1, 'v67llam' + s.d); v67lSave(); n.innerHTML = `💛 Cô Lam: “Cảm ơn em đã giúp phòng tin học! Máy nào cũng chạy tốt rồi.”${g ? ' (+1 công 💻)' : ''}`; }
  else n.innerHTML = '💛 Cô Lam: “Phòng máy chạy tốt cả rồi. Cảm ơn em nhé!”';
  const h = c.querySelector('h2'); if(h) h.after(n); else c.prepend(n);
}
