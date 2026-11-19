// ================= v70f · CẢM GIÁC & KHÔNG KHÍ 3/4: UI “juice” — nút nảy khi chạm, tiền/EXP chạy số, toast trượt mềm, lấp lánh khi nhận thưởng, lên cấp đẹp hơn =================
// Chỉ dùng thuộc tính CSS riêng `scale` / `translate` (không đè `transform` sẵn có của nút), animation ngắn, tắt khi “giảm chuyển động”.
const V70F_CSS = `
#v70fTr{position:fixed;inset:0;z-index:9500;pointer-events:none;display:none;overflow:hidden}
#v70fTr.fade{display:block;background:#0b1028;animation:v70fFade .5s cubic-bezier(.4,0,.2,1) forwards}
#v70fTr.iris{display:block}
#v70fTr.iris i{position:absolute;left:var(--x);top:var(--y);width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;border-radius:50%;box-shadow:0 0 0 150vmax #0b1028;animation:v70fIris .62s cubic-bezier(.3,.7,.2,1) forwards;will-change:transform}
@keyframes v70fFade{from{opacity:1}to{opacity:0}}
@keyframes v70fIris{from{transform:scale(.01)}to{transform:scale(1)}}
.v70fpress{animation:v70fPress .3s cubic-bezier(.2,1.6,.4,1)}
@keyframes v70fPress{0%{scale:1}30%{scale:.9}100%{scale:1}}
#stage #toast.toast.v70fin{animation:v70fToast .42s cubic-bezier(.2,1.3,.4,1) both}
@keyframes v70fToast{from{translate:0 -16px;opacity:0;scale:.94}to{translate:0 0;opacity:1;scale:1}}
#profMoney.v70fbump,#profExp.v70fbump{animation:v70fBump .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes v70fBump{0%{scale:1}35%{scale:1.22;color:#fff3b0}100%{scale:1}}
.v70fsp{position:fixed;z-index:9400;pointer-events:none;width:10px;height:10px;margin:-5px 0 0 -5px;background:radial-gradient(circle,#fff 0,#ffe37a 35%,rgba(255,210,63,0) 70%);border-radius:50%;animation:v70fSp .9s ease-out forwards}
.v70fsp.s{width:14px;height:14px;margin:-7px 0 0 -7px;background:none}
.v70fsp.s:before,.v70fsp.s:after{content:'';position:absolute;left:6px;top:0;width:2px;height:14px;background:#fff6c8;border-radius:2px;box-shadow:0 0 6px #ffd23f}
.v70fsp.s:after{transform:rotate(90deg)}
@keyframes v70fSp{from{opacity:1;translate:0 0;scale:.4}60%{opacity:1}to{opacity:0;translate:var(--dx) var(--dy);scale:1.1}}
.lvlup.v70f .lvlnum{background:linear-gradient(100deg,#ffd23f 20%,#fff8d6 45%,#ffd23f 70%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:lvIn .9s .15s cubic-bezier(.2,1.4,.3,1) both,v70fShine 1.6s .9s ease-in-out 2;text-shadow:none;filter:drop-shadow(0 4px 0 #6b4a00) drop-shadow(0 0 18px rgba(255,210,63,.7))}
.lvlup.v70f:before{content:'';position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;border:4px solid rgba(255,226,120,.9);animation:v70fRing 1.1s cubic-bezier(.2,.8,.3,1) forwards}
.lvlup.v70f:after{content:'';position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;border:3px solid rgba(255,255,255,.7);animation:v70fRing 1.3s .25s cubic-bezier(.2,.8,.3,1) both}
@keyframes v70fRing{from{scale:.3;opacity:1}to{scale:9;opacity:0}}
@keyframes v70fShine{from{background-position:100% 0}to{background-position:0 0}}
.v70fgfx{margin:10px 0 16px;padding:16px;border-radius:16px;background:rgba(255,255,255,.06);font-family:Nunito,'Be Vietnam Pro',system-ui,sans-serif}
.v70fgfx h3{margin:0 0 10px;font-size:18px}
.v70fseg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px;border-radius:14px;background:rgba(0,0,0,.25)}
.v70fseg button{min-height:42px;border:0;border-radius:10px;background:transparent;color:inherit;font:700 16px Nunito,system-ui,sans-serif;cursor:pointer;transition:background .2s,color .2s}
.v70fseg button[aria-checked="true"]{background:#ffd23f;color:#1b1400;box-shadow:0 2px 0 #9c7a00}
.v70fauto{display:flex;align-items:center;gap:10px;margin:10px 0 0;font-size:16px;min-height:42px}
.v70fauto input{width:22px;height:22px}
.v70fnote{margin:6px 0 0;font-size:16px;opacity:.78;line-height:1.4}
@media (prefers-reduced-motion:reduce){.v70fpress,.v70fsp,#stage #toast.toast.v70fin,.v70fbump,.lvlup.v70f:before,.lvlup.v70f:after{animation:none!important}}
`;

