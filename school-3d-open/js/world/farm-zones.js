// ================= EXT: ANIMALS =================
const ANI = {
  horse:  {name:'Ngựa',    sp:300, ride:-17, c:'#8b5a2b', d:'#3a2418'},
  buffalo:{name:'Trâu',    sp:135, ride:-17, c:'#4a4a55', d:'#2a2a30'},
  camel:  {name:'Lạc đà',  sp:195, ride:-27, c:'#c9a26b', d:'#9c7a48'},
  ostrich:{name:'Đà điểu', sp:340, ride:-25, c:'#262626', d:'#f2b8a0'},
  cow:    {name:'Bò sữa',  sp:60,  c:'#f4f4f4', d:'#222'},
  goat:   {name:'Dê',      sp:70,  c:'#d9d4c7', d:'#8a7f6a'},
  chicken:{name:'Gà',      sp:60,  c:'#fafafa', d:'#e53935'},
  pig:    {name:'Heo',     sp:50,  c:'#f7a8b8', d:'#d77a8e'}
};
function drawAnimal(kind, x, y, dir, ph, moving){
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if(dir < 0) ctx.scale(-1, 1);
  const A = ANI[kind], st = moving ? Math.round(Math.sin(ph)*2) : 0;
  rect('rgba(0,0,0,.22)', -14, -2, 28, 4);
  if(kind === 'horse' || kind === 'buffalo' || kind === 'cow' || kind === 'camel'){
    const tall = kind === 'camel' ? 8 : kind === 'horse' ? 3 : 0, bl = kind === 'buffalo' ? 30 : 26;
    const ly = -12 - tall;
    rect(A.d, -11, ly, 3, 12 + tall + st); rect(A.d, -6, ly, 3, 12 + tall - st); rect(A.d, 5, ly, 3, 12 + tall - st); rect(A.d, 10, ly, 3, 12 + tall + st);
    rect(A.c, -bl/2, ly - 11, bl, 12);
    if(kind === 'cow'){ rect('#222', -8, ly - 9, 6, 5); rect('#222', 3, ly - 6, 5, 4); rect('#f7a8b8', -2, ly, 5, 2); }
    if(kind === 'camel'){ rect(A.c, -6, ly - 17, 10, 7); rect(A.d, -4, ly - 19, 6, 3); }
    if(kind === 'horse'){ rect(A.c, 9, ly - 22, 6, 14); rect(A.c, 11, ly - 26, 10, 7); rect(A.d, 8, ly - 26, 3, 14); rect('#111', 17, ly - 24, 2, 2); rect(A.d, -15, ly - 10, 3, 10 + st); }
    else if(kind === 'camel'){ rect(A.c, 11, ly - 22, 4, 14); rect(A.c, 13, ly - 25, 9, 5); rect('#111', 18, ly - 24, 2, 2); rect(A.d, -14, ly - 9, 2, 7); }
    else { rect(A.c, 12, ly - 12, 9, 9); rect('#111', 17, ly - 10, 2, 2); rect(A.d, -16, ly - 9, 3, 8);
      if(kind === 'buffalo'){ rect('#e8e0cc', 9, ly - 17, 3, 5); rect('#e8e0cc', 6, ly - 19, 5, 2); rect('#e8e0cc', 19, ly - 17, 3, 5); rect('#e8e0cc', 20, ly - 19, 5, 2); }
      else { rect('#e8e0cc', 13, ly - 15, 2, 3); rect('#e8e0cc', 18, ly - 15, 2, 3); rect('#f7a8b8', 18, ly - 6, 4, 3); } }
  } else if(kind === 'ostrich'){
    rect(A.d, -3, -22, 2, 22 + st); rect(A.d, 2, -22, 2, 22 - st);
    ctx.fillStyle = A.c; ctx.beginPath(); ctx.ellipse(0, -26, 11, 7, 0, 0, Math.PI*2); ctx.fill();
    rect('#f4f4f4', -12, -30, 5, 6); rect(A.d, 6, -46, 3, 20); rect(A.d, 6, -50, 7, 5); rect('#111', 10, -49, 2, 2); rect('#e8a070', 13, -48, 3, 2);
  } else if(kind === 'goat'){
    rect(A.d, -6, -8, 2, 8 + st); rect(A.d, 4, -8, 2, 8 - st); rect(A.c, -8, -15, 16, 8); rect(A.c, 6, -20, 7, 7); rect('#8a7f6a', 7, -24, 2, 4); rect('#111', 10, -18, 2, 2); rect('#f4f4f4', 9, -13, 2, 3);
  } else if(kind === 'pig'){
    rect(A.d, -6, -5, 3, 5); rect(A.d, 4, -5, 3, 5); rect(A.c, -8, -13, 17, 9); rect(A.c, 8, -12, 5, 6); rect(A.d, 12, -10, 2, 3); rect('#111', 9, -11, 1, 1);
  } else if(kind === 'chicken'){
    rect('#f2b800', -2, -3, 1, 3); rect('#f2b800', 1, -3, 1, 3); rect(A.c, -4, -9, 8, 6); rect(A.c, 2, -12, 4, 4); rect(A.d, 3, -14, 2, 2); rect('#f2b800', 6, -11, 2, 1); rect('#ddd', -5, -10, 2, 3);
  }
  ctx.restore();
}

