// ================= STATE =================
let day = 0, clock = 432, paused = false, speed = 1, SCHED = [];
let season = 'thu', weather = 'nang', autoWeather = true, autoSeason = false, weatherUntil = 600;
let selected = null, followCam = false, lastBrainMin = -1, flash = 0, fade = 0, shake = 0, quakeT = 2;
let tornado = null, logs = [], reports = [], history = [], dayStats = null, logDirty = true, attDirty = true, repDirty = true;
const WORLD_FLAGS = [['vn','Việt Nam'],['jp','Nhật Bản'],['us','Hoa Kỳ'],['fr','Pháp'],['gb','Anh'],['kr','Hàn Quốc'],['de','Đức'],['in','Ấn Độ'],['au','Úc'],['br','Brazil'],['ca','Canada'],['it','Ý'],['th','Thái Lan'],['id','Indonesia'],['es','Tây Ban Nha'],['nl','Hà Lan'],['se','Thụy Điển'],['mx','Mexico'],['ar','Argentina']];
let ships = [
  {k:'sail',x:300,y:990,v:14,dir:1}, {k:'sail',x:3300,y:1010,v:12,dir:-1}, {k:'sail',x:4600,y:1120,v:10,dir:1},
  ...[0,1,2,3,4,5,6,7].map(i => ({k:'fish', x:400 + i*620, y:1080 + (i%3)*70, v:8 + (i%3)*2, dir: i%2 ? 1 : -1})),
  ...[0,1,2,3,4,5].map(i => ({k:'thung', x:900 + i*640, y:968 + (i%2)*34, v:3, dir: i%2 ? 1 : -1})),
  ...[0,1,2,3,4].map(i => ({k:'speed', x:600 + i*1000, y:1040 + i*44, v:70 + i*10, dir: i%2 ? 1 : -1, c:['#ef4b4b','#f4f4f4','#ffd23f','#3d7bff','#ff8a2b'][i]})),
  ...[0,1,2,3].map(i => ({k:'parasail', x:1500 + i*1100, y:1150 + i*26, v:40, dir: i%2 ? -1 : 1, c:['#ff6f91','#ffd23f','#26c6da','#b06bff'][i]})),
  ...WORLD_FLAGS.slice(0,10).map(([f,n],i) => ({k:'navy', x:300 + i*500, y:1420 + (i%3)*95, v:9 + (i%3)*3, dir: i%2 ? 1 : -1, flag:f, nation:n})),
  {k:'pirate2', x:2600, y:1640, v:16, dir:1}, {k:'pirate2', x:4400, y:1720, v:13, dir:-1},
  {k:'cargo', x:600, y:1320, v:6, dir:1}, {k:'cargo', x:3800, y:1370, v:5, dir:-1},
  ...[0,1,2,3].map(i => ({k:'tour', x:700 + i*1150, y:1180 + (i%2)*70, v:18, dir: i%2 ? -1 : 1})), {k:'pirate2', x:1200, y:1560, v:15, dir:-1}, {k:'pirate2', x:3400, y:1480, v:17, dir:1},
  ...[0,1,2,3].map(i => ({k:'fish', x:700 + i*1100, y:1260 + (i%2)*60, v:9, dir: i%2 ? -1 : 1}))
];
let gulls = [{x:200,y:960,v:22},{x:900,y:1030,v:-18},{x:1700,y:950,v:15},{x:2300,y:1050,v:-20},{x:3100,y:980,v:18},{x:3900,y:1100,v:-16},{x:4700,y:990,v:20},{x:2800,y:1300,v:-14}], fish = [];
let VB = {x0:0, y0:0, x1:5200, y1:1780};
const inVB = (x, y) => x > VB.x0 && x < VB.x1 && y > VB.y0 && y < VB.y1;
let parts = [], bolts = [], cracks = [], musicOn = false, concert = null, festival = null, fight = null, pirate = null, weekViol = 0;
let tPrev = performance.now(), realT = 0, lastFlash = -9, lhAng = 0, flagRaise = 1, tsu = null;
const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
const SONG = 'Con đường bình phàm';
const sub = {x:SUB_DOCK[0], y:SUB_DOCK[1], state:'dock', t:0, ang:Math.PI, pass:[], depth:0, dir:1, doneToday:false};
const truck = {state:'off', x:2680, y:708, path:[], cargo:'', until:0, vert:false, dir:-1, boxes:0};
const ball = {x:1920, y:515, vx:0, vy:0, last:null};
let score = {L:0, R:0};

