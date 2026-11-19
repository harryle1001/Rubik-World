// ================= v67l · LƯƠNG CỦA EM 2/4: giao diện — bảng lương, phiếu lương pixel có chữ ký thầy hiệu trưởng, lịch sử 7 lần =================
// Bảng toàn màn hình, chạm là dùng được trên điện thoại, chữ Nunito ≥ 16px. Bố cục: thẻ rộng 560 = 346 + 214 (tỷ lệ vàng) ở cột "chờ nhận".
function v67lCss(){
  if(document.getElementById('v67lCss')) return; const s = document.createElement('style'); s.id = 'v67lCss';
  s.textContent = `
#v67lPanel[hidden],#v67lSlip[hidden],#v67lPop[hidden],#v67lAsk[hidden],#v67lStage[hidden],#v67lFix[hidden],.v67lGo[hidden]{display:none!important}
#v67lPanel,#v67lSlip,#v67lAsk{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(12,10,8,.62);font-family:Nunito,'Be Vietnam Pro',sans-serif;color:#2b1a10;touch-action:manipulation}
#v67lSlip{z-index:97}#v67lAsk{z-index:96;align-items:flex-end}
.v67lCard{position:relative;width:min(560px,100%);max-height:100%;overflow:auto;-webkit-overflow-scrolling:touch;border-radius:22px;background:#f6ecd2;border:4px solid #2b1a10;box-shadow:0 0 0 4px #c8913e,0 22px 60px rgba(0,0,0,.55)}
.v67lHead{display:flex;align-items:center;gap:14px;padding:14px 18px 10px;background:linear-gradient(#e0a33a,#b9742a);color:#fff8e6;border-bottom:4px solid #2b1a10;position:sticky;top:0;z-index:1}
.v67lHead .v67lCoin{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:32px;background:#ffe07a;border:3px solid #2b1a10;box-shadow:inset 0 -5px 0 #d99a1e}
.v67lHead b{display:block;font-size:24px;font-weight:900;line-height:1.15;text-shadow:0 2px 0 rgba(0,0,0,.25)}.v67lHead span{font-size:16px;opacity:.95}
.v67lX{margin-left:auto;flex:none;width:48px;height:48px;border-radius:50%;border:3px solid #2b1a10;background:#f6ecd2;color:#2b1a10;font:900 22px Nunito,sans-serif;cursor:pointer}
.v67lCard section{margin:14px 14px 0;padding:12px 14px 14px;border-radius:16px;background:#fffaf0;border:3px solid #dcb98a}
.v67lCard section:last-child{margin-bottom:14px}
.v67lCard h3{margin:0 0 8px;font-size:19px;font-weight:900;color:#5a3418;display:flex;justify-content:space-between;align-items:baseline;gap:8px}.v67lCard h3 small{font-size:16px;font-weight:800;color:#8a6a48}
.v67lCard p{margin:6px 0;font-size:17px;line-height:1.45}
.v67lLvBar{height:14px;border-radius:8px;background:#ead7b4;border:2px solid #2b1a10;overflow:hidden;margin-top:6px}.v67lLvBar i{display:block;height:100%;background:linear-gradient(90deg,#ffd23f,#f08c2a)}
.v67lRow{display:grid;grid-template-columns:44px 1fr 62px;align-items:center;gap:10px;width:100%;min-height:56px;padding:6px 8px;margin:0 0 6px;border-radius:14px;border:2px solid #ead7b4;background:#fff;text-align:left;font-family:inherit;color:inherit;cursor:pointer}
.v67lRow:last-child{margin-bottom:0}.v67lRow:hover,.v67lRow:focus,.v67lRow:active{background:#fff!important;color:#2b1a10!important;border-color:#c8913e!important}.v67lHist button:hover,.v67lHist button:focus{background:#fff!important;color:#3a2414!important}.v67lRow .ic{font-size:28px;text-align:center}.v67lRow b{display:block;font-size:17px;font-weight:900}.v67lRow small{display:block;font-size:16px;color:#7a6048;line-height:1.25}
.v67lRow .bar{height:10px;border-radius:6px;background:#efe2c8;margin-top:4px;overflow:hidden}.v67lRow .bar i{display:block;height:100%;border-radius:6px;background:#3f9a4a}.v67lRow .bar i.full{background:#e0a33a}
.v67lRow .n{text-align:right;font-size:18px;font-weight:900;line-height:1.1}.v67lRow .n small{font-size:16px;font-weight:800;color:#8a6a48}
.v67lPay{display:grid;grid-template-columns:1.618fr 1fr;gap:12px;align-items:center}
.v67lBig{font-size:34px;font-weight:900;color:#2d6b36;line-height:1.1}.v67lBig small{display:block;font-size:16px;color:#7a6048;font-weight:800}
.v67lBtn{display:block;width:100%;min-height:56px;border-radius:16px;border:3px solid #2b1a10;background:linear-gradient(#ffd23f,#e8a23a);font:900 19px Nunito,sans-serif;color:#2b1a10;cursor:pointer;box-shadow:0 4px 0 #2b1a10}
.v67lBtn:active{transform:translateY(3px);box-shadow:0 1px 0 #2b1a10}.v67lBtn:disabled{opacity:.55;box-shadow:none}
.v67lBtn.g{background:linear-gradient(#7fd17a,#3f9a4a);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.25)}.v67lBtn.w{background:#fff}
.v67lNote{font-size:16px!important;color:#6a5038;margin:8px 0 0!important}
.v67lHist{display:flex;flex-direction:column;gap:6px}
.v67lHist button{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:48px;padding:6px 12px;border-radius:12px;border:2px solid #ead7b4;background:#fff;font:800 16px Nunito,sans-serif;color:#3a2414;cursor:pointer;text-align:left}
.v67lHist button b{font-size:18px;color:#2d6b36}
.v67lTabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}.v67lTabs button{min-height:44px;border-radius:12px;border:2px solid #dcb98a;background:#f6ecd2;font:900 16px Nunito,sans-serif;color:#5a3418;cursor:pointer}.v67lTabs button.on{background:#5a3418;color:#fff6e0;border-color:#2b1a10}
/* phiếu lương: giấy da, viền gỗ pixel kiểu Ninja Adventure */
.v67lPaper{position:relative;width:min(440px,100%);max-height:100%;overflow:auto;padding:22px 22px 18px;background:#f3e2b8;color:#3a2210;border:6px solid #5b3a1e;border-radius:4px;box-shadow:0 0 0 4px #2b1a10,0 0 0 10px #a86b34,0 0 0 14px #2b1a10,0 24px 60px rgba(0,0,0,.6);image-rendering:pixelated;font-family:Nunito,sans-serif;
  background-image:repeating-linear-gradient(0deg,rgba(120,80,30,.06) 0 2px,transparent 2px 6px),repeating-linear-gradient(90deg,rgba(120,80,30,.04) 0 2px,transparent 2px 8px)}
.v67lPaper:before,.v67lPaper:after{content:'';position:absolute;width:12px;height:12px;background:#2b1a10;box-shadow:inset -3px -3px 0 #a86b34}.v67lPaper:before{left:4px;top:4px}.v67lPaper:after{right:4px;top:4px}
.v67lPaper h2{margin:0;text-align:center;font:900 26px Nunito,sans-serif;letter-spacing:2px;color:#7a2a12;text-shadow:2px 2px 0 #e7c88c}
.v67lPaper .sch{text-align:center;font-size:16px;font-weight:900;color:#5b3a1e;margin:2px 0 10px}
.v67lPaper .meta{display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:3px dashed #a8814e;border-bottom:3px dashed #a8814e;padding:6px 0;margin-bottom:8px}
.v67lPaper table{width:100%;border-collapse:collapse;font-size:16px}.v67lPaper td{padding:5px 2px;border-bottom:2px dotted #c9a56e}.v67lPaper td:last-child{text-align:right;font-weight:900}
.v67lPaper tr.sum td{font-size:20px;font-weight:900;border-bottom:0;padding-top:10px;color:#2d6b36}
.v67lPaper .sign{display:grid;grid-template-columns:1fr 1.618fr;align-items:end;gap:8px;margin-top:10px}
.v67lPaper .sign canvas{width:100%;height:auto;display:block}.v67lPaper .sign p{margin:0;text-align:center;font-size:16px;font-weight:900}
.v67lPaper .v67lBtn{margin-top:12px}
#v67lPop{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 64px);transform:translateX(-50%);z-index:120;max-width:calc(100% - 32px);padding:10px 18px;border-radius:22px;background:rgba(43,26,16,.92);color:#ffe9a8;font:900 17px Nunito,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.4);pointer-events:none;text-align:center;line-height:1.35}
#v67lPop.v67lIn{animation:v67lIn .35s ease-out}@keyframes v67lIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}
.v67lPfB{display:block;width:100%;min-height:52px;margin-top:10px;border-radius:14px;border:3px solid #2b1a10;background:linear-gradient(#ffd23f,#e8a23a);font:900 18px Nunito,sans-serif;color:#2b1a10;cursor:pointer}.v67lPfB small{display:block;font-size:16px;font-weight:800}
.v67lGo{background:linear-gradient(#e05a8a,#a8306a)!important}
@media (max-width:420px){.v67lHead b{font-size:21px}.v67lBig{font-size:28px}.v67lPay{grid-template-columns:1fr}}
` + (typeof v67lStageCss === 'function' ? v67lStageCss() : '') + (typeof v67lJobsCss === 'function' ? v67lJobsCss() : '');
  document.head.appendChild(s);
}

