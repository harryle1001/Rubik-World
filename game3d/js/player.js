// player.js — NHÂN VẬT, ĐIỀU KHIỂN (bàn phím, joystick ảo, kéo xoay camera), CAMERA BÁM THEO, ĐẠP XE.
// - Tốc độ đi/chạy/xe đạp: CONFIG.player       - Khoảng cách, độ cao, độ mượt camera: CONFIG.camera
// - Hình dáng & màu áo nhân vật: makeCharacter()  - Va chạm với nhà/cây/đá: collide()
// Phím: WASD/mũi tên đi · Shift chạy · Space nhảy · kéo chuột/vuốt bên phải màn hình để xoay camera · lăn chuột để zoom
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Mesher, flatMat, clamp, lerp } from './utils.js';
import { makeBike } from './props.js';

const P = CONFIG.player, CAM = CONFIG.camera;

function makeCharacter() {
  const root = new THREE.Group(), mat = flatMat();
  const part = (build, x, y, z) => { const m = new Mesher(); build(m); const mesh = new THREE.Mesh(m.geometry(), mat); mesh.castShadow = true; const g = new THREE.Group(); g.position.set(x, y, z); g.add(mesh); root.add(g); return g; };
  const skin = '#f2c9a0', shirt = '#f6f3ec', pants = '#2f4a7a', hair = '#2b2220';
  const legL = part(m => { m.add(new THREE.BoxGeometry(0.22, 0.72, 0.24), pants, { p: [0, -0.38, 0] }); m.add(new THREE.BoxGeometry(0.24, 0.14, 0.34), '#3a2a22', { p: [0, -0.78, 0.05] }); }, -0.15, 0.86, 0);
  const legR = part(m => { m.add(new THREE.BoxGeometry(0.22, 0.72, 0.24), pants, { p: [0, -0.38, 0] }); m.add(new THREE.BoxGeometry(0.24, 0.14, 0.34), '#3a2a22', { p: [0, -0.78, 0.05] }); }, 0.15, 0.86, 0);
  const body = part(m => {
    m.add(new THREE.BoxGeometry(0.62, 0.72, 0.36), shirt, { p: [0, 0.36, 0], top: '#ffffff' });
    m.add(new THREE.BoxGeometry(0.64, 0.12, 0.38), pants, { p: [0, 0.02, 0] });
    m.add(new THREE.ConeGeometry(0.16, 0.36, 3), '#d8332a', { p: [0, 0.5, 0.2], r: [Math.PI, 0, 0] }); // khăn quàng đỏ
    m.add(new THREE.BoxGeometry(0.4, 0.08, 0.1), '#d8332a', { p: [0, 0.7, 0.16] });
    m.add(new THREE.BoxGeometry(0.46, 0.52, 0.22), '#f0a23a', { p: [0, 0.38, -0.29], top: '#ffbf5a' }); // cặp sách
    m.add(new THREE.BoxGeometry(0.48, 0.2, 0.24), '#d9862a', { p: [0, 0.6, -0.29] });
  }, 0, 0.86, 0);
  const head = part(m => {
    m.add(new THREE.BoxGeometry(0.5, 0.48, 0.46), skin, { p: [0, 0.24, 0] });
    m.add(new THREE.BoxGeometry(0.54, 0.18, 0.5), hair, { p: [0, 0.5, -0.01] });
    m.add(new THREE.BoxGeometry(0.54, 0.34, 0.14), hair, { p: [0, 0.32, -0.2] });
    m.add(new THREE.BoxGeometry(0.2, 0.12, 0.12), hair, { p: [0.12, 0.42, 0.2] });
    for (const x of [-0.11, 0.11]) m.add(new THREE.BoxGeometry(0.07, 0.09, 0.02), '#1d1a1a', { p: [x, 0.25, 0.235] });
    m.add(new THREE.BoxGeometry(0.12, 0.03, 0.02), '#b5584a', { p: [0, 0.12, 0.235] });
    for (const x of [-0.18, 0.18]) m.add(new THREE.BoxGeometry(0.08, 0.05, 0.02), '#f2a0a0', { p: [x, 0.16, 0.232] });
  }, 0, 1.6, 0);
  const arm = s => part(m => { m.add(new THREE.BoxGeometry(0.17, 0.5, 0.2), shirt, { p: [0, -0.24, 0] }); m.add(new THREE.BoxGeometry(0.14, 0.16, 0.16), skin, { p: [0, -0.56, 0] }); }, s * 0.4, 1.5, 0);
  const armL = arm(-1), armR = arm(1);
  return { root, legL, legR, armL, armR, body, head };
}

