// visit/index.js — Nhóm 4 mini game 3D "ghé thăm" (chơi ngay tại chỗ, không màn hình riêng): thay mọi cửa/NPC còn "Sắp mở".
//   house-tour  "Tham quan …" (13 kiểu nhà) + "Nhà của …" (8 nhà bạn): tìm 5 khối Rubik vàng quanh nhà, đáp câu kiến trúc/hình học.
//   bbq         Chú Bình · Lửa trại BBQ: nướng 5 món quanh lửa trại, đáp câu an toàn lửa & dinh dưỡng → món chín vàng.
//   mall        Chị Ngọc · Trung tâm thương mại: 5 món có giá, tính tiền & tiền thối.
//   coach       Coach Ru (AI): 5 trạm luyện não (toán, tiếng Anh, khoa học, địa lý).
//   Bác Năm · Nông trại → mở Khu vườn (garden) có sẵn.
// Chung 1 khuôn: 5 vật (Fibonacci) xếp vòng R = 5 quanh tâm, chạm vật → nhân vật đi tới → 1 câu hỏi → đúng +13 điểm. Model CC0 kit (props.js).
import * as THREE from 'three';
import { PHI, pick, textSprite } from '../sport/kit.js';
import { askBar, quiz } from '../quiz.js';
import { prop, tweens } from '../props.js';

const N = 5, R = 5, T = (q, a, w1, w2, why) => () => ({ q, a, choices: [a, w1, w2].sort(() => Math.random() - 0.5), why });
const HOUSE_Q = [
  T('Mái nhà dốc giúp gì?', 'thoát nước mưa', 'giữ nước', 'chắn gió nóng', 'Mái dốc cho nước mưa chảy nhanh, nhà không bị dột.'),
  T('Nhà sàn dựng cao để…?', 'tránh lũ & thú dữ', 'ngắm sao', 'cho đẹp', 'Nhà sàn của đồng bào vùng cao tránh ẩm, lũ và thú dữ.'),
  T('Hình vuông có mấy trục đối xứng?', '4', '2', '1', 'Hình vuông có 4 trục: 2 đường chéo + 2 đường nối trung điểm cạnh.'),
  T('Tỷ lệ vàng φ ≈ ?', '1,618', '3,14', '2,5', 'φ = (1 + √5) / 2 ≈ 1,618 — có trong nhiều công trình đẹp.'),
  T('Nhà kính giữ ấm nhờ…?', 'giữ nhiệt mặt trời', 'quạt gió', 'nước đá', 'Kính cho ánh nắng vào và giữ hơi ấm bên trong.'),
  T('Chu vi hình chữ nhật 3 m × 5 m?', '16 m', '15 m', '8 m', 'Chu vi = (3 + 5) × 2 = 16 m.'),
  T('Diện tích phòng 4 m × 5 m?', '20 m²', '18 m²', '9 m²', 'Diện tích = dài × rộng = 4 × 5 = 20 m².'),
  T('Nhà container làm từ…?', 'thùng hàng thép', 'tre nứa', 'băng đá', 'Thùng container cũ được tái sử dụng làm nhà — tiết kiệm vật liệu.'),
  T('Tường trắng giúp nhà…?', 'mát hơn', 'nóng hơn', 'tối hơn', 'Màu trắng phản xạ ánh nắng nên nhà Địa Trung Hải mát.'),
];
const BBQ_Q = [
  T('Trước khi nướng cần…?', 'rửa tay sạch', 'chạy quanh lửa', 'đổ xăng vào lửa', 'Rửa tay giúp đồ ăn sạch, không đau bụng.'),
  T('Dập lửa trại bằng gì?', 'nước hoặc cát', 'giấy', 'lá khô', 'Nước và cát làm lửa tắt hẳn; giấy, lá khô làm lửa to hơn.'),
  T('Rau củ cho cơ thể nhiều…?', 'vitamin & chất xơ', 'dầu mỡ', 'đường', 'Rau củ giàu vitamin và chất xơ, giúp tiêu hoá tốt.'),
  T('Cá giàu chất gì?', 'đạm', 'muối', 'bột', 'Cá giàu đạm giúp cơ thể lớn khoẻ.'),
  T('Đứng gần lửa nên…?', 'giữ khoảng cách', 'chạm tay vào', 'thổi tung tro', 'Đứng xa lửa ít nhất 1 sải tay để an toàn.'),
  T('Lửa cần khí gì để cháy?', 'ô-xy', 'heli', 'CO₂', 'Lửa cần ô-xy; phủ cát lên làm lửa thiếu ô-xy nên tắt.'),
];
const SHOP = [{ m: 'apple', n: 'táo', p: 5 }, { m: 'carrot', n: 'cà rốt', p: 3 }, { m: 'fish', n: 'cá', p: 13 }, { m: 'furn_lamp', n: 'đèn', p: 21 }, { m: 'music_guitar', n: 'đàn', p: 34 }];   // giá Fibonacci
const shopQ = it => () => { const k = 2 + Math.floor(Math.random() * 3), tot = k * it.p, pay = Math.ceil((tot + 1) / 10) * 10, a = pay - tot;
  const s = new Set([a]); while (s.size < 3) s.add(Math.max(0, a + pick([-3, -2, -1, 1, 2, 5]))); return { q: `Mua ${k} ${it.n} (${it.p} đồng/món), trả ${pay} đồng. Thối lại?`, a: String(a), choices: [...s].map(String).sort(() => Math.random() - 0.5), why: `${k} × ${it.p} = ${tot} đồng; ${pay} − ${tot} = ${a} đồng.` }; };
