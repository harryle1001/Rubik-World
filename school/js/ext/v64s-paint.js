// ================= v64s · 2/5 NỀN KHUÔN VIÊN: vẽ vào ô nền nướng sẵn của đảo (v46Paint) — không tốn khung hình =================
// Bọc v46Paint lúc nạp file (trước các lớp v48c/v53c… bọc trong init) → hào nước, tháp vẫn vẽ đè lên trên nền mới.
const v64sDong = () => season === 'dong', v64sThu = () => season === 'thu', v64sXuan = () => season === 'xuan';
// khối 3×3 kiểu Ninja Adventure (góc, cạnh, giữa) phủ wT×hT ô 32px
function v64sNine(g, k, c0, r0, x, y, wT, hT, s){
  s = s || 2; const t = 16*s;
  for(let j = 0; j < hT; j++) for(let i = 0; i < wT; i++){ const c = c0 + (i === 0 ? 0 : i === wT - 1 ? 2 : 1), r = r0 + (j === 0 ? 0 : j === hT - 1 ? 2 : 1); v64sT(g, k, c, r, x + i*t, y + j*t, 1, 1, s); }
}
// sprite nhỏ dùng nhiều lần (cây theo mùa, ghế, đèn…) → canvas cache
function v64sSpr(key, w, h, draw){
  let c = V64S.spr[key]; if(c) return c;
  c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  try { draw(g); } catch(e){ console.warn('v64s spr', key, e); } V64S.spr[key] = c; return c;
}
function v64sTint(g, w, h, col){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
function v64sTreeSpr(kind, v){
  const se = season;
  if(kind === 'old') return v64sSpr('old' + se, 144, 144, g => { const c = {xuan:0, ha:3, thu:9, dong:6}[se]; v64sT(g, 'N', c == null ? 3 : c, 18, 0, 0, 3, 3, 3); });
  if(kind === 'pine') return v64sSpr('pine' + se + (v % 2), 72, 100, g => {
    if(V64S.img.TS){ g.drawImage(V64S.img.TS, (v % 2)*192 + 36, 0, 120, 182, 0, 0, 66, 100); if(se === 'dong') v64sTint(g, 72, 70, 'rgba(255,255,255,.55)'); }
    else v64sT(g, 'N', se === 'dong' ? 8 : 2, 0, 4, 36, 2, 2, 2); });
  return v64sSpr('tree' + se + (v % 3), 64, 64, g => {
    if(se === 'dong') v64sT(g, 'N', 12, 0, 0, 0, 2, 2, 2);
    else if(se === 'xuan' && v % 3 === 0) v64sT(g, 'N', 14, 0, 0, 0, 2, 2, 2);
    else { v64sT(g, 'N', v % 3 === 1 ? 16 : 0, 0, 0, 0, 2, 2, 2); if(se === 'thu') v64sTint(g, 64, 46, v % 3 ? 'rgba(235,120,30,.5)' : 'rgba(220,170,40,.45)'); } });
}
function v64sLampSpr(){ return v64sSpr('lamp', 24, 62, g => {
  g.fillStyle = '#1d1622'; g.fillRect(9, 14, 6, 46); g.fillRect(5, 56, 14, 6); g.fillStyle = '#4a4458'; g.fillRect(10, 15, 3, 44); g.fillRect(6, 57, 12, 3);
  g.fillStyle = '#1d1622'; g.fillRect(3, 0, 18, 18); g.fillStyle = '#f6d78a'; g.fillRect(5, 3, 14, 12); g.fillStyle = '#fff3c4'; g.fillRect(7, 5, 5, 6); g.fillStyle = '#7b5a3a'; g.fillRect(2, 0, 20, 3); }); }
function v64sBenchSpr(){ return v64sSpr('bench' + (v64sDong() ? 1 : 0), 72, 34, g => {
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(4, 26, 66, 7);
  g.fillStyle = '#2b2430'; g.fillRect(6, 14, 8, 18); g.fillRect(58, 14, 8, 18); g.fillRect(0, 2, 72, 16);
  g.fillStyle = '#c9c2b4'; g.fillRect(2, 4, 68, 12); g.fillStyle = '#e4ded2'; g.fillRect(2, 4, 68, 4); g.fillStyle = '#9a9286'; g.fillRect(8, 16, 4, 14); g.fillRect(60, 16, 4, 14);
  if(v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(2, 1, 68, 5); } }); }
function v64sBedSpr(i){ return v64sSpr('bed' + season + (i % 3), 72, 44, g => {
  g.fillStyle = '#2b2430'; g.beginPath(); g.ellipse(36, 28, 35, 15, 0, 0, 7); g.fill(); g.fillStyle = '#b9b0a2'; g.beginPath(); g.ellipse(36, 28, 33, 13, 0, 0, 7); g.fill();
  g.fillStyle = v64sDong() ? '#f2f6f8' : '#5b3b26'; g.beginPath(); g.ellipse(36, 27, 27, 9, 0, 0, 7); g.fill();
  if(v64sDong()){ v64sT(g, 'N', 1, 12, 20, 6, 1, 1, 2); return; }
  const fl = [[0, 11], [3, 11], [6, 11], [1, 11]]; for(let k = 0; k < 3; k++){ const f = fl[(i + k) % 4]; v64sT(g, 'N', f[0], f[1], 6 + k*20, k % 2 ? 0 : 6, 1, 1, 2); } }); }
function v64sSign(g, x, y, text){   // biển gỗ kiểu NA: cột + bảng + chữ Nunito ≥16px
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const w = Math.ceil(g.measureText(text).width) + 20;
  g.fillStyle = '#2b1a10'; g.fillRect(x - 3, y - 30, 6, 30); g.fillStyle = '#8a5a35'; g.fillRect(x - 2, y - 30, 4, 30);
  g.fillStyle = '#2b1a10'; g.fillRect(x - w/2 - 2, y - 56, w + 4, 28); g.fillStyle = '#b97a45'; g.fillRect(x - w/2, y - 54, w, 24); g.fillStyle = '#d99a5c'; g.fillRect(x - w/2, y - 54, w, 4);
  g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - 41); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
function v64sRound(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }

// ---------- công trình phẳng ----------
function v64sCourt(g, r, lod){   // sân trường lát gạch quanh khu điểm danh
  const w = r.x1 - r.x0, h = r.y1 - r.y0; v64sRound(g, r.x0 - 8, r.y0 - 8, w + 16, h + 16, 40); g.fillStyle = '#4a3428'; g.fill();
  v64sRound(g, r.x0, r.y0, w, h, 34); g.fillStyle = lod < 2 ? v64sPat(g, 'FI', 5, 8, 2) : '#e6a066'; g.fill();
  if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.45)'; g.fill(); }
  g.strokeStyle = 'rgba(255,240,210,.5)'; g.lineWidth = 3; v64sRound(g, r.x0 + 10, r.y0 + 10, w - 20, h - 20, 26); g.stroke();
}
function v64sBball(g, r, lod){
  const w = r.x1 - r.x0, h = r.y1 - r.y0, x = r.x0, y = r.y0;
  g.fillStyle = '#2b2430'; g.fillRect(x - 4, y - 4, w + 8, h + 8); g.fillStyle = '#3e8a68'; g.fillRect(x, y, w, h);
  g.fillStyle = v64sDong() ? '#dfe8ee' : '#d77a45'; g.fillRect(x + 14, y + 14, w - 28, h - 28);
  if(lod === 2) return;
  g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(x + 14, y + 14, w - 28, h - 28); g.beginPath(); g.moveTo(x + w/2, y + 14); g.lineTo(x + w/2, y + h - 14); g.stroke();
  g.beginPath(); g.arc(x + w/2, y + h/2, 26, 0, 7); g.stroke();
  [[x + 14, 1], [x + w - 14, -1]].forEach(([bx, s]) => { g.strokeRect(s > 0 ? bx : bx - 56, y + h/2 - 30, 56, 60); g.beginPath(); g.arc(bx + s*56, y + h/2, 30, -Math.PI/2, Math.PI/2, s < 0); g.stroke();
    g.fillStyle = '#2b2430'; g.fillRect(bx - s*4 - 3, y + h/2 - 28, 6, 56); g.fillStyle = '#f4f4f4'; g.fillRect(bx - s*4 - 2, y + h/2 - 26, 4, 52); g.fillStyle = '#ef4b4b'; g.fillRect(bx + s*4 - 4, y + h/2 - 6, 8, 12); });
}
function v64sPond(g, r, lod){
  const wT = Math.round((r.x1 - r.x0)/32), hT = Math.round((r.y1 - r.y0)/32);
  if(lod === 2){ g.fillStyle = '#5ec7e6'; g.fillRect(r.x0, r.y0, wT*32, hT*32); return; }
  if(v64sDong()) v64sNine(g, 'W', 13, 0, r.x0, r.y0, wT, hT); else v64sNine(g, 'W', 0, 6, r.x0, r.y0, wT, hT);
  if(!v64sDong()){ v64sT(g, 'W', 11, 3, r.x0 + 70, r.y0 + 58); v64sT(g, 'W', 11, 3, r.x0 + 180, r.y0 + 110); v64sT(g, 'W', 11, 3, r.x0 + 120, r.y0 + 128); }
  // cầu gỗ nhỏ ra giữa ao
  const px = r.x0 + Math.round(wT*32/V64S_PHI) - 16; for(let j = 0; j < 3; j++) v64sT(g, 'W', 5, 13, px, r.y1 - 26 - j*32, 1, 1, 2);
  g.fillStyle = '#3a2416'; g.fillRect(px - 2, r.y1 - 94, 2, 92); g.fillRect(px + 32, r.y1 - 94, 2, 92);
}
function v64sVeg(g, r, lod){
  const dong = v64sDong(); g.fillStyle = '#6b4a2a'; g.fillRect(r.x0 - 4, r.y0 - 4, r.x1 - r.x0 + 8, 4); g.fillRect(r.x0 - 4, r.y1, r.x1 - r.x0 + 8, 4);
  for(let p = 0; p < 3; p++){ const x = r.x0 + 6 + p*80, y = r.y0 + 6;
    if(lod === 2){ g.fillStyle = dong ? '#f2f6f8' : '#c97b45'; g.fillRect(x, y, 64, 128); continue; }
    v64sNine(g, 'FL', 0, dong ? 12 : 0, x, y, 2, 4);
    if(dong) continue; const crop = [[8, 11], [0, 11], [7, 11]][p];
    for(let j = 0; j < 4; j++) for(let i = 0; i < 2; i++) v64sT(g, 'N', crop[0], crop[1], x + i*32 + 4, y + j*30 + 4, 1, 1, 1.5); }
}
function v64sPlay(g, r, lod){
  const wT = Math.floor((r.x1 - r.x0)/32), hT = Math.floor((r.y1 - r.y0)/32);
  if(lod === 2){ g.fillStyle = '#efc58a'; g.fillRect(r.x0, r.y0, wT*32, hT*32); return; }
  v64sNine(g, 'FL', 0, v64sDong() ? 12 : 9, r.x0, r.y0, wT, hT);
  const x = r.x0, y = r.y0, O = '#2b2430';
  // cầu trượt (khung vàng, máng đỏ)
  g.fillStyle = O; g.fillRect(x + 28, y + 30, 8, 92); g.fillRect(x + 66, y + 30, 8, 92); g.fillRect(x + 24, y + 26, 54, 12);
  g.fillStyle = '#ffd23f'; g.fillRect(x + 30, y + 32, 4, 88); g.fillRect(x + 68, y + 32, 4, 88); g.fillRect(x + 26, y + 28, 50, 8);
  for(let k = 0; k < 5; k++){ g.fillStyle = O; g.fillRect(x + 34, y + 48 + k*16, 34, 5); g.fillStyle = '#ffe58a'; g.fillRect(x + 34, y + 49 + k*16, 34, 3); }
  g.fillStyle = O; g.beginPath(); g.moveTo(x + 74, y + 26); g.lineTo(x + 150, y + 112); g.lineTo(x + 150, y + 128); g.lineTo(x + 74, y + 46); g.fill();
  g.fillStyle = '#ef4b4b'; g.beginPath(); g.moveTo(x + 76, y + 30); g.lineTo(x + 148, y + 114); g.lineTo(x + 148, y + 124); g.lineTo(x + 76, y + 42); g.fill();
  // xích đu chữ A
  const sx = x + 190; g.strokeStyle = O; g.lineWidth = 7; g.beginPath(); g.moveTo(sx, y + 130); g.lineTo(sx + 20, y + 30); g.lineTo(sx + 40, y + 130); g.moveTo(sx + 90, y + 130); g.lineTo(sx + 110, y + 30); g.lineTo(sx + 130, y + 130); g.moveTo(sx + 20, y + 30); g.lineTo(sx + 110, y + 30); g.stroke();
  g.strokeStyle = '#3d7bff'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx, y + 130); g.lineTo(sx + 20, y + 30); g.lineTo(sx + 40, y + 130); g.moveTo(sx + 90, y + 130); g.lineTo(sx + 110, y + 30); g.lineTo(sx + 130, y + 130); g.moveTo(sx + 20, y + 30); g.lineTo(sx + 110, y + 30); g.stroke();
  g.strokeStyle = '#2b2430'; g.lineWidth = 2; [sx + 48, sx + 82].forEach(q => { g.beginPath(); g.moveTo(q - 8, y + 32); g.lineTo(q - 8, y + 96); g.moveTo(q + 8, y + 32); g.lineTo(q + 8, y + 96); g.stroke(); g.fillStyle = O; g.fillRect(q - 12, y + 94, 24, 8); g.fillStyle = '#2fbf71'; g.fillRect(q - 10, y + 95, 20, 5); });
  // bập bênh
  const by = y + 168; g.fillStyle = O; g.fillRect(x + 40, by - 4, 120, 10); g.fillStyle = '#ff8a2b'; g.fillRect(x + 42, by - 2, 116, 6); g.fillStyle = O; g.beginPath(); g.moveTo(x + 100, by); g.lineTo(x + 88, by + 18); g.lineTo(x + 112, by + 18); g.fill();
  g.fillStyle = '#ef4b4b'; g.fillRect(x + 44, by - 14, 8, 10); g.fillRect(x + 148, by - 14, 8, 10);
}
function v64sGarden(g, r, lod){
  const w = r.x1 - r.x0, h = r.y1 - r.y0, cx = r.x0 + Math.round(w/V64S_PHI), cy = r.y0 + Math.round(h/V64S_PHI), dong = v64sDong();
  // lối sỏi chia theo tỷ lệ vàng
  g.fillStyle = '#4a3428'; g.fillRect(r.x0, cy - 18, w, 36); g.fillRect(cx - 18, r.y0, 36, h);
  g.fillStyle = lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a'; g.fillRect(r.x0, cy - 14, w, 28); g.fillRect(cx - 14, r.y0, 28, h);
  if(dong){ g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(r.x0, cy - 14, w, 28); g.fillRect(cx - 14, r.y0, 28, h); }
  if(lod === 2) return;
  // 4 ô hoa (khối cỏ đậm NA) + hoa
  const cells = [[r.x0 + 8, r.y0 + 8, cx - 24 - r.x0 - 8, cy - 24 - r.y0 - 8], [cx + 24, r.y0 + 8, r.x1 - cx - 32, cy - 24 - r.y0 - 8], [r.x0 + 8, cy + 24, cx - 24 - r.x0 - 8, r.y1 - cy - 32], [cx + 24, cy + 24, r.x1 - cx - 32, r.y1 - cy - 32]];
  cells.forEach(([x, y, cw, chh], i) => { const wT = Math.max(2, Math.floor(cw/32)), hT = Math.max(2, Math.floor(chh/32)); v64sNine(g, 'FL', 0, dong ? 12 : 6, x, y, wT, hT);
    if(dong) return; const fl = [[0, 11], [3, 11], [6, 11], [1, 11]][i]; for(let j = 0; j < hT; j++) for(let k = 0; k < wT; k++) if((j + k + i) % 2 === 0) v64sT(g, 'N', fl[0], fl[1], x + k*32 + 4, y + j*32 + 2, 1, 1, 1.5); });
  // đài phun nước nhỏ ở giao lối (tâm tỷ lệ vàng)
  g.fillStyle = '#2b2430'; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill(); g.fillStyle = '#c9c2b4'; g.beginPath(); g.arc(cx, cy, 27, 0, 7); g.fill();
  g.fillStyle = dong ? '#d8eef6' : '#5ec7e6'; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill(); g.fillStyle = '#c9c2b4'; g.fillRect(cx - 4, cy - 14, 8, 14); g.fillStyle = '#e4ded2'; g.fillRect(cx - 7, cy - 18, 14, 5);
}
function v64sParking(g, r, lod){
  const w = r.x1 - r.x0, h = r.y1 - r.y0; g.fillStyle = '#2b2430'; g.fillRect(r.x0 - 4, r.y0 - 4, w + 8, h + 8);
  g.fillStyle = lod < 2 ? v64sPat(g, 'FI', 13, 13, 2) : '#55505a'; g.fillRect(r.x0, r.y0, w, h); if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(r.x0, r.y0, w, h); }
  if(lod === 2) return; g.fillStyle = '#f4f0e6'; for(let i = 0; i <= 5; i++) g.fillRect(r.x0 + 8 + i*(w - 16)/5 - 1, r.y0 + 6, 3, h - 30);
  const car = (x, y, c) => { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 18, y + 20, 38, 6); g.fillStyle = '#2b2430'; g.fillRect(x - 20, y - 16, 40, 38); g.fillStyle = c; g.fillRect(x - 18, y - 14, 36, 34);
    g.fillStyle = '#bfe3ff'; g.fillRect(x - 13, y - 9, 26, 9); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - 18, y - 14, 36, 4); g.fillStyle = '#2b2430'; g.fillRect(x - 21, y + 10, 5, 9); g.fillRect(x + 16, y + 10, 5, 9); g.fillStyle = '#ffe58a'; g.fillRect(x - 15, y + 15, 6, 3); g.fillRect(x + 9, y + 15, 6, 3); };
  const sw = (w - 16)/5; car(r.x0 + 8 + sw*.5, r.y0 + 34, '#3d7bff'); car(r.x0 + 8 + sw*1.5, r.y0 + 34, '#ef4b4b'); car(r.x0 + 8 + sw*3.5, r.y0 + 34, '#2fbf71');
}
function v64sPitch(g, lod){   // sân bóng (khu field) vẽ lại kiểu NA: cỏ sọc + vạch trắng + khung thành
  const z = V46.ZI.field; if(!z) return; const n = z.nr, w = n.x1 - n.x0, h = n.y1 - n.y0, dong = v64sDong();
  g.fillStyle = '#2b2430'; g.fillRect(n.x0 - 6, n.y0 - 6, w + 12, h + 12);
  for(let i = 0; i < 10; i++){ g.fillStyle = dong ? (i % 2 ? '#e9f0f2' : '#dde7ea') : (i % 2 ? '#5aa04a' : '#4f9442'); g.fillRect(n.x0 + i*w/10, n.y0, w/10 + 1, h); }
  if(lod === 2) return; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(n.x0 + 10, n.y0 + 10, w - 20, h - 20);
  g.beginPath(); g.moveTo(n.x0 + w/2, n.y0 + 10); g.lineTo(n.x0 + w/2, n.y1 - 10); g.stroke(); g.beginPath(); g.arc(n.x0 + w/2, n.y0 + h/2, 40, 0, 7); g.stroke();
  [[n.x0 + 10, 1], [n.x1 - 10, -1]].forEach(([x, s]) => { g.strokeRect(s > 0 ? x : x - 70, n.y0 + h/2 - 60, 70, 120); g.strokeRect(s > 0 ? x : x - 26, n.y0 + h/2 - 30, 26, 60);
    g.fillStyle = '#2b2430'; g.fillRect(s > 0 ? x - 16 : x + 2, n.y0 + h/2 - 32, 14, 64); g.fillStyle = '#f4f4f4'; g.fillRect(s > 0 ? x - 14 : x + 4, n.y0 + h/2 - 30, 10, 60);
    g.strokeStyle = 'rgba(80,80,80,.5)'; g.lineWidth = 1; for(let k = 0; k < 6; k++){ g.beginPath(); g.moveTo(s > 0 ? x - 14 : x + 4, n.y0 + h/2 - 30 + k*10); g.lineTo(s > 0 ? x - 4 : x + 14, n.y0 + h/2 - 30 + k*10); g.stroke(); } g.strokeStyle = '#ffffff'; g.lineWidth = 3; });
}
function v64sPlaza(g, lod){   // quảng trường cổng: đá lát tròn + vòng hoa (bán kính theo tỷ lệ vàng)
  const C = V64S.C, R0 = 300, ring = (r, f) => { g.beginPath(); g.arc(C[0], C[1], r, 0, 7); g.fillStyle = f; g.fill(); };
  ring(R0 + 8, '#4a3428'); ring(R0, lod < 2 ? v64sPat(g, 'FI', 17, 1, 2) : '#e7d1a1'); if(v64sDong()) ring(R0, 'rgba(255,255,255,.4)');
  ring(R0/V64S_PHI + 6, '#4a3428'); ring(R0/V64S_PHI, lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a');
  ring(R0/V64S_PHI/V64S_PHI + 6, '#4a3428'); ring(R0/V64S_PHI/V64S_PHI, lod < 2 ? v64sPat(g, 'FL', 1, v64sDong() ? 13 : 7, 2) : '#4f8a3a');
  if(lod === 2 || v64sDong()) return; const r = R0/V64S_PHI/V64S_PHI - 22;
  for(let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; v64sT(g, 'N', [0, 3, 6][i % 3], 11, C[0] + Math.cos(a)*r - 12, C[1] + Math.sin(a)*r - 14, 1, 1, 1.5); }
}
function v64sFence(g, x0, y0, x1, y1){
  const F = V64S.fence, N = F.length, O = '#2b1a10', in_ = p => p && p[0] > x0 - 40 && p[0] < x1 + 40 && p[1] > y0 - 30 && p[1] < y1 + 60;
  g.lineCap = 'butt';
  for(let i = 0; i < N; i++){ const p = F[i], q = F[(i + 1) % N]; if(!in_(p)) continue;
    if(q){ for(const [dy, wv, c] of [[-14, 7, O], [-6, 7, O], [-14, 3, '#b37a48'], [-6, 3, '#b37a48']]){ g.strokeStyle = c; g.lineWidth = wv; g.beginPath(); g.moveTo(p[0], p[1] + dy); g.lineTo(q[0], q[1] + dy); g.stroke(); } }
    g.fillStyle = O; g.fillRect(p[0] - 4, p[1] - 22, 8, 24); g.fillStyle = '#9a6236'; g.fillRect(p[0] - 2, p[1] - 20, 4, 20); g.fillStyle = v64sDong() ? '#ffffff' : '#c99560'; g.fillRect(p[0] - 3, p[1] - 22, 6, 3); }
}
function v64sProp(g, p, lod){
  if(lod === 2){ if(p.k === 'old' || p.k === 'tree' || p.k === 'pine'){ g.fillStyle = v64sDong() ? '#eef3f5' : v64sThu() ? '#d9822b' : '#4c9a3c'; const s = p.k === 'old' ? 60 : 28; g.beginPath(); g.arc(p.x, p.y - s*.8, s*.6, 0, 7); g.fill(); } return; }
  const sh = (rx, ry) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(p.x, p.y, rx, ry, 0, 0, 7); g.fill(); };
  if(p.k === 'old'){ sh(52, 16); g.drawImage(v64sTreeSpr('old'), p.x - 72, p.y - 138); return; }
  if(p.k === 'tree'){ sh(24, 8); g.drawImage(v64sTreeSpr('tree', p.i), p.x - 32, p.y - 60); return; }
  if(p.k === 'pine'){ sh(22, 7); g.drawImage(v64sTreeSpr('pine', p.i), p.x - 33, p.y - 96); return; }
  if(p.k === 'bush'){ if(v64sDong()) v64sT(g, 'N', 1, 12, p.x - 16, p.y - 26, 1, 1, 2); else { v64sT(g, 'N', p.i % 2, 10, p.x - 16, p.y - 28, 1, 1, 2); if(p.i % 3 === 0 && !v64sThu()) v64sT(g, 'N', [0, 3, 6][p.i % 3], 11, p.x - 2, p.y - 22, 1, 1, 1); } return; }
  if(p.k === 'lamp'){ sh(10, 4); g.drawImage(v64sLampSpr(), p.x - 12, p.y - 60); return; }
  if(p.k === 'bench'){ g.drawImage(v64sBenchSpr(), p.x - 36, p.y - 26); return; }
  if(p.k === 'bed'){ g.drawImage(v64sBedSpr(p.i), p.x - 36, p.y - 30); return; }
}
// ---------- vẽ cả khuôn viên vào một ô nền ----------
function v64sPaintCampus(g, x0, y0, w, h, lod){
  if(!V64S.ok) return; const C = V64S.C, R = V64S.R, x1 = x0 + w, y1 = y0 + h;
  if(x1 < C[0] - R - 200 || x0 > C[0] + R + 200 || y1 < C[1] - R - 200 || y0 > C[1] + R + 200) return;
  g.save(); g.imageSmoothingEnabled = false;
  g.beginPath(); g.arc(C[0], C[1], R + 18, 0, Math.PI*2); g.clip();
  // giữ nguyên nền các khu không phải trường (bàn cờ lớn, công viên Rubik…)
  g.beginPath(); g.rect(x0 - 10, y0 - 10, w + 20, h + 20); V46.Z.forEach(z => { if(!z.flip && !V46SCHOOL[z.id] && z.n.x1 > x0 && z.n.x0 < x1 && z.n.y1 > y0 && z.n.y0 < y1) g.rect(z.n.x0, z.n.y0, z.n.x1 - z.n.x0, z.n.y1 - z.n.y0); }); g.clip('evenodd');
  const dong = v64sDong();
  g.fillStyle = lod < 2 ? v64sPat(g, 'FL', 1, dong ? 13 : 4, 2) : (dong ? '#f4f6f8' : '#a9c25a'); g.fillRect(x0, y0, w, h);
  // cỏ lấm tấm: búi cỏ, hoa nhỏ, lá thu (chỉ khi nhìn gần)
  if(lod === 0){ const sx = Math.floor(x0/64), sy = Math.floor(y0/64);
    for(let j = sy; j*64 < y1; j++) for(let i = sx; i*64 < x1; i++){ const hh = v64sHash(i*7919 + j*104729) % 97, x = i*64 + (hh % 5)*9, y = j*64 + (hh % 7)*7;
      if(hh < 9) v64sT(g, 'FD', hh % 4, dong ? 3 : 2, x, y, 1, 1, 2);
      else if(hh < 12 && !dong) v64sT(g, 'FD', v64sThu() ? hh % 2 : v64sXuan() ? 3 : 4 + hh % 2, v64sThu() || v64sXuan() ? 0 : 2, x, y, 1, 1, 2); } }
  // đường trong khuôn viên: đá lát vàng viền nâu
  g.lineJoin = 'round'; g.lineCap = 'round';
  const pathOf = l => { g.beginPath(); l.P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if(l.closed) g.closePath(); };
  const L = V46R.lines.filter(l => l.P.some(p => p[0] > x0 - 200 && p[0] < x1 + 200 && p[1] > y0 - 200 && p[1] < y1 + 200));
  L.forEach(l => { pathOf(l); g.strokeStyle = '#4a3428'; g.lineWidth = l.w + 14; g.stroke(); });
  const cob = lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a'; L.forEach(l => { pathOf(l); g.strokeStyle = cob; g.lineWidth = l.w + 6; g.stroke(); });
  if(dong) L.forEach(l => { pathOf(l); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = l.w + 6; g.stroke(); });
  v64sPlaza(g, lod);
  const F = V64S.F, vis = it => it && it.r.x1 + 80 > x0 && it.r.x0 - 80 < x1 && it.r.y1 + 80 > y0 && it.r.y0 - 120 < y1;
  if(vis(F.court)) v64sCourt(g, F.court.r, lod);
  if(vis(F.bball)) v64sBball(g, F.bball.r, lod); if(vis(F.pond)) v64sPond(g, F.pond.r, lod); if(vis(F.veg)) v64sVeg(g, F.veg.r, lod);
  if(vis(F.play)) v64sPlay(g, F.play.r, lod); if(vis(F.gard)) v64sGarden(g, F.gard.r, lod); if(vis(F.park)) v64sParking(g, F.park.r, lod);
  if(vis(F.bike)){ const r = F.bike.r; g.fillStyle = '#4a3428'; g.fillRect(r.x0 - 4, r.y0 + 26, r.x1 - r.x0 + 8, r.y1 - r.y0 - 22); g.fillStyle = lod < 2 ? v64sPat(g, 'FI', 13, 7, 2) : '#9aa38f'; g.fillRect(r.x0, r.y0 + 30, r.x1 - r.x0, r.y1 - r.y0 - 30); }
  // biển tên công trình không có nhà
  if(lod === 0) ['bball', 'pond', 'veg', 'play', 'gard', 'park'].forEach(k => { const it = F[k]; if(vis(it)) v64sSign(g, it.r.x0 + 34, k === 'park' || k === 'bball' ? it.r.y1 + 58 : it.r.y0 - 2, it.f.ic + ' ' + it.f.n); });
  // cây, đèn, ghế, bồn hoa (xếp theo y) + hàng rào
  v64sFence(g, x0, y0, x1, y1);
  for(const p of V64S.props){ if(p.x < x0 - 90 || p.x > x1 + 90 || p.y < y0 - 10 || p.y > y1 + 150) continue; v64sProp(g, p, lod); }
  // biển chỉ đường của đảo (bị nền mới phủ) vẽ lại
  if(lod < 2) for(const t of V46T.deco){ if(t.k === 9 && t.x > x0 - 120 && t.x < x1 + 120 && t.y > y0 - 10 && t.y < y1 + 70 && v64sInCampus(t.x, t.y, 30)) try { v46Sign(g, t); } catch(e){} }
  g.restore();
  // sân bóng: cả khu field thuộc trường (kể cả phần nằm ngoài hàng rào tròn) → vẽ ngoài vùng cắt tròn
  try { const fz = V46.ZI.field; if(fz && fz.nr.x1 > x0 && fz.nr.x0 < x1 && fz.nr.y1 > y0 && fz.nr.y0 < y1){ g.save(); g.imageSmoothingEnabled = false; v64sPitch(g, lod); g.restore(); } } catch(e){}
}
// bọc ngay lúc nạp file
const v64sPaint0 = v46Paint;
v46Paint = function(g, x0, y0, w, h, lod){ v64sPaint0(g, x0, y0, w, h, lod); try { v64sPaintCampus(g, x0, y0, w, h, lod); } catch(e){ console.warn('v64s paint', e); } };
