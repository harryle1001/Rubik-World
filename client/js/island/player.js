// player.js — Nhân vật: chạy/nhảy, camera bám sau lưng mượt, joystick cảm ứng, bụi bay khi chạy.
// Phím: WASD/mũi tên · Shift chạy · Space nhảy · kéo chuột/vuốt nửa phải màn hình xoay camera.
import * as THREE from 'three';
import { CFG } from './config.js';
import { toon, addOutline } from './style.js';
import { loadHero, driveHero, emote } from './characters.js';

const P = CFG.player, C = CFG.camera;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function makeHero(hue = 128) {
  const shirt = new THREE.Color().setHSL(hue / 360, 0.4, 0.4).getStyle();
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const part = (geo, col, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, toon(col)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const limb = (x, y, len, col) => { const g = new THREE.Group(); g.position.set(x, y, 0); body.add(g); part(new THREE.CapsuleGeometry(0.11, len, 3, 8), col, 0, -len / 2 - 0.05, 0, g); return g; };
  part(new THREE.CapsuleGeometry(0.3, 0.45, 4, 10), shirt, 0, 1.05, 0);              // áo xanh lá kiểu hiệp sĩ
  part(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), '#6b4a2b', 0, 0.9, 0);           // thắt lưng
  part(new THREE.SphereGeometry(0.32, 16, 12), '#f2c9a0', 0, 1.72, 0);                    // đầu
  part(new THREE.SphereGeometry(0.33, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#e8b84a', 0, 1.76, -0.03); // tóc vàng
  const hat = part(new THREE.ConeGeometry(0.3, 0.75, 10), shirt, 0, 2.1, -0.12); hat.rotation.x = -0.5; // mũ nhọn
  for (const s of [-1, 1]) part(new THREE.SphereGeometry(0.045, 6, 6), '#1b1626', s * 0.11, 1.75, 0.29);
  part(new THREE.BoxGeometry(0.34, 0.42, 0.12), '#8a5a34', 0, 1.15, -0.32);                // khiên gỗ sau lưng
  const legL = limb(-0.14, 0.72, 0.42, '#6b4a2b'), legR = limb(0.14, 0.72, 0.42, '#6b4a2b');
  const armL = limb(-0.38, 1.32, 0.38, '#f2c9a0'), armR = limb(0.38, 1.32, 0.38, '#f2c9a0');
  addOutline(root);
  return { root, body, legL, legR, armL, armR };
}

export function createPlayer(ctx) {
  const { scene, camera, terrain, renderer } = ctx;
  const h = makeHero(ctx.hue); scene.add(h.root);
  const pos = new THREE.Vector3(0, 0, 10); pos.y = terrain.heightAt(pos.x, pos.z);
  const vel = new THREE.Vector3(); let vy = 0, grounded = true, rot = Math.PI, phase = 0;
  const cam = { yaw: 0, pitch: C.pitch, dist: C.distance, drag: -9 };
  const keys = new Set(), input = { x: 0, z: 0, run: false, jump: false };
  addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Space') input.jump = true; });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear()); // đổi cửa sổ: không bị kẹt phím

  // ---- Joystick (nửa trái) + xoay camera (nửa phải / chuột) ----
  const el = renderer.domElement, joy = document.getElementById('joy'), knob = document.getElementById('knob');
  let jid = null, jx = 0, jy = 0; const drags = new Map();
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && jid === null) { jid = e.pointerId; jx = e.clientX; jy = e.clientY; joy.style.cssText = `left:${jx}px;top:${jy}px;opacity:1`; return; }
    drags.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId === jid) { let dx = e.clientX - jx, dy = e.clientY - jy; const L = Math.hypot(dx, dy), R = 50; if (L > R) { dx *= R / L; dy *= R / L; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / R; input.z = dy / R; return; }
    const d = drags.get(e.pointerId); if (!d) return;
    cam.yaw -= (e.clientX - d.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - d.y) * 0.004, 0.05, 1.2); d.x = e.clientX; d.y = e.clientY; cam.drag = performance.now();
  });
  const up = e => { if (e.pointerId === jid) { jid = null; input.x = input.z = 0; joy.style.opacity = 0; knob.style.transform = ''; } drags.delete(e.pointerId); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, 4, 16); }, { passive: true });
  const hold = (id, k) => { const b = document.getElementById(id); if (!b) return; b.addEventListener('pointerdown', e => { e.preventDefault(); input[k] = true; }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { if (k === 'run') input.run = false; }); };
  hold('bJump', 'jump'); hold('bRun', 'run');

  // ---- Bụi bay khi chạy/tiếp đất ----
  const NDust = 40, dg = new THREE.BufferGeometry(), dp = new Float32Array(NDust * 3), dl = new Float32Array(NDust);
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('life', new THREE.BufferAttribute(dl, 1));
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'attribute float life; varying float vL; void main(){ vL = life; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (1.-life*0.5) * 260. / -mv.z * step(0.001, life); }',
    fragmentShader: 'varying float vL; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(0.92,0.86,0.72, smoothstep(.5,.2,d)*vL*0.7); }' }));
  dust.frustumCulled = false; scene.add(dust); const dv = []; let di = 0, dustT = 0;
  for (let i = 0; i < NDust; i++) dv.push(new THREE.Vector3());
  const puff = (n, spread) => { for (let k = 0; k < n; k++) { const i = di++ % NDust; dp.set([pos.x + (Math.random() - .5) * 0.4, pos.y + 0.1, pos.z + (Math.random() - .5) * 0.4], i * 3); dl[i] = 1; dv[i].set((Math.random() - .5) * spread, 0.6 + Math.random() * 0.8, (Math.random() - .5) * spread); } };

  const self = { pos, cam, input, get rot() { return rot; }, frozen: false, speed: 0, root: h.root, get grounded() { return grounded; } };
  // Nhân vật KayKit có animation: nạp xong thì thay cho nhân vật dựng bằng khối
  let hero = null; const animState = {};
  loadHero(ctx.heroKind || 'student-male-a').then(r => { if (!r) return; hero = r; h.body.visible = false; h.root.add(r.model); r.anim.play(r.set.idle, 0); });
  self.emote = name => { if (hero) emote(hero, animState, name); };
  let stepT = 0, kx = 0, kz = 0;
  const want = new THREE.Vector3(), look = new THREE.Vector3(pos.x, pos.y + 1.5, pos.z), tmp = new THREE.Vector3();
  // Phương tiện (vehicles.js gán): self.vehicle = { speed, turn, accel, water, fly, lift, anim, seat, camAdd, maxAlt } hoặc null
  self.vehicle = null; self.vel = vel; self.setRot = r => { rot = r; };
  Object.defineProperty(self, 'hero', { get: () => hero });
  Object.defineProperty(self, 'vy', { get: () => vy, set: v => { vy = v; } });
  self.update = (dt) => {
    const V = self.vehicle;
    // phím WASD/mũi tên: tăng/giảm dần (mượt như cần analog), joystick cộng thêm
    let tx = 0, tz = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) tx -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) tx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) tz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) tz += 1;
    const tl = Math.hypot(tx, tz); if (tl > 1) { tx /= tl; tz /= tl; }
    const ks = 1 - Math.exp(-dt * (tl ? 9 : 12)); kx += (tx - kx) * ks; kz += (tz - kz) * ks; if (Math.abs(kx) < 0.01 && !tx) kx = 0; if (Math.abs(kz) < 0.01 && !tz) kz = 0;
    let ix = input.x + kx, iz = input.z + kz;
    const mag = self.frozen ? 0 : Math.min(1, Math.hypot(ix, iz)), n = Math.hypot(ix, iz) || 1;
    const running = input.run || keys.has('ShiftLeft') || keys.has('ShiftRight') || (input.x * input.x + input.z * input.z > 0.9);
    const sp = (V ? V.speed : running ? P.run : P.walk) * mag;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), mx = (Math.cos(cam.yaw) * ix - fx * iz) / n, mz = (-Math.sin(cam.yaw) * ix - fz * iz) / n;
    const k = 1 - Math.exp(-dt * (V ? V.accel : grounded ? 12 : 3));
    vel.x += (mx * sp - vel.x) * k; vel.z += (mz * sp - vel.z) * k; self.speed = Math.hypot(vel.x, vel.z);
    if (mag > 0.05) { let d = Math.atan2(mx, mz) - rot; d = Math.atan2(Math.sin(d), Math.cos(d)); rot += d * Math.min(1, dt * (V ? V.turn : 12)); }

    // di chuyển + va chạm cây/đá + không ra nước sâu
    let nx = pos.x + vel.x * dt, nz = pos.z + vel.z * dt;
    if (!V || !V.fly) for (const c of ctx.colliders) { const dx = nx - c.x, dz = nz - c.z, rr = c.r + 0.35, d2 = dx * dx + dz * dz; if (d2 < rr * rr && d2 < 100) { const d = Math.sqrt(d2) || 1e-3; nx = c.x + dx / d * rr; nz = c.z + dz / d * rr; } }
    // tường/nhà hình hộp (ctx.boxes: {x0,z0,x1,z1,top}) — đẩy ra theo cạnh gần nhất
    for (const b of (V && V.fly) ? [] : ctx.boxes || []) {
      const r = 0.35; if (nx < b.x0 - r || nx > b.x1 + r || nz < b.z0 - r || nz > b.z1 + r || pos.y > b.top) continue;
      const pl = nx - (b.x0 - r), pr = (b.x1 + r) - nx, pt = nz - (b.z0 - r), pb = (b.z1 + r) - nz, m = Math.min(pl, pr, pt, pb);
      if (m === pl) nx = b.x0 - r; else if (m === pr) nx = b.x1 + r; else if (m === pt) nz = b.z0 - r; else nz = b.z1 + r;
    }
    const sup = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, pos.y) : -99);
    if (V && V.water) { if (sup(nx, nz) > CFG.island.waterLevel - 0.3) { nx = pos.x; nz = pos.z; vel.multiplyScalar(0.3); } } // thuyền: chỉ đi trên nước
    else if (!(V && V.fly) && sup(nx, nz) < CFG.island.waterLevel - 0.7) { nx = pos.x; nz = pos.z; vel.set(0, 0, 0); }
    pos.x = nx; pos.z = nz;
    const g = Math.max(terrain.heightAt(pos.x, pos.z), ctx.groundExtra ? ctx.groundExtra(pos.x, pos.z, pos.y) : -99);
    if (input.jump && grounded && !self.frozen && !V) { vy = P.jump; grounded = false; ctx.sfx && ctx.sfx('jump'); }
    input.jump = false;
    if (V && V.water) { pos.y = V.waterY(pos.x, pos.z); vy = 0; grounded = true; }
    else if (V && V.fly) { // khinh khí cầu: bay lơ lửng, V.lift = tốc độ lên/xuống mong muốn
      vy += (V.lift - vy) * Math.min(1, dt * 1.5); pos.y = Math.min(V.maxAlt, pos.y + vy * dt);
      const floor = Math.max(g, CFG.island.waterLevel + 0.6); if (pos.y <= floor) { pos.y = floor; vy = Math.max(0, vy); grounded = g >= floor - 0.01; } else grounded = false;
    } else {
    vy -= P.gravity * dt; pos.y += vy * dt;
    if (pos.y <= g) { if (!grounded && vy < -6) { puff(8, 2.5); ctx.sfx && ctx.sfx('land'); } pos.y = g; vy = 0; grounded = true; } else if (pos.y > g + 0.3) grounded = false;
    }

    // animation KayKit + tiếng bước chân
    if (hero) { if (V) { if (!animState.oneShot || animState.oneShot.until < performance.now()) hero.anim.play(V.anim, 0.25); hero.model.position.set(0, V.seat || 0, V.seatZ || 0); } else { hero.model.position.set(0, 0, 0); driveHero(hero, { speed: self.speed, grounded, walk: P.walk, oneShot: animState.oneShot }); } hero.anim.update(dt); }
    if (!V && grounded && self.speed > 0.8 && (stepT -= dt) <= 0) { stepT = self.speed > P.walk * 1.1 ? 0.3 : 0.42; ctx.sfx && ctx.sfx('step'); }
    // dáng chạy (nhân vật dựng bằng khối, dùng khi chưa nạp xong model)
    phase += dt * self.speed * 2.1;
    const a = Math.min(1, self.speed / P.walk) * (running ? 1.0 : 0.7);
    h.root.position.copy(pos); h.root.rotation.y = rot;
    h.legL.rotation.x = Math.sin(phase) * a; h.legR.rotation.x = -Math.sin(phase) * a;
    h.armL.rotation.x = -Math.sin(phase) * a; h.armR.rotation.x = Math.sin(phase) * a;
    h.body.position.y = Math.abs(Math.cos(phase)) * 0.08 * a; h.body.rotation.x = running ? 0.15 * a : 0;
    if (!grounded) { h.legL.rotation.x = -0.7; h.legR.rotation.x = 0.4; h.armL.rotation.z = -0.8; h.armR.rotation.z = 0.8; } else { h.armL.rotation.z = h.armR.rotation.z = 0; }
    if (!V && grounded && self.speed > P.walk * 1.1 && (dustT += dt) > 0.06) { dustT = 0; puff(1, 0.6); }
    for (let i = 0; i < NDust; i++) if (dl[i] > 0) { dl[i] = Math.max(0, dl[i] - dt * 1.4); dp[i * 3] += dv[i].x * dt; dp[i * 3 + 1] += dv[i].y * dt; dp[i * 3 + 2] += dv[i].z * dt; }
    dg.attributes.position.needsUpdate = dg.attributes.life.needsUpdate = true;

    // camera bám sau lưng, tự xoay theo hướng chạy khi người chơi không kéo
    if (mag > 0.2 && performance.now() - cam.drag > 1500 && -iz > 0.2) { let d = rot + Math.PI - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.yaw += d * Math.min(1, dt * 1.2); }
    const cp = Math.cos(cam.pitch);
    const cd = cam.dist + (V ? V.camAdd || 0 : 0); want.set(pos.x + Math.sin(cam.yaw) * cd * cp, pos.y + C.height + Math.sin(cam.pitch) * cd, pos.z + Math.cos(cam.yaw) * cd * cp);
    // không cho camera chui vào tán cây: kéo camera lại gần nhân vật nếu vướng
    const cx0 = pos.x, ty = pos.y + C.height, cz0 = pos.z;
    for (const f of [1, 0.85, 0.7, 0.55, 0.4]) {
      const cx = cx0 + (want.x - cx0) * f, cy = ty + (want.y - ty) * f, cz = cz0 + (want.z - cz0) * f; let hit = false;
      for (const c of ctx.colliders) { const dx = cx - c.x, dz = cz - c.z; if (dx * dx + dz * dz < (c.r * 3.4 + 0.3) ** 2 && cy < terrain.heightAt(c.x, c.z) + 5.5) { hit = true; break; } }
      if (!hit || f === 0.4) { want.set(cx, cy, cz); break; }
    }
    want.y = Math.max(want.y, terrain.heightAt(want.x, want.z) + 0.8, (ctx.groundExtra ? ctx.groundExtra(want.x, want.z, 99) : -99) + 0.8, CFG.island.waterLevel + 0.5);
    camera.position.lerp(want, 1 - Math.exp(-dt * C.follow));
    look.lerp(tmp.set(pos.x, pos.y + 1.4, pos.z), 1 - Math.exp(-dt * C.follow * 1.6)); camera.lookAt(look);
  };
  self.teleport = (x, z, y) => { pos.set(x, y ?? terrain.heightAt(x, z), z); vel.set(0, 0, 0); vy = 0; };
  return self;
}
