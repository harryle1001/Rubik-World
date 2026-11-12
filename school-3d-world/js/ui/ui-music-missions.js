// ================= UI =================
const $ = s => document.querySelector(s);
const hudFF = $('#hudFF');
const el = (tag, attrs, html) => { const e = document.createElement(tag); Object.assign(e, attrs||{}); if(html != null) e.innerHTML = html; return e; };
function renderButtons(){
  const sb = $('#seasons'); sb.innerHTML = '';
  for(const k in SEASONS){ const b = el('button', {type:'button'}, SEASONS[k].name); b.setAttribute('aria-pressed', k === season); b.onclick = () => setSeason(k); sb.appendChild(b); }
  const wb = $('#weathers'); wb.innerHTML = '';
  for(const k in WEATHERS){ const b = el('button', {type:'button'}, WEATHERS[k].name); b.setAttribute('aria-pressed', k === weather); b.onclick = () => { autoWeather = false; $('#autoWeather').checked = false; setWeather(k, true); }; wb.appendChild(b); }
  $('#festBtn').textContent = festival ? 'Kết thúc lễ hội' : FEST_NAME[FEST_KIND[season]];
}
const roster = $('#roster');
[['Giáo viên & nhân viên', staff], ['Học sinh nhóm A', students.slice(0,6)], ['Học sinh nhóm B', students.slice(6)]].forEach(([title, list]) => {
  roster.appendChild(el('h3', {}, title));
  list.forEach(a => {
    const b = el('button', {type:'button', className:'who'});
    b.innerHTML = `<span class="n"><span class="dot" style="background:${a.student ? a.bag : a.shirt}"></span>${a.name}${a.saoDo ? '<span class="badge">Sao đỏ</span>' : ''}</span><span class="t"></span>`;
    b.onclick = () => select(a, true);
    a.btn = b; roster.appendChild(b);
  });
});
function select(a, focus){
  if(selected && selected !== a && selected.controlled) setControl(false);
  selected = a; logDirty = true;
  if(focus && a.visible && !followCam){ cam.x = a.inSub ? sub.x : a.x; cam.y = a.inSub ? sub.y : a.y; if(cam.z < .55) cam.z = .9; clampCam(); }
  updatePanel();
}
function setControl(on){
  if(!selected) return;
  if(on && (!selected.visible || selected.inSub)){ log('info', `${selected.name} ${selected.inSub ? 'đang ở trong tàu ngầm' : 'chưa có mặt'} nên chưa điều khiển được.`); return; }
  agents.forEach(a => { if(a.controlled && a !== selected){ extUncontrol(a); a.controlled = false; a.planKey = null; } });
  selected.controlled = on;
  if(on){ selected.path = []; selected.queue = []; selected.cur = null; selected.task = 'Bạn đang điều khiển'; followCam = true; log('info', `Bạn đang điều khiển ${selected.name}. Dùng phím mũi tên hoặc WASD. Coi chừng lốc xoáy, động đất và sét!`); }
  else { extUncontrol(selected); selected.planKey = null; log('info', `${selected.name} tự hành động trở lại.`); }
  $('#dpad').hidden = !on; updateExtButtons();
  $('#hint').textContent = on ? `Đang điều khiển ${selected.name}: phím mũi tên / WASD` : 'Kéo để di chuyển · cuộn để phóng to · bấm vào nhân vật để xem';
  updatePanel();
}
function whereText(a){
  if(!a.visible) return 'Không ở trường';
  if(a.inSub) return 'Trong tàu ngầm dưới biển';
  if(a.boat) return 'Đang lái thuyền trên biển';
  if(a.mount) return 'Đang cưỡi ' + ANI[a.mount].name.toLowerCase() + ' · ' + R[regionAt(a.x,a.y)].name;
  if(a.flying) return 'Đang bị lốc cuốn trên không!';
  return R[regionAt(a.x,a.y)].name + (down(a) ? ' (đang ngã)' : '');
}
function updatePanel(){
  $('#hudClock').innerHTML = `<b>${DOWN[dow()]}</b> · ngày ${day} · <b>${fmt(clock)}</b>${paused ? ' · tạm dừng' : ''}`;
  $('#hudPeriod').textContent = festival ? FEST_NAME[festival.kind] : concert ? `Biểu diễn "${SONG}"` : pname(period(clock));
  $('#hudWeather').textContent = `Mùa ${SEASONS[season].name} · ${WEATHERS[weather].name}`;
  applyVolume();
  const ir = lightLevel() > .3;
  FEEDS.forEach(f => { if(!f.btn) return;
    const n = f.dynamic ? (A.haquan.visible ? agents.filter(a => a.visible && a !== A.haquan && dist(a.x, a.y, f.cx, f.cy) < 170).length : 0) : agents.filter(a => a.visible && regionAt(a.x, a.y) === f.rid).length;
    f.btn.querySelector('.ft').textContent = (ir ? 'IR ' : '') + fmt(clock);
    f.btn.querySelector('.fc').textContent = n + ' người';
    if(f.dynamic) f.btn.querySelector('.fn').textContent = A.haquan.visible ? 'Hà Quân · ' + R[regionAt(A.haquan.x, A.haquan.y)].name : 'Máy quay Hà Quân';
    f.btn.classList.toggle('alert', (f.alertUntil || 0) > realT);
  });
  agents.forEach(a => {
    a.btn.setAttribute('aria-pressed', a === selected);
    a.btn.querySelector('.t').textContent = a.visible ? (a.flying ? 'Bị lốc cuốn bay!' : down(a) ? 'Đang bị ngã' : (a.task || '…')) : (a.student ? (a.mark.sang === 'cn' ? 'Ở nhà (Chủ nhật)' : a.mark.sang === 'phep' || a.mark.sang === 'vang' ? 'Nghỉ học hôm nay' : a.wentHome ? 'Đã về nhà' : 'Ở nhà, chưa đi học') : 'Không ở trường');
  });
  $('#festBtn').textContent = festival && festival.kind !== 'picnic' ? 'Kết thúc lễ hội' : FEST_NAME[FEST_KIND[season]];
  $('#picnicBtn').textContent = festival && festival.kind === 'picnic' ? 'Kết thúc dã ngoại' : 'Dã ngoại vào rừng';
  const a = selected;
  if(!a){ $('#insp').innerHTML = '<dd class="empty">Bấm vào một nhân vật trên bản đồ hoặc trong danh sách.</dd>'; return; }
  $('#inspTitle').textContent = 'Quan sát: ' + a.name;
  const rows = [
    ['Vai trò', a.role],
    ['Đang ở', whereText(a)],
    ['Đang làm', a.visible ? a.task || '…' : '—'],
    ['Suy nghĩ', a.visible ? (a.controlled ? 'Bạn đang điều khiển nhân vật này' : a.thought || '…') : '—']
  ];
  if(a.student){
    rows.push(['Nhóm', a.group === 'A' ? 'A (sáng Rubik, sau lắp ráp điện)' : 'B (sáng lắp ráp điện, sau Rubik)']);
    rows.push(['Đi học', a.bike ? 'Đạp xe' : 'Đi bộ']);
    rows.push(['Điểm danh', `${STATUS[a.mark.sang]}${a.missing ? ` · đi thiếu ${a.missing} lần` : ''}`]);
    rows.push(['Điểm kiểm tra', a.scores.length ? a.scores.slice(-5).join(', ') : 'chưa có']);
    rows.push(['Vi phạm', a.violations ? a.violations + ' lần' : 'không có']);
    rows.push(['Rubik / điện', `kỷ lục ${a.best.toFixed(1)}s · ${a.builds} sản phẩm điện`]);
  }
  $('#insp').innerHTML = rows.map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('#steps').innerHTML = a.hist.length ? a.hist.map(h => `<li>${h}</li>`).join('') : '<li>Chưa có bước nào.</li>';
  $('#follow').setAttribute('aria-pressed', followCam);
  $('#control').setAttribute('aria-pressed', !!a.controlled);
}
function renderLog(){
  const only = $('#onlySel').checked && selected;
  const list = logs.filter(l => !only || l.who === selected.id).slice(0, 180);
  $('#feedlog').innerHTML = list.length ? list.map(l => `<div class="e ${l.type}"><span class="tm">${l.t}</span><span class="tx">${l.text}</span></div>`).join('') : '<div class="empty">Chưa có sự kiện nào.</div>';
}
function renderAtt(){
  const chip = k => `<span class="st ${k}">${{co:'Có mặt',muon:'Đi muộn',vang:'Nghỉ KP',phep:'Nghỉ CP',chua:'Chưa',thieu:'Vắng',cn:'CN'}[k]}</span>`;
  let html = `<div class="tbl"><table><thead><tr><th>${DOWN[dow()]}</th><th>Sáng</th><th>Cuối ngày</th><th>Đi thiếu</th><th>Điểm KT</th><th>Vi phạm</th></tr></thead><tbody>`;
  html += students.map(s => `<tr><td>${s.name}${s.saoDo ? ' ★' : ''}</td><td>${chip(s.mark.sang)}</td><td>${chip(s.mark.cuoi)}</td><td>${s.missing}</td><td>${s.scores.length ? s.scores[s.scores.length-1] : '—'}</td><td>${s.violations}</td></tr>`).join('');
  html += `</tbody></table></div>`;
  html += `<p class="legend" style="margin:6px 0">KP: không phép · CP: có phép · ★: sao đỏ · Đi thiếu: số lần bị phát hiện rời lớp</p>`;
  html += `<h2 style="margin-top:8px">Tổng các ngày trước</h2>`;
  if(!history.length) html += `<div class="empty">Hết ngày đầu tiên sẽ có số liệu tổng hợp. Bấm "Sang ngày tiếp theo" để xem nhanh.</div>`;
  else {
    html += `<div class="tbl"><table><thead><tr><th>Học sinh</th><th>Có mặt</th><th>Muộn</th><th>Nghỉ</th><th>Đi thiếu</th></tr></thead><tbody>`;
    html += students.map(s => `<tr><td>${s.name}</td><td>${s.totals.co}</td><td>${s.totals.muon}</td><td>${s.totals.vang + s.totals.phep}</td><td>${s.totals.thieu}</td></tr>`).join('');
    html += `</tbody></table></div>`;
  }
  $('#paneAtt').innerHTML = html;
}
function renderRep(){
  const p = $('#paneRep');
  if(!reports.length){ p.innerHTML = '<div class="empty">Cô Lai viết báo cáo điểm danh khoảng 9:10 và báo cáo cuối ngày khoảng 16:50 (Thứ 7: khoảng 11:20). Chọn +10 phút hoặc 8× để đến nhanh hơn.</div>'; return; }
  p.innerHTML = '';
  reports.slice(0, 20).forEach(r => {
    const d = el('div', {className:'rep'});
    d.innerHTML = `<h3>${r.title}</h3><span class="legend">Lập lúc ${r.t} bởi Cô Lai</span><pre></pre>`;
    d.querySelector('pre').textContent = r.body;
    const b = el('button', {type:'button'}, 'Sao chép');
    b.onclick = () => { navigator.clipboard.writeText(r.title + '\n' + r.body).then(() => { b.textContent = 'Đã sao chép'; }).catch(() => { const sel = getSelection(), rg = document.createRange(); rg.selectNodeContents(d.querySelector('pre')); sel.removeAllRanges(); sel.addRange(rg); b.textContent = 'Đã chọn chữ, nhấn Ctrl+C'; }); };
    d.appendChild(b); p.appendChild(d);
  });
}
let tab = 'Log';
['Log','Att','Rep'].forEach(t => $('#tab'+t).onclick = () => { tab = t; ['Log','Att','Rep'].forEach(u => { $('#tab'+u).setAttribute('aria-selected', u === t); $('#pane'+u).hidden = u !== t; }); logDirty = attDirty = repDirty = true; });
setInterval(() => {
  updatePanel();
  if(tab === 'Log' && logDirty){ renderLog(); logDirty = false; }
  if(tab === 'Att' && attDirty){ renderAtt(); attDirty = false; }
  if(tab === 'Rep' && repDirty){ renderRep(); repDirty = false; }
}, 300);
$('#onlySel').onchange = () => { logDirty = true; };

