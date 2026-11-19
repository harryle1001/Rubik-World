// lighthouse/index.js — HẢI ĐĂNG MŨI SÓNG: nối đảo đá + tháp vào thế giới.
// - Độ cao: bọc terrain.heightAt (đảo đá tính giải tích) → người, thuyền, máy bay, vật lý tự dùng được; bơi/lặn tới được.
// - Mặt đi thêm (ctx.groundExtra): bến gỗ 2 đầu, 21 bậc đá, trong tháp: cầu thang xoắn 144 bậc, sàn các tầng, buồng đèn, ban công.
// - Tải theo khoảng cách: dựng khi cách chân tháp < 296 m (tầm nhìn), dỡ khi > 351 m. Xa hơn chỉ còn "đèn xa": bóng tháp + chùm sáng
//   kéo về 233 m và thu nhỏ đúng tỷ lệ (như academy/far.js) → đêm nhìn thấy chùm sáng quét từ đảo chính, máy bay, tàu.
// - Thuyền máy nhỏ từ bến tây nam đảo chính ⇄ bến hải đăng (21 s, Fibonacci); mốc trên bản đồ M (ctx.mapPlaces).
// - Ông Bảy gác đèn (keeper.js), chai thư + rương thuyền trưởng dưới đáy biển, còi sương mù, đồng hồ thuỷ triều theo trăng thật.
import * as THREE from 'three';
import { LIGHTHOUSE, ACADEMY, ISLAND_R, PHI } from '../layout.js';
import { CFG } from '../config.js';
import { Batch } from '../academy/geo.js';
import { mat, matV, PAL } from '../sample/palette.js';
import { toon } from '../style.js';
import { loadModel } from '../models.js';
import { loadHero } from '../characters.js';
import { T as TM, dampV3 } from '../motion.js';
import { C, E, N, ROT, toLocal, toWorld, R_BOUND, Y0, T, FLOORS, rOut, rIn, heightAt as isleAt, isleH, towerGround, pathY, stepNo, PIER, CRAG, smooth } from './plan.js';
import { buildLighthouse, FIB_STEPS, SKERRIES, HOUSE, LIFT } from './build.js';
import { createKeeper, dirName, moonInfo } from './keeper.js';

