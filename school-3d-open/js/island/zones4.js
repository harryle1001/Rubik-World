// Landmarks (open world): Old Town street of narrow tube houses with a clock tower, a five-tier pagoda tower with a lotus
// pond, three windmills, a striped lighthouse on the east cliff and a covered wooden bridge over the stream.
import * as THREE from 'three';
import { PAL, heightAt, box, boxAt, cyl, cone, sphere, torus, merge, meshOf, MAT, colorize, addCircle, addRect, rng, edgeR } from './util.js';
import { sign, LAMPS, MOVERS } from './zones.js';
import { CLOCK } from './ui.js';
const H = (x, z) => heightAt(x, z);
export const LIGHT = {x:0, z:0};
export const TOWN = {x:-280, z:340}, PAGODA = {x:340, z:370}, MILLS = {x:300, z:-330};
const TILE = '#b5532f', WALLS = ['#f6d365', '#f8c9a0', '#c8e6c9', '#b3e5fc', '#ffe0ac', '#f3e5f5', '#fff3c4'];
const pivot = (geo, scene, x, y, z) => { const m = new THREE.Mesh(geo, MAT.solid); m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m; };

// ================= OLD TOWN =================
function tubeHouse(G, x, z, f, w, h, col, r){
  const y = H(x, z), fz = z + f*5;
  G.push(box(w, h, 10, col, x, y, z), box(w + .2, .5, .5, col, x, y + h, fz - f*.2));                          // body + front parapet
  G.push(boxAt(w*.6, .25, 10.6, TILE, x - w*.25, y + h + .7, z, 0, 0, .42), boxAt(w*.6, .25, 10.6, TILE, x + w*.25, y + h + .7, z, 0, 0, -.42)); // tiled roof
  G.push(boxAt(w + .6, .22, 1.6, TILE, x, y + 2.9, fz + f*.7, f*.35, 0, 0));                                        // tiled awning over the shop
  G.push(boxAt(1.4, 2.2, .2, '#5d4037', x, y + 1.1, fz + f*.05), boxAt(w*.7, 1.1, .15, r() < .5 ? '#ffccbc' : '#d7ccc8', x, y + 1.5, fz + f*.03));
  for(const s of [-1, 1]) G.push(boxAt(1, 1.3, .18, '#2e7d32', x + s*w*.27, y + 4.6, fz + f*.06), boxAt(.9, 1.1, .2, '#263238', x + s*w*.27, y + 4.6, fz + f*.02));
  if(h > 8) for(const s of [-1, 1]) G.push(boxAt(.9, 1.1, .18, '#2e7d32', x + s*w*.27, y + 7.4, fz + f*.06));
  G.push(boxAt(w - .4, .2, 1.3, '#eeeeee', x, y + 3.6, fz + f*.65), boxAt(w - .4, .6, .1, '#6d4c2e', x, y + 4, fz + f*1.25));   // balcony + railing
  for(let k=0;k<3;k++) G.push(sphere(.32, ['#e53935', '#e53935', '#ffb300'][k], x - w*.3 + k*w*.3, y + 2.5, fz + f*1.35, 0, 1.2));
  G.push(box(.5, .5, .5, '#8d6e63', x + w*.38, y, fz + f*1.4), sphere(.45, '#43a047', x + w*.38, y + .9, fz + f*1.4, 0));            // potted plant
  LAMPS.push([x, y + 2.5, fz + f*1.35]); addRect(x, z, w, 10);
}
function buildTown(scene){
  const G = [], r = rng(9), {x:tx, z:tz} = TOWN, y0 = H(tx, tz);
  G.push(box(120, .12, 14, '#c9b79c', tx, y0 - .05, tz));                                      // stone street
  for(let k=0;k<30;k++) G.push(box(.9, .14, .9, '#a1887f', tx - 58 + k*4, y0 - .04, tz + (k % 2 ? 3 : -3)));
  for(const f of [-1, 1]){ let x = tx - 56; while(x < tx + 46){ const w = 4.4 + r()*1.6, h = 6.5 + Math.floor(r()*3)*1.8; tubeHouse(G, x + w/2, tz - f*12, f, w, h, WALLS[Math.floor(r()*WALLS.length)], r); x += w + .15; } }
  // clock tower closing the east end of the street
  const cx = tx + 56, cy = H(cx, tz); G.push(box(7, 15, 7, '#efe6d2', cx, cy, tz), box(7.6, .6, 7.6, '#8d6e63', cx, cy + 15, tz), box(5.6, 3, 5.6, '#efe6d2', cx, cy + 15.6, tz), cone(5, 5, TILE, cx, cy + 18.6, tz, 4, Math.PI/4), sphere(.5, PAL.yellow, cx, cy + 23.8, tz, 1));
  G.push(boxAt(.2, 3.4, 3.4, '#ffffff', cx - 3.55, cy + 11.5, tz), boxAt(.2, 3.8, 3.8, '#5d4037', cx - 3.5, cy + 11.5, tz), boxAt(1.6, 2.6, .2, '#5d4037', cx - 3.55, cy + 1.3, tz, 0, Math.PI/2));
  for(let k=0;k<12;k++){ const a = k/12*Math.PI*2; G.push(boxAt(.25, .25, .25, '#37474f', cx - 3.7, cy + 11.5 + Math.cos(a)*1.4, tz + Math.sin(a)*1.4)); }
  addRect(cx, tz, 7, 7);
  const hand = (len, wid) => { const g = colorize(new THREE.BoxGeometry(.12, len, wid), '#212121'); g.translate(0, len/2, 0); return g; };
  const hh = pivot(hand(.9, .22), scene, cx - 3.75, cy + 11.5, tz), mm = pivot(hand(1.35, .14), scene, cx - 3.8, cy + 11.5, tz);
  MOVERS.push({update(){ const m = CLOCK.min; mm.rotation.x = -(m % 60)/60*Math.PI*2; hh.rotation.x = -((m/60) % 12)/12*Math.PI*2; }});
  // street lamps + strings of lanterns across the street
  for(let k=0;k<7;k++){ const lx = tx - 50 + k*16; for(const s of [-1, 1]){ const lz = tz + s*5.6, ly = H(lx, lz); G.push(cyl(.1, .14, 3.6, '#37474f', lx, ly, lz), sphere(.4, '#fff3c4', lx, ly + 3.8, lz, 0)); }
    for(let j=0;j<5;j++) G.push(sphere(.28, j % 2 ? '#e53935' : '#ffb300', lx + 8, y0 + 6.2 - Math.sin(j/4*Math.PI)*.8, tz - 5.2 + j*2.6, 0, 1.2)); LAMPS.push([lx, y0 + 3.8, tz - 5.6]); }
  scene.add(meshOf(G));
  sign(scene, 'Old Town', 'Phố cổ', tx - 64, tz + 7, Math.PI/2);
  sign(scene, 'Clock Tower', 'Tháp đồng hồ', cx - 8, tz + 7, Math.PI/2);
}
// ================= PAGODA TOWER + LOTUS POND =================
function buildPagoda(scene){
  const G = [], {x, z} = PAGODA, y = H(x, z);
  G.push(box(16, .8, 16, '#bdbdbd', x, y - .3, z), box(13, .5, 13, '#cfd8dc', x, y + .5, z));
  for(let k=0;k<5;k++){ const s = 9 - k*1.35, by = y + 1 + k*3.6; G.push(box(s, 2.8, s, k % 2 ? '#f5e6c8' : '#fff3e0', x, by, z), cone(s*.92, 1.3, '#8d2f23', x, by + 2.8, z, 4, Math.PI/4), boxAt(s*1.25, .15, s*1.25, '#6d1f17', x, by + 2.85, z, 0, Math.PI/4));
    for(const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) G.push(sphere(.22, PAL.yellow, x + dx*s*.62, by + 2.9, z + dz*s*.62, 0)); G.push(boxAt(1, 1.6, .15, '#5d4037', x, by + 1.3, z + s/2 + .05)); }
  G.push(cyl(.15, .3, 4, PAL.yellow, x, y + 19, z), sphere(.55, PAL.yellow, x, y + 23.2, z, 1), torus(.5, .12, PAL.yellow, x, y + 21.2, z, Math.PI/2));
  addRect(x, z, 13, 13);
  // stone lanterns and the lotus pond in front
  for(const s of [-1, 1]){ const lx = x + s*5, lz = z + 12; G.push(box(.9, 1.4, .9, '#9e9e9e', lx, H(lx, lz), lz), box(1.3, .6, 1.3, '#bdbdbd', lx, H(lx, lz) + 1.4, lz), cone(1, .7, '#9e9e9e', lx, H(lx, lz) + 2, lz, 4, Math.PI/4)); LAMPS.push([lx, H(lx, lz) + 1.7, lz]); addCircle(lx, lz, .9); }
  const px = x, pz = z + 24, py = H(px, pz); G.push(cyl(9, 9.4, .5, '#9e9e9e', px, py - .2, pz, 20), cyl(8.4, 8.4, .52, '#4fc3f7', px, py - .2, pz, 20)); addCircle(px, pz, 9.4);
  const r = rng(5); for(let k=0;k<14;k++){ const a = r()*Math.PI*2, d = r()*7; G.push(cyl(.9, .9, .08, '#43a047', px + Math.cos(a)*d, py + .33, pz + Math.sin(a)*d, 7)); if(k % 3 === 0) G.push(sphere(.35, '#f48fb1', px + Math.cos(a)*d, py + .6, pz + Math.sin(a)*d, 0, 1.3)); }
  scene.add(meshOf(G));
  sign(scene, 'Pagoda Tower', 'Tháp chùa cổ', x - 11, z + 12, 0);
}
// ================= WINDMILLS =================
function buildMills(scene){
  const G = [], {x:mx, z:mz} = MILLS, blades = merge([0, 1, 2, 3].map(k => { const g = colorize(new THREE.BoxGeometry(1.1, 6.5, .12), k % 2 ? '#fafafa' : '#ef9a9a'); g.translate(0, 3.4, 0); g.rotateZ(k*Math.PI/2); return g; }).concat([colorize(new THREE.CylinderGeometry(.5, .5, .6, 8).rotateX(Math.PI/2), '#5d4037')]));
  [[-22, 6], [0, -10], [24, 4]].forEach(([dx, dz], i) => { const x = mx + dx, z = mz + dz, y = H(x, z);
    G.push(cyl(1.6, 2.6, 12, '#eceff1', x, y, z, 10), cone(2.2, 3, TILE, x, y + 12, z, 10), boxAt(1.2, 2, .2, '#6d4c2e', x, y + 1, z + 2.45), boxAt(.8, .8, .2, '#81d4fa', x, y + 6, z + 2.05)); addCircle(x, z, 2.6);
    const b = new THREE.Mesh(blades, MAT.solid); b.position.set(x, y + 11, z + 2.2); b.castShadow = true; scene.add(b); const sp = .5 + i*.12; MOVERS.push({update(t){ b.rotation.z = t*sp; }}); });
  for(let k=0;k<18;k++){ const fx = mx - 40 + (k % 9)*10, fz = mz + 22 + Math.floor(k/9)*8; G.push(box(8, .5, 5, k % 3 ? '#f9a825' : '#8bc34a', fx, H(fx, fz) - .2, fz)); }   // sunflower / wheat beds
  scene.add(meshOf(G));
  sign(scene, 'Windmill Hill', 'Đồi cối xay gió', mx, mz + 16, 0);
}
// ================= LIGHTHOUSE (east cliff) =================
function buildLighthouse(scene){
  const a = -.32, d = edgeR(Math.cos(a)*500, Math.sin(a)*500) - 58;
  const x = Math.cos(a)*d, z = Math.sin(a)*d; LIGHT.x = x - Math.cos(a)*30; LIGHT.z = z - Math.sin(a)*30; const y = H(x, z), G = [];
  G.push(cyl(5, 5.5, 1, '#9e9e9e', x, y - .4, z, 14));
  for(let k=0;k<6;k++){ const r0 = 2.8 - k*.18; G.push(cyl(r0 - .18, r0, 3.2, k % 2 ? '#e53935' : '#fafafa', x, y + .6 + k*3.2, z, 14)); }
  const top = y + .6 + 6*3.2; G.push(cyl(2.4, 2.4, .4, '#37474f', x, top, z, 14), cyl(1.6, 1.6, 2.2, '#fff59d', x, top + .4, z, 10), cone(2, 1.8, '#c62828', x, top + 2.6, z, 10), sphere(.3, '#fafafa', x, top + 4.5, z, 0));
  for(let k=0;k<10;k++){ const b = k/10*Math.PI*2; G.push(boxAt(.08, .8, .08, '#263238', x + Math.cos(b)*2.3, top + .8, z + Math.sin(b)*2.3)); }
  G.push(box(6, 3.4, 5, '#fafafa', x - 6, y, z), cone(4.4, 2, '#c62828', x - 6, y + 3.4, z, 4, Math.PI/4), boxAt(1.2, 2, .2, '#5d4037', x - 6, y + 1, z + 2.55));
  addCircle(x, z, 3); addRect(x - 6, z, 6, 5); LAMPS.push([x, top + 1.5, z]);
  scene.add(meshOf(G));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3, 60, 12, 1, true).translate(0, -30, 0).rotateZ(Math.PI/2), new THREE.MeshBasicMaterial({color:'#fff8c4', transparent:true, opacity:.14, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending}));
  beam.position.set(x, top + 1.5, z); beam.frustumCulled = false; scene.add(beam); MOVERS.push({update(t){ beam.rotation.y = t*.6; }});
  sign(scene, 'Lighthouse', 'Ngọn hải đăng', x - 12, z + 6, Math.PI/2);
}
// ================= COVERED BRIDGE over the stream (walkable deck) =================
export const BRIDGE = {x:-245, z:-285, half:14, w:2.6, y:0};
function buildBridge(scene){
  const G = [], {x:bx, z:bz, half} = BRIDGE, yb = Math.max(H(bx - half, bz), H(bx + half, bz), 1.2); BRIDGE.y = yb;
  for(let k=0;k<14;k++){ const x0 = bx - half + (k + .5)*2*half/14, yy = bridgeY(x0); G.push(boxAt(2*half/14 + .05, .35, BRIDGE.w*2, '#8d6e4a', x0, yy - .17, bz, 0, 0, 0));
    if(k % 3 === 0) for(const s of [-1, 1]) G.push(boxAt(.25, 3, .25, '#5d4037', x0, yy + 1.5, bz + s*(BRIDGE.w - .1)));
    for(const s of [-1, 1]) G.push(boxAt(2*half/14, .12, .12, '#6d4c2e', x0, yy + .9, bz + s*(BRIDGE.w - .1))); }
  const ry = bridgeY(bx) + 3.1; G.push(boxAt(2*half - 2, .25, 3.2, TILE, bx, ry + .45, bz - 1.35, -.42, 0, 0), boxAt(2*half - 2, .25, 3.2, TILE, bx, ry + .45, bz + 1.35, .42, 0, 0), boxAt(2*half - 2, .3, .3, '#6d1f17', bx, ry + 1.1, bz));
  scene.add(meshOf(G));
  sign(scene, 'Covered Bridge', 'Cầu ngói', bx - half - 4, bz + 5, Math.PI/2);
}
const bridgeY = x => BRIDGE.y + .2 + 1.3*Math.cos(Math.min(1, Math.abs(x - BRIDGE.x)/BRIDGE.half)*Math.PI/2);
export function bridgeTop(x, z){ return (Math.abs(x - BRIDGE.x) < BRIDGE.half && Math.abs(z - BRIDGE.z) < BRIDGE.w) ? bridgeY(x) : -1e9; }

export function buildLandmarks(scene){ buildTown(scene); buildPagoda(scene); buildMills(scene); buildLighthouse(scene); buildBridge(scene); }