function setPaused(p){ paused = p; const b = $('#play'); b.querySelector('path').setAttribute('d', p ? 'M4 2l10 6-10 6z' : 'M3 2h4v12H3zM9 2h4v12H9z'); b.querySelector('span').textContent = p ? 'Chạy' : 'Dừng'; b.dataset.on = p ? '0' : '1'; updatePanel(); }
$('#play').onclick = () => setPaused(!paused);
$('#step1').onclick = () => { setPaused(true); simulate(1); updatePanel(); };
$('#step10').onclick = () => { setPaused(true); simulate(10); updatePanel(); };
$('#speed').onchange = e => { speed = +e.target.value; };
$('#autoWeather').onchange = e => { autoWeather = e.target.checked; weatherUntil = clock + 30; };
$('#autoSeason').onchange = e => { autoSeason = e.target.checked; };
$('#follow').onclick = () => { followCam = !followCam; updatePanel(); };
$('#control').onclick = () => setControl(!(selected && selected.controlled));
$('#zin').onclick = () => zoomAt(1.25, cw/2, ch/2);
$('#zout').onclick = () => zoomAt(.8, cw/2, ch/2);
$('#zfit').onclick = () => { followCam = false; activeFeed = null; FEEDS.forEach(g => g.btn && g.btn.setAttribute('aria-current', false)); cam.z = fitZ(); cam.x = W/2; cam.y = (H + Y0)/2; clampCam(); updatePanel(); };
$('#concert').onclick = () => concert ? endConcert() : startConcert();
$('#festBtn').onclick = () => {
  if(festival){ endFestival(); renderButtons(); return; }
  const p = period(clock);
  if(['dem','nghi','cnbong','cnrung'].includes(p) || !students.some(s => s.visible && s.checked)){ log('info', 'Chưa có học sinh ở trường để tổ chức lễ hội. Chờ giờ học nhé.'); return; }
  startFestival(FEST_KIND[season], clock + 60); renderButtons();
};
$('#truckBtn').onclick = () => sendTruck(festival ? FEST_CARGO[festival.kind] : pick(DAILY_CARGO.concat(Object.values(FEST_CARGO))));
$('#subBtn').onclick = () => startSubTour(students.filter(s => s.visible && !s.inSub && dist(s.x, s.y, PIER_END[0], PIER_END[1]) < 260).slice(0,3), true);
$('#pirateBtn').onclick = () => spawnPirate(true);
$('#fightBtn').onclick = () => { if(fight){ log('info', 'Đang có một vụ xô xát chưa được xử lý.'); return; } startFight(true); };
$('#nextDay').onclick = () => { jumpNextDay(); updatePanel(); };
$('#picnicBtn').onclick = () => {
  if(festival && festival.kind === 'picnic'){ endFestival(); renderButtons(); return; }
  const p = period(clock);
  if(['dem','nghi','cnbong','cnrung'].includes(p) || !students.some(s => s.visible && s.checked)){ log('info', 'Chưa có học sinh ở trường để đi dã ngoại. Chờ giờ học nhé.'); return; }
  startFestival('picnic', clock + 150); if(truck.state === 'off') sendTruck(FEST_CARGO.picnic); renderButtons();
};

