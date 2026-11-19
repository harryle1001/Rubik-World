// academy/seats.js — NGỒI ĐƯỢC MỌI GHẾ + BÀN GIÁO VIÊN (v4)
//  🪑 Ghế băng 4 bàn dài Đại sảnh (2 bên mỗi bàn, cả chiều dài) + 12 ghế bàn đọc Thư Viện (nội thất tầng 1): lại gần → "Ngồi xuống".
//     Khi ngồi: 📖 Đọc sách (sách hiện trên bàn, 1 điều thú vị) · 🍲 Ăn (đĩa món Việt hiện ra, +năng lượng) · ✍️ Viết bài (câu hỏi → điểm nhà) · 🚶 Đứng dậy.
//  🦉 Thư cú: ngồi một lúc (hoặc sau mỗi việc, ngẫu nhiên) có cú bay qua cửa sổ, thả thư xuống bàn: thư nhà, thư thầy cô (+đồng vàng), lời khen, đố vui.
//  🧑‍🏫 Bàn giáo viên trên bục: 7 thầy cô (điện thoại 5) ngồi hàng dài nhìn xuống sảnh, đội mũ màu; học sinh ngồi bàn dưới (life.js).
import * as THREE from 'three';
import { loadHero, STUDENTS } from '../characters.js';
import { loadModel } from '../models.js';
import { placeKit } from '../kit.js';
import { dressWizard } from './practice.js';
import { CFG } from '../config.js';

const PI = Math.PI;
const BOOKS = [
  ['Sổ tay Thiên Văn', 'Ánh sáng Mặt Trời mất khoảng <b>8 phút</b> mới tới Trái Đất.'], ['Lịch sử nước Việt', '<b>Văn Miếu – Quốc Tử Giám</b> (1076) là trường đại học đầu tiên của nước ta.'],
  ['Bách khoa Sinh vật', 'Bạch tuộc có <b>3 quả tim</b> và máu màu xanh lam.'], ['Toán học vui', 'Tổng các số từ 1 đến 100 là <b>5050</b> — cộng từng cặp đầu–cuối: 1 + 100, 2 + 99…'],
  ['Địa lý quanh ta', 'Sông <b>Mê Kông</b> chảy qua 6 nước rồi đổ ra biển ở miền Tây nước ta bằng nhiều cửa.'], ['Truyện cổ tích', '<b>Cây tre trăm đốt</b>: anh Khoai nhờ câu thần chú “Khắc nhập, khắc xuất”.'],
  ['Khoa học thường ngày', 'Cầu vồng có <b>7 màu</b> vì giọt nước bẻ cong và tách ánh sáng trắng.'], ['Thơ Việt Nam', '“Trẻ em như búp trên cành, biết ăn ngủ, biết học hành là ngoan.” — Bác Hồ'],
];
const FOOD = [['🍜 Phở bò', 'bánh phở (tinh bột) + thịt bò (đạm) + rau thơm'], ['🍚 Cơm gà', 'cơm (tinh bột) + gà (đạm) + dưa leo'], ['🥟 Bánh bao', 'bột mì + nhân thịt, trứng'], ['🍲 Canh chua cá', 'cá (đạm) + cà chua, dứa (vitamin C)'], ['🍌 Chè chuối', 'chuối + nước cốt dừa — ăn vừa phải thôi nhé!']];
const LETTERS = [
  [0, '💌 <b>Thư của mẹ</b>: “Con học ngoan, nhớ ăn đủ bữa và ngủ sớm nhé. Cả nhà nhớ con!”'],
  [3, '📜 <b>Thư thầy Hiệu trưởng</b>: “Thầy khen em chăm chỉ. Tặng em <b>3 🪙</b>!”'],
  [0, '🏠 <b>Thư của Nhà</b>: “Tối nay tập trung ở phòng sinh hoạt chung — có bánh trôi!”'],
  [2, '🦉 <b>Thư đố vui</b>: “Con gì càng to càng nhỏ?” — Đáp án: <b>con cua</b> (càng cua to thì… cua nhỏ đi đâu được!). +2 🪙'],
  [0, '🌟 <b>Lời khen của cô chủ nhiệm</b>: “Bài viết hôm qua của em rất hay, cô đọc cho cả lớp nghe.”'],
  [2, '🎁 <b>Bưu kiện nhỏ</b> từ Phố Phép Thuật: một túi kẹo bạc hà và <b>2 🪙</b>.'],
];

