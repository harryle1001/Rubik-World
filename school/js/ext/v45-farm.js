// ================= v45 (Session 4): trang trại lớn + sở thú + cho ăn + cưỡi thú + trái tim ❤️ =================
// Bố cục theo tỷ lệ vàng trong R.farm (870 × 500): phần trên 1/φ là trang trại, phần dưới là sở thú trước cổng lớn.
const V45F_PHI = 1.618;
const V45F = {near:null, help:null, helpT:40, rideA:null, litterN:0, litterW:null, cdFeed:0, cdWater:0, act:null, tap:null, mill:0};
const V45FL = (() => { const r = R.farm, top = Math.round(r.h / V45F_PHI); return {x:r.x, y:r.y, w:r.w, h:r.h, fy:r.y + top, gx:Math.round(r.x + r.w/2)}; })();
// ---------- thú mới (sở thú) + tên tiếng Anh + một điều thú vị để học ----------
const V45_ANI = {
  elephant:{name:'Voi', sp:140, ride:-34, c:'#9aa3ad', d:'#7d8690'},
  giraffe: {name:'Hươu cao cổ', sp:200, ride:-35, c:'#e8b04a', d:'#9a6a2c'},
  zebra:   {name:'Ngựa vằn', sp:280, ride:-17, c:'#f4f4f4', d:'#2a2a2a'},
  lion:    {name:'Sư tử', sp:260, ride:-21, c:'#d9a043', d:'#8a4f1c'},
  kangaroo:{name:'Chuột túi', sp:300, ride:-27, c:'#b98250', d:'#7a5030'},
  panda:   {name:'Gấu trúc', sp:110, ride:-20, c:'#f4f4f4', d:'#222'},
  penguin: {name:'Chim cánh cụt', sp:120, ride:-20, c:'#222', d:'#f4f4f4'},
  flamingo:{name:'Hồng hạc', sp:150, ride:-27, c:'#f48fb1', d:'#e75480'},
  unicorn: {name:'Kỳ lân cầu vồng', sp:360, ride:-17, c:'#fafafa', d:'#c5b3e6'}
};
const V45_INFO = {
  horse:['🐎','Horse','Ngựa ngủ được cả khi đứng.'], buffalo:['🐃','Water buffalo','Trâu thích ngâm mình trong bùn cho mát.'],
  camel:['🐫','Camel','Bướu lạc đà chứa mỡ, giúp nó đi xa không cần ăn.'], ostrich:['🦤','Ostrich','Đà điểu là loài chim lớn nhất, chạy rất nhanh.'],
  cow:['🐄','Cow','Bò có 4 ngăn dạ dày để nhai lại cỏ.'], goat:['🐐','Goat','Dê leo núi đá rất giỏi.'], chicken:['🐔','Chicken','Gà mái đẻ khoảng một quả trứng mỗi ngày.'],
  pig:['🐖','Pig','Heo rất thông minh và thích sạch sẽ.'], elephant:['🐘','Elephant','Voi dùng vòi để uống nước và tắm.'],
  giraffe:['🦒','Giraffe','Hươu cao cổ có lưỡi dài gần nửa mét.'], zebra:['🦓','Zebra','Mỗi con ngựa vằn có bộ sọc riêng, không con nào giống con nào.'],
  lion:['🦁','Lion','Tiếng gầm của sư tử nghe xa tới 8 km.'], kangaroo:['🦘','Kangaroo','Chuột túi mẹ nuôi con trong túi trước bụng.'],
  panda:['🐼','Panda','Gấu trúc ăn tre suốt khoảng 12 giờ mỗi ngày.'], penguin:['🐧','Penguin','Chim cánh cụt không bay được nhưng bơi rất giỏi.'],
  flamingo:['🦩','Flamingo','Hồng hạc có màu hồng nhờ ăn tôm tép nhỏ.'], unicorn:['🦄','Unicorn','Kỳ lân là con vật trong truyện cổ tích.']
};
const V45_H = {elephant:38, giraffe:68, lion:28, kangaroo:40, panda:28, penguin:26, flamingo:46, ostrich:50, camel:42, horse:40, zebra:40, unicorn:44, chicken:14, pig:14, goat:24, cow:30, buffalo:30};
// chuồng sở thú (hàng 1 và hàng 2 ở phía nam cổng), mỗi chuồng: khung, nền, loài, số con
const V45_ZOO = [
  {x:4330, y:-218, w:128, h:73, g:'savanna', k:'elephant', n:1}, {x:4466, y:-218, w:110, h:73, g:'savanna', k:'giraffe', n:2},
  {x:4584, y:-218, w:112, h:73, g:'grass', k:'zebra', n:2}, {x:4774, y:-218, w:112, h:73, g:'rock', k:'lion', n:1},
  {x:4894, y:-218, w:110, h:73, g:'grass', k:'kangaroo', n:2}, {x:5012, y:-218, w:128, h:73, g:'sand', k:'camel', n:0},
  {x:4452, y:-126, w:112, h:66, g:'ice', k:'penguin', n:3}, {x:4572, y:-126, w:124, h:66, g:'pond', k:'flamingo', n:3},
  {x:4774, y:-126, w:124, h:66, g:'bamboo', k:'panda', n:1}, {x:4906, y:-126, w:122, h:66, g:'sand', k:'ostrich', n:0}
];
// khu trang trại (phía bắc cổng): chuồng ngoài sân, đồng cỏ cừu & dê, vườn cây
const V45_PENS = {horse:{x:4772, y:-338, w:136, h:84}, cow:{x:4914, y:-338, w:140, h:84}, buffalo:{x:4626, y:-338, w:78, h:84},
  goat:{x:4342, y:-516, w:226, h:116}, chicken:{x:5072, y:-404, w:76, h:36}, pig:{x:5072, y:-350, w:76, h:60}};
const v45PlotPos = i => [4364 + (i%5)*58, -350 + Math.floor(i/5)*52];

