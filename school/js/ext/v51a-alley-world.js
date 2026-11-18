// ================= v51a · CẢNH PHỐ: phố lát đá cong hẹp, nhà nhiều tầng nghiêng chen chúc, mái nhọn lệch, biển treo, đèn lồng, quầy hàng =================
// Tỷ lệ vàng: phố dài 2618 = 1618·φ; Tháp Đồng Hồ đứng ở 2618/φ = 1618; mặt tiền tiệm cao = rộng·φ; tầng trệt = cao/φ²; cửa sổ trưng bày = rộng/φ.
// Ảnh tĩnh (đường + nhà phía bắc; quầy + mái phía nam) cache theo mùa; mỗi khung chỉ vẽ phần động. Đêm: phủ màu + quầng sáng cửa sổ/đèn lồng.
const V51A_WX = 2618, V51A_HW = 62, V51A_Y0 = 80, V51A_FY0 = 560, V51A_WY1 = 1000, V51A_PX = 1618, V51A_PR = 142;
const V51AW = {cv:null, g:null, W:0, H:0, dpr:1, z:1, cam:{x:300, y:520}, me:{x:300, y:600, dir:1, walk:0, moving:false}, npc:[], pairs:[], cats:[], owls:[], blds:[], spots:[], tips:[], chim:[], win:[], strings:[], stalls:[],
  back:null, front:null, far:null, key:'', fKey:'', joy:null, keys:{}, raf:0, lt:0, fps:60, fa:[], near:null, hint:6, tr:new Float32Array(80), trI:0, clock:null, ents:[], hunt:[], lanLit:new Float32Array(64), bub:0};
