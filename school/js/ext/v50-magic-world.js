// ================= v50 · CẢNH HỌC VIỆN: lâu đài trên vách đá cạnh hồ, núi sương, cầu đá nhiều nhịp, nhà kính, sân tròn, rừng thông, cú bay =================
// Bố cục theo tỷ lệ vàng: thế giới rộng 1618 × 1000; hồ chiếm 0.382 bề ngang bên trái; tháp cao theo dãy h, h/φ, h/φ².
// Ảnh tĩnh (nền đất, lâu đài, núi) cache theo mùa/ngày-đêm; mỗi khung chỉ vẽ phần động.
const V50_WX = 1618, V50_GY0 = 240, V50_CX0 = 340, V50_CY0 = -60, V50_CW = 960, V50_CH = 520, V50_BASE = 452;
const V50W = {cv:null, g:null, W:0, H:0, dpr:1, z:1, cam:{x:800, y:760}, me:{x:800, y:930, dir:1, walk:0, moving:false}, npc:[], owls:[], dum:[], lan:[], crit:[], win:[], flags:[],
  ground:null, gKey:'', castle:null, cKey:'', mts:null, mKey:'', sky:null, sKey:'', fog:null, cloud:null, hall:null, hKey:'', candles:[], room:'out',
  joy:null, keys:{}, raf:0, lt:0, fps:60, fa:[], near:null, hint:6, tapT:0, sp:[], snow:null, lakeP:null};
function v50Lake(y){ return 600 - (y - 440)*.35 + Math.sin(y/62)*16; }
const V50_SPOTS = [
  {id:'library', x:640, y:470, r:40, ic:'📚', vi:'Thư viện Rune', en:'Rune Library'},
  {id:'hall', x:860, y:470, r:46, ic:'🕯️', vi:'Đại Sảnh', en:'Great Hall', dy:-36},
  {id:'potion', x:1005, y:470, r:40, ic:'⚗️', vi:'Hầm Pha Chế', en:'Potion Cellar'},
  {id:'stars', x:1180, y:470, r:40, ic:'🔭', vi:'Tháp Thiên Văn', en:'Star Tower', dy:-36},
  {id:'duel', x:860, y:690, r:70, ic:'🎯', vi:'Sân Luyện Phép', en:'Spell Court'},
  {id:'sigil', x:560, y:810, r:52, ic:'✍️', vi:'Vòng Đá Ký Hiệu', en:'Sigil Stones'},
  {id:'broom', x:1490, y:478, r:44, ic:'🧹', vi:'Sân Bay Chổi', en:'Broom Field'},
  {id:'creature', x:1500, y:716, r:40, ic:'🐣', vi:'Nhà Kính Sinh Vật', en:'Creature Greenhouse'},
  {id:'shop', x:1060, y:892, r:36, ic:'🪄', vi:'Tiệm Đũa', en:'Wand Shop', dy:-34},
  {id:'wardrobe', x:1180, y:892, r:36, ic:'🧥', vi:'Tủ Áo Choàng', en:'Robe Wardrobe'},
  {id:'portal', x:780, y:962, r:40, ic:'🌀', vi:'Cổng về Trường', en:'Portal Home'}
];
// ---------- ngày / đêm ----------
function v50Night(){ const c = typeof clock === 'number' ? clock : 720; if(typeof weather !== 'undefined' && weather === 'nhatthuc') return 1;
  if(c < 330 || c > 1110) return 1; if(c < 420) return 1 - (c - 330)/90; if(c > 1020) return (c - 1020)/90; return 0; }
function v50Dusk(){ const c = typeof clock === 'number' ? clock : 720; return Math.max(0, 1 - Math.min(Math.abs(c - 1065), Math.abs(c - 375))/70); }
function v50Season(){ return typeof season === 'string' ? season : 'thu'; }
function v50Walk(x, y){
  if(x < 24 || x > 1596 || y < 458 || y > 986) return false; if(x < v50Lake(y) + 6) return false;
  if(x > 1286 && x < 1374 && !(y > 508 && y < 556)) return false;
  if(x > 996 && x < 1244 && y > 796 && y < 880) return false; if(x > 1416 && x < 1584 && y > 596 && y < 704) return false; if(x > 1396 && x < 1594 && y > 752 && y < 924) return false;
  if(Math.hypot(x - 860, (y - 690)*1.4) < 30) return false;
  for(let i = 0; i < V50W.sp.length; i++){ const t = V50W.sp[i]; if(Math.abs(x - t[0]) < t[2] && Math.abs(y - t[1]) < t[2]*.6) return false; }
  for(let i = 0; i < V50W.dum.length; i++){ const d = V50W.dum[i]; if(Math.abs(x - d.x) < 10 && Math.abs(y - d.y) < 7) return false; }
  return true;
}
// ---------- cache: trời ----------
function v50SkyImg(){
  const n = v50Night(), d = v50Dusk(), key = Math.round(n*12) + '|' + Math.round(d*8) + '|' + (typeof weather !== 'undefined' ? weather : '');
  if(V50W.sky && V50W.sKey === key) return V50W.sky; const c = V50W.sky || document.createElement('canvas'); c.width = 2; c.height = 256; const g = c.getContext('2d');
  const mix = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.substr(i, 2), 16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v)*k)).join(',') + ')'; };
  const wet = typeof weather !== 'undefined' && /mua|bao|sieubao/.test(weather) ? .45 : 0;
  let top = mix('#5aa8ff', '#0b1236', n), mid = mix('#a8d8ff', '#1c2456', n), bot = mix('#e8f4ff', '#3a3f7a', n);
  if(d > 0){ top = mix(top.replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, r, g2, b) => '#' + [r, g2, b].map(v => (+v).toString(16).padStart(2, '0')).join('')), '#4a3a7a', d*.6); mid = '#ff9a6a'; bot = '#ffd08a'; }
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(.62, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  if(wet){ g.fillStyle = `rgba(110,118,135,${wet})`; g.fillRect(0, 0, 2, 256); } V50W.sky = c; V50W.sKey = key; return c;
}
// ---------- cache: núi sương + rừng thông phía sau ----------
function v50Mountains(){
  const s = v50Season(), key = s + (v50Night() > .5 ? 'n' : 'd'); if(V50W.mts && V50W.mKey === key) return V50W.mts;
  const W = 2400, H = 420, c = V50W.mts || document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), n = v50Night() > .5, rnd = (k => () => (k = (k*48271) % 2147483647)/2147483647)(77);
  g.clearRect(0, 0, W, H);
  const ridge = (base, amp, col, snow, seed) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); let x = 0; const pk = []; while(x <= W){ const h = base - amp*(.45 + rnd()*.55); pk.push([x, h]); x += 120 + rnd()*160; } pk.forEach((p, i) => { if(i){ const q = pk[i - 1]; g.lineTo((q[0] + p[0])/2, Math.max(q[1], p[1]) + 40 + rnd()*30); } g.lineTo(p[0], p[1]); }); g.lineTo(W, H); g.closePath(); g.fill();
    if(snow){ g.fillStyle = n ? '#aab4d8' : '#f4f8ff'; pk.forEach(p => { if(p[1] > base - amp*.62) return; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] - 34, p[1] + 38); g.lineTo(p[0] - 14, p[1] + 30); g.lineTo(p[0], p[1] + 42); g.lineTo(p[0] + 16, p[1] + 30); g.lineTo(p[0] + 34, p[1] + 38); g.closePath(); g.fill(); }); } };
  ridge(300, 300, n ? '#2a3360' : '#8fa0c8', true, 1); g.fillStyle = n ? 'rgba(40,50,90,.5)' : 'rgba(220,232,250,.55)'; g.fillRect(0, 250, W, 170);
  ridge(360, 190, n ? '#1f2748' : '#6b82a8', s === 'dong', 2); g.fillStyle = n ? 'rgba(30,40,80,.45)' : 'rgba(210,225,245,.5)'; g.fillRect(0, 330, W, 90);
  // rừng thông dưới chân núi
  const pc = s === 'dong' ? (n ? '#2c3a52' : '#3f5a58') : (n ? '#14261f' : '#2c5a3e');
  for(let x = 0; x < W; x += 9 + rnd()*8){ const h = 26 + rnd()*30, y = 410 - rnd()*16; g.fillStyle = pc; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x - h*.32, y); g.lineTo(x + h*.32, y); g.closePath(); g.fill(); if(s === 'dong'){ g.fillStyle = '#e8f0ff'; g.fillRect(x - 2, y - h + 4, 4, 3); } }
  V50W.mts = c; V50W.mKey = key; return c;
}
// ---------- cache: nền đất (hồ, vách đá, cầu, đường, sân tròn, nhà kính, phố đũa, cây) ----------
function v50Pine(g, x, y, h, s, n){ const col = s === 'dong' ? '#3f6a5a' : '#2f6b45', dk = s === 'dong' ? '#2c4e44' : '#224f33';
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 4, y, h*.3, h*.1, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a22'; g.fillRect(x - 2, y - 8, 4, 8);
  for(let k = 0; k < 3; k++){ const yy = y - 6 - k*h*.24, w = h*(.36 - k*.08); g.fillStyle = col; g.beginPath(); g.moveTo(x, yy - h*.42); g.lineTo(x - w, yy); g.lineTo(x + w, yy); g.closePath(); g.fill(); g.fillStyle = dk; g.beginPath(); g.moveTo(x, yy - h*.42); g.lineTo(x + w, yy); g.lineTo(x, yy); g.closePath(); g.fill();
    if(s === 'dong'){ g.fillStyle = '#f4f8ff'; g.fillRect(x - w*.6, yy - 3, w*1.2, 3); } } }
