// Playground (south) and the big Farm (north): rides that move, farm buildings, signs with "Tap to play" mini games.
import * as THREE from 'three';
import { PAL, heightAt, box, boxAt, cyl, cone, sphere, torus, merge, meshOf, MAT, colorize, place, addCircle, addRect, PLACES, rng } from './util.js';
import { sign, LAMPS, MOVERS } from './zones.js';
const H = (x, z) => heightAt(x, z);
const dyn = (scene, geoms, x, y, z) => { const m = new THREE.Mesh(merge(geoms), MAT.solid); m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m; };

// ================= PLAYGROUND (south) =================
export function buildPlayground(scene){
  const G = [], y = H(0, 300);
  G.push(box(70, .15, 50, '#f3d9a4', 0, y, 290));                                   // soft sand play area
  // slide
  G.push(box(.3, 5, .3, PAL.blue, -20, y, 275), box(.3, 5, .3, PAL.blue, -17, y, 275), box(3.3, .3, 3, PAL.red, -18.5, y + 5, 276), boxAt(2.4, .25, 9, PAL.yellow, -18.5, y + 2.6, 282, -.55, 0, 0)); for(let k=0;k<5;k++) G.push(box(3, .15, .15, '#fff', -18.5, y + k, 274.9)); addRect(-18.5, 278, 4, 10);
  // swings: frame static, seats swing
  G.push(boxAt(.3, 5.5, .3, PAL.purple, -2, y + 2.6, 300, 0, 0, .25), boxAt(.3, 5.5, .3, PAL.purple, 10, y + 2.6, 300, 0, 0, -.25), box(13, .3, .3, PAL.purple, 4, y + 5.2, 300));
  const seat = merge([box(1.2, .15, .6, PAL.orange, 0, -4, 0), box(.05, 4, .05, '#9e9e9e', -.5, -4, 0), box(.05, 4, .05, '#9e9e9e', .5, -4, 0)]), sw = new THREE.InstancedMesh(seat, MAT.solid, 3), M = new THREE.Matrix4(), R = new THREE.Matrix4(); sw.frustumCulled = false; scene.add(sw);
  MOVERS.push({update(t){ for(let i=0;i<3;i++){ M.makeRotationX(Math.sin(t*1.6 + i*1.3)*.55); R.makeTranslation(1 + i*3, y + 5.2, 300); M.premultiply(R); sw.setMatrixAt(i, M); } sw.instanceMatrix.needsUpdate = true; }});
  // seesaw
  const ss = dyn(scene, [box(8, .25, .7, PAL.green, 0, 0, 0), box(.6, .6, .6, PAL.red, -3.6, .2, 0), box(.6, .6, .6, PAL.red, 3.6, .2, 0)], 22, y + 1.1, 285); G.push(box(.8, 1, .8, '#795548', 22, y, 285));
  MOVERS.push({update(t){ ss.rotation.z = Math.sin(t*1.2)*.22; }});
  // ball pit house
  G.push(box(10, 3, 10, '#ffe082', -20, y, 315), cone(8, 4, PAL.red, -20, y + 3, 315, 4)); for(let k=0;k<30;k++) G.push(sphere(.35, [PAL.red, PAL.yellow, PAL.blue, PAL.green][k % 4], -24 + (k % 6)*1.6, y + .4 + Math.floor(k/18)*.5, 320.5 + (k % 3)*.6, 0)); addRect(-20, 315, 10, 10);
  // ferris wheel: the wheel turns, cabins stay upright
  const fx = 75, fz = 335, fy = H(fx, fz); G.push(boxAt(1, 26, 1, '#eceff1', fx - 4, fy + 12, fz - 3, .3, 0, .12), boxAt(1, 26, 1, '#eceff1', fx + 4, fy + 12, fz - 3, .3, 0, -.12), boxAt(1, 26, 1, '#eceff1', fx - 4, fy + 12, fz + 3, -.3, 0, .12), boxAt(1, 26, 1, '#eceff1', fx + 4, fy + 12, fz + 3, -.3, 0, -.12)); addRect(fx, fz, 12, 10);
  const wg = [torus(14, .35, '#ff80ab', 0, 0, 0, 0, 0, 40), torus(13, .2, '#fff', 0, 0, 0, 0, 0, 40)]; for(let k=0;k<8;k++) wg.push(boxAt(.25, 28, .25, '#fff', 0, 0, 0, 0, 0, k*Math.PI/8));
  const wheel = dyn(scene, wg, fx, fy + 24, fz); const cab = merge([box(2.2, 2, 2.2, PAL.yellow, 0, -2.4, 0), box(2.4, .3, 2.4, PAL.red, 0, -.4, 0)]), cabs = new THREE.InstancedMesh(cab, MAT.solid, 8); cabs.frustumCulled = false; scene.add(cabs);
  const cols = [PAL.yellow, PAL.blue, PAL.green, PAL.orange, PAL.purple, PAL.red, '#00bcd4', '#ff80ab'].map(c => new THREE.Color(c)); cols.forEach((c, i) => cabs.setColorAt(i, c));
  MOVERS.push({update(t){ const a = t*.12; wheel.rotation.z = a; for(let k=0;k<8;k++){ const b = a + k*Math.PI/4; M.makeTranslation(fx + Math.cos(b)*14, fy + 24 + Math.sin(b)*14, fz); cabs.setMatrixAt(k, M); } cabs.instanceMatrix.needsUpdate = true; }});
  for(let k=0;k<8;k++) LAMPS.push([fx + Math.cos(k*Math.PI/4)*14, fy + 24 + Math.sin(k*Math.PI/4)*14, fz + .5]);
  sign(scene, 'Ferris Wheel', 'Vòng đu quay', fx - 16, fz - 6, 0);
  // carousel
  const cx = -70, cz = 300, cy = H(cx, cz); G.push(cyl(9, 9, .6, '#fff3e0', cx, cy, cz, 16), cyl(.6, .6, 7, PAL.yellow, cx, cy, cz)); addCircle(cx, cz, 9.5);
  const top = dyn(scene, [cone(10.5, 3.5, PAL.red, 0, 0, 0, 16), cyl(10, 10, .6, '#fff', 0, -.6, 0, 16)], cx, cy + 7.4, cz);
  const horse = merge([box(.6, .8, 2, '#fff', 0, 0, 0), box(.5, .9, .5, '#fff', 0, .6, .9), box(.15, 3.6, .15, PAL.yellow, 0, -1, 0)]), hs = new THREE.InstancedMesh(horse, MAT.solid, 8); hs.frustumCulled = false; scene.add(hs);
  MOVERS.push({update(t){ top.rotation.y = t*.5; for(let k=0;k<8;k++){ const b = t*.5 + k*Math.PI/4; M.makeRotationY(-b); R.makeTranslation(cx + Math.cos(b)*6.5, cy + 1.6 + Math.sin(t*3 + k)*.4, cz + Math.sin(b)*6.5); M.premultiply(R); hs.setMatrixAt(k, M); } hs.instanceMatrix.needsUpdate = true; }});
  sign(scene, 'Carousel', 'Ngựa gỗ quay', cx + 12, cz - 10, 0);
  // water park
  const wx = -45, wz = 370, wy = H(wx, wz); G.push(box(24, .5, 16, '#eceff1', wx, wy, wz), box(21, .55, 13, '#29b6f6', wx, wy + .02, wz)); for(let k=0;k<6;k++) G.push(boxAt(2, .4, 5, ['#ff7043', '#ffca28'][k % 2], wx + 12 + Math.cos(k*.9)*3, wy + 9 - k*1.5, wz - 6 + k*2.3, .3, k*.9, 0)); G.push(cyl(.4, .4, 9, '#90a4ae', wx + 12, wy, wz - 6)); addRect(wx, wz, 24, 16); sign(scene, 'Water Park', 'Công viên nước', wx + 16, wz + 10, 0);
  // stage, campfire, cotton candy
  const sx = 0, sz = 410, sy = H(sx, sz); G.push(box(24, 1.4, 12, '#5d4037', sx, sy, sz), box(24, 10, 1, '#311b92', sx, sy + 1.4, sz + 6), box(26, 1, 2, PAL.yellow, sx, sy + 11, sz + 6)); for(let k=0;k<6;k++) LAMPS.push([sx - 10 + k*4, sy + 11, sz + 5]); addRect(sx, sz, 24, 12); sign(scene, 'Music Stage', 'Sân khấu ca nhạc', sx - 16, sz - 8, 0);
  const bxp = 55, bzp = 420, byp = H(bxp, bzp); for(let k=0;k<5;k++) G.push(boxAt(.4, .4, 2.4, PAL.darkWood, bxp, byp + .3, bzp, 0, k*Math.PI/5, 0)); for(let k=0;k<6;k++){ const a = k/6*Math.PI*2; G.push(box(1.6, .5, .6, PAL.wood, bxp + Math.cos(a)*4, byp, bzp + Math.sin(a)*4)); }
  const fire = new THREE.Mesh(colorize(new THREE.ConeGeometry(.9, 2.2, 6), '#ff9800'), MAT.glow); fire.position.set(bxp, byp + 1.3, bzp); scene.add(fire); LAMPS.push([bxp, byp + 1.5, bzp, 1]); MOVERS.push({update(t){ fire.scale.set(1 + Math.sin(t*13)*.1, 1 + Math.sin(t*9)*.18, 1); }}); sign(scene, 'Campfire BBQ', 'Lửa trại BBQ', bxp + 6, bzp - 6, 0);
  const ccx = -85, ccz = 385, ccy = H(ccx, ccz); G.push(box(4, 2.4, 3, '#f8bbd0', ccx, ccy, ccz), place(colorize(new THREE.CylinderGeometry(0, 3.6, 1.6, 4), '#ec407a'), ccx, ccy + 3.2, ccz, 0, Math.PI/4), sphere(.9, '#ffccf2', ccx + 1, ccy + 3, ccz + 1.6, 1)); addRect(ccx, ccz, 4, 3); sign(scene, 'Cotton Candy', 'Kẹo bông', ccx, ccz - 5, 0);
  // build zone plaza
  const bz0 = H(105, 255); G.push(box(30, .2, 30, '#e8eaf6', 105, bz0, 255)); sign(scene, 'Build Zone', 'Khu sáng tạo', 105, 238, 0, {icon:'🧱', game:'build', note:'Đặt khối Rubik, ván gỗ, dốc, lò xo, đèn'});
  // pier and beach huts on the south shore
  let pz = 520; while(H(0, pz) > -.2 && pz < 700) pz += 4; for(let k=0;k<20;k++){ G.push(box(5, .3, 2.6, PAL.wood, 0, .9, pz - 10 + k*2.8)); if(k % 3 === 0) G.push(box(.3, 3, .3, PAL.darkWood, -2.4, -2, pz - 10 + k*2.8), box(.3, 3, .3, PAL.darkWood, 2.4, -2, pz - 10 + k*2.8)); }
  PLACES.push({x:0, z:pz + 40, en:'Sea Turtle', vi:'Cưỡi rùa biển', icon:'🐢', game:'turtle', note:'Lên rùa biển ở cuối bến tàu'});
  for(let k=0;k<5;k++){ const hx = -60 + k*30, hz = 500, hy = H(hx, hz); if(hy < .3) continue; G.push(box(4, 3, 4, ['#4fc3f7', '#ffb74d', '#81c784', '#f06292', '#fff176'][k], hx, hy, hz), cone(3.4, 2, '#fff', hx, hy + 3, hz, 4)); addRect(hx, hz, 4, 4); }
  for(let i=0;i<8;i++) lamp2(G, -40 + i*12, 262);
  scene.add(meshOf(G));
}
function lamp2(G, x, z){ const y = H(x, z); G.push(cyl(.12, .16, 4.2, '#37474f', x, y, z), box(.7, .2, .7, '#263238', x, y + 4.2, z)); LAMPS.push([x, y + 4, z]); }

