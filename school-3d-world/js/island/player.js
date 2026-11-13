// Player: joystick (left half) + camera drag (right half) + pinch zoom, keyboard, tap-to-walk, jump, swim, ride mounts / fly / carriage.
import * as THREE from 'three';
import { heightAt, blocked, PLACES, store, edgeR } from './util.js';
import { MOUNTS, makeMount, animMount, CARRIAGE } from './creatures.js';

export const P = {x:0, z:46, y:2, vx:0, vz:0, vy:0, yaw:Math.PI, ground:true, swim:false, mount:null, mg:null, fly:false, alt:0, ride:null, target:null, onArrive:null, joy:{x:0, y:0, on:false}, keys:{}, camYaw:0, camPitch:.42, camDist:11, up:0};
let scene, camera, person, terrain;
export function initPlayer(sc, cam, pers, terr){ scene = sc; camera = cam; person = pers; terrain = terr; P.y = heightAt(P.x, P.z); P.camYaw = 0; bindInput(); }
// ---------- input ----------
function bindInput(){
  const cv = document.getElementById('c3d'), joy = (window.ISL || document).querySelector('#joy'), knob = joy.querySelector('i'); const ptrs = new Map(); let jid = null, jx = 0, jy = 0, camId = null, lx = 0, ly = 0, pinch = 0, tapT = 0, tapX = 0, tapY = 0, moved = false;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY}); tapT = performance.now(); tapX = e.clientX; tapY = e.clientY; moved = false;
    if(ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); jid = null; P.joy.on = false; joy.hidden = true; return; }
    if(e.pointerType !== 'mouse' && e.clientX < innerWidth*.45 && jid == null){ jid = e.pointerId; jx = e.clientX; jy = e.clientY; P.joy.on = true; joy.hidden = false; joy.style.left = (jx - 60) + 'px'; joy.style.top = (jy - 60) + 'px'; knob.style.transform = ''; }
    else { camId = e.pointerId; lx = e.clientX; ly = e.clientY; } });
  cv.addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId); if(!p) return; p.x = e.clientX; p.y = e.clientY; if(Math.hypot(e.clientX - tapX, e.clientY - tapY) > 10) moved = true;
    if(ptrs.size === 2){ const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if(pinch) P.camDist = Math.max(4, Math.min(40, P.camDist*pinch/d)); pinch = d; return; }
    if(e.pointerId === jid){ let dx = e.clientX - jx, dy = e.clientY - jy; const L = Math.hypot(dx, dy), m = 55; if(L > m){ dx *= m/L; dy *= m/L; } P.joy.x = dx/m; P.joy.y = dy/m; knob.style.transform = `translate(${dx}px, ${dy}px)`; P.target = null; }
    else if(e.pointerId === camId){ P.camYaw -= (e.clientX - lx)*.006; P.camPitch = Math.max(.08, Math.min(1.25, P.camPitch + (e.clientY - ly)*.004)); lx = e.clientX; ly = e.clientY; } });
  const up = e => { ptrs.delete(e.pointerId); if(e.pointerId === jid){ jid = null; P.joy.x = P.joy.y = 0; P.joy.on = false; joy.hidden = true; } if(e.pointerId === camId) camId = null; if(ptrs.size < 2) pinch = 0;
    if(!moved && performance.now() - tapT < 300 && e.type === 'pointerup') tapAt(e.clientX, e.clientY); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); P.camDist = Math.max(4, Math.min(40, P.camDist*(e.deltaY > 0 ? 1.1 : .9))); }, {passive:false});
  addEventListener('keydown', e => { if(e.target.tagName === 'INPUT') return; P.keys[e.code] = true; if(e.code === 'Space'){ jump(); e.preventDefault(); } if(e.code === 'KeyQ' && P.fly) P.up = 1; if(e.code === 'KeyE' && P.fly) P.up = -1; });
  addEventListener('keyup', e => { P.keys[e.code] = false; if(e.code === 'KeyQ' || e.code === 'KeyE') P.up = 0; });
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let groundTap = null; export const setGroundTap = f => { groundTap = f; }; let floorFn = null; export const setFloor = f => { floorFn = f; };
export let onPlace = null; export const setOnPlace = f => { onPlace = f; };
function tapAt(cx, cy){
  ndc.set(cx/innerWidth*2 - 1, -(cy/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
  // signs first (closest place whose screen position is near the tap)
  let best = null, bd = 60; const v = new THREE.Vector3(); for(const p of PLACES){ v.set(p.x, heightAt(p.x, p.z) + 2.6, p.z).project(camera); if(v.z > 1) continue; const sx = (v.x + 1)/2*innerWidth, sy = (1 - v.y)/2*innerHeight, d = Math.hypot(sx - cx, sy - cy); if(d < bd){ bd = d; best = p; } }
  if(best){ walkTo(best.x, best.z + 3, () => onPlace && onPlace(best)); return; }
  const hit = ray.intersectObject(terrain, false)[0]; if(hit && groundTap && groundTap(hit.point)) return; if(hit && !P.mount && !P.ride) walkTo(hit.point.x, hit.point.z);
}
export function walkTo(x, z, cb){ P.target = [x, z]; P.onArrive = cb || null; }
export function jump(){ if(P.ground && !P.mount && !P.swim){ P.vy = 6.5; P.ground = false; } }
// ---------- mounts / carriage ----------
export function mountUp(kind){
  dismount(); if(!kind) return; const M = MOUNTS[kind]; if(M.sea && heightAt(P.x, P.z) > -.4) { const near = PLACES.find(p => p.game === 'turtle'); if(near){ P.x = near.x; P.z = near.z; } }
  P.mount = kind; P.mg = makeMount(kind); scene.add(P.mg); P.fly = false; P.alt = 0; person.sit = 1; person.ride = P.mg; store.set('mount', kind);
}
export function dismount(){ if(P.mg){ scene.remove(P.mg); P.mg.traverse(o => { if(o.geometry && o.geometry !== o.parent?.children[0]?.geometry) {} }); } P.mount = null; P.mg = null; P.fly = false; person.sit = 0; person.ride = null; person.roll = 0; }
export function toggleFly(){ if(!P.mount || !MOUNTS[P.mount].fly) return false; P.fly = !P.fly; if(P.fly) P.alt = Math.max(P.alt, 4); return P.fly; }
export function nearCarriage(){ const C = CARRIAGE; return C.cart && !P.ride && C.wait > 0 && Math.hypot(C.cart.position.x - P.x, C.cart.position.z - P.z) < 8; }
export function boardCarriage(on){ if(on){ dismount(); P.ride = 'carriage'; person.sit = 1; person.ride = CARRIAGE.cart; } else { P.ride = null; person.sit = 0; person.ride = null; const C = CARRIAGE.cart.position; P.x = C.x + 3; P.z = C.z; } }
// ---------- per-frame movement ----------
const fwd = new THREE.Vector3();
export function updatePlayer(dt, t){
  const k = P.keys; let ix = P.joy.x + ((k.KeyD || k.ArrowRight) ? 1 : 0) - ((k.KeyA || k.ArrowLeft) ? 1 : 0), iz = P.joy.y + ((k.KeyS || k.ArrowDown) ? 1 : 0) - ((k.KeyW || k.ArrowUp) ? 1 : 0);
  if(P.ride === 'carriage'){ const c = CARRIAGE.cart; P.x = c.position.x; P.z = c.position.z; P.y = c.position.y + 1.3; person.yaw = c.rotation.y + Math.PI/2; return finish(dt, 0); }
  let tw = null; if(P.target && !ix && !iz){ const dx = P.target[0] - P.x, dz = P.target[1] - P.z, d = Math.hypot(dx, dz); if(d < 1.2){ P.target = null; const cb = P.onArrive; P.onArrive = null; if(cb) cb(); } else tw = [dx/d, dz/d]; }
  const L = Math.hypot(ix, iz); if(L > 1){ ix /= L; iz /= L; }
  // input is relative to the camera
  const s = Math.sin(P.camYaw), c = Math.cos(P.camYaw), wx = tw ? tw[0] : ix*c + iz*s, wz = tw ? tw[1] : -ix*s + iz*c;
  const M = P.mount ? MOUNTS[P.mount] : null, run = M ? M.sp : (k.ShiftLeft ? 7 : 4.6), want = Math.min(1, Math.hypot(wx, wz))*run;
  const acc = (want > .1 ? 10 : 7)*dt; P.vx += (wx*run - P.vx)*Math.min(1, acc); P.vz += (wz*run - P.vz)*Math.min(1, acc);
  let sp = Math.hypot(P.vx, P.vz); if(sp > .05){ const nx = P.x + P.vx*dt, nz = P.z + P.vz*dt, r = Math.hypot(nx, nz), lim = 900;
    const okXY = (x, z) => { if(Math.hypot(x, z) > lim) return false; if(P.fly) return true; const h = heightAt(x, z); if(M && M.sea) return h < -.4; if(M && !M.sea && h < -1.6) return false; return !blocked(x, z, M ? .9 : .45); };
    if(okXY(nx, nz)){ P.x = nx; P.z = nz; } else if(okXY(nx, P.z)) P.x = nx; else if(okXY(P.x, nz)) P.z = nz; else { P.vx *= .3; P.vz *= .3; }
    const ty = Math.atan2(P.vx, P.vz); let d = ty - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d*Math.min(1, dt*10); }
  const gh = heightAt(P.x, P.z); P.swim = !M && gh < -1.2;
  if(P.fly){ P.alt = Math.max(2, Math.min(170, P.alt + P.up*12*dt + (iz < -.2 && !P.up ? 0 : 0))); P.y = Math.max(gh, 0) + P.alt; }
  else if(M && M.sea){ P.y = -.25 + Math.sin(t*1.5)*.08; }
  else if(P.swim){ P.y = -1.3 + Math.sin(t*2)*.1; P.vy = 0; P.ground = true; }
  else { P.vy -= 18*dt; P.y += P.vy*dt; const floor = Math.max(gh, -1.3, floorFn ? floorFn(P.x, P.z, P.y) : -1e9); if(P.y <= floor){ P.y = floor; P.vy = 0; P.ground = true; } }
  return finish(dt, sp, t);
}
function finish(dt, sp, t = 0){
  const p = person; p.x = P.x; p.z = P.z; p.speed = P.mount ? 0 : sp; if(!P.ride) p.yaw = P.yaw; p.walk += dt*sp*3.2; p.swim = P.swim;
  if(P.mg){ const M = MOUNTS[P.mount]; P.mg.position.set(P.x, P.y + (M.sea ? -.2 : 0), P.z); P.mg.rotation.y = P.yaw; P.mg.rotation.z = P.fly ? -Math.max(-.4, Math.min(.4, (P.vx*Math.cos(P.yaw) - P.vz*Math.sin(P.yaw))*.03)) : 0; animMount(P.mg, t, sp, P.fly); p.y = P.y + M.h; p.roll = P.mg.rotation.z; }
  else p.y = P.y - (P.swim ? .9 : 0);
  // camera follows
  const tgtY = p.y + 1.6, cd = P.camDist*(P.fly ? 1.6 : 1), ch = Math.cos(P.camPitch), cxp = P.x + Math.sin(P.camYaw)*cd*ch, czp = P.z + Math.cos(P.camYaw)*cd*ch; let cyp = tgtY + Math.sin(P.camPitch)*cd;
  cyp = Math.max(cyp, heightAt(cxp, czp) + 1.2, .8); const k = Math.min(1, dt*6); camera.position.x += (cxp - camera.position.x)*k; camera.position.y += (cyp - camera.position.y)*k; camera.position.z += (czp - camera.position.z)*k; fwd.set(P.x, tgtY, P.z); camera.lookAt(fwd);
}
