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
  el.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, 5, 28); }, { passive: true });
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
  let stepT = 0;
  const want = new THREE.Vector3(), look = new THREE.Vector3(pos.x, pos.y + 1.5, pos.z), tmp = new THREE.Vector3();
  // Phương tiện (vehicles.js gán): self.vehicle = { speed, turn, accel, water, fly, lift, anim, seat, camAdd, maxAlt } hoặc null
  self.vehicle = null; self.vel = vel; self.setRot = r => { rot = r; };
  Object.defineProperty(self, 'hero', { get: () => hero });
  Object.defineProperty(self, 'vy', { get: () => vy, set: v => { vy = v; } });
  self.update = (dt) => {
    const V = self.vehicle;
    let ix = input.x, iz = input.z;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    const mag = self.frozen ? 0 : Math.min(1, Math.hypot(ix, iz)), n = Math.hypot(ix, iz) || 1;
    const running = input.run || keys.has('ShiftLeft') || keys.has('ShiftRight') || (input.x * input.x + input.z * input.z > 0.9);
    const sp = (V ? V.speed : running ? P.run : P.walk) * mag;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), mx = (Math.cos(cam.yaw) * ix - fx * iz) / n, mz = (-Math.sin(cam.yaw) * ix - fz * iz) / n;
    const k = 1 - Math.exp(-dt * (V ? V.accel : grounded ? 12 : 3));
    vel.x += (mx * sp - vel.x) * k; vel.z += (mz * sp - vel.z) * k; self.speed = Math.hypot(vel.x, vel.z);
    if (mag > 0.05) { let d = Math.atan2(mx, mz) - rot; d = Math.atan2(Math.sin(d), Math.cos(d)); rot += d * Math.min(1, dt * (V ? V.turn : 12)); }

    // di chuyển + va chạm (phần vật lý — physics.js dựng lưới ctx.grid để tra nhanh vật cản gần)
    // chia nhỏ bước (≤ 0.25 m) để chạy nhanh/đi xe không xuyên tường mỏng; leo bậc ≤ STEP, vách cao hơn thì chặn
    const fly = V && V.fly, STEP = 1.1, BSTEP = 0.6, R0 = 0.35;
    const sup = (x, z, y) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);
    const near = (x, z) => ctx.grid ? ctx.grid.near(x, z) : { cols: ctx.colliders, boxes: ctx.boxes || [] };
    const ddx = vel.x * dt, ddz = vel.z * dt, ns = Math.max(1, Math.ceil(Math.hypot(ddx, ddz) / 0.25));
    for (let s = 0; s < ns; s++) {
      const ox = pos.x, oz = pos.z; let nx = ox + ddx / ns, nz = oz + ddz / ns;
      if (!fly) {
        const N = near(nx, nz);
        for (const c of N.cols) { const dx = nx - c.x, dz = nz - c.z, rr = c.r + R0, d2 = dx * dx + dz * dz; if (d2 < rr * rr) { const d = Math.sqrt(d2) || 1e-3; nx = c.x + dx / d * rr; nz = c.z + dz / d * rr; } }
        // tường/nhà hình hộp (ctx.boxes: {x0,z0,x1,z1,top}) — đẩy ra về phía vừa đi tới; hộp thấp (≤ BSTEP) thì bước lên được
        for (const b of N.boxes) {
          if (nx < b.x0 - R0 || nx > b.x1 + R0 || nz < b.z0 - R0 || nz > b.z1 + R0 || b.top <= pos.y + BSTEP) continue;
          const inX = ox > b.x0 - R0 && ox < b.x1 + R0, inZ = oz > b.z0 - R0 && oz < b.z1 + R0;
          let side; if (!inX) side = ox < b.x0 ? 0 : 1; else if (!inZ) side = oz < b.z0 ? 2 : 3;
          else { const a = [nx - (b.x0 - R0), (b.x1 + R0) - nx, nz - (b.z0 - R0), (b.z1 + R0) - nz]; side = a.indexOf(Math.min(...a)); }
          if (side === 0) nx = b.x0 - R0; else if (side === 1) nx = b.x1 + R0; else if (side === 2) nz = b.z0 - R0; else nz = b.z1 + R0;
        }
        // thùng gỗ (physics.js): chặn người chơi, bị đẩy đi theo khối lượng; đứng trên nóc thùng được
        if (ctx.physics) for (const b of ctx.physics.solid) { // hộp vuông (không xoay) – điểm gần nhất trên hộp
          const H = b.K.half, qx = Math.max(b.pos.x - H, Math.min(b.pos.x + H, nx)), qz = Math.max(b.pos.z - H, Math.min(b.pos.z + H, nz));
          const dx = nx - qx, dz = nz - qz, d = Math.hypot(dx, dz); if (d >= R0 || pos.y >= b.pos.y + b.K.r - 0.25 || pos.y + 1.6 < b.pos.y - b.K.r) continue;
          let ux, uz, pen; const ex = nx - b.pos.x, ez = nz - b.pos.z;
          if (d > 1e-4) { ux = dx / d; uz = dz / d; pen = R0 - d; } else if (Math.abs(ex) > Math.abs(ez)) { ux = Math.sign(ex) || 1; uz = 0; pen = R0 + H - Math.abs(ex); } else { ux = 0; uz = Math.sign(ez) || 1; pen = R0 + H - Math.abs(ez); }
          const w = ctx.physics.push(b, -ux, -uz, pen, vel); nx += ux * pen * (1 - w); nz += uz * pen * (1 - w);
        }
        // vách đất quá cao so với chân → trượt dọc theo vách thay vì leo thẳng lên
        if (!(V && V.water)) { const lim = pos.y + STEP; if (sup(nx, nz, lim) > lim) { if (sup(nx, oz, lim) <= lim) nz = oz; else if (sup(ox, nz, lim) <= lim) nx = ox; else { nx = ox; nz = oz; } } }
      }
      if (V && V.water) { if (sup(nx, nz) > CFG.island.waterLevel - 0.3) { nx = ox; nz = oz; vel.multiplyScalar(0.3); } } // thuyền: chỉ đi trên nước
      else if (!fly && sup(nx, nz) < CFG.island.waterLevel - 0.7) { nx = ox; nz = oz; vel.set(0, 0, 0); }
      pos.x = nx; pos.z = nz;
    }
    // mặt đỡ: địa hình, sàn thị trấn, nóc hộp thấp đang đứng trên
    let g = sup(pos.x, pos.z, pos.y);
    if (!fly) for (const b of near(pos.x, pos.z).boxes) if (b.top <= pos.y + BSTEP && b.top > g && pos.x > b.x0 - 0.15 && pos.x < b.x1 + 0.15 && pos.z > b.z0 - 0.15 && pos.z < b.z1 + 0.15) g = b.top;
    if (!fly && ctx.physics) for (const b of ctx.physics.solid) { const t = b.pos.y + b.K.r - 0.02; if (t > g && pos.y >= t - 0.3 && Math.abs(pos.x - b.pos.x) < 0.5 && Math.abs(pos.z - b.pos.z) < 0.5) g = t; }
    if (input.jump && grounded && !self.frozen && !V) { vy = P.jump; grounded = false; ctx.sfx && ctx.sfx('jump'); }
    input.jump = false;
    if (V && V.water) { pos.y = V.waterY(pos.x, pos.z); vy = 0; grounded = true; }
    else if (V && V.fly) { // khinh khí cầu: bay lơ lửng, V.lift = tốc độ lên/xuống mong muốn
      vy += (V.lift - vy) * Math.min(1, dt * 1.5); pos.y = Math.min(V.maxAlt, pos.y + vy * dt);
      const floor = Math.max(g, CFG.island.waterLevel + 0.6); if (pos.y <= floor) { pos.y = floor; vy = Math.max(0, vy); grounded = g >= floor - 0.01; } else grounded = false;
    } else {
    vy -= P.gravity * dt; pos.y += vy * dt;
    if (pos.y <= g) {
      if (!grounded && vy < -6) { puff(8, 2.5); ctx.sfx && ctx.sfx('land'); }
      // bước lên bậc/dốc: nâng chân mượt thay vì giật (chỉ khi đang đứng đất và bậc thấp)
      const up = g - pos.y; pos.y = grounded && up > 0.12 && up < BSTEP ? pos.y + up * Math.min(1, dt * 22) : g; vy = 0; grounded = true;
    } else if (pos.y > g + (grounded && vy <= 0 ? 0.45 : 0.3)) grounded = false;
    else if (grounded && vy <= 0) { pos.y = g; vy = 0; } // xuống dốc/bậc: bám mặt đất, không "bay" lơ lửng
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
    const tx = pos.x, ty = pos.y + C.height, tz = pos.z;
    for (const f of [1, 0.85, 0.7, 0.55, 0.4]) {
      const cx = tx + (want.x - tx) * f, cy = ty + (want.y - ty) * f, cz = tz + (want.z - tz) * f; let hit = false;
      for (const c of ctx.colliders) { const dx = cx - c.x, dz = cz - c.z; if (dx * dx + dz * dz < (c.r * 3.4 + 0.3) ** 2 && cy < terrain.heightAt(c.x, c.z) + 5.5) { hit = true; break; } }
      if (!hit) for (const b of ctx.boxes || []) if (cx > b.x0 - 0.3 && cx < b.x1 + 0.3 && cz > b.z0 - 0.3 && cz < b.z1 + 0.3 && cy < b.top + 0.5) { hit = true; break; } // không cho camera chui vào nhà
      if (!hit || f === 0.4) { want.set(cx, cy, cz); break; }
    }
    want.y = Math.max(want.y, terrain.heightAt(want.x, want.z) + 0.8, (ctx.groundExtra ? ctx.groundExtra(want.x, want.z, 99) : -99) + 0.8, CFG.island.waterLevel + 0.5);
    camera.position.lerp(want, 1 - Math.exp(-dt * C.follow));
    look.lerp(tmp.set(pos.x, pos.y + 1.4, pos.z), 1 - Math.exp(-dt * C.follow * 1.6)); camera.lookAt(look);
  };
  self.teleport = (x, z, y) => { pos.set(x, y ?? terrain.heightAt(x, z), z); vel.set(0, 0, 0); vy = 0; };
  return self;
}
