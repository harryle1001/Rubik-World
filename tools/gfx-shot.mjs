// tools/gfx-shot.mjs — Chụp ảnh trước/sau cho các đợt đồ hoạ (docs/style-guide.md mục 8).
// Chạy: node server/index.js &  rồi  node tools/gfx-shot.mjs <thư-mục-ra> <views.json> [--mobile] [--hours=8.5,17.67]
// views.json: [{ "name": "rung", "x": 10, "z": 20, "yaw": 1.2 } | { "name": "tren-cao", "cam": [x,y,z], "look": [x,y,z] }]
// In ra draw call / tam giác mỗi ảnh (renderer.info sau 1 khung). Ảnh: <out>/<name>-<giờ>[-dt].png
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [, , OUT, VIEWS] = process.argv;
const MOBILE = process.argv.includes('--mobile');
const HOURS = ((process.argv.find(a => a.startsWith('--hours=')) || '--hours=8.5,17.67').split('=')[1]).split(',').map(Number);
const views = JSON.parse(fs.readFileSync(VIEWS, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
await page.goto(`http://localhost:${(process.argv.find(a => a.startsWith('--port=')) || '--port=3000').split('=')[1]}/ocean.html`);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) await fr.waitForSelector('#mLogin:not([hidden])', { timeout: 60000 }).catch(() => {});
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count()) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
{ const g = page.locator('button[data-a="guest"]'); await g.first().click({ timeout: 8000 }).catch(() => {}); }
for (let i = 0; i < 20; i++) { const g = page.getByText('Chơi khách', { exact: true }); if (await g.count() && await g.first().isVisible()) { await g.first().click().catch(() => {}); break; } await page.waitForTimeout(500); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500); { const k = page.getByText('Bỏ qua', { exact: true }); if (await k.count()) await k.first().click({ timeout: 3000 }).catch(() => {}); }
await page.evaluate(() => {
  const c = __island; c.quality = () => {}; c.renderer.info.autoReset = false;
  const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); r.call(this); window.__ri = { calls: c.renderer.info.render.calls, tris: c.renderer.info.render.triangles }; };
  const pu = c.player.update; c.player.update = function (dt) { const o = pu.call(this, dt); if (window.__cam) { const k = c.camera; k.position.set(...__cam.cam); k.lookAt(...__cam.look); } return o; };
});
const rows = [];
for (const H of HOURS) {
  await page.evaluate(H => Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true }), H);
  for (const v of views) {
    await page.evaluate(v => {
      const c = __island; window.__cam = v.cam ? v : null;
      if (v.cam) c.player.teleport(v.look[0], v.look[2]); else { c.player.teleport(v.x, v.z); c.player.cam.yaw = v.yaw; }
      c.terrain && c.terrain.state && c.terrain.state.relayoutAll && c.terrain.state.relayoutAll(c.player.pos);
    }, v);
    await page.waitForTimeout(+(process.argv.find(a => a.startsWith('--wait=')) || '--wait=3500').split('=')[1]);
    const ri = await page.evaluate(() => window.__ri);
    const name = `${v.name}-${String(H).replace('.', 'h')}${MOBILE ? '-dt' : ''}.png`;
    await page.screenshot({ path: `${OUT}/${name}` });
    rows.push({ name, ...ri });
    console.log(name, JSON.stringify(ri));
  }
}
fs.writeFileSync(`${OUT}/info${MOBILE ? '-dt' : ''}.json`, JSON.stringify({ rows, errors }, null, 1));
if (errors.length) console.log('LỖI console:\n - ' + errors.join('\n - '));
await browser.close();
