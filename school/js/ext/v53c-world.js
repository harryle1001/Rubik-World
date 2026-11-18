// ================= v53c · THÀNH PHỐ AN TOÀN 2/6: toà nhà trên đảo — trạm cứu hỏa, đồn cảnh sát, Tháp Rubik 81 (bó tre, tỷ lệ vàng) =================
// Mặt đứng pixel vẽ một lần rồi cache (đổi mùa vẽ lại). Tháp: 7 cột bó tre, cột thứ k tính từ giữa cao Ht·φ^(−k/2); chóp = Ht/φ⁴.
const V53CW = {oz:{}, dn:null, msgT:{}};
for(const id in V53C_Z) V53CW.oz[id] = {id};

// ---------- 1. sprite trạm cứu hỏa ----------
function v53cFireSpr(se){
  const key = 'fs' + se; if(V53C.spr[key]) return V53C.spr[key]; const G = v53cGeo('fire'), P = V53C_PHI, bw = G.bw, bh = G.bh, ox = 12, oy = 168;
  const [c, g] = v53cCv(bw + 24, bh + oy + 8), R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h)); };
  const snow = se === 'dong', main = Math.round(bw/P), rH = Math.round(bh/P**4), tw = Math.round(bh/P**3), th = Math.round(bh*P);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ox + 6, oy + bh - 2, bw, 10);
  // thân gạch đỏ + vữa
  R('#b8432f', 0, rH, bw, bh - rH); g.fillStyle = 'rgba(0,0,0,.08)'; for(let y = rH + 4; y < bh; y += 8) for(let x = ((y/8) % 2)*10; x < bw; x += 20) g.fillRect(ox + x, oy + y, 18, 1);
  R('#f2ede4', 0, rH - 6, bw, 8); R('#d9d2c5', 0, rH + 1, bw, 2); R('#8f2f20', 0, bh - 8, bw, 8);
  // 2 cửa gara (cao/rộng ≈ φ), cửa mở thấy nền tối + đèn trần
  const dw = Math.round((main - 40)/2.2), dh = Math.min(bh - rH - 52, Math.round(dw*P*.95));
  for(let i = 0; i < 2; i++){ const x = 14 + i*(dw + Math.round(dw*.2) + 6), y = bh - 8 - dh;
    R('#f2ede4', x - 6, y - 6, dw + 12, dh + 6); R('#2a2a33', x, y, dw, dh); R('#3a3a46', x, y, dw, 10); for(let k = 0; k < 4; k++) R('#ececf2', x + 2, y + 2 + k*3, dw - 4, 1);
    R('#ffe9a8', x + dw/2 - 8, y + 14, 16, 3); R('#ffd23f', x + 4, y + dh - 3, dw - 8, 3);
    R('#c8221b', x - 6, y - 14, dw + 12, 8); R('#fff', x + dw/2 - 10, y - 12, 20, 4); }
  // biển chữ
  const sgn = v51tPixText('CỨU HỎA 114', '#fff6c8', 2, '#5a1a10'); R('#7a1f17', main/2 - sgn.width/2 - 8, rH + 6, sgn.width + 16, 38); g.drawImage(sgn, ox + main/2 - sgn.width/2, oy + rH + 8);
  // cánh phải: văn phòng 2 tầng (cửa sổ 1:φ) + cửa người đi
  const wx = main + 12, ww = bw - main - 24 - tw, fl = (bh - rH - 14)/2;
  for(let f = 0; f < 2; f++) for(let k = 0; k < 2; k++){ const w = Math.round(ww/2 - 10), h = Math.round(Math.min(fl - 18, w*P*.7)), x = wx + k*(ww/2) + 4, y = rH + 10 + f*fl;
    R('#f2ede4', x - 3, y - 3, w + 6, h + 6); R('#7fc8e8', x, y, w, h); R('#bfe8f8', x, y, w, 4); R('#f2ede4', x + w/2 - 1, y, 2, h); }
  // tháp phơi vòi (rộng bh/φ³, cao bh·φ) + đèn đỏ trên đỉnh
  const tx = bw - tw - 4; R('#a63a28', tx, bh - th, tw, th); R('#f2ede4', tx - 3, bh - th - 6, tw + 6, 8); R('#c8221b', tx + 4, bh - th - 16, tw - 8, 10);
  for(let y = bh - th + 14; y < bh - 30; y += 34){ R('#3a2f2a', tx + tw/2 - 7, y, 14, 20); R('#ffe9a8', tx + tw/2 - 5, y + 2, 10, 3); }
  R('#f2ede4', tx + tw/2 - 1, bh - th - 40, 2, 24);
  // mái: lan can + bình nước, tuyết mùa đông
  R('#e6dfd2', -4, rH - 12, bw + 8, 6); for(let x = 0; x < bw - tw - 8; x += 14) R('#cfc6b6', x, rH - 18, 3, 6);
  if(snow){ R('#ffffff', -6, rH - 14, bw - tw + 2, 5); R('#ffffff', tx - 4, bh - th - 10, tw + 8, 5); }
  c.ox = ox; c.oy = oy; c.tw = tw; c.th = th; V53C.spr[key] = c; return c;
}
// ---------- 2. sprite đồn cảnh sát ----------
function v53cPoliceSpr(se){
  const key = 'ps' + se; if(V53C.spr[key]) return V53C.spr[key]; const G = v53cGeo('police'), P = V53C_PHI, bw = G.bw, bh = G.bh, ox = 12, oy = 70;
  const [c, g] = v53cCv(bw + 24, bh + oy + 8), R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h)); };
  const snow = se === 'dong', rH = Math.round(bh/P**4), mid = Math.round(bw/P/P);    // sảnh giữa rộng bw/φ²
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ox + 6, oy + bh - 2, bw, 10);
  R('#eef1f7', 0, rH, bw, bh - rH); R('#1d2c55', 0, rH, bw, 10); R('#2f62c9', 0, rH + 10, bw, 4); R('#c9d0de', 0, bh - 10, bw, 10);
  // sảnh giữa: 4 cột, cửa kính, bậc thềm
  const mx = (bw - mid)/2; R('#dfe5f0', mx, rH + 14, mid, bh - rH - 24);
  for(let i = 0; i < 4; i++) R('#ffffff', mx + 6 + i*((mid - 18)/3), rH + 64, 6, bh - rH - 76);
  const dw = Math.round(mid/P/P), dh = Math.round(dw*P); R('#24324f', bw/2 - dw/2 - 3, bh - 10 - dh - 3, dw + 6, dh + 3); R('#8fd0f0', bw/2 - dw/2, bh - 10 - dh, dw/2 - 1, dh); R('#7cc2e6', bw/2 + 1, bh - 10 - dh, dw/2 - 1, dh);
  for(let i = 0; i < 3; i++) R(i % 2 ? '#c4cbd9' : '#d4dae6', bw/2 - dw/2 - 10 - i*6, bh - 10 + i*3, dw + 20 + i*12, 3);
  // cánh hai bên: 2 tầng cửa sổ
  for(const sx of [0, mx + mid]) for(let f = 0; f < 2; f++) for(let k = 0; k < 2; k++){ const w = Math.round(mx/2 - 16), h = Math.round(Math.min((bh - rH - 76)/2 - 12, w*P*.6)), x = sx + 10 + k*(mx/2), y = rH + 64 + f*((bh - rH - 76)/2);
    R('#1d2c55', x - 2, y - 2, w + 4, h + 4); R('#9cd4f2', x, y, w, h); R('#cdeefc', x, y, w, 3); }
  const sgn = v51tPixText('CẢNH SÁT 113', '#ffffff', 2, '#0d1838'); R('#1d2c55', bw/2 - sgn.width/2 - 8, rH + 20, sgn.width + 16, 36); g.drawImage(sgn, ox + bw/2 - sgn.width/2, oy + rH + 21);
  // mái + đèn hiệu xanh/đỏ trên nóc (vẽ động phần sáng)
  R('#cfd6e3', -4, rH - 8, bw + 8, 8); R('#1d2c55', bw/2 - 26, rH - 20, 52, 12); R('#2f62c9', bw/2 - 24, rH - 18, 22, 8); R('#d23b3b', bw/2 + 2, rH - 18, 22, 8);
  if(snow) R('#ffffff', -6, rH - 12, bw + 12, 5);
  c.ox = ox; c.oy = oy; V53C.spr[key] = c; return c;
}
// ---------- 3. sprite Tháp Rubik 81 + bục đế ----------
function v53cTowerCols(){
  const G = v53cGeo('tower81'), cw = Math.round(G.tw/7), A = [];
  for(let i = 0; i < 7; i++){ const k = Math.abs(i - 3); A.push({i, k, x:i*cw - G.tw/2, w:cw, h:Math.round(G.th*Math.pow(V53C_PHI, -k/2))}); } return A;   // x so với tâm
}
function v53cTowerSpr(se){
  const key = 'tw' + se; if(V53C.spr[key]) return V53C.spr[key]; const G = v53cGeo('tower81'), P = V53C_PHI, W = G.W, bh = G.bh, pod = Math.round(bh/P), spire = Math.round(G.th/P**4);
  const ox = 12, oy = G.th + spire + 30, [c, g] = v53cCv(W + 24, oy + bh + 8), cx = ox + W/2, base = oy + bh - pod;   // chân tháp = mái bục
  const snow = se === 'dong';
  // bóng tháp đổ xuống bục
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(ox + 6, oy + bh - 2, W, 10);
  const cols = v53cTowerCols();
  // cột: kính phản chiếu trời (sáng trái, tối phải), vạch tầng 1000/81 ≈ 12.3, đầu cột vát chéo kiểu ống tre
  cols.forEach(cl => { const x = cx + cl.x, top = base - cl.h, lt = 1 - cl.i/7;
    const gr = g.createLinearGradient(x, 0, x + cl.w, 0); gr.addColorStop(0, `rgb(${170 + lt*50},${205 + lt*35},${228 + lt*20})`); gr.addColorStop(.55, '#6f9dc4'); gr.addColorStop(1, '#2f5a86');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, base); g.lineTo(x, top + 10); g.lineTo(x + cl.w, top - 8 + (cl.i < 3 ? 14 : cl.i > 3 ? -2 : 0)); g.lineTo(x + cl.w, base); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)'; for(let y = base - 12; y > top + 6; y -= 12.35) g.fillRect(x + 1, Math.round(y), cl.w - 2, 1);
    g.fillStyle = 'rgba(20,40,70,.35)'; for(let xx = x + 11; xx < x + cl.w - 2; xx += 11) g.fillRect(Math.round(xx), top + 6, 1, base - top - 6);
    g.fillStyle = '#e9eef5'; g.beginPath(); g.moveTo(x, top + 10); g.lineTo(x + cl.w, top - 8 + (cl.i < 3 ? 14 : cl.i > 3 ? -2 : 0)); g.lineTo(x + cl.w, top - 3 + (cl.i < 3 ? 14 : cl.i > 3 ? -2 : 0)); g.lineTo(x, top + 15); g.fill();   // vương miện ống tre
    g.fillStyle = 'rgba(10,20,40,.55)'; g.fillRect(x + cl.w - 1, top, 1, base - top);
    // đốt tre: vòng sáng ở các độ cao vàng của cột
    for(const f of [1/P, 1/P/P]){ const y = Math.round(base - cl.h*f); g.fillStyle = '#dfe7f0'; g.fillRect(x, y - 2, cl.w, 4); } });
  // dải nhà hàng (tầng 61) & đài quan sát (tầng 81) trên 3 cột giữa
  const fy = n => Math.round(base - n*G.th/81), mid = cols.slice(2, 5), mx0 = cx + mid[0].x, mx1 = cx + mid[2].x + mid[2].w;
  g.fillStyle = '#20324f'; g.fillRect(mx0 - 4, fy(62), mx1 - mx0 + 8, Math.round(G.th/81*1.6)); g.fillStyle = '#ffd98a'; for(let x = mx0; x < mx1; x += 7) g.fillRect(x, fy(62) + 4, 4, 9);
  const c3 = cols[3], dx0 = cx + c3.x - 10, dx1 = cx + c3.x + c3.w + 10; g.fillStyle = '#1b2a44'; g.fillRect(dx0, fy(81) - 6, dx1 - dx0, 16); g.fillStyle = '#bfefff'; g.fillRect(dx0 + 3, fy(81) - 3, dx1 - dx0 - 6, 8);
  g.fillStyle = '#e9eef5'; g.fillRect(dx0 - 2, fy(81) + 10, dx1 - dx0 + 4, 3);
  // chóp ăng-ten (cao Ht/φ⁴)
  const stop = base - G.th; g.fillStyle = '#c9d2de'; g.fillRect(cx - 3, stop - spire, 6, spire); g.fillStyle = '#8d97a6'; for(let y = stop - spire + 10; y < stop; y += 18) g.fillRect(cx - 6, y, 12, 2);
  // bục đế: kính tầng thấp, mái hiên, cửa xoay, biển tên
  const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h)); };
  R('#e8ecf3', 0, bh - pod, W, pod); R('#c7cfdc', 0, bh - pod, W, 6); for(let x = 8; x < W - 8; x += Math.round(W/13)){ R('#7fb6dc', x, bh - pod + 16, Math.round(W/13) - 6, pod - 30); R('rgba(255,255,255,.35)', x + 2, bh - pod + 18, 3, pod - 34); }
  const dw = Math.round(pod/P), dhh = Math.round(pod - 22); R('#2a3550', W/2 - dw/2 - 4, bh - 6 - dhh, dw + 8, dhh); R('#9fe3f5', W/2 - dw/2, bh - 6 - dhh + 4, dw, dhh - 4); R('#e8ecf3', W/2 - 1, bh - 6 - dhh + 4, 2, dhh - 4);
  R('#c9a24a', W/2 - dw, bh - pod - 4, dw*2, 8);
  const sg = v51tPixText('THÁP RUBIK 81', '#ffe9a8', 1, '#3a2a00'); g.drawImage(sg, ox + W/2 - sg.width/2, oy + bh - pod - 22);
  for(let i = 0; i < 6; i++) R(V51T_RUBIK[i], W/2 - 48 + i*16, bh - 8, 14, 4);
  if(snow){ R('#ffffff', -2, bh - pod - 3, W + 4, 4); }
  c.ox = ox; c.oy = oy; c.base = base - oy; c.pod = pod; c.spire = spire; V53C.spr[key] = c; return c;
}
// lớp sáng ban đêm của tháp (cửa sổ sáng ngẫu nhiên cố định), cache
function v53cTowerGlow(){
  if(V53C.spr.twg) return V53C.spr.twg; const b = v53cTowerSpr('ha'), G = v53cGeo('tower81'), [c, g] = v53cCv(b.width, b.height), cx = b.ox + G.W/2, base = b.oy + b.base;
  v53cTowerCols().forEach(cl => { const x = cx + cl.x; for(let y = base - 12, n = 0; y > base - cl.h + 14; y -= 12.35, n++) for(let xx = x + 2; xx < x + cl.w - 4; xx += 11){ const h = Math.sin(xx*12.9898 + n*78.233)*43758.5453, q = h - Math.floor(h); if(q < .64) continue;
    g.fillStyle = q > .9 ? 'rgba(255,214,140,.55)' : 'rgba(150,200,255,.35)'; g.fillRect(Math.round(xx) + 1, Math.round(y) - 7, 6, 4); } });
  const fy = n => Math.round(base - n*G.th/81); g.fillStyle = 'rgba(255,214,140,.9)'; g.fillRect(cx - 70, fy(62) + 2, 140, 13); g.fillStyle = 'rgba(160,240,255,.95)'; g.fillRect(cx - 30, fy(81) - 4, 60, 10);
  g.fillStyle = 'rgba(255,220,150,.35)'; for(let x = 8; x < G.W - 8; x += Math.round(G.W/13)) g.fillRect(b.ox + x, b.oy + G.bh - b.pod + 16, Math.round(G.W/13) - 6, b.pod - 30);
  V53C.spr.twg = c; return c;
}

