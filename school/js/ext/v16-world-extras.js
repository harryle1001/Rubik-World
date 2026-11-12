// ================= EXT21 (v16): missile base, living sky, cage-free farm + sheepdog, house interiors, unique bikes + colour pick,
// chess sets & challenges, Ikigai chess park, garden plots for sale, telescope of the solar system =================
const V16 = {birds:[], clouds:[], sats:[], sheep:[], dog:null, herdT:0, t:0};
const V16_BASE = {silo:[1460, 846], navy:[1560, 968]};
const V16_PARK = {x:7800, y:-505, w:390, h:450};
const V16_GARDEN_GATE = [4990, -96];
const V16_SCOPE = () => [R.botanic.x + R.botanic.w - 120, R.botanic.y + R.botanic.h + 8];
const v16rnd = (a, b) => a + Math.random()*(b - a);
if(location.protocol === 'file:' || location.hostname === 'localhost') window.__dbg = c => eval(c);

// ---------- unique bikes: every design has its own silhouette, colour is the buyer's choice ----------
const V16_BIKES = [
  {id:'bike6',  n:'Xe BMX biểu diễn',          price:220, lvl:2, s:290, col:'#ff6f91', design:'bmx',      d:'Khung thấp, bánh nhỏ, nhảy bậc thang.'},
  {id:'bike7',  n:'Xe đạp đôi tandem',         price:300, lvl:3, s:300, col:'#2fbf71', design:'tandem',   d:'Hai yên, hai bàn đạp, đi cùng bạn thân.'},
  {id:'bike8',  n:'Xe chở hàng có thùng',      price:320, lvl:3, s:260, col:'#ff8a2b', design:'cargo',    d:'Thùng gỗ phía trước chở sách và hoa.'},
  {id:'bike9',  n:'Xe bánh béo đi cát',        price:420, lvl:4, s:300, col:'#7e57c2', design:'fat',      d:'Lốp siêu to, chạy trên cát và tuyết.'},
  {id:'bike10', n:'Xe bánh lớn cổ (penny)',    price:560, lvl:5, s:310, col:'#8d6e4a', design:'penny',    d:'Bánh trước khổng lồ từ thế kỷ 19.'},
  {id:'bike11', n:'Xe đạp gấp',                price:260, lvl:2, s:270, col:'#26c6da', design:'folding',  d:'Gấp gọn mang lên tàu điện.'},
  {id:'bike12', n:'Xe đạp nằm',                price:640, lvl:6, s:360, col:'#ef4b4b', design:'recumbent',d:'Ngả lưng mà đạp, khí động học.'},
  {id:'bike13', n:'Xe ba bánh',                price:180, lvl:1, s:220, col:'#ffd23f', design:'tricycle', d:'Vững vàng cho bạn nhỏ mới tập.'},
  {id:'bike14', n:'Xe chopper tay lái cao',    price:880, lvl:7, s:370, col:'#212121', design:'chopper',  d:'Càng trước dài, tay lái cao chất ngầu.'},
  {id:'bike15', n:'Xe cruiser đi biển',        price:380, lvl:3, s:280, col:'#80deea', design:'cruiser',  d:'Khung cong mềm mại, dạo bờ biển.'}
];
const V16_CHESS = [
  {id:'chess1', cat:'chess', n:'Bộ cờ vua gỗ', price:120, lvl:1, col:'#8d6e4a', design:'wood', d:'Mang theo để thách đấu bất kỳ ai, ở bất cứ đâu.'},
  {id:'chess2', cat:'chess', n:'Bộ cờ du lịch nam châm', price:90, lvl:1, col:'#3d7bff', design:'travel', d:'Gấp gọn, quân hút nam châm không rơi.'},
  {id:'chess3', cat:'chess', n:'Bộ cờ đá cẩm thạch', price:420, lvl:3, col:'#eceff1', design:'marble', d:'Bàn đá mát lạnh, quân nặng tay.'},
  {id:'chess4', cat:'chess', n:'Bộ cờ pha lê', price:900, lvl:5, col:'#b3e5fc', design:'glass', d:'Quân cờ trong suốt lấp lánh ánh sáng.'}
];
function v16BikeCol(bk){ return (PROF && PROF.colors && PROF.colors[bk.id]) || bk._pick || bk.col; }
function v16Frame(x, y, bk, col, spin, glow){
  const L = (x1, y1, x2, y2, w, c) => { ctx.strokeStyle = c || col; ctx.lineWidth = w || 2; ctx.beginPath(); ctx.moveTo(x + x1, y + y1); ctx.lineTo(x + x2, y + y2); ctx.stroke(); };
  const Wh = (cx, cy, r, t) => { ctx.strokeStyle = glow ? `hsl(${(realT*200 + cx*10) % 360},90%,60%)` : '#222'; ctx.lineWidth = t || 2; ctx.beginPath(); ctx.arc(x + cx, y + cy, r, 0, Math.PI*2); ctx.stroke(); ctx.strokeStyle = '#999'; ctx.lineWidth = .6; for(let k=0;k<3;k++){ const a = spin + k*Math.PI/3; ctx.beginPath(); ctx.moveTo(x + cx + Math.cos(a)*r*.85, y + cy + Math.sin(a)*r*.85); ctx.lineTo(x + cx - Math.cos(a)*r*.85, y + cy - Math.sin(a)*r*.85); ctx.stroke(); } };
  const seat = (sx, sy) => rect('#222', x + sx, y + sy, 6, 2), bar = (bx, by) => { rect('#222', x + bx, y + by, 2, 4); rect('#333', x + bx - 2, y + by - 1, 6, 2); };
  switch(bk.design){
    case 'bmx': Wh(-7, -4, 4, 2.2); Wh(7, -4, 4, 2.2); L(-7, -4, -1, -9, 2.4); L(-1, -9, 6, -9, 2.4); L(6, -9, 7, -4, 2.4); L(-1, -9, 0, -4, 2.4); L(0, -4, -7, -4, 2.4); seat(-4, -11); bar(5, -14); rect('#9e9e9e', x + 8, y - 5, 3, 1); break;
    case 'tandem': Wh(-13, -5, 5); Wh(13, -5, 5); L(-13, -5, -7, -12); L(-7, -12, 8, -12); L(8, -12, 13, -5); L(-7, -12, -6, -5); L(2, -12, 3, -5); L(-6, -5, 3, -5); seat(-10, -15); seat(-1, -15); bar(7, -16); break;
    case 'cargo': Wh(-10, -5, 5); Wh(11, -4, 4); L(-10, -5, -4, -12); L(-4, -12, 3, -12); L(3, -12, 11, -4); L(-4, -12, -3, -5); L(-3, -5, -10, -5); rect('#8d6e4a', x + 4, y - 12, 11, 7); rect('#a1887f', x + 4, y - 12, 11, 2); seat(-7, -15); bar(2, -16); break;
    case 'fat': Wh(-8, -6, 6, 4); Wh(8, -6, 6, 4); L(-8, -6, -1, -13, 2.6); L(-1, -13, 6, -13, 2.6); L(6, -13, 8, -6, 2.6); L(-1, -13, 0, -6, 2.6); L(0, -6, -8, -6, 2.6); seat(-4, -16); bar(5, -17); break;
    case 'penny': Wh(5, -10, 10, 1.6); Wh(-11, -3, 3, 1.4); L(-11, -3, -2, -19); L(-2, -19, 5, -20); rect('#5d4037', x - 4, y - 22, 6, 2); rect('#5d4037', x + 3, y - 24, 6, 2); break;
    case 'folding': Wh(-7, -4, 4); Wh(7, -4, 4); L(-7, -4, 0, -7, 2.4); L(0, -7, 7, -4, 2.4); L(0, -7, -1, -14, 1.6); L(6, -4, 5, -15, 1.6); circ(x, y - 7, 1.6, '#eceff1'); seat(-4, -16); rect('#333', x + 3, y - 16, 5, 2); break;
    case 'recumbent': Wh(-10, -5, 5); Wh(10, -4, 4); L(-10, -5, 10, -6, 2.2); L(-6, -6, -9, -13, 2); rect('#212121', x - 11, y - 14, 4, 8); L(10, -6, 13, -9, 2); rect('#333', x + 12, y - 10, 2, 2); break;
    case 'tricycle': Wh(9, -5, 5); Wh(-9, -3, 3.4); Wh(-5, -3, 3.4); L(-7, -3, 0, -10); L(0, -10, 9, -5); L(0, -10, -2, -14); seat(-5, -16); bar(7, -15); rect(col, x - 11, y - 6, 8, 2); break;
    case 'chopper': Wh(-9, -5, 5); Wh(12, -5, 5); L(-9, -5, -2, -10); L(-2, -10, 6, -9); L(6, -9, 12, -5); L(6, -9, 9, -22, 1.6); rect('#cfd8dc', x + 6, y - 24, 6, 2); rect('#212121', x - 6, y - 12, 8, 3); rect('#ff7043', x - 5, y - 8, 4, 2); break;
    case 'cruiser': Wh(-8, -5, 5, 2.6); Wh(8, -5, 5, 2.6); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 8, y - 5); ctx.quadraticCurveTo(x - 4, y - 16, x + 6, y - 13); ctx.lineTo(x + 8, y - 5); ctx.moveTo(x - 4, y - 12); ctx.quadraticCurveTo(x, y - 4, x - 8, y - 5); ctx.stroke(); rect('#8d6e4a', x - 6, y - 15, 7, 2); ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 6, y - 13); ctx.quadraticCurveTo(x + 9, y - 19, x + 3, y - 18); ctx.stroke(); break;
    case 'mtb': Wh(-8, -5, 5.4, 3); Wh(8, -5, 5.4, 3); L(-8, -5, -1, -13, 2.6); L(-1, -13, 6, -12, 2.6); L(6, -12, 8, -5, 2.6); L(-1, -13, 0, -5, 2.6); L(0, -5, -8, -5, 2.6); rect('#9e9e9e', x + 5, y - 11, 2, 5); seat(-4, -16); rect('#333', x + 3, y - 17, 8, 2); break;
    case 'road': Wh(-8, -5, 5, 1.2); Wh(8, -5, 5, 1.2); L(-8, -5, -1, -13, 1.6); L(-1, -13, 7, -13, 1.6); L(7, -13, 8, -5, 1.6); L(-1, -13, 0, -5, 1.6); L(0, -5, -8, -5, 1.6); rect('#111', x - 4, y - 15, 5, 1.4); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + 9, y - 12, 2.6, -Math.PI/2, Math.PI/2); ctx.stroke(); break;
    case 'ebike': Wh(-8, -5, 5); Wh(8, -5, 5); L(-8, -5, -1, -12); L(-1, -12, 6, -12); L(6, -12, 8, -5); L(-1, -12, 0, -5); L(0, -5, -8, -5); rect('#37474f', x - 5, y - 11, 5, 4); rect('#76ff03', x - 4, y - 10, Math.floor(realT*2) % 3 + 1, 2); seat(-4, -15); bar(5, -16); rect('#fff59d', x + 8, y - 14, 2, 2); break;
    case 'royal': Wh(-8, -5, 5, 2.4); Wh(8, -5, 5, 2.4); L(-8, -5, -1, -12, 2.6); L(-1, -12, 6, -12, 2.6); L(6, -12, 8, -5, 2.6); L(-1, -12, 0, -5, 2.6); L(0, -5, -8, -5, 2.6); rect('#b71c1c', x - 5, y - 15, 7, 3); bar(5, -16); circ(x, y - 5, 2, '#fff8e1'); if(Math.floor(realT*3) % 2) rect('#fff', x - 9, y - 14, 1, 1); break;
    default: Wh(-8, -5, 5); Wh(8, -5, 5); L(-8, -5, -1, -12); L(-1, -12, 6, -12); L(6, -12, 8, -5); L(-1, -12, 0, -5); L(0, -5, -8, -5); seat(-4, -15); bar(5, -16);
  }
}
// shop card extras: colour picked directly on the product, preview repaints live
function v16Card(card, cv, it){
  if(it.cat !== 'bike' && it.cat !== 'chess') return;
  const own = has(it.id), cur = (PROF.colors && PROF.colors[it.id]) || it._pick || it.col;
  const lab = el('label', {className:'v16col'}); lab.textContent = own ? 'Đổi màu: ' : 'Chọn màu: ';
  const inp = el('input', {type:'color', value:cur}); inp.setAttribute('aria-label', 'Màu cho ' + it.n);
  inp.oninput = () => { it._pick = inp.value; if(own){ PROF.colors = PROF.colors || {}; PROF.colors[it.id] = inp.value; saveProfile(); } drawItemPreview(cv, it); };
  lab.appendChild(inp); card.insertBefore(lab, card.querySelector('button'));
}
function v16Bought(it){ if(it._pick){ PROF.colors = PROF.colors || {}; PROF.colors[it.id] = it._pick; } if(it.cat === 'chess') setTimeout(v16ChalBtn, 50); }
function drawChessSet(it, col){
  const glass = it.design === 'glass', marble = it.design === 'marble';
  for(let a=0;a<6;a++) for(let b=0;b<3;b++){ ctx.globalAlpha = glass ? .75 : 1; rect((a + b) % 2 ? (glass ? '#4fc3f7' : marble ? '#9e9e9e' : it.design === 'travel' ? '#1565c0' : '#6d4c2e') : (glass ? '#e1f5fe' : marble ? '#fafafa' : '#e8d4b0'), -18 + a*6, -18 + b*6, 6, 6); }
  ctx.globalAlpha = 1; rect(col, -14, -26, 3, 7); circ(-12.5, -27, 2, col); rect(col, -8, -24, 4, 5); tri(-8, -24, -4, -24, -6, -28, col);
  const dark = '#263238'; rect(dark, 9, -26, 3, 7); circ(10.5, -27, 2, dark); rect(dark, 3, -25, 4, 6);
}