export function createSeats(ctx, magic, { Y, toWorld, toLocal, interior, L }) {
  const H = L.hall, { player } = ctx, TABLES = [-6.5, -2.2, 2.2, 6.5];
  let G = null, teachers = [], seat = null, ui = null, owl = null, owlM = null, prop = null, nextOwl = 0;
  // ---------- dựng: ghế + thầy cô trên bục ----------
  function build() {
    if (G) return; G = new THREE.Group(); G.name = 'academy-seats'; ctx.scene.add(G);
    const n = CFG.isMobile ? 5 : 7, chairs = [];
    for (let i = 0; i < n; i++) {
      const v = (i - (n - 1) / 2) * 1.6, u = H.u0 + 2.25, [x, z] = toWorld(u, v); chairs.push([x, Y + 1.6, z, 1, 0]);
      const kind = STUDENTS[(i * 5 + 2) % STUDENTS.length], col = ['#3a3f6b', '#5a2a3a', '#2f5a4a', '#6b4a2a', '#2a4a6b', '#4a2a5a', '#3a5a3a'][i];
      loadHero(kind, 1.68, { role: 'teacher', old: i % 3 === 0, shirt: col, pants: '#2a2433', glasses: i % 2 === 0 }).then(h => { if (!h || !G) return; h.npc = true; h.model.position.set(x, Y + 1.6, z); h.model.rotation.y = 0; G.add(h.model); h.anim.play(h.set.sit || h.set.idle, 0); dressWizard(h, col); teachers.push(h); });
    }
    placeKit(G, 'furn_chair', chairs, { shadow: false });
  }
  function unbuild() { if (!G) return; stand(); ctx.scene.remove(G); G = null; teachers = []; }

  // ---------- chỗ ngồi gần nhất ----------
  function nearSeat() {
    const p = player.pos;
    if (interior.inside && interior.level === 1) {   // thư viện: 3 ghế × 2 hàng × 2 bàn (furnish.js)
      const w0 = interior.toWorld(0, 0, 1); let best = null;
      for (const z of [9, 15]) for (const s of [-1, 1]) for (const x of [12, 14.5, 17]) { const d = Math.hypot(p.x - (w0[0] + x), p.z - (w0[2] + z + s * 1.6)); if (d < 1.1 && (!best || d < best.d)) best = { d, x: w0[0] + x, z: w0[2] + z + s * 1.6, y: w0[1], yaw: s > 0 ? PI : 0, lib: true, tx: w0[0] + x, tz: w0[2] + z }; }
      return best;
    }
    if (interior.inside || Math.abs(p.y - Y) > 1.5) return null;
    const [u, v] = toLocal(p.x, p.z); if (u < H.u0 + 8 || u > H.u1 - 4 || Math.abs(v) > H.v1) return null;
    for (const tv of TABLES) for (const s of [-1, 1]) { const bv = tv + s * 1.0; if (Math.abs(v - bv) < 0.75) { const [x, z] = toWorld(u, bv), [tx, tz] = toWorld(u, tv); return { x, z, y: Y, yaw: s > 0 ? -PI / 2 : PI / 2, tx, tz }; } }
    return null;
  }
  // ---------- ngồi / đứng ----------
  function sit(s) {
    seat = s; player.teleport(s.x, s.z, s.y + 0.02); player.setRot && player.setRot(s.yaw);
    player.vehicle = { speed: 0, turn: 0, accel: 1, anim: 'sit', seat: 0.02, seatZ: 0, camAdd: 0, chair: true }; player.frozen = true;
    nextOwl = performance.now() / 1000 + 21 + Math.random() * 13; showUI(true); ctx.sfx && ctx.sfx('ui');
    ctx.toast(`🪑 Em đã ngồi xuống${s.lib ? ' bàn đọc Thư Viện' : ' ghế băng Đại sảnh'}. Chọn việc ở thanh bên dưới — biết đâu có <b>cú</b> mang thư tới!`, 4500);
  }
  function stand() { if (!seat) return; seat = null; if (player.vehicle && player.vehicle.chair) player.vehicle = null; player.frozen = false; showUI(false); clearProp(); }
  function clearProp() { if (prop) { prop.removeFromParent(); prop = null; } }
  function putProp(model, s = 1) {   // vật hiện trên bàn trước mặt
    clearProp(); return loadModel(model).then(m => { if (!m || !seat) return; const t = 0.55, x = seat.x + (seat.tx - seat.x) * t, z = seat.z + (seat.tz - seat.z) * t; m.position.set(x, seat.y + (seat.lib ? 1.2 : 0.82), z); m.scale.setScalar(0.01); m.userData.s = s; m.userData.t0 = performance.now(); ctx.scene.add(m); prop = m; });
  }
  function showUI(v) {
    if (!ui) {
      ui = document.createElement('div'); ui.id = 'seatBar';
      ui.innerHTML = `<style>#seatBar{position:fixed;left:50%;bottom:21px;transform:translateX(-50%);z-index:35;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}#seatBar button{font:700 15px system-ui;border:0;border-radius:21px;padding:11px 16px;background:rgba(27,22,38,.88);color:#fff3d0;box-shadow:0 3px 8px rgba(0,0,0,.3)}#seatBar button:active{transform:scale(.95)}</style>
<button data-a="read">📖 Đọc sách</button><button data-a="eat">🍲 Ăn</button><button data-a="write">✍️ Viết bài</button><button data-a="up">🚶 Đứng dậy</button>`;
      document.body.appendChild(ui);
      ui.onclick = e => { const b = e.target.closest('button'); if (b) act(b.dataset.a); };
      addEventListener('keydown', e => { if (seat && (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space')) { e.preventDefault(); stand(); } }, true);
    }
    ui.hidden = !v;
  }
  function act(a) {
    if (!seat) return; const R = () => { if (Math.random() < 0.35) nextOwl = Math.min(nextOwl, performance.now() / 1000 + 4); };
    if (a === 'up') return stand();
    if (a === 'read') { const [t, f] = BOOKS[Math.floor(Math.random() * BOOKS.length)]; putProp('kit/furn_book_set', 0.55); magic.setMana && magic.setMana((magic.mana || 0) + 3); ctx.toast(`📖 Em mở cuốn <b>“${t}”</b>: ${f} (+3 năng lượng phép)`, 7000); R(); }
    if (a === 'eat') { const [t, f] = FOOD[Math.floor(Math.random() * FOOD.length)]; putProp('kit/kk_plate_food_A', 0.85); magic.setMana && magic.setMana((magic.mana || 0) + 8); ctx.toast(`🍲 ${t} nóng hổi hiện ra! Bữa ăn có ${f}. Nhai kỹ, no vừa đủ. (+8 năng lượng)`, 6500); R(); }
    if (a === 'write') { putProp('kit/furn_book_set', 0.45); magic.ask(['toan', 'khoahoc'][Math.floor(Math.random() * 2)], () => { ctx.houses && ctx.houses.addPoints(2, 'Viết bài'); ctx.toast('✍️ Bài viết của em được thầy cô chấm <b>10 điểm</b>! +2 điểm nhà', 4500); R(); }, '✍️ Viết bài: trả lời câu hỏi trong vở'); }
  }
  // ---------- cú đưa thư ----------
  function sendOwl() {
    if (owl || !seat) return;
    const go = m => { const from = new THREE.Vector3(seat.x + 13, seat.y + 11, seat.z + 8), to = new THREE.Vector3(seat.tx, seat.y + 1.6, seat.tz); m.position.copy(from); ctx.scene.add(m); owl = { m, from, to, t0: performance.now() / 1000, dropped: false }; ctx.sfx && ctx.sfx('magic'); };
    if (owlM) return go(owlM);
    loadModel('kit/qn_eagle').then(m => { if (!m) return; m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set('#b08a5a'); } }); m.scale.setScalar(0.55); owlM = m; if (seat) go(m); });
  }
  function owlStep(t) {
    if (!owl) return; const e = t - owl.t0, m = owl.m;
    if (e < 2.6) { const k = e / 2.6, s = k * k * (3 - 2 * k); m.position.lerpVectors(owl.from, owl.to, s); m.position.y += Math.sin(k * PI) * 2; m.lookAt(owl.to.x, m.position.y, owl.to.z); }
    else if (e < 3.6) { m.position.y = owl.to.y + Math.sin(e * 9) * 0.1; if (!owl.dropped) { owl.dropped = true; const [c, txt] = LETTERS[Math.floor(Math.random() * LETTERS.length)]; if (c) ctx.account && ctx.account.addCoins(c); ctx.toast(`🦉 Cú đưa thư thả lá thư xuống bàn! ${txt}`, 8000); } }
    else if (e < 6) { const k = (e - 3.6) / 2.4; m.position.lerpVectors(owl.to, owl.from, k); m.position.y += k * 6; m.lookAt(owl.from.x, m.position.y, owl.from.z); }
    else { m.removeFromParent(); owl = null; }
    m.scale.y = 0.55 * (0.85 + Math.abs(Math.sin(e * 10)) * 0.3);
  }
  // ---------- mỗi khung hình ----------
  function update(dt, t) {
    owlStep(t);
    if (prop) { const k = Math.min(1, (performance.now() - prop.userData.t0) / 400); prop.scale.setScalar(prop.userData.s * k); }
    if (G) { const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z), near = Math.abs(cv) < 21 && cu > H.u0 - 3 && cu < H.u1 + 34 && Math.abs(cam.y - Y) < 30; G.visible = near; if (near) { const hr = ctx.sky && ctx.sky.state ? ctx.sky.state.hour : 10; for (const h of teachers) { h.model.visible = hr >= 6 && hr < 21; h.anim.update(dt); } } }
    if (seat) { if (!player.vehicle || !player.vehicle.chair) { seat = null; showUI(false); clearProp(); return; } if (t > nextOwl) { nextOwl = t + 34 + Math.random() * 21; sendOwl(); } return; }
    if (player.vehicle || ctx.mgActive) return;
    const s = nearSeat(); if (s) ctx.offer('🪑 Ngồi xuống ghế', () => sit(s), 9.5);   // ưu tiên hơn "Nhận đũa phép" khi đứng sát ghế
  }
  return { build, unbuild, update, get seated() { return !!seat; } };
}
