// ================= v65b · 3/3 CÔNG TRÌNH CÓ CHIỀU CAO: sprite cache, xếp lớp theo y cùng người trong khu =================
// Mỗi sprite: {k, x, y, w, h, base, draw(g, w, h)} (toạ độ cũ của khu, base = chân công trình) · live = vẽ trực tiếp (cây theo mùa đã cache sẵn).
// Đặt ở lề / mép khu (không chắn lối) — va chạm giữ nguyên như cũ.
const V65B_SKIN = ['#f6c9a0', '#e8b088', '#c98f63', '#a86f48', '#f3d2b5'], V65B_HAIR = ['#2b1a10', '#5a3a22', '#1b1b24', '#8a5a35', '#d9a441'];
const V65B_TEAM = ['#ef4b4b', '#3d7bff', '#ffd23f', '#2fbf71', '#ff8a2b', '#b06bff', '#26c6da', '#ff6f91'];
// khán đài: mái ngói đỏ + các bậc ghế có khán giả cổ vũ (đầu, áo nhiều màu)
function v65bStand(g, w, h, seed, label){
  const O = V65B_O, roof = 16, rows = Math.max(2, Math.floor((h - roof - 10)/11));
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(4, h - 5, w - 8, 5);
  g.fillStyle = O; g.fillRect(0, roof - 2, w, h - roof - 3); g.fillStyle = '#8d949c'; g.fillRect(2, roof, w - 4, h - roof - 7);
  for(let i = 0; i < rows; i++){ const y = roof + 2 + i*11; g.fillStyle = i % 2 ? '#a9b0b7' : '#b9c0c6'; g.fillRect(2, y + 7, w - 4, 4);
    g.fillStyle = V65B_TEAM[(i + seed) % 3 === 0 ? 1 : (i + seed) % 3 === 1 ? 0 : 2]; for(let x = 4; x < w - 6; x += 8) g.fillRect(x, y + 5, 6, 3);
    for(let x = 6; x < w - 8; x += 9){ const hh = v65bH(x + seed*31, i*17 + seed); if(hh % 10 < 3) continue;
      g.fillStyle = V65B_TEAM[hh % 8]; g.fillRect(x - 1, y + 3, 7, 4); g.fillStyle = V65B_SKIN[hh % 5]; g.fillRect(x, y - 2, 5, 5); g.fillStyle = V65B_HAIR[(hh >> 3) % 5]; g.fillRect(x, y - 3, 5, 2);
      if(hh % 13 === 0){ g.fillStyle = V65B_SKIN[hh % 5]; g.fillRect(x - 2, y - 6, 2, 4); g.fillRect(x + 5, y - 6, 2, 4); } } }   // tay giơ cổ vũ
  g.fillStyle = O; g.fillRect(0, h - 9, w, 3); g.fillStyle = '#e4ded2'; g.fillRect(0, h - 8, w, 1);   // lan can trước
  // mái ngói đỏ kiểu NA
  g.fillStyle = O; g.fillRect(-0, 0, w, roof + 2); g.fillStyle = '#c9433c'; g.fillRect(2, 2, w - 4, roof - 2);
  for(let x = 2; x < w - 2; x += 8){ g.fillStyle = '#e0625a'; g.fillRect(x, 3, 6, 3); g.fillStyle = '#a8352f'; g.fillRect(x + 6, 2, 2, roof - 2); }
  g.fillStyle = '#a8352f'; g.fillRect(2, roof - 4, w - 4, 2);
  if(v65bDong()){ g.fillStyle = '#ffffff'; g.fillRect(1, 0, w - 2, 6); }
  // cột + cờ đuôi nheo trên mái
  for(let x = 18; x < w - 10; x += 64){ g.fillStyle = O; g.fillRect(x, 0, 2, 2); }
  if(label) v64sBoard(g, w/2, 0, label);
}
function v65bFlood(g, w, h){   // cột đèn sân vận động
  const cx = w/2; g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx - 8, h - 4, 16, 4);
  g.fillStyle = V65B_O; g.fillRect(cx - 4, 16, 8, h - 18); g.fillRect(cx - 9, h - 6, 18, 6); g.fillStyle = '#9aa3ab'; g.fillRect(cx - 2, 17, 3, h - 22);
  g.fillStyle = V65B_O; g.fillRect(cx - 15, 0, 30, 18); for(let i = 0; i < 3; i++) for(let j = 0; j < 2; j++){ g.fillStyle = '#fff3c4'; g.fillRect(cx - 13 + i*9, 2 + j*8, 8, 6); g.fillStyle = '#f6d78a'; g.fillRect(cx - 13 + i*9, 6 + j*8, 8, 2); }
}
function v65bTreeS(x, y, i, pine){ return {k:'tree' + x + '_' + y, x:x - 34, y:y - 98, w:68, h:104, base:y, live:c => { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, pine ? 22 : 24, pine ? 7 : 8, 0, 0, 7); c.fill();
  if(pine) c.drawImage(v64sTreeSpr('pine', i), x - 33, y - 96); else c.drawImage(v64sTreeSpr('tree', i), x - 32, y - 60); }}; }
