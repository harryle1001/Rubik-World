// School (centre), Brain Zone (west) and Sports Zone (east). Static parts are merged per zone; a few parts move.
import * as THREE from 'three';
import { PAL, heightAt, box, boxAt, cyl, cone, sphere, torus, merge, meshOf, MAT, colorize, place, addCircle, addRect, PLACES, canvasTex, rng, IS_PHONE } from './util.js';

const H = (x, z) => heightAt(x, z);
export const LAMPS = [];       // [x, y, z] glowing lamp heads (night halos)
export const MOVERS = [];      // {update(t, dt)}
// wooden sign board with English + Vietnamese, sharp canvas text
const SIGN_GEO = new THREE.PlaneGeometry(5, 2.2);
export function sign(scene, en, vi, x, z, ry = 0, extra){
  const tex = canvasTex(512, 224, (g, w, h) => { g.fillStyle = '#6d4c2e'; g.fillRect(0, 0, w, h); g.fillStyle = '#8d6a42'; g.fillRect(10, 10, w - 20, h - 20); g.fillStyle = '#fff8e7'; g.textAlign = 'center'; g.font = '800 68px Nunito, sans-serif'; g.fillText(en, w/2, 100); g.font = '600 46px Nunito, sans-serif'; g.fillStyle = '#ffe6a8'; g.fillText(vi, w/2, 170); });
  const y = H(x, z); const m = new THREE.Mesh(SIGN_GEO, new THREE.MeshLambertMaterial({map:tex})); m.position.set(x, y + 2.6, z); m.rotation.y = ry; scene.add(m);
  const post = meshOf([cyl(.15, .15, 2.6, PAL.darkWood, x - Math.cos(ry)*2.2, y, z + Math.sin(ry)*2.2), cyl(.15, .15, 2.6, PAL.darkWood, x + Math.cos(ry)*2.2, y, z - Math.sin(ry)*2.2)]); scene.add(post);
  if(extra) PLACES.push(Object.assign({x, z, en, vi}, extra)); return m;
}
const lamp = (G, x, z) => { const y = H(x, z); G.push(cyl(.12, .16, 4.2, '#37474f', x, y, z), box(.7, .2, .7, '#263238', x, y + 4.2, z)); LAMPS.push([x, y + 4.0, z]); };
const windowsRow = (G, x0, x1, y, z, face, step = 4, c = '#2b3f7a') => { for(let x = x0; x <= x1; x += step) G.push(boxAt(2, 1.8, .2, c, x, y, z + face*.12)); };

