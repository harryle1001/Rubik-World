// ================= v65c · 2/4 NỀN 11 KHU THIÊN NHIÊN: vẽ vào ô nền nướng sẵn (bọc v46Paint) — không tốn khung hình =================
// Mỗi khu vẽ trong toạ độ cũ (R[id]) sau khi cắt theo khung khu + dịch z.d (y như nền cũ của khu được dán lên đảo).
const V65C_FLW = {   // mẫu hoa pixel: o viền sẫm · c màu · l sáng · y nhụy vàng · b nhụy nâu · g cuống · G lá
  round:['.ooo.', 'oclco', 'ocyco', 'occco', '.oGo.'],
  daisy:['.o.o.', 'oclco', '.cyc.', 'oclco', '.oGo.'],
  sun:['..ooo..', '.occco.', 'ocbbbco', 'ocbbbco', 'ocbbbco', '.occco.', '..oGo..'],
  tulip:['o.o.o', 'oclco', 'occco', '.ooo.', '..G..'],
  spike:['.o.', 'oco', 'olo', 'oco', 'olo', '.g.', '.g.']
};
function v65cMix(a, b, k){ const h = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)], A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v)*k).toString(16).padStart(2, '0')).join(''); }
function v65cFlowerSpr(type, col){
  const T = V65C_FLW[type] || V65C_FLW.round;
  return v65cSpr('fl' + type + col, T[0].length, T.length, g => { const C = {o:v65cMix(col, '#1a0d08', .55), c:col, l:v65cMix(col, '#ffffff', .5), y:'#ffd23f', b:'#7a4a1a', g:'#3f7a2a', G:'#5aa03c'};
    T.forEach((row, j) => { for(let i = 0; i < row.length; i++){ const ch = row[i]; if(ch === '.') continue; g.fillStyle = C[ch]; g.fillRect(i, j, 1, 1); } }); });
}
const V65C_FLTYPE = {'Oải hương':'spike', 'Hướng dương':'sun', 'Tulip':'tulip', 'Cúc trắng':'daisy', 'Cúc họa mi':'daisy', 'Cúc vạn thọ':'round', 'Hoa hồng':'round', 'Cẩm tú cầu':'round', 'Hoa đào':'daisy', 'Hoa mai':'daisy', 'Dã quỳ':'sun', 'Hoa lan':'tulip', 'Mimosa':'round', 'Cát tường':'tulip'};

