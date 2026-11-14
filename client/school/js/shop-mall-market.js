// ================= EXT14: MEGA MALL (thousands of decor, fashion & jewelry items) =================
const MCOL = [['trang','Trắng sứ','#f5f3ee'],['den','Đen tuyền','#222222'],['xam','Xám khói','#8a8f98'],['kem','Be kem','#e8d8b8'],['nau','Nâu óc chó','#6b4a32'],['do','Đỏ đô','#8e1b2a'],['hong','Hồng phấn','#f4b6c2'],['cam','Cam đất','#c8653a'],
  ['mutat','Vàng mù tạt','#d9a520'],['reu','Xanh rêu','#5a6b32'],['ngoc','Xanh ngọc','#1aa59a'],['navy','Xanh navy','#1f2f5c'],['bien','Xanh biển','#2f7dd1'],['mint','Xanh mint','#9fe0c8'],['oaihuong','Tím oải hương','#a58bd3'],['vangchanh','Vàng chanh','#f1e35a']];
const MSTY = [
  ['hiendai','Hiện đại', 1.0, 1, 0, {wood:'#b0a596', metal:'#9aa3ab', leg:'thin'}], ['bacau','Bắc Âu', 1.25, 1, 0, {wood:'#e2c79c', metal:'#cfc6b8', leg:'peg', round:true}],
  ['dongque','Đồng quê', 1.15, 2, 0, {wood:'#7a5233', metal:'#5d4037', leg:'block', plaid:true}], ['nhatban','Nhật Bản', 1.5, 3, 0, {wood:'#c9b07a', metal:'#3e2723', leg:'low', paper:true}],
  ['nhietdoi','Nhiệt đới', 1.35, 3, 0, {wood:'#c8a26a', metal:'#8d6e4a', leg:'peg', leaf:true}], ['congnghiep','Công nghiệp', 1.45, 4, 0, {wood:'#5d4c3e', metal:'#37474f', leg:'thin', rivet:true}],
  ['keongot','Kẹo ngọt', 1.6, 4, 0, {wood:'#ffd1dc', metal:'#ff8fb1', leg:'peg', round:true, stripe:true}], ['codien','Cổ điển', 2.2, 5, 1, {wood:'#4e2f1c', metal:'#b08d57', leg:'curve', trim:'#c9a24a'}],
  ['hoanggia','Hoàng gia', 4.0, 7, 3, {wood:'#3b1f12', metal:'#ffd23f', leg:'curve', trim:'#ffd23f', gem:true}], ['vutru','Vũ trụ', 5.5, 9, 5, {wood:'#cfd8dc', metal:'#eceff1', leg:'float', glow:'#26c6da'}]
];
// type: id, name, cat, w, d (tiles), base price, height px
const MTYPE = [
  ['sofa','Sofa','furn',3,1,900,40], ['armchair','Ghế bành','furn',1,1,420,40], ['bed','Giường ngủ','furn',2,3,1500,26], ['dtable','Bàn ăn','furn',2,2,700,30], ['chair','Ghế ăn','furn',1,1,180,40],
  ['desk','Bàn làm việc','furn',2,1,650,32], ['bookshelf','Kệ sách','furn',2,1,800,80], ['wardrobe','Tủ quần áo','furn',2,1,1300,88], ['lamp','Đèn cây','furn',1,1,320,70], ['plant','Cây cảnh','furn',1,1,260,56],
  ['vase','Bình hoa','furn',1,1,200,34], ['tv','Ti vi & kệ','furn',2,1,2500,52], ['piano','Đàn piano','furn',3,2,6000,56], ['aquarium','Bể cá','furn',2,1,3500,56], ['fireplace','Lò sưởi','furn',2,1,2800,64],
  ['fridge','Tủ lạnh','furn',1,1,1800,84], ['stove','Bếp nấu','furn',2,1,1600,40], ['bathtub','Bồn tắm','furn',3,2,3200,30], ['computer','Bàn máy tính','furn',2,1,2200,52], ['trophy','Tủ cúp','furn',1,1,2000,72],
  ['statue','Tượng điêu khắc','furn',1,1,5000,80], ['mirror','Gương đứng','furn',1,1,900,78], ['beanbag','Ghế lười','furn',1,1,350,22], ['rug','Thảm trải sàn','floor',3,2,450,0], ['rugr','Thảm tròn','floor',2,2,380,0],
  ['painting','Tranh treo tường','wall',2,1,600,0], ['clock','Đồng hồ treo','wall',1,1,350,0], ['window','Cửa sổ','wall',2,1,700,0], ['curtain','Rèm cửa','wall',2,1,420,0], ['shelfw','Kệ treo tường','wall',2,1,380,0],
  ['chandelier','Đèn chùm','ceil',2,2,4000,0], ['pendant','Đèn thả','ceil',1,1,520,0],
  ['counter','Quầy thu ngân','shop',3,1,2400,44], ['display','Kệ trưng bày','shop',2,1,1500,70], ['glass','Tủ kính','shop',2,1,2800,64], ['mannequin','Ma-nơ-canh','shop',1,1,1200,74], ['sign','Biển hiệu','wall',3,1,1800,0], ['neon','Đèn neon','wall',2,1,2100,0]
];
const WPAT = [['tron','Trơn'], ['soc','Sọc'], ['caro','Ca rô'], ['hoa','Hoa văn'], ['gach','Gạch thẻ'], ['go','Ốp gỗ']];
const FPAT = [['go','Sàn gỗ'], ['gach','Gạch men'], ['da','Đá cẩm thạch'], ['tham','Thảm lông'], ['tatami','Chiếu tatami'], ['caro','Gạch bàn cờ']];
const JKIND = [['neck','Dây chuyền','goldnecklace',300], ['ear','Hoa tai','earring',260], ['wrist','Đồng hồ','watch',350], ['hat','Vương miện','crown',2400], ['face','Kính thời trang','sunglass',150]];
const JMAT = [['bac','Bạc','#cfd8dc',1], ['vang','Vàng 24K','#ffd23f',3], ['vanghong','Vàng hồng','#f4a6b8',3.2], ['bachkim','Bạch kim','#eceff1',5], ['ngoctrai','Ngọc trai','#fff8e1',4], ['thachanh','Thạch anh tím','#9c4dcc',4.5], ['saphia','Sapphire','#1565c0',7], ['luc','Lục bảo','#2e7d32',8], ['hong','Hồng ngọc','#d50032',9], ['kimcuong','Kim cương','#b3e5fc',14]];
const OBASE = ['o_hoodie','o_jacket','o_princess','o_suit','o_wizard','o_knight','o_royal','o_chef','o_astro'];
const COLS = Object.fromEntries(MCOL.map(c => [c[0], c])), STYS = Object.fromEntries(MSTY.map(s => [s[0], s])), TYPES = Object.fromEntries(MTYPE.map(t => [t[0], t])), JK = Object.fromEntries(JKIND.map(j => [j[0], j])), JM = Object.fromEntries(JMAT.map(m => [m[0], m]));
const MCACHE = {};
function mallItem(key){
  if(MCACHE[key]) return MCACHE[key];
  const p = key.split('|'); let it = null;
  if(p[0] === 'd' && TYPES[p[1]] && STYS[p[2]] && COLS[p[3]]){ const T = TYPES[p[1]], S = STYS[p[2]], C = COLS[p[3]], price = Math.round(T[5]*S[2]/10)*10;
    it = {key, kind:'decor', type:T[0], cat:T[2], w:T[3], d:T[4], h:T[6], name:`${T[1]} ${S[1]} ${C[1].toLowerCase()}`, price, lvl:Math.max(S[3], price >= 8000 ? 6 : price >= 3000 ? 4 : 1), books:Math.max(S[4], price >= 10000 ? 4 : price >= 4000 ? 2 : 0), sty:S, col:C[2]}; }
  else if((p[0] === 'w' || p[0] === 'f') && COLS[p[2]]){ const P = (p[0] === 'w' ? WPAT : FPAT).find(x => x[0] === p[1]); if(P){ const price = (p[0] === 'w' ? 900 : 1100)*(1 + WPAT.findIndex(x => x[0] === p[1])*.25 + (p[0] === 'f' ? FPAT.findIndex(x => x[0] === p[1])*.3 : 0)); it = {key, kind:p[0] === 'w' ? 'wallp' : 'floorp', pat:p[1], col:COLS[p[2]][2], name:`${p[0] === 'w' ? 'Giấy dán tường' : ''} ${P[1]} ${COLS[p[2]][1].toLowerCase()}`.trim(), price:Math.round(price/10)*10, lvl:2, books:p[1] === 'da' || p[1] === 'tatami' ? 1 : 0}; } }
  else if(p[0] === 'o' && ITEM[p[1]] && COLS[p[2]]){ const B = ITEM[p[1]]; it = {key, kind:'outfit', slot:'outfit', o:B.o, c:COLS[p[2]][2], p:B.p, skirt:B.skirt, name:`${B.n} màu ${COLS[p[2]][1].toLowerCase()}`, price:Math.round(B.price*3.5/10)*10 + 200, lvl:B.lvl + 1, books:B.lvl >= 6 ? 2 : B.lvl >= 4 ? 1 : 0}; }
  else if(p[0] === 'j' && JK[p[1]] && JM[p[2]]){ const K = JK[p[1]], M = JM[p[2]], price = Math.round(K[3]*M[3]/10)*10*4; it = {key, kind:'jewel', slot:K[0], o:K[2], col:M[2], name:`${K[1]} ${M[1]}`, price, lvl:Math.min(10, 1 + Math.floor(M[3]/1.6)), books:M[3] >= 7 ? 3 : M[3] >= 4 ? 1 : 0}; }
  if(it) MCACHE[key] = it; return it;
}
function mallEquip(id){ const it = typeof id === 'string' && id.includes('|') ? mallItem(id) : null; return it && (it.kind === 'outfit' || it.kind === 'jewel') ? it : null; }
var ALLKEYS = null;
function mallKeys(){
  if(ALLKEYS) return ALLKEYS; const k = [];
  MTYPE.forEach(t => MSTY.forEach(s => MCOL.forEach(c => k.push(`d|${t[0]}|${s[0]}|${c[0]}`))));
  WPAT.forEach(w => MCOL.forEach(c => k.push(`w|${w[0]}|${c[0]}`))); FPAT.forEach(f => MCOL.forEach(c => k.push(`f|${f[0]}|${c[0]}`)));
  OBASE.forEach(o => MCOL.forEach(c => k.push(`o|${o}|${c[0]}`))); JKIND.forEach(j => JMAT.forEach(m => k.push(`j|${j[0]}|${m[0]}`)));
  return ALLKEYS = k;
}
const bagN = k => (PROF && PROF.bag && PROF.bag[k]) || 0;
function bagAdd(k, n){ PROF.bag = PROF.bag || {}; PROF.bag[k] = (PROF.bag[k] || 0) + (n == null ? 1 : n); if(PROF.bag[k] <= 0) delete PROF.bag[k]; }
const itemOf = k => k.startsWith('g:') ? (ITEM[k.slice(2)] ? {key:k, kind:'gear', name:ITEM[k.slice(2)].n, price:ITEM[k.slice(2)].price, gear:ITEM[k.slice(2)]} : null) : mallItem(k);
const valueOf = k => { const it = itemOf(k); return it ? it.price : 0; };
const booksDone = () => PROF ? Object.keys(PROF.books || {}).length : 0;
function reqText(it){ const r = []; if(PROF.level < it.lvl) r.push(`Level ${it.lvl}`); if(booksDone() < it.books) r.push(`đọc xong ${it.books} cuốn sách (bạn có ${booksDone()})`); return r.length ? 'Cần ' + r.join(' và ') : ''; }
// ---------- decor drawing ----------
function shade(hex, k){ const h = hex.replace('#', ''), n = parseInt(h, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v)*k : v*(1 + k)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function drawDecor(c, it, x, y, T, flip){
  // x,y = top-left of footprint in px, T = tile size; draws upward from the footprint
  const S = it.sty ? it.sty[5] : {wood:'#8d6e4a', metal:'#999', leg:'thin'}, col = it.col, W = it.w*T, D = it.d*T, H = (it.h || 0)*T/48, wd = S.wood, mt = S.metal;
  c.save(); if(flip){ c.translate(x*2 + W, 0); c.scale(-1, 1); }
  const box = (bx, by, bw, bh, f) => { c.fillStyle = f; c.fillRect(bx, by, bw, bh); };
  const top = (bx, by, bw, bh, f) => { box(bx, by, bw, bh, f); box(bx, by, bw, Math.max(2, bh*.18), shade(f, .25)); box(bx, by + bh - Math.max(2, bh*.12), bw, Math.max(2, bh*.12), shade(f, -.25)); };
  const legs = (bx, by, bw, lh) => { if(S.leg === 'float'){ c.fillStyle = (S.glow || '#26c6da') + '55'; c.fillRect(bx + 4, by + lh - 3, bw - 8, 3); return; } const lw = S.leg === 'block' ? T*.16 : S.leg === 'low' ? T*.12 : T*.07, f = S.leg === 'thin' ? mt : wd; [bx + 3, bx + bw - 3 - lw].forEach(lx => { if(S.leg === 'curve'){ c.strokeStyle = f; c.lineWidth = lw; c.beginPath(); c.moveTo(lx + lw/2, by); c.quadraticCurveTo(lx - lw, by + lh*.6, lx + lw/2, by + lh); c.stroke(); } else box(lx, by, lw, S.leg === 'low' ? lh*.4 : lh, f); }); };
  const trim = (bx, by, bw, bh) => { if(S.trim){ c.strokeStyle = S.trim; c.lineWidth = Math.max(1.5, T*.05); c.strokeRect(bx + 1, by + 1, bw - 2, bh - 2); } if(S.glow){ c.strokeStyle = S.glow; c.lineWidth = 2; c.shadowColor = S.glow; c.shadowBlur = 8; c.strokeRect(bx + 1, by + 1, bw - 2, bh - 2); c.shadowBlur = 0; } if(S.gem){ c.fillStyle = '#e53935'; c.beginPath(); c.arc(bx + bw/2, by + 4, 3, 0, 7); c.fill(); } if(S.rivet){ c.fillStyle = '#90a4ae'; [bx + 3, bx + bw - 5].forEach(rx => c.fillRect(rx, by + 3, 2, 2)); } if(S.plaid){ c.fillStyle = 'rgba(0,0,0,.12)'; for(let k = bx; k < bx + bw; k += 8) c.fillRect(k, by, 3, bh); } if(S.stripe){ c.fillStyle = 'rgba(255,255,255,.45)'; for(let k = bx; k < bx + bw; k += 10) c.fillRect(k, by, 4, bh); } if(S.leaf){ c.fillStyle = '#43a047'; c.beginPath(); c.ellipse(bx + bw - 6, by + 2, 6, 3, -.6, 0, 7); c.fill(); } };
  const shadow = () => { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x + W/2, y + D - 3, W/2 - 2, Math.min(D/2, 7), 0, 0, 7); c.fill(); };
  const t = it.type;
  if(it.cat !== 'wall' && it.cat !== 'ceil' && it.cat !== 'floor') shadow();
  const yb = y + D, R = S.round ? 8 : 0;
  const rr = (bx, by, bw, bh, f) => { c.fillStyle = f; if(c.roundRect && R){ c.beginPath(); c.roundRect(bx, by, bw, bh, R); c.fill(); } else c.fillRect(bx, by, bw, bh); };
  if(t === 'sofa' || t === 'armchair' || t === 'beanbag'){ if(t === 'beanbag'){ c.fillStyle = col; c.beginPath(); c.ellipse(x + W/2, yb - H*.45, W*.48, H*.55, 0, 0, 7); c.fill(); c.fillStyle = shade(col, .2); c.beginPath(); c.ellipse(x + W/2, yb - H*.7, W*.3, H*.25, 0, 0, 7); c.fill(); }
    else { legs(x + 2, yb - 8, W - 4, 8); rr(x + 2, yb - H, W - 4, H*.55, shade(col, -.15)); rr(x, yb - H*.62, W, H*.5, col); rr(x, yb - H*.75, T*.3, H*.65, shade(col, -.1)); rr(x + W - T*.3, yb - H*.75, T*.3, H*.65, shade(col, -.1)); for(let k=0;k<it.w;k++) rr(x + T*.32 + k*(W - T*.64)/it.w + 2, yb - H*.6, (W - T*.64)/it.w - 4, H*.22, shade(col, .15)); trim(x, yb - H, W, H*.9); } }
  else if(t === 'bed'){ legs(x, yb - 6, W, 6); box(x, y - T*.2, W, T*.6, wd); trim(x, y - T*.2, W, T*.6); rr(x + 2, y + T*.2, W - 4, D - T*.3, '#f5f5f5'); rr(x + 2, y + D*.4, W - 4, D*.55, col); box(x + 2, y + D*.4, W - 4, 4, shade(col, .3)); rr(x + 6, y + T*.28, W/2 - 8, T*.35, '#fff'); rr(x + W/2 + 2, y + T*.28, W/2 - 8, T*.35, '#fff'); }
  else if(t === 'dtable' || t === 'desk' || t === 'computer'){ legs(x + 2, yb - H*.75, W - 4, H*.75); top(x, yb - H, W, T*.35, t === 'dtable' ? col : wd); trim(x, yb - H, W, T*.35);
    if(t === 'dtable'){ c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + W/2, yb - H + 6, 8, 4, 0, 0, 7); c.fill(); c.fillStyle = '#ef5350'; c.fillRect(x + W/2 - 3, yb - H, 6, 5); }
    else if(t === 'computer'){ box(x + W*.3, yb - H - T*.75, W*.42, T*.55, '#212121'); box(x + W*.33, yb - H - T*.71, W*.36, T*.45, S.glow ? S.glow : '#4fc3f7'); box(x + W*.48, yb - H - T*.2, 4, T*.2, '#424242'); box(x + W*.25, yb - H + 3, W*.3, 4, col); }
    else { box(x + 6, yb - H - 10, 10, 10, col); box(x + W - 20, yb - H - 6, 14, 6, '#fafafa'); } }
  else if(t === 'chair'){ legs(x + 4, yb - H*.5, W - 8, H*.5); top(x + 3, yb - H*.62, W - 6, T*.25, wd); rr(x + 5, yb - H, W - 10, H*.42, col); trim(x + 5, yb - H, W - 10, H*.42); }
  else if(t === 'bookshelf' || t === 'display' || t === 'shelfw'){ const hh = it.cat === 'wall' ? T*.9 : H; const by = it.cat === 'wall' ? y + T*.2 : yb - hh; box(x, by, W, hh, wd); trim(x, by, W, hh); const rows = it.cat === 'wall' ? 1 : 3; for(let r=0;r<rows;r++){ const ry = by + 4 + r*(hh - 8)/rows; box(x + 3, ry + (hh - 8)/rows - 3, W - 6, 3, shade(wd, -.3)); for(let b = x + 5; b < x + W - 8; b += 6) box(b, ry + 3 + ((b*7) % 5), 4, (hh - 8)/rows - 7 - ((b*7) % 5), t === 'display' ? (b % 3 ? col : '#fff') : ['#c62828','#1565c0','#2e7d32','#f9a825',col][(b + r) % 5]); } }
  else if(t === 'wardrobe' || t === 'fridge' || t === 'glass'){ rr(x + 1, yb - H, W - 2, H, t === 'glass' ? 'rgba(200,235,255,.55)' : col); box(x + W/2 - 1, yb - H + 4, 2, H - 8, shade(col, -.3)); if(t === 'fridge'){ box(x + 2, yb - H*.62, W - 4, 2, shade(col, -.3)); box(x + W - 8, yb - H + 8, 3, 14, mt); } else { box(x + W/2 - 6, yb - H*.5, 3, 10, mt); box(x + W/2 + 3, yb - H*.5, 3, 10, mt); } if(t === 'glass'){ for(let k=0;k<3;k++) box(x + 6 + k*(W - 12)/3, yb - H*.45, (W - 12)/3 - 6, 10, ['#ffd23f','#b3e5fc','#f48fb1'][k]); c.strokeStyle = S.trim || mt; c.lineWidth = 2; c.strokeRect(x + 1, yb - H, W - 2, H); } trim(x + 1, yb - H, W - 2, H); }
  else if(t === 'lamp'){ box(x + W/2 - 2, yb - H*.75, 4, H*.75, mt); box(x + W/2 - 8, yb - 4, 16, 4, mt); c.fillStyle = col; c.beginPath(); c.moveTo(x + W/2 - 14, yb - H*.62); c.lineTo(x + W/2 + 14, yb - H*.62); c.lineTo(x + W/2 + 8, yb - H); c.lineTo(x + W/2 - 8, yb - H); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,240,170,.25)'; c.beginPath(); c.arc(x + W/2, yb - H*.62, 24, 0, 7); c.fill(); }
  else if(t === 'plant' || t === 'vase'){ const pot = t === 'plant' ? col : col; rr(x + W*.25, yb - H*.38, W*.5, H*.38, pot); trim(x + W*.25, yb - H*.38, W*.5, H*.38); if(t === 'plant'){ const g = ['#2e7d32','#388e3c','#43a047','#66bb6a']; for(let k=0;k<7;k++){ c.fillStyle = g[k%4]; c.beginPath(); c.ellipse(x + W/2 + Math.cos(k*.9)*W*.22, yb - H*.55 - Math.abs(Math.sin(k*1.7))*H*.35, W*.14, H*.16, k, 0, 7); c.fill(); } } else { ['#ff6f91','#ffd23f','#fff','#b06bff','#ef5350'].forEach((f, k) => { box(x + W/2 - 1 + (k - 2)*4, yb - H, 1, H*.6, '#43a047'); c.fillStyle = f; c.beginPath(); c.arc(x + W/2 + (k - 2)*5, yb - H - 2 + (k%2)*4, 4, 0, 7); c.fill(); }); } }
  else if(t === 'tv'){ legs(x + 2, yb - 10, W - 4, 10); top(x, yb - H*.35, W, H*.25, wd); box(x + W*.08, yb - H, W*.84, H*.6, '#111'); const g = c.createLinearGradient(x, yb - H, x + W, yb - H*.4); g.addColorStop(0, col); g.addColorStop(1, S.glow || '#4fc3f7'); c.fillStyle = g; c.fillRect(x + W*.1, yb - H + 2, W*.8, H*.56); trim(x + W*.08, yb - H, W*.84, H*.6); }
  else if(t === 'piano'){ legs(x + 4, yb - H*.45, W - 8, H*.45); rr(x, yb - H, W, H*.6, col); box(x + 4, yb - H*.55, W - 8, H*.14, '#fafafa'); for(let k = x + 6; k < x + W - 6; k += 7) box(k, yb - H*.55, 3, H*.08, '#111'); trim(x, yb - H, W, H*.6); }
  else if(t === 'aquarium'){ legs(x + 2, yb - H*.35, W - 4, H*.35); box(x, yb - H*.4, W, 6, wd); c.fillStyle = 'rgba(79,195,247,.7)'; c.fillRect(x + 2, yb - H, W - 4, H*.62); c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(x + 2, yb - H, W - 4, H*.62); for(let k=0;k<3;k++){ const fx = x + 10 + ((realT*20 + k*30) % (W - 24)); box(fx, yb - H*.85 + k*8, 7, 4, ['#ff7043','#ffd23f','#fff'][k]); } box(x + 6, yb - H*.46, W - 12, 4, '#ffe082'); trim(x + 2, yb - H, W - 4, H*.62); }
  else if(t === 'fireplace'){ rr(x, yb - H, W, H, col); box(x + W*.22, yb - H*.6, W*.56, H*.6, '#2b1a12'); for(let k=0;k<4;k++){ c.fillStyle = ['#ff6d00','#ffab00','#ffd600','#fff59d'][k]; const fh = H*.4*(1 - k*.2)*(0.85 + Math.random()*.3); c.beginPath(); c.moveTo(x + W*.32 + k*2, yb - 2); c.quadraticCurveTo(x + W/2, yb - fh*1.4, x + W*.68 - k*2, yb - 2); c.fill(); } box(x - 3, yb - H - 4, W + 6, 6, wd); trim(x, yb - H, W, H); }
  else if(t === 'stove'){ rr(x, yb - H, W, H, col); box(x, yb - H, W, 6, '#424242'); [x + W*.28, x + W*.72].forEach(cx => { c.strokeStyle = '#757575'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, yb - H + 3, 7, 3, 0, 0, 7); c.stroke(); }); box(x + 6, yb - H*.6, W - 12, H*.45, shade(col, -.2)); trim(x, yb - H, W, H); }
  else if(t === 'bathtub'){ rr(x + 2, yb - H - D*.6, W - 4, D*.6 + H, col); c.fillStyle = '#b3e5fc'; c.beginPath(); c.ellipse(x + W/2, yb - H - D*.25, W*.42, D*.22, 0, 0, 7); c.fill(); for(let k=0;k<5;k++){ c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x + W*.3 + k*W*.1, yb - H - D*.3 + (k%2)*4, 4, 0, 7); c.fill(); } box(x + W - 14, yb - H - D*.6 - 10, 4, 12, mt); trim(x + 2, yb - H - D*.6, W - 4, D*.6 + H); }
  else if(t === 'trophy'){ box(x + 2, yb - H, W - 4, H, wd); c.fillStyle = 'rgba(200,235,255,.5)'; c.fillRect(x + 5, yb - H + 4, W - 10, H*.6); c.fillStyle = col === '#222222' ? '#ffd23f' : col; c.fillRect(x + W/2 - 6, yb - H*.75, 12, 8); c.fillRect(x + W/2 - 2, yb - H*.67, 4, 8); c.fillRect(x + W/2 - 5, yb - H*.6, 10, 3); trim(x + 2, yb - H, W - 4, H); }
  else if(t === 'statue'){ box(x + 4, yb - H*.25, W - 8, H*.25, shade(col, -.2)); c.fillStyle = col; c.beginPath(); c.ellipse(x + W/2, yb - H*.5, W*.22, H*.25, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + W/2, yb - H*.82, W*.16, 0, 7); c.fill(); trim(x + 4, yb - H*.25, W - 8, H*.25); }
  else if(t === 'mirror' || t === 'mannequin'){ if(t === 'mirror'){ box(x + W*.15, yb - H, W*.7, H, wd); const g = c.createLinearGradient(x, yb - H, x + W, yb); g.addColorStop(0, '#e1f5fe'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#b3e5fc'); c.fillStyle = g; c.fillRect(x + W*.2, yb - H + 3, W*.6, H - 6); trim(x + W*.15, yb - H, W*.7, H); } else { box(x + W/2 - 1, yb - H*.3, 2, H*.3, mt); box(x + W/2 - 8, yb - 3, 16, 3, mt); rr(x + W*.25, yb - H*.85, W*.5, H*.55, col); c.fillStyle = '#e0c4a8'; c.beginPath(); c.arc(x + W/2, yb - H*.92, 6, 0, 7); c.fill(); } }
  else if(t === 'counter'){ rr(x, yb - H, W, H, col); top(x - 2, yb - H - 4, W + 4, 8, wd); box(x + W - 26, yb - H - 18, 18, 14, '#37474f'); box(x + W - 24, yb - H - 16, 14, 7, '#4fc3f7'); trim(x, yb - H, W, H); }
  else if(t === 'rug' || t === 'rugr'){ c.fillStyle = col; if(t === 'rugr'){ c.beginPath(); c.ellipse(x + W/2, y + D/2, W/2 - 2, D/2 - 2, 0, 0, 7); c.fill(); c.strokeStyle = shade(col, .3); c.lineWidth = 3; c.beginPath(); c.ellipse(x + W/2, y + D/2, W/2 - 10, D/2 - 10, 0, 0, 7); c.stroke(); } else { c.fillRect(x + 2, y + 2, W - 4, D - 4); c.strokeStyle = shade(col, .35); c.lineWidth = 3; c.strokeRect(x + 8, y + 8, W - 16, D - 16); if(S.plaid || S.paper){ c.fillStyle = 'rgba(0,0,0,.08)'; for(let k = x + 4; k < x + W; k += 12) c.fillRect(k, y + 2, 4, D - 4); } } trim(x + 2, y + 2, W - 4, D - 4); }
  else if(t === 'painting' || t === 'sign' || t === 'neon' || t === 'window' || t === 'curtain' || t === 'clock'){ const wy = y + T*.25, wh = T*1.2;
    if(t === 'painting'){ box(x + 4, wy, W - 8, wh, S.trim || wd); const g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#81d4fa'); g.addColorStop(1, col); c.fillStyle = g; c.fillRect(x + 9, wy + 5, W - 18, wh - 10); c.fillStyle = shade(col, -.3); c.beginPath(); c.moveTo(x + 9, wy + wh - 5); c.lineTo(x + W*.4, wy + wh*.45); c.lineTo(x + W*.62, wy + wh*.7); c.lineTo(x + W - 9, wy + wh*.4); c.lineTo(x + W - 9, wy + wh - 5); c.fill(); c.fillStyle = '#fff59d'; c.beginPath(); c.arc(x + W*.7, wy + wh*.3, 5, 0, 7); c.fill(); }
    else if(t === 'window' || t === 'curtain'){ box(x + 6, wy, W - 12, wh, '#fff'); const g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#4fc3f7'); g.addColorStop(1, '#e1f5fe'); c.fillStyle = g; c.fillRect(x + 10, wy + 4, W - 20, wh - 8); box(x + W/2 - 1, wy, 2, wh, '#fff'); if(t === 'curtain'){ c.fillStyle = col; c.fillRect(x + 2, wy - 6, W*.3, wh + 12); c.fillRect(x + W*.7 - 2, wy - 6, W*.3, wh + 12); c.fillStyle = 'rgba(0,0,0,.12)'; for(let k=0;k<4;k++){ c.fillRect(x + 6 + k*5, wy - 6, 2, wh + 12); c.fillRect(x + W*.7 + 2 + k*5, wy - 6, 2, wh + 12); } box(x, wy - 8, W, 4, mt); } else box(x + 6, wy + wh - 4, W - 12, 6, wd); }
    else if(t === 'clock'){ c.fillStyle = S.trim || wd; c.beginPath(); c.arc(x + W/2, wy + wh/2, T*.45, 0, 7); c.fill(); c.fillStyle = col === '#222222' ? '#fafafa' : '#fff'; c.beginPath(); c.arc(x + W/2, wy + wh/2, T*.38, 0, 7); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; const a1 = realT*.2, a2 = realT*2; c.beginPath(); c.moveTo(x + W/2, wy + wh/2); c.lineTo(x + W/2 + Math.cos(a1)*8, wy + wh/2 + Math.sin(a1)*8); c.moveTo(x + W/2, wy + wh/2); c.lineTo(x + W/2 + Math.cos(a2)*13, wy + wh/2 + Math.sin(a2)*13); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(x + W/2, wy + wh/2, 3, 0, 7); c.fill(); }
    else if(t === 'sign'){ box(x + 2, wy, W - 4, wh*.7, col); trim(x + 2, wy, W - 4, wh*.7); c.fillStyle = shade(col, .7); c.font = `${Math.round(T*.32)}px Bungee, sans-serif`; c.textAlign = 'center'; c.fillText((it.label || 'SHOP').slice(0, 14), x + W/2, wy + wh*.45); c.textAlign = 'left'; }
    else if(t === 'neon'){ c.shadowColor = col; c.shadowBlur = 14; c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(x + 6, wy + 4, W - 12, wh*.6); c.fillStyle = col; c.font = `${Math.round(T*.34)}px Bungee, sans-serif`; c.textAlign = 'center'; c.fillText(it.label || 'OPEN', x + W/2, wy + wh*.45); c.textAlign = 'left'; c.shadowBlur = 0; } }
  else if(t === 'shelfw'){ }
  else if(t === 'chandelier' || t === 'pendant'){ const cx = x + W/2, cy = y + D/2 - T*.6; c.strokeStyle = mt; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy - T*.8); c.lineTo(cx, cy); c.stroke(); if(t === 'pendant'){ c.fillStyle = col; c.beginPath(); c.moveTo(cx - 12, cy + 10); c.lineTo(cx + 12, cy + 10); c.lineTo(cx + 5, cy); c.lineTo(cx - 5, cy); c.fill(); c.fillStyle = 'rgba(255,240,170,.25)'; c.beginPath(); c.arc(cx, cy + 14, 18, 0, 7); c.fill(); } else { c.strokeStyle = S.trim || col; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy + 8, W*.38, 8, 0, 0, Math.PI); c.stroke(); for(let k=0;k<5;k++){ const lx = cx - W*.36 + k*W*.18; c.fillStyle = '#fff59d'; c.fillRect(lx - 2, cy + 8, 4, 8); c.fillStyle = 'rgba(255,240,170,.3)'; c.beginPath(); c.arc(lx, cy + 10, 10, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(lx, cy + 18); c.lineTo(lx - 3, cy + 24); c.lineTo(lx + 3, cy + 24); c.fill(); } } }
  c.restore();
}
function drawWallFloor(c, wallKey, floorKey, Wd, Ht, T, wallRows){
  const wl = wallKey ? mallItem(wallKey) : null, fl = floorKey ? mallItem(floorKey) : null, wc = wl ? wl.col : '#e8e2d0', fc = fl ? fl.col : '#c9a77c', wh = wallRows*T;
  c.fillStyle = wc; c.fillRect(0, 0, Wd, wh); const wp = wl ? wl.pat : 'tron';
  c.fillStyle = shade(wc, -.12);
  if(wp === 'soc') for(let x=0;x<Wd;x+=24) c.fillRect(x, 0, 10, wh); else if(wp === 'caro') for(let x=0;x<Wd;x+=24) for(let y=0;y<wh;y+=24) if(((x + y)/24) % 2) c.fillRect(x, y, 24, 24); else if(wp === 'hoa') for(let x=10;x<Wd;x+=36) for(let y=10;y<wh;y+=30){ c.beginPath(); c.arc(x + ((y/30) % 2)*18, y, 4, 0, 7); c.fill(); } else if(wp === 'gach'){ for(let y=0;y<wh;y+=16) for(let x=((y/16) % 2)*20; x<Wd; x+=40){ c.fillRect(x, y, 2, 16); } for(let y=0;y<wh;y+=16) c.fillRect(0, y, Wd, 2); } else if(wp === 'go'){ for(let x=0;x<Wd;x+=18) c.fillRect(x, 0, 2, wh); }
  c.fillStyle = shade(wc, -.3); c.fillRect(0, wh - 8, Wd, 8);
  c.fillStyle = fc; c.fillRect(0, wh, Wd, Ht - wh); const fp = fl ? fl.pat : 'go';
  if(fp === 'go'){ c.fillStyle = shade(fc, -.12); for(let y = wh; y < Ht; y += 16){ c.fillRect(0, y, Wd, 1.5); for(let x = ((y/16) % 3)*30; x < Wd; x += 90) c.fillRect(x, y, 1.5, 16); } }
  else if(fp === 'gach' || fp === 'caro'){ for(let y = wh; y < Ht; y += T) for(let x=0;x<Wd;x+=T){ c.fillStyle = fp === 'caro' && ((x + y - wh)/T) % 2 ? shade(fc, -.35) : shade(fc, .08); c.fillRect(x + 1, y + 1, T - 2, T - 2); } }
  else if(fp === 'da'){ c.strokeStyle = shade(fc, -.18); c.lineWidth = 1; for(let k=0;k<40;k++){ c.beginPath(); const sx = (k*97) % Wd, sy = wh + (k*61) % (Ht - wh); c.moveTo(sx, sy); c.quadraticCurveTo(sx + 30, sy + 10, sx + 60, sy - 6); c.stroke(); } }
  else if(fp === 'tham'){ c.fillStyle = shade(fc, .08); for(let k=0;k<600;k++) c.fillRect((k*37) % Wd, wh + (k*53) % (Ht - wh), 2, 2); }
  else if(fp === 'tatami'){ c.strokeStyle = shade(fc, -.25); c.lineWidth = 2; for(let y = wh; y < Ht; y += T) for(let x = ((y - wh)/T % 2)*T; x < Wd; x += T*2) c.strokeRect(x + 1, y + 1, T*2 - 2, T - 2); }
}
// ---------- mall UI ----------
var MALL = {tab:'furn', sty:'', col:'', q:'', sort:'price', page:0};
const MALL_TABS = [['furn','Nội thất'], ['wall','Đồ treo tường'], ['ceil','Đèn trần'], ['floor','Thảm'], ['wf','Tường & sàn'], ['shop','Đồ cửa hàng'], ['fashion','Thời trang'], ['jewel','Trang sức quý']];
function mallList(){
  const q = MALL.q.trim().toLowerCase();
  return mallKeys().map(mallItem).filter(it => { if(!it) return false;
    const tab = it.kind === 'decor' ? it.cat : it.kind === 'wallp' || it.kind === 'floorp' ? 'wf' : it.kind === 'outfit' ? 'fashion' : 'jewel';
    if(tab !== MALL.tab) return false; if(MALL.sty && !it.key.includes('|' + MALL.sty + '|')) return false; if(MALL.col && !(it.key.endsWith('|' + MALL.col) || it.key.split('|')[2] === MALL.col)) return false; return !q || it.name.toLowerCase().includes(q); })
    .sort((a, b) => MALL.sort === 'price' ? a.price - b.price : MALL.sort === 'pricedesc' ? b.price - a.price : a.name.localeCompare(b.name));
}
function openMall(tab){ if(!PROF){ openLogin(); return; } if(tab) MALL.tab = tab; showModal('mMall'); renderMall(); mprog('mall'); }
function renderMall(){
  const tabs = $('#mallTabs'); tabs.innerHTML = ''; MALL_TABS.forEach(([k, n]) => { const b = el('button', {type:'button'}, n); b.setAttribute('aria-pressed', k === MALL.tab); b.onclick = () => { MALL.tab = k; MALL.page = 0; renderMall(); }; tabs.appendChild(b); });
  $('#mallMoney').textContent = `$${PROF.money.toLocaleString('vi')} · Level ${PROF.level} · đã đọc ${booksDone()} sách`;
  const list = mallList(), per = 24, pages = Math.max(1, Math.ceil(list.length/per)); MALL.page = Math.min(MALL.page, pages - 1);
  $('#mallCount').textContent = `${list.length.toLocaleString('vi')} sản phẩm · trang ${MALL.page + 1}/${pages} · toàn trung tâm có ${mallKeys().length.toLocaleString('vi')} sản phẩm`;
  const g = $('#mallGrid'); g.innerHTML = '';
  list.slice(MALL.page*per, MALL.page*per + per).forEach((it, i) => {
    const own = bagN(it.key), rq = reqText(it), card = el('div', {className:'scard' + (rq ? ' lock' : '')}); card.style.animationDelay = i*20 + 'ms';
    const cv = el('canvas', {width:140, height:105}); card.appendChild(cv); mallPreview(cv, it);
    const n = el('div', {className:'sname'}); n.textContent = it.name; card.appendChild(n);
    const d = el('div', {className:'sdesc'}); d.textContent = `$${it.price.toLocaleString('vi')}${own ? ` · đang có ${own}` : ''}${rq ? ' · ' + rq : ''}`; card.appendChild(d);
    const row = el('div', {className:'row'}); const b = el('button', {type:'button', className:rq ? '' : 'primary'}); b.textContent = rq ? 'Chưa đủ điều kiện' : `Mua $${it.price.toLocaleString('vi')}`; b.disabled = !!rq || PROF.money < it.price; b.onclick = () => mallBuy(it); row.appendChild(b);
    if(own && (it.kind === 'outfit' || it.kind === 'jewel')){ const e = el('button', {type:'button'}); const on = PROF.equip[it.slot] === it.key; e.textContent = on ? 'Đang đeo · Tháo' : 'Mặc / đeo'; e.onclick = () => { PROF.equip[it.slot] = on ? null : it.key; afterEquip(); renderMall(); }; row.appendChild(e); }
    card.appendChild(row); g.appendChild(card);
  });
  $('#mallPrev').disabled = MALL.page === 0; $('#mallNext').disabled = MALL.page >= pages - 1;
}
function mallBuy(it){ if(reqText(it) || PROF.money < it.price) return; PROF.money -= it.price; bagAdd(it.key); floatText(`-$${it.price.toLocaleString('vi')}`, '#ef4b4b'); blipSfx(1320); toast(`Đã mua ${it.name}! Vào "Nhà của tôi" để bày trí.`); log('event', `${PROF.name} mua ${it.name} ($${it.price}).`); mprog('mallbuy'); renderProfHud(); saveProfile(); renderMall(); }
function mallPreview(cv, it){
  const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); const g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#2a3668'); g.addColorStop(1, '#141b3a'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
  if(it.kind === 'decor'){ const vh = it.cat === 'wall' ? 1.7 : it.cat === 'ceil' ? 1.6 : it.d + it.h/48, T = Math.min(64, (cv.width - 20)/it.w, (cv.height - 18)/Math.max(.8, vh)), W = it.w*T, D = it.d*T; c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, cv.height - 22, cv.width, 22); drawDecor(c, it, (cv.width - W)/2, it.cat === 'wall' ? 6 : it.cat === 'ceil' ? cv.height*.55 : cv.height - 8 - D, T, false); }
  else if(it.kind === 'wallp' || it.kind === 'floorp'){ c.save(); c.beginPath(); c.rect(10, 8, cv.width - 20, cv.height - 16); c.clip(); c.translate(10, 8); drawWallFloor(c, it.kind === 'wallp' ? it.key : null, it.kind === 'floorp' ? it.key : null, cv.width - 20, cv.height - 16, 22, it.kind === 'wallp' ? 4 : 0); c.restore(); }
  else { withCtx(c, () => { ctx.save(); ctx.translate(70, 96); ctx.scale(2.6, 2.6); const f = lookFor(3); applyLook(f, Object.assign({}, PROF.look)); const L = Object.assign({}, PROF.look); if(it.kind === 'outfit'){ L.outfit = it.o; f.shirt = it.c; L.shirt = it.c; if(it.p) f.pants = it.p; if(it.skirt) f.skirt = true; } else if(it.slot === 'hat'){ L.hat = it.o; L.hatC = it.col; } else { L.acc = [it.o]; L.accC = {[it.o]:it.col}; } f.style = L; f.dir = 1; drawBody(f, false); ctx.restore(); }); }
}
function ext14Init(){
  const ss = $('#mallSty'); ss.appendChild(el('option', {value:''}, 'Mọi phong cách')); MSTY.forEach(s => ss.appendChild(el('option', {value:s[0]}, s[1])));
  const cs = $('#mallCol'); cs.appendChild(el('option', {value:''}, 'Mọi màu')); MCOL.forEach(c => cs.appendChild(el('option', {value:c[0]}, c[1])));
  ss.onchange = e => { MALL.sty = e.target.value; MALL.page = 0; renderMall(); }; cs.onchange = e => { MALL.col = e.target.value; MALL.page = 0; renderMall(); };
  $('#mallSort').onchange = e => { MALL.sort = e.target.value; renderMall(); }; $('#mallQ').oninput = e => { MALL.q = e.target.value; MALL.page = 0; clearTimeout(MALL.qt); MALL.qt = setTimeout(renderMall, 200); };
  $('#mallPrev').onclick = () => { MALL.page--; renderMall(); }; $('#mallNext').onclick = () => { MALL.page++; renderMall(); };
}

// ================= EXT15: HOME & SHOP DECOR EDITOR =================
const RT = 48, RC = 16, RR = 11, RWALL = 2;
var ROOM = {mode:'home', data:null, sel:-1, pick:null, hover:null, drag:null, owner:'', readonly:false, raf:0, listings:null};
function homeData(){ PROF.home = PROF.home || {wall:null, floor:null, items:[]}; return PROF.home; }
function shopData(){ PROF.myshop = PROF.myshop || {name:PROF.name + ' Shop', wall:null, floor:null, items:[], listings:[], sales:0, earned:0}; return PROF.myshop; }
function openRoom(mode){
  if(!PROF){ openLogin(); return; }
  ROOM.mode = mode; ROOM.readonly = false; ROOM.data = mode === 'shop' ? shopData() : homeData(); ROOM.sel = -1; ROOM.pick = null; ROOM.owner = PROF.name;
  showModal('mRoom'); $('#roomT').textContent = mode === 'shop' ? 'Cửa hàng của tôi' : 'Nhà của tôi'; $('#roomShopBox').hidden = mode !== 'shop'; $('#roomBagBox').hidden = false; $('#roomVisit').hidden = true;
  if(mode === 'shop') $('#shopName').value = ROOM.data.name;
  roomBag(); roomStart(); roomInfo(); if(mode === 'shop') renderListings();
}
function openVisit(title, data, listings, onBuy){ ROOM.mode = 'visit'; ROOM.readonly = true; ROOM.data = data; ROOM.sel = -1; ROOM.pick = null; showModal('mRoom'); $('#roomT').textContent = title; $('#roomShopBox').hidden = true; $('#roomBagBox').hidden = true; const v = $('#roomVisit'); v.hidden = false; v.innerHTML = ''; ROOM.visitBuy = onBuy; ROOM.listings = listings || []; renderVisitList(); roomStart(); roomInfo(); }
function roomStart(){ const cv = $('#roomCv'); cv.width = RC*RT; cv.height = RR*RT; cancelAnimationFrame(ROOM.raf); ROOM.raf = requestAnimationFrame(roomLoop); }
function roomLoop(){ if(!openModal || openModal.id !== 'mRoom'){ ROOM.raf = 0; return; } roomDraw(); ROOM.raf = requestAnimationFrame(roomLoop); }
const itemFoot = (key, flip) => { const it = mallItem(key); return it ? {w:it.w, d:it.d, cat:it.cat} : {w:1, d:1, cat:'furn'}; };
function canPlace(key, tx, ty, ignore){
  const it = mallItem(key); if(!it) return false; const f = itemFoot(key);
  if(tx < 0 || tx + f.w > RC) return false;
  if(it.cat === 'wall'){ if(ty !== 0) return false; } else { if(ty < RWALL || ty + f.d > RR) return false; }
  const layer = c => c === 'wall' ? 'w' : c === 'floor' ? 'f' : c === 'ceil' ? 'c' : 'o', L = layer(it.cat); if(L === 'c') return true;
  return !ROOM.data.items.some((p, i) => { if(i === ignore) return false; const o = mallItem(p[0]); if(!o || layer(o.cat) !== L) return false; return tx < p[1] + o.w && tx + f.w > p[1] && ty < p[2] + o.d && ty + f.d > p[2]; });
}
function roomDraw(){
  const cv = $('#roomCv'), c = cv.getContext('2d'), D = ROOM.data; c.clearRect(0, 0, cv.width, cv.height);
  drawWallFloor(c, D.wall, D.floor, cv.width, cv.height, RT, RWALL);
  const items = D.items.map((p, i) => ({p, i, it:mallItem(p[0])})).filter(o => o.it);
  const label = ROOM.mode === 'shop' ? D.name : ROOM.mode === 'visit' ? (D.name || '') : (PROF ? PROF.name : '');
  const draw = o => { const it = Object.assign({}, o.it, {label:(label || '').toUpperCase()}); drawDecor(c, it, o.p[1]*RT, o.p[2]*RT, RT, !!o.p[3]); if(o.i === ROOM.sel){ c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.setLineDash([6, 4]); c.strokeRect(o.p[1]*RT + 1, o.p[2]*RT + 1, it.w*RT - 2, (it.cat === 'wall' ? 2 : it.d)*RT - 2); c.setLineDash([]); } };
  items.filter(o => o.it.cat === 'wall').forEach(draw); items.filter(o => o.it.cat === 'floor').forEach(draw);
  items.filter(o => !['wall','floor','ceil'].includes(o.it.cat)).sort((a, b) => (a.p[2] + a.it.d) - (b.p[2] + b.it.d)).forEach(draw);
  items.filter(o => o.it.cat === 'ceil').forEach(draw);
  if(ROOM.mode === 'shop' || ROOM.mode === 'visit'){ const L = ROOM.mode === 'shop' ? D.listings : ROOM.listings; (L || []).slice(0, 8).forEach((l, k) => { const x = 12 + (k % 4)*120, y = cv.height - 40 - Math.floor(k/4)*34; c.fillStyle = 'rgba(10,15,34,.75)'; c.fillRect(x, y, 112, 28); c.fillStyle = '#ffd23f'; c.font = '15px VT323, monospace'; const it = itemOf(l[1]); c.fillText(`$${(+l[2]).toLocaleString('vi')}`, x + 6, y + 12); c.fillStyle = '#fff'; c.fillText((it ? it.name : '?').slice(0, 16), x + 6, y + 24); }); }
  if(ROOM.pick && ROOM.hover){ const it = mallItem(ROOM.pick); if(it){ const [tx, ty] = ROOM.hover, ok = canPlace(ROOM.pick, tx, it.cat === 'wall' ? 0 : ty); c.globalAlpha = .6; drawDecor(c, it, tx*RT, (it.cat === 'wall' ? 0 : ty)*RT, RT, false); c.globalAlpha = 1; c.strokeStyle = ok ? '#2fbf71' : '#ef4b4b'; c.lineWidth = 3; c.strokeRect(tx*RT, (it.cat === 'wall' ? 0 : ty)*RT, it.w*RT, (it.cat === 'wall' ? 2 : it.d)*RT); } }
  if(!ROOM.readonly){ c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 1; for(let x=0;x<=RC;x++){ c.beginPath(); c.moveTo(x*RT, RWALL*RT); c.lineTo(x*RT, RR*RT); c.stroke(); } for(let y=RWALL;y<=RR;y++){ c.beginPath(); c.moveTo(0, y*RT); c.lineTo(RC*RT, y*RT); c.stroke(); } }
}
function roomValue(D){ let v = 0; D.items.forEach(p => { v += valueOf(p[0]); }); if(D.wall) v += valueOf(D.wall); if(D.floor) v += valueOf(D.floor); return v; }
function roomInfo(){ const D = ROOM.data, v = roomValue(D), lux = v < 5000 ? 'Ấm cúng' : v < 20000 ? 'Tiện nghi' : v < 60000 ? 'Sang trọng' : v < 150000 ? 'Xa hoa' : 'Lâu đài hoàng gia'; $('#roomInfo').textContent = `${D.items.length} món đồ · tổng giá trị $${v.toLocaleString('vi')} · phong cách: ${lux}` + (ROOM.readonly ? '' : ' · Chọn đồ trong túi rồi bấm vào phòng để đặt, kéo để di chuyển.'); }
function roomBag(){
  const box = $('#roomBag'); box.innerHTML = ''; const keys = Object.keys(PROF.bag || {}).filter(k => { const it = mallItem(k); return it && (it.kind === 'decor' || it.kind === 'wallp' || it.kind === 'floorp'); });
  if(!keys.length){ box.appendChild(el('p', {className:'now'}, 'Túi đồ trang trí trống. Vào Trung tâm thương mại để mua nội thất, giấy dán tường, sàn nhà.')); }
  keys.sort().forEach(k => { const it = mallItem(k), b = el('button', {type:'button', className:'bagi'}); const cv = el('canvas', {width:70, height:52}); mallPreviewSmall(cv, it); b.appendChild(cv); const s = el('span'); s.textContent = `${it.name} ×${PROF.bag[k]}`; b.appendChild(s); b.setAttribute('aria-pressed', ROOM.pick === k);
    b.onclick = () => { if(it.kind === 'wallp' || it.kind === 'floorp'){ const f = it.kind === 'wallp' ? 'wall' : 'floor'; if(ROOM.data[f]) bagAdd(ROOM.data[f]); ROOM.data[f] = k; bagAdd(k, -1); roomSaved(); roomBag(); return; } ROOM.pick = ROOM.pick === k ? null : k; ROOM.sel = -1; roomBag(); }; box.appendChild(b); });
  const hasWF = ROOM.data.wall || ROOM.data.floor; $('#roomResetWF').hidden = !hasWF;
  if(ROOM.mode === 'shop') renderListings();
}
function mallPreviewSmall(cv, it){ const c = cv.getContext('2d'); c.fillStyle = '#1d2547'; c.fillRect(0, 0, cv.width, cv.height); if(it.kind === 'decor'){ const T = Math.min(40, 64/it.w, 46/Math.max(.8, it.cat === 'wall' ? 1.7 : it.cat === 'ceil' ? 1.6 : it.d + it.h/48)); drawDecor(c, it, (cv.width - it.w*T)/2, it.cat === 'wall' ? 4 : it.cat === 'ceil' ? 26 : cv.height - 6 - it.d*T, T, false); } else drawWallFloor(c, it.kind === 'wallp' ? it.key : null, it.kind === 'floorp' ? it.key : null, cv.width, cv.height, 14, it.kind === 'wallp' ? 4 : 0); }
function roomSaved(){ roomInfo(); saveProfile(); if(ROOM.mode === 'shop' && typeof publishShop === 'function') publishShop(); if(ROOM.mode === 'home' && typeof publishHome === 'function') publishHome(); }
function roomPos(e){ const cv = $('#roomCv'), r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left)/r.width*RC), Math.floor((e.clientY - r.top)/r.height*RR)]; }
function roomHit(tx, ty){ const D = ROOM.data; for(let i = D.items.length - 1; i >= 0; i--){ const p = D.items[i], it = mallItem(p[0]); if(!it) continue; const h = it.cat === 'wall' ? 2 : it.d; if(tx >= p[1] && tx < p[1] + it.w && ty >= p[2] - (it.cat === 'wall' || it.cat === 'floor' ? 0 : Math.ceil(it.h/RT)) && ty < p[2] + h) return i; } return -1; }
function ext15Init(){
  const cv = $('#roomCv');
  cv.addEventListener('pointermove', e => { if(ROOM.readonly) return; const [tx, ty] = roomPos(e); ROOM.hover = [tx, ty]; if(ROOM.drag && ROOM.sel >= 0){ const p = ROOM.data.items[ROOM.sel], it = mallItem(p[0]); const nx = clampV(tx - ROOM.drag.ox, 0, RC - it.w), ny = it.cat === 'wall' ? 0 : clampV(ty - ROOM.drag.oy, RWALL, RR - it.d); if(canPlace(p[0], nx, ny, ROOM.sel)){ p[1] = nx; p[2] = ny; ROOM.drag.moved = true; } } });
  cv.addEventListener('pointerleave', () => { ROOM.hover = null; });
  cv.addEventListener('pointerdown', e => { if(ROOM.readonly) return; const [tx, ty] = roomPos(e);
    if(ROOM.pick){ const it = mallItem(ROOM.pick), y = it.cat === 'wall' ? 0 : ty; if(bagN(ROOM.pick) > 0 && canPlace(ROOM.pick, tx, y)){ ROOM.data.items.push([ROOM.pick, tx, y, 0]); bagAdd(ROOM.pick, -1); blipSfx(1100); mprog('decor'); if(!bagN(ROOM.pick)) ROOM.pick = null; roomBag(); roomSaved(); } else chessSfx('illegal'); return; }
    const i = roomHit(tx, ty); ROOM.sel = i; if(i >= 0){ const p = ROOM.data.items[i]; ROOM.drag = {ox:tx - p[1], oy:ty - p[2], moved:false}; cv.setPointerCapture(e.pointerId); } $('#roomSelBox').hidden = i < 0; });
  ['pointerup','pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if(ROOM.drag && ROOM.drag.moved) roomSaved(); ROOM.drag = null; }));
  $('#roomFlip').onclick = () => { const p = ROOM.data.items[ROOM.sel]; if(p){ p[3] = p[3] ? 0 : 1; roomSaved(); } };
  $('#roomStore').onclick = () => { const p = ROOM.data.items[ROOM.sel]; if(!p) return; bagAdd(p[0]); ROOM.data.items.splice(ROOM.sel, 1); ROOM.sel = -1; $('#roomSelBox').hidden = true; roomBag(); roomSaved(); };
  $('#roomResetWF').onclick = () => { ['wall','floor'].forEach(f => { if(ROOM.data[f]){ bagAdd(ROOM.data[f]); ROOM.data[f] = null; } }); roomBag(); roomSaved(); };
  $('#shopName').onchange = e => { shopData().name = e.target.value.slice(0, 24) || (PROF.name + ' Shop'); roomSaved(); };
  $('#listAdd').onclick = addListing;
  document.addEventListener('keydown', e => { if(openModal && openModal.id === 'mRoom' && e.key === 'Delete' && ROOM.sel >= 0 && !ROOM.readonly) $('#roomStore').click(); });
}
// ---------- listings in my shop ----------
function tradableKeys(){ const ks = Object.keys(PROF.bag || {}).filter(k => PROF.bag[k] > 0 && itemOf(k)); SHOP.forEach(it => { if(PROF.inv[it.id] && !Object.values(PROF.equip).includes(it.id)) ks.push('g:' + it.id); }); return ks; }
function takeItem(k){ if(k.startsWith('g:')){ const id = k.slice(2); if(!PROF.inv[id] || Object.values(PROF.equip).includes(id)) return false; delete PROF.inv[id]; return true; } if(bagN(k) <= 0) return false; bagAdd(k, -1); return true; }
function giveItem(k){ if(k.startsWith('g:')){ PROF.inv[k.slice(2)] = Date.now(); } else bagAdd(k); }
function renderListings(){
  const sel = $('#listItem'); sel.innerHTML = ''; tradableKeys().forEach(k => { const it = itemOf(k); sel.appendChild(el('option', {value:k}, `${it.name}${k.startsWith('g:') ? '' : ' ×' + bagN(k)} · giá gốc $${it.price}`)); });
  const box = $('#listBox'); box.innerHTML = ''; const S = shopData();
  $('#shopStats').textContent = `Đã bán ${S.sales} món · thu được $${(S.earned || 0).toLocaleString('vi')}`;
  if(!S.listings.length) box.appendChild(el('p', {className:'now'}, 'Chưa bày bán món nào.'));
  S.listings.forEach((l, i) => { const it = itemOf(l[1]); const d = el('div', {className:'lbrow'}); const s = el('span'); s.textContent = `${it ? it.name : l[1]} · $${(+l[2]).toLocaleString('vi')}`; d.appendChild(s); const b = el('button', {type:'button'}); b.textContent = 'Thu về'; b.onclick = () => { giveItem(l[1]); S.listings.splice(i, 1); renderListings(); roomSaved(); }; d.appendChild(b); box.appendChild(d); });
}
function addListing(){ const k = $('#listItem').value, price = Math.round(+$('#listPrice').value); if(!k) return; if(!(price >= 1 && price <= 1e7)){ toast('Nhập giá bán từ $1 trở lên.'); return; } const S = shopData(); if(S.listings.length >= 24){ toast('Cửa hàng bày tối đa 24 món.'); return; } if(!takeItem(k)){ toast('Không lấy được món này.'); return; } S.listings.push([Math.random().toString(36).slice(2, 9), k, price]); afterEquip(); renderListings(); roomSaved(); toast('Đã bày bán! Khách NPC và người chơi khác có thể mua.'); mprog('sell'); }

// ================= EXT16: PLAYER MARKET, MAIL, GIFTS, LIVE TRADE, NPC CUSTOMERS =================
var MKT = {tab:'shops', shops:[], homes:[], players:[], tr:null, busy:false};
const nowId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function mlog(t){ PROF.mailLog = PROF.mailLog || []; PROF.mailLog.unshift({t, at:Date.now()}); PROF.mailLog = PROF.mailLog.slice(0, 40); }
var pubT = {};
function pubLater(k, f){ clearTimeout(pubT[k]); pubT[k] = setTimeout(f, 1500); }
function publishShop(){ pubLater('shop', async () => { const db = await cloudInit(); if(!db || !CLOUD.uid || !PROF || !PROF.myshop) return; const S = PROF.myshop; try { await db.doc(`shops/${CLOUD.uid}`).set({n:S.name.slice(0, 24), o:PROF.name, lvl:PROF.level, wall:S.wall || '', floor:S.floor || '', items:JSON.stringify(S.items).slice(0, 60000), listings:JSON.stringify(S.listings), at:Date.now()}); } catch(e){} }); }
function publishHome(){ pubLater('home', async () => { const db = await cloudInit(); if(!db || !CLOUD.uid || !PROF || !PROF.home) return; const H = PROF.home; try { await db.doc(`homes/${CLOUD.uid}`).set({o:PROF.name, lvl:PROF.level, wall:H.wall || '', floor:H.floor || '', items:JSON.stringify(H.items).slice(0, 60000), val:roomValue(H), at:Date.now()}); } catch(e){} }); }
function postMail(msg){ PROF.mailOut = (PROF.mailOut || []).concat([Object.assign({at:Date.now()}, msg)]).slice(-80); saveProfile(); pubLater('mail', async () => { const db = await cloudInit(); if(!db || !CLOUD.uid) return; try { await db.doc(`mail/${CLOUD.uid}`).set({o:PROF.name, m:JSON.stringify(PROF.mailOut), at:Date.now()}); } catch(e){} }); }
const parseJ = (s, d) => { try { const v = JSON.parse(s); return v == null ? d : v; } catch(e){ return d; } };
async function processMail(){
  if(!PROF || MKT.busy) return; const db = await cloudInit(); if(!db || !CLOUD.uid) return; MKT.busy = true;
  try {
    const q = await db.collection('mail').limit(300).get(); const seen = PROF.mailSeen = PROF.mailSeen || {}; let changed = false;
    const boxes = q.docs.map(d => ({uid:d.id, d:d.data() || {}})).map(b => ({uid:b.uid, name:String(b.d.o || 'Ai đó').slice(0, 20), msgs:parseJ(b.d.m, [])}));
    const cancels = new Set(); boxes.forEach(b => b.msgs.forEach(m => { if(m && m.ty === 'cancel') cancels.add(b.uid + ':' + m.oid); }));
    boxes.forEach(b => { if(b.uid === CLOUD.uid) return; b.msgs.forEach(m => { if(!m || m.to !== CLOUD.uid || !m.id || seen[b.uid + ':' + m.id]) return; seen[b.uid + ':' + m.id] = Date.now(); changed = true;
      if(m.ty === 'buy'){ const S = shopData(), i = S.listings.findIndex(l => l[0] === m.lid);
        if(i >= 0 && !cancels.has(b.uid + ':' + m.id) && +m.price === +S.listings[i][2]){ const l = S.listings.splice(i, 1)[0]; PROF.money += +l[2]; S.sales = (S.sales || 0) + 1; S.earned = (S.earned || 0) + (+l[2]); postMail({id:'d' + m.id, to:b.uid, ty:'deliver', oid:m.id, key:l[1]}); mlog(`${b.name} đã mua ${itemOf(l[1]) ? itemOf(l[1]).name : 'một món'} với giá $${l[2]}.`); toast(`${b.name} vừa mua hàng ở cửa hàng của bạn! +$${l[2]}`); reward(20, 0, null, true); publishShop(); }
        else postMail({id:'r' + m.id, to:b.uid, ty:'refund', oid:m.id}); }
      else if(m.ty === 'deliver' || m.ty === 'refund'){ const e = (PROF.escrow || []).find(x => x.oid === m.oid && x.seller === b.uid); if(!e) return; PROF.escrow = PROF.escrow.filter(x => x !== e);
        if(m.ty === 'deliver'){ giveItem(m.key); mlog(`Đã nhận ${itemOf(m.key) ? itemOf(m.key).name : 'món hàng'} từ cửa hàng của ${b.name}.`); toast(`Đã nhận hàng từ ${b.name}!`); mprog('buyp2p'); } else { PROF.money += e.price; mlog(`Đơn hàng ở cửa hàng ${b.name} không thành công, đã hoàn $${e.price}.`); } }
      else if(m.ty === 'gift'){ if(m.key) giveItem(m.key); if(m.money > 0) PROF.money += Math.min(1e7, Math.round(m.money)); mlog(`${b.name} tặng bạn ${m.key && itemOf(m.key) ? itemOf(m.key).name : ''}${m.money > 0 ? ` $${m.money}` : ''}${m.note ? ` · "${String(m.note).slice(0, 80)}"` : ''}.`); toast(`Bạn nhận được quà từ ${b.name}!`); mprog('gift'); } }); });
    const ks = Object.keys(seen); if(ks.length > 400) ks.sort((a, b) => seen[a] - seen[b]).slice(0, ks.length - 400).forEach(k => delete seen[k]);
    if(changed){ afterEquip(); renderProfHud(); saveProfile(); if(openModal && openModal.id === 'mMarket') renderMarket(); if(openModal && openModal.id === 'mRoom' && ROOM.mode === 'shop') renderListings(); }
  } catch(e){} MKT.busy = false;
}
// ---------- NPC customers ----------
var npcShopT = 45;
function npcCustomers(dt){
  if(!PROF || !PROF.myshop || !PROF.myshop.listings.length) return; npcShopT -= dt; if(npcShopT > 0) return; npcShopT = 35 + Math.random()*50;
  const S = PROF.myshop, cand = S.listings.filter(l => +l[2] <= valueOf(l[1])*.85); if(!cand.length) return;
  const l = cand[Math.floor(Math.random()*cand.length)], who = 'Khách ' + NPC_NAMES[Math.floor(Math.random()*NPC_NAMES.length)];
  S.listings = S.listings.filter(x => x !== l); PROF.money += +l[2]; S.sales = (S.sales || 0) + 1; S.earned = (S.earned || 0) + (+l[2]);
  mlog(`${who} mua ${itemOf(l[1]).name} ở cửa hàng của bạn ($${l[2]}).`); toast(`${who} mua ${itemOf(l[1]).name}! +$${l[2]}`); reward(10, 0, null, true); renderProfHud(); saveProfile(); publishShop();
  if(openModal && openModal.id === 'mRoom' && ROOM.mode === 'shop') renderListings();
}
// ---------- market UI ----------
function openMarket(tab){ if(!PROF){ openLogin(); return; } MKT.tab = tab || MKT.tab; showModal('mMarket'); renderMarket(); loadMarket(); }
async function loadMarket(){
  const db = await cloudInit(); if(!db){ $('#mkMsg').textContent = 'Chợ người chơi cần mở trang trên claude.ai. Bạn vẫn decor cửa hàng và bán cho khách NPC được.'; return; }
  $('#mkMsg').textContent = 'Đang tải chợ…';
  try { const [s, h, p] = await Promise.all([db.collection('shops').orderBy('at', 'desc').limit(80).get(), db.collection('homes').orderBy('val', 'desc').limit(40).get(), db.collection('board').orderBy('tot', 'desc').limit(100).get()]);
    MKT.shops = s.docs.map(d => Object.assign({uid:d.id}, d.data() || {})); MKT.homes = h.docs.map(d => Object.assign({uid:d.id}, d.data() || {})); MKT.players = p.docs.map(d => ({uid:d.id, u:String((d.data() || {}).u || '?').slice(0, 20), lvl:(d.data() || {}).lvl || 1})).filter(x => x.uid !== CLOUD.uid);
    $('#mkMsg').textContent = `${MKT.shops.length} cửa hàng · ${MKT.homes.length} ngôi nhà · ${MKT.players.length} người chơi khác`; processMail(); renderMarket(); }
  catch(e){ $('#mkMsg').textContent = 'Chưa tải được chợ. Thử lại sau.'; }
}
function renderMarket(){
  document.querySelectorAll('#mkTabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === MKT.tab));
  const box = $('#mkBody'); box.innerHTML = '';
  $('#mkMoney').textContent = `$${PROF.money.toLocaleString('vi')} · ${(PROF.escrow || []).length} đơn đang chờ giao`;
  if(MKT.tab === 'shops' || MKT.tab === 'homes'){ const list = MKT.tab === 'shops' ? MKT.shops : MKT.homes; const g = el('div', {className:'shopgrid'});
    if(!list.length) box.appendChild(el('p', {className:'now'}, MKT.tab === 'shops' ? 'Chưa có cửa hàng nào. Hãy mở cửa hàng của bạn trước!' : 'Chưa có ngôi nhà nào được chia sẻ.'));
    list.forEach(sh => { const card = el('div', {className:'scard'}); const cv = el('canvas', {width:192, height:132}); card.appendChild(cv); const data = {name:sh.n || sh.o, wall:sh.wall || null, floor:sh.floor || null, items:parseJ(sh.items, [])};
      const c = cv.getContext('2d'); c.save(); c.scale(192/(RC*RT), 132/(RR*RT)); drawWallFloor(c, data.wall, data.floor, RC*RT, RR*RT, RT, RWALL); data.items.forEach(p => { const it = mallItem(p[0]); if(it) drawDecor(c, Object.assign({}, it, {label:(data.name || '').toUpperCase()}), p[1]*RT, p[2]*RT, RT, !!p[3]); }); c.restore();
      const n = el('div', {className:'sname'}); n.textContent = MKT.tab === 'shops' ? `${sh.n || 'Cửa hàng'}` : `Nhà của ${sh.o}`; card.appendChild(n); const d = el('div', {className:'sdesc'}); d.textContent = MKT.tab === 'shops' ? `Chủ: ${sh.o} · Lv ${sh.lvl} · ${parseJ(sh.listings, []).length} món đang bán` : `Lv ${sh.lvl} · giá trị nội thất $${(sh.val || 0).toLocaleString('vi')}`; card.appendChild(d);
      const b = el('button', {type:'button', className:'primary'}); b.textContent = sh.uid === CLOUD.uid ? 'Của bạn' : 'Ghé thăm'; b.disabled = sh.uid === CLOUD.uid; b.onclick = () => visitShop(sh, data); card.appendChild(b); g.appendChild(card); });
    box.appendChild(g); return; }
  if(MKT.tab === 'gift'){ const f = el('div', {className:'giftf'}); f.innerHTML = '<label class="fld">Tặng cho<select id="gfTo"></select></label><label class="fld">Món quà<select id="gfItem"></select></label><label class="fld">Kèm tiền ($)<input id="gfMoney" type="number" min="0" value="0"></label><label class="fld">Lời nhắn<input id="gfNote" maxlength="80" placeholder="Chúc bạn học giỏi!"></label><button id="gfSend" class="primary">Gửi quà</button>'; box.appendChild(f);
    const to = $('#gfTo'); if(!MKT.players.length) to.appendChild(el('option', {value:''}, 'Chưa có người chơi khác (cần mở trên claude.ai)')); MKT.players.forEach(p => to.appendChild(el('option', {value:p.uid}, `${p.u} · Lv ${p.lvl}`)));
    const it = $('#gfItem'); it.appendChild(el('option', {value:''}, '(chỉ tặng tiền)')); tradableKeys().forEach(k => it.appendChild(el('option', {value:k}, itemOf(k).name)));
    $('#gfSend').onclick = () => { const uid = $('#gfTo').value, k = $('#gfItem').value, money = Math.max(0, Math.round(+$('#gfMoney').value || 0)); if(!uid){ toast('Chọn người nhận.'); return; } if(!k && !money){ toast('Chọn món quà hoặc nhập số tiền.'); return; } if(money > PROF.money){ toast('Không đủ tiền.'); return; } if(k && !takeItem(k)){ toast('Không lấy được món này.'); return; } PROF.money -= money; const name = (MKT.players.find(p => p.uid === uid) || {}).u || 'bạn'; postMail({id:nowId(), to:uid, ty:'gift', key:k || null, money, note:$('#gfNote').value.slice(0, 80)}); mlog(`Bạn đã tặng ${name} ${k ? itemOf(k).name : ''}${money ? ' $' + money : ''}.`); afterEquip(); renderProfHud(); toast('Đã gửi quà! Bạn ấy sẽ nhận khi vào game.'); mprog('givegift'); renderMarket(); };
    return; }
  if(MKT.tab === 'mail'){ const ul = el('ul', {className:'fbag'}); (PROF.mailLog || []).forEach(m => { const li = el('li'); li.textContent = `${new Date(m.at).toLocaleString('vi')} · ${m.t}`; ul.appendChild(li); }); if(!(PROF.mailLog || []).length) ul.appendChild(el('li', {}, 'Hộp thư trống.')); box.appendChild(ul);
    (PROF.escrow || []).forEach(e => { const d = el('div', {className:'lbrow'}); const s = el('span'); s.textContent = `Đơn chờ giao: ${itemOf(e.key) ? itemOf(e.key).name : ''} · $${e.price} · cửa hàng ${e.shop}`; d.appendChild(s); const b = el('button', {type:'button'}); b.textContent = 'Hủy đơn, lấy lại tiền'; b.onclick = () => { PROF.escrow = PROF.escrow.filter(x => x !== e); PROF.money += e.price; postMail({id:'c' + e.oid, to:e.seller, ty:'cancel', oid:e.oid}); mlog(`Đã hủy đơn ${itemOf(e.key) ? itemOf(e.key).name : ''}, hoàn $${e.price}.`); renderMarket(); renderProfHud(); }; d.appendChild(b); box.appendChild(d); });
    const r = el('button', {type:'button'}); r.textContent = 'Kiểm tra thư mới'; r.onclick = () => processMail(); box.appendChild(r); return; }
  if(MKT.tab === 'trade') renderTrade(box);
}
function visitShop(sh, data){ const L = parseJ(sh.listings, []); openVisit(`${sh.n || 'Cửa hàng'} của ${sh.o}`, data, L, l => buyP2P(sh, l)); }
function renderVisitList(){ const v = $('#roomVisit'); v.innerHTML = ''; if(!ROOM.visitBuy){ return; } if(!ROOM.listings.length){ v.appendChild(el('p', {className:'now'}, 'Cửa hàng này chưa bày bán gì.')); return; } const g = el('div', {className:'shopgrid'});
  ROOM.listings.forEach(l => { const it = itemOf(l[1]); if(!it) return; const card = el('div', {className:'scard'}); const cv = el('canvas', {width:140, height:105}); card.appendChild(cv); if(it.kind !== 'gear') mallPreview(cv, it); else drawItemPreview(cv, it.gear); const n = el('div', {className:'sname'}); n.textContent = it.name; card.appendChild(n); const d = el('div', {className:'sdesc'}); d.textContent = `Giá bán $${(+l[2]).toLocaleString('vi')} · giá gốc $${it.price.toLocaleString('vi')}`; card.appendChild(d); const b = el('button', {type:'button', className:'primary'}); b.textContent = 'Mua'; b.disabled = PROF.money < +l[2] || (PROF.escrow || []).some(e => e.lid === l[0]); b.onclick = () => { ROOM.visitBuy(l); b.disabled = true; b.textContent = 'Đã đặt mua'; }; card.appendChild(b); g.appendChild(card); }); v.appendChild(g); }
function buyP2P(sh, l){ const price = +l[2]; if(PROF.money < price) return; PROF.money -= price; const oid = nowId(); PROF.escrow = (PROF.escrow || []).concat([{oid, seller:sh.uid, shop:sh.n || sh.o, price, key:l[1], lid:l[0], at:Date.now()}]); postMail({id:oid, to:sh.uid, ty:'buy', lid:l[0], price, key:l[1]}); renderProfHud(); saveProfile(); toast('Đã đặt mua! Món hàng sẽ được giao khi chủ cửa hàng vào game.'); mlog(`Đặt mua ${itemOf(l[1]).name} ở ${sh.n || sh.o} ($${price}).`); }
// ---------- live trade (room) ----------
function tradeInit(){ onlineInit().then(r => { if(!r || MKT.tradeHooked) return; MKT.tradeHooked = true; r.on('trade', m => { if(m.isMe || !m.data || m.data.to !== ONLINE.myPeer) return; tradeMsg(m.peer, m.data); }); }); }
function tradeMsg(peer, d){
  if(d.ty === 'req'){ MKT.tr = {peer, rid:d.rid, name:String(d.name || 'Một bạn').slice(0, 20), me:{items:[], money:0}, them:{items:[], money:0}, ok:false, themOk:null, pending:true}; toast(`${MKT.tr.name} muốn đổi đồ với bạn! Mở Chợ > Đổi đồ trực tiếp.`); if(openModal && openModal.id === 'mMarket'){ MKT.tab = 'trade'; renderMarket(); } return; }
  const T = MKT.tr; if(!T || T.rid !== d.rid || T.peer !== peer) return;
  if(d.ty === 'acc'){ T.pending = false; toast(`${T.name} đã đồng ý mở phiên đổi đồ.`); }
  else if(d.ty === 'offer'){ T.them = {items:(Array.isArray(d.items) ? d.items : []).filter(k => typeof k === 'string' && itemOf(k)).slice(0, 8), money:Math.max(0, Math.round(+d.money || 0))}; T.ok = false; T.themOk = null; }
  else if(d.ty === 'ok'){ T.themOk = d; tradeTry(); }
  else if(d.ty === 'cancel'){ MKT.tr = null; toast('Phiên đổi đồ đã bị hủy.'); }
  if(openModal && openModal.id === 'mMarket' && MKT.tab === 'trade') renderMarket();
}
const tsend = d => ONLINE.room && ONLINE.room.emit('trade', Object.assign({to:MKT.tr.peer, rid:MKT.tr.rid}, d)).catch(() => {});
const offerStr = o => JSON.stringify({i:o.items.slice().sort(), m:o.money});
function tradeTry(){ const T = MKT.tr; if(!T || !T.ok || !T.themOk) return; if(T.themOk.mine !== offerStr(T.them) || T.themOk.theirs !== offerStr(T.me)) return;
  if(PROF.money < T.me.money || !T.me.items.every(k => tradableKeys().includes(k))){ toast('Bạn không còn đủ đồ hoặc tiền để đổi.'); return; }
  T.me.items.forEach(takeItem); PROF.money -= T.me.money; T.them.items.forEach(giveItem); PROF.money += T.them.money;
  mlog(`Đổi đồ với ${T.name}: đưa ${T.me.items.map(k => itemOf(k).name).join(', ') || 'không có đồ'}${T.me.money ? ' + $' + T.me.money : ''}, nhận ${T.them.items.map(k => itemOf(k).name).join(', ') || 'không có đồ'}${T.them.money ? ' + $' + T.them.money : ''}.`);
  toast(`Đổi đồ thành công với ${T.name}!`); mprog('trade'); cheerSfx(); MKT.tr = null; afterEquip(); renderProfHud(); saveProfile(); renderMarket(); }
function renderTrade(box){
  const T = MKT.tr;
  if(!ONLINE.room){ box.appendChild(el('p', {className:'now'}, 'Đổi đồ trực tiếp cần mở trang trên claude.ai cùng lúc với bạn bè. Bạn vẫn có thể Tặng quà hoặc mua bán qua cửa hàng.')); return; }
  if(!T){ box.appendChild(el('p', {className:'now'}, 'Chọn một người đang online để mời đổi đồ:')); if(!ONLINE.peers.length) box.appendChild(el('p', {className:'now'}, 'Chưa có ai khác online.'));
    ONLINE.peers.forEach(p => { const pr = p.presence || {}; const d = el('div', {className:'lbrow'}); const s = el('span'); s.textContent = `${String(pr.n || 'Khách').slice(0, 20)} · Level ${+pr.l || 0}`; d.appendChild(s); const b = el('button', {type:'button', className:'primary'}); b.textContent = 'Mời đổi đồ'; b.onclick = () => { MKT.tr = {peer:p.peer, rid:nowId(), name:String(pr.n || 'Khách').slice(0, 20), me:{items:[], money:0}, them:{items:[], money:0}, ok:false, themOk:null, pending:false, mine:true}; ONLINE.room.emit('trade', {to:p.peer, rid:MKT.tr.rid, ty:'req', name:PROF.name}).catch(() => {}); renderMarket(); }; d.appendChild(b); box.appendChild(d); }); return; }
  if(T.pending){ const d = el('div', {className:'lbrow inv'}); const s = el('span'); s.textContent = `${T.name} mời bạn đổi đồ.`; d.appendChild(s); const a = el('button', {type:'button', className:'primary'}); a.textContent = 'Đồng ý'; a.onclick = () => { T.pending = false; tsend({ty:'acc'}); renderMarket(); }; const r = el('button', {type:'button'}); r.textContent = 'Từ chối'; r.onclick = () => { tsend({ty:'cancel'}); MKT.tr = null; renderMarket(); }; d.appendChild(a); d.appendChild(r); box.appendChild(d); return; }
  const wrap = el('div', {className:'farmgrid'}); const mine = el('div'), theirs = el('div'); mine.innerHTML = '<h2>Bạn đưa</h2>'; theirs.innerHTML = '<h2></h2>'; theirs.firstChild.textContent = T.name + ' đưa';
  const sel = el('select'); sel.appendChild(el('option', {value:''}, 'Thêm một món…')); tradableKeys().filter(k => !T.me.items.includes(k) || bagN(k) > T.me.items.filter(x => x === k).length).forEach(k => sel.appendChild(el('option', {value:k}, itemOf(k).name))); sel.onchange = () => { if(sel.value && T.me.items.length < 8){ T.me.items.push(sel.value); T.ok = false; tsend({ty:'offer', items:T.me.items, money:T.me.money}); renderMarket(); } }; mine.appendChild(sel);
  T.me.items.forEach((k, i) => { const d = el('div', {className:'lbrow'}); const s = el('span'); s.textContent = itemOf(k).name; d.appendChild(s); const x = el('button', {type:'button'}); x.textContent = 'Bỏ'; x.onclick = () => { T.me.items.splice(i, 1); T.ok = false; tsend({ty:'offer', items:T.me.items, money:T.me.money}); renderMarket(); }; d.appendChild(x); mine.appendChild(d); });
  const mi = el('input', {type:'number', min:0, value:T.me.money}); mi.setAttribute('aria-label', 'Tiền đưa thêm'); mi.onchange = () => { T.me.money = Math.max(0, Math.min(PROF.money, Math.round(+mi.value || 0))); T.ok = false; tsend({ty:'offer', items:T.me.items, money:T.me.money}); renderMarket(); }; const ml = el('label', {className:'fld'}, 'Kèm tiền ($)'); ml.appendChild(mi); mine.appendChild(ml);
  T.them.items.forEach(k => { const d = el('div', {className:'lbrow'}); d.textContent = itemOf(k).name; theirs.appendChild(d); }); const tm = el('p', {className:'now'}); tm.textContent = `Kèm tiền: $${T.them.money}`; theirs.appendChild(tm);
  wrap.appendChild(mine); wrap.appendChild(theirs); box.appendChild(wrap);
  const row = el('div', {className:'row'}); const ok = el('button', {type:'button', className:'primary'}); ok.textContent = T.ok ? 'Đã đồng ý · chờ đối phương' : 'Đồng ý đổi'; ok.onclick = () => { T.ok = true; tsend({ty:'ok', mine:offerStr(T.me), theirs:offerStr(T.them)}); tradeTry(); renderMarket(); }; const cx = el('button', {type:'button'}); cx.textContent = 'Hủy phiên'; cx.onclick = () => { tsend({ty:'cancel'}); MKT.tr = null; renderMarket(); }; row.appendChild(ok); row.appendChild(cx); box.appendChild(row);
  const st = el('p', {className:'legend'}); st.textContent = T.themOk ? `${T.name} đã đồng ý.` : `${T.name} chưa đồng ý. Khi cả hai cùng đồng ý với đúng các món đang bày, giao dịch tự hoàn tất.`; box.appendChild(st);
}
function quickSell(){ const k = $('#listItem').value; if(!k) return; const it = itemOf(k), p = Math.round(it.price*.5); if(!takeItem(k)) return; PROF.money += p; afterEquip(); renderProfHud(); saveProfile(); renderListings(); toast(`Đã bán lại ${it.name} cho trung tâm thương mại: +$${p}`); }
function ext16Init(){
  document.querySelectorAll('#mkTabs button').forEach(b => b.onclick = () => { MKT.tab = b.dataset.t; renderMarket(); if(MKT.tab === 'trade') tradeInit(); });
  $('#mkMyShop').onclick = () => openRoom('shop'); $('#mkMall').onclick = () => openMall(); $('#listQuick').onclick = quickSell;
  const B = (id, f) => { const b = document.getElementById(id); if(b) b.onclick = f; };
  B('wMall', () => openMall()); B('wHome', () => openRoom('home')); B('wMyShop', () => openRoom('shop')); B('wMarket', () => openMarket('shops')); B('hHome', () => openRoom('home')); B('hMarket', () => openMarket('shops'));
  setInterval(processMail, 30000); setTimeout(processMail, 6000); setTimeout(tradeInit, 3500);
  XHOT.unshift({r:{x:R.shopst.x, y:R.shopst.y + 60, w:R.shopst.w, h:260}, f:() => openMall()});
}

