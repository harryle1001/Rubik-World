// tools/broom-test.mjs — Kiểm thử chổi bay + Săn Cầu Vàng: node server/index.js & rồi node tools/broom-test.mjs <thư-mục-ra> [--mobile] [--part=broom|match|practice]
// Chụp ảnh, đo draw call trung bình (bay qua thị trấn / trong trận), in lỗi console.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const MOBILE = process.argv.includes('--mobile'), OUT = process.argv[2], PART = (process.argv.find(a => a.startsWith('--part=')) || '--part=broom').split('=')[1];
fs.mkdirSync(OUT, { recursive: true });
const errors = [], log = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
await page.locator('button[data-a="guest"], button:has-text("Chơi khách")').first().click({ timeout: 60000 }).catch(() => {});
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => Object.defineProperty(__island.sky.state, 'hour', { get: () => 10, set() {}, configurable: true }));
const sfx = MOBILE ? '-dt' : '';
const shot = async n => { await page.screenshot({ path: `${OUT}/${n}${sfx}.png`, timeout: 180000 }); };
const wait = ms => page.waitForTimeout(ms);
const calls = async (frames = 30) => page.evaluate(n => new Promise(res => { const inf = __island.renderer.info; inf.autoReset = false; inf.reset(); let k = 0; const f = () => { if (++k >= n) { const c = inf.render.calls / k; inf.autoReset = true; res(Math.round(c)); } else requestAnimationFrame(f); }; requestAnimationFrame(f); }), frames);
// camera đặt tay (nhìn nhân vật từ bên / trước) — gắn sau player.update
await page.evaluate(() => { const c = __island, r = c.player.update; c.player.update = function (dt) { const o = r.call(this, dt); const v = window.__v; if (v) { const p = c.player.pos; c.camera.position.set(p.x + Math.sin(v.a) * v.d, p.y + v.h, p.z + Math.cos(v.a) * v.d); c.camera.lookAt(p.x, p.y + 1.1, p.z); } return o; }; });
const key = async (code, ms) => { await page.keyboard.down(code); await wait(ms); await page.keyboard.up(code); };
const tp = (u, v, y) => page.evaluate(([u, v, y]) => import('/js/island/academy/plan.js').then(P => { const [x, z] = P.toWorld(u, v); __island.player.teleport(x, z, y); }), [u, v, y]);

