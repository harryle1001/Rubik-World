// tools/destiny-test.mjs — Kiểm tra RỪNG THIÊN ĐỊNH bằng Playwright: đi TRỌN lối mòn bí mật bằng phím thật (giữ W, xoay camera về mốc kế tiếp),
// thử 2 nhánh sai + lạc trong bãi sương (phải bị sương đưa về), khám phá → danh hiệu, bản đồ, cổng đá, lời ước, hít thở, 8 bí mật; đo draw call.
// Chạy: node server/index.js &  rồi  node tools/destiny-test.mjs [--mobile] [--shots=docs/shots/destiny-forest]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const MOBILE = process.argv.includes('--mobile'), SHOTS = arg('shots'), URL = arg('url') || 'http://localhost:3000/ocean.html';
const fails = [], errors = [], log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const bc = await browser.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : { viewport: { width: 1280, height: 720 } });
await bc.addInitScript(() => { try { localStorage.setItem('island.tut', '1'); localStorage.setItem('island.intro', '1'); } catch (e) {} });   // bỏ hướng dẫn + đoạn mở đầu
const page = await bc.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.destiny, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) await fr.waitForSelector('#mLogin:not([hidden])', { timeout: 60000 }).catch(() => {});
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count()) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForSelector('#accBox:not([hidden])', { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(500);   // bảng đăng nhập đảo hiện trễ
await page.evaluate(() => { const b = document.querySelector('#accBox [data-a=guest]'); if (b) b.click(); });   // bấm bằng DOM: máy kiểm thử vẽ < 1 FPS, Playwright chờ nút "đứng yên" sẽ quá giờ
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 20000 }).catch(() => fails.push('nhân vật bị khoá lúc vào game'));
// máy kiểm thử vẽ bằng CPU (vài FPS): lúc đi bộ tạm tắt vẽ để mô phỏng chạy đủ 60 khung/giây; chụp ảnh thì vẽ lại
const draw = on => page.evaluate(on => { const c = __island; if (!c.post.__r) c.post.__r = c.post.render; c.post.render = on ? c.post.__r : () => {}; }, on);
const shot = async name => { if (!SHOTS) return; await draw(true); await page.waitForTimeout(MOBILE ? 2600 : 2200); await page.screenshot({ path: `${SHOTS}/${name}${MOBILE ? '-mobile' : ''}.png` }); await draw(false); };
const pos = () => page.evaluate(() => { const p = __island.player.pos; return [p.x, p.z, p.y]; });
const setHour = h => page.evaluate(h => { __island.sky.state.lock = h; }, h);
const view = (yaw, pitch = 0.35, dist = 9) => page.evaluate(([yaw, pitch, dist]) => { const c = __island.player.cam; if (yaw != null) c.yaw = yaw; c.pitch = pitch; c.dist = dist; }, [yaw, pitch, dist]);
// giữ phím/joystick tiến tới
let joy = false;
async function hold(on) {
  if (MOBILE) {
    if (on && !joy) { await page.evaluate(() => { const cv = __island.renderer.domElement, mk = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: true })); mk('pointerdown', 110, 700); window.__jm = () => mk('pointermove', 110, 640); window.__ju = () => mk('pointerup', 110, 640); window.__jm(); }); joy = true; }
    else if (on) await page.evaluate(() => window.__jm());
    else if (joy) { await page.evaluate(() => window.__ju()); joy = false; }
  } else if (on) await page.keyboard.down('KeyW'); else await page.keyboard.up('KeyW');
}
// đi tới (x, z): xoay camera về đích mỗi 120 ms, giữ W; kẹt > 4 s → lỗi
async function walkTo(x, z, name, r = 1.1, maxS = 40) {
  const t0 = Date.now(); let best = 1e9, bestT = Date.now();
  await hold(true);
  for (;;) {
    const d = await page.evaluate(([x, z]) => { const c = __island, p = c.player.pos, dx = x - p.x, dz = z - p.z; c.player.cam.yaw = Math.atan2(-dx, -dz); return Math.hypot(dx, dz); }, [x, z]);
    if (d < r) break;
    if (d < best - 0.15) { best = d; bestT = Date.now(); }
    if (Date.now() - bestT > 6000 || Date.now() - t0 > maxS * 1000) { const p = await pos(); fails.push(`KẸT khi đi tới ${name} (${x}, ${z}) — đang ở (${p.map(v => v.toFixed(1))}), còn ${d.toFixed(1)} m`); await hold(false); return false; }
    if (MOBILE) await hold(true);
    await page.waitForTimeout(120);
  }
  await hold(false); return true;
}
const tp = (x, z, y) => page.evaluate(([x, z, y]) => { __island.player.teleport(x, z, y ?? undefined); __island.player.snapCamera(); }, [x, z, y]);
const act = () => page.evaluate(() => { const b = document.getElementById('bAct'); if (b.hidden) return null; const l = b.textContent; b.click(); return l; });
const toast = () => page.evaluate(() => document.getElementById('info').textContent);
const P = await page.evaluate(() => { const p = __island.destiny.plan; return { TRAIL: p.TRAIL, MIST: p.MIST, F1: p.F1, F2: p.F2, FOG: p.FOG, LANTERNS: p.LANTERNS, O: p.O, CARVING: p.CARVING, GUIDE: p.GUIDE, LEN: p.TRAIL_LEN, PIN: p.PORTAL_IN, POUT: p.PORTAL_OUT, STONES: p.STONES }; });
await page.evaluate(() => { __island.destiny.st.reset(); __island.destiny.ui.speed = 13; });
log('Lối mòn dài', P.LEN.toFixed(0), 'm'); await draw(false);