function v51aCy(x){ return 600 + Math.sin(x/310)*44 + Math.sin(x/123 + 1.3)*16; }
function v51aPlaza(x){ const u = (x - V51A_PX)/V51A_PR; return Math.abs(u) < 1 ? 118*Math.sqrt(1 - u*u) : 0; }
function v51aSouth(x){ return v51aCy(x) + V51A_HW + v51aPlaza(x); }
function v51aRnd(seed){ let k = seed; return () => (k = (k*48271) % 2147483647)/2147483647; }
function v51aFount(){ return [V51A_PX, v51aCy(V51A_PX) + V51A_HW + 58]; }
function v51aCart(){ return [V51A_PX - 96, v51aCy(V51A_PX - 96) + V51A_HW + 40]; }
function v51aBVend(){ return [V51A_PX + 100, v51aCy(V51A_PX + 100) + V51A_HW + 36]; }
function v51aWalk(x, y){
  if(x < 56 || x > 2566) return false; const c = v51aCy(x); if(y < c - V51A_HW + 4 || y > v51aSouth(x) - 6) return false;
  const f = v51aFount(); if(Math.hypot(x - f[0], (y - f[1])*1.7) < 52) return false;
  const k = v51aCart(); if(Math.abs(x - k[0]) < 30 && Math.abs(y - k[1] + 4) < 14) return false;
  return true;
}
// ---------- bố cục: tiệm + nhà chen giữa + tháp + cổng ----------
function v51aLayout(){
  if(V51AW.blds.length) return; const rnd = v51aRnd(5151), B = [];
  const add = (o) => { o.base = v51aCy(o.x) - V51A_HW - 1; B.push(o); return o; };
  add({x:78, w:104, k:'gate', id:'academy', wall:'#7d7a90', roof:'#3a2f5c', lean:0, sw:'#7a6bff'});
  const SX = {wand:240, robe:452, book:664, brew:874, pet:1252, candy:1882, broom:2082, toy:2276, bank:2466};
  V51A_SHOPS.forEach((s, i) => { if(!SX[s.id]) return; add({x:SX[s.id], w:s.id === 'bank' ? 168 : s.id === 'book' || s.id === 'pet' ? 128 : 118, k:s.id === 'bank' ? 'bank' : 'shop', si:i, wall:s.wall, roof:s.roof, acc:s.acc, lean:s.id === 'bank' ? 0 : (i % 2 ? .045 : -.04)}); });
  add({x:1062, w:96, k:'post', id:'post', wall:'#5a6a8a', roof:'#2c3550', lean:-.02});
  add({x:V51A_PX, w:118, k:'clock', id:'clock', wall:'#a49a8a', roof:'#2f5f8a', lean:0});
  add({x:2546, w:100, k:'gate', id:'home', wall:'#7d7a90', roof:'#1d4a6a', lean:0, sw:'#3da5ff'});
  B.sort((a, b) => a.x - b.x); const out = [];
  const PL = ['#e8d8b8', '#f0e4c8', '#dcc9a8', '#efe0d0', '#d8d0c0', '#f2dcc4'], WL = ['#a85a4a', '#6a7a9a', '#8a6a9a', '#5a8a7a', '#b08a4a', '#7a5a4a', '#4a6a8a', '#9a4a5a'], RF = ['#3a2f5c', '#5a2a2a', '#2c4a5a', '#4a3a2a', '#2a3a2a', '#5a3a5a', '#33334a'];
  for(let i = 0; i < B.length; i++){ out.push(B[i]); if(i === B.length - 1) break; let x0 = B[i].x + B[i].w/2 - 2; const x1 = B[i + 1].x - B[i + 1].w/2 + 2; let k = 0;
    while(x1 - x0 > 30){ let w = 54 + Math.floor(rnd()*32); if(x1 - x0 - w < 40) w = x1 - x0; const o = {x:x0 + w/2, w, k:'fill', wall:WL[Math.floor(rnd()*WL.length)], plaster:PL[Math.floor(rnd()*PL.length)], roof:RF[Math.floor(rnd()*RF.length)], lean:(k++ % 2 ? .075 : -.065)*(.6 + rnd()*.6), hk:1.12 + rnd()*.42}; o.base = v51aCy(o.x) - V51A_HW - 1; out.push(o); x0 += w - 2; } }
  out.forEach(b => { b.plaster = b.plaster || '#efe2c6'; const P = V51A_PHI; b.h = Math.round(b.k === 'clock' ? b.w*P*P : b.k === 'gate' ? b.w*P*.9 : b.k === 'bank' ? b.w/P*1.25 : b.k === 'post' ? b.w*P*1.25 : b.w*P*(b.hk || 1)); b.gf = Math.round(b.h/P/P);
    b.fl = b.k === 'fill' ? Math.max(2, Math.round((b.h - b.gf)/50)) : 2; b.rh = Math.round(b.k === 'clock' ? b.w*1.05 : b.w/P*(b.k === 'fill' ? 1.05 : 1)); b.tip = b.k === 'shop' || b.k === 'fill' ? Math.round((rnd() - .5)*b.w*.32) : 0; b.ch = rnd() < .7 ? (rnd() < .5 ? .26 : .72) : 0; });
  V51AW.blds = out;
  // quầy hàng phía nam (tránh quảng trường), một quầy là Quầy Đồ Thất Lạc
  V51AW.stalls = [[330, 'lantern'], [560, 'flower'], [770, 'crystal'], [980, 'lost'], [1180, 'scroll'], [1380, 'fruit'], [1990, 'lantern'], [2180, 'potion'], [2380, 'flower']].map(a => ({x:a[0], k:a[1], w:66, base:v51aSouth(a[0]) + 20}));
  // điểm tương tác
  const S = []; out.forEach(b => { const dy = b.base + 8; if(b.k === 'shop' || b.k === 'bank'){ const s = V51A_SHOPS[b.si]; S.push({id:s.id, ic:s.ic, vi:s.vi, en:s.en, x:b.x - b.w*.12, y:dy + 10, r:46, b}); }
    else if(b.k === 'post') S.push({id:'post', ic:'🦉', vi:'Bưu Cục Cú', en:'Owl Post · mini game', x:b.x, y:dy + 10, r:44, b});
    else if(b.k === 'clock') S.push({id:'clock', ic:'🕰️', vi:'Tháp Đồng Hồ Cầu Vồng', en:'Rainbow Clock Tower', x:b.x, y:dy + 10, r:40, b});
    else if(b.k === 'gate') S.push({id:b.id, ic:b.id === 'home' ? '🌀' : '🏰', vi:b.id === 'home' ? 'Về Trường Rubik' : 'Cổng Học Viện Phép Thuật', en:b.id === 'home' ? 'Back to School' : 'To the Spellcraft Academy', x:b.x, y:dy + 12, r:46, b}); });
  const lo = V51AW.stalls.find(s => s.k === 'lost'); S.push({id:'lost', ic:'🔍', vi:'Quầy Đồ Thất Lạc', en:'Lost & Found · mini game', x:lo.x, y:v51aSouth(lo.x) - 14, r:44});
  const ic = v51aCart(); S.push({id:'ice', ic:'🍦', vi:V51A_SHOPS[8].vi, en:V51A_SHOPS[8].en, x:ic[0], y:ic[1] - 18, r:40});
  const bv = v51aBVend(); S.push({id:'balloon', ic:'🎈', vi:'Xe Bóng Bay', en:'Balloon Cart · $2', x:bv[0], y:bv[1] - 8, r:36});
  V51AW.spots = S;
  // dây đèn lồng & cờ Rubik băng ngang phố: từ mặt tiền phía bắc tới cột quầy / mái phía nam
  V51AW.strings = []; for(let x = 190, i = 0; x < 2520; x += 150 + Math.floor(rnd()*40), i++){ if(Math.abs(x - V51A_PX) < V51A_PR + 10) continue; const x2 = x + 50 + rnd()*40;
    V51AW.strings.push({x1:x, y1:v51aCy(x) - V51A_HW - 112 - rnd()*30, x2, y2:v51aSouth(x2) + 2 - 30 - rnd()*16, n:5, flag:i % 3 === 2, ph:rnd()*6}); }
}
// ---------- vẽ: cửa sổ, ô trưng bày, nhà ----------
function v51aR(g, c, x, y, w, h){ g.fillStyle = c; g.fillRect(x, y, w, h); }
function v51aWin(g, b, x, y, w, h, shut){ // cửa sổ tầng trên: khung gỗ, kính, song chữ thập, chậu hoa
  v51aR(g, '#3a2a1e', x - 2, y - 2, w + 4, h + 4); v51aR(g, '#25304f', x, y, w, h); v51aR(g, 'rgba(255,255,255,.22)', x + 1, y + 1, w*.35, h*.4); v51aR(g, '#3a2a1e', x + w/2 - 1, y, 2, h); v51aR(g, '#3a2a1e', x, y + h*.45, w, 2);
  if(shut){ v51aR(g, shut, x - 7, y - 1, 5, h + 2); v51aR(g, shut, x + w + 2, y - 1, 5, h + 2); v51aR(g, 'rgba(0,0,0,.25)', x - 7, y + h*.5, 5, 1); v51aR(g, 'rgba(0,0,0,.25)', x + w + 2, y + h*.5, 5, 1); }
  V51AW.win.push([x + w/2 + b.lean*(y + h/2 - b.base), y + h/2, Math.max(w, h)*1.2, 0]);
}
function v51aBox(g, x, y, w, s, rnd){ v51aR(g, '#6b4226', x - 2, y, w + 4, 5); const fl = {xuan:['#ff8fc4', '#fff'], ha:['#ff5a5a', '#ffd23f'], thu:['#ff8a2b', '#c25a1a'], dong:['#e8f0ff', '#cfe0f0']}[s] || ['#ff5a5a', '#ffd23f'];
  for(let i = 0; i < w; i += 4){ v51aR(g, '#3f9a46', x + i, y - 3, 3, 3); if(rnd() < .6) v51aR(g, fl[i % 8 ? 0 : 1], x + i, y - 5, 3, 3); } }
