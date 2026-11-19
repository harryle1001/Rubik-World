// ================= v65b · 2/3 NỀN 10 KHU THỂ THAO (nướng vào ô nền đảo — không tốn khung hình) =================
// Giữ đúng hình học cũ (đường chạy, làn bơi, bia, đường đua KART_WORLD…) để vận động viên / xe chạy khớp như trước.
// lod 0 = nhìn gần (đủ chi tiết) · 1 = vừa · 2 = toàn cảnh (màu khối).

// ---------- mẫu lát tự vẽ ----------
const v65bDeck = g => v65bPat(g, 'deck', 32, (q, s) => { q.fillStyle = '#c9d6dc'; q.fillRect(0, 0, s, s); q.fillStyle = '#eef3f4'; q.fillRect(1, 1, 14, 14); q.fillRect(17, 1, 14, 14); q.fillRect(1, 17, 14, 14); q.fillRect(17, 17, 14, 14); q.fillStyle = '#ffffff'; q.fillRect(1, 1, 14, 2); q.fillRect(17, 17, 14, 2); });
const v65bConc = g => v65bPat(g, 'conc', 32, (q, s) => { q.fillStyle = '#aeb4bb'; q.fillRect(0, 0, s, s); q.fillStyle = '#bcc2c8'; q.fillRect(1, 1, 30, 30); q.fillStyle = '#c9ced3'; q.fillRect(1, 1, 30, 3); q.fillStyle = '#a3a9b0'; [[6, 12], [20, 22], [24, 7], [10, 26]].forEach(([x, y]) => q.fillRect(x, y, 2, 2)); });
const v65bAsph = g => v65bPat(g, 'asph', 32, (q, s) => { q.fillStyle = '#5a5c66'; q.fillRect(0, 0, s, s); for(let i = 0; i < 22; i++){ const h = v65bH(i, 7); q.fillStyle = h % 3 ? '#666873' : '#4c4e57'; q.fillRect(h % 31, (h >> 5) % 31, 2, 1); } });
const v65bWater = g => v65bPat(g, 'water', 64, (q, s) => { q.fillStyle = '#3db5e8'; q.fillRect(0, 0, s, s); q.fillStyle = '#52c4ef'; for(let i = 0; i < 8; i++){ const h = v65bH(i, 3); q.fillRect(h % 56, (h >> 6) % 60, 8, 2); } q.fillStyle = '#9fe3f8'; for(let i = 0; i < 4; i++){ const h = v65bH(i, 11); q.fillRect(h % 58, (h >> 6) % 60, 5, 1); } });
const v65bCarpet = g => v65bPat(g, 'carpet', 40, (q, s) => { q.fillStyle = '#2d2a4a'; q.fillRect(0, 0, s, s); q.fillStyle = '#353158'; q.fillRect(2, 2, 36, 36); q.fillStyle = 'rgba(38,198,218,.55)'; q.fillRect(0, 0, s, 1); q.fillRect(0, 0, 1, s); q.fillStyle = '#3f3a66'; q.fillRect(18, 18, 4, 4); });
const v65bSnow = g => v65bPat(g, 'snow', 32, (q, s) => { q.fillStyle = '#f6fafd'; q.fillRect(0, 0, s, s); q.fillStyle = '#e3eef6'; [[4, 6], [18, 3], [26, 19], [9, 24], [21, 28]].forEach(([x, y]) => q.fillRect(x, y, 3, 1)); q.fillStyle = '#ffffff'; q.fillRect(12, 12, 2, 2); });
const v65bPlank = g => v64sPat(g, 'W', 5, 13, 2);
const v65bSnowOver = (g, a) => { g.fillStyle = `rgba(255,255,255,${a || .45})`; g.fill(); };

