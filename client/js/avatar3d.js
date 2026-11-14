// 3D chibi student: built from the player's colours and hair style, with hats and 8 bike designs. All sizes in px (40 px = 1 m).
const RB = (w, h, d, r) => window.RoundedBoxGeometry ? new RoundedBoxGeometry(w, h, d, 2, r || 3) : new THREE.BoxGeometry(w, h, d);
function part(geo, col, parent, x, y, z, o){ const m = new THREE.Mesh(geo, E3.mat(col, Object.assign({flat:false, rough:.7}, o || {}))); m.castShadow = true; m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; }
function limb(parent, x, y, z, w, h, d, col, col2){ const pv = new THREE.Group(); pv.position.set(x, y, z); parent.add(pv); part(RB(w, h, d, 2.5), col, pv, 0, -h/2, 0); if(col2) part(RB(w + .6, h*.42, d + .6, 2.5), col2, pv, 0, -h*.82, 0); return pv; }

class Avatar3D {
  constructor(style, opt){
    opt = opt || {}; this.style = style || {}; this.g = new THREE.Group(); this.rig = new THREE.Group(); this.g.add(this.rig); this.ph = Math.random()*6; this.face = 0; this.rideKey = null; this.hatKey = null;
    const sh = new THREE.Mesh(new THREE.CircleGeometry(15, 20), E3.mat('#000000', {basic:true, opacity:.22})); sh.rotation.x = -Math.PI/2; sh.position.y = .8; this.g.add(sh); this.shadow = sh;
    this.build(); if(opt.name) this.setName(opt.name, opt.me);
    (opt.parent || E3.root).add(this.g);
  }
  build(){
    const s = this.style, R = this.rig, skin = s.skin || '#f2c9a0', shirt = s.shirt || '#3d7bff', pants = s.pants || '#24356b', hair = s.hair || '#2a1a12';
    this.legL = limb(R, -6, 24, 0, 9, 22, 10, pants, '#2b2b2b'); this.legR = limb(R, 6, 24, 0, 9, 22, 10, pants, '#2b2b2b');
    this.body = part(RB(24, 22, 15, 5), shirt, R, 0, 34, 0); part(RB(25, 4, 16, 2), shadeHex(shirt, -.25), R, 0, 25, 0);
    this.armL = limb(R, -15, 43, 0, 7, 20, 7, shirt, skin); this.armR = limb(R, 15, 43, 0, 7, 20, 7, shirt, skin);
    const head = this.head = new THREE.Group(); head.position.y = 58; R.add(head);
    part(RB(28, 26, 25, 7), skin, head, 0, 0, 0);
    [-6, 6].forEach(x => { part(new THREE.BoxGeometry(3.6, 5, 1), '#1a1a1a', head, x, 1, 12.6); part(new THREE.BoxGeometry(1.4, 1.6, 1), '#ffffff', head, x + .8, 2.4, 13.2); });
    part(new THREE.BoxGeometry(6, 1.6, 1), '#c97a6a', head, 0, -6, 12.6); [-10, 10].forEach(x => part(new THREE.BoxGeometry(4, 2, .6), '#f4a4a4', head, x, -3, 12.5, {opacity:.7}));
    const H = (geo, x, y, z) => part(geo, hair, head, x, y, z);
    H(RB(30, 9, 27, 4), 0, 11, -.5); H(RB(30, 14, 6, 3), 0, 3, -11);
    const st = s.hairStyle || 'short';
    if(st === 'long'){ H(RB(6, 26, 22, 3), -14, -4, -2); H(RB(6, 26, 22, 3), 14, -4, -2); H(RB(30, 30, 6, 3), 0, -6, -12); }
    else if(st === 'bun'){ H(new THREE.IcosahedronGeometry(8, 1), 0, 18, -8); }
    else if(st === 'spiky'){ for(let k=0;k<5;k++){ const c = H(new THREE.ConeGeometry(5, 12, 5), -12 + k*6, 19, -2 + (k % 2)*4); c.rotation.z = (k - 2)*.25; } }
    else if(st === 'pony'){ const p = H(new THREE.CylinderGeometry(4, 2, 22, 6), 0, -2, -16); p.rotation.x = .35; H(new THREE.IcosahedronGeometry(4.5, 0), 0, 8, -14); }
    else { H(RB(8, 6, 26, 2), -11, 7, 0); }
    this.hatG = new THREE.Group(); this.hatG.position.y = 13; head.add(this.hatG);
    this.bikeG = new THREE.Group(); this.g.add(this.bikeG);
  }
  setName(n, me){ if(this.tag){ this.g.remove(this.tag); this.tag.material.map.dispose(); } this.tag = E3.label(n, {size:15, color:me ? '#ffd23f' : '#ffffff', bg:'rgba(10,15,34,.6)', order:20, depthTest:false}, this.g); this.tag.position.y = 84; }
  say(t){ if(this.bub){ this.g.remove(this.bub); this.bub.material.map.dispose(); } const txt = String(t).replace(/(.{1,26})(\s|$)/g, '$1\n').trim();
    this.bub = E3.label(txt, {size:15, color:'#1a1400', bg:'#fff8e1', order:21, depthTest:false}, this.g); this.bub.position.y = this.tag ? this.tag.position.y + 22 : 106;
    clearTimeout(this.bt); this.bt = setTimeout(() => { if(this.bub){ this.g.remove(this.bub); this.bub.material.map.dispose(); this.bub = null; } }, 4500); }
  setHat(key){ if(key === this.hatKey) return; this.hatKey = key; this.hatG.clear(); if(!key) return; const [id, col] = String(key).split('|'), it = SHARED.CATALOG.find(c => c.id === id); if(!it) return; const c = col || '#ef4b4b', h = this.hatG;
    if(it.design === 'cap'){ part(new THREE.SphereGeometry(16, 12, 6, 0, Math.PI*2, 0, Math.PI/2), c, h, 0, -2, -1).scale.set(1, .7, 1); part(new THREE.BoxGeometry(22, 2, 12), c, h, 0, -1, 16); }
    else if(it.design === 'nonla'){ part(new THREE.ConeGeometry(30, 18, 16), col || '#e8d29a', h, 0, 6, 0); }
    else { part(new THREE.CylinderGeometry(13, 12, 8, 10, 1, true), col || '#ffd23f', h, 0, 2, 0, {metal:.6, rough:.3}); for(let k=0;k<5;k++){ const a = k*Math.PI*2/5; part(new THREE.ConeGeometry(3, 8, 4), col || '#ffd23f', h, Math.sin(a)*12, 10, Math.cos(a)*12, {metal:.6, rough:.3}); part(new THREE.IcosahedronGeometry(2, 0), ['#e53935', '#1e88e5', '#43a047'][k % 3], h, Math.sin(a)*13, 2, Math.cos(a)*13, {emit:.4}); } } }
  setRide(key){ if(key === this.rideKey) return; this.rideKey = key; this.bikeG.clear(); this.bike = null; const b = key ? bikeOf(key) : null; this.rig.position.set(0, 0, 0); this.legL.rotation.set(0, 0, 0); this.legR.rotation.set(0, 0, 0);
    if(!b){ if(this.tag) this.tag.position.y = 84; return; } this.bike = Bike3D(b.design, b.col, this.bikeG); this.rig.position.set(0, this.bike.seat - 18, this.bike.seatZ); if(this.tag) this.tag.position.y = this.bike.seat + 68; }
  update(dt, moving, speed){
    this.ph += dt*(moving ? (this.bike ? 9 : 11)*(speed || 1) : 2); const s = Math.sin(this.ph);
    if(this.bike){ const a = this.ph; this.legL.rotation.x = -1.1 + Math.sin(a)*.5; this.legR.rotation.x = -1.1 - Math.sin(a)*.5; this.armL.rotation.x = this.armR.rotation.x = -.9; this.bike.spin(moving ? dt*(speed || 1)*12 : 0); this.rig.position.y = this.bike.seat - 18 + (moving ? Math.abs(s)*1 : 0); }
    else if(moving){ this.legL.rotation.x = s*.75; this.legR.rotation.x = -s*.75; this.armL.rotation.x = -s*.7; this.armR.rotation.x = s*.7; this.rig.position.y = Math.abs(Math.cos(this.ph))*3; this.body.rotation.y = s*.06; }
    else { this.legL.rotation.x *= .8; this.legR.rotation.x *= .8; this.armL.rotation.x *= .8; this.armR.rotation.x *= .8; this.rig.position.y = 0; this.head.position.y = 58 + Math.sin(this.ph)*.6; }
  }
  faceTo(vx, vy, dt){ if(Math.hypot(vx, vy) < .01) return; const want = Math.atan2(vx, vy); let d = want - this.face; d = Math.atan2(Math.sin(d), Math.cos(d)); this.face += d*Math.min(1, dt*12); this.g.rotation.y = this.face; if(this.tag) this.tag.rotation.y = 0; }
  dispose(){ clearTimeout(this.bt); if(this.g.parent) this.g.parent.remove(this.g); this.g.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.isSprite && o.material.map) o.material.map.dispose(); }); }
}
// ---------- 8 bike designs ----------
function Bike3D(design, col, parent){
  const g = new THREE.Group(); parent.add(g); const wheels = [], dark = '#263238', metal = {metal:.5, rough:.35, flat:false};
  const W = (z, r, tube) => { const w = new THREE.Group(); w.position.set(0, r, z); g.add(w); const t = part(new THREE.TorusGeometry(r, tube || 2.2, 6, 20), '#212121', w); t.rotation.y = Math.PI/2;
    for(let k=0;k<4;k++){ const sp = part(new THREE.BoxGeometry(.8, r*2 - 2, .8), '#b0bec5', w); sp.rotation.x = k*Math.PI/4; } part(new THREE.CylinderGeometry(2, 2, 4, 8), '#90a4ae', w).rotation.z = Math.PI/2; wheels.push({w, r}); return w; };
  const T = (z1, y1, z2, y2, r, c) => { const len = Math.hypot(z2 - z1, y2 - y1), m = part(new THREE.CylinderGeometry(r || 1.6, r || 1.6, len, 6), c || col, g, 0, (y1 + y2)/2, (z1 + z2)/2, metal); m.rotation.x = Math.atan2(z2 - z1, y2 - y1); return m; };
  let seat = 34, seatZ = -4, rf = 14, rr = 14, zf = 18, zr = -18;
  if(design === 'bmx'){ rf = rr = 11; zf = 15; zr = -15; seat = 28; }
  if(design === 'penny'){ rf = 30; rr = 9; zf = 6; zr = -26; seat = 62; seatZ = 2; }
  if(design === 'tandem'){ zf = 30; zr = -30; }
  if(design === 'cargo'){ zf = 30; }
  const tube = design === 'fat' ? 5 : design === 'road' ? 1.4 : design === 'mtb' ? 3 : 2.2;
  W(zf, rf, tube); W(zr, rr, tube);
  if(design === 'penny'){ T(zf, rf, zr, rr + 8, 2); T(zr, rr, zr, rr + 8, 1.5); part(new THREE.BoxGeometry(8, 3, 12), '#3e2723', g, 0, seat - 2, seatZ); T(zf, rf, zf, rf + 14, 1.2); }
  else {
    const hy = seat - 6; T(zr, rr, -4, hy - 4); T(-4, hy - 4, zf - 4, hy); T(zr, rr, zf - 4, rr + 4); T(zf, rf, zf - 4, hy + 6); T(-4, hy - 4, -4, seat - 2);
    part(new THREE.BoxGeometry(8, 3, 13), '#3e2723', g, 0, seat - 1, -4); part(new THREE.CylinderGeometry(1.4, 1.4, 22, 6), dark, g, 0, hy + 6, zf - 4, metal).rotation.z = Math.PI/2;
    if(design === 'tandem'){ T(-4, hy - 4, -24, hy - 4); part(new THREE.BoxGeometry(8, 3, 13), '#3e2723', g, 0, seat - 1, -24); }
    if(design === 'cargo') part(new THREE.BoxGeometry(22, 14, 18), '#8d6e4a', g, 0, rf + 8, zf - 2);
    if(design === 'city') part(new THREE.BoxGeometry(14, 10, 10), '#d7ccc8', g, 0, hy + 4, zf + 4);
    if(design === 'road') T(zf - 4, hy + 6, zf + 2, hy + 2, 1.2, dark);
  }
  return {seat, seatZ, spin(a){ wheels.forEach(w => w.w.rotation.x += a*14/w.r); }};
}
