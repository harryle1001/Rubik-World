// ================= v61f · 1/2 CHỐNG KHỰNG: dựng lại cache nền theo từng phần, qua nhiều khung hình =================
// Trước đây mỗi lần đổi mùa (v49 đổi mùa mỗi 6 giờ trong game, đổi giờ/ngày-đêm cũng có thể đổi mùa) game dựng lại
// NGAY TRONG MỘT KHUNG: nền cũ buildGround + buildNorth, ~40 miếng nền khu v47wPatch (getImageData), ảnh toàn cảnh 2048²
// và 6 ô nền 1024² → một khung 1–2 giây. Giờ: vẫn vẽ cache cũ, dựng cache mới từng phần trong nền (≤ ~8 ms mỗi khung),
// xong thì đổi một lần. Ảnh toàn cảnh bị xoá vì lý do khác (đổi mẫu nhà, sân bay…) cũng dựng lại từng dải như vậy.
const V61F = {job:null, ovJob:null, lastOv:null, budget:8, stat:{steps:0, jobs:0, ovJobs:0}};
const V61F_STRIP = 1400;   // 1400 đơn vị thế giới = đúng 256 px ảnh toàn cảnh → ghép dải không lộ mép

// ---------- các bước dựng ảnh toàn cảnh theo dải (dùng chung) ----------
function* v61fOvSteps(out){
  const N = 2048, s = V46T.OVS, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  for(let y0 = 0; y0 < V46L.H; y0 += V61F_STRIP){ const h = Math.min(V61F_STRIP, V46L.H - y0), prev = ctx; ctx = g;
    try { g.save(); g.setTransform(s, 0, 0, s, 0, 0); g.beginPath(); g.rect(0, y0, V46L.W, h); g.clip(); v46Paint(g, 0, y0, V46L.W, h, 2); } catch(e){ console.warn('v61f ov', e); } finally { g.restore(); ctx = prev; }
    yield; }
  const prev = ctx; ctx = g; try { g.setTransform(s, 0, 0, s, 0, 0); v46OverviewBuildings(g); } catch(e){ console.warn('v61f ovb', e); } finally { g.setTransform(1, 0, 0, 1, 0, 0); ctx = prev; }
  out.ov = c; yield* v61fWarm([c]);
}

// ---------- đổi mùa: dựng nền cũ, miếng nền khu, ảnh toàn cảnh, ô nền đang nhìn — rồi đổi một lần ----------
function* v61fSeasonJob(J){
  const s = J.s, old = () => ({gc:groundCache, gs:groundSeason, nc:northCache, ns:northSeason, wk:V47W.key, wp:V47W.pc, L0:V46T.L0, L1:V46T.L1, tk:V46T.key, tg:V46T.gc, tn:V46T.nc});
  const put = o => { groundCache = o.gc; groundSeason = o.gs; northCache = o.nc; northSeason = o.ns; V47W.key = o.wk; V47W.pc = o.wp; V46T.L0 = o.L0; V46T.L1 = o.L1; V46T.key = o.tk; V46T.gc = o.tg; V46T.nc = o.tn; };
  const N = {gs:s, ns:s, wp:{}, L0:new Map(), L1:new Map(), tk:s};
  const inNew = f => { const o = old(); put(Object.assign({}, o, N)); try { f(); } catch(e){ console.warn('v61f season', e); } finally { Object.assign(N, {gc:groundCache, nc:northCache, wk:V47W.key, wp:V47W.pc}); put(o); } };
  { const o = old(); try { buildGround(); N.gc = groundCache; } finally { put(o); } } yield;
  { const o = old(); try { buildNorth(); N.nc = northCache; } finally { put(o); } } yield;
  N.tg = N.gc; N.tn = N.nc; N.wk = s + '|' + (N.gc ? 1 : 0) + (N.nc ? 1 : 0);
  for(const z of V46.Z){ if(z.flip) continue; inNew(() => v47wPatch(z)); yield; }
  // ảnh toàn cảnh mới: mỗi dải chạy trong bối cảnh cache mùa mới
  const R2 = {}, it = v61fOvSteps(R2); for(;;){ let d; inNew(() => { d = it.next().done; }); if(d) break; yield; }
  N.ov = R2.ov;
  // ô nền quanh camera (lod đang dùng) để vừa đổi xong là nét ngay
  const VBn = V46.VBn || v46View(), lod = cam.z >= .55 ? 0 : 1, span = V46T.TS*(lod ? 2 : 1), ax = Math.max(0, VBn.x0), ay = Math.max(0, VBn.y0), bx = Math.min(V46L.W, VBn.x1), by = Math.min(V46L.H, VBn.y1);
  if(cam.z >= .2) for(let j = Math.floor(ay/span); j*span < by; j++) for(let i = Math.floor(ax/span); i*span < bx; i++){ inNew(() => { V46T.budget = 1; v61fTile0(lod, i, j); }); yield; }
  // làm nóng: vẽ thử 1 px mỗi canvas mới lên màn hình chính (bị phủ ngay khung sau) để lần vẽ thật không phải chờ tải ảnh
  yield* v61fWarm([N.ov, ...N.L0.values(), ...N.L1.values()]);
  // đổi một lần
  put(Object.assign(old(), N)); V46T.ov = N.ov; V61F.lastOv = null; J.done = true;
}

