// ================= v73a · MÁY BAY: phản lực "Tia Lửa" (tăng tốc phụt lửa, đường bay tốc độ) + Khu Máy bay cỡ lớn =================
// Dựa trên v51p (lái, Hangar, mini game) + v57p (Sân bay Quốc tế Rubik, camera, góc sau đuôi). Chỉ bọc (gán lại) hàm cũ.
// Hình tự vẽ bằng code, không tên/hình hãng thật. Mọi tên toàn cục có tiền tố v73a / V73A.
const V73A_PHI = 1.618033988749895;
const V73A = {on:false, n0:0, spr:{}, fl:[], held:false, boost:false, en:1, lock:false, bk:0, zf:1, sx:0, sy:0, shk:0, thump:0, puffT:0, flT:0, gnd:true, lines:[], ui:{}, stands:[], Z:null, near:null, wT:0, rear:null};
// f = cỡ vẽ so với sprite 128px (máy bay cũ là sprite 64px ×1) · props = cánh quạt (toạ độ trong sprite) · noz = đuôi phụt lửa
const V73A_K = {
  jet73:     {f:.62, noz:[[9, 60], [9, 68]], size:'Vừa', rw:'Vừa'},
  jumbo73:   {f:1.36, size:'Rất lớn', rw:'Dài'},
  cargo73:   {f:1.3, props:[[93, 22], [93, 42], [93, 86], [93, 106]], size:'Rất lớn', rw:'Dài'},
  flyboat73: {f:1.24, props:[[93, 26], [93, 46], [93, 82], [93, 102]], size:'Lớn', rw:'Dài / mặt nước'}
};
const V73A_PLANES = [
  {id:'tialua', vi:'Tia Lửa', en:'Jet', kind:'jet73', lv:14, cost:650, vmax:600, vr:200, acc:150, turn:1.35, climb:230, sink:45, boost:true, desc:'Phản lực siêu tốc: giữ 🔥 Tăng tốc để lao vút đi, phụt lửa sau đuôi.'},
  {id:'bonong', vi:'Bồ Nông', en:'Flying Boat', kind:'flyboat73', lv:7, cost:350, vmax:250, vr:135, acc:34, turn:.85, climb:70, sink:24, water:true, big:true, desc:'Thủy phi cơ cỡ lớn 4 cánh quạt: cất, hạ cánh cả trên mặt nước.'},
  {id:'voisat', vi:'Voi Sắt', en:'Cargo', kind:'cargo73', lv:9, cost:450, vmax:290, vr:160, acc:30, turn:.7, climb:62, sink:26, big:true, desc:'Máy bay vận tải chở hàng to, nặng: cần đường băng dài để cất cánh.'},
  {id:'cavoi', vi:'Cá Voi Xanh', en:'Jumbo', kind:'jumbo73', lv:11, cost:550, vmax:340, vr:180, acc:32, turn:.65, climb:68, sink:30, big:true, desc:'Máy bay chở khách 2 tầng, 500 chỗ: to nhất sân bay, hạ cánh thật nhẹ nhé!'}
];
const V73A_GAME = {id:'speed', ic:'🔥', vi:'Đường bay tốc độ', en:'Speed Sky Track', desc:'Bay xuyên 16 vòng sáng trên trời nhanh nhất có thể. Mẹo: dùng 🔥 Tăng tốc!'};
const v73aCl = (v, a, b) => v < a ? a : v > b ? b : v;

