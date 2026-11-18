// ================= v51p · MÁY BAY 1/3: dữ liệu, lưu, sprite pixel art (tự vẽ bằng code), sân bay, đảo nhỏ =================
// Toạ độ: hệ "mới" của đảo tròn v46 (tâm đảo = V46L.CX, V46L.CY). Sân bay nằm trên dải cát phía nam đảo.
const V51P_PHI = 1.618;
const V51P = {on:false, P:null, k:{}, stick:{x:0, y:0}, thr:0, mg:null, spr:{}, cache:{}, smoke:[], rain:[], snd:null, guide:null, ui:{}, msgT:0, last:0, fps:60, fpsN:0, fpsT:0};
// sân bay (độ dời so với tâm đảo): đường băng dài 1120, rộng 64; tháp ở điểm vàng của đường băng (1120/φ)
const V51P_AP = {rx0:-560, rx1:560, ry:4960, rw:64, hangar:[-500, 4734, 210, 130], tower:[132, 4780], sock:[430, 4840], taxi:-395, park:[-395, 4890]};
// đảo nhỏ ngoài biển (giao bưu phẩm, hạ cánh trên đường băng ngắn); góc lệch 137.5° (góc vàng)
const V51P_ISL = [
  {id:'so',    vi:'Đảo Số Học',     ic:'🔢', a:-.35, r:6900, fact:'Đảo Số Học: 1 + 2 + 3 + … + 10 = 55. Mẹo: ghép 1+10, 2+9… được 5 cặp, mỗi cặp 11!'},
  {id:'chu',   vi:'Đảo Chữ Cái',    ic:'🔤', a:2.05, r:6900, fact:'Đảo Chữ Cái: tiếng Việt có 29 chữ cái. "Airplane" là máy bay, "airport" là sân bay.'},
  {id:'hinh',  vi:'Đảo Hình Học',   ic:'🔺', a:4.45, r:6900, fact:'Đảo Hình Học: tổng ba góc của một tam giác luôn bằng 180°.'},
  {id:'phep',  vi:'Đảo Phép Thuật', ic:'🌀', a:3.25, r:7000, fact:'Đảo Phép Thuật: cổng tới Học viện Phép thuật Rubik!', magic:true}
];
const V51P_PLANES = [
  {id:'canhen',     vi:'Cánh Én',      en:'Trainer',   kind:'trainer',  lv:1,  cost:0,   vmax:250, vr:120, acc:70,  turn:1.5, climb:120, sink:30, desc:'Máy bay tập lái, dễ điều khiển.'},
  {id:'haiau',      vi:'Hải Âu',       en:'Seaplane',  kind:'seaplane', lv:3,  cost:120, vmax:230, vr:115, acc:62,  turn:1.45, climb:105, sink:30, water:true, desc:'Thủy phi cơ: cất và hạ cánh trên mặt nước.'},
  {id:'chuonchuon', vi:'Chuồn Chuồn',  en:'Biplane',   kind:'biplane',  lv:5,  cost:150, vmax:200, vr:95,  acc:60,  turn:2.1, climb:110, sink:16, desc:'Cánh kép cổ: chậm, lượn rất xa, rẽ gắt.'},
  {id:'bangron',    vi:'Băng Rôn',     en:'Banner',    kind:'banner',   lv:6,  cost:180, vmax:215, vr:110, acc:60,  turn:1.4, climb:100, sink:26, desc:'Kéo băng rôn chữ học tập bay khắp đảo.'},
  {id:'saobang',    vi:'Sao Băng',     en:'Sport',     kind:'sport',    lv:9,  cost:300, vmax:380, vr:150, acc:95,  turn:1.3, climb:170, sink:42, desc:'Máy bay nhỏ hiện đại: nhanh nhất.'},
  {id:'chongchong', vi:'Chong Chóng',  en:'Helicopter',kind:'heli',     lv:12, cost:400, vmax:170, vr:0,   acc:70,  turn:1.9, climb:120, sink:0,  hover:true, desc:'Trực thăng: lên thẳng, đứng yên trên không, đậu mọi bãi đất.'}
];
const V51P_BANNERS = ['HỌC VUI MỖI NGÀY', '7 × 8 = 56', 'CHĂM CHỈ LÀ VUI', 'XIN CHÀO TRƯỜNG RUBIK', 'HELLO = XIN CHÀO'];
const v51pPlane = id => V51P_PLANES.find(p => p.id === id) || V51P_PLANES[0];
const v51pC = () => [V46L.CX, V46L.CY];
function v51pAp(dx, dy){ return [V46L.CX + dx, V46L.CY + dy]; }
function v51pIslPos(s){ return [V46L.CX + Math.cos(s.a)*s.r, V46L.CY + Math.sin(s.a)*s.r]; }

