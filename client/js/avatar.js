// Drawing helpers shared by Phaser (Graphics) and plain <canvas> previews.
const hexNum = h => parseInt(String(h || '#888888').replace('#', ''), 16);
function shadeHex(hex, k){ const n = hexNum(hex); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v)*k : v*(1 + k)))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); }
// adapter over Phaser.GameObjects.Graphics
function PG(g, ox, oy, sc){ ox = ox || 0; oy = oy || 0; sc = sc || 1; return {
  rect(c, x, y, w, h, a){ g.fillStyle(hexNum(c), a == null ? 1 : a); g.fillRect(ox + x*sc, oy + y*sc, w*sc, h*sc); },
  circ(c, x, y, r, a){ g.fillStyle(hexNum(c), a == null ? 1 : a); g.fillCircle(ox + x*sc, oy + y*sc, r*sc); },
  ell(c, x, y, rx, ry, a){ g.fillStyle(hexNum(c), a == null ? 1 : a); g.fillEllipse(ox + x*sc, oy + y*sc, rx*2*sc, ry*2*sc); },
  tri(c, x1, y1, x2, y2, x3, y3, a){ g.fillStyle(hexNum(c), a == null ? 1 : a); g.fillTriangle(ox + x1*sc, oy + y1*sc, ox + x2*sc, oy + y2*sc, ox + x3*sc, oy + y3*sc); },
  line(c, x1, y1, x2, y2, w){ g.lineStyle((w || 1)*sc, hexNum(c), 1); g.lineBetween(ox + x1*sc, oy + y1*sc, ox + x2*sc, oy + y2*sc); },
  ring(c, x, y, r, w){ g.lineStyle((w || 1)*sc, hexNum(c), 1); g.strokeCircle(ox + x*sc, oy + y*sc, r*sc); }
}; }
// adapter over CanvasRenderingContext2D
function CG(c, ox, oy, sc){ ox = ox || 0; oy = oy || 0; sc = sc || 1; const fill = (col, a) => { c.globalAlpha = a == null ? 1 : a; c.fillStyle = col; }; return {
  rect(col, x, y, w, h, a){ fill(col, a); c.fillRect(ox + x*sc, oy + y*sc, w*sc, h*sc); c.globalAlpha = 1; },
  circ(col, x, y, r, a){ fill(col, a); c.beginPath(); c.arc(ox + x*sc, oy + y*sc, r*sc, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; },
  ell(col, x, y, rx, ry, a){ fill(col, a); c.beginPath(); c.ellipse(ox + x*sc, oy + y*sc, rx*sc, ry*sc, 0, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; },
  tri(col, x1, y1, x2, y2, x3, y3, a){ fill(col, a); c.beginPath(); c.moveTo(ox + x1*sc, oy + y1*sc); c.lineTo(ox + x2*sc, oy + y2*sc); c.lineTo(ox + x3*sc, oy + y3*sc); c.closePath(); c.fill(); c.globalAlpha = 1; },
  line(col, x1, y1, x2, y2, w){ c.strokeStyle = col; c.lineWidth = (w || 1)*sc; c.beginPath(); c.moveTo(ox + x1*sc, oy + y1*sc); c.lineTo(ox + x2*sc, oy + y2*sc); c.stroke(); },
  ring(col, x, y, r, w){ c.strokeStyle = col; c.lineWidth = (w || 1)*sc; c.beginPath(); c.arc(ox + x*sc, oy + y*sc, r*sc, 0, Math.PI*2); c.stroke(); }
}; }
// ---------- bikes: every design has its own silhouette; colour is the buyer's pick ----------
function drawBike(d, design, col, spin){
  const W = (x, y, r, t) => { d.ring('#222', x, y, r, t || 2); for(let k=0;k<4;k++){ const a = spin + k*Math.PI/4; d.line('#9e9e9e', x + Math.cos(a)*r*.85, y + Math.sin(a)*r*.85, x - Math.cos(a)*r*.85, y - Math.sin(a)*r*.85, .6); } d.circ('#555', x, y, 1.2); };
  switch(design){
    case 'mtb': W(-11, -7, 7, 3.4); W(11, -7, 7, 3.4); d.line(col, -11, -7, -1, -17, 2.6); d.line(col, -1, -17, 9, -17, 2.6); d.line(col, 9, -17, 11, -7, 2.6); d.line(col, -1, -17, 0, -7, 2.6); d.line(col, 0, -7, -11, -7, 2.6); d.rect('#333', 6, -21, 2, 5); d.rect('#222', 3, -22, 9, 2); d.rect('#222', -4, -20, 7, 2); d.rect('#ffd23f', 9, -15, 3, 4); break;
    case 'road': W(-11, -7, 7, 1.4); W(11, -7, 7, 1.4); d.line(col, -11, -7, -2, -18, 1.6); d.line(col, -2, -18, 9, -18, 1.6); d.line(col, 9, -18, 11, -7, 1.6); d.line(col, -2, -18, -1, -7, 1.6); d.line(col, -1, -7, -11, -7, 1.6); d.rect('#111', -5, -20, 6, 1.5); d.line('#111', 9, -18, 12, -20, 1.4); d.line('#111', 12, -20, 13, -16, 1.4); break;
    case 'bmx': W(-8, -5, 5, 2.4); W(8, -5, 5, 2.4); d.line(col, -8, -5, -1, -12, 2.4); d.line(col, -1, -12, 6, -12, 2.4); d.line(col, 6, -12, 8, -5, 2.4); d.line(col, -1, -12, 0, -5, 2.4); d.rect('#333', 5, -17, 2, 6); d.rect('#222', 1, -18, 10, 2); d.rect('#9e9e9e', -11, -6, 3, 2); d.rect('#9e9e9e', 9, -6, 3, 2); break;
    case 'tandem': W(-17, -7, 6.5); W(17, -7, 6.5); d.line(col, -17, -7, -9, -16, 2); d.line(col, -9, -16, 11, -16, 2); d.line(col, 11, -16, 17, -7, 2); d.line(col, -9, -16, -7, -7, 2); d.line(col, 3, -16, 4, -7, 2); d.line(col, -7, -7, 4, -7, 2); d.rect('#222', -12, -19, 6, 2); d.rect('#222', 0, -19, 6, 2); d.rect('#333', 13, -20, 2, 4); break;
    case 'cargo': W(-13, -7, 6.5); W(14, -6, 5); d.line(col, -13, -7, -5, -16, 2); d.line(col, -5, -16, 4, -16, 2); d.line(col, 4, -16, 14, -6, 2); d.line(col, -5, -16, -4, -7, 2); d.line(col, -4, -7, -13, -7, 2); d.rect('#8d6e4a', 5, -15, 13, 8); d.rect('#a1887f', 5, -15, 13, 2); d.rect('#222', -8, -19, 6, 2); break;
    case 'fat': W(-11, -8, 7.5, 4.6); W(11, -8, 7.5, 4.6); d.line(col, -11, -8, -1, -18, 2.4); d.line(col, -1, -18, 9, -18, 2.4); d.line(col, 9, -18, 11, -8, 2.4); d.line(col, -1, -18, 0, -8, 2.4); d.line(col, 0, -8, -11, -8, 2.4); d.rect('#222', -4, -21, 7, 2); d.rect('#333', 8, -22, 2, 5); d.rect('#222', 5, -23, 8, 2); break;
    case 'penny': W(7, -13, 13, 1.6); W(-13, -4, 3.5, 1.4); d.line(col, -13, -4, -2, -24, 2); d.line(col, -2, -24, 7, -25, 2); d.rect('#5d4037', -4, -27, 6, 2); d.rect('#5d4037', 4, -29, 7, 2); break;
    default: W(-10, -7, 7); W(10, -7, 7); d.line(col, -10, -7, -2, -12, 2); d.line(col, -2, -12, 3, -7, 2); d.line(col, -2, -12, 7, -17, 2); d.line(col, 7, -17, 10, -7, 2); d.rect('#5d4037', -5, -17, 6, 2); d.rect('#333', 6, -21, 2, 4); d.rect('#c8a26a', 9, -19, 7, 6); d.rect('#8d6e4a', 9, -19, 7, 1);
  }
}
const bikeOf = key => { if(!key) return null; const [id, col] = String(key).split('|'); const it = SHARED.CATALOG.find(c => c.id === id); return it ? {design:it.design, col:col || '#3d7bff'} : null; };
function drawHat(d, key, by){ if(!key) return; const [id, col] = String(key).split('|'); const c = col || '#ef4b4b';
  if(id === 'hat_cap'){ d.rect(c, -6, -36 + by, 12, 4); d.rect(shadeHex(c, -.25), 2, -33 + by, 8, 2); }
  else if(id === 'hat_straw'){ d.tri('#e8d48a', -11, -32 + by, 11, -32 + by, 0, -44 + by); d.line('#b89a4a', -11, -32 + by, 11, -32 + by, 1); d.line(c, -5, -36 + by, 5, -36 + by, 1); }
  else if(id === 'hat_crown'){ d.rect(c, -6, -38 + by, 12, 4); d.tri(c, -6, -38 + by, -2, -38 + by, -4, -42 + by); d.tri(c, -2, -38 + by, 2, -38 + by, 0, -43 + by); d.tri(c, 2, -38 + by, 6, -38 + by, 4, -42 + by); d.rect('#e53935', -1, -37 + by, 2, 2); } }
// ---------- character ----------
function drawAvatar(d, st, opt){
  opt = opt || {}; const dir = opt.dir < 0 ? -1 : 1, ph = opt.phase || 0, mv = !!opt.moving, ride = opt.ride ? bikeOf(opt.ride) : null;
  d.ell('#000000', 0, 0, 10, 3, .22);
  let by = 0;
  if(ride){ drawBike(d, ride.design, ride.col, ph*1.5); by = ride.design === 'penny' ? -18 : ride.design === 'bmx' ? -6 : -9; }
  const lg = mv && !ride ? Math.round(Math.sin(ph)*2) : 0;
  if(!ride){ d.rect(st.pants, -5, -10, 4, 9 + lg); d.rect(st.pants, 1, -10, 4, 9 - lg); d.rect('#222', -5, -2 + lg, 4, 2); d.rect('#222', 1, -2 - lg, 4, 2); }
  else { d.rect(st.pants, -5, -12 + by + 3, 10, 5); }
  d.rect(st.shirt, -6, -21 + by, 12, 12); d.rect(shadeHex(st.shirt, -.25), -6, -11 + by, 12, 2);
  const arm = mv ? Math.sin(ph)*2 : 0; d.rect(st.skin, -8, -20 + by + arm, 2, 8); d.rect(st.skin, 6, -20 + by - arm, 2, 8);
  d.rect(st.skin, -5, -31 + by, 10, 10); d.rect(st.hair, -6, -33 + by, 12, 4);
  if(st.hairStyle === 'long'){ d.rect(st.hair, -6, -31 + by, 2, 11); d.rect(st.hair, 4, -31 + by, 2, 11); }
  else if(st.hairStyle === 'bun') d.circ(st.hair, 0, -36 + by, 3);
  else if(st.hairStyle === 'spiky'){ for(let k=0;k<4;k++) d.tri(st.hair, -6 + k*3.5, -32 + by, -3 + k*3.5, -32 + by, -4.5 + k*3.5, -37 + by); }
  else if(st.hairStyle === 'pony'){ d.rect(st.hair, dir > 0 ? -9 : 7, -31 + by, 3, 9); }
  else d.rect(st.hair, dir > 0 ? -6 : 4, -31 + by, 2, 4);
  d.rect('#1a1a1a', dir > 0 ? 0 : -3, -27 + by, 2, 2); d.rect('#1a1a1a', dir > 0 ? 3 : 0, -27 + by, 2, 2); d.rect('#c97a6a', dir > 0 ? 1 : -2, -23 + by, 3, 1);
  if(opt.hat) drawHat(d, opt.hat, by);
}
const LOOKS = [
  {n:'Học sinh', s:{skin:'#f2c9a0', hair:'#2a1a12', shirt:'#f7f7f7', pants:'#24356b', hairStyle:'short'}}, {n:'Thể thao', s:{skin:'#eab98c', hair:'#1a1a1a', shirt:'#ef4b4b', pants:'#222222', hairStyle:'spiky'}},
  {n:'Nghệ sĩ', s:{skin:'#f5d1ad', hair:'#ec407a', shirt:'#ffd23f', pants:'#455a64', hairStyle:'bun'}}, {n:'Mọt sách', s:{skin:'#f2c9a0', hair:'#6d4c2e', shirt:'#2fbf71', pants:'#5a3a1e', hairStyle:'short'}},
  {n:'Năng động', s:{skin:'#eab98c', hair:'#c58c4a', shirt:'#ff6f91', pants:'#24356b', hairStyle:'pony'}}, {n:'Hip-hop', s:{skin:'#9c6644', hair:'#111111', shirt:'#222222', pants:'#455a64', hairStyle:'spiky'}},
  {n:'Công chúa', s:{skin:'#f5d1ad', hair:'#e8c46a', shirt:'#b06bff', pants:'#7b1fa2', hairStyle:'long'}}, {n:'Thám hiểm', s:{skin:'#c98e60', hair:'#3a2418', shirt:'#c58c4a', pants:'#5a3a1e', hairStyle:'short'}}
];