// ================= SCHOOL =================
export function buildSchool(scene){
  const G = [], y0 = H(0, -20);
  G.push(box(80, .2, 64, '#d9d2c3', 0, y0, -28));                                                   // yard
  // U-shaped building
  const walls = '#f4efe6', trim = PAL.blue;
  G.push(box(92, 13, 16, walls, 0, y0, -72), box(94, 1, 18, trim, 0, y0 + 13, -72), place(colorize(new THREE.CylinderGeometry(0, 50, 6, 4), PAL.roof), 0, y0 + 16.5, -72, 0, Math.PI/4, 0, 1, 1, .2));
  for(const s of [-1, 1]){ G.push(box(16, 11, 40, walls, s*40, y0, -44), box(18, 1, 42, trim, s*40, y0 + 11, -44)); windowsRow(G, -40, 40, y0 + 4, -64, 1); windowsRow(G, -40, 40, y0 + 8.5, -64, 1); for(let z = -58; z <= -28; z += 6) G.push(boxAt(.2, 1.8, 2, '#2b3f7a', s*40 - s*8.1, y0 + 5, z), boxAt(.2, 1.8, 2, '#2b3f7a', s*40 - s*8.1, y0 + 9, z)); addRect(s*40, -44, 16, 40); }
  addRect(0, -72, 92, 16);
  G.push(box(6, 5, .4, '#5d4037', 0, y0, -63.9), box(10, 18, 10, walls, 0, y0, -72), box(11, 1, 11, PAL.yellow, 0, y0 + 18, -72), sphere(2.6, '#fff8e1', 0, y0 + 14, -66.8, 1));   // door + clock tower
  // Rubik cube on the tower
  const C = [PAL.red, PAL.yellow, PAL.blue, PAL.green, PAL.white, PAL.orange]; for(let i=0;i<3;i++) for(let j=0;j<3;j++) for(let k=0;k<3;k++) G.push(box(1.45, 1.45, 1.45, C[(i + j*2 + k) % 6], -1.6 + i*1.6, y0 + 19.2 + j*1.6, -73.6 + k*1.6));
  // flag pole
  G.push(cyl(.15, .2, 14, '#cfd8dc', 0, y0, 4), box(4, 2.6, .1, '#da251d', 2, y0 + 11, 4), boxAt(.9, .9, .12, PAL.yellow, 2, y0 + 12.3, 4.02)); addCircle(0, 4, .5);
  // small houses around the yard
  const house = (x, z, w, d, h, col, roof, en, vi) => { const y = H(x, z); G.push(box(w, h, d, col, x, y, z), place(colorize(new THREE.CylinderGeometry(0, Math.max(w, d)*.75, 4, 4), roof), x, y + h + 2, z, 0, Math.PI/4, 0, 1, 1, d/w), box(2.4, 3.2, .3, '#5d4037', x, y, z + d/2 + .1)); windowsRow(G, x - w/2 + 3, x + w/2 - 3, y + h*.6, z + d/2, 1, 5); addRect(x, z, w, d); sign(scene, en, vi, x + w/2 + 3, z + d/2 + 3, 0); };
  house(-62, 14, 18, 14, 7, '#e8f1ff', PAL.blue, 'Library', 'Thư viện nhỏ'); house(62, 14, 20, 16, 9, '#fff3e0', PAL.orange, 'Hall', 'Hội trường');
  house(-62, 50, 18, 14, 6, '#f1f8e9', PAL.green, 'Canteen', 'Nhà ăn'); house(62, 50, 16, 14, 6, '#fce4ec', PAL.purple, 'Music Room', 'Phòng nhạc');
  // benches, flower beds, lamps
  for(const x of [-24, -12, 12, 24]) G.push(box(4, .5, 1.2, PAL.wood, x, y0 + .5, -10), box(.3, .5, 1, PAL.darkWood, x - 1.7, y0, -10), box(.3, .5, 1, PAL.darkWood, x + 1.7, y0, -10));
  for(const [x, z] of [[-30, 2], [30, 2], [-30, -50], [30, -50]]){ G.push(box(8, .6, 3, '#795548', x, y0, z)); for(let k=0;k<6;k++) G.push(sphere(.5, [PAL.red, PAL.yellow, PAL.purple, PAL.orange, '#ff80ab', PAL.white][k], x - 3 + k*1.2, y0 + 1, z, 0)); }
  for(const x of [-36, -18, 0, 18, 36]) lamp(G, x, 10); for(const z of [-50, -30]) { lamp(G, -28, z); lamp(G, 28, z); }
  scene.add(meshOf(G));
  sign(scene, 'The Rubik School', 'Trường học Rubik', 0, 16, 0);
}

