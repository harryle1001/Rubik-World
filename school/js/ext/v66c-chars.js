// ================= v66c · NHÂN VẬT KIỂU CŨ, NÉT HƠN, GIỐNG HỌC SINH HƠN =================
// Chủ game: "đổi lại nhân vật như cũ nhưng làm rõ nét hơn, giống học sinh hơn, làm đẹp chi tiết hơn".
// → Tắt nhân vật Ninja Adventure (v64s), vẽ lại drawBody cùng khung 16×35 cũ nhưng lưới ½ px, viền tối,
//   áo sơ mi có cổ + cúc + túi, khăn quàng đỏ, quai cặp, giày có ánh sáng, mắt có đốm sáng, má hồng, tóc có mái + ánh tóc.
// Mỗi dáng (màu áo/quần/tóc + hướng + khung đi) vẽ một lần vào canvas ×4 rồi dùng lại → không tốn khung hình.
// Đồ cầm tay, mũ, trang phục cửa hàng (drawStyle) vẫn vẽ đè như cũ nên mọi tính năng cũ giữ nguyên.
const V66C = {spr:new Map(), K:4, on:true, O:'#241a24'};
// một khối có viền tối: x,y,w,h theo đơn vị thế giới (lưới ½)
function v66cBox(c, x, y, w, h, o){ const g = ctx; if(o !== false){ g.fillStyle = V66C.O; g.fillRect(x - .5, y - .5, w + 1, h + 1); } g.fillStyle = c; g.fillRect(x, y, w, h); }
function v66cShade(c, k){   // làm tối/sáng màu hex
  const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if(!m) return c; const n = parseInt(m[1], 16); let r = n >> 16, gg = n >> 8 & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v*(1 + k) : v + (255 - v)*k)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(gg) << 8) | f(b)).toString(16).slice(1);
}
function v66cKey(a, swim, lA, lB, aw, by){ return [a.shirt, a.pants, a.skin, a.hair, a.long ? 1 : 0, a.skirt ? 1 : 0, a.student ? 1 : 0, a.bag, a.saoDo ? 1 : 0, a.glasses ? 1 : 0, a.aodai ? 1 : 0, a.dir > 0 ? 1 : 0, swim ? 1 : 0, lA, lB, aw, by, (a.planKey && a.planKey.startsWith('fb-')) ? a.team : ''].join('|'); }
// vẽ thân (toạ độ giống drawBody cũ: gốc ở chân, y âm là lên trên)
function v66cPaint(a, swim, lA, lB, aw, by){
  const d = a.dir > 0 ? 1 : -1, O = V66C.O, sk = a.skin || '#f6d0a8', skD = v66cShade(sk, -.16), sh = a.shirt || '#ffffff', shD = v66cShade(sh, -.18), shL = v66cShade(sh, .35);
  const pa = a.pants || '#1d3a7a', paD = v66cShade(pa, -.25), hr = a.hair || '#1a1a1a', hrL = v66cShade(hr, .32), R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  if(!swim){
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, -.5, 8.5, 2.2, 0, 0, 7); ctx.fill();
    if(a.skirt){
      // váy xếp ly + tất trắng + giày búp bê
      for(const [x, l] of [[-4, lA], [1.5, lB]]){ v66cBox(sk, x, -5, 2.5, 3 - l*.5); R('#ffffff', x, -3 - l*.5, 2.5, 1.2); v66cBox('#2a2030', x - .5, -2 - l*.5, 3.5, 2); R('#6b5a70', x, -2 - l*.5, 1.2, .6); }
      ctx.fillStyle = O; ctx.beginPath(); ctx.moveTo(-6.5, -12.5); ctx.lineTo(6.5, -12.5); ctx.lineTo(8, -4.5); ctx.lineTo(-8, -4.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pa; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(6, -12); ctx.lineTo(7.3, -5); ctx.lineTo(-7.3, -5); ctx.closePath(); ctx.fill();
      R(paD, -6, -12, 12, 1); for(const x of [-4.5, -1.5, 1.5, 4.5]) R(paD, x, -10.5, .5, 5.5); R(v66cShade(pa, .2), -5.5, -11, 1, 5);
    } else {
      // quần âu + tất + giày có ánh sáng
      for(const [x, l] of [[-5, lA], [1, lB]]){ v66cBox(pa, x, -11, 4, 8.5 - l); R(paD, x + (d > 0 ? 3 : 0), -11, 1, 8.5 - l); R('#ffffff', x, -2.6 - l, 4, .8);
        v66cBox('#2a2030', x - .5 + (d > 0 ? .5 : -.5), -2 - l, 4.5, 2); R('#7a6a80', x + (d > 0 ? 2.5 : 0), -2 - l, 1.5, .6); }
    }
  }
  const fb = a.planKey && a.planKey.startsWith('fb-');
  // tay sau (vẽ trước thân)
  const armB = d > 0 ? -8.5 : 6, armF = d > 0 ? 6 : -8.5, ab = d > 0 ? aw : -aw;
  v66cBox(sh, armB, -20.5 + by + ab, 2.5, 3.5); v66cBox(sk, armB, -17 + by + ab, 2.5, 5.5); R(skD, armB, -13 + by + ab, 2.5, 1.5);
  // thân áo
  if(a.aodai){ v66cBox(sh, -6, -21 + by, 12, 16); R(shD, d > 0 ? 3 : -6, -21 + by, 3, 16); R('#ffd23f', -1, -20 + by, 2, 6); R(shL, d > 0 ? -5 : 2, -20 + by, 3, 1); }
  else {
    v66cBox(sh, -6, -21 + by, 12, 12); R(shD, d > 0 ? 4 : -6, -21 + by, 2, 12); R(shL, d > 0 ? -5 : 1, -20.5 + by, 4, .8);
    if(fb) R(a.team === 'L' ? '#ef4b4b' : '#3d7bff', -6, -17 + by, 12, 5);
    if(!a.skirt){ R(O, -6, -10 + by, 12, 1); R('#3a2a1e', -6, -10 + by, 12, .6); R('#d9b25a', -1, -10 + by, 2, .8); }   // thắt lưng + khoá
    else R(O, -6, -9.5 + by, 12, .6);
    // cổ áo sơ mi + hàng cúc + túi ngực
    R('#ffffff', -3.5, -21 + by, 3, 2); R('#ffffff', .5, -21 + by, 3, 2); R(O, -3.5, -19 + by, 3, .5); R(O, .5, -19 + by, 3, .5);
    for(let k = 0; k < 4; k++) R(shD, -.3, -18 + k*2.2 + by, .8, .8);
    if(!fb){ R(shD, d > 0 ? -4.5 : 1.5, -16.5 + by, 3, .5); R(shD, d > 0 ? -4.5 : 1.5, -16.5 + by, .5, 2.5); R(shD, d > 0 ? -2 : 4, -16.5 + by, .5, 2.5); R(shD, d > 0 ? -4.5 : 1.5, -14 + by, 3, .5); }
  }
  if(a.student){
    // quai cặp + cặp sau lưng
    const bx = d > 0 ? -9 : 6; v66cBox(a.bag || '#3d7bff', bx, -20 + by, 3, 10); R(v66cShade(a.bag || '#3d7bff', -.3), bx, -12 + by, 3, 2); R(v66cShade(a.bag || '#3d7bff', .3), bx + .5, -19.5 + by, 1, 7);
    R(v66cShade(a.bag || '#3d7bff', -.35), d > 0 ? -5 : 3.5, -21 + by, 1.5, 9);
    // khăn quàng đỏ: tam giác + nút thắt
    ctx.fillStyle = O; ctx.beginPath(); ctx.moveTo(-3.8, -21.3 + by); ctx.lineTo(3.8, -21.3 + by); ctx.lineTo(0, -14.3 + by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e02424'; ctx.beginPath(); ctx.moveTo(-3, -21 + by); ctx.lineTo(3, -21 + by); ctx.lineTo(0, -15.2 + by); ctx.closePath(); ctx.fill();
    R('#b71c1c', -1, -20.5 + by, 2, 1.5); R('#ff6b6b', -2.2, -20.6 + by, 1.2, .6);
    if(a.saoDo){ v66cBox('#c62828', d > 0 ? 4.5 : -7.5, -19 + by, 3, 3.5); R('#ffd23f', d > 0 ? 5.5 : -6.5, -18 + by, 1, 1.5); }
  }
  // tay trước
  v66cBox(sh, armF, -20.5 + by - ab, 2.5, 3.5); R(shD, armF, -18 + by - ab, 2.5, 1); v66cBox(sk, armF, -17 + by - ab, 2.5, 5.5); R(skD, armF, -13 + by - ab, 2.5, 1.5);
  // cổ + đầu (bo góc)
  R(skD, -2, -22 + by, 4, 1.5);
  const hx = -5, hy = -31 + by; R(O, hx + .5, hy - .5, 9, 11); R(O, hx - .5, hy + .5, 11, 9); R(sk, hx + .5, hy, 9, 10); R(sk, hx, hy + .5, 10, 9);
  R(skD, d > 0 ? hx + 8 : hx, hy + 6, 2, 3.5); R(v66cShade(sk, .25), d > 0 ? hx + 1 : hx + 7, hy + 2, 1.5, 1);
  // tai
  v66cBox(sk, d > 0 ? hx - 1 : hx + 10, hy + 4.5, 1, 2.5); R(skD, d > 0 ? hx - 1 : hx + 10, hy + 6, 1, 1);
  // tóc: chỏm + mái răng cưa + ánh tóc
  R(O, -6.5, -33.5 + by, 13, 5); R(hr, -6, -33 + by, 12, 4.5); R(hr, -5.5, -33.5 + by, 11, .6);
  for(let k = 0; k < 5; k++) R(hr, -5 + k*2.2 + (d > 0 ? .6 : 0), -28.5 + by, 1.4, 1 + (k % 2)*.8);
  R(hrL, d > 0 ? -3 : 0, -32.5 + by, 3, .7); R(hrL, d > 0 ? 1 : -4, -31.6 + by, 2, .5);
  if(a.long){ v66cBox(hr, -6.5, -30 + by, 2, 11); v66cBox(hr, 4.5, -30 + by, 2, 11); R(hrL, -6.2, -28 + by, .6, 6); R(v66cShade(hr, -.3), 4.8, -22 + by, 1.6, 3); R('#ff6f91', d > 0 ? 4.5 : -6.5, -30 + by, 2, 1.2); }
  else { R(hr, d > 0 ? -6 : 4, -31 + by, 2, 4); R(hr, d > 0 ? -6 : 5, -29 + by, 1, 3); }
  // mắt: tròng trắng + con ngươi + đốm sáng; lông mày; má hồng; miệng
  const ex = [d > 0 ? -.5 : -4, d > 0 ? 3 : -.5];
  ex.forEach(x => { R('#ffffff', x, -27.5 + by, 2, 2.5); R('#1a1a2e', x + (d > 0 ? .7 : 0), -27.2 + by, 1.3, 2.2); R('#ffffff', x + (d > 0 ? 1.1 : .3), -27 + by, .6, .6); R(v66cShade(hr, -.1), x, -28.6 + by, 2, .5); });
  R('rgba(255,120,140,.55)', d > 0 ? -2.5 : -4.5, -24.8 + by, 1.6, .9); R('rgba(255,120,140,.55)', d > 0 ? 4 : 2, -24.8 + by, 1.6, .9);
  R('#a8443a', d > 0 ? 1.2 : -2.2, -23.6 + by, 1.6, .6); R('#e86a6a', d > 0 ? 1.5 : -1.9, -23.1 + by, 1, .4);
  if(a.glasses){ ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = .5; ex.forEach(x => ctx.strokeRect(x - .4, -28 + by, 2.8, 3.2)); R('#2b2b33', ex[0] + 2.4, -27 + by, ex[1] - ex[0] - 2.4, .5); }
}
function v66cSprite(a, swim, lA, lB, aw, by){
  const key = v66cKey(a, swim, lA, lB, aw, by); let s = V66C.spr.get(key); if(s) return s;
  if(V66C.spr.size > 900) V66C.spr.clear();
  const K = V66C.K, W = 24, H = 40, c = document.createElement('canvas'); c.width = W*K; c.height = H*K; const g = c.getContext('2d');
  const prev = ctx; ctx = g; try { g.setTransform(K, 0, 0, K, (W/2)*K, (H - 2)*K); v66cPaint(a, swim, lA, lB, aw, by); } catch(e){ console.warn('v66c paint', e); } finally { ctx = prev; }
  s = {c, W, H}; V66C.spr.set(key, s); return s;
}
// đồ cầm tay / mũ / trang phục: giữ nguyên code cũ
function v66cExtras(a, by){
  if(a.id === 'nam' && festival && festival.kind === 'noel'){ rect('#d32f2f', -6, -38 + by, 12, 6); rect('#d32f2f', a.dir*4 - 2, -42 + by, 6, 5); rect('#fff', -6, -33 + by, 12, 2); rect('#fff', a.dir*6 - 1, -44 + by, 3, 3); rect('#fff', -5, -24 + by, 10, 4); }
  else if(a.cap){ rect(V66C.O, -6.5, -35.5 + by, 13, 5); rect(a.cap, -6, -35 + by, 12, 4); rect(v66cShade(a.cap, .3), -5, -34.5 + by, 5, 1); rect(a.brim || a.cap, a.dir>0 ? 2 : -9, -32 + by, 7, 2); }
  if(a.style) drawStyle(a, by);
  const ic = a.icon || (a.drum ? 'drum' : a.gift ? 'gift' : a.task.includes('Rubik') ? 'cube' : /mạch|điện/.test(a.task) ? 'bolt' : a.task.includes('cờ vua') ? 'chess' : /(piano|đàn|Hát|nhạc)/i.test(a.task) ? 'note' : a.saoDo ? 'star' : null);
  if(!ic) return; const ix = a.dir>0 ? 9 : -15, iy = -24 + by;
  if(ic==='cube') miniCube(ix, iy, 2.4);
  else if(ic==='clip'){ rect('#7a4b2a', ix, iy, 7, 9); rect('#fff', ix+1, iy+2, 5, 6); }
  else if(ic==='paper'){ rect('#fff', ix, iy, 7, 9); rect('#999', ix+1, iy+3, 5, 1); rect('#999', ix+1, iy+5, 5, 1); }
  else if(ic==='whistle') rect('#c0c0c0', ix, iy+3, 6, 4);
  else if(ic==='eye'){ rect('#fff', ix, iy+2, 7, 4); rect('#222', ix+2, iy+3, 3, 2); }
  else if(ic==='chess'){ rect('#111', ix+1, iy+2, 5, 7); rect('#111', ix+2, iy, 3, 3); }
  else if(ic==='note'){ rect('#ffd23f', ix, iy+5, 4, 4); rect('#ffd23f', ix+3, iy, 2, 8); }
  else if(ic==='bolt'){ rect('#ffd23f', ix+3, iy, 3, 4); rect('#ffd23f', ix+1, iy+3, 4, 2); rect('#ffd23f', ix, iy+5, 3, 4); }
  else if(ic==='camcorder'){ rect('#222', ix-1, iy+1, 10, 7); rect('#555', ix + (a.dir>0 ? 8 : -3), iy+2, 4, 5); rect('#ef4b4b', ix+1, iy+2, 2, 2); }
  else if(ic==='anchor'){ rect('#1d2c52', ix+3, iy, 2, 9); rect('#1d2c52', ix, iy+7, 8, 2); rect('#1d2c52', ix+1, iy+2, 6, 1); }
  else if(ic==='drum'){ rect('#d32f2f', ix-1, iy+2, 10, 7); rect('#f4f4f4', ix-1, iy+1, 10, 2); }
  else if(ic==='gift'){ rect('#ef4b4b', ix, iy+2, 8, 7); rect('#ffd23f', ix+3, iy+2, 2, 7); }
  else if(ic==='star'){ rect('#c62828', ix, iy+1, 8, 8); rect('#ffd23f', ix+3, iy+2, 2, 6); rect('#ffd23f', ix+1, iy+4, 6, 2); }
}
const v66cDB0 = drawBody;   // lớp v64s (NA) + các lớp cũ bên dưới
drawBody = function(a, swim){
  if(!V66C.on || a.lion) return v66cDB0(a, swim);
  try {
    const ph = a.moving ? Math.floor(a.walk*1.5) % 6 : 0, lA = a.moving ? [0,1,2,2,1,0][ph] : 0, lB = a.moving ? [2,1,0,0,1,2][ph] : 0, aw = a.moving ? [1,1,0,-1,-1,0][ph] : 0;
    const by = (swim ? -6 : 0) + (a.moving && (ph === 1 || ph === 4) ? -1 : 0);
    const s = v66cSprite(a, swim, lA, lB, aw, by), sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(s.c, -s.W/2, -(s.H - 2), s.W, s.H); ctx.imageSmoothingEnabled = sm;
    v66cExtras(a, by);
  } catch(e){ console.warn('v66c', e); V66C.on = false; return v66cDB0(a, swim); }
};
function v66cInit(){
  // tắt nhân vật Ninja Adventure (học sinh, người chơi, thầy cô) → hình cũ đã làm đẹp
  if(typeof v64sDrawNA === 'function') v64sDrawNA = function(){ return false; };
  if(typeof v64sTeachSpr === 'function') v64sTeachSpr = function(){ return null; };
  if(typeof v64sPicker === 'function') v64sPicker = function(){ const b = document.getElementById('v64sPick'); if(b) b.remove(); };
}
