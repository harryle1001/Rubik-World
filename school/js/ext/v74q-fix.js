// ================= v74q · ỔN ĐỊNH: sửa lỗi do bộ kiểm tra tự động tools/qa/check.js tìm ra =================
// Không đổi thiết kế / tính năng. Chỉ bọc (gán lại) hàm cũ. Mọi tên toàn cục có tiền tố v74q / V74Q.
const V74Q = {fixed:[]};

// 1. Nút “🏆 Bảng vàng / 🎉 Lễ hội” (v70e) còn hiện khi đang lái máy bay → nằm dưới cần lái #v51pPad, bấm nhầm.
//    Khi đang bay (v51p) hoặc điều khiển drone thì ẩn nút (giống cách v70e đã ẩn khi lái xe v53c).
function v74qFlyBusy(){ return (typeof V51P !== 'undefined' && V51P.on) || (typeof V52LD !== 'undefined' && V52LD.on); }

// 2. Chữ < 16px còn sót (chuẩn Nunito ≥ 16px): mảnh ánh sáng + gợi ý trong 📖 Hành trình (13px),
//    chữ “Fire Station · ☎️ 114” ở đầu bảng Trạm cứu hoả / Đồn cảnh sát (15.8px), số cơ số ₂ trong bài Số nhị phân (13px).
//    Trên màn hẹp 6 mảnh xếp 3 cột để chữ 16px không bị bẻ dòng.
// 3. Nút 🍚 no bụng chỉ cao 26px → khó chạm. Nới vùng chạm lên ~40px bằng lớp ::after trong suốt (hình không đổi).
function v74qCss(){
  if(document.getElementById('v74qCss')) return;
  const s = document.createElement('style'); s.id = 'v74qCss';
  s.textContent = `#v70sBook .v70sShd div{font-size:16px}#v70sBook .v70sCh li small{font-size:16px}
.v51pHd b small,.v51pHd small{font-size:16px}.v51tbsum sub{font-size:16px}
#v52lHun{position:relative}#v52lHun::after{content:'';position:absolute;left:-2px;right:-2px;top:-7px;bottom:-7px}
@media (max-width:560px){#v70sBook .v70sShd{grid-template-columns:repeat(3,1fr)}}`;
  document.head.appendChild(s);
}

// 4. NẶNG — FPS tụt dần theo thời gian chơi (máy tính: 58 → 18 FPS sau 3 phút, 7 FPS sau 8 phút đứng yên).
//    v46ZoneCache (v46/render.js) làm mới ảnh đệm của khu gần ~8 lần/giây và mỗi lần gọi g.clip('evenodd') trên CÙNG canvas
//    mà không save()/restore() → ngăn xếp vùng cắt dài thêm mãi; mỗi lệnh vẽ sau đó phải áp lại cả ngăn xếp → khung ngày càng chậm.
//    Sửa: đặt lại trạng thái canvas (reset; máy cũ: gán lại width) ngay trước mỗi lần làm mới. Hình vẽ y hệt vì hàm gốc vẫn xoá rồi vẽ lại toàn bộ.
function v74qCvReset(cv){ try { const g = cv.getContext('2d'); if(typeof g.reset === 'function') g.reset(); else cv.width = cv.width; } catch(e){} }

function v74qInit(){
  v74qCss(); V74Q.fixed.push('css16');
  if(typeof v46ZoneCache === 'function' && typeof V46ZC !== 'undefined'){ const zc0 = v46ZoneCache;
    v46ZoneCache = function(z, force){ try { const c = z && V46ZC[z.id]; if(c && force) v74qCvReset(c.cv); } catch(e){} return zc0.apply(this, arguments); };
    V74Q.fixed.push('zone-clip'); }
  if(typeof v70eTick === 'function'){ const t0 = v70eTick;
    v70eTick = function(){ if(v74qFlyBusy()){ try { v70eTickAct(); } catch(e){} try { v70eBtn(null); } catch(e){} return; } return t0.apply(this, arguments); };
    V74Q.fixed.push('v70eGo-fly'); }
}
