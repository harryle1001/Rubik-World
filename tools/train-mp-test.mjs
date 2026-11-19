// tools/train-mp-test.mjs — 2 trình duyệt cùng chuyến Tàu Pha Lê: cả 2 lên tàu, A ngồi ghế, B đứng cạnh nhìn A;
// kiểm tra: B thấy A trên tàu (toạ độ toa), ghế A ngồi bị khoá với B, tàu khởi hành cùng lúc theo giờ server.
// Chạy: node server/index.js &  rồi  node tools/train-mp-test.mjs [--out=docs/shots/train-v2]
import { createRequire } from 'module';
import { open } from './train-test.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = (process.argv.find(a => a.startsWith('--out=')) || '--out=docs/shots/train-v2').slice(6);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const [A, B] = await Promise.all([open(browser, false), open(browser, true)]);
await Promise.all([A, B].map(p => p.waitForFunction(() => __island.net.connected, null, { timeout: 60000 })));
for (const p of [A, B]) { await p.evaluate(() => __island.train.ride.board()); await p.waitForTimeout(1500); }
const seat = await A.evaluate(() => __island.train.ride.debugSit());
await A.waitForTimeout(1500);
// B đi tới cạnh ghế A (cùng toa, lối đi), quay camera về phía A
const info = await B.evaluate(id => { const t = __island.train, s = t.interior.byId.get(id), r = t.ride; r.debugGo(s.car); const cs = r.cabin.state; cs.z = s.z + (s.z > 0 ? -1.6 : 1.6); cs.x = t.consist.cars[s.car].type === 'compart' ? 1.04 : 0; return { car: s.car, taken: cs.taken(id) }; }, seat);
await B.waitForTimeout(2500);
const seen = await B.evaluate(() => [...__island.net.others.values()].map(o => ({ tr: o.tr, vis: o.h.root.visible })));
console.log('A ngồi ghế', seat, '· B thấy ghế đã có người:', info.taken, '· B thấy A trên tàu:', JSON.stringify(seen));
await B.screenshot({ path: `${OUT}/mp-B-sees-A-mobile.png` });
await A.screenshot({ path: `${OUT}/mp-A-seated-desktop.png` });
// chờ khởi hành chung (21 s sau người lên đầu tiên)
await A.waitForFunction(() => __island.train.ride.state.phase === 'run', null, { timeout: 60000 });
const t = await Promise.all([A, B].map(p => p.evaluate(() => ({ ph: __island.train.ride.state.phase, s: +__island.train.ride.state.sHead.toFixed(1) }))));
console.log('Khởi hành:', JSON.stringify(t));
await B.waitForTimeout(8000);
await B.screenshot({ path: `${OUT}/mp-run-B-mobile.png` });
const t2 = await Promise.all([A, B].map(p => p.evaluate(() => +__island.train.ride.state.sHead.toFixed(1))));
console.log('Vị trí đầu tàu A/B sau 8 s:', t2.join(' / '));
await browser.close();