// ================= FARM (north, the biggest area) =================
export const FARM = {coop:[-110, -290], pasture:[0, -405], pig:[125, -290], barn:[115, -440], orchard:[-140, -430], fields:[0, -245], pen:[60, -470]};
export function buildFarm(scene){
  const G = [];
  // chicken coop with nests
  const [cx, cz] = FARM.coop, cy = H(cx, cz); G.push(box(10, 5, 7, '#c62828', cx, cy, cz), place(colorize(new THREE.CylinderGeometry(0, 8, 3, 4), '#fff8e1'), cx, cy + 6.5, cz, 0, Math.PI/4, 0, 1, 1, .7), box(2, 2.6, .3, '#5d4037', cx, cy, cz + 3.6));
  for(let k=0;k<6;k++) G.push(box(1.4, .6, 1.4, '#d7ccc8', cx - 8 + k*3.2, cy, cz + 8), cyl(.5, .6, .3, '#a1887f', cx - 8 + k*3.2, cy + .6, cz + 8)); addRect(cx, cz, 10, 7);
  for(let k=0;k<26;k++){ const a = k/26*Math.PI*2; G.push(box(.5, .9, .5, '#8d6e63', cx + Math.cos(a)*16, cy, cz + 6 + Math.sin(a)*12)); }
  sign(scene, 'Chicken Coop', 'Chuồng gà', cx + 9, cz + 14, 0, {icon:'🥚', game:'eggs', note:'Egg Collector: nhặt trứng thật nhanh, đừng làm vỡ'});
  // pasture: open meadow with a low stone wall line and a water trough
  const [px, pz] = FARM.pasture, py = H(px, pz); for(let k=0;k<40;k++){ const a = k/40*Math.PI*2; if(k % 10 === 9) continue; G.push(box(3.6, .8, .9, '#bdbdbd', px + Math.cos(a)*55, py, pz + Math.sin(a)*38, -a)); }
  G.push(box(6, .8, 1.4, '#795548', px + 10, py, pz + 6), box(5.6, .82, 1, '#4fc3f7', px + 10, py + .02, pz + 6));
  sign(scene, 'Pasture', 'Đồng cỏ', px, pz + 44, 0, {icon:'🐑', game:'herd', note:'Herding: lùa đàn cừu vào chuồng'});
  // sheep shed at the far side (the target of herding)
  const [hx, hz] = FARM.pen, hy = H(hx, hz); G.push(box(14, 4, 8, '#8d6e63', hx, hy, hz), place(colorize(new THREE.CylinderGeometry(0, 10, 3, 4), '#5d4037'), hx, hy + 5.5, hz, 0, Math.PI/4, 0, 1, 1, .6)); addRect(hx, hz, 14, 8);
  // pig pen: mud pool + trough
  const [gx, gz] = FARM.pig, gy = H(gx, gz); G.push(place(colorize(new THREE.CylinderGeometry(7, 7, .2, 14), '#6d4c41'), gx, gy + .1, gz), box(6, .8, 1.2, PAL.wood, gx, gy, gz + 9), box(8, 3.4, 6, '#f8bbd0', gx + 12, gy, gz - 4), cone(6, 2.4, '#ad1457', gx + 12, gy + 3.4, gz - 4, 4)); addRect(gx + 12, gz - 4, 8, 6);
  for(let k=0;k<20;k++){ const a = k/20*Math.PI*2; G.push(box(.4, 1, .4, '#a1887f', gx + Math.cos(a)*13, gy, gz + Math.sin(a)*12)); }
  sign(scene, 'Pig Pen', 'Chuồng heo', gx - 10, gz + 15, 0, {icon:'🐷', game:'pigs', note:'Pig Feeding: cho heo ăn đúng loại, đúng lúc'});
  // milking barn
  const [bx, bz] = FARM.barn, by = H(bx, bz); G.push(box(22, 10, 16, '#b71c1c', bx, by, bz), place(colorize(new THREE.CylinderGeometry(0, 16, 7, 4), '#4e342e'), bx, by + 13.5, bz, 0, Math.PI/4, 0, 1.05, 1, .75), box(6, 7, .3, '#fff', bx, by, bz + 8.1), boxAt(6.4, .4, .4, '#fff', bx, by + 3.5, bz + 8.3, 0, 0, .8), boxAt(6.4, .4, .4, '#fff', bx, by + 3.5, bz + 8.3, 0, 0, -.8));
  G.push(cyl(3.2, 3.2, 14, '#cfd8dc', bx + 16, by, bz - 2), sphere(3.2, '#b0bec5', bx + 16, by + 14, bz - 2, 1)); addRect(bx, bz, 22, 16); addCircle(bx + 16, bz - 2, 3.4);
  sign(scene, 'Milking Barn', 'Nhà vắt sữa', bx - 14, bz + 12, 0, {icon:'🥛', game:'milk', note:'Milking Rhythm: bấm theo nhịp'});
  // orchard + vegetable fields
  const [ox, oz] = FARM.orchard, r = rng(5); for(let i=0;i<6;i++) for(let j=0;j<5;j++){ const x = ox - 30 + i*12, z = oz - 22 + j*11, y = H(x, z); G.push(cyl(.3, .4, 2.4, PAL.darkWood, x, y, z), sphere(2.4, '#43a047', x, y + 3.6, z, 1)); for(let f=0;f<4;f++) G.push(sphere(.32, i % 2 ? '#e53935' : '#ffb300', x + (r() - .5)*3.4, y + 3 + r()*1.8, z + (r() - .5)*3.4, 0)); addCircle(x, z, .7); }
  sign(scene, 'Orchard & Fields', 'Vườn cây & ruộng rau', ox + 40, oz + 30, 0, {icon:'🥕', game:'harvest', note:'Trồng và thu hoạch'});
  const [vx, vz] = FARM.fields; for(let k=0;k<10;k++){ const y = H(vx - 40 + k*8, vz); G.push(box(5, .5, 26, '#6d4c41', vx - 40 + k*8, y, vz)); for(let j=0;j<6;j++) G.push(sphere(.6, ['#66bb6a', '#9ccc65', '#ff7043', '#ffca28'][k % 4], vx - 40 + k*8, y + .8, vz - 10 + j*4, 0)); }
  // windmill (blades turn) + granary
  const wx = 195, wz = -370, wy = H(wx, wz); G.push(cyl(2.6, 4, 16, '#fff8e1', wx, wy, wz), cone(3.4, 4, '#8d6e63', wx, wy + 16, wz)); addCircle(wx, wz, 4.2);
  const bl = []; for(let k=0;k<4;k++) bl.push(boxAt(1.4, 9, .2, '#efebe9', Math.cos(k*Math.PI/2)*4.6, Math.sin(k*Math.PI/2)*4.6, 0, 0, 0, k*Math.PI/2 + Math.PI/2)); const blades = dyn(scene, bl, wx, wy + 14, wz + 4.4); MOVERS.push({update(t){ blades.rotation.z = t*.8; }});
  sign(scene, 'Windmill', 'Cối xay gió', wx - 8, wz + 8, 0);
  const sx = 55, sz = -250, sy = H(sx, sz); G.push(box(12, 7, 10, '#ffb74d', sx, sy, sz), place(colorize(new THREE.CylinderGeometry(0, 9, 4, 4), '#8d6e63'), sx, sy + 9, sz, 0, Math.PI/4, 0, 1, 1, .8)); addRect(sx, sz, 12, 10); sign(scene, 'Granary', 'Kho thóc', sx, sz + 8, 0);
  scene.add(meshOf(G));
}
