// ================= v64s · 3/5 TOÀ NHÀ & CỔNG TRƯỜNG: ghép tile nhà Ninja Adventure kiểu 9 mảnh, vẽ sprite riêng (cache) =================
// Nhà NA mẫu 4×3 ô: 2 hàng mái + 1 hàng tường. Cắt mái thành trái/giữa/phải × trên/giữa/dưới rồi lặp phần giữa → nhà dài, mái sâu tuỳ ý.
function v64sHouse(g, sty, x, y, wT, rT, wlT, doors){
  const bx = sty*16, P = (sx, sy, sw, sh, dx, dy, dw, dh) => v64sP(g, 'H', bx + sx, sy, sw, sh, dx, dy, 2, dw, dh);
  const Wpx = wT*32, Hs = rT*16, nMid = Math.max(0, Math.round((Hs - 24)/8)), mCols = Math.max(0, wT - 3);
  const rows = [[0, 12]]; for(let i = 0; i < nMid; i++) rows.push([12, 8]); rows.push([20, 12]);
  let yy = y; rows.forEach(([sy, sh]) => { P(0, sy, 24, sh, x, yy); for(let i = 0; i < mCols; i++) P(24, sy, 16, sh, x + 48 + i*32, yy); P(40, sy, 24, sh, x + Wpx - 48, yy); yy += sh*2; });
  for(let r = 0; r < wlT; r++){ const low = r === wlT - 1;
    P(0, 32, 16, 16, x, yy); for(let i = 1; i < wT - 1; i++) P(low && doors.includes(i) ? 16 : 32, 32, 16, 16, x + i*32, yy); P(48, 32, 16, 16, x + Wpx - 32, yy); yy += 32; }
  return {roofY:y, wallY:y + rows.reduce((s, q) => s + q[1]*2, 0), h:yy - y};
}
function v64sBoard(g, cx, y, text, big){
  g.font = `800 ${big ? 19 : 16}px Nunito, 'Be Vietnam Pro', sans-serif`; const w = Math.ceil(g.measureText(text).width) + 22, h = big ? 30 : 26;
  g.fillStyle = '#2b1a10'; g.fillRect(cx - w/2 - 2, y - 2, w + 4, h + 4); g.fillStyle = big ? '#8c2f2f' : '#b97a45'; g.fillRect(cx - w/2, y, w, h); g.fillStyle = big ? '#b34545' : '#d99a5c'; g.fillRect(cx - w/2, y, w, 4);
  g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, y + h/2 + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
// sprite một công trình: canvas mật độ k (nét trên màn hình điện thoại), toạ độ thế giới (x0, y0 - top)
function v64sBuildSpr(it){
  const key = it.k + '|' + season; let c = V64S.spr['B' + it.k]; if(c && c.key === key) return c;
  const r = it.r, f = it.f, b = f.b || {}, w = r.x1 - r.x0, top = b.shed ? 10 : 34, h = r.y1 - r.y0 + top + 8, k = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w*k); cv.height = Math.ceil(h*k); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(k, k);
  const wT = Math.round(w/32), cx = w/2;
  try {
    if(b.shed){   // nhà xe: mái đỏ trên cột gỗ, xe đạp xếp hàng
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(6, top + 52, w - 12, 10);
      const prev = ctx; ctx = g; try { for(let i = 0; i < 7; i++) drawBike(26 + i*(w - 52)/6, top + 82, ['#ef4b4b', '#3d7bff', '#2fbf71', '#ffd23f', '#ff8a2b', '#b06bff', '#26c6da'][i], true); } finally { ctx = prev; }
      g.fillStyle = '#2b1a10'; [8, w/2 - 4, w - 16].forEach(px => g.fillRect(px, top + 30, 8, 58)); g.fillStyle = '#8a5a35'; [10, w/2 - 2, w - 14].forEach(px => g.fillRect(px, top + 30, 4, 56));
      v64sHouse(g, 12, 0, top - 10, wT, 2, 0, []);
      if(v64sDong()) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, top - 10, w, 30); g.globalCompositeOperation = 'source-over'; }
      v64sBoard(g, cx, top + 4, f.ic + ' ' + f.n);
    } else {
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(8, h - 12, w - 10, 10);
      const doors = {lib:[Math.floor(wT/2) - 1, Math.floor(wT/2)], tea:[3], med:[2], can:[2, wT - 3]}[it.k] || [Math.floor(wT/2)];
      const H = v64sHouse(g, b.sty || 0, 0, top, wT, b.roof || 3, b.wall || 1, doors);
      if(v64sDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.82)'; g.fillRect(0, top, w, (H.wallY - top)*.55); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, top + (H.wallY - top)*.55, w, 6); g.globalCompositeOperation = 'source-over'; }
      if(it.k === 'can'){ for(let i = 0; i < w - 8; i += 16){ g.fillStyle = (i/16) % 2 ? '#fff4e0' : '#e0473f'; g.fillRect(4 + i, H.wallY - 6, 16, 12); } g.fillStyle = '#2b1a10'; g.fillRect(4, H.wallY + 6, w - 8, 2); }
      if(it.k === 'med'){ const y = top + 18; g.fillStyle = '#2b1a10'; g.beginPath(); g.arc(cx, y, 15, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, y, 13, 0, 7); g.fill(); g.fillStyle = '#e53935'; g.fillRect(cx - 3, y - 9, 6, 18); g.fillRect(cx - 9, y - 3, 18, 6); }
      if(it.k === 'lib'){ for(let i = 0; i < 3; i++){ g.fillStyle = ['#ef4b4b', '#3d7bff', '#2fbf71'][i]; g.fillRect(cx - 18 + i*12, top + 12, 9, 14); g.fillStyle = '#2b1a10'; g.fillRect(cx - 18 + i*12, top + 12, 9, 2); } }
      v64sBoard(g, cx, H.wallY - (b.wall > 1 ? 40 : 34), f.ic + ' ' + f.n);
    }
  } catch(e){ console.warn('v64s build', it.k, e); }
  c = V64S.spr['B' + it.k] = {cv, key, x:r.x0, y:r.y0 - top, w, h}; return c;
}
// cổng trường: hai cột đá + mái ngói đỏ + bảng tên (tỷ lệ vàng: cao cột = rộng nhịp / φ)
function v64sGateSpr(){
  const key = 'gate|' + season; let c = V64S.spr.gate; if(c && c.key === key) return c;
  const G = V64S.gate, w = 340, h = 190, k = Math.min(2, Math.max(1, window.devicePixelRatio || 1)), cv = document.createElement('canvas'); cv.width = w*k; cv.height = h*k;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(k, k);
  try {
    const cx = w/2, base = h - 4, ph = Math.round(240/V64S_PHI);
    [cx - 120, cx + 120].forEach(px => { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(px - 26, base - 4, 52, 8); g.fillStyle = '#2b2430'; g.fillRect(px - 22, base - ph - 6, 44, ph + 6);
      g.fillStyle = '#d8cdb6'; g.fillRect(px - 20, base - ph - 4, 40, ph + 2); g.fillStyle = 'rgba(90,70,50,.22)'; for(let y = base - ph + 10; y < base; y += 14) g.fillRect(px - 20, y, 40, 2); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px - 20, base - ph - 4, 5, ph + 2);
      g.fillStyle = '#2b2430'; g.fillRect(px - 26, base - ph - 14, 52, 12); g.fillStyle = '#ebe2cf'; g.fillRect(px - 24, base - ph - 12, 48, 8);
      g.fillStyle = '#2b2430'; g.fillRect(px - 9, base - ph + 28, 18, 26); g.fillStyle = '#ffd27a'; g.fillRect(px - 7, base - ph + 30, 14, 22); });
    v64sHouse(g, 12, 6, base - ph - 76, 10, 2, 0, []);
    if(v64sDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, base - ph - 76, w, 26); g.globalCompositeOperation = 'source-over'; }
    v64sBoard(g, cx, base - ph - 40, 'TRƯỜNG RUBIK HÀ QUÂN', true);
    for(let i = 0; i < 9; i++){ g.fillStyle = V48C_RUBIK ? V48C_RUBIK[i % 6] : '#ffd23f'; g.fillRect(cx - 15 + (i % 3)*10, base - ph - 98 + Math.floor(i/3)*10, 9, 9); }
    g.fillStyle = '#2b2430'; g.strokeStyle = '#2b2430'; g.lineWidth = 2; g.strokeRect(cx - 16, base - ph - 99, 31, 31);
  } catch(e){ console.warn('v64s gate', e); }
  c = V64S.spr.gate = {cv, key, x:G[0] - w/2, y:G[1] - h + 4, w, h}; return c;
}
function v64sSprs(){ const L = V64S.fac.filter(it => it.f.b).map(v64sBuildSpr); if(V64S.gate) L.push(v64sGateSpr()); return L; }
// lớp vẽ trên đảo (sau người đi đường, trước lâu đài/thầy cô/ánh sáng): toà nhà + vẽ lại người đứng trước nhà
function v64sWorld(VBn){
  if(!V64S.ok || cam.z < .2) return; const L = v64sSprs(), seen = [];
  for(const c of L){ if(c.x + c.w < VBn.x0 || c.x > VBn.x1 || c.y + c.h < VBn.y0 || c.y > VBn.y1) continue; ctx.drawImage(c.cv, c.x, c.y, c.w, c.h); seen.push(c); }
  if(!seen.length) return;
  for(const a of agents){ if(!a.visible || a.inSub || !v46Raw(a.x)) continue; const p = v46Pos(a);
    for(const c of seen){ const base = c.y + c.h - 10; if(p[1] > base - 4 && p[1] < base + 48 && p[0] > c.x - 20 && p[0] < c.x + c.w + 20){ try { v46DrawRaw(a); } catch(e){} break; } } }
  // ao: gợn nước + cá nhảy (rẻ)
  const pd = V64S.F.pond; if(pd && !v64sDong() && cam.z > .5 && v64sOv(pd.r, VBn, 0)){ const r = pd.r; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for(let i = 0; i < 3; i++){ const t = (realT*.6 + i/3) % 1, x = r.x0 + 70 + i*70, y = r.y0 + 70 + (i % 2)*40; ctx.globalAlpha = 1 - t; ctx.beginPath(); ctx.ellipse(x, y, 6 + t*22, 3 + t*8, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1;
    const ft = (realT*.35) % 1; if(ft < .18){ const u = ft/.18, x = r.x0 + 150 + Math.sin(realT)*40, y = r.y0 + 100 - Math.sin(u*Math.PI)*26; ctx.fillStyle = '#ff8a3d'; ctx.fillRect(x - 6, y - 3, 12, 6); ctx.fillRect(x + 5, y - 5, 4, 10); } }
}
// chạm vào công trình → hành động (thư viện mở sách, ao câu cá, vườn…)
const V64S_ACT = {
  lib:() => { if(typeof openLibrary === 'function') openLibrary(); },
  tea:() => toast('🧑‍🏫 Phòng giáo viên: 10 thầy cô đang đi dạy quanh trường. Chạm vào thầy cô để hỏi bài nhé!'),
  med:() => toast('🩺 Cô y tá: Em khoẻ lắm! Nhớ uống đủ nước và ngủ đủ giấc nhé 💧'),
  can:() => toast('🍱 Căn tin: giờ ăn trưa mở trong Hội trường lớn. Hôm nay có cơm gà, canh rau và sữa!'),
  bike:() => toast('🚲 Nhà xe đạp: dựng xe ngay ngắn, khoá xe cẩn thận nhé!'),
  bball:() => toast('🏀 Sân bóng rổ: giờ ra chơi rủ bạn ra ném bóng — mỗi quả vào rổ được 2 điểm!'),
  pond:() => { if(typeof openFishing === 'function') openFishing(); },
  veg:() => { if(typeof openGarden === 'function') openGarden(); },
  gard:() => { if(typeof openGarden === 'function') openGarden(); },
  play:() => toast('🛝 Khu vui chơi: cầu trượt, xích đu, bập bênh — chơi nhẹ nhàng, nhường bạn nhỏ nhé!'),
  park:() => toast('🅿️ Bãi đỗ xe của thầy cô và phụ huynh.'),
  court:() => toast('🧱 Sân trường: chào cờ sáng thứ Hai, điểm danh ở bảng màu giữa sân.')
};
function v64sTapAt(wx, wy){
  if(!V64S.ok) return null; let best = null;
  for(const it of V64S.fac){ if(it.k === 'court') continue; const r = it.r, top = it.f.b ? 34 : 0; if(wx > r.x0 && wx < r.x1 && wy > r.y0 - top && wy < r.y1){ best = it; break; } }
  return best;
}
function v64sBuildInit(){
  const w0 = v47wWorld; v47wWorld = function(VBn){ try { v64sWorld(VBn); } catch(e){ console.warn('v64s world', e); } w0(VBn); };
  const ob0 = v46OverviewBuildings; v46OverviewBuildings = function(g){ ob0(g); if(!V64S.ok) return; try { v64sSprs().forEach(c => g.drawImage(c.cv, c.x, c.y, c.w, c.h)); } catch(e){} };
  // đèn ấm trước cửa toà nhà khi tối
  const vc = v25Collect; v25Collect = function(dk){ vc(dk); if(!V64S.ok || !V46.on || V46.sky) return; const on = v25Ramp(clock, 1080, 330); if(on <= 0) return;
    V46.raw = true; try { V64S.fac.forEach(it => { if(it.f.b && !it.f.b.shed) v25Push((it.r.x0 + it.r.x1)/2, it.r.y1 - 16, 90, on*.9, 2); }); if(V64S.gate){ v25Push(V64S.gate[0] - 120, V64S.gate[1] - 70, 60, on, 2); v25Push(V64S.gate[0] + 120, V64S.gate[1] - 70, 60, on, 2); } } catch(e){} finally { V46.raw = false; } };
  const st = document.getElementById('stage') || document.body; let dn = null;
  st.addEventListener('pointerdown', e => { dn = [e.clientX, e.clientY, performance.now()]; }, true);
  st.addEventListener('pointerup', e => {
    if(!V64S.ok || typeof cvs === 'undefined' || e.target !== cvs || !dn || openModal) return;
    if(Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) > 12 || performance.now() - dn[2] > 450) return;
    if(!V46.on || V46.sky || !PLAYER || !PLAYER.visible) return;
    const rc = cvs.getBoundingClientRect(), wx = cam.x + (e.clientX - rc.left - cw/2)/cam.z, wy = cam.y + (e.clientY - rc.top - ch/2)/cam.z, it = v64sTapAt(wx, wy); if(!it) return;
    const p = v46Pos(PLAYER), d = Math.hypot(p[0] - (it.r.x0 + it.r.x1)/2, p[1] - it.r.y1);
    if(d > 360){ toast(it.f.ic + ' ' + it.f.n + ' — đi lại gần rồi chạm để vào nhé!'); return; }
    try { (V64S_ACT[it.k] || (() => toast(it.f.ic + ' ' + it.f.n)))(); } catch(err){ console.warn('v64s act', err); }
  }, true);
}
