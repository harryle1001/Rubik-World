// ================= v66t · CÂY THẦN KỲ 2/4: vẽ cây (sprite nướng sẵn theo mùa) + nền quảng trường =================
// Sprite nửa độ phân giải 620×680 (= 1240×1360 px thế giới) — dưới giới hạn canvas điện thoại, không cần chia mảnh.
// 3 lớp: back (tán sau, tối) → body (cành, thân, hốc, rêu, nấm) → front (tán trước sáng, quả, nhà trên cây, cầu, thang, đèn lồng).
// Bảng màu theo Ninja Adventure: viền nâu/xanh rất tối, khối tròn có bóng dưới-phải và sáng trên-trái.
const V66T_CX = 310, V66T_BY = 660, V66T_CY = 280, V66T_RX = 275, V66T_RY = 228;   // toạ độ trong sprite (điểm)
const V66T_PAL = {
  ha:   {o:'#173a22', b:['#1f4f2c', '#2d6b36', '#3f8a40'], f:['#2f7a3a', '#4fa046', '#7cc451', '#b4e06a'], tex:'#245c30'},
  xuan: {o:'#1d4228', b:['#2a5e33', '#3b7c3c', '#57994a'], f:['#3f8f42', '#68b44e', '#98d360', '#cdeb86'], tex:'#2f6c36', pink:['#b2456e', '#e27aa0', '#f7aac6', '#ffe0ec']},
  thu:  {o:'#4a1d0e', b:['#7a2e14', '#9a4419', '#b85d1e'], f:['#b8501c', '#e07a26', '#f2a43a', '#ffd166'], tex:'#8a3a16', red:['#8c1f1a', '#c0392b', '#e05a3a', '#f28a5a']},
  dong: {o:'#1c3a3a', b:['#1d4a40', '#28604f', '#357460'], f:['#2a6650', '#3d8566', '#56a07a', '#7cc095'], tex:'#245a48', snow:['#9fb6c8', '#dfeaf2', '#ffffff']}
};
const V66T_BARK = {o:'#24130b', d:'#4a2a17', m:'#6b3f26', l:'#8a5a35', h:'#b07a48'};

function v66tCv(w, h, rf){ const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', rf ? {willReadFrequently:true} : undefined); g.imageSmoothingEnabled = false; return [c, g]; }
// bản sao thường (GPU) của canvas đã đọc điểm ảnh — vẽ mỗi khung nhanh hơn
function v66tGpu(c){ const [n, g] = v66tCv(c.width, c.height); g.drawImage(c, 0, 0); return n; }
// làm sắc mép (pixel thật): bỏ khử răng cưa của arc
function v66tCrisp(c){ const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), D = im.data; for(let i = 3; i < D.length; i += 4) D[i] = D[i] < 110 ? 0 : 255; g.putImageData(im, 0, 0); }
const v66tCirc = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(1, r), 0, Math.PI*2); g.fill(); };
// một chùm lá kiểu NA: mép gợn (nhiều búi nhỏ), viền tối → khối bóng → khối chính → vệt sáng trên-trái
function v66tBumps(g, x, y, r, k, c, sh){ const n = 8; v66tCirc(g, x + sh[0]*r, y + sh[1]*r, r*.74*k, c);
  for(let i = 0; i < n; i++){ const a = i/n*Math.PI*2 + (r % 3)*.4, q = .6 + .1*Math.sin(i*2.3 + r); v66tCirc(g, x + sh[0]*r + Math.cos(a)*r*q*k, y + sh[1]*r + Math.sin(a)*r*q*k, r*.36*k, c); } }
function v66tClump(g, x, y, r, o, c){
  v66tBumps(g, x, y, r, 1.07, o, [0, 0]); v66tBumps(g, x, y, r, 1, c[0], [0, 0]); v66tBumps(g, x, y, r, .84, c[1], [-.1, -.13]);
  v66tCirc(g, x - r*.3, y - r*.34, r*.42, c[2]); v66tCirc(g, x - r*.08, y - r*.46, r*.22, c[2]); v66tCirc(g, x - r*.5, y - r*.12, r*.2, c[2]);
  if(c[3]){ v66tCirc(g, x - r*.38, y - r*.44, r*.16, c[3]); g.fillStyle = c[3]; g.fillRect(x - r*.12, y - r*.62, 2, 2); }
}
// điểm nằm trong tán (elip chuẩn hoá)
const v66tInCan = (x, y, k) => { const u = (x - V66T_CX)/(V66T_RX*k), v = (y - V66T_CY)/(V66T_RY*k); return u*u + v*v < 1; };
const v66tBottom = dx => V66T_CY + V66T_RY*Math.sqrt(Math.max(0, 1 - (dx/V66T_RX)**2));

