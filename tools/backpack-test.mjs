// tools/backpack-test.mjs — Kiểm thử 🎒 cặp sách · 🛒 cửa hàng · 🪙/💎 ví · ✨ nhặt đồ (economy/) bằng Playwright.
// Chạy: PORT=3100 node server/index.js &  rồi  node tools/backpack-test.mjs [--mobile] [--url=http://localhost:3100/] [--shots=docs/shots/backpack]
// Luồng: tạo tài khoản (ví trên máy chủ) → nhặt đồ → bán 1 món → mua khinh khí cầu bằng 🪙 → gọi ra & bay → mua + mặc kính/áo/ba lô
// (phòng thay đồ) → cổng phụ huynh → nạp 💎 qua cổng thanh toán GIẢ LẬP (IPN có chữ ký) → đổi Ván Bạc Bay → lướt ván. Không lỗi console.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const MOBILE = process.argv.includes('--mobile'), URL = arg('url') || 'http://localhost:3100/', DIR = arg('shots') || 'docs/shots/backpack', TAG = MOBILE ? 'm' : 'd';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctxB = await browser.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const page = await ctxB.newPage(), errors = [], fails = [];
const watch = p => { p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND|404/.test(m.text())) errors.push(m.text()); }); p.on('pageerror', e => errors.push('pageerror: ' + e.message)); };
watch(page);
const ok = (c, msg) => { console.log((c ? '✅ ' : '❌ ') + msg); if (!c) fails.push(msg); };
const shot = async n => { await page.waitForTimeout(700); await page.screenshot({ path: `${DIR}/${TAG}-${n}.png` }); };
const ev = (f, a) => page.evaluate(f, a);
// tài khoản mới tạo qua API, nạp token trước khi mở game (game tự vào như "Lưu đăng nhập")
const name = 'bp' + Date.now().toString(36).slice(-6);
const R = await (await fetch(URL + 'api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, pass: 'matkhau123' }) })).json();
ok(!!R.token, 'tạo tài khoản trên máy chủ (' + (R.error || name) + ')');
await page.addInitScript(([t, n]) => { if (!sessionStorage.getItem('bpInit')) { sessionStorage.setItem('bpInit', '1'); localStorage.setItem('island.token', t); localStorage.setItem('island.tokenName', n); } }, [R.token, name]);
await page.goto(URL + '?test');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.warmed, null, { timeout: 300000 });
await page.addStyleTag({ content: '#tut,#stSay{display:none!important}' });
for (let i = 0; i < 6; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }   // tắt đoạn dẫn chuyện mở đầu
await page.waitForTimeout(4000);
await ev(() => { const c = __island; document.getElementById('accBox').hidden = true; c.player.frozen = false; });
await page.waitForTimeout(1500);
const w0 = await ev(() => ({ gold: __island.eco.gold(), gems: __island.eco.gems(), online: __island.eco.online, own: __island.account.profile.own }));
ok(w0.online && w0.own.includes('bike-0'), `ví máy chủ: 🪙 ${w0.gold} · 💎 ${w0.gems}, tặng sẵn xe đạp cơ bản`);
await shot('01-hud-vi');

// ---------- nhặt đồ ----------
await ev(() => { const c = __island, s = c.pickups.debugDrop('conch'); c.player.teleport(s.it.x - 2.6, s.it.z); });
await page.waitForTimeout(600); await shot('02-vat-lap-lanh');
await ev(() => { const c = __island, s = c.pickups.debugDrop('conch'); c.player.teleport(s.it.x, s.it.z); });
await page.waitForTimeout(1200);
await ev(() => { const c = __island, s = c.pickups.debugDrop('pearl'); c.player.teleport(s.it.x, s.it.z); });
await page.waitForTimeout(1200);
const bag1 = await ev(() => ({ ...__island.account.profile.bag }));
ok(bag1.conch === 1 && bag1.pearl === 1, 'đi qua để nhặt: ' + JSON.stringify(bag1));
await shot('03-nhat-do');

// ---------- cặp sách: ngăn vật phẩm, bán 1 món ----------
await page.keyboard.press('KeyB'); await page.waitForTimeout(500);
ok(await ev(() => !!document.getElementById('ecoBag')), 'phím B mở cặp sách');
await page.click('#ecoBag .tb button[data-t=loot]'); await page.click('#ecoBag .cd[data-id=conch]'); await shot('04-cap-vat-pham');
const g1 = await ev(() => __island.eco.gold());
await page.click('#ecoBag .dt button[data-a=sell1]'); await page.waitForTimeout(400);
ok(await ev(g => __island.eco.gold() === g + 5 && !__island.account.profile.bag.conch, g1), 'bán ốc xà cừ +5 🪙');
// kiếm thêm đồng vàng như khi chơi (học đúng, nhiệm vụ…) rồi chờ báo máy chủ
await ev(() => __island.account.addCoins(300));
for (let i = 0; i < 21; i++) { if (await ev(async () => { const w = (await __island.account.api('/wallet')).wallet; return w && w.gold === __island.eco.gold(); })) break; await page.waitForTimeout(1000); }
const srv = await ev(async () => (await __island.account.api('/wallet')).wallet);
ok(srv && srv.gold === await ev(() => __island.eco.gold()), `máy chủ xác nhận số dư: ${srv && srv.gold} 🪙`);

// ---------- cửa hàng: mua khinh khí cầu bằng 🪙, gọi ra từ cặp ----------
await page.click('#ecoBag .hd button[data-a=shop]'); await page.waitForTimeout(400);
await page.click('#ecoShop .tb button[data-t=ride]'); await page.click('#ecoShop .cd[data-id=ride-balloon]'); await shot('05-cua-hang-phuong-tien');
await page.click('#ecoShop .dt button[data-a=buy]'); await page.waitForTimeout(1200);
ok(await ev(() => __island.eco.owns('ride-balloon')), 'mua 🎈 khinh khí cầu bằng đồng vàng');
await shot('06-mua-xong');
await ev(() => { const c = __island, P = c.player, p0 = P.pos.clone();   // ra chỗ trống (khinh khí cầu không thả sát mái nhà)
  for (let r = 8; r < 89; r += 5) for (let k = 0; k < 13; k++) { const a = k * 2.39996, x = p0.x + Math.cos(a) * r, z = p0.z + Math.sin(a) * r, h = c.terrain.heightAt(x, z);
    if (h > 0.6 && !(c.boxes || []).some(b => x > b.x0 - 5 && x < b.x1 + 5 && z > b.z0 - 5 && z < b.z1 + 5)) { P.teleport(x, z); return; } } });
await page.waitForTimeout(800);
await page.click('#ecoShop .hd button[data-a=bag]'); await page.waitForTimeout(400);
await page.click('#ecoBag .cd[data-id=ride-balloon]'); await page.click('#ecoBag .dt button[data-a=ride]'); await page.waitForTimeout(1500);
ok(await ev(() => __island.vehicles.riding === 'balloon'), 'gọi khinh khí cầu vừa mở khoá');
await ev(() => { __island.vehicles.held.up = true; }); await page.waitForTimeout(2500); await ev(() => { __island.vehicles.held.up = false; });
await shot('07-bay-khinh-khi-cau');
await ev(() => { __island.vehicles.held.down = true; });   // hạ khinh khí cầu tới khi chạm đất rồi bước xuống
for (let i = 0; i < 30 && await ev(() => { const c = __island; if (c.player.grounded) { c.vehicles.held.down = false; c.vehicles.dismount(); } return !!c.vehicles.riding; }); i++) await page.waitForTimeout(1000);
await ev(() => { __island.vehicles.held.down = false; });
ok(await ev(() => !__island.vehicles.riding), 'hạ khinh khí cầu, bước xuống');
// chưa mở khoá → bị chặn
await ev(() => __island.vehicles.toggleBike(6)); await page.waitForTimeout(600);
ok(await ev(() => __island.vehicles.riding !== 'bike' && !!document.getElementById('ecoShop')), 'xe đua chưa mở khoá → mời ra cửa hàng');

// ---------- đồ mặc: mua + mặc (phòng thay đồ) ----------
for (const id of ['glass-round', 'cape-do', 'bag-cam', 'shoe-do']) { await ev(id => __island.eco.buy(id), id); }
await ev(() => __island.shop.close()); await page.keyboard.press('KeyI'); await page.waitForTimeout(400);
await page.click('#ecoBag .tb button[data-t=wear]');
for (const id of ['glass-round', 'cape-do', 'bag-cam', 'shoe-do']) { if (await page.$(`#ecoBag .cd.on[data-id=${id}]`)) continue; await page.click(`#ecoBag .cd[data-id=${id}]`); await page.click('#ecoBag .dt button[data-a=wear]'); await page.waitForTimeout(300); }   // áo choàng mua xong tự mặc luôn
await page.waitForTimeout(6000);   // nhân vật VRM dựng lại với kính
const wearOk = await ev(() => { const c = __island, L = c.account.avatar || {}; return { glasses: L.glasses, cape: c.wear.eq.cape, wx: c.account.profile.wx }; });
ok(wearOk.glasses === 'round' && wearOk.cape === 'cape-do' && wearOk.wx.pack === 'bag-cam' && wearOk.wx.shoes === 'shoe-do', 'mặc kính/áo choàng/ba lô/giày: ' + JSON.stringify(wearOk));
await page.click('#ecoBag .cd[data-id=cape-do]'); await shot('08-phong-thay-do');

// ---------- 💎 cổng phụ huynh → thanh toán giả lập ----------
await page.click('#ecoBag .hd button[data-a=shop]'); await page.waitForTimeout(300);
await page.click('#ecoShop .tb button[data-t=gem]'); await shot('09-kim-cuong');
await page.click('#ecoShop button[data-a=gate]'); await page.waitForTimeout(300); await shot('10-cong-phu-huynh');
const q = await ev(() => document.querySelector('#ecoShop .gate p b').textContent);
const [a, b] = q.match(/\d+/g).map(Number);
await page.fill('#ecoGate', String(a * b)); await page.click('#ecoShop button[data-a=gateok]'); await page.waitForTimeout(400);
await page.click('#ecoShop .pk[data-pack=gem-55]'); await page.click('#ecoShop .gw button[data-gw=momo]');
await shot('11-goi-kim-cuong');
const [pop] = await Promise.all([page.waitForEvent('popup', { timeout: 15000 }), page.click('#ecoShop .dt button[data-a=pay]')]);
watch(pop); await pop.waitForLoadState(); await pop.screenshot({ path: `${DIR}/${TAG}-12-cong-thanh-toan-gia-lap.png` });
await pop.click('button[value=ok]'); await pop.waitForLoadState(); await pop.waitForTimeout(500);
await pop.screenshot({ path: `${DIR}/${TAG}-13-da-thanh-toan.png` }); await pop.close();
await page.waitForFunction(() => __island.eco.gems() >= 55, null, { timeout: 20000 }).catch(() => {});
ok(await ev(() => __island.eco.gems() === 55), 'phụ huynh nạp 55 💎 (IPN giả lập có chữ ký) → vào ví');
await shot('14-nhan-kim-cuong');

// ---------- đổi đồ đặc biệt bằng 💎; mua ván bạc bay bằng 🪙 rồi gọi ra từ cặp ----------
await page.click('#ecoShop .tb button[data-t=wear]');
for (const id of ['cape-hong', 'bag-pha-le']) { await page.click(`#ecoShop .cd[data-id=${id}]`); await page.click('#ecoShop .dt button[data-a=buy]'); await page.waitForTimeout(900); }
ok(await ev(() => __island.eco.owns('cape-hong') && __island.eco.owns('bag-pha-le') && __island.eco.gems() === 0), 'đổi áo choàng Hồng Pha Lê + ba lô Pha Lê bằng 55 💎');
await shot('15-do-dac-biet');
await ev(() => __island.account.addCoins(144)); await page.waitForTimeout(500);
await page.click('#ecoShop .tb button[data-t=ride]'); await page.click('#ecoShop .cd[data-id=board-bac]'); await page.click('#ecoShop .dt button[data-a=buy]'); await page.waitForTimeout(1200);
ok(await ev(() => __island.eco.owns('board-bac')), 'mua 🏄 ván bạc bay bằng 233 đồng vàng');
await ev(() => { const c = __island; c.shop.close(); c.player.teleport(c.player.pos.x + 21, c.player.pos.z - 13); }); await page.waitForTimeout(1200);   // ra xa khinh khí cầu đang đỗ
await page.keyboard.press('KeyB'); await page.waitForTimeout(400); await page.click('#ecoBag .tb button[data-t=ride]');
await page.click('#ecoBag .cd[data-id=board-bac]'); await page.click('#ecoBag .dt button[data-a=ride]'); await page.waitForTimeout(2500);
ok(await ev(() => !!(__island.silverBoard && __island.silverBoard.riding)), 'gọi ván bạc bay vừa mở khoá từ cặp');
await shot('16-van-bac-bay');
// chống gian lận: sửa số dư trên máy rồi lưu → máy chủ ghi đè
const cheat = await ev(async () => { const c = __island; c.account.profile.money = 99999; c.account.profile.gems = 999; c.account.save(); await c.account.api('/progress', { profile: c.account.profile, ls: {}, at: Date.now() }, 'PUT'); const me = await c.account.api('/me'); return me.user.progress.profile; });
ok(cheat.money < 99999 && cheat.gems === 0, `sửa số dư trên máy bị máy chủ ghi đè (🪙 ${cheat.money}, 💎 ${cheat.gems})`);
ok(errors.length === 0, 'không lỗi console' + (errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''));
await browser.close();
console.log(fails.length ? `\n❌ ${fails.length} lỗi` : '\n✅ Tất cả đạt');
process.exit(fails.length ? 1 : 0);
