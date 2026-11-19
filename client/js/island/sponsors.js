// sponsors.js — NHÀ TÀI TRỢ đặt thương hiệu TINH TẾ trong thế giới (an toàn trẻ em: Luật Quảng cáo, Luật Trẻ em VN).
// • 13 vị trí (Fibonacci) cố định: biển gỗ, bảng tên toà nhà, cờ, bảng ga, vạch xuất phát, quầy trên tàu, khinh khí cầu, bảng nhiệm vụ.
// • KHÔNG chen ngang / video / pop-up: chỉ hiện khi em tự lại gần và bấm E. Luôn có nhãn "Nhà tài trợ". Liên kết ra ngoài chỉ sau cổng phụ huynh.
// • Không thu thập dữ liệu trẻ: chỉ đếm gộp ẩn danh (hiển thị ≥ 1 s, ghé, làm nhiệm vụ) theo vị trí, không id người chơi.
// • Hiệu năng: 1 atlas canvas dùng chung (ô 512 × 320 ≈ φ) · khung gỗ gộp 1 lưới + biển gộp 1 lưới + quầy trên tàu = 3 draw call.
// • Cấu hình: /api/sp/config (server, /admin) → không có server thì đọc file tĩnh sponsors/config.json (link artifact).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Batch } from './academy/geo.js';
import { matV } from './sample/palette.js';
import { SPAWN, to3, blocked } from './layout.js';
import { R as MAP_R } from './data/map.js';
import { toWorld as acW } from './academy/plan.js';
import { vc, hw } from './academy/alley.js';
import { PITCH } from './academy/pitch.js';
import { at as railAt, S_A } from './train/route.js';
import { CARS, FLOOR } from './train/consist.js';

const CW = 512, CH = 320, COLS = 4;                     // ô atlas 512 × 320 (≈ φ), 4 × 4 ô = 2048 × 1280
const WOOD = '#8a5a36', WOOD_D = '#5e3d26', STONE = '#b9ad98', GOLD = '#d4a24a';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const roomFront = (k, du = 0, dz = 0) => { const r = MAP_R[k], [x, z] = to3(r.x + r.w / 2, r.y + r.h); return [x + du, z + dz]; };

// kind: board · quest · plate · flag · banner · hang · balloon · counter — w×h: kích thước biển (m), y0: mép dưới biển
const KIND = { board: [2.6, 1.6, 1.2], quest: [2.1, 1.3, 1.1], plate: [2.1, 1.3, 0.34], flag: [2.1, 1.3, 4.6], banner: [4.2, 1.0, 3.4], hang: [1.3, 0.8, 2.1], balloon: [3.4, 2.1, 0], counter: [0.9, 0.55, 1.3] };
// vị trí: hàm trả [x, z, ry] (ry: hướng mặt biển, 0 = nhìn +z); y lấy theo mặt đất (ctx.terrain.heightAt) + dy
const PLACE = {
  'plaza-board':   () => [SPAWN[0] - 13, SPAWN[1] + 13, Math.PI * 0.75],
  'plaza-balloon': () => [SPAWN[0] - 21, SPAWN[1] - 21, Math.PI / 4],
  'quest-board':   () => [SPAWN[0] - 3, SPAWN[1] - 13, Math.PI * 0.18],
  'town-plaza':    () => { const [x, z] = roomFront('plaza', -13, -3); return [x, z, 0]; },
  'library-plate': () => { const [x, z] = roomFront('library', -8.5, 2.1); return [x, z, 0]; },
  'stadium-flag-a':() => { const [x, z] = roomFront('stadium', -8, 2.6); return [x, z, 0]; },
  'stadium-flag-b':() => { const [x, z] = roomFront('stadium', 8, 2.6); return [x, z, 0]; },
  'broom-start':   () => [SPAWN[0] - 21, SPAWN[1], Math.PI / 2],   // cổng xuất phát bay chổi trên quảng trường, quay về cổng trường
  'station-board': () => { const a = railAt(S_A + 13), L = -5.9; return [a.x - a.tz * L, a.z + a.tx * L, Math.atan2(-a.tz, a.tx)]; },   // trên sân ga đi, quay ra đường ray
  'alley-plaza':   () => { const u = -14 + 3.4, [x, z] = acW(u, vc(u) - hw(u) + 0.6); return [x, z, Math.PI / 2]; },
  'alley-gate':    () => { const u = 26, [x, z] = acW(u, vc(u) + hw(u) - 0.4); return [x, z, -Math.PI / 2]; },
  'pitch-flag':    () => { const [x, z] = acW(PITCH.u, 140); return [x, z, Math.PI / 2]; },   // mép cao nguyên, nhìn ra sân Săn Cầu Vàng (sân bay trên hồ)
};
const HOUSE = { name: 'Đảo Rubik', msg: 'Mỗi ngày học một điều mới!', color: '#2c8f82' };   // chưa có nhà tài trợ: lời nhắn của đảo

