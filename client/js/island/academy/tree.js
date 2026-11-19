// academy/tree.js — CỤ ĐA NGÀN NĂM: cây đa cổ thụ biết nói ở Sân Thảo Mộc (nguyên bản, hiền lành, kiểu cây đa làng Việt).
// Khung cắm (index.js đã nối): create(ctx, magic, { toWorld, toLocal, L, Y }) → { build(), unbuild(), update(dt, t) }.
// Tỷ lệ φ/Fibonacci: cao 34 m · tán r 21 (34/21 ≈ φ) · thân chạc 13 m, r gốc 3,4 → 2,1 · 8 rễ bạnh · 55 chùm lá theo góc vàng 137,5°.
// Hiệu năng: 7 draw call (thân + tán + rễ = 1 mesh có shader gió · mí mắt · lông mày · miệng · lá rơi instancing · hoa/đom đóm Points)
// · ≈ 3,6 k tam giác · hoạt hoạ = vài uniform + 34 ma trận lá rơi + 21 điểm đom đóm mỗi khung.
// Lối chơi: lại gần ≤ 8 m → cây thức dậy, chào; nút "📖 Nghe chuyện" / "❓ Câu đố" xen kẽ; phép 🌱 Mọc lên lên cây cũng hỏi đố.
// Trả lời đúng: +21 năng lượng phép, cây nở thêm 13 hoa pha lê (tối đa 89) + đom đóm bay vòng 21 s.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { toon } from '../style.js';

const PHI = 1.618, GA = Math.PI * (3 - Math.sqrt(5));         // góc vàng ≈ 137,5°
const AT = { u: -47, v: 72 };                                  // tâm gốc (cục bộ): giữa thư viện (u ≤ −85) và nhà kính (u ≥ −21)
const TALK_R = 8, SLEEP_R = 13, H = 34, R = 21, N_LEAF = 34, N_FLY = 21, N_FLOWER = 89;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const Q = (icon, q, choices, explain) => ({ icon, q, choices, a: 0, explain });   // đáp án đúng luôn đứng đầu (magic.ask tự xáo)