// ---------- 4. nền (nướng vào ô đất): sân bê tông, bãi đỗ, quảng trường xoắn ốc vàng ----------
function v53cGround(g, id, thumb){
  const G = v53cGeo(id), dong = typeof season === 'string' && season === 'dong', P = V53C_PHI;
  if(id === 'tower81'){
    const f = {x0:G.x0, y0:G.gy, x1:G.x1, y1:G.y1}; g.fillStyle = dong ? '#e9ebf0' : '#dcd6c8'; g.fillRect(f.x0 - 10, G.gy - 6, f.x1 - f.x0 + 20, f.y1 - G.gy + 16);
    if(!thumb){ g.strokeStyle = 'rgba(160,130,70,.45)'; g.lineWidth = 3; g.beginPath(); const sx = G.cx, sy = G.gy + (G.y1 - G.gy)/2 + 6; for(let a = 0; a < 4.2*Math.PI; a += .08){ const r = 3*Math.pow(P, a/(Math.PI/2)); if(r > 70) break; const x = sx + Math.cos(a)*r, y = sy + Math.sin(a)*r*.6; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.fillStyle = '#7fc8e8'; g.beginPath(); g.ellipse(sx, sy, 34, 20, 0, 0, 7); g.fill(); g.fillStyle = '#bfe8f8'; g.beginPath(); g.ellipse(sx, sy - 2, 18, 9, 0, 0, 7); g.fill(); }
    g.fillStyle = '#c6bfae'; g.fillRect(G.door[0] - 40, G.gy, 80, G.y1 - G.gy + 34);
    for(const px of [G.x0 + 40, G.x1 - 40]){ g.fillStyle = '#9aa1b2'; g.fillRect(px - 18, G.y1 - 46, 36, 16); g.fillStyle = dong ? '#e8f0f6' : '#3f9a46'; g.beginPath(); g.arc(px, G.y1 - 50, 16, 0, 7); g.fill(); }
    return;
  }
  const fire = id === 'fire', ap = {x0:G.x0 - 6, y0:G.gy - 4, x1:G.x1 + 6, y1:G.y1 + 6};
  g.fillStyle = dong ? '#e4e6ec' : '#c9c6bd'; g.fillRect(ap.x0, ap.y0, ap.x1 - ap.x0, ap.y1 - ap.y0);
  for(let i = 0; i < 3; i++){ const bx = G.side.x0 + 36 + i*((G.side.x1 - G.side.x0 - 72)/2), by = G.y0 + 40 + (i % 2)*60; g.fillStyle = dong ? '#e8f0f6' : '#3f9a46'; g.beginPath(); g.arc(bx, by, 20, 0, 7); g.fill(); g.fillStyle = dong ? '#d5e2ec' : '#348a3c'; g.beginPath(); g.arc(bx + 6, by + 6, 12, 0, 7); g.fill(); }
  // lối ra đường
  g.fillStyle = '#a9a59b'; g.fillRect(G.door[0] - 44, G.y1 - 10, 88, 46);
  if(fire){
    g.fillStyle = '#e8372c'; for(let i = 0; i < 2; i++){ const x = G.x0 + 14 + i*96; g.fillRect(x, G.gy + 2, 84, 4); }
    g.fillStyle = '#ffd23f'; for(let x = G.x0 + 10; x < G.x0 + G.bw - 10; x += 26) g.fillRect(x, G.y1 - 18, 14, 5);              // vạch cấm đỗ
    // sân tập: trụ nước cứu hỏa, cọc tiêu, vòi cuộn
    const sx = G.side.x0 + 40, sy = G.gy + 50; g.fillStyle = '#c8221b'; g.fillRect(sx - 7, sy - 18, 14, 20); g.fillRect(sx - 11, sy - 12, 22, 5); g.fillStyle = '#ffd23f'; g.fillRect(sx - 4, sy - 22, 8, 4);
    for(let i = 0; i < 4; i++){ const x = G.side.x0 + 90 + i*28, y = G.gy + 96; g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x - 7, y); g.lineTo(x + 7, y); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 4, y - 9, 8, 3); }
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; g.beginPath(); g.arc(G.side.x1 - 50, G.gy + 46, 16, 0, 7); g.stroke(); g.beginPath(); g.arc(G.side.x1 - 50, G.gy + 46, 9, 0, 7); g.stroke();
  } else {
    // bãi đỗ xe kẻ vạch + vạch qua đường tập
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; for(let i = 0; i < 4; i++){ const x = G.side.x0 + 20 + i*52; g.beginPath(); g.moveTo(x, G.gy + 20); g.lineTo(x, G.gy + 110); g.stroke(); }
    g.fillStyle = '#3a3d45'; g.fillRect(G.x0 + 20, G.y1 - 54, G.bw - 40, 40); g.fillStyle = '#f4f4f4'; for(let x = G.x0 + 30; x < G.x0 + G.bw - 30; x += 22) g.fillRect(x, G.y1 - 50, 12, 32);
    const fx = G.side.x1 - 28, fy = G.y0 + 30; g.fillStyle = '#9aa1b2'; g.fillRect(fx - 10, fy + 120, 20, 8);   // chân cột cờ (cột vẽ động)
  }
}
// ảnh thu nhỏ cho chế độ sắp xếp (v48)
function v53cThumb(id){
  const G = v53cGeo(id), s = .25, [c, g] = v53cCv(Math.round(G.W*s), Math.round(G.H*s)); g.scale(s, s); g.translate(-G.x0, -G.y0); v53cGround(g, id, true);
  const b = v53cSprOf(id); g.drawImage(b, G.x0 - b.ox, G.y0 - b.oy); return c;
}
function v53cSprOf(id){ const se = typeof season === 'string' ? season : 'ha'; return id === 'fire' ? v53cFireSpr(se) : id === 'police' ? v53cPoliceSpr(se) : v53cTowerSpr(se); }

