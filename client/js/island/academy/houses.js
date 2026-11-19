// academy/houses.js — 4 NHÀ TỨ LINH: lễ chọn nhà ở Đại sảnh (quả cầu Tứ Linh, 5 câu hỏi tính cách), cờ nhà, ánh sáng màu nhà,
// khăn quàng + áo choàng màu nhà cho nhân vật. Lưu vào tài khoản (data/account.js: profile.house); đổi nhà được 1 lần.
// Khung cắm (index.js): create(ctx, magic, { toWorld, toLocal, L, Y }) → { build(), unbuild(), update(dt, t), api }.
// Điểm nhà: ⭐ thầy cô / mini game (ctx.reward) +8 mỗi sao, câu hỏi phép (magic.ask) +3, câu đố lối vào +5, nhiệm vụ ngày +13/21;
// điểm tính theo tuần (thứ Hai làm lại), các nhà khác = học sinh NPC mô phỏng (tới khi có máy chủ). Bảng xếp hạng = 4 đồng hồ cát pha lê ở Đại sảnh.
// Hiệu năng: Đại sảnh thêm 1 khối gộp + 4 cờ + quả cầu + cột sáng + kính + cát (instancing) + bảng điểm (chỉ hiện trong 55 m quanh sảnh); khăn + áo = 1 mesh gắn xương ngực.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { toon } from '../style.js';
import { HOUSES, HOUSE, SORT_Q, SORT_N, TASKS, PTS } from './houses-data.js';
import { HALL_HOUSE } from './plan.js';

const PHI = 1.618, NEAR = 55;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const css = `#hsCard{position:fixed;left:50%;top:calc(max(12px,env(safe-area-inset-top)) + 89px);transform:translateX(-50%);z-index:29;width:min(92vw,377px);max-height:70vh;overflow:auto;background:#141022f2;color:#f7ecd0;border:1px solid #ffe3a066;border-radius:16px;padding:13px 14px;font:600 14px/1.45 system-ui;box-shadow:0 8px 30px #0006}
#hsCard h4{margin:0 0 8px;font:800 16px system-ui;color:#ffe3a0}#hsCard .ch{display:grid;gap:6px;margin-top:8px}
#hsCard button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:10px;padding:9px 8px;font:700 14px system-ui;text-align:left}
#hsCard .ft{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}#hsCard .ft button{text-align:center}#hsCard .ok{background:#2c6455}#hsCard .no{background:#7a2e2e}
#hsCard .pg{height:5px;border-radius:3px;background:#fff2;margin:4px 0 8px;overflow:hidden}#hsCard .pg i{display:block;height:100%;background:#ffe3a0}
#hsCard .hb{display:flex;align-items:center;gap:8px}#hsCard .sw{width:21px;height:21px;border-radius:6px;flex:none}`;