// ---------- living sky over the map: whale & wave clouds, satellites, eagles, parrots ----------
function v16SkyInit(){
  V16.clouds = [0, 1, 2, 3].map(i => ({kind:['whale','wave','whale','puff'][i], x:0, y:0, v:v16rnd(14, 26), s:v16rnd(1.4, 2.4), ph:Math.random()*6, live:false}));
  const kinds = [['eagle','#5d4037'], ['parrot','#e53935'], ['parrot','#1e88e5'], ['parrot','#43a047'], ['parrot','#ffb300'], ['eagle','#6d4c41'], ['crane','#fafafa'], ['parrot','#ab47bc']];
  V16.birds = kinds.map(([kind, col]) => ({kind, col, x:0, y:0, v:0, ph:Math.random()*6, live:false}));
  V16.sats = [{x:0, y:0, v:55, live:false}, {x:0, y:0, v:38, live:false}];
}
function v16Respawn(o, top, sp){ const dir = Math.random() < .5 ? 1 : -1; o.x = dir > 0 ? VB.x0 - 200 : VB.x1 + 200; const y0 = Math.max(VB.y0 + 40, top || -1e9); o.y = y0 < VB.y1 - 80 ? v16rnd(y0, VB.y1 - 80) : VB.y1 + 1000; o.v = Math.abs(o.v || sp)*dir; o.live = true; }
function drawV16Sky(dt){
  if(typeof FEED !== 'undefined' && FEED) return; if(!V16.clouds.length) v16SkyInit();
  const t = realT, night = SKYST ? SKYST.night : 0, out = o => o.x < VB.x0 - 420 || o.x > VB.x1 + 420 || o.y < VB.y0 - 300 || o.y > VB.y1 + 300;
  // clouds morph between puffy, wave and blue-whale shapes; drawn faint so the ground stays readable
  V16.clouds.forEach(c => {
    if(!c.live || out(c)) v16Respawn(c, -4300, c.v); c.x += c.v*dt;
    const s = c.s*(1 + .05*Math.sin(t*.3 + c.ph)), a = night > .4 ? .16 : .3, col = night > .4 ? '#9fa8da' : '#ffffff', dir = c.v < 0 ? -1 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, c.y); ctx.scale(dir, 1); ctx.fillStyle = col;
    const E = (x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x*s, y*s, rx*s, ry*s, 0, 0, Math.PI*2); ctx.fill(); };
    if(c.kind === 'whale'){ E(0, 0, 70, 22); E(52, -4, 28, 18); ctx.beginPath(); ctx.moveTo(-64*s, 0); ctx.lineTo(-104*s, (-24 + Math.sin(t*1.4)*8)*s); ctx.lineTo(-104*s, (18 + Math.sin(t*1.4)*8)*s); ctx.closePath(); ctx.fill(); E(10, 16, 18, 5);
      for(let k=0;k<3;k++){ ctx.globalAlpha = a*.8; E(36 + k*6, -30 - k*7 - Math.abs(Math.sin(t*2 + k))*6, 5 - k, 5 - k); } ctx.globalAlpha = a; ctx.fillStyle = night > .4 ? '#3949ab' : '#90caf9'; E(62, -8, 2.5, 2.5); }
    else if(c.kind === 'wave'){ for(let k=0;k<10;k++) E(k*16 - 80, Math.sin(t*1.2 + k*.8 + c.ph)*10, 13 + (k % 3)*3, 11 + (k % 3)*3); }
    else { [[0, 0, 28], [26, -8, 22], [-26, -4, 20], [48, 4, 16], [-48, 6, 15]].forEach(([x, y, r]) => E(x, y, r, r*.8)); }
    ctx.restore();
  });
  // satellites: visible mostly in the evening, blinking beacon
  V16.sats.forEach(st => { if(!st.live || out(st)) v16Respawn(st, -6700, st.v); st.x += st.v*dt; const a = .35 + night*.65; ctx.globalAlpha = a;
    rect('#cfd8dc', st.x - 3, st.y - 3, 6, 6); rect('#1565c0', st.x - 14, st.y - 2, 9, 4); rect('#1565c0', st.x + 5, st.y - 2, 9, 4); rect('#90caf9', st.x - 13, st.y - 1, 7, 1); rect('#90caf9', st.x + 6, st.y - 1, 7, 1);
    if(Math.floor(t*2) % 2) rect('#ff5252', st.x - 1, st.y - 6, 2, 2); ctx.globalAlpha = 1; });
  // birds: eagles soar slowly, parrots flap fast with bright wings
  if(night > .6) return;
  V16.birds.forEach(b => { if(!b.live || out(b)) v16Respawn(b, -2800, b.kind === 'eagle' ? 45 : 85); b.x += b.v*dt; b.ph += dt*(b.kind === 'eagle' ? 2.5 : 10);
    const f = b.v < 0 ? -1 : 1, fl = Math.sin(b.ph)*(b.kind === 'eagle' ? 5 : 4), x = b.x, y = b.y + Math.sin(t + b.ph*.2)*8;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x + 30, y + 60, b.kind === 'eagle' ? 16 : 8, 3, 0, 0, Math.PI*2); ctx.fill();
    if(b.kind === 'eagle'){ ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(x, y, 10, 4, 0, 0, Math.PI*2); ctx.fill(); tri(x - 2, y, x - 30, y - 6 - fl, x + 2, y - 2, b.col); tri(x + 2, y, x + 30, y - 6 - fl, x - 2, y - 2, b.col); tri(x - 10*f, y, x - 18*f, y - 3, x - 18*f, y + 4, b.col); circ(x + 10*f, y - 2, 3.4, '#fafafa'); tri(x + 12*f, y - 3, x + 17*f, y - 1, x + 12*f, y + 1, '#ffb300'); }
    else if(b.kind === 'parrot'){ ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(x, y, 7, 4, 0, 0, Math.PI*2); ctx.fill(); tri(x - 2, y, x - 10, y - 8 - fl, x + 3, y - 1, '#ffd23f'); tri(x - 2, y, x - 8, y - 5 - fl, x + 2, y - 1, '#1e88e5'); tri(x - 6*f, y, x - 20*f, y + 3, x - 6*f, y + 4, b.col); tri(x - 6*f, y + 1, x - 18*f, y + 6, x - 6*f, y + 4, '#ffd23f'); circ(x + 6*f, y - 2, 2, '#fff'); rect('#222', x + 6*f, y - 2, 1, 1); }
    else { ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(x, y, 9, 3, 0, 0, Math.PI*2); ctx.fill(); tri(x, y, x - 16, y - 9 - fl, x + 6, y, b.col); ctx.strokeStyle = '#424242'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 8*f, y - 1); ctx.lineTo(x + 18*f, y - 4); ctx.stroke(); circ(x + 18*f, y - 5, 1.8, '#e53935'); }
  });
}

