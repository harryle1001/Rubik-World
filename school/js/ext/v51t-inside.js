// ================= v51t · BÊN TRONG TRƯỜNG TIN HỌC: phòng máy, phòng robot, góc thư viện code, bảng thành tích =================
// Mặt bằng 1000×618 (chữ nhật vàng). Tường sau cao 618/φ³ = 146. Phòng máy = ô vuông 618×618 bên trái;
// cột phải 382 chia theo φ: phòng robot (trên, tới y = 618/φ = 382) và thư viện code + bảng thành tích (dưới). Cửa ra ở x = 618/φ.
const V51T_RW = 1000, V51T_RH = 618, V51T_WALL = 146;
const V51TI = {cv:null, g:null, W:0, H:0, dpr:1, z:1, cam:{x:500, y:380}, me:{x:382, y:585, dir:1, walk:0, moving:false}, joy:null, keys:{}, near:null, raf:0, lt:0, room:null, roomK:'', st:[], teacher:null, bots:[], hint:0};
// trạm: id, toạ độ đứng, bán kính chạm, nhãn
const V51T_SPOTS = [
  {id:'blocks', x:745, y:300, r:70, ic:'🧩', vi:'Lập trình khối', en:'Block Coding'},
  {id:'rubik', x:925, y:300, r:60, ic:'🧊', vi:'Thuật toán Rubik', en:'Cube Algorithm'},
  {id:'binary', x:96, y:186, r:62, ic:'💡', vi:'Số nhị phân', en:'Binary'},
  {id:'pixel', x:528, y:186, r:62, ic:'🎨', vi:'Vẽ pixel', en:'Pixel Art'},
  {id:'typing', x:560, y:520, r:58, ic:'⌨️', vi:'Gõ phím nhanh', en:'Fast Typing'},
  {id:'debug', x:690, y:500, r:58, ic:'🐞', vi:'Tìm lỗi', en:'Bug Hunt'},
  {id:'safety', x:70, y:540, r:58, ic:'🛡️', vi:'An toàn mạng', en:'Online Safety'},
  {id:'board', x:905, y:545, r:66, ic:'🏆', vi:'Bảng thành tích', en:'Achievements'},
  {id:'exit', x:382, y:606, r:46, ic:'🚪', vi:'Ra ngoài', en:'Exit'}
];
const V51T_DESKS = []; for(let r = 0; r < 3; r++) for(let c = 0; c < 4; c++) V51T_DESKS.push({x:90 + c*120, y:278 + r*88, k:(r*4 + c*7) % 5});

