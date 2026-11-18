// easter-eggs.js — 21 BÍ MẬT (số Fibonacci) giấu khắp Đảo Rubik: tìm thấy thì học thêm 1 điều hay.
// Tự chứa: ocean.js chỉ gọi createEasterEggs(ctx) và eggs.update(dt, t). Tiến độ lưu localStorage 'island.eggs'.
// Hiệu năng (điện thoại): tối đa 8 draw call — khối Rubik (InstancedMesh), hạt sáng (1 Points dùng chung cho pháo hoa,
// đom đóm, chòm sao, xoắn ốc…), vòng mây (InstancedMesh), đồ tĩnh gộp 1 mesh, bia chữ, cá voi, ông Bụt, hoa hướng dương.
// Gỡ lỗi: __island.eggs (found, give(id), cubes, fireworks(), whale(), reset()).
import * as THREE from 'three';
import { gradientMap } from './style.js';
import { mergeGeos } from './terrain.js';
import { PHI, FIB, TOWN_Y, TEMPLE_C, EXTRA, GARDEN_LOTS, HOUSE_LOTS, HOUSE_V1, HOUSE_D, lotToWorld, rectDist } from './layout.js';
import { CFG } from './config.js';

const KEY = 'island.eggs', TAU = Math.PI * 2, GOLD_ANGLE = TAU / (PHI * PHI);   // góc vàng ≈ 137,5°
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
const store = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

// ---------- 21 bí mật: tên, gợi ý (chưa tìm), điều học được (đã tìm) ----------
const EGGS = [
  { id: 'cubes',   icon: '🟨', name: '8 khối Rubik vàng',      hint: 'Có 8 khối Rubik vàng giấu khắp đảo: đồi, rừng, biển, sân bay… cả trên nóc tháp!', learn: 'Khối lập phương có 8 đỉnh, 12 cạnh, 6 mặt: 8 − 12 + 6 = 2 (công thức Euler).' },
  { id: 'temple',  icon: '🌀', name: 'Xoắn ốc vàng ở Đền',     hint: 'Gom đủ 8 khối Rubik vàng rồi mang tới trước cổng Đền Tri Thức.', learn: 'Xoắn ốc vàng: cứ mỗi ¼ vòng lại rộng ra φ ≈ 1,618 lần — giống vỏ ốc anh vũ.' },
  { id: 'pi',      icon: '🎆', name: 'Pháo hoa số π',          hint: 'Gõ 5 chữ số đầu tiên của số π (bàn phím hoặc 🔢 trong sổ này).', learn: 'π ≈ 3,14159…: chu vi hình tròn chia đường kính luôn ra π, tròn to hay nhỏ cũng vậy.' },
  { id: 'fibo',    icon: '🌻', name: 'Hoa Fibonacci',          hint: 'Gõ 6 số đầu của dãy Fibonacci (1, 1, 2…).', learn: 'Hạt hướng dương xếp theo góc vàng 137,5°: đếm đường xoắn sẽ ra 21, 34, 55 — đều là số Fibonacci.' },
  { id: 'rings',   icon: '☁️', name: 'Ba vòng mây',            hint: 'Lái máy bay xuyên qua 3 vòng mây lơ lửng trên trời.', learn: 'Mây là hàng tỷ giọt nước li ti ngưng tụ quanh hạt bụi. Phần thưởng: sơn máy bay Vàng φ!' },
  { id: 'firefly', icon: '✨', name: 'Đom đóm hoàng hôn',      hint: 'Lúc hoàng hôn, đứng yên một lúc trên Đồi Hoàng Hôn (đồi cao nhất, phía Tây Nam).', learn: 'Đom đóm phát sáng nhờ phản ứng hoá học luciferin — gọi là phát quang sinh học, gần như không nóng.' },
  { id: 'stars',   icon: '🔭', name: 'Chòm sao Bắc Đẩu',       hint: 'Đêm xuống, ghé kính thiên văn trên Đồi Hoàng Hôn.', learn: 'Kéo dài cạnh "miệng gáo" Bắc Đẩu khoảng 5 lần sẽ gặp sao Bắc Cực — luôn chỉ hướng Bắc.' },
  { id: 'whale',   icon: '🐋', name: 'Cá voi nhảy',            hint: 'Ra bờ biển hoặc chèo thuyền ngoài khơi, kiên nhẫn ngắm biển…', learn: 'Cá voi xanh dài tới 30 m, là động vật lớn nhất từng sống trên Trái Đất. Cá voi thở bằng phổi.' },
  { id: 'turtle',  icon: '🐢', name: 'Cụ Rùa kể chuyện',       hint: 'Một cụ rùa biển rất già đang phơi nắng ở bãi biển phía Tây Bắc.', learn: 'Rùa biển đã có mặt trên Trái Đất hơn 100 triệu năm, từ thời khủng long!' },
  { id: 'cat',     icon: '🐱', name: 'Mèo ngủ trên mái',       hint: 'Có chú mèo lười ngủ trên mái một ngôi nhà ba tầng quanh trường.', learn: 'Mèo ngủ 12–16 tiếng mỗi ngày. Ria mèo giúp nó đo xem có chui lọt khe hẹp không.' },
  { id: 'but',     icon: '🧙', name: 'Ông Bụt dưới gốc đa',    hint: 'Trong rừng Đền có cây đa nghìn năm. Ngày xưa ai khóc thì Bụt hiện lên…', learn: 'Bụt là nhân vật hiền hậu trong truyện cổ tích Việt Nam, như Tấm Cám.' },
  { id: 'stele',   icon: '🪨', name: 'Bia đá chữ Hán',         hint: 'Bên đường vào Học viện Hoa Phượng có tấm bia đá khắc chữ cổ.', learn: 'Ông cha ta dùng chữ Hán, rồi sáng tạo chữ Nôm để ghi tiếng Việt; nay ta dùng chữ Quốc ngữ.' },
  { id: 'seed',    icon: '🌱', name: 'Hạt giống thần',         hint: 'Ở vườn cộng đồng phía Nam trường có túi hạt giống chờ người gieo.', learn: 'Quang hợp: lá dùng ánh sáng + nước + khí CO₂ để làm đường nuôi cây và nhả khí O₂.' },
  // ---- đợt 2: 14 → 21 (số Fibonacci) ----
  { id: 'sundial', icon: '☀️', name: 'Đồng hồ mặt trời',       hint: 'Gần cổng trường có một chiếc đồng hồ không cần pin, chỉ cần nắng.', learn: 'Trái Đất tự quay 360° trong 24 giờ: mỗi giờ bóng nắng xoay 15°.' },
  { id: 'cuckoo',  icon: '🐦', name: 'Chim cu 12 giờ trưa',    hint: 'Cột đồng hồ cạnh cổng trường: đứng gần đó đúng 12 giờ trưa…', learn: 'Giữa trưa Mặt Trời lên cao nhất, bóng ngắn nhất. Kim giờ quay 2 vòng mỗi ngày.' },
  { id: 'well',    icon: '🪣', name: 'Giếng vọng',             hint: 'Trên đồi phía Bắc, giữa Phố Đà Lạt và rừng Đền, có một cái giếng cổ biết "trả lời".', learn: 'Âm thanh đi khoảng 343 m mỗi giây; tiếng vọng là âm dội lại từ vật cản.' },
  { id: 'hanoi',   icon: '🗼', name: 'Tháp Hà Nội',            hint: 'Trên đồi gần Thư viện có trò xếp đĩa rất nổi tiếng mang tên thủ đô nước ta.', learn: 'Tháp n đĩa cần ít nhất 2ⁿ − 1 bước: 3 đĩa → 7 bước, 64 đĩa → hơn 18 tỷ tỷ bước!' },
  { id: 'meteor',  icon: '🌠', name: 'Ước sao băng',           hint: 'Ban đêm ngắm trời thật lâu, thấy sao băng thì bấm ước ngay!', learn: 'Sao băng là mảnh đá vũ trụ nhỏ bốc cháy khi lao vào bầu khí quyển, ở độ cao khoảng 100 km.' },
  { id: 'bottle',  icon: '🍾', name: 'Chai thông điệp',        hint: 'Sóng đã đánh dạt một chiếc chai vào bãi biển phía Nam.', learn: 'Dòng hải lưu có thể đưa một chiếc chai trôi hàng nghìn km qua đại dương.' },
  { id: 'fossil',  icon: '🐚', name: 'Hoá thạch cúc đá',       hint: 'Trên đỉnh đồi phía Đông Nam (sau Thể thao & Rubik Kart) có hòn đá in hình xoắn ốc.', learn: 'Hoá thạch là dấu vết sinh vật xưa hoá đá qua hàng triệu năm.' },
  { id: 'lantern', icon: '🏮', name: 'Đèn hoa đăng',           hint: 'Ban đêm ra bờ hồ bán nguyệt sau trường thả đèn hoa đăng.', learn: 'Mặt Trăng không tự sáng mà phản chiếu ánh Mặt Trời; một vòng pha trăng dài khoảng 29,5 ngày.' },
];
// Huy hiệu ở mốc Fibonacci 3·5·8·13·21 bí mật — mỗi mốc mở 1 món đồ cho nhân vật
const TIERS = [
  { n: 3,  icon: '🥉', name: 'Huy hiệu Tò Mò',          gift: '🧢 Mũ thám hiểm',        hat: '#8a5a34' },
  { n: 5,  icon: '🥈', name: 'Huy hiệu Tinh Mắt',        gift: '🧥 Áo choàng xanh biển', cape: '#2f7fb8' },
  { n: 8,  icon: '🥇', name: 'Huy hiệu Thám Tử',         gift: '🧢 Mũ vàng φ',           hat: '#e2b33c' },
  { n: 13, icon: '🏅', name: 'Huy hiệu Nhà Thông Thái',  gift: '🧥 Áo choàng đỏ son',    cape: '#c0392b' },
  { n: 21, icon: '🏆', name: 'Nhà Thám Hiểm φ',          gift: '👑 Mũ & áo choàng vàng kim', hat: '#ffd54a', cape: '#e2b33c' },
];
const RUBIK_FACTS = [
  'Khối Rubik 3×3 có hơn <b>43 tỷ tỷ</b> cách xáo trộn (4,3 × 10¹⁹)!',
  'Mọi thế xáo trộn của Rubik đều giải được trong <b>tối đa 20 bước</b>.',
  'Kiến trúc sư người Hungary <b>Ernő Rubik</b> phát minh khối Rubik năm 1974.',
  'Tâm mỗi mặt Rubik <b>không bao giờ đổi chỗ</b>: nó cho biết màu của mặt đó.',
  '<b>8</b> là số Fibonacci: 1, 1, 2, 3, 5, <b>8</b>, 13… — có 8 khối vàng trên đảo.',
  'Khối lập phương cạnh 2 cm có thể tích 2³ = <b>8 cm³</b>.',
  'Rubik 3×3 có <b>26</b> khối nhỏ nhìn thấy được: 8 góc, 12 cạnh, 6 tâm.',
  'Kỷ lục giải Rubik 3×3 của người đã xuống <b>dưới 4 giây</b>!',
];
// 8 khối Rubik vàng: [x, z, y cố định (hoặc null = sát đất), gợi ý]
const AIRK = EXTRA.find(e => e.id === 'K').r;
const CUBES = [
  [-166.5, -166.5, null, 'sau lưng Đền Tri Thức'],
  [80, -194, null, 'đỉnh đồi cạnh Phố Đà Lạt'],
  [AIRK[2] - 8, AIRK[3] - 4, TOWN_Y + 0.9, 'cuối đường băng Sân bay Cánh Diều'],
  [...lotToWorld(GARDEN_LOTS[0], -6, -9), TOWN_Y + 0.9, 'vườn cộng đồng phía Bắc trường'],
  [-20, 70, TOWN_Y + 0.9, 'bờ hồ bán nguyệt sau trường'],
  [AIRK[0] + 70, AIRK[1] + 5, TOWN_Y + 17.4, 'nóc tháp điều khiển sân bay (cần 🎈!)'],
  [281, 299.5, 2.0, 'cầu gỗ Làng nổi ngoài khơi (đi ⛵)'],
  [-302, 0, null, 'bãi biển xa nhất phía Tây'],
];
const HILL = [-96, 200], SCOPE = [-92.5, 201.5], TURTLE = [-99, -238], BANYAN = [-150, -126], STELE = [-101, 110];
const SEED = lotToWorld(GARDEN_LOTS[1], 5.5, 8);   // góc vườn cộng đồng phía Nam (tránh đài phun nước giữa vườn)
const RINGS = [[0, 58, 223], [-158, 52, -158], [158, 66, -158]];
// đợt 2: vị trí (đã dò chỗ trống bằng Playwright)
const SUNDIAL = [-71, 21], CUCKOO = [-71.7, 0], WELL = [-60, -150], HANOI = [128.6, -105.8], FOSSIL = [148, 48];
const LETTERS = [
  'Xin chào! Mình là <b>Aiko</b> ở <b>Nhật Bản</b>. Nước mình có hơn 6.800 hòn đảo và núi Phú Sĩ cao 3.776 m. Bạn ở đâu thế?',
  'Chào bạn! Mình là <b>Miguel</b> ở <b>Philippines</b> — đất nước có hơn <b>7.000 hòn đảo</b>, là hàng xóm của Việt Nam qua Biển Đông.',
  'Hello! Mình là <b>Ruby</b> ở <b>Úc</b>. Khi Việt Nam đang hè thì bên mình là mùa đông, vì Úc nằm ở <b>Nam bán cầu</b>!',
];
const TURTLE_TALES = [
  'Năm <b>938</b>, Ngô Quyền cắm cọc gỗ dưới sông Bạch Đằng, chờ thủy triều rút để đánh tan quân Nam Hán.',
  'Năm <b>1010</b>, vua Lý Thái Tổ dời đô từ Hoa Lư ra Đại La, đặt tên là <b>Thăng Long</b> — nay là Hà Nội.',
  'Năm <b>1070</b> Văn Miếu được xây ở Thăng Long; năm 1076 có <b>Quốc Tử Giám</b>, trường đại học đầu tiên của nước ta.',
  'Truyền thuyết kể: <b>Rùa Vàng</b> đòi lại gươm thần của vua Lê Lợi, nên hồ ấy mang tên <b>Hồ Hoàn Kiếm</b>.',
  'Rùa mẹ bơi hàng nghìn km rồi quay về <b>đúng bãi biển nơi mình nở ra</b> để đẻ trứng. Đừng xả rác xuống biển nhé!',
];
const RIDDLES = [
  { q: 'Cái gì càng lấy đi lại càng to ra?', c: ['Cái hố', 'Quả bóng', 'Cái bánh'], a: 0, ex: 'Càng đào (lấy đất đi) thì cái hố càng to!' },
  { q: 'Con gì càng to càng nhỏ?', c: ['Con voi', 'Con cua', 'Con kiến'], a: 1, ex: '"Càng" cua to thì… cua vẫn nhỏ! Chơi chữ đấy.' },
  { q: 'Một con vịt đi trước hai con, một con đi sau hai con, một con đi giữa hai con. Có mấy con vịt?', c: ['3 con', '4 con', '5 con'], a: 0, ex: '3 con vịt đi thành một hàng là đủ.' },
  { q: 'Dãy 1, 1, 2, 3, 5, 8, … số tiếp theo là?', c: ['11', '13', '16'], a: 1, ex: 'Mỗi số bằng tổng 2 số liền trước: 5 + 8 = 13.' },
  { q: 'Cái gì đen khi mua về, đỏ khi dùng và xám khi vứt đi?', c: ['Than', 'Ớt', 'Mực'], a: 0, ex: 'Than đen, cháy đỏ, thành tro xám.' },
];
// Chòm sao [phương vị°, độ cao°, tên] — Bắc là -z. Đường nối theo chỉ số.
const STARS = [
  [0, 21, 'Sao Bắc Cực (Polaris) — luôn ở hướng Bắc'],
  [-22, 38, 'Thiên Khu (Dubhe) — sao "chỉ đường" của Bắc Đẩu'], [-26.4, 41.4, 'Thiên Toàn (Merak) — sao "chỉ đường" thứ hai'], [-33, 37, 'Thiên Cơ (Phecda)'], [-29.5, 33, 'Thiên Quyền (Megrez) — mờ nhất Bắc Đẩu'],
  [-35, 28, 'Ngọc Hành (Alioth) — sáng nhất Bắc Đẩu'], [-40, 25, 'Khai Dương (Mizar) — thật ra là sao đôi!'], [-46, 20, 'Dao Quang (Alkaid) — cuối cán gáo'],
  [22, 33, 'Caph — chòm Thiên Hậu (hình chữ W)'], [27, 38, 'Schedar — sáng nhất chòm Thiên Hậu'], [32, 33, 'Gamma Cas — chòm Thiên Hậu'], [37, 37, 'Ruchbah — chòm Thiên Hậu'], [42, 32, 'Segin — chòm Thiên Hậu'],
];
const STAR_LINES = [[1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [5, 6], [6, 7], [8, 9], [9, 10], [10, 11], [11, 12]];

// ---------- dựng hình: khối cơ bản gộp 1 mesh, màu theo đỉnh ----------
const _c = new THREE.Color();
function part(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv');
  g.scale(sx, sy, sz); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz); g.translate(x, y, z);
  _c.set(color); const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), ball = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
