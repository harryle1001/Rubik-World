// Island terrain, natural trails, stream and bridges, sea with waves and shore foam, sky dome, instanced trees, grass and rocks.
import * as THREE from 'three';
import { PAL, IS_PHONE, heightAt, edgeR, streamDist, STREAM, fbm, rng, box, cyl, cone, sphere, merge, meshOf, MAT, colorize, place, FLAT, addCircle } from './util.js';

export const TRAILS = [];   // polylines [[x,z],...]
const ring = (r, n = 96) => { const p = []; for(let i=0;i<=n;i++){ const a = i/n*Math.PI*2; p.push([Math.cos(a)*r, Math.sin(a)*r]); } return p; };
TRAILS.push(ring(205), ring(480, 140));
for(const [x, z] of [[-300, 0], [300, 0], [0, 300], [0, -330], [-300, 160], [300, 200]]){ const p = []; for(let i=0;i<=24;i++){ const t = i/24; p.push([x*t + Math.sin(t*6)*8, z*t + Math.cos(t*5)*8]); } TRAILS.push(p); }
for(const a of [.6, 2.2, 3.9, 5.4]){ const p = []; for(let i=0;i<=20;i++){ const r = 205 + i/20*275; p.push([Math.cos(a + Math.sin(i*.4)*.05)*r, Math.sin(a + Math.sin(i*.4)*.05)*r]); } TRAILS.push(p); }
export function trailDist(x, z){ let best = 1e9; for(const T of TRAILS) for(let i=0;i<T.length - 1;i++){ const [ax, az] = T[i], [bx, bz] = T[i + 1]; if(Math.abs(x - ax) > 60 && Math.abs(x - bx) > 60) continue; const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax)*dx + (z - az)*dz)/(dx*dx + dz*dz || 1))); best = Math.min(best, Math.hypot(x - ax - dx*t, z - az - dz*t)); } return best; }

