// ================= v64m · BẢN ĐỒ PUNY WORLD: bản đồ lớn + minimap vẽ bằng tileset Puny World (CC0, Shade) =================
// Lấy mẫu địa hình thật (đất/biển/sông/đường/rừng/đồi/khu) theo lưới ô V64M.CELL px thế giới → đặt ô 16×16 Puny World
// (ghép 4 góc 8×8 cho bờ biển, bờ sông, đường đất, rừng, đồi). Dựng dần theo khung hình vào 1 canvas, chỉ dựng lại khi thế giới/mùa đông đổi.
const V64M = {on:false, ts:null, tsOk:false, img:null, key:'', want:'', job:null, CELL:256, N:0, M:0, X0:0, Y0:0, T:null, F:null, D:null, O:null, deep:'#0b8fae',
  bg0:null, md0:null, rm0:null, hd:0, hp:null, lab:[], labP:null, labS:null, dbg:{}};
const V64M_SRC = 'assets/cc0/puny-world/punyworld-overworld-tileset.png';
// khối 3×3 (góc trái trên) + ô "góc trong" của từng loại địa hình trong tileset (cột, hàng)
const V64M_B = {dirt:[10, 0, 5, 1], fresh:[7, 10, 2, 11], sand:[12, 10], deep1:[17, 10], deep2:[22, 10], hill:[0, 4], pine:[0, 7], pine2:[9, 7]};
// biểu tượng khu: [cột, hàng, rộng, cao] (ô 16px)
const V64M_IC = {castle:[12, 28, 2, 2], palace:[12, 26, 2, 2], fort:[10, 26, 2, 2], fort2:[10, 28, 2, 2], magic:[12, 33, 2, 2], tealfort:[10, 33, 2, 2], redpal:[22, 33, 2, 2], redfort:[20, 33, 2, 2],
  house:[7, 26, 1, 1], house2:[8, 27, 1, 1], house3:[9, 29, 1, 1], house4:[4, 27, 1, 1], teal:[7, 33, 1, 1], teal2:[8, 34, 1, 1], red:[17, 33, 1, 1], red2:[15, 34, 1, 1], red3:[14, 35, 1, 1],
  tent:[4, 26, 1, 1], hut:[5, 26, 1, 1], cave:[6, 26, 1, 1], well:[4, 30, 1, 1], stall:[9, 31, 1, 1], stall2:[8, 31, 1, 1], sign:[8, 30, 1, 1], tower:[18, 29, 1, 1], wall:[14, 26, 1, 1],
  dock:[22, 29, 1, 1], palm:[3, 28, 1, 1], palm2:[0, 31, 1, 1], tree:[3, 26, 1, 1], tree2:[0, 27, 1, 1], fruit:[2, 26, 1, 1], crop:[0, 28, 1, 1], crop2:[1, 28, 1, 1], rock:[0, 26, 1, 1], chest:[3, 29, 1, 1]};
const V64M_K = {gate:'castle', rubik:'house', chess:'house2', music:'house3', hall:'fort', office:'house', attend:'well', elec:'house2', rubikyard:'well', field:'red', giantchess:'sign',
  rubikpark:'chest', pond:'dock', flowerfield:'fruit', bpad:'tent', skate:'red2', patin:'red3', basket:'red2', ski:'cave', art:'hut', farm:'hut', garden:'fruit', picnic:'tent', lotus:'dock', lake:'dock',
  forest:'tree', library:'teal', zen:'teal2', stadium:'redfort', pool:'red3', archery:'red', gym:'red2', arena:'redpal', kart:'red', academy:'magic', shopst:'stall', hall2p:'teal', plaza:'well',
  botanic:'tealfort', pstreet:'house4', beach:'dock', navy:'tower', gardenbuy:'crop', v51t:'teal', v52mall:'redpal', v52street:'stall2', v52village:'house4', v52rice:'crop2', v52river:'dock',
  v52camp:'tent', v52hill:'cave', v52beach:'palm', v52flowers:'fruit', v53c:'fort2', v57pAp:'fort2'};
const V64M_CAT = {school:'house', world:'teal', sport:'red', shop:'stall', home:'house4', water:'dock', nature:'tree'};

