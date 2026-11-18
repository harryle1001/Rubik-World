// tools/perf-world.mjs — Đo phần THẾ GIỚI 3D (cây, cỏ, hoa, đá, địa hình, nước, bóng đổ, sương) ở chế độ ĐIỆN THOẠI
// (390×844, DPR 2, cảm ứng, UA iPhone → CFG.isMobile; chất lượng khoá mức --q, mặc định 1 = mức điện thoại khởi đầu; giờ khoá 13h).
// Chạy: node server/index.js &  rồi  node tools/perf-world.mjs [--out=docs/perf/world/x] [--q=1] [--json=file]
// 5 điểm: cổng trường · quảng trường · thị trấn · rừng/đồi · bờ biển. Mỗi điểm trung bình 55 khung, in:
//   calls/tris (cả khung) · sh (draw call pass bóng đổ) · js (ms JS/khung ngoài lúc vẽ) · gpu (ms vẽ + chờ GPU đồng bộ, SwiftShader
//   → chỉ so sánh tương đối) · top (nhóm vật tốn draw call nhất, theo tên mesh).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), Q = +(arg('q') ?? 1), N = 55;
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
// đo thời gian mỗi lần gọi requestAnimationFrame (= cả khung: cập nhật JS + vẽ)
await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.__rafMs = 0; window.requestAnimationFrame = cb => raf(t => { const s = performance.now(); cb(t); window.__rafMs += performance.now() - s; }); });
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(q => {
  const c = __island, R = c.renderer; c.setQuality(q, true); c.sky.state.lock = 13; R.info.autoReset = false;
  const P = window.__pm = { n: 0, calls: 0, tris: 0, sh: 0, ms: 0, raf0: 0, by: {} };
  const rbd = R.renderBufferDirect.bind(R);
  R.renderBufferDirect = function (cam, sc, geo, mat, obj, grp) {
    if (P.on) { const shadow = sc === null;   // WebGLShadowMap gọi với scene = null
      if (shadow) P.sh++; else { const k = (obj.name || obj.parent?.name || obj.type).replace(/[-_ ]?\d+$/, '').slice(0, 24); P.by[k] = (P.by[k] || 0) + 1; } }
    return rbd(cam, sc, geo, mat, obj, grp);
  };
  const r = c.post.render, gl = R.getContext(), px = new Uint8Array(4);
  c.post.render = function () { R.info.reset(); P.on = 1; const s = performance.now(); r.call(this); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); P.ms += performance.now() - s; P.on = 0; P.n++; P.calls += R.info.render.calls; P.tris += R.info.render.triangles; };
}, Q);
const L = await page.evaluate(async () => {
  const l = await import('/js/island/layout.js'), p = await import('/js/island/sample/plaza.js'), t = __island.terrain;
  const pol = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const a = l.zoneAngle(7) + Math.PI / 8; let beach = pol(260, a);   // bờ biển: đi ra theo tia tới chỗ cao ~0,9 m
  for (let r = 200; r < 340; r += 1) { const q = pol(r, a); if (t.heightAt(q[0], q[1]) < 0.9) { beach = pol(r - 3, a); break; } }
  return { spawn: l.SPAWN, plaza: [p.PLAZA.x, p.PLAZA.z], town: pol(l.RING_ROAD_R, l.zoneAngle(5) + Math.PI / 16), forest: pol(l.RING - 42, l.zoneAngle(7)), beach, beachYaw: a };
});
const spots = [
  ['cong-truong', L.spawn, -Math.PI / 2 + 0.75],
  ['quang-truong', L.plaza, Math.PI / 2],
  ['thi-tran', L.town, 0.4],
  ['rung-doi', L.forest, 2.2],
  ['bo-bien', L.beach, L.beachYaw + Math.PI],   // nhìn ra biển
];
const rows = [];
for (const [name, [x, z], yaw] of spots) {
  await page.evaluate(([x, z, yaw]) => { const p = __island.player; p.teleport(x, z); p.cam.yaw = yaw; p.cam.pitch = 0.3; p.cam.dist = 11; p.snapCamera(); }, [x, z, yaw]);
  await page.waitForTimeout(4000);   // chờ chunk/LOD/perf.js quét lại
  await page.evaluate(() => { Object.assign(__pm, { n: 0, calls: 0, tris: 0, sh: 0, ms: 0, by: {} }); __pm.raf0 = __rafMs; });
  await page.waitForFunction(n => __pm.n >= n, N, { timeout: 300000 });
  const m = await page.evaluate(() => { const P = __pm, n = P.n, top = Object.entries(P.by).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ':' + Math.round(v / n)).join(' ');
    return { calls: Math.round(P.calls / n), sh: Math.round(P.sh / n), ktris: Math.round(P.tris / n / 1000), js: +((__rafMs - P.raf0 - P.ms) / n).toFixed(1), gpu: +(P.ms / n).toFixed(1), top }; });
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` });
  rows.push({ name, ...m });
}
console.table(rows);
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(rows, null, 1));
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