// ---------- 1. tán sau (tối) ----------
function v66tBack(se){
  const P = V66T_PAL[se], [c, g] = v66tCv(620, 680, 1), R = v66tRnd(6601), L = [];
  for(let i = 0; i < 46; i++){ const a = R()*Math.PI*2, d = Math.sqrt(R())*.9, r = 38 + R()*26; L.push([V66T_CX + Math.cos(a)*d*(V66T_RX - r*.7), V66T_CY + Math.sin(a)*d*(V66T_RY - r*.7) - 8, r]); }
  // vương miện: các chùm to ở đỉnh tạo dáng tán xoè hình vòm
  for(let i = 0; i < 9; i++){ const t = i/8, x = V66T_CX - V66T_RX*.78 + t*V66T_RX*1.56; L.push([x, V66T_CY - V66T_RY*Math.sqrt(Math.max(0, 1 - ((x - V66T_CX)/V66T_RX)**2))*.86 + 18, 44 + (i % 3)*8]); }
  L.sort((p, q) => p[1] - q[1]).forEach(([x, y, r]) => v66tClump(g, x, y, r, P.o, P.b));
  v66tTexture(g, R, 1700, se === 'dong' ? P.b[0] : P.tex, P.b[2], .95);
  if(se === 'dong') v66tSnowCaps(g, L.filter(p => p[1] < V66T_CY), P, R);
  v66tCrisp(c); return v66tGpu(c);
}
// vân lá: vệt 2×1 / 1×2 chỉ trên điểm đã có (source-atop)
function v66tTexture(g, R, n, dk, lt, k){
  g.save(); g.globalCompositeOperation = 'source-atop';
  for(let i = 0; i < n; i++){ const x = V66T_CX + (R()*2 - 1)*V66T_RX*k, y = V66T_CY + (R()*2 - 1)*V66T_RY*k; if(!v66tInCan(x, y, 1.05)) continue;
    g.fillStyle = R() < .62 ? dk : lt; if(R() < .5) g.fillRect(x | 0, y | 0, 2, 1); else g.fillRect(x | 0, y | 0, 1, 2); }
  g.restore();
}
function v66tSnowCaps(g, L, P, R){
  L.forEach(([x, y, r], i) => { if(i % 5 === 3) return; const w = r*.66, h = r*.26, cx = x - r*.12, cy = y - r*.62;
    g.fillStyle = P.snow[0]; g.beginPath(); g.ellipse(cx, cy + 2, w + 2, h + 2, 0, Math.PI, 0); g.ellipse(cx, cy + 2, w + 2, h*.55, 0, 0, Math.PI); g.fill();
    g.fillStyle = P.snow[2]; g.beginPath(); g.ellipse(cx, cy, w, h, 0, Math.PI, 0); g.ellipse(cx, cy, w, h*.5, 0, 0, Math.PI); g.fill();
    g.fillStyle = P.snow[1]; g.fillRect(cx - w*.2, cy + h*.15, w*.9, 2); });
}