// ---------- 1. phòng tĩnh (vẽ một lần, 1 px = 1 đơn vị, phóng to giữ nét pixel) ----------
function v51tRoomImg(){
  const se = typeof season === 'string' ? season : 'ha', key = se; if(V51TI.room && V51TI.roomK === key) return V51TI.room; V51TI.roomK = key;
  const c = V51TI.room || document.createElement('canvas'); c.width = V51T_RW; c.height = V51T_RH; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // sàn: phòng máy (gạch xanh nhạt), phòng robot (thảm cao su), thư viện (gỗ)
  R('#dfe7f2', 0, V51T_WALL, 618, V51T_RH - V51T_WALL); g.fillStyle = '#d3ddea'; for(let y = V51T_WALL; y < V51T_RH; y += 24) for(let x = ((y - V51T_WALL)/24 % 2)*24; x < 618; x += 48) g.fillRect(x, y, 24, 24);
  R('#3aa6a0', 618, V51T_WALL, 382, 382 - V51T_WALL); g.fillStyle = '#34979a'; for(let y = V51T_WALL; y < 382; y += 30) for(let x = 618 + ((y - V51T_WALL)/30 % 2)*30; x < 1000; x += 60) g.fillRect(x, y, 30, 30);
  R('#c99a62', 618, 382, 382, 236); g.fillStyle = '#b8894f'; for(let y = 382; y < V51T_RH; y += 18) g.fillRect(618, y, 382, 2); for(let y = 382, k = 0; y < V51T_RH; y += 18, k++) for(let x = 618 + (k % 3)*40; x < 1000; x += 120) g.fillRect(x, y, 2, 18);
  // tường sau: trắng + dải xanh + cửa sổ (trời theo mùa)
  R('#f4f6fb', 0, 0, V51T_RW, V51T_WALL); R('#2fbf71', 0, V51T_WALL - 14, V51T_RW, 6); R('#c7cedd', 0, V51T_WALL - 8, V51T_RW, 8);
  const sky = {xuan:'#bfe6ff', ha:'#9fd8ff', thu:'#ffd9a8', dong:'#dfe9f5'}[se] || '#9fd8ff';
  [[640, 22], [780, 22]].forEach(([x, y]) => { R('#c7cedd', x - 4, y - 4, 108, 74); R(sky, x, y, 100, 66); R('#fff', x + 48, y, 4, 66); R('#fff', x, y + 31, 100, 4); R('rgba(255,255,255,.5)', x + 6, y + 6, 20, 6); });
  // máy chiếu lớn giữa phòng máy + bảng đèn nhị phân (trái) + màn hình vẽ pixel (phải)
  R('#2b3550', 200, 18, 218, 110); R('#0f1a2e', 206, 24, 206, 98); R('#8d93a6', 305, 128, 8, 10);
  R('#2b3550', 30, 30, 134, 84); R('#141c30', 34, 34, 126, 76); for(let i = 0; i < 4; i++){ R('#ffd23f', 44 + i*30, 92, 22, 4); }
  R('#2b3550', 462, 26, 132, 96); R('#fff', 468, 32, 120, 84);
  // dải 6 màu Rubik dưới máy chiếu + đồng hồ
  for(let i = 0; i < 6; i++) R(V51T_RUBIK[i], 230 + i*27, 4, 24, 8);
  // vách kính ngăn phòng (có lối đi) + chân vách
  g.fillStyle = 'rgba(150,215,240,.55)'; g.fillRect(616, V51T_WALL, 6, 184); g.fillRect(616, 420, 6, V51T_RH - 420); R('#8d93a6', 615, V51T_WALL, 2, 184); R('#8d93a6', 615, 420, 2, V51T_RH - 420);
  g.fillStyle = 'rgba(150,215,240,.55)'; g.fillRect(622, 380, 128, 6); g.fillRect(850, 380, 150, 6); R('#8d93a6', 622, 386, 128, 2); R('#8d93a6', 850, 386, 150, 2);
  // bàn giáo viên
  R('#8a5a34', 250, 168, 118, 26); R('#6b4226', 250, 194, 118, 6); R('#2a3048', 296, 150, 28, 18); R('#5ff0ff', 299, 153, 22, 12); R('#ef4b4b', 262, 160, 12, 10); R('#ffd23f', 342, 162, 16, 6);
  // 12 bàn máy tính (màn hình quay về phía người xem, học sinh ngồi quay lưng)
  V51T_DESKS.forEach(d => { R('rgba(0,0,0,.12)', d.x - 46, d.y + 8, 96, 6); R('#e9edf5', d.x - 46, d.y - 6, 92, 16); R('#c9cfdc', d.x - 46, d.y + 10, 92, 4); R('#7d8496', d.x - 42, d.y + 14, 4, 18); R('#7d8496', d.x + 38, d.y + 14, 4, 18);
    R('#2a3048', d.x - 22, d.y - 40, 44, 32); R('#1d2235', d.x - 3, d.y - 8, 6, 4); R('#c9cfdc', d.x - 18, d.y + 2, 36, 5); R('#3b4664', d.x - 24, d.y + 34, 12, 4); });
  // góc gõ phím (bàn phím lớn) + góc an toàn mạng (bảng tin)
  R('#e9edf5', 516, 486, 92, 22); R('#2a3048', 538, 452, 48, 32); for(let i = 0; i < 6; i++) R('#c9cfdc', 522 + i*14, 492, 12, 10);
  R('#2b3550', 24, 470, 96, 60); R('#fdf6e3', 28, 474, 88, 52); R('#2fbf71', 34, 480, 30, 20); R('#ef4b4b', 70, 480, 38, 8); R('#3d7bff', 70, 492, 30, 6); R('#7d8496', 66, 530, 12, 22);
  // phòng robot: thảm mê cung 5×5 + bàn Rubik + kệ linh kiện
  for(let i = 0; i < 5; i++) for(let j = 0; j < 5; j++) R((i + j) % 2 ? '#f4f4f4' : '#d8e4ee', 680 + i*26, 196 + j*26, 25, 25); R('#2fbf71', 680 + 4*26 + 4, 196 + 4, 17, 17); R('#ffd23f', 680 + 2*26 + 6, 196 + 2*26 + 6, 13, 13);
  R('#8a5a34', 880, 252, 92, 26); R('#6b4226', 880, 278, 92, 5); [[905, 236], [935, 240]].forEach(([x, y], k) => { for(let a = 0; a < 3; a++) for(let b = 0; b < 3; b++) R(V51T_RUBIK[(a + b + k*2) % 6], x + a*6, y + b*6, 5, 5); });
  R('#7d8496', 860, 160, 120, 60); for(let s = 0; s < 3; s++){ R('#5a6378', 860, 176 + s*20, 120, 3); for(let k = 0; k < 7; k++) R(V51T_RUBIK[(k + s) % 6], 866 + k*16, 166 + s*20, 10, 9); }
  // thư viện code: kệ sách gáy chữ (IF, LOOP…), ghế lười, máy tìm lỗi, tủ cúp + bảng thành tích
  for(let k = 0; k < 2; k++){ const x = 640 + k*130; R('#6b4226', x, 396, 116, 64); for(let s = 0; s < 3; s++){ R('#4a2e18', x, 412 + s*16, 116, 3); for(let b = 0; b < 9; b++) R(['#ef4b4b', '#3d7bff', '#2fbf71', '#ffd23f', '#9b6bff', '#ff8a2b'][(b + s + k) % 6], x + 4 + b*12, 400 + s*16, 10, 12); } }
  const lb = v51tPixText('IF  LOOP', '#ffffff', 1); g.drawImage(lb, 646, 462);
  R('#2a3048', 668, 470, 46, 30); R('#3b4664', 662, 500, 58, 10); R('#ef4b4b', 684, 478, 14, 12);
  g.fillStyle = '#ff8fc4'; g.beginPath(); g.ellipse(790, 560, 30, 18, 0, 0, 7); g.fill(); g.fillStyle = '#5ff0ff'; g.beginPath(); g.ellipse(850, 584, 26, 16, 0, 0, 7); g.fill();
  R('#2b3550', 870, 470, 110, 62); R('#fdf6e3', 874, 474, 102, 54); R('#8a5a34', 880, 532, 92, 34); R('#ffd23f', 912, 516, 28, 14); R('#ffd23f', 922, 506, 8, 10);
  // cây trong chậu (mùa)
  const lf = {xuan:'#7bd36a', ha:'#3fae4a', thu:'#d98a2b', dong:'#6aa880'}[se] || '#3fae4a'; [[16, 170], [600, 170], [980, 600]].forEach(([x, y]) => { R('#c25a1a', x - 9, y, 18, 16); g.fillStyle = lf; g.beginPath(); g.arc(x, y - 8, 14, 0, 7); g.fill(); });
  // thảm cửa ra
  R('#2fbf71', 342, 596, 80, 18); R('#1f8a50', 342, 612, 80, 6);
  V51TI.room = c; return c;
}

