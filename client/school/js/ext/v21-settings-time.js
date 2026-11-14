// ================= EXT26 (v21): Settings (sound, key bindings, display) + real-time clock, hourly random weather, daily seasons =================
const SET_KEY = 'truong-settings-v1';
const SET_DEF = {realtime:true, weatherHourly:true, seasonDaily:true, tracker:true, minimap:true,
  keys:{up2:'KeyW', down2:'KeyS', left2:'KeyA', right2:'KeyD', interact:'KeyE', map:'KeyM', zin:'Equal', zout:'Minus', fly:'KeyG', bike:'KeyC', settings:'KeyO'}};
const KEY_NAMES = {up2:'Đi lên (phụ)', down2:'Đi xuống (phụ)', left2:'Sang trái (phụ)', right2:'Sang phải (phụ)', interact:'Vào cửa / tương tác', map:'Mở bản đồ lớn', zin:'Phóng to', zout:'Thu nhỏ', fly:'Bay lên trời / hạ cánh', bike:'Đạp xe', settings:'Mở cài đặt'};
let SETTINGS = JSON.parse(JSON.stringify(SET_DEF));
const REALT = {on:true, hour:-1, dayKey:''};
const keyLabel = c => ({Equal:'=', Minus:'−', Space:'Space', ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→', Comma:',', Period:'.', Slash:'/', Semicolon:';', BracketLeft:'[', BracketRight:']', Backquote:'`', Quote:"'", Backslash:'\\', Enter:'Enter', Tab:'Tab'}[c] || String(c || '').replace('Key', '').replace('Digit', '').replace('Numpad', 'Num '));
function setLoad(){ try { const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null'); if(s){ SETTINGS = Object.assign(JSON.parse(JSON.stringify(SET_DEF)), s); SETTINGS.keys = Object.assign({}, SET_DEF.keys, s.keys || {}); } } catch(e){} }
function setSave(){ try { localStorage.setItem(SET_KEY, JSON.stringify(SETTINGS)); } catch(e){} }
function applyKeymap(){ Object.keys(KEYMAP).forEach(k => { if(!k.startsWith('Arrow')) delete KEYMAP[k]; }); const K = SETTINGS.keys; [['up2', 'up'], ['down2', 'down'], ['left2', 'left'], ['right2', 'right']].forEach(([a, d]) => { if(K[a]) KEYMAP[K[a]] = d; }); }
function applyDisplay(){ stage.classList.toggle('nomini', !SETTINGS.minimap); stage.classList.toggle('notrack', !SETTINGS.tracker); }
// ---------- real time ----------
const realMin = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes() + d.getSeconds()/60; };
const realDow = () => (new Date().getDay() + 6) % 7; // 0 = Thứ 2
const SEASON_ORDER = ['xuan', 'ha', 'thu', 'dong'];
function realSeason(){ const d = new Date(), idx = Math.floor((d.getTime() - d.getTimezoneOffset()*60000)/86400000); return SEASON_ORDER[((idx % 4) + 4) % 4]; }
function rtSync(){
  if(!REALT.on) return; let diff = realDow() - dow(); while(diff < 0) diff += 7; day += diff; if(day < 1) day += 7;
  if(SETTINGS.seasonDaily){ const s = realSeason(); if(s !== season) setSeason(s, true); }
  REALT.dayKey = new Date().toDateString();
}
function rtWeather(){
  if(!REALT.on || !SETTINGS.weatherHourly) return; const h = new Date().getHours(); if(h === REALT.hour) return; REALT.hour = h;
  const wts = Object.assign({}, W_WEIGHTS[season]); ['songthan', 'dongdat', 'sieubao'].forEach(k => delete wts[k]); const tot = Object.values(wts).reduce((a, b) => a + b, 0);
  let r = Math.random()*tot, choice = 'nang'; for(const k in wts){ r -= wts[k]; if(r <= 0){ choice = k; break; } }
  setWeather(choice, false); weatherUntil = 1e9;
}
function rtStep(dtR, ff){
  if(!REALT.on) return dtR*RATE*speed*(ff ? 8 : 1);
  const tgt = realMin(); if(dow() !== realDow() && REALT.dayKey === new Date().toDateString()) rtSync();
  if(clock - tgt > 60 || REALT.dayKey !== new Date().toDateString()){ // midnight passed in real life: start the next school day
    agents.forEach(a => { if(a.isPlayer) return; if(a.id !== 'nam') hide(a); a.controlled = false; }); fade = 1; newDay(false); lastBrainMin = -1; clock = tgt; REALT.hour = -1; rtSync(); rtWeather(); return 0; }
  rtWeather(); const d = tgt - clock; if(d > 90){ clock = tgt; lastBrainMin = -1; return 0; } return Math.max(0, d);
}
function setRealtime(on){ REALT.on = on; SETTINGS.realtime = on; setSave(); if(on){ clock = realMin(); lastBrainMin = -1; REALT.hour = -1; rtSync(); rtWeather(); toast('Giờ trong game giờ chạy đúng theo đồng hồ thật của bạn.'); } else { weatherUntil = clock + 60; toast('Đã chuyển về giờ game (tua nhanh, chỉnh tốc độ ở bảng Mô phỏng).'); } updatePanel(); }
// ---------- settings window ----------
let SET_WAIT = null;
function openSettings(){ showModal('mSet'); renderSettings(); }
function renderSettings(){
  const S0 = SETTINGS, chk = (id, v) => { const e = $('#' + id); if(e) e.checked = !!v; };
  chk('stReal', REALT.on); chk('stWeather', S0.weatherHourly); chk('stSeason', S0.seasonDaily); chk('stMini', S0.minimap); chk('stTrack', S0.tracker); chk('stAmb', AMB.on); chk('stMentor', $('#mentorOn') ? $('#mentorOn').checked : true);
  $('#stVol').value = vol; $('#stVolN').textContent = Math.round(vol*100) + '%';
  $('#stNow').textContent = `Bây giờ: ${['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'][dow()]} · ${String(Math.floor(clock/60) % 24).padStart(2, '0')}:${String(Math.floor(clock % 60)).padStart(2, '0')} · mùa ${SEASONS[season].name} · ${WEATHERS[weather].name}`;
  const box = $('#stKeys'); box.innerHTML = '';
  Object.keys(KEY_NAMES).forEach(a => { const row = el('div', {className:'strow'}); row.appendChild(el('span', {}, KEY_NAMES[a])); const b = el('button', {type:'button', className:'kbd'}, SET_WAIT === a ? 'Nhấn phím mới…' : keyLabel(S0.keys[a])); if(SET_WAIT === a) b.classList.add('wait'); b.onclick = () => { SET_WAIT = a; renderSettings(); }; row.appendChild(b); box.appendChild(row); });
  [['Mũi tên', 'Di chuyển (cố định)'], ['Space', 'Dừng / chạy thời gian'], ['F', 'Camera theo dõi'], ['Esc', 'Đóng cửa sổ'], ['Lăn chuột', 'Phóng to / thu nhỏ']].forEach(([k, n]) => { const row = el('div', {className:'strow fixed'}); row.appendChild(el('span', {}, n)); row.appendChild(el('b', {className:'kbd'}, k)); box.appendChild(row); });
}
function setCapture(e){
  if(!SET_WAIT || !openModal || openModal.id !== 'mSet') return; e.preventDefault(); e.stopPropagation();
  if(e.code === 'Escape'){ SET_WAIT = null; renderSettings(); return; }
  if(e.code.startsWith('Arrow') || ['Space', 'KeyF', 'KeyN', 'KeyB'].includes(e.code)){ toast(`Phím ${keyLabel(e.code)} đã dùng cho việc khác, hãy chọn phím khác.`); return; }
  const K = SETTINGS.keys, other = Object.keys(K).find(k => k !== SET_WAIT && K[k] === e.code); if(other) K[other] = K[SET_WAIT];
  K[SET_WAIT] = e.code; SET_WAIT = null; setSave(); applyKeymap(); renderSettings(); blipSfx(1100);
}
function v21Key(e){
  const tg = e.target && e.target.tagName; if(openModal || tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return; const K = SETTINGS.keys, c = e.code;
  if(c === K.map){ openBigMap(); e.preventDefault(); }
  else if(c === K.settings){ openSettings(); e.preventDefault(); }
  else if(c === K.fly){ flyToggle(); e.preventDefault(); }
  else if(c === K.bike){ try { toggleBike(); } catch(err){} e.preventDefault(); }
  else if(c === K.interact && c !== 'KeyE'){ if(doorEnter()) e.preventDefault(); }
  else if(c === K.zin && c !== 'Equal'){ zoomAt(1.2, cw/2, ch/2); e.preventDefault(); }
  else if(c === K.zout && c !== 'Minus'){ zoomAt(.83, cw/2, ch/2); e.preventDefault(); }
}
function v21Init(){
  setLoad(); REALT.on = SETTINGS.realtime; applyKeymap(); applyDisplay();
  window.addEventListener('keydown', setCapture, true); document.addEventListener('keydown', v21Key);
  const B = (id, f) => { const e = $('#' + id); if(e) e.onclick = f; };
  B('hSet', openSettings);
  $('#stReal').onchange = e => setRealtime(e.target.checked);
  $('#stWeather').onchange = e => { SETTINGS.weatherHourly = e.target.checked; setSave(); REALT.hour = -1; if(!e.target.checked) weatherUntil = clock + 60; else rtWeather(); renderSettings(); };
  $('#stSeason').onchange = e => { SETTINGS.seasonDaily = e.target.checked; setSave(); if(e.target.checked) rtSync(); renderSettings(); };
  $('#stMini').onchange = e => { SETTINGS.minimap = e.target.checked; setSave(); applyDisplay(); };
  $('#stTrack').onchange = e => { SETTINGS.tracker = e.target.checked; setSave(); applyDisplay(); };
  $('#stAmb').onchange = e => { try { ambToggle(e.target.checked); } catch(err){} };
  $('#stMentor').onchange = e => { const m = $('#mentorOn'); if(m){ m.checked = e.target.checked; m.dispatchEvent(new Event('change')); } };
  $('#stVol').oninput = e => { vol = +e.target.value; const v = $('#vol'); if(v) v.value = vol; try { applyVolume(); } catch(err){} $('#stVolN').textContent = Math.round(vol*100) + '%'; };
  $('#stReset').onclick = () => { SETTINGS.keys = Object.assign({}, SET_DEF.keys); setSave(); applyKeymap(); renderSettings(); toast('Đã khôi phục phím tắt mặc định.'); };
  if(REALT.on){ clock = realMin(); lastBrainMin = -1; rtSync(); rtWeather(); }
}