// ---------- world sprites: navy base + underground silo hatch, Ikigai chess park, sheep flock + sheepdog, garden gate, telescope ----------
function v16Sprites(sp){
  const [hx, hy] = V16_BASE.silo, [nx, ny] = V16_BASE.navy;
  if(inVB(hx, hy)) sp.push({y:hy - 30, f:() => { rect('#546e7a', hx - 46, hy - 16, 92, 32); rect('#37474f', hx - 40, hy - 12, 38, 24); rect('#37474f', hx + 2, hy - 12, 38, 24); for(let k=0;k<6;k++) rect(k % 2 ? '#ffd23f' : '#212121', hx - 46 + k*16, hy + 16, 16, 4); plate('HẦM TÊN LỬA NGẦM', hx, hy - 24); }});
  if(inVB(nx, ny)) sp.push({y:ny, f:() => { const bob = Math.sin(realT*1.5)*2; ctx.save(); ctx.translate(nx, ny + bob); tri(-90, 0, 90, 0, 74, 18, '#546e7a'); rect('#607d8b', -84, -10, 168, 12); rect('#78909c', -30, -34, 54, 24); rect('#90a4ae', -14, -52, 18, 18); rect('#37474f', 30, -18, 40, 6); rect('#b0bec5', -2, -66, 2, 14); if(Math.floor(realT*2) % 2) rect('#ff5252', -3, -68, 4, 3);
    rect('#c62828', -78, -14, 10, 4); ctx.restore(); plate('TÀU HẢI QUÂN · E ĐỂ LÊN TÀU', nx, ny - 78); }});
  const P = V16_PARK;
  if(VB.x1 > P.x && VB.x0 < P.x + P.w && VB.y1 > P.y && VB.y0 < P.y + P.h){
    sp.push({y:P.y - 2000, f:v16DrawPark});
    v16Tables().forEach(([x, y]) => sp.push({y, f:() => { rect('#6d4c2e', x - 30, y - 18, 60, 30); for(let a=0;a<6;a++) for(let b=0;b<3;b++) rect((a + b) % 2 ? '#739552' : '#ebecd0', x - 24 + a*8, y - 16 + b*8, 8, 8); rect('#5d4037', x - 46, y - 8, 12, 12); rect('#5d4037', x + 34, y - 8, 12, 12); }}));
  }
  V16.sheep.forEach(s => { if(inVB(s.x, s.y)) sp.push({y:s.y, f:() => v16Sheep(s)}); });
  if(V16.dog && inVB(V16.dog.x, V16.dog.y)) sp.push({y:V16.dog.y, f:() => v16Dog(V16.dog)});
  const [gx, gy] = V16_GARDEN_GATE; if(inVB(gx, gy)) sp.push({y:gy, f:() => { rect('#6d4c2e', gx - 40, gy - 34, 6, 34); rect('#6d4c2e', gx + 34, gy - 34, 6, 34); rect('#8d6e4a', gx - 44, gy - 44, 88, 12); for(let k=0;k<5;k++) circ(gx - 36 + k*18, gy - 46, 5, ['#ff6f91','#ffd23f','#fff','#ba68c8','#ff8a65'][k]); plate('KHU VƯỜN MỞ BÁN', gx, gy - 56); }});
  const [sx, sy] = V16_SCOPE(); if(inVB(sx, sy)) sp.push({y:sy, f:() => { rect('#455a64', sx - 2, sy - 26, 4, 26); ctx.save(); ctx.translate(sx, sy - 28); ctx.rotate(-.6); rect('#eceff1', -4, -16, 8, 26); rect('#263238', -5, -18, 10, 4); ctx.restore(); rect('#37474f', sx - 10, sy - 2, 20, 4); plate('KÍNH VIỄN VỌNG', sx, sy - 54); }});
}
const v16Tables = () => { const P = V16_PARK; return [[P.x + 70, P.y + 80], [P.x + P.w - 70, P.y + 80], [P.x + 70, P.y + P.h - 70], [P.x + P.w - 70, P.y + P.h - 70]]; };
function v16DrawPark(){
  const P = V16_PARK, cx = P.x + P.w/2, cy = P.y + P.h/2;
  rect(season === 'dong' ? '#e3ebee' : '#a5d16b', P.x, P.y, P.w, P.h); for(let k=0;k<60;k++) circ(P.x + (k*137) % P.w, P.y + (k*71) % P.h, 2, ['#fff176','#f8bbd0','#fff'][k % 3]);
  const C = [['#ff8a80', -70, -55, 'YÊU THÍCH'], ['#82b1ff', 70, -55, 'GIỎI'], ['#b9f6ca', -70, 55, 'THẾ GIỚI CẦN'], ['#ffe57f', 70, 55, 'ĐƯỢC TRẢ CÔNG']];
  const R0 = Math.min(P.w, P.h)*.27; C.forEach(([c, dx, dy]) => { ctx.globalAlpha = .45; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + Math.sign(dx)*R0*.55, cy + Math.sign(dy)*R0*.55, R0, 0, Math.PI*2); ctx.fill(); });
  ctx.globalAlpha = 1; ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#33691e'; ctx.textAlign = 'center';
  C.forEach(([, dx, dy, t]) => ctx.fillText(t, cx + Math.sign(dx)*R0*.95, cy + Math.sign(dy)*R0*1.25 + 4)); ctx.font = '18px Bungee, sans-serif'; ctx.fillStyle = '#1b5e20'; ctx.fillText('IKIGAI', cx, cy + 6); ctx.textAlign = 'left';
  for(let k=0;k<4;k++){ const x = P.x + 40 + k*100, y = P.y + 18; rect('#5d4037', x - 2, y, 4, 16); [[0, -8, 12], [-8, 0, 9], [8, 0, 9]].forEach(([a, b, r]) => circ(x + a, y + b, r, ['#f8bbd0','#f48fb1','#fce4ec'][(k + r) % 3])); }
  plate('CÔNG VIÊN CỜ IKIGAI', cx, P.y + P.h - 14);
}
function v16Sheep(s){ const x = s.x, y = s.y, f = s.vx < 0 ? -1 : 1, lg = Math.hypot(s.vx, s.vy) > 6 ? Math.sin(s.ph)*1.5 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 9, 3, 0, 0, Math.PI*2); ctx.fill();
  rect('#37474f', x - 6, y - 4 + lg, 2, 5); rect('#37474f', x + 4, y - 4 - lg, 2, 5); [[-5, -8], [0, -10], [5, -8], [-2, -5], [3, -5]].forEach(([a, b]) => circ(x + a, y + b, 4.6, season === 'dong' ? '#eceff1' : '#fafafa'));
  ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.ellipse(x + 9*f, y - 9, 3.4, 2.6, 0, 0, Math.PI*2); ctx.fill(); rect('#fff', x + 10*f, y - 10, 1, 1); }
function v16Dog(d){ const x = d.x, y = d.y, f = d.vx < 0 ? -1 : 1, lg = Math.sin(d.ph)*1.6;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 9, 3, 0, 0, Math.PI*2); ctx.fill();
  rect('#3e2723', x - 6, y - 4 + lg, 2, 5); rect('#3e2723', x + 4, y - 4 - lg, 2, 5); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.ellipse(x, y - 7, 8, 4, 0, 0, Math.PI*2); ctx.fill(); rect('#fafafa', x - 2 + 2*f, y - 6, 6, 2);
  circ(x + 8*f, y - 11, 4, '#212121'); rect('#fafafa', x + 10*f - 1, y - 10, 3, 2); tri(x + 6*f, y - 14, x + 9*f, y - 14, x + 7*f, y - 18, '#212121');
  ctx.strokeStyle = '#212121'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8*f, y - 8); ctx.lineTo(x - 13*f, y - 12 + Math.sin(d.ph*1.3)*2); ctx.stroke(); }
