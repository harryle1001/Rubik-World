// academy/pho2.js — PHỐ PHÉP THUẬT MỚI (Sân Bắc, nửa đông; file riêng, không sửa alley.js):
// 2 phố song song nối nhau bằng quảng trường ở cuối → đường chữ U dài ≈ 160 m (phố cũ 118 m → tổng gấp đôi).
// 3 dãy nhà phố 2–4 tầng ghép module Kenney Fantasy Town (CC0, models/alley/*.glb — cùng cách ghép như alley.js, ô 3,4 m),
// 8 tiệm mới (thiết kế nguyên bản) có chủ tiệm + câu đố nhỏ, đèn lồng, mặt đường đá cuội ambientCG (CC0), biển tiệm gộp atlas.
import * as THREE from 'three';
import { loadModel } from '../models.js';
import { loadHero, STUDENTS } from '../characters.js';
import { toon } from '../style.js';
import { signBoard } from './guide.js';
import { CFG } from '../config.js';

const S = 3.4, PI = Math.PI;
const STYLE = {
  plaster: { plain: 'wall', door: 'wall-door', win: ['wall-window-glass', 'wall-window-shutters', 'wall-window-round'], side: ['wall', 'wall-side'] },
  wood: { plain: 'wall-wood', door: 'wall-wood-door', win: ['wall-wood-window-glass', 'wall-wood-window-shutters', 'wall-wood-window-round', 'wall-wood-window-small'], side: ['wall-wood', 'wall-wood-detail-cross'] },
};
const TINT = [[1, 1, 1], [1, 0.9, 0.78], [0.9, 0.96, 1], [1, 0.86, 0.9], [0.9, 1, 0.88]], ROOF = [[1, 1, 1], [1.3, 0.85, 0.72], [0.8, 1.05, 1.02], [0.75, 0.75, 0.88]];
// phố: tim đường u (cục bộ), hướng mặt tiền của từng dãy (n = +1: nhà nằm phía +u của phố, mặt tiền nhìn −u)
export const PHO2 = { v0: 9, v1: 80, streets: [-131.2, -150], hw: 2.6, plaza: [80, 95] };
const ROWS = [{ f: -128.6, n: 1 }, { f: -133.8, n: -1 }, { f: -147.4, n: 1 }, { f: -152.6, n: -1 }];   // mép mặt tiền + hướng vào nhà
const Q = (q, choices, explain) => ({ q, choices, a: 0, explain });
// việc của từng tiệm (v4): buy = mua (đồng vàng → năng lượng) · quiz = câu đố riêng · look/music/toy = trải nghiệm + điều khoa học
const JOB = {
  '🍦 Kem Tuyết Phép': { act: '🍦 Mua kem tuyết (2 🪙)', buy: [2, 13, 'Que kem tuyết mát lạnh, toả khói lạnh li ti'] },
  '🎨 Màu Vẽ Biết Bay': { act: '🎨 Pha màu', quiz: Q('Trộn màu vàng với màu xanh lam được màu gì?', ['Xanh lá', 'Tím', 'Cam', 'Nâu'], 'Vàng + xanh lam = <b>xanh lá</b>. Đỏ + xanh lam = tím, đỏ + vàng = cam.') },
  '🔭 Tiệm Kính Thiên Văn': { act: '🔭 Ngắm qua kính', look: ['🌕 Mặt Trăng: những vết lõm là <b>hố va chạm</b> do thiên thạch rơi xuống.', '🪐 Sao Thổ có <b>vành đai</b> làm từ băng đá và bụi.', '🔴 Sao Hỏa đỏ vì đất đá chứa nhiều <b>gỉ sắt</b>.', '⭐ Sao Bắc Cực gần như đứng yên — người xưa dùng để <b>tìm hướng Bắc</b>.'] },
  '🎵 Nhạc Cụ Phép': { act: '🎵 Gảy đàn tranh', music: true },
  '📜 Giấy Cuộn & Bút Lông': { act: '📜 Viết thư pháp', quiz: Q('Từ nào viết ĐÚNG chính tả?', ['Sáng sủa', 'Sán sủa', 'Sáng xủa', 'Xáng sủa'], 'Viết đúng: <b>sáng sủa</b>. Thư pháp Việt viết chữ quốc ngữ bằng bút lông rất đẹp.') },
  '🧸 Đồ Chơi Phép': { act: '🧸 Quay con quay', toy: true },
  '🥮 Bánh Truyền Thống': { act: '🥮 Mua bánh dẻo (3 🪙)', buy: [3, 21, 'Bánh dẻo nhân đậu xanh thơm mùi lá dứa'] },
  '🪴 Vườn Ươm Cây Phép': { act: '🪴 Gieo hạt', quiz: Q('Hạt giống cần gì để nảy mầm?', ['Nước, không khí, độ ấm', 'Chỉ cần muối', 'Chỉ cần bóng tối', 'Không cần gì'], 'Hạt cần <b>nước, không khí và độ ấm</b>. Mầm cây em gieo sẽ lớn dần!') },
};
function pluck(n = 5) {   // 5 nốt ngũ cung (đàn tranh) bằng WebAudio
  try { const A = pluck.a || (pluck.a = new (window.AudioContext || window.webkitAudioContext)()), F = [392, 440, 523.25, 587.33, 659.25];
    for (let i = 0; i < n; i++) { const o = A.createOscillator(), g = A.createGain(), t = A.currentTime + i * 0.28; o.type = 'triangle'; o.frequency.value = F[Math.floor(Math.random() * F.length)]; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g).connect(A.destination); o.start(t); o.stop(t + 1); } } catch (e) {}
}
const SHOPS = [
  { name: '🍦 Kem Tuyết Phép', subj: 'khoahoc', fact: 'Kem tan vì <b>nhiệt</b> làm nước đá chuyển từ thể rắn sang thể lỏng.' },
  { name: '🎨 Màu Vẽ Biết Bay', subj: 'khoahoc', fact: 'Trộn <b>vàng + xanh lam</b> ra xanh lá; <b>đỏ + vàng</b> ra cam.' },
  { name: '🔭 Tiệm Kính Thiên Văn', subj: 'khoahoc', fact: 'Thấu kính lồi <b>hội tụ ánh sáng</b> nên nhìn vật xa to và rõ hơn.' },
  { name: '🎵 Nhạc Cụ Phép', subj: 'toan', fact: 'Dây đàn càng <b>ngắn và căng</b> thì tiếng càng <b>cao</b>.' },
  { name: '📜 Giấy Cuộn & Bút Lông', subj: 'toan', fact: 'Người Việt xưa làm <b>giấy dó</b> từ vỏ cây dó, bền hàng trăm năm.' },
  { name: '🧸 Đồ Chơi Phép', subj: 'toan', fact: 'Con quay đứng vững khi xoay nhanh nhờ <b>quán tính quay</b>.' },
  { name: '🥮 Bánh Truyền Thống', subj: 'toan', fact: 'Bánh chưng vuông tượng trưng cho <b>đất</b>, bánh giầy tròn cho <b>trời</b>.' },
  { name: '🪴 Vườn Ươm Cây Phép', subj: 'khoahoc', fact: 'Cây cần <b>ánh sáng, nước, không khí</b> và chất khoáng để lớn.' },
];

