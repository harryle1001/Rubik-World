// wild/naturalist.js — QUAN SÁT THIÊN NHIÊN cho "nhà sinh vật học nhí":
//   📔 Sổ tay thiên nhiên: mỗi loài 1 trang (tên Việt + tên khoa học, lớp, thức ăn, nơi sống, tập tính, mức bảo tồn IUCN, câu đố nhỏ, ảnh tự chụp)
//   🔭 Ống nhòm (phím ,): góc nhìn thứ nhất, zoom 3× / 5× / 8× (dãy Fibonacci), tâm ngắm nhận ra loài → ghi sổ từ xa mà không làm thú sợ
//   📷 Chụp ảnh: lưu ảnh nhỏ 96 px vào trang của loài (localStorage)
//   🧭 Nhiệm vụ: tìm đủ 8 loài chim · theo dấu chân · đếm đàn · chụp 13 loài · cho 5 loài ăn · quan sát 8 tập tính
// Dữ liệu loài: species.js · thú đang hiện: wildlife.js (wild.each) + thú cũ (ctx.animals) · lưu: localStorage 'island.nature'
import * as THREE from 'three';
import { SPECIES, HAB, CLS, IUCN, SEASONS, WAITLIST } from './species.js';
import { PHI } from '../layout.js';

const KEY = 'island.nature', BY = new Map(SPECIES.map(S => [S.id, S]));
const OBS = { drink: ['💧', 'Uống nước'], mud: ['🟤', 'Tắm bùn'], sleep: ['💤', 'Ngủ'], howl: ['🌕', 'Hú gọi bầy'], climb: ['🌳', 'Leo cây'], burrow: ['🕳️', 'Chui hang'], brood: ['🥚', 'Ấp trứng'], feedchick: ['🐣', 'Mớm mồi'], vform: ['🪿', 'Bay chữ V'], hunt: ['🏃', 'Rượt đuổi'], dust: ['💨', 'Tắm bụi'], young: ['👣', 'Mẹ dẫn con'], wire: ['🔌', 'Đậu dây điện'], blow: ['⛲', 'Cá voi phun nước'] };
const QUESTS = [
  { id: 'birds', ic: '🐦', name: 'Tìm đủ 8 loài chim', goal: 8, coin: 21 }, { id: 'photo', ic: '📷', name: 'Chụp ảnh 13 loài', goal: 13, coin: 21 },
  { id: 'track', ic: '👣', name: 'Theo dấu chân 3 lần', goal: 3, coin: 13 }, { id: 'count', ic: '🔢', name: 'Đếm đúng 3 đàn', goal: 3, coin: 13 },
  { id: 'feed', ic: '🥕', name: 'Cho 5 loài ăn', goal: 5, coin: 13 }, { id: 'obs', ic: '🔭', name: 'Quan sát 8 tập tính', goal: 8, coin: 21 },
];