// ---------- vẽ thú ----------
function v45DrawAnimal(kind, x, y, dir, ph, moving){
  const A = ANI[kind], st = moving ? Math.round(Math.sin(ph)*2) : 0;
  if(kind === 'zebra' || kind === 'unicorn'){ const H = ANI.horse, oc = H.c, od = H.d; H.c = A.c; H.d = A.d; try { V45F.base.drawAnimal('horse', x, y, dir, ph, moving); } finally { H.c = oc; H.d = od; } }
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if(dir < 0) ctx.scale(-1, 1);
  const c = A.c, d = A.d;
  if(kind === 'zebra'){ [-10, -6, -2, 2, 6].forEach(sx => rect('#2a2a2a', sx, -26, 2, 12)); rect('#2a2a2a', 9, -34, 6, 2); rect('#2a2a2a', 9, -30, 6, 2); }
  else if(kind === 'unicorn'){ tri(17, -41, 21, -41, 23, -52, '#ffd23f'); ['#ef4b4b','#ff8a2b','#ffd23f','#2fbf71','#3d7bff','#b06bff'].forEach((col, i) => rect(col, 7, -41 + i*2.4, 3, 3)); rect('#ff9ccf', -16, -25, 3, 10 + st); }
  else if(kind === 'elephant'){
    rect('rgba(0,0,0,.22)', -18, -2, 38, 5);
    rect(d, -15, -14, 6, 14 + st); rect(c, -8, -14, 6, 14 - st); rect(d, 4, -14, 6, 14 - st); rect(c, 10, -14, 6, 14 + st);
    rect(c, -17, -34, 32, 22); rect('#b3bbc4', -15, -34, 28, 4); rect(c, 12, -38, 12, 16); rect(d, 8, -37, 7, 13);
    rect(c, 21, -26, 5, 12); rect(c, 23, -15, 4, 3); rect('#fffde7', 20, -24, 5, 2); rect('#111', 18, -33, 2, 2); rect(d, -19, -30, 3, 9);
  } else if(kind === 'giraffe'){
    rect('rgba(0,0,0,.22)', -14, -2, 28, 4); const sp = '#a8692a';
    rect(d, -10, -24, 3, 24 + st); rect(d, -6, -24, 3, 24 - st); rect(d, 5, -24, 3, 24 - st); rect(d, 9, -24, 3, 24 + st);
    rect(c, -12, -34, 25, 11); rect(sp, -8, -32, 4, 3); rect(sp, -1, -29, 4, 3); rect(sp, 6, -33, 3, 3); rect(sp, 2, -26, 3, 2);
    rect(c, 8, -60, 6, 28); rect(sp, 9, -52, 3, 3); rect(sp, 10, -44, 3, 3); rect(c, 8, -66, 12, 7); rect('#d49a3a', 17, -63, 4, 4);
    rect(d, 9, -70, 2, 4); rect(d, 13, -70, 2, 4); rect('#111', 14, -64, 2, 2); rect(c, 5, -66, 3, 2); rect(d, -14, -33, 2, 10);
  } else if(kind === 'lion'){
    rect('rgba(0,0,0,.22)', -14, -2, 30, 4);
    rect(c, -10, -10, 4, 10 + st); rect(c, -5, -10, 4, 10 - st); rect(c, 4, -10, 4, 10 - st); rect(c, 9, -10, 4, 10 + st);
    rect(c, -12, -21, 24, 12); circ(14, -22, 10, d); rect(c, 10, -27, 10, 10); rect('#5a3a1e', 18, -22, 3, 2); rect('#111', 16, -25, 2, 2);
    rect(c, -18, -19, 7, 2); rect(d, -21, -21, 4, 5);
  } else if(kind === 'kangaroo'){
    rect('rgba(0,0,0,.22)', -12, -2, 24, 4); if(moving) ctx.translate(0, -Math.abs(Math.sin(ph*.5))*6);
    rect(c, -16, -6, 12, 3); rect(c, -6, -9, 9, 9); rect(d, -4, -2, 12, 2); rect(c, -6, -28, 11, 20); rect('#d9a878', -1, -24, 5, 14);
    rect(c, 4, -21, 4, 2); rect(c, 1, -36, 9, 8); rect(c, 9, -33, 3, 4); rect('#111', 6, -34, 2, 2); rect(c, 2, -41, 2, 5); rect(c, 5, -41, 2, 5);
  } else if(kind === 'panda'){
    rect('rgba(0,0,0,.22)', -13, -2, 28, 4);
    rect(d, -10, -9, 5, 9 + st); rect(d, -4, -9, 5, 9 - st); rect(d, 3, -9, 5, 9 - st); rect(d, 8, -9, 5, 9 + st);
    rect(c, -11, -20, 23, 12); rect(d, -2, -20, 6, 12); rect(c, 9, -27, 12, 11); rect(d, 9, -29, 4, 4); rect(d, 17, -29, 4, 4);
    rect(d, 12, -24, 3, 3); rect(d, 17, -24, 3, 3); rect('#fff', 13, -23, 1, 1); rect('#fff', 18, -23, 1, 1); rect(d, 20, -20, 2, 2);
  } else if(kind === 'penguin'){
    rect('rgba(0,0,0,.2)', -7, -2, 14, 3); if(moving) ctx.rotate(Math.sin(ph)*.12);
    rect('#ff9800', -4, -2, 4, 2); rect('#ff9800', 1, -2, 4, 2);
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -11, 6, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = d; ctx.beginPath(); ctx.ellipse(1.5, -10, 4, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -21, 5, 5, 0, 0, Math.PI*2); ctx.fill(); rect('#fff', 1, -23, 2, 2); rect('#111', 2, -23, 1, 1); rect('#ff9800', 4, -21, 3, 2); rect(c, -7, -15, 2, 7);
  } else if(kind === 'flamingo'){
    rect('rgba(0,0,0,.18)', -7, -2, 14, 3);
    if(moving){ rect(d, -2, -22, 1, 22 + st); rect(d, 2, -22, 1, 22 - st); } else { rect(d, 0, -22, 1, 22); rect(d, 1, -17, 5, 1); rect(d, 5, -17, 1, 4); }
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -26, 9, 5, 0, 0, Math.PI*2); ctx.fill(); rect(d, -6, -28, 7, 3);
    rect(c, 6, -40, 2, 14); rect(c, 4, -44, 4, 4); rect(c, 5, -47, 6, 4); rect('#222', 10, -46, 3, 3); rect('#111', 7, -46, 1, 1);
  }
  ctx.restore();
}