// ---------- bảng lương ----------
function v67lOpen(){
  let p = document.getElementById('v67lPanel');
  if(!p){ p = document.createElement('div'); p.id = 'v67lPanel'; p.onclick = e => { if(e.target === p) v67lClose(); }; document.body.appendChild(p); }
  V67L.panel = p; V67L.tab = V67L.tab || 'today'; p.hidden = false; v67lRender();
}
function v67lClose(){ if(V67L.panel) V67L.panel.hidden = true; }
function v67lRender(){
  const p = V67L.panel; if(!p) return; const s = v67lState(), L = v67lLv(s.tot), C = v67lCalc(s), ok = v67lPayOK(s), wk = V67L.tab === 'week';
  const pct = L.next ? Math.min(100, Math.round((s.tot - L.from)/(L.next - L.from)*100)) : 100;
  const rows = V67L_CATS.map(c => { const v = wk ? s.week[c.k] : s.today[c.k], cap = wk ? V67L_CAP*7 : V67L_CAP, w = Math.min(100, Math.round(v/cap*100));
    return `<button type="button" class="v67lRow" data-k="${c.k}"><span class="ic">${c.ic}</span><span><b>${c.n}</b><small>${c.s}</small><span class="bar"><i class="${v >= cap ? 'full' : ''}" style="width:${w}%"></i></span></span><span class="n">${v}<small>/${cap}</small></span></button>`; }).join('');
  let when = '';
  if(ok.why === 'wait'){ const m = Math.round(ok.left), h = Math.floor(m/60); when = `⏰ Phát lương sau giờ tan học <b>16:00</b> (còn ${h ? h + ' giờ ' : ''}${m % 60} phút trong game).`; }
  else if(ok.why === 'none') when = '🌱 Làm việc tốt để có công — cuối ngày học nhận lương nhé!';
  else when = '✅ Đã tới giờ phát lương!';
  const bon = C.kinds >= 6 ? '🌟 Chuyên cần toàn diện (đủ 6 loại việc): +$30' : C.kinds >= 4 ? `⭐ Thưởng chuyên cần (${C.kinds} loại việc): +$12` : `Làm thêm ${4 - C.kinds} loại việc nữa để có thưởng chuyên cần +$12 (đủ 6 loại: +$30).`;
  const hist = s.hist.length ? s.hist.map((h, i) => `<button type="button" data-h="${i}"><span>📜 Phiếu số ${h.no} · ${new Date(h.at).toLocaleDateString('vi-VN')}<br><small>${v67lSum(h.c)} công · bậc ${v67lEsc(h.lv)}</small></span><b>+$${h.pay}</b></button>`).join('') : '<p class="v67lNote">Chưa có phiếu lương nào. Lần nhận đầu tiên sẽ hiện ở đây.</p>';
  p.innerHTML = `<div class="v67lCard" role="dialog" aria-label="Lương của em">
    <div class="v67lHead"><span class="v67lCoin">💰</span><div><b>Lương của em</b><span>Bậc ${L.i + 1} · ${L.name} · $${L.rate} mỗi công</span></div><button type="button" class="v67lX" aria-label="Đóng">✕</button></div>
    <section><h3>🎖️ Bậc lương <small>${s.tot} công đã nhận</small></h3><div class="v67lLvBar"><i style="width:${pct}%"></i></div>
      <p class="v67lNote">${L.next ? `Còn <b>${L.next - s.tot}</b> công nữa lên bậc <b>${L.nextName}</b> ($${v67lLv(L.next).rate}/công).` : 'Em đã đạt bậc cao nhất: Ngôi sao 🌟'}</p></section>
    <section><div class="v67lTabs"><button type="button" data-t="today" class="${wk ? '' : 'on'}">Hôm nay · ${v67lSum(s.today)} công</button><button type="button" data-t="week" class="${wk ? 'on' : ''}">Tuần này · ${v67lSum(s.week)} công</button></div>${rows}
      <p class="v67lNote">Mỗi nguồn tối đa ${V67L_CAP} công một ngày. Chạm một dòng để biết làm ở đâu.</p></section>
    <section><h3>💵 Chờ nhận <small>${C.cong} công × $${L.rate}</small></h3><div class="v67lPay"><div class="v67lBig">$${C.pay}<small>${C.bonus ? 'gồm thưởng chuyên cần $' + C.bonus : 'tiền trong game'}</small></div>
      <button type="button" class="v67lBtn g" id="v67lGet" ${ok.ok ? '' : 'disabled'}>💰 Nhận lương</button></div><p class="v67lNote">${when}</p><p class="v67lNote">${bon}</p></section>
    <section><h3>📜 Lịch sử nhận lương <small>7 lần gần nhất</small></h3><div class="v67lHist">${hist}</div></section></div>`;
  p.querySelector('.v67lX').onclick = v67lClose;
  p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { V67L.tab = b.dataset.t; v67lRender(); });
  p.querySelectorAll('[data-k]').forEach(b => b.onclick = () => v67lHow(b.dataset.k));
  p.querySelectorAll('[data-h]').forEach(b => b.onclick = () => v67lSlipShow(s.hist[+b.dataset.h], false));
  const g = p.querySelector('#v67lGet'); g.onclick = () => { const sl = v67lPay(); if(sl){ v67lRender(); v67lSlipShow(sl, true); } };
}
// chạm một nguồn: chỉ chỗ làm + nút đi tới (nếu có)
function v67lHow(k){
  const C = v67lCat(k), tips = {
    work:'Bày bán đồ ở cửa hàng của em (Chợ), thu hoạch nông trại, nấu ăn, câu cá rồi bán ở chợ.',
    art:'Lên sân khấu Hội trường lớn để diễn văn nghệ, hoặc chơi piano / guitar, vẽ tranh.',
    cont:'Chơi cờ vua, Rubik, Olympic thể thao, đấu online. Huy chương vàng được 3 công, bạc 2 công.',
    teach:'Thầy cô đi dạo quanh trường. Ai có bong bóng 📦 “Giúp cô với!” thì chạm vào để nhận việc mang đồ.',
    it:'Vào Trường Tin học: máy nào có dấu ⚠️ là đang hỏng — chạm để sửa, rồi báo cô Lam.',
    smart:'Học bài trên lớp, đọc sách ở thư viện, giải đố của Cây thần kỳ, học ở các trạm Tin học.'}[k];
  const go = {art:['🎤 Tới sân khấu', () => v67lStageGo()], it:['💻 Tới Trường Tin học', () => v67lItGo()], teach:['🧑‍🏫 Tìm thầy cô cần giúp', () => v67lTeachGo()]}[k];
  v67lPop(C.ic + ' ' + tips.slice(0, 60) + (tips.length > 60 ? '…' : ''));
  const p = V67L.panel, box = p && p.querySelector(`[data-k="${k}"]`); if(!box) return;
  let tip = p.querySelector('.v67lTip'); if(tip) tip.remove(); tip = document.createElement('div'); tip.className = 'v67lTip';
  tip.innerHTML = `<p class="v67lNote">${C.ic} ${tips}</p>` + (go ? `<button type="button" class="v67lBtn w">${go[0]}</button>` : '');
  tip.style.cssText = 'margin:-2px 0 8px;padding:8px 10px;border-radius:12px;background:#fff3d6;border:2px dashed #dcb98a'; box.after(tip);
  const b = tip.querySelector('button'); if(b) b.onclick = () => { v67lClose(); go[1](); };
}

