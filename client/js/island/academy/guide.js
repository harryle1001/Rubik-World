// academy/guide.js — CHỈ ĐƯỜNG trong Học viện Pha Lê:
//  · Biển chỉ đường ngoài lâu đài (bến → cổng → sân → đại sảnh / nội thất / rừng / phố / sân bay chổi) và trong 5 tầng nội thất.
//    Mọi biển 1 tầng/khu gộp: chữ vẽ chung 1 atlas canvas (1 draw call) + cột gỗ (1 draw call).
//  · Bản đồ nội thất (phím M / nút 🗺️ khi ở trong lâu đài): mặt bằng từng tầng vẽ từ lưới ô (interior/plan.js), tên phòng, cửa ra,
//    tháp xoắn, giếng cầu thang xoay, lớp học, phòng nhà; chấm "em ở đây". Đổi tầng bằng thẻ (tầng −2 … 4).
// Tỷ lệ φ: biển 2,6 × 0,62 m (≈ φ³ : 1), cột cao 2,1 m; chữ 34 px trên ô 512 × 122.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';
import { W, D, FH, LV0, LV1, FLOORS, EXITS, TOWERS, REG, SHAFT_DEF, MIRROR, ANCHORS } from './interior/plan.js';
import { cellId, kindOf, yOf } from './interior/build.js';
import { heightLocal } from './plan.js';