// ---------- lưu: trong hồ sơ người chơi (PROF.v51p), khách thì localStorage riêng ----------
function v51pDef(){ return {own:['canhen'], sel:'canhen', best:{}, flights:0, lands:0, day:{d:'', n:{}}}; }
function v51pState(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v51p) PROF.v51p = v51pDef(); const s = PROF.v51p; s.best = s.best || {}; s.own = s.own || ['canhen']; s.day = s.day || {d:'', n:{}}; return s; }
  if(!V51P.G){ let g = null; try { g = JSON.parse(localStorage.getItem('truong-v51p-guest') || 'null'); } catch(e){} V51P.G = Object.assign(v51pDef(), g || {}); } return V51P.G;
}
function v51pSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v51p-guest', JSON.stringify(v51pState())); } catch(e){} }
function v51pLevel(){ return (typeof PROF !== 'undefined' && PROF && PROF.level) || 1; }
function v51pUnlocked(p){ const s = v51pState(); return p.cost === 0 || v51pLevel() >= p.lv || s.own.includes(p.id); }
function v51pToday(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
// thưởng $1–$20 mỗi lượt, từ lượt 11 trong ngày chỉ còn một nửa
function v51pReward(id, perf, why){
  perf = Math.max(0, Math.min(1, perf || 0)); const s = v51pState(), t = v51pToday(); if(s.day.d !== t) s.day = {d:t, n:{}}; s.day.n[id] = (s.day.n[id] || 0) + 1;
  let money = Math.max(1, Math.min(20, Math.round(1 + perf*19))), exp = Math.round(8 + perf*32); if(s.day.n[id] > 10){ money = Math.max(1, Math.round(money/2)); exp = Math.round(exp/2); }
  try { if(typeof PROF !== 'undefined' && PROF) reward(exp, money, why || 'Bay máy bay', true); else if(typeof loginNudge === 'function') loginNudge(); } catch(e){}
  v51pSave(); return {money, exp};
}
function v51pBest(id, score, lowerBetter){
  const s = v51pState(), b = s.best[id], rec = b == null || (lowerBetter ? score < b : score > b); if(rec){ s.best[id] = Math.round(score*10)/10; v51pSave(); } return {rec, best:s.best[id]};
}

// ---------- sprite máy bay nhìn từ trên xuống, mũi hướng sang phải (vẽ một lần, cache) ----------
function v51pCv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function v51pSprite(kind, shadow){
  const key = kind + (shadow ? 's' : ''); if(V51P.spr[key]) return V51P.spr[key];
  const [c, g] = v51pCv(64, 64), R = (col, x, y, w, h) => { g.fillStyle = shadow ? '#000' : col; g.fillRect(x, y, w, h); };
  if(kind === 'trainer' || kind === 'banner' || kind === 'seaplane'){
    const body = kind === 'banner' ? '#ffd23f' : kind === 'seaplane' ? '#e8453c' : '#f4f6fb', wing = kind === 'banner' ? '#f08c1e' : kind === 'seaplane' ? '#f4f6fb' : '#2f7ad8', trim = kind === 'trainer' ? '#ef4b4b' : '#1d3557';
    if(kind === 'seaplane'){ R('#dfe6ee', 22, 14, 26, 6); R('#dfe6ee', 22, 44, 26, 6); R('#9aa6b4', 22, 19, 26, 1); R('#9aa6b4', 22, 49, 26, 1); R('#5a6676', 30, 20, 2, 6); R('#5a6676', 30, 38, 2, 6); }
    R(wing, 26, 6, 12, 52); R(trim, 26, 6, 12, 3); R(trim, 26, 55, 12, 3); R('rgba(0,0,0,.18)', 34, 6, 4, 52);
    R(body, 10, 28, 40, 8); R(body, 50, 29, 6, 6); R('#c9ced8', 10, 34, 40, 2); R(trim, 14, 30, 30, 2);
    R('#7fd0ff', 40, 29, 7, 6); R('#3a8fd0', 44, 30, 3, 4);
    R(wing, 6, 22, 8, 20); R(trim, 6, 22, 8, 2); R(trim, 6, 40, 8, 2); R(body, 4, 30, 6, 4);
    R('#3b3b46', 56, 30, 3, 4);
  } else if(kind === 'biplane'){
    R('#d6b06a', 24, 4, 14, 56); R('#b88a40', 24, 4, 14, 2); R('#b88a40', 24, 58, 14, 2); R('rgba(0,0,0,.25)', 34, 4, 4, 56);
    R('#e2c27e', 30, 8, 12, 48); R('#8a5a2a', 30, 14, 12, 1); R('#8a5a2a', 30, 49, 12, 1);
    for(const y of [12, 20, 42, 50]) R('#6a4422', 31, y, 1, 3);
    R('#c0392b', 8, 28, 44, 8); R('#922b21', 8, 34, 44, 2); R('#f4f6fb', 18, 30, 6, 4); R('#3a2a1a', 44, 29, 6, 6);
    R('#d6b06a', 4, 22, 10, 20); R('#c0392b', 2, 30, 6, 4); R('#4a4a52', 52, 29, 4, 6);
  } else if(kind === 'sport'){
    g.fillStyle = shadow ? '#000' : '#dfe4ec'; g.beginPath(); g.moveTo(26, 30); g.lineTo(36, 30); g.lineTo(30, 4); g.lineTo(24, 4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(26, 34); g.lineTo(36, 34); g.lineTo(30, 60); g.lineTo(24, 60); g.closePath(); g.fill();
    R('#e8453c', 24, 4, 6, 3); R('#e8453c', 24, 57, 6, 3);
    R('#f7f9fc', 8, 28, 46, 8); R('#c6ccd6', 8, 34, 46, 2); R('#1f6fd1', 12, 31, 36, 2);
    R('#20304a', 38, 29, 10, 6); R('#6fc3ff', 41, 30, 6, 3);
    g.fillStyle = shadow ? '#000' : '#dfe4ec'; g.beginPath(); g.moveTo(14, 30); g.lineTo(8, 18); g.lineTo(4, 18); g.lineTo(8, 30); g.fill(); g.beginPath(); g.moveTo(14, 34); g.lineTo(8, 46); g.lineTo(4, 46); g.lineTo(8, 34); g.fill();
    R('#f7f9fc', 54, 30, 4, 4); R('#e8453c', 58, 31, 2, 2);
  } else if(kind === 'heli'){
    R('#ffb020', 18, 24, 26, 16); R('#e08a10', 18, 36, 26, 4); R('#6fc3ff', 36, 26, 8, 12); R('#3a8fd0', 40, 27, 4, 10);
    R('#ffb020', 2, 30, 18, 4); R('#e08a10', 2, 33, 18, 1); R('#2c2c36', 0, 27, 4, 10);
    R('#3b3b46', 16, 20, 30, 2); R('#3b3b46', 16, 42, 30, 2);
  }
  V51P.spr[key] = c; return c;
}
// ---------- mây (một sprite mềm, vẽ bằng nhiều hình tròn, cache) ----------
function v51pCloud(){
  if(V51P.spr.cloud) return V51P.spr.cloud; const [c, g] = v51pCv(220, 110);
  const B = [[60, 64, 34], [100, 50, 44], [146, 60, 36], [178, 72, 24], [36, 76, 22], [118, 78, 30]];
  g.fillStyle = 'rgba(160,175,200,.55)'; B.forEach(b => { g.beginPath(); g.arc(b[0], b[1] + 8, b[2], 0, 7); g.fill(); });
  g.fillStyle = '#fff'; B.forEach(b => { g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill(); });
  V51P.spr.cloud = c; return c;
}
function v51pPuff(){
  if(V51P.spr.puff) return V51P.spr.puff; const [c, g] = v51pCv(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.6, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); V51P.spr.puff = c; return c;
}
function v51pGlow(col){
  const k = 'g' + col; if(V51P.spr[k]) return V51P.spr[k]; const [c, g] = v51pCv(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, col); gr.addColorStop(.35, col.replace(/[\d.]+\)$/, '.45)')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); V51P.spr[k] = c; return c;
}

// ---------- sân bay: vẽ một lần lên canvas riêng (đổi mùa thì vẽ lại) ----------
function v51pApImg(){
  const key = (typeof season === 'string' ? season : '') + '|ap'; if(V51P.cache.ap && V51P.cache.apk === key) return V51P.cache.ap;
  const A = V51P_AP, X0 = A.rx0 - 80, Y0 = 4690, w = A.rx1 - X0 + 80, h = 5040 - Y0, [c, g] = v51pCv(w, h), se = S();
  const R = (col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(Math.round(x - X0), Math.round(y - Y0), ww, hh); };
  // sân đỗ (apron) bê tông và đường lăn
  R('#b9b2a2', A.hangar[0] - 30, A.hangar[1] + A.hangar[3] - 6, 330, 70); R('#a8a191', A.hangar[0] - 30, A.hangar[1] + A.hangar[3] + 60, 330, 4);
  R('#9f988a', A.taxi - 22, A.hangar[1] + A.hangar[3], 44, A.ry - A.rw/2 - A.hangar[1] - A.hangar[3]);
  for(let y = A.hangar[1] + A.hangar[3] + 4; y < A.ry - A.rw/2; y += 18) R('#f2d24a', A.taxi - 2, y, 4, 9);
  // đường băng
  R('#3c3f46', A.rx0, A.ry - A.rw/2, A.rx1 - A.rx0, A.rw); R('#2f3238', A.rx0, A.ry - A.rw/2, A.rx1 - A.rx0, 3); R('#2f3238', A.rx0, A.ry + A.rw/2 - 3, A.rx1 - A.rx0, 3);
  R('#f4f4f0', A.rx0 + 4, A.ry - A.rw/2 + 5, A.rx1 - A.rx0 - 8, 2); R('#f4f4f0', A.rx0 + 4, A.ry + A.rw/2 - 7, A.rx1 - A.rx0 - 8, 2);
  for(let x = A.rx0 + 120; x < A.rx1 - 120; x += 52) R('#f4f4f0', x, A.ry - 2, 28, 4);
  for(const sx of [A.rx0 + 12, A.rx1 - 44]) for(let i = 0; i < 6; i++) R('#f4f4f0', sx, A.ry - A.rw/2 + 8 + i*9, 32, 5);   // vạch ngưỡng
  g.fillStyle = '#f4f4f0'; g.font = '700 20px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(A.rx0 + 80 - X0, A.ry - Y0); g.rotate(Math.PI/2); g.fillText('09', 0, 0); g.restore();
  g.save(); g.translate(A.rx1 - 80 - X0, A.ry - Y0); g.rotate(-Math.PI/2); g.fillText('27', 0, 0); g.restore();
  for(let x = A.rx0 + 140; x < A.rx0 + 300; x += 40){ R('#f4f4f0', x, A.ry - 16, 22, 6); R('#f4f4f0', x, A.ry + 10, 22, 6); }   // vạch chạm bánh
  // nhà chứa máy bay (hangar): mái vòm, tỷ lệ 1.618
  const [hx, hy, hw, hh] = A.hangar;
  R('rgba(0,0,0,.18)', hx + 8, hy + 10, hw, hh); R('#8b99a8', hx, hy, hw, hh);
  for(let i = 0; i < hh; i += 8) R(i % 16 ? '#9aa8b6' : '#7d8b9a', hx, hy + i, hw, 4);
  R('#6a7684', hx, hy, hw, 6); R('#5b6573', hx + hw/V51P_PHI - 2, hy, 4, hh);
  R('#2d3440', hx + 26, hy + hh - 10, hw - 52, 10); R('#f2d24a', hx + 26, hy + hh - 12, hw - 52, 2);
  g.fillStyle = '#ffffff'; g.font = '800 22px Nunito, sans-serif'; g.fillText('HANGAR', hx + hw/2 - X0, hy + hh/2 - 6 - Y0);
  // tháp điều khiển (nhìn từ trên: chân vuông, cabin kính bát giác)
  const [tx, ty] = A.tower; R('rgba(0,0,0,.2)', tx - 18 + 10, ty - 18 + 10, 40, 40); R('#d9d4c7', tx - 20, ty - 20, 40, 40); R('#bdb6a6', tx - 20, ty + 14, 40, 6);
  g.fillStyle = '#2b5f86'; g.beginPath(); for(let i = 0; i < 8; i++){ const a = i*Math.PI/4 + Math.PI/8; g.lineTo(tx - X0 + Math.cos(a)*17, ty - Y0 + Math.sin(a)*17); } g.fill();
  g.fillStyle = '#8fd3ff'; g.beginPath(); for(let i = 0; i < 8; i++){ const a = i*Math.PI/4 + Math.PI/8; g.lineTo(tx - X0 + Math.cos(a)*12, ty - Y0 + Math.sin(a)*12); } g.fill();
  R('#e8e4da', tx - 6, ty - 6, 12, 12); R('#ef4b4b', tx - 1, ty - 1, 3, 3);
  // bảng tên
  R('#1d3557', hx + hw + 20, hy + 6, 150, 34); R('#f2d24a', hx + hw + 20, hy + 6, 150, 3);
  g.fillStyle = '#ffffff'; g.font = '800 17px Nunito, sans-serif'; g.fillText('SÂN BAY RUBIK', hx + hw + 95 - X0, hy + 25 - Y0);
  V51P.cache.ap = c; V51P.cache.apk = key; V51P.cache.apX = X0; V51P.cache.apY = Y0; return c;
}
// ---------- đảo nhỏ (cache theo mùa) ----------
function v51pIslImg(s){
  const key = 'isl' + s.id + (typeof season === 'string' ? season : ''); if(V51P.cache[key]) return V51P.cache[key];
  const [c, g] = v51pCv(760, 760), se = S(), C = 380, circ = (r, col) => { g.fillStyle = col; g.beginPath(); g.arc(C, C, r, 0, 7); g.fill(); };
  circ(370, 'rgba(191,243,255,.35)'); circ(330, se.sand); circ(268, se.grass); g.fillStyle = se.grass2 || se.grass;
  for(let i = 0; i < 70; i++){ const a = i*2.39996, r = Math.sqrt((i*37 % 97)/97)*250; g.fillRect(C + Math.cos(a)*r, C + Math.sin(a)*r, 6, 6); }
  // đường băng ngắn
  g.fillStyle = '#3c3f46'; g.fillRect(C - 230, C + 120, 460, 46); g.fillStyle = '#f4f4f0'; for(let x = C - 190; x < C + 190; x += 44) g.fillRect(x, C + 141, 24, 4);
  // bãi đáp & hộp thư
  g.fillStyle = '#f2d24a'; g.beginPath(); g.arc(C, C - 40, 90, 0, 7); g.fill(); g.fillStyle = se.grass; g.beginPath(); g.arc(C, C - 40, 80, 0, 7); g.fill();
  g.fillStyle = '#ef4b4b'; g.fillRect(C - 14, C - 56, 28, 24); g.fillStyle = '#fff'; g.fillRect(C - 10, C - 50, 20, 4);
  // cây dừa
  for(let i = 0; i < 9; i++){ const a = i*.7 + 1, r = 200 + (i % 3)*18, x = C + Math.cos(a)*r, y = C + Math.sin(a)*r - (Math.sin(a) > .3 ? 60 : 0);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 6, y + 6, 22, 10, 0, 0, 7); g.fill(); g.fillStyle = '#2f8a45'; for(let k = 0; k < 5; k++){ const b = k*1.256; g.beginPath(); g.ellipse(x + Math.cos(b)*12, y + Math.sin(b)*12, 15, 6, b, 0, 7); g.fill(); } g.fillStyle = '#7a4b2a'; g.fillRect(x - 3, y - 3, 6, 6); }
  if(s.magic){ // lâu đài nhỏ + cổng phép (ý tưởng riêng, vẽ bằng khối)
    g.fillStyle = '#9aa0b4'; g.fillRect(C - 70, C - 210, 140, 70); g.fillStyle = '#7d8398'; g.fillRect(C - 70, C - 150, 140, 10);
    for(const tx of [-80, 60]){ g.fillStyle = '#8a90a6'; g.fillRect(C + tx, C - 236, 24, 96); g.fillStyle = '#5b3fa8'; g.beginPath(); g.moveTo(C + tx - 4, C - 236); g.lineTo(C + tx + 12, C - 270); g.lineTo(C + tx + 28, C - 236); g.fill(); }
    ['#ffd23f', '#ef4b4b', '#3da5ff', '#43c463', '#ffffff', '#f08c1e'].forEach((col, i) => { g.fillStyle = col; g.fillRect(C - 30 + (i % 3)*20, C - 200 + Math.floor(i/3)*20, 16, 16); });
  }
  g.font = '800 30px Nunito, sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(11,16,32,.72)'; const w = g.measureText(s.ic + ' ' + s.vi).width + 30; g.fillRect(C - w/2, C + 190, w, 44); g.fillStyle = '#ffe9a8'; g.fillText(s.ic + ' ' + s.vi, C, C + 222);
  V51P.cache[key] = c; return c;
}
// mặt đất dưới máy bay: 'runway' | 'land' | 'water'
function v51pSurface(x, y){
  const C = v51pC(), A = V51P_AP, dx = x - C[0], dy = y - C[1], r = Math.hypot(dx, dy);
  if(dx > A.rx0 && dx < A.rx1 && Math.abs(dy - A.ry) < A.rw/2 + 4) return 'runway';
  for(const s of V51P_ISL){ const p = v51pIslPos(s), ix = x - p[0], iy = y - p[1]; if(Math.abs(ix) < 230 && iy > 116 && iy < 170) return 'runway'; if(Math.hypot(ix, iy) < 300) return 'land'; }
  if(r < V46L.ISLAND - 30) return 'land'; return 'water';
}
function v51pIslAt(x, y, rad){ for(const s of V51P_ISL){ const p = v51pIslPos(s); if(Math.hypot(x - p[0], y - p[1]) < (rad || 330)) return s; } return null; }
// vẽ sân bay + đảo nhỏ trên nền (gọi ngay sau lớp bờ biển của v46)
function v51pDrawGround(VBn){
  const C = v51pC(), img = v51pApImg(), ax = C[0] + V51P.cache.apX, ay = C[1] + V51P.cache.apY;
  if(ax < VBn.x1 && ax + img.width > VBn.x0 && ay < VBn.y1 && ay + img.height > VBn.y0) ctx.drawImage(img, ax, ay);
  for(const s of V51P_ISL){ const p = v51pIslPos(s); if(p[0] + 380 < VBn.x0 || p[0] - 380 > VBn.x1 || p[1] + 380 < VBn.y0 || p[1] - 380 > VBn.y1) continue; ctx.drawImage(v51pIslImg(s), p[0] - 380, p[1] - 380); }
  // máy bay đang đậu trước hangar (không phải chiếc đang lái)
  if(ax < VBn.x1 && ax + img.width > VBn.x0 && ay < VBn.y1 && ay + img.height > VBn.y0){
    const st = v51pState(), A = V51P_AP; let i = 0;
    for(const p of V51P_PLANES){ if(!v51pUnlocked(p) || (V51P.on && V51P.P && V51P.P.pl.id === p.id)) continue; if(i >= 4) break;
      const x = C[0] + A.hangar[0] + 40 + i*62, y = C[1] + A.hangar[1] + A.hangar[3] + 32; i++; v51pDrawCraft(p, x, y, -Math.PI/2, 0, .9, 0, false); }
  }
}
// ống gió (động, theo gió thời tiết) + đèn đường băng ban đêm — vẽ sau lớp ánh sáng
function v51pDrawApLive(VBn, dark){
  const C = v51pC(), A = V51P_AP; if(C[0] + A.rx1 + 100 < VBn.x0 || C[0] + A.rx0 - 100 > VBn.x1 || C[1] + 4690 > VBn.y1 || C[1] + 5040 < VBn.y0) return;
  const w = (typeof WEATHERS !== 'undefined' && WEATHERS[weather]) ? WEATHERS[weather].wind : 0, sx = C[0] + A.sock[0], sy = C[1] + A.sock[1], ang = V51P.windA || 0, len = 10 + Math.min(1, .25 + w)*26;
  ctx.fillStyle = '#6b6b74'; ctx.fillRect(sx - 2, sy - 34, 4, 34); ctx.save(); ctx.translate(sx, sy - 34); ctx.rotate(ang + Math.sin(realT*3)*.15*(1 - Math.min(1, w)));
  for(let i = 0; i < 4; i++){ ctx.fillStyle = i % 2 ? '#ffffff' : '#ff6a1a'; ctx.fillRect(i*len/4, -5 + i*.8, len/4 + 1, 10 - i*1.6); } ctx.restore();
  if(dark > .05){
    const k = Math.min(1, dark*2.2), gw = v51pGlow('rgba(255,236,150,1)'), gr = v51pGlow('rgba(255,70,60,1)'), gg = v51pGlow('rgba(80,255,120,1)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
    for(let x = A.rx0 + 10; x <= A.rx1 - 10; x += 70){ const px = C[0] + x; if(px < VBn.x0 - 20 || px > VBn.x1 + 20) continue; for(const yy of [A.ry - A.rw/2 - 6, A.ry + A.rw/2 + 6]) ctx.drawImage(gw, px - 8, C[1] + yy - 8, 16, 16); }
    for(let i = 0; i < 5; i++){ ctx.drawImage(gg, C[0] + A.rx0 - 8, C[1] + A.ry - 26 + i*13 - 8, 16, 16); ctx.drawImage(gr, C[0] + A.rx1 - 8, C[1] + A.ry - 26 + i*13 - 8, 16, 16); }
    const seq = Math.floor(realT*8) % 6; ctx.drawImage(gw, C[0] + A.rx0 - 60 - seq*30 - 14, C[1] + A.ry - 14, 28, 28);   // đèn chạy dẫn hướng
    ctx.drawImage(v51pGlow('rgba(120,200,255,1)'), C[0] + A.tower[0] - 20, C[1] + A.tower[1] - 20, 40, 40);
    if(Math.sin(realT*2.5) > .6) ctx.drawImage(gr, C[0] + A.tower[0] - 10, C[1] + A.tower[1] - 10, 20, 20);
    ctx.restore();
  }
  if(cam.z >= .35 && !V51P.on){ const fs = 17/Math.max(.7, cam.z), x = C[0] + A.hangar[0] + A.hangar[2]/2, y = C[1] + A.hangar[1] - 30;
    ctx.font = '800 ' + fs.toFixed(1) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const s = '✈️ Sân bay · Máy bay', tw = ctx.measureText(s).width + fs;
    ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(x - tw/2, y - fs*.8, tw, fs*1.6); ctx.fillStyle = '#ffe9a8'; ctx.fillText(s, x, y); }
}
// vẽ một chiếc máy bay: (x,y) vị trí vẽ, hdg hướng, bank nghiêng (-1..1), sc tỉ lệ, prop chong chóng quay, shadow
function v51pDrawCraft(pl, x, y, hdg, bank, sc, spin, shadow){
  const img = v51pSprite(pl.kind, shadow); ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(hdg); ctx.scale(sc, sc*(1 - Math.abs(bank)*.28));
  if(pl.kind === 'banner' && !shadow && V51P.on && V51P.P && V51P.P.pl === pl && V51P.P.alt > 5) v51pBanner(pl);
  ctx.drawImage(img, -32, -32);
  if(!shadow){
    if(pl.kind === 'heli'){ ctx.strokeStyle = 'rgba(40,40,50,.55)'; ctx.lineWidth = 3; const a = spin*1.0; for(let i = 0; i < 4; i++){ const b = a + i*Math.PI/2; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(Math.cos(b)*34, Math.sin(b)*34); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,210,225,.18)'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#2c2c36'; ctx.fillRect(-3, -3, 6, 6); }
    else if(spin > 0){ ctx.fillStyle = 'rgba(220,225,235,.5)'; const L = 10 + Math.abs(Math.sin(spin*7))*3; ctx.fillRect(27, -L, 3, L*2); }
    else { ctx.fillStyle = '#3b3b46'; ctx.fillRect(27, -8, 2, 16); }
  }
  ctx.restore();
}
function v51pBanner(){
  const P = V51P.P, txt = V51P_BANNERS[(P.bn || 0) % V51P_BANNERS.length], w = 18 + txt.length*13;
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(-70, 0); ctx.stroke();
  for(let i = 0; i < w; i += 6){ const yy = Math.sin(realT*9 - i*.08)*2.2; ctx.fillStyle = (i/6) % 2 ? '#fff7e0' : '#fff2cc'; ctx.fillRect(-70 - i - 6, -13 + yy, 6, 26); }
  ctx.save(); ctx.translate(-70 - w/2, 0); if(Math.cos(P.hdg) < 0) ctx.rotate(Math.PI); ctx.fillStyle = '#c0392b'; ctx.font = '800 17px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 1); ctx.restore();
}