// ================= BRAIN ZONE (west) =================
export function buildBrain(scene){
  const G = [], cx = -300;
  // giant chessboard on the grass
  const y = H(cx, -40); for(let i=0;i<8;i++) for(let j=0;j<8;j++) G.push(box(4, .25, 4, (i + j) % 2 ? '#3b2f2f' : '#f3e9d2', cx - 14 + i*4, y, -54 + j*4));
  const piece = (x, z, col, kind) => { const yy = y + .25; G.push(cyl(1, 1.3, .6, col, x, yy, z), cyl(.55, .8, 2.2, col, x, yy + .6, z)); if(kind === 'k') G.push(box(.3, 1.2, .3, col, x, yy + 3.1, z), box(1, .3, .3, col, x, yy + 3.6, z)); else if(kind === 'q') G.push(sphere(.7, col, x, yy + 3.3, z, 1)); else G.push(sphere(.6, col, x, yy + 3.1, z, 1)); addCircle(x, z, 1.2); };
  [['k', 0], ['q', 1], ['p', 2], ['p', 3]].forEach(([k, i]) => { piece(cx - 12 + 4*(i + 2), -54 + 2, '#f5f5f5', k); piece(cx - 12 + 4*(i + 2), -54 + 30, '#212121', k); });
  sign(scene, 'Giant Chess', 'Cờ vua khổng lồ', cx - 20, -26, Math.PI/2);
  // Rubik monument: pedestal + a 3x3x3 cube whose top layer turns
  const my = H(cx, 50); G.push(cyl(6, 7, 2, '#cfd8dc', cx, my, 50), cyl(4.5, 5, 6, '#eceff1', cx, my + 2, 50)); addCircle(cx, 50, 7);
  const cub = colorize(new THREE.BoxGeometry(1.9, 1.9, 1.9), '#111'); { const col = cub.attributes.color.array, nr = cub.attributes.normal.array, F = {px:PAL.red, nx:PAL.orange, py:PAL.white, ny:PAL.yellow, pz:PAL.green, nz:PAL.blue}; for(let v=0; v<cub.attributes.position.count; v++){ const nx = nr[v*3], ny = nr[v*3 + 1], nz = nr[v*3 + 2], k = nx > .5 ? 'px' : nx < -.5 ? 'nx' : ny > .5 ? 'py' : ny < -.5 ? 'ny' : nz > .5 ? 'pz' : 'nz', c = new THREE.Color(F[k]); col[v*3] = c.r; col[v*3 + 1] = c.g; col[v*3 + 2] = c.b; } }
  const rub = new THREE.InstancedMesh(cub, MAT.solid, 27); rub.castShadow = true; rub.frustumCulled = false; scene.add(rub); const M = new THREE.Matrix4(), R = new THREE.Matrix4(), base = []; for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) for(let k=-1;k<=1;k++) base.push([i, j, k]);
  MOVERS.push({update(t){ const turn = (t*.5) % 4, ang = turn < 1 ? Math.sin(turn*Math.PI/2)*Math.PI/2 : 0, spin = t*.15; base.forEach(([i, j, k], n) => { M.makeTranslation(i*2, j*2, k*2); if(j === 1){ R.makeRotationY(ang); M.premultiply(R); } R.makeRotationY(spin); M.premultiply(R); R.makeTranslation(cx, my + 11, 50); M.premultiply(R); rub.setMatrixAt(n, M); }); rub.instanceMatrix.needsUpdate = true; }});
  sign(scene, 'Rubik Monument', 'Tượng đài Rubik', cx + 10, 62, 0);
  // hedge maze (depth-first maze on an 8x8 grid)
  const mx = -410, mz = -130, n = 8, s = 5, r = rng(11), vis = Array.from({length:n}, () => Array(n).fill(false)), wallsH = Array.from({length:n + 1}, () => Array(n).fill(true)), wallsV = Array.from({length:n}, () => Array(n + 1).fill(true));
  (function dfs(i, j){ vis[i][j] = true; const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => r() - .5); for(const [di, dj] of d){ const a = i + di, b = j + dj; if(a < 0 || b < 0 || a >= n || b >= n || vis[a][b]) continue; if(di) wallsV[j][Math.max(i, a)] = false; else wallsH[Math.max(j, b)][i] = false; dfs(a, b); } })(0, 0);
  wallsV[0][0] = false; wallsV[n - 1][n] = false; const hy = H(mx, mz);
  for(let j=0;j<=n;j++) for(let i=0;i<n;i++) if(wallsH[j][i]){ const x = mx + i*s + s/2, z = mz + j*s; G.push(box(s + .6, 2.6, 1, '#2e7d32', x, hy, z)); addRect(x, z, s + .6, 1); }
  for(let j=0;j<n;j++) for(let i=0;i<=n;i++) if(wallsV[j][i]){ const x = mx + i*s, z = mz + j*s + s/2; G.push(box(1, 2.6, s + .6, '#2e7d32', x, hy, z)); addRect(x, z, 1, s + .6); }
  sign(scene, 'Hedge Maze', 'Mê cung cây xanh', mx - 4, mz - 4, 0);
  // grand library with columns and a dome
  const lx = -300, lz = 150, ly = H(lx, lz); G.push(box(46, 14, 24, '#f5efe0', lx, ly, lz), box(50, 2, 28, '#e0d5bd', lx, ly + 14, lz), place(colorize(new THREE.SphereGeometry(9, 12, 6, 0, Math.PI*2, 0, Math.PI/2), '#7fa7c9'), lx, ly + 16, lz), box(50, 1, 6, '#e0d5bd', lx, ly, lz - 14.5));
  for(let i=0;i<8;i++) G.push(cyl(.8, .9, 13, '#fffaf0', lx - 21 + i*6, ly, lz - 15)); G.push(place(colorize(new THREE.CylinderGeometry(0, 27, 5, 3), '#ece3cf'), lx, ly + 16.5, lz - 15, Math.PI/2, 0, Math.PI/2, 1, 1, .12)); addRect(lx, lz, 46, 24);
  sign(scene, 'Grand Library', 'Thư viện lớn', lx + 28, lz - 18, 0);
  // academy, observatory, puzzle garden, zen pagoda
  const ax = -200, az = 80, ay = H(ax, az); G.push(box(26, 10, 18, '#e3f2fd', ax, ay, az), box(28, 1, 20, PAL.purple, ax, ay + 10, az), cone(6, 5, PAL.purple, ax, ay + 11, az, 6)); windowsRow(G, ax - 10, ax + 10, ay + 5, az + 9, 1); addRect(ax, az, 26, 18); sign(scene, 'Academy', 'Học viện trí tuệ', ax + 16, az + 12, 0);
  const ox = -430, oz = 50, oy = H(ox, oz); G.push(cyl(7, 7.5, 9, '#eceff1', ox, oy, oz), place(colorize(new THREE.SphereGeometry(7.4, 14, 7, 0, Math.PI*2, 0, Math.PI/2), '#b0bec5'), ox, oy + 9, oz), boxAt(1.6, 1.6, 9, '#455a64', ox + 2, oy + 15, oz, -.7, .4, 0)); addCircle(ox, oz, 7.5); sign(scene, 'Observatory', 'Đài thiên văn', ox + 10, oz + 8, 0);
  const px = -210, pz = -70, py = H(px, pz); for(let k=0;k<3;k++){ G.push(cyl(.25, .25, 4, '#8d6e63', px - 6 + k*6, py, pz), box(5, .4, 3, '#a1887f', px - 6 + k*6, py, pz)); } for(let d=0;d<4;d++) G.push(cyl(2 - d*.4, 2 - d*.4, .8, [PAL.red, PAL.orange, PAL.yellow, PAL.green][d], px - 6, py + .4 + d*.8, pz));
  sign(scene, 'Puzzle Garden', 'Vườn câu đố', px, pz + 6, 0);
  const zx = -390, zz = 210, zy = H(zx, zz); for(let k=0;k<4;k++){ const w = 10 - k*2; G.push(box(w, 2.6, w, '#b71c1c', zx, zy + k*3.4, zz), place(colorize(new THREE.CylinderGeometry(w*.35, w*.85, 1, 4), '#3e2723'), zx, zy + k*3.4 + 3, zz, 0, Math.PI/4)); } addRect(zx, zz, 10, 10);
  G.push(place(colorize(new THREE.CylinderGeometry(9, 9, .3, 20), '#4fb3e0'), zx + 18, zy + .2, zz + 6)); sign(scene, 'Zen Garden', 'Vườn thiền', zx + 10, zz - 10, 0);
  for(let i=0;i<10;i++) lamp(G, cx - 100 + i*20, -8);
  scene.add(meshOf(G));
}

