// v64s: ghép school/REVIEW_v64_school.png từ ảnh chụp (TRƯỚC = ?nov64s, SAU = có khu trường mới). Khoanh đỏ đánh số + ghi chú tiếng Việt.
// Dùng: node tools/qa/v64s-review.js <thư mục ảnh: chứa A/ B/ N/ M/>
const fs = require('fs'), path = require('path'), {chromium} = require('playwright');
const D = process.argv[2], OUT = path.resolve(__dirname, '..', '..', 'REVIEW_v64_school.png');
const img = n => 'data:image/png;base64,' + fs.readFileSync(path.join(D, n + '.png')).toString('base64');
let num = 0; const notes = [];
function pic(name, w, h, s, label, rings){
  const rs = (rings || []).map(([x, y, ww, hh, t]) => { num++; notes.push([num, t]); return `<div class="ring" style="left:${x*s}px;top:${y*s}px;width:${ww*s}px;height:${hh*s}px"><b>${num}</b></div>`; }).join('');
  return `<figure style="width:${w*s}px"><div class="im"><img src="${img(name)}" style="width:${w*s}px;height:${h*s}px">${rs}</div><figcaption>${label}</figcaption></figure>`;
}
const W = 1440, H = 900, pair = (n, label, rings, s) => pic('B/' + n, W, H, s || .43, 'TRƯỚC · ' + label) + pic('A/' + n, W, H, s || .43, 'SAU · ' + label, rings);
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>body{margin:0;background:#f6f4ee;font:700 18px/1.45 Nunito,sans-serif;color:#1d2433;width:1960px}
h1{margin:0;padding:24px 34px 2px;font-size:38px;font-weight:900}.sub{padding:0 34px 10px;color:#5a6378;font-size:19px}
.row{display:flex;gap:22px;padding:8px 34px;align-items:flex-start;flex-wrap:wrap}h2{margin:14px 34px 2px;font-size:25px;font-weight:900}
figure{margin:0}.im{position:relative;border-radius:12px;overflow:hidden;box-shadow:0 5px 18px rgba(0,0,0,.18)}.im img{display:block}
figcaption{padding:6px 4px 0;font-size:18px;font-weight:800}
.ring{position:absolute;border:5px solid #e53935;border-radius:50%;box-shadow:0 0 0 2px #fff}.ring b{position:absolute;left:-15px;top:-15px;width:32px;height:32px;border-radius:50%;background:#e53935;color:#fff;display:grid;place-items:center;font:900 18px Nunito}
ul{columns:2;column-gap:40px;margin:6px 34px 30px;padding-left:4px;font-size:19px;list-style:none}li{margin:3px 0;break-inside:avoid}</style></head><body>
<h1>v64 · Khu trường kiểu Ninja Adventure (khu thử nghiệm)</h1>
<div class="sub">Tile & nhân vật Ninja Adventure (CC0) + cây thông Tiny Swords (CC0). Khuôn viên rào tròn R = 1700 px (≈ 9,1 triệu px², gấp ~5,7 lần diện tích các khu trường cũ). Ngoài hàng rào giữ nguyên đồ hoạ cũ.</div>
<h2>Toàn cảnh</h2><div class="row">
${pic('B/w', W, H, .64, 'TRƯỚC · khu trường cũ (lâu đài vẽ bằng code, bãi cỏ trống)')}
${pic('A/w', W, H, .64, 'SAU · khuôn viên mới đầy đủ', [[362, 105, 120, 95, 'Thư viện mới (mái ngói đỏ, 2 tầng cửa sổ) — chạm để mở Thư viện'], [338, 312, 175, 82, 'Phòng giáo viên + Phòng y tế'], [608, 322, 282, 162, 'Sân trường lát gạch quanh khu điểm danh + cột cờ'], [625, 408, 190, 192, 'Quảng trường + cổng trường "TRƯỜNG RUBIK HÀ QUÂN" (vòng đá theo tỷ lệ φ)'], [888, 318, 118, 192, 'Căn tin + sân bóng rổ'], [1068, 278, 124, 92, 'Khu vui chơi: cầu trượt, xích đu, bập bênh'], [918, 612, 208, 92, 'Ao cá (chạm để câu cá) + vườn rau'], [348, 503, 234, 142, 'Vườn trường (lối chia theo φ, đài phun nước) + nhà xe đạp + bãi đỗ xe'], [1113, 722, 174, 114, 'Sân bóng đá vẽ lại kiểu NA'], [208, 6, 1022, 888, 'Hàng rào gỗ tròn bên trong vòng đường, hở ở mọi lối vào; hàng cây + đèn đường dọc lối đá']])}
</div>
<h2>Cận cảnh TRƯỚC / SAU</h2>
<div class="row">${pair('gate', 'cổng trường', [[530, 250, 380, 230, 'Cổng mới: 2 cột đá + mái ngói NA + bảng tên, đèn lồng sáng về đêm']])}</div>
<div class="row">${pair('court', 'sân trường lát gạch', [[258, 208, 874, 474, 'Sân lát gạch cam NA, bồn hoa, ghế đá; khu điểm danh, cờ, lớp vẫn giữ chức năng cũ']])}</div>
<div class="row">${pair('rubik', 'lớp Rubik + hội trường', [[518, 118, 384, 364, 'Lớp: sàn gỗ NA, tường gạch viền đen, mái ngói phía sau, cột đèn đá ở góc (cửa, chỗ ngồi, va chạm giữ nguyên)']])}</div>
<div class="row">${pair('lib', 'thư viện', [[528, 268, 384, 244, 'Thư viện mới (toà nhà ghép 9 mảnh từ tile nhà NA)']])}</div>
<div class="row">${pair('can', 'căn tin + bóng rổ', [[548, 298, 354, 464, 'Căn tin mái hiên sọc + sân bóng rổ có rổ & vạch']])}</div>
<div class="row">${pair('field', 'sân bóng đá', [[580, 390, 460, 270, 'Sân bóng cỏ sọc, vạch trắng, khung thành; cạnh đó ao cá + vườn rau']])}</div>
<div class="row">${pair('gard', 'vườn trường', [[428, 318, 424, 284, 'Vườn trường: 4 ô hoa, lối sỏi, đài phun nước; bãi đỗ xe + nhà xe đạp']])}</div>
<h2>Ngày / đêm · mùa · nhân vật · điện thoại</h2>
<div class="row">${pic('N/ngate', W, H, .43, 'Đêm: đèn đường, cột cổng, cửa toà nhà toả sáng', [[530, 250, 380, 230, 'Đèn ở cổng + đèn đường mới vào hệ đèn đêm v25']])}${pic('N/dw', W, H, .43, 'Mùa đông: cỏ tuyết, cây phủ tuyết, mái nhà phủ trắng, ao đóng băng', [[915, 610, 120, 80, 'Ao đóng băng (tile băng NA)']])}</div>
<div class="row">${pic('N/tgard', W, H, .43, 'Mùa thu: cây ngả vàng/cam')}${pic('N/dgate', W, H, .43, 'Mùa đông: cổng + quảng trường')}</div>
<div class="row">${pic('N/chars', W, H, .43, 'Học sinh/NPC = nhân vật Ninja Adventure 16×16 phóng ×2, 4 hướng, có bước đi', [[368, 358, 684, 364, 'Mỗi học sinh một nhân vật (theo tên/màu áo)']])}${pic('N/teach', W, H, .43, '10 thầy cô v62k: mỗi người một nhân vật riêng', [[100, 340, 1250, 120, 'Cô Phi Lam, Thầy Lực Quang, Cô Ngọc Tố… (nhân vật NA riêng)']])}</div>
<div class="row">${pic('M/phone', 390, 844, .6, 'Điện thoại dọc 390×844')}${pic('M/phone_pick', 390, 844, .6, 'Chọn nhân vật', [[0, 440, 390, 280, '"Nhân vật của tôi" → chọn nhân vật NA (🎲 ngẫu nhiên, ↩️ hình cũ)']])}${pic('M/land', 844, 390, .8, 'Điện thoại ngang 844×390')}</div>
<h2>Ghi chú</h2><ul>${notes.map(([n, t]) => `<li><b>${n}.</b> ${t}</li>`).join('')}
<li>• <b>FPS</b> (Playwright, đi bộ 9 giây trong khu trường): CPU×1 desk 59,6 · phone 60. CPU×4: phone 30,7 (trước 32,1) · ngang 40,9 (trước 39,3) · desk 11,3 (trước 11,3) → không chậm hơn bản cũ (máy thử dùng render phần mềm, không GPU).</li>
<li>• <b>Giữ hình cũ</b>: đồ trong lớp (bàn, bảng, đàn, bàn cờ), bảng điểm danh, cờ, tượng Rubik, vườn phép thuật v48c, người đang đạp xe/bơi/cưỡi thú vẫn là hình vẽ code cũ.</li>
</ul></body></html>`;
(async () => { const b = await chromium.launch(), p = await b.newPage({viewport:{width:1960, height:1000}});
  await p.setContent(html, {waitUntil:'networkidle'}); await p.waitForTimeout(800); await p.screenshot({path:OUT, fullPage:true}); await b.close(); console.log('->', OUT); })();
