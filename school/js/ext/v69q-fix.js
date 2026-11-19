// ================= v69q · SỬA LỖI SAU KIỂM TRA v69 (v65–v68) =================
// Chủ game: "Kiểm tra lỗi báo cáo rồi sửa". Chỉ bọc / gán lại hàm cũ, không đổi thiết kế. Báo cáo: BAO_CAO_v69_LOI.html
// Mọi tên toàn cục có tiền tố v69q / V69Q.
const V69Q = {on:false, err:0, lastArea:''};
const V69Q_CSS = `
/* L3 · phiếu lương không tràn ngang trên điện thoại (cột tiền bị cắt mép phải) */
@media (max-width:480px){
  .v67lPaper{padding:18px 12px 14px}
  .v67lPaper td{padding:5px 1px}
  .v67lPaper td:nth-child(2){white-space:nowrap}
  .v67lPaper .meta{flex-wrap:wrap;gap:2px 10px}
}
/* L4 · nút mời "Diễn văn nghệ" / "Cây thần kỳ" ẩn khi đang mở cửa sổ (giống nút vào khu v63f) */
html body:has(.modal:not([hidden])) #v67lGoStage, html body:has(.modal:not([hidden])) #v66tGo,
html body.v67lFull #v67lGoStage, html body.v67lFull #v66tGo,
html body:has(#v52wsPan:not([hidden])) #v67lGoStage, html body:has(#v52wsPan:not([hidden])) #v66tGo{display:none !important}
/* L6 · nhãn "MỚI" trên thẻ hàng TTTM tầng 3 đủ 16px */
.v68new{font-size:16px !important}
/* L7 · nút ✕ của thẻ lời dạy: chữ 16px, vùng chạm 44px */
#mentor .v39x{font-size:16px !important}
body.touchdev #mentor .v39x::before{content:'';position:absolute;inset:-11px}
/* L8 · chip "−$ chi tiêu" không đè lên tiêu đề bảng quầy TTTM */
html body:has(#v52wsPan:not([hidden])) .v62fChip{display:none}
`;

// ---------- L1 (nặng) · v66c: nhân vật thiếu "task" làm tắt hẳn nhân vật mới ----------
// v66cExtras đọc a.task.includes(...) → vật thể vẽ nhân vật không có task (xem trước trang phục, cá lặn biển, khách…)
// ném lỗi → v66c bắt lỗi rồi đặt V66C.on = false cho CẢ phiên chơi → mọi người đổi về hình cũ.
function v69qChars(){
  if(typeof v66cExtras !== 'function' || typeof V66C === 'undefined') return;
  const ex0 = v66cExtras;
  v66cExtras = function(a, by){
    if(a && typeof a.task !== 'string'){ const t = a.task, had = 'task' in a; a.task = ''; try { return ex0.call(this, a, by); } finally { if(had) a.task = t; else delete a.task; } }
    return ex0.apply(this, arguments);
  };
  // một lần lỗi hiếm không được tắt vĩnh viễn: bật lại, chỉ tắt nếu lỗi liên tục (> 30 lần)
  setInterval(() => { if(!V66C.on && V69Q.err < 30){ V69Q.err++; V66C.on = true; } }, 2000);
}

// ---------- L2 (vừa) · biển "Bạn đã đến Vùng ven bờ" hiện sai khi đang ở trên đảo ----------
// v26AreaName dùng toạ độ bản đồ cũ: trên đảo mới (x ≥ V46E) y luôn > 1010 → coi là biển "Vùng ven bờ".
function v69qZoneName(x, y){
  if(typeof V46 === 'undefined' || !V46.ZI) return null;
  for(const id in V46.ZI){ const z = V46.ZI[id], n = z && z.nr; if(!n || x < n.x0 || x > n.x1 || y < n.y0 || y > n.y1) continue;
    const r = typeof R !== 'undefined' && (R[id] || (z.o && R[z.o])); if(r && r.name) return r.name; }
  return null;
}
function v69qArea(){
  if(typeof v26AreaName !== 'function') return;
  const a0 = v26AreaName;
  v26AreaName = function(x, y){
    try { if(typeof V46 !== 'undefined' && V46.on && typeof v46Raw === 'function' && v46Raw(x)){
      const ix = x - V46E; let sea = false; try { sea = typeof v47wSea === 'function' && v47wSea(ix, y); } catch(e){}
      if(!sea) return v69qZoneName(ix, y);               // trên đảo: tên khu (hoặc không hiện gì)
    } } catch(e){}
    return a0.apply(this, arguments);
  };
}

// ---------- L5 (vừa) · nhiệm vụ "Ngắm sinh vật biển phát sáng vào ban đêm" tự xong khi đứng trên đảo ----------
// missionTick dùng "y camera > 950 = biển" của bản đồ cũ → ban đêm đứng ở bất kỳ đâu trên đảo mới cũng hoàn thành + nhận $.
function v69qMission(){
  if(typeof mprog !== 'function') return;
  const m0 = mprog;
  mprog = function(id){
    if(id === 'night'){ try { if(typeof V46 !== 'undefined' && V46.on && typeof v46Raw === 'function' && PLAYER && v46Raw(PLAYER.x)){
      // trên đảo camera dùng toạ độ đảo. Chỉ tính khi tâm màn hình hoặc nhân vật ở ngoài biển
      let sea = false; try { sea = v47wSea(cam.x, cam.y) || v47wSea(PLAYER.x - V46E, PLAYER.y); } catch(e){}
      if(!sea) return; } } catch(e){} }
    return m0.apply(this, arguments);
  };
}

function v69qInit(){
  if(V69Q.on || /[?&]nov69q/.test(location.search)) return; V69Q.on = true;
  if(!document.getElementById('v69qCss')){ const s = document.createElement('style'); s.id = 'v69qCss'; s.textContent = V69Q_CSS; document.head.appendChild(s); }
  const step = (n, f) => { try { f(); } catch(e){ console.warn('v69q ' + n, e); } };
  step('chars', v69qChars); step('area', v69qArea); step('mission', v69qMission);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v69q = {V69Q, v69qZoneName};
}
