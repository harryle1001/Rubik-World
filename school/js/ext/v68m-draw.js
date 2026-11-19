// ================= v68m · 2/4 HÌNH VẼ: 2 mẫu xe mới, 9 phụ kiện xe, 6 cần câu, 2 thuyền du lịch (tự vẽ pixel) =================
// ---------- 2 mẫu xe mới cho bộ vẽ xe pixel v45 (V45_BIKES) ----------
V45_BIKES.v68bal = function(D){ const {P, col} = D;   // xe chòi chân: bánh nhỏ, không bàn đạp, có bệ để chân
  D.wheel(-7, 4, {t:1.2, n:2}); D.wheel(7, 4, {t:1.2, n:2}); D.fender(-7, 4); D.fender(7, 4);
  P.tube(-7, -4, -1, -8.6, 3, col); P.tube(-1, -8.6, 5.2, -9, 3, col); P.tube(5.2, -9, 7, -4, 2, D.sil); P.tube(4.6, -11.4, 5.4, -8.8, 3, col);
  P.box(-3, -6.2, 5, 1, D.dk); P.box(-3, -6.2, 5, .4, D.lt);
  P.line(-1.2, -9.4, -1.4, -10.6, 2, D.sil); D.saddle(-4, -12, 5, 'comfy'); P.line(4.6, -11.4, 4.4, -13.4, 2, D.sil); P.line(2.8, -13.8, 6.2, -13.4, 2, D.dark); D.grips(3, -13.8);
  P.disc(-7, -4, .9, '#ffd23f'); P.disc(7, -4, .9, '#ffd23f'); P.disc(1.4, -10.6, .8, '#ffffff'); P.px(1.4, -10.6, '#5d4037');
  return {seat:[-1.5, -12], bar:[5, -14], rear:[-8.6, -8.4], lamp:[6, -11.6]}; };
V45_BIKES.v68aero = function(D){ const {P, col} = D;   // xe đua: bánh đặc, khung dày, ghi-đông cong thấp
  [-8.4, 8.4].forEach(cx => { D.wheel(cx, 5.2, {t:.8, deep:true, rim:D.dk, n:1}); P.disc(cx, -5.2, 3.3, cx < 0 ? D.dk : v45mix(col, -.18)); P.ring(cx, -5.2, 3.3, .6, '#eceff1'); P.disc(cx, -5.2, .9, '#e6ebf0'); });
  D.chain(0, -5.2, -8.4, -5.2, 1); P.tube(-8.4, -5.2, 0, -5.2, 3, col); P.tube(-8.4, -5.2, -1.4, -12.6, 2, col); P.tube(0, -5.2, -1.8, -13.8, 4, col);
  P.tube(-1.6, -13, 7.2, -12.6, 4, col); P.tube(0, -5.2, 7.4, -10.6, 4, col); P.tube(7.2, -13.2, 8.4, -5.2, 3, col);
  P.box(1.2, -9.4, 4.6, .8, '#ffffff'); P.line(2.4, -12.4, 3.6, -11.2, 1, '#ffd23f'); P.line(3.6, -11.2, 3, -11.2, 1, '#ffd23f'); P.line(3, -11.2, 4.2, -10, 1, '#ffd23f');
  P.line(-1.8, -13.8, -2.1, -15, 2, '#1b1b1f'); D.saddle(-4.6, -15.6, 4.6, 'slim'); P.line(7.2, -13.2, 9.6, -13.6, 2, D.dark);
  P.ring(10, -12.2, 1.6, .55, x => x > -1 ? '#24252c' : null); P.box(9.4, -14.2, 1.4, .9, D.grip); D.crank(0, -5.2, 1.6);
  return {seat:[-2.2, -15.6], bar:[9.6, -14], rear:[-9.6, -11], lamp:[10.4, -12.8], sparkle:[4, -12.6]}; };