function v64mHash(i, j){ let h = (i*374761393 + j*668265263) | 0; h = (h ^ (h >>> 13))*1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0)/4294967296; }
function v64mKey(){ let s = (season === 'dong' ? 'W' : 'S') + (V52W && V52W.on ? 1 : 0) + ':' + (V55S.isl ? V55S.isl.length : 0);
  if(V46 && V46.Z) for(const z of V46.Z){ const n = z.n; if(n) s += ',' + (n.x0 | 0) + ':' + (n.y0 | 0); } return s; }

// ---------- 1. lấy mẫu thế giới → lưới ----------
// T: 0 biển, 1 sông/hồ nước ngọt, 10 cỏ, 11 cát, 12 đường đất, 13 sân khu, 14 ruộng ; F: 0/1 thông đậm/2 thông nhạt/3 cây tròn ; O: 1 đồi, 2 cầu
function v64mGrid(){
  const X = V55S, C = V64M.CELL, X0 = X.on ? X.X0 : 0, Y0 = X.on ? X.Y0 : 0, X1 = X.on ? X.X1 : V46L.W, Y1 = X.on ? X.Y1 : V46L.H;
  const N = Math.ceil((X1 - X0)/C), M = Math.ceil((Y1 - Y0)/C), T = new Uint8Array(N*M), F = new Uint8Array(N*M), O = new Uint8Array(N*M), D = new Uint8Array(N*M), tc = new Uint16Array(N*M*3);
  Object.assign(V64M, {N, M, X0, Y0, T, F, O, D});
  const id = (x, y) => { const i = Math.floor((x - X0)/C), j = Math.floor((y - Y0)/C); return i < 0 || j < 0 || i >= N || j >= M ? -1 : j*N + i; };
  const main = typeof v55sMain === 'function' && v55sMain(), L = V46L;
  const land = (x, y) => X.on ? (Math.hypot(x - L.CX, y - L.CY) < L.ISLAND || (main && (() => { const r = Math.hypot(x - L.CX, y - L.CY), a = Math.atan2(y - L.CY, x - L.CX); return r > v52wRin(a) && r < v52wRout(a); })())) : Math.hypot(x - L.CX, y - L.CY) < L.ISLAND;
  for(let j = 0; j < M; j++) for(let i = 0; i < N; i++){ const x = X0 + (i + .5)*C, y = Y0 + (j + .5)*C; T[j*N + i] = land(x, y) ? 10 : 0; }
  // đảo nhỏ ngoài khơi: đảo/đảo sân bay = đất (có cây dừa); bãi đá = đá trên nước; rạn = nước nông
  (X.isl || []).forEach(s => { const k = id(s.x, s.y); if(k < 0) return;
    if(s.k === 'isle' || s.k === 'plane'){ const R = Math.max(C*.6, s.r); for(let y = s.y - R; y <= s.y + R; y += C/2) for(let x = s.x - R; x <= s.x + R; x += C/2){ const q = id(x, y); if(q >= 0 && Math.hypot(x - s.x, y - s.y) <= R) T[q] = 10; } T[k] = 10; F[k] = 4; }
    else if(s.k === 'rock') O[k] = 3; else O[k] = 4; });
  // sông Bạc trên đất liền (nước ngọt) — đóng dấu theo đường sông
  const stamp = (P, f, step) => { for(let n = 1; n < P.length; n++){ const a = P[n - 1], b = P[n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(d/step)); for(let t = 0; t <= m; t++){ const q = id(a[0] + (b[0] - a[0])*t/m, a[1] + (b[1] - a[1])*t/m); if(q >= 0) f(q); } } };
  if(main && V52W.river && V52W.river.length > 1) stamp(V52W.river, q => { if(T[q] >= 10) T[q] = 1; }, C/3);
  // độ xa bờ (ô), BFS 8 hướng từ đất
  const Q = new Int32Array(N*M); let h = 0, t = 0; for(let k = 0; k < N*M; k++){ if(T[k] >= 10){ D[k] = 0; Q[t++] = k; } else D[k] = 255; }
  while(h < t){ const k = Q[h++], i = k % N, j = (k - i)/N, d = D[k] + 1; if(d > 12) continue; for(let dj = -1; dj <= 1; dj++) for(let di = -1; di <= 1; di++){ const a = i + di, b = j + dj; if(a < 0 || b < 0 || a >= N || b >= M) continue; const q = b*N + a; if(D[q] > d){ D[q] = d; Q[t++] = q; } } }
  // bờ cát: đất sát biển
  for(let j = 0; j < M; j++) for(let i = 0; i < N; i++){ const k = j*N + i; if(T[k] !== 10) continue; if((i > 0 && T[k - 1] === 0) || (i < N - 1 && T[k + 1] === 0) || (j > 0 && T[k - N] === 0) || (j < M - 1 && T[k + N] === 0)) T[k] = 11; }
  // ruộng lúa, đồi (núi), sân các khu (đảo + đất liền)
  (V52W && V52W.on && V52W.fields || []).forEach(f => { for(let y = f.y0; y <= f.y1; y += C/2) for(let x = f.x0; x <= f.x1; x += C/2){ const q = id(x, y); if(q >= 0 && T[q] >= 10) T[q] = 14; } });
  (V52W && V52W.on && V52W.hills || []).forEach(hl => { for(let y = hl.y - hl.ry; y <= hl.y + hl.ry; y += C/3) for(let x = hl.x - hl.rx; x <= hl.x + hl.rx; x += C/3){ if(((x - hl.x)/hl.rx)**2 + ((y - hl.y)/hl.ry)**2 > 1) continue; const q = id(x, y); if(q >= 0 && T[q] >= 10) O[q] = 1; } });
  const plaza = (x0, y0, x1, y1) => { for(let y = y0 + C*.45; y < y1 - C*.35; y += C/2) for(let x = x0 + C*.45; x < x1 - C*.35; x += C/2){ const q = id(x, y); if(q >= 0 && T[q] >= 10){ T[q] = 13; O[q] = 0; } } };
  (V46.Z || []).forEach(z => { if(z.n) plaza(z.n.x0, z.n.y0, z.n.x1, z.n.y1); });
  (V52W && V52W.on && V52W.blocks || []).forEach(b => plaza(b.x0, b.y0, b.x1, b.y1));
  // đường: vòng, trục, lối vào khu, đường đất liền; trên nước → cầu
  const road = q => { if(T[q] >= 10){ if(T[q] !== 13) T[q] = 12; O[q] = O[q] === 1 ? 0 : O[q]; } else O[q] = 2; };
  (V46R.lines || []).forEach(l => stamp(l.P, road, C/3));
  (V52W && V52W.on && V52W.lines || []).forEach(l => { if(l.k === 'walk') return; stamp(l.P, l.k === 'bridge' ? (q => { if(T[q] < 10) O[q] = 2; else if(T[q] !== 13) T[q] = 12; }) : road, C/3); });
  // rừng: đếm cây thật trong từng ô
  const tree = d => { if(d.k > 2) return; const q = id(d.x, d.y); if(q >= 0) tc[q*3 + d.k]++; };
  (V46T.deco || []).forEach(tree); (V52W && V52W.on && V52W.deco || []).forEach(tree);
  for(let k = 0; k < N*M; k++){ if(T[k] !== 10 || O[k]) continue; const a = tc[k*3], b = tc[k*3 + 1], c = tc[k*3 + 2], s = a + b + c; if(s < 4) continue; F[k] = b >= a && b >= c ? 1 : c >= a ? 2 : 3; }
}