// ---------- 2. thân, cành, hốc cây, rêu, nấm ----------
const v66tHW = t => 25 + 13*(1 - t) + 26*Math.max(0, 1 - t*4.5)**2;      // nửa bề rộng thân theo độ cao t (0 = gốc, 1 = vào tán)
const v66tTX = t => Math.sin(t*2.3)*7;                                      // thân hơi cong
function v66tBody(se){
  const [c, g] = v66tCv(620, 680, 1), B = V66T_BARK, R = v66tRnd(6602), TH = 290;
  // cành lớn (vẽ trước thân để gốc cành chui vào thân)
  const br = [[-6, 205, -120, 268, -176, 238, 15], [4, 200, 118, 262, 148, 292, 15], [-4, 238, -52, 330, -110, 392, 12], [6, 240, 70, 336, 104, 404, 12], [0, 262, -8, 360, 14, 440, 11], [-10, 222, -190, 300, -238, 318, 9], [10, 222, 200, 318, 236, 338, 9]];
  for(const [x0, y0, x1, y1, x2, y2, w] of br){ const P = [[V66T_CX + x0, V66T_BY - y0], [V66T_CX + x1, V66T_BY - y1], [V66T_CX + x2, V66T_BY - y2]];
    for(const [col, k] of [[B.o, 1], [B.m, .72], [B.l, .4]]){ g.strokeStyle = col; g.lineCap = 'round';
      for(let i = 0; i < 6; i++){ const t0 = i/6, t1 = (i + 1)/6, q = t => { const u = 1 - t; return [u*u*P[0][0] + 2*u*t*P[1][0] + t*t*P[2][0], u*u*P[0][1] + 2*u*t*P[1][1] + t*t*P[2][1]]; }, a = q(t0), b = q(t1);
        g.lineWidth = Math.max(1, (w*(1 - t0*.62) + (col === B.o ? 3 : 0))*k); g.beginPath(); g.moveTo(a[0] - (col === B.l ? 2 : 0), a[1] - (col === B.l ? 2 : 0)); g.lineTo(b[0] - (col === B.l ? 2 : 0), b[1] - (col === B.l ? 2 : 0)); g.stroke(); } } }
  // thân: tô từng điểm (vân gỗ dọc lượn sóng, sáng trái tối phải, viền 2 điểm)
  const im = g.getImageData(0, 0, 620, 680), D = im.data, hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], C = {o:hex(B.o), d:hex(B.d), m:hex(B.m), l:hex(B.l), h:hex(B.h)};
  for(let j = 0; j < TH; j++){ const y = V66T_BY - j, t = j/TH, hw = v66tHW(t), cx = V66T_CX + v66tTX(t);
    for(let x = Math.floor(cx - hw - 1); x <= Math.ceil(cx + hw + 1); x++){ const u = (x - cx)/hw; if(Math.abs(u) > 1) continue; let col;
      if(Math.abs(u) > 1 - 2.2/hw) col = C.o;
      else { const grain = Math.sin(u*9.5 + Math.sin(y*.045 + u*2)*1.4 + Math.sin(y*.13)*.35), hh = v66tHash(x, y >> 2) % 100;
        col = u < -.55 ? C.l : u < -.15 ? C.m : u < .5 ? C.m : C.d; if(u < -.72 && hh < 40) col = C.h;
        if(grain > .86) col = C.d; else if(grain > .8 && u < .3) col = C.o; else if(grain < -.9 && u < .2) col = C.l;
        if(hh < 3) col = C.d; }
      const o = (y*620 + x)*4; D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255; } }
  g.putImageData(im, 0, 0);
  // vòng xoáy mắt gỗ
  for(const [dx, dy, r] of [[16, 150, 7], [-18, 214, 5], [10, 252, 4]]){ g.strokeStyle = B.d; g.lineWidth = 2; g.beginPath(); g.ellipse(V66T_CX + dx, V66T_BY - dy, r, r*1.5, 0, 0, 7); g.stroke(); g.fillStyle = B.o; g.fillRect(V66T_CX + dx - 1, V66T_BY - dy - 2, 2, 4); }
  // HỐC CÂY: viền gỗ dày, lòng tối, đáy có nấm phát sáng nhỏ
  const hx = V66T_CX - 2, hy = V66T_BY - 70;
  g.fillStyle = B.o; g.beginPath(); g.ellipse(hx, hy, 19, 27, 0, 0, 7); g.fill(); g.fillStyle = B.h; g.beginPath(); g.ellipse(hx - 1, hy - 1, 16, 24, 0, 0, 7); g.fill();
  g.fillStyle = B.d; g.beginPath(); g.ellipse(hx + 1, hy + 1, 13, 21, 0, 0, 7); g.fill(); g.fillStyle = '#140a06'; g.beginPath(); g.ellipse(hx + 2, hy + 3, 10, 17, 0, 0, 7); g.fill();
  g.fillStyle = '#ffd98a'; g.fillRect(hx - 4, hy + 14, 3, 3); g.fillRect(hx + 3, hy + 15, 2, 2); g.fillStyle = '#fff3c4'; g.fillRect(hx - 3, hy + 13, 1, 1);
  // rêu: mảng xanh phủ phía bắc-trái và gốc
  const moss = se === 'dong' ? ['#5f8a74', '#8fb39c'] : se === 'thu' ? ['#6f7d2a', '#98a13a'] : ['#4f8a2c', '#7fb24a'];
  g.save(); g.globalCompositeOperation = 'source-atop';
  for(let i = 0; i < 900; i++){ const t = Math.pow(R(), 1.7)*.55, j = t*TH, hw = v66tHW(t), u = -1 + R()*1.2*(1 - t), x = V66T_CX + v66tTX(t) + u*hw, y = V66T_BY - j;
    if(R() < .55 - t) { g.fillStyle = moss[R() < .7 ? 0 : 1]; g.fillRect(x | 0, y | 0, 2, 1 + (R() < .4)); } }
  g.restore();
  // nấm nhỏ ở gốc
  const mush = [[-46, 4, 0], [-38, 8, 1], [44, 6, 0], [52, 2, 1], [-58, 12, 1], [22, 12, 0], [-14, 14, 1]];
  for(const [dx, dy, s] of mush){ const x = V66T_CX + dx, y = V66T_BY + dy, w = s ? 5 : 7;
    g.fillStyle = B.o; g.fillRect(x - 2, y - 6, 4, 7); g.fillStyle = '#f2e6c8'; g.fillRect(x - 1, y - 5, 2, 5);
    g.fillStyle = B.o; g.fillRect(x - w/2 - 1, y - 10 - s, w + 2, 6); g.fillStyle = se === 'dong' ? '#ffffff' : s ? '#e8a23a' : '#d8433a'; g.fillRect(x - w/2, y - 9 - s, w, 4);
    if(se !== 'dong'){ g.fillStyle = '#fff6e0'; g.fillRect(x - 1, y - 9 - s, 1, 1); g.fillRect(x + 1, y - 7 - s, 1, 1); } }
  v66tCrisp(c); return v66tGpu(c);
}

