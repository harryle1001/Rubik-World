// ================= v45: shop redraw. Pixel-art bikes from ONE master renderer (shared wheel, tube, saddle, crank
// parts + a short spec per design), colour variants made by code; every other shop item goes through the same pixel
// pipeline (2 px per world unit, hard alpha, 1 px dark outline). Product cards split by the golden ratio 1 : 1.618.
// The same cached bike sprite is drawn in the shop card and under the rider on the map. =================
const V45 = {cache:new Map(), K:2, OX:22, OY:31, W:44, H:34, PHI:1.618, OUT:'#0d1020'};
const V45_SPRITE_ACC = ['basket', 'light', 'bell', 'flag', 'carrier', 'speaker', 'seat'];
const V45_TABICON = {bike:'🚲', chess:'♟️', bacc:'🔔', pet:'🐾', outfit:'👕', hat:'🎩', jewel:'💍', boat:'⛵', bgear:'⚓', fish:'🎣'};
const V45_STAGE = {bike:['#2a3f7a','#0f1533'], bacc:['#2a3f7a','#0f1533'], chess:['#3b2f5e','#141030'], pet:['#24524a','#0d1f22'], outfit:['#4a2f63','#170f2b'], hat:['#4a2f63','#170f2b'], jewel:['#5a4520','#1d1508'], boat:['#1f4f7a','#0a1a33'], bgear:['#1f4f7a','#0a1a33'], fish:['#1f5a6a','#0a1e26']};

// ---------- colour helpers (any css colour -> hex variants) ----------
function v45rgb(c){
  c = String(c || '#888');
  if(c[0] === '#'){ let h = c.slice(1); if(h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16) || 0; return [n >> 16, (n >> 8) & 255, n & 255]; }
  const m = c.match(/[\d.]+/g) || [128, 128, 128]; return m.slice(0, 3).map(Number);
}
const v45hex = r => '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const v45mix = (c, k) => v45hex(v45rgb(c).map(v => k > 0 ? v + (255 - v)*k : v*(1 + k)));
function v45hsl(h, s, l){ s /= 100; l /= 100; const f = n => { const k = (n + h/30) % 12; return 255*(l - s*Math.min(l, 1 - l)*Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return v45hex([f(0), f(8), f(4)]); }

// ---------- raster painter: world units in, crisp pixels out ----------
function v45Painter(g, K, ox, oy){
  const X = u => Math.round((ox + u)*K), Y = v => Math.round((oy + v)*K);
  const ln = (a, b, e, f, w, c) => { const dx = Math.abs(e - a), dy = -Math.abs(f - b), sx = a < e ? 1 : -1, sy = b < f ? 1 : -1, o = Math.floor((w - 1)/2); let err = dx + dy; g.fillStyle = c;
    for(let n = 0; n < 400; n++){ g.fillRect(a - o, b - o, w, w); if(a === e && b === f) break; const e2 = 2*err; if(e2 >= dy){ err += dy; a += sx; } if(e2 <= dx){ err += dx; b += sy; } } };
  const P = {g, K, X, Y, ln,
    line(x1, y1, x2, y2, w, c){ ln(X(x1), Y(y1), X(x2), Y(y2), w, c); },
    hl(x1, y1, x2, y2, w, c){ if(w < 2) return; const a = X(x1), b = Y(y1), e = X(x2), f = Y(y2), o = Math.floor((w - 1)/2);
      if(Math.abs(f - b) > Math.abs(e - a)){ ln(a - o, b, e - o, f, 1, v45mix(c, .45)); if(w > 2) ln(a + w - 1 - o, b, e + w - 1 - o, f, 1, v45mix(c, -.32)); }
      else { ln(a, b - o, e, f - o, 1, v45mix(c, .45)); if(w > 2) ln(a, b + w - 1 - o, e, f + w - 1 - o, 1, v45mix(c, -.32)); } },
    tube(x1, y1, x2, y2, w, c){ P.line(x1, y1, x2, y2, w, c); P.hl(x1, y1, x2, y2, w, c); },
    curve(x1, y1, cx, cy, x2, y2, w, c){ const pts = []; for(let i = 0; i <= 10; i++){ const t = i/10, u = 1 - t; pts.push([u*u*x1 + 2*u*t*cx + t*t*x2, u*u*y1 + 2*u*t*cy + t*t*y2]); }
      for(let i = 1; i < pts.length; i++) P.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w, c);
      for(let i = 1; i < pts.length; i++) P.hl(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w, c); },
    box(x, y, w, h, c){ g.fillStyle = c; g.fillRect(X(x), Y(y), Math.max(1, Math.round(w*K)), Math.max(1, Math.round(h*K))); },
    px(x, y, c){ g.fillStyle = c; g.fillRect(X(x), Y(y), 1, 1); },
    ring(cx, cy, r, t, fn){ const a = X(cx), b = Y(cy), R = r*K, T = t*K; for(let j = Math.floor(-R) - 1; j <= Math.ceil(R); j++) for(let i = Math.floor(-R) - 1; i <= Math.ceil(R); i++){ const x = i + .5, y = j + .5, d = Math.hypot(x, y); if(d <= R && d > R - T){ const c = typeof fn === 'string' ? fn : fn(x, y, d, R); if(c){ g.fillStyle = c; g.fillRect(a + i, b + j, 1, 1); } } } },
    disc(cx, cy, r, c){ P.ring(cx, cy, r, r + 1, c); }
  };
  return P;
}
// hard alpha (no blurry edges) + optional 1 px outline around the whole silhouette
function v45Pixelize(g, w, h, out){
  const im = g.getImageData(0, 0, w, h), d = im.data, A = new Uint8Array(w*h);
  for(let i = 0; i < w*h; i++){ if(d[i*4 + 3] >= 110){ A[i] = 1; d[i*4 + 3] = 255; } else d[i*4 + 3] = 0; }
  if(out){ const [r, gg, b] = v45rgb(out);
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = y*w + x; if(A[i]) continue;
      if((x > 0 && A[i - 1]) || (x < w - 1 && A[i + 1]) || (y > 0 && A[i - w]) || (y < h - 1 && A[i + w])){ d[i*4] = r; d[i*4 + 1] = gg; d[i*4 + 2] = b; d[i*4 + 3] = 255; } } }
  g.putImageData(im, 0, 0);
  let x0 = w, y0 = h, x1 = -1, y1 = -1; for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) if(d[(y*w + x)*4 + 3]){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
  return x1 < 0 ? {x0:0, y0:0, x1:w - 1, y1:h - 1} : {x0, y0, x1, y1};
}

