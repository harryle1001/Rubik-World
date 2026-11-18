// ================= v57p · MÁY BAY 1/2: SÂN BAY QUỐC TẾ RUBIK (4 đường băng, sân đỗ 12 ô, nhà ga, tháp, hangar, trực thăng, thủy phi cơ, máy bay NPC) =================
// Đặt ở dải đất liền phía tây (giữa đường vành đai v52w và bờ biển) — vùng trống, kiểm tra không đè khu nào bằng v57pOverlap().
// Mọi tên toàn cục có tiền tố v57p / V57P. Chỉ bọc (gán lại) hàm cũ.
const V57P_PHI = 1.618033988749895;
const V57P_ALTMAX = 6000;                        // trần bay mới (v51p cũ: 1100) — đủ cao để thấy cả hành tinh v56p
const V57P = {on:false, A:null, tiles:new Map(), lo:null, loKey:'', npc:[], tugs:[], view:'top', camT:-1, zW:new Map(), msgK:{}, spr:{}};
const V57P_LIV = ['#e8453c', '#2f7ad8', '#2fae66', '#f0a020', '#7b4fd0', '#13a3b5'];

// ---------- 1. bố cục (toạ độ thế giới, dời theo tâm đảo để chịu được đổi bản đồ) ----------
function v57pBuild(){
  const ox = V46L.CX - 12200, oy = V46L.CY - 12200, X = x => x + ox, Y = y => y + oy;
  const A = {ox, oy};
  // đường băng: [đầu 0] → [đầu 1], tên sơn ở mỗi đầu; dài/ngắn và hướng khác nhau
  A.rw = [
    {id:'R1', vi:'Đường băng dài', n:['18R', '36L'], x0:X(1850), y0:Y(9700),  x1:X(1850), y1:Y(14000), w:90},
    {id:'R2', vi:'Đường băng song song', n:['18L', '36R'], x0:X(3600), y0:Y(10300), x1:X(3600), y1:Y(13300), w:80},
    {id:'R3', vi:'Đường băng ngang', n:['09', '27'], x0:X(1900), y0:Y(9300),  x1:X(3700), y1:Y(9300),  w:70},
    {id:'R4', vi:'Đường băng ngắn', n:['07', '25'], x0:X(2300), y0:Y(13900), x1:X(3300), y1:Y(13450), w:60}
  ];
  A.rw.forEach(r => { r.len = Math.hypot(r.x1 - r.x0, r.y1 - r.y0); r.a = Math.atan2(r.y1 - r.y0, r.x1 - r.x0); r.cx = (r.x0 + r.x1)/2; r.cy = (r.y0 + r.y1)/2; });
  // đường lăn (đoạn thẳng, bề rộng)
  const T = A.tw = [], tw = (x0, y0, x1, y1, w) => T.push([X(x0), Y(y0), X(x1), Y(y1), w || 44]);
  tw(2050, 9420, 2050, 14000); tw(3400, 10300, 3400, 13300); tw(1950, 9420, 3700, 9420); tw(1950, 9300, 1950, 9420, 36); tw(3700, 9300, 3700, 9420, 36);
  for(const y of [9800, 10900, 12000, 13000, 13900]) tw(1850, y, 2050, y, 36);
  for(const y of [10400, 11300, 12300, 13200]) tw(3400, y, 3600, y, 36);
  tw(2050, 13650, 3400, 13650); tw(3400, 13300, 3400, 13650); tw(2050, 10900, 2130, 10900, 40); tw(2050, 12000, 2130, 12000, 40); tw(3320, 11300, 3400, 11300, 40); tw(3320, 12300, 3400, 12300, 40);
  // sân đỗ, nhà ga, ô đỗ có số (1–6 phía tây, 7–12 phía đông), ô 1 là ô của người chơi
  A.apron = [X(2120), Y(10600), X(3330), Y(12900)];
  A.term = [X(2560), Y(10700), X(2890), Y(12550)];
  A.stands = []; for(let i = 0; i < 6; i++){ const y = Y(10850 + i*300); A.stands.push({n:i + 1, x:X(2330), y, hdg:0}); }
  for(let i = 0; i < 6; i++){ const y = Y(10850 + i*300); A.stands.push({n:i + 7, x:X(3120), y, hdg:Math.PI}); }
  A.hangars = [[X(2200), Y(12960), 420, 290, 'HANGAR 1'], [X(2730), Y(12960), 420, 290, 'HANGAR 2']];
  A.tower = [X(2250), Y(10180)];
  A.heli = [[X(2620), Y(9900)], [X(2880), Y(9900)]];
  A.tanks = [[X(3160), Y(9880)], [X(3290), Y(9880)]];
  A.park = [X(2420), Y(10290), X(2880), Y(10560)];
  const ry = Y(10180), ringX = V46L.CX - Math.sqrt(Math.max(0, 7900*7900 - (ry - V46L.CY)**2)) - 52;   // dừng ngay mép đường vành đai
  A.road = [X(2880), ry, Math.max(X(3800), ringX), ry, 40];
  A.socks = [[X(1745), Y(11850)], [X(3705), Y(11850)]];
  // cầu tàu thủy phi cơ: dò từ đường băng R1 sang tây tới mặt nước
  const py = Y(11800); let cx = X(1750); for(let x = X(1750); x > X(-1200); x -= 20){ let s = 'land'; try { s = v51pSurface(x, py); } catch(e){} if(s === 'water'){ cx = x; break; } }
  A.dock = {x0:cx - 300, x1:X(1760), y:py, w:36, head:[cx - 300, py - 110, 60, 220], coast:cx};
  A.lane = cx - 650;
  // khung bao (kiểm tra đè khu, cache ảnh, mặt đất)
  A.bb = [Math.min(A.dock.x0 - 60, X(1700)), Y(9180), Math.max(A.road[2] + 10, X(3820)), Y(14480)];
  // đèn ban đêm: [x, y, loại] 0 trắng viền, 1 xanh ngưỡng, 2 đỏ cuối, 3 xanh dương đường lăn, 4 vàng tiếp cận, 5 đèn pha sân đỗ
  const L = A.lights = [];
  for(const r of A.rw){ const c = Math.cos(r.a), s = Math.sin(r.a), nx = -s, ny = c, h = r.w/2 + 7, st = Math.max(90, r.len/Math.round(r.len/110));
    for(let d = 0; d <= r.len + 1; d += st) for(const k of [-1, 1]) L.push([r.x0 + c*d + nx*h*k, r.y0 + s*d + ny*h*k, 0]);
    for(let k = -2; k <= 2; k++){ L.push([r.x0 - c*8 + nx*k*r.w/5, r.y0 - s*8 + ny*k*r.w/5, 1]); L.push([r.x1 + c*8 + nx*k*r.w/5, r.y1 + s*8 + ny*k*r.w/5, 2]); } }
  for(const t of T){ const l = Math.hypot(t[2] - t[0], t[3] - t[1]), n = Math.max(1, Math.round(l/160)), nx = -(t[3] - t[1])/l, ny = (t[2] - t[0])/l;
    for(let i = 0; i <= n; i++){ const x = t[0] + (t[2] - t[0])*i/n, y = t[1] + (t[3] - t[1])*i/n; L.push([x + nx*(t[4]/2 + 5), y + ny*(t[4]/2 + 5), 3]); L.push([x - nx*(t[4]/2 + 5), y - ny*(t[4]/2 + 5), 3]); } }
  A.appr = [];   // đèn tiếp cận phía nam R1, R2 (nháy chạy "con thỏ")
  for(const r of [A.rw[0], A.rw[1]]) for(let i = 1; i <= 8; i++){ const p = [r.x1, r.y1 + i*48]; A.appr.push(p); for(const k of [-1, 1]) L.push([p[0] + k*22, p[1], 4]); }
  for(let i = 0; i < 6; i++){ L.push([X(2150), Y(10700 + i*400), 5]); L.push([X(3300), Y(10700 + i*400), 5]); }
  A.rects = v57pRects(A);
  return A;
}
// các hình chữ nhật chiếm chỗ của sân bay (dùng kiểm tra đè khu + mặt đất máy bay)
function v57pRects(A){
  const R = [];
  for(const r of A.rw){ const h = r.w/2 + 30; R.push([Math.min(r.x0, r.x1) - h, Math.min(r.y0, r.y1) - h, Math.max(r.x0, r.x1) + h, Math.max(r.y0, r.y1) + h, r.id]); }
  for(const t of A.tw) R.push([Math.min(t[0], t[2]) - t[4]/2, Math.min(t[1], t[3]) - t[4]/2, Math.max(t[0], t[2]) + t[4]/2, Math.max(t[1], t[3]) + t[4]/2, 'tw']);
  R.push([A.apron[0], A.apron[1], A.apron[2], A.apron[3], 'apron'], [A.park[0], A.park[1], A.park[2], A.park[3], 'park'], [A.road[0], A.road[1] - 20, A.road[2], A.road[1] + 20, 'road']);
  R.push([A.tower[0] - 60, A.tower[1] - 60, A.tower[0] + 60, A.tower[1] + 60, 'tower']);
  for(const h of A.hangars) R.push([h[0], h[1], h[0] + h[2], h[1] + h[3], 'hangar']);
  for(const p of A.heli) R.push([p[0] - 70, p[1] - 70, p[0] + 70, p[1] + 70, 'heli']);
  for(const p of A.tanks) R.push([p[0] - 55, p[1] - 55, p[0] + 55, p[1] + 55, 'tank']);
  R.push([A.dock.x0, A.dock.y - 120, A.dock.x1, A.dock.y + 120, 'dock']);
  for(const p of A.appr) R.push([p[0] - 30, p[1] - 10, p[0] + 30, p[1] + 10, 'appr']);
  return R;
}
// điểm (x,y) nằm trên đường băng nào (cả đường băng chéo)
function v57pOnRunway(x, y, m){
  const A = V57P.A; if(!A || x < A.bb[0] || x > A.bb[2] || y < A.bb[1] || y > A.bb[3]) return null; m = m || 0;
  for(const r of A.rw){ const dx = x - r.x0, dy = y - r.y0, c = Math.cos(r.a), s = Math.sin(r.a), u = dx*c + dy*s, v = -dx*s + dy*c; if(u > -m && u < r.len + m && Math.abs(v) < r.w/2 + 4) return r; }
  return null;
}
function v57pInAp(x, y, m){ const A = V57P.A; m = m || 0; return !!A && x > A.bb[0] - m && x < A.bb[2] + m && y > A.bb[1] - m && y < A.bb[3] + m; }
function v57pNear(x, y){ const A = V57P.A; return !!A && x > A.bb[0] - 400 && x < A.bb[2] + 300 && y > A.bb[1] - 300 && y < A.bb[3] + 300; }
function v57pSolid(x, y){
  const A = V57P.A; if(!v57pInAp(x, y, 10)) return false; const t = A.term; if(x > t[0] && x < t[2] && y > t[1] && y < t[3]) return true;
  for(const h of A.hangars) if(x > h[0] && x < h[0] + h[2] && y > h[1] + 8 && y < h[1] + h[3]) return true;
  if(Math.abs(x - A.tower[0]) < 46 && Math.abs(y - A.tower[1]) < 46) return true;
  for(const p of A.tanks) if(Math.hypot(x - p[0], y - p[1]) < 48) return true; return false;
}