// ---------- mảnh dùng chung ----------
function v65bLanes(g, cx, cy, rx, ry, n, step){   // đường chạy nhiều làn (elip), vạch trắng
  for(let k = n; k >= 0; k--){ v65bEll(g, cx, cy, rx - (n - k)*step, ry - (n - k)*step, k % 2 ? '#c9583f' : '#bf5039'); }
}
function v65bFlowers(g, x, y, n, seed){ if(v65bDong()) return; const fl = [[0, 11], [3, 11], [6, 11], [1, 11]]; for(let k = 0; k < n; k++){ const f = fl[(seed + k) % 4]; v64sT(g, 'N', f[0], f[1], x + k*22, y + (k % 2)*8, 1, 1, 1.5); } }
function v65bBed(g, x, y, wT, hT, seed, lod){   // bồn hoa khối cỏ đậm NA
  if(lod === 2){ g.fillStyle = v65bDong() ? '#e8eef0' : '#4f8a3a'; g.fillRect(x, y, wT*32, hT*32); return; }
  v64sNine(g, 'FL', 0, v65bDong() ? 12 : 6, x, y, wT, hT); if(v65bDong()) return;
  const fl = [[0, 11], [3, 11], [6, 11], [1, 11]]; for(let j = 0; j < hT; j++) for(let i = 0; i < wT; i++) if((i + j + seed) % 2 === 0){ const f = fl[(i + j*3 + seed) % 4]; v64sT(g, 'N', f[0], f[1], x + i*32 + 4, y + j*32 + 2, 1, 1, 1.5); }
}
function v65bRoofBand(g, sty, x, w, yTop, yBot){   // mái ngói NA phía sau tường trên (chỉ phần mái thấy được trong lề khu)
  const wT = Math.max(3, Math.round((w + 24)/32)), xx = x + w/2 - wT*16;
  g.save(); g.beginPath(); g.rect(x - 12, yTop, w + 24, yBot - yTop); g.clip(); v64sHouse(g, sty, xx, yBot - 64, wT, 2, 0, []);
  if(v65bDong()){ g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(xx + 6, yBot - 62, wT*32 - 12, 14); } g.restore();
}
function v65bWalls(g, r, top, side, bot, door, pat){   // tường gạch NA quanh nhà thi đấu (cửa giữa cạnh dưới)
  const bar = (x, y, w, h) => { if(w <= 0 || h <= 0) return; g.fillStyle = V65B_WO; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = pat; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, w, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + h - 3, w, 3); };
  bar(r.x, r.y, r.w, top); bar(r.x, r.y + top, side, r.h - top); bar(r.x + r.w - side, r.y + top, side, r.h - top);
  const dx = r.x + r.w/2; bar(r.x + side, r.y + r.h - bot, dx - door/2 - r.x - side, bot); bar(dx + door/2, r.y + r.h - bot, r.x + r.w - side - dx - door/2, bot);
  [dx - door/2, dx + door/2].forEach(px => { g.fillStyle = V65B_WO; g.fillRect(px - 4, r.y + r.h - bot - 6, 8, bot + 6); g.fillStyle = '#8a5a35'; g.fillRect(px - 2, r.y + r.h - bot - 4, 4, bot + 2); });
  if(v65bDong()){ g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(r.x, r.y - 2, r.w, 4); }
}
function v65bWindows(g, x0, x1, y, n){ const st = (x1 - x0)/n; for(let i = 0; i < n; i++){ const x = x0 + st*i + st/2 - 10; g.fillStyle = V65B_WO; g.fillRect(x - 2, y - 2, 24, 16); g.fillStyle = '#9fd4ee'; g.fillRect(x, y, 20, 12); g.fillStyle = '#d8f1fb'; g.fillRect(x, y, 20, 3); g.fillStyle = V65B_WO; g.fillRect(x + 9, y, 2, 12); } }
function v65bSignAt(g, lod, cx, y, text){ if(lod === 0) v64sBoard(g, cx, y, text); }

