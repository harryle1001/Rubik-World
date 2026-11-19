// tools/mg-duo.mjs — Thử chế độ 2 người (mg/meta.js + net.js): A vào cờ caro, B lại gần → "✋ Chơi cùng" → A đồng ý →
// B vào cùng game; A đi 1 nước → B nhận nước đi; điểm bảng toàn trường. Cần server đang chạy.  node tools/mg-duo.mjs [--shots=thư/mục]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').split('=')[1];
const URL = 'http://localhost:3000/ocean.html', errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function open(tag, mobile) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1000, height: 640 } });
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(`[${tag}] ${e.message}`)); p.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] ${m.text().slice(0, 200)}`); });
  await p.goto(URL); await p.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.player.hero && __island.net.connected, null, { timeout: 240000 });
  await p.waitForTimeout(1200); await p.evaluate(() => { const b = document.querySelector('[data-a="guest"]'); if (b && b.offsetParent) b.click(); });
  return p;
}
const A = await open('A'), B = await open('B', true);
const ok = (c, m) => console.log((c ? '✅ ' : '❌ ') + m);
await A.evaluate(() => { __island.mg.start('caro', __island.mg.doorOf('caro')); __island.mg.skipFly(); });
await A.waitForTimeout(3000);
await B.waitForFunction(() => [...__island.net.others.values()].some(o => o.mg), null, { timeout: 30000 }).catch(() => {});
const tagB = await B.evaluate(() => { const o = [...__island.net.others.values()].find(o => o.mg); return o && o.mg; });
ok(tagB && tagB.k === 'caro', 'B thấy A đang chơi: ' + JSON.stringify(tagB));
// B đi tới chỗ A
for (let k = 0; k < 13; k++) { const has = await B.evaluate(() => { const o = [...__island.net.others.values()].find(o => o.mg); if (!o) return false; const r = o.h.root.position, p = __island.player.pos; if (Math.hypot(r.x - p.x, r.z - p.z) > 6) __island.player.teleport(r.x + 2, r.z + 2); return document.getElementById('bAct').textContent.includes('Chơi cùng'); }); if (has) break; await B.waitForTimeout(1500); }
const offer = await B.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent).find(t => t.includes('Chơi cùng')));
ok(!!offer, 'B có nút: ' + offer);
await B.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Chơi cùng')); b && b.click(); });
await A.waitForFunction(() => { const j = document.getElementById('mgJoin'); return j && !j.hidden && j.querySelector('button.pri'); }, null, { timeout: 20000, polling: 200 }).catch(() => {});
if (SHOTS) await A.screenshot({ path: SHOTS + '/duo-invite.png' });
await A.evaluate(() => { const b = document.querySelector('#mgJoin button.pri'); b && b.click(); });
await B.waitForFunction(() => __island.mgActive === 'caro' && __island.mg.api && __island.mg.api.peer, null, { timeout: 30000 }).catch(() => {});
console.log('dbgB', JSON.stringify(await B.evaluate(() => ({ act: __island.mgActive, api: !!__island.mg.api, peer: __island.mg.api && __island.mg.api.peer && __island.mg.api.peer.name, join: document.getElementById('mgJoin') && document.getElementById('mgJoin').innerText }))), errors);
const duo = await B.evaluate(() => { const a = __island.mg.api; return a && a.peer && { name: a.peer.name, host: a.peer.host }; });
ok(duo && duo.host === false, 'B vào caro cùng A: ' + JSON.stringify(duo));
await B.evaluate(() => __island.mg.skipFly());
// A đi nước (6,6) qua hàm chạm: giả lập tap vào ô giữa bằng peer.send của game — dùng api.peer trực tiếp để không phụ thuộc toạ độ màn hình
await A.waitForTimeout(1500);
const sent = await A.evaluate(() => { const a = __island.mg.api; if (!a.peer) return false; const c = __island.renderer.domElement.getBoundingClientRect(); return true; });
ok(sent, 'A có api.peer (chủ khu, cầm X)');
// chạm giữa màn hình A (camera nhìn xuống tâm bàn)
const box = await A.evaluate(() => { const r = __island.renderer.domElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await A.evaluate(([x, y]) => { const cv = __island.renderer.domElement; for (const t of ['pointerdown', 'pointerup']) cv.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 3, bubbles: true, isPrimary: true })); }, box);
await A.waitForTimeout(800);
// host nghe pointerup trên window
await A.evaluate(([x, y]) => dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, pointerId: 3, bubbles: true })), box);
await B.waitForTimeout(2500);
const xs = await B.evaluate(() => { let n = 0; __island.mg.api.root.traverse(o => { if (o.isInstancedMesh && o.count && o.material.color && o.material.color.getHexString() === 'e8453c') n += o.count; }); return n; });
ok(xs >= 1, 'B thấy quân X của A trên bàn: ' + xs);
if (SHOTS) { await A.screenshot({ path: SHOTS + '/duo-A.png' }); await B.screenshot({ path: SHOTS + '/duo-B-m.png' }); }
// bảng toàn trường
const top = await A.evaluate(async () => { __island.net.emit('mgScore', { k: 'caro', s: 144 }); return await new Promise(r => { __island.net.on('mgTop', d => r(d)); setTimeout(() => r(null), 4000); }); });
ok(top && top.list && top.list.length, 'Bảng toàn trường: ' + JSON.stringify(top));
await A.evaluate(() => __island.mg.exit());
await B.waitForTimeout(2000);
const left = await B.evaluate(() => !(__island.mg.api && __island.mg.api.peer));
ok(left, 'A thoát → B được báo, bỏ chế độ 2 người');
console.log('Lỗi console:', errors.length ? '\n' + errors.join('\n') : 'không');
await browser.close();
