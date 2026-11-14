// ================= EXT27 (v22): the simulation console is for the game owner only; games & music move into a Menu for everyone =================
const OWNER = {is:false, show:true};
function consoleApply(){ const app = document.querySelector('.app'); if(!app) return; app.classList.toggle('noconsole', !(OWNER.is && OWNER.show)); const b = $('#hAdmin'); if(b){ b.hidden = !OWNER.is; b.textContent = OWNER.show ? '🛠 Ẩn bảng chủ game' : '🛠 Bảng chủ game'; b.setAttribute('aria-pressed', OWNER.show); } const r = $('#stOwnerRow'); if(r) r.hidden = !OWNER.is; const c = $('#stOwner'); if(c) c.checked = OWNER.show; setTimeout(() => window.dispatchEvent(new Event('resize')), 30); }
function ownerToggle(on){ OWNER.show = on == null ? !OWNER.show : on; try { localStorage.setItem('truong-owner-console', OWNER.show ? '1' : '0'); } catch(e){} consoleApply(); }
function openMenu(){ showModal('mMenu'); }
function v22Init(){
  // move the player-facing sections (games, mini games, music) out of the console into the Menu window
  const body = $('#menuBody'); ['Trò chơi và nhiệm vụ', 'Khu vui chơi và mini game', 'Âm nhạc'].forEach(l => { const sec = document.querySelector(`.console section[aria-label="${l}"]`); if(sec && body) body.appendChild(sec); });
  try { OWNER.show = localStorage.getItem('truong-owner-console') !== '0'; } catch(e){}
  const B = (id, f) => { const e = $('#' + id); if(e) e.onclick = f; }; B('hMenu', openMenu); B('hAdmin', () => ownerToggle());
  const so = $('#stOwner'); if(so) so.onchange = e => ownerToggle(e.target.checked);
  consoleApply();
  try { const cl = window.claude; if(cl && cl.use) cl.use('user').then(u => { OWNER.is = !!(u && u.isOwner && u.isOwner()); consoleApply(); }).catch(() => {}); } catch(e){}
}

