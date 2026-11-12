// Rubik School 3D World: draws the SAME world as the 2D game in three.js. All game logic, UI, mini games and the Coach
// stay in the 2D code; this module reads its state through window.RS each frame. 2D pixel coordinates (x, y) map to
// 3D (x*S, height, y*S); north (smaller y) is -z. The 2D canvas stays on top, transparent, for labels and all touch input.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const S = 0.05;                       // metres per 2D pixel
const PHONE = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
let RS, renderer, scene, camera, hemi, sun, lantern, water;
const ground = [], TILE = 2048, TEX = 1024;
const Zof = y => y*S, Xof = x => x*S;

// ---------- small geometry helpers (vertex colours, merged) ----------
function col(g, c){ g = g.index ? g.toNonIndexed() : g; const k = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3] = k.r; a[i*3 + 1] = k.g; a[i*3 + 2] = k.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if(g.attributes.uv) g.deleteAttribute('uv'); return g; }
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1);
function put(g, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1){ E.set(0, ry, 0); Q.setFromEuler(E); M4.compose(V.set(x, y, z), Q, SC.set(sx, sy, sz)); g.applyMatrix4(M4); return g; }
const box = (w, h, d, c, x, y, z, ry) => put(col(new THREE.BoxGeometry(w, h, d), c), x, y + h/2, z, ry);
const cyl = (r1, r2, h, c, x, y, z, seg = 8) => put(col(new THREE.CylinderGeometry(r1, r2, h, seg), c), x, y + h/2, z);
const cone = (r, h, c, x, y, z, seg = 7, ry = 0) => put(col(new THREE.ConeGeometry(r, h, seg), c), x, y + h/2, z, ry);
const ball = (r, c, x, y, z) => put(col(new THREE.IcosahedronGeometry(r, 1), c), x, y, z);
const MAT = new THREE.MeshLambertMaterial({vertexColors:true, flatShading:true});
function merged(list, mat = MAT){ const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); list.forEach(g => g.dispose()); return m; }

