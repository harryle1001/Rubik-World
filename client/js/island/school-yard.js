// school-yard.js — SÂN TRƯỜNG SỐNG ĐỘNG (bổ sung, không sửa bộ mẫu cổng/quảng trường/mặt tiền): khoảng sân trống phía đông
// lớp Lắp ráp điện (x 49–61) thành VƯỜN TRƯỜNG học sinh trồng rau + NHÀ XE ĐẠP.
// - Vườn 13 × 8 m (≈ φ): 5 luống (Fibonacci) cà rốt, ngô, cà chua, rau xanh; hàng rào gỗ thấp, bảng "Vườn trường", xô tưới, xẻng.
//   Tưới rau (nút ✋/E): mỗi ngày 1 lần, rau lớn dần qua 3 lần tưới (3 ngày) → thu hoạch +1 ⭐ kèm 1 điều về cây xanh.
//   2 bạn học sinh chăm vườn (ngồi xổm nhổ cỏ, đứng tưới) — chỉ chạy animation khi người chơi ở gần (≤ 34 m).
// - Nhà xe đạp: mái tôn trên cột thép, 8 xe đạp CC0 (OpenGameArt "32 low poly models") dựng theo giá.
// Model CC0 có sẵn: kit/farm_*, prop_*, fence_picket_low, vehicle_bicycle (CREDITS.txt). Dựng sau khi trường xong (không chậm lúc vào game).
import * as THREE from 'three';
import { Batch } from './decor.js';
import { toon } from './style.js';
import { placeKit } from './kit.js';
import { loadHero, driveHero, emote } from './characters.js';
import { PHI, TOWN_Y } from './layout.js';
import { PAL } from './sample/palette.js';

