// ================= v65c · 3/4 SPRITE KHU THIÊN NHIÊN: cây, lều, chùa, đài thiên văn, nông trại, khinh khí cầu (cache theo mùa) =================
// Vẽ pixel ở nửa độ phân giải rồi phóng ×2 (đúng nét Ninja Adventure). Toà lớn có chữ dùng canvas ×2 cho chữ sắc trên điện thoại.
// ---------- pixel: đa giác + elip tô theo hàng (không khử răng cưa → nét pixel sạch) ----------
function v65cPoly(g, P, col){
  const ys = P.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys)); g.fillStyle = col;
  for(let y = y0; y < y1; y++){ const yc = y + .5, xs = [];
    for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; if((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1])*(b[0] - a[0])/(b[1] - a[1])); }
    xs.sort((p, q) => p - q); for(let k = 0; k + 1 < xs.length; k += 2){ const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]); if(xb > xa) g.fillRect(xa, y, xb - xa, 1); } }
}
function v65cOval(g, cx, cy, rx, ry, col, half){
  g.fillStyle = col; for(let y = Math.floor(cy - ry); y < Math.ceil(cy + (half ? 0 : ry)); y++){ const v = (y + .5 - cy)/ry; if(Math.abs(v) > 1) continue; const w = rx*Math.sqrt(1 - v*v); g.fillRect(Math.round(cx - w), y, Math.round(cx + w) - Math.round(cx - w), 1); }
}
// toà lớn: canvas toạ độ thế giới × k (chữ sắc)
function v65cBig(key, w, h, draw){
  let c = V65C.spr[key]; if(c) return c; const k = Math.min(2, Math.max(1, window.devicePixelRatio || 1)), cv = document.createElement('canvas');
  cv.width = Math.ceil(w*k); cv.height = Math.ceil(h*k); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(k, k);
  try { draw(g); } catch(e){ console.warn('v65c big', key, e); } c = V65C.spr[key] = {cv, w, h}; return c;
}
const V65C_O = '#2b1a10';

