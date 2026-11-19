// ================= v65f · 3/3 NHÀ NGƯỜI CHƠI, NHÀ DÂN, PHÒNG HỌC: tường/sàn NA (giữ màu đã mua), khung tường, cửa ra, bàn học =================
// drawWallFloor gốc vẽ cả nhà phố người chơi, nhà dân làng, cửa hàng, khung trang trí và ô xem trước giấy dán tường → bọc một chỗ là đổi hết.
// Tường/sàn người chơi đã mua: giữ đúng màu, chỉ thay hoa văn bằng tile NA nhuộm màu đó. Đồ nội thất đã mua (drawDecor) giữ nguyên.
const V65F_WP = {gach:'brick', caro:'tile'}, V65F_FP = {go:'wood', gach:'brick', caro:'tile', da:'stone', tham:'plain', tatami:'plain'};
function v65fWallFloor(c, wallKey, floorKey, Wd, Ht, T, wallRows){
  const wl = wallKey ? mallItem(wallKey) : null, fl = floorKey ? mallItem(floorKey) : null, wh = wallRows*T, s = T >= 40 ? 3 : 2;
  if(Ht > wh){ const fp = fl ? fl.pat : 'go'; v65fFloor(c, 0, wh, Wd, Ht - wh, V65F_FP[fp] || 'plain', s, fl ? fl.col : null);
    if(fp === 'caro'){ c.fillStyle = 'rgba(0,0,0,.18)'; for(let y = wh; y < Ht; y += T) for(let x = ((y - wh)/T % 2)*T; x < Wd; x += T*2) c.fillRect(x, y, T, T); }
    else if(fp === 'tatami'){ c.strokeStyle = V65F_O; c.lineWidth = 2; for(let y = wh; y < Ht; y += T) for(let x = ((y - wh)/T % 2)*T; x < Wd; x += T*2){ c.strokeRect(x + 1, y + 1, T*2 - 2, T - 2); c.fillStyle = '#2f5a3a'; c.fillRect(x + 2, y + 2, T*2 - 4, 3); } }
    else if(fp === 'tham'){ c.fillStyle = shade(fl.col, .14); for(let y = wh + 10; y < Ht; y += 18) for(let x = 10 + ((y - wh)/18 % 2)*9; x < Wd; x += 18) c.fillRect(x, y, 4, 4); }
    else if(fp === 'da'){ c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; for(let k = 0; k < 30; k++){ const sx = (k*97) % Wd, sy = wh + (k*61) % (Ht - wh); c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + 30, sy + 10, sx + 60, sy - 6); c.stroke(); } } }
  if(wh > 0){ const wp = wl ? wl.pat : 'tron', base = wl ? wl.col : '#ead9b8';
    v65fWall(c, 0, 0, Wd, wh, {base, tex:V65F_WP[wp], texA:.6, stripe:wp === 'soc' ? shade(base, -.1) : null, wood:wp === 'go' ? 1 : wh < 60 ? .3 : .36, woodTint:wp === 'go' ? base : null});
    if(wp === 'hoa'){ c.fillStyle = shade(base, -.16); for(let x = 10; x < Wd; x += 36) for(let y = 12; y < wh*.6; y += 30){ c.fillRect(x + ((y - 12)/30 % 2)*18 - 3, y - 3, 6, 6); } } }
}
// cảnh đi trong nhà (v52ws): khung tường NA hai bên + bậc cửa đá + thảm "CỬA RA"
function v65fRoomTrim(g, sc){
  const W = sc.w, H = sc.h, Hr = H - 70, door = W/2;
  v65fFrame(g, 0, 0, Math.round(W/16), Math.round(Hr/16), 0, 1, [door - 44, door + 44], true);
  g.fillStyle = '#1d1410'; g.fillRect(0, Hr, W, H - Hr);
  g.fillStyle = V65F_O; g.fillRect(door - 46, Hr - 8, 92, H - Hr + 8); v65fFloor(g, door - 42, Hr - 8, 84, H - Hr + 8, 'stone', 2);
  g.fillStyle = 'rgba(0,0,0,.25)'; for(let y = Hr + 14; y < H; y += 18) g.fillRect(door - 42, y, 84, 3);
  g.fillStyle = V65F_O; g.fillRect(door - 36, Hr + 4, 72, 28); g.fillStyle = '#9c2b1f'; g.fillRect(door - 34, Hr + 6, 68, 24); g.fillStyle = '#e8c27a'; g.fillRect(door - 34, Hr + 6, 68, 3); g.fillRect(door - 34, Hr + 27, 68, 3);
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CỬA RA', door, Hr + 19); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
// bàn học trong lớp (khu trường v64s): bàn gỗ NA viền đen, mặt sáng, ván trước, chân tối — đúng kích thước cũ
function v65fDesk(x, y, w, h){
  const g = ctx, O = V65F_O; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 2, y + h + 4, w, 4);
  g.fillStyle = O; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillRect(x + 1, y + h, 4, 7); g.fillRect(x + w - 5, y + h, 4, 7);
  g.fillStyle = '#c98a4b'; g.fillRect(x, y, w, h - 4); g.fillStyle = '#e0a564'; g.fillRect(x, y, w, 2); g.fillStyle = '#9a6236'; g.fillRect(x, y + h - 4, w, 4);
  g.fillStyle = 'rgba(90,50,20,.35)'; for(let px = x + 12; px < x + w - 4; px += 12) g.fillRect(px, y + 2, 1, h - 6);
  g.fillStyle = '#6d3f22'; g.fillRect(x + 2, y + h, 2, 6); g.fillRect(x + w - 4, y + h, 2, 6);
}
// bảng đen lớp Rubik: khung gỗ NA + máng phấn + chữ Nunito (đè đúng chỗ bảng cũ)
function v65fChalk(r){
  const g = ctx, O = V65F_O, x = r.x + 34, y = r.y + 12, w = 252, h = 44;
  g.fillStyle = O; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#8a5a35'; g.fillRect(x, y, w, h); g.fillStyle = '#c9844a'; g.fillRect(x, y, w, 2);
  g.fillStyle = O; g.fillRect(x + 5, y + 5, w - 10, h - 12); g.fillStyle = '#2f5a3a'; g.fillRect(x + 6, y + 6, w - 12, h - 14); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 10, y + 9, 60, 3);
  g.fillStyle = '#e9f5e9'; g.fillRect(x + 30, y + h - 6, 10, 3); g.fillStyle = '#ffd23f'; g.fillRect(x + 46, y + h - 6, 8, 3);
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.fillStyle = '#e9f5e9'; g.textBaseline = 'middle'; g.fillText("R U R' U' · Tầng 1 → 2 → 3", x + 12, y + 20); g.textBaseline = 'alphabetic';
  try { miniCube(r.x + 254, r.y + 18, 7); } catch(e){}
}
function v65fRoomsInit(){
  if(typeof drawWallFloor === 'function'){ const wf0 = drawWallFloor; drawWallFloor = function(c, wk, fk, Wd, Ht, T, wr){ if(v65fReady()){ try { v65fWallFloor(c, wk, fk, Wd, Ht, T, wr); return; } catch(e){ console.warn('v65f wf', e); } } return wf0.apply(this, arguments); }; }
  if(typeof v52wsRoomScene === 'function'){ const rs0 = v52wsRoomScene; v52wsRoomScene = function(o){ const sc = rs0.apply(this, arguments); if(!sc || typeof sc.bg !== 'function') return sc;
    const bg0 = sc.bg; sc.bg = g => { bg0(g); if(v65fReady()) try { v65fRoomTrim(g, sc); } catch(e){ console.warn('v65f trim', e); } }; return sc; }; }
  if(typeof v52wsOpen === 'function'){ const op0 = v52wsOpen; v52wsOpen = function(){ v65fReady(); return op0.apply(this, arguments); }; }
  if(typeof openRoom === 'function'){ const or0 = openRoom; openRoom = function(){ v65fReady(); return or0.apply(this, arguments); }; }
  // lớp học trong khu trường: bàn + biển tên lớp kiểu NA (chỉ khi đang vẽ khu trường v64s → vẽ một lần vào cache khu)
  if(typeof desk === 'function'){ const dk0 = desk; desk = function(x, y, w, h){ if(V64S.zs && V64S.img.E){ try { v65fDesk(x, y, w, h); return; } catch(e){} } return dk0(x, y, w, h); }; }
  if(typeof sign === 'function' && typeof v64sBoard === 'function'){ const sg0 = sign; sign = function(r, text, col){ if(V64S.zs && V64S.img.E){ try { ctx.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const w = ctx.measureText(text).width + 22; v64sBoard(ctx, r.x + 4 + w/2, r.y - 32, text); if(r === R.rubik) v65fChalk(r); return; } catch(e){} } return sg0(r, text, col); }; }
  try { if(typeof V46ZC !== 'undefined') for(const k in V46ZC) delete V46ZC[k]; } catch(e){}   // vẽ lại cache khu trường với bàn mới
}
function v65fInit(){
  if(typeof V64S === 'undefined' || /[?&]nov65f/.test(location.search)) return;
  try { v65fHouseInit(); } catch(e){ console.warn('v65f house', e); }
  try { v65fRoomsInit(); } catch(e){ console.warn('v65f rooms', e); }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v65f = {V65F, v65fHsBg, v65fReady};
}
