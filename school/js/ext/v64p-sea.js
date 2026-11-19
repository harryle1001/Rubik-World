// ================= v64p · 1/2 BIỂN + ĐẢO KIỂU TINY SWORDS (CC0, assets/cc0/tiny-swords) =================
// Nước biển màu Tiny Swords (#47ABA9), bọt sóng Foam 8 khung dọc bờ (cắt theo vùng nước), đá ngầm Rocks có hoạt ảnh,
// đảo nhỏ v55s dựng bằng cỏ/cát/vách Tiny Swords + cây lắc lư + nhà mái rơm + cầu gỗ. KHÔNG đổi hàm "là nước?".
// Mọi tên toàn cục có tiền tố v64p / V64P. Chỉ bọc (gán lại) hàm cũ.
const V64P_TS = 'assets/cc0/tiny-swords/';
const V64P = {img:{}, ord:[], ready:false, pts:null, grid:null, clip:null, isl:false, n:0, fps:0, msg:{},
  K:.6,                    // tỉ lệ đồ hoạ Tiny Swords trong thế giới (ô 64px → 38 đơn vị)
  FK:.8, FIN:20, FSP:42,   // bọt sóng: tỉ lệ, độ lún vào bờ, khoảng cách giữa 2 cụm
  OFF:{isl:-4, out:0, inn:0}   // mép cát thật so với bán kính bờ (đảo chính, đất liền ngoài, đất liền trong)
};
// bảng màu biển theo mùa (gốc: nước Tiny Swords #47ABA9) — sea: nước nông, sea2: nước khơi
const V64P_SEA = {xuan:['#62c4bc', '#47aba9'], ha:['#5fcac0', '#45a9a7'], thu:['#66b8ae', '#3f999a'], dong:['#88b6b8', '#5b8f96']};
const V64P_DEEP = ['#3f9c9d', '#368c90', '#2f7d84'];   // 3 bậc khơi xa (thay xanh navy cũ)

function v64pImg(k, src){ const i = new Image(); i.decoding = 'async'; i.src = src; V64P.img[k] = i; return i; }
function v64pOk(k){ const i = V64P.img[k]; return !!(i && i.complete && i.naturalWidth); }
function v64pLoad(done){
  const L = [['foam', 'Terrain/Water/Foam/Foam.png'], ['grass', 'Terrain/Ground/Tilemap_Grass.png'], ['sand', 'Terrain/Ground/Tilemap_Sand.png'],
    ['elev', 'Terrain/Ground/Tilemap_Elevation.png'], ['bridge', 'Terrain/Bridge/Bridge_All.png'], ['tree', 'Resources/Trees/Tree.png'], ['shadow', 'Terrain/Ground/Shadows.png'],
    ['rock1', 'Terrain/Water/Rocks/Rocks_01.png'], ['rock2', 'Terrain/Water/Rocks/Rocks_02.png'], ['rock3', 'Terrain/Water/Rocks/Rocks_03.png'], ['rock4', 'Terrain/Water/Rocks/Rocks_04.png'],
    ['houseB', 'Buildings/House/House_Blue.png'], ['houseR', 'Buildings/House/House_Red.png'], ['houseY', 'Buildings/House/House_Yellow.png'],
    ['bush', 'Deco/09.png'], ['mush', 'Deco/03.png'], ['flower', 'Deco/06.png']];
  let n = L.length; const one = () => { if(--n === 0) done(); };
  L.forEach(([k, s]) => { const i = v64pImg(k, V64P_TS + s); i.onload = one; i.onerror = () => { if(!V64P.msg[k]){ V64P.msg[k] = 1; console.warn('v64p: thiếu ảnh', s); } one(); }; });
}
// ô 64×64 cắt từ tilemap thành mẫu lặp (pattern) — cache theo context
function v64pTile(k, sx, sy){ const key = 't' + k + sx + '_' + sy; if(V64P[key]) return V64P[key];
  const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(V64P.img[k], sx, sy, 64, 64, 0, 0, 64, 64); return (V64P[key] = c); }
function v64pPat(g, k, sx, sy, sc){ const p = g.createPattern(v64pTile(k, sx, sy), 'repeat'); try { p.setTransform(new DOMMatrix().scale(sc || V64P.K)); } catch(e){} return p; }

