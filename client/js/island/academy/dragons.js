// academy/dragons.js — THUNG LŨNG RỒNG (lòng chảo vách 34 m cạnh bìa bắc Rừng Phép Thuật, plan.js VALLEY).
// 4 rồng cánh hiền lành dễ thương (Lửa đỏ · Nước lam · Mây trắng · Rubik nhiều màu) + Rồng Ngọc (rồng Việt thân dài, không cánh):
//  bay lượn vòng thung lũng, đậu trên vách, đêm xuống ngủ dưới lòng chảo (bong bóng ngủ), biểu diễn phun lửa/nước/mây/khối màu lên trời (vô hại).
// Trứng rồng: nhận chăm 1 quả — cho ăn ×2, sưởi ấm ×2, trả lời 1 câu sinh học → nở rồng con thú cưng bay theo khắp thế giới (lưu máy).
// Dựng bằng khối (không có model rồng CC0 có hoạt ảnh tải được trong môi trường làm việc — xem CREDITS.txt).
// Hiệu năng: mỗi rồng 3 draw call (thân + 2 cánh), rồng Việt 2 (InstancedMesh đốt + đầu), trứng 1, hạt 1, cảnh 2 → ≈ 21 call;
// chunk riêng: dựng khi cách vách < 233 m, dỡ khi > 377 m; xa > 144 m cập nhật hoạt ảnh 1/3 khung.
import * as THREE from 'three';
import { CFG } from '../config.js';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';
import { toon } from '../style.js';
import { terrainGeo, GRID } from './island.js';
import { VALLEY, VALLEY_GATE, FOREST, toWorld, toLocal } from './plan.js';
import { dragonSeg, dragonHead } from './creatures.js';

const PI = Math.PI, GA = PI * (3 - Math.sqrt(5)), M = CFG.isMobile;
const LOAD = 233, UNLOAD = 377, LOD = 144, NEAR = 13, KEY = 'academy.dragons';
const Q = (q, choices, explain) => ({ q, choices, a: 0, explain });
export const RUBIK = ['#e8453c', '#3f7fe0', '#f2f2f0', '#f6c445', '#3fae5f', '#f08a2c'];