function* v61fWarm(list){ for(const c of list){ if(!c) continue; try { mainCtx.save(); mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.globalAlpha = 1; mainCtx.drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); mainCtx.restore(); } catch(e){} yield; } }

// ---------- bọc hàm v46 ----------
let v61fCC0 = null, v61fTile0 = null, v61fOv0 = null;
function v61fCheckCaches(){
  const ready = groundCache && northCache && (V46T.ov || V61F.lastOv);
  if(!ready || season === groundSeason && season === northSeason){ if(V61F.job && V61F.job.s !== season) V61F.job = null; return v61fCC0(); }
  if(!V61F.job || V61F.job.s !== season){ V61F.job = {s:season, it:null, done:false}; V61F.job.it = v61fSeasonJob(V61F.job); V61F.stat.jobs++; }
  // còn đang dựng: giữ nguyên cache mùa cũ (không gọi bản gốc để khỏi dựng hết trong một khung)
}
function v61fTile(lod, i, j){
  if(V61F.job){ const M = lod ? V46T.L1 : V46T.L0, c = M.get(i + ',' + j); if(c){ M.delete(i + ',' + j); M.set(i + ',' + j, c); } return c || null; }
  if(V46T.budget > 1) V46T.budget = 1;   // tối đa 1 ô 1024² mỗi khung (ảnh toàn cảnh vẫn lót bên dưới)
  return v61fTile0(lod, i, j);
}
function v61fOverview(){
  if(V46T.ov){ const c = v61fOv0(); V61F.lastOv = c; return c; }
  if(!V61F.lastOv) return (V61F.lastOv = v61fOv0());   // lần đầu: dựng ngay
  if(!V61F.ovJob && !V61F.job){ const J = V61F.ovJob = {r:{}, it:null}; J.it = v61fOvSteps(J.r); V61F.stat.ovJobs++; }
  return V61F.lastOv;
}

// ---------- chạy việc nền: mỗi khung tối đa ~8 ms ----------
function v61fPump(){
  requestAnimationFrame(v61fPump);
  if(typeof paused !== 'undefined' && document.hidden) return;
  const t0 = performance.now();
  for(let n = 0; n < 40; n++){
    const J = V61F.job && !V61F.job.done ? V61F.job : V61F.ovJob; if(!J) break;
    let d = false; try { d = J.it.next().done; } catch(e){ console.warn('v61f job', e); d = true; if(J === V61F.job) V61F.job = null; }
    V61F.stat.steps++;
    if(J === V61F.job && (J.done || d)){ V61F.job = null; V61F.ovJob = null; }
    else if(J === V61F.ovJob && d){ V61F.ovJob = null; if(!V46T.ov && J.r.ov){ V46T.ov = J.r.ov; try { V61F.lastOv = v61fOv0(); } catch(e){} } }
    if(performance.now() - t0 > V61F.budget) break;
  }
}

function v61fCacheInit(){
  if(typeof V46 === 'undefined' || !V46.on || typeof v46CheckCaches !== 'function') return;
  v61fCC0 = v46CheckCaches; v46CheckCaches = v61fCheckCaches;
  v61fTile0 = v46Tile; v46Tile = v61fTile;
  v61fOv0 = v46Overview; v46Overview = v61fOverview;
  requestAnimationFrame(v61fPump);
}

// ---------- init chung v61f (gọi ở cuối extFinalInit) ----------
function v61fInit(){
  try { v61fCacheInit(); } catch(e){ console.warn('v61f cache', e); }
  try { if(typeof v61fPerfInit === 'function') v61fPerfInit(); } catch(e){ console.warn('v61f perf', e); }
}
