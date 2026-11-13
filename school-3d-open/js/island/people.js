// Everyone (the player is person 0) drawn with a few InstancedMeshes: torso, head, hair, arms, legs, lanterns + dark outlines.
import * as THREE from 'three';
import { heightAt, blocked, colorize, MAT, rng, IS_PHONE } from './util.js';

const part = (w, h, d, ox, oy, oz) => { const g = colorize(new THREE.BoxGeometry(w, h, d), '#ffffff'); g.translate(ox, oy, oz); return g; };
const GEO = { torso:part(.7, .8, .42, 0, 1.15, 0), head:part(.52, .52, .5, 0, 1.82, 0), hair:part(.56, .2, .56, 0, 2.12, -.02), leg:part(.26, .76, .3, 0, -.38, 0), arm:part(.2, .72, .24, 0, -.34, 0), lantern:part(.22, .3, .22, 0, -.85, .12) };
const OUT = { torso:part(.78, .88, .5, 0, 1.15, 0), head:part(.6, .6, .58, 0, 1.82, 0) };
export const PEOPLE = [];
const SKIN = ['#f2c9a0', '#e0ac69', '#c68642', '#f1d4b3', '#8d5524'], HAIR = ['#22140c', '#3b2416', '#6d4c2e', '#111', '#a0522d', '#d4a017'], SHIRT = ['#ef4b4b', '#3d7bff', '#2fbf71', '#ffd23f', '#ff8a2b', '#b06bff', '#f4f4f4', '#00bcd4', '#e91e63'], PANTS = ['#24356b', '#37474f', '#5d4037', '#212121', '#1a237e'];
const NAMES = ['Minh', 'Lan', 'Khoa', 'Vy', 'Huy', 'Nhi', 'Long', 'Thảo', 'Bảo', 'Mai', 'Phong', 'Linh', 'Quân', 'Hà', 'Tú', 'Ngọc', 'Đạt', 'An', 'Cô Mai', 'Thầy Đức', 'Bác Năm'];
// places NPCs walk between, by time of day
export const POI = { school:[[0, -10], [-20, -30], [20, -30], [10, 0], [-12, -45], [15, -45]], canteen:[[-62, 34], [-55, 40]], brain:[[-300, -20], [-300, 40], [-290, 120], [-210, -60], [-200, 100]], sports:[[300, -60], [215, 40], [370, 40], [300, 175]], play:[[0, 290], [-20, 300], [70, 320], [-60, 290], [0, 395], [55, 410]], farm:[[-110, -275], [0, -360], [120, -275], [100, -420], [-140, -400]], town:[[-320, 340], [-280, 340], [-240, 340], [-300, 342], [-260, 338]] };
let IM = {}, N = 0;
export function buildPeople(scene, count){
  N = count + 1; const mk = (g, n, mat = MAT.solid) => { const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; m.castShadow = mat === MAT.solid; scene.add(m); return m; };
  IM = { torso:mk(GEO.torso, N), head:mk(GEO.head, N), hair:mk(GEO.hair, N), leg:mk(GEO.leg, N*2), arm:mk(GEO.arm, N*2), lantern:mk(GEO.lantern, N, new THREE.MeshBasicMaterial({color:'#ffcc66'})), oT:mk(OUT.torso, N, MAT.outline), oH:mk(OUT.head, N, MAT.outline) };
  const r = rng(77), C = new THREE.Color();
  for(let i=0;i<N;i++){ const p = {i, name:i ? NAMES[(i - 1) % NAMES.length] : 'Bạn', x:0, y:0, z:40, yaw:Math.PI, walk:0, speed:0, sit:0, ride:null, fall:0, wave:0, lantern:false, far:0, acc:0,
      target:null, wait:r()*4, home:null, npc:i > 0, skin:SKIN[Math.floor(r()*SKIN.length)], shirt:SHIRT[Math.floor(r()*SHIRT.length)], pants:PANTS[Math.floor(r()*PANTS.length)], hair:HAIR[Math.floor(r()*HAIR.length)], hidden:false};
    if(i){ const keys = Object.keys(POI), k = keys[i % keys.length], q = POI[k][i % POI[k].length]; p.x = q[0] + (r() - .5)*10; p.z = q[1] + (r() - .5)*10; }
    if(i === 0){ p.shirt = '#ef4b4b'; p.pants = '#24356b'; }
    IM.torso.setColorAt(i, C.set(p.shirt)); IM.head.setColorAt(i, C.set(p.skin)); IM.hair.setColorAt(i, C.set(p.hair)); for(const s of [0, 1]){ IM.leg.setColorAt(i*2 + s, C.set(p.pants)); IM.arm.setColorAt(i*2 + s, C.set(p.shirt)); }
    p.y = heightAt(p.x, p.z); PEOPLE.push(p); }
  return PEOPLE;
}
// NPC brains: walk to a place that fits the hour, idle, sometimes trip and get up again
function pickTarget(p, hour, r){ const k = hour < 7 ? 'play' : hour < 11 ? 'school' : hour < 12.5 ? 'canteen' : hour < 16 ? ['brain', 'sports', 'farm', 'school', 'town'][p.i % 5] : hour < 20 ? ['play', 'sports', 'farm', 'town'][p.i % 4] : 'play'; const L = POI[k], q = L[Math.floor(r()*L.length)]; return [q[0] + (r() - .5)*12, q[1] + (r() - .5)*12]; }
const R = Math.random;
export function updateNPC(p, dt, hour){
  if(p.ride || p.hidden) return;
  if(p.fall > 0){ p.fall -= dt; p.speed = 0; return; }
  if(!p.target){ p.wait -= dt; if(p.wait <= 0) p.target = pickTarget(p, hour, R); p.speed = 0; return; }
  const dx = p.target[0] - p.x, dz = p.target[1] - p.z, d = Math.hypot(dx, dz); if(d < 1.5){ p.target = null; p.wait = 3 + R()*8; p.speed = 0; return; }
  const sp = 1.6, nx = p.x + dx/d*sp*dt, nz = p.z + dz/d*sp*dt; { let d = Math.atan2(dx, dz) - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d*Math.min(1, dt*6); }
  if(!blocked(nx, nz, .4)){ p.x = nx; p.z = nz; } else if(!blocked(nx, p.z, .4)) p.x = nx; else if(!blocked(p.x, nz, .4)) p.z = nz; else { p.target = null; p.wait = .5; }
  p.speed = sp; p.walk += dt*sp*3.2; if(R() < dt*.004) p.fall = 2 + R()*2;
  p.y = heightAt(p.x, p.z);
}
// write every person's parts into the instanced meshes
const M = new THREE.Matrix4(), B = new THREE.Matrix4(), L = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), Z = new THREE.Matrix4().makeScale(0, 0, 0);
export function drawPeople(camPos, t, night){
  for(const p of PEOPLE){ const i = p.i;
    if(p.hidden){ for(const k of ['torso', 'head', 'hair', 'lantern', 'oT', 'oH']) IM[k].setMatrixAt(i, Z); for(const s of [0, 1]){ IM.leg.setMatrixAt(i*2 + s, Z); IM.arm.setMatrixAt(i*2 + s, Z); } continue; }
    const dist = Math.hypot(p.x - camPos.x, p.z - camPos.z); p.acc += 1/60; if(dist > 60 && p.acc < .1 && p.drawn) continue; p.acc = 0; p.drawn = true;
    const nw = performance.now(), fdt = Math.min(.1, (nw - (p.lt || nw))/1000); p.lt = nw; p.amp = (p.amp || 0) + ((p.speed > .2 ? Math.min(1, .45 + p.speed*.12) : 0) - (p.amp || 0))*Math.min(1, fdt*12); if(p.amp < .02 && p.speed <= .2){ p.amp = 0; p.walk = 0; }
    const sw = Math.sin(p.walk)*p.amp, bob = Math.abs(Math.sin(p.walk))*.07*p.amp, lean = Math.min(.18, p.speed*.022);
    E.set(p.fall > 0 ? -Math.PI/2*Math.min(1, p.fall*2) : lean, p.yaw, p.roll || 0); Q.setFromEuler(E); V.set(p.x, p.y + bob + (p.fall > 0 ? .3 : 0) + (p.lift || 0), p.z); B.compose(V, Q, S1);
    for(const k of ['torso', 'head', 'hair']) IM[k].setMatrixAt(i, B); IM.oT.setMatrixAt(i, B); IM.oH.setMatrixAt(i, B);
    const sit = p.sit, legA = sit ? -1.35 + Math.sin(p.walk)*.5*(p.pedal ? 1 : 0) : p.air ? -.55 : sw*.7, legB = sit ? -1.35 - Math.sin(p.walk)*.5*(p.pedal ? 1 : 0) : p.air ? .25 : -sw*.7;
    for(const s of [0, 1]){ L.makeRotationX(s ? legB : legA); L.setPosition(s ? .17 : -.17, .76, 0); M.multiplyMatrices(B, L); IM.leg.setMatrixAt(i*2 + s, M);
      let armA = p.air ? -2.4 : p.swim ? -1.6 + Math.sin(t*4 + s*Math.PI)*1.2 : s ? sw*.7 : -sw*.7; if(p.wave > 0 && s === 1){ armA = -2.6 + Math.sin(t*12)*.4; } if(sit && p.ride) armA = -1.1; if(p.lantern && s === 1 && !sit) armA = -.35;
      L.makeRotationX(armA); L.setPosition(s ? .46 : -.46, 1.5, 0); M.multiplyMatrices(B, L); IM.arm.setMatrixAt(i*2 + s, M);
      if(s === 1){ if(p.lantern && night && !sit){ IM.lantern.setMatrixAt(i, M); } else IM.lantern.setMatrixAt(i, Z); } }
  }
  for(const k in IM) IM[k].instanceMatrix.needsUpdate = true;
}
export const peopleMeshes = () => IM;