// sheep flock (boids-lite) and the sheepdog that gathers strays then drives the flock onto the meadow
const V16_ROAM = {x:4330, y:-520, w:820, h:330}, V16_MEADOW = {x:4560, y:-300, r:70};
function v16FarmInit(){
  if(FARM){ FARM.animals.forEach(a => { a.pen = V16_ROAM; a.tx = 0; }); }
  V16.sheep = Array.from({length:10}, () => ({x:4900 + v16rnd(-60, 60), y:-420 + v16rnd(-40, 40), vx:0, vy:0, ph:Math.random()*6, t:Math.random()*3}));
  V16.dog = {x:4980, y:-300, vx:0, vy:0, ph:0, ang:0, tx:4980, ty:-300};
}
function v16FarmUpdate(dt){
  const S = V16.sheep, d = V16.dog; if(!S.length) return; const M = V16_MEADOW, me = PLAYER && PLAYER.visible ? PLAYER : null;
  let cx = 0, cy = 0; S.forEach(s => { cx += s.x; cy += s.y; }); cx /= S.length; cy /= S.length; let avg = 0; S.forEach(s => avg += Math.hypot(s.x - cx, s.y - cy)); avg /= S.length;
  const home = Math.hypot(cx - M.x, cy - M.y) < M.r*.6, dcx = cx - d.x, dcy = cy - d.y, dcl = Math.hypot(dcx, dcy) || 1, push = !home && dcl < avg + 110 ? 34 : 0;
  S.forEach(a => { a.ph += dt*8; a.t -= dt; let ax = (cx - a.x)*.3, ay = (cy - a.y)*.3;
    S.forEach(o => { if(o === a) return; const dx = a.x - o.x, dy = a.y - o.y, q = dx*dx + dy*dy; if(q < 196 && q > 0){ ax += dx/q*500; ay += dy/q*500; } });
    [[d, 110, 900], [me, 80, 700]].forEach(([f, Rr, k]) => { if(!f) return; const dx = a.x - f.x, dy = a.y - f.y, q = Math.hypot(dx, dy); if(q < Rr && q > 1){ ax += dx/q*k*(1 - q/Rr); ay += dy/q*k*(1 - q/Rr); } });
    if(a.t < 0){ a.t = 2 + Math.random()*3; a.wx = v16rnd(-12, 12); a.wy = v16rnd(-12, 12); } ax += (a.wx || 0) + dcx/dcl*push; ay += (a.wy || 0) + dcy/dcl*push;
    a.vx += ax*dt; a.vy += ay*dt; const sp = Math.hypot(a.vx, a.vy); if(sp > 70){ a.vx *= 70/sp; a.vy *= 70/sp; } a.vx *= Math.pow(.3, dt); a.vy *= Math.pow(.3, dt);
    a.x = Math.max(V16_ROAM.x + 10, Math.min(V16_ROAM.x + V16_ROAM.w - 10, a.x + a.vx*dt)); a.y = Math.max(V16_ROAM.y + 14, Math.min(V16_ROAM.y + V16_ROAM.h - 6, a.y + a.vy*dt)); });
  const toM = Math.atan2(M.y - cy, M.x - cx);
  if(home){ d.ang += dt*.5; d.tx = M.x + Math.cos(d.ang)*(M.r + 110); d.ty = M.y + Math.sin(d.ang)*(M.r + 60); }
  else if(avg > 60){ const far = S.reduce((b, s) => Math.hypot(s.x - cx, s.y - cy) > Math.hypot(b.x - cx, b.y - cy) ? s : b), an = Math.atan2(far.y - cy, far.x - cx); d.tx = far.x + Math.cos(an)*36; d.ty = far.y + Math.sin(an)*36; }
  else { d.ang += dt*.8; const an = toM + Math.PI + Math.sin(d.ang)*.6; d.tx = cx + Math.cos(an)*(avg + 70); d.ty = cy + Math.sin(an)*(avg + 70); }
  d.tx = Math.max(V16_ROAM.x, Math.min(V16_ROAM.x + V16_ROAM.w, d.tx)); d.ty = Math.max(V16_ROAM.y + 10, Math.min(V16_ROAM.y + V16_ROAM.h, d.ty));
  const ddx = d.tx - d.x, ddy = d.ty - d.y, dl = Math.hypot(ddx, ddy), dsp = Math.min(160, dl*2.5); if(dl > 1){ d.vx = ddx/dl*dsp; d.vy = ddy/dl*dsp; } else { d.vx = d.vy = 0; } d.x += d.vx*dt; d.y += d.vy*dt; d.ph += dt*(dl > 4 ? 12 : 2);
  const inside = S.filter(s => Math.hypot(s.x - M.x, s.y - M.y) < M.r).length;
  if(inside >= S.length - 1){ if(!V16.herded){ V16.herded = true; if(me && Math.hypot(me.x - M.x, me.y - M.y) < 500 && realT > V16.herdT){ V16.herdT = realT + 180; toast('Chó chăn cừu đã lùa cả đàn về đồng cỏ! Cảm ơn bạn đã cùng giúp.'); if(PROF) reward(5, 5, 'Cùng chó chăn cừu lùa đàn', true); } setTimeout(() => { V16.sheep.forEach(s => { s.wx = v16rnd(-40, 40); s.wy = v16rnd(-30, 30); s.t = 6; }); }, 15000); } }
  else if(inside < S.length - 4) V16.herded = false;
}
function v16Update(dtR){ V16.t += dtR; try { v26Slow('sheep', d => v16FarmUpdate(Math.min(.2, d)), dtR, R.farm); } catch(e){} try { if(typeof openWorldTick === 'function') openWorldTick(dtR); } catch(e){} }

// ---------- doors: navy ship, every house, chess tables, garden gate, telescope ----------
const V16_HSTYLE = {bietthu:'chauau', laudai:'chauau', nhaong:'vn', nhago:'vn', nhasan:'vn', nhat:'nhat', diatrunghai:'y', resort:'my', villa:'my', container:'my', nhakinh:'my', nhatron:'y', thai:'vn'};
function v16Doors(d){
  d.push({x:V16_BASE.navy[0] - 60, y:V16_BASE.navy[1] - 106, n:'Tàu hải quân · bắn tên lửa vào tàu hải tặc', f:openMissile});
  d.push({x:V16_BASE.silo[0], y:V16_BASE.silo[1] + 26, n:'Hầm tên lửa đạn đạo ngầm', f:openMissile});
  HOUSES.forEach(h => d.push({x:h.x + h.w/2, y:h.y + h.h + 6, n:'Tham quan ' + h.name, f:() => openHouse(h)}));
  v16Tables().forEach(([x, y]) => d.push({x, y:y + 30, n:'Bàn cờ Ikigai · chơi hoặc thách đấu', f:openChal}));
  d.push({x:V16_GARDEN_GATE[0], y:V16_GARDEN_GATE[1] + 10, n:'Khu vườn mở bán · làm vườn', f:openGarden});
  const [sx, sy] = V16_SCOPE(); d.push({x:sx, y:sy + 10, n:'Kính viễn vọng · ngắm Hệ Mặt Trời', f:openScope});
}

