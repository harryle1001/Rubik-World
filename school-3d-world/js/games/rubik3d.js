// ================= RUBIK 3D =================
let R3 = null;
const RMOVES = {U:['y',1,-1], D:['y',-1,1], L:['x',-1,1], R:['x',1,-1], F:['z',1,-1], B:['z',-1,1]};
function openRubik(){ showModal('mRubik'); if(typeof THREE === 'undefined'){ $('#rstate').textContent = 'Không tải được thư viện 3D. Kiểm tra mạng rồi mở lại trang.'; return; } if(!R3) rubikInit(); R3.running = true; R3.last = performance.now(); requestAnimationFrame(rubikLoop); }
function rubikPause(){ if(R3) R3.running = false; }
function rubikInit(){
  const cv = $('#rubikCv');
  const renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, .7)); const dl = new THREE.DirectionalLight(0xffffff, .5); dl.position.set(5, 8, 6); scene.add(dl);
  const root = new THREE.Group(); scene.add(root);
  const COL = [0xb71c1c, 0xff6d00, 0xffffff, 0xffd600, 0x00a651, 0x1565c0];
  const body = new THREE.MeshLambertMaterial({color:0x111111}), bgeo = new THREE.BoxGeometry(.97, .97, .97), sgeo = new THREE.PlaneGeometry(.82, .82);
  const smat = COL.map(c => new THREE.MeshLambertMaterial({color:c}));
  const cubies = [];
  for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++){
    const c = new THREE.Mesh(bgeo, body); c.position.set(x, y, z); c.userData.home = new THREE.Vector3(x, y, z);
    const add = (cond, mi, px, py, pz, rx, ry) => { if(!cond) return; const s = new THREE.Mesh(sgeo, smat[mi]); s.position.set(px, py, pz); s.rotation.set(rx, ry, 0); c.add(s); };
    add(x === 1, 0, .49, 0, 0, 0, Math.PI/2); add(x === -1, 1, -.49, 0, 0, 0, -Math.PI/2);
    add(y === 1, 2, 0, .49, 0, -Math.PI/2, 0); add(y === -1, 3, 0, -.49, 0, Math.PI/2, 0);
    add(z === 1, 4, 0, 0, .49, 0, 0); add(z === -1, 5, 0, 0, -.49, 0, Math.PI);
    root.add(c); cubies.push(c);
  }
  const orbit = {th:.65, ph:1.05};
  const placeCam = () => { const r = 8.4; camera.position.set(r*Math.sin(orbit.ph)*Math.sin(orbit.th), r*Math.cos(orbit.ph), r*Math.sin(orbit.ph)*Math.cos(orbit.th)); camera.lookAt(0, 0, 0); };
  placeCam();
  R3 = {renderer, scene, camera, root, cubies, orbit, placeCam, queue:[], anim:null, hist:[], scrambled:false, solving:false, t0:0, timing:false, moves:0, running:false, last:0};
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let drag = null;
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(cubies, true); try { cv.setPointerCapture(e.pointerId); } catch(err){}
    if(hits.length){ let o = hits[0].object; while(o && !cubies.includes(o)) o = o.parent; const n = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld); drag = {type:'turn', cubie:o, point:hits[0].point.clone(), nAxis: Math.abs(n.x) > .9 ? 'x' : Math.abs(n.y) > .9 ? 'y' : 'z', x:e.clientX, y:e.clientY, done:false}; }
    else drag = {type:'orbit', x:e.clientX, y:e.clientY, th:orbit.th, ph:orbit.ph};
  });
  cv.addEventListener('pointermove', e => {
    if(!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if(drag.type === 'orbit'){ orbit.th = drag.th - dx*.01; orbit.ph = clamp(drag.ph - dy*.01, .2, 2.95); placeCam(); return; }
    if(drag.done || Math.hypot(dx, dy) < 14) return; drag.done = true;
    let best = {score:0, ax:null}; const p = drag.point;
    ['x','y','z'].forEach(ax => { if(ax === drag.nAxis) return; const a = new THREE.Vector3(ax === 'x' ? 1 : 0, ax === 'y' ? 1 : 0, ax === 'z' ? 1 : 0); const v = new THREE.Vector3().crossVectors(a, p).multiplyScalar(.25);
      const p1 = p.clone().project(camera), p2 = p.clone().add(v).project(camera), sx = p2.x - p1.x, sy = -(p2.y - p1.y), dot = (sx*dx + sy*dy)/((Math.hypot(sx, sy) || 1)*Math.hypot(dx, dy));
      if(Math.abs(dot) > Math.abs(best.score)) best = {score:dot, ax}; });
    if(best.ax) userTurn(best.ax, Math.round(drag.cubie.position[best.ax]), best.score > 0 ? 1 : -1);
  });
  cv.addEventListener('pointerup', () => { drag = null; });
  cv.addEventListener('pointercancel', () => { drag = null; });
  const mb = $('#rmovebtns'); ['U','D','L','R','F','B'].forEach(k => [k, k + "'"].forEach(n => { const b = el('button', {type:'button'}, n); b.setAttribute('aria-label', 'Xoay ' + n); b.onclick = () => notation(n); mb.appendChild(b); }));
}
function notation(n){ const m = RMOVES[n[0]]; if(!m) return; userTurn(m[0], m[1], n.length > 1 ? -m[2] : m[2]); }
function userTurn(axis, layer, dir){
  if(!R3 || R3.solving) return;
  if(R3.scrambled && !R3.timing && !R3.queue.length && !R3.anim){ R3.timing = true; R3.t0 = performance.now(); $('#rstate').textContent = 'Đang bấm giờ. Xoay cho mỗi mặt cùng một màu!'; }
  R3.queue.push({axis, layer, dir, record:true, speed:1}); R3.moves++; $('#rcount').textContent = R3.moves + ' bước';
}
function rubikKey(e){ const k = e.key.toUpperCase(); if(RMOVES[k]){ e.preventDefault(); notation(k + (e.shiftKey ? "'" : '')); } }
function rubikSolved(){ return R3.cubies.every(c => { const h = c.userData.home; if((h.x ? 1 : 0) + (h.y ? 1 : 0) + (h.z ? 1 : 0) <= 1) return true; return c.position.distanceTo(h) < .01 && Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-3; }); }
function rubikStep(dt){
  const S3 = R3;
  if(!S3.anim && S3.queue.length){ const q = S3.queue.shift(), pivot = new THREE.Object3D(); S3.root.add(pivot); const sel = S3.cubies.filter(c => Math.round(c.position[q.axis]) === q.layer); sel.forEach(c => pivot.attach(c)); S3.anim = {q, pivot, sel, t:0}; }
  const a = S3.anim; if(!a) return;
  a.t = Math.min(1, a.t + dt*a.q.speed*5.5); const e = a.t < .5 ? 2*a.t*a.t : 1 - Math.pow(-2*a.t + 2, 2)/2;
  a.pivot.rotation.set(0, 0, 0); a.pivot.rotation[a.q.axis] = e*a.q.dir*Math.PI/2;
  if(a.t < 1) return;
  a.pivot.updateMatrixWorld();
  a.sel.forEach(c => { S3.root.attach(c); c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z)); const m4 = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion); const el2 = m4.elements; for(let i=0;i<16;i++) el2[i] = Math.round(el2[i]); c.quaternion.setFromRotationMatrix(m4); });
  S3.root.remove(a.pivot); S3.anim = null;
  if(a.q.record) S3.hist.push({axis:a.q.axis, layer:a.q.layer, dir:a.q.dir});
  if(!S3.queue.length){
    if(S3.scrambling){ S3.scrambling = false; S3.scrambled = true; S3.timing = false; S3.moves = 0; $('#rcount').textContent = '0 bước'; $('#rstate').textContent = 'Đã xáo trộn. Xoay nước đầu tiên để bắt đầu bấm giờ.'; $('#rtimer').textContent = '00:00.0'; }
    else if(S3.scrambled && rubikSolved()){
      const secs = (performance.now() - S3.t0)/1000, by = S3.solving ? 'Máy đã giải xong khối Rubik.' : `Bạn giải xong trong ${secs.toFixed(1)} giây với ${S3.moves} bước!`;
      S3.scrambled = false; S3.timing = false; S3.solving = false; S3.hist = []; $('#rstate').textContent = by; toast(by); log('event', 'Rubik 3D: ' + by); mprog('rubik'); if(by.startsWith('Bạn')) reward(40, 15, 'Giải xong Rubik 3D');
    }
    if(S3.solving && !S3.queue.length){ S3.solving = false; }
  }
}
function rubikLoop(now){
  if(!R3 || !R3.running) return;
  const dt = Math.min(.05, (now - R3.last)/1000); R3.last = now;
  const cv = R3.renderer.domElement, w = cv.clientWidth, h = cv.clientHeight;
  if(w && (cv.width !== Math.round(w*R3.renderer.getPixelRatio()) || cv.height !== Math.round(h*R3.renderer.getPixelRatio()))){ R3.renderer.setSize(w, h, false); R3.camera.aspect = w/h; R3.camera.updateProjectionMatrix(); }
  rubikStep(dt);
  if(R3.timing){ const s = (performance.now() - R3.t0)/1000; $('#rtimer').textContent = pad2(Math.floor(s/60)) + ':' + (s % 60).toFixed(1).padStart(4, '0'); }
  R3.renderer.render(R3.scene, R3.camera);
  requestAnimationFrame(rubikLoop);
}
$('#rscramble').onclick = () => {
  if(!R3 || R3.anim || R3.queue.length) return;
  const axes = ['x','y','z']; let last = '';
  for(let i=0;i<22;i++){ let ax; do { ax = pick(axes); } while(ax === last); last = ax; R3.queue.push({axis:ax, layer:pick([-1,1]), dir:pick([-1,1]), record:true, speed:3.2}); }
  R3.scrambling = true; R3.timing = false; $('#rstate').textContent = 'Đang xáo trộn...';
};
$('#rsolve').onclick = () => {
  if(!R3 || R3.anim || R3.queue.length || !R3.hist.length) return;
  R3.solving = true; R3.timing = false; $('#rstate').textContent = 'Máy đang giải: xoay ngược lại từng bước...';
  for(let i = R3.hist.length - 1; i >= 0; i--){ const m = R3.hist[i]; R3.queue.push({axis:m.axis, layer:m.layer, dir:-m.dir, record:false, speed:2.4}); }
  R3.hist = [];
};
$('#rreset').onclick = () => {
  if(!R3) return; R3.queue = []; R3.anim = null;
  R3.root.children.slice().forEach(o => { if(!R3.cubies.includes(o)) R3.root.remove(o); });
  R3.cubies.forEach(c => { R3.root.attach(c); c.position.copy(c.userData.home); c.quaternion.identity(); });
  Object.assign(R3, {hist:[], scrambled:false, solving:false, scrambling:false, timing:false, moves:0}); $('#rcount').textContent = '0 bước'; $('#rtimer').textContent = '00:00.0'; $('#rstate').textContent = 'Đã đặt lại khối Rubik về trạng thái ban đầu.';
};

