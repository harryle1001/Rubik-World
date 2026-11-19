// ================= v65e · 1/4 CÔNG TRÌNH LỚN KIỂU NINJA ADVENTURE: lõi, bật/tắt, hàm vẽ dùng chung =================
// Đổi hình 7 công trình lớn (Thư viện, Học viện trí tuệ, Trường Tin học, Trạm cứu hỏa, Đồn cảnh sát, Tháp Rubik 81, Sân bay)
// sang tile Ninja Adventure (CC0) — dùng lại ảnh + hàm v64s (v64sT, v64sP, v64sPat, v64sNine, v64sHouse, v64sBoard, v64sSign…).
// CHỈ đổi hình: vị trí khu, cửa, va chạm, mini game, nút bấm giữ nguyên. Tắt bằng ?nov65e. Tên toàn cục tiền tố v65e / V65E.
const V65E_PHI = 1.618033988749895;
const V65E = {ok:false, se:'', spr:{}, tries:0, t0:0};
const V65E_O = '#2b1a10', V65E_O2 = '#1d1622';                                          // viền đậm kiểu NA
const V65E_RUBIK = ['#e8453c', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'];
const v65eDong = () => season === 'dong';
function v65eCv(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
// sprite cache theo mùa: build(g) vẽ vào canvas w×h; trả canvas (có thể gắn thêm thuộc tính neo ox/oy…)
function v65eSpr(key, w, h, build){
  const k = key + '|' + season; let c = V65E.spr[k]; if(c) return c;
  const [cv, g] = v65eCv(w, h); try { build(g, cv); } catch(e){ console.warn('v65e spr', key, e); } V65E.spr[k] = cv; return cv;
}
// ô chữ nhật có viền đậm
function v65eBox(g, col, x, y, w, h, o){ g.fillStyle = o || V65E_O; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, Math.round(w) + 4, Math.round(h) + 4); g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function v65eR(g, col, x, y, w, h){ g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
// mái ngói NA (cắt từ nhà mẫu v64sHouse), đổi màu bằng chế độ 'color' (giữ sáng tối của tile) + tuyết mùa đông
function v65eRoof(g, sty, x, y, wT, rT, tint, snowK){
  const w = wT*32, h = rT*32 + 8, [c, q] = v65eCv(w, h); v64sHouse(q, sty, 0, 0, wT, rT, 0, []);
  if(tint){ const [m, mq] = v65eCv(w, h); mq.drawImage(c, 0, 0); q.globalCompositeOperation = 'color'; q.fillStyle = tint; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'destination-in'; q.drawImage(m, 0, 0); q.globalCompositeOperation = 'source-over'; }
  if(v65eDong()){ q.globalCompositeOperation = 'source-atop'; q.fillStyle = 'rgba(255,255,255,.85)'; q.fillRect(0, 0, w, Math.round(h*(snowK || .45))); q.fillStyle = 'rgba(255,255,255,.45)'; q.fillRect(0, Math.round(h*(snowK || .45)), w, 6); q.globalCompositeOperation = 'source-over'; }
  g.drawImage(c, Math.round(x), Math.round(y)); return rT*32;
}
// tường: mẫu tile tường nhà NA (cột giữa hàng 2 của kiểu sty) hoặc màu trơn có vân gạch; viền đậm + chân tường đá
function v65eWall(g, x, y, w, h, kind){
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  v65eR(g, V65E_O, x - 2, y, w + 4, h + 2);
  if(typeof kind === 'number'){ g.fillStyle = v64sPat(g, 'H', kind + 2, 2, 2); g.save(); g.translate(x, y); g.fillRect(0, 0, w, h); g.restore(); }
  else { const P = {cream:['#f2e2c2', '#d8c29a'], stone:['#d9d4c7', '#b9b2a2'], brick:['#c8573f', '#9e3d2b'], blue:['#dfe7f2', '#b9c6d8'], white:['#f4f1ea', '#d6d0c2'], plum:['#e9dcef', '#c7b2d4']}[kind] || ['#f2e2c2', '#d8c29a'];
    v65eR(g, P[0], x, y, w, h); g.fillStyle = P[1]; for(let yy = y + 8; yy < y + h - 4; yy += 8){ const off = ((yy - y)/8) % 2 ? 10 : 0; g.fillRect(x, yy, w, 1); for(let xx = x + off; xx < x + w; xx += 20) g.fillRect(xx, yy - 7, 1, 7); } }
  v65eR(g, 'rgba(255,255,255,.22)', x, y, w, 3); v65eR(g, '#8c8478', x, y + h - 8, w, 8); v65eR(g, '#a9a193', x, y + h - 8, w, 2);
}
// cửa sổ NA: khung gỗ, kính xanh có vệt sáng, song chữ thập; arch = vòm trên
function v65eWin(g, x, y, w, h, o){
  o = o || {}; x = Math.round(x); y = Math.round(y); const fr = o.fr || '#8a5a35', gl = o.gl || '#7fc8e8', gl2 = o.gl2 || '#bfe8f8';
  v65eR(g, V65E_O, x - 2, y - 2, w + 4, h + 4); v65eR(g, fr, x, y, w, h); v65eR(g, gl, x + 2, y + 2, w - 4, h - 4);
  v65eR(g, gl2, x + 3, y + 3, Math.max(2, (w - 6)/3), 2); v65eR(g, gl2, x + 3, y + 3, 2, Math.max(2, (h - 6)/2));
  if(!o.plain){ v65eR(g, fr, x + w/2 - 1, y + 2, 2, h - 4); v65eR(g, fr, x + 2, y + h/2 - 1, w - 4, 2); }
  if(o.arch){ g.fillStyle = V65E_O; g.beginPath(); g.arc(x + w/2, y + 1, w/2 + 2, Math.PI, 0); g.fill(); g.fillStyle = fr; g.beginPath(); g.arc(x + w/2, y + 1, w/2, Math.PI, 0); g.fill(); g.fillStyle = gl; g.beginPath(); g.arc(x + w/2, y + 2, w/2 - 2, Math.PI, 0); g.fill(); }
  if(o.sill !== false) v65eR(g, '#d9cdb5', x - 3, y + h + 1, w + 6, 3);
  if(o.box && !v65eDong()){ v65eR(g, '#6b4a2a', x - 2, y + h + 3, w + 4, 6); for(let i = 0; i < w; i += 6){ v65eR(g, ['#ff6f91', '#ffd23f', '#ff8a2b'][(i/6) % 3], x + i, y + h + 1, 4, 4); v65eR(g, '#3f9a46', x + i + 1, y + h + 4, 3, 2); } }
}
// cửa gỗ đôi (viền, đinh tán, tay nắm), có vòm nếu arch
function v65eDoor(g, x, y, w, h, o){
  o = o || {}; x = Math.round(x); y = Math.round(y); const c = o.col || '#7a4a2a', c2 = o.col2 || '#9a6236';
  v65eR(g, V65E_O, x - 3, y - 3, w + 6, h + 3);
  if(o.arch){ g.fillStyle = V65E_O; g.beginPath(); g.arc(x + w/2, y, w/2 + 3, Math.PI, 0); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(x + w/2, y, w/2, Math.PI, 0); g.fill(); }
  v65eR(g, c, x, y, w, h); for(let i = 4; i < w; i += 8) v65eR(g, c2, x + i, y + 2, 3, h - 4);
  v65eR(g, V65E_O, x + w/2 - 1, y - (o.arch ? w/2 : 0), 2, h + (o.arch ? w/2 : 0)); v65eR(g, '#ffd23f', x + w/2 - 5, y + h/2, 3, 4); v65eR(g, '#ffd23f', x + w/2 + 2, y + h/2, 3, 4);
  if(o.glass){ v65eR(g, '#7fd8f0', x + 3, y + 3, w/2 - 5, h - 6); v65eR(g, '#6ccbe6', x + w/2 + 2, y + 3, w/2 - 5, h - 6); v65eR(g, 'rgba(255,255,255,.45)', x + 5, y + 5, 3, h - 12); }
}
// bậc thềm đá
function v65eSteps(g, cx, y, w, n){ for(let i = 0; i < n; i++){ const ww = w + i*12; v65eR(g, V65E_O, cx - ww/2 - 1, y + i*6 - 1, ww + 2, 8); v65eR(g, i % 2 ? '#cfc6b4' : '#e2dac8', cx - ww/2, y + i*6, ww, 6); v65eR(g, 'rgba(255,255,255,.4)', cx - ww/2, y + i*6, ww, 1); } }
// cỏ / lát nền / cây / bụi / hoa / đèn / ghế (theo mùa)
function v65eGrass(g, x, y, w, h){ g.save(); g.fillStyle = v64sPat(g, 'FL', 1, v65eDong() ? 13 : 4, 2); g.fillRect(x, y, w, h); g.restore(); }
function v65eBlockPat(g, k, c, r, w, h){   // mẫu lát từ khối w×h ô (hoa văn lớn liền mạch), phóng ×2
  const key = 'B' + k + c + '_' + r + '_' + w + 'x' + h; let cv = V64S.pat[key];
  if(!cv){ const im = V64S.img[k]; if(!im) return '#d9c49a'; cv = document.createElement('canvas'); cv.width = w*32; cv.height = h*32; const q = cv.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(im, c*16, r*16, w*16, h*16, 0, 0, w*32, h*32); V64S.pat[key] = cv; }
  return g.createPattern(cv, 'repeat');
}
function v65ePave(g, x, y, w, h, k){
  const T = {cob:['FI', 1, 13, 1, 1], orn:['FI', 15, 0, 4, 4], brick:['FI', 5, 8, 1, 1], slab:['FI', 20, 2, 2, 2], dark:['FI', 13, 13, 1, 1], grey:['FI', 20, 8, 2, 2]}[k || 'cob'];
  g.fillStyle = T[3] > 1 ? v65eBlockPat(g, T[0], T[1], T[2], T[3], T[4]) : v64sPat(g, T[0], T[1], T[2], 2); g.fillRect(x, y, w, h); if(v65eDong()){ g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, w, h); } }
function v65eTree(g, x, y, kind, v){
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, kind === 'old' ? 52 : 24, kind === 'old' ? 16 : 8, 0, 0, 7); g.fill();
  if(kind === 'old') g.drawImage(v64sTreeSpr('old'), x - 72, y - 138); else if(kind === 'pine') g.drawImage(v64sTreeSpr('pine', v || 0), x - 33, y - 96); else g.drawImage(v64sTreeSpr('tree', v || 0), x - 32, y - 60);
}
function v65eBush(g, x, y, v){ if(v65eDong()) v64sT(g, 'N', 1, 12, x - 16, y - 26, 1, 1, 2); else { v64sT(g, 'N', (v || 0) % 2, 10, x - 16, y - 28, 1, 1, 2); if((v || 0) % 3 === 0 && season !== 'thu') v64sT(g, 'N', [0, 3, 6][(v || 0) % 3], 11, x - 2, y - 22, 1, 1, 1); } }
function v65eFlowers(g, x, y, w, h, v){   // bồn hoa NA: viền gỗ, đất, hoa xen kẽ
  x = Math.round(x); y = Math.round(y); v65eR(g, V65E_O, x - 2, y - 2, w + 4, h + 4); v65eR(g, '#8a5a35', x, y, w, h); v65eR(g, v65eDong() ? '#f2f6f8' : '#5b3b26', x + 3, y + 3, w - 6, h - 6);
  if(v65eDong()) return; const fl = [[0, 11], [3, 11], [6, 11], [1, 11]]; let k = v || 0;
  for(let yy = y + 2; yy < y + h - 14; yy += 16) for(let xx = x + 2; xx < x + w - 14; xx += 16){ const f = fl[(k++) % 4]; v64sT(g, 'N', f[0], f[1], xx, yy, 1, 1, 1); }
}
function v65eHedge(g, x0, y0, x1, y1, gx, gw){   // hàng rào cây xén (bụi NA) quanh khung; chừa lối ở x = gx (rộng ±gw) hàng trên + dưới
  const step = 26, put = (x, y) => v65eBush(g, x, y + 22, 1), gap = x => gx != null && Math.abs(x - gx) < gw;
  for(let x = x0; x <= x1; x += step){ if(gap(x)) continue; put(x, y0); put(x, y1); } for(let y = y0 + step; y < y1; y += step){ put(x0, y); put(x1, y); }
}
function v65eLamp(g, x, y){ g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 8, y - 2, 16, 5); g.drawImage(v64sLampSpr(), x - 12, y - 60); }
function v65eBench(g, x, y){ g.drawImage(v64sBenchSpr(), x - 36, y - 26); }
function v65ePot(g, x, y){ v64sT(g, 'E', 0, 8, x - 16, y - 32, 1, 1, 2); if(v65eDong()) v65eR(g, '#ffffff', x - 8, y - 30, 16, 4); }
// cột cờ nhỏ (vẽ tĩnh) — cờ bay thật vẽ ở lớp động
function v65eFlagPole(g, x, y, h){ v65eR(g, V65E_O, x - 2, y - h, 4, h); v65eR(g, '#d9d2c5', x - 1, y - h, 2, h); v65eR(g, '#ffd23f', x - 3, y - h - 4, 6, 5); }
function v65eFlag(x, y, col, t, ph){ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); for(let i = 0; i <= 6; i++) ctx.lineTo(x + i*5, y + Math.sin(t*5 + i*.8 + (ph || 0))*2.5); for(let i = 6; i >= 0; i--) ctx.lineTo(x + i*5, y + 12 + Math.sin(t*5 + i*.8 + (ph || 0))*2.5); ctx.fill(); }
// khối Rubik 3×3 pixel
function v65eCube(g, x, y, s, rot){ v65eR(g, V65E_O, x - 2, y - 2, s*3 + 4, s*3 + 4); for(let i = 0; i < 9; i++) v65eR(g, V65E_RUBIK[(i*(rot || 4) + 1) % 6], x + (i % 3)*s, y + Math.floor(i/3)*s, s - 1, s - 1); }
// bảng chữ khắc trên toà nhà (gỗ đậm, chữ Nunito ≥16px)
function v65ePlaque(g, cx, y, text, col, size){
  g.font = `900 ${size || 18}px Nunito, 'Be Vietnam Pro', sans-serif`; const w = Math.ceil(g.measureText(text).width) + 26, h = (size || 18) + 12;
  v65eR(g, V65E_O, cx - w/2 - 2, y - 2, w + 4, h + 4); v65eR(g, col || '#6b3a22', cx - w/2, y, w, h); v65eR(g, 'rgba(255,255,255,.18)', cx - w/2, y, w, 3); v65eR(g, '#d4a52c', cx - w/2 + 3, y + h - 4, w - 6, 2);
  g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, y + h/2 + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; return w;
}
// nhân vật NA đứng/ngồi tại chỗ (lớp động), cầm sách
function v65eKid(x, y, name, face, book, t){
  const im = v64sChar(name); if(!im) return; const bob = Math.sin((t || 0)*2 + x)*0.5;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x - 9, y - 3, 18, 4); ctx.drawImage(im, (face || 0)*16, 0, 16, 16, Math.round(x - 16), Math.round(y - 31 + bob), 32, 32);
  if(book){ ctx.fillStyle = V65E_O; ctx.fillRect(Math.round(x - 7), Math.round(y - 15), 14, 9); ctx.fillStyle = book; ctx.fillRect(Math.round(x - 6), Math.round(y - 14), 6, 7); ctx.fillStyle = '#fff8e1'; ctx.fillRect(Math.round(x), Math.round(y - 14), 6, 7); }
}

