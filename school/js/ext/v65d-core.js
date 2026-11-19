// ================= v65d · 1/3 KHU PHỐ & NHÀ KIỂU NINJA ADVENTURE: lõi (nền nướng sẵn, sprite toà nhà, xếp lớp theo y) =================
// 6 khu: Phố nhà Đà Lạt, Khu nhà học sinh, Phố mua sắm, Phố nhà người chơi, Quảng trường lễ hội, Nhà game 2 người.
// Chỉ đổi hình: vị trí khu, cửa vào, chỗ chạm, mini game, dữ liệu nhà người chơi giữ nguyên. Dùng lại hàm vẽ v64s (v64sT, v64sP, v64sPat, v64sHouse…).
// Mọi tên toàn cục có tiền tố v65d / V65D. Tắt bằng ?nov65d.
const V65D_Z = ['dalat', 'houses', 'shopst', 'pstreet', 'plaza', 'hall2p'];
const V65D = {on:false, zs:{}, B:{}, spr:{}, cz:null, built:false};
const V65D_O = '#2b1a10', V65D_K = '#2b2430';   // viền nâu gỗ, viền đen tím (giống v64s)
const v65dK = () => Math.min(2, Math.max(1, window.devicePixelRatio || 1));

// ---------- 1. nhà NA có tỷ lệ s (v64sHouse cố định s = 2): mái trái/giữa/phải × trên/giữa/dưới, lặp phần giữa ----------
function v65dHouse(g, sty, x, y, wT, rT, wlT, doors, s){
  s = s || 2; const t = 16*s, bx = sty*16, P = (sx, sy, sw, sh, dx, dy) => v64sP(g, 'H', bx + sx, sy, sw, sh, dx, dy, s);
  const Wpx = wT*t, nMid = Math.max(0, Math.round((rT*16 - 24)/8)), mCols = Math.max(0, wT - 3), rows = [[0, 12]];
  for(let i = 0; i < nMid; i++) rows.push([12, 8]); rows.push([20, 12]);
  let yy = y; rows.forEach(([sy, sh]) => { P(0, sy, 24, sh, x, yy); for(let i = 0; i < mCols; i++) P(24, sy, 16, sh, x + 24*s + i*t, yy); P(40, sy, 24, sh, x + Wpx - 24*s, yy); yy += sh*s; });
  const wallY = yy;
  for(let r = 0; r < wlT; r++){ const low = r === wlT - 1; P(0, 32, 16, 16, x, yy); for(let i = 1; i < wT - 1; i++) P(low && doors.includes(i) ? 16 : 32, 32, 16, 16, x + i*t, yy); P(48, 32, 16, 16, x + Wpx - t, yy); yy += t; }
  return {wallY, h:yy - y, w:Wpx};
}
// tuyết trên mái (lớp phủ trắng chỉ trên phần đã vẽ)
function v65dSnow(g, x, y, w, h){ if(!v64sDong()) return; g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.82)'; g.fillRect(x, y, w, h*.55); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x, y + h*.55, w, 5); g.restore(); }
// nhuộm một vùng đã vẽ (mái xanh Địa Trung Hải, mái đá Nhật…)
function v65dTint(g, x, y, w, h, col){ g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(x, y, w, h); g.restore(); }
// cả một nhà vẽ sẵn trong tileset (cắt nguyên khối), tỷ lệ s
const V65D_WHOLE = {shop:[256, 0, 48, 48], market:[304, 0, 64, 48], round:[368, 0, 48, 48], wood:[416, 0, 48, 48], cabin:[464, 0, 64, 48], tall:[416, 224, 48, 80]};
function v65dWhole(g, k, x, y, s){ const q = V65D_WHOLE[k]; v64sP(g, 'H', q[0], q[1], q[2], q[3], x, y, s); return {w:q[2]*s, h:q[3]*s}; }
// mái hiên sọc (cửa hàng, quầy chợ)
function v65dAwning(g, x, y, w, col, h){
  h = h || 14; const n = Math.max(3, Math.round(w/16)), sw = w/n;
  g.fillStyle = V65D_K; g.fillRect(x - 2, y - 2, w + 4, h + 4);
  for(let i = 0; i < n; i++){ g.fillStyle = i % 2 ? '#fff6e0' : col; g.fillRect(Math.round(x + i*sw), y, Math.ceil(sw), h); g.beginPath(); g.arc(x + (i + .5)*sw, y + h, sw/2, 0, Math.PI); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, y, w, 3);
}
// cờ phướn NA (7 màu) trên cột gỗ
function v65dBanner(g, x, base, i){
  g.fillStyle = V65D_O; g.fillRect(x - 3, base - 92, 6, 92); g.fillStyle = '#9a6236'; g.fillRect(x - 1, base - 90, 2, 88); g.fillStyle = '#ffd23f'; g.fillRect(x - 4, base - 96, 8, 6);
  v64sP(g, 'H', 352 + (i % 7)*16, 320, 16, 32, x + 3, base - 88, 2);
}
// dây cờ đuôi nheo giữa hai điểm
function v65dBunting(g, x0, y0, x1, y1, sag){
  const cols = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#b06bff'], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)/26));
  const P = u => [x0 + (x1 - x0)*u, y0 + (y1 - y0)*u + Math.sin(u*Math.PI)*sag];
  g.strokeStyle = V65D_K; g.lineWidth = 2; g.beginPath(); for(let i = 0; i <= 20; i++){ const p = P(i/20); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
  for(let i = 0; i < n; i++){ const p = P((i + .5)/n); g.fillStyle = V65D_K; g.beginPath(); g.moveTo(p[0] - 8, p[1] - 1); g.lineTo(p[0] + 8, p[1] - 1); g.lineTo(p[0], p[1] + 14); g.fill();
    g.fillStyle = cols[i % 6]; g.beginPath(); g.moveTo(p[0] - 6, p[1]); g.lineTo(p[0] + 6, p[1]); g.lineTo(p[0], p[1] + 11); g.fill(); }
}
// quầy chợ NA: bàn gỗ, mái hiên sọc, rổ nông sản (tile TilesetHouse)
function v65dStall(g, cx, base, col, v){
  const w = 104, x = Math.round(cx - w/2), y = Math.round(base);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 4, y - 4, w - 8, 8);
  g.fillStyle = V65D_O; g.fillRect(x + 6, y - 78, 6, 76); g.fillRect(x + w - 12, y - 78, 6, 76); g.fillStyle = '#9a6236'; g.fillRect(x + 8, y - 76, 2, 72); g.fillRect(x + w - 10, y - 76, 2, 72);
  g.fillStyle = V65D_O; g.fillRect(x, y - 38, w, 36); g.fillStyle = '#b97a45'; g.fillRect(x + 2, y - 36, w - 4, 32); g.fillStyle = '#d99a5c'; g.fillRect(x + 2, y - 36, w - 4, 5);
  g.fillStyle = 'rgba(60,30,10,.35)'; for(let k = 1; k < 4; k++) g.fillRect(x + 2 + k*(w - 4)/4, y - 30, 2, 26);
  const goods = [[256, 208], [272, 208], [288, 208], [304, 224], [320, 224], [304, 240], [320, 240]];
  for(let k = 0; k < 4; k++){ const q = goods[(v + k*2) % goods.length]; v64sP(g, 'H', q[0], q[1], 16, 16, x + 6 + k*24, y - 58, 1.5); }
  v65dAwning(g, x - 6, y - 92, w + 12, col, 16);
  if(v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(x - 6, y - 95, w + 12, 4); }
}
// sprite canvas nhỏ (cache theo khoá), toạ độ trong canvas = toạ độ đơn vị thế giới
function v65dCv(key, w, h, draw){
  let c = V65D.spr[key]; if(c) return c; const k = v65dK(); c = document.createElement('canvas'); c.width = Math.ceil(w*k); c.height = Math.ceil(h*k);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(k, k); try { draw(g); } catch(e){ console.warn('v65d spr', key, e); }
  V65D.spr[key] = c; return c;
}

