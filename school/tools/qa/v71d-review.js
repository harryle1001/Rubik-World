// v71d: ghép ảnh duyệt TRƯỚC/SAU có vòng tròn đỏ đánh số → school/REVIEW_v71d_*.png
const fs = require('fs'), path = require('path'); const D = __dirname + '/v71d/img/', OUT = path.resolve(__dirname, '../..');
const B = require('./v71d/before.json'), A = require('./v71d/after.json');
const img = n => 'data:image/png;base64,' + fs.readFileSync(D + n + '.png').toString('base64');
// panel: {src, title, w (px hiển thị), vw (rộng gốc), marks:[[n, rect, note?]]}
function panel(P){ const k = P.w/P.vw; const m = (P.marks || []).filter(x => x[1]).map(([n, r]) => { const cx = (r[0] + r[2]/2)*k, cy = (r[1] + r[3]/2)*k, rw = Math.max(22, r[2]*k*.62 + 10), rh = Math.max(22, r[3]*k*.62 + 10);
  return `<div class="ring" style="left:${cx - rw}px;top:${cy - rh}px;width:${2*rw}px;height:${2*rh}px"></div><b class="num" style="left:${Math.max(0, cx - rw*.75 - 14)}px;top:${Math.max(0, cy - rh*.75 - 14)}px">${n}</b>`; }).join('');
  return `<figure style="width:${P.w}px"><figcaption class="${P.tag}">${P.title}</figcaption><div class="pic"><img src="${img(P.src)}" style="width:${P.w}px">${m}</div></figure>`; }
