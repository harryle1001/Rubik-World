// academy/forest-secrets.js — KHÁM PHÁ RỪNG PHÉP THUẬT (cắm vào forest.js qua plug):
//  • Cụ Si — cây si cổ thụ biết nói kể cổ tích Việt Nam (dùng lại tree.js với cfg riêng).
//  • 13 bí mật (Fibonacci): nơi chốn (lại gần) hoặc sự kiện (ctx.forestEvent từ hồ/sinh vật/cây). Đốm sáng gợi ý chỗ chưa tìm (≤ 21 m).
//  • Nhiệm vụ "Giỏ nguyên liệu" cho lớp Pha Chế / nhà kính: 5 món; móc nối rỗng ctx.academyIngredients + sự kiện 'academy:ingredient'
//    (lớp Pha Chế làm sau chỉ cần đọc localStorage 'academy.ingredients' hoặc nghe sự kiện).
//  • Bản đồ: nút "🌲 Rừng Phép Thuật" trên bản đồ M → bản đồ khu rừng (hồ, đường mòn, bí mật đã tìm, vị trí em).
import * as THREE from 'three';
import { placeKit } from '../kit.js';
import { matV } from '../sample/palette.js';
import { Batch } from './geo.js';
import { create as createTree } from './tree.js';
import { FOREST, CLIFF, lakeAt, toWorld, toLocal, forestDist } from './plan.js';
import { glowTex, GATE_PATH } from './forest.js';
import { SPOTS } from './forest-lake.js';
import { L as CL } from './castle.js';

const FL = FOREST.lake, PI = Math.PI, KEY = 'academy.forestSecrets', IKEY = 'academy.ingredients';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const Q = (icon, q, choices, explain) => ({ icon, q, choices, a: 0, explain });
const TREE_AT = { u: -6, v: -301 }, FAIRY = [-110, -330], STONES = [50, -452];
const CAVE = lakeAt(CLIFF.th, CLIFF.r - CLIFF.cr - 1.2).map((x, i) => i ? x : x + 3.2);