// ---------- nội dung: thần thoại + kiến thức động vật thật ----------
export const SPECIES = {
  fire: { name: 'Rồng Lửa', emoji: '🔥', pal: { body: '#e8553c', belly: '#ffd08a', wing: '#ff9a4a', horn: '#fff0c8' }, fx: 'fire',
    intro: '🔥 <b>Rồng Lửa</b> hiền lành — hơi thở ấm như bếp lửa, dùng để sưởi ấm tổ trứng.',
    fact: '🔬 Ngoài đời có <b>rồng Komodo</b> (Indonesia): loài thằn lằn lớn nhất thế giới, dài tới 3 m. Bò sát là <b>động vật biến nhiệt</b> nên hay phơi nắng cho ấm.',
    qs: [Q('Loài thằn lằn lớn nhất thế giới có tên là gì?', ['Rồng Komodo', 'Tắc kè', 'Kỳ nhông', 'Thạch sùng'], 'Rồng Komodo dài tới <b>3 m</b>, nặng hơn 70 kg, sống ở các đảo Indonesia.'),
      Q('Vì sao rắn, thằn lằn hay nằm phơi nắng?', ['Thân nhiệt thay đổi theo môi trường nên cần sưởi ấm', 'Để da đen hơn', 'Vì sợ bóng tối', 'Để ngủ ngon'], 'Bò sát là động vật <b>biến nhiệt</b>: phơi nắng giúp cơ thể ấm lên để hoạt động.')] },
  water: { name: 'Rồng Nước', emoji: '💧', pal: { body: '#3f8fe0', belly: '#bfe8ff', wing: '#5fd0e8', horn: '#e8fbff' }, fx: 'water',
    intro: '💧 <b>Rồng Nước</b> lam phun vòi nước lấp lánh thành cầu vồng nhỏ.',
    fact: '🔬 <b>Cá rồng biển lá</b> (biển Úc) ngụy trang như rong biển. Họ hàng của nó là <b>cá ngựa</b> — ở hai loài này <b>con bố</b> mang trứng tới khi nở!',
    qs: [Q('Ở cá ngựa và cá rồng biển, ai mang trứng cho tới khi nở?', ['Con bố', 'Con mẹ', 'Cả đàn thay nhau', 'Không ai, trứng trôi tự do'], 'Cá mẹ đẻ trứng vào <b>túi/đuôi của cá bố</b>, cá bố giữ trứng tới khi nở.'),
      Q('Nước (biển, sông, hồ, băng) che phủ khoảng bao nhiêu bề mặt Trái Đất?', ['Khoảng 71%', 'Khoảng 10%', 'Khoảng 30%', '100%'], 'Khoảng <b>71%</b> bề mặt Trái Đất là nước — vì thế Trái Đất được gọi là "hành tinh xanh".')] },
  cloud: { name: 'Rồng Mây', emoji: '☁️', pal: { body: '#f4f6fb', belly: '#ffffff', wing: '#c9d8f4', horn: '#f6c9e0' }, fx: 'cloud',
    intro: '☁️ <b>Rồng Mây</b> trắng như bông, thổi ra những cụm mây nhỏ rồi rắc mưa phùn cho cây.',
    fact: '🔬 Rừng Việt Nam có <b>thằn lằn bay</b> (chi Draco, còn gọi "rồng bay"): giương màng da giữa các xương sườn để lượn từ cây này sang cây khác.',
    qs: [Q('Thằn lằn bay (Draco) trong rừng Việt Nam lượn được nhờ…?', ['Màng da căng giữa các xương sườn dài', 'Lông vũ như chim', 'Cánh như dơi', 'Túi khí như bóng bay'], 'Nó xoè các <b>xương sườn dài</b> có màng da thành "cánh" để lượn xa tới vài chục mét.'),
      Q('Mây được tạo thành từ…?', ['Hơi nước ngưng tụ thành giọt nhỏ', 'Khói bếp', 'Bông gòn', 'Cát bụi thôi'], 'Hơi nước bốc lên, gặp lạnh <b>ngưng tụ</b> thành giọt rất nhỏ → mây; giọt to dần thì rơi thành mưa.')] },
  rubik: { name: 'Rồng Rubik', emoji: '🧊', pal: { body: '#f6c445', belly: '#f2f2f0', wing: '#3f7fe0', horn: '#e8453c' }, fx: 'rubik', rubik: true,
    intro: '🧊 <b>Rồng Rubik</b> thân ghép từ khối 6 màu, phun ra mưa khối vuông cầu vồng!',
    fact: '🔬 <b>Tắc kè hoa</b> đổi màu nhờ tế bào da chứa tinh thể nano phản chiếu ánh sáng — để giao tiếp, điều hoà nhiệt và ngụy trang.',
    qs: [Q('Khối Rubik 3×3 có mấy mặt, mỗi mặt mấy ô?', ['6 mặt, 9 ô', '4 mặt, 9 ô', '6 mặt, 6 ô', '8 mặt, 4 ô'], 'Khối lập phương có <b>6 mặt</b>, mỗi mặt 3 × 3 = <b>9 ô</b>, tổng 54 ô màu.'),
      Q('Tắc kè hoa đổi màu chủ yếu để làm gì?', ['Giao tiếp, điều hoà nhiệt, ngụy trang', 'Cho đẹp khi đi chơi', 'Vì bị ốm', 'Để ngủ ngon'], 'Màu da giúp tắc kè hoa <b>báo tâm trạng</b> với bạn, hấp thụ/ phản xạ nhiệt và lẩn vào môi trường.')] },
  viet: { name: 'Rồng Ngọc', emoji: '🐉', viet: true,
    intro: '🐉 <b>Rồng Ngọc</b> — rồng Việt thân dài, <b>không cánh</b>, uốn lượn như sóng nước giữa các vách đá.',
    fact: '🔬 Con vật thật bò "uốn lượn" giống rồng là <b>rắn</b>: không có chân, rắn uốn thân hình chữ S, vảy bụng bám mặt đất để đẩy mình đi.',
    qs: [Q('Rắn không có chân, vậy rắn di chuyển bằng cách nào?', ['Uốn thân hình chữ S, vảy bụng bám đất', 'Nhảy bằng đuôi', 'Lăn tròn', 'Bay lượn'], 'Rắn co cơ uốn thân thành sóng <b>chữ S</b>; vảy bụng to bám vào mặt đất đẩy rắn tiến lên.'),
      Q('Năm Thìn (con Rồng) đứng thứ mấy trong 12 con giáp?', ['Thứ 5', 'Thứ 1', 'Thứ 3', 'Thứ 12'], 'Tý, Sửu, Dần, Mão, <b>Thìn</b> — rồng đứng thứ 5.')] },
};
export const EGG_QS = [
  Q('Trứng rùa biển, trứng rắn có vỏ thế nào so với trứng gà?', ['Mềm, dai như da', 'Cứng hơn đá', 'Trong suốt như kính', 'Không có vỏ'], 'Trứng nhiều loài bò sát có vỏ <b>mềm dai</b>, thấm được hơi ẩm từ cát, đất.'),
  Q('Ở rùa biển, điều gì quyết định trứng nở ra rùa đực hay rùa cái?', ['Nhiệt độ cát ấp trứng', 'Màu vỏ trứng', 'Mặt Trăng', 'Số trứng trong ổ'], 'Cát <b>ấm hơn</b> nở nhiều rùa cái, cát mát hơn nở nhiều rùa đực.'),
  Q('Gà mẹ ấp trứng khoảng bao nhiêu ngày thì gà con nở?', ['21 ngày', '3 ngày', '100 ngày', '1 năm'], 'Trứng gà cần khoảng <b>21 ngày</b> ấp ở chừng 37–38 °C.'),
  Q('Con non trong trứng lấy khí để thở bằng cách nào?', ['Khí đi qua hàng nghìn lỗ li ti trên vỏ', 'Không cần thở', 'Thở bằng mang', 'Hút từ lòng đỏ'], 'Vỏ trứng có hàng nghìn <b>lỗ khí</b> nhỏ li ti cho ô-xi đi vào.'),
  Q('Lòng đỏ trứng có vai trò gì với con non?', ['Là thức ăn nuôi con non', 'Làm vỏ cứng', 'Để trang trí', 'Không có vai trò gì'], 'Lòng đỏ là <b>kho thức ăn</b> nuôi phôi lớn dần tới lúc nở.'),
  Q('Con vật nào sau đây đẻ trứng?', ['Cá sấu', 'Mèo', 'Bò', 'Cá heo'], 'Cá sấu là bò sát, <b>đẻ trứng</b>; mèo, bò, cá heo là thú, đẻ con.'),
];
const NEED = { f: 2, w: 2, q: 1 };   // cho ăn · sưởi ấm · câu hỏi (2 + 2 + 1 = 5 bước, Fibonacci)