// 0) bản đồ: trước khi tìm ra, khối núi phải bị giấu
const hidden0 = await page.evaluate(() => __island.destiny.mapHide(-180, -280) && __island.destiny.places().length === 0);
if (!hidden0) fails.push('bản đồ không giấu Rừng Thiên Định trước khi tìm ra');
await page.evaluate(() => { __island.player.teleport(-112, -236); __island.worldMap.toggle(); }); await page.waitForTimeout(1200); await page.click('#wmap [data-z="me"]').catch(() => {}); for (let k = 0; k < 2; k++) await page.click('#wmap [data-z="0.7"]').catch(() => {}); await page.waitForTimeout(600); await shot('00-ban-do-chua-tim-ra'); await page.evaluate(() => __island.worldMap.toggle()); await page.waitForTimeout(300);

// 1) manh mối: bia khắc đá
await setHour(10.5); await tp(P.CARVING[0] + 1.6, P.CARVING[1] + 1.8); await page.waitForTimeout(900);
const a1 = await act(); if (!a1 || !/hình khắc/.test(a1)) fails.push('không có nút xem hình khắc đá: ' + a1); await view(-2.2, 0.3, 6); await page.waitForTimeout(700); await shot('01-hinh-khac-da');

// 2) đi trọn lối mòn từ bãi cụ Rùa
await tp(P.STONES[0][0] + 3.2, P.STONES[0][1] + 2.2); await view(null, 0.42, 8); await page.waitForTimeout(600);
const yBeach = (await pos())[2]; if (yBeach < 0.2) fails.push('điểm xuất phát ở bãi cụ Rùa bị ngập nước: y=' + yBeach.toFixed(2));
await shot('02-bai-cu-rua-da-buoc');
const route = [['đá bước đầu', P.STONES[0]], ['cửa khe', P.STONES[1]], ['đỉnh khe dốc', P.TRAIL[2]], ['ngã ba Mặt Trời', P.F1]];
let ok = true; let minY = 9;
for (const [n, [x, z]] of route) { ok = ok && await walkTo(x, z, n); const y = (await pos())[2]; if (n === 'cửa khe') { if (y < 0.1) fails.push('rơi xuống nước khi qua đá bước: y=' + y.toFixed(2)); await shot('03-cua-khe-day-leo'); } }
await view(null, 0.6, 9); await page.waitForTimeout(500); await shot('04-nga-ba-mat-troi');
// 2a) nhánh sai ở ngã ba 1 (Bắc) → sương đưa về
if (ok) { await walkTo(P.MIST[0][0], P.MIST[0][1], 'nhánh sai Bắc (ngã ba 1)', 2.0, 15); await page.waitForTimeout(1500); const p = await pos(); if (Math.hypot(p[0] - P.MIST[0][2], p[1] - P.MIST[0][3]) > 2.5) fails.push('nhánh sai ngã ba 1 không đưa về ngã ba: ' + p.map(v => v.toFixed(1))); else log('✓ nhánh sai ngã ba 1 → sương đưa về'); await page.waitForTimeout(600); }
// 2b) hướng Đông (đúng) → bãi sương
ok = ok && await walkTo(P.F1[0], P.F1[1], 'ngã ba 1 (lại)') && await walkTo(P.FOG.in[0], P.FOG.in[1], 'đầu bãi sương');
// lạc trong sương: đi thẳng hướng bắc, rời dãy đèn
if (ok) { await page.waitForTimeout(1200); await view(null, 0.3, 7); await shot('05-bai-suong-den-da');
  await walkTo(-104.5, -287, 'đi lạc trong sương', 0.8, 9).catch(() => {}); fails.pop && 0; await page.waitForTimeout(1500);
  const p = await pos(); if (Math.hypot(p[0] - P.FOG.in[0], p[1] - P.FOG.in[1]) > 3) { fails.push('lạc trong sương không được đưa về đầu bãi: ' + p.map(v => v.toFixed(1))); } else { log('✓ lạc trong sương → về đầu bãi'); const i = fails.findIndex(f => /đi lạc trong sương/.test(f)); if (i >= 0) fails.splice(i, 1); } await page.waitForTimeout(600); }
