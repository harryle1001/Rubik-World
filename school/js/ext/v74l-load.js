// ================= v74l · MỞ GAME NHANH + BỘ NHỚ GỌN (không đổi thiết kế / tính năng) =================
// 1. Danh mục ~4 600 sách (BOOKS, PICBOOKS, ~570 KB) không còn nằm trong bản gói: tools/build/build.js tách ra dist/cat.<hash>.json.
//    Nạp lúc rảnh sau khi màn đăng nhập hiện ra, hoặc ngay khi mở thư viện. Chạy từng file (localhost): BOOKS có sẵn → không làm gì.
// 2. Service worker báo có bản mới (index.html đổi) khi game còn ở màn chờ → tải lại ngay để chạy bản mới; nếu đã vào game thì để lần mở sau.
// 3. Bộ nhớ ô nền (v72p giữ tới 72 + 40 ô 512² ≈ 117 MB): giới hạn theo navigator.deviceMemory, nhưng luôn đủ phủ màn hình hiện tại.
//    Không vẽ thế giới (vào trong nhà, mini game toàn màn hình, hành tinh…) lâu → trả ô nền về, chỉ giữ ô quanh chỗ đang đứng.
const V74L = {dm:0, tier:null, need:[0, 0], lastTile:0, lastTrim:0, cat:0, stat:{freed:0, trims:0, cat:0}};
// danh mục sách
function v74lCatReady(){ return typeof BOOKS === 'undefined' || BOOKS.length > 0; }
function v74lCat(){
  if(v74lCatReady()) return Promise.resolve(true);
  const B = window.V61L_BUILD; if(!B || !B.lazy || !B.lazy.cat || typeof v61lAsset !== 'function') return Promise.resolve(false);
  return v61lAsset('cat').then(d => {
    if(d && Array.isArray(d.BOOKS) && !BOOKS.length) BOOKS = d.BOOKS;
    if(d && Array.isArray(d.PICBOOKS) && !PICBOOKS.length) PICBOOKS = d.PICBOOKS;
    V74L.stat.cat = BOOKS.length;
    // ô chọn ngôn ngữ của thư viện (ext9Init dựng lúc BOOKS còn rỗng) — dựng lại y như gốc
    try { const ls = $('#libLang'); if(ls && ls.options.length <= 1) [...new Set(BOOKS.map(b => b[3]))].forEach(k => ls.appendChild(el('option', {value:k}, LANGS[k] || k))); } catch(e){}
    return true;
  }, e => { console.warn('v74l cat', e); return false; });
}
// bộ nhớ: mức theo RAM máy (GB). Safari không có deviceMemory → coi như 4.
function v74lTier(){
  const dm = +navigator.deviceMemory || 4; V74L.dm = dm;
  return dm <= 2 ? {cap:[28, 16], pool:4} : dm <= 4 ? {cap:[48, 28], pool:8} : {cap:[72, 40], pool:12};
}
// số ô cần để phủ màn hình (+1 ô viền mỗi phía) ở mức chi tiết đang dùng (v72p: ô L0 khi cam.z ≥ .55, ô L1 khi nhỏ hơn;
// dưới ~.2 chỉ vẽ ảnh toàn cảnh) — tính ở mức thu phóng thấp nhất của mỗi loại để không thiếu ô khi đang thu nhỏ dần
function v74lNeed(){
  try { const W = (mainCtx && mainCtx.canvas ? mainCtx.canvas.clientWidth : innerWidth) || innerWidth, H = (mainCtx && mainCtx.canvas ? mainCtx.canvas.clientHeight : innerHeight) || innerHeight;
    const n = (span, z) => (Math.ceil(W/z/span) + 2)*(Math.ceil(H/z/span) + 2), z = cam.z;
    return [z >= .55 ? n(V46T.TS, .55) : 0, z < .55 && z >= .2 ? n(V46T.TS*2, .2) : 0];
  } catch(e){ return [0, 0]; }
}
function v74lCaps(){
  if(typeof V72P === 'undefined' || !V72P.cap || !V74L.tier) return;
  const nd = v74lNeed(); V74L.need = [Math.max(V74L.need[0], nd[0]), Math.max(V74L.need[1], nd[1])];
  V72P.cap[0] = Math.max(V74L.tier.cap[0], V74L.need[0] + 6); V72P.cap[1] = Math.max(V74L.tier.cap[1], V74L.need[1] + 4);
}
// cắt bớt bộ đệm ô nền còn `keep` ô gần dùng nhất (Map giữ thứ tự dùng: cũ nhất ở đầu)
function v74lTrim(M, keep){ let n = 0; while(M.size > keep){ const k = M.keys().next().value; M.delete(k); n++; } return n; }
function v74lMem(){
  if(typeof V46T === 'undefined' || typeof V72P === 'undefined') return;
  if(typeof V61F !== 'undefined' && (V61F.job || V61F.ovJob)) return;     // đang dựng lại theo mùa: đừng động vào
  const now = performance.now(); v74lCaps();
  while(V72P.pool && V72P.pool.length > V74L.tier.pool){ V72P.pool.pop(); V74L.stat.freed++; }
  const idle = now - V74L.lastTile, modal = typeof openModal !== 'undefined' && !!openModal;
  // không vẽ ô nền nào ≥ 45 s (đang ở trong nhà / mini game / hành tinh): trả hết, quay ra sẽ nướng lại dần như lúc mới vào
  if(idle > 45000 && V46T.L0.size + V46T.L1.size > 0){ V74L.stat.freed += V46T.L0.size + V46T.L1.size; V46T.L0.clear(); V46T.L1.clear(); V72P.pool.length = 0; V74L.stat.trims++; return; }
  // mở cửa sổ (mini game, cửa hàng…) ≥ 30 s: chỉ giữ ô đủ phủ màn hình
  if(modal){ if(!V74L.modalT) V74L.modalT = now; } else V74L.modalT = 0;
  if(V74L.modalT && now - V74L.modalT > 30000 && now - V74L.lastTrim > 30000){ const nd = v74lNeed();
    const f = v74lTrim(V46T.L0, nd[0] + 2) + v74lTrim(V46T.L1, nd[1] + 2); if(f){ V74L.stat.freed += f; V74L.stat.trims++; } V74L.lastTrim = now; }
}
function v74lInit(){
  // màn đăng nhập hiện TRƯỚC khung hình đầu (khung đầu nướng ô nền, ~0,3–1,3 s trên máy yếu). Gốc: shop.js mở sau 900 ms bằng
  // setTimeout, nhưng hẹn giờ đó thường phải chờ khung đầu chạy xong. Giờ: mở ngay khi khởi tạo xong (cùng điều kiện "chưa có cửa sổ
  // nào mở"; hẹn giờ cũ thấy đã mở thì thôi) và nhường 1 khung để hộp đăng nhập vẽ ra trước. Nền tối 72% của hộp thoại che thế giới phía sau.
  if(typeof openLogin === 'function' && typeof frame === 'function'){ const f0 = frame;
    frame = function(t){ frame = f0; if(typeof openModal !== 'undefined' && openModal && openModal.id === 'mLogin' && !V74L.lf){ V74L.lf = 1; requestAnimationFrame(t2 => f0(t2)); return; } return f0.apply(this, arguments); };
    queueMicrotask(() => { try { if(!openModal) openLogin(); } catch(e){} }); }
  // service worker: có bản mới khi còn ở màn chờ → tải lại
  // (tin nhắn có thể tới trước khi trang kịp nghe → kiểm tra thêm: trang chính mới nhất trong cache trỏ bản gói khác bản đang chạy)
  const B = window.V61L_BUILD, again = () => { try { const t = +sessionStorage.getItem('v74lReload') || 0; if(Date.now() - t < 30000) return false; sessionStorage.setItem('v74lReload', Date.now()); } catch(e){} return true; };
  const reload = () => { if(document.getElementById('cv-cover') && again()) location.reload(); };
  try { if(navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => { if(e.data && e.data.v74l === 'new') reload(); }); } catch(e){}
  try { if(B && window.caches && navigator.serviceWorker && navigator.serviceWorker.controller){ let n = 0;
    const chk = () => { if(!document.getElementById('cv-cover') || ++n > 12) return;
      caches.open('v74l-rt').then(c => c.match(new URL('index.html', location.href).href)).then(r => r && r.text()).then(t => {
        const m = t && t.match(/V61L_BUILD=(\{.*?\});<\/script>/); let j = null; try { j = m && JSON.parse(m[1]); } catch(e){}
        if(j && j.js && j.js !== B.js) reload(); else setTimeout(chk, 500); }).catch(() => {}); };
    setTimeout(chk, 300); } } catch(e){}
  // danh mục sách: mở thư viện khi chưa có → báo đang tải, có rồi vẽ lại
  if(!v74lCatReady() && typeof renderLib === 'function'){ const r0 = renderLib;
    renderLib = function(){ const o = r0.apply(this, arguments); if(!v74lCatReady()){ try { const c = $('#libCount'); if(c) c.textContent = 'Đang tải danh mục sách…'; } catch(e){}
      v74lCat().then(ok => { try { if(ok && v74lCatReady() && !$('#mLib').hidden) r0(); } catch(e){} }); } return o; };
    // nạp sẵn lúc rảnh, sau khi màn đăng nhập đã hiện (không tranh băng thông với ảnh lúc mở game)
    setTimeout(() => (window.requestIdleCallback || (f => setTimeout(f, 1)))(() => v74lCat(), {timeout:10000}), 12000); }
  // bộ nhớ ô nền
  if(typeof V72P !== 'undefined' && V72P.cap && typeof v46Tile === 'function'){
    V74L.tier = v74lTier(); v74lCaps();
    const t0 = v46Tile; v46Tile = function(){ V74L.lastTile = performance.now(); return t0.apply(this, arguments); };
    V74L.lastTile = performance.now(); setInterval(() => { try { v74lMem(); } catch(e){ console.warn('v74l mem', e); } }, 5000);
  }
}