// ---------- cây (dùng cây NA của v64s, đổi theo mùa) ----------
function v65cTreeAt(g, x, y, i, pine){
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, pine ? 22 : 24, pine ? 7 : 8, 0, 0, Math.PI*2); g.fill();
  if(pine) g.drawImage(v64sTreeSpr('pine', i), x - 33, y - 96); else g.drawImage(v64sTreeSpr('tree', i), x - 32, y - 60);
}
// ---------- khinh khí cầu pixel ----------
function v65cBalloonSpr(col){
  return v65cSpr('bal' + col, 24, 40, g => {
    const lt = v65cMix(col, '#ffffff', .45), dk = v65cMix(col, '#1a0d08', .35);
    v65cOval(g, 12, 13, 11.5, 13, V65C_O); v65cOval(g, 12, 13, 10.5, 12, col);
    for(const sx of [6, 11, 16]){ g.fillStyle = sx === 11 ? '#fff6ea' : lt; for(let y = 2; y < 25; y++){ const v = (y + .5 - 13)/12, w = 10.5*Math.sqrt(Math.max(0, 1 - v*v)); if(Math.abs(sx + 1 - 12) < w - 1) g.fillRect(sx, y, 2, 1); } }
    g.fillStyle = dk; for(let y = 14; y < 25; y++){ const v = (y + .5 - 13)/12, w = 10.5*Math.sqrt(Math.max(0, 1 - v*v)); g.fillRect(Math.round(12 + w - 2), y, 2, 1); }
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(6, 5, 2, 4);
    g.fillStyle = V65C_O; g.fillRect(8, 25, 8, 2); g.fillRect(8, 27, 1, 5); g.fillRect(15, 27, 1, 5);
    v65cBox(g, 8, 32, 8, 7, '#c98a4a'); g.fillStyle = '#a0662f'; g.fillRect(9, 35, 6, 1);
  });
}
function v65cBalloonAt(g, x, y, c, i){
  const s = v65cBalloonSpr(c || '#ef4b4b'), bob = Math.sin(realT*1.2 + (i || 0))*3;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 2, 14, 4, 0, 0, Math.PI*2); g.fill();
  v65cPut(g, s, x, y + bob, 24, 78);
  if(Math.floor(realT*5 + (i || 0)) % 4 === 0){ g.fillStyle = '#ffb300'; g.fillRect(x - 3, y + bob - 30, 6, 6); g.fillStyle = '#fff59d'; g.fillRect(x - 1, y + bob - 28, 2, 3); }
}
// ---------- lều trại + lửa ----------
function v65cTentSpr(col){
  return v65cSpr('tent' + col + season, 22, 17, g => {
    const dk = v65cMix(col, '#1a0d08', .35), lt = v65cMix(col, '#ffffff', .35);
    v65cPoly(g, [[11, 0], [22, 16], [0, 16]], V65C_O); v65cPoly(g, [[11, 1.6], [20.4, 15], [1.6, 15]], col);
    v65cPoly(g, [[11, 1.6], [20.4, 15], [12, 15]], dk); v65cPoly(g, [[11, 6], [14.5, 15], [7.5, 15]], V65C_O); v65cPoly(g, [[11, 8], [13, 15], [9, 15]], '#5a3a26');
    g.fillStyle = lt; g.fillRect(10, 2, 1, 5); if(v65cDong()){ g.fillStyle = '#ffffff'; v65cPoly(g, [[11, 1], [15, 6], [7, 6]], '#ffffff'); }
  });
}
function v65cFire(g, x, y){
  g.fillStyle = '#5a3a26'; g.fillRect(x - 8, y - 3, 16, 4); g.fillStyle = V65C_O; g.fillRect(x - 8, y + 1, 16, 1);
  if(isStorm()) return; const f = Math.floor(realT*8) % 3;
  g.fillStyle = '#ff5722'; g.fillRect(x - 5, y - 9 - f, 10, 7 + f); g.fillStyle = '#ff9800'; g.fillRect(x - 3, y - 12 + f, 6, 9 - f); g.fillStyle = '#ffeb3b'; g.fillRect(x - 1, y - 8, 3, 5);
  if(f === 1){ g.fillStyle = '#ffcc80'; g.fillRect(x + 2, y - 18, 2, 2); }
}
// ---------- đình nghỉ giữa hồ ----------
function v65cPavSpr(){
  return v65cSpr('pav' + season, 40, 30, g => {
    v65cBox(g, 3, 24, 34, 5, '#c47a3c'); g.fillStyle = '#e6a35c'; g.fillRect(4, 25, 32, 1);
    for(const px of [6, 32]){ g.fillStyle = V65C_O; g.fillRect(px - 1, 11, 4, 14); g.fillStyle = '#b8473a'; g.fillRect(px, 11, 2, 13); }
    v65cPoly(g, [[0, 13], [6, 3], [34, 3], [40, 13]], V65C_O); v65cPoly(g, [[1.5, 12], [7, 4], [33, 4], [38.5, 12]], v65cDong() ? '#f4f6f8' : '#c0392b');
    if(!v65cDong()){ g.fillStyle = '#e05a4a'; for(let x = 8; x < 32; x += 4) g.fillRect(x, 5, 1, 6); g.fillStyle = '#8c2f2f'; g.fillRect(2, 11, 36, 1); }
    v65cPoly(g, [[14, 3], [20, 0], [26, 3]], V65C_O); g.fillStyle = '#ffd23f'; g.fillRect(19, 0, 2, 2);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(8, 14, 24, 2);
  });
}
// ---------- vườn thiền: chùa, cổng torii, đèn đá, trúc ----------
function v65cTempleSpr(){
  return v65cBig('temple' + season, 230, 168, g => {
    const cx = 115, base = 160;
    g.fillStyle = '#2b2430'; g.fillRect(cx - 98, base - 16, 196, 16); g.fillStyle = '#b9b4a8'; g.fillRect(cx - 96, base - 14, 192, 12); g.fillStyle = '#d9d4c8'; g.fillRect(cx - 96, base - 14, 192, 3);
    for(let k = 0; k < 3; k++){ g.fillStyle = '#2b2430'; g.fillRect(cx - 26 + k*4, base - 4 + k*2 - 6, 52 - k*8, 4); g.fillStyle = '#cfc9bb'; g.fillRect(cx - 25 + k*4, base - 3 + k*2 - 6, 50 - k*8, 2); }
    v64sHouse(g, 12, cx - 64, base - 16 - 128 - 6, 4, 2, 1, [1, 2]);   // tầng trên (che bởi mái dưới)
    const H = v64sHouse(g, 12, cx - 96, base - 16 - 96, 6, 2, 1, [2, 3]);
    if(v65cDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, 0, 230, base - 16 - 128 + 20); g.fillRect(0, base - 16 - 96, 230, 22); g.globalCompositeOperation = 'source-over'; }
    // cửa vàng sáng + tượng Phật nhỏ
    g.fillStyle = '#ffcf66'; g.fillRect(cx - 26, base - 46, 52, 28); g.fillStyle = '#ffe08a'; g.fillRect(cx - 22, base - 42, 44, 24);
    g.fillStyle = '#c99a1e'; g.beginPath(); g.arc(cx, base - 34, 4, 0, 7); g.fill(); g.fillRect(cx - 8, base - 28, 16, 8); g.fillStyle = '#e6b422'; g.fillRect(cx - 11, base - 22, 22, 4);
    // ngọn vàng
    g.fillStyle = '#2b1a10'; g.fillRect(cx - 3, 0, 6, 16); g.fillStyle = '#ffd23f'; g.fillRect(cx - 2, 1, 4, 14); g.fillRect(cx - 5, 12, 10, 3);
    v64sBoard(g, cx, base - 16 - 96 + 52, 'Chùa Tĩnh Tâm');
  });
}
function v65cToriiSpr(){ return v65cBig('torii' + season, 100, 70, g => { v64sT(g, 'H', 0, 5, 2, 4, 3, 2, 2); if(v65cDong()){ g.fillStyle = '#ffffff'; g.fillRect(4, 4, 92, 5); } }); }
function v65cLanternSpr(){
  return v65cSpr('lant' + season, 12, 24, g => {
    v65cBox(g, 3, 20, 6, 4, '#9a9aa6', '#2b2430'); v65cBox(g, 4, 11, 4, 10, '#b9b4a8', '#2b2430');
    v65cBox(g, 1, 6, 10, 6, '#b9b4a8', '#2b2430'); g.fillStyle = '#ffd77a'; g.fillRect(3, 8, 6, 2);
    v65cPoly(g, [[0, 7], [6, 1], [12, 7]], '#2b2430'); v65cPoly(g, [[1.5, 6], [6, 2.4], [10.5, 6]], v65cDong() ? '#ffffff' : '#8a857a');
  });
}
function v65cBambooSpr(v){ return v65cBig('bam' + v + season, 34, 98, g => { v64sT(g, 'N', 10 + (v % 2), 8, 1, 2, 1, v % 2 ? 2 : 3, 2); if(v65cDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, 0, 34, 30); g.globalCompositeOperation = 'source-over'; } }); }
function v65cRockSpr(v){ return v65cBig('rock' + v + season, 66, 66, g => { v64sT(g, 'N', v ? 7 : 0, v ? 12 : 12, 1, 1, v ? 1 : 2, v ? 1 : 2, 2); if(v65cDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 0, 66, 20); g.globalCompositeOperation = 'source-over'; } }); }
// ---------- đài thiên văn ----------
function v65cObsSpr(kind){
  const dong = v65cDong();
  if(kind === 'giant') return v65cSpr('og' + season, 130, 92, g => {   // trống đá + vòm trắng có khe
    v65cOval(g, 65, 62, 63, 57, V65C_O, true); v65cOval(g, 65, 62, 61, 55, '#eef2f4', true);
    g.fillStyle = '#cfd8dc'; for(let y = 8; y < 62; y++){ const v = (y + .5 - 62)/55, w = 61*Math.sqrt(Math.max(0, 1 - v*v)); g.fillRect(Math.round(65 + w*.55), y, Math.max(0, Math.round(w*.45)), 1); }
    g.fillStyle = '#b0bec5'; for(let a = -3; a <= 3; a++) if(a) for(let y = 12; y < 62; y += 1){ const t = (62 - y)/50; g.fillRect(Math.round(65 + a*18*(1 - t*.85)), y, 1, 1); }
    g.fillStyle = '#263238'; g.fillRect(57, 6, 16, 56); g.fillStyle = '#37474f'; g.fillRect(59, 6, 3, 56);
    v65cBox(g, 3, 60, 124, 30, '#cfc6b4', V65C_O); g.fillStyle = '#b8ae99'; for(let y = 66; y < 89; y += 6) g.fillRect(4, y, 122, 1);
    g.fillStyle = '#d4a52c'; g.fillRect(2, 59, 126, 3);
    for(let k = 0; k < 8; k++){ const x = 9 + k*15; if(k === 3 || k === 4) continue; g.fillStyle = V65C_O; g.fillRect(x - 1, 66, 9, 15); g.fillStyle = '#1a237e'; g.fillRect(x, 67, 7, 13); g.fillStyle = '#5c6bc0'; g.fillRect(x + 1, 68, 2, 4); }
    v65cBox(g, 55, 70, 20, 20, '#8a5a35', V65C_O); g.fillStyle = '#ffd27a'; g.fillRect(57, 72, 16, 3);
    if(dong){ g.fillStyle = '#ffffff'; g.fillRect(4, 58, 122, 2); }
  });
  if(kind === 'radio') return v65cSpr('or' + season, 44, 30, g => {
    for(let y = 0; y < 22; y++){ const t = y/22; g.fillStyle = V65C_O; g.fillRect(Math.round(22 - 15*t) - 1, y, 3, 1); g.fillRect(Math.round(22 + 15*t) - 1, y, 3, 1); g.fillStyle = '#cfd8dc'; g.fillRect(Math.round(22 - 15*t), y, 1, 1); g.fillRect(Math.round(22 + 15*t), y, 1, 1); }
    g.fillStyle = V65C_O; g.fillRect(14, 11, 16, 2); v65cBox(g, 2, 22, 40, 8, '#90a4ae', V65C_O); g.fillStyle = '#b0bec5'; g.fillRect(3, 23, 38, 2);
  });
  if(kind === 'solar') return v65cSpr('os' + season, 26, 92, g => {
    v65cBox(g, 4, 8, 18, 84, '#eceff1', V65C_O); g.fillStyle = '#cfd8dc'; for(let k = 0; k < 6; k++) g.fillRect(5, 14 + k*13, 16, 2); g.fillStyle = '#b0bec5'; g.fillRect(16, 9, 5, 82);
    v65cBox(g, 1, 0, 24, 9, '#ffb300', V65C_O); g.fillStyle = '#ffe082'; g.fillRect(2, 1, 22, 2);
    v65cBox(g, 9, 78, 8, 14, '#8a5a35', V65C_O); if(dong){ g.fillStyle = '#fff'; g.fillRect(1, 0, 24, 2); }
  });
  if(kind === 'dome') return v65cSpr('od' + season, 100, 58, g => {
    v65cOval(g, 50, 36, 49, 35, V65C_O, true); v65cOval(g, 50, 36, 47, 33, '#283593', true);
    for(let k = 0; k < 22; k++){ const a = Math.PI + (k*0.613) % Math.PI, rr = 9 + (k*29) % 30; g.fillStyle = k % 5 ? '#fff59d' : '#ffffff'; g.fillRect(Math.round(50 + Math.cos(a)*rr*1.4), Math.round(36 + Math.sin(a)*rr*.9), k % 5 ? 1 : 2, k % 5 ? 1 : 2); }
    if(dong){ v65cOval(g, 50, 36, 47, 10, '#ffffff', true); }
    v65cBox(g, 3, 35, 94, 23, '#d7ccc8', V65C_O); g.fillStyle = '#bcaaa4'; g.fillRect(4, 41, 92, 1); g.fillRect(4, 49, 92, 1);
    v65cBox(g, 42, 40, 16, 18, '#8a5a35', V65C_O); g.fillStyle = '#ffd27a'; g.fillRect(44, 42, 12, 2);
  });
  if(kind === 'refr') return v65cSpr('of' + season, 44, 74, g => {
    v65cPoly(g, [[0, 18], [22, 0], [44, 18]], V65C_O); v65cPoly(g, [[2, 17], [22, 1.6], [42, 17]], dong ? '#f4f6f8' : '#6d4c41'); g.fillStyle = dong ? '#dfe6ea' : '#8d6e63'; g.fillRect(8, 15, 28, 1);
    v65cBox(g, 4, 17, 36, 57, '#a1887f', V65C_O); g.fillStyle = '#8d6e63'; for(let k = 0; k < 9; k++) for(let j = 0; j < 4; j++) g.fillRect(5 + (k % 2)*4 + j*9, 20 + k*6, 7, 1);
    g.fillStyle = V65C_O; g.fillRect(16, 30, 12, 10); g.fillStyle = '#ffd27a'; g.fillRect(17, 31, 10, 8);
    v65cBox(g, 16, 60, 12, 14, '#5d4037', V65C_O);
  });
  if(kind === 'scope') return v65cSpr('osc', 16, 18, g => {
    g.fillStyle = V65C_O; g.fillRect(7, 8, 2, 10); g.fillRect(3, 15, 2, 3); g.fillRect(11, 15, 2, 3); g.fillRect(4, 12, 8, 2);
    v65cPoly(g, [[2, 8], [12, 2], [14, 5], [4, 11]], V65C_O); v65cPoly(g, [[3, 8], [12, 3], [13, 5], [4, 10]], '#d4a52c');
  });
}
// ---------- nông trại ----------
function v65cBarnSpr(){
  return v65cSpr('barn' + season, 112, 94, g => {   // gốc: (6, 32) = góc tường trái trên (bx, by)
    const ox = 6, oy = 32, dong = v65cDong();
    v65cPoly(g, [[ox - 7, oy + 2], [ox + 11, oy - 21], [ox + 50, oy - 33], [ox + 89, oy - 21], [ox + 107, oy + 2]], V65C_O);
    v65cPoly(g, [[ox - 5, oy + 1], [ox + 12, oy - 19.5], [ox + 50, oy - 31], [ox + 88, oy - 19.5], [ox + 105, oy + 1]], dong ? '#f4f6f8' : '#7a2e22');
    if(!dong){ g.fillStyle = '#93392b'; for(let x = ox; x < ox + 100; x += 5) g.fillRect(x, oy - 18, 1, 18); }
    v65cBox(g, ox, oy, 100, 59, '#b8473a', V65C_O); g.fillStyle = '#a63d31'; for(let x = ox + 3; x < ox + 99; x += 6) g.fillRect(x, oy + 1, 1, 57);
    g.fillStyle = '#f4ead8'; g.fillRect(ox + 1, oy + 1, 98, 2); g.fillRect(ox + 1, oy + 56, 98, 2); g.fillRect(ox + 1, oy + 1, 2, 57); g.fillRect(ox + 97, oy + 1, 2, 57);
    // ô cỏ khô trên gác
    v65cBox(g, ox + 41, oy - 22, 18, 15, '#3a2418', '#f4ead8'); g.fillStyle = '#e8c35a'; g.fillRect(ox + 43, oy - 15, 14, 6); g.fillStyle = '#d4a83a'; for(let k = 0; k < 6; k++) g.fillRect(ox + 43 + k*2, oy - 17, 1, 3);
    // cửa lớn chữ X
    const dx = ox + 34, dy = oy + 24; v65cBox(g, dx, dy, 32, 35, '#b8473a', '#f4ead8'); g.fillStyle = '#f4ead8'; g.fillRect(dx + 15, dy, 2, 35);
    for(let t = 0; t < 16; t++){ g.fillRect(dx + t, dy + Math.round(t*35/16), 2, 2); g.fillRect(dx + 15 - t, dy + Math.round(t*35/16), 2, 2); g.fillRect(dx + 16 + t, dy + Math.round(t*35/16), 2, 2); g.fillRect(dx + 31 - t, dy + Math.round(t*35/16), 2, 2); }
    // chong chóng gió
    g.fillStyle = '#4a4a4a'; g.fillRect(ox + 49, 0, 2, 8); g.fillRect(ox + 45, 2, 10, 1); g.fillStyle = '#ffd23f'; g.fillRect(ox + 47, 0, 4, 2);
    if(dong){ g.fillStyle = '#ffffff'; g.fillRect(ox + 1, oy - 1, 98, 2); }
  });
}
function v65cSiloSpr(){
  return v65cSpr('silo' + season, 20, 58, g => {
    v65cOval(g, 10, 9, 9, 7, V65C_O, true); v65cOval(g, 10, 9, 8, 6, v65cDong() ? '#ffffff' : '#6f7a82', true);
    v65cBox(g, 1, 8, 18, 50, '#8e9aa3', V65C_O); g.fillStyle = '#aab6be'; g.fillRect(3, 9, 4, 48); g.fillStyle = '#7b868e'; for(let k = 0; k < 7; k++) g.fillRect(2, 14 + k*6, 16, 1);
    g.fillStyle = V65C_O; g.fillRect(9, 0, 2, 4);
  });
}
function v65cFarmhouseSpr(){
  return v65cBig('fhouse' + season, 136, 130, g => {
    g.fillStyle = V65C_O; g.fillRect(96, 6, 16, 30); g.fillStyle = '#7a5a3a'; g.fillRect(98, 8, 12, 26);
    const H = v64sHouse(g, 0, 4, 30, 4, 2, 1, [2]);
    if(v65cDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, 0, 136, H.wallY - 30); g.globalCompositeOperation = 'source-over'; }
    v64sBoard(g, 68, H.wallY - 32, 'Nhà nông trại');
  });
}
function v65cCoopSpr(){
  return v65cSpr('coop' + season, 32, 30, g => {
    v65cPoly(g, [[0, 12], [16, 1], [32, 12]], V65C_O); v65cPoly(g, [[2, 11], [16, 2.5], [30, 11]], v65cDong() ? '#ffffff' : '#7a3a24');
    v65cBox(g, 3, 11, 26, 19, '#c0603d', V65C_O); g.fillStyle = '#a84f30'; for(let y = 14; y < 29; y += 4) g.fillRect(4, y, 24, 1);
    v65cBox(g, 12, 19, 8, 11, '#3a2418', V65C_O); v65cBox(g, 5, 14, 6, 5, '#e8c35a', V65C_O);
  });
}
function v65cGateSpr(){
  return v65cBig('fgate' + season, 220, 122, g => {
    const cx = 110, base = 118, gw = 124, g0 = cx - gw/2, g1 = cx + gw/2;
    [g0 - 18, g1].forEach(px => { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(px + 2, base - 4, 22, 6); g.fillStyle = '#2b2430'; g.fillRect(px - 2, base - 74, 22, 74);
      g.fillStyle = '#c9c2b4'; g.fillRect(px, base - 72, 18, 72); g.fillStyle = '#e4ded2'; g.fillRect(px, base - 72, 5, 72); g.fillStyle = '#9a9286'; for(let k = 0; k < 5; k++) g.fillRect(px, base - 60 + k*13, 18, 2);
      g.fillStyle = '#2b2430'; g.fillRect(px - 4, base - 80, 26, 9); g.fillStyle = '#e4ded2'; g.fillRect(px - 3, base - 79, 24, 6);
      g.fillStyle = '#2b2430'; g.fillRect(px + 3, base - 96, 12, 17); g.fillStyle = '#ffd27a'; g.fillRect(px + 5, base - 93, 8, 11); });
    g.fillStyle = '#2b1a10'; g.fillRect(g0 - 22, base - 78, gw + 44, 12); g.fillStyle = '#9a6236'; g.fillRect(g0 - 20, base - 76, gw + 40, 8); g.fillStyle = '#c99560'; g.fillRect(g0 - 20, base - 76, gw + 40, 2);
    if(v65cDong()){ g.fillStyle = '#ffffff'; g.fillRect(g0 - 20, base - 80, gw + 40, 4); }
    v64sBoard(g, cx, base - 112, '🐄 TRANG TRẠI', true);
  });
}
function v65cStallSpr(){
  return v65cSpr('stall' + season, 26, 30, g => {
    v65cBox(g, 2, 14, 22, 16, '#ff8fb1', V65C_O); g.fillStyle = '#fff'; g.fillRect(3, 15, 20, 3);
    g.fillStyle = V65C_O; g.fillRect(3, 6, 2, 9); g.fillRect(21, 6, 2, 9);
    g.fillStyle = V65C_O; g.fillRect(0, 2, 26, 6); for(let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? '#ff6f91' : '#ffffff'; g.fillRect(1 + k*4, 3, 4, 4); }
    g.fillStyle = '#ffe08a'; g.fillRect(8, 10, 3, 4); g.fillStyle = '#c98a4a'; g.fillRect(8, 13, 3, 2); g.fillStyle = '#b8f0ff'; g.fillRect(15, 10, 3, 4); g.fillStyle = '#c98a4a'; g.fillRect(15, 13, 3, 2);
  });
}
function v65cHaySpr(){ return v65cSpr('hay' + season, 18, 14, g => { v65cOval(g, 9, 8, 8.5, 6.5, V65C_O); v65cOval(g, 9, 8, 7.5, 5.5, v65cDong() ? '#ffffff' : '#e8c35a'); g.fillStyle = '#d4a83a'; for(let k = 0; k < 4; k++) g.fillRect(4 + k*3, 6 + (k % 2)*2, 2, 1); }); }
function v65cScareSpr(){ return v65cBig('scare' + season, 34, 34, g => { v64sT(g, 'E', 15, 0, 1, 1, 1, 1, 2); }); }
function v65cWindsockSpr(){
  return v65cSpr('sock', 22, 40, g => { g.fillStyle = V65C_O; g.fillRect(2, 2, 3, 38); g.fillStyle = '#c9c2b4'; g.fillRect(3, 3, 1, 36);
    v65cPoly(g, [[5, 3], [21, 6], [21, 10], [5, 13]], V65C_O); for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? '#ffffff' : '#ef4b4b'; g.fillRect(6 + k*4, 4 + Math.round(k*.75), 4, 8 - Math.round(k*1.4)); } });
}

