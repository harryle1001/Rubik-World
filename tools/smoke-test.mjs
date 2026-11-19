// tools/smoke-test.mjs — Kiểm tra nhanh Đảo Rubik 3D bằng Playwright (Chromium có sẵn).
// Chạy: node server/index.js &  rồi  node tools/smoke-test.mjs [--mobile] [--shot=duong/dan.png] [--url=http://localhost:3000/]
// Kiểm tra: tải game (đảo 3D là game duy nhất, mở ở "/"), đóng bảng tài khoản 3D nếu có, đi bộ 5 giây, không lỗi console, nhân vật có di chuyển,
// màn hình không đơn sắc (lấy mẫu pixel), in draw call / tam giác / thời gian JS mỗi khung (từng module).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const MOBILE = process.argv.includes('--mobile');
const URL = arg('url') || 'http://localhost:3000/';
const SHOT = arg('shot');
const WALK = +(arg('walk') || 5);
const fails = [], errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
const t0 = Date.now();
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 240000 });
console.log(`Tải xong sau ${((Date.now() - t0) / 1000).toFixed(1)}s`);
// bảng tài khoản 3D (account-hud.js) nếu hiện → "Chơi khách"
const acc = page.locator('#accBox:not([hidden])');
await acc.waitFor({ timeout: 13000 }).catch(() => {});   // bảng hiện trễ sau khi đảo dựng xong
if (await acc.count()) { const b = acc.getByText(/Chơi khách/); if (await b.count()) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => fails.push('nhân vật vẫn bị khoá (player.frozen) 30 s sau khi đóng bảng đăng nhập'));
await page.waitForTimeout(500);
// bọc đo: thời gian JS từng module + renderer.info mỗi khung
await page.evaluate(() => {
  const c = __island, P = window.__perf = { t: {}, n: 0, calls: 0, tris: 0, frame: 0, maxFrame: 0 };
  c.renderer.info.autoReset = false;
  const wrap = (name, o, fn = 'update') => { if (!o || !o[fn] || o[fn].__w) return; const f = o[fn]; o[fn] = function (...a) { const s = performance.now(); const r = f.apply(this, a); P.t[name] = (P.t[name] || 0) + performance.now() - s; return r; }; o[fn].__w = 1; };
  const pu = c.player.update; P.sim = 0; c.player.update = function (dt) { P.sim += dt; return pu.call(this, dt); };
  for (const k of ['player', 'physics', 'terrain', 'net', 'animals', 'school', 'aircraft', 'sky', 'weather', 'eggs', 'ambience', 'worldMap', 'audio']) wrap(k, c[k]);
  const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); const s = performance.now(); r.call(this); const d = performance.now() - s; P.t.render = (P.t.render || 0) + d; P.n++; P.calls += c.renderer.info.render.calls; P.tris += c.renderer.info.render.triangles; };
  let last = performance.now(); (function loop() { const n = performance.now(), d = n - last; last = n; P.frame += d; P.raf++; P.maxFrame = Math.max(P.maxFrame, d); requestAnimationFrame(loop); })();
});
const before = await page.evaluate(() => ({ x: __island.player.pos.x, z: __island.player.pos.z, frozen: __island.player.frozen, modal: document.body.classList.contains('rs-modal') }));
console.log('Trước khi đi:', JSON.stringify(before));
await page.evaluate(() => { const P = __perf; P.t = {}; P.n = 0; P.calls = 0; P.tris = 0; P.sim = 0; P.frame = 0; P.maxFrame = 0; P.raf = 0; });
// đi bộ: giữ W (máy tính) hoặc kéo joystick (điện thoại)
if (MOBILE) {
  const cx = 110, cy = 700;
  await page.evaluate(([cx, cy]) => {
    const cv = __island.renderer.domElement, mk = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: true }));
    mk('pointerdown', cx, cy); window.__joyMove = () => mk('pointermove', cx, cy - 60); window.__joyMove(); window.__joyUp = () => mk('pointerup', cx, cy - 60);
  }, [cx, cy]);
  for (let i = 0; i < WALK * 4; i++) { await page.evaluate(() => window.__joyMove()); await page.waitForTimeout(250); }
  await page.evaluate(() => window.__joyUp());
} else {
  await page.mouse.click(640, 360).catch(() => {});
  await page.keyboard.down('KeyW'); await page.waitForTimeout(WALK * 1000); await page.keyboard.up('KeyW');
}
const after = await page.evaluate(() => ({ x: __island.player.pos.x, z: __island.player.pos.z, frozen: __island.player.frozen, q: __island.qualityLevel, sim: +__perf.sim.toFixed(2), fps: +(1000 * __perf.raf / Math.max(1, __perf.frame)).toFixed(1), maxFrameMs: Math.round(__perf.maxFrame) }));
const moved = Math.hypot(after.x - before.x, after.z - before.z), expect = 5.5 * after.sim;   // tốc độ đi bộ CFG.player.walk × thời gian mô phỏng
console.log('Sau khi đi:', JSON.stringify(after), `→ đi được ${moved.toFixed(2)} m (đi bộ thẳng tối đa ≈ ${expect.toFixed(1)} m)`);
if (moved < Math.max(0.5, expect * 0.3)) fails.push(`nhân vật không di chuyển đủ (${moved.toFixed(2)} m / ${expect.toFixed(1)} m), frozen=${after.frozen}`);
const perf = await page.evaluate(() => { const P = __perf, n = Math.max(1, P.n), t = {}; for (const k in P.t) t[k] = +(P.t[k] / n).toFixed(2); return { frames: P.n, drawCalls: Math.round(P.calls / n), triangles: Math.round(P.tris / n), msPerFrame: t, geometries: __island.renderer.info.memory.geometries, textures: __island.renderer.info.memory.textures, programs: __island.renderer.info.programs.length }; });
console.log('Hiệu năng (trung bình mỗi khung):', JSON.stringify(perf, null, 1));
// màn hình đơn sắc? lấy mẫu pixel ảnh chụp
const png = await page.screenshot(SHOT ? { path: SHOT } : {});
const stats = await page.evaluate(async b64 => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const k = c.getContext('2d'); k.drawImage(img, 0, 0, 64, 64);
  const d = k.getImageData(0, 0, 64, 64).data, cols = new Set(); let sum = [0, 0, 0], sq = 0;
  for (let i = 0; i < d.length; i += 4) { cols.add((d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | d[i + 2] >> 4); sum[0] += d[i]; sum[1] += d[i + 1]; sum[2] += d[i + 2]; }
  const n = d.length / 4, m = sum.map(s => s / n); for (let i = 0; i < d.length; i += 4) sq += (d[i] - m[0]) ** 2 + (d[i + 1] - m[1]) ** 2 + (d[i + 2] - m[2]) ** 2;
  return { colors: cols.size, std: Math.sqrt(sq / n / 3), mean: m.map(Math.round) };
}, png.toString('base64'));
console.log('Màn hình:', JSON.stringify(stats));
if (stats.colors < 40 || stats.std < 12) fails.push(`màn hình gần như một màu ${JSON.stringify(stats)}`);
for (const e of errors) fails.push(e);
await browser.close();
if (fails.length) { console.log('\n❌ LỖI:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('\n✅ Ổn: không lỗi console, nhân vật di chuyển, màn hình bình thường.');