// ================= EXT: FARM =================
var FARM = null;
const FRUITS = {xoai:['Xoài','#ffb300'], cam:['Cam','#ff8a00'], tao:['Táo','#e53935'], bo:['Bơ','#7cb342'], saurieng:['Sầu riêng','#c0ca33'], thanhlong:['Thanh long','#e91e63'], chuoi:['Chuối','#ffe14d'], vai:['Vải','#c2185b']};
const STAGES = ['Hạt giống','Nảy mầm','Cây non','Cây lớn','Ra hoa','Có trái chín'];
function farmInit(){
  const f = R.farm;
  const pens = {horse:{x:4330,y:-515,w:220,h:140}, buffalo:{x:4590,y:-515,w:170,h:140}, camel:{x:4790,y:-515,w:180,h:140}, ostrich:{x:4330,y:-335,w:220,h:130}, cow:{x:4590,y:-335,w:180,h:130}, goat:{x:4790,y:-335,w:180,h:130}, chicken:{x:5005,y:-380,w:150,h:90}, pig:{x:5005,y:-270,w:150,h:70}};
  const cnt = {horse:3, buffalo:2, camel:2, ostrich:3, cow:2, goat:3, chicken:8, pig:2};
  const animals = [];
  Object.keys(cnt).forEach(k => { for(let i=0;i<cnt[k];i++){ const p = pens[k]; animals.push({kind:k, pen:p, x:p.x + 20 + Math.random()*(p.w - 40), y:p.y + 30 + Math.random()*(p.h - 40), tx:0, ty:0, wait:Math.random()*3, dir:1, ph:0, moving:false, hunger:.4 + Math.random()*.4, eat:0, heart:0}); } });
  const trough = k => [pens[k].x + pens[k].w/2, pens[k].y + pens[k].h - 14];
  let plots = [];
  try { plots = JSON.parse(localStorage.getItem('truong-farm-v1') || '[]') || []; } catch(e){ plots = []; }
  for(let i=0;i<10;i++) if(!plots[i]) plots[i] = {fruit:null, t0:0, water:0};
  FARM = {pens, animals, trough, plots, fed:0};
}
function farmSave(){ try { localStorage.setItem('truong-farm-v1', JSON.stringify(FARM.plots)); } catch(e){} }
const plotPos = i => [4360 + (i%5)*128, -150 + Math.floor(i/5)*62];
function plotStage(p){ if(!p.fruit) return -1; const e = (Date.now() - p.t0)/1000 + p.water*25; return e < 15 ? 0 : e < 45 ? 1 : e < 90 ? 2 : e < 140 ? 3 : e < 190 ? 4 : 5; }
function farmUpdate(dt){
  if(!FARM) return;
  FARM.animals.forEach(a => {
    a.hunger = Math.min(1, a.hunger + dt*.004); a.heart = Math.max(0, a.heart - dt);
    let tx, ty;
    if(a.eat > 0){ [tx, ty] = FARM.trough(a.kind); tx += (FARM.animals.indexOf(a)%4 - 1.5)*14; }
    else { if(a.wait > 0){ a.wait -= dt; a.moving = false; return; } if(!a.tx){ a.tx = a.pen.x + 16 + Math.random()*(a.pen.w - 32); a.ty = a.pen.y + 26 + Math.random()*(a.pen.h - 36); } tx = a.tx; ty = a.ty; }
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), sp = (a.eat > 0 ? 1.6 : .45) * ANI[a.kind].sp * .35;
    if(d < 3){ a.moving = false; if(a.eat > 0){ a.eat -= dt; a.hunger = Math.max(0, a.hunger - dt*.3); if(a.eat <= 0) a.heart = 2.5; } else { a.tx = 0; a.wait = 1 + Math.random()*4; } return; }
    a.moving = true; a.x += dx/d*Math.min(d, sp*dt); a.y += dy/d*Math.min(d, sp*dt); if(Math.abs(dx) > .5) a.dir = dx < 0 ? -1 : 1; a.ph += dt*12;
  });
}
function farmFeed(){
  if(!FARM) return; FARM.animals.forEach(a => { a.eat = 2 + Math.random()*2; a.tx = 0; }); FARM.fed = realT + 6;
  log('event', 'Các bạn cho thú ăn: ngựa, trâu, lạc đà, đà điểu, bò, dê, gà, heo đều chạy tới máng ăn.'); toast('Đã đổ thức ăn vào máng. Các con vật đang chạy tới ăn!'); mprog('feed'); renderFarm();
}
function farmPlant(fruit){
  const i = FARM.plots.findIndex(p => !p.fruit); if(i < 0){ toast('Vườn đã kín chỗ. Hãy thu hoạch trước.'); return; }
  FARM.plots[i] = {fruit, t0:Date.now(), water:0}; farmSave(); mprog('plant'); log('event', `Trồng một cây ${FRUITS[fruit][0]} ở ô vườn số ${i+1}.`); renderFarm();
}
function farmWater(){ let n = 0; FARM.plots.forEach(p => { if(p.fruit && plotStage(p) < 5){ p.water++; n++; } }); farmSave(); toast(n ? `Đã tưới ${n} cây. Cây lớn nhanh hơn!` : 'Chưa có cây nào cần tưới.'); renderFarm(); }
function farmHarvest(){
  let got = []; FARM.plots.forEach((p, i) => { if(plotStage(p) === 5){ got.push(FRUITS[p.fruit][0]); FARM.plots[i] = {fruit:null, t0:0, water:0}; } });
  farmSave();
  if(got.length){ toast('Thu hoạch: ' + got.join(', ')); mprog('harvest'); log('event', 'Thu hoạch trái cây: ' + got.join(', ') + '.'); } else toast('Chưa có cây nào ra trái chín.');
  renderFarm();
}
function drawPlot(i){
  const [x, y] = plotPos(i), p = FARM.plots[i], st = plotStage(p);
  rect('#6d4c2e', x - 26, y - 4, 52, 16); rect('#5a3d24', x - 24, y - 2, 48, 12);
  if(st < 0) return;
  const fc = FRUITS[p.fruit][1];
  if(st === 0){ rect('#3a2a1a', x - 3, y + 2, 6, 3); return; }
  if(st === 1){ rect('#4caf50', x - 1, y - 6, 2, 8); rect('#66bb6a', x - 5, y - 8, 4, 3); rect('#66bb6a', x + 1, y - 9, 4, 3); return; }
  const h = st === 2 ? 18 : 30, cr = st === 2 ? 9 : 16;
  rect('#6d4c2e', x - 2, y - h, 4, h + 4);
  circ(x, y - h - cr*.4, cr, p.fruit === 'chuoi' ? '#7cb342' : '#2e7d32'); circ(x - cr*.6, y - h + 2, cr*.7, '#388e3c'); circ(x + cr*.6, y - h + 2, cr*.7, '#33691e');
  if(st === 4) for(let k=0;k<7;k++) circ(x + Math.cos(k*2.3)*cr*.8, y - h - cr*.3 + Math.sin(k*2.3)*cr*.6, 2, '#fff8e1');
  if(st === 5) for(let k=0;k<8;k++) circ(x + Math.cos(k*2.1)*cr*.75, y - h - cr*.3 + Math.sin(k*2.1)*cr*.6, 3, fc);
}
function farmSprites(sp){
  if(!FARM || VB.x1 < 4290 || VB.y0 > -30) return;
  FARM.animals.forEach(a => { if(inVB(a.x, a.y)) sp.push({y:a.y, f:() => { drawAnimal(a.kind, a.x, a.y, a.dir, a.ph, a.moving); if(a.eat > 0 && !a.moving) rect('#c8a24a', a.x + a.dir*10 - 3, a.y - 6, 6, 3); if(a.heart > 0){ ctx.font = '16px VT323, monospace'; ctx.fillStyle = '#ef4b4b'; ctx.fillText('♥', a.x - 3, a.y - 34 - (2.5 - a.heart)*8); } }}); });
  for(let i=0;i<10;i++){ const [x, y] = plotPos(i); if(inVB(x, y)) sp.push({y, f:() => drawPlot(i)}); }
}

