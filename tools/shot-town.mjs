// tools/shot-town.mjs — Chụp kiểm tra khu thị trấn theo docs/style-guide.md mục 8 (giờ khoá, chất lượng cao, 2 góc, ảnh điện thoại, draw call).
// Chạy: node server/index.js &  rồi  node tools/shot-town.mjs --out=docs/shots/up-town/after [--hours=8.5,13,17.67,22] [--mobile]
// Góc chụp (VIEWS): eye = người chơi đứng trên đường/vỉa hè nhìn nhà; air = chéo trên cao 26 m.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = (k, d) => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1] || d;
const OUT = arg('out', 'docs/shots/up-town/tmp'), HOURS = arg('hours', '8.5,13,17.67,22').split(',').map(Number), MOBILE = process.argv.includes('--mobile');
const ONLY = arg('views', '');
fs.mkdirSync(OUT, { recursive: true });
// Vòng nhà ở: lô j ở góc a = -π/2 + π/16 + j·2π/16; tim đường vòng r = 92; mặt tiền nhà r ≈ 118,5
const lotA = j => -Math.PI / 2 + Math.PI / 16 + j * 2 * Math.PI / 16;
const pol = (r, a, y) => [r * Math.cos(a), y, r * Math.sin(a)];
const VIEWS = {
  ringEye: { cam: pol(103, lotA(3) - 0.07, 3.9), look: pol(121, lotA(3), 4.2), player: pol(107, lotA(3) - 0.02, 0) },
  ringAir: { cam: pol(88, lotA(3) - 0.42, 27), look: pol(120, lotA(3) - 0.05, 2) },
  ringEye2: { cam: pol(104, lotA(12) + 0.08, 3.9), look: pol(121, lotA(12), 4.2) },
};
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(arg('url', 'http://localhost:3000/ocean.html'));
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) await fr.waitForSelector('#lgGuest', { timeout: 60000 }).catch(() => {});
if (fr) await fr.locator('#lgGuest').first().click({ force: true, timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await page.evaluate(() => {
  const c = __island; c.quality = () => {}; c.renderer.info.autoReset = false;
  const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); r.call(this); window.__ri = { calls: c.renderer.info.render.calls, tris: c.renderer.info.render.triangles }; };
  const pu = c.player.update; c.player.update = function (...a) { const out = pu.apply(this, a); const v = window.__view; if (v) { c.camera.position.set(...v.cam); c.camera.lookAt(...v.look); } return out; };
  window.__setHour = H => Object.defineProperty(c.sky.state, 'hour', { get: () => H, set() {}, configurable: true });
});
const stats = {};
for (const [name, v] of Object.entries(VIEWS)) {
  if (ONLY && !ONLY.split(',').includes(name)) continue;
  await page.evaluate(v => { const c = __island, Y = 1.2; v = { cam: [v.cam[0], v.cam[1] + Y, v.cam[2]], look: [v.look[0], v.look[1] + Y, v.look[2]], player: v.player }; window.__view = v; const p = v.player || v.look; c.player.teleport(p[0], p[2]); }, v);
  for (const H of (name.includes('Air') || MOBILE ? HOURS.slice(0, 2) : HOURS)) {
    await page.evaluate(H => window.__setHour(H), H);
    await page.waitForTimeout(2500);
    const f = `${OUT}/${name}-${String(H).replace('.', 'h')}${MOBILE ? '-mobile' : ''}.png`;
    await page.screenshot({ path: f }); stats[`${name}@${H}`] = await page.evaluate(() => window.__ri);
  }
}
console.log(JSON.stringify(stats));
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