// ---------- modal: underground ballistic missile vs pirates (motion scene) ----------
const MS = {run:false, st:'idle', t:0, parts:[], debris:[], pir:null, m:null, shake:0, flash:0, raf:0};
function openMissile(){ showModal('mMissile'); msReset(); if(!MS.run){ MS.run = true; MS.prev = performance.now(); requestAnimationFrame(msLoop); } }
function msReset(){ Object.assign(MS, {st:'idle', t:0, parts:[], debris:[], pir:{x:1100, y:330, a:0, sink:0}, m:null, shake:0, flash:0, hatch:0, bum:0}); $('#msFire').disabled = false; $('#msFire').textContent = '🚀 PHÓNG TÊN LỬA'; $('#msInfo').textContent = 'Tàu hải tặc đang tiến vào vùng biển của trường. Bấm nút để mở hầm và phóng tên lửa.'; }
function msFire(){ if(MS.st !== 'idle') return; MS.st = 'open'; MS.t = 0; $('#msFire').disabled = true; v16Siren(); }
function msLoop(now){
  if(!MS.run) return; const dt = Math.min(.05, (now - MS.prev)/1000); MS.prev = now; msStep(dt); msDraw(); requestAnimationFrame(msLoop);
}
function msStep(dt){
  MS.t += dt; const p = MS.pir;
  if(MS.st === 'idle'){ p.x = Math.max(700, p.x - dt*30); }
  if(MS.st === 'open'){ MS.hatch = Math.min(1, MS.t/1.2); if(MS.t > 1.3){ MS.st = 'rise'; MS.t = 0; MS.m = {x:250, y:520, vx:0, vy:0, ang:-Math.PI/2}; v16Noise(2.6, 900, .5); } }
  if(MS.st === 'rise'){ const m = MS.m; m.y -= dt*(80 + MS.t*260); MS.shake = 4; for(let k=0;k<4;k++) MS.parts.push({x:m.x + v16rnd(-6, 6), y:m.y + 30, vx:v16rnd(-60, 60), vy:v16rnd(20, 90), r:v16rnd(6, 14), life:1.4, max:1.4, c:'smoke'});
    if(m.y < 260){ MS.st = 'fly'; MS.t = 0; m.p0 = [m.x, m.y]; m.c = [(m.x + p.x)/2, -120]; m.p1 = [p.x, p.y - 30]; } }
  if(MS.st === 'fly'){ const m = MS.m, u = Math.min(1, MS.t/1.9), e = u*u*(3 - 2*u), q = (a, b, c) => (1 - e)*(1 - e)*a + 2*(1 - e)*e*b + e*e*c;
    const nx = q(m.p0[0], m.c[0], m.p1[0]), ny = q(m.p0[1], m.c[1], m.p1[1]); m.ang = Math.atan2(ny - m.y, nx - m.x); m.x = nx; m.y = ny; MS.shake = Math.max(MS.shake - dt*6, 1);
    for(let k=0;k<3;k++) MS.parts.push({x:m.x - Math.cos(m.ang)*18, y:m.y - Math.sin(m.ang)*18, vx:v16rnd(-20, 20), vy:v16rnd(-20, 20), r:v16rnd(5, 10), life:1.6, max:1.6, c:'smoke'});
    MS.parts.push({x:m.x - Math.cos(m.ang)*16, y:m.y - Math.sin(m.ang)*16, vx:-Math.cos(m.ang)*80, vy:-Math.sin(m.ang)*80, r:v16rnd(3, 6), life:.3, max:.3, c:'fire'});
    if(u >= 1){ MS.st = 'boom'; MS.t = 0; MS.flash = 1; MS.shake = 18; MS.bum = .01; v16Noise(3, 260, 1); v16Noise(.7, 3000, .4);
      for(let k=0;k<140;k++){ const a = Math.random()*Math.PI*2, s = v16rnd(80, 520); MS.parts.push({x:p.x, y:p.y - 30, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 80, r:v16rnd(3, 9), life:v16rnd(.5, 1.4), max:1.4, c:Math.random() < .5 ? 'fire' : 'spark'}); }
      for(let k=0;k<50;k++) MS.parts.push({x:p.x + v16rnd(-30, 30), y:p.y - 30, vx:v16rnd(-120, 120), vy:v16rnd(-160, -20), r:v16rnd(12, 26), life:2.8, max:2.8, c:'dark'});
      for(let k=0;k<16;k++) MS.debris.push({x:p.x, y:p.y - 30, vx:v16rnd(-260, 260), vy:v16rnd(-420, -120), a:0, va:v16rnd(-10, 10), w:v16rnd(8, 22)});
      MS.m = null; } }
  if(MS.st === 'boom'){ MS.flash = Math.max(0, MS.flash - dt*1.6); MS.shake = Math.max(0, MS.shake - dt*12); MS.bum = Math.min(1.6, MS.bum + dt*3); p.a = Math.min(.5, p.a + dt*.2); p.sink += dt*40;
    if(MS.t > 3.2){ MS.st = 'done'; msWin(); } }
  if(MS.st === 'done'){ p.sink += dt*20; }
  MS.parts.forEach(o => { o.life -= dt; o.x += o.vx*dt; o.y += o.vy*dt; o.vx *= Math.pow(.5, dt); o.vy = o.c === 'smoke' || o.c === 'dark' ? o.vy*Math.pow(.5, dt) - 12*dt : o.vy + 300*dt; o.r += o.c === 'smoke' || o.c === 'dark' ? dt*14 : 0; }); MS.parts = MS.parts.filter(o => o.life > 0);
  MS.debris.forEach(o => { o.vy += 500*dt; o.x += o.vx*dt; o.y += o.vy*dt; o.a += o.va*dt; }); MS.debris = MS.debris.filter(o => o.y < 700);
}
function msDraw(){
  const c = $('#msCv'); if(!c) return; const g = c.getContext('2d'), W2 = 1280, H2 = 640, t = performance.now()/1000;
  g.save(); g.setTransform(c.width/W2, 0, 0, c.height/H2, 0, 0); if(MS.shake > 0) g.translate(v16rnd(-MS.shake, MS.shake), v16rnd(-MS.shake, MS.shake));
  let gr = g.createLinearGradient(0, 0, 0, 380); gr.addColorStop(0, '#0d47a1'); gr.addColorStop(1, '#90caf9'); g.fillStyle = gr; g.fillRect(-40, -40, W2 + 80, 420);
  g.fillStyle = 'rgba(255,255,255,.85)'; [[200, 90], [760, 60], [1050, 120]].forEach(([x, y], i) => { const xx = (x + t*12*(i + 1)) % (W2 + 200) - 100; [[0, 0, 30], [26, -8, 24], [-26, -4, 20]].forEach(([a, b, r]) => { g.beginPath(); g.arc(xx + a, y + b, r, 0, 7); g.fill(); }); });
  gr = g.createLinearGradient(0, 330, 0, H2); gr.addColorStop(0, '#29b6f6'); gr.addColorStop(1, '#01579b'); g.fillStyle = gr; g.fillRect(420, 330, W2 - 380, H2);
  g.fillStyle = 'rgba(255,255,255,.35)'; for(let r=0;r<8;r++) for(let x = 440 - ((t*30 + r*40) % 120); x < W2; x += 120) g.fillRect(x, 350 + r*36 + Math.sin(t + x*.01)*4, 50, 3);
  // shore cutaway: sand on top, earth below, the silo shaft underground
  g.fillStyle = '#ffe0a3'; g.fillRect(-40, 300, 500, 40); g.beginPath(); g.moveTo(460, 300); g.lineTo(540, 360); g.lineTo(460, 360); g.fill();
  gr = g.createLinearGradient(0, 340, 0, H2); gr.addColorStop(0, '#8d6e63'); gr.addColorStop(1, '#3e2723'); g.fillStyle = gr; g.fillRect(-40, 340, 520, H2);
  g.fillStyle = '#263238'; g.fillRect(210, 330, 80, 300); g.fillStyle = '#37474f'; for(let y=350;y<630;y+=30) g.fillRect(212, y, 76, 3); g.fillStyle = '#ffd23f'; g.font = '16px VT323, monospace'; g.fillText('HẦM PHÓNG NGẦM', 160, 620);
  const hw = 40*(1 - MS.hatch); g.fillStyle = '#546e7a'; g.fillRect(210 - (40 - hw), 322, hw, 10); g.fillRect(250 + (40 - hw), 322, hw, 10); for(let k=0;k<6;k++){ g.fillStyle = k % 2 ? '#ffd23f' : '#212121'; g.fillRect(190 + k*20, 314, 20, 6); }
  if(MS.st === 'idle' || MS.st === 'open'){ v16DrawMissile(g, 250, 520, -Math.PI/2); }
  // navy ship on the right of the shore
  const nb = Math.sin(t*1.4)*3; g.save(); g.translate(600, 360 + nb); g.fillStyle = '#546e7a'; g.beginPath(); g.moveTo(-110, 0); g.lineTo(110, 0); g.lineTo(90, 24); g.lineTo(-96, 24); g.fill(); g.fillStyle = '#607d8b'; g.fillRect(-100, -14, 200, 16); g.fillStyle = '#78909c'; g.fillRect(-30, -46, 64, 32); g.fillStyle = '#90a4ae'; g.fillRect(-10, -70, 22, 24); g.fillStyle = '#c62828'; g.fillRect(-92, -20, 14, 6); g.restore();
  // pirate ship
  const p = MS.pir; if(p.sink < 260){ g.save(); g.translate(p.x, p.y + 20 + p.sink + Math.sin(t*1.7)*3); g.rotate(p.a); g.fillStyle = '#4e342e'; g.beginPath(); g.moveTo(-100, 0); g.lineTo(100, 0); g.lineTo(78, 30); g.lineTo(-84, 30); g.fill(); g.fillStyle = '#3e2723'; g.fillRect(-90, -14, 180, 16); g.fillStyle = '#5d4037'; g.fillRect(-4, -150, 7, 140);
    g.fillStyle = '#212121'; g.beginPath(); g.moveTo(3, -146); g.lineTo(3, -50); g.lineTo(90, -60); g.fill(); g.fillStyle = '#fafafa'; g.beginPath(); g.arc(36, -104, 9, 0, 7); g.fill(); g.fillRect(28, -96, 16, 6); g.restore();
    g.fillStyle = 'rgba(255,82,82,.9)'; g.font = '20px Bungee, sans-serif'; if(MS.st === 'idle' || MS.st === 'open' || MS.st === 'rise' || MS.st === 'fly') g.fillText('TÀU HẢI TẶC', p.x - 70, p.y - 150); }
  // particles: smoke trail, fire, sparks, dark plume
  MS.parts.forEach(o => { const a = o.life/o.max; g.globalAlpha = Math.max(0, o.c === 'smoke' ? a*.6 : o.c === 'dark' ? a*.75 : a); g.fillStyle = o.c === 'smoke' ? '#eceff1' : o.c === 'dark' ? '#424242' : o.c === 'spark' ? '#fff59d' : (a > .5 ? '#ffeb3b' : '#ff5722'); g.beginPath(); g.arc(o.x, o.y, o.r, 0, 7); g.fill(); });
  g.globalAlpha = 1; MS.debris.forEach(o => { g.save(); g.translate(o.x, o.y); g.rotate(o.a); g.fillStyle = '#3e2723'; g.fillRect(-o.w/2, -3, o.w, 6); g.restore(); });
  if(MS.m) v16DrawMissile(g, MS.m.x, MS.m.y, MS.m.ang);
  if(MS.st === 'boom' || MS.st === 'done'){ const k = Math.min(1, MS.t*1.5); g.strokeStyle = `rgba(255,236,179,${Math.max(0, 1 - k)})`; g.lineWidth = 10*(1 - k) + 1; g.beginPath(); g.arc(p.x, p.y - 30, 30 + k*320, 0, 7); g.stroke();
    if(MS.st === 'boom'){ const s = MS.bum < 1 ? MS.bum*1.3 : 1.3 - (MS.bum - 1)*.4; g.save(); g.translate(p.x, p.y - 190); g.scale(s, s); g.font = '110px Bungee, sans-serif'; g.textAlign = 'center'; g.lineWidth = 12; g.strokeStyle = '#bf360c'; g.strokeText('BÙM!', 0, 0); g.fillStyle = '#ffeb3b'; g.fillText('BÙM!', 0, 0); g.restore(); } }
  if(MS.flash > 0){ g.fillStyle = `rgba(255,255,255,${MS.flash*.8})`; g.fillRect(-40, -40, W2 + 80, H2 + 80); }
  g.restore();
}
function v16DrawMissile(g, x, y, ang){ g.save(); g.translate(x, y); g.rotate(ang + Math.PI/2); g.fillStyle = '#eceff1'; g.fillRect(-9, -40, 18, 70); g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(-9, -40); g.lineTo(9, -40); g.lineTo(0, -64); g.fill(); g.fillStyle = '#455a64'; g.beginPath(); g.moveTo(-9, 18); g.lineTo(-22, 34); g.lineTo(-9, 30); g.fill(); g.beginPath(); g.moveTo(9, 18); g.lineTo(22, 34); g.lineTo(9, 30); g.fill(); g.fillStyle = '#1565c0'; g.fillRect(-9, -18, 18, 6); g.restore(); }
function msWin(){
  $('#msFire').disabled = false; $('#msFire').textContent = 'Đợt hải tặc tiếp theo'; $('#msInfo').textContent = 'Tàu hải tặc đã chìm! Biển trường mình lại bình yên. Người lính giỏi nhất là người giữ hòa bình.';
  if(PROF) reward(20, 25, 'Bắn chìm tàu hải tặc'); try { mprog('pirate'); } catch(e){}
  if(typeof pirate !== 'undefined' && pirate){ ships = ships.filter(s => s !== pirate); pirate = null; log('sea', 'Tên lửa từ hầm ngầm đã bắn chìm tàu hải tặc. Biển yên bình trở lại!', 'hung'); }
}
let V16AC = null; const v16ac = () => { if(!V16AC) V16AC = new (window.AudioContext || window.webkitAudioContext)(); if(V16AC.state === 'suspended') V16AC.resume(); return V16AC; };
function v16Noise(d, f, v){ try { const ac = v16ac(), b = ac.createBuffer(1, ac.sampleRate*d, ac.sampleRate), x = b.getChannelData(0); for(let i=0;i<x.length;i++) x[i] = (Math.random()*2 - 1)*(1 - i/x.length); const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; const g = ac.createGain(); g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(ac.destination); s.start(); } catch(e){} }
function v16Tone(f, d, v, type){ try { const ac = v16ac(), o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(v || .2, ac.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d + .05); } catch(e){} }
function v16Siren(){ for(let k=0;k<3;k++){ setTimeout(() => v16Tone(660, .25, .15, 'square'), k*400); setTimeout(() => v16Tone(880, .25, .15, 'square'), k*400 + 200); } }

