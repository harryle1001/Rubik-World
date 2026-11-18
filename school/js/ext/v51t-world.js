// ================= v51t · TRƯỜNG TIN HỌC: toà nhà trên đảo (kính, mái xanh, biển chữ pixel, ăng-ten, sân robot) =================
// Kiến trúc tỷ lệ vàng (giống khung v48mFrame): khu 780×482 = toà nhà 482×298 (chữ nhật vàng) + sân robot 298×482 (chữ nhật vàng đứng).
// Toà nhà = gian chính 298 (sảnh kính, cửa) + cánh 184 (3 tầng phòng máy). Mái cao bh/φ⁴, cửa rộng bh/φ³ cao bh/φ², cửa sổ 1:φ.
const V51TW = {robots:[], kids:[], t:0, near:false, msgT:0, oz:{id:'tech'}};

// ---------- 1. sprite toà nhà (vẽ một lần cho mỗi mùa) ----------
function v51tSprite(se){
  const key = 'b' + se; if(V51T.spr[key]) return V51T.spr[key]; const G = v51tGeo(), P = V51T_PHI, bw = G.bw, bh = G.bh, main = G.main, ox = 12, oy = 74;
  const c = document.createElement('canvas'); c.width = bw + 24; c.height = bh + oy + 6; const g = c.getContext('2d'); const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h)); };
  const rH = Math.round(bh/P**4), snow = se === 'dong', leaf = {xuan:['#7bd36a', '#ff9ccf'], ha:['#3fae4a', '#ffd23f'], thu:['#d98a2b', '#c25a1a'], dong:['#e8f0f6', '#cfdbe6']}[se] || ['#3fae4a', '#ffd23f'];
  // bóng đổ + bệ
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ox + 6, oy + bh - 2, bw, 10);
  R('#c9ccd6', -4, bh - 10, bw + 8, 10); R('#a9adbb', -4, bh - 3, bw + 8, 3);
  // thân: khung trắng hiện đại
  R('#eef1f6', 0, rH, bw, bh - rH - 10); R('#d6dbe6', main - 4, rH, 8, bh - rH - 10);
  // gian chính: vách kính sảnh (5 cột × 3 hàng, ô 1:φ)
  const gx0 = 14, gx1 = main - 14, gy0 = rH + 54, gy1 = bh - 12, cols = 5, cw = (gx1 - gx0)/cols, rows = 3, rh = (gy1 - gy0)/rows;
  for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++){ const x = gx0 + i*cw, y = gy0 + j*rh; const gr = g.createLinearGradient(0, oy + y, 0, oy + y + rh);
    gr.addColorStop(0, '#9fe3f5'); gr.addColorStop(1, '#3a9ec4'); g.fillStyle = gr; g.fillRect(ox + x + 2, oy + y + 2, cw - 4, rh - 4);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(ox + x + 4, oy + y + rh - 6); g.lineTo(ox + x + cw*.45, oy + y + 4); g.lineTo(ox + x + cw*.62, oy + y + 4); g.lineTo(ox + x + 4 + cw*.17, oy + y + rh - 6); g.fill(); }
  // bên trong sảnh: hàng màn hình + cây
  for(let i = 0; i < cols; i++){ const x = gx0 + i*cw + cw/2; if(i === 2) continue; R('#26324a', x - 9, gy0 + rh*2 + 10, 18, 12); R('#5ff0ff', x - 7, gy0 + rh*2 + 12, 14, 8); R('#26324a', x - 1, gy0 + rh*2 + 22, 2, 5); }
  // biển chữ pixel trên sảnh
  R('#1b2440', 10, rH + 10, main - 20, 38); R('#2b385e', 10, rH + 46, main - 20, 2);
  const t1 = v51tPixText('TIN HỌC RUBIK', '#ffe36e', 2, '#7a4a00'); g.drawImage(t1, ox + main/2 - t1.width/2, oy + rH + 11);
  for(let i = 0; i < 6; i++) R(V51T_RUBIK[i], 16 + i*7, rH + 40, 5, 5);
  // cửa kính trượt (rộng bh/φ³, cao bh/φ²) + mái hiên
  const dw = G.dw, dh = Math.round(bh/P/P), dx = main/2 - dw/2, dy = bh - 10 - dh;
  R('#2b3550', dx - 4, dy - 4, dw + 8, dh + 4); R('#7fd8f0', dx, dy, dw/2 - 1, dh); R('#6ccbe6', dx + dw/2 + 1, dy, dw/2 - 1, dh); R('rgba(255,255,255,.4)', dx + 4, dy + 4, 4, dh - 8); R('#e9eef7', dx + dw/2 - 6, dy + dh/2, 3, 10); R('#e9eef7', dx + dw/2 + 3, dy + dh/2, 3, 10);
  R('#2fbf71', dx - 22, dy - 14, dw + 44, 8); R('#1f8a50', dx - 22, dy - 6, dw + 44, 3);
  // cánh: 3 tầng phòng máy, mỗi tầng 3 cửa sổ có màn hình
  const wx0 = main + 10, ww = (bw - main - 20), fl = (bh - rH - 22)/3;
  for(let f = 0; f < 3; f++){ const y = rH + 6 + f*fl; R('#d6dbe6', main + 4, y + fl - 4, bw - main - 4, 4);
    for(let k = 0; k < 3; k++){ const w = ww/3 - 8, x = wx0 + k*(ww/3) + 4, h = Math.min(fl - 16, w*P); R('#5aa9c8', x, y + 6, w, h); R('#8fd6ea', x, y + 6, w, 4);
      R('#2a3048', x + w/2 - 8, y + 6 + h - 15, 16, 10); R('#1d2235', x + w/2 - 1, y + 6 + h - 5, 2, 5); } }
  // dải 6 màu Rubik chân cánh
  for(let i = 0; i < 6; i++) R(V51T_RUBIK[i], main + 10 + i*((bw - main - 20)/6), bh - 18, (bw - main - 20)/6 - 2, 6);
  // mái xanh: lan can trắng + thảm cỏ + bụi cây + pin mặt trời trên cánh
  R('#f7f9fc', -6, rH - 8, bw + 12, 8); R('#cfd5e1', -6, rH - 1, bw + 12, 2);
  R(snow ? '#f2f6fa' : '#4fb35a', -2, 0, bw + 4, rH - 8); R(snow ? '#dfe8ef' : '#3a9a48', -2, rH - 14, bw + 4, 6);
  for(let i = 0; i < 14; i++){ const x = 10 + i*((main - 20)/13); g.fillStyle = i % 3 ? leaf[0] : leaf[1]; g.beginPath(); g.arc(ox + x, oy + rH - 14, 7 + (i % 2)*3, 0, 7); g.fill(); }
  for(let k = 0; k < 3; k++){ const x = main + 12 + k*54, y = 8; R('#22305a', x, y, 46, 22); for(let a = 1; a < 4; a++) R('#3d5596', x + a*11.5, y, 1, 22); R('#3d5596', x, y + 11, 46, 1); R('#9aa4bd', x + 20, y + 22, 4, 6); if(snow) R('#f2f6fa', x - 1, y - 3, 48, 4); }
  if(snow){ R('#ffffff', -6, rH - 12, bw + 12, 5); for(let i = 0; i < 9; i++) R('#ffffff', 20 + i*30, rH - 8, 10, 3 + (i % 3)); }
  // cột ăng-ten + chảo (đèn nháy vẽ động)
  const ax = main + (bw - main)/2 + 50; R('#8d93a6', ax - 2, -70, 4, 70); for(let i = 0; i < 6; i++) R('#8d93a6', ax - 6 + (i % 2)*8, -64 + i*11, 4, 2);
  R('#b5bccc', ax - 40, -20, 4, 20); g.fillStyle = '#e8ecf3'; g.beginPath(); g.ellipse(ox + ax - 38, oy - 22, 14, 9, -.5, 0, 7); g.fill(); g.fillStyle = '#9aa3b8'; g.fillRect(ox + ax - 40, oy - 25, 3, 3);
  c.ox = ox; c.oy = oy; V51T.spr[key] = c; return c;
}
// lớp phát sáng ban đêm: màn hình + kính sảnh + biển chữ
function v51tGlowSprite(){
  if(V51T.spr.glow) return V51T.spr.glow; const b = v51tSprite('ha'), G = v51tGeo(), P = V51T_PHI, bw = G.bw, bh = G.bh, main = G.main, ox = b.ox, oy = b.oy, rH = Math.round(bh/P**4);
  const c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const g = c.getContext('2d'); const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h)); };
  R('rgba(120,220,255,.42)', 16, rH + 56, main - 32, bh - rH - 70); R('rgba(255,227,110,.55)', 12, rH + 12, main - 24, 34);
  const wx0 = main + 10, ww = (bw - main - 20), fl = (bh - rH - 22)/3;
  for(let f = 0; f < 3; f++){ const y = rH + 6 + f*fl; for(let k = 0; k < 3; k++){ const w = ww/3 - 8, x = wx0 + k*(ww/3) + 4, h = Math.min(fl - 16, w*P); R('rgba(90,200,255,.55)', x, y + 6, w, h); R('rgba(170,255,255,1)', x + w/2 - 8, y + 6 + h - 15, 16, 10); } }
  const dw = G.dw, dh = Math.round(bh/P/P); R('rgba(255,240,190,.75)', main/2 - dw/2, bh - 10 - dh, dw, dh);
  V51T.spr.glow = c; return c;
}
// ảnh thu nhỏ cho chế độ sắp xếp v48 (khung 780×482)
function v51tThumb(){
  const G = v51tGeo(), s = .25, c = document.createElement('canvas'); c.width = Math.round(V51T_W*s); c.height = Math.round(V51T_H*s); const g = c.getContext('2d'); g.scale(s, s); g.translate(-G.x0, -G.y0);
  v51tGround(g, true); const b = v51tSprite(typeof season === 'string' ? season : 'ha'); g.drawImage(b, G.x0 - b.ox, G.y0 - b.oy); return c;
}

