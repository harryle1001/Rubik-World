// ================= v70f · CẢM GIÁC & KHÔNG KHÍ 1/4: lõi — Đồ hoạ Thấp/Vừa/Cao (lưu 'truong-v70f-gfx'), đo FPS và tự hạ, rung camera, chuyển cảnh mờ/tròn =================
// Mọi tên toàn cục có tiền tố v70f / V70F. Sửa hàm cũ bằng cách bọc (gọi hàm gốc trước/sau). Thấp: tắt hiệu ứng phụ, nửa độ phân giải lớp tối, DPR 1.
const V70F_PHI = 1.618033988749895;
const V70F_KEY = 'truong-v70f-gfx';
const V70F_QN = ['Thấp', 'Vừa', 'Cao'];
const V70F_DPR = [.85, 1.5, 2];               // trần mật độ điểm ảnh theo mức đồ hoạ (Thấp: vẽ 85% điểm ảnh rồi phóng — bớt ~28% việc tô)
const V70F = {on:false, q:1, auto:true, fps:60, ema:16.7, last:0, slow:0, down:0, autoN:0, px:0, py:0, tr:null, trT:0, stat:{}};

function v70fGuess(){ const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4, touch = typeof MOB === 'object' && MOB && MOB.touch;
  if(mem <= 2 || cores <= 2) return 0; return touch || mem <= 4 ? 1 : 2; }
function v70fLoad(){ let s = {}; try { s = JSON.parse(localStorage.getItem(V70F_KEY) || '{}') || {}; } catch(e){}
  V70F.q = (s.q === 0 || s.q === 1 || s.q === 2) ? s.q : v70fGuess(); V70F.auto = s.auto !== false; }
function v70fSave(){ try { localStorage.setItem(V70F_KEY, JSON.stringify({q:V70F.q, auto:V70F.auto})); } catch(e){} }
const v70fRM = () => typeof RM === 'object' && RM && RM.matches;

// áp dụng mức đồ hoạ: trần DPR (v26 tự hạ tiếp nếu cần), lớp tối nửa độ phân giải ở mức Thấp
function v70fApply(){
  const q = V70F.q; document.body.dataset.v70fq = q;
  try { if(typeof V26 === 'object' && V26ON){ const real = Math.min(2, (V70F.realDpr || 1)); V26.native = Math.min(real, V70F_DPR[q]); V26.dpr = Math.min(V26.native, V26.levels[V26.li] || V26.native); resize(); } } catch(e){}
  v70fSetUi();
}
function v70fSet(q, auto){
  q = Math.max(0, Math.min(2, q)); if(q === V70F.q) return; V70F.q = q; v70fSave(); v70fApply();
  if(auto){ V70F.autoN++; try { toast('⚙️ Máy hơi chậm — Đồ hoạ tự chuyển sang “' + V70F_QN[q] + '” cho mượt hơn.'); } catch(e){} }
}
// đo FPS bằng vòng rAF riêng (chỉ đọc thời gian, gần như không tốn gì); chậm liên tục 3,5 s → hạ 1 mức (cách nhau ≥ 8 s)
function v70fTick(now){
  requestAnimationFrame(v70fTick);
  const dt = now - V70F.last; V70F.last = now; if(dt <= 0 || dt > 250 || document.hidden) return;
  V70F.ema += (dt - V70F.ema)*.05; V70F.fps = 1000/V70F.ema;
  if(typeof V25 === 'object') V25.low = V25.low || V70F.q === 0;
  if(!V70F.auto || !V70F.on || V70F.q === 0 || (typeof openModal !== 'undefined' && openModal)){ V70F.slow = 0; return; }
  if(V70F.fps < 46) V70F.slow += dt; else V70F.slow = Math.max(0, V70F.slow - dt*.5);
  if(V70F.slow > 3500 && now - V70F.down > 8000){ V70F.down = now; V70F.slow = 0; v70fSet(V70F.q - 1, true); }
}

// ---------- rung nhẹ camera (tôn trọng “giảm chuyển động”) ----------
function v70fShake(a){ if(v70fRM() || V70F.q === 0) return; try { shake = Math.max(shake, Math.min(.6, a)); } catch(e){} }

