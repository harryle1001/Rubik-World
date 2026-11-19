// teacher.js — Trang /teacher: giáo viên (tạo lớp, mã lớp, giao nhiệm vụ học, xem tiến độ từng em) và phụ huynh
// (đăng nhập bằng tài khoản của con → đặt giới hạn phút chơi/ngày có khoá PIN, xem con học gì, xoá tài khoản).
// Token chỉ giữ trong sessionStorage (máy dùng chung ở trường: đóng tab là thoát). API: server/online.js
import { SUBJECTS } from './island/quiz-data.js';

const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const HOUSE = { long: '🐉 Long', phung: '🦚 Phụng', lan: '🦄 Lân', quy: '🐢 Quy' };
let mode = 'teacher', tok = sessionStorage.getItem('t.tok') || '', who = sessionStorage.getItem('t.who') || '', cls = null;
async function api(path, body, method) {
  const r = await fetch('/api' + path, { method: method || (body ? 'POST' : 'GET'), headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}), body: body ? JSON.stringify(body) : undefined }).catch(() => null);
  if (!r) return { error: 'Không kết nối được máy chủ.' }; const j = await r.json().catch(() => ({})); if (r.status === 401 && path !== '/auth/login' && path !== '/parent/limit' && path !== '/me') logout(); return Object.assign(j, { status: r.status });
}
const ago = t => { if (!t) return '—'; const m = Math.round((Date.now() - t) / 60000); return m < 2 ? 'đang chơi / vừa xong' : m < 60 ? m + ' phút trước' : m < 1440 ? Math.round(m / 60) + ' giờ trước' : Math.round(m / 1440) + ' ngày trước'; };
const pct = a => a && a[0] ? Math.round(100 * a[1] / a[0]) : 0;