for (const [i, L] of P.LANTERNS.entries()) ok = ok && await walkTo(L[0] + 1.1, L[1] + 0.6, 'đèn đá ' + (i + 1), 1.3);
ok = ok && await walkTo(P.FOG.out[0], P.FOG.out[1], 'lối ra bãi sương') && await walkTo(P.F2[0], P.F2[1], 'ngã ba Rêu');
await view(null, 0.6, 9); await page.waitForTimeout(500); await shot('06-nga-ba-reu');
if (ok) { await walkTo(P.MIST[3][0], P.MIST[3][1], 'nhánh sai Tây (ngã ba 2)', 2.0, 15); await page.waitForTimeout(1500); const p = await pos(); if (Math.hypot(p[0] - P.MIST[3][2], p[1] - P.MIST[3][3]) > 2.5) fails.push('nhánh sai ngã ba 2 không đưa về: ' + p.map(v => v.toFixed(1))); else log('✓ nhánh sai ngã ba 2 → sương đưa về'); await page.waitForTimeout(600); }
const i2 = P.TRAIL.findIndex(q => q[0] === P.F2[0] && q[1] === P.F2[1]);
for (let i = i2; i < P.TRAIL.length; i++) { const [x, z] = P.TRAIL[i]; ok = ok && await walkTo(x, z, 'mốc lối mòn ' + i, 1.2); const p = await pos(); minY = Math.min(minY, p[2]);
  if (i === i2 + 4) { await view(null, 0.3, 7); await page.waitForTimeout(400); await shot('07-cau-khi'); }
  if (i === i2 + 5) { if (p[2] < 6.5) fails.push('rơi khỏi cầu khỉ: y=' + p[2].toFixed(2)); await view(null, 0.25, 6); await page.waitForTimeout(400); await shot('08-hang-dom-dom'); } }
if (minY < 4.2) fails.push('rơi xuống thấp bất thường trên lối mòn: y=' + minY.toFixed(2));
await page.waitForTimeout(800);
const st1 = await page.evaluate(() => ({ found: !!__island.destiny.st.S.found, places: __island.destiny.places().length, hide: __island.destiny.mapHide(-180, -280) }));
if (!st1.found) fails.push('đi hết lối mòn mà chưa được ghi nhận khám phá'); else log('✓ khám phá: danh hiệu Người tìm đường');
if (st1.hide || !st1.places) fails.push('sau khi khám phá, bản đồ vẫn giấu khu rừng');
await view(1.45, 0.1, 15); await page.waitForTimeout(900); await shot('09-cay-thien-dinh');