// ---------- 2. toà nhà tĩnh: {x, y, w, h (khung vẽ, toạ độ đảo), base (chân, để xếp lớp), draw(g)} ----------
function v65dBld(b){ const key = b.id + '|' + season; let c = b._c; if(c && b._k === key) return c; b._k = key; return (b._c = v65dCv(key + '|' + (V65D.gen || 0), b.w, b.h, g => b.draw(g))); }
function v65dPutB(g, b){ g.drawImage(v65dBld(b), b.x, b.y, b.w, b.h); }

// ---------- 3. nền: vẽ vào ô nền nướng sẵn của đảo (bọc v46Paint lúc nạp, sau v64s) ----------
function v65dGrass(g, n, lod){
  const dong = v64sDong(); g.fillStyle = lod < 2 ? v64sPat(g, 'FL', 1, dong ? 13 : 4, 2) : (dong ? '#f4f6f8' : '#a9c25a'); g.fillRect(n.x0, n.y0, n.x1 - n.x0, n.y1 - n.y0);
  if(lod) return; const sx = Math.floor(n.x0/64), sy = Math.floor(n.y0/64);
  for(let j = sy; j*64 < n.y1; j++) for(let i = sx; i*64 < n.x1; i++){ const hh = v64sHash(i*7919 + j*104729 + 77) % 97, x = i*64 + (hh % 5)*9, y = j*64 + (hh % 7)*7;
    if(hh < 9) v64sT(g, 'FD', hh % 4, dong ? 3 : 2, x, y, 1, 1, 2);
    else if(hh < 12 && !dong) v64sT(g, 'FD', v64sThu() ? hh % 2 : v64sXuan() ? 3 : 4 + hh % 2, v64sThu() || v64sXuan() ? 0 : 2, x, y, 1, 1, 2); }
}
// lối đá lát (dải ngang/dọc) viền nâu
function v65dPave(g, x, y, w, h, lod, pat){
  g.fillStyle = '#4a3428'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  const p = pat || ['FI', 1, 13]; g.fillStyle = lod < 2 ? v64sPat(g, p[0], p[1], p[2], 2) : '#e8c27a'; g.fillRect(x, y, w, h);
  if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x, y, w, h); }
}
function v65dPaint(g, x0, y0, w, h, lod){
  if(!V65D.on) return; const x1 = x0 + w, y1 = y0 + h;
  for(const id of V65D_Z){ const z = V46.ZI[id]; if(!z) continue; const n = z.n; if(n.x1 < x0 - 40 || n.x0 > x1 + 40 || n.y1 < y0 - 40 || n.y0 > y1 + 40) continue;
    g.save(); g.imageSmoothingEnabled = false; v65dClip(g, z);
    try { v64sRound(g, n.x0 + 6, n.y0 + 6, n.x1 - n.x0 - 12, n.y1 - n.y0 - 12, 40); g.clip(); v65dGrass(g, n, lod);
      const f = V65D_GROUND[id]; if(f) f(g, z, lod);
      for(const b of (V65D.B[id] || [])){ if(b.dyn || b.x > x1 || b.x + b.w < x0 || b.y > y1 || b.y + b.h < y0) continue; v65dPutB(g, b); }
      g.restore(); g.save(); v65dClip(g, z); g.strokeStyle = 'rgba(58,92,40,.55)'; g.lineWidth = 4; v64sRound(g, n.x0 + 8, n.y0 + 8, n.x1 - n.x0 - 16, n.y1 - n.y0 - 16, 38); g.stroke();
    } catch(e){ console.warn('v65d paint', id, e); }
    g.restore(); }
}
const V65D_GROUND = {};
// vùng vẽ của khu = khung mới z.n trừ khung các khu khác chồng lên (không theo 'lỗ' toạ độ cũ → mái nhà sát mép không bị cắt)
function v65dClip(g, z){ const n = z.n; g.beginPath(); g.rect(n.x0, n.y0, n.x1 - n.x0, n.y1 - n.y0);
  for(const q of V46.Z){ if(q === z) continue; const r = q.flip ? q.n : q.nr; if(r.x1 > n.x0 && r.x0 < n.x1 && r.y1 > n.y0 && r.y0 < n.y1) g.rect(Math.max(r.x0, n.x0), Math.max(r.y0, n.y0), Math.min(r.x1, n.x1) - Math.max(r.x0, n.x0), Math.min(r.y1, n.y1) - Math.max(r.y0, n.y0)); }
  g.clip('evenodd'); }