let drag = null;
cvs.addEventListener('pointerdown', e => { drag = {x:e.clientX, y:e.clientY, cx:cam.x, cy:cam.y, moved:false}; cvs.setPointerCapture(e.pointerId); });
cvs.addEventListener('pointermove', e => {
  if(!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if(Math.abs(dx) + Math.abs(dy) > 5){ drag.moved = true; followCam = false; cvs.classList.add('dragging'); }
  if(drag.moved){ cam.x = drag.cx - dx/cam.z; cam.y = drag.cy - dy/cam.z; clampCam(); if(immersive) immHold = 8; }
});
cvs.addEventListener('pointerup', e => {
  cvs.classList.remove('dragging');
  if(drag && !drag.moved){
    const r = cvs.getBoundingClientRect(); const [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top);
    let best = null, bd = 30;
    agents.forEach(a => { if(!a.visible) return; const ax = a.inSub ? sub.x : a.x, ay = (a.inSub ? sub.y : a.y) - (a.flying ? a.lift : 0); const d = dist(wx, wy, ax, ay - 16); if(d < bd){ bd = d; best = a; } });
    if(best) select(best, false);
    else { const h = HOTSPOTS.concat(XHOT).find(h => inside(h.r, wx, wy)); if(h && !(typeof V32 !== 'undefined' && V32.phone && PLAYER && PLAYER.visible)) h.f(wx, wy); }
  }
  drag = null;
});
cvs.addEventListener('wheel', e => { e.preventDefault(); const r = cvs.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.12 : .89, e.clientX - r.left, e.clientY - r.top); }, {passive:false});
$('#mini').addEventListener('click', e => openBigMap());

