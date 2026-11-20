// tools/collide-test.mjs — Kiểm thử LƯỚI VA CHẠM CHUNG (collide.js): nhân vật chạy thẳng vào ≥ 30 vật khác loại ở nhiều khu
// (cây, ghế đá, cột đèn, đá, hàng rào, sạp, thùng rác, bồn cây, lều, đồ nội thất…) → không xuyên, không kẹt, đi vòng qua được.
// Chạy: node server/index.js &  rồi  node tools/collide-test.mjs <thư-mục-ảnh> [--mobile] [--n=40]
// In JSON kết quả từng ca + chi phí JS/khung của collide.js (update + resolve + camClear) khi đi lại.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'docs/shots/collide';
const N = +((process.argv.find(a => a.startsWith('--n=')) || '--n=40').slice(4)), sfx = MOBILE ? '-mobile' : '';
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' } : { viewport: { width: 1280, height: 800 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); localStorage.setItem('island.intro', '1'); localStorage.setItem('island.grade', '3'); } catch (e) {} });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.player.hero, null, { timeout: 300000 });
await page.locator('#accBox button[data-a="guest"]').first().click({ timeout: 60000 }).catch(() => {});
await page.waitForTimeout(500); await page.evaluate(() => document.getElementById('accBox') && document.getElementById('accBox').remove());
await page.evaluate(() => setInterval(() => { if (document.getElementById('stSay') && document.body.classList.contains('st-cut')) dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); }, 400));
await page.waitForTimeout(9000);
await page.waitForFunction(() => !document.body.classList.contains('st-cut') && !__island.freeCam, null, { timeout: 20000 }).catch(() => {});
await page.waitForFunction(() => !__island.player.frozen && !__island.loading.veil, null, { timeout: 60000 }).catch(() => {});
await page.evaluate(() => Object.defineProperty(__island.sky.state, 'hour', { get: () => 10, set() {}, configurable: true }));
const B = (fn, a) => page.evaluate(fn, a);

