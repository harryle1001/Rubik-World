// tools/build-test.mjs — Kiểm thử Đồng Pha Lê với 2 người chơi: node server/index.js & rồi node tools/build-test.mjs <thư-mục-ra> [--mobile] [--hour=10]
// A nhận lô, đặt/phá khối (ngắm thật), dựng mẫu lâu đài + tháp + nhà (tự trả lời câu đố nạp năng lượng); B nhận lô khác và phải thấy khối của A.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const H = +(process.argv.find(a => a.startsWith('--hour=')) || '--hour=10').split('=')[1], sfx = MOBILE ? '-dt' : '';
const errors = [], log = [];
const [PA, PB] = (process.argv.find(a => a.startsWith('--plots=')) || '--plots=2,3').split('=')[1].split(',').map(Number);   // lô của A, B
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function open(name, mobile) {
  const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
  page.on('console', m => { if (m.type() === 'error') errors.push(name + ': ' + m.text()); }); page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
  await page.addInitScript(n => { try { localStorage.setItem('island.tut', '1'); localStorage.setItem('island.name', n); localStorage.setItem('academy.wand', JSON.stringify({ wood: 'thong', core: 'lam' })); localStorage.removeItem('build.key'); } catch (e) {} }, name);
  await page.goto('http://localhost:3000/ocean.html');
  await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
  for (let i = 0; i < 20; i++) { const g = page.getByText('Chơi khách', { exact: true }); if (await g.count() && await g.first().isVisible()) { await g.first().click().catch(() => {}); break; } await page.waitForTimeout(500); }
  await page.evaluate(H => Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true }), H);
  return page;
}
const answer = async page => { await page.waitForTimeout(300); const a = await page.evaluate(() => { const c = document.getElementById('mgCard'); return c ? +c.dataset.a : -1; }); if (a >= 0) await page.locator(`#mgCard button[data-i="${a}"]`).click(); await page.waitForTimeout(1800); return a >= 0; };
// tới giữa lô i, nhìn xuống chỗ (a, b) trong lô
const goPlot = async (page, i, look) => page.evaluate(([i, look]) => {
  const c = __island, W = 21, [x, z] = c.build.origin(i);
  c.player.teleport(x + (look ? look[0] : W / 2), z + (look ? look[1] + 5 : W / 2)); c.player.cam.yaw = Math.PI; if (c.player.cam.pitch !== undefined) c.player.cam.pitch = -0.5;
}, [i, look]);
const bail = e => { console.log(log.join('\n')); console.log('LỖI', e.message, errors.join('\n')); process.exit(1); };
process.on('uncaughtException', bail); process.on('unhandledRejection', e => { console.log(log.join('\n')); console.log('LỖI', e.message, errors.join('\n')); process.exit(1); });
try { } catch (e) {}
const A = await open('Bé An', MOBILE);
await goPlot(A, PA); await A.waitForTimeout(9000);
log.push('A offer: ' + await A.evaluate(() => { const b = document.getElementById('bAct'); return b.hidden ? '(ẩn)' : b.textContent; }));
await A.evaluate(() => document.getElementById("bAct").click()); await A.waitForTimeout(2500); log.push("A tại lô: " + JSON.stringify(await A.evaluate(() => [__island.player.pos.x, __island.player.pos.z, __island.build.origin(0)])));
log.push('A mine=' + await A.evaluate(() => __island.build.mine));
await A.evaluate(() => { __island.magic.setMana(100); __island.build.setMode(true); }); await A.waitForTimeout(800);
for (let n = 0; n < 5; n++) { await A.locator('#bdUI button[data-a="put"]').click(); await A.waitForTimeout(350); await answer(A); }
log.push('A sau 5 lần Đặt: ' + await A.evaluate(() => __island.build.plots[__island.build.mine].blocks.size) + ' khối, mana ' + await A.evaluate(() => __island.magic.mana));
await A.locator('#bdUI button[data-a="del"]').click(); await A.waitForTimeout(500);
log.push('A sau Phá: ' + await A.evaluate(() => __island.build.plots[__island.build.mine].blocks.size));
// mẫu: lâu đài + tháp + nhà + khối Rubik (đặt dần; hết năng lượng thì giải câu đố)
const stamp = async (id, at) => { await A.evaluate(([id, at]) => { const b = __island.build; b.stamp(b.templates.find(t => t.id === id), at); }, [id, at]);
  for (let k = 0; k < 400; k++) { await A.waitForTimeout(700); await answer(A); if (!(await A.evaluate(() => __island.build.queue))) break; } };
await stamp('castle', [4, 4]);
const s1 = await A.evaluate(() => __island.build.plots[__island.build.mine].blocks.size); log.push('A sau lâu đài: ' + s1 + ' khối');
await stamp('tower', [0, 0]); await stamp('rubik', [17, 17]);
log.push('A tổng: ' + await A.evaluate(() => __island.build.plots[__island.build.mine].blocks.size) + ' khối');
// ảnh A: nhìn lô từ trên cao chéo
const view = async (page, i, n) => { await page.evaluate(i => { const c = __island, o = c.build.origin(i), x = o[0] + 10.5, z = o[1] + 10.5; c.player.teleport(x, z + 16); window.__cam = { cam: [x + 13, c.player.pos.y + 13, z + 24], look: [x, c.player.pos.y + 3, z] };
  if (!window.__hooked) { window.__hooked = 1; const pu = c.player.update; c.player.update = function (dt) { const o = pu.call(this, dt); if (window.__cam) { c.camera.position.set(...__cam.cam); c.camera.lookAt(...__cam.look); } return o; }; } }, i); await page.waitForTimeout(4000); await page.screenshot({ path: `${OUT}/${n}${sfx}.png` }); };
await view(A, PA, 'b-lo-cua-an');
// B: người chơi thứ hai, máy tính, nhận lô 3 và thấy khối của A
const B = await open('Bé Bình', false);
await goPlot(B, PB); await B.waitForTimeout(9000); await B.evaluate(() => document.getElementById('bAct').click()); await B.waitForTimeout(2000);
log.push('B mine=' + await B.evaluate(() => __island.build.mine) + ' · B thấy lô A: ' + await B.evaluate(PA => __island.build.plots[PA].blocks.size + ' khối, chủ ' + __island.build.plots[PA].name, PA));
await view(B, PA, 'b-ban-be-thay');
await B.evaluate(() => { const c = __island; window.__cam = null; c.build.setMode(true); }); await B.waitForTimeout(1500); await B.screenshot({ path: `${OUT}/b-che-do-xay.png` });
fs.writeFileSync(`${OUT}/build-test${sfx}.json`, JSON.stringify({ log, errors }, null, 1));
console.log(log.join('\n')); if (errors.length) console.log('LỖI:\n' + errors.join('\n'));
await browser.close();