// ---------- 2. nền (nướng vào ô đất đảo): quảng trường trước, sân robot, lối đi ----------
function v51tGround(g, thumb){
  const G = v51tGeo(), dong = typeof season === 'string' && season === 'dong', P = V51T_PHI;
  // quảng trường lát gạch (ô 20 so le) + viền
  const f = G.front; g.fillStyle = dong ? '#e6e8ee' : '#d9dbe3'; g.fillRect(f.x0 - 8, G.gy - 6, f.x1 - f.x0 + 16, f.y1 - G.gy + 6);
  if(!thumb){ g.fillStyle = 'rgba(0,0,0,.05)'; for(let y = G.gy; y < f.y1; y += 20) for(let x = f.x0 + ((y - G.gy)/20 % 2)*20; x < f.x1; x += 40) g.fillRect(x, y, 20, 20); }
  // lối vào từ cửa xuống (rộng = cửa × φ)
  const pw = Math.round(G.dw*P); g.fillStyle = '#c3c7d3'; g.fillRect(G.door[0] - pw/2, G.gy, pw, G.y1 - G.gy + 30); g.fillStyle = '#eef0f5'; for(let y = G.gy + 8; y < G.y1 + 20; y += 26) g.fillRect(G.door[0] - pw/2 + 8, y, pw - 16, 6);
  // sân robot: thảm cao su xanh, đường đua robot dò line, ô sạc
  const y = G.yard; g.fillStyle = dong ? '#bcd3dd' : '#3aa6a0'; g.fillRect(y.x0 + 6, y.y0 + 6, y.x1 - y.x0 - 12, y.y1 - y.y0 - 12); g.fillStyle = dong ? '#a9c3ce' : '#2f8f8a'; g.fillRect(y.x0 + 6, y.y1 - 12, y.x1 - y.x0 - 12, 6);
  if(!thumb){ g.fillStyle = 'rgba(255,255,255,.07)'; for(let yy = y.y0 + 6; yy < y.y1 - 6; yy += 30) for(let xx = y.x0 + 6 + ((yy - y.y0)/30 % 2)*30; xx < y.x1 - 6; xx += 60) g.fillRect(xx, yy, 30, 30); }
  const T = G.track; g.strokeStyle = '#1b2235'; g.lineWidth = 8; g.beginPath(); if(g.roundRect) g.roundRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 46); else g.rect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0); g.stroke();
  g.strokeStyle = '#f4f4f4'; g.lineWidth = 2; g.setLineDash([10, 10]); g.stroke(); g.setLineDash([]);
  for(let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? '#1b2235' : '#f4f4f4'; g.fillRect(T.x0 - 8 + i*4, (T.y0 + T.y1)/2 - 2, 4, 14); }
  // ô sạc + bàn lắp robot (ô vuông 6 màu Rubik)
  const by = T.y1 + 26; for(let i = 0; i < 6; i++){ g.fillStyle = V51T_RUBIK[i]; g.fillRect(y.x0 + 30 + (i % 3)*26, by + Math.floor(i/3)*26, 22, 22); }
  g.fillStyle = '#ffd23f'; g.fillRect(y.x1 - 90, by, 54, 48); g.fillStyle = '#1b2235'; g.fillRect(y.x1 - 84, by + 6, 42, 36); g.fillStyle = '#ffd23f'; g.font = "800 22px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚡', y.x1 - 63, by + 25); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  // bồn cây (không hàng rào) + giá xe đạp
  for(const px of [f.x0 + 34, f.x1 - 40]){ g.fillStyle = '#9aa1b2'; g.fillRect(px - 20, f.y1 - 52, 40, 18); g.fillStyle = dong ? '#e8f0f6' : '#3f9a46'; g.beginPath(); g.arc(px, f.y1 - 56, 18, 0, 7); g.fill(); }
  g.fillStyle = '#7d8496'; for(let i = 0; i < 5; i++) g.fillRect(f.x0 + 90 + i*16, f.y1 - 40, 3, 16); g.fillRect(f.x0 + 88, f.y1 - 26, 70, 3);
}

