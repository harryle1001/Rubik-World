// props.js — ĐÈN ĐƯỜNG, GHẾ ĐÁ, BIỂN CHỈ ĐƯỜNG, HÀNG RÀO, XE ĐẠP.
// - Đèn tự đặt dọc mọi đường đi (khoảng cách: CONFIG.props.lampSpacing), trời tối thì sáng lên
// - Ghế đá: CONFIG.props.benchSpacing     - Hàng rào: CONFIG.fences     - Xe đạp: CONFIG.props.bikes
// - Hình chiếc xe đạp: makeBike()  (player.js dùng lại khi nhân vật đạp xe)
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Mesher, flatMat, textTexture } from './utils.js';

const _o = new THREE.Object3D();

export function makeBike(color = '#d8473a') {
  const m = new Mesher(), dark = '#2b2b30', metal = '#c9ccd2';
  for (const z of [-0.55, 0.55]) { m.add(new THREE.TorusGeometry(0.34, 0.045, 4, 12), dark, { p: [0, 0.36, z], r: [0, Math.PI / 2, 0] }); m.add(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 4), metal, { p: [0, 0.36, z], r: [Math.PI / 2, 0, 0] }); }
  const bar = (x1, y1, z1, x2, y2, z2, c = color, r = 0.035) => { const L = Math.hypot(x2 - x1, y2 - y1, z2 - z1); const g = new THREE.CylinderGeometry(r, r, L, 5); const mm = new THREE.Matrix4().lookAt(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(0, 1, 0)); const q = new THREE.Quaternion().setFromRotationMatrix(mm).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))); m.add(g, c, { m: new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2), q, new THREE.Vector3(1, 1, 1)) }); };
  bar(0, 0.36, -0.55, 0, 0.72, -0.1); bar(0, 0.72, -0.1, 0, 0.36, 0.05); bar(0, 0.36, 0.05, 0, 0.36, -0.55);
  bar(0, 0.72, -0.1, 0, 0.78, 0.45); bar(0, 0.36, 0.55, 0, 0.95, 0.42); bar(-0.28, 0.98, 0.42, 0.28, 0.98, 0.42, dark, 0.03);
  m.add(new THREE.BoxGeometry(0.16, 0.06, 0.28), dark, { p: [0, 0.8, -0.12] });
  m.add(new THREE.BoxGeometry(0.34, 0.2, 0.24), '#b07a45', { p: [0, 0.98, 0.6] }); // giỏ xe
  const mesh = new THREE.Mesh(m.geometry(), flatMat({ side: THREE.DoubleSide })); mesh.castShadow = true;
  return mesh;
}

