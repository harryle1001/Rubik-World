// tools/wild-test.mjs — Kiểm tra hệ động vật (wild/): dịch chuyển tới từng sinh cảnh, chụp ảnh, đếm thú, đo draw call / JS mỗi khung, bắt lỗi console.
// Chạy: PORT=3111 node server/index.js &  rồi  node tools/wild-test.mjs [--mobile] [--out=docs/animals] [--url=http://localhost:3111/ocean.html] [--only=farm,safari] [--lineup] [--nowild]
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const has = k => process.argv.includes('--' + k);
const MOBILE = has('mobile'), OUT = arg('out') || 'docs/animals', ONLY = (arg('only') || '').split(',').filter(Boolean), NOWILD = has('nowild');
const URL = (arg('url') || 'http://localhost:3111/') + (NOWILD ? '?nowild' : '');
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 300)));
await page.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); } catch (e) {} });
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 240000 });
// bảng tài khoản 3D → "Chơi khách" (bấm qua DOM: máy ảo vẽ chậm), bỏ qua đoạn dẫn chuyện mở đầu (như tools/smoke-test.mjs)
await page.locator('#accBox:not([hidden])').waitFor({ timeout: 13000 }).catch(() => {});
await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); });
for (let k = 0, calm = 0; k < 60 && calm < 8; k++) { await page.waitForTimeout(700); const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); const n = document.querySelector('#stSay button.nx'); if (n && n.offsetParent) n.click(); return document.body.classList.contains('st-cut') || !!__island.freeCam || __island.player.frozen; }); calm = busy ? 0 : calm + 1; }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => console.log('(player.frozen)'));
const FAST = has('fast'); await page.evaluate(k => __island.setQuality(1, true, k), FAST ? 7 : (MOBILE ? 0 : 3));
await page.evaluate(() => { const c = __island; c.sky.state.lock = 10; c.weather.set('clear', true); try { localStorage.setItem('island.tutorial', '1'); } catch (e) {} c.renderer.info.autoReset = false;
  const P = window.__wp = { n: 0, calls: 0, tris: 0, wild: 0, frame: 0 }; const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); r.call(this); P.n++; P.calls += c.renderer.info.render.calls; P.tris += c.renderer.info.render.triangles; };
  if (c.wild && c.wild.update) { const u = c.wild.update; c.wild.update = function (dt) { const s = performance.now(); u(dt); P.wild += performance.now() - s; }; }
  let last = performance.now(); (function loop() { const n = performance.now(); P.frame += n - last; P.raf = (P.raf || 0) + 1; last = n; requestAnimationFrame(loop); })(); });