// ---------- master bike kit: shared parts every design is built from ----------
function v45Kit(P, col, spin, accs, gh){
  const D = {P, col, spin, accs, hubs:[], dk:v45mix(col, -.35), lt:v45mix(col, .35), sil:'#c9d2dc', dark:'#2c2f3a', grip:'#1f2028',
    tire: gh >= 0 ? v45hsl(gh*30, 90, 60) : '#26262e'};
  D.wheel = (cx, r, o) => { o = o || {}; const cy = -r, T = o.t || 1, n = o.n || 3, K = P.K, R = r*K, Tk = T*K, rimW = o.deep ? 3 : 1.6, a = P.X(cx), b = P.Y(cy), sr = R - Tk - rimW + .5;
    D.hubs.push([cx, cy]);
    for(let k = 0; k < n; k++){ const an = spin + k*Math.PI/n, dx = Math.cos(an)*sr, dy = Math.sin(an)*sr; P.ln(Math.round(a - dx), Math.round(b - dy), Math.round(a + dx), Math.round(b + dy), 1, o.spoke || '#8f99a6'); }
    const tire = o.tire || D.tire, rim = o.rim || D.sil;
    P.ring(cx, cy, r, T + (o.white ? .8 : 0) + rimW/K, (x, y, d) => {
      if(d > R - Tk){ if(o.tread && d > R - 1.2 && ((Math.atan2(y, x)*R/1.7 | 0) & 1)) return '#111116'; return x + y < -R*.6 ? v45mix(tire, .3) : tire; }
      if(o.white && d > R - Tk - 1.6) return '#f2efe6';
      return x + y < -R*.4 ? v45mix(rim, .4) : x + y > R*.4 ? v45mix(rim, -.3) : rim; });
    P.disc(cx, cy, o.hub || .8, o.hubC || '#e6ebf0'); };
  D.fender = (cx, r, c) => { const cy = -r, R = r + .9; let p = null; for(let a = 200; a <= 340; a += 14){ const q = [cx + Math.cos(a*Math.PI/180)*R, cy + Math.sin(a*Math.PI/180)*R]; if(p) P.line(p[0], p[1], q[0], q[1], 2, c || D.lt); p = q; } };
  D.crank = (x, y, r, ring) => { if(ring !== false){ P.ring(x, y, r, .7, (xx, yy) => xx + yy < 0 ? '#d5dce4' : '#9aa4af'); P.disc(x, y, .6, '#5c6370'); }
    const an = spin*1.6 + Math.PI/2, ex = x + Math.cos(an)*2.4, ey = y + Math.sin(an)*2.4; P.line(x, y, ex, ey, 2, '#3a3e4a'); P.box(ex - .8, ey - .3, 1.6, .7, '#17181d'); };
  D.chain = (x1, y1, x2, y2, r2) => { P.line(x1, y1 - .7, x2, y2 - r2, 1, '#4a4f5c'); P.line(x1, y1 + .7, x2, y2 + r2, 1, '#4a4f5c'); };
  D.saddle = (x, y, w, kind) => { const leather = accs.includes('seat'), c = leather ? '#7b4a2a' : kind === 'velvet' ? '#b71c1c' : kind === 'brown' ? '#6d4c2e' : '#2b2c35', h = kind === 'comfy' || kind === 'velvet' ? 1.6 : 1.1;
    P.box(x, y, w, h, c); P.box(x + .5, y, w - 1, .5, v45mix(c, .4)); if(kind === 'comfy' || kind === 'velvet') P.box(x + w - 1.2, y + h - .5, 1.2, .5, v45mix(c, -.3));
    if(leather) for(let i = 1; i < w*2 - 1; i += 2) P.px(x + i/2, y + h - .6, '#d7b48a'); if(kind === 'velvet') P.box(x, y + h - .5, w, .5, '#ffd23f'); };
  D.grips = (x, y) => P.box(x - .6, y - .4, 1.4, 1, D.grip);
  return D;
}
// one spec per design: wheels, frame tubes, saddle, bar, extras; returns anchor points used by accessories and the rider
const V45_BIKES = {
  kid(D){ const {P, col} = D; D.wheel(-8, 4.5, {t:1.1}); D.wheel(8, 4.5, {t:1.1}); D.fender(-8, 4.5); D.fender(8, 4.5);
    D.chain(0, -4.5, -8, -4.5, .8); P.tube(-8, -4.5, 0, -4.5, 3, col); P.tube(-8, -4.5, -2.6, -11, 2, col); P.tube(0, -4.5, -3, -12.2, 3, col); P.curve(0, -4.5, 3.5, -5.5, 6, -11, 3, col);
    P.tube(6, -11, 8, -4.5, 2, D.sil); P.tube(5.6, -12.8, 6.2, -10.6, 3, col); P.line(-3, -12.2, -3.2, -13.4, 2, D.sil); D.saddle(-5.6, -14.4, 5, 'comfy');
    P.line(5.6, -12.8, 5.4, -15.6, 2, D.sil); P.line(3.4, -16, 6.6, -15.6, 2, D.dark); P.box(3, -16.4, 1.2, 1, '#ff6f91'); D.crank(0, -4.5, 1.3);
    // built-in wicker basket with a flower: the kid bike's signature
    P.box(7, -17, 6.4, 5, '#c8a26a'); for(let r = 0; r < 4; r++) P.box(7, -16.4 + r*1.2, 6.4, .5, '#9c7a46'); for(let c = 0; c < 6; c += 2) P.box(7.6 + c, -17, .5, 5, '#e2c38c'); P.box(7, -17.4, 6.4, .7, '#8d6e4a');
    P.disc(9.4, -18.4, .9, '#ff6f91'); P.px(9.4, -18.4, '#ffd23f'); P.line(11.2, -17.4, 11.8, -19, 1, '#2fbf71');
    return {seat:[-3, -14.4], bar:[6, -16], rear:[-9.6, -10.6], lamp:[6.8, -13.4], basket:true}; },
  mtb(D){ const {P, col} = D; D.wheel(-8.4, 5.4, {t:1.4, tread:true}); D.wheel(8.4, 5.4, {t:1.4, tread:true}); P.ring(-8.4, -5.4, 1.6, .5, '#b0b8c2'); P.ring(8.4, -5.4, 1.6, .5, '#b0b8c2');
    D.chain(0, -5.2, -8.4, -5.4, .9); P.tube(-8.4, -5.4, 0, -5.2, 3, col); P.tube(-8.4, -5.4, -1.8, -11.8, 2, col); P.tube(0, -5.2, -1.6, -13.4, 3, col); P.tube(-1.6, -12.6, 6, -12.8, 3, col); P.tube(0, -5.2, 6.4, -10.4, 4, col);
    P.tube(6.6, -10, 7.6, -7.4, 3, '#cfd8dc'); P.tube(7.6, -7.4, 8.4, -5.4, 2, D.dark); P.tube(6, -13.2, 6.6, -10, 3, D.dark); P.box(-1.2, -9, 1, 1.8, '#ffb300');
    P.line(-1.6, -13.4, -1.9, -15, 2, D.sil); D.saddle(-4.4, -15.8, 5, 'slim'); P.line(6, -13.2, 6.6, -15.2, 2, D.dark); P.line(4.4, -15.8, 9.4, -15.6, 2, D.dark); D.grips(4.6, -15.8); D.crank(0, -5.2, 1.4);
    return {seat:[-2, -15.8], bar:[7, -15.8], rear:[-9.8, -11], lamp:[7.6, -13.6]}; },
  road(D){ const {P, col} = D; D.wheel(-8, 5, {t:.7, deep:true, rim:D.dk}); D.wheel(8, 5, {t:.7, deep:true, rim:D.dk});
    D.chain(0, -5, -8, -5, 1); P.tube(-8, -5, 0, -5, 2, col); P.tube(-8, -5, -1.2, -12.4, 2, col); P.tube(0, -5, -1.3, -13.4, 3, col); P.tube(-1.3, -12.8, 7, -13, 3, col); P.tube(0, -5, 7.3, -10.6, 3, col);
    P.tube(7, -13.4, 7.4, -10.4, 3, D.dk); P.tube(7.4, -10.4, 8, -5, 2, col); P.box(1.4, -9, 3, .6, '#fafafa');
    P.line(-1.3, -13.4, -1.5, -14.4, 2, '#1b1b1f'); D.saddle(-3.8, -15, 4.6, 'slim'); P.line(7, -13.4, 8.8, -13.8, 2, D.dark);
    P.ring(9.2, -12.2, 1.7, .55, (x) => x > -1 ? '#24252c' : null); P.box(8.6, -14.2, 1.2, .9, D.grip); D.crank(0, -5, 1.6);
    return {seat:[-1.5, -15], bar:[8.8, -14], rear:[-9.4, -11], lamp:[9.6, -12.6]}; },
  ebike(D){ const {P, col} = D; D.wheel(-8, 5, {hub:1.6, hubC:'#5c6370'}); D.wheel(8, 5); D.fender(-8, 5, D.dark); D.fender(8, 5, D.dark);
    D.chain(0, -5, -8, -5, .9); P.tube(-8, -5, 0, -5, 3, col); P.tube(-8, -5, -1.4, -11.6, 2, col); P.tube(0, -5, -1.4, -13, 3, col); P.tube(-1.4, -12.2, 6, -12.2, 3, col); P.tube(0, -5, 6.4, -10.2, 4, col);
    P.line(1, -6.6, 4.6, -9.4, 5, '#37474f'); P.hl(1, -6.6, 4.6, -9.4, 5, '#37474f'); [1.6, 2.6, 3.6].forEach((t, i) => P.px(t + .4, -7.6 - i*.8, '#76ff03'));
    P.tube(6.4, -10.2, 8, -5, 2, D.sil); P.tube(6, -12.6, 6.4, -10.2, 3, col); P.line(-9.4, -10.4, -3, -10.4, 2, D.dark); P.line(-8, -5, -8.6, -10.4, 1, D.dark);
    P.line(-1.4, -13, -1.6, -14, 2, D.sil); D.saddle(-4.2, -14.8, 5, 'comfy'); P.line(6, -12.6, 6.2, -15.4, 2, D.dark); P.line(4.6, -15.6, 7.8, -15.4, 2, D.dark); D.grips(4.8, -15.6);
    P.box(7.2, -13.4, 1.6, 1.4, '#cfd8dc'); P.box(7.8, -13.1, 1, .8, '#fff59d'); D.crank(0, -5, 1.3);
    return {seat:[-1.6, -14.8], bar:[6.4, -15.6], rear:[-8.4, -10.6], lamp:[7.2, -13.4], lampBuilt:true}; },
  royal(D){ const {P, col} = D, gold = '#ffe082'; D.wheel(-8, 5, {white:true, rim:gold, spoke:'#e6b422'}); D.wheel(8, 5, {white:true, rim:gold, spoke:'#e6b422'});
    D.chain(0, -5, -8, -5, .9); P.tube(-8, -5, 0, -5, 3, col); P.tube(-8, -5, -1.4, -11.6, 3, col); P.tube(0, -5, -1.4, -13, 4, col); P.curve(-1.4, -12, 2.4, -13.4, 6, -12, 4, col); P.tube(0, -5, 6.4, -10, 4, col);
    P.tube(6, -12.6, 6.4, -10, 3, col); P.tube(6.4, -10, 8, -5, 3, col); P.disc(6.2, -11.6, .6, '#d50032'); P.box(-1.6, -9.6, 1.4, .6, '#fff8e1'); P.px(-1.6, -10.2, '#fff8e1'); P.px(-.9, -10.2, '#fff8e1');
    P.line(-1.4, -13, -1.6, -14, 2, gold); D.saddle(-4.4, -15.2, 5.4, 'velvet'); P.line(6, -12.6, 6.2, -15.2, 2, gold); P.curve(6.2, -15.2, 4.6, -16.4, 3.6, -15.6, 2, gold); P.line(6.2, -15.2, 8.2, -15.8, 2, gold); D.crank(0, -5, 1.6);
    return {seat:[-1.6, -15.2], bar:[6.6, -16], rear:[-9.2, -11], lamp:[7.4, -13], sparkle:[-9, -14]}; },
  bmx(D){ const {P, col} = D; D.wheel(-7, 4, {t:1.3, tread:true, n:2}); D.wheel(7, 4, {t:1.3, tread:true, n:2}); P.box(-8.6, -4.5, 3.2, 1, D.sil); P.box(5.4, -4.5, 3.2, 1, D.sil);
    D.chain(0, -4.4, -7, -4, .7); P.tube(-7, -4, 0, -4.4, 3, col); P.tube(-7, -4, -1.4, -9.4, 3, col); P.tube(0, -4.4, -1.4, -10, 4, col); P.tube(-1.4, -9.6, 5.4, -10.2, 4, col); P.tube(0, -4.4, 5.6, -8, 4, col);
    P.tube(5.8, -10.4, 7, -4, 3, '#cfd8dc'); P.line(-1.4, -10, -1.6, -10.8, 2, D.sil); D.saddle(-3.8, -11.6, 4.6, 'slim');
    P.line(5.6, -10.6, 5.6, -12, 2, D.dark); P.line(4.4, -14.6, 4.8, -12, 2, '#cfd8dc'); P.line(4.8, -12, 7.4, -12, 2, '#cfd8dc'); P.line(7.4, -12, 7.8, -14.6, 2, '#cfd8dc'); P.line(4.6, -13.4, 7.6, -13.4, 1, '#cfd8dc'); D.grips(4.3, -15); D.grips(7.9, -15); D.crank(0, -4.4, 1.9);
    return {seat:[-1.6, -11.6], bar:[6, -14.6], rear:[-8.4, -9], lamp:[7, -11.4]}; },
  tandem(D){ const {P, col} = D; D.wheel(-13, 5); D.wheel(13, 5);
    D.chain(-6, -5, -13, -5, .9); P.line(-6, -5.9, 3, -5.9, 1, '#4a4f5c'); P.tube(-13, -5, -6, -5, 3, col); P.tube(-13, -5, -7, -11.6, 2, col); P.tube(-6, -5, -7.2, -13, 3, col); P.tube(3, -5, 2, -13, 3, col);
    P.tube(-7.2, -12.2, 9, -12.4, 3, col); P.tube(-6, -5, 3, -5, 3, col); P.tube(3, -5, 9.4, -10.2, 3, col); P.tube(9, -12.8, 9.5, -10, 3, col); P.tube(9.5, -10, 13, -5, 2, D.sil);
    P.line(-7.2, -13, -7.4, -14, 2, D.sil); P.line(2, -13, 1.8, -14, 2, D.sil); D.saddle(-9.8, -14.6, 5, 'slim'); D.saddle(-.6, -14.6, 5, 'slim');
    P.line(-1.2, -13.4, -2.2, -15.6, 2, D.dark); P.line(-3.6, -15.6, -1.6, -15.6, 2, D.dark); P.line(9, -12.8, 9.2, -15.6, 2, D.dark); P.line(7.4, -16, 10.6, -15.8, 2, D.dark); D.grips(7.6, -16);
    D.crank(-6, -5, 1.3); D.crank(3, -5, 1.3);
    return {seat:[1.6, -14.6], bar:[9.4, -16], rear:[-14.4, -11], lamp:[10.4, -13.4]}; },
  cargo(D){ const {P, col} = D; D.wheel(-10, 5); D.wheel(11, 4); D.fender(-10, 5);
    D.chain(-3, -5, -10, -5, .9); P.tube(-10, -5, -3, -5, 3, col); P.tube(-10, -5, -4.4, -11.6, 2, col); P.tube(-3, -5, -4.6, -13.2, 3, col); P.tube(-4.6, -12.4, 2.4, -12.6, 3, col); P.tube(-3, -5, 2.8, -10.4, 4, col);
    P.tube(2.4, -13, 3, -10.4, 3, col); P.tube(3, -10.4, 11, -4, 2, D.sil); P.line(-4.6, -13.2, -4.8, -14, 2, D.sil); D.saddle(-7.4, -14.6, 5, 'comfy');
    P.line(2.4, -13, 2.6, -15.8, 2, D.dark); P.line(.8, -16.2, 4, -16, 2, D.dark); D.grips(1, -16.2); D.crank(-3, -5, 1.3);
    // wooden crate with books and flowers
    P.disc(5.8, -13.4, .9, '#ef4b4b'); P.disc(8, -13.8, .9, '#ffd23f'); P.disc(10.2, -13.2, .9, '#ff6f91'); P.box(11.6, -14.6, 1.4, 2, '#3d7bff'); P.box(13, -14, 1.2, 1.4, '#2fbf71');
    P.box(4, -12.6, 11, 6.6, '#8d6e4a'); P.box(4, -12.6, 11, 1.2, '#a1887f'); P.box(4, -9.6, 11, .5, '#6d4c2e'); P.box(4.2, -12.4, .6, 6.2, '#a1887f'); P.box(14.2, -12.4, .6, 6.2, '#6d4c2e');
    return {seat:[-4.8, -14.6], bar:[2.6, -16], rear:[-11.4, -11], lamp:[15, -11.4], basket:true}; },
  fat(D){ const {P, col} = D; D.wheel(-8.6, 6, {t:2.4, tread:true}); D.wheel(8.6, 6, {t:2.4, tread:true});
    D.chain(0, -6, -8.6, -6, 1); P.tube(-8.6, -6, 0, -6, 4, col); P.tube(-8.6, -6, -1.6, -12.6, 3, col); P.tube(0, -6, -1.6, -14.4, 4, col); P.tube(-1.6, -13.4, 6.4, -13.6, 4, col); P.tube(0, -6, 6.8, -11.4, 4, col);
    P.tube(6.4, -14, 6.9, -11.2, 3, D.dark); P.tube(6.9, -11.2, 8.6, -6, 3, col); P.line(-1.6, -14.4, -1.8, -15.4, 2, D.sil); D.saddle(-4.4, -16.2, 5, 'slim');
    P.line(6.4, -14, 6.8, -16.8, 2, D.dark); P.line(5, -17.2, 9.6, -17, 2, D.dark); D.grips(5.2, -17.2); D.crank(0, -6, 1.4);
    return {seat:[-2, -16.2], bar:[7.2, -17.2], rear:[-10, -12.6], lamp:[8, -14.6]}; },
  penny(D){ const {P, col} = D; D.wheel(-11, 3, {t:.8}); D.wheel(5, 10, {t:1, n:5});
    P.curve(4, -19.6, -6, -18.6, -11, -4.8, 3, col); P.tube(5, -20.4, 5, -10, 2, D.dk); P.line(5, -20.4, 5, -21.6, 2, D.dark); P.line(2.8, -21.6, 8, -21.4, 2, D.dark); D.grips(3, -21.6); D.grips(7.8, -21.4);
    D.saddle(-2.2, -22, 4.6, 'brown'); P.ring(-.8, -20, .6, .5, '#9aa4af'); P.box(-7.6, -12.4, 1.6, .7, D.sil); D.crank(5, -10, 0, false);
    return {seat:[0, -22], bar:[5.4, -21.8], rear:[-10.2, -13], lamp:[6.6, -18]}; },
  folding(D){ const {P, col} = D; D.wheel(-7, 4); D.wheel(7, 4);
    D.chain(0, -4.4, -7, -4, .8); P.tube(-7, -4, 0, -4.4, 2, col); P.tube(-7, -4, -1, -6.6, 2, col); P.tube(0, -4.4, -1, -6.6, 3, col); P.tube(-1, -6.6, 5.6, -9.6, 4, col); P.disc(2.4, -8, .9, '#eceff1');
    P.tube(-1, -6.6, -1.6, -14.6, 2, D.sil); D.saddle(-4, -15.4, 5, 'comfy'); P.tube(5.6, -9.6, 5.2, -15.4, 2, D.sil); P.tube(5.6, -9.6, 7, -4, 2, D.sil); P.line(3.6, -15.8, 6.8, -15.8, 2, D.dark); D.grips(3.8, -15.8); D.crank(0, -4.4, 1.2);
    return {seat:[-1.6, -15.4], bar:[5.4, -15.8], rear:[-8, -9.6], lamp:[6.4, -12.2]}; },
  recumbent(D){ const {P, col} = D; D.wheel(-10, 5); D.wheel(10, 4);
    P.line(12.6, -8.6, -10, -5.9, 1, '#4a4f5c'); P.tube(-10, -5, -4, -6.8, 2, col); P.tube(-6, -6.8, 12.6, -8.4, 3, col); P.tube(9.6, -8, 10, -4, 2, D.sil); P.tube(-10, -5, -9.6, -12, 2, col);
    P.line(-8, -7.6, -2.6, -7.6, 3, '#30343f'); P.line(-8.6, -7.6, -11.4, -14.4, 3, '#30343f'); P.hl(-8.6, -7.6, -11.4, -14.4, 3, '#30343f'); P.line(-2, -7, -1.2, -10.4, 2, D.dark); D.grips(-1, -10.8); D.crank(12.6, -8.6, 1.3);
    return {seat:[-5, -8], bar:[-1, -10.8], rear:[-12.4, -14.4], lamp:[13.2, -10.2]}; },
  tricycle(D){ const {P, col} = D; D.wheel(-6.4, 3.4, {tire:'#3a3a46', rim:'#9aa4af'}); D.wheel(-9.4, 3.4); D.wheel(8.6, 5);
    P.tube(-11, -5.6, -4.4, -5.6, 4, col); P.tube(-7, -5.6, 5.4, -11, 4, col); P.tube(5.6, -12.8, 8.6, -5, 2, D.sil); P.tube(5.2, -13.4, 5.8, -11, 3, col); P.tube(-1.4, -8.4, -2.2, -14.2, 3, col);
    D.saddle(-4.8, -15.4, 5.2, 'comfy'); P.line(5.4, -13.4, 5.8, -15.8, 2, D.dark); P.line(4, -16, 7.2, -15.8, 2, D.dark); D.grips(4.2, -16);
    P.box(-12.6, -10.2, 7, 3.6, '#c8a26a'); P.box(-12.6, -10.6, 7, .7, '#8d6e4a'); for(let c = 0; c < 6; c += 2) P.box(-12 + c, -10, .5, 3.2, '#9c7a46'); D.crank(8.6, -5, 0, false);
    return {seat:[-2.2, -15.4], bar:[6, -16], rear:[-12, -12], lamp:[7.4, -13.6]}; },
  chopper(D){ const {P, col} = D; D.wheel(-9, 5, {t:1.6}); D.wheel(12, 5);
    D.chain(-2, -5, -9, -5, .9); P.tube(-9, -5, -2, -5, 3, col); P.tube(-9, -5, -4, -11.6, 2, col); P.tube(-2, -5, -4, -12, 3, col); P.curve(-4, -11.6, 1, -12.6, 6, -10.4, 3, col); P.tube(-2, -5, 6.4, -8.6, 3, col);
    P.tube(5.8, -11.6, 6.4, -9.6, 3, col); P.tube(6.4, -9.6, 12, -5, 2, '#e0e6ec'); P.box(0, -12.4, 1, .6, '#ff7043'); P.box(1.4, -12.2, 1, .6, '#ffb300');
    P.line(5.8, -11.6, 7, -14, 2, D.dark); P.tube(7, -14, 8, -23, 2, '#e0e6ec'); P.line(8, -23, 11, -23.4, 2, D.grip);
    P.line(-8.4, -13.6, -1.4, -12.6, 3, '#1b1b1f'); P.hl(-8.4, -13.6, -1.4, -12.6, 3, '#1b1b1f'); P.tube(-8.4, -13.4, -9.4, -19, 2, '#e0e6ec'); P.line(-9.4, -19, -8, -19.4, 2, '#e0e6ec'); D.crank(-2, -5, 1.3);
    return {seat:[-4, -13.6], bar:[9.4, -23.4], rear:[-10.4, -12], lamp:[7, -12.6]}; },
  cruiser(D){ const {P, col} = D; D.wheel(-8.4, 5, {t:1.6, white:true}); D.wheel(8.4, 5, {t:1.6, white:true}); D.fender(-8.4, 5); D.fender(8.4, 5);
    P.tube(-8.4, -5, 0, -5.2, 3, col); P.tube(-8.4, -5, -1.8, -12, 2, col); P.tube(0, -5.2, -1.8, -13, 3, col); P.curve(-1.8, -12.6, 2.2, -14.8, 6.4, -12.6, 3, col); P.curve(0, -5.2, 3.6, -6, 6.6, -11, 3, col);
    P.tube(6.4, -12.8, 6.8, -11, 3, col); P.tube(6.8, -11, 8.4, -5, 2, D.sil); P.box(-6.4, -6.6, 7.4, 2.4, D.lt); P.box(-6.4, -6.6, 7.4, .5, v45mix(col, .6));
    D.saddle(-5, -15, 6, 'brown'); P.ring(-3.6, -12.8, .7, .5, '#9aa4af'); P.ring(-1.6, -12.8, .7, .5, '#9aa4af');
    P.line(6.4, -12.8, 6.8, -15, 2, D.sil); P.curve(6.8, -15, 5, -17.4, 2.6, -16.2, 2, D.sil); P.line(6.8, -15, 8.4, -15.4, 2, D.sil); D.grips(2.8, -16.2); D.crank(0, -5.2, 1.5);
    return {seat:[-2, -15], bar:[6.8, -16], rear:[-9.6, -11.4], lamp:[8.2, -13.2]}; }
};
V45_BIKES.default = V45_BIKES.kid;
const v45Design = bk => (bk && bk.design && V45_BIKES[bk.design]) ? bk.design : 'kid';