// ---------- 3. tán trước (sáng) + quả + nhà trên cây + cầu + thang + đèn lồng ----------
const V66T_TH = {x:V66T_CX + 128, y:V66T_BY - 292};     // sàn nhà trên cây (điểm)
const V66T_LK = {x:V66T_CX - 156, y:V66T_BY - 304};     // đài ngắm bên trái
function v66tFront(se){
  const P = V66T_PAL[se], [c, g] = v66tCv(620, 680, 1), R = v66tRnd(6603), L = [];
  // chùm lá trước: dày ở nửa dưới & hai bên, chừa khoảng nhìn thấy thân + cành + nhà
  for(let i = 0; i < 64; i++){ const a = R()*Math.PI*2, d = .35 + Math.sqrt(R())*.62, r = 24 + R()*22; let x = V66T_CX + Math.cos(a)*d*(V66T_RX - r*.6), y = V66T_CY + Math.sin(a)*d*(V66T_RY - r*.6) + 10;
    if(y > V66T_CY + 40 && Math.abs(x - V66T_CX) < 70) continue;                                    // khoảng hở trên thân
    if(Math.abs(x - V66T_TH.x - 6) < 52 && y > V66T_TH.y - 70 && y < V66T_TH.y + 24) continue;        // chừa nhà trên cây
    L.push([x, y, r, i]); }
  // viền dưới tán: hàng chùm nhỏ rủ xuống
  for(let i = 0; i < 15; i++){ const dx = -V66T_RX*.9 + i/14*V66T_RX*1.8; if(Math.abs(dx) < 66) continue; L.push([V66T_CX + dx, v66tBottom(dx) - 14, 22 + (i % 3)*5, 100 + i]); }
  L.sort((p, q) => p[1] - q[1]).forEach(([x, y, r, i]) => {
    let col = P.f;
    if(se === 'xuan' && i % 5 < 2) col = P.pink; else if(se === 'thu' && i % 4 === 0) col = P.red;
    v66tClump(g, x, y, r, se === 'thu' && col === P.red ? '#3e1410' : P.o, col);
    if(se === 'xuan' && col !== P.pink) for(let k = 0; k < 5; k++){ const px = x + (R()*2 - 1)*r*.7, py = y + (R()*2 - 1)*r*.6; g.fillStyle = P.pink[2]; g.fillRect(px | 0, py | 0, 2, 2); g.fillStyle = P.pink[3]; g.fillRect(px | 0, py | 0, 1, 1); } });
  v66tTexture(g, R, 1400, P.tex, P.f[3], .98);
  if(se === 'dong') v66tSnowCaps(g, L, P, R);
  v66tCrisp(c);
  // quả thần phát sáng (mùa đông = quả cầu đèn ấm)
  V66T.fruits = [];
  for(let i = 0, n = 0; i < 200 && n < 16; i++){ const x = V66T_CX + (R()*2 - 1)*V66T_RX*.82, y = V66T_CY + (R()*2 - 1)*V66T_RY*.7 + 30; if(!v66tInCan(x, y, .82) || Math.abs(x - V66T_TH.x) < 50 && Math.abs(y - V66T_TH.y + 20) < 50) continue;
    n++; V66T.fruits.push([(x - V66T_CX)*2, (y - V66T_BY)*2]);
    g.fillStyle = '#3a1a08'; g.fillRect(x - 3, y - 3, 7, 8); g.fillStyle = se === 'dong' ? '#ffb347' : se === 'xuan' ? '#ffd9e8' : '#ffc93c'; g.fillRect(x - 2, y - 2, 5, 6); g.fillStyle = '#fff6c8'; g.fillRect(x - 1, y - 1, 2, 2);
    g.fillStyle = '#2d6b36'; g.fillRect(x, y - 5, 2, 2); }
  v66tHouse(g, se); v66tBridge(g, se); v66tLanternsSpr(g, se);
  return v66tGpu(c);
}
// nhà trên cây: sàn ván, lan can, tường gỗ, mái đỏ NA, cửa sổ tròn, thang dây xuống đất
function v66tHouse(g, se){
  const T = V66T_TH, x = T.x, y = T.y, O = '#24130b', snow = se === 'dong';
  const R = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  // thang dây (2 dây + bậc)
  R(O, x - 10, y + 4, 3, V66T_BY - y - 2); R(O, x + 2, y + 4, 3, V66T_BY - y - 2); R('#c9a26a', x - 9, y + 4, 1, V66T_BY - y - 2); R('#c9a26a', x + 3, y + 4, 1, V66T_BY - y - 2);
  for(let yy = y + 12; yy < V66T_BY - 2; yy += 9){ R(O, x - 10, yy, 15, 3); R('#b07a48', x - 9, yy, 13, 1); }
  // giá đỡ chéo
  g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 30, y + 4); g.lineTo(x - 6, y + 26); g.moveTo(x + 40, y + 4); g.lineTo(x + 18, y + 28); g.stroke();
  // sàn
  R(O, x - 40, y, 86, 8); R('#9a6236', x - 39, y + 1, 84, 6); for(let k = x - 36; k < x + 44; k += 8) R('#7a4a28', k, y + 1, 1, 6); R('#c99560', x - 39, y + 1, 84, 1);
  // lan can
  for(let k = x - 38; k <= x + 42; k += 10){ R(O, k, y - 12, 3, 13); R('#b07a48', k + 1, y - 11, 1, 11); } R(O, x - 40, y - 14, 86, 3); R('#c99560', x - 39, y - 13, 84, 1);
  // tường
  const wx = x - 20, wy = y - 44, ww = 48, wh = 38; R(O, wx - 1, wy - 1, ww + 2, wh + 2); R('#b97a45', wx, wy, ww, wh);
  for(let k = wy + 6; k < wy + wh; k += 7) R('#8a5a35', wx, k, ww, 1); R('#d99a5c', wx, wy, 2, wh);
  // cửa + cửa sổ tròn
  R(O, wx + 28, wy + 14, 14, 24); R('#6b3f26', wx + 29, wy + 15, 12, 23); R('#ffd23f', wx + 38, wy + 26, 2, 2);
  g.fillStyle = O; g.beginPath(); g.arc(wx + 13, wy + 18, 8, 0, 7); g.fill(); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(wx + 13, wy + 18, 6, 0, 7); g.fill(); R(O, wx + 12, wy + 11, 2, 14); R(O, wx + 6, wy + 17, 14, 2);
  // mái đỏ kiểu NA (viền tối, ngói 2 tông) + ống khói
  R(O, wx + 30, wy - 30, 8, 18); R('#8f8a9a', wx + 31, wy - 29, 6, 16);
  g.fillStyle = O; g.beginPath(); g.moveTo(wx - 10, wy + 2); g.lineTo(wx + ww/2, wy - 30); g.lineTo(wx + ww + 10, wy + 2); g.closePath(); g.fill();
  g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(wx - 6, wy); g.lineTo(wx + ww/2, wy - 26); g.lineTo(wx + ww + 6, wy); g.closePath(); g.fill();
  g.fillStyle = '#e25b45'; for(let k = 0; k < 4; k++){ const yy = wy - 20 + k*6; R('#e25b45', wx + ww/2 - 5 - k*7, yy, 10 + k*14, 2); }
  if(snow){ g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(wx - 6, wy - 2); g.lineTo(wx + ww/2, wy - 28); g.lineTo(wx + ww + 6, wy - 2); g.lineTo(wx + ww/2, wy - 18); g.closePath(); g.fill(); R('#ffffff', x - 40, y - 2, 86, 3); }
  // cờ nhỏ trên nóc
  R(O, wx + ww/2 - 1, wy - 44, 2, 16); R('#ffd23f', wx + ww/2 + 1, wy - 44, 10, 6);
}
// đài ngắm bên trái + cầu dây võng nối sang nhà trên cây
function v66tBridge(g, se){
  const O = '#24130b', L = V66T_LK, T = V66T_TH, R = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  R(O, L.x - 30, L.y, 60, 8); R('#9a6236', L.x - 29, L.y + 1, 58, 6); R('#c99560', L.x - 29, L.y + 1, 58, 1);
  for(let k = L.x - 28; k <= L.x + 28; k += 8){ R(O, k, L.y - 12, 3, 13); } R(O, L.x - 30, L.y - 14, 60, 3); R('#c99560', L.x - 29, L.y - 13, 58, 1);
  g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.moveTo(L.x - 20, L.y + 6); g.lineTo(L.x, L.y + 28); g.moveTo(L.x + 22, L.y + 6); g.lineTo(L.x + 4, L.y + 28); g.stroke();
  // cờ đuôi nheo + chuông gió
  R(O, L.x - 26, L.y - 52, 2, 40); R('#3fa34d', L.x - 24, L.y - 52, 14, 5); R('#7cc451', L.x - 24, L.y - 47, 9, 4);
  // cầu: ván treo theo đường võng, 2 dây tay vịn
  const a = [L.x + 30, L.y + 2], b = [T.x - 40, T.y + 2], sag = 20, at = t => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t + Math.sin(t*Math.PI)*sag];
  for(let t = 0; t <= 1.001; t += 1/22){ const p = at(t); R(O, p[0] - 3, p[1] - 1, 7, 6); R('#a8703e', p[0] - 2, p[1], 5, 4); R('#c99560', p[0] - 2, p[1], 5, 1); }
  for(const dy of [-12, -11]){ g.strokeStyle = dy === -12 ? O : '#c9a26a'; g.lineWidth = dy === -12 ? 3 : 1; g.beginPath(); for(let t = 0; t <= 1.001; t += .05){ const p = at(t); t ? g.lineTo(p[0], p[1] + dy + Math.sin(t*Math.PI)*-6) : g.moveTo(p[0], p[1] + dy); } g.stroke(); }
  g.strokeStyle = O; g.lineWidth = 1; for(let t = .1; t < .95; t += .1){ const p = at(t); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 11 - Math.sin(t*Math.PI)*6); g.stroke(); }
  if(se === 'dong') for(let t = 0; t <= 1; t += 1/22){ const p = at(t); R('#ffffff', p[0] - 2, p[1] - 1, 5, 1); }
}
// đèn lồng treo dưới mép tán (đổi màu theo mùa); vị trí lưu để vẽ quầng sáng ban đêm
function v66tLampsPx(){ return [-215, -150, -86, -30, 30, 80, 155, 220].map((dx, i) => [V66T_CX + dx, v66tBottom(dx) - 18 + (i % 2)*10]); }
function v66tLanternsSpr(g, se){
  const O = '#24130b', cols = se === 'xuan' ? ['#e2577f', '#ffb3cb'] : se === 'thu' ? ['#e0742a', '#ffc46b'] : se === 'dong' ? ['#d23b3b', '#ffd27a'] : ['#e8a23a', '#ffe08a'];
  v66tLampsPx().forEach(([x, y], i) => { const s = 22 + (i % 3)*6;
    g.fillStyle = '#5a3a22'; g.fillRect(x, y - s, 1, s);
    g.fillStyle = O; g.fillRect(x - 5, y - 1, 11, 14); g.fillStyle = cols[0]; g.fillRect(x - 4, y, 9, 12); g.fillStyle = cols[1]; g.fillRect(x - 2, y + 2, 4, 8);
    g.fillStyle = '#3a2a18'; g.fillRect(x - 4, y - 2, 9, 2); g.fillRect(x - 3, y + 12, 7, 2); g.fillStyle = '#ffd23f'; g.fillRect(x, y + 14, 1, 3); });
}
// toạ độ đèn lồng so với chân cây (px thế giới) — dùng cho ánh đèn v25
function v66tLampsW(){ if(!V66T.lw) V66T.lw = v66tLampsPx().map(([x, y]) => [(x - V66T_CX)*2, (y + 6 - V66T_BY)*2]); return V66T.lw; }