// ---------- vẽ tĩnh: toàn khu nông trại + sở thú (vẽ một lần vào bộ nhớ đệm, không tốn FPS) ----------
function v45Wood(x, y, w, h){ rect('#7a5232', x, y, w, h); rect('#9a6c44', x + 1, y + 1, w - 2, 2); }
function v45Sign(txt, sub, cx, y){
  ctx.font = 'bold 11px Nunito, sans-serif'; const w1 = ctx.measureText(txt).width; ctx.font = '600 9px Nunito, sans-serif'; const w2 = sub ? ctx.measureText(sub).width : 0;
  const w = Math.max(w1, w2) + 12, h = sub ? 24 : 15; rect('#5d3d22', cx - 1, y + h, 2, 6); rect('#3e2a16', cx - w/2 - 1, y - 1, w + 2, h + 2); rect('#fff3d6', cx - w/2, y, w, h);
  ctx.textAlign = 'center'; ctx.fillStyle = '#3a2410'; ctx.font = 'bold 11px Nunito, sans-serif'; ctx.fillText(txt, cx, y + 11); if(sub){ ctx.fillStyle = '#6a4a2a'; ctx.font = '600 9px Nunito, sans-serif'; ctx.fillText(sub, cx, y + 21); } ctx.textAlign = 'left';
}
function v45Round(x, y, w, h, r, fill, stroke, lw){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); if(fill){ ctx.fillStyle = fill; ctx.fill(); } if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }
function v45Fence(x0, x1, y, gap0, gap1){ for(let x = x0; x <= x1; x += 22){ if(gap0 !== undefined && x > gap0 - 8 && x < gap1 + 4) continue; rect('#6b4628', x, y - 14, 4, 16); rect('#8d6340', x, y - 15, 4, 2); }
  [[x0, gap0 === undefined ? x1 : gap0], gap0 === undefined ? null : [gap1, x1]].forEach(s => { if(!s) return; rect('#8d6340', s[0], y - 11, s[1] - s[0] + 4, 3); rect('#8d6340', s[0], y - 5, s[1] - s[0] + 4, 3); }); }