// ---------- 2. vẽ sân bay (một hàm, dùng cho ô cache chi tiết và ảnh nhỏ) ----------
function v57pCv(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function v57pPaint(g, lo){
  const A = V57P.A, F = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, seg = (t, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); g.stroke(); };
  g.lineCap = 'butt'; g.textAlign = 'center'; g.textBaseline = 'middle';
  // nền cỏ được cắt gọn quanh khu bay (dải cỏ sẫm dọc đường băng)
  for(const r of A.rw){ g.save(); g.translate(r.x0, r.y0); g.rotate(r.a); F('rgba(40,90,40,.16)', -60, -r.w/2 - 70, r.len + 120, r.w + 140); g.restore(); }
  // đường bộ + bãi đỗ xe
  seg(A.road, '#5b5f66', A.road[4]); if(!lo){ g.setLineDash([26, 22]); seg(A.road, '#f4f4f0', 3); g.setLineDash([]); }
  const pk = A.park; F('#5b5f66', pk[0], pk[1], pk[2] - pk[0], pk[3] - pk[1]); F('#5b5f66', pk[2] - 40, A.road[1], 40, pk[1] - A.road[1]);
  if(!lo){ for(let x = pk[0] + 10; x < pk[2] - 20; x += 46){ F('#e8e8e2', x, pk[1] + 8, 3, 70); F('#e8e8e2', x, pk[3] - 78, 3, 70); }
    const cars = ['#e8453c', '#2f7ad8', '#f4f6fb', '#2fae66', '#f0a020', '#3b3b46', '#c0c6d0']; for(let i = 0; i < 14; i++){ if((i*7) % 5 === 1) continue; const x = pk[0] + 18 + (i % 7)*46*1.4, y = i < 7 ? pk[1] + 22 : pk[3] - 64; F('rgba(0,0,0,.25)', x + 3, y + 3, 26, 44); F(cars[i % 7], x, y, 26, 44); F('rgba(140,200,255,.85)', x + 4, y + 8, 18, 9); } }
  // sân đỗ bê tông
  const ap = A.apron; F('#bcb6a8', ap[0], ap[1], ap[2] - ap[0], ap[3] - ap[1]);
  if(!lo){ g.fillStyle = 'rgba(0,0,0,.06)'; for(let x = ap[0]; x < ap[2]; x += 60) g.fillRect(x, ap[1], 2, ap[3] - ap[1]); for(let y = ap[1]; y < ap[3]; y += 60) g.fillRect(ap[0], y, ap[2] - ap[0], 2); }
  // đường lăn
  for(const t of A.tw) seg(t, '#8f8a80', t[4]); if(!lo) for(const t of A.tw) seg(t, '#f2c230', 3);
  if(!lo){ F('#f2c230', ap[0] + 68, ap[1] + 20, 3, ap[3] - ap[1] - 40); F('#f2c230', ap[2] - 70, ap[1] + 20, 3, ap[3] - ap[1] - 40); }
  // đường băng
  for(const r of A.rw){ g.save(); g.translate(r.x0, r.y0); g.rotate(r.a); const L = r.len, w = r.w;
    F('#34373e', -10, -w/2, L + 20, w); if(!lo){ F('#2a2c31', -10, -w/2, L + 20, 3); F('#2a2c31', -10, w/2 - 3, L + 20, 3);
      F('#f4f4f0', 6, -w/2 + 6, L - 12, 3); F('#f4f4f0', 6, w/2 - 9, L - 12, 3);
      for(let x = 230; x < L - 230; x += 80) F('#f4f4f0', x, -2, 44, 4);
      for(const [sx, dir] of [[8, 1], [L - 8, -1]]){ const n = Math.max(4, Math.floor((w - 20)/12)); for(let i = 0; i < n; i++) F('#f4f4f0', dir > 0 ? sx : sx - 46, -w/2 + 10 + i*(w - 20)/n, 46, (w - 20)/n - 5);
        for(let k = 0; k < 3; k++){ const x = dir > 0 ? sx + 260 + k*90 : sx - 260 - k*90 - 30; F('#f4f4f0', x, -w/2 + 12, 30, 7); F('#f4f4f0', x, w/2 - 19, 30, 7); }
        F('#f4f4f0', dir > 0 ? sx + 520 : sx - 600, -w/2 + 14, 80, 10); F('#f4f4f0', dir > 0 ? sx + 520 : sx - 600, w/2 - 24, 80, 10); }
      g.fillStyle = '#f4f4f0'; g.font = '800 ' + Math.round(w*.42) + 'px Nunito, sans-serif';
      g.save(); g.translate(120, 0); g.rotate(Math.PI/2); g.fillText(r.n[0], 0, 0); g.restore(); g.save(); g.translate(L - 120, 0); g.rotate(-Math.PI/2); g.fillText(r.n[1], 0, 0); g.restore(); }
    g.restore(); }
  // ô đỗ: vạch dẫn, khung, số; ô 1 = ô của bạn (vàng)
  if(!lo) for(const s of A.stands){ const d = s.hdg === 0 ? 1 : -1, mine = s.n === 1, col = mine ? '#ffcf3a' : '#f2c230';
    g.strokeStyle = col; g.lineWidth = mine ? 5 : 3; g.strokeRect(s.x - 95, s.y - 115, 190, 230); F(col, s.x - d*120 - (d > 0 ? 0 : 3), s.y - 1.5, d*120, 3); F(col, s.x + d*70 - 2, s.y - 40, 4, 80);
    g.fillStyle = mine ? '#ffcf3a' : '#ffffff'; g.font = '900 54px Nunito, sans-serif'; g.fillText(String(s.n), s.x - d*60, s.y - 72); if(mine){ g.font = '800 26px Nunito, sans-serif'; g.fillText('★ CỦA BẠN', s.x - d*20, s.y + 88); } }
  // nhà ga: mái kính, ống lồng (cầu dẫn khách) ra từng ô
  const t = A.term, tw = t[2] - t[0], th = t[3] - t[1];
  for(const s of A.stands){ const d = s.hdg === 0 ? 1 : -1, x0 = d > 0 ? s.x + 70 : t[2], w = d > 0 ? t[0] - s.x - 70 : s.x - 70 - t[2]; F('rgba(0,0,0,.2)', x0 + 6, s.y - 6, w, 22); F('#d7dbe2', x0, s.y - 12, w, 22); if(!lo) F('#9aa3b0', x0, s.y + 6, w, 4); }
  F('rgba(0,0,0,.22)', t[0] + 18, t[1] + 22, tw, th); F('#e3e6ec', t[0], t[1], tw, th); F('#c9ced8', t[0], t[1], tw, 12); F('#c9ced8', t[0], t[3] - 12, tw, 12);
  if(!lo){ for(let y = t[1] + 40; y < t[3] - 40; y += 70){ F('#7fb8e6', t[0] + 30, y, tw - 60, 34); F('#a9d4f5', t[0] + 30, y, tw - 60, 8); }
    F('#c9ced8', t[0] + tw/V57P_PHI - 3, t[1] + 12, 6, th - 24);
    g.save(); g.translate(t[0] + tw/2, t[1] + th/2); g.rotate(-Math.PI/2); F('rgba(29,53,87,.9)', -520, -44, 1040, 88); F('#f2d24a', -520, -44, 1040, 6);
    g.fillStyle = '#fff'; g.font = '900 52px Nunito, sans-serif'; g.fillText('✈ SÂN BAY QUỐC TẾ RUBIK', 0, 6); g.restore(); }
  // hangar mái vòm
  for(const h of A.hangars){ const [x, y, w, hh, n] = h; F('rgba(0,0,0,.2)', x + 14, y + 16, w, hh); F('#8b99a8', x, y, w, hh);
    if(!lo){ for(let i = 0; i < hh; i += 10) F(i % 20 ? '#9aa8b6' : '#7d8b9a', x, y + i, w, 5); F('#2d3440', x + 30, y, w - 60, 12); F('#f2d24a', x + 30, y + 12, w - 60, 3);
      g.fillStyle = '#fff'; g.font = '800 40px Nunito, sans-serif'; g.fillText(n, x + w/2, y + hh/2 + 10); } }
  // tháp điều khiển
  const [tx, ty] = A.tower; F('rgba(0,0,0,.25)', tx - 30, ty - 26, 90, 90); F('#d9d4c7', tx - 45, ty - 45, 90, 90); F('#bdb6a6', tx - 45, ty + 33, 90, 12);
  g.fillStyle = '#2b5f86'; g.beginPath(); for(let i = 0; i < 8; i++){ const a = i*Math.PI/4 + Math.PI/8; g.lineTo(tx + Math.cos(a)*40, ty + Math.sin(a)*40); } g.fill();
  g.fillStyle = '#8fd3ff'; g.beginPath(); for(let i = 0; i < 8; i++){ const a = i*Math.PI/4 + Math.PI/8; g.lineTo(tx + Math.cos(a)*30, ty + Math.sin(a)*30); } g.fill(); F('#e8e4da', tx - 13, ty - 13, 26, 26); F('#ef4b4b', tx - 3, ty - 3, 6, 6);
  // bãi đáp trực thăng
  for(const p of A.heli){ g.fillStyle = '#5b5f66'; g.beginPath(); g.arc(p[0], p[1], 64, 0, 7); g.fill(); g.strokeStyle = '#f2c230'; g.lineWidth = 6; g.beginPath(); g.arc(p[0], p[1], 52, 0, 7); g.stroke();
    if(!lo){ g.fillStyle = '#fff'; g.font = '900 62px Nunito, sans-serif'; g.fillText('H', p[0], p[1] + 3); } }
  // bồn nhiên liệu
  for(const p of A.tanks){ g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(p[0] + 10, p[1] + 10, 46, 0, 7); g.fill(); g.fillStyle = '#eef0f3'; g.beginPath(); g.arc(p[0], p[1], 46, 0, 7); g.fill(); g.fillStyle = '#c9ced8'; g.beginPath(); g.arc(p[0] + 6, p[1] + 6, 30, 0, 7); g.fill(); }
  // cầu tàu thủy phi cơ (ván gỗ)
  const D = A.dock; F('#8b5a2b', D.x0, D.y - D.w/2, D.x1 - D.x0, D.w); const hd = D.head; F('#8b5a2b', hd[0], hd[1], hd[2], hd[3]);
  if(!lo){ for(let x = D.x0; x < D.x1; x += 14) F('#6e4520', x, D.y - D.w/2, 2, D.w); for(let y = hd[1]; y < hd[1] + hd[3]; y += 14) F('#6e4520', hd[0], y, hd[2], 2); for(const y of [hd[1] + 30, hd[1] + hd[3] - 30]) F('#3b3b46', hd[0] - 6, y - 4, 8, 8); }
}
// ô cache chi tiết (tỉ lệ 1/2, ô 1024px = 2048 đơn vị), tối đa 6 ô; ảnh nhỏ cho lúc nhìn xa và bản đồ toàn cảnh
const V57P_TS = 1024, V57P_SC = .5;
function v57pTile(i, j){
  const k = i + ',' + j; let t = V57P.tiles.get(k); if(t){ t.u = realT; return t.c; }
  if(V57P.tiles.size >= 6){ let o = null; for(const [kk, v] of V57P.tiles) if(!o || v.u < o[1].u) o = [kk, v]; V57P.tiles.delete(o[0]); }
  const [c, g] = v57pCv(V57P_TS, V57P_TS), A = V57P.A, wx = A.bb[0] + i*V57P_TS/V57P_SC, wy = A.bb[1] + j*V57P_TS/V57P_SC;
  g.setTransform(V57P_SC, 0, 0, V57P_SC, -wx*V57P_SC, -wy*V57P_SC); try { v57pPaint(g, false); } catch(e){ console.warn('v57p tile', e); }
  V57P.tiles.set(k, {c, u:realT}); return c;
}
function v57pLo(){
  if(V57P.lo) return V57P.lo; const A = V57P.A, s = .17, [c, g] = v57pCv(Math.ceil((A.bb[2] - A.bb[0])*s), Math.ceil((A.bb[3] - A.bb[1])*s));
  g.setTransform(s, 0, 0, s, -A.bb[0]*s, -A.bb[1]*s); try { v57pPaint(g, true); } catch(e){ console.warn('v57p lo', e); } V57P.lo = c; V57P.loS = s; return c;
}
function v57pDrawGround(VBn){
  const A = V57P.A; if(!A || A.bb[0] > VBn.x1 || A.bb[2] < VBn.x0 || A.bb[1] > VBn.y1 || A.bb[3] < VBn.y0) return;
  if(cam.z < .24){ const lo = v57pLo(); ctx.drawImage(lo, A.bb[0], A.bb[1], lo.width/V57P.loS, lo.height/V57P.loS); return; }
  const S0 = V57P_TS/V57P_SC, i0 = Math.max(0, Math.floor((VBn.x0 - A.bb[0])/S0)), i1 = Math.floor((Math.min(VBn.x1, A.bb[2]) - A.bb[0])/S0), j0 = Math.max(0, Math.floor((VBn.y0 - A.bb[1])/S0)), j1 = Math.floor((Math.min(VBn.y1, A.bb[3]) - A.bb[1])/S0);
  for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const tx = A.bb[0] + i*S0, ty = A.bb[1] + j*S0, x0 = Math.max(tx, VBn.x0), y0 = Math.max(ty, VBn.y0), x1 = Math.min(tx + S0, VBn.x1, A.bb[2]), y1 = Math.min(ty + S0, VBn.y1, A.bb[3]);
    if(x1 <= x0 || y1 <= y0) continue; const sx = Math.floor((x0 - tx)*V57P_SC), sy = Math.floor((y0 - ty)*V57P_SC), sw = Math.min(V57P_TS - sx, Math.ceil((x1 - tx)*V57P_SC) - sx + 1), sh = Math.min(V57P_TS - sy, Math.ceil((y1 - ty)*V57P_SC) - sy + 1);
    ctx.drawImage(v57pTile(i, j), sx, sy, sw, sh, tx + sx/V57P_SC, ty + sy/V57P_SC, sw/V57P_SC, sh/V57P_SC); }   // chỉ phần đang thấy
}

