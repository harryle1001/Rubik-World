// academy/life.js — HỌC VIỆN SỐNG ĐỘNG (v2): sự kiện theo giờ của trời (sky.state.hour), lễ hội theo mùa, Thần Bếp.
//  ⏰ 6:30–7:30 chào cờ ở Sân Đại Sảnh (cờ kéo lên cột 13 m, học sinh xếp hàng) · 7:30–11:30 & 13:30–16:30 giờ học: học sinh đi vào lớp
//     (cửa nội thất / đại sảnh) · 18:00–19:30 ăn tối ở Đại sảnh (ngồi bàn dài, đĩa thức ăn KayKit) · 20:30–5:00 nến bay trên sân + Ma Cụ Đồ kể chuyện
//  🏮 Lễ hội ở Đại sảnh theo lịch thật: Trung Thu (20/8–10/10: đèn ông sao, bánh trung thu) · Tết (10/1–28/2: đèn lồng đỏ, cây đào, câu đối);
//     ngoài mùa: bảng "lễ hội sắp tới". Thử: ?le=tet | ?le=trungthu
//  🍲 Thần Bếp (bếp tầng hầm nội thất): ông bếp nhỏ đội mũ trắng khuấy nồi chè, đố vui nấu ăn (Toán / Khoa học) → bánh trôi +13 năng lượng.
// Draw call: học sinh 1–2/người (viền theo LOD), cờ 2, nến 2, lễ hội ≤ 4, đĩa 2; điện thoại 5 học sinh.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV, mat } from '../sample/palette.js';
import { placeKit } from '../kit.js';
import { loadModel } from '../models.js';
import { loadHero, STUDENTS } from '../characters.js';
import { CFG } from '../config.js';
import { HALL_HOUSE } from './plan.js';
import { toon } from '../style.js';
import { dressWizard } from './practice.js';
import { freeTex, freeAll } from '../free.js';

const PI = Math.PI;
const Q = (q, choices, explain) => ({ q, choices, a: 0, explain });
const COOK = [
  Q('Một nồi chè cần 3 bát đường. Thần Bếp nấu 4 nồi thì cần mấy bát đường?', ['12 bát', '7 bát', '9 bát', '16 bát'], '3 × 4 = <b>12</b> bát đường.'),
  Q('Ở gần mặt biển, nước sôi ở bao nhiêu độ C?', ['100 °C', '50 °C', '0 °C', '200 °C'], 'Nước sôi ở <b>100 °C</b>, đông đá ở 0 °C.'),
  Q('Vì sao phải rửa tay trước khi nấu ăn?', ['Để loại bỏ vi khuẩn', 'Cho tay thơm', 'Để đỡ tốn nước', 'Không cần rửa'], 'Xà phòng cuốn trôi <b>vi khuẩn</b> — giữ món ăn sạch, cả nhà khỏe.'),
  Q('Bánh chưng ngày Tết có hình gì?', ['Hình vuông', 'Hình tròn', 'Hình tam giác', 'Hình ngôi sao'], 'Bánh chưng <b>vuông</b> tượng trưng cho đất (sự tích Lang Liêu).'),
  Q('Bỏ muối vào nước, khuấy đều thì muối…', ['Hòa tan vào nước', 'Đông đặc lại', 'Bay lên trời', 'Biến thành đường'], 'Muối <b>hòa tan</b>: các hạt muối tách nhỏ, trộn đều trong nước.'),
  Q('Cắt chiếc bánh thành 4 phần bằng nhau, mỗi phần là bao nhiêu chiếc bánh?', ['1/4', '1/2', '1/3', '4'], 'Chia đều làm 4 → mỗi phần <b>một phần tư (1/4)</b>.'),
  Q('Nhóm thức ăn nào giàu vitamin, giúp chống bệnh?', ['Rau xanh và trái cây', 'Kẹo ngọt', 'Nước ngọt có ga', 'Bim bim'], '<b>Rau, củ, quả</b> nhiều vitamin và chất xơ.'),
];
const COOK_TALK = ['Ha ha, chè đậu xanh sắp chín rồi, thơm chưa cháu?', 'Bếp lửa phải giữ vừa phải — to quá là khê, nhỏ quá là sống!', 'Ông là Thần Bếp, ở bếp này từ hồi lâu đài mới xây đấy.', 'Nấu ăn cũng là khoa học: đun, hòa tan, đông đặc… cái gì cũng có.'];
const TALES = [
  ['Sơn Tinh – Thủy Tinh', 'Hai chàng cùng cầu hôn Mị Nương. Sơn Tinh mang lễ vật tới trước nên cưới được nàng. Thủy Tinh tức giận dâng nước đánh, Sơn Tinh bốc đồi dời núi chặn lại — người xưa giải thích <b>mùa lũ</b> hằng năm như thế.', 'khoahoc'],
  ['Thánh Gióng', 'Cậu bé làng Phù Đổng ba tuổi chưa biết nói, nghe giặc Ân tới bỗng vươn vai thành tráng sĩ, cưỡi ngựa sắt nhổ tre đánh tan giặc rồi bay về trời từ núi Sóc.', 'toan'],
  ['Sự tích Hồ Gươm', 'Vua Lê Lợi được Rùa Vàng cho mượn gươm thần đánh thắng giặc Minh. Một hôm vua dạo thuyền trên hồ Tả Vọng, Rùa nổi lên đòi gươm — hồ được đổi tên là <b>Hồ Hoàn Kiếm</b>.', 'khoahoc'],
  ['Chú Cuội cung trăng', 'Chú Cuội có cây đa thần chữa bệnh. Vợ Cuội tưới nhầm nước bẩn, cây bay lên trời, Cuội bám rễ theo lên cung trăng — vết đen trên Mặt Trăng là bóng cây đa đấy (thật ra là <b>biển đá bazan</b>).', 'khoahoc'],
  ['Bánh chưng bánh giầy', 'Hoàng tử Lang Liêu nghèo, được thần mách làm bánh từ gạo: bánh vuông như đất, bánh tròn như trời. Vua Hùng khen hiếu thảo, truyền ngôi cho chàng.', 'toan'],
];