// ---------- 1. màu nước ----------
function v64pSeaColors(){
  try { for(const k in V64P_SEA){ const s = SEASONS[k]; if(!s) continue; s.v64pSea0 = s.v64pSea0 || [s.sea, s.sea2]; s.sea = V64P_SEA[k][0]; s.sea2 = V64P_SEA[k][1]; } } catch(e){ console.warn('v64p sea', e); }
  try { const B = V55S_BANDS; B[3][2] = V64P_DEEP[0]; B[4][2] = V64P_DEEP[1]; B[5][2] = V64P_DEEP[2]; } catch(e){}
}
function v64pRebake(){
  try { V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; } catch(e){}
  try { V55S.far = null; V55S.paths = null; } catch(e){}
  try { if(typeof V56P !== 'undefined'){ V56P.sea = null; V56P.atmK = ''; } } catch(e){}
}

// ---------- 2. đường bờ: điểm đặt bọt sóng + vùng nước để cắt (clip) ----------
function v64pBlobR(s, a){ return s.r*(.9 + .07*Math.sin(3*a + s.ph) + .04*Math.sin(7*a + s.ph*2)); }   // cùng hình v55sBlob
function v64pBuild(){
  const L = V46L, P = [], tau = Math.PI*2, main = typeof v55sMain === 'function' && v55sMain(), hz = V46.ZI && V46.ZI.harbor;
  const add = (x, y, nx, ny) => { if(hz && v46In(hz.n, x, y)) return; P.push(x, y, nx, ny, (x*.013 + y*.007) % 8); };
  // đảo chính (tròn)
  const O = V64P.OFF, RI = L.ISLAND + O.isl, n0 = Math.round(tau*RI/V64P.FSP); for(let i = 0; i < n0; i++){ const a = i/n0*tau, c = Math.cos(a), s = Math.sin(a); add(L.CX + c*RI, L.CY + s*RI, c, s); }
  // đất liền: bờ ngoài (ra khơi) + bờ trong (eo biển)
  if(main){ [[v52wRout, 1, O.out], [v52wRin, -1, -O.inn]].forEach(([f, sg, off]) => { const n = Math.round(tau*f(0)/V64P.FSP);
    for(let i = 0; i < n; i++){ const a = i/n*tau, r = f(a) + off, c = Math.cos(a), s = Math.sin(a), x = L.CX + c*r, y = L.CY + s*r;
      const da = .002, dr = (f(a + da) - f(a - da))/(2*da), tx = -s*r + c*dr, ty = c*r + s*dr, tl = Math.hypot(tx, ty) || 1;   // pháp tuyến thật của đường cong
      let nx = ty/tl, ny = -tx/tl; if((nx*c + ny*s)*sg < 0){ nx = -nx; ny = -ny; }
      try { if(v52wRiverD(x, y) < 110) continue; } catch(e){} add(x, y, nx, ny); } }); }
  // đảo nhỏ (theo đúng hình blob)
  for(const s of V55S.isl){ if(s.k !== 'isle') continue; const n = Math.max(16, Math.round(tau*s.r/V64P.FSP));
    for(let i = 0; i < n; i++){ const a = i/n*tau, r = v64pBlobR(s, a); add(s.x + Math.cos(a)*r, s.y + Math.sin(a)*r*.92, Math.cos(a), Math.sin(a)); } }
  const pts = V64P.pts = new Float32Array(P), G = V64P.grid = new Map(), C = 640;
  for(let i = 0; i < pts.length; i += 5){ const k = Math.floor(pts[i]/C)*65536 + Math.floor(pts[i + 1]/C); let a = G.get(k); if(!a) G.set(k, a = []); a.push(i); }
  // vùng nước = khung biển trừ đất (evenodd): đảo chính, vành đất liền (ngoài + trong), đảo nhỏ
  const X = V55S, p = new Path2D(); p.rect(X.X0 - 400, X.Y0 - 400, X.X1 - X.X0 + 800, X.Y1 - X.Y0 + 800);
  const curve = f => { const n = 1080; for(let i = 0; i <= n; i++){ const a = i/n*tau, r = f(a), x = L.CX + Math.cos(a)*r, y = L.CY + Math.sin(a)*r; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); };
  if(main){ curve(a => v52wRout(a) + O.out); curve(a => v52wRin(a) - O.inn); }
  p.moveTo(L.CX + RI, L.CY); p.arc(L.CX, L.CY, RI, 0, tau); p.closePath();
  for(const s of V55S.isl){ if(s.k !== 'isle') continue; for(let i = 0; i <= 48; i++){ const a = i/48*tau, r = v64pBlobR(s, a), x = s.x + Math.cos(a)*r, y = s.y + Math.sin(a)*r*.92; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); }
  V64P.clip = p;
}