export function createProps(ctx, world) {
  const { scene } = ctx; const W = CONFIG.world;
  const paths = world.layout.paths;
  const onLand = (x, z) => world.walkHeight(x, z) != null && world.bridgeHeight(x, z) == null && world.riverDist(x, z) > CONFIG.river.width * 0.5 + 2.5;

  // ---------- Đèn đường ----------
  const lamps = [];
  for (const p of paths) {
    const L = Math.hypot(p.bx - p.ax, p.bz - p.az), dx = (p.bx - p.ax) / L, dz = (p.bz - p.az) / L;
    for (let u = 4, k = 0; u < L - 2; u += CONFIG.props.lampSpacing, k++) {
      const s = k % 2 ? 1 : -1, x = p.ax + dx * u - dz * s * (W.pathWidth * 0.5 + 0.9), z = p.az + dz * u + dx * s * (W.pathWidth * 0.5 + 0.9);
      if (onLand(x, z)) lamps.push([x, world.groundAt(x, z), z, Math.atan2(dz * s, -dx * s)]);
    }
  }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; lamps.push([Math.cos(a) * (W.plazaRadius + 0.4), 0, Math.sin(a) * (W.plazaRadius + 0.4), a + Math.PI]); }
  {
    const m = new Mesher(), metal = '#3c3f46';
    m.add(new THREE.CylinderGeometry(0.22, 0.28, 0.3, 6), '#7f7a72', { p: [0, 0.15, 0] });
    m.add(new THREE.CylinderGeometry(0.07, 0.1, 3.4, 6), metal, { p: [0, 1.9, 0] });
    m.add(new THREE.BoxGeometry(0.08, 0.08, 0.7), metal, { p: [0, 3.55, 0.3] });
    m.add(new THREE.ConeGeometry(0.32, 0.3, 4), metal, { p: [0, 3.55, 0.62], r: [0, Math.PI / 4, 0] });
    const posts = new THREE.InstancedMesh(m.geometry(), flatMat(), lamps.length); posts.castShadow = true;
    const bm = new Mesher(); bm.add(new THREE.BoxGeometry(0.3, 0.36, 0.3), '#ffffff', { p: [0, 3.22, 0.62] });
    const bulbMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: '#fff3c4' });
    const bulbs = new THREE.InstancedMesh(bm.geometry(), bulbMat, lamps.length);
    // quầng sáng (Points cộng màu) + vũng sáng dưới đất
    const gp = new Float32Array(lamps.length * 3);
    const pool = new THREE.InstancedMesh(new THREE.CircleGeometry(3.2, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: radialTex() }), lamps.length);
    lamps.forEach(([x, y, z, r], i) => {
      _o.position.set(x, y, z); _o.rotation.set(0, r, 0); _o.scale.setScalar(1); _o.updateMatrix(); posts.setMatrixAt(i, _o.matrix); bulbs.setMatrixAt(i, _o.matrix);
      const bx = x + Math.sin(r) * 0.62, bz = z + Math.cos(r) * 0.62; gp.set([bx, y + 3.2, bz], i * 3);
      _o.position.set(bx, world.groundAt(bx, bz) + 0.06, bz); _o.rotation.set(0, 0, 0); _o.updateMatrix(); pool.setMatrixAt(i, _o.matrix);
    });
    [posts, bulbs, pool].forEach(o => { o.computeBoundingSphere(); scene.add(o); });
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const glowMat = new THREE.PointsMaterial({ size: 3.2, map: radialTex(), color: '#ffd889', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Points(gg, glowMat); scene.add(glow);
    ctx.lampsFx = { bulbMat, glowMat, pool: pool.material };
    for (const [x, , z] of lamps) ctx.colliders.push({ x, z, r: 0.25 });
  }

  // ---------- Ghế đá ----------
  const benches = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.55; benches.push([Math.cos(a) * (W.plazaRadius - 2.2), 0, Math.sin(a) * (W.plazaRadius - 2.2), Math.atan2(-Math.cos(a), -Math.sin(a))]); }
  for (const p of paths) {
    const L = Math.hypot(p.bx - p.ax, p.bz - p.az), dx = (p.bx - p.ax) / L, dz = (p.bz - p.az) / L;
    for (let u = CONFIG.props.benchSpacing * 0.6; u < L - 4; u += CONFIG.props.benchSpacing) {
      const x = p.ax + dx * u + dz * (W.pathWidth * 0.5 + 1.2), z = p.az + dz * u - dx * (W.pathWidth * 0.5 + 1.2);
      if (onLand(x, z)) benches.push([x, world.groundAt(x, z), z, Math.atan2(-dz, dx)]);
    }
  }
  {
    const m = new Mesher(), st = '#bdb5a6', st2 = '#a39b8c';
    for (const x of [-0.7, 0.7]) m.add(new THREE.BoxGeometry(0.25, 0.45, 0.5), st2, { p: [x, 0.22, 0] });
    m.add(new THREE.BoxGeometry(1.9, 0.14, 0.62), st, { p: [0, 0.5, 0] });
    m.add(new THREE.BoxGeometry(1.9, 0.5, 0.12), st, { p: [0, 0.85, -0.3], r: [-0.15, 0, 0] });
    const im = new THREE.InstancedMesh(m.geometry(), flatMat(), benches.length); im.castShadow = im.receiveShadow = true;
    benches.forEach(([x, y, z, r], i) => { _o.position.set(x, y, z); _o.rotation.set(0, r, 0); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); ctx.colliders.push({ x, z, r: 0.7 }); });
    im.computeBoundingSphere(); scene.add(im);
  }

  // ---------- Biển chỉ đường (ở quảng trường + đầu mỗi lối) ----------
  {
    const postM = new Mesher(); const wood = '#7a5232';
    const boardGeo = new THREE.BoxGeometry(2.3, 0.5, 0.08), edge = new THREE.MeshLambertMaterial({ color: '#6b4a2b' });
    const sign = (x, z, list) => {
      const y = world.groundAt(x, z);
      postM.add(new THREE.CylinderGeometry(0.09, 0.11, 2.9 + list.length * 0.1, 6), wood, { p: [x, y + 1.45, z] });
      list.forEach(([text, ang], i) => {
        const tex = t => new THREE.MeshLambertMaterial({ map: textTexture(t, { w: 320, h: 70, font: 'bold 30px system-ui, sans-serif' }) });
        const b = new THREE.Mesh(boardGeo, [edge, edge, edge, edge, tex(text + ' ›'), tex('‹ ' + text)]);
        b.position.set(x + Math.sin(ang) * 1.05, y + 2.55 - i * 0.58, z + Math.cos(ang) * 1.05); b.rotation.y = ang - Math.PI / 2; b.castShadow = true; scene.add(b);
      });
      ctx.colliders.push({ x, z, r: 0.25 });
    };
    const areas = world.layout.areas;
    sign(4.5, 6.5, areas.slice(0, 4).map(a => [a.name, Math.atan2(a.x - 4.5, a.z - 6.5)]));
    sign(-4.5, -6.5, areas.slice(4).map(a => [a.name, Math.atan2(a.x + 4.5, a.z + 6.5)]));
    for (const a of areas) { const x = a.portal.x + a.fz * 2.8 + a.fx * 3, z = a.portal.z - a.fx * 2.8 + a.fz * 3; sign(x, z, [[a.name, Math.atan2(a.x - x, a.z - z)]]); }
    const mesh = new THREE.Mesh(postM.geometry(), flatMat()); mesh.castShadow = true; scene.add(mesh);
  }

  // ---------- Hàng rào ----------
  {
    const posts = [], rails = [];
    for (const line of CONFIG.fences) for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i], [bx, bz] = line[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2));
      for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n; if (world.walkHeight(x, z) != null) posts.push([x, world.groundAt(x, z), z]); }
      for (let k = 0; k < n; k++) { const x0 = ax + (bx - ax) * k / n, z0 = az + (bz - az) * k / n, x1 = ax + (bx - ax) * (k + 1) / n, z1 = az + (bz - az) * (k + 1) / n; const y0 = world.groundAt(x0, z0), y1 = world.groundAt(x1, z1); rails.push([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0), Math.hypot(x1 - x0, z1 - z0), Math.atan2(y1 - y0, Math.hypot(x1 - x0, z1 - z0))]); }
      // va chạm dọc hàng rào
      for (let u = 0; u <= L; u += 0.8) ctx.colliders.push({ x: ax + (bx - ax) * u / L, z: az + (bz - az) * u / L, r: 0.35 });
    }
    const pm = new Mesher(); pm.add(new THREE.BoxGeometry(0.16, 1.1, 0.16), '#8a6a42', { p: [0, 0.55, 0] }); pm.add(new THREE.ConeGeometry(0.13, 0.18, 4), '#8a6a42', { p: [0, 1.19, 0], r: [0, Math.PI / 4, 0] });
    const rm = new Mesher(); for (const y of [0.45, 0.85]) rm.add(new THREE.BoxGeometry(0.07, 0.1, 1), '#a8824e', { p: [0, y, 0] });
    const P = new THREE.InstancedMesh(pm.geometry(), flatMat(), posts.length), Rr = new THREE.InstancedMesh(rm.geometry(), flatMat(), rails.length);
    posts.forEach(([x, y, z], i) => { _o.position.set(x, y, z); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); P.setMatrixAt(i, _o.matrix); });
    rails.forEach(([x, y, z, r, l, tilt], i) => { _o.position.set(x, y, z); _o.rotation.set(-tilt, r, 0, 'YXZ'); _o.scale.set(1, 1, l); _o.updateMatrix(); Rr.setMatrixAt(i, _o.matrix); });
    for (const o of [P, Rr]) { o.castShadow = true; o.computeBoundingSphere(); scene.add(o); }
  }

  // ---------- Xe đạp đỗ ven đường ----------
  const bikeColors = ['#d8473a', '#2f7fd0', '#f2b134', '#3fa36b', '#c45ab3'];
  const bikes = CONFIG.props.bikes.map(([x, z], i) => {
    const mesh = makeBike(bikeColors[i % bikeColors.length]);
    mesh.position.set(x, world.groundAt(x, z), z); mesh.rotation.set(0, i * 1.3, 0.12); scene.add(mesh);
    return { mesh, color: bikeColors[i % bikeColors.length], parked: true };
  });
  function nearestBike(p, maxD = 2.6) { let b = null, bd = maxD; for (const k of bikes) if (k.parked) { const d = k.mesh.position.distanceTo(p); if (d < bd) { bd = d; b = k; } } return b; }

  function update() {
    const n = world.state.night;
    const fx = ctx.lampsFx; fx.glowMat.opacity = n * 0.9; fx.pool.opacity = n * 0.55; fx.bulbMat.color.setRGB(0.55 + n * 0.9, 0.5 + n * 0.8, 0.4 + n * 0.5);
  }
  return { update, bikes, nearestBike };
}

let _rt = null;
function radialTex() {
  if (_rt) return _rt;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _rt = new THREE.CanvasTexture(c); return _rt;
}