// ---------- phụ kiện xe mới: vẽ lên trên hình xe theo các điểm neo (yên, ghi-đông, đuôi) ----------
const V68M_RAIN = ['#ef5350', '#ff9800', '#ffeb3b', '#66bb6a', '#42a5f5', '#5c6bc0', '#ab47bc'];
function v68mAccDraw(x, y, A, accs, still){
  const t = still ? .6 : realT, [sx, sy] = A.seat, [bx, by] = A.bar, [rx, ry] = A.rear, has_ = k => accs.includes(k);
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  if(has_('v68a_gel')){ R('#0d1020', sx - 3.1, sy - 1.6, 6.2, 1.8); R('#4fc3f7', sx - 2.8, sy - 1.4, 5.6, 1.2); R('#b3e5fc', sx - 2.2, sy - 1.4, 2.6, .5); }
  if(has_('v68a_sticker')){ const cx = (sx + bx)/2 - 1, cy = (sy + by)/2 + 3.6; R('#0d1020', cx - .3, cy - .3, 2.6, 2.6); R('#ef5350', cx, cy, 1, 1); R('#ffeb3b', cx + 1, cy, 1, 1); R('#42a5f5', cx, cy + 1, 1, 1); R('#66bb6a', cx + 1, cy + 1, 1, 1); }
  if(has_('v68a_bottle')){ const cx = sx + 3.2, cy = sy + 6.4; R('#0d1020', cx - .3, cy - .9, 1.9, 4); R('#29b6f6', cx, cy, 1.3, 2.8); R('#e1f5fe', cx, cy - .6, 1.3, .7); R('#b3e5fc', cx + .2, cy + .4, .4, 1.6); }
  if(has_('v68a_mirror')){ ctx.fillStyle = '#90a4ae'; ctx.fillRect(x + bx - 1.4, y + by - 3, .6, 3); R('#0d1020', bx - 2.6, by - 4.6, 2.6, 2); R('#cfd8dc', bx - 2.4, by - 4.4, 2.2, 1.6); R('#ffffff', bx - 2.2, by - 4.3, .7, .6); }
  if(has_('v68a_bell')){ R('#0d1020', bx - 2.2, by - 1.9, 2.4, 2.2); R('#ffc107', bx - 2, by - 1.7, 2, 1.8); R('#fff59d', bx - 1.8, by - 1.6, .7, .6); R('#ff8f00', bx - 1.6, by - 2.4, 1.2, .7); }
  if(has_('v68a_basket') && !A.basket){ const ax = bx + .4, ay = by + 1.4; R('#0d1020', ax - .3, ay - .3, 6.6, 5); R('#c8a26a', ax, ay, 6, 4.4); for(let r = 0; r < 3; r++) R('#9c7a46', ax, ay + .8 + r*1.2, 6, .5); R('#8d6e4a', ax, ay - .4, 6, .7);
    [[1, '#ff6f91'], [3, '#ffd23f'], [5, '#ba68c8']].forEach(([dx, c], i) => { R('#2fbf71', ax + dx, ay - 2, .5, 1.8); R(c, ax + dx - .6, ay - 3 - (i % 2)*.6, 1.6, 1.4); R('#fff8e1', ax + dx - .1, ay - 2.6 - (i % 2)*.6, .5, .5); }); }
  if(has_('v68a_flag')){ const fx = rx + .4, fy = ry - 16; ctx.fillStyle = '#e0e0e0'; ctx.fillRect(x + fx, y + fy, .6, 19); for(let i = 0; i < 6; i++){ const w = Math.sin(t*8 - i*.7)*.9; ctx.fillStyle = V68M_RAIN[i]; ctx.fillRect(x + fx - 1 - i*1.2, y + fy + .4 + w, 1.3, 3.4 - i*.4); } R('#ffd23f', fx - .2, fy - .8, 1, 1); }
  if(has_('v68a_led')){ const n = 6; for(let i = 0; i < n; i++){ const u = i/(n - 1), px = sx + (bx - 1 - sx)*u, py = sy + 3 + (by + 2 - sy - 3)*u + 1.6, on = Math.floor(t*6 + i) % 3;
      ctx.fillStyle = on ? V68M_RAIN[(i + Math.floor(t*4)) % 7] : '#37474f'; ctx.fillRect(x + px, y + py, 1, 1);
      if(on && !still && typeof SKYST !== 'undefined' && SKYST && SKYST.night > .3){ ctx.globalAlpha = .25; ctx.fillRect(x + px - 1.5, y + py - 1.5, 4, 4); ctx.globalAlpha = 1; } } }
  if(has_('v68a_wheel')){ const hubs = [[-8, -5], [8, -5]]; hubs.forEach(([hx, hy], j) => { for(let k = 0; k < 3; k++){ const a = t*5 + k*2.094 + j, px = hx + Math.cos(a)*5.6, py = hy + Math.sin(a)*5.6;
      ctx.fillStyle = ['#fff59d', '#ffffff', '#80deea'][k]; ctx.fillRect(x + px - .5, y + py - .5, 1, 1); ctx.fillRect(x + px - 1.2, y + py - .15, 2.4, .3); ctx.fillRect(x + px - .15, y + py - 1.2, .3, 2.4); } }); }
}

