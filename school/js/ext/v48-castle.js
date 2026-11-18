// ================= v48 · Session 12: LÂU ĐÀI TRƯỜNG RUBIK + ĐŨA THẦN (phép tốt) =================
// Kiến trúc tự thiết kế: tháp đá tròn mái nhọn, lỗ châu mai, hào nước + cầu đá trước cửa vòm Đại sảnh, cờ màu Rubik,
// tượng Rubik trước Đại sảnh, đèn đêm ấm. Mọi thứ vẽ theo toạ độ MỚI của khu (V46.ZI[id].nr) nên đi theo khu khi khu dời chỗ.
// Đũa thần: nhận ở Đại sảnh (PROF.inv.v48wand), 8 phép tốt, chạm vật phát sáng gần nhân vật. Mọi tên có tiền tố v48c.
const V48C_PHI = 1.618;
const V48C_RUBIK = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'];
const V48C_ROOMS = ['rubik', 'chess', 'music', 'hall', 'elec', 'office'];
const V48C_ROOF = {rubik:'#4b55b8', chess:'#5d4a8f', music:'#6a3fa0', hall:'#3b4fa6', elec:'#2f7f9a', office:'#4a6aa0'};
const V48C_DAY = 12;   // số lần phép có thưởng mỗi ngày
const V48C = {bb:[], cache:{}, on:false, pts:[], txt:[], bfly:[], rb:-99, items:null, held:null, tap:null, card:null, btn:null, msgT:0, near:0, perf:0};

// ---------- hình học ----------
function v48cNR(id){ const z = V46 && V46.ZI && V46.ZI[id]; return z ? z.nr : null; }
function v48cHall(){
  const n = v48cNR('hall'); if(!n || !R.hall || !R.hall.dw) return null; const d = v46N(V46.ZI.hall, R.hall.dw[0], R.hall.dw[1]), o = 8, wd = 22;
  return {n, door:d, inn:{x0:n.x0 - o, y0:n.y0 - o, x1:n.x1 + o, y1:n.y1 + o}, out:{x0:n.x0 - o - wd, y0:n.y0 - o - wd, x1:n.x1 + o + wd, y1:n.y1 + o + wd},
    br:{x0:n.x0 - o - wd - 8, x1:n.x0 + 2, y0:d[1] - 36, y1:d[1] + 36}};
}
// tượng Rubik: bên kia đường, nhìn thẳng vào cửa vòm Đại sảnh · vườn phép thuật: hình chữ nhật vàng cạnh Đại sảnh
function v48cStatueAt(H){ return [H.door[0] - 152, H.door[1] - 4]; }
function v48cGarden(H){ const w = 230, h = Math.round(w/V48C_PHI); return {x0:H.out.x1 + 30, y0:H.n.y1 - h + 14, w, h, x1:H.out.x1 + 30 + w, y1:H.n.y1 + 14}; }
function v48cPedestal(H){ return [H.n.x0 + 26, H.door[1] - 62]; }
const v48cIn = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
function v48cWater(x, y){ const H = v48cHall(); return !!H && v48cIn(H.out, x, y) && !v48cIn(H.inn, x, y) && !v48cIn(H.br, x, y); }