const STYLE = { 'Biệt thự cổ điển': 'cột tròn & mái vòm kiểu châu Âu', 'Nhà ống phố': 'mặt tiền hẹp, nhà sâu — rất phổ biến ở Việt Nam', 'Nhà gỗ': 'gỗ ấm, mùa đông giữ nhiệt tốt', 'Nhà tròn mái nấm': 'hình tròn chịu gió đều mọi phía',
  'Resort hồ bơi': 'mặt nước làm mát không khí', 'Nhà kiểu Nhật': 'cửa trượt giấy, vườn đá thiền', 'Lâu đài mini': 'tháp tròn & tường dày phòng thủ', 'Nhà sàn': 'dựng trên cột, tránh lũ và ẩm', 'Nhà kính hiện đại': 'kính lớn đón nắng tự nhiên',
  'Nhà Địa Trung Hải': 'tường trắng, mái ngói đỏ, mát mùa hè', 'Nhà mái Thái': 'mái dốc nhiều tầng thoát mưa nhanh', 'Nhà container': 'tái chế thùng hàng thép', 'Villa hiện đại': 'khối hộp vuông vức, mái bằng' };

function game(cfg) {
  return (ctx, { api, door }) => {
    const { root, hud, me } = api, tw = tweens(), S = { score: 0, got: 0, busy: false, over: false, live: true, ask: null, used: [] };
    if (cfg.center) prop(root, cfg.center.m, { size: cfg.center.size, shadow: false });
    const items = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2 + Math.PI / N, g = new THREE.Group(); g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); root.add(g);
      const spec = cfg.item(i), hit = new THREE.Mesh(new THREE.CylinderGeometry(0.89, 0.89, 1.62, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.81; g.add(hit);
      if (spec.m) prop(g, spec.m, { size: spec.size || 0.89, y: spec.y || 0, ry: a, shadow: false });
      else { const c = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), api.mat(spec.color || '#ffd36e')); c.position.y = 1; g.add(c); spec.spin = c; }
      if (spec.label) { const sp = textSprite(spec.label, { size: 0.5 }); sp.position.y = 2.1; g.add(sp); }
      items.push({ g, hit, spec, done: false });
    }
    me.place(0, R * 0.62, Math.PI);
    Object.assign(api.cam, { x: 0, y: 0.8, z: 0, yaw: 0, pitch: 0.55, dist: innerWidth < innerHeight ? 15 : 12 }); api.orbit = true;
    const info = () => { hud.info(`${cfg.icon} ${S.got}/${N}`); hud.score(S.score); };
    async function visit(it) {
      if (S.busy || S.over || it.done) return; S.busy = true;
      const p = it.g.position; await me.walkTo(p.x * 0.7, p.z * 0.7, { speed: 4.2 }); if (!S.live) return; me.face(p.x, p.z);
      let Q, n = 0; do Q = (it.spec.q || pick(cfg.qs))(); while (S.used.includes(Q.q) && ++n < 8); S.used.push(Q.q);
      hud.msg(`${cfg.icon} ${Q.q}`, 0);
      S.ask = askBar(api, Q, async ok => {
        hud.msg(ok ? `✅ ${Q.why || ''}` : `❌ ${Q.why || 'Đáp án: ' + Q.a}`, ok ? 2100 : 3400);
        if (ok) { it.done = true; S.got++; S.score += 13; me.emote('cheer'); api.sfx('ok'); cfg.done && cfg.done(it); await tw(0.5, k => { if (it.spec.spin) it.spec.spin.scale.setScalar(1 - k * 0.99); }); }
        else { me.emote('no'); api.sfx('bad'); await tw(1.2, () => {}); }
        if (!S.live) return; S.busy = false; info(); if (S.got >= N) end();
      });
    }
    function end() { S.over = true; hud.clearBar(); api.end({ score: S.score, title: cfg.endTitle, text: cfg.endText }); }
    hud.msg(cfg.intro(door), 4200); info();
    return {
      tap(e) { const h = api.pick(e, items.filter(i => !i.done).map(i => i.hit)); if (h) visit(items.find(i => i.hit === h.object)); },
      key(e) { if (S.ask && !S.ask.done && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); },
      update(dt, t) { tw.update(dt); for (const it of items) if (it.spec.spin && !it.done) { it.spec.spin.rotation.y = t * PHI; it.spec.spin.position.y = 1 + Math.sin(t * 2 + it.g.position.x) * 0.13; } },
      dispose() { S.live = false; S.over = true; tw.clear(); },
    };
  };
}
const nameOf = door => ((door && door.d && door.d.n) || '').replace(/^(Tham quan|Nói chuyện với) /, '');
const RUBIK = ['#e8453c', '#ffd23f', '#3d8fd9', '#3fa36b', '#ff8c3f'];