function v45BikeAcc(D, A, accs){
  const {P} = D, [bx, by] = A.bar, [rx, ry] = A.rear;
  if(accs.includes('carrier')){ P.box(rx - .6, ry + .2, 6.4, 1.2, '#5d4037'); P.box(rx - .6, ry + .2, 6.4, .5, '#8d6e63'); if(D.hubs[0]) P.line(rx + 1, ry + 1.2, D.hubs[0][0], D.hubs[0][1], 1, '#3e2723'); }
  if(accs.includes('flag')){ P.line(rx, ry + 3, rx, ry - 11, 1, '#e0e0e0'); P.px(rx, ry - 11.4, '#ffd23f'); }
  if(accs.includes('speaker')){ const [sx, sy] = A.seat; P.box(sx + 1.4, sy + 3.4, 2.6, 2, '#212121'); P.disc(sx + 2.7, sy + 4.4, .6, '#607d8b'); }
  if(accs.includes('basket') && !A.basket){ P.box(bx + .6, by + 1.6, 6, 4.4, '#c8a26a'); for(let r = 0; r < 3; r++) P.box(bx + .6, by + 2.2 + r*1.2, 6, .5, '#9c7a46'); P.box(bx + .6, by + 1.2, 6, .7, '#8d6e4a'); }
  if(accs.includes('light') && !A.lampBuilt){ const [lx, ly] = A.lamp; P.box(lx, ly, 1.8, 1.6, '#cfd8dc'); P.box(lx + .8, ly + .3, 1, 1, '#fff59d'); }
  if(accs.includes('bell')){ P.box(bx - 1.6, by - 1, 1.4, 1, '#ffd23f'); P.px(bx - 1.2, by - 1, '#fff8c4'); }
}
// sprite cache: design | colour | sprite accessories | wheel phase | glow hue
function v45BikeSprite(bk, col, accs, phase, gh){
  const sa = V45_SPRITE_ACC.filter(a => accs.includes(a)), dz = v45Design(bk), key = dz + '|' + col + '|' + sa.join(',') + '|' + phase + '|' + gh;
  let s = V45.cache.get(key); if(s) return s; if(V45.cache.size > 600) V45.cache.clear();
  const c = document.createElement('canvas'); c.width = V45.W*V45.K; c.height = V45.H*V45.K; const g = c.getContext('2d');
  const D = v45Kit(v45Painter(g, V45.K, V45.OX, V45.OY), col, phase*Math.PI/12, sa, gh), A = V45_BIKES[dz](D);
  v45BikeAcc(D, A, sa); v45Pixelize(g, c.width, c.height, V45.OUT);
  A.flag = [A.rear[0], A.rear[1] - 11]; s = {c, A}; V45.cache.set(key, s); return s;
}
function v45BikeCol(bk, accs){ return accs.includes('paint') ? v45hsl((Math.floor(realT*2) % 12)*30, 72, 56) : v45hex(v45rgb(v16BikeCol(bk))); }
// drop-in for drawFancyBike(x, y, bk, accs, spin): same origin (ground, between the wheels), returns anchors
function v45DrawBike(x, y, bk, accs, spin, still){
  accs = accs || []; bk = bk || ITEM.bike1;
  const per = Math.PI/3, ph = Math.floor(((((spin || 0) % per) + per) % per)/per*4) % 4, gh = accs.includes('glow') ? Math.floor(realT*6) % 12 : -1;
  const s = v45BikeSprite(bk, v45BikeCol(bk, accs), accs, ph, gh), A = s.A;
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(s.c, x - V45.OX, y - V45.OY, V45.W, V45.H); ctx.imageSmoothingEnabled = sm;
  if(accs.includes('flag')){ const fx = x + A.flag[0], fy = y + A.flag[1], w = Math.sin(realT*8); ctx.fillStyle = V45.OUT; ctx.beginPath(); ctx.moveTo(fx, fy - .5); ctx.lineTo(fx - 7, fy + 1.5 + w); ctx.lineTo(fx, fy + 4.5); ctx.fill();
    ctx.fillStyle = '#ef4b4b'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 6, fy + 1.6 + w); ctx.lineTo(fx, fy + 3.8); ctx.fill(); rect('#ffd23f', fx - 2.5, fy + 1.4 + w*.5, 1, 1); }
  if(!still && accs.includes('light') && typeof SKYST !== 'undefined' && SKYST && SKYST.night > .3){ const lx = x + A.lamp[0] + 1.8, ly = y + A.lamp[1] + .8; ctx.fillStyle = 'rgba(255,245,157,.22)'; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 40, ly - 9); ctx.lineTo(lx + 40, ly + 15); ctx.closePath(); ctx.fill(); }
  if(accs.includes('speaker') && Math.floor(realT*4) % 2) rect('#26c6da', x + A.seat[0] + 2.4, y + A.seat[1] + 3.6, 1, 1);
  if(A.sparkle && Math.floor(realT*3) % 2) rect('#fff', x + A.sparkle[0], y + A.sparkle[1], 1, 1);
  return A;
}
// rider now sits on the saddle of each design (penny, recumbent, BMX…), not at one fixed height
function v45DrawCyclist(a){
  const bk = ITEM[(PROF && PROF.equip.bike) || 'bike1'], x = Math.round(a.x), y = Math.round(a.y), accs = bikeAccs();
  ctx.save(); ctx.translate(x, y); if(a.dir < 0) ctx.scale(-1, 1);
  const A = v45DrawBike(0, 0, bk, accs, a.walk*1.3);
  if(accs.includes('carrier') && PET && PET.ride){ ctx.save(); ctx.translate(A.rear[0] + 2.4, A.rear[1]); ctx.scale(.8, .8); drawPet(PET.kind, 0, 0, 1, realT*4, false); ctx.restore(); }
  ctx.translate(Math.round(Math.max(-5, Math.min(3, A.seat[0] + .5))), Math.round(Math.max(-15, Math.min(-6, A.seat[1] + 7))));
  const was = a.moving, wd = a.dir; a.moving = false; a.dir = 1; drawBody(a, false); a.moving = was; a.dir = wd;
  ctx.restore();
  if(accs.includes('speaker') && a.moving && Math.floor(realT*3) % 2){ ctx.fillStyle = '#ffd23f'; ctx.font = '10px monospace'; ctx.fillText('♪', x - 6, y - 40 - (realT*20 % 10)); }
}