export function createPlayer(ctx, world) {
  const ch = makeCharacter(); ctx.scene.add(ch.root);
  const pos = new THREE.Vector3(P.spawn[0], 0, P.spawn[1]); pos.y = world.groundAt(pos.x, pos.z);
  const vel = new THREE.Vector3(); let vy = 0, onGround = true;
  let rot = Math.PI, phase = 0;
  const cam = { yaw: 0, pitch: CAM.pitch, dist: CAM.distance, lastDrag: -10 };
  const input = { x: 0, z: 0, run: false, jump: false };
  const keys = new Set();
  let riding = null; const bikeMesh = makeBike(); bikeMesh.visible = false; ctx.scene.add(bikeMesh);
  const self = { pos, input, cam, frozen: false, get riding() { return riding; }, get rot() { return rot; }, speed: 0 };

  // ---------- Bàn phím ----------
  addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; keys.add(e.code); if (e.code === 'Space') input.jump = true; });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  // ---------- Cảm ứng / chuột: nửa trái = joystick, nửa phải (hoặc chuột) = xoay camera ----------
  const canvas = ctx.renderer.domElement, joy = document.getElementById('joy'), knob = document.getElementById('joyK');
  let joyId = null, joyX = 0, joyY = 0; const drags = new Map();
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && joyId === null && !ctx.buildMode) {
      joyId = e.pointerId; joyX = e.clientX; joyY = e.clientY;
      joy.style.left = joyX + 'px'; joy.style.top = joyY + 'px'; joy.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)';
      return;
    }
    drags.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId === joyId) {
      let dx = e.clientX - joyX, dy = e.clientY - joyY; const L = Math.hypot(dx, dy), R = 55;
      if (L > R) { dx *= R / L; dy *= R / L; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      input.x = dx / R; input.z = dy / R; input.run = L > R * 1.6 || input.runBtn;
      return;
    }
    const d = drags.get(e.pointerId); if (!d) return;
    if (drags.size === 2) { // chụm 2 ngón để zoom
      const [a, b] = [...drags.values()]; const before = Math.hypot(a.x - b.x, a.y - b.y);
      d.x = e.clientX; d.y = e.clientY; const after = Math.hypot(a.x - b.x, a.y - b.y);
      cam.dist = clamp(cam.dist * before / (after || 1), CAM.minDist, CAM.maxDist); return;
    }
    cam.yaw -= (e.clientX - d.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - d.y) * 0.004, 0.05, 1.25);
    d.x = e.clientX; d.y = e.clientY; cam.lastDrag = performance.now() / 1000;
  });
  const up = e => {
    if (e.pointerId === joyId) { joyId = null; input.x = input.z = 0; joy.classList.remove('on'); return; }
    const d = drags.get(e.pointerId); drags.delete(e.pointerId);
    if (d && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8 && performance.now() - d.t < 350 && ctx.onTap) ctx.onTap(e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, CAM.minDist, CAM.maxDist); e.preventDefault(); }, { passive: false });

  // ---------- Xe đạp ----------
  self.mount = bike => { riding = bike; bike.parked = false; bike.mesh.visible = false; bikeMesh.visible = true; bikeMesh.material = bike.mesh.material; bikeMesh.geometry = bike.mesh.geometry; ctx.sfx && ctx.sfx('bell'); };
  self.dismount = () => {
    if (!riding) return; const b = riding; riding = null; bikeMesh.visible = false;
    b.mesh.position.set(pos.x + Math.cos(rot) * 0.9, 0, pos.z - Math.sin(rot) * 0.9); b.mesh.position.y = world.groundAt(b.mesh.position.x, b.mesh.position.z);
    b.mesh.rotation.set(0, rot, 0.12); b.mesh.visible = true; b.parked = true;
  };

  // ---------- Va chạm ----------
  const pr = P.radius;
  function collide(p) {
    for (let pass = 0; pass < 2; pass++) for (const c of ctx.colliders) {
      if (c.off) continue;
      const dx = p.x - c.x, dz = p.z - c.z;
      if (c.r != null) {
        const rr = c.r + pr, d2 = dx * dx + dz * dz; if (d2 >= rr * rr || d2 > 400) continue;
        const d = Math.sqrt(d2) || 0.001; p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr;
      } else {
        if (dx * dx + dz * dz > (c.hw + c.hd + 2) ** 2) continue;
        const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
        const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; // về hệ toạ độ của nhà
        const qx = clamp(lx, -c.hw, c.hw), qz = clamp(lz, -c.hd, c.hd);
        let ex = lx - qx, ez = lz - qz, d = Math.hypot(ex, ez), nx = lx, nz = lz;
        if (d >= pr) continue;
        if (d < 1e-4) { const px = c.hw - Math.abs(lx), pz = c.hd - Math.abs(lz); if (px < pz) nx = Math.sign(lx || 1) * (c.hw + pr); else nz = Math.sign(lz || 1) * (c.hd + pr); }
        else { nx = qx + ex / d * pr; nz = qz + ez / d * pr; }
        p.x = c.x + nx * cs + nz * sn; p.z = c.z - nx * sn + nz * cs;
      }
    }
  }

  // ---------- Cập nhật mỗi khung hình ----------
  const camTarget = new THREE.Vector3(), desired = new THREE.Vector3(), next = new THREE.Vector3();
  self.update = (dt, t) => {
    // gom input
    let ix = input.x, iz = input.z;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    let mag = Math.min(1, Math.hypot(ix, iz)); if (self.frozen) mag = 0;
    const run = input.run || input.runBtn || keys.has('ShiftLeft') || keys.has('ShiftRight');
    const sp = P.walkSpeed * (riding ? P.bikeMul : run ? P.runMul : 1) * mag;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    const n = Math.hypot(ix, iz) || 1, mx = (rx * ix - fx * iz) / n, mz = (rz * ix - fz * iz) / n;
    const k = 1 - Math.exp(-dt * (riding ? 4 : 10));
    vel.x = lerp(vel.x, mx * sp, k); vel.z = lerp(vel.z, mz * sp, k);
    self.speed = Math.hypot(vel.x, vel.z);
    if (mag > 0.05) { const want = Math.atan2(mx, mz); let d = want - rot; d = Math.atan2(Math.sin(d), Math.cos(d)); rot += d * Math.min(1, dt * (riding ? 5 : P.turnSpeed)); }

    // di chuyển + va chạm + không xuống nước
    next.set(pos.x + vel.x * dt, pos.y, pos.z + vel.z * dt);
    collide(next);
    const R = Math.hypot(next.x, next.z); if (R > CONFIG.world.playRadius) { next.x *= CONFIG.world.playRadius / R; next.z *= CONFIG.world.playRadius / R; }
    const ground = (x, z) => { const h = world.walkHeight(x, z); if (h == null) return null; const b = ctx.blocks ? ctx.blocks.supportAt(x, z, pos.y) : null; if (b && b.blocked) return null; return b && b.top != null ? Math.max(h, b.top) : h; };
    let g = ground(next.x, next.z);
    if (g == null || g - pos.y > (riding ? 0.9 : 1.2)) { // thử trượt theo 1 trục
      const gx = ground(next.x, pos.z), gz = ground(pos.x, next.z);
      if (gx != null && gx - pos.y < 1.2) { next.z = pos.z; g = gx; } else if (gz != null && gz - pos.y < 1.2) { next.x = pos.x; g = gz; } else { next.x = pos.x; next.z = pos.z; g = ground(pos.x, pos.z) ?? pos.y; }
    }
    pos.x = next.x; pos.z = next.z;
    if (input.jump && onGround && !riding && !self.frozen) { vy = 7; onGround = false; }
    input.jump = false;
    vy -= 22 * dt; pos.y += vy * dt;
    if (pos.y <= g) { pos.y = g > pos.y + 0.6 ? lerp(pos.y, g, 0.5) : g; vy = 0; onGround = true; } else if (pos.y - g > 0.25) onGround = false;

    // dáng người: đi bộ / chạy / đạp xe
    ch.root.position.copy(pos); ch.root.rotation.y = rot;
    const moving = self.speed / P.walkSpeed;
    if (riding) {
      phase += dt * (2 + self.speed * 1.2);
      bikeMesh.position.copy(pos); bikeMesh.rotation.set(0, rot, Math.sin(t * 2) * 0.02);
      ch.root.position.y += 0.1; ch.root.position.x -= Math.sin(rot) * 0.15; ch.root.position.z -= Math.cos(rot) * 0.15;
      ch.legL.rotation.x = -1.1 + Math.sin(phase) * 0.55; ch.legR.rotation.x = -1.1 - Math.sin(phase) * 0.55;
      ch.armL.rotation.x = ch.armR.rotation.x = -1.15; ch.body.rotation.x = 0.25; ch.head.rotation.x = -0.15;
    } else {
      phase += dt * self.speed * 1.9;
      const amp = Math.min(1, moving) * (run ? 0.95 : 0.7);
      ch.legL.rotation.x = Math.sin(phase) * amp; ch.legR.rotation.x = -Math.sin(phase) * amp;
      ch.armL.rotation.x = -Math.sin(phase) * amp * 0.9; ch.armR.rotation.x = Math.sin(phase) * amp * 0.9;
      ch.body.rotation.x = run && moving > 0.5 ? 0.18 : 0.04 * moving; ch.head.rotation.x = 0;
      ch.root.position.y += Math.abs(Math.sin(phase)) * 0.07 * Math.min(1, moving) + (onGround ? 0 : 0);
      if (!onGround) { ch.legL.rotation.x = -0.6; ch.legR.rotation.x = 0.3; }
    }
    if (self.chopAnim > 0) { self.chopAnim -= dt; ch.armR.rotation.x = -2.4 + (1 - self.chopAnim / 0.5) * 2.6; }

    // camera bám theo mượt; tự xoay ra sau lưng khi đi tới (nếu người chơi không kéo camera)
    const now = performance.now() / 1000;
    if (mag > 0.2 && now - cam.lastDrag > 2.0 && -iz > 0.3) { let d = rot + Math.PI - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.yaw += d * Math.min(1, dt * 0.9); }
    camTarget.set(pos.x, pos.y + CAM.height, pos.z);
    const cp = Math.cos(cam.pitch);
    desired.set(camTarget.x + Math.sin(cam.yaw) * cam.dist * cp, camTarget.y + Math.sin(cam.pitch) * cam.dist, camTarget.z + Math.cos(cam.yaw) * cam.dist * cp);
    const gh = world.groundAt(desired.x, desired.z) + 0.7; if (desired.y < gh) desired.y = gh;
    const c = ctx.camera;
    if (!self._camInit) { c.position.copy(desired); self._camInit = true; }
    c.position.lerp(desired, 1 - Math.exp(-dt * CAM.follow));
    self.look = self.look || camTarget.clone(); self.look.lerp(camTarget, 1 - Math.exp(-dt * CAM.follow * 1.5));
    c.lookAt(self.look);
  };
  self.teleport = (x, z, face) => { pos.set(x, world.groundAt(x, z), z); vel.set(0, 0, 0); if (face != null) { rot = face; cam.yaw = face + Math.PI; } self._camInit = false; };
  return self;
}