const SW = 512, SH = 122, COLS = 2;
/** Dựng nhóm biển: list = [{ x, y, z, ry, t: 'dòng 1\ndòng 2', post = true }] (toạ độ của group cha). Trả về THREE.Group (2 mesh). */
export function signBoard(list, { w = 2.6, post = true } = {}) {
  const rows = Math.ceil(list.length / COLS), c = document.createElement('canvas'); c.width = SW * COLS; c.height = THREE.MathUtils.ceilPowerOfTwo(rows * SH);
  const g = c.getContext('2d'), pos = [], uv = [], idx = [], posts = new Batch(), h = w * SH / SW;
  list.forEach((s, i) => {
    const ox = (i % COLS) * SW, oy = Math.floor(i / COLS) * SH, L = s.t.split('\n');
    g.fillStyle = '#2b2238'; g.beginPath(); g.roundRect(ox + 4, oy + 4, SW - 8, SH - 8, 21); g.fill();
    g.strokeStyle = '#d9b45a'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#fff3d0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach((t, j) => { g.font = `bold ${j ? 30 : 34}px system-ui, sans-serif`; g.fillText(t, ox + SW / 2, oy + SH / 2 + (j - (L.length - 1) / 2) * 38, SW - 30); });
    const u0 = ox / c.width, u1 = (ox + SW) / c.width, v1 = 1 - oy / c.height, v0 = 1 - (oy + SH) / c.height;
    const ca = Math.cos(s.ry || 0), sa = Math.sin(s.ry || 0), b = pos.length / 3, top = s.y + (s.post === false ? 0 : 2.1);
    for (const [sx, sy, tu, tv] of [[-1, 0, u0, v0], [1, 0, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) pos.push(s.x + ca * sx * w / 2, top + sy * h, s.z - sa * sx * w / 2), uv.push(tu, tv);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    if (post && s.post !== false) { posts.box(-0.07, 0.07, 0, 2.1 + h + 0.08, -0.07, 0.07, '#6e4a30'); posts.list[posts.list.length - 1].rotateY(s.ry || 0).translate(s.x, s.y, s.z); posts.box(-w / 2 - 0.06, w / 2 + 0.06, 2.06, 2.12 + h, -0.09, -0.02, '#4a3020'); posts.list[posts.list.length - 1].rotateY(s.ry || 0).translate(s.x, s.y, s.z); }
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const grp = new THREE.Group(); grp.name = 'academy-signs';
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, toneMapped: false })); m.matrixAutoUpdate = false; grp.add(m);
  if (posts.list.length) { const p = new THREE.Mesh(posts.build(), matV()); p.matrixAutoUpdate = false; p.castShadow = true; grp.add(p); }
  return grp;
}

// biển ngoài lâu đài: [u, v, hướng mặt biển (rad, 0 = nhìn về +u/nam), chữ]
const OUT = [
  [52, -8, -Math.PI / 2, '🏰 Cổng chính ➡\n⬇ Dốc đá xuống bến thuyền'],
  [44, 9, 0, '🚪 Lâu đài 7 tầng: cửa trong cổng, bên trái\n🏛️ Đại sảnh: đi thẳng qua sân'],
  [44, 40, 0, '🧹 Sân Bay Chổi ⬅ (trên hồ)\n🛍️ Phố Phép Thuật ➡ (cánh đông)'],
  [44, -40, 0, '🚂 Ga Tàu Pha Lê ➡ (cánh tây)\n🧹 Sân Bay Chổi: cổng phép bên này'],
  [-18, 8, 0, '⬆ 🏛️ Đại sảnh · cửa vào 7 tầng\n⬅ Sân Luyện Đũa  ·  Nhà Kính ➡'],
  [-8, -46, Math.PI / 2, '🪄 Sân Luyện Đũa · 🔭 Tháp Thiên Văn\n⬆ Cầu có mái → 🌲 Rừng Phép Thuật'],
  [-8, 46, -Math.PI / 2, '🌿 Nhà Kính (lớp Thảo Dược)\n📚 Thư viện tối (phép Sáng lên)'],
  [-52, -104, Math.PI / 2, '🌲 Rừng Phép Thuật ⬅ qua cầu\n🗝️ 13 bí mật đang chờ'],
];
// biển trong lâu đài theo tầng: [x, z, ry, chữ] — 2 đầu hành lang chính + cạnh giếng cầu thang
const IN = {
  [-1]: [[22, 25.6, 0, '⬅ Bếp Lớn · Hầm Rượu\n🌀 Tháp Xoắn Tây'], [67, 25.6, 0, 'Ngục Tối Cũ · Kho Thảo Dược ➡\n🔥 Lò Sưởi Ngầm ⬆']],
  [0]: [[22, 25.6, 0, '⬅ Phòng Truyền Thống · Lớp học\n🌀 Tháp Xoắn Tây (−1…3)'], [67, 25.6, 0, 'P. Sinh Hoạt · Đồng Hồ Pha Lê ➡\n🌀 Tháp Chính (lên mái)'], [40, 13.6, 0, '🌀 Cầu thang xoay: lên/xuống tầng\n🗺️ Phím M: bản đồ tầng']],
  [1]: [[22, 25.6, 0, '⬅ 📚 Thư Viện · 🎵 Phòng Nhạc\n🌀 Tháp Xoắn Tây'], [67, 25.6, 0, '📖 Lớp Học tầng 1 (2 phòng) ➡\n🌀 Tháp Chính'], [40, 13.6, 0, '⬆ Phòng Bản Đồ Cổ\n⬇ Phòng Tranh · cầu thang lớn']],
  [2]: [[22, 25.6, 0, '⬅ Tầng lửng Thư viện\n🛏️ Phòng ngủ khách 1 · 2'], [67, 25.6, 0, '🔭 Phòng Khí Cụ · 🛏️ Khách 3 ➡\n🌀 Tháp Chính'], [50, 41.4, Math.PI, '⬇ 🧪 Phòng Pha Chế (lớp)\n⬆ ✏️ Phòng Tự Học']],
  [3]: [[22, 25.6, 0, '⬅ 🔭 Thiên Văn\n🐉 Nhà Long · 🦁 Nhà Lân'], [67, 25.6, 0, '🧙 Hiệu Trưởng ➡\n🐢 Nhà Quy · 🐦 Nhà Phụng'], [44.5, 13.6, 0, '⬆ Phòng Chờ Tầng 3\n🗺️ Phím M: bản đồ tầng']],
};

export function createGuide(ctx, { toWorld, Y, interior }) {
  let out = null;
  const build = () => {
    if (out) return;
    out = signBoard(OUT.map(([u, v, ry, t]) => { const [x, z] = toWorld(u, v); return { x, y: Math.max(Y, heightLocal(u, v, x, z)), z, ry, t }; }));
    ctx.scene.add(out);
  };
  const unbuild = () => { if (!out) return; ctx.scene.remove(out); out.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.map && o.material.map.dispose(); } }); out = null; };
  interior.onFloorBuilt((k, grp) => { const L = IN[k]; if (L) grp.add(signBoard(L.map(([x, z, ry, t]) => ({ x, y: yOf(k), z, ry, t })))); });

  // ---------- bản đồ nội thất ----------
  let el = null, cv = null, view = 0, open = false, frozen0 = false;
  const PX = 9;   // px / m trên canvas (89 × 55 m → 801 × 495)
  const css = `#acMap{position:fixed;inset:0;z-index:60;background:rgba(13,10,20,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font:600 14px system-ui;color:#fff3d0}
#acMap .tabs{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:96vw}#acMap button{font:inherit;border:0;border-radius:13px;padding:8px 13px;background:#3a2f4a;color:#fff3d0}
#acMap button.on{background:#d9b45a;color:#2b2238}#acMap canvas{max-width:96vw;max-height:70vh;border-radius:13px;background:#1b1626;touch-action:none}#acMap .x{position:absolute;top:13px;right:13px;font-size:18px}`;
  function ensure() {
    if (el) return; const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'acMap'; el.hidden = true;
    el.innerHTML = `<button class="x">✖ Đóng (M)</button><div class="ttl"></div><div class="tabs">${Object.keys(FLOORS).map(Number).sort((a, b) => b - a).map(k => `<button data-k="${k}">${k === 4 ? '⛰️' : k < 0 ? '⬇️' : '🏢'} ${FLOORS[k].name}</button>`).join('')}</div><canvas width="${W * PX}" height="${D * PX}"></canvas><div style="opacity:.8;font-size:12px">🔴 em ở đây · 🚪 cửa ra · 🌀 tháp xoắn · 🔄 cầu thang xoay · 📖 lớp học</div>`;
    document.body.appendChild(el); cv = el.querySelector('canvas');
    el.querySelector('.x').onclick = () => show(false);
    el.querySelector('.tabs').onclick = e => { const b = e.target.closest('button'); if (b) { view = +b.dataset.k; draw(); } };
    addEventListener('keydown', e => { if (open && (e.code === 'Escape' || e.code === 'KeyM')) { e.preventDefault(); e.stopImmediatePropagation(); show(false); } }, true);
  }
  function draw() {
    const g = cv.getContext('2d'), k = view; g.clearRect(0, 0, cv.width, cv.height);
    el.querySelector('.ttl').textContent = `🏰 Lâu đài Pha Lê · ${FLOORS[k].name}${interior.level === k ? ' (em đang ở đây)' : ''}`;
    for (const b of el.querySelectorAll('.tabs button')) b.classList.toggle('on', +b.dataset.k === k);
    const cells = new Map();
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const id = cellId(k, x, z), kd = kindOf(id); if (id === 'void') continue;
      g.fillStyle = kd === 'solid' ? '#3a3440' : kd === 'hole' ? '#0d0a14' : (REG[id] && REG[id].c) || '#777'; g.fillRect(x * PX, z * PX, PX + 0.5, PX + 0.5);
      if (kd === 'room' || kd === 'corr' || kd === 'tower') { const c = cells.get(id) || [0, 0, 0]; c[0] += x; c[1] += z; c[2]++; cells.set(id, c); }
    }
    // viền phòng
    g.strokeStyle = 'rgba(255,243,208,.55)'; g.lineWidth = 2;
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) { const a = cellId(k, x, z); if (a === 'void') continue; if (cellId(k, x + 1, z) !== a) { g.beginPath(); g.moveTo((x + 1) * PX, z * PX); g.lineTo((x + 1) * PX, (z + 1) * PX); g.stroke(); } if (cellId(k, x, z + 1) !== a) { g.beginPath(); g.moveTo(x * PX, (z + 1) * PX); g.lineTo((x + 1) * PX, (z + 1) * PX); g.stroke(); } }
    const icon = (t, x, z, s = 21) => { g.font = `${s}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x * PX, z * PX); };
    // cầu thang xoay, tháp xoắn, cửa ra, gương, lớp học
    if (k >= SHAFT_DEF.k0 && k <= SHAFT_DEF.k1 + 1) { const [x0, z0, x1, z1] = SHAFT_DEF.rect; icon('🔄', (x0 + x1) / 2, (z0 + z1) / 2, 34); }
    for (const T of TOWERS) if (k >= T.k0 && k <= T.k1) icon('🌀', T.c[0], T.c[1], 26);
    for (const e of EXITS) if (e.k === k) icon('🚪', e.at[0], e.at[1], 26);
    if (k === MIRROR.k) icon('🪞', MIRROR.at[0], MIRROR.at[1]);
    for (const a of ANCHORS) if (a.k === k && (a.kind === 'classroom' || a.kind === 'house')) icon(a.kind === 'house' ? { Long: '🐉', 'Lân': '🦁', Quy: '🐢', 'Phụng': '🐦' }[a.house] || '🏠' : '📖', a.x, a.z - 3, 24);
    for (const s of FLOORS[k].stairs || []) { g.fillStyle = 'rgba(217,180,90,.5)'; g.fillRect(s[0] * PX, s[1] * PX, (s[2] - s[0]) * PX, (s[3] - s[1]) * PX); icon('🪜', (s[0] + s[2]) / 2, (s[1] + s[3]) / 2); }
    // tên phòng
    g.font = 'bold 15px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [id, [sx, sz, n]] of cells) { const r = REG[id]; if (!r || !r.name || n < 21 || /corr|hall|well/.test(id)) continue; const x = (sx / n + 0.5) * PX, z = (sz / n + 0.5) * PX + 13; g.lineWidth = 4; g.strokeStyle = '#1b1626'; g.strokeText(r.name, x, z, 26 * PX); g.fillStyle = '#fff3d0'; g.fillText(r.name, x, z, 26 * PX); }
    // em ở đây
    if (interior.level === k) {
      const p = ctx.player.pos, w = interior.toWorld(0, 0, 0), x = p.x - w[0], z = p.z - w[2], yaw = ctx.player.rot || 0;
      g.save(); g.translate(x * PX, z * PX); g.rotate(-yaw); g.fillStyle = '#ff4a4a'; g.strokeStyle = '#fff'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 13); g.lineTo(-9, -8); g.lineTo(9, -8); g.closePath(); g.fill(); g.stroke(); g.restore();
    }
  }
  function show(v) {
    ensure(); if (v === open) return; open = v; el.hidden = !v;
    if (v) { view = interior.level ?? 0; draw(); frozen0 = ctx.player.frozen; ctx.player.frozen = true; ctx.sfx && ctx.sfx('ui'); }
    else ctx.player.frozen = frozen0;
  }
  const prevHook = ctx.mapHook;
  ctx.mapHook = () => { if (interior.inside) { show(true); return true; } return prevHook ? prevHook() : false; };
  let hinted = false;
  function update() { if (interior.inside && !hinted) { hinted = true; setTimeout(() => ctx.toast('🗺️ Lạc đường trong lâu đài? Bấm <b>M</b> (hoặc nút 🗺️) để xem <b>bản đồ tầng</b>.', 5500), 6500); } if (open && interior.level !== null) draw(); }
  return { build, unbuild, update, show, get open() { return open; } };
}