// ---------- Cụ Si kể cổ tích ----------
const TALES = [
  '<b>Sự tích cây vú sữa</b>: cậu bé ham chơi bỏ nhà đi, khi trở về mẹ đã hoá thành cây. Quả cây chín, bóp nhẹ tuôn ra dòng nước trắng ngọt như sữa mẹ. Cháu ạ, thương mẹ thì hãy nói lời thương ngay hôm nay.',
  '<b>Mai An Tiêm</b> bị đày ra đảo hoang. Thấy chim ăn một thứ quả lạ rồi nhả hạt, chàng nhặt hạt đem gieo — thành giống <b>dưa hấu</b> ruột đỏ. Chăm chỉ và biết quan sát thiên nhiên thì ở đâu cũng sống được.',
  '<b>Sơn Tinh – Thủy Tinh</b> cùng cầu hôn Mỵ Nương. Thua cuộc, Thủy Tinh năm nào cũng dâng nước đánh Sơn Tinh. Người xưa kể vậy để giải thích <b>lũ lụt mùa mưa</b> — và nhắc nhau đắp đê, trồng rừng giữ đất.',
  '<b>Thánh Gióng</b> lên ba chưa biết nói, nghe giặc đến bỗng vươn vai thành tráng sĩ, nhổ cả bụi <b>tre</b> quật giặc. Tre làng ta dẻo dai: thân rỗng mà chắc, gió bão chỉ cong chứ khó gãy.',
  '<b>Cây khế</b>: chim thần ăn khế trả vàng, dặn "may túi ba gang". Người em hiền mang túi nhỏ, đủ dùng cả đời; người anh tham may túi to, nặng quá rơi xuống biển. Biết đủ là giàu, cháu nhớ nhé.',
  '<b>Sự tích trầu cau</b>: tình anh em, vợ chồng hoá thành cây cau, dây trầu và hòn đá vôi. Từ đó người Việt có tục <b>miếng trầu là đầu câu chuyện</b>, mời nhau khi gặp gỡ.',
  '<b>Sự tích Hồ Gươm</b>: Rùa Vàng cho vua Lê Lợi mượn gươm thần đánh giặc Minh. Thắng trận, vua dạo thuyền trên hồ, Rùa nổi lên xin lại gươm. Hồ từ đó tên là <b>Hồ Hoàn Kiếm</b> — "trả gươm".',
  '<b>Tấm Cám</b>: Tấm hiền lành bị hại, hoá thành chim vàng anh, cây xoan đào, quả thị… rồi trở về. Ở hiền thì gặp lành. Ta là <b>cây si</b>, họ hàng với đa và sung: rễ phụ ta buông dài như râu ông cụ đấy!',
];
const TALE_Q = [
  Q('📜', 'Trong truyện Mai An Tiêm, chàng có hạt giống dưa hấu nhờ đâu?', ['Nhặt hạt chim nhả ra', 'Mua ở chợ', 'Tiên cho', 'Mọc từ cát'], 'Thấy chim ăn quả và nhả hạt, An Tiêm <b>quan sát</b> rồi gieo trồng.'),
  Q('📜', 'Truyện Sơn Tinh – Thủy Tinh giải thích hiện tượng tự nhiên nào?', ['Lũ lụt mùa mưa', 'Động đất', 'Nhật thực', 'Cầu vồng'], 'Thủy Tinh dâng nước mỗi năm = <b>lũ lụt</b> mùa mưa ở đồng bằng Bắc Bộ.'),
  Q('📜', 'Thánh Gióng nhổ loại cây nào để đánh giặc?', ['Tre', 'Lúa', 'Chuối', 'Sen'], 'Gióng nhổ <b>bụi tre</b> bên đường quật giặc khi roi sắt gãy.'),
  Q('📜', 'Chim thần trong truyện Cây khế dặn may túi bao nhiêu?', ['Ba gang', 'Mười gang', 'Một sải tay', 'To bằng cái thuyền'], '"Ăn một quả, trả cục vàng, may túi <b>ba gang</b>, mang đi mà đựng."'),
  Q('📜', '"Hoàn Kiếm" trong tên Hồ Hoàn Kiếm nghĩa là gì?', ['Trả gươm', 'Rèn gươm', 'Mài gươm', 'Giấu gươm'], 'Hoàn = trả lại, kiếm = gươm: vua <b>trả gươm</b> cho Rùa Vàng.'),
  Q('🌿', 'Cây si cùng họ với những cây nào?', ['Cây đa, cây sung', 'Cây lúa, cây ngô', 'Cây thông, cây tùng', 'Cây dừa, cây cau'], 'Si, đa, sung cùng <b>họ Dâu tằm</b> (chi Ficus) — đều có nhựa mủ trắng, nhiều loài có rễ phụ.'),
];

