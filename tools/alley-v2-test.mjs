// tools/alley-v2-test.mjs — Kiểm thử Phố Phép Thuật v2: node server/index.js & rồi node tools/alley-v2-test.mjs <thư-mục-ra> [--hour=10] [--mobile]
// Mua ở 6 tiệm mới (tự trả lời đúng), mở 🎒 túi đồ: bắn pháo hoa, chơi nhạc cụ, giải đố sách cũ; mở cổng Hẻm Đêm bằng đố mẹo; chụp ảnh; in lỗi console.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const H = +(process.argv.find(a => a.startsWith('--hour=')) || '--hour=10').split('=')[1];
const errors = [], log = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); localStorage.removeItem('academy.nightGate'); } catch (e) {} });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
for (let i = 0; i < 20; i++) { const g = page.getByText('Chơi khách', { exact: true }); if (await g.count() && await g.first().isVisible()) { await g.first().click().catch(() => {}); break; } await page.waitForTimeout(500); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(H => Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true }), H);
const sfx = MOBILE ? '-dt' : '', shot = n => page.screenshot({ path: `${OUT}/${n}${sfx}.png` });
const answer = async () => { await page.waitForTimeout(300); const a = await page.evaluate(() => { const c = document.getElementById('mgCard'); return c ? +c.dataset.a : -1; }); if (a >= 0) await page.locator(`#mgCard button[data-i="${a}"]`).click(); await page.waitForTimeout(2200); return a >= 0; };
const go = async (id, back = 2.6) => {
  for (let k = 0; k < 2; k++) {
    await page.evaluate(([id, back]) => { const c = __island, k = c.alley.built && c.alley.built.keepers.find(k => k.sh.id === id); if (!k) { c.player.teleport(-684, -830); return; } const dx = Math.sin(k.face), dz = Math.cos(k.face); c.player.teleport(k.p.x + dx * back, k.p.z + dz * back, k.p.y + 0.2); c.player.cam.yaw = Math.atan2(-dx, -dz); }, [id, back]);
    await page.waitForTimeout(k ? 5000 : 3000);
  }
};
const buy = async (id, idx) => {
  await page.evaluate(id => { const c = __island; c.alley.shop.open(c.alley.built.keepers.find(k => k.sh.id === id)); }, id); await page.waitForTimeout(400);
  const c0 = await page.evaluate(() => __island.account.coins);
  await page.locator('#alShop button[data-i]').nth(idx).click(); const q = await answer();
  log.push(`${id}#${idx}: ${c0} → ${await page.evaluate(() => __island.account.coins)}${q ? '' : ' (không câu đố)'}`);
};
const bag = async (act) => { await page.evaluate(() => __island.bag.open()); await page.waitForTimeout(300); const b = page.locator(`#alBag button[data-a^="${act}"]`); const n = await b.count(); if (n) await b.first().click(); log.push(`bag ${act}: ${n ? 'ok' : 'KHÔNG CÓ'}`); await page.waitForTimeout(700); };
await page.evaluate(() => __island.account.addCoins(300));
await go('tea'); await page.evaluate(() => { const c = __island; c.alley.shop.open(c.alley.built.keepers.find(k => k.sh.id === 'tea')); }); await page.waitForTimeout(600); await shot('v-quan-tra');
await page.locator('#alShop button[data-i]').nth(0).click(); await page.waitForTimeout(500); await buy('tea', 1);
await go('map'); await buy('map', 0); await go('clock'); await buy('clock', 0); await shot('v-dong-ho');
await go('fire'); await buy('fire', 1); await go('music'); await buy('music', 0); await shot('v-nhac-cu');
await go('oldbook'); await buy('oldbook', 0); await shot('v-sach-cu');
await go('pet'); await buy('pet', 4);
await bag('fw'); await page.waitForTimeout(800); await shot('v-phao-hoa');
await bag('ins'); await bag('compass'); await bag('puz'); await answer(); await bag('watch'); await answer();
await page.evaluate(() => __island.bag.open()); await page.waitForTimeout(400); await shot('v-tui-do'); await page.evaluate(() => __island.bag.close());
// cổng Hẻm Đêm: đứng trước màn phép, bấm lời mời, giải đố mẹo
await page.evaluate(() => { const c = __island, v = c.scene.getObjectByName('alley-night-veil'); c.player.teleport(v.position.x - 0.3, v.position.z + 2.6, v.position.y - 1.2); c.player.cam.yaw = Math.PI; });
await page.waitForTimeout(3500); await shot('v-cong-hem-dem');
log.push('nút: ' + await page.evaluate(() => { const b = document.getElementById('bAct'); return b.hidden ? '(ẩn)' : b.textContent; }));
await page.evaluate(() => document.getElementById('bAct').click());
const gq = await answer(); log.push('cổng: ' + (gq ? 'đã hỏi' : 'không thấy câu đố') + ' · mở=' + await page.evaluate(() => __island.alley.built.night.open));
await page.evaluate(() => { const c = __island, v = c.scene.getObjectByName('alley-night-veil'); c.player.teleport(v.position.x - 1, v.position.z - 7, v.position.y - 1.2); c.player.cam.yaw = Math.PI; });
await page.waitForTimeout(4500); await shot('v-trong-hem-dem');
await go('night'); await buy('night', 1);
log.push('wear ' + JSON.stringify(await page.evaluate(() => ({ eq: __island.wear.eq, bag: __island.wear.bag, own: __island.wear.owned }))));
fs.writeFileSync(`${OUT}/test${sfx}.json`, JSON.stringify({ log, errors }, null, 1));
console.log(log.join('\n')); if (errors.length) console.log('LỖI:\n' + errors.join('\n'));
await browser.close();