const KEYMAP = {ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right'};
window.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ if(openModal){ hideModal(); return; } if(immersive){ setImmersive(false); return; } }
  if(openModal){ if(extKey(e, openModal.id, true)) return; if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if(openModal.id === 'mRubik') rubikKey(e); if(openModal.id === 'mFish' && e.code === 'Space'){ e.preventDefault(); fishReel(true); } return; }
  const tg = e.target.tagName; if(tg === 'INPUT' || tg === 'SELECT') return;
  if(e.code === 'KeyE' && doorEnter()){ e.preventDefault(); return; }
  if(KEYMAP[e.code] && (agents.some(a => a.controlled) || takeKeys())){ keys[KEYMAP[e.code]] = true; e.preventDefault(); return; }
  if(e.code === 'Space' && tg !== 'BUTTON'){ e.preventDefault(); setPaused(!paused); }
  if(e.code === 'KeyN'){ setPaused(true); simulate(1); updatePanel(); }
  if(e.code === 'KeyF'){ followCam = !followCam; updatePanel(); }
  if(e.key === '+' || e.key === '=') zoomAt(1.2, cw/2, ch/2);
  if(e.key === '-') zoomAt(.83, cw/2, ch/2);
});
window.addEventListener('keyup', e => { if(openModal && extKey(e, openModal.id, false)) return; if(KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; if(e.code === 'Space') fishReel(false); });
document.querySelectorAll('#dpad button').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = true; });
  ['pointerup','pointerleave','pointercancel'].forEach(ev => b.addEventListener(ev, () => { keys[k] = false; }));
});

