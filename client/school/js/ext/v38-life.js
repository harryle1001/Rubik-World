// ================= EXT43 (v38): elegant gold line icons for the phone HUD, weather/season/time/date tidy inside the profile card,
// daily missions (10 on screen, swipe for all 66, today's picks pay a bonus), live diary + today's random events under it (tap = guide there),
// people, pets, treasure chests and pick-ups inside houses (tap to walk anywhere), full-screen mini games with swipe controls =================

// ---------- icons: 24×24 line drawings ----------
const V38_P = {
  menu:'<path d="M4 7h16M4 12h16M4 17h11"/>',
  balloon:'<path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 3.6 3.1 6.1 6.2 7.2 3.1-1.1 6.2-3.6 6.2-7.2A6.2 6.2 0 0 0 12 2.8z"/><path d="M12 2.8c-1.9 2-2.5 4.4-2.5 6.4s1 4.8 2.5 7M12 2.8c1.9 2 2.5 4.4 2.5 6.4s-1 4.8-2.5 7"/><path d="M9.8 16.4l.9 2.9M14.2 16.4l-.9 2.9"/><rect x="10.3" y="19.3" width="3.4" height="2.4" rx=".5"/>',
  chute:'<path d="M3 10a9 7 0 0 1 18 0"/><path d="M3 10c1.5-1.2 3-1.2 4.5 0 1.5-1.2 3-1.2 4.5 0 1.5-1.2 3-1.2 4.5 0 1.5-1.2 3-1.2 4.5 0"/><path d="M3 10l8 9M21 10l-8 9M12 10v8"/><rect x="10.6" y="18" width="2.8" height="3.5" rx=".6"/>',
  bike:'<circle cx="5.8" cy="16.2" r="3.6"/><circle cx="18.2" cy="16.2" r="3.6"/><path d="M5.8 16.2l3.6-6.6h5.4l3.4 6.6M9.4 9.6l3.2 6.6H5.8M13.2 6.4h2.6l-1 3.2M8.2 7.4h3"/>',
  scroll:'<path d="M7 3.5h11a2 2 0 0 1 2 2V7h-3"/><path d="M17 7v11.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V17h11"/><path d="M7 3.5a2 2 0 0 0-2 2V17"/><path d="M8.5 8.5h5.5M8.5 11.5h5.5M8.5 14.5h3.5"/>',
  book:'<path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v14.5H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 20A2 2 0 0 0 7 21.5h12.5V17.5"/><path d="M8.5 7h7M8.5 10.3h5"/>',
  clock:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
  star:'<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/>',
  pin:'<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  // weather
  nang:'<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.2M12 19.2v2.2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.6 12h2.2M19.2 12h2.2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',
  nangnong:'<path d="M13.6 14.6V5.2a1.6 1.6 0 0 0-3.2 0v9.4a3.4 3.4 0 1 0 3.2 0z"/><path d="M12 9v7"/><path d="M17.5 5.5l1.5-1M18.5 9h2M17.5 12.5l1.5 1"/>',
  mua:'<path d="M7 13.6h10a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 13.6z"/><path d="M8.6 16.5l-1.2 3.4M12.6 16.5l-1.2 3.4M16.6 16.5l-1.2 3.4"/>',
  muaphun:'<path d="M7 13.6h10a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 13.6z"/><path d="M8.5 17v.8M12 18.5v.8M15.5 17v.8M10.2 20.5v.4M13.8 20.5v.4"/>',
  gio:'<path d="M3 8.5h10.5a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.6 2.6 0 1 1-2.6 2.6M3 16.5h7"/>',
  bao:'<circle cx="12" cy="12" r="2.2"/><path d="M12 3.5c-4.8 0-8.2 3.4-8.2 8.2 0 1.8.8 3.5 2.4 4.6M12 20.5c4.8 0 8.2-3.4 8.2-8.2 0-1.8-.8-3.5-2.4-4.6"/>',
  sieubao:'<path d="M7 12.6h10a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 12.6z"/><path d="M12.6 13.6l-2.4 3.6h3l-2 4M7.4 15.6l-1 2.6M17.4 15.6l-1 2.6"/>',
  loc:'<path d="M3.5 5h17M5.5 9h13M7.5 13h9M9.5 17h5M11 21h2"/>',
  samset:'<path d="M7 12.6h10a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 12.6z"/><path d="M13 13.6l-3 4.4h3.2l-2 3.6"/>',
  muada:'<path d="M7 12.6h10a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 12.6z"/><circle cx="8.5" cy="17" r="1.1"/><circle cx="12.5" cy="19.5" r="1.1"/><circle cx="16" cy="16.6" r="1.1"/>',
  suongmu:'<path d="M4 8.5h16M2.8 12.5h18.4M5 16.5h14M8 20.5h8"/>',
  dongdat:'<path d="M2.5 12.5h4l2-5.5 3 11 2.4-8 1.8 4.5h5.8"/>',
  cauvong:'<path d="M2.8 18.5a9.2 9.2 0 0 1 18.4 0M6.3 18.5a5.7 5.7 0 0 1 11.4 0M9.8 18.5a2.2 2.2 0 0 1 4.4 0"/>',
  tuyet:'<path d="M12 2.8v18.4M4 7.4l16 9.2M4 16.6l16-9.2M9.6 4.4L12 6l2.4-1.6M9.6 19.6L12 18l2.4 1.6"/>',
  baotuyet:'<path d="M7 12.6h10a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 12.6z"/><path d="M8 16.2l1.6 1.6M9.6 16.2L8 17.8M12 18.6l1.6 1.6M13.6 18.6L12 20.2M16 16.2l1.6 1.6M17.6 16.2L16 17.8"/>',
  songthan:'<path d="M2.5 16.5c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2M3 11.5c1.6-4.2 6.2-6.6 10.4-5.2-2.6 1-3.6 3.2-3 5.2 1.2-1.4 3-1.4 4 0M2.5 20.5h19"/>',
  nhatthuc:'<circle cx="12" cy="12" r="7.6"/><path d="M15.2 5.2a7.6 7.6 0 0 1 0 13.6 6.4 6.4 0 0 0 0-13.6z" fill="currentColor"/>',
  saobang:'<path d="M3.5 3.5l9 9M8 3l6.5 6.5M3 8l6.5 6.5"/><circle cx="16.6" cy="16.6" r="3.6"/>',
  // seasons
  xuan:'<circle cx="12" cy="12" r="2"/><circle cx="12" cy="6.6" r="3"/><circle cx="17.1" cy="10.3" r="3"/><circle cx="15.2" cy="16.4" r="3"/><circle cx="8.8" cy="16.4" r="3"/><circle cx="6.9" cy="10.3" r="3"/>',
  ha:'<path d="M12 21V11.5M12 11.5c-2.2-3-6.2-3-8.2-1 3 0 5.2.5 8.2 1zM12 11.5c2.2-3 6.2-3 8.2-1-3 0-5.2.5-8.2 1zM12 11.5c-1-3-.4-6.2 2.2-7.4-1 2.2-1.6 4.2-2.2 7.4zM6 21h12"/>',
  thu:'<path d="M5 19.5C5 11 11 4.5 20 4.5c0 9-6 15-14.6 15M5 19.5l9.4-9.4M9.5 15h3.6M12.2 12.2V8.8"/>',
  dong:'<circle cx="12" cy="16.4" r="4.4"/><circle cx="12" cy="8.2" r="3.1"/><path d="M9.6 4h4.8M10.4 2.6h3.2v1.4M7.6 14.4l-3-1.6M16.4 14.4l3-1.6"/>',
  // events
  music:'<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>',
  lantern:'<path d="M12 2.5v2M9 4.5h6M7.5 7a4.5 6.5 0 0 0 9 0z"/><path d="M7.5 7h9M8 14a4.5 4.6 0 0 1-.5-7M16 14a4.5 4.6 0 0 0 .5-7M8 14h8l-1 3.2h-6zM12 17.2v4"/>',
  basket:'<path d="M3.5 10h17l-2 10h-13z"/><path d="M8 10l3-6M16 10l-3-6M8.5 14v3M12 14v3M15.5 14v3"/>',
  truck:'<path d="M2.5 6.5h11v10h-11zM13.5 10h4.2l3 3.4v3.1h-7.2"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  sub:'<path d="M3 14.5c0-2.6 3.6-4.6 8.5-4.6s9 2 9 4.6-4 4.6-9 4.6S3 17.1 3 14.5z"/><path d="M10 9.9V6.5h3.6v3.4M13.6 6.5h2M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01"/>',
  ship:'<path d="M3 15.5h18l-2.6 4.5H5.6z"/><path d="M12 15.5V3.5M12 4.5l6.5 8H12M12 6.5L7 12.5h5"/>',
  spark:'<path d="M12 2.8l1.9 6.3 6.3 1.9-6.3 1.9-1.9 6.3-1.9-6.3-6.3-1.9 6.3-1.9z"/>'
};
function v38Ic(name, col, size){ const p = V38_P[name]; if(!p) return ''; return `<svg class="v38i" viewBox="0 0 24 24" width="${size || 18}" height="${size || 18}" fill="none" stroke="${col || 'currentColor'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`; }
const V38_COL = {nang:'#ffd23f', nangnong:'#ff8a65', mua:'#81d4fa', muaphun:'#b3e5fc', gio:'#cfd8dc', bao:'#b39ddb', sieubao:'#9575cd', loc:'#b0bec5', samset:'#ffe082', muada:'#e1f5fe', suongmu:'#cfd8dc', dongdat:'#ffab91', cauvong:'#f48fb1', tuyet:'#e3f2fd', baotuyet:'#bbdefb', songthan:'#4fc3f7', nhatthuc:'#ffcc80', saobang:'#fff59d', xuan:'#f8bbd0', ha:'#a5d6a7', thu:'#ffb74d', dong:'#e3f2fd'};
// ---------- phone HUD buttons and the info line ----------
function v38Btn(id, html){ const b = $('#' + id); if(!b) return; const keep = b.querySelector('i'); if(b._v38 === html) return; b._v38 = html; b.innerHTML = html; if(keep) b.appendChild(keep); }
function v38Hud(){
  v38Btn('v32MenuBtn', v38Ic('menu', '#1a1400', 24)); v38Btn('v32MisBtn', v38Ic('scroll', '#ffd23f', 24)); v38Btn('v32LogBtn', v38Ic('book', '#ffd23f', 24));
  const P = PLAYER; v38Btn('v35Fly', v38Ic(P && P.v16fly ? 'chute' : 'balloon', '#ffd23f', 24)); v38Btn('v35Bike', v38Ic('bike', '#ffd23f', 24));
  const f = $('#v35Fly'), b = $('#v35Bike'); if(f) f.setAttribute('aria-pressed', !!(P && P.v16fly)); if(b) b.setAttribute('aria-pressed', !!(P && P.cycling));
}
v35BtnSync = v38Hud;
v37Info = function(){
  const box = $('#v37Info'); if(!box) return; const wd = DOWN[dow()].replace('Thứ ', 'T').replace('Chủ nhật', 'CN'), dt = v37Date().split('/').slice(0, 2).join('/');
  const key = weather + season + fmt(clock) + wd + dt; if(box._k === key) return; box._k = key;
  box.innerHTML = `<span>${v38Ic(weather, V38_COL[weather], 14)}${WEATHERS[weather].name}</span><span>${v38Ic(season, V38_COL[season], 14)}${SEASONS[season].name}</span><span>${v38Ic('clock', '#ffd23f', 14)}${fmt(clock)}</span><span>${v38Ic('cal', '#ffd23f', 14)}${wd} ${dt}</span>`;
};
// menu season / weather tiles and chips use the same icons
v35Chips = function(){ const c = $('#v32Chips'); if(!c) return; const b = c.querySelectorAll('.v32chip'); if(b[0] && b[0]._k !== season){ b[0]._k = season; b[0].innerHTML = v38Ic(season, V38_COL[season], 16) + ' ' + SEASONS[season].name; } if(b[1] && b[1]._k !== weather){ b[1]._k = weather; b[1].innerHTML = v38Ic(weather, V38_COL[weather], 16) + ' ' + WEATHERS[weather].name; } };