// ---------- 2. học sinh & cô giáo theo thời khoá biểu ----------
function v51tMakeStudents(){
  V51TI.st = V51T_DESKS.map((d, i) => { const k = v51tRandKid(i); k.desk = d; k.x = d.x; k.y = d.y + 36; k.home = [d.x, d.y + 36]; k.tx = k.x; k.ty = k.y; k.back = true; k.sit = true; k.type = true; k.wait = Math.random()*4; k.on = i !== 4 && i !== 9; return k; });
  V51TI.teacher = {skin:'#f6d0a8', hair:'#1a1a1a', shirt:'#2fbf71', pants:'#2b3550', long:true, glasses:true, dir:1, walk:0, moving:false, x:309, y:212, tx:309, ty:212, wait:2, name:'Cô Lam'};
  V51TI.bots = [{x:693, y:209, cx:0, cy:0, d:0, t:0}];
}
function v51tLifeIn(dt){
  const cls = v51tClass(), c = typeof clock === 'number' ? clock : 600, open = c >= 420 && c < 1140, Tc = V51TI.teacher;
  V51TI.st.forEach((k, i) => { const want = k.on && (cls || (open && i % 3 === 0));
    if(want && cls){ if(Math.hypot(k.x - k.home[0], k.y - k.home[1]) > 2){ k.sit = false; k.back = false; k.tx = k.home[0]; k.ty = k.home[1]; } else { k.sit = true; k.back = true; k.type = true; k.moving = false; } }
    else if(want){ k.sit = false; k.back = false; k.wait -= dt; if(k.wait <= 0 && Math.hypot(k.tx - k.x, k.ty - k.y) < 2){ k.wait = 3 + Math.random()*5; const r = Math.random(); if(r < .45){ k.tx = 680 + Math.random()*290; k.ty = 230 + Math.random()*120; } else if(r < .75){ k.tx = 640 + Math.random()*320; k.ty = 520 + Math.random()*70; } else { k.tx = 60 + Math.random()*500; k.ty = 540 + Math.random()*50; } } }
    k.vis = want; if(!want || k.sit) return; const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy); if(d < 2){ k.moving = false; return; } const s = Math.min(d, 46*dt); k.x += dx/d*s; k.y += dy/d*s; k.dir = dx < 0 ? -1 : 1; k.moving = true; k.walk += dt*6; });
  Tc.vis = open && c < 1050; if(Tc.vis){ Tc.wait -= dt; const dx = Tc.tx - Tc.x, dy = Tc.ty - Tc.y, d = Math.hypot(dx, dy);
    if(d < 2){ Tc.moving = false; if(Tc.wait <= 0){ Tc.wait = 3 + Math.random()*4; if(cls){ const D = V51T_DESKS[Math.floor(Math.random()*12)]; Tc.tx = Math.random() < .4 ? 309 : D.x + 40; Tc.ty = Math.random() < .4 ? 212 : D.y + 40; } else { Tc.tx = 300 + Math.random()*260; Tc.ty = 220 + Math.random()*300; } } }
    else { const s = Math.min(d, 40*dt); Tc.x += dx/d*s; Tc.y += dy/d*s; Tc.dir = dx < 0 ? -1 : 1; Tc.moving = true; Tc.walk += dt*6; } }
  const B = V51TI.bots[0]; B.t += dt; if(B.t > .7){ B.t = 0; const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]], m = dirs[B.d]; const nx = B.cx + m[0], ny = B.cy + m[1]; if(nx < 0 || ny < 0 || nx > 4 || ny > 4 || Math.random() < .25) B.d = (B.d + 1) % 4; else { B.cx = nx; B.cy = ny; } }
  B.x += (680 + B.cx*26 + 12.5 - B.x)*Math.min(1, dt*8); B.y += (196 + B.cy*26 + 12.5 - B.y)*Math.min(1, dt*8);
}