function page(title, sub, panels, notes){ return `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#f6efe2;font:16px Nunito,system-ui,sans-serif;color:#2b1d14;padding:18px;display:inline-block}
h1{margin:0 0 4px;font-size:26px}p.sub{margin:0 0 12px;font-size:17px}.row{display:flex;gap:16px;align-items:flex-start}figure{margin:0}figcaption{font:900 18px Nunito,sans-serif;padding:6px 10px;border-radius:10px 10px 0 0;color:#fff}
figcaption.b{background:#8d6e63}figcaption.a{background:#2e7d32}.pic{position:relative;border:3px solid #2b1d14;border-radius:0 0 10px 10px;overflow:hidden;line-height:0}
.ring{position:absolute;border:4px solid #e53935;border-radius:50%;box-shadow:0 0 0 2px #fff}.num{position:absolute;width:30px;height:30px;border-radius:50%;background:#e53935;color:#fff;font:900 18px/30px Nunito,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff}
ol{margin:12px 0 0;padding-left:26px;font-size:17px;max-width:1500px}li{margin:3px 0}</style><h1>${title}</h1><p class="sub">${sub}</p><div class="row">${panels.map(panel).join('')}</div><ol>${notes.map(n => '<li>' + n + '</li>').join('')}</ol>`; }
const tr = A.desk.treas.map(t => `lần ${t.i}: ${t.got ? '🎁 ' + t.got : '🐟 chỉ cá thường'} (đã nhận ${t.tn}/5)`).join(' · ');
const R = {
 '1_cancau':page('Việc 1 · Cần câu Kho Báu Đại Dương: tối đa 5 đồ quý / ngày thật', 'Giữ giá bán đồ quý. Hết 5 lượt thì chỉ câu ra cá thường + thông báo nhẹ. 📱 390×844', [
   {src:'before_phone_rod', title:'TRƯỚC', tag:'b', w:390, vw:390, marks:[[1, B.phone.rect.rodCard]]},
   {src:'after_phone_rod', title:'SAU · thẻ cần câu', tag:'a', w:390, vw:390, marks:[[1, A.phone.rect.rodTag]]},
   {src:'after_phone_fish', title:'SAU · khi câu (đã câu quá 5 lần)', tag:'a', w:390, vw:390, marks:[[2, A.phone.rect.chip]]}],
   ['Thẻ cần câu ghi số lượt còn lại: “💎 Đồ quý hôm nay: còn N/5”.', 'Khi đang câu bằng cần Kho Báu (bến tàu, câu biển sâu, hồ câu, câu ngoài khơi) hiện chip số lượt; hết lượt: “🌊 Hôm nay đã đủ 5 món quý”.',
    'Thử câu 8 lần (ép tỉ lệ đồ quý 100%): ' + tr + '. Lần 6–8 hiện “Hôm nay biển đã tặng đủ 5 món quý, mai quay lại nhé!”.', 'Đường câu thật (bến tàu, tỉ lệ ép 100%) sau khi hết lượt: không thêm đồ quý, vẫn được cá “' + A.desk.treasReal.last.n + '”. Sang ngày thật mới tự đặt lại 5 lượt.']),
 '2_ngaythat':page('Việc 2 · Lương & Cây thần kỳ: giữ tính theo ngày thật', 'Không đổi cách tính. Chỉ thêm một dòng nhỏ 16px. 📱 390×844', [
   {src:'before_phone_luong', title:'TRƯỚC · Lương của em', tag:'b', w:390, vw:390},
   {src:'after_phone_luong', title:'SAU · Lương của em', tag:'a', w:390, vw:390, marks:[[1, A.phone.rect.luongNote]]},
   {src:'after_phone_cay', title:'SAU · Cây thần kỳ', tag:'a', w:390, vw:390, marks:[[2, A.phone.rect.cayNote]]}],
   ['Bảng lương: “🗓️ Công và quà làm mới mỗi ngày (theo ngày thật)”.', 'Bảng Cây thần kỳ: cùng dòng đó, ngay dưới lời giới thiệu điều ước.']),
 '3_menu':page('Việc 3 · Menu ☰ điện thoại: chỉ tiếng Việt, chữ ≥16px', 'Bỏ dòng tiếng Anh ở ô chức năng, thẻ mục, tiêu đề, chip mùa/thời tiết. 📱 390×844', [
   {src:'before_phone_menu', title:'TRƯỚC', tag:'b', w:390, vw:390, marks:[[1, B.phone.menuTile]]},
   {src:'after_phone_menu', title:'SAU', tag:'a', w:390, vw:390, marks:[[1, A.phone.menuTile]]},
   {src:'before_phone_menu2', title:'TRƯỚC · Trò chơi', tag:'b', w:390, vw:390},
   {src:'after_phone_menu2', title:'SAU · Trò chơi', tag:'a', w:390, vw:390}],
   [`Trước: ${B.phone.menuSmall.length} chữ nhỏ hơn 16px (dòng tiếng Việt ${B.phone.menuSmall.find(s => /^11/.test(s)) ? '11,5px' : '<16px'}). Sau: ${A.phone.menuSmall.length} chữ <16px, ${A.phone.menu.en} ô còn tiếng Anh, ${A.phone.menu.over} ô bị tràn. ↔ 844×390 cũng 0.`, 'Giữ chạm-giữ để nghe đọc như cũ.']),
 '4_hangnut':page('Việc 4 · Máy tính: hàng nút trên cùng xếp 2 hàng', 'Thấy hết nút (Âm thanh, Sáng/Trưa/Chiều/Tối), không đè bản đồ nhỏ / bảng Nhiệm vụ. 🖥 1440×900', [
   {src:'before_desk_hud', title:'TRƯỚC', tag:'b', w:740, vw:1440, marks:[[1, B.desk.rect.quick]]},
   {src:'after_desk_hud', title:'SAU', tag:'a', w:740, vw:1440, marks:[[1, A.desk.rect.quick], [2, A.desk.rect.toi]]}],
   [`Trước: 1 hàng cuộn ngang, ${B.desk.quickAll.cut} nút bị khuất. Sau: 2 hàng, ${A.desk.quickAll.cut} nút bị khuất, chữ 16px, không chạm bản đồ nhỏ.`, 'Nút “🌙 Tối” cuối cùng giờ thấy được.']),
 '5_thongbao':page('Việc 5 · Thông báo điện thoại: giữa màn hình, ngay dưới HUD', 'Không che nút Nhiệm vụ / Sổ tay góc phải, không che nhân vật. 📱 390×844 · ↔ 844×390', [
   {src:'before_phone_toast', title:'TRƯỚC', tag:'b', w:390, vw:390, marks:[[1, B.phone.rect.toast]]},
   {src:'after_phone_toast', title:'SAU', tag:'a', w:390, vw:390, marks:[[1, A.phone.rect.toast]]},
   {src:'after_land_toast', title:'SAU ↔ 844×390', tag:'a', w:620, vw:844, marks:[[2, A.land.rect.toast]]}],
   [`Điện thoại dọc: thông báo bắt đầu ngay dưới khung HUD (y=${A.phone.rect.toast[1]}), rộng tối đa chừa 2 cột nút tròn, chữ 16px.`, 'Điện thoại ngang: cũng ngay dưới HUD, giữa màn hình. Máy tính: thông báo nằm ngay dưới 2 hàng nút (không đè nút).']),
 '6_chu':page('Việc 6 · Máy tính: mọi chữ ≥16px + nhãn nút tròn tiếng Việt', 'HUD, Nhiệm vụ, Nhật ký, nhãn dưới nút tròn, lời dạy, các bảng cũ. 🖥 1440×900', [
   {src:'before_desk_hud', title:'TRƯỚC', tag:'b', w:740, vw:1440, marks:[[1, B.desk.rect.prof], [2, B.desk.rect.mtrack], [3, B.desk.rect.mlog], [4, B.desk.rect.col]]},
   {src:'after_desk_hud', title:'SAU', tag:'a', w:740, vw:1440, marks:[[1, A.desk.rect.prof], [2, A.desk.rect.mtrack], [3, A.desk.rect.mlog], [4, A.desk.rect.col]]}],
   [`Đo bằng getComputedStyle trên màn chính: trước ${B.desk.smallHud.length} chữ <16px (nhỏ nhất 10px), sau ${A.desk.smallHud.length}.`, `Bảng cũ (Cài đặt, Cửa hàng, Hồ sơ, Nhiệm vụ): trước ${Object.values(B.desk.panels).reduce((a, b) => a + b.length, 0)} chữ <16px, sau ${Object.values(A.desk.panels).reduce((a, b) => a + b.length, 0)}. Menu ☰ máy tính: 0.`,
    'Nhãn nút tròn: Lamp on → Đèn, Bike → Xe đạp (khi đạp: Đi bộ), Plane → Máy bay (khi bay: Hạ cánh), Boat → Thuyền, Fly → Bay, Hành tinh giữ nguyên. Trên điện thoại cũng đổi.', 'Cột nút tròn và thẻ lời dạy dời lên một chút để không đè dòng “Đang điều khiển…”.'])
};
(async () => { const b = await require('playwright').chromium.launch(); const p = await b.newPage({deviceScaleFactor:1});
  for(const k in R){ await p.setContent(R[k]); await p.waitForTimeout(300); const body = await p.$('body'); await body.screenshot({path:OUT + `/REVIEW_v71d_${k}.png`}); console.log('REVIEW_v71d_' + k); }
  await b.close(); })();