function show() {
  const tm = mode === 'teacher';
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', (b.dataset.m === 't') === tm));
  $('#lgTitle').textContent = tm ? 'Đăng nhập giáo viên' : 'Phụ huynh: đăng nhập bằng tài khoản của con';
  $('#lgHint').textContent = tm ? 'Tài khoản giáo viên dùng để tạo lớp, giao nhiệm vụ học và xem tiến độ học sinh.' : 'Dùng tên đăng nhập + mật khẩu con dùng trong game. Phụ huynh đặt thêm mã PIN riêng để con không tự đổi giới hạn.';
  $('#tcRow').classList.toggle('hid', !tm); $('#bNew').classList.toggle('hid', !tm);
  const logged = !!tok && sessionStorage.getItem('t.mode') === mode;
  $('#login').classList.toggle('hid', logged); $('#teach').classList.toggle('hid', !(logged && tm)); $('#parent').classList.toggle('hid', !(logged && !tm));
  $('#out').classList.toggle('hid', !tok); $('#who').textContent = tok ? '👤 ' + who : '';
  if (logged) tm ? loadClasses() : loadParent();
}
function logout() { if (tok) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + tok } }).catch(() => {}); tok = ''; who = ''; cls = null; sessionStorage.removeItem('t.tok'); sessionStorage.removeItem('t.who'); sessionStorage.removeItem('t.mode'); show(); }
async function login(reg) {
  const name = $('#nm').value.trim(), pass = $('#pw').value; $('#lgMsg').textContent = '…';
  const r = reg ? await api('/auth/register', { name, pass, role: 'teacher', teacherCode: $('#tc').value.trim() }) : await api('/auth/login', { name, pass });
  if (r.error) return ($('#lgMsg').textContent = r.error);
  if (mode === 'teacher' && r.user.role !== 'teacher') { $('#lgMsg').textContent = 'Đây là tài khoản học sinh. Phụ huynh hãy chọn tab 👪 Phụ huynh.'; return; }
  tok = r.token; who = r.user.name; sessionStorage.setItem('t.tok', tok); sessionStorage.setItem('t.who', who); sessionStorage.setItem('t.mode', mode); $('#pw').value = ''; $('#lgMsg').textContent = ''; show();
}
// ---------- giáo viên ----------
async function loadClasses() {
  const r = await api('/teacher/classes'); if (r.error) return ($('#cMsg').textContent = r.error);
  $('#clsList').innerHTML = r.classes.map(c => `<button data-c="${c.id}" class="${cls === c.id ? 'on' : ''}">📘 ${esc(c.name)} <small>· ${c.n} em</small></button>`).join('') || '<p class="mute">Chưa có lớp. Tạo lớp đầu tiên bên dưới.</p>';
  if (!cls && r.classes[0]) cls = r.classes[0].id; if (cls) loadClass();
}
async function loadClass() {
  const r = await api('/teacher/classes/' + cls); if (r.error) { cls = null; return $('#clsCard').classList.add('hid'); }
  const c = r.class, S = r.students; $('#clsCard').classList.remove('hid'); $('#cTitle').textContent = '📘 ' + c.name; $('#cCode').textContent = c.code;
  document.querySelectorAll('#clsList button').forEach(b => b.classList.toggle('on', b.dataset.c === cls));
  $('#taskList').innerHTML = (c.tasks || []).map((t, i) => { const done = S.filter(s => s.tasks[i] >= t.n).length;
    return `<div class="row" style="align-items:center;border-bottom:1px solid var(--line);padding:8px 0"><div><b>${esc(t.title)}</b> <small>· ${t.subject === '*' ? 'mọi môn' : esc(t.subject)} · ${t.kind === 'ok' ? 'đúng' : 'làm'} ${t.n} câu · giao ${new Date(t.at).toLocaleDateString('vi')}</small><div class="bar"><i style="width:${S.length ? Math.round(100 * done / S.length) : 0}%"></i></div><small>${done}/${S.length} em hoàn thành</small></div><div style="flex:0 0 auto"><button class="b red sm" data-dt="${t.id}">Xoá</button></div></div>`; }).join('') || '<p class="mute">Chưa giao nhiệm vụ nào.</p>';
  const subs = [...new Set(S.flatMap(s => Object.keys(s.subj || {})))].sort();
  const have = new Set([...$('#tSub').options].map(o => o.value)); $('#tSub').insertAdjacentHTML('beforeend', subs.filter(k => !have.has(k)).map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join(''));   // môn học sinh đã gặp trong game
  $('#stu').innerHTML = S.length ? `<tr><th>Học sinh</th><th>Lần chơi cuối</th><th>Hôm nay / 7 ngày</th><th>Cấp · Nhà</th><th>Môn học (đúng / làm)</th>${(c.tasks || []).map(t => `<th>${esc(t.title)}</th>`).join('')}<th></th></tr>` + S.map(s => `<tr><td><b>${esc(s.name)}</b></td><td>${ago(s.last)}</td><td>${s.todayMin} / ${s.weekMin} phút${s.limitMin ? `<br><small>giới hạn ${s.limitMin}′/ngày</small>` : ''}</td><td>Lv ${s.level}${s.house ? '<br>' + HOUSE[s.house] : ''}</td>
      <td>${subs.filter(k => s.subj[k]).map(k => `<span class="pill">${esc(k)}: <b>${pct(s.subj[k])}%</b> <small>(${s.subj[k][1]}/${s.subj[k][0]})</small></span>`).join('') || '<small>chưa làm câu nào</small>'}</td>
      ${(c.tasks || []).map((t, i) => `<td>${s.tasks[i] >= t.n ? '✅' : `${s.tasks[i]}/${t.n}`}<div class="bar"><i style="width:${Math.round(100 * s.tasks[i] / t.n)}%"></i></div></td>`).join('')}<td><button class="b red sm" data-ds="${s.id}" title="Cho em rời lớp">✖</button></td></tr>`).join('')
    : `<tr><td class="mute">Chưa có học sinh. Đọc mã <b>${esc(c.code)}</b> cho cả lớp nhé.</td></tr>`;
}
// ---------- phụ huynh ----------
async function loadParent() {
  const r = await api('/parent'); if (r.error) return;
  $('#pTitle').textContent = '👪 Tài khoản của ' + r.name; $('#pUsed').textContent = r.usedMin; $('#pLim').value = r.limitMin;
  $('#pPinL').textContent = r.hasPin ? 'Mã PIN phụ huynh (để lưu)' : 'Chưa có PIN — bỏ trống ô này'; $('#pPin').disabled = !r.hasPin;
  const sub = Object.entries(r.subj || {}); $('#pSub').innerHTML = sub.map(([k, a]) => `<div>${esc(k)}: đúng <b>${a[1]}/${a[0]}</b> câu (${pct(a)}%)<div class="bar"><i style="width:${pct(a)}%"></i></div></div>`).join('') || '<p class="mute">Con chưa trả lời câu đố nào.</p>';
  const days = Object.entries(r.days || {}), mx = Math.max(10, ...days.map(d => d[1]));
  $('#pDays').innerHTML = days.map(([d, m]) => `<div class="row" style="align-items:center;gap:8px"><small style="flex:0 0 89px">${d.slice(5).split('-').reverse().join('/')}</small><div class="bar" style="flex:1"><i style="width:${Math.round(100 * m / mx)}%;background:var(--acc)"></i></div><small style="flex:0 0 55px">${m}′</small></div>`).join('') || '<p class="mute">Chưa có dữ liệu.</p>';
}

