// v62f: chụp ảnh SAU khi sửa (390×844 cảm ứng) rồi ghép school/REVIEW_v62_fix.png cùng ảnh TRƯỚC của chủ game (tools/bugs/v62/user_*.png)
// Chạy từ school/: node tools/qa/v62f-review.js   (cần server: python3 -m http.server 8754)
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const {openGame, login, owner} = require('./qa-lib');
const OUT = path.join(__dirname, 'out', 'v62f'), BUG = path.join(__dirname, '..', 'bugs', 'v62');
const run = (p, c) => p.evaluate(c => window.__dbg(c), c);
(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const b = await chromium.launch(); const M = {};
  const fresh = async (u) => { const g = await openGame({w:390, h:844, touch:true}, {browser:b}); await login(g.p, u); await owner(g.p); await run(g.p, "try{ PROF.money = 250; renderProfHud(); document.querySelectorAll('.v59gCard,.toast').forEach(e=>e.hidden=true) }catch(e){}"); return g; };
  // 1: đạp xe vào lớp → tự xuống; nhãn cổng phép mờ dưới cột nút
  let g = await fresh('v62r1'); let p = g.p;
  await run(p, "PLAYER.x=1850;PLAYER.y=345;PLAYER._z='elec';PROF.equip.bike='bike1';PROF.inv.bike1=1;PLAYER.cycling=false;toggleBike();followCam=true;");
  await p.waitForTimeout(3500); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(900); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(2600);
  M.s1 = await run(p, "[PLAYER.cycling, !!v62fRoomAt(PLAYER.x,PLAYER.y)]"); await p.screenshot({path:path.join(OUT, 'a1.png')});
  await run(p, "PLAYER.x=1790;PLAYER.y=232;PLAYER._z='elec';followCam=true;"); await p.waitForTimeout(3500); await p.screenshot({path:path.join(OUT, 'a1b.png')});
  M.log1 = g.logs; await g.ctx.close();
  // 2: mép khu điểm danh: đi qua được, nhân vật không bị cắt, hết vệt nâu
  g = await fresh('v62r2'); p = g.p;
  await run(p, "PLAYER.x=1150;PLAYER.y=560;PLAYER._z='attend';followCam=true;"); await p.waitForTimeout(3000);
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(250); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(1500); await run(p, "PLAYER.x=1188;PLAYER.y=560;PLAYER._z='attend';PLAYER._gx=PLAYER._gy=0;PLAYER.moving=false;"); await p.waitForTimeout(1500);
  M.s2a = await run(p, "[Math.round(PLAYER.x), PLAYER._z]"); await p.screenshot({path:path.join(OUT, 'a2.png')});
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1500); await p.keyboard.up('ArrowRight'); M.s2b = await run(p, "[Math.round(PLAYER.x), PLAYER._z]");
  M.log2 = g.logs; await g.ctx.close();
  // 3: cưỡi ngựa đứng yên 9 giây: HUD vẫn rõ
  g = await fresh('v62r3'); p = g.p;
  await run(p, "PLAYER.x=V46E+V46L.CX+700;PLAYER.y=V46L.CY-900;PLAYER._z=null;v45Summon('horse');followCam=true;"); await p.waitForTimeout(9500);
  M.s3 = await run(p, "stage.className"); await p.screenshot({path:path.join(OUT, 'a3.png')}); M.log3 = g.logs; await g.ctx.close();
  // 4: khu căn tin / điểm danh + tiền giảm có thông báo
  g = await fresh('v62r4'); p = g.p;
  await run(p, "const o=v46ToOld(12355,11700);PLAYER.x=o[0];PLAYER.y=o[1];PLAYER._z='hall';followCam=true;"); await p.waitForTimeout(4000);
  await run(p, "v51aBankMove(PROF.money)"); await p.waitForTimeout(900); await p.screenshot({path:path.join(OUT, 'a4.png')});
  M.log4 = g.logs; await g.ctx.close();
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(M, null, 1)); console.log(JSON.stringify(M));
  // ---------- ghép ảnh ----------
  const img = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  let num = 0; const notes = [];
  const pic = (f, w, s, label, rings) => { const rs = (rings || []).map(q => { num++; notes.push([num, q.t]); const [x, y, ww, hh] = q.r, pad = 8;
      return `<div class="ring" style="left:${(x - pad)*s}px;top:${(y - pad)*s}px;width:${(ww + 2*pad)*s}px;height:${(hh + 2*pad)*s}px"><b>${num}</b></div>`; }).join('');
    return `<figure style="width:${w*s}px"><div class="im"><img src="${img(f)}" style="width:${w*s}px">${rs}</div><figcaption>${label}</figcaption></figure>`; };
  const U = n => path.join(BUG, `user_${n}.png`), A = n => path.join(OUT, n + '.png'), k = 390/924;   // ảnh chủ game: toạ độ theo khung 924×2000 → 390
  const R = (x0, y0, x1, y1) => [x0*k, y0*k, (x1 - x0)*k, (y1 - y0)*k], S = .9;
  const T = '<span class="tag bf">TRƯỚC</span>', F = '<span class="tag af">SAU</span>';
  const row = (h, cells, why) => `<section><h2>${h}</h2><div class="pair">${cells}<div class="why">${why}</div></div></section>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f6f4ee;font:700 18px/1.45 'DejaVu Sans',sans-serif;color:#1d2433;width:2040px}
h1{margin:0;padding:24px 32px 4px;font-size:36px}.sub{padding:0 32px 10px;color:#5a6378;font-size:19px}
section{display:block;width:1976px;margin:10px 0 10px 32px}h2{margin:10px 0 8px;font-size:24px}
.pair{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}figure{margin:0}.im{position:relative;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.18)}.im img{display:block}
figcaption{padding:6px 2px 0;font-size:16px}.why{width:560px;font-size:18px;background:#fff;border-radius:10px;padding:8px 12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.ring{position:absolute;border:4px solid #e53935;border-radius:50%;box-shadow:0 0 0 2px #fff}.ring b{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:#e53935;color:#fff;display:grid;place-items:center;font-size:16px;border:2px solid #fff}
.tag{display:inline-block;border-radius:6px;padding:0 6px;color:#fff;margin-right:6px}.bf{background:#d64545}.af{background:#1f9d55}
ol{list-style:none;margin:0;padding:6px 32px 28px;font-size:17px;columns:2;column-gap:36px}li{margin:3px 0;break-inside:avoid}li b{color:#e53935}</style></head><body>
<h1>🛠️ v62 · sửa 4 lỗi chủ game báo (iPhone 390×844)</h1><div class="sub">Trái: ảnh chủ game gửi (TRƯỚC) · Phải: cùng tình huống sau khi sửa (SAU). Vòng đỏ đánh số, giải thích ở cuối.</div>
${row('1 · Đạp xe trong lớp · nhãn dưới cột nút · vệt đen dưới NPC',
  pic(U(1), 390, S, T + 'Đạp xe giữa các bàn', [{r:R(415, 880, 525, 1000), t:'TRƯỚC: xe đạp đi xuyên cửa vào trong lớp — chỉ có kiểm tra phố đi bộ, không có kiểm tra phòng có tường.'}, {r:R(0, 830, 165, 900), t:'TRƯỚC: nhãn "Học viện Phép thuật" (cổng phép) vẽ trong thế giới, nằm dưới nút ở cột trái → chữ "p thuật" chồng lên nút.'}, {r:R(660, 1310, 910, 1350), t:'TRƯỚC: vệt đen = mép trên bảng tỉ số "ĐỎ 0 – 0 XANH" của Sân bóng bị khu Lớp lắp ráp điện cắt ngang (map.js:434, khu v46 không khoét lỗ đủ rộng).'}])
  + pic(A('a1'), 390, S, F + 'Bước qua cửa → tự xuống xe, đi bộ', [{r:[150, 360, 100, 100], t:'SAU: bước qua cửa lớp là tự xuống xe/thú + lời nhắc; trong lớp bấm "Bike"/gọi thú bị từ chối (v62f-fix.js).'}, {r:[200, 530, 140, 80], t:'SAU: hết vệt đen dưới NPC (khu bên cạnh được khoét rộng thêm 30px).'}])
  + pic(A('a1b'), 390, S, F + 'Nhãn dưới cột nút: mờ đi', [{r:[0, 330, 70, 60], t:'SAU: nhãn thế giới nào chạm vào cột nút / HUD thì mờ còn 22% (v62fLblA), không tranh chỗ với nút.'}]),
  'Gốc: <b>js/ext/v46/player.js</b> canMove không biết phòng có tường khi đang đạp xe / cưỡi thú. Sửa: <b>v62f-fix.js</b> bọc canMove, toggleBike, mount. Nút "Sau lưng" 🎥 (v60t) đã gỡ khỏi FILES nên không còn trong cột nút.')}
${row('2 · Nhân vật bị cắt thành dải dọc · đường nâu dài',
  pic(U(2), 390, S, T + 'Kẹt ở mép khu, chỉ thấy một dải', [{r:R(400, 840, 540, 1040), t:'TRƯỚC: nhân vật đứng ở mép phải khu Điểm danh: phần ngoài mép bị cắt (clip của khu) → chỉ còn dải dọc, số áo "1".'}, {r:R(430, 300, 480, 790), t:'TRƯỚC: đường nâu dài = 5px tường Hội trường lớn (x=1185–1190) lọt vào mép khu Điểm danh. Hội trường đã dời đi chỗ khác trên đảo nhưng v46OldMove vẫn coi nó là tường → kẹt vô hình ở x=1190.'}])
  + pic(A('a2'), 390, S, F + 'Đi qua mép khu bình thường', [{r:[180, 360, 90, 100], t:'SAU: nhân vật ở đúng mép (x=1190) vẽ đủ, đi tiếp sang đường của đảo; hết đường nâu.'}]),
  'Gốc: <b>v46/player.js v46OldMove</b> kiểm tra tường của mọi phòng, kể cả phòng thuộc khu khác. Sửa: bỏ qua phòng của khu khác; <b>v62fHoles</b> khoét rộng lỗ khu bên cạnh; <b>v62fEdge</b> vẽ lại nhân vật không bị cắt khi đứng sát mép.')}
${row('3 · Cưỡi thú: cả HUD mờ như có hộp thoại vô hình',
  pic(U(3), 390, S, T + 'HUD mờ 25%', [{r:R(20, 110, 680, 320), t:'TRƯỚC: đứng yên 6 giây là HUD + cột nút + bản đồ mờ còn 25% (v32-phone-ui.js:300, style.css #stage.v32idle) → trông như lớp phủ/hộp thoại kẹt.'}])
  + pic(A('a3'), 390, S, F + 'Cưỡi ngựa, đứng yên 9 giây', [{r:[0, 0, 390, 90], t:'SAU: khi nghỉ HUD chỉ mờ nhẹ (78%) và không mờ khi đang đạp xe / cưỡi thú / di chuyển.'}]),
  'Không có hộp thoại nào mở (đã kiểm tra openModal, #v45pQ). Nguyên nhân là chế độ "nghỉ tay" làm mờ HUD quá mạnh.')}
${row('4 · Tiền về $0 · đường nâu · chữ mờ · ô xám · tên chồng nhau',
  pic(U(4), 390, S, T + '$250 → $0, nhiều lỗi vẽ', [{r:R(330, 120, 385, 172), t:'TRƯỚC: tiền giảm không có thông báo (đũa phép, heo đất "gửi hết", ngõ phố, phim… trừ thẳng). $0 tròn khớp nút "Gửi hết" của Heo đất.'}, {r:R(685, 920, 712, 1650), t:'TRƯỚC: đường nâu = tường Hội trường lọt mép khu Điểm danh (như lỗi 2).'}, {r:R(145, 675, 535, 730), t:'TRƯỚC: chữ sàn "Lớp học lớn nhất trường" (map.js:404) nằm sát hàng rào, bị cây che — trên đảo chỗ đó giờ là căn tin.'}, {r:R(0, 1140, 665, 1225), t:'TRƯỚC: dải gạch xám của sân trường cũ giữ lại ở lề khu Điểm danh (khu không có tường).'}, {r:R(0, 1540, 520, 1580), t:'TRƯỚC: tên học sinh dài hơn khoảng cách ô (52px) → chồng nhau.'}])
  + pic(A('a4'), 390, S, F + 'Gửi heo đất: báo rõ −$ và lý do', [{r:[120, 20, 210, 45], t:'SAU: mỗi lần tiền giảm hiện "−$X · lý do" cạnh số tiền + ghi vào Hộp thư; gửi Heo đất có lời nhắc "tiền vẫn là của em".'}, {r:[0, 580, 290, 100], t:'SAU: tên tự thu nhỏ vừa ô; hết dải gạch xám; hết đường nâu; bỏ chữ sàn bị che.'}]),
  'Không có chỗ nào trừ tiền sai: mọi chỗ trừ đều do bấm mua/gửi. Thêm thông báo cho mọi lần trừ (v62fMoneyTick).')}
<ol>${notes.map(([n, t]) => `<li><b>${n}.</b> ${t}</li>`).join('')}</ol></body></html>`;
  const pg = await b.newPage({viewport:{width:2040, height:1000}}); await pg.setContent(html); await pg.waitForTimeout(800);
  await pg.screenshot({path:path.join(__dirname, '..', '..', 'REVIEW_v62_fix.png'), fullPage:true}); await b.close();
})();
