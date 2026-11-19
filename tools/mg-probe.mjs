// tools/mg-probe.mjs — Gỡ lỗi 1 mini game: node tools/mg-probe.mjs <khoá> "<biểu thức JS chạy trong trang>" [ảnh.png]
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const K = process.argv[2], CODE = process.argv[3] || '';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error' || m.text().startsWith('PROBE')) console.log(m.text().slice(0, 400)); });
await p.goto('http://localhost:3000/ocean.html');
await p.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.player.hero, null, { timeout: 240000 });
await p.waitForTimeout(1500); await p.evaluate(() => { const b = document.querySelector('[data-a="guest"]'); if (b && b.offsetParent) b.click(); });
if (K) { await p.evaluate(k => __island.mg.start(k, __island.mg.doorOf(k)), K); await p.waitForTimeout(5000); }
if (CODE) console.log('PROBE', JSON.stringify(await p.evaluate(CODE)));
await p.screenshot({ path: process.argv[4] || 'mg-probe.png' });
await b.close();