document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { mode = b.dataset.m === 't' ? 'teacher' : 'parent'; if (tok && sessionStorage.getItem('t.mode') !== mode) logout(); show(); });
$('#bIn').onclick = () => login(false); $('#bNew').onclick = () => login(true); $('#out').onclick = logout;
$('#pw').onkeydown = e => { if (e.key === 'Enter') login(false); };
$('#bCls').onclick = async () => { const r = await api('/teacher/classes', { name: $('#cName').value }); if (r.error) return ($('#cMsg').textContent = r.error); $('#cMsg').textContent = ''; $('#cName').value = ''; cls = r.class.id; loadClasses(); };
$('#clsList').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { cls = b.dataset.c; loadClass(); } };
$('#bTask').onclick = async () => { const r = await api(`/teacher/classes/${cls}/tasks`, { title: $('#tTitle').value, subject: $('#tSub').value, kind: $('#tKind').value, n: +$('#tN').value }); if (!r.error) { $('#tTitle').value = ''; loadClass(); } };
$('#clsCard').onclick = async e => {
  const t = e.target.closest('[data-dt]'), s = e.target.closest('[data-ds]');
  if (t && confirm('Xoá nhiệm vụ này?')) { await api(`/teacher/classes/${cls}/tasks/${t.dataset.dt}`, null, 'DELETE'); loadClass(); }
  if (s && confirm('Cho học sinh này rời lớp?')) { await api(`/teacher/classes/${cls}/students/${s.dataset.ds}`, null, 'DELETE'); loadClass(); }
};
$('#bDelCls').onclick = async () => { if (!confirm('Xoá lớp này? Học sinh vẫn giữ tài khoản và tiến độ.')) return; await api('/teacher/classes/' + cls, null, 'DELETE'); cls = null; $('#clsCard').classList.add('hid'); loadClasses(); };
$('#bLim').onclick = async () => { const r = await api('/parent/limit', { limitMin: +$('#pLim').value, pin: $('#pPin').value, newPin: $('#pNew').value }); $('#pMsg').style.color = r.error ? '' : 'var(--pri)'; $('#pMsg').textContent = r.error || `✅ Đã lưu: ${r.limitMin ? r.limitMin + ' phút mỗi ngày' : 'không giới hạn'}.`; $('#pPin').value = $('#pNew').value = ''; if (!r.error) loadParent(); };
$('#bDel').onclick = async () => { const pass = prompt('Nhập mật khẩu tài khoản của con để xoá vĩnh viễn:'); if (!pass) return; const r = await api('/me', { pass }, 'DELETE'); if (r.error) return alert(r.error); alert('Đã xoá tài khoản.'); logout(); };
$('#tSub').insertAdjacentHTML('beforeend', Object.values(SUBJECTS).map(S => `<option value="${esc(S.name)}">${S.icon || ''} ${esc(S.name)}</option>`).join(''));
if (location.hash === '#parent') mode = 'parent'; else if (sessionStorage.getItem('t.mode')) mode = sessionStorage.getItem('t.mode');
show();
