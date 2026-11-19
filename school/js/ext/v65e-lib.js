// ================= v65e · 2/4 THƯ VIỆN TRI THỨC + HỌC VIỆN TRÍ TUỆ (khu cắt từ thế giới cũ) =================
// Nền khu (v47wPatch) được vẽ lại bằng tile NA trong TOẠ ĐỘ CŨ của khu → cổng "bấm E", chỗ chơi Sudoku/Toán/Trí nhớ/Rubik/Cờ vua giữ nguyên chỗ.
// Lớp động cũ librarySprites (tháp, mái vòm, cờ, đài phun…) thay bằng lớp động mới nhẹ: cờ bay, tia nước, bạn đọc sách NA.
const V65E_LIB_LAMPS = [[452, 252], [548, 252], [452, 366], [548, 366], [452, 452], [548, 452], [452, 552], [548, 552], [150, 236], [850, 236]];
const V65E_LIB_SEATS = [[418, 300, 3, 'Princess'], [582, 300, 2, 'Boy'], [418, 498, 3, 'EggGirl'], [582, 498, 2, 'NinjaBlue'], [196, 300, 0, 'Child'], [262, 312, 0, 'Villager4'], [770, 302, 0, 'Noble'], [842, 302, 0, 'Cavegirl']];
function v65eLibrary(g, r){
  const X = r.x, Y = r.y, W = r.w, H = r.h, cx = X + W/2, fY = Y + H - 12, dong = v65eDong();
  const P = (x, y) => [X + x, Y + y];
  v65eGrass(g, X, Y + 196, W, H - 196);
  // cỏ lấm tấm
  if(!dong) for(let i = 0; i < 60; i++){ const h = v64sHash('lib' + i), x = X + 30 + h % (W - 60), y = Y + 230 + (h >>> 8) % (H - 260); v64sT(g, 'FD', h % 4, 2, x, y, 1, 1, 2); }
  // lối đi: hiên đá trước nhà, lối giữa xuống cổng, lối ngang qua hai đài phun
  g.fillStyle = V65E_O; g.fillRect(X + 116, Y + 196, W - 232, 34); g.fillRect(cx - 36, Y + 196, 72, H - 196); g.fillRect(X + 36, Y + 380, W - 72, 44);
  v65ePave(g, X + 120, Y + 198, W - 240, 30, 'orn'); v65ePave(g, cx - 32, Y + 198, 64, H - 198, 'cob'); v65ePave(g, X + 40, Y + 384, W - 80, 36, 'cob');
  // 4 bồn vườn (khối cỏ đậm NA + hoa), chia theo lối
  const beds = [[70, 246, 352, 118], [578, 246, 352, 118], [70, 436, 352, 104], [578, 436, 352, 104]];
  beds.forEach(([bx, by, bw, bh], i) => { const wT = Math.floor(bw/32), hT = Math.floor(bh/32), x = X + bx, y = Y + by; v64sNine(g, 'FL', 0, dong ? 12 : 6, x, y, wT, hT);
    if(dong) return; const fl = [[0, 11], [3, 11], [6, 11], [1, 11]][i]; for(let j = 0; j < hT; j++) for(let k = 0; k < wT; k++) if((j + k + i) % 2 === 0 && !(i < 2 && k > 1 && k < wT - 2 && j < hT - 1)) v64sT(g, 'N', fl[0], fl[1], x + k*32 + 4, y + j*32 + 2, 1, 1, 1.5); });
  // góc truyện tranh (trái) — thảm + 2 giá sách + đệm ngồi
  { const [x, y] = P(150, 262); v65eR(g, V65E_O, x - 2, y - 2, 164, 74); v65eR(g, '#c0392b', x, y, 160, 70); v65eR(g, '#e8b04a', x + 6, y + 6, 148, 58); v65eR(g, '#c0392b', x + 12, y + 12, 136, 46); for(let i = 0; i < 6; i++) v65eR(g, '#ffd23f', x + 18 + i*22, y + 33, 8, 4);
    v64sT(g, 'E', 3, 7, x + 2, y - 44, 1, 2, 2); v64sT(g, 'E', 4, 7, x + 126, y - 44, 1, 2, 2); [[x + 50, y + 44, '#3d7bff'], [x + 106, y + 46, '#2fbf71']].forEach(([bx, by, c]) => { g.fillStyle = V65E_O; g.beginPath(); g.ellipse(bx, by, 15, 10, 0, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(bx, by - 1, 13, 8, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx - 7, by - 6, 6, 2); }); }
  // đọc ngoài trời (phải) — sàn gỗ + bàn + ô che nắng
  { const [x, y] = P(690, 262); v65eR(g, V65E_O, x - 2, y - 2, 164, 74); for(let i = 0; i < 160; i += 16){ v65eR(g, i % 32 ? '#b97a45' : '#a86a3a', x + i, y, 16, 70); v65eR(g, '#d99a5c', x + i, y, 16, 2); }
    [[x + 40, y + 40], [x + 120, y + 40]].forEach(([tx, ty], k) => { v65eR(g, V65E_O, tx - 16, ty - 8, 32, 14); v65eR(g, '#e4ded2', tx - 14, ty - 6, 28, 10); v65eR(g, '#5b3b26', tx - 1, ty - 44, 3, 40);
      g.fillStyle = V65E_O; g.beginPath(); g.moveTo(tx - 32, ty - 36); g.lineTo(tx + 1, ty - 58); g.lineTo(tx + 34, ty - 36); g.fill(); for(let s = 0; s < 4; s++){ g.fillStyle = s % 2 ? '#fff6e0' : (k ? '#2fbf71' : '#e8453c'); g.beginPath(); g.moveTo(tx + 1, ty - 55); g.lineTo(tx - 29 + s*15, ty - 38); g.lineTo(tx - 14 + s*15, ty - 38); g.fill(); } }); }
  // đài phun nước tròn ở hai đầu lối ngang
  [250, 750].forEach(fx => { const x = X + fx, y = Y + 402; g.fillStyle = V65E_O; g.beginPath(); g.ellipse(x, y, 42, 30, 0, 0, 7); g.fill(); g.fillStyle = '#d9d4c7'; g.beginPath(); g.ellipse(x, y, 39, 27, 0, 0, 7); g.fill();
    g.fillStyle = dong ? '#d8eef6' : '#5ec7e6'; g.beginPath(); g.ellipse(x, y + 2, 31, 20, 0, 0, 7); g.fill(); g.fillStyle = dong ? '#ffffff' : '#9fe0f2'; g.beginPath(); g.ellipse(x - 8, y - 4, 12, 5, 0, 0, 7); g.fill();
    v65eR(g, V65E_O, x - 7, y - 26, 14, 26); v65eR(g, '#e4ded2', x - 5, y - 24, 10, 24); v65eR(g, V65E_O, x - 13, y - 30, 26, 7); v65eR(g, '#f4f1ea', x - 11, y - 29, 22, 4); });
  // ghế đá + đèn dọc lối giữa
  [[418, 300], [582, 300], [418, 498], [582, 498]].forEach(([x, y]) => v65eBench(g, X + x, Y + y));
  V65E_LIB_LAMPS.forEach(([x, y]) => v65eLamp(g, X + x, Y + y));
  // hàng rào cây quanh khu + cây cổ thụ hai góc dưới + thông dọc hai bên
  v65eHedge(g, X + 14, Y + 220, X + W - 14, Y + 220 + Math.floor((H - 250)/26)*26, cx, 52);
  [[34, 300, 1], [34, 470, 2], [966, 300, 0], [966, 470, 1]].forEach(([x, y, v]) => v65eTree(g, X + x, Y + y, 'pine', v));
  v65eTree(g, X + 96, Y + H - 34, 'old'); v65eTree(g, X + W - 96, Y + H - 34, 'old');
  // hàng rào sắt + trụ đá + cổng vòm (cổng ở đúng chỗ cũ: giữa, mép dưới)
  for(let x = X + 6; x <= X + W - 6; x += 8){ if(Math.abs(x - cx) < 64) continue; v65eR(g, V65E_O, x - 1, fY - 24, 4, 26); v65eR(g, '#4a4458', x, fY - 23, 2, 24); v65eR(g, '#d4a52c', x - 1, fY - 27, 4, 3); }
  v65eR(g, V65E_O, X + 4, fY - 16, cx - 64 - X - 4, 4); v65eR(g, V65E_O, cx + 64, fY - 16, X + W - 4 - cx - 64, 4); v65eR(g, V65E_O, X + 4, fY - 3, W - 8, 5);
  [cx - 66, cx + 66].forEach(x => { v65eR(g, V65E_O, x - 14, fY - 62, 28, 64); v65eR(g, '#e4ded2', x - 12, fY - 60, 24, 60); for(let y = fY - 50; y < fY; y += 12) v65eR(g, '#c9c2b4', x - 12, y, 24, 2);
    v65eR(g, V65E_O, x - 17, fY - 70, 34, 10); v65eR(g, '#f4f1ea', x - 15, fY - 68, 30, 6); v65eR(g, V65E_O, x - 7, fY - 88, 14, 18); v65eR(g, '#ffd27a', x - 5, fY - 86, 10, 12); v65eR(g, V65E_O, x - 9, fY - 92, 18, 5); });
  g.strokeStyle = V65E_O; g.lineWidth = 6; g.beginPath(); g.arc(cx, fY - 40, 54, Math.PI, 0); g.stroke(); g.strokeStyle = '#d4a52c'; g.lineWidth = 2; g.stroke();
  v65ePlaque(g, cx, fY - 74, '📖 Bấm E ở cổng để đọc sách', '#2a6f62', 16);
  // ---- toà nhà: hai tháp góc, hai cánh, sảnh giữa mái xanh ngọc ----
  const roofC = dong ? null : null;
  // cánh (mái ngói đỏ NA) + tường kem có cửa sổ vòm & hộp hoa
  v65eRoof(g, 12, X + 132, Y + 22, 23, 3, roofC); v65eWall(g, X + 132, Y + 118, 736, 80, 'cream');
  for(let x = X + 150; x < X + 846; x += 46){ if(Math.abs(x + 11 - cx) < 112) continue; v65eWin(g, x, Y + 140, 22, 32, {arch:true, box:true, gl:'#e9c46a', gl2:'#fff1bf'}); }
  // tháp góc
  [X + 36, X + 868].forEach((tx, k) => { v65eRoof(g, 12, tx, Y + 2, 3, 3, '#2a9d8f'); v65eWall(g, tx, Y + 98, 96, 102, 'stone');
    v65eWin(g, tx + 36, Y + 116, 24, 30, {arch:true, gl:'#e9c46a', gl2:'#fff1bf'}); v65eWin(g, tx + 36, Y + 160, 24, 26, {gl:'#e9c46a', gl2:'#fff1bf'}); v65eFlagPole(g, tx + 48, Y + 6, 34); });
  // sảnh giữa
  v65eRoof(g, 12, cx - 96, Y - 22, 6, 4, '#2a9d8f'); v65eWall(g, cx - 96, Y + 104, 192, 96, 'white');
  for(const k of [-1, 1]) for(const q of [52, 84]){ const x = cx + k*q - 6; v65eR(g, V65E_O, x - 2, Y + 108, 16, 92); v65eR(g, '#fbf8f1', x, Y + 110, 12, 88); v65eR(g, '#d6d0c2', x + 8, Y + 110, 3, 88); v65eR(g, '#d4a52c', x - 2, Y + 108, 16, 4); }
  v65eDoor(g, cx - 30, Y + 150, 60, 50, {arch:true}); v65eWin(g, cx - 14, Y + 116, 28, 18, {gl:'#e9c46a', gl2:'#fff1bf', plain:true, sill:false});
  v65ePlaque(g, cx, Y + 64, '📚 Thư viện Tri Thức', '#6b3a22', 18);
  // đồng hồ trên mái + cụm sách màu
  g.fillStyle = V65E_O; g.beginPath(); g.arc(cx, Y + 26, 17, 0, 7); g.fill(); g.fillStyle = '#d4a52c'; g.beginPath(); g.arc(cx, Y + 26, 15, 0, 7); g.fill(); g.fillStyle = '#fffdf2'; g.beginPath(); g.arc(cx, Y + 26, 12, 0, 7); g.fill();
  for(let h = 0; h < 12; h++){ const a = h/12*Math.PI*2; v65eR(g, V65E_O, cx + Math.cos(a)*10 - 1, Y + 26 + Math.sin(a)*10 - 1, 2, 2); }
  // bậc thềm + chậu cây hai bên cửa
  v65eSteps(g, cx, Y + 200, 76, 3); v65ePot(g, cx - 62, Y + 214); v65ePot(g, cx + 62, Y + 214);
}
function v65eAcademy(g, r){
  const X = r.x, Y = r.y, W = r.w, H = r.h, cx = X + W/2, dong = v65eDong();
  v65eGrass(g, X, Y + 160, W, H - 160);
  // sân trong lát đá hoa văn, viền đậm
  v65eR(g, V65E_O, X + 18, Y + 164, W - 36, H - 194); v65ePave(g, X + 22, Y + 166, W - 44, H - 200, 'orn');
  v65eR(g, V65E_O, cx - 34, Y + H - 36, 68, 36); v65ePave(g, cx - 30, Y + H - 36, 60, 36, 'cob');
  // toà nhà: cánh mái tím (sty 4) + sảnh giữa mái xanh đậm, tường đá
  v65eRoof(g, 12, X + 30, Y + 2, 20, 3, '#6b4fd0'); v65eWall(g, X + 30, Y + 98, 640, 68, 'stone');
  for(let x = X + 50; x < X + 660; x += 52){ if(Math.abs(x + 12 - cx) < 90) continue; v65eWin(g, x, Y + 112, 24, 30, {arch:true, box:true}); }
  v65eRoof(g, 12, cx - 64, Y - 20, 4, 4, '#2c3e8f'); v65eWall(g, cx - 64, Y + 100, 128, 68, 'white');
  v65eDoor(g, cx - 24, Y + 128, 48, 40, {arch:true, col:'#3a2f5c', col2:'#5a4a8c'}); v65eCube(g, cx - 15, Y + 4, 10, 4);
  v65ePlaque(g, cx, Y + 48, '🎓 Học viện trí tuệ', '#3a2f5c', 18);
  // cờ đuôi nheo treo tường: Rubik · cờ vua · số
  [[X + 96, '#e8453c', '🧩'], [X + 200, '#2fbf71', '♟'], [X + W - 200, '#3d7bff', '🔢'], [X + W - 96, '#ff8a2b', '🧠']].forEach(([x, c, ic]) => { v65eR(g, V65E_O, x - 12, Y + 100, 24, 40); v65eR(g, c, x - 10, Y + 102, 20, 30); g.fillStyle = c; g.beginPath(); g.moveTo(x - 10, Y + 132); g.lineTo(x, Y + 140); g.lineTo(x + 10, Y + 132); g.fill();
    g.font = "16px 'Noto Color Emoji', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ic, x, Y + 118); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; });
  v65ePot(g, cx - 46, Y + 176); v65ePot(g, cx + 46, Y + 176);
  // Phòng Rubik (x+160, y+200): bàn tròn + khối Rubik lớn + 4 ghế đẩu
  { const x = X + 160, y = Y + 214; [[-40, 0], [40, 0], [0, -26], [0, 28]].forEach(([dx, dy]) => { v65eR(g, V65E_O, x + dx - 9, y + dy - 6, 18, 14); v65eR(g, '#b97a45', x + dx - 7, y + dy - 4, 14, 10); });
    g.fillStyle = V65E_O; g.beginPath(); g.ellipse(x, y, 30, 18, 0, 0, 7); g.fill(); g.fillStyle = '#9a6236'; g.beginPath(); g.ellipse(x, y, 27, 15, 0, 0, 7); g.fill(); g.fillStyle = '#c99560'; g.beginPath(); g.ellipse(x, y - 2, 25, 12, 0, 0, 7); g.fill();
    v65eCube(g, x - 12, y - 18, 8, 3); }
  // Cờ vua (x+496, y+200): bàn cờ 8×8 khung gỗ
  { const s = 12, x0 = X + 448, y0 = Y + 184; v65eR(g, V65E_O, x0 - 6, y0 - 6, s*8 + 12, s*8 + 12); v65eR(g, '#8a5a35', x0 - 4, y0 - 4, s*8 + 8, s*8 + 8);
    for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++) v65eR(g, (i + j) % 2 ? '#739552' : '#ebecd0', x0 + i*s, y0 + j*s, s, s);
    const pc = (i, j, w) => { const x = x0 + i*s + 3, y = y0 + j*s + 2; v65eR(g, V65E_O, x - 1, y - 1, 8, 10); v65eR(g, w ? '#fbf8f1' : '#2b2430', x, y, 6, 8); };
    [[4, 7, 1], [3, 7, 1], [2, 6, 1], [5, 6, 1], [4, 0, 0], [3, 0, 0], [2, 1, 0], [6, 1, 0], [4, 4, 1], [3, 3, 0]].forEach(([i, j, w]) => pc(i, j, w)); }
  // 3 thảm trò chơi (x+140/320/500, y+350): Sudoku · Toán nhanh · Trí nhớ
  const mat = (mx, col) => { const x = X + mx - 60, y = Y + 322; v65eR(g, V65E_O, x - 2, y - 2, 124, 68); v65eR(g, col, x, y, 120, 64); v65eR(g, 'rgba(255,255,255,.25)', x, y, 120, 3); return [x, y]; };
  g.font = "900 16px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  { const [x, y] = mat(140, '#f4f1ea'); const s = 18, gx = x + 33, gy = y + 5; for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++){ v65eR(g, '#2b2430', gx + i*s, gy + j*s, s - 1, s - 1); v65eR(g, (i + j) % 2 ? '#fff6e0' : '#e9dcef', gx + i*s + 1, gy + j*s + 1, s - 3, s - 3); }
    g.fillStyle = '#3a2f5c'; [[0, 0, '5'], [2, 0, '3'], [1, 1, '9'], [0, 2, '7'], [2, 2, '1']].forEach(([i, j, n]) => g.fillText(n, gx + i*s + 8, gy + j*s + 9)); }
  { const [x, y] = mat(320, '#ffd23f'); g.fillStyle = '#7a4a00'; ['+', '−', '×', '÷'].forEach((s, i) => { v65eR(g, '#fff6c8', x + 8 + i*28, y + 10, 22, 22); g.fillStyle = '#7a4a00'; g.fillText(s, x + 19 + i*28, y + 22); }); g.fillText('7 × 8 = 56', x + 60, y + 48); }
  { const [x, y] = mat(500, '#2fbf71'); for(let i = 0; i < 4; i++) for(let j = 0; j < 2; j++){ const fx = x + 10 + i*26, fy = y + 6 + j*28, up = (i === 1 && j === 0) || (i === 3 && j === 1); v65eR(g, V65E_O, fx - 1, fy - 1, 22, 26); v65eR(g, up ? '#fff6e0' : '#3d7bff', fx, fy, 20, 24);
      g.fillStyle = up ? '#e8453c' : '#ffffff'; g.fillText(up ? '★' : '?', fx + 10, fy + 13); } }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  [[160, 'Phòng Rubik'], [496, 'Cờ vua']].forEach(([x, n]) => v64sBoard(g, X + x, Y + 278, n));
  [[140, 'Sudoku'], [320, 'Toán nhanh'], [500, 'Trí nhớ']].forEach(([x, n]) => v64sBoard(g, X + x, Y + 392, n));
  // đèn + chậu cây góc sân, hàng rào cây hai bên, cột cổng + bảng tên
  [[40, 186], [W - 40, 186], [40, H - 44], [W - 40, H - 44]].forEach(([x, y]) => v65eLamp(g, X + x, Y + y));
  [[60, 300], [W - 60, 300], [60, 400], [W - 60, 400]].forEach(([x, y]) => v65ePot(g, X + x, Y + y));
  v65eHedge(g, X + 6, Y + 190, X + W - 6, Y + 190 + 11*26, cx, 60);
  v65ePlaque(g, cx, Y + H - 72, 'Học viện trí tuệ · Rubik, cờ vua, Sudoku', '#3a2f5c', 16);
  [cx - 46, cx + 46].forEach(x => { v65eR(g, V65E_O, x - 10, Y + H - 40, 20, 40); v65eR(g, '#e4ded2', x - 8, Y + H - 38, 16, 38); v65eR(g, V65E_O, x - 13, Y + H - 44, 26, 7); v65eR(g, '#f4f1ea', x - 11, Y + H - 43, 22, 4); });
}
// lớp động: cờ bay, tia nước, bạn đọc sách (chỉ ban ngày), cờ trên Học viện
function v65eLibSprites(sp){
  const t = realT, r = R.library, a = R.academy;
  if(r && !(VB.x1 < r.x - 40 || VB.x0 > r.x + r.w + 40 || VB.y1 < r.y - 140 || VB.y0 > r.y + r.h + 20)){
    const X = r.x, Y = r.y, cx = X + r.w/2;
    sp.push({y:Y + 120, f:() => { v65eFlag(X + 86, Y - 28, '#e8453c', t, 1); v65eFlag(X + 918, Y - 28, '#3d7bff', t, 2); }});
    if(!v65eDong()) [250, 750].forEach(fx => { const x = X + fx, y = Y + 402; sp.push({y:y + 20, f:() => { for(let k = 0; k < 10; k++){ const an = k/10*Math.PI*2, ph = (t*1.4 + k*.17) % 1, px = x + Math.cos(an)*ph*24, py = y - 30 - Math.sin(ph*Math.PI)*20 + Math.sin(an)*ph*8; ctx.fillStyle = `rgba(225,245,254,${.9 - ph*.5})`; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3); }
      ctx.fillStyle = 'rgba(225,245,254,.8)'; ctx.fillRect(x - 1, y - 46 - Math.sin(t*6)*2, 3, 16); }}); });
    if(isDay() && !isStorm()) V65E_LIB_SEATS.forEach(([x, y, f, n], i) => { const px = X + x, py = Y + y - (i < 4 ? 8 : 0); if(inVB(px, py)) sp.push({y:py, f:() => v65eKid(px, py, n, f, ['#e8453c', '#3d7bff', '#2fbf71', '#ffd23f'][i % 4], t)}); });
  }
  if(a && !(VB.x1 < a.x - 40 || VB.x0 > a.x + a.w + 40 || VB.y1 < a.y - 140 || VB.y0 > a.y + a.h + 20)){
    if(isDay() && !isStorm()) [[118, 214, 3, 'Monk2'], [202, 214, 2, 'Villager']].forEach(([x, y, f, n]) => { const px = a.x + x, py = a.y + y; if(inVB(px, py)) sp.push({y:py, f:() => v65eKid(px, py, n, f, null, t)}); });
  }
}
function v65eLibInit(){
  const pa0 = v47wPatch; v47wPatch = function(z){
    if(!V65E.ok || (z.id !== 'library' && z.id !== 'academy') || !R[z.id]) return pa0(z);
    const e = z.e; return v65eSpr('patch' + z.id, e.x1 - e.x0, e.y1 - e.y0, g => { g.translate(-e.x0, -e.y0); if(z.id === 'library') v65eLibrary(g, R.library); else v65eAcademy(g, R.academy); });
  };
  const ls0 = librarySprites; librarySprites = function(sp){ if(!V65E.ok) return ls0(sp); try { v65eLibSprites(sp); } catch(e){ console.warn('v65e libspr', e); } };
  // đèn ấm ban đêm dọc lối thư viện (toạ độ cũ → v25Push tự đổi sang đảo)
  const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(!V65E.ok) return; const on = v25Ramp(clock, 1080, 330), r = R.library; if(on <= 0 || !r) return;
    try { V65E_LIB_LAMPS.forEach(([x, y]) => v25Push(r.x + x, r.y + y - 50, 64, on*.85, 2)); v25Push(r.x + r.w/2, r.y + 186, 90, on, 2); const a = R.academy; if(a) v25Push(a.x + a.w/2, a.y + 160, 90, on, 2); } catch(e){} };
}