// ---------- 13 bí mật ----------
const SECRETS = [
  { id: 'gate', icon: '🗿', name: 'Chữ cổ trên cổng đá', at: [FOREST.gate[0], FOREST.gate[1] - 1], r: 4.2, text: 'Chữ khắc phát sáng: «<b>Ai biết nhìn kỹ sẽ thấy rừng biết nói</b>». Người xưa khắc chữ lên đá vì đá bền hàng nghìn năm.' },
  { id: 'shrine', icon: '⛩️', name: 'Miếu nhỏ giữa hồ', at: [FL.u, FL.v], r: 4, text: 'Trong miếu có viên ngọc vàng và dòng chữ: «<b>Nước lặng soi trăng</b>». Đêm trăng, đứng trên cầu treo mà ngắm mặt hồ nhé…' },
  { id: 'palace', icon: '🏯', name: 'Thuỷ cung dưới đáy hồ', ev: 'palace', hint: 'Lặn xuống đáy hồ', text: 'Em đã lặn tới Thuỷ cung!' },
  { id: 'turtle', icon: '🐢', name: 'Rùa Thần ngoi lên', ev: 'turtle', hint: 'Chờ bên hồ', text: 'Rùa Thần chỉ ngoi lên mỗi 34 giây.' },
  { id: 'cave', icon: '💧', name: 'Hốc đá sau màn thác', at: CAVE, r: 3, text: 'Sau màn nước là hốc đá mát lạnh. 🔬 Nước rơi từ cao xuống va vào đá tung thành <b>bụi nước</b>; nắng chiếu vào bụi nước có thể tạo <b>cầu vồng</b>.' },
  { id: 'boat', icon: '🛶', name: 'Một vòng thuyền quanh hồ', ev: 'boat', hint: 'Lên thuyền ở bến', text: 'Em đã đi thuyền một vòng quanh hồ.' },
  { id: 'fairy', icon: '🍄', name: 'Vòng nấm tiên', at: FAIRY, r: 4, text: 'Vòng nấm tiên có thật ngoài đời! 🔬 Sợi nấm lan dưới đất <b>toả ra đều mọi phía</b>, nấm mọc ở mép ngoài nên thành vòng tròn — có vòng rộng hàng trăm mét.' },
  { id: 'tale', icon: '📖', name: 'Nghe Cụ Si kể chuyện', ev: 'tale', hint: 'Tìm cây si biết nói', text: 'Em đã nghe Cụ Si kể cổ tích.' },
  { id: 'flowers', icon: '🌈', name: 'Hoa cầu vồng', ev: 'flowers', hint: 'Đi qua 13 bông hoa', text: 'Hoa đổi màu vì em! 🔬 Ngoài đời, <b>cẩm tú cầu</b> đổi màu xanh/hồng theo độ chua của đất.' },
  { id: 'moon', icon: '🌕', name: 'Trăng soi đáy hồ', ev: 'moon', hint: 'Đêm, đứng trên cầu treo', text: 'Mặt hồ phẳng lặng như gương: ánh trăng <b>phản xạ</b> trên mặt nước. 🔬 Trăng không tự phát sáng — nó phản chiếu ánh sáng Mặt Trời.' },
  { id: 'hollow', icon: '🌳', name: 'Hốc cây cổ thụ', tree: 0, r: 4.5, text: 'Trong hốc cây có tổ sóc và hạt dẻ cất dành. 🔬 Sóc hay "quên" hạt chôn dưới đất — nhờ vậy rừng mọc thêm cây mới!' },
  { id: 'friend', icon: '💗', name: 'Người bạn phép thuật đầu tiên', ev: 'friend', hint: 'Cho sinh vật ăn 3 lần', text: 'Em đã có bạn thân trong rừng.' },
  { id: 'stones', icon: '🪨', name: 'Vòng đá cổ', at: STONES, r: 5, text: 'Tám tảng đá xếp tròn quanh viên pha lê, mỗi tảng chỉ một hướng: <b>Bắc, Đông Bắc, Đông…</b> 🔬 La bàn chỉ hướng Bắc nhờ <b>từ trường Trái Đất</b>.' },
];
// ---------- nguyên liệu lớp Pha Chế / nhà kính ----------
const INGR = [
  { id: 'glowcap', icon: '🍄', name: 'Nấm Lân Quang', at: FAIRY, r: 4.5 },
  { id: 'lotus', icon: '🪷', name: 'Hạt sen', at: lakeAt(PI, FL.ring - 1), r: 4 },
  { id: 'mist', icon: '💧', name: 'Sương thác', at: CAVE, r: 3.5 },
  { id: 'pollen', icon: '🌸', name: 'Phấn hoa cầu vồng', need: () => (window.__forestFlowers || 0) >= 5, at: lakeAt(0.9, FL.ring), r: 6 },
  { id: 'feather', icon: '🪶', name: 'Lông Chim Lửa', ev: 'friend-firebird' },
];

