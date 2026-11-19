// ================= v65a · 2/3 TRONG LỚP: bảng tên gỗ, bàn gỗ, thảm, chậu cây, kệ sách, cờ mái, đèn NA =================
// Lớp vẫn vẽ bằng drawBuildings() toạ độ cũ (giữ chỗ ngồi, cửa, va chạm). Chỉ khi v64s đang vẽ một khu trường (V64S.zs) thì đổi hình.
function v65aRoomId(r){ for(const id in V65A_ROOM) if(R[id] === r) return id; return null; }
// lớp sàn (dưới bàn ghế): thảm + vạch trang trí — dựng 1 canvas mỗi lớp (cache lớp được làm mới ~8 lần/giây nên phải rẻ)
function v65aFloorSpr(id, r){
  const w = r.w, h = r.h;
  return v65aSpr('F' + id + w + 'x' + h, w, h, g => {
    const ox = -r.x, oy = -r.y, T = (x, y, wT, hT, rug) => v65aRug(g, 'FI', rug[0], rug[1], x + ox, y + oy, wT, hT), ru = V65A_ROOM[id].rug;
    if(id === 'rubik'){ T(r.x + 32, r.y + 92, 8, 4, ru); }   // thảm dưới 6 bàn học (8×4 ô, gần đúng φ²)
    if(id === 'chess') T(r.x + 17, r.y + 22, 8, 6, ru);
    if(id === 'music'){ T(r.x + 20, r.y + 18, 10, 3, ru);   // sân khấu nhạc cụ
      g.fillStyle = '#2b1a10'; g.fillRect(20, 114, 320, 6); g.fillStyle = '#b97a45'; g.fillRect(20, 114, 320, 3); }
    if(id === 'office') T(r.x + 21, r.y + 74, 8, 4, ru);
    if(id === 'elec') T(r.x + 10, r.y + 86, 10, 4, ru);
    if(id === 'hall'){   // thảm đỏ giữa lối đi từ sân khấu tới cuối hội trường + thảm trước sân khấu
      T(r.x + 89, r.y + 118, 6, 2, ru);
      const ax = 184, aw = 28; g.fillStyle = '#2b1a10'; g.fillRect(ax - 3, 182, aw + 6, h - 182); g.fillStyle = '#c62f2f'; g.fillRect(ax, 182, aw, h - 182);
      g.fillStyle = '#e8c27a'; g.fillRect(ax + 2, 182, 2, h - 182); g.fillRect(ax + aw - 4, 182, 2, h - 182);
      g.fillStyle = 'rgba(255,255,255,.12)'; for(let y = 196; y < h; y += 24) g.fillRect(ax + 6, y, aw - 12, 2);
    }
  });
}
// đồ dựa tường (sau tường, trước người): chậu cây góc, kệ sách, tủ, cờ treo trên mái
function v65aWallDeco(id, r){
  const g = ctx, R0 = V65A_ROOM[id], x = r.x, y = r.y, w = r.w, h = r.h;
  // 2 cờ vải NA hai đầu mái (TilesetHouse 1×2 ô)
  [x + 10, x + w - 34].forEach((bx, i) => { g.fillStyle = '#2b1a10'; g.fillRect(bx + 10, y - 60, 4, 6); v64sT(g, 'H', R0.ban - (i ? 0 : 0), 20, bx, y - 56, 1, 2, 1.5); });
  // chậu cây ở 2 góc dưới (trừ góc có cửa)
  const pl = (px, py) => v65aPlant(g, px, py, 1.5);
  if(id === 'rubik'){ pl(x + 22, y + h - 78); pl(x + w - 46, y + h - 78); }
  if(id === 'chess'){ pl(x + 22, y + h - 78); pl(x + w - 46, y + h - 78); }
  if(id === 'music'){ pl(x + 22, y + h - 78); pl(x + w - 46, y + h - 78); v64sT(g, 'E', 4, 7, x + 230, y + h - 70, 1, 2, 1.5); }
  if(id === 'office'){ v64sT(g, 'E', 3, 7, x + 50, y + 8, 1, 2, 1.5); v64sT(g, 'E', 3, 7, x + 76, y + 8, 1, 2, 1.5); v64sT(g, 'E', 8, 7, x + 180, y + 8, 2, 2, 1.5);
    pl(x + w - 46, y + h - 78); pl(x + 22, y + h - 78); }
  if(id === 'elec'){ v64sT(g, 'E', 4, 7, x + w - 34, y + 8, 1, 2, 1.5); pl(x + 22, y + h - 78); pl(x + w - 46, y + h - 78); }
  if(id === 'hall'){ pl(x + 4, y + 124); pl(x + w - 30, y + 124); pl(x + w - 44, y + h - 78); }
}
// bảng tên lớp: gỗ NA, chữ Nunito ≥16px, đặt giữa mái
const V65A_NAME = {'LỚP RUBIK · CÔ HÀ':'Lớp Rubik · Cô Hà', 'KHU CỜ VUA · 5 BÀN':'Khu cờ vua · 5 bàn', 'ÂM NHẠC · PIANO · ĐÀN HÁT':'Âm nhạc · Piano · Đàn hát',
  'HỘI TRƯỜNG LỚN':'Hội trường lớn', 'VĂN PHÒNG BGH':'Văn phòng BGH', 'LỚP LẮP RÁP ĐIỆN · CÔ XUÂN':'Lớp lắp ráp điện · Cô Xuân'};
