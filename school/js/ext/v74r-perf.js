// ================= v74r · ĐỘ MƯỢT KHI CHƠI (không đổi thiết kế / tính năng — chỉ làm nhanh hơn) =================
// Đo bằng CPU profile (tools/qa/v74r-prof.js): máy tính 1440×900 “Cao” mất ~40% thời gian ở drawImage của nền;
// điện thoại ngang CPU ×4: khung 130–180 ms do bàn cờ NPC (chess.js) + nướng/vẽ ô nền + vẽ lần đầu ảnh toà nhà.
// Mọi tên toàn cục có tiền tố v74r / V74R. Thay hàm cũ ở cấp file (trước các lớp bọc lúc init) hoặc bọc lúc v74rInit.
const V74R = {on:!/[?&]v74roff/.test(location.search), stat:{skip:0, full:0, chess:0, warm:0, lbl:0}, tl:[]};

// ---------- 1. Nền: bỏ 3 lớp bị che kín ----------
// v55s vẽ: màu biển sâu (fillRect cả màn) → ảnh biển xa (phóng to, lọc mịn) → ảnh toàn cảnh đảo → các ô 512² đè kín lên.
// Khi mọi ô trong màn hình đã có sẵn thì 3 lớp dưới bị che hoàn toàn (ô nền mờ đục: v46Paint tô kín ô trước tiên)
// → chỉ vẽ ô. Thiếu ô nào (đang chờ nướng) hoặc ngoài vùng ô → vẽ đủ như cũ. Kết quả từng điểm ảnh y hệt (tools/qa/v74r-same.js).
// đếm ô phải nướng ngay trong lúc vẽ (không kịp nướng trước) — để đo
const v74rT0 = v46Tile;
v46Tile = function(lod, i, j){ const M = lod ? V46T.L1 : V46T.L0, had = M.has(i + ',' + j), c = v74rT0(lod, i, j); if(c && !had && V74R.inDG) V74R.stat.inDG = (V74R.stat.inDG || 0) + 1; return c; };
const v74rDG0 = v46DrawGround;
v46DrawGround = function(VBn){
  const z = cam.z;
  if(!V74R.on || z < .2) return v74rDG0(VBn);
  v46CheckCaches(); V46T.budget = V46T.L0.size < 4 ? 6 : 1;
  const X = V55S, lod = z >= .55 ? 0 : 1, span = V46T.TS*(lod ? 2 : 1), T0x = X.on ? X.X0 : 0, T0y = X.on ? X.Y0 : 0, T1x = X.on ? X.X1 : V46L.W, T1y = X.on ? X.Y1 : V46L.H;
  const tx0 = Math.max(T0x, VBn.x0), ty0 = Math.max(T0y, VBn.y0), tx1 = Math.min(T1x, VBn.x1), ty1 = Math.min(T1y, VBn.y1);
  V74R.inDG = true; const L = V74R.tl; L.length = 0; let ok = tx0 === VBn.x0 && ty0 === VBn.y0 && tx1 === VBn.x1 && ty1 === VBn.y1;
  for(let j = Math.floor(ty0/span); j*span < ty1; j++) for(let i = Math.floor(tx0/span); i*span < tx1; i++){ const t = v46Tile(lod, i, j); if(t){ L.push(t, i*span, j*span); } else ok = false; }
  if(!ok){
    // như bản v55s: lớp dưới rồi các ô (ô đã lấy ở trên — gọi lại v46Tile chỉ trả ô có sẵn, không nướng thêm)
    V74R.stat.full++; const ov = v46Overview(), s = V46T.OVS;
    ctx.fillStyle = X.on ? v55sDeep() : S().sea2; ctx.fillRect(VBn.x0, VBn.y0, VBn.x1 - VBn.x0, VBn.y1 - VBn.y0);
    if(X.on){ const fv = v55sFar(), fs = fv.width/(X.X1 - X.X0), ax = Math.max(X.X0, VBn.x0), ay = Math.max(X.Y0, VBn.y0), bx = Math.min(X.X1, VBn.x1), by = Math.min(X.Y1, VBn.y1);
      if(bx > ax && by > ay){ ctx.imageSmoothingEnabled = true; ctx.drawImage(fv, (ax - X.X0)*fs, (ay - X.Y0)*fs, (bx - ax)*fs, (by - ay)*fs, ax, ay, bx - ax, by - ay); ctx.imageSmoothingEnabled = false; } }
    const ax = Math.max(0, VBn.x0), ay = Math.max(0, VBn.y0), bx = Math.min(V46L.W, VBn.x1), by = Math.min(V46L.H, VBn.y1);
    if(bx > ax && by > ay) ctx.drawImage(ov, ax*s, ay*s, (bx - ax)*s, (by - ay)*s, ax, ay, bx - ax, by - ay);
  } else V74R.stat.skip++;
  for(let k = 0; k < L.length; k += 3) ctx.drawImage(L[k], L[k + 1], L[k + 2], span, span);
  L.length = 0;
};