// ---------- 1. Sân vận động Olympic (900×610) ----------
function v65bStadium(g, r, z, lod){
  const dong = v65bDong(), cx = r.x + 450, cy = r.y + 305;
  v65bPlot(g, z, lod);
  // sân đá lát quanh đường chạy
  v65bEll(g, cx, cy, 446, 304, '#4a3428'); v65bEll(g, cx, cy, 442, 300, lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a');
  if(dong){ g.beginPath(); g.ellipse(cx, cy, 442, 300, 0, 0, 7); v65bSnowOver(g, .4); }
  // đường chạy 6 làn
  v65bEll(g, cx, cy, 424, 284, V65B_O); v65bLanes(g, cx, cy, 420, 280, 6, 15);
  if(dong){ g.beginPath(); g.ellipse(cx, cy, 420, 280, 0, 0, 7); v65bSnowOver(g, .28); }
  if(lod < 2){ g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; for(let k = 0; k <= 6; k++){ g.beginPath(); g.ellipse(cx, cy, 330 + k*15, 190 + k*15, 0, 0, 7); g.stroke(); }
    // vạch đích + số làn
    g.fillStyle = '#ffffff'; g.fillRect(cx - 3, cy + 190, 6, 90); for(let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? '#111' : '#fff'; g.fillRect(cx + 4, cy + 192 + k*15, 6, 6); g.fillStyle = k % 2 ? '#fff' : '#111'; g.fillRect(cx + 4, cy + 198 + k*15, 6, 6); } }
  // sân cỏ giữa: sọc cỏ
  v65bEll(g, cx, cy, 333, 193, V65B_O);
  g.save(); g.beginPath(); g.ellipse(cx, cy, 330, 190, 0, 0, 7); g.clip();
  for(let i = 0; i < 12; i++){ g.fillStyle = dong ? (i % 2 ? '#e9f0f2' : '#dde7ea') : (i % 2 ? '#5aa04a' : '#4f9442'); g.fillRect(cx - 330 + i*55, cy - 190, 56, 380); }
  if(lod < 2){
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy - 10, 54, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx, cy - 190); g.lineTo(cx, cy + 190); g.stroke();
    // vòng tròn Olympic giữa sân
    [['#3d7bff', -2, 0], ['#111111', 0, 0], ['#ef4b4b', 2, 0], ['#ffd23f', -1, 1], ['#2fbf71', 1, 1]].forEach(([c, i, j]) => { g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.arc(cx + i*22, cy - 16 + j*12, 12, 0, 7); g.stroke(); g.strokeStyle = c; g.lineWidth = 3; g.stroke(); });
    // nhảy xa: đường đà đỏ + hố cát (khung gỗ)
    v65bBox(g, r.x + 200, r.y + 246, 160, 18, '#c9583f'); g.fillStyle = '#ffffff'; g.fillRect(r.x + 200, r.y + 246, 160, 2); g.fillRect(r.x + 200, r.y + 262, 160, 2); g.fillRect(r.x + 350, r.y + 246, 4, 18);
    v65bBox(g, r.x + 362, r.y + 234, 40, 42, '#8a5a35', V65B_WO); g.fillStyle = dong ? '#f2f6f8' : '#ecc983'; g.fillRect(r.x + 366, r.y + 238, 32, 34); g.fillStyle = dong ? '#dfe8ee' : '#d8ad62'; for(let k = 0; k < 6; k++) g.fillRect(r.x + 369 + (k*11) % 26, r.y + 242 + (k*7) % 26, 4, 2);
    // nhảy cao: đệm xanh + 2 cột + xà
    v65bBox(g, r.x + 478, r.y + 208, 74, 40, '#2f6fd6'); g.fillStyle = '#5b93ee'; g.fillRect(r.x + 478, r.y + 208, 74, 8); g.fillStyle = '#1e4fa6'; g.fillRect(r.x + 478, r.y + 244, 74, 4);
    [r.x + 472, r.x + 556].forEach(px => { g.fillStyle = V65B_O; g.fillRect(px - 2, r.y + 188, 6, 30); g.fillStyle = '#e4e4e4'; g.fillRect(px - 1, r.y + 189, 4, 28); }); g.fillStyle = V65B_O; g.fillRect(r.x + 472, r.y + 192, 88, 4); g.fillStyle = '#ffd23f'; for(let k = 0; k < 88; k += 16) g.fillRect(r.x + 472 + k, r.y + 193, 8, 2);
    // ném lao / đẩy tạ: đường đà + vòng ném
    v65bBox(g, r.x + 470, r.y + 330, 150, 6, '#c9583f'); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(r.x + 640, r.y + 333, 14, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(r.x + 652, r.y + 326); g.lineTo(r.x + 760, r.y + 286); g.moveTo(r.x + 652, r.y + 340); g.lineTo(r.x + 760, r.y + 380); g.stroke();
  }
  g.restore();
  // 4 góc: bồn hoa
  if(lod < 2){ [[r.x + 14, r.y + 470], [r.x + 790, r.y + 470]].forEach(([x, y], i) => v65bBed(g, x, y, 3, 2, i, lod)); if(lod === 0){ v65bFlowers(g, r.x + 30, r.y + 120, 3, 1); v65bFlowers(g, r.x + 806, r.y + 120, 3, 2); } }
  v65bSignAt(g, lod, cx, r.y + r.h + 4, '🏟️ Sân vận động Olympic · chạm để thi đấu');
}

// ---------- 2. Hồ bơi Olympic 5 làn (600×300) ----------
function v65bPool(g, r, z, lod){
  const dong = v65bDong(), px = r.x + 30, py = r.y + 40, pw = r.w - 60, ph = r.h - 80;
  v65bPlot(g, z, lod);
  v65bBox(g, r.x, r.y, r.w, r.h, lod < 2 ? v65bDeck(g) : '#e4ecef');
  if(dong){ g.beginPath(); g.rect(r.x, r.y, r.w, r.h); v65bSnowOver(g, .35); }
  // thành bể trắng + nước
  v65bBox(g, px - 6, py - 6, pw + 12, ph + 12, '#f4f6f6'); g.fillStyle = V65B_O; g.fillRect(px - 2, py - 2, pw + 4, ph + 4);
  g.fillStyle = lod < 2 ? v65bWater(g) : '#3db5e8'; g.fillRect(px, py, pw, ph);
  g.fillStyle = 'rgba(0,40,80,.18)'; g.fillRect(px, py, pw, 6); g.fillRect(px, py, 6, ph);   // bóng thành bể
  if(lod === 2) return;
  const ln = ph/5;
  for(let k = 0; k < 5; k++){ const y = py + ln*k + ln/2; g.fillStyle = '#2a8fc2'; g.fillRect(px + 30, y - 2, pw - 60, 4); g.fillRect(px + 24, y - 8, 4, 16); g.fillRect(px + pw - 28, y - 8, 4, 16); }
  // dây phao làn đỏ/trắng
  for(let k = 1; k < 5; k++){ const y = py + ln*k; g.fillStyle = V65B_O; g.fillRect(px, y - 3, pw, 6); for(let x = px; x < px + pw; x += 12){ g.fillStyle = (x - px) % 24 ? '#ef4b4b' : '#ffffff'; g.fillRect(x + 1, y - 2, 10, 4); } }
  // cờ bơi ngửa
  [px + 60, px + pw - 60].forEach(fx => { g.strokeStyle = V65B_O; g.lineWidth = 1; g.beginPath(); g.moveTo(fx, py - 6); g.lineTo(fx, py + ph + 6); g.stroke(); for(let y = py + 6; y < py + ph; y += 14){ g.fillStyle = ['#ef4b4b', '#ffd23f', '#3d7bff'][(y/14 | 0) % 3]; g.beginPath(); g.moveTo(fx - 4, y); g.lineTo(fx + 4, y); g.lineTo(fx, y + 7); g.fill(); } });
  // bục xuất phát có số làn (Nunito 16px)
  g.font = "900 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  for(let k = 0; k < 5; k++){ const y = py + ln*k + ln/2; v65bBox(g, r.x + 8, y - 12, 22, 24, '#f4f6f6'); g.fillStyle = '#2f6fd6'; g.fillRect(r.x + 8, y + 8, 22, 4); g.fillStyle = '#1b2533'; g.fillText(String(k + 1), r.x + 19, y - 1); }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  // bảng chạm đích + cầu thang
  g.fillStyle = '#0277bd'; g.fillRect(px + pw - 6, py, 6, ph);
  [[px + pw - 90, py + ph - 2], [px + 90, py + ph - 2]].forEach(([x, y]) => { g.fillStyle = V65B_O; g.fillRect(x - 1, y - 18, 4, 22); g.fillRect(x + 13, y - 18, 4, 22); g.fillStyle = '#d6dde2'; g.fillRect(x, y - 17, 2, 20); g.fillRect(x + 14, y - 17, 2, 20); g.fillStyle = '#9aa6ad'; for(let k = 0; k < 3; k++) g.fillRect(x + 2, y - 14 + k*6, 12, 2); });
  // ghế nằm trên bờ dưới
  for(let i = 0; i < 4; i++){ const x = r.x + 190 + i*44, y = r.y + r.h - 32; v65bBox(g, x, y, 34, 14, ['#ff8a2b', '#26c6da', '#ff6f91', '#ffd23f'][i]); g.fillStyle = 'rgba(255,255,255,.55)'; for(let k = 4; k < 34; k += 6) g.fillRect(x + k, y, 2, 14); g.fillStyle = '#ffffff'; g.fillRect(x, y, 8, 14); }
  v65bSignAt(g, lod, r.x + r.w/2, r.y + 7, '🏊 Hồ bơi Olympic · chạm để thi bơi');
}

// ---------- 3. Trường bắn cung (600×290) — bia tập thể thao, an toàn ----------
function v65bArchery(g, r, z, lod){
  const dong = v65bDong();
  v65bPlot(g, z, lod);
  v65bBox(g, r.x, r.y, r.w, r.h, v65bGrass(g, lod), '#4a3428');
  if(lod === 2){ g.fillStyle = '#c58a52'; g.fillRect(r.x + 20, r.y + 10, 78, r.h - 20); return; }
  // sọc cỏ cắt theo làn
  for(let k = 0; k < 5; k++){ g.fillStyle = k % 2 ? 'rgba(255,255,255,.1)' : 'rgba(0,60,0,.07)'; g.fillRect(r.x + 98, r.y + 15 + k*50, r.w - 98, 50); }
  // dải đất sau bia + hàng rào gỗ
  g.fillStyle = '#4a3428'; g.fillRect(r.x + r.w - 46, r.y + 6, 40, r.h - 12); g.fillStyle = dong ? '#e6edf0' : '#b98a55'; g.fillRect(r.x + r.w - 44, r.y + 8, 36, r.h - 16);
  for(let y = r.y + 10; y < r.y + r.h - 10; y += 26){ g.fillStyle = V65B_WO; g.fillRect(r.x + r.w - 14, y, 8, 22); g.fillStyle = '#9a6236'; g.fillRect(r.x + r.w - 12, y + 2, 4, 18); }
  g.fillStyle = V65B_WO; g.fillRect(r.x + r.w - 16, r.y + 10, 3, r.h - 20); g.fillStyle = '#c99560'; g.fillRect(r.x + r.w - 15, r.y + 10, 1, r.h - 20);
  // vạch chia làn (đứt) + cột mốc cự li
  g.fillStyle = 'rgba(255,255,255,.85)'; for(let k = 0; k <= 5; k++){ const y = r.y + 15 + k*50; for(let x = r.x + 100; x < r.x + r.w - 50; x += 20) g.fillRect(x, y - 1, 10, 2); }
  [r.x + 240, r.x + 380].forEach((mx, i) => { for(let k = 0; k <= 5; k++){ const y = r.y + 15 + k*50; g.fillStyle = V65B_O; g.fillRect(mx - 3, y - 7, 6, 10); g.fillStyle = i ? '#ffd23f' : '#ffffff'; g.fillRect(mx - 2, y - 6, 4, 8); } });
  // bục bắn: sàn gỗ + vạch bắn trắng
  v65bBox(g, r.x + 20, r.y + 10, 76, r.h - 20, v65bPlank(g), V65B_WO); if(dong){ g.beginPath(); g.rect(r.x + 20, r.y + 10, 76, r.h - 20); v65bSnowOver(g, .4); }
  g.fillStyle = '#ffffff'; g.fillRect(r.x + 98, r.y + 10, 4, r.h - 20);
  v65bSignAt(g, lod, r.x + r.w/2, r.y + r.h - 4, '🎯 Trường bắn cung · chạm để tập bắn');
}

// ---------- 4. Nhà thi đấu thể dục dụng cụ (420×300) ----------
function v65bGym(g, r, z, lod){
  v65bPlot(g, z, lod);
  if(lod === 2){ g.fillStyle = '#c58a52'; g.fillRect(r.x, r.y, r.w, r.h); g.fillStyle = '#2f6fd6'; g.fillRect(r.x + 40, r.y + 60, 160, 160); return; }
  v65bRoofBand(g, 8, r.x, r.w, r.y - 30, r.y + 2);
  g.fillStyle = v65bPlank(g); g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(r.x, r.y, r.w, r.h);
  v65bWalls(g, r, 30, 16, 20, 64, v64sPat(g, 'H', 6, 2, 1));
  // vạch sân thi đấu
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.strokeRect(r.x + 26, r.y + 40, r.w - 52, r.h - 70);
  // thảm tự do xanh 160×160
  v65bBox(g, r.x + 40, r.y + 60, 160, 160, '#2f6fd6'); g.fillStyle = '#3d7fe6'; g.fillRect(r.x + 40, r.y + 60, 160, 6);
  g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(r.x + 50, r.y + 70, 140, 140); g.fillStyle = '#ef4b4b'; [[50, 70], [186, 70], [50, 206], [186, 206]].forEach(([x, y]) => g.fillRect(r.x + x, r.y + y, 4, 4));
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(r.x + 50, r.y + 70); g.lineTo(r.x + 190, r.y + 210); g.moveTo(r.x + 190, r.y + 70); g.lineTo(r.x + 50, r.y + 210); g.stroke();
  // đệm dưới cầu thăng bằng + xà kép
  v65bBox(g, r.x + 224, r.y + 112, 162, 26, '#9fb4c8'); g.fillStyle = '#b8cad9'; g.fillRect(r.x + 224, r.y + 112, 162, 4);
  v65bBox(g, r.x + 226, r.y + 206, 160, 44, '#2f6fd6'); g.fillStyle = '#3d7fe6'; g.fillRect(r.x + 226, r.y + 206, 160, 4);
  // bục nhảy chống + ván dậm
  v65bBox(g, r.x + 60, r.y + 236, 22, 10, '#f4f4f4'); g.fillStyle = '#ef4b4b'; g.fillRect(r.x + 60, r.y + 242, 22, 4);
  v65bBox(g, r.x + 100, r.y + 230, 60, 22, '#b97a45', V65B_WO); g.fillStyle = '#ece4d4'; g.fillRect(r.x + 100, r.y + 230, 60, 7); g.fillStyle = '#8a5a35'; g.fillRect(r.x + 100, r.y + 244, 60, 2);
  // bát phấn
  v65bEll(g, r.x + 216, r.y + 244, 9, 5, V65B_O); v65bEll(g, r.x + 216, r.y + 243, 7, 3.5, '#f4f4f4');
  v65bSignAt(g, lod, r.x + r.w/2, r.y - 30, '🤸 Thể dục dụng cụ · chạm để thi');
}

// ---------- 5. Đấu trường online (420×290) ----------
function v65bArena(g, r, z, lod){
  v65bPlot(g, z, lod);
  if(lod === 2){ g.fillStyle = '#2d2a4a'; g.fillRect(r.x, r.y, r.w, r.h); return; }
  v65bRoofBand(g, 0, r.x, r.w, r.y - 20, r.y + 2);
  g.fillStyle = v65bCarpet(g); g.fillRect(r.x, r.y, r.w, r.h);
  v65bWalls(g, r, 26, 16, 22, 64, v64sPat(g, 'H', 6, 2, 1));
  // viền đèn neon quanh sàn
  g.strokeStyle = '#ff6f91'; g.lineWidth = 3; g.strokeRect(r.x + 24, r.y + 34, r.w - 48, r.h - 64); g.strokeStyle = 'rgba(38,198,218,.8)'; g.lineWidth = 1; g.strokeRect(r.x + 29, r.y + 39, r.w - 58, r.h - 74);
  // thảm đỏ từ cửa
  g.fillStyle = '#8c2f2f'; g.fillRect(r.x + r.w/2 - 22, r.y + 230, 44, r.h - 230); g.fillStyle = '#b34545'; g.fillRect(r.x + r.w/2 - 18, r.y + 230, 36, r.h - 230);
  // ghế trước 6 bàn máy
  for(let k = 0; k < 6; k++){ const x = r.x + 40 + (k % 3)*120 + 40, y = r.y + 50 + Math.floor(k/3)*100 + 66;
    v65bEll(g, x, y + 2, 13, 5, 'rgba(0,0,0,.3)'); v65bBox(g, x - 11, y - 10, 22, 14, ['#ef4b4b', '#3d7bff', '#2fbf71', '#ffd23f', '#b06bff', '#ff8a2b'][k]); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - 11, y - 10, 22, 3); }
  v64sBoard(g, r.x + r.w/2, r.y - 2, '🎮 Đấu trường online', true);
  v65bSignAt(g, lod, r.x + r.w/2, r.y + r.h + 8, 'Chạm để tìm đối thủ');
}

