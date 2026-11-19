// ================= v70e · LÝ DO QUAY LẠI MỖI NGÀY 2/3: thế giới — trang trí quảng trường cổng trường, NPC mặc đồ lễ, bảng vàng + bục vinh danh, hoạt động ngoài trời =================
// Mọi thứ vẽ bằng hình chữ nhật pixel tự vẽ (không ảnh ngoài). Toạ độ thế giới mới quanh cổng trường v46Gate().
// Tỷ lệ vàng: dây đèn võng xuống 1/φ³ khoảng cách cột, khoảng đèn = 38 ≈ 24·φ, bảng vàng rộng 194 = 120·φ.
function v70eGeo(){
  const g = v46Gate(), k = g[0] + ',' + g[1]; if(V70E.G && V70E.G.k === k) return V70E.G;
  const cx = g[0], cy = g[1] - 50, R = 285, P = a => [Math.round(cx + Math.cos(a*Math.PI/180)*R), Math.round(cy + Math.sin(a*Math.PI/180)*R)];
  const G = {k, g, cx, cy, R, pL:[g[0] - 119, g[1] - 176], pR:[g[0] + 119, g[1] - 176], poles:{nw:P(215), sw:P(140), s1:P(110), s2:P(70), se:P(40), ne:P(-35)},
    board:[g[0] - 252, g[1] + 46], pod:[g[0] + 252, g[1] + 46]};
  G.strings = [[G.pL, G.poles.nw], [G.poles.sw, G.poles.s1], [G.pR, G.poles.ne], [G.poles.se, G.poles.s2]];   // trái/phải để trống cho bảng vàng + bục vinh danh
  // rước đèn: trước cổng → Tây → Nam → Đông → về cổng
  G.lap = [[g[0], g[1] + 46], [g[0] - 196, g[1] + 152], [g[0], g[1] + 196], [g[0] + 196, g[1] + 152], [g[0], g[1] + 46]];
  V70E.G = G; return G;
}
const V70E_PH = 64;     // cột đèn cao 64