// 3) trong thung lũng: lời ước, bia đá, hít thở, bí mật, cổng đá
const D = await page.evaluate(() => { const d = __island.destiny; return { altar: d.altar, seat: [d.seat.x, d.seat.z], steles: d.steles.map(s => [s.x, s.z]), sec: d.secrets, pin: [d.portal.in.x, d.portal.in.z], pout: [d.portal.out.x, d.portal.out.z] }; });
await walkTo(D.altar[0] + 1.6, D.altar[1], 'bệ đá lời ước', 0.9);
const a2 = await act(); if (!a2 || !/ước/.test(a2)) fails.push('không có nút gửi lời ước: ' + a2);
await page.waitForSelector('#dstWish', { timeout: 3000 }).catch(() => fails.push('bảng lời ước không mở'));
if (await page.$('#dstWish')) { await page.fill('#dstWish textarea', 'Mỗi ngày em đọc 13 trang sách'); await page.keyboard.type(' và học 5 từ mới'); await page.waitForTimeout(300); await shot('10-bang-loi-uoc'); await page.click('#dstWish .go'); await page.waitForTimeout(500);
  const w = await page.evaluate(() => ({ s: __island.destiny.st.S.wish, acc: __island.account && __island.account.profile && __island.account.profile.destiny && __island.account.profile.destiny.wish, frozen: __island.player.frozen, x: __island.player.pos.x }));
  if (!/13 trang sách và học 5 từ mới/.test(w.s)) fails.push('lời ước không được lưu đúng: ' + w.s); if (w.acc !== w.s) fails.push('lời ước chưa lưu vào tài khoản: ' + w.acc); if (w.frozen) fails.push('đóng bảng lời ước xong nhân vật vẫn bị khoá'); else log('✓ lời ước lưu máy + tài khoản:', w.s); }
for (const [i, s] of D.steles.entries()) { await tp(s[0], s[1]); await page.waitForTimeout(450); const a = await act(); if (!a || !/bia/.test(a)) fails.push(`bia đá ${i + 1}: không có nút đọc (${a})`); await page.waitForTimeout(200); }
await view(null, 0.3, 7); await shot('11-bia-danh-ngon');
await tp(D.seat[0] + 1.2, D.seat[1] + 1.2); await page.waitForTimeout(500); const a3 = await act(); if (!a3 || !/thở/.test(a3)) fails.push('không có nút ngồi thở: ' + a3);
await page.waitForTimeout(900); await shot('12-hit-tho-1-phut'); await page.waitForFunction(() => !document.getElementById('dstBreath'), null, { timeout: 30000 }).catch(() => fails.push('bài hít thở không kết thúc'));
const br = await page.evaluate(() => ({ n: __island.destiny.st.S.breath, frozen: __island.player.frozen })); if (br.n !== 1 || br.frozen) fails.push('hít thở xong: breath=' + br.n + ' frozen=' + br.frozen); else log('✓ hít thở 1 phút (65 s, tua nhanh khi kiểm thử)');
const SEC = { lotus: 0, nest: [1.2, 0.6], shroom: 0, spiral: 0, fall: [0, 0.6], tracks: 0, rings: 0, chime: [0.4, 0.8] };
for (const id of Object.keys(D.sec)) { const q = D.sec[id], o = SEC[id] || [0, 0]; await tp(q[0] + o[0], q[2] + o[1]); await page.waitForTimeout(450); const a = await act(); if (!a || !/🔎/.test(a)) fails.push(`bí mật ${id}: không có nút (${a})`); await page.waitForTimeout(150); }
const sc = await page.evaluate(() => __island.destiny.st.count()); if (sc !== 8) fails.push('chỉ tìm được ' + sc + '/8 bí mật'); else log('✓ đủ 8 bí mật');
await tp(D.pin[0] + 1.8, D.pin[1] - 1.2); await page.waitForTimeout(500); await view(null, 0.3, 8); await page.waitForTimeout(400); await shot('13-cong-da');
const a4 = await act(); if (!a4 || !/Cổng đá/.test(a4)) fails.push('không có nút cổng đá: ' + a4); await page.waitForTimeout(1800);
{ const p = await pos(); if (Math.hypot(p[0] - D.pout[0], p[1] - D.pout[1]) > 5) fails.push('cổng đá không đưa về Đền Tri Thức: ' + p.map(v => v.toFixed(1))); else log('✓ cổng đá → Đền Tri Thức'); }
await view(null, 0.3, 9); await page.waitForTimeout(800); await shot('14-cong-da-den-tri-thuc');
await tp(D.pout[0] + 0.4, D.pout[1] - 1.6); await page.waitForTimeout(500); const a5 = await act(); await page.waitForTimeout(1800);
{ const p = await pos(); if (Math.hypot(p[0] - D.pin[0], p[1] - D.pin[1]) > 5) fails.push('cổng đá ở Đền không đưa tới rừng: ' + a5 + ' ' + p.map(v => v.toFixed(1))); else log('✓ cổng đá Đền → Rừng Thiên Định'); }

