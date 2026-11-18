// ================= v61l · TẢI NHANH: dữ liệu lớn và three.js chỉ tải khi cần =================
// Bản đóng gói (tools/build) thay js/data/books-text.js và js/data/piano-samples.js bằng
// "let TEXT_GZ = null; let PIANO_B64 = null;" và để dữ liệu thật trong dist/*.json (window.V61L_BUILD).
// Khi chạy từng file (dev / dự phòng) thì TEXT_GZ, PIANO_B64 đã có sẵn → các hàm bọc dưới đây không làm gì.
const V61L = {p:{}, three:null, pl:0};
const V61L_THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
function v61lAsset(k){
  const B = window.V61L_BUILD, u = B && B.lazy && B.lazy[k];
  if(!u) return Promise.reject(new Error('v61l: thiếu ' + k));
  return V61L.p[k] || (V61L.p[k] = fetch(u).then(r => { if(!r.ok) throw new Error(u + ' (' + r.status + ')'); return r.json(); }).catch(e => { V61L.p[k] = null; throw e; }));
}
function v61lThree(){
  if(typeof THREE !== 'undefined') return Promise.resolve();
  return V61L.three || (V61L.three = new Promise((ok, no) => { const s = document.createElement('script'); s.src = V61L_THREE_URL; s.async = true;
    s.onload = ok; s.onerror = () => { V61L.three = null; s.remove(); no(new Error('three.js')); }; document.head.appendChild(s); }));
}
// ---- ảnh toàn cảnh đảo v46 (2048², ~0,5 s CPU) dựng từng lát giữa các khung hình thay vì chặn khung hình đầu ----
// Trong lúc dựng: trả tấm tạm (biển + vòng cát/cỏ); ô nền (tile) gần camera vẫn vẽ như cũ nên gần như không thấy khác.
// Xong thì gán V46T.ov rồi gọi chuỗi hàm cũ (v57p…) để thêm phần của nó — kết quả giống hệt dựng một lần.
function v61lOvTemp(){
  const se = S(), k = season; if(V61L.tmp && V61L.tmpK === k) return V61L.tmp;
  const c = V61L.tmp || document.createElement('canvas'); c.width = c.height = 2048; const g = c.getContext('2d'), s = V46T.OVS, L = V46L;
  g.setTransform(s, 0, 0, s, 0, 0); g.fillStyle = se.sea2; g.fillRect(0, 0, L.W, L.H);
  const ring = (r, col) => { g.fillStyle = col; g.beginPath(); g.arc(L.CX, L.CY, r, 0, Math.PI*2); g.fill(); };
  ring(L.ISLAND + 420, se.sea); ring(L.ISLAND, se.sand); ring(L.GRASS, se.grass);
  V61L.tmp = c; V61L.tmpK = k; return c;
}
function v61lOvBuild(ov0){
  const N = 2048, s = V46T.OVS, L = V46L, gen = () => V46T.key + '|' + (V46T.gc ? 1 : 0) + (V46T.nc ? 1 : 0) + '|' + V46T.deco.length;
  let c = null, g = null, g0 = '', steps = [];
  // bước 1..n: nền từng khu (v47wPatch, có cache sẵn) · bước cuối: đúng thân hàm v46Overview gốc (bake.js), nay nhẹ vì nền khu đã có
  const plan = () => { c = document.createElement('canvas'); c.width = c.height = N; g = c.getContext('2d'); g0 = gen();
    const d = z => { try { return Math.hypot((z.n.x0 + z.n.x1)/2 - cam.x, (z.n.y0 + z.n.y1)/2 - cam.y); } catch(e){ return 0; } };   // khu gần camera trước
    steps = V46.Z.filter(z => !z.flip).sort((a, b) => d(a) - d(b)).map(z => () => v47wPatch(z));
    steps.push(() => { g.setTransform(s, 0, 0, s, 0, 0); v46Paint(g, 0, 0, L.W, L.H, 2); }, () => v46OverviewBuildings(g)); };   // 2 task riêng, cùng 1 context → y hệt gốc
  const done = () => { V61L.warm = false; V61L.tmp = null; };
  const step = () => {
    if(!V61L.warm) return; if(V46T.ov){ done(); return; }
    if(!c || gen() !== g0) plan();
    const t0 = performance.now(); const prev = ctx; ctx = g;
    try { while(steps.length && performance.now() - t0 < 12) steps.shift()(); } catch(e){ ctx = prev; console.warn('v61l ov', e); done(); return; }
    ctx = prev;
    if(steps.length){ requestAnimationFrame(() => setTimeout(step, 0)); return; }
    if(gen() !== g0){ c = null; requestAnimationFrame(() => setTimeout(step, 0)); return; }
    V46T.ov = c; done(); try { ov0(); } catch(e){ console.warn('v61l ov0', e); }
  };
  requestAnimationFrame(() => setTimeout(step, 0));
}
function v61lInit(){
  // màn chờ (index.html) hỏi: game đã vẽ được khung hình thật chưa
  window.v61lDrawn = () => { try { return typeof V46T === 'undefined' || V46T.L0.size + V46T.L1.size > 0 || !!V46T.ov; } catch(e){ return true; } };
  // ảnh toàn cảnh: dựng dần (xem trên)
  if(typeof V46T !== 'undefined' && !V46T.ov && typeof v46Paint === 'function'){ const ov0 = v46Overview; V61L.warm = true;
    v46Overview = function(){ if(!V61L.warm || V46T.ov) return ov0(); try { v46CheckCaches(); } catch(e){} return V61L.warm && !V46T.ov ? v61lOvTemp() : ov0(); };
    v61lOvBuild(ov0); setTimeout(() => { if(V61L.warm){ V61L.warm = false; V61L.tmp = null; } }, 20000);
    // lúc khởi động: 3 khung đầu chưa dựng ô nền (nền khu gần camera được dựng sẵn giữa các khung), sau đó tối đa 1 ô mới/khung
    // (gốc: 6 ô ngay khung đầu → khung đầu ~2 s trên máy yếu)
    const t0 = v46Tile; V61L.fr = 0; V61L.tb = -1;
    const fr = () => { V61L.fr++; if(V61L.warm) requestAnimationFrame(fr); }; requestAnimationFrame(fr);
    v46Tile = function(lod, i, j){ if(!V61L.warm) return t0(lod, i, j); const M = lod ? V46T.L1 : V46T.L0;
      if(!M.has(i + ',' + j)){ if(V61L.fr < 3 || V61L.tb === V61L.fr) return null; V61L.tb = V61L.fr; } return t0(lod, i, j); };
    // cache nền cũ (buildGround/buildNorth) dựng ở task riêng ngay sau khi font sẵn sàng, không dồn vào khung hình đầu
    try { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => { try { v46CheckCaches(); } catch(e){} }, 0)); } catch(e){} }
  // sách lớn (thư viện): chỉ tải ~3 MB khi mở sách lần đầu
  if(TEXT_GZ === null){ const o = loadTexts;
    loadTexts = function(){ if(TEXT_GZ !== null) return o(); return v61lAsset('books').then(s => { TEXT_GZ = s; return o(); }, e => { console.warn('v61l books', e); return {}; }); }; }
  // mẫu âm piano thật: chỉ tải ~1,6 MB khi mở đàn
  if(PIANO_B64 === null){ const o = loadPiano;
    loadPiano = function(){ if(PIANO_B64 !== null) return o(); if(PS.ready || PS.loading || V61L.pl) return; V61L.pl = 1;
      const el = document.getElementById('pload'); if(el) el.textContent = 'Đang tải tiếng đàn piano thật…';
      v61lAsset('piano').then(d => { PIANO_B64 = d; V61L.pl = 0; o(); }, e => { V61L.pl = 0; console.warn('v61l piano', e); if(el) el.textContent = 'Không nạp được mẫu âm, đang dùng tiếng đàn tổng hợp.'; }); }; }
  // three.js (Rubik 3D): không chặn lúc mở trang; tải lúc rảnh, hoặc ngay khi mở Rubik 3D
  if(typeof THREE === 'undefined'){ const o = openRubik;
    openRubik = function(){ if(typeof THREE !== 'undefined') return o.apply(this, arguments); const t = this, a = arguments; try { toast('Đang tải Rubik 3D…'); } catch(e){}
      v61lThree().then(() => o.apply(t, a), () => o.apply(t, a)); };
    setTimeout(() => (window.requestIdleCallback || (f => setTimeout(f, 1)))(() => v61lThree().catch(() => {}), {timeout:8000}), 9000); }
}