// ---------- 1. LÂU ĐÀI: tháp, mái nhọn, châu mai, cổng vòm (ảnh tĩnh cache theo khu) ----------
function v48cTower(g, cx, base, tw, roof, night, tall, flags){
  const bh = tall ? tw*V48C_PHI : tw*.62, x = cx - tw/2, top = base - bh;
  V48C.bb.push([x - 9, tall ? top - 6 - bh*V48C_PHI*.82 - 30 : top - 14, x + tw + 30, base + 9]);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(cx + 5, base + 3, tw*.62, tw*.2, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#d9d0be'; g.fillRect(x, top, tw, bh);
  g.fillStyle = 'rgba(70,50,30,.2)'; g.fillRect(x + tw/V48C_PHI, top, tw - tw/V48C_PHI, bh);   // bóng đổ chia theo tỷ lệ vàng
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x, top, 3, bh);
  g.fillStyle = 'rgba(90,70,50,.18)'; for(let y = top + 8, k = 0; y < base - 4; y += 9, k++){ g.fillRect(x, y, tw, 1.5); for(let bx = x + (k % 2 ? 6 : 13); bx < x + tw - 2; bx += 14) g.fillRect(bx, y - 7.5, 1.5, 7.5); }
  g.fillStyle = '#a99c86'; g.fillRect(x - 2, base - 6, tw + 4, 6);
  // cửa sổ vòm (rộng = tw/φ², cao = rộng·φ), sáng vàng ấm khi đêm
  const ww = Math.max(6, tw/V48C_PHI/V48C_PHI), wh = ww*V48C_PHI, wy = top + bh/V48C_PHI - wh/2;
  g.fillStyle = '#5a4a3a'; g.beginPath(); g.moveTo(cx - ww/2 - 2, wy + wh + 2); g.lineTo(cx - ww/2 - 2, wy + ww/2); g.arc(cx, wy + ww/2, ww/2 + 2, Math.PI, 0); g.lineTo(cx + ww/2 + 2, wy + wh + 2); g.fill();
  g.fillStyle = night ? '#ffd27a' : '#2c3a66'; g.beginPath(); g.moveTo(cx - ww/2, wy + wh); g.lineTo(cx - ww/2, wy + ww/2); g.arc(cx, wy + ww/2, ww/2, Math.PI, 0); g.lineTo(cx + ww/2, wy + wh); g.fill();
  g.fillStyle = night ? 'rgba(255,150,40,.6)' : 'rgba(255,255,255,.35)'; g.fillRect(cx - .75, wy + 2, 1.5, wh - 2); g.fillRect(cx - ww/2, wy + wh*.55, ww, 1.5);
  // lỗ châu mai
  g.fillStyle = '#c9bfac'; g.fillRect(x - 3, top - 5, tw + 6, 7); const n = tw > 40 ? 5 : 3, mw = (tw + 6)/(2*n - 1);
  g.fillStyle = '#e4dccb'; for(let i = 0; i < n; i++) g.fillRect(x - 3 + i*2*mw, top - 12, mw, 8);
  if(!tall) return;
  // mái nhọn: cao = thân·φ
  const rh = bh*V48C_PHI*.82, ax = cx, ay = top - 6 - rh, l = x - 6, r = x + tw + 6, by = top - 4;
  g.fillStyle = roof; g.beginPath(); g.moveTo(l, by); g.quadraticCurveTo(cx - tw*.22, by - rh*.45, ax, ay); g.quadraticCurveTo(cx + tw*.22, by - rh*.45, r, by); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(cx, by); g.lineTo(ax, ay); g.quadraticCurveTo(cx + tw*.22, by - rh*.45, r, by); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.5; for(let k = 1; k < 4; k++){ const yy = by - rh*k/4.4, hw = (r - l)/2*(1 - k/4.4)*.92; g.beginPath(); g.moveTo(cx - hw, yy); g.lineTo(cx + hw, yy); g.stroke(); }
  g.fillStyle = '#e8c27a'; g.beginPath(); g.arc(ax, ay, 3.2, 0, Math.PI*2); g.fill(); g.fillStyle = '#5a4a3a'; g.fillRect(ax - 1, ay - 26, 2, 24);
  if(flags) flags.push([ax + 1, ay - 26, tw > 70 ? 1.6 : 1]);
}
// cổng vòm nhọn bằng đá (cho cửa ở tường dưới, hoặc đứng trên cầu Đại sảnh)
function v48cArch(g, cx, base, half, hgt, label){
  const top = base - hgt; if(g !== ctx){ const hw = label ? Math.max(half + 10, 62) : half + 10; V48C.bb.push([cx - hw, top - half*1.1 - 36, cx + hw, base + 3]); }
  g.strokeStyle = '#b9ae9a'; g.lineWidth = 9; g.lineCap = 'butt'; g.beginPath(); g.moveTo(cx - half, base); g.lineTo(cx - half, top); g.quadraticCurveTo(cx - half, top - half*.9, cx, top - half*1.1); g.quadraticCurveTo(cx + half, top - half*.9, cx + half, top); g.lineTo(cx + half, base); g.stroke();
  g.strokeStyle = '#ddd3c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - half - 3, base); g.lineTo(cx - half - 3, top); g.quadraticCurveTo(cx - half - 3, top - half - 2, cx, top - half*1.1 - 4); g.stroke();
  g.fillStyle = '#a99c86'; g.fillRect(cx - half - 7, base - 6, 14, 7); g.fillRect(cx + half - 7, base - 6, 14, 7);
  for(let i = 0; i < 4; i++){ g.fillStyle = V48C_RUBIK[i]; g.fillRect(cx - 7 + (i % 2)*7, top - half*1.1 - 6 + Math.floor(i/2)*7, 6, 6); }   // viên đá đỉnh vòm = mini Rubik
  if(label){ g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const w = g.measureText(label).width + 16; g.fillStyle = '#6b4a2a'; g.fillRect(cx - w/2, top - half*1.1 - 34, w, 22); g.fillStyle = '#e8c27a'; g.fillRect(cx - w/2 + 2, top - half*1.1 - 32, w - 4, 18);
    g.fillStyle = '#3a2410'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, cx, top - half*1.1 - 22); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
}
// tháp chính Đại sảnh: rộng = w/φ³, thân = rộng·φ, cửa sổ hoa hồng 3×3 màu Rubik
function v48cKeep(g, cx, base, kw, night, flags){
  const bh = kw*V48C_PHI, x = cx - kw/2, top = base - bh; V48C.bb.push([x - 10, top - 6 - kw - 44, x + kw + 14, base + 6]);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 6, base - 4, kw, 8);
  g.fillStyle = '#ddd4c2'; g.fillRect(x, top, kw, bh); g.fillStyle = 'rgba(70,50,30,.18)'; g.fillRect(x + kw/V48C_PHI, top, kw - kw/V48C_PHI, bh);
  g.fillStyle = 'rgba(90,70,50,.16)'; for(let y = top + 10, k = 0; y < base; y += 11, k++){ g.fillRect(x, y, kw, 1.5); for(let bx = x + (k % 2 ? 8 : 18); bx < x + kw - 2; bx += 20) g.fillRect(bx, y - 9.5, 1.5, 9.5); }
  const rr = kw/V48C_PHI/V48C_PHI/1.1, ry = top + bh/V48C_PHI/V48C_PHI + 6;
  g.fillStyle = '#7a6a56'; g.beginPath(); g.arc(cx, ry, rr + 4, 0, Math.PI*2); g.fill();
  g.save(); g.beginPath(); g.arc(cx, ry, rr, 0, Math.PI*2); g.clip(); const c = rr*2/3;
  for(let i = 0; i < 9; i++){ g.fillStyle = night ? ['#ffd27a', '#ffb347', '#ffe9a8'][i % 3] : V48C_RUBIK[(i*4 + 1) % 6]; g.fillRect(cx - rr + (i % 3)*c + 1, ry - rr + Math.floor(i/3)*c + 1, c - 2, c - 2); }
  g.restore();
  // cửa sổ cao đôi bên dưới
  [-1, 1].forEach(s => { const wx = cx + s*kw/V48C_PHI/V48C_PHI/1.4, wy = ry + rr + 14, ww = 9, wh = ww*V48C_PHI*1.6; g.fillStyle = night ? '#ffd27a' : '#2c3a66'; g.beginPath(); g.moveTo(wx - ww/2, wy + wh); g.lineTo(wx - ww/2, wy + ww/2); g.arc(wx, wy + ww/2, ww/2, Math.PI, 0); g.lineTo(wx + ww/2, wy + wh); g.fill(); });
  g.fillStyle = '#c9bfac'; g.fillRect(x - 4, top - 6, kw + 8, 8); g.fillStyle = '#e4dccb'; const n = 7, mw = (kw + 8)/(2*n - 1); for(let i = 0; i < n; i++) g.fillRect(x - 4 + i*2*mw, top - 14, mw, 9);
  const rh = kw, by = top - 6, ay = by - rh;
  g.fillStyle = V48C_ROOF.hall; g.beginPath(); g.moveTo(x - 8, by); g.quadraticCurveTo(cx - kw*.2, by - rh*.45, cx, ay); g.quadraticCurveTo(cx + kw*.2, by - rh*.45, x + kw + 8, by); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(cx, by); g.lineTo(cx, ay); g.quadraticCurveTo(cx + kw*.2, by - rh*.45, x + kw + 8, by); g.closePath(); g.fill();
  g.fillStyle = '#e8c27a'; for(let k = 1; k < 4; k++){ const yy = by - rh*k/4, hw = (kw/2 + 8)*(1 - k/4)*.9; g.fillRect(cx - hw, yy, hw*2, 2); }
  g.beginPath(); g.arc(cx, ay, 4.5, 0, Math.PI*2); g.fill(); g.fillStyle = '#5a4a3a'; g.fillRect(cx - 1.5, ay - 40, 3, 38);
  flags.push([cx + 1.5, ay - 40, 2.2]);
}
function v48cMerlons(g, x0, x1, y, skip){
  V48C.bb.push([x0 - 1, y - 10, x1 + 1, y + 4]);
  g.fillStyle = '#c9bfac'; g.fillRect(x0, y - 2, x1 - x0, 5); g.fillStyle = '#e4dccb';
  for(let x = x0; x < x1 - 6; x += 16){ if(skip && x + 8 > skip[0] && x < skip[1]) continue; g.fillRect(x, y - 9, 9, 8); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 6, y - 9, 3, 8); g.fillStyle = '#e4dccb'; }
}
// vẽ phần tĩnh của 1 khu thành lâu đài vào g (toạ độ thế giới mới); trả về danh sách cờ
function v48cPaintRoom(g, id, n, night){
  const flags = [], w = n.x1 - n.x0, tw = Math.round(Math.max(34, Math.min(56, w/Math.pow(V48C_PHI, 4)))), roof = V48C_ROOF[id] || '#4b55b8', r = R[id];
  const bdoor = r && r.side === 'b' && r.dw ? v46N(V46.ZI[id], r.dw[0], r.dw[1])[0] : null;
  if(id === 'hall'){
    v48cMerlons(g, n.x0 + tw/2, n.x1 - tw/2, n.y1, null);
    v48cKeep(g, (n.x0 + n.x1)/2, n.y0 - 32, Math.round(w/Math.pow(V48C_PHI, 3)), night, flags);
    v48cTower(g, n.x0 - tw/2 + 4, n.y0 + 6, tw, roof, night, true, flags); v48cTower(g, n.x1 + tw/2 - 4, n.y0 + 6, tw, roof, night, true, flags);
    v48cTower(g, n.x0, n.y1 + 4, tw, roof, night, true, flags); v48cTower(g, n.x1, n.y1 + 4, tw, roof, night, true, flags);
    // tháp nhỏ hai bên cửa Đại sảnh
    const H = v48cHall(); if(H){ v48cTower(g, n.x0, H.door[1] - 52, 28, roof, night, true, flags);
      v48cArch(g, (H.br.x0 + H.br.x1)/2 - 2, H.br.y1 + 2, (H.br.x1 - H.br.x0)/2 - 2, 52, 'Đại sảnh');
      const S = v48cStatueAt(H), prev = ctx; V48C.bb.push([S[0] - 80, S[1] - 130, S[0] + 80, S[1] + 14]); ctx = g; try { v48cStatue(S[0], S[1], true); } finally { ctx = prev; } }
    return flags;
  }
  v48cMerlons(g, n.x0 + 10, n.x1 - 10, n.y1 + 2, bdoor != null ? [bdoor - 34, bdoor + 34] : null);
  v48cTower(g, n.x0 - tw/2 + 2, n.y0 + 6, tw, roof, night, true, flags); v48cTower(g, n.x1 + tw/2 - 2, n.y0 + 6, tw, roof, night, true, flags);
  v48cTower(g, n.x0, n.y1 + 6, Math.round(tw*.8), roof, night, false, null); v48cTower(g, n.x1, n.y1 + 6, Math.round(tw*.8), roof, night, false, null);
  if(bdoor != null) v48cArch(g, bdoor, n.y1 + 4, 26, 30, null);
  return flags;
}
function v48cRoomImg(id, night){
  const n = v48cNR(id); if(!n) return null; const key = [n.x0, n.y0, n.x1, n.y1, night, season].join(',');
  let c = V48C.cache[id]; if(c && c.key === key) return c;
  const pad = 70, up = id === 'hall' ? 330 : 190, x0 = n.x0 - (id === 'hall' ? 240 : pad), y0 = n.y0 - up, w = n.x1 - x0 + pad, h = n.y1 - n.y0 + up + 60;
  const k = Math.min(2, Math.max(1, (window.devicePixelRatio || 1))), cv = c && c.cv ? c.cv : document.createElement('canvas');
  cv.width = Math.ceil(w*k); cv.height = Math.ceil(h*k); const g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, -x0*k, -y0*k);
  let flags = []; V48C.bb = []; try { flags = v48cPaintRoom(g, id, n, night); } catch(e){ console.warn('v48c room', id, e); }
  // chỉ vẽ lại các mảnh có hình (tháp, châu mai, cổng): đỡ tốn tô màu so với cả ảnh lớn trong suốt
  const bbs = V48C.bb.map(b => [Math.max(x0, Math.floor(b[0])), Math.max(y0, Math.floor(b[1])), Math.min(x0 + w, Math.ceil(b[2])), Math.min(y0 + h, Math.ceil(b[3]))]).filter(b => b[2] > b[0] && b[3] > b[1]); V48C.bb = [];
  c = V48C.cache[id] = {cv, key, x0, y0, w, h, k, flags, bbs}; return c;
}
function v48cFlag(x, y, s, i){
  const t = realT*2.2 + i*1.7, L = 22*s, Hh = 13*s; ctx.fillStyle = V48C_RUBIK[i % 6]; ctx.beginPath(); ctx.moveTo(x, y);
  for(let k = 0; k <= 6; k++){ const u = k/6; ctx.lineTo(x + u*L, y + Math.sin(t + u*3)*2.2*s*u + u*Hh*.12); }
  ctx.lineTo(x + L*.82, y + Hh*.55 + Math.sin(t + 2.5)*2*s); for(let k = 6; k >= 0; k--){ const u = k/6; ctx.lineTo(x + u*L, y + Hh + Math.sin(t + u*3)*2.2*s*u - u*Hh*.12); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(x, y + Hh*.5, L*.5, 1.5*s);
}

// ---------- 2. HÀO NƯỚC + CẦU ĐÁ (vẽ vào nền đảo đã nướng sẵn: không tốn khung hình) ----------
function v48cGround(g){
  const H = v48cHall(); if(!H) return; const o = H.out, i = H.inn, b = H.br, rr = 16;
  const sub = (r, rad) => { if(g.roundRect) g.roundRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, rad); else g.rect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); };
  const ring = (a, ra, b, rb, col) => { g.beginPath(); sub(a, ra); sub(b, rb); g.fillStyle = col; g.fill('evenodd'); };
  const ex = (r, k) => ({x0:r.x0 - k, y0:r.y0 - k, x1:r.x1 + k, y1:r.y1 + k});
  ring(ex(o, 5), rr + 4, i, 4, '#9e9483');          // bờ đá ngoài + bờ đá trong (sát tường)
  ring(o, rr, ex(i, 3), 6, '#4fa6cf'); ring(ex(o, -4), rr - 3, ex(i, 7), 8, '#62b9df');
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for(let y = o.y0 + 30; y < o.y1 - 20; y += 46){ g.beginPath(); g.moveTo(o.x0 + 6, y); g.lineTo(o.x0 + 14, y - 3); g.stroke(); g.beginPath(); g.moveTo(o.x1 - 14, y + 20); g.lineTo(o.x1 - 6, y + 17); g.stroke(); }
  for(let x = o.x0 + 40; x < o.x1 - 20; x += 52){ g.beginPath(); g.moveTo(x, o.y0 + 9); g.lineTo(x + 9, o.y0 + 6); g.stroke(); g.beginPath(); g.moveTo(x + 20, o.y1 - 9); g.lineTo(x + 29, o.y1 - 12); g.stroke(); }
  // cầu đá vòm: mặt cầu + lan can
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(b.x0, b.y1, b.x1 - b.x0, 6);
  g.fillStyle = '#cbbfa8'; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
  g.fillStyle = 'rgba(90,70,50,.18)'; for(let x = b.x0 + 6; x < b.x1; x += 12) g.fillRect(x, b.y0 + 6, 1.5, b.y1 - b.y0 - 12);
  g.fillStyle = '#9e9483'; g.fillRect(b.x0 - 2, b.y0 - 2, b.x1 - b.x0 + 4, 7); g.fillRect(b.x0 - 2, b.y1 - 5, b.x1 - b.x0 + 4, 7);
  g.fillStyle = '#ddd3c0'; for(let x = b.x0; x < b.x1; x += 13){ g.fillRect(x, b.y0 - 5, 6, 5); g.fillRect(x, b.y1 - 8, 6, 5); }
  // sân đá tròn dưới tượng Rubik (bán kính theo tỷ lệ vàng)
  const S = v48cStatueAt(H); g.fillStyle = '#b9ae9a'; g.beginPath(); g.ellipse(S[0], S[1] - 4, 50, 50/V48C_PHI, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#d6ccb8'; g.beginPath(); g.ellipse(S[0], S[1] - 4, 50 - 5, (50 - 5)/V48C_PHI, 0, 0, Math.PI*2); g.fill();
  // lối sỏi trong vườn phép thuật
  const G = v48cGarden(H); g.fillStyle = 'rgba(214,200,168,.85)'; g.fillRect(G.x0, G.y0 + G.h/V48C_PHI - 12, G.w, 24); g.fillRect(G.x0 + G.w/V48C_PHI - 12, G.y0, 24, G.h);
  g.fillStyle = 'rgba(0,0,0,.06)'; for(let x = G.x0 + 6; x < G.x1; x += 18) g.fillRect(x, G.y0 + G.h/V48C_PHI - 6, 8, 4);
  g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 2; g.strokeRect(G.x0, G.y0, G.w, G.h);
}
// tượng Rubik trước Đại sảnh: bệ rộng 64, cao 64/φ; khối Rubik cạnh theo tỷ lệ vàng
function v48cStatue(x, y, still){
  const pw = 64, ph = Math.round(pw/V48C_PHI);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 2, pw/2 + 10, 8, 0, 0, Math.PI*2); ctx.fill();
  rect('#9e9483', x - pw/2 - 8, y - 8, pw + 16, 8); rect('#c9bfac', x - pw/2 - 8, y - 11, pw + 16, 4);
  rect('#b9ae9a', x - pw/2, y - 8 - ph, pw, ph); rect('#ddd3c0', x - pw/2, y - 12 - ph, pw, 5); rect('rgba(0,0,0,.12)', x + pw/2 - 9, y - 8 - ph, 9, ph);
  const qw = pw/V48C_PHI, qh = qw/V48C_PHI; rect('#b8862e', x - qw/2 - 2, y - 8 - ph/2 - qh/2 - 2, qw + 4, qh + 4); rect('#e8c27a', x - qw/2, y - 8 - ph/2 - qh/2, qw, qh);
  try { v45MiniCube(x, y - 22 - ph, Math.round(pw/V48C_PHI/1.25)); } catch(e){}
  if(still) return; const ph2 = (realT*.15) % 1; if(ph2 < .08){ ctx.fillStyle = 'rgba(255,248,208,.9)'; const k = (.08 - Math.abs(ph2 - .04))*120; ctx.fillRect(x - 18, y - ph - 80, 2, k); ctx.fillRect(x - 18 - k/2, y - ph - 80 + k/2, k, 2); }
}

