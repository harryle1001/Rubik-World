// ================= WORLD =================
const W = 10400, H = 8200, Y0 = -7880, SY0 = -1400, NY = -560, RATE = 1.5; // game minutes per real second at 1x
const GATE = [26, 400], BOOTH = [70, 452];
const R = {
  rubik:     {name:'Lớp Rubik',          x:60,  y:60,  w:320, h:240, walls:true, din:[220,280], dout:[220,332], dw:[220,300], side:'b'},
  chess:     {name:'Khu cờ vua',         x:420, y:60,  w:290, h:240, walls:true, din:[565,282], dout:[565,332], dw:[565,300], side:'b'},
  music:     {name:'Khu âm nhạc',        x:750, y:60,  w:360, h:240, walls:true, din:[930,282], dout:[930,332], dw:[930,300], side:'b'},
  hall:      {name:'Hội trường lớn',     x:1190,y:60,  w:370, h:600, walls:true, din:[1216,400],dout:[1160,400],dw:[1190,400],side:'l'},
  rubikyard: {name:'Khu chơi Rubik',     x:60,  y:480, w:320, h:220, walls:true, fence:true, din:[220,502], dout:[220,450], dw:[220,480], side:'t'},
  office:    {name:'Văn phòng',          x:420, y:480, w:290, h:220, walls:true, din:[565,504], dout:[565,450], dw:[565,480], side:'t'},
  attend:    {name:'Khu điểm danh',      x:760, y:470, w:380, h:170, din:[950,490], dout:[950,450]},
  elec:      {name:'Lớp lắp ráp điện',   x:1680,y:60,  w:340, h:240, walls:true, din:[1850,282],dout:[1850,334],dw:[1850,300],side:'b'},
  field:     {name:'Sân bóng đá',        x:1680,y:380, w:480, h:270, open:true, look:[1700,640]},
  giantchess:{name:'Quảng trường cờ vua khổng lồ', x:60, y:-530, w:560, h:500, open:true},
  rubikpark: {name:'Tượng đài Rubik',     x:640, y:-530, w:360, h:500, open:true},
  pond:      {name:'Hồ câu thư giãn',     x:1020,y:-530, w:560, h:500, open:true},
  flowerfield:{name:'Cánh đồng hoa',      x:1580,y:-560, w:1056,h:590, open:true},
  bpad:      {name:'Khu khinh khí cầu',   x:2660,y:-540, w:640, h:160, open:true},
  skate:     {name:'Sân trượt ván',       x:2660,y:-360, w:200, h:300, open:true},
  patin:     {name:'Sân trượt patin',     x:2880,y:-360, w:200, h:300, open:true},
  basket:    {name:'Sân bóng rổ',         x:3100,y:-360, w:200, h:300, open:true},
  ski:       {name:'Sân trượt tuyết',     x:3320,y:-540, w:500, h:500, open:true},
  art:       {name:'Góc họa sĩ',          x:4010,y:-420, w:270, h:360, open:true},
  farm:      {name:'Nông trại',           x:4300,y:-540, w:870, h:500, open:true},
  hills:     {name:'Đồi thông & thác nước', x:2636,y:-560, w:2564,h:596, open:true},
  north:     {name:'Công viên trí tuệ'},
  garden:    {name:'Vườn hoa Đà Lạt',    x:2740,y:96,  w:450, h:250, open:true},
  picnic:    {name:'Khu picnic',          x:3220,y:380, w:270, h:170, open:true},
  lotus:     {name:'Đầm sen',             x:4360,y:200, w:360, h:250, open:true},
  lake:      {name:'Hồ cá Koi & khu cắm trại', x:3520,y:96, w:820, h:470, open:true},
  forest:    {name:'Khu rừng thông',      x:2636,y:36,  w:2564,h:552, open:true},
  dalat:     {name:'Phố nhà Đà Lạt',      x:2636,y:588, w:2564,h:96,  open:true},
  beach:     {name:'Bãi biển',           x:0,   y:790, w:W,   h:H-790, din:[735,815], dout:[735,450]},
  road:      {name:'Đường về nhà'},
  yard:      {name:'Sân trường'}
};
const ROOM_ORDER = ['giantchess','rubikpark','pond','flowerfield','bpad','skate','patin','basket','ski','art','farm','hills','rubik','chess','music','hall','rubikyard','office','attend','elec','field','garden','picnic','lotus','lake','forest','dalat'];
const inside = (r,x,y) => x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h;
function regionAt(x,y){ for(const id of ROOM_ORDER) if(inside(R[id],x,y)) return id; if(y < 0) return 'north'; if(y >= 786) return 'beach'; if(x >= 1572) return 'road'; return 'yard'; }
const side = x => x >= 1572 ? 'E' : 'W';
const resZ = (x,y) => x > 2190 && x < 2636 && y < 690;
const forZ = (x,y) => x >= 2636 && y < 690;
const FOREST_GATES = [2790, 3420, 4060, 4760];
const gateNear = x => FOREST_GATES.reduce((b,g) => Math.abs(g-x) < Math.abs(b-x) ? g : b);
const onPier = (x,y) => x > 1294 && x < 1346 && y > 818 && y < 978;
function indoor(a){ const r = R[regionAt(a.x,a.y)]; return !!(r && r.walls && !r.fence); }

