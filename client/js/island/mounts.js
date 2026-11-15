// mounts.js — Thú cưỡi: ngựa, ngựa vằn, lạc đà, đà điểu, voi, trâu (dựng low poly, chân có khớp để phi nước kiệu),
// mọi thú trên đảo (hươu, cáo, chó, mèo, ếch, cua: lại gần chậm rãi rồi bấm E — thú phóng to ra để cưỡi),
// và 🔥 phượng hoàng bay khắp bản đồ (P gọi phượng hoàng · Space bay lên · C/Ctrl hạ xuống · Shift lao nhanh).
import * as THREE from 'three';
import { CFG } from './config.js';
import { addOutline, gradientMap } from './style.js';
import { paint, at, box, mesh, tris, ICON } from './geo.js';
import { mergeGeos } from './terrain.js';
const mergeParts = p => mergeGeos(p);

// ---------- Thú 4 chân dựng bằng khối ----------
// o: len (dài thân), leg (chiều cao chân), bw/bh (rộng/cao thân), neck [dài, góc], head [rộng, cao, dài], col, col2 (bờm/móng)
function quad(o) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const y0 = o.leg, parts = [];
  parts.push(box(o.bw, o.bh, o.len, o.col, 0, y0 + o.bh / 2, 0));
  parts.push(box(o.bw * 0.86, o.bh * 0.86, o.len * 0.2, o.col, 0, y0 + o.bh * 0.5, o.len * 0.52)); // ngực
  const [nl, na] = o.neck, nb = new THREE.Vector3(0, y0 + o.bh * 0.75, o.len * 0.5), nd = new THREE.Vector3(0, Math.cos(na), Math.sin(na));
  const nc = nb.clone().addScaledVector(nd, nl / 2), ne = nb.clone().addScaledVector(nd, nl);
  parts.push(box(o.nw || o.bw * 0.45, nl, o.nw || o.bw * 0.45, o.col, nc.x, nc.y, nc.z, na));
  const [hw, hh, hd] = o.head;
  parts.push(box(hw, hh, hd, o.col, 0, ne.y, ne.z + hd * 0.35), box(hw * 0.8, hh * 0.6, hd * 0.35, o.col2 || o.col, 0, ne.y - hh * 0.15, ne.z + hd * 0.75));
  for (const s of [-1, 1]) parts.push(box(0.06, 0.06, 0.03, '#1b1626', s * hw * 0.5, ne.y + hh * 0.15, ne.z + hd * 0.45)); // mắt
  if (o.ears) for (const s of [-1, 1]) parts.push(box(o.ears[0], o.ears[1], 0.06, o.col, s * hw * 0.42, ne.y + hh * 0.5 + o.ears[1] * 0.3, ne.z, 0, 0, s * 0.3));
  if (o.mane) parts.push(box(0.08, nl * 0.95, 0.14, o.mane, nc.x, nc.y + 0.08, nc.z - 0.12, na));
  if (o.hump) for (const z of o.hump) parts.push(paint(at(new THREE.SphereGeometry(o.bw * 0.38, 7, 5), 0, y0 + o.bh, z).scale(1, 1, 1), o.col));
  if (o.trunk) { const t = new THREE.CylinderGeometry(0.07, 0.14, o.trunk, 6); parts.push(paint(at(t, 0, ne.y - o.trunk / 2, ne.z + hd * 0.75), o.col)); }
  if (o.tusk) for (const s of [-1, 1]) parts.push(paint(at(new THREE.ConeGeometry(0.05, 0.45, 5), s * 0.18, ne.y - hh * 0.4, ne.z + hd * 0.8, 1.9), '#f4efe4'));
  if (o.horns) for (const s of [-1, 1]) parts.push(paint(at(new THREE.ConeGeometry(0.07, o.horns, 5), s * hw * 0.62, ne.y + hh * 0.45, ne.z + hd * 0.1, 0, 0, -s * 1.25), '#e8dcc0'));
  if (o.stripes) for (let k = 0; k < 7; k++) parts.push(box(o.bw + 0.02, o.bh + 0.02, 0.07, '#1b1626', 0, y0 + o.bh / 2, -o.len * 0.42 + k * o.len * 0.14));
  parts.push(box(0.08, o.tail || 0.5, 0.08, o.col2 || o.col, 0, y0 + o.bh * 0.65 - (o.tail || 0.5) / 2, -o.len * 0.52, -0.25)); // đuôi
  body.add(mesh(parts));
  const legs = [], lw = o.lw || o.bw * 0.22;
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const L = new THREE.Group(); L.position.set(x * (o.bw / 2 - lw / 2), y0 + 0.05, z * o.len * 0.38); body.add(L);
    L.add(mesh([box(lw, o.leg, lw, o.col, 0, -o.leg / 2), box(lw * 1.1, 0.1, lw * 1.2, o.hoof || '#3a2a20', 0, -o.leg + 0.05, 0.01)])); legs.push(L);
  }
  addOutline(g);
  return { group: g, body, legs, back: y0 + o.bh + (o.saddleUp || 0), saddleZ: o.saddleZ || 0 };
}
// Đà điểu: 2 chân dài, cổ thẳng
function ostrich() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const sph = new THREE.SphereGeometry(0.5, 8, 6); sph.scale(0.95, 0.75, 1.25);
  body.add(mesh([paint(at(sph, 0, 1.35, 0), '#2a2630'), paint(at(new THREE.SphereGeometry(0.28, 6, 5), 0, 1.45, -0.6), '#f4efe4'), box(0.12, 1.0, 0.12, '#e8b0a0', 0, 1.95, 0.5, 0.15),
    box(0.2, 0.18, 0.32, '#e8b0a0', 0, 2.45, 0.62), box(0.08, 0.06, 0.16, '#e0c070', 0, 2.42, 0.82), box(0.04, 0.04, 0.02, '#1b1626', -0.09, 2.5, 0.7), box(0.04, 0.04, 0.02, '#1b1626', 0.09, 2.5, 0.7),
    box(0.1, 0.36, 0.5, '#1b1626', -0.48, 1.38, -0.05, 0.3), box(0.1, 0.36, 0.5, '#1b1626', 0.48, 1.38, -0.05, 0.3)]));
  const legs = [];
  for (const x of [-0.18, 0.18]) { const L = new THREE.Group(); L.position.set(x, 1.12, 0.05); body.add(L); L.add(mesh([box(0.09, 1.1, 0.09, '#e8b0a0', 0, -0.55), box(0.16, 0.06, 0.26, '#c89080', 0, -1.09, 0.06)])); legs.push(L); }
  addOutline(g);
  return { group: g, body, legs, back: 1.62, saddleZ: -0.05, biped: true };
}
// Phượng hoàng: cánh vỗ, đuôi lông dài, phát sáng nhẹ
function phoenix() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, emissive: '#ff4a10', emissiveIntensity: 0.28 });
  const sph = new THREE.SphereGeometry(0.6, 9, 7); sph.scale(0.9, 0.8, 1.6);
  const parts = [paint(at(sph, 0, 1.25, 0), '#e8452c'), paint(at(new THREE.SphereGeometry(0.42, 7, 6).scale(0.9, 0.8, 1.2), 0, 1.15, 0.55), '#f2a23a'),
    box(0.3, 0.75, 0.3, '#e8452c', 0, 1.75, 0.95, 0.55), paint(at(new THREE.SphereGeometry(0.3, 7, 6), 0, 2.15, 1.25), '#e8452c'),
    paint(at(new THREE.ConeGeometry(0.1, 0.35, 5), 0, 2.1, 1.6, Math.PI / 2), '#f2c14e'), box(0.05, 0.06, 0.03, '#1b1626', -0.2, 2.22, 1.38), box(0.05, 0.06, 0.03, '#1b1626', 0.2, 2.22, 1.38)];
  for (let k = 0; k < 3; k++) parts.push(paint(at(new THREE.ConeGeometry(0.06, 0.55, 4), 0, 2.45 + k * 0.05, 1.05 - k * 0.18, -0.5 - k * 0.25), k % 2 ? '#f2c14e' : '#ff7a2a')); // mào
  for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.22; parts.push(paint(at(new THREE.BoxGeometry(0.16, 0.04, 2.2 - Math.abs(k - 2) * 0.35), Math.sin(a) * 1.1, 1.15 - Math.abs(k - 2) * 0.05, -1.5 - Math.cos(a) * 0.3, 0.12, a), ['#f2c14e', '#ff7a2a', '#e8452c'][k % 3])); } // đuôi
  body.add(new THREE.Mesh(mergeParts(parts), mat));
  const wings = [-1, 1].map(s => {
    const W = new THREE.Group(); W.position.set(s * 0.45, 1.5, 0.15); body.add(W);
    const f = []; for (let k = 0; k < 4; k++) f.push(paint(at(new THREE.BoxGeometry(0.75, 0.06, 0.9 - k * 0.15), s * (0.35 + k * 0.62), 0, -k * 0.12, 0, s * 0.1 * k), ['#e8452c', '#ff7a2a', '#f2a23a', '#f2c14e'][k]));
    W.add(new THREE.Mesh(mergeParts(f), mat)); return W;
  });
  const legs = []; for (const x of [-0.22, 0.22]) { const L = new THREE.Group(); L.position.set(x, 0.85, 0.1); body.add(L); L.add(mesh([box(0.08, 0.85, 0.08, '#f2c14e', 0, -0.42), box(0.2, 0.05, 0.3, '#f2c14e', 0, -0.83, 0.08)])); legs.push(L); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  addOutline(g);
  return { group: g, body, legs, wings, back: 1.72, saddleZ: 0.05, biped: true };
}