function v50Tree(g, x, y, r, s){ const leaf = {xuan:['#ffb3d1', '#ff8fbf'], ha:['#3f9a46', '#2f7a36'], thu:['#e0782a', '#c25a1a'], dong:['#d8e4f0', '#b8c8dc']}[s] || ['#3f9a46', '#2f7a36'];
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 4, y, r*.9, r*.3, 0, 0, 7); g.fill(); g.fillStyle = '#6b4226'; g.fillRect(x - 3, y - r, 6, r);
  g.fillStyle = leaf[1]; g.beginPath(); g.arc(x, y - r*1.5, r, 0, 7); g.fill(); g.fillStyle = leaf[0]; g.beginPath(); g.arc(x - r*.3, y - r*1.7, r*.7, 0, 7); g.fill(); }
function v50Ground(){
  const s = v50Season(); if(V50W.ground && V50W.gKey === s) return V50W.ground; const W = V50_WX, H = 1080 - V50_GY0, c = V50W.ground || document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, -V50_GY0); const rnd = (k => () => (k = (k*48271) % 2147483647)/2147483647)(4242);
  const grass = {xuan:'#6cc46a', ha:'#4fae4f', thu:'#a3a84a', dong:'#e6edf5'}[s] || '#6cc46a', grass2 = {xuan:'#5cb45a', ha:'#43a043', thu:'#949a40', dong:'#d4dfea'}[s] || '#5cb45a';
  g.fillStyle = grass; g.fillRect(0, V50_GY0, W, H); g.fillStyle = grass2; for(let i = 0; i < 900; i++){ g.fillRect(rnd()*W, V50_GY0 + rnd()*H, 3, 2); }
  // rừng thông dày sau lâu đài
  for(let x = 0; x < W; x += 16 + rnd()*10) v50Pine(g, x, 300 + rnd()*30, 44 + rnd()*30, s);
  // sân bay chổi (bên phải, sau vạch y 452): cỏ cắt sọc + 3 cột vòng (vẽ ở lớp động để vòng sáng)
  g.fillStyle = 'rgba(255,255,255,.08)'; for(let x = 1390; x < 1600; x += 26) g.fillRect(x, 340, 13, 112);
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.strokeRect(1392, 342, 206, 108);
  // hồ: mép hữu cơ, nước sâu dần
  const lake = new Path2D(); lake.moveTo(0, 380); for(let y = 380; y <= 1080; y += 10) lake.lineTo(v50Lake(y), y); lake.lineTo(0, 1080); lake.closePath(); V50W.lakeP = lake;
  g.fillStyle = s === 'dong' ? '#9fc3e0' : '#3a7fc0'; g.fill(lake); g.save(); g.clip(lake); for(let k = 0; k < 5; k++){ g.fillStyle = s === 'dong' ? 'rgba(220,236,250,.18)' : 'rgba(20,60,120,.16)'; g.fillRect(0, 380, 360 - k*60, 620); } g.fillStyle = 'rgba(255,255,255,.12)'; for(let i = 0; i < 70; i++) g.fillRect(rnd()*600, 460 + rnd()*540, 10 + rnd()*14, 1.5);
  if(s === 'dong'){ g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; for(let i = 0; i < 18; i++){ const x = rnd()*500, y = 560 + rnd()*400; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y + 8); g.lineTo(x + 34, y + 2); g.stroke(); } }
  g.restore(); g.strokeStyle = s === 'dong' ? '#e8f0f8' : '#d8c89a'; g.lineWidth = 5; g.stroke(lake);
  // vách đá dưới cánh trái lâu đài, đổ xuống hồ
  g.fillStyle = '#6d6a78'; g.beginPath(); g.moveTo(340, 440); g.lineTo(660, 440); g.lineTo(640, 470); g.lineTo(600, 520); g.lineTo(520, 548); g.lineTo(430, 560); g.lineTo(350, 540); g.closePath(); g.fill();
  g.fillStyle = '#585566'; for(let i = 0; i < 26; i++){ const x = 350 + rnd()*280, y = 450 + rnd()*90; if(y > 440 + (x - 340)*.4 + 60) continue; g.fillRect(x, y, 10 + rnd()*18, 3); }
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(350, 442, 300, 4);
  // suối từ núi xuống, cầu đá 4 nhịp (deck y 508–556, vòm phía nam)
  g.fillStyle = s === 'dong' ? '#a7c9e4' : '#3d86c6'; g.fillRect(1290, 330, 80, 750); g.fillStyle = 'rgba(255,255,255,.25)'; for(let y = 340; y < 1000; y += 22) g.fillRect(1300 + rnd()*50, y, 14, 2);
  g.fillStyle = '#7d7a88'; g.fillRect(1270, 500, 120, 64); g.fillStyle = '#9894a4'; g.fillRect(1270, 506, 120, 44); g.fillStyle = 'rgba(0,0,0,.12)'; for(let x = 1276; x < 1390; x += 12) g.fillRect(x, 506, 1.5, 44);
  g.fillStyle = '#b5b0c0'; for(let x = 1270; x < 1390; x += 14){ g.fillRect(x, 498, 8, 6); g.fillRect(x, 548, 8, 6); }
  for(let k = 0; k < 4; k++){ const ax = 1276 + k*28; g.fillStyle = '#7d7a88'; g.fillRect(ax, 556, 26, 22); g.fillStyle = s === 'dong' ? '#a7c9e4' : '#2d6aa0'; g.beginPath(); g.moveTo(ax + 4, 580); g.lineTo(ax + 4, 568); g.arc(ax + 13, 568, 9, Math.PI, 0); g.lineTo(ax + 22, 580); g.fill(); }
  // đường lát đá: cổng → sân tròn → các cửa lâu đài; sân tròn → cầu → bên phải
  g.lineCap = 'round'; g.lineJoin = 'round'; const path = (pts, w) => { g.strokeStyle = s === 'dong' ? '#c9ccd8' : '#cbbf9e'; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = w*.5; g.stroke(); };
  path([[780, 970], [820, 860], [860, 690]], 34); path([[860, 690], [860, 470]], 40); path([[640, 470], [1180, 470]], 34); path([[860, 690], [1100, 600], [1280, 530], [1400, 530], [1490, 480]], 30);
  path([[1400, 530], [1500, 610], [1500, 720]], 26); path([[860, 690], [700, 770], [580, 810]], 26); path([[860, 690], [1000, 800], [1060, 890], [1180, 890]], 26);
  // sân tròn: bán kính 110, hoa văn sao 6 cánh màu Rubik, đài phun ở tâm
  const cx = 860, cy = 690; g.fillStyle = s === 'dong' ? '#d8dce8' : '#d6ccb0'; g.beginPath(); g.ellipse(cx, cy, 120, 120/V50_PHI, 0, 0, 7); g.fill(); g.strokeStyle = '#a99c86'; g.lineWidth = 4; g.stroke();
  g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, 120/V50_PHI, 120/V50_PHI/V50_PHI, 0, 0, 7); g.stroke();
  for(let k = 0; k < 6; k++){ const a = k/6*6.283 - Math.PI/2; g.fillStyle = V50_RUBIK[k]; g.globalAlpha = .55; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - .18)*96, cy + Math.sin(a - .18)*96/V50_PHI); g.lineTo(cx + Math.cos(a)*112, cy + Math.sin(a)*112/V50_PHI); g.lineTo(cx + Math.cos(a + .18)*96, cy + Math.sin(a + .18)*96/V50_PHI); g.closePath(); g.fill(); } g.globalAlpha = 1;
  g.fillStyle = '#9a96a6'; g.beginPath(); g.ellipse(cx, cy, 30, 18, 0, 0, 7); g.fill(); g.fillStyle = s === 'dong' ? '#c8e0f4' : '#5aa8e0'; g.beginPath(); g.ellipse(cx, cy, 22, 13, 0, 0, 7); g.fill();
  // vòng đá ký hiệu bên hồ: 7 phiến đá xếp tròn
  for(let k = 0; k < 7; k++){ const a = k/7*6.283, x = 560 + Math.cos(a)*44, y = 810 + Math.sin(a)*26; g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 6, y, 14, 4); g.fillStyle = '#8a8698'; g.fillRect(x - 6, y - 22, 12, 22); g.fillStyle = '#a6a2b4'; g.fillRect(x - 6, y - 22, 12, 4); g.fillStyle = V50_RUBIK[k % 6]; g.fillRect(x - 2, y - 15, 4, 4); }
  // nhà kính: khung sắt + kính xanh, mái vòm (rộng 168, cao 168/φ²)
  const gx = 1416, gy = 596, gw = 168, gh = Math.round(gw/V50_PHI/V50_PHI) + 40; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(gx + 6, gy + gh - 2, gw, 8);
  g.fillStyle = 'rgba(160,230,220,.55)'; g.fillRect(gx, gy + 30, gw, gh - 30); g.beginPath(); g.ellipse(gx + gw/2, gy + 30, gw/2, 34, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#4fa36a'; for(let i = 0; i < 18; i++){ g.beginPath(); g.arc(gx + 10 + rnd()*(gw - 20), gy + 54 + rnd()*(gh - 64), 5 + rnd()*6, 0, 7); g.fill(); } g.fillStyle = '#ff8fc4'; for(let i = 0; i < 8; i++) g.fillRect(gx + 10 + rnd()*(gw - 20), gy + 54 + rnd()*(gh - 64), 3, 3);
  g.strokeStyle = '#e8eef0'; g.lineWidth = 2.5; g.strokeRect(gx, gy + 30, gw, gh - 30); for(let x = gx + 21; x < gx + gw; x += 21){ g.beginPath(); g.moveTo(x, gy + 30); g.lineTo(x, gy + gh); g.stroke(); } g.beginPath(); g.moveTo(gx, gy + 30 + (gh - 30)/V50_PHI); g.lineTo(gx + gw, gy + 30 + (gh - 30)/V50_PHI); g.stroke(); g.beginPath(); g.ellipse(gx + gw/2, gy + 30, gw/2, 34, 0, Math.PI, 0); g.stroke();
  for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(gx + gw*k/4, gy + 30); g.lineTo(gx + gw/2, gy - 2); g.stroke(); }
  g.fillStyle = '#6b4a2a'; g.fillRect(gx + gw/2 - 12, gy + gh - 34, 24, 34); g.fillStyle = '#e8c27a'; g.fillRect(gx + gw/2 + 6, gy + gh - 18, 3, 3);
  // chuồng sinh vật: hàng rào gỗ thấp + cỏ mềm
  g.fillStyle = s === 'dong' ? '#eef3f8' : '#7fd07a'; g.fillRect(1400, 756, 192, 166); g.fillStyle = '#8a5a32'; for(let x = 1400; x <= 1592; x += 16){ g.fillRect(x, 750, 4, 14); g.fillRect(x, 912, 4, 14); } for(let y = 756; y <= 920; y += 16){ g.fillRect(1398, y, 4, 12); g.fillRect(1590, y, 4, 12); } g.fillRect(1398, 754, 196, 3); g.fillRect(1398, 916, 196, 3);
  g.fillStyle = '#c99a5a'; g.fillRect(1430, 780, 34, 20); g.fillStyle = '#8a5a32'; g.beginPath(); g.moveTo(1426, 780); g.lineTo(1447, 766); g.lineTo(1468, 780); g.fill();
  // phố đũa: 2 gian liền nhau (Tiệm Đũa, Tủ Áo Choàng), mặt tiền rộng 248, cao 248/φ²
  const bx = 996, by = 796, bw = 248, bh = Math.round(bw/V50_PHI/V50_PHI); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(bx + 6, by + bh, bw, 8);
  [[bx, '#6a4a8a', '#ffd23f'], [bx + bw/2, '#2f5f8a', '#ff8fc4']].forEach(([x, roof, sign], i) => { g.fillStyle = '#e6d8bc'; g.fillRect(x, by + 12, bw/2 - 2, bh - 12); g.fillStyle = 'rgba(90,70,50,.18)'; g.fillRect(x + (bw/2)/V50_PHI, by + 12, (bw/2 - 2) - (bw/2)/V50_PHI, bh - 12);
    g.fillStyle = roof; g.beginPath(); g.moveTo(x - 6, by + 14); g.lineTo(x + bw/4, by - 34); g.lineTo(x + bw/2 + 4, by + 14); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(x + bw/4, by - 34); g.lineTo(x + bw/2 + 4, by + 14); g.lineTo(x + bw/4, by + 14); g.fill();
    g.fillStyle = '#5a3a22'; g.fillRect(x + bw/4 - 11, by + bh - 34, 22, 34); g.fillStyle = '#2c3a66'; g.fillRect(x + 10, by + 30, 22, 22); g.fillRect(x + bw/2 - 34, by + 30, 22, 22); g.fillStyle = sign; g.fillRect(x + bw/4 - 18, by + 18, 36, 8); });
  // cây: gom vùng biên, lưu ô va chạm
  V50W.sp = []; const tz = [[1390, 1600, 940, 1070, 9], [420, 760, 930, 1070, 8], [900, 1280, 990, 1070, 6], [1250, 1290, 640, 1000, 5], [1384, 1410, 460, 1000, 6], [1590, 1618, 460, 1000, 6], [960, 1280, 560, 600, 0]];
  const trees = []; tz.forEach(z => { for(let i = 0; i < z[4]; i++){ const x = z[0] + rnd()*(z[1] - z[0]), y = z[2] + rnd()*(z[3] - z[2]); if(x < v50Lake(y) + 20) continue; trees.push([x, y, rnd() < .55]); } });
  trees.sort((a, b) => a[1] - b[1]).forEach(t => { if(t[2]) v50Pine(g, t[0], t[1], 52 + rnd()*20, s); else v50Tree(g, t[0], t[1], 14 + rnd()*5, s); V50W.sp.push([t[0], t[1], 14]); });
  // đèn đường (thắp bằng phép lửa/ánh sáng; đêm tự sáng dịu)
  V50W.lan = [[800, 900], [830, 780], [900, 560], [820, 560], [1120, 600], [1240, 545], [700, 770], [1000, 820], [1440, 560]].map(p => ({x:p[0], y:p[1], lit:0}));
  V50W.lan.forEach(l => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(l.x - 5, l.y - 2, 12, 4); g.fillStyle = '#3a3a48'; g.fillRect(l.x - 1.5, l.y - 34, 3, 34); g.fillRect(l.x - 5, l.y - 40, 10, 8); g.fillStyle = '#ffe9a8'; g.fillRect(l.x - 3, l.y - 38, 6, 5); g.fillStyle = '#3a3a48'; g.fillRect(l.x - 6, l.y - 43, 12, 3); V50W.sp.push([l.x, l.y, 5]); });
  if(s === 'dong'){ g.fillStyle = 'rgba(255,255,255,.55)'; for(let i = 0; i < 400; i++) g.fillRect(rnd()*W, V50_GY0 + rnd()*H, 2, 2); }
  V50W.ground = c; V50W.gKey = s; return c;
}
// ---------- cache: lâu đài gô-tích (thiết kế riêng) ----------
function v50Win(g, x, y, w, h, n, glow){ g.fillStyle = '#3a3448'; g.beginPath(); g.moveTo(x - 1.5, y + h + 1); g.lineTo(x - 1.5, y + w/2); g.quadraticCurveTo(x - 1.5, y - w*.5, x + w/2, y - w*.75); g.quadraticCurveTo(x + w + 1.5, y - w*.5, x + w + 1.5, y + w/2); g.lineTo(x + w + 1.5, y + h + 1); g.fill();
  g.fillStyle = n ? '#ffcf6a' : '#2a3558'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w/2); g.quadraticCurveTo(x, y - w*.35, x + w/2, y - w*.6); g.quadraticCurveTo(x + w, y - w*.35, x + w, y + w/2); g.lineTo(x + w, y + h); g.fill();
  g.fillStyle = n ? 'rgba(255,140,40,.55)' : 'rgba(255,255,255,.3)'; g.fillRect(x + w/2 - .6, y - w*.3, 1.2, h + w*.3); g.fillRect(x, y + h*.45, w, 1.2); if(glow) V50W.win.push([x + w/2, y + h/2, Math.max(w, h)]); }