// ---------- modal: house interiors (5 luxury styles), walk around with arrow keys ----------
const HS = {run:false, h:null, s:'my', x:480, y:470, dir:1, k:{}, near:null};
const HSTYLE = {
  my:{n:'Phong cách Mỹ', wall:'#eceff1', floor:'#a1887f', trim:'#8d6e4a', note:'Phòng khách ấm cúng, lò sưởi, sofa xanh, TV và bàn ăn gia đình.'},
  chauau:{n:'Quý tộc phương Tây', wall:'#efebe9', floor:'#5d4037', trim:'#ffd23f', note:'Đèn chùm pha lê, thảm đỏ chỉ vàng, đàn dương cầm và tranh sơn dầu.'},
  nhat:{n:'Nhật Bản', wall:'#f1e9d2', floor:'#d8c99a', trim:'#3e2723', note:'Chiếu tatami, cửa giấy shoji, bàn thấp chabudai, bonsai và đèn lồng.'},
  y:{n:'Biệt thự Ý', wall:'#ffe0b2', floor:'#d84315', trim:'#fff3e0', note:'Gạch nung terracotta, cửa vòm, đài phun nước và cây ô liu.'},
  vn:{n:'Nhà Việt ba gian', wall:'#efe2c6', floor:'#b23c17', trim:'#5d4037', note:'Sập gụ, tủ chè, chum nước, tranh Đông Hồ và đèn lồng Hội An.'}
};
const HFURN = {
  my:[['Sofa', 120, 300, 230, 60, '#1565c0'], ['Bàn trà', 160, 390, 150, 50, '#8d6e4a'], ['TV & kệ', 430, 250, 200, 50, '#212121'], ['Lò sưởi', 720, 240, 160, 110, '#bcaaa4'], ['Bàn ăn', 700, 430, 180, 90, '#c62828']],
  chauau:[['Đàn dương cầm', 100, 280, 220, 100, '#212121'], ['Ghế nhung', 720, 280, 180, 70, '#7b1fa2'], ['Bàn tiệc', 660, 440, 240, 80, '#6d4c41'], ['Rương báu', 120, 460, 140, 60, '#ffd23f']],
  nhat:[['Bàn chabudai', 380, 380, 200, 70, '#5d4037'], ['Bonsai', 110, 260, 70, 70, '#8d6e4a'], ['Đèn lồng', 820, 260, 60, 100, '#fff8e1'], ['Tủ tansu', 640, 250, 140, 70, '#6d4c41']],
  y:[['Đài phun nước', 380, 290, 200, 110, '#fafafa'], ['Bàn ăn khăn ca rô', 100, 290, 220, 90, '#c62828'], ['Cây ô liu', 760, 270, 70, 90, '#558b2f'], ['Tủ rượu nho', 760, 440, 120, 70, '#6d4c2e']],
  vn:[['Sập gụ', 360, 260, 240, 80, '#4e342e'], ['Tủ chè', 100, 260, 170, 100, '#3e2723'], ['Bộ bàn ghế gỗ', 700, 270, 170, 80, '#6d4c2e'], ['Chum nước', 120, 450, 60, 60, '#8d6e4a'], ['Đèn lồng Hội An', 800, 460, 50, 80, '#e53935']]
};
function openHouse(h){ HS.h = h; HS.s = V16_HSTYLE[h.k] || ['my','chauau','nhat','y','vn'][HOUSES.indexOf(h) % 5]; HS.x = 480; HS.y = 500; HS.k = {}; $('#mHouseT').textContent = h.name + ' · ' + HSTYLE[HS.s].n; $('#hsNote').textContent = HSTYLE[HS.s].note + ' Đi bằng phím mũi tên/WASD, bấm E cạnh đồ vật để ngắm.'; showModal('mHouse'); if(!HS.run){ HS.run = true; HS.prev = performance.now(); requestAnimationFrame(hsLoop); } try { mprog('visit'); } catch(e){} }
function hsLoop(now){ if(!HS.run) return; const dt = Math.min(.05, (now - HS.prev)/1000); HS.prev = now; hsStep(dt); hsDraw(); requestAnimationFrame(hsLoop); }
function hsBlocked(x, y){ if(x < 40 || x > 920 || y < 230 || y > 540) return true; return HFURN[HS.s].some(([, fx, fy, fw, fh]) => x > fx - 6 && x < fx + fw + 6 && y > fy + 10 && y < fy + fh + 12); }
function hsStep(dt){ const k = HS.k; let vx = (k.r ? 1 : 0) - (k.l ? 1 : 0), vy = (k.d ? 1 : 0) - (k.u ? 1 : 0); HS.moving = !!(vx || vy); if(HS.moving){ const l = Math.hypot(vx, vy), sp = 170*dt; const nx = HS.x + vx/l*sp, ny = HS.y + vy/l*sp; if(!hsBlocked(nx, HS.y)) HS.x = nx; if(!hsBlocked(HS.x, ny)) HS.y = ny; if(vx) HS.dir = vx; }
  let best = null, bd = 90; HFURN[HS.s].forEach(f => { const d = Math.hypot(f[1] + f[3]/2 - HS.x, f[2] + f[4]/2 - HS.y); if(d < bd){ bd = d; best = f; } }); HS.near = best; }
function hsDraw(){
  const c = $('#hsCv'); if(!c) return; const g = c.getContext('2d'), S = HSTYLE[HS.s], s = HS.s, t = performance.now()/1000;
  withCtx(g, () => { ctx.setTransform(c.width/960, 0, 0, c.height/580, 0, 0); ctx.imageSmoothingEnabled = false;
    rect(S.wall, 0, 0, 960, 220); rect(S.trim, 0, 210, 960, 10);
    if(s === 'nhat'){ for(let y=220;y<580;y+=80) for(let x=((y/80) % 2)*80; x<960; x+=160){ rect(S.floor, x, y, 158, 78); rect('#3e2723', x, y, 158, 2); } for(let k=0;k<6;k++){ rect('#fff8e1', 40 + k*150, 30, 130, 170); for(let a=1;a<3;a++) rect('#8d6e4a', 40 + k*150 + a*43, 30, 2, 170); for(let b=1;b<4;b++) rect('#8d6e4a', 40 + k*150, 30 + b*42, 130, 2); } }
    else if(s === 'y'){ for(let y=220;y<580;y+=40) for(let x=0;x<960;x+=40) rect(((x + y)/40) % 2 ? '#d84315' : '#ef6c00', x, y, 40, 40); for(let k=0;k<4;k++){ circ(150 + k*220, 110, 55, '#fff3e0'); rect('#fff3e0', 95 + k*220, 110, 110, 100); rect('#4fc3f7', 112 + k*220, 80, 76, 120); ctx.globalAlpha = .5; rect('#fff', 112 + k*220, 80, 76, 30); ctx.globalAlpha = 1; } }
    else if(s === 'chauau'){ rect(S.floor, 0, 220, 960, 360); rect('#b71c1c', 400, 220, 160, 360); rect('#ffd23f', 398, 220, 3, 360); rect('#ffd23f', 559, 220, 3, 360); for(let k=0;k<5;k++){ rect('#d7ccc8', 40 + k*190, 20, 22, 190); rect('#ffd23f', 100 + k*190, 50, 70, 90); rect(['#7986cb','#81c784','#ffb74d'][k % 3], 105 + k*190, 55, 60, 80); }
      for(let k=0;k<2;k++){ const cx = 300 + k*360; rect('#ffd23f', cx - 1, 0, 2, 40); ctx.globalAlpha = .35 + .15*Math.sin(t*2 + k); circ(cx, 60, 40, '#fff59d'); ctx.globalAlpha = 1; for(let a=0;a<7;a++) circ(cx - 30 + a*10, 64 + Math.abs(a - 3)*-3, 3, '#e1f5fe'); circ(cx, 50, 10, '#ffd23f'); } }
    else if(s === 'vn'){ for(let y=220;y<580;y+=40) for(let x=0;x<960;x+=40) rect(((x + y)/40) % 2 ? '#b23c17' : '#c1440e', x + 1, y + 1, 38, 38); for(let k=0;k<4;k++) rect('#5d4037', 60 + k*290, 0, 14, 220); for(let k=0;k<3;k++){ rect('#fff8e1', 120 + k*290, 40, 150, 120); rect(['#e53935','#43a047','#fdd835'][k], 135 + k*290, 55, 120, 90); circ(195 + k*290, 100, 20, '#fff8e1'); } rect('#b71c1c', 380, 4, 200, 26); ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center'; ctx.fillText('PHÚC LỘC THỌ', 480, 23); ctx.textAlign = 'left'; }
    else { rect(S.floor, 0, 220, 960, 360); for(let x=0;x<960;x+=60) rect('#8d6e4a', x, 220, 2, 360); for(let k=0;k<3;k++){ rect('#90caf9', 110 + k*300, 40, 160, 130); rect('#fff', 188 + k*300, 40, 4, 130); rect('#fff', 110 + k*300, 103, 160, 4); } ctx.globalAlpha = .6; rect('#b0bec5', 420, 430, 220, 120); ctx.globalAlpha = 1; }
    HFURN[s].forEach(([n, x, y, w, h, col]) => { ctx.globalAlpha = .15; rect('#000', x + 5, y + h - 2, w, 10); ctx.globalAlpha = 1; rect(col, x, y, w, h); ctx.globalAlpha = .25; rect('#fff', x, y, w, 6); ctx.globalAlpha = 1;
      if(n === 'Lò sưởi'){ rect('#3e2723', x + 40, y + 50, 80, 60); for(let k=0;k<5;k++) circ(x + 52 + k*14, y + 96 - Math.abs(Math.sin(t*6 + k))*14, 7, k % 2 ? '#ff7043' : '#ffca28'); }
      if(n === 'Đài phun nước'){ circ(x + w/2, y + h/2, 40, '#4fc3f7'); for(let k=0;k<8;k++){ const a = k/8*Math.PI*2; circ(x + w/2 + Math.cos(a)*(10 + (t*30 + k*5) % 30), y + h/2 - 10 + Math.sin(a)*8 - ((t*30 + k*5) % 30)*.4, 2, '#e1f5fe'); } }
      if(n === 'Bonsai'){ circ(x + 35, y - 6, 26, '#2e7d32'); circ(x + 18, y + 4, 16, '#388e3c'); }
      if(n.startsWith('Đèn lồng')){ ctx.globalAlpha = .35 + .2*Math.sin(t*3); circ(x + w/2, y + h/2, w*.9, '#ffcc80'); ctx.globalAlpha = 1; }
      if(n === 'TV & kệ'){ rect('#4fc3f7', x + 20, y - 70, 160, 70); rect('#212121', x + 16, y - 74, 168, 4); circ(x + 100 + Math.sin(t)*40, y - 36, 10, '#ffd23f'); }
      if(n === 'Bàn ăn khăn ca rô') for(let a=0;a<11;a++) for(let b=0;b<3;b++) if((a + b) % 2) rect('#fff', x + a*20, y + b*30, 20, 30);
      ctx.font = '15px VT323, monospace'; const tw = ctx.measureText(n).width; ctx.globalAlpha = .85; rect('#fff8e1', x + w/2 - tw/2 - 4, y - 18, tw + 8, 16); ctx.globalAlpha = 1; ctx.fillStyle = '#3e2723'; ctx.fillText(n, x + w/2 - tw/2, y - 6); });
    // the visitor: the player's own character
    if(PLAYER){ const sx = PLAYER.x, sy = PLAYER.y, sd = PLAYER.dir, sm = PLAYER.moving, sw = PLAYER.walk; ctx.save(); ctx.translate(HS.x, HS.y); ctx.scale(2.2, 2.2); PLAYER.x = 0; PLAYER.y = 0; PLAYER.dir = HS.dir; PLAYER.moving = HS.moving; PLAYER.walk = (PLAYER.walk || 0) + (HS.moving ? .25 : 0);
      try { drawBody(PLAYER, false); } catch(e){ rect('#3d7bff', -6, -20, 12, 18); circ(0, -26, 6, '#f2c9a0'); } PLAYER.x = sx; PLAYER.y = sy; PLAYER.dir = sd; PLAYER.moving = sm; if(!HS.moving) PLAYER.walk = sw; ctx.restore(); }
    rect('#5d4037', 440, 560, 80, 20); ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#fff8e1'; ctx.fillText('CỬA RA', 456, 575);
  });
  $('#hsNear').textContent = HS.near ? `E: ngắm ${HS.near[0]}` : '';
}
function houseKey(e, isDown){ const m = {ArrowLeft:'l', KeyA:'l', ArrowRight:'r', KeyD:'r', ArrowUp:'u', KeyW:'u', ArrowDown:'d', KeyS:'d'}[e.code];
  if(m){ HS.k[m] = isDown; e.preventDefault(); return true; }
  if(isDown && e.code === 'KeyE' && HS.near){ const n = HS.near[0]; toast({Sofa:'Êm như mây! Cả nhà quây quần xem phim.', 'Lò sưởi':'Lửa tí tách ấm áp mùa đông.', 'Đàn dương cầm':'♪ Một giai điệu cổ điển vang lên.', 'Đài phun nước':'Tiếng nước róc rách thật thư thái.', 'Sập gụ':'Ông bà ngồi đây kể chuyện ngày xưa.', 'Bonsai':'Cây trăm tuổi được chăm từng chiếc lá.', 'Chum nước':'Nước mưa trong mát để rửa mặt.'}[n] || `${n}: món đồ đẹp mang đậm phong cách ${HSTYLE[HS.s].n}.`); if(n === 'Đàn dương cầm') [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => v16Tone(f, .5, .2), i*160)); e.preventDefault(); return true; }
  return false; }

