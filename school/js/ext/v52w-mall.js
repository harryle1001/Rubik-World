// ================= v52w · 4/4 TTTM CẦU VỒNG: 3 tầng, thang cuốn + thang máy, điện máy, thời trang, đồ chơi, sách, rạp phim, khu ăn uống =================
// Mặt bằng mỗi tầng 1618 × 1000 (chữ nhật vàng): dãy cửa hàng sâu 1000/φ² = 382, giếng trời elip ở giữa, thang cuốn hai bên.
// Mua bằng $ trong game; đồ mua lưu vào PROF.v52bag (túi đồ, hồ sơ). Tên, biển hiệu, sản phẩm đều tự đặt, không dùng thương hiệu thật.
const V52WM_W = 1618, V52WM_H = 1000, V52WM_TOP = 96, V52WM_FRONT = 478;
const V52WM_ITEMS = [
  // điện máy Tia Chớp
  {id:'laptop', s:'tech', n:'Laptop Rubik Book 14"', p:300, d:'Mở được: chơi mini game, xem thành tích, học tin học.', dev:1},
  {id:'tablet', s:'tech', n:'Máy tính bảng Lá Phong', p:180, d:'Màn hình 10 inch, mở được như laptop.', dev:1},
  {id:'phone', s:'tech', n:'Điện thoại Sóng Biển', p:220, d:'Gọi video với bạn bè, chụp ảnh đẹp.', dev:1},
  {id:'phones', s:'tech', n:'Tai nghe Mây Trôi', p:45, d:'Chống ồn nhẹ, nghe nhạc chill.'},
  {id:'kbd', s:'tech', n:'Bàn phím cơ Cầu Vồng', p:60, d:'Đèn bảy màu, gõ êm tay.'},
  {id:'mouse', s:'tech', n:'Chuột không dây Ốc Sên', p:20, d:'Nhỏ gọn, pin dùng cả tháng.'},
  {id:'watch', s:'tech', n:'Đồng hồ thông minh Nhịp', p:95, d:'Đếm bước chân, nhắc uống nước.'},
  {id:'speaker', s:'tech', n:'Loa mini Giọt Nước', p:35, d:'Chống nước, mang đi cắm trại.'},
  // thời trang Mây Trắng
  {id:'tee', s:'fashion', n:'Áo phông Khối Rubik', p:15, ic:'👕'}, {id:'jacket', s:'fashion', n:'Áo khoác gió', p:38, ic:'🧥'}, {id:'cap', s:'fashion', n:'Mũ lưỡi trai', p:12, ic:'🧢'},
  {id:'shoes', s:'fashion', n:'Giày chạy bộ', p:45, ic:'👟'}, {id:'dress', s:'fashion', n:'Váy hoa mùa hè', p:30, ic:'👗'}, {id:'shades', s:'fashion', n:'Kính râm', p:14, ic:'🕶️'},
  // đồ chơi Vui Vẻ
  {id:'robot', s:'toys', n:'Robot lắp ghép', p:65, ic:'🤖', d:'Lắp 120 mảnh, học cơ khí.'}, {id:'bear', s:'toys', n:'Gấu bông Mật Ong', p:20, ic:'🧸'}, {id:'rccar', s:'toys', n:'Xe điều khiển', p:42, ic:'🏎️'},
  {id:'r4', s:'toys', n:'Rubik 4×4', p:16, ic:'🧩'}, {id:'kite', s:'toys', n:'Diều rồng', p:12, ic:'🪁'}, {id:'puzzle', s:'toys', n:'Tranh ghép 1000 mảnh', p:25, ic:'🖼️'},
  // nhà sách Trang Vàng (mua lần đầu được EXP)
  {id:'dict', s:'books', n:'Từ điển Anh – Việt', p:18, ic:'📘', book:1}, {id:'space', s:'books', n:'Bách khoa Vũ trụ', p:24, ic:'🪐', book:1}, {id:'comic', s:'books', n:'Truyện tranh Cậu bé Rubik', p:8, ic:'📗', book:1},
  {id:'code', s:'books', n:'Lập trình cho bạn nhỏ', p:22, ic:'💻', book:1}, {id:'atlas', s:'books', n:'Atlas Thế giới', p:26, ic:'🗺️', book:1}, {id:'sea', s:'books', n:'Đại dương kỳ thú', p:20, ic:'🐠', book:1},
  // góc Rubik + thể thao Gió (tầng 2)
  {id:'mega', s:'rubik', n:'Rubik Megaminx', p:30, ic:'⬟'}, {id:'pyra', s:'rubik', n:'Rubik Kim tự tháp', p:16, ic:'🔺'}, {id:'timer', s:'rubik', n:'Đồng hồ bấm giờ Rubik', p:18, ic:'⏱️'},
  {id:'bjj', s:'sport', n:'Võ phục Nhu thuật', p:55, ic:'🥋', d:'Võ phục trắng, đai trắng cho người mới tập.'}, {id:'mask', s:'sport', n:'Kính lặn + ống thở', p:32, ic:'🤿'}, {id:'tent', s:'sport', n:'Lều cắm trại 2 người', p:80, ic:'⛺'},
  {id:'pole', s:'sport', n:'Gậy leo núi', p:26, ic:'🥾'}, {id:'ball', s:'sport', n:'Bóng đá', p:14, ic:'⚽'},
  // ăn uống (ăn ngay, không vào túi)
  {id:'icecream', s:'ice', n:'Kem ốc quế', p:3, ic:'🍦', food:1}, {id:'icetea', s:'ice', n:'Trà chanh', p:2, ic:'🍋', food:1},
  {id:'pho', s:'food1', n:'Phở bò', p:6, ic:'🍜', food:1}, {id:'bun', s:'food1', n:'Bún chả', p:6, ic:'🥢', food:1},
  {id:'banhmi', s:'food2', n:'Bánh mì pa-tê', p:4, ic:'🥖', food:1}, {id:'com', s:'food2', n:'Cơm tấm', p:6, ic:'🍚', food:1},
  {id:'tea', s:'food3', n:'Trà sữa trân châu', p:5, ic:'🧋', food:1}, {id:'juice', s:'food3', n:'Nước cam', p:3, ic:'🍊', food:1},
  {id:'flan', s:'food4', n:'Bánh flan', p:3, ic:'🍮', food:1}, {id:'fruit', s:'food4', n:'Hoa quả dầm', p:4, ic:'🍉', food:1}
];
const V52WM_SHOP = {tech:['⚡', 'Điện máy Tia Chớp', '#1e88e5'], fashion:['👕', 'Thời trang Mây Trắng', '#ec407a'], toys:['🧸', 'Đồ chơi Vui Vẻ', '#ff9800'], books:['📚', 'Nhà sách Trang Vàng', '#8d6e63'],
  rubik:['🧩', 'Góc Rubik', '#7e57c2'], sport:['🥋', 'Thể thao Gió', '#26a69a'], ice:['🍦', 'Kem Tuyết', '#4fc3f7'], info:['ℹ️', 'Quầy thông tin', '#78909c'],
  cinema:['🎬', 'Rạp phim Ngôi Sao', '#c62828'], food:['🍜', 'Phở Ẩm Thực', '#ef6c00'], food1:['🍜', 'Quán Phở Ngon', '#ef6c00'], food2:['🥖', 'Bánh Mì Giòn', '#ffa000'], food3:['🧋', 'Trà Sữa Mây', '#8d6e63'], food4:['🍮', 'Chè & Bánh', '#ec407a']};