// ---------- 2. vẽ ----------
function v64mMask(f, i, j){ const N = V64M.N, M = V64M.M; if(i < 0 || j < 0 || i >= N || j >= M) return f(-1); return f(j*N + i); }
// ghép 4 góc 8×8 theo hàng xóm (góc ngoài, cạnh ngang, cạnh dọc, góc trong, giữa)
function v64mAuto(g, B, f, i, j, dx, dy, full){
  const ts = V64M.ts, bc = B[0], br = B[1];
  let all = true; const q4 = [];
  for(let q = 0; q < 4; q++){ const qx = q & 1, qy = q >> 1, sx = qx ? 1 : -1, sy = qy ? 1 : -1, h = v64mMask(f, i + sx, j), v = v64mMask(f, i, j + sy), d = v64mMask(f, i + sx, j + sy);
    let c, r; if(!h && !v){ c = bc + (qx ? 2 : 0); r = br + (qy ? 2 : 0); } else if(h && !v){ c = bc + 1; r = br + (qy ? 2 : 0); } else if(!h && v){ c = bc + (qx ? 2 : 0); r = br + 1; }
    else if(!d && B.length > 2){ c = B[2]; r = B[3]; } else { c = bc + 1; r = br + 1; }
    if(c !== bc + 1 || r !== br + 1) all = false; q4.push(c, r); }
  if(all){ if(full) full(); else g.drawImage(ts, (bc + 1)*16, (br + 1)*16, 16, 16, dx, dy, 16, 16); return; }
  for(let q = 0; q < 4; q++){ const qx = q & 1, qy = q >> 1; g.drawImage(ts, q4[q*2]*16 + qx*8, q4[q*2 + 1]*16 + qy*8, 8, 8, dx + qx*8, dy + qy*8, 8, 8); }
}
function v64mTile(g, c, r, dx, dy, w, h){ w = w || 1; h = h || 1; g.drawImage(V64M.ts, c*16, r*16, w*16, h*16, dx, dy, w*16, h*16); }
// một hàng ô: nước (cát → nước nông → xanh → sâu), đất (cỏ, đường/cát, đồi, rừng)
function v64mRow(gw, gl, j){
  const {N, T, F, O, D} = V64M, B = V64M_B, isWater = k => k < 0 || T[k] < 10, isSea = k => k < 0 || T[k] === 0;
  const d1 = k => k < 0 || (T[k] === 0 && D[k] >= 3 && O[k] !== 4), d2 = k => k < 0 || (T[k] === 0 && D[k] >= 7), dirt = k => k >= 0 && T[k] >= 11 && T[k] <= 13, hill = k => k >= 0 && O[k] === 1;
  for(let i = 0; i < N; i++){ const k = j*N + i, x = i*16, y = j*16, t = T[k];
    if(t < 10){
      if(t === 1){ v64mAuto(gw, B.fresh, isWater, i, j, x, y); continue; }
      v64mAuto(gw, B.sand, isWater, i, j, x, y);
      if(d1(k)) v64mAuto(gw, B.deep1, d1, i, j, x, y);
      if(d2(k)) v64mAuto(gw, B.deep2, d2, i, j, x, y);
      // sóng nhỏ (nướng sẵn)
      const hs = v64mHash(i, j); if(D[k] >= 2 && hs < .2){ gw.fillStyle = 'rgba(255,255,255,.45)'; const wx = x + 3 + Math.floor(hs*40) % 8, wy = y + 4 + Math.floor(hs*97) % 8; gw.fillRect(wx, wy, 2, 1); gw.fillRect(wx + 2, wy - 1, 2, 1); gw.fillRect(wx + 4, wy, 2, 1); }
      continue; }
    const hs = v64mHash(i, j), gc = hs < .55 ? [0, 0] : [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]][Math.floor((hs - .55)/.45*8) % 8];
    if(dirt(k)) v64mAuto(gl, B.dirt, dirt, i, j, x, y); else v64mTile(gl, gc[0], gc[1], x, y);
    if(O[k] === 1) v64mAuto(gl, B.hill, hill, i, j, x, y);
    if(t === 14){ v64mTile(gl, 0, 28, x, y); }
    const f = F[k]; if(f === 1 || f === 2){ const same = q => q >= 0 && F[q] === f; v64mAuto(gl, f === 1 ? B.pine : B.pine2, same, i, j, x, y); }
    else if(f === 3){ v64mTile(gl, hs < .5 ? 3 : 0, hs < .5 ? 26 : 27, x, y); }
    else if(f === 4){ v64mTile(gl, 3, 28, x, y); }
  }
}
// cầu, đá, rạn, nhà làng, lều, biểu tượng khu (vẽ sau lớp màu đông nên không bị tô trắng)
function v64mTop(g){
  const {N, M, T, O, X0, Y0, CELL} = V64M, at = (x, y) => [Math.floor((x - X0)/CELL*16), Math.floor((y - Y0)/CELL*16)];
  for(let j = 0; j < M; j++) for(let i = 0; i < N; i++){ const k = j*N + i, o = O[k]; if(!o || o === 1) continue; const x = i*16, y = j*16;
    if(o === 2){ const L = q => q >= 0 && (O[q] === 2 || T[q] >= 10), hz = (i > 0 && L(k - 1)) || (i < N - 1 && L(k + 1)), vt = (j > 0 && L(k - N)) || (j < M - 1 && L(k + N));
      if(hz && !vt) v64mTile(g, 12, 32, x, y); else v64mTile(g, 10, 31, x, y); }
    else if(o === 3) v64mTile(g, 0, 26, x, y);
    else if(o === 4){ g.fillStyle = 'rgba(120,230,215,.55)'; g.fillRect(x + 3, y + 4, 10, 8); }
  }
  if(V52W && V52W.on){ (V52W.houses || []).forEach((h, n) => { const p = at(h.x, h.y); v64mTile(g, [7, 8, 9, 15, 16][n % 5], n % 5 > 2 ? 33 : 26 + (n % 3), p[0] - 8, p[1] - 14); });
    (V52W.tents || []).slice(0, 4).forEach(t => { const p = at(t.x, t.y); v64mTile(g, 4, 26, p[0] - 8, p[1] - 14); });
    (V52W.mills || []).slice(0, 4).forEach(t => { const p = at(t.x, t.y); v64mTile(g, 5, 26, p[0] - 8, p[1] - 14); }); }
  // biểu tượng khu: to (2×2) trước, rồi nhỏ; bỏ nhà lẻ (đã có phố nhà)
  const P = (typeof mapPlaces === 'function' ? mapPlaces() : []).filter(p => !p.small && p.x != null).map(p => [p, V64M_IC[V64M_K[p.k] || V64M_CAT[p.cat] || 'sign'] || V64M_IC.sign]).sort((a, b) => a[0].y - b[0].y);
  P.forEach(([p, ic]) => { const q = at(p.x, p.y); v64mTile(g, ic[0], ic[1], q[0] - ic[2]*8, q[1] - ic[3]*16 + 6, ic[2], ic[3]); });
}
// dựng dần: mỗi khung ~6ms, xong thì đổi sang ảnh mới
function v64mBuild(){
  if(!V64M.tsOk || V64M.job) return; const key = v64mKey(); if(key === V64M.key) return;
  let t0 = performance.now(); try { v64mGrid(); } catch(e){ console.warn('v64m grid', e); return; }
  const {N, M} = V64M, mk = () => { const c = document.createElement('canvas'); c.width = N*16; c.height = M*16; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const [cw2, gw] = mk(), [cl, gl] = mk(), job = V64M.job = {j:0, key}; V64M.dbg.grid = Math.round(performance.now() - t0);
  const step = () => { if(V64M.job !== job) return; const s = performance.now();
    try { while(job.j < M && performance.now() - s < 6) v64mRow(gw, gl, job.j++); } catch(e){ console.warn('v64m row', e); V64M.job = null; return; }
    if(job.j < M) return requestAnimationFrame(step);
    try {
      if(key[0] === 'W'){ gl.globalCompositeOperation = 'source-atop'; gl.fillStyle = 'rgba(236,244,250,.62)'; gl.fillRect(0, 0, cl.width, cl.height); gl.globalCompositeOperation = 'source-over'; }
      gw.drawImage(cl, 0, 0); v64mTop(gw);
    } catch(e){ console.warn('v64m top', e); }
    V64M.img = cw2; V64M.key = key; V64M.job = null; V64M.dbg.build = Math.round(performance.now() - t0); V64M.dbg.size = cw2.width;
    cl.width = cl.height = 1; };
  requestAnimationFrame(step);
}
function v64mReady(){ return V64M.on && !!V64M.img; }

// ---------- 3. nền bản đồ lớn + minimap ----------
function v64mBg(g, x0, y0, x1, y1){
  if(!v64mReady()) return V64M.bg0(g, x0, y0, x1, y1);
  const im = V64M.img, k = 16/V64M.CELL, X0 = V64M.X0, Y0 = V64M.Y0;
  g.fillStyle = V64M.deep; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const ax = Math.max(X0, x0), ay = Math.max(Y0, y0), bx = Math.min(X0 + im.width/k, x1), by = Math.min(Y0 + im.height/k, y1);
  g.imageSmoothingEnabled = false;
  if(bx > ax && by > ay) g.drawImage(im, (ax - X0)*k, (ay - Y0)*k, (bx - ax)*k, (by - ay)*k, ax, ay, bx - ax, by - ay);
  if(V55S.on) try { v55sMapShips(g); } catch(e){}
}
// mũi tên người chơi: hướng theo chuyển động thật
function v64mHead(){ if(!PLAYER) return V64M.hd; const p = v46Pos(PLAYER); if(V64M.hp){ const dx = p[0] - V64M.hp[0], dy = p[1] - V64M.hp[1]; if(dx*dx + dy*dy > 9){ V64M.hd = Math.atan2(dy, dx); V64M.hp = p; } } else { V64M.hp = p; V64M.hd = (PLAYER.dir || 1) < 0 ? Math.PI : 0; } return V64M.hd; }
function v64mArrow(g, x, y, a, s){ g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(11*s, 0); g.lineTo(-7*s, -8*s); g.lineTo(-3*s, 0); g.lineTo(-7*s, 8*s); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 4*s; g.strokeStyle = '#0a0f22'; g.stroke(); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 1.6*s; g.strokeStyle = '#fff'; g.stroke(); g.restore(); }

// nhãn: thứ tự ưu tiên, tự dời (dưới → trên → phải → trái), không chồng nhau
function v64mPri(p){ return (p.k === 'gate' ? 1000 : 0) + (p.small ? -500 : 0) + (V46.Z && V46.Z.some(z => z.id === p.k) ? 200 : 100) + (p.cat === 'school' ? 30 : 0) + (/^v5/.test(p.k) ? 20 : 0); }
function v64mLabels(g, P, ox, oy, z, Wc, Hc){
  if(V64M.labP !== P){ V64M.labP = P; V64M.labS = P.slice().sort((a, b) => v64mPri(b) - v64mPri(a)); }
  const box = V64M.lab; box.length = 0; const hit = (x0, y0, x1, y1) => { for(let n = 0; n < box.length; n += 4) if(x0 < box[n + 2] && x1 > box[n] && y0 < box[n + 3] && y1 > box[n + 1]) return true; return false; };
  g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  // né thanh trên + nút "Vị trí của tôi" + thẻ địa điểm (đo lại ~1 lần/giây)
  if(!V64M.ui || realT - V64M.uiT > 1){ V64M.uiT = realT; const cr = g.canvas.getBoundingClientRect(); V64M.ui = ['#v32Map .v32mtop', '#v32MapMe', '#v32MapCard', '#v32MapList'].map(q => document.querySelector(q)).filter(e => e && !e.hidden).map(e => { const r = e.getBoundingClientRect(); return [r.left - cr.left - 4, r.top - cr.top - 4, r.right - cr.left + 4, r.bottom - cr.top + 4]; }); }
  V64M.ui.forEach(r => box.push(r[0], r[1], r[2], r[3]));
  const me = PLAYER && PLAYER.visible ? v46Pos(PLAYER) : null; if(me){ const x = ox + me[0]*z, y = oy + me[1]*z; box.push(x - 16, y - 16, x + 16, y + 16); }
  for(const p of V64M.labS){ if(p.small && z < .16) continue; const x = ox + p.x*z, y = oy + p.y*z; if(x < -80 || x > Wc + 80 || y < -40 || y > Hc + 40) continue;
    const name = String(p.name || '').trim(); if(!name || /undefined/.test(name)) continue; const t = (p.ic ? p.ic + ' ' : '') + name;
    if(p._v64t !== t){ p._v64t = t; p._v64w = g.measureText(t).width + 16; } const w = p._v64w, h = 24;
    const C = [[x - w/2, y + 10], [x - w/2, y - 10 - h], [x + 12, y - h/2], [x - 12 - w, y - h/2], [x - w/2, y + 34], [x - w/2, y - 34 - h]]; let at = null;
    for(const c of C){ if(c[0] < 2 || c[1] < 2 || c[0] + w > Wc - 2 || c[1] + h > Hc - 2) continue; if(!hit(c[0], c[1], c[0] + w, c[1] + h)){ at = c; break; } }
    if(!at) continue; box.push(at[0] - 3, at[1] - 3, at[0] + w + 3, at[1] + h + 3);
    const sel = MAP.sel === p; g.fillStyle = '#0a0f22'; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI*2); g.fill(); g.fillStyle = sel ? '#ffd23f' : '#fff'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI*2); g.fill();
    g.fillStyle = sel ? 'rgba(255,210,63,.96)' : 'rgba(10,15,34,.84)'; g.beginPath(); g.roundRect ? g.roundRect(at[0], at[1], w, h, 8) : g.rect(at[0], at[1], w, h); g.fill();
    g.fillStyle = sel ? '#1a1206' : '#fff'; g.fillText(t, at[0] + w/2, at[1] + h/2 + 1); }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