function v50Stone(g, x, y, w, h, base){ g.fillStyle = base; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(30,25,45,.22)'; g.fillRect(x + w/V50_PHI, y, w - w/V50_PHI, h); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, 2, h);
  g.fillStyle = 'rgba(40,35,60,.16)'; for(let yy = y + 8, k = 0; yy < y + h - 2; yy += 9, k++){ g.fillRect(x, yy, w, 1.2); for(let bx = x + (k % 2 ? 5 : 12); bx < x + w - 2; bx += 14) g.fillRect(bx, yy - 7.8, 1.2, 7.8); } }
function v50Cren(g, x, y, w, col){ g.fillStyle = col; g.fillRect(x - 2, y - 4, w + 4, 5); const n = Math.max(2, Math.round(w/12)), m = (w + 4)/(2*n - 1); for(let i = 0; i < n; i++) g.fillRect(x - 2 + i*2*m, y - 11, m, 8); }
function v50Spire(g, cx, top, w, h, roof, snow){ g.fillStyle = roof; g.beginPath(); g.moveTo(cx - w/2 - 4, top); g.quadraticCurveTo(cx - w*.12, top - h*.5, cx, top - h); g.quadraticCurveTo(cx + w*.12, top - h*.5, cx + w/2 + 4, top); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, top - h); g.quadraticCurveTo(cx + w*.12, top - h*.5, cx + w/2 + 4, top); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.14)'; for(let k = 1; k < 5; k++){ const yy = top - h*k/5.5, hw = (w/2 + 4)*(1 - k/5.5)*.95; g.fillRect(cx - hw, yy, hw*2, 1.4); }
  if(snow){ g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(cx - w/2 - 4, top); g.lineTo(cx - w*.25, top - h*.3); g.lineTo(cx, top - h*.22); g.lineTo(cx + w*.25, top - h*.3); g.lineTo(cx + w/2 + 4, top); g.lineTo(cx + w/2, top - 4); g.lineTo(cx - w/2, top - 4); g.closePath(); g.fill(); }
  g.fillStyle = '#e8c27a'; g.fillRect(cx - .8, top - h - 14, 1.6, 14); }