const SEASONS = {
  xuan:{name:'Xuân', grass:'#71c45a', grass2:'#66b74f', leaf:'#4cae49', leaf2:'#ff9ccf', sand:'#f6f0dc', sea:'#2f93d2', sea2:'#1d5f99', tint:'rgba(255,200,230,0.05)', pitch:'#5fb84a', pitch2:'#56ad42'},
  ha:  {name:'Hạ',   grass:'#5cb544', grass2:'#52a83b', leaf:'#2d8b35', leaf2:'#3fa043', sand:'#faf5e6', sea:'#1fa8dc', sea2:'#126aa6', tint:'rgba(255,220,120,0.07)', pitch:'#4fae3d', pitch2:'#46a236'},
  thu: {name:'Thu',  grass:'#a9a84c', grass2:'#9c9a44', leaf:'#e0832d', leaf2:'#c9502a', sand:'#f1e9d4', sea:'#2f80b0', sea2:'#1d5480', tint:'rgba(255,170,80,0.06)', pitch:'#7fa646', pitch2:'#769c3f'},
  dong:{name:'Đông', grass:'#cdd9df', grass2:'#c0ccd3', leaf:null, leaf2:null,          sand:'#eceae2', sea:'#34637f', sea2:'#203f55', tint:'rgba(150,190,255,0.08)', pitch:'#a9c2ad', pitch2:'#a0b9a4'}
};
const WEATHERS = {
  nang:   {name:'Nắng',     wind:.15, dark:0},
  mua:    {name:'Mưa',      wind:.35, dark:.2},
  gio:    {name:'Gió',      wind:1.1, dark:.06},
  bao:    {name:'Bão',      wind:1.7, dark:.38},
  sieubao:{name:'Siêu bão', wind:2.6, dark:.52},
  loc:    {name:'Lốc xoáy', wind:1.35,dark:.3},
  samset: {name:'Sấm sét',  wind:.6,  dark:.36},
  muada:  {name:'Mưa đá',   wind:.7,  dark:.3},
  suongmu:{name:'Sương mù', wind:.05, dark:.1},
  dongdat:{name:'Động đất', wind:.1,  dark:.05},
  nangnong:{name:'Nắng nóng', wind:.08, dark:0},
  muaphun:{name:'Mưa phùn',   wind:.2,  dark:.12},
  cauvong:{name:'Cầu vồng',   wind:.15, dark:0},
  tuyet:  {name:'Tuyết rơi',  wind:.3,  dark:.15},
  baotuyet:{name:'Bão tuyết', wind:1.9, dark:.45},
  songthan:{name:'Sóng thần', wind:.8,  dark:.25},
  nhatthuc:{name:'Nhật thực', wind:.05, dark:.68},
  saobang:{name:'Mưa sao băng', wind:.05, dark:.45}
};
const W_WEIGHTS = {
  xuan:{nang:.34, mua:.18, muaphun:.12, cauvong:.06, gio:.1, suongmu:.08, samset:.04, muada:.03, dongdat:.01, saobang:.02, nhatthuc:.01, songthan:.01},
  ha:  {nang:.28, nangnong:.12, mua:.13, cauvong:.05, bao:.1, sieubao:.04, loc:.05, samset:.08, gio:.07, dongdat:.02, saobang:.03, songthan:.02, nhatthuc:.01},
  thu: {nang:.32, gio:.2, mua:.13, muaphun:.06, cauvong:.04, bao:.08, sieubao:.03, samset:.04, suongmu:.04, dongdat:.02, saobang:.02, songthan:.01},
  dong:{nang:.2, gio:.18, muaphun:.1, tuyet:.16, baotuyet:.07, suongmu:.12, mua:.06, muada:.05, bao:.03, dongdat:.01, saobang:.01, nhatthuc:.01}
};
const FEST_KIND = {xuan:'lan', ha:'thamlop', thu:'bongda', dong:'noel'};
const FEST_NAME = {lan:'Lễ hội múa lân', thamlop:'Ngày thăm lớp mùa hè', bongda:'Giải bóng đá mùa thu', noel:'Lễ hội Giáng sinh', picnic:'Dã ngoại picnic trong rừng'};
const FEST_CARGO = {lan:'đầu lân, trống và pháo giấy cho lễ hội múa lân', noel:'cây thông, đèn nháy và quà Giáng sinh', bongda:'bóng, áo đấu và cúp vô địch', thamlop:'hoa và bánh kẹo đón các bạn thăm lớp', picnic:'bánh trái, nước uống và lều trại cho buổi dã ngoại'};
const DAILY_CARGO = ['sữa và bánh mì cho bữa trưa','giấy, bút và Rubik mới','linh kiện điện: đèn LED, pin, dây điện','nước uống và trái cây','sách mới cho thư viện'];
const DOWN = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const dow = () => (day - 1 + 700) % 7;