export function createSecrets(ctx, forest, magic) {
  const { player } = ctx, H = forest.H, found = load(KEY, {}), bag = load(IKEY, {});
  const tree = createTree(ctx, magic, { toWorld, toLocal, L: CL, Y: 0, cfg: { at: TREE_AT, key: 'academy.forestTree', name: 'Cụ Si', stories: TALES, quiz: TALE_Q,
    hello: '🌳 Cây si cổ thụ mở mắt, rễ phụ đung đưa: «Chào cháu! Ta là <b>Cụ Si</b>, giữ kho <b>truyện cổ tích</b> của rừng này. Ngồi xuống đây, ông kể cho nghe!»' } });
  let S = null, gotAll = !!found.__all;
  const count = () => SECRETS.filter(s => found[s.id]).length;
  function discover(id) {
    const sc = SECRETS.find(s => s.id === id); if (!sc || found[id]) return; found[id] = Date.now(); save(KEY, found);
    const n = count(); ctx.sfx && ctx.sfx('ok'); ctx.houses && ctx.houses.addPoints && ctx.houses.addPoints(5, 'bí mật rừng');   // sau ghép: điểm nhà Tứ Linh
    magic.burst && magic.burst(player.pos.clone().setY(player.pos.y + 1.5), new THREE.Vector3(0, 1, 0), '#c9a3ff', 21, 4, 1);
    ctx.toast(`${sc.icon} <b>Bí mật ${n}/13: ${sc.name}</b><br>${sc.text}`, 7000);
    if (n === 13 && !gotAll) { gotAll = found.__all = true; save(KEY, found); magic.setMana && magic.setMana(magic.mana + 89); setTimeout(() => ctx.toast('🌟 Em đã tìm đủ <b>13 bí mật</b> của Rừng Phép Thuật! Khu rừng tặng em <b>+89 năng lượng phép</b>. Em là <b>Nhà thám hiểm rừng</b> thật sự!', 7000), 7500); }
    refreshHints();
  }
  ctx.forestEvent = ev => { if (ev.startsWith('friend-')) { discover('friend'); if (ev === 'friend-firebird') collect('feather'); } else discover(ev); };
  // móc nối rỗng cho lớp Pha Chế / nhà kính (chưa có): đọc kho, nghe sự kiện
  ctx.academyIngredients = { get: () => ({ ...bag }), list: INGR.map(i => ({ id: i.id, icon: i.icon, name: i.name })), use(id) { if (!bag[id]) return false; bag[id]--; save(IKEY, bag); return true; } };
  function collect(id) {
    const it = INGR.find(i => i.id === id); if (!it) return; bag[id] = (bag[id] || 0) + 1; save(IKEY, bag); ctx.sfx && ctx.sfx('ok'); ctx.houses && ctx.houses.addPoints && ctx.houses.addPoints(3, 'nguyên liệu rừng');
    const have = INGR.filter(i => bag[i.id]).length;
    ctx.toast(`🧺 Thu được <b>${it.icon} ${it.name}</b> cho lớp <b>Pha Chế</b> (${have}/${INGR.length} loại).${have === INGR.length ? ' Đủ giỏ nguyên liệu rồi — mang về nhà kính Học viện nhé!' : ''}`, 4500);
    dispatchEvent(new CustomEvent('academy:ingredient', { detail: { id, n: bag[id] } }));
  }

  // ---------- dựng: vòng nấm tiên, vòng đá cổ, hốc đá sau thác, đốm gợi ý ----------
  const W = (u, v) => toWorld(u, v), hintPos = [];
  function build(F) {
    tree.build();
    const g = new THREE.Group(); g.name = 'forest-secrets'; F.group.add(g); S = { g };
    const ring = []; for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, u = FAIRY[0] + Math.cos(a) * 3.4, v = FAIRY[1] + Math.sin(a) * 3.4, [x, z] = W(u, v); ring.push([x, H(u, v) - 0.05, z, 2.6 + (k % 3) * 0.4, a]); }
    placeKit(g, 'mushroom_red', ring, { shadow: false }).then(ims => ims.forEach(im => { const m = im.material.clone(); m.emissive = new THREE.Color('#ff7ad9'); m.emissiveIntensity = 0.5; im.material = m; S && (S.fairy = m); }));
    const b = new Batch(), [su, sv] = STONES, sy = H(su, sv);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, u = su + Math.cos(a) * 5.5, v = sv + Math.sin(a) * 5.5, h = k % 2 ? 2.1 : 3.4; b.add(new THREE.BoxGeometry(1.0, h, 0.6), k % 2 ? '#8d887d' : '#9a958c', v - sv, sy + h / 2 - 0.3, u - su, -a); b.add(new THREE.ConeGeometry(0.16, 0.4, 4), '#c9a3ff', (v - sv) * 0.86, sy + h * 0.7, (u - su) * 0.86, 0, -PI / 2 * Math.cos(a), PI / 2 * Math.sin(a)); }
    b.cyl(0, sy - 0.3, 0, 0.9, 0.7, '#77736d', 8);
    const [cu, cv] = CAVE, cy = H(cu, cv); const cb = new Batch(); cb.box(-0.6, 0.6, cy - 0.5, cy + 3, -2, 2, '#4a4742'); cb.box(-0.8, 0.4, cy + 2.6, cy + 3.4, -2.6, 2.6, '#5f5b54');
    const m1 = new THREE.Mesh(b.build(), matV()); m1.position.set(...(([x, z]) => [x, 0, z])(W(su, sv))); m1.castShadow = true; g.add(m1);
    const m2 = new THREE.Mesh(cb.build(), matV()); m2.position.set(...(([x, z]) => [x, 0, z])(W(cu, cv - 1.5))); g.add(m2);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshBasicMaterial({ color: '#d9c8ff' })); { const [x, z] = W(su, sv); gem.position.set(x, sy + 1.3, z); } g.add(gem); S.gem = gem;
    // đốm sáng gợi ý (1 Points)
    const hp = new Float32Array(SECRETS.length * 3), hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3));
    S.hint = new THREE.Points(hg, new THREE.PointsMaterial({ size: 1.1, map: glowTex, color: '#e6d6ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })); S.hint.frustumCulled = false; S.hp = hp; S.hg = hg; g.add(S.hint);
    refreshHints();
  }
  function secretPos(sc) {
    if (sc.at) { const [x, z] = W(...sc.at); return [x, z]; }
    if (sc.tree !== undefined && forest.giants[sc.tree]) { const [x, , z] = forest.giants[sc.tree]; return [x, z]; }
    return null;
  }
  function refreshHints() {
    if (!S) return; let k = 0;
    for (const sc of SECRETS) { const p = secretPos(sc); if (!p || found[sc.id]) continue; const [u, v] = toLocal(p[0], p[1]); S.hp.set([p[0], H(u, v) + 1.6, p[1]], k * 3); k++; }
    S.hg.setDrawRange(0, k); S.hg.attributes.position.needsUpdate = true;
  }
  function unbuild() { tree.unbuild(); if (!S) return; S.g.parent && S.g.parent.remove(S.g); S = null; }

  let scanT = 0, ingrT = 0;
  function update(dt, t, F, d) {
    tree.update(dt, t);
    if (!S || d > 21) return;
    S.gem.rotation.y += dt * 0.8; S.gem.position.y += Math.sin(t * 2) * 0.004; S.hint.material.opacity = 0.45 + 0.35 * Math.sin(t * 3);
    // nguyên liệu: lại gần chỗ có → nút thu (mỗi loại 1 lần / lần vào rừng)
    if (!player.vehicle) for (const it of INGR) {
      if (!it.at || (S.taken && S.taken[it.id]) || (it.need && !it.need())) continue;
      const [x, z] = W(...it.at); if (Math.hypot(player.pos.x - x, player.pos.z - z) < it.r) ctx.offer(`🧺 Thu ${it.icon} ${it.name} (lớp Pha Chế)`, () => { (S.taken = S.taken || {})[it.id] = 1; collect(it.id); }, 6);
    }
    if ((scanT -= dt) > 0) return; scanT = 0.25;
    const p = player.pos, n = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0;
    for (const sc of SECRETS) { if (found[sc.id] || !sc.r) continue; const q = secretPos(sc); if (q && Math.hypot(p.x - q[0], p.z - q[1]) < sc.r) discover(sc.id); }
    window.__forestFlowers = ctx.forestFlowers || 0;
    if (!found.flowers && (ctx.forestFlowers || 0) >= 13) discover('flowers');
    const [u, v] = toLocal(p.x, p.z);
    if (!found.moon && n > 0.6 && Math.abs(v - FL.v) < SPOTS.rope.w + 0.3 && u - FL.u > SPOTS.rope.r1 && u - FL.u < SPOTS.rope.r0 && p.y > 0.5) discover('moon');
  }

  // ---------- bản đồ khu rừng (nút trên bản đồ M) ----------
  function mapPanel() {
    const wm = document.getElementById('wmap'); if (!wm || wm.querySelector('[data-forest]')) return;
    const bar = wm.querySelector('.bar'), btn = document.createElement('button'); btn.dataset.forest = 1; btn.textContent = '🌲 Rừng Phép Thuật'; bar.appendChild(btn);
    const box = document.createElement('div'); box.className = 'dex'; box.hidden = true; box.style.textAlign = 'center'; wm.appendChild(box);
    const cv = document.createElement('canvas'); cv.width = cv.height = 610;
    btn.onclick = () => { box.hidden = !box.hidden; if (!box.hidden) draw(); };
    function draw() {
      const g = cv.getContext('2d'), R = FOREST.r + 13, s = cv.width / (2 * R), X = v => (v - FOREST.v + R) * s, Y = u => (u - FOREST.u + R) * s;   // x = v (đông →), y = u (nam ↓)
      g.fillStyle = '#16323a'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#4f7a5e'; g.beginPath(); g.arc(X(FOREST.v), Y(FOREST.u), FOREST.r * s, 0, PI * 2); g.fill();
      g.fillStyle = '#6a5f9e'; for (const [x, , z] of forest.giants) { const [u, v] = toLocal(x, z); g.beginPath(); g.arc(X(v), Y(u), 4.5 * s, 0, PI * 2); g.fill(); }
      const [cu, cv2] = lakeAt(CLIFF.th, CLIFF.r); g.fillStyle = '#77736d'; g.beginPath(); g.arc(X(cv2), Y(cu), CLIFF.cr * s, 0, PI * 2); g.fill();
      g.fillStyle = '#3aa0c8'; g.beginPath(); g.arc(X(FL.v), Y(FL.u), FL.r * s, 0, PI * 2); g.fill();
      g.fillStyle = '#b9a27c'; g.beginPath(); g.arc(X(FL.v), Y(FL.u), 5.5 * s, 0, PI * 2); g.fill();
      g.strokeStyle = '#d9c39a'; g.lineWidth = FL.rw * 2 * s; g.beginPath(); g.arc(X(FL.v), Y(FL.u), FL.ring * s, 0, PI * 2); g.stroke();
      g.beginPath(); GATE_PATH.forEach(([u, v], i) => i ? g.lineTo(X(v), Y(u)) : g.moveTo(X(v), Y(u))); g.stroke();
      g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lab = (u, v, t) => { g.fillText(t, X(v), Y(u)); };
      lab(FOREST.gate[0], FOREST.gate[1], '🗿'); lab(TREE_AT.u, TREE_AT.v, '🌳'); lab(...lakeAt(PI, FL.ring + 6), '🛶'); lab(...lakeAt(CLIFF.th, CLIFF.r), '💦');
      for (const sc of SECRETS) { const q = secretPos(sc); if (!q) continue; const [u, v] = toLocal(q[0], q[1]); g.globalAlpha = found[sc.id] ? 1 : 0.85; lab(u, v, found[sc.id] ? sc.icon : '❔'); }
      g.globalAlpha = 1; const [pu, pv] = toLocal(player.pos.x, player.pos.z);
      if (forestDist(pu, pv) < 13) { g.save(); g.translate(X(pv), Y(pu)); g.rotate(-player.cam.yaw + PI); g.fillStyle = '#ff4d4d'; g.beginPath(); g.moveTo(0, -13); g.lineTo(9, 9); g.lineTo(-9, 9); g.fill(); g.restore(); }
      const ev = SECRETS.filter(sc => !sc.r && !sc.tree && sc.tree !== 0);
      box.innerHTML = `<h3>🌲 Rừng Phép Thuật · bí mật ${count()}/13</h3>`; box.appendChild(cv); cv.style.cssText = 'width:100%;max-width:420px;border-radius:13px';
      const list = document.createElement('div'); list.style.cssText = 'text-align:left;font-size:13px;margin-top:6px';
      list.innerHTML = SECRETS.map(sc => `<div>${found[sc.id] ? sc.icon + ' <b>' + sc.name + '</b>' : '❔ ' + (sc.hint || '???')}</div>`).join('') + `<div style="margin-top:6px">🧺 Nguyên liệu Pha Chế: ${INGR.map(i => (bag[i.id] ? i.icon : '▫️')).join(' ')}</div><div style="opacity:.75">Đường tới: lâu đài → cầu có mái phía tây → Tháp Gió → cầu thang xuống rừng.</div>`;
      box.appendChild(list); void ev;
    }
  }
  setTimeout(mapPanel, 1000); addEventListener('keydown', e => { if (e.code === 'KeyM') mapPanel(); });
  document.addEventListener('click', e => { if (e.target && e.target.id === 'bMap') mapPanel(); }, true);

  return { build, unbuild, update, discover, found, get count() { return count(); } };
}
