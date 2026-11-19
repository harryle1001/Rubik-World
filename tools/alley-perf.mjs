// tools/alley-perf.mjs — Draw call CẢ KHUNG HÌNH (kể cả pass bóng, mọi lần render) khi đi dọc Phố Phép Thuật.
// node server/index.js & rồi node tools/alley-perf.mjs [--mobile] [--hour=20.5]  → in max/trung bình theo từng điểm dọc hẻm
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const MOBILE = process.argv.includes('--mobile'), H = +(process.argv.find(a => a.startsWith('--hour=')) || '--hour=10').split('=')[1];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); localStorage.setItem('academy.nightGate', '1'); } catch (e) {} });
await page.goto(`http://localhost:${(process.argv.find(a => a.startsWith('--port=')) || '--port=3000').split('=')[1]}/ocean.html`);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
for (let i = 0; i < 20; i++) { const g = page.getByText('Chơi khách', { exact: true }); if (await g.count() && await g.first().isVisible()) { await g.first().click().catch(() => {}); break; } await page.waitForTimeout(500); }
await page.evaluate(H => { Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true });
  const ri = __island.renderer.info; ri.autoReset = false; window.__calls = []; (function loop() { __calls.push(ri.render.calls); window.__hist = (window.__hist || []).concat(ri.render.calls).slice(-60); if (__calls.length > 60) __calls.shift(); ri.reset(); requestAnimationFrame(loop); })(); }, H);
// điểm dọc hẻm (u cục bộ): cổng → quảng trường → cuối hẻm → Hẻm Đêm; nhìn dọc lối về phía bắc (−u)
const rows = [];
for (const u of [24, 8, -14, -30, -50, -70, -85, -104]) {
  await page.evaluate(u => { const c = __island, a = c.alley, vc = v => 127.4 + 1.6 * Math.sin(v / 13); const W = (uu, vv) => [-811 + vv, -828 + uu]; const v = u < -95 ? 129 : vc(u); const [x, z] = W(u, v); c.player.teleport(x, z); c.player.cam.yaw = Math.PI; }, u);
  await page.waitForTimeout(7000); await page.evaluate(() => { __calls.length = 0; }); await page.waitForTimeout(9000);
  const c = await page.evaluate(() => __calls.slice(-30)); rows.push({ u, max: Math.max(...c), avg: Math.round(c.reduce((a, b) => a + b, 0) / c.length) });
  console.log(`u ${u}: max ${rows.at(-1).max} · tb ${rows.at(-1).avg} · [${c.join(",")}]`);
}
console.log(JSON.stringify({ mobile: MOBILE, hour: H, max: Math.max(...rows.map(r => r.max)), errors }));
await browser.close();
