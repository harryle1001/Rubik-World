// classes/creature.js — LỚP SINH VẬT PHÉP THUẬT (Khoa học / Sinh học lớp 3–6): chuồng có 3 sinh vật (model CC0 KayKit/Quaternius, tô màu phép).
//  1. Cho ăn đúng: Hươu Sương ăn cỏ lá (động vật ăn cỏ) · Cáo Đuôi Lửa ăn chuột đồng (ăn thịt) · Ếch Ngọc ăn côn trùng — kẹo ngọt: KHÔNG cho thú ăn!
//  2. Chăm sóc: ếch thở qua da cần nơi ẩm, hươu cần nước sạch + bóng mát.
//  3. Xếp CHUỖI THỨC ĂN (chạm thẻ theo thứ tự "bị ăn → ăn"): Cỏ → Châu chấu → Ếch → Rắn · Lúa → Chuột → Cáo → Đại bàng.  4. Câu hỏi cuối.
import * as THREE from 'three';
import { room, teacher, ask, finish, cleanup, prop, wait, label } from './common.js';
import { loadAnimated, animator } from '../../models.js';

const BEASTS = [
  { n: 'Hươu Sương', model: 'animal-deer', s: 1.5, idle: 'Eating', tint: '#bfe3ff', food: 'leaf', fact: 'Hươu là <b>động vật ăn cỏ</b>: răng hàm phẳng để nghiền lá, cỏ.' },
  { n: 'Cáo Đuôi Lửa', model: 'animal-fox', s: 0.8, idle: 'Idle', tint: '#ff8a4a', food: 'mouse', fact: 'Cáo là <b>động vật ăn thịt</b> (ăn cả quả mọng): giúp đồng ruộng bớt chuột.' },
  { n: 'Ếch Ngọc', model: 'animal-frog', s: 0.55, idle: 'Frog_Idle', tint: '#5fe0b0', food: 'bug', fact: 'Ếch bắt <b>côn trùng</b> bằng chiếc lưỡi dài dính — bạn tốt của nhà nông.' },
];
const FOOD = { leaf: '🌿 Cỏ & lá', bug: '🦟 Côn trùng', mouse: '🐭 Chuột đồng', candy: '🍬 Kẹo ngọt' };
const CHAINS = [['🌿 Cỏ', '🦗 Châu chấu', '🐸 Ếch', '🐍 Rắn'], ['🌾 Lúa', '🐭 Chuột', '🦊 Cáo', '🦅 Đại bàng']];
const CARE = [
  { q: '🐸 Da Ếch Ngọc đang khô. Ếch cần được ở đâu?', choices: ['Nơi ẩm ướt, gần nước', 'Trên tảng đá nóng', 'Trong hộp kín', 'Ngoài nắng gắt'], a: 0, explain: 'Ếch <b>thở một phần qua da</b>, da phải luôn ẩm mới hô hấp được.' },
  { q: '🦌 Trời nắng nóng, Hươu Sương thở dốc. Em làm gì?', choices: ['Cho nước sạch và đưa vào bóng mát', 'Cho ăn thật nhiều kẹo', 'Bắt chạy cho khoẻ', 'Mặc áo ấm'], a: 0, explain: 'Mọi con vật cần <b>nước, thức ăn, không khí và nơi ở phù hợp</b>.' },
];
const QEND = { q: 'Nếu cỏ trên đồng bị mất hết, điều gì xảy ra?', choices: ['Châu chấu thiếu ăn, rồi ếch và rắn cũng thiếu ăn', 'Chỉ cỏ bị ảnh hưởng', 'Rắn sẽ nhiều lên', 'Không có gì thay đổi'], a: 0, explain: 'Các sinh vật trong <b>chuỗi thức ăn</b> phụ thuộc nhau: mất mắt xích đầu, cả chuỗi bị ảnh hưởng.' };

