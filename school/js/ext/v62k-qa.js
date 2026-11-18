// ================= v62k · 10 THẦY CÔ GIÁO SƯ (3/3 · chơi thử & báo lỗi) — CHỈ CHỦ GAME =================
// Mỗi thầy cô nhận một mảng game, tái dùng bộ máy Robo Thám Tử v54q (lộ trình, bắt lỗi JS, FPS, kẹt, dịch chuyển, nhãn, nút che, chữ nhỏ, không đóng được).
V62K.qa = {on:false, cur:null, rep:{}, at:'', vp:'', ui:null};
// bước thêm theo mảng của từng thầy cô (ngoài lộ trình v54q)
function v62kQaExtra(x){
  const open = (name, f, back) => ({k:'x', name, run:async () => { const base = v54qSig(); try { f(); } catch(e){ v54qIssue('high', 'mở', `Mở “${name}” bị lỗi JS`, {desc:e.message, stack:e.stack, file:v54qLoc(e.stack)}); return; }
    await v54qSleep(1100); if(v54qScan(name)) await v54qSleep(800); if(back){ try { back(); } catch(e){} await v54qSleep(400); } else await v54qClose(base, name); }});
  const M = {
    rubik3d:() => open('🧊 Rubik 3D', () => openRubik()),
    library:() => open('📚 Thư viện sách', () => openLibrary()),
    music:() => open('🎹 Phòng nhạc', () => openMusic('piano')),
    planet:() => open('🪐 Nhìn cả hành tinh', () => v56pToggle(), () => v56pBack()),
    plane3:() => ({k:'x', name:'✈️ Góc nhìn máy bay v57p', run:async () => { if(typeof v57pInit !== 'function') v54qIssue('low', 'mở', 'Không thấy bộ máy v57p', {noShot:true}); }}),
    texts:() => ({k:'x', name:'🔎 Soát chữ hỏng trong các hộp thoại', run:async () => {
      const bad = []; document.querySelectorAll('.modal, [role=dialog], #quick, .hud, header, nav').forEach(m => { const s = (m.textContent || ''); const r = /(undefined|NaN|\[object Object\]|\bnull\b)/.exec(s);
        if(r && bad.length < 10) bad.push(`#${m.id || m.className || m.tagName}: “…${s.slice(Math.max(0, r.index - 24), r.index + 24).replace(/\s+/g, ' ')}…”`); });
      if(bad.length) v54qIssue('mid', 'nhãn', `Có chữ “undefined/NaN/null” trong ${bad.length} hộp thoại`, {desc:bad.join(' · '), key:'text|bad', noShot:true}); }}),
    bilingual:() => ({k:'x', name:'🔤 Soát menu song ngữ', run:async () => {
      let L = []; try { L = v32Items(); } catch(e){ v54qIssue('mid', 'nhãn', 'v32Items() lỗi', {desc:e.message}); return; }
      const vi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i, miss = [], mix = [];
      L.forEach(i => { if(!i.vi || !i.en) miss.push(i.vi || i.en || '?'); else if(vi.test(i.en)) mix.push(i.en); });
      ['owner', 'brain', 'system', 'play'].forEach(k => { try { (v32SubItems(k) || []).forEach(i => { if(!i.vi || !i.en) miss.push((i.vi || i.en || '?') + ' (' + k + ')'); else if(vi.test(i.en)) mix.push(i.en); }); } catch(e){} });
      if(miss.length) v54qIssue('mid', 'nhãn', `Menu thiếu nhãn Việt hoặc Anh (${miss.length})`, {desc:miss.slice(0, 12).join(' · '), key:'bil|miss', noShot:true});
      if(mix.length) v54qIssue('low', 'nhãn', `Nhãn tiếng Anh còn dấu tiếng Việt (${mix.length})`, {desc:mix.slice(0, 12).join(' · '), key:'bil|mix', noShot:true}); }}),
    tap:() => ({k:'x', name:'👆 Kiểm tra chạm-để-đi (v58t)', run:async () => {
      try { v54qFree(); const G = v46Gate(); v54qTeleNew(G[0], G[1] + 60); await v54qSleep(300);
        if(typeof v58tBlocked === 'function' && v58tBlocked() && PLAYER.visible && !PLAYER.boat && !PLAYER.cycling && !(V51P && V51P.on)){
          const why = []; try { if(V57P.on) why.push('V57P.on = true'); } catch(e){} try { if(v56pActive()) why.push('v56pActive()'); } catch(e){}
          v54qIssue('high', 'mở', 'Chạm-để-đi/chạm-cửa-mở-luôn (v58t) bị chặn khi đang đi bộ bình thường', {desc:'v58tBlocked() trả true ngay ở cổng trường khi đi bộ. Nguyên nhân: ' + (why.join(', ') || '?') + '. V57P.on được bật từ lúc khởi động (v57pInit) nên nhánh chạm v58t luôn rơi về v32Tap cũ.',
            repro:'Vào game, đi bộ ở cổng trường, chạm vào một cửa/điểm mini game ở xa: nhân vật không tự đi tới rồi mở.', file:'js/ext/v58t-tap.js:15 (V57P.on) · js/ext/v57p-view.js:179', key:'tap|v58t'}); } } catch(e){} }}),
    sound:() => ({k:'x', name:'🔊 Kiểm tra âm thanh', run:async () => {
      try { v39Sfx('open', .2); } catch(e){ v54qIssue('mid', 'js', 'v39Sfx lỗi', {desc:e.message, stack:e.stack}); }
      try { if(typeof AC !== 'undefined' && AC && AC.state === 'closed') v54qIssue('mid', 'js', 'AudioContext đã bị đóng', {noShot:true}); } catch(e){} }})
  };
  return M[x] ? M[x]() : null;
}
function v62kQaSteps(t){
  let S = []; try { S = v54qBuild(); } catch(e){ v54qIssue('high', 'js', 'v54qBuild() lỗi', {desc:e.message}); }
  const re = t.def.qa.re, seen = new Set(), L = [S[1]].filter(Boolean);
  S.forEach(s => { if(s.k === 'hud' || !re.test(s.name)) return; const k = s.name.replace(/\s+·.*$/, ''); if(seen.has(k) && s.k === 'door') return; seen.add(k); L.push(s); });
  const out = L.slice(0, 22); (t.def.qa.x || []).forEach(x => { const s = v62kQaExtra(x); if(s) out.push(s); });
  return out;
}
async function v62kQaRun(ids){
  if(!v62kOK() || V62K.qa.on || V54Q.on) return null;
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible){ toast('🧑‍🏫 Đăng nhập và vào thế giới trước nhé!'); return null; }
  const Q = V62K.qa, T = V62K.T.filter(t => !ids || ids.includes(t.id)); Q.on = true; Q.at = new Date().toISOString(); Q.vp = innerWidth + '×' + innerHeight;
  const home = [PLAYER.x, PLAYER.y], hz = PLAYER._z; try { if(Q.ui) Q.ui.hidden = true; } catch(e){}
  const e0 = V54Q.errs.length;
  for(const t of T){
    if(!Q.on || !v62kOK()) break; Q.cur = t;
    V54Q.iss = []; V54Q.keys = new Map(); V54Q.nshot = 0; V54Q.fps = {min:999, sum:0, cnt:0}; V54Q.sf = {min:999, sum:0, cnt:0}; V54Q.fw = {t:0, n:0}; V54Q.vp = Q.vp;
    V54Q.on = true; V54Q.t0 = Date.now(); V54Q.rob.ok = false; if(!V54Q.raf){ V54Q.raf = true; requestAnimationFrame(v54qFrame); }
    const S = v62kQaSteps(t); V54Q.steps = S; const t0 = Date.now();
    for(V54Q.idx = 0; V54Q.idx < S.length && Q.on; V54Q.idx++){
      const s = S[V54Q.idx]; v54qSay(t.def.ic + ' ' + s.name);
      try { await s.run(); } catch(e){ v54qIssue('mid', 'js', `Bước “${s.name}” ném lỗi`, {desc:e.message, stack:e.stack, file:v54qLoc(e.stack), key:'step|' + e.message.slice(0, 60)}); }
      v54qStepFps(s.name); try { v54qForceClose(); } catch(e){}
      if(window.__v62kStep) try { window.__v62kStep(t.id, V54Q.idx, S.length, s.name); } catch(e){}
    }
    V54Q.on = false; v54qFree();
    Q.rep[t.id] = {id:t.id, n:t.def.n, s:t.def.s, mission:t.def.qa.t, steps:S.map(s => s.name), secs:Math.round((Date.now() - t0)/1000), fps:{avg:v54qFpsAvg(), min:Math.round(Math.min(V54Q.fps.min, 999))}, issues:V54Q.iss.slice(), tips:v62kQaTips(V54Q.iss)};
    v62kQaSaveLocal();
  }
  try { PLAYER.x = home[0]; PLAYER.y = home[1]; PLAYER._z = hz; PLAYER.v46p = null; } catch(e){}
  Q.on = false; Q.cur = null; V54Q.rob.say = ''; Q.errs = V54Q.errs.slice(e0);
  try { v62kQaOpen(); } catch(e){} try { v62kQaCloud(); } catch(e){}
  const n = Object.values(Q.rep).reduce((a, r) => a + r.issues.length, 0); try { toast(`🧑‍🏫 Thầy cô kiểm tra xong: ${n} lỗi.`); } catch(e){}
  return v62kQaReport();
}
function v62kQaStop(){ V62K.qa.on = false; V54Q.on = false; }
// gợi ý sửa theo loại lỗi (ngắn)
const V62K_TIP = {js:'Xem stack, bọc try/catch đúng chỗ và sửa biến chưa khai báo.', fps:'Cache hình vẽ tĩnh, giảm hạt/bóng mờ khi zoom xa.', nan:'Chặn chia cho 0, kiểm tra isFinite trước khi gán toạ độ.',
  'kẹt':'Mở đường đi (navFind/v46Route) quanh vật cản hoặc dời cửa ra đường.', 'nhảy':'Không dịch chuyển nhân vật khi đổi toạ độ cũ↔mới; nội suy vị trí.', 'nhãn':'Điền đủ name/ic; nhãn tiếng Anh viết không dấu.',
  'nút':'Gắn onclick hoặc ẩn nút chưa dùng.', 'chữ':'Nâng cỡ chữ lên ≥ 16px (Nunito 700).', 'tràn':'Dùng max-width: 100vw, flex-wrap, cuộn trong khung.', 'che':'Dời nút theo lưới tỷ lệ vàng, tránh vị trí cố định trùng nhau.',
  'mở':'Kiểm tra hàm mở và cửa (DOORS) có trả về đúng mini game.', 'đóng':'Thêm nút ✕ và hỗ trợ phím Esc.', 'khu':'Tách khung khu trong V46L.zones cho khỏi đè.'};