// ================= AGENTS =================
const STAFF_DEF = [
  {id:'ha',     name:'Cô Hà',    role:'Giáo viên dạy Rubik', shirt:'#8e5bd6', pants:'#4b2f80', hair:'#2a1a12', long:true, skirt:true, icon:'cube', log:'ha'},
  {id:'xuan',   name:'Cô Xuân',  role:'Giáo viên dạy lắp ráp điện', shirt:'#1f9e8a', pants:'#1f9e8a', hair:'#22140c', long:true, skirt:true, aodai:true, icon:'bolt', log:'ha'},
  {id:'nam',    name:'Nam',      role:'Bảo vệ, canh từng lớp học', shirt:'#2d4a8a', pants:'#1d2c52', hair:'#1b1b1b', cap:'#16213f', icon:'whistle', log:'nam'},
  {id:'mic',    name:'Mic',      role:'Điểm danh, canh người đi thiếu và nghỉ học', shirt:'#2fa36b', pants:'#3b3b4f', hair:'#5a3a1a', cap:'#ffd23f', icon:'clip', log:'mic', speed:95},
  {id:'ngoc',   name:'Cô Ngọc',  role:'Ban giám hiệu, đi dự giờ từng lớp', shirt:'#d23b3b', pants:'#d23b3b', hair:'#1a1010', long:true, skirt:true, aodai:true, icon:'eye', log:'ngoc'},
  {id:'lai',    name:'Cô Lai',   role:'Văn thư, ghi giấy tờ và viết báo cáo', shirt:'#efe4cc', pants:'#5a6a8a', hair:'#3a2418', long:true, glasses:true, icon:'paper', log:'lai'},
  {id:'haquan', name:'Hà Quân',  role:'Quay video theo dõi cả trường và đường về nhà', shirt:'#ff8a2b', pants:'#33334a', hair:'#1a1a1a', cap:'#222222', icon:'camcorder', log:'cam', speed:72},
  {id:'hung',   name:'Chú Hưng', role:'Lái tàu ngầm, hướng dẫn an toàn trên biển', shirt:'#f4f4f4', pants:'#1d2c52', hair:'#3a3a3a', cap:'#f4f4f4', brim:'#1d2c52', icon:'anchor', log:'sea'}
];
const STU_DEF = [
  {id:'khang', name:'Khang',      bag:'#ef4b4b', hair:'#1c140f', bike:true, fan:true},
  {id:'minh',  name:'Minh',       bag:'#3d7bff', hair:'#2b1d14'},
  {id:'quan',  name:'Quân',       bag:'#2fbf71', hair:'#120d0a', bike:true, fan:true},
  {id:'triet', name:'Triết',      bag:'#ff8a2b', hair:'#3a2618', bike:true, saoDo:true},
  {id:'thinh', name:'Thịnh',      bag:'#ffd23f', hair:'#1a1a1a'},
  {id:'bminh', name:'Bách Minh',  bag:'#b06bff', hair:'#2a1a10', bike:true},
  {id:'uyen',  name:'Mỹ Uyên',    bag:'#ff6fae', hair:'#1a0f0a', long:true, saoDo:true, leader:true},
  {id:'thien', name:'Anh Thiện',  bag:'#26c6da', hair:'#22160e', bike:true, saoDo:true},
  {id:'pbach', name:'Phạm Bách',  bag:'#8d6e63', hair:'#151515', bike:true, fan:true},
  {id:'hbach', name:'Hoàng Bách', bag:'#c0ca33', hair:'#2e1e12', bike:true, fan:true},
  {id:'nminh', name:'Nhật Minh',  bag:'#5c6bc0', hair:'#1d1d1d', fan:true},
  {id:'binh',  name:'Khải Bình',  bag:'#ff7043', hair:'#2a1a12', bike:true, fan:true, saoDo:true},
  {id:'bich',  name:'Bích',       bag:'#4db6ac', hair:'#26170e', long:true, saoDo:true}
];
const SKINS = ['#f2c9a0','#eab98c','#f5d1ad','#e5b183','#f0c497','#edbf95'];
function mkAgent(d, i, student){
  return Object.assign({
    x:GATE[0], y:GATE[1], path:[], queue:[], cur:null, planKey:null, waitUntil:0,
    speed: student ? 68 : 60, dir:1, walk:0, moving:false, visible:true,
    task:'', thought:'', hist:[], bubble:'', bubbleT:0, controlled:false, student,
    skin: SKINS[i % SKINS.length], idx:i, fallen:0, shocked:0, flying:null, lift:0, inSub:false,
    shirt: student ? '#f7f7f7' : undefined, pants: student ? '#24356b' : undefined,
    icon: student ? null : d.icon
  }, d);
}
const staff = STAFF_DEF.map((d,i) => mkAgent(d, i, false));
const students = STU_DEF.map((d,i) => mkAgent(Object.assign({role:'Học sinh', log:'event'}, d), i, true));
const agents = [...staff, ...students];
const A = Object.fromEntries(agents.map(a => [a.id, a]));
students.forEach(s => {
  s.best = 70 + Math.random()*60; s.solves = 0; s.builds = 0; s.scores = []; s.violations = 0;
  s.totals = {co:0, muon:0, vang:0, phep:0, thieu:0};
  s.home = HOUSE(s.idx); s.group = s.idx < 6 ? 'A' : 'B';
  if(s.saoDo) s.role = 'Học sinh · Sao đỏ' + (s.leader ? ' (đội trưởng)' : '');
});
const SAO = students.filter(s => s.saoDo);
A.nam.fetch = [];