export function createLife(ctx, magic, { Y, toWorld, toLocal, interior, L }) {
  const { player } = ctx, MOB = CFG.isMobile, H = L.hall;
  let orbFx = null, feastFx = null, feastT = -99, sortK = -1, sortToastT = -99, myDish = null;
  let G = null, kids = [], flag = null, candles = null, flames = null, plates = [], fest = null, ghost = null, cook = null;
  const POLE = [22, 0];   // cột cờ (u, v) — Sân Đại Sảnh, sau cổng chính
  const hour = () => ctx.sky && ctx.sky.state ? ctx.sky.state.hour : 10;
  const phase = h => h >= 6.5 && h < 7.5 ? 'flag' : (h >= 7.5 && h < 11.5) || (h >= 13.5 && h < 16.5) ? 'class' : h >= 17 && h < 18 ? 'sorting' : h >= 18 && h < 19.5 ? 'dinner' : h >= 20.5 || h < 5 ? 'night' : 'free';
  const festNow = () => {
    const q = new URLSearchParams(location.search).get('le'); if (q) return q === 'tet' || q === 'trungthu' ? q : null;
    const d = new Date(), m = d.getMonth() + 1, dd = d.getDate();
    if ((m === 1 && dd >= 10) || m === 2) return 'tet';
    if ((m === 8 && dd >= 20) || m === 9 || (m === 10 && dd <= 10)) return 'trungthu';
    return null;
  };
  const nextFest = () => { const d = new Date(), y = d.getFullYear(), c = [[new Date(y, 7, 20), 'Trung Thu 🥮'], [new Date(y, 0, 10), 'Tết Nguyên Đán 🧧'], [new Date(y + 1, 0, 10), 'Tết Nguyên Đán 🧧'], [new Date(y + 1, 7, 20), 'Trung Thu 🥮']].filter(x => x[0] > d).sort((a, b) => a[0] - b[0])[0]; return [c[1], Math.ceil((c[0] - d) / 864e5)]; };
  const W = (u, v) => toWorld(u, v);

  // ---------- dựng ----------
  function flagTex() {
    const c = document.createElement('canvas'); c.width = 192; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#da251d'; g.fillRect(0, 0, 192, 128);
    g.fillStyle = '#ffde00'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 15 : 38, a = -PI / 2 + i * PI / 5; g.lineTo(96 + Math.cos(a) * r, 66 + Math.sin(a) * r); } g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function build() {
    if (G) return;
    G = new THREE.Group(); G.name = 'academy-life'; const b = new Batch();
    // cột cờ + bệ
    const [px, pz] = W(...POLE); b.cyl(px, Y, pz, 1.3, 0.4, '#8f8a82', 13); b.cyl(px, Y + 0.4, pz, 0.08, 13, '#d8d8de', 8); b.add(new THREE.SphereGeometry(0.16, 8, 6), '#c9a24a', px, Y + 13.5, pz);
    const fg = new THREE.PlaneGeometry(2.6, 1.73, 8, 1).translate(1.3, -0.87, 0); flag = new THREE.Mesh(fg, new THREE.MeshToonMaterial({ map: flagTex(), side: THREE.DoubleSide })); flag.position.set(px + 0.08, Y + 12.9, pz); G.add(flag);
    flag.userData.p0 = fg.attributes.position.array.slice();
    // nến bay trên sân (đêm): 55 cây
    const N = MOB ? 34 : 55; candles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.08, 0.34, 6), toon('#f6f1e6'), N); flames = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.16, 6), mat('lampGlow'), N);
    candles.userData.c = Array.from({ length: N }, (_, i) => ({ u: 25 - (i * 37 % 70), v: -26 + (i * 23 % 52), y: Y + 5 + (i * 7 % 8), ph: i * 1.7 }));
    for (const m of [candles, flames]) { m.frustumCulled = false; m.visible = false; G.add(m); }
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = true; m.matrixAutoUpdate = false; G.add(m);
    // đĩa thức ăn trên 4 bàn dài (chỉ hiện giờ ăn tối)
    const dish = { kk_plate_food_A: [], kk_plate_food_B: [], kk_plate_stack: [] }, names = Object.keys(dish); let k = 0;
    for (const v of [-6.5, -2.2, 2.2, 6.5]) for (let u = H.u0 + 9.5; u < H.u1 - 5; u += 3.4) { const [x, z] = W(u, v); dish[names[k++ % 3]].push([x, Y + 0.8, z, 0.8, k]); }
    for (const [n, l] of Object.entries(dish)) placeKit(G, n, l, { shadow: false }).then(ims => { if (!G) return ims.forEach(im => im.parent && im.parent.remove(im)); for (const im of ims) { im.visible = false; plates.push(im); } });
    buildFest();
    // v3: quầng sáng Quả cầu Tứ Linh (lễ chọn nhà) + hạt sáng "món ăn hiện ra bằng phép"
    { const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d'), rg = k.createRadialGradient(64, 64, 4, 64, 64, 64); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = rg; k.fillRect(0, 0, 128, 128);
      orbFx = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); const [ox, oz] = W(...HALL_HOUSE.orb); orbFx.position.set(ox, Y + 2.2, oz); orbFx.visible = false; G.add(orbFx); }
    feastFx = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.09), mat('lampGlow'), 55); feastFx.frustumCulled = false; feastFx.visible = false; G.add(feastFx);
    ctx.scene.add(G);
    // học sinh
    const n = MOB ? 5 : 13;   // v3: đông học sinh hơn, đội mũ phù thủy màu nhà
    for (let i = 0; i < n; i++) {
      const kid = { i, hero: null, pos: new THREE.Vector3(), tgt: null, mode: 'free', yaw: 0, clip: '', seat: null, hide: false, wait: Math.random() * 3 };
      const [x, z] = W(-5 - (i % 4) * 4, -8 + Math.floor(i / 4) * 16); kid.pos.set(x, Y, z); kids.push(kid);
      loadHero(STUDENTS[(i * 5) % STUDENTS.length], 1.32 + (i % 3) * 0.06).then(h => { if (!G) return; kid.hero = h; h.npc = true; h.model.position.copy(kid.pos); G.add(h.model); play(kid, 'idle'); if (!MOB) dressWizard(h, ['#c8302c', '#3a6fc4', '#3f8a4c', '#7a4fb0'][i % 4]); });   // điện thoại: bỏ mũ (đỡ 5 draw call)
    }
    // Ma Cụ Đồ (đêm): người lớn mờ ảo bay lơ lửng cạnh đài phun nước
    loadHero('student-male-a', 1.7, { role: 'old', old: true, shirt: '#cfe6ff', pants: '#a8c4e8' }).then(h => {
      if (!G || !h) return; ghost = h; h.model.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; o.material.depthWrite = false; } });
      h.model.visible = false; G.add(h.model); h.anim.play(h.set.idle, 0);
    });
  }
  function buildFest() {
    const f = festNow(); fest = { id: f, g: new THREE.Group() }; G.add(fest.g);
    const b = new Batch(), gl = new Batch(), hu = (H.u0 + H.u1) / 2;
    if (f) {
      const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.2 : 0.5, a = PI / 2 + i * PI / 5; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const starG = new THREE.ExtrudeGeometry(star, { depth: 0.18, bevelEnabled: false }), lantG = new THREE.SphereGeometry(0.42, 10, 8);
      for (let i = 0; i < 21; i++) {   // 21 đèn treo dọc 2 bên sảnh, cao 9–12 m
        const u = H.u0 + 4 + (i % 7) * 4.6, v = (i < 7 ? -7.8 : i < 14 ? 0 : 7.8), y = Y + 9 + (i * 3 % 4), [x, z] = W(u, v), col = f === 'tet' ? '#e0242a' : ['#e0242a', '#ffc23a', '#ff7a2a'][i % 3];
        if (f === 'tet') { gl.add(lantG, col, x, y, z, 0, 0, 0, 1, 1.25, 1); b.cyl(x, y + 0.48, z, 0.22, 0.12, '#d4a24a', 8); b.cyl(x, y - 0.6, z, 0.2, 0.12, '#d4a24a', 8); }
        else gl.add(starG, col, x, y, z, i * 0.4);
        b.cyl(x, y + 0.5, z, 0.015, Y + 21 - y - 0.5, '#2a2236', 3);
      }
      if (f === 'tet') {   // câu đối + 2 cây đào trước bục
        for (const s of [-1, 1]) { const [x, z] = W(H.u0 + 1.8, s * 9.2); b.box(x - 0.6, x + 0.6, Y + 3, Y + 9.5, z - 0.05, z + 0.05, '#c8202a'); }
        const tr = []; for (const s of [-1, 1]) { const [x, z] = W(H.u0 + 7.5, s * 8.6); tr.push([x, Y, z, 1.1, s]); }
        placeKit(fest.g, 'qn_tree_c', tr).then(ims => { for (const im of ims) { im.material = im.material.clone(); im.material.color.set('#ffc2d6'); } });
      } else { const l = []; for (let u = H.u0 + 3; u < H.u0 + 5; u += 0.9) { const [x, z] = W(u, 0); l.push([x, Y + 1.4, z, 0.8, u]); } placeKit(fest.g, 'kk_plate_food_B', l); }
    }
    // bảng lễ hội cạnh cửa đại sảnh (mặt trong)
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d'); g.fillStyle = f === 'tet' ? '#a8141c' : '#2b2238'; g.beginPath(); g.roundRect(4, 4, 504, 152, 21); g.fill(); g.strokeStyle = '#d9b45a'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#fff3d0'; g.textAlign = 'center'; g.font = 'bold 38px system-ui';
    if (f) { g.fillText(f === 'tet' ? '🧧 Chúc Mừng Năm Mới!' : '🏮 Vui Tết Trung Thu!', 256, 62, 480); g.font = '28px system-ui'; g.fillText(f === 'tet' ? 'An khang · Thịnh vượng · Học giỏi' : 'Rước đèn ông sao · Phá cỗ trông trăng', 256, 116, 480); }
    else { const [n, d] = nextFest(); g.fillText('🏮 Lễ hội sắp tới', 256, 62, 480); g.font = '30px system-ui'; g.fillText(`${n} — còn ${d} ngày`, 256, 116, 480); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.06), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); const [sx, sz] = W(H.u1 - 1.7, -6.8); sp.position.set(sx, Y + 3.4, sz); sp.rotation.y = PI; fest.g.add(sp);
    if (b.list.length) fest.g.add(new THREE.Mesh(b.build(), matV()));
    if (gl.list.length) fest.g.add(new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  }
  function unbuild() {
    if (!G) return; ctx.scene.remove(G); G.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.geometry) o.geometry.dispose(); }); freeAll(G);
    G = null; kids = []; plates = []; ghost = null; fest = null;
  }

  // ---------- Thần Bếp (nội thất tầng −1) ----------
  interior.onFloorBuilt((k, grp) => {
    if (k !== -1) return;
    const at = [8.6, 4.8], y = interior.toWorld(0, 0, -1)[1];
    const holder = new THREE.Group(); holder.position.set(at[0], y, at[1]); holder.rotation.y = Math.atan2(7 - at[0], 3 - at[1]); grp.add(holder);
    const steam = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, depthWrite: false }), 6); steam.frustumCulled = false; steam.position.set(7, y, 3); grp.add(steam);
    cook = { holder, steam, hero: null, k, at, t: 0, line: 0 };
    loadHero('student-male-c', 1.18, { role: 'cook', old: true, shirt: '#f7f2e8', pants: '#b8503a', glasses: true }).then(h => {
      if (!h || !cook) return; cook.hero = h; h.npc = true; holder.add(h.model); h.anim.play(h.set.use || h.set.interact, 0);
      const hat = new THREE.Group(), w = toon('#ffffff'); hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.2, 10), w)); const top = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 7), w); top.position.y = 0.17; top.scale.y = 0.75; hat.add(top);
      const head = h.head || h.model; hat.position.set(0, h.head ? 0.24 / h.model.scale.x : 1.15, 0); hat.scale.setScalar(h.head ? 1 / h.model.scale.x : 1); head.add(hat);
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), toon('#a8744a')); sp.position.set(-0.35, 0.95, 0.35); sp.rotation.z = 0.5; holder.add(sp); cook.spoon = sp;
    });
  });
  function cookUpdate(dt, t) {
    if (!cook || !interior.inside || interior.level !== -1) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < 6; i++) { const f = ((t * 0.4 + i / 6) % 1); o.position.set(Math.sin(i * 2.4 + t) * 0.3, 1.2 + f * 2.2, Math.cos(i * 1.7 + t) * 0.3); o.scale.setScalar(0.6 + f * 1.4); o.updateMatrix(); cook.steam.setMatrixAt(i, o.matrix); }
    cook.steam.instanceMatrix.needsUpdate = true;
    if (cook.hero) { cook.hero.anim.update(dt); if (cook.spoon) cook.spoon.rotation.y = t * 3; }
    const p = player.pos, [wx, wy, wz] = interior.toWorld(cook.at[0], cook.at[1], -1);
    if (Math.hypot(p.x - wx, p.z - wz) < 3.2 && Math.abs(p.y - wy) < 2) ctx.offer('🍲 Trò chuyện với Thần Bếp', () => {
      ctx.toast(`👨‍🍳 <b>Thần Bếp</b>: “${COOK_TALK[cook.line++ % COOK_TALK.length]}” — Cháu giúp ông câu đố này nhé!`, 5000);
      setTimeout(() => magic.ask(COOK[Math.floor(Math.random() * COOK.length)], () => { magic.setMana && magic.setMana((magic.mana || 0) + 13); ctx.account && ctx.account.addCoins(2); ctx.toast('🍡 Thần Bếp tặng em <b>bánh trôi nước</b> nóng hổi: +13 năng lượng phép, +2 🪙!', 4500); }, '🍲 Đố vui nhà bếp'), 1200);
    }, 8.5);
  }

  // ---------- mỗi khung hình ----------
  const o3 = new THREE.Object3D(); let lastPh = null, tale = 0;
  const lineSpot = i => [POLE[0] - 6 - Math.floor(i / 5) * 1.6, -3.2 + (i % 5) * 1.6];   // hàng chào cờ: 2 hàng × 4, quay mặt về cột (+u)
  const seatSpot = i => { const v = [-7.5, -5.5, -3.2, -1.2, 1.2, 3.2, 5.5, 7.5][i % 8]; return [H.u0 + 11 + (i % 5) * 4.2, v]; };
  const doorSpot = i => i % 2 ? [H.u1 - 1.5, -5.3] : [L.box.u1 - L.T - 0.5, -14];
  function play(kid, c) { if (!kid.hero || kid.clip === c) return; const set = kid.hero.set, clip = set[c] || set.idle; kid.hero.anim.play(clip, 0.25); kid.clip = c; }
  function update(dt, t) {
    cookUpdate(dt, t);
    if (!G) return;
    const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z), near = Math.hypot(cu + 20, cv) < 144 && cam.y < 600; G.visible = near; if (!near) return;
    const h = hour(), ph = phase(h);
    if (ph !== lastPh) {
      const [pu, pv] = toLocal(player.pos.x, player.pos.z), here = Math.hypot(pu + 20, pv) < 89 && !interior.inside;
      if (lastPh !== null && here) ctx.toast({ sorting: '🔮 <b>Lễ chọn nhà Tứ Linh</b> ở Đại sảnh! Các bạn mới lần lượt lên Quả cầu Tứ Linh.', flag: '🔔 <b>Giờ chào cờ!</b> Các bạn xếp hàng trước cột cờ ở Sân Đại Sảnh.', class: '📖 <b>Vào giờ học!</b> Các bạn đi vào lớp — em cũng vào học nhé (cửa trong cổng chính).', dinner: '🍽️ <b>Giờ ăn tối</b> ở Đại sảnh! Bàn dài đã dọn món.', night: '🕯️ <b>Đêm xuống</b>: nến bay khắp sân, Ma Cụ Đồ ra kể chuyện cạnh đài phun nước.', free: '🎈 <b>Giờ ra chơi!</b>' }[ph], 5000);
      lastPh = ph; for (const k of kids) { k.tgt = null; k.hide = false; k.snap = true; }
      for (const p of plates) p.visible = false; if (ph === 'dinner') { feastT = t; setTimeout(() => { if (lastPh === 'dinner') for (const p of plates) p.visible = true; }, 2600); }   // món ăn hiện ra bằng phép sau 2,6 s hạt sáng
      candles.visible = flames.visible = ph === 'night'; if (ghost) ghost.model.visible = ph === 'night';
    }
    // cờ: kéo lên 6:30 → 6:45, phấp phới
    const lift = Math.min(1, Math.max(0, (h - 6.5) / 0.25)), fy = h >= 6.5 && h < 18.5 ? Y + 2 + lift * 10.9 : Y + 2; flag.position.y = fy;
    { const pa = flag.geometry.attributes.position, p0 = flag.userData.p0; for (let i = 0; i < pa.count; i++) { const x = p0[i * 3]; pa.setZ(i, Math.sin(x * 2.2 - t * 5) * 0.12 * x / 2.6); } pa.needsUpdate = true; }
    // nến bay
    if (candles.visible) { candles.userData.c.forEach((c, i) => { const y = c.y + Math.sin(t * 0.8 + c.ph) * 0.3, [x, z] = W(c.u + Math.sin(t * 0.1 + c.ph) * 2, c.v); o3.position.set(x, y, z); o3.updateMatrix(); candles.setMatrixAt(i, o3.matrix); o3.position.y = y + 0.25; o3.updateMatrix(); flames.setMatrixAt(i, o3.matrix); }); candles.instanceMatrix.needsUpdate = flames.instanceMatrix.needsUpdate = true; }
    // học sinh
    for (const k of kids) {
      if (!k.hero) continue;
      if (!k.tgt) {
        if (ph === 'flag') k.tgt = lineSpot(k.i); else if (ph === 'sorting') k.tgt = [HALL_HOUSE.orb[0] + 3.4 + Math.floor(k.i / 2) * 1.3, (k.i % 2 ? 1 : -1) * 1.1]; else if (ph === 'dinner') k.tgt = seatSpot(k.i); else if (ph === 'class' || (ph === 'night' && k.i % 3)) k.tgt = doorSpot(k.i);   // vào lớp / đêm: phần lớn về phòng ngủ
        else k.tgt = [-2 - Math.random() * 38, (Math.random() - 0.5) * 40];
        k.wait = 0;
        if (k.snap) { k.snap = false; const [sx, sz] = W(...k.tgt), d0 = Math.hypot(sx - k.pos.x, sz - k.pos.z); if (d0 > 13) { k.pos.x = sx + (k.pos.x - sx) / d0 * 13; k.pos.z = sz + (k.pos.z - sz) / d0 * 13; } }   // đổi giờ: đặt cách đích ≤ 13 m
      }
      const [tu, tv] = k.tgt, [x, z] = W(tu, tv), dx = x - k.pos.x, dz = z - k.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.3) { const sp = (d > 5 ? 3 : 1.4) * dt; k.pos.x += dx / d * Math.min(sp, d); k.pos.z += dz / d * Math.min(sp, d); k.yaw = Math.atan2(dx, dz); play(k, d > 5 ? 'run' : 'walk'); }
      else {
        if (ph === 'flag') { k.yaw = 0; play(k, 'idle'); } else if (ph === 'dinner') { k.yaw = tv < 0 ? PI / 2 : -PI / 2; play(k, 'sit'); }
        else if (ph === 'class' || (ph === 'night' && k.i % 3)) k.hide = true; else { play(k, 'idle'); if ((k.wait += dt) > 4 + k.i) k.tgt = null; }
      }
      k.hero.model.visible = !k.hide;
      k.hero.model.position.set(k.pos.x, Y + (k.clip === 'sit' && d <= 0.3 ? 0.05 : 0), k.pos.z); k.hero.model.rotation.y = k.yaw;
      if (!k.hide && cam.distanceTo(k.pos) < 55) k.hero.anim.update(dt);
    }
    // Ma Cụ Đồ
    const p = player.pos, [pu, pv] = toLocal(p.x, p.z);
    if (ghost && ghost.model.visible) {
      const [gx, gz] = W(-13, 5.5); ghost.model.position.set(gx, Y + 0.6 + Math.sin(t * 1.3) * 0.25, gz); ghost.model.rotation.y = Math.atan2(p.x - gx, p.z - gz); ghost.anim.update(dt);
      if (Math.hypot(pu + 13, pv - 5.5) < 4 && !interior.inside) ctx.offer('👻 Nghe Ma Cụ Đồ kể chuyện', () => {
        const [n, s, subj] = TALES[tale++ % TALES.length]; ctx.sfx && ctx.sfx('magic');
        ctx.toast(`👻 <b>Ma Cụ Đồ</b> kể: <b>${n}</b> — ${s}`, 9000);
        setTimeout(() => magic.ask(subj, () => ctx.toast('👻 Cụ Đồ gật gù: “Giỏi lắm, trò ngoan!” ✨', 3000), '👻 Cụ Đồ đố trò một câu'), 9500);
      }, 8);
    }
    // chào cờ cùng các bạn
    if (ph === 'flag' && !interior.inside && Math.hypot(pu - POLE[0] + 7, pv) < 6) ctx.offer('🇻🇳 Đứng nghiêm chào cờ', () => { ctx.sfx && ctx.sfx('bell'); ctx.toast('🇻🇳 Cả trường đứng nghiêm hát Quốc ca. Lá cờ <b>đỏ sao vàng</b> năm cánh — em biết không, Quốc ca Việt Nam là bài <b>“Tiến quân ca”</b> của nhạc sĩ Văn Cao. +3 điểm nhà!', 7000); ctx.houses && ctx.houses.addPoints(3, 'Chào cờ'); }, 7);
    // lễ chọn nhà: mỗi 5 s một bạn bước lên quả cầu → quả cầu lóe màu nhà
    if (ph === 'sorting' && kids.length) {
      const k = Math.floor(t / 5) % kids.length, kid = kids[k], HN = [['Nhà Long', '#ff5a4a'], ['Nhà Phụng', '#5aa0ff'], ['Nhà Lân', '#5ad070'], ['Nhà Quy', '#b07aff']], hn = HN[(k * 3 + Math.floor(t / 5 / kids.length)) % 4];
      if (k !== sortK) { sortK = k; if (kid.hero) kid.tgt = [HALL_HOUSE.orb[0] + 1.6, 0]; const prevKid = kids[(k + kids.length - 1) % kids.length]; if (prevKid) prevKid.tgt = seatSpot(prevKid.i);
        orbFx.material.color.set(hn[1]); if (!interior.inside && pu > H.u0 && pu < H.u1 + 3 && Math.abs(pv) < H.v1 && t - sortToastT > 34) { sortToastT = t;   // 1 lần mỗi 34 s (trước: mỗi 5 s, đè mất lời nhắc khác) ctx.sfx && ctx.sfx('magic'); ctx.toast(`🔮 Quả cầu Tứ Linh sáng rực màu… <b style="color:${hn[1]}">${hn[0]}</b>! Cả sảnh vỗ tay chào bạn mới. 👏`, 4000); } }
      orbFx.visible = true; const f = (t % 5) / 5; orbFx.scale.setScalar(1.5 + Math.sin(f * Math.PI) * 3.4);
    } else if (orbFx) orbFx.visible = false;
    // món ăn hiện ra bằng phép: hạt sáng xoáy trên bàn 2,6 s đầu giờ ăn
    if (feastFx) { const e = t - feastT; feastFx.visible = ph === 'dinner' && e < 3.2; if (feastFx.visible) { for (let i = 0; i < 55; i++) { const tb = [-6.5, -2.2, 2.2, 6.5][i % 4], u = H.u0 + 9.5 + (i * 7 % 21), a = e * 4 + i, [x, z] = W(u + Math.cos(a) * 0.6, tb + Math.sin(a) * 0.4); o3.position.set(x, Y + 0.9 + Math.max(0, 2.2 - e) * 0.8 + Math.sin(a) * 0.2, z); o3.rotation.set(0, 0, 0); o3.scale.setScalar(Math.max(0.2, 1.4 - e * 0.35)); o3.updateMatrix(); feastFx.setMatrixAt(i, o3.matrix); } feastFx.instanceMatrix.needsUpdate = true; } }
    if (myDish) { const e = t - myDish.t0; myDish.m.scale.setScalar(Math.min(1, e * 2) * 0.9); myDish.m.rotation.y = e * 0.5; if (e > 30) { G.remove(myDish.m); myDish = null; } }
    if (ph === 'dinner' && !interior.inside && pu > H.u0 + 8 && pu < H.u1 - 4 && Math.abs(pv) < H.v1 && !myDish) ctx.offer('✨ Gọi món bằng phép', () => {
      const D = [['🍜 Phở bò', 'tinh bột (bánh phở) + đạm (thịt bò) + rau thơm'], ['🍚 Cơm tấm', 'tinh bột + đạm + rau dưa'], ['🥗 Gỏi cuốn', 'rau sống + tôm (đạm) + bún'], ['🍲 Canh chua', 'cá (đạm) + rau + cà chua (vitamin C)'], ['🍉 Dưa hấu', 'nhiều nước và vitamin']], d = D[Math.floor(Math.random() * D.length)];
      magic.ask('toan', () => loadModel('kit/kk_plate_food_A').then(m => { if (!m || !G) return; const pp = player.pos; m.position.set(pp.x + Math.sin(player.rot || 0) * 1.2, Y + 0.82, pp.z + Math.cos(player.rot || 0) * 1.2); m.scale.setScalar(0.01); G.add(m); myDish = { m, t0: performance.now() / 1000 }; feastT = t; ctx.sfx && ctx.sfx('magic');
        ctx.toast(`✨ <b>Vút!</b> ${d[0]} hiện ra trước mặt em! Bữa ăn cân bằng: ${d[1]}.`, 6000); }), '✨ Đọc đúng thần chú (giải phép tính) để gọi món');
    }, 7.5);
    if (ph === 'dinner' && !interior.inside && pu > H.u0 && pu < H.u1 && Math.abs(pv) < H.v1) ctx.offer('🍽️ Ngồi ăn tối cùng các bạn', () => { magic.setMana && magic.setMana((magic.mana || 0) + 21); ctx.toast('🍽️ Cơm canh nóng hổi! Ăn đủ chất: <b>tinh bột</b> cho sức, <b>đạm</b> để lớn, <b>rau</b> có vitamin. +21 năng lượng phép.', 6000); }, 6);
    if (fest && fest.id && !interior.inside && pu > H.u0 && pu < H.u1 && Math.abs(pv) < 3 && pu < H.u0 + 8) ctx.offer(fest.id === 'tet' ? '🧧 Nhận lì xì đầu năm' : '🥮 Phá cỗ Trung Thu', () => magic.ask(fest.id === 'tet' ? COOK[3] : 'khoahoc', () => { ctx.account && ctx.account.addCoins(5); ctx.toast(fest.id === 'tet' ? '🧧 Lì xì <b>+5 🪙</b>! Chúc em năm mới học giỏi.' : '🥮 Bánh nướng, bánh dẻo cho em! <b>+5 🪙</b>', 4000); }, fest.id === 'tet' ? '🧧 Đố vui ngày Tết' : '🏮 Đố vui Trung Thu'), 7);
  }
  return { build, unbuild, update, phase: () => phase(hour()), get fest() { return fest && fest.id; } };
}
