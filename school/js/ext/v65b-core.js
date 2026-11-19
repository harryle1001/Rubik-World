// ================= v65b · 1/3 KHU THỂ THAO NINJA ADVENTURE: cấu hình, móc vào game =================
// Đổi đồ hoạ 10 khu thể thao (sân vận động, hồ bơi, bắn cung, thể dục dụng cụ, bóng rổ, trượt ván, patin, trượt tuyết, kart, đấu trường)
// sang kiểu Ninja Adventure như khu trường v64s. CHỈ đổi hình: vị trí khu, cửa vào, va chạm, mini game, nút bấm giữ nguyên.
// Nền = vẽ vào ô nền nướng sẵn (bọc v46Paint) · công trình có chiều cao = sprite cache, xếp lớp theo y cùng người trong khu.
// Mọi toạ độ trong v65b-*.js là toạ độ CŨ của khu (R[id]); khi vẽ đã dời sang đảo bằng z.d.
const V65B_IDS = ['stadium', 'pool', 'archery', 'gym', 'basket', 'skate', 'patin', 'ski', 'kart', 'arena'];
const V65B_O = '#2b2430', V65B_WO = '#2b1a10';   // viền đen NA, viền gỗ
const V65B = {inited:false, cur:null, zs:null, spr:{}, pat:{}, S:{}, ID:{}};
V65B_IDS.forEach(id => { V65B.ID[id] = 1; });
const v65bOn = () => V65B.inited && typeof V64S !== 'undefined' && V64S.ok;
const v65bDong = () => season === 'dong';
function v65bH(i, j){ return v64sHash(i*7919 + j*104729); }
// mẫu lát tự vẽ (ô s×s), cache theo khoá; gốc mẫu = gốc toạ độ đang vẽ
function v65bPat(g, key, s, fn){
  let c = V65B.pat[key]; if(!c){ c = document.createElement('canvas'); c.width = c.height = s; const q = c.getContext('2d'); q.imageSmoothingEnabled = false; try { fn(q, s); } catch(e){} V65B.pat[key] = c; }
  return g.createPattern(c, 'repeat');
}
// cỏ NA theo mùa (giống khuôn viên v64s)
function v65bGrass(g, lod){ const d = v65bDong(); return lod < 2 ? v64sPat(g, 'FL', 1, d ? 13 : 4, 2) : (d ? '#f4f6f8' : '#a9c25a'); }
function v65bRR(g, x, y, w, h, r){ v64sRound(g, x, y, w, h, r); }
function v65bBox(g, x, y, w, h, fill, o){ g.fillStyle = o || V65B_O; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = fill; g.fillRect(x, y, w, h); }
function v65bEll(g, cx, cy, rx, ry, fill){ g.fillStyle = fill; g.beginPath(); g.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, 7); g.fill(); }
// búi cỏ / hoa / lá rải trên cỏ (chỉ khi nhìn gần), như khuôn viên
function v65bTufts(g, x0, y0, x1, y1){
  const dong = v65bDong(), sx = Math.floor(x0/64), sy = Math.floor(y0/64);
  for(let j = sy; j*64 < y1; j++) for(let i = sx; i*64 < x1; i++){ const hh = v65bH(i, j) % 97, x = i*64 + (hh % 5)*9, y = j*64 + (hh % 7)*7;
    if(hh < 9) v64sT(g, 'FD', hh % 4, dong ? 3 : 2, x, y, 1, 1, 2);
    else if(hh < 12 && !dong) v64sT(g, 'FD', v64sThu() ? hh % 2 : v64sXuan() ? 3 : 4 + hh % 2, v64sThu() || v64sXuan() ? 0 : 2, x, y, 1, 1, 2); }
}
// nền chung của một khu: thảm cỏ NA bo góc phủ cả vùng cắt (che nền cũ + hàng rào bo góc v20)
function v65bPlot(g, z, lod, fill){
  const e = z.e, w = e.x1 - e.x0, h = e.y1 - e.y0;
  v65bRR(g, e.x0, e.y0, w, h, 28); g.fillStyle = '#4a3428'; g.fill();
  v65bRR(g, e.x0 + 3, e.y0 + 3, w - 6, h - 6, 25); g.fillStyle = fill || v65bGrass(g, lod); g.fill();
  if(lod === 0 && !fill){ g.save(); g.clip(); v65bTufts(g, e.x0, e.y0, e.x1, e.y1); g.restore(); }
}

// ---------- sprite công trình: cache theo mùa, mật độ ×k cho màn hình nét ----------
function v65bSprCv(s){
  const key = s.k + '|' + season; let c = V65B.spr[s.k]; if(c && c.key === key) return c;
  const k = Math.min(2, Math.max(1, window.devicePixelRatio || 1)), cv = document.createElement('canvas'); cv.width = Math.ceil(s.w*k); cv.height = Math.ceil(s.h*k);
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(k, k);
  try { s.draw(g, s.w, s.h); } catch(e){ console.warn('v65b spr', s.k, e); }
  c = V65B.spr[s.k] = {cv, key}; return c;
}
function v65bSprDraw(s){
  if(s.live){ s.live(ctx); return; }
  const c = v65bSprCv(s); ctx.drawImage(c.cv, s.x, s.y, s.w, s.h);
}
const v65bSprVis = s => !(s.x + s.w < VB.x0 || s.x > VB.x1 || s.y + s.h < VB.y0 || s.y > VB.y1);
function v65bSprList(id){ if(!V65B.S[id]){ try { V65B.S[id] = (V65B_SPR[id] ? V65B_SPR[id](R[id]) : []); } catch(e){ console.warn('v65b list', id, e); V65B.S[id] = []; } } return V65B.S[id]; }