const v65dPaint0 = v46Paint;
v46Paint = function(g, x0, y0, w, h, lod){ v65dPaint0(g, x0, y0, w, h, lod); try { v65dPaint(g, x0, y0, w, h, lod); } catch(e){ console.warn('v65d paint', e); } };

// ---------- 4. trong lượt vẽ khu: chèn toà nhà vào danh sách sprite (xếp theo y với người) ----------
function v65dSprites(z, sp){
  const L = V65D.B[z.id]; if(!L) return; const dx = z.d[0], dy = z.d[1], vb = VB;
  let P = null; try { if(PLAYER && PLAYER.visible && PLAYER._z === z.id) P = v46Pos(PLAYER); } catch(e){}
  for(const b of L){ const ox = b.x - dx, oy = b.y - dy; if(ox > vb.x1 || ox + b.w < vb.x0 || oy > vb.y1 + 40 || oy + b.h < vb.y0 - 40) continue;
    sp.push({y:b.base - dy, f:() => { const behind = P && P[0] > b.x + 8 && P[0] < b.x + b.w - 8 && P[1] < b.base - 6 && P[1] > b.y + 16;
      if(behind) ctx.globalAlpha = .5; try { if(b.live) b.live(ctx, -dx, -dy); else ctx.drawImage(v65dBld(b), ox, oy, b.w, b.h); } finally { ctx.globalAlpha = 1; } }}); }
}

