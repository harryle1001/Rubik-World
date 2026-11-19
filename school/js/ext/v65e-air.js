// ================= v65e · 4/4 SÂN BAY QUỐC TẾ RUBIK: nhà ga, hangar, tháp điều khiển, bồn dầu, trang trí kiểu NA =================
// Giữ nguyên đường băng, đường lăn, ô đỗ, máy bay và cách bay (v51p/v57p). Chỉ vẽ đè phần công trình lên ô nền cache của sân bay.
// Ô cache v57p ở tỉ lệ 1/2 → tile NA phóng ×2 hiện đúng 1 điểm ảnh gốc / điểm ảnh ô: sắc nét.
function v65eAirTerm(g, A){
  const t = A.term, x0 = t[0], y0 = t[1], tw = t[2] - t[0], th = t[3] - t[1], wT = Math.floor(tw/32), xr = x0 + (tw - wT*32)/2;
  // xoá bóng cũ quanh nhà ga bằng nền sân đỗ
  v65eR(g, '#bcb6a8', x0 - 6, y0 - 6, tw + 30, th + 34); g.fillStyle = 'rgba(0,0,0,.06)'; for(let x = Math.ceil((x0 - 6)/60)*60; x < x0 + tw + 24; x += 60) g.fillRect(x, y0 - 6, 2, th + 34);
  // ống lồng dẫn khách (vẽ lại kiểu NA, đè phần bóng cũ)
  for(const s of A.stands){ const d = s.hdg === 0 ? 1 : -1, bx = d > 0 ? s.x + 70 : t[2], w = d > 0 ? t[0] - s.x - 70 : s.x - 70 - t[2];
    v65eR(g, 'rgba(0,0,0,.2)', bx + 6, s.y - 4, w, 22); v65eR(g, V65E_O, bx, s.y - 14, w, 26); v65eR(g, '#d7dbe2', bx, s.y - 12, w, 20); v65eR(g, '#eef1f6', bx, s.y - 12, w, 5);
    for(let x = bx + 8; x < bx + w - 10; x += 18) v65eR(g, '#5aa9c8', x, s.y - 4, 10, 6); v65eR(g, V65E_O, d > 0 ? bx - 4 : bx + w - 8, s.y - 18, 12, 34); }
  v65eR(g, 'rgba(0,0,0,.22)', x0 + 16, y0 + 20, tw, th);
  const S = v65eSpr('airterm', tw + 20, th + 20, g => { g.translate(-(x0 - 10), -(y0 - 10));
  // 3 khối nhà ga mái ngói (xanh lam · đỏ · xanh lam) nối bằng 2 sảnh mái kính
  const seg = Math.floor((th - 2*64)/3), gap = 64, tint = ['#2f6fb5', '#c0392b', '#2f6fb5'];
  for(let k = 0; k < 3; k++){ const y = y0 + k*(seg + gap), rT = Math.floor((seg - 96)/32), wallY = y + rT*32;
    v65eRoof(g, 12, xr, y, wT, rT, tint[k], .2); v65eWall(g, xr, wallY, wT*32, seg - rT*32, 'white');
    for(let x = xr + 20; x < xr + wT*32 - 30; x += 40) v65eWin(g, x, wallY + 18, 22, 28, {gl:'#7fd8f0', gl2:'#d4f6ff', fr:'#e9eef5', plain:true});
    v65eDoor(g, xr + wT*16 - 26, wallY + seg - rT*32 - 46, 52, 38, {glass:true, col:'#e9eef5', col2:'#d6dbe6'});
    // giếng trời kính dọc mái + điều hoà
    for(let yy = y + 150; yy < wallY - 80; yy += 150) for(const sx of [xr + 40, xr + wT*32 - 110]){ v65eR(g, V65E_O, sx - 3, yy - 3, 76, 46); v65eR(g, '#e9eef5', sx - 1, yy - 1, 72, 42); v65eR(g, '#7fd8f0', sx + 2, yy + 2, 66, 36); v65eR(g, '#e9eef5', sx + 34, yy + 2, 2, 36); v65eR(g, 'rgba(255,255,255,.5)', sx + 6, yy + 6, 20, 4); }
    for(let i = 0; i < 3; i++){ const ax = xr + 40 + i*((wT*32 - 110)/2), ay = y + 60 + (i % 2)*40; v65eR(g, V65E_O, ax - 2, ay - 2, 34, 26); v65eR(g, '#c9ced8', ax, ay, 30, 22); v65eR(g, '#9aa3b0', ax + 4, ay + 4, 22, 14); for(let q = 0; q < 3; q++) v65eR(g, '#6b7280', ax + 6, ay + 6 + q*4, 18, 2); }
    if(k < 2){ const gy = y + seg; v65eR(g, V65E_O, xr + 10, gy - 2, wT*32 - 20, gap + 4); v65eR(g, '#9fe3f5', xr + 12, gy, wT*32 - 24, gap); for(let x = xr + 12; x < xr + wT*32 - 12; x += 26) v65eR(g, '#e9eef5', x, gy, 3, gap); v65eR(g, '#e9eef5', xr + 12, gy + gap/2 - 1, wT*32 - 24, 3); v65eR(g, 'rgba(255,255,255,.5)', xr + 16, gy + 4, 6, gap - 8); } }
  // bảng tên dọc trên mái khối giữa (gỗ NA, chữ Nunito)
  g.save(); g.translate(x0 + tw/2, y0 + seg + gap + seg*.45); g.rotate(-Math.PI/2); g.font = "900 46px Nunito, 'Be Vietnam Pro', sans-serif"; const s = '✈ SÂN BAY QUỐC TẾ RUBIK', w = g.measureText(s).width + 50;
  v65eR(g, V65E_O, -w/2 - 4, -38, w + 8, 76); v65eR(g, '#6b3a22', -w/2, -34, w, 68); v65eR(g, '#d4a52c', -w/2 + 4, 24, w - 8, 4); v65eR(g, 'rgba(255,255,255,.18)', -w/2, -34, w, 5);
  g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 2); g.restore();
  }); g.drawImage(S, x0 - 10, y0 - 10);
  g.textAlign = 'center'; g.textBaseline = 'middle';
}
function v65eAirHangar(g, h){
  const [x, y, w, hh] = h; v65eR(g, '#bcb6a8', x - 4, y - 4, w + 24, hh + 26); v65eR(g, 'rgba(0,0,0,.22)', x + 14, y + 16, w, hh);
  g.drawImage(v65eSpr('hangar' + h[4], w + 8, hh + 8, q => { q.translate(-x + 4, -y + 4); v65eAirHangar2(q, h); }), x - 4, y - 4);
}
function v65eAirHangar2(g, h){
  const [x, y, w, hh, n] = h, wT = Math.floor(w/32), rT = 5, xr = x + (w - wT*32)/2;
  v65eRoof(g, 0, xr, y, wT, rT, '#5d6b7a', .35); v65eWall(g, xr, y + rT*32, wT*32, hh - rT*32, 'stone');
  const dx = xr + 40, dw = wT*32 - 80, dy = y + rT*32 + 10, dh = hh - rT*32 - 10; v65eR(g, V65E_O, dx - 3, dy - 3, dw + 6, dh + 3); v65eR(g, '#8b99a8', dx, dy, dw, dh); for(let i = 0; i < dh; i += 10) v65eR(g, '#7d8b9a', dx, dy + i, dw, 4); v65eR(g, '#f2d24a', dx, dy + dh - 6, dw, 6);
  for(let i = 0; i < dw; i += 40) v65eR(g, V65E_O, dx + i, dy + dh - 6, 20, 6);
  g.font = "900 40px Nunito, sans-serif"; const tw = g.measureText(n).width + 40; v65eR(g, V65E_O, xr + wT*16 - tw/2 - 3, y + 60 - 3, tw + 6, 58); v65eR(g, '#6b3a22', xr + wT*16 - tw/2, y + 60, tw, 52); g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, xr + wT*16, y + 88);
}
function v65eAirTower(g, A){
  const [tx, ty] = A.tower; v65eR(g, 'rgba(0,0,0,.25)', tx - 30, ty - 20, 96, 84);
  g.drawImage(v65eSpr('airtower', 120, 330, q => { q.translate(-tx + 60, -ty + 266); v65eAirTower2(q, tx, ty); }), tx - 60, ty - 266);
}
function v65eAirTower2(g, tx, ty){
  v65eR(g, V65E_O, tx - 48, ty - 6, 96, 54); v65eR(g, '#d9d4c7', tx - 46, ty - 4, 92, 50); v65eR(g, '#bdb6a6', tx - 46, ty + 36, 92, 10); v65eDoor(g, tx - 14, ty + 14, 28, 32, {col:'#2f6fb5', col2:'#3d7bff'});
  v65eR(g, V65E_O, tx - 20, ty - 150, 40, 148); v65eR(g, '#ece6d8', tx - 18, ty - 148, 36, 146); v65eR(g, '#cfc6b4', tx + 8, ty - 148, 10, 146); for(let y = ty - 130; y < ty - 10; y += 30) v65eWin(g, tx - 7, y, 12, 16, {sill:false, plain:true});
  v65eR(g, V65E_O, tx - 46, ty - 196, 92, 50); v65eR(g, '#2b5f86', tx - 44, ty - 194, 88, 46); for(let i = 0; i < 4; i++) v65eR(g, '#8fd3ff', tx - 40 + i*21, ty - 188, 17, 30); v65eR(g, '#e8e4da', tx - 50, ty - 150, 100, 6);
  v65eRoof(g, 12, tx - 48, ty - 228, 3, 1, '#c0392b'); v65eR(g, V65E_O, tx - 2, ty - 252, 4, 28); v65eR(g, '#ef4b4b', tx - 4, ty - 258, 8, 8);
}
function v65eAirDeco(g, A){
  const tr = (x, y, k, v) => v65eTree(g, x, y, k, v);
  // hàng cây + đèn hai bên đường vào, bồn hoa quanh bãi đỗ xe
  const rd = A.road; for(let x = rd[0] + 60, i = 0; x < rd[2] - 40; x += 120, i++){ tr(x, rd[1] - rd[4]/2 - 12, i % 3 ? 'tree' : 'pine', i); if(i % 2 === 0) v65eLamp(g, x + 60, rd[1] + rd[4]/2 + 64); }
  const pk = A.park; v65eFlowers(g, pk[0] - 4, pk[3] + 10, pk[2] - pk[0] - 50, 24, 1); v65eFlowers(g, pk[0] - 34, pk[1], 24, pk[3] - pk[1], 2);
  for(let y = pk[1] + 30, i = 0; y < pk[3]; y += 90, i++) tr(pk[0] - 70, y + 50, 'tree', i);
  // biển chào bên đường vào
  v64sSign(g, rd[0] + 30, rd[1] - rd[4]/2 - 6, '✈ Sân bay Quốc tế Rubik');
  // bồn dầu kiểu NA (vỏ trắng sọc đỏ, thang)
  for(const p of A.tanks){ g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(p[0] + 10, p[1] + 10, 48, 0, 7); g.fill(); g.fillStyle = V65E_O; g.beginPath(); g.arc(p[0], p[1], 49, 0, 7); g.fill();
    g.fillStyle = '#eef0f3'; g.beginPath(); g.arc(p[0], p[1], 46, 0, 7); g.fill(); g.strokeStyle = '#e8453c'; g.lineWidth = 6; g.beginPath(); g.arc(p[0], p[1], 38, 0, 7); g.stroke(); g.fillStyle = '#c9ced8'; g.beginPath(); g.arc(p[0] + 4, p[1] + 4, 22, 0, 7); g.fill();
    v65eR(g, V65E_O, p[0] + 30, p[1] - 6, 22, 12); v65eR(g, '#9aa3b0', p[0] + 32, p[1] - 4, 18, 8); }
}
function v65eAirPaint(g, lo){
  const A = V57P.A; if(!A || lo) return;
  g.save(); g.imageSmoothingEnabled = false; g.lineCap = 'butt';
  try { v65eAirTerm(g, A); for(const h of A.hangars) v65eAirHangar(g, h); v65eAirTower(g, A); v65eAirDeco(g, A); } catch(e){ console.warn('v65e air', e); }
  g.restore(); g.textAlign = 'center'; g.textBaseline = 'middle';
}
function v65eAirInit(){
  if(typeof v57pPaint !== 'function') return;
  const p0 = v57pPaint; v57pPaint = function(g, lo){ p0(g, lo); if(V65E.ok) v65eAirPaint(g, lo); };
}
