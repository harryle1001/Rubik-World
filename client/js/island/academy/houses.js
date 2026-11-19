// academy/houses.js — 4 NHÀ TỨ LINH: lễ chọn nhà ở Đại sảnh (quả cầu Tứ Linh, 5 câu hỏi tính cách), cờ nhà, ánh sáng màu nhà,
// khăn quàng + áo choàng màu nhà cho nhân vật. Lưu vào tài khoản (data/account.js: profile.house); đổi nhà được 1 lần.
// Khung cắm (index.js): create(ctx, magic, { toWorld, toLocal, L, Y }) → { build(), unbuild(), update(dt, t), api }.
// Hiệu năng: Đại sảnh thêm 1 khối gộp + 4 cờ + quả cầu + cột sáng (chỉ hiện trong 55 m quanh sảnh); khăn + áo = 1 mesh gắn xương ngực.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { toon } from '../style.js';
import { HOUSES, HOUSE, SORT_Q, SORT_N } from './houses-data.js';
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
  let g = null, orb = null, banners = [], beam = null, wash = null, fx = 0, fxCol = new THREE.Color();
  const [ou, ov] = HALL_HOUSE.orb;
  function build() {
    if (g) return;
    const [cx, cz] = toWorld(0, 0); g = new THREE.Group(); g.name = 'academy-houses-hall'; g.position.set(cx, 0, cz);   // x = v, z = u
    const b = new Batch(), wood = '#6e4a30', stone = '#9a9286', gold = '#d4a24a';
    b.cyl(ov, Y, ou, 0.62, 0.34, stone, 8, 0.55); b.cyl(ov, Y + 0.34, ou, 0.3, 0.8, stone, 8, 0.24); b.cyl(ov, Y + 1.14, ou, 0.42, 0.12, gold, 8);   // bệ cầu
    const bu = Hh.u0 + 1.75, top = Y + 13;
    for (const v of HALL_HOUSE.banner) { b.cyl(v, top, bu, 0.07, 0.07, gold, 6); b.add(new THREE.CylinderGeometry(0.06, 0.06, 3.9, 6), wood, v, top + 0.1, bu, 0, 0, Math.PI / 2); for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.11, 6, 4), gold, v + s * 1.95, top + 0.1, bu); }
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
  function wear() {
    if (wearMesh) { wearMesh.removeFromParent(); wearMesh.geometry.dispose(); wearMesh = null; }
    const id = houseId(), hero = player.hero; wearFor = null; if (!id || !hero) return; wearFor = id;
    const h = HOUSE[id], root = player.root, head = hero.model.getObjectByName('head'), chest = hero.model.getObjectByName('chest') || hero.model.getObjectByName('torso');
    root.updateMatrixWorld(true);
    const hy = head ? head.getWorldPosition(new THREE.Vector3()).y - root.position.y : 1.3, H0 = hy;   // gốc đầu ≈ cổ
    const b = new Batch();
    b.add(new THREE.TorusGeometry(H0 * 0.105, H0 * 0.04, 6, 13), h.col, 0, H0 - H0 * 0.03, 0, 0, Math.PI / 2);          // khăn quàng cổ
    for (let k = 0; k < 3; k++) b.box(0.05, 0.13, H0 - 0.1 - k * 0.09, H0 - 0.02 - k * 0.09, H0 * 0.09, H0 * 0.13, k % 2 ? h.col2 : h.col);   // đuôi khăn sọc 2 màu
    const cw = H0 * 0.34, cl = H0 * 0.52, cape = new THREE.PlaneGeometry(cw, cl, 1, 5).translate(0, -cl / 2, 0);        // áo choàng: rộng dần, cong theo lưng
    const pa = cape.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), t = -y / cl; pa.setX(i, pa.getX(i) * (1 + t * 0.34)); pa.setZ(i, -t * t * 0.1); }
    cape.computeVertexNormals(); b.add(cape, h.col, 0, H0 - H0 * 0.06, -H0 * 0.13);
    b.box(-cw / 2 - 0.01, cw / 2 + 0.01, H0 - H0 * 0.07, H0 - H0 * 0.03, -H0 * 0.15, -H0 * 0.11, h.col2);                 // viền cổ áo
    wearMesh = new THREE.Mesh(b.build(), new THREE.MeshToonMaterial({ vertexColors: true, side: THREE.DoubleSide })); wearMesh.name = 'house-wear'; wearMesh.castShadow = true; wearMesh.frustumCulled = false;
    root.add(wearMesh); root.updateMatrixWorld(true); if (chest) chest.attach(wearMesh);
  }

  // ---------- mỗi khung ----------
  let hallHi = false;
  function update(dt, t) {
    if (wearFor !== houseId()) wear();
    if (wearMesh) wearMesh.visible = !player.vehicle;
    if (!g) return;
    const [hx, hz] = toWorld((Hh.u0 + Hh.u1) / 2, 0), near = Math.hypot(player.pos.x - hx, player.pos.z - hz) < NEAR; g.visible = near;
    if (!near) return;
    const id = houseId();
    // quả cầu: chưa có nhà → đổi màu qua 4 nhà; có nhà → màu nhà mình
    if (id) orb.material.color.set(HOUSE[id].col).lerp(new THREE.Color(HOUSE[id].col2), 0.5 + 0.5 * Math.sin(t * 2)); else orb.material.color.set(HOUSES[Math.floor(t / 1.3) % 4].col);
    orb.rotation.y = t * 0.6; orb.position.y = Y + 1.72 + Math.sin(t * 1.6) * 0.06;
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
  }
  const api = { houseId, rec, saveRec, openCard, closeCard, get card() { return card; }, ceremony };
  ctx.houses = api;
  return { build, unbuild, update, api };
}