// ---------- trong trang: đo chi phí collide.js, điều khiển nhân vật, tìm vật thử ----------
await B(() => {
  const c = __island, C = c.collide, P = c.player, W = c.CFG ? c.CFG.island.waterLevel : 0;
  const T = window.__ct = { ms: 0, frames: 0, drive: null, log: null };
  T.gt = 0; { const u = P.update; P.update = function (dt) { T.gt += dt; return u.call(this, dt); }; }   // thời gian TRONG GAME (máy thử chậm: dt bị kẹp)
  for (const k of ['update', 'resolve', 'camClear']) { const f = C[k]; C[k] = function () { const t = performance.now(); const r = f.apply(this, arguments); T.ms += performance.now() - t; return r; }; }
  const sup = (x, z, y = 99) => Math.max(c.terrain.heightAt(x, z), c.groundExtra ? c.groundExtra(x, z, y) : -99);
  T.sup = sup; T.W = W;
  // chặn = ô lưới collide.js HOẶC vòng tròn cũ ctx.colliders (cây terrain.js…) — đúng những gì player.js dùng
  T.blk = (x, z, y, g) => C.blocked(x, z, y, g) || (c.grid ? c.grid.near(x, z).cols : c.colliders).some(q => Math.hypot(q.x - x, q.z - z) < q.r);
  // khoảng cách từ (x, z) tới ô chặn gần nhất (chân y)
  T.clear = (x, z, y) => { let best = 9; const g = sup(x, z, y); for (let cj = Math.floor((z - 1) / C.CS); cj <= Math.floor((z + 1) / C.CS); cj++) for (let ci = Math.floor((x - 1) / C.CS); ci <= Math.floor((x + 1) / C.CS); ci++) {
    const cx = (ci + 0.5) * C.CS, cz = (cj + 0.5) * C.CS; if (!C.blocked(cx, cz, y, g)) continue; const qx = Math.max(ci * C.CS, Math.min(x, ci * C.CS + C.CS)), qz = Math.max(cj * C.CS, Math.min(z, cj * C.CS + C.CS)); best = Math.min(best, Math.hypot(x - qx, z - qz)); }
    for (const q of (c.grid ? c.grid.near(x, z).cols : c.colliders)) best = Math.min(best, Math.hypot(q.x - x, q.z - z) - q.r); return best; };
  // vòng điều khiển: mỗi khung đặt cần điều khiển hướng tới đích (bù góc camera); ghi nhật ký
  const loop = () => {
    T.frames++; const D = T.drive;
    if (D) {
      const p = P.pos; if (D.g0 == null) D.g0 = T.gt; const t = T.gt - D.g0;
      if (D.wx != null && Math.hypot(D.wx - p.x, D.wz - p.z) < 1.2) D.wx = null;
      const tx = D.wx ?? D.gx, tz = D.wz ?? D.gz; let ux = tx - p.x, uz = tz - p.z; const L0 = Math.hypot(ux, uz) || 1; ux /= L0; uz /= L0; const L = Math.hypot(D.gx - p.x, D.gz - p.z);
      if (D.avoid) {   // đi vòng: chậm lại (vướng) → né sang một bên một lúc
        const v = Math.hypot(P.vel.x, P.vel.z); if (v < 1 && t > 0.4 && D.side <= 0) { D.side = 0.9; D.s = -D.s; } if (D.side > 0) { D.side -= 1 / 60; const px = -uz * D.s, pz = ux * D.s; ux += px * 1.6; uz += pz * 1.6; const l = Math.hypot(ux, uz); ux /= l; uz /= l; }
      }
      const y = c.player.cam.yaw; P.input.x = Math.cos(y) * ux - Math.sin(y) * uz; P.input.z = Math.sin(y) * ux + Math.cos(y) * uz;
      // khoảng hở nhỏ nhất dọc đoạn đi được giữa 2 khung (bắt cả trường hợp "nhảy cóc" qua vật khi khung chậm)
      let cl = 9; const lx = D.lx ?? p.x, lz = D.lz ?? p.z, sn = Math.max(1, Math.ceil(Math.hypot(p.x - lx, p.z - lz) / 0.1)); for (let k = 1; k <= sn; k++) cl = Math.min(cl, T.clear(lx + (p.x - lx) * k / sn, lz + (p.z - lz) * k / sn, p.y)); D.lx = p.x; D.lz = p.z;
      (D.path = D.path || []).length < 400 && D.path.push([+p.x.toFixed(2), +p.z.toFixed(2)]);
      const s = (p.x - D.cx) * D.ux + (p.z - D.cz) * D.uz;
      D.maxS = Math.max(D.maxS, s); D.minClear = Math.min(D.minClear, cl); D.minDist = Math.min(D.minDist, Math.hypot(p.x - D.cx, p.z - D.cz));
      if (t > D.dur || (D.avoid && L < 1.2)) { P.input.x = P.input.z = 0; D.done = true; D.end = [p.x, p.z]; D.L = L; T.drive = null; }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  // vật thử: bản sao InstancedMesh theo nhóm tên (nhiều khu khác nhau)
  const KINDS = [
    ['cây', /^(nature-(oak|pine|pineTall|birch|palm|palmB|round|autumn|fat|phuong))$|^school-phuong$/],
    ['đá', /^(nature-rock[LT]|kit-rock_(large|tall|shore_a|shore_b))$/],
    ['ghế', /^kit-prop_bench$|^sea-ghe$/], ['đèn', /^kit-prop_(lantern|light_apron)$/], ['hàng rào', /^kit-fence_(simple|picket_low)$/],
    ['sạp', /^kit-prop_stall_(red|green)$/], ['thùng rác', /^(school-)?kit-prop_bin$/], ['bồn cây', /^kit-prop_planter$/], ['biển chỉ đường', /^kit-prop_signpost$/],
    ['ô bãi biển', /^kit-prop_beach_umbrella$/], ['thùng hàng', /^kit-(prop_crate_\w+|barrels)$/], ['lều', /^kit-tent$/], ['xe đỗ', /^kit-(vehicle_\w+|tractor)$/],
    ['gốc/khúc gỗ', /^(nature-(stump|log)|kit-log)$/], ['bụi', /^(nature-bush|school-kit-bush)$/], ['cột sân bay', /^kit-air_(fuel_tank|container_a|container_c)$/],
  ];
  T.targets = () => {
    const out = [], m4 = new THREE.Matrix4(), w = new THREE.Matrix4(), v = new THREE.Vector3(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    c.scene.traverse(o => { if (!o.isInstancedMesh || !o.count) return; const K = KINDS.find(k => k[1].test(o.name)); if (!K) return;
      for (let n = 0; n < 6; n++) { const i = Math.floor(rnd() * o.count); o.getMatrixAt(i, m4); w.multiplyMatrices(o.matrixWorld, m4); v.setFromMatrixPosition(w); out.push({ kind: K[0], name: o.name, i, x: v.x, z: v.z }); } });
    // ghế đá sân trường: 1,95 m phía nam gốc phượng (zone-school.js)
    c.scene.traverse(o => { if (o.isInstancedMesh && o.name === 'school-phuong') for (let i = 0; i < Math.min(o.count, 6); i++) { o.getMatrixAt(i, m4); w.multiplyMatrices(o.matrixWorld, m4); v.setFromMatrixPosition(w); out.push({ kind: 'ghế đá', name: 'zone-school stoneBench', i, x: v.x, z: v.z + 1.95 }); } });
    return out;
  };
});
await B(() => { window.THREE = window.THREE; });
const hasThree = await B(() => !!window.THREE);
if (!hasThree) await B(async () => { window.THREE = await import('three'); });
const all = await B(() => __ct.targets());
// trộn: lấy xoay vòng theo loại để đủ loại + nhiều khu
const byKind = {}, seenT = new Set(); for (const t of all) { const id = t.name + ':' + t.i + ':' + Math.round(t.x); if (seenT.has(id)) continue; seenT.add(id); (byKind[t.kind] = byKind[t.kind] || []).push(t); }
const pick = []; for (let r = 0; pick.length < N * 3 && r < 12; r++) for (const k in byKind) if (byKind[k][r]) pick.push(byKind[k][r]);
console.log('vật tìm được:', all.length, Object.keys(byKind).map(k => k + '×' + byKind[k].length).join(' '));

const res = []; let shots = 0;
for (const t of pick) {
  if (res.filter(r => r.ok !== undefined).length >= N) break;
  // tới gần, nạp lưới quanh đó
  const prep = await B(async t => {
    const c = __island, C = c.collide, T = __ct, P = c.player;
    P.vehicle && c.vehicles && c.vehicles.exit && c.vehicles.exit();
    const gy = T.sup(t.x, t.z); if (!(gy > T.W + 0.3)) return { skip: 'dưới nước' };
    P.teleport(t.x + 7, t.z + 7); C.scan(); await new Promise(r => setTimeout(r, 300)); C.scan(); for (let k = 0; k < 6; k++) { C.plan(); C.work(400); await new Promise(r => setTimeout(r, 30)); }
    // vật có chặn không (ô chặn trong 0,7 m quanh tâm)
    let blk = 0; for (let a = 0; a < 16; a++) for (const r of [0, 0.2, 0.4, 0.7]) if (T.blk(t.x + Math.cos(a) * r, t.z + Math.sin(a) * r, gy, gy)) blk++;
    if (!blk) return { skip: 'không có ô chặn (vật thấp ≤ 0,4 m hoặc chưa nạp)', gy };
    // bán kính vật theo hướng: chọn hướng tiếp cận mà đường tới & điểm sau lưng vật đều trống, mặt đất phẳng
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8 + 0.2, ux = Math.cos(a), uz = Math.sin(a);
      let rc = 0; for (let r = 0; r < 3; r += 0.1) { if (T.blk(t.x - ux * r, t.z - uz * r, gy, gy)) rc = r; else if (r > rc + 0.3 && rc > 0) break; }   // mép vật phía người tới (vùng chặn liền tâm)
      let rb = 0; for (let r = 0; r < 3; r += 0.1) { if (T.blk(t.x + ux * r, t.z + uz * r, gy, gy)) rb = r; else if (r > rb + 0.3 && rb > 0) break; }
      const s0 = rc + 3.2, sx = t.x - ux * s0, sz = t.z - uz * s0, gx = t.x + ux * (rb + 2.2), gz = t.z + uz * (rb + 2.2);
      let ok = true;
      for (let r = rc + 0.6; r <= s0 && ok; r += 0.2) { const x = t.x - ux * r, z = t.z - uz * r, h = T.sup(x, z, gy + 0.5); if (Math.abs(h - gy) > 0.35 || T.clear(x, z, h) < 0.45) ok = false; }
      if (!ok) continue; const hg = T.sup(gx, gz, gy + 0.5); if (Math.abs(hg - gy) > 0.35 || T.clear(gx, gz, hg) < 0.5) continue;
      // không có vật cản cũ (cols/boxes) chắn trên đường
      // lối vòng: điểm bên trái hoặc phải vật (cách tâm max(rc, rb) + 1,3 m) trống, phẳng
      let wx = null, wz = null; const rs = Math.max(rc, rb, 0.4) + 1.3;
      for (const sd of [1, -1]) { const x = t.x - uz * sd * rs, z = t.z + ux * sd * rs, h = T.sup(x, z, gy + 0.5); if (Math.abs(h - gy) < 0.35 && T.clear(x, z, h) > 0.5) { wx = x; wz = z; break; } }
      if (wx === null) continue;
      return { sx, sz, gx, gz, wx, wz, ux, uz, rc, rb, gy };
    }
    return { skip: 'không tìm được hướng tiếp cận trống', gy };
  }, t);
  if (prep.skip) { res.push({ ...t, skip: prep.skip }); continue; }
  // 1) chạy thẳng vào vật 2,4 s
  const ready = await B(async ([t, p]) => { const c = __island, P = c.player, C = c.collide; P.teleport(p.sx, p.sz); P.setRot(Math.atan2(p.ux, p.uz)); c.player.cam.yaw = Math.atan2(-p.ux, -p.uz); c.player.snapCamera();
    await new Promise(r => setTimeout(r, 400)); C.scan(); await new Promise(r => setTimeout(r, 200)); C.scan(); for (let k = 0; k < 4; k++) { C.plan(); C.work(300); }
    let blk = 0; for (let a = 0; a < 16; a++) for (const r of [0, 0.2, 0.4]) if (__ct.blk(t.x + Math.cos(a) * r, t.z + Math.sin(a) * r, p.gy, p.gy)) blk++; return blk > 0; }, [t, prep]);
  if (!ready) { res.push({ ...t, skip: 'vật vừa bị gỡ/nạp lại (vùng đổi cấp chi tiết)' }); continue; }
  await B(([t, p]) => { __ct.drive = { t0: performance.now(), dur: 2.4, gx: t.x, gz: t.z, cx: t.x, cz: t.z, ux: p.ux, uz: p.uz, maxS: -99, minClear: 9, minDist: 99 }; __ct.d1 = __ct.drive; }, [t, prep]);
  await page.waitForFunction(() => __ct.d1.done, null, { timeout: 60000 });
  const d1 = await B(() => { const d = __ct.d1; return { maxS: d.maxS, minClear: d.minClear, minDist: d.minDist }; });
  if (shots < 8 && (shots < 4 || res.length % 3 === 0)) { await page.screenshot({ path: `${OUT}/${String(shots + 1).padStart(2, '0')}-${t.kind.replace(/[^a-zà-ỹ]/gi, '')}${sfx}.png` }); shots++; }
  // 2) đi vòng ra sau vật (≤ 9 s)
  await B(([t, p]) => { __ct.drive = { t0: performance.now(), dur: 9, gx: p.gx, gz: p.gz, cx: t.x, cz: t.z, ux: p.ux, uz: p.uz, maxS: -99, minClear: 9, minDist: 99, avoid: true, s: 1, side: 0, wx: p.wx, wz: p.wz }; __ct.d2 = __ct.drive; }, [t, prep]);
  await page.waitForFunction(() => __ct.d2.done, null, { timeout: 60000 });
  const d2 = await B(() => { const d = __ct.d2; return { L: d.L, minClear: d.minClear, path: d.path.filter((_, i) => i % 4 === 0) }; });
  // chưa tới đích: thử 8 hướng × 0,6 s — "kẹt cứng" chỉ khi KHÔNG hướng nào đi được ≥ 0,3 m
  let free = d2.L <= 1.3;
  if (!free) for (let k = 0; k < 8 && !free; k++) {
    const a0 = await B(() => [__island.player.pos.x, __island.player.pos.z]);
    await B(k => { const p = __island.player.pos, a = k * Math.PI / 4; __ct.drive = { dur: 0.6, gx: p.x + Math.cos(a) * 9, gz: p.z + Math.sin(a) * 9, cx: 1e5, cz: 1e5, ux: 0, uz: 1, maxS: -99, minClear: 9, minDist: 99 }; __ct.d3 = __ct.drive; }, k);
    await page.waitForFunction(() => __ct.d3.done, null, { timeout: 60000 });
    const a1 = await B(() => [__island.player.pos.x, __island.player.pos.z]); if (Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) > 0.3) free = true;
  }
  // xuyên = tâm người vượt quá mặt trước vật (s > -rc + 0.05) ; chạm hợp lệ = cách ô chặn ≥ R0 − 0,03
  const through = Math.min(d1.minClear, d2.minClear) < 0.05, tooClose = Math.min(d1.minClear, d2.minClear) < 0.35 - 0.03, stuck = !free;
  res.push({ kind: t.kind, name: t.name, x: +t.x.toFixed(1), z: +t.z.toFixed(1), rc: +prep.rc.toFixed(2), maxS: +d1.maxS.toFixed(2), clear: +Math.min(d1.minClear, d2.minClear).toFixed(2), around: +d2.L.toFixed(2), path: d2.L > 1 ? d2.path : undefined, wp: d2.L > 1 ? [prep.sx, prep.sz, prep.wx, prep.wz, prep.gx, prep.gz].map(v => +v.toFixed(1)) : undefined, ok: !through && !tooClose && !stuck, through, tooClose, stuck });
  console.log(JSON.stringify(res[res.length - 1]));
}
// chi phí JS/khung khi đi lại (collide.js: quét + nạp chunk + tra va chạm + camera)
const cost = await B(async () => { const T = __ct; T.ms = 0; T.frames = 0; const P = __island.player; P.teleport(-65, 9); const t0 = performance.now();
  T.drive = { t0, dur: 12, gx: 60, gz: 60, cx: 1e5, cz: 1e5, ux: 0, uz: 1, maxS: -99, minClear: 9, minDist: 99, avoid: true, s: 1, side: 0 };
  await new Promise(r => setTimeout(r, 12500)); return { msPerFrame: +(T.ms / T.frames).toFixed(4), frames: T.frames, stats: __island.collide.stats() }; });
const done = res.filter(r => r.ok !== undefined), pass = done.filter(r => r.ok).length;
const summary = { mobile: MOBILE, tested: done.length, pass, kinds: [...new Set(done.map(r => r.kind))], skipped: res.filter(r => r.skip).length, cost, errors: errors.slice(0, 10) };
console.log('TÓM TẮT', JSON.stringify(summary));
fs.writeFileSync(`${OUT}/result${sfx}.json`, JSON.stringify({ summary, res }, null, 1));
await browser.close();