// ---------- 1. vẽ: dây đèn, cờ, băng rôn, cổng hoa (trên cao, vẽ sau người) ----------
function v70eSag(a, b, t, sag){ return [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t + Math.sin(t*Math.PI)*sag]; }
function v70eOver(VBn){
  const ev = v70eEvent(); if(!ev || cam.z < .22) return; const G = v70eGeo();
  if(G.cx + 420 < VBn.x0 || G.cx - 420 > VBn.x1 || G.cy + 420 < VBn.y0 || G.cy - 420 > VBn.y1) return;
  const T = ev.th, t = realT, wind = (typeof WEATHERS !== 'undefined' && WEATHERS[weather]) ? WEATHERS[weather].wind : .2, night = typeof lightLevel === 'function' ? lightLevel() : 0;
  ctx.save();
  G.strings.forEach(([a0, b0], si) => {
    const a = si % 2 === 0 ? a0 : [a0[0], a0[1] - V70E_PH], b = [b0[0], b0[1] - V70E_PH], L = Math.hypot(b[0] - a[0], b[1] - a[1]), sag = L/(V70E_PHI**3);
    // dây
    ctx.strokeStyle = 'rgba(40,26,16,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); for(let i = 0; i <= 12; i++){ const p = v70eSag(a, b, i/12, sag); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
    const n = Math.max(2, Math.floor(L/(T.lan ? 34 : 26)));
    for(let i = 1; i < n; i++){
      const u = i/n, p = v70eSag(a, b, u, sag), sw = Math.sin(t*1.7 + i*.9 + si)*(1.5 + wind*2.5), x = Math.round(p[0] + sw), y = Math.round(p[1]);
      if(T.flag && !T.lan){ const c = T.flag[(i + si) % T.flag.length]; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(p[0] - 7, p[1] + 1); ctx.lineTo(p[0] + 7, p[1] + 1); ctx.lineTo(p[0] + sw*.6, p[1] + 15); ctx.closePath(); ctx.fill(); }
      if(T.lan){ const c = T.lan[(i + si) % T.lan.length]; rect('#3a2414', x, y, 1, 6);
        if(T.star){ v70eStar(x + .5, y + 16, 11, c, night); rect(T.tassel || '#e53935', x, y + 26, 1, 6); }
        else { rect('#5a2a10', x - 6, y + 5, 13, 3); rect(c, x - 8, y + 8, 17, 16); rect(T.lan[1] || c, x - 8, y + 12, 17, 2); rect(T.lan[1] || c, x - 8, y + 18, 17, 2); rect('rgba(255,255,255,.3)', x - 5, y + 9, 3, 14); rect('#5a2a10', x - 6, y + 24, 13, 3); rect(T.tassel || '#ffd23f', x, y + 27, 1, 7); rect(T.tassel || '#ffd23f', x - 1, y + 33, 3, 2); if(night > .15){ ctx.fillStyle = `rgba(255,210,120,${Math.min(.5, night*.7)})`; ctx.fillRect(x - 12, y + 4, 25, 24); } } }
      if(T.bulb){ const c = T.bulb[(i + si) % T.bulb.length], on = Math.floor(t*2 + i) % 3 !== 0; rect('#2a2a2a', x, y + 1, 1, 3); rect(on ? c : 'rgba(80,80,80,.9)', x - 2, y + 4, 5, 6); if(on && night > .1){ ctx.fillStyle = 'rgba(255,240,180,.35)'; ctx.fillRect(x - 5, y + 1, 11, 12); } }
      if(T.leaf && i % 2){ rect('#2e7d32', x - 6, y + 1, 7, 5); rect('#66bb6a', x, y + 3, 7, 5); rect('#9ccc65', x - 2, y + 6, 5, 4); }
    }
  });
  // cột đèn (đỉnh)
  Object.values(G.poles).forEach(p => { rect('#ffd23f', p[0] - 3, p[1] - V70E_PH - 4, 7, 5); });
  v70eGate(G, ev, t);
  v70eBanner(G, ev, t, wind);
  ctx.restore();
}
function v70eStar(x, y, r, c, night){
  ctx.fillStyle = c; ctx.beginPath(); for(let k = 0; k < 10; k++){ const a = -Math.PI/2 + k*Math.PI/5, rr = k % 2 ? r*.45 : r; ctx.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,.7)'; ctx.lineWidth = 1; ctx.stroke();
  if(night > .15){ ctx.fillStyle = `rgba(255,220,120,${Math.min(.45, night*.6)})`; ctx.beginPath(); ctx.arc(x, y, r*1.5, 0, 7); ctx.fill(); }
}
// cổng hoa: hoa dọc hai trụ + vòm hoa trên biển tên trường
function v70eGate(G, ev, t){
  const T = ev.th, F = T.fl || ['#fff'], g = G.g; if(!F) return;
  const dot = (x, y, c, k) => { rect(c, x - 2, y - 2, 5, 5); rect(k % 3 ? '#ffe082' : '#fff', x, y, 1, 1); };
  for(let s = -1; s <= 1; s += 2){ const px = g[0] + s*119; for(let y = -168, k = 0; y < -6; y += 9, k++){ rect('#2e7d32', px - 22 + (k % 2)*41, g[1] + y - 2, 5, 7); dot(px - 21 + (k % 2)*41, g[1] + y, F[k % F.length], k); } }
  if(T.arch){ for(let k = 0; k <= 26; k++){ const a = Math.PI + k/26*Math.PI, x = g[0] + Math.cos(a)*150, y = g[1] - 182 + Math.sin(a)*64; rect('#2e7d32', x - 4, y - 3, 9, 7); dot(x, y, F[k % F.length], k); dot(x + 4, y + 3, F[(k + 1) % F.length], k + 1); } }
  if(T.balloon){ for(let s = -1; s <= 1; s += 2) for(let i = 0; i < 4; i++){ const bx = g[0] + s*(150 + i*9), by = g[1] - 70 - i*12 + Math.sin(t*1.3 + i + s)*3, c = ['#e53935', '#ffd23f', '#29b6f6', '#ec407a'][i];
    ctx.strokeStyle = 'rgba(60,60,60,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g[0] + s*140, g[1] - 4); ctx.lineTo(bx, by + 9); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(bx, by, 7, 9, 0, 0, 7); ctx.fill(); rect('rgba(255,255,255,.55)', bx - 4, by - 5, 2, 3); } }
}
// băng rôn vải giữa 2 cột phía Nam (lối vào quảng trường)
function v70eBanner(G, ev, t, wind){
  const a = G.poles.s1, b = G.poles.s2, x0 = Math.min(a[0], b[0]) + 2, x1 = Math.max(a[0], b[0]) - 2, y = Math.min(a[1], b[1]) - V70E_PH + 4, w = x1 - x0, h = 26;
  const col = {tet:'#c62828', trungthu:'#e65100', khaigiang:'#1565c0', nhagiao:'#ad1457', thieunhi:'#6a1b9a', noel:'#2e7d32', khoahoc:'#1565c0', caythan:'#2e7d32', hoithao:'#c62828', rubik:'#283593'}[ev.k] || '#c62828';
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0 + 3, y + 4, w, h);
  for(let i = 0; i < w; i += 4){ const wv = Math.sin(t*2 + i*.06)*(.6 + wind); ctx.fillStyle = col; ctx.fillRect(x0 + i, y + wv, 4, h); }
  rect('#ffd23f', x0, y - 1, w, 2); rect('#ffd23f', x0, y + h - 1, w, 2);
  ctx.font = '900 16px Nunito, "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillText(ev.ban, x0 + w/2 + 1, y + h/2 + 2, w - 8); ctx.fillStyle = '#fff8e1'; ctx.fillText(ev.ban, x0 + w/2, y + h/2 + 1, w - 8);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

// ---------- 2. vẽ dưới đất, xếp theo y với người: cột đèn, bảng vàng, bục vinh danh, cây thông, hộp quà / mốc rước đèn ----------
function v70eGround(){
  if(cam.z < .22) return; const G = v70eGeo(), VBn = V46.VBn || VB; if(G.cx + 420 < VBn.x0 || G.cx - 420 > VBn.x1 || G.cy + 420 < VBn.y0 || G.cy - 420 > VBn.y1) return;
  const ev = v70eEvent();
  if(ev){ Object.values(G.poles).forEach(p => { rect('rgba(0,0,0,.2)', p[0] - 5, p[1] - 2, 11, 4); rect('#5a3a22', p[0] - 2, p[1] - V70E_PH, 4, V70E_PH); rect('#3a2414', p[0] - 3, p[1] - 6, 6, 6); });
    if(ev.th.pine) [-1, 1].forEach(s => v70ePine(G.g[0] + s*150, G.g[1] + 200)); }
  v70eBoardDraw(G); v70ePodium(G);
  v70eMarks(G);
}
function v70ePine(x, y){
  rect('rgba(0,0,0,.2)', x - 16, y - 2, 32, 5); rect('#6d4c2a', x - 3, y - 10, 6, 10);
  for(let i = 0; i < 4; i++){ const w = 32 - i*7, yy = y - 14 - i*11; rect('#1b5e20', x - w/2, yy, w, 10); rect('#2e7d32', x - w/2 + 2, yy, w - 6, 6); }
  v70eStar(x, y - 60, 6, '#ffd23f', 0);
  const C = ['#e53935', '#ffd23f', '#29b6f6', '#fff']; for(let i = 0; i < 9; i++){ const on = Math.floor(realT*3 + i) % 2; rect(on ? C[i % 4] : '#455a64', x - 12 + (i*7) % 24, y - 16 - Math.floor(i/3)*11, 3, 3); }
}
// bảng vàng: canvas nướng sẵn (vẽ lại khi xếp hạng đổi), chữ Nunito 16px
function v70eBoardKey(){ return V70E_BC.map(c => v70eRows(c.k).slice(0, 3).map(r => r.u + ':' + r[c.k]).join(',')).join('|'); }
function v70eBoardDraw(G){
  const [bx, by] = G.board; if(realT - V70E.bT > 3 || !V70E.board){ V70E.bT = realT; const k = v70eBoardKey(); if(k !== V70E.bKey || !V70E.board){ V70E.bKey = k; V70E.board = v70eBoardBake(); } }
  rect('rgba(0,0,0,.22)', bx - 100, by - 3, 200, 7); rect('#4a2c16', bx - 86, by - 40, 8, 40); rect('#4a2c16', bx + 78, by - 40, 8, 40);
  const B = V70E.board; ctx.drawImage(B, bx - 97, by - 40 - 156, 194, 156);
}
function v70eBoardBake(){
  const K = 2, W = 194, H = 156, c = document.createElement('canvas'); c.width = W*K; c.height = H*K; const g = c.getContext('2d'); g.scale(K, K);
  g.fillStyle = '#3a2414'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8913e'; g.fillRect(3, 3, W - 6, H - 6); g.fillStyle = '#7a1f1f'; g.fillRect(7, 7, W - 14, H - 14);
  g.fillStyle = '#ffd23f'; g.fillRect(7, 7, W - 14, 27); g.fillStyle = '#3a2414'; g.font = '900 16px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BẢNG VÀNG', W/2, 21);
  const col = {rubik:['#fff', '#e53935', '#43a047'], chess:['#fff', '#222', '#fff'], fish:['#29b6f6', '#fff', '#0277bd'], week:['#ffd23f', '#fff', '#ef6c00']};
  V70E_BC.forEach((C, i) => { const y = 40 + i*28, top = v70eRows(C.k)[0];
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(11, y, W - 22, 25);
    const q = col[C.k]; g.fillStyle = q[0]; g.fillRect(15, y + 5, 15, 15); g.fillStyle = q[1]; g.fillRect(18, y + 8, 4, 4); g.fillRect(23, y + 13, 4, 4); g.fillStyle = q[2]; g.fillRect(23, y + 8, 4, 4); g.fillRect(18, y + 13, 4, 4);
    g.textAlign = 'left'; g.fillStyle = '#ffe9a8'; g.font = '800 16px Nunito, sans-serif'; g.fillText(C.n.replace('Chăm chỉ tuần', 'Chăm tuần'), 36, y + 13, 64);
    g.textAlign = 'right'; g.fillStyle = top && top.me ? '#7cf29c' : '#fff'; g.fillText(top ? String(top.u).slice(0, 11) : '—', W - 14, y + 13, 74); });
  return c;
}
// bục vinh danh: 3 tượng vàng / bạc / đồng của top 3 "Chăm chỉ tuần"
function v70ePodium(G){
  const [px, py] = G.pod, top = v70eRows('week').slice(0, 3), M = [['#ffd23f', '#e0a21a', '#fff3b0'], ['#cfd8dc', '#90a4ae', '#ffffff'], ['#e0a070', '#b0703a', '#ffd2a8']];
  const slots = [[0, 0, 40], [1, -60, 26], [2, 60, 16]];
  rect('rgba(0,0,0,.22)', px - 92, py - 3, 184, 7);
  slots.forEach(([i, dx, h]) => { const x = px + dx, m = M[i]; rect('#e8e2d0', x - 28, py - h, 56, h); rect('#c9c0aa', x - 28, py - 4, 56, 4); rect('#bfb59c', x - 28, py - h, 56, 3);
    ctx.font = '900 16px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7a5a2a'; ctx.fillText(String(i + 1), x, py - h/2 + 1);
    const r = top[i]; if(!r) return; const sy = py - h, bob = 0;
    // tượng: đế, chân, thân, tay giơ cúp, đầu
    rect(m[1], x - 9, sy - 4, 18, 4); rect(m[0], x - 6, sy - 16, 5, 12); rect(m[0], x + 1, sy - 16, 5, 12); rect(m[0], x - 8, sy - 32 + bob, 16, 17); rect(m[2], x - 6, sy - 30, 4, 12);
    rect(m[0], x + 7, sy - 44, 4, 14); rect(m[1], x + 4, sy - 50, 10, 6); rect(m[0], x + 6, sy - 54, 6, 4); rect(m[0], x - 11, sy - 30, 4, 12);
    rect(m[0], x - 6, sy - 44, 12, 12); rect(m[2], x - 4, sy - 42, 4, 4); rect(m[1], x - 6, sy - 46, 12, 3);
    if(Math.floor(realT*2 + i) % 4 === 0) rect('#fff', x + 9 + i, sy - 58, 2, 2);
    // bảng tên
    ctx.font = '800 16px Nunito, sans-serif'; const nm = String(r.u).slice(0, 10), w = Math.ceil(ctx.measureText(nm).width) + 10;
    ctx.fillStyle = r.me ? 'rgba(18,110,72,.9)' : 'rgba(43,26,16,.85)'; const ty = py + 6 + (i ? 23 : 0); ctx.fillRect(Math.round(x - w/2), ty, w, 21); ctx.fillStyle = '#fff'; ctx.fillText(nm, x, ty + 11);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
// mốc rước đèn / hộp quà / bóng bay đang làm
function v70eMarks(G){
  const A = V70E.act; if(!A) return; const t = realT;
  if(A.type === 'lap'){ const p = G.lap[A.i]; if(!p) return; const r = 26 + Math.sin(t*4)*3; ctx.strokeStyle = 'rgba(255,210,63,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p[0], p[1], r, r*.45, 0, 0, 7); ctx.stroke(); v70eStar(p[0], p[1] - 30 + Math.sin(t*3)*3, 9, '#ffd23f', 0); }
  if(A.type === 'collect') A.pts.forEach((p, i) => { if(A.got[i]) return; const b = Math.sin(t*3 + i)*3; rect('rgba(0,0,0,.2)', p[0] - 9, p[1] - 2, 18, 4);
    if(A.what === 'balloon'){ const c = ['#e53935', '#ffd23f', '#29b6f6', '#ec407a', '#66bb6a'][i % 5]; rect('#666', p[0], p[1] - 22 + b, 1, 22); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 32 + b, 9, 11, 0, 0, 7); ctx.fill(); rect('rgba(255,255,255,.6)', p[0] - 5, p[1] - 38 + b, 2, 4); }
    else { const c = ['#e53935', '#43a047', '#1e88e5', '#ffd23f', '#8e24aa'][i % 5], y = p[1] + b*.3; ctx.strokeStyle = `rgba(255,210,63,${.5 + Math.sin(t*4 + i)*.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p[0], p[1], 20, 8, 0, 0, 7); ctx.stroke();
      rect('#2b1a10', p[0] - 13, y - 23, 26, 21); rect(c, p[0] - 12, y - 22, 24, 19); rect('#fff3b0', p[0] - 2, y - 22, 4, 19); rect('#fff3b0', p[0] - 13, y - 16, 26, 4); rect('#fff3b0', p[0] - 7, y - 28, 6, 6); rect('#fff3b0', p[0] + 1, y - 28, 6, 6); rect('rgba(255,255,255,.35)', p[0] - 10, y - 21, 3, 4); }
    if(Math.floor(t*3 + i) % 3 === 0) rect('#fff', p[0] + 10, p[1] - 30, 2, 2); });
}

// ---------- 3. NPC mặc đồ lễ (vẽ sau thân, trước icon cầm tay) ----------
function v70eWear(a, by){
  if(!V70E.wear) return; const ev = v70eEvent(); if(!ev) return; const W = ev.wear, me = typeof PLAYER !== 'undefined' && a === PLAYER, d = a.dir > 0 ? 1 : -1, hx = d > 0 ? 8 : -12;
  if(me){ if(V70E.act && V70E.act.type === 'lap' && W === 'trungthu'){ rect('#6d4c2a', hx + 2, -34 + by, 1, 14); v70eStar(hx + 2.5, -38 + by, 6, '#ffd23f', typeof lightLevel === 'function' ? lightLevel() : 0); } return; }
  if(a.lion || a.boat || a.cycling || a.mount) return;
  const teach = !a.student, k = (a.idx || 0) + (a.id ? a.id.length : 0);
  if(W === 'noel' && !(a.id === 'nam' && festival && festival.kind === 'noel')){ rect('#d32f2f', -6, -38 + by, 12, 5); rect('#d32f2f', d*3 - 2, -42 + by, 6, 5); rect('#fff', -6, -34 + by, 12, 2); rect('#fff', d*6 - 1, -44 + by, 3, 3); }
  else if(W === 'tet'){ if(teach){ rect('#ffd23f', -6, -36 + by, 12, 2); rect('#e53935', -1, -37 + by, 3, 3); } else { rect('#e53935', -6, -35 + by, 12, 2); } if(k % 3 === 0){ rect('#e53935', hx, -22 + by, 6, 8); rect('#ffd23f', hx + 2, -20 + by, 2, 2); } }
  else if(W === 'trungthu'){ if(a.student){ rect('#6d4c2a', hx + 2, -34 + by, 1, 14); v70eStar(hx + 2.5, -38 + by + Math.sin(realT*3 + k)*1, 5, ['#ffd23f', '#ef6c00', '#e53935'][k % 3], 0); } else { rect('#ef6c00', hx, -24 + by, 6, 8); rect('#ffd23f', hx + 1, -23 + by, 4, 6); } }
  else if(W === 'khaigiang' || W === 'thieunhi'){ if(a.student){ rect('#e53935', -5, -24 + by, 10, 2); rect('#e53935', -1, -23 + by, 3, 4); } if(W === 'thieunhi' && k % 2){ rect('#888', hx + 2, -40 + by, 1, 18); ctx.fillStyle = ['#e53935', '#29b6f6', '#ffd23f'][k % 3]; ctx.beginPath(); ctx.ellipse(hx + 2.5, -45 + by, 4, 5, 0, 0, 7); ctx.fill(); } }
  else if(W === 'nhagiao'){ if(teach){ rect('#e53935', d > 0 ? 1 : -4, -22 + by, 3, 3); rect('#ffd23f', d > 0 ? 2 : -3, -21 + by, 1, 1); } else if(k % 2 === 0){ rect('#2e7d32', hx + 2, -22 + by, 2, 9); rect('#ec407a', hx, -26 + by, 3, 3); rect('#e53935', hx + 3, -27 + by, 3, 3); rect('#ffd23f', hx + 1, -29 + by, 3, 3); } }
  else if(W === 'hoithao'){ rect(a.group === 'B' ? '#1e88e5' : '#e53935', -6, -33 + by, 12, 2); }
  else if(W === 'khoahoc'){ if(a.student){ rect('#26c6da', -5, -30 + by, 4, 3); rect('#26c6da', 1, -30 + by, 4, 3); rect('#00838f', -1, -29 + by, 2, 1); } }
  else if(W === 'caythan'){ rect('#43a047', -6, -36 + by, 4, 3); rect('#66bb6a', -2, -37 + by, 4, 3); rect('#43a047', 2, -36 + by, 4, 3); }
  else if(W === 'rubik'){ if(a.student && k % 2 === 0){ try { miniCube(hx, -24 + by, 2.4); } catch(e){} } }
}

// ---------- 4. hoạt động ngoài trời: rước đèn (đi vòng các mốc) / nhặt quà, bóng bay ----------
function v70eStartWorld(act){
  const G = v70eGeo(), A = V70E_ACT[act]; if(!A) return;
  if(A.type === 'lap') V70E.act = {k:act, type:'lap', i:0, n:G.lap.length};
  else { const r = v70eRnd(v70eHash(v70eDay() + act)), pts = []; for(let i = 0, tries = 0; pts.length < 5 && tries < 200; tries++){ const a = (24 + i*33 + r()*14)*Math.PI/180, rr = 120 + r()*120, q = [Math.round(G.g[0] + Math.cos(a)*rr), Math.round(G.g[1] + 30 + Math.sin(a)*rr*.85)]; if(Math.hypot(q[0] - G.board[0], q[1] - G.board[1]) < 130 || Math.hypot(q[0] - G.pod[0], q[1] - G.pod[1]) < 130) continue; pts.push(q); i++; } V70E.act = {k:act, type:'collect', what:A.what, pts, got:{}, n:0}; }
  try { v70eClose(); } catch(e){} try { if(typeof PLAYER !== 'undefined' && PLAYER && Math.hypot(v46Pos(PLAYER)[0] - G.cx, v46Pos(PLAYER)[1] - G.cy) > 700) v32Nav(G.g[0] + V46E, G.g[1] + 60, 'Quảng trường cổng trường', true); } catch(e){}
  try { toast(A.how); } catch(e){}
}
function v70eTickAct(){
  const A = V70E.act; if(!A || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return; const p = v46Pos(PLAYER), G = v70eGeo();
  if(A.type === 'lap'){ const q = G.lap[A.i]; if(q && Math.hypot(p[0] - q[0], p[1] - q[1]) < 58){ A.i++; try { blipSfx(880 + A.i*120); } catch(e){} if(A.i >= A.n){ V70E.act = null; v70eFinishWorld(A.k); } else try { toast(`⭐ Rước đèn: mốc ${A.i}/${A.n - 1} · đi tiếp tới ngôi sao vàng!`); } catch(e){} } }
  else { A.pts.forEach((q, i) => { if(!A.got[i] && Math.hypot(p[0] - q[0], p[1] - q[1]) < 48){ A.got[i] = 1; A.n++; try { blipSfx(1000 + A.n*90); floatText(A.what === 'balloon' ? '🎈 +1' : '🎁 +1', '#ffd23f'); } catch(e){} } }); if(A.n >= A.pts.length){ V70E.act = null; v70eFinishWorld(A.k); } }
}
function v70eFinishWorld(k){ try { cheerSfx(); } catch(e){} const paid = v70eActDone(k); try { toast(`🎉 Hoàn thành “${V70E_ACT[k].n}”!` + (paid ? ' +30 EXP, +$15' : ' (hôm nay em đã nhận quà rồi)')); } catch(e){} }

// ---------- 5. lại gần / chạm ----------
function v70eTick(){
  try { v70eTickAct(); } catch(e){}
  const hidden = typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible || (V70E.panel && !V70E.panel.hidden) || (typeof V53C !== 'undefined' && V53C.mode) || (typeof V46 !== 'undefined' && V46.sky);
  if(hidden){ v70eBtn(null); return; }
  const p = v46Pos(PLAYER), G = v70eGeo(), dB = Math.min(Math.hypot(p[0] - G.board[0], p[1] - G.board[1] - 10), Math.hypot(p[0] - G.pod[0], p[1] - G.pod[1] - 10)), ev = v70eEvent(), A = V70E.act;
  if(A){ const left = A.type === 'lap' ? `${A.i}/${A.n - 1} mốc` : `${A.n}/${A.pts.length}`; v70eBtn('act', `${V70E_ACT[A.k].ic} ${V70E_ACT[A.k].n} · ${left} <small>Chạm để dừng</small>`); return; }
  if(dB < 140){ v70eBtn('board', '🏆 Bảng vàng <small>Honor Board</small>'); return; }
  if(ev && Math.hypot(p[0] - G.cx, p[1] - G.cy) < 330){ v70eBtn('fest', `${ev.ic} ${ev.n} <small>Lễ hội</small>`); return; }
  v70eBtn(null);
}
function v70eBtn(id, html){
  let b = document.getElementById('v70eGo'); if(!b){ if(!id) return; b = document.createElement('button'); b.type = 'button'; b.id = 'v70eGo'; b.className = 'v53cEnter v70eGo';
    b.onclick = () => { if(b._id === 'board') v70eOpen('board'); else if(b._id === 'act'){ V70E.act = null; toast('Đã dừng hoạt động. Mở lại trong 🎉 Lễ hội khi muốn nhé.'); } else v70eOpen('fest'); }; (document.getElementById('stage') || document.body).appendChild(b); }
  if(!id){ b.hidden = true; b._id = ''; return; } if(b._id !== id || b._h !== html){ b._id = id; b._h = html; b.innerHTML = html; } b.hidden = false;
}
function v70eTap(e){
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible || (V70E.panel && !V70E.panel.hidden)) return;
  const r = cvs.getBoundingClientRect(), wx = cam.x + (e.clientX - r.left - cw/2)/cam.z, wy = cam.y + (e.clientY - r.top - ch/2)/cam.z, G = v70eGeo();
  const hit = (q, w, h) => Math.abs(wx - q[0]) < w && wy > q[1] - h && wy < q[1] + 28;
  if(hit(G.board, 100, 200) || hit(G.pod, 95, 110)) v70eOpen('board');
}

// ---------- 6. móc vào bộ vẽ đảo ----------
function v70eWorldInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return;
  // dưới đất: chen theo y giữa người đi trên đảo (giống Cây thần kỳ v66t)
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); V70E.drawn = false; };
  const dr0 = v46DrawRaw; v46DrawRaw = function(a){ if(!V70E.drawn){ try { const p = v46Pos(a), G = v70eGeo(); if(p[1] > G.board[1]){ V70E.drawn = true; v70eGround(); } } catch(e){ V70E.drawn = true; } } return dr0.apply(this, arguments); };
  const ww0 = v47wWorld; v47wWorld = function(VBn){ if(!V70E.drawn){ V70E.drawn = true; try { v70eGround(); } catch(e){ console.warn('v70e ground', e); } } const r = ww0.apply(this, arguments); try { v70eOver(VBn); } catch(e){ console.warn('v70e over', e); } return r; };
  // va chạm: bảng vàng + bục (đi vòng)
  if(typeof canMove === 'function'){ const cm0 = canMove; canMove = function(ox, oy, nx, ny){ const r = cm0(ox, oy, nx, ny); if(!r || !V46.on || V46.sky || !v46Raw(nx)) return r; const G = v70eGeo(), inB = (x, y) => y > G.board[1] - 14 && y < G.board[1] + 6 && (Math.abs(x - V46E - G.board[0]) < 92 || Math.abs(x - V46E - G.pod[0]) < 88); return inB(nx, ny) && !inB(ox, oy) ? false : r; }; }
  // ban đêm: đèn lồng sáng
  if(typeof v25Collect === 'function'){ const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); try { const ev = v70eEvent(); if(!ev || !(ev.th.lan || ev.th.bulb)) return; const on = v25Ramp(clock, 1080, 330); if(on <= 0) return; const G = v70eGeo();
    V46.raw = true; try { G.strings.forEach(([a, b]) => v25Push((a[0] + b[0])/2, (a[1] + b[1])/2 - 40, 110, on*.6, 2)); } finally { V46.raw = false; } } catch(e){} }; }
  // NPC mặc đồ lễ
  if(typeof v66cExtras === 'function'){ const ex0 = v66cExtras; v66cExtras = function(a, by){ ex0(a, by); try { v70eWear(a, by); } catch(e){} }; }
  // danh hiệu dưới tên người chơi (nhãn tên do v53v vẽ)
  if(typeof v53vPill === 'function'){ const pl0 = v53vPill; v53vPill = function(text, sx, sy, bg){
    const t = (typeof PLAYER !== 'undefined' && PLAYER && bg === 'rgba(18,110,72,.86)' && String(text).indexOf(PLAYER.name) === 0) ? v70eTitleText() : '';
    if(!t) return pl0.apply(this, arguments);
    const y = pl0.call(this, text, sx, sy - 14, bg); try { ctx.font = '800 16px Nunito, "Be Vietnam Pro", sans-serif'; const w = Math.min(240, Math.ceil(ctx.measureText(t).width) + 14), h = 20, x = Math.round(sx - w/2), yy = Math.round(sy - 14 + 12 + 1);
      ctx.fillStyle = 'rgba(122,74,10,.9)'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, yy, w, h, 10); else ctx.rect(x, yy, w, h); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(t, Math.round(sx), yy + h/2 + 1, w - 10); ctx.font = '700 16px Nunito, "Be Vietnam Pro", sans-serif'; } catch(e){} return y; }; }
  cvs.addEventListener('pointerdown', e => { V70E.dn = [e.clientX, e.clientY, performance.now()]; }, true);
  cvs.addEventListener('pointerup', e => { if(e.pointerType === 'mouse' && e.button !== 0) return; const d = V70E.dn; V70E.dn = null; if(d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 10 && performance.now() - d[2] < 450) try { v70eTap(e); } catch(er){} }, true);
  setInterval(() => { try { v70eTick(); } catch(e){} }, 250);
  // điểm đến trong danh sách "Tự đi tới"
  try { if(typeof DESTS !== 'undefined' && !DESTS.some(d => d[0] === 'v70e')){ const G = v70eGeo(); DESTS.push(['v70e', '🏆 Bảng vàng & lễ hội', G.board[0] + V46E, G.board[1] + 40]); const sel = document.getElementById('hDest'); if(sel){ const o = document.createElement('option'); o.value = 'v70e'; o.textContent = '🏆 Bảng vàng & lễ hội'; sel.appendChild(o); } } } catch(e){}
}