// ---------- 5. vẽ trên đảo (sau bờ biển, trước người đi lại) ----------
function v53cVis(G, VBn, top){ return !(G.x1 < VBn.x0 - 40 || G.x0 > VBn.x1 + 40 || G.y1 + 40 < VBn.y0 || G.y0 - top > VBn.y1); }
function v53cWorld(VBn){
  if(typeof cam === 'undefined') return; const t = realT;
  for(const id of v53cIds()){ const G = v53cGeo(id), b = v53cSprOf(id); if(!v53cVis(G, VBn, b.oy)) continue;
    ctx.drawImage(b, G.x0 - b.ox, G.y0 - b.oy);
    if(id === 'fire'){ const tx = G.x0 + G.bw - b.tw - 4 + b.tw/2, ty = G.y0 + G.bh - b.th - 46; ctx.fillStyle = (Math.floor(t*1.4) % 2) ? '#ff3b3b' : '#7a1f1f'; ctx.fillRect(tx - 3, ty - 3, 6, 6); }
    if(id === 'police'){ const on = Math.floor(t*3) % 2, rH = Math.round(G.bh/V53C_PHI**4), bx = G.x0 + G.bw/2, by = G.y0 + rH - 18; ctx.fillStyle = on ? '#4f8bff' : '#1d3c8a'; ctx.fillRect(bx - 24, by, 22, 8); ctx.fillStyle = on ? '#8a1f1f' : '#ff4d4d'; ctx.fillRect(bx + 2, by, 22, 8);
      const fx = G.side.x1 - 28, fy = G.y0 + 30; ctx.fillStyle = '#c9ced8'; ctx.fillRect(fx - 2, fy - 20, 4, 140); ctx.fillStyle = '#1d2c55'; const w = Math.sin(t*3)*3; ctx.beginPath(); ctx.moveTo(fx + 2, fy - 20); ctx.lineTo(fx + 40, fy - 12 + w); ctx.lineTo(fx + 2, fy + 2); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(fx + 12, fy - 13 + w/2, 6, 6); }
    if(id === 'tower81') v53cTowerLive(G, b, t, VBn);
  }
  try { v53cVehDraw(VBn); } catch(e){ console.warn('v53c veh', e); }
  try { v53cFireDraw(VBn); } catch(e){ console.warn('v53c fire', e); }
  // nhãn khi lại gần cửa
  if(V53C.near && cam.z >= .45 && !V53C.mode){ const G = v53cGeo(V53C.near), D = V53C_Z[V53C.near], fs = 17/Math.max(.8, cam.z), lx = G.door[0], ly = G.gy - (V53C.near === 'tower81' ? 120 : G.bh + 30);
    ctx.font = "800 " + fs.toFixed(1) + "px Nunito, 'Be Vietnam Pro', sans-serif"; const s = D.ic + ' ' + D.vi, w = ctx.measureText(s).width + fs;
    ctx.fillStyle = 'rgba(11,16,32,.8)'; ctx.fillRect(lx - w/2, ly - fs*.8, w, fs*1.6); ctx.fillStyle = '#ffe36e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, lx, ly); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}
// phần động của tháp (ban ngày): đèn chớp đỉnh; chi tiết LED ban đêm vẽ ở lớp sáng
function v53cTowerLive(G, b, t){
  const x = G.x0 + G.W/2, top = G.y0 + b.base - G.th - b.spire; if(Math.floor(t*1.25) % 2 === 0){ ctx.fillStyle = '#ff3030'; ctx.fillRect(x - 4, top - 6, 8, 8); } else { ctx.fillStyle = '#7a1f1f'; ctx.fillRect(x - 3, top - 5, 6, 6); }
}
// sau lớp tối: cửa sổ sáng, LED đổi màu theo cột, đèn chớp đỉnh, biển trạm
function v53cGlowNight(VBn){
  const dk = typeof v25Ramp === 'function' ? v25Ramp(clock, 1080, 330) : 0; if(typeof cam === 'undefined') return; const t = realT;
  { const G = v53cGeo('tower81'), b = v53cTowerSpr('ha'); if(v53cVis(G, VBn, b.oy)){ const X = G.x0 - b.ox, Y = G.y0 - b.oy, cx = G.x0 + G.W/2, base = G.y0 + b.base;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if(dk > 0){ ctx.globalAlpha = dk*.75; ctx.drawImage(v53cTowerGlow(), X, Y);
      // LED dọc mép cột, đổi màu chậm theo cầu vồng; vòng sáng chạy lên đỉnh
      const cols = v53cTowerCols(), run = (t*.35) % 1; ctx.globalAlpha = dk;
      cols.forEach(cl => { const hue = (t*24 + cl.i*40) % 360, x = cx + cl.x; ctx.fillStyle = `hsla(${hue},90%,55%,.2)`; ctx.fillRect(x, base - cl.h + 10, cl.w, cl.h - 10); ctx.fillStyle = `hsla(${hue},95%,62%,.95)`; ctx.fillRect(x, base - cl.h + 12, 3, cl.h - 12); ctx.fillRect(x + cl.w - 3, base - cl.h + 6, 3, cl.h - 6);
        const ry = base - cl.h*run; ctx.fillStyle = `hsla(${(hue + 180) % 360},95%,70%,.9)`; ctx.fillRect(x, ry, cl.w, 3); });
      const gw = v53cGlow('rgba(255,236,170,1)'); ctx.globalAlpha = dk*.6; ctx.drawImage(gw, cx - 90, base - G.th*61/81 - 60, 180, 120); }
    // đèn chớp đỉnh (trắng ban ngày, đỏ ban đêm) — luôn bật
    const st = base - G.th - b.spire; if((t*1.25) % 1 < .18){ ctx.globalAlpha = .9; ctx.drawImage(v53cGlow(dk > .2 ? 'rgba(255,60,50,1)' : 'rgba(255,255,255,1)'), cx - 22, st - 22, 44, 44); }
    ctx.restore(); } }
  if(dk <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = dk*.8;
  for(const id of ['fire', 'police']){ const G = v53cGeo(id); if(!v53cVis(G, VBn, 200)) continue; const gw = v53cGlow(id === 'fire' ? 'rgba(255,120,80,1)' : 'rgba(120,170,255,1)'); ctx.drawImage(gw, G.door[0] - 70, G.gy - 110, 140, 120); }
  ctx.restore();
}

// ---------- 6. vào khu: nút khi đứng gần cửa, chạm vào toà nhà ----------
function v53cTick(){
  if(V53C.mode || typeof V46 === 'undefined' || !V46.on || V46.sky || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible || (typeof V51P !== 'undefined' && V51P.on)){ v53cEnterBtn(null); V53C.near = ''; return; }
  const p = v46Pos(PLAYER); let near = '';
  for(const id of v53cIds()){ const G = v53cGeo(id), d = Math.hypot(p[0] - G.door[0], p[1] - (G.gy + 24)); if(d < (id === 'tower81' ? 110 : 120)) near = id;
    else if(Math.hypot(p[0] - G.cx, p[1] - G.cy) < 640 && performance.now() - (V53CW.msgT[id] || 0) > 150000){ V53CW.msgT[id] = performance.now(); const D = V53C_Z[id];
      toast(D.ic + ' ' + D.vi + (id === 'fire' ? ' — số khẩn cấp 114. Tới cửa để lái xe cứu hỏa!' : id === 'police' ? ' — số khẩn cấp 113. Tới cửa để nhận nhiệm vụ giúp đỡ!' : ' — 81 tầng, đài quan sát trên đỉnh. Tới cửa để đi thang máy!')); } }
  V53C.near = near; v53cEnterBtn(near || null);
}
function v53cEnterBtn(id){
  let b = document.getElementById('v53cEnter'); if(!b){ if(!id) return; b = document.createElement('button'); b.type = 'button'; b.id = 'v53cEnter'; b.onclick = () => { if(b._id) v53cOpen(b._id); }; (document.getElementById('stage') || document.body).appendChild(b); }
  if(!id){ b.hidden = true; b._id = ''; return; } if(b._id !== id){ const D = V53C_Z[id]; b._id = id; b.className = 'v53cEnter v53c-' + id; b.innerHTML = D.ic + ' ' + (id === 'tower81' ? 'Vào Tháp Rubik 81' : 'Vào ' + D.vi) + ' <small>' + D.en + '</small>'; } b.hidden = false;
}
function v53cTapWorld(e){
  if(V53C.mode || typeof V46 === 'undefined' || !V46.on || V46.sky || !PLAYER || !PLAYER.visible || (typeof V51P !== 'undefined' && V51P.on)) return false;
  const r = cvs.getBoundingClientRect(), wx = cam.x + (e.clientX - r.left - cw/2)/cam.z, wy = cam.y + (e.clientY - r.top - ch/2)/cam.z, p = v46Pos(PLAYER);
  for(const id of v53cIds()){ const G = v53cGeo(id), top = id === 'tower81' ? G.th + 120 : 160; if(wx < G.b.x0 || wx > G.b.x1 || wy < G.b.y0 - top || wy > G.b.y1) continue;
    if(Math.hypot(p[0] - G.door[0], p[1] - G.gy) > 420){ toast(V53C_Z[id].ic + ' Đi tới cửa ' + V53C_Z[id].vi + ' để vào nhé.'); return false; } v53cOpen(id); return true; }
  return false;
}

// ---------- 7. gắn vào đảo v46 ----------
function v53cWorldInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return;
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); try { v53cWorld(VBn); } catch(e){ console.warn('v53c world', e); } };
  const li0 = v46Lighting; v46Lighting = function(VBn){ li0(VBn); try { v53cGlowNight(VBn); v53cNightFx(VBn); } catch(e){} };
  const p0 = v46Paint; v46Paint = function(g, x0, y0, w, h, lod){ p0(g, x0, y0, w, h, lod); for(const id of v53cIds()){ const G = v53cGeo(id); if(G.x1 + 20 < x0 || G.x0 - 20 > x0 + w || G.y1 + 40 < y0 || G.y0 > y0 + h) continue; try { v53cGround(g, id, lod === 2); } catch(e){} } };
  const ob0 = v46OverviewBuildings; v46OverviewBuildings = function(g){ ob0(g); for(const id of v53cIds()){ try { const G = v53cGeo(id), b = v53cSprOf(id); g.drawImage(b, G.x0 - b.ox, G.y0 - b.oy); } catch(e){} } };
  // đường: tránh toà nhà + một lối rẽ ra đường gần nhất
  const ob = v46Obst; v46Obst = function(pad){ const o = ob(pad); for(const id of v53cIds()){ const G = v53cGeo(id); o.push({x0:G.x0 - pad, y0:G.y0 - pad - 40, x1:G.x1 + pad, y1:G.y1 + pad, z:V53CW.oz[id]}); } return o; };
  const rd0 = v46Roads; v46Roads = function(){ rd0(); try { const obs = v46Obst(46); for(const id of v53cIds()){ const G = v53cGeo(id), e = [G.door[0], G.y1 + 6], q = v46Nearest(e[0], e[1]), t = V46R.nodes[q], n = Math.max(2, Math.ceil(Math.hypot(t[0] - e[0], t[1] - e[1])/50));
      let P = []; for(let i = 0; i <= n; i++) P.push([e[0] + (t[0] - e[0])*i/n, e[1] + (t[1] - e[1])*i/n]); P = P.map((p, i) => i === 0 || i === n ? p : v46Push(p, obs, V53CW.oz[id])); V46R.lines.push({P, closed:false, w:V46L.roads.path, k:'spoke', z:id}); }
      v46Graph(); } catch(e){ console.warn('v53c road', e); } };
  const clean = () => { const bad = (x, y) => v53cIds().some(id => { const G = v53cGeo(id); return x > G.x0 - 40 && x < G.x1 + 40 && y > G.y0 - 30 && y < G.y1 + 60; });
    V46T.deco = V46T.deco.filter(t => !bad(t.x, t.y)); if(V46T.lamps) V46T.lamps = V46T.lamps.filter(([x, y]) => !bad(x, y)); };
  const d0 = v46Deco; v46Deco = function(){ d0(); try { clean(); } catch(e){} };
  try { v46Roads(); v46Deco(); V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; V46RC.clear(); V46G.key = ''; } catch(e){ console.warn('v53c rebuild', e); }
  // chặn đi xuyên toà nhà
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){
    const r = cm0(ox, oy, nx, ny); if(!r || !V46.on || V46.sky || !v46Raw(nx)) return r; const x = nx - V46E, y = ny;
    for(const id of v53cIds()){ const G = v53cGeo(id); if(x > G.b.x0 - 4 && x < G.b.x1 + 4 && y > G.b.y0 - 6 && y < G.gy + 4) return false; } return r; };
  // đèn đêm
  const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(!V46.on || V46.sky) return; const on = v25Ramp(clock, 1080, 330); if(on <= 0) return;
    V46.raw = true; try { for(const id of v53cIds()){ const G = v53cGeo(id); v25Push(G.door[0], G.gy - 20, 120, on, 2); if(id === 'tower81'){ v25Push(G.cx, G.gy - 60, 220, on, 3); v25Push(G.cx, G.y1, 140, on*.8, 2); } else v25Push(G.door[0], G.y1 - 20, 120, on*.8, 2); } } finally { V46.raw = false; } };
  if(typeof mapPlaces === 'function'){ const mp0 = mapPlaces; mapPlaces = function(){ const P = mp0(); if(!V46.on || !Array.isArray(P) || P.some(p => p.k === 'v53c')) return P;
    for(const id of v53cIds()){ const G = v53cGeo(id), D = V53C_Z[id], d = [G.door[0], G.gy + 24]; P.push({k:'v53c', name:D.vi, icon:D.ic, x:G.cx, y:G.cy, ox:d[0] + V46E, oy:d[1], door:[d[0] + V46E, d[1]], r:true}); } return P; }; }
  cvs.addEventListener('pointerdown', e => { V53CW.dn = [e.clientX, e.clientY, performance.now()]; }, true);
  cvs.addEventListener('pointerup', e => { if(e.pointerType === 'mouse' && e.button !== 0) return; if(V53CW.dn && Math.hypot(e.clientX - V53CW.dn[0], e.clientY - V53CW.dn[1]) < 10 && performance.now() - V53CW.dn[2] < 450) v53cTapWorld(e); V53CW.dn = null; }, true);
  setInterval(() => { try { v53cTick(); } catch(e){} }, 250);
}
