// Farm animals (instanced), rideable mounts (horse, pony, ostrich, deer, phoenix, dragon, pegasus, sea turtle),
// NPC cyclists on many kinds of bikes, and a horse carriage that circles the island with stops.
import * as THREE from 'three';
import { PAL, heightAt, box, boxAt, cyl, cone, sphere, torus, merge, MAT, colorize, place, rng, edgeR } from './util.js';
import { FARM } from './zones2.js';
import { PEOPLE } from './people.js';
import { TRAILS } from './terrain.js';

const legGeo = (w, h, c) => { const g = colorize(new THREE.BoxGeometry(w, h, w), c); g.translate(0, -h/2, 0); return g; };
// ---------- farm animals ----------
const SPECIES = {
  cow:{n:8, area:'pasture', rad:40, sp:.8, body:() => merge([box(1.1, .9, 2, '#fafafa', 0, .9, 0), box(.5, .4, .6, '#212121', .3, 1.4, -.2), box(.5, .4, .5, '#212121', -.3, 1.1, .5), box(.6, .6, .7, '#fafafa', 0, 1.4, 1.2), box(.4, .25, .2, '#f8bbd0', 0, 1.3, 1.6), box(.1, .25, .1, '#eee', .25, 1.8, 1.1), box(.1, .25, .1, '#eee', -.25, 1.8, 1.1)]), leg:legGeo(.22, .9, '#fafafa'), lx:.4, lz:.75, ly:.9},
  sheep:{n:14, area:'pasture', rad:45, sp:.7, body:() => merge([sphere(.75, '#f5f5f5', 0, .95, 0, 1, .85), box(.4, .45, .5, '#424242', 0, 1.15, .75)]), leg:legGeo(.14, .6, '#424242'), lx:.3, lz:.4, ly:.6},
  goat:{n:6, area:'pasture', rad:40, sp:.9, body:() => merge([box(.6, .6, 1.2, '#d7ccc8', 0, .95, 0), box(.35, .45, .5, '#d7ccc8', 0, 1.3, .7), cone(.06, .3, '#8d6e63', .1, 1.5, .6), cone(.06, .3, '#8d6e63', -.1, 1.5, .6)]), leg:legGeo(.13, .7, '#a1887f'), lx:.22, lz:.45, ly:.7},
  pig:{n:6, area:'pig', rad:10, sp:.6, body:() => merge([box(.8, .65, 1.3, '#f8bbd0', 0, .6, 0), box(.35, .25, .15, '#f48fb1', 0, .7, .72)]), leg:legGeo(.14, .3, '#f48fb1'), lx:.28, lz:.45, ly:.3},
  chicken:{n:16, area:'coop', rad:14, sp:1.1, body:() => merge([sphere(.28, '#fff', 0, .45, 0, 1), sphere(.16, '#fff', 0, .72, .18, 0), box(.08, .1, .12, '#e53935', 0, .88, .2), cone(.05, .12, '#ffa000', 0, .66, .35, 4)]), leg:legGeo(.05, .25, '#ffa000'), lx:.1, lz:0, ly:.25}
};
export const ANIMALS = [];
let AIM = {};
export function buildAnimals(scene){
  const r = rng(21);
  for(const [k, S] of Object.entries(SPECIES)){ const body = new THREE.InstancedMesh(S.body(), MAT.solid, S.n), legs = new THREE.InstancedMesh(S.leg, MAT.solid, S.n*4); body.castShadow = true; body.frustumCulled = legs.frustumCulled = false; scene.add(body, legs);
    const out = new THREE.InstancedMesh(S.body().scale(1.08, 1.06, 1.06), MAT.outline, S.n); out.frustumCulled = false; scene.add(out);
    AIM[k] = {body, legs, out, S}; const [cx, cz] = FARM[S.area];
    for(let i=0;i<S.n;i++){ const a = r()*6.28, d = r()*S.rad*.8; ANIMALS.push({k, i, cx, cz, x:cx + Math.cos(a)*d, z:cz + Math.sin(a)*d*.7, yaw:r()*6.28, t:null, wait:r()*5, walk:0, sp:S.sp*(.8 + r()*.4), rad:S.rad, flee:0}); } }
}
const M = new THREE.Matrix4(), B = new THREE.Matrix4(), L = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
export function updateAnimals(dt, px, pz){
  const cnt = {};
  for(const a of ANIMALS){ const S = SPECIES[a.k]; let moving = false;
    const dp = Math.hypot(a.x - px, a.z - pz); if(dp < 4 && a.k !== 'cow' && !(a.tame > performance.now())){ a.t = [a.x + (a.x - px)/dp*8, a.z + (a.z - pz)/dp*8]; a.flee = 1; }
    if(!a.t){ a.wait -= dt; if(a.wait <= 0){ const ang = Math.random()*6.28, d = Math.random()*a.rad*.8; a.t = [a.cx + Math.cos(ang)*d, a.cz + Math.sin(ang)*d*.7]; } }
    else { const dx = a.t[0] - a.x, dz = a.t[1] - a.z, d = Math.hypot(dx, dz); if(d < .5){ a.t = null; a.wait = 2 + Math.random()*6; a.flee = 0; } else { const sp = a.sp*(a.flee ? 3 : 1); a.x += dx/d*sp*dt; a.z += dz/d*sp*dt; a.yaw = Math.atan2(dx, dz); a.walk += dt*sp*5; moving = true; } }
    const A = AIM[a.k], y = heightAt(a.x, a.z), hop = a.k === 'chicken' && moving ? Math.abs(Math.sin(a.walk))*.08 : 0;
    E.set(0, a.yaw, 0); Q.setFromEuler(E); V.set(a.x, y + hop, a.z); B.compose(V, Q, S1); A.body.setMatrixAt(a.i, B); A.out.setMatrixAt(a.i, B);
    const sw = moving ? Math.sin(a.walk)*.5 : 0; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], j) => { L.makeRotationX((sx*sz > 0 ? 1 : -1)*sw); L.setPosition(sx*S.lx, S.ly, sz*S.lz); M.multiplyMatrices(B, L); A.legs.setMatrixAt(a.i*4 + j, M); });
    a.y = y; }
  for(const k in AIM){ AIM[k].body.instanceMatrix.needsUpdate = AIM[k].legs.instanceMatrix.needsUpdate = AIM[k].out.instanceMatrix.needsUpdate = true; }
}
// ---------- mount models (built once, reused) ----------
export const MOUNTS = {
  horse:{en:'Horse', vi:'Ngựa', lvl:1, sp:12, fly:false, h:1.55},
  pony:{en:'Pony', vi:'Ngựa con', lvl:1, sp:8, fly:false, h:1.15},
  ostrich:{en:'Ostrich', vi:'Đà điểu', lvl:2, sp:14, fly:false, h:1.6},
  deer:{en:'Deer', vi:'Nai', lvl:2, sp:11, fly:false, h:1.4},
  phoenix:{en:'Phoenix', vi:'Phượng hoàng', lvl:3, sp:20, fly:true, h:1.1},
  dragon:{en:'Dragon', vi:'Rồng bay', lvl:4, sp:24, fly:true, h:1.4},
  pegasus:{en:'Winged Unicorn', vi:'Kỳ lân có cánh', lvl:3, sp:18, fly:true, h:1.5},
  turtle:{en:'Sea Turtle', vi:'Rùa biển', lvl:1, sp:6, fly:false, sea:true, h:.7}
};
function quad(col, mane, s = 1, extra = []){ const g = new THREE.Group(); const body = new THREE.Mesh(merge([box(.8*s, .8*s, 2*s, col, 0, 1*s, 0), box(.5*s, .9*s, .5*s, col, 0, 1.55*s, .95*s), box(.4*s, .4*s, .8*s, col, 0, 2.05*s, 1.25*s), box(.12*s, .7*s, .5*s, mane, 0, 1.75*s, .7*s), box(.15*s, .7*s, .15*s, mane, 0, 1.1*s, -1.05*s), ...extra]), MAT.solid); body.castShadow = true; g.add(body);
  const out = new THREE.Mesh(body.geometry, MAT.outline); out.scale.setScalar(1.05); out.position.y = -.02; g.add(out); g.legs = [];
  for(const [x, z] of [[.28, .75], [-.28, .75], [.28, -.75], [-.28, -.75]]){ const l = new THREE.Mesh(legGeo(.18*s, 1*s, col), MAT.solid); l.position.set(x*s, 1*s, z*s); g.add(l); g.legs.push(l); } return g; }