// ---------- 1. sprite nhìn từ trên (mũi sang phải), 128×128, vẽ một lần ----------
function v73aSpr(kind, shadow){
  const key = kind + (shadow ? 's' : ''); if(V73A.spr[key]) return V73A.spr[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const col = x => shadow ? '#000' : x, R = (cl, x, y, w, h) => { g.fillStyle = col(cl); g.fillRect(x, y, w, h); };
  const P = (cl, pts) => { g.fillStyle = col(cl); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  const M = (cl, pts) => { P(cl, pts); P(cl, pts.map(p => [p[0], 128 - p[1]])); };   // đối xứng trên/dưới
  const E = (cl, x, y, rx, ry) => { g.fillStyle = col(cl); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  const body = (cl, x0, x1, hw, nose) => { g.fillStyle = col(cl); g.beginPath(); g.moveTo(x1 + nose, 64); g.quadraticCurveTo(x1 + nose*.4, 64 - hw, x1 - nose*.3, 64 - hw); g.lineTo(x0 + 4, 64 - hw); g.lineTo(x0, 64 - hw*.5); g.lineTo(x0, 64 + hw*.5); g.lineTo(x0 + 4, 64 + hw); g.lineTo(x1 - nose*.3, 64 + hw); g.quadraticCurveTo(x1 + nose*.4, 64 + hw, x1 + nose, 64); g.fill(); };
  if(kind === 'jet73'){   // Tia Lửa: cánh tam giác, mũi nhọn, 2 ống phụt
    M('#c9352a', [[86, 60], [40, 16], [28, 16], [30, 60]]); M('#ffb020', [[40, 16], [28, 16], [30, 22], [42, 22]]);
    M('#c9352a', [[104, 60], [96, 50], [91, 50], [93, 60]]);
    M('#9a2a22', [[30, 57], [16, 44], [12, 44], [16, 57]]);
    body('#ef4b33', 10, 104, 7, 20);
    if(!shadow){ R('#ffffff', 22, 63, 76, 2); M('#ffd23f', [[70, 40], [62, 46], [66, 46], [58, 54], [68, 46], [64, 46]]);
      E('#20304a', 100, 64, 10, 4); E('#7fd8ff', 102, 63, 6, 2.5); E('#ffffff', 104, 62.5, 2, 1);
      R('#9a2a22', 20, 54, 22, 3); R('#9a2a22', 20, 71, 22, 3); R('#3b3b46', 6, 58, 7, 5); R('#3b3b46', 6, 65, 7, 5); R('#6b6b74', 6, 59, 3, 3); R('#6b6b74', 6, 66, 3, 3); }
  } else if(kind === 'jumbo73'){   // Cá Voi Xanh: thân rộng, tầng trên ở mũi, 4 động cơ
    M('#dfe5ee', [[80, 57], [38, 7], [28, 7], [52, 57]]); M('#2f7ad8', [[38, 7], [28, 7], [30, 11], [40, 11]]);
    M('#dfe5ee', [[24, 59], [10, 40], [4, 40], [10, 59]]);
    for(const [x, y] of [[60, 36], [44, 18]]){ M('#c9ced8', [[x + 14, y - 3], [x, y - 3], [x, y + 3], [x + 14, y + 3]]); if(!shadow){ R('#3b4250', x + 12, y - 3, 2, 6); R('#3b4250', x + 12, 125 - y, 2, 6); } }
    body('#f4f6fb', 4, 108, 9, 16);
    if(!shadow){ R('#ffffff', 72, 58, 40, 12); R('#2f7ad8', 8, 69, 100, 3); R('#1d6fd1', 4, 62, 24, 4); for(let x = 16; x < 104; x += 6){ R('#5a8fd8', x, 56, 2, 2); R('#5a8fd8', x, 70, 2, 2); }
      for(let x = 76; x < 108; x += 5) R('#7aa8e8', x, 59, 2, 2); R('#20304a', 116, 61, 4, 6); R('#ffd23f', 40, 63, 18, 2); }
  } else if(kind === 'cargo73'){   // Voi Sắt: cánh thẳng gắn cao, 4 cánh quạt, đuôi chữ T, thân to
    M('#6f7e8e', [[24, 62], [24, 36], [12, 36], [12, 62]]);
    body('#8b99a8', 8, 108, 11, 12);
    M('#7d8b9a', [[82, 62], [80, 5], [64, 5], [60, 62]]); M('#ffd23f', [[80, 5], [64, 5], [64, 9], [80, 9]]);
    for(const y of [22, 42]){ M('#5b6573', [[92, y - 4], [74, y - 4], [74, y + 4], [92, y + 4]]); }
    if(!shadow){ R('#ffd23f', 16, 63, 88, 2); R('#3b4250', 8, 59, 8, 10); R('#20304a', 106, 60, 5, 8); R('#9fb0c2', 30, 56, 70, 2); R('#16a3b5', 40, 60, 20, 8); R('#ffffff', 44, 62, 12, 4); }
  } else if(kind === 'flyboat73'){   // Bồ Nông: thân thuyền, cánh cao, phao đầu cánh, 4 cánh quạt
    M('#e8eef5', [[24, 62], [24, 42], [14, 42], [14, 62]]); M('#f08c1e', [[24, 42], [14, 42], [14, 46], [24, 46]]);
    g.fillStyle = col('#f4f6fb'); g.beginPath(); g.moveTo(122, 64); g.quadraticCurveTo(112, 53, 96, 54); g.lineTo(12, 57); g.lineTo(8, 64); g.lineTo(12, 71); g.lineTo(96, 74); g.quadraticCurveTo(112, 75, 122, 64); g.fill();
    M('#e8eef5', [[80, 62], [80, 3], [62, 3], [60, 62]]); M('#f08c1e', [[80, 3], [62, 3], [62, 7], [80, 7]]);
    E('#f4f6fb', 70, 10, 12, 3.5); E('#f4f6fb', 70, 118, 12, 3.5);
    for(const y of [26, 46]){ M('#c9ced8', [[92, y - 4], [76, y - 4], [76, y + 4], [92, y + 4]]); }
    if(!shadow){ R('#f08c1e', 18, 63, 92, 2); R('#1d3557', 14, 70, 96, 2); R('#20304a', 108, 60, 5, 8); E('#f08c1e', 70, 10, 5, 1.5); E('#f08c1e', 70, 118, 5, 1.5); for(let x = 30; x < 96; x += 7) R('#7aa8e8', x, 58, 2, 2); }
  }
  V73A.spr[key] = c; return c;
}
// ảnh nhỏ 64px cho thẻ Hangar
function v73aThumb(kind){ const k = 't' + kind; if(V73A.spr[k]) return V73A.spr[k]; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(v73aSpr(kind), 0, 0, 64, 64); V73A.spr[k] = c; return c; }
// nhìn từ sau đuôi (góc nhìn sau đuôi v57p), 160×100
function v73aRear(kind){
  const key = 'r' + kind; if(V73A.spr[key]) return V73A.spr[key]; const c = document.createElement('canvas'); c.width = 160; c.height = 100; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const R = (cl, x, y, w, h) => { g.fillStyle = cl; g.fillRect(x, y, w, h); }, E = (cl, x, y, rx, ry) => { g.fillStyle = cl; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  if(kind === 'jet73'){ g.fillStyle = '#c9352a'; g.beginPath(); g.moveTo(10, 66); g.lineTo(80, 50); g.lineTo(150, 66); g.lineTo(150, 70); g.lineTo(10, 70); g.fill(); R('#ffb020', 10, 66, 14, 4); R('#ffb020', 136, 66, 14, 4);
    R('#9a2a22', 62, 22, 5, 34); R('#9a2a22', 93, 22, 5, 34); E('#ef4b33', 80, 58, 20, 14); E('#3b3b46', 72, 64, 7, 6); E('#3b3b46', 88, 64, 7, 6); E('#6b6b74', 72, 64, 4, 3.5); E('#6b6b74', 88, 64, 4, 3.5); E('#20304a', 80, 46, 8, 5); }
  else { const big = {jumbo73:['#f4f6fb', '#dfe5ee', '#2f7ad8'], cargo73:['#8b99a8', '#7d8b9a', '#ffd23f'], flyboat73:['#f4f6fb', '#e8eef5', '#f08c1e']}[kind] || ['#f4f6fb', '#dfe5ee', '#2f7ad8'], [b, w, t] = big, hi = kind !== 'jumbo73', wy = hi ? 40 : 60;
    R(w, 2, wy, 156, 7); R(t, 2, wy, 10, 7); R(t, 148, wy, 10, 7); R('rgba(0,0,0,.2)', 2, wy + 5, 156, 2);
    for(const x of [28, 54, 106, 132]){ E('#5b6573', x, wy + (hi ? 4 : 10), 6, 6); E('#c9ced8', x, wy + (hi ? 4 : 10), 4, 4); }
    if(kind === 'flyboat73'){ R('#9aa3b0', 14, wy + 6, 3, 18); R('#9aa3b0', 143, wy + 6, 3, 18); E(b, 15, wy + 26, 8, 4); E(b, 145, wy + 26, 8, 4); }
    E(b, 80, 58, 18, 18); E('rgba(0,0,0,.14)', 80, 66, 16, 10); R(b, 76, 8, 8, 44); R(t, 76, 8, 8, 10);
    if(kind === 'cargo73'){ R(w, 52, 8, 56, 6); R(t, 52, 8, 8, 6); R(t, 100, 8, 8, 6); R('#3b4250', 70, 66, 20, 8); } else { R(w, 50, 46, 60, 6); }
    if(kind === 'jumbo73') E('#ffffff', 80, 48, 12, 7); }
  V73A.spr[key] = c; return c;
}

// ---------- 2. khu Máy bay cỡ lớn: phía tây đường băng dài R1 (đã dò: đất trống, không đè khu nào) ----------
function v73aZone(){
  const A = V57P.A, X = x => x + A.ox, Y = y => y + A.oy, Z = {x0:X(1060), y0:Y(12220), x1:X(1762), y1:Y(14180)};
  Z.stands = [{id:'cavoi', x:X(1380), y:Y(12560)}, {id:'voisat', x:X(1380), y:Y(13200)}, {id:'bonong', x:X(1380), y:Y(13840)}];
  Z.stands.forEach((s, i) => { s.n = 'L' + (i + 1); s.hdg = 0; });
  Z.rw = A.rw[0]; return Z;
}
function v73aPaint(g, lo){
  const Z = V73A.Z; if(!Z) return; const F = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, w = Z.x1 - Z.x0, h = Z.y1 - Z.y0;
  F('rgba(0,0,0,.18)', Z.x0 + 10, Z.y0 + 12, w, h); F('#b4ae9f', Z.x0, Z.y0, w, h);
  for(const s of Z.stands) F('#8f8a80', s.x + 120, s.y - 30, Z.x1 + 70 - s.x - 120, 60);   // đường lăn ra R1
  if(lo) return;
  g.fillStyle = 'rgba(0,0,0,.07)'; for(let x = Z.x0; x < Z.x1; x += 70) g.fillRect(x, Z.y0, 2, h); for(let y = Z.y0; y < Z.y1; y += 70) g.fillRect(Z.x0, y, w, 2);
  F('#f2c230', Z.x0, Z.y0, w, 6); F('#f2c230', Z.x0, Z.y1 - 6, w, 6); F('#f2c230', Z.x0, Z.y0, 6, h);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for(const s of Z.stands){ F('#f2c230', s.x + 120, s.y - 2, Z.x1 + 70 - s.x - 120, 4);
    g.strokeStyle = '#ffcf3a'; g.lineWidth = 6; g.strokeRect(s.x - 210, s.y - 250, 420, 500); F('#ffcf3a', s.x - 200, s.y - 3, 320, 6); F('#ffcf3a', s.x + 150, s.y - 60, 6, 120);
    g.fillStyle = '#ffcf3a'; g.font = '900 64px Nunito, sans-serif'; g.fillText(s.n, s.x - 150, s.y - 196);
    // xe thang + thùng hàng trang trí
    F('rgba(0,0,0,.22)', s.x + 64, s.y - 236, 54, 30); F('#f2c230', s.x + 60, s.y - 240, 54, 30); F('#3b3b46', s.x + 98, s.y - 236, 12, 22); for(let k = 0; k < 4; k++) F('#cfd5de', s.x + 64 + k*8, s.y - 234, 4, 18);
    const cc = ['#e8453c', '#2f7ad8', '#2fae66']; for(let k = 0; k < 3; k++){ F('rgba(0,0,0,.2)', s.x - 186 + k*44, s.y + 196, 38, 34); F(cc[k], s.x - 190 + k*44, s.y + 192, 38, 34); F('rgba(255,255,255,.25)', s.x - 190 + k*44, s.y + 192, 38, 5); } }
  // biển tên dọc mép tây
  g.save(); g.translate(Z.x0 + 70, (Z.y0 + Z.y1)/2); g.rotate(-Math.PI/2); F('rgba(29,53,87,.92)', -560, -40, 1120, 80); F('#f2d24a', -560, -40, 1120, 6);
  g.fillStyle = '#fff'; g.font = '900 48px Nunito, sans-serif'; g.fillText('🛬 KHU MÁY BAY CỠ LỚN', 0, 6); g.restore();
}
function v73aStand(id){ const Z = V73A.Z; return Z ? Z.stands.find(s => s.id === id) : null; }
// máy bay lớn đậu ở ô L1–L3 (+ nhãn khi nhìn gần)
function v73aDrawParked(VBn){
  const Z = V73A.Z; if(!Z || Z.x0 - 400 > VBn.x1 || Z.x1 + 400 < VBn.x0 || Z.y0 - 400 > VBn.y1 || Z.y1 + 400 < VBn.y0) return;
  const flying = V51P.on && V51P.P ? V51P.P.pl.id : '';
  for(const s of Z.stands){ if(s.id === flying || s.x - 360 > VBn.x1 || s.x + 360 < VBn.x0 || s.y - 360 > VBn.y1 || s.y + 360 < VBn.y0) continue; const pl = v51pPlane(s.id);
    ctx.globalAlpha = .3; v51pDrawCraft(pl, s.x + 14, s.y + 18, 0, 0, 1.9, 0, true); ctx.globalAlpha = 1; v51pDrawCraft(pl, s.x, s.y, 0, 0, 1.9, 0, false);
    if(cam.z >= .3 && !V51P.on){ const un = v51pUnlocked(pl), fs = 17/Math.max(.7, cam.z), t = (un ? '✈️ ' : '🔒 ') + pl.vi + (un ? '' : ' · Lv ' + pl.lv + ' / $' + pl.cost); ctx.font = '800 ' + fs.toFixed(1) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(t).width + fs; ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(s.x - tw/2, s.y + 262 - fs*.8, tw, fs*1.6); ctx.fillStyle = un ? '#ffe9a8' : '#cfd5e8'; ctx.fillText(t, s.x, s.y + 262); } }
}

// ---------- 3. tăng tốc, lửa, vệt khói, rung camera ----------
function v73aPlane(){ return V51P.on && V51P.P ? V51P.P.pl : null; }
function v73aTick(dt){
  const P = V51P.P; if(!P || dt <= 0) return; const pl = P.pl, K = V73A_K[pl.kind];
  if(followCam) followCam = false;   // đang lái: camera bám máy bay (cốt truyện v70s từng bật lại followCam giữa chuyến bay)
  const want = !!(pl.boost && (V73A.held || V51P.k.boost) && !V73A.lock);
  if(want && P.ground && !V73A.gTip){ V73A.gTip = 1; v51pMsg('🔥 Cất cánh rồi mới tăng tốc được nhé!', 2.2); }
  const on = want && !P.ground && V73A.en > 0;
  if(on && !V73A.boost){ v73aWhoosh(); V73A.gTip = 0; }
  V73A.boost = on;
  if(on){ V73A.en = Math.max(0, V73A.en - dt/3.4); if(V73A.en <= 0){ V73A.lock = true; v51pMsg('♨️ Động cơ nóng! Chờ thanh lửa đầy lại một chút nhé.', 2.6); }
    P.spd += (pl.vmax*1.75 - P.spd)*Math.min(1, dt*2.2); V51P.thr = Math.max(V51P.thr, .9); }
  else { V73A.en = Math.min(1, V73A.en + dt/(pl.boost ? 6.5 : 1)); if(V73A.lock && V73A.en > .3) V73A.lock = false; }
  V73A.bk += ((on ? 1 : 0) - V73A.bk)*Math.min(1, dt*(on ? 3 : 1.4));
  // máy bay lớn chạm đất: bụi + rung nhẹ (nặng)
  if(pl.big && !V73A.gnd && P.ground){ V73A.thump = .45; for(let i = 0; i < 10; i++) v51pPuffAdd(P.x - Math.cos(P.hdg)*(10 + i*8) + (Math.random() - .5)*60, P.y - Math.sin(P.hdg)*(10 + i*8) + (Math.random() - .5)*60, 0, 1.2, false); }
  V73A.gnd = P.ground; V73A.thump = Math.max(0, V73A.thump - dt);
  V73A.shk += ((V73A.bk > .1 ? V73A.bk : 0) + V73A.thump*2 - V73A.shk)*Math.min(1, dt*6);
  // hạt lửa + vệt khói trắng
  if(K && K.noz && !P.ground && P.spd > 60){ const rate = on ? 70 : V51P.thr > .75 ? 14 : 0; V73A.flT -= dt; while(rate && V73A.flT <= 0){ V73A.flT += 1/rate; v73aFlame(P, K, on); }
    if(on && (V73A.puffT -= dt) <= 0){ V73A.puffT = .035; const sc = 1.3*(1 + P.alt/650)*K.f, off = 58*sc; v51pPuffAdd(P.x - Math.cos(P.hdg)*off, P.y - Math.sin(P.hdg)*off, P.alt, 1.7, false); } }
  const F = V73A.fl; for(let i = 0; i < F.length; i++){ const q = F[i]; if(q.l <= 0) continue; q.l -= dt; q.x += q.vx*dt; q.y += q.vy*dt; }
  v73aHudTick();
}
function v73aFlame(P, K, hot){
  const F = V73A.fl; let q = null; for(let i = 0; i < F.length; i++) if(F[i].l <= 0){ q = F[i]; break; } if(!q){ if(F.length >= 140) return; q = {}; F.push(q); }
  const sc = 1.3*(1 + P.alt/650)*K.f, c = Math.cos(P.hdg), s = Math.sin(P.hdg), n = K.noz[Math.random() < .5 ? 0 : 1], ox = (n[0] - 64)*sc, oy = (n[1] - 64)*sc, sp = hot ? 220 : 90, j = (Math.random() - .5)*.35;
  q.x = P.x + c*ox - s*oy; q.y = P.y + s*ox + c*oy - P.alt*.22; q.vx = -Math.cos(P.hdg + j)*sp; q.vy = -Math.sin(P.hdg + j)*sp; q.L = q.l = (hot ? .32 : .18) + Math.random()*.18; q.s = sc*(hot ? 1 : .6);
}
function v73aDrawFx(){
  const P = V51P.P; if(!P) return; const pl = P.pl, K = V73A_K[pl.kind]; if(!K || !K.noz) return;
  const F = V73A.fl, gO = v51pGlow('rgba(255,140,40,1)'), gY = v51pGlow('rgba(255,235,140,1)'); ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(let i = 0; i < F.length; i++){ const q = F[i]; if(q.l <= 0) continue; const a = q.l/q.L, r = (6 + 18*a)*q.s; ctx.globalAlpha = a*.9; ctx.drawImage(gO, q.x - r, q.y - r, r*2, r*2); if(a > .55){ ctx.globalAlpha = a*.8; ctx.drawImage(gY, q.x - r*.5, q.y - r*.5, r, r); } }
  // ngọn lửa liền ở ống phụt
  const fl = Math.max(V73A.bk, V51P.thr > .75 && !P.ground ? .3 : 0); if(fl > .05){ const D = v51pProj(P), sc = 1.3*(1 + P.alt/650)*K.f; ctx.translate(D[0], D[1]); ctx.rotate(P.hdg + (P.wob || 0));
    for(const n of K.noz){ const L = (30 + 40*fl + Math.sin(realT*40 + n[1])*6)*sc, y = (n[1] - 64)*sc, x = (n[0] - 64)*sc; ctx.globalAlpha = .85*fl; ctx.drawImage(gO, x - L, y - 7*sc, L, 14*sc); ctx.globalAlpha = .9*fl; ctx.drawImage(gY, x - L*.45, y - 4*sc, L*.5, 8*sc); } }
  ctx.restore();
}
// vạch tốc độ trên màn hình khi tăng tốc (16 vạch, tái sử dụng)
function v73aDrawLines(dt){
  const k = V73A.bk; if(k < .05 || !V51P.P) return; const L = V73A.lines, a = V51P.P.hdg; while(L.length < 16) L.push({x:Math.random(), y:Math.random(), v:.6 + Math.random()*.8});
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.strokeStyle = 'rgba(255,255,255,' + (.32*k).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); const c = Math.cos(a), s = Math.sin(a), mx = Math.max(cw, ch);
  for(const l of L){ l.x -= c*l.v*dt*1.6; l.y -= s*l.v*dt*1.6; if(l.x < -.1 || l.x > 1.1 || l.y < -.1 || l.y > 1.1){ l.x = .5 + c*.6 + (Math.random() - .5)*1.2*Math.abs(s) + (Math.random() - .5)*.2; l.y = .5 + s*.6 + (Math.random() - .5)*1.2*Math.abs(c) + (Math.random() - .5)*.2; }
    const x = l.x*cw, y = l.y*ch, d = Math.hypot(x - cw/2, y - ch/2); if(d < mx*.16) continue; const len = 40 + 60*l.v*k; ctx.moveTo(x, y); ctx.lineTo(x + c*len, y + s*len); }
  ctx.stroke();
}
function v73aWhoosh(){
  try { if(v51pVol() <= 0 || typeof ensureAC !== 'function') return; ensureAC(); if(!AC) return; const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    if(!V73A.nb){ const n = AC.sampleRate*.8, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for(let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*(1 - i/n); V73A.nb = b; }
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = V73A.nb; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + .5);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09*v51pVol(), t + .06); g.gain.exponentialRampToValueAtTime(.0001, t + .75); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + .8);
  } catch(e){}
}

// ---------- 4. HUD: nút "🔥 Tăng tốc" (chạm giữ) + thanh lửa ----------
function v73aHudAdd(){
  const h = document.getElementById('v51pHud'); if(!h || document.getElementById('v73aBoost')) return;
  const b = document.createElement('button'); b.type = 'button'; b.id = 'v73aBoost'; b.hidden = true; b.setAttribute('aria-label', 'Tăng tốc (chạm giữ)'); b.innerHTML = '<i></i><span>🔥</span><small>Tăng tốc</small>'; h.appendChild(b);
  let pid = null; const up = e => { if(pid !== null && e.pointerId !== pid) return; pid = null; V73A.held = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', e => { pid = e.pointerId; try { b.setPointerCapture(pid); } catch(er){} V73A.held = true; b.classList.add('on'); e.preventDefault(); e.stopPropagation(); });
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up); b.addEventListener('contextmenu', e => e.preventDefault());
}
function v73aHudTick(){
  const b = document.getElementById('v73aBoost'), pl = v73aPlane(), show = !!(pl && pl.boost); if(!b) return; if(b.hidden === show) b.hidden = !show; if(!show) return;
  const e = Math.round(V73A.en*100); if(b._e !== e){ b._e = e; b.style.setProperty('--e', e + '%'); } const st = V73A.lock ? 'hot' : V73A.boost ? 'on2' : ''; if(b._s !== st){ b._s = st; b.classList.toggle('hot', st === 'hot'); b.classList.toggle('on2', st === 'on2'); }
}
function v73aCss(){
  if(document.getElementById('v73aCss')) return; const s = document.createElement('style'); s.id = 'v73aCss';
  s.textContent = '#v73aBoost{position:absolute;right:calc(max(14px,env(safe-area-inset-right)) + 56px + 20px);bottom:calc(max(14px,env(safe-area-inset-bottom)) + 20px);width:89px;height:89px;border-radius:50%;border:3px solid rgba(255,255,255,.75);pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer;color:#fff;font:800 16px Nunito,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;background:radial-gradient(circle at 50% 40%,#ff9a3c,#d9381e 70%);box-shadow:0 5px 0 #8f2410,0 0 0 4px rgba(11,16,32,.45);padding:0;overflow:hidden}' +
    '#v73aBoost[hidden]{display:none!important}#v73aBoost i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(rgba(255,233,120,.0) 0 var(--e,100%),rgba(11,16,32,.62) var(--e,100%) 100%);pointer-events:none}' +
    '#v73aBoost span{position:relative;font-size:30px;line-height:1}#v73aBoost small{position:relative;font-size:16px;line-height:1.15;text-shadow:0 1px 2px rgba(0,0,0,.5)}' +
    '#v73aBoost.on{transform:translateY(3px);box-shadow:0 2px 0 #8f2410,0 0 26px 6px rgba(255,150,40,.75)}#v73aBoost.hot{filter:grayscale(.75) brightness(.8)}' +
    '#v73aNear{position:absolute;left:50%;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 96px);transform:translateX(-50%);z-index:35;min-height:52px;max-width:92vw;padding:10px 22px;border-radius:26px;border:0;background:#ffd23f;color:#1d2238;font:800 17px Nunito,sans-serif;box-shadow:0 4px 0 #c99a10;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#v73aNear[hidden]{display:none!important}' +
    '.v73aSec{grid-column:1/-1;margin:6px 2px 0;padding:8px 12px;border-radius:12px;background:linear-gradient(90deg,#2a1d3f,#1d2547);font-size:17px;font-weight:900;color:#ffe9a8}.v73aSec small{display:block;font-size:14px;font-weight:700;color:#9fb0d8}' +
    '.v73aSz{display:flex;flex-wrap:wrap;gap:4px 10px;margin:4px 0;font-size:14px;font-weight:800;color:#ffe9a8}.v51pCard.v73aBig canvas{background:#6e8a9e}.v51pCard.v73aJet canvas{background:#3d4f8f}' +
    '@media (max-width:520px),(orientation:landscape) and (max-height:500px){#v73aBoost{right:max(8px,env(safe-area-inset-right));bottom:calc(max(14px,env(safe-area-inset-bottom)) + 20px + 56px*2.618 + 40px)}}' +
    '@media (orientation:landscape) and (max-height:500px){#v73aBoost{width:72px;height:72px;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 20px + 56px*1.618 + 50px)}#v73aBoost span{font-size:24px}#v73aNear{bottom:84px}}';
  document.head.appendChild(s);
}
// Hangar: thêm cỡ / tốc độ / đường băng cho mọi thẻ, chia nhóm, thanh tốc độ theo thang 620
function v73aHangarDecor(){
  const p = document.getElementById('v51pPanel'); if(!p) return; const cards = p.querySelectorAll('.v51pCard'); if(cards.length !== V51P_PLANES.length) return;
  V51P_PLANES.forEach((pl, i) => { const c = cards[i], K = V73A_K[pl.kind], bars = c.querySelectorAll('.v51pBar i'); if(bars[0]) bars[0].style.width = Math.round(Math.min(1, pl.vmax/620)*100) + '%';
    const size = K ? K.size : pl.hover ? 'Nhỏ' : 'Nhỏ', rw = K ? K.rw : pl.hover ? 'Không cần' : pl.water ? 'Ngắn / mặt nước' : 'Ngắn', top = Math.round(pl.vmax*.8*(pl.boost ? 1.75 : 1));
    const d = document.createElement('div'); d.className = 'v73aSz'; d.innerHTML = '<span>⚡ ' + top + ' km/h</span><span>📏 Cỡ: ' + size + '</span><span>🛫 Đường băng: ' + rw + '</span>' + (pl.big ? '<span>📍 Đỗ ở Khu cỡ lớn ' + ((v73aStand(pl.id) || {}).n || '') + '</span>' : '');
    const pp = c.querySelector('.v51pCi p'); if(pp) pp.after(d); if(pl.big) c.classList.add('v73aBig'); if(pl.boost) c.classList.add('v73aJet');
    if(i === V73A.n0){ const h = document.createElement('div'); h.className = 'v73aSec'; h.innerHTML = '🔥 Phản lực tốc độ <small>Nút 🔥 Tăng tốc · Đường bay tốc độ trong 🎯 Mini game</small>'; c.before(h); }
    if(pl.big && !(V51P_PLANES[i - 1] || {}).big){ const h = document.createElement('div'); h.className = 'v73aSec'; h.innerHTML = '🛬 Máy bay cỡ lớn <small>Đỗ ở Khu Máy bay cỡ lớn — phía tây Đường băng dài, Sân bay Quốc tế Rubik</small>'; c.before(h); } });
}

// ---------- 5. mini game "Đường bay tốc độ": 12 vòng sáng trên trời, tính giờ, kỷ lục ----------
function v73aCourse(){
  const A = V57P.A, cx = A.ox + 1900, cy = A.oy + 11500, R = 3300, G = [], N = 16;
  for(let i = 0; i < N; i++){ const a = -Math.PI/2 + i*Math.PI*2/N, r = R*(1 + .16*Math.sin(a*3 + .6)), x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r*.8, alt = 300 + Math.round((1 + Math.sin(i*2.39996))*130);
    G.push({x, y, alt}); }
  G.forEach((g, i) => { const n = G[(i + 1) % N], p = G[(i + N - 1) % N]; g.a = Math.atan2(n.y - p.y, n.x - p.x); });
  return G;
}
function v73aSpeedStart(){
  v51pPanel(null); const G = v73aCourse(), g0 = G[0], b = Math.atan2(G[1].y - g0.y, G[1].x - g0.x), sx = g0.x - Math.cos(g0.a)*1400, sy = g0.y - Math.sin(g0.a)*1400, sp = [sx, sy, g0.a, g0.alt];
  if(!V51P.on){ if(!v51pBoard(v51pState().sel, sp)) return; }
  else { const P = V51P.P; P.x = sp[0]; P.y = sp[1]; P.hdg = sp[2]; P.alt = sp[3]; P.vs = 0; P.spd = P.pl.hover ? 80 : P.pl.vmax*.7; P.ground = false; P.tOff = realT - 30; V51P.thr = .7; }
  V51P.smoke.length = 0; V73A.en = 1; V73A.lock = false;
  let d = Math.hypot(g0.x - sx, g0.y - sy); for(let i = 1; i < G.length; i++) d += Math.hypot(G[i].x - G[i - 1].x, G[i].y - G[i - 1].y);
  const pl = V51P.P.pl, v = pl.boost ? pl.vmax*1.45 : pl.vmax*.95;
  V51P.mg = {id:'speed', t:0, cd:3, score:0, done:false, hud:0, G, N:G.length, i:0, pen:0, miss:0, near:false, par:d/v, tl:300, flash:0, b};
  v51pMsg('🔥 Đường bay tốc độ: bay xuyên 16 vòng sáng theo mũi tên vàng. Đúng độ cao ⛰️ mới tính!' + (pl.boost ? '' : ' (Mẹo: Tia Lửa có 🔥 Tăng tốc)'), 5); v51pMgHud(true);
}
function v73aSpeedTick(dt){
  const m = V51P.mg, P = V51P.P; if(!m || !P) return;
  if(m.cd > 0){ const c0 = Math.ceil(m.cd); m.cd -= dt; const c1 = Math.ceil(m.cd); if(c1 !== c0) v51pBeep(c1 > 0 ? 'ring' : 'up'); v51pMgHud(); return; }
  if(m.done) return; m.t += dt; if(m.t >= m.tl){ v73aSpeedFinish(); return; }
  const g = m.G[m.i]; if(!g) return v73aSpeedFinish(); const d = Math.hypot(P.x - g.x, P.y - g.y), da = Math.abs(P.alt - g.alt);
  if(d < 700) m.near = true;
  if(d < 170 && da < 190){ m.i++; m.near = false; m.flash = realT; v51pBeep('ring'); if(m.i >= m.N) return v73aSpeedFinish(); v51pMsg('✨ Vòng ' + m.i + '/' + m.N + ' · ' + (m.t + m.pen).toFixed(1) + ' giây', 1.6); }
  else if(d < 170 && da >= 190 && realT - (m.altT || 0) > 2.5){ m.altT = realT; v51pMsg(P.alt > g.alt ? '⬇️ Thấp xuống! Vòng ở ' + Math.round(g.alt*.6) + ' m' : '⬆️ Lên cao! Vòng ở ' + Math.round(g.alt*.6) + ' m', 2); }
  else if(m.near && d > 1100){ m.i++; m.near = false; m.miss++; m.pen += 3; v51pBeep('bad'); v51pMsg('↩️ Bỏ lỡ vòng · +3 giây', 2); if(m.i >= m.N) return v73aSpeedFinish(); }
  v51pMgHud();
}
function v73aSpeedHud(){
  const m = V51P.mg, e = document.getElementById('v51pMg'); if(!e || !m) return; e.hidden = false; const P = V51P.P, g = m.G[m.i]; let s;
  if(m.cd > 0) s = '<b class="v51pCd">' + Math.ceil(m.cd) + '</b>';
  else if(m.done) s = '<b>🏆 Về đích!</b>';
  else { const ok = g && P && Math.abs(P.alt - g.alt) < 190; s = '<b>🔥 Vòng ' + Math.min(m.N, m.i + 1) + '/' + m.N + '</b><span>⏱ ' + (m.t + m.pen).toFixed(1) + ' s</span>' + (g ? '<span>⛰️ Vòng ' + Math.round(g.alt*.6) + ' m ' + (ok ? '✅' : P.alt > g.alt ? '⬇️' : '⬆️') + '</span>' : '');
    const b = v51pState().best.speed; if(b != null) s += '<span>🏆 ' + b + ' s</span>'; }
  if(e._s !== s){ e._s = s; e.innerHTML = s; }
}
function v73aSpeedFinish(){
  const m = V51P.mg; if(!m || m.done) return; m.done = true; const fin = m.i >= m.N, T = Math.round((m.t + m.pen)*10)/10;
  const perf = fin ? v73aCl((m.par*1.8 - T)/(m.par*1.0), .25, 1) : m.i/m.N*.3, rec = fin ? v51pBest('speed', T, true) : {rec:false, best:v51pState().best.speed};
  const r = v51pReward('speed', perf, V73A_GAME.vi), stars = perf >= .9 ? 3 : perf >= .6 ? 2 : perf >= .25 ? 1 : 0; v51pBeep(stars >= 2 ? 'win' : 'ok');
  V51P.res = {g:V73A_GAME, line:fin ? '🔥 ' + V51P.P.pl.vi + ' · ' + T + ' giây' + (m.miss ? ' (bỏ lỡ ' + m.miss + ' vòng, +' + m.pen + ' s)' : ' · không bỏ vòng nào!') : '🔥 Chưa về đích (' + m.i + '/' + m.N + ' vòng)', stars, score:fin ? T + ' s' : '—', rec:rec.rec, best:rec.best == null ? null : rec.best + ' s', money:r.money, exp:r.exp};
  v51pMgHud(true); v51pPanel('result');
}
function v73aSpeedDraw(VBn, layer){
  const m = V51P.mg, P = V51P.P; if(!m || !P) return; const t = realT, gC = v51pGlow('rgba(90,230,255,1)'), gG = v51pGlow('rgba(255,215,90,1)');
  if(layer === 0){ ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 6; ctx.setLineDash([24, 26]); ctx.lineDashOffset = -t*60; ctx.beginPath();   // đường bay nối các vòng tiếp theo
    for(let k = m.i; k < Math.min(m.N, m.i + 4); k++){ const g = m.G[k], y = g.y - g.alt*.22; if(k === m.i) ctx.moveTo(g.x, y); else ctx.lineTo(g.x, y); } ctx.stroke(); ctx.restore(); }
  for(let k = m.N - 1; k >= m.i; k--){ const g = m.G[k], up = g.alt > P.alt; if((layer === 1) !== up) continue; const y = g.y - g.alt*.22, act = k === m.i;
    if(g.x < VBn.x0 - 400 || g.x > VBn.x1 + 400 || y < VBn.y0 - 400 || y > VBn.y1 + 400) continue;
    const pr = act ? 1 + Math.sin(t*6)*.06 : .92, rx = 26*pr, ry = 150*pr;
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(g.x + g.alt*.18, g.y + g.alt*.05, ry*.9, 26, g.a + Math.PI/2, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(g.x, y); ctx.rotate(g.a);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = act ? .75 : .3; ctx.drawImage(act ? gG : gC, -ry*.55, -ry*1.25, ry*1.1, ry*2.5); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.lineWidth = act ? 14 : 9; ctx.strokeStyle = act ? (Math.sin(t*8) > 0 ? '#fff6c0' : '#ffd23f') : 'rgba(150,235,255,.75)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = act ? '#ff8a1a' : 'rgba(29,53,87,.6)'; ctx.stroke(); ctx.restore();
    if(act){ const fs = Math.round(Math.max(18, 18/cam.z*.8)), s = (k + 1) + ' · ⛰️ ' + Math.round(g.alt*.6) + ' m'; ctx.font = '800 ' + fs + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(s).width + fs;
      ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(g.x - w/2, y - ry - 34 - fs*.75, w, fs*1.5); ctx.fillStyle = '#ffe9a8'; ctx.fillText(s, g.x, y - ry - 34); } }
  if(m.flash && realT - m.flash < .35){ const g = m.G[m.i - 1]; if(g && layer === 1){ const k = (realT - m.flash)/.35, y = g.y - g.alt*.22; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k; const r = 180 + k*260; ctx.drawImage(gG, g.x - r, y - r, r*2, r*2); ctx.restore(); } }
  if(layer === 1){ const g = m.G[m.i]; if(g){ const D = v51pProj(P), ty = g.y - g.alt*.22, a = Math.atan2(ty - D[1], g.x - D[0]); if(Math.hypot(g.x - D[0], ty - D[1]) > 260){ const r = 70/cam.z*.7, x = D[0] + Math.cos(a)*r, y = D[1] + Math.sin(a)*r, s = 1/cam.z;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1d2238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); } } }
}

// ---------- 6. đi bộ tới gần máy bay lớn: nút xem / lên ----------
function v73aNearTick(){
  const b = document.getElementById('v73aNear'); if(!b) return; let s = null;
  if(!V51P.on && V73A.Z && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible && !(typeof openModal !== 'undefined' && openModal)){ const p = v46Pos(PLAYER), Z = V73A.Z;
    if(p[0] > Z.x0 - 200 && p[0] < Z.x1 + 200 && p[1] > Z.y0 - 200 && p[1] < Z.y1 + 200){ let bd = 1e9; for(const st of Z.stands){ const d = Math.hypot(p[0] - st.x, p[1] - st.y); if(d < bd){ bd = d; s = st; } } if(bd > 330) s = null; } }
  V73A.near = s; const pn = document.getElementById('v51pPanel'), hide = !s || (pn && !pn.hidden);
  if(hide){ if(!b.hidden) b.hidden = true; return; } const pl = v51pPlane(s.id), un = v51pUnlocked(pl), t = un ? '🛫 Lên ' + pl.vi : '🔒 Xem ' + pl.vi + ' · Lv ' + pl.lv;
  if(b._t !== t){ b._t = t; b.textContent = t; } if(b.hidden) b.hidden = false;
}
function v73aNearGo(){
  const s = V73A.near; if(!s) return; const pl = v51pPlane(s.id); try { v32Wake(); } catch(e){}
  if(v51pUnlocked(pl)){ v51pState().sel = pl.id; v51pSave(); v51pBoard(pl.id); }
  else { v51pPanel('hangar'); const p = document.getElementById('v51pPanel'), i = V51P_PLANES.indexOf(pl), c = p && p.querySelectorAll('.v51pCard')[i]; if(c) try { c.scrollIntoView({block:'center'}); } catch(e){} }
}

// ---------- 7. khởi động: gắn vào v51p / v57p ----------
function v73aInit(){
  if(typeof V51P === 'undefined' || typeof V57P === 'undefined' || !V57P.on || !V57P.A) return;
  V73A.n0 = V51P_PLANES.length; V73A_PLANES.forEach(p => { if(!V51P_PLANES.some(q => q.id === p.id)) V51P_PLANES.push(p); });
  if(!V51P_GAMES.some(g => g.id === 'speed')) V51P_GAMES.push(V73A_GAME);
  V73A.Z = v73aZone(); V73A.on = true; v73aCss();
  const A = V57P.A, Z = V73A.Z;
  // khu mới vào danh sách chiếm chỗ của sân bay → dọn cây trang trí v52w, vẽ vào ô nền cache
  A.rects.push([Z.x0, Z.y0, Z.x1, Z.y1, 'v73a-big']); try { v57pTrim(); } catch(e){}
  const pt0 = v57pPaint; v57pPaint = function(g, lo){ pt0(g, lo); try { v73aPaint(g, lo); } catch(e){ console.warn('v73a paint', e); } };
  V57P.tiles.clear(); V57P.lo = null;
  // vẽ máy bay: sprite riêng cho 4 loại mới (máy bay lớn cỡ ×2–2.7)
  const dc0 = v51pDrawCraft; v51pDrawCraft = function(pl, x, y, hdg, bank, sc, spin, shadow){
    const K = V73A_K[pl.kind]; if(!K) return dc0.apply(this, arguments);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(hdg); const s = sc*K.f; ctx.scale(s, s*(1 - Math.abs(bank)*(pl.big ? .16 : .28))); ctx.drawImage(v73aSpr(pl.kind, shadow), -64, -64);
    if(!shadow && K.props){ ctx.fillStyle = 'rgba(220,225,235,.55)'; for(const p of K.props){ const L = spin > 0 ? 9 + Math.abs(Math.sin(spin*7 + p[1]))*2 : 7; if(spin > 0) ctx.fillRect(p[0] - 64, p[1] - 64 - L, 3, L*2); else { ctx.fillStyle = '#3b3b46'; ctx.fillRect(p[0] - 64, p[1] - 64 - L, 2, L*2); ctx.fillStyle = 'rgba(220,225,235,.55)'; } } }
    ctx.restore(); };
  const sp0 = v51pSprite; v51pSprite = function(kind, shadow){ return V73A_K[kind] ? (shadow ? v73aSpr(kind, true) : v73aThumb(kind)) : sp0.apply(this, arguments); };
  const rr0 = v57pRear; v57pRear = function(kind){ const K = V73A_K[kind]; if(!K) return rr0.apply(this, arguments); const base = v73aRear(kind);
    if(!K.noz || V73A.bk < .05) return base; if(!V73A.rear){ V73A.rear = document.createElement('canvas'); V73A.rear.width = 160; V73A.rear.height = 100; }
    const c = V73A.rear, g = c.getContext('2d'), k = V73A.bk; g.clearRect(0, 0, 160, 100); g.drawImage(base, 0, 0); g.globalCompositeOperation = 'lighter';
    for(const x of [72, 88]){ const r = 9 + k*10 + Math.sin(realT*40 + x)*2; g.globalAlpha = .9*k; g.drawImage(v51pGlow('rgba(255,140,40,1)'), x - r, 64 - r, r*2, r*2); g.drawImage(v51pGlow('rgba(255,235,140,1)'), x - r*.5, 64 - r*.5, r, r); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; return c; };
  // sân bay đảo cũ: không vẽ máy bay lớn trước hangar nhỏ
  const dg0 = v51pDrawGround; v51pDrawGround = function(){ const ex = V51P_PLANES.splice(V73A.n0); try { return dg0.apply(this, arguments); } finally { for(const p of ex) V51P_PLANES.push(p); } };
  // ô đỗ số 1: chỉ hiện máy bay nhỏ; máy bay lớn đỗ ở khu riêng
  const dl0 = v57pDrawLive; v57pDrawLive = function(VBn, dark){ const st = v51pState(), sel = st.sel, big = v51pPlane(sel).big; if(big) st.sel = 'canhen';
    try { dl0.apply(this, arguments); } finally { if(big) st.sel = sel; } try { v73aDrawParked(VBn); } catch(e){ console.warn('v73a parked', e); } };
  // lên máy bay lớn ở Sân bay Quốc tế: xuất phát ở ô L1–L3, mũi hướng ra đường băng dài
  const bd0 = v51pBoard; v51pBoard = function(id, air){
    const r = bd0.apply(this, arguments); const P = V51P.P;
    if(r && P && !air && P.pl.big && v57pInAp(P.x, P.y, 300)){ const s = v73aStand(P.pl.id); if(s){ P.x = s.x; P.y = s.y; P.hdg = 0; cam.x = P.x; cam.y = P.y; try { V57P_M.hdg = 0; } catch(e){}
      v51pMsg('🛬 ' + P.pl.vi + ' ở ô ' + s.n + ' · đẩy GA, lăn sang phải ra Đường băng dài, rẽ trái chạy thật xa rồi kéo ↑. Máy bay nặng nên cất cánh chậm!', 6); } }
    if(r){ V73A.en = 1; V73A.lock = false; V73A.held = false; V73A.gnd = V51P.P ? V51P.P.ground : true; V73A.fl.forEach(q => q.l = 0); if(P && P.pl.boost && !air) setTimeout(() => { if(V51P.on && V51P.P && V51P.P.pl.boost) v51pMsg('🔥 Tia Lửa: cất cánh xong thì CHẠM GIỮ nút 🔥 Tăng tốc (phím B) để lao vút đi!', 5); }, 6200); }
    return r; };
  const ex0 = v51pExit; v51pExit = function(){ const r = ex0.apply(this, arguments); if(!V51P.on){ V73A.zf = 1; V73A.sx = V73A.sy = 0; V73A.bk = 0; V73A.boost = false; V73A.held = false; } return r; };
  // vật lý + hiệu ứng sau mỗi bước bay
  const tk0 = v51pTick; v51pTick = function(dt){ tk0(dt); try { v73aTick(dt); } catch(e){ console.warn('v73a tick', e); } };
  // camera: máy bay lớn lùi xa hơn; tăng tốc thì kéo giãn tầm nhìn + rung nhẹ (bỏ phần cộng thêm của khung trước rồi mới tính, không trôi)
  const cm0 = v57pCam; v57pCam = function(dt){ if(V57P.camT === realT || !V51P.P) return cm0(dt);
    cam.z /= V73A.zf; cam.x -= V73A.sx; cam.y -= V73A.sy; cm0(dt); const pl = V51P.P.pl, zT = (pl.big ? .74 : 1)*(1 - .26*V73A.bk);
    V73A.zf += (zT - V73A.zf)*Math.min(1, dt*(V73A.bk > .1 ? 2.4 : 1.2)); const a = V73A.shk*3.2/cam.z; V73A.sx = (Math.random() - .5)*a; V73A.sy = (Math.random() - .5)*a;
    cam.z *= V73A.zf; cam.x += V73A.sx; cam.y += V73A.sy; };
  v51pCam = v57pCam;
  // lớp vẽ: lửa sau máy bay, vạch tốc độ trên màn hình
  const ov0 = v51pOverlay; v51pOverlay = function(dt){ ov0(dt); if(!V51P.on || !V46.VBn) return; try { ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z))); v73aDrawFx(); v73aDrawLines(dt); } catch(e){ console.warn('v73a fx', e); } };
  // cốt truyện v70s: không lia camera đi chỗ khác khi đang lái máy bay
  if(typeof v70sPan === 'function'){ const pa0 = v70sPan; v70sPan = function(){ if(V51P.on) return; return pa0.apply(this, arguments); }; }
  // mini game mới
  const ms0 = v51pMgStart; v51pMgStart = function(id){ if(id === 'speed') return v73aSpeedStart(); return ms0.apply(this, arguments); };
  const mt0 = v51pMgTick; v51pMgTick = function(dt){ if(V51P.mg && V51P.mg.id === 'speed') return v73aSpeedTick(dt); return mt0.apply(this, arguments); };
  const mh0 = v51pMgHud; v51pMgHud = function(force){ if(V51P.mg && V51P.mg.id === 'speed') return v73aSpeedHud(force); return mh0.apply(this, arguments); };
  const md0 = v51pMgDraw; v51pMgDraw = function(VBn, layer){ if(V51P.mg && V51P.mg.id === 'speed') return v73aSpeedDraw(VBn, layer); return md0.apply(this, arguments); };
  const mf0 = v51pMgFinish; v51pMgFinish = function(){ if(V51P.mg && V51P.mg.id === 'speed') return v73aSpeedFinish(); return mf0.apply(this, arguments); };
  // bảng Hangar / mini game
  const pn0 = v51pPanel; v51pPanel = function(kind){ const r = pn0.apply(this, arguments); try { if(kind === 'hangar') v73aHangarDecor();
      if(kind === 'games'){ const b = document.querySelector('#v51pPanel button[data-v="speed"]'), sm = b && b.parentNode.querySelector('small'); if(sm) sm.textContent = sm.textContent.replace(' điểm', ' giây'); } } catch(e){ console.warn('v73a panel', e); } return r; };
  // HUD + phím B/F tăng tốc
  const hb0 = v51pHudBuild; v51pHudBuild = function(){ hb0(); v73aHudAdd(); };
  const kb = (e, on) => { if(!V51P.on || (e.code !== 'KeyB' && e.code !== 'KeyF')) return; const t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; V51P.k.boost = on; e.preventDefault(); };
  addEventListener('keydown', e => kb(e, true), true); addEventListener('keyup', e => kb(e, false), true); addEventListener('blur', () => { V73A.held = false; });
  // nút khi đi bộ tới gần máy bay lớn
  const st = document.getElementById('stage') || document.body, nb = document.createElement('button'); nb.type = 'button'; nb.id = 'v73aNear'; nb.hidden = true; nb.onclick = e => { e.stopPropagation(); v73aNearGo(); }; st.appendChild(nb);
  setInterval(() => { try { v73aNearTick(); } catch(e){} }, 300);
  // bản đồ: điểm đến khu máy bay lớn
  if(typeof mapPlaces === 'function'){ const mp0 = mapPlaces; mapPlaces = function(){ const L = mp0(); if(!V46.on || !Array.isArray(L) || L.some(p => p.k === 'v73aBig')) return L; const s = Z.stands[0];
      L.push({k:'v73aBig', name:'Khu Máy bay cỡ lớn', x:(Z.x0 + Z.x1)/2, y:(Z.y0 + Z.y1)/2, ox:s.x + V46E, oy:s.y - 300, door:[s.x + V46E, s.y - 300], ic:'🛬', desc:'Cá Voi Xanh 2 tầng, Voi Sắt chở hàng, thủy phi cơ Bồ Nông', cat:'world', r:true}); return L; };
    try { if(typeof MAP !== 'undefined'){ MAP.places = null; MAP.places46 = null; } } catch(e){} }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v73a = {V73A, v73aCourse, v73aStand};
}