const TAU = Math.PI * 2, LOAD = 296, UNLOAD = 351, PULL = 233, PIER_Y = 1.2, MP_HW = 1.5, DUR = 21, PERIOD = 13;   // đèn quay 1 vòng 13 s, 2 chùm → chớp mỗi 6,5 s
const FLOOR_NAME = ['Tầng trệt · Sảnh', 'Tầng 1 · Phòng ở', 'Tầng 2 · Phòng bản đồ hải trình', 'Tầng 3 · Phòng máy'];
const FACTS = ['🗼 <b>Hải đăng</b> là "đèn giao thông" của biển: báo cho tàu biết đâu là bờ, đâu có đá ngầm.', '🌊 <b>Sóng</b> do gió thổi trên mặt biển tạo ra; gió càng mạnh, thổi càng lâu thì sóng càng cao.'];
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export function createLighthouse(ctx) {
  const { terrain, scene, player, camera } = ctx, sky = ctx.sky;
  const CR = Math.hypot(C[0], C[1]), D = [-E[0], -E[1]];
  // ---------- độ cao ----------
  const base = terrain.heightAt, RB2 = R_BOUND * R_BOUND;
  terrain.heightAt = (x, z) => { const dx = x - C[0], dz = z - C[1]; return dx * dx + dz * dz < RB2 ? Math.max(base(x, z), isleAt(x, z)) : base(x, z); };

  // ---------- bến ở đảo chính: dò bờ theo hướng ra hải đăng (qua khỏi Học viện Hoa Phượng) ----------
  let rs = 300; for (let r = 266; r < 440; r += 0.5) if (base(D[0] * r, D[1] * r) < -1.6) { rs = r; break; }
  let r1 = rs; while (r1 > 250 && base(D[0] * r1, D[1] * r1) < PIER_Y - 0.25) r1 -= 0.5;
  const me0 = CR - (rs + 13), me1 = CR - (r1 - 2.5);   // cầu tàu theo trục e cục bộ: me0 (đầu ngoài biển) … me1 (trên bờ cát)
  const world = new THREE.Group(); world.position.set(C[0], 0, C[1]); world.rotation.y = ROT; world.name = 'lighthouse-world'; scene.add(world);
  {
    const b = new Batch(), wood = PAL.wood.hex, woodD = PAL.woodD.hex;
    for (let x = me0; x < me1 - 0.01; x += 0.5) b.box(x + 0.02, x + 0.48, PIER_Y - 0.12, PIER_Y, -MP_HW, MP_HW, (x * 2 | 0) % 3 ? wood : '#b98356');
    for (let x = me0 + 0.6; x <= me1; x += 5) for (const s of [-1, 1]) b.cyl(x, -4, s * (MP_HW - 0.12), 0.16, 4 + PIER_Y + 0.9, woodD, 6);
    for (const s of [-1, 1]) b.box(me0, me1, PIER_Y + 0.78, PIER_Y + 0.86, s * (MP_HW - 0.12) - 0.04, s * (MP_HW - 0.12) + 0.04, woodD);
    for (const x of [me0 + 0.6, me1 - 4.4]) { b.cyl(x, PIER_Y, MP_HW + 0.25, 0.07, 2.9, PAL.iron.hex, 6); b.box(x - 0.2, x + 0.2, PIER_Y + 2.9, PIER_Y + 3.3, MP_HW + 0.05, MP_HW + 0.45, PAL.lampGlow.hex); }
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true; m.name = 'lighthouse-main-pier'; world.add(m);
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
    k.font = 'bold 38px system-ui'; k.fillStyle = 'rgba(27,22,38,.78)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('🗼 Bến thuyền ra Hải đăng', 256, 49, 460);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(5.5, 1.02, 1); sp.position.set(me1 - 1.5, PIER_Y + 3.9, 0); world.add(sp);
  }

  // ---------- mặt đi thêm ----------
  let inside = false;   // người chơi đang trong tháp / trên ban công → camera hỏi "mặt đất" theo tầng đang đứng (không bị đẩy lên nóc)
  const prevExtra = ctx.groundExtra, FAR2 = (me1 + 3) ** 2;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99;
    const dx = x - C[0], dz = z - C[1], d2 = dx * dx + dz * dz; if (d2 > FAR2) return h;
    const e = dx * E[0] + dz * E[1], n = dx * N[0] + dz * N[1];
    if (e > me0 && e < me1 && Math.abs(n) < MP_HW) return Math.max(h, PIER_Y);
    if (d2 > RB2) return h;
    const p = pathY(e, n); if (p !== null && (y === undefined || y > p - 2.5)) h = Math.max(h, p);
    if (d2 < 27.1) { let yy = y === undefined ? 999 : y; if (yy >= 90 && inside) yy = player.pos.y + 2.2; const t = towerGround(e, n, yy - Y0); if (t !== null) h = Math.max(h, Y0 + t); }
    return h;
  };
  // vật cản cố định: nhà người gác đèn, đá ngầm
  for (const k of [-2.5, 0, 2.5]) { const [x, z] = toWorld(HOUSE.e + k, HOUSE.n); ctx.colliders.push({ x, z, r: 3.2 }); }
  for (const [e, n, s] of SKERRIES) { const [x, z] = toWorld(e, n); ctx.colliders.push({ x, z, r: 1.8 * s }); }

  // ---------- vùng bay, tên vùng, mốc bản đồ ----------
  (ctx.flyZones = ctx.flyZones || []).push((x, z) => { const t = Math.max(0, Math.min(CR + 89, x * D[0] + z * D[1])); return Math.hypot(x - D[0] * t, z - D[1] * t) < 144; });
  const prevZone = ctx.zoneAt; ctx.zoneAt = (x, z) => Math.hypot(x - C[0], z - C[1]) < 55 ? LIGHTHOUSE.name : prevZone ? prevZone(x, z) : null;
  const mainPier = toWorld((me0 + me1) / 2, 0);
  (ctx.mapPlaces = ctx.mapPlaces || []).push({ n: LIGHTHOUSE.name, x: C[0], z: C[1], ic: '🗼', far: 'ngoài khơi 233 m hướng Tây Nam' }, { n: 'Bến thuyền ra Hải đăng', x: mainPier[0], z: mainPier[1], ic: '⛵' });

  // ---------- ĐÈN XA: bóng tháp + 2 chùm sáng + quầng sáng (luôn có, 4 draw call) ----------
  const LW = new THREE.Vector3(C[0], Y0 + T.DECK + 1.9, C[1]);
  const rig = new THREE.Group(); rig.name = 'lighthouse-light'; scene.add(rig);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { uO: { value: 0 } },
    vertexShader: 'varying float vT; void main(){ vT = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uO; varying float vT; void main(){ gl_FragColor = vec4(vec3(1., .93, .72) * uO * pow(vT, 1.3), 1.); }',
  });
  const spin = new THREE.Group(); rig.add(spin);
  { const L = 144, g = new THREE.ConeGeometry(8, L, 13, 1, true).translate(0, -L / 2, 0).rotateZ(Math.PI / 2); for (const s of [0, Math.PI]) { const m = new THREE.Mesh(g, beamMat); m.rotation.y = s; m.frustumCulled = false; m.renderOrder = 4; m.name = 'lighthouse-beam'; spin.add(m); } }
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), gr = k.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, '#ffe9b0cc'); gr.addColorStop(1, '#ffd98a00'); k.fillStyle = gr; k.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); glow.renderOrder = 5; rig.add(glow);
  const farMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  const far = (() => {
    const b = new Batch(); let y = 0; T.BANDS.forEach((h, i) => { b.add(new THREE.CylinderGeometry(rOut(y + h), rOut(y), h, 8, 1, true), i % 2 ? '#f7efdc' : '#d8433a', 0, Y0 + y + h / 2, 0); y += h; });
    b.cyl(0, Y0 + T.DECK - 0.3, 0, T.R1 + T.GAL, 0.5, '#5a5266', 8); b.cyl(0, Y0 + T.DECK, 0, T.R1 - 0.1, T.LANT, '#3a3344', 8); b.cone(0, Y0 + T.DECK + T.LANT, 0, T.R1 + 0.3, 2.2, '#d8433a', 8);
    b.add(new THREE.CylinderGeometry(21, 34, Y0 + 1, 13), '#948a7b', 0, (Y0 - 1) / 2, 0); b.add(new THREE.ConeGeometry(9, 9, 6), '#7d786f', CRAG.e, 4.5, CRAG.n); b.box(HOUSE.e - 4, HOUSE.e + 4, Y0, Y0 + 3.2, HOUSE.n - 3, HOUSE.n + 3, '#efe3c8'); b.gable(HOUSE.e - 4.3, HOUSE.e + 4.3, HOUSE.n - 3.3, HOUSE.n + 3.3, Y0 + 3.2, 2, '#c45a3a');
    const m = new THREE.Mesh(b.build(), farMat); m.rotation.y = ROT; m.position.y = -LW.y; m.frustumCulled = false; m.name = 'lighthouse-far'; rig.add(m); return m;
  })();
  let beta = 0, aim = null, flash = null, lit = 0, camDist = 1e9;
  let seeT = 0, see = 1;   // đồi/nhà cao che đường nhìn từ camera tới đèn → ẩn "đèn xa" (vật ở xa được kéo về 233 m nên không tự bị đồi che)
  const sightClear = cam => { const n = 13; for (let i = 1; i < n; i++) { const t = i / n * Math.min(1, 377 / camDist), x = cam.x + d3.x * t, z = cam.z + d3.z * t; if (base(x, z) > cam.y + d3.y * t + 0.5) return false; } return true; };
  const d3 = new THREE.Vector3(), WHITE = new THREE.Color('#ffffff');
  function lightUpdate(dt) {
    const cam = camera.position, night = sky.state.night || 0, fog = ctx.weather && ctx.weather.cur ? ctx.weather.cur.f || 0 : 0;
    d3.subVectors(LW, cam); const dist = camDist = d3.length(), s = Math.min(1, PULL / dist);
    rig.position.copy(cam).addScaledVector(d3, s); rig.scale.setScalar(s);
    if ((seeT -= dt) < 0) { seeT = 0.25; see = s >= 1 || sightClear(cam) ? 1 : 0; } rig.visible = see > 0; if (!rig.visible) return;
    if (aim != null) beta += wrap(aim - Math.PI / 2 - beta) * Math.min(1, dt * 8); else beta = (beta + dt * TAU / PERIOD) % TAU;
    spin.rotation.y = -beta;
    const want = flash != null ? (flash ? 1 : 0.03) : Math.max(smooth(0.2, 0.6, night), fog * 0.6, aim != null ? 0.75 : 0);
    lit += (want - lit) * Math.min(1, dt * (flash != null ? 21 : 2));
    const hx = -d3.x, hz = -d3.z, hl = Math.hypot(hx, hz) || 1, f = flash != null ? 1 : Math.pow(Math.abs(Math.cos(beta) * hx + Math.sin(beta) * hz) / hl, 34);   // chùm sáng lướt qua mắt → loé
    beamMat.uniforms.uO.value = flash != null ? 0 : lit * (0.16 + 0.1 * (1 - s)) * (1 - 0.45 * fog); spin.visible = beamMat.uniforms.uO.value > 0.004;
    glow.scale.setScalar((1.6 + 9 * f * lit + 2 * lit) / Math.sqrt(s)); glow.material.opacity = Math.min(1, 0.12 + lit * (0.45 + 0.55 * f)); glow.visible = dist > 4;
    far.visible = !isle || dist > LOAD - 8;
    if (far.visible) { const k = 0.45 + 0.3 * smooth(LOAD, 1200, dist); farMat.color.copy(WHITE).lerp(scene.fog ? scene.fog.color : WHITE, k).multiplyScalar(1 - 0.72 * night); }
  }

  // ---------- THUYỀN MÁY NHỎ ⇄ ----------
  const boat = new THREE.Group(); boat.name = 'lighthouse-boat'; scene.add(boat);
  loadModel('kit/boat_fishing').then(m => { if (!m) return; m.scale.setScalar(1.3); m.traverse(o => { if (o.isMesh) o.castShadow = true; }); boat.add(m); });
  const pA = [me0 + 2.5, MP_HW + 1.5], pB = [PIER.e1 - 3, -PIER.hw - 1.5];
  const curve = new THREE.CatmullRomCurve3([pA, [me0 - 13, MP_HW + 1.5], [PIER.e1 + 34, -5], [PIER.e1 + 8, -PIER.hw - 1.5], pB].map(([e, n]) => { const [x, z] = toWorld(e, n); return new THREE.Vector3(x, 0, z); }), false, 'centripetal', 0.5);
  const CL = curve.getLength(), TA = 3, TD = 5, VMAX = CL / (DUR - (TA + TD) / 2);
  const distAt = t => t <= TA ? 0.5 * VMAX / TA * t * t : t <= DUR - TD ? 0.5 * VMAX * TA + VMAX * (t - TA) : CL - 0.5 * VMAX / TD * (DUR - t) ** 2;
  let ride = null, idle = 'A'; const P3 = new THREE.Vector3(), Tn = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camV = new THREE.Vector3(), lookV = new THREE.Vector3(), tmp = new THREE.Vector3(), seat = new THREE.Vector3();
  const place = (u, dir) => {
    u = Math.min(1, Math.max(0, u)); curve.getPointAt(u, P3); curve.getTangentAt(u, Tn); if (dir < 0) Tn.negate();
    const t = performance.now() / 1000, y = terrain.waveHeight ? terrain.waveHeight(P3.x, P3.z) : 0;
    boat.position.set(P3.x, y - 0.1, P3.z); boat.rotation.set(Math.sin(t * 1.3) * 0.03, Math.atan2(Tn.x, Tn.z), Math.sin(t * 1.7 + 1) * 0.04, 'YXZ');
  };
  function rideStart(dir) {
    if (ride || player.vehicle || (ctx.aircraft && ctx.aircraft.flying)) return;
    ride = { dir, t: 0, fact: 0 }; idle = null;
    player.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'sit', seat: 0, seatZ: 0, camAdd: 0, ferry: true };
    camPos.copy(camera.position); camV.set(0, 0, 0); lookV.set(0, 0, 0); camLook.copy(boat.position); ctx.sfx && ctx.sfx('splash');
    ctx.toast(dir > 0 ? '⛵ Thuyền rời bến… ra <b>Hải đăng Mũi Sóng</b> (233 m ngoài khơi)' : '⛵ Thuyền đưa bạn về <b>đảo Rubik</b>', 3500);
  }
  function rideEnd() {
    const dir = ride.dir; ride = null; idle = dir > 0 ? 'B' : 'A'; player.vehicle = null;
    const [x, z] = dir > 0 ? toWorld(PIER.e1 - 3, 0) : toWorld(me0 + 2.5, 0); player.teleport(x, z, PIER_Y); player.root.quaternion.identity();
    const [lx, lz] = dir > 0 ? toWorld(0, 0) : toWorld(me1 + 21, 0); player.cam.yaw = Math.atan2(x - lx, z - lz); player.snapCamera && player.snapCamera();
    ctx.toast(dir > 0 ? '🗼 Chào mừng tới <b>Hải đăng Mũi Sóng</b>! Theo cầu gỗ và 21 bậc đá lên gặp ông Bảy gác đèn.' : '🏝️ Đã về <b>đảo Rubik</b>.', 4500);
  }
  function rideUpdate(dt) {
    if (!ride) { place(idle === 'B' ? 1 : 0, idle === 'B' ? -1 : 1); return; }
    ride.t = Math.min(DUR, ride.t + dt); const d = distAt(ride.t) / CL; place(ride.dir > 0 ? d : 1 - d, ride.dir);
    seat.set(0, 0.45, -0.5).applyMatrix4(boat.matrixWorld.compose(boat.position, boat.quaternion, boat.scale));
    player.pos.copy(seat); player.root.position.copy(seat); player.root.quaternion.copy(boat.quaternion);
    const fx = Math.sin(boat.rotation.y), fz = Math.cos(boat.rotation.y);
    tmp.set(boat.position.x - fx * 8, boat.position.y + 3.4, boat.position.z - fz * 8); dampV3(camPos, tmp, camV, TM.soft, dt); camera.position.copy(camPos);
    dampV3(camLook, tmp.set(boat.position.x + fx * 34, boat.position.y + (ride.dir > 0 ? 13 : 5), boat.position.z + fz * 34), lookV, TM.slow, dt); camera.lookAt(camLook);
    const fi = Math.floor(ride.t / 8); if (fi >= 1 && fi <= FACTS.length && ride.fact < fi) { ride.fact = fi; ctx.toast(FACTS[fi - 1], 6000); }
    ctx.offer(`⏭ Tới nơi (còn ${Math.ceil(DUR - ride.t)} s)`, () => { if (ride) ride.t = DUR; }, 9);
    if (ride.t >= DUR) rideEnd();
  }
  place(0, 1);

  // ---------- ông Bảy + nhiệm vụ ----------
  const tide = () => { const p = sky.state.moonPhase, A = 0.3 + 0.5 * Math.abs(Math.cos(p * TAU)), ph = (sky.state.hour - p * 24.8) / 12.42 * TAU; return { level: A * Math.cos(ph), rising: -Math.sin(ph) > 0, A }; };
  const keeper = createKeeper(ctx, { aim: b => { aim = b; }, flash: v => { flash = v; }, dirToMain: Math.atan2(E[0], -E[1]), distMain: CR - ISLAND_R, tide });
  const st = keeper.state, KP = [7.5, 1.2];

  // ---------- dựng / dỡ ----------
  let isle = null, fx = null;
  function build() {
    const LM = [{ n: 'Hải đăng', x: C[0], z: C[1], c: '#c45a3a', r: 30 }, { n: 'Học viện Pha Lê', x: ACADEMY.c[0], z: ACADEMY.c[1], c: '#8f9ab0', r: 120 }];
    isle = buildLighthouse(ctx, { marks: LM, rot: 0 }); world.add(isle.group);
    const g = isle.group;
    // hải âu: 13 con (1 draw call) — 8 con lượn quanh tháp/mỏm đá, 5 con đậu
    const gb = new Batch(), wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.16, 0, 0, -0.14, 0.42, 0.5, 0, 0.42, 0.5, 0, 0, 0, -0.14, 0.86, 1, -0.1, 0, 0, 0.16, -0.42, 0.5, 0, 0, 0, -0.14, -0.42, 0.5, 0, -0.86, 1, -0.1, 0, 0, -0.14], 3)); wing.computeVertexNormals();
    gb.add(wing, '#f6f1e6'); gb.add(new THREE.OctahedronGeometry(0.1), '#f6f1e6', 0, 0, 0.02, 0, 0, 0, 0.9, 0.9, 2.6); gb.add(new THREE.ConeGeometry(0.03, 0.12, 4).rotateX(Math.PI / 2), '#f2c443', 0, 0, 0.31); gb.add(new THREE.OctahedronGeometry(0.06), '#5a5266', 0, 0, -0.26, 0, 0, 0, 1, 0.6, 1.6);
    const gulls = new THREE.InstancedMesh(gb.build(), toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), 13); gulls.name = 'lighthouse-gulls'; gulls.frustumCulled = false; gulls.userData.noCamOcc = true; g.add(gulls);
    const GP = Array.from({ length: 13 }, (_, i) => i < 8 ? { r: 9 + (i * 5) % 14, h: Y0 + 9 + (i * 7) % 24, w: (0.32 + (i % 3) * 0.09) * (i % 2 ? 1 : -1), ph: i * 2.4, cx: i % 3 ? 0 : CRAG.e, cz: i % 3 ? 0 : CRAG.n } : null);
    const perch = [[CRAG.e + 1, isleH(CRAG.e + 1, CRAG.n) + 0.12, CRAG.n, 1], [CRAG.e - 2, isleH(CRAG.e - 2, CRAG.n + 2) + 0.12, CRAG.n + 2, 2.5], [PIER.e1 - 0.9, PIER.y + 1.12, PIER.hw - 0.12, 4], [PIER.e1 - 5.9, PIER.y + 0.37, -PIER.hw + 0.12, 0.3], [HOUSE.e + 1, Y0 + 4.9, HOUSE.n, 2]];
    // chai thư + rương + đồng hồ thuỷ triều + quả nổi đánh dấu rương
    const sb = new Batch(); sb.add(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 8), '#4f9a4a', 0, 0, 0); sb.add(new THREE.CylinderGeometry(0.04, 0.08, 0.14, 8), '#4f9a4a', 0, 0.22, 0); sb.cyl(0, 0.29, 0, 0.04, 0.06, '#a8744a', 6); sb.add(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), '#f7efdc', 0, 0, 0);
    const bottle = new THREE.Mesh(sb.build(), matV()); bottle.name = 'lighthouse-bottle'; bottle.rotation.z = 1.1; bottle.scale.setScalar(1.8); bottle.visible = !st.bottle; g.add(bottle);
    const tb = new Batch(); tb.cyl(0, Y0, 0, 0.06, 1.5, PAL.woodD.hex, 5); tb.add(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 21).rotateX(Math.PI / 2), PAL.stoneCreamL.hex, 0, Y0 + 1.75, 0); tb.add(new THREE.TorusGeometry(0.42, 0.04, 4, 21), PAL.brass.hex, 0, Y0 + 1.75, -0.03);
    for (let k = -2; k <= 2; k++) tb.add(new THREE.BoxGeometry(0.03, 0.1, 0.02), k ? PAL.ink.hex : PAL.rubikB.hex, Math.sin(k * 0.52) * 0.33, Y0 + 1.75 + Math.cos(k * 0.52) * 0.33, -0.04, 0, 0, -k * 0.52);
    const tideG = new THREE.Group(); tideG.position.set(9.4, 0, 3.6); g.add(tideG); const tm = new THREE.Mesh(tb.build(), matV()); tm.name = 'lighthouse-tide-clock'; tm.userData.noCamOcc = true; tideG.add(tm);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.02).translate(0, 0.14, 0), mat('rubikR')); needle.position.set(0, Y0 + 1.75, -0.05); needle.name = 'lighthouse-tide-needle'; tideG.add(needle);
    const chestL = toLocal(C[0] - 55, C[1]), chest = new THREE.Group(); chest.position.set(chestL[0], -6, chestL[1]); g.add(chest);
    loadModel('kit/chest').then(m => { if (m && isle) { m.rotation.y = 0.8; chest.add(m); } });
    const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), mat('lampGlow')); mark.position.y = 1.6; mark.visible = !st.chest; chest.add(mark);
    // ông Bảy
    const kp = { hero: null }; loadHero('student-male-e', 1.72, { role: 'adult', old: true, shirt: '#2f4a6b', pants: '#3a3a44', cap: '#1f2a44', brim: '#1f2a44' }).then(h => { if (!h || !isle) return; h.npc = true; h.model.position.set(KP[0], Y0, KP[1]); h.model.rotation.y = Math.PI / 2; g.add(h.model); h.anim.play(h.set.idle, 0); kp.hero = h; });
    // bọt sóng: toạ độ thế giới của từng đỉnh (để bám mặt sóng)
    const fp = isle.foam.geometry.attributes.position, fw = new Float32Array(fp.count * 2); for (let i = 0; i < fp.count; i++) { const [x, z] = toWorld(fp.getX(i), fp.getZ(i)); fw[i * 2] = x; fw[i * 2 + 1] = z; }
    fx = { gulls, GP, perch, bottle, needle, chest, mark, kp, fp, fw, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), eu: new THREE.Euler(), tick: 0, bl: [-33, -22] };
  }
  function unbuild() { if (inside) { inside = false; ctx.indoor = null; } isle.dispose(); isle = null; fx = null; keeper.chip(null); }

  const cDay = new THREE.Color('#2a3440'), cNight = new THREE.Color('#ffd98a'), iDay = new THREE.Color('#bfe3f2'), iNight = new THREE.Color('#1c2740'), lampC = new THREE.Color();
  const seen = {}; let hornT = 5, lastFloor = -1, greeted = false;
  const once = (k, f) => { if (!seen[k]) { seen[k] = 1; f(); } };
  function horn() {
    const au = ctx.audio; if (!au || !au.on || !au.listener || au.listener.context.state !== 'running') return;
    const ac = au.listener.context, out = au.listener.getInput(), t = ac.currentTime + 0.05, vol = Math.max(0.03, 0.22 * (1 - camDist / 300));
    for (const [t0, len] of [[0, 1.6], [2.2, 2.6]]) for (const [f, v] of [[110, 1], [165, 0.5], [220, 0.2]]) { const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 500; g.gain.setValueAtTime(0, t + t0); g.gain.linearRampToValueAtTime(vol * v, t + t0 + 0.25); g.gain.setValueAtTime(vol * v, t + t0 + len - 0.3); g.gain.linearRampToValueAtTime(0, t + t0 + len); o.connect(lp).connect(g).connect(out); o.start(t + t0); o.stop(t + t0 + len + 0.05); }
  }

  function update(dt) {
    const t = performance.now() / 1000, night = sky.state.night || 0;
    rideUpdate(dt);
    const sp = ride || (ctx.aircraft && ctx.aircraft.flying) ? camera.position : player.pos, dl = Math.hypot(sp.x - C[0], sp.z - C[1]);
    if (!isle && dl < LOAD) build(); else if (isle && dl > UNLOAD) unbuild();
    lightUpdate(dt);
    const pp = player.pos, [pe, pn] = toLocal(pp.x, pp.z), busy = ride || player.vehicle;
    // bến đảo chính
    if (!busy && pe > me0 - 1 && pe < me0 + 8 && Math.abs(pn) < 4 && pp.y < PIER_Y + 2) ctx.offer(idle === 'A' ? '⛵ Đi thuyền ra Hải đăng Mũi Sóng' : '⛵ Gọi thuyền ra Hải đăng', () => rideStart(1), 8);
    // còi sương mù: sương dày che ánh đèn → báo tàu bằng âm thanh (2 hồi mỗi 21 s)
    const fog = ctx.weather && ctx.weather.cur ? ctx.weather.cur.f || 0 : 0;
    if (fog > 0.45 && camDist < 300) { if ((hornT -= dt) < 0) { hornT = 21; horn(); once('horn', () => ctx.toast('📯 <b>Còi sương mù</b>: khi sương dày che mất ánh đèn, hải đăng báo cho tàu bằng <b>âm thanh</b>. Âm trầm truyền đi xa hơn âm cao.', 6500)); } } else hornT = Math.min(hornT, 3);
    if (!isle) return;

    // ----- hình ảnh động -----
    isle.lens.rotation.y = -beta - ROT; lampC.set('#8a8478').lerp(WHITE, Math.min(1, 0.25 + lit)); isle.lamp.material.color.copy(lampC); isle.lensM.emissiveIntensity = 0.12 + 0.9 * lit;
    isle.winOut.color.copy(cDay).lerp(cNight, night); isle.winIn.color.copy(iDay).lerp(iNight, night); isle.glassM.opacity = 0.14 + 0.1 * night;
    LIFT.value = 0.3 + 0.08 * night;
    const fu = isle.foam.material.uniforms; fu.uT.value = t; fu.uLight.value = 1 - 0.6 * night;
    if (!(CFG.isMobile && (fx.tick++ & 1)) && terrain.waveHeight) { const a = fx.fp.array, w = fx.fw; for (let i = 0, n = fx.fp.count; i < n; i++) a[i * 3 + 1] = terrain.waveHeight(w[i * 2], w[i * 2 + 1]) + 0.06; fx.fp.needsUpdate = true; }
    isle.cloth.rotation.x = Math.sin(t * 1.7) * 0.1 + Math.sin(t * 0.6) * 0.06;
    for (let i = 0; i < 13; i++) {   // hải âu
      const G = fx.GP[i]; if (G) { const a = G.ph + t * G.w, flap = 0.25 + 0.55 * Math.sin(t * (5 + i % 3) + i) * (Math.sin(t * 0.4 + i) > 0.3 ? 0.25 : 1); fx.v.set(G.cx + Math.cos(a) * G.r, G.h + Math.sin(t * 0.5 + i) * 1.5, G.cz + Math.sin(a) * G.r); fx.q.setFromEuler(fx.eu.set(0, -a + (G.w > 0 ? 0 : Math.PI), 0)); fx.s.set(1.5, 1.5 * flap, 1.5); }
      else { const [x, y, z, r] = fx.perch[i - 8]; fx.v.set(x, y, z); fx.q.setFromEuler(fx.eu.set(0, r + Math.sin(t * 0.7 + i) * 0.3, 0)); fx.s.set(0.42, 0.24, 1.25); }
      fx.gulls.setMatrixAt(i, fx.m4.compose(fx.v, fx.q, fx.s));
    }
    fx.gulls.instanceMatrix.needsUpdate = true;
    const TD = tide(); fx.needle.rotation.z = -TD.level / 0.8 * 1.04;
    if (fx.bottle.visible) { const [bx, bz] = toWorld(fx.bl[0], fx.bl[1]); fx.bottle.position.set(fx.bl[0], (terrain.waveHeight ? terrain.waveHeight(bx, bz) : 0) + 0.02, fx.bl[1]); fx.bottle.rotation.y = t * 0.3; }
    if (fx.mark.visible) { fx.mark.rotation.y = t; fx.mark.position.y = 1.6 + Math.sin(t * 2) * 0.15; }
    if (fx.kp.hero) { const h = fx.kp.hero, near = Math.hypot(pe - KP[0], pn - KP[1]); if (near < 34) h.anim.update(dt); if (near < 8) { const want = Math.atan2(pe - KP[0], pn - KP[1]); h.model.rotation.y += wrap(want - h.model.rotation.y) * Math.min(1, dt * 3); } }

    // ----- người chơi trong tháp / trên đảo -----
    const r = Math.hypot(pe, pn), yr = pp.y - Y0, D = T.DECK;
    const inShaft = r < rOut(Math.max(0, yr)) + 0.05 && yr > -0.5 && yr < D - 0.5, top = r < T.R1 + T.GAL + 0.3 && yr >= D - 0.5 && yr < D + 6;
    inside = inShaft || top;
    if (inShaft) ctx.indoor = ctx.indoor || { name: LIGHTHOUSE.name, lh: true }; else if (ctx.indoor && ctx.indoor.lh) ctx.indoor = null;
    // người trong thân tháp mà camera ở ngoài lớp trát → ẩn vỏ ngoài: nhìn "cắt lớp" vào trong tháp (thấy cầu thang xoắn, các tầng), không bị tường che
    { const [ce, cn] = toLocal(camera.position.x, camera.position.z); isle.shell.visible = !inShaft || Math.hypot(ce, cn) < rIn(Math.max(0, camera.position.y - Y0)) - 0.02; }
    if (inShaft) {
      once('enter', () => ctx.toast('🗼 Trong tháp có <b>144 bậc</b> xoắn ốc, mỗi vòng 34 bậc. Bậc <b>màu đồng</b> là bậc mang số <b>Fibonacci</b>: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144.', 7000));
      const k = FLOORS.findIndex(f => Math.abs(yr - f) < 0.12 && r < rOut(f) - T.WALL - T.SW), sn = stepNo(pe, pn, yr);
      if (k >= 0) { keeper.chip(`🗼 <b>${FLOOR_NAME[k]}</b>${k ? ` · bậc ${k * 34} · cao ${(FLOORS[k]).toFixed(1).replace('.', ',')} m` : ''}`); if (k !== lastFloor) { lastFloor = k; if (k) once('fl' + k, () => ctx.toast(['', '🛏️ <b>Phòng ở</b> của người gác đèn: giường, bếp lò, tủ. Ngày xưa người gác đèn sống ngay trong tháp để đêm nào cũng trông đèn.', '🗺️ <b>Phòng bản đồ hải trình</b>: tấm hải đồ trên bàn vẽ đảo Rubik, Học viện Pha Lê và vòng tròn ¼ hải lý quanh hải đăng.', '⚙️ <b>Phòng máy</b>: quả nặng treo dây kéo bộ bánh răng (như đồng hồ quả lắc) làm thấu kính trên đỉnh quay đều 13 giây một vòng.'][k], 7000)); } }
      else { lastFloor = -1; const fib = FIB_STEPS.includes(sn); keeper.chip(`🪜 Bậc <b>${sn}</b>/144 · cao ${(sn * T.RISE).toFixed(1).replace('.', ',')} m${fib ? ' · ✨ số Fibonacci' : ''}`); if (fib && sn >= 13) once('fib' + sn, () => { const i = FIB_STEPS.indexOf(sn); ctx.toast(`✨ Bậc <b>${sn}</b> là số Fibonacci: ${FIB_STEPS[i - 2]} + ${FIB_STEPS[i - 1]} = <b>${sn}</b>.`, 5000); ctx.sfx && ctx.sfx('ok'); }); }
    } else if (top) {
      if (!st.top) { st.top = 1; keeper.save(); ctx.reward && ctx.reward(2, 'Leo 144 bậc lên đỉnh hải đăng'); ctx.sfx && ctx.sfx('win'); ctx.toast('🏅 Em đã leo đủ <b>144 bậc</b> = 144 × 0,18 m ≈ <b>26 m</b>! 144 vừa là số Fibonacci thứ 12, vừa bằng 12 × 12. Ra <b>ban công</b> ngắm toàn cảnh nhé. ⭐ +2', 8000); }
      const b = -player.cam.yaw, here = [['Đảo Rubik', 0, 0, ISLAND_R], ['Học viện Pha Lê', ACADEMY.c[0], ACADEMY.c[1], 144]].map(([n, x, z, rad]) => ({ n, d: Math.hypot(x - C[0], z - C[1]) - rad, off: Math.abs(wrap(Math.atan2(x - C[0], -(z - C[1])) - b)) })).find(q => q.off < 0.4);
      keeper.chip(`🧭 Nhìn về hướng <b>${dirName(b)}</b>${here ? ` · ${here.n} cách ${Math.round(here.d)} m ≈ ${(here.d / 1852).toFixed(2).replace('.', ',')} hải lý` : ''}`);
      if (r < T.R1 - T.WALL && !keeper.isOpen) ctx.offer('🔦 Điều khiển đèn: dẫn tàu về bến', () => keeper.run('ship'), 8.5);
    } else keeper.chip(null);
    if (busy || keeper.isOpen) return;
    if (r < R_BOUND && !greeted && pp.y > 0.5) { greeted = true; ctx.toast('🗼 <b>Hải đăng Mũi Sóng</b> — tháp cao 34 m trên đảo đá. Tìm <b>ông Bảy gác đèn</b> trước cửa tháp, rồi leo 144 bậc lên buồng đèn!', 6500); }
    if (Math.hypot(pe - KP[0], pn - KP[1]) < 3.4 && Math.abs(yr) < 2) ctx.offer('💬 Nói chuyện với ông Bảy gác đèn', () => keeper.open(), 8.5);
    if (pe > PIER.e1 - 9 && pe < PIER.e1 + 1 && Math.abs(pn) < 4 && pp.y < PIER_Y + 2 && pp.y > 0.5) ctx.offer('⛵ Đi thuyền về đảo Rubik', () => rideStart(-1), 8);
    if (Math.hypot(pe - 9.4, pn - 3.6) < 2.2 && Math.abs(yr) < 2) ctx.offer('🌙 Xem đồng hồ thuỷ triều', () => { const M = moonInfo(sky.state.moonPhase); ctx.toast(`🌙 ${M.icon} <b>${M.name}</b> → <b>${M.kind}</b>. Lúc này nước ${TD.level >= 0 ? 'cao hơn' : 'thấp hơn'} mực trung bình <b>${Math.abs(TD.level).toFixed(1).replace('.', ',')} m</b> và đang <b>${TD.rising ? 'lên' : 'xuống'}</b>.`, 7000); }, 8);
    if (fx.bottle.visible && Math.hypot(pe - fx.bl[0], pn - fx.bl[1]) < 3.4 && pp.y < 1.5) ctx.offer('🍾 Nhặt chai thư', () => { st.bottle = 1; keeper.save(); fx.bottle.visible = false; ctx.sfx && ctx.sfx('open'); keeper.note('🍾 Thư trong chai', '<i>«Gửi người tìm thấy chai này: kho báu của thuyền trưởng <b>Sóng Bạc</b> nằm dưới đáy biển. Từ chân ngọn hải đăng, đi đúng <b>55 m</b> về hướng <b>Mặt Trời lặn</b> rồi lặn xuống. Chúc may mắn!»</i><br><br>🧭 Mặt Trời lặn ở hướng nào nhỉ? Lên ban công nhìn dòng chữ chỉ hướng, hoặc hỏi ông Bảy về la bàn.', 'Đi tìm kho báu!'); }, 8.5);
    if (!st.chest && Math.hypot(pe - fx.chest.position.x, pn - fx.chest.position.z) < 3.4 && pp.y < -3) ctx.offer('🧰 Mở rương thuyền trưởng', () => { st.chest = 1; keeper.save(); fx.mark.visible = false; ctx.reward && ctx.reward(3, 'Kho báu thuyền trưởng Sóng Bạc dưới chân hải đăng'); ctx.sfx && ctx.sfx('win'); ctx.toast('🧰 <b>Kho báu thuyền trưởng Sóng Bạc!</b> Trong rương có chiếc <b>la bàn đồng</b> và 3 ngôi sao. Em đã đi đúng 55 m về hướng <b>Tây</b> (hướng Mặt Trời lặn). ⭐ +3', 8000); }, 9);
  }
  return { update, keeper, tide, ride: { start: rideStart, seek: t => { if (ride) ride.t = t; }, get active() { return !!ride; }, get idle() { return idle; } }, get loaded() { return !!isle; }, get isle() { return isle; }, pier: { main: toWorld(me0 + 4, 0), isle: toWorld(PIER.e1 - 3, 0) }, door: toWorld(T.R0 + 2, 0), C, Y0, toWorld, toLocal, light: { get lit() { return lit; }, get beta() { return beta; } } };
}