// ---------- 3. máy bay NPC: đường bay khép kín [x, y, cao, tốc độ, chờ] ----------
function v57pArc(L, cx, cy, r, a0, a1, alt0, alt1, sp, n){ for(let i = 1; i <= n; i++){ const k = i/n, a = a0 + (a1 - a0)*k; L.push([cx + Math.cos(a)*r, cy + Math.sin(a)*r, alt0 + (alt1 - alt0)*k, sp, 0]); } }
function v57pPath(nodes){
  const S = []; let T = 0;
  for(let i = 0; i < nodes.length; i++){ const a = nodes[i], b = nodes[(i + 1) % nodes.length], len = Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] - a[2])*1.4), v0 = Math.max(4, a[3]), v1 = Math.max(4, b[3]), dur = len/((v0 + v1)/2);
    S.push({a, b, len, v0, v1, w:a[4] || 0, dur, t0:T, h:Math.atan2(b[1] - a[1], b[0] - a[0]), mv:Math.hypot(b[0] - a[0], b[1] - a[1]) > 1}); T += (a[4] || 0) + dur; }
  return {S, T};
}
function v57pAt(path, t, o){
  t = ((t % path.T) + path.T) % path.T; const S = path.S; let s = S[0]; for(let i = 0; i < S.length; i++){ if(t >= S[i].t0) s = S[i]; else break; }
  let tau = t - s.t0 - s.w; if(tau < 0) tau = 0; const T = s.dur, f = T > 0 ? Math.min(1, (s.v0*tau + (s.v1 - s.v0)*tau*tau/(2*T))/Math.max(1e-6, s.len)) : 1;
  o.x = s.a[0] + (s.b[0] - s.a[0])*f; o.y = s.a[1] + (s.b[1] - s.a[1])*f; o.alt = s.a[2] + (s.b[2] - s.a[2])*f; o.spd = tau > 0 ? s.v0 + (s.v1 - s.v0)*tau/Math.max(1e-6, T) : 0;
  if(s.mv){ let d = s.h - o.hdg; d = Math.atan2(Math.sin(d), Math.cos(d)); o.hdg += d*Math.min(1, (o.dt || .016)*3.2); }
  o.bank = 0; return o;
}
function v57pNpcBuild(){
  const A = V57P.A, X = x => x + A.ox, Y = y => y + A.oy, N = V57P.npc = [];
  // vòng 1: cất cánh R1 hướng bắc → vòng ra biển → hạ cánh R2 hướng bắc → lăn về
  const c1 = [[X(2050), Y(13760), 0, 30, 10], [X(1850), Y(13950), 0, 12, 5], [X(1850), Y(12300), 0, 220, 0], [X(1850), Y(11000), 50, 260, 0], [X(1850), Y(9000), 280, 300, 0], [X(1850), Y(8000), 380, 300, 0]];
  v57pArc(c1, X(850), Y(8000), 1000, 0, -Math.PI, 420, 620, 310, 8); c1.push([X(-150), Y(15500), 650, 300, 0]);
  v57pArc(c1, X(1725), Y(15500), 1875, Math.PI, 0, 620, 260, 270, 9);
  c1.push([X(3600), Y(14300), 110, 200, 0], [X(3600), Y(13250), 0, 160, 0], [X(3600), Y(11450), 0, 40, 0], [X(3400), Y(11300), 0, 28, 0], [X(3400), Y(13300), 0, 40, 0], [X(3400), Y(13650), 0, 30, 0], [X(2050), Y(13650), 0, 36, 0]);
  const p1 = v57pPath(c1);
  // vòng 2: R3 cất cánh hướng tây, vòng lượn phía bắc, hạ cánh R3 từ phía đông
  const c2 = [[X(3650), Y(9420), 0, 26, 9], [X(3700), Y(9330), 0, 10, 0], [X(3660), Y(9300), 0, 8, 3], [X(2700), Y(9300), 0, 170, 0], [X(1950), Y(9300), 40, 210, 0], [X(900), Y(9300), 220, 240, 0]];
  v57pArc(c2, X(900), Y(8300), 1000, Math.PI/2, Math.PI*1.5, 240, 430, 240, 8); c2.push([X(5200), Y(7300), 450, 250, 0]);
  v57pArc(c2, X(5200), Y(8300), 1000, -Math.PI/2, Math.PI/2, 430, 220, 230, 8);
  c2.push([X(4400), Y(9300), 80, 180, 0], [X(3550), Y(9300), 0, 140, 0], [X(2350), Y(9300), 0, 34, 0], [X(2120), Y(9420), 0, 24, 0]);
  const p2 = v57pPath(c2);
  // trực thăng: bãi H → bay vòng quanh sân bay → về bãi
  const hp = A.heli[0], c3 = [[hp[0], hp[1], 0, 20, 22], [hp[0], hp[1], 220, 40, 0]];
  v57pArc(c3, X(2700), Y(11400), 1500, -Math.PI/2, Math.PI*1.5, 260, 260, 90, 14); c3.push([hp[0], hp[1], 220, 30, 2]);
  const p3 = v57pPath(c3);
  // thủy phi cơ: cầu tàu → lướt nước → cất cánh → vòng ra biển → đáp nước → về cầu tàu
  const dk = A.dock, lx = A.lane, c4 = [[dk.x0 - 40, dk.y, 0, 10, 18], [lx, dk.y - 300, 0, 40, 0], [lx, Y(10400), 0, 170, 0], [lx, Y(9500), 60, 220, 0]];
  v57pArc(c4, lx - 1300, Y(9500), 1300, 0, -Math.PI, 260, 380, 230, 7); c4.push([lx - 2600, Y(13200), 380, 230, 0]);
  v57pArc(c4, lx - 1300, Y(13200), 1300, Math.PI, 0, 360, 60, 210, 7); c4.push([lx, Y(12700), 0, 120, 0], [lx, dk.y + 200, 0, 30, 0]);
  const p4 = v57pPath(c4);
  const add = (path, off, kind, liv, sc) => N.push({path, off, kind, liv, sc, x:0, y:0, alt:0, hdg:-Math.PI/2, spd:0, bank:0});
  add(p1, 0, 'jet', 1, 1.55); add(p1, p1.T/2, 'jet', 0, 1.55); add(p2, 0, 'sport', 0, 1.25); add(p2, p2.T*.5, 'trainer', 0, 1.25); add(p3, 0, 'heli', 0, 1.3); add(p4, 0, 'seaplane', 0, 1.3);
  // xe kéo + toa hành lý chạy vòng quanh sân đỗ; xe bồn nhiên liệu
  const ap = A.apron, lp = v57pPath([[ap[0] + 40, ap[1] + 30, 0, 70, 0], [ap[2] - 40, ap[1] + 30, 0, 70, 0], [ap[2] - 40, ap[3] - 40, 0, 70, 0], [ap[0] + 40, ap[3] - 40, 0, 70, 0]]);
  const lp2 = v57pPath([[ap[0] + 100, ap[3] - 90, 0, 55, 6], [ap[0] + 100, ap[1] + 90, 0, 55, 0], [ap[2] - 100, ap[1] + 90, 0, 55, 6], [ap[2] - 100, ap[3] - 90, 0, 55, 0]]);
  V57P.tugs = [{path:lp, off:0, k:'tug', n:3, x:0, y:0, hdg:0}, {path:lp, off:lp.T/2, k:'tug', n:2, x:0, y:0, hdg:0}, {path:lp2, off:0, k:'fuel', n:0, x:0, y:0, hdg:0}];
  // máy bay đậu: ô 2–12 (bỏ trống vài ô để thấy vạch số)
  const kinds = ['jet', 'jet', 'sport', 'jet', 'biplane', 'jet', 'trainer', 'jet', 'banner', 'jet', 'jet', 'sport'];
  V57P.parked = A.stands.filter(s => s.n !== 1 && s.n !== 4 && s.n !== 9).map((s, i) => ({s, kind:kinds[s.n - 1], liv:(s.n*3) % V57P_LIV.length, sc:kinds[s.n - 1] === 'jet' ? 1.55 : 1.3}));
}
function v57pNpcTick(dt){
  const t = realT; for(const n of V57P.npc){ n.dt = dt; const h0 = n.hdg; v57pAt(n.path, t + n.off, n); let d = n.hdg - h0; d = Math.atan2(Math.sin(d), Math.cos(d)); n.bank += (Math.max(-1, Math.min(1, d/Math.max(.001, dt)*.9)) - n.bank)*Math.min(1, dt*3); n.spin = (n.spin || 0) + dt*30; }
  for(const v of V57P.tugs){ v.dt = dt; v57pAt(v.path, t + v.off, v); }
}