if (PART === 'broom') {
  // 1) Gọi chổi ở thị trấn, bay lên, chụp tư thế
  for (let k = 0; k < 8 && !(await page.evaluate(() => __island.vehicles.riding === 'broom')); k++) { await page.evaluate(() => { document.activeElement && document.activeElement.blur(); if (!__island.player.frozen) __island.brooms.summon(); }); await wait(1500); }
  log.push('riding ' + await page.evaluate(() => __island.vehicles.riding));
  if (MOBILE) { await page.locator('#bUp').dispatchEvent('pointerdown'); await wait(2500); await page.locator('#bUp').dispatchEvent('pointerup'); }
  else await key('Space', 2500);
  await page.evaluate(() => { const p = __island.player; p.teleport(p.pos.x, p.pos.z, p.pos.y + 13); });   // máy ảo chạy chậm: nâng nhanh cho đủ cao
  log.push('alt ' + await page.evaluate(() => __island.player.pos.y.toFixed(1)));
  await page.evaluate(() => { window.__v = { a: __island.player.rot + Math.PI / 2, d: 3.2, h: 1.4 }; }); await wait(1200); await shot('b1-tu-the-ben');
  await page.evaluate(() => { window.__v = { a: __island.player.rot + Math.PI * 0.8, d: 3.4, h: 1.6 }; }); await wait(800); await shot('b2-ao-choang');
  await page.evaluate(() => { window.__v = null; });
  // 2) bay qua thị trấn (tiến về phía trước) + đo draw call
  await page.keyboard.down('KeyW'); await page.keyboard.down('ShiftLeft'); await wait(3000);
  log.push('drawcalls town flight ' + await calls()); await shot('b3-bay-qua-thi-tran');
  await page.keyboard.up('ShiftLeft'); await page.keyboard.up('KeyW');
  // 3) lao xuống mái nhà: không xuyên
  const roof = await page.evaluate(() => { const c = __island, b = (c.boxes || []).filter(b => b.top > 4 && b.top < 20 && (b.x1 - b.x0) > 5).sort((a, b) => Math.hypot((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2) - Math.hypot((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2))[0]; if (!b) return null; const x = (b.x0 + b.x1) / 2, z = (b.z0 + b.z1) / 2; c.player.teleport(x, z, b.top + 1.2); return [x, z, b.top]; });
  await key('KeyC', 6000);
  log.push('roof ' + JSON.stringify(roof) + ' y=' + await page.evaluate(() => __island.player.pos.y.toFixed(2)));
  // 4) giá chổi Sân Đại Sảnh Học viện
  await page.evaluate(() => __island.vehicles.dismount()); await page.evaluate(() => { const v = __island.vehicles.current; if (v) { __island.player.teleport(__island.player.pos.x, __island.player.pos.z, 0); } });
  await page.evaluate(() => { const c = __island; c.vehicles.current && (c.player.vy = 0); });
  await tp(22, 0, 56); await wait(9000); await tp(22, 0, 56); await wait(4000);
  await page.evaluate(() => { const c = __island; c.player.cam.yaw = 0; c.player.cam.pitch = 0.25; });
  await page.evaluate(() => { window.__v = { a: 0, d: 13, h: 4 }; }); await wait(2500); await shot('b4-gia-choi-hoc-vien');
  await page.evaluate(() => { window.__v = null; });
  log.push('brooms in academy: ' + await page.evaluate(() => __island.vehicles.all.filter(v => v.type === 'broom').length));
}

if (PART === 'match' || PART === 'practice') {
  const [OX, OZ] = await page.evaluate(() => import('/js/island/academy/plan.js').then(P => P.toWorld(-34, 172)));
  await page.evaluate(([x, z]) => __island.player.teleport(x, z - 21, 26), [OX, OZ]); await wait(9000);
  await page.waitForFunction(() => __island.pitch, null, { timeout: 60000 });
  for (let k = 0; k < 8 && !(await page.evaluate(() => __island.vehicles.riding === 'broom')); k++) { await page.evaluate(() => { document.activeElement && document.activeElement.blur(); if (!__island.player.frozen) __island.brooms.summon(); }); await wait(1500); }
  await page.evaluate(([x, z]) => { __island.player.teleport(x, z - 21, 26); __island.player.cam.yaw = Math.PI; }, [OX, OZ]); await wait(4000);
  if (PART === 'match') {
    for (let k = 0; k < 6 && !(await page.evaluate(() => !!__island.pitch.match)); k++) { await page.evaluate(() => __island.pitch.start('att', 180)); await wait(3000); }
    log.push('info ' + await page.evaluate(() => document.getElementById('info').textContent.slice(0, 80)));
    await page.waitForFunction(() => __island.pitch.match && !__island.pitch.match.loading, null, { timeout: 120000 }); await wait(4000);
    await page.evaluate(() => { window.__v = { a: Math.PI + 0.3, d: 9, h: 3 }; }); await wait(1500); await shot('m1-vao-tran');
    log.push('drawcalls match ' + await calls());
    await page.evaluate(() => { window.__v = null; });
    // ghi bàn: cầm bóng trước vòng giữa phía nam, bấm E
    await page.evaluate(() => { const c = __island, M = c.pitch.match, [ox, oz] = c.pitch.origin; M.ball.owner = M.me; c.player.teleport(ox, oz + 40, 34 - 0.5); c.player.setRot(0); c.player.cam.yaw = Math.PI; });
    await wait(1200); await shot('m2-cam-bong');
    const s0 = await page.evaluate(() => __island.pitch.match.teams[0].score);
    if (MOBILE) await page.locator('#bAct').tap().catch(e => log.push('tap ' + e.message)); else await key('KeyE', 200);
    await page.waitForFunction(s0 => __island.pitch.match.teams[0].score > s0, s0, { timeout: 30000 }).catch(() => {});
    log.push('score after throw ' + await page.evaluate(() => __island.pitch.match.teams.map(t => t.score).join('-')));
    // Cầu Vàng thức dậy
    await page.evaluate(() => { __island.pitch.match.t = 34.5; }); await page.waitForFunction(() => __island.pitch.match && __island.pitch.match.goldOn, null, { timeout: 60000 }); await wait(2000);
    await page.evaluate(() => { const c = __island, g = c.pitch.match.goldPos; c.player.teleport(g.x, g.z - 7, g.y - 1); c.player.cam.yaw = Math.PI; window.__v = { a: Math.PI * 0.85, d: 6, h: 1.8 }; }); await wait(900); await shot('m3-cau-vang');
    await page.evaluate(() => { window.__v = null; });
    // giữa hiệp: câu hỏi nhanh
    await page.evaluate(() => { const M = __island.pitch.match; M.left = M.dur / 2 + 0.05; }); await page.waitForSelector('#mgCard', { timeout: 60000 }).catch(() => {}); await wait(1000); await shot('m4-cau-hoi-giua-hiep');
    const a = await page.evaluate(() => { const c = document.getElementById('mgCard'); return c ? +c.dataset.a : -1; });
    if (a >= 0) await page.locator(`#mgCard button[data-i="${a}"]`).click(); await wait(3000);
    log.push('boost ' + await page.evaluate(() => __island.pitch.match.boostT.toFixed(1)));
    // bắt Cầu Vàng → thắng ván
    await page.evaluate(() => { const c = __island, g = c.pitch.match.goldPos; c.player.teleport(g.x, g.z, g.y); }); await page.waitForFunction(() => !__island.pitch.match || __island.pitch.match.winner != null, null, { timeout: 30000 }).catch(() => {});
    log.push('winner ' + await page.evaluate(() => __island.pitch.match && __island.pitch.match.winner));
    await page.waitForFunction(() => !__island.pitch.match, null, { timeout: 60000 }).catch(() => {}); await wait(800); await shot('m5-ket-qua');
    log.push('house ' + JSON.stringify(await page.evaluate(() => __island.houses && __island.houses.rec && __island.houses.rec())));
  } else {
    await page.evaluate(() => __island.pitch.rings()); await wait(1500);
    await page.evaluate(() => { window.__v = { a: Math.PI + 0.25, d: 8, h: 3 }; }); await wait(1200); await shot('p1-luyen-bay-vong'); await page.evaluate(() => { window.__v = null; });
    for (let k = 0; k < 13; k++) { await page.evaluate(() => { const R = __island.pitch.practice; if (!R) return; const q = R.pts[R.i]; __island.player.teleport(q.x, q.z, q.y - 0.5); }); await wait(900); if (k === 6) await shot('p2-giua-duong'); }
    await wait(1200); await shot('p3-ve-dich'); log.push('practice done ' + await page.evaluate(() => !__island.pitch.practice) + ' best ' + await page.evaluate(() => localStorage.getItem('sk.ring.best')));
  }
}
fs.writeFileSync(`${OUT}/test-${PART}${sfx}.json`, JSON.stringify({ log, errors }, null, 1));
console.log(log.join('\n')); if (errors.length) console.log('LỖI:\n' + errors.join('\n'));
await browser.close();