const PH = n => PAL[n].hex, Y = TOWN_Y, KEY = 'island.garden';
const G = { x0: 49, z0: -7, w: 13, d: 8 }, SHED = { x0: 49.5, z0: 4.5, w: 12, d: 3.4 };   // vườn 13 × 8, nhà xe 12 × 3,4 (≈ φ·2,1)
const FACTS = [
  'Cây cần <b>nước, ánh sáng, không khí</b> và đất để lớn lên.',
  'Lá cây hút khí <b>cacbonic</b> và nhả khí <b>ôxi</b> giúp chúng ta thở.',
  'Cà rốt có nhiều <b>vitamin A</b>, tốt cho mắt.',
  'Tưới cây vào <b>sáng sớm hoặc chiều mát</b> để nước không bay hơi nhanh.',
  'Giun đất làm <b>đất tơi xốp</b>, rễ cây dễ thở.',
];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export function createSchoolYard(ctx) {
  ctx.boxes = ctx.boxes || [];
  const scene = new THREE.Group(); scene.name = 'school-yard-root'; ctx.scene.add(scene);   // cả vườn + nhà xe 1 nhóm: xa > 89 m thì ẩn hết (0 draw call)
  let built = false, crops = [], kids = [], growK = -1;
  const st = () => load(KEY, { n: 0, day: '' });

  function build() {
    built = true;
    const B = new Batch('school-yard'), kits = {}, kit = (n, x, z, s = 1, ry = 0, y = Y) => (kits[n] = kits[n] || []).push([x, y, z, s, ry]);
    const { x0, z0, w, d } = G, cx = x0 + w / 2, cz = z0 + d / 2;
    // nền đất vườn + viền gạch; 5 luống đất cao 0,2 m, lối đi giữa luống 0,62 m
    B.box(w, 0.04, d, cx, Y, cz, '#9a6b45'); for (const [ww, dd, x, z] of [[w + 0.3, 0.15, cx, z0], [w + 0.3, 0.15, cx, z0 + d], [0.15, d, x0, cz], [0.15, d, x0 + w, cz]]) B.box(ww, 0.14, dd, x, Y, z, PH('stoneWarmD'));
    const N = 5, bw = (w - 1.2 - (N - 1) * 0.62) / N;
    for (let i = 0; i < N; i++) {
      const x = x0 + 0.6 + bw / 2 + i * (bw + 0.62); B.box(bw, 0.2, d - 1.6, x, Y, cz + 0.3, '#7a4f33'); B.box(bw + 0.08, 0.06, d - 1.52, x, Y + 0.2, cz + 0.3, '#5e3c27');
      for (let k = 0; k < 6; k++) crops.push({ x: x + (k % 2 ? 0.25 : -0.25) * (bw > 1.2 ? 1 : 0.6), z: z0 + 1.3 + k * (d - 2.2) / 5, kind: ['farm_carrot', 'farm_corn', 'prop_crate_tomatoes', 'farm_carrot', 'farm_corn'][i], i });
    }
    // hàng rào gỗ thấp (chừa cổng phía tây, nhìn ra sân), bảng tên, ghế, vòi nước
    for (let x = x0 + 0.5; x < x0 + w; x += 1) for (const z of [z0 - 0.35, z0 + d + 0.35]) kit('fence_picket_low', x, z, 1, Math.PI / 2);
    for (let z = z0 + 0.5; z < z0 + d; z += 1) { kit('fence_picket_low', x0 + w + 0.35, z, 1); if (Math.abs(z - cz) > 1.2) kit('fence_picket_low', x0 - 0.35, z, 1); }
    B.group(x0 - 0.9, Y, cz - 1.9, -Math.PI / 2, () => { for (const s of [-1, 1]) B.box(0.1, 1.5, 0.1, s * 0.75, 0, 0, PH('woodD')); B.box(1.8, 0.7, 0.08, 0, 0.9, 0, PH('wood')); B.box(1.62, 0.54, 0.02, 0, 0.98, 0.05, PH('stoneCreamL')); B.prism(1.95, 0.3, 0.3, 0, 1.6, 0, PH('roof')); });
    const sign = document.createElement('canvas'); sign.width = 256; sign.height = 96; { const g = sign.getContext('2d'); g.fillStyle = PH('stoneCreamL'); g.fillRect(0, 0, 256, 96); g.fillStyle = PH('ink'); g.textAlign = 'center'; g.font = 'bold 34px system-ui'; g.fillText('🌱 VƯỜN TRƯỜNG', 128, 42); g.font = '20px system-ui'; g.fillText('Lớp 3A chăm sóc', 128, 76); }
    const tex = new THREE.CanvasTexture(sign); tex.colorSpace = THREE.SRGBColorSpace;
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ map: tex })); sm.position.set(x0 - 0.98, Y + 1.25, cz - 1.9); sm.rotation.y = -Math.PI / 2; sm.name = 'school-yard-sign'; scene.add(sm);
    B.cyl(0.05, 0.05, 0.9, x0 - 0.6, Y, cz + 2.3, PH('ironL'), 6); B.box(0.25, 0.06, 0.06, x0 - 0.5, Y + 0.85, cz + 2.3, PH('ironL')); B.cyl(0.3, 0.32, 0.12, x0 - 0.6, Y, cz + 2.3, PH('stoneWarm'), 8);
    kit('prop_bucket', x0 + 0.9, cz - 3.4, 2.6); kit('prop_bucket', x0 + 1.4, cz - 3.3, 2.6); kit('prop_shovel', x0 + 1.9, cz - 3.4, 2.6, 0.4);
    kit('prop_bench', x0 - 1.6, cz + 0.9, 1.3, Math.PI / 2);
    ctx.boxes.push({ x0: x0 - 0.5, x1: x0 + w + 0.5, z0: z0 - 0.5, z1: z0 - 0.2, top: Y + 0.7 }, { x0: x0 - 0.5, x1: x0 + w + 0.5, z0: z0 + d + 0.2, z1: z0 + d + 0.5, top: Y + 0.7 }, { x0: x0 + w + 0.2, x1: x0 + w + 0.5, z0: z0, z1: z0 + d, top: Y + 0.7 });
    // NHÀ XE ĐẠP: 6 cột thép, mái tôn dốc 1 phía (dốc 1/φ³), xe xếp theo giá
    { const { x0: sx, z0: sz, w: sw, d: sd } = SHED, scx = sx + sw / 2, scz = sz + sd / 2, H = 2.6;
      B.box(sw, 0.06, sd, scx, Y, scz, PH('stoneWarmL'));
      for (let i = 0; i < 4; i++) for (const s of [0, 1]) B.box(0.1, H - s * sd / PHI ** 3, 0.1, sx + 0.2 + i * (sw - 0.4) / 3, Y, sz + 0.1 + s * (sd - 0.2), PH('iron'));
      B.box(sw + 0.5, 0.06, sd + 0.6, scx, Y + H - sd / PHI ** 3 / 2 - 0.02, scz, PH('shutter'), 0, Math.atan(1 / PHI ** 3));
      B.box(sw - 0.4, 0.05, 0.05, scx, Y + 0.45, sz + sd - 0.4, PH('ironL'));
      for (let i = 0; i < 8; i++) kit('vehicle_bicycle', sx + 0.9 + i * 1.4, sz + sd / 2 - 0.1, 0.9, Math.PI / 2 + (i % 2) * 0.06);
      ctx.boxes.push({ x0: sx + 0.3, x1: sx + sw - 0.3, z0: sz + 0.6, z1: sz + sd - 0.3, top: Y + 1.0 });
      B.group(sx - 0.6, Y, scz, Math.PI / 2, () => { B.box(0.08, 1.4, 0.08, 0, 0, 0, PH('iron')); B.box(0.7, 0.45, 0.04, 0, 1.2, 0.04, PH('shutterD')); });
      const s2 = document.createElement('canvas'); s2.width = 256; s2.height = 128; const g = s2.getContext('2d'); g.fillStyle = PH('shutterD'); g.fillRect(0, 0, 256, 128); g.fillStyle = '#fff'; g.font = '56px system-ui'; g.textAlign = 'center'; g.fillText('🚲', 128, 64); g.font = 'bold 24px system-ui'; g.fillText('NHÀ XE', 128, 110);
      const t2 = new THREE.CanvasTexture(s2); t2.colorSpace = THREE.SRGBColorSpace; const m2 = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.33), new THREE.MeshBasicMaterial({ map: t2 })); m2.position.set(sx - 0.65, Y + 1.43, scz); m2.rotation.y = -Math.PI / 2; m2.name = 'school-yard-sign'; scene.add(m2);
    }
    const m = B.mesh(toon('#ffffff', { vertexColors: true }), true); m.name = 'school-yard'; scene.add(m);
    for (const [n, l] of Object.entries(kits)) placeKit(scene, n, l, { shadow: n === 'vehicle_bicycle' });
    grow();
    // 2 bạn chăm vườn
    [['student-female-b', x0 + 4.1, cz - 1.5, 'floor', Math.PI / 2], ['student-male-c', x0 + 8.6, cz + 2.0, false, -Math.PI / 2]].forEach(([kind, x, z, sit, ry], i) => loadHero(kind, 1.25).then(h => { if (!h) return; h.npc = true; h.model.position.set(x, Y + 0.2, z); h.model.rotation.y = ry; scene.add(h.model); kids.push({ h, sit, st: {}, t: 2 + i * 3 }); }));
  }
  // rau lớn theo số lần tưới (0 → 3): 1 InstancedMesh/loại, dựng lại khi đổi giai đoạn
  let cropMeshes = [];
  function grow() {
    const k = Math.min(3, st().n); if (k === growK) return; growK = k;
    for (const ms of cropMeshes) for (const m of ms) { scene.remove(m); m.dispose && m.dispose(); } cropMeshes = [];
    const s = [0.35, 0.55, 0.8, 1.0][k], by = {};
    for (const c of crops) (by[c.kind] = by[c.kind] || []).push([c.x, Y + 0.2, c.z, c.kind === 'prop_crate_tomatoes' ? s * 0.3 : s, c.i + c.z]);
    for (const [n, l] of Object.entries(by)) placeKit(scene, n, l, { shadow: false }).then(ms => cropMeshes.push(ms));
  }
  function water() {
    const s = st(), today = new Date().toDateString();
    if (s.day === today) { ctx.toast && ctx.toast('💧 Hôm nay vườn đã được tưới rồi. <b>Mai</b> em quay lại tưới tiếp nhé!', 3500); return; }
    s.n = (s.n || 0) + 1; s.day = today; const fact = FACTS[(s.n - 1) % FACTS.length];
    if (s.n >= 4) { s.n = 0; ctx.reward && ctx.reward(1, 'Thu hoạch rau ở vườn trường'); ctx.toast && ctx.toast(`🥕 <b>Thu hoạch!</b> Rau đã lớn, cả lớp có rau cho bữa trưa. +1 ⭐<br>${fact}`, 5000); ctx.sfx && ctx.sfx('win'); }
    else { ctx.toast && ctx.toast(`💧 Em đã tưới rau (${s.n}/3). ${fact}`, 4500); ctx.sfx && ctx.sfx('ui'); }
    save(KEY, s); grow();
    const p = ctx.player; p.hero && emote(p.hero, p.heroState || {}, 'interact');
  }
  const DV = { speed: 0, grounded: true, sitting: false };
  function update(dt) {
    if (!built) { if (ctx.school && ctx.school.ready) build(); return; }
    const p = ctx.player.pos, dx = p.x - (G.x0 + G.w / 2), dz = p.z - (G.z0 + G.d / 2), far = Math.abs(dx) > 34 || Math.abs(dz) > 34;
    scene.visible = Math.abs(dx) < 89 && Math.abs(dz) < 89;
    if (Math.abs(dx) < G.w / 2 + 1.6 && Math.abs(dz) < G.d / 2 + 1.6 && !ctx.player.vehicle) ctx.offer && ctx.offer(st().day === new Date().toDateString() ? '🌱 Vườn trường (đã tưới hôm nay)' : '💧 Tưới rau vườn trường', water, 1);
    for (const k of kids) {
      k.h.model.visible = !far; if (far) continue;
      DV.sitting = k.sit; driveHero(k.h, { ...DV, oneShot: k.st.oneShot });
      if ((k.t -= dt) < 0) { k.t = 4 + Math.random() * 4; emote(k.h, k.st, k.sit ? 'pickup' : 'interact'); }
      k.h.anim.update(dt);
    }
  }
  return { update, water };
}