function v65bLampS(x, y){ return {k:'lamp' + x + '_' + y, x:x - 12, y:y - 60, w:24, h:64, base:y, light:[[x, y - 52, 70]], live:c => { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, 10, 4, 0, 0, 7); c.fill(); c.drawImage(v64sLampSpr(), x - 12, y - 60); }}; }
// thông thường: sprite cache tại (x, y) góc trái trên, chân ở y + h
const v65bS = (k, x, y, w, h, draw, extra) => Object.assign({k, x, y, w, h, base:y + h - 2, draw}, extra || {});

const V65B_SPR = {
  stadium:r => {
    const L = [];
    L.push(v65bS('stL', r.x + 24, r.y - 28, 270, 68, (g, w, h) => v65bStand(g, w, h, 1)));
    L.push(v65bS('stC', r.x + 316, r.y - 30, 268, 48, (g, w, h) => v65bStand(g, w, h, 2, '🏟️ Sân vận động Olympic')));
    L.push(v65bS('stR', r.x + 606, r.y - 28, 270, 68, (g, w, h) => v65bStand(g, w, h, 3)));
    [[r.x + 34, r.y + 112], [r.x + 866, r.y + 112]].forEach(([x, y], i) => L.push(v65bS('flood' + i, x - 16, y - 92, 32, 94, v65bFlood, {light:[[x, y - 84, 120]]})));
    L.push(v65bTreeS(r.x + 46, r.y + 600, 1), v65bTreeS(r.x + 854, r.y + 600, 2));
    // bảng điểm điện tử nhỏ cạnh vạch đích
    L.push(v65bS('score', r.x + 150, r.y + 540, 70, 48, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(8, h - 4, w - 16, 4); g.fillStyle = V65B_O; g.fillRect(w/2 - 4, 26, 8, h - 28); g.fillRect(0, 0, w, 28); g.fillStyle = '#1b2533'; g.fillRect(2, 2, w - 4, 24);
      g.fillStyle = '#ffd23f'; g.font = "900 16px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🥇🥈🥉', w/2, 15); }));
    return L; },
  pool:r => [
    // ghế cứu hộ cao
    v65bS('guard', r.x + r.w - 70, r.y + r.h - 70, 36, 64, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(2, h - 5, w - 4, 5); g.fillStyle = V65B_O; g.fillRect(4, 20, 5, h - 22); g.fillRect(w - 9, 20, 5, h - 22); g.fillRect(4, 18, w - 8, 6); g.fillStyle = '#f4f4f4'; g.fillRect(5, 21, 3, h - 24); g.fillRect(w - 8, 21, 3, h - 24); for(let y = 30; y < h - 4; y += 9){ g.fillStyle = V65B_O; g.fillRect(8, y, w - 16, 3); g.fillStyle = '#ef4b4b'; g.fillRect(9, y + 1, w - 18, 1); }
      g.fillStyle = V65B_O; g.fillRect(2, 0, w - 4, 20); g.fillStyle = '#ef4b4b'; g.fillRect(4, 2, w - 8, 16); g.fillStyle = '#ffffff'; g.fillRect(w/2 - 2, 4, 4, 12); g.fillRect(w/2 - 6, 8, 12, 4); }),
    // dù che nắng
    ...[[r.x + 150, 0], [r.x + 400, 1]].map(([x, i]) => v65bS('umb' + i, x - 26, r.y + r.h - 64, 52, 60, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(w/2, h - 3, 18, 4, 0, 0, 7); g.fill(); g.fillStyle = V65B_O; g.fillRect(w/2 - 2, 14, 4, h - 16);
      g.fillStyle = V65B_O; g.beginPath(); g.moveTo(1, 22); g.quadraticCurveTo(w/2, -8, w - 1, 22); g.fill(); for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? '#ffffff' : (i ? '#26c6da' : '#ef4b4b'); g.beginPath(); g.moveTo(w/2, 2); g.lineTo(3 + k*12, 20); g.lineTo(15 + k*12, 20); g.fill(); } })),
    v65bLampS(r.x - 14, r.y + 60), v65bLampS(r.x + r.w + 14, r.y + 60)
  ],
  archery:r => {
    const L = [];
    // 5 bia tập: giá gỗ chữ A + bao rơm + mặt bia vòng màu (không có cảnh bạo lực)
    for(let k = 0; k < 5; k++){ const x = r.x + r.w - 60, y = r.y + 40 + k*50;
      L.push(v65bS('tgt' + k, x - 24, y - 24, 48, 50, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(6, h - 5, w - 12, 4); g.fillStyle = V65B_WO; g.fillRect(8, 14, 4, h - 16); g.fillRect(w - 12, 14, 4, h - 16); g.fillStyle = '#9a6236'; g.fillRect(9, 15, 2, h - 18); g.fillRect(w - 11, 15, 2, h - 18);
        g.fillStyle = V65B_O; g.fillRect(4, 0, w - 8, 40); g.fillStyle = '#e3c46a'; g.fillRect(6, 2, w - 12, 36); g.fillStyle = '#c9a54a'; for(let j = 6; j < 38; j += 6) g.fillRect(6, j, w - 12, 1);
        [['#2b2430', 17], ['#ffffff', 16], ['#1b1b24', 13], ['#3d7bff', 10], ['#ef4b4b', 7], ['#ffd23f', 4]].forEach(([c, s]) => { g.fillStyle = c; g.beginPath(); g.arc(w/2, 20, s, 0, 7); g.fill(); }); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(w/2 - 8, 6, 6, 2); })); }
    // giá để cung tập + ống tên (đồ thể thao) trên bục
    L.push(v65bS('rack', r.x + 26, r.y + 150, 64, 44, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(2, h - 4, w - 4, 4); g.fillStyle = V65B_WO; g.fillRect(2, 8, 4, h - 10); g.fillRect(w - 6, 8, 4, h - 10); g.fillRect(0, 6, w, 5); g.fillRect(0, h - 14, w, 4); g.fillStyle = '#c99560'; g.fillRect(1, 7, w - 2, 2);
      for(let k = 0; k < 3; k++){ const x = 14 + k*16; g.strokeStyle = ['#ef4b4b', '#3d7bff', '#2fbf71'][k]; g.lineWidth = 3; g.beginPath(); g.arc(x - 6, 22, 14, -1.1, 1.1); g.stroke(); g.strokeStyle = '#f4f4f4'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 6 + 14*Math.cos(-1.1), 22 + 14*Math.sin(-1.1)); g.lineTo(x - 6 + 14*Math.cos(1.1), 22 + 14*Math.sin(1.1)); g.stroke(); } }));
    // cột cờ gió
    L.push(v65bS('sock', r.x + 300, r.y - 18, 40, 40, (g, w, h) => { g.fillStyle = V65B_O; g.fillRect(4, 2, 3, h - 2); g.fillStyle = '#ff8a2b'; g.fillRect(7, 3, 12, 8); g.fillStyle = '#ffffff'; g.fillRect(19, 4, 8, 6); g.fillStyle = '#ff8a2b'; g.fillRect(27, 5, 7, 4); }));
    return L; },
  gym:r => [
    // cầu thăng bằng (chân xám, xà gỗ)
    v65bS('beam', r.x + 226, r.y + 94, 160, 30, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(6, h - 4, w - 12, 4); [12, w - 18].forEach(x => { g.fillStyle = V65B_O; g.fillRect(x, 6, 7, h - 6); g.fillRect(x - 4, h - 5, 15, 5); g.fillStyle = '#9aa3ab'; g.fillRect(x + 2, 7, 3, h - 10); });
      g.fillStyle = V65B_O; g.fillRect(0, 0, w, 9); g.fillStyle = '#d9b07a'; g.fillRect(1, 1, w - 2, 6); g.fillStyle = '#f0d3a6'; g.fillRect(1, 1, w - 2, 2); }),
    // xà kép: 2 thanh trên 4 cột
    v65bS('bars', r.x + 234, r.y + 168, 144, 70, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(6, h - 4, w - 12, 4); [[6, 10], [w - 12, 10], [6, 26], [w - 12, 26]].forEach(([x, y]) => { g.fillStyle = V65B_O; g.fillRect(x, y, 6, h - y - 2); g.fillStyle = '#c9ced3'; g.fillRect(x + 2, y + 1, 2, h - y - 6); g.fillStyle = V65B_O; g.fillRect(x - 3, h - 5, 12, 5); });
      [10, 26].forEach(y => { g.fillStyle = V65B_O; g.fillRect(0, y - 3, w, 6); g.fillStyle = '#e9c38a'; g.fillRect(1, y - 2, w - 2, 3); }); }),
    // vòng treo + dải cờ trên tường trên
    v65bS('banner', r.x + 30, r.y - 2, r.w - 60, 34, (g, w) => { const n = 7; for(let i = 0; i < n; i++){ const x = 8 + i*(w - 32)/(n - 1); v64sP(g, 'H', (22 + i % 7)*16, 20*16, 16, 32, x, 0, 1); } }),
    v65bLampS(r.x - 16, r.y + r.h + 6), v65bLampS(r.x + r.w + 16, r.y + r.h + 6)
  ],
  arena:r => {
    const L = [];
    for(let k = 0; k < 6; k++){ const x = r.x + 40 + (k % 3)*120, y = r.y + 50 + Math.floor(k/3)*100;
      L.push(v65bS('desk' + k, x - 2, y - 4, 84, 58, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(4, h - 5, w - 8, 5);
        g.fillStyle = V65B_WO; g.fillRect(0, 30, w, 22); g.fillStyle = '#8a5a35'; g.fillRect(2, 32, w - 4, 6); g.fillStyle = '#6b4226'; g.fillRect(2, 38, w - 4, 12); g.fillStyle = V65B_WO; g.fillRect(6, 50, 5, 6); g.fillRect(w - 11, 50, 5, 6);
        g.fillStyle = V65B_O; g.fillRect(w/2 - 4, 24, 8, 8); g.fillRect(4, 0, w - 8, 26); g.fillStyle = '#1b2533'; g.fillRect(6, 2, w - 12, 22);
        g.fillStyle = ['#26c6da', '#7cf2a0', '#ffd23f', '#ff6f91', '#b06bff', '#7fb2ff'][k]; g.fillRect(8, 4, w - 16, 18);
        for(let i = 0; i < 9; i++){ g.fillStyle = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#ffffff'][(i + k) % 6]; g.fillRect(w/2 - 10 + (i % 3)*7, 6 + Math.floor(i/3)*5, 6, 4); }
        g.fillStyle = '#c9ced3'; g.fillRect(16, 34, 22, 3); g.fillStyle = '#ef4b4b'; g.fillRect(w - 26, 33, 8, 5); }, {light:[[x + 40, y + 10, 60]]})); }
    L.push(v65bLampS(r.x - 16, r.y + r.h + 10), v65bLampS(r.x + r.w + 16, r.y + r.h + 10));
    return L; },
  basket:r => [
    // cột rổ + bảng + vành (khớp vị trí rổ cũ, bóng bay vào đúng vành)
    v65bS('hoop', r.x + r.w/2 - 22, r.y - 14, 44, 52, (g, w, h) => { const cx = w/2; g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx - 10, 26, 20, 4);
      g.fillStyle = V65B_O; g.fillRect(cx - 3, 0, 6, 28); g.fillStyle = '#9aa3ab'; g.fillRect(cx - 1, 1, 2, 26);
      g.fillStyle = V65B_O; g.fillRect(cx - 18, 14, 36, 22); g.fillStyle = '#f4f6f6'; g.fillRect(cx - 16, 16, 32, 18); g.strokeStyle = '#ef4b4b'; g.lineWidth = 2; g.strokeRect(cx - 7, 24, 14, 9);
      g.fillStyle = V65B_O; g.fillRect(cx - 10, 37, 20, 5); g.fillStyle = '#ff7a1a'; g.fillRect(cx - 9, 38, 18, 3);
      g.strokeStyle = '#ffffff'; g.lineWidth = 1; for(let k = 0; k < 4; k++){ g.beginPath(); g.moveTo(cx - 8 + k*5, 41); g.lineTo(cx - 6 + k*4, 50); g.stroke(); } }, {base:r.y + 12}),
    v65bLampS(r.x - 8, r.y + 40), v65bLampS(r.x + r.w + 8, r.y + 40)
  ],
  skate:r => [
    // thanh trượt (rail) thấp
    v65bS('rail', r.x + 116, r.y + 186, 68, 26, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(4, h - 4, w - 8, 4); [6, w - 12].forEach(x => { g.fillStyle = V65B_O; g.fillRect(x, 8, 6, h - 10); g.fillStyle = '#c9ced3'; g.fillRect(x + 2, 9, 2, h - 14); }); g.fillStyle = V65B_O; g.fillRect(0, 4, w, 7); g.fillStyle = '#ffd23f'; g.fillRect(1, 5, w - 2, 4); g.fillStyle = '#fff3a8'; g.fillRect(1, 5, w - 2, 1); }),
    v65bLampS(r.x - 8, r.y + 130), v65bLampS(r.x + r.w + 8, r.y + 130)
  ],
  patin:r => [v65bLampS(r.x + 10, r.y + 64), v65bLampS(r.x + r.w - 10, r.y + 64)],
  ski:r => {
    const L = [];
    // thông phủ tuyết dọc hai mép (đúng chỗ thông cũ)
    for(let k = 0; k < 9; k++){ const x = r.x + 30 + (k % 2)*(r.w - 60), y = r.y + 50 + k*50; L.push(v65bS('pine' + k, x - 22, y - 58, 44, 62, (g, w, h) => { g.fillStyle = 'rgba(60,90,120,.2)'; g.beginPath(); g.ellipse(w/2, h - 3, 16, 4, 0, 0, 7); g.fill();
      if(V64S.img.TS){ g.drawImage(V64S.img.TS, (k % 2)*192 + 36, 0, 120, 182, 2, 0, 40, 60); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 0, w, 44); g.globalCompositeOperation = 'source-over'; } else v64sT(g, 'N', 8, 0, 6, 0, 2, 2, 1); })); }
    // ga cáp treo dưới + trên
    const hut = (k, x, y, roofC) => v65bS(k, x - 20, y - 40, 40, 42, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(2, h - 4, w - 4, 4); v65bBox(g, 4, 16, w - 8, h - 20, '#b97a45', V65B_WO); g.fillStyle = '#9fd4ee'; g.fillRect(10, 22, 10, 8); g.fillStyle = V65B_WO; g.fillRect(24, 22, 8, h - 26);
      g.fillStyle = V65B_O; g.beginPath(); g.moveTo(-1, 18); g.lineTo(w/2, 0); g.lineTo(w + 1, 18); g.fill(); g.fillStyle = roofC; g.beginPath(); g.moveTo(3, 16); g.lineTo(w/2, 3); g.lineTo(w - 3, 16); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(8, 12); g.lineTo(w/2, 3); g.lineTo(w - 8, 12); g.fill(); });
    L.push(hut('hutB', r.x + 70, r.y + r.h - 6, '#c9433c'), hut('hutT', r.x + 90, r.y + 34, '#3d7bff'));
    // nhà gỗ nghỉ chân (mái NA phủ tuyết) + người tuyết + lều tuyết
    L.push(v65bS('lodge', r.x + r.w - 166, r.y + r.h - 110, 132, 108, (g, w, h) => { g.fillStyle = 'rgba(60,90,120,.22)'; g.fillRect(6, h - 8, w - 12, 8); const H = v64sHouse(g, 0, 2, 4, 4, 2, 1, [2]);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 4, w, (H.wallY - 4)*.5); g.globalCompositeOperation = 'source-over'; v64sBoard(g, w/2, H.wallY - 30, '☕ Nhà gỗ'); }, {light:[[r.x + r.w - 100, r.y + r.h - 20, 90]]}));
    L.push(v65bS('snowman', r.x + 104, r.y + r.h - 44, 30, 42, (g, w, h) => { const cx = w/2; g.fillStyle = 'rgba(60,90,120,.2)'; g.fillRect(4, h - 4, w - 8, 4); v65bEll(g, cx, h - 12, 12, 10, V65B_O); v65bEll(g, cx, h - 12, 10, 8, '#ffffff'); v65bEll(g, cx, h - 28, 8, 7, V65B_O); v65bEll(g, cx, h - 28, 6.5, 5.5, '#ffffff');
      g.fillStyle = V65B_O; g.fillRect(cx - 3, h - 31, 2, 2); g.fillRect(cx + 2, h - 31, 2, 2); g.fillStyle = '#ff8a2b'; g.fillRect(cx, h - 28, 5, 2); g.fillStyle = '#ef4b4b'; g.fillRect(cx - 7, h - 22, 14, 3); g.fillStyle = V65B_O; g.fillRect(cx - 6, h - 40, 12, 3); g.fillRect(cx - 4, h - 46, 8, 7); }));
    L.push(v65bS('igloo', r.x + r.w - 230, r.y + r.h - 52, 56, 50, (g, w, h) => { g.fillStyle = 'rgba(60,90,120,.2)'; g.fillRect(2, h - 4, w - 4, 4); v64sP(g, 'H', 0, 11*16, 48, 48, 4, 0, 1, 48, 48); }));
    return L; },
  kart:r => {
    const L = [], cx = r.x + 640, s0 = KART_WORLD[0];
    L.push(v65bS('kstand', cx - 210, r.y - 28, 420, 88, (g, w, h) => v65bStand(g, w, h, 5, '🏁 Rubik Kart')));
    // cổng xuất phát bắc qua đường đua: 2 cột + băng rôn + đèn
    L.push(v65bS('gantry', s0[0] - 46, s0[1] - 72, 92, 76, (g, w, h) => { [4, w - 12].forEach(x => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 3, h - 4, 14, 4); g.fillStyle = V65B_O; g.fillRect(x, 10, 8, h - 12); g.fillStyle = '#c9ced3'; g.fillRect(x + 2, 11, 3, h - 16); });
      g.fillStyle = V65B_O; g.fillRect(0, 0, w, 24); for(let i = 0; i < 2; i++) for(let k = 0; k < (w - 4)/6; k++){ g.fillStyle = (k + i) % 2 ? '#111' : '#fff'; g.fillRect(2 + k*6, 2 + i*6, 6, 6); }
      ['#ef4b4b', '#ffd23f', '#2fbf71'].forEach((c, i) => { g.fillStyle = '#1b1820'; g.fillRect(w/2 - 22 + i*16, 14, 12, 9); g.fillStyle = c; g.fillRect(w/2 - 20 + i*16, 16, 8, 5); }); }, {light:[[s0[0], s0[1] - 60, 90]]}));
    // dãy gara đội đua (cửa cuốn nhiều màu)
    L.push(v65bS('pits', cx - 160, r.y + 558, 320, 100, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(4, h - 6, w - 8, 6); const H = v64sHouse(g, 12, 0, 0, 10, 2, 1, []);
      for(let i = 0; i < 5; i++){ const x = 14 + i*60; g.fillStyle = V65B_WO; g.fillRect(x - 2, H.wallY + 4, 40, 28); g.fillStyle = V65B_TEAM[i]; g.fillRect(x, H.wallY + 6, 36, 26); g.fillStyle = 'rgba(0,0,0,.18)'; for(let y = H.wallY + 10; y < H.wallY + 32; y += 5) g.fillRect(x, y, 36, 1); }
      if(v65bDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, 0, w, 24); g.globalCompositeOperation = 'source-over'; } }));
    L.push(v65bTreeS(r.x + 44, r.y + 96, 1), v65bTreeS(r.x + 1236, r.y + 96, 2, true), v65bTreeS(r.x + 44, r.y + 610, 3, true), v65bTreeS(r.x + 1236, r.y + 610, 4));
    L.push(v65bLampS(cx - 240, r.y + 64), v65bLampS(cx + 240, r.y + 64));
    return L; }
};
