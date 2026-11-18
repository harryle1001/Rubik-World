// ================= v47 · WORLD FIX: mép khu sạch, phố người chơi đông vui, biển mở quanh đảo, đường vào phòng =================
// Mọi tên toàn cục ở đây có tiền tố v47w. Gắn vào v46 bằng cách bọc hàm (không sửa file cũ ngoài v46/).
const V47W = {pc:{}, key:'', band:null, stalls:null, ped:null};
const V47W_FEATHER = 55;   // school yard margin kept around buildings, faded over its outer 61.8%
const V47W_BIG = {sail:1, navy:1, pirate2:1, cargo:1, tour:1, fish:1};   // tàu lớn: chạy vòng quanh đảo ngoài khơi

// ---------- 1. nền khu: bỏ màu cỏ cũ (để cỏ mới của đảo lộ ra) + bỏ dải đường cũ ở lề khu ----------
function v47wPatch(z){
  const k = season + '|' + (groundCache ? 1 : 0) + (northCache ? 1 : 0); if(V47W.key !== k){ V47W.key = k; V47W.pc = {}; }
  let c = V47W.pc[z.id]; if(c) return c;
  const e = z.e, w = Math.ceil(e.x1 - e.x0), h = Math.ceil(e.y1 - e.y0); c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', {willReadFrequently:true});
  const src = (cv, sy0, sy1, oy) => { if(!cv) return; const ya = Math.max(e.y0, sy0), yb = Math.min(e.y1, sy1), xa = Math.max(0, e.x0), xb = Math.min(W, e.x1); if(yb <= ya || xb <= xa) return; g.drawImage(cv, xa, ya - oy, xb - xa, yb - ya, xa - e.x0, ya - e.y0, xb - xa, yb - ya); };
  src(groundCache, 0, 790, 0); src(northCache, NY, 0, NY);
  try {
    const se = S(), hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    const G = [hx(se.grass), hx(se.grass2)], school = V46SCHOOL[z.id] && !!(R[z.id] && R[z.id].walls), o = z.o;   // v62f: khu không tường (điểm danh, sân bóng) không giữ dải gạch cũ ở lề
    const im = g.getImageData(0, 0, w, h), d = im.data, eq = (i, q) => d[i] === q[0] && d[i + 1] === q[1] && d[i + 2] === q[2];
    // outside the real rect (the cut margin) only old world shows (roads, fences) → gone, except at the school (yards, doors)
    const ix0 = o.x - e.x0 - 1, ix1 = o.x + o.w - e.x0, iy0 = o.y - e.y0 - 1, iy1 = o.y + o.h - e.y0;
    for(let y = 0; y < h; y++){ const inY = y > iy0 && y < iy1;
      for(let x = 0, i = y*w*4; x < w; x++, i += 4){ if(!d[i + 3]) continue;
        if(eq(i, G[0]) || eq(i, G[1]) || (!school && !(inY && x > ix0 && x < ix1))){ d[i + 3] = 0; continue; }
        // school yards: keep the old paving only close to the building and fade it out softly (no hard cut edges)
        if(school){ const ox = x < ix0 ? ix0 - x : x > ix1 ? x - ix1 : 0, oy = y < iy0 ? iy0 - y : y > iy1 ? y - iy1 : 0, dd = Math.max(ox, oy);
          if(dd > V47W_FEATHER) d[i + 3] = 0; else if(dd > 0) d[i + 3] = Math.round(d[i + 3]*(1 - dd/V47W_FEATHER)); } } }   // v62f: mờ dần ngay từ mép nhà (không còn dải gạch xám cứng)
    g.putImageData(im, 0, 0);
  } catch(err){}
  V47W.pc[z.id] = c; return c;
}

