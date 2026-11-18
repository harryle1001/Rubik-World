// Ghép school/REVIEW_v54_qa.png từ ảnh trong out/review (chạy review.js trước). Khoanh đỏ đánh số + ghi chú tiếng Việt.
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const R = path.join(__dirname, 'out', 'review'), M = JSON.parse(fs.readFileSync(path.join(R, 'meta.json')));
const img = n => 'data:image/png;base64,' + fs.readFileSync(path.join(R, n + '.png')).toString('base64');
let num = 0; const notes = [];
// ảnh + các vòng đỏ: rects = [[x,y,w,h], ...] theo toạ độ gốc; s = tỉ lệ thu nhỏ
function pic(name, w, s, label, rings){
  const rs = (rings || []).filter(q => q && q.r).map(q => { num++; notes.push([num, q.t]); const [x, y, ww, hh] = q.r, pad = 10;
    return `<div class="ring" style="left:${(x - pad)*s}px;top:${(y - pad)*s}px;width:${(ww + 2*pad)*s}px;height:${(hh + 2*pad)*s}px"><b>${num}</b></div>`; }).join('');
  return `<figure style="width:${w*s}px"><div class="im"><img src="${img(name)}" style="width:${w*s}px">${rs}</div><figcaption>${label}</figcaption></figure>`;
}
const L = M.land_before || [], La = M.land_after || [], P = M.phone_before || [], Pa = M.phone_after || [], S = M.shop_before || [], Sa = M.shop_after || [];
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>body{margin:0;background:#f6f4ee;font:700 18px/1.45 Nunito,sans-serif;color:#1d2433;width:2200px}
h1{margin:0;padding:26px 36px 4px;font-size:40px;font-weight:900}.sub{padding:0 36px 14px;color:#5a6378;font-size:20px}
.row{display:flex;gap:28px;padding:10px 36px;align-items:flex-start;flex-wrap:wrap}h2{margin:16px 36px 4px;font-size:26px;font-weight:900}
figure{margin:0}.im{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 6px 22px rgba(0,0,0,.18)}.im img{display:block}
figcaption{padding:8px 4px 0;font-size:19px;font-weight:800}
.ring{position:absolute;border:5px solid #e53935;border-radius:50%;box-shadow:0 0 0 2px #fff}.ring b{position:absolute;left:-16px;top:-16px;width:34px;height:34px;border-radius:50%;background:#e53935;color:#fff;display:grid;place-items:center;font-size:20px;font-weight:900;border:2px solid #fff}
.pair{display:flex;gap:14px;align-items:flex-start}.tag{display:inline-block;border-radius:8px;padding:0 8px;color:#fff;margin-right:6px}.bf{background:#d64545}.af{background:#1f9d55}
ol{list-style:none;margin:0;padding:0 36px 30px 36px;font-size:20px;columns:2;column-gap:40px}li{margin:4px 0;break-inside:avoid}</style></head><body>
<h1>🤖 Robo Thám Tử v54 · ảnh duyệt</h1><div class="sub">Robo đi khắp đảo (3 cỡ màn hình), ghi lỗi JS · FPS · NaN · kẹt · nhảy · nhãn · nút · chữ &lt;16px · tràn · che nhau · mini game mở/đóng. Khoanh đỏ = chỗ lỗi/chỗ đã sửa.</div>
<h2>1 · Robo đang đi & bảng báo cáo trong game (chỉ chủ game)</h2><div class="row">
${pic('robo', 390, .82, 'Robo bay theo nhân vật, bong bóng ghi bước đang kiểm tra', [{r:[62, 225, 120, 125], t:'Robo Thám Tử (robot trắng cầm kính lúp) dẫn nhân vật tới từng khu; bong bóng ghi nơi đang kiểm tra'}])}
${pic('panel', 390, .82, 'Bảng báo cáo: lỗi theo mức độ, ảnh, 📍 Đi tới chỗ lỗi, ⬇ Tải JSON', [{r:[28, 560, 334, 58], t:'Đếm lỗi theo mức: 🔴 Nghiêm trọng / 🟠 Vừa / 🔵 Nhẹ; nút 📍 đưa nhân vật tới đúng chỗ lỗi'}])}
<div><h2 style="margin:0 0 8px">2 · Màn ngang 844×390</h2><div class="pair">
${pic('land_before', 844, .62, '<span class="tag bf">Trước</span>Flycam đè nút Nhiệm vụ; thẻ lời dạy che nút Plane; chữ 10–12px', [{r:L[0], t:'Trước: nút Flycam đè lên nút Nhiệm vụ (66) ở cột phải'}, {r:L[2], t:'Trước: thẻ lời dạy che nút Plane ở cột trái'}])}
</div><div class="pair" style="margin-top:12px">
${pic('land_after', 844, .62, '<span class="tag af">Sau</span>Flycam xuống góc dưới; thẻ dời sang phải cột nút; chữ 16px', [{r:La[0], t:'Sau: Flycam dời xuống góc dưới, không đè nút nào'}, {r:La[5], t:'Sau: nhãn Lamp on / Bike / Plane 16px, không bị che'}])}
</div></div></div>
<h2>3 · Điện thoại 390×844 và máy tính 1440×900</h2><div class="row">
${pic('phone_before', 390, .7, '<span class="tag bf">Trước</span>Lớp Rubik: chữ 12–14px', [{r:P[0], t:'Trước: “Lịch sử nước đi” trong Lớp Rubik chỉ 14px (điện thoại)'}])}
${pic('phone_after', 390, .7, '<span class="tag af">Sau</span>chữ ≥16px', [{r:Pa[0], t:'Sau: “Lịch sử nước đi” 16px (cùng 25 cửa sổ/HUD khác trên điện thoại)'}])}
${pic('shop_before', 1440, .42, '<span class="tag bf">Trước</span>Thẻ “Bác Thương Gia” che nút Mua', [{r:S[0], t:'Trước: thẻ lời dạy che nút “Mua $220” trong Cửa hàng (bấm không được)'}])}
${pic('shop_after', 1440, .42, '<span class="tag af">Sau</span>thẻ tạm ẩn khi mở cửa sổ, nút Mua lộ ra', [{r:S[0], t:'Sau: thẻ lời dạy tạm ẩn khi có cửa sổ mở (hiện lại khi đóng), nút “Mua” bấm được'}])}
</div><h2>Ghi chú</h2><ol>${notes.map(([n, t]) => `<li><b>${n}.</b> ${t}</li>`).join('')}</ol></body></html>`;
(async () => {
  const b = await chromium.launch(), p = await b.newPage({viewport:{width:2200, height:1000}});
  await p.setContent(html, {waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.screenshot({path:path.join(__dirname, '..', '..', 'REVIEW_v54_qa.png'), fullPage:true}); await b.close(); console.log('OK');
})();
