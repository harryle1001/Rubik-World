// academy/wonders.js — "MỌI THỨ TRONG HỌC VIỆN ĐỀU LÀ PHÉP THUẬT" (nguyên bản, low-poly, greybox):
//  ☁️ Trần đại sảnh phản chiếu bầu trời THẬT: cùng uniform với sky.js (màu trời, mặt trời, trăng, sao) + mây/mưa/cầu vồng theo weather.js
//  🛡️ 8 bộ áo giáp dọc tường đại sảnh — quay đầu nhìn theo, gật đầu chào khi em đi qua
//  📚 21 cuốn sách bay vỗ bìa quanh thư viện · 🧹 3 cây chổi tự quét Sân Đại Sảnh · 🏮 34 đèn lồng trôi lên trời rồi quay lại
//  👻 3 hồn ma thân thiện tuần tra hành lang, kể chuyện lịch sử Việt Nam + đố · 🦉 cú đưa thư (mỗi 89 s một lá thư mẹo/kiến thức)
//  🗿 Tượng Hiền Triết nói tục ngữ, quay đầu nhìn em · 🚪 cửa đại sảnh + thư viện tự mở khi em tới gần
//  ⛲ đài phun nhạc nước: 13 vòi (xoắn Fibonacci) nhảy theo giai điệu ngũ cung tổng hợp (WebAudio) + cầu vồng trong bụi nước khi nắng
// Hiệu năng: mỗi loại 1 draw call (InstancedMesh / Batch); sách, chổi, đèn lồng, giọt nước, cú vỗ cánh chạy HOÀN TOÀN trên GPU
// (1 uniform thời gian chung, 0 JS/khung); JS chỉ cập nhật vài ma trận (giáp, ma, cú, vòi nước, cửa) khi em ở gần. Mỗi khu bật/tắt theo khoảng cách.
// Toạ độ: nhóm đặt tại tâm đảo, x cục bộ = v, z cục bộ = u, y tuyệt đối (như atmos.js / creatures.js).
import * as THREE from 'three';
import { Batch } from './geo.js';
import { toon } from '../style.js';
import { CFG } from '../config.js';

const PHI = 1.618, GOLD = Math.PI * (3 - Math.sqrt(5)), MOB = CFG.isMobile;
const Q = (q, choices, explain) => ({ q, choices, a: 0, explain });
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const pick = a => a[Math.floor(Math.random() * a.length)];
const wrap = a => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ---------- hoạt hoạ trên GPU: local = biến đổi đỉnh trong vật (trước instanceMatrix), group = dịch trong nhóm (sau instanceMatrix) ----------
const U_T = { value: 0 };
const GLSL = 'uniform float uT;\nfloat h1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }\nvec2 r2(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }\n';
function gpu(m, key, local = '', group = '') {
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = U_T;
    sh.vertexShader = GLSL + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n float id = float(gl_InstanceID);\n {' + local + '\n}')
      .replace('#include <project_vertex>', 'vec4 mvPosition = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n mvPosition = instanceMatrix * mvPosition;\n#endif\n {' + group + '\n}\n mvPosition = modelViewMatrix * mvPosition; gl_Position = projectionMatrix * mvPosition;');
  };
  m.customProgramCacheKey = () => 'wonder-' + key;
  return m;
}
const vtoon = key => toon('#ffffff', { vertexColors: true, unique: true });
const glowMat = () => new THREE.MeshBasicMaterial({ vertexColors: true });