// ---------- 6. Sân bóng rổ (200×300) ----------
function v65bBasket(g, r, z, lod){
  const dong = v65bDong(), x = r.x + 14, y = r.y + 14, w = r.w - 28, h = r.h - 44, cx = x + w/2, my = y + h/2;
  v65bPlot(g, z, lod);
  v65bBox(g, r.x, r.y, r.w, r.h, '#3e8a68'); g.fillStyle = dong ? '#dfe8ee' : '#d77a45'; g.fillRect(x, y, w, h);
  if(lod === 2) return;
  g.fillStyle = 'rgba(0,0,0,.06)'; for(let k = 0; k < w; k += 16) g.fillRect(x + k, y, 1, h);   // ván sàn
  g.fillStyle = dong ? '#c7d6e0' : '#c25e34'; g.fillRect(cx - 30, y, 60, 58); g.fillRect(cx - 30, y + h - 58, 60, 58);   // vùng cấm
  g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x, my); g.lineTo(x + w, my); g.stroke();
  g.beginPath(); g.arc(cx, my, 22, 0, 7); g.stroke(); g.strokeRect(cx - 30, y, 60, 58); g.strokeRect(cx - 30, y + h - 58, 60, 58);
  g.beginPath(); g.arc(cx, y + 58, 22, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(cx, y + h - 58, 22, Math.PI, 0); g.stroke();
  g.beginPath(); g.arc(cx, y + 16, 62, .1, Math.PI - .1); g.stroke(); g.beginPath(); g.arc(cx, y + h - 16, 62, Math.PI + .1, -.1); g.stroke();
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(cx, my, 10, 0, 7); g.fill(); g.fillStyle = '#ef4b4b'; g.fillRect(cx - 2, my - 10, 4, 20);
  // băng ghế dự bị dưới sân
  v65bBox(g, r.x + 18, r.y + r.h - 24, 52, 10, '#c9c2b4'); v65bBox(g, r.x + r.w - 70, r.y + r.h - 24, 52, 10, '#c9c2b4');
  v65bSignAt(g, lod, r.x + r.w/2, r.y + r.h - 6, '🏀 Bóng rổ');
}