function v62kQaTips(L){ return [...new Set(L.map(i => i.cat))].map(c => V62K_TIP[c]).filter(Boolean); }
function v62kQaLite(){ const R = {}; Object.values(V62K.qa.rep).forEach(r => { R[r.id] = Object.assign({}, r, {issues:r.issues.map(i => Object.assign({}, i, {shot:''}))}); }); return R; }
function v62kQaReport(full){
  const Q = V62K.qa, rep = full ? Q.rep : v62kQaLite(), c = {high:0, mid:0, low:0}; Object.values(Q.rep).forEach(r => r.issues.forEach(i => c[i.sev]++));
  return {ver:'v62k', at:Q.at, vp:Q.vp, touch:document.body.classList.contains('touchdev'), count:c, teachers:rep, errors:Q.errs || []};
}
function v62kQaSaveLocal(){ try { localStorage.setItem('v62k-qa-last', JSON.stringify(v62kQaReport())); } catch(e){} }
async function v62kQaCloud(){ // lưu vào CSDL game (claude db) dưới nhánh riêng của chủ game
  if(!v62kOK()) return false;
  try { const db = (typeof V40 !== 'undefined' && V40.db) || (typeof CLOUD !== 'undefined' && CLOUD.db), uid = (typeof V40 !== 'undefined' && V40.uid) || (typeof CLOUD !== 'undefined' && CLOUD.uid);
    if(!db || !uid) return false; await db.doc(`data/users/${uid}/v62k-teacher-report`).set({json:JSON.stringify(v62kQaReport()).slice(0, 900000), at:Date.now()}); return true; } catch(e){ return false; }
}
function v62kQaJson(){
  if(!v62kOK()) return;
  try { const b = new Blob([JSON.stringify(v62kQaReport(true), null, 1)], {type:'application/json'}), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'thay-co-kiem-tra-' + Date.now() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); } catch(e){ toast('Không tải được JSON: ' + e.message); }
}
// thầy cô đang kiểm tra đi theo người chơi (thay cho Robo)
function v62kQaDraw(){
  const t = V62K.qa.cur; if(!t || !PLAYER || !PLAYER.visible) return; const R0 = V54Q.rob, p = v46Pos(PLAYER), tx = p[0] - 30, ty = p[1] - 4;
  if(!R0.ok || Math.hypot(R0.x - tx, R0.y - ty) > 900){ R0.x = tx; R0.y = ty; R0.ok = true; } R0.x += (tx - R0.x)*.15; R0.y += (ty - R0.y)*.15; R0.f++;
  ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z))); ctx.imageSmoothingEnabled = false;
  const x = Math.round(R0.x), y = Math.round(R0.y), img = v62kSpr(t, (R0.f >> 3) % 3, 2);
  ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 11, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(img, x - 16, y - 52);
  const say = R0.say; if(say){ const fs = 16/cam.z; ctx.font = `800 ${fs}px Nunito, sans-serif`; const w = ctx.measureText(say).width + 14/cam.z, h = fs*1.5, bx = x - w/2, by = y - 60 - h;
    ctx.fillStyle = 'rgba(20,28,48,.92)'; ctx.fillRect(bx, by, w, h); ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx, by + h - 2/cam.z, w, 2/cam.z);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(say, x, by + h/2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}