// ---------- phiếu lương ----------
function v67lSlipShow(h, fresh){
  if(!h) return; let p = document.getElementById('v67lSlip');
  if(!p){ p = document.createElement('div'); p.id = 'v67lSlip'; p.onclick = e => { if(e.target === p) p.hidden = true; }; document.body.appendChild(p); }
  const d = new Date(h.at), rows = V67L_CATS.filter(c => h.c[c.k] > 0).map(c => `<tr><td>${c.ic} ${c.n}</td><td>${h.c[c.k]} công × $${h.rate}</td><td>$${h.c[c.k]*h.rate}</td></tr>`).join('');
  p.innerHTML = `<div class="v67lPaper" role="dialog" aria-label="Phiếu lương"><h2>PHIẾU LƯƠNG</h2><div class="sch">🏫 Trường Rubik Hà Quân · Số ${h.no}</div>
    <div class="meta"><span>👤 ${v67lEsc(h.name || 'Học sinh')}</span><span>📅 ${d.toLocaleDateString('vi-VN')} · Ngày ${h.day}</span></div>
    <table>${rows || '<tr><td>Chưa có công</td><td></td><td>$0</td></tr>'}<tr><td>🎖️ Bậc ${v67lEsc(h.lv)}</td><td>${v67lSum(h.c)} công</td><td>$${h.base}</td></tr>
    ${h.bonus ? `<tr><td>⭐ Thưởng chuyên cần</td><td>${h.kinds} loại việc</td><td>$${h.bonus}</td></tr>` : ''}<tr class="sum"><td colspan="2">TỔNG NHẬN</td><td>$${h.pay}</td></tr></table>
    <div class="sign"><canvas width="160" height="120" aria-label="Con dấu nhà trường"></canvas><div><canvas width="260" height="90" aria-label="Chữ ký"></canvas><p>Thầy Hiệu trưởng</p></div></div>
    <p class="v67lNote" style="text-align:center">${fresh ? 'Giỏi lắm! Tiền đã vào ví của em 💛' : 'Cảm ơn em đã chăm chỉ!'}</p><button type="button" class="v67lBtn">👍 Cảm ơn thầy!</button></div>`;
  p.hidden = false; p.querySelector('.v67lBtn').onclick = () => { p.hidden = true; };
  const cv = p.querySelectorAll('canvas'); try { v67lStamp(cv[0].getContext('2d')); v67lSign(cv[1].getContext('2d'), h.no); } catch(e){}
}
// con dấu đỏ tròn, chữ chạy vòng
function v67lStamp(g){
  g.save(); g.translate(80, 60); g.rotate(-.18); g.strokeStyle = g.fillStyle = 'rgba(196,30,30,.82)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 52, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 36, 0, 7); g.stroke();
  const t = 'TRƯỜNG RUBIK HÀ QUÂN ★ '; g.font = '900 11px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for(let i = 0; i < t.length; i++){ const a = -Math.PI/2 + i/t.length*Math.PI*2; g.save(); g.rotate(a); g.translate(0, -44); g.rotate(0); g.fillText(t[i], 0, 0); g.restore(); }
  g.font = '900 24px Nunito, sans-serif'; g.fillText('φ', 0, -6); g.font = '900 11px Nunito, sans-serif'; g.fillText('ĐÃ DUYỆT', 0, 16); g.restore();
}
// chữ ký thầy hiệu trưởng (nét bút vẽ bằng đường cong, luôn giống nhau)
function v67lSign(g, seed){
  g.strokeStyle = '#1d2b6b'; g.lineWidth = 2.6; g.lineCap = g.lineJoin = 'round'; g.beginPath();
  g.moveTo(14, 60); g.bezierCurveTo(30, 10, 44, 8, 40, 46); g.bezierCurveTo(36, 78, 58, 30, 72, 40); g.bezierCurveTo(84, 50, 78, 64, 96, 52);
  g.bezierCurveTo(112, 40, 106, 22, 124, 30); g.bezierCurveTo(140, 38, 130, 62, 150, 54); g.bezierCurveTo(170, 44, 176, 24, 192, 34); g.bezierCurveTo(206, 44, 200, 60, 222, 52);
  g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(26, 74); g.bezierCurveTo(90, 66 + (seed % 3), 170, 80, 244, 62); g.stroke();
}
