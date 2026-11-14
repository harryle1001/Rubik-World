// ================= EXT42 (v37): phone HUD moves to the very top — compact name/level/money with weather · season · game time · date,
// ☰ 🎈 🚲 in a column on the left (like the right column), toast above the character, mission & diary lists scroll by touch =================
function v37Date(){
  if(typeof REALT !== 'undefined' && REALT.on){ const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
  const d = new Date(2026, 0, 5 + (day - 1)); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function v37Info(){
  const box = $('#v37Info'); if(!box) return;
  const t = `${v35Ic(weather)} ${WEATHERS[weather].name} · ${v35Ic(season)} ${SEASONS[season].name} · 🕒 ${fmt(clock)} · ${DOWN[dow()].replace('Thứ ', 'T').replace('Chủ nhật', 'CN')} ${v37Date()}`;
  if(box.textContent !== t) box.textContent = t;
}
function v37Scroll(el){ if(!el || el._v37) return; el._v37 = 1; ['touchstart', 'touchmove', 'pointerdown', 'pointermove', 'wheel'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation(), {passive:true})); }
function v37Init(){
  const pi = document.querySelector('#prof .pinfo'); if(pi && !$('#v37Info')){ const d = document.createElement('div'); d.id = 'v37Info'; d.className = 'v37info'; pi.appendChild(d); }
  v37Scroll($('#mtrack')); v37Scroll($('#mlog'));
  v37Info(); setInterval(v37Info, 1000);
}
