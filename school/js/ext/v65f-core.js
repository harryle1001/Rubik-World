// ================= v65f · 1/2 NỘI THẤT NINJA ADVENTURE: ảnh tải lười, tường/sàn/khung phòng, đồ đạc kiểu NA =================
// Dùng lại v64sT/v64sP/v64sPat (ảnh NA CC0 đã tải sẵn trong V64S.img). Hai tileset nội thất mới chỉ tải khi lần đầu vào nhà.
// Mọi tên toàn cục có tiền tố v65f / V65F. Chỉ đổi hình: khung va chạm, cửa, đồ vật, NPC, thú cưng, kho báu giữ nguyên.
const V65F_SRC = {WS:'Backgrounds/Tilesets/Interior/TilesetWallSimple.png', IE:'Backgrounds/Tilesets/Interior/Elements.png'};
const V65F = {need:0, n:0, ok:false, pat:{}, hs:{}, hsOn:false, hsN:0, zs:false};
const V65F_O = '#2b1a10';   // viền đen-nâu kiểu NA
// sprite trong TilesetElement (E) / TilesetHouse (H): [sheet, sx, sy, sw, sh]
const V65F_S = {
  plant:['E', 0, 112, 16, 32], drawer:['E', 16, 112, 16, 32], cab:['E', 32, 112, 16, 32], books:['E', 48, 112, 16, 32], shelf:['E', 64, 112, 16, 32], stool:['E', 80, 112, 16, 24],
  dresser:['E', 96, 112, 32, 32], bookcase:['E', 128, 104, 32, 40], shelfW:['E', 160, 112, 32, 32], chair:['E', 0, 144, 16, 16], sdrawer:['E', 16, 144, 16, 16],
  pot:['E', 32, 144, 16, 16], curt:['E', 112, 144, 16, 16], curtL:['E', 136, 144, 32, 16], vase:['E', 0, 160, 16, 16], ltable:['E', 32, 160, 48, 16],
  pic:['E', 128, 160, 16, 16], apple:['E', 144, 160, 16, 16], cup:['E', 0, 176, 16, 16], candle:['E', 32, 0, 16, 16], jar:['E', 48, 0, 16, 16], barrel:['E', 16, 0, 16, 16],
  chest:['E', 48, 16, 16, 16], basket:['E', 32, 16, 16, 16], bowl:['E', 128, 16, 16, 16], paper:['E', 160, 16, 16, 16], bread:['E', 128, 32, 16, 16], crate:['E', 0, 0, 16, 16],
  winL:['H', 0, 48, 16, 16], winB:['H', 32, 48, 16, 16], winF:['H', 48, 48, 16, 16], hearth:['H', 320, 320, 32, 32], banner:['H', 352, 320, 16, 32]
};
function v65fLoad(){
  if(V65F.need || typeof V64S === 'undefined') return; const keys = Object.keys(V65F_SRC); V65F.need = keys.length;
  keys.forEach(k => { const im = new Image(); im.decoding = 'async';
    im.onload = () => { V64S.img[k] = im; v65fDone(); }; im.onerror = () => { console.warn('v65f: không tải được', V65F_SRC[k]); v65fDone(); };
    im.src = V64S_NA + V65F_SRC[k]; });
}
function v65fDone(){ if(++V65F.n < V65F.need) return; V65F.ok = !!V64S.img.WS; v65fFlush(); }
function v65fFlush(){ V65F.hs = {}; V65F.pat = {}; try { if(typeof V52WS !== 'undefined') V52WS.bg = null; } catch(e){} }
// sẵn sàng vẽ nội thất NA? (lần đầu gọi → bắt đầu tải lười, trong lúc chờ vẫn dùng đồ hoạ cũ)
function v65fReady(){ if(typeof V64S === 'undefined' || /[?&]nov65f/.test(location.search)) return false; if(!V65F.need) v65fLoad(); return V65F.ok && !!(V64S.img.FI && V64S.img.H && V64S.img.E); }
function v65fS(g, name, x, y, s, flip){ const q = V65F_S[name]; if(!q) return; s = s || 3;
  if(!flip){ v64sP(g, q[0], q[1], q[2], q[3], q[4], x, y, s); return; }
  g.save(); g.translate(x + q[3]*s, y); g.scale(-1, 1); v64sP(g, q[0], q[1], q[2], q[3], q[4], 0, 0, s); g.restore(); }