// ---------- daily missions ----------
function v38Rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s*1664525 + 1013904223) >>> 0)/4294967296; }
function v38Today(){ if(V38.mDay === day) return V38.mToday; const r = v38Rng(day*7919 + 17), ids = MISSIONS.map(m => m.id); for(let i=ids.length-1;i>0;i--){ const j = Math.floor(r()*(i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } V38.mDay = day; V38.mOrder = ids; V38.mToday = new Set(ids.filter(id => !mstate[id + '_done']).slice(0, 10)); return V38.mToday; }
const V38 = {mDay:-1, mToday:new Set(), mOrder:[], ev:[], evDay:-1};
trackRender = function(){
  const box = $('#mtrackList'); if(!box) return; const today = v38Today(), byId = Object.fromEntries(MISSIONS.map(m => [m.id, m])), done = MISSIONS.filter(m => mstate[m.id + '_done']).length;
  $('#mtrackN').textContent = `${done}/${MISSIONS.length}`;
  const row = (m, star) => { const ok = mstate[m.id + '_done'], p = m.goal ? Math.min(1, (mstate[m.id] || 0)/m.goal) : 0; return `<li class="${ok ? 'v38ok' : star ? 'v38today' : ''}"><span>${star && !ok ? v38Ic('star', '#ffd23f', 13) + ' ' : ok ? '✓ ' : ''}${m.t.replace(/[<>&]/g, '')}</span>${m.goal && !ok ? `<i><b style="width:${Math.round(p*100)}%"></b></i><small>${Math.floor(mstate[m.id] || 0)}/${m.goal}</small>` : ''}</li>`; };
  const phone = document.body.classList.contains('v32phone'), order = V38.mOrder.map(id => byId[id]).filter(Boolean);
  const first = order.filter(m => today.has(m.id)).slice(0, phone ? 10 : 6), rest = order.filter(m => !today.has(m.id) && !mstate[m.id + '_done']), fin = order.filter(m => !today.has(m.id) && mstate[m.id + '_done']);
  let html = `<li class="v38h">Hôm nay · thưởng thêm $15</li>` + first.map(m => row(m, true)).join('');
  if(phone) html += `<li class="v38h">Các nhiệm vụ khác</li>` + rest.map(m => row(m)).join('') + (fin.length ? `<li class="v38h">Đã hoàn thành</li>` + fin.map(m => row(m)).join('') : '');
  else html += rest.slice(0, Math.max(0, 6 - first.length)).map(m => row(m)).join('');
  if(box._h !== html){ box._h = html; box.innerHTML = html; }
};
function v38Mprog(){ const base = mprog; mprog = function(id){ const was = mstate[id + '_done']; const r = base.apply(this, arguments); if(!was && mstate[id + '_done'] && v38Today().has(id)){ const m = MISSIONS.find(x => x.id === id); setTimeout(() => reward(20, 15, 'Nhiệm vụ hôm nay: ' + (m ? m.t : id)), 600); } return r; }; }

// ---------- today's events (random every day) under the diary ----------
const V38_EVS = [['concert', 'music', 'hall'], ['festBtn', 'lantern', 'plaza'], ['picnicBtn', 'basket', 'forest'], ['subBtn', 'sub', 'sub'], ['pirateBtn', 'ship', 'sea'], ['truckBtn', 'truck', 'road']];
function v38EvToday(){
  if(V38.evDay === day) return V38.ev; const r = v38Rng(day*104729 + 3), pool = V38_EVS.filter(([id]) => $('#' + id)).slice();
  for(let i=pool.length-1;i>0;i--){ const j = Math.floor(r()*(i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const slots = [420, 600, 780, 960, 1140]; V38.ev = pool.slice(0, 4).map(([id, ic, w], i) => ({id, ic, w, n:$('#' + id).textContent.trim(), at:slots[i + (r() < .5 ? 0 : 1) * (i === 3 ? 1 : 0)] + Math.floor(r()*5)*30, fired:false})).sort((a, b) => a.at - b.at); V38.evDay = day; return V38.ev;
}
const v38Min = () => Math.floor(clock) % 1440;
function v38EvState(e){ const m = v38Min(); return m < e.at ? 'soon' : m < e.at + 90 ? 'live' : 'done'; }
function v38EvTick(){
  for(const e of v38EvToday()){ if(!e.fired && v38EvState(e) === 'live'){ e.fired = true; try { $('#' + e.id).click(); } catch(err){} toast(`🎪 Sự kiện đang diễn ra: ${e.n}. Mở Nhật ký để được dẫn đường!`); } }
  v38EvRender();
}
function v38EvRender(){
  const box = $('#v38Ev'); if(!box) return; const evs = v38EvToday(), rows = [];
  if(typeof WEV !== 'undefined' && WEV) rows.push({k:'wev', html:`<b class="live">ĐANG DIỄN RA</b> ${v38Ic('spark', '#ffd23f', 15)} ${WEV.T.n}`});
  evs.forEach((e, i) => { const st = v38EvState(e); rows.push({k:i, html:`${st === 'live' ? '<b class="live">ĐANG DIỄN RA</b>' : st === 'soon' ? `<b>${fmt(e.at)}</b>` : '<b class="end">Đã xong</b>'} ${v38Ic(e.ic, '#ffd23f', 15)} ${e.n}`}); });
  const html = rows.map(r => `<li data-k="${r.k}">${r.html}${v38Ic('pin', '#9fb3ff', 14)}</li>`).join('');
  const ol = box.querySelector('ol'); if(ol._h !== html){ ol._h = html; ol.innerHTML = html; }
}
function v38EvGo(k){
  let x, y, n; if(k === 'wev'){ if(!WEV) return; x = WEV.x; y = WEV.y; n = WEV.T.n; } else { const e = v38EvToday()[+k]; if(!e) return; const p = v32EventPlace(e.w); if(!p){ toast(e.n); return; } [x, y] = p; n = e.n; const st = v38EvState(e); if(st === 'soon') toast(`${e.n} bắt đầu lúc ${fmt(e.at)}. Mình dẫn bạn tới trước nhé!`); }
  try { v32Sheet('l'); } catch(err){} v32Nav(x, y, n, true);
}
function v38EvBox(){
  const lg = $('#mlog'); if(!lg || $('#v38Ev')) return; const d = document.createElement('div'); d.id = 'v38Ev'; d.className = 'v38ev';
  d.innerHTML = '<div class="mthead"><b>Sự kiện hôm nay</b> <span>chạm để được dẫn đường</span></div><ol></ol>'; lg.appendChild(d);
  d.querySelector('ol').addEventListener('click', e => { const li = e.target.closest('li'); if(li) v38EvGo(li.dataset.k); });
}
function v38Sheet(){ const base = v32Sheet; v32Sheet = function(which){ base(which); const l = $('#mlog'); if(which === 'l' && l && l.classList.contains('v32sheet')){ V27.lastTop = ''; v27Diary(); v38EvRender(); const live = v38EvToday().filter(e => v38EvState(e) === 'live').map(e => e.n); if(typeof WEV !== 'undefined' && WEV) live.unshift(WEV.T.n); toast(live.length ? `🎪 Đang diễn ra: ${live.join(', ')}` : 'Hôm nay chưa có sự kiện nào diễn ra. Xem giờ bắt đầu bên dưới nhé!'); } }; }

// ---------- inside houses: a host who chats, pets, chests and pick-ups, tap to walk ----------
const V38_NAMES = ['Bà Hoa', 'Chú Tâm', 'Cô Liên', 'Ông Bảy', 'Chị Thảo', 'Anh Việt', 'Bác Sáu', 'Cô Ngân', 'Chú Lộc', 'Bà Tư'];
const V38_TALK = ['Chào cháu! Vào chơi nhà bác à? Cứ tự nhiên như ở nhà nhé.', 'Dạo này cháu học hành thế nào rồi? Nhớ ăn uống đầy đủ nha.', 'Hôm nay trời {w}, ra ngoài nhớ giữ sức khỏe đó!', 'Cháu có muốn uống trà không? Trà sen thơm lắm.', 'Mấy bé thú cưng nhà bác quậy lắm, cháu chơi với tụi nó đi.', 'Ông bà xưa dạy: "Một điều nhịn, chín điều lành" đó cháu.', 'Ở góc nhà có gì lấp lánh kìa, cháu ra xem thử đi!', 'Hôm nào rảnh ghé lại chơi nữa nghe cháu.', 'Bố mẹ cháu dạo này khỏe không? Gửi lời hỏi thăm giúp bác.', 'Cháu thích món gì? Lần sau bác nấu cho ăn.'];
const V38_PETS = [['mèo', 'Meo meo~', '#ffb74d'], ['chó', 'Gâu gâu!', '#a1887f'], ['thỏ', '*nhảy tưng tưng*', '#eceff1'], ['mèo mướp', 'Meo~ grừ grừ', '#9e9e9e'], ['cún', 'Gâu! Gâu!', '#ffe0b2']];
const V38_ITEMS = [['Đồng xu vàng', 8, '#ffd23f'], ['Viên ngọc xanh', 15, '#4fc3f7'], ['Cuốn sách cũ', 6, '#8d6e63'], ['Vỏ ốc đẹp', 5, '#f8bbd0'], ['Lá thư bí ẩn', 10, '#fff8e1']];
const V38H = {key:'', npc:null, pets:[], loot:[], talk:0, bub:null, tgt:null, act:null};
const v38Hash = s => { let h = 7; for(const c of String(s)) h = (h*31 + c.charCodeAt(0)) >>> 0; return h; };
function v38FreeSpot(r, tries){ for(let i=0;i<(tries || 40);i++){ const x = 80 + r()*800, y = 260 + r()*260; if(!hsBlocked(x, y) && Math.hypot(x - 480, y - 500) > 70) return [x, y]; } return [200 + r()*500, 500]; }
function v38HouseSetup(){
  const h = HS.h; if(!h) return; const key = h.name + '|' + HS.s; V38H.key = key; const hs = v38Hash(key), r = v38Rng(hs);
  const base = STAFF_DEF[hs % STAFF_DEF.length], npc = mkAgent(Object.assign({}, base, {id:'hown', name:V38_NAMES[hs % V38_NAMES.length]}), hs % 7, false);
  const [nx, ny] = v38FreeSpot(r); V38H.npc = Object.assign(npc, {hx:nx, hy:ny, task:'', dir:-1});
  const np = [0, 1, 1, 2, 3, 5][hs % 6]; V38H.pets = []; for(let i=0;i<np;i++){ const [x, y] = v38FreeSpot(r), t = V38_PETS[Math.floor(r()*V38_PETS.length)]; V38H.pets.push({x, y, t, vx:0, vy:0, ph:r()*6, dir:1, bub:0}); }
  const today = new Date().toDateString(), got = (PROF && PROF.v38loot) || {}; V38H.loot = [];
  if(hs % 3 === 0){ const [x, y] = v38FreeSpot(r); V38H.loot.push({k:'chest', x, y, id:key + '#c', got:got[key + '#c'] === today}); }
  const ni = 1 + (hs >> 3) % 2; for(let i=0;i<ni;i++){ const [x, y] = v38FreeSpot(r), it = V38_ITEMS[Math.floor(r()*V38_ITEMS.length)]; V38H.loot.push({k:'item', it, x, y, id:key + '#i' + i, got:got[key + '#i' + i] === today}); }
  V38H.talk = hs % V38_TALK.length; V38H.bub = {who:'npc', t:performance.now() + 4500, text:V38_TALK[V38H.talk].replace('{w}', WEATHERS[weather].name.toLowerCase())}; V38H.tgt = null; V38H.act = null;
}
function v38Near(){ const L = [], n = V38H.npc; if(n) L.push(['npc', n.hx, n.hy, 'Nói chuyện với ' + n.name]); V38H.pets.forEach((p, i) => L.push(['pet' + i, p.x, p.y, 'Vuốt ve bé ' + p.t[0]])); V38H.loot.forEach((o, i) => { if(!o.got) L.push(['loot' + i, o.x, o.y, o.k === 'chest' ? 'Mở rương kho báu' : 'Nhặt ' + o.it[0]]); }); let best = null, bd = 70; L.forEach(t => { const d = Math.hypot(t[1] - HS.x, t[2] - HS.y); if(d < bd){ bd = d; best = t; } }); return best; }
function v38Act(t){
  if(!t) return false; const now = performance.now();
  if(t[0] === 'npc'){ V38H.talk = (V38H.talk + 1) % V38_TALK.length; V38H.bub = {who:'npc', t:now + 4500, text:V38_TALK[V38H.talk].replace('{w}', WEATHERS[weather].name.toLowerCase())}; try { blipSfx(1300); } catch(e){} return true; }
  if(t[0].startsWith('pet')){ const p = V38H.pets[+t[0].slice(3)]; p.bub = now + 2200; V38H.bub = {who:'pet', p, t:now + 2200, text:p.t[1]}; try { blipSfx(1700); } catch(e){} return true; }
  if(t[0].startsWith('loot')){ const o = V38H.loot[+t[0].slice(4)]; if(o.got) return false; o.got = true; if(PROF){ PROF.v38loot = PROF.v38loot || {}; PROF.v38loot[o.id] = new Date().toDateString(); }
    if(o.k === 'chest'){ const m = 20 + Math.floor(Math.random()*5)*10; reward(25, m, 'Mở rương kho báu trong nhà'); toast(`Rương kho báu! Bạn nhận được $${m}.`); } else { reward(5, o.it[1], 'Nhặt được ' + o.it[0]); toast(`Bạn nhặt được ${o.it[0]} (+$${o.it[1]}).`); }
    try { saveProfile(); renderProfHud(); } catch(e){} return true; }
  return false;
}
function v38HouseHooks(){
  const oOpen = openHouse; openHouse = function(h){ oOpen(h); v38HouseSetup(); const n = $('#hsNote'); if(n) n.textContent = HSTYLE[HS.s].note + (MOB.touch ? ' Chạm vào sàn để đi, chạm người, thú cưng hay đồ vật để tương tác.' : ' Đi bằng phím mũi tên/WASD, E để nói chuyện, vuốt ve thú cưng, mở rương.'); };
  const oStep = hsStep; hsStep = function(dt){
    const g = V38H.tgt; if(g){ const dx = g[0] - HS.x, dy = g[1] - HS.y, d = Math.hypot(dx, dy); if(d < 10 || g[2] > 3){ V38H.tgt = null; HS.k = {}; if(V38H.act){ const t = V38H.act; V38H.act = null; if(Math.hypot(t[1] - HS.x, t[2] - HS.y) < 80) v38Act(t); } } else { HS.k = {l:dx < -6, r:dx > 6, u:dy < -6, d:dy > 6}; const px = HS.x, py = HS.y; oStep(dt); if(Math.hypot(HS.x - px, HS.y - py) < .2) g[2] = (g[2] || 0) + dt; else g[2] = 0; } }
    else oStep(dt);
    V38H.near = v38Near(); const t = performance.now()/1000;
    V38H.pets.forEach(p => { p.ph += dt; if(Math.random() < dt*.6){ const a = Math.random()*6.3; p.vx = Math.cos(a)*30; p.vy = Math.sin(a)*18; } if(Math.random() < dt*.5){ p.vx = p.vy = 0; } const nx = p.x + p.vx*dt, ny = p.y + p.vy*dt; if(!hsBlocked(nx, ny)){ p.x = nx; p.y = ny; } else { p.vx = -p.vx; p.vy = -p.vy; } if(p.vx) p.dir = p.vx < 0 ? -1 : 1; });
    if(V38H.npc) V38H.npc.dir = HS.x < V38H.npc.hx ? -1 : 1;
  };
  const oDraw = hsDraw; hsDraw = function(){ oDraw(); const c = $('#hsCv'); if(!c || !V38H.npc) return; const g = c.getContext('2d'), now = performance.now(), t = now/1000;
    withCtx(g, () => { ctx.setTransform(c.width/960, 0, 0, c.height/580, 0, 0);
      V38H.loot.forEach(o => { if(o.got) return; const b = Math.sin(t*3 + o.x)*3; ctx.globalAlpha = .3 + .2*Math.sin(t*4); circ(o.x, o.y - 10, 26, '#fff59d'); ctx.globalAlpha = 1;
        if(o.k === 'chest'){ rect('#5d4037', o.x - 22, o.y - 26, 44, 26); rect('#8d6e4a', o.x - 22, o.y - 34, 44, 10); rect('#ffd23f', o.x - 22, o.y - 26, 44, 3); rect('#ffd23f', o.x - 4, o.y - 22, 8, 9); }
        else { circ(o.x, o.y - 12 + b, 9, o.it[2]); rect('#fff', o.x - 3, o.y - 17 + b, 3, 3); } });
      V38H.pets.forEach(p => { const x = Math.round(p.x), y = Math.round(p.y), col = p.t[2], hop = p.t[0] === 'thỏ' ? Math.abs(Math.sin(p.ph*6))*6 : (p.vx || p.vy ? Math.abs(Math.sin(p.ph*10))*2 : 0); ctx.globalAlpha = .2; rect('#000', x - 14, y - 2, 28, 5); ctx.globalAlpha = 1;
        rect(col, x - 14, y - 16 - hop, 28, 13); rect(col, x + p.dir*10 - 7, y - 26 - hop, 14, 12); rect(shade(col, -.3), x + p.dir*10 - 6, y - 30 - hop, 4, 5); rect(shade(col, -.3), x + p.dir*10 + 2, y - 30 - hop, 4, 5);
        if(p.t[0] === 'thỏ'){ rect(col, x + p.dir*10 - 5, y - 38 - hop, 3, 10); rect(col, x + p.dir*10 + 2, y - 38 - hop, 3, 10); } rect('#212121', x + p.dir*13 - 1, y - 22 - hop, 2, 2); rect(col, x - p.dir*16 - 2, y - 18 - hop - Math.abs(Math.sin(p.ph*8))*4, 4, 8);
        for(const lx of [-10, -3, 4, 10]) rect(shade(col, -.2), x + lx, y - 4 - hop, 3, 4); });
      const n = V38H.npc; ctx.save(); ctx.translate(n.hx, n.hy); ctx.scale(2.2, 2.2); n.x = 0; n.y = 0; n.moving = false; try { drawBody(n, false); } catch(e){ rect(n.shirt || '#c62828', -6, -20, 12, 18); circ(0, -26, 6, '#f2c9a0'); } ctx.restore();
      ctx.font = '16px VT323, monospace'; ctx.textAlign = 'center'; const nw = ctx.measureText(n.name).width + 12; ctx.fillStyle = 'rgba(120,40,10,.9)'; ctx.fillRect(n.hx - nw/2, n.hy - 104, nw, 18); ctx.fillStyle = '#fff'; ctx.fillText(n.name, n.hx, n.hy - 90);
      const B = V38H.bub; if(B && now < B.t){ const bx = B.who === 'pet' ? B.p.x : n.hx, by = B.who === 'pet' ? B.p.y - 48 : n.hy - 118; ctx.font = '18px VT323, monospace'; const words = B.text.split(' '), lines = []; let cur = ''; words.forEach(w => { if(ctx.measureText(cur + ' ' + w).width > 300){ lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
        const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20, h = lines.length*20 + 10, x0 = Math.max(6, Math.min(954 - w, bx - w/2)), y0 = by - h; ctx.fillStyle = '#fffdf5'; ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y0, w, h, 10) : ctx.rect(x0, y0, w, h); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - 6, y0 + h); ctx.lineTo(bx + 6, y0 + h); ctx.lineTo(bx, y0 + h + 8); ctx.fill(); ctx.fillStyle = '#3e2723'; lines.forEach((l, i) => ctx.fillText(l, x0 + w/2, y0 + 22 + i*20)); }
      ctx.textAlign = 'left'; });
    const nr = $('#hsNear'); if(nr && V38H.near) nr.textContent = (MOB.touch ? 'Chạm: ' : 'E: ') + V38H.near[3];
  };
  const oKey = houseKey; houseKey = function(e, isDown){ if(isDown && e.code === 'KeyE' && V38H.near && v38Act(V38H.near)) { e.preventDefault(); return true; } if(isDown && /Arrow|Key[WASD]/.test(e.code)){ V38H.tgt = null; V38H.act = null; } return oKey(e, isDown); };
  const cv = $('#hsCv'); if(cv) cv.addEventListener('pointerdown', e => { const b = cv.getBoundingClientRect(), x = (e.clientX - b.left)*960/b.width, y = (e.clientY - b.top)*580/b.height;
    const L = [['npc', V38H.npc && V38H.npc.hx, V38H.npc && V38H.npc.hy]].concat(V38H.pets.map((p, i) => ['pet' + i, p.x, p.y]), V38H.loot.map((o, i) => o.got ? null : ['loot' + i, o.x, o.y]).filter(Boolean));
    let hit = null, bd = 60; L.forEach(t => { if(t[1] == null) return; const d = Math.hypot(t[1] - x, t[2] - 20 - y); if(d < bd){ bd = d; hit = t; } });
    if(hit){ if(Math.hypot(hit[1] - HS.x, hit[2] - HS.y) < 75) v38Act(hit); else { V38H.act = hit; V38H.tgt = [hit[1] + (HS.x < hit[1] ? -40 : 40), Math.max(240, Math.min(536, hit[2] + 6)), 0]; } }
    else V38H.tgt = [Math.max(44, Math.min(916, x)), Math.max(234, Math.min(536, y)), 0];
    if(y > 545 && x > 430 && x < 530) hideModal(); });
}

// ---------- mini games: edge to edge on phones, swipe controls, a short touch guide ----------
function v38Swipe(){
  const cv = $('#arcCv'); if(!cv) return; let st = null; const DIR = ['Left', 'Right', 'Up', 'Down'];
  const plain = () => ARC.g && String(ARC.g.pointer).replace(/\s/g, '') === 'pointer(s,type,x,y){}';
  cv.addEventListener('pointerdown', e => { if(!MOB.touch || !plain()) return; st = {x:e.clientX, y:e.clientY, t:performance.now(), moved:false}; });
  cv.addEventListener('pointermove', e => { if(!st) return; const dx = e.clientX - st.x, dy = e.clientY - st.y; if(Math.hypot(dx, dy) < 16) return; st.moved = true; DIR.forEach(k => ARC.code[k] = false);
    if(Math.abs(dx) > Math.abs(dy)*.6) ARC.code[dx < 0 ? 'Left' : 'Right'] = true; if(Math.abs(dy) > Math.abs(dx)*.6) ARC.code[dy < 0 ? 'Up' : 'Down'] = true; });
  const end = () => { if(!st) return; if(!st.moved && performance.now() - st.t < 260){ ARC.code.Act = true; setTimeout(() => { ARC.code.Act = false; }, 120); } DIR.forEach(k => ARC.code[k] = false); st = null; };
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, end));
}
function v38Guide(id){
  if(!document.body.classList.contains('v32phone')) return; const m = $('#' + id); if(!m) return; let g = m.querySelector('.v38guide'); if(!g){ g = document.createElement('div'); g.className = 'v38guide'; m.appendChild(g); }
  const swipe = id === 'mArcade' ? 'Vuốt để di chuyển · chạm để nhảy/sút · giữ để lấy lực · 2 ngón = chiêu B' : id === 'mHouse' ? 'Chạm sàn để đi · chạm người, thú cưng, rương để tương tác' : 'Chạm và vuốt trực tiếp trên màn chơi';
  g.innerHTML = `<div class="hand">👆</div><p>${swipe}</p>`; g.classList.remove('show'); void g.offsetWidth; g.classList.add('show'); clearTimeout(g._t); g._t = setTimeout(() => g.classList.remove('show'), 3600);
}
function v38Modal(){ const base = showModal; showModal = function(id){ const r = base.apply(this, arguments); if(document.body.classList.contains('v32phone') && /^(mArcade|mHouse|mChess|mRubik|mFish|mFishDeep|mCaro|mGo|mPaint|mLab|mOly|mMusic|mFarm|mZen|mSudoku|mMemory|mMath|mOAQ|mMissile|mObs|mGarden|mScope)$/.test(id)){ document.body.classList.add('v38full'); setTimeout(() => v38Guide(id), 450); } return r; };
  const hb = hideModal; hideModal = function(){ const r = hb.apply(this, arguments); setTimeout(() => { if(!document.querySelector('.modal:not([hidden])')) document.body.classList.remove('v38full'); }, 0); return r; }; }

function v38Init(){
  v38Hud(); v37Info(); v38Mprog(); v38EvBox(); v38Sheet(); v38HouseHooks(); v38Modal();
  [$('#mtrack'), $('#mlog')].forEach(e => e && e.classList.add('v38sheet'));
  try { trackRender(); } catch(e){}
  setInterval(() => { v38Hud(); try { v38EvTick(); } catch(e){} const l = $('#mlog'); if(l && l.classList.contains('v32sheet')){ try { v27Diary(); } catch(e){} } }, 1000);
}