// ================= HELPERS =================
const rnd = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const pad2 = n => String(n).padStart(2,'0');
const fmt = t => pad2(Math.floor(t/60)%24) + ':' + pad2(Math.floor(t)%60);
const dist = (ax,ay,bx,by) => Math.hypot(ax-bx, ay-by);
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function log(type, text, who){
  logs.unshift({day, t:fmt(clock), type, text, who: who||null});
  if(logs.length > 600) logs.length = 600;
  logDirty = true;
}
function say(a, text){ if(text){ a.bubble = text; a.bubbleT = realT + 2.8; } }
const isStorm = () => ['bao','sieubao','loc','samset','muada','baotuyet','songthan'].includes(weather);
const isWet = () => isStorm() || weather === 'mua' || weather === 'tuyet';
const isQuake = () => weather === 'dongdat';
const down = a => a.fallen > clock && !(a.downUntil != null && realT >= a.downUntil);

function buildSchedule(){
  const d = dow();
  if(d === 6) return [[0,'nghi'],[480,'cnrung'],[870,'nghi'],[900,'cnbong'],[1020,'nghi']];
  if(d === 5) return [[0,'dem'],[390,'den'],[435,'diemdanh'],[450,'sukien'],[630,'diemdanhcuoi'],[660,'ve'],[700,'dem']];
  const s = [[0,'dem'],[390,'den'],[435,'diemdanh']];
  if(d === 0) s.push([450,'chaoco'],[470,'tiet1']); else s.push([450,'tiet1']);
  s.push([540,'rachoi'],[570,'tiet2'],[660,'trua'],[780,'clb'],[870,'bien'],[960,'diemdanhcuoi'],[1005,'ve'],[1050,'dem']);
  return s;
}
function period(t){ let p = SCHED[0][1]; for(const [s,n] of SCHED) if(t >= s) p = n; return p; }
function ps(name){ const e = SCHED.find(x => x[1] === name); return e ? e[0] : -999; }
function pname(p){
  return ({dem:'Ngoài giờ học', nghi:'Chủ nhật: nghỉ học', cnrung:'Chủ nhật: dã ngoại trong rừng thông', cnbong:'Chủ nhật: các bạn đá bóng', den:'Học sinh đến trường', diemdanh:'Điểm danh buổi sáng', chaoco:'Chào cờ đầu tuần',
    tiet1:'Tiết 1: nhóm A học Rubik, nhóm B lắp ráp điện', rachoi:'Ra chơi', tiet2:'Tiết 2: nhóm A lắp ráp điện, nhóm B Rubik ở Hội trường', trua:'Ăn trưa & ngủ trưa',
    clb:'Câu lạc bộ: cờ vua, Rubik, âm nhạc, bóng đá', bien:'Giờ ra biển', sukien: FEST_NAME[FEST_KIND[season]], diemdanhcuoi:'Điểm danh cuối ngày', ve:'Tan học, về nhà'})[p] || p;
}