// ---------- ground: the 2D map itself, baked into textures ----------
function bakeGround(){
  const y0 = RS.NY, nx = Math.ceil(RS.W/TILE);
  for(let i=0;i<nx;i++){ const x0 = i*TILE, c = document.createElement('canvas'); c.width = c.height = TEX; const g = c.getContext('2d'); g.fillStyle = '#6fb35a'; g.fillRect(0, 0, TEX, TEX);
    RS.bake(g, x0, y0, x0 + TILE, y0 + TILE, TEX/TILE);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.anisotropy = PHONE ? 4 : 8;
    let m = ground[i]; if(!m){ m = new THREE.Mesh(new THREE.PlaneGeometry(TILE*S, TILE*S), new THREE.MeshLambertMaterial({map:t})); m.rotation.x = -Math.PI/2; m.position.set(Xof(x0 + TILE/2), 0, Zof(y0 + TILE/2)); m.receiveShadow = true; scene.add(m); ground[i] = m; }
    else { m.material.map.dispose(); m.material.map = t; m.material.needsUpdate = true; } }
}
function buildFar(){
  // meadows north of the map (under the sky layers) and the open sea to the south
  const north = new THREE.Mesh(new THREE.PlaneGeometry(RS.W*S + 400, 160), new THREE.MeshLambertMaterial({color:'#5f9e4e'})); north.rotation.x = -Math.PI/2; north.position.set(Xof(RS.W/2), -.02, Zof(RS.NY) - 80); scene.add(north);
  const wg = new THREE.PlaneGeometry(RS.W*S + 800, (RS.H - 1488)*S + 200, 60, 40); wg.rotateX(-Math.PI/2);
  water = new THREE.Mesh(wg, new THREE.ShaderMaterial({fog:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uT:{value:0}, uC:{value:new THREE.Color('#2a86c8')}, uS:{value:new THREE.Color('#bfe3ff')}}]),
    vertexShader:'uniform float uT; varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec3 p = position; p.y += sin(p.x*.08 + uT)*.15 + sin(p.z*.11 - uT*1.3)*.12; vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:'uniform vec3 uC; uniform vec3 uS; varying vec3 vW;\n#include <fog_pars_fragment>\nvoid main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(1. - max(v.y, 0.), 3.); gl_FragColor = vec4(mix(uC, uS, f*.7), 1.);\n#include <fog_fragment>\n}'}));
  water.position.set(Xof(RS.W/2), -.05, Zof(1488) + ((RS.H - 1488)*S + 200)/2); scene.add(water);
}
// ---------- standing things: trees, classroom walls, houses, lighthouse ----------
function buildStatic(){
  const pine = mergeGeometries([cyl(.25, .35, 1.6, '#6d4c2e', 0, 0, 0), cone(1.6, 3.2, '#2e7d32', 0, 1.3, 0), cone(1.2, 2.4, '#43a047', 0, 2.8, 0)]);
  const round = mergeGeometries([cyl(.25, .35, 1.8, '#6d4c2e', 0, 0, 0), ball(1.8, '#4caf50', 0, 3, 0), ball(1.2, '#66bb6a', .8, 3.7, .3)]);
  const P = [], Rn = []; RS.TREES.forEach(t => Rn.push(t)); RS.FOREST_TREES.forEach(t => (t[2] === 'pine' ? P : Rn).push(t));
  [[pine, P], [round, Rn]].forEach(([g, L]) => { const im = new THREE.InstancedMesh(g, MAT, L.length); L.forEach((t, i) => { const s = .8 + ((t[0]*7 + t[1]*3) % 10)/20; E.set(0, (t[0] % 6), 0); Q.setFromEuler(E); M4.compose(V.set(Xof(t[0]), 0, Zof(t[1])), Q, SC.set(s, s, s)); im.setMatrixAt(i, M4); }); im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); });
  // classroom walls: low walls (you can still see inside) with the door gap where the 2D door is
  const W = [], th = .25, wh = 1.5;
  for(const k of RS.ROOMS){ const r = RS.R[k]; if(!r) continue; const x0 = Xof(r.x), z0 = Zof(r.y), x1 = Xof(r.x + r.w), z1 = Zof(r.y + r.h), dw = r.dw ? [Xof(r.dw[0]), Zof(r.dw[1])] : null;
    const seg = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), cx = (ax + bx)/2, cz = (az + bz)/2, ang = Math.atan2(bx - ax, bz - az);
      if(dw && Math.abs((bx - ax)*(dw[1] - az) - (bz - az)*(dw[0] - ax))/L < 1.2){ const t = ((dw[0] - ax)*(bx - ax) + (dw[1] - az)*(bz - az))/(L*L); const g0 = Math.max(0, t*L - 1), g1 = Math.min(L, t*L + 1);
        if(g0 > .1){ const f = g0/2/L; W.push(box(th, wh, g0, '#f3efe6', ax + (bx - ax)*f, 0, az + (bz - az)*f, ang)); } if(L - g1 > .1){ const f = (g1 + (L - g1)/2)/L; W.push(box(th, wh, L - g1, '#f3efe6', ax + (bx - ax)*f, 0, az + (bz - az)*f, ang)); } return; }
      W.push(box(th, wh, L, '#f3efe6', cx, 0, cz, ang)); };
    seg(x0, z0, x1, z0); seg(x1, z0, x1, z1); seg(x1, z1, x0, z1); seg(x0, z1, x0, z0);
    for(const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) W.push(box(.5, wh + .3, .5, '#3d7bff', cx, 0, cz)); }
  if(W.length) scene.add(merged(W));
  // houses on the hill street: the 2D sprite is a front view, so the 3D house sits on its footprint
  const HC = {bietthu:['#fff3e0', '#b71c1c'], nhaong:['#ffe082', '#6d4c41'], nhago:['#a1887f', '#4e342e'], nhasan:['#d7ccc8', '#5d4037'], nhat:['#f1e9d2', '#3e2723'], diatrunghai:['#ffe0b2', '#d84315'], resort:['#e1f5fe', '#0277bd'], villa:['#f5f5f5', '#455a64'], container:['#4fc3f7', '#263238'], nhakinh:['#b3e5fc', '#607d8b'], nhatron:['#fff8e1', '#e65100'], thai:['#ffcc80', '#8d6e63']};
  const Hs = []; for(const h of RS.HOUSES){ const [wc, rc] = HC[h.k] || ['#fff8e1', '#c0504d'], w = h.w*S, d = Math.max(2.4, h.h*S*.55), hh = Math.max(2.2, h.h*S*.55), cx = Xof(h.x + h.w/2), cz = Zof(h.y + h.h) - d/2;
    Hs.push(box(w, hh, d, wc, cx, 0, cz), put(col(new THREE.ConeGeometry(Math.max(w, d)*.75, Math.max(1.2, w*.35), 4), rc), cx, hh + Math.max(1.2, w*.35)/2, cz, Math.PI/4, 1, 1, d/w), box(Math.min(1, w*.3), 1.6, .1, '#5d4037', cx, 0, cz + d/2 + .02)); }
  if(Hs.length) scene.add(merged(Hs));
  const [lx, ly] = RS.LIGHTHOUSE; const LH = []; for(let k=0;k<6;k++) LH.push(cyl(1.3 - k*.12, 1.4 - k*.12, 1.6, k % 2 ? '#e53935' : '#fafafa', Xof(lx), k*1.6, Zof(ly)));
  LH.push(cyl(.9, .9, 1, '#ffd54f', Xof(lx), 9.6, Zof(ly)), cone(1.1, 1, '#37474f', Xof(lx), 10.6, Zof(ly))); scene.add(merged(LH));
}
// ---------- people (player + NPCs) as instanced body parts with each person's own colours ----------
const PART = (w, h, d, ox, oy, oz) => { const g = col(new THREE.BoxGeometry(w, h, d), '#fff'); g.translate(ox, oy, oz); return g; };
let IM = null, NMAX = 160; const prev = new Map();
function buildPeople(){
  const mk = (g, n, m = MAT) => { const x = new THREE.InstancedMesh(g, m, n); x.frustumCulled = false; x.castShadow = m === MAT; x.count = 0; scene.add(x); return x; };
  const out = new THREE.MeshBasicMaterial({color:'#1a1530', side:THREE.BackSide});
  IM = {torso:mk(PART(.62, .72, .38, 0, 1.05, 0), NMAX), head:mk(PART(.48, .46, .44, 0, 1.65, 0), NMAX), hair:mk(PART(.52, .16, .48, 0, 1.94, -.02), NMAX), leg:mk(PART(.24, .7, .28, 0, -.35, 0), NMAX*2), arm:mk(PART(.18, .64, .22, 0, -.3, 0), NMAX*2),
    oT:mk(PART(.7, .8, .46, 0, 1.05, 0), NMAX, out), oH:mk(PART(.56, .54, .52, 0, 1.65, 0), NMAX, out), lamp:mk(PART(.2, .26, .2, 0, -.78, .1), NMAX, new THREE.MeshBasicMaterial({color:'#ffcc66'}))};
}
const C = new THREE.Color(), B = new THREE.Matrix4(), L4 = new THREE.Matrix4(), M2 = new THREE.Matrix4();
function placePerson(i, x, y, z, yaw, walk, moving, sitting, night){
  E.set(0, yaw, 0); Q.setFromEuler(E); B.compose(V.set(x, y, z), Q, SC.set(1, 1, 1)); for(const k of ['torso', 'head', 'hair', 'oT', 'oH']) IM[k].setMatrixAt(i, B);
  const sw = moving ? Math.sin(walk) : 0;
  for(const s of [0, 1]){ L4.makeRotationX(sitting ? -1.3 : (s ? -sw : sw)*.7); L4.setPosition(s ? .15 : -.15, .7, 0); M2.multiplyMatrices(B, L4); IM.leg.setMatrixAt(i*2 + s, M2);
    L4.makeRotationX(sitting ? -1 : (s ? sw : -sw)*.7 - (night && s ? .3 : 0)); L4.setPosition(s ? .41 : -.41, 1.37, 0); M2.multiplyMatrices(B, L4); IM.arm.setMatrixAt(i*2 + s, M2); if(s) IM.lamp.setMatrixAt(i, night ? M2 : Z0); }
}
const Z0 = new THREE.Matrix4().makeScale(0, 0, 0);
const alt = y => y < RS.NY ? (RS.NY - y)*S*.6 : 0, zMap = y => Zof(Math.max(y, RS.NY));
function drawPeople(night){
  const list = []; for(const a of RS.agents) if(a.visible && !a.inSub) list.push(a); for(const n of RS.npcs) if(RS.npcShown(n)) list.push(n);
  const cx = RS.cam.x, cy = RS.cam.y; let i = 0;
  for(const a of list){ if(i >= NMAX) break; if(Math.abs(a.x - cx) > 2400 || Math.abs(a.y - cy) > 1600) continue;
    let p = prev.get(a); if(!p){ p = {x:a.x, y:a.y, yaw:a.dir > 0 ? Math.PI/2 : -Math.PI/2}; prev.set(a, p); }
    const dx = a.x - p.x, dy = a.y - p.y; if(Math.abs(dx) + Math.abs(dy) > .3){ const ty = Math.atan2(dx, dy); let d = ty - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d*.25; } p.x = a.x; p.y = a.y;
    const sitting = !!(a.cycling || a.boat || a.mount || a.v16fly), h = alt(a.y) + (a.flying ? (a.lift || 0)*S : 0) + (a.cycling ? .5 : a.boat ? .3 : 0);
    const lying = a.fallen > (RS.clock || 0) && a.fallen;
    if(i === 0 || !IM._c || IM._c[i] !== a){ IM._c = IM._c || []; IM._c[i] = a; IM.torso.setColorAt(i, C.set(a.shirt || '#ef4b4b')); IM.head.setColorAt(i, C.set(a.skin || '#f2c9a0')); IM.hair.setColorAt(i, C.set(a.hair || '#22140c')); for(const s of [0, 1]){ IM.leg.setColorAt(i*2 + s, C.set(a.pants || '#24356b')); IM.arm.setColorAt(i*2 + s, C.set(a.shirt || '#ef4b4b')); } }
    placePerson(i, Xof(a.x), h, zMap(a.y), p.yaw, a.walk || 0, a.moving, sitting, night);
    if(lying){ E.set(-Math.PI/2, p.yaw, 0); Q.setFromEuler(E); B.compose(V.set(Xof(a.x), h + .25, zMap(a.y)), Q, SC.set(1, 1, 1)); for(const k of ['torso', 'head', 'hair', 'oT', 'oH']) IM[k].setMatrixAt(i, B); }
    i++; }
  for(const k in IM){ if(k === '_c') continue; IM[k].count = (k === 'leg' || k === 'arm') ? i*2 : i; IM[k].instanceMatrix.needsUpdate = true; if(IM[k].instanceColor) IM[k].instanceColor.needsUpdate = true; }
}
// ---------- vehicles: the player's bike / boat / balloon, cars on the road, ships at sea ----------
let rideBike, rideBoat, rideBalloon, carsIM, shipsIM;
function buildVehicles(){
  rideBike = merged([put(col(new THREE.TorusGeometry(.38, .05, 6, 14), '#212121'), 0, .4, .6, 0), put(col(new THREE.TorusGeometry(.38, .05, 6, 14), '#212121'), 0, .4, -.6, 0), box(.08, .08, 1.2, '#ef4b4b', 0, .75, 0), box(.5, .06, .06, '#424242', 0, 1.1, .6)]);
  rideBike.children; rideBike.matrixAutoUpdate = true; rideBike.visible = false; scene.add(rideBike);
  rideBoat = merged([box(1.6, .6, 4, '#f5f5f5', 0, -.2, 0), box(1.7, .15, 4.1, '#3d7bff', 0, .35, 0), box(.1, 3, .1, '#8d6e63', 0, .4, .4), put(col(new THREE.ConeGeometry(1.2, 2.6, 3), '#fff8e1'), .1, 2.2, .4, 0, .15, 1, 1)]); rideBoat.matrixAutoUpdate = true; rideBoat.visible = false; scene.add(rideBoat);
  rideBalloon = merged([ball(1.8, '#ef4b4b', 0, 5.2, 0), box(1, .7, 1, '#8d6e63', 0, 2.3, 0), box(.04, 1.8, .04, '#5d4037', .45, 2.9, .45), box(.04, 1.8, .04, '#5d4037', -.45, 2.9, -.45)]); rideBalloon.matrixAutoUpdate = true; rideBalloon.visible = false; scene.add(rideBalloon);
  carsIM = new THREE.InstancedMesh(mergeGeometries([box(2.2, .7, 1.1, '#fff', 0, .3, 0), box(1.2, .55, 1, '#cfd8dc', -.1, 1, 0)]), MAT, 40); carsIM.frustumCulled = false; carsIM.castShadow = true; scene.add(carsIM);
  shipsIM = new THREE.InstancedMesh(mergeGeometries([box(2.2, .8, 6, '#fff', 0, -.3, 0), box(1.4, .9, 1.8, '#eceff1', 0, .5, -.8), box(.12, 4, .12, '#6d4c41', 0, .5, .8)]), MAT, 60); shipsIM.frustumCulled = false; scene.add(shipsIM);
}
function drawVehicles(t){
  const P = RS.PLAYER; if(P && P.visible){ const x = Xof(P.x), z = zMap(P.y), h = alt(P.y), py = prev.get(P), yaw = py ? py.yaw : 0;
    rideBike.visible = !!P.cycling; if(P.cycling){ rideBike.position.set(x, h, z); rideBike.rotation.y = yaw; }
    rideBoat.visible = !!P.boat; if(P.boat){ rideBoat.position.set(x, Math.sin(t*2)*.08, z); rideBoat.rotation.y = yaw; }
    rideBalloon.visible = !!P.v16fly || P.y < RS.NY; if(rideBalloon.visible){ rideBalloon.position.set(x, h - .2, z); } }
  let i = 0; for(const c of RS.cars){ if(i >= 40) break; E.set(0, c.v >= 0 ? Math.PI/2 : -Math.PI/2, 0); Q.setFromEuler(E); M4.compose(V.set(Xof(c.x), 0, Zof(c.lane ? 724 : 704)), Q, SC.set(1, 1, 1)); carsIM.setMatrixAt(i, M4); carsIM.setColorAt(i, C.set(c.c || '#e53935')); i++; } carsIM.count = i; carsIM.instanceMatrix.needsUpdate = true; if(carsIM.instanceColor) carsIM.instanceColor.needsUpdate = true;
  i = 0; for(const s of RS.ships){ if(i >= 60) break; const sc = s.k === 'thung' ? .4 : s.k === 'fish' ? .8 : s.k && s.k.startsWith('pirate') ? 1.6 : 1; E.set(0, (s.dir || 1) > 0 ? Math.PI/2 : -Math.PI/2, Math.sin(t*1.5 + i)*.04); Q.setFromEuler(E); M4.compose(V.set(Xof(s.x), Math.sin(t*1.7 + i)*.1, Zof(s.y)), Q, SC.set(sc, sc, sc)); shipsIM.setMatrixAt(i, M4); shipsIM.setColorAt(i, C.set(s.k && s.k.startsWith('pirate') ? '#3e2723' : s.k === 'fish' ? '#4fc3f7' : s.k === 'thung' ? '#8d6e63' : '#fafafa')); i++; } shipsIM.count = i; shipsIM.instanceMatrix.needsUpdate = true; if(shipsIM.instanceColor) shipsIM.instanceColor.needsUpdate = true;
}
// ---------- camera, light, projection hooks ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), pv = new THREE.Vector3();
const PITCH = 1.0;
function placeCamera(){ const c = RS.cam, d = Math.max(13, Math.min(180, 34/Math.max(.05, c.z))), P = RS.PLAYER, h = P && P.visible && Math.hypot(P.x - c.x, P.y - c.y) < 300 ? alt(P.y) : alt(c.y);
  const tx = Xof(c.x), tz = zMap(c.y); camera.position.set(tx, h + Math.sin(PITCH)*d, tz + Math.cos(PITCH)*d); camera.lookAt(tx, h, tz); camera.updateMatrixWorld(); }
