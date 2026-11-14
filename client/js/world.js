// Builds each zone as a 3D scene (Three.js via E3). Logic stays in the server's px coordinates; returns {blockers, interacts, ticks}.
const W3 = {trees:null};
function tree(x, y, kind, s){ (W3.trees[kind] || (W3.trees[kind] = [])).push([x, y, (s || 1)*(.85 + ((x*13 + y*7) % 30)/100)]); }
function signpost(x, y, text){
  E3.cyl(x, y, 4, 3.5, 92, '#5d4037', {seg:6}); E3.box(x, y, 14, 14, 6, '#3e2723');
  E3.board(x, y + 5, 100, text, {size:15, color:'#fff8e1', bg:'#8d6e4a', tilt:-.1});
  ['#ff6f91', '#ffd23f', '#ffffff'].forEach((c, k) => E3.ball(x - 12 + k*12, y + 10, 4, c, {detail:0}));
}
function exitMarker(e){
  const cx = e.x + e.w/2, cy = e.y + e.h/2, pad = E3.plane(cx, cy, e.w, e.h, '#ffd23f', {basic:true, opacity:.35, z:1.5});
  const col = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(e.w, e.h)*.45, Math.min(e.w, e.h)*.55, 60, 20, 1, true), new THREE.MeshBasicMaterial({color:'#ffe680', transparent:true, opacity:.18, side:THREE.DoubleSide, depthWrite:false, fog:false}));
  col.scale.x = e.w/Math.min(e.w, e.h); col.scale.z = e.h/Math.min(e.w, e.h); col.position.set(cx, 30, cy); E3.root.add(col);
  E3.ticks.push((dt, t) => { pad.material.opacity = .25 + .2*Math.sin(t*3); col.material.opacity = .08 + .06*Math.sin(t*3 + 1); });
}
// puffy clouds on the horizon and birds gliding over the play area
function skyLife(W, H, night){
  const clouds = [], birds = [], cm = E3.mat(night ? '#7c86c8' : '#ffffff', {flat:false, rough:1});
  for(let i=0;i<10;i++){ const g = new THREE.Group(), s = 1 + Math.random()*1.4; [[0, 0, 60], [55, -8, 45], [-55, -6, 42], [100, 5, 32], [-100, 6, 30]].forEach(([dx, dy, r]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cm); m.position.set(dx, dy, (Math.random() - .5)*30); g.add(m); });
    g.scale.setScalar(s*1.6); g.position.set(Math.random()*(W + 2000) - 1000, 700 + Math.random()*500, -900 - Math.random()*1200); E3.root.add(g); clouds.push({g, v:10 + Math.random()*20}); }
  if(!night) for(let i=0;i<7;i++){ const g = new THREE.Group(), c = ['#5d4037', '#e53935', '#1e88e5', '#fafafa', '#263238'][i % 5]; const body = E3.ball(0, 0, 6, c, {detail:0, cast:false}, g); body.scale.set(1, .7, 2);
    const wl = new THREE.Group(), wr = new THREE.Group(); [wl, wr].forEach((w, k) => { const m = E3.box(k ? 12 : -12, 0, 24, 10, 1.5, c, {cast:false}, w); m.position.y = 0; g.add(w); });
    g.position.set(Math.random()*W, 260 + Math.random()*200, Math.random()*H); E3.root.add(g); birds.push({g, wl, wr, a:Math.random()*6, r:300 + Math.random()*500, cx:Math.random()*W, cy:Math.random()*H, v:.15 + Math.random()*.2, ph:Math.random()*6}); }
  E3.ticks.push((dt, t) => { clouds.forEach(c => { c.g.position.x += c.v*dt; if(c.g.position.x > W + 1200) c.g.position.x = -1200; });
    birds.forEach(b => { b.a += b.v*dt; b.ph += dt*8; const x = b.cx + Math.cos(b.a)*b.r, z = b.cy + Math.sin(b.a)*b.r*.6; b.g.rotation.y = Math.atan2(x - b.g.position.x, z - b.g.position.z); b.g.position.x = x; b.g.position.z = z; const f = Math.sin(b.ph)*.6; b.wl.rotation.z = f; b.wr.rotation.z = -f; }); });
}
// room shell for indoor zones: floor, back wall (y < back) and low side walls
function room(W, H, wall, f1, f2, pattern, back){
  back = back || 200; E3.ground(0, back - 10, W, H - back + 200, f1, f2, {pattern, tile:pattern === 'wood' ? 240 : 160});
  E3.box(W/2, back - 20, W + 40, 40, 300, wall); E3.box(W/2, back - 2, W + 40, 6, 14, shadeHex(wall, -.3), {z:0});
  E3.box(-20, (back + H)/2, 40, H - back + 40, 120, shadeHex(wall, -.08)); E3.box(W + 20, (back + H)/2, 40, H - back + 40, 120, shadeHex(wall, -.08));
  E3.ground(-1500, -1500, W + 3000, H + 3000, '#2b2236', '#241d2e', {z:-2});
}
function borderTrees(Z, kinds, step, depth){
  const [x0, y0, x1, y1] = Z.walk, W = Z.w, H = Z.h; step = step || 160; depth = depth || 3;
  for(let d=0; d<depth; d++) for(let x=-400; x<W + 400; x += step){ const j = ((x*31 + d*97) % 70) - 35; tree(x + j, y0 - 160 - d*170 + (d % 2)*40, kinds[(x/step + d) % kinds.length | 0], 1.1); if(y1 < H - 100) tree(x + j, Math.max(y1 + 140, H + 60) + d*170, kinds[(x/step + d + 1) % kinds.length | 0], 1.1); }
  for(let d=0; d<depth; d++) for(let y=y0 - 100; y<H + 300; y += step){ tree(x0 - 160 - d*170, y, kinds[(y/step + d) % kinds.length | 0], 1.1); tree(x1 + 160 + d*170, y + 50, kinds[(y/step + d + 2) % kinds.length | 0], 1.1); }
}
function drawZone(scene, Z, zid){
  const out = {blockers:[], interacts:[], ticks:[]}, W = Z.w, H = Z.h; W3.trees = {};
  const I = (x, y, r, label, act) => out.interacts.push({x, y, r, label, act});
  const B = (x, y, w, h) => out.blockers.push([x, y, w, h]);
  const indoor = ['class', 'talent', 'gym', 'mall', 'interior'].includes(Z.theme);
  E3.newZone({indoor, sky:Z.theme === 'hill' ? 'night' : 'day'});
  switch(Z.theme){
  case 'class': {
    room(W, H, '#c9b48f', '#e8dcc6', '#dcccb0', 'check');
    E3.box(700, 192, 660, 8, 140, '#6b4a2a', {z:40}); E3.board(700, 197, 110, 'Chào mừng tới Trường Rubik!\nRa cửa phía dưới để tới đường chính', {size:26, color:'#e9f5e9', bg:'#2e5b3a', tilt:0});
    [120, 1280].forEach(x => { const w = E3.box(x, 194, 170, 6, 120, '#90caf9', {z:70, rough:.1}); });
    for(let r=0;r<3;r++) for(let c=0;c<4;c++){ const x = 230 + c*260, y = 320 + r*150; E3.box(x, y, 100, 44, 8, '#a1784e', {z:38}); [-40, 40].forEach(dx => [-16, 16].forEach(dy => E3.box(x + dx, y + dy, 5, 5, 38, '#5d4037')));
      E3.box(x, y - 4, 22, 16, 4, ['#3d7bff', '#ef4b4b', '#2fbf71', '#ffd23f'][(r + c) % 4], {z:46}); E3.box(x, y + 40, 40, 30, 4, '#8d6e4a', {z:24}); E3.box(x, y + 56, 40, 4, 34, '#8d6e4a', {z:24}); B(x - 50, y - 20, 100, 36); }
    E3.box(700, 250, 180, 60, 60, '#6d4c2e'); E3.box(660, 245, 30, 20, 6, '#fafafa', {z:60}); E3.ball(740, 250, 8, '#e53935', {z:60});
    E3.scatter('bush', [[80, 760, .9], [1320, 760, .9]]); E3.scatter('oak', [[80, 300, .5], [1320, 300, .5]]);
    I(700, 260, 70, 'Nghe cô giáo giảng bài', () => UI.lesson()); break; }
  case 'hub': {
    E3.ground(-1500, -1500, W + 3000, 2700, '#7cb342', '#689f38');
    E3.ground(-1500, 1160, W + 3000, 80, '#ffe0a3', '#f5d48a', {z:.4});
    E3.water(-2000, 1200, W + 4000, 2400, {shore:1200/PX, z:-3});
    E3.plane(W/2, 900, W + 3000, 80, '#8e8e8e', {z:1}); for(let x=-1400; x<W + 1400; x+=80) E3.plane(x, 898, 40, 4, '#fafafa', {z:1.5});
    E3.plane(W/2, 856, W + 3000, 8, '#cfcfcf', {z:1.2}); E3.plane(W/2, 944, W + 3000, 8, '#cfcfcf', {z:1.2});
    Z.exits.forEach(e => { const cx = e.x + e.w/2; if(e.y < 700) E3.plane(cx, 750, 60, 220, '#d7ccc8', {z:.8}); else if(e.y > 1000) E3.plane(cx, 1050, 60, 220, '#d7ccc8', {z:.8}); });
    for(let x=100; x<W; x+=400){ E3.scatter('lamp', [[x, 846, .9, 0], [x + 200, 956, .9, Math.PI]]); }
    for(let i=0;i<70;i++){ const x = (i*211) % W, y = 660 + (i*53) % 520; if(Math.abs(y - 900) < 90 || y > 1150) continue; if(Z.exits.some(e => Math.abs(e.x + e.w/2 - x) < 90)) continue; tree(x, y, i % 4 ? 'oak' : 'pine', .9); }
    for(let i=0;i<260;i++){ const x = -1200 + (i*197) % (W + 2400), y = 560 - (i*89) % 1500; tree(x, y, ['oak', 'pine', 'pine', 'sakura'][i % 4], 1.1 + (i % 3)*.2); }
    for(let i=0;i<9;i++){ const m = E3.mesh(new THREE.ConeGeometry(900 + (i % 3)*300, 900 + (i % 4)*350, 7), i % 2 ? '#5d8a4a' : '#6f9c55', {}); m.position.set(-800 + i*700, 400, -1800 - (i % 3)*500); }
    E3.label('BẦU TRỜI', {size:60, color:'rgba(255,255,255,.75)', x:200, y:-200, z:500}); E3.label('ĐẠI DƯƠNG', {size:60, color:'rgba(255,255,255,.75)', x:300, y:1500, z:80});
    const ships = [{x:400, y:1450, v:40, m:'sailboat', s:1.2}, {x:2200, y:1700, v:-30, m:'sailboat', s:1}, {x:3400, y:1550, v:35, m:'sailboat', s:1.3}, {x:1200, y:2100, v:-20, m:'warship', s:1}];
    ships.forEach(s => { s.g = E3.model(s.m, s.x, s.y, s.s, s.v > 0 ? 0 : Math.PI); });
    E3.ticks.push((dt, t) => ships.forEach((s, i) => { s.x += s.v*dt; if(s.x > W + 600) s.x = -600; if(s.x < -600) s.x = W + 600; s.g.position.set(s.x, -4 + Math.sin(t*1.4 + i)*3, s.y); s.g.rotation.z = Math.sin(t*1.1 + i)*.04; }));
    skyLife(W, H); break; }
  case 'forest': {
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#558b2f', '#33691e');
    E3.plane(W/2, 700, W + 3000, 80, '#a1887f', {z:.8});
    E3.water(1460, -1500, 160, H + 3000, {amp:2, z:-6, shallow:'#5fe0f0', deep:'#1689c7'}); E3.box(1450, H/2, 20, H + 3000, 6, '#6d4c41', {z:-6}); E3.box(1630, H/2, 20, H + 3000, 6, '#6d4c41', {z:-6});
    out.blockers.push([1440, -2000, 200, 2640]); out.blockers.push([1440, 760, 200, H + 2000]);
    E3.box(1540, 700, 240, 110, 10, '#8d6e4a', {z:2}); for(let x=1430; x<1660; x+=22) E3.box(x, 700, 4, 112, 2, '#6d4c2e', {z:12}); [646, 754].forEach(y => { E3.box(1540, y, 240, 6, 6, '#6d4c2e', {z:40}); for(let x=1430; x<=1650; x+=55) E3.box(x, y, 6, 6, 40, '#5d4037', {z:10}); });
    for(let i=0;i<120;i++){ const x = (i*173) % W, y = 140 + (i*97) % (H - 160); if(Math.abs(y - 700) < 90 || (x > 1400 && x < 1700)) continue; tree(x, y, 'pine', .8 + (i % 3)*.15); }
    borderTrees(Z, ['pine', 'pine', 'oak'], 150, 3);
    E3.scatter('rock', [[400, 600, 1], [900, 780, .7], [2100, 620, 1.2], [1350, 520, .8], [1750, 860, .9]]); E3.scatter('bush', [[600, 780, .9], [1250, 610, 1], [2000, 790, .8]]);
    skyLife(W, H);
    signpost(300, 640, '→ Suối trong & cầu gỗ'); signpost(1900, 640, 'Đường mòn ngắm chim →');
    break; }
  case 'beach': {
    E3.ground(-1500, -1500, W + 3000, 2250, '#ffe0a3', '#f5d48a');
    E3.water(-2000, 720, W + 4000, 3000, {shore:720/PX, z:-3});
    for(let k=0;k<6;k++) tree(120 + k*420, 140, 'palm', 1.2); for(let k=0;k<16;k++) tree(-1200 + k*330, -60 - (k % 3)*120, k % 4 ? 'palm' : 'oak', 1.3);
    E3.box(1730, 690, 60, 280, 10, '#8d6e4a', {z:6}); for(let y=560; y<830; y+=50){ E3.cyl(1704, y, 5, 5, 30, '#5d4037', {z:-14}); E3.cyl(1756, y, 5, 5, 30, '#5d4037', {z:-14}); }
    [[2000, 450, '#ef4b4b'], [2250, 520, '#3d7bff'], [2450, 430, '#ffd23f'], [800, 480, '#2fbf71']].forEach(([x, y, c]) => { E3.cyl(x, y, 2.5, 2.5, 110, '#eeeeee', {seg:6}); E3.mesh(new THREE.ConeGeometry(70, 30, 10), c, {}).position.set(x, 120, y); E3.plane(x + 50, y + 30, 50, 90, ['#ff6f91', '#4fc3f7', '#ffffff'][(x/250 | 0) % 3], {z:1}); });
    const navy = E3.model('warship', 1730, 900, 2.2, Math.PI); navy.userData.x = 1730; navy.userData.y = 900;
    E3.ticks.push((dt, t) => { navy.position.y = -6 + Math.sin(t*1.5)*3; navy.rotation.z = Math.sin(t*1.2)*.03; });
    const boats = [{x:600, y:1300, v:30}, {x:2300, y:1600, v:-24}]; boats.forEach(b => b.g = E3.model('sailboat', b.x, b.y, 1.2, b.v > 0 ? 0 : Math.PI));
    E3.ticks.push((dt, t) => boats.forEach((b, i) => { b.x += b.v*dt; if(b.x > W + 600) b.x = -600; if(b.x < -600) b.x = W + 600; b.g.position.set(b.x, -4 + Math.sin(t*1.3 + i)*3, b.y); }));
    signpost(600, 520, 'Cảng hải quân →'); signpost(2200, 520, '← Bãi tắm');
    I(1730, 700, 90, 'Lên tàu hải quân: bắn tên lửa vào tàu hải tặc', () => Missile.start(scene, navy));
    skyLife(W, H); break; }
  case 'hill': {
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#3f9a45', '#2e7d32');
    const mound = E3.mesh(new THREE.SphereGeometry(1, 32, 16), '#2f7a35', {flat:false}); mound.scale.set(900, 120, 460); mound.position.set(800, -114, 1200);
    const obs = E3.group(() => {
    E3.cyl(800, 700, 110, 110, 150, '#eceff1', {seg:24}); const dome = E3.mesh(new THREE.SphereGeometry(112, 24, 12, 0, Math.PI*2, 0, Math.PI/2), '#cfd8dc', {flat:false, metal:.3, rough:.4}); dome.position.set(800, 150, 700);
    E3.box(800, 640, 30, 120, 110, '#263238', {z:160}); const tube = E3.cyl(0, 0, 14, 18, 160, '#37474f', {metal:.4}); tube.position.set(800, 250, 650); tube.rotation.x = -.7;
    E3.box(800, 812, 60, 6, 80, '#ffd23f', {z:0, emit:.8}); }); E3.occluder(obs); B(700, 650, 200, 200);
    E3.label('ĐÀI THIÊN VĂN', {size:24, color:'#ffd23f', x:800, y:720, z:290});
    const N = 600, pos = new Float32Array(N*3); for(let i=0;i<N;i++){ const a = Math.random()*6.28, e = .08 + Math.random()*1.3; pos[i*3] = Math.cos(a)*Math.cos(e)*300; pos[i*3 + 1] = Math.sin(e)*300; pos[i*3 + 2] = Math.sin(a)*Math.cos(e)*300; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const stars = new THREE.Points(sg, new THREE.PointsMaterial({color:'#ffffff', size:1.6, sizeAttenuation:false, fog:false, transparent:true})); E3.scene.add(stars);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 10), new THREE.MeshBasicMaterial({color:'#fff8d6', fog:false})); E3.scene.add(moon);
    const shoot = new THREE.Mesh(new THREE.BoxGeometry(14, .3, .3), new THREE.MeshBasicMaterial({color:'#ffffff', fog:false, transparent:true})); E3.scene.add(shoot); let st = 9;
    E3.ticks.push((dt, t) => { stars.position.copy(E3.cam.position); stars.material.opacity = .7 + .3*Math.sin(t*2); moon.position.set(E3.cam.position.x + 80, E3.cam.position.y + 120, E3.cam.position.z - 220);
      st -= dt; if(st < 0){ st = 4 + Math.random()*5; shoot.userData = {x:E3.cam.position.x - 120 + Math.random()*200, y:E3.cam.position.y + 120, z:E3.cam.position.z - 230, a:0}; } const u = shoot.userData; if(u.a != null && u.a < 1){ u.a += dt*1.2; shoot.position.set(u.x + u.a*90, u.y - u.a*40, u.z); shoot.rotation.z = -.42; shoot.material.opacity = 1 - u.a; } else shoot.material.opacity = 0; });
    for(let k=0;k<6;k++){ const x = 200 + k*240, y = 1500; E3.cyl(x, y, 3, 3, 60, '#3e2723', {seg:6}); const l = E3.ball(x, y, 9, '#ffcc80', {z:58, emit:2, detail:0, cast:false}); }
    tree(150, 900, 'pine'); tree(1450, 900, 'pine'); borderTrees(Z, ['pine'], 200, 2);
    I(800, 880, 90, 'Ngắm kính viễn vọng: khám phá hệ Mặt Trời', () => UI.telescope());
    signpost(400, 1300, 'Ngắm sao băng ↑'); signpost(1200, 1300, 'Đài thiên văn ↑');
    break; }
  case 'talent': {
    room(W, H, '#7e57c2', '#ede7f6', '#e3dbf3', 'tile', 290);
    E3.board(900, 272, 180, 'LỚP NĂNG KHIẾU', {size:44, color:'#ffffff', bg:'rgba(0,0,0,0)', tilt:0});
    [['Âm nhạc', 300, '#ffd23f'], ['Hội họa', 900, '#ff6f91'], ['Rubik', 1500, '#2fbf71']].forEach(([n, x, c]) => { E3.plane(x, 450, 400, 300, c, {basic:true, opacity:.25, z:1}); E3.label(n, {size:20, color:'#4527a0', bg:'rgba(255,255,255,.8)', x, y:310, z:120}); });
    E3.box(300, 450, 170, 80, 60, '#111111', {z:30, rough:.3}); E3.box(300, 494, 160, 14, 4, '#fafafa', {z:72}); for(let k=0;k<6;k++) E3.box(250 + k*20, 492, 6, 8, 4, '#111111', {z:76}); [[-75, -30], [75, -30], [-75, 30], [75, 30]].forEach(([a, b]) => E3.box(300 + a, 450 + b, 8, 8, 30, '#111111')); E3.box(300, 420, 160, 6, 60, '#111111', {z:90});
    B(220, 420, 160, 70); I(300, 520, 80, 'Chơi đàn piano', () => UI.piano());
    const ez = E3.box(900, 440, 90, 70, 4, '#fafafa', {z:60}); ez.rotation.x = -1.2; E3.cyl(880, 450, 3, 3, 120, '#8d6e4a', {seg:5}); E3.cyl(920, 450, 3, 3, 120, '#8d6e4a', {seg:5});
    E3.box(880, 432, 30, 10, 4, '#ff6f91', {z:80}); E3.box(910, 438, 30, 10, 4, '#4fc3f7', {z:70}); I(900, 520, 80, 'Vẽ tranh', () => UI.paint());
    const cube = new THREE.Group(), cols = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#ffffff']; for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++) for(let c=-1;c<=1;c++) E3.box(a*22, c*22, 20, 20, 20, cols[(a + b*2 + c*3 + 9) % 6], {z:b*22 - 10, rough:.4}, cube);
    cube.position.set(1500, 70, 450); E3.root.add(cube); E3.cyl(1500, 450, 30, 34, 30, '#5e35b1'); E3.ticks.push((dt, t) => { cube.rotation.y = t*.6; cube.rotation.x = Math.sin(t*.4)*.3; });
    I(1500, 520, 80, 'Xoay Rubik (mẹo hay)', () => UI.rubikTips());
    break; }
  case 'sports': {
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#43a047', '#388e3c');
    E3.plane(1100, 750, 2000, 1100, '#c0533a', {z:.6}); E3.plane(1100, 750, 1760, 860, '#4caf50', {z:.8});
    for(let k=0;k<8;k++) E3.plane(300 + k*200 + 100, 750, 100, 740, '#53b857', {z:.9});
    const L = (x, y, w, h) => E3.plane(x, y, w, h, '#ffffff', {z:1.1});
    L(1100, 380, 1600, 5); L(1100, 1120, 1600, 5); L(300, 750, 5, 740); L(1900, 750, 5, 740); L(1100, 750, 5, 740);
    const ring = E3.mesh(new THREE.RingGeometry(86, 92, 40), '#ffffff', {cast:false}); ring.rotation.x = -Math.PI/2; ring.position.set(1100, 1.1, 750);
    [[380, 600], [1820, 600]].forEach(([x, y]) => { L(x, y, 160, 5); L(x, y + 300, 160, 5); L(x === 380 ? 460 : 1740, y + 150, 5, 300); });
    [[285, 1], [1915, -1]].forEach(([x, f]) => { [680, 820].forEach(y => E3.cyl(x, y, 4, 4, 80, '#ffffff', {seg:8})); const bar = E3.box(x, 750, 8, 148, 8, '#ffffff', {z:76}); const net = E3.box(x - f*20, 750, 40, 140, 76, '#ffffff', {basic:true, opacity:.25}); });
    for(let k=0;k<3;k++) E3.box(1100, 140 - k*30, 1600, 30, 20 + k*30, ['#1565c0', '#1e88e5', '#42a5f5'][k]);
    borderTrees(Z, ['oak', 'pine'], 200, 2);
    const ball = new THREE.Group(); E3.ball(0, 0, 12, '#ffffff', {detail:1, flat:true}, ball); for(let k=0;k<5;k++){ const p = E3.ball(0, 0, 4, '#222222', {detail:0}, ball); p.position.set(Math.cos(k*1.26)*9, 12 + Math.sin(k*1.26)*9, 5); }
    E3.root.add(ball); const bv = {x:0, y:0}, b = {x:1100, y:750}; scene.ball = b;
    out.ticks.push(dt => { const me = scene.me; if(me){ const dx = b.x - me.x, dy = b.y - (me.y - 6), dist = Math.hypot(dx, dy); if(dist < 26){ bv.x = dx/dist*420; bv.y = dy/dist*420; } }
      b.x += bv.x*dt; b.y += bv.y*dt; bv.x *= Math.pow(.4, dt); bv.y *= Math.pow(.4, dt); if(b.y < 390 || b.y > 1110){ bv.y *= -.8; b.y = Math.max(390, Math.min(1110, b.y)); }
      const inGoal = b.y > 680 && b.y < 820; if(b.x < 300 || b.x > 1900){ if(inGoal){ UI.toast('VÀOOO! Bàn thắng đẹp!'); NET.reward('goal', 'Ghi bàn'); E3.burst(b.x, b.y, 40, {n:40, colors:['#ffd23f', '#ef4b4b', '#3d7bff', '#ffffff'], speed:300, up:.8, gravity:400, size:10, grow:1, life:1.4}); b.x = 1100; b.y = 750; bv.x = bv.y = 0; E3.shake(.25, .2); } else { bv.x *= -.8; b.x = Math.max(300, Math.min(1900, b.x)); } }
      ball.position.set(b.x, 0, b.y); ball.rotation.x += bv.y*dt/12; ball.rotation.z -= bv.x*dt/12; });
    signpost(1000, 180, 'Sân bóng: chạm bóng để sút!'); skyLife(W, H); break; }
  case 'gym': {
    room(W, H, '#37474f', '#cfd8dc', '#c3ccd0', 'tile', 250);
    E3.board(800, 232, 170, 'GYM & VÕ THUẬT', {size:44, color:'#ffd23f', bg:'rgba(0,0,0,0)', tilt:0});
    E3.box(1180, 610, 560, 420, 10, '#1565c0'); E3.box(1180, 610, 520, 380, 2, '#ef6464', {z:10}); E3.label('Võ đường', {size:20, color:'#fff', bg:'rgba(0,0,0,.4)', x:1180, y:440, z:30});
    const bag = new THREE.Group(); bag.position.set(400, 200, 470); E3.root.add(bag); E3.cyl(0, 0, 2, 2, 70, '#5d4037', {z:-70, seg:5}, bag); E3.cyl(0, 0, 22, 22, 100, '#c62828', {z:-170, seg:12}, bag);
    E3.box(400, 470, 120, 10, 10, '#455a64', {z:200}); E3.box(345, 470, 10, 10, 200, '#455a64'); E3.box(455, 470, 10, 10, 200, '#455a64');
    bag.userData = {x:400, kick:0, a:0, v:0}; scene.bag = bag; B(370, 420, 60, 70);
    E3.ticks.push(dt => { const u = bag.userData; if(u.kick){ u.v += u.kick*6; u.kick = 0; } u.v += -u.a*40*dt; u.v *= Math.pow(.2, dt); u.a += u.v*dt; bag.rotation.z = u.a; });
    I(400, 560, 80, 'Đấm bao cát (bấm E liên tục)', () => UI.punch(scene));
    for(let k=0;k<3;k++){ E3.box(205 + k*120, 780, 90, 40, 24, '#455a64'); E3.box(205 + k*120, 770, 90, 20, 10, '#212121', {z:24}); }
    for(let k=0;k<3;k++){ const x = 1024 + k*140; E3.cyl(x, 595, 6, 6, 90, '#8d6e4a', {seg:8}); E3.ball(x, 595, 16, '#a1887f', {z:84}); E3.box(x, 595, 50, 6, 6, '#8d6e4a', {z:70}); }
    break; }
  case 'town': {
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#8bc34a', '#7cb342');
    E3.plane(W/2, 820, W + 3000, 80, '#8e8e8e', {z:1}); for(let x=-1400; x<W + 1400; x+=80) E3.plane(x, 818, 40, 4, '#fafafa', {z:1.5}); E3.plane(1200, 470, 100, 620, '#bdbdbd', {z:.8});
    [['my', 330], ['chauau', 830], ['nhat', 1330], ['y', 1830], ['vn', 2330]].forEach(([s, x]) => { House3D(s, x, 715); E3.plane(x, 745, 70, 60, '#d7ccc8', {z:.9}); B(x - 170, 470, 340, 245); });
    signpost(1330, 330, '↓ Các ngôi nhà, bấm cửa để vào');
    for(let i=0;i<20;i++) tree(80 + i*130, 1100 + (i % 2)*120, i % 3 ? 'oak' : 'sakura', .9);
    borderTrees(Z, ['oak', 'sakura', 'pine'], 200, 2); skyLife(W, H);
    for(let x=150; x<W; x+=500) E3.scatter('lamp', [[x, 870, .9, Math.PI]]);
    break; }
  case 'interior': Interior3D(Z.style, W, H, B, I); break;
  case 'park': {
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#9ccc65', '#8bc34a');
    [['#ff8a80', 900, 560, 'Điều bạn YÊU'], ['#82b1ff', 1300, 560, 'Điều bạn GIỎI'], ['#b9f6ca', 900, 900, 'Điều thế giới CẦN'], ['#ffe57f', 1300, 900, 'Điều được TRẢ CÔNG']].forEach(([c, x, y, t], i) => {
      E3.disc(x, y, 260, 260, c, {basic:true, opacity:.4, z:1 + i*.3}); const lb = E3.board(x + (x < 1100 ? -110 : 110), y + (y < 700 ? -150 : 150), 3, t, {size:18, color:'#33691e', bg:'rgba(255,255,255,.75)', tilt:-Math.PI/2}); });
    E3.board(1100, 730, 4, 'IKIGAI', {size:40, color:'#1b5e20', bg:'rgba(255,255,255,0)', tilt:-Math.PI/2});
    E3.water(120, 290, 360, 220, {ellipse:true, amp:1, z:-2, shallow:'#6fe3f2'}); E3.disc(300, 400, 196, 126, '#8d6e63', {z:-.5}); B(130, 300, 340, 200);
    E3.scatter('rock', [[140, 330, .5], [470, 450, .6], [300, 520, .4]]);
    for(let k=0;k<6;k++) tree(200 + k*360, 200, 'sakura', 1.2);
    [[700, 400], [1500, 400], [700, 1080], [1500, 1080]].forEach(([x, y]) => { E3.box(x, y, 80, 40, 30, '#8d6e4a'); const tex = E3.noiseTex('#ebecd0', '#739552', 'check'); tex.repeat.set(2, 1); const bd = E3.mesh(new THREE.PlaneGeometry(64, 32), new THREE.MeshStandardMaterial({map:tex}), {cast:false}); bd.rotation.x = -Math.PI/2; bd.position.set(x, 31, y);
      E3.cyl(x - 56, y, 10, 10, 18, '#6d4c2e', {seg:8}); E3.cyl(x + 56, y, 10, 10, 18, '#6d4c2e', {seg:8}); B(x - 40, y - 20, 80, 36); I(x, y + 40, 70, 'Bàn cờ vua: chơi hoặc thách đấu', () => UI.chess(scene)); });
    E3.scatter('statue', [[1810, 1220, .7], [1880, 1220, .7], [1950, 1220, .7], [2020, 1220, .7]]); E3.scatter('bench', [[500, 700, .9, Math.PI/2], [1700, 700, .9, -Math.PI/2]]); E3.scatter('flowers', [[900, 1230, 1], [1300, 1230, 1], [600, 900, .8], [1600, 560, .8]]);
    E3.scatter('lamp', [[700, 730, .9], [1500, 730, .9]]); E3.model('fountain', 1900, 560, 1); B(1840, 520, 120, 80);
    borderTrees(Z, ['sakura', 'oak', 'oak'], 190, 2); skyLife(W, H);
    break; }
  case 'mall': {
    room(W, H, '#263238', '#f5f5f5', '#eaeaea', 'tile', 160);
    E3.board(900, 142, 160, 'TRUNG TÂM MUA SẮM RUBIK', {size:40, color:'#ffd23f', bg:'rgba(0,0,0,0)', tilt:0});
    [['bike', 'Xe đạp', 300, 420, '#3d7bff'], ['chess', 'Bộ cờ vua', 900, 420, '#5d4037'], ['hat', 'Thời trang', 1500, 420, '#ff6f91'], ['seed', 'Hạt giống & làm vườn', 900, 900, '#2fbf71']].forEach(([k, n, x, y, c]) => {
      E3.occluder(E3.group(() => { E3.box(x, y - 70, 360, 30, 120, '#fafafa'); const aw = E3.box(x, y - 40, 380, 70, 10, c, {z:120}); aw.rotation.x = .35; E3.board(x, y - 50, 140, n, {size:20, color:'#ffffff', bg:c, tilt:0}); }));
      E3.box(x, y + 50, 360, 40, 50, '#8d6e4a'); E3.box(x, y + 50, 364, 44, 4, shadeHex(c, .2), {z:50}); B(x - 180, y - 120, 360, 190);
      if(k === 'bike'){ const g = new THREE.Group(); g.position.set(x - 80, 54, y + 40); g.rotation.y = Math.PI/2; E3.root.add(g); Bike3D('city', '#ef4b4b', g); const g2 = new THREE.Group(); g2.position.set(x + 80, 54, y + 40); g2.rotation.y = Math.PI/2; E3.root.add(g2); Bike3D('mtb', '#3d7bff', g2); }
      if(k === 'chess'){ const tex = E3.noiseTex('#ebecd0', '#739552', 'check'); const bd = E3.mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({map:tex}), {cast:false}); bd.rotation.x = -Math.PI/2; bd.position.set(x, 55, y + 50); for(let i=0;i<6;i++) E3.cyl(x - 30 + i*12, y + 30, 4, 3, 14, i % 2 ? '#212121' : '#fafafa', {z:55, seg:8}); }
      if(k === 'hat'){ E3.mesh(new THREE.ConeGeometry(24, 14, 14), '#e8d29a', {}).position.set(x - 80, 62, y + 50); E3.ball(x, y + 50, 14, '#ef4b4b', {z:50, sy:.6}); const cr = E3.cyl(x + 80, y + 50, 13, 13, 10, '#ffd23f', {z:54, metal:.6, rough:.3}); }
      if(k === 'seed') for(let i=0;i<5;i++) E3.box(x - 120 + i*60, y + 50, 30, 14, 36, ['#ff8a00', '#e53935', '#fdd835', '#ffca28', '#fb8c00'][i], {z:52});
      I(x, y + 110, 90, `Mua sắm: ${n}`, () => UI.shop(k)); });
    E3.scatter('bush', [[100, 1100, .8], [1700, 1100, .8], [100, 300, .8], [1700, 300, .8]]);
    signpost(1240, 260, 'Chào mừng! Bấm E ở quầy để mua'); break; }
  case 'farm': { Farm.build(scene, W, H, I, B, out); break; }
  case 'garden': {
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#8bc34a', '#7cb342'); E3.box(W/2, 150, W + 200, 20, 60, '#5d4037');
    for(let x=0; x<=W; x+=80) E3.box(x, 150, 10, 24, 80, '#6d4c2e');
    E3.board(800, 170, 90, 'KHU VƯỜN · MUA ĐẤT, GIEO HẠT, TƯỚI NƯỚC, THU HOẠCH', {size:22, color:'#fff', bg:'#5d4037', tilt:-.3});
    for(let i=0;i<SHARED.PLOT_COUNT;i++){ const x = 200 + (i % 4)*340, y = 320 + Math.floor(i/4)*230; I(x + 110, y + 150, 100, 'Mảnh vườn số ' + (i + 1), () => UI.garden(i)); }
    out.ticks.push(Garden3D()); borderTrees(Z, ['oak', 'sakura'], 220, 2); skyLife(W, H);
    break; }
  }
  // exits & signposts
  Z.exits.forEach(e => { exitMarker(e); const side = e.w < e.h, sx = side ? (e.x < W/2 ? e.x + 90 : e.x - 50) : e.x + e.w + 60, sy = side ? e.y - 30 : e.y < Z.walk[1] + 60 ? e.y + 60 : e.y + 10; if(Z.theme !== 'town' || e.to === 'duongchinh') signpost(sx, sy, e.label); });
  Object.entries(W3.trees).forEach(([k, list]) => E3.scatter(k, list));
  return out;
}
// ---------- town houses in five architectural styles ----------
function prism(x, y, w, d, h, col, z){ const sh = new THREE.Shape(); sh.moveTo(-d/2, 0); sh.lineTo(d/2, 0); sh.lineTo(0, h); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, {depth:w, bevelEnabled:false}); g.translate(0, 0, -w/2); g.rotateY(Math.PI/2); const m = E3.mesh(g, col, {}); m.position.set(x, z, y); return m; }
function House3D(s, x, y){ E3.occluder(E3.group(() => House3Dparts(s, x, y))); }
function House3Dparts(s, x, y){
  const bx = y - 120;
  const roof = (w, d, h, col, z) => { const g = new THREE.CylinderGeometry(1, 1, 1, 4); g.rotateY(Math.PI/4); const m = E3.mesh(g, col, {}); m.scale.set(w*.72, h, d*.72); m.position.set(x, z + h/2, bx); return m; };
  const win = (dx, z, w, h, c) => E3.box(x + dx, y - 1, w, 4, h, c || '#90caf9', {z, rough:.15});
  if(s === 'my'){ E3.box(x, bx, 320, 220, 180, '#eceff1'); roof(380, 260, 90, '#455a64', 180); E3.box(x, y + 10, 340, 30, 10, '#fafafa'); for(let k=0;k<5;k++) E3.box(x - 160 + k*80, y + 20, 8, 8, 70, '#fafafa', {z:10}); E3.box(x, y + 20, 340, 40, 6, '#fafafa', {z:80});
    E3.box(x, y, 60, 4, 100, '#1565c0'); win(-95, 110, 50, 40); win(95, 110, 50, 40); E3.box(x + 125, bx, 14, 14, 60, '#e53935', {z:220}); }
  else if(s === 'chauau'){ E3.box(x, bx, 340, 220, 220, '#bcaaa4'); [-150, 150].forEach(dx => { E3.cyl(x + dx, y - 20, 34, 34, 280, '#a1887f', {seg:10}); const c = E3.mesh(new THREE.ConeGeometry(40, 70, 10), '#4e342e', {}); c.position.set(x + dx, 315, y - 20); });
    E3.box(x, bx, 340, 220, 10, '#ffd23f', {z:220}); E3.box(x, y, 60, 4, 110, '#3e2723'); E3.cyl(x, y, 30, 30, 4, '#3e2723', {z:110, seg:12}).rotation.x = Math.PI/2; for(let k=0;k<4;k++) win(-105 + k*70, 140, 30, 50); }
  else if(s === 'nhat'){ E3.box(x, bx, 300, 200, 150, '#d7ccc8'); E3.box(x, bx, 400, 290, 10, '#37474f', {z:150}); roof(360, 250, 70, '#37474f', 160);
    for(let k=0;k<6;k++){ E3.box(x - 120 + k*48, y - 18, 40, 4, 100, '#fff8e1', {z:20}); E3.box(x - 144 + k*48, y - 18, 3, 6, 100, '#8d6e4a', {z:20}); } E3.cyl(x - 185, y + 10, 8, 8, 40, '#c62828', {seg:8}); }
  else if(s === 'y'){ E3.box(x, bx, 340, 220, 190, '#ffe0b2'); roof(380, 250, 60, '#d84315', 190); for(let k=0;k<4;k++){ win(-120 + k*80, 30, 40, 90, '#fff3e0'); E3.cyl(x - 120 + k*80, y, 20, 20, 4, '#fff3e0', {z:120, seg:12}).rotation.x = Math.PI/2; }
    E3.box(x, y + 1, 60, 4, 100, '#6d4c2e'); [-200, 200].forEach(dx => E3.mesh(new THREE.ConeGeometry(14, 180, 8), '#2e7d32', {}).position.set(x + dx, 90, y - 20)); }
  else { E3.box(x, bx, 340, 200, 150, '#bcaaa4'); roof(400, 270, 80, '#b71c1c', 150); [-165, 165].forEach(dx => E3.box(x + dx, y - 10, 12, 12, 150, '#5d4037'));
    for(let k=0;k<3;k++) E3.box(x - 80 + k*80, y + 1, 60, 4, 110, '#6d4c2e'); E3.box(x, y + 2, 80, 4, 20, '#ffd23f', {z:120}); [-212, 212].forEach(dx => E3.cyl(x + dx, y - 40, 9, 9, 24, '#e53935', {z:90, seg:8, emit:.6})); E3.scatter('palm', [[x - 250, y - 20, .9]]); }
}
// ---------- house interiors ----------
function Interior3D(s, W, H, B, I){
  const P = {my:['#eceff1','#a1887f','#8d6e4a','wood','Phong cách Mỹ: phòng khách ấm cúng'], chauau:['#efebe9','#5d4037','#4e342e','wood','Quý tộc châu Âu: đèn chùm, thảm đỏ, đàn dương cầm'], nhat:['#f1e9d2','#d8c99a','#c9b07a','tile','Nhật Bản: chiếu tatami, cửa giấy, bonsai'], y:['#ffe0b2','#d84315','#ef6c00','check','Biệt thự Ý: gạch nung, mái vòm, đài phun nước'], vn:['#efe2c6','#b23c17','#c1440e','check','Nhà Việt ba gian: sập gụ, tủ chè, tranh Đông Hồ']}[s];
  room(W, H, P[0], P[1], P[2], P[3]);
  E3.label(P[4], {size:18, color:'#3e2723', bg:'rgba(255,255,255,.8)', x:W/2, y:215, z:150});
  const F = (x, y, w, h, c, t, ht) => { const g = E3.group(() => { E3.box(x + w/2, y + h/2, w, h, ht || 50, c); E3.box(x + w/2, y + h/2, w, h, 4, shadeHex(c, .25), {z:ht || 50}); }); if((ht || 50) > 60) E3.occluder(g); if(t) E3.label(t, {size:12, color:'#3e2723', bg:'rgba(255,255,255,.75)', x:x + w/2, y:y + h/2, z:(ht || 50) + 14}); B(x, y, w, h); };
  if(s === 'my'){ F(120, 300, 260, 70, '#1565c0', 'Sofa', 40); E3.box(250, 300, 260, 16, 70, '#0d47a1'); F(160, 400, 180, 60, '#8d6e4a', 'Bàn trà', 30); F(500, 260, 200, 60, '#212121', 'TV & kệ', 40); E3.box(600, 205, 160, 6, 90, '#111111', {z:60}); F(820, 260, 180, 120, '#bcaaa4', 'Lò sưởi', 120); E3.box(910, 382, 80, 6, 40, '#ff7043', {z:10, emit:1.5}); F(860, 470, 200, 120, '#c62828', 'Bàn ăn', 46); E3.plane(600, 550, 240, 140, '#b0bec5', {z:1}); }
  if(s === 'chauau'){ E3.plane(600, 480, 200, H - 200, '#b71c1c', {z:1}); F(100, 300, 240, 120, '#212121', 'Đàn dương cầm', 60); F(860, 300, 220, 80, '#7b1fa2', 'Ghế nhung', 40); F(820, 480, 300, 100, '#6d4c41', 'Bàn tiệc', 46); for(let k=0;k<3;k++){ E3.ball(300 + k*300, 300, 22, '#ffd23f', {z:220, metal:.6, rough:.3}); E3.ball(300 + k*300, 300, 10, '#fff59d', {z:210, emit:2}); E3.cyl(300 + k*300, 300, 1, 1, 60, '#ffd23f', {z:260}); } E3.model('chest', 220, 555, .9); B(140, 520, 160, 70); E3.label('Rương báu', {size:12, color:'#3e2723', bg:'rgba(255,255,255,.75)', x:220, y:555, z:60}); }
  if(s === 'nhat'){ F(480, 400, 240, 90, '#5d4037', 'Bàn thấp (chabudai)', 22); for(const [x, y] of [[440, 380], [740, 380], [440, 500], [740, 500]]) E3.box(x + 20, y + 15, 40, 30, 6, '#c62828'); F(120, 280, 80, 80, '#8d6e4a', 'Bonsai', 30); E3.ball(160, 320, 30, '#2e7d32', {z:30}); F(1000, 280, 80, 120, '#fff8e1', 'Đèn lồng', 90); E3.ball(1040, 340, 22, '#ffcc80', {z:94, emit:1.5});
    for(let k=0;k<8;k++) E3.box(120 + k*140, 196, 120, 4, 150, '#fff8e1', {z:20}); }
  if(s === 'y'){ E3.model('fountain', 600, 380, .9); B(480, 320, 240, 120); E3.label('Đài phun nước', {size:12, color:'#3e2723', bg:'rgba(255,255,255,.75)', x:600, y:380, z:110}); F(120, 300, 260, 100, '#c62828', 'Bàn ăn khăn ca rô', 46); F(880, 300, 80, 100, '#558b2f', 'Cây ô liu', 30); E3.ball(920, 350, 40, '#689f38', {z:40}); F(1000, 480, 120, 80, '#6d4c2e', 'Tủ rượu nho', 100); }
  if(s === 'vn'){ F(460, 280, 280, 90, '#4e342e', 'Sập gụ', 34); F(120, 280, 200, 110, '#3e2723', 'Tủ chè', 80); F(900, 280, 180, 90, '#6d4c2e', 'Bộ bàn ghế gỗ', 40); F(140, 500, 70, 70, '#8d6e4a', 'Chum nước', 50); F(980, 500, 60, 90, '#e53935', 'Đèn lồng', 60); E3.ball(1010, 545, 20, '#ffcc80', {z:62, emit:1.5});
    for(let k=0;k<3;k++) E3.box(260 + k*330, 196, 160, 4, 110, ['#e53935', '#43a047', '#fdd835'][k], {z:50}); for(let k=0;k<4;k++) E3.box(107 + k*330, 196, 14, 14, 300, '#5d4037'); }
  I(W/2, 620, 120, 'Cảm nhận kiến trúc ngôi nhà', () => UI.toast(P[4]));
}
// ---------- garden plots (instanced crops, refreshed twice a second) ----------
function Garden3D(){
  const N = SHARED.PLOT_COUNT, per = 20, stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2, 1.6, 1, 5), E3.mat('#2e7d32'), N*per), leaf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), E3.mat('#43a047'), N*per*2), fruit = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({flatShading:true, roughness:.6}), N*per);
  [stem, leaf, fruit].forEach(m => { m.castShadow = true; E3.root.add(m); }); const labels = [], bars = [], dummy = new THREE.Object3D();
  for(let i=0;i<N;i++){ const x = 200 + (i % 4)*340, y = 320 + Math.floor(i/4)*230; const soil = E3.box(x + 110, y + 70, 220, 140, 12, '#6d4c2e'); soil.userData.plot = i; for(let r=0;r<4;r++) E3.box(x + 110, y + 22 + r*32, 208, 10, 6, '#5d4037', {z:12});
    labels.push(E3.label('', {size:13, color:'#3e2723', bg:'rgba(255,248,225,.9)', x:x + 110, y:y - 6, z:30})); bars.push(E3.box(x + 10, y + 146, 1, 6, 3, '#2fbf71', {z:12})); labels[i].userData.txt = ''; labels[i].userData.soil = soil; }
  let t = 0; return dt => { t -= dt; if(t > 0) return; t = .5; const now = Date.now();
    G.plots.forEach((pl, i) => { const x = 200 + (i % 4)*340, y = 320 + Math.floor(i/4)*230, lb = labels[i]; lb.userData.soil.material = E3.mat(pl.owner ? '#6d4c2e' : '#a1887f');
      const txt = `${i + 1}. ${pl.owner ? pl.owner : 'Đất trống · ' + SHARED.PLOT_PRICE + ' xu'}${pl.crop ? ' · ' + SHARED.CROPS[pl.crop].name : ''}${pl.water ? ' · 💧' + pl.water : ''}`; if(txt !== lb.userData.txt){ lb.userData.txt = txt; lb.userData.setText(txt); }
      let f = 0, C = null; if(pl.crop){ C = SHARED.CROPS[pl.crop]; const need = C.grow*1000/(1 + pl.water*.5); f = Math.min(1, (now - pl.plantedAt)/need); }
      bars[i].scale.x = Math.max(1, 200*f); bars[i].position.x = x + 10 + 100*f; bars[i].material = E3.mat(f >= 1 ? '#ffd23f' : '#2fbf71');
      for(let k=0;k<per;k++){ const r = k/5 | 0, c = k % 5, px = x + 26 + c*42, py = y + 22 + r*32, h = f ? 4 + f*24 : .001, id = i*per + k;
        dummy.position.set(px, 12 + h/2, py); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, h, 1); dummy.updateMatrix(); stem.setMatrixAt(id, dummy.matrix);
        [-1, 1].forEach((sd, j) => { dummy.position.set(px + sd*4, 12 + h*(.55 + j*.2), py); dummy.scale.setScalar(f ? 2 + f*4 : .001); dummy.updateMatrix(); leaf.setMatrixAt(id*2 + j, dummy.matrix); });
        dummy.position.set(px, 14 + h, py); dummy.scale.setScalar(f >= 1 ? 6 : .001); dummy.updateMatrix(); fruit.setMatrixAt(id, dummy.matrix); fruit.setColorAt(id, new THREE.Color(C ? C.color : '#ffffff')); } });
    [stem, leaf, fruit].forEach(m => { m.instanceMatrix.needsUpdate = true; if(m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); }); };
}
// ---------- missile strike on pirates (3D motion scene) ----------
const Missile = {
  start(scene, navy){
    if(scene.missileBusy) return; scene.missileBusy = true;
    const px = Math.min(scene.Z.w - 140, navy.userData.x + 640), py = 1080, pir = E3.model('pirate', px + 900, py, 2.4, Math.PI); const ps = {x:px + 900};
    const tag = pir.userData.tag = E3.label('TÀU HẢI TẶC!', {size:20, color:'#ff5252', bg:'rgba(0,0,0,.6)', x:ps.x, y:py, z:420});
    E3.ticks.push(pir.userData.tick = (dt, t) => { ps.x += (px - ps.x)*Math.min(1, dt*1.4); if(!pir.userData.sinking){ pir.position.set(ps.x, -6 + Math.sin(t*1.6)*4, py); pir.rotation.z = Math.sin(t*1.3)*.05; tag.position.x = ps.x; } else tag.visible = false; });
    E3.camOverride = {x:(navy.userData.x + px)/2, y:930, zoom:1.7}; UI.toast('Phát hiện tàu hải tặc! Bấm nút PHÓNG TÊN LỬA (hoặc phím Space)');
    const wrap = document.createElement('div'); Object.assign(wrap.style, {position:'fixed', left:0, right:0, bottom:'150px', display:'flex', justifyContent:'center', zIndex:5, pointerEvents:'none'});
    const btn = document.createElement('button'); btn.className = 'primary fire'; btn.textContent = '🚀 PHÓNG TÊN LỬA'; Object.assign(btn.style, {fontSize:'22px', padding:'12px 22px', pointerEvents:'auto'}); wrap.appendChild(btn); document.body.appendChild(wrap);
    const key = e => { if(e.code === 'Space'){ e.preventDefault(); go(); } };
    const go = () => { if(!wrap.isConnected) return; wrap.remove(); document.removeEventListener('keydown', key); Missile.fire(scene, navy, pir, px, py); };
    btn.onclick = go; document.addEventListener('keydown', key); scene.onLeave.push(() => { wrap.remove(); document.removeEventListener('keydown', key); scene.missileBusy = false; });
  },
  fire(scene, navy, pir, tx, ty){
    const sx = navy.userData.x - 60, sy = navy.userData.y, m = new THREE.Group(); E3.cyl(0, 0, 6, 6, 50, '#eceff1', {z:-25, seg:10}, m); const tip = E3.mesh(new THREE.ConeGeometry(6, 18, 10), '#e53935', {}, m); tip.position.y = 34; [0, 1, 2, 3].forEach(k => { const f = E3.box(0, 0, 2, 14, 14, '#455a64', {z:-26}, m); f.rotation.y = k*Math.PI/2; f.position.x = Math.sin(k*Math.PI/2)*6; f.position.z = Math.cos(k*Math.PI/2)*6; });
    E3.root.add(m); E3.flash(150); E3.shake(.4, .25); Snd.launch();
    const P0 = new THREE.Vector3(sx, 150, sy), P1 = new THREE.Vector3((sx + tx)/2, 900, (sy + ty)/2 - 100), P2 = new THREE.Vector3(tx, 60, ty), curve = new THREE.QuadraticBezierCurve3(P0, P1, P2); let a = 0, smokeT = 0;
    const tick = dt => { a = Math.min(1, a + dt/2.2); const e = a*a*(3 - 2*a)*.5 + a*a*.5, p = curve.getPoint(e), q = curve.getPoint(Math.min(1, e + .01)); m.position.copy(p); m.lookAt(E3.root.localToWorld(q.clone())); m.rotateX(Math.PI/2);
      E3.camOverride = {x:p.x, y:p.z + 200, h:p.y*.6, zoom:1.6};
      smokeT -= dt; if(smokeT < 0){ smokeT = .03; E3.burst(p.x, p.z, p.y, {n:2, colors:['#eeeeee', '#bdbdbd'], speed:20, life:1.4, size:26, grow:3}); E3.burst(p.x, p.z, p.y, {n:1, colors:['#ffeb3b', '#ff9800'], speed:10, life:.25, size:22, grow:.2, add:true}); }
      if(a >= 1){ E3.ticks.splice(E3.ticks.indexOf(tick), 1); E3.root.remove(m); Missile.boom(scene, tx, ty, pir); } };
    E3.ticks.push(tick);
  },
  boom(scene, x, y, pir){
    E3.flash(500); E3.shake(.9, .6); Snd.boom();
    E3.burst(x, y, 80, {n:90, colors:['#ffffff', '#ffeb3b', '#ff9800', '#ff3d00'], speed:520, life:1.2, size:40, grow:.3, add:true});
    E3.burst(x, y, 80, {n:40, colors:['#424242', '#616161', '#757575'], speed:160, up:.9, life:2.6, size:70, grow:3});
    E3.burst(x, y, 60, {n:24, colors:['#3e2723', '#5d4037'], speed:420, up:.7, gravity:900, life:1.6, size:16, grow:1});
    const bum = E3.label('BÙM!', {size:90, color:'#ffeb3b', stroke:'#d84315', x, y, z:200, depthTest:false}); const s0 = bum.scale.clone(); let bt = 0;
    const tick = dt => { bt += dt; const k = bt < .4 ? .2 + bt*2.75 : bt < 1.1 ? 1.3 : Math.max(0, 1.3 - (bt - 1.1)*3); bum.scale.set(s0.x*k, s0.y*k, 1); if(bt > 1.6){ E3.ticks.splice(E3.ticks.indexOf(tick), 1); E3.root.remove(bum); } };
    E3.ticks.push(tick); E3.camOverride = {x, y:y - 100, zoom:1.5};
    pir.userData.sinking = true; let st = 0; const sink = dt => { st += dt; pir.rotation.z = Math.min(.5, st*.2); pir.position.y = -6 - st*st*20; if(st > 3){ E3.ticks.splice(E3.ticks.indexOf(sink), 1); E3.ticks.splice(E3.ticks.indexOf(pir.userData.tick), 1); E3.root.remove(pir); E3.root.remove(pir.userData.tag); scene.missileBusy = false; E3.camOverride = null; } };
    setTimeout(() => E3.ticks.push(sink), 300);
    NET.reward('pirate', 'Đánh chìm tàu hải tặc'); setTimeout(() => UI.toast('Đánh chìm tàu hải tặc! Biển cả bình yên trở lại.'), 900);
  }
};
// ---------- cage-free community farm: animals roam freely, a sheepdog herds the flock ----------
function Animal3D(kind){
  const g = new THREE.Group(), legs = [], L = (x, z, h, c) => { const p = new THREE.Group(); p.position.set(x, h, z); g.add(p); E3.box(0, 0, 4, 4, h, c, {z:-h}, p); legs.push(p); };
  const Q = (bodyCol, w, l, h, legC, legH, headC, hs) => { E3.box(0, 0, w, l, h, bodyCol, {z:legH, flat:false}, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => L(a*w*.32, b*l*.32, legH, legC)); const hd = E3.box(0, l/2 + hs*.35, hs, hs, hs, headC, {z:legH + h*.6}, g); return hd; };
  if(kind === 'sheep'){ g.add(E3.ball(0, 0, 13, '#fafafa', {z:6, detail:1})); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => L(a*6, b*7, 8, '#37474f')); E3.box(0, 14, 9, 10, 10, '#37474f', {z:14}, g); }
  else if(kind === 'cow'){ Q('#fafafa', 22, 40, 20, '#5d4037', 14, '#fafafa', 14); E3.box(-6, -4, 10, 14, 1, '#212121', {z:34.5}, g); E3.box(6, 8, 8, 10, 1, '#212121', {z:34.5}, g); E3.box(0, 29, 10, 4, 6, '#f8bbd0', {z:22}, g); }
  else if(kind === 'goat'){ Q('#d7ccc8', 14, 26, 14, '#8d6e63', 12, '#d7ccc8', 10); [-3, 3].forEach(x => { const h = E3.mesh(new THREE.ConeGeometry(1.5, 8, 4), '#6d4c41', {}, g); h.position.set(x, 38, 16); h.rotation.x = -.5; }); }
  else if(kind === 'horse'){ Q('#8d5524', 18, 44, 18, '#4e342e', 26, '#8d5524', 12); const n = E3.box(0, 24, 10, 10, 26, '#8d5524', {z:40}, g); n.rotation.x = -.5; E3.box(0, 24, 3, 14, 18, '#3e2723', {z:46}, g); }
  else if(kind === 'dog'){ Q('#212121', 10, 22, 10, '#3e2723', 9, '#212121', 10); E3.box(0, 4, 10.5, 8, 6, '#fafafa', {z:9}, g); E3.box(0, 19, 5, 6, 4, '#fafafa', {z:14}, g); const t = E3.box(0, -13, 3, 10, 3, '#212121', {z:17}, g); t.rotation.x = .6; }
  else if(kind === 'chicken'){ E3.ball(0, 0, 6, '#fff8e1', {z:4, detail:0}, g); E3.ball(0, 5, 4, '#fff8e1', {z:11, detail:0}, g); E3.box(0, 6, 1.5, 4, 3, '#e53935', {z:18}, g); E3.box(0, 10, 2, 3, 2, '#ffb300', {z:13}, g); L(-2, 0, 4, '#ffb300'); L(2, 0, 4, '#ffb300'); }
  else if(kind === 'duck'){ E3.ball(0, 0, 7, '#ffffff', {z:-2, detail:0, sy:.7}, g); E3.ball(0, 6, 4, '#2e7d32', {z:6, detail:0}, g); E3.box(0, 11, 3, 5, 2, '#ffb300', {z:9}, g); }
  g.userData.legs = legs; E3.root.add(g); return g;
}
const Farm = {
  build(scene, W, H, I, B, out){
    E3.ground(-1500, -1500, W + 3000, H + 3000, '#8fc757', '#7cb342');
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3, 0), new THREE.MeshStandardMaterial({flatShading:true}), 260), dm = new THREE.Object3D();
    for(let i=0;i<260;i++){ dm.position.set((i*131) % W, 3, 180 + (i*71) % (H - 200)); dm.updateMatrix(); fl.setMatrixAt(i, dm.matrix); fl.setColorAt(i, new THREE.Color(['#fff176','#f8bbd0','#ffffff','#b39ddb'][i % 4])); } E3.root.add(fl);
    E3.water(1640, 380, 520, 280, {ellipse:true, amp:1, z:-2, shallow:'#6fe3f2'}); E3.disc(1900, 520, 268, 148, '#8d6e63', {z:-.5}); B(1660, 400, 480, 230);
    for(let k=0;k<8;k++) E3.mesh(new THREE.ConeGeometry(6, 40, 5), '#66bb6a', {}).position.set(1660 + k*60, 20, 660 + (k % 2)*10);
    E3.occluder(E3.group(() => { E3.box(340, 360, 360, 220, 160, '#b71c1c'); E3.box(340, 470, 140, 4, 140, '#3e2723'); E3.box(340, 470, 120, 6, 30, '#ffe082', {z:100}); prism(340, 360, 400, 250, 90, '#7f0000', 160); }));
    E3.label('Kho cỏ mở · không chuồng', {size:16, color:'#fff8e1', bg:'rgba(0,0,0,.45)', x:340, y:470, z:280}); B(160, 250, 360, 80);
    for(let k=0;k<5;k++){ const h = E3.cyl(620 + k*46, 435, 18, 18, 36, '#ffca28', {seg:10}); h.rotation.x = Math.PI/2; h.position.y = 18; }
    const meadow = {x:1100, y:420, r:200}; E3.disc(meadow.x, meadow.y, meadow.r, meadow.r, '#c5e1a5', {z:1}); const ring = E3.mesh(new THREE.RingGeometry(meadow.r - 4, meadow.r + 4, 48), '#ffffff', {cast:false}); ring.rotation.x = -Math.PI/2; ring.position.set(meadow.x, 1.5, meadow.y);
    E3.label('Đồng cỏ xanh: lùa cả đàn cừu vào đây!', {size:16, color:'#33691e', bg:'rgba(255,255,255,.8)', x:meadow.x, y:meadow.y - meadow.r - 10, z:30});
    for(let k=0;k<10;k++) tree(60 + k*250, 150, k % 3 ? 'oak' : 'sakura', 1); borderTrees(scene.Z, ['oak', 'pine', 'sakura'], 220, 2); skyLife(W, H);
    E3.scatter('flowers', [[900, 1100, 1], [1700, 900, 1]]);
    signpost(900, 1180, 'Nông trại cộng sinh · thả tự do');
    const A = []; const add = (kind, n, x, y, spread) => { for(let i=0;i<n;i++) A.push({kind, x:x + (Math.random() - .5)*spread, y:y + (Math.random() - .5)*spread, vx:0, vy:0, ph:Math.random()*6, t:Math.random()*3, face:0, g:Animal3D(kind)}); };
    add('sheep', 14, 1500, 1050, 300); add('cow', 3, 600, 800, 300); add('chicken', 8, 700, 520, 200); add('duck', 5, 1900, 520, 200); add('goat', 3, 2100, 1000, 200); add('horse', 2, 300, 1100, 200);
    const dog = {kind:'dog', x:1300, y:1150, vx:0, vy:0, ph:0, ang:0, face:0, g:Animal3D('dog')}; scene.farmDog = dog;
    let won = false, last = 0;
    const sheep = A.filter(a => a.kind === 'sheep'), walk = scene.Z.walk;
    out.ticks.push(dt => {
      const me = scene.meAv, now = performance.now();
      let cx = 0, cy = 0; sheep.forEach(s => { cx += s.x; cy += s.y; }); cx /= sheep.length; cy /= sheep.length;
      let avg = 0; sheep.forEach(s => avg += Math.hypot(s.x - cx, s.y - cy)); avg /= sheep.length;
      const dcx = cx - dog.x, dcy = cy - dog.y, dcl = Math.hypot(dcx, dcy) || 1, atHome = Math.hypot(cx - meadow.x, cy - meadow.y) < meadow.r*.5, push = !atHome && dcl < avg + 160 ? 70 : 0;
      A.forEach(a => {
        a.ph += dt*6; a.t -= dt;
        if(a.kind === 'sheep'){
          let ax = (cx - a.x)*.25, ay = (cy - a.y)*.25;
          sheep.forEach(o => { if(o === a) return; const dx = a.x - o.x, dy = a.y - o.y, d2 = dx*dx + dy*dy; if(d2 < 900 && d2 > 0){ ax += dx/d2*900; ay += dy/d2*900; } });
          [[dog, 180, 2400], [me, 150, 2000]].forEach(([f, R, k]) => { if(!f) return; const dx = a.x - f.x, dy = a.y - f.y, dd2 = Math.hypot(dx, dy); if(dd2 < R && dd2 > 1){ ax += dx/dd2*k*(1 - dd2/R); ay += dy/dd2*k*(1 - dd2/R); } });
          if(a.t < 0){ a.t = 2 + Math.random()*3; a.wx = (Math.random() - .5)*30; a.wy = (Math.random() - .5)*30; } ax += (a.wx || 0) + dcx/dcl*push; ay += (a.wy || 0) + dcy/dcl*push;
          a.vx += ax*dt; a.vy += ay*dt; const sp = Math.hypot(a.vx, a.vy), mx = 150; if(sp > mx){ a.vx *= mx/sp; a.vy *= mx/sp; } a.vx *= Math.pow(.3, dt); a.vy *= Math.pow(.3, dt);
        } else if(a.t < 0){ a.t = 1.5 + Math.random()*4; const s = {cow:25, chicken:60, duck:30, goat:45, horse:70}[a.kind]; const an = Math.random()*6.28; a.vx = Math.random() < .35 ? 0 : Math.cos(an)*s; a.vy = Math.random() < .35 ? 0 : Math.sin(an)*s;
          if(me && Math.hypot(me.x - a.x, me.y - a.y) < 160 && a.kind !== 'duck'){ a.vx = (me.x - a.x)*.15; a.vy = (me.y - a.y)*.15; } }
        a.x += a.vx*dt; a.y += a.vy*dt;
        if(a.kind === 'duck'){ const k = Math.hypot((a.x - 1900)/220, (a.y - 520)/110); if(k > 1){ a.x = 1900 + (a.x - 1900)/k; a.y = 520 + (a.y - 520)/k; a.vx *= -1; a.vy *= -1; } }
        else { a.x = Math.max(walk[0] + 20, Math.min(walk[2] - 20, a.x)); a.y = Math.max(walk[1] + 40, Math.min(walk[3] - 20, a.y)); const k = Math.hypot((a.x - 1900)/260, (a.y - 520)/140); if(k < 1){ a.x = 1900 + (a.x - 1900)/k; a.y = 520 + (a.y - 520)/k; } }
        Farm.pose(a, dt);
      });
      const toM = Math.atan2(meadow.y - cy, meadow.x - cx), spread = avg;
      if(atHome){ dog.ang += dt*.5; dog.tx = meadow.x + Math.cos(dog.ang)*(meadow.r + 150); dog.ty = meadow.y + Math.sin(dog.ang)*(meadow.r + 150); }
      else if(spread > 110){ const far = sheep.reduce((b, s) => Math.hypot(s.x - cx, s.y - cy) > Math.hypot(b.x - cx, b.y - cy) ? s : b); const an = Math.atan2(far.y - cy, far.x - cx); dog.tx = far.x + Math.cos(an)*60; dog.ty = far.y + Math.sin(an)*60; }
      else { dog.ang += dt*.8; const an = toM + Math.PI + Math.sin(dog.ang)*.6; dog.tx = cx + Math.cos(an)*(spread + 110); dog.ty = cy + Math.sin(an)*(spread + 110); }
      const ddx = dog.tx - dog.x, ddy = dog.ty - dog.y, dl = Math.hypot(ddx, ddy); const dsp = Math.min(260, dl*2.5); if(dl > 1){ dog.vx = ddx/dl*dsp; dog.vy = ddy/dl*dsp; } dog.x += dog.vx*dt; dog.y += dog.vy*dt; dog.ph += dt*12; Farm.pose(dog, dt);
      const inside = sheep.filter(s => Math.hypot(s.x - meadow.x, s.y - meadow.y) < meadow.r).length;
      if(!won && inside >= sheep.length - 1){ won = true; UI.toast('Cả đàn cừu đã về đồng cỏ! Cảm ơn bạn và chú chó chăn cừu.'); NET.reward('herd', 'Lùa đàn cừu về đồng cỏ'); Snd.tone(523, .2, .2); setTimeout(() => Snd.tone(784, .3, .2), 180); }
      if(won && inside < sheep.length - 4) won = false;
      if(now - last > 500){ last = now; scene.farmInside = inside; }
    });
    I(700, 560, 90, 'Rắc thóc cho gà ăn', () => { A.filter(a => a.kind === 'chicken').forEach(c => { c.vx = (scene.meAv.x - c.x)*.6; c.vy = (scene.meAv.y + 20 - c.y)*.6; c.t = 1.5; }); Snd.tone(1200, .05, .1); NET.reward('feed', 'Cho gà ăn'); UI.toast('Đàn gà chạy tới mổ thóc!'); });
    I(1300, 1150, 120, 'Gọi chú chó chăn cừu', () => { UI.toast(`Gâu gâu! Chó chăn cừu đang lùa đàn. Đã có ${scene.farmInside || 0}/${sheep.length} con cừu trên đồng cỏ. Bạn đi vòng phía sau đàn để giúp!`); Snd.tone(300, .1, .3, 'square'); setTimeout(() => Snd.tone(260, .12, .3, 'square'), 160); });
    I(340, 500, 90, 'Kho cỏ mở: vì sao không có chuồng?', () => UI.modal('Nông trại cộng sinh', '<p>Ở đây các con vật sống tự do: cừu gặm cỏ theo đàn, chó chăn cừu trông chừng, gà bới đất làm tơi vườn, vịt ăn bọ dưới ao, bò bón phân cho đồng cỏ.</p><p>Mỗi loài giúp một việc, cùng nhau tạo nên một nông trại khỏe mạnh. Đó là <b>cộng sinh</b>.</p>'));
  },
  pose(a, dt){ const g = a.g, mv = Math.hypot(a.vx, a.vy) > 5; if(mv){ const want = Math.atan2(a.vx, a.vy); let d = want - a.face; d = Math.atan2(Math.sin(d), Math.cos(d)); a.face += d*Math.min(1, dt*8); }
    g.position.set(a.x, a.kind === 'duck' ? Math.sin(a.ph)*1 : mv ? Math.abs(Math.sin(a.ph*1.6))*2 : 0, a.y); g.rotation.y = a.face; g.userData.legs.forEach((l, i) => l.rotation.x = mv ? Math.sin(a.ph*1.6 + (i % 2)*Math.PI)*.6 : 0); }
};
const Snd = {
  ac:null, ctx(){ if(!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); if(this.ac.state === 'suspended') this.ac.resume(); return this.ac; },
  noise(d, f, v){ const ac = this.ctx(), b = ac.createBuffer(1, ac.sampleRate*d, ac.sampleRate), x = b.getChannelData(0); for(let i=0;i<x.length;i++) x[i] = (Math.random()*2 - 1)*(1 - i/x.length); const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; const g = ac.createGain(); g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(ac.destination); s.start(); },
  launch(){ this.noise(2.2, 1200, .5); }, boom(){ this.noise(2.8, 300, 1); this.noise(.6, 3000, .4); },
  tone(f, d, v, type){ const ac = this.ctx(), o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(v || .2, ac.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d + .05); }
};
