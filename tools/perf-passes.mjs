// tools/perf-passes.mjs — Đo chi phí TỪNG PASS render của Đảo 3D ở chế độ điện thoại (390×844, DPR 2, UA iPhone → CFG.isMobile).
// Chạy: node server/index.js &  rồi  node tools/perf-passes.mjs [--out=thu/muc/anh] [--q=1,2] [--w=12] [--scenes=ngay,dem-mua] [--quick: chỉ ms/khung]
// Mỗi cảnh (ngày 13h nắng · đêm 22h mưa) × mỗi mức chất lượng: ms/khung khi chạy tự do (--w giây, mặc định 12), rồi "bớt từng phần"
// (dừng bóng đổ, tắt MSAA, bỏ pass chỉnh màu, ẩn bầu trời / mây / mưa / sương thấp): cột "-x" = số ms phần x tốn.
// (gl.finish / readPixels của Chromium + ANGLE không chờ GPU giả lập xong → không đo được từng pass bằng đồng hồ; đo bằng phép trừ.)
// GPU giả lập (SwiftShader, chạy trên CPU) → chỉ so sánh tương đối giữa các cấu hình, không phải FPS máy thật.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), QS = (arg('q') || '1,2').split(',').map(Number);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => {
  const c = __island, P = window.__pp = { frame: 0, cpu: 0 };
  c.renderer.info.autoReset = false; const pr = c.post.render; c.post.render = function () { P.frame++; c.renderer.info.reset(); const r = pr.call(this); P.calls = c.renderer.info.render.calls; return r; };
  const find = k => { let f = null; c.scene.traverse(o => { if (!f && o.material && o.material.uniforms && o.material.uniforms[k]) f = o; }); return f; };
  window.__parts = { sky: find('uMoon'), rain: find('uRain'), mist: c.ambience && c.ambience.mist || null, clouds: c.sky.clouds };
});
// thời gian khung (ms) khi chạy tự do W giây; "off" = tắt thử 1 phần (layers, không đụng .visible mà file khác điều khiển mỗi khung)
const W = +(arg('w') || 12);
const measure = (off) => page.evaluate(async ([W, off]) => {
  const P = __pp, parts = __parts, c = __island, saved = [], passes = c.post.composer.passes, msaa = c.post.composer.renderTarget1.samples;
  const hideAll = o => o && o.traverse(x => { saved.push([x, x.layers.mask]); x.layers.mask = 0; });
  if (off === 'shadow') c.renderer.shadowMap.autoUpdate = false;
  else if (off === 'msaa') c.post.setMSAA(0);
  else if (off === 'grade') passes.forEach(p => { if (p.uniforms && p.uniforms.uSharp && passes.indexOf(p) < passes.length - 1) p.enabled = false; });
  else if (off) hideAll(parts[off]);
  await new Promise(r => setTimeout(r, 1500));
  const f0 = P.frame, t0 = performance.now(); await new Promise(r => setTimeout(r, W * 1000)); const ms = (performance.now() - t0) / (P.frame - f0);
  c.renderer.shadowMap.autoUpdate = true; for (const [x, m] of saved) x.layers.mask = m; passes.forEach(p => p.enabled = p.enabled || !!(p.uniforms && p.uniforms.uSharp));
  if (off === 'msaa') c.post.setMSAA(msaa);
  return +ms.toFixed(0);
}, [W, off]);
const SCENES = [['ngay', 13, 'clear'], ['dem-mua', 22, 'rain']].filter(([n]) => !arg('scenes') || arg('scenes').split(',').includes(n));
const rows = [];
const L = await page.evaluate(async () => (await import('/js/island/layout.js')).SPAWN);
await page.evaluate(([x, z]) => { const p = __island.player; p.teleport(x, z); p.cam.yaw = -Math.PI / 2 + 0.75; p.cam.pitch = 0.3; p.cam.dist = 11; p.snapCamera(); }, L);
await page.waitForTimeout(8000);   // chờ biên dịch shader/nạp model lần đầu xong (nếu không, cấu hình đo đầu tiên bị nặng giả)
for (const q of QS) for (const [name, hour, wt] of SCENES) {
  await page.evaluate(([q, hour, wt]) => {
    const c = __island, W = c.weather; c.setQuality(q, true); c.sky.state.lock = hour;
    W.set(wt, true); W.st.t = 1e9; Object.assign(W.cur, wt === 'rain' ? { c: 0.85, r: 0.75, w: 0.5, f: 0.25, wet: 1 } : { c: 0.05, r: 0, w: 0.1, f: 0, wet: 0 });
  }, [q, hour, wt]);
  await page.waitForTimeout(3000);
  const base = await measure(null), d = {};
  if (!process.argv.includes('--quick')) for (const off of ['shadow', 'msaa', 'grade', 'sky', 'clouds', 'rain', 'mist']) d['-' + off] = base - await measure(off);
  if (OUT) await page.screenshot({ path: `${OUT}/${name}-q${q}.png` });
  const info = await page.evaluate(() => ({ pr: +__island.renderer.getPixelRatio().toFixed(2), msaa: __island.post.composer.renderTarget1.samples, passes: __island.post.composer.passes.filter(p => p.enabled).length, calls: __pp.calls }));
  rows.push({ cảnh: name, q, ...info, 'ms/khung': base, ...d });
}
console.table(rows);
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