// ---------- 4. sprite máy bay phản lực chở khách nhìn từ trên (mũi sang phải), xe kéo ----------
function v57pJet(liv, shadow){
  const k = 'jet' + liv + (shadow ? 's' : ''); if(V57P.spr[k]) return V57P.spr[k]; const [c, g] = v57pCv(128, 128), col = shadow ? '#000' : null, L = V57P_LIV[liv % V57P_LIV.length];
  const P = (pts, cl) => { g.fillStyle = col || cl; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  P([[72, 58], [50, 8], [38, 8], [52, 58]], '#d9dee6'); P([[72, 70], [50, 120], [38, 120], [52, 70]], '#d9dee6');
  if(!shadow){ P([[50, 8], [38, 8], [40, 14], [51, 14]], L); P([[50, 120], [38, 120], [40, 114], [51, 114]], L); }
  P([[24, 59], [12, 38], [5, 38], [12, 59]], '#d9dee6'); P([[24, 69], [12, 90], [5, 90], [12, 69]], '#d9dee6');
  g.fillStyle = col || '#f4f6fb'; g.beginPath(); g.moveTo(8, 59); g.lineTo(112, 58); g.quadraticCurveTo(124, 64, 112, 70); g.lineTo(8, 69); g.closePath(); g.fill();
  if(!shadow){ g.fillStyle = L; g.fillRect(10, 62, 100, 3); g.fillStyle = '#c9ced8'; g.fillRect(8, 67, 104, 2); g.fillStyle = '#1d2a44'; g.fillRect(110, 60, 5, 8);
    g.fillStyle = '#5a6272'; g.fillRect(56, 32, 16, 7); g.fillRect(56, 89, 16, 7); g.fillStyle = L; g.fillRect(4, 62, 22, 4); }
  V57P.spr[k] = c; return c;
}
function v57pDrawJet(n, x, y, hdg, sc, shadow){ const img = v57pJet(n.liv || 0, shadow); ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(hdg); ctx.scale(sc, sc*(1 - Math.abs(n.bank || 0)*.25)); ctx.drawImage(img, -64, -64); ctx.restore(); }
function v57pDrawPlane(n, x, y, hdg, sc, shadow){ if(n.kind === 'jet') v57pDrawJet(n, x, y, hdg, sc, shadow); else v51pDrawCraft({kind:n.kind}, x, y, hdg, n.bank || 0, sc, shadow ? 0 : (n.spin || 0) + 1, shadow); }
function v57pDrawTug(v){
  ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.hdg);
  if(v.k === 'fuel'){ ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-36, -9, 76, 24); ctx.fillStyle = '#e8453c'; ctx.fillRect(16, -11, 22, 22); ctx.fillStyle = '#eef0f3'; ctx.fillRect(-40, -12, 54, 24); ctx.fillStyle = '#8fd3ff'; ctx.fillRect(30, -8, 6, 16); }
  else { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-10, -6, 30, 18); ctx.fillStyle = '#f2c230'; ctx.fillRect(-12, -9, 28, 18); ctx.fillStyle = '#3b3b46'; ctx.fillRect(2, -7, 9, 14); ctx.fillStyle = '#ff8a1a'; ctx.fillRect(-4, -2, 4, 4); }
  ctx.restore();
  // toa hành lý bám theo đường đi
  for(let i = 1; i <= v.n; i++){ const o = v57pAt(v.path, realT + v.off - i*.62, {x:0, y:0, alt:0, hdg:v.hdg, dt:1}); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.hdg); ctx.fillStyle = '#6a7684'; ctx.fillRect(-12, -9, 24, 18); ctx.fillStyle = ['#2f7ad8', '#e8453c', '#2fae66'][i % 3]; ctx.fillRect(-9, -7, 18, 14); ctx.restore(); }
}

