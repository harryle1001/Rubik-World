// ================= v65a · 3/3 SÂN NGOÀI: Tượng đài Rubik, Quảng trường cờ khổng lồ, Sân Rubik, lối vào các lớp =================
// Ảnh nền của 3 khu (v45BuildPark / v45BuildBoard / v45BuildYard) dựng lại bằng tile NA → vẫn được nướng sẵn vào nền như cũ (không tốn khung hình).
// Hàng rào cam cũ (v20Soft) của các khu này → hàng bụi cây NA (sprite cache). Lối vào cửa lớp: thềm đá + bụi hoa, vẽ vào ô nền nướng sẵn.
const V65A_PHI = 1.618033988749895;
function v65aGrass(g, x, y, w, h, seed){
  const dong = v64sDong(); g.fillStyle = v64sPat(g, 'FL', 1, dong ? 13 : 4, 2); g.fillRect(x, y, w, h);
  for(let j = 0; j*48 < h; j++) for(let i = 0; i*48 < w; i++){ const hh = v64sHash(i*7919 + j*104729 + (seed || 0)) % 97, px = x + i*48 + (hh % 5)*6, py = y + j*48 + (hh % 7)*5;
    if(hh < 10) v64sT(g, 'FD', hh % 4, dong ? 3 : 2, px, py, 1, 1, 2);
    else if(hh < 13 && !dong) v64sT(g, 'FD', v64sThu() ? hh % 2 : v64sXuan() ? 3 : 4 + hh % 2, v64sThu() || v64sXuan() ? 0 : 2, px, py, 1, 1, 2); }
}
function v65aPave(g, k, c, r, path, edge){   // tô 1 hình bằng mẫu lát + viền nâu NA
  path(); g.fillStyle = edge || '#4a3428'; g.fill(); g.save(); g.translate(0, 0); path(4); g.fillStyle = v64sPat(g, k, c, r, 2); g.fill();
  if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.38)'; g.fill(); } g.restore();
}
const v65aRR = (g, x, y, w, h, rr) => { g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, rr); else g.rect(x, y, w, h); };

