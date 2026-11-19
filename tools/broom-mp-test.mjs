// tools/broom-mp-test.mjs — 2 người cùng trận Săn Cầu Vàng qua server: node server/index.js & rồi node tools/broom-mp-test.mjs <thư-mục-ra>
// A vào trận trước (chủ trận), B vào sau (khách, được xếp vào đội kia thay 1 NPC). Kiểm tra: B bắt bóng / ném, điểm đồng bộ, kết thúc đồng bộ.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const errors = [], log = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function open(tag) {
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(tag + ': ' + m.text()); });
  page.on('pageerror', e => errors.push(tag + ' pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
  await page.goto('http://localhost:3000/ocean.html');
  await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 400000 });
  await page.locator('button[data-a="guest"], button:has-text("Chơi khách")').first().click({ timeout: 15000 }).catch(() => {});
  await page.evaluate(() => Object.defineProperty(__island.sky.state, 'hour', { get: () => 10, set() {}, configurable: true }));
  const [x, z] = await page.evaluate(() => import('/js/island/academy/plan.js').then(P => P.toWorld(-34, 172)));
  await page.evaluate(([x, z]) => __island.player.teleport(x, z - 21, 26), [x, z]);
  await page.waitForFunction(() => __island.pitch && __island.net.connected, null, { timeout: 90000 }); await page.waitForTimeout(6000);
  return page;
}
const A = await open('A'), B = await open('B');
for (const [P, tag] of [[A, 'A'], [B, 'B']]) { P.on('console', m => { if (m.text().startsWith('SK')) log.push(tag + ' ' + m.text()); }); await P.evaluate(() => { const s = __island.net.sock; console.log('SK id ' + s.id); s.on('skRoom', d => console.log('SK room ' + JSON.stringify(d) + ' me ' + s.id)); s.on('disconnect', r => console.log('SK disconnect ' + r)); s.on('connect', () => console.log('SK connect ' + s.id)); }); }
const start = async P => { await P.waitForFunction(() => __island.net.connected, null, { timeout: 120000 }); for (let k = 0; k < 6 && !(await P.evaluate(() => !!__island.pitch.match)); k++) { await P.evaluate(() => __island.pitch.start('att', 180)); await P.waitForTimeout(3000); }
  await P.waitForFunction(() => __island.pitch.match && !__island.pitch.match.loading, null, { timeout: 120000 }); };
await start(A); await start(B); await B.waitForTimeout(4000);
const info = P => P.evaluate(() => { const M = __island.pitch.match; return M && { me: M.me.i, team: M.me.team.h.id, who: M.cfg.who.map(w => w ? (w === __island.net.sock.id ? 'ME' : 'R') : 0).join(''), s: M.teams.map(t => t.score).join('-'), left: Math.round(M.left), owner: M.ball.owner ? M.ball.owner.i : -1 }; });
log.push('A ' + JSON.stringify(await info(A)), 'B ' + JSON.stringify(await info(B)));
// B bay tới bóng → chủ trận xác nhận B cầm bóng
// chủ trận thả bóng tự do ngay chỗ B đứng → B (khách) gửi 'pick' / chủ tự thấy B chạm bóng
for (let k = 0; k < 10; k++) { await A.evaluate(() => { const M = __island.pitch.match, r = M.riders.find(r => r.remote), B = M.ball; B.owner = null; B.from = null; B.cd = 0; B.vel.set(0, 0, 0); B.mesh.position.set(r.pos.x, r.pos.y + 1, r.pos.z); }); await B.waitForTimeout(1500); if ((await info(A)).owner === (await info(B)).me) break; }
log.push('after pick A ' + JSON.stringify(await info(A)) + ' B ' + JSON.stringify(await info(B)));
await B.evaluate(() => { const c = __island, M = c.pitch.match, [ox, oz] = c.pitch.origin; c.player.teleport(ox, oz - 40, 33.5); c.player.setRot(Math.PI); c.player.cam.yaw = 0; });   // đội 1 tấn công vòng phía bắc
await B.waitForTimeout(2500); await B.screenshot({ path: `${OUT}/mp1-khach-cam-bong.png`, timeout: 120000 });
await B.keyboard.press('KeyE'); await B.waitForTimeout(6000);
log.push('after throw A ' + JSON.stringify(await info(A)) + ' B ' + JSON.stringify(await info(B)));
// góc nhìn chủ trận: thấy bạn B trên chổi
await A.evaluate(() => { const c = __island, M = c.pitch.match, r = M.riders.find(r => r.remote); if (r) c.player.teleport(r.pos.x + 4, r.pos.z + 6, r.pos.y); c.player.cam.yaw = Math.atan2(4, 6); });
await A.waitForTimeout(2500); await A.screenshot({ path: `${OUT}/mp2-chu-tran-thay-ban.png`, timeout: 120000 });
// chủ trận bắt Cầu Vàng → 2 bên cùng kết thúc
await A.evaluate(() => { __island.pitch.match.t = 34.5; }); await A.waitForFunction(() => __island.pitch.match && __island.pitch.match.goldOn, null, { timeout: 60000 }).catch(() => {});
await A.evaluate(() => { const c = __island, g = c.pitch.match.goldPos; c.player.teleport(g.x, g.z, g.y); });
await A.waitForFunction(() => !__island.pitch.match, null, { timeout: 60000 }).catch(() => {});
await B.waitForFunction(() => !__island.pitch.match, null, { timeout: 60000 }).catch(() => {});
log.push('end A ' + await A.evaluate(() => !__island.pitch.match) + ' B ' + await B.evaluate(() => !__island.pitch.match) + ' · B toast: ' + await B.evaluate(() => document.getElementById('info').textContent.slice(0, 120)));
await B.screenshot({ path: `${OUT}/mp3-khach-ket-qua.png`, timeout: 120000 });
fs.writeFileSync(`${OUT}/test-mp.json`, JSON.stringify({ log, errors }, null, 1));
console.log(log.join('\n')); if (errors.length) console.log('LỖI:\n' + errors.join('\n'));
await browser.close();