// ---------- 7. Sân trượt ván (200×300) ----------
function v65bSkate(g, r, z, lod){
  const dong = v65bDong();
  v65bPlot(g, z, lod);
  v65bBox(g, r.x, r.y, r.w, r.h, lod < 2 ? v65bConc(g) : '#bcc2c8');
  if(dong){ g.beginPath(); g.rect(r.x, r.y, r.w, r.h); v65bSnowOver(g, .3); }
  if(lod === 2) return;
  // máng trượt (halfpipe): dốc đậm ở trên, sáng dần xuống đáy
  const hx = r.x + 10, hy = r.y + 10, hw = r.w - 20; v65bBox(g, hx, hy, hw, 90, '#8d949c');
  ['#6d737a', '#7f868d', '#939aa1', '#a6adb4', '#b6bcc2', '#c2c8cd'].forEach((c, i) => { g.fillStyle = c; g.fillRect(hx, hy + 8 + i*13, hw, 14); });
  g.fillStyle = '#b97a45'; g.fillRect(hx, hy - 8, hw, 8); g.fillStyle = V65B_WO; g.fillRect(hx, hy - 1, hw, 2);   // sàn gỗ trên cùng
  g.fillStyle = '#e8ecef'; g.fillRect(hx, hy + 2, hw, 4); g.fillStyle = V65B_O; g.fillRect(hx, hy + 6, hw, 1);    // thanh kim loại mép
  // vẽ trang trí vui: ngôi sao + ô Rubik
  const st = (sx, sy, c) => { g.fillStyle = c; g.fillRect(sx - 1, sy - 6, 3, 13); g.fillRect(sx - 6, sy - 1, 13, 3); g.fillRect(sx - 3, sy - 3, 7, 7); };
  st(hx + 30, hy + 58, '#ff6f91'); st(hx + hw - 30, hy + 50, '#ffd23f');
  for(let i = 0; i < 9; i++){ g.fillStyle = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#ffffff'][i % 6]; g.fillRect(hx + hw/2 - 13 + (i % 3)*9, hy + 46 + Math.floor(i/3)*9, 8, 8); }
  // hộp nhảy (funbox) + hai dốc
  const fx = r.x + 20, fy = r.y + 150; v65bBox(g, fx, fy, 50, 30, '#c58a52', V65B_WO); g.fillStyle = '#d99a5c'; g.fillRect(fx, fy, 50, 5); g.fillStyle = '#e8ecef'; g.fillRect(fx, fy + 26, 50, 2);
  [[fx - 22, 1], [fx + 50, -1]].forEach(([x0, s]) => { g.fillStyle = V65B_O; g.beginPath(); g.moveTo(s > 0 ? x0 + 22 : x0, fy - 1); g.lineTo(s > 0 ? x0 - 1 : x0 + 23, fy + 31); g.lineTo(s > 0 ? x0 + 22 : x0, fy + 31); g.fill();
    g.fillStyle = '#a6adb4'; g.beginPath(); g.moveTo(s > 0 ? x0 + 21 : x0 + 1, fy + 2); g.lineTo(s > 0 ? x0 + 2 : x0 + 20, fy + 29); g.lineTo(s > 0 ? x0 + 21 : x0 + 1, fy + 29); g.fill(); });
  g.font = "900 18px Nunito, 'Be Vietnam Pro', sans-serif"; g.fillStyle = 'rgba(255,111,145,.9)'; g.fillText('SKATE', r.x + 112, r.y + 166);
  v65bSignAt(g, lod, r.x + r.w/2, r.y + r.h - 12, '🛹 Trượt ván');
}

// ---------- 8. Sân trượt patin (200×300) ----------
function v65bPatin(g, r, z, lod){
  const cx = r.x + 100, cy = r.y + 140;
  v65bPlot(g, z, lod);
  v65bBox(g, r.x, r.y, r.w, r.h, lod < 2 ? v64sPat(g, 'FI', 17, 1, 2) : '#e7d1a1');
  if(v65bDong()){ g.beginPath(); g.rect(r.x, r.y, r.w, r.h); v65bSnowOver(g, .35); }
  v65bEll(g, cx, cy, 94, 132, V65B_O); v65bEll(g, cx, cy, 91, 129, '#ff6f91'); v65bEll(g, cx, cy, 86, 124, '#4f9be0');
  if(lod === 2) return;
  g.save(); g.beginPath(); g.ellipse(cx, cy, 86, 124, 0, 0, 7); g.clip(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 8; for(let k = -4; k < 6; k++){ g.beginPath(); g.moveTo(r.x + k*50, r.y + 260); g.lineTo(r.x + k*50 + 200, r.y + 20); g.stroke(); } g.restore();
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(cx, cy, 70, 106, 0, 0, 7); g.stroke(); g.setLineDash([]);
  g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, 50, 86, 0, 0, 7); g.stroke();
  // đảo hoa giữa sân
  v65bEll(g, cx, cy, 40, 76, V65B_O); g.save(); g.beginPath(); g.ellipse(cx, cy, 38, 74, 0, 0, 7); g.clip(); g.fillStyle = lod < 2 ? v64sPat(g, 'FL', 1, v65bDong() ? 13 : 7, 2) : '#4f8a3a'; g.fillRect(cx - 40, cy - 76, 80, 152);
  if(!v65bDong()) for(let k = 0; k < 6; k++) v64sT(g, 'N', [0, 3, 6][k % 3], 11, cx - 18 + (k % 2)*16, cy - 60 + k*20, 1, 1, 1.5); g.restore();
  // cọc chóp tập luyện
  [[r.x + 20, r.y + 30], [r.x + 180, r.y + 30], [r.x + 20, r.y + 250], [r.x + 180, r.y + 250]].forEach(([x, y]) => { g.fillStyle = V65B_O; g.beginPath(); g.moveTo(x - 7, y + 4); g.lineTo(x, y - 10); g.lineTo(x + 7, y + 4); g.fill(); g.fillStyle = '#ff8a2b'; g.beginPath(); g.moveTo(x - 5, y + 3); g.lineTo(x, y - 7); g.lineTo(x + 5, y + 3); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 2, 6, 2); });
  v65bSignAt(g, lod, r.x + r.w/2, r.y + r.h - 12, '⛸️ Trượt patin');
}