export function createNaturalist(ctx) {
  const wild = ctx.wild, camera = ctx.camera, pl = ctx.player;
  let D = { seen: {}, photo: {}, fed: {}, quiz: {}, obs: {}, q: {}, done: {} };
  try { Object.assign(D, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { D.photo = {}; try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e2) {} } };
  const N = { data: D, species: SPECIES };
  if (wild.off) { N.update = () => {}; return N; }

  // ───────── giao diện ─────────
  const css = document.createElement('style'); css.textContent = `
#bNat b{font-size:13px}#bBino.on{background:#f0a23acc}
#natBook{position:fixed;inset:0;z-index:60;background:#0b1622cc;display:flex;align-items:center;justify-content:center;font:15px/1.45 system-ui;color:#2b2633}
#natBook[hidden],#natBino[hidden],#natChip[hidden]{display:none}
#natBook .bk{width:min(960px,96vw);height:min(89vh,640px);background:#fbf6ea;border-radius:21px;box-shadow:0 13px 55px #0008;display:flex;flex-direction:column;overflow:hidden}
#natBook header{display:flex;align-items:center;gap:8px;padding:10px 13px;background:#3f6b2a;color:#fff}#natBook header h3{margin:0;font-size:18px;flex:1}#natBook header small{opacity:.9;font-size:13px}
#natBook .x{width:42px;height:42px;border-radius:21px;border:0;background:#fff3;color:#fff;font-size:21px;cursor:pointer}
#natBook .tabs{display:flex;gap:5px;padding:8px 10px;overflow-x:auto;background:#efe6d0;flex:none}#natBook .tabs button{flex:none;border:0;border-radius:13px;padding:8px 10px;min-height:42px;background:#fff;font:600 13px system-ui;cursor:pointer;white-space:nowrap}#natBook .tabs button.on{background:#3f6b2a;color:#fff}
#natBook .body{flex:1;display:flex;min-height:0}#natBook .grid{flex:1.618;overflow-y:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(89px,1fr));gap:8px;align-content:start}
#natBook .c{border:2px solid #e3d9c0;border-radius:13px;background:#fff;padding:5px 3px;text-align:center;cursor:pointer;font:600 12px/1.2 system-ui;min-height:89px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#2b2633}
#natBook .c i{font-style:normal;font-size:34px;line-height:1}#natBook .c img{width:55px;height:55px;border-radius:8px;object-fit:cover}#natBook .c.no{background:#f1ece0;color:#9a917e;border-style:dashed}#natBook .c.no i{filter:grayscale(1) opacity(.35)}#natBook .c.on{border-color:#3f6b2a;box-shadow:0 0 0 2px #3f6b2a55}
#natBook .det{flex:1;overflow-y:auto;padding:13px;border-left:2px solid #e3d9c0;background:#fffdf6}#natBook .det h4{margin:0;font-size:21px}#natBook .det em{color:#6b6252}#natBook .det .ph{width:100%;max-width:210px;aspect-ratio:1;border-radius:13px;background:#eef3e6;display:flex;align-items:center;justify-content:center;font-size:89px;margin:0 auto 8px;overflow:hidden}#natBook .det .ph img{width:100%;height:100%;object-fit:cover}
#natBook .row{margin:5px 0}#natBook .row b{color:#3f6b2a}#natBook .tag{display:inline-block;padding:2px 8px;border-radius:13px;color:#fff;font:700 12px system-ui;margin-right:5px}
#natBook .quiz button,#natBook .qbtn{display:block;width:100%;margin:5px 0;padding:10px;min-height:42px;border-radius:13px;border:2px solid #d9cfb6;background:#fff;font:600 14px system-ui;cursor:pointer;text-align:left}#natBook .quiz button.ok{background:#dcf5e4;border-color:#3fae5a}#natBook .quiz button.bad{background:#fde3e0;border-color:#e0453c}
#natBook .qs{flex:1;overflow-y:auto;padding:13px}#natBook .q{background:#fff;border:2px solid #e3d9c0;border-radius:13px;padding:10px;margin-bottom:8px}#natBook .q.ok{background:#dcf5e4;border-color:#3fae5a}#natBook .bar{height:8px;border-radius:5px;background:#e9e0c8;margin-top:5px;overflow:hidden}#natBook .bar i{display:block;height:100%;background:linear-gradient(90deg,#8fcf6a,#3f6b2a)}
@media(max-width:700px){#natBook .body{flex-direction:column}#natBook .det{border-left:0;border-top:2px solid #e3d9c0;flex:1.2}#natBook .grid{flex:1;grid-template-columns:repeat(auto-fill,minmax(72px,1fr))}#natBook .det .ph{max-width:110px;font-size:55px;float:left;margin:0 10px 5px 0}}
#natBino{position:fixed;inset:0;z-index:24;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 0,transparent min(38vw,38vh),#05090ccc min(39.5vw,39.5vh),#05090c min(55vw,55vh))}
#natBino:before,#natBino:after{content:"";position:absolute;left:50%;top:50%;background:#fff9}#natBino:before{width:34px;height:2px;margin:-1px -17px}#natBino:after{width:2px;height:34px;margin:-17px -1px}
#natBino .lb{position:absolute;left:50%;top:calc(50% + min(24vw,24vh));transform:translateX(-50%);padding:5px 13px;border-radius:21px;background:#1b1626e6;color:#fff;font:700 15px system-ui;white-space:nowrap;text-align:center}#natBino .lb small{display:block;font:italic 12px system-ui;opacity:.85}
#natBino .zm{position:absolute;left:50%;bottom:max(96px,13vh);transform:translateX(-50%);display:flex;gap:8px;pointer-events:auto}#natBino .zm button{min-width:55px;height:42px;border-radius:21px;border:2px solid #fff8;background:#1b1626cc;color:#fff;font:700 14px system-ui;cursor:pointer}#natBino .zm button.on{background:#f0a23a}
#natChip{position:fixed;left:50%;top:max(64px,calc(env(safe-area-inset-top) + 64px));transform:translateX(-50%);z-index:25;padding:5px 13px;border-radius:21px;background:#3f6b2ae6;color:#fff;font:700 13px system-ui;pointer-events:none;white-space:nowrap}
@media(max-width:700px){#natBook header small{display:none}#natBook header h3{font-size:16px}#natBino .zm{bottom:auto;top:calc(50% + 41vw)}#natBino .lb{top:calc(50% + 26vw)}}
#natFlash{position:fixed;inset:0;z-index:61;background:#fff;opacity:0;pointer-events:none;transition:opacity .34s}`;
  document.head.appendChild(css);
  const mk = (tag, id, html = '') => { const e = document.createElement(tag); if (id) e.id = id; e.innerHTML = html; return e; };
  const book = mk('div', 'natBook'); book.hidden = true; document.body.appendChild(book);
  const bino = mk('div', 'natBino', '<div class="lb" hidden></div><div class="zm"><button data-z="3">3×</button><button data-z="5">5×</button><button data-z="8">8×</button><button data-z="0">✖ Thoát</button></div>'); bino.hidden = true; document.body.appendChild(bino);
  const chip = mk('div', 'natChip'); chip.hidden = true; document.body.appendChild(chip);
  const flash = mk('div', 'natFlash'); document.body.appendChild(flash);
  // máy tính: hàng nút trên · điện thoại (hẹp, hàng trên đã kín chỗ): trong menu ☰ như các sổ khác
  const narrow = innerWidth < 700 && !!document.getElementById('moreMenu'), bar = (narrow && document.getElementById('moreMenu')) || document.querySelector('.topbtns') || document.body;
  const bNat = mk('button', 'bNat'); bNat.title = 'Sổ tay thiên nhiên (phím .)'; bar.appendChild(bNat);
  const bBino = mk('button', 'bBino', narrow ? '🔭 Ống nhòm' : '<i>🔭</i>'); bBino.title = 'Ống nhòm (phím ,)'; bar.appendChild(bBino);
  const total = SPECIES.length, seenN = () => SPECIES.reduce((n, S) => n + (D.seen[S.id] ? 1 : 0), 0);
  const label = () => { bNat.innerHTML = narrow ? `📔 Sổ tay thiên nhiên ${seenN()}/${total}` : `<i>📔</i><b>${seenN()}/${total}</b>`; };
  label();

  // ───────── ghi sổ ─────────
  const qProg = id => id === 'birds' ? SPECIES.filter(S => S.cls === 'chim' && D.seen[S.id]).length : id === 'photo' ? Object.keys(D.photo).length : id === 'feed' ? Object.keys(D.fed).length : id === 'obs' ? Object.keys(D.obs).length : (D.q[id] || 0);
  function checkQuests() { for (const Q of QUESTS) if (!D.done[Q.id] && qProg(Q.id) >= Q.goal) { D.done[Q.id] = Date.now(); save(); ctx.toast(`🏅 Nhà sinh vật học nhí: hoàn thành <b>${Q.ic} ${Q.name}</b>!`, 6000); ctx.sfx && ctx.sfx('win'); ctx.reward && ctx.reward(Q.coin, 'nhiệm vụ thiên nhiên'); } }
  function see(S, how) {
    if (!S || !BY.has(S.id) || D.seen[S.id]) return false; D.seen[S.id] = Date.now(); save(); label(); checkQuests(); return true;
  }
  // loài mới của hệ wild: báo + ghi cả Sổ sinh vật cũ trên bản đồ (ctx.discover)
  function found(S, how = '') {
    if (!see(S)) return;
    ctx.toast(`📔 Loài mới trong Sổ tay: <b>${S.ic} ${S.name}</b> <i>(${S.sci})</i> · ${seenN()}/${total}<br>${S.habit}`, 7000); ctx.sfx && ctx.sfx('ok');
  }
  const d0 = ctx.discover; if (d0) ctx.discover = S => { d0(S); if (S && BY.has(S.id)) see(BY.get(S.id)); };   // thú cũ (animals.js, fauna.js) gặp ở đâu cũng vào sổ tay
  function observe(key, S) { if (!OBS[key] || D.obs[key]) return; D.obs[key] = S ? S.id : 1; save(); ctx.toast(`🔭 Quan sát được tập tính mới: <b>${OBS[key][0]} ${OBS[key][1]}</b>${S ? ' — ' + S.name : ''}`, 5000); checkQuests(); }
  const EVT = { drink: S => 'uống nước', mud: S => 'tắm bùn', burrow: S => 'chui vào hang', climb: S => 'leo cây', howl: S => 'hú gọi bầy', brood: S => 'nằm ấp trứng' };
  wild.onEvent = (ev, S, A, S2) => {
    const d = A && A.root ? Math.hypot(A.root.position.x - pl.pos.x, A.root.position.z - pl.pos.z) : 30;
    if (ev === 'vform') { ctx.toast(`🪿 Nhìn lên trời! <b>Đàn ngỗng trời</b> bay hình chữ V – mùa ${SEASONS[wild.season][1].toLowerCase()} chúng di cư về phương ${wild.season >= 2 ? 'nam tránh rét' : 'bắc'}.`, 7000); observe('vform', S); found(S); return; }
    if (d > 34) return;
    if (ev === 'hunt' || ev === 'dive' || ev === 'chase') { observe('hunt', S); if (ev !== 'chase') ctx.toast(`${S.ic} <b>${S.name}</b> đang rượt ${S2.ic} ${S2.name.toLowerCase()}! Xem ai nhanh hơn…`, 5000); }
    else if (ev === 'escaped') ctx.toast(`${S2.ic} <b>${S2.name}</b> chạy thoát rồi! ${S.ic} ${S.name} đứng thở dốc – thú săn mồi trượt nhiều lần hơn là bắt được.`, 6500);
    else if (ev === 'blow') observe('blow', S);
    else if (EVT[ev]) observe(ev, S);
  };

  // ───────── Sổ tay ─────────
  let tab = 'all', cur = null;
  const open = () => { book.hidden = false; pl.frozen = true; ctx.sfx && ctx.sfx('ui'); if (binoOn) setBino(0); render(); };
  const close = () => { book.hidden = true; pl.frozen = false; };
  const hint = S => `Chưa gặp. Hãy tìm ở <b>${HAB[S.hab][0]} ${HAB[S.hab][1]}</b>${S.act === 'n' ? ' vào <b>ban đêm</b>' : ''}${S.mig ? ' (mùa ' + S.mig.map(m => SEASONS[m][1]).join(', ') + ')' : ''}.`;
  function render() {
    const se = SEASONS[wild.season || 0], tabs = [['all', '📔 Tất cả'], ...Object.entries(HAB).map(([k, v]) => [k, v[0] + ' ' + v[1]]), ['quest', '🧭 Nhiệm vụ']];
    const list = tab === 'all' ? SPECIES : SPECIES.filter(S => S.hab === tab), stars = QUESTS.filter(Q => D.done[Q.id]).length;
    let h = `<div class="bk"><header><h3>📔 Sổ tay thiên nhiên · ${seenN()}/${total} loài</h3><small>${se[0]} Mùa ${se[1]} · ${'⭐'.repeat(stars) || 'Nhà sinh vật học nhí'}</small><button class="x" title="Đóng">✖</button></header>
      <div class="tabs">${tabs.map(([k, t]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${t}</button>`).join('')}</div><div class="body">`;
    if (tab === 'quest') {
      h += `<div class="qs">${QUESTS.map(Q => { const p = Math.min(Q.goal, qProg(Q.id)); return `<div class="q ${D.done[Q.id] ? 'ok' : ''}"><b>${Q.ic} ${Q.name}</b> — ${p}/${Q.goal} ${D.done[Q.id] ? '✅' : ''}<div class="bar"><i style="width:${p / Q.goal * 100}%"></i></div>${Q.id === 'track' && !D.done.track ? '<button class="qbtn" data-go="track">👣 Bắt đầu theo dấu chân (đứng gần rừng, nông trại hoặc Safari)</button>' : ''}</div>`; }).join('')}
        <div class="q"><b>🔭 Tập tính đã quan sát</b><br>${Object.entries(OBS).map(([k, v]) => `<span style="opacity:${D.obs[k] ? 1 : 0.35}">${v[0]} ${v[1]}</span>`).join(' · ')}</div>
        <div class="q"><b>🛖 Mẹo</b>: đi chậm thì thú ít sợ · nấp trong <b>chòi / lều quan sát</b> thú sẽ không bỏ chạy · dùng <b>🔭 ống nhòm</b> để ghi sổ từ xa · đêm và ngày, nắng và mưa có loài khác nhau.</div>
        <div class="q"><b>⏳ Loài đang chờ model</b>: ${WAITLIST.join(', ')}.</div></div>`;
    } else {
      h += `<div class="grid">${list.map(S => { const ok = D.seen[S.id]; return `<button class="c ${ok ? '' : 'no'} ${cur === S.id ? 'on' : ''}" data-s="${S.id}">${ok && D.photo[S.id] ? `<img src="${D.photo[S.id]}" alt="">` : `<i>${S.ic}</i>`}<span>${ok ? S.name : '???'}</span></button>`; }).join('')}</div><div class="det">${detail()}</div>`;
    }
    book.innerHTML = h + '</div></div>';
  }
  function detail() {
    const S = BY.get(cur); if (!S) return '<p>👈 Chạm vào một ô để xem trang của loài.<br><br>Gặp con vật nào ở ngoài đảo (lại gần, nhìn qua 🔭 ống nhòm hoặc 📷 chụp ảnh) thì trang của nó sẽ mở ra.</p>';
    if (!D.seen[S.id]) return `<div class="ph">❓</div><h4>???</h4><p>${hint(S)}</p>`;
    const st = IUCN[S.st] || IUCN.LC, q = S.q, done = D.quiz[S.id];
    return `<div class="ph">${D.photo[S.id] ? `<img src="${D.photo[S.id]}" alt="">` : S.ic}</div><h4>${S.ic} ${S.name}</h4><em>${S.sci}</em>
      <div class="row"><span class="tag" style="background:#5b7fa6">${CLS[S.cls]}</span><span class="tag" style="background:${st[1]}">${S.st === 'NA' ? '' : S.st + ' · '}${st[0]}</span>${S.var ? '<span class="tag" style="background:#9a917e">biến thể màu</span>' : ''}</div>
      <div class="row"><b>🍽️ Thức ăn:</b> ${S.eat}</div><div class="row"><b>🏡 Nơi sống:</b> ${S.live} · gặp ở ${HAB[S.hab][0]} ${HAB[S.hab][1]}</div><div class="row"><b>✨ Tập tính:</b> ${S.habit}</div>
      <div class="row">${D.photo[S.id] ? '📷 Đã chụp ảnh' : '📷 Chưa có ảnh'} · ${S.feed ? (D.fed[S.id] ? '🥕 Đã cho ăn' : `🥕 Thích ăn ${S.feed}`) : 'Không cho ăn loài này'}</div>
      <div class="quiz"><b>❓ Câu đố nhỏ ${done ? '⭐' : ''}:</b> ${q[0]}${q[1].map((t, i) => `<button data-a="${i}">${t}</button>`).join('')}</div>`;
  }
  book.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) { if (e.target === book) close(); return; }
    if (t.classList.contains('x')) return close();
    if (t.dataset.t) { tab = t.dataset.t; render(); }
    else if (t.dataset.s) { cur = t.dataset.s; render(); }
    else if (t.dataset.go === 'track') { close(); startTrack(); }
    else if (t.dataset.a != null) { const S = BY.get(cur), ok = +t.dataset.a === S.q[2]; t.classList.add(ok ? 'ok' : 'bad'); ctx.sfx && ctx.sfx(ok ? 'ok' : 'ui');
      if (ok && !D.quiz[S.id]) { D.quiz[S.id] = 1; save(); ctx.reward && ctx.reward(3, 'câu đố thiên nhiên'); } if (!ok) { const b = book.querySelectorAll('.quiz button')[S.q[2]]; b && b.classList.add('ok'); } }
  });
  bNat.onclick = () => book.hidden ? open() : close();

  // ───────── Ống nhòm ─────────
  let binoOn = 0, baseFov = 55, aim = null, aimT = 0, shotReq = null; const _v = new THREE.Vector3(), _h = new THREE.Vector3();
  function setBino(z) {
    if (z && (pl.frozen || ctx.underwater || (pl.vehicle && !binoOn))) { if (!binoOn) ctx.toast('🔭 Hãy đứng trên mặt đất (không lái xe, không lặn) để dùng ống nhòm nhé!'); return; }
    if (z && !binoOn) { baseFov = camera.fov; ctx.toast('🔭 <b>Ống nhòm</b>: kéo màn hình để nhìn quanh, đưa dấu ＋ vào con vật để nhận ra loài, bấm <b>📷 Chụp ảnh</b> để lưu vào Sổ tay.', 6000); }
    if (!z && binoOn) { camera.fov = baseFov; camera.updateProjectionMatrix(); if (pl.root) pl.root.visible = true; }
    binoOn = z; bino.hidden = !z; bBino.classList.toggle('on', !!z); bino.querySelectorAll('.zm button').forEach(b => b.classList.toggle('on', +b.dataset.z === z));
  }
  bBino.onclick = () => setBino(binoOn ? 0 : 5);
  bino.querySelector('.zm').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBino(+b.dataset.z); });
  addEventListener('keydown', e => { if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (e.code === 'Comma' && !ctx.mapOpen && !ctx.photoMode && book.hidden) setBino(binoOn ? 0 : 5); else if (e.code === 'Period' && (!pl.frozen || !book.hidden)) book.hidden ? open() : close(); else if (e.code === 'Escape') { if (!book.hidden) close(); else if (binoOn) setBino(0); } });
  // tìm con vật gần tâm màn hình nhất (trong nón ngắm) — cả thú của wild lẫn thú cũ
  function pickAim(maxNdc, maxDist) {
    let best = null, bs = 1e9; const cp = camera.position;
    const test = (S, x, y, z, r, G, A) => { _v.set(x, y, z); const dist = _v.distanceTo(cp); if (dist > maxDist) return; _v.project(camera); if (_v.z > 1 || _v.z < -1) return; const m = Math.hypot(_v.x, _v.y * (innerHeight / innerWidth)); const tol = maxNdc + Math.min(0.55, r * 0.4 / dist / Math.tan(camera.fov * Math.PI / 360) / Math.max(1, camera.aspect)); if (m < tol && m < bs) { bs = m; best = { S, G, A, dist, x, y, z }; } };
    wild.each(test);
    if (ctx.animals) for (const A of ctx.animals.list.concat(ctx.animals.flocks || [])) { const q = A.root.position; if (A.root.visible === false) continue; const S = BY.get(A.S.id); if (S) test(S, q.x, q.y + 0.4, q.z, 1, null, null); }
    return best;
  }
  // chụp ngay sau khi vẽ xong khung hình (canvas WebGL không giữ ảnh giữa các khung)
  let hooked = false; const hookPost = () => { const post = ctx.post; if (hooked || !post || !post.render) return; hooked = true; const r0 = post.render; post.render = function () { r0.apply(this, arguments); if (shotReq) { const S = shotReq; shotReq = null; snap(S); } }; };   // ctx.post được gán sau khi các module tạo xong → móc ở khung đầu tiên
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 96;
  function snap(S) {
    try { const src = ctx.renderer.domElement, s = Math.min(src.width, src.height) * (binoOn ? 0.62 : 0.34), g = cvs.getContext('2d'); g.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, 96, 96); D.photo[S.id] = cvs.toDataURL('image/jpeg', 0.72); } catch (e) { D.photo[S.id] = ''; }
    save(); flash.style.transition = 'none'; flash.style.opacity = 0.8; requestAnimationFrame(() => { flash.style.transition = 'opacity .34s'; flash.style.opacity = 0; });
    const first = !D.seen[S.id]; found(S); if (!first) ctx.toast(`📷 Đã lưu ảnh <b>${S.ic} ${S.name}</b> vào Sổ tay thiên nhiên (${Object.keys(D.photo).length} ảnh).`, 4000); ctx.sfx && ctx.sfx('coin'); checkQuests();
  }

  // ───────── nhiệm vụ: theo dấu chân ─────────
  const track = { on: false, G: null, mesh: null, n: 0 };
  function startTrack() {
    const p = pl.pos; let best = null, bd = 1e9;
    for (const G of wild.groups) { const S = G.S; if (S.k !== 'w' || G.floe || !G.site || /^sea/.test(G.site.hab) || (S.mig && !S.mig.includes(wild.season))) continue; const d = Math.hypot(G.hx - p.x, G.hz - p.z); if (d > 21 && d < 144 && d < bd) { bd = d; best = G; } }
    if (!best) { ctx.toast('👣 Quanh đây chưa thấy dấu chân nào. Hãy tới gần rừng, nông trại, đồi núi hoặc Safari rồi thử lại nhé!'); return; }
    if (!track.mesh) { const g = new THREE.CircleGeometry(0.13, 6).rotateX(-Math.PI / 2).scale(0.7, 1, 1.25); track.mesh = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: '#3a2a1e', transparent: true, opacity: 0.6, depthWrite: false }), 55); track.mesh.frustumCulled = false; ctx.scene.add(track.mesh); }
    const o = new THREE.Object3D(), n = Math.min(55, Math.max(8, Math.round(bd / 1.6))), yaw = Math.atan2(best.hx - p.x, best.hz - p.z); track.n = n;
    for (let i = 0; i < 55; i++) { const u = (i + 1) / n, x = p.x + (best.hx - p.x) * u + Math.cos(yaw) * (i % 2 ? 0.22 : -0.22) + Math.sin(u * 9) * 1.2 * Math.sin(u * Math.PI), z = p.z + (best.hz - p.z) * u - Math.sin(yaw) * (i % 2 ? 0.22 : -0.22);
      o.position.set(x, Math.max(ctx.terrain.heightAt(x, z), 0) + 0.06, z); o.rotation.y = yaw; o.scale.setScalar(i < n ? Math.max(0.6, Math.min(1.6, best.S.s * 0.5)) : 0); o.updateMatrix(); track.mesh.setMatrixAt(i, o.matrix); }
    track.mesh.instanceMatrix.needsUpdate = true; track.mesh.visible = true; track.on = true; track.G = best;
    ctx.toast('👣 Có dấu chân lạ trên mặt đất! Đi theo vệt dấu chân xem con gì để lại nhé (đi chậm kẻo nó sợ).', 6000); ctx.sfx && ctx.sfx('ui');
  }
  function stepTrack() {
    const G = track.G, d = Math.hypot(G.hx - pl.pos.x, G.hz - pl.pos.z);
    chip.hidden = false; chip.textContent = `👣 Theo dấu chân · còn ${Math.round(d)} m`;
    if (d < 10) { track.on = false; track.mesh.visible = false; chip.hidden = true; D.q.track = (D.q.track || 0) + 1; save(); found(G.S); ctx.toast(`👣 Tìm ra rồi! Dấu chân của <b>${G.S.ic} ${G.S.name}</b>. (${D.q.track}/3 lần theo dấu)`, 6000); ctx.sfx && ctx.sfx('win'); checkQuests(); }
    else if (d > 233) { track.on = false; track.mesh.visible = false; chip.hidden = true; }
  }
  // ───────── nhiệm vụ: đếm đàn ─────────
  function askCount(G) {
    const n = wild.groupCount(G), S = G.S, opts = [n - 1, n, n + 1].filter(x => x > 0); if (n < 3) opts.push(n + 2); opts.sort(() => Math.random() - 0.5);
    G.counted = true; cur = null; book.hidden = false; pl.frozen = true;
    book.innerHTML = `<div class="bk" style="height:auto;max-width:420px"><header><h3>🔢 Đếm đàn</h3><button class="x">✖</button></header><div class="det" style="border:0"><h4>${S.ic} Đàn ${S.name.toLowerCase()} này có mấy con?</h4><p>(Chỉ đếm con trưởng thành. Chưa chắc thì đóng lại, nhìn kĩ rồi đếm lại.)</p><div class="quiz">${opts.map(x => `<button data-n="${x}">${x} con</button>`).join('')}</div></div></div>`;
    book.querySelector('.quiz').onclick = e => { const b = e.target.closest('button'); if (!b) return; const ok = +b.dataset.n === n; b.classList.add(ok ? 'ok' : 'bad');
      if (ok) { D.q.count = (D.q.count || 0) + 1; save(); ctx.sfx && ctx.sfx('ok'); ctx.toast(`🔢 Chính xác: ${n} con ${S.name.toLowerCase()}! (${D.q.count}/3 đàn)`, 5000); checkQuests(); } else { G.counted = false; ctx.toast('🔢 Chưa đúng, nhìn kĩ rồi đếm lại nhé!', 4000); }
      setTimeout(close, 700); };
  }

  // ───────── vòng lặp ─────────
  let scanT = 0, hideShown = false, sleepSeen = 0;
  N.update = dt => {
    hookPost(); if (!wild.ready) return;
    if (ctx.photoMode || ctx.freeCam) { if (binoOn) setBino(0); return; }   // chế độ chụp ảnh tự do (photo.js) / cắt cảnh cốt truyện đang giữ camera
    if (track.on) stepTrack();
    // ống nhòm: camera ra đầu nhân vật, nhìn theo hướng kéo, zoom theo mức; nhận loài ở tâm ngắm
    if (binoOn) {
      if (pl.frozen || ctx.underwater || ctx.mapOpen) { setBino(0); return; }
      const yaw = pl.cam.yaw, pitch = Math.max(-0.5, Math.min(1.1, (0.62 - pl.cam.pitch) * 1.1 + 0.02));
      _h.set(pl.pos.x - Math.sin(yaw) * 0.5, pl.pos.y + 1.75, pl.pos.z - Math.cos(yaw) * 0.5); camera.position.copy(_h);
      camera.lookAt(_h.x - Math.sin(yaw) * Math.cos(pitch) * 10, _h.y + Math.sin(pitch) * 10, _h.z - Math.cos(yaw) * Math.cos(pitch) * 10);
      const fov = baseFov / binoOn * (innerWidth < innerHeight ? 1.2 : 1); if (Math.abs(camera.fov - fov) > 0.01) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld(); if (pl.root) pl.root.visible = false;
      const a = pickAim(0.1, 233), lb = bino.firstChild;
      if (a) { aimT = aim && aim.S === a.S ? aimT + dt : 0; aim = a; lb.hidden = false; const known = D.seen[a.S.id] || aimT > 0.8; const txt = known ? `${a.S.ic} ${a.S.name} · ${Math.round(a.dist)} m<small>${a.S.sci}</small>` : `❓ Đang nhận dạng…<small>giữ yên tâm ngắm</small>`; if (lb._t !== txt) lb.innerHTML = lb._t = txt;
        if (aimT > 0.8) found(a.S); ctx.offer(`📷 Chụp ảnh ${a.S.name}`, () => { shotReq = a.S; }, 8); }
      else { aim = null; aimT = 0; lb.hidden = true; ctx.offer('🔭 Cất ống nhòm', () => setBino(0), 2); }
      return;
    }
    if ((scanT -= dt) > 0) { if (N._offer) N._offer(); return; } scanT = 0.5; N._offer = null;
    const p = pl.pos; let nearFeed = null, nearShot = null, nearCnt = null, fd = 3.6, sd = 13;
    wild.each((S, x, y, z, r, G, A) => {
      const d = Math.hypot(x - p.x, z - p.z), R = 8 + Math.min(13, S.s * 2) + (y - p.y > 6 ? 21 : 0);
      if (d < R && !D.seen[S.id]) found(S);
      if (S.feed && d < fd && (!A || (!A.mom && A.st !== 'sleep'))) { fd = d; nearFeed = { S, G, A }; }
      if (d < sd && !D.photo[S.id]) { sd = d; nearShot = S; }
      if (d < 16 && G && !G.counted && !D.done.count && !A?.mom && G.S.k === 'w' && wild.groupCount(G) >= 3) nearCnt = G;
      if (A && d < 21) { if (A.st === 'sleep' && !D.obs.sleep && ++sleepSeen > 4) observe('sleep', S); if (A.mom && A.st === 'follow') observe('young', S); if (A.st === 'dust') observe('dust', S); }
      if (!A && G && d < 21) { if (G.S.k === 'p') observe('wire', S); if (G.nest && G.nestPh === 1) observe('feedchick', S); if (G.nest && G.nestPh === 0) observe('brood', S); if ((S.beh || []).includes('dust')) observe('dust', S); }
    });
    for (const s of wild.sites) if (s.tag === 'koi' && Math.hypot(s.x - p.x, s.z - p.z) < 10) found(BY.get('w-carp'));   // cá Koi trong hồ = cá chép
    if (Math.hypot(p.x - (wild.hides[0] ? wild.hides[0].x - 74 : 1e9), p.z - (wild.hides[0] ? wild.hides[0].z - 66 : 1e9)) < 16) found(BY.get('giraffe'));   // tượng hươu cao cổ ở Safari
    if (ctx.sealife && ctx.sealife.found) for (const id in ctx.sealife.found) if (ctx.sealife.found[id] && BY.has(id)) see(BY.get(id));
    const h = wild.hides.find(q => Math.hypot(q.x - p.x, q.z - p.z) < q.r);
    if (h && !hideShown) ctx.toast(`🛖 <b>${h.name}</b>: nấp ở đây thú sẽ không sợ. Bật 🔭 ống nhòm để quan sát nhé!`, 6000); hideShown = !!h;
    if (!track.on) { chip.hidden = !h; if (h) chip.textContent = '🛖 Đang nấp · thú không sợ'; }
    N._offer = () => {
      if (pl.frozen) return;
      if (nearFeed) ctx.offer(`🥕 Cho ${nearFeed.S.name.toLowerCase()} ăn`, () => { const { S, G, A } = nearFeed; wild.feed(G, A); const first = !D.fed[S.id]; D.fed[S.id] = 1; save(); found(S); ctx.toast(`🥕 ${S.ic} <b>${S.name}</b> thích ăn <b>${S.feed}</b>! ${first ? 'Từ giờ đàn này quen hơi bạn, không còn sợ nữa.' : ''}<br>Thức ăn trong tự nhiên: ${S.eat}.`, 6000); ctx.sfx && ctx.sfx('ok'); checkQuests(); nearFeed = null; }, 3);
      else if (nearCnt) ctx.offer(`🔢 Đếm đàn ${nearCnt.S.name.toLowerCase()}`, () => askCount(nearCnt), 1);
      else if (nearShot) ctx.offer(`📷 Chụp ảnh ${nearShot.name}`, () => { shotReq = nearShot; }, 0);
    };
    N._offer();
  };
  N.shoot = S => { shotReq = S; };   // chụp ảnh loài S ở khung hình kế tiếp (nút hành động gọi; tools/wild-test.mjs dùng)
  N.open = open; N.close = close; N.setBino = setBino; N.found = found; N.startTrack = startTrack; N.PHI = PHI;
  return N;
}