// ---------- chuyện kể: kiến thức thật về cây xanh, quang hợp, rừng Việt Nam + cổ tích ----------
const STORIES = [
  'Ta là <b>cây đa</b>, họ hàng với cây sung, cây si. Cành ta buông <b>rễ phụ</b> xuống đất; rễ chạm đất thì lớn thành cột chống, nên một cây đa già có thể toả rộng như cả một khu rừng nhỏ.',
  'Cháu có biết <b>quang hợp</b> không? Lá ta có chất <b>diệp lục</b> màu xanh, hứng ánh nắng, lấy <b>nước</b> từ rễ và khí <b>các-bô-níc</b> trong gió để làm ra đường nuôi cây — rồi nhả <b>ô-xi</b> cho cháu thở.',
  'Ngày xưa ở làng quê, gốc đa đầu làng là nơi mọi người nghỉ chân, trẻ con nô đùa: <b>"cây đa, giếng nước, sân đình"</b>. Trong truyện cổ tích, <b>chú Cuội</b> ôm cây đa thần bay lên cung trăng, đến giờ vẫn ngồi dưới gốc đa đấy!',
  '<b>Vườn quốc gia Cúc Phương</b> (Ninh Bình), mở năm 1962, là vườn quốc gia đầu tiên của Việt Nam. Ở đó có <b>cây chò xanh</b> hơn nghìn năm tuổi, cao như toà nhà mười mấy tầng.',
  'Ở rừng ngập mặn <b>Cần Giờ</b> và <b>Cà Mau</b>, cây đước có <b>rễ chống</b> như cà kheo cắm xuống bùn. Rừng ấy che chắn sóng gió cho làng ven biển và là nhà của cá, tôm, cua, chim.',
  'Mỗi năm thân cây lớn thêm một <b>vòng gỗ</b>. Cưa ngang một khúc gỗ, đếm số vòng là biết cây bao nhiêu tuổi. Ta thì nhiều vòng lắm, đếm mỏi tay luôn!',
  'Lá mọc quanh cành thường lệch nhau một góc ≈ <b>137,5°</b> — góc vàng, họ hàng của số <b>φ ≈ 1,618</b>. Nhờ vậy lá dưới ít bị lá trên che, lá nào cũng được tắm nắng.',
  'Rừng được gọi là <b>lá phổi xanh</b>: hút khí các-bô-níc, nhả ô-xi, giữ nước mưa trong đất, chống lũ và sạt lở. Mỗi cây cháu trồng hôm nay là một món quà cho mai sau.',
];
const QUIZ = [
  Q('🔬', 'Để quang hợp, lá cây cần những gì?', ['Ánh sáng, nước, khí các-bô-níc', 'Chỉ cần đất', 'Bóng tối và muối', 'Chỉ cần gió'], 'Lá dùng <b>ánh sáng</b>, <b>nước</b> và <b>khí các-bô-níc</b> để làm ra chất dinh dưỡng, nhả ô-xi.'),
  Q('🔬', 'Chất màu xanh trong lá giúp cây quang hợp tên là gì?', ['Diệp lục', 'Tinh bột', 'Nhựa cây', 'Sắc tố đỏ'], '<b>Diệp lục</b> hấp thụ ánh sáng Mặt Trời — vì thế lá có màu xanh.'),
  Q('🔬', 'Khi quang hợp, cây nhả ra khí gì cho chúng ta thở?', ['Ô-xi', 'Các-bô-níc', 'Khói', 'Hơi muối'], 'Cây hút các-bô-níc, nhả <b>ô-xi</b>.'),
  Q('🌿', 'Rễ phụ của cây đa mọc ra từ đâu?', ['Từ cành, buông xuống đất', 'Từ hoa', 'Từ lá', 'Từ quả'], 'Rễ phụ mọc từ <b>cành</b>, buông xuống, chạm đất thì thành cột chống đỡ tán.'),
  Q('🌿', 'Đếm số vòng gỗ trên thân cây để biết điều gì?', ['Tuổi của cây', 'Chiều cao của cây', 'Số lá', 'Màu hoa'], 'Mỗi năm thêm một vòng → đếm vòng là biết <b>tuổi cây</b>.'),
  Q('🌿', 'Cây đước ở rừng ngập mặn có loại rễ đặc biệt nào?', ['Rễ chống như cà kheo', 'Rễ củ', 'Không có rễ', 'Rễ mọc lên trời'], '<b>Rễ chống</b> giữ cây đứng vững trong bùn, cản sóng.'),
  Q('🗺️', 'Vườn quốc gia đầu tiên của Việt Nam là vườn nào?', ['Cúc Phương', 'Phong Nha – Kẻ Bàng', 'Cát Tiên', 'Ba Vì'], '<b>Cúc Phương</b> (Ninh Bình) thành lập năm 1962.'),
  Q('🗺️', 'Rừng ngập mặn Cần Giờ thuộc tỉnh, thành phố nào?', ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Lào Cai'], 'Cần Giờ là huyện ven biển của <b>TP. Hồ Chí Minh</b>, khu dự trữ sinh quyển thế giới.'),
  Q('🗺️', 'Dãy núi dài nhất Việt Nam, phủ nhiều rừng già, là dãy nào?', ['Trường Sơn', 'Hoàng Liên Sơn', 'Bạch Mã', 'Tam Đảo'], 'Dãy <b>Trường Sơn</b> dài hơn 1 000 km, chạy dọc miền Trung.'),
  Q('🔬', 'Vì sao rừng được gọi là "lá phổi xanh"?', ['Hút các-bô-níc, nhả ô-xi', 'Vì lá giống phổi', 'Vì rừng biết thở ra khói', 'Vì rừng màu xanh dương'], 'Rừng <b>hút các-bô-níc, nhả ô-xi</b>, làm không khí trong lành.'),
];

export function create(ctx, magic, { toWorld, toLocal, L, Y, cfg }) {
  // cfg (tuỳ chọn): dựng thêm cây biết nói khác (Rừng Phép Thuật) — vị trí, khoá lưu, tên, chuyện kể, câu đố, lời chào
  const C = Object.assign({ at: AT, key: 'academy.tree', name: 'Cụ Đa', stories: STORIES, quiz: QUIZ, hello: null }, cfg);
  const st = load(C.key, { bloom: 0, n: 0, s: 0 });
  let g = null, A = null, colAdded = false;

  // ống nối 2 điểm (cành, rễ): r0 ở a, r1 ở c
  const _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  function tube(b, a, c, r0, r1, col, seg = 6, open = false) {
    const A0 = new THREE.Vector3(...a), d = new THREE.Vector3(...c).sub(A0), len = d.length();
    const geo = new THREE.CylinderGeometry(r1, r0, len, seg, 1, open).translate(0, len / 2, 0);
    geo.applyQuaternion(_q.setFromUnitVectors(_up, d.normalize())); geo.translate(A0.x, A0.y, A0.z); b.add(geo, col);
  }
  let seed = 1618; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // ngẫu nhiên cố định

  function build() {
    if (g) return;
    seed = 1618;
    const [wx, wz] = toWorld(C.at.u, C.at.v), gy = Math.max(Y, ctx.terrain.heightAt(wx, wz)) - 0.1;
    g = new THREE.Group(); g.name = 'academy-tree'; g.position.set(wx, gy, wz);
    const [ex, ez] = toWorld(0, 40);   // mặt cây nhìn về lối vào Sân Thảo Mộc (khe dãy ngăn v 32–40, |u| < 5)
    g.rotation.y = Math.atan2(ex - wx, ez - wz);
    ctx.scene.add(g);

    // ---------- 1 mesh: thân + rễ + cành + tán + mặt tĩnh (shader gió theo độ cao) ----------
    const b = new Batch(), bark = '#7a5a3e', barkD = '#5e4330', barkL = '#8a6646', rootC = '#8d6d4e';
    b.add(new THREE.CylinderGeometry(8, 8.6, 0.2, 13), '#56743f', 0, 0.05, 0);                              // thảm rêu quanh gốc r 8
    b.cyl(0, 0, 0, 4.2, 3, bark, 12, 2.9); b.cyl(0, 3, 0, 2.9, 7, bark, 12, 2.4); b.cyl(0, 10, 0, 2.4, 4, bark, 12, 1.9);   // thân 3 đoạn, bạnh gốc
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2; tube(b, [Math.cos(a) * 2.4, 1.9, Math.sin(a) * 2.4], [Math.cos(a) * 6.8, -0.3, Math.sin(a) * 6.8], 0.9, 0.3, barkD, 6); }   // 8 rễ bạnh
    // cành chính: 7 nhánh toả theo góc vàng + 2 nhánh vươn thẳng
    const limbs = [];
    for (let k = 0; k < 7; k++) {
      const a = k * GA, Lk = 12 + rnd() * 3, y1 = 17 + rnd() * 4, p0 = [Math.cos(a) * 0.8, 12.5, Math.sin(a) * 0.8], p1 = [Math.cos(a) * Lk, y1, Math.sin(a) * Lk];
      tube(b, p0, p1, 1.05, 0.45, bark, 6); limbs.push([p0, p1]);
      for (const s of [-0.42, 0.42]) tube(b, p1, [Math.cos(a + s) * (Lk + 5), y1 + 3.5, Math.sin(a + s) * (Lk + 5)], 0.45, 0.18, bark, 5);
    }
    for (const a of [0.9, 4.1]) tube(b, [0, 13.5, 0], [Math.cos(a) * 4, 25, Math.sin(a) * 4], 1.0, 0.4, bark, 6);
    // tán: 55 chùm lá trên vòm, xếp theo góc vàng (tâm vòm 30 m, mép 21 m, đỉnh lá ≈ 34 m)
    const greens = ['#4f8a3c', '#5f9a44', '#3f7434', '#6fa84a', '#467f39'], clumps = [];
    for (let i = 0; i < 55; i++) {
      const r = (R - 2.5) * Math.sqrt((i + 0.5) / 55), a = i * GA, y = 21 + 9 * (1 - (r / R) ** 2), s = 4.2 + rnd() * 1.8;
      b.add(new THREE.IcosahedronGeometry(1, 0), greens[i % 5], Math.cos(a) * r, y, Math.sin(a) * r, rnd() * 6, 0, 0, s, s * 0.62, s);
      clumps.push([Math.cos(a) * r, y, Math.sin(a) * r, s]);
    }
    // rễ phụ buông: 3 sợi / cành chính + sợi rủ từ mép tán; 4 rễ chạm đất thành cột (va chạm)
    const props = [];
    limbs.forEach(([p0, p1], k) => {
      for (const t of [0.45, 0.72, 0.96]) {
        const p = p0.map((x, i) => x + (p1[i] - x) * t);
        if (k % 2 === 0 && t === 0.72 && props.length < 4) { tube(b, p, [p[0] * 1.04, -0.3, p[2] * 1.04], 0.3, 0.45, rootC, 6); props.push([p[0] * 1.04, p[2] * 1.04]); }
        else tube(b, p, [p[0], 1.5 + rnd() * 7, p[2]], 0.1, 0.07, rootC, 4, true);
      }
    });
    for (let i = 0; i < 13; i++) { const [x, y, z, s] = clumps[42 + (i % 13)]; tube(b, [x, y - s * 0.5, z], [x * 1.02, 4 + rnd() * 8, z * 1.02], 0.09, 0.06, rootC, 4, true); }
    // mặt hiền trên thân (nhìn về +z): bướu gỗ làm nền mặt, hốc mắt, lòng trắng, con ngươi, mũi mấu gỗ, má, môi cười
    const FZ = 2.12, eyeY = 7.4, EX = 0.8;
    b.add(new THREE.SphereGeometry(1, 10, 8), barkL, 0, 6.6, FZ, 0, 0, 0, 1.9, 2.47, 0.86);
    for (const s of [-1, 1]) {
      b.add(new THREE.SphereGeometry(1, 8, 6), '#4e3624', s * EX, eyeY, 2.7, 0, 0, 0, 0.62, 0.62, 0.28);
      b.add(new THREE.SphereGeometry(1, 8, 6), '#f6f1e6', s * EX, eyeY, 2.75, 0, 0, 0, 0.48, 0.48, 0.26);
      b.add(new THREE.SphereGeometry(1, 6, 4), '#2a2018', s * EX * 0.92, eyeY - 0.04, 2.98, 0, 0, 0, 0.23, 0.25, 0.12);
      b.add(new THREE.OctahedronGeometry(0.075), '#ffffff', s * EX * 0.92 + 0.08, eyeY + 0.07, 3.1);
      b.add(new THREE.SphereGeometry(1, 6, 4), '#b97a5a', s * 1.28, 6.0, 2.66, 0, 0, 0, 0.34, 0.26, 0.14);
    }
    b.add(new THREE.ConeGeometry(0.3, 0.75, 6).rotateX(Math.PI / 2), barkD, 0, 6.55, 3.18);
    b.add(new THREE.TorusGeometry(0.55, 0.09, 4, 10, Math.PI), '#4e3624', 0, 5.62, 2.94, 0, 0, Math.PI);
    const body = new THREE.Mesh(b.build(), windMat()); body.castShadow = true; body.receiveShadow = true; g.add(body);
    // ---------- phần mặt cử động (3 mesh nhỏ) ----------
    const fm = c => toon(c);
    const lidG = merge2(new THREE.SphereGeometry(0.53, 8, 6).scale(1, 1, 0.62).translate(0, -0.53, 0), EX, 2.8);
    const lids = new THREE.Mesh(lidG, fm('#9a7350')); lids.position.y = eyeY + 0.52; g.add(lids);
    const browG = merge2(new THREE.BoxGeometry(0.95, 0.22, 0.32), EX, 2.72, -0.18, 8.28);
    const brows = new THREE.Mesh(browG, fm('#4a3220')); g.add(brows);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6).scale(1, 1, 0.32), fm('#3a2418')); mouth.position.set(0, 5.36, 2.86); g.add(mouth);
    // ---------- lá rơi: 1 InstancedMesh ----------
    const leafM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.22), toon('#8fbf4a', { side: THREE.DoubleSide }), N_LEAF);
    leafM.frustumCulled = false; g.add(leafM);
    const leaves = Array.from({ length: N_LEAF }, () => spawnLeaf({}, true));
    // ---------- hoa pha lê + đom đóm: 1 Points (đom đóm [0, 21) · hoa [21, 110)) ----------
    const pos = new Float32Array((N_FLY + N_FLOWER) * 3), col = new Float32Array((N_FLY + N_FLOWER) * 3), c = new THREE.Color();
    for (let i = 0; i < N_FLY; i++) { c.set('#fff2a0').toArray(col, i * 3); }
    for (let i = 0; i < N_FLOWER; i++) {
      const [x, y, z, s] = clumps[(i * 21) % 55], a = rnd() * 6.283, e = rnd() * 1.3 - 0.55, k = (N_FLY + i) * 3;
      pos[k] = x + Math.cos(a) * Math.cos(e) * s; pos[k + 1] = y + Math.sin(e) * s * 0.62; pos[k + 2] = z + Math.sin(a) * Math.cos(e) * s;
      c.set(['#ffb3d1', '#fff3e0', '#ffd98a', '#e7b3ff'][i % 4]).toArray(col, k);
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), R + 5);
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 1.05, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(pts);
    // va chạm: thân + 4 cột rễ (thêm 1 lần; dỡ đảo khi người chơi đã ở rất xa)
    if (!colAdded) {
      colAdded = true; ctx.colliders.push({ x: wx, z: wz, r: 3.6 });
      for (const [x, z] of props) { const v = new THREE.Vector3(x, 0, z).applyAxisAngle(_up, g.rotation.y); ctx.colliders.push({ x: wx + v.x, z: wz + v.z, r: 0.6 }); }
    }
    // mục tiêu phép 🌱 Mọc lên: niệm lên cây → câu đố Sinh học/Khoa học
    const target = magic.addTarget({ spell: 'grow', pos: new THREE.Vector3(wx, gy + 4, wz), reach: 21, onCast(api) {
      wake('🌱 Ồ, phép <b>Mọc lên</b>! Cành ta thấy ấm hẳn. Trả lời câu đố này, ta sẽ nở hoa cho cháu xem.', 4);
      api.ask(nextQ(), reward, `🌳 Câu đố của ${C.name}`);
    } });
    A = { body, lids, brows, mouth, leafM, leaves, pts, pos, target, wx, wz, gy, awake: false, talk: 0, away: 0, blink: 2, blinkT: 0, lid: 1, swirl: 0, mode: 0, dummy: new THREE.Object3D() };
    refreshBloom();
  }

  // gộp 1 hình thành 2 bản đối xứng trái/phải (mắt, mày)
  function merge2(geo, x, z, rz = 0, y = 0) {
    const b = new Batch();
    for (const s of [-1, 1]) b.add(geo, '#ffffff', s * x, y, z, 0, 0, s * rz);
    const out = b.build(); out.deleteAttribute('color'); return out;
  }
  function windMat() {
    const m = toon('#ffffff', { vertexColors: true, flatShading: true, unique: true });
    m.userData.u = { uT: { value: 0 }, uA: { value: 0.3 } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = 'uniform float uT; uniform float uA;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float hw = max(0.0, position.y - 11.0), w = hw * hw * 0.0025 * uA;
        transformed.x += sin(uT * 1.3 + position.z * 0.17 + position.y * 0.07) * w;
        transformed.z += cos(uT * 1.07 + position.x * 0.17) * w * 0.7;
        transformed.y += sin(uT * 2.1 + position.x * 0.3) * w * 0.12;`);
    };
    m.customProgramCacheKey = () => 'academy-tree-wind';
    return m;
  }
  function dotTex() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const k = cv.getContext('2d'), gr = k.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.38, 'rgba(255,255,255,.62)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = gr; k.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(cv);
  }
  function spawnLeaf(l, first) {
    const r = R * 0.9 * Math.sqrt(Math.random()), a = Math.random() * 6.283;
    l.x = Math.cos(a) * r; l.z = Math.sin(a) * r; l.y = first ? 1 + Math.random() * 24 : 17 + Math.random() * 9;
    l.vy = 0.7 + Math.random() * 0.6; l.ph = Math.random() * 6.283; l.rest = 0; l.rx = Math.random() * 3; l.ry = Math.random() * 3;
    return l;
  }
  function refreshBloom() {
    if (!A) return;
    const night = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0, fly = A.swirl > 0 || night > 0.35;
    const nf = Math.min(N_FLOWER, st.bloom);
    A.pts.geometry.setDrawRange(fly ? 0 : N_FLY, (fly ? N_FLY : 0) + nf);
    A.pts.visible = fly || nf > 0;
  }
  function nextQ() { const q = C.quiz[st.n % C.quiz.length]; return q; }
  function reward() {
    st.n++; st.bloom = Math.min(N_FLOWER, st.bloom + 13); save(C.key, st);
    magic.setMana(magic.mana + 21);
    if (A) { A.swirl = 21; A.talk = 4; refreshBloom(); magic.burst(new THREE.Vector3(A.wx, A.gy + 21, A.wz), new THREE.Vector3(0, 1, 0), '#ffb3d1', 34, 4, 1); }
    ctx.toast(`🌸 ${C.name} cười khà khà: «Giỏi lắm cháu ơi!» Cây nở thêm hoa pha lê, đom đóm bay quanh tán. <b>+21 năng lượng phép</b>.${st.bloom >= N_FLOWER ? ' Tán đa đã nở rực rỡ!' : ''}`, 5500);
  }
  function wake(msg, talk = 4.5) {
    if (!A) return;
    if (!A.awake) { A.awake = true; ctx.sfx && ctx.sfx('magic'); }
    A.away = 0; A.talk = talk; if (msg) ctx.toast(msg, Math.max(3500, talk * 1300));
  }
  function story() {
    const s = C.stories[st.s % C.stories.length]; st.s++; save(C.key, st);
    wake(`🌳 <b>${C.name}</b> kể: «${s}»`, 6); ctx.forestEvent && cfg && ctx.forestEvent('tale');
  }
  function quiz() { wake(null, 2); magic.ask(nextQ(), reward, `🌳 Câu đố của ${C.name}`); }

  function unbuild() {
    if (!g) return;
    magic.removeTarget(A.target); ctx.scene.remove(g);
    g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
    A.body.material.dispose(); A.pts.material.dispose();
    g = null; A = null;
  }

  function update(dt, t) {
    if (!A) return;
    const p = ctx.player.pos, d = Math.hypot(p.x - A.wx, p.z - A.wz), near = d < 144;
    g.visible = d < 296; if (!near) return;
    // thức / ngủ
    const inYard = Math.abs(p.y - A.gy) < 4;
    if (!A.awake && d <= TALK_R && inYard) wake(C.hello || '🌳 Cây đa cổ thụ mở mắt, rung rinh tán lá: «Ồ… chào cháu! Ta là <b>Cụ Đa</b>, đứng ở Sân Thảo Mộc này đã hơn nghìn năm. Cháu muốn nghe chuyện hay giải đố nào?»', 5);
    if (A.awake && d > SLEEP_R) { A.away += dt; if (A.away > 8) A.awake = false; }
    if (A.awake && d <= TALK_R && inYard && !ctx.player.vehicle) {
      if (A.mode === 0) ctx.offer(`📖 ${C.name} kể chuyện`, () => { story(); A.mode = 1; }, 8);
      else ctx.offer(`❓ Câu đố ${C.name}`, () => { quiz(); A.mode = 0; }, 8);
    }
    A.talk = Math.max(0, A.talk - dt); A.swirl = Math.max(0, A.swirl - dt);
    const talking = A.talk > 0, u = A.body.material.userData.u;
    u.uT.value = t; u.uA.value += ((talking ? 1 : A.awake ? 0.42 : 0.26) - u.uA.value) * Math.min(1, dt * 2);
    // mắt: ngủ nhắm, thức mở + chớp
    A.blink -= dt; if (A.blink < 0) { A.blinkT = 0.16; A.blink = 2.6 + Math.random() * 3.4; }
    A.blinkT = Math.max(0, A.blinkT - dt);
    const lidT = !A.awake ? 1 : A.blinkT > 0 ? 1 : 0.1;
    A.lid += (lidT - A.lid) * Math.min(1, dt * (A.awake ? 21 : 3)); A.lids.scale.y = A.lid;
    A.brows.position.y += ((talking ? 0.16 + Math.sin(t * 5) * 0.05 : A.awake ? 0.08 : -0.05) - A.brows.position.y) * Math.min(1, dt * 8);
    A.mouth.scale.y = talking ? 0.35 + 0.75 * Math.abs(Math.sin(t * 8.5) * Math.sin(t * 3.4 + 1)) : A.awake ? 0.3 : 0.18;
    A.mouth.scale.x = talking ? 0.9 + Math.sin(t * 6) * 0.08 : 1;
    // lá rơi (nhiều hơn khi cây nói / vui)
    const rate = talking || A.swirl > 0 ? PHI : 1, D = A.dummy;
    for (let i = 0; i < N_LEAF; i++) {
      const l = A.leaves[i];
      if (l.y <= 0.12) { l.rest += dt; if (l.rest > 3) spawnLeaf(l); }
      else { l.y -= l.vy * rate * dt; l.x += Math.sin(t * 1.3 + l.ph) * dt * 0.8; l.z += Math.cos(t * 1.1 + l.ph) * dt * 0.8; l.rx += dt * 2.1; l.ry += dt * 1.3; if (l.y < 0.12) l.y = 0.12; }
      D.position.set(l.x, l.y, l.z); D.rotation.set(l.y > 0.12 ? l.rx : Math.PI / 2, l.ry, 0); D.updateMatrix(); A.leafM.setMatrixAt(i, D.matrix);
    }
    A.leafM.instanceMatrix.needsUpdate = true;
    // đom đóm bay vòng quanh tán
    refreshBloom();
    if (A.pts.visible && A.pts.geometry.drawRange.start === 0) {
      const P = A.pos, k = A.swirl > 0 ? 1.6 : 0.5;
      for (let i = 0; i < N_FLY; i++) {
        const a = t * 0.21 * k + i * GA, r = 5 + (i % 8) * 2.1 + Math.sin(t * 0.7 + i) * 1.3;
        P[i * 3] = Math.cos(a) * r; P[i * 3 + 1] = 2 + (i % 13) * 1.3 + Math.sin(t * 1.3 + i * 2) * 0.8 + (A.swirl > 0 ? 5 : 0); P[i * 3 + 2] = Math.sin(a) * r;
      }
      A.pts.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { build, unbuild, update, get state() { return A; }, ask: () => quiz(), tell: () => story() };
}