// ---------- hình khối rồng cánh (hướng +z, chân chạm y = 0, dài ≈ 5) ----------
const tris = pts => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); return g; };
const sph = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
function wyrmBody(P, rubik) {
  const b = new Batch(), C = rubik ? i => RUBIK[i % 6] : () => P.body;
  if (rubik) { let i = 0; for (let x = -1; x <= 1; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 4; z++) { const s = 0.5; b.box(x * s - 0.23, x * s + 0.23, 0.75 + y * s, 0.75 + y * s + 0.46, -0.9 + z * s, -0.9 + z * s + 0.46, RUBIK[(i++ * 7 + y) % 6]); } }
  else { b.add(sph(1), P.body, 0, 1.3, 0, 0, 0, 0, 0.9, 0.85, 1.25); b.add(sph(0.75), P.belly, 0, 1.12, 0.2, 0, 0, 0, 0.78, 0.7, 1.1); }
  b.add(new THREE.CylinderGeometry(0.32, 0.45, 1.0, 7), C(1), 0, 2.0, 0.95, 0, 0.6);           // cổ
  b.add(sph(0.62, 9, 7), C(2), 0, 2.55, 1.4, 0, 0, 0, 1, 0.9, 1.05);                           // đầu tròn to (dễ thương)
  b.add(sph(0.36, 7, 5), C(3), 0, 2.38, 1.95, 0, 0, 0, 1.05, 0.75, 1);                         // mõm
  for (const s of [-1, 1]) {
    b.add(sph(0.2, 7, 5), '#ffffff', s * 0.3, 2.7, 1.86); b.add(sph(0.13, 6, 4), '#1b1626', s * 0.31, 2.7, 1.98); b.add(sph(0.045, 4, 3), '#ffffff', s * 0.27, 2.77, 2.09);   // mắt to + đốm sáng
    b.add(sph(0.11, 5, 4), '#ff9ab0', s * 0.45, 2.42, 1.78, 0, 0, 0, 1, 0.6, 0.6);           // má hồng
    b.add(new THREE.ConeGeometry(0.1, 0.5, 5), P.horn, s * 0.26, 3.08, 1.12, 0, -0.55);        // sừng nhỏ
    b.box(s * 0.1 - 0.03, s * 0.1 + 0.03, 2.4, 2.46, 2.27, 2.31, '#1b1626');                   // lỗ mũi
    for (const z of [0.55, -0.55]) { b.cyl(s * 0.45, 0, z, 0.2, 0.75, C(4), 6); b.add(sph(0.24, 6, 4), C(5), s * 0.45, 0.08, z + 0.12, 0, 0, 0, 1, 0.5, 1.3); }   // chân
  }
  for (let k = 0; k < 6; k++) b.add(new THREE.ConeGeometry(0.13, 0.36, 4), P.wing, 0, 2.18 - k * 0.12 + (k < 2 ? 0.25 : 0), 0.85 - k * 0.42);   // gai lưng
  for (let k = 0; k < 5; k++) { const r = 0.36 - k * 0.06; b.add(new THREE.CylinderGeometry(r * 0.8, r, 0.7, 6), C(k + 2), 0, 1.15 - k * 0.12, -1.35 - k * 0.6, 0, PI / 2 + 0.18); }   // đuôi
  b.add(new THREE.OctahedronGeometry(0.28, 0), P.wing, 0, 0.6, -4.45, 0, 0, 0, 0.4, 1, 1.4);   // chóp đuôi
  return b.build();
}
function wyrmWing(P, s) {   // gốc (0,0,0) ở vai; xương cánh + màng
  const b = new Batch(), x = s;
  b.add(tris(s > 0 ? [[0, 0, 0.3], [2.6 * x, 0.6, -0.1], [0, 0, -0.7], [2.6 * x, 0.6, -0.1], [2.3 * x, 0.15, -1.1], [0, 0, -0.7], [0, 0, -0.7], [2.3 * x, 0.15, -1.1], [1.3 * x, -0.1, -1.5]]
    : [[0, 0, 0.3], [0, 0, -0.7], [2.6 * x, 0.6, -0.1], [2.6 * x, 0.6, -0.1], [0, 0, -0.7], [2.3 * x, 0.15, -1.1], [0, 0, -0.7], [1.3 * x, -0.1, -1.5], [2.3 * x, 0.15, -1.1]]), P.wing);
  b.add(new THREE.CylinderGeometry(0.06, 0.09, 2.7, 5), P.horn, 1.3 * x, 0.32, 0.1, 0, 0, s * -(PI / 2 - 0.23));
  return b.build();
}
const bodyMat = () => matV(), wingMat = toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide });
/** rồng cánh: { group, body, wings[2], mouth (toạ độ cục bộ), shoulder } — dùng chung cho rồng con thú cưng + rồng lớn cưỡi được (flyers.js) */
export function makeWyrm(kind, scale = 1) {
  const S = SPECIES[kind], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const m = new THREE.Mesh(wyrmBody(S.pal, S.rubik), bodyMat()); m.castShadow = true; body.add(m);
  const wings = [-1, 1].map(s => { const W = new THREE.Group(); W.position.set(s * 0.55, 2.0, 0.35); W.add(new THREE.Mesh(wyrmWing(S.pal, s), wingMat)); body.add(W); return W; });
  g.scale.setScalar(scale);
  return { group: g, body, wings, mouth: new THREE.Vector3(0, 2.4, 2.35), kind, phase: Math.random() * 6 };
}
/** tư thế: air = đang bay; flap 0..1 biên độ; fold = gập cánh khi đậu/ngủ */
export function poseWyrm(W, dt, air, rate = 6, amp = 0.6, sleep = false) {
  W.phase += dt * (air ? rate : 1.2);
  const f = air ? Math.sin(W.phase) * amp : 0;
  W.wings[0].rotation.set(0, air ? 0 : 0.5, air ? -f + 0.12 : sleep ? 1.25 : 0.95);
  W.wings[1].rotation.set(0, air ? 0 : -0.5, air ? f - 0.12 : sleep ? -1.25 : -0.95);
  W.body.position.y = air ? -Math.sin(W.phase) * 0.12 : sleep ? -0.45 : Math.sin(W.phase * 0.8) * 0.03;
  W.body.rotation.x = sleep ? 0.12 : 0;
}

