// tools/walk-test.mjs — Tái hiện "đang đi thì bị bay ra biển": điện thoại 390×844, bấm 🏫 Đến trường, đi bộ thật (WASD + joystick cảm ứng)
// nhiều tuyến; ghi vị trí mỗi khung, báo bước nhảy > 5 m, vị trí NaN, đứng trên nước. Chạy: node server/index.js & rồi node tools/walk-test.mjs [--desktop]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DESK = process.argv.includes('--desktop'), URL = (process.argv.find(a => a.startsWith('--url=')) || '').slice(6) || 'http://localhost:3000/';
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(DESK ? { viewport: { width: 1280, height: 800 } } : {
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.warmed, null, { timeout: 300000 });
await page.waitForTimeout(2500);
const clearUi = async () => { for (let k = 0; k < 40; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click();
  const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); const n = [...document.querySelectorAll('button')].find(b => b.offsetParent && /^(Tiếp|Bắt đầu|Đi thôi|Hiểu rồi|OK|Đóng)/.test(b.textContent.trim()) && getComputedStyle(b).zIndex !== 'auto'); if (n) n.click();
  return !!(g || document.body.classList.contains('st-cut') || __island.player.frozen || __island.freeCam); }); if (!busy) return; await page.waitForTimeout(700); } };
await clearUi(); await page.waitForTimeout(500); await page.screenshot({ path: '/tmp/claude-0/sp/after-guest.png' });
await page.evaluate(() => {
  const c = __island, p = c.player, W = c.CFG ? c.CFG.island.waterLevel : 0;
  const L = window.__wt = { jumps: [], nan: 0, water: [], tps: [], n: 0, last: null, maxDt: 0, slow: 0 };
  const tp = p.teleport; p.teleport = function (x, z, y) { L.tps.push({ x, z, y, st: new Error().stack.split('\n').slice(2, 5).join(' | ') }); return tp.apply(this, arguments); };
  let lt = performance.now();
  const f = () => { const q = p.pos, now = performance.now(), dt = now - lt; lt = now; L.n++; if (dt > L.maxDt) L.maxDt = dt; if (dt > 100) L.slow++;
    if (!Number.isFinite(q.x + q.y + q.z)) L.nan++;
    if (L.last) { const d = Math.hypot(q.x - L.last[0], q.z - L.last[1]); if (d > 5) L.jumps.push({ from: L.last.map(v => +v.toFixed(1)), to: [+q.x.toFixed(1), +q.z.toFixed(1), +q.y.toFixed(1)], d: +d.toFixed(1), tp: L.tps.length }); }
    const h = c.terrain.heightAt(q.x, q.z), g = c.groundExtra ? c.groundExtra(q.x, q.z, q.y) : -99;
    if (!p.vehicle && !(c.dive && c.dive.swimming) && Math.max(h, g) < -0.5 && L.water.length < 20) L.water.push([+q.x.toFixed(1), +q.z.toFixed(1), +q.y.toFixed(1), +h.toFixed(2)]);
    L.last = [q.x, q.z]; requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
const press = async (keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };
// joystick cảm ứng (CDP) — giữ ngón tay ở nửa trái, kéo theo hướng (dx,dy)
const cdp = DESK ? null : await page.context().newCDPSession(page);
const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
async function joy(dx, dy, ms) { const x = 90, y = 650; await touch('touchStart', [{ x, y, id: 1 }]); for (let i = 1; i <= 5; i++) { await touch('touchMove', [{ x: x + dx * i / 5, y: y + dy * i / 5, id: 1 }]); await page.waitForTimeout(16); } await page.waitForTimeout(ms); await touch('touchEnd', []); }
const routes = [];
async function route(name, fn) { const a = await page.evaluate(() => { const p = __island.player.pos; return [+p.x.toFixed(1), +p.z.toFixed(1)]; }); await fn(); await page.waitForTimeout(300); const b = await page.evaluate(() => { const p = __island.player.pos; return [+p.x.toFixed(1), +p.z.toFixed(1), +p.y.toFixed(1)]; }); routes.push({ name, a, b }); }
await clearUi(); console.log('frozen?', await page.evaluate(() => [__island.player.frozen, !!__island.freeCam, document.body.className]));
await route('🏫 Đến trường', async () => { await page.evaluate(() => document.getElementById('bSchool').click()); await page.waitForTimeout(1200); });
await route('W 8 s (vào cổng)', () => press(['KeyW'], 8000));
await route('🏫 lại + D 6 s', async () => { await page.evaluate(() => document.getElementById('bSchool').click()); await page.waitForTimeout(800); await press(['KeyD'], 6000); });
await route('🏫 + S 6 s', async () => { await page.evaluate(() => document.getElementById('bSchool').click()); await page.waitForTimeout(800); await press(['KeyS'], 6000); });
await route('🏫 + A+W chạy 8 s', async () => { await page.evaluate(() => document.getElementById('bSchool').click()); await page.waitForTimeout(800); await press(['KeyA', 'KeyW', 'ShiftLeft'], 8000); });
if (!DESK) {
  await route('🏫 + joystick lên 10 s', async () => { await page.evaluate(() => document.getElementById('bSchool').click()); await page.waitForTimeout(800); await joy(0, -60, 10000); });
  await route('joystick phải 8 s', () => joy(60, 0, 8000));
  await route('joystick chéo trái-xuống 8 s', () => joy(-45, 45, 8000));
}
// đi lang thang ngẫu nhiên (đổi hướng mỗi 1–3 s, có chạy/nhảy) quanh trường — không vẽ hình (--fast) để đủ nhiều khung logic
const FAST = !process.argv.includes('--render'); if (FAST) await page.evaluate(() => { __island.post.__r = __island.post.render; __island.post.render = () => {}; });
const WANDER = +((process.argv.find(a => a.startsWith('--wander=')) || '').slice(9) || 90);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
await route(`lang thang ${WANDER} s`, async () => { await page.evaluate(() => document.getElementById('bSchool').click()); const t0 = Date.now(); const K = [['KeyW'], ['KeyW', 'KeyA'], ['KeyW', 'KeyD'], ['KeyA'], ['KeyD'], ['KeyS'], ['KeyW', 'ShiftLeft'], ['KeyW', 'Space']];
  while (Date.now() - t0 < WANDER * 1000) { const k = K[(rnd() * K.length) | 0]; if (rnd() < 0.15) await page.evaluate(() => { __island.player.cam.yaw += (Math.random() - 0.5) * 3; }); await press(k, 800 + rnd() * 2200); } });
await route('🏫 + W 21 s (đi xa)', async () => { await page.evaluate(() => document.getElementById('bSchool').click()); await page.waitForTimeout(800); await press(['KeyW', 'ShiftLeft'], 21000); });
const L = await page.evaluate(() => window.__wt);
console.table(routes);
console.log(`khung: ${L.n} · khung > 100 ms: ${L.slow} · dài nhất ${L.maxDt.toFixed(0)} ms · NaN: ${L.nan}`);
console.log('BƯỚC NHẢY > 5 m:', JSON.stringify(L.jumps, null, 0));
console.log('ĐỨNG TRÊN NƯỚC:', JSON.stringify(L.water));
console.log('teleport:', L.tps.map(t => `(${t.x?.toFixed?.(1)},${t.z?.toFixed?.(1)},${t.y}) ← ${t.st}`).join('\n  '));
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
