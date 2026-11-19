// ================= v65a · 1/3 KHU HỌC NINJA ADVENTURE: trạng thái, mảnh vẽ dùng chung, bật/tắt =================
// Đổi đồ hoạ 10 khu học trên đảo (rubik, chess, music, hall, rubikyard, office, attend, elec, giantchess, rubikpark) sang kiểu Ninja Adventure.
// Chỉ đổi HÌNH: vị trí khu, cửa, va chạm, mini game, nút bấm giữ nguyên. Dùng lại ảnh + hàm v64s (v64sT, v64sPat, v64sBoard…). Tiền tố v65a / V65A.
const V65A_IDS = ['rubik', 'chess', 'music', 'hall', 'rubikyard', 'office', 'attend', 'elec', 'giantchess', 'rubikpark'];
// mỗi lớp: biểu tượng bảng tên, thảm (FI: cột, hàng góc trái trên của khối 4×4), cờ treo mái (ô TilesetHouse 22..28, hàng 20)
const V65A_ROOM = {
  rubik:{ic:'🧊', rug:[11, 0], ban:23}, chess:{ic:'♟️', rug:[11, 6], ban:28}, music:{ic:'🎵', rug:[0, 6], ban:26},
  hall:{ic:'🎭', rug:[0, 6], ban:23}, office:{ic:'🏫', rug:[11, 6], ban:25}, elec:{ic:'💡', rug:[0, 0], ban:24}
};
const V65A = {on:false, spr:{}, lampSkip:false, soft:['giantchess', 'rubikpark', 'attend']};
// sprite cache theo khoá (mùa…), dựng 1 lần
function v65aSpr(key, w, h, draw){
  let c = V65A.spr[key]; if(c) return c;
  c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  try { draw(g); } catch(e){ console.warn('v65a spr', key, e); } V65A.spr[key] = c; return c;
}
// thảm NA: khối nguồn 4×4 ô (góc + 2 ô cạnh xen kẽ) trải wT×hT ô 32px
function v65aRug(g, k, c0, r0, x, y, wT, hT){
  for(let j = 0; j < hT; j++) for(let i = 0; i < wT; i++){
    const c = c0 + (i === 0 ? 0 : i === wT - 1 ? 3 : 1 + (i - 1) % 2), r = r0 + (j === 0 ? 0 : j === hT - 1 ? 3 : 1 + (j - 1) % 2);
    v64sT(g, k, c, r, x + i*32, y + j*32, 1, 1, 2); }
}
// bàn gỗ NA (thay desk() cũ): viền đen, mặt gỗ sáng, cạnh trước tối, chân gỗ
function v65aDesk(g, x, y, w, h){
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 2, y + h + 4, w - 2, 4);
  g.fillStyle = '#2b1a10'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillRect(x + 1, y + h, 6, 8); g.fillRect(x + w - 7, y + h, 6, 8);
  g.fillStyle = '#6b4226'; g.fillRect(x + 2, y + h, 4, 7); g.fillRect(x + w - 6, y + h, 4, 7);
  g.fillStyle = '#c98a4a'; g.fillRect(x, y, w, h); g.fillStyle = '#e3a964'; g.fillRect(x + 1, y + 1, w - 2, 2);
  g.fillStyle = '#8a5a35'; g.fillRect(x, y + h - 4, w, 4); g.fillStyle = 'rgba(43,26,16,.25)'; for(let i = x + 10; i < x + w - 4; i += 12) g.fillRect(i, y + 4, 1, h - 9);
}
// chậu cây NA (TilesetElement 0,7–8) — mùa đông phủ tuyết nhẹ trên lá
function v65aPlant(g, x, y, s){ s = s || 1.5; v64sT(g, 'E', 0, 7, x, y, 1, 2, s); if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 4*s, y + 2*s, 8*s, 3*s); } }
// bụi hoa NA theo mùa (TilesetNature 4..7,14–16 hoặc tuyết)
function v65aFlowerBush(g, x, y, i){
  if(v64sDong()){ v64sT(g, 'N', 5, 12, x, y, 1, 1, 2); return; }
  if(v64sThu()){ v64sT(g, 'N', i % 2, 10, x, y, 1, 1, 2); v64sT(g, 'FD', i % 2, 0, x + 8, y + 6, 1, 1, 1); return; }
  v64sT(g, 'N', i % 2, 10, x, y, 1, 1, 2); const f = [[0, 11], [3, 11], [6, 11], [1, 11]][i % 4]; v64sT(g, 'N', f[0], f[1], x + 8, y + 2, 1, 1, 1);
}
// đèn kiểu cũ (rect #333 4×34 + chụp #ffe9a8) trong khu học → đèn NA v64s
function v65aLamp(g, x, y){ g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, 10, 4, 0, 0, 7); g.fill(); g.drawImage(v64sLampSpr(), x - 12, y - 60); }

// ---------- bật: khi v64s đã sẵn sàng (ảnh NA tải xong) → xoá cache cũ để các khu vẽ lại kiểu mới ----------
function v65aStart(){
  if(V65A.on || !V64S.ok) return; V65A.on = true; V65A.spr = {};
  try { V45RC.parkKey = ''; V45RC.boardKey = ''; V45RC.yardKey = ''; V45RC.baked = new Map(); northCache = null; } catch(e){}
  try { V47W.key = ''; V47W.pc = {}; } catch(e){}
  try { V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; for(const k in V46ZC) delete V46ZC[k]; } catch(e){}
}
function v65aInit(){
  if(typeof V46 === 'undefined' || !V46.ready || typeof V64S === 'undefined' || !V64S.inited || /[?&]nov65a/.test(location.search)) return;
  // vá lỗi v64s: mùa đông bụi cây dùng ô (1,12) = 1/4 tảng đá xanh → hình tam giác xanh; đổi sang ô bụi tuyết (5,12)
  const pr0 = v64sProp; v64sProp = function(g, p, lod){ if(lod < 2 && p.k === 'bush' && v64sDong()){ try { v64sT(g, 'N', 5, 12, p.x - 16, p.y - 26, 1, 1, 2); return; } catch(e){} } return pr0.apply(this, arguments); };
  try { v65aRoomsInit(); } catch(e){ console.warn('v65a rooms', e); }
  try { v65aYardsInit(); } catch(e){ console.warn('v65a yards', e); }
  if(V64S.ok) v65aStart(); else { const s0 = v64sStart; v64sStart = function(){ s0.apply(this, arguments); try { v65aStart(); } catch(e){ console.warn('v65a start', e); } }; }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v65a = {V65A, v65aStart};
}