// 4) bản đồ M sau khi khám phá + cảnh ngày/đêm/sương + draw call
await tp(P.O[0], P.O[1] + 12); await page.evaluate(() => __island.worldMap.toggle()); await page.waitForTimeout(1200); await page.click('#wmap [data-z="me"]').catch(() => {}); for (let k = 0; k < 2; k++) await page.click('#wmap [data-z="0.7"]').catch(() => {}); await page.waitForTimeout(600); await shot('15-ban-do-da-kham-pha'); await page.evaluate(() => __island.worldMap.toggle()); await page.waitForTimeout(300);
const perf = async name => { await draw(true); await page.waitForTimeout(2500); const r = await page.evaluate(() => { const i = __island.renderer.info; i.autoReset = false; i.reset(); __island.post.render(); const o = { calls: i.render.calls, tris: i.render.triangles }; i.autoReset = true; return o; }); log(`draw call @ ${name}:`, r.calls, '· tam giác', r.tris); if (MOBILE && r.calls > 233) fails.push(`${name}: ${r.calls} draw call > 233`); return r; };
await setHour(10.5); await tp(-171, -273); await view(0.62, 0.2, 9); await perf('thung lũng (ngày)'); await shot('16-thung-lung-ngay');
await tp(-175.5, -291); await view(0.22, 0.16, 10); await perf('hồ gương + thác'); await shot('17-ho-guong-thac-3-tang');
await tp(-195, -281); await view(1.57, 0.3, 11); await perf('đền đá'); await shot('18-den-da-reu-phong');
await tp(-180, -266); await view(3.14, 0.5, 9); await perf('vườn đá'); await shot('19-vuon-da-thien');
await setHour(21.5); await page.waitForTimeout(4000); await tp(-171, -273); await view(0.62, 0.2, 9); await perf('thung lũng (đêm)'); await shot('20-thung-lung-dem');
await tp(-106, -236.5); await view(0.45, 0.25, 11); await perf('bãi cụ Rùa (đêm, đom đóm dẫn đường)'); await shot('21-dom-dom-dan-duong-dem');
await setHour(6.3); await page.evaluate(() => __island.weather.set('fog')); await page.waitForTimeout(5000); await tp(-112, -269); await view(0, 0.45, 9); await perf('cao nguyên (sương sớm)'); await shot('22-suong-som');
await page.evaluate(() => __island.weather.set('clear')); await setHour(10.5);
const cine = async (name, cam, look) => { await page.evaluate(([cam, look]) => { const c = __island; c.freeCam = true; c.camera.position.set(...cam); c.camera.lookAt(...look); }, [cam, look]); await page.waitForTimeout(2500); await shot(name); await page.evaluate(() => { __island.freeCam = false; }); };
await page.waitForTimeout(3000); await tp(-150, -287);
await cine('23-toan-canh-khoi-nui', [-88, 46, -208], [-150, 6, -287]);
await cine('24-toan-canh-thung-lung', [-146, 55, -232], [-183, 6, -292]);
await tp(-110, -238); await cine('25-nhin-tu-bai-cu-rua', [-96, 4.2, -231], [-128, 7, -275]);
await setHour(9); await page.waitForTimeout(3000); await tp(-172, -276); await cine('26-tia-nang-xuyen-tan', [-158, 7, -292], [-190, 9, -280]); await cine('27-cay-thien-dinh-ho-guong', [-196, 7.5, -297], [-172, 11, -272]); await setHour(10.5);

log('Lỗi console:', errors.length ? errors.slice(0, 8) : 'không');
if (errors.length) fails.push(errors.length + ' lỗi console');
log(fails.length ? '✗ HỎNG:\n - ' + fails.join('\n - ') : '✓ ĐẠT TẤT CẢ');
await browser.close(); process.exit(fails.length ? 1 : 0);
