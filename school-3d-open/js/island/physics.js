// Light physics for things near the player (balls, crates; sleep when still; fixed 1/60 step, max 2 sub-steps)
// and the Build Zone: place Rubik blocks, planks, ramps, springs and lamps; undo; saved in localStorage.
import * as THREE from 'three';
import { heightAt, colorize, MAT, store, merge, boxAt, place, PAL } from './util.js';

const BODIES = [];
const ballGeo = (() => { const g = colorize(new THREE.IcosahedronGeometry(.55, 1), '#fafafa'); const c = g.attributes.color.array; for(let i=0;i<c.length/9;i++) if(i % 4 === 0) for(let k=0;k<9;k++) c[i*9 + k] = k % 3 === 2 ? .1 : .1; return g; })();
const crateGeo = colorize(new THREE.BoxGeometry(1.2, 1.2, 1.2), '#c08a4b');
export function buildPhysics(scene){
  const add = (geo, r, x, z, mass, bounce) => { const m = new THREE.Mesh(geo, MAT.solid); m.castShadow = true; scene.add(m); const b = {m, r, x, z, y:heightAt(x, z) + r + .5, vx:0, vy:0, vz:0, mass, bounce, sleep:false, box:geo === crateGeo}; BODIES.push(b); return b; };
  add(ballGeo, .55, 300, -90, 1, .55); add(ballGeo, .55, 0, 292, 1, .55); add(ballGeo, .55, 215, 40, 1, .6);
  for(let i=0;i<6;i++) add(crateGeo, .6, -10 + (i % 3)*1.3, 270 + Math.floor(i/3)*1.3, 3, .1);
  for(let i=0;i<4;i++) add(crateGeo, .6, 290 + i*1.4, -40, 3, .1);
}
let acc = 0;
export function stepPhysics(dt, px, pz, pvx, pvz){
  acc = Math.min(acc + dt, 2/60);
  while(acc >= 1/60){ acc -= 1/60; const h = 1/60;
    for(const b of BODIES){ const dp = Math.hypot(b.x - px, b.z - pz); if(dp > 60){ b.sleep = true; continue; }
      // the player pushes or kicks
      if(dp < b.r + .5){ const nx = (b.x - px)/(dp || 1), nz = (b.z - pz)/(dp || 1), pv = Math.hypot(pvx, pvz); const kick = b.mass < 2 ? 1.6 : .5; b.vx += nx*(2 + pv*kick); b.vz += nz*(2 + pv*kick); if(b.mass < 2) b.vy += 2 + pv*.4; b.x = px + nx*(b.r + .52); b.z = pz + nz*(b.r + .52); b.sleep = false; }
      if(b.sleep) continue;
      b.vy -= 18*h; b.x += b.vx*h; b.y += b.vy*h; b.z += b.vz*h; const g = Math.max(heightAt(b.x, b.z), -1) + b.r;
      if(b.y < g){ b.y = g; b.vy = Math.abs(b.vy) > 1.5 ? -b.vy*b.bounce : 0; const f = Math.pow(b.box ? .02 : .35, h); b.vx *= f; b.vz *= f; }
      for(const o of BODIES){ if(o === b) continue; const dx = o.x - b.x, dz = o.z - b.z, dy = o.y - b.y, d = Math.hypot(dx, dy, dz), m = b.r + o.r; if(d < m && d > 0){ const k = (m - d)/2, nx = dx/d, ny = dy/d, nz = dz/d; b.x -= nx*k; b.y -= ny*k; b.z -= nz*k; o.x += nx*k; o.y += ny*k; o.z += nz*k; const rv = (o.vx - b.vx)*nx + (o.vy - b.vy)*ny + (o.vz - b.vz)*nz; if(rv < 0){ const j = -rv*.8/(1/b.mass + 1/o.mass); b.vx -= j*nx/b.mass; b.vy -= j*ny/b.mass; b.vz -= j*nz/b.mass; o.vx += j*nx/o.mass; o.vy += j*ny/o.mass; o.vz += j*nz/o.mass; o.sleep = false; } } }
      if(Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.vz) < .05 && b.y - g < .01) b.sleep = true; } }
  for(const b of BODIES){ b.m.position.set(b.x, b.y, b.z); if(!b.box){ b.m.rotation.x += b.vz*dt/b.r; b.m.rotation.z -= b.vx*dt/b.r; } }
}
// ---------- Build Zone ----------
export const BUILD = {on:false, kind:'cube', color:0, list:[], im:{}, cx:105, cz:255, half:14};
const KINDS = {cube:{geo:() => new THREE.BoxGeometry(1, 1, 1), h:1, vi:'Khối Rubik'}, plank:{geo:() => new THREE.BoxGeometry(3, .25, 1), h:.25, vi:'Ván gỗ'}, ramp:{geo:() => { const g = new THREE.BoxGeometry(1, 1, 2); g.rotateX(-.46); g.translate(0, -.1, 0); return g; }, h:.8, vi:'Dốc'}, spring:{geo:() => new THREE.CylinderGeometry(.45, .45, .5, 10), h:.5, vi:'Lò xo nhún'}, lamp:{geo:() => new THREE.CylinderGeometry(.18, .18, 2, 8), h:2, vi:'Đèn'}};
export const BUILD_COLORS = [PAL.red, PAL.yellow, PAL.blue, PAL.green, PAL.white, PAL.orange, PAL.purple, PAL.wood];
export function buildInit(scene){ for(const k in KINDS){ const g = colorize(KINDS[k].geo(), '#ffffff'); const m = new THREE.InstancedMesh(g, k === 'lamp' ? new THREE.MeshBasicMaterial({color:'#fff3c4'}) : MAT.solid, 400); m.count = 0; m.castShadow = true; m.frustumCulled = false; scene.add(m); BUILD.im[k] = m; } BUILD.list = store.get('build', []); buildRender(); }
const BM = new THREE.Matrix4(), BC = new THREE.Color();
export function buildRender(){ for(const k in BUILD.im) BUILD.im[k].count = 0; for(const it of BUILD.list){ const m = BUILD.im[it.k]; if(!m || m.count >= 400) continue; BM.makeRotationY(it.r || 0); BM.setPosition(it.x, it.y, it.z); m.setMatrixAt(m.count, BM); m.setColorAt(m.count, BC.set(BUILD_COLORS[it.c] || '#fff')); m.count++; } for(const k in BUILD.im){ BUILD.im[k].instanceMatrix.needsUpdate = true; if(BUILD.im[k].instanceColor) BUILD.im[k].instanceColor.needsUpdate = true; } }
export const inBuild = (x, z) => Math.abs(x - BUILD.cx) < BUILD.half && Math.abs(z - BUILD.cz) < BUILD.half;
export function buildPlace(x, z, yaw){ if(!inBuild(x, z)) return false; const gx = Math.round(x), gz = Math.round(z); let top = heightAt(gx, gz); for(const it of BUILD.list) if(Math.abs(it.x - gx) < .6 && Math.abs(it.z - gz) < .6) top = Math.max(top, it.y + KINDS[it.k].h/2);
  const K = KINDS[BUILD.kind]; BUILD.list.push({k:BUILD.kind, x:gx, z:gz, y:top + K.h/2, c:BUILD.color, r:Math.round((yaw || 0)/(Math.PI/2))*Math.PI/2}); if(BUILD.list.length > 600) BUILD.list.shift(); store.set('build', BUILD.list); buildRender(); return true; }
export function buildUndo(){ BUILD.list.pop(); store.set('build', BUILD.list); buildRender(); }
export function springUnder(x, z, y){ return BUILD.list.some(it => it.k === 'spring' && Math.abs(it.x - x) < .6 && Math.abs(it.z - z) < .6 && Math.abs(it.y + .25 - y) < .4); }
export function buildTop(x, z){ let top = -1e9; for(const it of BUILD.list) if(Math.abs(it.x - x) < .55 && Math.abs(it.z - z) < .55) top = Math.max(top, it.y + KINDS[it.k].h/2); return top; }
