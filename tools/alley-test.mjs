// tools/alley-test.mjs — Kiểm thử Phố Phép Thuật: node server/index.js & rồi node tools/alley-test.mjs <thư-mục-ra> [--hour=10] [--mobile]
// Nạp 200 xu, mua đũa/áo choàng/mũ/thú cưng/chổi (tự trả lời đúng câu đố), giải toán ở ngân hàng; in số xu trước/sau + lỗi console; chụp ảnh.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
await page.locator('button[data-a="guest"]').first().click({ timeout: 8000 }).catch(() => {});
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
const H = +(process.argv.find(a => a.startsWith('--hour=')) || '--hour=10').split('=')[1];
await page.evaluate(H => Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true }), H);
// tới gần tiệm, chờ phố dựng
const go = async (id, back = 2.4) => {
  await page.evaluate(([id, back]) => { const c = __island; const go = () => { const k = c.alley.built && c.alley.built.keepers.find(k => k.sh.id === id); if (!k) return false; const dx = Math.sin(k.face), dz = Math.cos(k.face); c.player.teleport(k.p.x + dx * back, k.p.z + dz * back, k.p.y + 0.2); c.player.cam.yaw = Math.atan2(-dx, -dz); return true; }; if (!go()) { const [x, z] = [-684, -800]; c.player.teleport(x, z); } }, [id, back]);
  await page.waitForTimeout(2500);
  await page.evaluate(([id, back]) => { const c = __island, k = c.alley.built.keepers.find(k => k.sh.id === id), dx = Math.sin(k.face), dz = Math.cos(k.face); c.player.teleport(k.p.x + dx * back, k.p.z + dz * back, k.p.y + 0.2); c.player.cam.yaw = Math.atan2(-dx, -dz); }, [id, back]);
  await page.waitForTimeout(6000);
};
await page.evaluate(() => { __island.account.addCoins(200); });
const log = [];
const shot = async n => { await page.screenshot({ path: `${OUT}/${n}${MOBILE ? '-dt' : ''}.png` }); };
const buy = async (id, idx) => {
  await page.evaluate(id => { const c = __island, k = c.alley.built.keepers.find(k => k.sh.id === id); c.alley.shop.open(k); }, id);
  await page.waitForTimeout(400);
  const c0 = await page.evaluate(() => __island.account.coins);
  await page.locator('#alShop button[data-i]').nth(idx).click();
  await page.waitForTimeout(300);
  const a = await page.evaluate(() => { const c = document.getElementById('mgCard'); return c ? +c.dataset.a : -1; });
  if (a >= 0) await page.locator(`#mgCard button[data-i="${a}"]`).click();
  await page.waitForTimeout(2600);
  const c1 = await page.evaluate(() => __island.account.coins);
  log.push(`${id}#${idx}: ${c0} → ${c1}`);
};
await go('wand'); await page.evaluate(() => { const c = __island; if (!c.magic.hasWand) c.magic.setWand('thong', 'lam'); });
await page.evaluate(() => { const c = __island, k = c.alley.built.keepers.find(k => k.sh.id === 'wand'); c.alley.shop.open(k); }); await page.waitForTimeout(800); await shot('t1-tiem-dua');
await page.evaluate(() => __island.alley.shop.close());
await buy('wand', 2);
await go('robe'); await buy('robe', 1); await buy('robe', 6);
await go('pet'); await buy('pet', 0);
await go('broom'); await buy('broom', 0);
await go('bank'); await buy('bank', 0);
log.push('wear ' + JSON.stringify(await page.evaluate(() => __island.wear.eq)), 'wand ' + JSON.stringify(await page.evaluate(() => __island.magic.wand)));
// nhìn nhân vật từ trước mặt (áo choàng, mũ, chổi, mèo đi theo)
await go('robe', 3.2); await page.evaluate(() => { const c = __island; const r = c.player.update; c.player.update = function (dt) { const o = r.call(this, dt); if (window.__v != null) { const p = c.player.pos, a = __v; c.camera.position.set(p.x + Math.sin(a) * 3, p.y + 1.7, p.z + Math.cos(a) * 3); c.camera.lookAt(p.x, p.y + 1.1, p.z); } return o; }; });
await page.evaluate(() => { const c = __island; c.alley.shop.open(c.alley.built.keepers.find(k => k.sh.id === 'robe')); }); await page.waitForTimeout(900); await shot('t2-ao-choang-mu');
await page.evaluate(() => __island.alley.shop.close());
await page.evaluate(() => { window.__v = __island.player.hero.model.parent.rotation.y + Math.PI * 0.8; }); await page.waitForTimeout(3000); await shot('t3-do-moi-sau-lung');
await page.evaluate(() => { window.__v = __island.player.hero.model.parent.rotation.y + 0.5; }); await page.waitForTimeout(2500); await shot('t4-truoc-thu-cung'); await page.evaluate(() => { window.__v = null; });
await go('herb', 3); await shot('t5-quay-thao-duoc');
fs.writeFileSync(`${OUT}/test${MOBILE ? '-dt' : ''}.json`, JSON.stringify({ log, errors }, null, 1));
console.log(log.join('\n')); if (errors.length) console.log('LỖI:\n' + errors.join('\n'));
await browser.close();