// ---------- 2. phố nhà & cửa hàng người chơi: nhà rút gọn khi nhìn xa, quầy hàng + người đi lại ----------
function v47wBand(){
  if(V47W.band) return V47W.band; const z = V46.ZI.pstreet; if(!z) return null; const n = z.n;
  V47W.band = {x0:n.x0 + 10, x1:n.x1 - 10, y0:n.y1 + 14, y1:n.y1 + 14 + Math.round((n.y1 - n.y0)/PHI/PHI)};   // dải chợ cao = h/φ²
  const B = V47W.band, cnt = 5, step = (B.x1 - B.x0)/cnt; V47W.stalls = [];
  for(let i = 0; i < cnt; i++) V47W.stalls.push({x:B.x0 + step*(i + .5), y:B.y0 + 58, c:['#ef4b4b', '#26a69a', '#ffb300', '#7e57c2', '#ec407a'][i], g:['🍉', '📚', '🧸', '🎨', '🧩'][i]});
  V47W.ped = Array.from({length:16}, (_, i) => ({o:i*.618 % 1, sp:16 + (i*7 % 13), lane:i % 4, c:['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#6d4c41'][i % 8], hair:['#1a1a1a', '#3a2418', '#6d4c2e', '#c58c4a'][i % 4], skin:['#f5d1ad', '#eab98c', '#c98e60'][i % 3]}));
  return B;
}
function v47wFarHouses(g, tiny){
  const z = V46.ZI.pstreet; if(!z || typeof PLOTS === 'undefined') return;
  PLOTS.forEach((P, i) => { const s = (typeof STREET !== 'undefined' && STREET[i]) || {col:['#90caf9', '#ce93d8', '#ffcc80', '#a5d6a7'][i % 4]}, x = P.x + z.d[0], y = P.y + z.d[1], w = P.w, h = P.h;
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 8, y + h - 10, w - 16, 10);
    g.fillStyle = s.kind === 'shop' || s.kind === 'pshop' ? '#f5f5f5' : '#fff8e1'; g.fillRect(x + 14, y + 60, w - 28, h - 70);
    g.fillStyle = s.col || '#90caf9'; g.beginPath(); g.moveTo(x + 4, y + 64); g.lineTo(x + w - 4, y + 64); g.lineTo(x + w/2, y + 8); g.closePath(); g.fill();
    if(tiny) return; g.fillStyle = '#6d4c2e'; g.fillRect(x + w/2 - 18, y + h - 60, 36, 52); g.fillStyle = '#90caf9'; g.fillRect(x + 30, y + 96, 40, 34); g.fillRect(x + w - 70, y + 96, 40, 34); });
}
function v47wStall(g, s){
  const x = Math.round(s.x), y = Math.round(s.y), w = 112;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - w/2 + 4, y - 2, w - 8, 8);
  g.fillStyle = '#8d6e63'; g.fillRect(x - w/2 + 6, y - 34, w - 12, 34); g.fillStyle = '#a1887f'; g.fillRect(x - w/2 + 6, y - 34, w - 12, 6);
  g.fillStyle = '#5d4037'; g.fillRect(x - w/2 + 8, y - 74, 4, 42); g.fillRect(x + w/2 - 12, y - 74, 4, 42);
  for(let k = 0; k < 7; k++){ g.fillStyle = k % 2 ? '#fff8e1' : s.c; g.fillRect(x - w/2 + k*w/7, y - 86, Math.ceil(w/7), 16); }
  g.fillStyle = s.c; for(let k = 0; k < 7; k++){ g.beginPath(); g.arc(x - w/2 + (k + .5)*w/7, y - 70, w/14, 0, Math.PI); g.fill(); }
  g.font = '18px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(s.g, x - 22, y - 38); g.fillText(s.g, x + 22, y - 38); g.textAlign = 'left';
}
function v47wPed(g, x, y, p, t){
  const st = Math.sin(t*9)*3; x = Math.round(x); y = Math.round(y);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 6, y - 1, 12, 3);
  g.fillStyle = '#37474f'; g.fillRect(x - 4, y - 10 + Math.max(0, st), 3, 10 - Math.max(0, st)); g.fillRect(x + 1, y - 10 + Math.max(0, -st), 3, 10 - Math.max(0, -st));
  g.fillStyle = p.c; g.fillRect(x - 5, y - 22, 10, 13); g.fillStyle = p.skin; g.fillRect(x - 4, y - 30, 8, 8); g.fillStyle = p.hair; g.fillRect(x - 4, y - 31, 8, 3);
}
function v47wStreet(VBn){
  const B = v47wBand(); if(!B) return; if(B.x1 < VBn.x0 - 200 || B.x0 > VBn.x1 + 200 || B.y1 < VBn.y0 - 400 || B.y0 > VBn.y1 + 400) return;
  if(cam.z < .3) v47wFarHouses(ctx, cam.z < .12);
  // cobbled market lane
  ctx.fillStyle = season === 'dong' ? '#d9d4ca' : '#d8c8a0'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
  ctx.fillStyle = 'rgba(0,0,0,.07)'; for(let y = B.y0 + 8; y < B.y1; y += 24) for(let x = B.x0 + ((y/24) % 2)*20; x < B.x1; x += 40) ctx.fillRect(x, y, 18, 10);
  if(cam.z < .12) return;
  const sp = V47W.stalls.map(s => ({y:s.y, f:() => v47wStall(ctx, s)})), L = B.x1 - B.x0 - 40;
  V47W.ped.forEach((p, i) => { let u = (p.o*L*2 + realT*p.sp) % (2*L), dir = 1; if(u > L){ u = 2*L - u; dir = -1; }
    const y = p.lane === 3 ? V47W.stalls[i % 5].y + 26 : B.y0 + 84 + p.lane*26, x = p.lane === 3 ? V47W.stalls[i % 5].x + Math.sin(realT*.7 + i)*14 : B.x0 + 20 + u;
    sp.push({y, f:() => v47wPed(ctx, x, y, p, p.lane === 3 ? 0 : realT + i)}); });
  sp.sort((a, b) => a.y - b.y).forEach(s => { try { s.f(); } catch(e){} });
}

