// ================= v54q · ROBO THÁM TỬ (3/3 · giao diện): nút 🤖 (chỉ chủ game), bảng báo cáo theo mức độ, “Đi tới chỗ lỗi”, tải JSON =================
function v54qCss(){
  if(document.getElementById('v54qCss')) return; const s = document.createElement('style'); s.id = 'v54qCss';
  s.textContent = `
#v54qBtn{font:800 16px Nunito,system-ui,sans-serif}
#v54qPanel{position:fixed;z-index:9000;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));width:min(440px,calc(100vw - 24px));max-height:calc(100dvh - 24px);display:flex;flex-direction:column;
  background:rgba(18,24,42,.96);color:#f4f6fb;border:2px solid #ffd23f;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.45);font:700 16px/1.45 Nunito,system-ui,sans-serif}
#v54qPanel[hidden]{display:none}
#v54qPanel header{display:flex;align-items:center;gap:10px;padding:12px 14px 8px}
#v54qPanel header b{font-size:19px;flex:1}
#v54qPanel button{font:800 16px Nunito,system-ui,sans-serif;min-height:44px;border-radius:12px;border:0;padding:0 14px;cursor:pointer;background:#2c3a5c;color:#fff}
#v54qPanel button.pri{background:#2fbf71;color:#0d2416}#v54qPanel button.stop{background:#ef4b4b}
#v54qPanel .x{width:44px;padding:0;font-size:20px}
#v54qSt{padding:0 14px 8px;color:#cfd6e6}
#v54qBar{height:8px;margin:0 14px 10px;background:#2c3a5c;border-radius:8px;overflow:hidden}#v54qBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4dabf7,#2fbf71)}
#v54qAct{display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 10px}
#v54qSum{display:flex;gap:8px;padding:0 14px 10px}#v54qSum span{flex:1;text-align:center;border-radius:10px;padding:6px 4px;font-size:16px}
.v54qH{background:#5c1d24;color:#ffd0d4}.v54qM{background:#5a4214;color:#ffe7a8}.v54qL{background:#1e3f5a;color:#cfe8ff}
#v54qList{overflow:auto;padding:0 10px 12px;flex:1;min-height:80px}
#v54qList .it{display:grid;grid-template-columns:96px 1fr;gap:10px;background:#212c48;border-radius:12px;padding:8px;margin:0 0 8px}
#v54qList .it img{width:96px;height:60px;object-fit:cover;border-radius:8px;background:#0b1020}
#v54qList .it .ph{width:96px;height:60px;border-radius:8px;background:#0b1020;display:grid;place-items:center;font-size:24px}
#v54qList .it em{font-style:normal;font-size:16px;border-radius:8px;padding:0 6px;margin-right:4px}
#v54qList .it p{margin:2px 0;font-size:16px;color:#d6dcea;word-break:break-word}
#v54qList .it button{min-height:44px;margin-top:4px;font-size:16px}
#v54qList details summary{cursor:pointer;color:#ffd23f}
@media (max-width:520px){#v54qPanel{left:12px;right:12px;width:auto;top:auto;bottom:max(12px,env(safe-area-inset-bottom));max-height:61.8dvh}}`;
  document.head.appendChild(s);
}
function v54qEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
function v54qUiBuild(){
  if(V54Q.ui) return V54Q.ui; v54qCss();
  const p = document.createElement('div'); p.id = 'v54qPanel'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Robo Thám Tử');
  p.innerHTML = `<header><span style="font-size:26px">🤖</span><b>Robo Thám Tử</b><button class="x" id="v54qX" aria-label="Đóng bảng Robo">✕</button></header>
    <div id="v54qSt">Robo sẵn sàng đi một vòng khắp đảo để tìm lỗi.</div><div id="v54qBar"><i></i></div>
    <div id="v54qAct"><button class="pri" id="v54qGo">▶ Bắt đầu đi kiểm tra</button><button id="v54qJson">⬇ Tải JSON</button></div>
    <div id="v54qSum"><span class="v54qH">🔴 0</span><span class="v54qM">🟠 0</span><span class="v54qL">🔵 0</span></div><div id="v54qList"></div>`;
  document.body.appendChild(p);
  p.querySelector('#v54qX').onclick = () => { p.hidden = true; };
  p.querySelector('#v54qGo').onclick = () => { V54Q.on ? v54qStop() : v54qStart(); };
  p.querySelector('#v54qJson').onclick = v54qJson;
  p.querySelector('#v54qList').onclick = e => { const b = e.target.closest('[data-go]'); if(b) v54qGoTo(+b.dataset.go); };
  return (V54Q.ui = p);
}
function v54qUiCount(){
  const p = V54Q.ui; if(!p) return; const c = {high:0, mid:0, low:0}; V54Q.iss.forEach(i => c[i.sev]++);
  const s = p.querySelectorAll('#v54qSum span'); s[0].textContent = '🔴 Nghiêm trọng ' + c.high; s[1].textContent = '🟠 Vừa ' + c.mid; s[2].textContent = '🔵 Nhẹ ' + c.low;
  if(!V54Q.on) v54qUiList();
}
function v54qUiStep(){
  const p = V54Q.ui; if(!p) return; const n = V54Q.steps.length;
  p.querySelector('#v54qSt').textContent = V54Q.on ? `🚶 ${V54Q.idx + 1}/${n} · ${V54Q.cur}` : V54Q.done ? `✅ Xong ${n} bước · ${V54Q.iss.length} lỗi · FPS TB ${v54qFpsAvg()} (thấp nhất ${Math.round(Math.min(V54Q.fps.min, 999))})` : 'Robo sẵn sàng.';
  p.querySelector('#v54qBar i').style.width = n ? (100*(V54Q.idx + (V54Q.on ? 0 : 1))/n).toFixed(1) + '%' : '0';
  const g = p.querySelector('#v54qGo'); g.textContent = V54Q.on ? '⏹ Dừng' : '▶ Bắt đầu đi kiểm tra'; g.className = V54Q.on ? 'stop' : 'pri';
}
function v54qFpsAvg(){ const f = V54Q.fps; return f.cnt ? Math.round(f.sum/f.cnt) : 0; }
function v54qUiList(){
  const p = V54Q.ui; if(!p) return; const ord = {high:0, mid:1, low:2}, L = V54Q.iss.slice().sort((a, b) => ord[a.sev] - ord[b.sev] || a.id - b.id);
  const cls = {high:'v54qH', mid:'v54qM', low:'v54qL'};
  p.querySelector('#v54qList').innerHTML = L.length ? L.map(i => `<div class="it">${i.shot ? `<img src="${i.shot}" alt="Ảnh vị trí lỗi ${i.id}">` : '<div class="ph">🔎</div>'}<div>
    <p><em class="${cls[i.sev]}">${V54Q_SEV[i.sev]}</em><b>#${i.id} ${v54qEsc(i.title)}</b>${i.n > 1 ? ` ×${i.n}` : ''}</p>
    ${i.desc ? `<details><summary>Xem thêm</summary><p>${v54qEsc(i.desc)}</p><p>🔁 ${v54qEsc(i.repro)}</p>${i.file ? `<p>📄 ${v54qEsc(i.file)}</p>` : ''}</details>` : ''}
    ${i.where ? `<button data-go="${i.id}">📍 Đi tới chỗ lỗi</button>` : ''}</div></div>`).join('') : '<p style="padding:8px">Chưa có lỗi nào. 🎉</p>';
}
function v54qGoTo(id){
  if(!v54qOK()) return; const i = V54Q.iss.find(q => q.id === id); if(!i || !i.where) return;
  if(i.where.ox != null) v54qTele(i.where.ox, i.where.oy); else v54qTeleNew(i.where.x, i.where.y);
  try { toast('📍 Đã tới chỗ lỗi #' + id + ': ' + i.title.slice(0, 60)); } catch(e){}
  if(innerWidth < 760 && V54Q.ui) V54Q.ui.hidden = true;
}
function v54qReport(){
  const c = {high:0, mid:0, low:0}; V54Q.iss.forEach(i => c[i.sev]++);
  return {ver:'v54q', at:new Date().toISOString(), vp:innerWidth + '×' + innerHeight, touch:document.body.classList.contains('touchdev'), steps:V54Q.steps.length, done:V54Q.done,
    fps:{avg:v54qFpsAvg(), min:Math.round(Math.min(V54Q.fps.min, 999))}, count:c, issues:V54Q.iss, errors:V54Q.errs};
}
function v54qJson(){
  try { const b = new Blob([JSON.stringify(v54qReport(), null, 1)], {type:'application/json'}), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = 'robo-tham-tu-' + Date.now() + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); } catch(e){ toast('Không tải được JSON: ' + e.message); }
}
function v54qOpen(){ if(!v54qOK()) return; v54qUiBuild().hidden = false; v54qUiStep(); v54qUiCount(); v54qUiList(); }