// ---------- hạt: lửa, nước, mây, khối màu, bong bóng ngủ, tim (1 draw call) ----------
export function createFx(scene, N = M ? 233 : 377) {
  const g = new THREE.BufferGeometry(), P = new Float32Array(N * 3), V = new Float32Array(N * 3), C = new Float32Array(N * 3), L = new Float32Array(N), S = new Float32Array(N), G = new Float32Array(N);
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('life', new THREE.BufferAttribute(L, 1)); g.setAttribute('size', new THREE.BufferAttribute(S, 1));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float life; attribute float size; attribute vec3 color; varying float vL; varying vec3 vC; void main(){ vL = life; vC = color; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = size * (0.6 + 0.4 * life) * 300. / -mv.z * step(0.001, life); }',
    fragmentShader: 'varying float vL; varying vec3 vC; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(vC, smoothstep(.5,.15,d) * min(1., vL * 1.6)); }' }));
  pts.frustumCulled = false; scene.add(pts);
  let i0 = 0, alive = 0; const c = new THREE.Color();
  const emit = (x, y, z, vx, vy, vz, col, size, grav = 0) => { const i = i0++ % N; P.set([x, y, z], i * 3); V.set([vx, vy, vz], i * 3); c.set(col); C.set([c.r, c.g, c.b], i * 3); L[i] = 1; S[i] = size; G[i] = grav; alive = 2; };
  // kiểu phun theo loài: hướng (dx,dy,dz) đã chuẩn hoá
  const KIND = {
    fire: () => [['#ff5a1a', '#ffb02a', '#ffe08a'][Math.random() * 3 | 0], 1.3, -1, 14],
    water: () => [['#5fc8ff', '#bfefff', '#3f8fe0'][Math.random() * 3 | 0], 0.8, 9.8, 16],
    cloud: () => ['#ffffff', 2.6, -0.3, 7],
    rubik: () => [RUBIK[Math.random() * 6 | 0], 1.1, 4, 13],
  };
  const breathe = (kind, p, d, sc = 1) => { const [col, size, grav, sp] = KIND[kind](); const j = 0.18; emit(p.x, p.y, p.z, (d.x + (Math.random() - .5) * j) * sp * sc, (d.y + (Math.random() - .5) * j) * sp * sc, (d.z + (Math.random() - .5) * j) * sp * sc, col, size * sc, grav); };
  function update(dt) {
    if (!alive) return; let any = false;
    for (let i = 0; i < N; i++) if (L[i] > 0) { any = true; L[i] = Math.max(0, L[i] - dt * 0.62); V[i * 3 + 1] -= G[i] * dt; const k = 1 - dt * 0.9; V[i * 3] *= k; V[i * 3 + 2] *= k; P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt; }
    if (!any) alive--; g.attributes.position.needsUpdate = g.attributes.life.needsUpdate = g.attributes.color.needsUpdate = g.attributes.size.needsUpdate = true;
  }
  return { emit, breathe, update, points: pts };
}