/** cờ nhà (canvas 128 × 208, đuôi nhọn): dùng ở Đại sảnh và phòng sinh hoạt chung */
export function bannerTex(h) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 208; const k = c.getContext('2d');
  k.fillStyle = h.col; k.fillRect(0, 0, 128, 208); k.fillStyle = h.col2; k.fillRect(0, 0, 128, 13); k.fillRect(0, 0, 8, 208); k.fillRect(120, 0, 8, 208);
  k.beginPath(); k.moveTo(0, 178); k.lineTo(64, 208); k.lineTo(128, 178); k.lineTo(128, 208); k.lineTo(0, 208); k.fillStyle = '#00000000'; k.globalCompositeOperation = 'destination-out'; k.fill(); k.globalCompositeOperation = 'source-over';
  k.beginPath(); k.arc(64, 84, 42, 0, 6.29); k.fillStyle = h.col2; k.globalAlpha = 0.35; k.fill(); k.globalAlpha = 1;
  k.font = '64px "Noto Color Emoji",system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(h.icon, 64, 86);
  k.font = 'bold 19px system-ui'; k.fillStyle = h.col2; k.fillText(h.name.toUpperCase(), 64, 150);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function create(ctx, magic, { toWorld, toLocal, L, Y }) {
  { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
  const { player } = ctx, Hh = L.hall;
  // ---------- trạng thái: tài khoản (nếu đã đăng nhập / khách) hoặc localStorage dự phòng ----------
  const acc = () => ctx.account && ctx.account.profile ? ctx.account : null;
  const rec = () => { const a = acc(); return a ? a.profile.house || null : load('academy.house', null); };
  const houseId = () => { const r = rec(); return r && r.id || null; };
  function setHouse(id) {
    const a = acc(); if (a) return a.setHouse(id);
    const r = rec(); if (r && r.id) { if (r.id === id || (r.changes | 0) >= 1) return false; r.changes = (r.changes | 0) + 1; r.id = id; r.pts = 0; save('academy.house', r); return true; }
    save('academy.house', { id, at: Date.now(), changes: 0, pts: 0, week: 0, total: 0, daily: null }); return true;
  }
  const saveRec = r => { const a = acc(); if (a) { a.profile.house = r; a.save(); } else save('academy.house', r); };

  // ---------- điểm nhà (theo tuần, bắt đầu thứ Hai) ----------
  const WEEK = 7 * 864e5, OFF = 4 * 864e5, wk = () => Math.floor((Date.now() + OFF) / WEEK), day = () => new Date().toISOString().slice(0, 10);
  const fresh = r => { if (r.week !== wk()) { r.week = wk(); r.pts = 0; } if (!r.daily || r.daily.day !== day()) r.daily = { day: day(), ask: 0, star: 0, riddle: 0, got: {} }; return r; };
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
  function totals() {   // các bạn NPC mỗi nhà góp đều đặn theo giờ trong tuần (mô phỏng) + điểm em góp cho nhà mình
    const hrs = ((Date.now() + OFF) % WEEK) / 36e5, r = rec(), out = {};
    for (const h of HOUSES) { const k = hash(h.id + wk()); out[h.id] = Math.floor(21 + k % 55 + hrs * (2 + (k >> 8) % 3) * (0.9 + 0.1 * Math.sin(hrs * 0.3 + k))); }
    if (r && r.id && r.week === wk()) out[r.id] += r.pts | 0;
    return out;
  }
  const ranking = () => { const t = totals(); return HOUSES.map(h => ({ h, n: t[h.id] })).sort((a, b) => b.n - a.n); };
  let lastToast = 0, dirty = true;
  function addPts(p, why) {
    const r = rec(); if (!r || !r.id || !p) return; fresh(r); r.pts = (r.pts | 0) + p; r.total = (r.total | 0) + p; saveRec(r); dirty = true;
    const h = HOUSE[r.id], now = performance.now(); if (now - lastToast > 1300) { lastToast = now; setTimeout(() => ctx.toast(`${h.icon} +${p} điểm cho <b>${h.name}</b>${why ? ' · ' + why : ''}`, 2600), 1900); }
    api.rooms && api.rooms.redraw();
  }
  function event(kind, n = 1) { const r = rec(); if (!r || !r.id) return; fresh(r); r.daily[kind] = (r.daily[kind] | 0) + n; saveRec(r); addPts((PTS[kind] || 0) * n); }
  function claim(k) {
    const r = rec(); if (!r || !r.id) return; fresh(r); const T = TASKS.find(t => t[0] === k); if (!T || r.daily.got[k] || (r.daily[k] | 0) < T[2]) return;
    r.daily.got[k] = 1; saveRec(r); addPts(T[3], 'nhiệm vụ nhà'); ctx.sfx && ctx.sfx('win');
  }
  function showTasks() {
    const r = rec(); if (!r || !r.id) return ctx.toast('🔮 Em chưa có Nhà — tới Quả cầu Tứ Linh ở Đại sảnh nhé!', 3500); fresh(r);
    const h = HOUSE[r.id], R = ranking(), me = R.findIndex(x => x.h.id === r.id) + 1;
    openCard(`<h4>📋 Bảng tin ${h.name} ${h.icon}</h4><div>Điểm tuần: <b>${R[me - 1].n}</b> · hạng <b>${me}/4</b> · em góp <b>${r.pts | 0}</b></div>
      <div class="ch">${TASKS.map(([k, t, need, pts]) => { const v = Math.min(need, r.daily[k] | 0), done = !!r.daily.got[k];
        return `<button data-k="${k}" ${done || v < need ? 'disabled' : ''} class="${done ? 'ok' : ''}">${t}<br><small>${done ? '✅ Đã nhận' : v >= need ? `🎁 Bấm để nhận +${pts}` : `${v}/${need} · thưởng +${pts}`}</small></button>`; }).join('')}</div>
      <div style="font-size:12px;opacity:.75;margin-top:6px">Mỗi ⭐ thầy cô / mini game: +${PTS.star} · câu hỏi phép đúng: +${PTS.ask} · câu đố lối vào: +${PTS.riddle}. Nhiệm vụ làm mới mỗi ngày.</div>
      <div class="ft"><button data-x>Đóng</button></div>`, b => { if (b.dataset.x !== undefined) return closeCard(); if (b.dataset.k) { claim(b.dataset.k); showTasks(); } });
  }
  function showRank() {
    const R = ranking(), id = houseId(), max = R[0].n || 1;
    openCard(`<h4>⏳ Đồng hồ cát 4 Nhà — tuần này</h4>${R.map((x, i) => `<div class="hb" style="margin:6px 0"><span class="sw" style="background:${x.h.col}"></span><b style="flex:1">${['🥇', '🥈', '🥉', '4.'][i]} ${x.h.icon} ${x.h.name}${x.h.id === id ? ' (nhà em)' : ''}</b>${x.n}</div><div class="pg"><i style="width:${x.n / max * 100}%;background:${x.h.col}"></i></div>`).join('')}
      <div style="font-size:12px;opacity:.75">Điểm làm lại mỗi thứ Hai. Học, chơi mini game, giải đố để cát pha lê nhà em dâng cao!</div><div class="ft"><button data-x>Đóng</button></div>`, () => closeCard());
  }
  function boardLines(id) {
    const h = HOUSE[id], r = rec(), R = ranking(), me = R.findIndex(x => x.h.id === id) + 1; if (r && r.id === id) fresh(r);
    return [`“${h.motto}”`, `⏳ Điểm tuần: ${R[me - 1].n} · hạng ${me}/4 · em góp ${r && r.id === id ? r.pts | 0 : 0}`, 'Nhiệm vụ hôm nay:',
      ...TASKS.map(([k, t, need, pts]) => { const v = r && r.daily ? Math.min(need, r.daily[k] | 0) : 0, got = r && r.daily && r.daily.got[k]; return `${got ? '✅' : v >= need ? '🎁' : '▫️'} ${t.replace(/^\S+ /, '')} ${got ? '' : `${v}/${need} (+${pts})`}`; })];
  }
  // nối nguồn điểm: sao (teacher-quiz / mini game) và câu hỏi phép (cây đa, tranh, sinh vật, lối vào…)
  const ask0 = magic.ask; magic.ask = (q, onRight, title) => ask0(q, () => { event('ask'); onRight && onRight(); }, title);
  const hookReward = () => { if (ctx.reward && !ctx.reward.__house) { const f = ctx.reward; ctx.reward = Object.assign((n, note) => { const o = f(n, note); event('star', Math.max(1, n | 0)); return o; }, { __house: 1 }); } };

  // ---------- thẻ hỏi đáp ----------
  let card = null;
  const closeCard = () => { if (card) { card.remove(); card = null; } };
  function openCard(html, onClick) { closeCard(); card = document.createElement('div'); card.id = 'hsCard'; card.innerHTML = html; card.onclick = e => { const b = e.target.closest('button'); if (b) onClick(b); }; document.body.appendChild(card); return card; }

  // ---------- lễ chọn nhà: 5 câu ngẫu nhiên (trong 8), mỗi đáp án cộng 1 cho 1 nhà; hoà → bốc thăm trong nhóm cao nhất ----------
  let busy = false;
  function ceremony() {
    if (busy) return; busy = true;
    const qs = SORT_Q.map(q => q).sort(() => Math.random() - 0.5).slice(0, SORT_N), score = { long: 0, phung: 0, lan: 0, quy: 0 };
    let i = 0;
    const ask = () => {
      const [q, ans] = qs[i], ord = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      openCard(`<h4>🔮 Lễ chọn Nhà — câu ${i + 1}/${qs.length}</h4><div class="pg"><i style="width:${i / qs.length * 100}%"></i></div><div>${q}</div>
        <div class="ch">${ord.map(k => `<button data-h="${HOUSES[k].id}">${ans[k]}</button>`).join('')}</div><div style="opacity:.7;font-size:12px;margin-top:6px">Không có đáp án đúng hay sai — hãy chọn điều giống em nhất.</div>`,
      b => { if (!b.dataset.h) return; score[b.dataset.h]++; ctx.sfx && ctx.sfx('ui'); if (++i < qs.length) ask(); else finish(); });
    };
    const finish = () => {
      const top = Math.max(...Object.values(score)), best = Object.keys(score).filter(k => score[k] === top), id = best[Math.floor(Math.random() * best.length)];
      setHouse(id); reveal(id, true);
    };
    openCard(`<h4>🔮 Quả cầu Tứ Linh</h4><div>Quả cầu sẽ lắng nghe <b>${SORT_N} câu trả lời</b> của em để chọn Nhà hợp nhất:<br>
      ${HOUSES.map(h => `${h.icon} <b>${h.name}</b> (${h.elem}) — ${h.trait}`).join('<br>')}</div><div class="ft"><button data-x>Để sau</button><button class="ok" data-go>✨ Bắt đầu</button></div>`,
    b => { if (b.dataset.x !== undefined) { closeCard(); busy = false; } else if (b.dataset.go !== undefined) ask(); });
  }
  function changeHouse() {
    const cur = houseId(); if (!cur) return ceremony();
    openCard(`<h4>🔁 Đổi nhà (chỉ 1 lần)</h4><div>Em đang ở ${HOUSE[cur].icon} <b>${HOUSE[cur].name}</b>. Đổi xong sẽ <b>không đổi lại được nữa</b>, điểm tuần em góp sẽ tính lại từ đầu.</div>
      <div class="ch">${HOUSES.filter(h => h.id !== cur).map(h => `<button data-h="${h.id}" class="hb"><span class="sw" style="background:${h.col}"></span>${h.icon} ${h.name} — ${h.trait}</button>`).join('')}</div><div class="ft"><button data-x>Thôi</button></div>`,
    b => { if (b.dataset.x !== undefined) return closeCard(); if (b.dataset.h && setHouse(b.dataset.h)) reveal(b.dataset.h, false); });
  }

  // ---------- Đại sảnh: bệ + quả cầu, 4 cờ nhà (cuộn → rủ xuống), cột sáng + vầng sáng màu nhà ----------
  let g = null, orb = null, banners = [], beam = null, wash = null, fx = 0, fxCol = new THREE.Color(), glassM = null, sand = null, plaque = null, plaqueC = null, tRank = 0;
  const [ou, ov] = HALL_HOUSE.orb;
  function build() {
    if (g) return;
    const [cx, cz] = toWorld(0, 0); g = new THREE.Group(); g.name = 'academy-houses-hall'; g.position.set(cx, 0, cz);   // x = v, z = u
    const b = new Batch(), wood = '#6e4a30', stone = '#9a9286', gold = '#d4a24a';
    b.cyl(ov, Y, ou, 0.62, 0.34, stone, 8, 0.55); b.cyl(ov, Y + 0.34, ou, 0.3, 0.8, stone, 8, 0.24); b.cyl(ov, Y + 1.14, ou, 0.42, 0.12, gold, 8);   // bệ cầu
    const bu = Hh.u0 + 1.75, top = Y + 13;
    for (const v of HALL_HOUSE.banner) { b.cyl(v, top, bu, 0.07, 0.07, gold, 6); b.add(new THREE.CylinderGeometry(0.06, 0.06, 3.9, 6), wood, v, top + 0.1, bu, 0, 0, Math.PI / 2); for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.11, 6, 4), gold, v + s * 1.95, top + 0.1, bu); }
    // 4 đồng hồ cát pha lê: khung gỗ + kính (lathe) + cát màu nhà (instancing 8: bầu dưới = điểm, bầu trên = phần còn lại)
    const prof = [[0.5, 0], [0.52, 0.1], [0.52, 1.05], [0.12, 1.62], [0.12, 1.78], [0.52, 2.35], [0.52, 3.3], [0.5, 3.4]].map(([r, y]) => new THREE.Vector2(r, y));
    const gl = new Batch();
    for (const [u, v] of HALL_HOUSE.glass) {
      b.cyl(v, Y, u, 0.72, 0.21, wood, 8); b.cyl(v, Y + 3.61, u, 0.72, 0.21, wood, 8); b.cyl(v, Y + 3.82, u, 0.21, 0.21, gold, 8);
      for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + 0.5; b.cyl(v + Math.cos(a) * 0.62, Y + 0.21, u + Math.sin(a) * 0.62, 0.05, 3.4, gold, 5); }
      gl.add(new THREE.LatheGeometry(prof, 13), '#cfefff', v, Y + 0.21, u);
    }
    glassM = new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.28, depthWrite: false })); g.add(glassM);
    sand = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.43, 0.43, 1, 13).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 8);
    HOUSES.forEach((h, i) => { const c = new THREE.Color(h.col).lerp(new THREE.Color(h.col2), 0.25); sand.setColorAt(i * 2, c); sand.setColorAt(i * 2 + 1, c); }); g.add(sand);
    plaqueC = document.createElement('canvas'); plaqueC.width = 512; plaqueC.height = 128; plaque = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(plaqueC), depthWrite: false }));
    plaque.scale.set(6.5, 1.62, 1); plaque.position.set(0, Y + 5.2, Hh.u0 + 2.2); g.add(plaque); dirty = true;
    const m = new THREE.Mesh(b.build(), toon('#ffffff', { vertexColors: true })); m.castShadow = true; g.add(m);
    orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' })); orb.position.set(ov, Y + 1.72, ou); g.add(orb);
    const bg = new THREE.PlaneGeometry(3.4, 5.5).translate(0, -2.75, 0);
    banners = HOUSES.map((h, i) => { const o = new THREE.Mesh(bg, new THREE.MeshToonMaterial({ map: bannerTex(h), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })); o.position.set(HALL_HOUSE.banner[i], top, bu + 0.08); o.scale.y = 0.04; o.userData.k = 0.04; g.add(o); return o; });
    beam = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.1, 21, 13, 1, true).translate(0, 10.5, 0), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    wash = new THREE.Mesh(new THREE.BoxGeometry(Hh.v1 - Hh.v0 - 3.4, Hh.h - 0.4, Hh.u1 - Hh.u0 - 3.4), beam.material.clone()); wash.position.set(0, Y + Hh.h / 2, (Hh.u0 + Hh.u1) / 2); wash.material.side = THREE.BackSide;
    beam.visible = wash.visible = false; g.add(beam, wash);
    ctx.scene.add(g);
  }
  function unbuild() { if (!g) return; ctx.scene.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); g = null; banners = []; }

  function reveal(id, first) {
    const h = HOUSE[id]; busy = false; fx = 5; fxCol.set(h.col); wear();
    banners.forEach((o, i) => { o.userData.t = HOUSES[i].id === id ? 0 : 1.3; });
    if (beam) { const [x, z] = [player.pos.x - g.position.x, player.pos.z - g.position.z]; beam.position.set(x, Y, z); beam.material.color.copy(fxCol); wash.material.color.copy(fxCol); }
    const P = player.pos.clone(); P.y += 1.2;
    magic.burst && magic.burst(P, new THREE.Vector3(0, 1, 0), h.col, 55, 5, 1); setTimeout(() => magic.burst && magic.burst(P, new THREE.Vector3(0, 1, 0), h.col2, 34, 4, 1), 610);
    ctx.sfx && ctx.sfx('win'); player.emote && player.emote('cheer');
    openCard(`<h4>${h.icon} ${first ? 'Chúc mừng! Em thuộc' : 'Em đã chuyển sang'} ${h.name}!</h4><div class="hb"><span class="sw" style="background:${h.col}"></span><span class="sw" style="background:${h.col2}"></span>Linh vật <b>${h.beast}</b> · nguyên tố <b>${h.elem}</b> ${h.elIcon}</div>
      <div style="margin-top:6px">Phẩm chất: <b>${h.trait}</b>. <i>“${h.motto}”</i></div><div style="margin-top:6px">🏠 Lối vào phòng sinh hoạt chung: <b>${h.door}</b> ở một góc sân lâu đài. Làm nhiệm vụ học tập, mini game, câu đố để <b>cộng điểm cho nhà</b>!</div>
      <div style="margin-top:6px;opacity:.75;font-size:12px">Em được đổi nhà <b>1 lần</b> tại quả cầu này.</div><div class="ft"><button class="ok" data-x>Tuyệt!</button></div>`, () => closeCard());
  }

  // ---------- khăn quàng + áo choàng màu nhà (1 mesh, gắn vào xương ngực) ----------
  let wearMesh = null, wearFor = null;
  const capeKey = () => (ctx.wear && ctx.wear.eq && ctx.wear.eq.cape) ? '|' + ctx.wear.eq.cape : '';   // sau ghép: đã mặc áo choàng mua ở Phố Phép Thuật (wear.js) → chỉ quàng khăn nhà
  function wear() {
    if (wearMesh) { wearMesh.removeFromParent(); wearMesh.geometry.dispose(); wearMesh = null; }
    const id = houseId(), hero = player.hero; wearFor = null; if (!id || !hero) return; wearFor = id + capeKey();
    const h = HOUSE[id], root = player.root, head = hero.model.getObjectByName('head'), chest = hero.model.getObjectByName('chest') || hero.model.getObjectByName('torso');
    root.updateMatrixWorld(true);
    const hy = head ? head.getWorldPosition(new THREE.Vector3()).y - root.position.y : 1.3, H0 = hy;   // gốc đầu ≈ cổ
    const b = new Batch();
    b.add(new THREE.TorusGeometry(H0 * 0.105, H0 * 0.04, 6, 13), h.col, 0, H0 - H0 * 0.03, 0, 0, Math.PI / 2);          // khăn quàng cổ
    for (let k = 0; k < 3; k++) b.box(0.05, 0.13, H0 - 0.1 - k * 0.09, H0 - 0.02 - k * 0.09, H0 * 0.09, H0 * 0.13, k % 2 ? h.col2 : h.col);   // đuôi khăn sọc 2 màu
    const cw = H0 * 0.34, cl = H0 * 0.52, cape = new THREE.PlaneGeometry(cw, cl, 1, 5).translate(0, -cl / 2, 0);        // áo choàng: rộng dần, cong theo lưng
    const pa = cape.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), t = -y / cl; pa.setX(i, pa.getX(i) * (1 + t * 0.34)); pa.setZ(i, -t * t * 0.1); }
    cape.computeVertexNormals(); if (!capeKey()) { b.add(cape, h.col, 0, H0 - H0 * 0.06, -H0 * 0.13);
    b.box(-cw / 2 - 0.01, cw / 2 + 0.01, H0 - H0 * 0.07, H0 - H0 * 0.03, -H0 * 0.15, -H0 * 0.11, h.col2); }                 // viền cổ áo
    wearMesh = new THREE.Mesh(b.build(), new THREE.MeshToonMaterial({ vertexColors: true, side: THREE.DoubleSide })); wearMesh.name = 'house-wear'; wearMesh.castShadow = true; wearMesh.frustumCulled = false;
    root.add(wearMesh); root.updateMatrixWorld(true); if (chest) chest.attach(wearMesh);
  }

  const _o = new THREE.Object3D();
  function drawRank() {
    const t = totals(), R = ranking(), max = Math.max(89, R[0].n * 1.13);
    HOUSES.forEach((h, i) => {
      const [u, v] = HALL_HOUSE.glass[i], k = Math.min(1, t[h.id] / max);
      _o.position.set(v, Y + 0.31, u); _o.scale.set(1, 0.02 + 0.95 * k, 1); _o.updateMatrix(); sand.setMatrixAt(i * 2, _o.matrix);                  // cát đã rơi = điểm
      _o.position.set(v, Y + 0.21 + 2.35, u); _o.scale.set(1, 0.02 + 0.93 * (1 - k), 1); _o.updateMatrix(); sand.setMatrixAt(i * 2 + 1, _o.matrix);   // cát còn ở bầu trên
    });
    sand.instanceMatrix.needsUpdate = true;
    const k = plaqueC.getContext('2d'); k.clearRect(0, 0, 512, 128); k.fillStyle = 'rgba(20,16,34,.86)'; k.beginPath(); k.roundRect(4, 4, 504, 120, 21); k.fill();
    k.font = 'bold 21px system-ui'; k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.fillText('⏳ ĐIỂM 4 NHÀ TUẦN NÀY', 256, 30);
    R.forEach((x, i) => { const cx = 64 + i * 128; k.fillStyle = x.h.col; k.beginPath(); k.roundRect(cx - 58, 44, 116, 74, 13); k.fill(); k.fillStyle = '#fff'; k.font = 'bold 17px system-ui'; k.fillText(`${['🥇', '🥈', '🥉', '4'][i]} ${x.h.name.replace('Nhà ', '')}`, cx, 70); k.font = 'bold 26px system-ui'; k.fillText(x.n, cx, 104); });
    plaque.material.map.needsUpdate = true;
  }

  // ---------- mỗi khung ----------
  let hallHi = false;
  function update(dt, t) {
    if (wearFor !== (houseId() ? houseId() + capeKey() : null)) wear();
    hookReward();
    if (wearMesh) wearMesh.visible = !player.vehicle;
    if (!g) return;
    const [hx, hz] = toWorld((Hh.u0 + Hh.u1) / 2, 0), near = Math.hypot(player.pos.x - hx, player.pos.z - hz) < NEAR; g.visible = near;
    if (!near) return;
    const id = houseId();
    // quả cầu: chưa có nhà → đổi màu qua 4 nhà; có nhà → màu nhà mình
    if (id) orb.material.color.set(HOUSE[id].col).lerp(new THREE.Color(HOUSE[id].col2), 0.5 + 0.5 * Math.sin(t * 2)); else orb.material.color.set(HOUSES[Math.floor(t / 1.3) % 4].col);
    orb.rotation.y = t * 0.6; orb.position.y = Y + 1.72 + Math.sin(t * 1.6) * 0.06;
    if ((tRank -= dt) <= 0 || dirty) { tRank = 3; dirty = false; drawRank(); }
    for (const o of banners) { const want = id ? 1 : 0.04; if (o.userData.t > 0) o.userData.t -= dt; else o.userData.k += (want - o.userData.k) * Math.min(1, dt * 1.6); o.scale.y = o.userData.k; o.rotation.x = Math.sin(t * 1.3 + o.position.x) * 0.03; }
    if (fx > 0) { fx -= dt; const a = Math.min(1, fx / 1.3) * Math.min(1, (5 - fx) * 2); beam.visible = wash.visible = fx > 0; beam.material.opacity = 0.55 * a; wash.material.opacity = 0.21 * a; beam.rotation.y += dt; }
    // gợi ý ở quả cầu
    if (ctx.player.vehicle || card) return;
    const [qu, qv] = toLocal(player.pos.x, player.pos.z), d = Math.hypot(qu - ou, qv - ov);
    const inHall = qu > Hh.u0 && qu < Hh.u1 + 3 && Math.abs(qv) < Hh.v1 && player.pos.y < Y + 3;
    if (inHall && !id && magic.hasWand && !hallHi) { hallHi = true; ctx.toast('🔮 Hãy tới <b>Quả cầu Tứ Linh</b> trước bục thầy cô để được chọn <b>Nhà</b> của em!', 5000); }
    if (d < 3.4 && player.pos.y < Y + 3) {
      const r = rec();
      if (!id) ctx.offer('🔮 Lễ chọn Nhà (Quả cầu Tứ Linh)', ceremony, 10);
      else if ((r.changes | 0) < 1) ctx.offer(`🔁 Đổi nhà (còn 1 lần) · ${HOUSE[id].icon}`, changeHouse, 7);
    }
    if (player.pos.y < Y + 3 && HALL_HOUSE.glass.some(([u, v]) => Math.hypot(qu - u, qv - v) < 2.6)) ctx.offer('⏳ Bảng điểm 4 Nhà', showRank, 8);
  }
  const api = { houseId, addPoints: (n, why) => addPts(n | 0, why), rec, saveRec, openCard, closeCard, get card() { return card; }, ceremony, event, totals, ranking, showTasks, showRank, boardLines };
  ctx.houses = api;
  return { build, unbuild, update, api };
}