// ---------- chuyển cảnh: 'fade' (mờ) hoặc 'iris' (vòng tròn mở ra từ chỗ chạm) — chỉ CSS transform/opacity ----------
function v70fTrans(kind){
  if(v70fRM() || !V70F.on) return; let d = V70F.tr;
  if(!d){ d = V70F.tr = document.createElement('div'); d.id = 'v70fTr'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<i></i>'; document.body.appendChild(d); }
  const t = performance.now(); if(t - V70F.trT < 250) return; V70F.trT = t;
  const x = V70F.px || innerWidth/2, y = V70F.py || innerHeight/2; d.style.setProperty('--x', x + 'px'); d.style.setProperty('--y', y + 'px');
  d.className = ''; void d.offsetWidth; d.className = kind; clearTimeout(d._t); d._t = setTimeout(() => { d.className = ''; }, 760);
  try { if(typeof v39Sfx === 'function') v39Sfx('swipe', .22, kind === 'iris' ? 1.1 : .85); } catch(e){}
}
const V70F_IRIS = new Set(['mChess', 'mRubik', 'mFish', 'mArcade', 'mFarm', 'mCaro', 'mGo', 'mPaint', 'mMusic', 'mZen', 'mOly', 'mLab', 'mChessLearn', 'mFishDeep', 'mC4', 'mOAQ', 'mSudoku', 'mMath', 'mMemory', 'mMissile', 'mGarden', 'mArena', 'mObs', 'mLib', 'mReader', 'mComic', 'mAcademy', 'mScope', 'mLobby']);
const V70F_FADE = new Set(['mHouse', 'mRoom', 'mMall', 'mMarket', 'mHall', 'mShop', 'mBigMap']);
function v70fTransHooks(){
  window.addEventListener('pointerdown', e => { V70F.px = e.clientX; V70F.py = e.clientY; }, true);
  if(typeof showModal === 'function'){ const s0 = showModal; showModal = function(id){ const was = typeof openModal !== 'undefined' && openModal && openModal.id; const r = s0.apply(this, arguments);
    if(was !== id){ if(V70F_IRIS.has(id)) v70fTrans('iris'); else if(V70F_FADE.has(id)) v70fTrans('fade'); } return r; }; }
  if(typeof doorEnter === 'function'){ const d0 = doorEnter; doorEnter = function(){ const r = d0.apply(this, arguments); if(r) v70fTrans('fade'); return r; }; }
  if(typeof v51pBoard === 'function'){ const b0 = v51pBoard; v51pBoard = function(){ const r = b0.apply(this, arguments); if(r !== false) v70fTrans('iris'); return r; }; }
  if(typeof flyToggle === 'function'){ const f0 = flyToggle; flyToggle = function(){ const r = f0.apply(this, arguments); v70fTrans('fade'); return r; }; }
}

// ---------- Cài đặt: “Đồ hoạ: Thấp / Vừa / Cao” + tự hạ khi máy chậm ----------
function v70fSettingsUi(){
  const m = document.querySelector('#mSet .mbox'); if(!m || document.getElementById('v70fGfx')) return v70fSetUi();
  const d = document.createElement('section'); d.id = 'v70fGfx'; d.className = 'v70fgfx';
  d.innerHTML = '<h3>Đồ hoạ</h3><div class="v70fseg" role="radiogroup" aria-label="Mức đồ hoạ">' + V70F_QN.map((n, i) => `<button type="button" role="radio" data-q="${i}">${n}</button>`).join('') + '</div>'
    + '<label class="v70fauto"><input type="checkbox" id="v70fAuto"> Tự hạ khi máy chậm</label><p class="v70fnote" id="v70fNote"></p>';
  const v = document.getElementById('v39Vol'); if(v && v.parentNode === m) v.after(d); else { const h = m.querySelector('.mhead'); (h && h.nextSibling) ? m.insertBefore(d, h.nextSibling) : m.appendChild(d); }
  d.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { V70F.slow = 0; V70F.down = performance.now(); v70fSet(+b.dataset.q); try { v39Sfx('select', .4); } catch(e){} });
  const a = document.getElementById('v70fAuto'); a.onchange = () => { V70F.auto = a.checked; v70fSave(); };
  v70fSetUi();
}
function v70fSetUi(){
  const d = document.getElementById('v70fGfx'); if(!d) return;
  d.querySelectorAll('[data-q]').forEach(b => b.setAttribute('aria-checked', +b.dataset.q === V70F.q));
  const a = document.getElementById('v70fAuto'); if(a) a.checked = V70F.auto;
  const n = document.getElementById('v70fNote'); if(n) n.textContent = ['Ít hiệu ứng, mượt nhất cho máy yếu.', 'Cân bằng: ánh sáng, bụi, gợn nước, mưa có vũng.', 'Đầy đủ: tia nắng, bóng theo giờ, lá bay gần, lấp lánh mặt nước.'][V70F.q] + ' · FPS ≈ ' + Math.round(V70F.fps);
}

function v70fInit(){
  V70F.realDpr = (typeof V26 === 'object' && V26.native) || window.devicePixelRatio || 1;
  v70fLoad(); V70F.on = true; v70fApply(); requestAnimationFrame(v70fTick);
  v70fTransHooks();
  if(typeof showModal === 'function'){ const s0 = showModal; showModal = function(id){ const r = s0.apply(this, arguments); if(id === 'mSet') setTimeout(v70fSettingsUi, 30); return r; }; }
  try { v70fFxInit(); } catch(e){ console.warn('v70f fx', e); }
  try { v70fUiInit(); } catch(e){ console.warn('v70f ui', e); }
  try { v70fSndInit(); } catch(e){ console.warn('v70f snd', e); }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v70f = V70F;
}