// ================= MUSIC =================
let AC = null, master = null, schedTimer = null, nextT = 0, stepI = 0, fileAudio = null, fileURL = null, vol = .6;
// An original school melody (C – G – Am – F), two 4-bar phrases in eighth notes
const MEL = [
  64,null,67,null,72,71,69,67,  62,null,67,null,71,null,67,null,  64,null,69,null,72,null,76,74,  72,null,69,null,65,67,69,null,
  67,null,72,null,76,null,74,72,  71,null,67,null,74,null,71,null, 69,72,76,null,74,72,69,null,   67,null,65,null,64,null,null,null
];
const CHORDS = [[48,55,64],[43,50,59],[45,52,60],[41,48,57]];
const EIGHTH = 60/84/2;
const mtof = m => 440*Math.pow(2, (m-69)/12);
function ensureAC(){
  if(!AC){ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = vol*.8; master.connect(AC.destination); }
  if(AC.state === 'suspended') AC.resume();
}
function piano(m, t, dur, v){
  const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), g2 = AC.createGain();
  o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m)*2; g2.gain.value = .3;
  o2.connect(g2); g2.connect(g); o.connect(g); g.connect(master);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t+.012); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
  o.start(t); o2.start(t); o.stop(t+dur+.05); o2.stop(t+dur+.05);
}
function sched(){
  while(nextT < AC.currentTime + .3){
    const i = stepI % MEL.length;
    if(i % 8 === 0){ const c = CHORDS[(i/8) % 4]; c.forEach((m,k) => piano(m, nextT + k*.025, EIGHTH*8, .05)); piano(c[0]-12, nextT, EIGHTH*6, .07); }
    if(MEL[i]) piano(MEL[i], nextT, EIGHTH*2.6, .14);
    nextT += EIGHTH; stepI++;
  }
}
function applyVolume(){
  let f = 1;
  if($('#spatial').checked){ const src = concert ? [1375,150] : [930,180]; f = Math.max(.12, Math.min(1, 1.15 - dist(cam.x, cam.y, src[0], src[1]) / 1300)); }
  if(master) master.gain.value = vol*.8*f;
  if(fileAudio) fileAudio.volume = Math.max(0, Math.min(1, vol*f));
}
function startMusic(){
  if(fileAudio){ applyVolume(); fileAudio.play().catch(() => { $('#nowPlaying').textContent = 'Không phát được file này. Hãy thử một file .mp3 hoặc .m4a khác.'; }); }
  else { ensureAC(); nextT = AC.currentTime + .05; stepI = 0; schedTimer = setInterval(sched, 60); }
  musicOn = true; $('#disc').classList.add('spin'); $('#music').setAttribute('aria-pressed', 'true'); $('#music span').textContent = 'Tắt nhạc';
  log('info', fileAudio ? `Trường đang phát "${SONG}" (file của bạn).` : 'Phòng nhạc phát giai điệu piano của trường.');
  applyVolume();
}
function stopMusic(){
  if(schedTimer){ clearInterval(schedTimer); schedTimer = null; }
  if(fileAudio) fileAudio.pause();
  musicOn = false; $('#disc').classList.remove('spin'); $('#music').setAttribute('aria-pressed', 'false'); $('#music span').textContent = 'Bật nhạc';
}
$('#music').onclick = () => musicOn ? stopMusic() : startMusic();
$('#vol').oninput = e => { vol = +e.target.value; applyVolume(); };
$('#spatial').onchange = () => applyVolume();
// the viewer's own song file is kept only in this browser (IndexedDB) so it plays again next visit
const IDB = {
  open(){ return new Promise((res, rej) => { try { const r = indexedDB.open('truong-agent-rubik', 1); r.onupgradeneeded = () => r.result.createObjectStore('song'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch(e){ rej(e); } }); },
  async put(v){ try { const db = await this.open(); await new Promise((res, rej) => { const tx = db.transaction('song','readwrite'); tx.objectStore('song').put(v, 'song'); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); return true; } catch(e){ return false; } },
  async get(){ try { const db = await this.open(); return await new Promise(res => { const r = db.transaction('song').objectStore('song').get('song'); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); } catch(e){ return null; } },
  async del(){ try { const db = await this.open(); db.transaction('song','readwrite').objectStore('song').delete('song'); } catch(e){} }
};
function setSong(name, blob, restored){
  if(fileURL) URL.revokeObjectURL(fileURL);
  fileURL = URL.createObjectURL(blob); fileAudio = new Audio(fileURL); fileAudio.loop = true;
  $('#songState').textContent = (restored ? 'Đã mở lại file: ' : 'Đã mở file: ') + name;
  $('#nowPlaying').textContent = 'Bài hát phát lặp lại trong trường. Bấm "Biểu diễn ở Hội trường" để các bạn lên sân khấu hát bài này.';
  $('#clearFile').hidden = false;
  applyVolume();
}
$('#file').onchange = async e => {
  const f = e.target.files[0]; if(!f) return;
  stopMusic(); setSong(f.name, f, false);
  log('info', `Phòng nhạc nhận file bài "${SONG}": ${f.name}.`);
  startMusic();
  const saved = await IDB.put({name:f.name, blob:f});
  if(!saved) $('#songState').textContent = 'Đã mở file: ' + f.name + ' (trình duyệt không cho lưu, lần sau cần mở lại)';
};
$('#clearFile').onclick = () => {
  stopMusic(); if(fileURL) URL.revokeObjectURL(fileURL); fileAudio = null; fileURL = null; $('#file').value = '';
  IDB.del();
  $('#clearFile').hidden = true;
  $('#songState').textContent = 'Chưa mở file bài hát';
  $('#nowPlaying').textContent = 'Đã bỏ file. Trường quay lại giai điệu piano riêng.';
};
IDB.get().then(v => { if(v && v.blob) setSong(v.name, v.blob, true); });

// ================= MISSIONS & TOAST =================
const MISSIONS = [
  {id:'fish3', t:'Câu được 3 con cá', goal:3},
  {id:'squid', t:'Câu được một con mực vào ban đêm'},
  {id:'chess', t:'Chơi xong một ván cờ vua (chiếu hết hoặc hòa)'},
  {id:'chessai', t:'Thắng máy một ván cờ'},
  {id:'rubik', t:'Giải xong khối Rubik sau khi xáo trộn'},
  {id:'whale', t:'Tìm thấy cá voi ngoài khơi (đưa camera lại gần)'},
  {id:'dolphin', t:'Ngắm đàn cá heo nhảy lên mặt nước'},
  {id:'pirate', t:'Phát hiện tàu hải tặc'},
  {id:'beach', t:'Tự điều khiển một bạn ra tới bãi biển'},
  {id:'koi', t:'Tự điều khiển một bạn tới hồ cá Koi'},
  {id:'park', t:'Ghé Công viên trí tuệ phía trên trường'},
  {id:'night', t:'Ngắm sinh vật biển phát sáng vào ban đêm'},
  {id:'meteor', t:'Xem mưa sao băng'},
  {id:'imm', t:'Ở trong chế độ đắm chìm 1 phút', goal:60},
  {id:'sky', t:'Ngắm bầu trời và biển mây phía trên công viên'},
  {id:'stars', t:'Ngắm bầu trời đầy sao vào ban đêm'},
  {id:'cloud', t:'Tìm thấy một đám mây hình con vật'},
  {id:'feed', t:'Cho các con vật ở nông trại ăn'},
  {id:'plant', t:'Trồng một cây ăn trái'},
  {id:'harvest', t:'Thu hoạch trái cây chín'},
  {id:'ride', t:'Cưỡi ngựa, trâu, lạc đà hoặc đà điểu'},
  {id:'race', t:'Về nhất trong cuộc đua thú'},
  {id:'boat', t:'Tự lái thuyền ra khơi thật xa'},
  {id:'caro', t:'Thắng một ván cờ caro'},
  {id:'go', t:'Chơi xong một ván cờ vây'},
  {id:'paint', t:'Tự vẽ một bức tranh'},
  {id:'npcart', t:'Xem một bạn NPC sáng tác tranh'},
  {id:'bbq', t:'Nướng và dọn 5 món ở tiệc lửa trại'},
  {id:'balloon', t:'Bay khinh khí cầu xa 2000 m'},
  {id:'football', t:'Thắng một trận bóng đá mini'},
  {id:'basket', t:'Ném được 10 điểm bóng rổ'},
  {id:'skate', t:'Đạt 1500 điểm trượt ván'},
  {id:'patin', t:'Đạt 150 điểm trượt patin'},
  {id:'ski', t:'Về đích trượt tuyết, lỡ tối đa 2 cổng'},
  {id:'piano', t:'Đàn hết một bản nhạc piano với độ chính xác từ 60%'},
  {id:'guitar', t:'Gảy một hợp âm guitar'},
  {id:'shop', t:'Mua món đồ đầu tiên ở cửa hàng'},
  {id:'cycle', t:'Đạp xe đạp của riêng bạn'},
  {id:'library', t:'Ghé Thư viện Tri Thức'},
  {id:'readstart', t:'Mở một cuốn sách để đọc trực tuyến'},
  {id:'book', t:'Hoàn thành một cuốn sách (đúng 10/10 câu)'},
  {id:'zen', t:'Hoàn thành một buổi ngồi thiền'},
  {id:'olympic', t:'Thi xong 5 môn Thế vận hội', goal:5},
  {id:'medal', t:'Giành 3 huy chương Olympic', goal:3},
  {id:'rubiklab', t:'Giải xong Rubik ở Phòng Rubik'},
  {id:'chesslearn', t:'Giải bài chiếu hết ở lớp học cờ'},
  {id:'deepfish', t:'Câu 10 con cá ngoài biển', goal:10},
  {id:'bigfish', t:'Câu được cá quý hoặc huyền thoại'},
  {id:'c4', t:'Thắng một ván Cờ thả 4'},
  {id:'oaq', t:'Thắng máy một ván Ô ăn quan'},
  {id:'sudoku', t:'Giải xong một bảng Sudoku'},
  {id:'math', t:'Trả lời đúng 15 câu Toán nhanh'},
  {id:'memory', t:'Ghép hết 8 cặp thẻ nhớ'},
  {id:'online', t:'Thắng một trận đấu online'},
  {id:'event', t:'Hoàn thành 3 sự kiện mini game trên bản đồ', goal:3},
  {id:'mallbuy', t:'Mua 5 món ở Trung tâm thương mại', goal:5},
  {id:'decor', t:'Bày 10 món đồ trang trí', goal:10},
  {id:'sell', t:'Bày bán món đầu tiên ở cửa hàng của bạn'},
  {id:'givegift', t:'Tặng quà cho một người chơi khác'},
  {id:'trade', t:'Đổi đồ trực tiếp với người chơi khác'},
  {id:'buyp2p', t:'Mua hàng từ cửa hàng của người chơi khác'},
  {id:'school', t:'Đi học và được cô Mic điểm danh'},
  {id:'learn', t:'Ngồi học trên lớp 5 lần', goal:5},
  {id:'readall', t:'Đọc hết trọn một cuốn sách trong game'},
  {id:'comicread', t:'Đọc một cuốn truyện tranh'},
  {id:'rubikcoach', t:'Luyện đúng 3 công thức Rubik cùng thầy', goal:3}
];
let mstate = {};
try { mstate = JSON.parse(localStorage.getItem('truong-missions-v1') || '{}') || {}; } catch(e){ mstate = {}; }
function mprog(id, n){
  try { activity(id, 10); } catch(e){}
  const m = MISSIONS.find(x => x.id === id); if(!m || mstate[id + '_done']) return;
  mstate[id] = (mstate[id] || 0) + (n == null ? 1 : n);
  if(mstate[id] >= (m.goal || 1)){ mstate[id + '_done'] = true; toast('Hoàn thành nhiệm vụ: ' + m.t + ' · +$10'); try { reward(50, 10, 'Nhiệm vụ: ' + m.t); } catch(e){} log('event', 'Bạn hoàn thành nhiệm vụ: ' + m.t + '.'); }
  try { localStorage.setItem('truong-missions-v1', JSON.stringify(mstate)); } catch(e){}
  renderMissions();
}
function renderMissions(){
  const done = MISSIONS.filter(m => mstate[m.id + '_done']).length; $('#starCount').textContent = done + '/' + MISSIONS.length;
  const ul = $('#mlist'); ul.innerHTML = '';
  MISSIONS.forEach(m => { const d = !!mstate[m.id + '_done']; const li = el('li', {className: d ? 'done' : ''}); li.innerHTML = '<span class="ck" aria-hidden="true"></span><span><span class="mt"></span><br><span class="legend"></span></span>'; li.querySelector('.ck').textContent = d ? '✓' : ''; li.querySelector('.mt').textContent = m.t; li.querySelector('.legend').textContent = d ? 'Đã xong' : m.goal ? `Tiến độ: ${Math.floor(mstate[m.id] || 0)}/${m.goal}` : 'Chưa xong'; ul.appendChild(li); });
}
let toastT = null;
function toast(text){ const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3500); }
setInterval(() => {
  if(paused) return;
  const near = (x, y, r) => dist(cam.x, cam.y, x, y) < r && cam.z > .35;
  if(WHALES.some(w => near(w.x, w.y, 420))) mprog('whale');
  if(near(POD.x, 1030, 420)) mprog('dolphin');
  if(ships.some(s => (s.k === 'pirate' || s.k === 'pirate2') && near(s.x, s.y, 420))) mprog('pirate');
  const c = agents.find(a => a.controlled);
  if(c && c.y > 800) mprog('beach');
  if(c && regionAt(c.x, c.y) === 'lake') mprog('koi');
  if(cam.y < -80) mprog('park');
  if(isNight() && cam.y + ch/cam.z/2 > 950) mprog('night');
  if(weather === 'saobang') mprog('meteor');
  if(immersive) mprog('imm', 1);
  if(cam.y < -800) mprog('sky');
  if(cam.y < -800 && SKYST && SKYST.starA > .6) mprog('stars');
  if(cam.y < -700 && cam.z > .35 && SKYCLOUDS.some(c => c.t >= 1 && c.from !== 'cumulus' && Math.abs(c.x - cam.x) < cw/cam.z/2)) mprog('cloud');
}, 1000);

// ================= MODALS =================
let openModal = null, lastFocus = null;
function showModal(id){ if(openModal) hideModal(); const m = $('#' + id); lastFocus = document.activeElement; m.hidden = false; openModal = m; const f = m.querySelector('[data-close]'); if(f) f.focus(); try { mentorFor(id); } catch(e){} }
function hideModal(){ if(!openModal) return; const id = openModal.id; openModal.hidden = true; openModal = null; if(id === 'mFish') fishClose(); if(id === 'mRubik') rubikPause(); extClose(id); if(lastFocus && lastFocus.focus) lastFocus.focus(); }
document.querySelectorAll('[data-close]').forEach(b => b.onclick = hideModal);
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if(e.target === m) hideModal(); }));
const HOTSPOTS = [
  {r:{x:GBOARD.x - 26, y:GBOARD.y - 60, w:GBOARD.s*8 + 52, h:GBOARD.s*8 + 90}, f:() => openChess()},
  {r:{x:420, y:60, w:290, h:240}, f:(x, y) => chessRoomClick(x, y)},
  {r:{x:RMON.x - 100, y:RMON.y - 120, w:200, h:250}, f:() => openRubik()},
  {r:{x:180, y:570, w:80, h:80}, f:() => openRubik()},
  {r:{x:POND.cx - POND.rx, y:POND.cy - POND.ry - 40, w:POND.rx*2, h:POND.ry*2 + 80}, f:() => openFishing('pond')},
  {r:{x:1290, y:810, w:60, h:170}, f:() => openFishing('sea')}
];
$('#openChess').onclick = () => openChess();
$('#openRubik').onclick = () => openRubik();
$('#openFish').onclick = () => openFishing(FS.spot);
$('#openMissions').onclick = () => { renderMissions(); showModal('mMissions'); };