// ---------- 5. lớp vẽ động (sau lớp ánh sáng): máy bay đậu/lăn/bay, xe kéo, ống gió, đèn đêm ----------
function v57pDrawLive(VBn, dark){
  const A = V57P.A; if(!A) return; const vis = (x, y, m) => x > VBn.x0 - m && x < VBn.x1 + m && y > VBn.y0 - m && y < VBn.y1 + m;
  const inView = !(A.bb[0] - 3000 > VBn.x1 || A.bb[2] + 3000 < VBn.x0 || A.bb[1] - 3000 > VBn.y1 || A.bb[3] + 3000 < VBn.y0);
  if(inView){
    // máy bay đậu + máy bay của người chơi ở ô số 1 (khi không lái)
    for(const p of V57P.parked){ if(!vis(p.s.x, p.s.y, 200)) continue; ctx.globalAlpha = .28; v57pDrawPlane(p, p.s.x + 8, p.s.y + 10, p.s.hdg, p.sc, true); ctx.globalAlpha = 1; v57pDrawPlane(p, p.s.x, p.s.y, p.s.hdg, p.sc, false); }
    const s1 = A.stands[0]; if(!V51P.on && vis(s1.x, s1.y, 200)){ const pl = v51pPlane(v51pState().sel); ctx.globalAlpha = .28; v51pDrawCraft(pl, s1.x + 8, s1.y + 10, 0, 0, 1.45, 0, true); ctx.globalAlpha = 1; v51pDrawCraft(pl, s1.x, s1.y, 0, 0, 1.45, 0, false); }
    for(const v of V57P.tugs) if(vis(v.x, v.y, 300)) v57pDrawTug(v);
    // ống gió
    const W = (typeof WEATHERS !== 'undefined' && WEATHERS[weather]) ? WEATHERS[weather].wind : 0, ang = V51P.windA ? V51P.windA*6.283 : .6, len = 18 + Math.min(1, .25 + W)*40;
    for(const s of A.socks){ if(!vis(s[0], s[1], 80)) continue; ctx.fillStyle = '#6b6b74'; ctx.fillRect(s[0] - 3, s[1] - 50, 6, 50); ctx.save(); ctx.translate(s[0], s[1] - 50); ctx.rotate(ang + Math.sin(realT*3)*.12);
      for(let i = 0; i < 4; i++){ ctx.fillStyle = i % 2 ? '#fff' : '#ff6a1a'; ctx.fillRect(i*len/4, -8 + i*1.2, len/4 + 1, 16 - i*2.4); } ctx.restore(); }
  }
  // máy bay NPC đang lăn / bay (có thể ra xa sân bay)
  for(const n of V57P.npc){ const py = n.y - n.alt*.22; if(!vis(n.x, py, 300 + n.alt)) continue; const sc = n.sc*(1 + n.alt/650);
    ctx.globalAlpha = Math.max(.1, .3 - n.alt/2600); v57pDrawPlane(n, n.x + n.alt*.18, n.y + n.alt*.05, n.hdg, n.sc*(1 - Math.min(.3, n.alt/3000)), true); ctx.globalAlpha = 1;
    v57pDrawPlane(n, n.x, py, n.hdg, sc, false);
    if(dark > .05){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, .4 + dark); const c = Math.cos(n.hdg), s = Math.sin(n.hdg), w = 40*sc, q = 16*sc*.6;
      ctx.drawImage(v51pGlow('rgba(255,60,50,1)'), n.x + s*w - q/2, py - c*w - q/2, q, q); ctx.drawImage(v51pGlow('rgba(60,255,110,1)'), n.x - s*w - q/2, py + c*w - q/2, q, q);
      if((realT*1.1 + n.off) % 1 < .1) ctx.drawImage(v51pGlow('rgba(255,255,255,1)'), n.x - q, py - q, q*2, q*2); ctx.restore(); } }
  // đèn đường băng / đường lăn / tiếp cận ban đêm
  if(inView && dark > .05){
    const k = Math.min(1, dark*2.2), G = [v51pGlow('rgba(255,240,190,1)'), v51pGlow('rgba(80,255,120,1)'), v51pGlow('rgba(255,70,60,1)'), v51pGlow('rgba(90,150,255,1)'), v51pGlow('rgba(255,200,90,1)'), v51pGlow('rgba(255,250,220,1)')];
    const step = cam.z < .3 ? 3 : cam.z < .55 ? 2 : 1, sz = Math.max(14, 7/cam.z); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
    const L = A.lights; for(let i = 0; i < L.length; i += step){ const l = L[i]; if(!vis(l[0], l[1], 30)) continue; const s = l[2] === 5 ? sz*5 : l[2] === 3 ? sz*.8 : sz; ctx.drawImage(G[l[2]], l[0] - s/2, l[1] - s/2, s, s); }
    const seq = Math.floor(realT*10) % 8; for(let r = 0; r < 2; r++){ const p = A.appr[r*8 + 7 - seq]; if(p) ctx.drawImage(G[0], p[0] - sz*1.6, p[1] - sz*1.6, sz*3.2, sz*3.2); }
    const [tx, ty] = A.tower; ctx.drawImage(v51pGlow('rgba(120,200,255,1)'), tx - 60, ty - 60, 120, 120); if(Math.sin(realT*2.4) > .5) ctx.drawImage(G[1], tx - 22, ty - 22, 44, 44);
    const t = A.term; for(let y = t[1] + 40; y < t[3] - 40; y += 140) ctx.drawImage(G[5], t[0] + 20, y - 30, t[2] - t[0] - 40, 60);
    ctx.restore();
  }
  // nhãn sân bay khi nhìn gần
  if(inView && cam.z >= .3 && !V51P.on){ const x = A.term[0] + (A.term[2] - A.term[0])/2, y = A.apron[1] - 40, fs = 17/Math.max(.7, cam.z);
    if(vis(x, y, 200)){ ctx.font = '800 ' + fs.toFixed(1) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const s = '✈️ Sân bay Quốc tế Rubik', tw = ctx.measureText(s).width + fs; ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(x - tw/2, y - fs*.8, tw, fs*1.6); ctx.fillStyle = '#ffe9a8'; ctx.fillText(s, x, y); } }
}

