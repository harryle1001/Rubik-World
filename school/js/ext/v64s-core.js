// ================= v64s · 1/5 KHU TRƯỜNG NINJA ADVENTURE: ảnh, bố cục khuôn viên, va chạm =================
// Khu thử nghiệm đồ hoạ mới: dựng lại khu trường giữa đảo bằng tile Ninja Adventure (CC0) + cây Tiny Swords (CC0).
// Mọi tên toàn cục có tiền tố v64s / V64S. Gắn vào game bằng cách bọc hàm cũ; ngoài khu trường giữ nguyên đồ hoạ cũ.
// Toạ độ trong bảng = so với tâm đảo (tâm = quảng trường cổng trường). Khung [x, y, w, h], góc trái trên.
const V64S_PHI = 1.618033988749895;
const V64S_NA = 'assets/cc0/ninja-adventure/';
const V64S_SRC = {
  F:'Backgrounds/Tilesets/TilesetFloor.png', FD:'Backgrounds/Tilesets/TilesetFloorDetail.png', FI:'Backgrounds/Tilesets/Interior/TilesetInteriorFloor.png',
  H:'Backgrounds/Tilesets/TilesetHouse.png', N:'Backgrounds/Tilesets/TilesetNature.png', E:'Backgrounds/Tilesets/TilesetElement.png',
  W:'Backgrounds/Tilesets/TilesetWater.png', FL:'Backgrounds/Tilesets/TilesetField.png', FLAG:'Backgrounds/Animated/Flag/FlagRed16x16.png',
  TS:'../tiny-swords/Resources/Trees/Tree.png'
};
// học sinh: nhân vật hiền, không vũ khí; thầy cô v62k: mỗi người một nhân vật riêng
const V64S_KIDS = ['Boy', 'Child', 'EggBoy', 'EggGirl', 'Villager', 'Villager3', 'Villager4', 'Princess', 'Cavegirl', 'Hunter', 'FighterRed', 'Eskimo', 'Greenman', 'NinjaYellow', 'NinjaBlue', 'LionBoy', 'Monk2', 'Noble'];
const V64S_TEACH = {toan:'SorcererOrange', ly:'Master', hoa:'OldWoman', sinh:'Cavegirl2', su:'OldMan3', dia:'SorcererBlack', van:'OldMan', anh:'Woman', tin:'Inspector', nghe:'Villager2'};
// khuôn viên: hàng rào tròn bán kính R (bên trong vòng đường tỷ lệ vàng 4700/φ²), các công trình mới đặt ở bãi cỏ trống
const V64S_LAY = [
  {k:'lib',   x:-1150, y:-1230, w:320, h:160, n:'Thư viện', ic:'📚', b:{sty:12, roof:3, wall:2}},
  {k:'tea',   x:-1240, y:-560,  w:256, h:128, n:'Phòng giáo viên', ic:'🧑‍🏫', b:{sty:0, roof:3, wall:1}},
  {k:'med',   x:-960,  y:-560,  w:224, h:128, n:'Phòng y tế', ic:'🩺', b:{sty:4, roof:3, wall:1}},
  {k:'can',   x:620,   y:-390,  w:288, h:128, n:'Căn tin', ic:'🍱', b:{sty:8, roof:3, wall:1}},
  {k:'bike',  x:-760,  y:70,    w:256, h:96,  n:'Nhà xe đạp', ic:'🚲', b:{shed:1}},
  {k:'bball', x:600,   y:-210,  w:300, h:186, n:'Sân bóng rổ', ic:'🏀'},
  {k:'pond',  x:704,   y:420,   w:288, h:192, n:'Ao cá', ic:'🐟'},
  {k:'veg',   x:1080,  y:450,   w:230, h:142, n:'Vườn rau', ic:'🥬'},
  {k:'play',  x:1200,  y:-700,  w:330, h:204, n:'Khu vui chơi', ic:'🛝'},
  {k:'gard',  x:-1200, y:70,    w:360, h:222, n:'Vườn trường', ic:'🌷'},
  {k:'park',  x:-1180, y:316,   w:270, h:100, n:'Bãi đỗ xe', ic:'🅿️'},
  {k:'court', x:-330,  y:-560,  w:850, h:450, n:'Sân trường', ic:'🧱'}
];
const V64S_OLD = [[-440, -690], [280, -1420], [1500, -360], [-1320, 330], [320, 1000], [-1290, -1010], [-780, -760]];   // cây cổ thụ
const V64S = {ok:false, img:{}, ch:{}, pat:{}, spr:{}, n:0, need:0, R:1700, C:[0, 0], fac:[], props:[], lamps:[], fence:[], block:[], zin:{}, zs:false, tap:null, near:null, my:null, tk:0};
function v64sAbs(f){ return {x0:V46L.CX + f.x, y0:V46L.CY + f.y, x1:V46L.CX + f.x + f.w, y1:V46L.CY + f.y + f.h}; }
const v64sHit = (r, x, y, m) => x > r.x0 - (m || 0) && x < r.x1 + (m || 0) && y > r.y0 - (m || 0) && y < r.y1 + (m || 0);
const v64sOv = (a, b, m) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
function v64sHash(s){ let h = 2166136261; s = String(s); for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------- 1. ảnh: tải một lần ngay khi nạp file (song song với khởi động game), lỗi thì giữ đồ hoạ cũ ----------
function v64sLoad(){
  if(V64S.need) return; const keys = Object.keys(V64S_SRC); V64S.need = keys.length;
  keys.forEach(k => { const im = new Image(); im.decoding = 'async';
    im.onload = () => { V64S.img[k] = im; v64sDone(); }; im.onerror = () => { console.warn('v64s: không tải được', V64S_SRC[k]); v64sDone(); };
    im.src = V64S_NA + V64S_SRC[k]; });
}
function v64sDone(){
  if(++V64S.n < V64S.need) return;
  const core = ['F', 'FI', 'H', 'N', 'W', 'FL'].every(k => V64S.img[k]);
  V64S.loaded = core; if(core && V64S.inited) v64sStart();
}
function v64sChar(name){   // nhân vật: tải khi cần lần đầu
  let c = V64S.ch[name]; if(c) return c.ok ? c.im : null;
  c = V64S.ch[name] = {ok:false, im:new Image()}; c.im.onload = () => { c.ok = true; }; c.im.onerror = () => { c.bad = true; };
  c.im.src = V64S_NA + 'Actor/Characters/' + name + '/SpriteSheet.png'; return null;
}
// vẽ một mảnh tile: sheet, cột, hàng (ô 16px), rộng/cao theo ô, tỉ lệ s
function v64sT(g, k, c, r, x, y, w, h, s){
  const im = V64S.img[k]; if(!im) return; w = w || 1; h = h || 1; s = s || 2;
  g.drawImage(im, c*16, r*16, w*16, h*16, x, y, w*16*s, h*16*s);
}
// mảnh tự do theo pixel ảnh gốc
function v64sP(g, k, sx, sy, sw, sh, x, y, s, dw, dh){ const im = V64S.img[k]; if(!im) return; s = s || 2; g.drawImage(im, sx, sy, sw, sh, x, y, dw || sw*s, dh || sh*s); }
// mẫu lát nền (pattern) từ 1 ô, phóng s lần; gốc mẫu = gốc thế giới nên các ô nền nướng sẵn khớp nhau
function v64sPat(g, k, c, r, s){
  s = s || 2; const key = k + c + '_' + r + '_' + s; let cv = V64S.pat[key];
  if(!cv){ const im = V64S.img[k]; if(!im) return '#7cad4a'; cv = document.createElement('canvas'); cv.width = cv.height = 16*s; const q = cv.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(im, c*16, r*16, 16, 16, 0, 0, 16*s, 16*s); V64S.pat[key] = cv; }
  return g.createPattern(cv, 'repeat');
}

// ---------- 2. bố cục: công trình, cây cổ thụ, hàng cây + đèn ven đường, hàng rào ----------
function v64sInCampus(x, y, m){ return Math.hypot(x - V46L.CX, y - V46L.CY) < V64S.R + (m || 0); }
function v64sZoneIn(z){ const cx = (z.n.x0 + z.n.x1)/2, cy = (z.n.y0 + z.n.y1)/2; return V46SCHOOL[z.id] || v64sInCampus(cx, cy, -60); }
function v64sFree(r, m, skipFac){   // chỗ trống: không đè khu, hào, tháp, đường, công trình khác
  for(const z of V46.Z){ if(!z.flip && v64sOv(r, z.n, m)) return false; }
  for(const o of V64S.hard) if(v64sOv(r, o, m)) return false;
  if(!skipFac) for(const f of V64S.fac) if(v64sOv(r, f.r, m)) return false;
  for(const l of V46R.lines){ const mm = l.w/2 + m; for(let i = 1; i < l.P.length; i++){ const a = l.P[i - 1], b = l.P[i];
      if(Math.max(a[0], b[0]) < r.x0 - mm || Math.min(a[0], b[0]) > r.x1 + mm || Math.max(a[1], b[1]) < r.y0 - mm || Math.min(a[1], b[1]) > r.y1 + mm) continue;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d/10));
      for(let k = 0; k <= n; k++){ const x = a[0] + (b[0] - a[0])*k/n, y = a[1] + (b[1] - a[1])*k/n; if(x > r.x0 - mm && x < r.x1 + mm && y > r.y0 - mm && y < r.y1 + mm) return false; } } }
  return true;
}
function v64sRoadD(x, y){   // khoảng cách tới mép đường gần nhất
  let best = 1e9;
  for(const l of V46R.lines) for(let i = 1; i < l.P.length; i++){ const a = l.P[i - 1], b = l.P[i];
    if(Math.min(a[0], b[0]) > x + 200 || Math.max(a[0], b[0]) < x - 200 || Math.min(a[1], b[1]) > y + 200 || Math.max(a[1], b[1]) < y - 200) continue;
    const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx*vx + vy*vy || 1, t = Math.max(0, Math.min(1, ((x - a[0])*vx + (y - a[1])*vy)/L2));
    best = Math.min(best, Math.hypot(a[0] + vx*t - x, a[1] + vy*t - y) - l.w/2); }
  return best;
}
function v64sLayout(){
  const CX = V46L.CX, CY = V46L.CY; V64S.C = [CX, CY];
  // vùng cấm cứng: hào + vườn phép + tượng (v48c), tháp Rubik 81 (v53c), quảng trường cổng
  V64S.hard = [];
  try { const H = v48cHall(); if(H){ const o = H.out; V64S.hard.push({x0:o.x0 - 14, y0:o.y0 - 14, x1:o.x1 + 14, y1:o.y1 + 14}); const G = v48cGarden(H); V64S.hard.push({x0:G.x0 - 10, y0:G.y0 - 30, x1:G.x1 + 10, y1:G.y1 + 10}); const S = v48cStatueAt(H); V64S.hard.push({x0:S[0] - 60, y0:S[1] - 40, x1:S[0] + 60, y1:S[1] + 30}); } } catch(e){}
  try { if(typeof v53cGeo === 'function' && V46L.zones.tower81){ const G = v53cGeo('tower81'); V64S.hard.push({x0:G.x0 - 20, y0:G.y0 - G.th - 40, x1:G.x1 + 20, y1:G.y1 + 20}); } } catch(e){}
  V64S.plaza = {x0:CX - 320, y0:CY - 320, x1:CX + 320, y1:CY + 320};
  // công trình: bỏ qua cái nào bị người chơi dời khu khác đè lên (sắp xếp v48m)
  V64S.fac = []; V64S_LAY.forEach(f => { const r = v64sAbs(f); const it = {f, r, k:f.k};
    if(f.k !== 'court' && !v64sFree(r, 6, true)) { console.warn('v64s: bỏ', f.k, '(bị đè)'); return; } V64S.fac.push(it); });
  V64S.F = {}; V64S.fac.forEach(it => { V64S.F[it.k] = it; });
  V46.Z.forEach(z => { V64S.zin[z.id] = !z.flip && v64sZoneIn(z); });
  // cây cổ thụ
  const P = []; V64S_OLD.forEach(([x, y], i) => { const r = {x0:CX + x - 50, y0:CY + y - 20, x1:CX + x + 50, y1:CY + y + 12}; if(v64sFree(r, 10)) P.push({k:'old', x:CX + x, y:CY + y, i}); });
  // hàng cây + đèn ven đường trong khuôn viên: mỗi φ·150 px, xen kẽ hai bên
  const rnd = (s => () => (s = (s*16807) % 2147483647)/2147483647)(6401), lamps = [];
  V46R.lines.forEach((l, li) => { let acc = 75, side = 1;
    for(let i = 1; i < l.P.length; i++){ const a = l.P[i - 1], b = l.P[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if(d < 1) continue; acc += d;
      if(acc < 150*V64S_PHI) continue; acc = 0; side = -side; const nx = -(b[1] - a[1])/d, ny = (b[0] - a[0])/d, off = l.w/2 + 40, x = b[0] + nx*off*side, y = b[1] + ny*off*side;
      if(!v64sInCampus(x, y, -60) || Math.hypot(x - CX, y - CY) < 340) continue;
      const lamp = (li + i) % 2 === 0, r = {x0:x - (lamp ? 8 : 26), y0:y - 10, x1:x + (lamp ? 8 : 26), y1:y + 8};
      if(!v64sFree(r, 10) || v64sRoadD(x, y) < (lamp ? 12 : 26) || P.some(p => Math.abs(p.x - x) < 70 && Math.abs(p.y - y) < 50)) continue;
      if(lamp){ P.push({k:'lamp', x, y}); lamps.push([x, y]); } else P.push({k:rnd() < .7 ? 'tree' : 'pine', x, y, i:Math.floor(rnd()*99)}); } });
  // bồn hoa quanh quảng trường cổng (bán kính 300·φ/φ ≈ 340), tránh lối vào
  for(let i = 0; i < 16; i++){ const a = i/16*Math.PI*2 + .2, x = CX + Math.cos(a)*352, y = CY + Math.sin(a)*352; if(v64sRoadD(x, y) > 30 && v64sFree({x0:x - 30, y0:y - 16, x1:x + 30, y1:y + 16}, 4)) P.push({k:'bed', x, y, i}); }
  // ghế đá + đèn ở mép sân trường và quanh quảng trường
  for(let i = 0; i < 8; i++){ const a = i/8*Math.PI*2 + .39, x = CX + Math.cos(a)*400, y = CY + Math.sin(a)*400; if(v64sRoadD(x, y) > 34 && v64sFree({x0:x - 36, y0:y - 16, x1:x + 36, y1:y + 14}, 6)) P.push({k:i % 2 ? 'bench' : 'lamp', x, y}); }
  P.forEach(p => { if(p.k === 'lamp' && !lamps.some(q => q[0] === p.x && q[1] === p.y)) lamps.push([p.x, p.y]); });
  // đèn ở cửa các toà nhà
  V64S.fac.forEach(it => { if(it.f.b && !it.f.b.shed){ [it.r.x0 - 18, it.r.x1 + 18].forEach(x => { if(v64sRoadD(x, it.r.y1 + 4) > 14){ P.push({k:'lamp', x, y:it.r.y1 + 4}); lamps.push([x, it.r.y1 + 4]); } }); } });
  // vườn cây rải rác trên bãi cỏ trống: cụm 3–5 cây quanh một tâm (góc vàng 137.5°), xen bụi hoa
  const near = (x, y, d) => P.some(p => Math.abs(p.x - x) < d && Math.abs(p.y - y) < d*.7);
  for(let t = 0; t < 420; t++){ const a = rnd()*Math.PI*2, rr = Math.sqrt(rnd())*(V64S.R - 90), x0 = CX + Math.cos(a)*rr, y0 = CY + Math.sin(a)*rr;
    if(Math.hypot(x0 - CX, y0 - CY) < 420) continue; const n = 3 + Math.floor(rnd()*3);
    for(let i = 0; i < n; i++){ const b = i*2.39996 + a, d = i ? 46 + i*14 : 0, x = x0 + Math.cos(b)*d, y = y0 + Math.sin(b)*d*.7, k = i === 0 ? (rnd() < .5 ? 'tree' : 'pine') : rnd() < .55 ? 'bush' : rnd() < .6 ? 'tree' : 'pine', s = k === 'bush' ? 14 : 28;
      if(!v64sInCampus(x, y, -50) || near(x, y, k === 'bush' ? 34 : 64) || v64sRoadD(x, y) < s + 14 || !v64sFree({x0:x - s, y0:y - 10, x1:x + s, y1:y + 8}, 16)) continue;
      P.push({k, x, y, i:Math.floor(rnd()*99)}); } }
  P.sort((a, b) => a.y - b.y); V64S.props = P; V64S.lamps = lamps;
  // hàng rào: điểm trên vòng tròn R, bỏ chỗ có đường / khu / tháp
  const F = [], N = Math.round(2*Math.PI*V64S.R/32);
  for(let i = 0; i < N; i++){ const a = i/N*Math.PI*2, x = CX + Math.cos(a)*V64S.R, y = CY + Math.sin(a)*V64S.R;
    const ok = v64sRoadD(x, y) > 26 && !V46.Z.some(z => !z.flip && v64sHit(z.n, x, y, 26)) && !V64S.hard.some(o => v64sHit(o, x, y, 10)); F.push(ok ? [x, y, a] : null); }
  V64S.fence = F;
  // khối chặn (toạ độ đảo): toà nhà, ao, cột cổng, gốc cây cổ thụ
  const B = []; V64S.fac.forEach(it => { const r = it.r; if(it.f.b) B.push(it.f.b.shed ? {x0:r.x0, y0:r.y0 + 30, x1:r.x1, y1:r.y0 + 52} : {x0:r.x0 + 4, y0:r.y0 + 26, x1:r.x1 - 4, y1:r.y1}); if(it.k === 'pond') B.push({x0:r.x0 + 14, y0:r.y0 + 14, x1:r.x1 - 14, y1:r.y1 - 12}); });
  const G = v46Gate(); V64S.gate = G; B.push({x0:G[0] - 140, y0:G[1] - 20, x1:G[0] - 100, y1:G[1] + 2}, {x0:G[0] + 100, y0:G[1] - 20, x1:G[0] + 140, y1:G[1] + 2});
  P.forEach(p => { if(p.k === 'old') B.push({x0:p.x - 16, y0:p.y - 10, x1:p.x + 16, y1:p.y + 4}); });
  V64S.block = B;
}
function v64sTrim(){
  const CX = V46L.CX, CY = V46L.CY, R = V64S.R + 30;
  V46T.deco = V46T.deco.filter(t => t.k === 9 || Math.hypot(t.x - CX, t.y - CY) > R);
  V46T.lamps = (V46T.lamps || []).filter(([x, y]) => Math.hypot(x - CX, y - CY) > R).concat(V64S.lamps);
}
function v64sBlocked(x, y){ for(const b of V64S.block) if(x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return true; return false; }
function v64sFenceAt(x, y){   // chỉ chặn người chơi tự đi (không chặn NPC / tự đi đường vàng)
  const r = Math.hypot(x - V46L.CX, y - V46L.CY); if(Math.abs(r - V64S.R) > 7) return false;
  const a = Math.atan2(y - V46L.CY, x - V46L.CX), N = V64S.fence.length, i = Math.round(((a + Math.PI*2) % (Math.PI*2))/(Math.PI*2)*N) % N;
  return !!(V64S.fence[i] && V64S.fence[(i + 1) % N] && V64S.fence[(i + N - 1) % N]);
}

// ---------- 3. bật khu trường mới ----------
function v64sStart(){
  if(V64S.ok) return; V64S.ok = true;
  try { v64sLayout(); } catch(e){ console.warn('v64s layout', e); V64S.ok = false; return; }
  try { v64sTrim(); } catch(e){}   // bỏ cây/đèn cũ trong khuôn viên, thêm đèn mới
  V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; for(const k in V46ZC) delete V46ZC[k];
  try { V48C.cache = {}; } catch(e){}
  V64S.spr = {};
}
function v64sInit(){
  if(typeof V46 === 'undefined' || !V46.ready || /[?&]nov64s/.test(location.search)) return; V64S.inited = true;
  // cây/hoa/đèn cũ trong khuôn viên → bỏ (giữ biển chỉ đường); đèn mới vào danh sách đèn đêm v25
  const d0 = v46Deco; v46Deco = function(){ d0(); if(V64S.ok){ try { v64sLayout(); v64sTrim(); } catch(e){ console.warn('v64s deco', e); } } };
  // va chạm: toà nhà / ao / cột cổng chặn mọi người (trừ khi đang đứng sẵn trong đó → cho đi ra); hàng rào chỉ chặn người chơi tự đi
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){
    const r = cm0(ox, oy, nx, ny); if(!r || !V64S.ok || !V46.on || V46.sky) return r;
    try { const c = agents.find(a => a.controlled), zh = c && c.x === ox && c.y === oy ? c._z : null;
      const p = v46Raw(nx) ? [nx - V46E, ny] : v46ToNew(nx, ny, zh); if(!v64sInCampus(p[0], p[1], 40)) return r;
      if(v64sBlocked(p[0], p[1])){ const q = v46Raw(ox) ? [ox - V46E, oy] : v46ToNew(ox, oy, zh); if(!v64sBlocked(q[0], q[1])) return false; }
      if(c && c.x === ox && c.y === oy && !c.boat && !(typeof V32 !== 'undefined' && V32.nav) && Math.abs(nx - ox) < 40 && v64sFenceAt(p[0], p[1])) return false;
    } catch(e){}
    return r; };
  try { v64sRoomsInit(); } catch(e){ console.warn('v64s rooms', e); }
  try { v64sBuildInit(); } catch(e){ console.warn('v64s build', e); }
  try { v64sCharsInit(); } catch(e){ console.warn('v64s chars', e); }
  if(V64S.loaded) v64sStart();
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v64s = {V64S, v64sStart, v64sLayout};
}
v64sLoad();
