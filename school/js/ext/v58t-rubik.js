// ================= v58t · RUBIK 3D: toàn màn hình, gợi ý TỪNG NƯỚC và chờ người chơi tự xoay =================
// - Khối chiếm gần hết màn hình; vuốt trên một mặt để xoay tầng, vuốt ra ngoài khối để xoay cả khối nhìn.
// - Bỏ các khung dưới (lịch sử, lời giải, chữ dài, bàn phím U/U'/D…). Chỉ còn thanh mỏng: ✕ · ? · đồng hồ · 💡 · 🔀 · ↺.
// - 💡: hiện mũi tên cong + tên MỘT nước. Người chơi xoay đúng → sang nước kế. Xoay sai → gợi ý nước sửa (ngược lại).
//   Lời giải = đảo ngược mọi nước đã xoay từ lúc khối còn đúng (V45R.seq, đã gộp các nước cùng tầng), nên luôn khớp.
// - Giải xong: màn chúc mừng + thời gian + Play again.
function v58tStep(){
  const L = V45R.seq, e = L[L.length - 1]; if(!e) return null;
  const k = (4 - e.k) % 4; return {axis:e.axis, layer:e.layer, dir:k === 3 ? -1 : 1, n:k === 2 ? 2 : 1};
}
function v58tSay(t, cls){ const el = $('#v58tSay'); if(!el) return; el.textContent = t || ''; el.className = cls || ''; el.hidden = !t; clearTimeout(V58T.sayT); if(t && cls !== 'keep') V58T.sayT = setTimeout(() => { el.hidden = true; }, 1800); }
function v58tHint(on){
  const G = V58T.rubik; G.hint = on === undefined ? !G.hint : on; $('#v58tHint').classList.toggle('on', G.hint); if(!G.hint) $('#v58tMove').hidden = true;
  if(G.hint && !v58tStep()){ G.hint = false; $('#v58tHint').classList.remove('on'); v58tSay('🔀 Xáo trộn trước nhé!'); }
}
function v58tWin(secs, moves){
  const w = $('#v58tWin'); if(!w) return; w.querySelector('.v58tT').textContent = `⏱ ${pad2(Math.floor(secs/60))}:${(secs % 60).toFixed(1).padStart(4, '0')}`;
  w.querySelector('.v58tM').textContent = `${moves} nước`; w.hidden = false; try { cheerSfx(); } catch(e){}
}
function v58tRubikUi(){
  const m = $('#mRubik'); if(!m || $('#v58tBar')) return; const box = m.querySelector('.mbox');
  const bar = document.createElement('div'); bar.id = 'v58tBar';
  bar.innerHTML = '<button type="button" class="v58tb" data-a="x" aria-label="Đóng">✕</button><button type="button" class="v58tb" data-a="q" aria-label="Hướng dẫn">?</button>' +
    '<span class="v58tclock" aria-live="off">00:00.0</span>' +
    '<button type="button" class="v58tb" id="v58tHint" data-a="h" aria-label="Gợi ý từng nước">💡</button><button type="button" class="v58tb" data-a="s" aria-label="Xáo trộn">🔀</button><button type="button" class="v58tb" data-a="r" aria-label="Làm lại">↺</button>';
  box.insertBefore(bar, box.firstChild);
  const say = document.createElement('div'); say.id = 'v58tSay'; say.hidden = true; m.querySelector('.v45stage').appendChild(say);
  const mv = document.createElement('div'); mv.id = 'v58tMove'; mv.hidden = true; m.querySelector('.v45stage').appendChild(mv);
  const help = document.createElement('div'); help.id = 'v58tHelp'; help.hidden = true;
  help.innerHTML = '<p>👆 Vuốt trên một mặt → xoay tầng đó</p><p>🔄 Vuốt ra ngoài khối → xoay để nhìn</p><p>💡 Gợi ý: làm từng nước theo mũi tên</p><p>🔀 Xáo trộn · ↺ Làm lại</p>';
  help.onclick = () => { help.hidden = true; }; m.querySelector('.v45stage').appendChild(help);
  const win = document.createElement('div'); win.id = 'v58tWin'; win.hidden = true;
  win.innerHTML = '<div class="v58tCard"><div class="v58tBig">🎉</div><b>Giải xong!</b><div class="v58tT"></div><div class="v58tM"></div><button type="button" class="v58tPlay">Play again</button></div>';
  win.querySelector('.v58tPlay').onclick = () => { win.hidden = true; $('#rscramble').click(); };
  m.querySelector('.v45stage').appendChild(win);
  bar.onclick = e => { const b = e.target.closest('button'); if(!b) return; const a = b.dataset.a;
    if(a === 'x'){ const c = m.querySelector('.mclose'); if(c) c.click(); else hideModal(); }
    else if(a === 'q') help.hidden = !help.hidden;
    else if(a === 'h') v58tHint();
    else if(a === 's'){ win.hidden = true; $('#rscramble').click(); }
    else if(a === 'r'){ win.hidden = true; v58tHint(false); $('#rreset').click(); } };
}
function v58tRubikInit(){
  const G = V58T.rubik = {hint:false, want:null, sayT:0};
  v58tRubikUi(); document.body.classList.add('v58tR');
  // mũi tên: chế độ gợi ý thay thế hẳn chế độ "giải giúp" tự chạy
  const ar0 = v45R3Arrow; v45R3Arrow = function(S, ov, now){
    if(!G.hint) return ar0.apply(this, arguments);
    const busy = R3 && (R3.anim || R3.queue.length), st = busy ? null : v58tStep();
    const nm = st ? '💡 ' + r3Name(st) : '', el = $('#v58tMove'); if(el && el.textContent !== nm){ el.textContent = nm; el.hidden = !nm; }
    return ar0.call(this, {cur:null, on:!!st, idx:0, plan:st ? [st] : []}, ov, now);
  };
  // mỗi nước người chơi xoay xong: đúng gợi ý → nước kế; sai → gợi ý nước sửa
  const rs0 = rubikStep; rubikStep = function(){
    const a = R3 && R3.anim, was = R3 && R3.scrambled, want = G.hint ? v58tStep() : null;
    const r = rs0.apply(this, arguments);
    if(a && R3.anim !== a && a.q.record){
      if(want){ const ok = a.q.axis === want.axis && a.q.layer === want.layer && (want.n === 2 || a.q.dir === want.dir);
        if(ok) { try { blipSfx(1320); } catch(e){} } else v58tSay('↩ Xoay ngược lại nhé', 'bad'); }
      if(was && !R3.scrambled && !R3.scrambling){ v58tHint(false); v58tWin((performance.now() - R3.t0)/1000, R3.moves); }
    }
    return r;
  };
  // đồng hồ trên thanh mỏng
  // khung khối phủ hết màn hình: giữ khối vừa cạnh ngắn (màn dọc thì nới góc nhìn dọc), phóng nhẹ cho to
  const fit = () => { const cv = R3 && R3.renderer.domElement, w = cv && cv.clientWidth, h = cv && cv.clientHeight; if(!w || !h) return; const a = w/h, f = a < 1 ? 2*Math.atan(Math.tan(19*Math.PI/180)/a)*180/Math.PI : 38;
    if(Math.abs(R3.camera.fov - f) > .01 || R3.camera.zoom !== (a < 1 ? 1.12 : 1.3)){ R3.camera.fov = f; R3.camera.zoom = a < 1 ? 1.12 : 1.3; R3.camera.aspect = a; R3.camera.updateProjectionMatrix(); } };
  const rl0 = rubikLoop; rubikLoop = function(now){ if(R3 && R3.running) fit(); const r = rl0.apply(this, arguments); const c = $('#v58tBar .v58tclock'), t = $('#rtimer'); if(c && t && c.textContent !== t.textContent) c.textContent = t.textContent; return r; };
  // xáo / làm lại: tắt gợi ý, ẩn màn chúc mừng
  const sc0 = $('#rscramble').onclick; $('#rscramble').onclick = function(){ v58tHint(false); $('#v58tWin').hidden = true; return sc0.apply(this, arguments); };
  const or0 = openRubik; openRubik = function(){ const r = or0.apply(this, arguments); $('#v58tHelp').hidden = true; return r; };
}