export function buildTerrain(scene){
  const S = 1500, N = IS_PHONE ? 150 : 170, g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI/2);
  const pos = g.attributes.position, col = new Float32Array(pos.count*3), c = new THREE.Color(), C = k => new THREE.Color(PAL[k]);
  const grass = C('grass'), grass2 = C('grass2'), dry = C('dryGrass'), sand = C('sand'), rock = C('rock'), snow = C('snow'), path = C('path'), farm = new THREE.Color('#a8d36a');
  for(let i=0;i<pos.count;i++){ const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z); pos.setY(i, h); const r = Math.hypot(x, z), e = edgeR(x, z), n = fbm(x*.02, z*.02);
    if(r > e - 22 || h < .6) c.copy(sand); else if(h > 34) c.copy(snow); else if(h > 16) c.copy(rock).lerp(grass, .35); else { c.copy(grass).lerp(grass2, n); if(z < -200 && Math.abs(x) < 260) c.lerp(farm, .5); if(x > 200 && z > 120) c.lerp(dry, .25); }
    const td = trailDist(x, z); if(td < 3.2 && h > .6) c.lerp(path, td < 2 ? .9 : .5); if(streamDist(x, z) < 11 && h > .3) c.lerp(sand, .35);
    col[i*3] = c.r; col[i*3 + 1] = c.g; col[i*3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); g.deleteAttribute('uv');
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({vertexColors:true})); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'terrain'; scene.add(m);
  buildStream(scene); buildBridges(scene); buildTrailStones(scene);
  return m;
}
function buildStream(scene){
  const pts = []; for(let i=0;i<STREAM.length - 1;i++) for(let k=0;k<8;k++){ const t = k/8, [ax, az] = STREAM[i], [bx, bz] = STREAM[i + 1]; pts.push([ax + (bx - ax)*t, az + (bz - az)*t]); } pts.push(STREAM[STREAM.length - 1]);
  const v = [], idx = []; pts.forEach(([x, z], i) => { const [nx, nz] = pts[Math.min(i + 1, pts.length - 1)], [px, pz] = pts[Math.max(i - 1, 0)], dx = nx - px, dz = nz - pz, L = Math.hypot(dx, dz) || 1, ox = -dz/L*6, oz = dx/L*6, y = Math.max(.2, heightAt(x, z) + .9);
    v.push(x + ox, y, z + oz, x - ox, y, z - oz); if(i) idx.push((i - 1)*2, (i - 1)*2 + 1, i*2, i*2, (i - 1)*2 + 1, i*2 + 1); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({color:'#4fb3e0', transparent:true, opacity:.85}); const m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; m.receiveShadow = true; scene.add(m);
}
function buildBridges(scene){
  const G = [], done = [];
  for(const T of TRAILS) for(let i=0;i<T.length - 1;i++){ const [x, z] = T[i]; if(streamDist(x, z) < 7 && !done.some(([a, b]) => Math.hypot(a - x, b - z) < 30)){ done.push([x, z]); const [bx, bz] = T[i + 1], ang = Math.atan2(bx - x, bz - z), y = Math.max(heightAt(x, z) + 1.4, 1.6);
    const g = merge([box(4, .35, 16, PAL.wood, 0, 0, 0), box(.25, 1, 16, PAL.darkWood, 1.9, .35, 0), box(.25, 1, 16, PAL.darkWood, -1.9, .35, 0), ...[-6, 0, 6].flatMap(k => [box(.4, 1.6, .4, PAL.darkWood, 1.9, -1.2, k), box(.4, 1.6, .4, PAL.darkWood, -1.9, -1.2, k)])]);
    place(g, x, y, z, 0, ang); G.push(g); } }
  if(G.length) scene.add(meshOf(G));
}
function buildTrailStones(scene){ const r = rng(7), G = []; for(const T of TRAILS) for(let i=0;i<T.length;i += 2){ if(r() < .5) continue; const [x, z] = T[i], h = heightAt(x, z); if(h < .8) continue; G.push(place(colorize(new THREE.CylinderGeometry(.9, 1, .15, 6), '#d8ccb0'), x + (r() - .5)*2, h + .05, z + (r() - .5)*2, 0, r()*3)); } if(G.length) scene.add(meshOf(G, {shadow:false})); }

// ---------- sea ----------
export function buildSea(scene){
  const g = new THREE.PlaneGeometry(6000, 6000, IS_PHONE ? 80 : 128, IS_PHONE ? 80 : 128); g.rotateX(-Math.PI/2);
  const mat = new THREE.ShaderMaterial({ transparent:true, fog:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uT:{value:0}, uSky:{value:new THREE.Color('#9ed6ff')}, uDeep:{value:new THREE.Color('#1e6fa8')}, uShallow:{value:new THREE.Color('#47c2d8')}, uSun:{value:new THREE.Vector3(.4, .8, .3)}}]),
    vertexShader:`uniform float uT; varying vec3 vW; varying float vH;
      #include <fog_pars_vertex>
      void main(){ vec3 p = position; float w = sin(p.x*.035 + uT*1.2)*.35 + sin(p.z*.05 - uT*1.6)*.25 + sin((p.x + p.z)*.09 + uT*2.3)*.12; p.y += w; vH = w; vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader:`uniform vec3 uSky; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSun; varying vec3 vW; varying float vH;
      #include <fog_pars_fragment>
      void main(){ vec3 V = normalize(cameraPosition - vW); float fr = pow(1. - max(V.y, 0.), 3.); float r = length(vW.xz); float shallow = smoothstep(760., 590., r);
        vec3 c = mix(uDeep, uShallow, shallow*.8); c = mix(c, uSky, fr*.75); c += vec3(1.)*smoothstep(.45, .6, vH)*.25; vec3 H = normalize(uSun + V); c += vec3(1., .95, .8)*pow(max(dot(H, vec3(0., 1., 0.)), 0.), 180.)*.6;
        gl_FragColor = vec4(c, .93);
      #include <fog_fragment>
      }` });
  const m = new THREE.Mesh(g, mat); m.position.y = -.3; m.name = 'sea'; scene.add(m);
  // foam along the shore
  const N = 360, v = [], idx = [], al = []; for(let i=0;i<=N;i++){ const a = i/N*Math.PI*2, ca = Math.cos(a), sa = Math.sin(a); let r = 400; for(let k=0;k<40;k++){ if(heightAt(ca*r, sa*r) < -.1) break; r += 6; } const r0 = r - 8, r1 = r + 6; v.push(ca*r0, .05, sa*r0, ca*r1, .05, sa*r1); al.push(1, 0); if(i) idx.push((i - 1)*2, i*2, (i - 1)*2 + 1, i*2, i*2 + 1, (i - 1)*2 + 1); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); fg.setAttribute('a', new THREE.Float32BufferAttribute(al, 1)); fg.setIndex(idx);
  const fm = new THREE.ShaderMaterial({transparent:true, depthWrite:false, uniforms:{uT:{value:0}}, vertexShader:'attribute float a; varying float vA; varying vec3 vP; void main(){ vA = a; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
    fragmentShader:'uniform float uT; varying float vA; varying vec3 vP; void main(){ float s = .5 + .5*sin(atan(vP.z, vP.x)*60. + uT*2.); float k = vA*(.55 + .35*s)*(.6 + .4*sin(uT*1.3 + vA*3.)); gl_FragColor = vec4(1., 1., 1., k*.75); }'});
  const foam = new THREE.Mesh(fg, fm); foam.renderOrder = 2; scene.add(foam);
  return {sea:m, foam};
}
// ---------- sky dome ----------
export function buildSky(scene){
  const mat = new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, uniforms:{uTop:{value:new THREE.Color('#5aa9ff')}, uHor:{value:new THREE.Color('#cfe9ff')}, uSun:{value:new THREE.Vector3(0, 1, 0)}, uNight:{value:0}},
    vertexShader:'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position, 1.); gl_Position = p.xyww; }',
    fragmentShader:`uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform float uNight; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164)))*43758.5453); }
      void main(){ float y = max(vD.y, 0.); vec3 c = mix(uHor, uTop, pow(y, .55)); float s = max(dot(vD, normalize(uSun)), 0.); c += vec3(1., .85, .6)*pow(s, 400.)*2. + vec3(1., .7, .4)*pow(s, 12.)*.25;
        if(uNight > .3){ vec3 q = floor(vD*420.); float st = step(.9985, h(q)); c += vec3(st)*uNight*y; }
        gl_FragColor = vec4(c, 1.); }`});
  const m = new THREE.Mesh(new THREE.SphereGeometry(2500, 32, 16), mat); m.frustumCulled = false; m.renderOrder = -1; scene.add(m); return m;
}
// ---------- trees, rocks, grass ----------
const SWAY = {uT:{value:0}};
function sway(mat, amp){ mat.onBeforeCompile = sh => { sh.uniforms.uT = SWAY.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  #ifdef USE_INSTANCING
  float ph = instanceMatrix[3].x*.13 + instanceMatrix[3].z*.11;
  #else
  float ph = 0.;
  #endif
  transformed.x += sin(uT*1.7 + ph)*${amp.toFixed(3)}*max(position.y, 0.); transformed.z += cos(uT*1.3 + ph)*${(amp*.6).toFixed(3)}*max(position.y, 0.);`); }; return mat; }