// ---------- 3. biển quanh đảo: tàu lớn chạy vòng, thuyền đi khắp biển, hải đăng quay chậm ----------
function v47wBigShip(s){ return V46.on && s !== pirate && !!V47W_BIG[s.k]; }
function v47wShipPos(s){
  const j = ships.indexOf(s), L = V46L, r = L.ISLAND + 190 + (j % 3)*75, sg = s.dir < 0 ? -1 : 1, a = j*2.39996 + realT*(s.v || 8)/r*1.4*sg;   // góc vàng giữa các tàu
  return [L.CX + Math.cos(a)*r, L.CY + Math.sin(a)*r, -Math.sin(a)*sg < 0 ? -1 : 1];
}
function v47wShips(VBn){
  ships.forEach(s => { if(!v47wBigShip(s)) return; const p = v47wShipPos(s); if(p[0] < VBn.x0 - 120 || p[0] > VBn.x1 + 120 || p[1] < VBn.y0 - 120 || p[1] > VBn.y1 + 120) return;
    const ox = s.x, oy = s.y, od = s.dir; s.x = p[0]; s.y = p[1]; s.dir = p[2]; try { drawShip(s); } catch(e){} s.x = ox; s.y = oy; s.dir = od; });
}
function v47wLhAng(){ return pirate ? lhAng : realT*(RM.matches ? .08 : .16); }
function v47wSea(x, y){ const L = V46L; return x > 60 && y > 60 && x < L.W - 60 && y < L.H - 60 && Math.hypot(x - L.CX, y - L.CY) > L.ISLAND + 50; }
// depth tier of the open sea: further from the island = deeper (same tiers as the old sea)
function v47wDepthY(x, y){ const L = V46L, t = Math.max(0, Math.min(1, (Math.hypot(x - L.CX, y - L.CY) - L.ISLAND - 50)/2500)); return 905 + t*(H - 940); }
// open-sea boat (new coordinates): keys or phone swipe (V39.steer), same feel as the old boat
function v47wRawBoat(c, dt){
  const b = c.boat, hz = V46.ZI.harbor, h = V46L.harbor.src, S = typeof V39 !== 'undefined' ? V39.steer : null, max = b.item ? b.item.s : 330;
  if(typeof V39 !== 'undefined') V39.boatGoal = null;
  if(S && S.drag){ const dx = S.x - S.x0, dy = S.y - S.y0, L = Math.hypot(dx, dy), want = Math.atan2(dy/.75, dx), pow = Math.min(1, L/120);
    let d = want - b.h; d = Math.atan2(Math.sin(d), Math.cos(d)); b.h += Math.max(-1.9*dt, Math.min(1.9*dt, d)); const tg = max*pow*(Math.abs(d) > 1.6 ? .3 : 1); b.v += (tg - b.v)*Math.min(1, dt*1.6); }
  else { const thr = (keys.up ? 1 : 0) - (keys.down ? .6 : 0), turn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    b.v += thr*260*dt; b.v *= Math.pow(.55, dt); b.v = Math.max(-90, Math.min(max, b.v)); b.h += turn*dt*(1.2 + Math.min(1.6, Math.abs(b.v)/140))*(b.v < 0 ? -1 : 1); }
  const x = c.x - V46E, nx = x + Math.cos(b.h)*b.v*dt, ny = c.y + Math.sin(b.h)*b.v*dt*.75;
  if(v46ZoneNew(nx, ny) === hz){ const o = v46O(hz, nx, ny);
    if(o[0] > h[0] + 40 && o[0] < h[0] + h[2] - 40 && o[1] > 930 && o[1] < h[1] + h[3] - 40 && !onPier(o[0], o[1])){ c.x = o[0]; c.y = o[1]; c._z = 'harbor'; b.h = -b.h; b.trail = []; c._lx = c.x; c._ly = c.y; return; } }
  const zt = b.item ? b.item.zone : 1, oz = oceanAt(v47wDepthY(nx, ny));
  if(oz.z > zt){ b.v *= -.3; if(realT - (b.warn || 0) > 3){ b.warn = realT; toast(`${oz.n} cần thuyền hạng ${oz.z}. ${b.item.n || 'Thuyền này'} chỉ đi được tới vùng hạng ${zt}.`); } }
  else if(v47wSea(nx, ny)){ c.x = nx + V46E; c.y = ny; } else b.v *= -.3;
  c.dir = Math.cos(b.h) < 0 ? -1 : 1; c.moving = Math.abs(b.v) > 5; c._z = null;
  if(v47wDepthY(c.x - V46E, c.y) > 1500) mprog('boat');
  b.v47t = b.v47t || []; if(Math.abs(b.v) > 40 && Math.random() < .5) b.v47t.push({x:c.x - V46E - Math.cos(b.h)*24, y:c.y - Math.sin(b.h)*18, t:1.2});
  b.v47t.forEach(p => p.t -= dt); b.v47t = b.v47t.filter(p => p.t > 0);
}
// outermost boat layer (installed after v39 swipe steering): bay → open sea, open sea physics, mirrored swipe in the bay
function v47wBoatHook(){
  const bm1 = boatMove;
  boatMove = function(c, dt){
    if(!V46.on || V46.sky || !c.boat) return bm1(c, dt);
    if(v46Raw(c.x)) return v47wRawBoat(c, dt);
    const b = c.boat, h = V46L.harbor.src, hz = V46.ZI.harbor;
    if(c._z === 'harbor' && b.v > 10){ const nx = c.x + Math.cos(b.h)*b.v*dt*3, ny = c.y + Math.sin(b.h)*b.v*dt*2.25;
      if(nx < h[0] + 30 || nx > h[0] + h[2] - 30 || ny > h[1] + h[3] - 30){ const n = v46N(hz, nx, ny);
        if(v47wSea(n[0], n[1])){ c.x = n[0] + V46E; c.y = n[1]; c._z = null; b.h = -b.h; b.trail = []; b.v47t = []; c._lx = c.x; c._ly = c.y;
          if(!V47W.seaMsg){ V47W.seaMsg = 1; toast('🌊 Ra khơi! Cả vùng biển quanh đảo là của bạn. Càng xa đảo nước càng sâu, cá càng hiếm.'); } return; } } }
    const S = typeof V39 !== 'undefined' ? V39.steer : null;
    if(c._z === 'harbor' && S && S.drag){ const y = S.y; S.y = 2*S.y0 - y; try { return bm1(c, dt); } finally { S.y = y; } }
    return bm1(c, dt);
  };
}
const v47wLB0 = leaveBoat;
leaveBoat = function(c){
  if(!c || !c.boat || !V46.on || !v46Raw(c.x)) return v47wLB0(c);
  const L = V46L, x = c.x - V46E, dx = x - L.CX, dy = c.y - L.CY, r = Math.hypot(dx, dy), t = (L.ISLAND - 80)/r;
  if(r > L.ISLAND + 320){ toast('⛵ Lái thuyền vào sát bờ đảo rồi bấm Cập bờ nhé!'); return; }
  c.boat = null; c.x = L.CX + dx*t + V46E; c.y = L.CY + dy*t; c._z = null; toast(`🏝️ ${c.name} cập bờ đảo.`); updateExtButtons(); updatePanel();
};
const v47wDR0 = v46DrawRaw;
v46DrawRaw = function(a){ if(a.boat && a.boat.v47t){ const P = v46Pos(a); a.boat.trail = a.boat.v47t.map(p => ({x:p.x - P[0] + 1605, y:p.y - P[1] + 400, t:p.t})); } return v47wDR0(a); };
const v47wDF0 = openDeepFish;
openDeepFish = function(){ const c = agents.find(a => a.controlled); if(!V46.on || !c || !c.boat || !v46Raw(c.x)) return v47wDF0();
  const y = c.y; c.y = v47wDepthY(c.x - V46E, y); try { return v47wDF0(); } finally { c.y = y; } };