// ---------- cần câu: hình xem trước pixel (theo bộ vẽ v45) ----------
function v68mRodArt(P, it){
  const k = it.k, c = it.col;
  P.line(15.4, -26, 17, -8, 1, k === 'pretty' ? '#f8bbd0' : k === 'treasure' ? '#ffe082' : '#e8eef4');
  P.disc(17, -7.4, 1.2, k === 'quick' ? '#ff7043' : k === 'luck' ? '#43a047' : '#ef4b4b'); P.box(16, -7.4, 2.2, 1.1, '#fafafa');
  if(k === 'pretty'){ for(let i = 0; i < 7; i++){ const a = i/7, b = (i + 1)/7; P.tube(-12 + 27.4*a, -7 - 19*a, -12 + 27.4*b, -7 - 19*b, 2, V68M_RAIN[i]); } }
  else P.tube(-12, -7, 15.4, -26, k === 'strong' ? 3 : 2, c);
  P.tube(-19, -2, -11.6, -7.2, 4, k === 'treasure' ? '#6d4c41' : k === 'strong' ? '#37474f' : '#c8a26a'); for(let i = 0; i < 3; i++) P.box(-17.4 + i*2.4, -3.6 - i*1.6, .6, 1.4, k === 'treasure' ? '#ffd54f' : '#9c7a46');
  [[-4, -12.6], [3, -17.4], [9.4, -21.8]].forEach(([gx, gy]) => P.ring(gx, gy + .9, .7, .5, k === 'treasure' ? '#fff8e1' : '#cfd8dc'));
  P.disc(-9.6, -6.4, 2.3, k === 'treasure' ? '#ffc107' : '#b0bec5'); P.disc(-9.6, -6.4, 1.2, k === 'treasure' ? '#ff8f00' : '#78909c'); P.line(-9.6, -6.4, -7.4, -4.4, 1, '#37474f'); P.box(-7.8, -4.6, 1, 1, '#212121');
  if(k === 'quick'){ P.line(10, -30, 7.6, -26.4, 1, '#ffd23f'); P.line(7.6, -26.4, 10.2, -26.4, 1, '#ffd23f'); P.line(10.2, -26.4, 7.8, -22.6, 1, '#ffd23f'); }
  if(k === 'luck'){ [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => P.disc(-2 + dx*1.3, -18 + dy*1.3, 1.3, '#43a047')); P.disc(-2, -18, .6, '#c5e1a5'); P.line(-2, -18, -1, -14.6, 1, '#2e7d32'); }
  if(k === 'strong'){ P.box(-1.6, -12.8, 2.2, 1.6, '#90a4ae'); P.box(5.4, -17.6, 2.2, 1.6, '#90a4ae'); }
  if(k === 'pretty'){ [[-6, -16], [6, -24], [12, -14], [-14, -12]].forEach(([sx, sy], i) => { P.px(sx, sy, i % 2 ? '#fff59d' : '#ffffff'); P.px(sx - .5, sy, '#ffffff'); P.px(sx + .5, sy, '#ffffff'); P.px(sx, sy - .5, '#ffffff'); P.px(sx, sy + .5, '#ffffff'); }); }
  if(k === 'treasure'){ P.disc(-20, -1.4, 1.4, '#e53935'); P.px(-20.3, -1.8, '#ffcdd2'); P.disc(4, -6, 2, '#ffc107'); P.disc(4, -6, 1.1, '#ffe082'); P.box(2.6, -2.4, 4.4, 3, '#8d6e63'); P.box(2.6, -2.4, 4.4, .8, '#ffc107'); }
}
// kiểu nét cần câu trong mini game (canvas thật, có toạ độ đầu cần)
function v68mRodStroke(c, R, tip){
  const it = R.it, [tx, ty] = tip || [200, 100];
  if(R.k === 'pretty'){ const g = c.createLinearGradient(tx - 170, ty + 170, tx, ty), s = (realT*.3) % 1; V68M_RAIN.forEach((col, i) => g.addColorStop(((i/7) + s) % 1, col)); return g; }
  if(R.k === 'treasure'){ const g = c.createLinearGradient(tx - 170, ty + 170, tx, ty); g.addColorStop(0, '#8d6e63'); g.addColorStop(.35, '#ffb300'); g.addColorStop(.7, '#fff59d'); g.addColorStop(1, '#ffb300'); return g; }
  return it.col;
}
// chạy fn() trong khi đổi màu nét "thân cần câu cũ" (nâu) sang cần câu mới
function v68mRodCtx(c, R, tip, fn){
  const st0 = c.stroke; let n = 0;
  c.stroke = function(){ try { const ss = String(c.strokeStyle).toLowerCase(), lw = c.lineWidth;
      if((ss === '#6d4c2e' || ss === '#c8a27a' || ss === '#3a2410') && lw >= 3 && lw <= 5.5 && n < 2){ n++; c.strokeStyle = v68mRodStroke(c, R, tip); c.lineWidth = lw + (R.k === 'strong' ? 1.5 : .5); }
      else if(ss === '#3e2723' && lw === 5) c.strokeStyle = R.k === 'treasure' ? '#ffb300' : R.k === 'strong' ? '#263238' : '#4e342e'; } catch(e){}
    return st0.apply(c, arguments); };
  try { fn(); } finally { delete c.stroke; }
}
// hiệu ứng ở đầu cần + nhãn tên cần câu
function v68mRodFx(c, R, tip, W){
  if(!tip) return; const [tx, ty] = tip, t = realT;
  if(R.k === 'pretty' || R.k === 'treasure'){ for(let i = 0; i < 6; i++){ const u = ((t*.45 + i/6) % 1), x = tx - 150*u + Math.sin(t*3 + i)*5, y = ty + 150*u - 6, a = Math.sin(t*6 + i*2)*.5 + .5;
      c.fillStyle = R.k === 'pretty' ? V68M_RAIN[i % 7] : (i % 2 ? '#fff59d' : '#ffd54f'); c.globalAlpha = .45 + a*.5; c.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 6); c.fillRect(Math.round(x) - 3, Math.round(y) - 1, 6, 2); } c.globalAlpha = 1; }
  if(R.k === 'quick'){ c.fillStyle = '#ffd23f'; c.font = '800 18px Nunito, sans-serif'; c.fillText('⚡', tx + 6, ty - 4); }
  if(R.k === 'luck'){ c.font = '18px sans-serif'; c.fillText('🍀', tx + 4, ty - 2); }
  if(R.k === 'strong'){ c.font = '18px sans-serif'; c.fillText('💪', tx + 4, ty - 2); }
  if(R.k === 'treasure'){ c.font = '18px sans-serif'; c.fillText('💎', tx + 4, ty - 2); }
  const lab = '🎣 ' + R.it.n; c.font = '800 16px Nunito, sans-serif'; const w = c.measureText(lab).width + 20, x = Math.max(8, Math.min((W || 800) - w - 8, tx - w*.618)), y = Math.max(8, ty - 46);
  c.fillStyle = 'rgba(8,14,32,.66)'; if(c.roundRect){ c.beginPath(); c.roundRect(x, y, w, 26, 13); c.fill(); } else c.fillRect(x, y, w, 26);
  c.fillStyle = R.k === 'pretty' ? `hsl(${(t*80) % 360},90%,75%)` : '#fff'; c.textAlign = 'left'; c.fillText(lab, x + 10, y + 19);
}