// ---------- 5. bật ----------
function v65dBuild(){
  V65D.B = {}; V65D.spr = {}; V65D.gen = (V65D.gen || 0) + 1;
  for(const id of V65D_Z){ const z = V46.ZI[id], f = V65D_LAY[id]; if(!z || !f) continue; try { V65D.B[id] = f(z) || []; } catch(e){ console.warn('v65d layout', id, e); V65D.B[id] = []; } }
  V65D.built = true;
}
const V65D_LAY = {};
function v65dStart(){
  if(V65D.on || !V64S.loaded) return; V65D.on = true;
  try { v65dBuild(); } catch(e){ console.warn('v65d build', e); V65D.on = false; return; }
  V65D_Z.forEach(id => { V65D.zs[id] = 1; if(V64S.zin) V64S.zin[id] = true; });   // nhân vật + cây NA trong các khu
  V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; for(const k in V46ZC) delete V46ZC[k];
}
function v65dInit(){
  if(typeof V46 === 'undefined' || !V46.ready || typeof V64S === 'undefined' || /[?&]nov65d/.test(location.search)) return;
  // khu của v65d: bỏ góc bo/hàng rào hoa cũ (v20Soft) — nền mới đã có viền
  const zs0 = v46ZoneStatic; v46ZoneStatic = function(z){ if(V65D.on && V65D.zs[z.id]) return; return zs0(z); };
  const zp0 = v46ZonePass; v46ZonePass = function(z, VBn, dt){ V65D.cz = V65D.on && V65D.zs[z.id] ? z : null; try { return zp0(z, VBn, dt); } finally { V65D.cz = null; } };
  const es0 = extSprites; extSprites = function(sp){ const r = es0(sp); if(V65D.cz){ try { v65dSprites(V65D.cz, sp); } catch(e){ console.warn('v65d sp', e); } } return r; };
  // nhân vật NA cả trên đường ngay sát các khu (người chơi đi vào/ra khu không đổi hình đột ngột)
  const h0 = v64sHere; v64sHere = function(a){ if(h0(a)) return true; if(!V65D.on || !V46.on || V46.sky) return false;
    try { const p = V64S.rawP || (v46Raw(a.x) ? [a.x - V46E, a.y] : null); if(!p) return false;
      for(const id of V65D_Z){ const n = V46.ZI[id].n; if(p[0] > n.x0 - 80 && p[0] < n.x1 + 80 && p[1] > n.y0 - 80 && p[1] < n.y1 + 100) return true; } } catch(e){} return false; };
  // cây rừng cũ lọt vào lề khu (bị cắt nửa) → bỏ, khu đã có cây NA riêng
  const tr0 = drawTree; drawTree = function(t, i){ if(V65D.cz) return; return tr0(t, i); };
  const pi0 = drawPine; drawPine = function(x, y, i){ if(V65D.cz) return; return pi0(x, y, i); };
  const lay0 = v64sLayout; v64sLayout = function(){ lay0(); if(V65D.on) V65D_Z.forEach(id => { V64S.zin[id] = true; }); };
  try { v65dStreetInit(); } catch(e){ console.warn('v65d street', e); }
  try { v65dPlazaInit(); } catch(e){ console.warn('v65d plaza', e); }
  if(V64S.loaded) v65dStart(); else { let k = 0; const iv = setInterval(() => { if(V64S.loaded || ++k > 120){ clearInterval(iv); if(V64S.loaded) v65dStart(); } }, 250); }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v65d = {V65D, v65dBuild, v65dStart};
}