const KINDS = {
  horse: { name: 'Ngựa', make: () => quad({ len: 1.7, leg: 1.0, bw: 0.55, bh: 0.6, neck: [0.8, 0.55], head: [0.3, 0.32, 0.6], col: '#8a5a34', col2: '#3a2618', mane: '#2a1a10', ears: [0.1, 0.2], tail: 0.75 }), speed: 15, fact: 'Ngựa có thể ngủ khi đang đứng nhờ các khớp chân tự khoá lại.' },
  horse2: { name: 'Ngựa bạch', make: () => quad({ len: 1.7, leg: 1.0, bw: 0.55, bh: 0.6, neck: [0.8, 0.55], head: [0.3, 0.32, 0.6], col: '#f2efe6', col2: '#c8c0b0', mane: '#d8d0c0', ears: [0.1, 0.2], tail: 0.75, hoof: '#8a8070' }), speed: 15, fact: 'Ngựa nhìn được gần như xung quanh mình vì hai mắt nằm ở hai bên đầu.' },
  zebra: { name: 'Ngựa vằn', make: () => quad({ len: 1.6, leg: 0.95, bw: 0.52, bh: 0.58, neck: [0.7, 0.6], head: [0.28, 0.3, 0.55], col: '#f4f2ea', col2: '#2a2630', mane: '#1b1626', ears: [0.1, 0.22], tail: 0.6, stripes: 1 }), speed: 14, fact: 'Mỗi con ngựa vằn có bộ sọc riêng, không con nào giống con nào, như vân tay của người.' },
  camel: { name: 'Lạc đà', make: () => quad({ len: 1.8, leg: 1.25, bw: 0.6, bh: 0.65, neck: [1.0, 0.95], nw: 0.25, head: [0.3, 0.3, 0.55], col: '#c99a5a', col2: '#a87a40', ears: [0.08, 0.14], tail: 0.5, hump: [0.15], saddleUp: 0.25, saddleZ: -0.25 }), speed: 9, fact: 'Bướu lạc đà chứa mỡ chứ không chứa nước; lạc đà có thể nhịn uống nước cả tuần.' },
  elephant: { name: 'Voi', make: () => quad({ len: 2.4, leg: 1.2, bw: 1.3, bh: 1.3, neck: [0.3, 1.2], nw: 0.9, head: [1.0, 1.0, 0.8], col: '#8c8c96', col2: '#7a7a84', ears: [0.7, 0.8], tail: 0.6, trunk: 1.3, tusk: 1, lw: 0.4, hoof: '#6a6a74' }), speed: 6.5, fact: 'Voi là loài thú trên cạn lớn nhất; vòi voi có khoảng 40.000 bó cơ.' },
  buffalo: { name: 'Trâu', make: () => quad({ len: 1.9, leg: 0.8, bw: 0.85, bh: 0.75, neck: [0.4, 1.0], nw: 0.55, head: [0.45, 0.4, 0.6], col: '#4a4650', col2: '#3a3640', ears: [0.14, 0.1], tail: 0.6, horns: 0.6, lw: 0.2 }), speed: 7, fact: 'Trâu là bạn của nhà nông Việt Nam: "Con trâu là đầu cơ nghiệp".' },
  ostrich: { name: 'Đà điểu', make: ostrich, speed: 17, fact: 'Đà điểu là loài chim lớn nhất, không bay được nhưng chạy nhanh tới 70 km/h.' },
};

