// ================= v65f · 2/3 NHÀ THAM QUAN (mHouse): nền phòng NA vẽ một lần vào canvas cache theo kiểu nhà =================
// Mặt bằng cũ 960×580 giữ nguyên: tường sau y < 220, sàn đi được x 40–920 / y 230–540, cửa ra x 440–520 ở đáy, đồ đạc theo HFURN.
// Chỉ thay phần nền + đồ đạc của hsDraw gốc (v16); lớp NPC, thú cưng, rương, nhặt đồ (v38) vẫn vẽ đè lên như cũ.
const V65F_HS = {
  my:    {wall:'#f1e3c8', stripe:'rgba(214,170,120,.22)', floor:'wood', fv:0, trim:'#c9844a', rug:['#3f6fb5', '#e8c27a', '#9cc3f0'], win:3},
  chauau:{wall:'#e9d8cc', stripe:'rgba(190,140,120,.18)', floor:'orn', fv:2, trim:'#e6b84a', woodTint:'#8a5a5a', rug:null, win:0},
  nhat:  {wall:'#f1e9d2', floor:'plain', fv:0, trim:'#6d4c2e', wood:0, win:0},
  y:     {wall:'#f6dcb0', tex:'brick', texA:.35, floor:'terra', fv:1, trim:'#fff3e0', wood:.2, woodTint:'#e4a46a', rug:['#2f8f6f', '#f6dcb0', '#ffe6a8'], win:0},
  vn:    {wall:'#efe2c6', floor:'terra', ftint:'#d8664a', fv:2, trim:'#5d4037', woodTint:'#7a4a2e', rug:['#9c2b1f', '#e8c27a', '#ffd23f'], win:0}
};
// nền tĩnh của một kiểu nhà (tường, sàn, khung, cửa sổ, thảm, đồ treo tường, đồ đạc, nhãn)
function v65fHsBg(s){
  let c = V65F.hs[s + season]; if(c) return c;
  c = document.createElement('canvas'); c.width = 960; c.height = 580; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const S = V65F_HS[s] || V65F_HS.my;
  try {
    g.fillStyle = '#1d1410'; g.fillRect(0, 0, 960, 580);
    v65fFloor(g, 32, 220, 896, 330, S.floor, 3, S.ftint);
    v65fWall(g, 32, 32, 896, 188, {base:S.wall, stripe:S.stripe, tex:S.tex, texA:S.texA, wood:S.wood, woodTint:S.woodTint, trim:S.trim});
    v65fHsWallDeco(g, s);
    if(S.rug) v65fRug(g, 392, 404, 176, 120, S.rug[0], S.rug[1], S.rug[2]);
    if(s === 'chauau'){ g.fillStyle = V65F_O; g.fillRect(398, 220, 164, 330); g.fillStyle = '#9c2b1f'; g.fillRect(402, 220, 156, 330); g.fillStyle = '#e6b84a'; g.fillRect(408, 220, 4, 330); g.fillRect(548, 220, 4, 330);
      g.fillStyle = 'rgba(255,214,120,.35)'; for(let yy = 240; yy < 540; yy += 36) g.fillRect(476, yy, 8, 8); }
    if(s === 'nhat') v65fTatami(g);
    v65fFrame(g, 0, 0, 30, 18, S.fv, 2, [432, 528]);
    g.fillStyle = '#1d1410'; g.fillRect(0, 576, 960, 4);
    // cửa ra: bậc đá + thảm chùi chân
    g.fillStyle = V65F_O; g.fillRect(432, 548, 96, 32); v65fFloor(g, 436, 548, 88, 32, 'stone', 2); g.fillStyle = '#9c2b1f'; g.fillRect(446, 552, 68, 22); g.fillStyle = '#e8c27a'; g.fillRect(446, 552, 68, 3); g.fillRect(446, 571, 68, 3);
    g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CỬA RA', 480, 564); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    // đồ đạc (theo đúng khung va chạm HFURN) + nhãn tên
    const L = (HFURN[s] || []).slice().sort((a, b) => (a[2] + a[4]) - (b[2] + b[4]));
    L.forEach(f => { try { v65fFurn(g, f[0], f[1], f[2], f[3], f[4], f[5]); } catch(e){ console.warn('v65f furn', f[0], e); } });
    L.forEach(f => v65fPlaque(g, f[1] + f[3]/2, Math.max(36, f[2] - v65fTall(f[0], f[4]) - 26), f[0]));
  } catch(e){ console.warn('v65f hs bg', e); }
  V65F.hs[s + season] = c; return c;
}
// đồ cao vượt khỏi khung đáy bao nhiêu (để đặt nhãn phía trên)
function v65fTall(n, h){ return {'Lò sưởi':40, 'Tủ tansu':58, 'Cây ô liu':40, 'Tủ rượu nho':30, 'Bonsai':30, 'Đèn lồng':10, 'Đèn lồng Hội An':10, 'TV & kệ':74, 'Tủ chè':10}[n] || 0; }
function v65fTatami(g){
  for(let y = 220, row = 0; y < 548; y += 80, row++) for(let x = 32 - (row % 2)*80; x < 928; x += 160){
    const x0 = Math.max(32, x), x1 = Math.min(928, x + 160), y1 = Math.min(548, y + 80); if(x1 <= x0) continue;
    g.fillStyle = V65F_O; g.fillRect(x0, y, x1 - x0, y1 - y); g.fillStyle = '#d6c78f'; g.fillRect(x0 + 2, y + 2, x1 - x0 - 4, y1 - y - 4);
    g.fillStyle = 'rgba(120,100,50,.18)'; for(let yy = y + 6; yy < y1 - 4; yy += 6) g.fillRect(x0 + 6, yy, x1 - x0 - 12, 2);
    g.fillStyle = '#2f5a3a'; g.fillRect(x0 + 2, y + 2, x1 - x0 - 4, 5); g.fillRect(x0 + 2, y1 - 7, x1 - x0 - 4, 5); }
}
function v65fHsWallDeco(g, s){
  if(s === 'my'){ [150, 420, 690].forEach(x => v65fWin(g, x, 66, 120, 84));
    v65fS(g, 'bookcase', 40, 220 - 120, 3); v65fS(g, 'plant', 872, 220 - 96, 3); v65fS(g, 'pic', 330, 70, 3); v65fS(g, 'pic', 600, 70, 3); }
  else if(s === 'chauau'){
    for(let k = 0; k < 6; k++){ const px = 52 + k*172; g.fillStyle = V65F_O; g.fillRect(px - 2, 40, 28, 180); g.fillStyle = '#e4ded2'; g.fillRect(px, 42, 24, 176); g.fillStyle = '#c9c2b4'; g.fillRect(px + 16, 42, 8, 176); g.fillStyle = '#e6b84a'; g.fillRect(px - 4, 40, 32, 8); g.fillRect(px - 4, 200, 32, 6); }
    for(let k = 0; k < 5; k++){ const px = 96 + k*172; g.fillStyle = V65F_O; g.fillRect(px - 4, 58, 88, 100); g.fillStyle = '#e6b84a'; g.fillRect(px - 2, 60, 84, 96); g.fillStyle = ['#5b6ea8', '#4f8a5b', '#c27a3a'][k % 3]; g.fillRect(px + 6, 68, 68, 80);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(px + 6, 68, 68, 24); g.fillStyle = shade(['#5b6ea8', '#4f8a5b', '#c27a3a'][k % 3], -.35); g.beginPath(); g.moveTo(px + 6, 148); g.lineTo(px + 34, 104); g.lineTo(px + 74, 148); g.fill(); }
    [300, 660].forEach(cx => { g.fillStyle = V65F_O; g.fillRect(cx - 2, 32, 4, 30); g.fillRect(cx - 34, 58, 68, 12); g.fillStyle = '#e6b84a'; g.fillRect(cx - 32, 60, 64, 8); for(let a = 0; a < 5; a++) v65fS(g, 'candle', cx - 30 + a*13, 42, 1); }); }
  else if(s === 'nhat'){
    for(let k = 0; k < 7; k++){ const px = 44 + k*126; g.fillStyle = V65F_O; g.fillRect(px, 40, 118, 176); g.fillStyle = '#fff8e8'; g.fillRect(px + 4, 44, 110, 168);
      g.fillStyle = '#8a5a35'; for(let a = 1; a < 4; a++) g.fillRect(px + 4 + a*27.5 - 1, 44, 3, 168); for(let b = 1; b < 5; b++) g.fillRect(px + 4, 44 + b*33.6 - 1, 110, 3);
      g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(px + 6, 46, 30, 30); }
    v65fS(g, 'banner', 20, 220 - 100, 3); }
  else if(s === 'y'){
    for(let k = 0; k < 4; k++){ const cx = 150 + k*220; g.fillStyle = V65F_O; g.beginPath(); g.arc(cx, 112, 60, Math.PI, 0); g.lineTo(cx + 60, 214); g.lineTo(cx - 60, 214); g.fill();
      g.fillStyle = '#fff3e0'; g.beginPath(); g.arc(cx, 112, 56, Math.PI, 0); g.lineTo(cx + 56, 212); g.lineTo(cx - 56, 212); g.fill();
      const sk = g.createLinearGradient(0, 70, 0, 200); sk.addColorStop(0, '#6fc3ec'); sk.addColorStop(1, '#d8f1fb'); g.fillStyle = sk; g.beginPath(); g.arc(cx, 116, 42, Math.PI, 0); g.lineTo(cx + 42, 200); g.lineTo(cx - 42, 200); g.fill();
      g.fillStyle = '#7cad4a'; g.fillRect(cx - 42, 176, 84, 24); g.fillStyle = '#5a8a3a'; for(let a = 0; a < 6; a++) g.fillRect(cx - 40 + a*14, 170 - (a % 2)*6, 10, 10);
      g.fillStyle = V65F_O; g.fillRect(cx - 2, 74, 4, 126); g.fillRect(cx - 42, 136, 84, 4); }
    v65fS(g, 'jar', 40, 220 - 48, 3); v65fS(g, 'jar', 872, 220 - 48, 3); }
  else if(s === 'vn'){
    for(let k = 0; k < 4; k++){ const px = 52 + k*290; g.fillStyle = V65F_O; g.fillRect(px - 2, 32, 20, 188); g.fillStyle = '#6d3f22'; g.fillRect(px, 32, 16, 188); g.fillStyle = '#8a5a35'; g.fillRect(px + 2, 32, 4, 188); }
    for(let k = 0; k < 3; k++){ const px = 110 + k*290; g.fillStyle = V65F_O; g.fillRect(px - 4, 52, 168, 128); g.fillStyle = '#e8c27a'; g.fillRect(px - 2, 54, 164, 124); g.fillStyle = '#fff3d6'; g.fillRect(px + 6, 62, 148, 108);
      const cc = ['#c0392b', '#2e8b57', '#e0a020'][k]; g.fillStyle = cc; g.beginPath(); g.ellipse(px + 80, 128, 38, 26, 0, 0, 7); g.fill(); g.fillStyle = shade(cc, -.3); g.fillRect(px + 60, 150, 8, 14); g.fillRect(px + 92, 150, 8, 14);
      g.fillStyle = '#3e2723'; g.fillRect(px + 108, 116, 10, 8); g.fillStyle = '#fff3d6'; g.fillRect(px + 52, 112, 20, 20); g.fillStyle = shade(cc, .3); for(let a = 0; a < 4; a++) g.fillRect(px + 58 + a*12, 106 + (a % 2)*6, 6, 6); }
    // câu đối đỏ
    [20, 912].forEach(px => { g.fillStyle = V65F_O; g.fillRect(px - 2, 60, 32, 150); g.fillStyle = '#b3261e'; g.fillRect(px, 62, 28, 146); g.fillStyle = '#ffd23f'; for(let a = 0; a < 5; a++) g.fillRect(px + 10, 72 + a*27, 8, 12); }); }
}
// đồ đạc theo tên (khung x, y, w, h = khung va chạm cũ)
function v65fFurn(g, n, x, y, w, h, col){
  const O = V65F_O;
  if(n === 'Sofa' || n === 'Ghế nhung'){ v65fSofa(g, x, y - 16, w, h + 14, col); return; }
  if(n === 'Bàn trà'){ v65fTable(g, x + 8, y - 6, w - 16, h + 4, {wood:'#a8693a'}); v65fS(g, 'cup', x + 30, y - 12, 2); v65fS(g, 'apple', x + 70, y - 14, 2); v65fS(g, 'paper', x + 100, y - 18, 2); return; }
  if(n === 'TV & kệ'){ v65fShadow(g, x, y + h + 2, w); v65fBox(g, x, y, w, h, '#8a5a35', 14);
    for(let i = 0; i < 3; i++){ const dx = x + 8 + i*(w - 16)/3; g.fillStyle = O; g.fillRect(dx, y + 20, (w - 16)/3 - 6, h - 28); g.fillStyle = '#b9773e'; g.fillRect(dx + 2, y + 22, (w - 16)/3 - 10, h - 32); g.fillStyle = '#e8c27a'; g.fillRect(dx + (w - 16)/6 - 8, y + 30, 10, 4); }
    g.fillStyle = O; g.fillRect(x + 16, y - 74, 168, 76); g.fillStyle = '#26303a'; g.fillRect(x + 20, y - 70, 160, 66); g.fillStyle = O; g.fillRect(x + 88, y - 4, 24, 6); return; }
  if(n === 'Lò sưởi'){ v65fShadow(g, x, y + h + 2, w);
    g.fillStyle = O; g.fillRect(x - 4, y - 44, w + 8, h + 46); g.save(); g.translate(x, y - 40); g.fillStyle = v64sPat(g, 'FI', 1, 7, 2); g.fillRect(0, 0, w, h + 40); g.restore();
    g.fillStyle = O; g.fillRect(x - 10, y - 48, w + 20, 14); g.fillStyle = '#8a5a35'; g.fillRect(x - 8, y - 46, w + 16, 8); g.fillStyle = '#c9844a'; g.fillRect(x - 8, y - 46, w + 16, 3);
    g.fillStyle = O; g.fillRect(x + 36, y + 44, 88, 66); g.fillStyle = '#1d1410'; g.fillRect(x + 40, y + 48, 80, 62); g.fillStyle = '#5d4037'; g.fillRect(x + 48, y + 96, 64, 8);
    v65fS(g, 'candle', x + 8, y - 70, 2); v65fS(g, 'vase', x + w - 40, y - 78, 2); return; }
  if(n === 'Bàn ăn'){ v65fTable(g, x, y, w, h, {cloth:'#f4eee0', check:null, chairs:3}); g.fillStyle = col; g.fillRect(x + w/2 - 20, y + 2, 40, h - 30); v65fS(g, 'bread', x + 30, y + 4, 2); v65fS(g, 'apple', x + w - 60, y + 6, 2); v65fS(g, 'cup', x + w/2 - 16, y + 12, 2); return; }
  if(n === 'Đàn dương cầm'){ v65fShadow(g, x, y + h + 2, w);
    g.fillStyle = O; g.beginPath(); g.moveTo(x - 2, y + 10); g.lineTo(x + w*.62, y + 6); g.quadraticCurveTo(x + w + 6, y + 8, x + w + 2, y + h*.6); g.lineTo(x + w*.7, y + h + 2); g.lineTo(x - 2, y + h + 2); g.fill();
    g.fillStyle = '#26262c'; g.beginPath(); g.moveTo(x, y + 12); g.lineTo(x + w*.62, y + 8); g.quadraticCurveTo(x + w, y + 10, x + w, y + h*.6); g.lineTo(x + w*.7, y + h - 18); g.lineTo(x, y + h - 18); g.fill();
    g.fillStyle = '#3c3c46'; g.fillRect(x + 6, y + 14, w*.55, 6); g.fillStyle = O; g.fillRect(x, y + h - 22, w*.7, 24); g.fillStyle = '#fafafa'; g.fillRect(x + 4, y + h - 20, w*.7 - 8, 14);
    g.fillStyle = O; for(let i = 0; i < 22; i++) g.fillRect(x + 4 + i*(w*.7 - 8)/22, y + h - 20, 1, 14); for(let i = 0; i < 22; i++) if(i % 7 !== 2 && i % 7 !== 6) g.fillRect(x + 8 + i*(w*.7 - 8)/22, y + h - 20, 4, 8);
    v65fS(g, 'stool', x + w*.3, y + h - 6, 2); return; }
  if(n === 'Bàn tiệc'){ v65fTable(g, x, y, w, h, {cloth:'#f6efe2', chairs:4}); g.fillStyle = '#e6b84a'; g.fillRect(x + 10, y + h - 34, w - 20, 4);
    v65fS(g, 'candle', x + w/2 - 16, y - 8, 2); v65fS(g, 'bread', x + 24, y + 6, 2); v65fS(g, 'apple', x + 70, y + 8, 2); v65fS(g, 'bowl', x + w - 80, y + 4, 2); v65fS(g, 'cup', x + w - 44, y + 10, 2); return; }
  if(n === 'Rương báu'){ v65fShadow(g, x, y + h + 2, w); v65fS(g, 'chest', x + 4, y + h - 64, 4); v65fS(g, 'chest', x + 72, y + h - 64, 4); g.fillStyle = 'rgba(255,214,90,.5)'; g.fillRect(x + 30, y - 4, 4, 4); g.fillRect(x + 100, y - 8, 4, 4); return; }
  if(n === 'Bàn chabudai'){ v65fShadow(g, x, y + h, w);
    [[x - 34, y + 14], [x + w + 4, y + 14], [x + w/2 - 15, y + h + 2]].forEach(([cx, cy]) => { g.fillStyle = O; g.fillRect(cx - 2, cy - 2, 34, 28); g.fillStyle = '#b3261e'; g.fillRect(cx, cy, 30, 24); g.fillStyle = '#d9584a'; g.fillRect(cx, cy, 30, 4); });
    v65fBox(g, x, y + 8, w, h - 16, '#5d4037', h - 30); v65fLegs(g, x + 6, y + h - 10, w - 12, 10, '#3e2723');
    v65fS(g, 'bowl', x + 40, y + 6, 2); v65fS(g, 'cup', x + 100, y + 12, 2); v65fS(g, 'cup', x + 140, y + 12, 2); return; }
  if(n === 'Bonsai' || n === 'Cây ô liu'){ v65fShadow(g, x, y + h, w); v65fSB(g, 'plant', x + w/2, y + h + 2, n === 'Bonsai' ? 3 : 4);
    if(n === 'Cây ô liu'){ g.fillStyle = 'rgba(70,110,40,.35)'; g.beginPath(); g.ellipse(x + w/2, y - 4, 34, 22, 0, 0, 7); g.fill(); g.fillStyle = '#3f5f2a'; for(let a = 0; a < 6; a++) g.fillRect(x + 16 + (a*13) % 40, y - 14 + (a*7) % 20, 5, 7); } return; }
  if(n === 'Đèn lồng' || n === 'Đèn lồng Hội An'){ v65fShadow(g, x, y + h, w); const cx = x + w/2, red = n !== 'Đèn lồng', lw = red ? 34 : 40, lh = red ? 40 : 52;
    g.fillStyle = O; g.fillRect(cx - 4, y + 20, 8, h - 18); g.fillRect(cx - 18, y + h - 6, 36, 8); g.fillStyle = '#8a5a35'; g.fillRect(cx - 2, y + 22, 4, h - 22); g.fillRect(cx - 16, y + h - 4, 32, 4);
    g.fillStyle = O; g.fillRect(cx - lw/2 - 2, y - 2, lw + 4, lh + 4); g.fillStyle = red ? '#d8362b' : '#fff3d6'; g.fillRect(cx - lw/2, y, lw, lh);
    g.fillStyle = red ? '#ff6a4a' : '#ffe6b0'; g.fillRect(cx - lw/2 + 4, y + 4, 6, lh - 8); g.fillStyle = O; g.fillRect(cx - lw/2 - 4, y - 4, lw + 8, 6); g.fillRect(cx - lw/2 - 4, y + lh - 2, lw + 8, 6);
    g.fillStyle = red ? '#ffd23f' : '#8a5a35'; for(let a = 1; a < 4; a++) g.fillRect(cx - lw/2, y + a*lh/4, lw, 2); return; }
  if(n === 'Tủ tansu'){ v65fShadow(g, x, y + h, w); v65fSB(g, 'dresser', x + w/2, y + h + 2, 4); return; }
  if(n === 'Đài phun nước'){ const cx = x + w/2, cy = y + h/2 + 6; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cx, cy + 10, w/2 + 6, h/2, 0, 0, 7); g.fill();
    g.fillStyle = O; g.beginPath(); g.ellipse(cx, cy, w/2, h/2, 0, 0, 7); g.fill(); g.save(); g.beginPath(); g.ellipse(cx, cy, w/2 - 3, h/2 - 3, 0, 0, 7); g.clip(); v65fFloor(g, x, y, w, h + 20, 'stone', 2, '#e4ded2'); g.restore();
    g.fillStyle = O; g.beginPath(); g.ellipse(cx, cy - 4, w/2 - 16, h/2 - 16, 0, 0, 7); g.fill(); g.fillStyle = '#5ec7e6'; g.beginPath(); g.ellipse(cx, cy - 4, w/2 - 19, h/2 - 19, 0, 0, 7); g.fill();
    g.fillStyle = O; g.fillRect(cx - 10, cy - 46, 20, 40); g.fillStyle = '#e4ded2'; g.fillRect(cx - 8, cy - 44, 16, 36); g.fillStyle = O; g.fillRect(cx - 22, cy - 52, 44, 10); g.fillStyle = '#c9c2b4'; g.fillRect(cx - 20, cy - 50, 40, 6); return; }
  if(n === 'Bàn ăn khăn ca rô'){ v65fTable(g, x, y, w, h, {cloth:'#f6f2ea', check:'#c62828', chairs:3}); v65fS(g, 'bread', x + 40, y + 8, 2); v65fS(g, 'jar', x + w/2 - 16, y - 6, 2); v65fS(g, 'apple', x + w - 70, y + 10, 2); return; }
  if(n === 'Tủ rượu nho'){ v65fShadow(g, x, y + h, w); v65fSB(g, 'shelfW', x + w/2, y + h + 2, 3);
    const bx = x + w/2 - 40; for(let r = 0; r < 2; r++) for(let i = 0; i < 6; i++){ const px = bx + 6 + i*12, py = y + h - 76 + r*30; g.fillStyle = O; g.fillRect(px - 1, py - 1, 8, 18); g.fillStyle = ['#7a1f3d', '#2e5a2e', '#7a1f3d'][(i + r) % 3]; g.fillRect(px, py, 6, 16); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px + 1, py + 2, 1, 8); } return; }
  if(n === 'Sập gụ'){ v65fShadow(g, x, y + h + 2, w); v65fBox(g, x, y, w, h - 14, '#5a2e1a', h - 28); v65fLegs(g, x + 4, y + h - 16, w - 8, 18, '#3e2416');
    g.fillStyle = '#e8d9b8'; for(let a = 0; a < 8; a++) g.fillRect(x + 16 + a*28, y + h - 24, 4, 4); g.fillStyle = '#e6b84a'; g.fillRect(x + 6, y + h - 28, w - 12, 2);
    v65fS(g, 'cup', x + 90, y + 6, 2); v65fS(g, 'cup', x + 120, y + 6, 2); v65fS(g, 'jar', x + 150, y - 2, 2); return; }
  if(n === 'Tủ chè'){ v65fShadow(g, x, y + h, w); v65fBox(g, x, y - 10, w, h + 10, '#4e2a18', 14);
    for(let i = 0; i < 3; i++){ const dx = x + 8 + i*(w - 16)/3; g.fillStyle = O; g.fillRect(dx, y + 12, (w - 16)/3 - 6, h - 22); g.fillStyle = '#6d3f22'; g.fillRect(dx + 2, y + 14, (w - 16)/3 - 10, h - 26); g.fillStyle = '#e8d9b8'; g.fillRect(dx + 10, y + 24, 4, 4); g.fillRect(dx + 26, y + 40, 4, 4); g.fillStyle = '#e6b84a'; g.fillRect(dx + (w - 16)/6 - 6, y + h/2, 6, 6); }
    v65fS(g, 'vase', x + 20, y - 40, 2); v65fS(g, 'cup', x + 70, y - 34, 2); v65fS(g, 'jar', x + w - 50, y - 40, 2); return; }
  if(n === 'Bộ bàn ghế gỗ'){ v65fTable(g, x + 20, y, w - 40, h, {wood:'#8a4f2a', chairs:2}); v65fS(g, 'chair', x - 18, y + h - 40, 3); v65fS(g, 'chair', x + w - 30, y + h - 40, 3, true); v65fS(g, 'cup', x + w/2 - 16, y + 4, 2); return; }
  if(n === 'Chum nước'){ v65fShadow(g, x, y + h, w); v65fSB(g, 'pot', x + w/2, y + h + 4, 4); return; }
  // dự phòng: khối gỗ NA
  v65fShadow(g, x, y + h, w); v65fBox(g, x, y, w, h, col || '#a8693a');
}
// lớp động mỗi khung hình (lửa, nước, TV, đèn lồng, đèn chùm) — nhẹ, vài hình nhỏ
function v65fHsAnim(g, s, t){
  const O = V65F_O;
  (HFURN[s] || []).forEach(([n, x, y, w, h]) => {
    if(n === 'Lò sưởi'){ for(let k = 0; k < 5; k++){ const fh = 10 + Math.abs(Math.sin(t*6 + k*1.7))*16; g.fillStyle = k % 2 ? '#ff7043' : '#ffca28'; g.fillRect(x + 50 + k*13, y + 96 - fh, 9, fh); }
      g.globalAlpha = .18 + .06*Math.sin(t*5); g.fillStyle = '#ffb347'; g.beginPath(); g.ellipse(x + w/2, y + h + 20, 90, 26, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    else if(n === 'Đài phun nước'){ const cx = x + w/2, cy = y + h/2 + 2; g.fillStyle = '#e1f5fe'; for(let k = 0; k < 10; k++){ const a = k/10*Math.PI*2, p = (t*28 + k*6) % 32; g.fillRect(Math.round(cx + Math.cos(a)*(6 + p*.9)), Math.round(cy - 50 + p*1.2 + Math.sin(a)*4 - Math.sin(p/32*Math.PI)*16), 3, 3); }
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(Math.round(cx - 30 + (t*20 % 60)), cy + 4, 10, 2); }
    else if(n === 'TV & kệ'){ g.fillStyle = '#4fc3f7'; g.fillRect(x + 20, y - 70, 160, 66); g.fillStyle = '#7cd67c'; g.fillRect(x + 20, y - 24, 160, 20); g.fillStyle = '#ffd23f'; g.fillRect(Math.round(x + 92 + Math.sin(t)*48), y - 46, 16, 16); g.fillStyle = O; g.fillRect(Math.round(x + 92 + Math.sin(t)*48), y - 46, 16, 2); }
    else if(n.startsWith('Đèn lồng')){ g.globalAlpha = .22 + .12*Math.sin(t*3); g.fillStyle = n === 'Đèn lồng' ? '#ffe0a0' : '#ff8a5a'; g.beginPath(); g.arc(x + w/2, y + 22, w*.95, 0, 7); g.fill(); g.globalAlpha = 1; } });
  if(s === 'chauau') [300, 660].forEach((cx, k) => { g.globalAlpha = .16 + .08*Math.sin(t*2 + k); g.fillStyle = '#fff59d'; g.beginPath(); g.arc(cx, 70, 46, 0, 7); g.fill(); g.globalAlpha = 1; });
}
// thay phần thân (withCtx đầu tiên) của hsDraw gốc: nền cache + lớp động + nhân vật người chơi (y như bản cũ)
function v65fHsBody(){
  const s = HS.s, t = performance.now()/1000;
  ctx.drawImage(v65fHsBg(s), 0, 0); v65fHsAnim(ctx, s, t);
  if(PLAYER){ const sx = PLAYER.x, sy = PLAYER.y, sd = PLAYER.dir, sm = PLAYER.moving, sw = PLAYER.walk; ctx.save(); ctx.translate(HS.x, HS.y); ctx.scale(2.2, 2.2); PLAYER.x = 0; PLAYER.y = 0; PLAYER.dir = HS.dir; PLAYER.moving = HS.moving; PLAYER.walk = (PLAYER.walk || 0) + (HS.moving ? .25 : 0);
    try { drawBody(PLAYER, false); } catch(e){ rect('#3d7bff', -6, -20, 12, 18); circ(0, -26, 6, '#f2c9a0'); } PLAYER.x = sx; PLAYER.y = sy; PLAYER.dir = sd; PLAYER.moving = sm; if(!HS.moving) PLAYER.walk = sw; ctx.restore(); }
}
function v65fHouseInit(){
  if(typeof hsDraw !== 'function' || typeof withCtx !== 'function') return;
  const hd0 = hsDraw; hsDraw = function(){ V65F.hsOn = v65fReady() && !!V65F_HS[HS.s]; V65F.hsN = 0; try { return hd0.apply(this, arguments); } finally { V65F.hsOn = false; } };
  const wc0 = withCtx; withCtx = function(c, fn){
    if(V65F.hsOn && V65F.hsN++ === 0) return wc0(c, () => { ctx.setTransform(c.width/960, 0, 0, c.height/580, 0, 0); ctx.imageSmoothingEnabled = false; try { v65fHsBody(); } catch(e){ console.warn('v65f hs', e); V65F.hsOn = false; fn(); } });
    return wc0(c, fn); };
  // mở nhà → bắt đầu tải lười ảnh nội thất ngay (thường xong trước khung hình thứ 2)
  const oh0 = openHouse; openHouse = function(h){ v65fReady(); return oh0.apply(this, arguments); };
}