// ---------- chạy / dừng ----------
async function v54qStart(opt){
  if(!v54qOK() || V54Q.on) return false;
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible){ toast('🤖 Đăng nhập và vào thế giới trước nhé!'); return false; }
  opt = opt || {}; V54Q.vp = innerWidth + '×' + innerHeight;
  V54Q.iss = []; V54Q.keys = new Map(); V54Q.nshot = 0; V54Q.fps = {min:999, sum:0, cnt:0}; V54Q.sf = {min:999, sum:0, cnt:0}; V54Q.fw = {t:0, n:0}; V54Q.done = false;
  V54Q.on = true; V54Q.t0 = Date.now(); V54Q.rob.ok = false; if(!V54Q.raf){ V54Q.raf = true; requestAnimationFrame(v54qFrame); }
  V54Q.errs.forEach(e => v54qErrIssue(e)); // lỗi đã có từ lúc khởi động game
  let S = v54qBuild(); if(opt.only) S = S.filter(s => opt.only.includes(s.k)); if(opt.max) S = S.slice(0, opt.max);
  V54Q.steps = S; const home = [PLAYER.x, PLAYER.y], hz = PLAYER._z;
  try { v54qUiBuild().hidden = true; } catch(e){}
  for(V54Q.idx = 0; V54Q.idx < S.length && V54Q.on; V54Q.idx++){
    const s = S[V54Q.idx]; v54qSay(s.name);
    try { await s.run(); } catch(e){ v54qIssue('mid', 'js', `Bước “${s.name}” ném lỗi`, {desc:e.message, stack:e.stack, file:v54qLoc(e.stack), key:'step|' + e.message.slice(0, 60)}); }
    v54qStepFps(s.name); try { v54qForceClose(); } catch(e){}
    if(window.__v54qStep) try { window.__v54qStep(V54Q.idx, S.length, s.name); } catch(e){}
  }
  V54Q.idx = Math.max(0, Math.min(V54Q.idx, S.length) - 1);
  v54qFree(); try { PLAYER.x = home[0]; PLAYER.y = home[1]; PLAYER._z = hz; PLAYER.v46p = null; } catch(e){}
  V54Q.on = false; V54Q.done = true; V54Q.rob.say = '';
  try { v54qOpen(); } catch(e){}
  try { toast(`🤖 Robo đi xong! Tìm thấy ${V54Q.iss.length} lỗi.`); } catch(e){}
  return v54qReport();
}
function v54qStop(){ V54Q.on = false; v54qUiStep(); }

function v54qInit(){
  const q = document.getElementById('quick'), b = document.createElement('button');
  b.id = 'v54qBtn'; b.type = 'button'; b.hidden = true; b.textContent = '🤖 Robo Thám Tử'; b.title = 'Robo đi kiểm tra lỗi (chỉ chủ game)'; b.onclick = v54qOpen;
  if(q){ const a = document.getElementById('hAdmin'); if(a && a.parentNode === q) a.after(b); else q.appendChild(b); }
  const ca0 = consoleApply; consoleApply = function(){ const r = ca0.apply(this, arguments); try { b.hidden = !v54qOK(); if(!v54qOK()){ V54Q.on = false; if(V54Q.ui) V54Q.ui.hidden = true; } } catch(e){} return r; };
  const t0 = toast; toast = function(){ V54Q.toastN++; return t0.apply(this, arguments); };
  try { const m0 = mentorSay; mentorSay = function(){ V54Q.toastN++; return m0.apply(this, arguments); }; } catch(e){}
  const vr0 = v46Render; v46Render = function(dt){ vr0(dt); if(V54Q.on) try { v54qDraw(); } catch(e){} };
  try { consoleApply(); } catch(e){}
}
