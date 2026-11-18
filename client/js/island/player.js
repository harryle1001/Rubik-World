// player.js — Nhân vật: chạy/nhảy, camera bám sau lưng mượt, joystick cảm ứng, bụi bay khi chạy.
// Phím: WASD/mũi tên · Shift chạy · Space nhảy · kéo chuột/vuốt nửa phải màn hình xoay camera.
import * as THREE from 'three';
import { CFG } from './config.js';
import { toon, addOutline } from './style.js';
import { loadHero, drivePlayer, emote, lookAtTarget } from './characters.js';
import { PHI } from './layout.js';
import { T, damp, dampAngle, dampV3, ease, wrapAngle } from './motion.js';
import { createCamOcclude } from './cam-occlude.js';

const P = CFG.player, C = CFG.camera;
// Camera thứ 3 theo φ (khu mẫu cổng trường): cách 13 m (Fibonacci), góc ngẩng atan(1/φ³) ≈ 13,3°, nhìn vào điểm cao φ² m trên chân
// → nhân vật nằm gần đường 1/3 dưới, cổng/mặt tiền chiếm dải 1/3 trên; FOV dọc 50° (ít méo hình hơn 55°); zoom 8…34 m (Fibonacci)
const CAM = { dist: 8.5, pitch: Math.atan(1 / PHI ** 3), height: PHI ** 2, min: 5, max: 34, lead: 1 / PHI ** 3, fov: 50 };
const ACC = PHI ** 4, DEC = PHI ** 5, AIR = PHI ** 2, TURN_MAX = 2 * Math.PI * PHI; // tăng tốc ≈6,9/s · hãm ≈11/s · xoay tối đa ≈10 rad/s
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
  // FOV dọc 50° cho màn ngang; màn dọc (điện thoại) mở rộng theo (1/tỷ lệ)^(1/φ), tối đa 72° (= 2 × 36°, góc ngũ giác vàng) → cổng không bị cắt hai bên
  const fitFov = () => { const a = innerWidth / innerHeight; camera.fov = a >= 1 ? CAM.fov : Math.min(72, 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2)) / a ** (1 / PHI)))); camera.updateProjectionMatrix(); };
  camera.far = CFG.view.far; fitFov(); addEventListener('resize', fitFov);   // cắt xa = nơi sương đặc hẳn
  const h = makeHero(ctx.hue); h.body.visible = false; scene.add(h.root);   // khối tạm chỉ hiện nếu nạp nhân vật học sinh lỗi (không còn cảnh đổi nhân vật lúc vào game)
  const pos = new THREE.Vector3(0, 0, 10); pos.y = terrain.heightAt(pos.x, pos.z);
  const vel = new THREE.Vector3(); let vy = 0, grounded = true, rot = Math.PI, phase = 0;
  const cam = { yaw: 0, pitch: CAM.pitch, dist: CAM.dist, drag: -9, yawV: 0, pitchV: 0 }; // yawV/pitchV: quán tính sau khi thả tay kéo
  const keys = new Set(), input = { x: 0, z: 0, run: false, jump: false };
  addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Space') input.jump = true; });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear()); // đổi cửa sổ: không bị kẹt phím

  // ---- Joystick (nửa trái) + xoay camera (nửa phải / chuột) ----
  const el = renderer.domElement, joy = document.getElementById('joy'), knob = document.getElementById('knob');
  let jid = null, jx = 0, jy = 0; const drags = new Map();
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && jid === null) { jid = e.pointerId; jx = e.clientX; jy = e.clientY; joy.style.cssText = `left:${jx}px;top:${jy}px;opacity:1`; return; }
    drags.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp }); cam.yawV = cam.pitchV = 0;
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId === jid) { let dx = e.clientX - jx, dy = e.clientY - jy; const L = Math.hypot(dx, dy), R = 50; if (L > R) { dx *= R / L; dy *= R / L; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / R; input.z = dy / R; return; }
    const d = drags.get(e.pointerId); if (!d) return;
    const dy = -(e.clientX - d.x) * 0.006, dp = (e.clientY - d.y) * 0.004, ms = Math.max(8, e.timeStamp - d.t);
    cam.yaw += dy; cam.pitch = clamp(cam.pitch + dp, 0.05, 1.2); d.x = e.clientX; d.y = e.clientY; d.t = e.timeStamp; cam.drag = performance.now();
    d.vy = (d.vy || 0) * 0.5 + dy / ms * 500; d.vp = (d.vp || 0) * 0.5 + dp / ms * 500; // vận tốc kéo (rad/s), làm mượt
  });
  const up = e => {
    if (e.pointerId === jid) { jid = null; input.x = input.z = 0; joy.style.opacity = 0; knob.style.transform = ''; }
    const d = drags.get(e.pointerId); if (d && e.timeStamp - d.t < 80) { cam.yawV = clamp(d.vy || 0, -6, 6); cam.pitchV = clamp(d.vp || 0, -3, 3); } // vuốt nhanh rồi thả → camera trôi tiếp
    drags.delete(e.pointerId);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, CAM.min, CAM.max); }, { passive: true });
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
  self.ready = loadHero(ctx.heroKind || 'student-male-a').then(r => { if (!r) { h.body.visible = true; self.heroFailed = true; return; } hero = r; h.body.visible = false; h.root.add(r.model); r.anim.play(r.set.idle, 0); });
  self.emote = name => { if (hero) emote(hero, animState, name); };
  let stepT = 0, stepPh = 1, jumpBuf = 0, coyote = 0;
  // trạng thái chuyển động mượt (tạo 1 lần, không cấp phát mỗi khung hình)
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), pivot = new THREE.Vector3(), pivV = new THREE.Vector3(), ZERO = new THREE.Vector3();
  const visOff = new THREE.Vector3(), visV = new THREE.Vector3(), extPos = new THREE.Vector3(), extQ = new THREE.Quaternion(), orbQ = new THREE.Quaternion(), lastCam = new THREE.Vector3();
  const rotSt = { v: 0 }, distSt = { v: 0 }, colSt = { v: 0 }, liftSt = { v: 0 }, leanSt = { v: 0 }, tiltSt = { v: 0 }, extSt = { v: 0 }, pyS = { v: 0 }, yawFSt = { v: 0 }, stepSt = { v: 0 };
  let yawF = 0; const slide = new THREE.Vector3(), slideSt = { x: { v: 0 }, z: { v: 0 } };
  let camDist = CAM.dist, colDist = CAM.dist, camLift = 0, lean = 0, tilt = 0, dip = 0, dipV = 0, ext = 0, snapCam = true, idleT = 0, lookT = 0, prevSpeed = 0, prevY = pos.y, prevDy = 0, stepY = 0, wasGrounded = true;
  const hs = {}, lookSt = {}, lookPt = { x: 0, z: 0, on: false };
  const occ = ctx.camOcc = ctx.camOcc || createCamOcclude(ctx), camTo = new THREE.Vector3();
  // Phương tiện (vehicles.js gán): self.vehicle = { speed, turn, accel, water, fly, lift, anim, seat, camAdd, maxAlt } hoặc null
  self.vehicle = null; self.vel = vel; self.setRot = r => { rot = r; rotSt.v = 0; };
  Object.defineProperty(self, 'hero', { get: () => hero });
  Object.defineProperty(self, 'vy', { get: () => vy, set: v => { vy = v; } });
  self.update = (dt) => {
    const V = self.vehicle;
    let ix = input.x, iz = input.z;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    const mag = self.frozen ? 0 : Math.min(1, Math.hypot(ix, iz)), n = Math.hypot(ix, iz) || 1;
    const running = input.run || keys.has('ShiftLeft') || keys.has('ShiftRight') || (input.x * input.x + input.z * input.z > 0.9);
    const D = ctx.dive, swim = !V && D && D.swimming;   // bơi/lặn (dive.js)
    const sp = (V ? V.speed : swim ? D.speed : running ? P.run : P.walk) * mag;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), mx = (Math.cos(cam.yaw) * ix - fx * iz) / n, mz = (-Math.sin(cam.yaw) * ix - fz * iz) / n;
    // quán tính mềm: tăng tốc ≈ φ⁴/s, hãm ≈ φ⁵/s, trên không φ²/s
    const k = ease(V ? V.accel : !grounded ? AIR : mag > 0.05 ? ACC : DEC, dt);
    vel.x += (mx * sp - vel.x) * k; vel.z += (mz * sp - vel.z) * k; self.speed = Math.hypot(vel.x, vel.z);
    // xoay người: lò xo giảm chấn có giới hạn tốc độ quay → đổi hướng gấp vẫn mượt, không giật
    if (mag > 0.05) { const wa = Math.atan2(mx, mz); if (V) { const d = wrapAngle(wa - rot) * Math.min(1, dt * V.turn); rot += d; rotSt.v = d / dt; } else rot = dampAngle(rot, wa, rotSt, T.fast, dt, TURN_MAX); }
    else rotSt.v *= Math.exp(-dt * 12);
    let impact = 0;

    // di chuyển + va chạm (phần vật lý — physics.js dựng lưới ctx.grid để tra nhanh vật cản gần)
    // chia nhỏ bước (≤ 0.25 m) để chạy nhanh/đi xe không xuyên tường mỏng; leo bậc ≤ STEP, vách cao hơn thì chặn
    const fly = V && V.fly, STEP = 1.1, BSTEP = 0.6, R0 = 0.35, SLOPE = Math.tan(48 * Math.PI / 180);
    const sup = (x, z, y) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);
    const near = (x, z) => ctx.grid ? ctx.grid.near(x, z) : { cols: ctx.colliders, boxes: ctx.boxes || [] };
    // giới hạn độ dốc địa hình (SLOPE ≈ 48°): dốc hơn thì không leo được, đứng trên đó thì trượt xuống; bậc thềm/sàn (groundExtra, hộp) không tính
    const hT = (x, z) => terrain.heightAt(x, z), onTerrain = (x, z, y) => !ctx.groundExtra || hT(x, z) >= ctx.groundExtra(x, z, y) - 0.01;
    const steep = (ox, oz, nx, nz) => { if (!onTerrain(nx, nz, pos.y)) return false; const d = Math.hypot(nx - ox, nz - oz); return hT(nx, nz) - sup(ox, oz, pos.y) > SLOPE * d + 0.02; };
    const swimNow = D && D.swimming, blocked = (ox, oz, nx, nz) => sup(nx, nz, pos.y) > pos.y + STEP || (grounded && !swimNow && steep(ox, oz, nx, nz));
    const sx0 = pos.x, sz0 = pos.z, ddx = (vel.x + slide.x) * dt, ddz = (vel.z + slide.z) * dt, ns = Math.max(1, Math.ceil(Math.hypot(ddx, ddz) / 0.25));
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
        // (sup tra với chân pos.y → sàn treo cao hơn chân > STEP được bỏ qua, đi bên dưới cầu được)
        if (!(V && V.water) && blocked(ox, oz, nx, nz)) { if (!blocked(ox, oz, nx, oz)) nz = oz; else if (!blocked(ox, oz, ox, nz)) nx = ox; else { nx = ox; nz = oz; } }
      }
      if (V && V.water) { if (sup(nx, nz) > CFG.island.waterLevel - 0.3) { nx = ox; nz = oz; vel.multiplyScalar(0.3); } } // thuyền: chỉ đi trên nước
      else if (V && !fly && sup(nx, nz) < CFG.island.waterLevel - 0.3) { nx = ox; nz = oz; vel.multiplyScalar(-0.5); self.hitWater = true; } // xe đạp: dừng ở mép nước, bật lùi nhẹ (vehicles.js báo)
      else if (!fly && !D && sup(nx, nz) < CFG.island.waterLevel - 0.7) { nx = ox; nz = oz; vel.set(0, 0, 0); } // đi bộ: có dive.js thì được xuống nước bơi
      pos.x = nx; pos.z = nz;
    }
    // vướng tường/vật cản: vận tốc = phần thật sự đi được (trượt dọc tường) → không "chạy tại chỗ", camera không nhìn xuyên tường
    if (!fly && dt > 0) { const ax = (pos.x - sx0) / dt, az = (pos.z - sz0) / dt; if (ax * ax + az * az < (vel.x * vel.x + vel.z * vel.z) * 0.9) { vel.x = ax; vel.z = az; self.speed = Math.hypot(ax, az); } }
    // mặt đỡ: địa hình, sàn thị trấn, nóc hộp thấp đang đứng trên
    let g = sup(pos.x, pos.z, pos.y);
    if (!fly) for (const b of near(pos.x, pos.z).boxes) if (b.top <= pos.y + BSTEP && b.top > g && pos.x > b.x0 - 0.15 && pos.x < b.x1 + 0.15 && pos.z > b.z0 - 0.15 && pos.z < b.z1 + 0.15) g = b.top;
    if (!fly && ctx.physics) for (const b of ctx.physics.solid) { const t = b.pos.y + b.K.r - 0.02; if (t > g && pos.y >= t - 0.3 && Math.abs(pos.x - b.pos.x) < 0.5 && Math.abs(pos.z - b.pos.z) < 0.5) g = t; }
    // nhảy dễ trúng: bấm sớm ≤ 1/φ⁴ s trước khi chạm đất vẫn nhận; vừa bước khỏi mép ≤ 0,1 s vẫn nhảy được
    if (input.jump) jumpBuf = 1 / PHI ** 4; input.jump = false; jumpBuf -= dt; coyote = grounded ? 0.1 : coyote - dt;
    if (jumpBuf > 0 && coyote > 0 && vy <= 0.01 && !self.frozen && !V && !(D && D.swimming)) { vy = P.jump; grounded = false; coyote = jumpBuf = 0; ctx.sfx && ctx.sfx('jump'); }
    if (V && V.water) { pos.y = V.waterY(pos.x, pos.z); vy = 0; grounded = true; }
    else if (V && V.fly) { // khinh khí cầu: bay lơ lửng, V.lift = tốc độ lên/xuống mong muốn
      vy += (V.lift - vy) * Math.min(1, dt * 1.5); pos.y = Math.min(V.maxAlt, pos.y + vy * dt);
      const floor = Math.max(g, CFG.island.waterLevel + 0.6); if (pos.y <= floor) { pos.y = floor; vy = Math.max(0, vy); grounded = g >= floor - 0.01; } else grounded = false;
    } else if (D && D.step(dt, g)) { vy = 0; grounded = true; }   // đang bơi/lặn: dive.js lo độ cao
    else {
    vy -= P.gravity * dt; pos.y += vy * dt;
    if (pos.y <= g) {
      if (!grounded) impact = -vy;
      if (!grounded && vy < -6) { puff(8, 2.5); ctx.sfx && ctx.sfx('land'); }
      pos.y = g; vy = 0; grounded = true;   // lên bậc: đặt chân ngay trên mặt (không nội suy dưới đất → chân không chìm)
    } else if (pos.y > g + (grounded && vy <= 0 ? 0.45 : 0.3)) grounded = false;
    else if (grounded && vy <= 0) { pos.y = g; vy = 0; } // xuống dốc/bậc: bám mặt đất, không "bay" lơ lửng
    }
    // trượt dốc: đứng trên địa hình dốc hơn SLOPE → trượt xuống theo hướng dốc (tốc độ tăng dần theo độ dốc, mượt)
    { let tx = 0, tz = 0;
      if (grounded && !fly && !(V && V.water) && !(D && D.swimming) && onTerrain(pos.x, pos.z, pos.y) && pos.y <= hT(pos.x, pos.z) + 0.05) {
        const e = 0.3, gx = (hT(pos.x + e, pos.z) - hT(pos.x - e, pos.z)) / (2 * e), gz = (hT(pos.x, pos.z + e) - hT(pos.x, pos.z - e)) / (2 * e), gm = Math.hypot(gx, gz);
        if (gm > SLOPE) { const sv = Math.min(PHI ** 4, (gm - SLOPE) * PHI ** 3 + PHI); tx = -gx / gm * sv; tz = -gz / gm * sv; }
      }
      slide.x = damp(slide.x, tx, slideSt.x, T.quick, dt); slide.z = damp(slide.z, tz, slideSt.z, T.quick, dt); }
    // animation KayKit + tiếng bước chân
    // bậc thang/lề đường: độ cao hiển thị trượt dần thay vì nhảy cóc (dốc thường không bị ảnh hưởng)
    // bậc = độ cao đổi đột ngột so với khung trước (dốc đổi đều nên không bị ảnh hưởng); xe đạp cũng được làm mượt
    const dyS = pos.y - prevY; if ((!V || !(V.fly || V.water)) && grounded && wasGrounded && Math.abs(dyS - prevDy) > 0.07 && Math.abs(dyS) < 0.8) { stepY = clamp(stepY - dyS + prevDy, 0, 0.6); prevDy = 0; } // chỉ làm mượt khi xuống bậc (lệch dương = hơi lơ lửng); lên bậc không cho lệch âm (chân chìm) else prevDy = grounded ? dyS : 0;
    prevY = pos.y; wasGrounded = grounded;
    dampV3(visOff, ZERO, visV, T.soft, dt); stepY = damp(stepY, 0, stepSt, T.soft, dt);
    // nghiêng người vào khúc cua (theo lực hướng tâm v·ω/g), chúi nhẹ khi tăng tốc, nhún gối khi tiếp đất
    if (!V) {
      lean = damp(lean, clamp(-Math.atan(self.speed * rotSt.v / P.gravity) * 0.4, -0.2, 0.2), leanSt, T.quick, dt);
      tilt = damp(tilt, grounded ? clamp((self.speed - prevSpeed) / dt * 0.006, -0.08, 0.1) : 0, tiltSt, T.soft, dt);
    } else { lean = tilt = 0; leanSt.v = tiltSt.v = 0; }
    prevSpeed = self.speed;
    if (impact > 6) dipV -= Math.min(impact, 20) * 0.2;
    dipV += (-144 * dip - 24 * dipV) * dt; dip += dipV * dt; if (dip > 0) { dip = 0; dipV = Math.min(dipV, 0); }
    // animation: đứng/đi/chạy/nhảy/tiếp đất chuyển mượt + tiếng bước chân
    if (hero) {
      const m = hero.model;
      if (V) { if (!animState.oneShot || animState.oneShot.until < performance.now()) hero.anim.play(V.anim, 0.25); m.position.set(0, V.seat || 0, V.seatZ || 0); }
      else { m.position.set(0, dip, 0); drivePlayer(hero, hs, { speed: self.speed, grounded, vy, impact, dt, walk: P.walk, oneShot: animState.oneShot }); }
      const c = Math.cos(rot), s = Math.sin(rot); m.position.x += visOff.x * c - visOff.z * s; m.position.y += visOff.y; m.position.z += visOff.x * s + visOff.z * c;
      m.rotation.set(tilt, 0, lean);
      hero.anim.update(dt);
      // đứng yên lâu (≥ 5 s, Fibonacci) → ngó quanh; đi tiếp → đầu quay về phía trước
      idleT = !V && grounded && self.speed < 0.3 ? idleT + dt : 0;
      if (idleT > 5 && (lookT -= dt) <= 0) { lookT = 2 + Math.random() * 3; const a = rot + (Math.random() - 0.5) * 2.4; lookPt.x = pos.x + Math.sin(a) * 5; lookPt.z = pos.z + Math.cos(a) * 5; lookPt.on = Math.random() < 0.75; }
      lookSt.facing = rot; lookAtTarget(hero, idleT > 5 && lookPt.on ? lookPt : null, lookSt, dt);
    }
    // bước chân: tiếng + bụi đúng lúc bàn chân chạm đất (theo pha animation đi/chạy: chân trước ở 0,875 / 0, mỗi nửa chu kỳ 1 bước)
    const A = hero && hero.anim.current, NS = hero && hero.set, isW = A && A === hero.anim.actions[NS.walk], isR = A && A === hero.anim.actions[NS.run];
    if (!V && grounded && self.speed > 0.8 && (isW || isR)) { const ph = ((A.time / A.getClip().duration - (isW ? 0.875 : 0) + 1) * 2) % 1; if (ph < stepPh) { ctx.sfx && ctx.sfx('step'); if (isR) puff(3, 1.1); } stepPh = ph; }
    else if (!V && grounded && self.speed > 0.8 && !hero && (stepT -= dt) <= 0) { stepT = self.speed > P.walk * 1.1 ? 0.3 : 0.42; ctx.sfx && ctx.sfx('step'); }
    else stepPh = 1;
    // dáng chạy (nhân vật dựng bằng khối, dùng khi chưa nạp xong model)
    phase += dt * self.speed * 2.1;
    const a = Math.min(1, self.speed / P.walk) * (running ? 1.0 : 0.7);
    h.root.position.copy(pos); h.root.position.y += stepY; h.root.rotation.y = rot; // lệch độ cao hiển thị (bậc) áp cho cả người lẫn xe
    h.legL.rotation.x = Math.sin(phase) * a; h.legR.rotation.x = -Math.sin(phase) * a;
    h.armL.rotation.x = -Math.sin(phase) * a; h.armR.rotation.x = Math.sin(phase) * a;
    h.body.position.y = Math.abs(Math.cos(phase)) * 0.08 * a; h.body.rotation.x = running ? 0.15 * a : 0;
    if (!grounded) { h.legL.rotation.x = -0.7; h.legR.rotation.x = 0.4; h.armL.rotation.z = -0.8; h.armR.rotation.z = 0.8; } else { h.armL.rotation.z = h.armR.rotation.z = 0; }
    if (!hero && !V && grounded && self.speed > P.walk * 1.1 && (dustT += dt) > 0.06) { dustT = 0; puff(1, 0.6); }
    for (let i = 0; i < NDust; i++) if (dl[i] > 0) { dl[i] = Math.max(0, dl[i] - dt * 1.4); dp[i * 3] += dv[i].x * dt; dp[i * 3 + 1] += dv[i].y * dt; dp[i * 3 + 2] += dv[i].z * dt; }
    dg.attributes.position.needsUpdate = dg.attributes.life.needsUpdate = true;

    // ---- Camera thứ 3: điểm nhìn (lò xo giảm chấn) + quỹ đạo cầu yaw/pitch/khoảng cách → không cắt góc khi xoay, không giật ----
    if (!drags.size && (cam.yawV || cam.pitchV)) { // quán tính sau khi vuốt
      cam.yaw += cam.yawV * dt; cam.pitch = clamp(cam.pitch + cam.pitchV * dt, 0.05, 1.2); const f = Math.exp(-dt * PHI ** 3);
      cam.yawV = Math.abs(cam.yawV *= f) < 0.02 ? 0 : cam.yawV; cam.pitchV = Math.abs(cam.pitchV *= f) < 0.02 ? 0 : cam.pitchV; cam.drag = performance.now();
    }
    // tự quay ra sau lưng khi chạy về phía trước (người chơi không kéo camera 1,5 s)
    // (tốc độ quay cũng qua lò xo → bắt đầu/dừng tự quay không giật)
    const follow = mag > 0.2 && -iz > 0.2 && self.speed > 1 && performance.now() - cam.drag > 1500;
    yawF = damp(yawF, follow ? wrapAngle(rot + Math.PI - cam.yaw) * (0.5 + Math.min(PHI, self.speed / P.walk)) / PHI : 0, yawFSt, T.soft, dt); cam.yaw += yawF * dt;
    // điểm nhìn: cao φ m trên chân, nhìn trước theo hướng chạy (vận tốc × 1/φ³ s); trên không bám độ cao chậm hơn (nhảy không làm rung camera)
    tmp.set(pos.x + vel.x * CAM.lead, pos.y + CAM.height, pos.z + vel.z * CAM.lead);
    const cAdd = (V ? V.camAdd || 0 : 0) + (D ? D.camAdd : 0);
    if (snapCam) { pivot.copy(tmp); pivV.set(0, 0, 0); pyS.v = 0; camDist = colDist = cam.dist + cAdd; distSt.v = colSt.v = 0; ext = 0; }
    else { const py = damp(pivot.y, tmp.y, pyS, grounded || V ? T.quick : T.slow, dt); dampV3(pivot, tmp, pivV, T.quick, dt); pivot.y = py; }
    camDist = damp(camDist, cam.dist + cAdd, distSt, T.slow, dt); // lên/xuống xe, thuyền, khinh khí cầu: lùi/tiến mượt
    const cp = Math.cos(cam.pitch), dx = Math.sin(cam.yaw) * cp, dy = Math.sin(cam.pitch), dz = Math.cos(cam.yaw) * cp;
    // né cây/nhà: thử các nấc khoảng cách, co vào nhanh (1/φ⁵ s), giãn ra chậm (1/φ² s) → không nhảy cóc
    let fit = 0.4;
    for (const f of [1, 0.85, 0.7, 0.55, 0.4]) {
      const cx = pivot.x + dx * camDist * f, cy = pivot.y + dy * camDist * f, cz = pivot.z + dz * camDist * f, N = near(cx, cz); let hit = false;
      for (const c of N.cols) { const ex = cx - c.x, ez = cz - c.z; if (ex * ex + ez * ez < (c.r * 3.4 + 0.3) ** 2 && cy < terrain.heightAt(c.x, c.z) + 5.5) { hit = true; break; } }
      if (!hit) for (const b of N.boxes) if (cx > b.x0 - 0.3 && cx < b.x1 + 0.3 && cz > b.z0 - 0.3 && cz < b.z1 + 0.3 && cy < b.top + 0.5) { hit = true; break; }
      if (!hit) { fit = f; break; }
    }
    // dò tia điểm nhìn → camera (tường, mái hiên, vòm cổng, thân cây…): kéo camera vào trước vật cản, chừa đệm 1/φ² m
    camTo.set(pivot.x + dx * camDist * fit, pivot.y + dy * camDist * fit, pivot.z + dz * camDist * fit);
    const wc = fly ? camDist * fit : Math.max(Math.min(camDist * fit, occ.clear(pivot, camTo, h.root) - 1 / PHI ** 2), 1); colDist = snapCam ? wc : damp(colDist, wc, colSt, wc < colDist ? T.fast : T.slow, dt); if (colDist > camDist) colDist = camDist;
    let cx = pivot.x + dx * colDist, cy = pivot.y + dy * colDist, cz = pivot.z + dz * colDist;
    const need = Math.max(terrain.heightAt(cx, cz) + 0.8, (ctx.groundExtra ? ctx.groundExtra(cx, cz, 99) : -99) + 0.8, D && D.diving ? -99 : CFG.island.waterLevel + 0.5);
    camLift = damp(camLift, Math.max(0, need - cy), liftSt, need - cy > camLift ? T.fast : T.soft, dt); cy = Math.max(cy + camLift, need - 0.3);
    if (D && D.diving) cy = Math.max(Math.min(cy, D.ceil), need - 0.3);   // lặn: camera ở dưới mặt nước, không xuyên đáy
    // camera vừa do phần khác điều khiển (máy bay) → hoà dần từ vị trí cũ về quỹ đạo (≈ 1/φ s)
    if (!snapCam && camera.position.distanceToSquared(lastCam) > 1e-4) { ext = 1; extSt.v = 0; extPos.copy(camera.position); extQ.copy(camera.quaternion); }
    camera.position.set(cx, cy, cz); camera.lookAt(pivot);
    if (ext > 0.002) { ext = damp(ext, 0, extSt, T.lazy, dt); orbQ.copy(camera.quaternion); camera.position.lerp(extPos, ext); camera.quaternion.slerpQuaternions(orbQ, extQ, ext); }
    lastCam.copy(camera.position); snapCam = false;
  };
  // dịch chuyển gần (lên/xuống xe, thuyền, máy bay): nhân vật trượt mượt tới chỗ mới; dịch chuyển xa: camera đặt lại ngay
  self.teleport = (x, z, y) => {
    const ny = y ?? terrain.heightAt(x, z); tmp2.set(x - pos.x, ny - pos.y, z - pos.z);
    if (tmp2.lengthSq() < 36) visOff.sub(tmp2); else { visOff.set(0, 0, 0); visV.set(0, 0, 0); snapCam = true; }
    pos.set(x, ny, z); vel.set(0, 0, 0); vy = 0; prevY = ny; prevDy = 0;
  };
  self.snapCamera = () => { snapCam = true; };
  return self;
}