export function createMounts(ctx) {
  const V = ctx.vehicles, pl = ctx.player, { terrain, scene } = ctx, sup = V.sup;
  const list = [];
  const ok = (x, z) => terrain.heightAt(x, z) > 1.3 && terrain.slopeAt(x, z) < 0.8;
  function spawn(kind, x, z) {
    const K = KINDS[kind], m = K.make();
    const v = { type: 'mount', kind, name: K.name, group: m.group, m, home: [x, z], tgt: null, wait: Math.random() * 3, phase: 0, rot: Math.random() * 6.28, r: 3,
      label: `🐎 Cưỡi ${K.name}`, bye: `🚶 Xuống ${K.name.toLowerCase()}`, side: 1.6,
      hello: `🐾 Cưỡi <b>${K.name}</b>! ${K.fact}<br><small><b>Shift</b> phi nhanh · <b>E</b> xuống</small>`,
      mode: { speed: K.speed, boost: 1.45, turn: 3.2, accel: 2, anim: 'drive', seat: m.back - 0.12, seatZ: m.saddleZ - 0.05, camAdd: m.back > 2 ? 3 : 1.5 },
      tick(dt, sp, st) { gait(v, dt, sp); pl.root.rotation.z = st.lean * 0.4; } };
    v.label = (kind === 'ostrich' ? '🪶' : kind === 'elephant' ? '🐘' : kind === 'camel' ? '🐫' : kind === 'buffalo' ? '🐃' : kind === 'zebra' ? '🦓' : '🐎') + ' Cưỡi ' + K.name;
    m.group.position.set(x, sup(x, z), z); V.register(v); list.push(v); return v;
  }
  function gait(v, dt, sp) {
    const m = v.m; v.phase += dt * (2 + sp * 1.1);
    const a = Math.min(0.75, sp * 0.09), s = Math.sin(v.phase);
    if (m.biped) { m.legs[0].rotation.x = s * a * 1.2; m.legs[1].rotation.x = -s * a * 1.2; }
    else { m.legs[0].rotation.x = m.legs[3].rotation.x = s * a; m.legs[1].rotation.x = m.legs[2].rotation.x = -s * a; }
    m.body.position.y = Math.abs(Math.cos(v.phase)) * Math.min(0.12, sp * 0.012);
  }
  // rải thú trên đảo
  const place = (kind, ang, r) => { for (let k = 0; k < 40; k++) { const a = ang + (k % 7) * 0.12, rr = r + Math.floor(k / 7) * 3, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (ok(x, z)) return spawn(kind, x, z); } };
  place('horse', 0.3, 22); place('horse2', 0.45, 24); place('zebra', 1.0, 30); place('camel', 2.2, 40); place('ostrich', 2.6, 34); place('elephant', 3.8, 30); place('buffalo', 4.6, 26); place('horse', 5.4, 28);

  // ---------- Phượng hoàng ----------
  const pm = phoenix();
  const ph = { type: 'phoenix', name: 'Phượng hoàng', group: pm.group, m: pm, r: 4, far: 200, phase: 0, side: 2,
    label: ICON.phoenix + ' Cưỡi phượng hoàng', bye: ICON.phoenix + ' Xuống phượng hoàng',
    hello: `${ICON.phoenix} Bay cùng <b>phượng hoàng</b> khắp thế giới! <b>Space/⬆</b> bay lên · <b>C/⬇</b> hạ xuống · <b>Shift</b> lao nhanh · <b>M</b> xem bản đồ<br><small>Phượng hoàng là linh vật trong truyền thuyết Việt Nam, tượng trưng cho điều tốt lành.</small>`,
    mode: { speed: 16, boost: 1.8, turn: 2.2, accel: 1.4, fly: true, climb: 9, lift: 0, maxAlt: 110, anim: 'drive', seat: pm.back - 0.2, seatZ: 0.1, camAdd: 5 }, takeoff: 1.2,
    tick(dt, sp, st) {
      const air = !st.grounded; ph.phase += dt * (air ? (st.lift > 1 ? 9 : st.fast ? 7 : 3.2 + sp * 0.1) : 2);
      const flap = air ? Math.sin(ph.phase) * (st.lift > 1 ? 0.75 : 0.45) : 0;
      pm.wings[0].rotation.z = air ? flap : 1.1; pm.wings[1].rotation.z = air ? -flap : -1.1;
      pm.wings[0].rotation.y = air ? 0 : -0.9; pm.wings[1].rotation.y = air ? 0 : 0.9;
      pm.body.position.y = air ? -Math.sin(ph.phase) * 0.1 : 0;
      for (const L of pm.legs) L.rotation.x = air ? 0.9 : Math.sin(ph.phase * 2) * Math.min(0.6, sp * 0.1);
      pl.root.rotation.z = st.lean * 1.2; pl.root.rotation.x = THREE.MathUtils.clamp(-pl.vy * 0.04, -0.35, 0.35);
      if (air && (ph.fire -= dt) <= 0) { ph.fire = 0.03; ember(); }
    }, fire: 0 };
  const home = () => { for (let k = 0; k < 30; k++) { const x = 10 + k * 0.7, z = -4; if (ok(x, z)) return [x, z]; } return [8, 6]; };
  { const [x, z] = home(); pm.group.position.set(x, sup(x, z), z); pm.group.rotation.y = -1.2; V.register(ph); fold(); }
  function fold() { pm.wings[0].rotation.set(0, -0.9, 1.1); pm.wings[1].rotation.set(0, 0.9, -1.1); for (const L of pm.legs) L.rotation.x = 0; pm.body.position.y = 0; }
  ph.onDismount = fold;
  // tàn lửa bay sau phượng hoàng
  const NE = 70, eg = new THREE.BufferGeometry(), ep = new Float32Array(NE * 3), el = new Float32Array(NE); let ei = 0;
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); eg.setAttribute('life', new THREE.BufferAttribute(el, 1));
  const embers = new THREE.Points(eg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float life; varying float vL; void main(){ vL = life; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = life * 260. / -mv.z * step(0.001, life); }',
    fragmentShader: 'varying float vL; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(1., .45+vL*.45, .1, smoothstep(.5,.1,d)*vL); }' }));
  embers.frustumCulled = false; scene.add(embers);
  const ember = () => { const i = ei++ % NE, r = pl.rot, p = pl.pos; ep.set([p.x - Math.sin(r) * 2.2 + (Math.random() - .5) * 0.8, p.y + 1.2 + (Math.random() - .5) * 0.6, p.z - Math.cos(r) * 2.2 + (Math.random() - .5) * 0.8], i * 3); el[i] = 1; eg.attributes.position.needsUpdate = true; };
  // gọi phượng hoàng bay đến bên mình
  function summon() {
    if (V.current) { if (V.current === ph) V.dismount(); return; }
    if (pl.frozen) return;
    const d = Math.hypot(pm.group.position.x - pl.pos.x, pm.group.position.z - pl.pos.z);
    if (d > 4) { const r = pl.rot + Math.PI / 2, x = pl.pos.x + Math.sin(r) * 2.5, z = pl.pos.z + Math.cos(r) * 2.5; pm.group.position.set(x, Math.max(sup(x, z), pl.pos.y), z); pm.group.rotation.y = pl.rot; for (let k = 0; k < 25; k++) { const i = ei++ % NE; ep.set([x + (Math.random() - .5) * 3, pl.pos.y + Math.random() * 3, z + (Math.random() - .5) * 3], i * 3); el[i] = 1; } eg.attributes.position.needsUpdate = true; ctx.sfx('burner'); }
    V.mount(ph);
  }
  addEventListener('keydown', e => { if (!e.repeat && e.code === 'KeyP' && !ctx.freeCam && !ctx.mapOpen && !document.body.classList.contains('rs-modal')) summon(); });
  document.getElementById('bPhoenix').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); summon(); });

  // ---------- Cưỡi mọi thú trên đảo (animals.js) ----------
  const known = new Set();
  function adopt(A) {
    known.add(A);
    const S = A.S, H = S.id === 'animal-deer' ? 1.7 : 1.35, k = H / S.size;
    const v = { type: 'animal', A, name: S.name, group: A.root, r: 2.6 * Math.max(1, S.size), side: 1.5, label: `🐾 Cưỡi ${S.name}`, bye: `🚶 Xuống ${S.name.toLowerCase()}`,
      hello: `🐾 Phép thuật! <b>${S.name}</b> to ra để bạn cưỡi. ${S.fact}<br><small><b>Shift</b> chạy nhanh · <b>E</b> xuống</small>`,
      mode: { speed: 8 + S.speed * 2, boost: 1.4, turn: 3.5, accel: 2.2, anim: 'drive', seat: H * 0.6 - 0.15, seatZ: -0.05, camAdd: 1.5 },
      onMount() { A.ridden = true; v.s0 = A.root.scale.x; grow = { v, t: 0, from: 1, to: k }; ctx.sfx('ok'); },
      onDismount() { grow = { v, t: 0, from: A.root.scale.x, to: 1 }; A.rot = pl.rot; A.target = null; A.wait = 3; A.ridden = false; },
      tick(dt, sp) { A.anim.play(sp > 6 ? S.run : sp > 0.4 ? S.walk : S.idle[0], 0.2); A.anim.update(dt * Math.max(1, sp / 5)); } };
    V.register(v);
  }
  let grow = null;

  // ---------- Thú đi lang thang khi không ai cưỡi ----------
  function update(dt) {
    const p = pl.pos, cur = V.current;
    for (const A of (ctx.animals && ctx.animals.list) || []) if (!known.has(A)) adopt(A);
    if (grow) { grow.t = Math.min(1, grow.t + dt * 2.5); const e = grow.t * grow.t * (3 - 2 * grow.t); grow.v.group.scale.setScalar(grow.from + (grow.to - grow.from) * e); if (grow.t >= 1) grow = null; }
    for (let i = 0; i < NE; i++) if (el[i] > 0) { el[i] = Math.max(0, el[i] - dt * 1.3); ep[i * 3 + 1] += dt * 0.6; }
    eg.attributes.life.needsUpdate = true;
    for (const v of list) {
      if (v === cur || !v.group.visible) continue;
      const g = v.group;
      if (!v.tgt) { if ((v.wait -= dt) <= 0) { const a = Math.random() * 6.28, r = 2 + Math.random() * 8, x = v.home[0] + Math.cos(a) * r, z = v.home[1] + Math.sin(a) * r; if (ok(x, z)) v.tgt = [x, z]; else v.wait = 0.5; } gait(v, dt, 0); }
      else {
        const dx = v.tgt[0] - g.position.x, dz = v.tgt[1] - g.position.z, L = Math.hypot(dx, dz);
        if (L < 0.4) { v.tgt = null; v.wait = 3 + Math.random() * 6; }
        else { let dr = Math.atan2(dx, dz) - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); g.rotation.y += dr * Math.min(1, dt * 3); const st = Math.min(L, 1.3 * dt); g.position.x += Math.sin(g.rotation.y) * st; g.position.z += Math.cos(g.rotation.y) * st; gait(v, dt, 1.3); }
      }
      g.position.y = sup(g.position.x, g.position.z);
    }
    // phượng hoàng đứng chờ: vẫy cánh nhẹ
    if (cur !== ph && pm.group.visible) { ph.phase += dt; pm.body.position.y = Math.sin(ph.phase * 1.5) * 0.03; }
  }
  return { update, list, phoenix: ph, summon, KINDS };
}
