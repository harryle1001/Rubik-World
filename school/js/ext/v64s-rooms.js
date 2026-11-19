// ================= v64s · 4/5 LỚP HỌC: sàn + tường + mái kiểu Ninja Adventure (giữ nguyên hình học → cửa, chỗ ngồi, va chạm như cũ) =================
// Các lớp vẫn vẽ bằng drawBuildings() trong toạ độ cũ; chỉ khi đang vẽ một khu trường (cờ V64S.zs) thì floor()/walls() đổi sang tile NA.
const V64S_FLOOR = {rubik:['W', 5, 13], chess:['FI', 17, 1], music:['FI', 13, 7], hall:['W', 2, 13], office:['FI', 5, 1], elec:['FI', 13, 7], rubikyard:['FL', 1, 4]};
const V64S_ROOF = {rubik:0, chess:4, music:12, hall:12, office:8, elec:0};
function v64sRoomId(r){ for(const id in V64S_FLOOR) if(R[id] === r) return id; return null; }
function v64sFloor(r){
  const id = v64sRoomId(r), F = id && V64S_FLOOR[id]; if(!F) return false;
  const f = id === 'rubikyard' && v64sDong() ? ['FL', 1, 13] : F;
  ctx.fillStyle = v64sPat(ctx, f[0], f[1], f[2], 2); ctx.fillRect(r.x, r.y, r.w, r.h);
  if(id === 'music'){ ctx.fillStyle = 'rgba(90,60,140,.28)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  if(id === 'elec'){ ctx.fillStyle = 'rgba(70,120,170,.18)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(r.x, r.y, r.w, 10);   // bóng tường sau
  return true;
}
// tường dày như cũ (10px, cửa rộng 44px) nhưng vẽ gạch NA viền đen + mái ngói phía sau (tường trên)
function v64sWalls(r){
  const id = v64sRoomId(r); if(!id || r.fence || id === 'rubikyard') return false;
  const t = 12, g = 22, O = '#2b1a10', pat = v64sPat(ctx, 'H', 6, 2, 1);
  // mái phía sau: dải ngói NA (mái trên + mái dưới) nằm ngoài phòng → người trong phòng không bị che
  try { const sty = V64S_ROOF[id] || 0, wT = Math.max(3, Math.round((r.w + 24)/32)), x = r.x + r.w/2 - wT*16;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x - 40, r.y - 120, r.w + 80, 120 - t/2); ctx.clip(); v64sHouse(ctx, sty, x, r.y - 60, wT, 2, 0, []);
    if(v64sDong()){ ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 8, r.y - 58, wT*32 - 16, 14); } ctx.restore(); } catch(e){}
  const bar = (x, y, w, h) => { if(w <= 0 || h <= 0) return; ctx.fillStyle = O; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = pat; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x, y, w, 2); };
  const sides = {t:[r.x - t/2, r.y - t/2, r.w + t, t], b:[r.x - t/2, r.y + r.h - t/2, r.w + t, t], l:[r.x - t/2, r.y - t/2, t, r.h + t], r:[r.x + r.w - t/2, r.y - t/2, t, r.h + t]};
  for(const sd in sides){ const s = sides[sd];
    if(r.side !== sd || !r.dw){ bar(...s); continue; }
    if(sd === 'b' || sd === 't'){ bar(s[0], s[1], r.dw[0] - g - s[0], t); bar(r.dw[0] + g, s[1], s[0] + s[2] - r.dw[0] - g, t);
      ctx.fillStyle = O; ctx.fillRect(r.dw[0] - g - 4, s[1] - 6, 8, t + 10); ctx.fillRect(r.dw[0] + g - 4, s[1] - 6, 8, t + 10); ctx.fillStyle = '#8a5a35'; ctx.fillRect(r.dw[0] - g - 2, s[1] - 4, 4, t + 6); ctx.fillRect(r.dw[0] + g - 2, s[1] - 4, 4, t + 6); }
    else { bar(s[0], s[1], t, r.dw[1] - g - s[1]); bar(s[0], r.dw[1] + g, t, s[1] + s[3] - r.dw[1] - g); } }
  if(v64sDong()){ ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(r.x - t/2, r.y + r.h - t/2 - 2, r.w + t, 4); }
  return true;
}
// lâu đài v48c → kiểu NA: tháp nhọn thành cột đèn đá, cổng vòm thành cổng gỗ, tháp chính Đại sảnh thành gác chuông mái ngói
function v64sLantern(g, cx, base, tall, flags){
  const h = tall ? 70 : 44; V48C.bb.push([cx - 16, base - h - 34, cx + 30, base + 6]);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx - 12, base - 3, 26, 6);
  g.fillStyle = '#2b2430'; g.fillRect(cx - 10, base - 12, 20, 12); g.fillRect(cx - 5, base - h + 14, 10, h - 20); g.fillRect(cx - 13, base - h - 2, 26, 20); g.fillRect(cx - 15, base - h - 8, 30, 8);
  g.fillStyle = '#c9c2b4'; g.fillRect(cx - 8, base - 10, 16, 8); g.fillRect(cx - 3, base - h + 16, 6, h - 24); g.fillStyle = '#c9c2b4'; g.fillRect(cx - 11, base - h, 22, 3); g.fillRect(cx - 13, base - h - 6, 26, 5);
  g.fillStyle = '#ffd27a'; g.fillRect(cx - 9, base - h + 4, 18, 11);
  if(tall && flags){ g.fillStyle = '#5a4a3a'; g.fillRect(cx + 10, base - h - 34, 2, 28); flags.push([cx + 12, base - h - 34, .8]); }
}
function v64sGateW(g, cx, base, half, hgt, label){
  if(g !== ctx){ const hw = label ? Math.max(half + 14, 66) : half + 14; V48C.bb.push([cx - hw, base - hgt - 46, cx + hw, base + 4]); }
  const O = '#2b1a10', top = base - hgt;
  [cx - half - 4, cx + half - 4].forEach(px => { g.fillStyle = O; g.fillRect(px - 2, top - 2, 12, hgt + 2); g.fillStyle = '#9a6236'; g.fillRect(px, top, 8, hgt); g.fillStyle = '#c99560'; g.fillRect(px, top, 3, hgt); });
  g.fillStyle = O; g.fillRect(cx - half - 14, top - 14, half*2 + 28, 14); g.fillStyle = '#b34545'; g.fillRect(cx - half - 12, top - 12, half*2 + 24, 10); g.fillStyle = '#d96a5a'; g.fillRect(cx - half - 12, top - 12, half*2 + 24, 3);
  if(v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(cx - half - 12, top - 15, half*2 + 24, 4); }
  if(label) v64sBoard(g, cx, top - 46, label);
}
function v64sKeep(g, cx, base, kw, night, flags){
  const wT = Math.max(4, Math.round(kw*1.3/32)), x = cx - wT*16, H = 4*32 + 32; V48C.bb.push([x - 4, base - H - 50, x + wT*32 + 4, base + 6]);
  v64sHouse(g, 12, x, base - H, wT, 4, 1, [Math.floor(wT/2)]);
  if(v64sDong()){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x, base - H, wT*32, 40); g.globalCompositeOperation = 'source-over'; }
  const ry = base - H + 46, rr = 22; g.fillStyle = '#2b1a10'; g.beginPath(); g.arc(cx, ry, rr + 3, 0, 7); g.fill();   // đồng hồ Rubik 3×3
  for(let i = 0; i < 9; i++){ g.fillStyle = night ? ['#ffd27a', '#ffb347', '#ffe9a8'][i % 3] : V48C_RUBIK[(i*4 + 1) % 6]; g.fillRect(cx - 15 + (i % 3)*10, ry - 15 + Math.floor(i/3)*10, 9, 9); }
  g.fillStyle = '#5a4a3a'; g.fillRect(cx - 1.5, base - H - 40, 3, 40); flags.push([cx + 1.5, base - H - 40, 1.6]);
}
function v64sRoomsInit(){
  const zs0 = v46ZoneStatic; v46ZoneStatic = function(z){ V64S.zs = V64S.ok && !!V46SCHOOL[z.id]; try { return zs0(z); } finally { V64S.zs = false; } };
  const fl0 = floor; floor = function(r, a, b, size){ if(V64S.zs){ try { if(v64sFloor(r)) return; } catch(e){} } return fl0(r, a, b, size); };
  const wa0 = walls; walls = function(r, color){ if(V64S.zs){ try { if(v64sWalls(r)) return; } catch(e){} } return wa0(r, color); };
  // cây kiểu cũ trong sân các khu trường → cây NA cùng mùa
  const zp0 = v46ZonePass; v46ZonePass = function(z, VBn, dt){ V64S.zp = V64S.ok && !!V64S.zin[z.id]; try { return zp0(z, VBn, dt); } finally { V64S.zp = false; } };
  const tr0 = drawTree; drawTree = function(t, i){ if(V64S.zp){ try { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(t[0], t[1], 24, 8, 0, 0, 7); ctx.fill(); ctx.drawImage(v64sTreeSpr('tree', i || 0), t[0] - 32, t[1] - 60); return; } catch(e){} } return tr0(t, i); };
  const pi0 = drawPine; drawPine = function(x, y, i){ if(V64S.zp){ try { ctx.drawImage(v64sTreeSpr('pine', i || 0), x - 33, y - 96); return; } catch(e){} } return pi0(x, y, i); };
  if(typeof v48cTower === 'function'){
    const t0 = v48cTower; v48cTower = function(g, cx, base, tw, roof, night, tall, flags){ if(!V64S.ok) return t0.apply(this, arguments); v64sLantern(g, cx, base, tall, flags); };
    const m0 = v48cMerlons; v48cMerlons = function(g, x0, x1, y, skip){ if(!V64S.ok) return m0.apply(this, arguments); };
    const a0 = v48cArch; v48cArch = function(g, cx, base, half, hgt, label){ if(!V64S.ok) return a0.apply(this, arguments); v64sGateW(g, cx, base, half, hgt, label); };
    const k0 = v48cKeep; v48cKeep = function(g, cx, base, kw, night, flags){ if(!V64S.ok) return k0.apply(this, arguments); v64sKeep(g, cx, base, kw, night, flags); };
  }
}
