// tools/quiz-ui-test.mjs — Khung câu hỏi chung (quiz-ui.js): mở câu hỏi ở nhiều nơi, chụp khung, bấm ✕ rồi thử đi ngay (WASD / joystick);
// vào các mini game, bấm ✕ thoát, đi được; đếm lỗi console.
// Chạy: node server/index.js &  rồi  node tools/quiz-ui-test.mjs <thư-mục-ảnh> [--mode=portrait|landscape|desktop]
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'docs/shots/quiz-ui', MODE = (process.argv.find(a => a.startsWith('--mode=')) || '--mode=portrait').split('=')[1];
fs.mkdirSync(OUT, { recursive: true });
const VP = { portrait: { width: 390, height: 844 }, landscape: { width: 844, height: 390 }, desktop: { width: 1280, height: 720 } }[MODE];
const TOUCH = MODE !== 'desktop';
const errors = []; let cur = 'nạp';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(TOUCH ? { viewport: VP, hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : { viewport: VP });
page.on('console', m => { if (m.type() === 'error') errors.push(`[${cur}] ${m.text().slice(0, 240)}`); });
page.on('pageerror', e => errors.push(`[${cur}] pageerror: ${e.message}`));
await page.addInitScript(() => { try { localStorage.setItem('island.grade', '5'); localStorage.setItem('island.intro', '1'); } catch (e) {} });
console.log('mở trang', MODE); await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.player.hero && __island.warmed, null, { timeout: 300000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { const b = document.querySelector('[data-a="guest"]'); if (b && b.offsetParent) b.click(); });
await page.waitForTimeout(800); console.log('đã nạp');
page.setDefaultTimeout(60000);
const clearUi = async () => { for (let k = 0; k < 40; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click();
  const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); const n = [...document.querySelectorAll('button')].find(b => b.offsetParent && /^(Tiếp|Bắt đầu|Đi thôi|Hiểu rồi|OK|Đóng)/.test(b.textContent.trim()) && getComputedStyle(b).zIndex !== 'auto'); if (n) n.click();
  return !!(g || document.body.classList.contains('st-cut') || __island.player.frozen || __island.freeCam); }); if (!busy) return; await page.waitForTimeout(700); } };
await clearUi();
for (let i = 0; i < 9 && await page.evaluate(() => !!document.getElementById('stSay')); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); }   // bỏ lời dẫn cốt truyện mở màn
const cdp = TOUCH ? await page.context().newCDPSession(page) : null;
const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
const pos = () => page.evaluate(() => [__island.player.pos.x, __island.player.pos.z]);
async function move() {   // đi thử ~0,9 s; trả số mét đã đi
  const a = await pos();
  if (TOUCH) { const x = 90, y = VP.height - (MODE === 'landscape' ? 110 : 194); await T('touchStart', [{ x, y, id: 1 }]); for (let i = 1; i <= 4; i++) await T('touchMove', [{ x, y: y - 15 * i, id: 1 }]); await page.waitForTimeout(2000); await T('touchEnd', []); }
  else { await page.keyboard.down('KeyW'); await page.waitForTimeout(2000); await page.keyboard.up('KeyW'); }
  await page.waitForTimeout(250); const b = await pos(); return +Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2);
}
const qOpen = () => page.waitForFunction(() => { const q = document.getElementById('rwQ'); return q && !q.hidden && q.querySelector('.ch button'); }, null, { timeout: 20000 });
const tapAt = async sel => { const r = await page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, sel); if (TOUCH) await page.touchscreen.tap(r[0], r[1]); else await page.mouse.click(r[0], r[1]); };   // chạm thật vào toạ độ nút
const tapX = () => tapAt('#rwQ .qx');
const geo = () => page.evaluate(() => { const q = document.getElementById('rwQ').getBoundingClientRect(), h = document.querySelector('#rwQ .qq').getBoundingClientRect(), c = document.querySelector('#rwQ .ch').getBoundingClientRect(), b = document.querySelector('#rwQ .ch button').getBoundingClientRect(); return { top: Math.round(q.top), bottom: Math.round(innerHeight - q.bottom), w: Math.round(q.width), gapQ: Math.round(c.top - h.bottom), btnH: Math.round(b.height), xBtn: Math.round(document.querySelector('#rwQ .qx').getBoundingClientRect().width) }; });
const rows = [];
async function place(name, open, after) {
  cur = name; const row = { nơi: name };
  try {
    await open(); await qOpen(); await page.waitForTimeout(400);
    Object.assign(row, await geo());
    await page.screenshot({ path: `${OUT}/${name}-${MODE}.jpg`, quality: 70 });
    await tapX(); await page.waitForTimeout(500);
    if (after) await after(row);
    row.closed = await page.evaluate(() => !!document.getElementById('rwQ').hidden);
    row.frozen = await page.evaluate(() => __island.player.frozen);
    row.mg = await page.evaluate(() => !!__island.mg.active);
    row.đi_m = await move();
    row.OK = row.closed && !row.frozen && !row.mg && row.đi_m > 0.05 ? '✅' : '❌';
  } catch (e) { row.err = e.message.slice(0, 160); row.OK = '❌'; }
  rows.push(row); console.log(JSON.stringify(row));
  await page.evaluate(() => { try { __island.mg.exit(true); } catch (e) {} try { __island.teacherQuiz.close(); } catch (e) {} });
  await page.waitForTimeout(400);
}
const V = () => 'new (__island.player.pos.constructor)(__island.player.pos.x + 1.5, __island.player.pos.y + 2, __island.player.pos.z)';
console.log('trước khi hỏi: đi được m', await move(), 'frozen', await page.evaluate(() => __island.player.frozen));
// 1) cốt truyện / học thích ứng (learn.askSet)
await place('cot-truyen', () => page.evaluate(() => { window.__r = null; __island.learn.askSet({ s: ['toan'], n: 3, title: 'Cáo Ru', ava: '🦊' }).then(r => (window.__r = r)); }),
  async row => { await page.waitForTimeout(100); row.kq = await page.evaluate(() => JSON.stringify(window.__r)); });