// ================= EXT: OUTDOOR ZONES (static, in north cache) =================
function zoneBlock(x, y){ for(const k of ['bpad','skate','patin','basket','ski','art','farm']){ const r = R[k]; if(x > r.x - 14 && x < r.x + r.w + 14 && y > r.y - 20 && y < r.y + r.h + 24) return true; } return false; }
function drawZonesStatic(){
  const dong = season === 'dong';
  let r = R.bpad; rect(dong ? '#e3ebee' : '#7cb35a', r.x, r.y, r.w, r.h);
  for(let i=0;i<4;i++){ const cx = r.x + 90 + i*150, cy = r.y + 100; ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 44, 18, 0, 0, Math.PI*2); ctx.stroke(); ctx.font = '22px Bungee, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'center'; ctx.fillText('H', cx, cy + 8); ctx.textAlign = 'left'; }
  plate('KHU KHINH KHÍ CẦU · BẤM ĐỂ BAY', r.x + r.w/2, r.y + r.h - 14);
  r = R.skate; rect('#9ea3a8', r.x, r.y, r.w, r.h); for(let x=r.x; x<r.x + r.w; x+=40) rect('#959aa0', x, r.y, 1, r.h);
  const hp = ctx.createLinearGradient(0, r.y, 0, r.y + 90); hp.addColorStop(0, '#5f656c'); hp.addColorStop(.5, '#b8bec4'); hp.addColorStop(1, '#9ea3a8'); ctx.fillStyle = hp; ctx.fillRect(r.x + 10, r.y + 10, r.w - 20, 90); rect('#e0e0e0', r.x + 10, r.y + 10, r.w - 20, 4);
  rect('#7a8086', r.x + 20, r.y + 150, 50, 30); tri(r.x + 70, r.y + 150, r.x + 70, r.y + 180, r.x + 100, r.y + 180, '#8a9096'); tri(r.x + 20, r.y + 150, r.x + 20, r.y + 180, r.x - 6 + 16, r.y + 180, '#8a9096');
  rect('#cfd8dc', r.x + 120, r.y + 200, 60, 3); rect('#78909c', r.x + 124, r.y + 203, 2, 8); rect('#78909c', r.x + 174, r.y + 203, 2, 8);
  ctx.font = '13px Bungee, sans-serif'; ctx.fillStyle = 'rgba(255,111,145,.85)'; ctx.fillText('SKATE', r.x + 120, r.y + 160);
  plate('SÂN TRƯỢT VÁN · BẤM ĐỂ CHƠI', r.x + r.w/2, r.y + r.h - 16);
  r = R.patin; rect('#7b8fa6', r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#c7d6e6'; ctx.beginPath(); ctx.ellipse(r.x + 100, r.y + 140, 90, 128, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#ff6f91'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x + 100, r.y + 140, 50, 86, 0, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#7b8fa6'; ctx.beginPath(); ctx.ellipse(r.x + 100, r.y + 140, 38, 74, 0, 0, Math.PI*2); ctx.fill();
  plate('SÂN TRƯỢT PATIN · BẤM ĐỂ CHƠI', r.x + r.w/2, r.y + r.h - 16);
  r = R.basket; rect('#2f5f8a', r.x, r.y, r.w, r.h); rect('#c8743a', r.x + 14, r.y + 14, r.w - 28, r.h - 44);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 14, r.y + 14, r.w - 28, r.h - 44);
  ctx.beginPath(); ctx.moveTo(r.x + 14, r.y + 14 + (r.h - 44)/2); ctx.lineTo(r.x + r.w - 14, r.y + 14 + (r.h - 44)/2); ctx.stroke();
  ctx.beginPath(); ctx.arc(r.x + r.w/2, r.y + 14 + (r.h - 44)/2, 22, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(r.x + r.w/2, r.y + 30, 50, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(r.x + r.w/2, r.y + r.h - 46, 50, Math.PI, 0); ctx.stroke();
  plate('SÂN BÓNG RỔ · BẤM ĐỂ CHƠI', r.x + r.w/2, r.y + r.h - 16);
  r = R.ski; const sg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#dbe9f2'); ctx.fillStyle = sg;
  ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + 40, r.y + 10); ctx.lineTo(r.x + r.w - 40, r.y + 10); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(150,180,210,.5)'; ctx.lineWidth = 2; for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(r.x + 120 + k*60, r.y + 20); ctx.bezierCurveTo(r.x + 60 + k*70, r.y + 200, r.x + 200 + k*50, r.y + 320, r.x + 110 + k*70, r.y + r.h); ctx.stroke(); }
  for(let k=0;k<9;k++){ const x = r.x + 30 + (k%2)*(r.w - 60), y = r.y + 40 + k*50; tri(x - 9, y + 10, x + 9, y + 10, x, y - 16, '#2e5a44'); rect('#fff', x - 5, y - 8, 10, 3); rect('#5a3a1e', x - 1, y + 10, 3, 5); }
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x + 70, r.y + r.h - 20); ctx.lineTo(r.x + 90, r.y + 30); ctx.stroke(); rect('#795548', r.x + 64, r.y + r.h - 26, 12, 16); rect('#795548', r.x + 84, r.y + 22, 12, 14);
  rect('#8d5a3a', r.x + r.w - 150, r.y + r.h - 70, 100, 50); tri(r.x + r.w - 160, r.y + r.h - 70, r.x + r.w - 40, r.y + r.h - 70, r.x + r.w - 100, r.y + r.h - 105, '#f4f4f4'); rect('#ffd23f', r.x + r.w - 120, r.y + r.h - 56, 14, 12); rect('#ffd23f', r.x + r.w - 90, r.y + r.h - 56, 14, 12);
  plate('SÂN TRƯỢT TUYẾT · BẤM ĐỂ CHƠI', r.x + r.w/2, r.y + r.h - 12);
  r = R.art; rect('#b08a5a', r.x, r.y + 120, r.w, 170); for(let x=r.x; x<r.x + r.w; x+=18) rect('#9c7a4c', x, r.y + 120, 2, 170);
  plate('GÓC HỌA SĨ · BẤM ĐỂ VẼ TRANH', r.x + r.w/2, r.y + r.h - 40);
  r = R.farm; rect(dong ? '#e8eef0' : '#8fbf5a', r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#6d4c2e'; ctx.beginPath(); ctx.ellipse(4675, -430, 60, 26, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = dong ? '#cfe3ec' : '#7a5a3a'; ctx.beginPath(); ctx.ellipse(4675, -430, 52, 20, 0, 0, Math.PI*2); ctx.fill();
  rect('#e8cf8f', 4795, -510, 170, 130); for(let k=0;k<20;k++) rect('#d9bd78', 4800 + (k*37)%160, -505 + (k*23)%120, 6, 3);
  Object.values(FARM.pens).forEach(p => { ctx.fillStyle = dong ? 'rgba(255,255,255,.25)' : 'rgba(150,200,90,.45)'; ctx.beginPath(); ctx.ellipse(p.x + p.w/2, p.y + p.h/2, p.w/2, p.h/2, 0, 0, Math.PI*2); ctx.fill(); const [tx, ty] = [p.x + p.w/2, p.y + p.h - 14]; rect('#6d4c2e', tx - 26, ty - 4, 52, 10); rect('#c8a24a', tx - 23, ty - 3, 46, 4); });
  rect('#b71c1c', 5010, -530, 140, 110); tri(5000, -530, 5160, -530, 5080, -575, '#7f1010'); rect('#fff', 5060, -490, 40, 70); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5060, -490); ctx.lineTo(5100, -420); ctx.moveTo(5100, -490); ctx.lineTo(5060, -420); ctx.stroke();
  rect('#b0bec5', 4975, -540, 26, 100); circ(4988, -540, 13, '#90a4ae');
  for(let k=0;k<3;k++){ circ(5030 + k*40, -170, 14, '#e8c35a'); rect('#d4a83a', 5018 + k*40, -170, 24, 10); }
  rect('#795548', 5040, -400, 60, 22); tri(5034, -400, 5106, -400, 5070, -418, '#a1887f');
  rect('#6d4c2e', 4330, -185, 650, 2); ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#1a1206'; ctx.fillText('VƯỜN CÂY ĂN TRÁI', 4334, -190);
  [['NGỰA',4440,-520],['TRÂU',4675,-520],['LẠC ĐÀ',4880,-520],['ĐÀ ĐIỂU',4440,-340],['BÒ SỮA',4680,-340],['DÊ',4880,-340],['GÀ',5080,-384],['HEO',5080,-274]].forEach(([t, x, y]) => { ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#2a1c10'; ctx.textAlign = 'center'; ctx.fillText(t, x, y); ctx.textAlign = 'left'; });
  plate('NÔNG TRẠI · CHO THÚ ĂN · TRỒNG CÂY · CƯỠI THÚ', r.x + r.w/2, r.y + r.h - 6);
}

// ================= EXT: OUTDOOR ZONE LIFE (sprites) =================
function fakeAt(i, x, y, dir, extra){ const f = Object.assign(lookFor(i), {x, y, dir}, extra || {}); return f; }
function bodyAt(f, lift){ ctx.save(); ctx.translate(Math.round(f.x), Math.round(f.y - (lift || 0))); drawBody(f, false); ctx.restore(); }
var ZL = {t:0};
function zoneSprites(sp){
  if(VB.y0 > -40 || VB.x1 < 2640 || VB.x0 > 5180) return;
  const t = realT, day = isDay() && !isStorm();
  let r = R.skate;
  if(day && VB.x0 < r.x + r.w && VB.x1 > r.x) for(let i=0;i<3;i++){
    const u = (Math.sin(t*.9 + i*2.1) + 1)/2, x = r.x + 24 + u*(r.w - 48), y = r.y + (i === 0 ? 60 : i === 1 ? 190 : 250), vx = Math.cos(t*.9 + i*2.1);
    const lift = i === 0 ? Math.max(0, (Math.abs(u - .5) - .38)*260) : i === 1 && Math.abs(x - (r.x + 60)) < 30 ? 10 : 0;
    const f = fakeAt(20 + i, x, y, vx > 0 ? 1 : -1, {moving:false});
    sp.push({y, f:() => { ctx.save(); ctx.translate(x, y - lift); if(lift > 6) ctx.rotate(Math.sin(t*6)*.3); rect('#222', -10, -2, 20, 3); rect('#ff6f91', -9, -3, 18, 2); rect('#ddd', -8, 1, 3, 2); rect('#ddd', 5, 1, 3, 2); ctx.translate(0, -3); drawBody(f, false); ctx.restore(); }});
  }
  r = R.patin;
  if(day && VB.x0 < r.x + r.w && VB.x1 > r.x) for(let i=0;i<5;i++){
    const a = t*(.5 + i*.06) + i*1.25, x = r.x + 100 + Math.cos(a)*70, y = r.y + 140 + Math.sin(a)*106, f = fakeAt(30 + i, x, y, -Math.sin(a) > 0 ? 1 : -1, {moving:true, walk:t*6 + i});
    sp.push({y, f:() => { bodyAt(f); rect('#e53935', x - 6, y - 1, 5, 2); rect('#e53935', x + 1, y - 1, 5, 2); }});
  }
  r = R.basket;
  if(day && VB.x0 < r.x + r.w && VB.x1 > r.x){
    const hoop = [r.x + r.w/2, r.y + 26];
    rect('#eee', hoop[0] - 14, hoop[1] - 18, 28, 14); rect('#e65100', hoop[0] - 7, hoop[1] - 4, 14, 2);
    for(let i=0;i<4;i++){
      const x = r.x + 40 + i*40 + Math.sin(t*.7 + i)*10, y = r.y + 120 + (i%2)*40, f = fakeAt(40 + i, x, y, 1, {moving:i%2 === 1, walk:t*5});
      sp.push({y, f:() => bodyAt(f)});
    }
    const ph = (t % 2.6)/2.6, s0 = [r.x + 80, r.y + 100], bx = s0[0] + (hoop[0] - s0[0])*ph, by = s0[1] + (hoop[1] - s0[1])*ph - Math.sin(ph*Math.PI)*60;
    sp.push({y:r.y + 300, f:() => circ(bx, by, 4, '#e65100')});
  }
  r = R.ski;
  if(VB.x0 < r.x + r.w && VB.x1 > r.x){
    for(let k=0;k<6;k++){ const u = ((t*.05 + k/6) % 1), x = r.x + 70 + 20*u, y = r.y + r.h - 20 - (r.h - 50)*u; rect('#333', x - 1, y, 2, 8); rect('#1565c0', x - 6, y + 8, 12, 4); }
    if(day) for(let i=0;i<4;i++){
      const u = ((t*.07 + i/4) % 1), y = r.y + 30 + u*(r.h - 80), x = r.x + 160 + i*70 + Math.sin(u*18 + i)*40, f = fakeAt(50 + i, x, y, Math.cos(u*18 + i) > 0 ? 1 : -1, {cap:['#ef4b4b','#3d7bff','#ffd23f','#2fbf71'][i]});
      sp.push({y, f:() => { rect('#263238', x - 9, y - 1, 18, 2); bodyAt(f); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x - 12 - f.dir*6, y - 4, 6, 3); }});
    }
  }
  r = R.bpad;
  if(VB.x0 < r.x + r.w && VB.x1 > r.x) for(let i=0;i<3;i++){
    const cx = r.x + 90 + i*150, cy = r.y + 100, bob = Math.sin(t*1.3 + i)*3, inf = i === 2 ? .6 + .4*Math.abs(Math.sin(t*.3)) : 1;
    const cols = [['#ef4b4b','#ffd23f'],['#3d7bff','#f4f4f4'],['#2fbf71','#ff8a2b']][i];
    sp.push({y:cy + 10, f:() => {
      rect('#8d6e4a', cx - 12, cy - 8 + bob, 24, 16); rect('#6d4c2e', cx - 12, cy - 8 + bob, 24, 3);
      const by = cy - 70*inf + bob; ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.ellipse(cx, by, 34*inf, 42*inf, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = cols[1]; for(let k=-1;k<=1;k++) ctx.fillRect(cx + k*16*inf - 4, by - 40*inf, 8, 80*inf);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 22*inf, by + 30*inf); ctx.lineTo(cx - 10, cy - 8 + bob); ctx.moveTo(cx + 22*inf, by + 30*inf); ctx.lineTo(cx + 10, cy - 8 + bob); ctx.stroke();
      if(Math.floor(t*6 + i) % 3 === 0){ circ(cx, cy - 14 + bob, 4, '#ffb300'); circ(cx, cy - 17 + bob, 2, '#fff59d'); }
      ctx.strokeStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(cx - 12, cy + 6); ctx.lineTo(cx - 30, cy + 22); ctx.moveTo(cx + 12, cy + 6); ctx.lineTo(cx + 30, cy + 22); ctx.stroke();
    }});
  }
  r = R.art;
  if(VB.x0 < r.x + r.w && VB.x1 > r.x) for(let i=0;i<4;i++){
    const ex = r.x + 32 + i*64, ey = r.y + 230, E = EASELS[i];
    sp.push({y:ey, f:() => {
      rect('#6d4c2e', ex - 2, ey - 44, 3, 44); rect('#6d4c2e', ex - 14, ey - 4, 3, 6); rect('#6d4c2e', ex + 12, ey - 4, 3, 6); ctx.strokeStyle = '#6d4c2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex, ey - 40); ctx.lineTo(ex - 13, ey); ctx.moveTo(ex, ey - 40); ctx.lineTo(ex + 13, ey); ctx.stroke();
      rect('#fff', ex - 17, ey - 46, 34, 26); if(E && E.cv) ctx.drawImage(E.cv, ex - 16, ey - 45, 32, 24); rect('#5a3418', ex - 18, ey - 20, 36, 3);
    }});
    if(isDay() && E) { const f = fakeAt(60 + i, ex + 20, ey + 6, -1, {moving:false, icon:null, cap:i%2 ? '#222' : null}); sp.push({y:ey + 6, f:() => { bodyAt(f); const k = Math.sin(t*5 + i)*3; rect('#6d4c2e', ex + 9, ey - 24 + k, 6, 2); rect(E.col || '#ef4b4b', ex + 7, ey - 25 + k, 3, 3); }}); }
  }
}