// ---------- bố cục sprite của từng khu (toạ độ cũ) ----------
function v65cLayout(id){
  if(V65C.P[id]) return V65C.P[id]; const r = R[id]; if(!r) return null; const P = [];
  const T = (x, y, i, pine) => P.push({k:pine ? 'pine' : 'tree', x, y, i}), Lp = (x, y) => P.push({k:'lamp', x, y}), B = (x, y) => P.push({k:'bench', x, y});
  if(id === 'pond'){ T(1052, -432, 3); T(1548, -436, 5, 1); T(1050, -96, 1, 1); T(1552, -92, 2); Lp(1110, -70); Lp(1490, -70); B(1220, -66); B(1380, -66); P.push({k:'bush', x:1090, y:-116, i:1}, {k:'bush', x:1514, y:-122, i:2}, {k:'bed', x:1300, y:-58, i:0}); }
  if(id === 'flowerfield'){ for(let k = 0; k < 7; k++){ const y = -540 + k*74 + 64; if(k % 2 === 0) Lp(2150, y + 6); } P.push({k:'scare', x:1850, y:-380}, {k:'scare', x:2380, y:-160}); }
  if(id === 'garden'){ Lp(r.x - 12, r.y + r.h + 22); Lp(r.x + r.w + 12, r.y + r.h + 22); B(r.x + 120, r.y + r.h + 24); B(r.x + r.w - 120, r.y + r.h + 24); }
  if(id === 'picnic'){ Lp(r.x + r.w + 14, r.y + 50); Lp(r.x - 14, r.y + r.h - 10); P.push({k:'bush', x:r.x + r.w/2, y:r.y + r.h + 22, i:0}); }
  if(id === 'lotus'){ const C = LOTUS; Lp(C.cx - 40, C.cy + C.ry + 30); Lp(C.cx + 40, C.cy + C.ry + 30); B(C.cx - 110, C.cy + C.ry + 26); B(C.cx + 110, C.cy + C.ry + 26); }
  if(id === 'lake'){ const C = LAKE; TENTS.forEach(([x, y, c], i) => { P.push({k:'tent', x, y:y + 8, c}); if(i % 2 === 0) P.push({k:'fire', x:x + 30, y:y + 8}); });
    P.push({k:'pav', x:C.cx, y:C.cy - 10}); Lp(C.cx - C.rx - 34, C.cy - 22); Lp(C.cx + C.rx + 34, C.cy - 22); }
  if(id === 'zen'){ const cx = r.x + 320;
    P.push({k:'temple', x:cx, y:r.y + 132}, {k:'torii', x:cx, y:r.y + 236}, {k:'old', x:r.x + 478, y:r.y + 132});
    [[cx - 108, r.y + 128], [cx + 102, r.y + 128], [r.x + 316, r.y + 486], [r.x + 488, r.y + 470]].forEach(([x, y]) => P.push({k:'lant', x, y}));
    [[20, 100, 0], [38, 150, 1], [56, 104, 0], [72, 152, 1], [28, 196, 1], [62, 200, 0]].forEach(([dx, dy, v]) => P.push({k:'bam', x:r.x + dx, y:r.y + dy, i:v}));
    [[r.x + 140, r.y + 160, 0], [r.x + 380, r.y + 260, 1], [r.x + 220, r.y + 430, 0]].forEach(([x, y, v]) => P.push({k:'rock', x, y:y + 14, i:v})); }
  if(id === 'botanic' && typeof obsPlan === 'function'){ const O = obsPlan(r);
    P.push({k:'obs', o:'giant', x:O.giant.x, y:O.giant.y + 62}, {k:'obs', o:'radio', x:O.radio.x, y:O.radio.y + 46}, {k:'obs', o:'solar', x:O.solar.x, y:O.solar.y + 50}, {k:'obs', o:'dome', x:O.dome.x, y:O.dome.y + 44}, {k:'obs', o:'refr', x:O.refr.x, y:O.refr.y + 50});
    for(let k = 0; k < 4; k++) P.push({k:'obs', o:'scope', x:O.deck.x - 80 + k*54, y:O.deck.y + 24});
    for(let k = 0; k < 12; k++) P.push({k:'bush', x:r.x + 30 + k*60, y:r.y + r.h - 8, i:k});
    T(r.x + 40, r.y + 230, 4); T(r.x + r.w - 40, r.y + 300, 6, 1); Lp(O.deck.x - 130, O.deck.y + 30); Lp(O.deck.x + 130, O.deck.y + 30); }
  if(id === 'farm' && typeof V45FL !== 'undefined'){ const L = V45FL;
    P.push({k:'barn', x:L.gx - 100, y:-468 + 118}, {k:'silo', x:4607, y:-418}, {k:'fhouse', x:4874 + 62, y:-438 + 78}, {k:'coop', x:5036, y:-360}, {k:'fgate', x:L.gx, y:L.fy}, {k:'stall', x:4400, y:-54});
    P.push({k:'hay', x:4588, y:-386}, {k:'hay', x:4612, y:-392}, {k:'hay', x:4864, y:-378}, {k:'scare', x:4520, y:-310}, {k:'bench', x:5073, y:-52});
    [[4372, -96, 0], [5086, -92, 1], [4352, -236, 2], [5150, -236, 0]].forEach(([x, y, i]) => T(x, y, i)); }
  if(id === 'bpad'){ P.push({k:'sock', x:r.x + 44, y:r.y + 70}); Lp(r.x + r.w - 40, r.y + 60); }
  if(id === 'art'){ [[r.x + 30, r.y + 62, 0], [r.x + r.w - 34, r.y + 322, 1], [r.x + 40, r.y + 322, 2], [r.x + r.w - 40, r.y + 42, 0]].forEach(([x, y, i]) => T(x, y, i)); }
  P.sort((a, b) => a.y - b.y); V65C.P[id] = P; return P;
}
function v65cDrawProp(g, p){
  const sh = (rx, ry) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI*2); g.fill(); };
  switch(p.k){
    case 'tree': v65cTreeAt(g, p.x, p.y, p.i, 0); return;
    case 'pine': v65cTreeAt(g, p.x, p.y, p.i, 1); return;
    case 'old': sh(52, 16); g.drawImage(v64sTreeSpr('old'), p.x - 72, p.y - 138); return;
    case 'bush': if(v65cDong()) v64sT(g, 'N', 5, 12, p.x - 16, p.y - 26, 1, 1, 2); else { v64sT(g, 'N', p.i % 2, 10, p.x - 16, p.y - 28, 1, 1, 2); if(p.i % 3 === 0 && !v65cThu()) v64sT(g, 'N', [0, 3, 6][p.i % 3], 11, p.x - 2, p.y - 22, 1, 1, 1); } return;
    case 'lamp': sh(10, 4); g.drawImage(v64sLampSpr(), p.x - 12, p.y - 60); return;
    case 'bench': g.drawImage(v64sBenchSpr(), p.x - 36, p.y - 26); return;
    case 'bed': g.drawImage(v64sBedSpr(p.i), p.x - 36, p.y - 30); return;
    case 'tent': sh(22, 5); v65cPut(g, v65cTentSpr(p.c), p.x, p.y, 22, 32); return;
    case 'fire': v65cFire(g, p.x, p.y - 2); return;
    case 'pav': v65cPut(g, v65cPavSpr(), p.x, p.y, 40, 58); return;
    case 'temple': { const s = v65cTempleSpr(); g.drawImage(s.cv, p.x - 115, p.y - 160, s.w, s.h); return; }
    case 'torii': { const s = v65cToriiSpr(); sh(46, 5); g.drawImage(s.cv, p.x - 50, p.y - 68, s.w, s.h); return; }
    case 'lant': sh(9, 3); v65cPut(g, v65cLanternSpr(), p.x, p.y, 12, 48); return;
    case 'bam': { const s = v65cBambooSpr(p.i); g.drawImage(s.cv, p.x - 17, p.y - 98, s.w, s.h); return; }
    case 'rock': { const s = v65cRockSpr(p.i); sh(p.i ? 16 : 30, p.i ? 5 : 8); if(p.i) g.drawImage(s.cv, p.x - 17, p.y - 32, s.w, s.h); else g.drawImage(s.cv, p.x - 33, p.y - 62, s.w, s.h); return; }
    case 'obs': { const s = v65cObsSpr(p.o), A = {giant:[130, 184], radio:[44, 60], solar:[26, 184], dome:[100, 116], refr:[44, 148], scope:[16, 36]}[p.o]; if(p.o !== 'scope') sh(s.w*.42, 8); v65cPut(g, s, p.x, p.y, A[0], A[1]); return; }
    case 'barn': { const s = v65cBarnSpr(); sh(104, 8); v65cPut(g, s, p.x, p.y - 118, 12, 64); return; }
    case 'silo': sh(20, 6); v65cPut(g, v65cSiloSpr(), p.x, p.y, 20, 116); return;
    case 'fhouse': { const s = v65cFarmhouseSpr(); sh(64, 7); g.drawImage(s.cv, p.x - 68, p.y - 126, s.w, s.h); return; }
    case 'coop': sh(30, 6); v65cPut(g, v65cCoopSpr(), p.x, p.y, 32, 60); return;
    case 'fgate': { const s = v65cGateSpr(); g.drawImage(s.cv, p.x - 110, p.y - 118, s.w, s.h); return; }
    case 'stall': sh(24, 5); v65cPut(g, v65cStallSpr(), p.x, p.y, 26, 60); return;
    case 'hay': sh(16, 4); v65cPut(g, v65cHaySpr(), p.x, p.y, 18, 26); return;
    case 'scare': { const s = v65cScareSpr(); sh(10, 3); g.drawImage(s.cv, p.x - 17, p.y - 32, s.w, s.h); return; }
    case 'sock': v65cPut(g, v65cWindsockSpr(), p.x, p.y, 6, 80); return;
  }
}