function v65aSign(r, text){
  const id = v65aRoomId(r), ic = id ? V65A_ROOM[id].ic + ' ' : '';
  const t = String(text).replace(/\s+/g, ' ').trim();
  v64sBoard(ctx, r.x + r.w/2, r.y - 52, ic + (V65A_NAME[t] || t));
}
function v65aRoomsInit(){
  const on = () => V65A.on && V64S.zs;
  const fl0 = floor; floor = function(r){ const res = fl0.apply(this, arguments);
    if(on()){ const id = v65aRoomId(r); if(id){ try { ctx.drawImage(v65aFloorSpr(id, r), r.x, r.y); } catch(e){} } } return res; };
  const wa0 = walls; walls = function(r){ const res = wa0.apply(this, arguments);
    if(on()){ const id = v65aRoomId(r); if(id){ try { v65aWallDeco(id, r); } catch(e){} } } return res; };
  const sg0 = sign; sign = function(r, text){ if(on() && v65aRoomId(r)){ try { v65aSign(r, text); return; } catch(e){} } return sg0.apply(this, arguments); };
  const dk0 = desk; desk = function(x, y, w, h){ if(on()){ try { v65aDesk(ctx, x, y, w, h); return; } catch(e){} } return dk0.apply(this, arguments); };
  // rect(): đổi đúng vài nét cũ trong khu học — nền khu điểm danh, bảng "ĐIỂM DANH", cột đèn cũ
  const rc0 = rect; rect = function(c, x, y, w, h){
    if(!on()) return rc0(c, x, y, w, h);
    if(V65A.lampSkip){ V65A.lampSkip = false; if(c === '#ffe9a8' && w === 10 && h === 7) return; }
    if(c === '#333' && w === 4 && h === 34){ try { v65aLamp(ctx, x + 2, y + 34); V65A.lampSkip = true; return; } catch(e){} }
    const A = R.attend;
    if(A && x === A.x && y === A.y && w === A.w && h === A.h && c === 'rgba(255,255,255,.18)'){ try { ctx.drawImage(v65aAttendSpr(A), A.x - 2, A.y - 5); return; } catch(e){} }
    if(A && y === A.y + 4 && x === A.x + 12 && c === '#2a1c10'){ return rc0('#2b1a10', x - 2, y - 2, w + 4, h + 4); }
    if(A && y === A.y + 6 && x === A.x + 14 && c === '#ffd23f'){ rc0('#e8c27a', x, y, w, h); return rc0('#f6dca0', x, y, w, 3); }
    return rc0(c, x, y, w, h); };
}
// nền khu điểm danh: thảm NA cam viền gỗ (12×5 ô ≈ 384×160)
function v65aAttendSpr(A){
  return v65aSpr('att' + A.w + 'x' + A.h, A.w + 4, A.h + 10, g => {
    g.fillStyle = '#2b1a10'; g.fillRect(0, 0, A.w + 4, A.h + 10); g.save(); g.beginPath(); g.rect(2, 2, A.w, A.h + 6); g.clip();
    v65aRug(g, 'FI', 0, 6, 2 + (A.w - 384)/2, 2 + (A.h + 6 - 192)/2 + 16, 12, 5); g.restore();
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(2, 2, A.w, 4);
  });
}