if (!NOWILD) await page.waitForFunction(() => __island.wild.ready, null, { timeout: 60000 });
const sites = await page.evaluate(() => (__island.wild.sites || []).map(s => ({ hab: s.hab, tag: s.tag, x: +s.x.toFixed(1), z: +s.z.toFixed(1), r: s.r })));
if (!NOWILD) console.log('Điểm sinh cảnh:', sites.map(s => `${s.hab}/${s.tag}(${s.x},${s.z})`).join(' '), '· nhóm:', await page.evaluate(() => __island.wild.groups.length));
const tag = MOBILE ? 'm' : 'd', rows = [];
async function visit(name, x, z, { hour = 10, yaw = null, wait = 9000, weather = 'clear', day = null, off = 9, look = null } = {}) {
  await page.evaluate(([x, z, hour, yaw, weather, day, off, look]) => { const c = __island, p = c.player; c.sky.state.lock = hour; if (day != null) c.sky.state.day = day; c.weather.set(weather, true);
    const a = yaw ?? Math.atan2(x, z); p.teleport(x - Math.sin(a) * off, z - Math.cos(a) * off); if (p.cam) { p.cam.yaw = look ?? a + Math.PI; p.cam.yawV = 0; } }, [x, z, hour, yaw, weather, day, off, look]);
  await page.evaluate(() => { __wp.raf = 0; }); await page.waitForFunction(() => __wp.raf > (window.__wf || 40), null, { timeout: 300000, polling: 500 });   // chờ theo số khung (máy ảo vẽ chậm)
  await page.evaluate(() => { const P = __wp; P.n = 0; P.calls = 0; P.tris = 0; P.wild = 0; P.frame = 0; P.raf = 0; });
  await page.waitForFunction(() => __wp.n > 12, null, { timeout: 120000, polling: 300 });
  const st = await page.evaluate(() => { const P = __wp, c = __island, n = Math.max(1, P.n), w = c.wild, sp = {}; if (w && w.each) w.each(S => { sp[S.name] = (sp[S.name] || 0) + 1; });
    return { calls: Math.round(P.calls / n), tris: Math.round(P.tris / n), wildMs: +(P.wild / n).toFixed(3), frameMs: +(P.frame / Math.max(1, P.raf)).toFixed(1), actors: w && w.stats ? w.stats.actors : 0, flocks: w && w.stats ? w.stats.flocks : 0, sp, q: c.qualityLevel }; });
  if (!NOWILD) {   // ảnh cận: camera tự do đặt cách con vật gần tâm sinh cảnh nhất vài mét (không bị cây che)
    await page.evaluate(([x, z]) => { const c = __island; let best = null, bd = 1e9; const pick = any => c.wild.each((S, ax, ay, az, r, G, A) => { const d = Math.hypot(ax - x, az - z); if (d < bd && (any || A)) { bd = d; best = [ax, ay, az, r]; } }); pick(false); if (!best) pick(true); if (!best) return;
      const p = c.player.pos; let dx = p.x - best[0], dz = p.z - best[2]; const L = Math.hypot(dx, dz) || 1, D = Math.max(4.5, best[3] * 2.4); c.freeCam = true; c.camera.position.set(best[0] + dx / L * D, best[1] + D * 0.4 + 0.6, best[2] + dz / L * D); c.camera.lookAt(best[0], best[1], best[2]); }, [x, z]);
    await page.evaluate(() => { __wp.raf = 0; }); await page.waitForFunction(() => __wp.raf > 4, null, { timeout: 120000, polling: 300 });
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png` }); await page.evaluate(() => { __island.freeCam = false; });
  }
  rows.push({ name, ...st }); console.log(name.padEnd(14), JSON.stringify(st));
}
const S = h => sites.filter(s => s.hab === h);
const first = (h, t) => sites.find(s => s.hab === h && (!t || s.tag === t)) || S(h)[0];
const plan = [];
if (has('lineup')) {
  const list = await page.evaluate(async () => { const c = __island; c.player.teleport(0, 236); return await c.wild.lineup(); });
  await page.waitForTimeout(3000); await page.evaluate(() => { const c = __island; c.freeCam = true; c.camera.position.set(0, 34, 225); c.camera.up.set(0, 0, -1); c.camera.lookAt(0, 0, 217.5); });
  await page.waitForTimeout(1500); await page.screenshot({ path: `${OUT}/lineup-top.png` });
  await page.evaluate(() => { const c = __island; c.camera.up.set(0, 1, 0); c.camera.position.set(0, 9, 242); c.camera.lookAt(0, 1, 222); }); await page.waitForTimeout(1500); await page.screenshot({ path: `${OUT}/lineup.png` });
  console.log(list.map((l, i) => i + ':' + l.id).join(' '));
} else {
  const add = (name, s, o) => { if (s && (!ONLY.length || ONLY.includes(name))) plan.push([name, s.x, s.z, o || {}]); };
  if (NOWILD) { for (const [n, x, z] of JSON.parse(fs.readFileSync(`${OUT}/sites.json`, 'utf8'))) if (!ONLY.length || ONLY.includes(n)) plan.push([n, x, z, {}]); }
  else {
    add('farm', first('farm')); add('forest', first('forest', 'temple')); add('hills', first('hills')); add('grove', first('grove')); add('wet', first('wet', 'lotus')); add('meadow', first('meadow'));
    add('town', first('town')); add('safari', first('safari', 'savanna2')); add('safari-hole', first('safariW')); add('beach', first('beach')); add('sea', first('sea'), { off: 14 }); add('sea-deep', first('seaDeep'), { off: 24 });
    add('polarS', first('polarS'), { off: 7 }); add('polarN', first('polarN'), { off: 7 });
    add('forest-night', first('forest', 'temple'), { hour: 22 }); add('farm-night', first('farm'), { hour: 22.5 }); add('wet-rain', first('wet', 'lotus'), { weather: 'rain', hour: 21 });
    if (!ONLY.length) fs.writeFileSync(`${OUT}/sites.json`, JSON.stringify(plan.filter(p => !/night|rain/.test(p[0])).map(p => [p[0], p[1], p[2]])));
  }
  for (const [name, x, z, o] of plan) await visit(name, x, z, o);
  if (!NOWILD && (!ONLY.length || ONLY.includes('ui'))) {   // giao diện: ống nhòm, chụp ảnh, sổ tay, nhiệm vụ
    const h = first('safariW'); await visit('ui-hole', h.x, h.z, { off: 16 });
    await page.evaluate(() => { const c = __island, p = c.player.pos; let best = null, bd = 1e9; c.wild.each((S, x, y, z, r, G, A) => { const d = Math.hypot(x - p.x, z - p.z); if (A && d > 4 && d < bd) { bd = d; best = [x, y, z]; } });
      c.naturalist.setBino(5); if (best) { c.player.cam.yaw = Math.atan2(best[0] - p.x, best[2] - p.z) + Math.PI; c.player.cam.yawV = 0; c.player.cam.pitchV = 0; c.player.cam.pitch = 0.62 - (Math.atan2(best[1] - (p.y + 1.75), bd) - 0.02) / 1.1; } }); await page.evaluate(() => { __wp.raf = 0; }); await page.waitForFunction(() => __wp.raf > 45, null, { timeout: 300000, polling: 500 });
    await page.screenshot({ path: `${OUT}/${tag}-ui-bino.png` });
    await page.evaluate(() => { const b = document.getElementById('bAct'); if (b && !b.hidden) b.click(); }); await page.evaluate(() => { __wp.raf = 0; }); await page.waitForFunction(() => __wp.raf > 8, null, { timeout: 200000, polling: 500 });
    await page.evaluate(() => { const c = __island; c.naturalist.setBino(0); c.naturalist.open(); }); await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.querySelector('#natBook .c:not(.no) img') || document.querySelector('#natBook .c:not(.no)'); if (b) (b.closest('button') || b).click(); }); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${tag}-ui-book.png` });
    await page.evaluate(() => document.querySelector('#natBook [data-t="quest"]').click()); await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/${tag}-ui-quests.png` });
    const nat = await page.evaluate(() => { const c = __island, D = c.naturalist.data; c.naturalist.close(); return { seen: Object.keys(D.seen).length, photo: Object.keys(D.photo).length, obs: Object.keys(D.obs), top: [...document.querySelectorAll('.topbtns button')].map(b => Math.round(b.getBoundingClientRect().right)).join(',') }; });
    console.log('Sổ tay:', JSON.stringify(nat));
  }
  if (!ONLY.length) fs.writeFileSync(`${OUT}/perf-${tag}${NOWILD ? '-before' : ''}.json`, JSON.stringify(rows, null, 1));
}
console.log(errors.length ? 'LỖI:\n' + [...new Set(errors)].join('\n') : 'Không có lỗi console.');
await browser.close();
process.exit(errors.length ? 1 : 0);