// ---------- 3. đảo nhỏ: bố cục cây / nhà / cầu / đá (cố định theo seed của đảo) ----------
function v64pIsle(s){
  if(s.v64) return s.v64; const tau = Math.PI*2, d = s.v64 = {trees:[], rocks:[], house:null, pier:null}; let q = Math.floor((s.ph || 1)*99991) || 7;
  const rn = () => (q = (q*16807) % 2147483647)/2147483647, idx = V55S.isl.indexOf(s);
  if(s.k === 'isle'){
    const top = s.r*.62, big = s.r >= 170;
    if(big && idx % 3 === 0) d.house = {x:s.x - top*(s.light ? .5 : .18), y:s.y - top*.08, k:['houseB', 'houseR', 'houseY'][idx % 3 === 0 ? (idx/3) % 3 : 0]};
    if(d.house && idx % 2 === 0){ const a = rn()*tau; d.pier = {a, x:s.x + Math.cos(a)*s.r*.8, y:s.y + Math.sin(a)*s.r*.8*.92}; }
    const nt = 2 + (s.palms || 0) + (big ? 1 : 0);
    for(let i = 0, k = 0; i < 40 && k < nt; i++){ const a = rn()*tau, r = top*(.25 + rn()*.62), x = s.x + Math.cos(a)*r, y = s.y + Math.sin(a)*r*.86 - 10;
      if(d.house && Math.abs(x - d.house.x) < 60 && y < d.house.y + 30 && y > d.house.y - 90) continue;
      if(s.light && Math.abs(x - (s.x + s.r*.12)) < 50 && y < s.y - s.r*.1 + 30 && y > s.y - s.r*.1 - 120) continue;   // chừa chỗ đèn biển
      if(d.trees.some(t => Math.hypot(t[0] - x, t[1] - y) < 46)) continue; d.trees.push([x, y, rn()*4, .5 + rn()*.15]); k++; }
    d.trees.sort((a, b) => a[1] - b[1]);
    // vài hòn đá ngầm sát đảo (vẫn nằm trong lề "không phải nước" của đảo)
    const nr = 1 + Math.floor(rn()*2); for(let i = 0; i < nr; i++){ const a = rn()*tau, r = v64pBlobR(s, a) + 22; d.rocks.push([s.x + Math.cos(a)*r, s.y + Math.sin(a)*r*.92, 1 + Math.floor(rn()*4), rn()*8, .7]); }
  } else if(s.k === 'reef' || s.k === 'rock'){
    const n = s.k === 'reef' ? 3 + Math.floor(rn()*2) : 7, sc = s.k === 'reef' ? 1.05 : 1.5;
    for(let i = 0; i < n; i++){ const a = i*2.39996 + s.ph, r = s.r*.62*Math.sqrt((i + .5)/n); d.rocks.push([s.x + Math.cos(a)*r, s.y + Math.sin(a)*r*.8, 1 + Math.floor(rn()*4), rn()*8, sc*(.8 + rn()*.4)]); }
    d.rocks.sort((a, b) => a[1] - b[1]);
  }
  return d;
}
// vẽ tĩnh vào ô nền (đất, cát, vách, cầu); lod 2 (ảnh toàn cảnh) vẽ luôn cây/nhà/đá khung đầu
function v64pIslePaint(g, s, lod, se){
  if(s.k === 'plane') return;
  const dong = season === 'dong', K = V64P.K, d = v64pIsle(s);
  if(s.k === 'reef' || s.k === 'rock'){
    g.fillStyle = 'rgba(160,226,214,.35)'; v55sBlob(g, s, s.r + (s.k === 'reef' ? 40 : 110)); g.fill();
    if(lod === 2) for(const r of d.rocks) v64pRock(g, r, 0);
    if(s.light) v55sLighthouse(g, s.x, s.y); return; }
  // nước nông sáng quanh đảo
  g.fillStyle = 'rgba(150,222,208,.45)'; v55sBlob(g, s, s.r + 120); g.fill();
  g.fillStyle = 'rgba(175,234,220,.5)'; v55sBlob(g, s, s.r + 46); g.fill();
  // bãi cát (mẫu cát Tiny Swords) + viền
  g.fillStyle = v64pPat(g, 'sand', 64, 64); v55sBlob(g, s, s.r); g.fill();
  if(dong){ g.fillStyle = 'rgba(240,244,248,.55)'; g.fill(); }
  g.lineWidth = 3; g.strokeStyle = 'rgba(176,138,72,.75)'; g.stroke();
  // bóng đổ + vách đá (mặt vách Tiny Swords) + cao nguyên cỏ
  const top = {x:s.x, y:s.y - 12, r:s.r*.62, ph:s.ph}, cliff = Math.round(64*K*.62);
  g.fillStyle = 'rgba(40,60,50,.22)'; v55sBlob(g, {x:top.x + 8, y:top.y + cliff + 10, r:top.r*1.02, ph:s.ph}, top.r*1.02); g.fill();
  g.save(); g.fillStyle = v64pPat(g, 'elev', 64, 192); g.translate(0, cliff); v55sBlob(g, top, top.r); g.fill(); g.restore();
  g.save(); g.translate(0, cliff); v55sBlob(g, top, top.r); g.restore(); g.lineWidth = 3; g.strokeStyle = 'rgba(28,44,52,.85)'; g.stroke();
  g.fillStyle = v64pPat(g, 'grass', 64, 64); v55sBlob(g, top, top.r); g.fill();
  if(dong){ g.fillStyle = 'rgba(236,242,246,.72)'; g.fill(); }
  g.lineWidth = 3; g.strokeStyle = 'rgba(34,56,38,.9)'; g.stroke();
  if(lod === 2){ if(v64pOk('tree')) for(const t of d.trees) v64pTree(g, t, 0); if(d.house) v64pHouse(g, d.house); if(s.light) v55sLighthouse(g, s.x + s.r*.12, s.y - s.r*.1); return; }
  // đồ trang trí cỏ (bụi, nấm, hoa) — tĩnh
  const deco = ['bush', 'mush', 'flower']; for(let i = 0; i < 3; i++){ const a = s.ph*3 + i*2.1, r = top.r*.55, im = V64P.img[deco[i]]; if(!v64pOk(deco[i])) continue;
    g.drawImage(im, top.x + Math.cos(a)*r - 32*K, top.y + Math.sin(a)*r*.8 - 40*K, 64*K, 64*K); }
  // cầu gỗ (bến nhỏ) ra biển
  if(d.pier && v64pOk('bridge')){ const p = d.pier, B = V64P.img.bridge, w = 64*K, horiz = Math.abs(Math.cos(p.a)) > .5;
    g.save(); g.translate(Math.round(p.x), Math.round(p.y));
    if(horiz){ const dir = Math.cos(p.a) > 0 ? 1 : -1; if(dir < 0) g.scale(-1, 1); g.drawImage(B, 0, 0, 64, 64, -w*.4, -w/2, w, w); g.drawImage(B, 64, 0, 64, 64, w*.6 - 1, -w/2, w, w); g.drawImage(B, 128, 0, 64, 64, w*1.6 - 2, -w/2, w, w); }
    else { const dir = Math.sin(p.a) > 0 ? 1 : -1; if(dir < 0) g.scale(1, -1); g.drawImage(B, 0, 64, 64, 64, -w/2, -w*.4, w, w); g.drawImage(B, 0, 128, 64, 64, -w/2, w*.6 - 1, w, w); g.drawImage(B, 0, 192, 64, 64, -w/2, w*1.6 - 2, w, w); }
    g.restore(); }
}
// đá ngầm (Rocks_0x: 8 khung 128×128, đá ở giữa + bọt quanh)
function v64pRock(g, r, f){ const k = 'rock' + r[2]; if(!v64pOk(k)) return; const sz = 128*V64P.K*r[4]; g.drawImage(V64P.img[k], f*128, 0, 128, 128, r[0] - sz/2, r[1] - sz/2, sz, sz); }
// cây Tiny Swords (hàng đầu: 4 khung lắc lư, gốc ở y=178 trong ô 192)
function v64pTree(g, t, f){ const sc = t[3], w = 192*sc; g.drawImage(V64P.img.tree, f*192, 0, 192, 192, t[0] - w/2, t[1] - 178*sc, w, w); }
function v64pHouse(g, h){ const im = V64P.img[h.k]; if(!v64pOk(h.k)) return; const sc = V64P.K*.95, w = 128*sc, hh = 192*sc; g.drawImage(im, h.x - w/2, h.y - hh*.92, w, hh); }