// ================= SPORTS ZONE (east) =================
export function buildSports(scene){
  const G = [], sx = 300, sz = -90, y = H(sx, sz);
  // stadium: field with painted lines + stands + floodlights
  const fieldTex = canvasTex(512, 768, (g, w, h) => { for(let i=0;i<12;i++){ g.fillStyle = i % 2 ? '#3fa34d' : '#46b257'; g.fillRect(0, i*h/12, w, h/12); } g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(20, 20, w - 40, h - 40); g.beginPath(); g.moveTo(20, h/2); g.lineTo(w - 20, h/2); g.stroke(); g.beginPath(); g.arc(w/2, h/2, 70, 0, 7); g.stroke(); g.strokeRect(w/2 - 110, 20, 220, 110); g.strokeRect(w/2 - 110, h - 130, 220, 110); });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(64, 96), new THREE.MeshLambertMaterial({map:fieldTex})); field.rotation.x = -Math.PI/2; field.position.set(sx, y + .06, sz); field.receiveShadow = true; scene.add(field);
  for(const s of [-1, 1]){ for(let k=0;k<5;k++){ G.push(box(4, 1 + k*1.6, 100, k % 2 ? '#cfd8dc' : '#90a4ae', sx + s*(36 + k*3.8), y, sz)); } addRect(sx + s*43, sz, 20, 100); G.push(box(1.4, 24, 1.4, '#78909c', sx + s*52, y, sz - 46), box(1.4, 24, 1.4, '#78909c', sx + s*52, y, sz + 46)); LAMPS.push([sx + s*52, y + 24, sz - 46], [sx + s*52, y + 24, sz + 46]); }
  for(const e of [-1, 1]){ G.push(box(8, .2, .2, '#fff', sx, y + 2.4, sz + e*46), box(.2, 2.4, .2, '#fff', sx - 4, y, sz + e*46), box(.2, 2.4, .2, '#fff', sx + 4, y, sz + e*46)); for(let k=0;k<4;k++) G.push(box(70, 1 + k*1.4, 3.4, k % 2 ? '#e0e0e0' : PAL.blue, sx, y, sz + e*(54 + k*3.2))); }
  addRect(sx, sz - 60, 70, 10); addRect(sx, sz + 60, 70, 10);
  sign(scene, 'Football Stadium', 'Sân vận động', sx - 28, sz + 70, 0, {icon:'⚽', game:'kick', note:'Đá bóng thật bằng vật lý'});
  // basketball court
  const bx = 215, bz = 40, by = H(bx, bz); G.push(box(18, .1, 30, '#c97b4a', bx, by, bz), box(17, .12, .2, '#fff', bx, by, bz)); for(const e of [-1, 1]) G.push(cyl(.15, .15, 4, '#9e9e9e', bx, by, bz + e*14), box(2.4, 1.6, .2, '#fff', bx, by + 4, bz + e*13.8), torus(.45, .05, PAL.orange, bx, by + 3.5, bz + e*13.2, Math.PI/2)); sign(scene, 'Basketball', 'Sân bóng rổ', bx + 12, bz + 18, 0);
  // skate park: bowls and ramps
  const kx = 375, kz = 40, ky = H(kx, kz); G.push(box(30, .15, 26, '#bdbdbd', kx, ky, kz)); for(const e of [-1, 1]) G.push(boxAt(8, .4, 8, '#9e9e9e', kx + e*10, ky + 1.4, kz - 6, 0, 0, e*.5)); G.push(torus(5, 1, '#9e9e9e', kx, ky + .3, kz + 6, Math.PI/2, 0, 20), box(10, 1, 3, '#9e9e9e', kx, ky, kz - 10)); sign(scene, 'Skate Park', 'Công viên trượt ván', kx, kz + 16, 0);
  // ski hill flags and lift poles (the hill itself is terrain)
  for(let k=0;k<8;k++){ const fx = 430 + k*6, fz = 20 + (k % 2 ? 6 : -6); G.push(cyl(.08, .08, 2, '#fff', fx, H(fx, fz), fz), box(.8, .6, .05, k % 2 ? PAL.red : PAL.blue, fx + .4, H(fx, fz) + 1.6, fz)); }
  for(let k=0;k<5;k++){ const lx = 400 + k*16, lz = 60, ly = H(lx, lz); G.push(box(.6, 10, .6, '#546e7a', lx, ly, lz), box(4, .4, .4, '#546e7a', lx, ly + 10, lz)); }
  sign(scene, 'Ski Hill', 'Đồi trượt tuyết', 410, 20, -Math.PI/2);
  // kart / animal race track (flat oval)
  const tx = 300, tz = 205, ty = H(tx, tz); G.push(place(colorize(new THREE.RingGeometry(34, 44, 40, 1), '#455a64'), tx, ty + .08, tz, -Math.PI/2, 0, 0, 1.4, 1, 1)); for(let k=0;k<40;k++){ const a = k/40*Math.PI*2; G.push(boxAt(1.2, .3, 3, k % 2 ? '#fff' : PAL.red, tx + Math.cos(a)*44.6*1.4, ty + .15, tz + Math.sin(a)*44.6, 0, -a, 0)); }
  sign(scene, 'Kart & Race Track', 'Đường đua Kart', tx, tz - 52, 0);
  // pool + arena
  const qx = 215, qz = -30, qy = H(qx, qz); G.push(box(22, .5, 34, '#eceff1', qx, qy, qz), box(18, .55, 30, '#4fc3f7', qx, qy + .02, qz)); for(let k=1;k<5;k++) G.push(box(.15, .6, 30, '#fff', qx - 9 + k*3.6, qy + .02, qz)); sign(scene, 'Swimming Pool', 'Hồ bơi', qx + 14, qz + 20, 0);
  const ox = 390, oz = -40, oy = H(ox, oz); G.push(cyl(16, 17, 8, '#e1f5fe', ox, oy, oz, 18), torus(16.5, .6, PAL.yellow, ox, oy + 8, oz, Math.PI/2, 0, 24)); addCircle(ox, oz, 17); sign(scene, 'Sports Arena', 'Đấu trường thể thao', ox, oz + 20, 0);
  for(let i=0;i<8;i++) lamp(G, 120 + i*22, -8);
  scene.add(meshOf(G));
}