// ---------- 2. móc vào game ----------
// nền: bọc v46Paint lúc nạp file (sau v64s) → vẽ đè ô nền của 10 khu
const v65bPaint0 = v46Paint;
v46Paint = function(g, x0, y0, w, h, lod){
  v65bPaint0(g, x0, y0, w, h, lod); if(!v65bOn()) return;
  const x1 = x0 + w, y1 = y0 + h;
  for(const id of V65B_IDS){ const z = V46.ZI[id], f = V65B_G[id]; if(!z || !f || !R[id]) continue; const n = z.n;
    if(n.x1 < x0 || n.x0 > x1 || n.y1 < y0 || n.y0 > y1) continue;
    g.save(); g.imageSmoothingEnabled = false; v46ClipZone(g, z, 0); g.translate(z.d[0], z.d[1]);
    try { f(g, R[id], z, lod); } catch(e){ console.warn('v65b paint', id, e); }
    g.restore(); }
};
function v65bInit(){
  if(typeof V46 === 'undefined' || !V46.ready || typeof V64S === 'undefined' || /[?&]nov65b/.test(location.search)) return;
  // ô cache tĩnh của khu: bỏ góc bo + hàng rào cỏ cũ (v20) ở 10 khu
  const zs0 = v46ZoneStatic; v46ZoneStatic = function(z){ V65B.zs = v65bOn() && V65B.ID[z.id] ? z.id : null; try { return zs0(z); } finally { V65B.zs = null; } };
  const so0 = v20Soft; v20Soft = function(){ if(V65B.zs) return; return so0.apply(this, arguments); };
  // công trình: chen vào danh sách sprite của khu (xếp theo y với người, vận động viên giả, xe kart…)
  const zc0 = v46ZoneContent; v46ZoneContent = function(z, dt, withLife){
    const on = v65bOn() && V65B.ID[z.id], prev = V65B.cur; V65B.cur = on ? z.id : null;
    try { return zc0(z, dt, withLife); } finally { V65B.cur = prev;
      if(on && (!withLife || cam.z < .3)){ try { v65bSprList(z.id).filter(v65bSprVis).sort((a, b) => a.base - b.base).forEach(v65bSprDraw); } catch(e){} } } };
  const es0 = extSprites; extSprites = function(sp){ es0(sp); const id = V65B.cur; if(!id) return;
    for(const s of v65bSprList(id)) if(v65bSprVis(s)) sp.push({y:s.base, f:() => v65bSprDraw(s)}); };
  // cây kiểu cũ trong khu → cây NA (dùng cờ v64s)
  const zp0 = v46ZonePass; v46ZonePass = function(z, VBn, dt){ const on = v65bOn() && V65B.ID[z.id], k = V64S.zp; if(on) V64S.zp = true; try { return zp0(z, VBn, dt); } finally { if(on) V64S.zp = k; } };
  // người trong 10 khu: nhân vật NA như khu trường
  if(typeof v64sHere === 'function'){ const h0 = v64sHere; v64sHere = function(a){ if(h0(a)) return true; if(!v65bOn() || !V46.on || V46.sky || V64S.rawP) return false;
    try { if(v46Raw(a.x)) return false; const z = (a._z && V46.ZI[a._z]) || v46ZoneOld(a.x, a.y); return !!(z && V65B.ID[z.id]); } catch(e){ return false; } }; }
  // khoá Level: bảng gỗ NA, chữ Nunito ≥16px
  const dl0 = drawLocks; drawLocks = function(){
    if(!v65bOn()) return dl0(); const all = LOCKS, mine = all.filter(z => V65B_IDS.some(id => R[id] === z.r));
    LOCKS = all.filter(z => !mine.includes(z)); try { dl0(); } finally { LOCKS = all; }
    mine.forEach(z => { if(PROF && PROF.level >= z.lvl) return; const r = z.r; if(r.x > VB.x1 || r.x + r.w < VB.x0 || r.y > VB.y1 || r.y + r.h < VB.y0) return;
      ctx.save(); ctx.strokeStyle = 'rgba(255,210,63,.9)'; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -realT*20; ctx.lineWidth = 3; ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.restore();
      ctx.fillStyle = 'rgba(10,15,34,.14)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      v64sBoard(ctx, r.x + r.w/2, r.y + Math.min(r.h/2, 120) - 15, '🔒 Cần Level ' + z.lvl); }); };
  // đèn ấm ban đêm: đèn sân, cửa nhà thi đấu, quán gỗ trượt tuyết
  const vc = v25Collect; v25Collect = function(dk){ vc(dk); if(!v65bOn() || !V46.on || V46.sky) return; const on = v25Ramp(clock, 1080, 330); if(on <= 0) return;
    V46.raw = true; try { V65B_IDS.forEach(id => { const z = V46.ZI[id]; if(!z) return; v65bSprList(id).forEach(s => { if(s.light) s.light.forEach(([x, y, rr]) => v25Push(x + z.d[0], y + z.d[1], rr, on*.9, 2)); }); }); } catch(e){} finally { V46.raw = false; } };
  V65B.inited = true;
  if(V64S.ok){ V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v65b = {V65B};
}