// ================= AMBIENT SEA SOUND & IMMERSIVE =================
let ambNode = null;
function ambient(on){
  if(on && !ambNode){
    ensureAC(); const len = AC.sampleRate*2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); let last = 0;
    for(let i=0;i<len;i++){ last = (last + .02*(Math.random()*2 - 1))/1.02; d[i] = last*3.5; }
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const g = AC.createGain(); g.gain.value = .22; const lfo = AC.createOscillator(); lfo.frequency.value = .12; const lg = AC.createGain(); lg.gain.value = .16;
    lfo.connect(lg); lg.connect(g.gain); src.connect(lp); lp.connect(g); g.connect(AC.destination); src.start(); lfo.start(); ambNode = {src, lfo};
  } else if(!on && ambNode){ try { ambNode.src.stop(); ambNode.lfo.stop(); } catch(e){} ambNode = null; }
}
let immersive = false, immTourI = 0, immNext = 0, immHold = 0, immTarget = null;
const TOUR = [
  ['Sân trường', 820, 420, .9], ['Lướt sóng, lướt ván diều và dù bay', 2300, 990, .8], ['Đàn cá heo', () => [POD.x, 1030], .9], ['Cá voi ngoài khơi', () => [WHALES[0].x, WHALES[0].y], .7],
  ['Hồ cá Koi giữa rừng thông', 3930, 330, .8], ['Phố nhà Đà Lạt và siêu xe', 3400, 640, .9], ['Công viên trí tuệ', 760, -300, .7], ['Thư viện Tri Thức', 5800, 360, .8], ['Sân vận động Olympic', 7430, 360, .7], ['Trường đua Rubik Kart', 9720, 360, .6], ['Vực thẳm đại dương', 3000, 5600, .6], ['Biển băng', 7600, 7300, .6], ['Nông trại và cưỡi thú', 4720, -300, .8], ['Khu thể thao: trượt ván, patin, bóng rổ', 2980, -220, .85], ['Sân trượt tuyết', 3570, -300, .8], ['Góc họa sĩ', 4150, -260, 1.1], ['Rạn san hô', 2600, 1620, .9], ['Ngọn hải đăng', 2470, 820, .9], ['Thác nước trên đồi thông', 3920, -320, .8], ['Bầu trời, mây đổi hình và biển mây', 2600, -1000, .5], ['Mặt trời, mặt trăng và sao', () => [SKYST && SKYST.night > .5 ? 200 + clamp(((clock >= 1080 ? clock - 1080 : clock + 360))/720, 0, 1)*(W - 400) : 200 + clamp((clock - 360)/720, 0, 1)*(W - 400), -1050], .55]
];
function setImmersive(on){
  immersive = on; $('.app').classList.toggle('immersive', on); $('#imm').hidden = !on;
  if(on){ followCam = false; immNext = 0; immHold = 0; try { const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if(r && r.catch) r.catch(() => {}); } catch(e){} ambient(true); toast('Chế độ đắm chìm: kéo để tự xem, Esc để thoát'); }
  else { try { if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch(e){} if(!$('#fsound').checked) ambient(false); $('#immersiveBtn').focus(); }
}
function immTick(dtR){
  if(!immersive) return;
  if(immHold > 0){ immHold -= dtR; return; }
  if(realT >= immNext){ immTarget = TOUR[immTourI++ % TOUR.length]; immNext = realT + 12; $('#immCap').textContent = immTarget[0]; }
  if(immTarget){ const t = immTarget, xy = typeof t[1] === 'function' ? t[1]() : [t[1], t[2]], tz = t[t.length - 1], k = Math.min(1, dtR*.6); cam.x += (xy[0] - cam.x)*k; cam.y += (xy[1] - cam.y)*k; cam.z += (Math.max(tz, fitZ()) - cam.z)*k; clampCam(); }
}
$('#immersiveBtn').onclick = () => setImmersive(true);
$('#immExit').onclick = () => setImmersive(false);
$('#skyBtn').onclick = () => { followCam = false; cam.y = -1000; cam.z = Math.max(fitZ(), Math.min(cw/2600, ch/900)); clampCam(); toast('Kéo sang trái, phải để ngắm mây, mặt trời, mặt trăng và biển mây'); updatePanel(); };