export function createSponsors(ctx) {
  const { scene } = ctx, H = (x, z) => Math.max(ctx.terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99);
  const st = { cfg: null, slots: [], night: false, open: null };
  const cvs = document.createElement('canvas'); cvs.width = CW * COLS; cvs.height = CH * 4; const g = cvs.getContext('2d');
  const tex = new THREE.CanvasTexture(cvs); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const pMat = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0, side: THREE.DoubleSide });
  const logos = new Map();   // url → Image (đã tải)
  const loadImg = url => url ? logos.get(url) || (logos.set(url, new Promise(r => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => r(im); im.onerror = () => r(null); im.src = url; })), logos.get(url)) : Promise.resolve(null);

  // ---------- vẽ 1 ô atlas: nền giấy da, viền màu nhà tài trợ, logo trái (cao 1/φ ô), tên + câu thông điệp, nhãn "Nhà tài trợ" ----------
  async function paint(i, slot) {
    const sp = slot.sp, s = sp || HOUSE, [w, h] = KIND[slot.kind], lw = CW, lh = Math.round(CW * h / w), night = st.night;
    const im = sp ? await loadImg(night && sp.logoNight || sp.logo) : null, cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH;
    g.save(); g.translate(cx, cy); g.scale(1, CH / lh); g.clearRect(0, 0, lw, lh);
    g.fillStyle = night ? '#35291f' : '#f7edd8'; g.fillRect(0, 0, lw, lh);
    g.strokeStyle = s.color || GOLD; g.lineWidth = 13; g.strokeRect(6.5, 6.5, lw - 13, lh - 13);
    const ink = night ? '#fff3dc' : '#3a2a1a', pad = 21, top = slot.kind === 'quest' || slot.kind === 'plate' ? 55 : sp ? 34 : 21;
    if (sp) { g.font = '700 16px system-ui'; const t = 'Nhà tài trợ', tw = g.measureText(t).width + 21; g.fillStyle = night ? '#d4a24a' : '#3a2a1a'; g.beginPath(); g.roundRect(lw - tw - 16, 16, tw, 24, 12); g.fill(); g.fillStyle = night ? '#2a1d12' : '#fff'; g.textBaseline = 'middle'; g.fillText(t, lw - tw - 5.5, 28.5); }
    if (slot.kind === 'quest' || slot.kind === 'plate') { g.fillStyle = ink; g.font = '800 26px system-ui'; g.textBaseline = 'top'; g.fillText(slot.kind === 'quest' ? '❓ Nhiệm vụ tài trợ' : 'Thư viện Tri Thức', pad, 21); }
    const box = Math.min(lh - top - pad, lw * 0.3), tx = im ? pad + box + 21 : pad, avail = lw - tx - pad - 5;
    if (im) { const k = Math.min(box / im.width, box / im.height); g.drawImage(im, pad + (box - im.width * k) / 2, top + (lh - top - pad - im.height * k) / 2, im.width * k, im.height * k); }
    const wrap = (t, px, wt, max) => { g.font = `${wt} ${px}px system-ui`; const L = []; let cur = ''; for (const w of String(t).split(' ')) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > avail && cur) { L.push(cur); cur = w; } else cur = n; } L.push(cur); return L.slice(0, max); };
    const name = slot.kind === 'plate' && sp ? 'tài trợ bởi ' + s.name : s.name, big = slot.kind === 'banner' ? 55 : 40, n1 = wrap(name, big, 800, 2), n2 = s.msg && lh > 160 ? wrap(s.msg, 26, 600, 2) : [];
    const lhN = big * 1.15, lhM = 26 * 1.3, tot = n1.length * lhN + (n2.length ? 8 + n2.length * lhM : 0); let y = top + (lh - top - pad - tot) / 2 + big * 0.9;
    g.fillStyle = ink; g.textBaseline = 'alphabetic'; g.font = `800 ${big}px system-ui`; for (const l of n1) { g.fillText(l, tx, y); y += lhN; }
    if (n2.length) { y += 8 - lhN + lhM; g.font = '600 26px system-ui'; g.globalAlpha = 0.8; for (const l of n2) { g.fillText(l, tx, y); y += lhM; } g.globalAlpha = 1; }
    g.restore(); tex.needsUpdate = true;
  }
  const repaint = () => Promise.all(st.slots.map((s, i) => paint(i, s)));

  // ---------- khung gỗ/đá theo kiểu biển (toạ độ cục bộ: mặt biển nhìn +z, gốc ở mặt đất) ----------
  function frame(b, kind, w, h, y0, col) {
    const y1 = y0 + h, post = (x, top) => b.box(x - 0.07, x + 0.07, 0, top, -0.07, 0.07, WOOD_D);
    b.box(-w / 2 - 0.08, w / 2 + 0.08, y0 - 0.08, y1 + 0.08, -0.09, -0.03, WOOD);   // ván lưng + viền
    for (const [a, c] of [[y0 - 0.08, y0], [y1, y1 + 0.08]]) b.box(-w / 2 - 0.08, w / 2 + 0.08, a, c, -0.03, 0.04, WOOD_D);
    for (const s of [-1, 1]) b.box(s * (w / 2 + 0.04) - 0.04, s * (w / 2 + 0.04) + 0.04, y0 - 0.08, y1 + 0.08, -0.03, 0.04, WOOD_D);
    if (kind === 'board' || kind === 'quest') { post(-w / 2 + 0.2, y1 + 0.3); post(w / 2 - 0.2, y1 + 0.3); b.gable(-w / 2 - 0.3, w / 2 + 0.3, -0.34, 0.34, y1 + 0.2, 0.42, col); if (kind === 'quest') b.add(new THREE.OctahedronGeometry(0.21, 0), GOLD, 0, y1 + 0.85, 0); }
    else if (kind === 'plate') b.box(-w / 2 - 0.21, w / 2 + 0.21, 0, y0, -0.34, 0.21, STONE);
    else if (kind === 'flag') { b.cyl(-w / 2 - 0.1, 0, 0, 0.06, y1 + 0.5, '#e8e2d4', 8); b.box(-w / 2 - 0.1, w / 2, y1 + 0.05, y1 + 0.12, -0.04, 0.04, '#e8e2d4'); b.add(new THREE.SphereGeometry(0.11, 8, 6), GOLD, -w / 2 - 0.1, y1 + 0.55, 0); b.box(-w / 2 - 0.5, -w / 2 + 0.3, 0, 0.21, -0.4, 0.4, STONE); }
    else if (kind === 'banner') { for (const s of [-1, 1]) { b.cyl(s * (w / 2 + 0.15), 0, 0, 0.13, y1 + 0.3, WOOD_D, 8); b.cone(s * (w / 2 + 0.15), y1 + 0.3, 0, 0.21, 0.34, col, 8); } b.box(-w / 2 - 1.3, w / 2 + 1.3, 0.01, 0.05, -0.3, 0.3, '#f5f1e6'); for (let k = -3; k <= 3; k++) b.box(k * 0.82 - 0.2, k * 0.82 + 0.2, 0.05, 0.06, -0.3, 0, '#2c2620'); }
    else if (kind === 'hang') { post(-w / 2 - 0.25, y1 + 0.55); b.box(-w / 2 - 0.3, w / 2 + 0.1, y1 + 0.4, y1 + 0.5, -0.04, 0.04, WOOD_D); for (const s of [-1, 1]) b.box(s * w / 2.6 - 0.015, s * w / 2.6 + 0.015, y1 + 0.08, y1 + 0.4, -0.015, 0.015, '#3a3a3a'); }
    else if (kind === 'counter') b.box(-w / 2 - 0.05, w / 2 + 0.05, y0 - 0.12, y0 - 0.06, -0.06, 0.14, WOOD);
  }
  function balloon(b, col) {   // khinh khí cầu neo (lathe 13 cạnh), giỏ mây, dây neo xuống cọc
    const pts = []; for (let k = 0; k <= 13; k++) { const t = k / 13, a = t * Math.PI; pts.push(new THREE.Vector2(Math.max(0.5, Math.sin(a) * 3.4 * (t < 0.5 ? 1 : 1 - (t - 0.5) * 0.3)), -Math.cos(a) * 4.2)); }
    const Y = 21; b.add(new THREE.LatheGeometry(pts, 13), col, 0, Y, 0); b.add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p.x * 1.004, p.y)), 13, 0.24, 0.24), '#fff3dc', 0, Y, 0, 0.3);
    b.box(-0.6, 0.6, Y - 6.2, Y - 5.4, -0.6, 0.6, '#a8744a'); for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) b.box(x - 0.02, x + 0.02, Y - 5.4, Y - 4.1, z - 0.02, z + 0.02, '#4a3a2a');
    b.box(-0.02, 0.02, 0, Y - 6.2, -0.02, 0.02, '#d8d2c4'); b.cyl(0, 0, 0, 0.3, 0.4, WOOD_D, 6);
  }

  // ---------- dựng: khung gộp 1 lưới, biển gộp 1 lưới, quầy trên tàu 1 lưới gắn vào toa cuối ----------
  let frameM = null, panelM = null, counterM = null;
  function build() {
    for (const m of [frameM, panelM, counterM]) if (m) { m.parent && m.parent.remove(m); m.geometry.dispose(); }
    const fr = [], pn = [], mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    st.slots.forEach((s, i) => {
      const [w, h, y0] = KIND[s.kind], col = (s.sp && s.sp.color) || HOUSE.color, uv = [(i % COLS) / COLS, 1 - (Math.floor(i / COLS) + 1) / 4, 1 / COLS, 1 / 4];
      const plane = (pw, ph, px, py, pz, ry = 0) => { const p = new THREE.PlaneGeometry(pw, ph), a = p.attributes.uv; for (let k = 0; k < a.count; k++) a.setXY(k, uv[0] + a.getX(k) * uv[2], uv[1] + a.getY(k) * uv[3]); p.rotateY(ry); p.translate(px, py, pz); return p; };
      const b = new Batch(), local = [];
      if (s.kind === 'balloon') { balloon(b, col); for (const a of [0, Math.PI]) local.push(plane(w, h, Math.sin(a) * 3.85, 21, Math.cos(a) * 3.85, a)); }
      else { frame(b, s.kind, w, h, y0, col); local.push(plane(w, h, 0, y0 + h / 2, 0.045)); }
      if (s.kind === 'counter') { s.local = { local }; return; }
      const [x, z, ry] = s.place, y = H(x, z) + (s.dy || 0); mtx.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, ry), new THREE.Vector3(1, 1, 1));
      const fg = b.build(); fg.applyMatrix4(mtx); fr.push(fg); for (const p of local) { p.applyMatrix4(mtx); pn.push(p); }
      s.y = y; s.c = new THREE.Vector3(0, s.kind === 'balloon' ? 21 : y0 + h / 2, s.kind === 'balloon' ? 3.85 : 0.05).applyMatrix4(mtx); s.n = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)); s.ip = s.kind === 'balloon' ? new THREE.Vector3(x, y, z) : s.c;
    });
    frameM = new THREE.Mesh(mergeGeometries(fr), matV()); frameM.receiveShadow = true;   // không đổ bóng: giữ đúng +3 draw call (khung · biển · quầy trên tàu) frameM.name = 'sponsors-frames';
    panelM = new THREE.Mesh(mergeGeometries(pn), pMat); panelM.receiveShadow = true; panelM.name = 'sponsors-panels';
    scene.add(frameM, panelM);
    // quầy quà vặt trên Tàu Pha Lê: biển nhỏ trên vách cuối toa cuối (đi theo tàu)
    const cs = st.slots.find(s => s.kind === 'counter'), car = ctx.train && ctx.train.consist && ctx.train.consist.cars[CARS.length - 1];
    if (cs && car) { counterM = new THREE.Mesh(cs.local.local[0], pMat); counterM.position.set(0, FLOOR - 0.3, -3.93); counterM.name = 'sponsors-counter'; car.o.add(counterM); cs.car = car; }
  }

  // ---------- nạp cấu hình: server (/api/sp/config) → tĩnh (sponsors/config.json) ----------
  async function load() {
    const get = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject(r.status));
    let cfg = null; const acc = ctx.account; if (acc && acc.ready) await acc.ready.catch(() => {});   // có server → /admin quản lý; không (link artifact) → file tĩnh
    if (acc && acc.online) try { cfg = await get('/api/sp/config'); st.server = true; } catch (e) {}
    if (!cfg) try { cfg = await get('sponsors/config.json'); } catch (e) { return; }
    st.cfg = cfg; const sps = new Map((cfg.sponsors || []).map(x => [x.id, x])), by = Object.fromEntries((cfg.list || []).map(a => [a.slot, sps.get(a.sp)]).filter(a => a[1]));
    st.slots = (cfg.slots || []).filter(s => KIND[s.kind] && (PLACE[s.id] || s.kind === 'counter')).slice(0, 16).map(s => ({ ...s, sp: by[s.id] || null, place: PLACE[s.id] && PLACE[s.id]() }));
    build(); await repaint();
  }
  load().catch(e => console.warn('[sp]', e));

  // ---------- bấm E gần biển: thẻ thông tin (KHÔNG tự bật) · nhiệm vụ · cổng phụ huynh ----------
  const css = document.createElement('style');
  css.textContent = `#spBox{position:fixed;inset:0;z-index:44;display:grid;place-items:center;background:#0a1222a6;padding:13px}#spBox[hidden]{display:none}
#spBox .card{width:min(100%,377px);box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid var(--c,#c9a24a);box-shadow:0 13px 34px #0008;font:16px/1.5 system-ui;text-align:center}
#spBox .tag{display:inline-block;font:700 13px system-ui;background:#3a2a1a;color:#fff;border-radius:13px;padding:2px 13px}#spBox img{max-width:144px;max-height:89px;margin:13px auto 5px;display:block}
#spBox h3{margin:5px 0;font-size:21px}#spBox p{margin:0 0 13px;font-size:15px}#spBox small{font-size:13px;opacity:.75}
#spBox button{width:100%;padding:13px;border-radius:13px;border:0;font:800 16px system-ui;cursor:pointer;margin-top:8px;background:#efe3cc;color:#3a2a1a}#spBox button.pri{background:#f0a23a;color:#2a1a0a}#spBox .ans button{text-align:left;font-weight:700}`;
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'spBox'; box.hidden = true; document.body.appendChild(box);
  box.addEventListener('keydown', e => e.stopPropagation()); box.addEventListener('keyup', e => e.stopPropagation());
  box.addEventListener('click', e => { if (e.target === box) close(); });
  const close = () => { box.hidden = true; st.open = null; ctx.player && (ctx.player.frozen = false); };
  const show = (sp, html) => { box.style.setProperty('--c', sp.color || GOLD); box.innerHTML = `<div class="card">${html}</div>`; box.hidden = false; ctx.player && (ctx.player.frozen = true); };
  const done = () => { try { return JSON.parse(localStorage.getItem('island.spQuest') || '{}'); } catch (e) { return {}; } };
  function card(s) {
    const sp = s.sp; st.open = s; ctx.sfx && ctx.sfx('ui'); hit(s, 'visit');
    show(sp, `<span class="tag">Nhà tài trợ</span>${sp.logo ? `<img src="${esc(sp.logo)}" alt="">` : ''}<h3>${esc(sp.name)}</h3><p>${esc(sp.msg)}</p>${sp.about ? `<p><small>${esc(sp.about)}</small></p>` : ''}
      <p><small>Cảm ơn ${esc(sp.name)} đã giúp Đảo Rubik miễn phí cho mọi bạn nhỏ 💛</small></p>
      ${sp.quest && sp.quest.length ? `<button class="pri" data-a="q">❓ Nhiệm vụ: ${sp.quest.length} câu đố${done()[sp.id] ? ' ✅' : ''}</button>` : ''}${sp.link ? '<button data-a="p">👪 Dành cho bố mẹ</button>' : ''}<button data-a="x">Đóng</button>`);
    box.querySelector('[data-a=x]').onclick = close;
    const qb = box.querySelector('[data-a=q]'); if (qb) qb.onclick = () => quest(s);
    const pb = box.querySelector('[data-a=p]'); if (pb) pb.onclick = () => { close(); const go = () => parent(sp); ctx.premium && ctx.premium.parentGate ? ctx.premium.parentGate(go) : gate(go); };
  }
  function gate(onOk) {   // dự phòng khi không có premium.js: phép nhân 2 chữ số
    const a = 12 + Math.floor(Math.random() * 13), b = 13 + Math.floor(Math.random() * 8);
    show({}, `<h3>🔐 Dành cho bố mẹ</h3><p>Bố mẹ trả lời giúp: <b>${a} × ${b} = ?</b></p><input id="spAns" inputmode="numeric" style="width:100%;padding:13px;border-radius:13px;border:2px solid #d9c6a3;font:800 21px system-ui;text-align:center;box-sizing:border-box"><button class="pri" data-a="ok">Tiếp tục</button><button data-a="x">Huỷ</button>`);
    box.querySelector('[data-a=x]').onclick = close; box.querySelector('[data-a=ok]').onclick = () => +box.querySelector('#spAns').value === a * b ? onOk() : close();
  }
  function parent(sp) {
    const url = /^https:\/\//.test(sp.link || '') ? sp.link : null; if (!url) return close();
    show(sp, `<h3>👪 Chào bố mẹ!</h3><p>Trang của nhà tài trợ <b>${esc(sp.name)}</b> nằm <b>ngoài</b> Đảo Rubik:</p><p><small>${esc(url.replace(/^https:\/\//, ''))}</small></p><p><small>Đảo Rubik không gửi dữ liệu của bé cho nhà tài trợ.</small></p><button class="pri" data-a="go">Mở trang (tab mới)</button><button data-a="x">Đóng</button>`);
    box.querySelector('[data-a=go]').onclick = () => { window.open(url, '_blank', 'noopener,noreferrer'); close(); }; box.querySelector('[data-a=x]').onclick = close;
  }
  function quest(s) {
    const sp = s.sp, Q = sp.quest.slice(0, 3); let i = 0, ok = 0; hit(s, 'qs');
    const ask = () => {
      const q = Q[i]; show(sp, `<span class="tag">Nhiệm vụ tài trợ · ${esc(sp.name)}</span><h3>Câu ${i + 1}/${Q.length}</h3><p>${esc(q.q)}</p><div class="ans">${q.a.map((t, k) => `<button data-k="${k}">${'ABCD'[k]}. ${esc(t)}</button>`).join('')}</div><p class="ex" style="min-height:21px;margin-top:8px"></p>`);
      box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        if (box.dataset.lock) return; box.dataset.lock = 1; const right = +b.dataset.k === q.c; ok += right; ctx.sfx && ctx.sfx(right ? 'ok' : 'bad');
        b.style.background = right ? '#9be3a0' : '#f3c7bd'; box.querySelector('.ex').innerHTML = right ? '✅ Chính xác!' : `💡 ${esc(q.explain || 'Đáp án đúng: ' + q.a[q.c])}`;
        dispatchEvent(new CustomEvent('rw-learn', { detail: { s: q.s || 'Khác', ok: right, t: sp.name } }));
        setTimeout(() => { delete box.dataset.lock; ++i < Q.length ? ask() : finish(); }, right ? 1000 : 2600);
      });
    };
    const finish = () => {
      const win = ok >= 2, d = done(), first = win && !d[sp.id];
      if (first) { d[sp.id] = Date.now(); localStorage.setItem('island.spQuest', JSON.stringify(d)); ctx.reward && ctx.reward(sp.reward || 3, `Nhiệm vụ tài trợ: ${sp.name}`); hit(s, 'qd'); }
      show(sp, `<div style="font-size:55px">${win ? '🏅' : '📚'}</div><h3>${ok}/${Q.length} câu đúng</h3><p>${win ? (first ? `Em nhận <b>Huy hiệu ${esc(sp.name)}</b> và +${sp.reward || 3} ⭐!` : 'Em đã có huy hiệu này rồi — giỏi lắm!') : 'Đúng 2 câu là nhận huy hiệu. Thử lại nhé!'}</p><button class="pri" data-a="x">Đóng</button>`);
      box.querySelector('[data-a=x]').onclick = close;
    };
    ask();
  }

  // ---------- đếm gộp ẩn danh (phần báo cáo gửi server: hit) ----------
  const hit = (s, k) => { if (st.onHit) st.onHit(s, k); };
  let tt = 0;
  function update(dt) {
    if (!st.slots.length) return;
    const night = !!(ctx.sky && ctx.sky.state.night > 0.5); if (night !== st.night) { st.night = night; repaint(); }
    pMat.emissiveIntensity = ctx.sky ? ctx.sky.state.night * 0.55 : 0;   // đêm: biển được đèn lồng soi sáng nhẹ
    if (ctx.player.frozen || (tt += dt) < 0.1) return; tt = 0;
    const p = ctx.player.pos; let best = null, bd = 9;
    for (const s of st.slots) { if (!s.sp || !s.ip || s.car) continue; const d = s.ip.distanceToSquared(p); if (d < bd) { bd = d; best = s; } }
    if (best) ctx.offer(`🏷️ ${esc(best.kind === 'quest' ? 'Nhiệm vụ tài trợ' : best.sp.name)}`, () => card(best), 2);
  }
  return { update, state: st, reload: load, card };
}