// ---------- bật: chờ ảnh NA tải xong (v64sLoad chạy lúc nạp file) rồi vẽ lại mọi cache liên quan ----------
function v65eReady(){ return !/[?&]nov65e/.test(location.search) && typeof V64S !== 'undefined' && !!V64S.loaded && ['H', 'N', 'FL', 'FI', 'E'].every(k => V64S.img[k]); }
function v65eFlush(){
  V65E.spr = {}; V65E.se = season;
  try { if(typeof V47W !== 'undefined' && V47W.pc){ delete V47W.pc.library; delete V47W.pc.academy; } } catch(e){}
  try { delete V46ZC.library; delete V46ZC.academy; } catch(e){}
  try { V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; } catch(e){}
  try { if(typeof V51T !== 'undefined') V51T.spr = {}; } catch(e){}
  try { if(typeof V53C !== 'undefined') V53C.spr = {}; } catch(e){}
  try { if(typeof V57P !== 'undefined'){ V57P.tiles.clear(); V57P.lo = null; } } catch(e){}
}
function v65eStart(){
  if(V65E.ok) return; V65E.ok = true;
  try { const i = SOFT_ZONES.indexOf('academy'); if(i >= 0) SOFT_ZONES.splice(i, 1); } catch(e){}   // bỏ góc bo cỏ cũ phủ lên Học viện mới
  v65eFlush();
}
function v65eInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return;
  try { v65eLibInit(); } catch(e){ console.warn('v65e lib', e); }
  try { v65eCivicInit(); } catch(e){ console.warn('v65e civic', e); }
  try { v65eAirInit(); } catch(e){ console.warn('v65e air', e); }
  // đổi mùa → vẽ lại sprite mới (cache theo mùa); ảnh chưa tải → thử lại mỗi 0,3 s (tối đa ~60 s)
  const tick = () => { if(V65E.ok){ if(V65E.se !== season){ V65E.se = season; try { V57P.tiles.clear(); V57P.lo = null; } catch(e){} } return; }
    if(v65eReady()) v65eStart(); else if(++V65E.tries < 200) setTimeout(tick, 300); };
  tick(); setInterval(() => { if(V65E.ok && V65E.se !== season) tick(); }, 1000);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v65e = {V65E, v65eFlush};
}