// ---------- 2. Bàn cờ NPC: cùng cách chọn nước, rẻ hơn và chia theo thời gian ----------
// Đo: v61fTableMove (chess.js) 40–54 ms trong một khung ở CPU ×4 (5 bàn × 2 nước thử/khung, mỗi nước sinh nước đối thủ 2 lần).
// (a) in_checkmate() = in_check() && moves().length === 0 → dùng luôn danh sách nước đối thủ vừa sinh (bớt ~½ việc, kết quả y hệt);
// (b) cả 5 bàn chung một ngân sách ~1,2 ms mỗi khung (ít nhất 1 nước thử/khung), lần lượt xoay vòng — nước đi chỉ đến chậm vài khung.
function* v74rTableMove(g){
  const ms = g.moves({verbose:true}); if(!ms.length) return null;
  let best = null, bs = -1e9;
  for(const m of ms){
    let s = Math.random()*90;
    if(m.captured) s += PV[m.captured] - PV[m.piece]*.1;
    if(m.flags.includes('p')) s += 700;
    g.move(m); const opp = g.moves({verbose:true}), chk = g.in_check();
    if(chk && !opp.length) s += 5000; else if(chk) s += 40;
    let worst = 0; for(const o of opp) if(o.captured) worst = Math.max(worst, PV[o.captured]); s -= worst*.85;
    g.undo();
    if(s > bs){ bs = s; best = m; }
    yield;
  }
  return best;
}
// (c) có Web Worker: cả việc chọn nước chạy ở luồng phụ (cùng thuật toán trên, chép bàn cờ bằng FEN) → luồng chính không tốn gì.
//     Worker lỗi / không trả lời sau 4 s → quay về cách (b) trên luồng chính.
V74R.cr = 0; V74R.wk = null; V74R.wid = 0; V74R.wfail = 0;
function v74rWorker(){
  if(V74R.wk !== null) return V74R.wk; V74R.wk = false;
  try { if(typeof Worker !== 'function' || typeof Chess !== 'function' || V74R.wfail > 2) return false;
    const src = 'var Chess = ' + Chess.toString() + ';\nvar PV = ' + JSON.stringify(PV) + ';\nvar TM = (' + v74rTableMove.toString() + ');\n'
      + 'onmessage = function(e){ var d = e.data, g = new Chess(d.fen), it = TM(g), r; do { r = it.next(); } while(!r.done);'
      + ' var m = r.value; postMessage({id:d.id, m: m ? {from:m.from, to:m.to, promotion:m.promotion} : null}); };';
    const w = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    w.onmessage = e => { const d = e.data, T = TABLES.find(t => t.v74w && t.v74w.id === d.id); if(!T) return; const i = TABLES.indexOf(T); const f = T.v74w.fen; T.v74w = null; T.v61f = null; if(T.g.fen() !== f) return; V74R.stat.wk = (V74R.stat.wk || 0) + 1; v61fTableDone(T, i, d.m); };
    w.onerror = () => { V74R.wfail++; V74R.wk = null; try { w.terminate(); } catch(e){} TABLES.forEach(T => { if(T.v74w){ T.v74w = null; T.v61f = null; T.next = 0; } }); };
    V74R.wk = w; } catch(e){ V74R.wk = false; }
  return V74R.wk;
}
function v74rUpdateTables(dtR){
  const t0 = performance.now(), B = 1.2, n = TABLES.length; let steps = 0;
  const go = () => steps === 0 || performance.now() - t0 < B;
  for(let k = 0; k < n; k++){ const i = (V74R.cr + k) % n, T = TABLES[i];
    if(T.v74w){ if(performance.now() - T.v74w.t > 4000){ V74R.wfail++; T.v74w = null; T.v61f = v74rTableMove(T.g); } else continue; }
    if(T.v61f){ while(go()){ steps++; const r = T.v61f.next(); if(r.done){ T.v61f = null; v61fTableDone(T, i, r.value); break; } } continue; }
    const pl = tablePlayers(i); if(!pl[0] || !pl[1]) continue;
    T.next -= dtR; if(T.next > 0) continue;
    if(T.over){ T.g.reset(); T.over = 0; T.result = ''; T.moves = 0; T.last = null; T.next = 2; if(watchT === i) renderWatch(); continue; }
    const wk = v74rWorker(); if(wk){ const id = ++V74R.wid, fen = T.g.fen(); T.v74w = {id, fen, t:performance.now()}; T.v61f = 1; try { wk.postMessage({id, fen}); continue; } catch(e){ T.v74w = null; } }
    T.v61f = v74rTableMove(T.g); while(go()){ steps++; const r = T.v61f.next(); if(r.done){ T.v61f = null; v61fTableDone(T, i, r.value); break; } }
  }
  V74R.cr = (V74R.cr + 1) % Math.max(1, n); V74R.stat.chess += steps;
}