// ---------- mảnh chung ----------
function v65cGrass(g, x, y, w, h, lod, dark){
  const dong = v65cDong(); g.fillStyle = lod < 2 ? v64sPat(g, 'FL', 1, dong ? 13 : dark ? 7 : 4, 2) : dong ? '#f2f5f7' : dark ? '#74a334' : '#adbc3a'; g.fillRect(x, y, w, h);
}
function v65cTufts(g, x0, y0, x1, y1, lod, skip){   // búi cỏ, hoa nhỏ lấm tấm (chỉ khi nhìn gần)
  if(lod) return; const dong = v65cDong();
  for(let j = Math.floor(y0/64); j*64 < y1; j++) for(let i = Math.floor(x0/64); i*64 < x1; i++){ const hh = v65cHash(i*7 + 3, j*13 + 5) % 97, x = i*64 + (hh % 5)*9, y = j*64 + (hh % 7)*7;
    if(skip && skip(x + 8, y + 8)) continue;
    if(hh < 10) v64sT(g, 'FD', hh % 4, dong ? 3 : 2, x, y, 1, 1, 2);
    else if(hh < 14 && !dong) v64sT(g, 'FD', v65cThu() ? hh % 2 : v65cXuan() ? 3 : 4 + hh % 2, v65cThu() || v65cXuan() ? 0 : 2, x, y, 1, 1, 2); }
}
// lối đi: viền nâu + đá cuội (cob) / cát (sand)
function v65cPath(g, P, w, lod, sand){
  if(P.length < 2) return; g.lineJoin = 'round'; g.lineCap = 'round'; const path = () => { g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  path(); g.strokeStyle = '#4a3428'; g.lineWidth = w + 8; g.stroke();
  path(); g.strokeStyle = lod < 2 ? (sand ? v64sPat(g, 'FL', 1, 1, 2) : v64sPat(g, 'FI', 1, 13, 2)) : sand ? '#f2a35a' : '#e8c27a'; g.lineWidth = w; g.stroke();
  if(v65cDong()){ path(); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = w; g.stroke(); }
}
function v65cEll(g, cx, cy, rx, ry, fill){ g.fillStyle = fill; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); g.fill(); }
// bồn / thửa 9 mảnh theo ô 32px (FL: 0,3 cỏ sáng · 0,6 cỏ sẫm · 0,0 cát · 0,12 tuyết)
function v65cBed(g, x, y, wT, hT, row, lod){
  if(lod === 2){ g.fillStyle = {0:'#f2a35a', 3:'#adbc3a', 6:'#74a334', 9:'#ffc9a8', 12:'#f4f6f8'}[row] || '#74a334'; g.fillRect(x, y, wT*32, hT*32); return; }
  v64sNine(g, 'FL', 0, row, x, y, Math.max(2, wT), Math.max(2, hT));
}
// đất trồng (F: 0,7 đất viền cỏ) ; tuyết thì FL tuyết
function v65cSoil(g, x, y, wT, hT, lod){ if(v65cDong()) return v65cBed(g, x, y, wT, hT, 12, lod); if(lod === 2){ g.fillStyle = '#b8653c'; g.fillRect(x, y, wT*32, hT*32); return; } v64sNine(g, 'F', 0, 7, x, y, Math.max(2, wT), Math.max(2, hT)); }
function v65cLilySpr(v){ return v65cSpr('lily' + v, 12, 9, g => { v65cOval(g, 6, 4.5, 6, 4.5, '#2f6b2a'); v65cOval(g, 6, 4.5, 5, 3.5, v ? '#7cc04a' : '#5aa03c'); g.clearRect(6, 1, 1, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(3, 2, 2, 1); if(v === 2){ g.fillStyle = '#ff9ccf'; g.fillRect(8, 2, 2, 2); } }); }
function v65cLily(g, x, y, s){ if(v65cDong()) return; const L = v65cLilySpr(v65cHash(Math.round(x), Math.round(y)) % 3), k = s || 1; g.drawImage(L.cv, Math.round(x - 12*k), Math.round(y - 9*k), L.w*k, L.h*k); }
function v65cWaterPut(g, L, lod, col){ if(lod === 2){ g.fillStyle = v65cDong() ? '#cdeef5' : col || '#71ddee'; g.fillRect(L.x + 10, L.y + 10, L.s.w - 20, L.s.h - 20); return; } g.drawImage(L.s.cv, L.x, L.y, L.s.w, L.s.h); }
// cầu / sàn gỗ: ván dọc (đi ngang) hoặc ván ngang (đi dọc)
function v65cPlanks(g, x, y, w, h, vertical){
  g.fillStyle = '#2b1a10'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
  g.fillStyle = '#c47a3c'; g.fillRect(x, y, w, h); g.fillStyle = '#a65f2c';
  if(vertical){ for(let yy = y + 8; yy < y + h; yy += 10) g.fillRect(x, yy, w, 2); } else { for(let xx = x + 8; xx < x + w; xx += 10) g.fillRect(xx, y, 2, h); }
  g.fillStyle = '#e6a35c'; if(vertical) g.fillRect(x, y, 3, h); else g.fillRect(x, y, w, 3);
  if(v65cDong()){ g.fillStyle = 'rgba(255,255,255,.55)'; if(vertical) g.fillRect(x, y, w, 4); else g.fillRect(x, y, w, 5); }
}
function v65cRails(g, x0, x1, y){ g.fillStyle = '#2b1a10'; g.fillRect(x0, y - 2, x1 - x0, 5); g.fillStyle = '#8a5a35'; g.fillRect(x0, y - 1, x1 - x0, 2); for(let x = x0; x <= x1; x += 32){ g.fillStyle = '#2b1a10'; g.fillRect(x - 3, y - 8, 7, 12); g.fillStyle = '#9a6236'; g.fillRect(x - 1, y - 6, 3, 9); } }
// hàng rào gỗ thấp quanh khung (vẽ nền, cửa = [x0, x1] trên cạnh dưới)
function v65cFenceRect(g, x, y, w, h, gate){
  const O = '#2b1a10', post = (px, py) => { g.fillStyle = O; g.fillRect(px - 3, py - 14, 7, 16); g.fillStyle = '#9a6236'; g.fillRect(px - 1, py - 12, 3, 12); g.fillStyle = v65cDong() ? '#fff' : '#c99560'; g.fillRect(px - 2, py - 14, 5, 2); };
  const rail = (ax, ay, bx, by) => { g.strokeStyle = O; g.lineWidth = 5; g.beginPath(); g.moveTo(ax, ay - 8); g.lineTo(bx, by - 8); g.stroke(); g.strokeStyle = '#b37a48'; g.lineWidth = 2; g.stroke(); };
  const skip = px => gate && px > gate[0] && px < gate[1];
  for(let px = x; px < x + w; px += 24){ const nx = Math.min(x + w, px + 24); if(!skip(px + 12)) { rail(px, y, nx, y); rail(px, y + h, nx, y + h); } }
  for(let py = y; py < y + h; py += 24){ const ny = Math.min(y + h, py + 24); rail(x, py, x, ny); rail(x + w, py, x + w, ny); }
  for(let px = x; px <= x + w; px += 24){ post(px, y); if(!skip(px)) post(px, y + h); } for(let py = y + 24; py < y + h; py += 24){ post(x, py); post(x + w, py); }
}
function v65cRake(g, x, y, w, h, step){   // cát cào sóng (vườn thiền)
  g.fillStyle = v65cDong() ? '#dfe6ea' : '#d9c497';
  for(let yy = y + step/2; yy < y + h; yy += step) for(let xx = x; xx < x + w; xx += 4){ const o = Math.round(Math.sin(xx*.02 + yy*.05)*3); g.fillRect(xx, yy + o, 4, 2); }
}
function v65cRings(g, cx, cy, s){ g.strokeStyle = v65cDong() ? '#d6dee3' : '#cdb582'; g.lineWidth = 2; for(let k = 1; k < 4; k++){ g.beginPath(); g.ellipse(cx, cy, s + k*12, (s + k*12)*.6, 0, 0, Math.PI*2); g.stroke(); } }
function v65cLabel(g, x, y, t){   // bảng gỗ nhỏ sát đất (tên luống hoa…) — chữ Nunito 16px
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const w = Math.ceil(g.measureText(t).width) + 12;
  g.fillStyle = '#2b1a10'; g.fillRect(x - 1, y - 1, w + 2, 22); g.fillStyle = '#b97a45'; g.fillRect(x, y, w, 20); g.fillStyle = '#d99a5c'; g.fillRect(x, y, w, 3);
  g.fillStyle = '#fff6e0'; g.textBaseline = 'middle'; g.fillText(t, x + 6, y + 11); g.textBaseline = 'alphabetic';
}

// ---------- 1. HỒ CÂU THƯ GIÃN ----------
function v65cPaintPond(g, r, lod){
  const P = POND;
  v65cEll(g, P.cx, P.cy, P.rx + 46, P.ry + 42, '#4a3428'); v65cEll(g, P.cx, P.cy, P.rx + 42, P.ry + 38, lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a');
  if(v65cDong()) v65cEll(g, P.cx, P.cy, P.rx + 42, P.ry + 38, 'rgba(255,255,255,.45)');
  v65cEll(g, P.cx, P.cy, P.rx + 18, P.ry + 16, lod < 2 ? v64sPat(g, 'FL', 1, v65cDong() ? 13 : 4, 2) : '#adbc3a');
  const L = v65cLakeAt('pond', P.cx, P.cy, P.rx, P.ry); v65cWaterPut(g, L, lod);
  if(lod === 2) return;
  for(let i = 0; i < 14; i++){ const a = i*2.5, rr = .4 + (i % 5)*.1; v65cLily(g, P.cx + Math.cos(a)*P.rx*rr, P.cy + Math.sin(a)*P.ry*rr); }
  for(let i = 0; i < 10; i++){ const a = i*.63 + .3, x = P.cx + Math.cos(a)*(P.rx + 4), y = P.cy + Math.sin(a)*(P.ry + 4); if(y > P.cy + P.ry - 30 && Math.abs(x - P.cx) < 40) continue; if(!v65cDong()) v64sT(g, 'N', 10 + (i % 2), 10, x - 12, y - 18, 1, 1, 1.5); }
  v65cPlanks(g, P.cx - 16, P.cy + P.ry - 40, 32, 82, true);
  g.fillStyle = '#2b1a10'; [P.cx - 18, P.cx + 14].forEach(x => { g.fillRect(x, P.cy + P.ry - 44, 4, 10); });
  v64sSign(g, r.x + 84, r.y + r.h - 14, '🎣 Hồ câu thư giãn');
}
// ---------- 2. CÁNH ĐỒNG HOA ----------
const V65C_FIELD = [['#a77bd8', 'Oải hương'], ['#ffd23f', 'Hướng dương'], ['#ff6f91', 'Tulip'], ['#f4f4f4', 'Cúc trắng'], ['#ff8a2b', 'Cúc vạn thọ'], ['#e53950', 'Hoa hồng'], ['#7c9cff', 'Cẩm tú cầu']];
function v65cPaintField(g, r, lod){
  const dong = v65cDong(), X0 = 1600, X1 = 2620, MID = 2096;
  // lối giữa (dọc) + lối ngang dưới cùng
  v65cPath(g, [[MID + 14, r.y - 20], [MID + 14, r.y + r.h + 20]], 26, lod);
  V65C_FIELD.forEach(([col, nm], k) => {
    const y = -540 + k*74;
    [[X0, MID - 6], [MID + 34, X1]].forEach(([a, b]) => { const wT = Math.floor((b - a)/32);
      if(dong) v65cBed(g, a, y, wT, 2, 12, lod); else v65cSoil(g, a, y, wT, 2, lod);
      if(lod === 2 || (dong && k !== 3)) return;
      const s = v65cFlowerSpr(V65C_FLTYPE[nm] || 'round', col), bw = wT*32;
      for(let j = 0; j < 3; j++) for(let x = a + 8 + (j % 2)*8; x < a + bw - 12; x += 16){ const yy = y + 6 + j*17, hh = v65cHash(x, yy) % 5; g.drawImage(s.cv, x, yy - (hh % 2)*2, s.w, s.h); } });
    if(lod === 0) v65cLabel(g, X0 + 6, y + 44, nm);
  });
  if(lod === 2) return;
  v64sSign(g, MID - 96, r.y + r.h + 4, '🌼 Cánh đồng hoa');
}
// ---------- 3. VƯỜN HOA ĐÀ LẠT ----------
function v65cPaintGarden(g, r, lod){
  const dong = v65cDong();
  g.fillStyle = '#4a3428'; g.fillRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8); g.fillStyle = lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a'; g.fillRect(r.x, r.y, r.w, r.h);
  if(dong){ g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(r.x, r.y, r.w, r.h); }
  FLOWERS.forEach(([nm, col], k) => {
    const bx = r.x + 10 + (k % 4)*110, by = r.y + 22 + Math.floor(k/4)*78;
    const bloom = !dong || k === 6 || k === 7;
    v65cBed(g, bx - 2, by - 4, 3, 2, dong ? 12 : 6, lod); if(lod === 2) return;
    if(bloom){ const s = v65cFlowerSpr(V65C_FLTYPE[nm] || 'round', col); for(let j = 0; j < 3; j++) for(let i = 0; i < 9; i++) g.drawImage(s.cv, bx + 4 + i*10 + (j % 2)*4, by + 2 + j*17, s.w, s.h); }
    if(lod === 0){ g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.fillStyle = '#3a2416'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, bx + 46, by + 66); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
  });
  if(lod === 2) return;
  v64sSign(g, r.x + r.w/2 - 70, r.y - 8, '🌸 Vườn hoa Đà Lạt');
}
// ---------- 4. KHU PICNIC ----------
function v65cMat(g, x, y, col){
  g.fillStyle = '#2b1a10'; g.fillRect(x - 2, y - 2, 58, 40);
  for(let i = 0; i < 6; i++) for(let j = 0; j < 4; j++){ g.fillStyle = (i + j) % 2 ? '#fff6ea' : col; g.fillRect(x + i*9, y + j*9, 9, 9); }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, y + 32, 54, 4);
  // giỏ mây + bình nước
  g.fillStyle = '#2b1a10'; g.fillRect(x + 57, y + 9, 16, 14); g.fillStyle = '#c98a4a'; g.fillRect(x + 58, y + 10, 14, 12); g.fillStyle = '#a0662f'; for(let k = 0; k < 3; k++) g.fillRect(x + 58, y + 13 + k*3, 14, 1);
  g.fillStyle = '#2b1a10'; g.fillRect(x + 60, y + 4, 8, 6); g.fillStyle = '#ef4b4b'; g.fillRect(x + 61, y + 5, 6, 4);
}
function v65cPaintPicnic(g, r, lod){
  const dong = v65cDong(); v65cBed(g, r.x - 6, r.y - 6, Math.round((r.w + 12)/32), Math.round((r.h + 12)/32), dong ? 12 : 3, lod);
  if(lod === 2) return;
  for(let k = 0; k < 6; k++){ const bx = r.x + 14 + (k % 3)*86, by = r.y + 22 + Math.floor(k/3)*80; v65cMat(g, bx, by, ['#e53935', '#1e88e5', '#43a047'][k % 3]); }
  v64sSign(g, r.x + r.w/2, r.y - 8, '🧺 Khu picnic');
}
// ---------- 5. ĐẦM SEN ----------
function v65cPaintLotus(g, r, lod){
  const P = LOTUS, L = v65cLakeAt('lotus', P.cx, P.cy, P.rx, P.ry, 'sen'); v65cWaterPut(g, L, lod, '#62c9c4');
  if(lod === 2) return;
  for(let i = 0; i < 44; i++){ const a = i*2.4, rr = ((i*37) % 100)/100; v65cLily(g, P.cx + Math.cos(a)*P.rx*.85*rr, P.cy + Math.sin(a)*P.ry*.85*rr, .85 + (i % 3)*.15); }
  v65cPlanks(g, P.cx - 16, P.cy + P.ry - 34, 32, 60, true);
  v64sSign(g, r.x + 70, r.y + r.h - 2, '🪷 Đầm sen');
}
// ---------- 6. HỒ CÁ KOI & KHU CẮM TRẠI ----------
function v65cPaintLake(g, r, lod){
  const P = LAKE, x0 = P.cx - P.rx - 12, x1 = P.cx + P.rx + 12;
  // lối đông – tây nối hai đầu cầu với mép khu, lối nam xuống cổng
  v65cPath(g, [[r.x - 30, P.cy], [x0 + 8, P.cy]], 30, lod); v65cPath(g, [[x1 - 8, P.cy], [r.x + r.w + 30, P.cy]], 30, lod);
  const L = v65cLakeAt('lake', P.cx, P.cy, P.rx, P.ry); v65cWaterPut(g, L, lod);
  if(lod === 2){ g.fillStyle = '#c47a3c'; g.fillRect(x0, P.cy - 14, x1 - x0, 28); return; }
  [[-.5, .4], [.55, -.45], [-.2, -.6], [.3, .62], [-.7, -.1], [.75, .2]].forEach(([u, v]) => v65cLily(g, P.cx + u*P.rx, P.cy + v*P.ry));
  v65cPlanks(g, x0, P.cy - 15, x1 - x0, 30, false); v65cRails(g, x0, x1, P.cy - 15); v65cRails(g, x0, x1, P.cy + 17);
  // bếp lửa: vòng đá trước lều
  TENTS.forEach(([tx, ty], i) => { if(i % 2) return; const fx = tx + 30, fy = ty + 6; for(let k = 0; k < 7; k++){ const a = k/7*Math.PI*2; g.fillStyle = '#2b2430'; g.fillRect(fx + Math.cos(a)*9 - 3, fy + Math.sin(a)*5 - 2, 7, 5); g.fillStyle = '#9a9aa6'; g.fillRect(fx + Math.cos(a)*9 - 2, fy + Math.sin(a)*5 - 1, 5, 3); } g.fillStyle = '#3a2416'; g.fillRect(fx - 5, fy - 2, 10, 4); });
  v64sSign(g, r.x + 96, r.y + 34, '🐟 Hồ cá Koi & cắm trại');
}
// ---------- 7. VƯỜN THIỀN TĨNH TÂM ----------
function v65cPaintZen(g, r, lod){
  const dong = v65cDong(), sand = dong ? '#eef2f4' : '#ead9b0';
  g.fillStyle = '#4a3428'; v64sRound(g, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 26); g.fill(); g.fillStyle = '#9a9aa6'; v64sRound(g, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 24); g.fill();
  g.fillStyle = sand; v64sRound(g, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 20); g.fill();
  if(lod === 2) return;
  g.save(); v64sRound(g, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 20); g.clip(); v65cRake(g, r.x + 4, r.y + 130, r.w - 8, r.h - 140, 22); g.restore();
  // ba hòn đá giữa vòng cào
  [[r.x + 140, r.y + 160, 34], [r.x + 380, r.y + 260, 26], [r.x + 220, r.y + 430, 30]].forEach(([x, y, s]) => { g.fillStyle = sand; g.beginPath(); g.ellipse(x, y, s + 44, (s + 44)*.6, 0, 0, Math.PI*2); g.fill(); v65cRings(g, x, y, s); });
  // lối đá bước: từ chùa xuống cổng nam
  const cx = r.x + 320; for(let y = r.y + 150; y < r.y + r.h - 10; y += 30){ const o = Math.round(Math.sin(y*.03)*6); g.fillStyle = '#2b2430'; g.beginPath(); g.ellipse(cx + o, y, 17, 9, 0, 0, Math.PI*2); g.fill(); g.fillStyle = dong ? '#f4f6f8' : '#b9b4a8'; g.beginPath(); g.ellipse(cx + o, y - 1, 15, 7, 0, 0, Math.PI*2); g.fill(); }
  // nền chùa lát đá
  g.fillStyle = '#4a3428'; g.fillRect(cx - 110, r.y + 10, 220, 128); g.fillStyle = v64sPat(g, 'FI', 17, 1, 2); g.fillRect(cx - 106, r.y + 14, 212, 120); if(dong){ g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(cx - 106, r.y + 14, 212, 120); }
  // ao nhỏ
  const L = v65cLakeAt('zenpond', r.x + 400, r.y + 470, 90, 50); v65cWaterPut(g, L, lod);
  [[-40, -10], [10, 14], [40, -16], [-10, 20]].forEach(([u, v]) => v65cLily(g, r.x + 400 + u, r.y + 470 + v));
  // bồ đoàn thiền (6 phiến đá) + đệm ngồi của người thiền
  for(let k = 0; k < 6; k++){ const x = r.x + 120 + (k % 3)*90, y = r.y + 280 + Math.floor(k/3)*60; v65cBox(g, x, y, 40, 14, dong ? '#f2f2f2' : '#b9b4a8', '#2b2430'); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 1, y + 1, 38, 3); }
  V45A_ZEN.forEach(([dx, dy, monk]) => { const x = r.x + dx, y = r.y + dy; g.fillStyle = '#2b1a10'; g.beginPath(); g.ellipse(x, y, 14, 6, 0, 0, Math.PI*2); g.fill(); g.fillStyle = monk === 2 ? '#d98a3a' : '#8a5ac2'; g.beginPath(); g.ellipse(x, y - 1, 12, 4, 0, 0, Math.PI*2); g.fill(); });
  v64sSign(g, r.x + 70, r.y + r.h - 16, '🧘 Vườn thiền tĩnh tâm');
}
// ---------- 8. VƯỜN BÁCH THẢO & ĐÀI THIÊN VĂN ----------
function v65cPaintBotanic(g, r, lod){
  const P = typeof obsPlan === 'function' ? obsPlan(r) : null; if(!P) return;
  [['giant', 'radio'], ['giant', 'solar'], ['giant', 'dome'], ['giant', 'refr'], ['giant', 'deck'], ['deck', 'dome'], ['deck', 'radio']].forEach(([a, b]) => v65cPath(g, [[P[a].x, P[a].y + 40], [P[b].x, P[b].y + 40]], 20, lod));
  v65cPath(g, [[P.deck.x, P.deck.y + 40], [P.deck.x, r.y + r.h + 20]], 22, lod);
  if(lod === 2) return;
  // sân ngắm sao: sàn gỗ
  const dk = P.deck; v65cPlanks(g, dk.x - 110, dk.y - 6, 220, 46, false); v65cRails(g, dk.x - 110, dk.x + 110, dk.y - 6);
  // gương nhật quang quanh tháp mặt trời
  const so = P.solar; for(let k = 0; k < 6; k++){ const mx = so.x - 70 + (k % 3)*70, my = so.y + 70 + Math.floor(k/3)*28; g.fillStyle = '#2b2430'; g.fillRect(mx - 3, my - 1, 6, 12); g.fillRect(mx - 14, my - 10, 28, 13); g.fillStyle = '#81d4fa'; g.fillRect(mx - 12, my - 8, 24, 9); g.fillStyle = '#e1f5fe'; g.fillRect(mx - 10, my - 7, 8, 3); }
  v64sBoard(g, dk.x, dk.y + 46, '🔭 Sân ngắm sao');
  v64sSign(g, r.x + 90, r.y + r.h - 6, '🌿 Vườn bách thảo');
}
// ---------- 9. NÔNG TRẠI & SỞ THÚ ----------
const V65C_ZG = {savanna:[0, 0], grass:[0, 3], rock:[0, 9], sand:[0, 0], ice:[0, 12], pond:[0, 6], bamboo:[0, 6]};
function v65cPaintFarm(g, r, lod){
  if(typeof V45FL === 'undefined') return; const L = V45FL, dong = v65cDong(), gx = L.gx;
  // lối đất chính (cửa kho → cổng → giữa sở thú) + lối ngang sở thú
  v65cPath(g, [[gx, L.y + 200], [gx, L.y + L.h + 10]], 48, lod, true); v65cPath(g, [[L.x + 30, -137], [L.x + L.w - 30, -137]], 14, lod, true);
  // đồng cỏ cừu & dê
  g.fillStyle = '#4a3428'; g.beginPath(); g.ellipse(4455, -458, 124, 64, 0, 0, Math.PI*2); g.fill(); g.fillStyle = lod < 2 ? v64sPat(g, 'FL', 1, dong ? 13 : 7, 2) : '#74a334'; g.beginPath(); g.ellipse(4455, -458, 120, 60, 0, 0, Math.PI*2); g.fill();
  // vườn cây ăn trái: đất trồng
  v65cSoil(g, 4334, -390, 9, 4, lod);
  if(lod === 2){ g.fillStyle = '#b8473a'; g.fillRect(gx - 100, -530, 200, 180); return; }
  if(!dong) for(let k = 0; k < 18; k++){ const a = k*.9; v64sT(g, 'N', [0, 3, 6][k % 3], 11, 4455 + Math.cos(a)*(40 + k*3) - 8, -458 + Math.sin(a)*(18 + k) - 8, 1, 1, 1); }
  // sân chuồng ngoài: ngựa, bò, trâu, gà, heo (rào gỗ thấp + máng ăn)
  const pens = typeof V45_PENS !== 'undefined' ? V45_PENS : {};
  Object.entries(pens).forEach(([k, p]) => { if(k === 'goat') return; g.fillStyle = dong ? 'rgba(255,255,255,.35)' : k === 'pig' ? '#a8784a' : 'rgba(116,163,52,.55)'; g.fillRect(p.x, p.y, p.w, p.h); v65cFenceRect(g, p.x, p.y + 12, p.w, p.h - 12, [p.x + p.w/2 - 14, p.x + p.w/2 + 14]);
    const tx = p.x + p.w/2, ty = p.y + p.h - 14; v65cBox(g, tx - 22, ty - 4, 44, 9, dong ? '#e8e8e8' : '#c8a24a', '#2b1a10'); });
  if(pens.pig){ g.fillStyle = '#2b1a10'; g.beginPath(); g.ellipse(5110, -320, 28, 12, 0, 0, Math.PI*2); g.fill(); g.fillStyle = dong ? '#c8d8e0' : '#7a5a3a'; g.beginPath(); g.ellipse(5110, -320, 26, 10, 0, 0, Math.PI*2); g.fill(); }
  // sở thú: mỗi chuồng một nền + rào thấp
  (typeof V45_ZOO !== 'undefined' ? V45_ZOO : []).forEach(z => {
    const wT = Math.max(2, Math.round(z.w/32)), hT = Math.max(2, Math.round(z.h/32)), G = V65C_ZG[z.g] || [0, 3];
    g.save(); g.beginPath(); g.rect(z.x, z.y, z.w, z.h); g.clip(); v64sNine(g, 'FL', G[0], dong ? 12 : G[1], z.x, z.y, wT + 1, hT + 1); g.restore();
    if(z.g === 'rock') for(let k = 0; k < 3; k++) v64sT(g, 'N', 7 + (k % 2), 12, z.x + 10 + k*30, z.y + 10 + (k % 2)*6, 1, 1, 2);
    if(z.g === 'pond' || z.g === 'ice'){ const W2 = v65cLakeAt('zoo' + z.k, z.x + z.w*.56, z.y + z.h*.58, z.w*.3, z.h*.24); g.drawImage(W2.s.cv, W2.x, W2.y, W2.s.w, W2.s.h); }
    if(z.g === 'bamboo') for(let k = 0; k < 6; k++) v64sT(g, 'N', 10, 8 + (k % 2), z.x + 6 + k*18, z.y + 2, 1, 2, 1.25);
    v65cFenceRect(g, z.x, z.y + 6, z.w, z.h - 6, null);
  });
  // rào chính có cổng lớn
  const fy = L.fy, g0x = gx - 62, g1x = gx + 62; for(let x = L.x + 14; x < L.x + L.w - 18; x += 24){ if(x > g0x - 30 && x < g1x + 16) continue; const nx = Math.min(L.x + L.w - 18, x + 24); g.strokeStyle = '#2b1a10'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, fy - 8); g.lineTo(nx, fy - 8); g.stroke(); g.strokeStyle = '#b37a48'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#2b1a10'; g.fillRect(x - 3, fy - 16, 7, 18); g.fillStyle = '#9a6236'; g.fillRect(x - 1, fy - 14, 3, 14); }
  v64sSign(g, L.x + 120, L.y + L.h - 30, '🐄 Nông trại & sở thú');
}
// ---------- 10. KHU KHINH KHÍ CẦU ----------
function v65cPaintBpad(g, r, lod){
  const cx = r.x + r.w/2, cy = r.y + r.h/2 + 6, dong = v65cDong();
  v65cBed(g, r.x + 8, r.y + 8, Math.floor((r.w - 16)/32), Math.floor((r.h - 16)/32), dong ? 12 : 6, lod);
  g.save(); g.lineWidth = 34; g.strokeStyle = '#4a3428'; g.beginPath(); g.ellipse(cx, cy, 230, 52, 0, 0, Math.PI*2); g.stroke(); g.lineWidth = 26; g.strokeStyle = lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a'; g.stroke(); if(dong){ g.strokeStyle = 'rgba(255,255,255,.45)'; g.stroke(); } g.restore();
  if(lod === 2) return;
  // bệ đỗ tròn dưới mỗi khinh khí cầu
  for(let i = 0; i < 8; i++){ const a = i/8*Math.PI*2, x = cx + Math.cos(a)*230, y = cy + Math.sin(a)*52; g.fillStyle = '#2b2430'; g.beginPath(); g.ellipse(x, y + 2, 20, 8, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#c9c2b4'; g.beginPath(); g.ellipse(x, y + 1, 18, 6, 0, 0, Math.PI*2); g.fill(); }
  // sân bay giữa: vòng tròn chữ H
  g.fillStyle = '#2b2430'; g.beginPath(); g.ellipse(cx, cy, 46, 20, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#d9d2c3'; g.beginPath(); g.ellipse(cx, cy, 43, 17, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#ef4b4b'; g.fillRect(cx - 14, cy - 8, 5, 16); g.fillRect(cx + 9, cy - 8, 5, 16); g.fillRect(cx - 9, cy - 2, 18, 4);
  v64sSign(g, r.x + 70, r.y + r.h - 4, '🎈 Khinh khí cầu');
}
// ---------- 11. GÓC HỌA SĨ ----------
function v65cArtGeo(r){ return {
  path:v65cBez([r.x + r.w/2, r.y + r.h + 10], [r.x + 80, r.y + 270], [r.x + 200, r.y + 160], [r.x + 120, r.y + 40], 24),
  river:v65cBez([r.x + r.w + 14, r.y + 60], [r.x + 200, r.y + 110], [r.x + 250, r.y + 220], [r.x + 180, r.y + r.h + 14], 24) }; }
function v65cPaintArt(g, r, lod){
  const G = v65cArtGeo(r); v65cPath(g, G.path, 18, lod, true);
  const bx0 = r.x + 150, by0 = r.y + 40, w = r.w + 40, h = r.h + 30;
  const S = v65cWater('artriver', w, h, (x, y) => v65cLineD(G.river.map(p => [p[0] - bx0, p[1] - by0]), 10)(x, y));
  if(lod === 2){ g.strokeStyle = '#71ddee'; g.lineWidth = 16; g.beginPath(); G.river.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); return; }
  g.drawImage(S.cv, bx0, by0, S.w, S.h);
  if(!v65cDong()) for(let i = 0; i < 46; i++){ const x = r.x + 8 + (i*61) % (r.w - 16), y = r.y + 8 + (i*37) % (r.h - 16); if(v65cLineD(G.river, 22)(x, y) > 0 || v65cLineD(G.path, 16)(x, y) > 0) continue; const s = v65cFlowerSpr(['round', 'daisy', 'tulip'][i % 3], ['#ff6f91', '#ffd23f', '#ffffff', '#ba68c8', '#ff8a65'][i % 5]); g.drawImage(s.cv, x - 5, y - 5, s.w, s.h); }
  v64sSign(g, r.x + r.w/2 - 30, r.y + r.h - 4, '🎨 Góc họa sĩ');
}
const V65C_PAINT = {pond:v65cPaintPond, flowerfield:v65cPaintField, garden:v65cPaintGarden, picnic:v65cPaintPicnic, lotus:v65cPaintLotus, lake:v65cPaintLake, zen:v65cPaintZen, botanic:v65cPaintBotanic, farm:v65cPaintFarm, bpad:v65cPaintBpad, art:v65cPaintArt};
// ---------- vẽ cả khu vào ô nền ----------
function v65cPaintZones(g, x0, y0, w, h, lod){
  if(!V65C.on || typeof V64S === 'undefined' || !V64S.ok) return; const x1 = x0 + w, y1 = y0 + h;
  for(const id of V65C_IDS){ const z = v65cZ(id), r = v65cR(id); if(!z || !r || z.flip) continue; const n = z.n; if(n.x1 < x0 || n.x0 > x1 || n.y1 < y0 || n.y0 > y1) continue;
    g.save(); g.imageSmoothingEnabled = false; v46ClipZone(g, z, 0); g.translate(z.d[0], z.d[1]);
    try { const e = z.e, w = e.x1 - e.x0, h = e.y1 - e.y0, wT = Math.floor(w/32), hT = Math.floor(h/32), bx = e.x0 + Math.floor((w - wT*32)/2), by = e.y0 + Math.floor((h - hT*32)/2);
      // lề quanh khối = cỏ đảo (che nền cũ, liền mạch với cỏ ngoài khu)
      const se = S(); g.fillStyle = se.grass; g.fillRect(e.x0, e.y0, w, h);
      if(lod === 0){ g.fillStyle = se.grass2; for(let y = Math.floor(e.y0/20)*20; y < e.y1; y += 20){ const xs = Math.floor(e.x0/40)*40 + (((y/20) % 2 + 2) % 2)*20; for(let x = xs; x < e.x1; x += 40) g.fillRect(x, y, 20, 20); } }
      // khu = một khối cỏ NA bo góc có viền (giống khối đất trong Ninja Adventure)
      if(lod < 2) v65cBed(g, bx, by, wT, hT, v65cDong() ? 12 : 3, lod); else v65cGrass(g, bx, by, wT*32, hT*32, lod);
      g.save(); g.beginPath(); g.rect(bx + 16, by + 16, wT*32 - 32, hT*32 - 40); g.clip(); v65cTufts(g, bx, by, bx + wT*32, by + hT*32, lod); g.restore();
      V65C_PAINT[id](g, r, lod); }
    catch(err){ console.warn('v65c paint', id, err); }
    g.restore(); }
}
const v65cPaint0 = v46Paint;
v46Paint = function(g, x0, y0, w, h, lod){ v65cPaint0(g, x0, y0, w, h, lod); try { v65cPaintZones(g, x0, y0, w, h, lod); } catch(e){ console.warn('v65c paint', e); } };