// ---------- Tượng đài Rubik (360×500): nền cỏ NA, vòng đá tỷ lệ vàng, lối cuội, bồn hoa, hàng bụi sau tượng ----------
function v65aBuildPark(r){
  const G = v45ParkGeo(r), c = v45Off(r.w, r.h), dong = v64sDong();
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(-r.x, -r.y);
  v65aGrass(g, r.x, r.y, r.w, r.h, 11);
  // lối cuội về phía trường (nam) — rộng R3·1.2 như cũ
  const pw = Math.round(G.R3*1.2/32)*32 || 64; v65aPave(g, 'FI', 1, 13, (i = 0) => { g.beginPath(); g.rect(G.cx - pw/2 - 4 + i, G.base, pw + 8 - 2*i, r.y + r.h - G.base); });
  // 3 vòng elip (R1 → R2 → R3 = mỗi vòng 1/φ vòng trước), dẹt 1/φ
  const ell = R0 => i => { g.beginPath(); g.ellipse(G.cx, G.base - 8, R0 - (i || 0), (R0 - (i || 0))/V65A_PHI, 0, 0, 7); };
  v65aPave(g, 'FI', 17, 1, ell(G.R1 + 6));
  g.strokeStyle = 'rgba(74,52,40,.35)'; g.lineWidth = 2; for(let i = 0; i < 16; i++){ const a = i/16*Math.PI*2; g.beginPath(); g.moveTo(G.cx + Math.cos(a)*G.R2, G.base - 8 + Math.sin(a)*G.R2/V65A_PHI); g.lineTo(G.cx + Math.cos(a)*(G.R1 + 2), G.base - 8 + Math.sin(a)*(G.R1 + 2)/V65A_PHI); g.stroke(); }
  v65aPave(g, 'FI', 1, 13, ell(G.R2 + 4)); v65aPave(g, 'FI', 5, 8, ell(G.R3));
  // 4 bồn hoa góc: khối cỏ đậm NA 3×2 ô + hoa theo mùa
  const bed = (x, y, i) => { v64sNine(g, 'FL', 0, dong ? 12 : 6, x, y, 3, 2); if(dong || v64sThu()) return; const F = [[0, 11], [3, 11], [6, 11], [1, 11]]; for(let k = 0; k < 6; k++){ const f = F[(i + k) % 4]; v64sT(g, 'N', f[0], f[1], x + 6 + (k % 3)*28, y + 4 + Math.floor(k/3)*28, 1, 1, 1.5); } };
  bed(r.x + 10, r.y + 10, 0); bed(r.x + r.w - 106, r.y + 10, 1); bed(r.x + 10, r.y + r.h - 74, 2); bed(r.x + r.w - 106, r.y + r.h - 74, 3);
  // hàng bụi NA vòng sau tượng (cung 1.12π → 1.88π)
  for(let a = Math.PI*1.1; a <= Math.PI*1.9 + .01; a += .085){ const x = G.cx + Math.cos(a)*(G.R1 - 4), y = G.base - 8 + Math.sin(a)*(G.R1 - 4)/V65A_PHI;
    if(dong) v64sT(g, 'N', 5, 12, x - 16, y - 24, 1, 1, 2); else v64sT(g, 'N', Math.round(a*10) % 2, 10, x - 16, y - 26, 1, 1, 2); }
  // ghế đá hai bên vòng, đèn NA hai bên lối cuội
  [-1, 1].forEach(sd => { g.drawImage(v64sBenchSpr(), G.cx + sd*(G.R1 - 30) - 36, G.base + 8); g.drawImage(v64sLampSpr(), G.cx + sd*(pw/2 + 24) - 12, r.y + r.h - 130); });
  v64sBoard(g, G.cx, r.y + r.h - 44, '🧊 Tượng đài Rubik');
  return c;
}
// ---------- Bàn cờ khổng lồ (560×500): sân đá NA, khung gỗ viền đen, chữ toạ độ 16px, góc trái có cây + ghế khán giả ----------
function v65aBuildBoard(r){
  const G = v45BoardGeo(r), m = 30, c = v45Off(r.w, r.h), dong = v64sDong();
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(-r.x, -r.y);
  v65aGrass(g, r.x, r.y, r.w, r.h, 23);
  const tx = G.x - m - 18, ty = G.y - m - 18, tw = G.bw + 2*m + 36, th = G.bw + 2*m + 50;
  v65aPave(g, 'FI', 17, 1, (i = 0) => v65aRR(g, tx + i, ty + i, tw - 2*i, th - 2*i, 18 - i));
  // khung gỗ
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(G.x - m + 6, G.y - m + 10, G.bw + 2*m, G.bw + 2*m);
  g.fillStyle = '#2b1a10'; g.fillRect(G.x - m - 2, G.y - m - 2, G.bw + 2*m + 4, G.bw + 2*m + 4);
  g.fillStyle = '#8a5a35'; g.fillRect(G.x - m, G.y - m, G.bw + 2*m, G.bw + 2*m); g.fillStyle = '#b97a45'; g.fillRect(G.x - m + 4, G.y - m + 4, G.bw + 2*m - 8, G.bw + 2*m - 8);
  g.fillStyle = '#d99a5c'; g.fillRect(G.x - m + 4, G.y - m + 4, G.bw + 2*m - 8, 4); g.fillStyle = '#6b4226'; g.fillRect(G.x - m + 4, G.y + G.bw + m - 8, G.bw + 2*m - 8, 4);
  g.fillStyle = '#2b1a10'; g.fillRect(G.x - 6, G.y - 6, G.bw + 12, G.bw + 12); g.fillStyle = '#e8c27a'; g.fillRect(G.x - 4, G.y - 4, G.bw + 8, G.bw + 8);
  for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++){ const d = (i + j) % 2; g.fillStyle = d ? '#b07a4a' : '#f0d9b5'; g.fillRect(G.x + i*G.s, G.y + j*G.s, G.s, G.s);
    g.fillStyle = d ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.35)'; g.fillRect(G.x + i*G.s, G.y + j*G.s, G.s, 3); }
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for(let i = 0; i < 8; i++){ g.fillText('abcdefgh'[i], G.x + i*G.s + G.s/2, G.y + G.bw + m/2 + 1); g.fillText(String(8 - i), G.x - m/2, G.y + i*G.s + G.s/2); }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  v64sBoard(g, G.x + G.bw/2, G.y + G.bw + m + 4, '♟️ Cờ vua khổng lồ · chạm để chơi');
  // góc trái (rộng ≈ 92px): cây, đèn, bụi hoa, ghế khán giả — chia cao theo tỷ lệ vàng
  const lx = r.x + 30, lw = tx - r.x - 34, y1 = r.y + Math.round(r.h/V65A_PHI/V65A_PHI);
  g.drawImage(v64sTreeSpr('tree', 1), lx + lw/2 - 32, r.y + 14); g.drawImage(v64sLampSpr(), lx + lw/2 - 12, y1 + 10);
  for(let k = 0; k < 4; k++) v65aFlowerBush(g, lx + (k % 2)*30 - 2, y1 + 84 + Math.floor(k/2)*30, k);
  g.drawImage(v64sBenchSpr(), lx + lw/2 - 36, r.y + Math.round(r.h/V65A_PHI) + 20);
  g.drawImage(v64sTreeSpr('pine', 0), lx + lw/2 - 33, r.y + r.h - 112);
  return c;
}
// ---------- Sân Rubik mở (320×220): lát đá NA, khảm mặt Rubik giữa sân, bụi góc, ghế tập ----------
function v65aBuildYard(r){
  const c = v45Off(r.w + 20, r.h + 20), dong = v64sDong(), cols = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b', '#2fbf71', '#ef4b4b', '#ffd23f'];
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(-r.x + 10, -r.y + 10);
  v65aGrass(g, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 37);
  v65aPave(g, 'FI', 5, 1, (i = 0) => v65aRR(g, r.x + 6 + i, r.y + 6 + i, r.w - 12 - 2*i, r.h - 12 - 2*i, 26 - i));
  const cx = r.x + r.w/2, cy = r.y + r.h/V65A_PHI, t = 22;
  g.fillStyle = '#2b1a10'; v65aRR(g, cx - 1.5*t - 7, cy - 1.5*t - 7, 3*t + 14, 3*t + 14, 10); g.fill(); g.fillStyle = '#4a3428'; v65aRR(g, cx - 1.5*t - 4, cy - 1.5*t - 4, 3*t + 8, 3*t + 8, 8); g.fill();
  for(let i = 0; i < 9; i++){ const x = cx - 1.5*t + (i % 3)*t + 2, y = cy - 1.5*t + Math.floor(i/3)*t + 2; g.fillStyle = cols[i]; g.fillRect(x, y, t - 4, t - 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, t - 4, 3); }
  // bụi NA ở 4 góc (mở mọi phía, không có tường)
  [[r.x + 6, r.y + 2], [r.x + r.w - 70, r.y + 2], [r.x + 6, r.y + r.h - 30], [r.x + r.w - 70, r.y + r.h - 30]].forEach(([hx, hy], k) => { for(let i = 0; i < 2; i++){ if(dong) v64sT(g, 'N', 5, 12, hx + i*32, hy, 1, 1, 2); else v64sT(g, 'N', (i + k) % 2, 10, hx + i*32, hy - 2, 1, 1, 2); } });
  // ghế tập Rubik (đúng chỗ RY_SPOTS), mỗi ghế 1 khối Rubik nhỏ
  RY_SPOTS.forEach(([bx, by], k) => { const lx = bx - 60 + r.x, ly = by - 480 + r.y - 22;
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(lx - 17, ly + 13, 36, 4); g.fillStyle = '#2b2430'; g.fillRect(lx - 19, ly - 2, 38, 14); g.fillRect(lx - 16, ly + 10, 5, 6); g.fillRect(lx + 11, ly + 10, 5, 6);
    g.fillStyle = '#c9c2b4'; g.fillRect(lx - 17, ly, 34, 10); g.fillStyle = '#e4ded2'; g.fillRect(lx - 17, ly, 34, 3); if(dong){ g.fillStyle = '#fff'; g.fillRect(lx - 17, ly - 1, 34, 3); }
    for(let i = 0; i < 4; i++){ g.fillStyle = cols[(i + k) % 9]; g.fillRect(lx + 4 + (i % 2)*5, ly + 1 + Math.floor(i/2)*4, 4, 3); } });
  return c;
}
// ---------- hàng bụi NA quanh Quảng trường cờ / Tượng đài (thay viền cam cũ), chừa lối vào ----------
function v65aHedgeSpr(id, r){
  const z = V46.ZI[id], ent = z && z.entry ? [z.entry[0] - z.d[0], z.entry[1] - z.d[1]] : null;
  return v65aSpr('H' + id + season + r.w + 'x' + r.h, r.w + 32, r.h + 40, g => {
    const keep = []; if(id === 'giantchess'){ const G = v45BoardGeo(r); keep.push([G.x - 60, G.y - 60, G.bw + 140, G.bw + 140]); }
    if(id === 'rubikpark'){ const G = v45ParkGeo(r), pw = G.R3*1.2 + 40; keep.push([G.cx - pw/2, G.base, pw, r.h], [G.cx - 60, r.y - 40, 120, 80]); }
    const pts = [], step = 32; for(let x = r.x + 16; x <= r.x + r.w - 16; x += step){ pts.push([x, r.y + 6]); pts.push([x, r.y + r.h - 4]); }
    for(let y = r.y + 38; y <= r.y + r.h - 36; y += step){ pts.push([r.x + 14, y]); pts.push([r.x + r.w - 14, y]); }
    pts.sort((a, b) => a[1] - b[1]).forEach(([x, y], i) => {
      if(ent && Math.hypot(x - ent[0], y - ent[1]) < 76) return; if(keep.some(k => x > k[0] && x < k[0] + k[2] && y > k[1] && y < k[1] + k[3])) return;
      const px = x - r.x + 16 - 16, py = y - r.y + 16 - 26;
      if(v64sDong()) v64sT(g, 'N', 5, 12, px, py + 2, 1, 1, 2); else { v64sT(g, 'N', i % 2, 10, px, py, 1, 1, 2); if(i % 5 === 0) v65aFlowerBush(g, px + 4, py + 6, i); } });
  });
}
// ---------- lối vào cửa các lớp: thềm đá lát + 2 bụi hoa; phần khu nằm ngoài vòng rào trường: cỏ NA ----------
function v65aPaintZones(g, x0, y0, w, h, lod){
  if(!V65A.on) return; const x1 = x0 + w, y1 = y0 + h, C = V64S.C, RR = V64S.R + 18;
  for(const id of V65A_IDS){ const z = V46.ZI[id]; if(!z || z.flip) continue; const n = z.n; if(n.x1 + 60 < x0 || n.x0 - 60 > x1 || n.y1 + 60 < y0 || n.y0 - 60 > y1) continue;
    const e = z.e, school = !!V46SCHOOL[id];
    g.save(); g.imageSmoothingEnabled = false; v46ClipZone(g, z, 0);
    if(school){   // chỉ phần ngoài vòng tròn khuôn viên (bên trong v64s đã vẽ cỏ NA)
      g.beginPath(); g.rect(n.x0 - 80, n.y0 - 80, n.x1 - n.x0 + 160, n.y1 - n.y0 + 160); g.arc(C[0], C[1], RR, 0, Math.PI*2); g.clip('evenodd'); }
    g.translate(z.d[0], z.d[1]);
    const out = !school || [[n.x0, n.y0], [n.x1, n.y0], [n.x0, n.y1], [n.x1, n.y1]].some(([px, py]) => Math.hypot(px - C[0], py - C[1]) > RR);
    if(out){ if(lod < 2) v65aGrass(g, e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0, 5); else { g.fillStyle = v64sDong() ? '#f4f6f8' : '#a9c25a'; g.fillRect(e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0); } }
    if(!school){ const o = z.o; g.beginPath(); g.rect(o.x, o.y, o.w, o.h); g.clip(); g.drawImage(v47wPatch(z), e.x0, e.y0); }   // chỉ trong khung khu: lề cỏ ô kẻ cũ → cỏ NA   // ảnh khu (bàn cờ / tượng đài kiểu NA) đặt lại lên cỏ mới
    g.restore();
    // lề khu bị "lỗ" (chỗ khu hàng xóm ở bản đồ cũ) → lộ cỏ ô kẻ của đảo; phủ cỏ NA đúng phần lỗ ∩ khung mở rộng
    if(!school && lod < 2){ g.save(); g.imageSmoothingEnabled = false; g.beginPath(); let any = false;
      z.holes.forEach(o => { const a0 = Math.max(o.x, e.x0), b0 = Math.min(o.x + o.w, e.x1), a1 = Math.max(o.y, e.y0), b1 = Math.min(o.y + o.h, e.y1); if(b0 > a0 && b1 > a1){ g.rect(a0 + z.d[0], a1 + z.d[1], b0 - a0, b1 - a1); any = true; } });
      if(any){ g.clip(); g.translate(z.d[0], z.d[1]); v65aGrass(g, e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0, 5); } g.restore(); }
    const r = R[id]; if(!school || !r || !r.dw || lod === 2) continue;
    // thềm cửa (toạ độ cũ → mới)
    g.save(); g.imageSmoothingEnabled = false; v46ClipZone(g, z, 0); g.translate(z.d[0], z.d[1]);
    const [dx, dy] = r.dw, s = r.side, aw = 64;
    const box = s === 'b' ? [dx - aw/2, dy + 4, aw, e.y1 - dy] : s === 't' ? [dx - aw/2, e.y0, aw, dy - 4 - e.y0] : s === 'l' ? [e.x0, dy - aw/2, dx - 4 - e.x0, aw] : [dx + 4, dy - aw/2, e.x1 - dx, aw];
    if(box[2] > 4 && box[3] > 4){ g.fillStyle = '#4a3428'; g.fillRect(box[0] - 4, box[1] - 4, box[2] + 8, box[3] + 8); g.fillStyle = v64sPat(g, 'FI', 1, 13, 2); g.fillRect(box[0], box[1], box[2], box[3]);
      if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(box[0], box[1], box[2], box[3]); } }
    const bush = (bx, by, i) => v65aFlowerBush(g, bx - 16, by - 16, i);
    if(s === 'b' || s === 't'){ const by = s === 'b' ? dy + 20 : dy - 22; bush(dx - aw/2 - 26, by, 0); bush(dx + aw/2 + 26, by, 1); }
    else { const bx = s === 'l' ? dx - 22 : dx + 22; bush(bx, dy - aw/2 - 24, 2); bush(bx, dy + aw/2 + 24, 3); }
    g.restore(); }
}
function v65aYardsInit(){
  const on = () => V65A.on;
  const bp0 = v45BuildPark; v45BuildPark = function(r){ if(on()){ try { return v65aBuildPark(r); } catch(e){ console.warn('v65a park', e); } } return bp0.apply(this, arguments); };
  const bb0 = v45BuildBoard; v45BuildBoard = function(r){ if(on()){ try { return v65aBuildBoard(r); } catch(e){ console.warn('v65a board', e); } } return bb0.apply(this, arguments); };
  const by0 = v45BuildYard; v45BuildYard = function(r){ if(on()){ try { return v65aBuildYard(r); } catch(e){ console.warn('v65a yard', e); } } return by0.apply(this, arguments); };
  // viền cam cũ → hàng bụi NA (giữ viền cũ cho các khu khác)
  const sf0 = v20Soft; v20Soft = function(){
    if(!on()) return sf0.apply(this, arguments);
    const keep = SOFT_ZONES.slice(); for(const k of V65A.soft){ const i = SOFT_ZONES.indexOf(k); if(i >= 0) SOFT_ZONES.splice(i, 1); }
    try { sf0.apply(this, arguments); } finally { SOFT_ZONES.length = 0; keep.forEach(k => SOFT_ZONES.push(k)); }
  };
  // hàng bụi vẽ SAU ảnh khu (v45 vẽ ảnh trong v20Rooms khi chưa kịp nướng vào nền)
  const rm0 = v20Rooms; v20Rooms = function(){ const res = rm0.apply(this, arguments); if(!on() || (typeof FEED !== 'undefined' && FEED)) return res;
    ['giantchess', 'rubikpark'].forEach(id => { const r = R[id]; if(!r || VB.x1 < r.x - 20 || VB.x0 > r.x + r.w + 20 || VB.y1 < r.y - 30 || VB.y0 > r.y + r.h + 30) return; try { ctx.drawImage(v65aHedgeSpr(id, r), r.x - 16, r.y - 16); } catch(e){} }); return res;
  };
}
// bọc v46Paint lúc nạp file (sau v64s) → lối vào + cỏ NA được nướng vào ô nền
const v65aPaint0 = v46Paint;
v46Paint = function(g, x0, y0, w, h, lod){ v65aPaint0(g, x0, y0, w, h, lod); try { v65aPaintZones(g, x0, y0, w, h, lod); } catch(e){ console.warn('v65a paint', e); } };