// ---------- 3. Làm nóng trước: khu (toà nhà, phòng, sprite công trình v64s/v65*/v66t bên trong) sắp vào màn hình ----------
// v46Render dựng bộ đệm tĩnh của một khu ngay khung đầu tiên khu đó lọt vào màn hình (31–55 ms ở CPU ×4, kèm vẽ lần đầu các sprite
// toà nhà). Giờ dựng sẵn khu nằm trên đường camera sắp đi (~1,5 s tới), mỗi lần 1 khu, chỉ ở khung máy đang dư sức và không trùng
// khung đã nướng ô nền. Khung sau “làm nóng” ảnh (vẽ 1 điểm ảnh) để lần vẽ thật không phải chờ. Nội dung khu y hệt (cùng hàm dựng).
V74R.zw = {gap:0, avg:0, lt:0, warm:null};
function v74rZoneWarm(VBn){
  const W = V74R.zw, now = performance.now(), dt = W.lt ? now - W.lt : 16; W.lt = now; W.avg = W.avg ? W.avg*.95 + dt*.05 : dt;
  if(W.warm){ const c = W.warm; W.warm = null; try { mainCtx.save(); mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); mainCtx.restore(); } catch(e){} return; }
  if(typeof V61F !== 'undefined' && V61F.job) return; if(cam.z < .2 || !V46.on || V46.sky) return;
  if(++W.gap < 4 || dt > W.avg*1.3 + 2) return;
  if(V72P.warm.length || V72P.stat.tiles !== W.tiles){ W.tiles = V72P.stat.tiles; return; }   // khung này đã nướng ô nền
  const vx = V72P.vx*1.5, vy = V72P.vy*1.5, m = 300, x0 = VBn.x0 + Math.min(0, vx) - m, x1 = VBn.x1 + Math.max(0, vx) + m, y0 = VBn.y0 + Math.min(0, vy) - m, y1 = VBn.y1 + Math.max(0, vy) + m;
  const cx = (VBn.x0 + VBn.x1)/2 + vx*.6, cy = (VBn.y0 + VBn.y1)/2 + vy*.6; let best = null, bd = 1e18;
  for(const z of V46.Z){ if(V46ZC[z.id] || z.flip) continue; const n = z.n; if(n.x1 < x0 || n.x0 > x1 || n.y1 < y0 || n.y0 > y1) continue;
    const d = Math.hypot((n.x0 + n.x1)/2 - cx, (n.y0 + n.y1)/2 - cy); if(d < bd){ bd = d; best = z; } }
  if(!best) return; W.gap = 0; const vb = VB;
  try { const c = v46ZoneCache(best); if(c && c.cv){ W.warm = c.cv; V74R.stat.zw = (V74R.stat.zw || 0) + 1; } } catch(e){} finally { VB = vb; }
}

// ---------- 4. Giải mã ảnh sẵn (tranh nhân vật, bộ ô Ninja Adventure) ----------
// Ảnh <img> đã tải xong nhưng chỉ được giải mã ở lần drawImage đầu tiên — ngay trong khung vẽ (đo: 1 khung 100 ms khi gặp nhân vật mới).
// img.decode() giải mã ở luồng phụ; quét mỗi 1,5 s các ảnh mới tải, mỗi ảnh một lần.
function v74rDecode(){
  if(typeof V64S !== 'object' || document.hidden) return; let n = 0;
  const go = im => { if(!im || im.v74d || !im.complete || !im.naturalWidth || typeof im.decode !== 'function' || n > 8) return; im.v74d = 1; n++; im.decode().then(() => { V74R.stat.dec = (V74R.stat.dec || 0) + 1; }, () => {}); };
  try { for(const k in V64S.img) go(V64S.img[k]); for(const k in V64S.ch){ const c = V64S.ch[k]; if(c && c.ok) go(c.im); } } catch(e){}
}

function v74rInit(){
  if(V74R.on) setInterval(v74rDecode, 1500);
  // làm nóng khu sắp tới: chạy sau mỗi lần vẽ mặt đất (sau bước nướng ô của v72p)
  if(V74R.on){ const dg = v46DrawGround; v46DrawGround = function(VBn){ const r = dg.apply(this, arguments); if(V74R.on) try { v74rZoneWarm(VBn); } catch(e){} return r; }; }
  // nướng trước ô nền sắp tới vào khung rảnh (cơ chế có sẵn của v72p nhưng chưa bật) — ô nướng trước, khung sau mới đưa lên màn hình
  if(V74R.on && !/[?&]v74rnopre/.test(location.search) && typeof V72P === 'object') V72P.pre = true;
  if(V74R.on && typeof updateTables === 'function' && typeof v61fUpdateTables === 'function' && updateTables === v61fUpdateTables) updateTables = v74rUpdateTables;
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v74r = V74R;
}