// ---------- nông trại: ô trồng cây theo giai đoạn (dữ liệu FARM giữ nguyên) ----------
function v65cPlot(i){
  const [x, y] = plotPos(i), p = FARM.plots[i], st = plotStage(p), g = ctx;
  g.fillStyle = V65C_O; g.fillRect(x - 27, y - 5, 54, 18); g.fillStyle = v65cDong() ? '#f2f2f2' : '#8a5236'; g.fillRect(x - 25, y - 3, 50, 14); g.fillStyle = v65cDong() ? '#dfe6ea' : '#6d3f28'; for(let k = 0; k < 3; k++) g.fillRect(x - 23, y + k*4, 46, 2);
  if(st < 0) return; const fc = FRUITS[p.fruit][1];
  if(st === 0){ g.fillStyle = '#3a2416'; g.fillRect(x - 4, y + 1, 8, 4); g.fillStyle = '#c98a4a'; g.fillRect(x - 2, y + 1, 4, 2); return; }
  if(st === 1){ g.fillStyle = V65C_O; g.fillRect(x - 1, y - 9, 3, 10); g.fillStyle = '#5aa03c'; g.fillRect(x, y - 8, 1, 8); g.fillStyle = V65C_O; g.fillRect(x - 7, y - 12, 7, 5); g.fillRect(x + 1, y - 13, 7, 5); g.fillStyle = '#7cc04a'; g.fillRect(x - 6, y - 11, 5, 3); g.fillRect(x + 2, y - 12, 5, 3); return; }
  const big = st >= 3, S = big ? 1.5 : 1, w = 32*S;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y + 4, w*.4, 4, 0, 0, Math.PI*2); g.fill();
  v64sT(g, 'N', 6, 8, x - w/2, y + 6 - w, 2, 2, S);
  const cy = y + 6 - w*.62;
  if(st === 4) for(let k = 0; k < 7; k++){ const px = Math.round(x + Math.cos(k*2.3)*w*.3), py = Math.round(cy + Math.sin(k*2.3)*w*.2); g.fillStyle = V65C_O; g.fillRect(px - 2, py - 2, 4, 4); g.fillStyle = '#fff8e1'; g.fillRect(px - 1, py - 1, 2, 2); }
  if(st === 5) for(let k = 0; k < 8; k++){ const px = Math.round(x + Math.cos(k*2.1)*w*.3), py = Math.round(cy + Math.sin(k*2.1)*w*.22); g.fillStyle = V65C_O; g.fillRect(px - 3, py - 3, 6, 6); g.fillStyle = fc; g.fillRect(px - 2, py - 2, 4, 4); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(px - 2, py - 2, 1, 1); }
}
// ---------- thú NA (bò, ngựa, heo, gà, sư tử); loài khác giữ hình cũ ----------
const V65C_ANI = {cow:['cow', 16, 16, 3, 2, 1], buffalo:null, horse:['horse', 23, 16, 2, 2, 1], pig:['pig', 16, 16, 2, 1.5, 1], chicken:['chick', 16, 16, 2, 1.25, -1], lion:['lion', 30, 16, 2, 1.5, 1]};
function v65cAnimal(kind, x, y, dir, ph, moving){
  const A = V65C_ANI[kind]; if(!A) return false; const im = v65cI(A[0]); if(!im) return false;
  const [, fw, fh, n, s, face] = A, fr = moving ? Math.floor((ph || realT*4)*1.3) % n : 0, w = fw*s, h = fh*s, flip = (dir > 0) === (face > 0);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y, w*.4, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if(flip) ctx.scale(-1, 1); const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, fr*fw, 0, fw, fh, -w/2, -h + 2, w, h); ctx.imageSmoothingEnabled = sm; ctx.restore(); return true;
}