const V52WM_FLOORS = [
  {n:'Tầng 1 · Sảnh, Điện máy, Thời trang', L:'tech', R:'fashion', KL:'ice', KR:'info', mid:'fountain'},
  {n:'Tầng 2 · Đồ chơi, Nhà sách, Rubik, Thể thao', L:'toys', R:'books', KL:'rubik', KR:'sport', mid:'void'},
  {n:'Tầng 3 · Rạp phim, Khu ăn uống', L:'cinema', R:'food', KL:null, KR:null, mid:'void'}
];
const V52WM = {f:0, npcs:[[], [], []], film:null};
function v52wmShops(f){ const F = V52WM_FLOORS[f]; return [{k:F.L, x0:40, x1:640}, {k:F.R, x0:978, x1:1578}].map(s => Object.assign(s, {y0:V52WM_TOP, y1:V52WM_FRONT, cx:(s.x0 + s.x1)/2})); }
function v52wmKiosks(f){ const F = V52WM_FLOORS[f], K = []; if(F.KL) K.push({k:F.KL, x0:300, x1:536, y0:866, y1:944}); if(F.KR) K.push({k:F.KR, x0:1082, x1:1318, y0:866, y1:944}); return K; }
// furniture blocks inside a shop (relative to the shop)
function v52wmBlocks(s){
  const B = [], x0 = s.x0, x1 = s.x1, y0 = s.y0;
  if(s.k === 'cinema'){ for(let r = 0; r < 3; r++){ const y = y0 + 150 + r*62; B.push([x0 + 50, y, s.cx - 44, y + 30, 'seat'], [s.cx + 44, y, x1 - 50, y + 30, 'seat']); } B.push([x0 + 30, y0 + 312, x0 + 200, y0 + 340, 'counter']); return B; }
  if(s.k === 'food'){ for(let i = 0; i < 4; i++){ const sx = x0 + 22 + i*140; B.push([sx, y0 + 60, sx + 124, y0 + 112, 'stall' + i]); } [[x0 + 120, y0 + 230], [x0 + 300, y0 + 230], [x0 + 480, y0 + 230], [x0 + 210, y0 + 320], [x0 + 390, y0 + 320]].forEach(([x, y]) => B.push([x - 40, y - 16, x + 40, y + 14, 'table'])); return B; }
  B.push([x0 + 14, y0, x1 - 14, y0 + 74, 'shelf']);                                 // back wall shelves
  B.push([x0 + 14, y0 + 74, x0 + 54, y0 + 300, 'side'], [x1 - 54, y0 + 74, x1 - 14, y0 + 220, 'side']);
  B.push([x0 + 140, y0 + 160, x0 + 290, y0 + 206, 'table'], [x0 + 330, y0 + 160, x0 + 480, y0 + 206, 'table']);
  B.push([x1 - 230, y0 + 288, x1 - 70, y0 + 318, 'counter']);
  return B;
}
function v52wmCounter(s){ if(s.k === 'cinema') return [s.x0 + 115, s.y0 + 368]; if(s.k === 'food') return null; return [s.x1 - 150, s.y0 + 348]; }
function v52wmWalk(x, y){
  const f = V52WM.f; if(x < 16 || x > V52WM_W - 16 || y < 150) return false;
  if(y > 952){ if(!(f === 0 && Math.abs(x - 809) < 64 && y < 996)) return false; }
  // escalators (rail sides blocked; stepping on the entry rides)
  if(x > 112 && x < 238 && y > 528 && y < 904) return false; if(x > 1380 && x < 1506 && y > 528 && y < 904) return false;
  const F = V52WM_FLOORS[f], ex = (x - 809)/(F.mid === 'void' ? 300 : 196), ey = (y - 712)/(F.mid === 'void' ? 148 : 98); if(ex*ex + ey*ey < 1) return false;
  for(const K of v52wmKiosks(f)) if(x > K.x0 - 4 && x < K.x1 + 4 && y > K.y0 - 4 && y < K.y1 + 4) return false;
  if(y < V52WM_FRONT + 14){
    if(x > 640 && x < 978) return y > 196;                                            // lift lobby
    for(const s of v52wmShops(f)){ if(x < s.x0 - 8 || x > s.x1 + 8) continue;
      if(y > V52WM_FRONT - 12) return Math.abs(x - s.cx) < 70;                         // shop front wall (opening in the middle)
      if(x < s.x0 + 16 || x > s.x1 - 16 || y < s.y0 + 60) return false;
      for(const b of v52wmBlocks(s)) if(x > b[0] - 6 && x < b[2] + 6 && y > b[1] - 2 && y < b[3] + 10) return false;
      return true; }
    return false;
  }
  return true;
}
// ---------- product icons (pixel art drawn in code) ----------
function v52wmIcon(g, id, x, y, s){
  const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x + a*s), Math.round(y + b*s), Math.max(1, Math.round(w*s)), Math.max(1, Math.round(h*s))); };
  switch(id){
    case 'laptop': R('#37474f', 4, 4, 32, 20); R('#4fc3f7', 6, 6, 28, 16); R('#e1f5fe', 8, 8, 10, 3); R('#ffd23f', 24, 15, 6, 4); R('#90a4ae', 0, 24, 40, 5); R('#607d8b', 15, 25, 10, 2); break;
    case 'tablet': R('#263238', 8, 2, 24, 34); R('#81c784', 10, 5, 20, 26); R('#fff59d', 13, 9, 6, 6); R('#455a64', 18, 32, 4, 2); break;
    case 'phone': R('#212121', 13, 2, 15, 32); R('#64b5f6', 14, 5, 13, 24); R('#bbdefb', 15, 7, 5, 4); R('#424242', 18, 30, 5, 2); break;
    case 'phones': R('#5c6bc0', 8, 6, 24, 5); R('#5c6bc0', 6, 9, 5, 12); R('#5c6bc0', 29, 9, 5, 12); R('#3949ab', 4, 18, 9, 13); R('#3949ab', 27, 18, 9, 13); R('#c5cae9', 6, 21, 5, 7); R('#c5cae9', 29, 21, 5, 7); break;
    case 'kbd': R('#455a64', 0, 12, 40, 16); ['#ef5350', '#ffca28', '#66bb6a', '#42a5f5', '#ab47bc'].forEach((c, i) => { for(let r = 0; r < 3; r++) R(c, 2 + i*7.6, 14 + r*4.5, 6, 3.5); }); break;
    case 'mouse': R('#eceff1', 12, 8, 16, 24); R('#cfd8dc', 12, 8, 16, 4); R('#90a4ae', 19, 9, 2, 8); R('#b0bec5', 12, 28, 16, 4); break;
    case 'watch': R('#455a64', 15, 0, 10, 40); R('#212121', 10, 10, 20, 20); R('#26c6da', 12, 12, 16, 16); R('#fff', 19, 14, 2, 7); R('#fff', 20, 20, 5, 2); break;
    case 'speaker': R('#26a69a', 10, 6, 20, 30); R('#004d40', 13, 10, 14, 14); R('#80cbc4', 17, 14, 6, 6); R('#004d40', 16, 27, 8, 5); break;
    default: break;
  }
}
function v52wmItemIcon(it, size){ const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if(V52WM_ITEMS.find(i => i.id === it.id && i.s === 'tech')) v52wmIcon(g, it.id, size*.1, size*.1, size/50);
  else { g.font = Math.round(size*.68) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.ic || '🎁', size/2, size/2 + 2); }
  return c; }