// ---------- 6. kiểm tra đè khu (QA): trả về danh sách khu bị sân bay đè ----------
function v57pOverlap(){
  const A = V57P.A, R = A.rects, hit = [], box = (x0, y0, x1, y1, n) => { for(const r of R) if(x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1]){ hit.push(n + '×' + r[4]); return; } };
  try { V46.Z.forEach(z => box(z.n.x0, z.n.y0, z.n.x1, z.n.y1, 'zone:' + z.id)); } catch(e){}
  try { const g = v51tGeo(); box(g.x0, g.y0, g.x1, g.y1, 'v51t'); } catch(e){}
  try { for(const k in V53C.geo){ const g = V53C.geo[k]; if(g && g.x0 != null) box(g.x0, g.y0, g.x1, g.y1, 'v53c:' + k); } } catch(e){}
  if(typeof V52W !== 'undefined' && V52W.on){
    (V52W.blocks || []).forEach(b => box(b.x0, b.y0, b.x1, b.y1, 'block:' + b.k)); (V52W.fields || []).forEach(b => box(b.x0, b.y0, b.x1, b.y1, 'field'));
    (V52W.houses || []).forEach(h => box(h.x - 90, h.y - 120, h.x + 90, h.y + 20, 'house')); (V52W.tents || []).forEach(h => box(h.x - 60, h.y - 40, h.x + 60, h.y + 40, 'tent'));
    (V52W.hills || []).forEach(h => box(h.x - h.rx, h.y - h.ry, h.x + h.rx, h.y + h.ry, 'hill')); (V52W.mills || []).forEach(h => box(h.x - 60, h.y - 60, h.x + 60, h.y + 60, 'mill'));
    (V52W.flowers || []).forEach(f => box(f.x, f.y, f.x + (f.w || 60), f.y + (f.h || 60), 'flowers')); (V52W.places || []).forEach(p => box(p.x - 120, p.y - 120, p.x + 120, p.y + 120, 'place:' + p.name));
    (V52W.lines || []).forEach(l => { const hw = (l.w || 30)/2 + 6; for(const p of l.P){ if(!v57pInAp(p[0], p[1], hw)) continue; const n = hit.length; box(p[0] - hw, p[1] - hw, p[0] + hw, p[1] + hw, 'road:' + (l.name || 'lane')); if(hit.length > n) break; } });
    if(V52W.river) for(const p of V52W.river){ const n = hit.length; box(p[0] - 60, p[1] - 60, p[0] + 60, p[1] + 60, 'river'); if(hit.length > n) break; }
  }
  if(typeof V55S !== 'undefined') (V55S.isl || []).forEach(s => box(s.x - s.r, s.y - s.r, s.x + s.r, s.y + s.r, 'isl:' + s.k));
  try { const C = v51pC(), O = V51P_AP; box(C[0] + O.rx0, C[1] + 4690, C[0] + O.rx1, C[1] + 5040, 'v51p-airport-cu'); } catch(e){}
  // mọi phần đường băng / sân đỗ phải nằm trên đất liền (không lấn biển, trừ cầu tàu)
  let wet = 0; for(const r of R){ if(r[4] === 'dock') continue; for(const [x, y] of [[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]], [(r[0] + r[2])/2, (r[1] + r[3])/2]]){ let s = 'land'; try { s = v51pSurface(x, y); } catch(e){} if(s === 'water'){ wet++; hit.push('water×' + r[4]); break; } } }
  return hit;
}
// cây / đèn trang trí của đất liền v52w nằm trên sân bay → dọn đi (dựng lại ô cache)
function v57pTrim(){
  const A = V57P.A; if(!A || typeof V52W === 'undefined' || !V52W.on) return; const inR = (x, y) => A.rects.some(r => x > r[0] - 40 && x < r[2] + 40 && y > r[1] - 40 && y < r[3] + 40) || (x > A.apron[0] - 80 && x < A.apron[2] + 80 && y > A.apron[1] - 80 && y < A.hangars[0][1] + 360);
  if(Array.isArray(V52W.deco)){ const n0 = V52W.deco.length; V52W.deco = V52W.deco.filter(t => !inR(t.x, t.y)); if(V52W.deco.length !== n0){ V52W.buck.clear(); V52W.deco.forEach(t => { const k = Math.floor(t.x/1024) + ',' + Math.floor(t.y/1024); if(!V52W.buck.has(k)) V52W.buck.set(k, []); V52W.buck.get(k).push(t); }); } }
  if(Array.isArray(V52W.lamps)){ const keep = V52W.lamps.filter(([x, y]) => !inR(x, y)); if(keep.length !== V52W.lamps.length){ const bad = new Set(V52W.lamps.filter(l => !keep.includes(l))); V52W.lamps = keep; if(V46T.lamps) V46T.lamps = V46T.lamps.filter(l => !bad.has(l)); } }
  V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; try { if(typeof V46RC !== 'undefined') V46RC.clear(); } catch(e){}
}