function v45fTree(x, y, s, dong){ rect('#5a3a1e', x - 2*s, y - 8*s, 4*s, 10*s); const g = dong ? ['#dfe9ee','#c9d8df'] : season === 'thu' ? ['#d9822b','#b9651c'] : ['#3f9a4a','#2f7d3a']; circ(x, y - 16*s, 10*s, g[1]); circ(x - 5*s, y - 13*s, 7*s, g[0]); circ(x + 5*s, y - 18*s, 7*s, g[0]); }
function v45DrawFarmStatic(){
  if(!FARM) return; const L = V45FL, dong = season === 'dong', thu = season === 'thu';
  const g0 = dong ? '#eaf0f2' : thu ? '#a4c063' : '#8fc65c', g1 = dong ? '#dde6ea' : thu ? '#97b357' : '#83ba51';
  ctx.save(); v45Round(L.x, L.y, L.w, L.h, 130); ctx.clip();
  rect(g0, L.x, L.y, L.w, L.h); for(let i = 0; i < 260; i++){ const x = L.x + (i*137) % L.w, y = L.y + (i*89) % L.h; rect(g1, x, y, 3, 2); }
  // lối đi đất chính: cửa kho → cổng → giữa sở thú
  const px = L.gx - 28, path = dong ? '#d8d2c4' : '#dcc690', pe = dong ? '#c6bfae' : '#c7ad74';
  rect(pe, px - 3, L.y + 190, 62, L.h - 190); rect(path, px, L.y + 190, 56, L.h - 190); for(let k = 0; k < 40; k++) rect(pe, px + 4 + (k*23) % 48, L.y + 200 + (k*53) % (L.h - 210), 3, 2);
  rect(pe, L.x + 20, -145, L.w - 40, 17); rect(path, L.x + 20, -143, L.w - 40, 13);
  // đồng cỏ cừu & dê (tây bắc) + vườn cây ăn trái (tây)
  ctx.fillStyle = dong ? '#f4f8fa' : '#a8d873'; ctx.beginPath(); ctx.ellipse(4455, -458, 120, 60, 0, 0, Math.PI*2); ctx.fill();
  for(let k = 0; k < 18; k++){ const a = k*.9; circ(4455 + Math.cos(a)*(40 + k*3), -458 + Math.sin(a)*(18 + k), 2, dong ? '#fff' : ['#fff','#ffd23f','#ff9ccf'][k%3]); }
  v45Round(4334, -386, 300, 108, 14, dong ? '#d9d2c6' : '#8a6a44'); for(let r = 0; r < 5; r++) rect(dong ? '#cfc7b8' : '#7a5a38', 4340, -380 + r*20, 288, 3);
  v45Sign('VƯỜN CÂY ĂN TRÁI', 'Orchard', 4484, -404);
  // silo + kho thóc đỏ lớn (tỷ lệ vàng: rộng 200, cao tường 124 ≈ 200/φ) + nhà nông trại
  const sx = 4590; rect('#8e9aa3', sx, -514, 34, 96); rect('#aab6be', sx + 4, -514, 8, 96); for(let k = 0; k < 6; k++) rect('#7b868e', sx, -500 + k*16, 34, 2);
  ctx.fillStyle = '#6f7a82'; ctx.beginPath(); ctx.ellipse(sx + 17, -514, 17, 12, 0, Math.PI, 0); ctx.fill(); rect('#5b656c', sx + 15, -530, 4, 6);
  const bx = L.gx - 100, bw = 200, by = -468, bh = 124 - 6;
  rect('rgba(0,0,0,.14)', bx + 6, by + bh, bw, 8);
  rect('#b8473a', bx, by, bw, bh); for(let x = bx + 6; x < bx + bw; x += 12) rect('#a63d31', x, by, 2, bh);
  ctx.fillStyle = '#7a2e22'; ctx.beginPath(); ctx.moveTo(bx - 12, by + 2); ctx.lineTo(bx + 22, by - 40); ctx.lineTo(L.gx, by - 64); ctx.lineTo(bx + bw - 22, by - 40); ctx.lineTo(bx + bw + 12, by + 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#f4ead8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 12, by + 2); ctx.lineTo(bx + 22, by - 40); ctx.lineTo(L.gx, by - 64); ctx.lineTo(bx + bw - 22, by - 40); ctx.lineTo(bx + bw + 12, by + 2); ctx.stroke();
  rect('#f4ead8', bx, by, bw, 4); rect('#f4ead8', bx, by + bh - 4, bw, 4); rect('#f4ead8', bx, by, 4, bh); rect('#f4ead8', bx + bw - 4, by, 4, bh);
  rect('#f4ead8', L.gx - 18, by - 44, 36, 30); rect('#3a2418', L.gx - 14, by - 40, 28, 22); rect('#e8c35a', L.gx - 14, by - 26, 28, 8); for(let k = 0; k < 7; k++) rect('#d4a83a', L.gx - 13 + k*4, by - 28, 2, 4);
  const dw = 64, dy = by + bh - 70; rect('#3a2418', L.gx - dw/2, dy, dw, 70); rect('#e8c35a', L.gx - dw/2 + 4, dy + 48, dw - 8, 22); rect('#d4a83a', L.gx - 20, dy + 52, 18, 8);
  [[-1], [1]].forEach(([s]) => { const ex = L.gx + s*dw/2, ox = ex + s*26; ctx.fillStyle = '#b8473a'; ctx.beginPath(); ctx.moveTo(ex, dy); ctx.lineTo(ox, dy + 8); ctx.lineTo(ox, dy + 76); ctx.lineTo(ex, dy + 70); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f4ead8'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(ex, dy); ctx.lineTo(ox, dy + 76); ctx.moveTo(ox, dy + 8); ctx.lineTo(ex, dy + 70); ctx.stroke(); });
  rect('#4a4a4a', L.gx - 1, by - 80, 2, 16); rect('#4a4a4a', L.gx - 8, by - 76, 16, 2); rect('#ffd23f', L.gx - 4, by - 84, 8, 5);
  v45Sign('KHO THÓC', 'Barn', L.gx, by + 8);
  const hx = 4874, hy = -438, hw = 124, hh = 76; rect('rgba(0,0,0,.14)', hx + 5, hy + hh, hw, 7);
  rect('#f3e3c3', hx, hy, hw, hh); for(let y = hy + 6; y < hy + hh; y += 8) rect('#e6d3ae', hx, y, hw, 1);
  tri(hx - 10, hy + 2, hx + hw + 10, hy + 2, hx + hw/2, hy - 50, '#4f6d8a'); tri(hx - 2, hy + 2, hx + hw + 2, hy + 2, hx + hw/2, hy - 42, '#5f7f9e');
  rect('#7a5a3a', hx + 88, hy - 46, 12, 26); rect('#5d4430', hx + 86, hy - 48, 16, 4);
  [[hx + 12, hy + 14], [hx + 82, hy + 14], [hx + 12, hy + 44], [hx + 92, hy + 44]].forEach(([wx, wy]) => { rect('#fff', wx - 2, wy - 2, 26, 22); rect('#ffe8a3', wx, wy, 22, 18); rect('#fff', wx + 10, wy, 2, 18); rect('#fff', wx, wy + 8, 22, 2); rect('#c0603d', wx - 2, wy + 20, 26, 4); circ(wx + 4, wy + 20, 2, '#ff6f91'); circ(wx + 12, wy + 20, 2, '#ffd23f'); circ(wx + 20, wy + 20, 2, '#ff6f91'); });
  rect('#6d4c2e', hx + 48, hy + 36, 26, 40); rect('#8d6340', hx + 51, hy + 39, 20, 37); circ(hx + 66, hy + 58, 2, '#ffd23f'); rect('#cbb894', hx + 40, hy + hh, 42, 6); rect('#b8a47e', hx + 44, hy + hh + 6, 34, 4);
  v45Sign('NHÀ NÔNG TRẠI', 'Farmhouse', hx + hw/2, hy - 68 + 6 + 2);
  // chuồng gà + chuồng heo (đông)
  const cx0 = 5008; rect('#c0603d', cx0, -398, 56, 38); tri(cx0 - 6, -398, cx0 + 62, -398, cx0 + 28, -422, '#7a3a24'); rect('#3a2418', cx0 + 20, -380, 16, 20); rect('#e8c35a', cx0 + 6, -390, 10, 8);
  v45Round(5070, -404, 80, 38, 8, dong ? '#e9e4da' : '#d8c38a', '#8d6340', 2); v45Round(5070, -352, 80, 62, 10, dong ? '#d9d2c6' : '#8d6a45', '#6b4628', 3);
  ctx.fillStyle = dong ? '#c8d8e0' : '#6e4f30'; ctx.beginPath(); ctx.ellipse(5110, -320, 26, 10, 0, 0, Math.PI*2); ctx.fill();
  v45Sign('GÀ · Chicken', null, 5110, -424 + 2); v45Sign('HEO · Pig', null, 5110, -370);
  // sân trang trại: rào nhỏ + máng ăn từng chuồng
  Object.entries(V45_PENS).forEach(([k, p]) => { if(FARM.pens[k]){ const tx = p.x + p.w/2, ty = p.y + p.h - 14; rect('#6d4c2e', tx - 22, ty - 4, 44, 9); rect(dong ? '#e8e8e8' : '#c8a24a', tx - 19, ty - 3, 38, 4); } });
  v45Sign('NGỰA · Horse', null, 4840, -356); v45Sign('BÒ SỮA · Cow', null, 4984, -356); v45Sign('TRÂU', 'Buffalo', 4665, -362); v45Sign('ĐỒNG CỎ CỪU & DÊ', 'Sheep & Goat meadow', 4455, -536 + 10);
  // hàng rào chính + CỔNG LỚN mở rộng (cột đá, vòm gỗ, biển tên)
  const fy = L.fy, gw = 124, g0x = L.gx - gw/2, g1x = L.gx + gw/2;
  v45Fence(L.x + 14, L.x + L.w - 18, fy, g0x - 16, g1x + 12);
  [g0x - 18, g1x].forEach(px0 => { rect('rgba(0,0,0,.18)', px0 + 3, fy - 2, 20, 6); rect('#9e9a92', px0, fy - 70, 18, 70); rect('#bdb8ae', px0 + 2, fy - 70, 6, 70); for(let k = 0; k < 5; k++) rect('#8a867e', px0, fy - 60 + k*13, 18, 2);
    rect('#7a7670', px0 - 3, fy - 76, 24, 7); rect('#3a2a1a', px0 + 5, fy - 92, 8, 16); rect('#ffd27a', px0 + 6, fy - 89, 6, 10); });
  ctx.fillStyle = '#7a5232'; ctx.beginPath(); ctx.moveTo(g0x - 22, fy - 70); ctx.quadraticCurveTo(L.gx, fy - 108, g1x + 22, fy - 70); ctx.lineTo(g1x + 22, fy - 62); ctx.quadraticCurveTo(L.gx, fy - 98, g0x - 22, fy - 62); ctx.closePath(); ctx.fill();
  rect('#5d3d22', L.gx - 66, fy - 106, 132, 24); rect('#f6e2b3', L.gx - 63, fy - 103, 126, 18); ctx.textAlign = 'center'; ctx.fillStyle = '#7a2e22'; ctx.font = '14px Bungee, sans-serif'; ctx.fillText('TRANG TRẠI', L.gx, fy - 89); ctx.textAlign = 'left';
  [[-1, g0x], [1, g1x]].forEach(([s, ex]) => { const ox = ex + s*34; ctx.fillStyle = '#9a6c44'; ctx.beginPath(); ctx.moveTo(ex, fy - 56); ctx.lineTo(ox, fy - 44); ctx.lineTo(ox, fy + 14); ctx.lineTo(ex, fy + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6b4628'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(ex, fy - 27); ctx.lineTo(ox, fy - 15); ctx.moveTo(ex, fy - 56); ctx.lineTo(ox, fy + 14); ctx.stroke(); });
  // SỞ THÚ: các chuồng có nền riêng, rào thấp, biển tên Việt – Anh
  const GND = {savanna:dong ? '#e9e2d0' : '#e3cf8c', grass:dong ? '#eef2f2' : '#9fd36a', rock:dong ? '#dcdcdc' : '#c9b48a', sand:dong ? '#ece6d6' : '#efd9a0', ice:'#e6f4fb', pond:dong ? '#e6f4fb' : '#9ccf6a', bamboo:dong ? '#e8efe8' : '#7fbf5a'};
  V45_ZOO.forEach(z => {
    v45Round(z.x, z.y, z.w, z.h, 12, GND[z.g]);
    if(z.g === 'pond' || z.g === 'ice'){ ctx.fillStyle = z.g === 'ice' ? '#9fd4ee' : (dong ? '#cfe6f0' : '#4fb0cf'); ctx.beginPath(); ctx.ellipse(z.x + z.w*.56, z.y + z.h*.58, z.w*.32, z.h*.26, 0, 0, Math.PI*2); ctx.fill(); if(z.g === 'ice') for(let k = 0; k < 4; k++) rect('#fff', z.x + 10 + k*24, z.y + 12 + (k%2)*8, 14, 8); }
    if(z.g === 'rock'){ for(let k = 0; k < 3; k++){ ctx.fillStyle = ['#a59478','#8f7f66','#b5a488'][k]; ctx.beginPath(); ctx.ellipse(z.x + 22 + k*30, z.y + 22 + (k%2)*6, 18, 10, 0, 0, Math.PI*2); ctx.fill(); } }
    if(z.g === 'bamboo') for(let k = 0; k < 7; k++){ rect('#4f8f3a', z.x + 8 + k*16, z.y + 4, 3, 24); rect('#6fb04f', z.x + 10 + k*16, z.y + 6, 6, 2); }
    if(z.g === 'savanna'){ rect('#6d4c2e', z.x + z.w - 22, z.y + 10, 4, 22); ctx.fillStyle = dong ? '#dfe9ee' : '#6f9a3a'; ctx.beginPath(); ctx.ellipse(z.x + z.w - 20, z.y + 10, 20, 7, 0, 0, Math.PI*2); ctx.fill(); }
    ctx.strokeStyle = '#8d6340'; ctx.lineWidth = 2; v45Round(z.x, z.y, z.w, z.h, 12, null, '#8d6340', 3); v45Round(z.x + 3, z.y + 3, z.w - 6, z.h - 6, 10, null, 'rgba(255,255,255,.35)', 1);
    const I = V45_INFO[z.k]; v45Sign(ANI[z.k].name.toUpperCase(), I[1], z.x + z.w/2, z.y - 12);
  });
  // góc: quầy kem, ghế đá, cây bóng mát
  v45fTree(4372, -96, 1.3, dong); v45fTree(5086, -92, 1.3, dong); v45fTree(4352, -238 + 2, 1, dong); v45fTree(5150, -238 + 2, 1, dong);
  rect('#ff8fb1', 4380, -76, 40, 22); rect('#fff', 4380, -82, 40, 6); for(let k = 0; k < 4; k++) rect(k%2 ? '#ff6f91' : '#fff', 4380 + k*10, -90, 10, 8); v45Sign('KEM', 'Ice cream', 4400, -112 + 2);
  rect('#9e9a92', 5056, -66, 34, 6); rect('#7a7670', 5058, -60, 4, 6); rect('#7a7670', 5084, -60, 4, 6);
  plate('NÔNG TRẠI & SỞ THÚ · LẠI GẦN THÚ ĐỂ CHO ĂN · CHẠM VÀO THÚ ĐỂ CƯỠI', L.gx, L.y + L.h - 19);
  ctx.restore();
  try { const by0 = L.y + L.h, sy = by0 + 9 - NY; ctx.drawImage(ctx.canvas, L.gx - 240, sy, 480, 9, L.gx - 240, by0, 480, 9); } catch(e){}
}

// ---------- thú sống: thêm thú sở thú, chia chuồng mới ----------
function v45SetupAnimals(){
  if(!FARM || FARM.v45) return; FARM.v45 = true;
  Object.entries(V45_PENS).forEach(([k, p]) => { FARM.pens[k] = p; });
  V45_ZOO.forEach(z => { FARM.pens[z.k] = {x:z.x + 8, y:z.y + 14, w:z.w - 16, h:z.h - 18}; });
  const rnd = p => [p.x + 12 + Math.random()*(p.w - 24), p.y + 16 + Math.random()*(p.h - 22)];
  FARM.animals.forEach(a => { a.pen = FARM.pens[a.kind]; [a.x, a.y] = rnd(a.pen); a.tx = 0; });
  V45_ZOO.forEach(z => { for(let i = 0; i < z.n; i++){ const p = FARM.pens[z.k], [x, y] = rnd(p); FARM.animals.push({kind:z.k, pen:p, x, y, tx:0, ty:0, wait:Math.random()*3, dir:1, ph:0, moving:false, hunger:.4 + Math.random()*.4, eat:0, heart:0}); } });
  if(typeof V16_ROAM !== 'undefined'){ Object.assign(V16_ROAM, {x:4338, y:-520, w:236, h:118}); Object.assign(V16_MEADOW, {x:4455, y:-458, r:56}); if(V16.sheep) V16.sheep.forEach(s => { s.x = 4400 + Math.random()*110; s.y = -480 + Math.random()*50; }); if(V16.dog){ V16.dog.x = V16.dog.tx = 4540; V16.dog.y = V16.dog.ty = -430; } }
  if(typeof V16_GARDEN_GATE !== 'undefined'){ V16_GARDEN_GATE[0] = 4590; V16_GARDEN_GATE[1] = -237; }
}
function v45Sprites(sp){
  // bong bóng "cần giúp" + hào quang/đèn lồng trái tim (ở mọi nơi)
  const H = V45F.help; if(H && H.a && H.a.visible && inVB(H.a.x, H.a.y)) sp.push({y:H.a.y + 40, f:() => { const x = H.a.x + 26, y = H.a.y - 66 + Math.sin(realT*3)*3; v45Round(x - 17, y - 16, 34, 28, 10, '#fff', '#ff4f7b', 3); tri(x - 9, y + 10, x - 1, y + 10, x - 18, y + 26, '#ff4f7b'); ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(H.kind[0], x, y + 5); ctx.textAlign = 'left'; }});
  const P = PLAYER; if(P && P.visible && PROF && PROF.heq && inVB(P.x, P.y)){
    if(PROF.heq.aura) sp.push({y:P.y - .2, f:() => { ctx.font = '11px sans-serif'; for(let k = 0; k < 5; k++){ const a = realT*1.4 + k*1.2566; ctx.globalAlpha = .55 + .35*Math.sin(realT*3 + k); ctx.fillText('❤️', P.x - 6 + Math.cos(a)*20, P.y - 16 + Math.sin(a)*9); } ctx.globalAlpha = 1; }});
    if(PROF.heq.lantern) sp.push({y:P.y + .3, f:() => { const x = P.x + 14, y = P.y - 52 + Math.sin(realT*2)*3; rect('#6d4c2e', x - 1, y + 8, 1, 14); ctx.fillStyle = 'rgba(255,120,150,.25)'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill(); ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💗', x, y + 5); ctx.textAlign = 'left'; }});
  }
  if(!FARM || VB.x1 < 4290 || VB.x0 > 5180 || VB.y0 > -30) return;
  const n = V45F.near;
  FARM.animals.forEach(a => { if(!inVB(a.x, a.y)) return; sp.push({y:a.y, f:() => {
    if(a === n){ ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(a.x, a.y, 18, 6, 0, 0, Math.PI*2); ctx.stroke(); }
    drawAnimal(a.kind, a.x, a.y, a.dir, a.ph, a.moving);
    if(a.eat > 0 && !a.moving) rect('#c8a24a', a.x + a.dir*10 - 3, a.y - 6, 6, 3);
    if(a.v45yum > realT){ ctx.font = '12px sans-serif'; ctx.fillText('🥕', a.x + a.dir*14 - 6, a.y - (V45_H[a.kind] || 22)*.55); }
    if(a.heart > 0){ ctx.font = 'bold 14px Nunito, sans-serif'; ctx.fillStyle = '#ef4b4b'; ctx.fillText('♥', a.x - 4, a.y - (V45_H[a.kind] || 30) - 6 - (2.5 - a.heart)*8); }
  }}); });
  for(let i = 0; i < 10; i++){ const [x, y] = v45PlotPos(i), [ox, oy] = plotPos(i); if(inVB(x, y)) sp.push({y, f:() => { ctx.save(); ctx.translate(x - ox, y - oy); drawPlot(i); ctx.restore(); }}); }
}

// ---------- trái tim ❤️ ----------
const v45Today = () => new Date().toISOString().slice(0, 10);
function v45Hearts(n, why){
  if(!PROF || !n) return; PROF.hearts = (PROF.hearts || 0) + n;
  floatText(`+${n} ❤️`, '#ff6b8a'); if(why) log('event', `${PROF.name} nhận ${n} ❤️: ${why}.`);
  renderProfHud(); saveProfile();
}
function v45Day(){ if(!PROF) return {}; const d = v45Today(); if(!PROF.hday || PROF.hday.d !== d) PROF.hday = {d, feed:0, help:0}; return PROF.hday; }

// ---------- cho ăn, cưỡi, giúp bạn ----------
function v45Feed(a){
  if(!a) return; if(!PROF){ openLogin(); return; }
  const I = V45_INFO[a.kind] || ['🐾', '', ''], nm = ANI[a.kind].name;
  if(a.v45fed > realT){ toast(`${I[0]} ${nm} đang no bụng rồi. Quay lại sau nhé!`); return; }
  a.v45fed = realT + 60; a.v45yum = realT + 2; a.hunger = 0; a.heart = 2.5; a.wait = 2.5; a.tx = 0; a.moving = false;
  if(PLAYER) a.dir = PLAYER.x < a.x ? -1 : 1; blipSfx(990);
  reward(4, 0, null, true); const D = v45Day(); let h = 0; if(D.feed < 15){ D.feed++; h = 1; v45Hearts(1); }
  toast(`${I[0]} ${nm} (${I[1]}) ăn ngon lành! +4 EXP${h ? ' · +1 ❤️' : ''} · ${I[2]}`);
  try { mprog('feed'); } catch(e){}
}
function v45Ride(a){
  if(!PLAYER || !PLAYER.visible){ openLogin(); return; } const P = PLAYER;
  if(P.boat){ toast('Hãy rời thuyền trước rồi mới cưỡi thú.'); return; }
  if(P.mount) dismount(P, true);
  const i = FARM.animals.indexOf(a); if(i < 0) return; FARM.animals.splice(i, 1); V45F.rideA = a;
  P.cycling = false; P.x = a.x; P.y = a.y; P.dir = a.dir; mount(a.kind); V45F.near = null; v45Act();
}
function v45Summon(kind){ if(!PLAYER || !PLAYER.visible){ openLogin(); return; } if(PLAYER.boat){ toast('Hãy rời thuyền trước rồi mới cưỡi thú.'); return; } if(PLAYER.mount) dismount(PLAYER, true); PLAYER.cycling = false; V45F.rideA = null; hideModal(); mount(kind); v45Act(); }
const V45_HELP = [['📚', 'Bạn làm rơi sách', 'Cảm ơn bạn đã nhặt sách giúp mình!'], ['🎒', 'Bạn cần mang balo nặng', 'Cảm ơn bạn đã xách balo giúp mình!'],
  ['🗺️', 'Bạn bị lạc đường', 'Cảm ơn bạn đã chỉ đường cho mình!'], ['🧹', 'Có rác cạnh bạn', 'Cảm ơn bạn đã cùng nhặt rác!'], ['🌱', 'Cây non cần tưới', 'Cảm ơn bạn đã tưới cây cùng mình!'], ['🩹', 'Bạn bị ngã trầy gối', 'Cảm ơn bạn đã đỡ mình dậy!']];
function v45Help(){
  const H = V45F.help; if(!H) return; V45F.help = null; V45F.helpT = 50 + Math.random()*40; if(!PROF){ openLogin(); return; }
  reward(6, 0, null, true); const D = v45Day(); D.help = (D.help || 0) + 1; v45Hearts(2, 'giúp đỡ ' + (H.a.name || 'bạn'));
  toast(`🤝 ${H.a.name || 'Bạn'}: "${H.kind[2]}" · +2 ❤️`); blipSfx(1320);
}
function v45PickHelp(){
  const P = PLAYER; if(!P || !P.visible || P.boat || P.v16fly) return;
  const cand = agents.filter(a => a !== P && !a.isPlayer && a.visible && !a.inSub && !a.flying && !a.boat && Math.hypot(a.x - P.x, a.y - P.y) < 520);
  if(!cand.length) return; const a = cand[Math.floor(Math.random()*cand.length)], k = V45_HELP[Math.floor(Math.random()*V45_HELP.length)];
  V45F.help = {a, kind:k, until:realT + 70}; toast(`${k[0]} ${a.name || 'Một bạn'} đang cần giúp: ${k[1].toLowerCase()}. Lại gần để giúp nhé!`);
}

// ---------- nút hành động nổi (cảm ứng, chữ to) ----------
function v45Act(){
  const box = V45F.act; if(!box) return; const P = PLAYER, on = P && P.visible && !(openModal && openModal.id);
  const a = V45F.near, H = V45F.help, nearH = H && P && Math.hypot(H.a.x - P.x, H.a.y - P.y) < 70, rid = on && P.mount;
  const want = !on ? '' : [a ? 'feed:' + a.kind : '', a && !rid ? 'ride:' + a.kind : '', nearH ? 'help' : '', rid ? 'down:' + P.mount : ''].join('|');
  if(box.dataset.k === want) return; box.dataset.k = want; box.innerHTML = '';
  const B = (ic, t, f, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v45b ' + (cls || ''); b.innerHTML = `<span class="ic">${ic}</span><span>${t}</span>`; b.onclick = e => { e.stopPropagation(); f(); v45Act(); }; box.appendChild(b); };
  if(on && a){ const I = V45_INFO[a.kind] || ['🐾']; B('🥕', `Cho ${ANI[a.kind].name.toLowerCase()} ăn`, () => v45Feed(V45F.near), 'v45feed'); if(!rid) B(I[0], 'Cưỡi', () => V45F.near && v45Ride(V45F.near), 'v45ride'); }
  if(on && nearH) B('🤝', 'Giúp bạn', v45Help, 'v45help');
  if(rid) B('⬇️', 'Xuống', () => dismount(PLAYER), 'v45down');
  box.hidden = !box.children.length;
}

// ---------- vòng lặp ----------
function v45fTick(dt){
  const P = PLAYER;
  if(FARM && P && P.visible && !P.mount && Math.abs(P.x - V45FL.gx) < 520 && P.y > -580 && P.y < 0){
    let best = null, bd = 46; FARM.animals.forEach(a => { const d = Math.hypot(a.x - P.x, a.y - P.y); if(d < bd){ bd = d; best = a; } }); V45F.near = best;
  } else V45F.near = null;
  if(V45F.help){ const H = V45F.help; if(realT > H.until || !H.a.visible){ V45F.help = null; V45F.helpT = 40; } }
  else if(PROF && P && P.visible){ V45F.helpT -= dt; if(V45F.helpT <= 0){ V45F.helpT = 60; v45PickHelp(); } }
  if(typeof WEV !== 'undefined'){ if(WEV && WEV.T.k === 'litter'){ if(V45F.litterW !== WEV){ V45F.litterW = WEV; V45F.litterN = 0; } const g = WEV.items.filter(i => i.got).length; if(g > V45F.litterN){ v45Hearts(g - V45F.litterN, g === WEV.items.length ? 'nhặt rác bảo vệ môi trường' : null); V45F.litterN = g; } } else if(!WEV) V45F.litterW = null; }
  v45Act();
}

// ---------- chạm vào thú để cưỡi ----------
function v45HitAnimal(wx, wy){
  if(!FARM || wx < 4280 || wx > 5190 || wy < -580 || wy > 0) return null; let best = null, bd = 1e9;
  FARM.animals.forEach(a => { const h = V45_H[a.kind] || 22, r = Math.max(16, h*.55), d = Math.hypot(wx - a.x, wy - (a.y - h/2)); if(d < r && d < bd){ bd = d; best = a; } }); return best;
}
function v45TapInit(){
  window.addEventListener('pointerdown', e => { V45F.tap = e.target === cvs ? {x:e.clientX, y:e.clientY, t:performance.now(), id:e.pointerId} : null; }, true);
  window.addEventListener('pointerup', e => {
    const T = V45F.tap; V45F.tap = null; if(!T || e.pointerId !== T.id || e.target !== cvs || performance.now() - T.t > 350 || Math.hypot(e.clientX - T.x, e.clientY - T.y) > 10) return;
    if(!PLAYER || !PLAYER.visible || PLAYER.boat) return;
    const r = cvs.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top), a = v45HitAnimal(wx, wy); if(!a) return;
    e.stopImmediatePropagation(); try { drag = null; cvs.classList.remove('dragging'); } catch(_){}
    v45Ride(a);
  }, true);
}

// ---------- hồ sơ: số tim nhỏ gọn ----------
function v45ProfHud(){
  const m = $('#profMoney'); if(!m) return; let s = $('#v45Heart');
  if(!s){ s = document.createElement('span'); s.id = 'v45Heart'; s.className = 'v45heart'; s.title = 'Trái tim: làm việc tốt để nhận, dùng mua vật phẩm đặc biệt'; m.after(s); }
  s.textContent = PROF ? '❤️ ' + (PROF.hearts || 0) : ''; s.hidden = !PROF;
}

// ---------- cửa hàng: tab "Đặc biệt ❤️" (mua bằng trái tim) ----------
const V45_SPECIAL = [
  {id:'h_lantern', n:'Đèn lồng trái tim', h:8, t:'lantern', d:'Đèn lồng hồng bay theo bạn.'},
  {id:'h_aura', n:'Hào quang trái tim', h:12, t:'aura', d:'Những trái tim nhỏ xoay quanh bạn.'},
  {id:'h_elephant', n:'Voi con thân thiện', h:20, t:'ride', k:'elephant', d:'Gọi voi con tới cưỡi ở bất cứ đâu.'},
  {id:'h_unicorn', n:'Kỳ lân cầu vồng', h:30, t:'ride', k:'unicorn', d:'Gọi kỳ lân cầu vồng, chạy nhanh nhất.'}
];
function v45ShopGrid(){
  const g = $('#shopGrid'); if(!g || !PROF) return; g.innerHTML = ''; const hs = PROF.hearts || 0; PROF.hinv = PROF.hinv || {}; PROF.heq = PROF.heq || {};
  const m = $('#shopMoney'); if(m) m.textContent = `❤️ ${hs} · $${PROF.money} · Level ${PROF.level}`;
  const intro = document.createElement('p'); intro.className = 'v45shopnote'; intro.textContent = '❤️ Làm việc tốt (cho thú ăn, nhặt rác, tưới cây, giúp bạn) để nhận trái tim.'; g.appendChild(intro);
  V45_SPECIAL.forEach(it => {
    const own = !!PROF.hinv[it.id], c = el('div', {className:'scard v45card' + (own && PROF.heq[it.t] ? ' eq' : '')});
    const cv = el('canvas', {width:120, height:90}); c.appendChild(cv);
    withCtx(cv.getContext('2d'), () => { const gg = ctx.createLinearGradient(0, 0, 0, 90); gg.addColorStop(0, '#5a2a4a'); gg.addColorStop(1, '#24183a'); ctx.fillStyle = gg; ctx.fillRect(0, 0, 120, 90);
      if(it.t === 'ride'){ ctx.save(); ctx.translate(60, 78); ctx.scale(1.6, 1.6); drawAnimal(it.k, 0, 0, 1, 0, false); ctx.restore(); }
      else { ctx.font = it.t === 'aura' ? '22px sans-serif' : '34px sans-serif'; ctx.textAlign = 'center'; if(it.t === 'aura') for(let k = 0; k < 5; k++) ctx.fillText('❤️', 60 + Math.cos(k*1.2566)*32, 50 + Math.sin(k*1.2566)*18); else ctx.fillText('🏮', 60, 58); ctx.textAlign = 'left'; } });
    const t = el('div', {className:'sname'}); t.textContent = it.n; c.appendChild(t);
    const d = el('div', {className:'sdesc'}); d.textContent = it.d; c.appendChild(d);
    const b = el('button', {type:'button'});
    if(!own){ b.textContent = `Mua ${it.h} ❤️`; b.className = 'primary'; b.disabled = hs < it.h; b.onclick = () => { if((PROF.hearts || 0) < it.h || PROF.hinv[it.id]) return; PROF.hearts -= it.h; PROF.hinv[it.id] = Date.now(); if(it.t !== 'ride') PROF.heq[it.t] = true; floatText(`-${it.h} ❤️`, '#ff6b8a'); toast(`Đã đổi ${it.h} ❤️ lấy ${it.n}!`); blipSfx(1320); log('event', `${PROF.name} đổi trái tim lấy ${it.n}.`); renderProfHud(); saveProfile(); v45ShopGrid(); }; }
    else if(it.t === 'ride'){ b.textContent = 'Gọi & cưỡi'; b.className = 'primary'; b.onclick = () => v45Summon(it.k); }
    else { const on = !!PROF.heq[it.t]; b.textContent = on ? 'Đang dùng · Tắt' : 'Bật lên'; b.onclick = () => { PROF.heq[it.t] = !on; saveProfile(); v45ShopGrid(); }; }
    c.appendChild(b); g.appendChild(c);
  });
}

// ---------- khởi tạo: bọc hàm cũ, không sửa file cũ ----------
function v45FarmInit(){
  V45F.base = {drawAnimal, dismount, renderProfHud, renderShop, drawZonesStatic, farmWater, farmFeed, reward};
  Object.assign(ANI, V45_ANI); Object.assign(ANI.cow, {sp:130, ride:-17}); Object.assign(ANI.goat, {sp:150, ride:-12}); Object.assign(ANI.chicken, {sp:140, ride:-9}); Object.assign(ANI.pig, {sp:120, ride:-10});
  drawAnimal = function(kind){ return V45_ANI[kind] ? v45DrawAnimal.apply(this, arguments) : V45F.base.drawAnimal.apply(this, arguments); };
  dismount = function(c, quiet){ const had = c && c.mount; const r = V45F.base.dismount.apply(this, arguments);
    if(had && V45F.rideA && FARM){ const a = V45F.rideA; V45F.rideA = null; a.x = c.x + 14; a.y = c.y + 6; a.tx = 0; a.wait = 1.5; a.moving = false; FARM.animals.push(a); } v45Act(); return r; };
  renderProfHud = function(){ const r = V45F.base.renderProfHud.apply(this, arguments); try { v45ProfHud(); } catch(e){} return r; };
  if(!SHOP_TABS.some(t => t[0] === 'v45heart')) SHOP_TABS.push(['v45heart', 'Đặc biệt ❤️']);
  renderShop = function(){ const r = V45F.base.renderShop.apply(this, arguments); if(shopTab === 'v45heart') v45ShopGrid(); return r; };
  drawZonesStatic = function(){ const r = V45F.base.drawZonesStatic.apply(this, arguments); try { v45DrawFarmStatic(); } catch(e){ console.warn('v45 farm static', e); } return r; };
  farmWater = function(){ const n = FARM ? FARM.plots.filter(p => p.fruit && plotStage(p) < 5).length : 0; const r = V45F.base.farmWater.apply(this, arguments); if(n && realT > V45F.cdWater){ V45F.cdWater = realT + 30; v45Hearts(1, 'tưới cây trong vườn'); } return r; };
  farmFeed = function(){ const r = V45F.base.farmFeed.apply(this, arguments); if(realT > V45F.cdFeed){ V45F.cdFeed = realT + 90; v45Hearts(1, 'cho cả nông trại ăn'); } return r; };
  reward = function(exp, money, why){ const r = V45F.base.reward.apply(this, arguments); if(why && /chăn cừu/i.test(why)) v45Hearts(2, 'giúp chó chăn cừu lùa đàn'); return r; };
  farmSprites = v45Sprites;
  v45SetupAnimals();
  const box = document.createElement('div'); box.id = 'v45Act'; box.hidden = true; document.body.appendChild(box); V45F.act = box;
  v45TapInit();
  const baseUp = extUpdate; extUpdate = function(dtR){ const r = baseUp.apply(this, arguments); try { v45fTick(dtR); } catch(e){ console.warn('v45 tick', e); } return r; };
  try { northCache = null; } catch(e){}
  v45ProfHud();
}