const load = () => { try { return Object.assign({ egg: null, babies: [], pet: null, met: [] }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { egg: null, babies: [], pet: null, met: [] }; } };

export function createDragons(ctx, magic) {
  const { scene, player, terrain } = ctx, st = load(), save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const night = () => (ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0);
  const W = (u, v) => toWorld(u, v), Hh = (x, z) => terrain.heightAt(x, z);
  const [cx, cz] = W(VALLEY.u, VALLEY.v), at = (th, r) => W(VALLEY.u + Math.cos(th) * r, VALLEY.v + Math.sin(th) * r);
  const fx = createFx(scene);
  const see = id => { if (!st.met.includes(id)) { st.met.push(id); save(); } ctx.bestiary && ctx.bestiary.see(id); };
  let D = null, clock = 0, skip = 0, acc = 0, greeted = false, showT = -99;

  // ---------- dựng / dỡ ----------
  function build() {
    const g = new THREE.Group(); g.name = 'dragon-valley'; scene.add(g);
    // nền: lưới địa hình phần thung lũng nằm ngoài lưới đảo + lưới rừng (u < mép tây lưới rừng)
    const st0 = GRID.st, vMin = VALLEY.v - VALLEY.rim - 34, nv = Math.ceil((-GRID.V - vMin) / st0), j0 = Math.floor((VALLEY.u - VALLEY.rim - 34 - GRID.U0) / st0), j1 = Math.floor((FOREST.u - FOREST.r - 34 - GRID.U0) / st0);
    const land = new THREE.Mesh(terrainGeo(-GRID.V - nv * st0, nv, GRID.U0 + j0 * st0, j1 - j0 + 1), matV()); land.receiveShadow = true; land.matrixAutoUpdate = false;
    land.rotation.y = 0; land.position.set(0, 0, 0); land.updateMatrix(); const tw = new THREE.Group(); tw.position.set(toWorld(0, 0)[0], 0, toWorld(0, 0)[1]); tw.add(land); g.add(tw);
    // cột đá đậu (đỉnh vách), tổ trứng, suối ấm, pha lê, cổng
    const b = new Batch(), glow = new Batch(), perches = [], nests = [], beds = [];
    for (let i = 0; i < 5; i++) {
      const th = VALLEY_GATE + PI * 0.4 + i * (PI * 1.2 / 4), [x, z] = at(th, VALLEY.r + 13), y = Hh(x, z);
      b.add(new THREE.CylinderGeometry(3.4, 5.5, 8, 7), '#7a6e78', x, y + 2, z); b.add(new THREE.CylinderGeometry(4.2, 3.6, 1.2, 7), '#6d8f5a', x, y + 6.6, z);
      perches.push([x, y + 7.2, z, Math.atan2(cx - x, cz - z)]);
    }
    for (let i = 0; i < 4; i++) {
      const th = VALLEY_GATE + PI + (i - 1.5) * 0.55, [x, z] = at(th, 30), y = Hh(x, z);
      for (let k = 0; k < 13; k++) { const a = k * GA; b.add(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 4), '#8a6a3e', x + Math.cos(a) * 1.25, y + 0.35, z + Math.sin(a) * 1.25, a, PI / 2 - 0.25, 0); }
      b.add(new THREE.TorusGeometry(1.3, 0.38, 5, 10), '#a07a48', x, y + 0.3, z, 0, PI / 2);
      nests.push([x, y, z]);
      const [bx, bz] = at(th + 0.28, 21); beds.push([bx, Hh(bx, bz), bz, Math.atan2(x - bx, z - bz)]);
    }
    { const [x, z] = at(VALLEY_GATE + PI, 8), y = Hh(x, z); b.add(new THREE.CylinderGeometry(5.5, 5.5, 0.3, 13), '#8a8290', x, y + 0.05, z); glow.add(new THREE.CylinderGeometry(4.8, 4.8, 0.32, 13), '#7fe0ff', x, y + 0.1, z); }   // suối nước ấm
    for (let k = 0; k < 21; k++) { const a = k * GA * 3, r = 13 + (k * 13) % 34, [x, z] = at(a, r), y = Hh(x, z); if (y > 9) continue; glow.add(new THREE.OctahedronGeometry(0.4 + (k % 3) * 0.2, 0), RUBIK[k % 6], x, y + 0.5, z, a, 0, 0, 1, 2, 1); }
    for (const s of [-1, 1]) { const [x, z] = at(VALLEY_GATE + s * VALLEY.gap * 0.7, VALLEY.rim - 13), y = Hh(x, z); b.add(new THREE.CylinderGeometry(1.2, 1.6, 8, 6), '#6e6270', x, y + 4, z); glow.add(new THREE.OctahedronGeometry(0.9, 0), '#ffb45a', x, y + 8.8, z); }
    const sm = new THREE.Mesh(b.build(), matV()); sm.castShadow = sm.receiveShadow = true; g.add(sm, new THREE.Mesh(glow.build(), new THREE.MeshBasicMaterial({ vertexColors: true })));
    for (const m of [sm]) { m.matrixAutoUpdate = false; m.updateMatrix(); }
    for (const [x, , z] of nests) ctx.colliders.push({ x, z, r: 1.4, valley: 1 });
    // biển tên ở cửa thung lũng
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
    k.font = 'bold 42px system-ui'; k.fillStyle = 'rgba(27,22,38,.8)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = '#ffd08a'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('🐉 Thung Lũng Rồng', 256, 50);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(8.1, 1.5, 1);
    { const [x, z] = at(VALLEY_GATE, VALLEY.rim - 8); sp.position.set(x, Hh(x, z) + 6.5, z); } g.add(sp);
    // rồng cánh
    const dr = ['fire', 'water', 'cloud', 'rubik'].map((kind, i) => {
      const w = makeWyrm(kind, 1.618 + (i % 2) * 0.38); g.add(w.group);
      const p = perches[i]; w.group.position.set(p[0], p[1], p[2]);
      return Object.assign(w, { i, perch: p, bed: beds[i], state: 'fly', t: 13 + i * 8, a: i * PI / 2, vel: new THREE.Vector3(), yaw: 0, bank: 0, show: null, sleepT: 0 });
    });
    // rồng Việt: 34 đốt InstancedMesh + đầu
    const NS = 34, seg = new THREE.InstancedMesh(dragonSeg(), matV(), NS), head = new THREE.Mesh(dragonHead(), matV());
    seg.frustumCulled = false; head.castShadow = true; g.add(seg, head);
    // trứng: InstancedMesh 4 quả, màu theo loài
    const eg = sph(0.6, 10, 8); eg.scale(0.82, 1.05, 0.82); eg.translate(0, 0.62, 0);
    const eggs = new THREE.InstancedMesh(eg, toon('#ffffff', { emissive: '#3a2410', emissiveIntensity: 0.25 }), 4);
    ['fire', 'water', 'cloud', 'rubik'].forEach((k, i) => eggs.setColorAt(i, new THREE.Color(SPECIES[k].pal.body)));
    g.add(eggs);
    D = { g, dr, seg, head, NS, trail: [], eggs, nests, beds, perches, wob: [0, 0, 0, 0], tmp: new THREE.Object3D() };
    layEggs();
  }
  function unbuild() {
    if (!D) return; scene.remove(D.g);
    D.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
    for (let i = ctx.colliders.length - 1; i >= 0; i--) if (ctx.colliders[i].valley) ctx.colliders.splice(i, 1);
    D = null;
  }
  const KINDS = ['fire', 'water', 'cloud', 'rubik'];
  function layEggs() {   // ẩn trứng đã nở
    if (!D) return; const o = D.tmp;
    KINDS.forEach((k, i) => { const [x, y, z] = D.nests[i], w = D.wob[i], gone = st.babies.includes(k); o.position.set(x, gone ? -99 : y + 0.15, z); o.rotation.set(Math.sin(w * 13) * w * 0.3, 0, Math.cos(w * 11) * w * 0.3); o.scale.setScalar(gone ? 0.001 : 1); o.updateMatrix(); D.eggs.setMatrixAt(i, o.matrix); });
    D.eggs.instanceMatrix.needsUpdate = true;
  }

  // ---------- hành vi rồng cánh ----------
  const _t = new THREE.Vector3(), _d = new THREE.Vector3();
  function steer(w, tx, ty, tz, sp, dt) {
    const p = w.group.position; _t.set(tx - p.x, ty - p.y, tz - p.z); const L = _t.length();
    _t.multiplyScalar(Math.min(sp, L * 1.2) / Math.max(L, 1e-3)); w.vel.lerp(_t, Math.min(1, dt * 1.6)); p.addScaledVector(w.vel, dt);
    const hs = Math.hypot(w.vel.x, w.vel.z);
    if (hs > 0.3) { let dy = Math.atan2(w.vel.x, w.vel.z) - w.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); w.yaw += dy * Math.min(1, dt * 3); w.bank += (THREE.MathUtils.clamp(-dy * 2, -0.6, 0.6) - w.bank) * Math.min(1, dt * 2); }
    w.group.rotation.set(THREE.MathUtils.clamp(-w.vel.y * 0.05, -0.4, 0.4), w.yaw, w.bank, 'YXZ');
    return L;
  }
  function wyrmUpdate(w, dt) {
    const p = w.group.position, sleepy = night() > 0.55;
    w.t -= dt;
    if (w.show) {   // biểu diễn: bay tới trước mặt người chơi, phun lên trời
      const s = w.show; s.t += dt;
      const L = steer(w, s.x, s.y, s.z, 21, dt);
      if (L < 3) { let dy = Math.atan2(player.pos.x - p.x, player.pos.z - p.z) - w.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); w.yaw += dy * Math.min(1, dt * 2); w.group.rotation.y = w.yaw; }
      if (L < 3 && s.t > s.at) { if (s.t < s.at + 4.5) { const m = w.mouth.clone().multiplyScalar(w.group.scale.x).applyEuler(w.group.rotation).add(p); _d.set(Math.sin(w.yaw) * 0.45, 0.89, Math.cos(w.yaw) * 0.45); for (let k = 0; k < (M ? 2 : 3); k++) fx.breathe(SPECIES[w.kind].fx, m, _d, w.group.scale.x / 1.6); } }
      if (s.t > s.end) { w.show = null; w.state = 'fly'; w.t = 21; }
      poseWyrm(w, dt, true, 5, 0.55); return;
    }
    if (w.state === 'fly') {
      w.a += dt * 0.21 * (w.i % 2 ? 1 : -1); const r = 34 + w.i * 5, alt = 34 + 13 * Math.sin(w.a * 2 + w.i);
      const [x, z] = at(w.a, r); steer(w, x, Hh(cx, cz) + alt, z, 13, dt);
      poseWyrm(w, dt, true, w.vel.y > 0.5 ? 8 : 4.5, w.vel.y < -1 ? 0.15 : 0.55);
      if (w.t <= 0) { w.state = sleepy ? 'tobed' : 'toperch'; }
    } else if (w.state === 'toperch' || w.state === 'tobed') {
      const T = w.state === 'tobed' ? w.bed : w.perch, L = steer(w, T[0], T[1] + 0.2, T[2], 13, dt);
      poseWyrm(w, dt, L > 1.5, 7, 0.6);
      if (L < 1.2) { p.set(T[0], T[1], T[2]); w.vel.set(0, 0, 0); w.yaw = T[3]; w.bank = 0; w.group.rotation.set(0, w.yaw, 0); w.state = w.state === 'tobed' ? 'sleep' : 'perch'; w.t = 21 + w.i * 5; }
    } else if (w.state === 'perch') {
      poseWyrm(w, dt, false); w.group.rotation.y = w.yaw + Math.sin(clock * 0.4 + w.i) * 0.35;   // ngó nghiêng
      if (sleepy) { w.state = 'tobed'; } else if (w.t <= 0) { w.state = 'fly'; w.t = 34; w.vel.set(0, 6, 0); }
    } else if (w.state === 'sleep') {
      poseWyrm(w, dt, false, 6, 0.6, true);
      if ((w.sleepT -= dt) <= 0) { w.sleepT = 1.3; const s = w.group.scale.x; fx.emit(p.x + Math.sin(w.yaw) * 2.4 * s, p.y + 2.6 * s, p.z + Math.cos(w.yaw) * 2.4 * s, 0.2, 0.9, 0.1, '#cfe4ff', 0.9); }   // bong bóng ngủ
      if (!sleepy) { w.state = 'fly'; w.t = 34; w.vel.set(0, 6, 0); }
    }
  }
  // rồng Việt: thân 34 đốt nối đuôi theo vết đầu rồng (đường lượn số 8 nghiêng giữa vách)
  function vietUpdate(dt, t) {
    const s = t * 0.13, base = Hh(cx, cz) + 21;
    const hp = (k) => { const a = s - k * 0.03; const [x, z] = at(a, 42 + 13 * Math.sin(a * 2)); return _t.set(x, base + 8 * Math.sin(a * 3) + 5 * Math.sin(a * 7), z); };
    const o = D.tmp; let prev = hp(0).clone();
    D.head.position.copy(prev); { const n = hp(0.8); D.head.lookAt(prev.x * 2 - n.x, prev.y * 2 - n.y, prev.z * 2 - n.z); }
    for (let k = 0; k < D.NS; k++) {
      const p = hp(k * 1.35 + 1.4).clone(), q = hp(k * 1.35 + 2.4), sc = 1 - k / D.NS * 0.6;
      o.position.copy(p); o.lookAt(p.x * 2 - q.x, p.y * 2 - q.y, p.z * 2 - q.z); o.rotateZ(Math.sin(t * 2 + k * 0.4) * 0.15); o.scale.setScalar(sc); o.updateMatrix(); D.seg.setMatrixAt(k, o.matrix);
    }
    D.seg.instanceMatrix.needsUpdate = true;
  }

  // ---------- biểu diễn ----------
  function show() {
    if (!D) return; showT = clock; const fwd = Math.atan2(cx - player.pos.x, cz - player.pos.z);
    D.dr.forEach((w, i) => { const a = fwd + (i - 1.5) * 0.45, r = 21; w.show = { x: player.pos.x + Math.sin(a) * r, y: player.pos.y + 11 + (i % 2) * 5, z: player.pos.z + Math.cos(a) * r, t: 0, at: 5 + i * 2.6, end: 5 + 4 * 2.6 + 5 }; w.state = 'show'; });
    ctx.toast('🎆 Các bạn rồng bay tới biểu diễn: <b>lửa pháo hoa · vòi nước · mây bông · mưa khối Rubik</b>! (vô hại, phun lên trời)', 5000); ctx.sfx && ctx.sfx('win');
  }

  // ---------- trứng ----------
  const egg = () => st.egg;
  const bar = (n, k) => '●'.repeat(n) + '○'.repeat(k - n);
  function eggCard(i) {
    const kind = KINDS[i], S = SPECIES[kind], e = st.egg;
    if (!e) { st.egg = { k: kind, f: 0, w: 0, q: 0, t: 0 }; save(); ctx.toast(`🥚 Em nhận chăm <b>trứng ${S.name}</b>! Cho ăn ×2, sưởi ấm ×2, trả lời 1 câu sinh học để trứng nở.`, 5000); }
    const E = st.egg, ready = clock > (E.t || 0);
    const card = document.createElement('div'); card.id = 'mgCard';
    card.innerHTML = `<h4>🥚 Trứng ${S.name} ${S.emoji}</h4><div>🍓 Cho ăn ${bar(E.f, NEED.f)} · 🔥 Sưởi ấm ${bar(E.w, NEED.w)} · ❓ Học ${bar(E.q, NEED.q)}</div>
      <div class="ch"><button data-a="f" ${E.f >= NEED.f ? 'disabled' : ''}>🍓 Đặt quả mọng phép vào tổ</button><button data-a="w" ${E.w >= NEED.w ? 'disabled' : ''}>🔥 Nhờ Rồng Lửa sưởi ấm</button><button data-a="q" ${E.q >= NEED.q ? 'disabled' : ''}>❓ Trả lời câu hỏi sinh học</button></div>
      <div style="font-size:.85em;opacity:.8">${ready ? 'Trứng đang chờ em chăm sóc 💛' : '⏳ Trứng đang nghỉ một chút, lát nữa chăm tiếp nhé.'}</div><div style="text-align:right;margin-top:6px"><button data-x>Đóng</button></div>`;
    document.getElementById('mgCard')?.remove(); document.body.appendChild(card);
    card.onclick = ev => {
      const bt = ev.target.closest('button'); if (!bt) return; if (bt.dataset.x !== undefined) return card.remove();
      const a = bt.dataset.a; if (!a) return;
      if (clock < (E.t || 0)) { ctx.toast('⏳ Trứng đang nghỉ — đợi vài giây rồi chăm tiếp nhé!', 1800); return; }
      card.remove();
      const done = () => { E[a]++; E.t = clock + 5; save(); D && (D.wob[i] = 1.5); ctx.sfx && ctx.sfx('coin'); const n = E.f + E.w + E.q; if (E.f >= NEED.f && E.w >= NEED.w && E.q >= NEED.q) hatch(i); else ctx.toast(`💛 Trứng ${S.name} lớn thêm! (${n}/5)`, 1800); };
      if (a === 'f') { heart(i, '#ff7aa0'); done(); ctx.toast('🍓 Quả mọng phép thơm lừng — rồng mẹ ăn no sẽ canh tổ ấm hơn.', 2600); }
      else if (a === 'w') { warm(i); done(); ctx.toast('🔥 Rồng Lửa thở nhè nhẹ — hơi ấm vừa đủ, như gà mẹ ấp trứng ở chừng 37 °C.', 3000); }
      else magic.ask(EGG_QS[Math.floor(Math.random() * EGG_QS.length)], done, '🥚 Câu hỏi sinh học — đúng thì trứng lớn thêm');
    };
  }
  function heart(i, col) { if (!D) return; const [x, y, z] = D.nests[i]; for (let k = 0; k < 13; k++) fx.emit(x, y + 1.4, z, (Math.random() - .5) * 2, 2 + Math.random() * 2, (Math.random() - .5) * 2, col, 0.8, 1.5); }
  function warm(i) { if (!D) return; const [x, y, z] = D.nests[i]; for (let k = 0; k < 34; k++) { const a = k * GA; fx.emit(x + Math.cos(a) * 1.6, y + 0.4, z + Math.sin(a) * 1.6, -Math.cos(a) * 0.8, 1 + Math.random(), -Math.sin(a) * 0.8, ['#ff8a2a', '#ffd08a'][k % 2], 1, -0.5); } }
  function hatch(i) {
    const kind = KINDS[i], S = SPECIES[kind];
    st.babies.push(kind); st.pet = kind; st.egg = null; save();
    if (D) { D.wob[i] = 3; const [x, y, z] = D.nests[i]; setTimeout(() => { for (let k = 0; k < 55; k++) fx.emit(x, y + 1, z, (Math.random() - .5) * 6, 2 + Math.random() * 5, (Math.random() - .5) * 6, S.rubik ? RUBIK[k % 6] : ['#ffe08a', S.pal.body, '#ffffff'][k % 3], 1.1, 4); layEggs(); }, 1800); }
    spawnPet(kind, true);
    setTimeout(() => { ctx.toast(`🎉 Trứng nở rồi! <b>Bé ${S.name}</b> ${S.emoji} đã là bạn của em và sẽ bay theo em khắp thế giới.<br><small>Đổi rồng con ở tổ trứng trong Thung Lũng Rồng.</small>`, 6500); ctx.sfx && ctx.sfx('win'); player.emote && player.emote('cheer'); }, 1900);
  }
  function petCard() {
    const card = document.createElement('div'); card.id = 'mgCard';
    card.innerHTML = `<h4>🐲 Rồng con đi theo em</h4><div class="ch">${st.babies.map(k => `<button data-k="${k}">${SPECIES[k].emoji} Bé ${SPECIES[k].name}${st.pet === k ? ' ✓' : ''}</button>`).join('')}<button data-k="">🏡 Để rồng con ở nhà</button></div><div style="text-align:right;margin-top:6px"><button data-x>Đóng</button></div>`;
    document.getElementById('mgCard')?.remove(); document.body.appendChild(card);
    card.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; if (bt.dataset.k !== undefined) { st.pet = bt.dataset.k || null; save(); spawnPet(st.pet); } card.remove(); };
  }

  // ---------- rồng con thú cưng (luôn hoạt động, mọi đảo) ----------
  let pet = null;
  function spawnPet(kind, fromEgg) {
    if (pet) { scene.remove(pet.group); pet = null; } if (!kind) return;
    pet = makeWyrm(kind, 0.34); pet.hop = 0; scene.add(pet.group);
    const p = player.pos; if (fromEgg && D) { const [x, y, z] = D.nests[KINDS.indexOf(kind)]; pet.group.position.set(x, y + 0.6, z); } else pet.group.position.set(p.x - 1.5, p.y + 1.6, p.z);
  }
  if (st.pet) spawnPet(st.pet);
  function petUpdate(dt) {
    if (!pet) return; const g = pet.group;
    const yaw = player.rot ?? 0, side = Math.sin(clock * 0.7) * 0.4;
    const tx = player.pos.x - Math.sin(yaw) * 1.3 + Math.cos(yaw) * (1.3 + side), tz = player.pos.z - Math.cos(yaw) * 1.3 - Math.sin(yaw) * (1.3 + side), ty = player.pos.y + 1.6 + Math.sin(clock * 2.1) * 0.2 + (player.vehicle ? 1.5 : 0);
    const p = g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz, ty - p.y);
    if (d > 34) p.set(tx, ty, tz);   // dịch chuyển (đi thuyền, tàu…): theo kịp ngay
    const k = Math.min(1, dt * (d > 3 ? 4 : 2)); p.x += dx * k; p.z += dz * k; p.y += (ty - p.y) * k;
    const want = d > 0.4 ? Math.atan2(dx, dz) : yaw; let dr = want - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); g.rotation.y += dr * Math.min(1, dt * 5);
    poseWyrm(pet, dt, true, d > 2 ? 13 : 8, 0.6);
    if (Math.random() < dt * 0.3 && D) fx.emit(p.x, p.y + 0.6, p.z, 0, 0.6, 0, pet.kind === 'rubik' ? RUBIK[Math.random() * 6 | 0] : SPECIES[pet.kind].pal.wing, 0.5, 0);
  }

  // ---------- mỗi khung ----------
  function update(dt, t) {
    clock += dt; petUpdate(dt); fx.update(dt);
    const p = player.pos, [u, v] = toLocal(p.x, p.z), dv = Math.hypot(u - VALLEY.u, v - VALLEY.v) - VALLEY.rim;
    if (!D && dv < LOAD) build(); else if (D && dv > UNLOAD) unbuild();
    if (!D) return;
    const far = dv > LOD; acc += dt; if (far && (skip = (skip + 1) % 3)) return; const ddt = Math.min(acc, 0.1); acc = 0;
    for (const w of D.dr) wyrmUpdate(w, ddt);
    vietUpdate(ddt, t);
    for (let i = 0; i < 4; i++) if (D.wob[i] > 0) D.wob[i] = Math.max(0, D.wob[i] - ddt);
    if (D.wob.some(x => x > 0) || (st.egg && Math.random() < ddt)) { if (st.egg) D.wob[KINDS.indexOf(st.egg.k)] ||= 0.4; layEggs(); }
    if (player.vehicle || player.frozen) return;
    const inV = dv < -VALLEY.rim + VALLEY.r + 8;
    if (inV && !greeted) { greeted = true; see('valley'); ctx.toast('🐉 <b>Thung Lũng Rồng</b> — nơi các bạn rồng hiền lành làm tổ. Lại gần tổ trứng để nhận chăm một quả trứng nhé!', 6000); }
    // gần rồng: giới thiệu + câu đố
    let best = null, bd = NEAR;
    for (const w of D.dr) { const d = w.group.position.distanceTo(p) / Math.max(1, w.group.scale.x * 0.8); if (d < bd) { bd = d; best = w.kind; } }
    if (!best && D.head.position.distanceTo(p) < NEAR * 1.5) best = 'viet';
    if (best) {
      const S = SPECIES[best]; if (!st.met.includes(best)) { see(best); ctx.toast(`${S.intro}<br>${S.fact}`, 8000); }
      ctx.offer(`❓ Trò chuyện với ${S.name}`, () => magic.ask(S.qs[Math.floor(Math.random() * S.qs.length)], () => { magic.setMana && magic.setMana(magic.mana + 13); ctx.toast(`✨ ${S.name} gật gù khen em giỏi! +13 năng lượng phép`, 2200); }, `${S.emoji} ${S.name} hỏi em`), 6);
    }
    // tổ trứng
    for (let i = 0; i < 4; i++) {
      const [x, , z] = D.nests[i]; if (Math.hypot(p.x - x, p.z - z) > 3.4) continue;
      const kind = KINDS[i], S = SPECIES[kind];
      if (st.babies.includes(kind)) { ctx.offer('🐲 Chọn rồng con đi theo', petCard, 7); break; }
      if (st.egg && st.egg.k !== kind) { ctx.offer(`🥚 Trứng ${S.name} (em đang chăm trứng ${SPECIES[st.egg.k].name})`, () => ctx.toast(`Chăm xong trứng <b>${SPECIES[st.egg.k].name}</b> trước đã nhé!`, 2200), 7); break; }
      const E = st.egg; ctx.offer(E ? `🥚 Chăm trứng ${S.name} (${E.f + E.w + E.q}/5)` : `🥚 Nhận chăm trứng ${S.name}`, () => eggCard(i), 7); break;
    }
    if (inV && clock - showT > 34 && Math.hypot(u - VALLEY.u, v - VALLEY.v) < VALLEY.r && night() < 0.55) ctx.offer('🎆 Xem rồng biểu diễn', show, 2);
  }
  return { update, see, get loaded() { return !!D; }, state: st, show, spawnPet, fx, center: [cx, cz] };
}
