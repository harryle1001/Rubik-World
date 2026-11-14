// ================= EXT32 (v27): cleaner screen — "The Rubik School" title by the clock, diary panel under Missions (with hidden-feature tips),
// season/weather and time controls move into the Menu, attendance/report, character list and inspector are no longer shown =================
const V27_TIPS = [
  'Bấm E khi đứng trước cửa để vào nhà, lớp học, thư viện.', 'Phím M (hoặc bấm bản đồ tròn) mở bản đồ lớn; bấm một điểm để có đường vàng chỉ lối.',
  'Phím 1–4 chuyển nhanh Sáng / Trưa / Chiều / Tối.', 'Đi tới mép phía bắc của đất liền là khinh khí cầu tự cất cánh lên 5 tầng trời.',
  'Đi xuống mép biển là tự lên thuyền; lái ngược vào bờ là tự cập bờ.', 'Đọc sách ở Thư viện rồi làm bài kiểm tra 10 câu để nhận tiền thưởng.',
  'Ban đêm mọi người cầm đèn dầu; đạp xe có đèn pha chiếu theo hướng đi.', 'Ra biển sau 19:00 để ngắm đội tàu câu mực sáng rực.',
  'Bị ngã thì bấm E (hoặc chạm vào nhân vật) để đứng dậy ngay.', 'Mua bộ cờ vua để thách đấu bất kỳ ai đang online.',
  'Khu vườn mở bán ở cạnh nông trại: gieo hạt, tưới nước, thu hoạch.', 'Lên tàu hải quân ở bãi biển để bắn tên lửa vào tàu hải tặc.',
  'Ngắm Kính viễn vọng ở vườn bách thảo để xem đủ 8 hành tinh.', 'Phím + / − hoặc lăn chuột để phóng to, thu nhỏ.',
  'Cài đặt có tốc độ thời gian ×1 / ×10 / ×30 và nút tiết kiệm pin.', 'Chợ người chơi: tự mở cửa hàng, bán đồ cho người khác.'];
const V27 = {tip:0, lastLen:-1, lastTop:'', t:0};
function v27Diary(){
  const box = $('#mlogList'); if(!box || box.hidden) return; const n = Math.min(document.body.classList.contains('v32phone') ? 60 : 6, logs.length), key = logs.length + '|' + (logs[0] ? logs[0].text : '') + '|' + V27.tip;
  if(key === V27.lastTop) return; V27.lastTop = key; box.textContent = '';
  const tip = document.createElement('li'); tip.className = 'tip'; tip.textContent = '💡 ' + V27_TIPS[V27.tip % V27_TIPS.length]; box.appendChild(tip);
  for(let i=0;i<n;i++){ const l = logs[i], li = document.createElement('li'), t = document.createElement('small'); t.textContent = l.t + ' '; li.appendChild(t); li.appendChild(document.createTextNode(String(l.text).replace(/<[^>]*>/g, ''))); box.appendChild(li); }
}
function v27Place(){ const m = $('#mtrack'), d = $('#mlog'); if(!m || !d) return; const cs = getComputedStyle(m), hide = cs.display === 'none';
  d.style.top = (hide ? m.offsetTop : m.offsetTop + m.offsetHeight + 8) + 'px'; d.style.right = cs.right; d.style.width = m.offsetWidth ? m.offsetWidth + 'px' : ''; }
function v27Init(){
  // title next to the date & time, description removed
  const hud = document.querySelector('#stage .hud'); if(hud && !$('#v27Brand')){ const b = document.createElement('span'); b.id = 'v27Brand'; b.className = 'chip'; b.textContent = 'The Rubik School'; hud.insertBefore(b, hud.firstChild); }
  const h1 = document.querySelector('.console header h1'); if(h1){ const last = [...h1.childNodes].pop(); if(last && last.nodeType === 3) last.textContent = 'The Rubik School'; }
  // diary panel under Missions, foldable like Missions
  const st = $('#stage'); if(st && !$('#mlog')){ const d = document.createElement('div'); d.id = 'mlog'; d.className = 'mtrack mlog';
    d.innerHTML = '<div class="mthead" id="mlogHead"><b>Nhật ký</b> <span>gợi ý & sự kiện</span><button type="button" id="mlogFold" aria-label="Thu gọn nhật ký">▾</button></div><ol id="mlogList"></ol>'; st.appendChild(d);
    const fold = h => { $('#mlogList').hidden = h; $('#mlogFold').textContent = h ? '▸' : '▾'; try { localStorage.setItem('truong-mlog-fold', h ? '1' : ''); } catch(e){} V27.lastTop = ''; v27Diary(); };
    $('#mlogFold').onclick = e => { e.stopPropagation(); fold(!$('#mlogList').hidden); }; $('#mlogHead').onclick = () => fold(!$('#mlogList').hidden);
    let f = null; try { f = localStorage.getItem('truong-mlog-fold'); } catch(e){} if(f === '1' || (f === null && MOB.touch && innerWidth < 900)) fold(true); }
  // Menu: Time (former simulation box) and Season/Weather at the top, before the games
  const body = $('#menuBody'), first = body && body.firstChild;
  const sim = document.querySelector('.console section[aria-label="Điều khiển mô phỏng"]'), wx = document.querySelector('.console section[aria-label="Mùa và thời tiết"]');
  if(body && sim){ const h = sim.querySelector('h2'); if(h) h.textContent = 'Thời gian'; sim.querySelectorAll('.legend').forEach(p => p.hidden = true);
    const row = document.createElement('div'); row.className = 'row v27times'; V25_TIMES.forEach(([id, txt, min, label]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.onclick = () => { v25SetTime(min, label); hideModal(); }; row.appendChild(b); });
    const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Tốc độ thời gian'); sel.innerHTML = '<option value="x1">×1 giờ thật</option><option value="x10">×10</option><option value="x30">×30</option><option value="stop">Dừng</option>'; sel.value = V25.mode; sel.onchange = () => { v25Mode(sel.value); const t = $('#stTScale'); if(t) t.value = sel.value; }; row.appendChild(sel);
    sim.appendChild(row); body.insertBefore(sim, first); }
  if(body && wx){ wx.querySelectorAll('.legend').forEach(p => p.hidden = true); body.insertBefore(wx, sim ? sim.nextSibling : first); }
  // no longer shown: character list, inspector, attendance & report (diary moved to the panel)
  ['Nhân vật', 'Quan sát nhân vật', 'Sổ theo dõi'].forEach(l => { const s = document.querySelector(`.console section[aria-label="${l}"]`); if(s) s.hidden = true; });
  ['#tabAtt', '#tabRep', '#paneAtt', '#paneRep'].forEach(q => { const e = $(q); if(e) e.hidden = true; });
  setInterval(() => { v27Place(); v27Diary(); }, 700); setInterval(() => { V27.tip++; }, 40000); v27Place(); v27Diary();
}