// sprite đặt theo đáy giữa (cx, đáy)
function v65fSB(g, name, cx, by, s){ const q = V65F_S[name]; if(q) v65fS(g, name, Math.round(cx - q[3]*s/2), Math.round(by - q[4]*s), s); }
// mẫu lát nền nhuộm màu (multiply) — giữ màu người chơi chọn mà vẫn có hoa văn NA
function v65fTPat(g, k, c, r, s, col){
  const key = k + c + '_' + r + '_' + s + col; let cv = V65F.pat[key];
  if(!cv){ const im = V64S.img[k]; if(!im) return col; cv = document.createElement('canvas'); cv.width = cv.height = 16*s; const q = cv.getContext('2d'); q.imageSmoothingEnabled = false;
    q.drawImage(im, c*16, r*16, 16, 16, 0, 0, 16*s, 16*s); q.globalCompositeOperation = 'multiply'; q.fillStyle = col; q.fillRect(0, 0, 16*s, 16*s);
    q.globalCompositeOperation = 'destination-in'; q.drawImage(im, c*16, r*16, 16, 16, 0, 0, 16*s, 16*s); V65F.pat[key] = cv; }
  return g.createPattern(cv, 'repeat');
}
// sàn: các loại gạch / gỗ NA
const V65F_FL = {wood:['H', 24, 13], brick:['FI', 1, 1], tile:['FI', 17, 2], orn:['FI', 21, 3], terra:['FI', 1, 7], cob:['FI', 1, 13], stone:['FI', 17, 13], parq:['FI', 14, 2], plain:['FI', 12, 1], jade:['FI', 12, 7]};
function v65fFloor(g, x, y, w, h, kind, s, tint){
  const f = V65F_FL[kind] || V65F_FL.wood; g.save(); g.translate(x, y);
  g.fillStyle = kind === 'wood' ? v65fWoodPat(g, s || 3, tint) : tint ? v65fTPat(g, f[0], f[1], f[2], s || 3, tint) : v64sPat(g, f[0], f[1], f[2], s || 3); g.fillRect(0, 0, w, h); g.restore();
}
// sàn ván gỗ kiểu NA: 2 hàng ván 8px, mạch tối, mép sáng, mắt gỗ; tô theo màu (màu người chơi chọn hoặc gỗ mặc định)
function v65fWoodPat(g, s, col){
  col = col || '#c98a4b'; s = Math.max(1, s - 1); const key = 'wood' + s + col; let cv = V65F.pat[key];
  if(!cv){ cv = document.createElement('canvas'); cv.width = 64*s; cv.height = 16*s; const q = cv.getContext('2d'), P = (c, x, y, w, h) => { q.fillStyle = c; q.fillRect(x*s, y*s, w*s, h*s); };
    P(col, 0, 0, 64, 16); [0, 8].forEach((ry, r) => { P(shade(col, .18), 0, ry, 64, 1); P(shade(col, -.34), 0, ry + 7, 64, 1);
      [5, 41].forEach(jx => { const x = (jx + r*22) % 64; P(shade(col, -.34), x, ry, 1, 8); P(shade(col, .1), x + 1, ry + 1, 1, 6); });
      P(shade(col, -.1), (12 + r*25) % 64, ry + 3, 7, 1); P(shade(col, -.1), (50 + r*9) % 64, ry + 4, 5, 1); P(shade(col, -.2), (28 + r*17) % 64, ry + 3, 2, 2); });
    V65F.pat[key] = cv; }
  return g.createPattern(cv, 'repeat');
}
// khung tường NA (TilesetWallSimple): v = 0 kem, 1 cam, 2 gạch nâu, 3 gạch xanh. gap = [x0, x1] chừa lối cửa ở cạnh dưới
function v65fFrame(g, x, y, wT, hT, v, s, gap, noTop){
  if(!V64S.img.WS) return; s = s || 2; const t = 16*s, c0 = (v % 2)*5, r0 = v > 1 ? 6 : 0, T = (c, r, px, py) => v64sT(g, 'WS', c0 + c, r0 + r, px, py, 1, 1, s);
  const inGap = px => gap && px + t > gap[0] && px < gap[1];
  for(let i = 1; i < wT - 1; i++){ const px = x + i*t; if(!noTop) T(i === 1 ? 1 : 3, 0, px, y); if(!inGap(px)) T(i === 1 ? 1 : 3, 4, px, y + (hT - 1)*t); }
  for(let j = 1; j < hT - 1; j++){ T(0, j === 1 ? 1 : 3, x, y + j*t); T(4, j === 1 ? 1 : 3, x + (wT - 1)*t, y + j*t); }
  if(!noTop){ T(0, 0, x, y); T(4, 0, x + (wT - 1)*t, y); } T(0, 4, x, y + (hT - 1)*t); T(4, 4, x + (wT - 1)*t, y + (hT - 1)*t);
  if(gap){ g.fillStyle = V65F_O; [gap[0], gap[1] - 6].forEach(px => g.fillRect(px, y + (hT - 1)*t, 6, t)); }
}
// mặt tường phía sau: vữa + ốp gỗ chân tường + phào, kiểu nhà NA
function v65fWall(g, x, y, w, h, o){
  o = o || {}; const base = o.base || '#ead9b8', woodH = Math.round(h*(o.wood == null ? .36 : o.wood));
  g.fillStyle = base; g.fillRect(x, y, w, h);
  if(o.tex){ const f = V65F_FL[o.tex]; g.save(); g.translate(x, y); g.globalAlpha = o.texA || .5; g.fillStyle = v65fTPat(g, f[0], f[1], f[2], 2, base); g.fillRect(0, 0, w, h - woodH); g.restore(); }
  if(o.stripe){ g.fillStyle = o.stripe; for(let sx = x + 12; sx < x + w; sx += 40) g.fillRect(sx, y, 14, h - woodH); }
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x, y, w, 6);
  if(woodH > 0){ const wy = y + h - woodH; g.save(); g.translate(x, wy); g.fillStyle = o.woodTint ? v65fTPat(g, 'H', 24, 13, 2, o.woodTint) : v64sPat(g, 'H', 24, 13, 2); g.fillRect(0, 0, w, woodH); g.restore();
    g.fillStyle = V65F_O; g.fillRect(x, wy - 4, w, 6); g.fillStyle = o.trim || '#c9844a'; g.fillRect(x, wy - 3, w, 3); }
  g.fillStyle = V65F_O; g.fillRect(x, y + h - 6, w, 6); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, y + h, w, 10);   // chân tường + bóng đổ xuống sàn
}
// cửa sổ NA phóng to: khung gỗ + kính trời + rèm đỏ
function v65fWin(g, x, y, w, h, o){
  o = o || {}; g.fillStyle = V65F_O; g.fillRect(x - 4, y - 4, w + 8, h + 8); g.fillStyle = o.frame || '#b9773e'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
  const sky = g.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, o.sky0 || '#8fd3f4'); sky.addColorStop(1, o.sky1 || '#d8f1fb'); g.fillStyle = sky; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 6, y + 6, 6, h - 12); g.fillRect(x + 16, y + 6, 3, h*.4);
  g.fillStyle = V65F_O; g.fillRect(x + w/2 - 3, y, 6, h); g.fillRect(x, y + h/2 - 3, w, 6); g.fillStyle = o.frame || '#b9773e'; g.fillRect(x + w/2 - 1, y, 2, h); g.fillRect(x, y + h/2 - 1, w, 2);
  g.fillStyle = V65F_O; g.fillRect(x - 10, y + h + 2, w + 20, 10); g.fillStyle = '#d99a5c'; g.fillRect(x - 8, y + h + 4, w + 16, 4);
  if(o.curt !== false){ const s = 3; for(let i = 0; i*16*s < w + 20; i++) v65fS(g, 'curt', x - 10 + Math.min(i*16*s, w + 20 - 16*s), y - 18, s); }
}
// thảm: viền tối + diềm màu + hoa văn chấm (vẽ 1 lần vào cache)
function v65fRug(g, x, y, w, h, col, edge, dot){
  g.fillStyle = V65F_O; g.fillRect(x - 3, y - 3, w + 6, h + 6); g.fillStyle = edge || '#e8c27a'; g.fillRect(x, y, w, h);
  g.fillStyle = col; g.fillRect(x + 8, y + 8, w - 16, h - 16); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 8, y + 8, w - 16, 3);
  g.fillStyle = dot || edge || '#e8c27a'; for(let yy = y + 20; yy < y + h - 14; yy += 18) for(let xx = x + 20 + ((yy - y)/18 % 2)*9; xx < x + w - 14; xx += 18) g.fillRect(xx, yy, 4, 4);
  g.fillStyle = edge || '#e8c27a'; for(let xx = x + 4; xx < x + w - 2; xx += 8){ g.fillRect(xx, y - 7, 3, 5); g.fillRect(xx, y + h + 2, 3, 5); }
}
// khối đồ gỗ chung: viền, mặt trên sáng, thân, chân tối
function v65fBox(g, x, y, w, h, col, topH){
  topH = topH == null ? Math.min(16, h*.35) : topH; g.fillStyle = V65F_O; g.fillRect(x - 2, y - 2, w + 4, h + 4);
  g.fillStyle = shade(col, -.18); g.fillRect(x, y, w, h); g.fillStyle = col; g.fillRect(x, y, w, topH); g.fillStyle = shade(col, .22); g.fillRect(x, y, w, 3);
  g.fillStyle = V65F_O; g.fillRect(x, y + topH, w, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + h - 4, w, 4);
}
function v65fShadow(g, x, y, w){ g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + w/2, y, w/2 + 6, 9, 0, 0, 7); g.fill(); }
function v65fLegs(g, x, y, w, h, col){ g.fillStyle = V65F_O; g.fillRect(x + 4, y, 8, h); g.fillRect(x + w - 12, y, 8, h); g.fillStyle = col; g.fillRect(x + 6, y, 4, h - 2); g.fillRect(x + w - 10, y, 4, h - 2); }
// bàn: mặt gỗ + khăn (tuỳ chọn) + ghế NA hai bên
function v65fTable(g, x, y, w, h, o){
  o = o || {}; v65fShadow(g, x, y + h + 4, w); v65fLegs(g, x + 4, y + h - 18, w - 8, 22, o.leg || '#8a5a35');
  v65fBox(g, x, y, w, h - 16, o.wood || '#c98a4b', h - 26);
  if(o.cloth){ g.fillStyle = o.cloth; g.fillRect(x + 10, y + 2, w - 20, h - 30); if(o.check) { g.fillStyle = o.check; for(let a = 0; a*16 < w - 20; a++) for(let b = 0; b*14 < h - 30; b++) if((a + b) % 2) g.fillRect(x + 10 + a*16, y + 2 + b*14, Math.min(16, w - 20 - a*16), Math.min(14, h - 30 - b*14)); }
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 10, y + h - 30, w - 20, 3); }
  if(o.chairs) for(let i = 0; i < o.chairs; i++){ const cx = x + (i + .5)*w/o.chairs - 24; v65fS(g, 'chair', cx, y + h - 22, 3); }
}
// sofa / ghế bành nệm
function v65fSofa(g, x, y, w, h, col){
  v65fShadow(g, x, y + h + 2, w); const O = V65F_O, d = shade(col, -.28), l = shade(col, .25);
  g.fillStyle = O; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = d; g.fillRect(x, y, w, h);
  g.fillStyle = col; g.fillRect(x + 4, y + 2, w - 8, h*.42); g.fillStyle = l; g.fillRect(x + 4, y + 2, w - 8, 4);   // tựa lưng
  const n = Math.max(2, Math.round((w - 40)/70)), cw = (w - 40)/n;
  for(let i = 0; i < n; i++){ const cx = x + 20 + i*cw; g.fillStyle = O; g.fillRect(cx, y + h*.42, cw, 2); g.fillRect(cx, y + h*.42, 2, h*.5); g.fillStyle = col; g.fillRect(cx + 2, y + h*.42 + 2, cw - 4, h*.4); g.fillStyle = l; g.fillRect(cx + 2, y + h*.42 + 2, cw - 4, 3); }
  [x, x + w - 20].forEach(ax => { g.fillStyle = O; g.fillRect(ax - 2, y + 4, 24, h - 4); g.fillStyle = col; g.fillRect(ax, y + 6, 20, h - 10); g.fillStyle = l; g.fillRect(ax, y + 6, 20, 4); });
  g.fillStyle = O; g.fillRect(x + 6, y + h, 6, 6); g.fillRect(x + w - 12, y + h, 6, 6);
}
function v65fPlaque(g, cx, y, text){   // nhãn tên đồ vật: bảng gỗ nhỏ, chữ Nunito 16px
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const w = Math.ceil(g.measureText(text).width) + 16;
  g.fillStyle = V65F_O; g.fillRect(cx - w/2 - 2, y - 2, w + 4, 24); g.fillStyle = '#fff6e0'; g.fillRect(cx - w/2, y, w, 20); g.fillStyle = '#e8c27a'; g.fillRect(cx - w/2, y + 17, w, 3);
  g.fillStyle = '#3e2723'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, y + 10); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