export const sky_t = SWAY;
export function okForTree(x, z, r0 = 0){ const r = Math.hypot(x, z), e = edgeR(x, z); if(r > e - 30 || r < r0) return false; if(trailDist(x, z) < 6 || streamDist(x, z) < 10) return false; for(const [cx, cz, s] of FLAT) if(Math.hypot(x - cx, z - cz) < s*.9) return false; return heightAt(x, z) < 30; }
export function buildTrees(scene){
  const pine = merge([cyl(.35, .5, 2.4, PAL.darkWood), cone(2.4, 4.5, PAL.leaf, 0, 2, 0, 7), cone(1.8, 3.6, PAL.leaf2, 0, 4.2, 0, 7)]);
  const round = merge([cyl(.35, .5, 2.6, PAL.darkWood), sphere(2.6, '#4caf50', 0, 4.4, 0, 1), sphere(1.8, '#66bb6a', 1.2, 5.4, .5, 0)]);
  const r = rng(42), list = [[], []]; let tries = 0;
  while((list[0].length + list[1].length) < (IS_PHONE ? 1300 : 1600) && tries++ < 30000){ const a = r()*Math.PI*2, d = 120 + r()*480, x = Math.cos(a)*d, z = Math.sin(a)*d; if(!okForTree(x, z, 120)) continue; const k = (d > 430 || r() < .45) ? 0 : 1; list[k].push([x, heightAt(x, z) - .2, z, .7 + r()*.7, r()*6]); }
  const out = [];
  [[pine, 0], [round, 1]].forEach(([g, k]) => { const mat = sway(new THREE.MeshLambertMaterial({vertexColors:true, flatShading:true}), .012); const im = new THREE.InstancedMesh(g, mat, list[k].length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    list[k].forEach(([x, y, z, s, ry], i) => { E.set(0, ry, 0); Q.setFromEuler(E); M.compose(V.set(x, y, z), Q, Sc.set(s, s, s)); im.setMatrixAt(i, M); if(k === 1) addCircle(x, z, .8*s); else addCircle(x, z, .7*s); });
    im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); out.push(im); });
  // rocks on the shore
  const rk = colorize(new THREE.DodecahedronGeometry(1, 0), PAL.rock), rr = rng(9), rl = []; for(let i=0;i<260;i++){ const a = rr()*Math.PI*2; let d = edgeR(Math.cos(a), Math.sin(a)) - 10 + rr()*25; const x = Math.cos(a)*d, z = Math.sin(a)*d; rl.push([x, heightAt(x, z), z, .6 + rr()*2.2]); }
  const rim = new THREE.InstancedMesh(rk, MAT.solid, rl.length), M = new THREE.Matrix4(); rl.forEach(([x, y, z, s], i) => { M.makeScale(s, s*.7, s); M.setPosition(x, y, z); rim.setMatrixAt(i, M); }); rim.receiveShadow = true; rim.computeBoundingSphere(); scene.add(rim);
  return out;
}
// grass tufts that follow the player (one draw, re-scattered when the player moves far)
export function buildGrass(scene){
  const blade = new THREE.BufferGeometry(), v = [], c = [];
  for(let k=0;k<3;k++){ const a = k*2.1, ca = Math.cos(a)*.18, sa = Math.sin(a)*.18; v.push(-ca*.6, 0, -sa*.6, ca*.6, 0, sa*.6, 0, .55 + k*.1, 0); c.push(.05, .18, .04, .05, .18, .04, .2, .42, .1); }
  blade.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); blade.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); blade.computeVertexNormals();
  const n = IS_PHONE ? 2200 : 5000, mat = sway(new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide}), .12), im = new THREE.InstancedMesh(blade, mat, n); im.frustumCulled = false; scene.add(im);
  const r = rng(3), M = new THREE.Matrix4(), seeds = []; for(let i=0;i<n;i++) seeds.push([(r() - .5)*110, (r() - .5)*110, .5 + r()*.6, r()*6]);
  let cx = 1e9, cz = 1e9; const update = (px, pz) => { if(Math.hypot(px - cx, pz - cz) < 25) return; cx = Math.round(px/20)*20; cz = Math.round(pz/20)*20; let j = 0;
    for(const [dx, dz, s, ry] of seeds){ const x = cx + dx, z = cz + dz, h = heightAt(x, z); if(h < .7 || h > 20 || trailDist(x, z) < 2.5 || streamDist(x, z) < 8 || FLAT.some(([fx, fz, fs]) => Math.hypot(x - fx, z - fz) < fs*.75)){ M.makeScale(0, 0, 0); } else { M.makeRotationY(ry); M.scale(new THREE.Vector3(s, s, s)); M.setPosition(x, h - .05, z); } im.setMatrixAt(j++, M); } im.instanceMatrix.needsUpdate = true; };
  return {update};
}
