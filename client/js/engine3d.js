// 3D engine on Three.js: renderer, follow camera, sky, animated water, sun shadows, text, instanced models, particles.
// Game logic keeps the server's 2D pixel coordinates: px x -> X, px y -> Z, heights also in px. Zone root is scaled 1/40 (1 m = 40 px).
const PX = 40;
const E3 = {
  ready:null, R:null, cam:null, scene:null, root:null, models:{}, ticks:[], t:0, shakeT:0, shakeM:0, zoom:1, mobile:false,
  // ---------- boot ----------
  boot(){
    if(E3.ready) return E3.ready;
    E3.ready = new Promise(res => { const go = () => res(); if(window.THREE) go(); else window.addEventListener('three-ready', go, {once:true}); }).then(() => E3.loadModels());
    return E3.ready;
  },
  init(parent){
    if(E3.R) return;
    E3.mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
    const R = E3.R = new THREE.WebGLRenderer({antialias:!E3.mobile, powerPreference:'high-performance'});
    R.setPixelRatio(Math.min(devicePixelRatio || 1, E3.mobile ? 1.5 : 2)); R.setSize(innerWidth, innerHeight);
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.outputColorSpace = THREE.SRGBColorSpace;
    parent.appendChild(R.domElement); R.domElement.style.touchAction = 'none';
    E3.cam = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, .3, 600);
    addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); E3.cam.aspect = innerWidth/innerHeight; E3.cam.updateProjectionMatrix(); });
    // zoom: mouse wheel and two-finger pinch
    R.domElement.addEventListener('wheel', e => { E3.zoom = Math.max(.55, Math.min(1.8, E3.zoom*(e.deltaY > 0 ? 1.08 : .93))); }, {passive:true});
    const pts = new Map(); let pinch = 0;
    R.domElement.addEventListener('pointerdown', e => pts.set(e.pointerId, e));
    R.domElement.addEventListener('pointermove', e => { if(!pts.has(e.pointerId)) return; pts.set(e.pointerId, e); if(pts.size === 2){ const [a, b] = [...pts.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if(pinch) E3.zoom = Math.max(.55, Math.min(1.8, E3.zoom*pinch/d)); pinch = d; } });
    const up = e => { pts.delete(e.pointerId); pinch = 0; }; R.domElement.addEventListener('pointerup', up); R.domElement.addEventListener('pointercancel', up);
    let last = performance.now();
    R.setAnimationLoop(now => { const dt = Math.min(.1, (now - last)/1000); last = now; E3.t += dt; E3.frame(dt, now); });
  },
  frame(dt, now){
    if(!E3.scene) return;
    if(E3.onUpdate) E3.onUpdate(dt, now);
    for(let i = 0; i < E3.ticks.length; i++) E3.ticks[i](dt, E3.t);
    E3.updateCamera(dt);
    E3.R.render(E3.scene, E3.cam);
  },
  // ---------- camera: smooth follow from behind and above ----------
  follow:{x:0, y:0, h:0}, camPos:null, camLook:null, camOverride:null,
  updateCamera(dt){
    const f = E3.camOverride || E3.follow, z = E3.zoom*(f.zoom || 1)*(E3.indoor ? .8 : 1);
    const tx = f.x/PX, tz = f.y/PX, th = (f.h || 0)/PX;
    const want = new THREE.Vector3(tx, th + 9.2*z, tz + 12*z), look = new THREE.Vector3(tx, th + 1.1, tz - 1.2);
    const k = 1 - Math.pow(f.snap ? .0001 : .02, dt);
    if(!E3.camPos || E3.camSnap){ E3.camPos = want.clone(); E3.camLook = look.clone(); E3.camSnap = false; }
    E3.camPos.lerp(want, k); E3.camLook.lerp(look, k);
    E3.cam.position.copy(E3.camPos);
    if(E3.shakeT > 0){ E3.shakeT -= dt; const m = E3.shakeM; E3.cam.position.x += (Math.random() - .5)*m; E3.cam.position.y += (Math.random() - .5)*m; }
    E3.cam.lookAt(E3.camLook);
    E3.fadeOccluders(look);
    if(E3.sun){ E3.sun.position.set(tx - 14, th + 26, tz + 12); E3.sun.target.position.set(tx, 0, tz - 2); }
  },
  // buildings between camera and player fade out so the player is always visible
  occ:[], target:null,
  group(fn){ const g = new THREE.Group(); E3.root.add(g); const prev = E3.target; E3.target = g; try { fn(g); } finally { E3.target = prev; } return g; },
  occluder(g){ E3.scene.updateMatrixWorld(true); E3.occ.push({g, b:new THREE.Box3().setFromObject(g), on:false}); return g; },
  fadeOccluders(look){ if(!E3.occ.length) return; const o = E3.cam.position, dir = look.clone().sub(o), len = dir.length(); dir.normalize(); const ray = new THREE.Ray(o, dir), hit = new THREE.Vector3();
    E3.occ.forEach(c => { const on = !!ray.intersectBox(c.b, hit) && hit.distanceTo(o) < len - .6; if(on === c.on) return; c.on = on;
      c.g.traverse(m => { if(!m.isMesh) return; if(!m.userData.orig){ m.userData.orig = m.material; m.userData.fade = m.material.clone(); m.userData.fade.transparent = true; m.userData.fade.opacity = .22; m.userData.fade.depthWrite = false; m.userData.fade.userData = {}; } m.material = on ? m.userData.fade : m.userData.orig; m.castShadow = !on; }); }); },
  shake(sec, mag){ E3.shakeT = sec; E3.shakeM = mag; },
  // ---------- zone scene ----------
  newZone(opt){
    E3.clearZone(); opt = opt || {};
    const S = E3.scene = new THREE.Scene(); E3.ticks = []; E3.occ = []; E3.target = null; E3.indoor = !!opt.indoor; E3.camSnap = true;
    const night = opt.sky === 'night';
    const skyTop = new THREE.Color(night ? '#060b2b' : opt.indoor ? '#2b2236' : '#3f8fe0'), skyLow = new THREE.Color(night ? '#2a3a8a' : opt.indoor ? '#3a2f45' : '#cdeaff');
    S.background = skyLow.clone(); S.fog = new THREE.Fog(skyLow, opt.fogNear || (opt.indoor ? 60 : 55), opt.fogFar || (opt.indoor ? 140 : 160));
    if(!opt.indoor) E3.sky(S, skyTop, skyLow, night);
    const hemi = new THREE.HemisphereLight(night ? '#9fb0ff' : '#e8f4ff', night ? '#2a3d2a' : '#6a8a4a', night ? 1.6 : opt.indoor ? 1.5 : 1.25); S.add(hemi);
    const sun = E3.sun = new THREE.DirectionalLight(night ? '#9fb4ff' : '#fff1d6', night ? 1.5 : opt.indoor ? 1.6 : 2.6);
    sun.castShadow = true; const sz = E3.mobile ? 1024 : 2048; sun.shadow.mapSize.set(sz, sz);
    Object.assign(sun.shadow.camera, {left:-28, right:28, top:28, bottom:-28, near:1, far:90}); sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
    S.add(sun); S.add(sun.target);
    const root = E3.root = new THREE.Group(); root.scale.setScalar(1/PX); S.add(root);
    return root;
  },
  clearZone(){
    if(!E3.scene) return;
    E3.scene.traverse(o => { if(o.userData.shared) return; if(o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if(m.userData.shared) return; if(m.map) m.map.dispose(); m.dispose(); }); });
    E3.scene = null; E3.root = null; E3.ticks = []; E3.camOverride = null;
  },
  sky(S, top, low, night){
    const g = new THREE.SphereGeometry(400, 24, 12);
    const m = new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false, uniforms:{top:{value:top}, low:{value:low}, sun:{value:new THREE.Vector3(-.5, .45, -.75).normalize()}, night:{value:night ? 1 : 0}},
      vertexShader:'varying vec3 vp; void main(){ vp = normalize(position); vec4 p = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }',
      fragmentShader:'uniform vec3 top; uniform vec3 low; uniform vec3 sun; uniform float night; varying vec3 vp; void main(){ float h = clamp(vp.y*1.6 + .08, 0., 1.); vec3 c = mix(low, top, pow(h, .7)); float s = max(dot(vp, sun), 0.); c += (night > .5 ? vec3(.8,.85,1.)*smoothstep(.9985,.999,s) : vec3(1.,.95,.8)*(smoothstep(.997,.999,s) + pow(s, 60.)*.35)); gl_FragColor = vec4(c, 1.); }'});
    const sky = new THREE.Mesh(g, m); sky.frustumCulled = false; sky.renderOrder = -1; S.add(sky);
    E3.ticks.push(() => sky.position.copy(E3.cam.position));
  },
  // ---------- materials & primitives (all sizes in px) ----------
  M:{},
  mat(col, o){ o = o || {}; const k = col + JSON.stringify(o); if(E3.M[k]) return E3.M[k];
    const m = o.basic ? new THREE.MeshBasicMaterial({color:col, transparent:o.opacity != null, opacity:o.opacity == null ? 1 : o.opacity, depthWrite:o.opacity == null}) :
      new THREE.MeshStandardMaterial({color:col, roughness:o.rough == null ? .85 : o.rough, metalness:o.metal || 0, flatShading:o.flat !== false, emissive:o.emit ? col : '#000000', emissiveIntensity:o.emit || 0, transparent:o.opacity != null, opacity:o.opacity == null ? 1 : o.opacity, depthWrite:o.opacity == null || o.opacity > .9});
    m.userData.shared = true; return E3.M[k] = m; },
  mesh(geo, col, o, parent){ o = o || {}; const m = new THREE.Mesh(geo, typeof col === 'string' ? E3.mat(col, o) : col); m.castShadow = o.cast !== false; m.receiveShadow = o.recv !== false; (parent || E3.target || E3.root).add(m); return m; },
  // centre (x, y) on the ground, size w (x) * d (y) * h (up), lifted by z
  box(x, y, w, d, h, col, o, parent){ o = o || {}; const m = E3.mesh(new THREE.BoxGeometry(w, h, d), col, o, parent); m.position.set(x, (o.z || 0) + h/2, y); if(o.ry) m.rotation.y = o.ry; return m; },
  cyl(x, y, r1, r2, h, col, o, parent){ o = o || {}; const m = E3.mesh(new THREE.CylinderGeometry(r2, r1, h, o.seg || 12), col, o, parent); m.position.set(x, (o.z || 0) + h/2, y); return m; },
  ball(x, y, r, col, o, parent){ o = o || {}; const m = E3.mesh(new THREE.IcosahedronGeometry(r, o.detail == null ? 1 : o.detail), col, o, parent); m.position.set(x, (o.z || 0) + r, y); if(o.sy) m.scale.y = o.sy; return m; },
  plane(x, y, w, d, col, o, parent){ o = o || {}; const m = E3.mesh(new THREE.PlaneGeometry(w, d), col, Object.assign({cast:false}, o), parent); m.rotation.x = -Math.PI/2; m.position.set(x, o.z || .5, y); return m; },
  disc(x, y, rx, ry, col, o, parent){ o = o || {}; const m = E3.mesh(new THREE.CircleGeometry(1, 40), col, Object.assign({cast:false}, o), parent); m.rotation.x = -Math.PI/2; m.scale.set(rx, ry, 1); m.position.set(x, o.z || .6, y); return m; },
  // ground with a soft procedural texture
  ground(x0, y0, w, h, c1, c2, o){ o = o || {}; const tex = E3.noiseTex(c1, c2, o.pattern); tex.repeat.set(w/(o.tile || 400), h/(o.tile || 400));
    const m = new THREE.MeshStandardMaterial({map:tex, roughness:.95, flatShading:false}); const g = E3.mesh(new THREE.PlaneGeometry(w, h), m, {cast:false}); g.rotation.x = -Math.PI/2; g.position.set(x0 + w/2, o.z || 0, y0 + h/2); return g; },
  noiseTex(c1, c2, pattern){
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = c1; x.fillRect(0, 0, 256, 256);
    if(pattern === 'check' || pattern === 'tile'){ x.fillStyle = c2; const n = pattern === 'check' ? 4 : 8; for(let i=0;i<n;i++) for(let j=0;j<n;j++) if((i + j) % 2) x.fillRect(i*256/n, j*256/n, 256/n, 256/n); if(pattern === 'tile'){ x.strokeStyle = 'rgba(0,0,0,.12)'; for(let i=0;i<=n;i++){ x.beginPath(); x.moveTo(i*32, 0); x.lineTo(i*32, 256); x.moveTo(0, i*32); x.lineTo(256, i*32); x.stroke(); } } }
    else if(pattern === 'wood'){ for(let i=0;i<8;i++){ x.fillStyle = i % 2 ? c2 : c1; x.fillRect(0, i*32, 256, 31); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, i*32 + 31, 256, 1); x.fillRect((i*97) % 256, i*32, 1, 32); } }
    else { let s = 7; const r = () => (s = (s*16807) % 2147483647)/2147483647; x.fillStyle = c2; for(let i=0;i<900;i++){ x.globalAlpha = .25 + r()*.5; x.fillRect(r()*256, r()*256, 2 + r()*3, 2 + r()*5); } x.globalAlpha = 1; }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  },
  // ---------- animated water ----------
  water(x0, y0, w, h, o){ o = o || {};
    const seg = E3.mobile ? 40 : 80, g = o.ellipse ? new THREE.CircleGeometry(.5, 48).scale(w, h, 1) : new THREE.PlaneGeometry(w, h, Math.min(seg, Math.ceil(w/60)), Math.min(seg, Math.ceil(h/60))); g.rotateX(-Math.PI/2);
    const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {t:{value:0}, deep:{value:new THREE.Color(o.deep || '#0b5fa5')}, shallow:{value:new THREE.Color(o.shallow || '#3fd0e8')}, amp:{value:o.amp == null ? 6 : o.amp}, shore:{value:o.shore == null ? -1 : o.shore}, night:{value:o.night ? 1 : 0}}]);
    const m = new THREE.ShaderMaterial({uniforms:u, fog:true, transparent:true,
      vertexShader:`uniform float t; uniform float amp; varying vec3 wp; varying float hh; #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix*vec4(position, 1.); float h = sin(w.x*.35 + t*1.3)*.5 + sin(w.z*.5 - t*1.1)*.35 + sin((w.x + w.z)*.9 + t*2.)*.15; vec3 p = position; p.y += h*amp; hh = h;
          vec4 mvPosition = modelViewMatrix*vec4(p, 1.); wp = (modelMatrix*vec4(p, 1.)).xyz; gl_Position = projectionMatrix*mvPosition; #include <fog_vertex> }`.replace(/#include <fog_pars_vertex>/, '\n#include <fog_pars_vertex>\n').replace(/#include <fog_vertex>/, '\n#include <fog_vertex>\n'),
      fragmentShader:`uniform float t; uniform vec3 deep; uniform vec3 shallow; uniform float shore; uniform float night; varying vec3 wp; varying float hh; #include <fog_pars_fragment>
        void main(){ vec3 v = normalize(cameraPosition - wp); float fr = pow(1. - max(v.y, 0.), 3.); vec3 c = mix(shallow, deep, clamp(.35 + fr*.6 - hh*.2, 0., 1.));
          float sp = sin(wp.x*2.1 + t*1.7)*sin(wp.z*2.6 - t*1.3); c += vec3(1.)*smoothstep(.82, .98, sp)*.35;
          if(shore > -.5){ float d = wp.z - shore; float foam = smoothstep(.0, .25, .5 + .5*sin(d*3. - t*2.5))*smoothstep(3.5, .0, d); c = mix(c, vec3(1.), foam*.55); }
          if(night > .5) c *= .45; gl_FragColor = vec4(c, .93); #include <fog_fragment> }`.replace(/#include <fog_pars_fragment>/, '\n#include <fog_pars_fragment>\n').replace(/#include <fog_fragment>/, '\n#include <fog_fragment>\n')});
    const mesh = new THREE.Mesh(g, m); mesh.position.set(x0 + w/2, o.z == null ? -4 : o.z, y0 + h/2); mesh.receiveShadow = false; E3.root.add(mesh);
    E3.ticks.push((dt, t) => { u.t.value = t; }); return mesh; },
  // ---------- text: billboards and flat boards ----------
  textCanvas(text, o){ o = o || {}; const fs = (o.size || 28)*2, pad = o.bg ? fs*.45 : 4, c = document.createElement('canvas'), x = c.getContext('2d'); const font = `${o.bold === false ? '' : '700 '}${fs}px "Segoe UI", system-ui, Arial`;
    x.font = font; const lines = String(text).split('\n'), w = Math.max(...lines.map(l => x.measureText(l).width)); c.width = Math.ceil(w + pad*2); c.height = Math.ceil(fs*1.25*lines.length + pad*2);
    x.font = font; if(o.bg){ x.fillStyle = o.bg; const r = Math.min(c.height/2, 24); x.beginPath(); x.roundRect(0, 0, c.width, c.height, r); x.fill(); }
    x.fillStyle = o.color || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; if(o.stroke){ x.lineWidth = fs*.18; x.strokeStyle = o.stroke; lines.forEach((l, i) => x.strokeText(l, c.width/2, pad + fs*1.25*(i + .5))); }
    lines.forEach((l, i) => x.fillText(l, c.width/2, pad + fs*1.25*(i + .5))); return c; },
  label(text, o, parent){ o = o || {}; const c = E3.textCanvas(text, o), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, depthTest:o.depthTest !== false, transparent:true, fog:false})); const k = (o.scale || 1)*.5; s.scale.set(c.width*k, c.height*k, 1); s.center.set(.5, 0); s.renderOrder = o.order || 10;
    if(o.x != null) s.position.set(o.x, o.z || 0, o.y); (parent || E3.target || E3.root).add(s); s.userData.setText = (tx) => { const n = E3.textCanvas(tx, o); s.material.map.dispose(); s.material.map = new THREE.CanvasTexture(n); s.material.map.colorSpace = THREE.SRGBColorSpace; s.scale.set(n.width*k, n.height*k, 1); }; return s; },
  board(x, y, z, text, o, parent){ o = o || {}; const c = E3.textCanvas(text, Object.assign({bg:o.bg || '#8d6e4a'}, o)), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const k = (o.scale || 1)*.5, m = new THREE.Mesh(new THREE.PlaneGeometry(c.width*k, c.height*k), new THREE.MeshStandardMaterial({map:t, transparent:true, roughness:.9})); m.position.set(x, z, y); m.rotation.x = o.tilt == null ? -.15 : o.tilt; if(o.ry) m.rotation.y = o.ry; m.castShadow = true; (parent || E3.target || E3.root).add(m); return m; },
  // ---------- GLB models made in Blender (tools/blender/scenery.py) ----------
  MODEL_NAMES:['oak', 'pine', 'sakura', 'palm', 'bush', 'bench', 'lamp', 'school', 'rock', 'flowers', 'fountain', 'statue', 'chest', 'sailboat', 'warship', 'pirate'],
  loadModels(){ const L = new GLTFLoader();
    return Promise.all(E3.MODEL_NAMES.map(n => new Promise(res => L.load('/models/' + n + '.glb', g => {
      const parts = []; g.scene.updateMatrixWorld(true);
      g.scene.traverse(o => { if(!o.isMesh) return; const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); geo.userData.shared = true; const m = o.material; m.flatShading = true; m.needsUpdate = true; m.userData.shared = true; parts.push({geo, mat:m}); });
      E3.models[n] = parts; res(); }, undefined, () => { E3.models[n] = []; res(); })))); },
  // one moving/standalone copy (meters -> px)
  model(name, x, y, s, ry, parent){ const grp = new THREE.Group(); (E3.models[name] || []).forEach(p => { const m = new THREE.Mesh(p.geo, p.mat); m.castShadow = m.receiveShadow = true; grp.add(m); });
    grp.scale.setScalar(PX*(s || 1)); grp.position.set(x, 0, y); grp.rotation.y = ry || 0; (parent || E3.target || E3.root).add(grp); return grp; },
  // many static copies in a few draw calls: items = [[x, y, scale, rotY], ...]
  scatter(name, items, parent){ if(!items.length) return; const parts = E3.models[name] || [], dummy = new THREE.Object3D();
    parts.forEach(p => { const im = new THREE.InstancedMesh(p.geo, p.mat, items.length); im.castShadow = true; im.receiveShadow = true;
      items.forEach(([x, y, s, r], i) => { dummy.position.set(x, 0, y); dummy.rotation.set(0, r == null ? (x*7 + y*3) % 6.28 : r, 0); dummy.scale.setScalar(PX*(s || 1)); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.computeBoundingSphere(); (parent || E3.root).add(im); }); },
  // ---------- particles (sprite pool) ----------
  dotTex:null,
  burst(x, y, z, o){ o = o || {}; if(!E3.dotTex){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); E3.dotTex = new THREE.CanvasTexture(c); }
    const n = o.n || 20, cols = o.colors || ['#ffffff'], list = [];
    for(let i=0;i<n;i++){ const m = new THREE.SpriteMaterial({map:E3.dotTex, color:cols[i % cols.length], transparent:true, depthWrite:false, blending:o.add ? THREE.AdditiveBlending : THREE.NormalBlending, fog:false}); const s = new THREE.Sprite(m);
      const a = Math.random()*6.28, el = (o.up == null ? Math.random() : o.up)*1.4, sp = (o.speed || 200)*(.4 + Math.random()*.6);
      s.position.set(x, z, y); s.userData = {vx:Math.cos(a)*Math.cos(el)*sp, vz:Math.sin(a)*Math.cos(el)*sp, vy:Math.sin(el)*sp, life:(o.life || 1)*(.6 + Math.random()*.4), age:0, s0:o.size || 30, s1:o.grow || 2};
      E3.root.add(s); list.push(s); }
    const tick = dt => { let alive = 0; list.forEach(s => { const u = s.userData; if(u.age >= u.life){ if(s.parent){ s.parent.remove(s); s.material.dispose(); } return; } alive++; u.age += dt; const k = u.age/u.life;
      s.position.x += u.vx*dt; s.position.y += u.vy*dt; s.position.z += u.vz*dt; u.vy -= (o.gravity || 0)*dt; u.vx *= Math.pow(.4, dt); u.vz *= Math.pow(.4, dt); const sc = u.s0*(1 + (u.s1 - 1)*k); s.scale.set(sc, sc, 1); s.material.opacity = 1 - k; });
      if(!alive){ const i = E3.ticks.indexOf(tick); if(i >= 0) E3.ticks.splice(i, 1); } };
    E3.ticks.push(tick); },
  // ---------- picking: screen point -> ground px ----------
  pick(cx, cy){ const r = E3.R.domElement.getBoundingClientRect(), v = new THREE.Vector2((cx - r.left)/r.width*2 - 1, -(cy - r.top)/r.height*2 + 1), ray = new THREE.Raycaster(); ray.setFromCamera(v, E3.cam);
    const p = new THREE.Vector3(); if(!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null; return {x:p.x*PX, y:p.z*PX}; },
  fade(on, ms){ let f = document.getElementById('fade3d'); if(!f){ f = document.createElement('div'); f.id = 'fade3d'; Object.assign(f.style, {position:'fixed', inset:0, background:'#000', pointerEvents:'none', opacity:0, zIndex:3, transition:'opacity .3s'}); document.body.appendChild(f); }
    f.style.transitionDuration = (ms || 300) + 'ms'; f.style.opacity = on ? 1 : 0; },
  flash(ms){ let f = document.getElementById('flash3d'); if(!f){ f = document.createElement('div'); f.id = 'flash3d'; Object.assign(f.style, {position:'fixed', inset:0, background:'#fff8e1', pointerEvents:'none', opacity:0, zIndex:3}); document.body.appendChild(f); }
    f.style.transition = 'none'; f.style.opacity = .85; requestAnimationFrame(() => { f.style.transition = `opacity ${ms || 400}ms`; f.style.opacity = 0; }); }
};