// 2) tiết học thầy cô (teacher-quiz lesson)
await place('tiet-hoc', async () => { await page.evaluate(`__island.teacherQuiz.lesson({ subj: 'toan', n: 3, at: ${V()}, title: 'Toán', teacher: 'Cô Lan' })`); await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('#tQuiz .bye').click()); });
// 3) chủ trò mini game: câu hỏi khởi động (teacher-quiz intro)
await place('khoi-dong-mg', async () => { const k = await page.evaluate(async () => Object.keys((await import('/js/island/data/talk.js')).GAME_INTRO)[0]); await page.evaluate(`__island.teacherQuiz.intro(${JSON.stringify(k)}, ${V()}, () => {})`); await page.waitForTimeout(400);
  for (let i = 0; i < 6 && await page.evaluate(() => document.getElementById('rwQ').hidden); i++) { await page.evaluate(() => document.querySelector('#tQuiz .go').click()); await page.waitForTimeout(500); } });
// 4) phép thuật Học viện (magic.ask)
await place('phep-hoc-vien', () => page.evaluate(() => __island.magic.ask(['toan'], () => {}, '📚 Trả lời đúng để nạp năng lượng phép')));
// 5) Hải đăng ông Bảy
await place('hai-dang', async () => { await page.evaluate(() => __island.lighthouse.keeper.run('nav')); await page.waitForTimeout(300); await page.evaluate(() => document.querySelector('#lhP button.k.p').click()); });
// 6) mini game ném bóng (askBar) — ✕ trên khung thoát game
const mgStart = k => page.evaluate(k => { const c = __island; return c.mg.start(k, c.mg.doorOf(k)); }, k).then(async ok => { if (!ok) throw new Error('không mở được ' + k); await page.waitForTimeout(600); await page.evaluate(() => __island.mg.skipFly && __island.mg.skipFly()); });
const mgKeys = await page.evaluate(() => Object.keys(__island.miniGames));
for (const k of ['garden'].filter(k => mgKeys.includes(k))) await place('mg-' + k, () => mgStart(k));
// 7) cờ vua: 💡 Gợi ý → câu hỏi nhanh (quick-quiz); ✕ chỉ đóng câu hỏi, rồi ✕ Thoát của HUD
if (mgKeys.includes('caro')) await place('mg-caro-goi-y', async () => { await mgStart('caro'); await page.waitForTimeout(1500); await page.evaluate(() => [...document.querySelectorAll('#mgHud .mg-bar button')].find(b => /Gợi ý/.test(b.textContent)).click()); },
  async row => { row.vẫn_trong_game = await page.evaluate(() => !!__island.mg.active); await tapAt('#mgHud .mg-x'); await page.waitForTimeout(600); });
// 8) ✕ Thoát trên HUD của nhiều mini game
const exits = [];
for (const k of mgKeys.filter(k => __filter(k)).slice(0, 6)) {
  cur = 'thoát ' + k; const r = { game: k };
  try { await mgStart(k); await page.waitForTimeout(1800); await tapAt('#mgHud .mg-x'); await page.waitForTimeout(600);
    r.mg = await page.evaluate(() => !!__island.mg.active); r.frozen = await page.evaluate(() => __island.player.frozen); r.q = await page.evaluate(() => !document.getElementById('rwQ').hidden); r.đi_m = await move(); r.OK = !r.mg && !r.frozen && !r.q && r.đi_m > 0.05 ? '✅' : '❌'; }
  catch (e) { r.err = e.message.slice(0, 400); r.OK = '❌'; }
  exits.push(r); console.log(JSON.stringify(r)); await page.evaluate(() => { try { __island.mg.exit(true); } catch (e) {} });
}
function __filter(k) { return ['rubik', 'caro', 'garden', 'library', 'fishing', 'quiz'].includes(k); }
// Esc trên máy tính
if (!TOUCH) { cur = 'esc'; await page.evaluate(() => __island.learn.askSet({ s: ['toan'], n: 1 })); await qOpen(); await page.keyboard.press('Escape'); await page.waitForTimeout(300); rows.push({ nơi: 'esc-learn', closed: await page.evaluate(() => !!document.getElementById('rwQ').hidden), frozen: await page.evaluate(() => __island.player.frozen), đi_m: await move() }); }
console.table(rows); console.table(exits);
console.log('Lỗi console:', errors.length ? errors : 'không có');
await browser.close();
