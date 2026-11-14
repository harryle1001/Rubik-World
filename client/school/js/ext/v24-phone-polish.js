// ================= EXT29 (v24): phone polish — compact quick bar + "More" sheet, full-screen windows, power saver, vibration =================
const M24KEY = 'truong-mobile-v24';
function v24Init(){
  const M = {joy:true, vib:true, saver:'auto'}; try { Object.assign(M, JSON.parse(localStorage.getItem(M24KEY) || '{}')); } catch(e){}
  const save = () => { try { localStorage.setItem(M24KEY, JSON.stringify(M)); } catch(e){} };
  document.body.classList.toggle('nojoy', !M.joy);
  // --- quick bar: a few big buttons, everything else in a bottom sheet ---
  const quick = $('#quick');
  if(quick){
    ['hMenu', 'hShop', 'hHome', 'hEnter', 'hFish'].forEach(id => { const b = $('#' + id); if(b) b.classList.add('mkeep'); });
    const more = document.createElement('button'); more.type = 'button'; more.id = 'mMore'; more.className = 'mkeep'; more.textContent = '⋯ Thêm'; more.setAttribute('aria-expanded', 'false'); quick.appendChild(more);
    const setOpen = o => { quick.classList.toggle('open', o); more.textContent = o ? '✕ Đóng' : '⋯ Thêm'; more.setAttribute('aria-expanded', String(o)); if(o) quick.scrollTop = 0; };
    more.onclick = e => { e.stopPropagation(); setOpen(!quick.classList.contains('open')); };
    quick.addEventListener('click', e => { const b = e.target.closest('button'); if(b && b !== more && quick.classList.contains('open')) setTimeout(() => setOpen(false), 80); });
    quick.addEventListener('change', () => { if(quick.classList.contains('open')) setTimeout(() => setOpen(false), 80); });
    if(typeof cvs !== 'undefined' && cvs) cvs.addEventListener('pointerdown', () => { if(quick.classList.contains('open')) setOpen(false); });
  }
  // --- power saver: clouds off when the phone struggles ---
  const cloudsOff = () => { const c = $('#mapClouds'); if(c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change', {bubbles:true})); } };
  if(M.saver === 'on') cloudsOff();
  let frames = 0, t0 = performance.now(), low = 0, warned = false;
  (function tick(t){ frames++; if(t - t0 >= 2000){ const fps = frames*1000/(t - t0); frames = 0; t0 = t;
      if(!document.hidden && !document.querySelector('.modal:not([hidden])')) low = fps < 32 ? low + 1 : 0;
      if(low >= 2 && !warned && M.saver === 'auto' && MOB.touch){ warned = true; cloudsOff(); toast('Máy hơi chậm nên đã tắt mây bay cho mượt hơn. Vẫn giật thì bật "Tiết kiệm pin" trong Cài đặt.'); } }
    requestAnimationFrame(tick); })(performance.now());
  // --- gentle vibration on level up ---
  const lv = $('#lvlUp');
  if(lv) try { new MutationObserver(() => { if(!lv.hidden && M.vib && navigator.vibrate) try { navigator.vibrate([40, 60, 90]); } catch(e){} }).observe(lv, {attributes:true, attributeFilter:['hidden']}); } catch(e){}
  // --- settings section ---
  const a = $('#stMini'), sec = a && a.closest('.stsec'), host = sec || $('#mSet .mbox');
  if(host){ const s = document.createElement('div'); s.className = 'stsec';
    s.innerHTML = '<h3>Điện thoại &amp; cảm ứng</h3>' +
      '<label class="strow"><span>Hiện joystick và nút E / Bay / Bản đồ</span><input type="checkbox" id="stJoy"></label>' +
      '<label class="strow"><span>Rung nhẹ khi lên level</span><input type="checkbox" id="stVib"></label>' +
      '<label class="strow"><span>Tiết kiệm pin <small>(tắt mây, giảm độ nét; tải lại trang để áp dụng đủ)</small></span><select id="stSaver"><option value="auto">Tự động</option><option value="on">Bật</option><option value="off">Tắt</option></select></label>';
    if(sec) sec.after(s); else host.appendChild(s);
    const j = $('#stJoy'), v = $('#stVib'), sv = $('#stSaver'); j.checked = M.joy; v.checked = M.vib; sv.value = M.saver;
    j.onchange = () => { M.joy = j.checked; save(); document.body.classList.toggle('nojoy', !M.joy); };
    v.onchange = () => { M.vib = v.checked; save(); };
    sv.onchange = () => { M.saver = sv.value; save(); if(M.saver === 'on'){ cloudsOff(); toast('Đã bật Tiết kiệm pin. Tải lại trang để giảm độ nét màn hình.'); } };
  }
}