// ---------- 4. lớp động (thay v55sSurf + v55sIsleFoam): bọt sóng, đá, cây, nhà ----------
function v64pSurf(VBn){
  if(!V64P.ready || !V64P.pts) return; const t = realT, C = 640, G = V64P.grid, P = V64P.pts, F = V64P.img.foam, k = V64P.FK, bs = 82*k, inn = V64P.FIN;
  const i0 = Math.floor((VBn.x0 - 80)/C), i1 = Math.floor((VBn.x1 + 80)/C), j0 = Math.floor((VBn.y0 - 80)/C), j1 = Math.floor((VBn.y1 + 80)/C); let n = 0;
  ctx.save(); ctx.clip(V64P.clip, 'evenodd'); ctx.imageSmoothingEnabled = false;
  const ft = t*7;
  for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const a = G.get(i*65536 + j); if(!a) continue;
    for(const q of a){ const x = P[q], y = P[q + 1]; if(x < VBn.x0 - 60 || x > VBn.x1 + 60 || y < VBn.y0 - 60 || y > VBn.y1 + 60) continue;
      const f = ((ft + P[q + 4]) | 0) & 7, cx = x - P[q + 2]*inn, cy = y - P[q + 3]*inn;
      ctx.drawImage(F, f*192 + 55, 55, 82, 82, cx - bs/2, cy - bs/2, bs, bs); n++; } }
  ctx.restore(); V64P.n = n;
  // đá ngầm + cây + nhà trên đảo nhỏ
  const fr = ((t*6) | 0) & 7, tf = ((t*3.2) | 0) & 3;
  for(const s of V55S.isl){ if(s.k === 'plane' || !v55sIn(VBn, s.x, s.y, s.r + 160)) continue; const d = v64pIsle(s);
    for(const r of d.rocks) v64pRock(ctx, r, (fr + (r[3] | 0)) & 7);
    if(s.k !== 'isle' || !v64pOk('tree')) continue;
    // cây, nhà, đèn biển: sắp theo y (vật phía trước che vật phía sau)
    const O = V64P.ord; O.length = 0; for(const tr of d.trees) O.push(tr[1], 0, tr); if(d.house) O.push(d.house.y, 1, d.house); if(s.light) O.push(s.y - s.r*.1, 2, s);
    const idx = []; for(let i = 0; i < O.length; i += 3) idx.push(i); idx.sort((a, b) => O[a] - O[b]);
    for(const i of idx){ const k = O[i + 1], o = O[i + 2]; if(k === 0) v64pTree(ctx, o, (tf + (o[2] | 0)) & 3); else if(k === 1) v64pHouse(ctx, o); else v55sLighthouse(ctx, o.x + o.r*.12, o.y - o.r*.1); } }
}