function v51aDisplay(g, id, x, y, w, h, rnd){ // đồ trưng trong ô kính tiệm
  const C = V51A_RUBIK, by = y + h - 4; v51aR(g, 'rgba(255,233,168,.18)', x, by - 2, w, 6);
  if(id === 'wand'){ for(let i = 0; i < 6; i++){ const xx = x + 6 + i*(w - 12)/5; g.save(); g.translate(xx, by); g.rotate(-.5 + i*.2); v51aR(g, '#6b4226', -1, -h*.62, 3, h*.62); v51aR(g, C[i], -2, -h*.66, 5, 5); g.restore(); } v51aR(g, '#7a1f2b', x + 3, by - 2, w - 6, 4); }
  else if(id === 'robe'){ for(let i = 0; i < 3; i++){ const cx = x + w*(i + .5)/3, col = ['#7a1f2b', '#1d2a5c', '#4a2a6a'][i]; v51aR(g, '#d8c8a8', cx - 3, y + 6, 6, 5); g.fillStyle = col; g.beginPath(); g.moveTo(cx - 4, y + 11); g.lineTo(cx + 4, y + 11); g.lineTo(cx + 9, by); g.lineTo(cx - 9, by); g.closePath(); g.fill(); v51aR(g, '#e8c27a', cx - .5, y + 12, 1, by - y - 14); } }
  else if(id === 'book'){ for(let s = 0; s < 3; s++){ let yy = by; const xx = x + 5 + s*(w - 10)/3; for(let k = 0; k < 4 + s; k++){ const bw = 14 + rnd()*6, bh = 4 + rnd()*2; yy -= bh; v51aR(g, ['#a83a3a', '#3a6aa8', '#3a8a4a', '#c8a03a', '#6a3a8a'][(k + s) % 5], xx, yy, bw, bh); v51aR(g, 'rgba(255,255,255,.35)', xx, yy, bw, 1); } }
    g.fillStyle = '#f0e2b6'; g.beginPath(); g.moveTo(x + w*.7, y + 10); g.lineTo(x + w*.7 + 9, y + 6); g.lineTo(x + w*.7 + 9, y + 14); g.lineTo(x + w*.7, y + 18); g.lineTo(x + w*.7 - 9, y + 14); g.lineTo(x + w*.7 - 9, y + 6); g.closePath(); g.fill(); }
  else if(id === 'brew'){ for(let i = 0; i < 2; i++){ const cx = x + w*(.28 + i*.44); g.fillStyle = '#222230'; g.beginPath(); g.ellipse(cx, by - 8, 11, 9, 0, 0, 7); g.fill(); g.fillStyle = i ? '#b089ff' : '#7fe36a'; g.beginPath(); g.ellipse(cx, by - 14, 9, 3, 0, 0, 7); g.fill(); g.beginPath(); g.arc(cx - 3, by - 19, 2, 0, 7); g.arc(cx + 3, by - 22, 1.6, 0, 7); g.fill(); }
    for(let i = 0; i < 5; i++) v51aR(g, ['#7fd3ff', '#ffb000', '#ff8fc4', '#7fe36a', '#ffe066'][i], x + 4 + i*(w - 8)/5, y + 5, 6, 9); }
  else if(id === 'pet'){ const cx = x + w*.33; g.strokeStyle = '#c8a050'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, by - 18, 14, Math.PI, 0); g.stroke(); for(let k = -12; k <= 12; k += 4){ g.beginPath(); g.moveTo(cx + k, by - 18 - Math.sqrt(196 - k*k)); g.lineTo(cx + k, by); g.stroke(); }
    v51aR(g, '#f4f4f8', cx - 5, by - 16, 10, 12); v51aR(g, '#1a1a22', cx - 3, by - 13, 2, 2); v51aR(g, '#1a1a22', cx + 1, by - 13, 2, 2); v51aR(g, '#6b4226', x + w*.6, by - 20, 30, 3); v51aR(g, '#a86a3a', x + w*.66, by - 32, 9, 12); v51aR(g, '#fff', x + w*.66 + 1, by - 29, 3, 3); v51aR(g, '#fff', x + w*.66 + 5, by - 29, 3, 3); }
  else if(id === 'candy'){ for(let i = 0; i < 4; i++){ const xx = x + 4 + i*(w - 8)/4, jw = (w - 8)/4 - 4; v51aR(g, 'rgba(255,255,255,.4)', xx, by - 22, jw, 22); for(let k = 0; k < 7; k++) v51aR(g, C[(i + k) % 6], xx + 2 + rnd()*(jw - 5), by - 19 + rnd()*16, 3, 3); v51aR(g, '#ff8fc4', xx - 1, by - 25, jw + 2, 4); }
    g.strokeStyle = '#ff4d6d'; g.lineWidth = 2.5; g.beginPath(); g.arc(x + w - 12, y + 12, 7, 0, 5.5); g.stroke(); }
  else if(id === 'broom'){ for(let i = 0; i < 3; i++){ g.save(); g.translate(x + w*(.25 + i*.25), by); g.rotate(-.9 + i*.9); v51aR(g, '#8a5a32', -1.5, -h*.8, 3, h*.6); g.fillStyle = ['#d8b86a', '#9fb2ff', '#ffc2e0'][i]; g.beginPath(); g.moveTo(-2, -h*.22); g.lineTo(-7, 0); g.lineTo(7, 0); g.lineTo(2, -h*.22); g.fill(); g.restore(); } }
  else if(id === 'toy'){ for(let i = 0; i < 4; i++){ const xx = x + 6 + i*(w - 12)/4, q = 4; for(let a = 0; a < 3; a++) for(let c = 0; c < 3; c++) v51aR(g, C[(a + c + i) % 6], xx + a*q, by - 14 + c*q, q - .6, q - .6); }
    g.fillStyle = C[1]; g.beginPath(); g.moveTo(x + w/2, y + 4); g.lineTo(x + w/2 - 9, y + 18); g.lineTo(x + w/2 + 9, y + 18); g.closePath(); g.fill(); }
}
function v51aRoof(g, b, L, R, top, s){
  const ov = 6 + b.fl*3, cx = b.x + b.tip, tp = top - b.rh; g.fillStyle = b.roof; g.beginPath(); g.moveTo(L - ov, top + 3); g.lineTo(cx, tp); g.lineTo(R + ov, top + 3); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.24)'; g.beginPath(); g.moveTo(cx, tp); g.lineTo(R + ov, top + 3); g.lineTo(cx, top + 3); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.1)'; for(let k = 1; k < 7; k++){ const yy = tp + (top - tp)*k/7, u = k/7; g.fillRect(cx - (cx - L + ov)*u, yy, (R - L + 2*ov)*u, 1.3); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(L - ov, top + 2, R - L + 2*ov, 3);
  if(b.ch){ const chx = L + (R - L)*b.ch, u = Math.abs(chx - cx)/((chx < cx ? cx - L : R - cx) + ov), ry = tp + (top - tp)*u; v51aR(g, '#7a4a3a', chx - 5, ry - 22, 10, 26); v51aR(g, '#5a3a2a', chx - 6, ry - 25, 12, 4); V51AW.chim.push([chx + b.lean*(ry - 25 - b.base), ry - 26, Math.random()*6]);
    if(s === 'dong') v51aR(g, '#f4f8ff', chx - 6, ry - 28, 12, 3); }
  if(b.k === 'shop' || (b.k === 'fill' && b.w > 70)){ const dy = tp + (top - tp)/V51A_PHI, dx = cx + (b.tip > 0 ? -1 : 1)*b.w*.16, dw = 14; g.fillStyle = b.roof; g.beginPath(); g.moveTo(dx - dw/2 - 3, dy + 2); g.lineTo(dx, dy - 12); g.lineTo(dx + dw/2 + 3, dy + 2); g.fill(); v51aWin(g, b, dx - dw/2 + 2, dy + 2, dw - 4, 12, null); }
  if(s === 'dong'){ g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(L - ov, top + 3); g.lineTo(cx, tp); g.lineTo(R + ov, top + 3); g.lineTo(R + ov - 4, top - 1); g.lineTo(cx + (R - cx)*.55, tp + (top - tp)*.55); g.lineTo(cx + (R - cx)*.3, tp + (top - tp)*.42);
    g.lineTo(cx, tp + 9); g.lineTo(cx - (cx - L)*.35, tp + (top - tp)*.5); g.lineTo(cx - (cx - L)*.6, tp + (top - tp)*.6); g.lineTo(L - ov + 4, top - 1); g.closePath(); g.fill();
    g.fillStyle = 'rgba(200,220,255,.8)'; for(let x = L - ov + 3; x < R + ov - 3; x += 7) g.fillRect(x, top + 4, 2, 2 + (x % 3)); }
  V51AW.tips.push([cx + b.lean*(tp - b.base), tp]);
}
function v51aHouse(g, b, s, rnd){
  const w = b.w, L = b.x - w/2, R = b.x + w/2, base = b.base, h = b.h, gf = b.gf, fl = b.fl, fh = (h - gf)/fl, P = V51A_PHI;
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(L + 4, base - 2, w, 6);
  g.save(); g.transform(1, 0, b.lean, 1, -b.lean*base, 0);
  if(b.k === 'clock'){ v51aClockTower(g, b, s); g.restore(); return; } if(b.k === 'bank'){ v51aBankBld(g, b, s); g.restore(); return; } if(b.k === 'gate'){ v51aGate(g, b, s); g.restore(); return; } if(b.k === 'post'){ v51aPost(g, b, s); g.restore(); return; }
  // tầng trệt
  v51aR(g, b.wall, L, base - gf, w, gf); v51aR(g, 'rgba(0,0,0,.18)', L + w/P, base - gf, w - w/P, gf); v51aR(g, 'rgba(0,0,0,.25)', L, base - 4, w, 4);
  if(b.k === 'shop'){ const sh = V51A_SHOPS[b.si], ww = Math.round(w/P), dw = Math.max(22, Math.round(w/P/P/P)), m = (w - ww - dw)/3, wx = L + m, wy = base - gf + gf*.24, wh = gf*.62, dx = L + 2*m + ww, dh = Math.round(gf*.74);
    v51aR(g, '#3a2a1e', wx - 3, wy - 3, ww + 6, wh + 6); v51aR(g, '#1f2a44', wx, wy, ww, wh); v51aDisplay(g, sh.id, wx, wy, ww, wh, rnd); v51aR(g, 'rgba(255,255,255,.16)', wx + 3, wy + 2, ww*.28, wh*.5); v51aR(g, '#3a2a1e', wx + ww/P, wy, 2, wh);
    V51AW.win.push([wx + ww/2 + b.lean*(wy + wh/2 - base), wy + wh/2, ww*.95, 1]);
    // mái hiên sọc
    const ay = wy - 14; for(let i = 0; i < ww + 12; i += 8){ v51aR(g, (i/8) % 2 ? '#fff6e8' : sh.acc === '#ffffff' ? '#5a8a5a' : sh.acc, wx - 6 + i, ay, 8, 11); } g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(wx - 6, ay + 9, ww + 12, 2);
    for(let i = 0; i < ww + 12; i += 8){ g.fillStyle = (i/8) % 2 ? '#fff6e8' : sh.acc === '#ffffff' ? '#5a8a5a' : sh.acc; g.beginPath(); g.arc(wx - 2 + i, ay + 11, 4, 0, Math.PI); g.fill(); }
    // cửa vòm
    v51aR(g, '#3a2a1e', dx - 2, base - dh - 2, dw + 4, dh + 2); g.fillStyle = '#5a3a22'; g.beginPath(); g.moveTo(dx, base); g.lineTo(dx, base - dh + dw/2); g.arc(dx + dw/2, base - dh + dw/2, dw/2, Math.PI, 0); g.lineTo(dx + dw, base); g.closePath(); g.fill();
    v51aR(g, 'rgba(255,255,255,.12)', dx + 3, base - dh + dw/2, 2, dh - dw/2 - 3); v51aR(g, '#ffd23f', dx + dw - 6, base - dh*.45, 3, 3); v51aR(g, '#ffcf6a', dx + dw/2 - 5, base - dh + dw/2 - 4, 10, 4);
    V51AW.win.push([dx + dw/2 + b.lean*(base - dh*.6 - base), base - dh*.6, dw*1.2, 1]); }
  else { const dw = 18, dx = L + (rnd() < .5 ? w*.18 : w*.82 - dw), dh = gf*.72; v51aR(g, '#4a3222', dx, base - dh, dw, dh); v51aR(g, '#ffd23f', dx + dw - 5, base - dh*.5, 2, 2);
    const ox = dx < b.x ? R - w*.34 : L + w*.1; v51aWin(g, b, ox, base - gf + gf*.25, w*.24, gf*.42, null); }
  // các tầng trên: khung gỗ lộ, mỗi tầng nhô ra 3px
  for(let k = 1; k <= fl; k++){ const ex = 3*k, y0 = base - gf - k*fh, l = L - ex, ww = w + 2*ex; v51aR(g, b.k === 'shop' ? '#efe2c6' : b.plaster, l, y0, ww, fh); v51aR(g, 'rgba(0,0,0,.14)', l + ww/P, y0, ww - ww/P, fh);
    const bc = '#4a3222'; v51aR(g, bc, l, y0 + fh - 4, ww, 4); v51aR(g, bc, l, y0, ww, 3); v51aR(g, bc, l, y0, 3, fh); v51aR(g, bc, l + ww - 3, y0, 3, fh); v51aR(g, 'rgba(0,0,0,.3)', l, y0 + fh, ww, 2);
    const nW = ww > 96 ? 2 : 1, wW = Math.round(w/P/P/P*(nW === 2 ? .78 : 1.05)) + 4, wH = Math.round(Math.min(fh - 16, wW*P));
    for(let i = 0; i < nW; i++){ const xx = nW === 1 ? l + ww/2 - wW/2 : (i ? l + ww - ww/P/P/P - wW + 4 : l + ww/P/P/P - 4), yy = y0 + (fh - wH)/2; if(k % 2 === 1 && i === 0 && nW === 2){ g.strokeStyle = bc; g.lineWidth = 2.5; g.beginPath(); g.moveTo(l + ww/2, y0 + 3); g.lineTo(l + ww/2, y0 + fh - 4); g.stroke(); }
      v51aWin(g, b, xx, yy, wW, wH, b.k === 'shop' ? V51A_SHOPS[b.si].roof : (k + i) % 3 === 0 ? '#3a6a5a' : null); if((k + i) % 2 === 0) v51aBox(g, xx - 1, yy + wH + 3, wW + 2, s, rnd); }
    if(fl > 2 && k === 2){ g.strokeStyle = bc; g.lineWidth = 2; g.beginPath(); g.moveTo(l + 3, y0 + fh - 4); g.lineTo(l + 14, y0 + 3); g.moveTo(l + ww - 3, y0 + fh - 4); g.lineTo(l + ww - 14, y0 + 3); g.stroke(); } }
  const top = base - h; v51aRoof(g, b, L - 3*fl, R + 3*fl, top, s);
  // biển treo trên giá sắt (tiệm)
  if(b.k === 'shop'){ const sh = V51A_SHOPS[b.si], sy = base - gf - fh*.55, sx = R + 3; g.strokeStyle = '#2a2a33'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 26, sy); g.moveTo(sx, sy + 9); g.lineTo(sx + 9, sy); g.stroke();
    g.lineWidth = 1; g.beginPath(); g.moveTo(sx + 8, sy); g.lineTo(sx + 8, sy + 5); g.moveTo(sx + 24, sy); g.lineTo(sx + 24, sy + 5); g.stroke();
    v51aR(g, '#3a2a1e', sx + 2, sy + 4, 30, 26); v51aR(g, sh.acc, sx + 4, sy + 6, 26, 22); v51aR(g, 'rgba(0,0,0,.15)', sx + 4, sy + 22, 26, 6); g.font = "18px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sh.ic, sx + 17, sy + 17); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    // bảng tên ngang trên mái hiên: dải màu Rubik
    for(let i = 0; i < 6; i++) v51aR(g, V51A_RUBIK[i], L + 6 + i*(w - 12)/6, base - gf + 3, (w - 12)/6, 4); }
  g.restore();
}
function v51aClockTower(g, b, s){
  const w = b.w, L = b.x - w/2, base = b.base, h = b.h, top = base - h, P = V51A_PHI;
  v50Stone(g, L, top, w, h, '#b8ae9c'); v51aR(g, '#8a8070', L - 4, base - b.gf, w + 8, 6); v51aR(g, '#8a8070', L - 6, top, w + 12, 8);
  for(let i = 0; i < 6; i++) v51aR(g, V51A_RUBIK[i], L + 4 + i*(w - 8)/6, top + 10, (w - 8)/6 - 2, 5);
  const cx = b.x, cyc = base - h/P, r = w*.3; V51AW.clock = [cx, cyc, r]; g.fillStyle = '#3a3448'; g.beginPath(); g.arc(cx, cyc, r + 5, 0, 7); g.fill(); g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(cx, cyc, r, 0, 7); g.fill();
  for(let k = 0; k < 12; k++){ const a = k/12*6.283 - Math.PI/2; g.fillStyle = V51A_RUBIK[k % 6]; g.fillRect(cx + Math.cos(a)*(r - 6) - 3, cyc + Math.sin(a)*(r - 6) - 3, 6, 6); }
  V51AW.win.push([cx, cyc, r*2.2, 1]);
  // cửa vòm lớn + 2 cửa sổ hẹp
  const dw = Math.round(w/P), dh = Math.round(b.gf*.9); g.fillStyle = '#3a2a1e'; g.beginPath(); g.moveTo(cx - dw/2, base); g.lineTo(cx - dw/2, base - dh + dw/2); g.arc(cx, base - dh + dw/2, dw/2, Math.PI, 0); g.lineTo(cx + dw/2, base); g.fill();
  g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(cx - dw/2 + 4, base); g.lineTo(cx - dw/2 + 4, base - dh + dw/2); g.arc(cx, base - dh + dw/2, dw/2 - 4, Math.PI, 0); g.lineTo(cx + dw/2 - 4, base); g.fill(); v51aR(g, '#3a2a1e', cx - 1, base - dh + 4, 2, dh - 4);
  for(let k = 0; k < 2; k++) v50Win(g, L + w*(k ? .74 : .14), base - h*.5 - 30, 12, 34, false, false);
  v51aWin(g, b, cx - 7, top + 26, 14, 30, null);
  v50Spire(g, cx, top - 2, w + 8, b.rh, b.roof, s === 'dong'); V51AW.tips.push([cx, top - b.rh + 30]);
}
function v51aBankBld(g, b, s){
  const w = b.w, L = b.x - w/2, base = b.base, h = b.h, top = base - h, P = V51A_PHI;
  v50Stone(g, L, top, w, h, '#d2cab6'); v51aR(g, '#b8b09c', L - 8, base - 8, w + 16, 8); v51aR(g, '#c8c0aa', L - 4, base - 14, w + 8, 6);
  for(let k = 0; k < 4; k++){ const x = L + 12 + k*(w - 34)/3; v51aR(g, '#efe8d8', x, top + 16, 10, h - 30); v51aR(g, 'rgba(0,0,0,.12)', x + 6, top + 16, 4, h - 30); v51aR(g, '#b8b09c', x - 3, top + 12, 16, 5); v51aR(g, '#b8b09c', x - 3, base - 18, 16, 4); }
  g.fillStyle = '#5a3a22'; const dw = 26, dh = h*.58; g.beginPath(); g.moveTo(b.x - dw/2, base - 14); g.lineTo(b.x - dw/2, base - dh); g.arc(b.x, base - dh, dw/2, Math.PI, 0); g.lineTo(b.x + dw/2, base - 14); g.fill(); v51aR(g, '#ffd23f', b.x + 7, base - dh*.55, 3, 3);
  V51AW.win.push([b.x, base - dh*.7, 30, 1]); [[L + 28, 0], [L + w - 44, 1]].forEach(p => v51aWin(g, b, p[0], top + 30, 16, h*.42, null));
  // trán tường tam giác (cao = rộng/φ³), huy hiệu heo đất vàng
  const ph = w/P/P/P; g.fillStyle = '#c8c0aa'; g.beginPath(); g.moveTo(L - 10, top + 2); g.lineTo(b.x, top - ph); g.lineTo(L + w + 10, top + 2); g.closePath(); g.fill(); g.fillStyle = b.roof; g.beginPath(); g.moveTo(L - 14, top + 4); g.lineTo(b.x, top - ph - 6); g.lineTo(L + w + 14, top + 4); g.lineTo(L + w + 8, top + 4); g.lineTo(b.x, top - ph + 2); g.lineTo(L - 8, top + 4); g.closePath(); g.fill();
  if(s === 'dong'){ g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(L - 14, top + 1); g.lineTo(b.x, top - ph - 9); g.lineTo(L + w + 14, top + 1); g.lineTo(b.x, top - ph - 3); g.closePath(); g.fill(); }
  g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(b.x, top - ph*.38, 11, 8, 0, 0, 7); g.fill(); v51aR(g, '#e0a800', b.x + 8, top - ph*.38 - 2, 4, 4); v51aR(g, '#3a2a1e', b.x - 1, top - ph*.38 - 7, 4, 2); v51aR(g, '#e0a800', b.x - 7, top - ph*.38 + 5, 3, 3); v51aR(g, '#e0a800', b.x + 4, top - ph*.38 + 5, 3, 3);
  V51AW.tips.push([b.x, top - ph - 6]);
}
function v51aGate(g, b, s){
  const w = b.w, L = b.x - w/2, base = b.base, h = b.h, top = base - h; v50Stone(g, L, top, w, h, '#9a96aa'); v51aCren(g, L, top, w, s);
  const aw = w/V51A_PHI, ah = h*.72; g.fillStyle = '#3a3448'; g.beginPath(); g.moveTo(b.x - aw/2 - 5, base); g.lineTo(b.x - aw/2 - 5, base - ah + aw/2); g.arc(b.x, base - ah + aw/2, aw/2 + 5, Math.PI, 0); g.lineTo(b.x + aw/2 + 5, base); g.fill();
  g.fillStyle = b.id === 'home' ? '#0f2a4a' : '#1f1440'; g.beginPath(); g.moveTo(b.x - aw/2, base); g.lineTo(b.x - aw/2, base - ah + aw/2); g.arc(b.x, base - ah + aw/2, aw/2, Math.PI, 0); g.lineTo(b.x + aw/2, base); g.fill();
  for(let i = 0; i < 6; i++){ const a = Math.PI + i/5*Math.PI; v51aR(g, V51A_RUBIK[i], b.x + Math.cos(a)*(aw/2 + 2.5) - 2, base - ah + aw/2 + Math.sin(a)*(aw/2 + 2.5) - 2, 4, 4); }
  b.arch = [b.x, base - ah*.45, aw/2, ah*.48];
}
function v51aCren(g, L, top, w, s){ v51aR(g, '#8a8698', L - 3, top - 4, w + 6, 6); for(let x = L - 3; x < L + w; x += 14){ v51aR(g, '#8a8698', x, top - 13, 8, 10); if(s === 'dong') v51aR(g, '#f4f8ff', x, top - 15, 8, 3); } }
function v51aPost(g, b, s){
  const w = b.w, L = b.x - w/2, base = b.base, h = b.h, top = base - h; v50Stone(g, L, top, w, h, '#8a9ab8'); v51aR(g, 'rgba(0,0,0,.15)', L, base - b.gf, w, 4);
  for(let k = 0; k < 3; k++){ const yy = top + 22 + k*h*.27; g.fillStyle = '#3a2a1e'; g.beginPath(); g.arc(b.x, yy + 8, 10, 0, 7); g.fill(); g.fillStyle = '#25304f'; g.beginPath(); g.arc(b.x, yy + 8, 7.5, 0, 7); g.fill(); V51AW.win.push([b.x, yy + 8, 20, 0]); }
  b.perch = []; for(let k = 0; k < 3; k++){ const py = top + 40 + k*h*.27; v51aR(g, '#5a3a22', L - 10, py, w + 20, 3); b.perch.push([L - 4 + (k % 2 ? w + 6 : 0), py]); }
  g.fillStyle = '#5a3a22'; const dw = 24, dh = b.gf*.78; g.beginPath(); g.moveTo(b.x - dw/2, base); g.lineTo(b.x - dw/2, base - dh + dw/2); g.arc(b.x, base - dh + dw/2, dw/2, Math.PI, 0); g.lineTo(b.x + dw/2, base); g.fill(); V51AW.win.push([b.x, base - dh*.6, 26, 1]);
  v51aR(g, '#c23a3a', b.x + dw/2 + 6, base - 34, 14, 22); v51aR(g, '#8a1f1f', b.x + dw/2 + 6, base - 34, 14, 4); v51aR(g, '#1a1a22', b.x + dw/2 + 9, base - 26, 8, 2);
  v50Spire(g, b.x, top, w + 6, b.rh, b.roof, s === 'dong'); V51AW.tips.push([b.x, top - b.rh + 18]);
}
// ---------- cache phía sau (đường + nhà) ----------
function v51aBack(){
  const s = v50Season(); if(V51AW.back && V51AW.key === s) return V51AW.back; v51aLayout(); const W = V51A_WX, H = V51A_WY1 - V51A_Y0, c = V51AW.back || document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, -V51A_Y0); g.clearRect(0, V51A_Y0, W, H); const rnd = v51aRnd(777); V51AW.win = []; V51AW.tips = []; V51AW.chim = [];
  // mặt đá lát cong
  const st = s === 'dong' ? ['#b8bccb', '#a8acbb', '#c8ccd8'] : ['#9a8f84', '#8a8078', '#aaa092'];
  g.fillStyle = s === 'dong' ? '#9ea2b2' : '#7a7068'; g.fillRect(0, 480, W, V51A_WY1 - 480);
  for(let x = 0; x < W; x += 12){ const c0 = v51aCy(x) - V51A_HW - 4, c1 = v51aSouth(x) + 24; for(let y = c0, r = 0; y < c1; y += 9, r++){ g.fillStyle = st[(r + Math.floor(x/12)) % 3]; const ox = r % 2 ? 6 : 0; g.fillRect(x + ox + 1, y + 1, 10, 7); } }
  g.fillStyle = 'rgba(0,0,0,.1)'; for(let x = 0; x < W; x += 4) g.fillRect(x, v51aCy(x) - 1 + (v51aPlaza(x) ? 0 : 0), 4, 3);
  for(let x = 0; x < W; x += 4){ const y = v51aCy(x) - V51A_HW - 4; g.fillStyle = s === 'dong' ? '#d8dce8' : '#bfb4a2'; g.fillRect(x, y, 4, 12); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x, y + 11, 4, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, v51aSouth(x) + 22, 4, 3); }
  // quảng trường vàng: elip đồng tâm r, r/φ, r/φ² + 6 tia màu Rubik
  const f = v51aFount(), pr = 128; g.fillStyle = s === 'dong' ? '#c8ccd8' : '#bdb09a'; g.beginPath(); g.ellipse(f[0], f[1], pr, pr/V51A_PHI*.85, 0, 0, 7); g.fill();
  for(let k = 0; k < 6; k++){ const a = k/6*6.283 + .26; g.fillStyle = V51A_RUBIK[k]; g.globalAlpha = .38; g.beginPath(); g.moveTo(f[0], f[1]); g.lineTo(f[0] + Math.cos(a - .2)*pr*.92, f[1] + Math.sin(a - .2)*pr*.5); g.lineTo(f[0] + Math.cos(a)*pr, f[1] + Math.sin(a)*pr*.55); g.lineTo(f[0] + Math.cos(a + .2)*pr*.92, f[1] + Math.sin(a + .2)*pr*.5); g.closePath(); g.fill(); } g.globalAlpha = 1;
  g.strokeStyle = 'rgba(80,60,40,.35)'; g.lineWidth = 2; [pr, pr/V51A_PHI, pr/V51A_PHI/V51A_PHI].forEach(r => { g.beginPath(); g.ellipse(f[0], f[1], r, r/V51A_PHI*.85, 0, 0, 7); g.stroke(); });
  // nhà phía bắc (theo thứ tự trái → phải, nghiêng chồng nhẹ lên nhau)
  V51AW.blds.forEach(b => v51aHouse(g, b, s, rnd));
  if(s === 'dong'){ g.fillStyle = 'rgba(255,255,255,.6)'; for(let i = 0; i < 500; i++){ const x = rnd()*W; g.fillRect(x, v51aCy(x) - V51A_HW + rnd()*(v51aSouth(x) - v51aCy(x) + V51A_HW), 2, 2); } }
  V51AW.back = c; V51AW.key = s; return c;
}
// ---------- cache phía trước (quầy hàng + mái nhà dãy phía nam) ----------
function v51aStall(g, st, s, rnd){
  const x = st.x, w = st.w, b = st.base, L = x - w/2; g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(L + 3, b - 2, w, 6);
  v51aR(g, '#6b4226', L, b - 22, w, 20); v51aR(g, '#8a5a32', L - 3, b - 26, w + 6, 5); const cl = {lantern:'#c23a3a', flower:'#3a8a4a', crystal:'#4a3a8a', lost:'#2c4a7a', scroll:'#8a6a2a', fruit:'#3a7a6a', potion:'#6a2a6a'}[st.k] || '#8a3a3a';
  v51aR(g, cl, L + 2, b - 21, w - 4, 10); for(let i = 0; i < w - 4; i += 6){ g.fillStyle = cl; g.beginPath(); g.arc(L + 5 + i, b - 11, 3, 0, Math.PI); g.fill(); }
  v51aR(g, '#4a3222', L + 2, b - 70, 3, 48); v51aR(g, '#4a3222', L + w - 5, b - 70, 3, 48);
  for(let i = 0; i < w + 10; i += 9){ v51aR(g, (i/9) % 2 ? '#fff6e8' : cl, L - 5 + i, b - 78, 9, 12); g.fillStyle = (i/9) % 2 ? '#fff6e8' : cl; g.beginPath(); g.arc(L - .5 + i, b - 66, 4.5, 0, Math.PI); g.fill(); }
  if(s === 'dong') v51aR(g, '#f4f8ff', L - 5, b - 81, w + 10, 4);
  const C = V51A_RUBIK, ty = b - 27;
  if(st.k === 'lantern'){ for(let i = 0; i < 4; i++){ const lx = L + 9 + i*(w - 18)/3; v51aR(g, '#2a2a33', lx - .5, b - 66, 1, 8); g.fillStyle = ['#ff5a3a', '#ffcf3a', '#ff8fc4', '#7fd3ff'][i]; g.beginPath(); g.ellipse(lx, b - 52, 5, 6, 0, 0, 7); g.fill(); v51aR(g, '#2a2a33', lx - 3, b - 59, 6, 2); V51AW.win.push([lx, b - 52, 18, 2]); } for(let i = 0; i < 5; i++) v51aR(g, C[i], L + 6 + i*11, ty - 6, 8, 6); }
  else if(st.k === 'flower'){ for(let i = 0; i < 6; i++){ const fx = L + 7 + i*(w - 14)/5; v51aR(g, '#8a5a32', fx - 4, ty - 6, 8, 6); v51aR(g, '#3f9a46', fx - 3, ty - 11, 6, 5); g.fillStyle = ['#ff5a8a', '#ffd23f', '#ff8a2b', '#b089ff', '#fff', '#ff4d6d'][i]; g.beginPath(); g.arc(fx, ty - 13, 3.5, 0, 7); g.fill(); } }
  else if(st.k === 'crystal'){ for(let i = 0; i < 5; i++){ const fx = L + 9 + i*(w - 18)/4; g.fillStyle = ['#b089ff', '#7fd3ff', '#ff8fc4', '#7fe36a', '#ffe066'][i]; g.beginPath(); g.moveTo(fx, ty - 16); g.lineTo(fx + 4, ty - 6); g.lineTo(fx, ty); g.lineTo(fx - 4, ty - 6); g.closePath(); g.fill(); V51AW.win.push([fx, ty - 8, 12, 3]); } }
  else if(st.k === 'lost'){ v51aR(g, '#c8a050', L + 6, ty - 10, 16, 10); v51aR(g, '#3d7bff', L + 26, ty - 8, 10, 8); v51aR(g, '#ef4b4b', L + 40, ty - 12, 12, 12); g.font = "800 9px Nunito, sans-serif"; g.fillStyle = '#fff'; g.fillText('?', L + 44, ty - 3);
    v51aR(g, '#a86a3a', x - 5, b - 92, 10, 12); v51aR(g, '#fff', x - 4, b - 89, 3, 3); v51aR(g, '#fff', x + 1, b - 89, 3, 3); v51aR(g, '#1a1a22', x - 3, b - 88, 1, 1); v51aR(g, '#1a1a22', x + 2, b - 88, 1, 1); v51aR(g, '#ffb000', x - 1, b - 85, 2, 2); }
  else if(st.k === 'scroll'){ for(let i = 0; i < 5; i++){ const fx = L + 8 + i*(w - 16)/4; v51aR(g, '#f0e2b6', fx - 3, ty - 14, 6, 14); v51aR(g, '#c8a050', fx - 4, ty - 15, 8, 2); v51aR(g, '#a83a3a', fx - 1, ty - 9, 2, 3); } }
  else if(st.k === 'fruit'){ for(let i = 0; i < 9; i++){ g.fillStyle = ['#ff5a3a', '#ffd23f', '#7fe36a', '#ff8a2b'][i % 4]; g.beginPath(); g.arc(L + 8 + i*6, ty - 4 - (i % 2)*4, 3.5, 0, 7); g.fill(); } }
  else { for(let i = 0; i < 6; i++){ const fx = L + 7 + i*(w - 14)/5; v51aR(g, ['#ff8fc4', '#7fe36a', '#7fd3ff', '#ffe066', '#b089ff', '#ff8a2b'][i], fx - 3, ty - 12, 6, 12); v51aR(g, '#e8e8f0', fx - 1.5, ty - 15, 3, 3); } }
}
function v51aFront(){
  const s = v50Season(); if(V51AW.front && V51AW.fKey === s) return V51AW.front; v51aLayout(); const W = V51A_WX, H = V51A_WY1 + 40 - V51A_FY0, c = V51AW.front || document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, -V51A_FY0); g.clearRect(0, V51A_FY0, W, H); const rnd = v51aRnd(919);
  V51AW.stalls.forEach(st => v51aStall(g, st, s, rnd));
  // mái nhà dãy phía nam (chỉ thấy mái): đỉnh lệch, ống khói, cửa sổ mái sáng đêm
  const RF = ['#5a2a2a', '#3a2f5c', '#2c4a5a', '#4a3a2a', '#5a3a5a', '#33334a', '#6a3a2a'];
  for(let x = -20; x < W + 20;){ const w = 70 + Math.floor(rnd()*60); if(Math.abs(x + w/2 - V51A_PX) < V51A_PR + 30){ x += w; continue; } const top = v51aSouth(x + w/2) + 52 + rnd()*22, tx = x + w*(.3 + rnd()*.4), col = RF[Math.floor(rnd()*RF.length)];
    g.fillStyle = col; g.beginPath(); g.moveTo(x - 4, V51A_WY1 + 40); g.lineTo(x - 4, top + 18); g.lineTo(tx, top); g.lineTo(x + w + 4, top + 18); g.lineTo(x + w + 4, V51A_WY1 + 40); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(tx, top); g.lineTo(x + w + 4, top + 18); g.lineTo(x + w + 4, V51A_WY1 + 40); g.lineTo(tx, V51A_WY1 + 40); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.1)'; for(let yy = top + 24; yy < V51A_WY1 + 40; yy += 10) g.fillRect(x - 4, yy, w + 8, 1.4);
    for(let xx = x + 6; xx < x + w; xx += 12){ g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(xx, top + 20, 1.2, V51A_WY1 + 20 - top); } const dg = g.createLinearGradient(0, top + 30, 0, top + 170); dg.addColorStop(0, 'rgba(10,8,30,0)'); dg.addColorStop(1, 'rgba(10,8,30,.55)'); g.fillStyle = dg; g.fillRect(x - 4, top + 30, w + 8, V51A_WY1 + 10 - top);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(x - 4, top + 18); g.lineTo(tx, top); g.lineTo(tx, top + 3); g.lineTo(x - 4, top + 21); g.fill();
    if(s === 'dong'){ g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(x - 4, top + 18); g.lineTo(tx, top - 1); g.lineTo(x + w + 4, top + 18); g.lineTo(x + w + 4, top + 32); g.lineTo(tx, top + 14); g.lineTo(x - 4, top + 32); g.closePath(); g.fill(); }
    if(rnd() < .6){ const dx = x + w*(rnd() < .5 ? .25 : .62), dy = top + 34; g.fillStyle = col; g.beginPath(); g.moveTo(dx - 3, dy); g.lineTo(dx + 8, dy - 12); g.lineTo(dx + 19, dy); g.fill(); v51aR(g, '#25304f', dx + 3, dy, 10, 11); v51aR(g, '#3a2a1e', dx + 7.5, dy, 1, 11); V51AW.win.push([dx + 8, dy + 6, 16, 0]); }
    if(rnd() < .5){ const chx = x + w*.8, chy = top + 10; v51aR(g, '#7a4a3a', chx, chy - 14, 9, 20); v51aR(g, '#5a3a2a', chx - 1, chy - 16, 11, 3); V51AW.chim.push([chx + 4.5, chy - 17, rnd()*6]); }
    x += w - 6; }
  V51AW.front = c; V51AW.fKey = s; return c;
}
// ---------- bóng mái nhà xa + tháp học viện (thị sai) ----------
function v51aFar(){ if(V51AW.far) return V51AW.far; const W = 2000, H = 340, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = v51aRnd(31);
  g.fillStyle = '#5a5a86'; for(let x = 0; x < W;){ const w = 40 + rnd()*60, h = 80 + rnd()*120, tx = x + w*(.3 + rnd()*.4); g.fillRect(x, H - h, w, h); g.beginPath(); g.moveTo(x - 4, H - h); g.lineTo(tx, H - h - w*.7); g.lineTo(x + w + 4, H - h); g.fill(); x += w - 4; }
  for(let k = 0; k < 4; k++){ const x = 300 + k*420, h = 220 + k % 2*60; g.fillStyle = '#4a4a78'; g.fillRect(x, H - h, 30, h); g.beginPath(); g.moveTo(x - 6, H - h); g.lineTo(x + 15, H - h - 70); g.lineTo(x + 36, H - h); g.fill(); g.fillStyle = 'rgba(255,220,140,.6)'; g.fillRect(x + 12, H - h + 30, 6, 10); }
  V51AW.far = c; return c; }