// ---------- 4. tự đi tới: phòng có tường (lớp, hội trường…) đi qua cửa; khu khoá level báo rõ ----------
const v47wMI0 = v46MapsInit;
v46MapsInit = function(){
  const nav0 = navFind; v47wMI0(); const nf = navFind; v47wBoatHook();
  navFind = function(sx, sy, tx, ty){
    if(!V46.on || V46.sky) return nf(sx, sy, tx, ty);
    const z = v46ZoneOld(tx, ty), r = z && R[z.id];
    if(!z || z.flip || !r || !(r.walls || z.id === 'rubikyard') || !r.dout || !inside(r, tx, ty)) return nf(sx, sy, tx, ty);
    const e = [r.dout[0], r.dout[1] + (r.side === 'b' ? 20 : r.side === 't' ? -20 : 0)]; let Q = [];
    try { Q = nav0(e[0], e[1], tx, ty) || []; } catch(err){}
    if(!Q.length || Q.some(p => !v46In(z.e, p[0], p[1]))) Q = [[r.dout[0], r.dout[1]], [r.dw[0], r.dw[1]], [tx, ty]];
    if(!v46Raw(sx) && v46ZoneOld(sx, sy) === z){ try { const S0 = nav0(sx, sy, tx, ty); if(S0 && S0.length && !S0.some(p => !v46In(z.e, p[0], p[1]))) return S0; } catch(err){} return [e].concat(Q); }
    const P = nf(sx, sy, e[0], e[1]); return P.slice(0, -1).concat([e], Q);
  };
};
// arrival also counts on the island itself (targets outside every zone, e.g. the school gate)
const v47wNT0 = v32NavTick;
v32NavTick = function(){ const N = V32.nav; if(N && V46.on && !V46.sky && PLAYER && PLAYER.visible){ const a = v46Pos(PLAYER), b = v46ToNew(N.x, N.y); if(Math.hypot(a[0] - b[0], a[1] - b[1]) < 46){ N.x = PLAYER.x; N.y = PLAYER.y; } } return v47wNT0.apply(this, arguments); };
const v47wNav1 = v32Nav;
v32Nav = function(x, y, name, walk, onArrive){
  if(walk && PROF && typeof LOCKS !== 'undefined'){ const lk = LOCKS.find(q => inside(q.r, x, y) && PROF.level < q.lvl);
    if(lk){ toast(`🔒 ${lk.name} mở khoá ở Level ${lk.lvl} (bạn đang Level ${PROF.level}). Chơi thêm mini game để lên level nhé! Đường vàng vẫn chỉ chỗ cho bạn.`); return v47wNav1(x, y, name, false, onArrive); } }
  return v47wNav1.apply(this, arguments);
};