// ---------- modal: garden plots for sale (buy land, seeds, plant, water, harvest) ----------
const GCROPS = {rau:['Rau muống', 30, 6, 14, '#43a047'], cachua:['Cà chua', 60, 10, 26, '#e53935'], ngo:['Ngô', 90, 12, 36, '#fdd835'], huongduong:['Hướng dương', 120, 16, 48, '#ffca28'], duahau:['Dưa hấu', 160, 22, 70, '#2e7d32']};
const GBED_PRICE = 40, GBEDS = 8; let GSEL = 'rau';
function gState(){ if(!PROF) return null; PROF.garden = PROF.garden || {owned:0, beds:[], seeds:{rau:3}}; while(PROF.garden.beds.length < GBEDS) PROF.garden.beds.push({c:null, t0:0, w:0}); return PROF.garden; }
const gNeed = b => GCROPS[b.c][1]*1000/(1 + b.w*.5);
function openGarden(){ if(!PROF){ openLogin(); return; } gState(); showModal('mGarden'); gRender(); if(!GS.run){ GS.run = true; requestAnimationFrame(gLoop); } }
const GS = {run:false};
function gLoop(){ if(!GS.run) return; gDraw(); requestAnimationFrame(gLoop); }
function gRender(){ const G = gState(); $('#gMoney').textContent = `$${PROF.money} · ${G.owned}/${GBEDS} luống của bạn`;
  const box = $('#gSeeds'); box.innerHTML = ''; Object.entries(GCROPS).forEach(([k, c]) => { const b = el('button', {type:'button'}); b.innerHTML = `<b>${c[0]}</b> ×${G.seeds[k] || 0}<br><small>Hạt $${c[2]} · lớn ${c[1]}s · bán $${c[3]}</small>`; b.setAttribute('aria-pressed', GSEL === k); b.onclick = () => { GSEL = k; gRender(); }; box.appendChild(b); });
  $('#gBuySeed').textContent = `Mua 3 hạt ${GCROPS[GSEL][0]} ($${GCROPS[GSEL][2]*3})`; $('#gBuyBed').textContent = G.owned < GBEDS ? `Mua thêm 1 luống đất ($${GBED_PRICE})` : 'Bạn đã sở hữu cả khu vườn'; $('#gBuyBed').disabled = G.owned >= GBEDS; }
function gBuySeed(){ const G = gState(), c = GCROPS[GSEL]; if(PROF.money < c[2]*3){ toast('Chưa đủ tiền mua hạt giống.'); return; } PROF.money -= c[2]*3; G.seeds[GSEL] = (G.seeds[GSEL] || 0) + 3; saveProfile(); renderProfHud(); blipSfx(1200); gRender(); }
function gBuyBed(){ const G = gState(); if(G.owned >= GBEDS) return; if(PROF.money < GBED_PRICE){ toast(`Cần $${GBED_PRICE} để mua luống đất.`); return; } PROF.money -= GBED_PRICE; G.owned++; saveProfile(); renderProfHud(); toast('Bạn đã mua thêm một luống đất!'); gRender(); }
const gBedRect = i => [60 + (i % 4)*225, 110 + Math.floor(i/4)*190, 190, 130];
function gClick(e){ const c = $('#gCv'), b = c.getBoundingClientRect(), x = (e.clientX - b.left)*960/b.width, y = (e.clientY - b.top)*520/b.height, G = gState();
  for(let i=0;i<GBEDS;i++){ const [bx, by, bw, bh] = gBedRect(i); if(x < bx || x > bx + bw || y < by || y > by + bh) continue;
    if(i >= G.owned){ toast('Luống này chưa có chủ. Bấm "Mua thêm 1 luống đất".'); return; } const bed = G.beds[i];
    if(!bed.c){ if(!(G.seeds[GSEL] > 0)){ toast('Hết hạt ' + GCROPS[GSEL][0] + '. Mua thêm hạt nhé!'); return; } G.seeds[GSEL]--; Object.assign(bed, {c:GSEL, t0:Date.now(), w:0}); v16Tone(500, .1, .15); toast('Đã gieo ' + GCROPS[GSEL][0] + '. Nhớ tưới nước!'); }
    else if(Date.now() - bed.t0 >= gNeed(bed)){ const C = GCROPS[bed.c]; reward(4, C[3], 'Thu hoạch ' + C[0], true); toast(`Thu hoạch ${C[0]}: +$${C[3]}`); bed.c = null; bed.w = 0; v16Tone(784, .25, .2); try { mprog('farm'); } catch(e){} }
    else if(bed.w < 3){ bed.w++; v16Noise(.4, 2200, .15); toast('Tưới nước, cây lớn nhanh hơn!'); } else toast('Cây đủ nước rồi, chờ thêm chút nhé.');
    saveProfile(); gRender(); return; } }
function gDraw(){ const c = $('#gCv'); if(!c || !PROF) return; const g = c.getContext('2d'), G = gState(), now = Date.now(), t = now/1000;
  g.setTransform(c.width/960, 0, 0, c.height/520, 0, 0); g.fillStyle = '#8bc34a'; g.fillRect(0, 0, 960, 520); for(let k=0;k<160;k++){ g.fillStyle = k % 3 ? '#7cb342' : '#aed581'; g.fillRect((k*97) % 960, (k*53) % 520, 3, 5); }
  g.fillStyle = '#5d4037'; g.fillRect(0, 0, 960, 70); g.fillStyle = '#fff8e1'; g.font = '26px VT323, monospace'; g.fillText('KHU VƯỜN MỞ BÁN · bấm luống để gieo hạt, tưới nước, thu hoạch', 30, 44);
  for(let i=0;i<GBEDS;i++){ const [x, y, w, h] = gBedRect(i), mine = i < G.owned, bed = G.beds[i]; g.fillStyle = mine ? '#6d4c2e' : '#a1887f'; g.fillRect(x, y, w, h); g.fillStyle = mine ? '#5d4037' : '#8d6e63'; for(let r=0;r<4;r++) g.fillRect(x + 6, y + 14 + r*30, w - 12, 8);
    g.fillStyle = mine ? '#fff8e1' : 'rgba(255,255,255,.7)'; g.font = '18px VT323, monospace'; g.fillText(mine ? (bed.c ? GCROPS[bed.c][0] : `Luống ${i + 1} · trống`) : `Luống ${i + 1} · $${GBED_PRICE}`, x + 6, y - 6);
    if(mine && bed.c){ const C = GCROPS[bed.c], f = Math.min(1, (now - bed.t0)/gNeed(bed)); for(let r=0;r<3;r++) for(let k=0;k<5;k++){ const px = x + 22 + k*36, py = y + 34 + r*34, hh = 4 + f*22 + Math.sin(t*2 + k)*1; g.strokeStyle = '#2e7d32'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - hh); g.stroke(); g.fillStyle = '#43a047'; g.beginPath(); g.ellipse(px - 5, py - hh*.6, 5*f + 1, 2.5, 0, 0, 7); g.ellipse(px + 5, py - hh*.8, 5*f + 1, 2.5, 0, 0, 7); g.fill(); if(f >= 1){ g.fillStyle = C[4]; g.beginPath(); g.arc(px, py - hh - 3, bed.c === 'duahau' ? 8 : 5, 0, 7); g.fill(); } }
      g.fillStyle = '#263238'; g.fillRect(x + 8, y + h - 12, w - 16, 7); g.fillStyle = f >= 1 ? '#ffd23f' : '#2fbf71'; g.fillRect(x + 8, y + h - 12, (w - 16)*f, 7); for(let k=0;k<bed.w;k++){ g.fillStyle = '#4fc3f7'; g.beginPath(); g.arc(x + w - 14 - k*14, y + 10, 5, 0, 7); g.fill(); }
      if(f >= 1){ g.fillStyle = '#ffd23f'; g.font = '18px VT323, monospace'; g.fillText('CHÍN! Bấm để thu hoạch', x + 24, y + h + 18); } } } }