function v50RoundTower(g, cx, base, w, h, roof, n, snow, flag){ const x = cx - w/2, top = base - h; v50Stone(g, x, top, w, h, '#9aa0b4');
  const ww = Math.max(6, w/V50_PHI/V50_PHI), wh = ww*V50_PHI; for(let k = 0; k < 3; k++){ const wy = top + h*(k + 1)/(4.2) - wh/2; if(wy + wh > base - 10) break; v50Win(g, cx - ww/2, wy, ww, wh, n, true); }
  v50Cren(g, x, top, w, '#b8bccc'); const rh = w*V50_PHI*1.1; v50Spire(g, cx, top - 10, w, rh, roof, snow); if(flag != null) V50W.flags.push([cx + 1, top - 10 - rh - 14, flag]); }
function v50Castle(){
  const s = v50Season(), n = v50Night() > .5, key = s + n; if(V50W.castle && V50W.cKey === key) return V50W.castle;
  const c = V50W.castle || document.createElement('canvas'); c.width = V50_CW; c.height = V50_CH; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, -V50_CX0, -V50_CY0); g.clearRect(V50_CX0, V50_CY0, V50_CW, V50_CH);
  V50W.win = []; V50W.flags = []; const B = V50_BASE, snow = s === 'dong', slate = '#3a4466', cop = '#4f9a8a', plum = '#5a3f78';
  // 1) tháp sau (đứng xa): thấp hơn, nhạt hơn
  g.globalAlpha = .9; v50RoundTower(g, 560, B - 70, 30, 150, slate, n, snow, 2); v50RoundTower(g, 1080, B - 70, 28, 160, cop, n, snow, 3); g.globalAlpha = 1;
  // 2) tường thành dài có trụ ốp
  v50Stone(g, 380, B - 74, 880, 74, '#8e94a8'); v50Cren(g, 380, B - 74, 880, '#aeb2c2'); g.fillStyle = 'rgba(30,25,45,.2)'; for(let x = 420; x < 1250; x += 62) g.fillRect(x, B - 74, 8, 74);
  // 3) cánh thư viện (trái): mái dốc + dãy cửa sổ + tháp tròn ở mép vách
  v50Stone(g, 560, B - 118, 170, 118, '#a2a8bc'); g.fillStyle = slate; g.beginPath(); g.moveTo(552, B - 118); g.lineTo(600, B - 168); g.lineTo(690, B - 168); g.lineTo(738, B - 118); g.closePath(); g.fill(); if(snow){ g.fillStyle = '#f4f8ff'; g.fillRect(600, B - 170, 90, 5); }
  for(let k = 0; k < 5; k++) v50Win(g, 574 + k*32, B - 92, 12, 34, n, true); g.fillStyle = '#4a3828'; g.beginPath(); g.moveTo(626, B); g.lineTo(626, B - 24); g.arc(640, B - 24, 14, Math.PI, 0); g.lineTo(654, B); g.fill();
  v50RoundTower(g, 420, B, 48, 200, plum, n, snow, 0); v50RoundTower(g, 490, B, 34, 132, slate, n, snow, null);
  // 4) ĐẠI SẢNH (giữa): mặt hồi hướng ra, cao = rộng; đầu hồi nhọn; cửa sổ hoa hồng 3×3 Rubik; cửa vòm lớn
  const hx = 780, hw = 160, hh = 160, ht = B - hh; v50Stone(g, hx, ht, hw, hh, '#a8aec2');
  g.fillStyle = slate; g.beginPath(); g.moveTo(hx - 8, ht + 2); g.lineTo(hx + hw/2, ht - hw/V50_PHI); g.lineTo(hx + hw + 8, ht + 2); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(hx + hw/2, ht - hw/V50_PHI); g.lineTo(hx + hw + 8, ht + 2); g.lineTo(hx + hw/2, ht + 2); g.fill();
  if(snow){ g.strokeStyle = '#f4f8ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(hx - 8, ht); g.lineTo(hx + hw/2, ht - hw/V50_PHI); g.lineTo(hx + hw + 8, ht); g.stroke(); }
  const rx = hx + hw/2, ry = ht + hh/V50_PHI/V50_PHI, rr = hw/V50_PHI/V50_PHI/1.4; g.fillStyle = '#6a6478'; g.beginPath(); g.arc(rx, ry, rr + 5, 0, 7); g.fill(); g.save(); g.beginPath(); g.arc(rx, ry, rr, 0, 7); g.clip(); const cc = rr*2/3;
  for(let i = 0; i < 9; i++){ g.fillStyle = n ? ['#ffd27a', '#ffb347', '#ffe9a8'][i % 3] : V50_RUBIK[(i*5 + 2) % 6]; g.fillRect(rx - rr + (i % 3)*cc + 1, ry - rr + Math.floor(i/3)*cc + 1, cc - 2, cc - 2); } g.restore(); V50W.win.push([rx, ry, rr*1.6]);
  for(let k = 0; k < 4; k++){ if(k === 1 || k === 2) continue; v50Win(g, hx + 18 + k*36, ht + 58, 14, 52, n, true); } v50Win(g, hx + 52, ht + 66, 10, 30, n, true); v50Win(g, hx + 98, ht + 66, 10, 30, n, true);
  g.fillStyle = '#7a7488'; g.beginPath(); g.moveTo(rx - 26, B); g.lineTo(rx - 26, B - 40); g.quadraticCurveTo(rx - 26, B - 66, rx, B - 72); g.quadraticCurveTo(rx + 26, B - 66, rx + 26, B - 40); g.lineTo(rx + 26, B); g.fill();
  g.fillStyle = n ? '#ffb85a' : '#4a3828'; g.beginPath(); g.moveTo(rx - 20, B); g.lineTo(rx - 20, B - 38); g.quadraticCurveTo(rx - 20, B - 60, rx, B - 64); g.quadraticCurveTo(rx + 20, B - 60, rx + 20, B - 38); g.lineTo(rx + 20, B); g.fill(); if(n) V50W.win.push([rx, B - 30, 26]);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(rx - .8, B - 62, 1.6, 62);
  // tháp nhọn kim ở 2 góc Đại sảnh (cao = hh/φ)
  [hx - 4, hx + hw + 4].forEach((x, i) => { v50Stone(g, x - 9, ht - 20, 18, hh + 20, '#9aa0b4'); v50Spire(g, x, ht - 22, 18, hh/V50_PHI, slate, snow); V50W.flags.push([x + 1, ht - 22 - hh/V50_PHI - 14, 4 + i]); });
  // 5) tháp đồng hồ vuông: mặt đồng hồ 3×3 Rubik (cao = 260)
  const tx = 975, tw = 60, th = 260, tt = B - th; v50Stone(g, tx, tt, tw, th, '#a2a8bc'); v50Cren(g, tx, tt, tw, '#b8bccc');
  g.fillStyle = slate; g.beginPath(); g.moveTo(tx - 6, tt - 10); g.lineTo(tx + tw/2, tt - 10 - tw*V50_PHI); g.lineTo(tx + tw + 6, tt - 10); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(tx + tw/2, tt - 10 - tw*V50_PHI); g.lineTo(tx + tw + 6, tt - 10); g.lineTo(tx + tw/2, tt - 10); g.fill();
  if(snow){ g.fillStyle = '#f4f8ff'; g.fillRect(tx - 6, tt - 14, tw + 12, 5); }
  const kx = tx + tw/2, ky = tt + th/V50_PHI/V50_PHI/V50_PHI + 8; g.fillStyle = '#e8c27a'; g.beginPath(); g.arc(kx, ky, 22, 0, 7); g.fill(); g.fillStyle = n ? '#fff2c8' : '#f4f0e6'; g.beginPath(); g.arc(kx, ky, 18, 0, 7); g.fill();
  for(let i = 0; i < 12; i++){ const a = i/12*6.283; g.fillStyle = V50_RUBIK[i % 6]; g.fillRect(kx + Math.cos(a)*14 - 1.5, ky + Math.sin(a)*14 - 1.5, 3, 3); } if(n) V50W.win.push([kx, ky, 46]);
  for(let k = 0; k < 3; k++) v50Win(g, kx - 6, tt + 90 + k*52, 12, 28, n, true);
  // 6) cánh hầm pha chế + 7) THÁP THIÊN VĂN (cao nhất 300, mái vòm đồng + kính thiên văn)
  v50Stone(g, 1040, B - 96, 110, 96, '#a2a8bc'); v50Cren(g, 1040, B - 96, 110, '#b8bccc'); for(let k = 0; k < 3; k++) v50Win(g, 1052 + k*34, B - 74, 12, 28, n, true);
  g.fillStyle = '#4a3828'; g.beginPath(); g.moveTo(992, B); g.lineTo(992, B - 20); g.arc(1005, B - 20, 13, Math.PI, 0); g.lineTo(1018, B); g.fill();
  const ox = 1180, ow = 56, oh = 300, ot = B - oh; v50Stone(g, ox - ow/2, ot, ow, oh, '#9aa0b4'); for(let k = 0; k < 5; k++) v50Win(g, ox - 6, ot + 40 + k*50, 12, 26, n, true);
  g.fillStyle = '#b8bccc'; g.fillRect(ox - ow/2 - 8, ot - 8, ow + 16, 10); g.fillStyle = cop; g.beginPath(); g.ellipse(ox, ot - 8, ow/2 + 4, ow/2 + 4, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(ox, ot - 8, ow/2 + 4, ow/2 + 4, 0, -Math.PI/2, 0); g.lineTo(ox, ot - 8); g.fill();
  if(snow){ g.fillStyle = '#f4f8ff'; g.beginPath(); g.ellipse(ox, ot - 8, ow/2 + 4, ow/2 + 4, 0, Math.PI*1.15, Math.PI*1.85); g.lineTo(ox, ot - 20); g.fill(); }
  g.fillStyle = '#1d2238'; g.fillRect(ox - 4, ot - 8 - ow/2 - 2, 12, 16); g.save(); g.translate(ox + 2, ot - 8 - ow/2 + 4); g.rotate(-.6); g.fillStyle = '#c8a25a'; g.fillRect(0, -4, 34, 8); g.fillStyle = '#e8c27a'; g.fillRect(30, -5, 6, 10); g.restore();
  g.fillStyle = '#4a3828'; g.beginPath(); g.moveTo(ox - 12, B); g.lineTo(ox - 12, B - 22); g.arc(ox, B - 22, 12, Math.PI, 0); g.lineTo(ox + 12, B); g.fill();
  // 8) tháp phải
  v50RoundTower(g, 1250, B, 32, 140, slate, n, snow, 1); v50RoundTower(g, 1110, B - 96, 26, 96, plum, n, snow, null);
  // cửa thư viện / tháp: biển nhỏ
  V50W.castle = c; V50W.cKey = key; return c;
}
// ---------- cache: sương, mây ----------
function v50FogImg(){ if(V50W.fog) return V50W.fog; const c = document.createElement('canvas'); c.width = 256; c.height = 80; const g = c.getContext('2d'), gr = g.createRadialGradient(128, 40, 0, 128, 40, 128);
  gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(.45, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.setTransform(1, 0, 0, .31, 0, 27.6); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); V50W.fog = c; return c; }
function v50CloudImg(){ if(V50W.cloud) return V50W.cloud; const c = document.createElement('canvas'); c.width = 120; c.height = 44; const g = c.getContext('2d'); g.fillStyle = '#ffffff';
  [[30, 28, 16], [52, 20, 20], [76, 24, 17], [94, 30, 12], [20, 34, 10]].forEach(a => { g.beginPath(); g.arc(a[0], a[1], a[2], 0, 7); g.fill(); }); g.fillRect(14, 30, 92, 12); g.fillStyle = 'rgba(160,170,200,.35)'; g.fillRect(14, 38, 92, 4); V50W.cloud = c; return c; }
// ---------- người mặc áo choàng ----------
function v50Person(g, x, y, P, t){
  const mv = P.moving, ph = mv ? Math.floor(P.walk*1.5) % 6 : 0, lA = mv ? [0, 1, 2, 2, 1, 0][ph] : 0, lB = mv ? [2, 1, 0, 0, 1, 2][ph] : 0, by = mv && (ph === 1 || ph === 4) ? -1 : 0;
  g.save(); g.translate(Math.round(x), Math.round(y)); if(P.dir < 0) g.scale(-1, 1); const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
  R('rgba(0,0,0,.25)', -8, -2, 16, 4); R('#2a2a33', -5, -9, 4, 7 - lA); R('#2a2a33', 1, -9, 4, 7 - lB); R('#18181e', -5, -2 - lA, 4, 2); R('#18181e', 1, -2 - lB, 4, 2);
  R(P.shirt || '#f4f4f4', -6, -21 + by, 12, 12); R('#7a1f2b', -1, -20 + by, 2, 6);
  g.translate(0, by); v50Robe(g, P.robe, P.sty, P.hc, 1, mv, P.walk); g.translate(0, -by);
  R(P.skin, -5, -31 + by, 10, 10); R(P.hair, -6, -33 + by, 12, 4); if(P.long){ R(P.hair, -6, -31 + by, 2, 11); R(P.hair, 4, -31 + by, 2, 11); } else R(P.hair, -6, -31 + by, 2, 4);
  R('#1a1a22', 1, -27 + by, 2, 2); R('#1a1a22', -3, -27 + by, 2, 2); if(P.sty === 1) { R(P.robe, -6, -35 + by, 12, 3); R(P.robe, -7, -33 + by, 2, 6); R(P.robe, 5, -33 + by, 2, 6); }
  if(P.wand != null){ R('#6b4226', 6, -18 + by, 2, 7); g.fillStyle = (V50_WANDS[P.wand] || V50_WANDS[0]).c; g.fillRect(6, -21 + by, 2, 3); }
  g.restore();
}
function v50MeLook(){ const s = v50State(), P = typeof PLAYER !== 'undefined' && PLAYER ? PLAYER : null, h = s.house >= 0 ? V50_HOUSES[s.house] : null;
  const m = V50W.me; m.skin = P && P.skin || '#f1c27d'; m.hair = P && P.hair || '#3a2a1a'; m.long = !!(P && P.long); m.shirt = P && P.shirt || '#f4f4f4'; m.robe = (V50_ROBE_COLS[s.robe.c] || V50_ROBE_COLS[1])[0]; m.sty = s.robe.s || 0; m.hc = h ? h.c : null; m.wand = s.wand; }
function v50MakeNpcs(){
  const SK = ['#f1c27d', '#e0ac69', '#c68642', '#ffdbac', '#8d5524'], HR = ['#3a2a1a', '#1a1a1a', '#7a4a1a', '#c8a050', '#5a2a1a'], rr = (k => () => (k = (k*48271) % 2147483647)/2147483647)(99);
  V50W.npc = []; for(let i = 0; i < 14; i++){ const h = V50_HOUSES[i % 6]; let x, y, k = 0; do { x = 500 + rr()*1080; y = 470 + rr()*500; } while(!v50Walk(x, y) && ++k < 40);
    V50W.npc.push({x, y, tx:x, ty:y, dir:1, walk:0, moving:false, wait:rr()*3, skin:SK[i % 5], hair:HR[(i*3) % 5], long:i % 3 === 0, shirt:'#f4f4f4', robe:V50_ROBE_COLS[[0, 1, 2, 3, 4, 5][i % 6]][0], sty:i % 4, hc:h.c, wand:i % 12, cast:0}); }
  V50W.dum = [[760, 640], [960, 640], [790, 748], [930, 748]].map((p, i) => ({x:p[0], y:p[1], wob:0, ph:i, hits:0}));
  V50W.crit = []; for(let i = 0; i < 4; i++) V50W.crit.push({x:1440 + i*36, y:820 + (i % 2)*50, vx:20, vy:10, k:i, ph:i});
  V50W.owls = []; for(let i = 0; i < 3; i++) V50W.owls.push({x:-200 - i*700, y:-120 + i*60, sp:60 + i*14, ph:i*2, k:i});
  V50W.candles = []; for(let i = 0; i < 46; i++) V50W.candles.push({u:rr(), v:rr()*.55, ph:rr()*6.28, h:.7 + rr()*.6});
}
// ---------- vẽ một khung ----------
function v50Frame(now){
  if(!V50.open){ V50W.raf = 0; return; } V50W.raf = requestAnimationFrame(v50Frame);
  const dt = Math.min(.05, Math.max(.001, (now - (V50W.lt || now))/1000)); V50W.lt = now; V50W.fa.push(dt); if(V50W.fa.length > 40) V50W.fa.shift();
  const avg = V50W.fa.reduce((a, b) => a + b, 0)/V50W.fa.length; V50W.fps = 1/avg; V50.q = V50W.fps < 40 || (typeof v26Saver === 'function' && v26Saver()) ? .5 : 1;
  if(V50.game){ try { v50GFrame(dt); } catch(e){ console.warn('v50 game', e); } return; }
  try { V50W.room === 'hall' ? v50HallDraw(dt) : (v50Update(dt), v50Draw(dt)); } catch(e){ console.warn('v50 draw', e); }
}
function v50Update(dt){
  const m = V50W.me, K = V50W.keys; let dx = (K.ArrowRight || K.d ? 1 : 0) - (K.ArrowLeft || K.a ? 1 : 0), dy = (K.ArrowDown || K.s ? 1 : 0) - (K.ArrowUp || K.w ? 1 : 0);
  if(V50W.joy && V50W.joy.on){ dx = V50W.joy.vx; dy = V50W.joy.vy; } const L = Math.hypot(dx, dy); m.moving = L > .15;
  if(m.moving){ const sp = 150*Math.min(1, L), nx = m.x + dx/L*sp*dt, ny = m.y + dy/L*sp*dt; if(v50Walk(nx, ny)){ m.x = nx; m.y = ny; } else if(v50Walk(nx, m.y)) m.x = nx; else if(v50Walk(m.x, ny)) m.y = ny; if(Math.abs(dx) > .1) m.dir = dx < 0 ? -1 : 1; m.walk += dt*10; }
  V50W.npc.forEach(a => { if(a.wait > 0){ a.wait -= dt; a.moving = false; if(a.wait <= 0){ let k = 0; do { a.tx = a.x + (Math.random() - .5)*360; a.ty = a.y + (Math.random() - .5)*240; } while(!v50Walk(a.tx, a.ty) && ++k < 12); if(k >= 12){ a.tx = a.x; a.ty = a.y; } } return; }
    const ddx = a.tx - a.x, ddy = a.ty - a.y, d = Math.hypot(ddx, ddy); if(d < 4){ a.wait = 1.5 + Math.random()*4; if(Math.random() < .35) a.cast = 1; return; }
    const nx = a.x + ddx/d*55*dt, ny = a.y + ddy/d*55*dt; if(!v50Walk(nx, ny)){ a.wait = .5; return; } a.x = nx; a.y = ny; a.moving = true; a.walk += dt*7; a.dir = ddx < 0 ? -1 : 1; });
  V50W.dum.forEach(d => { d.wob *= Math.pow(.02, dt); }); V50W.lan.forEach(l => { if(l.lit > 0) l.lit = Math.max(0, l.lit - dt/60); });
  V50W.crit.forEach(c => { c.x += c.vx*dt; c.y += c.vy*dt; if(c.x < 1412 || c.x > 1580) c.vx *= -1; if(c.y < 790 || c.y > 908) c.vy *= -1; c.ph += dt; });
  // camera + điểm gần nhất
  const z = V50W.z, vw = V50W.W/z, vh = V50W.H/z; let cx = m.x, cy = m.y - vh*.2; cx = vw >= V50_WX ? V50_WX/2 : Math.max(vw/2, Math.min(V50_WX - vw/2, cx)); cy = vh >= 1420 ? 310 : Math.max(-380 + vh/2, Math.min(1040 - vh/2, cy));
  V50W.cam.x += (cx - V50W.cam.x)*Math.min(1, dt*5); V50W.cam.y += (cy - V50W.cam.y)*Math.min(1, dt*5);
  let near = null, nd = 1e9; V50_SPOTS.forEach(s => { const d = Math.hypot(m.x - s.x, (m.y - s.y)*1.3); if(d < s.r + 46 && d < nd){ nd = d; near = s; } }); if(near !== V50W.near){ V50W.near = near; v50ActBtn(near); }
}
function v50Draw(dt){
  const g = V50W.g, W = V50W.W, H = V50W.H, z = V50W.z, cam = V50W.cam, nk = v50Night(), s = v50Season(), t = performance.now()/1000;
  g.setTransform(V50W.dpr, 0, 0, V50W.dpr, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(v50SkyImg(), 0, 0, 2, 256, 0, 0, W, H);
  const sh = v50Shake(dt), ox = W/2 - cam.x*z + sh[0], oy = H/2 - cam.y*z + sh[1]; const X0 = cam.x - W/2/z, Y0 = cam.y - H/2/z, X1 = cam.x + W/2/z, Y1 = cam.y + H/2/z;
  // sao + trăng (lệch chậm theo camera)
  if(nk > .05){ g.globalAlpha = nk; g.fillStyle = '#ffffff'; for(let i = 0; i < 90; i++){ const sx = ((i*137.5) % W + W - cam.x*.05) % W, sy = ((i*71.3) % (H*.5)), tw = .5 + .5*Math.sin(t*2 + i); g.globalAlpha = nk*(.35 + tw*.65); g.fillRect(sx, sy, i % 7 ? 1.5 : 2.5, i % 7 ? 1.5 : 2.5); }
    const mx = W*.78 - cam.x*.03, my = H*.12; g.globalAlpha = nk*.5; g.globalCompositeOperation = 'lighter'; g.drawImage(v50Glow('#9fb2ff'), mx - 70, my - 70, 140, 140); g.globalCompositeOperation = 'source-over'; g.globalAlpha = nk;
    g.fillStyle = '#f4f2e0'; g.beginPath(); g.arc(mx, my, 22, 0, 7); g.fill(); g.fillStyle = 'rgba(160,160,140,.45)'; g.beginPath(); g.arc(mx - 7, my - 4, 5, 0, 7); g.arc(mx + 6, my + 6, 3.5, 0, 7); g.arc(mx + 4, my - 9, 2.5, 0, 7); g.fill(); g.globalAlpha = 1; }
  else { const sx = W*.18 - cam.x*.03, sy = H*.1; g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6; g.drawImage(v50Glow('#fff2b0'), sx - 60, sy - 60, 120, 120); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(sx, sy, 16, 0, 7); g.fill(); }
  g.setTransform(V50W.dpr*z, 0, 0, V50W.dpr*z, V50W.dpr*ox, V50W.dpr*oy);
  // mây trôi
  const cl = v50CloudImg(); g.globalAlpha = nk > .5 ? .35 : .9; for(let i = 0; i < 6; i++){ const cx = ((i*420 + t*(8 + i*3)) % 2600) - 500 + cam.x*.4, cy = -330 + i*34; g.drawImage(cl, cx, cy, 120*(1 + i % 3*.4), 44*(1 + i % 3*.4)); } g.globalAlpha = 1;
  // núi (thị sai)
  const mt = v50Mountains(); g.drawImage(mt, -400 + cam.x*.35 - 200, -110);
  // cú bay ngang trời
  V50W.owls.forEach(o => { o.x += o.sp*dt; if(o.x > V50_WX + 300){ o.x = -260 - Math.random()*500; o.y = -200 + Math.random()*220; } const oy2 = o.y + Math.sin(t*1.3 + o.ph)*14, fl = Math.sin(t*9 + o.ph) > 0;
    g.fillStyle = nk > .5 ? '#2a2438' : '#8a6a4a'; g.fillRect(o.x - 4, oy2 - 4, 8, 7); g.fillRect(o.x - 3, oy2 - 7, 6, 4); g.fillStyle = nk > .5 ? '#3a3248' : '#a8885a'; if(fl){ g.fillRect(o.x - 13, oy2 - 6, 9, 3); g.fillRect(o.x + 4, oy2 - 6, 9, 3); } else { g.fillRect(o.x - 12, oy2 - 1, 8, 3); g.fillRect(o.x + 4, oy2 - 1, 8, 3); }
    g.fillStyle = nk > .5 ? '#ffd23f' : '#f4e0a0'; g.fillRect(o.x - 2, oy2 - 6, 1.5, 1.5); g.fillRect(o.x + 1, oy2 - 6, 1.5, 1.5); });
  // nền đất
  if(X0 < 0 || X1 > V50_WX){ const lk = s === 'dong' ? '#9fc3e0' : '#3a7fc0'; g.fillStyle = lk; if(X0 < 0) g.fillRect(X0 - 4, V50_GY0 + 140, -X0 + 4, 1100); g.fillStyle = s === 'dong' ? '#c8d4e0' : '#2c5a3e'; if(X1 > V50_WX) g.fillRect(V50_WX, V50_GY0 + 60, X1 - V50_WX + 4, 1100); }
  const gr = v50Ground(), gy0 = Math.max(V50_GY0, Y0 - 4), gy1 = Math.min(1080, Y1 + 4), gx0 = Math.max(0, X0 - 4), gx1 = Math.min(V50_WX, X1 + 4); if(gy1 > gy0 && gx1 > gx0) g.drawImage(gr, gx0, gy0 - V50_GY0, gx1 - gx0, gy1 - gy0, gx0, gy0, gx1 - gx0, gy1 - gy0);
  // mặt hồ: phản chiếu lâu đài + gợn sóng
  const cs = v50Castle(); if(V50W.lakeP && X0 < 640){ g.save(); g.clip(V50W.lakeP); g.globalAlpha = .2; g.translate(0, 2*V50_BASE + 96); g.scale(1, -1); g.drawImage(cs, V50_CX0, V50_CY0 + 0); g.restore(); g.globalAlpha = 1;
    g.save(); g.clip(V50W.lakeP); g.fillStyle = nk > .5 ? 'rgba(255,230,160,.35)' : 'rgba(255,255,255,.35)'; for(let i = 0; i < 26; i++){ const y = 470 + (i*23) % 520, x = (i*97 + Math.sin(t*.6 + i)*22) % 560; g.fillRect(x, y, 12 + (i % 3)*6, 1.5); } g.restore(); }
  // vòng bay chổi
  for(let k = 0; k < 3; k++){ const hx = 1440 + k*62, hy = 370 - k*26 + Math.sin(t*1.4 + k*2)*6, col = V50_RUBIK[(k*2) % 6]; g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(hx, 430 - k*6, 10, 3, 0, 0, 7); g.fill();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45; g.drawImage(v50Glow(col), hx - 22, hy - 24, 44, 48); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.strokeStyle = col; g.lineWidth = 3.5; g.beginPath(); g.ellipse(hx, hy, 12, 15, 0, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.stroke(); }
  // lâu đài
  g.drawImage(cs, V50_CX0, V50_CY0);
  // cờ nhà vẫy
  V50W.flags.forEach((f, i) => { const col = V50_HOUSES[f[2] % 6].c; g.fillStyle = col; g.beginPath(); g.moveTo(f[0], f[1]); for(let k = 0; k <= 5; k++){ const u = k/5; g.lineTo(f[0] + u*20, f[1] + Math.sin(t*2.4 + i + u*3)*2*u); } for(let k = 5; k >= 0; k--){ const u = k/5; g.lineTo(f[0] + u*20, f[1] + 11 + Math.sin(t*2.4 + i + u*3)*2*u - u*2); } g.closePath(); g.fill(); });
  // sprite theo y
  const SP = V50W._sp || (V50W._sp = []); SP.length = 0; V50W.npc.forEach(a => SP.push(a)); SP.push(V50W.me); V50W.dum.forEach(d => SP.push(d)); V50W.crit.forEach(c => SP.push(c)); SP.sort((a, b) => a.y - b.y);
  for(let i = 0; i < SP.length; i++){ const a = SP[i]; if(a.x < X0 - 40 || a.x > X1 + 40 || a.y < Y0 - 10 || a.y > Y1 + 60) continue;
    if(a.wob != null) v50Dummy(g, a, t); else if(a.k != null) v50Critter(g, a, t, nk); else { v50Person(g, a.x, a.y, a, t);
      if(a.cast > 0 && a !== V50W.me){ a.cast = 0; const w = V50_WANDS[a.wand]; for(let k = 0; k < 6; k++) v50P(a.x + 10*a.dir, a.y - 24, (Math.random() - .5)*40, -30 - Math.random()*40, .8, 6, v50Glow(v50Col(w, k)), 20); } } }
  // đêm: lớp tối + quầng sáng cửa sổ/đèn/sao lơ lửng
  if(nk > .02){ g.setTransform(V50W.dpr, 0, 0, V50W.dpr, 0, 0); g.fillStyle = `rgba(10,14,44,${.5*nk})`; g.fillRect(0, 0, W, H); g.setTransform(V50W.dpr*z, 0, 0, V50W.dpr*z, V50W.dpr*ox, V50W.dpr*oy);
    g.globalCompositeOperation = 'lighter'; const wg = v50Glow('#ffb347'); let cnt = 0;
    for(let i = 0; i < V50W.win.length && cnt < 90; i++){ const w = V50W.win[i]; if(w[0] < X0 - 60 || w[0] > X1 + 60) continue; cnt++; const f = .75 + .25*Math.sin(t*3 + i*1.7); g.globalAlpha = nk*.42*f; const r = w[2]*1.25; g.drawImage(wg, w[0] - r, w[1] - r, r*2, r*2); }
    V50W.lan.forEach(l => { const a = Math.max(nk*.6, l.lit); if(a <= 0) return; g.globalAlpha = a*.7; g.drawImage(wg, l.x - 50, l.y - 86, 100, 100); });
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  else V50W.lan.forEach(l => { if(l.lit <= 0) return; g.globalCompositeOperation = 'lighter'; g.globalAlpha = l.lit*.6; g.drawImage(v50Glow('#ffb347'), l.x - 30, l.y - 66, 60, 60); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; });
  // đom đóm ánh sáng quanh sân (đêm) / bụi phép (ngày)
  if(Math.random() < (nk > .5 ? .5 : .15)*V50.q){ const x = X0 + Math.random()*(X1 - X0), y = Math.max(470, Y0) + Math.random()*(Math.min(1000, Y1) - Math.max(470, Y0)); v50P(x, y, (Math.random() - .5)*10, -8 - Math.random()*10, 2.5, 5, v50Glow(nk > .5 ? '#c8ff7a' : '#fff3b0'), 0); }
  // phép + hạt (cỡ bù theo zoom để luôn rõ trên điện thoại)
  V50FX.k = Math.max(1, 1/z); v50BDraw(g, dt); v50PDraw(g, dt); V50FX.k = 1;
  // sương mù trôi chậm (ven hồ, chân lâu đài, chân núi)
  const fg = v50FogImg(), fa = nk > .5 ? .22 : .16 + v50Dusk()*.1; g.globalAlpha = fa; for(let i = 0; i < 7; i++){ const fx = ((i*360 + t*(6 + i*1.5)) % 2200) - 400, fy = [300, 420, 520, 380, 600, 470, 340][i]; g.drawImage(fg, fx, fy, 420, 120); } g.globalAlpha = 1;
  // tuyết / mưa (màn hình)
  g.setTransform(V50W.dpr, 0, 0, V50W.dpr, 0, 0); v50Weather(g, W, H, dt, t); v50Flash(g, W, H, dt);
  // nhãn khu: chữ 16px (màn hình)
  g.font = V50_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  V50_SPOTS.forEach(s => { const sx = (s.x - cam.x)*z + W/2, sy = (s.y - cam.y)*z + H/2 - 46*z - 8 + (s.dy || 0); if(sx < -80 || sx > W + 80 || sy < -20 || sy > H + 20) return; const near = V50W.near === s, txt = s.ic + ' ' + s.vi, w = g.measureText(txt).width + 18;
    if(!near && Math.hypot(s.x - V50W.me.x, s.y - V50W.me.y) > 420) return; g.globalAlpha = near ? 1 : .82; g.fillStyle = near ? 'rgba(255,210,63,.95)' : 'rgba(11,16,32,.72)'; v50RR(g, sx - w/2, sy - 14, w, 28, 14); g.fill(); g.fillStyle = near ? '#1a1430' : '#f7f5ef'; g.fillText(txt, sx, sy + 1); }); g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  // gợi ý thao tác lúc đầu
  if(V50W.hint > 0){ V50W.hint -= dt; const a = Math.min(1, V50W.hint); g.globalAlpha = a; const txt = '👆 Kéo để đi · Chạm để phóng phép', w = g.measureText(txt).width + 28; g.fillStyle = 'rgba(11,16,32,.8)'; v50RR(g, W/2 - w/2, H*.66 - 18, w, 36, 18); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(txt, W/2, H*.66 + 6); g.textAlign = 'left';
    const hx = W/2 + Math.sin(t*3)*40; g.font = '28px sans-serif'; g.fillText('👆', hx - 14, H*.66 + 52); g.font = V50_FONT; g.globalAlpha = 1; }
  // joystick
  const j = V50W.joy; if(j && j.on){ g.globalAlpha = .55; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(j.x0, j.y0, 46, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(j.x0 + j.vx*40, j.y0 + j.vy*40, 20, 0, 7); g.fill(); g.globalAlpha = 1; }
}
function v50RR(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function v50Dummy(g, d, t){ g.save(); g.translate(d.x, d.y); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-9, -2, 18, 4); g.rotate(Math.sin(t*22)*d.wob*.35); const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
  R('#6b4a2a', -1.5, -30, 3, 30); R('#d8b86a', -7, -26, 14, 14); R('#b8964a', -7, -26, 14, 2); R('#b8964a', -7, -18, 14, 2); R('#6b4a2a', -10, -24, 20, 2); g.fillStyle = '#e8cf8a'; g.beginPath(); g.arc(0, -32, 6, 0, 7); g.fill();
  g.strokeStyle = '#ef4b4b'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -19, 4, 0, 7); g.stroke(); g.fillStyle = '#ef4b4b'; g.fillRect(-1, -20, 2, 2); g.restore(); }
function v50Critter(g, c, t, nk){ const b = Math.abs(Math.sin(c.ph*4))*3; g.save(); g.translate(c.x, c.y); if(c.vx < 0) g.scale(-1, 1); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-6, -1, 12, 3);
  if(c.k % 2 === 0){ g.fillStyle = '#f4f4ff'; g.beginPath(); g.arc(-3, -7 - b, 5, 0, 7); g.arc(3, -8 - b, 6, 0, 7); g.arc(0, -11 - b, 5, 0, 7); g.fill(); g.fillStyle = '#2a2438'; g.fillRect(2, -10 - b, 1.5, 1.5); g.fillRect(5, -10 - b, 1.5, 1.5); g.fillStyle = '#ff9ac0'; g.fillRect(1, -7 - b, 2, 1); }
  else { g.fillStyle = '#6aa84f'; g.beginPath(); g.ellipse(0, -5 - b*.3, 7, 4.5, 0, Math.PI, 0); g.fill(); g.fillStyle = '#4a8a3a'; g.fillRect(-3, -8 - b*.3, 2, 2); g.fillRect(1, -7 - b*.3, 2, 2); g.fillStyle = '#c8b07a'; g.fillRect(6, -5, 4, 3); g.fillStyle = '#222'; g.fillRect(8, -5, 1, 1); }
  if(nk > .5){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = .4; g.drawImage(v50Glow('#c8ffda'), -10, -20, 20, 20); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } g.restore(); }
// ---------- tuyết / mưa / lá thu: pool màn hình ----------
function v50Weather(g, W, H, dt, t){
  const s = v50Season(), wet = typeof weather !== 'undefined' && /mua|bao/.test(weather); let kind = wet ? 'rain' : s === 'dong' ? 'snow' : s === 'thu' ? 'leaf' : s === 'xuan' ? 'petal' : null; if(!kind) return;
  const N = Math.round((kind === 'rain' ? 70 : kind === 'snow' ? 60 : 16)*V50.q); if(!V50W.snow) V50W.snow = Array.from({length:80}, () => ({x:Math.random(), y:Math.random(), v:.5 + Math.random()*.5}));
  g.fillStyle = kind === 'rain' ? 'rgba(200,220,255,.55)' : kind === 'snow' ? 'rgba(255,255,255,.9)' : kind === 'leaf' ? '#e0782a' : '#ffb3d1';
  for(let i = 0; i < N; i++){ const p = V50W.snow[i]; p.y += dt*p.v*(kind === 'rain' ? 1.4 : kind === 'snow' ? .12 : .1); if(p.y > 1){ p.y = 0; p.x = Math.random(); }
    const x = (p.x + (kind === 'rain' ? p.y*.1 : Math.sin(t*.8 + i)*.01))*W, y = p.y*H; if(kind === 'rain') g.fillRect(x, y, 1.5, 12); else if(kind === 'snow') g.fillRect(x, y, 2.5, 2.5); else g.fillRect(x, y, 4, 2.5); }
}
// ---------- Đại sảnh bên trong: nến lơ lửng, trần sao, bàn 6 nhà ----------
function v50HallGeo(W, H){ const wallTop = H*.32, fy = H*(1 - 1/Math.pow(V50_PHI, 3)), ww = Math.max(18, W/Math.pow(V50_PHI, 5)), winH = Math.min(ww*2.26, (fy - wallTop)*.36), by = wallTop + 12 + winH + 16, bw = Math.min(56, W/9), bh = Math.max(30, Math.min(bw*V50_PHI, fy - by - 8)); return {ceil:wallTop/1.3, wallTop, fy, ww, winH, by, bw, bh}; }
function v50HallBg(W, H, nk){
  const key = W + 'x' + H + (nk > .5); if(V50W.hall && V50W.hKey === key) return V50W.hall; const c = V50W.hall || document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const Hg = v50HallGeo(W, H), ceil = Hg.ceil; const gr = g.createLinearGradient(0, 0, 0, ceil*1.3); gr.addColorStop(0, nk > .5 ? '#0a1030' : '#3a6ab8'); gr.addColorStop(1, nk > .5 ? '#2a2858' : '#9cc8f0'); g.fillStyle = gr; g.fillRect(0, 0, W, ceil*1.3);
  if(nk <= .5){ const cl = v50CloudImg(); g.globalAlpha = .7; for(let i = 0; i < 5; i++) g.drawImage(cl, (i*W/4.5) % W, 10 + (i % 2)*30, 110, 40); g.globalAlpha = 1; }
  // vách đá 2 bên + cửa sổ vòm cao (rộng W/φ⁵)
  g.fillStyle = '#5a5468'; g.fillRect(0, ceil*1.3, W, H - ceil*1.3); g.fillStyle = 'rgba(0,0,0,.15)'; for(let y = ceil*1.3; y < H; y += 14) g.fillRect(0, y, W, 1.5);
  const ww = Hg.ww, wh = Hg.winH; for(let k = 0; k < 6; k++){ const x = (k + .5)*W/6 - ww/2, y = ceil*1.3 + 12; g.fillStyle = '#3a3448'; g.fillRect(x - 3, y - 3, ww + 6, wh + 6); g.fillStyle = nk > .5 ? '#2a3a78' : '#bfe0ff'; g.fillRect(x, y, ww, wh); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + ww/2 - 1, y, 2, wh); }
  // cờ treo 6 nhà
  V50_HOUSES.forEach((h, i) => { const x = (i + .5)*W/6, y = Hg.by, bw = Hg.bw, bh = Hg.bh; g.fillStyle = h.c; g.beginPath(); g.moveTo(x - bw/2, y); g.lineTo(x + bw/2, y); g.lineTo(x + bw/2, y + bh); g.lineTo(x, y + bh - bw*.3); g.lineTo(x - bw/2, y + bh); g.closePath(); g.fill();
    const cr = v50Crest(i, Math.round(Math.min(bw*.62, bh*.5))); g.drawImage(cr, x - cr.width/2, y + bh*.18); });
  // sàn + 3 bàn dài (mỗi bàn 2 nhà)
  const fy = Hg.fy; g.fillStyle = '#6b5440'; g.fillRect(0, fy, W, H - fy); g.fillStyle = 'rgba(0,0,0,.12)'; for(let x = 0; x < W; x += 40) g.fillRect(x, fy, 2, H - fy);
  for(let k = 0; k < 3; k++){ const x = (k + .5)*W/3, tw = W/3*.72; g.fillStyle = '#8a5a32'; g.fillRect(x - tw/2, fy + 18, tw, 18); g.fillStyle = '#a86e40'; g.fillRect(x - tw/2, fy + 14, tw, 6); g.fillStyle = '#e8c27a'; for(let p = 0; p < 6; p++) g.fillRect(x - tw/2 + 10 + p*(tw - 20)/5, fy + 10, 8, 4); }
  V50W.hall = c; V50W.hKey = key; return c;
}
function v50HallDraw(dt){
  const g = V50W.g, W = V50W.W, H = V50W.H, nk = v50Night(), t = performance.now()/1000; g.setTransform(V50W.dpr, 0, 0, V50W.dpr, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(v50HallBg(W, H, nk), 0, 0);
  const ceil = v50HallGeo(W, H).ceil; if(nk > .5){ g.fillStyle = '#fff'; for(let i = 0; i < 60; i++){ g.globalAlpha = .4 + .6*Math.abs(Math.sin(t*1.5 + i)); g.fillRect((i*97.3) % W, (i*53.7) % (ceil*1.2), 2, 2); } g.globalAlpha = 1; }
  // khối Rubik lơ lửng giữa sảnh, xoay màu chậm
  const cx = W/2, cy = ceil*1.15 + Math.sin(t*1.2)*8, s = Math.min(W, H)/14; const face = (pts, k) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = k; g.fill(); g.strokeStyle = '#141428'; g.lineWidth = 2; g.stroke(); };
  // khối lập phương đẳng cự: 3 mặt × 9 ô (trên / phải / trái), màu xoay chậm
  const sh = Math.floor(t*.7), P = (u, v, w) => [cx + (u - v)*s*.866, cy + (u + v - 1)*s*.5 - (w - .5)*s];
  for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++){ const a = i/3, b2 = (i + 1)/3, c = j/3, d = (j + 1)/3;
    face([P(a, c, 1), P(b2, c, 1), P(b2, d, 1), P(a, d, 1)], V50_RUBIK[(i + j + sh) % 6]);
    face([P(1, a, 1 - c), P(1, b2, 1 - c), P(1, b2, 1 - d), P(1, a, 1 - d)], V50_RUBIK[(i*2 + j + sh + 2) % 6]);
    face([P(a, 1, 1 - c), P(b2, 1, 1 - c), P(b2, 1, 1 - d), P(a, 1, 1 - d)], V50_RUBIK[(i + j*2 + sh + 4) % 6]); }
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35; g.drawImage(v50Glow('#ffe9a8'), cx - s*2.4, cy - s*2.4, s*4.8, s*4.8); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // nến lơ lửng
  const wg = v50Glow('#ffb347'); V50W.candles.forEach((c, i) => { const x = c.u*W, y = ceil*.35 + c.v*H*.5 + Math.sin(t*1.1 + c.ph)*6, h = 10*c.h + 6; g.fillStyle = '#f4ecd8'; g.fillRect(x - 2.5, y, 5, h); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 1, y, 1.5, h);
    const f = .8 + .2*Math.sin(t*12 + c.ph*3); g.fillStyle = '#ffd27a'; g.fillRect(x - 1.5, y - 5*f, 3, 5*f); g.fillStyle = '#fff'; g.fillRect(x - .5, y - 3*f, 1, 2);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55*f; g.drawImage(wg, x - 16, y - 20, 32, 32); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; });
  // học sinh ngồi bàn (sau bàn)
  const fy = v50HallGeo(W, H).fy; for(let k = 0; k < 3; k++){ const x = (k + .5)*W/3, tw = W/3*.72; for(let p = 0; p < 5; p++){ const a = V50W.npc[(k*5 + p) % V50W.npc.length]; if(!a) continue; g.save(); g.translate(x - tw/2 + 16 + p*(tw - 32)/4, fy + 16); g.scale(1.4, 1.4); g.beginPath(); g.rect(-12, -40, 24, 31); g.clip(); v50Person(g, 0, 0, {moving:false, walk:0, dir:1, skin:a.skin, hair:a.hair, long:a.long, shirt:'#f4f4f4', robe:V50_HOUSES[(k*2 + (p % 2)) % 6].c2, sty:0, hc:V50_HOUSES[(k*2 + (p % 2)) % 6].c}, t); g.restore(); } }
  v50PDraw(g, dt); if(Math.random() < .2*V50.q) v50P(Math.random()*W, ceil + Math.random()*H*.4, 0, -10, 2, 4, v50Glow('#fff3b0'), 0);
  g.font = V50_FONT; g.textAlign = 'center'; g.fillStyle = 'rgba(11,16,32,.75)'; const txt = '🕯️ Đại Sảnh · Chạm biểu ngữ để chọn nhà', w = g.measureText(txt).width + 28; v50RR(g, W/2 - w/2, H - 52, w, 36, 18); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, W/2, H - 28); g.textAlign = 'left';
  v50Flash(g, W, H, dt);
}