// ---------- 3. VƯỜN PHÉP THUẬT: mục tiêu cho 8 phép tốt ----------
// toạ độ lưu tương đối so với vườn (g) hoặc tượng (s) để đi theo khu khi khu dời
function v48cItems(){
  if(V48C.items) return V48C.items; const L = [], G = {w:230, h:Math.round(230/V48C_PHI)}, p = V48C_PHI;
  const add = (k, a, rx, ry, o) => L.push(Object.assign({k, a, rx, ry, t:-999, lift:0}, o || {}));
  // ô trên-trái: đồ để nâng · ô dưới-trái: nụ hoa · ô trên-phải: cây non · ô dưới-phải: ghế hỏng · mép trên: hàng rào hỏng
  add('crate', 'g', 40, 50); add('crate', 'g', 78, 62, {c:1}); add('book', 'g', 112, 46);
  for(let i = 0; i < 5; i++) add('bud', 'g', 24 + i*26, G.h - 12, {c:i});
  [0, 1, 2].forEach(i => add('tree', 'g', G.w/p + 22 + i*28, 42 + (i % 2)*20));
  add('bench', 'g', G.w/p + 44, G.h - 10); add('fence', 'g', 56, -2);
  add('lamp', 'g', 12, 16); add('lamp', 'g', G.w - 12, 16); add('lamp', 'g', 12, G.h - 4); add('lamp', 'g', G.w - 12, G.h - 4);
  add('lamp', 's', -40, 6); add('lamp', 's', 40, 6);
  V48C.items = L; return L;
}
function v48cAnchor(a, H){ if(a === 's'){ const S = v48cStatueAt(H); return S; } const G = v48cGarden(H); return [G.x0, G.y0]; }
function v48cPos(it, H){ const A = v48cAnchor(it.a, H); return [A[0] + it.rx, A[1] + it.ry]; }
const V48C_LIFE = {bud:240, lamp:300, bench:300, fence:300, tree:300};
const v48cActive = it => realT - it.t < (V48C_LIFE[it.k] || 1e9);
function v48cDrawItem(it, x, y, night){
  const on = v48cActive(it);
  if(it.k === 'crate' || it.k === 'book'){
    const L = it.lift || 0; ctx.fillStyle = `rgba(0,0,0,${.2 - Math.min(.12, L/400)})`; ctx.beginPath(); ctx.ellipse(x, y + 2, 15 - Math.min(6, L/10), 5, 0, 0, Math.PI*2); ctx.fill();
    const yy = y - L + (L > 2 ? Math.sin(realT*2.4 + it.rx)*3 : 0);
    if(it.k === 'book'){ ['#c0392b', '#2e86c1', '#27ae60'].forEach((c, i) => { rect(c, x - 13 + i, yy - 8 - i*7, 26, 7); rect('#f6efd9', x + 10 + i, yy - 7 - i*7, 3, 5); }); }
    else { rect(it.c ? '#a0703c' : '#b07b45', x - 13, yy - 24, 26, 24); rect('#7a5230', x - 13, yy - 24, 26, 3); rect('#7a5230', x - 13, yy - 3, 26, 3); rect('#8a5e34', x - 2, yy - 24, 4, 24); }
    if(L > 2 && Math.random() < .3) v48cSpark(x + (Math.random() - .5)*24, yy - 10, 1);
    return;
  }
  if(it.k === 'bud'){
    rect('#3f8f3a', x - 1, y - 16, 2, 16); rect('#4cae49', x - 7, y - 9, 6, 3); rect('#4cae49', x + 1, y - 12, 6, 3);
    const c = ['#ff8fc4', '#ffd23f', '#b06bff', '#ff6f61', '#ffffff'][it.c % 5];
    if(on){ const k = Math.min(1, (realT - it.t)*1.5), r = 4 + 5*k; ctx.fillStyle = c; for(let i = 0; i < 5; i++){ const a = i/5*Math.PI*2 + realT*.2; ctx.beginPath(); ctx.arc(x + Math.cos(a)*r*.8, y - 20 + Math.sin(a)*r*.8, r*.62, 0, Math.PI*2); ctx.fill(); } ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y - 20, 3, 0, Math.PI*2); ctx.fill(); }
    else { ctx.fillStyle = '#3f8f3a'; ctx.beginPath(); ctx.ellipse(x, y - 20, 3.5, 6, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = c; ctx.fillRect(x - 1.5, y - 26, 3, 4); }
    return;
  }
  if(it.k === 'tree'){
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 12, 4, 0, 0, Math.PI*2); ctx.fill(); rect('#7a5a3a', x - 10, y - 4, 20, 5);
    if(on){ const k = Math.min(1, (realT - it.t)/2); rect('#6b4a2a', x - 2, y - 14 - 10*k, 4, 14 + 10*k); ctx.fillStyle = '#4cae49'; ctx.beginPath(); ctx.arc(x, y - 24 - 10*k, 8 + 6*k, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(x - 4, y - 28 - 10*k, 4, 0, Math.PI*2); ctx.fill(); }
    else { rect('#8a6a48', x - 1, y - 16, 2, 13); rect('#b59a5a', x - 7, y - 16, 6, 3); rect('#b59a5a', x + 1, y - 12, 6, 3); rect('#a68a4e', x - 2, y - 19, 4, 3); }
    return;
  }
  if(it.k === 'bench'){
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - 20, y - 2, 42, 5);
    if(on){ rect('#8b5e34', x - 20, y - 16, 40, 5); rect('#a8784a', x - 20, y - 26, 40, 4); rect('#5a3a1e', x - 18, y - 12, 4, 12); rect('#5a3a1e', x + 14, y - 12, 4, 12); }
    else { ctx.save(); ctx.translate(x, y - 12); ctx.rotate(.22); rect('#8b5e34', -20, -4, 22, 5); ctx.restore(); rect('#8b5e34', x + 2, y - 10, 18, 5); rect('#5a3a1e', x - 18, y - 8, 4, 8); rect('#5a3a1e', x + 14, y - 10, 4, 10); rect('#6b4a2a', x - 4, y - 2, 8, 2); }
    return;
  }
  if(it.k === 'fence'){
    for(let i = 0; i < 4; i++){ const px = x - 24 + i*16; if(!on && i === 2){ ctx.save(); ctx.translate(px, y); ctx.rotate(.7); rect('#c8a46a', -2, -20, 5, 20); ctx.restore(); continue; } rect('#c8a46a', px - 2, y - 22, 5, 22); }
    if(on){ rect('#a8844a', x - 26, y - 17, 54, 3); rect('#a8844a', x - 26, y - 9, 54, 3); } else { rect('#a8844a', x - 26, y - 17, 22, 3); rect('#a8844a', x + 12, y - 9, 16, 3); }
    return;
  }
  if(it.k === 'lamp'){
    rect('rgba(0,0,0,.18)', x - 5, y - 1, 12, 4); rect('#3a3f4f', x - 2, y - 40, 4, 40); rect('#2b2f3a', x - 7, y - 50, 14, 11);
    if(on){ const f = .8 + Math.sin(realT*9 + it.rx)*.2; rect('#ffe39a', x - 5, y - 48, 10, 7); ctx.fillStyle = `rgba(255,200,90,${.25*f})`; ctx.beginPath(); ctx.arc(x, y - 45, 16, 0, Math.PI*2); ctx.fill(); }
    else rect('#4a4f5c', x - 5, y - 48, 10, 7);
    rect('#2b2f3a', x - 8, y - 52, 16, 3);
  }
}