// ---------- nội dung ----------
const GHOSTS = [
  { name: 'Cụ Đồ Mực', col: '#cfe8ff', stories: [
    { s: 'Năm <b>1010</b>, vua <b>Lý Thái Tổ</b> dời đô từ Hoa Lư về Đại La, đổi tên là <b>Thăng Long</b> — "rồng bay lên". Ta còn nhớ "Chiếu dời đô" viết đẹp lắm!', q: Q('📜 Thăng Long — tên cũ của Hà Nội — có nghĩa là gì?', ['Rồng bay lên', 'Rồng ngủ yên', 'Sông dài', 'Núi cao'], '"Thăng" là bay lên, "Long" là rồng → <b>rồng bay lên</b>.') },
    { s: 'Năm <b>1070</b>, Văn Miếu được dựng ở Thăng Long để thờ Khổng Tử; năm 1076 có thêm <b>Quốc Tử Giám</b> — trường học dành cho con vua quan và người học giỏi.', q: Q('🏛️ Ở Văn Miếu, tên các tiến sĩ được khắc trên bia đá đặt trên lưng con vật nào?', ['Rùa', 'Hổ', 'Ngựa', 'Voi'], '82 tấm bia tiến sĩ đặt trên lưng <b>rùa đá</b> — rùa tượng trưng cho sự trường tồn.') },
  ] },
  { name: 'Bà Hằng Lụa', col: '#ffe0f0', stories: [
    { s: 'Năm <b>40</b>, hai chị em <b>Trưng Trắc, Trưng Nhị</b> phất cờ khởi nghĩa ở Mê Linh, đánh đuổi quân Đông Hán. Ta dệt lụa may cờ cho nghĩa quân đấy!', q: Q('⚔️ Hai Bà Trưng khởi nghĩa vào năm nào?', ['Năm 40', 'Năm 938', 'Năm 1288', 'Năm 1945'], 'Khởi nghĩa <b>Hai Bà Trưng năm 40</b> — cuộc khởi nghĩa lớn đầu tiên trong thời Bắc thuộc.') },
    { s: 'Năm <b>248</b>, <b>Bà Triệu</b> (Triệu Thị Trinh) cưỡi voi ra trận. Bà nói: "Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ…"', q: Q('🐘 Bà Triệu thường cưỡi con vật nào khi ra trận?', ['Voi', 'Ngựa', 'Trâu', 'Lạc đà'], 'Bà Triệu cưỡi <b>voi</b> — con vật to khoẻ, quen thuộc ở vùng núi Thanh Hoá.') },
  ] },
  { name: 'Chú Lính Thành', col: '#d8ffe8', stories: [
    { s: 'Năm <b>938</b>, <b>Ngô Quyền</b> cắm cọc nhọn bịt sắt dưới sông <b>Bạch Đằng</b>, đánh tan quân Nam Hán — mở ra thời kỳ độc lập lâu dài!', q: Q('🌊 Ngô Quyền dùng gì để đánh tan thuyền giặc trên sông Bạch Đằng?', ['Bãi cọc gỗ nhọn + thuỷ triều', 'Pháo lớn', 'Máy bay', 'Lưới đánh cá'], 'Nước triều lên che kín cọc; triều rút, thuyền giặc <b>mắc cọc</b> vỡ tan.') },
    { s: 'Tết Kỷ Dậu <b>1789</b>, vua <b>Quang Trung</b> hành quân thần tốc ra Bắc, đại phá quân Thanh ở <b>Ngọc Hồi – Đống Đa</b> chỉ trong mấy ngày Tết!', q: Q('🌸 Chiến thắng Ngọc Hồi – Đống Đa của vua Quang Trung diễn ra vào dịp nào?', ['Tết Nguyên đán', 'Tết Trung thu', 'Mùa hè', 'Giáng sinh'], 'Quân Tây Sơn đánh vào dịp <b>Tết Kỷ Dậu 1789</b> — nay mùng 5 Tết vẫn có lễ hội Gò Đống Đa.') },
  ] },
];
const SAYINGS = [
  { s: '"<b>Uống nước nhớ nguồn</b>."', q: Q('🗿 "Uống nước nhớ nguồn" khuyên em điều gì?', ['Biết ơn người đã giúp mình, tổ tiên', 'Uống nhiều nước', 'Đi tìm nguồn suối', 'Tiết kiệm nước'], 'Khi hưởng thành quả, phải <b>nhớ ơn</b> người làm ra nó — ông bà, thầy cô, những người đi trước.') },
  { s: '"<b>Có công mài sắt, có ngày nên kim</b>."', q: Q('🗿 Câu "Có công mài sắt, có ngày nên kim" nói về đức tính gì?', ['Kiên trì, nhẫn nại', 'Khéo tay', 'Tiết kiệm', 'Nhanh nhẹn'], 'Việc khó mấy, <b>kiên trì</b> làm mỗi ngày rồi sẽ thành công.') },
  { s: '"<b>Học thầy không tày học bạn</b>."', q: Q('🗿 "Học thầy không tày học bạn" nghĩa là gì?', ['Học hỏi bạn bè cũng rất quan trọng', 'Không cần học thầy', 'Bạn giỏi hơn thầy', 'Chỉ chơi với bạn'], 'Bạn bè ở gần, cùng tuổi — <b>học lẫn nhau</b> mỗi ngày rất có ích (nhưng vẫn kính thầy!).') },
  { s: '"<b>Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao</b>."', q: Q('🗿 Câu ca dao "Một cây làm chẳng nên non…" khuyên điều gì?', ['Đoàn kết thì sức mạnh lớn', 'Trồng nhiều cây', 'Leo núi cao', 'Đếm đến ba'], '<b>Đoàn kết</b> lại thì làm được việc lớn.') },
  { s: '"<b>Đi một ngày đàng, học một sàng khôn</b>."', q: Q('🗿 "Đi một ngày đàng, học một sàng khôn" — "sàng" ở đây là gì?', ['Cái sàng (dụng cụ đan bằng tre)', 'Cái giường', 'Con đường', 'Ngôi trường'], '<b>Sàng</b> là dụng cụ tre đan để sàng gạo — ý nói đi nhiều nơi học được <b>rất nhiều</b> điều hay.') },
];
const LETTERS = [
  '📜 <b>Thư của Học viện</b>: Nghe đồn có <b>2 bức tranh là cửa bí mật</b> — một ở hành lang, một dọc cầu thang tháp thiên văn. Trả lời đúng câu đố để mở!',
  '📜 <b>Thư của thầy Hiệu trưởng</b>: Đứng gần đài phun nước khi trời nắng, quay lưng về phía Mặt Trời — em sẽ thấy <b>cầu vồng trong bụi nước</b>!',
  '📜 <b>Thư của Thủ thư</b>: Thư viện tối lắm. Chọn phép ☀️ <b>Sáng lên</b> và niệm vào đèn lồng trong đó nhé.',
  '📜 <b>Thư khoa Thiên văn</b>: Ngước lên <b>trần đại sảnh</b> — trần phép phản chiếu đúng bầu trời bên ngoài: mây, mưa, sao và cả Mặt Trăng!',
  '🔬 <b>Em có biết?</b> Cú quay đầu được tới <b>270°</b> vì mắt cú không đảo được trong hốc mắt.',
  '🔬 <b>Em có biết?</b> Đèn lồng giấy bay lên được vì không khí nóng bên trong <b>nhẹ hơn</b> không khí lạnh bên ngoài.',
  '📜 <b>Thư của Ma Chú Lính Thành</b>: Ta và các bạn ma tuần tra hành lang Sân Đại Sảnh — gặp ta, ta kể chuyện lịch sử cho nghe!',
  '🎵 <b>Em có biết?</b> Nhạc dân tộc Việt hay dùng <b>thang 5 âm (ngũ cung)</b> — nhạc nước ở sân cũng chơi đúng 5 âm ấy.',
];
// nhạc nước: giai điệu ngũ cung nguyên bản (bậc: 0 1 2 3 4 = Đô Rê Mi Son La; +5 = quãng tám trên), mỗi phách 0,382 s (1/φ²)
const PENTA = [0, 2, 4, 7, 9], BEAT = 0.382;
const SONG = [0, 1, 2, 4, 3, 2, 1, -1, 2, 3, 4, 6, 5, 4, 3, -1, 4, 3, 2, 1, 2, 3, 1, -1, 0, 2, 1, 0, 1, -1, 0, -1];

