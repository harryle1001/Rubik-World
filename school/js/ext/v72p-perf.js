// ================= v72p · ĐI MƯỢT KHẮP BẢN ĐỒ + TÊN TRÊN ĐẦU KHÔNG CHE NGƯỜI =================
// Chủ game: "có chỗ lag có chỗ đi mượt, có chỗ chạy tới thì giật giật". Đo được: mỗi khi camera chạm một ô nền 1024² chưa nướng,
// v46Tile nướng cả ô trong MỘT khung (13–29 ms ở máy nhanh ×4 chậm, cộng vẽ lần đầu → khung 60–117 ms).
// Cách sửa: nướng TRƯỚC các ô sắp tới (theo hướng camera đang đi + vòng quanh màn hình) vào những khung máy đang dư sức,
// mỗi lần 1 ô; khung kế tiếp "làm nóng" ô đó (vẽ 1 px lên màn hình) để lần vẽ thật không phải chờ tải ảnh.
// (Thử chia ô thành dải nhỏ: mỗi dải tốn ~3 ms cố định → tổng chậm hơn, nên bỏ.)
// Kèm: tên trên đầu nhân vật cao hơn một chút; khi cưỡi thú / đạp xe thì nâng theo chiều cao chỗ ngồi.
const V72P = {pre:false, lx:null, ly:null, vx:0, vy:0, gap:0, avg:0, lt:0, warm:[], stat:{tiles:0}};
// chiều cao thêm cho nhãn tên (đơn vị thế giới, trước khi nhân hệ số v53v)
function v72Lift(a){
  let h = 8;                                                     // xích tên lên khỏi tóc
  if(a.mount && !a.flying && typeof ANI !== 'undefined' && ANI[a.mount]) h += Math.max(0, -(ANI[a.mount].ride || 0));
  else if(a.cycling && !a.flying) h += 9;
  return h;
}
function v72pKey(lod, i, j){ return lod + ':' + i + ',' + j; }
function v72pPick(VBn){
  // ô cần có sẵn: màn hình hiện tại nới rộng 0.6 ô, và dời theo hướng đi ~1.2 giây tới
  const lod = cam.z >= .55 ? 0 : 1, span = V46T.TS*(lod ? 2 : 1), M = lod ? V46T.L1 : V46T.L0;
  const ax = VBn.x0 + Math.min(0, V72P.vx*1.2), bx = VBn.x1 + Math.max(0, V72P.vx*1.2), ay = VBn.y0 + Math.min(0, V72P.vy*1.2), by = VBn.y1 + Math.max(0, V72P.vy*1.2);
  const m = span*.6, x0 = Math.max(0, ax - m), y0 = Math.max(0, ay - m), x1 = Math.min(V46L.W, bx + m), y1 = Math.min(V46L.H, by + m);
  const cx = (VBn.x0 + VBn.x1)/2 + V72P.vx*.8, cy = (VBn.y0 + VBn.y1)/2 + V72P.vy*.8; let best = null, bd = 1e18;
  for(let j = Math.floor(y0/span); j*span < y1; j++) for(let i = Math.floor(x0/span); i*span < x1; i++){
    if(M.has(i + ',' + j)) continue; const d = Math.hypot((i + .5)*span - cx, (j + .5)*span - cy); if(d < bd){ bd = d; best = {lod, i, j, span}; } }
  return best;
}
function v72pStep(VBn, dt){
  if(typeof V61F !== 'undefined' && V61F.job) return;          // đang đổi mùa: v61f lo
  if(cam.z < .2 || !V46.on || V46.sky) return;
  // khung này: làm nóng ô vừa nướng (đưa ảnh lên bộ nhớ hình) — tách riêng khỏi khung nướng
  if(V72P.warm.length){ const c = V72P.warm.shift(); try { mainCtx.save(); mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); mainCtx.restore(); } catch(e){} return; }
  // chỉ nướng khi máy đang dư sức: khung vừa rồi không chậm hơn mức thường lệ, và cách lần nướng trước ≥ 3 khung
  V72P.avg = V72P.avg ? V72P.avg*.95 + dt*.05 : dt;
  if(!V72P.pre) return;
  if(++V72P.gap < 3 || dt > V72P.avg*1.25 + 2) return;
  const p = v72pPick(VBn); if(!p) return;
  V72P.gap = 0; const keep = V46T.budget; V46T.budget = 1;
  try { const c = v46Tile(p.lod, p.i, p.j); if(c){ V72P.warm.push(c); V72P.stat.tiles++; } } finally { V46T.budget = keep; }
}

// ---------- dùng lại canvas ô nền đã bị bỏ (đo được: tạo canvas 1024² mới chiếm ~50% thời gian nướng + rác bộ nhớ 4 MB mỗi ô) ----------
// Thay v46Tile lúc nạp file (trước khi v61fInit giữ bản gốc) — logic y hệt bản trong v46/bake.js, chỉ khác chỗ lấy/trả canvas.
V72P.pool = [];
// ô nền 512² thay vì 1024²: mỗi lần gặp ô mới chỉ tốn ~¼ (nướng + đưa ảnh lên màn hình) → giật nhỏ hẳn; số ô giữ trong bộ nhớ ×4 để tổng diện tích như cũ
V46T.TS = 512; V72P.cap = [72, 40];
v46Tile = function(lod, i, j){
  const M = lod ? V46T.L1 : V46T.L0, k = i + ',' + j; let c = M.get(k);
  if(c){ M.delete(k); M.set(k, c); return c; }
  if(V46T.budget <= 0) return null; V46T.budget--;
  c = V72P.pool.pop(); let g;
  if(c){ g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); V72P.stat.reuse = (V72P.stat.reuse || 0) + 1; }
  else { c = document.createElement('canvas'); c.width = c.height = V46T.TS; g = c.getContext('2d'); }
  const span = V46T.TS*(lod ? 2 : 1), sc = 1/(lod ? 2 : 1);
  g.imageSmoothingEnabled = false; g.setTransform(sc, 0, 0, sc, -i*span*sc, -j*span*sc); const prev = ctx; ctx = g;
  try { v46Paint(g, i*span, j*span, span, span, lod); if(lod === 0) v46TileStatics(g, i*span, j*span, span); } catch(e){ console.warn('v46 tile', e); }
  ctx = prev; M.set(k, c); const cap = V72P.cap[lod ? 1 : 0];
  while(M.size > cap){ const ok = M.keys().next().value, old = M.get(ok); M.delete(ok); if(old && old.width === V46T.TS && V72P.pool.length < 12) V72P.pool.push(old); }
  return c;
};
function v72pInit(){
  // tên trên đầu: v72Lift được dùng trực tiếp trong drawLabels (map.js) và v53vLabels (v53v-vibe.js)
  // nướng trước ô nền: chạy sau mỗi lần vẽ mặt đất
  const dg0 = v46DrawGround; v46DrawGround = function(VBn){
    const r = dg0.apply(this, arguments);
    try { const cx = cam.x, cy = cam.y; if(V72P.lx != null){ const k = .15; V72P.vx = V72P.vx*(1 - k) + (cx - V72P.lx)*60*k; V72P.vy = V72P.vy*(1 - k) + (cy - V72P.ly)*60*k; } V72P.lx = cx; V72P.ly = cy; const now = performance.now(), dt = V72P.lt ? now - V72P.lt : 16; V72P.lt = now; v72pStep(VBn, dt); } catch(e){ console.warn('v72p', e); }
    return r;
  };
}
