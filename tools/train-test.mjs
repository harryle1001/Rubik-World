// tools/train-test.mjs — Kiểm thử Tàu Pha Lê v2 (Playwright): lên tàu, đi qua các toa, ngồi ghế, gọi đồ, chụp ảnh, đếm draw call.
// Chạy: node server/index.js &  rồi  node tools/train-test.mjs [--mobile] [--out=docs/shots/train-v2] [--step=a,b,...]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const MOBILE = process.argv.includes('--mobile'), URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out') || 'docs/shots/train-v2';
const STEPS = (arg('step') || 'board,walk').split(','), TAG = MOBILE ? 'mobile' : 'desktop';
const errors = [];
export async function open(browser, mobile) {
  const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 720 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(URL);
  await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.train, null, { timeout: 900000 });
  const fr = page.frames().find(f => f.url().includes('/school/'));
  if (fr) await fr.waitForSelector('#mLogin:not([hidden])', { timeout: 60000 }).catch(() => {});
  if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count()) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
  await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
  await page.waitForSelector('button[data-a="guest"]', { state: 'visible', timeout: 20000 }).then(() => page.click('button[data-a="guest"]')).catch(e => console.log('không thấy nút Chơi khách', e.message)); await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) { const sk = page.getByText('Bỏ qua', { exact: true }); if (await sk.count()) await sk.first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(400); }
  await page.evaluate(() => { const c = __island; c.renderer.info.autoReset = false; const r = c.post.render; window.__dc = { calls: 0, n: 0, max: 0 }; c.post.render = function () { c.renderer.info.reset(); r.call(this); const k = c.renderer.info.render.calls; __dc.calls += k; __dc.n++; __dc.max = Math.max(__dc.max, k); }; });
  return page;
}
const dc = async page => page.evaluate(() => { const d = __dc, r = { avg: Math.round(d.calls / Math.max(1, d.n)), max: d.max }; d.calls = d.n = d.max = 0; return r; });
const shot = async (page, name) => { await page.evaluate(() => { for (const b of document.querySelectorAll('button')) if (b.textContent.trim() === 'Bỏ qua' && b.offsetParent) b.click(); }); await page.waitForTimeout(300);
  const dbg = await page.evaluate(() => { const c = __island.camera.position, p = __island.player.pos, cs = __island.train.ride.cabin.state; return [c.x, c.y, c.z, p.x, p.y, p.z].map(v => +v.toFixed(1)).join(',') + ' ' + cs.mode + ' car' + cs.car + ' yaw' + (+cs.yawL).toFixed(2) + ' rot' + ['x','y','z'].map(k => (+__island.train.consist.cars[cs.car].o.rotation[k]).toFixed(2)) + ' cam' + ['x','y','z'].map(k => (+__island.camera.rotation[k]).toFixed(2)) + ' up' + __island.camera.up.toArray(); }); console.log('  ', name, dbg); await page.screenshot({ path: `${OUT}/${name}-${TAG}.png` }); console.log('ảnh', `${OUT}/${name}-${TAG}.png`, JSON.stringify(await dc(page))); };
if (process.argv[1].endsWith('train-test.mjs')) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await open(browser, MOBILE);
  // tới sân ga đi, lên tàu
  await page.evaluate(() => { const t = __island.train, s = t.ride.state; t.ride.relocate('A'); });
  await page.evaluate(() => __island.train.ride.board()); await page.waitForTimeout(2500);
  if (STEPS.includes('board')) await shot(page, 'board');
  if (STEPS.includes('walk')) {
    for (const [k, u] of (await page.evaluate(() => __island.train.ride.debugStops())).entries()) {
      await page.evaluate(c => __island.train.ride.debugGo(c), u.car); await page.waitForTimeout(1800); await shot(page, 'car-' + k + '-' + u.kind);
    }
  }
  if (STEPS.includes('sit')) { const r = await page.evaluate(() => __island.train.ride.debugSit()); console.log('ngồi:', r); await page.waitForTimeout(1500); await shot(page, 'sit'); }
  if (STEPS.includes('serve')) { const r = await page.evaluate(() => __island.train.crew.debugServe()); console.log('phục vụ:', r); await page.waitForTimeout(2500); await shot(page, 'serve');
    await page.evaluate(() => __island.train.crew.openMenu()); await page.waitForTimeout(800); await shot(page, 'menu');
    await page.click('#trMenu button.it'); await page.waitForSelector('#mgCard', { state: 'attached', timeout: 20000 }); await page.waitForTimeout(500); await shot(page, 'quiz');
    await page.evaluate(() => { const c = document.getElementById('mgCard'); c.querySelector(`[data-i="${c.dataset.a}"]`).click(); }); await page.waitForTimeout(3500); await shot(page, 'served'); }
  if (STEPS.includes('run')) { await page.evaluate(() => __island.train.ride.depart()); await page.waitForTimeout(4000); await shot(page, 'run'); await page.evaluate(() => __island.train.ride.seek(70)); await page.waitForTimeout(3000); await shot(page, 'run-mid'); }
  console.log(errors.length ? 'LỖI:\n' + errors.slice(0, 13).join('\n') : 'Không lỗi console');
  await browser.close();
}