function hooks(){
  RS.setProj((sx, sy) => { ndc.set(sx/RS.cw*2 - 1, -(sy/RS.ch)*2 + 1); ray.setFromCamera(ndc, camera); if(!ray.ray.intersectPlane(plane, hit)) return [RS.cam.x, RS.cam.y]; return [hit.x/S, hit.z/S]; },
    (x, y) => { pv.set(Xof(x), alt(y) + 0, zMap(y)).project(camera); return [(pv.x + 1)/2*RS.cw, (1 - pv.y)/2*RS.ch]; });
}
const SKY = new THREE.Color(), DAY = new THREE.Color('#9fd3ff'), DUSK = new THREE.Color('#ffb98a'), NIGHT = new THREE.Color('#0d1636');
function lighting(){ const m = (RS.clock % 1440)/60, a = (m - 6)/12*Math.PI, el = Math.sin(a), up = Math.max(0, el), night = Math.min(1, Math.max(0, (.12 - el)/.3)), dusk = Math.max(0, 1 - Math.abs(el)/.35)*(1 - night*.6);
  SKY.copy(DAY).lerp(DUSK, dusk).lerp(NIGHT, night); if(/mua|bao|samset|suongmu/.test(RS.weather || '')) SKY.lerp(new THREE.Color('#8f9aa8'), .5*(1 - night)); scene.background = SKY; scene.fog.color.copy(SKY);
  hemi.intensity = .45 + .85*(1 - night); sun.intensity = 2.2*up; const c = RS.cam; sun.position.set(Xof(c.x) + Math.cos(a)*60, 20 + up*80, Zof(c.y) + 30); sun.target.position.set(Xof(c.x), 0, Zof(c.y));
  const P = RS.PLAYER; lantern.intensity = night > .3 && P && P.visible ? 14*night : 0; if(P) lantern.position.set(Xof(P.x), alt(P.y) + 2, zMap(P.y)); return night > .4; }
