// ================= v54q · SỬA LỖI do Robo Thám Tử tìm thấy (đo "Trước" bằng cách thêm ?v54nofix vào địa chỉ) =================
// Chỉ chỉnh đúng chỗ nhỏ nhất: CSS cho máy cảm ứng (chữ ≥16px), bọc hàm khi cần. Không đổi thiết kế, không đổi dữ liệu.
const V54Q_FIXCSS = `
/* 1. Chữ ≥16px trên điện thoại (quy tắc chung: Nunito, tối thiểu 16px) */
html body.touchdev #profName, html body.touchdev #profLvl, html body.touchdev #profMoney, html body.touchdev #v45Heart, html body.touchdev #v52lHun b, html body.touchdev #v37Info span{font-size:16px !important}
html body.touchdev #v32MisN{font-size:16px !important;min-width:24px;height:24px;line-height:24px}
html body.touchdev #v41Col .v41b small, html body.touchdev #v52ldBtn small{font-size:16px !important;white-space:nowrap;font-family:Nunito,system-ui,sans-serif;font-weight:800;text-shadow:0 1px 2px rgba(0,0,0,.85),0 0 4px rgba(0,0,0,.6)}
html body.touchdev #mentor #mtName, html body.touchdev #mentor #mtLine, html body.touchdev #mentor #mtQuote, html body.touchdev #mentor #mtSrc{font-size:16px !important}
html body.touchdev #mLab b, html body.touchdev #mLab i, html body.touchdev #labFormula button, html body.touchdev #mRubik b, html body.touchdev #mRubik i{font-size:16px !important}
html body.touchdev #pkeys span.kl{display:none}
html body.touchdev #pkeys span.kn{font-size:16px !important}
html body.touchdev :is(#acGrid, #olyGrid, #hallGrid) :is(b, span){font-size:16px !important}
html body.touchdev #libList h3.libcat, html body.touchdev #libList div.cover, html body.touchdev #libList span{font-size:16px !important}
html body.touchdev :is(#cstatus, #fstatus, #farmSt, #caroSt, #goSt, #sdkSt, #mqScore, #memSt, #mkMoney, #mallMoney){font-size:16px !important}
html body.touchdev :is(#mFish, #mFarm, #roomBagBox, #mLab, #mRubik) h2{font-size:16px !important}
html body.touchdev #mallGrid :is(.sname, .sdesc){font-size:16px !important}
html body.touchdev #v40Spk, html body.touchdev #v48mEd button{font-size:16px !important}
html body.touchdev #v51pPanel :is(small, span), html body.touchdev #v53cPanel span{font-size:16px !important}
/* 2. Nút Flycam (chủ game) đè lên cột nút bên phải khi xoay ngang, và đè bảng Nhật ký trên máy tính */
@media (orientation:landscape) and (max-height:500px){html body #v52ldBtn{right:calc(80px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom))}
  /* 3. Thẻ lời dạy (mentor) che nút Plane ở cột trái khi xoay ngang: dời sang phải cột nút */
  html body:not(:has(.modal:not([hidden]))) #mentor.mentor.v39m{left:calc(76px + env(safe-area-inset-left))!important}}
@media (min-width:900px) and (min-height:501px){html body #v52ldBtn{right:calc(272px + env(safe-area-inset-right));bottom:24px}}
/* 4. Thẻ lời dạy (mentor) che nút trong cửa sổ đang mở (vd. nút “Mua” ở Cửa hàng): ẩn khi có cửa sổ mở, đóng cửa sổ thì hiện lại
   (giống cách v44 đã ẩn thẻ này khi chơi mini game: css/style.css:850 body.v44arc #mentor) */
html body:has(.modal:not([hidden])) #mentor.mentor{display:none!important}
`;
function v54qFixInit(){
  if(/[?&]v54nofix\b/.test(location.search)) return;   // đo "Trước"
  const s = document.createElement('style'); s.id = 'v54qFixCss'; s.textContent = V54Q_FIXCSS; document.head.appendChild(s);
}