// ---------- static floor painting ----------
function v52wmPaint(g){
  const f = V52WM.f, F = V52WM_FLOORS[f], W = V52WM_W, H = V52WM_H, P = V52W_PHI;
  // marble floor
  g.fillStyle = '#ece6da'; g.fillRect(0, 0, W, H); for(let y = 0; y < H; y += 62) for(let x = ((y/62) % 2)*50; x < W; x += 100){ g.fillStyle = (x + y) % 3 ? '#e3dccd' : '#f2ede3'; g.fillRect(x, y, 98, 60); }
  g.fillStyle = 'rgba(160,140,110,.25)'; for(let y = 0; y < H; y += 62) g.fillRect(0, y, W, 2);
  // corridor runner (golden band) + outer walls
  g.fillStyle = 'rgba(176,72,47,.12)'; g.fillRect(260, 500, W - 520, 18); g.fillRect(260, 920, W - 520, 18);
  g.fillStyle = '#5d6d7e'; g.fillRect(0, 0, W, 96); g.fillStyle = '#7f8c9a'; g.fillRect(0, 84, W, 12); g.fillStyle = '#4a5866'; g.fillRect(0, H - 48, W, 48); g.fillRect(0, 0, 14, H); g.fillRect(W - 14, 0, 14, H);
  for(let x = 30; x < W; x += 120){ g.fillStyle = '#fff3c4'; g.fillRect(x, 30, 60, 10); }   // ceiling lights
  if(f === 0){ g.fillStyle = '#b3e5fc'; g.fillRect(745, H - 48, 128, 48); g.fillStyle = '#455a64'; g.fillRect(807, H - 48, 4, 48); g.fillStyle = '#ffca28'; g.fillRect(735, H - 52, 148, 6);
    g.font = "800 16px Nunito, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('LỐI RA · PHỐ ĐI BỘ', 809, H - 58); g.textAlign = 'left'; }
  // lift lobby: two lift doors (golden widths), benches, plants
  g.fillStyle = '#8d99a6'; g.fillRect(640, 96, 338, 100); [[680, 110], [838, 110]].forEach(([x, y]) => { g.fillStyle = '#b0bec5'; g.fillRect(x, y, 120, 86); g.fillStyle = '#cfd8dc'; g.fillRect(x + 6, y + 6, 52, 80); g.fillRect(x + 62, y + 6, 52, 80); g.fillStyle = '#ffca28'; g.fillRect(x + 50, y - 10, 20, 8); });
  g.font = "800 15px Nunito, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('🛗 THANG MÁY · TẦNG ' + (f + 1), 809, 104 + 0); g.textAlign = 'left';
  [[660, 300], [958, 300]].forEach(([x, y]) => { g.fillStyle = '#6d4c41'; g.fillRect(x - 14, y, 28, 22); g.fillStyle = '#2e7d32'; g.beginPath(); g.arc(x, y - 6, 18, 0, Math.PI*2); g.fill(); });
  // shops
  v52wmShops(f).forEach(s => v52wmShopPaint(g, s));
  v52wmKiosks(f).forEach(K => v52wmKioskPaint(g, K));
  // atrium: fountain (G) or void with glass railing and the floor below
  const cx = 809, cy = 712; if(F.mid === 'fountain'){ g.fillStyle = '#b0bec5'; g.beginPath(); g.ellipse(cx, cy, 214, 112, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#4fc3f7'; g.beginPath(); g.ellipse(cx, cy, 196, 98, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#81d4fa'; g.beginPath(); g.ellipse(cx, cy, 196/P, 98/P, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#eceff1'; g.beginPath(); g.ellipse(cx, cy, 196/P/P/P, 98/P/P/P, 0, 0, Math.PI*2); g.fill(); }
  else { g.fillStyle = '#3d4a56'; g.beginPath(); g.ellipse(cx, cy, 300, 148, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#9aa7b3'; g.beginPath(); g.ellipse(cx, cy + 30, 260, 110, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; for(let k = 0; k < 9; k++) g.fillRect(cx - 220 + k*50, cy - 40 + (k % 3)*30, 30, 12);
    g.strokeStyle = 'rgba(200,235,255,.75)'; g.lineWidth = 8; g.beginPath(); g.ellipse(cx, cy, 304, 152, 0, 0, Math.PI*2); g.stroke(); g.strokeStyle = '#90a4ae'; g.lineWidth = 3; g.stroke(); }
  // escalators
  [[112, 'up'], [1380, 'down']].forEach(([x, d]) => { const show = d === 'up' ? f < 2 : f > 0; g.fillStyle = '#546e7a'; g.fillRect(x, 528, 126, 376); g.fillStyle = show ? '#90a4ae' : '#78909c'; g.fillRect(x + 14, 540, 98, 352);
    g.fillStyle = 'rgba(0,0,0,.18)'; for(let y = 548; y < 890; y += 16) g.fillRect(x + 16, y, 94, 3); g.fillStyle = '#263238'; g.fillRect(x, 528, 12, 376); g.fillRect(x + 114, 528, 12, 376);
    const ly = d === 'up' ? 872 : 566; g.fillStyle = show ? '#ffd23f' : 'rgba(38,50,56,.85)'; g.fillRect(x + 4, ly - 14, 118, 28); g.font = "800 15px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = show ? '#1a1430' : '#fff';
    g.fillText(show ? (d === 'up' ? '⬆ TẦNG ' + (f + 2) : '⬇ TẦNG ' + f) : (d === 'up' ? 'TẦNG CUỐI' : 'TẦNG TRỆT'), x + 63, ly); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; });
  g.font = "800 18px Nunito, sans-serif"; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('TTTM CẦU VỒNG · ' + F.n.toUpperCase(), 30, 64);
}
function v52wmShopPaint(g, s){
  const [ic, name, col] = V52WM_SHOP[s.k], x0 = s.x0, x1 = s.x1, y0 = s.y0, y1 = s.y1, w = x1 - x0;
  g.fillStyle = s.k === 'cinema' ? '#3b2a40' : s.k === 'food' ? '#f3e5d0' : '#f7f3ea'; g.fillRect(x0, y0, w, y1 - y0);
  if(s.k === 'cinema'){ g.fillStyle = '#5b3d63'; for(let y = y0; y < y1; y += 30) g.fillRect(x0, y, w, 2); }
  // walls (side + front with opening = 146 = 382/φ²)
  g.fillStyle = shade(col, -.35); g.fillRect(x0 - 8, y0, 12, y1 - y0 + 12); g.fillRect(x1 - 4, y0, 12, y1 - y0 + 12);
  g.fillRect(x0 - 8, y1 - 12, s.cx - 73 - x0 + 8, 24); g.fillRect(s.cx + 73, y1 - 12, x1 + 8 - s.cx - 73, 24); g.fillStyle = '#b3e5fc'; g.fillRect(x0 + 6, y1 - 10, s.cx - 73 - x0 - 12, 6); g.fillRect(s.cx + 79, y1 - 10, x1 - s.cx - 85, 6);
  // sign over the opening
  g.fillStyle = col; g.fillRect(s.cx - 150, y1 + 14, 300, 30); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(s.cx - 150, y1 + 14, 300, 5);
  g.font = "800 17px Nunito, 'Be Vietnam Pro', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ic + ' ' + name, s.cx, y1 + 30); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  v52wmBlocks(s).forEach(b => {
    const [a, bb, c, d, k] = b; if(k === 'seat'){ for(let x = a; x < c - 20; x += 34){ g.fillStyle = '#b71c1c'; g.fillRect(x, bb, 30, 30); g.fillStyle = '#e53935'; g.fillRect(x + 2, bb + 2, 26, 12); } return; }
    if(k === 'counter'){ g.fillStyle = '#5d4037'; g.fillRect(a, bb, c - a, d - bb); g.fillStyle = '#8d6e63'; g.fillRect(a, bb, c - a, 6); g.fillStyle = '#263238'; g.fillRect(a + 20, bb - 14, 30, 16); g.fillStyle = '#4fc3f7'; g.fillRect(a + 22, bb - 12, 26, 10); return; }
    if(k === 'table' && s.k === 'food'){ g.fillStyle = '#d7ccc8'; g.fillRect(a, bb, c - a, d - bb); g.fillStyle = '#a1887f'; [[a - 18, bb + 6], [c + 4, bb + 6]].forEach(([x, y]) => g.fillRect(x, y, 14, 14)); return; }
    if(k.startsWith('stall')){ const i = +k.slice(5), fk = 'food' + (i + 1), [fi, fn, fc] = V52WM_SHOP[fk]; g.fillStyle = fc; g.fillRect(a, bb - 50, c - a, 34); g.fillStyle = '#fff'; g.font = "800 14px Nunito, sans-serif"; g.textAlign = 'center'; g.fillText(fi + ' ' + fn, (a + c)/2, bb - 28); g.textAlign = 'left';
      g.fillStyle = '#6d4c41'; g.fillRect(a, bb, c - a, d - bb); g.fillStyle = '#a1887f'; g.fillRect(a, bb, c - a, 6); g.fillStyle = '#eceff1'; g.fillRect(a + 10, bb - 14, 26, 12); g.fillRect(a + 46, bb - 14, 26, 12); g.fillStyle = '#ffca28'; g.fillRect(a + 84, bb - 12, 20, 10); return; }
    if(k === 'shelf' || k === 'side'){ g.fillStyle = '#8d6e63'; g.fillRect(a, bb, c - a, d - bb); g.fillStyle = '#a1887f'; for(let y = bb + 4; y < d - 4; y += 24) g.fillRect(a + 2, y + 18, c - a - 4, 4);
      for(let y = bb + 6; y < d - 8; y += 24) for(let x = a + 6; x < c - 12; x += 16){ const h = (x*7 + y*3) % 5; g.fillStyle = s.k === 'books' ? ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a'][h] : s.k === 'fashion' ? ['#f48fb1', '#81d4fa', '#fff59d', '#a5d6a7', '#ce93d8'][h] : s.k === 'toys' ? ['#ff7043', '#ffd54f', '#4fc3f7', '#81c784', '#ba68c8'][h] : s.k === 'tech' ? ['#37474f', '#455a64', '#546e7a', '#263238', '#4fc3f7'][h] : ['#80cbc4', '#ffcc80', '#b39ddb', '#ef9a9a', '#a5d6a7'][h];
        g.fillRect(x, y, s.k === 'books' ? 6 : 12, s.k === 'books' ? 18 : 14); } return; }
    if(k === 'table'){ g.fillStyle = '#eceff1'; g.fillRect(a, bb, c - a, d - bb); g.fillStyle = '#b0bec5'; g.fillRect(a, d - 6, c - a, 6);
      if(s.k === 'tech'){ v52wmIcon(g, 'laptop', a + 10, bb + 4, .9); v52wmIcon(g, 'tablet', a + 60, bb, .9); v52wmIcon(g, 'phone', a + 100, bb, .9); }
      else if(s.k === 'fashion'){ for(let i = 0; i < 6; i++){ g.fillStyle = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#26c6da'][i]; g.fillRect(a + 8 + i*23, bb + 8, 18, 26); } }
      else if(s.k === 'toys'){ g.fillStyle = '#ffb74d'; g.beginPath(); g.arc(a + 30, bb + 20, 16, 0, Math.PI*2); g.fill(); g.fillStyle = '#90a4ae'; g.fillRect(a + 70, bb + 6, 26, 30); g.fillStyle = '#ef5350'; g.fillRect(a + 110, bb + 14, 30, 16); }
      else if(s.k === 'books'){ for(let i = 0; i < 5; i++){ g.fillStyle = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a'][i]; g.fillRect(a + 10 + i*27, bb + 12, 22, 28); g.fillStyle = '#fff'; g.fillRect(a + 14 + i*27, bb + 16, 14, 3); } } }
  });
  if(s.k === 'cinema'){ g.fillStyle = '#1a1020'; g.fillRect(x0 + 40, y0 + 6, w - 80, 110); g.fillStyle = '#fafafa'; g.fillRect(x0 + 56, y0 + 16, w - 112, 86); g.fillStyle = '#b71c1c'; g.fillRect(x0 + 40, y0 + 6, 22, 110); g.fillRect(x1 - 62, y0 + 6, 22, 110); }
  if(s.k === 'tech'){ for(let i = 0; i < 4; i++){ g.fillStyle = '#212121'; g.fillRect(x0 + 80 + i*120, y0 + 6, 100, 56); g.fillStyle = ['#4fc3f7', '#81c784', '#ffb74d', '#ba68c8'][i]; g.fillRect(x0 + 84 + i*120, y0 + 10, 92, 48); } }
}
function v52wmKioskPaint(g, K){ const [ic, name, col] = V52WM_SHOP[K.k]; g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(K.x0 + 6, K.y1 - 4, K.x1 - K.x0, 10); g.fillStyle = col; g.fillRect(K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0); g.fillStyle = shade(col, .35); g.fillRect(K.x0, K.y0, K.x1 - K.x0, 12);
  g.fillStyle = '#fafafa'; g.fillRect(K.x0 + 12, K.y0 + 18, K.x1 - K.x0 - 24, 30); g.font = "800 15px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#263238'; g.fillText(ic + ' ' + name, (K.x0 + K.x1)/2, K.y0 + 33); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
// ---------- shop panel ----------
function v52wmBag(){ if(!PROF) return {}; PROF.v52bag = PROF.v52bag || {}; return PROF.v52bag; }
function v52wmShopPanel(k){
  const [ic, name] = V52WM_SHOP[k] || ['🛍️', 'Cửa hàng'], list = V52WM_ITEMS.filter(i => i.s === k), bag = v52wmBag(), money = PROF ? PROF.money : 0;
  let h = `<h2>${ic} ${v52wsEsc(name)}</h2><p class="v52money">💰 Bạn có <b>$${money}</b></p><div class="v52grid">`;
  list.forEach(it => { const own = bag[it.id] || 0; h += `<div class="v52item"><canvas data-ic="${it.id}" width="64" height="64"></canvas><b>${v52wsEsc(it.n)}</b>${it.d ? `<small>${v52wsEsc(it.d)}</small>` : ''}<span class="v52pr">$${it.p}${own ? ` · có ${own}` : ''}</span><button type="button" data-buy="${it.id}"${money < it.p ? ' class="poor"' : ''}>${it.food ? '😋 Mua ăn' : '🛒 Mua'}</button></div>`; });
  h += '</div>'; const p = v52wsPanel(h, 'v52shop'); if(!p) return;
  p.querySelectorAll('canvas[data-ic]').forEach(c => { const it = V52WM_ITEMS.find(i => i.id === c.dataset.ic), src = v52wmItemIcon(it, 64); c.getContext('2d').drawImage(src, 0, 0); });
  p.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => v52wmBuy(b.dataset.buy, k));
}
function v52wmBuy(id, k){
  const it = V52WM_ITEMS.find(i => i.id === id); if(!it) return; if(!PROF){ try { openLogin(); } catch(e){} return; }
  if(PROF.money < it.p){ toast(`💸 ${it.n} giá $${it.p}. Bạn còn $${PROF.money} — chơi mini game để kiếm thêm nhé!`); return; }
  PROF.money -= it.p; const bag = v52wmBag();
  if(it.food){ reward(3, 0, null, true); toast(`${it.ic} ${it.n} ngon tuyệt! Ăn uống đủ chất giúp học tốt hơn.`); }
  else { const first = !bag[id]; bag[id] = (bag[id] || 0) + 1; if(it.book && first) reward(12, 0, 'Đọc sách ' + it.n); else reward(2, 0, null, true);
    toast(`🎉 Đã mua ${it.n}! Đồ đã vào 🎒 túi của bạn.` + (it.dev ? ' Bấm 💻 để mở máy.' : '')); }
  try { saveProfile(); renderProfHud(); blipSfx(1320); } catch(e){} try { mprog('shop'); } catch(e){}
  if(typeof v52wDevBtn === 'function') v52wDevBtn(); v52wmShopPanel(k);
}
// ---------- cinema: a short film drawn in code (16 s) ----------
function v52wmFilm(){
  if(!PROF){ try { openLogin(); } catch(e){} return; } if(PROF.money < 6){ toast('🎟️ Vé xem phim $6. Bạn chưa đủ tiền.'); return; } PROF.money -= 6; try { saveProfile(); renderProfHud(); } catch(e){}
  const p = v52wsPanel('<h2>🎬 Phim ngắn: "Khối Rubik đi tìm bình minh"</h2><canvas id="v52Film" width="640" height="360"></canvas><p class="v52money" id="v52FilmT">Đang chiếu…</p>', 'v52film'); if(!p) return;
  const cv = p.querySelector('#v52Film'), g = cv.getContext('2d'), t0 = performance.now(), D = 16000; g.imageSmoothingEnabled = false;
  const cube = (x, y, s, rot) => { g.save(); g.translate(x, y); g.rotate(rot); const C = [['#ef5350', '#ffffff', '#ffca28'], ['#42a5f5', '#66bb6a', '#ff7043'], ['#ffffff', '#ffca28', '#42a5f5']]; for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++){ g.fillStyle = '#111'; g.fillRect(-s*1.5 + i*s, -s*1.5 + j*s, s, s); g.fillStyle = C[i][j]; g.fillRect(-s*1.5 + i*s + 2, -s*1.5 + j*s + 2, s - 4, s - 4); } g.fillStyle = '#111'; g.fillRect(-s*.6, -s*.4, s*.3, s*.3); g.fillRect(s*.3, -s*.4, s*.3, s*.3); g.restore(); };
  const draw = now => { if(!p.isConnected || p.hidden) return; const u = (now - t0)/D, t = (now - t0)/1000, sc = Math.min(3, Math.floor(u*4));
    const sky = [['#0d1b3e', '#283e7a'], ['#ff8a65', '#ffe082'], ['#81d4fa', '#e1f5fe'], ['#1a1040', '#3a2a7a']][sc]; g.fillStyle = sky[0]; g.fillRect(0, 0, 640, 360); g.fillStyle = sky[1]; g.fillRect(0, 180, 640, 180);
    if(sc === 0 || sc === 3){ g.fillStyle = '#fff'; for(let i = 0; i < 40; i++) g.fillRect((i*97 + t*6*(i % 3)) % 640, (i*53) % 170, 2, 2); }
    if(sc === 1){ g.fillStyle = '#ffeb3b'; g.beginPath(); g.arc(320, 230 - (u*4 - 1)*90, 46, 0, Math.PI*2); g.fill(); }
    g.fillStyle = sc === 3 ? '#1b3d2a' : '#4caf50'; g.fillRect(0, 280, 640, 80); g.fillStyle = sc === 3 ? '#14301f' : '#388e3c'; for(let x = 0; x < 640; x += 40) g.fillRect(x, 280, 20, 6);
    const cx = sc === 2 ? 80 + ((t*120) % 560) : sc === 1 ? 140 + (u*4 - 1)*120 : 120 + sc*20, cy = 252 - Math.abs(Math.sin(t*4))*(sc === 2 ? 30 : 6); cube(cx, cy, 14, sc === 2 ? t*4 : Math.sin(t*2)*.1);
    g.font = "800 22px Nunito, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(['Đêm tối, Khối Rubik không ngủ được…', 'Bạn ấy đi về phía đông và thấy bình minh!', 'Mặt trời giúp cây xanh lớn lên mỗi ngày.', 'Trái Đất quay, ngày và đêm nối tiếp nhau. HẾT ⭐'][sc], 320, 50); g.textAlign = 'left';
    if(u < 1) requestAnimationFrame(draw); else { const T = document.getElementById('v52FilmT'); if(T) T.textContent = '⭐ Phim hay quá! Trái Đất tự quay nên có ngày và đêm. +15 EXP'; reward(15, 0, 'Xem phim ở Rạp Ngôi Sao'); } };
  requestAnimationFrame(draw);
}
function v52wmLift(){
  let h = '<h2>🛗 Thang máy</h2><p class="v52money">Chọn tầng muốn tới:</p><div class="v52lift">'; V52WM_FLOORS.forEach((F, i) => { h += `<button type="button" data-f="${i}"${i === V52WM.f ? ' class="on"' : ''}><b>${i + 1}</b><small>${v52wsEsc(F.n.split('·')[1] || '')}</small></button>`; }); h += '</div>';
  const p = v52wsPanel(h, 'v52liftp'); if(!p) return; p.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { const f = +b.dataset.f; v52wsPanel(null); if(f === V52WM.f){ toast('🛗 Bạn đang ở tầng ' + (f + 1) + '.'); return; } V52WS.ride = {t:0, dur:.9, a:[809, 230], b:[809, 214], done:() => v52wmGoFloor(f, [809, 236])}; try { blipSfx(660); } catch(e){} });
}
// ---------- scene ----------
function v52wmNpcs(f){
  if(V52WM.npcs[f].length) return V52WM.npcs[f]; const N = [], r = v52wRndS(77 + f*13);
  for(let i = 0; i < 11; i++){ let x = 0, y = 0; for(let k = 0; k < 30; k++){ x = 260 + r()*1100; y = 520 + r()*420; if(v52wmWalkF(f, x, y)) break; } N.push(v52wsNpc('', 10 + i + f*11, x, y, {area:[260, 500, 1360, 950], sp:40 + r()*30, student:r() < .5})); }
  v52wmShops(f).forEach((s, si) => { if(s.k === 'food') return; for(let i = 0; i < 2; i++){ const x = s.x0 + 120 + r()*(s.x1 - s.x0 - 240), y = s.y0 + 240 + r()*120; N.push(v52wsNpc('', 40 + i + si*3 + f*7, x, y, {area:[s.x0 + 70, s.y0 + 230, s.x1 - 70, s.y0 + 370], sp:28})); }
    const c = v52wmCounter(s); if(c) N.push(v52wsNpc(s.k === 'cinema' ? 'Cô bán vé' : 'Nhân viên', 60 + si + f*2, c[0], c[1] - 70, {still:true, face:true, shirt:V52WM_SHOP[s.k][2], talk:v52wmTalk(s.k)})); });
  v52wmKiosks(f).forEach((K, i) => N.push(v52wsNpc('Nhân viên', 70 + i + f*2, (K.x0 + K.x1)/2, K.y0 - 4, {still:true, face:true, shirt:V52WM_SHOP[K.k][2], talk:v52wmTalk(K.k)})));
  if(f === 2){ const s = v52wmShops(2)[1]; [[120, 214], [300, 214], [480, 214], [210, 304], [390, 304]].forEach(([x, y], i) => { if(i % 2 === 0) N.push(v52wsNpc('', 80 + i, s.x0 + x - 54, s.y0 + y + 20, {still:true, student:true})); });
    for(let i = 0; i < 4; i++){ const sx = s.x0 + 22 + i*140; N.push(v52wsNpc('Đầu bếp', 90 + i, sx + 62, s.y0 + 56, {still:true, face:true, shirt:'#ffffff'})); } }
  return (V52WM.npcs[f] = N);
}
function v52wmWalkF(f, x, y){ const k = V52WM.f; V52WM.f = f; const r = v52wmWalk(x, y); V52WM.f = k; return r; }
function v52wmTalk(k){ return {tech:['Laptop Rubik Book có thể mở ra chơi mini game và học tin học đó!', 'Nhớ nghỉ mắt 20 giây sau mỗi 20 phút nhìn màn hình nhé.', 'Pin máy tính sạc tới 80% là tốt cho pin bền lâu.'],
  fashion:['Áo phông cotton thấm mồ hôi tốt cho mùa hè.', 'Màu sáng giúp mát hơn khi đi nắng đó!'], toys:['Robot lắp ghép giúp học cơ khí và sự kiên nhẫn.', 'Diều bay được nhờ gió tạo lực nâng!'],
  books:['Sách mua lần đầu tặng thêm EXP đó!', 'Đọc sách mỗi ngày giúp vốn từ phong phú hơn.'], rubik:['Megaminx có 12 mặt hình ngũ giác!', 'Kỷ lục thế giới giải Rubik 3×3 chỉ khoảng 3 giây!'],
  sport:['Nhu thuật (BJJ) dạy cách dùng đòn bẩy thay vì sức mạnh.', 'Lặn biển cần học bơi thật giỏi trước nhé.', 'Leo núi: đi chậm, đều, uống nước thường xuyên.'], ice:['Kem tan vì nhiệt từ không khí truyền vào đó!'],
  info:['TTTM có 3 tầng. Thang cuốn bên trái để lên, bên phải để xuống, thang máy ở giữa.'], cinema:['Phim hôm nay: "Khối Rubik đi tìm bình minh". Vé $6!']}[k] || ['Xin chào!']; }
function v52wmGoFloor(f, at){
  V52WM.f = f; const sc = V52WS.sc; if(!sc || sc.id.indexOf('mall') !== 0) return; sc.id = 'mall' + f; V52WS.npcs = v52wmNpcs(f); sc.spots = v52wmSpots(f);
  document.getElementById('v52wsSub').textContent = V52WM_FLOORS[f].n; V52WS.me.x = at[0]; V52WS.me.y = at[1]; V52WS.cam.x = at[0]; V52WS.cam.y = at[1]; V52WS.tap = null;
  const fd = document.getElementById('v52wsFade'); fd.classList.remove('go'); void fd.offsetWidth; fd.classList.add('go'); toast('🏬 ' + V52WM_FLOORS[f].n);
}
function v52wmSpots(f){
  const S = [];
  v52wmShops(f).forEach(s => { const c = v52wmCounter(s);
    if(s.k === 'cinema') S.push({x:c[0], y:c[1], r:70, ic:'🎟️', n:'Mua vé xem phim ($6)', f:v52wmFilm});
    else if(s.k === 'food'){ for(let i = 0; i < 4; i++){ const sx = s.x0 + 22 + i*140, fk = 'food' + (i + 1); S.push({x:sx + 62, y:s.y0 + 140, r:58, ic:V52WM_SHOP[fk][0], n:V52WM_SHOP[fk][1], f:() => v52wmShopPanel(fk)}); } }
    else S.push({x:c[0], y:c[1], r:72, ic:'🛒', n:'Mua sắm · ' + V52WM_SHOP[s.k][1], f:() => v52wmShopPanel(s.k)});
    if(s.k === 'tech') S.push({x:s.x0 + 215, y:s.y0 + 236, r:70, ic:'💻', n:'Thử laptop trưng bày', f:() => { if(typeof v52wDevice === 'function') v52wDevice('laptop', true); }}); });
  v52wmKiosks(f).forEach(K => S.push({x:(K.x0 + K.x1)/2, y:K.y1 + 22, r:66, ic:V52WM_SHOP[K.k][0], n:K.k === 'info' ? 'Hỏi quầy thông tin' : V52WM_SHOP[K.k][1], f:() => K.k === 'info' ? v52wsPanel('<h2>ℹ️ TTTM Cầu Vồng</h2><p>🏬 <b>Tầng 1</b>: Điện máy Tia Chớp, Thời trang Mây Trắng, Kem Tuyết.</p><p>🧸 <b>Tầng 2</b>: Đồ chơi Vui Vẻ, Nhà sách Trang Vàng, Góc Rubik, Thể thao Gió.</p><p>🎬 <b>Tầng 3</b>: Rạp phim Ngôi Sao, khu ăn uống.</p><p>⬆️ Thang cuốn trái đi lên · ⬇️ thang cuốn phải đi xuống · 🛗 thang máy ở giữa.</p>') : v52wmShopPanel(K.k)}));
  S.push({x:809, y:228, r:80, ic:'🛗', n:'Thang máy', f:v52wmLift});
  if(f < 2) S.push({x:175, y:928, r:46, ic:'⬆️', n:'Thang cuốn lên tầng ' + (f + 2), f:() => v52wmEsc(1)});
  if(f > 0) S.push({x:1443, y:508, r:46, ic:'⬇️', n:'Thang cuốn xuống tầng ' + f, f:() => v52wmEsc(-1)});
  if(f === 0) S.push({x:809, y:978, r:52, ic:'🚪', n:'Ra phố đi bộ', f:() => v52wsClose()});
  return S;
}
function v52wmEsc(d){ if(V52WS.ride) return; const f = V52WM.f + d; if(f < 0 || f > 2) return;
  if(d > 0) V52WS.ride = {t:0, dur:1.6, a:[175, 900], b:[175, 536], done:() => v52wmGoFloor(f, [175, 506])};
  else V52WS.ride = {t:0, dur:1.6, a:[1443, 536], b:[1443, 900], done:() => v52wmGoFloor(f, [1443, 930])};
  try { blipSfx(520); } catch(e){} }
function v52wMallOpen(){
  V52WM.f = 0; const sc = {id:'mall0', title:'🛍️ TTTM Cầu Vồng', sub:V52WM_FLOORS[0].n, w:V52WM_W, h:V52WM_H, start:[809, 940], body:1.7, zmin:.62, zmax:1.25, void:'#2b3440', speed:210,
    bgKey:() => V52WM.f, bg:v52wmPaint, walk:v52wmWalk, spots:v52wmSpots(0), npcs:v52wmNpcs(0),
    tick:dt => { const m = V52WS.me; if(V52WS.ride) return; if(V52WM.f < 2 && m.x > 120 && m.x < 230 && m.y > 904 && m.y < 922 && V52WS.keys.u) v52wmEsc(1); },
    under:(g, t) => { const f = V52WM.f;   // escalator steps moving, fountain water
      [[112, f < 2, -1], [1380, f > 0, 1]].forEach(([x, on, d]) => { if(!on) return; g.fillStyle = 'rgba(255,255,255,.35)'; const o = ((t*40*d) % 16 + 16) % 16; for(let y = 548 + o; y < 888; y += 16) g.fillRect(x + 16, y, 94, 2); });
      if(V52WM_FLOORS[f].mid === 'fountain'){ g.fillStyle = 'rgba(225,245,255,.9)'; for(let i = 0; i < 18; i++){ const a = i/18*Math.PI*2, ph = (t*.8 + i*.11) % 1, r = 20 + ph*150; g.fillRect(Math.round(809 + Math.cos(a)*r) - 2, Math.round(712 - Math.sin(ph*Math.PI)*70 + Math.sin(a)*r*.48) - 2, 4, 4); } g.fillRect(806, 640 - Math.sin(t*3)*6, 6, 70); }
      if(f === 2){ const s = v52wmShops(2)[0]; g.fillStyle = ['#ffcc80', '#90caf9', '#a5d6a7', '#f48fb1'][Math.floor(t/2) % 4]; g.fillRect(s.x0 + 56, s.y0 + 16, s.x1 - s.x0 - 112, 86); const cx = s.x0 + 100 + ((t*60) % (s.x1 - s.x0 - 200)); g.fillStyle = '#ef5350'; g.fillRect(cx, s.y0 + 64, 24, 24); g.fillStyle = '#fff'; g.fillRect(cx + 4, s.y0 + 70, 5, 5); } },
    onClose:() => { try { if(PLAYER && V52W.A){ PLAYER.x = V52W.A.mallDoor[0] + V46E; PLAYER.y = V52W.A.mallDoor[1] + 24; PLAYER._z = null; } } catch(e){} }};
  v52wsOpen(sc); try { mprog('visit'); } catch(e){}
  if(!V52WM.welcome){ V52WM.welcome = 1; setTimeout(() => { if(V52WS.open) toast('🛍️ Chào mừng tới TTTM Cầu Vồng! ⬆️ Thang cuốn bên trái lên tầng, 🛗 thang máy ở giữa.'); }, 700); }
}