// số chạy (ease-out) cho tiền & EXP
const V70F_NUM = {m:null, e:null, raf:0, from:{}, to:{}, t0:0};
function v70fCount(){
  const t = performance.now(), u = Math.min(1, (t - V70F_NUM.t0)/650), k = 1 - Math.pow(1 - u, 3);
  const m = document.getElementById('profMoney'); if(m && V70F_NUM.to.m != null){ const v = Math.round(V70F_NUM.from.m + (V70F_NUM.to.m - V70F_NUM.from.m)*k); m.textContent = '$' + v; }
  V70F_NUM.raf = u < 1 ? requestAnimationFrame(v70fCount) : 0;
}
function v70fBump(el){ if(!el) return; el.classList.remove('v70fbump'); void el.offsetWidth; el.classList.add('v70fbump'); }
function v70fSparkle(el, n){
  if(!el || (typeof RM === 'object' && RM.matches)) return; const r = el.getBoundingClientRect(); if(!r.width) return;
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  for(let i = 0; i < n; i++){ const s = document.createElement('i'), a = i/n*6.283 + Math.random()*.4, d = 22 + Math.random()*30;
    s.className = 'v70fsp' + (i % 3 === 0 ? ' s' : ''); s.style.left = cx + (Math.random() - .5)*r.width*.6 + 'px'; s.style.top = cy + 'px';
    s.style.setProperty('--dx', Math.cos(a)*d + 'px'); s.style.setProperty('--dy', Math.sin(a)*d - 10 + 'px'); s.style.animationDelay = (i*25) + 'ms';
    document.body.appendChild(s); setTimeout(() => s.remove(), 1200); }
}
function v70fUiInit(){
  const st = document.createElement('style'); st.id = 'v70fCss'; st.textContent = V70F_CSS; document.head.appendChild(st);
  // nút nảy nhẹ khi chạm (mọi button / .btn / thẻ có role=button)
  window.addEventListener('pointerdown', e => { const b = e.target && e.target.closest && e.target.closest('button, .btn, [role="button"], .v39tile'); if(!b || b.disabled) return;
    b.classList.remove('v70fpress'); void b.offsetWidth; b.classList.add('v70fpress'); clearTimeout(b._v70p); b._v70p = setTimeout(() => b.classList.remove('v70fpress'), 340); }, {capture:true, passive:true});
  // toast trượt mềm: chạy lại hoạt ảnh mỗi lần có nội dung mới
  if(typeof toast === 'function'){ const t0 = toast; toast = function(text){ const r = t0.apply(this, arguments); const t = document.getElementById('toast'); if(t){ t.classList.remove('v70fin'); void t.offsetWidth; t.classList.add('v70fin'); } return r; }; }
  // tiền chạy số + nảy + lấp lánh khi tăng
  if(typeof renderProfHud === 'function'){ const h0 = renderProfHud; renderProfHud = function(){
    const before = (typeof PROF === 'object' && PROF) ? V70F_NUM.shown : null; const r = h0.apply(this, arguments);
    if(typeof PROF === 'object' && PROF){ const now = PROF.money; if(before != null && now !== before && !(typeof RM === 'object' && RM.matches)){
        V70F_NUM.from.m = before; V70F_NUM.to.m = now; V70F_NUM.t0 = performance.now(); const m = document.getElementById('profMoney'); if(m) m.textContent = '$' + before;
        if(!V70F_NUM.raf) V70F_NUM.raf = requestAnimationFrame(v70fCount); if(now > before){ v70fBump(m); v70fSparkle(m, 8); } }
      V70F_NUM.shown = now; } else V70F_NUM.shown = null;
    return r; }; }
  if(typeof reward === 'function'){ const w0 = reward; reward = function(exp, money){ const lv = typeof PROF === 'object' && PROF ? PROF.level : 0; const r = w0.apply(this, arguments);
    if(typeof PROF === 'object' && PROF && exp > 0 && !(money > 0)){ const e = document.getElementById('profExp') || document.getElementById('profBar'); v70fSparkle(e, 5); } return r; }; }
  // lên cấp: vòng sáng lan, chữ số ánh vàng chạy, rung nhẹ, lấp lánh quanh số
  if(typeof levelUp === 'function'){ const l0 = levelUp; levelUp = function(){ const r = l0.apply(this, arguments); const el = document.getElementById('lvlUp');
    if(el){ el.classList.remove('v70f'); void el.offsetWidth; el.classList.add('v70f'); setTimeout(() => v70fSparkle(document.getElementById('lvlNum'), 14), 350); }
    try { v70fShake(.25); } catch(e){} try { if(typeof v70fChime === 'function') v70fChime(); } catch(e){} return r; }; }
}