export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  G['house-tour'] = { name: '🏠 Tham quan nhà', radius: 8, doors: [/^Tham quan |^Nhà của /], start: game({ icon: '🏠', qs: HOUSE_Q,
    item: i => ({ color: RUBIK[i] }), intro: d => { const n = nameOf(d), s = STYLE[n]; return `🏠 <b>${n}</b>${s ? ' — ' + s : ''}. Chạm 5 khối Rubik quanh nhà, trả lời đúng để nhặt!`; },
    endTitle: '🏠 Kiến trúc sư nhí!', endText: 'Mỗi kiểu nhà hợp với khí hậu & cách sống: mái dốc thoát mưa, nhà sàn tránh lũ, tường trắng chống nóng.' }) };
  G.bbq = { name: '🔥 Lửa trại BBQ', radius: 8, doors: [/Chú Bình · Lửa trại BBQ/], start: game({ icon: '🔥', qs: BBQ_Q, center: { m: 'campfire', size: 1.6 },
    item: i => ({ m: ['fish', 'carrot', 'apple', 'fish', 'carrot'][i], size: 0.7, y: 0.5 }), done: it => it.g.traverse(o => o.isMesh && o.material && o.material.color && (o.material = o.material.clone(), o.material.color.multiplyScalar(0.62))),
    intro: () => '🔥 Chú Bình: “Chạm từng món quanh lửa, trả lời đúng thì món nướng chín vàng!”', endTitle: '🍢 Đầu bếp lửa trại!', endText: 'Nhớ: rửa tay trước khi ăn, đứng xa lửa, dập lửa bằng nước hoặc cát.' }) };
  G.mall = { name: '🛍️ Đi chợ tính tiền', radius: 8, doors: [/Chị Ngọc · Trung tâm thương mại/], start: game({ icon: '🛍️', center: { m: 'furn_table_round', size: 1.6 },
    item: i => ({ m: SHOP[i].m, size: 1.3, label: `${SHOP[i].p} đồng`, q: shopQ(SHOP[i]) }),
    intro: () => '🛍️ Chị Ngọc: “Chạm món hàng, tính đúng tiền thối là mua được!” (giá là số Fibonacci)', endTitle: '🧮 Người mua sắm thông minh!', endText: 'Tiền thối = tiền đưa − tổng tiền. Tính nhẩm trước khi trả để không bị nhầm.' }) };
  G.coach = { name: '🤖 Coach Ru luyện não', radius: 8, doors: [/Coach Ru/], start: game({ icon: '🤖', qs: [() => quiz('math', 2), () => quiz('vocab'), () => quiz('science'), () => quiz('geo')],
    item: i => ({ color: RUBIK[i], label: ['Toán', 'Anh', 'Khoa học', 'Địa lý', 'Tổng hợp'][i], q: [() => quiz('math', 2), () => quiz('vocab'), () => quiz('science'), () => quiz('geo'), () => quiz('mix')][i] }),
    intro: () => '🤖 Coach Ru: “5 trạm luyện não — chạm từng khối để nhận câu hỏi!”', endTitle: '🧠 Bộ não Rubik!', endText: 'Luyện mỗi ngày một chút: não khoẻ như cơ bắp vậy!' }) };
  if (G.garden) G.garden.doors = (G.garden.doors || []).concat(/Bác Năm · Nông trại/);
  return G;
}