// ---------- bảng "Báo cáo của thầy cô" ----------
function v62kQaUi(){
  if(V62K.qa.ui) return V62K.qa.ui; const p = document.createElement('div'); p.id = 'v62kQa'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Báo cáo của thầy cô');
  p.innerHTML = `<header><span style="font-size:26px">🧑‍🏫</span><b>Báo cáo của thầy cô</b><button type="button" class="x" id="v62kQaX" aria-label="Đóng">✕</button></header>
    <div id="v62kQaSt"></div><div class="act"><button type="button" class="pri" id="v62kQaGo">▶ Cả 10 thầy cô kiểm tra</button><button type="button" id="v62kQaJ">⬇ Tải JSON</button><button type="button" id="v62kQaC">☁ Lưu</button></div><div id="v62kQaL"></div>`;
  document.body.appendChild(p); V62K.qa.ui = p;
  p.querySelector('#v62kQaX').onclick = () => { p.hidden = true; };
  p.querySelector('#v62kQaGo').onclick = () => { V62K.qa.on ? v62kQaStop() : v62kQaRun(); };
  p.querySelector('#v62kQaJ').onclick = v62kQaJson;
  p.querySelector('#v62kQaC').onclick = async () => toast(await v62kQaCloud() ? '☁ Đã lưu báo cáo vào cơ sở dữ liệu game.' : '☁ Chưa kết nối được cơ sở dữ liệu (chỉ có trên claude.ai). Đã lưu trên máy.');
  p.querySelector('#v62kQaL').onclick = e => { const b = e.target.closest('button'); if(!b) return; if(b.dataset.run) v62kQaRun([b.dataset.run]); if(b.dataset.go) v62kQaGo(b.dataset.go); };
  return p;
}
function v62kQaGo(k){
  if(!v62kOK()) return; const [tid, id] = k.split(':'), r = V62K.qa.rep[tid], i = r && r.issues.find(q => q.id === +id); if(!i || !i.where) return;
  if(i.where.ox != null) v54qTele(i.where.ox, i.where.oy); else v54qTeleNew(i.where.x, i.where.y);
  try { toast(`📍 ${r.n}: lỗi #${id} — ${i.title.slice(0, 60)}`); } catch(e){} if(innerWidth < 760) V62K.qa.ui.hidden = true;
}
function v62kQaOpen(){
  if(!v62kOK()) return; const p = v62kQaUi(); p.hidden = false; const Q = V62K.qa;
  if(!Object.keys(Q.rep).length) try { const o = JSON.parse(localStorage.getItem('v62k-qa-last') || 'null'); if(o && o.teachers){ Q.rep = o.teachers; Q.at = o.at; Q.vp = o.vp; } } catch(e){}
  const all = Object.values(Q.rep), n = all.reduce((a, r) => a + r.issues.length, 0);
  p.querySelector('#v62kQaSt').textContent = Q.on ? '🚶 Thầy cô đang đi kiểm tra…' : all.length ? `✅ ${all.length} thầy cô đã báo ${n} lỗi · ${Q.vp} · ${String(Q.at).slice(0, 16).replace('T', ' ')}` : 'Bấm ▶ để 10 thầy cô đi chơi thử từng mảng game và báo lỗi cho em.';
  const ord = {high:0, mid:1, low:2}, cls = {high:'h', mid:'m', low:'l'};
  p.querySelector('#v62kQaL').innerHTML = V62K.T.map(t => { const r = Q.rep[t.id], L = r ? r.issues.slice().sort((a, b) => ord[a.sev] - ord[b.sev] || a.id - b.id) : [], c = {high:0, mid:0, low:0}; L.forEach(i => c[i.sev]++);
    return `<details class="tq"${L.some(i => i.sev === 'high') ? ' open' : ''}><summary><img src="${v62kPortrait(t, 3)}" alt=""><span><b>${t.def.n}</b><small>${v62kEsc(t.def.qa.t)}</small></span>
      <em class="h">${c.high}</em><em class="m">${c.mid}</em><em class="l">${c.low}</em></summary>
      <div class="tb">${r ? `<p>⏱ ${r.secs}s · ${r.steps.length} chỗ · FPS TB ${r.fps.avg} (thấp nhất ${r.fps.min})</p>${r.tips.length ? `<p>💡 ${r.tips.map(v62kEsc).join(' ')}</p>` : ''}` : '<p>Chưa kiểm tra.</p>'}
      ${L.map(i => `<div class="it ${cls[i.sev]}">${i.shot ? `<img src="${i.shot}" alt="Ảnh vị trí lỗi">` : ''}<p><b>#${i.id} ${v62kEsc(i.title)}</b>${i.n > 1 ? ' ×' + i.n : ''}</p>${i.desc ? `<p>${v62kEsc(i.desc).slice(0, 400)}</p>` : ''}${i.file ? `<p>📄 ${v62kEsc(i.file)}</p>` : ''}${i.where ? `<button type="button" data-go="${t.id}:${i.id}">📍 Đi tới chỗ lỗi</button>` : ''}</div>`).join('')}
      <button type="button" data-run="${t.id}">▶ ${t.def.n} kiểm tra lại</button></div></details>`; }).join('');
}
function v62kQaInit(){
  const d0 = v54qDraw; v54qDraw = function(){ if(V62K.qa.cur) return v62kQaDraw(); return d0.apply(this, arguments); };
  const q = document.getElementById('quick'), b = document.createElement('button'); b.id = 'v62kQaBtn'; b.type = 'button'; b.hidden = true; b.textContent = '🧑‍🏫 Thầy cô kiểm tra'; b.onclick = v62kQaOpen;
  if(q){ const a = document.getElementById('v54qBtn'); if(a && a.parentNode === q) a.after(b); else q.appendChild(b); }
  const ca0 = consoleApply; consoleApply = function(){ const r = ca0.apply(this, arguments); try { b.hidden = !v62kOK(); if(!v62kOK()){ V62K.qa.on = false; if(V62K.qa.ui) V62K.qa.ui.hidden = true; } } catch(e){} return r; };
  try { consoleApply(); } catch(e){}
}
