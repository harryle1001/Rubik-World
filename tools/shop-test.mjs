// tools/shop-test.mjs — Kiểm thử luồng Cửa hàng ↔ game: ADMIN_KEY=TESTKEY SHOP_PAY_MODE=mock node server/index.js & rồi node tools/shop-test.mjs <thư-mục-ra> [--mobile]
// 1) đặt hàng qua API (online) → 2) thanh toán giả lập → 3) đơn hiện trong /admin, tạo mã quà → 4) vào game, tới Tủ kính Rubik,
// nhập mã → nhận áo choàng / thú cưng / chổi / Rubik vàng. In kết quả + lỗi console; chụp ảnh.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2] || 'shots', B = process.env.BASE || 'http://localhost:3000', KEY = process.env.ADMIN_KEY || 'TESTKEY';
fs.mkdirSync(OUT, { recursive: true });
const log = [], errors = [], j = async (u, o = {}) => { const r = await fetch(B + u, { ...o, headers: { 'Content-Type': 'application/json', 'x-admin-key': KEY, ...(o.headers || {}) } }); return r.json(); };
// 1–3: phụ huynh đặt hàng & trả tiền giả lập; chủ shop thấy đơn + tạo mã
const ord = await j('/api/shop/order', { method: 'POST', body: JSON.stringify({ parent: true, name: 'Lê Văn C', phone: '0901234567', email: 'test@example.com', address: '1 Trần Phú, P. Điện Biên, Q. Ba Đình', province: 'Hà Nội', pay: 'online', items: [{ id: 'rubik-3x3', qty: 1 }, { id: 'huy-hieu', qty: 1 }] }) });
const paid = await j(`/api/shop/pay/mock/${ord.id}?t=${ord.token}`, { method: 'POST', body: '{}' });
const adm = await j('/api/admin/shop'), o = adm.orders.find(x => x.id === ord.id);
log.push(`đơn ${ord.id}: ${ord.order.total}đ → thanh toán: ${paid.statusName}/${paid.paid} → admin thấy: ${o ? o.statusName + ', paid=' + !!o.paid : 'KHÔNG'}`);
const codes = {}; for (const r of ['cape-hoangkim', 'pet-nai', 'broom-cauvong', 'rubik-vang']) codes[r] = (await j('/api/admin/shop/codes', { method: 'POST', body: JSON.stringify({ reward: r, count: 1, note: 'test' }) })).codes[0];
log.push('mã: ' + JSON.stringify(codes));
// 4: game
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
await page.goto(B + '/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
await page.locator('button[data-a="guest"], button:has-text("Chơi khách")').first().click({ timeout: 60000 }).catch(() => {});
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => Object.defineProperty(__island.sky.state, 'hour', { get: () => 10, set() {}, configurable: true }));
const goCase = async () => page.evaluate(() => { const c = __island, sc = c.alley.built && c.alley.built.sc; if (!sc) { c.player.teleport(-684, -800); return false; } const a = sc.root.rotation.y, dx = Math.sin(a), dz = Math.cos(a); c.player.teleport(sc.p.x + dx * 3, sc.p.z + dz * 3, sc.p.y + 0.2); c.player.cam.yaw = Math.atan2(-dx, -dz); return true; });
if (!(await goCase())) { await page.waitForTimeout(3000); await goCase(); }
await page.waitForTimeout(7000);
await page.screenshot({ path: `${OUT}/g1-tu-kinh${MOBILE ? '-dt' : ''}.png` });
log.push('nút gợi ý: ' + await page.evaluate(() => (document.body.innerText.match(/Xem tủ kính Rubik/) || ['(không thấy)'])[0]));
const open = () => page.evaluate(() => { const b = [...document.querySelectorAll('button,div')].find(e => e.children.length === 0 && /Xem tủ kính Rubik/.test(e.textContent)); if (b) b.click(); return !!document.getElementById('rwCase'); });
log.push('mở bằng nút: ' + await open());
if (!(await page.$('#rwCase'))) await page.keyboard.press('e'), await page.waitForTimeout(300);
await page.waitForSelector('#rwCase', { timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/g2-bang-phu-huynh${MOBILE ? '-dt' : ''}.png` });
const redeem = async c => { await page.fill('#rwCode', c); await page.click('#rwGo'); await page.waitForFunction(() => !/Đang kiểm tra/.test(document.getElementById('rwMsg').textContent), null, { timeout: 60000 }); return page.textContent('#rwMsg'); };
log.push('sai: ' + await redeem('AAAA-BBBB-CCCC'));
for (const [r, c] of Object.entries(codes)) log.push(`${r}: ${await redeem(c)}`);
log.push('dùng lại: ' + await redeem(codes['pet-nai']));
await page.screenshot({ path: `${OUT}/g3-nhan-qua${MOBILE ? '-dt' : ''}.png` });
log.push('wear ' + JSON.stringify(await page.evaluate(() => __island.wear.eq)) + ' · rubik-vang=' + await page.evaluate(() => __island.account.hasItem('rubik-vang') || __island.wear.own('rubik-vang')));
await page.click('#rwX');
await page.evaluate(() => { const c = __island, sc = c.alley.built.sc, a = sc.root.rotation.y; c.player.teleport(sc.p.x + Math.sin(a) * 4.2 + Math.cos(a) * 1.5, sc.p.z + Math.cos(a) * 4.2 - Math.sin(a) * 1.5, sc.p.y + 0.2); c.player.cam.yaw = a + Math.PI * 0.85; });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/g4-ao-choang-nai${MOBILE ? '-dt' : ''}.png` });
fs.writeFileSync(`${OUT}/shop-test${MOBILE ? '-dt' : ''}.json`, JSON.stringify({ log, errors }, null, 1));
console.log(log.join('\n')); if (errors.length) console.log('LỖI:\n' + errors.join('\n'));
await browser.close();