function wing(col, len, w = 1.2){ const g = new THREE.Group(); const m = new THREE.Mesh(merge([boxAt(len, .08, w, col, len/2, 0, 0), boxAt(len*.7, .06, w*.8, shade(col), len*.95, 0, -.2)]), MAT.solid); m.castShadow = true; g.add(m); return g; }
function shade(c){ const k = new THREE.Color(c); k.offsetHSL(0, 0, .1); return '#' + k.getHexString(); }
export function makeMount(kind){
  let g;
  if(kind === 'horse') g = quad('#8d5524', '#3e2723');
  else if(kind === 'pony') g = quad('#ffcc80', '#fff', .75);
  else if(kind === 'deer') g = quad('#a1887f', '#6d4c41', .9, [cone(.05, .7, '#efebe9', .15, 2.6*.9, 1.2*.9), cone(.05, .7, '#efebe9', -.15, 2.6*.9, 1.2*.9)]);
  else if(kind === 'ostrich'){ g = new THREE.Group(); const b = new THREE.Mesh(merge([sphere(.8, '#212121', 0, 1.7, 0, 1, .8), box(.15, 1.2, .15, '#f8bbd0', 0, 2.3, .6), sphere(.25, '#f8bbd0', 0, 2.95, .7, 0), cone(.08, .3, '#ffb74d', 0, 2.95, .95, 4), sphere(.4, '#fafafa', 0, 1.9, -.7, 0)]), MAT.solid); b.castShadow = true; g.add(b); g.legs = []; for(const x of [.25, -.25]){ const l = new THREE.Mesh(legGeo(.12, 1.3, '#f8bbd0'), MAT.solid); l.position.set(x, 1.3, 0); g.add(l); g.legs.push(l); } }
  else if(kind === 'pegasus'){ g = quad('#fafafa', '#ce93d8', 1, [cone(.07, .8, PAL.yellow, 0, 2.35, 1.55)]); g.wings = [wing('#fff', 2.6), wing('#fff', 2.6)]; g.wings.forEach((w, i) => { w.position.set(i ? -.4 : .4, 1.6, .2); if(i) w.scale.x = -1; g.add(w); }); }
  else if(kind === 'phoenix'){ g = new THREE.Group(); const b = new THREE.Mesh(merge([sphere(.9, '#ff5722', 0, 1.2, 0, 1, .8), sphere(.5, '#ff9800', 0, 1.9, .9, 1), cone(.12, .5, PAL.yellow, 0, 1.85, 1.45, 4), boxAt(.5, .1, 2.4, '#ffca28', 0, 1.1, -1.8, .3, 0, 0), boxAt(.3, .1, 2, '#ff7043', .4, 1.1, -1.7, .3, .3, 0), boxAt(.3, .1, 2, '#ff7043', -.4, 1.1, -1.7, .3, -.3, 0)]), MAT.glow); g.add(b); g.wings = [wing('#ff7043', 3.2, 1.4), wing('#ff7043', 3.2, 1.4)]; g.wings.forEach((w, i) => { w.position.set(i ? -.5 : .5, 1.4, .1); if(i) w.scale.x = -1; w.children[0].material = MAT.glow; g.add(w); }); }
  else if(kind === 'dragon'){ g = new THREE.Group(); const seg = new THREE.InstancedMesh(colorize(new THREE.IcosahedronGeometry(.55, 0), '#2e7d32'), MAT.solid, 12); seg.frustumCulled = false; seg.castShadow = true; g.add(seg); g.segs = seg;
    const head = new THREE.Mesh(merge([box(.9, .7, 1.4, '#388e3c', 0, 1.2, 1.2), cone(.08, .6, PAL.yellow, .25, 1.75, 1), cone(.08, .6, PAL.yellow, -.25, 1.75, 1), box(.7, .2, .5, '#1b5e20', 0, .95, 1.9)]), MAT.solid); g.add(head); g.wings = [wing('#66bb6a', 3.6, 1.6), wing('#66bb6a', 3.6, 1.6)]; g.wings.forEach((w, i) => { w.position.set(i ? -.5 : .5, 1.4, .2); if(i) w.scale.x = -1; g.add(w); }); }
  else if(kind === 'turtle'){ g = new THREE.Group(); const b = new THREE.Mesh(merge([sphere(1.6, '#2e7d32', 0, .3, 0, 1, .45), sphere(.45, '#8bc34a', 0, .25, 1.8, 0), ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([x, z]) => boxAt(.9, .15, .5, '#8bc34a', x*1.4, .1, z*.9, 0, x*z*.5, 0))]), MAT.solid); g.add(b); g.legs = []; }
  g.kind = kind; return g;
}
// animate a mount: running legs, flapping wings, dragon body wave
export function animMount(g, t, speed, fly){
  if(g.legs) g.legs.forEach((l, i) => { l.rotation.x = speed > .3 ? Math.sin(t*speed*.9 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI/2 : 0))*.7 : 0; });
  if(g.wings){ const f = fly ? Math.sin(t*(g.kind === 'dragon' ? 3 : 6))*.6 : -.9; g.wings[0].rotation.z = f; g.wings[1].rotation.z = -f; }
  if(g.segs){ const m = new THREE.Matrix4(); for(let k=0;k<12;k++){ m.makeTranslation(Math.sin(t*3 - k*.5)*.4*(k/12), 1.2 + Math.sin(t*2 - k*.6)*.2, -k*.75); const s = 1 - k*.06; m.scale(new THREE.Vector3(s, s, s)); g.segs.setMatrixAt(k, m); } g.segs.instanceMatrix.needsUpdate = true; }
}
// ---------- NPC fliers circling the island, NPC cyclists, the carriage ----------
export const NPC_FLY = [], BIKES = [], CARRIAGE = {};
export function buildTraffic(scene, people){
  let pi = people.length - 1;
  [['phoenix', 380, 70, .05], ['dragon', 520, 95, -.035], ['pegasus', 260, 55, .07]].forEach(([k, R, h, w], n) => { const g = makeMount(k); scene.add(g); const rider = people[pi--]; rider.ride = g; rider.sit = 1; NPC_FLY.push({g, R, h, w, a:n*2, rider, kind:k}); });
  if(NPC_FLY[1]){ const trail = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(60*3), 3)), new THREE.PointsMaterial({color:'#ffb74d', size:.9, transparent:true, opacity:.8, depthWrite:false})); trail.frustumCulled = false; scene.add(trail); NPC_FLY[0].trail = trail; }
  const BT = [['city', '#ff8a65', 'Xe đạp thành phố'], ['tandem', '#4fc3f7', 'Xe đạp đôi'], ['bmx', '#ab47bc', 'Xe BMX'], ['cargo', '#8d6e63', 'Xe chở hàng'], ['tricycle', '#ffd54f', 'Xe ba bánh'], ['childseat', '#81c784', 'Xe có ghế trẻ em']];
  BT.forEach(([k, col, vi], n) => { const parts = [torus(.42, .05, '#212121', 0, .45, .65, 0, Math.PI/2, 12), torus(.42, .05, '#212121', 0, .45, -.65, 0, Math.PI/2, 12), boxAt(.08, .08, 1.3, col, 0, .8, 0), boxAt(.08, .7, .08, col, 0, .75, -.3, .3), boxAt(.08, .7, .08, col, 0, .8, .55, -.3), boxAt(.5, .06, .06, '#424242', 0, 1.15, .65), box(.3, .08, .4, '#212121', 0, 1.05, -.35), sphere(.1, '#fff59d', 0, 1.05, .78, 0)];
    if(k === 'city') parts.push(box(.4, .3, .35, '#a1887f', 0, .95, .9)); if(k === 'tandem') parts.push(boxAt(.08, .08, 1.2, col, 0, .8, -1.1), torus(.42, .05, '#212121', 0, .45, -1.7, 0, Math.PI/2, 12), box(.3, .08, .4, '#212121', 0, 1.05, -1.3));
    if(k === 'cargo') parts.push(box(.9, .5, .8, '#6d4c41', 0, .5, 1.3), torus(.32, .05, '#212121', .35, .35, 1.3, 0, Math.PI/2, 10), torus(.32, .05, '#212121', -.35, .35, 1.3, 0, Math.PI/2, 10));
    if(k === 'tricycle') parts.push(torus(.3, .05, '#212121', .4, .35, -.65, 0, Math.PI/2, 10), torus(.3, .05, '#212121', -.4, .35, -.65, 0, Math.PI/2, 10), boxAt(.9, .06, .06, col, 0, .45, -.65));
    if(k === 'childseat') parts.push(box(.4, .4, .4, '#ffeb3b', 0, 1.05, -.75)); if(k === 'bmx') parts.push(boxAt(.6, .06, .06, '#212121', 0, 1.25, .62));
    const m = new THREE.Mesh(merge(parts), MAT.solid); m.castShadow = true; scene.add(m); const rider = people[pi--]; rider.ride = m; rider.sit = 1; rider.pedal = true; BIKES.push({m, rider, a:n/6*Math.PI*2, w:(n % 2 ? 1 : -1)*(.022 + n*.003), R:205 + (n % 3 - 1)*1.6, kind:k, vi, lastBell:0}); });
  // carriage
  const horse = makeMount('horse'); const cart = new THREE.Mesh(merge([box(2.2, 1.6, 3, '#6d4c41', 0, .9, 0), box(2.4, .2, 3.2, '#ffd23f', 0, 2.5, 0), box(2.3, .9, .1, '#fff8e1', 0, 1.4, 1.52), torus(.6, .08, '#3e2723', 1.15, .6, .9, 0, Math.PI/2, 12), torus(.6, .08, '#3e2723', -1.15, .6, .9, 0, Math.PI/2, 12), torus(.6, .08, '#3e2723', 1.15, .6, -.9, 0, Math.PI/2, 12), torus(.6, .08, '#3e2723', -1.15, .6, -.9, 0, Math.PI/2, 12), boxAt(.08, .08, 2.6, '#3e2723', .5, 1, 2.6), boxAt(.08, .08, 2.6, '#3e2723', -.5, 1, 2.6)]), MAT.solid); cart.castShadow = true; scene.add(horse, cart);
  const driver = people[pi--]; driver.ride = cart; driver.sit = 1; Object.assign(CARRIAGE, {horse, cart, driver, a:0, R:480, stop:0, stops:[0, Math.PI/2, Math.PI, Math.PI*1.5], next:1, wait:0, passenger:null});
  return pi;
}
const ttmp = new THREE.Vector3();
export function updateTraffic(dt, t){
  for(const f of NPC_FLY){ f.a += f.w*dt; const x = Math.cos(f.a)*f.R, z = Math.sin(f.a)*f.R, y = f.h + Math.sin(t*.4 + f.R)*8; f.g.position.set(x, y, z); f.g.rotation.y = Math.atan2(-Math.sin(f.a)*Math.sign(f.w), Math.cos(f.a)*Math.sign(f.w)); f.g.rotation.z = -Math.sign(f.w)*.25; animMount(f.g, t, 0, true);
    const r = f.rider; r.x = x; r.z = z; r.y = y + MOUNTS[f.kind].h; r.yaw = f.g.rotation.y; r.roll = f.g.rotation.z;
    if(f.trail){ const a = f.trail.geometry.attributes.position.array; a.copyWithin(3, 0, a.length - 3); a[0] = x - Math.sin(f.g.rotation.y)*2 + (Math.random() - .5); a[1] = y + 1 + (Math.random() - .5); a[2] = z - Math.cos(f.g.rotation.y)*2 + (Math.random() - .5); f.trail.geometry.attributes.position.needsUpdate = true; } }
  for(const b of BIKES){ b.a += b.w*dt; const x = Math.cos(b.a)*b.R, z = Math.sin(b.a)*b.R, y = heightAt(x, z), yaw = Math.atan2(-Math.sin(b.a)*Math.sign(b.w), Math.cos(b.a)*Math.sign(b.w)); b.m.position.set(x, y, z); b.m.rotation.y = yaw; const r = b.rider; r.x = x; r.z = z; r.y = y + .25; r.yaw = yaw; r.walk += dt*6; r.speed = 0; }
  const C = CARRIAGE; if(C.cart){ if(C.wait > 0) C.wait -= dt; else { C.a += dt*.02; const tgt = C.stops[C.next]; if(Math.abs(((C.a - tgt) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI) < .01){ C.wait = 8; C.stop = C.next; C.next = (C.next + 1) % C.stops.length; } }
    const a = C.a, x = Math.cos(a)*C.R, z = Math.sin(a)*C.R, y = heightAt(x, z), yaw = Math.atan2(-Math.sin(a), Math.cos(a)); C.cart.position.set(x, y, z); C.cart.rotation.y = yaw; C.horse.position.set(x + Math.sin(yaw)*4.2, heightAt(x + Math.sin(yaw)*4.2, z + Math.cos(yaw)*4.2), z + Math.cos(yaw)*4.2); C.horse.rotation.y = yaw; animMount(C.horse, t, C.wait > 0 ? 0 : 8, false);
    const d = C.driver; d.x = x + Math.sin(yaw)*1.2; d.z = z + Math.cos(yaw)*1.2; d.y = y + 1.4; d.yaw = yaw; C.moving = C.wait <= 0; }
}