const vmat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
const meshOf = (parts, mat = vmat) => { const m = new THREE.Mesh(mergeGeos(parts), mat); m.receiveShadow = true; return m; };   // không đổ bóng: giữ ≤ 8 draw call
// dịch/xoay danh sách part về vị trí thế giới
const place = (list, x, y, z, ry = 0, s = 1) => list.map(g => { g.scale(s, s, s); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; });

export function createEasterEggs(ctx) {
  const { scene, terrain, camera, player } = ctx, mobile = CFG.isMobile;
  const S = Object.assign({ found: {}, cubes: [], ring: [], tale: 0 }, load()); const save = () => store(S); let wearInit = false;
  const H = (x, z) => terrain.heightAt(x, z);
  const near = (x, z, r) => Math.hypot(player.pos.x - x, player.pos.z - z) < r;
  const delay = []; const later = (s, fn) => delay.push({ t: s, fn });

  // ================= ÂM THANH tự tổng hợp (WebAudio, theo nút bật/tắt tiếng chung) =================
  const AC = () => { const a = ctx.audio; return a && a.on && a.listener.context.state === 'running' ? a.listener.context : null; };
  function tone(f, dur = 0.3, type = 'sine', vol = 0.18, f2 = 0, at = 0) {
    const ac = AC(); if (!ac) return; const t0 = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.audio.listener.getInput()); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur = 0.6, vol = 0.25, lp = 900, at = 0) {
    const ac = AC(); if (!ac) return; const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.frequency.value = lp; g.gain.value = vol;
    s.connect(f).connect(g).connect(ctx.audio.listener.getInput()); s.start(ac.currentTime + at);
  }
  const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.12, 0, i * 0.08));   // nốt Đô–Mi–Son–Đô
  const fanfare = () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.7, 'triangle', 0.13, 0, i * 0.11));

  // ================= HẠT SÁNG dùng chung (1 draw call) =================
  const NP = mobile ? 1597 : 2584;   // số Fibonacci
  const pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 4), pSize = new Float32Array(NP);
  const vel = new Float32Array(NP * 3), life = new Float32Array(NP), maxL = new Float32Array(NP), base = new Float32Array(NP * 3), bSize = new Float32Array(NP), grav = new Float32Array(NP), drag = new Float32Array(NP), flick = new Float32Array(NP);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('aCol', new THREE.BufferAttribute(pCol, 4).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uScale: { value: 300 } },
    vertexShader: 'attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vC; void main(){ vC = aCol; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = clamp(aSize*uScale/-mv.z, 1., 64.); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying vec4 vC; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.15,d) * vC.a; if (a < .02) discard; gl_FragColor = vec4(vC.rgb * (1. + .6 * smoothstep(.3,0.,d)), a); }',
  });
  const points = new THREE.Points(pg, pMat); points.frustumCulled = false; points.visible = false; points.renderOrder = 5; scene.add(points);
  let pTop = 0, pCur = 0;
  function spawn(x, y, z, vx, vy, vz, l, col, size, g = 0, dr = 0, fl = 0) {
    let i = pCur, k = 0; while (life[i] > 0 && k++ < NP) i = (i + 1) % NP; if (k >= NP) return -1;
    pCur = (i + 1) % NP; pPos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3); life[i] = maxL[i] = l;
    _c.set(col); base.set([_c.r, _c.g, _c.b], i * 3); bSize[i] = size; grav[i] = g; drag[i] = dr; flick[i] = fl; if (i >= pTop) pTop = i + 1; return i;
  }
  function updateParticles(dt, t) {
    let top = 0;
    for (let i = 0; i < pTop; i++) {
      if (life[i] <= 0) { pSize[i] = 0; continue; }
      life[i] -= dt; if (life[i] <= 0) { pSize[i] = 0; pCol[i * 4 + 3] = 0; continue; } top = i + 1;
      const j = i * 3, k = drag[i] ? Math.exp(-drag[i] * dt) : 1;
      vel[j] *= k; vel[j + 1] = vel[j + 1] * k - grav[i] * dt; vel[j + 2] *= k;
      pPos[j] += vel[j] * dt; pPos[j + 1] += vel[j + 1] * dt; pPos[j + 2] += vel[j + 2] * dt;
      const age = maxL[i] - life[i], a = Math.min(1, age * 4, life[i] / Math.min(1.2, maxL[i] * 0.5)) * (flick[i] ? 0.55 + 0.45 * Math.sin(t * flick[i] + i) : 1);
      const q = i * 4; pCol[q] = base[j]; pCol[q + 1] = base[j + 1]; pCol[q + 2] = base[j + 2]; pCol[q + 3] = a; pSize[i] = bSize[i];
    }
    pTop = top; points.visible = top > 0; if (!top) return;
    pg.setDrawRange(0, top); for (const k of ['position', 'aCol', 'aSize']) { const a = pg.attributes[k]; a.clearUpdateRanges(); a.addUpdateRange(0, top * a.itemSize); a.needsUpdate = true; }   // chỉ gửi phần đang dùng lên GPU
    pMat.uniforms.uScale.value = innerHeight * ctx.renderer.getPixelRatio() * 0.5;
  }
  const burst = (x, y, z, n, col, sp = 12, l = 1.8, size = 0.9) => { for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * TAU, r = Math.sqrt(1 - u * u), s = sp * (0.6 + Math.random() * 0.4); spawn(x, y, z, r * Math.cos(a) * s, u * s, r * Math.sin(a) * s, l * (0.7 + Math.random() * 0.5), col, size, 3, 1.6, 0); } };
  const sparkle = (x, y, z, n = 21, col = '#ffe58a', r = 1.2) => { for (let i = 0; i < n; i++) spawn(x + (Math.random() - 0.5) * r, y + Math.random() * r, z + (Math.random() - 0.5) * r, (Math.random() - 0.5), 1 + Math.random() * 2, (Math.random() - 0.5), 1 + Math.random(), col, 0.35, 0, 0.5, 13); };

  // ================= SỔ BÍ MẬT + bàn phím mật mã =================
  const css = document.createElement('style');
  css.textContent = `#eggBook{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#0a1a2acc;padding:13px}#eggBook[hidden]{display:none}
#eggBook .card{width:min(100%,560px);max-height:min(88vh,720px);overflow:auto;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:16px 18px;border-top:8px solid #e2b33c;font:15px/1.5 system-ui}
#eggBook h3{margin:0 0 8px;font-size:21px;text-align:center}#eggBook .bar{height:8px;border-radius:5px;background:#efe3cc;margin:0 0 10px;overflow:hidden}#eggBook .bar i{display:block;height:100%;background:linear-gradient(90deg,#f2c14e,#e2763c)}
#eggBook .bdg{display:flex;justify-content:space-between;gap:5px;margin:10px 0 4px}#eggBook .bdg span{flex:1;text-align:center;font-size:26px;line-height:1.1;background:#efe3c8;border-radius:13px;padding:5px 0;filter:grayscale(1);opacity:.55}#eggBook .bdg span.on{filter:none;opacity:1;background:#ffeeb0}#eggBook .bdg small{display:block;font:800 11px system-ui}#eggBook .wear{display:flex;gap:8px;margin:6px 0}#eggBook .wear button{flex:1}#eggBook .nx{display:block;text-align:center;opacity:.75;font-size:13px}
#eggBook li{list-style:none;padding:8px 10px;margin:5px 0;border-radius:13px;background:#f6ecd8}#eggBook li.ok{background:#e4f5dc}#eggBook li small{display:block;opacity:.8;font-size:13px}#eggBook ul{padding:0;margin:0}
#eggBook .pad{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px}#eggBook button{padding:11px 8px;border-radius:13px;border:0;background:#efe3cc;font:700 16px system-ui;color:#3a2a1a}
#eggBook .code{font:800 21px ui-monospace,monospace;letter-spacing:5px;text-align:center;background:#1b1626;color:#ffe58a;border-radius:13px;padding:8px;margin-top:10px;min-height:1.6em}
#eggBook .x{width:100%;margin-top:10px;background:#f0a23a}#eggBook .ch{display:grid;gap:8px;margin-top:10px}#eggBook .ch button.ok{background:#c9efc9}#eggBook .ch button.bad{background:#ffd0c8}`;
  document.head.appendChild(css);
  const book = document.createElement('div'); book.id = 'eggBook'; book.hidden = true; document.body.appendChild(book);
  const bBook = document.createElement('button'); bBook.id = 'bEggs'; bBook.title = 'Sổ bí mật';
  (document.querySelector('.topbtns') || document.body).appendChild(bBook);
  const count = () => EGGS.filter(e => S.found[e.id]).length;
  const label = () => { bBook.textContent = `📖 ${count()}/${EGGS.length}`; };
  // ---- đồ thưởng: mũ + áo choàng, bám theo xương đầu/ngực của nhân vật (đổi màu theo mốc cao nhất đã đạt) ----
  S.wear = Object.assign({ hat: true, cape: true }, S.wear);
  const unlocked = () => TIERS.filter(T => count() >= T.n);
  const pickCol = k => { let c = null; for (const T of unlocked()) if (T[k]) c = T[k]; return c; };
  const wear = { hat: null, cape: null };
  function dress() {
    const root = player.root; if (!root) return;
    for (const k of ['hat', 'cape']) { const col = S.wear[k] && pickCol(k); if (!col) { if (wear[k]) wear[k].visible = false; continue; }
      if (!wear[k]) { const g = new THREE.Group(), m = new THREE.MeshToonMaterial({ color: col, gradientMap });
        if (k === 'hat') { const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.17, 12), m), brim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 16), m), band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.045, 12, 1, true), new THREE.MeshToonMaterial({ color: '#1b1626', gradientMap })); crown.position.y = 0.1; band.position.y = 0.04; g.add(crown, brim, band); }
        else { const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.72, 10, 1, true, Math.PI * 0.62, Math.PI * 0.76), m); cp.material.side = THREE.DoubleSide; cp.position.y = -0.36; g.add(cp); }
        g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g); wear[k] = g; }
      wear[k].visible = true; wear[k].traverse(o => { if (o.isMesh && o.material.color && o.material.side === (k === 'cape' ? THREE.DoubleSide : THREE.FrontSide) && !(k === 'hat' && o.material.color.getHexString() === '1b1626')) o.material.color.set(col); });
    }
  }
  const _wv = new THREE.Vector3();
  function placeWear() {
    const h = player.hero; if (!h || !player.root) return;
    const head = h.head, chest = h.model.getObjectByName('chest') || head;
    if (wear.hat && wear.hat.visible && head) { head.getWorldPosition(_wv); player.root.worldToLocal(_wv); wear.hat.position.set(_wv.x, _wv.y + 0.25 * (h.height || 1.65) / 1.65, _wv.z); }
    if (wear.cape && wear.cape.visible && chest) { chest.getWorldPosition(_wv); player.root.worldToLocal(_wv); wear.cape.position.set(_wv.x, _wv.y + 0.12, _wv.z); }
  }
  const badgesHTML = () => `<div class="bdg">${TIERS.map(T => count() >= T.n ? `<span class="on" title="${T.name}">${T.icon}<small>${T.n}</small></span>` : `<span title="Tìm ${T.n} bí mật">🔒<small>${T.n}</small></span>`).join('')}</div>`
    + (unlocked().length ? `<div class="wear">${pickCol('hat') ? `<button data-w="hat">${S.wear.hat ? '✅' : '⬜'} Đội mũ</button>` : ''}${pickCol('cape') ? `<button data-w="cape">${S.wear.cape ? '✅' : '⬜'} Áo choàng</button>` : ''}</div>` : '')
    + `<small class="nx">${(T => T ? `Còn ${T.n - count()} bí mật nữa để nhận ${T.icon} ${T.name} + ${T.gift}` : 'Bạn đã nhận đủ huy hiệu!')(TIERS.find(T => count() < T.n))}</small>`;
  let code = '';
  const close = () => { book.hidden = true; player.frozen = false; };
  function openBook() {
    const n = count(), cubes = S.cubes.filter(Boolean).length;
    book.innerHTML = `<div class="card"><h3>📖 Sổ bí mật · ${n}/${EGGS.length}</h3><div class="bar"><i style="width:${n / EGGS.length * 100}%"></i></div>${badgesHTML()}<ul>${EGGS.map(e => S.found[e.id]
      ? `<li class="ok">${e.icon} <b>${e.name}</b><small>💡 ${e.learn}</small></li>`
      : `<li>❓ <b>???</b>${e.id === 'cubes' ? ` <small>Đã có ${cubes}/8 khối · ${e.hint}</small>` : `<small>Gợi ý: ${e.hint}</small>`}</li>`).join('')}</ul>
      <div class="code" id="eggCode">${code || '🔢 nhập mật mã'}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button data-d="${d}">${d}</button>`).join('')}</div>
      <button class="x" id="eggX">Đóng sổ</button></div>`;
    book.hidden = false; player.frozen = true;
    book.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { digit(b.dataset.d); const c = book.querySelector('#eggCode'); if (c) c.textContent = code; });
    book.querySelector('#eggX').onclick = close;
    book.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { S.wear[b.dataset.w] = !S.wear[b.dataset.w]; save(); dress(); openBook(); });
  }
  bBook.onclick = () => book.hidden ? openBook() : close();
  addEventListener('keydown', e => { if (e.code === 'Escape' && !book.hidden) close(); });
  function give(id, extra = '') {
    if (S.found[id]) return false; S.found[id] = Date.now(); save(); label();
    const e = EGGS.find(q => q.id === id), n = count();
    ctx.toast(`🎉 <b>Bí mật ${n}/${EGGS.length}: ${e.icon} ${e.name}</b>${extra ? '<br>' + extra : ''}<br><small>💡 ${e.learn}</small>`, 7000);
    fanfare(); ctx.player.emote && ctx.player.emote('cheer');
    const T = TIERS.find(q => q.n === n); if (T) later(7.3, () => { dress(); ctx.toast(`${T.icon} <b>${T.name}!</b> (${n} bí mật — số Fibonacci)<br>Phần thưởng: <b>${T.gift}</b> đã mặc cho nhân vật. Bật/tắt trong 📖 Sổ bí mật.`, 8000); fanfare(); });
    if (n === EGGS.length) later(7.5, () => { ctx.toast(`🏆 <b>Bạn đã tìm đủ ${EGGS.length} bí mật của Đảo Rubik!</b><br>${EGGS.length} cũng là một số Fibonacci. Bạn là <b>Nhà Thám Hiểm φ</b>!`, 9000); fireworks(); });
    return true;
  }
  label();

  // ---- mật mã: phím số trên bàn phím hoặc bàn phím trong sổ ----
  function digit(d) {
    code = (code + d).slice(-8);
    if (code.endsWith('31415')) { code = ''; close(); fireworks(); later(1.2, () => give('pi', '3,1415… Bạn nhớ số π giỏi quá!')); }
    else if (code.endsWith('112358')) { code = ''; close(); sunflowerBloom(); later(1.0, () => give('fibo', '1, 1, 2, 3, 5, 8 — mỗi số bằng tổng 2 số liền trước.')); }
  }
  addEventListener('keydown', e => { const m = /^(Digit|Numpad)(\d)$/.exec(e.code); if (m && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) digit(m[2]); });

  // ---- pháo hoa: hình chữ π giữa trời + vài chùm màu ----
  const piPts = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 48; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.font = 'bold 46px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('π', 24, 22);
    const d = g.getImageData(0, 0, 48, 48).data, out = [];
    for (let y = 0; y < 48; y += 2) for (let x = 0; x < 48; x += 2) if (d[(y * 48 + x) * 4 + 3] > 128) out.push([x - 24, 24 - y]);
    return out;
  })();
  function fireworks() {
    const fx = -Math.sin(player.cam.yaw), fz = -Math.cos(player.cam.yaw), rx = -fz, rz = fx;
    const cx = player.pos.x + fx * 60, cz = player.pos.z + fz * 60, cy = Math.max(player.pos.y, 0) + 17;
    for (let k = 0; k < 13; k++) later(k * 0.05, () => spawn(cx + (Math.random() - 0.5), cy - 16 + k * 1.3, cz, 0, 0, 0, 0.5, '#ffcf6a', 1.2));   // vệt pháo bay lên
    tone(300, 1.1, 'sine', 0.06, 1400);
    later(0.8, () => {
      noise(1.2, 0.35, 700);
      const D = 2.6, s = 0.6;   // đuôi chậm dần: vận tốc = toạ độ × lực cản → dừng đúng hình chữ π
      for (const [u, v] of piPts) spawn(cx, cy, cz, (rx * u * s) * D, v * s * D, (rz * u * s) * D, 4.2 + Math.random() * 0.6, Math.random() < 0.8 ? '#ffc23a' : '#ff7a3a', 2.4, 0.25, D, 0);
    });
    [['#ff6a5a', -21, 6], ['#6ad1ff', 21, 8], ['#b98aff', -13, 16], ['#7aff9a', 13, 18]].forEach(([c, off, h], i) =>
      later(1.6 + i * 0.45, () => { burst(cx + rx * off, cy + h * 0.6, cz + rz * off, mobile ? 55 : 89, c, 9, 1.8, 1.2); noise(0.8, 0.2, 1200); }));
  }
  // ---- hoa Fibonacci: 144 hạt xếp theo góc vàng, nở dần trước mặt ----
  function sunflowerBloom() {
    const fx = -Math.sin(player.cam.yaw), fz = -Math.cos(player.cam.yaw), rx = -fz, rz = fx;
    const cx = player.pos.x + fx * 10, cy = player.pos.y + 3.8, cz = player.pos.z + fz * 10, N = 144, c = 0.3;
    for (let i = 1; i <= N; i++) later(i * 0.018, () => {
      const r = c * Math.sqrt(i), a = i * GOLD_ANGLE, u = Math.cos(a) * r, v = Math.sin(a) * r;
      spawn(cx + rx * u, cy + v, cz + rz * u, 0, 0, 0, 13 - i * 0.018, i > 110 ? '#ffc93a' : i % 2 ? '#a0521e' : '#d98b2b', i > 110 ? 0.8 : 0.5);
      if (i % 13 === 0) tone(392 * Math.pow(2, (i / 144) * 1.5), 0.25, 'triangle', 0.07);
    });
    for (let k = 0; k < 34; k++) { const a = k * TAU / 34, R = c * 12.6; later(2.7 + k * 0.02, () => spawn(cx + rx * Math.cos(a) * R, cy + Math.sin(a) * R, cz + rz * Math.cos(a) * R, rx * Math.cos(a) * 0.6, Math.sin(a) * 0.6, rz * Math.cos(a) * 0.6, 10, '#ffe14a', 1.3, 0, 0.5)); }
  }

  // ================= 1) 8 KHỐI RUBIK VÀNG (InstancedMesh) =================
  const cubeGeo = new THREE.BoxGeometry(0.89, 0.89, 0.89);   // ≈ 1/φ m (khối nhỏ) — viền tối bằng khối hơi to bên trong
  const cubeMat = new THREE.MeshToonMaterial({ color: '#f2c14e', emissive: '#a8740c', emissiveIntensity: 0.55, gradientMap });
  const cubes = new THREE.InstancedMesh(cubeGeo, cubeMat, 8); cubes.frustumCulled = false; scene.add(cubes);
  const cubeY = CUBES.map(([x, z, y]) => y ?? H(x, z) + 0.9);
  const dm = new THREE.Object3D();
  function setCube(i, t) {
    if (S.cubes[i]) dm.scale.setScalar(0); else { dm.scale.setScalar(1); }
    dm.position.set(CUBES[i][0], cubeY[i] + Math.sin(t * 2 + i) * 0.21, CUBES[i][1]); dm.rotation.set(0.6, t * 1.3 + i, 0.6); dm.updateMatrix(); cubes.setMatrixAt(i, dm.matrix);
  }
  for (let i = 0; i < 8; i++) setCube(i, 0);
  function takeCube(i) {
    S.cubes[i] = 1; save(); const n = S.cubes.filter(Boolean).length; chime(); sparkle(CUBES[i][0], cubeY[i], CUBES[i][1], 34);
    ctx.toast(`🟨 <b>Khối Rubik vàng ${n}/8</b> (${CUBES[i][3]})<br><small>💡 ${RUBIK_FACTS[i]}</small>`, 5500);
    if (n === 8) later(5.6, () => { give('cubes'); later(7.2, () => ctx.toast('🌀 Đủ 8 khối! Mang chúng tới trước cổng <b>Đền Tri Thức</b> nhé.', 5000)); });
  }

  // ================= 2) BÍ MẬT ĐỀN: xoắn ốc vàng Fibonacci =================
  const tc = Math.cos(Math.PI / 4), ts = Math.sin(Math.PI / 4), tW = (lx, lz) => [TEMPLE_C[0] + lx * tc + lz * ts, TEMPLE_C[1] - lx * ts + lz * tc];
  const [altX, altZ] = tW(0, 7.5);   // trước cổng đền
  let spAcc = 0;
  function spiralTick(dt) {   // rải hạt sáng dọc xoắn ốc vàng r = a·φ^(2θ/π) trên cổng đền (233 hạt/giây — số Fibonacci)
    const [ox, oz] = tW(0, 3), oy = H(TEMPLE_C[0], TEMPLE_C[1]) + 11;
    spAcc += dt * (mobile ? 144 : 233); const n = Math.floor(spAcc); spAcc -= n;
    for (let k = 0; k < n; k++) {
      const th = Math.random() * 2.5 * Math.PI, r = 0.5 * Math.pow(PHI, 2 * th / Math.PI), u = Math.cos(th) * r, v = Math.sin(th) * r * 0.9;
      spawn(ox + u * tc, oy + v, oz - u * ts, 0, 0.3, 0, 1.3, Math.random() < 0.3 ? '#fff4c8' : '#ffc93a', 0.8, 0, 0, 8);
    }
  }

  // ================= ĐỒ TĨNH gộp 1 mesh: rùa, kính thiên văn, cây đa, bia đá, luống hạt giống, mèo =================
  const st = [];
  { // cụ rùa biển (≈ 3 m)
    const [x, z] = TURTLE, y = H(x, z);
    st.push(...place([part(ball(1.4, 10, 6), '#5d7a3a', 0, 0.55, 0, 0, 0, 0, 1.2, 0.55, 1.45), part(ball(1.45, 10, 6), '#3f5a2a', 0, 0.5, 0, 0, 0, 0, 1.18, 0.38, 1.42),
      part(ball(0.5), '#8aa06a', 0, 0.55, 2.0, 0, 0, 0, 0.9, 0.8, 1.2), part(ball(0.09), '#111', 0.27, 0.7, 2.35), part(ball(0.09), '#111', -0.27, 0.7, 2.35),
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => part(box(1.3, 0.14, 0.55), '#8aa06a', sx * 1.55, 0.25, sz * 1.0, 0, sx * sz * 0.5, 0))], x, y, z, 2.4));
    ctx.colliders.push({ x, z, r: 2 });
  }
  { // kính thiên văn trên Đồi Hoàng Hôn
    const [x, z] = SCOPE, y = H(x, z);
    st.push(...place([part(cyl(1.1, 1.2, 0.2, 13), '#b9a888', 0, 0.1, 0), ...[0, 1, 2].map(k => part(cyl(0.05, 0.05, 1.5, 5), '#5a3a22', Math.cos(k * 2.09) * 0.35, 0.85, Math.sin(k * 2.09) * 0.35, Math.cos(k * 2.09) * 0.25, 0, -Math.sin(k * 2.09) * 0.25)),
      part(cyl(0.16, 0.22, 1.9, 10), '#2a4f8a', 0, 1.85, -0.2, -1.0), part(cyl(0.24, 0.24, 0.12, 10), '#e2b33c', 0, 2.5, -0.72, -1.0), part(cyl(0.06, 0.06, 0.3, 6), '#333', 0, 1.35, 0.45, -1.0)], x, y, z, 0));
    ctx.colliders.push({ x, z, r: 0.9 });
  }
  { // cây đa nghìn năm: thân to, rễ phụ, tán xoè
    const [x, z] = BANYAN, y = H(x, z) - 0.2, L = [];
    L.push(part(cyl(1.0, 1.7, 8, 9), '#6b5038', 0, 4, 0));
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8, r = 2.2 + (k % 3); L.push(part(cyl(0.12, 0.16, 7.5, 5), '#7a5d42', Math.cos(a) * r, 3.75, Math.sin(a) * r)); }
    for (let k = 0; k < 5; k++) { const a = k * GOLD_ANGLE, r = k ? 3.6 : 0; L.push(part(new THREE.IcosahedronGeometry(3.4, 0), k % 2 ? '#3f7a3a' : '#2f6a33', Math.cos(a) * r, 8.5 + (k % 2), Math.sin(a) * r, 0, k, 0, 1.4, 0.6, 1.4)); }
    st.push(...place(L, x, y, z)); ctx.colliders.push({ x, z, r: 1.8 });
  }
  const steleY = H(...STELE);
  { // bia đá trên lưng rùa đá (như bia Văn Miếu)
    const [x, z] = STELE;
    st.push(...place([part(box(1.4, 2.2, 0.35), '#9a958a', 0, 1.6, 0), part(box(1.6, 0.25, 0.45), '#8a8578', 0, 2.8, 0), part(ball(0.8, 8, 5), '#8a8578', 0, 0.35, 0.1, 0, 0, 0, 1.1, 0.5, 1.6), part(ball(0.28), '#8a8578', 0, 0.4, 1.35)], x, steleY, z, -3 * Math.PI / 4));   // mặt bia nhìn ra đường
    ctx.colliders.push({ x, z, r: 1 });
  }
  { // luống đất + túi hạt giống ở vườn cộng đồng
    const [x, z] = SEED;
    st.push(...place([part(cyl(1.3, 1.5, 0.3, 13), '#6b4a2b', 0, 0.15, 0), part(cyl(0.3, 0.38, 0.6, 8), '#d8c08a', 1.9, 0.3, 0.4), part(cyl(0.18, 0.3, 0.2, 8), '#c4a46a', 1.9, 0.7, 0.4), part(box(0.5, 0.3, 0.02), '#f2c14e', 1.9, 0.35, 0.79)], x, TOWN_Y, z));
  }
  // mèo: nằm trên mái nhà bằng 3 tầng (nhà ông) — đợi dữ liệu nhà của trường
  let cat = null;
  function buildCat() {
    const L = HOUSE_LOTS.find(q => q.house && q.house.k === 'nhaong') || HOUSE_LOTS.find(q => q.house);
    const [x, z] = L ? lotToWorld(L, 1.5, HOUSE_V1 - HOUSE_D / 2) : [SEED[0] - 4, SEED[1] - 4], y = L ? TOWN_Y + (L.house.k === 'nhaong' ? 5.7 + 0.35 : 4.4) : TOWN_Y;
    cat = { x, y, z };
    return place([part(ball(0.32, 8, 6), '#e08a3a', 0, 0.2, 0, 0, 0, 0, 1.6, 0.8, 1), part(ball(0.2), '#e08a3a', 0.5, 0.25, 0.05),
      part(new THREE.ConeGeometry(0.07, 0.14, 4), '#e08a3a', 0.47, 0.45, -0.07), part(new THREE.ConeGeometry(0.07, 0.14, 4), '#e08a3a', 0.47, 0.45, 0.17),
      part(cyl(0.05, 0.05, 0.7, 5), '#c46a2a', -0.45, 0.12, 0.25, 0, 0.8, Math.PI / 2), part(box(0.5, 0.06, 0.08), '#a85a1a', 0, 0.42, 0)], x, y, z, L ? L.ry : 0);
  }
  // ---- đợt 2: đồ tĩnh (gộp chung mesh tĩnh, không thêm draw call) ----
  const BOTTLE = (() => { for (let r = 340; r > 200; r -= 0.5) { const x = 6, z = r, h = H(x, z); if (h > 0.35) return [x, z - 1.5]; } return [6, 285]; })();   // mép cát bãi biển phía Nam
  { // đồng hồ mặt trời: mặt số 12 vạch + kim bóng (gnomon) chỉ hướng Bắc
    const [x, z] = SUNDIAL, L = [part(cyl(1.2, 1.35, 0.6, 13), '#cfc6b4', 0, 0.3, 0), part(cyl(1.25, 1.25, 0.06, 21), '#efe6d0', 0, 0.63, 0)];
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12; L.push(part(box(0.06, 0.04, 0.3), '#6b4a2b', Math.sin(a) * 1.02, 0.67, -Math.cos(a) * 1.02, 0, -a, 0)); }
    L.push(part(box(0.05, 0.55, 1.1), '#b8862e', 0, 0.86, 0.05, -0.36));   // kim bóng nghiêng theo vĩ độ (~20°), chỉ hướng Bắc
    st.push(...place(L, x, TOWN_Y, z)); ctx.colliders.push({ x, z, r: 1.3 });
  }
  { // cột đồng hồ chim cu: cột gỗ, hộp đồng hồ mái nhọn, mặt số, cửa sổ nhỏ
    const [x, z] = CUCKOO;
    st.push(...place([part(cyl(0.12, 0.15, 2.6, 6), '#6b4a2b', 0, 1.3, 0), part(box(1.0, 1.1, 0.6), '#8a5a34', 0, 3.1, 0), part(new THREE.ConeGeometry(0.85, 0.6, 4), '#5a3a22', 0, 3.95, 0, 0, Math.PI / 4),
      part(cyl(0.34, 0.34, 0.05, 13), '#fff4d6', 0, 3.05, 0.31, Math.PI / 2), part(box(0.04, 0.26, 0.02), '#222', 0, 3.15, 0.35), part(box(0.18, 0.04, 0.02), '#222', 0.07, 3.05, 0.35),
      part(box(0.3, 0.26, 0.04), '#2a1a0e', 0, 3.5, 0.31), part(box(0.05, 0.5, 0.05), '#e2b33c', -0.15, 2.3, 0.3), part(box(0.05, 0.4, 0.05), '#e2b33c', 0.15, 2.35, 0.3)], x, TOWN_Y, z, -Math.PI / 2));
    ctx.colliders.push({ x, z, r: 0.6 });
  }
  { // giếng cổ: thành đá tròn, 2 cột, mái nhỏ, gàu
    const [x, z] = WELL, y = H(x, z) - 0.1, L = [part(cyl(1.1, 1.2, 0.9, 13), '#9a958a', 0, 0.45, 0), part(cyl(0.85, 0.85, 0.05, 13), '#1a2a3a', 0, 0.86, 0)];
    for (const sx of [-1, 1]) L.push(part(box(0.14, 2.2, 0.14), '#6b4a2b', sx * 1.0, 1.1, 0));
    L.push(part(box(2.5, 0.08, 1.4), '#7a3b2e', 0, 2.3, 0.35, 0.5), part(box(2.5, 0.08, 1.4), '#7a3b2e', 0, 2.3, -0.35, -0.5), part(cyl(0.06, 0.06, 2.0, 6), '#5a3a22', 0, 1.8, 0, 0, 0, Math.PI / 2), part(cyl(0.18, 0.14, 0.3, 8), '#8a6a3a', 0.3, 1.3, 0));
    st.push(...place(L, x, y, z, 0.6)); ctx.colliders.push({ x, z, r: 1.3 });
  }
  { // Tháp Hà Nội: bệ gỗ, 3 cọc, 3 đĩa (to → nhỏ) ở cọc trái
    const [x, z] = HANOI, y = H(x, z) - 0.05, L = [part(box(4.2, 0.3, 1.3), '#8a5a34', 0, 0.15, 0)];
    for (const k of [-1, 0, 1]) L.push(part(cyl(0.07, 0.07, 1.6, 6), '#e8d2a8', k * 1.4, 1.0, 0));
    [['#e8453c', 0.6], ['#f2c14e', 0.45], ['#3d8fd9', 0.3]].forEach(([c, r], i) => L.push(part(cyl(r, r, 0.22, 13), c, -1.4, 0.42 + i * 0.23, 0)));
    st.push(...place(L, x, y, z, 0.4)); ctx.colliders.push({ x, z, r: 1.6 });
  }
  { // chai thông điệp nằm trên cát
    const [x, z] = BOTTLE, y = H(x, z) + 0.12;
    st.push(...place([part(cyl(0.13, 0.13, 0.5, 8), '#3f9a6a', 0, 0, 0, 0, 0, Math.PI / 2), part(cyl(0.05, 0.1, 0.18, 8), '#3f9a6a', 0.33, 0, 0, 0, 0, Math.PI / 2), part(cyl(0.05, 0.05, 0.08, 6), '#c49a6a', 0.45, 0, 0, 0, 0, Math.PI / 2), part(box(0.3, 0.12, 0.12), '#f2e6c0', -0.02, 0, 0)], x, y, z, 0.7, 1.6));
  }
  { // hòn đá có hoá thạch cúc đá (ammonite): xoắn ốc vàng nổi trên mặt đá
    const [x, z] = FOSSIL, y = H(x, z) - 0.3, L = [part(new THREE.IcosahedronGeometry(1.3, 0), '#8f8a80', 0, 0.9, 0, 0, 0, 0, 1.3, 1, 1)];
    for (let k = 0; k < 34; k++) { const th = k * 0.32, r = 0.08 * Math.pow(PHI, 2 * th / Math.PI); if (r > 0.75) break; L.push(part(ball(0.035 + r * 0.09, 5, 4), '#d8c8a0', Math.cos(th) * r, 1.0 + Math.sin(th) * r, 1.05)); }
    st.push(...place(L, x, y, z, Math.PI / 3)); ctx.colliders.push({ x, z, r: 1.6 });
  }
  let statics = null;
  const buildStatics = () => { statics = meshOf([...st, ...buildCat()]); scene.add(statics); };

  // bia chữ: chữ 學 (Học) vẽ canvas
  let stelePlane = null;
  {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 192; const g = cv.getContext('2d');
    g.fillStyle = '#7d786e'; g.fillRect(0, 0, 128, 192); g.strokeStyle = '#5d584f'; g.lineWidth = 6; g.strokeRect(6, 6, 116, 180);
    g.fillStyle = '#f2e6c0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 84px "Noto Serif CJK SC","Noto Sans CJK SC","SimSun","PingFang SC",serif'; g.fillText('學', 64, 82);
    g.font = 'bold 26px Georgia,serif'; g.fillText('HỌC', 64, 160);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), new THREE.MeshBasicMaterial({ map: tex }));
    stelePlane = pl; const a = -3 * Math.PI / 4; pl.position.set(STELE[0] + Math.sin(a) * 0.18, steleY + 1.65, STELE[1] + Math.cos(a) * 0.18); pl.rotation.y = a; scene.add(pl);
  }

  // ================= HOA HƯỚNG DƯƠNG từ hạt giống (lớn theo thời gian thật) =================
  const flower = meshOf([part(cyl(0.07, 0.1, 2.6, 6), '#4f8a3a', 0, 1.3, 0), part(box(0.6, 0.04, 0.3), '#5fa04a', 0.3, 1.0, 0, 0, 0, 0.4), part(box(0.6, 0.04, 0.3), '#5fa04a', -0.3, 1.6, 0, 0, 0, -0.4),
    part(cyl(0.45, 0.45, 0.12, 13), '#6b3a1a', 0, 2.75, 0.06, Math.PI / 2),
    ...Array.from({ length: 13 }, (_, k) => { const a = k * TAU / 13; return part(box(0.46, 0.22, 0.04), '#ffc93a', Math.cos(a) * 0.62, 2.75 + Math.sin(a) * 0.62, 0.02, 0, 0, a); })]);
  flower.position.set(SEED[0], TOWN_Y + 0.25, SEED[1]); flower.scale.setScalar(0.001); flower.visible = false; scene.add(flower);
  const GROW = 144;   // giây để nở (số Fibonacci)
  const grown = () => S.seed ? Math.min(1, (Date.now() - S.seed) / 1000 / GROW) : 0;

  // ================= VÒNG MÂY (InstancedMesh) =================
  const ringMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(8, 1.3, 6, 21), new THREE.MeshToonMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, gradientMap, transparent: true, opacity: 0.85 }), 3);
  ringMesh.frustumCulled = false; scene.add(ringMesh);
  const gold = new THREE.Color('#ffd25a'), white = new THREE.Color('#ffffff');
  RINGS.forEach((r, i) => { dm.position.set(...r); dm.rotation.set(0, i * GOLD_ANGLE, 0); dm.scale.setScalar(1); dm.updateMatrix(); ringMesh.setMatrixAt(i, dm.matrix); ringMesh.setColorAt(i, S.ring[i] ? gold : white); });
  ringMesh.instanceColor.needsUpdate = true;
  const PAINT = { body: '#f2c14e', trim: '#1f3f8a', wing: '#fff4d6' };
  function paint(pl) {   // sơn lại máy bay bằng cách đổi màu đỉnh (thân → vàng φ)
    pl._phi = true; const m = pl.group.children[0], c = m.geometry.attributes.color, a = new THREE.Color(), map = Object.keys(PAINT).map(k => [new THREE.Color(pl.style[k]), new THREE.Color(PAINT[k])]);
    for (let i = 0; i < c.count; i++) { a.fromBufferAttribute(c, i); for (const [from, to] of map) if (Math.abs(a.r - from.r) + Math.abs(a.g - from.g) + Math.abs(a.b - from.b) < 0.01) { c.setXYZ(i, to.r, to.g, to.b); break; } }
    c.needsUpdate = true;
  }

  // ================= CÁ VOI nhảy ngoài khơi (hiếm) =================
  const whale = meshOf([part(ball(1, 12, 8), '#25384f', 0, 0, 0, 0, 0, 0, 2.1, 1.9, 6.5), part(ball(1, 10, 6), '#c9d6e0', 0, -0.7, 0.8, 0, 0, 0, 1.7, 1.3, 5.2),
    part(new THREE.ConeGeometry(1.1, 4.5, 8), '#25384f', 0, 0, -7.6, -Math.PI / 2), part(box(5.5, 0.25, 1.6), '#1f3045', 0, 0, -9.8), part(box(3.6, 0.2, 1.2), '#1f3045', 0, -0.9, 2.2, 0, 0, 0),
    part(ball(0.18), '#111', 1.6, 0.1, 4.6), part(ball(0.18), '#111', -1.6, 0.1, 4.6)]);
  whale.visible = false; whale.rotation.order = 'YXZ'; whale.scale.setScalar(1.3); scene.add(whale);
  const W = { on: false, t: 0, wait: 34 + Math.random() * 55, x: 0, z: 0, h: 0 };
  const VILLAGE = EXTRA.find(e => e.id === 'E').r;
  function whaleJump(force) {
    const p = player.pos, fx = -Math.sin(player.cam.yaw), fz = -Math.cos(player.cam.yaw);
    for (let k = 0; k < 13; k++) {   // tìm chỗ biển sâu trong tầm nhìn
      const a = Math.atan2(fz, fx) + (Math.random() - 0.5) * 0.9, d = 55 + Math.random() * 50, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (H(x, z) < -2.5 && H(x + 8, z) < -2 && H(x - 8, z) < -2 && rectDist(VILLAGE, x, z) > 21) { Object.assign(W, { on: true, t: 0, x, z, h: a + Math.PI / 2 + (Math.random() - 0.5) }); whale.visible = true; return true; }
    }
    return false;
  }
  function updateWhale(dt) {
    if (!W.on) {
      const out = Math.hypot(player.pos.x, player.pos.z) > 200 || (player.vehicle && player.vehicle.water) || (ctx.aircraft && ctx.aircraft.flying);
      if (out && (W.wait -= dt) <= 0) { W.wait = 55 + Math.random() * 89; whaleJump(); }
      return;
    }
    const T = 3.4, g = 9.8, vy = g * T / 2 * 0.86, t = W.t += dt, s = (t / T - 0.5) * 16;
    const y = -4.5 + vy * t - 0.5 * g * t * t, pitch = Math.atan2(vy - g * t, 16 / T);
    whale.position.set(W.x + Math.sin(W.h) * s, y, W.z + Math.cos(W.h) * s); whale.rotation.set(-pitch, W.h, t * 0.5);
    if (!W.up && y > -0.5) { W.up = true; burst(whale.position.x, 0.3, whale.position.z, 55, '#e8f6ff', 7, 1.6, 0.7); noise(0.9, 0.3, 1500); tone(180, 2.2, 'sine', 0.12, 90); }
    if (W.up && !W.down && t > T * 0.6 && y < 0.5) { W.down = true; burst(whale.position.x, 0.3, whale.position.z, 89, '#ffffff', 10, 2, 0.9); noise(1.4, 0.4, 1100); }
    if (t > T + 1) { W.on = W.up = W.down = false; whale.visible = false; if (Math.hypot(W.x - player.pos.x, W.z - player.pos.z) < 160) give('whale', 'Một chú cá voi vừa nhảy khỏi mặt biển!'); }
  }

  // ================= ÔNG BỤT dưới gốc đa =================
  const but = meshOf([part(new THREE.ConeGeometry(0.55, 1.5, 9), '#f4f1ea', 0, 0.75, 0), part(cyl(0.42, 0.42, 0.12, 9), '#c8302a', 0, 0.95, 0), part(ball(0.26), '#f1c9a0', 0, 1.7, 0),
    part(ball(0.28, 8, 6), '#ffffff', 0, 1.8, -0.06, 0, 0, 0, 1, 0.8, 1), part(ball(0.14), '#ffffff', 0, 2.03, -0.1), part(new THREE.ConeGeometry(0.18, 0.6, 6), '#ffffff', 0, 1.33, 0.18, Math.PI),
    part(cyl(0.04, 0.04, 2.1, 5), '#7a4a26', 0.55, 1.05, 0.1), part(ball(0.13), '#d9a440', 0.55, 2.15, 0.1)]);
  but.visible = false; scene.add(but);
  const butAt = [BANYAN[0] + 2.6, BANYAN[1] + 2.6]; let butT = 0, butOn = false;
  function summonBut() {
    if (butOn) return; butOn = true; but.visible = true; butT = 0; but.position.set(butAt[0], H(...butAt), butAt[1]);
    but.rotation.y = Math.atan2(player.pos.x - butAt[0], player.pos.z - butAt[1]); sparkle(butAt[0], H(...butAt), butAt[1], 55, '#fff4c8', 2.2); tone(880, 1.4, 'sine', 0.1, 1760);
    later(1.2, () => riddle());
  }
  function riddle() {
    const R = RIDDLES[Math.floor(Math.random() * RIDDLES.length)]; player.frozen = true;
    book.innerHTML = `<div class="card"><h3>🧙 Ông Bụt hiện lên</h3><p>"Vì sao con khóc? Trả lời đúng câu đố này, ta sẽ cho con một điều ước!"</p><p><b>${R.q}</b></p><div class="ch">${R.c.map((c, k) => `<button data-k="${k}">${c}</button>`).join('')}</div><p class="ex"></p></div>`;
    book.hidden = false;
    book.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === R.a; book.querySelectorAll('[data-k]').forEach((x, j) => { x.disabled = true; if (j === R.a) x.className = 'ok'; else if (j === k) x.className = 'bad'; });
      book.querySelector('.ex').innerHTML = `${ok ? '✅ Giỏi lắm!' : '💡 Chưa đúng rồi.'} ${R.ex}<br><button class="x" id="eggX">${ok ? 'Nhận điều ước ✨' : 'Lần sau thử lại nhé'}</button>`;
      book.querySelector('#eggX').onclick = () => {
        close(); later(0.4, () => { sparkle(but.position.x, but.position.y, but.position.z, 55, '#fff4c8', 2); butOn = false; but.visible = false; });
        if (ok) { give('but', '✨ Điều ước: hạt giống ở vườn trường sẽ lớn nhanh gấp đôi!'); S.fast = 1; save(); }
      };
    });
  }

  // ================= CHÒM SAO (đêm, kính thiên văn) =================
  let starOn = 0; const starW = [];
  function showStars() {
    const [x, z] = SCOPE, y = H(x, z) + 2, R = 240; starW.length = 0; starOn = 34;
    STARS.forEach(([az, alt, name], i) => {
      const A = az * 0.36 * Math.PI / 180, E = (alt * 0.36 - 5) * Math.PI / 180,   // thu nhỏ hình chòm sao để vừa khung camera
      p = new THREE.Vector3(x + Math.sin(A) * Math.cos(E) * R, y + Math.sin(E) * R, z - Math.cos(A) * Math.cos(E) * R);
      starW.push({ p, name }); spawn(p.x, p.y, p.z, 0, 0, 0, starOn, i === 0 ? '#bfe3ff' : i < 8 ? '#fff4c8' : '#ffd0e8', i === 0 ? 13 : 10, 0, 0, 3);
    });
    for (const [a, b] of STAR_LINES) { const A = starW[a].p, B = starW[b].p, n = Math.ceil(A.distanceTo(B) / 2.1); for (let k = 1; k < n; k++) { const q = A.clone().lerp(B, k / n); spawn(q.x, q.y, q.z, 0, 0, 0, starOn, '#8fb0ff', 3.4); } }
    for (let k = 1; k < 21; k += 2) { const q = starW[1].p.clone().lerp(starW[0].p, k / 21); spawn(q.x, q.y, q.z, 0, 0, 0, starOn, '#7a8aaa', 2.6); }   // đường chỉ tới sao Bắc Cực
    player.cam.yaw = 0; player.cam.pitch = 0.05;   // quay mặt về hướng Bắc
    ctx.toast('🔭 Nhìn về hướng <b>Bắc</b>: 7 sao hình cái gáo là <b>chòm Bắc Đẩu</b>, chữ W là <b>chòm Thiên Hậu</b>. Bấm vào một ngôi sao để biết tên!', 8000);
    later(8.5, () => give('stars'));
  }
  const _v = new THREE.Vector3();
  ctx.renderer.domElement.addEventListener('pointerdown', e => {
    if (starOn <= 0) return; let best = null, bd = 34 * 34;
    for (const s of starW) { _v.copy(s.p).project(camera); if (_v.z > 1) continue; const sx = (_v.x + 1) / 2 * innerWidth, sy = (1 - _v.y) / 2 * innerHeight, d = (sx - e.clientX) ** 2 + (sy - e.clientY) ** 2; if (d < bd) { bd = d; best = s; } }
    if (best) { ctx.toast('⭐ ' + best.name, 3500); tone(1319, 0.4, 'sine', 0.08); }
  });

  // ================= ĐỢT 2: hàm hỗ trợ =================
  const hhmm = h => `${Math.floor(h)} giờ ${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
  // Tháp Hà Nội: trò chơi trong khung sổ (bấm cọc nguồn rồi cọc đích)
  function hanoiGame() {
    const pegs = [[3, 2, 1], [], []], COL = ['', '#3d8fd9', '#f2c14e', '#e8453c']; let pick = -1, moves = 0; player.frozen = true;
    const draw = (msg = '') => {
      book.innerHTML = `<div class="card"><h3>🗼 Tháp Hà Nội</h3><p>Chuyển cả 3 đĩa sang <b>cọc phải</b>. Mỗi lần 1 đĩa, <b>không đặt đĩa to lên đĩa nhỏ</b>.</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${pegs.map((pg, i) => `<button data-p="${i}" style="height:144px;display:flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:3px;padding:8px 4px;${pick === i ? 'outline:3px solid #e2763c' : ''}">${pg.map(d => `<i style="display:block;height:21px;width:${d * 29}%;border-radius:8px;background:${COL[d]}"></i>`).join('')}</button>`).join('')}</div>
        <p style="text-align:center;margin:8px 0 0">Số bước: <b>${moves}</b> ${msg}</p><button class="x" id="eggX">Đóng</button></div>`;
      book.hidden = false; book.querySelector('#eggX').onclick = close;
      book.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
        const i = +b.dataset.p;
        if (pick < 0) { if (pegs[i].length) pick = i; return draw(); }
        const from = pegs[pick], d = from[from.length - 1], to = pegs[i];
        if (i !== pick && (!to.length || to[to.length - 1] > d)) { to.push(from.pop()); moves++; tone(330 + d * 110, 0.2, 'triangle', 0.08); }
        else if (i !== pick) { pick = -1; return draw('· ❌ Không được đặt đĩa to lên đĩa nhỏ!'); }
        pick = -1;
        if (pegs[2].length === 3) { draw(moves === 7 ? '· 🏆 Hoàn hảo!' : '· ✅ Xong!'); later(0.6, () => { close(); give('hanoi', moves === 7 ? `Chỉ ${moves} bước — đúng số ít nhất 2³ − 1 = 7!` : `Bạn dùng ${moves} bước. Thử lại xem có làm được trong 7 bước không?`); }); return; }
        draw();
      });
    };
    draw();
  }
  // sao băng: vệt sáng ngang trời trước mặt, có 4 giây để ước
  let meteorT = 34 + Math.random() * 55, wishT = 0;
  function meteor() {
    const fx = -Math.sin(player.cam.yaw), fz = -Math.cos(player.cam.yaw), rx = -fz, rz = fx, d = 160, side = Math.random() < 0.5 ? -1 : 1;
    const x0 = player.pos.x + fx * d - rx * side * 60, z0 = player.pos.z + fz * d - rz * side * 60, y0 = player.pos.y + 55 + Math.random() * 13;
    for (let k = 0; k < 34; k++) later(k * 0.03, () => { const t = k / 34; spawn(x0 + rx * side * 110 * t, y0 - 21 * t, z0 + rz * side * 110 * t, 0, -0.5, 0, 0.9, k > 28 ? '#ffffff' : '#cfe3ff', 2.6 - t, 0, 0, 0); });
    wishT = 4.5; tone(1760, 0.6, 'sine', 0.04, 880);
  }
  // đèn hoa đăng: 21 đèn trôi chậm trên hồ bán nguyệt
  const LAG = [0, 39 + 21];
  function lanterns() {
    for (let k = 0; k < 21; k++) later(k * 0.15, () => { const a = Math.random() * Math.PI, r = 5 + Math.random() * 21; spawn(Math.cos(a) * r, TOWN_Y - 0.35, LAG[1] - 21 + Math.sin(a) * r * 0.8, (Math.random() - 0.5) * 0.3, 0.01, (Math.random() - 0.5) * 0.3, 55, k % 3 ? '#ffb347' : '#ff6a5a', 1.4, 0, 0.05, 2.5); });
    const ph = ctx.sky && ctx.sky.state.moonPhase, lit = ctx.sky && ctx.sky.state.moonLit;
    const name = ph == null ? '' : lit > 0.95 ? 'trăng tròn (rằm) 🌕' : lit < 0.05 ? 'trăng non (mồng một) 🌑' : ph < 0.5 ? `trăng đang lớn dần (${Math.round(lit * 100)}% sáng) 🌔` : `trăng đang khuyết dần (${Math.round(lit * 100)}% sáng) 🌖`;
    ctx.toast(`🏮 Đèn hoa đăng trôi lung linh trên hồ.${name ? '<br>Hôm nay (theo lịch thật) là <b>' + name + '</b>.' : ''}`, 6000);
    later(6.2, () => give('lantern'));
  }

  // ================= CẬP NHẬT =================
  let tipFly = false, stillT = 0, lastP = new THREE.Vector3().copy(player.pos), fireflyT = 0, tick = 0, catT = 0, ready = false, readyT = 0;
  function update(dt, t) {
    for (let i = delay.length - 1; i >= 0; i--) if ((delay[i].t -= dt) <= 0) { const f = delay[i].fn; delay.splice(i, 1); f(); }
    if (!ready && ((ctx.school && ctx.school.ready) || (readyT += dt) > 21)) { ready = true; buildStatics(); }
    const p = player.pos, flying = ctx.aircraft && ctx.aircraft.flying, hour = ctx.sky ? ctx.sky.state.hour : 12, night = ctx.sky ? ctx.sky.state.night : 0;
    const moved = p.distanceTo(lastP); lastP.copy(p); stillT = moved < 0.02 && !player.frozen ? stillT + dt : 0;
    if (starOn > 0) starOn -= dt;

    // khối Rubik: quay, nhặt khi chạm (cả khi đi khinh khí cầu / thuyền)
    for (let i = 0; i < 8; i++) {
      if (S.cubes[i]) continue; setCube(i, t);
      const dx = p.x - CUBES[i][0], dz = p.z - CUBES[i][1], dy = p.y + 0.9 - cubeY[i];
      if (dx * dx + dz * dz < 2.6 * 2.6 && Math.abs(dy) < 3.2) takeCube(i);
      else if ((tick & 31) === i && dx * dx + dz * dz < 900) sparkle(CUBES[i][0], cubeY[i] - 0.3, CUBES[i][1], 2, '#ffe58a', 0.8);
    }
    cubes.instanceMatrix.needsUpdate = true; tick++;

    // đền: đủ 8 khối → đặt vào bệ, xoắn ốc vàng hiện mãi trên đền
    const allCubes = S.cubes.filter(Boolean).length === 8;
    if (allCubes && !S.found.temple && near(altX, altZ, 4.2)) ctx.offer('🌀 Dâng 8 khối Rubik vàng', () => {
      for (let k = 0; k < 8; k++) later(k * 0.15, () => { const a = k * TAU / 8; sparkle(altX + Math.cos(a) * 2, H(altX, altZ) + 0.5, altZ + Math.sin(a) * 2, 13); tone(523 * Math.pow(PHI, k / 4), 0.4, 'triangle', 0.08); });
      later(1.4, () => { give('temple', '<b>Danh hiệu: Nhà Toán Học Nhí</b> 🏅'); try { const inv = JSON.parse(localStorage.getItem('island.inventory') || '{}'); inv.phi = { icon: '🌀', n: 1 }; localStorage.setItem('island.inventory', JSON.stringify(inv)); const el = document.getElementById('inv'); if (el && !el.textContent.includes('🌀')) el.textContent += '  🌀 1'; } catch (e) {} });
    }, 6);
    if (S.found.temple && near(TEMPLE_C[0], TEMPLE_C[1], 89)) spiralTick(dt);

    // đom đóm: hoàng hôn + đứng yên trên Đồi Hoàng Hôn
    const dusk = hour > 17.2 && hour < 19.8;
    if (near(HILL[0], HILL[1], 21)) {
      if (dusk && stillT > 3 && fireflyT <= 0) { fireflyT = 21; for (let k = 0; k < 89; k++) later(k * 0.03, () => spawn(p.x + (Math.random() - 0.5) * 13, p.y + Math.random(), p.z + (Math.random() - 0.5) * 13, (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6, 8 + Math.random() * 8, Math.random() < 0.5 ? '#d8ff6a' : '#ffe88a', 0.3, -0.02, 0.2, 5 + Math.random() * 6)); later(2, () => give('firefly', 'Cả đàn đom đóm bay lên đón hoàng hôn!')); }
      else if (!dusk && stillT > 3 && !S.found.firefly && !tipFly) { tipFly = true; ctx.toast('🌄 Đồi Hoàng Hôn: nghe nói lúc mặt trời lặn ở đây có điều kỳ diệu…', 4000); }
      if (near(...SCOPE, 3)) ctx.offer('🔭 Ngắm sao', () => night > 0.55 ? showStars() : ctx.toast('☀️ Ban ngày ánh Mặt Trời quá sáng nên không thấy sao. Quay lại lúc <b>đêm</b> nhé!', 4500), 3);
    }
    if (fireflyT > 0) fireflyT -= dt;

    // cụ rùa kể chuyện
    if (near(TURTLE[0], TURTLE[1], 5.5)) ctx.offer('🐢 Nghe cụ Rùa kể chuyện', () => {
      const i = S.tale++ % TURTLE_TALES.length; save(); tone(196, 0.5, 'sine', 0.1, 150);
      ctx.toast(`🐢 <b>Cụ Rùa:</b> "Ta đã sống ${100 + FIB[8]} năm rồi đấy… ${TURTLE_TALES[i]}"`, 8000);
      if (!S.found.turtle) later(8.2, () => give('turtle'));
    }, 3);

    // mèo ngủ trên mái: Zzz bay lên; lại gần thì gọi được mèo
    if (cat && near(cat.x, cat.z, 30)) {
      if ((catT -= dt) <= 0) { catT = 1.6; spawn(cat.x, cat.y + 0.6, cat.z, 0.2, 0.5, 0, 2.2, '#cfe3ff', 0.35); }
      if (near(cat.x, cat.z, 13)) ctx.offer('🐱 Gọi "meo meo"', () => {
        tone(700, 0.35, 'sawtooth', 0.05, 1100); tone(1100, 0.45, 'sawtooth', 0.05, 600, 0.33);
        for (let k = 0; k < 8; k++) spawn(cat.x, cat.y + 0.7, cat.z, (Math.random() - 0.5) * 1.2, 1.2 + Math.random(), (Math.random() - 0.5) * 1.2, 1.6, '#ff8fb8', 0.45, 0.4);
        give('cat', 'Mèo Mướp mở một mắt, kêu "meo" rồi… ngủ tiếp!') || ctx.toast('😺 Mèo Mướp vẫn đang ngủ say… Zzz', 2500);
      }, 2);
    }

    // cây đa: khóc hu hu → ông Bụt hiện lên
    if (near(BANYAN[0], BANYAN[1], 8) && !butOn) ctx.offer('😢 Khóc "hu hu" (gọi Bụt)', summonBut, 3);
    if (butOn && (butT += dt) > 60) { butOn = false; but.visible = false; }

    // bia đá chữ Hán
    if (near(STELE[0], STELE[1], 4)) ctx.offer('🪨 Đọc bia đá', () => {
      ctx.toast('🪨 Chữ <b>學</b> đọc là <b>"Học"</b> (chữ Hán). Ông cha ta mượn chữ Hán rồi sáng tạo <b>chữ Nôm</b> để ghi tiếng Việt — Nguyễn Du viết Truyện Kiều bằng chữ Nôm. Nay ta dùng <b>chữ Quốc ngữ</b>.', 9000);
      later(9.2, () => give('stele'));
    }, 3);

    // hạt giống → hoa hướng dương lớn dần (thời gian thật, tưới cây để nhanh hơn)
    const gr = grown(); flower.visible = gr > 0;
    if (gr > 0) { const s = Math.max(0.05, gr); flower.scale.set(s, s, s); flower.rotation.z = Math.sin(t * 0.9) * 0.05; }
    if (near(SEED[0], SEED[1], 4)) {
      if (!S.seed) ctx.offer('🌱 Gieo hạt hướng dương', () => { S.seed = Date.now(); save(); sparkle(SEED[0], TOWN_Y + 0.4, SEED[1], 21, '#9cff7a'); ctx.toast(`🌱 Đã gieo hạt! Cây cần <b>ánh sáng, nước và không khí</b>. Bấm <b>Tưới cây</b> để cây lớn nhanh hơn (nở sau khoảng ${GROW} giây).`, 6000); }, 3);
      else if (gr < 1) ctx.offer(`💧 Tưới cây (${Math.round(gr * 100)}%)`, () => { S.seed -= (S.fast ? 2 : 1) * 21000; save(); for (let k = 0; k < 21; k++) spawn(SEED[0] + (Math.random() - 0.5), TOWN_Y + 2.5, SEED[1] + (Math.random() - 0.5), 0, -1, 0, 1, '#7fc4ff', 0.3, 6); }, 3);
    }
    if (gr >= 1 && !S.found.seed) { give('seed', '🌻 Hạt giống đã thành cây hướng dương cao hơn cả bạn!'); sparkle(SEED[0], TOWN_Y + 3, SEED[1], 34); }

    // vòng mây: lái máy bay xuyên qua
    if (flying) {
      const me = ctx.aircraft.planes.find(q => !q.route && !q.parked);
      if (me) {
        const q = me.group.position;
        RINGS.forEach((r, i) => { if (!S.ring[i] && Math.hypot(q.x - r[0], q.y - r[1], q.z - r[2]) < 9) { S.ring[i] = 1; save(); ringMesh.setColorAt(i, gold); ringMesh.instanceColor.needsUpdate = true; burst(r[0], r[1], r[2], 55, '#ffe58a', 9); chime(); ctx.toast(`☁️ Xuyên vòng mây ${S.ring.filter(Boolean).length}/3!`, 2500); } });
        if (S.ring.filter(Boolean).length === 3 && !S.found.rings) give('rings', '✈️ Mở khoá <b>sơn Vàng φ</b> cho mọi máy bay bạn lái!');
        if (S.found.rings && !me._phi) paint(me);
      }
    }

    // ---- đợt 2 ----
    if (near(SUNDIAL[0], SUNDIAL[1], 3.2)) ctx.offer('☀️ Xem đồng hồ mặt trời', () => {
      if (night > 0.5 || hour < 6 || hour > 18) return ctx.toast('🌙 Đồng hồ mặt trời chỉ chạy khi có nắng: ban đêm không có bóng! Ngày mai quay lại nhé.', 4000);
      ctx.toast(`☀️ Bóng của kim chỉ khoảng <b>${hhmm(hour)}</b>. Mỗi giờ bóng xoay <b>15°</b> vì Trái Đất tự quay 360° trong 24 giờ.`, 6500); later(6.6, () => give('sundial'));
    }, 3);
    if (near(CUCKOO[0], CUCKOO[1], 34)) {
      const noon = hour >= 11.95 && hour < 12.4;
      if (noon && !S.found.cuckoo && !self._cu) {
        self._cu = true; const [x, z] = CUCKOO;
        for (let k = 0; k < 12; k++) later(k * 0.55, () => { tone(659, 0.22, 'sine', 0.12, 0, 0); tone(523, 0.3, 'sine', 0.12, 0, 0.24); spawn(x, TOWN_Y + 3.5, z, (Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2, 1.2, '#ffe14a', 0.5, 1); });
        ctx.toast('🐦 <b>Cúc cu! Cúc cu!</b> Chú chim cu ló ra gáy đủ <b>12 tiếng</b>: 12 giờ trưa!', 6000); later(6.8, () => give('cuckoo'));
      }
      if (near(CUCKOO[0], CUCKOO[1], 3)) ctx.offer('🕛 Xem đồng hồ', () => ctx.toast(`🕛 Bây giờ là <b>${hhmm(hour)}</b>. ${S.found.cuckoo ? 'Chim cu đang ngủ trong tổ.' : 'Nghe nói đúng <b>12 giờ trưa</b> có điều bất ngờ…'}`, 4500), 2);
    }
    if (near(WELL[0], WELL[1], 3)) ctx.offer('🗣️ Gọi "A lô!" xuống giếng', () => {
      for (const [at, v] of [[0, 0.14], [0.2, 0.07], [0.4, 0.035]]) { tone(392, 0.18, 'square', v * 0.6, 0, at); tone(523, 0.22, 'square', v * 0.6, 0, at + 0.16); }
      ctx.toast('🪣 "A lô… lô… lô…" Tiếng vọng về sau <b>0,2 giây</b>.<br>Âm thanh đi 343 m/giây, đi xuống rồi lên: độ sâu ≈ 343 × 0,2 ÷ 2 ≈ <b>34 m</b> (lại là số Fibonacci!)', 8000);
      later(8.2, () => give('well'));
    }, 3);
    if (near(HANOI[0], HANOI[1], 3.4)) ctx.offer('🗼 Chơi Tháp Hà Nội', hanoiGame, 3);
    if (near(BOTTLE[0], BOTTLE[1], 3)) ctx.offer('📜 Mở chai thông điệp', () => {
      const i = (S.letter = (S.letter || 0) + 1) - 1; save(); tone(880, 0.3, 'triangle', 0.08);
      ctx.toast(`📜 ${LETTERS[i % LETTERS.length]}<br><small>(Nhớ: đừng xả rác ra biển nhé — chai này là để học thôi!)</small>`, 8000);
      if (!S.found.bottle) later(8.2, () => give('bottle'));
    }, 3);
    if (near(FOSSIL[0], FOSSIL[1], 3.6)) ctx.offer('🔍 Xem hoá thạch', () => {
      ctx.toast('🐚 Hoá thạch <b>cúc đá (ammonite)</b>: loài sống ở biển, tuyệt chủng cùng khủng long khoảng <b>66 triệu năm</b> trước. Thấy hoá thạch biển trên đồi nghĩa là xưa kia nơi đây từng là <b>đáy biển</b>!', 8500);
      later(8.6, () => give('fossil'));
    }, 3);
    if (night > 0.6 && !flying && (meteorT -= dt) <= 0) { meteorT = 55 + Math.random() * 89; meteor(); }
    if (wishT > 0) { wishT -= dt; ctx.offer('🌠 Ước điều ước!', () => { wishT = 0; sparkle(p.x, p.y + 2, p.z, 34, '#cfe3ff'); give('meteor', 'Điều ước của bạn đã bay lên cùng sao băng ✨') || ctx.toast('🌠 Lại một điều ước nữa!', 2500); }, 8); }
    if (night > 0.5 && Math.hypot(p.x - LAG[0], p.z - LAG[1]) < 30 && (self._lanT = (self._lanT || 0) - dt) <= 0) ctx.offer('🏮 Thả đèn hoa đăng', () => { self._lanT = 21; lanterns(); }, 2);

    updateWhale(dt);
    updateParticles(dt, t);
    if (!wearInit && player.hero) { wearInit = true; dress(); }
    placeWear();
  }

  // mốc có vị trí của bí mật — bản đồ dùng để vẽ địa danh và dấu ✔ chỗ đã tìm
  const spots = () => [
    { id: 'firefly', n: 'Đồi Hoàng Hôn', ic: '🌄', x: HILL[0], z: HILL[1] }, { id: 'stars', n: 'Kính thiên văn', ic: '🔭', x: SCOPE[0], z: SCOPE[1] + 9 },
    { id: 'turtle', n: 'Bãi biển Tây Bắc', ic: '🏖️', x: TURTLE[0], z: TURTLE[1] }, { id: 'but', n: 'Cây đa nghìn năm', ic: '🌳', x: BANYAN[0], z: BANYAN[1] },
    { id: 'stele', n: 'Bia đá chữ Hán', ic: '🪨', x: STELE[0], z: STELE[1] }, { id: 'seed', n: 'Vườn cộng đồng', ic: '🌱', x: SEED[0], z: SEED[1] },
    { id: 'sundial', n: 'Đồng hồ mặt trời', ic: '☀️', x: SUNDIAL[0], z: SUNDIAL[1] - 6 }, { id: 'cuckoo', n: 'Cột đồng hồ', ic: '🕛', x: CUCKOO[0], z: CUCKOO[1] },
    { id: 'well', n: 'Giếng cổ', ic: '🪣', x: WELL[0], z: WELL[1] }, { id: 'hanoi', n: 'Đồi Tháp Hà Nội', ic: '🗼', x: HANOI[0], z: HANOI[1] },
    { id: 'fossil', n: 'Đồi hoá thạch', ic: '🐚', x: FOSSIL[0], z: FOSSIL[1] }, { id: 'bottle', n: 'Bãi biển phía Nam', ic: '🍾', x: BOTTLE[0], z: BOTTLE[1] },
    { id: 'lantern', n: 'Hồ bán nguyệt', ic: '🏮', x: LAG[0], z: LAG[1] - 8 }, { id: 'temple', n: 'Cổng Đền Tri Thức', ic: '🌀', x: TEMPLE_C[0], z: TEMPLE_C[1], hide: true },
    ...(cat ? [{ id: 'cat', n: 'Mèo ngủ trên mái', ic: '🐱', x: cat.x, z: cat.z, hide: true }] : []),
    ...CUBES.map((c, i) => ({ id: 'cube' + i, n: 'Khối Rubik vàng ' + (i + 1), ic: '🟨', x: c[0], z: c[1], hide: true, done: !!S.cubes[i] })),
    ...RINGS.map((r, i) => ({ id: 'ring' + i, n: 'Vòng mây ' + (i + 1), ic: '☁️', x: r[0], z: r[2], hide: true, done: !!S.ring[i] })),
  ].map(q => ({ ...q, done: q.done != null ? q.done : !!S.found[q.id] }));

  const self = {
    update, spots, tiers: TIERS, dress, get found() { return S.found; }, give, cubes: CUBES, fireworks, sunflowerBloom, whale: () => whaleJump(true), showStars, openBook,
    reset: () => { for (const k of Object.keys(S)) delete S[k]; Object.assign(S, { found: {}, cubes: [], ring: [], tale: 0 }); save(); label(); },
    get particles() { return pTop; }, get cat() { return cat; }, paint, grow: () => { S.seed = Date.now() - GROW * 1000; save(); }, summonBut, meteor, lanterns, hanoiGame,
    meshes: () => [cubes, points, ringMesh, statics, stelePlane, flower, whale, but],
  };
  return self;
}