// ---------- 9. Sân trượt tuyết (500×500) — luôn có tuyết ----------
function v65bSki(g, r, z, lod){
  const snow = lod < 2 ? v65bSnow(g) : '#f4f8fb';
  v65bPlot(g, z, lod, lod < 2 ? v64sPat(g, 'FL', 1, 13, 2) : '#eef3f6');
  // dốc trượt hình thang
  g.beginPath(); g.moveTo(r.x - 3, r.y + r.h); g.lineTo(r.x + 38, r.y + 7); g.lineTo(r.x + r.w - 38, r.y + 7); g.lineTo(r.x + r.w + 3, r.y + r.h); g.closePath(); g.fillStyle = '#7f98ad'; g.fill();
  g.beginPath(); g.moveTo(r.x, r.y + r.h); g.lineTo(r.x + 40, r.y + 10); g.lineTo(r.x + r.w - 40, r.y + 10); g.lineTo(r.x + r.w, r.y + r.h); g.closePath(); g.fillStyle = snow; g.fill();
  if(lod === 2) return;
  g.save(); g.clip();
  g.fillStyle = 'rgba(160,190,215,.25)'; for(let y = r.y + 14; y < r.y + r.h; y += 6) g.fillRect(r.x, y, r.w, 1);   // vết máy ủi tuyết
  g.strokeStyle = 'rgba(130,165,200,.45)'; g.lineWidth = 2; for(let k = 0; k < 5; k++){ g.beginPath(); g.moveTo(r.x + 120 + k*60, r.y + 20); g.bezierCurveTo(r.x + 60 + k*70, r.y + 200, r.x + 200 + k*50, r.y + 320, r.x + 110 + k*70, r.y + r.h); g.stroke(); }
  // bóng xanh nhạt ở hai mép dốc
  g.fillStyle = 'rgba(120,160,200,.18)'; g.beginPath(); g.moveTo(r.x, r.y + r.h); g.lineTo(r.x + 40, r.y + 10); g.lineTo(r.x + 70, r.y + 10); g.lineTo(r.x + 34, r.y + r.h); g.fill();
  g.restore();
  // lưới an toàn cam dọc hai mép dốc
  g.strokeStyle = '#ff8a2b'; g.lineWidth = 3; g.setLineDash([8, 6]); [[r.x + 6, r.y + r.h - 4, r.x + 44, r.y + 14], [r.x + r.w - 6, r.y + r.h - 4, r.x + r.w - 44, r.y + 14]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }); g.setLineDash([]);
  // cờ slalom đỏ/xanh
  for(let k = 0; k < 7; k++){ const fy = r.y + 70 + k*58, fx = r.x + 230 + (k % 2 ? 60 : -50); g.fillStyle = V65B_O; g.fillRect(fx - 1, fy - 18, 3, 20); g.fillStyle = k % 2 ? '#3d7bff' : '#ef4b4b'; g.fillRect(fx + 2, fy - 18, 12, 9); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(fx - 2, fy + 1, 8, 2); }
  // cáp treo: dây cáp
  g.strokeStyle = V65B_O; g.lineWidth = 2; [-3, 3].forEach(o => { g.beginPath(); g.moveTo(r.x + 70 + o, r.y + r.h - 20); g.lineTo(r.x + 90 + o, r.y + 30); g.stroke(); });
  v65bSignAt(g, lod, r.x + 160, r.y + r.h - 2, '⛷️ Sân trượt tuyết · chạm để chơi');
}