function v64pSeaInit(){
  if(typeof V55S === 'undefined' || !V55S.on) return false;
  v64pSeaColors(); v64pRebake();
  // đảo nhỏ: vẽ theo Tiny Swords khi ảnh đã sẵn sàng (trước đó giữ cách vẽ cũ)
  const ip0 = v55sIslePaint; v55sIslePaint = function(g, s, lod, se){ if(!V64P.ready) return ip0(g, s, lod, se); try { v64pIslePaint(g, s, lod, se); } catch(e){ if(!V64P.msg.isle){ V64P.msg.isle = 1; console.warn('v64p isle', e); } ip0(g, s, lod, se); } };
  const sf0 = v55sSurf, if0 = v55sIsleFoam;
  v55sSurf = function(VBn){ if(!V64P.ready) return sf0(VBn); try { v64pSurf(VBn); } catch(e){ if(!V64P.msg.surf){ V64P.msg.surf = 1; console.warn('v64p surf', e); } } };
  v55sIsleFoam = function(VBn){ if(!V64P.ready) return if0(VBn); };
  try { v64pBuild(); } catch(e){ console.warn('v64p build', e); }
  v64pLoad(() => { V64P.ready = v64pOk('foam') && v64pOk('grass') && v64pOk('sand'); v64pRebake(); });
  return true;
}
