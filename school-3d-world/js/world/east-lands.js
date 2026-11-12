// ================= EXT8: BIGGER WORLD (east lands, deep ocean, islands, events) =================
Object.assign(R, {
  library:  {name:'Thư viện Tri Thức',            x:5300, y:70,   w:1000, h:590, open:true},
  zen:      {name:'Vườn thiền tĩnh tâm',          x:6380, y:70,   w:520,  h:590, open:true},
  stadium:  {name:'Sân vận động Olympic',         x:6980, y:60,   w:900,  h:610, open:true},
  pool:     {name:'Hồ bơi Olympic 5 làn',         x:7940, y:60,   w:600,  h:300, open:true},
  archery:  {name:'Trường bắn cung',              x:7940, y:380,  w:600,  h:290, open:true},
  gym:      {name:'Nhà thi đấu thể dục dụng cụ',  x:8600, y:60,   w:420,  h:300, open:true},
  arena:    {name:'Đấu trường online',            x:8600, y:380,  w:420,  h:290, open:true},
  kart:     {name:'Trường đua Rubik Kart',        x:9080, y:50,   w:1280, h:630, open:true},
  academy:  {name:'Học viện trí tuệ',             x:5300, y:-530, w:700,  h:500, open:true},
  shopst:   {name:'Phố mua sắm',                  x:6060, y:-530, w:900,  h:500, open:true},
  hall2p:   {name:'Nhà game 2 người',             x:7020, y:-530, w:700,  h:500, open:true},
  plaza:    {name:'Quảng trường lễ hội',          x:7780, y:-530, w:900,  h:500, open:true},
  botanic:  {name:'Vườn bách thảo & đài thiên văn', x:9640, y:-530, w:720, h:500, open:true},
  eastland: {name:'Vùng đất mới',                 x:5200, y:-560, w:5200, h:1346, open:true}
});
['library','zen','stadium','pool','archery','gym','arena','kart','academy','shopst','hall2p','plaza','botanic'].forEach(k => ROOM_ORDER.splice(ROOM_ORDER.indexOf('hills'), 0, k));
ROOM_ORDER.push('eastland');
LOCKS = [
  {r:R.stadium, lvl:2, name:'Sân vận động Olympic'}, {r:R.pool, lvl:2, name:'Hồ bơi Olympic'}, {r:R.archery, lvl:2, name:'Trường bắn cung'}, {r:R.gym, lvl:3, name:'Nhà thi đấu thể dục'},
  {r:R.kart, lvl:3, name:'Trường đua Rubik Kart'}, {r:R.botanic, lvl:4, name:'Vườn bách thảo & đài thiên văn'}, {r:R.plaza, lvl:2, name:'Quảng trường lễ hội'}
];
const GAME_LVL = {archery:2, swim:2, olympic:2, gym:3, kart:3, deepfish:2};
function lvlOK(key, name){ const L = GAME_LVL[key]; if(!L) return true; if(!PROF){ toast(`Đăng nhập và đạt Level ${L} để chơi ${name}.`); openLogin(); return false; } if(PROF.level < L){ toast(`${name} mở khóa ở Level ${L}. Bạn đang Level ${PROF.level}, hãy chơi thêm mini game nhé!`); return false; } return true; }
// ocean zones (y bands)
const OCEAN = [
  {y0:880,  y1:1800, n:'Vùng ven bờ',        z:1, c:null},
  {y0:1800, y1:3000, n:'Rạn san hô xa',      z:2, c:'rgba(0,40,80,.12)'},
  {y0:3000, y1:4800, n:'Biển khơi',          z:3, c:'rgba(0,20,60,.28)'},
  {y0:4800, y1:6600, n:'Vực thẳm',           z:4, c:'rgba(0,5,25,.5)'},
  {y0:6600, y1:8200, n:'Biển băng',          z:5, c:'rgba(180,220,255,.22)'}
];
const oceanAt = y => OCEAN.find(o => y >= o.y0 && y < o.y1) || OCEAN[0];
const ISLANDS = [
  {x:2600, y:2350, r:150, n:'Đảo Kho Báu', c:'#e8d9a8'}, {x:7800, y:1500, r:120, n:'Đảo Rùa', c:'#e8d9a8'}, {x:5200, y:4000, r:190, n:'Đảo Núi Lửa', c:'#6d4c41', volcano:true},
  {x:9200, y:3300, r:130, n:'Đảo Hải Đăng Xa', c:'#e8d9a8', light:true}, {x:1600, y:5600, r:160, n:'Đảo San Hô Đen', c:'#5d6b7a'}, {x:7600, y:7300, r:220, n:'Trạm nghiên cứu băng', c:'#e3f2fd', ice:true}
];
const onIsland = (x, y) => ISLANDS.find(i => Math.hypot((x - i.x)/1.25, y - i.y) < i.r);
// ---------- static: east ground (y 0..790, in ground cache) ----------
function drawEastStatic(){
  const dong = season === 'dong';
  // library: big glass-roof hall with reading gardens
  let r = R.library; drawGrandLibrary(r, dong);
  // zen garden
  r = R.zen; rect('#e9e2cf', r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(160,140,110,.5)'; ctx.lineWidth = 1.5; for(let k=0;k<26;k++){ ctx.beginPath(); ctx.moveTo(r.x, r.y + 20 + k*22); for(let x=r.x; x<=r.x + r.w; x+=20) ctx.lineTo(x, r.y + 20 + k*22 + Math.sin(x*.02 + k)*3); ctx.stroke(); }
  [[r.x + 140, r.y + 160, 34], [r.x + 380, r.y + 260, 26], [r.x + 220, r.y + 430, 30]].forEach(([x, y, s]) => { ctx.strokeStyle = 'rgba(160,140,110,.7)'; for(let k=1;k<4;k++){ ctx.beginPath(); ctx.ellipse(x, y, s + k*12, (s + k*12)*.6, 0, 0, Math.PI*2); ctx.stroke(); } ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.ellipse(x, y, s, s*.6, 0, 0, Math.PI*2); ctx.fill(); });
  ctx.fillStyle = dong ? '#d6ecf3' : '#4db6ac'; ctx.beginPath(); ctx.ellipse(r.x + 400, r.y + 470, 90, 50, 0, 0, Math.PI*2); ctx.fill();
  if(!dong) for(let k=0;k<6;k++){ circ(r.x + 350 + k*18, r.y + 460 + (k%2)*16, 7, '#43a047'); if(k%2) circ(r.x + 352 + k*18, r.y + 458 + (k%2)*16, 3, '#f48fb1'); }
  for(let k=0;k<10;k++){ rect('#7cb342', r.x + 12 + k*6, r.y + 30, 3, 120); rect('#558b2f', r.x + 12 + k*6, r.y + 30 + (k*13)%100, 3, 2); }
  rect('#8d6e4a', r.x + 260, r.y + 40, 120, 70); tri(r.x + 240, r.y + 40, r.x + 400, r.y + 40, r.x + 320, r.y + 4, '#b71c1c'); rect('#ffd54f', r.x + 305, r.y + 70, 30, 40);
  for(let k=0;k<6;k++) rect('#a1887f', r.x + 120 + (k%3)*90, r.y + 280 + Math.floor(k/3)*60, 40, 14);
  plate('VƯỜN THIỀN · BẤM ĐỂ NGỒI THIỀN', r.x + r.w/2, r.y + r.h - 18);
  // stadium
  r = R.stadium; rect('#8d99a6', r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#c0533a'; ctx.beginPath(); ctx.ellipse(r.x + 450, r.y + 305, 420, 280, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = dong ? '#e3ebee' : '#4caf50'; ctx.beginPath(); ctx.ellipse(r.x + 450, r.y + 305, 330, 190, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; for(let k=1;k<6;k++){ ctx.beginPath(); ctx.ellipse(r.x + 450, r.y + 305, 330 + k*15, 190 + k*15, 0, 0, Math.PI*2); ctx.stroke(); }
  rect('#e8d7a8', r.x + 200, r.y + 240, 180, 30); rect('#d7c08a', r.x + 360, r.y + 238, 30, 34); ctx.fillStyle = '#fff'; ctx.font = '13px VT323, monospace'; ctx.fillText('nhảy xa', r.x + 210, r.y + 260);
  rect('#1e88e5', r.x + 470, r.y + 200, 90, 50); ctx.fillText('nhảy cao · nhảy sào', r.x + 466, r.y + 196);
  rect('#bcaaa4', r.x + 470, r.y + 330, 150, 6); ctx.fillText('ném lao · đẩy tạ', r.x + 470, r.y + 352);
  for(let k=0;k<12;k++) rect(['#ef4b4b','#ffd23f','#3d7bff','#2fbf71'][k%4], r.x + 40 + k*70, r.y + 8, 50, 14);
  [['#3d7bff', 0], ['#111', 1], ['#ef4b4b', 2], ['#ffd23f', .5], ['#2fbf71', 1.5]].forEach(([c, k]) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x + 400 + k*28, r.y + 120 + (k % 1 ? 12 : 0), 12, 0, Math.PI*2); ctx.stroke(); });
  plate('SÂN VẬN ĐỘNG OLYMPIC · BẤM ĐỂ THI ĐẤU', r.x + r.w/2, r.y + r.h - 18);
  // pool
  r = R.pool; rect('#cfd8dc', r.x, r.y, r.w, r.h); rect('#29b6f6', r.x + 30, r.y + 40, r.w - 60, r.h - 80);
  for(let k=0;k<=5;k++){ const y = r.y + 40 + k*(r.h - 80)/5; if(k > 0 && k < 5) for(let x = r.x + 30; x < r.x + r.w - 30; x += 12) rect(x % 24 ? '#ef4b4b' : '#fff', x, y - 2, 12, 4); }
  for(let k=0;k<5;k++){ rect('#eceff1', r.x + 14, r.y + 52 + k*44, 16, 20); ctx.fillStyle = '#1a1206'; ctx.fillText(String(k + 1), r.x + 18, r.y + 66 + k*44); }
  rect('#0277bd', r.x + r.w - 40, r.y + 40, 4, r.h - 80);
  plate('HỒ BƠI OLYMPIC · BẤM ĐỂ THI BƠI', r.x + r.w/2, r.y + 6);
  // archery
  r = R.archery; rect(dong ? '#e3ebee' : '#9ccc65', r.x, r.y, r.w, r.h);
  for(let k=0;k<5;k++){ const x = r.x + r.w - 60, y = r.y + 40 + k*50; [['#fff', 16], ['#111', 13], ['#1e88e5', 10], ['#e53935', 7], ['#ffd23f', 4]].forEach(([c, s]) => circ(x, y, s, c)); rect('#5d4037', x - 2, y + 16, 4, 12); }
  rect('#8d6e4a', r.x + 30, r.y + 20, 8, r.h - 40); for(let k=0;k<5;k++) rect('#fff', r.x + 40, r.y + 40 + k*50, r.w - 120, 1);
  plate('TRƯỜNG BẮN CUNG · BẤM ĐỂ BẮN', r.x + r.w/2, r.y + r.h - 18);
  // gym hall
  r = R.gym; rect('#b39ddb', r.x, r.y, r.w, r.h); rect('#ede7f6', r.x + 20, r.y + 30, r.w - 40, r.h - 60); rect('#1e88e5', r.x + 40, r.y + 60, 160, 160);
  rect('#8d6e4a', r.x + 230, r.y + 100, 150, 6); rect('#5d4037', r.x + 240, r.y + 106, 4, 30); rect('#5d4037', r.x + 366, r.y + 106, 4, 30);
  rect('#9e9e9e', r.x + 240, r.y + 180, 4, 60); rect('#9e9e9e', r.x + 370, r.y + 180, 4, 60); rect('#bdbdbd', r.x + 240, r.y + 180, 134, 3);
  plate('THỂ DỤC DỤNG CỤ · BẤM ĐỂ THI', r.x + r.w/2, r.y + r.h - 18);
  // arena
  r = R.arena; rect('#263238', r.x, r.y, r.w, r.h); rect('#37474f', r.x + 20, r.y + 20, r.w - 40, r.h - 60);
  for(let k=0;k<6;k++){ rect('#111', r.x + 40 + (k%3)*120, r.y + 50 + Math.floor(k/3)*100, 80, 50); rect('#26c6da', r.x + 44 + (k%3)*120, r.y + 54 + Math.floor(k/3)*100, 72, 34); }
  plate('ĐẤU TRƯỜNG ONLINE · BẤM ĐỂ TÌM ĐỐI THỦ', r.x + r.w/2, r.y + r.h - 18);
  // kart circuit
  r = R.kart; rect(dong ? '#e3ebee' : '#689f38', r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 46; ctx.lineJoin = 'round'; ctx.beginPath(); KART_WORLD.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = '#ef4b4b'; ctx.lineWidth = 50; ctx.setLineDash([12, 12]); ctx.globalCompositeOperation = 'destination-over'; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([14, 14]); ctx.beginPath(); KART_WORLD.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  for(let k=0;k<8;k++){ rect(k%2 ? '#111' : '#fff', KART_WORLD[0][0] - 2, KART_WORLD[0][1] - 23 + k*6, 6, 6); }
  plate('TRƯỜNG ĐUA RUBIK KART · BẤM ĐỂ ĐUA', r.x + r.w/2, r.y + r.h - 18);
  // marina sign on beach is drawn live; road labels
  ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('→ VÙNG ĐẤT MỚI', 5230, 700);
}
const KART_WORLD = (() => { const r = {x:9080, y:50, w:1280, h:630}, pts = []; for(let i=0;i<36;i++){ const a = i/36*Math.PI*2, k = 1 + .18*Math.sin(a*3); pts.push([r.x + r.w/2 + Math.cos(a)*520*k, r.y + r.h/2 + Math.sin(a)*230*(1 + .12*Math.cos(a*2))]); } return pts; })();
// ---------- static: north-east (north cache, y NY..0) ----------
function drawNorthEastStatic(){
  const dong = season === 'dong';
  let r = R.academy; rect('#b0bec5', r.x, r.y, r.w, r.h); rect('#eceff1', r.x + 30, r.y + 60, r.w - 60, r.h - 120); tri(r.x + 10, r.y + 60, r.x + r.w - 10, r.y + 60, r.x + r.w/2, r.y + 10, '#37474f');
  for(let k=0;k<6;k++) rect('#cfd8dc', r.x + 60 + k*100, r.y + 70, 14, r.h - 140);
  const cube = (x, y, s) => { const c = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#fff']; for(let i=0;i<9;i++) rect(c[(i*5) % 6], x + (i%3)*s, y + Math.floor(i/3)*s, s - 1, s - 1); };
  cube(r.x + 90, r.y + 140, 14); cube(r.x + 200, r.y + 150, 10); cube(r.x + 300, r.y + 140, 18);
  for(let i=0;i<8;i++) for(let j=0;j<8;j++) rect((i + j)%2 ? '#739552' : '#ebecd0', r.x + 440 + i*14, r.y + 140 + j*14, 14, 14);
  for(let k=0;k<3;k++){ rect('#5d4037', r.x + 80 + k*180, r.y + 330, 120, 40); rect('#fff', r.x + 90 + k*180, r.y + 335, 100, 26); ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#1a1206'; ctx.fillText(['SUDOKU','TOÁN NHANH','TRÍ NHỚ'][k], r.x + 100 + k*180, r.y + 352); }
  plate('HỌC VIỆN TRÍ TUỆ · RUBIK, CỜ VUA, SUDOKU', r.x + r.w/2, r.y + r.h - 40);
  r = R.shopst; rect('#bcaaa4', r.x, r.y + 300, r.w, 120); for(let x = r.x; x < r.x + r.w; x += 30) rect('#a1887f', x, r.y + 300, 2, 120);
  [['XE ĐẠP','#3d7bff'], ['THÚ CƯNG','#ff8a2b'], ['THỜI TRANG','#ff6f91'], ['TRANG SỨC','#ffd23f'], ['ĐỒ CÂU CÁ','#2fbf71']].forEach(([n, c], k) => { const x = r.x + 20 + k*176, y = r.y + 80; rect('#f5f5f5', x, y, 150, 200); rect(c, x, y, 150, 30); for(let s=0;s<6;s++) rect(s%2 ? '#fff' : c, x + s*25, y + 30, 25, 14); rect('#90caf9', x + 20, y + 70, 110, 70); rect('#6d4c2e', x + 55, y + 150, 40, 50); ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#1a1206'; ctx.fillText(n, x + 14, y + 22); });
  plate('PHỐ MUA SẮM · BẤM VÀO CỬA HÀNG', r.x + r.w/2, r.y + r.h - 40);
  r = R.hall2p; rect('#4a148c', r.x, r.y + 40, r.w, r.h - 80); rect('#6a1b9a', r.x + 20, r.y + 60, r.w - 40, r.h - 120);
  for(let k=0;k<6;k++){ const x = r.x + 60 + (k%3)*210, y = r.y + 110 + Math.floor(k/3)*150; rect('#222', x, y, 110, 70); rect(['#ef4b4b','#26c6da','#ffd23f','#2fbf71','#ff8a2b','#b06bff'][k], x + 6, y + 6, 98, 44); rect('#555', x + 40, y + 70, 30, 30); }
  plate('NHÀ GAME 2 NGƯỜI · BẤM ĐỂ CHƠI', r.x + r.w/2, r.y + r.h - 40);
  r = R.plaza; rect('#d7ccc8', r.x, r.y, r.w, r.h); for(let k=0;k<10;k++) for(let j=0;j<6;j++) rect((k + j)%2 ? '#cfc2bd' : '#e0d6d2', r.x + k*90, r.y + j*84, 90, 84);
  rect('#795548', r.x + 600, r.y + 380, 14, 80); rect('#795548', r.x + 700, r.y + 380, 14, 80);
  plate('QUẢNG TRƯỜNG LỄ HỘI · SỰ KIỆN MINI GAME', r.x + r.w/2, r.y + r.h - 24);
  r = R.botanic; drawObservatory(r, dong);
}
// ---------- live: ocean, islands, marina ----------
function drawOceanExt(){
  const x0 = Math.max(0, VB.x0), x1 = Math.min(W, VB.x1);
  OCEAN.forEach(o => { if(!o.c || o.y1 < VB.y0 || o.y0 > VB.y1) return; const g = ctx.createLinearGradient(0, o.y0 - 200, 0, o.y0 + 200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, o.c); ctx.fillStyle = g; ctx.fillRect(x0, Math.max(VB.y0, o.y0 - 200), x1 - x0, Math.min(VB.y1, o.y1) - Math.max(VB.y0, o.y0 - 200)); });
  OCEAN.slice(1).forEach(o => { if(o.y0 < VB.y0 - 40 || o.y0 > VB.y1 + 40) return; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.setLineDash([24, 18]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, o.y0); ctx.lineTo(x1, o.y0); ctx.stroke(); ctx.setLineDash([]); ctx.font = '18px VT323, monospace'; ctx.fillStyle = 'rgba(255,255,255,.8)'; for(let x = Math.floor(x0/1600)*1600 + 300; x < x1; x += 1600) ctx.fillText(`${o.n} · cần thuyền hạng ${o.z}`, x, o.y0 + 26); });
  if(VB.y1 > 2200 && VB.y0 < 3000) for(let i=0;i<70;i++){ const x = 100 + (i*149) % (W - 200), y = 2500 + (i*61) % 380; if(x < x0 - 30 || x > x1 + 30) continue; rect(['#ff6f61','#ffb3c6','#ffd23f','#b06bff','#4dd0e1'][i%5] + 'aa', x, y, 12, 20 + (i%3)*6); rect('#1b3a52', x - 8, y + 18, 28, 6); }
  if(VB.y1 > 6600) for(let i=0;i<40;i++){ const x = 150 + (i*263) % (W - 300), y = 6750 + (i*131) % 1250; if(x < x0 - 80 || x > x1 + 80 || y < VB.y0 - 60 || y > VB.y1 + 60) continue; const b = Math.sin(realT*.6 + i)*2; ctx.fillStyle = '#f5fbff'; ctx.beginPath(); ctx.moveTo(x - 40, y + 10 + b); ctx.lineTo(x - 20, y - 26 - (i%3)*8 + b); ctx.lineTo(x + 10, y - 34 + b); ctx.lineTo(x + 40, y + 10 + b); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(120,180,220,.5)'; ctx.fillRect(x - 40, y + 8 + b, 80, 6); }
  if(VB.y1 > 4800 && VB.y0 < 6600) for(let i=0;i<50;i++){ const x = (i*211 + realT*(i%2 ? 8 : -8)) % W, y = 4900 + (i*97) % 1600; if(x < x0 || x > x1 || y < VB.y0 || y > VB.y1) continue; ctx.globalAlpha = .4 + .4*Math.sin(realT*2 + i); circ(x, y, 2 + (i%3), ['#76ff03','#18ffff','#ea80fc'][i%3]); ctx.globalAlpha = 1; }
  ISLANDS.forEach(I => { if(I.x + I.r*1.4 < VB.x0 || I.x - I.r*1.4 > VB.x1 || I.y + I.r < VB.y0 || I.y - I.r > VB.y1) return;
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(I.x, I.y, I.r*1.25 + 14 + Math.sin(realT*2)*3, I.r + 12, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = I.c; ctx.beginPath(); ctx.ellipse(I.x, I.y, I.r*1.25, I.r, 0, 0, Math.PI*2); ctx.fill();
    if(!I.ice){ ctx.fillStyle = I.volcano ? '#4e342e' : '#66bb6a'; ctx.beginPath(); ctx.ellipse(I.x, I.y - 10, I.r*.85, I.r*.65, 0, 0, Math.PI*2); ctx.fill(); }
    if(I.volcano){ tri(I.x - 80, I.y + 10, I.x + 80, I.y + 10, I.x, I.y - 120, '#5d4037'); tri(I.x - 18, I.y - 96, I.x + 18, I.y - 96, I.x, I.y - 120, '#ff7043'); for(let k=0;k<4;k++) circ(I.x + Math.sin(realT + k)*10, I.y - 130 - ((realT*30 + k*25) % 100), 8 + k*2, 'rgba(120,120,120,.35)'); }
    else if(I.ice){ rect('#90a4ae', I.x - 60, I.y - 50, 120, 60); rect('#ef4b4b', I.x - 10, I.y - 70, 4, 22); rect('#fff', I.x - 40, I.y - 40, 20, 14); rect('#fff', I.x + 20, I.y - 40, 20, 14); }
    else { for(let k=0;k<6;k++){ const px = I.x - I.r*.6 + k*I.r*.25, py = I.y - 20 - (k%2)*24; rect('#8d6e4a', px, py, 4, 26); circ(px + 2, py - 4, 12, '#2e7d32'); } if(I.light){ rect('#fafafa', I.x - 8, I.y - 90, 16, 70); rect('#ef4b4b', I.x - 8, I.y - 70, 16, 10); circ(I.x, I.y - 94, 7, `rgba(255,240,150,${.5 + .5*Math.sin(realT*3)})`); } }
    ctx.font = '20px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(I.n, I.x, I.y + I.r + 30); ctx.textAlign = 'left'; });
  // marina
  if(VB.x1 > 5500 && VB.x0 < 6500 && VB.y1 > 780 && VB.y0 < 1050){ rect('#8d6e4a', 5600, 800, 800, 14); for(let k=0;k<6;k++){ rect('#7a4b2a', 5640 + k*130, 814, 14, 120); } ctx.font = '16px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('BẾN DU THUYỀN · BẤM ĐỂ MUA THUYỀN / RA KHƠI', 5700, 795);
    ['#ef4b4b','#3d7bff','#fafafa','#2e7d32','#ff8a2b'].forEach((c, k) => { ctx.save(); ctx.translate(5710 + k*130, 900 + Math.sin(realT*2 + k)*2); drawBoatModel(0, 0, ITEM['boat' + (k + 1)], ['g_flag'], 1); ctx.restore(); }); }
}
function drawBoatModel(x, y, bt, gear, sc){
  const z = bt ? bt.zone : 1, col = bt ? bt.col : '#ff8a2b', L = [26, 30, 36, 42, 54][z - 1];
  ctx.fillStyle = 'rgba(0,30,60,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 6, L + 4, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = z === 1 ? col : '#fafafa'; ctx.beginPath(); ctx.moveTo(x - L, y - 6); ctx.lineTo(x + L*.7, y - 6); ctx.lineTo(x + L + 4, y - 10); ctx.lineTo(x + L*.8, y + 3); ctx.lineTo(x - L + 2, y + 3); ctx.closePath(); ctx.fill();
  rect(col, x - L + 2, y - 3, L*1.7, 3);
  if(z >= 2){ rect('#90caf9', x - 2, y - 14 - z*2, 12 + z*2, 8); rect(col, x - 4, y - 16 - z*2, 16 + z*2, 3); }
  if(z >= 4){ rect('#455a64', x - L*.6, y - 26, 2, 20); ctx.strokeStyle = '#455a64'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - L*.6, y - 26); ctx.lineTo(x - L, y - 8); ctx.stroke(); }
  if(z === 5){ rect('#eceff1', x - 16, y - 24, 30, 10); rect('#90caf9', x - 12, y - 22, 22, 5); }
  if(gear.includes('g_sail') || z === 1 && gear.includes('g_sail')){ ['#ef4b4b','#ff8a2b','#ffd23f','#2fbf71','#3d7bff','#b06bff'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(x - 10 + k*3, y - 40, 3, 30 - k*3); }); rect('#6d4c2e', x - 11, y - 42, 2, 36); }
  if(gear.includes('g_flag')){ rect('#ddd', x - L + 6, y - 30, 1, 24); rect('#ffd23f', x - L + 7, y - 30, 8, 5); rect('#ef4b4b', x - L + 7, y - 27, 8, 2); }
  if(gear.includes('g_light')){ circ(x + L*.6, y - 14, 2.5, '#fff59d'); if(SKYST && SKYST.night > .3){ ctx.fillStyle = 'rgba(255,245,157,.18)'; ctx.beginPath(); ctx.arc(x + L*.6, y - 14, 30, 0, Math.PI*2); ctx.fill(); } }
  if(gear.includes('g_radar')){ ctx.save(); ctx.translate(x + 4, y - 28); ctx.rotate(realT*3); rect('#cfd8dc', -6, -1, 12, 2); ctx.restore(); rect('#90a4ae', x + 3, y - 28, 2, 8); }
  if(gear.includes('g_sonar')) circ(x - L*.3, y - 8, 2, '#26c6da');
  if(gear.includes('g_crane')){ rect('#ffb300', x - L*.8, y - 22, 3, 16); rect('#ffb300', x - L*.8, y - 22, 14, 2); }
  if(gear.includes('g_fridge')) rect('#e0f7fa', x + L*.3, y - 12, 8, 6);
}
// ---------- live: east zone life ----------
var FERRIS = 0;
function eastSprites(sp){
  if(VB.x1 < 5200) return;
  const t = realT, day = isDay() && !isStorm();
  const vis = r => VB.x0 < r.x + r.w && VB.x1 > r.x && VB.y0 < r.y + r.h && VB.y1 > r.y;
  let r = R.library;
  if(false) for(let i=0;i<10;i++){ const x = i < 6 ? r.x + 650 + (i%2)*130 + 45 + (i%3 - 1)*30 : r.x + 120 + (i - 6)*70, y = i < 6 ? r.y + 175 + Math.floor(i/2)*60 : r.y + 400 + (i%2)*20; const f = fakeAt(70 + i, x, y, i%2 ? -1 : 1, {icon:'paper'}); if(inVB(x, y)) sp.push({y, f:() => { bodyAt(f); if(i < 6) rect(['#c62828','#1565c0','#2e7d32'][i%3], x + f.dir*4 - 3, y - 20, 7, 5); }}); }
  r = R.zen;
  if(vis(r)) for(let i=0;i<5;i++){ const x = r.x + 140 + (i%3)*90 + 20, y = r.y + 296 + Math.floor(i/3)*60, br = (Math.sin(t*.8 + i) + 1)/2; sp.push({y, f:() => { ctx.fillStyle = `rgba(255,236,179,${.15 + br*.25})`; ctx.beginPath(); ctx.arc(x, y - 14, 16 + br*8, 0, Math.PI*2); ctx.fill(); const f = fakeAt(80 + i, x, y, 1); ctx.save(); ctx.translate(x, y); rect(f.pants, -8, -6, 16, 6); ctx.translate(0, 4); f.moving = false; drawBody(f, false); ctx.restore(); }}); }
  r = R.stadium;
  if(vis(r) && day) for(let i=0;i<6;i++){ const a = t*(.35 + i*.03) + i, x = r.x + 450 + Math.cos(a)*(372 + (i%4)*14), y = r.y + 305 + Math.sin(a)*(232 + (i%4)*14), f = fakeAt(90 + i, x, y, -Math.sin(a) > 0 ? 1 : -1, {moving:true, walk:t*10 + i}); if(inVB(x, y)) sp.push({y, f:() => bodyAt(f)}); }
  r = R.pool;
  if(vis(r) && day) for(let i=0;i<5;i++){ const u = (Math.sin(t*.25 + i*1.3) + 1)/2, x = r.x + 50 + u*(r.w - 110), y = r.y + 62 + i*44; sp.push({y, f:() => { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - 14, y - 2, 10, 3); const f = fakeAt(100 + i, x, y + 4, Math.cos(t*.25 + i*1.3) > 0 ? 1 : -1); f.cap = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#fff'][i]; ctx.save(); ctx.translate(x, y + 4); drawBody(f, true); ctx.restore(); }}); }
  r = R.archery;
  if(vis(r) && day) for(let i=0;i<3;i++){ const x = r.x + 60, y = r.y + 46 + i*100, ph = (t*.5 + i*.33) % 1; sp.push({y, f:() => { const f = fakeAt(110 + i, x, y, 1, {icon:null}); bodyAt(f); ctx.strokeStyle = '#6d4c2e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 8, y - 18, 8, -1.2, 1.2); ctx.stroke(); if(ph < .5){ const ax = x + 14 + ph*2*(r.w - 140); rect('#3e2723', ax, y - 18, 12, 1); } }}); }
  r = R.kart;
  if(vis(r)) for(let i=0;i<5;i++){ const n = KART_WORLD.length, u = ((t*(.045 + i*.004) + i*.13) % 1)*n, k = Math.floor(u), f = u - k, p0 = KART_WORLD[k], p1 = KART_WORLD[(k + 1) % n], x = p0[0] + (p1[0] - p0[0])*f, y = p0[1] + (p1[1] - p0[1])*f + (i%3 - 1)*10, ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); sp.push({y, f:() => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); rect('#222', -9, -7, 5, 3); rect('#222', 4, -7, 5, 3); rect('#222', -9, 4, 5, 3); rect('#222', 4, 4, 5, 3); rect(['#ef4b4b','#3d7bff','#ffd23f','#2fbf71','#b06bff'][i], -9, -5, 18, 10); rect('#fff', 0, -3, 4, 6); ctx.restore(); }}); }
  r = R.plaza;
  if(vis(r)){ const cx = r.x + 660, cy = r.y + 220, R0 = 150; sp.push({y:r.y + 460, f:() => { ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI*2); ctx.stroke(); for(let k=0;k<12;k++){ const a = t*.15 + k*Math.PI/6, px = cx + Math.cos(a)*R0, py = cy + Math.sin(a)*R0; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke(); rect(['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#b06bff'][k%6], px - 9, py, 18, 14); rect('#fff', px - 6, py + 3, 12, 5); } circ(cx, cy, 10, '#ffd23f'); rect('#78909c', cx - 4, cy, 8, 240); }}); }
  r = R.botanic;
  if(vis(r)) for(let i=0;i<8;i++){ const x = r.x + 200 + i*170 + Math.sin(t*.6 + i)*30, y = r.y + 300 + Math.cos(t*.5 + i)*40; sp.push({y, f:() => { const w = Math.sin(t*12 + i)*4; ctx.fillStyle = ['#ffd23f','#ff6f91','#4fc3f7','#fff'][i%4]; ctx.fillRect(x - 5, y - 30 - w, 5, 4); ctx.fillRect(x + 1, y - 30 + w, 5, 4); rect('#222', x - 1, y - 30, 2, 5); }}); }
  r = R.arena;
  if(vis(r)) sp.push({y:r.y + r.h, f:() => { ctx.font = '14px VT323, monospace'; ctx.fillStyle = '#26c6da'; const n = (ONLINE && ONLINE.peers) ? ONLINE.peers.length : 0; ctx.fillText(`${n} người đang online`, r.x + 40, r.y + 290); }});
}
// ---------- world mini events ----------
var WEV = null, wevNext = 40;
const WEV_TYPES = [
  {k:'chest', n:'Rương báu bí ẩn', d:'Một rương báu vừa xuất hiện! Tới mở để nhận quà.'},
  {k:'butterfly', n:'Đàn bướm vàng', d:'Đàn bướm vàng bay lượn. Chạm vào 5 con để nhận thưởng!'},
  {k:'litter', n:'Ngày hội môi trường', d:'Có rác cần nhặt! Nhặt đủ 8 mảnh rác để bảo vệ thiên nhiên.'},
  {k:'quiz', n:'Thầy đố vui', d:'Một thầy giáo đang đứng đố vui. Tới trả lời đúng để nhận thưởng.'},
  {k:'star', n:'Sao rơi', d:'Những ngôi sao vừa rơi xuống mặt đất. Nhặt 6 ngôi sao!'}
];
function wevSpawn(){
  const c = PLAYER && PLAYER.visible ? PLAYER : null; if(!c || c.boat) return;
  const T = WEV_TYPES[Math.floor(Math.random()*WEV_TYPES.length)];
  if(T.k === 'star' && !(SKYST && SKYST.night > .4)) return wevSpawn2(WEV_TYPES[1]);
  wevSpawn2(T);
}
function wevSpawn2(T){
  const c = PLAYER; let x, y, tries = 0;
  do { const a = Math.random()*Math.PI*2, d = 280 + Math.random()*700; x = clamp(c.x + Math.cos(a)*d, 60, W - 60); y = clamp(c.y + Math.sin(a)*d*.6, NY + 40, 760); tries++; } while(tries < 30 && (indoorAt(x, y) || (PROF && LOCKS.some(z => PROF.level < z.lvl && inside(z.r, x, y)))));
  const n = {chest:1, butterfly:5, litter:8, quiz:1, star:6}[T.k], items = [];
  for(let i=0;i<n;i++) items.push({x:x + (n > 1 ? (Math.random() - .5)*260 : 0), y:clamp(y + (n > 1 ? (Math.random() - .5)*160 : 0), NY + 30, 770), got:false, ph:Math.random()*6});
  WEV = {T, x, y, items, until:realT + 150}; toast(`Sự kiện: ${T.n}! ${T.d}`); log('event', `Sự kiện mini game: ${T.n} gần ${R[regionAt(x, y)].name}.`);
}
const indoorAt = (x, y) => ['rubik','chess','music','hall','rubikyard','office','elec'].some(k => inside(R[k], x, y));
function wevUpdate(dt){
  if(!PROF){ return; }
  if(!WEV){ wevNext -= dt; if(wevNext <= 0){ wevNext = 100 + Math.random()*80; wevSpawn(); } return; }
  if(realT > WEV.until){ WEV = null; return; }
  if(WEV.T.k === 'butterfly') WEV.items.forEach(it => { if(!it.got){ it.ph += dt; it.x += Math.cos(it.ph*.7)*30*dt; it.y += Math.sin(it.ph*1.1)*20*dt; } });
  const c = PLAYER; if(!c || !c.visible) return;
  WEV.items.forEach(it => { if(!it.got && Math.hypot(it.x - c.x, it.y - c.y) < 28){ if(WEV.T.k === 'quiz'){ openPopQuiz(); WEV.until = realT + 60; return; } it.got = true; blipSfx(1500); } });
  if(WEV.T.k !== 'quiz' && WEV.items.every(i => i.got)){ const T = WEV.T; WEV = null; const m = T.k === 'chest' ? 10 + Math.floor(Math.random()*4)*10 : 10; reward(T.k === 'chest' ? 50 : 40, m, 'Sự kiện ' + T.n); mprog('event'); toast(`Hoàn thành sự kiện ${T.n}! +$${m}`); }
}
function wevSprites(sp){
  if(!WEV) return;
  WEV.items.forEach(it => { if(it.got || !inVB(it.x, it.y)) return; sp.push({y:it.y, f:() => { const k = WEV ? WEV.T.k : '', b = Math.sin(realT*4 + it.ph)*3;
    if(k === 'chest'){ rect('#6d4c2e', it.x - 12, it.y - 16, 24, 16); rect('#8d6e4a', it.x - 12, it.y - 20, 24, 6); rect('#ffd23f', it.x - 2, it.y - 14, 4, 5); ctx.fillStyle = `rgba(255,235,59,${.3 + .3*Math.sin(realT*5)})`; ctx.beginPath(); ctx.arc(it.x, it.y - 10, 22, 0, Math.PI*2); ctx.fill(); }
    else if(k === 'butterfly'){ const w = Math.sin(realT*14 + it.ph)*4; ctx.fillStyle = '#ffd23f'; ctx.fillRect(it.x - 6, it.y - 30 - w, 6, 5); ctx.fillRect(it.x + 1, it.y - 30 + w, 6, 5); rect('#3e2723', it.x - 1, it.y - 31, 2, 6); }
    else if(k === 'litter'){ rect(['#90a4ae','#ef9a9a','#fff59d','#a5d6a7'][Math.floor(it.ph*10) % 4], it.x - 5, it.y - 6, 10, 6); }
    else if(k === 'star'){ ctx.fillStyle = '#fff59d'; ctx.font = '22px VT323, monospace'; ctx.fillText('★', it.x - 7, it.y - 4 + b); }
    else if(k === 'quiz'){ const f = fakeAt(7, it.x, it.y, -1, {cap:'#3d7bff', icon:'paper'}); bodyAt(f); ctx.font = '22px Bungee, sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText('?', it.x - 6, it.y - 42 + b); }
  }}); });
}
function drawWevGuide(){
  if(!WEV || !PLAYER || !PLAYER.visible) return;
  const left = WEV.items.filter(i => !i.got), tg = left[0]; if(!tg) return;
  const dx = tg.x - PLAYER.x, dy = tg.y - PLAYER.y, d = Math.hypot(dx, dy); if(d < 140) return;
  const a = Math.atan2(dy, dx), px = PLAYER.x + Math.cos(a)*60, py = PLAYER.y - 20 + Math.sin(a)*60;
  ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = 'rgba(255,210,63,.9)'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.fillText(`${WEV.T.n} · ${Math.round(d/10)} m`, px - 30, py - 12);
}
// pop quiz (math / logic / general knowledge)
var PQ = null;
function makeQuestion(){
  const r = Math.random(), A = n => Math.floor(Math.random()*n);
  if(r < .45){ const a = 5 + A(40), b = 2 + A(20), op = ['+','−','×'][A(3)], ans = op === '+' ? a + b : op === '−' ? a - b : a*(b % 10 + 2); const q = `${a} ${op} ${op === '×' ? b % 10 + 2 : b} = ?`; const opts = new Set([ans]); while(opts.size < 4) opts.add(ans + (A(11) - 5 || 7)); const arr = [...opts].sort(() => Math.random() - .5); return {q, opts:arr.map(String), a:arr.indexOf(ans)}; }
  const K = [
    ['Khối Rubik 3×3 có bao nhiêu mặt?', ['4','6','8','9'], 1], ['Quân cờ nào đi theo hình chữ L?', ['Tượng','Xe','Mã','Hậu'], 2], ['Thủ đô của Việt Nam là?', ['Huế','Đà Nẵng','Hà Nội','Cần Thơ'], 2],
    ['Hành tinh lớn nhất Hệ Mặt Trời?', ['Sao Hỏa','Sao Mộc','Trái Đất','Sao Kim'], 1], ['Nước sôi ở bao nhiêu độ C (ngang mực nước biển)?', ['90','100','80','120'], 1], ['Con vật nào là động vật có vú?', ['Cá mập','Cá heo','Cá ngừ','Mực'], 1],
    ['Số tiếp theo: 2, 4, 8, 16, ...?', ['18','24','32','20'], 2], ['Đại dương lớn nhất Trái Đất?', ['Đại Tây Dương','Ấn Độ Dương','Bắc Băng Dương','Thái Bình Dương'], 3], ['Ai viết "Truyện Kiều"?', ['Nguyễn Du','Hồ Xuân Hương','Nguyễn Trãi','Tố Hữu'], 0],
    ['Một ngày có bao nhiêu phút?', ['1440','1200','3600','1000'], 0], ['Thế vận hội Olympic tổ chức mấy năm một lần?', ['2','3','4','5'], 2], ['Cờ vây gốc từ nước nào?', ['Nhật Bản','Trung Quốc','Hàn Quốc','Việt Nam'], 1],
    ['Tam giác đều có mỗi góc bao nhiêu độ?', ['45','60','90','30'], 1], ['Chất nào cây cần để quang hợp?', ['Oxy','CO₂','Nitơ','Heli'], 1], ['Sông dài nhất Việt Nam (đoạn chảy trong nước)?', ['Sông Hồng','Sông Đồng Nai','Sông Mê Kông','Sông Đà'], 1]
  ];
  const k = K[A(K.length)]; return {q:k[0], opts:k[1], a:k[2]};
}
function openPopQuiz(){ PQ = makeQuestion(); showModal('mPop'); $('#popQ').textContent = PQ.q; $('#popMsg').textContent = ''; const box = $('#popOpts'); box.innerHTML = ''; PQ.opts.forEach((o, i) => { const b = el('button', {type:'button'}, ''); b.textContent = String.fromCharCode(65 + i) + '. ' + o; b.onclick = () => popAnswer(i, b); box.appendChild(b); }); }
function popAnswer(i, b){ if(!PQ) return; const ok = i === PQ.a; b.classList.add(ok ? 'ok' : 'bad'); if(ok){ $('#popMsg').textContent = 'Chính xác! +$10'; reward(40, 10, 'Trả lời đúng câu đố'); mprog('event'); WEV = null; PQ = null; setTimeout(hideModal, 900); } else { $('#popMsg').textContent = 'Chưa đúng, thử lại câu khác nhé!'; PQ = null; setTimeout(openPopQuiz, 900); } }
function ext8Init(){
  XHOT.push(
    {r:{x:R.library.x + 60, y:R.library.y + 40, w:560, h:360}, f:() => openLibrary('vn')}, {r:{x:R.library.x + 630, y:R.library.y + 330, w:300, h:110}, f:() => openLibrary('comics')}, {r:R.library, f:() => openLibrary('vn')},
    {r:R.zen, f:() => openZen()}, {r:R.stadium, f:() => lvlOK('olympic', 'Thế vận hội') && openOlympics()}, {r:R.pool, f:() => lvlOK('swim', 'Bơi lội') && openArcade('swim')},
    {r:R.archery, f:() => lvlOK('archery', 'Bắn cung') && openArcade('archery')}, {r:R.gym, f:() => lvlOK('gym', 'Thể dục dụng cụ') && openArcade('gymnast')}, {r:R.arena, f:() => openLobby()},
    {r:R.kart, f:() => lvlOK('kart', 'Rubik Kart') && openArcade('kart')}, {r:R.academy, f:() => openAcademy()}, {r:R.shopst, f:() => openShop()}, {r:R.hall2p, f:() => openHall2p()},
    {r:R.plaza, f:() => { if(WEV) toast('Đang có sự kiện: ' + WEV.T.n); else { wevNext = 0; toast('Sự kiện mới sẽ xuất hiện quanh bạn!'); } }}, {r:R.botanic, f:() => $('#skyBtn').click()},
    {r:{x:5600, y:790, w:800, h:150}, f:() => openShop('boat')}
  );
}