// ---------- fishing gear: drawn fresh as pixel art ----------
function v45Fish(P, it){
  if(it.cat === 'rod'){ const c = {rod2:'#37474f', rod3:'#1565c0', rod4:'#ffc107'}[it.id] || '#8d6e4a';
    P.line(15.4, -26, 17, -8, 1, '#e8eef4'); P.disc(17, -7.4, 1.2, '#ef4b4b'); P.box(16, -7.4, 2.2, 1.1, '#fafafa');
    P.tube(-12, -7, 15.4, -26, 2, c); P.tube(-19, -2, -11.6, -7.2, 4, '#c8a26a'); for(let i = 0; i < 3; i++) P.box(-17.4 + i*2.4, -3.6 - i*1.6, .6, 1.4, '#9c7a46');
    [[-4, -12.6], [3, -17.4], [9.4, -21.8]].forEach(([gx, gy]) => P.ring(gx, gy + .9, .7, .5, it.id === 'rod4' ? '#fff8e1' : '#cfd8dc'));
    P.disc(-9.6, -6.4, 2.3, '#b0bec5'); P.disc(-9.6, -6.4, 1.2, '#78909c'); P.line(-9.6, -6.4, -7.4, -4.4, 1, '#37474f'); P.box(-7.8, -4.6, 1, 1, '#212121'); return; }
  P.line(-14, -25, -6, -16, 1, '#e8eef4'); P.ring(-6, -14.8, 1.2, .5, '#cfd8dc');
  if(it.id === 'lure2'){ for(let i = 0; i < 6; i++){ const a = i*.42, cx = -2 + Math.cos(a)*7, cy = -12 + Math.sin(a)*6.4; P.disc(cx, cy, 2.6 - i*.25, i % 2 ? '#ff8a65' : '#ffab91'); }
    P.line(5, -12, 12, -19, 1, '#ff7043'); P.line(5, -12, 13, -15, 1, '#ff7043'); P.disc(-3.4, -9.6, .6, '#1b1b1f'); P.box(-5.4, -4.8, 3, 2, '#ff7043'); P.box(-6.6, -5.6, 1.4, 1.2, '#ff8a65'); }
  else if(it.id === 'lure3'){ P.disc(1, -10, 7.4, '#1b3a1b'); P.disc(1, -10, 5.4, '#33691e'); P.disc(-1, -10, 4, '#76ff03'); P.disc(4.4, -10, 3, '#64dd17'); P.box(-6.4, -11.4, 3, 3, '#76ff03'); P.disc(-2.4, -11, .7, '#1b1b1f'); P.box(1.4, -12.6, 2.4, .6, '#ccff90');
    P.line(1, -5, 1, -2.4, 1, '#cfd8dc'); P.ring(1, -2, 1, .5, '#cfd8dc'); }
  else { P.disc(-1, -15, 4.2, '#ab47bc'); P.box(-5.2, -15, 8.4, 6, '#ab47bc'); P.box(-4.4, -17.6, 2, 2.6, '#ce93d8'); P.disc(-2.6, -11.6, .7, '#fafafa'); P.disc(.6, -11.6, .7, '#fafafa'); P.px(-2.6, -11.6, '#1b1b1f'); P.px(.6, -11.6, '#1b1b1f');
    for(let i = 0; i < 5; i++) P.curve(-4.6 + i*2, -9.2, -5.6 + i*2.4, -5, -4 + i*1.6 + (i % 2 ? 1.4 : -1.4), -1.4, 2, i % 2 ? '#8e24aa' : '#ba68c8'); }
}