function v64mMapDraw(){
  if(!V32.mapOpen) return; if(!v64mReady()) return V64M.md0();
  const cv = $('#v32MapCv'), g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth, Hc = cv.clientHeight, X = V55S, on = X.on;
  const BX0 = on ? X.X0 : 0, BY0 = on ? X.Y0 : 0, BX1 = on ? X.X1 : V46L.W, BY1 = on ? X.Y1 : V46L.H;
  if(cv.width !== Math.round(Wc*dpr) || cv.height !== Math.round(Hc*dpr)){ cv.width = Math.round(Wc*dpr); cv.height = Math.round(Hc*dpr); }
  if(!MAP.drag && MAP.pins.size === 0 && (Math.abs(MAP.vx) > .01 || Math.abs(MAP.vy) > .01)){ MAP.cx -= MAP.vx/MAP.z; MAP.cy -= MAP.vy/MAP.z; MAP.vx *= .92; MAP.vy *= .92; }
  MAP.z = Math.max(Math.min(Wc, Hc)/(BX1 - BX0)*.9, Math.min(2, MAP.z)); MAP.cx = Math.max(BX0, Math.min(BX1, MAP.cx)); MAP.cy = Math.max(BY0, Math.min(BY1, MAP.cy));
  const z = MAP.z; g.setTransform(dpr*z, 0, 0, dpr*z, dpr*(Wc/2 - MAP.cx*z), dpr*(Hc/2 - MAP.cy*z));
  v64mBg(g, MAP.cx - Wc/2/z, MAP.cy - Hc/2/z, MAP.cx + Wc/2/z, MAP.cy + Hc/2/z);
  const pts = v46GuideRoute(); if(pts){ g.lineJoin = 'round'; g.strokeStyle = 'rgba(10,15,34,.6)'; g.lineWidth = 8/z; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    g.strokeStyle = '#ffd23f'; g.lineWidth = 5/z; g.setLineDash([10/z, 7/z]); g.lineDashOffset = -(realT*30) % 17/z; g.stroke(); g.setLineDash([]); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); const ox = Wc/2 - MAP.cx*z, oy = Hc/2 - MAP.cy*z;
  v64mLabels(g, mapPlaces(), ox, oy, z, Wc, Hc);
  (ONLINE.peers || []).forEach(q => { const pr = q.presence || {}; if(pr.x == null) return; const n = v46ToNew(+pr.x, +pr.y), x = ox + n[0]*z, y = oy + n[1]*z; g.fillStyle = '#0a0f22'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI*2); g.fill(); g.fillStyle = '#26c6da'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI*2); g.fill(); });
  if(PLAYER && PLAYER.visible){ const n = v46Pos(PLAYER), x = ox + n[0]*z, y = oy + n[1]*z, pr = (realT*1.2) % 1; g.strokeStyle = `rgba(255,210,63,${1 - pr})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 10 + pr*20, 0, Math.PI*2); g.stroke();
    v64mArrow(g, x, y, v64mHead(), 1.25); }
  MAP.raf = requestAnimationFrame(mapDraw);
}
function v64mMini(){
  const r = V64M.rm0(); if(!v64mReady() || !V46.on || V46.sky) return r;
  try { const R = miniCv.getBoundingClientRect(); if(!R.width) return r; const dpr = Math.min(2, window.devicePixelRatio || 1), g = miniCtx, mx = R.width/2, my = R.height/2;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(mx, my, 12, 0, Math.PI*2); g.fill(); v64mArrow(g, mx, my, v64mHead(), .95); } catch(e){}
  return r;
}

// ---------- 4. khởi động ----------
function v64mInit(){
  if(typeof V46 === 'undefined' || !V46.on || typeof V55S === 'undefined') return;
  V64M.on = true; V64M.bg0 = v46MapBg; V64M.md0 = mapDraw; V64M.rm0 = rmRender;
  v46MapBg = v64mBg; mapDraw = v64mMapDraw; rmRender = v64mMini;
  const ts = new Image(); ts.onload = () => { V64M.ts = ts; V64M.tsOk = true;
    try { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.drawImage(ts, 23*16 + 8, 11*16 + 8, 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; V64M.deep = `rgb(${d[0]},${d[1]},${d[2]})`; } catch(e){}
    setTimeout(v64mBuild, 1200); };
  ts.onerror = () => console.warn('v64m: không tải được tileset Puny World'); ts.src = V64M_SRC;
  // thế giới đổi (sắp xếp v48m, mùa đông v49…) → dựng lại; chỉ kiểm tra chuỗi khoá 2 giây/lần
  setInterval(() => { if(V64M.tsOk && !V64M.job && v64mKey() !== V64M.key) v64mBuild(); }, 2000);
  const op = v32MapOpen; v32MapOpen = function(){ v64mBuild(); return op.apply(this, arguments); }; openBigMap = v32MapOpen;
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v64m = V64M;
}