// ---- path planning through doors, around the hall and along the home street
function crossing(pts, from, to){
  if(side(from[0]) === side(to[0])) return;
  if(side(from[0]) === 'W'){ if(from[1] < 640) pts.push([735,452],[735,708]); pts.push([1170,708],[1600,708],[1650,708]); }
  else { pts.push([1650,708],[1600,708],[1170,708]); if(to[1] < 640) pts.push([735,708],[735,452]); }
}
// the north park is reached through a gate in the school fence between the music room and the hall
function planPath(a, rid, p){
  const nA = a.y < 24 && a.x < 2636, nP = p[1] < 24 && p[0] < 2636;
  if(nP && !nA) return planPathCore(a, 'yard', [1150, 332]).concat([[1150, 20], [1150, -40], [p[0], p[1]]]);
  if(nA && !nP) return [[1150, -40], [1150, 20], [1150, 332]].concat(planPathCore({x:1150, y:332}, rid, p));
  if(nA && nP) return [[p[0], p[1]]];
  return planPathCore(a, rid, p);
}
function planPathCore(a, rid, p){
  const cur = regionAt(a.x, a.y), pts = [];
  let from = [a.x, a.y];
  const useDoor = (id, other) => R[id] && R[id].din && !R[id].open && !(id === 'beach' && side(other[0]) === 'E' && side(from[0]) === 'E');
  if(resZ(a.x, a.y) && !resZ(p[0], p[1])){ pts.push([2220, a.y], [2220, 708]); from = [2220, 708]; }
  if(forZ(a.x, a.y) && !forZ(p[0], p[1])){ const g = gateNear(a.x); pts.push([g, Math.min(a.y, 586)], [g, 708]); from = [g, 708]; }
  if(cur !== rid){
    if(useDoor(cur, p)){ pts.push(R[cur].din, R[cur].dout); from = R[cur].dout; }
    const tDoor = R[rid] && R[rid].din && !R[rid].open && !(rid === 'beach' && side(p[0]) === 'E' && side(from[0]) === 'E');
    const to = tDoor ? R[rid].dout : p;
    crossing(pts, from, to);
    if(tDoor) pts.push(R[rid].dout, R[rid].din);
  } else crossing(pts, from, p);
  if(resZ(p[0], p[1]) && !resZ(a.x, a.y)) pts.push([2220, 708], [2220, p[1]]);
  if(forZ(p[0], p[1]) && !forZ(a.x, a.y)){ const g = gateNear(p[0]); pts.push([g, 708], [g, Math.min(p[1], 586)]); }
  pts.push(p);
  return pts.map(q => [q[0], q[1]]);
}
function setPlan(a, key, steps){
  if(a.planKey === key) return;
  a.planKey = key; a.queue = steps.slice(); a.cur = null; a.path = []; a.waitUntil = 0;
}
function stepStart(a, s){
  a.cur = s; s.done = false;
  a.path = planPath(a, s.r, s.p);
  if(s.task) a.task = s.task;
  if(s.thought) a.thought = s.thought;
  const label = (s.task || a.task) + ' — ' + (R[s.r] ? R[s.r].name : '');
  if(a.hist[0] !== fmt(clock)+'  '+label){ a.hist.unshift(fmt(clock)+'  '+label); if(a.hist.length > 10) a.hist.length = 10; }
}
function updateAgent(a, dt){
  if(!a.visible || a.controlled || a.inSub || a.flying) return;
  a.moving = false;
  if(down(a)) return;
  if(a.path.length){
    const t = a.path[0], dx = t[0]-a.x, dy = t[1]-a.y, d = Math.hypot(dx,dy);
    const sp = ((a.bike && side(a.x) === 'E') || a.task.startsWith('Đạp xe quanh')) ? 150 : a.speed * (side(a.x) === 'E' ? 1.6 : 1), st = sp*dt;
    if(d <= st){ a.x = t[0]; a.y = t[1]; a.path.shift(); }
    else { a.x += dx/d*st; a.y += dy/d*st; }
    if(Math.abs(dx) > .5) a.dir = dx < 0 ? -1 : 1;
    a.moving = true; a.walk += dt*7;
    return;
  }
  if(a.cur && !a.cur.done){
    a.cur.done = true;
    a.waitUntil = clock + (a.cur.wait || 0);
    if(a.cur.say) say(a, typeof a.cur.say === 'function' ? a.cur.say() : a.cur.say);
    if(a.cur.onArrive) a.cur.onArrive(a);
  }
  if(a.queue.length && (!a.cur || clock >= a.waitUntil)){
    const s = a.queue.shift();
    if(s.loop) a.queue.push(s);
    stepStart(a, s);
  }
}
function hide(a){ a.visible = false; a.path = []; a.queue = []; a.cur = null; a.moving = false; }
function spawn(a){ a.visible = true; a.x = GATE[0]; a.y = GATE[1] + rnd(-8,8); a.planKey = null; }
function spawnHome(s){ s.visible = true; s.x = s.home.door[0]; s.y = s.home.door[1]; s.planKey = null; }
function goGate(a){ setPlan(a, 'home', [{r:'yard', p:GATE, task:'Về nhà', thought:'Hết giờ làm việc rồi', onArrive:hide}]); }
function goHome(s){ setPlan(s, 'home', [{r:'road', p:s.home.door, task: s.bike ? 'Đạp xe về nhà' : 'Đi bộ về nhà', thought:'Về nhà kể chuyện ở trường cho bố mẹ', onArrive: a => { hide(a); a.wentHome = true; }}]); }
function knock(a, until){ a.fallen = until; a.downUntil = realT + 2 + Math.random()*2; a.downSince = realT; a.path = []; a.queue = []; a.cur = null; a.planKey = null; a.moving = false; }

