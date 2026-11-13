// Shared helpers: palette, noise, island height, coloured low-poly primitives, merging, colliders.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PAL = { red:'#ef4b4b', yellow:'#ffd23f', blue:'#3d7bff', green:'#2fbf71', white:'#f4f4f4', orange:'#ff8a2b', purple:'#b06bff',
  grass:'#7cc36a', grass2:'#93d27a', dryGrass:'#b9c96e', sand:'#ecd9a6', rock:'#9aa0a6', wood:'#a0703c', darkWood:'#6d4c2e', roof:'#c0504d', path:'#cdb98a', water:'#3fa7d6', snow:'#f7fbff', leaf:'#3f9b4f', leaf2:'#5bb85f' };
export const IS_PHONE = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600;

// ---------- deterministic noise ----------
function hash(x, y){ let h = (x*374761393 + y*668265263) | 0; h = (h ^ (h >>> 13))*1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0)/4294967296; }
export function noise(x, y){ const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v; }
export function fbm(x, y){ return noise(x, y)*.55 + noise(x*2.1, y*2.1)*.3 + noise(x*4.3, y*4.3)*.15; }
export function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s*1664525 + 1013904223) >>> 0)/4294967296; }

// ---------- the island ----------
export const ISLAND_R = 600;
export function edgeR(x, z){ const a = Math.atan2(z, x); return ISLAND_R + (noise(Math.cos(a)*2.2 + 5, Math.sin(a)*2.2 + 5) - .5)*80 + Math.sin(a*5)*12; }
// stream: from the northern hills down to the sea in the west
export const STREAM = [[-160, -520], [-200, -430], [-250, -330], [-240, -240], [-300, -160], [-380, -120], [-470, -60], [-560, -20], [-660, 0]];
export function streamDist(x, z){ let best = 1e9; for(let i=0;i<STREAM.length - 1;i++){ const [ax, az] = STREAM[i], [bx, bz] = STREAM[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax)*dx + (z - az)*dz)/(dx*dx + dz*dz))); const px = ax + dx*t, pz = az + dz*t; best = Math.min(best, Math.hypot(x - px, z - pz)); } return best; }
const g2 = (x, z, cx, cz, s) => Math.exp(-((x - cx)**2 + (z - cz)**2)/(2*s*s));
export function heightAt(x, z){
  const r = Math.hypot(x, z), e = edgeR(x, z), land = Math.min(1, Math.max(0, (e - r)/50));
  let h = 1.2 + (fbm(x*.006, z*.006) - .5)*3;
  h += 30*g2(x, z, -150, -560, 110) + 22*g2(x, z, 160, -560, 90);           // northern hills (stream source)
  h += 46*g2(x, z, 470, 40, 70);                                             // ski hill in the east
  h += 6*g2(x, z, -470, 220, 60) + 5*g2(x, z, 420, 420, 70);                 // low hills at the rim
  for(const [cx, cz, s] of FLAT) { const f = g2(x, z, cx, cz, s); h = h*(1 - f) + 1.5*f; }
  const sd = streamDist(x, z); if(sd < 9) h -= (1 - sd/9)*2.2;
  return h*land + (-5)*(1 - land) + (land < 1 ? -2*(1 - land) : 0);
}
// areas kept flat for buildings/fields
export const FLAT = [[0, -20, 120], [-300, 0, 110], [300, -60, 120], [0, 300, 130], [0, -330, 170], [300, 200, 90], [-300, 160, 70], [110, 110, 36], [-280, 340, 62], [340, 380, 34], [300, -322, 44]];
export const SEA_LEVEL = 0;

// ---------- coloured primitives (non-indexed, vertex colours) ----------
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
export function colorize(g, color){ g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n*3);
  const pos = g.attributes.position.array; for(let i=0;i<n;i++){ const shade = .92 + .08*Math.sign(pos[i*3 + 1] + 1e-6); a[i*3] = c.r*shade; a[i*3 + 1] = c.g*shade; a[i*3 + 2] = c.b*shade; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if(g.attributes.uv) g.deleteAttribute('uv'); return g; }
export function place(g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){ tmpE.set(rx, ry, rz); tmpQ.setFromEuler(tmpE); tmpS.set(sx, sy, sz); tmpP.set(x, y, z); tmpM.compose(tmpP, tmpQ, tmpS); g.applyMatrix4(tmpM); return g; }
export const box = (w, h, d, c, x = 0, y = 0, z = 0, ry = 0) => place(colorize(new THREE.BoxGeometry(w, h, d), c), x, y + h/2, z, 0, ry);
export const boxAt = (w, h, d, c, x, y, z, rx = 0, ry = 0, rz = 0) => place(colorize(new THREE.BoxGeometry(w, h, d), c), x, y, z, rx, ry, rz);
export const cyl = (rt, rb, h, c, x = 0, y = 0, z = 0, seg = 8) => place(colorize(new THREE.CylinderGeometry(rt, rb, h, seg), c), x, y + h/2, z);
export const cone = (r, h, c, x = 0, y = 0, z = 0, seg = 8, ry = 0) => place(colorize(new THREE.ConeGeometry(r, h, seg), c), x, y + h/2, z, 0, ry);
export const sphere = (r, c, x = 0, y = 0, z = 0, d = 1, sy = 1) => place(colorize(new THREE.IcosahedronGeometry(r, d), c), x, y, z, 0, 0, 0, 1, sy, 1);
export const torus = (R, r, c, x, y, z, rx = 0, ry = 0, seg = 16) => place(colorize(new THREE.TorusGeometry(R, r, 6, seg), c), x, y, z, rx, ry);
export function merge(list){ const L = list.filter(Boolean).map(g => { for(const k of Object.keys(g.attributes)) if(k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k); return g; }); const m = mergeGeometries(L, false); L.forEach(g => g.dispose()); return m; }

// ---------- shared materials ----------
export const MAT = {
  solid: new THREE.MeshLambertMaterial({vertexColors:true, flatShading:true}),
  glow: new THREE.MeshBasicMaterial({vertexColors:true}),
  outline: new THREE.MeshBasicMaterial({color:0x1a1530, side:THREE.BackSide})
};
export function meshOf(geoms, opts = {}){ const m = new THREE.Mesh(merge(geoms), opts.mat || MAT.solid); m.castShadow = opts.shadow !== false; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); return m; }

// ---------- colliders (circles and boxes on the ground plane) + places ----------
export const COLLIDERS = [];
export const addCircle = (x, z, r) => COLLIDERS.push({t:0, x, z, r});
export const addRect = (x, z, w, d) => COLLIDERS.push({t:1, x0:x - w/2, x1:x + w/2, z0:z - d/2, z1:z + d/2});
export function blocked(x, z, rad = .45){ for(const c of COLLIDERS){ if(c.t === 0){ if(Math.hypot(x - c.x, z - c.z) < c.r + rad) return true; } else if(x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) return true; } return false; }
// interactive places: {x, z, en, vi, icon, play}
export const PLACES = [];
export const store = { get(k, d){ try { const v = localStorage.getItem('rubik3d-' + k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } }, set(k, v){ try { localStorage.setItem('rubik3d-' + k, JSON.stringify(v)); } catch(e){} } };
export function canvasTex(w, h, draw){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = IS_PHONE ? 4 : 8; return t; }
