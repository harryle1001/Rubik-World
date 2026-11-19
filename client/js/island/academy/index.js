// academy/index.js — HỌC VIỆN PHA LÊ: nối đảo riêng vào thế giới.
// - Độ cao: bọc terrain.heightAt (đảo học viện tính giải tích, không lưới) → người, xe, máy bay, vật lý tự đi được trên đảo.
// - Tải theo khoảng cách (chunk): dựng khi cách mép đảo < 351 m (296 + 55), dỡ khi > 610 m.
// - Bến thuyền ở đảo chính ⇄ bến dưới chân lâu đài (ferry.js); đường băng + chỗ cất cánh cho máy bay (aircraft.js đọc ctx.runways…).
// - Bóng lâu đài trong sương từ xa (far.js).
import * as THREE from 'three';
import { ACADEMY } from '../layout.js';
import { Batch } from './geo.js';
import { matV, mat } from '../sample/palette.js';
import { BASE_Y as BASE, C, F, S, R_BOUND, heightAt as acadH, toWorld, toLocal, quayY, RUNWAY, QUAY, DOCK, ISLE, isleDist } from './plan.js';
import { buildIsland, plantIsland } from './island.js';
import { createFar } from './far.js';
import { createFerry } from './ferry.js';
import { createMagic, WOODS, CORES } from './magic.js';
import { createSpells } from './spells.js';
import { createAtmos } from './atmos.js';
import { createContent } from './content.js';
import { create as createPaintings } from './paintings.js';   // tranh biết cử động
import { create as createCreatures } from './creatures.js';   // sinh vật kỳ ảo
import { create as createTree } from './tree.js';             // cây cổ thụ biết nói
import { create as createHouses } from './houses.js';         // 4 nhà Tứ Linh: lễ chọn nhà, khăn áo màu nhà, điểm nhà
import { create as createCommons } from './commons.js';       // 4 lối vào bí mật + phòng sinh hoạt chung
import { create as createClasses } from './classes/index.js'; // lớp học phép thuật (mini game) + nhà kính
import { create as createWonders } from './wonders.js';       // phép thuật khắp nơi: trần trời, giáp, sách bay, ma, cú, tượng, cửa, nhạc nước
import { create as createAlley } from './alley.js';           // Phố Phép Thuật (hẻm mua sắm)
import { createWear } from './wear.js';                        // đồ mua ở Phố Phép Thuật: áo choàng, mũ, chổi, thú cưng
import { L as CL } from './castle.js';
import { createInterior } from './interior/index.js';   // nội thất 7 tầng (không gian phép trên cao)
import { createForest } from './forest.js';                // rừng phép thuật (thuỳ tây)
import { createLake } from './forest-lake.js';             // hồ trong rừng
import { createLife } from './forest-life.js';             // sinh vật phép thuật
import { createSecrets } from './forest-secrets.js';       // 13 bí mật, Bà Gạo kể cổ tích, nguyên liệu Pha Chế, bản đồ rừng
import { createGuide } from './guide.js';                 // biển chỉ đường + bản đồ nội thất (phím M)
import { createExterior } from './exterior.js';           // ngoại thất v2: máng xối rồng, đuốc, cờ, cầu kéo, cổng sắt, lối đi tường thành, vườn tượng, đồng hồ mặt trời
import { createBroom } from './broom.js';                 // Sân Bay Chổi + mini game bay qua vòng (câu hỏi)
import { createLife as createAcademyLife } from './life.js';// sự kiện theo giờ, lễ hội theo mùa, Thần Bếp
import { createNorth } from './north.js';                 // v3: Sân Bắc nổi sau lâu đài — Cánh Bắc, Tháp Cú, đàn cú
import { createStairs } from './stairs.js';               // v3: Tháp Cầu Thang Phép — 4 nhịp thang tự xoay
import { createPractice } from './practice.js';           // v3: lớp thực hành phép ngoài trời ở Sân Bắc
import { createPho2 } from './pho2.js';                   // v3: Phố Phép Thuật Mới (nửa đông Sân Bắc)
import { createSeats } from './seats.js';                 // v4: ngồi mọi ghế (đọc, ăn, viết bài, thư cú) + bàn giáo viên
import { createPhoLife } from './pho-life.js';            // v4: khách dạo phố ở cả 2 Phố Phép Thuật