// ================= DAY SETUP =================
function newDay(first){
  if(dayStats) archiveDay();
  day++;
  SCHED = buildSchedule();
  clock = first ? 432 : 375;
  if(autoSeason && !first && (day-1) % 7 === 0){ const order = ['xuan','ha','thu','dong']; setSeason(order[(order.indexOf(season)+1)%4], true); }
  const d = dow();
  dayStats = {day, remarks:[], records:[], chess:[], weather:[WEATHERS[weather].name], patrols:0, catches:[], late:[], absent:[], fights:[], quizzes:[], hazards:[], deliveries:[], subTrips:[], builds:[], goals:[], gifts:0};
  concert = null; festival = null; fight = null; truck.boxes = 0; score = {L:0, R:0};
  sub.doneToday = false;
  const clubs = shuffle(['chess','chess','chess','chess','rubikyard','rubikyard','rubikyard','music','music','music','football','football','football']);
  const musicRoles = ['piano','singer','guitar','guitar2','singer2'];
  const subPick = shuffle(students.slice()).slice(0,2);
  let chessN = 0, musicN = 0, ryN = 0;
  students.forEach((s,i) => {
    if(d === 6){ s.att = 'cn'; s.arriveAt = rnd(480, 530); s.fbAt = s.fan ? rnd(900, 912) : 9999; s.cnOut = Math.random() < .85; s.cnAct = pick(['picnic','bike','camp','koi','garden','lotus','giantchess','pondfish']); }
    else {
      const r = Math.random();
      s.att = r < .05 ? 'phep' : r < .08 ? 'vang' : r < .2 ? 'muon' : 'co';
      if(first) s.att = {quan:'muon', thinh:'phep', bich:'muon'}[s.id] || 'co';
      s.arriveAt = s.att === 'muon' ? rnd(458, 505) : rnd(392, 424);
    }
    s.mark = d === 6 ? {sang:'cn', cuoi:'cn'} : {sang:'chua', cuoi:'chua'};
    Object.assign(s, {checked:false, atPad:false, wander:false, caught:false, wentHome:false, missing:0, fight:null, quiz:null, waitSub:false, subDone:false, gift:false, lion:null, drum:false, fallen:0, shocked:0, flying:null, lift:0, inSub:false, wanderDone:false, rollDone:false, fspot:null, saoNoted:false, rungStarted:false, fbStarted:false});
    s.club = clubs[i];
    if(s.club === 'chess') s.chessSeat = chessN++;
    if(s.club === 'music') s.musicRole = musicRoles[musicN++];
    if(s.club === 'rubikyard') s.rySeat = ryN++;
    s.team = i % 2 ? 'L' : 'R';
    s.breakZone = pick(['rubikyard','chess','music','yard','yard','football','giantchess']);
    s.beachAct = subPick.includes(s) ? 'sub' : pick(season === 'dong' ? ['castle','shell','run'] : ['swim','surf','castle','shell','run','surf']);
    hide(s); s.planKey = null;
  });
  staff.forEach(a => { a.fallen = 0; a.shocked = 0; a.flying = null; a.lift = 0; a.inSub = false; if(a.id !== 'nam'){ hide(a); a.planKey = null; a.arriveAt = rnd(376, 388); } });
  Object.assign(sub, {x:SUB_DOCK[0], y:SUB_DOCK[1], state:'dock', depth:0, pass:[]});
  A.nam.fetch = [];
  log('info', `${DOWN[d]}, ngày ${day} bắt đầu. Mùa ${SEASONS[season].name}, trời ${WEATHERS[weather].name.toLowerCase()}.${d===6 ? ' Hôm nay nghỉ học.' : d===5 ? ' Hôm nay có ' + FEST_NAME[FEST_KIND[season]].toLowerCase() + '.' : d===0 ? ' Sáng nay chào cờ đầu tuần.' : ''}`);
  attDirty = true;
  if(first){
    staff.forEach(a => { a.visible = true; });
    students.forEach(s => { if(s.att === 'co') s.visible = true; });
    runBrains();
    agents.forEach(a => {
      if(!a.visible) return;
      if(!a.cur && a.queue.length) stepStart(a, a.queue.shift());
      const end = a.path.length ? a.path[a.path.length-1] : [a.x,a.y];
      a.x = end[0]; a.y = end[1]; a.path = [];
      if(a.student) a.atPad = true;
    });
  }
}
function archiveDay(){
  const rows = {};
  students.forEach(s => {
    rows[s.name] = {sang:s.mark.sang, cuoi:s.mark.cuoi, missing:s.missing};
    if(['co','muon','vang','phep'].includes(s.mark.sang)) s.totals[s.mark.sang]++;
    s.totals.thieu += s.missing;
  });
  history.unshift({day, rows});
  if(history.length > 21) history.length = 21;
}
function jumpNextDay(){
  if(concert) endConcert(true);
  if(festival) endFestival(true);
  agents.forEach(a => { a.controlled = false; if(a.id !== 'nam') hide(a); });
  $('#dpad').hidden = true;
  fade = 1; newDay(false); lastBrainMin = -1;
}