// ---------- 10. Trường đua Rubik Kart (1280×630) ----------
function v65bKart(g, r, z, lod){
  const P = KART_WORLD, path = () => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  v65bPlot(g, z, lod);
  g.lineJoin = 'round'; g.lineCap = 'round';
  path(); g.strokeStyle = V65B_O; g.lineWidth = 64; g.stroke();
  path(); g.strokeStyle = '#f4f4f4'; g.lineWidth = 58; g.stroke();
  if(lod < 2){ path(); g.strokeStyle = '#e0473f'; g.setLineDash([14, 14]); g.stroke(); g.setLineDash([]); }
  path(); g.strokeStyle = V65B_O; g.lineWidth = 48; g.stroke();
  path(); g.strokeStyle = lod < 2 ? v65bAsph(g) : '#5a5c66'; g.lineWidth = 46; g.stroke();
  if(v65bDong()){ path(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 46; g.stroke(); }
  if(lod === 2) return;
  path(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.setLineDash([14, 14]); g.stroke(); g.setLineDash([]);
  // vạch xuất phát ô cờ
  const s0 = P[0]; for(let k = 0; k < 8; k++) for(let c = 0; c < 2; c++){ g.fillStyle = (k + c) % 2 ? '#111' : '#fff'; g.fillRect(s0[0] - 6 + c*6, s0[1] - 23 + k*6, 6, 6); }
  for(let k = 0; k < 3; k++){ g.fillStyle = '#ffffff'; g.fillRect(s0[0] + 14 + (k % 2)*12, s0[1] - 18 + k*14, 10, 2); }   // ô đứng xe
  // logo Rubik lớn giữa sân + bồn hoa
  const cx = r.x + 640, cy = r.y + 315; v65bBox(g, cx - 64, cy - 64, 128, 128, '#1b1820');
  for(let i = 0; i < 9; i++){ const c = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#ffffff'][[0, 3, 1, 5, 2, 4, 1, 0, 3][i]]; g.fillStyle = c; g.fillRect(cx - 60 + (i % 3)*41, cy - 60 + Math.floor(i/3)*41, 38, 38); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(cx - 60 + (i % 3)*41, cy - 60 + Math.floor(i/3)*41, 38, 5); }
  v65bBed(g, cx - 260, cy - 32, 3, 2, 0, lod); v65bBed(g, cx + 164, cy - 32, 3, 2, 2, lod);
  // chồng lốp ở các khúc cua
  const tire = (x, y) => { for(let k = 0; k < 3; k++){ v65bEll(g, x + (k - 1)*14, y, 8, 6, V65B_O); v65bEll(g, x + (k - 1)*14, y - 1, 6, 4, '#3a3a44'); v65bEll(g, x + (k - 1)*14, y - 1, 2.5, 1.5, '#8a8a96'); } };
  [[r.x + 60, r.y + 315], [r.x + 640, r.y + 60], [r.x + 260, r.y + 130], [r.x + 1020, r.y + 130], [r.x + 260, r.y + 500], [r.x + 1020, r.y + 500], [r.x + 640, r.y + 580]].forEach(([x, y]) => tire(x, y));
  v65bSignAt(g, lod, r.x + 1010, r.y + r.h - 2, '🏎️ Trường đua Rubik Kart · chạm để đua');
}

const V65B_G = {stadium:v65bStadium, pool:v65bPool, archery:v65bArchery, gym:v65bGym, arena:v65bArena, basket:v65bBasket, skate:v65bSkate, patin:v65bPatin, ski:v65bSki, kart:v65bKart};