// ---------- 5. cây cối không mọc trên chợ phố; ảnh toàn cảnh có nhà phố + quầy hàng ----------
const v47wDeco0 = v46Deco;
v46Deco = function(){ v47wDeco0(); V47W.band = null; const B = v47wBand(); if(!B) return; const out = t => t.x > B.x0 - 40 && t.x < B.x1 + 40 && t.y > B.y0 - 20 && t.y < B.y1 + 60;
  V46T.deco = V46T.deco.filter(t => t.k === 9 || !out(t)); if(V46T.lamps) V46T.lamps = V46T.lamps.filter(([x, y]) => !out({x, y})); };
const v47wOB0 = v46OverviewBuildings;
v46OverviewBuildings = function(g){ v47wOB0(g); try { v47wFarHouses(g, true); const B = v47wBand(); if(B){ g.fillStyle = '#d8c8a0'; g.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); V47W.stalls.forEach(s => { g.fillStyle = s.c; g.fillRect(s.x - 56, s.y - 86, 112, 50); }); } } catch(e){} };
// called from v46Render after the zones are drawn
function v47wWorld(VBn){ try { v47wShips(VBn); } catch(e){} try { v47wStreet(VBn); } catch(e){} }

// ---------- v47x: walking down to the beach in a zone must not jump into a boat by itself (use the Boat button) ----------
const v47wOW0 = openWorldTick;
openWorldTick = function(dt){ const c = agents.find(a => a.controlled);
  if(typeof V46 !== 'undefined' && V46.on && c && !c.boat && !c.v16fly && keys.down && c.y > 940){ const k = keys.down; keys.down = false;
    if(!V47W.boatHint && c._z === 'harbor'){ V47W.boatHint = 1; toast('⛵ Muốn đi thuyền thì bấm nút Thuyền nhé.'); }
    try { return v47wOW0(dt); } finally { keys.down = k; } }
  return v47wOW0(dt); };