const SEAT_RUBIK = i => [130+(i%3)*90, 208+Math.floor(i/3)*68];
const SEAT_ELEC  = j => [1730+(j%4)*82, 196+Math.floor(j/4)*76];
const SEAT_HALL  = i => [1262+(i%4)*84, 296+Math.floor(i/4)*68];
const PAD        = i => i < 7 ? [790+i*52, 540] : [816+(i-7)*52, 600];
const PAD_FRONT  = i => i < 7 ? [790+i*52, 512] : [816+(i-7)*52, 572];
const CHAOCO     = i => [770+(i%7)*36, i < 7 ? 352 : 388];
const QUAKE      = k => [1750+(k%7)*62, 440+Math.floor(k/7)*62];
const MIC_SPOT = [950,500], LAI_PICK = [1062,500];
const RY_SPOTS = [[110,560],[170,560],[275,560],[330,560],[120,664],[320,664]];
const CHESS_T = [[475,128],[565,128],[655,128],[520,214],[610,214]];
const MUSIC_SPOTS = {piano:[828,172], guitar:[915,205], guitar2:[985,205], singer:[1062,176], singer2:[1015,240]};
const LAMPS = [[150,420],[450,420],[1050,420],[735,700],[300,770],[1180,770],[1660,700],[2180,700],[1660,360]];
const TREES = [[95,745],[300,752],[470,748],[640,742],[860,700],[1000,745],[1100,690],[1250,705],[1380,745],[1520,705],[960,770],[150,760],[2060,140],[2120,250],[1700,760],[1900,770],[2100,760],[2350,770],[2600,764]];
const FLAG = [690,430];
const PIER_END = [1320,955], SUB_DOCK = [1320,994], SUB_C = [1690,1150], SUB_R = [370,110];
const LIGHTHOUSE = [2470,905];
// every student's house has its own architecture; houses in one row share a bottom edge so the lane in front stays clear
const HOUSES = [
  {x:2252,y:48, w:150,h:98, k:'bietthu',    name:'Biệt thự cổ điển'},
  {x:2414,y:74, w:44, h:72, k:'nhaong',     name:'Nhà ống phố'},
  {x:2470,y:72, w:70, h:74, k:'nhago',      name:'Nhà gỗ'},
  {x:2552,y:66, w:72, h:80, k:'nhatron',    name:'Nhà tròn mái nấm'},
  {x:2252,y:178,w:206,h:118,k:'resort',     name:'Resort hồ bơi'},
  {x:2470,y:212,w:74, h:84, k:'nhat',       name:'Nhà kiểu Nhật'},
  {x:2556,y:196,w:70, h:100,k:'laudai',     name:'Lâu đài mini'},
  {x:2252,y:338,w:82, h:92, k:'nhasan',     name:'Nhà sàn'},
  {x:2346,y:356,w:72, h:74, k:'nhakinh',    name:'Nhà kính hiện đại'},
  {x:2430,y:334,w:92, h:96, k:'diatrunghai',name:'Nhà Địa Trung Hải'},
  {x:2534,y:350,w:92, h:80, k:'thai',       name:'Nhà mái Thái'},
  {x:2252,y:546,w:90, h:64, k:'container',  name:'Nhà container'},
  {x:2356,y:478,w:190,h:132,k:'villa',      name:'Villa hiện đại'}
];
const HOUSE = i => { const h = HOUSES[i]; return Object.assign({door:[h.x + h.w/2, h.y + h.h + 6]}, h); };
const LAKE = {cx:3930, cy:330, rx:300, ry:150}, LOTUS = {cx:4540, cy:325, rx:150, ry:100}, TRAIL = {x0:2700, x1:5150, y0:70, y1:566};
const GBOARD = {x:200, y:-470, s:48}, POND = {cx:1300, cy:-290, rx:210, ry:120}, RMON = {x:820, y:-300};
const FOREST_TREES = [], TENTS = [], DALAT = [];
(() => {
  let s = 42; const r = () => (s = (s*16807) % 2147483647) / 2147483647;
  const inEll = (x,y,e,m) => ((x-e.cx)/(e.rx+m))**2 + ((y-e.cy)/(e.ry+m))**2 < 1;
  let tries = 0;
  while(FOREST_TREES.length < 260 && tries++ < 8000){
    const x = 2652 + r()*2536, y = 60 + r()*512;
    if(inside(R.garden, x, y) || inside(R.garden, x, y-60) || inside(R.picnic, x, y) || inEll(x, y, LAKE, 90) || inEll(x, y, LOTUS, 50)) continue;
    if(Math.abs(y - TRAIL.y0) < 24 || Math.abs(y - TRAIL.y1) < 24 || Math.abs(x - TRAIL.x0) < 24 || Math.abs(x - TRAIL.x1) < 24) continue;
    if(FOREST_TREES.some(t => Math.abs(t[0]-x) < 26 && Math.abs(t[1]-y) < 22)) continue;
    FOREST_TREES.push([x, y, r() < .62 ? 'pine' : 'leaf']);
  }
  for(let i=0;i<10;i++){ const a = i/10*Math.PI*2 + .2; TENTS.push([LAKE.cx + Math.cos(a)*(LAKE.rx+46), LAKE.cy + Math.sin(a)*(LAKE.ry+40), ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#b06bff'][i%6]]); }
  const pal = ['#f7d774','#a8e6cf','#ffd3e0','#cdb4f7','#ffe5b4','#b5e2fa','#f9c0a0','#d0f0c0'], roofs = ['#8e3b2f','#3f5f8a','#4a6b3a','#6b3a5a','#2f4f4f','#9c4a1a'];
  const signs = ['Homestay','Cà phê','','Tiệm hoa','','Tiệm bánh','','Nhà nghỉ',''];
  let x = 2652, i = 0;
  while(x < 5120){
    const w = 84 + (i*37)%48, h = 62 + (i*23)%24;
    const g = FOREST_GATES.find(gg => x < gg + 26 && x + w > gg - 26);
    if(g){ x = g + 28; continue; }
    DALAT.push({x, y:684 - h - 4, w, h, wall:pal[i%pal.length], roof:roofs[(i*3)%roofs.length], style:i%4, sign:signs[i%signs.length], chim:i%3 === 0, idx:i});
    x += w + 24 + (i*13)%26; i++;
  }
})();

