// tools/perf-mobile.mjs — Đo hiệu năng Đảo 3D ở chế độ ĐIỆN THOẠI (390×844, DPR 2, cảm ứng, UA iPhone → CFG.isMobile).
// Chạy: node server/index.js &  rồi  node tools/perf-mobile.mjs [--out=thu/muc/anh] [--q=1] [--net=4g|3g] [--load-only] [--url=http://localhost:3000/ocean.html]
// --net=4g: giả lập 4G (9 Mbps, trễ 85 ms) · --net=3g: mạng yếu (1,6 Mbps, 150 ms) để đo thời gian tải lần đầu; --load-only: chỉ đo tải.
// In: thời gian tải, dung lượng tải (KB), rồi tại 3 điểm (cổng trường · quảng trường · sân bay): draw call, tam giác, ms/khung
// (trung bình 89 khung, chất lượng khoá ở mức --q, mặc định 1 = mức điện thoại khởi đầu), NaN-check ảnh (pixel đen/đơn sắc).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), Q = +(arg('q') ?? 1);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
const NET = { '4g': [85, 9e6], '3g': [150, 1.6e6] }[arg('net')];   // [trễ ms, bit/s]: 4G thường · 3G/4G yếu (chuẩn Lighthouse)
if (NET) { const cdp = await page.context().newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET[0], downloadThroughput: NET[1] / 8, uploadThroughput: 0.75e6 / 8 }); }
const t0 = Date.now();
await page.goto(URL);
await page.waitForFunction(() => window.__island, null, { timeout: 300000 }); const tFirst = (Date.now() - t0) / 1000;   // khung hình 3D đầu tiên
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const tLoad = (Date.now() - t0) / 1000;
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
const net = await page.evaluate(() => { let t = 0, d = 0, n = 0, glb = 0; for (const e of performance.getEntriesByType('resource')) { t += e.transferSize || 0; d += e.decodedBodySize || 0; n++; if (/\.glb/.test(e.name)) glb += e.decodedBodySize || 0; } return { files: n, transferKB: Math.round(t / 1024), decodedKB: Math.round(d / 1024), glbKB: Math.round(glb / 1024) }; });
for (const f of page.frames()) if (f !== page.mainFrame()) net.iframeKB = (net.iframeKB || 0) + await f.evaluate(() => Math.round(performance.getEntriesByType('resource').reduce((s, e) => s + (e.transferSize || 0), 0) / 1024)).catch(() => 0);   // trường 2D nhúng
console.log(`Khung 3D đầu tiên ${tFirst.toFixed(1)} s · trường sẵn sàng ${tLoad.toFixed(1)} s · ${JSON.stringify(net)} · pixelRatio lúc tải=${await page.evaluate(() => __island.renderer.getPixelRatio())}`);
if (process.argv.includes('--load-only')) { console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console'); await browser.close(); process.exit(0); }
await page.evaluate(q => {
  const c = __island; c.setQuality(q, true); c.sky.state.lock = 13; c.renderer.info.autoReset = false;   // khoá 13h: số đo không đổi theo giờ thật
  const P = window.__pm = { n: 0, calls: 0, tris: 0, ms: 0 };
  const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); const s = performance.now(); r.call(this); P.ms += performance.now() - s; P.n++; P.calls += c.renderer.info.render.calls; P.tris += c.renderer.info.render.triangles;
    if (P.px) { const gl = c.renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, d = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d); let blk = 0, s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { const l = d[i] + d[i + 1] + d[i + 2]; if (l < 6) blk++; s += l; s2 += l * l; n++; } const mu = s / n; P.px = { black: +(blk / n).toFixed(3), sd: Math.round(Math.sqrt(s2 / n - mu * mu)) }; } };
}, Q);
const L = await page.evaluate(async () => { const l = await import('/js/island/layout.js'), p = await import('/js/island/sample/plaza.js'), e = l.EXTRA.find(e => e.id === 'K').r; return { spawn: l.SPAWN, plaza: [p.PLAZA.x, p.PLAZA.z], air: [(e[0] + e[2]) / 2, (e[1] + e[3]) / 2] }; });
const spots = [
  ['cong-truong', L.spawn, -Math.PI / 2 + 0.75, 0.3, 11],
  ['quang-truong', L.plaza, Math.PI / 2, 0.3, 11],
  ['san-bay', L.air, 0, 0.3, 11],
];
const rows = [];
for (const [name, [x, z], yaw, pitch, dist] of spots) {
  await page.evaluate(([x, z, yaw, pitch, dist]) => { const p = __island.player; p.teleport(x, z); p.cam.yaw = yaw; p.cam.pitch = pitch; p.cam.dist = dist; p.snapCamera(); }, [x, z, yaw, pitch, dist]);
  await page.waitForTimeout(4000);   // chờ chunk/LOD/perf.js quét lại
  await page.evaluate(() => Object.assign(__pm, { n: 0, calls: 0, tris: 0, ms: 0 }));
  const t1 = Date.now(); await page.waitForFunction(() => __pm.n >= 89, null, { timeout: 300000 }); const wall = (Date.now() - t1) / 1000;
  const m = await page.evaluate(() => ({ calls: Math.round(__pm.calls / __pm.n), tris: Math.round(__pm.tris / __pm.n), renderMs: +(__pm.ms / __pm.n).toFixed(1), n: __pm.n }));
  m.fps = +(m.n / wall).toFixed(1);
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.evaluate(() => { __pm.px = 1; }); await page.waitForFunction(() => typeof __pm.px === 'object', null, { timeout: 60000 }); const px = await page.evaluate(() => __pm.px);   // pixel đen = NaN/lỗi shader
  rows.push({ name, ...m, ...px });
}
console.table(rows);
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