// ---------- one pixel pipeline for every shop item: draw -> hard alpha + outline -> trim ----------
function v45ItemSprite(it){
  const K = V45.K, cat = it.cat, box = cat === 'boat' || cat === 'bgear' ? [150, 96, 75, 66] : cat === 'outfit' || cat === 'hat' || ['face', 'wrist', 'neck', 'ear', 'back', 'aura'].includes(cat) ? [48, 64, 24, 56] : cat === 'pet' ? [40, 40, 20, 34] : [V45.W, V45.H, V45.OX, V45.OY];
  const c = document.createElement('canvas'); c.width = box[0]*K; c.height = box[1]*K; const g = c.getContext('2d');
  let outline = V45.OUT;
  if(cat === 'rod' || cat === 'lure') v45Fish(v45Painter(g, K, box[2], box[3]), it);
  else withCtx(g, () => { g.setTransform(K, 0, 0, K, box[2]*K, box[3]*K); g.imageSmoothingEnabled = false;
    if(cat === 'bike' || cat === 'bacc'){ outline = null; v45DrawBike(0, 0, cat === 'bike' ? it : ITEM.bike2, cat === 'bacc' ? [it.id] : [], .3, true); }
    else if(cat === 'chess') drawChessSet(it, v16BikeCol(it));
    else if(cat === 'pet') drawPet(it.id, 0, 0, 1, 0, false);
    else if(cat === 'boat' || cat === 'bgear') drawBoatModel(0, -4, cat === 'boat' ? it : ITEM.boat2, cat === 'bgear' ? [it.id] : [], 1);
    else { const f = Object.assign(lookFor(3), {style:Object.assign({}, PROF ? PROF.look : PRESETS[0].look)}); applyLook(f, f.style);
      if(cat === 'outfit'){ f.style.outfit = it.o; if(it.c) f.shirt = it.c; if(it.p) f.pants = it.p; if(it.skirt) f.skirt = true; } else if(cat === 'hat') f.style.hat = it.o; else f.style.acc = [it.o];
      f.dir = 1; f.moving = false; drawBody(f, false); } });
  const bb = v45Pixelize(g, c.width, c.height, outline);
  if(['hat', 'face', 'ear', 'neck'].includes(cat)) bb.y1 = bb.y0 + Math.round((bb.y1 - bb.y0)*.5); // portrait crop so small items read
  return {c, bb, crop:['hat', 'face', 'ear', 'neck'].includes(cat)};
}
// card picture: golden-ratio stage (ground line at 1 - 1/φ³ ≈ 0.854 of the height), item fitted by an integer scale
function v45Preview(cv, it){
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, tab = tabOf(it), [top, bot] = V45_STAGE[tab] || V45_STAGE.bike, base = Math.round(H*.854);
  c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  const lg = c.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, top); lg.addColorStop(1, bot); c.fillStyle = lg; c.fillRect(0, 0, W, H);
  const rg = c.createRadialGradient(W/2, H*.46, 4, W/2, H*.46, W*.52); rg.addColorStop(0, 'rgba(255,255,255,.16)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, base, W, H - base); c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, base, W, Math.max(1, Math.round(H/100)));
  let s; try { s = v45ItemSprite(it); } catch(e){ console.warn('v45 preview', it.id, e); return; }
  const {bb} = s, bw = bb.x1 - bb.x0 + 1, bh = bb.y1 - bb.y0 + 1, wide = tab === 'boat' || tab === 'bgear' || tab === 'fish';
  const tall = bh > bw*1.4, fit = Math.min(W*(wide ? .854 : .764)/bw, H*(tall ? .8 : .708)/bh, W/56), S = fit >= 4 ? Math.floor(fit) : fit >= 1 ? Math.floor(fit*2)/2 : fit, dw = Math.round(bw*S), dh = Math.round(bh*S), dx = Math.round((W - dw)/2), dy = base - dh + (s.crop ? 0 : Math.round(H*.02));
  if(!s.crop){ c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(W/2, base + Math.round(H*.02), dw*.42, Math.max(3, H*.03), 0, 0, Math.PI*2); c.fill(); }
  c.drawImage(s.c, bb.x0, bb.y0, bw, bh, dx, dy, dw, dh);
}