export function create(ctx, magic, { toWorld, L, Y }) {
  const C0 = toWorld(0, 0), Hh = L.hall, Lb = L.library, A = L.astro;
  const FT = { u: -13, v: 0 }, ST = { u: -44, v: 14 };   // đài phun nước · tượng (Sân Đại Sảnh)
  let W = null;

  function build() {
    const G = new THREE.Group(); G.name = 'academy-wonders'; G.position.set(C0[0], 0, C0[1]); ctx.scene.add(G);
    const hall = new THREE.Group(), lib = new THREE.Group(), court = new THREE.Group(); G.add(hall, lib, court);
    const o = new THREE.Object3D(), all = [];
    const keep = m => { all.push(m); return m; };

    // ---------- ☁️ trần đại sảnh phản chiếu bầu trời ----------
    const S = ctx.sky && ctx.sky.U, CU = { uCloud: { value: 0 }, uRain: { value: 0 }, uBow: { value: 0 }, uT: U_T };
    if (S) {
      const cw = Hh.v1 - Hh.v0 - 3.2, cl = Hh.u1 - Hh.u0 - 3.2;
      const ceil = keep(new THREE.Mesh(new THREE.PlaneGeometry(cw, cl).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
        uniforms: { uTop: S.uTop, uHor: S.uHor, uSun: S.uSun, uSunCol: S.uSunCol, uMoon: S.uMoon, uNight: S.uNight, ...CU }, fog: false,
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol, uMoon; uniform float uNight, uT, uCloud, uRain, uBow; varying vec2 vP;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
          void main(){
            vec3 d = normalize(vec3(vP.x, 8.9, vP.y));            // hướng nhìn lên "vòm trời" tưởng tượng cao 8,9 m
            float y = d.y; vec3 c = mix(uHor, uTop, smoothstep(0.55, 1.0, y));
            float s = max(dot(d, normalize(uSun)), 0.);
            c += uSunCol * (pow(s, 40.) * 0.5 + smoothstep(0.9975, 0.999, s) * 1.4) * step(0., uSun.y);
            if (uNight > 0.01) { vec2 g = floor(vP * 13.); float r = h(g); c += step(0.93, r) * uNight * (0.5 + 0.5 * sin(uT * (1.5 + r * 5.) + r * 40.)) * smoothstep(0.35, 0.05, length(fract(vP * 13.) - 0.5));
              float m = max(dot(d, normalize(uMoon)), 0.); c += vec3(0.85, 0.9, 1.) * smoothstep(0.9965, 0.998, m) * uNight * step(0., uMoon.y) + vec3(0.3, 0.35, 0.5) * pow(m, 30.) * uNight * 0.4; }
            vec2 q = vP * 0.21 + vec2(uT * 0.013, uT * 0.006); float n = n2(q) * 0.55 + n2(q * 2.3) * 0.3 + n2(q * 5.1) * 0.15;
            float cov = smoothstep(0.66 - uCloud * 0.42, 0.9 - uCloud * 0.3, n);
            c = mix(c, mix(vec3(0.97), vec3(0.5, 0.53, 0.6), uRain) * mix(1., 0.22, uNight), cov * (0.75 + 0.2 * uCloud));
            if (uRain > 0.02) c = mix(c, c * 0.6 + 0.12, uRain * step(0.86, fract(vP.y * 0.9 + vP.x * 0.25 + uT * 2.6 + h(floor(vec2(vP.x * 3., 0.))) )) * 0.5);
            if (uBow > 0.01) { float r = length(vP - vec2(0., 13.)) / 11.; vec3 bow = clamp(abs(fract(vec3(r * 8.) + vec3(0., 0.333, 0.667)) * 6. - 3.) - 1., 0., 1.); c = mix(c, bow, uBow * 0.45 * smoothstep(0.08, 0., abs(r - 1.) - 0.05)); }
            gl_FragColor = vec4(c, 1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      })));
      ceil.position.set(0, Y + Hh.h - 0.15, (Hh.u0 + Hh.u1) / 2); ceil.frustumCulled = false; hall.add(ceil);
    }

    // ---------- 🛡️ áo giáp: thân (1 call) + mũ (1 call) ----------
    const AR = [];
    for (const u of [-77, -69, -61]) for (const s of [-1, 1]) AR.push({ u, v: s * 8.35, face: -s, yaw: 0, nod: 0, told: 0 });
    const bb = new Batch(), steel = '#9aa4ae', dark = '#5d6670', gold = '#c9a24a';
    bb.box(-0.5, 0.5, 0, 0.2, -0.32, 0.32, '#6e6a62');                                             // bệ
    for (const x of [-0.16, 0.16]) { bb.box(x - 0.1, x + 0.1, 0.2, 1.0, -0.1, 0.12, steel); bb.box(x - 0.12, x + 0.12, 0.2, 0.34, -0.12, 0.2, dark); }
    bb.box(-0.32, 0.32, 0.95, 1.2, -0.17, 0.17, dark); bb.box(-0.3, 0.3, 1.15, 1.72, -0.16, 0.18, steel); bb.box(-0.06, 0.06, 1.2, 1.7, 0.17, 0.2, gold);
    for (const s of [-1, 1]) { bb.add(new THREE.SphereGeometry(0.17, 6, 4), steel, s * 0.38, 1.66, 0); bb.box(s * 0.38 - 0.08, s * 0.38 + 0.08, 1.0, 1.55, -0.08, 0.08, steel); }
    bb.cyl(0.52, 0.2, 0.18, 0.025, 2.4, '#6e4a30', 5); bb.add(new THREE.ConeGeometry(0.07, 0.34, 4), steel, 0.52, 2.75, 0.18);   // giáo
    const hb = new Batch();
    hb.box(-0.15, 0.15, 0, 0.32, -0.16, 0.16, steel); hb.box(-0.16, 0.16, 0.12, 0.17, 0.1, 0.17, '#1b1626');                   // mũ + khe mắt
    hb.add(new THREE.ConeGeometry(0.06, 0.34, 5), '#c8302c', 0, 0.48, -0.04, 0, -0.5);                                       // chùm lông đỏ
    const armB = new THREE.InstancedMesh(bb.build(), toon('#ffffff', { vertexColors: true }), AR.length), armH = new THREE.InstancedMesh(hb.build(), toon('#ffffff', { vertexColors: true }), AR.length);
    AR.forEach((a, i) => { o.position.set(a.v, Y + 0.12, a.u); o.rotation.set(0, a.face > 0 ? Math.PI / 2 : -Math.PI / 2, 0); o.scale.setScalar(1.18); o.updateMatrix(); armB.setMatrixAt(i, o.matrix); });
    hall.add(keep(armB), keep(armH));
    const placeHelm = () => { AR.forEach((a, i) => { o.position.set(a.v, Y + 0.12 + 1.72 * 1.18, a.u); o.rotation.set(0, 0, 0, 'YXZ'); o.rotation.y = (a.face > 0 ? Math.PI / 2 : -Math.PI / 2) + a.yaw; o.rotation.x = a.nod; o.scale.setScalar(1.18); o.updateMatrix(); armH.setMatrixAt(i, o.matrix); }); armH.instanceMatrix.needsUpdate = true; };
    o.rotation.order = 'YXZ'; placeHelm();

    // ---------- 📚 sách bay (GPU): quỹ đạo elip quanh thư viện, vỗ bìa ----------
    const NB = MOB ? 13 : 21, bk = new Batch();
    for (const s of [-1, 1]) bk.add(new THREE.BoxGeometry(0.26, 0.02, 0.36).translate(s * 0.13, 0, 0), '#ffffff');        // 2 bìa (mép trong ở x = 0)
    bk.box(-0.02, 0.02, -0.04, 0.0, -0.17, 0.17, '#f3eee2');
    const books = new THREE.InstancedMesh(bk.build(), gpu(vtoon(), 'book',
      `float side = sign(transformed.x); float fl = 0.35 + 0.55 * sin(uT * 7. + id * 1.7);   // vỗ bìa
       transformed.xy = vec2(abs(transformed.x) * cos(fl) * side, transformed.y + abs(transformed.x) * sin(fl));
       float a = uT * (0.21 + h1(id) * 0.2) + id * ${GOLD.toFixed(4)}; transformed.xz = r2(transformed.xz, -a);`,
      `float a = uT * (0.21 + h1(id) * 0.2) + id * ${GOLD.toFixed(4)};
       mvPosition.xyz += vec3(sin(a) * (9. + h1(id + 3.) * 4.), 3.2 + h1(id + 7.) * 6. + sin(uT * 0.9 + id) * 0.6, cos(a) * (2.6 + h1(id + 5.) * 1.4));`), NB);
    const bc = new THREE.Color(); for (let i = 0; i < NB; i++) { o.position.set((Lb.v0 + Lb.v1) / 2, Y, (Lb.u0 + Lb.u1) / 2); o.rotation.set(0, 0, 0); o.scale.setScalar(1.3); o.updateMatrix(); books.setMatrixAt(i, o.matrix); books.setColorAt(i, bc.set(['#7a3b2e', '#2e5a4a', '#3d4f7a', '#8a6a2e', '#5a3d78'][i % 5])); }
    books.frustumCulled = false; lib.add(keep(books));

    // ---------- 🧹 chổi tự quét (GPU) ----------
    const br = new Batch(); br.cyl(0, 0.25, 0, 0.03, 1.5, '#a8744a', 5); br.add(new THREE.ConeGeometry(0.22, 0.42, 6), '#d9b65a', 0, 0.2, 0, 0, Math.PI); br.box(-0.2, 0.2, 0.36, 0.42, -0.05, 0.05, '#7a3b2e');
    const brooms = new THREE.InstancedMesh(br.build(), gpu(vtoon(), 'broom',
      `transformed.xy = r2(transformed.xy, 0.5 * sin(uT * 3.2 + id * 2.));            // vẩy qua lại`,
      `float a = uT * 0.23 + id * 2.094; mvPosition.xyz += vec3(cos(a) * (8. + id * 3.), 0., sin(a * 1.618) * 6.);`), 3);
    for (const [i, bv, bu] of [[0, -14, -36], [1, 14, -36], [2, 0, 5]]) { o.position.set(bv, Y, bu); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); brooms.setMatrixAt(i, o.matrix); }
    brooms.frustumCulled = false; court.add(keep(brooms));

    // ---------- 🏮 đèn lồng trôi (GPU): bay lên 55 m rồi hiện lại dưới thấp ----------
    const NL = MOB ? 21 : 34, lb = new Batch();
    lb.cyl(0, -0.3, 0, 0.26, 0.6, '#ffb84a', 6, 0.32); lb.cyl(0, -0.34, 0, 0.12, 0.06, '#fff1b0', 6);
    const lanterns = new THREE.InstancedMesh(lb.build(), gpu(glowMat(), 'lantern', '',
      `float k = fract(uT * (0.008 + h1(id) * 0.006) + h1(id + 11.)); float rr = 13. + h1(id + 2.) * 55.; float a = id * ${GOLD.toFixed(4)} + uT * 0.02;
       mvPosition.xyz *= smoothstep(0., 0.06, k) * smoothstep(1., 0.85, k);
       mvPosition.xyz += vec3(sin(a) * rr, ${(Y + 3).toFixed(1)} + k * 55. + sin(uT + id) * 0.4, ${FT.u.toFixed(1)} + cos(a) * rr * 0.618);`), NL);
    for (let i = 0; i < NL; i++) { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1.3); o.updateMatrix(); lanterns.setMatrixAt(i, o.matrix); }
    lanterns.frustumCulled = false; G.add(keep(lanterns));

    // ---------- 👻 hồn ma (JS: 3 ma trận) ----------
    const gb = new Batch(); gb.add(new THREE.ConeGeometry(0.55, 1.6, 8, 1, true), '#ffffff', 0, 0.8, 0); gb.add(new THREE.SphereGeometry(0.42, 8, 6), '#ffffff', 0, 1.65, 0);
    for (const s of [-1, 1]) gb.add(new THREE.SphereGeometry(0.08, 5, 4), '#1b1626', s * 0.15, 1.72, 0.36);
    gb.add(new THREE.SphereGeometry(0.06, 5, 4), '#1b1626', 0, 1.52, 0.39);
    const gm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false });
    const ghosts = new THREE.InstancedMesh(gb.build(), gm, GHOSTS.length);
    GHOSTS.forEach((g, i) => { ghosts.setColorAt(i, bc.set(g.col)); g.s = i * 1.3; g.dir = i % 2 ? -1 : 1; g.k = 0; g.p = new THREE.Vector3(); g.yaw = 0; g.stop = 0; });
    ghosts.frustumCulled = false; court.add(keep(ghosts));
    const RU = [-50, 25], RV = 27, per = 2 * (RU[1] - RU[0]) + 4 * RV;   // vòng hành lang quanh Sân Đại Sảnh
    const loop = (s, out) => { s = ((s % per) + per) % per; const a = RU[1] - RU[0], b = 2 * RV; if (s < a) return out.set(-RV, 0, RU[0] + s); s -= a; if (s < b) return out.set(-RV + s, 0, RU[1]); s -= b; if (s < a) return out.set(RV, 0, RU[1] - s); s -= a; return out.set(RV - s, 0, RU[0]); };

    // ---------- 🦉 cú đưa thư (vỗ cánh trên GPU) ----------
    const ob = new Batch(); ob.add(new THREE.SphereGeometry(0.32, 7, 5), '#8a6a4a', 0, 0, 0, 0, 0, 0, 1, 1.15, 1); ob.add(new THREE.SphereGeometry(0.24, 7, 5), '#a8845e', 0, 0.36, 0.06);
    for (const s of [-1, 1]) { ob.add(new THREE.SphereGeometry(0.07, 5, 4), '#ffd34d', s * 0.1, 0.4, 0.26); ob.add(new THREE.BoxGeometry(0.75, 0.05, 0.36), '#6e4a30', s * 0.62, 0.05, -0.02); }
    ob.box(-0.13, 0.13, -0.42, -0.26, 0.1, 0.3, '#fbf6e8');                                            // lá thư cắp dưới chân
    const owl = new THREE.Mesh(ob.build(), gpu(vtoon(), 'owl', `float wf = sin(uT * 13.) * 0.7 * step(0.3, abs(transformed.x)); transformed.y += (abs(transformed.x) - 0.3) * sin(wf) * 1.2;`));
    owl.visible = false; owl.frustumCulled = false; owl.scale.setScalar(1.6); G.add(keep(owl));
    const mail = { t: 0, next: 21, from: new THREE.Vector3(A.v, Y + 70, A.u), p: new THREE.Vector3(), to: new THREE.Vector3(), q: 0 };

    // ---------- 🗿 tượng hiền triết: bệ + thân (1 call) · đầu (1 call) ----------
    const sb = new Batch(), stone = '#b8b0a2', stoneD = '#8a857c';
    sb.box(-0.9, 0.9, 0, 1.2, -0.9, 0.9, stoneD); sb.box(-1.0, 1.0, 1.2, 1.35, -1.0, 1.0, stone);
    sb.cyl(0, 1.35, 0, 0.62, 1.9, stone, 8, 0.42); sb.box(-0.5, 0.5, 2.9, 3.3, -0.3, 0.3, stone);                // áo dài phủ chân · vai
    sb.add(new THREE.BoxGeometry(0.5, 0.36, 0.08), '#a89a86', 0, 2.6, 0.55, 0, -0.5);                           // quyển sách đá ôm trước ngực
    const sh = new Batch(); sh.add(new THREE.SphereGeometry(0.36, 8, 6), stone, 0, 0.36, 0); sh.add(new THREE.ConeGeometry(0.3, 0.42, 6), stoneD, 0, 0.84, 0);
    sh.add(new THREE.ConeGeometry(0.16, 0.5, 5), stone, 0, 0.0, 0.2, 0, Math.PI);                              // râu
    for (const s of [-1, 1]) sh.add(new THREE.SphereGeometry(0.06, 5, 4), '#7fd3ff', s * 0.13, 0.42, 0.31);    // mắt pha lê
    const statue = new THREE.Mesh(sb.build(), toon('#ffffff', { vertexColors: true })), head = new THREE.Mesh(sh.build(), toon('#ffffff', { vertexColors: true }));
    statue.position.set(ST.v, Y, ST.u); head.position.set(ST.v, Y + 3.3, ST.u); court.add(keep(statue), keep(head));
    const stat = { yaw: 0, told: -99 };

    // ---------- 🚪 cửa tự mở: 2 cánh đại sảnh (6 × 8 m) + 2 cánh thư viện (5 × 6 m) ----------
    const lc = (Lb.v0 + Lb.v1) / 2;
    const DOORS = [
      { u: Hh.u1 - 0.8, v: -3, w: 3, h: 8, s: 1, room: 'hall' }, { u: Hh.u1 - 0.8, v: 3, w: 3, h: 8, s: -1, room: 'hall' },
      { u: Lb.u1 - 0.6, v: lc - 2.5, w: 2.5, h: 6, s: 1, room: 'lib' }, { u: Lb.u1 - 0.6, v: lc + 2.5, w: 2.5, h: 6, s: -1, room: 'lib' },
    ].map(d => ({ ...d, ang: 0, target: 0 }));
    const dg = new Batch(); dg.box(0, 1, 0, 1, -0.06, 0.06, '#6e4a30'); dg.box(0.04, 0.96, 0.46, 0.5, 0.06, 0.08, '#c9a24a'); dg.box(0.04, 0.96, 0.04, 0.08, 0.06, 0.08, '#c9a24a');
    dg.box(0.85, 0.9, 0.45, 0.55, 0.06, 0.12, '#c9a24a');                                                     // tay nắm
    const doors = new THREE.InstancedMesh(dg.build(), toon('#ffffff', { vertexColors: true }), DOORS.length);
    const placeDoor = (d, i) => { o.position.set(d.v, Y, d.u); o.rotation.set(0, d.s > 0 ? d.ang : Math.PI - d.ang, 0); o.scale.set(d.w, d.h, 1); o.updateMatrix(); doors.setMatrixAt(i, o.matrix); doors.instanceMatrix.needsUpdate = true; };
    DOORS.forEach(placeDoor); doors.frustumCulled = false; G.add(keep(doors));

    // ---------- ⛲ đài phun nhạc nước ----------
    const fb = new Batch(), RB = 3.4;
    fb.add(new THREE.CylinderGeometry(RB, RB + 0.2, 0.62, 21), '#b8b0a2', FT.v, Y + 0.31, FT.u); fb.add(new THREE.CylinderGeometry(RB - 0.3, RB - 0.3, 0.06, 21), '#3f8fb0', FT.v, Y + 0.5, FT.u);
    fb.add(new THREE.CylinderGeometry(0.34, 0.5, 1.3, 8), '#b8b0a2', FT.v, Y + 0.65, FT.u); fb.add(new THREE.SphereGeometry(0.42, 8, 6), '#9fd9c4', FT.v, Y + 1.5, FT.u);
    const basin = new THREE.Mesh(fb.build(), toon('#ffffff', { vertexColors: true })); court.add(keep(basin));
    const NJ = 13, JET = [];
    for (let i = 0; i < NJ; i++) { const r = 0.4 + Math.sqrt((i + 0.5) / NJ) * (RB - 0.9), a = i * GOLD; JET.push({ x: FT.v + Math.sin(a) * r, z: FT.u + Math.cos(a) * r, h: 0.4 }); }
    const jets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.12, 1, 6).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#d8f2ff', transparent: true, opacity: 0.72, depthWrite: false }), NJ);
    jets.frustumCulled = false; court.add(keep(jets));
    const ND = MOB ? 89 : 144, dpos = new Float32Array(ND * 3), dsd = new Float32Array(ND);
    for (let i = 0; i < ND; i++) { const j = JET[i % NJ]; dpos.set([j.x, Y + 0.5, j.z], i * 3); dsd[i] = i; }
    const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dgeo.setAttribute('aI', new THREE.BufferAttribute(dsd, 1));
    const DU = { uT: U_T, uAmp: { value: 0.3 } };
    const drops = new THREE.Points(dgeo, new THREE.ShaderMaterial({
      uniforms: DU, transparent: true, depthWrite: false,
      vertexShader: `uniform float uT, uAmp; attribute float aI; varying float vA;
        float h1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
        void main(){ float k = fract(uT * (0.7 + h1(aI) * 0.5) + h1(aI + 1.)); float a = h1(aI + 2.) * 6.283, sp = 0.3 + h1(aI + 3.) * 0.6;
          float H = 1.2 + uAmp * 3.6; vec3 p = position + vec3(cos(a) * sp * k, 4. * H * k * (1. - k), sin(a) * sp * k);
          vA = smoothstep(0., 0.1, k) * (1. - k); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = ${(MOB ? 89 : 55).toFixed(1)} / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: 'varying float vA; void main(){ vec2 c = gl_PointCoord - .5; if (dot(c, c) > .25) discard; gl_FragColor = vec4(0.86, 0.95, 1., vA * 0.8); }',
    }));
    drops.frustumCulled = false; court.add(keep(drops));
    // cầu vồng trong bụi nước (nắng, quay lưng về Mặt Trời): nửa vòng tròn 7 màu, xoay theo hướng Mặt Trời
    const bowM = new THREE.ShaderMaterial({ uniforms: { uO: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform float uO; varying vec2 vU; void main(){ float r = (length(vU) - 2.1) / 0.55; if (r < 0. || r > 1.) discard;
        vec3 c = clamp(abs(fract(vec3(1. - r) * 0.8 + vec3(0., 0.333, 0.667)) * 6. - 3.) - 1., 0., 1.); gl_FragColor = vec4(c, uO * sin(r * 3.1416)); }` });
    const bow = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.65, 34, 1, 0, Math.PI), bowM); bow.position.set(FT.v, Y + 0.6, FT.u); court.add(keep(bow));
    const song = { i: 0, t: 0, amp: 0, told: false };

    W = { G, hall, lib, court, all, AR, armH, placeHelm, ghosts, loop, owl, mail, head, stat, DOORS, doors, placeDoor, JET, jets, DU, bow, bowM, song, CU, statue };
  }

  const _v = new THREE.Vector3(), _w = new THREE.Vector3(), o2 = new THREE.Object3D(); o2.rotation.order = 'YXZ';
  let ghostTold = -99;
  function update(dt, t) {
    if (!W) return;
    U_T.value = t;
    const pp = ctx.player.pos, lu = pp.z - C0[1], lv = pp.x - C0[0], inCastle = Math.abs(pp.y - Y) < 6;
    const dHall = Math.hypot(lu - (Hh.u0 + Hh.u1) / 2, lv), dLib = Math.hypot(lu - (Lb.u0 + Lb.u1) / 2, lv - (Lb.v0 + Lb.v1) / 2), dCourt = Math.hypot(lu - FT.u, lv - FT.v);
    W.hall.visible = dHall < 55; W.lib.visible = dLib < 55; W.court.visible = dCourt < 89;
    W.G.visible = Math.hypot(ctx.camera.position.x - C0[0], ctx.camera.position.z - C0[1]) < 377;
    if (!W.G.visible) return;
    // trần trời
    const wc = ctx.weather ? ctx.weather.cur : { c: 0, r: 0, bow: 0 }; W.CU.uCloud.value = wc.c; W.CU.uRain.value = wc.r; W.CU.uBow.value = wc.bow || 0;
    const busy = ctx.player.vehicle || ctx.player.frozen;
    // giáp: nhìn theo + gật đầu khi em đi qua (≤ 3,4 m)
    if (W.hall.visible) {
      let near = null;
      for (const a of W.AR) {
        const du = lu - a.u, dv = lv - a.v, d = Math.hypot(du, dv), face = a.face > 0 ? Math.PI / 2 : -Math.PI / 2;
        let yawT = d < 8.9 && inCastle ? wrap(Math.atan2(dv, du) - face) : 0; if (Math.abs(yawT) > 1.2) yawT = 0;
        a.yaw += (yawT - a.yaw) * Math.min(1, dt * 3);
        a.nod = d < 3.4 && inCastle ? 0.28 * Math.max(0, Math.sin((t - a.told) * 4)) * (t - a.told < 2.4 ? 1 : 0) : a.nod * 0.9;
        if (d < 3.4 && inCastle && t - a.told > 13) { a.told = t; near = a; }
      }
      W.placeHelm();
      if (near && t - ghostTold > 8 && !busy) { ghostTold = t; ctx.sfx && ctx.sfx('ui'); ctx.toast('🛡️ Bộ áo giáp <b>gật đầu chào</b> em! 🔬 Áo giáp làm bằng <b>sắt thép</b> — để nơi ẩm sẽ bị <b>gỉ</b> (sắt kết hợp với oxi trong không khí), nên người ta lau dầu cho giáp.', 5500); }
    }
    // hồn ma tuần tra; đứng lại quay mặt khi em tới gần
    if (W.court.visible) {
      let best = null, bd = 5;
      GHOSTS.forEach((g, i) => {
        const d0 = Math.hypot(g.p.x - lv, g.p.z - lu);
        g.stop = d0 < 4 && inCastle ? 1 : Math.max(0, g.stop - dt);
        if (!g.stop) g.s += dt * 1.1 * g.dir;
        W.loop(g.s, g.p); const pv = W.loop(g.s + g.dir * 0.5, _v);
        const yawT = g.stop ? Math.atan2(lv - g.p.x, lu - g.p.z) : Math.atan2(pv.x - g.p.x, pv.z - g.p.z);
        g.yaw += wrap(yawT - g.yaw) * Math.min(1, dt * 4);
        o2.position.set(g.p.x, Y + 0.5 + Math.sin(t * 1.6 + i * 2) * 0.25, g.p.z); o2.rotation.set(0, g.yaw, Math.sin(t * 1.1 + i) * 0.08); o2.scale.setScalar(1); o2.updateMatrix(); W.ghosts.setMatrixAt(i, o2.matrix);
        if (d0 < bd) { bd = d0; best = g; }
      });
      W.ghosts.instanceMatrix.needsUpdate = true;
      if (best && !busy && inCastle) {
        const g = best, st = g.stories[g.k % g.stories.length];
        ctx.offer(`👻 Nghe ${g.name} kể chuyện`, () => {
          ctx.sfx && ctx.sfx('whoosh'); ctx.toast(`👻 <b>${g.name}</b>: “${st.s}”`, 8000);
          setTimeout(() => magic.ask(st.q, () => { g.k++; magic.setMana(magic.mana + 13); ctx.toast(`👻 <b>${g.name}</b> cười khúc khích: “Giỏi lắm!” ✨ +13 năng lượng phép.`, 4000); }, `👻 ${g.name} đố em`), 2600);
        }, 7);
      }
      // tượng: quay đầu nhìn theo (≤ 13 m), chào + đố tục ngữ (≤ 4 m)
      const ds = Math.hypot(lu - ST.u, lv - ST.v), yawS = ds < 13 && inCastle ? Math.atan2(lv - ST.v, lu - ST.u) : Math.sin(t * 0.2) * 0.5;
      W.stat.yaw += wrap(yawS - W.stat.yaw) * Math.min(1, dt * 2.6); W.head.rotation.y = W.stat.yaw;
      if (ds < 4 && inCastle && !busy) {
        if (t - W.stat.told > 34) { W.stat.told = t; W.stat.say = pick(SAYINGS); ctx.sfx && ctx.sfx('magic'); ctx.toast(`🗿 <b>Tượng Hiền Triết</b> mở mắt, cất tiếng: “Này trò nhỏ… ông cha ta dạy: ${W.stat.say.s}”`, 6000); }
        const say = W.stat.say || SAYINGS[0];
        ctx.offer('🗿 Tượng đố em', () => magic.ask(say.q, () => { magic.setMana(magic.mana + 13); W.stat.told = -99; ctx.toast('🗿 Tượng Hiền Triết gật gù: “Hay lắm!” ✨ +13 năng lượng phép.', 4000); }, '🗿 Tượng Hiền Triết đố em'), 7);
      }
      // nhạc nước: phát giai điệu khi em ở trong 34 m; vòi nhảy theo nốt
      const S = W.song, near = dCourt < 34 && inCastle;
      S.t += dt;
      while (S.t > BEAT) {
        S.t -= BEAT; const n = SONG[S.i++ % SONG.length];
        if (n >= 0) { const semi = PENTA[n % 5] + 12 * Math.floor(n / 5); if (near) ctx.note && ctx.note(523.25 * 2 ** (semi / 12), 0.12 * (1 - dCourt / 34)); for (let j = n % 5; j < W.JET.length; j += 5) W.JET[j].h = 1.6 + n * 0.55; W.JET[(n * 3 + S.i) % W.JET.length].h = 4.2; S.amp = 1; }
      }
      S.amp *= Math.exp(-dt * 2.2); W.DU.uAmp.value = 0.25 + S.amp * 0.75;
      if (dCourt < 55) { W.JET.forEach((j, i) => { j.h += (0.45 - j.h) * Math.min(1, dt * 2.6); o2.position.set(j.x, Y + 0.5, j.z); o2.rotation.set(0, 0, 0); o2.scale.set(1, j.h, 1); o2.updateMatrix(); W.jets.setMatrixAt(i, o2.matrix); }); W.jets.instanceMatrix.needsUpdate = true; }
      if (near && !S.told && dCourt < 8) { S.told = true; ctx.toast('⛲ <b>Đài phun nhạc nước</b>: 13 vòi nhảy theo giai điệu <b>ngũ cung</b> (5 âm: Đô – Rê – Mi – Son – La) — thang âm quen thuộc của nhạc dân tộc Việt.', 6000); }
      // cầu vồng bụi nước: chỉ ban ngày có nắng; vòng cung đối diện Mặt Trời (xoay theo hướng nắng)
      const sun = ctx.sky && ctx.sky.state ? ctx.sky.state.sunDir : null, day = ctx.sky && ctx.sky.state ? 1 - ctx.sky.state.night : 1;
      const op = sun ? day * (1 - (wc.c || 0) * 0.8) * Math.min(1, W.DU.uAmp.value) * 0.42 : 0;
      W.bow.visible = op > 0.02; if (W.bow.visible) { W.bowM.uniforms.uO.value = op; W.bow.rotation.y = Math.atan2(sun.x, sun.z); }
    }
    // cửa tự mở (≤ 6 m mở, > 9 m đóng)
    W.DOORS.forEach((d, i) => {
      const dist = Math.hypot(lu - d.u, lv - (d.room === 'hall' ? 0 : (Lb.v0 + Lb.v1) / 2)), want = d.force > t || (dist < 6 && inCastle) ? 1.35 : dist > 9 ? 0 : d.target;
      if (want !== d.target) { d.target = want; if (i % 2 === 0 && ctx.sfx) ctx.sfx('door'); }
      if (Math.abs(d.target - d.ang) > 0.002) { d.ang += (d.target - d.ang) * Math.min(1, dt * 2.2); W.placeDoor(d, i); }
    });
    // cú đưa thư: mỗi 89 s khi em ở trong lâu đài
    const M = W.mail;
    if (!M.t && inCastle && !busy && Math.abs(lu + 34) < 75 && Math.abs(lv) < 120 && t > M.next) { M.t = 0.001; M.p.copy(M.from); if (M.near) { M.p.set(lv + 6, Y + 5, lu - 6); M.near = false; } }
    if (M.t) {
      M.t += dt; M.to.set(lv + 1.2, Y + 2.6, lu + 1.2);
      const go = M.got ? M.from : M.to; _w.subVectors(go, M.p); const d = _w.length();
      if (d > 0.3) M.p.addScaledVector(_w.normalize(), Math.min(d, dt * 21));
      W.owl.position.copy(M.p); W.owl.position.y += Math.sin(t * 6) * 0.15; W.owl.rotation.y = Math.atan2(_w.x, _w.z); W.owl.visible = true;
      if (!M.got && (d < 1.5 || M.t > 21)) { M.got = true; M.t = 0.001; ctx.sfx && ctx.sfx('ok'); ctx.toast('🦉 <b>Cú đưa thư</b> thả một lá thư vào tay em! ' + pick(LETTERS), 7000); }
      if (M.got && M.t > 1 && (d < 1 || M.t > 21)) { M.t = 0; M.got = false; M.next = t + 89; W.owl.visible = false; }
    }
  }

  function unbuild() {
    if (!W) return; ctx.scene.remove(W.G);
    W.G.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material && !x.material.userData.shared) x.material.dispose(); if (x.isInstancedMesh) x.dispose(); });
    W = null;
  }
  // gỡ lỗi: __island.wonders.owl(gần?) · .doors(true)
  ctx.wonders = { owl(near) { if (W) { W.mail.next = 0; W.mail.near = near; W.mail.t = 0; W.mail.got = false; } }, doors(open) { if (W) for (const d of W.DOORS) d.force = open ? 1e9 : 0; }, get W() { return W; } };
  return { build, unbuild, update };
}