// ---------- 3. khung hình ----------
function v51tInFrame(now){
  if(!V51T.open){ V51TI.raf = 0; return; } V51TI.raf = requestAnimationFrame(v51tInFrame); if(V51T.game) return;
  const dt = Math.min(.05, V51TI.lt ? (now - V51TI.lt)/1000 : .016); V51TI.lt = now; v51tInUpdate(dt); v51tInDraw(dt);
}
function v51tInWalk(x, y){
  if(x < 14 || x > V51T_RW - 14 || y < V51T_WALL + 30 || y > V51T_RH - 6) return false;
  if(Math.abs(x - 618) < 10 && !(y > 330 && y < 420)) return false; if(x > 618 && Math.abs(y - 384) < 8 && !(x > 750 && x < 850)) return false;
  for(const d of V51T_DESKS) if(x > d.x - 50 && x < d.x + 50 && y > d.y - 8 && y < d.y + 18) return false;
  if(x > 246 && x < 372 && y > 160 && y < 202) return false; if(x > 636 && x < 890 && y > 392 && y < 462) return false; if(x > 876 && x < 976 && y > 248 && y < 284) return false; if(x > 856 && x < 984 && y < 222) return false;
  if(x > 876 && x < 976 && y > 466 && y < 566) return false; if(x > 512 && x < 612 && y > 482 && y < 510) return false; if(x > 20 && x < 124 && y > 466 && y < 532) return false; if(x > 658 && x < 724 && y > 466 && y < 512) return false;
  return true;
}
function v51tInUpdate(dt){
  const m = V51TI.me; let vx = 0, vy = 0; const j = V51TI.joy; if(j && j.on){ vx = j.vx; vy = j.vy; }
  const K = V51TI.keys; if(K.ArrowLeft || K.a) vx = -1; if(K.ArrowRight || K.d) vx = 1; if(K.ArrowUp || K.w) vy = -1; if(K.ArrowDown || K.s) vy = 1;
  const l = Math.hypot(vx, vy); m.moving = l > .1; if(m.moving){ const sp = 150*Math.min(1, l)/(l || 1), nx = m.x + vx*sp*dt, ny = m.y + vy*sp*dt; if(v51tInWalk(nx, ny)){ m.x = nx; m.y = ny; } else if(v51tInWalk(nx, m.y)) m.x = nx; else if(v51tInWalk(m.x, ny)) m.y = ny; if(Math.abs(vx) > .1) m.dir = vx < 0 ? -1 : 1; m.walk += dt*7; }
  v51tLifeIn(dt);
  // trạm gần nhất
  let best = null, bd = 1e9; V51T_SPOTS.forEach(s => { const d = Math.hypot(m.x - s.x, m.y - s.y); if(d < s.r && d < bd){ bd = d; best = s; } });
  const Tc = V51TI.teacher; if(!best && Tc.vis && Math.hypot(m.x - Tc.x, m.y - Tc.y) < 44) best = {id:'teacher', ic:'👩‍🏫', vi:'Hỏi cô Lam', en:'Ask the teacher'};
  if(best !== V51TI.near && (!best || !V51TI.near || best.id !== V51TI.near.id)){ V51TI.near = best; v51tActBtn(best); }
  // camera
  const W = V51TI.W/V51TI.z, H = V51TI.H/V51TI.z, cm = V51TI.cam; cm.x += (m.x - cm.x)*Math.min(1, dt*5); cm.y += (m.y - 40 - cm.y)*Math.min(1, dt*5);
  cm.x = W >= V51T_RW ? V51T_RW/2 : Math.max(W/2, Math.min(V51T_RW - W/2, cm.x)); cm.y = H >= V51T_RH + 60 ? V51T_RH/2 + 10 : Math.max(H/2 - 50, Math.min(V51T_RH + 20 - H/2, cm.y));
  if(V51TI.hint > 0) V51TI.hint -= dt;
}
function v51tScreen(g, x, y, w, h, k, t, i){
  g.fillStyle = '#0f1a2e'; g.fillRect(x, y, w, h); const ph = Math.floor(t*3 + i*1.3);
  if(k === 0){ for(let l = 0; l < 5; l++){ g.fillStyle = ['#5ff0ff', '#ffd23f', '#7dff9a', '#ff8fc4', '#c8cde0'][(l + ph) % 5]; g.fillRect(x + 2 + (l % 3)*3, y + 2 + l*5, 6 + ((l*7 + ph*5) % (w - 12)), 2); } }
  else if(k === 1){ for(let a = 0; a < 4; a++) for(let b = 0; b < 3; b++){ g.fillStyle = V51T_RUBIK[(a*3 + b + ph) % 6]; g.fillRect(x + 4 + a*(w - 8)/4, y + 3 + b*(h - 6)/3, (w - 8)/4 - 1, (h - 6)/3 - 1); } }
  else if(k === 2){ for(let a = 0; a < 4; a++){ const on = (ph >> a) & 1; g.fillStyle = on ? '#ffd23f' : '#3b4664'; g.fillRect(x + 4 + a*((w - 8)/4), y + h/2 - 4, (w - 8)/4 - 3, 8); } }
  else if(k === 3){ g.fillStyle = '#2fbf71'; g.fillRect(x + 2, y + h - 6, w - 4, 3); const p = ph % 8; g.fillStyle = '#ffd23f'; g.fillRect(x + 4 + p*((w - 14)/8), y + h - 12, 6, 6); g.fillStyle = '#ef4b4b'; g.fillRect(x + w - 8, y + 4, 4, 4); }
  else { g.fillStyle = '#c8cde0'; const s = 'CODE'; for(let l = 0; l < 3; l++) g.fillRect(x + 3, y + 3 + l*6, Math.min(w - 6, ((ph + l*3) % 6)*6 + 4), 3); if(ph % 2) { g.fillStyle = '#5ff0ff'; g.fillRect(x + w - 7, y + h - 7, 3, 4); } }
}
function v51tInDraw(dt){
  const g = V51TI.g, W = V51TI.W, H = V51TI.H, z = V51TI.z, dpr = V51TI.dpr, t = performance.now()/1000, cm = V51TI.cam, nk = v51tNightK();
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#0b1028'; g.fillRect(0, 0, W, H);
  g.setTransform(dpr*z, 0, 0, dpr*z, Math.round(dpr*(W/2 - cm.x*z)), Math.round(dpr*(H/2 - cm.y*z))); g.imageSmoothingEnabled = false;
  g.drawImage(v51tRoomImg(), 0, 0);
  // màn hình động: máy chiếu, bảng nhị phân, màn vẽ pixel, 12 máy, góc gõ phím, máy tìm lỗi
  v51tScreen(g, 206, 24, 206, 98, 0, t*.6, 0); const t1 = v51tPixText(v51tPeriod()[1].slice(0, 30), '#ffe36e', 1); g.drawImage(t1, 309 - Math.min(200, t1.width)/2, 102, Math.min(200, t1.width), t1.height);
  const n = Math.floor(t*.8) % 16; for(let i = 0; i < 4; i++){ const on = (n >> (3 - i)) & 1; g.fillStyle = on ? '#ffd23f' : '#3b4664'; g.beginPath(); g.arc(55 + i*30, 62, 10, 0, 7); g.fill(); if(on){ g.fillStyle = 'rgba(255,240,150,.35)'; g.beginPath(); g.arc(55 + i*30, 62, 15, 0, 7); g.fill(); } }
  const nt = v51tPixText('= ' + n, '#7dff9a', 2); g.drawImage(nt, 98 - nt.width/2, 38);
  const pf = Math.floor(t*4) % 64; for(let i = 0; i <= pf; i++){ const a = i % 8, b = Math.floor(i/8), pat = [0x3c, 0x7e, 0xdb, 0xff, 0xff, 0xdb, 0x66, 0x3c][b]; if((pat >> (7 - a)) & 1){ g.fillStyle = V51T_RUBIK[(a + b) % 6]; g.fillRect(492 + a*9, 36 + b*9, 9, 9); } }
  V51T_DESKS.forEach((d, i) => v51tScreen(g, d.x - 19, d.y - 37, 38, 26, d.k, t, i)); v51tScreen(g, 541, 455, 42, 26, 4, t, 3); v51tScreen(g, 671, 473, 40, 24, 0, t*1.6, 7);
  g.fillStyle = (Math.floor(t*2) % 2) ? '#ef4b4b' : '#ffd23f'; g.fillRect(686, 480, 10, 8);
  // sắp theo y: học sinh, cô giáo, robot, mình
  const sp = []; V51TI.st.forEach(k => { if(k.vis) sp.push({y:k.y, f:() => v51tKid(g, k.x, k.y, k, t)}); }); const Tc = V51TI.teacher; if(Tc.vis) sp.push({y:Tc.y, f:() => v51tKid(g, Tc.x, Tc.y, Tc, t)});
  const B = V51TI.bots[0]; sp.push({y:B.y, f:() => { g.fillStyle = '#ffd23f'; g.fillRect(B.x - 9, B.y - 14, 18, 14); g.fillStyle = '#1b2235'; g.fillRect(B.x - 6, B.y - 11, 12, 5); g.fillStyle = '#5ff0ff'; g.fillRect(B.x - 4, B.y - 10, 2, 2); g.fillRect(B.x + 2, B.y - 10, 2, 2); g.fillStyle = '#2a3048'; g.fillRect(B.x - 10, B.y - 3, 5, 4); g.fillRect(B.x + 5, B.y - 3, 5, 4); }});
  const m = V51TI.me; sp.push({y:m.y, f:() => v51tKid(g, m.x, m.y, m, t)}); sp.sort((a, b) => a.y - b.y); sp.forEach(s => s.f());
  // đêm: phòng tối, màn hình sáng
  if(nk > 0){ g.fillStyle = `rgba(10,16,44,${nk*.55})`; g.fillRect(0, 0, V51T_RW, V51T_RH); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = nk*.5; g.fillStyle = '#5ff0ff';
    V51T_DESKS.forEach(d => g.fillRect(d.x - 26, d.y - 42, 52, 38)); g.fillRect(200, 18, 218, 110); g.restore(); }
  // nhãn trạm (toạ độ màn hình, chữ ≥ 16px)
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.font = V51T_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  V51T_SPOTS.forEach(s => { if(s.id === 'exit') return; const sx = W/2 + (s.x - cm.x)*z, sy = H/2 + (s.y - 58 - cm.y)*z, nr = V51TI.near && V51TI.near.id === s.id; if(sx < -60 || sx > W + 60 || sy < 40 || sy > H) return;
    const txt = s.ic + ' ' + s.vi, w = g.measureText(txt).width + 16; g.fillStyle = nr ? '#ffd23f' : 'rgba(11,16,32,.72)'; v51tRR(g, sx - w/2, sy - 14, w, 28, 14); g.fill(); g.fillStyle = nr ? '#1a1430' : '#fff'; g.fillText(txt, sx, sy + 1); });
  if(V51TI.hint > 0){ const s = '👆 Kéo để đi · chạm vào góc học để chơi'; const w = g.measureText(s).width + 24; g.globalAlpha = Math.min(1, V51TI.hint); g.fillStyle = 'rgba(11,16,32,.85)'; v51tRR(g, W/2 - w/2, H - 130, w, 36, 18); g.fill(); g.fillStyle = '#fff'; g.fillText(s, W/2, H - 112); g.globalAlpha = 1; }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
function v51tRR(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }

// ---------- 4. cảm ứng: kéo = đi, chạm = mở góc học ----------
function v51tInToWorld(x, y){ return [V51TI.cam.x + (x - V51TI.W/2)/V51TI.z, V51TI.cam.y + (y - V51TI.H/2)/V51TI.z]; }
function v51tInInput(cv){
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => { if(!V51T.open || V51T.game) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(err){} V51TI.joy = {id:e.pointerId, x0:e.offsetX, y0:e.offsetY, on:false, vx:0, vy:0, t:performance.now()}; });
  cv.addEventListener('pointermove', e => { const j = V51TI.joy; if(!j || j.id !== e.pointerId) return; const dx = e.offsetX - j.x0, dy = e.offsetY - j.y0, d = Math.hypot(dx, dy); if(!j.on && d > 14) j.on = true; if(j.on){ const k = Math.min(1, d/40)/(d || 1); j.vx = dx*k; j.vy = dy*k; } });
  cv.addEventListener('pointerup', e => { const j = V51TI.joy; if(!j || j.id !== e.pointerId) return; V51TI.joy = null; if(j.on || performance.now() - j.t > 500) return; v51tInTap(e.offsetX, e.offsetY); });
  cv.addEventListener('pointercancel', () => { V51TI.joy = null; });
  addEventListener('keydown', e => { if(!V51T.open || V51T.game) return; if(e.key === 'Escape'){ const p = document.getElementById('v51tPan'); if(p && !p.hidden) v51tPanel(null); else v51tClose(); return; } V51TI.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; if(/^Arrow/.test(e.key)) e.preventDefault(); }, true);
  addEventListener('keyup', e => { V51TI.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; }, true);
}
function v51tInTap(x, y){
  const [wx, wy] = v51tInToWorld(x, y);
  const Tc = V51TI.teacher; if(Tc.vis && Math.hypot(wx - Tc.x, wy - (Tc.y - 16)) < 26) return v51tSpot({id:'teacher'});
  let best = null, bd = 1e9; V51T_SPOTS.forEach(s => { const d = Math.hypot(wx - s.x, (wy - (s.y - 40))*.8); if(d < Math.max(54, s.r) && d < bd){ bd = d; best = s; } }); if(best) v51tSpot(best);
}
function v51tSpot(s){
  if(s.id === 'exit'){ v51tClose(); return; } if(s.id === 'board') return v51tBoard(); if(s.id === 'teacher') return v51tTeacher();
  if(V51T_GAMES[s.id]) v51tGOpen(s.id);
}