// ---------- 4. hạt lấp lánh, chữ bay, bướm, cầu vồng ----------
function v48cSpark(x, y, n, col){
  for(let i = 0; i < n && V48C.pts.length < 140; i++){ const a = Math.random()*Math.PI*2, s = 10 + Math.random()*40;
    V48C.pts.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 20, t:0, life:.7 + Math.random()*.7, c:col || ['#fff8d0', '#ffe39a', '#bfe3ff', '#ffd1ec'][i % 4], drop:false}); }
}
function v48cDrops(x, y){ for(let i = 0; i < 16 && V48C.pts.length < 140; i++) V48C.pts.push({x:x + (Math.random() - .5)*26, y:y - 60 - Math.random()*30, vx:0, vy:90 + Math.random()*60, t:i*.04, life:.8, c:'#7fd0f7', drop:true}); }
function v48cSay(x, y, s){ V48C.txt.push({x, y, s, t:0}); if(V48C.txt.length > 4) V48C.txt.shift(); }
function v48cFx(dt){
  const P = V48C.pts; for(let i = P.length - 1; i >= 0; i--){ const p = P[i]; p.t += dt; if(p.t > p.life){ P.splice(i, 1); continue; } if(p.t < 0) continue; p.x += p.vx*dt; p.y += p.vy*dt; if(!p.drop){ p.vx *= .96; p.vy = p.vy*.96 + 6*dt; }
    const a = 1 - p.t/p.life; ctx.globalAlpha = a; ctx.fillStyle = p.c; if(p.drop) ctx.fillRect(p.x - 1, p.y - 4, 2.5, 6); else { const k = 1 + a*2.5; ctx.fillRect(p.x - k/2, p.y - .75, k, 1.5); ctx.fillRect(p.x - .75, p.y - k/2, 1.5, k); } }
  ctx.globalAlpha = 1;
  // bướm bay quanh người chơi
  const pp = PLAYER && PLAYER.visible ? v46Pos(PLAYER) : null;
  for(let i = V48C.bfly.length - 1; i >= 0; i--){ const b = V48C.bfly[i]; b.t += dt; if(b.t > b.life){ V48C.bfly.splice(i, 1); continue; }
    const tx = (b.t > b.life - 4 || !pp) ? b.hx + Math.cos(b.ph)*400 : pp[0] + Math.cos(realT*.9 + b.ph)*b.r, ty = (b.t > b.life - 4 || !pp) ? b.hy - 300 : pp[1] - 40 + Math.sin(realT*1.3 + b.ph)*b.r*.5;
    b.x += (tx - b.x)*Math.min(1, dt*1.3); b.y += (ty - b.y)*Math.min(1, dt*1.3); const fl = Math.abs(Math.sin(realT*14 + b.ph)), a = Math.min(1, b.t, (b.life - b.t)/2);
    ctx.globalAlpha = a; ctx.fillStyle = b.c; ctx.fillRect(b.x - 1 - 6*fl, b.y - 4, 6*fl, 5); ctx.fillRect(b.x + 1, b.y - 4, 6*fl, 5); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(b.x - .75, b.y - 5, 1.5, 7); ctx.globalAlpha = 1; }
  // chữ tên phép bay lên (Nunito đậm)
  for(let i = V48C.txt.length - 1; i >= 0; i--){ const s = V48C.txt[i]; s.t += dt; if(s.t > 1.8){ V48C.txt.splice(i, 1); continue; }
    const z = Math.max(.6, cam.z), fs = Math.round(18/z), a = Math.min(1, (1.8 - s.t)*2); ctx.globalAlpha = a; ctx.font = `800 ${fs}px Nunito, 'Be Vietnam Pro', sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = 4/z; ctx.strokeStyle = 'rgba(30,20,60,.8)'; ctx.strokeText(s.s, s.x, s.y - 30 - s.t*24); ctx.fillStyle = '#fff3c4'; ctx.fillText(s.s, s.x, s.y - 30 - s.t*24); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
}
function v48cRainbow(H){
  const age = realT - V48C.rb; if(age > 10 || age < 0) return; const a = Math.min(1, age*1.2, (10 - age)/2)*.42, cx = (H.n.x0 + H.n.x1)/2, cy = H.n.y1 + 60, R0 = (H.n.x1 - H.n.x0)*.95;
  ctx.save(); ctx.globalAlpha = a; ctx.lineWidth = 12; ['#ff4b4b', '#ff9f3b', '#ffe14b', '#4fd36a', '#4b9bff', '#7a5bff', '#c06bff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, cy, R0 - i*11, Math.PI*1.08, Math.PI*1.92); ctx.stroke(); }); ctx.restore();
}

// ---------- 5. vẽ mỗi khung hình (sau các khu, trước ánh sáng ngày/đêm) ----------
function v48cWorld(VBn){
  if(V48C.noW) return; const t0 = performance.now(), H = v48cHall(); if(!H || cam.z < .12) return;
  const night = typeof isNight === 'function' && isNight(), dt = Math.min(.05, Math.max(0, realT - (V48C.lt || realT))); V48C.lt = realT;
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = (window.devicePixelRatio || 1) > 1;
  V48C_ROOMS.forEach(id => { const n = v48cNR(id); if(!n || n.x1 + 90 < VBn.x0 || n.x0 - 90 > VBn.x1 || n.y1 + 80 < VBn.y0 || n.y0 - 340 > VBn.y1) return;
    const c = v48cRoomImg(id, night); if(!c) return; c.bbs.forEach(b => { if(b[2] < VBn.x0 || b[0] > VBn.x1 || b[3] < VBn.y0 || b[1] > VBn.y1) return; ctx.drawImage(c.cv, (b[0] - c.x0)*c.k, (b[1] - c.y0)*c.k, (b[2] - b[0])*c.k, (b[3] - b[1])*c.k, b[0], b[1], b[2] - b[0], b[3] - b[1]); }); if(cam.z >= .3) c.flags.forEach((f, i) => v48cFlag(f[0], f[1], f[2], i + id.length)); });
  ctx.imageSmoothingEnabled = sm;
  const near = v48cIn({x0:VBn.x0 - 500, y0:VBn.y0 - 400, x1:VBn.x1 + 500, y1:VBn.y1 + 400}, H.door[0], H.door[1]); if(!near) return;
  // cổng vòm trên cầu, bệ đũa thần, tượng, vườn
  const S = v48cStatueAt(H), ph2 = (realT*.15) % 1; if(ph2 < .08){ ctx.fillStyle = 'rgba(255,248,208,.9)'; const k = (.08 - Math.abs(ph2 - .04))*120, y = S[1] - 40 - 80; ctx.fillRect(S[0] - 18, y, 2, k); ctx.fillRect(S[0] - 18 - k/2, y + k/2, k, 2); }
  const pd = v48cPedestal(H); rect('rgba(0,0,0,.18)', pd[0] - 12, pd[1] - 2, 26, 5); rect('#b9ae9a', pd[0] - 9, pd[1] - 24, 18, 24); rect('#ddd3c0', pd[0] - 12, pd[1] - 28, 24, 5);
  if(!v48cHas()){ const by = pd[1] - 46 + Math.sin(realT*2)*4; ctx.save(); ctx.translate(pd[0], by); ctx.rotate(-.5); rect('#6b4226', -2, -14, 4, 28); rect('#e8c27a', -2.5, -16, 5, 4); ctx.restore(); if(Math.random() < .25) v48cSpark(pd[0], by - 10, 1); }
  const its = v48cItems(), G = v48cGarden(H), sp = [];
  its.forEach(it => { const p = it.k === 'crate' || it.k === 'book' ? (it.ax != null ? [it.ax, it.ay] : v48cPos(it, H)) : v48cPos(it, H); it.x = p[0]; it.y = p[1];
    if(it.ax != null && it.tx != null){ it.ax += (it.tx - it.ax)*Math.min(1, dt*2.2); it.ay += (it.ty - it.ay)*Math.min(1, dt*2.2); if(Math.hypot(it.tx - it.ax, it.ty - it.ay) < 2) it.tx = null; }
    const want = it.float ? 46 : 0; it.lift += (want - it.lift)*Math.min(1, dt*3);
    if(p[0] > VBn.x0 - 80 && p[0] < VBn.x1 + 80 && p[1] > VBn.y0 - 80 && p[1] < VBn.y1 + 120) sp.push(it); });
  sp.sort((a, b) => a.y - b.y).forEach(it => { try { v48cDrawItem(it, it.x, it.y, night); } catch(e){} });
  if(cam.z >= .45){ ctx.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const s = '🪄 Vườn Phép Thuật', w = ctx.measureText(s).width + 16, sx = G.x0 + G.w/V48C_PHI; rect('#6b4a2a', sx - 2, G.y0 - 30, 4, 30); rect('#8b5e34', sx - w/2, G.y0 - 52, w, 24); rect('#e8c27a', sx - w/2 + 2, G.y0 - 50, w - 4, 20);
    ctx.fillStyle = '#3a2410'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, sx, G.y0 - 40); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  // chế độ đũa: vòng sáng quanh mục tiêu gần, đũa trên tay
  if(V48C.on && PLAYER && PLAYER.visible){ const pp = v46Pos(PLAYER), pul = .5 + Math.sin(realT*4)*.5;
    its.forEach(it => { if(Math.hypot(it.x - pp[0], it.y - pp[1]) > 360) return; ctx.strokeStyle = `rgba(255,226,140,${.45 + pul*.4})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(it.x, it.y - 2, 22 + pul*3, 8 + pul, 0, 0, Math.PI*2); ctx.stroke();
      if(cam.z >= .5){ const z = Math.max(.7, cam.z); ctx.font = `${Math.round(18/z)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.fillText(v48cIcon(it), it.x, it.y - 56 - (it.lift || 0) - pul*3); ctx.textAlign = 'left'; } });
    if(Math.hypot(H.door[0] - pp[0], H.door[1] - pp[1]) < 420 && cam.z >= .5){ ctx.font = `${Math.round(18/Math.max(.7, cam.z))}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🌈', H.out.x0 + 11, H.out.y1 - 40 - pul*3); ctx.textAlign = 'left'; }
    ctx.save(); ctx.translate(pp[0] + (PLAYER.dir < 0 ? -11 : 11), pp[1] - 22); ctx.rotate(PLAYER.dir < 0 ? .6 : -.6); rect('#6b4226', -1.5, -16, 3, 16); rect('#e8c27a', -2, -19, 4, 4); ctx.restore();
    if(Math.random() < .2) v48cSpark(pp[0] + (PLAYER.dir < 0 ? -16 : 16), pp[1] - 42, 1); }
  v48cRainbow(H); v48cFx(dt);
  V48C.perf = V48C.perf*.95 + (performance.now() - t0)*.05;
}
function v48cIcon(it){ const on = v48cActive(it); return {crate:it.float ? '✋' : '🪶', book:it.float ? '✋' : '🪶', bud:on ? '🦋' : '🌷', tree:on ? '🌳' : '💧', bench:on ? '✨' : '🔧', fence:on ? '✨' : '🔧', lamp:on ? '✨' : '🔥'}[it.k] || '✨'; }

// ---------- 6. ĐŨA THẦN: nhận, bật/tắt, chạm để làm phép ----------
const v48cHas = () => !!(PROF && PROF.inv && PROF.inv.v48wand);
function v48cChime(k){
  try { if(typeof V39S !== 'undefined' && V39S.vol.sfx <= 0) return; ensureAC(); const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    const base = [523, 587, 659, 784, 880, 1047, 1175, 1319][k % 8]; [0, 1, 2].forEach(i => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = base*[1, 1.25, 1.5][i];
      g.gain.setValueAtTime(.0001, t + i*.09); g.gain.exponentialRampToValueAtTime(.05, t + i*.09 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + i*.09 + .7); o.connect(g); g.connect(out); o.start(t + i*.09); o.stop(t + i*.09 + .75); }); } catch(e){}
}
function v48cReward(){
  if(!PROF) return; const d = new Date(), key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); PROF.v48c = PROF.v48c && PROF.v48c.d === key ? PROF.v48c : {d:key, n:0};
  if(PROF.v48c.n >= V48C_DAY){ if(!V48C.capMsg){ V48C.capMsg = 1; toast('🪄 Hôm nay em đã nhận đủ quà phép thuật. Phép vẫn dùng được, mai có quà tiếp nhé!'); } return; }
  PROF.v48c.n++; const g0 = PROF.stats.games; try { reward(4, PROF.v48c.n % 3 === 0 ? 2 : 0, 'Phép thuật tốt', true); } catch(e){} PROF.stats.games = g0; try { saveProfile(); } catch(e){}
}
function v48cGive(){
  if(!PROF || v48cHas()) return; PROF.inv.v48wand = Date.now(); try { saveProfile(); } catch(e){} v48cChime(5); setTimeout(() => v48cChime(7), 260);
  const H = v48cHall(); if(H){ const p = v48cPedestal(H); v48cSpark(p[0], p[1] - 40, 30); }
  v48cSync(); v48cCard(true);
}
function v48cCard(first){
  let c = V48C.card; if(!c){ c = V48C.card = document.createElement('div'); c.id = 'v48cCard'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Đũa thần'); $('#stage').appendChild(c); }
  c.innerHTML = `<b>🪄 ${first ? 'Em nhận được Đũa thần!' : 'Đũa thần'}</b><p>✨ Chạm vào vật phát sáng gần em.</p><p>🌷 Hoa · 🔥 Đèn · 💧 Cây · 🔧 Đồ hỏng</p><p>🪶 Nâng đồ · 🦋 Bướm · 🌈 Mặt hào</p><div class="v48cRow"><button type="button" class="v48cGo">${V48C.on ? 'Cất đũa' : 'Cầm đũa'}</button><button type="button" class="v48cX" aria-label="Đóng">✕</button></div>`;
  c.hidden = false; c.querySelector('.v48cGo').onclick = e => { e.stopPropagation(); v48cToggle(); c.hidden = true; }; c.querySelector('.v48cX').onclick = e => { e.stopPropagation(); c.hidden = true; };
  clearTimeout(V48C.cardT); V48C.cardT = setTimeout(() => { c.hidden = true; }, 12000);
}
function v48cToggle(on){
  if(!v48cHas()){ toast('🏰 Vào Đại sảnh của lâu đài để nhận Đũa thần nhé!'); return; }
  V48C.on = on == null ? !V48C.on : !!on; if(!V48C.on && V48C.held){ V48C.held.float = false; V48C.held = null; } v48cSync();
  if(V48C.on){ v48cChime(2); toast('🪄 Cầm đũa: chạm vào vật phát sáng ở gần để làm phép tốt.'); } else toast('🪄 Đã cất đũa vào túi đồ.');
}
function v48cSync(){
  const b = V48C.btn; if(!b) return; const own = v48cHas(); b.hidden = !own; b.classList.toggle('on', V48C.on); b.setAttribute('aria-pressed', V48C.on); b.querySelector('small').textContent = V48C.on ? 'Cất đũa' : 'Đũa thần';
}
function v48cBtn(){
  const add = () => { const col = $('#v41Col'); if(!col){ setTimeout(add, 500); return; } if($('#v48cWand')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'v48cWand'; b.className = 'v41b'; b.setAttribute('aria-label', 'Cầm hoặc cất Đũa thần'); b.innerHTML = '<span class="ic">🪄</span><small>Đũa thần</small>';
    b.onclick = e => { e.stopPropagation(); try { v32Wake(); } catch(err){} v48cToggle(); }; col.appendChild(b); V48C.btn = b; v48cSync(); };
  add();
}
// toạ độ màn hình → toạ độ đảo mới
function v48cWorldAt(e){ const r = cvs.getBoundingClientRect(); return [cam.x + (e.clientX - r.left - cw/2)/cam.z, cam.y + (e.clientY - r.top - ch/2)/cam.z]; }
function v48cHit(wx, wy){
  const H = v48cHall(); if(!H) return null; const its = v48cItems(), rad = Math.max(30, 26/cam.z); let best = null, bd = rad;
  its.forEach(it => { if(it.x == null) return; const d = Math.hypot(wx - it.x, wy - (it.y - 14 - (it.lift || 0))); if(d < bd){ bd = d; best = it; } });
  if(best) return best; if(v48cWater(wx, wy)) return {k:'water', x:wx, y:wy}; return null;
}
const V48C_NAME = {lift:'🪶 Nâng lên!', move:'✋ Bay tới đây!', down:'🪶 Đặt xuống', bud:'🌸 Hoa nở!', bfly:'🦋 Bướm ơi, lại đây!', lamp:'🔥 Thắp đèn!', fix:'🔧 Sửa lành!', tree:'💧 Tưới cây!', water:'🌈 Cầu vồng!'};
function v48cCast(it, wx, wy){
  const pp = v46Pos(PLAYER), far = it && Math.hypot(it.x - pp[0], it.y - pp[1]) > 380;
  if(far){ v48cSay(it.x, it.y, '🚶 Lại gần hơn nhé'); return true; }
  let n = null, k = 0;
  if(!it){ const h = V48C.held; if(!h || Math.hypot(wx - pp[0], wy - pp[1]) > 420) return false; const A = v48cPos(h, v48cHall()); if(h.ax == null){ h.ax = h.x; h.ay = h.y; } h.tx = wx; h.ty = wy; void A; n = 'move'; k = 1; v48cSpark(wx, wy - 20, 10); v48cSay(wx, wy, V48C_NAME.move); v48cChime(k); return true; }
  if(it.k === 'crate' || it.k === 'book'){ if(it.float){ it.float = false; if(V48C.held === it) V48C.held = null; n = 'down'; } else { if(V48C.held) V48C.held.float = false; it.float = true; V48C.held = it; if(it.ax == null){ it.ax = it.x; it.ay = it.y; } n = 'lift'; } k = 0; }
  else if(it.k === 'bud'){ if(v48cActive(it)){ n = 'bfly'; k = 4; for(let i = 0; i < 5; i++) V48C.bfly.push({x:it.x, y:it.y - 20, hx:it.x, hy:it.y, t:0, life:28 + i*2, ph:i*1.3 + Math.random(), r:40 + i*12, c:['#ffb3d1', '#ffe14b', '#9fd8ff', '#c9a6ff', '#ffffff'][i]}); if(V48C.bfly.length > 15) V48C.bfly.splice(0, V48C.bfly.length - 15); } else { it.t = realT; n = 'bud'; k = 3; } }
  else if(it.k === 'lamp'){ if(v48cActive(it)){ v48cSay(it.x, it.y, '✨ Đèn đang sáng ấm'); return true; } it.t = realT; n = 'lamp'; k = 5; }
  else if(it.k === 'bench' || it.k === 'fence'){ if(v48cActive(it)){ v48cSay(it.x, it.y, '✨ Đã lành rồi'); return true; } it.t = realT; n = 'fix'; k = 6; }
  else if(it.k === 'tree'){ if(v48cActive(it)){ v48cSay(it.x, it.y, '🌳 Cây đã đủ nước'); return true; } it.t = realT; n = 'tree'; k = 7; v48cDrops(it.x, it.y); }
  else if(it.k === 'water'){ V48C.rb = realT; n = 'water'; k = 2; }
  if(!n) return false;
  v48cSpark(it.x, it.y - 18, n === 'water' ? 6 : 16); v48cSay(it.x, it.y, V48C_NAME[n]); v48cChime(k); if(n !== 'down') v48cReward();
  return true;
}
function v48cInput(){
  const onCv = e => e.target === cvs && V48C.on && PLAYER && PLAYER.visible && PLAYER.controlled && !PLAYER.boat && !PLAYER.v16fly && V46.on && !V46.sky;
  window.addEventListener('pointerdown', e => { if(!onCv(e) || e.button > 0) return; const [wx, wy] = v48cWorldAt(e), it = v48cHit(wx, wy);
    let used = false; try { used = v48cCast(it, wx, wy); } catch(err){ console.warn('v48c cast', err); }
    if(used){ V48C.tap = e.pointerId; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  const eat = e => { if(V48C.tap === e.pointerId){ e.stopImmediatePropagation(); if(e.type !== 'pointermove') V48C.tap = null; } };
  ['pointermove', 'pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, eat, true));
}
// mỗi 0.25s: nhận đũa ở Đại sảnh, gợi ý khi tới gần lâu đài
function v48cTick(){
  if(!V46.on || V46.sky || !PLAYER || !PLAYER.visible || !PROF) return; const H = v48cHall(); if(!H) return; const pp = v46Pos(PLAYER);
  if(!v48cHas()){ const pd = v48cPedestal(H); if(Math.hypot(pp[0] - pd[0], pp[1] - pd[1]) < 90 && v48cIn(H.n, pp[0], pp[1])) v48cGive();
    else if(Math.hypot(pp[0] - H.door[0], pp[1] - H.door[1]) < 520 && performance.now() - V48C.msgT > 90000){ V48C.msgT = performance.now(); toast('🏰 Lâu đài trường Rubik! Vào Đại sảnh (qua cầu đá) để nhận Đũa thần 🪄'); } }
}

// ---------- 7. gắn vào game ----------
function v48cInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return;
  // vẽ lâu đài sau các khu (trước ánh sáng ngày/đêm)
  const w0 = v47wWorld; v47wWorld = function(VBn){ w0(VBn); try { v48cWorld(VBn); } catch(e){ console.warn('v48c world', e); } };
  // hào nước + cầu + sân tượng vào nền đảo nướng sẵn
  const p0 = v46Paint; v46Paint = function(g, x0, y0, w, h, lod){ p0(g, x0, y0, w, h, lod); try { v48cGround(g); } catch(e){} };
  // bỏ cây/hoa/đèn nền trùng hào, tượng, vườn
  const clean = () => { const H = v48cHall(); if(!H) return; const S = v48cStatueAt(H), G = v48cGarden(H), o = H.out;
    const bad = (x, y) => (x > o.x0 - 30 && x < o.x1 + 30 && y > o.y0 - 20 && y < o.y1 + 50) || (Math.abs(x - S[0]) < 70 && y > S[1] - 60 && y < S[1] + 50) || (x > G.x0 - 30 && x < G.x1 + 30 && y > G.y0 - 40 && y < G.y1 + 50);
    V46T.deco.forEach(t => { if(t.k === 9 && !t.v48 && Math.abs(t.x - S[0]) < 130 && Math.abs(t.y - S[1]) < 90){ t.y = S[1] + 92; t.v48 = 1; } });   // biển chỉ đường dời xuống dưới tượng
    V46T.deco = V46T.deco.filter(t => t.k === 9 || !bad(t.x, t.y)); if(V46T.lamps) V46T.lamps = V46T.lamps.filter(([x, y]) => !bad(x, y)); V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; };
  clean(); const d0 = v46Deco; v46Deco = function(){ d0(); try { clean(); } catch(e){} };
  // không đi xuống nước hào / không xuyên bệ tượng (chỉ khi tự đi tay; tự đi theo đường vàng thì bỏ qua)
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){
    const r = cm0(ox, oy, nx, ny); if(!r || !V46.on || V46.sky) return r; const c = PLAYER; if(!c || !c.controlled || c.boat || (typeof V32 !== 'undefined' && V32.nav)) return r;
    if(Math.abs(nx - c.x) > 40 || Math.abs(ny - c.y) > 40) return r;
    try { const p = v46Raw(nx) ? [nx - V46E, ny] : v46ToNew(nx, ny, c._z), H = v48cHall(); if(!H) return r; if(v48cWater(p[0], p[1])) return false; const S = v48cStatueAt(H); if(Math.abs(p[0] - S[0]) < 36 && p[1] > S[1] - 14 && p[1] < S[1] + 6) return false; } catch(e){}
    return r; };
  // đèn đêm ấm: cửa sổ tháp, đèn vườn đã thắp, tượng
  const vc = v25Collect; v25Collect = function(dk){ vc(dk); if(!V46.on || V46.sky || V48C.noL) return; const on = v25Ramp(clock, 1080, 330); const H = v48cHall(); if(!H) return;
    const push = (x, y, r, a, k) => { V46.raw = true; try { v25Push(x, y, r, a, k); } finally { V46.raw = false; } };
    try { if(on > 0){ push(H.n.x0, H.n.y0 - 40, 70, on*.8, 2); push(H.n.x1, H.n.y0 - 40, 70, on*.8, 2);
        push((H.n.x0 + H.n.x1)/2, H.n.y0 - 150, 110, on, 2); push((H.br.x0 + H.br.x1)/2, H.br.y1 - 40, 90, on, 2); const S = v48cStatueAt(H); push(S[0], S[1] - 50, 90, on*.9, 2); }
      (V48C.items || []).forEach(it => { if(it.k === 'lamp' && it.x != null && v48cActive(it)) push(it.x, it.y - 45, 80, 1, 2); }); } catch(e){} };
  // túi đồ: hiện Đũa thần, bấm để cầm/cất
  const op0 = openProfile; openProfile = function(){ const r = op0.apply(this, arguments); try { if(v48cHas()){ const inv = $('#pfInv'); if(inv){ if(/Túi đồ trống/.test(inv.textContent)) inv.textContent = ''; const s = el('button', {type:'button', className:'chipi v48cChip'}); s.textContent = '🪄 Đũa thần' + (V48C.on ? ' ✓' : ''); s.onclick = () => { hideModal(); v48cToggle(); }; inv.prepend(s); } } } catch(e){} return r; };
  v48cBtn(); v48cInput(); setInterval(() => { try { v48cTick(); v48cSync(); } catch(e){} }, 250);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v48c = {V48C, v48cHall, v48cGive, v48cToggle, v48cCast, v48cItems};
}