// ---------- thuyền du lịch (vẽ tại gốc x, y như drawBoatModel; L = nửa chiều dài) ----------
function v68mSeat(x, y, i, t){ const sk = ['#f1c27d', '#e0ac69', '#ffdbac', '#c68642'][i % 4], sh = ['#42a5f5', '#ef5350', '#66bb6a', '#ab47bc'][i % 4], hr = ['#3e2723', '#212121', '#6d4c41', '#f9a825'][i % 4], b = Math.sin(t*2.4 + i*1.7)*.6;
  rect(sh, x - 3, y - 7 + b, 7, 6); rect(sk, x - 2.5, y - 13 + b, 6, 6); rect(hr, x - 3, y - 14 + b, 7, 3); rect('#1b1b1f', x + 1, y - 11 + b, 1, 1);
  if(Math.sin(t*1.3 + i*2) > .8) rect(sk, x + 4, y - 12 + b, 2, 5); }
function v68mBoatDraw(x, y, bt, gear){
  const t = realT, tour = bt.v68b === 'tour', L = tour ? 46 : 58, col = bt.col;
  ctx.fillStyle = 'rgba(0,30,60,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 7, L + 6, 7, 0, 0, Math.PI*2); ctx.fill();
  // thân thuyền: mũi nhọn, đuôi vuông, sọc màu
  ctx.fillStyle = '#0d1020'; ctx.beginPath(); ctx.moveTo(x - L - 1, y - 9); ctx.lineTo(x + L*.62, y - 9); ctx.lineTo(x + L + 7, y - 14); ctx.lineTo(x + L*.8, y + 5); ctx.lineTo(x - L + 1, y + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tour ? '#fff8e1' : '#fafafa'; ctx.beginPath(); ctx.moveTo(x - L, y - 8); ctx.lineTo(x + L*.62, y - 8); ctx.lineTo(x + L + 5, y - 13); ctx.lineTo(x + L*.8, y + 4); ctx.lineTo(x - L + 2, y + 4); ctx.closePath(); ctx.fill();
  rect(col, x - L + 2, y - 3, L*1.78, 3); rect(tour ? '#8d6e63' : '#90caf9', x - L + 2, y + 1, L*1.7, 2);
  if(!tour){ rect('#ffffff', x + L*.3, y - 6, 18, 1); for(let i = 0; i < 6; i++) rect('#1565c0', x - L + 8 + i*12, y - 6, 6, 2); }
  rect('#a1887f', x - L + 3, y - 10, L*1.6, 2);   // sàn gỗ
  if(tour){
    // khách ngồi dưới mái che (chở bạn bè / NPC)
    [[-L + 12, 0], [-L + 24, 1], [L*.42, 2]].slice(0, bt.seats || 3).forEach(([dx, i]) => v68mSeat(x + dx, y - 9, i, t));
    // 4 cột + mái che sọc cam trắng, rèm lay nhẹ
    [-L + 4, -L + 34, L*.18, L*.62].forEach(dx => rect('#6d4c41', x + dx, y - 48, 2, 39));
    const top = y - 52; ctx.fillStyle = '#0d1020'; ctx.fillRect(x - L, top - 1, L*1.72, 8);
    for(let i = 0; i < 12; i++){ ctx.fillStyle = i % 2 ? '#ffffff' : col; ctx.fillRect(x - L + 1 + i*L*.142, top, L*.142, 6); }
    for(let i = 0; i < 12; i++){ const w = Math.sin(t*3 + i)*.8; ctx.fillStyle = i % 2 ? '#ffffff' : col; ctx.beginPath(); ctx.moveTo(x - L + 1 + i*L*.142, top + 6); ctx.lineTo(x - L + 1 + (i + 1)*L*.142, top + 6); ctx.lineTo(x - L + 1 + (i + .5)*L*.142, top + 9 + w); ctx.fill(); }
    rect('#ffd23f', x - 4, top - 7, 8, 6); rect('#0d1020', x - 4, top - 7, 8, 1); ctx.fillStyle = '#2e7d32'; ctx.font = '6px sans-serif'; ctx.fillText('🪷', x - 4, top - 2);
    // phao cứu sinh
    circ(x + L*.82, y - 13, 4, '#ff5252'); circ(x + L*.82, y - 13, 2, '#fff8e1'); rect('#ffffff', x + L*.82 - 4, y - 14, 2, 2); rect('#ffffff', x + L*.82 + 2, y - 14, 2, 2);
  } else {
    // cabin 2 tầng, cửa kính, cột ra-đa, cờ, khách ở cửa sổ
    rect('#0d1020', x - L*.5 - 1, y - 27, L*1.05 + 2, 18); rect('#eceff1', x - L*.5, y - 26, L*1.05, 16); rect('#0d1020', x - L*.28 - 1, y - 38, L*.62 + 2, 12); rect('#ffffff', x - L*.28, y - 37, L*.62, 11);
    for(let i = 0; i < 4; i++) rect('#4fc3f7', x - L*.46 + i*L*.255, y - 23, L*.2, 7); rect('#b3e5fc', x - L*.24, y - 34, L*.54, 5);
    v68mSeat(x - L*.33, y - 15, 1, t); v68mSeat(x + L*.18, y - 15, 3, t);
    rect('#455a64', x - L*.05, y - 52, 2, 15); ctx.save(); ctx.translate(x - L*.05 + 1, y - 51); ctx.rotate(t*2.4); rect('#cfd8dc', -7, -1, 14, 2); ctx.restore();
    rect('#ddd', x - L + 6, y - 34, 1, 26); const w = Math.sin(t*6); rect('#1e88e5', x - L + 7, y - 34 + w*.5, 9, 6); rect('#ffffff', x - L + 9, y - 32 + w*.5, 5, 2);
    if(typeof SKYST !== 'undefined' && SKYST && SKYST.night > .3){ ctx.fillStyle = 'rgba(255,245,157,.22)'; ctx.beginPath(); ctx.arc(x + L*.6, y - 20, 26, 0, Math.PI*2); ctx.fill(); }
    circ(x + L*.6, y - 20, 2, '#fff59d');
  }
  if(gear && gear.includes('g_flag') && tour){ rect('#ddd', x + L*.62, y - 58, 1, 14); rect('#ffd23f', x + L*.62 + 1, y - 58, 7, 4); }
}