// ---------- lớp động (nước, cá, vịt, thuyền, sen, ếch, bướm, khinh khí cầu bay ngang) ----------
function v65cKoi(g, x, y, dx, dy, c){
  const hz = Math.abs(dx) > Math.abs(dy), L = 8, T = 3;
  g.fillStyle = 'rgba(0,0,0,.18)'; if(hz) g.fillRect(Math.round(x - L/2) + 1, Math.round(y) + 2, L, T); else g.fillRect(Math.round(x) + 1, Math.round(y - L/2) + 2, T, L);
  g.fillStyle = c; if(hz){ g.fillRect(Math.round(x - L/2), Math.round(y - 1), L, T); g.fillRect(Math.round(x - (dx > 0 ? L/2 + 3 : -L/2)), Math.round(y - 2), 3, 5); g.fillStyle = '#fff'; g.fillRect(Math.round(x + (dx > 0 ? 1 : -3)), Math.round(y - 1), 2, 1); }
  else { g.fillRect(Math.round(x - 1), Math.round(y - L/2), T, L); g.fillRect(Math.round(x - 2), Math.round(y - (dy > 0 ? L/2 + 3 : -L/2)), 5, 3); }
}
function v65cDuck(g, x, y, f){ g.fillStyle = V65C_O; g.fillRect(x - 7, y - 4, 14, 8); g.fillStyle = '#f4f4f4'; g.fillRect(x - 6, y - 3, 12, 6); g.fillStyle = V65C_O; g.fillRect(x + f*6 - 3, y - 9, 7, 7); g.fillStyle = '#2e7d32'; g.fillRect(x + f*6 - 2, y - 8, 5, 5); g.fillStyle = '#ff9800'; g.fillRect(x + f*9 - 1, y - 6, 3, 2); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x - 8, y + 4, 16, 1); }
function v65cRipple(g, x, y, k){ if(v65cDong()) return; const t = (realT*.5 + k*.37) % 1, w = Math.round(4 + t*10), h = Math.max(1, Math.round(w*.4)); g.fillStyle = `rgba(255,255,255,${(1 - t)*.85})`; x = Math.round(x); y = Math.round(y); g.fillRect(x - w, y - h, w*2, 2); g.fillRect(x - w - 2, y - h + 2, 2, h*2 - 2); g.fillRect(x + w, y - h + 2, 2, h*2 - 2); g.fillRect(x - w, y + h, w*2, 2); }
function v65cButterflies(g, r, n, seed){
  if(v65cDong() || !isDay() || isStorm()) return; const C = ['#ff6f91', '#ffd23f', '#7c9cff', '#ffffff', '#ff8a2b'];
  for(let i = 0; i < n; i++){ const a = realT*(.3 + (i % 3)*.07) + i*2.1 + seed, x = r.x + r.w/2 + Math.cos(a)*r.w*.38 + Math.sin(a*2.3)*20, y = r.y + r.h/2 + Math.sin(a*1.3)*r.h*.36, f = Math.floor(realT*10 + i) % 2;
    g.fillStyle = V65C_O; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 4); g.fillStyle = C[i % 5]; if(f){ g.fillRect(Math.round(x) - 5, Math.round(y) - 3, 4, 4); g.fillRect(Math.round(x) + 1, Math.round(y) - 3, 4, 4); } else { g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 2, 5); g.fillRect(Math.round(x) + 1, Math.round(y) - 3, 2, 5); } }
}
function v65cSkyBalloons(g){ if(typeof BALLOONS === 'undefined') return; BALLOONS.forEach((b, i) => { const y = b.y + Math.sin(realT*.4 + b.x*.01)*12; if(b.x < VB.x0 - 60 || b.x > VB.x1 + 60 || y < VB.y0 - 100 || y > VB.y1 + 100) return; v65cPut(g, v65cBalloonSpr(b.c[0]), b.x, y + 40, 24, 78); }); }
function v65cDyn(g, id){
  const dong = v65cDong(), r = R[id];
  if(id === 'pond'){ const P = POND; [[-.4, -.3], [.35, .2], [.1, -.5]].forEach(([u, v], k) => v65cRipple(g, P.cx + u*P.rx, P.cy + v*P.ry, k));
    if(!dong){ const ft = (realT*.35) % 1; if(ft < .18){ const u = ft/.18, x = P.cx - 60 + Math.sin(realT*.2)*80, y = P.cy - Math.sin(u*Math.PI)*24; g.fillStyle = V65C_O; g.fillRect(x - 7, y - 4, 14, 8); g.fillStyle = '#ff8a3d'; g.fillRect(x - 6, y - 3, 12, 6); g.fillRect(x + 5, y - 5, 4, 10); } } }
  if(id === 'lake'){ const P = LAKE;
    if(!dong && typeof KOI !== 'undefined') KOI.forEach(k => { const a = realT*k.sp + k.ph, x = P.cx + Math.cos(a)*P.rx*k.r, y = P.cy + Math.sin(a)*P.ry*k.r*.9; if(Math.abs(y - P.cy) < 20) return; v65cKoi(g, x, y, -Math.sin(a)*k.sp, Math.cos(a)*k.sp, k.c); });
    for(let i = 0; i < 3; i++){ const a = realT*.08 + i*2.1, x = P.cx + Math.cos(a)*P.rx*.75, y = P.cy + Math.sin(a)*P.ry*.6; if(Math.abs(y - P.cy) < 22 || dong) continue; v65cDuck(g, Math.round(x), Math.round(y), Math.sin(a) > 0 ? -1 : 1); }
    const bt = v65cI('boat'); if(bt && !dong){ const a = realT*.05 + 1, x = P.cx + Math.cos(a)*P.rx*.55, y = P.cy + P.ry*.55 + Math.sin(a*2)*6, f = -Math.sin(a) > 0 ? 1 : -1; g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(f*1.25, 1.25); g.drawImage(bt, -40, -24); g.restore(); }
    [[-.5, -.4], [.4, .35], [.62, -.3]].forEach(([u, v], k) => v65cRipple(g, P.cx + u*P.rx, P.cy + v*P.ry, k)); }
  if(id === 'lotus' && !dong){ const P = LOTUS; if(typeof LOTUS_FL !== 'undefined') LOTUS_FL.forEach(([x, y], i) => { const s = Math.round(Math.sin(realT*1.5 + i)); x = Math.round(x + s); y = Math.round(y);
      g.fillStyle = V65C_O; g.fillRect(x - 5, y - 6, 10, 7); g.fillStyle = '#f48fb1'; g.fillRect(x - 4, y - 5, 8, 5); g.fillStyle = '#fce4ec'; g.fillRect(x - 1, y - 7, 2, 4); g.fillRect(x - 4, y - 7, 2, 2); g.fillRect(x + 2, y - 7, 2, 2); g.fillStyle = '#ffd23f'; g.fillRect(x - 1, y - 3, 2, 1); });
    const fr = v65cI('frog'); if(fr) [[-.45, .2], [.5, -.25]].forEach(([u, v], k) => { const f = Math.floor(realT*.8 + k*1.7) % 4 === 0 ? 1 : 0; g.drawImage(fr, f*16, 0, 16, 16, P.cx + u*P.rx - 12, P.cy + v*P.ry - 18 - f*3, 24, 24); });
    v65cRipple(g, P.cx + 40, P.cy + 30, 1); }
  if(id === 'zen' && !dong){ const cx = r.x + 400, cy = r.y + 470; for(let i = 0; i < 4; i++){ const a = realT*(.3 + i*.05)*(i % 2 ? 1 : -1) + i*1.6, x = cx + Math.cos(a)*55, y = cy + Math.sin(a)*26; v65cKoi(g, x, y, -Math.sin(a)*(i % 2 ? 1 : -1), Math.cos(a)*(i % 2 ? 1 : -1), ['#ff7043', '#ffffff', '#e53935', '#ffb74d'][i]); } v65cRipple(g, cx - 30, cy + 8, 2); }
  if(id === 'flowerfield' || id === 'garden' || id === 'art') v65cButterflies(g, r, id === 'flowerfield' ? 9 : 4, id.length);
  if(r && r.y < 0) v65cSkyBalloons(g);
}
// đẩy sprite của khu vào danh sách vẽ (cùng người, xếp theo y)
function v65cSprites(sp, id){
  const L = v65cLayout(id); sp.push({y:-1e8, f:() => v65cDyn(ctx, id)});
  if(!L) return; for(const p of L){ if(p.x < VB.x0 - 140 || p.x > VB.x1 + 140 || p.y < VB.y0 - 20 || p.y > VB.y1 + 200) continue; sp.push({y:p.y, f:() => v65cDrawProp(ctx, p)}); }
}