const LOAD = 351, UNLOAD = 610, PIER_Y = 1.6;
const CLASS_AT = [['class0', 'cls-light'], ['class1', 'cls-shape'], ['class1b', 'cls-creature'], ['potion', 'cls-brew']];   // điểm neo lớp (interior/plan.js) → lớp phép thuật (classes/index.js)

export function createAcademy(ctx) {
  const { terrain, scene, player } = ctx;
  // ---------- độ cao ----------
  const base = terrain.heightAt, RB2 = R_BOUND * R_BOUND;
  terrain.heightAt = (x, z) => { const dx = x - C[0], dz = z - C[1]; return dx * dx + dz * dz < RB2 ? Math.max(base(x, z), acadH(x, z)) : base(x, z); };

  // ---------- bến ở đảo chính: dò bờ theo hướng về học viện ----------
  const D = [C[0] / Math.hypot(C[0], C[1]), C[1] / Math.hypot(C[0], C[1])], N = [-D[1], D[0]];   // D: từ tâm thế giới ra học viện; N: ngang
  let r1 = 200, rs = 200;
  for (let r = 200; r < 420; r += 0.5) { const h = base(D[0] * r, D[1] * r); if (h < PIER_Y - 0.3 && r1 === 200) r1 = r; if (h < -1.6) { rs = r; break; } }
  const pr0 = r1 - 3, pr1 = rs + 21, PW = 1.5;   // cầu tàu: từ bờ cát ra 21 m quá chỗ nước sâu, rộng 3 m
  const pw = (r, n) => [D[0] * r + N[0] * n, D[1] * r + N[1] * n];
  const onPier = (x, z) => { const r = x * D[0] + z * D[1], n = x * N[0] + z * N[1]; return r > pr0 && r < pr1 && Math.abs(n) < PW; };
  {
    const b = new Batch(), len = pr1 - pr0;
    b.box(-PW, PW, PIER_Y - 0.25, PIER_Y, 0, len, '#a8744a');
    for (let k = 0; k <= len; k += 5) for (const s of [-1, 1]) b.cyl(s * (PW - 0.15), -3, k, 0.16, PIER_Y + 3.9, '#6e4a30', 6);   // cọc + trụ lan can
    for (const s of [-1, 1]) b.box(s * PW - 0.06, s * PW + 0.06, PIER_Y + 0.8, PIER_Y + 0.9, 0, len, '#6e4a30');
    for (const k of [8, len - 1]) for (const s of [-1, 1]) b.cyl(s * (PW + 0.3), PIER_Y, k, 0.08, 3, '#3a3344', 6);
    const lamp = new Batch(); for (const k of [8, len - 1]) for (const s of [-1, 1]) lamp.box(s * (PW + 0.3) - 0.2, s * (PW + 0.3) + 0.2, PIER_Y + 3, PIER_Y + 3.45, k - 0.2, k + 0.2, '#ffe3a0');
    const pg = new THREE.Group(); const [x0, z0] = pw(pr0, 0); pg.position.set(x0, 0, z0); pg.rotation.y = Math.atan2(D[0], D[1]); pg.name = 'academy-pier';
    const m1 = new THREE.Mesh(b.build(), matV()); m1.castShadow = m1.receiveShadow = true; pg.add(m1, new THREE.Mesh(lamp.build(), mat('lampGlow')));
    // biển tên
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
    k.font = 'bold 40px system-ui'; k.fillStyle = 'rgba(27,22,38,.78)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('⛵ Bến thuyền Học viện Pha Lê', 256, 49, 460);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(8.1, 1.5, 1); sp.position.set(0, PIER_Y + 4.6, 8); pg.add(sp);
    scene.add(pg);
  }

  // ---------- mặt đi thêm: cầu tàu, dốc đá + bến dưới chân lâu đài ----------
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99;
    if (onPier(x, z)) h = Math.max(h, PIER_Y);
    const dx = x - C[0], dz = z - C[1];
    if (dx * dx + dz * dz < RB2) { const [u, v] = toLocal(x, z), q = quayY(u, v); if (q !== null) h = Math.max(h, q); const k = isle && isle.castle.deckY(u, v); if (k != null && (y === undefined || y > k - 2.5)) h = Math.max(h, k); }
    return h;
  };

  // ---------- thuyền ----------
  const pierEnd = pw(pr1 + 4, 0), dock = toWorld(DOCK[0], DOCK[1]);
  const path = [pierEnd, pw(pr1 + 89, 0), toWorld(ISLE.u + ISLE.hu + 34, 0), toWorld(110, 0), toWorld(DOCK[0] + 13, DOCK[1] * 0.6), dock];
  const landB = toWorld(QUAY.u0 + 2.5, 10), landA = pw(pr1 - 3, 0);
  ctx.academyLook = [-S[0] - F[0] * 0.38, -S[1] - F[1] * 0.38];   // hướng nhìn khi cập bến lâu đài: lên dốc đá, chếch về vách
  const ferry = ctx.ferry = createFerry(ctx, { pierA: pierEnd, dockB: dock, pathAB: path, toAcademy: [landB[0], landB[1], QUAY.y], toMain: [landA[0], landA[1], PIER_Y] });

  // ---------- máy bay: vùng bay, đường băng, chỗ hạ cánh, tên vùng ----------
  const yawRw = Math.atan2(S[0], S[1]), rwStart = toWorld(RUNWAY.u, -RUNWAY.hl + 8);
  (ctx.runways = ctx.runways || []).push({
    y: RUNWAY.y + 0.05, start: rwStart, yaw: yawRw, name: 'đường băng Học viện',
    inside: (x, z) => { const [u, v] = toLocal(x, z); return Math.abs(u - RUNWAY.u) < RUNWAY.hw + 34 && Math.abs(v) < RUNWAY.hl + 21; },
  });
  (ctx.landTargets = ctx.landTargets || []).push(toWorld(RUNWAY.u, 0));
  (ctx.flyZones = ctx.flyZones || []).push((x, z) => {
    if (Math.hypot(x - C[0], z - C[1]) < R_BOUND + 89) return true;
    const t = Math.max(0, Math.min(ACADEMY.r, x * D[0] + z * D[1])); return Math.hypot(x - D[0] * t, z - D[1] * t) < 233;   // hành lang bay
  });
  ctx.swimZone = (x, z) => { const [u, v] = toLocal(x, z); return isleDist(u, v) < 34; };   // hồ + bờ đảo học viện: bơi được (dive.js)
  const prevZone = ctx.zoneAt;
  ctx.zoneAt = (x, z) => { const [u, v] = toLocal(x, z); return isleDist(u, v) < 13 ? ACADEMY.name : prevZone ? prevZone(x, z) : null; };

  // ---------- đũa phép: Tiệm Đũa Pha Lê cạnh cầu tàu đảo chính ----------
  const magic = ctx.magic = createMagic(ctx);
  const wear = ctx.wear = createWear(ctx);
  const spells = createSpells(ctx, magic, { toWorld, L: CL, Y: BASE }), content = createContent(ctx, magic, { toWorld, L: CL, Y: BASE });
  const extras = [createPaintings, createCreatures, createTree, createHouses, createCommons, createClasses, createWonders, createAlley].map(f => f(ctx, magic, { toWorld, toLocal, L: CL, Y: BASE }));   // mỗi mô-đun 1 file riêng
  const shop = pw(pr0 - 5, -7), shopY = base(shop[0], shop[1]);
  {
    const b = new Batch(), wood = '#a8744a', woodD = '#6e4a30';
    b.box(-2.1, 2.1, 0, 1.05, -0.6, 0.6, woodD); b.box(-2.2, 2.2, 1.05, 1.15, -0.7, 0.7, wood);                 // quầy 4,2 m
    for (const x of [-2, 2]) for (const z of [-1.3, 0.5]) b.cyl(x, 0, z, 0.08, 2.6, woodD, 6);
    b.gable(-2.5, 2.5, -1.7, 0.9, 2.6, 1.2, '#4f6f66');
    const glow = new Batch();
    WOODS.forEach((w, i) => { b.add(new THREE.CylinderGeometry(0.012, 0.02, 0.36, 5), w.col, -1.6 + i * 0.8, 1.33, 0, 0, 0, Math.PI / 2.4); glow.add(new THREE.OctahedronGeometry(0.035), CORES[i].col, -1.6 + i * 0.8 + 0.16, 1.39, 0); });
    const kg = new THREE.Group(); kg.position.set(shop[0], shopY, shop[1]); kg.rotation.y = Math.atan2(D[0], D[1]) + Math.PI / 2; kg.name = 'academy-wand-shop';
    const m1 = new THREE.Mesh(b.build(), matV()); m1.castShadow = true; kg.add(m1, new THREE.Mesh(glow.build(), new THREE.MeshBasicMaterial({ vertexColors: true })));
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
    k.font = 'bold 42px system-ui'; k.fillStyle = 'rgba(27,22,38,.8)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('🪄 Tiệm Đũa Pha Lê', 256, 49, 460);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(5.3, 1, 1); sp.position.set(0, 4.7, -0.4); kg.add(sp);
    scene.add(kg); ctx.colliders.push({ x: shop[0], z: shop[1], r: 1.6 });
  }

  // ---------- nội thất lâu đài: cửa phép ở đại sảnh, cổng chính, ban công tháp thiên văn ----------
  const Hh0 = CL.hall, A0 = CL.astro, face = (du, dv) => Math.atan2(du * F[0] + dv * S[0], du * F[1] + dv * S[1]);
  const DOORS = {   // [u, v, y, hướng mặt cửa (u, v)] ngoài lâu đài
    hall: [Hh0.u1 - 1.65, -5.3, BASE, -1, 0],   // sau ghép: dời từ tường sau (u0+1,7; v −7,2) ra mặt trong tường trước — chỗ cũ bị đồng hồ cát nhà (HALL_HOUSE.glass) che
    gate: [CL.box.u1 - CL.T - 0.05, -14, BASE, -1, 0], balcony: [A0.u + A0.r2 + 0.05, A0.v, BASE + A0.h1, 1, 0],
  };
  const interior = createInterior(ctx, { OX: C[0] - 44.5, OZ: C[1] - 27.5, exitTo: id => { const d = DOORS[id]; if (!d) return null; const [x, z] = toWorld(d[0] + d[3] * 2.4, d[1] + d[4] * 2.4); return [x, z, d[2], face(d[3], d[4]) + Math.PI]; } });
  const guide = createGuide(ctx, { toWorld, Y: BASE, interior }), ext = createExterior(ctx, { Y: BASE, toLocal }), broom = ctx.broomPitch = createBroom(ctx, magic, { Y: BASE, toWorld, toLocal }), life = ctx.academyLife = createAcademyLife(ctx, magic, { Y: BASE, toWorld, toLocal, interior, L: CL });
  const north = ctx.academyNorth = createNorth(ctx, magic, { Y: BASE, toWorld, toLocal }), v3 = [north, createStairs(ctx, { Y: BASE, toWorld, toLocal }), createPractice(ctx, magic, { Y: BASE, toWorld, toLocal }), createPho2(ctx, magic, { Y: BASE, toWorld, toLocal }), createSeats(ctx, magic, { Y: BASE, toWorld, toLocal, interior, L: CL }), createPhoLife(ctx, { Y: BASE, toWorld })];   // mô-đun mở rộng v3: build / unbuild / update
  let doorG = null;
  const buildDoors = () => {
    const b = new Batch(), gl = new Batch();
    for (const [u, v, y, du, dv] of Object.values(DOORS)) {
      const g0 = new Batch(); g0.box(-1.6, 1.6, 0, 4.9, -0.1, 0.12, '#6e4a30'); g0.box(-0.05, 0.05, 0, 4.6, 0.12, 0.18, '#3a2a1a'); g0.gable(-1.9, 1.9, -0.25, 0.3, 4.9, 1.3, '#4f6f66');
      const gg = new Batch(); gg.box(-1.85, -1.6, 0, 4.9, -0.05, 0.2, '#9fe6ff'); gg.box(1.6, 1.85, 0, 4.9, -0.05, 0.2, '#9fe6ff'); gg.box(-0.3, 0.3, 3.6, 4.2, 0.12, 0.22, '#e6b0ff');
      const [x, z] = toWorld(u, v), r = face(du, dv);
      b.list.push(g0.build().rotateY(r).translate(x, y, z)); gl.list.push(gg.build().rotateY(r).translate(x, y, z));
    }
    const g = new THREE.Group(); g.name = 'academy-interior-doors';
    g.add(new THREE.Mesh(b.build(), matV()), new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true })));
    for (const m of g.children) m.matrixAutoUpdate = false;
    scene.add(g); return g;
  };

  const forest = ctx.forest = createForest(ctx);
  forest.plug(ctx.forestLake = createLake(ctx, forest));
  forest.plug(ctx.forestLife = createLife(ctx, forest, magic));
  forest.plug(ctx.forestSecrets = createSecrets(ctx, forest, magic));

  // ---------- tải / dỡ theo khoảng cách ----------
  const far = createFar(ctx);
  let isle = null, planted = false; const boxes = ctx.boxes = ctx.boxes || [];
  const P = new THREE.Vector3(); let hallHi = false;
  function stream() {
    const p = ferry.riding || (ctx.aircraft && ctx.aircraft.flying) ? ctx.camera.position : player.pos;
    const [u, v] = toLocal(p.x, p.z), d = Math.max(0, isleDist(u, v));
    if (!isle && d < LOAD) { isle = buildIsland(ctx); isle.atmos = createAtmos(ctx, isle.group); boxes.push(...isle.castle.boxes); spells.build(isle.group); content.build(); for (const x of extras) x.build(); guide.build(); ext.build(); broom.build(); life.build(); for (const x of v3) x.build(); if (!planted) { plantIsland(ctx); planted = true; } }
    else if (isle && d > UNLOAD) { spells.unbuild(); content.unbuild(); for (const x of extras) x.unbuild(); guide.unbuild(); ext.unbuild(); broom.unbuild(); life.unbuild(); for (const x of v3) x.unbuild(); for (const b of isle.castle.boxes) { const k = boxes.indexOf(b); if (k >= 0) boxes.splice(k, 1); } isle.dispose(); isle = null; }
    far.moundOn = !isle;
    if (isle) isle.castle.group.visible = far.dist < 296 + 89;
    if (isle && !doorG) doorG = buildDoors(); if (doorG) doorG.visible = !!isle;
  }

  function update(dt) {
    ferry.update(dt);
    stream(); far.update();
    if (isle) { const t = performance.now() / 1000; isle.castle.update(dt, t, player.pos); isle.atmos.update(dt, t); for (const x of extras) x.update(dt, t); ext.update(dt, t); broom.update(dt, t); for (const x of v3) x.update(dt, t); }
    life.update(dt, performance.now() / 1000);
    forest.update(dt, performance.now() / 1000);
    magic.update(dt); wear.update(dt); spells.update(dt); content.update(dt, performance.now() / 1000); interior.update(dt); guide.update();
    if (ferry.riding || player.vehicle) return;
    const pp = player.pos;
    if (Math.hypot(pp.x - shop[0], pp.z - shop[1]) < 4.2) ctx.offer(magic.hasWand ? '🪄 Đổi đũa phép' : '🪄 Chọn đũa phép (miễn phí)', () => magic.chooseWand(!magic.hasWand), 9);
    if (Math.hypot(pp.x - pierEnd[0], pp.z - pierEnd[1]) < 8 && ferry.idle === 'A') ctx.offer('⛵ Đi thuyền tới Học viện Pha Lê', () => ferry.start(1), 8);
    else if (Math.hypot(pp.x - pierEnd[0], pp.z - pierEnd[1]) < 8) ctx.offer('⛵ Gọi thuyền đèn lồng', () => ferry.start(1), 8);
    const [qu, qv] = toLocal(pp.x, pp.z);
    if (isle) {   // tháp thiên văn: cầu thang xoắn bên trong (dịch chuyển) lên ban công 55 m / xuống sân
      const A = isle.castle.L.astro, da = Math.hypot(qu - A.u, qv - A.v);
      if (da < A.r + 3 && pp.y < BASE + 3) ctx.offer('🪜 Lên ban công tháp thiên văn', () => { const [x, z] = toWorld(A.u + A.r2 + 2.5, A.v); player.teleport(x, z, BASE + A.h1); }, 8);
      else if (da < A.deck && pp.y > BASE + A.h1 - 1) ctx.offer('🪜 Xuống sân', () => { const [x, z] = toWorld(A.u + A.r + 2.5, A.v); player.teleport(x, z, BASE); }, 8);
    }
    if (isle && !magic.hasWand) {   // lần đầu vào đại sảnh: thầy cô tặng đũa
      const Hh = CL.hall; if (qu > Hh.u0 && qu < Hh.u1 + 3 && Math.abs(qv) < Hh.v1 && pp.y < BASE + 3) {
        if (!hallHi) { hallHi = true; ctx.toast('🏰 Chào mừng tới <b>Đại sảnh</b>! Mỗi học sinh được tặng một cây đũa phép — hãy chọn cây của em.', 5000); }
        ctx.offer('🪄 Nhận đũa phép', () => magic.chooseWand(true), 9);
      }
    }
    if (interior.inside && !ctx.mgActive) for (const [aid, key] of CLASS_AT) {   // sau ghép: phòng học trống trong nội thất → mở lớp phép thuật (classes/)
      const a = interior.anchor(aid), g = ctx.miniGames && ctx.miniGames[key];
      if (a && g && Math.abs(pp.y - a.pos[1]) < 2.5 && Math.hypot(pp.x - a.pos[0], pp.z - a.pos[2]) < 5.5) { ctx.offer('📖 Học ' + g.name, () => ctx.mg.start(key, { x: 0, z: 0, n: g.name }), 8.5); break; }
    }
    if (isle && !interior.inside) for (const [id, [u, v, y]] of Object.entries(DOORS)) if (Math.hypot(qu - u, qv - v) < 3.2 && Math.abs(pp.y - y) < 2.5) ctx.offer(id === 'balcony' ? '🚪 Vào Tháp Chính (cầu thang xoắn xuống các tầng)' : '🚪 Vào trong lâu đài (7 tầng)', () => interior.enter(id), 8.5);
    if (qu > QUAY.u0 - 2 && qu < QUAY.u0 + QUAY.w + 4 && qv > -3 && qv < QUAY.v1 + 3 && Math.abs(pp.y - QUAY.y) < 2) ctx.offer('⛵ Đi thuyền về đảo Rubik', () => ferry.start(-1), 8);
  }
  return { update, far, ferry, magic, interior, toWorld, toLocal, L: CL, Y: BASE, anchors: interior.anchors, forest, get loaded() { return !!isle; }, pier: { end: pierEnd, start: pw(pr0, 0) }, shop };
}