// ---------- 4. bộ lớp theo mùa (cache) ----------
function v66tLayers(){
  const se = v66tSe(); if(V66T.spr.se === se) return V66T.spr;
  const t0 = performance.now(); V66T.spr = {se, back:v66tBack(se), body:v66tBody(se), front:v66tFront(se)};
  const [f, g] = v66tCv(620, 680); for(const k of ['back', 'body', 'front']) g.drawImage(V66T.spr[k], 0, 0); V66T.spr.full = f;
  V66T.spr.halo = null; V66T.bakeMs = Math.round(performance.now() - t0); return V66T.spr;
}
function v66tThumb(){ const G = v66tGeo(), L = v66tLayers(), s = .25, [c, g] = v66tCv(Math.round(G.CW*s + 20), Math.round((1250 + G.RP + 40)*s)); g.scale(s, s); g.translate(-(G.bx - G.CW/2 - 40), -(G.by - 1250));
  g.fillStyle = '#d8c8a0'; g.beginPath(); g.arc(G.bx, G.by, G.RP, 0, 7); g.fill(); for(const k of ['back', 'body', 'front']) g.drawImage(L[k], G.sx, G.sy, G.SW*2, G.SH*2); return c; }

// ---------- 5. NỀN: quảng trường tròn tỷ lệ vàng, xoắn ốc vàng lát đá, rễ trồi, ghế, đèn, biển gỗ ----------
function v66tGround(g, x0, y0, w, h, lod){
  const G = v66tGeo(), bx = G.bx, by = G.by, RP = G.RP, P = V66T_PHI, se = v66tSe(), dong = se === 'dong', na = typeof V64S !== 'undefined' && V64S.img && V64S.img.FI;
  const pat = (k, c, r, f) => (lod < 2 && na) ? v64sPat(g, k, c, r, 2) : f, ring = (r, f) => { g.beginPath(); g.arc(bx, by, r, 0, Math.PI*2); g.fillStyle = f; g.fill(); };
  g.save(); g.imageSmoothingEnabled = false;
  // bóng tán đổ lên cỏ (ban ngày, phía bắc)
  // vòng cỏ hoa ngoài cùng (RP·φ^¼) → viền nâu → đá lát (RP) → vòng đá vàng (RP/φ) → đất rêu quanh gốc (RP/φ²)
  ring(RP + 8, '#4a3428'); ring(RP, pat('FI', 17, 1, '#d9c39a')); if(dong) ring(RP, 'rgba(255,255,255,.45)');
  ring(RP/P + 6, '#4a3428'); ring(RP/P, pat('FI', 1, 13, '#e8c27a')); if(dong) ring(RP/P, 'rgba(255,255,255,.35)');
  ring(RP/P/P + 6, '#3a2618'); ring(RP/P/P, dong ? '#cfd8dc' : '#5b3b26');
  if(lod === 2){ g.restore(); return; }
  // xoắn ốc vàng: đá sáng xếp theo r = a·φ^(2θ/π) giữa vòng RP/φ và RP
  const R0 = RP/P/P + 12; for(let k = 0; k < 2; k++) for(let th = 0; th < Math.PI*2.2; th += .06){ const r = R0*Math.pow(P, 2*th/Math.PI*.42); if(r > RP - 10) break; const a = th + k*Math.PI;
    const x = bx + Math.cos(a)*r, y = by + Math.sin(a)*r; g.fillStyle = '#4a3428'; g.fillRect(x - 6, y - 6, 12, 12); g.fillStyle = dong ? '#f4f7fa' : '#f2dfae'; g.fillRect(x - 5, y - 5, 10, 10); g.fillStyle = dong ? '#dfe8ee' : '#d8b878'; g.fillRect(x - 5, y + 2, 10, 3); }
  // rêu & cỏ trong vòng đất
  const Rn = v66tRnd(6604);
  for(let i = 0; i < 160; i++){ const a = Rn()*Math.PI*2, r = Math.sqrt(Rn())*(RP/P/P - 6), x = bx + Math.cos(a)*r, y = by + Math.sin(a)*r;
    g.fillStyle = dong ? (Rn() < .5 ? '#ffffff' : '#e3ecf1') : (Rn() < .6 ? '#4f8a2c' : '#7fb24a'); g.fillRect(x | 0, y | 0, 4, 2 + (Rn() < .5 ? 2 : 0)); }
  // RỄ LỚN trồi lên mặt đất, toả rộng (đè lên vòng đá)
  const B = V66T_BARK, roots = [[-1.2, 300, 30], [-2.0, 250, 26], [-.35, 260, 26], [2.55, 230, 22], [.6, 236, 22], [-2.75, 200, 18], [1.65, 150, 16], [3.0, 190, 18], [-.05, 150, 15]];
  for(const [a0, len, w0] of roots){ const pts = []; let a = a0; for(let i = 0; i <= 10; i++){ const t = i/10, r = 30 + t*len; a += Math.sin(i*1.7 + a0*3)*.06; pts.push([bx + Math.cos(a)*r*1.18, by - 18 + Math.sin(a)*r*.62, w0*(1 - t*.85)]); }
    for(const [col, k, dy] of [['rgba(0,0,0,.22)', 1.1, 6], [B.o, 1, 0], [B.m, .72, -1], [B.l, .38, -3]]){ g.strokeStyle = col; g.lineCap = 'round';
      for(let i = 1; i < pts.length; i++){ g.lineWidth = Math.max(2, pts[i][2]*k + (col === B.o ? 4 : 0)); g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1] + dy); g.lineTo(pts[i][0], pts[i][1] + dy); g.stroke(); } }
    if(dong){ g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); for(let i = 2; i < 8; i++) i === 2 ? g.moveTo(pts[i][0], pts[i][1] - pts[i][2]*.4) : g.lineTo(pts[i][0], pts[i][1] - pts[i][2]*.4); g.stroke(); }
    else { const m = pts[4]; g.fillStyle = '#5a9a32'; g.fillRect(m[0] - 6, m[1] - m[2]*.5, 12, 4); g.fillStyle = '#86c24e'; g.fillRect(m[0] - 3, m[1] - m[2]*.5, 6, 2); } }
  // bồn hoa quanh viền ngoài (hoa NA)
  if(na && !dong){ for(let i = 0; i < 26; i++){ const a = i/26*Math.PI*2 + .12; if(Math.abs(a - Math.PI/2) < .3) continue; const x = bx + Math.cos(a)*(RP + 20), y = by + Math.sin(a)*(RP + 20);
    v64sT(g, 'N', se === 'thu' ? 1 : [0, 3, 6][i % 3], se === 'thu' ? 10 : 11, x - 12, y - 14, 1, 1, 1.5); } }
  // ghế + đèn + biển gỗ
  if(typeof v64sBenchSpr === 'function'){ for(const a of [-.38, Math.PI + .38, .52, Math.PI - .52]){ const x = bx + Math.cos(a)*RP*.8, y = by + Math.sin(a)*RP*.8; g.drawImage(v64sBenchSpr(), x - 36, y - 26); }
    for(const a of [-.95, Math.PI + .95, .98, Math.PI - .98]){ const x = bx + Math.cos(a)*(RP + 16), y = by + Math.sin(a)*(RP + 16); g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, 10, 4, 0, 0, 7); g.fill(); g.drawImage(v64sLampSpr(), x - 12, y - 60); } }
  if(typeof v64sSign === 'function') v64sSign(g, bx + 74, by + RP + 46, '🌳 Cây thần kỳ');
  g.restore();
}
