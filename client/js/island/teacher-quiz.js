// teacher-quiz.js — HỘI THOẠI TRONG THẾ GIỚI 3D: bong bóng thoại nổi trên đầu người (bám vị trí 3D mỗi khung hình), không mở màn hình riêng.
//   • 21 bạn & thầy cô, người dân: bấm E / nút → 2–3 câu theo tính cách (data/talk.js) → 1 câu đố theo môn HOẶC nhiệm vụ nhỏ:
//       tìm đồ (món đồ nổi 3D quanh đó, tới gần là nhặt, mang về), mang thư (đưa cho người khác trong trường), dẫn đường (chọn hướng Bắc/Nam/Đông/Tây).
//   • Chủ trò mini game: intro(key, chỗ cửa, vào) — 2–3 câu + 1 câu hỏi đúng chủ đề rồi mới vào chơi (lessons.js/school-town.js gọi).
//   • Tiết học: lesson({ subj, n, at }) — 3–5 câu liên tiếp ngay trong phòng học 3D (bảng nổi trên bục giảng).
//   Thưởng: ⭐ sao + ghi "📒 Sổ học tập" (ctx.reward / ctx.book; localStorage 'island.inventory'.sao, 'island.book').
//   Ngân hàng câu: data/quiz-bank.json (lớp 1–9 · Toán, Tiếng Việt, Khoa học, LS–ĐL), giải thích ngắn khi sai. Lớp lưu 'island.grade'.
//   Người gần nhất do town-people.js đặt vào ctx.nearNpc (≤ 2,6 m, có id/kind để tra tính cách).
// φ: bong bóng rộng 377 px (Fibonacci), chữ 13/15/21, bo 21, nút cao 44, lề 8/13, đuôi 13; món đồ nổi 0,618 m, xoay 1/φ vòng/s.
import * as THREE from 'three';
import { emote } from './characters.js';
import { to3, TOWN_Y } from './layout.js';
import { personaOf, PERSONA, PLACES, GAME_INTRO, schoolSource } from './data/talk.js';

const SUBJ = ['toan', 'tv', 'kh', 'lsdl'], GRADE = 'island.grade', SEEN = 'island.tq.seen', INV = 'island.inventory', BOOK = 'island.book', DONE = 'island.talk.done';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date().toDateString();
const DIR4 = ['Đông', 'Nam', 'Tây', 'Bắc'];   // −z là hướng bắc (như bản đồ & quests.js)
const dir4 = (dx, dz) => DIR4[((Math.round(Math.atan2(dz, dx) / (Math.PI / 2)) % 4) + 4) % 4];
const shuffle = q => { const o = [0, 1, 2, 3].sort(() => Math.random() - 0.5); return { q: q.q, c: o.map(k => q.c[k]), a: o.indexOf(q.a), e: q.e }; };

