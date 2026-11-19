// tools/mg-test.mjs — Chơi thử tự động mọi mini game 3D (đảo): so draw call / JS mỗi khung với lúc đi bộ ngoài thế giới,
// rò geometry/texture sau 2 lần vào–thoát, lỗi console, ảnh chụp từng game.
// Chạy: node server/index.js &  rồi  node tools/mg-test.mjs [--mobile] [--only=chess,caro] [--shots=docs/mg-expand] [--secs=4]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const MOBILE = process.argv.includes('--mobile'), ONLY = arg('only') ? arg('only').split(',') : null, SHOTS = arg('shots'), SECS = +(arg('secs') || 4);
const URL = arg('url') || 'http://localhost:3000/ocean.html';
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 720 } });
let cur = 'nạp';
page.on('console', m => { if (m.type() === 'error') errors.push(`[${cur}] ${m.text().slice(0, 300)}`); });
page.on('pageerror', e => errors.push(`[${cur}] pageerror: ${e.message}`));
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.player.hero, null, { timeout: 240000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { await fr.waitForSelector('#mLogin:not([hidden])', { timeout: 30000 }).catch(() => {}); const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count()) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForTimeout(1500);
await page.evaluate(() => { const b = document.querySelector('[data-a="guest"]'); if (b && b.offsetParent) b.click(); });   // bảng đăng nhập đảo: chơi khách
await page.waitForTimeout(500);
await page.evaluate(() => {
  const c = __island, P = window.__perf = { n: 0, calls: 0, js: 0, mg: 0 };
  c.renderer.info.autoReset = false;
  const mu = c.mg.update; c.mg.update = function (...a) { const s = performance.now(); const r = mu.apply(this, a); P.mg += performance.now() - s; return r; };
  const r = c.post.render; let t0 = performance.now();
  c.post.render = function () { P.js += performance.now() - t0; c.renderer.info.reset(); r.call(this); P.n++; P.calls += c.renderer.info.render.calls; t0 = performance.now(); };
  // JS = thời gian từ lúc vẽ xong khung trước tới lúc bắt đầu vẽ khung này (≈ mọi update) — đo tương đối
  window.__sample = async ms => { P.n = 0; P.calls = 0; P.js = 0; P.mg = 0; await new Promise(r => setTimeout(r, ms)); const n = Math.max(1, P.n); return { calls: Math.round(P.calls / n), mgMs: +(P.mg / n).toFixed(2), fps: +(n / (ms / 1000)).toFixed(1) }; };
  window.__mem = () => ({ geo: c.renderer.info.memory.geometries, tex: c.renderer.info.memory.textures });
});
const walk = await page.evaluate(() => __sample(3000));
console.log('Đi bộ ngoài thế giới:', JSON.stringify(walk));
const keys = await page.evaluate(() => { const G = __island.miniGames, seen = new Set(), out = [];
  for (const [k, g] of Object.entries(G)) { if (g.group === 'academy' || seen.has(g)) continue; seen.add(g); out.push(k); } return out; });
const res = [];
for (const k of keys) {
  if (ONLY && !ONLY.includes(k)) continue;
  cur = k;
  const row = { k };
  try {
    const m0 = await page.evaluate(() => __mem());
    for (let rep = 0; rep < 2; rep++) {
      const ok = await page.evaluate(k => { const q = __island.mg.doorOf ? __island.mg.doorOf(k) : null; return __island.mg.start(k, q); }, k);
      if (!ok) { row.err = 'không mở được'; break; }
      await page.waitForTimeout(800); await page.evaluate(() => __island.mg.skipFly && __island.mg.skipFly());
      await page.waitForTimeout(SECS * 1000);
      if (rep === 0) {
        Object.assign(row, await page.evaluate(() => __sample(2500)));
        row.own = await page.evaluate(async () => { const a = __island.mg.api; if (!a) return null; a.root.visible = false; const off = await __sample(1200); a.root.visible = true; const on = await __sample(1200); return on.calls - off.calls; });
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/${k}${MOBILE ? '-m' : ''}.png` });
      }
      await page.evaluate(() => __island.mg.exit(true)); await page.waitForTimeout(800);
      if (rep === 0) row.m1 = await page.evaluate(() => __mem());
    }
    const m2 = await page.evaluate(() => __mem());
    row.leak = row.m1 ? `${m2.geo - row.m1.geo}g/${m2.tex - row.m1.tex}t` : '';
    row.first = row.m1 ? `${row.m1.geo - m0.geo}g/${row.m1.tex - m0.tex}t` : '';
    delete row.m1;
  } catch (e) { row.err = String(e).slice(0, 120); await page.evaluate(() => __island.mg.exit(true)).catch(() => {}); }
  console.log(JSON.stringify(row));
  res.push(row);
}
console.log('\n| game | draw call (đi bộ ' + walk.calls + ') | riêng | mg ms/khung | fps | rò lần 1 | rò lần 2 |');
for (const r of res) console.log(`| ${r.k} | ${r.calls ?? '-'} | ${r.own ?? '-'} | ${r.mgMs ?? '-'} | ${r.fps ?? '-'} | ${r.first || '-'} | ${r.leak || r.err || '-'} |`);
console.log('\nLỗi console:', errors.length ? '\n' + errors.join('\n') : 'không');
await browser.close();