// ---------- modal: telescope over the whole solar system ----------
const SC = {run:false, focus:-1, seen:new Set(), t:0};
const PLANETS = [['Sao Thủy', '#b0a89c', 3, 'Gần Mặt Trời nhất, một năm chỉ 88 ngày.'], ['Sao Kim', '#e8c27a', 5, 'Nóng nhất (~465°C) vì lớp khí CO₂ dày.'], ['Trái Đất', '#3d7bff', 5.4, 'Ngôi nhà xanh của chúng ta, có nước và sự sống.'], ['Sao Hỏa', '#d65a35', 4, 'Hành tinh đỏ, có núi lửa Olympus cao nhất hệ.'],
  ['Sao Mộc', '#d9a066', 12, 'Lớn nhất, có Vết Đỏ Lớn là cơn bão khổng lồ.'], ['Sao Thổ', '#e6cf8f', 10, 'Vành đai băng đá tuyệt đẹp bao quanh.'], ['Sao Thiên Vương', '#8fd3e0', 7, 'Quay nghiêng gần 98°, như lăn trên quỹ đạo.'], ['Sao Hải Vương', '#3f5fd6', 7, 'Gió mạnh nhất hệ, tới 2.100 km/h.']];
function openScope(){ showModal('mScope'); SC.focus = -1; if(!SC.run){ SC.run = true; requestAnimationFrame(scLoop); } }
const scPos = i => { const r = 60 + i*48, a = SC.t*(.9/Math.sqrt(i + 1)) + i*1.3; return [450 + Math.cos(a)*r, 260 + Math.sin(a)*r*.42]; };
function scLoop(){ if(!SC.run) return; SC.t += .01; const cv = $('#scCv'); if(!cv){ requestAnimationFrame(scLoop); return; } const c = cv.getContext('2d'); c.setTransform(cv.width/900, 0, 0, cv.height/520, 0, 0);
  c.fillStyle = '#02030a'; c.fillRect(0, 0, 900, 520); for(let i=0;i<200;i++){ c.fillStyle = `rgba(255,255,255,${.3 + .7*Math.abs(Math.sin(SC.t*2 + i))})`; c.fillRect((i*137) % 900, (i*71) % 520, (i % 3)*.6 + .6, (i % 3)*.6 + .6); }
  if(SC.focus >= 0){ const [n, col, , info] = PLANETS[SC.focus], g = c.createRadialGradient(400, 220, 20, 450, 260, 170); g.addColorStop(0, '#fff'); g.addColorStop(.25, col); g.addColorStop(1, '#000'); c.fillStyle = g; c.beginPath(); c.arc(450, 260, 160, 0, 7); c.fill();
    if(SC.focus === 5){ c.strokeStyle = 'rgba(230,207,143,.85)'; c.lineWidth = 14; c.beginPath(); c.ellipse(450, 260, 280, 60, -.2, 0, 7); c.stroke(); } if(SC.focus === 4){ for(let k=0;k<6;k++){ c.fillStyle = 'rgba(120,70,30,.25)'; c.fillRect(300, 150 + k*40, 300, 10); } c.fillStyle = '#b5523b'; c.beginPath(); c.ellipse(500, 300, 34, 18, 0, 0, 7); c.fill(); }
    if(SC.focus === 2){ c.fillStyle = '#2fbf71'; [[400, 220, 50, 30], [500, 300, 40, 60], [430, 330, 30, 20]].forEach(([x, y, w, h]) => { c.beginPath(); c.ellipse(x, y, w, h, .3, 0, 7); c.fill(); }); }
    c.fillStyle = '#fff'; c.font = '30px VT323, monospace'; c.fillText(n, 20, 40); c.font = '22px VT323, monospace'; c.fillText(info, 20, 70); c.fillText('Bấm để quay lại toàn cảnh', 20, 500); }
  else { const g = c.createRadialGradient(450, 260, 4, 450, 260, 46); g.addColorStop(0, '#fff8c4'); g.addColorStop(.5, '#ffb300'); g.addColorStop(1, 'rgba(255,120,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(450, 260, 46, 0, 7); c.fill();
    PLANETS.forEach((p, i) => { const r = 60 + i*48; c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(450, 260, r, r*.42, 0, 0, 7); c.stroke(); const [x, y] = scPos(i); c.fillStyle = p[1]; c.beginPath(); c.arc(x, y, p[2], 0, 7); c.fill(); if(i === 5){ c.strokeStyle = '#e6cf8f'; c.beginPath(); c.ellipse(x, y, 18, 5, -.2, 0, 7); c.stroke(); } c.fillStyle = SC.seen.has(i) ? '#ffd23f' : '#cfd8ff'; c.font = '16px VT323, monospace'; c.fillText(p[0], x + 8, y - 8); }); }
  $('#scCnt').textContent = SC.seen.size; requestAnimationFrame(scLoop); }
function scClick(e){ const cv = $('#scCv'), b = cv.getBoundingClientRect(), x = (e.clientX - b.left)*900/b.width, y = (e.clientY - b.top)*520/b.height; if(SC.focus >= 0){ SC.focus = -1; return; }
  let best = -1, bd = 30; PLANETS.forEach((p, i) => { const [px, py] = scPos(i), d = Math.hypot(px - x, py - y); if(d < bd){ bd = d; best = i; } }); if(best < 0) return; SC.focus = best; const was = SC.seen.size; SC.seen.add(best);
  if(SC.seen.size === 8 && was === 7){ toast('Bạn đã ngắm đủ 8 hành tinh của Hệ Mặt Trời!'); if(PROF) reward(15, 10, 'Ngắm đủ 8 hành tinh'); } }

// ---------- chess sets: challenge any online player, anywhere on the map ----------
const hasChessSet = () => PROF && V16_CHESS.some(c => has(c.id));
function v16ChalBtn(){ const b = $('#hChal'); if(b) b.hidden = !hasChessSet(); }
function openChal(){ showModal('mChal'); const box = $('#chBody'); box.innerHTML = '';
  const ai = el('button', {type:'button', className:'primary'}, 'Chơi với máy ngay tại đây'); ai.onclick = () => { hideModal(); openChess(); }; box.appendChild(ai);
  if(!hasChessSet()){ box.appendChild(el('p', {}, 'Mua một bộ cờ vua ở Cửa hàng (tab Cờ vua) để mời bất kỳ người chơi online nào thách đấu, dù họ đang ở đâu trên bản đồ.')); const s = el('button', {type:'button'}, 'Mở cửa hàng cờ vua'); s.onclick = () => openShop('chess'); box.appendChild(s); return; }
  const ps = (ONLINE.peers || []).filter(p => p.presence && p.presence.n); box.appendChild(el('h3', {}, ps.length ? 'Thách đấu người chơi đang online' : 'Chưa có ai online. Hãy mời bạn bè mở cùng trang này!'));
  ps.forEach(p => { const b = el('button', {type:'button'}); b.textContent = `♞ ${String(p.presence.n).slice(0, 20)} · Lv ${+p.presence.l || 0} · ${R[p.presence.rg] ? R[p.presence.rg].name : 'đang dạo'}`; b.onclick = () => { try { sendInvite(p.peer, 'chess'); toast('Đã gửi lời mời đấu cờ!'); } catch(e){ toast('Chưa gửi được lời mời, thử lại sau.'); } hideModal(); }; box.appendChild(b); }); }

// ---------- glue ----------
function v16Close(id){ if(id === 'mMissile') MS.run = false; if(id === 'mHouse'){ HS.run = false; HS.k = {}; } if(id === 'mGarden') GS.run = false; if(id === 'mScope') SC.run = false; }
function v16Init(){
  V16_BIKES.forEach(b => { b.cat = 'bike'; if(!SHOP.some(s => s.id === b.id)){ const i = SHOP.findIndex(s => s.cat === 'bacc'); SHOP.splice(i, 0, b); ITEM[b.id] = b; } });
  [['bike2', 'mtb'], ['bike3', 'road'], ['bike4', 'ebike'], ['bike5', 'royal']].forEach(([id, d]) => { if(ITEM[id]) ITEM[id].design = d; });
  V16_CHESS.forEach(c => { if(!SHOP.some(s => s.id === c.id)){ SHOP.push(c); ITEM[c.id] = c; } });
  v16FarmInit(); v16SkyInit();
  $('#msFire').onclick = () => { if(MS.st === 'done') msReset(); else msFire(); };
  $('#gCv').onclick = gClick; $('#gBuySeed').onclick = gBuySeed; $('#gBuyBed').onclick = gBuyBed; $('#scCv').onclick = scClick;
  const hc = $('#hChal'); if(hc){ hc.onclick = openChal; } setInterval(v16ChalBtn, 3000); v16ChalBtn();
}