export function startCreature(ctx, { api }) {
  const { root, hud, me } = api;
  const R = room(api, { floor: '#7d8a5a', rug: '#a8744a', desks: 0 });
  const portrait = innerWidth < innerHeight;
  Object.assign(api.cam, { x: 0, y: 0.4, z: -1, yaw: 0, pitch: 0.82, dist: portrait ? 13 : 10 });
  me.place(0, 3.4, Math.PI); me.face(0, 0);
  teacher(api, 'student-male-c', 'Bác Mộc Lâm', { shirt: '#6e8a3a', pants: '#4a3a2a' },
    ['Chào các cháu! Đây là chuồng sinh vật phép thuật.', 'Mỗi con có món ăn riêng: ăn cỏ, ăn thịt hay ăn côn trùng.', 'Chạm vào một con, rồi chọn thức ăn phù hợp nhé!'], [-4.4, -2.6]);
  // hàng rào + cỏ khô + xô nước (CC0)
  for (let i = 0; i < 6; i++) { const a = Math.PI * (0.62 + i * 0.152); prop(api, 'fence_wood', Math.sin(a) * 5.4, 0.12, Math.cos(a) * 5.4 - 1, 2.6, a + Math.PI / 2); }
  prop(api, 'farm_hay_bale', 3.6, 0.12, -3.2, 2.6, 0.4); prop(api, 'prop_bucket', -2.9, 0.12, -3.6, 1.2, 0);
  // sinh vật
  const B = BEASTS.map((b, i) => ({ ...b, g: new THREE.Group(), fed: false, x: (i - 1) * 2.8, z: -1.6 }));
  for (const b of B) {
    b.g.position.set(b.x, 0.12, b.z); root.add(b.g);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.6, 8).translate(0, 0.8, 0), new THREE.MeshBasicMaterial({ visible: false })); hit.userData.b = b; b.g.add(hit); b.hit = hit;
    loadAnimated(b.model, true).then(g => { if (!g || !root.parent) return; const m = g.scene; m.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m), h = bb.max.y - bb.min.y || 1;
      m.scale.setScalar(b.s / h); m.position.y = -bb.min.y * b.s / h; m.rotation.y = Math.PI * 0.1; b.g.add(m);
      m.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(b.tint), 0.45); } });   // tô màu phép
      b.anim = animator(m, g.animations, n => n.split('|').pop()); b.anim.play(b.anim.has(b.idle) ? b.idle : Object.keys(b.anim.actions)[0], 0); });
    const lb = label(b.n, 2.4); lb.position.y = 2.1; b.g.add(lb);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 21).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd36e' })); ring.visible = false; root.add(ring);
  const heart = label('💖', 0.9); heart.visible = false; root.add(heart); let heartT = 0;
  // thẻ chuỗi thức ăn
  const cards = []; let order = [], seqN = 0, chain = null;
  function showChain(ci) {
    for (const c of cards) root.remove(c); cards.length = 0; chain = CHAINS[ci]; seqN = 0;
    const idx = chain.map((_, i) => i).sort(() => Math.random() - 0.5); order = idx;
    idx.forEach((k, j) => { const s = label(chain[k], portrait ? 2.4 : 2.8, '#fff'); if (portrait) s.position.set((j % 2 - 0.5) * 2.7, 3.3 - (j >> 1) * 0.9, 1.2); else s.position.set((j - 1.5) * 2.6, 2.6, 1.2); s.userData.k = k; root.add(s); cards.push(s); });
  }
  let sel = null, phase = 'feed', score = 0, tries = 0, time = 0, done = false;
  function foodBar() { hud.clearBar(); for (const [k, n] of Object.entries(FOOD)) hud.button(n, () => feed(k), 'sm'); }
  async function feed(k) {
    if (phase !== 'feed') return; if (!sel) return hud.msg('👆 Chạm vào <b>một sinh vật</b> trước đã.', 2000);
    if (k === 'candy') { tries++; api.sfx('ui'); return hud.msg('🍬 Không cho thú ăn kẹo! Đồ ngọt làm hỏng răng và bụng của chúng.', 3400); }
    if (k !== sel.food) { tries++; api.sfx('ui'); me.emote('no'); return hud.msg(`🙅 ${sel.n} không ăn ${FOOD[k].slice(3)}. Thử món khác!`, 2600); }
    sel.fed = true; score += tries ? 5 : 13; tries = 0; hud.score(score); api.sfx('win'); me.emote('cheer'); heart.visible = true; heart.position.set(sel.x, 2.9, sel.z); heartT = 1.6;
    hud.msg(`😋 ${sel.n} ăn ngon lành! ${sel.fact}`, 4200); sel = null; ring.visible = false;
    if (B.every(b => b.fed)) { phase = 'wait'; hud.clearBar(); await wait(4400); if (root.parent) care(); }
  }
  async function care() {
    hud.info('Phần <b>2</b>/4'); R.board('Phần 2 · Chăm sóc', 'Con vật cần gì để sống khoẻ?');
    for (const q of CARE) { if (await ask(api, q)) { score += 13; hud.score(score); } if (!root.parent) return; }
    hud.info('Phần <b>3</b>/4'); R.board('Phần 3 · Chuỗi thức ăn', 'Chạm thẻ: sinh vật BỊ ĂN trước → sinh vật ĂN nó'); phase = 'chain'; tries = 0; showChain(0);
    hud.msg('🔗 Xếp <b>chuỗi thức ăn</b>: chạm các thẻ theo thứ tự, bắt đầu từ <b>cây xanh</b> (tự làm ra thức ăn).', 0);
  }
  async function chainDone(ci) {
    score += Math.max(8, 21 - tries * 3); tries = 0; hud.score(score); api.sfx('win'); me.emote('cheer');
    hud.msg(`🔗 ${chain.join(' → ')}<br>Mũi tên chỉ: <b>“bị ăn bởi”</b>. Cây xanh luôn đứng đầu chuỗi.`, 4400); phase = 'wait'; await wait(4600); if (!root.parent) return;
    if (ci === 0) { phase = 'chain2'; showChain(1); hud.msg('🔗 Thêm một chuỗi ở cánh đồng lúa!', 0); return; }
    for (const c of cards) root.remove(c); hud.info('Phần <b>4</b>/4');
    if (await ask(api, QEND)) { score += 13; hud.score(score); } if (!root.parent) return;
    done = true; finish(ctx, api, { score, max: 120, title: 'Lớp Sinh Vật Phép Thuật', text: 'Em đã chăm sóc sinh vật và hiểu chuỗi thức ăn — mọi loài đều cần nhau!' });
  }
  R.board('Phần 1 · Cho ăn', 'Chạm sinh vật → chọn thức ăn'); hud.info('Phần <b>1</b>/4'); hud.score(0); foodBar();
  return {
    tap(e) {
      if (done) return;
      if (phase === 'feed') { const h = api.pick(e, B.filter(b => !b.fed).map(b => b.hit)); if (!h) return; sel = h.object.userData.b; ring.visible = true; ring.position.set(sel.x, 0.16, sel.z); api.sfx('ui'); hud.msg(`🍽️ ${sel.n} thích ăn gì?`, 0); return; }
      if (phase === 'chain' || phase === 'chain2') {
        const h = api.pick(e, cards); if (!h) return; const s = h.object, k = s.userData.k;
        if (k !== seqN) { tries++; api.sfx('ui'); hud.msg(`💡 ${seqN === 0 ? 'Bắt đầu từ cây xanh!' : `Ai ăn <b>${chain[seqN - 1].slice(3)}</b>?`}`, 2200); return; }
        api.sfx('ok'); s.material.color.set('#9fffa0'); s.material.opacity = 0.6; s.userData.done = true; seqN++;
        if (seqN === chain.length) chainDone(phase === 'chain' ? 0 : 1);
      }
    },
    update(dt, t) {
      if (!done) { time += dt; hud.time(time); }
      B.forEach((b, i) => { if (b.anim) b.anim.update(dt); b.g.position.y = 0.12 + Math.abs(Math.sin(t * 2 + i)) * (b.fed ? 0.15 : 0.04); b.g.rotation.y = Math.sin(t * 0.5 + i * 2) * 0.5; });
      if (heartT > 0) { heartT -= dt; heart.position.y += dt; if (heartT <= 0) heart.visible = false; }
    },
    dispose() { cleanup(); },
  };
}