// ---------- 3. robot & học sinh ngoài sân ----------
function v51tMakeLife(){
  V51TW.robots = [{k:'line', u:0, sp:.06}, {k:'wheel', x:0, y:0, tx:0, ty:0, c:'#ef4b4b'}, {k:'wheel', x:0, y:0, tx:0, ty:0, c:'#3d7bff'}, {k:'arm', a:0}];
  V51TW.kids = []; for(let i = 0; i < 5; i++){ const k = v51tRandKid(i + 3); k.x = 0; k.y = 0; k.tx = 0; k.ty = 0; k.wait = Math.random()*3; V51TW.kids.push(k); }
  V51TW.placed = '';
}
function v51tTrackPt(u){
  const T = v51tGeo().track, w = T.x1 - T.x0, h = T.y1 - T.y0, L = 2*(w + h); let d = ((u % 1) + 1) % 1*L;
  if(d < w) return [T.x0 + d, T.y0, 0]; d -= w; if(d < h) return [T.x1, T.y0 + d, 1]; d -= h; if(d < w) return [T.x1 - d, T.y1, 2]; d -= w; return [T.x0, T.y1 - d, 3];
}
function v51tLifeTick(dt){
  const G = v51tGeo(), Y = G.yard, k = G.gk; if(V51TW.placed !== V51T.gk){ V51TW.placed = V51T.gk; V51TW.robots.forEach(r => { if(r.k === 'wheel'){ r.x = r.tx = Y.x0 + 60 + Math.random()*(Y.x1 - Y.x0 - 120); r.y = r.ty = Y.y1 - 70 - Math.random()*40; } });
    V51TW.kids.forEach(q => { q.x = q.tx = Y.x0 + 30 + Math.random()*(Y.x1 - Y.x0 - 60); q.y = q.ty = G.front.y0 + 50 + Math.random()*90; }); }
  V51TW.robots.forEach(r => { if(r.k === 'line') r.u += r.sp*dt; else if(r.k === 'arm') r.a += dt;
    else { const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy); if(d < 3){ r.tx = Y.x0 + 50 + Math.random()*(Y.x1 - Y.x0 - 100); r.ty = G.track.y1 + 20 + Math.random()*(Y.y1 - G.track.y1 - 50); } else { const s = Math.min(d, 26*dt); r.x += dx/d*s; r.y += dy/d*s; r.dir = dx < 0 ? -1 : 1; } } });
  const out = !v51tClass() && clock > 400 && clock < 1140;
  V51TW.kids.forEach((q, i) => { q.vis = out && i < (clock > 990 ? 5 : 3); if(!q.vis) return; q.wait -= dt;
    const dx = q.tx - q.x, dy = q.ty - q.y, d = Math.hypot(dx, dy);
    if(d < 2){ q.moving = false; if(q.wait <= 0){ q.wait = 2 + Math.random()*4; const tr = Math.random() < .6; q.tx = tr ? Y.x0 + 24 + Math.random()*(Y.x1 - Y.x0 - 48) : G.front.x0 + 160 + Math.random()*(G.front.x1 - G.front.x0 - 200); q.ty = tr ? Y.y0 + 30 + Math.random()*(Y.y1 - Y.y0 - 60) : G.front.y0 + 60 + Math.random()*80; } }
    else { const s = Math.min(d, 34*dt); q.x += dx/d*s; q.y += dy/d*s; q.dir = dx < 0 ? -1 : 1; q.moving = true; q.walk += dt*6; } });
}
function v51tRobot(g, r, t){
  if(r.k === 'line'){ const p = v51tTrackPt(r.u), a = [0, Math.PI/2, Math.PI, -Math.PI/2][p[2]]; g.save(); g.translate(p[0], p[1]); g.rotate(a);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-11, -7, 24, 16); g.fillStyle = '#ffd23f'; g.fillRect(-12, -9, 24, 18); g.fillStyle = '#1b2235'; g.fillRect(-12, -11, 8, 4); g.fillRect(-12, 7, 8, 4); g.fillRect(4, -11, 8, 4); g.fillRect(4, 7, 8, 4);
    g.fillStyle = '#5ff0ff'; g.fillRect(6, -5, 5, 10); g.fillStyle = (Math.floor(t*4) % 2) ? '#ef4b4b' : '#7a1f1f'; g.fillRect(-9, -3, 4, 4); g.restore(); return; }
  if(r.k === 'arm'){ const Y = v51tGeo().yard, x = Y.x1 - 63, y = v51tGeo().track.y1 + 22; g.fillStyle = '#8d93a6'; g.fillRect(x - 10, y - 6, 20, 8); const a1 = -1.2 + Math.sin(r.a*1.3)*.5, a2 = .9 + Math.sin(r.a*2)*.6;
    g.strokeStyle = '#ff8a2b'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - 6); const ex = x + Math.cos(a1)*22, ey = y - 6 + Math.sin(a1)*22; g.lineTo(ex, ey); g.lineTo(ex + Math.cos(a1 + a2)*18, ey + Math.sin(a1 + a2)*18); g.stroke(); g.lineCap = 'butt'; return; }
  const b = Math.abs(Math.sin(t*10))*1.2; g.save(); g.translate(Math.round(r.x), Math.round(r.y)); if(r.dir < 0) g.scale(-1, 1);
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-9, -2, 18, 4); g.fillStyle = '#2a3048'; g.fillRect(-8, -7, 5, 6); g.fillRect(3, -7, 5, 6);
  g.fillStyle = r.c; g.fillRect(-8, -20 - b, 16, 13); g.fillStyle = '#e9edf5'; g.fillRect(-6, -28 - b, 12, 9); g.fillStyle = '#1b2235'; g.fillRect(-4, -26 - b, 8, 4); g.fillStyle = '#5ff0ff'; g.fillRect(-3, -25 - b, 2, 2); g.fillRect(1, -25 - b, 2, 2);
  g.fillStyle = '#8d93a6'; g.fillRect(-1, -33 - b, 2, 5); g.fillStyle = (Math.floor(t*3 + r.x) % 2) ? '#ffd23f' : '#ff8a2b'; g.fillRect(-2, -35 - b, 4, 3); g.restore();
}