// ---------- golden-ratio product cards ----------
function v45Stat(it){
  if(it.cat === 'bike' || it.cat === 'boat'){ const lo = it.cat === 'bike' ? 200 : 170, hi = it.cat === 'bike' ? 440 : 420; return ['⚡', it.s, Math.round(Math.max(8, Math.min(100, (it.s - lo)/(hi - lo)*100)))]; }
  if(it.cat === 'rod') return ['💪', 'x' + it.t, Math.round(it.t/2.4*100)];
  return null;
}
function v45RenderShop(){
  const tabs = $('#shopTabs'); tabs.innerHTML = '';
  SHOP_TABS.forEach(([k, n]) => { const b = el('button', {type:'button'}); b.innerHTML = `<span class="v45ti" aria-hidden="true">${V45_TABICON[k] || ''}</span>`; b.appendChild(document.createTextNode(n)); b.setAttribute('aria-pressed', k === shopTab); b.onclick = () => { shopTab = k; renderShop(); }; tabs.appendChild(b); });
  $('#shopMoney').textContent = `💰 $${PROF.money.toLocaleString('vi')} · ⭐ Level ${PROF.level}`;
  const g = $('#shopGrid'); g.innerHTML = ''; g.classList.add('v45grid'); const todo = [];
  SHOP.filter(it => tabOf(it) === shopTab).forEach(it => {
    const own = has(it.id), lock = PROF.level < it.lvl, slot = equipSlot(it), eq = slot && PROF.equip[slot] === it.id;
    const c = el('div', {className:'scard v45c' + (lock ? ' lock' : '') + (eq ? ' eq' : '') + (own ? ' own' : '')});
    const fig = el('div', {className:'v45fig'}), cv = el('canvas', {width:324, height:200}); fig.appendChild(cv);
    const bd = el('span', {className:'v45badge' + (eq ? ' on' : own ? ' have' : lock ? ' lk' : '')}); bd.textContent = eq ? '✓ Đang dùng' : own ? '✓ Đã có' : lock ? `🔒 Lv ${it.lvl}` : `Lv ${it.lvl}`; fig.appendChild(bd); c.appendChild(fig);
    const info = el('div', {className:'v45info'}), t = el('div', {className:'sname'}); t.textContent = it.n; info.appendChild(t);
    const d = el('div', {className:'sdesc'}); d.textContent = it.d; d.title = 'Bấm để xem thêm'; d.onclick = () => d.classList.toggle('open'); info.appendChild(d);
    const st = v45Stat(it); if(st){ const r = el('div', {className:'v45stat'}); r.innerHTML = `<span>${st[0]} ${st[1]}</span><span class="v45bar"><i style="width:${st[2]}%"></i></span>`; info.appendChild(r); }
    c.appendChild(info);
    const b = el('button', {type:'button'});
    if(own){ if(slot){ b.textContent = eq ? 'Đang dùng · Tháo ra' : 'Trang bị'; b.onclick = () => { PROF.equip[slot] = eq ? null : it.id; afterEquip(); renderShop(); }; } else { b.textContent = 'Đã có (tự gắn)'; b.disabled = true; } }
    else if(lock){ b.textContent = `Mở khóa ở Level ${it.lvl}`; b.disabled = true; }
    else { b.textContent = `Mua $${it.price.toLocaleString('vi')}`; b.className = 'primary'; b.disabled = PROF.money < it.price; b.onclick = () => buy(it); }
    c.appendChild(b); g.appendChild(c); v16Card(c, cv, it); todo.push([cv, it]);
  });
  // size each canvas to its real on-screen pixels so the integer pixel scale stays sharp on every phone
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  todo.forEach(([cv, it]) => { const w = cv.parentNode.clientWidth; if(w > 0){ cv.width = Math.round(w*dpr); cv.height = Math.round(w*dpr/V45.PHI); } drawItemPreview(cv, it); });
}

function v45ShopInit(){
  drawFancyBike = v45DrawBike; drawCyclist = v45DrawCyclist; drawItemPreview = v45Preview; renderShop = v45RenderShop;
}
