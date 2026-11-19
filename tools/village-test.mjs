// tools/village-test.mjs — Kiểm thử Làng Phù Thuỷ Nhỏ (phép "Dựng Lên!"): node server/index.js & rồi node tools/village-test.mjs <thư-mục-ra> [--mobile] [--hour=10]
// Tới làng, mở chế độ xây, chạm đặt mảnh thật trên màn hình, xoay/xoá/hoàn tác, nhà gợi ý, thử thách; đếm draw call; in lỗi console; chụp ảnh .jpg.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2] || 'docs/shots/village', STEP = (process.argv.find(a => a.startsWith('--step=')) || '--step=all').split('=')[1];
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
await page.locator('#accBox button[data-a="guest"]').first().click({ timeout: 60000 }).catch(() => {});
await page.waitForTimeout(500); await page.evaluate(() => document.getElementById('accBox') && document.getElementById('accBox').remove());
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
const H = +(process.argv.find(a => a.startsWith('--hour=')) || '--hour=10').split('=')[1];
await page.evaluate(H => Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true }), H);
const sfx = MOBILE ? '-dt' : '';
const shot = async n => { await page.screenshot({ path: `${OUT}/${n}${sfx}.jpg`, quality: 80, type: 'jpeg' }); };
const log = [];
// tới làng (đảo học viện tải theo khoảng cách)
await page.evaluate(() => __island.village.goVillage());
await page.waitForFunction(() => __island.village.built && __island.village.ready, null, { timeout: 120000 });
await page.waitForTimeout(4000);
await page.evaluate(() => __island.village.goVillage());
await page.waitForTimeout(3000);
// ảnh toàn cảnh làng từ trên cao
const overview = async n => { await page.evaluate(() => { const c = __island, L = c.village.lots, a = L[0], b = L[L.length - 1]; c.player.teleport((a.x + b.x) / 2 + 10, a.z - 8, a.y + 0.3); c.player.cam.yaw = Math.PI - 0.5; c.player.cam.dist = 34; c.player.cam.pitch = 0.55; }); await page.waitForTimeout(3500); await shot(n); };
await overview('01-lang-toan-canh');
log.push(['lots', await page.evaluate(() => __island.village.lots.map(L => [L.n, L.pieces.length, !!L.mesh, L.title, L.x | 0, L.z | 0, L.y]))]);
log.push(['geos', await page.evaluate(async () => { const m = await import('/js/island/academy/village-pieces.js'); const r = []; for (const p of m.PIECES) { const g = await m.pieceGeo(p.id); const G = g && (g.body || g); r.push(p.id + ':' + (G ? G.boundingBox.min.toArray().map(v => v.toFixed(2)) + '/' + G.boundingBox.max.toArray().map(v => v.toFixed(2)) : 'null')); } return r; })]);
console.log(JSON.stringify(log));
const calls = async () => { await page.evaluate(() => { const c = __island; if (!c.__vt) { c.__vt = { n: 0, calls: 0 }; c.renderer.info.autoReset = false; const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); r.call(this); c.__vt.n++; c.__vt.calls += c.renderer.info.render.calls; }; } Object.assign(c.__vt, { n: 0, calls: 0 }); }); await page.waitForTimeout(2000); return page.evaluate(() => { const c = __island, r = c.renderer.info.render; const m = []; c.village.built.g.traverse(o => { if (o.isMesh || o.isSprite) m.push(o.name); }); return { calls: Math.round(c.__vt.calls / Math.max(1, c.__vt.n)), tris: r.triangles, villageObjs: m.length, lotMeshes: c.village.lots.map(L => L.mesh ? L.mesh.geometry.attributes.position.count / 3 | 0 : 0) }; }); };
log.push(['draw', await calls()]);
// về lô của em, mở chế độ xây
await page.evaluate(() => { const c = __island, L = c.village.mine; c.player.teleport(L.x + 10, L.z - 2, L.y + 0.3); c.player.cam.yaw = Math.PI; });
await page.waitForTimeout(1500);
await page.evaluate(() => __island.village.castBuild());
await page.waitForTimeout(1200);
log.push(['open', await page.evaluate(() => __island.village.builder.active)]);
await shot('02-che-do-xay');
// chạm thật: nền ở vài điểm trên màn hình
const tap = async (x, y) => { if (MOBILE) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(250); };
const vw = MOBILE ? 390 : 1280, vh = MOBILE ? 844 : 720;
const n0 = await page.evaluate(() => __island.village.mine.pieces.length);
for (const [fx, fy] of [[0.5, 0.42], [0.45, 0.42], [0.55, 0.42], [0.5, 0.36]]) await tap(vw * fx, vh * fy);
const n1 = await page.evaluate(() => __island.village.mine.pieces.length);
log.push(['taps placed', n1 - n0]);
await shot('02b-cham-dat-nen');
await page.evaluate(n => { const B = __island.village.builder; while (__island.village.mine.pieces.length > n) B.undo(); }, n0);
// đặt bằng API: nhà 3×5 tỷ lệ vàng + tường + mái + cầu thang + khối Rubik
await page.evaluate(() => {
  const B = __island.village.builder; B.setGems(500);
  for (let i = 1; i <= 3; i++) for (let j = 2; j <= 6; j++) B.place(['floor', i, j, 0, 0, 0]);
  for (let i = 1; i <= 3; i++) { B.place([i === 2 ? 'door' : 'wall', i, 2, 0, 2, 0]); B.place([i === 2 ? 'window' : 'wall', i, 6, 0, 0, 0]); }
  for (let j = 2; j <= 6; j++) { B.place([j % 2 ? 'window' : 'wall', 1, j, 0, 3, 0]); B.place([j % 2 ? 'window' : 'wall', 3, j, 0, 1, 0]); }
  for (let j = 2; j <= 6; j++) { B.place(['roof', 1, j, 1, 3, 0]); B.place(['roofp', 2, j, 1, 0, 0]); B.place(['roof', 3, j, 1, 1, 0]); }
  B.place(['stairs', 4, 4, 0, 0, 0]); for (let c = 0; c < 6; c++) B.place(['cube', 5, 2 + c, 0, 0, c]); B.place(['cube', 5, 4, 1, 0, 2]);
  B.place(['tree', 0, 8, 0, 0, 0]); B.place(['lamp', 0, 1, 0, 0, 0]); B.place(['tower', 4, 8, 0, 0, 0]); B.place(['tower', 4, 8, 1, 0, 0]);
  B.place(['table', 2, 4, 0, 0, 0]); B.place(['chair', 2, 5, 0, 1, 0]); B.place(['shelf', 1, 3, 0, 1, 0]); B.place(['sofa', 3, 4, 0, 3, 0]); B.place(['bush', 5, 0, 0, 0, 0]);
  for (let i = 0; i < 6; i++) B.place(['fence', i, 0, 0, 2, 0]);
});
await page.waitForTimeout(2500);
await shot('03-nha-tu-xay');
const ch = await page.evaluate(async () => { const m = await import('/js/island/academy/village-data.js'); const P = __island.village.mine.pieces; return m.challenges(0).map(c => c.id + ':' + c.check(P)).concat(['rect:' + JSON.stringify(m.floorRect(P))]); });
log.push(['challenges', ch]);
// xoay, xoá, hoàn tác
const und = await page.evaluate(() => { const B = __island.village.builder, L = __island.village.mine, n = L.pieces.length, g = B.gems; B.remove(L.pieces[L.pieces.length - 1]); const a = L.pieces.length; B.undo(); return { n, afterDel: a, afterUndo: L.pieces.length, gems: [g, B.gems] }; });
log.push(['undo', und]);
// đứng lên cầu thang / sàn
const gnd = await page.evaluate(() => { const c = __island, L = c.village.mine, S = 3.4; return { floor: c.groundExtra(L.x + 2.5 * S, L.z + 4.5 * S, L.y + 1), stairsLow: c.groundExtra(L.x + 4.5 * S, L.z + 4.1 * S, L.y + 1), stairsHigh: c.groundExtra(L.x + 4.5 * S, L.z + 4.9 * S, L.y + 4), cube: c.groundExtra(L.x + 5.5 * S, L.z + 2.5 * S, L.y + 3.5) }; });
log.push(['ground', gnd]);
log.push(['draw-build', await calls()]);
// góc khác: đi vòng ra sau
await page.evaluate(() => { const c = __island; c.player.cam.yaw = Math.PI * 0.75; c.player.cam.pitch = 0.45; });
await page.waitForTimeout(1500); await shot('04-nha-goc-khac');
// bảng thử thách
await page.click('#vb [data-a="ch"]'); await page.waitForTimeout(400); await shot('05-thu-thach');
await page.click('#mgCard [data-c]'); await page.waitForTimeout(800);
log.push(['gems after challenge', await page.evaluate(() => __island.village.builder.gems)]);
// nhà gợi ý
await page.click('#vb [data-a="tpl"]'); await page.waitForTimeout(400); await shot('06-nha-goi-y');
await page.click('#mgCard [data-t="2"]'); await page.waitForTimeout(300); await shot('07a'); log.push(['cam0', await page.evaluate(() => [__island.camera.position.toArray(), __island.player.pos.toArray()])]); await page.waitForTimeout(2200); log.push(['cam', await page.evaluate(() => [__island.camera.position.toArray(), __island.player.pos.toArray()])]); await shot('07-lau-dai-thap'); await page.waitForTimeout(4000); await shot('07b');
// thoát; xem lại lưu
await page.click('#vb [data-a="x"]'); await page.waitForTimeout(500);
log.push(['saved', await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('village.')).map(k => k + ':' + localStorage.getItem(k).length))]);
await overview('08-lang-sau-khi-xay');
log.push(['draw-final', await calls()]);
// bảng tin
await page.evaluate(() => __island.village.visitBoard()); await page.waitForTimeout(1500); await shot('09-bang-tin');
console.log(JSON.stringify(log, null, 1));
console.log('ERRORS', errors.length, errors.slice(0, 13));
await browser.close();