export function createPho2(ctx, magic, { Y, toWorld, toLocal }) {
  let s0 = 233; const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd() * a.length)];
  let built = null;
  const W = (u, v, y = Y) => { const [x, z] = toWorld(u, v); return new THREE.Vector3(x, y, z); };
  function layout() {
    const houses = []; let si = 0;
    for (const R of ROWS) {
      let v = PHO2.v0;
      while (v < PHO2.v1 - 1) {
        const w = rnd() < 0.5 ? 1 : 2, vc = v + w * S / 2, shop = si < SHOPS.length && rnd() < 0.42 ? SHOPS[si++] : null, d = 2;
        houses.push({ R, v: vc, w: shop ? 2 : w, d, fl: shop ? 3 : pick([2, 3, 3, 4]), shop, style: rnd() < 0.5 ? 'plaster' : 'wood', top: rnd() < 0.5 ? 'wood' : 'plaster', tint: pick(TINT), roof: pick(ROOF) });
        v += (shop ? 2 : w) * S + 0.15;
      }
    }
    while (si < SHOPS.length) { const h = houses.find(x => !x.shop && x.w === 2) || houses[houses.length - 1]; h.shop = SHOPS[si++]; h.fl = 3; h.w = 2; }
    return houses;
  }
  function build() {
    if (built) return;
    const g = new THREE.Group(); g.name = 'academy-pho2'; ctx.scene.add(g);
    const inst = new Map(), boxes = [], keepers = [], signs = [], put = (n, m, c) => { if (!inst.has(n)) inst.set(n, []); inst.get(n).push({ m, c }); };
    const T = new THREE.Matrix4(), Rm = new THREE.Matrix4(), Sc = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);
    for (const h of layout()) {
      const n = new THREE.Vector3(0, 0, h.R.n), X = new THREE.Vector3().crossVectors(up, n).normalize(), fx = W(h.R.f, h.v, Y - 0.05);   // thế giới: z = u → n dọc ∓z
      const base = new THREE.Matrix4().makeBasis(X, up, n).setPosition(fx.x, fx.y, fx.z), col = new THREE.Color(...h.tint), rc = new THREE.Color(...h.roof);
      const cell = (i, k, j, a, name, c = col) => put(name, base.clone().multiply(T.makeTranslation((i + 0.5 - h.w / 2) * S, k * S, (j + 0.5) * S)).multiply(Rm.makeRotationY(a)).multiply(Sc.makeScale(S, S, S)), c);
      for (let k = 0; k < h.fl; k++) {
        const st = STYLE[k === 0 ? h.style : h.top], doorAt = h.w > 1 ? Math.floor(rnd() * h.w) : 0;
        for (let i = 0; i < h.w; i++) { cell(i, k, 0, PI / 2, k === 0 && i === doorAt ? st.door : pick(st.win)); cell(i, k, h.d - 1, -PI / 2, st.plain); }
        for (let j = 0; j < h.d; j++) { cell(0, k, j, PI, pick(st.side)); cell(h.w - 1, k, j, 0, pick(st.side)); }
      }
      const rh = S * (0.85 + 0.3 * h.w);
      put('roof-high-gable', base.clone().multiply(T.makeTranslation(0, h.fl * S, h.d * S / 2)).multiply(Rm.makeRotationY(PI / 2)).multiply(Sc.makeScale(h.d * S, rh / 1.15, h.w * S)), rc);
      if (rnd() < 0.6) { const cx = (rnd() < 0.5 ? -1 : 1) * (h.w * S / 2 - 0.9); put('chimney', base.clone().multiply(T.makeTranslation(cx - 0.3 * S, h.fl * S - 0.2, h.d * S * 0.6)).multiply(Sc.makeScale(S, rh * 0.75, S)), col); }
      const cs = [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]].map(([a, b]) => fx.clone().addScaledVector(X, a * h.w * S).addScaledVector(n, b * h.d * S));
      boxes.push({ x0: Math.min(...cs.map(p => p.x)) + 0.25, x1: Math.max(...cs.map(p => p.x)) - 0.25, z0: Math.min(...cs.map(p => p.z)) + 0.25, z1: Math.max(...cs.map(p => p.z)) - 0.25, top: Y + h.fl * S + rh });
      if (h.shop) {   // biển tiệm treo trên cửa (mặt quay ra phố) + chủ tiệm
        const fp = fx.clone().addScaledVector(n, -0.35); signs.push({ x: fp.x, y: Y + S * 0.78, z: fp.z, ry: Math.atan2(-n.x, -n.z), t: h.shop.name + '\n✨ chạm để vào tiệm', post: false });
        const kp = fx.clone().addScaledVector(n, -1.3).addScaledVector(X, 1.3); keepers.push({ sh: h.shop, p: kp, face: Math.atan2(-n.x, -n.z), hero: null, line: 0 });
      }
    }
    // đèn lồng 2 bên phố (13 m/cột)
    for (const su of PHO2.streets) for (let v = PHO2.v0 + 4, k = 0; v < PHO2.v1; v += 13, k++) { const p = W(su + (k % 2 ? 1 : -1) * (PHO2.hw - 0.4), v); put('lantern', new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(2.1, 2.1, 2.1)), new THREE.Color(1, 1, 1)); }
    // quảng trường cuối phố: đài phun nước + sạp hàng
    put('fountain-round-detail', new THREE.Matrix4().compose(W(-141, 88.5), new THREE.Quaternion(), new THREE.Vector3(1.8, 1.8, 1.8)), new THREE.Color(1, 1, 1));
    for (const [u, nm] of [[-128.5, 'stall-red'], [-153.5, 'stall-green']]) put(nm, new THREE.Matrix4().compose(W(u, 90), new THREE.Quaternion().setFromAxisAngle(up, u > -141 ? PI : 0), new THREE.Vector3(2.4, 2.4, 2.4)), new THREE.Color(1, 1, 1));
    // mặt đường đá cuội: 2 phố + quảng trường (1 lưới)
    {
      const tex = new THREE.TextureLoader().load('/assets/tex/cobble.jpg'); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
      const pos = [], uv = [], idx = [], quad = (u0, u1, v0, v1) => { const b = pos.length / 3; for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) { const p = W(u, v, Y + 0.05); pos.push(p.x, p.y, p.z); uv.push(v / 2.6, u / 2.6); } idx.push(b, b + 2, b + 1, b, b + 3, b + 2); };
      for (const su of PHO2.streets) quad(su - PHO2.hw, su + PHO2.hw, PHO2.v0 - 3, PHO2.v1); quad(-158, -124, PHO2.plaza[0], PHO2.plaza[1]);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, toon('#d8d0c4', { map: tex, unique: true })); m.receiveShadow = true; g.add(m);
    }
    signs.push({ ...(() => { const p = W(-124, 7.4); return { x: p.x, y: Y, z: p.z }; })(), ry: 0, t: '✨ PHỐ PHÉP THUẬT MỚI ✨\n8 tiệm · quảng trường đài phun nước' });
    g.add(signBoard(signs));
    // module → InstancedMesh
    for (const [name, list] of inst) loadModel('alley/' + name).then(src => {
      if (!src || !built || built.g !== g) return; src.updateMatrixWorld(true);
      src.traverse(o => { if (!o.isMesh) return; const im = new THREE.InstancedMesh(o.geometry, o.material, list.length); list.forEach((it, i) => { im.setMatrixAt(i, it.m.clone().multiply(o.matrixWorld)); im.setColorAt(i, it.c); }); im.castShadow = /^(wall|roof)/.test(name); im.receiveShadow = true; im.computeBoundingSphere(); g.add(im); });
    });
    const nk = CFG.isMobile ? 4 : keepers.length;
    keepers.slice(0, nk).forEach((k, i) => loadHero(STUDENTS[(i * 5 + 3) % STUDENTS.length], 1.62, { role: 'shop', shirt: ['#7a3b2e', '#2e5a4a', '#3d4f7a', '#8a6a2e'][i % 4], pants: '#2a2a30' }).then(h => { if (!h || !built || built.g !== g) return; h.npc = true; h.model.position.copy(k.p); h.model.rotation.y = k.face; g.add(h.model); h.anim.play(h.set.idle, 0); k.hero = h; }));
    ctx.boxes.push(...boxes);
    built = { g, boxes, keepers };
  }
  function unbuild() { if (!built) return; ctx.scene.remove(built.g); built.g.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); for (const b of built.boxes) { const i = ctx.boxes.indexOf(b); if (i >= 0) ctx.boxes.splice(i, 1); } built = null; }
  let cool = 0, top = null, topT = 0;
  function doJob(k) {
    const J = JOB[k.sh.name] || {}; cool = 1.2; ctx.sfx && ctx.sfx('ui'); k.work = 3;
    if (J.buy) { const [price, mana, what] = J.buy; if (!ctx.account || !ctx.account.addCoins(-price)) return ctx.toast('🪙 Chưa đủ đồng vàng — làm nhiệm vụ, trả lời câu đố để có thêm đồng vàng nhé!', 3500); magic.setMana && magic.setMana((magic.mana || 0) + mana); ctx.sfx && ctx.sfx('coin'); return ctx.toast(`${k.sh.name}: “${what}, của cháu đây!” +${mana} năng lượng phép. 🔬 ${k.sh.fact}`, 6500); }
    if (J.quiz) return magic.ask(J.quiz, () => { ctx.account && ctx.account.addCoins(2); ctx.toast(`🎁 ${k.sh.name}: “Giỏi lắm!” +2 🪙`, 3500); }, J.act);
    if (J.look) { ctx.toast(`🔭 Em ghé mắt vào kính… ${J.look[k.line++ % J.look.length]}`, 6500); return; }
    if (J.music) { pluck(6); return ctx.toast(`🎵 Tiếng đàn tranh ngân nga 5 nốt <b>ngũ cung</b> (Sol · La · Đô · Rê · Mi) — thang âm của nhạc dân tộc Việt. 🔬 ${k.sh.fact}`, 6500); }
    if (J.toy) { if (!top) { top = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 8).rotateX(Math.PI), new THREE.MeshToonMaterial({ color: '#e0484a' })); built.g.add(top); } top.position.copy(k.p).addScaledVector(new THREE.Vector3(Math.sin(k.face), 0, Math.cos(k.face)), 1.2); top.position.y = Y + 0.2; topT = 6; return ctx.toast(`🧸 Con quay đỏ xoay tít trên mặt đường đá! 🔬 ${k.sh.fact}`, 5500); }
    ctx.toast(`${k.sh.name}: “Chào cháu! 🔬 ${k.sh.fact}”`, 5000);
  }
  function update(dt) {
    if (!built) return; const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z), vis = Math.hypot(cu + 141, cv - 50) < 110 && cam.y < 600 && (cu < -108 || cam.y > Y + 21); built.g.visible = vis; if (!vis) return;   // khuất sau lâu đài → không vẽ
    cool -= dt; const p = ctx.player.pos, t = performance.now() / 1000;
    if (top) { topT -= dt; top.visible = topT > 0; top.rotation.y += dt * 21; top.rotation.z = Math.sin(t * 3) * 0.08 * Math.max(0, 3 - topT); }
    for (const k of built.keepers) {
      const d = Math.hypot(p.x - k.p.x, p.z - k.p.z);
      if (k.hero && cam.distanceTo(k.p) < 34) {   // chủ tiệm làm việc: lau quầy / xếp hàng; khách lại gần thì quay sang chào
        k.work = (k.work || 0) - dt; const busy = Math.floor(t / 4 + k.line) % 2, clip = d < 4 ? 'interact' : busy ? 'use' : 'idle';
        if (k.clip !== clip) { k.clip = clip; k.hero.anim.play(k.hero.set[clip] || k.hero.set.idle, 0.3); }
        k.hero.model.rotation.y = d < 5 ? Math.atan2(p.x - k.p.x, p.z - k.p.z) : k.face; k.hero.anim.update(dt);
      }
      if (d < 2.8 && Math.abs(p.y - Y) < 2 && cool <= 0) ctx.offer((JOB[k.sh.name] || {}).act || `🛍️ Vào ${k.sh.name}`, () => doJob(k), 8);
    }
  }
  return { build, unbuild, update };
}