// ---------- 4. vẽ trên đảo (trước người đi lại, sau mặt đất) ----------
function v51tWorld(VBn){
  if(typeof cam === 'undefined' || cam.z < .2) return; const G = v51tGeo(); if(G.x1 < VBn.x0 - 40 || G.x0 > VBn.x1 + 40 || G.y1 < VBn.y0 - 40 || G.y0 - 90 > VBn.y1) return;
  const t = realT, dt = Math.min(.1, Math.max(0, t - (V51TW.t || t))); V51TW.t = t; v51tLifeTick(dt);
  const b = v51tSprite(typeof season === 'string' ? season : 'ha'), x = G.x0 - b.ox, y = G.y0 - b.oy, P = V51T_PHI, rH = Math.round(G.bh/P**4);
  ctx.drawImage(b, x, y);
  // màn hình trong cánh: dòng code chạy (chỉ khi lại gần)
  if(cam.z > .45){ const wx0 = G.main + 10, ww = G.bw - G.main - 20, fl = (G.bh - rH - 22)/3;
    for(let f = 0; f < 3; f++) for(let k = 0; k < 3; k++){ const w = ww/3 - 8, sx = G.x0 + wx0 + k*(ww/3) + 4 + w/2 - 7, sy = G.y0 + rH + 6 + f*fl + 6 + Math.min(fl - 16, w*P) - 13, ph = Math.floor(t*2 + f*3 + k) % 4;
      ctx.fillStyle = '#123'; ctx.fillRect(sx, sy, 14, 8); for(let l = 0; l < 3; l++){ ctx.fillStyle = ['#5ff0ff', '#ffd23f', '#7dff9a', '#ff8fc4'][(l + ph) % 4]; ctx.fillRect(sx + 1 + (l % 2)*2, sy + 1 + l*2, 4 + ((l*5 + ph*3) % 8), 1); } } }
  // ăng-ten: đèn đỏ nháy + sóng wifi
  const ax = G.x0 + G.main + (G.bw - G.main)/2 + 50, ay = G.y0 - 72; ctx.fillStyle = (Math.floor(t*1.6) % 2) ? '#ff3b3b' : '#7a1f1f'; ctx.fillRect(ax - 3, ay - 4, 6, 6);
  const wv = (t*1.2) % 1; ctx.strokeStyle = `rgba(95,240,255,${(1 - wv)*.8})`; ctx.lineWidth = 2; for(let i = 0; i < 3; i++){ const r = 8 + i*7 + wv*7; ctx.beginPath(); ctx.arc(ax, ay, r, -2.4, -.75); ctx.stroke(); }
  // biển hiệu đứng (cột + màn hình chữ chạy)
  const [sx, sy] = G.sign; ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(sx - 60, sy - 2, 124, 6); ctx.fillStyle = '#e9edf5'; ctx.fillRect(sx - 62, sy - 58, 124, 58); ctx.fillStyle = '#1b2440'; ctx.fillRect(sx - 56, sy - 52, 112, 38);
  const tx = v51tPixText('LẬP TRÌNH · ROBOT · NHỊ PHÂN · PIXEL · CODE ·', '#5ff0ff', 2), off = (t*30) % tx.width; ctx.save(); ctx.beginPath(); ctx.rect(sx - 54, sy - 51, 108, 36); ctx.clip(); ctx.drawImage(tx, sx - 54 - off, sy - 51); ctx.drawImage(tx, sx - 54 - off + tx.width, sy - 51); ctx.restore();
  for(let i = 0; i < 6; i++){ ctx.fillStyle = V51T_RUBIK[i]; ctx.fillRect(sx - 56 + i*19, sy - 11, 17, 5); }
  // robot + học sinh (sắp theo y)
  const sp = []; V51TW.robots.forEach(r => sp.push({y:r.k === 'line' ? v51tTrackPt(r.u)[1] : r.k === 'arm' ? G.track.y1 + 22 : r.y, f:() => v51tRobot(ctx, r, t)}));
  V51TW.kids.forEach(q => { if(q.vis) sp.push({y:q.y, f:() => v51tKid(ctx, q.x, q.y, q, t)}); }); sp.sort((a, b) => a.y - b.y); sp.forEach(s => s.f());
  // nhãn tên khu khi lại gần cửa
  if(V51TW.near && cam.z >= .45){ const fs = 17/Math.max(.8, cam.z), lx = G.door[0], ly = G.gy - G.bh - 24; ctx.font = "800 " + fs.toFixed(1) + "px Nunito, 'Be Vietnam Pro', sans-serif"; const s = '💻 Trường Tin học · Chạm để vào', w = ctx.measureText(s).width + fs;
    ctx.fillStyle = 'rgba(11,16,32,.8)'; ctx.fillRect(lx - w/2, ly - fs*.8, w, fs*1.6); ctx.fillStyle = '#ffe36e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, lx, ly); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}
// sau lớp tối ban đêm: màn hình, kính sảnh, biển chữ phát sáng
function v51tGlow(VBn){
  const k = v51tNightK(); if(k <= 0 || typeof cam === 'undefined' || cam.z < .2) return; const G = v51tGeo(); if(G.x1 < VBn.x0 || G.x0 > VBn.x1 || G.y1 < VBn.y0 || G.y0 - 90 > VBn.y1) return;
  const c = v51tGlowSprite(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k*(.8 + Math.sin(realT*2)*.06); ctx.drawImage(c, G.x0 - c.ox, G.y0 - c.oy);
  ctx.globalAlpha = k*.9; ctx.fillStyle = 'rgba(95,240,255,.5)'; ctx.fillRect(G.sign[0] - 56, G.sign[1] - 52, 112, 38); ctx.fillStyle = 'rgba(255,60,60,.8)'; const ax = G.x0 + G.main + (G.bw - G.main)/2 + 50; if(Math.floor(realT*1.6) % 2) ctx.fillRect(ax - 5, G.y0 - 78, 10, 10);
  ctx.restore();
}

// ---------- 5. vào trường: nút khi đứng gần cửa ----------
function v51tTick(){
  if(V51T.open || typeof V46 === 'undefined' || !V46.on || V46.sky || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible){ v51tEnterBtn(false); V51TW.near = false; return; }
  const G = v51tGeo(), p = v46Pos(PLAYER), d = Math.hypot(p[0] - G.door[0], p[1] - (G.gy + 16)); V51TW.near = d < 96; v51tEnterBtn(V51TW.near);
  if(!V51TW.near && Math.hypot(p[0] - G.cx, p[1] - G.cy) < 620 && performance.now() - V51TW.msgT > 120000){ V51TW.msgT = performance.now(); toast('💻 Trường Tin học Rubik! Tới cửa kính để vào học lập trình, robot, nhị phân…'); }
}
function v51tEnterBtn(on){ let b = document.getElementById('v51tEnter'); if(!b){ if(!on) return; b = document.createElement('button'); b.type = 'button'; b.id = 'v51tEnter'; b.innerHTML = '💻 Vào Trường Tin học <small>Code School</small>'; b.onclick = () => v51tOpen(); (document.getElementById('stage') || document.body).appendChild(b); } b.hidden = !on; }
// chạm vào toà nhà trên đảo = vào thẳng
function v51tTapWorld(e){
  if(V51T.open || typeof V46 === 'undefined' || !V46.on || V46.sky || !PLAYER || !PLAYER.visible) return false; const r = cvs.getBoundingClientRect(), wx = cam.x + (e.clientX - r.left - cw/2)/cam.z, wy = cam.y + (e.clientY - r.top - ch/2)/cam.z, G = v51tGeo();
  if(wx < G.b.x0 || wx > G.b.x1 || wy < G.b.y0 - 80 || wy > G.b.y1) return false; const p = v46Pos(PLAYER); if(Math.hypot(p[0] - G.door[0], p[1] - G.gy) > 380){ toast('💻 Đi tới cửa kính Trường Tin học để vào nhé.'); return false; } v51tOpen(); return true;
}

// ---------- 6. gắn vào đảo v46 ----------
function v51tWorldInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return; v51tMakeLife();
  // vẽ toà nhà trước người đi lại (sau bờ biển); phát sáng sau lớp tối
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); try { v51tWorld(VBn); } catch(e){ console.warn('v51t world', e); } };
  const li0 = v46Lighting; v46Lighting = function(VBn){ li0(VBn); try { v51tGlow(VBn); } catch(e){} };
  // nền nướng sẵn + ảnh toàn cảnh
  const p0 = v46Paint; v46Paint = function(g, x0, y0, w, h, lod){ p0(g, x0, y0, w, h, lod); const G = v51tGeo(); if(G.x1 < x0 || G.x0 > x0 + w || G.y1 < y0 || G.y0 > y0 + h) return; try { v51tGround(g, lod === 2); } catch(e){} };
  const ob0 = v46OverviewBuildings; v46OverviewBuildings = function(g){ ob0(g); try { const G = v51tGeo(), b = v51tSprite(typeof season === 'string' ? season : 'ha'); g.drawImage(b, G.x0 - b.ox, G.y0 - b.oy); } catch(e){} };
  // đường: tránh toà nhà + một lối rẽ tới cửa
  const ob = v46Obst; v46Obst = function(pad){ const o = ob(pad), G = v51tGeo(); o.push({x0:G.x0 - pad, y0:G.y0 - pad - 40, x1:G.x1 + pad, y1:G.y1 + pad, z:V51TW.oz}); return o; };
  const rd0 = v46Roads; v46Roads = function(){ rd0(); try { const G = v51tGeo(), e = [G.door[0], G.y1 + 6], q = v46Nearest(e[0], e[1]), t = V46R.nodes[q], n = Math.max(2, Math.ceil(Math.hypot(t[0] - e[0], t[1] - e[1])/50)), obs = v46Obst(46);
    let P = []; for(let i = 0; i <= n; i++) P.push([e[0] + (t[0] - e[0])*i/n, e[1] + (t[1] - e[1])*i/n]); P = P.map((p, i) => i === 0 || i === n ? p : v46Push(p, obs, V51TW.oz)); V46R.lines.push({P, closed:false, w:V46L.roads.path, k:'spoke', z:'tech'}); v46Graph(); } catch(e){ console.warn('v51t road', e); } };
  // cây/đèn nền không mọc trên khu
  const clean = () => { const G = v51tGeo(), bad = (x, y) => x > G.x0 - 40 && x < G.x1 + 40 && y > G.y0 - 30 && y < G.y1 + 60; V46T.deco = V46T.deco.filter(t => !bad(t.x, t.y)); if(V46T.lamps) V46T.lamps = V46T.lamps.filter(([x, y]) => !bad(x, y)); };
  const d0 = v46Deco; v46Deco = function(){ d0(); try { clean(); } catch(e){} };
  // dựng lại đường + cây với khu mới (v46Init đã chạy trước)
  try { v46Roads(); v46Deco(); V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; V46RC.clear(); V46G.key = ''; } catch(e){ console.warn('v51t rebuild', e); }
  // chặn đi xuyên toà nhà / biển hiệu
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){
    const r = cm0(ox, oy, nx, ny); if(!r || !V46.on || V46.sky || !v46Raw(nx)) return r; const x = nx - V46E, y = ny, G = v51tGeo();
    if(x > G.b.x0 - 4 && x < G.b.x1 + 4 && y > G.b.y0 - 6 && y < G.gy + 4) return false; if(Math.abs(x - G.sign[0]) < 64 && y > G.sign[1] - 12 && y < G.sign[1] + 4) return false; return r; };
  // đèn đêm: cửa, biển hiệu, đèn sân
  const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(!V46.on || V46.sky) return; const on = v51tNightK(); if(on <= 0) return; const G = v51tGeo();
    V46.raw = true; try { v25Push(G.door[0], G.gy - 20, 110, on, 2); v25Push(G.sign[0], G.sign[1] - 30, 90, on, 2); v25Push(G.x0 + G.main + 90, G.gy - 120, 140, on*.8, 3); v25Push((G.yard.x0 + G.yard.x1)/2, G.track.y1, 120, on*.7, 2); } finally { V46.raw = false; } };
  // bản đồ lớn: thêm địa điểm
  if(typeof mapPlaces === 'function'){ const mp0 = mapPlaces; mapPlaces = function(){ const P = mp0(); if(!V46.on || !Array.isArray(P) || P.some(p => p.k === 'v51t')) return P; const G = v51tGeo(), d = [G.door[0], G.gy + 24];
    P.push({k:'v51t', name:'Trường Tin học', icon:'💻', x:G.cx, y:G.cy, ox:d[0] + V46E, oy:d[1], door:[d[0] + V46E, d[1]], r:true}); return P; }; }
  cvs.addEventListener('pointerup', e => { if(e.pointerType === 'mouse' && e.button !== 0) return; if(V51TW.dn && Math.hypot(e.clientX - V51TW.dn[0], e.clientY - V51TW.dn[1]) < 10 && performance.now() - V51TW.dn[2] < 450) v51tTapWorld(e); V51TW.dn = null; }, true);
  cvs.addEventListener('pointerdown', e => { V51TW.dn = [e.clientX, e.clientY, performance.now()]; }, true);
  setInterval(() => { try { v51tTick(); } catch(e){} }, 250);
}