export function createTeacherQuiz(ctx) {
  let bank = null; const ready = fetch(new URL('./data/quiz-bank.json', import.meta.url)).then(r => r.json()).then(b => (bank = b)).catch(() => null);
  const css = document.createElement('style'); css.textContent = `
#tQuiz{position:fixed;left:0;top:0;z-index:27;box-sizing:border-box;width:min(377px,calc(100vw - 26px));background:#fffaf0f2;color:#3a2a1a;border-radius:21px;padding:8px 13px 13px;font:14px/1.45 system-ui;text-align:center;box-shadow:0 8px 21px #0005;border:2px solid #f0a23a;will-change:transform}
#tQuiz::after{content:'';position:absolute;left:var(--tail,50%);bottom:-13px;margin-left:-13px;border:13px solid transparent;border-bottom:0;border-top-color:#f0a23a}
#tQuiz.board{background:#24463af2;color:#f4f1e6;border-color:#a8784a}#tQuiz.board::after{border-top-color:#a8784a}#tQuiz.board .who,#tQuiz.board .ex{color:#f4f1e6}
#tQuiz .who{display:flex;align-items:center;gap:5px;text-align:left;font-size:13px}#tQuiz .who b{font-size:14px}#tQuiz .who span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tQuiz button{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;font-family:system-ui}
#tQuiz .chip{padding:3px 8px;border-radius:13px;border:0;background:#f3e3c3;font-weight:700;font-size:12px;color:#5a3a12;min-height:30px}
#tQuiz .x{width:30px;height:30px;border-radius:50%;border:0;background:#e8dcc6;font-weight:800;color:#5a4a3a}
#tQuiz h3{font-size:16px;line-height:1.35;margin:5px 0 8px}#tQuiz .say{font-size:15px;font-weight:600;margin:8px 0 5px;min-height:21px}
#tQuiz .dots{font-size:10px;letter-spacing:3px;opacity:.5}
#tQuiz .ch{display:grid;grid-template-columns:1fr 1fr;gap:5px}
#tQuiz .ch button{min-height:44px;padding:5px 8px;border-radius:13px;border:2px solid transparent;background:#f1e6cf;font-weight:700;font-size:14px;line-height:1.25;color:#3a2a1a}
#tQuiz .ch button i{font-style:normal;opacity:.5;margin-right:3px}
#tQuiz .ch button.ok{background:#c9efc9;border-color:#3fa36b}#tQuiz .ch button.bad{background:#ffd0c8;border-color:#d2553f}
#tQuiz .ex{margin:8px 0 0;font-size:13px;line-height:1.45}#tQuiz .row{display:grid;grid-template-columns:1.618fr 1fr;gap:5px;margin-top:8px}
#tQuiz .row.one{grid-template-columns:1fr}
#tQuiz .row button{min-height:44px;border-radius:21px;border:0;font-weight:800;font-size:14px;background:#f0a23a;color:#2a1a0a}#tQuiz .row .bye{background:#e8dcc6;color:#5a4a3a}
#tQuiz .grades{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin:5px 0 0}#tQuiz .grades button{min-height:44px;border-radius:8px;border:2px solid #e2cfa6;background:#fff;font-weight:800;font-size:16px;color:#5a3a12;padding:0}
#tQuiz .grades button.on{background:#f0a23a;border-color:#c97c18}
body.rs-modal #tQuiz,body.mg-on #tQuiz{display:none}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'tQuiz'; el.hidden = true; document.body.appendChild(el);
  let who = null, next = null;   // next: hành động của nút E / Enter ở bước hiện tại
  const close = () => { ctx.talkHold = null; if (who && who.onClose) { const f = who.onClose; who.onClose = null; f(); } el.hidden = true; who = null; next = null; };

  // ---------- Thưởng ⭐ + Sổ học tập ----------
  ctx.reward = (n, note) => {
    const v = load(INV, {}); v.sao = v.sao || { icon: '⭐', n: 0 }; v.sao.n += n; save(INV, v);
    if (note) { const b = load(BOOK, []); b.push({ t: Date.now(), note, n }); while (b.length > 89) b.shift(); save(BOOK, b); }
    ctx.questEvent && ctx.questEvent('stars');
  };
  ctx.stars = () => load(INV, {}).sao?.n || 0;
  ctx.book = () => load(BOOK, []);
  const logQ = (subj, ok) => { const b = load(BOOK, []), d = today(), last = b[b.length - 1]; if (last && last.d === d && last.s === subj) { last.k++; last.ok += ok ? 1 : 0; } else b.push({ t: Date.now(), d, s: subj, k: 1, ok: ok ? 1 : 0, note: (bank?.subjects[subj]?.name || subj) }); while (b.length > 89) b.shift(); save(BOOK, b); };

  addEventListener('keydown', e => {
    if (el.hidden || e.repeat) return;
    if (e.code === 'Escape') return close();
    const n = '1234'.indexOf(e.key), k = el.querySelector(`[data-k="${n}"]`); if (n >= 0 && k && !k.disabled) { k.click(); return; }
    const g = '123456789'.indexOf(e.key); if (g >= 0 && el.querySelector('[data-g]')) { el.querySelector(`[data-g="${g + 1}"]`).click(); return; }
    if (e.code === 'Enter' && next) next();
  });

  const subjName = (s, g) => { const S = bank.subjects[s]; return (g <= 3 && S.name13) || (g >= 6 && S.name69) || S.name; };
  function pick(g, s) {   // câu chưa hỏi của lớp g môn s; hết thì xoá dấu đã hỏi của nhóm đó
    const list = bank.grades[g]?.[s] || [], seen = load(SEEN, {}), key = g + s; let used = seen[key] || [];
    let idx = list.map((_, i) => i).filter(i => !used.includes(i)); if (!idx.length) { used = []; idx = list.map((_, i) => i); }
    const i = idx[(Math.random() * idx.length) | 0]; used.push(i); seen[key] = used; save(SEEN, seen);
    return shuffle(list[i]);
  }
  // ---------- Khung bong bóng ----------
  function head(chip) {
    return `<div class="who">${who.ava || '💬'}<span><b>${esc(who.title)}</b>${chip ? ' · ' + chip : ''}</span>${who.grade ? `<button class="chip" data-grade>Lớp ${load(GRADE, 0) || '?'} ✎</button>` : ''}<button class="x" aria-label="Đóng">✕</button></div>`;
  }
  const bindHead = () => { el.querySelector('.x').onclick = close; const c = el.querySelector('[data-grade]'); if (c) c.onclick = () => chooseGrade(who.redo || close); };
  const row = (a, b) => `<div class="row${b ? '' : ' one'}"><button class="go">${a}</button>${b ? `<button class="bye">${b}</button>` : ''}</div>`;
  const bindRow = (fa, fb = close) => { const a = el.querySelector('.go'), b = el.querySelector('.bye'), A = () => who && fa(), B = () => who && fb(); if (a) a.onclick = A; if (b) b.onclick = B; next = A; };
  function chooseGrade(then) {
    const g0 = load(GRADE, 0); next = null;
    el.innerHTML = `${head('')}<h3>🎒 Em học lớp mấy? Đố đúng bài lớp em nhé!</h3><div class="grades">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => `<button data-g="${g}" class="${g === g0 ? 'on' : ''}">${g}</button>`).join('')}</div>`;
    bindHead(); el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { save(GRADE, +b.dataset.g); ctx.sfx && ctx.sfx('ui'); then(); });
  }
  // nói lần lượt từng câu; xong → then()
  function sayLines(lines, then, skip) {
    let i = 0;
    const show = () => {
      if (!who) return; if (i >= lines.length) return then();
      el.innerHTML = `${head(who.chip || '')}<p class="say">${esc(lines[i])}</p><div class="dots">${lines.map((_, j) => j === i ? '●' : '○').join('')}</div>${row(i < lines.length - 1 ? 'Tiếp ▶' : (who.lastLabel || 'Tiếp ▶'), skip || '👋 Tạm biệt')}`;
      bindHead(); bindRow(() => { i++; ctx.sfx && ctx.sfx('ui'); show(); }, skip ? () => then(true) : close);
      if (who.e?.hero && i === 0) emote(who.e.hero, who.e.st, 'cheer');
    };
    show();
  }
  // 1 câu hỏi (đã xáo) → done(ok); nhãn nút tiếp theo do người gọi đặt
  function askQ(q, chip, done, after) {
    next = null;
    el.innerHTML = `${head(chip)}<h3>${esc(q.q)}</h3><div class="ch">${q.c.map((t, k) => `<button data-k="${k}"><i>${k + 1}</i>${esc(t)}</button>`).join('')}</div>`;
    bindHead();
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === q.a;
      el.querySelectorAll('[data-k]').forEach((x, j) => { x.disabled = true; if (j === q.a) x.className = 'ok'; else if (j === k) x.className = 'bad'; });
      const r = done(ok) || {};
      el.insertAdjacentHTML('beforeend', `<p class="ex">${ok ? `✅ <b>Chính xác!</b>${r.prize ? ' ' + r.prize : ''} ${esc(q.e)}` : `💡 <b>Chưa đúng.</b> Đáp án: <b>${esc(q.c[q.a])}</b>. ${esc(q.e)}`}</p>${row(after[0], after[1])}`);
      bindRow(after[2], after[3]);
      if (ok) { ctx.sfx && ctx.sfx('ok'); ctx.player.emote && ctx.player.emote('cheer'); if (who?.e?.hero) emote(who.e.hero, who.e.st, 'cheer'); }
      else { ctx.sfx && ctx.sfx('ui'); if (who?.e?.hero) emote(who.e.hero, who.e.st, 'no'); }
    });
  }
  // câu đố theo môn & lớp (vòng lặp "Câu khác")
  function quiz(subj) {
    who.grade = true; who.redo = () => quiz(subj);
    const g = load(GRADE, 0); if (!g) return chooseGrade(() => quiz(subj));
    const S = bank.subjects[subj], chip = `${S.icon} ${subjName(subj, g)}`;
    askQ(pick(g, subj), chip, ok => { logQ(subj, ok); if (!ok) return; ctx.reward(1); ctx.questEvent && ctx.questEvent('quiz'); return { prize: '+1 ⭐' }; },
      ['❓ Câu khác', '👋 Tạm biệt', () => quiz(subj)]);
  }
  const markDone = id => { const d = load(DONE, {}); if (d.day !== today()) { d.day = today(); d.ids = []; } if (!d.ids.includes(id)) d.ids.push(id); save(DONE, d); };
  const doneToday = id => { const d = load(DONE, {}); return d.day === today() && (d.ids || []).includes(id); };

  // ---------- Nhiệm vụ nhỏ (1 việc một lúc) ----------
  let task = null;   // { type:'find'|'letter', giver, giverName, item, name, to, toName, got, x, z, y, thanks }
  const src = () => schoolSource(ctx);
  const agentById = id => { const RS = src(); return RS && RS.agents && RS.agents.find(a => a.id === id); };
  const posOf = a => { const [x, z] = to3(a.x, a.y); return [x, z]; };
  const groundY = (x, z) => { const g = ctx.groundExtra ? ctx.groundExtra(x, z, 9) : -99; return g > -50 ? g : Math.max(TOWN_Y, ctx.terrain.heightAt(x, z)); };
  const shortName = n => String(n).split('·')[0].trim();
  const nameOfId = id => { const a = agentById(id); return a ? shortName(a.name) : id; };
  function hintTo(x, z, what) { const p = ctx.player.pos, d = Math.hypot(x - p.x, z - p.z); return `${what} ở phía <b>${dir4(x - p.x, z - p.z)}</b>, cách khoảng <b>${Math.max(1, Math.round(d))} m</b>.`; }
  // dấu nổi 3D (1 sprite emoji, 1 draw call): món đồ cần tìm hoặc người cần đưa thư
  const mc = document.createElement('canvas'); mc.width = mc.height = 128;
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(mc), transparent: true, depthWrite: false }));
  marker.scale.set(0.618 * 1.618, 0.618 * 1.618, 1); marker.visible = false; marker.renderOrder = 6; ctx.scene.add(marker);
  const setMarker = icon => { const k = mc.getContext('2d'); k.clearRect(0, 0, 128, 128); k.fillStyle = '#fff8e0d0'; k.beginPath(); k.arc(64, 64, 58, 0, 7); k.fill(); k.lineWidth = 6; k.strokeStyle = '#f0a23a'; k.stroke(); k.font = '72px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(icon, 64, 70); marker.material.map.needsUpdate = true; };
  function placeItem(cx, cz) {   // chỗ đặt đồ: vòng 8–21 m quanh người giao, đất bằng, không đè nhà
    const GA = 2.39996;
    for (let i = 0; i < 89; i++) {
      const r = 8 + (i % 13), a = i * GA + Math.random(), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (ctx.terrain.heightAt(x, z) < 0.6) continue;
      if ((ctx.boxes || []).some(b => x > b.x0 - 0.6 && x < b.x1 + 0.6 && z > b.z0 - 0.6 && z < b.z1 + 0.6 && b.top > groundY(x, z) + 0.4)) continue;
      if ((ctx.colliders || []).some(c => Math.hypot(c.x - x, c.z - z) < (c.r || 0.5) + 0.8)) continue;
      return [x, z];
    }
    return [cx + 5, cz];
  }
  function startTask(P, n) {
    const d = P.do; task = { type: d.type, giver: n.id, giverName: shortName(n.name), icon: d.item || '✉️', name: d.name, thanks: d.thanks, to: d.to };
    if (d.type === 'find') {
      const m = n.e?.hero?.model, cx = m ? m.position.x : ctx.player.pos.x, cz = m ? m.position.z : ctx.player.pos.z;
      [task.x, task.z] = placeItem(cx, cz); task.y = groundY(task.x, task.z);
      setMarker(task.icon); ctx.toast(`🔎 Tìm <b>${esc(task.name)}</b> ${task.icon} cho ${esc(task.giverName)}!<br>${hintTo(task.x, task.z, 'Món đồ')}`, 4500);
    } else {
      task.toName = nameOfId(d.to); setMarker('✉️');
      const a = agentById(d.to); ctx.toast(`✉️ Mang thư cho <b>${esc(task.toName)}</b>.${a ? '<br>' + hintTo(...posOf(a), esc(task.toName)) : ''}<br><small>Tìm người có dấu ✉️ nổi trên đầu.</small>`, 4500);
    }
    close();
  }
  function finishTask(n) {   // trả đồ / đưa thư xong
    const t = task; task = null; marker.visible = false;
    open(n, t.type === 'letter' ? '✉️ Nhận thư' : '🎁 Nhận lại đồ');
    sayLines([t.thanks || 'Cảm ơn em nhiều nhé!'], () => {
      ctx.reward(2, t.type === 'letter' ? `Mang thư cho ${t.toName}` : `Tìm ${t.name} cho ${t.giverName}`); markDone(t.giver);
      el.innerHTML = `${head('')}<p class="say">🎉 Nhiệm vụ xong! <b>+2 ⭐</b> · đã ghi vào 📒 Sổ học tập.</p>${row('👋 Tạm biệt')}`; bindHead(); bindRow(close);
      ctx.sfx && ctx.sfx('win'); ctx.player.emote && ctx.player.emote('cheer');
    });
  }
  // hỏi đường: chọn hướng Bắc/Nam/Đông/Tây tới khu (tính từ vị trí thật của người chơi)
  function guide(place, P, n) {
    const RS = src(), r = RS && RS.R && RS.R[place];
    if (!r || r.x == null) return quiz(P.subj || 'lsdl');
    const [x, z] = to3(r.x + r.w / 2, r.y + r.h / 2), p = ctx.player.pos, d = dir4(x - p.x, z - p.z), nm = PLACES[place] || r.name;
    const q = { q: `${nm} ở hướng nào so với chỗ mình đang đứng?`, c: DIR4.map(s => 'Phía ' + s), a: DIR4.indexOf(d), e: `${nm} ở phía ${d}, cách khoảng ${Math.round(Math.hypot(x - p.x, z - p.z))} m. Trên bản đồ (🗺️ / phím M): trên là Bắc, dưới là Nam, phải là Đông, trái là Tây.` };
    askQ(q, '🧭 Hỏi đường', ok => { logQ('lsdl', ok); if (!ok) return; ctx.reward(1, `Chỉ đường tới ${nm}`); markDone(n.id || n.name); return { prize: '+1 ⭐ Cảm ơn nhé!' }; },
      ['❓ Đố thêm', '👋 Tạm biệt', () => quiz('lsdl')]);
  }
  // ---------- Mở bong bóng ----------
  function open(n, chip) {
    const t = n.role === 'teacher', nm = shortName(n.name), title = t && !/^(Cô|Thầy|Chú|Bác|Anh|Chị) /.test(nm) ? (n.female ? 'Cô ' : 'Thầy ') + nm : nm;
    const ava = t ? (n.female ? '👩‍🏫' : '👨‍🏫') : n.role === 'student' ? (n.female ? '👧' : '👦') : (n.female ? '👩' : '👨');
    who = { ...n, title, ava, chip, e: n.e, a: n.e && n.e.a }; ctx.talkHold = n.e || null; el.hidden = false; el.className = ''; ctx.sfx && ctx.sfx('ui'); ctx.player.emote && ctx.player.emote('interact');
  }
  async function talk(n) {
    if (task && task.type === 'find' && task.got && n.id === task.giver) return finishTask(n);
    if (task && task.type === 'letter' && n.id === task.to) return finishTask(n);
    const P = personaOf(n); open(n, P.mood ? `<i>${esc(P.mood)}</i>` : '');
    if (!bank) { el.innerHTML = `${head('')}<p class="say">⏳ …</p>`; await ready; }
    if (!who) return;
    if (!bank) { el.innerHTML = `${head('')}<p class="say">Lát nữa quay lại nói chuyện nhé!</p>`; setTimeout(close, 2618); return; }
    if (task && n.id === task.giver) return sayLines([task.type === 'find' ? `Em tìm thấy ${task.name} chưa?` : `Em đưa thư cho ${task.toName} chưa?`], close);
    const d = P.do || { type: 'quiz', subj: 'toan' }, busy = doneToday(n.id || n.name);
    const isTask = !busy && (d.type === 'find' || d.type === 'letter') && n.id && !task;
    who.lastLabel = isTask ? '🙋 Em giúp!' : d.type === 'guide' && !busy ? '🧭 Chỉ đường' : '❓ Đố em';
    const lines = busy ? [P.lines[0], 'Cảm ơn em lúc nãy nhé! Đố em câu này.'] : P.lines;
    sayLines(lines, () => {
      if (isTask) return startTask(P, n);
      if (d.type === 'guide' && !busy) return guide(d.place, d, n);
      quiz(d.subj || (d.type === 'guide' ? 'lsdl' : 'toan'));
    });
  }
  // ---------- Chủ trò mini game: 2–3 câu + 1 câu hỏi, rồi mới vào chơi ----------
  function intro(key, at, go) {
    const I = GAME_INTRO[key]; if (!I) return go();
    const v = new THREE.Vector3(at.x, (at.y ?? TOWN_Y) + 2.2, at.z);
    who = { name: I.host, title: I.host, ava: '🎮', chip: '', anchor: () => v, home: v, far: 8 }; el.hidden = false; el.className = ''; ctx.sfx && ctx.sfx('ui');
    const enter = () => { if (who) who.onClose = null; close(); go(); };
    who.lastLabel = '❓ Câu hỏi khởi động';
    sayLines(I.lines, skip => {
      if (skip) return enter();
      const dk = 'intro:' + key, first = !doneToday(dk);
      askQ(shuffle(I.q), '🎯 Khởi động', ok => { logQ('Khởi động trò chơi', ok); if (ok && first) { ctx.reward(1, `Khởi động ${key}`); markDone(dk); return { prize: '+1 ⭐' }; } }, ['▶ Vào chơi', '👋 Để sau', enter]);
    }, '▶ Vào chơi luôn');
  }
  // ---------- Tiết học trong phòng 3D: n câu liên tiếp, bảng nổi trên bục giảng ----------
  function lesson({ subj, n = 5, at, title, teacher, late, onDone, onClose }) {
    who = { name: teacher, title: `${teacher} · ${title}`, ava: '🧑‍🏫', anchor: () => at, home: at, far: 21, grade: true, onClose }; el.hidden = false; el.className = 'board'; ctx.sfx && ctx.sfx('open');
    let i = 0, good = 0;
    const step = () => {
      who.redo = step; const g = load(GRADE, 0); if (!g) return chooseGrade(step);
      if (!bank) { ready.then(() => who && step()); return; }
      if (i >= n) {   // tổng kết tiết
        const st = good + (late ? 0 : 1); if (st) ctx.reward(st, `Tiết ${bank.subjects[subj].name}: đúng ${good}/${n}${late ? '' : ' · đúng giờ'}`);
        el.innerHTML = `${head('')}<h3>🔔 Hết tiết! Em đúng <b>${good}/${n}</b> câu.</h3><p class="say">${good === n ? '🌟 Xuất sắc!' : good >= n / 2 ? '👍 Khá lắm!' : '💪 Cố lên, ôn lại bài nhé!'} +${st} ⭐${late ? '' : ' (có 1 ⭐ vào lớp đúng giờ)'}</p>${row('👋 Ra chơi')}`;
        bindHead(); bindRow(close); ctx.sfx && ctx.sfx('win'); onDone && onDone(good); if (who) who.onClose = null; return;
      }
      askQ(pick(g, subj), `${bank.subjects[subj].icon} Câu ${i + 1}/${n}`, ok => { logQ(subj, ok); if (ok) { good++; ctx.questEvent && ctx.questEvent('quiz'); } }, [i + 1 < n ? 'Câu tiếp ▶' : '📊 Xem kết quả', null, () => { i++; step(); }]);
    };
    sayLines([`Cả lớp ngồi ngay ngắn nhé! Tiết ${title} bắt đầu.`, `Hôm nay mình làm ${n} câu — trả lời trên bảng nha.`], step, '▶ Làm bài luôn');
  }
  ctx.teacherQuiz = { talk, intro, lesson, open: () => !el.hidden, close, task: () => task };

  // ---------- Bám bong bóng theo đầu NPC / điểm 3D (chiếu toạ độ 3D → màn hình) ----------
  const v = new THREE.Vector3();
  function place() {
    if (who.e && who.a && who.e.a !== who.a) { const mm = who.e.hero.model; who.home = who.home || mm.position.clone(); who.e = null; }   // người đã rời pool: giữ bong bóng tại chỗ cũ
    const m = who.e?.hero?.model, p = ctx.player.pos;
    if (who.anchor) v.copy(who.anchor()); else if (m) v.set(m.position.x, m.position.y + (who.e.a?._look3d?.h || 1.7) + 0.34, m.position.z); else v.set(p.x, p.y + 2.2, p.z);
    const hx = who.home ? who.home.x : m ? m.position.x : p.x, hz = who.home ? who.home.z : m ? m.position.z : p.z;
    if (Math.hypot(hx - p.x, hz - p.z) > (who.far || 6.5)) { ctx.toast && ctx.toast('👋 Tạm biệt! Lại gần và bấm <b>E</b> để nói chuyện tiếp nhé.', 2000); return close(); }
    v.project(ctx.camera);
    const W = innerWidth, H = innerHeight, w = el.offsetWidth, h = el.offsetHeight, ax = (v.x + 1) / 2 * W, ay = v.z > 1 ? 0 : (1 - v.y) / 2 * H;
    const tb = document.querySelector('.topbtns'), y0 = Math.max(55, tb ? tb.getBoundingClientRect().bottom + 8 : 0);   // điện thoại: hàng nút trên cao hơn
    const x = Math.max(13, Math.min(W - w - 13, ax - w / 2)), top = Math.max(y0, Math.min(H - h - 89, ay - h - 13));   // tránh hàng nút trên và nút dưới (89)
    el.style.transform = `translate(${Math.round(x)}px,${Math.round(top)}px)`;
    el.style.setProperty('--tail', Math.max(21, Math.min(w - 21, ax - x)) + 'px');
  }

  let spin = 0;
  return {
    update(dt = 0.016) {
      // dấu nhiệm vụ: món đồ (xoay, nhấp nhô) hoặc trên đầu người nhận thư
      if (task) {
        spin += dt;
        if (task.type === 'find' && !task.got) {
          marker.position.set(task.x, task.y + 0.9 + Math.sin(spin * 2.618) * 0.13, task.z); marker.visible = true;
          const p = ctx.player.pos; if (Math.hypot(task.x - p.x, task.z - p.z) < 1.618 && Math.abs(task.y - p.y) < 2.6) {
            task.got = true; ctx.sfx && ctx.sfx('ok'); ctx.player.emote && ctx.player.emote('pickup');
            const a = agentById(task.giver); ctx.toast(`${task.icon} Đã nhặt <b>${esc(task.name)}</b>! Mang về cho ${esc(task.giverName)}.${a ? '<br>' + hintTo(...posOf(a), esc(task.giverName)) : ''}`, 4000); setMarker(task.icon);
          }
        } else {
          const a = agentById(task.type === 'find' ? task.giver : task.to);
          if (a && a.visible !== false) { const [x, z] = posOf(a); marker.position.set(x, groundY(x, z) + 2.6 + Math.sin(spin * 2.618) * 0.13, z); marker.visible = true; } else marker.visible = false;
        }
      }
      if (!el.hidden && who) { place(); if (who) ctx.offer(next ? (el.querySelector('.go')?.textContent || '▶ Tiếp') : '👋 Tạm biệt', next || close, 9); return; }   // đang nói: nút E = bước tiếp (không mở nhầm cửa gần đó)
      const n = ctx.nearNpc; if (!n || ctx.player.vehicle || ctx.player.frozen) return;
      const nm = shortName(n.name);
      if (task && ((task.type === 'letter' && n.id === task.to) || (task.type === 'find' && task.got && n.id === task.giver))) return ctx.offer(task.type === 'letter' ? `✉️ Đưa thư cho ${nm}` : `🎁 Trả ${task.name} cho ${nm}`, () => talk(n), 4);
      const lead = n.role === 'teacher' ? `💬 Nói chuyện với ${/^(Cô|Thầy|Chú|Bác) /.test(nm) ? nm : (n.female ? 'cô ' : 'thầy ') + nm}` : `💬 Nói chuyện với ${nm}`;
      ctx.offer(lead, () => talk(n), n.d < 1.618 ? 4 : 1);   // đứng sát (< φ m) → ưu tiên hơn cửa nhà / xe đạp đỗ gần đó
    },
  };
}
export { PERSONA };
