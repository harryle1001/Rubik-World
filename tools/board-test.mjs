// tools/board-test.mjs — Kiểm thử VÁN BẠC BAY + đua ván: node server/index.js & rồi node tools/board-test.mjs <thư-mục-ra> [--mobile] [--track=coast|canyon|cloud] [--norace]
// Gọi ván, bay, lướt biển, nhào lộn, chạy trọn 1 đường đua (tự lái), chụp ảnh, in draw call + lỗi console.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2] || 'docs/shots/silver-board', NORACE = process.argv.includes('--norace');
const TRACK = (process.argv.find(a => a.startsWith('--track=')) || '--track=coast').split('=')[1];
fs.mkdirSync(OUT, { recursive: true });
const errors = [], sfx = MOBILE ? '-mobile' : '';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); localStorage.setItem('island.intro', '1'); localStorage.setItem('island.grade', '3'); } catch (e) {} });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.player.hero, null, { timeout: 300000 });
await page.locator('#accBox button[data-a="guest"]').first().click({ timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(500); await page.evaluate(() => document.getElementById('accBox') && document.getElementById('accBox').remove());
  // cốt truyện (story/): thoại tự bật lần đầu sẽ giành camera → tự bỏ qua bằng Esc (chỉ khi khung thoại đang hiện)
  await page.evaluate(() => setInterval(() => { if (document.getElementById('stSay') && document.body.classList.contains('st-cut')) dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); }, 400));
  await page.waitForTimeout(9000);
  await page.waitForFunction(() => !document.body.classList.contains('st-cut') && !__island.freeCam, null, { timeout: 20000 }).catch(() => {});
await page.waitForFunction(() => !__island.player.frozen && !__island.loading.veil, null, { timeout: 60000 }).catch(() => {});
await page.evaluate(() => Object.defineProperty(__island.sky.state, 'hour', { get: () => 10, set() {}, configurable: true }));
await page.waitForTimeout(2500);
let low = false;   // máy kiểm thử không có GPU: hạ độ phân giải khi chạy đường dài, trả lại lúc chụp
const res = on => page.evaluate(on => { const c = __island; c.__pr = c.__pr || c.renderer.getPixelRatio(); c.renderer.setPixelRatio(on ? 0.3 : c.__pr); c.post.setSize(innerWidth, innerHeight); }, on);
const shot = async n => { if (low) { await res(false); await page.waitForTimeout(700); } await page.screenshot({ path: `${OUT}/${n}${sfx}.png` }); console.log('ảnh', n); if (low) await res(true); };
await page.evaluate(() => { const c = __island, i = c.renderer.info, o = c.post.render; i.autoReset = false; c.post.render = function () { i.reset(); o.call(this); window.__calls = i.render.calls; window.__tris = i.render.triangles; }; });   // draw call cả khung (mọi pass)
const calls = () => page.evaluate(() => window.__calls);
const B = fn => page.evaluate(fn);
const log = {};
// trạng thái nhân vật trên ván (có hiện không, đang là mẫu nào) — để bắt lỗi "người biến mất"
const hero = () => page.evaluate(() => { const c = __island, P = c.player, h = P.hero, m = h.model; let meshes = 0, shown = 0; m.traverse(o => { if (o.isMesh) { meshes++; let v = true; for (let q = o; q; q = q.parent) if (!q.visible) v = false; if (v) shown++; } }); return { vrm: !!h.isVrm, meshes, shown, attached: m.parent === P.root, y: +m.getWorldPosition(new c.camera.position.constructor()).y.toFixed(2), boardY: +c.silverBoard.pos.y.toFixed(2), others: c.net.others.size }; });
// 1. gọi ván (nút 🏄 / phím U)
await B(() => { const c = __island; if (c.eco && !c.eco.owns('board-bac')) c.account.profile.own.push('board-bac'); });   // ván mở khoá ở 🛒 Cửa hàng (economy/)
if (MOBILE) await page.locator('#bBoard').tap(); else await page.keyboard.press('KeyU');
await page.waitForTimeout(1500); log.riding = await B(() => __island.silverBoard.riding); log.callsTown = await calls(); log.hero1 = await hero(); await shot('01-goi-van');
// 2. bay qua thị trấn (tự lái thẳng, không xuyên nhà)
await B(() => { const b = __island.silverBoard; b.S.auto = () => ({ z: -1 }); });
await page.waitForTimeout(4000); await shot('02-luot-pho'); log.spd = await B(() => +__island.silverBoard.speed.toFixed(1));
await B(() => { const b = __island.silverBoard; b.S.auto = () => ({ z: -1, x: 1, boost: true }); }); await page.waitForTimeout(1300); await shot('03-cua-nghieng');
// 3. lướt biển: đặt ván ra bờ nam, lướt sát mặt nước
await B(() => { const b = __island.silverBoard; b.place(40, 1, 330, Math.PI / 2); b.S.auto = () => ({ z: -1, boost: true }); });
await page.waitForTimeout(3500); await shot('04-luot-bien'); log.callsSea = await calls(); log.hero4 = await hero();
// 4. nhào lộn
await B(() => __island.silverBoard.trick('flip')); await page.waitForTimeout(330); await shot('05-lon-vong');
await page.waitForTimeout(900); await B(() => __island.silverBoard.trick('spin')); await page.waitForTimeout(300); await shot('06-xoay-360');
// 5. bay cao: vệt sáng
await B(() => { const b = __island.silverBoard; b.place(0, 40, 150, Math.PI); b.S.auto = () => ({ z: -1, boost: true, up: true }); });
await page.waitForTimeout(3500); await shot('07-bay-cao'); log.alt = await B(() => +__island.silverBoard.pos.y.toFixed(1));
await B(() => { __island.silverBoard.S.auto = null; });
if (!NORACE) {
  // 6. đua: mở sảnh, chọn đường, tự lái theo cổng, chờ về đích
  await B(() => __island.mg.start('board-race', null)); await page.waitForTimeout(1200); await shot('08-sanh-dua');
  await page.evaluate(t => __island.boardRace.choose(t), TRACK);
  await page.waitForFunction(() => __island.boardRace.state === 'race', null, { timeout: 60000 });
  await B(() => { __island.boardRace.autopilot(true); }); await page.waitForTimeout(600); await shot(`09-xuat-phat-${TRACK}`); low = true; await res(true);
  let maxCalls = 0, n = 0;
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(1000); const st = await B(() => ({ s: __island.boardRace.state, p: +__island.boardRace.progress.toFixed(3), q: __island.boardRace.quizOn, c: window.__calls }));
    maxCalls = Math.max(maxCalls, st.c);
    if (st.q && !log.quizShot) { log.quizShot = true; await shot(`11-cong-kien-thuc-${TRACK}`); }
    if (st.p > 0.3 && n === 0) { n = 1; await shot(`10-giua-duong-${TRACK}`); }
    if (st.p > 0.62 && n === 1) { n = 2; await shot(`12-cuoi-duong-${TRACK}`); }
    if (st.s === 'done') break;
    if (i % 20 === 0) console.log(i, JSON.stringify(st));
  }
  low = false; await res(false);
  await page.waitForTimeout(800); await shot(`13-ve-dich-${TRACK}`);
  log.race = await B(() => __island.boardRace.result); log.maxCallsRace = maxCalls;
  await B(() => __island.mg.exit()); await page.waitForTimeout(800);
}
// 7. xuống ván
await B(() => { const b = __island.silverBoard; b.place(-60, 3, 12, 0); }); await page.waitForTimeout(500);
if (MOBILE) await page.locator('#sbCtl button[data-k="off"]').tap(); else await page.keyboard.press('KeyU');
await page.waitForFunction(() => !__island.silverBoard.riding, null, { timeout: 60000 }).catch(() => {}); log.offOk = await B(() => !__island.silverBoard.riding && !__island.player.vehicle); await shot('14-xuong-van');
console.log(JSON.stringify(log, null, 1)); console.log('LỖI CONSOLE:', errors.length, errors.slice(0, 8));
await browser.close();
