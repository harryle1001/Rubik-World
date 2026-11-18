// ================= v63f · SỬA LỖI do 10 thầy cô (v62k) báo trong BAO_CAO_v62_THAY_CO.html =================
// Nguyên nhân lớn nhất: lần merge v54 làm rơi v54qFixInit() khỏi dòng init → các bản sửa chữ ≥16px / nút che của v54q không chạy.
// File này bật lại v54qFixInit và thêm vài chỉnh CSS nhỏ. Không đổi thiết kế, không đổi dữ liệu. Đo "Trước": thêm ?v63nofix vào địa chỉ.
const V63F_CSS = `
/* 1. Điện thoại: chữ ≥16px ở chỗ v54q chưa phủ */
html body.touchdev #pkeys span.kl, html body.touchdev #mPaint h2, html body.touchdev #gallery figcaption{font-size:16px !important}
/* 2. Mọi cỡ màn hình: dòng trạng thái & tiêu đề nhỏ trong cửa sổ mini game lên 16px (một dòng chữ, không làm bàn cờ/bảng to ra) */
html body :is(#cstatus, #fstatus, #farmSt, #caroSt, #goSt, #sdkSt, #mqScore, #memSt, #mkMoney){font-size:16px !important}
html body :is(#mFish, #mFarm, #mLab, #mRubik, #mPaint) h2, html body #mLab :is(b, i), html body #labFormula button{font-size:16px !important}
html body #mentor :is(#mtName, #mtLine, #mtQuote, #mtSrc){font-size:16px !important}
/* 3. Thẻ lời dạy (mentor) che nút của khung đang mở không phải .modal (sắp xếp bản đồ, phố phép thuật, trường tin học, laptop) */
html body:has(#v48mEd:not([hidden]), #v51aPan:not([hidden]), #v51aAct:not([hidden]), #v51tPan:not([hidden]), #v51tAct:not([hidden]), #v52wdev:not([hidden])) #mentor.mentor{display:none !important}
/* 5. Máy tính: thẻ lời dạy (góc trái dưới) đè nút 🪐 Hành tinh của cột nút trái → dời sang phải cột nút (giống v54q làm khi xoay ngang) */
@media (min-width:900px) and (min-height:501px){html body:not(:has(.modal:not([hidden]))) #mentor.mentor.v39m{left:calc(100px + env(safe-area-inset-left))!important}}
/* 6. Trường tin học: khi bảng bài học v51tPan mở (phủ cả màn), ẩn nút ?/🏆 của thanh trên và nút hành động phía dưới vốn đè lên nút ✕ và thẻ bài */
html body:has(#v51tPan:not([hidden])) :is(#v51tHelp, #v51tBoardB, #v51tAct){visibility:hidden !important}
/* 7. Màn ngang: nhãn cột nút lên 16px nên cột rộng ~75px → thẻ lời dạy (v54q đặt left 76px) che chữ “Hành tinh”: dời thêm */
@media (orientation:landscape) and (max-height:500px){html body:not(:has(.modal:not([hidden]))) #mentor.mentor.v39m{left:calc(96px + env(safe-area-inset-left))!important}}
/* 4. Nút "Vào …" (v53c) chỉ là lời mời khi đứng gần cửa: ẩn khi đang mở cửa sổ (Rubik 3D, cờ…) để không nổi lên trên/che nút ✕ */
html body:has(.modal:not([hidden])) #v53cEnter{display:none !important}
`;
// nhãn bản đồ trùng chỗ (vd. “Khu rừng thông” bao quanh “Hồ cá Koi”): dời nhãn của khu lớn hơn sang một bên
function v63fMapSpread(P){
  if(!P || P._v63f) return P; P._v63f = 1;
  const area = p => { const r = typeof R !== 'undefined' && R[p.k]; return r && r.w ? r.w*r.h : 0; };
  for(let i = 0; i < P.length; i++) for(let j = i + 1; j < P.length; j++){ const a = P[i], b = P[j];
    if(a.k === b.k || Math.hypot(a.x - b.x, a.y - b.y) >= 60) continue;
    const big = area(a) >= area(b) ? a : b, r = R[big.k]; if(!r || !r.w) continue; const dx = r.w*.3;
    if(big.ox != null && typeof v46ToNew === 'function'){ big.ox -= dx; const n = v46ToNew(big.ox, big.oy); big.x = n[0]; big.y = n[1]; } else big.x -= dx; }
  return P;
}
function v63fInit(){
  if(/[?&]v63nofix\b/.test(location.search)) return;
  try { if(!document.getElementById('v54qFixCss') && typeof v54qFixInit === 'function') v54qFixInit(); } catch(e){}
  const s = document.createElement('style'); s.id = 'v63fCss'; s.textContent = V63F_CSS; document.head.appendChild(s);
  try { const mp = mapPlaces; mapPlaces = function(){ return v63fMapSpread(mp.apply(this, arguments)); }; } catch(e){}
}