let t0 = performance.now(), seasonK = '', bakeT = 0;
function frame3D(){
  const now = performance.now(), t = (now - t0)/1000; if(renderer.domElement.width !== Math.round(RS.cw*renderer.getPixelRatio())) resize();
  if(RS.season !== seasonK && now > bakeT){ seasonK = RS.season; bakeT = now + 2000; bakeGround(); }
  placeCamera(); const night = lighting(); drawPeople(night); drawVehicles(t); water.material.uniforms.uT.value = t;
  renderer.render(scene, camera);
}
function resize(){ renderer.setPixelRatio(Math.min(devicePixelRatio, PHONE ? 1.5 : 2)); renderer.setSize(RS.cw, RS.ch, false); camera.aspect = RS.cw/RS.ch; camera.updateProjectionMatrix(); }
function start(){
  RS = window.RS; if(!RS || renderer) return;
  const stage = document.getElementById('stage'), cv = document.createElement('canvas'); cv.id = 'v3d'; stage.insertBefore(cv, stage.firstChild);
  renderer = new THREE.WebGLRenderer({canvas:cv, antialias:!PHONE, powerPreference:'high-performance'}); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); scene.fog = new THREE.Fog('#9fd3ff', 90, PHONE ? 230 : 330); camera = new THREE.PerspectiveCamera(50, 1, .3, 1200);
  hemi = new THREE.HemisphereLight('#e3f2ff', '#6b8f4e', 1.2); scene.add(hemi); sun = new THREE.DirectionalLight('#fff1d6', 2.2); sun.castShadow = true; sun.shadow.mapSize.set(PHONE ? 1024 : 2048, PHONE ? 1024 : 2048); const sc = sun.shadow.camera; sc.left = sc.bottom = -40; sc.right = sc.top = 40; sc.far = 300; sun.shadow.bias = -.0005; scene.add(sun, sun.target);
  lantern = new THREE.PointLight('#ffcf7a', 0, 18, 1.5); scene.add(lantern);
  bakeGround(); buildFar(); buildStatic(); buildPeople(); buildVehicles(); resize(); hooks(); RS.hook3D = frame3D; RS.enable3D(); document.body.classList.add('w3d');
  window.__v3d = {renderer, scene, camera};
}
if(window.RS) start(); else window.addEventListener('rs-ready', start, {once:true});
