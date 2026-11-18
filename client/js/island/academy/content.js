// academy/content.js — 4 PHÉP CÒN LẠI + CỬA LỚP HỌC (bước e). Mọi hoạt động chơi ngay trong thế giới, không mở màn hình riêng.
//  🔓 Mở khoá (Toán)     — 3 rương khoá: giải đúng phép tính → rương mở, +34 năng lượng.
//  🌱 Mọc lên (Sinh học)  — 5 chậu đất trong nhà kính: trả lời đúng → cây nảy mầm, lớn lên, ra hoa.
//  🌬️ Gọi gió (Địa lý)    — thuyền buồm đồ chơi trên hồ dưới chân vách: hiểu hướng gió → buồm căng, thuyền lướt 21 s.
//  ⭐ Soi sao (Thiên văn) — trên ban công tháp thiên văn ban đêm: bật chế độ ngắm trời + câu hỏi chòm sao.
//  🚪 Cửa lớp: mở mini game 3D sẵn có ngay trong sân lâu đài (khung mg/host.js: ctx.mg.start).
import * as THREE from 'three';
import { mat } from '../sample/palette.js';
import { toon } from '../style.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const pick = a => a[Math.floor(Math.random() * a.length)];
const Q = (q, choices, a, explain) => ({ q, choices, a, explain });

const BIO = [
  Q('Hạt giống cần gì để nảy mầm?', ['Nước, không khí, độ ấm', 'Chỉ cần ánh trăng', 'Muối và đường', 'Không cần gì'], 0, 'Hạt cần <b>nước, không khí và nhiệt độ thích hợp</b> để nảy mầm.'),
  Q('Lá cây làm nhiệm vụ chính là gì?', ['Quang hợp, tạo chất dinh dưỡng', 'Hút nước từ đất', 'Giữ cây đứng vững', 'Làm hoa'], 0, 'Lá dùng ánh sáng Mặt Trời để <b>quang hợp</b>, tạo chất dinh dưỡng cho cây.'),
  Q('Rễ cây có nhiệm vụ gì?', ['Hút nước và muối khoáng', 'Thải khí ô-xi', 'Hút ánh sáng', 'Tạo hạt'], 0, 'Rễ <b>hút nước và muối khoáng</b> trong đất, giữ cây đứng vững.'),
  Q('Khi quang hợp, cây nhả ra khí gì?', ['Ô-xi', 'Các-bô-níc', 'Ni-tơ', 'Hơi muối'], 0, 'Cây hút khí các-bô-níc và nhả ra <b>ô-xi</b> — không khí trong lành nhờ cây xanh.'),
  Q('Hoa thường phát triển thành gì?', ['Quả và hạt', 'Rễ', 'Thân', 'Lá'], 0, 'Sau khi thụ phấn, hoa phát triển thành <b>quả</b> chứa <b>hạt</b>.'),
  Q('Con vật nào giúp hoa thụ phấn?', ['Ong', 'Cá', 'Giun', 'Ốc sên'], 0, '<b>Ong, bướm</b> mang phấn hoa từ bông này sang bông khác.'),
];
const GEO = [
  Q('Kim la bàn luôn chỉ về hướng nào?', ['Bắc', 'Đông', 'Tây', 'Lên trời'], 0, 'Kim nam châm của la bàn chỉ hướng <b>Bắc – Nam</b> nhờ từ trường Trái Đất.'),
  Q('Mặt Trời mọc ở hướng nào?', ['Đông', 'Tây', 'Bắc', 'Nam'], 0, 'Mặt Trời mọc ở hướng <b>Đông</b>, lặn ở hướng <b>Tây</b>.'),
  Q('Mùa đông ở miền Bắc Việt Nam có gió mùa gì?', ['Gió mùa Đông Bắc', 'Gió Tây khô nóng', 'Gió biển', 'Không có gió'], 0, '<b>Gió mùa Đông Bắc</b> thổi từ phương Bắc xuống, mang không khí lạnh.'),
  Q('Gió "Đông Nam" là gió thổi TỪ đâu tới?', ['Từ hướng Đông Nam', 'Tới hướng Đông Nam', 'Từ hướng Tây Bắc', 'Từ trên trời'], 0, 'Tên gió chỉ hướng <b>gió thổi tới từ đó</b>: gió Đông Nam thổi từ Đông Nam sang Tây Bắc.'),
  Q('Vì sao có gió?', ['Không khí di chuyển từ nơi áp cao sang áp thấp', 'Do cây lắc', 'Do biển thổi', 'Do Mặt Trăng kéo'], 0, 'Không khí nóng nhẹ bay lên, không khí lạnh tràn vào chỗ trống → <b>gió</b>.'),
  Q('Hướng ngược với hướng Đông là hướng nào?', ['Tây', 'Bắc', 'Nam', 'Đông Bắc'], 0, 'Đông – <b>Tây</b> đối nhau, Bắc – Nam đối nhau.'),
];
const SKY = [
  Q('Chòm Bắc Đẩu giúp tìm sao nào để biết hướng Bắc?', ['Sao Bắc Cực', 'Sao Hôm', 'Mặt Trăng', 'Sao Hỏa'], 0, 'Nối 2 sao miệng gáo Bắc Đẩu, kéo dài khoảng 5 lần → <b>Sao Bắc Cực</b>.'),
  Q('Chòm Thiên Hậu (Cassiopeia) có hình chữ gì?', ['W', 'O', 'T', 'L'], 0, 'Thiên Hậu hình chữ <b>W</b>, nằm đối diện Bắc Đẩu qua Sao Bắc Cực.'),
  Q('Sao Hôm và Sao Mai thật ra là hành tinh nào?', ['Sao Kim', 'Sao Mộc', 'Sao Thổ', 'Sao Hỏa'], 0, 'Đó đều là <b>Sao Kim</b>: sáng nhất bầu trời sau Mặt Trăng.'),
  Q('Mặt Trời là gì?', ['Một ngôi sao', 'Một hành tinh', 'Một vệ tinh', 'Một sao chổi'], 0, 'Mặt Trời là <b>ngôi sao</b> gần Trái Đất nhất.'),
  Q('Dải sáng mờ vắt ngang trời đêm gọi là gì?', ['Ngân Hà', 'Cầu vồng', 'Mây ti', 'Cực quang'], 0, '<b>Ngân Hà</b> là thiên hà của chúng ta, gồm hàng trăm tỉ ngôi sao.'),
];
const MATH_FACT = ['Số 0 do người Ấn Độ cổ phát minh, giúp viết mọi con số chỉ với 10 chữ số.', 'Dãy Fibonacci 1, 1, 2, 3, 5, 8… xuất hiện trong hoa hướng dương và vỏ ốc.', 'Số π ≈ 3,14 là tỉ số giữa chu vi và đường kính của mọi hình tròn.'];

export function createContent(ctx, magic, { toWorld, L, Y }) {
  const unlocked = load('academy.unlocked', []), grown = load('academy.grown', []);
  magic.addSpell({ id: 'unlock', name: 'Mở khoá', icon: '🔓', subjects: ['toan'], learn: 'mở rương khoá bằng cách giải đúng phép tính.', hint: 'Có 3 rương khoá: đại sảnh, thư viện, chân Tháp Gió.' });
  magic.addSpell({ id: 'grow', name: 'Mọc lên', icon: '🌱', subjects: ['khoahoc'], learn: 'làm cây nảy mầm trong nhà kính (Sinh học).', hint: 'Vào nhà kính ở Sân Thảo Mộc.' });
  magic.addSpell({ id: 'wind', name: 'Gọi gió', icon: '🌬️', subjects: ['khoahoc'], learn: 'gọi gió đẩy buồm (Địa lý: hướng gió).', hint: 'Đứng ở bến dưới chân vách, nhìn ra chiếc thuyền buồm nhỏ trên hồ.' });
  magic.addSpell({ id: 'stars', name: 'Soi sao', icon: '⭐', subjects: ['khoahoc'], learn: 'chỉ chòm sao từ tháp thiên văn (Thiên văn học).', hint: 'Lên ban công tháp thiên văn lúc trời tối.' });

  let built = null;
  function build() {
    const g = new THREE.Group(); g.name = 'academy-content'; ctx.scene.add(g);
    const T = [], up = new THREE.Vector3(0, 1, 0), anims = [];
    const W = (u, v, y = Y) => { const [x, z] = toWorld(u, v); return new THREE.Vector3(x, y, z); };
    // ---------- 🔓 3 rương khoá ----------
    [[L.hall.u0 + 6, 8], [L.library.u0 + 3, (L.library.v0 + L.library.v1) / 2], [L.bridge.u + 1.6, L.bridge.v1 + 2]].forEach(([u, v], i) => {
      const p = W(u, v), ch = new THREE.Group(), lid = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.75).translate(0, 0.07, 0.37), toon('#6e4a30'));
      ch.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7).translate(0, 0.3, 0), toon('#6e4a30')), new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.08, 0.72).translate(0, 0.42, 0), toon('#d4a24a')));
      lid.position.set(0, 0.6, -0.37); ch.add(lid);
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.08), mat('brass')); lock.position.set(0, 0.42, 0.38); ch.add(lock);
      ch.position.copy(p); g.add(ch);
      const open = () => { lid.rotation.x = -1.2; lock.visible = false; };
      if (unlocked.includes(i)) open();
      T.push(magic.addTarget({ spell: 'unlock', pos: p.clone().setY(Y + 0.6), done: () => unlocked.includes(i), onCast(api) {
        api.ask('toan', () => { unlocked.push(i); save('academy.unlocked', unlocked); open(); magic.setMana(magic.mana + 34); api.burst(p.clone().setY(Y + 1), up, '#ffd34d', 34, 3, 1); api.toast(`🔓 Rương mở! +34 năng lượng. 💡 ${MATH_FACT[i]}`, 6000); }, '🔓 Mở khoá — giải đúng phép tính');
      } }));
    });
    // ---------- 🌱 5 chậu trong nhà kính ----------
    const G = L.green, gv = (G.v0 + G.v1) / 2;
    [-17.5, -13.5, -9.5, -5.5, -1.5].map(du => G.u1 + du).forEach((u, i) => {
      const p = W(u, gv), pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.5, 10).translate(0, 0.25, 0), toon('#a5552e')), soil = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 10).translate(0, 0.49, 0), toon('#4a3424'));
      pot.position.copy(p); soil.position.copy(p); g.add(pot, soil);
      const plant = new THREE.Group(); plant.position.copy(p).setY(Y + 0.5);
      plant.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.2, 5).translate(0, 0.6, 0), toon('#357040')));
      for (let k = 0; k < 4; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4).scale(1, 0.35, 0.6), toon('#4f9a4a')); lf.position.set(Math.cos(k * 1.57) * 0.18, 0.4 + k * 0.18, Math.sin(k * 1.57) * 0.18); plant.add(lf); }
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), toon(['#e0503e', '#ee93a8', '#f2c443', '#f6f1e6', '#a78bfa'][i])); fl.position.y = 1.28; plant.add(fl);
      plant.scale.setScalar(grown.includes(i) ? 1 : 0.001); plant.visible = grown.includes(i); g.add(plant);
      T.push(magic.addTarget({ spell: 'grow', pos: p.clone().setY(Y + 0.6), done: () => grown.includes(i), onCast(api) {
        const q = BIO[(i + grown.length) % BIO.length];
        api.ask(q, () => { grown.push(i); save('academy.grown', grown); plant.visible = true; anims.push({ t: 0, f: k => plant.scale.setScalar(Math.max(0.001, k)) }); api.burst(p.clone().setY(Y + 0.8), up, '#7fd36a', 34, 2, 1); api.toast(`🌱 Mọc lên! Cây ${grown.length}/5 nảy mầm và ra hoa.${grown.length === 5 ? ' Nhà kính rực rỡ! +55 năng lượng.' : ''}`, 5000); if (grown.length === 5) magic.setMana(magic.mana + 55); }, '🌱 Mọc lên — cây cần gì để lớn?');
      } }));
    });
    // ---------- 🌬️ thuyền buồm đồ chơi trên hồ ----------
    const bc = { u: 80, v: -22 }, boat = new THREE.Group();
    boat.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 2.4).translate(0, 0.17, 0), toon('#a8744a')), new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 5).translate(0, 1.5, 0), toon('#6e4a30')));
    const sail = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, -0.1, 0, 2.7, -0.1, 0, 0.5, -1.1], 3)), new THREE.MeshToonMaterial({ color: '#f3efe6', side: THREE.DoubleSide }));
    sail.geometry.computeVertexNormals(); boat.add(sail); boat.scale.setScalar(1.6); g.add(boat);
    let sailT = 0, ang = 0;
    const placeBoat = (t, dt) => { if (sailT > 0) { sailT -= dt; ang += dt * 0.42; } const P = W(bc.u + Math.cos(ang) * 10, bc.v + Math.sin(ang) * 10, 0); P.y = (ctx.terrain.waveHeight ? ctx.terrain.waveHeight(P.x, P.z) : 0) - 0.05; boat.position.copy(P); boat.rotation.set(Math.sin(t * 1.3) * 0.05, -ang + Math.PI, sailT > 0 ? -0.12 : 0); sail.scale.x = sailT > 0 ? 1 : 0.2; };
    T.push(magic.addTarget({ spell: 'wind', pos: boat.position, reach: 34, onCast(api) {
      if (sailT > 0) return api.toast('🌬️ Buồm đang căng gió rồi!', 2000);
      api.ask(pick(GEO), () => { sailT = 21; api.toast('🌬️ <b>Gọi gió!</b> Buồm căng phồng, thuyền lướt vòng quanh hồ 21 giây.', 4000); }, '🌬️ Gọi gió — hiểu hướng gió mới gọi được');
    } }));
    // ---------- ⭐ Soi sao trên ban công tháp thiên văn ----------
    const A = L.astro;
    T.push(magic.addTarget({ spell: 'stars', pos: W(A.u, A.v, Y + A.h1 + 1.5), reach: 13, onCast(api) {
      const n = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0;
      if (n < 0.5) { magic.setMana(magic.mana + 13); return api.toast('⭐ Trời còn sáng, sao chưa hiện. Quay lại lúc tối (nút ☀️ → Tối) nhé!', 4000); }
      ctx.skyshow && ctx.skyshow.gaze(true);
      setTimeout(() => api.ask(pick(SKY), () => { magic.setMana(magic.mana + 34); api.toast('⭐ <b>Soi sao!</b> Em đọc được bầu trời như nhà thiên văn. +34 năng lượng. Chạm vào ngôi sao để xem tên.', 6000); }, '⭐ Soi sao — chòm sao nào đây?'), 1600);
    } }));
    // ---------- 🚪 cửa lớp học → mini game 3D ngay trong sân ----------
    const MG = ctx.miniGames || {}, keys = Object.keys(MG);
    const extra = keys.find(k => /arcade|math|olymp/.test(k));
    const rooms = [
      { key: 'rubik', name: 'Lớp Rubik', u: -10, v: -L.box.hv + L.T, n: [0, 1] },
      { key: 'art-music', name: 'Lớp Mỹ thuật & Âm nhạc', u: -30, v: L.box.hv - L.T, n: [0, -1] },
      { key: 'library', name: 'Thư viện Hoàng gia', u: L.box.u1 - L.T, v: -21, n: [-1, 0] },
      { key: extra, name: 'Phòng Trò chơi Trí tuệ', u: L.box.u1 - L.T, v: 21, n: [-1, 0] },
    ].filter(r => r.key && MG[r.key]);
    const label = text => { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d'); k.font = 'bold 40px system-ui'; k.fillStyle = 'rgba(27,22,38,.8)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 49, 460); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); s.scale.set(5.3, 1, 1); return s; };
    for (const r of rooms) {
      const [nu, nv] = r.n, p = W(r.u + nu * 0.15, r.v + nv * 0.15), door = new THREE.Group();
      door.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.2, 0.2).translate(0, 2.1, 0), toon('#4a3424')));
      door.add(new THREE.Mesh(new THREE.ConeGeometry(1.84, 1.3, 4).rotateY(Math.PI / 4).scale(1, 1, 0.11).translate(0, 4.85, 0), toon('#4a3424')));
      for (const [w, h, x, y] of [[0.16, 4.4, -1.38, 2.2], [0.16, 4.4, 1.38, 2.2]]) door.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.26).translate(x, y, 0), mat('lampGlow')));
      const s = label('🚪 ' + r.name); s.position.set(0, 6.6, 0.3); door.add(s);
      door.position.copy(p); door.rotation.y = Math.atan2(nv, nu); g.add(door);
      r.pos = W(r.u + nu * 2, r.v + nv * 2);
    }
    built = {
      g, T,
      update(dt, t) {
        for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt / 2.6; const k = Math.min(1, a.t); a.f(1 - (1 - k) ** 3); if (a.t >= 1) { a.f(1); anims.splice(i, 1); } }
        placeBoat(t, dt);
        const pp = ctx.player.pos;
        if (!ctx.mgActive) for (const r of rooms) if (Math.hypot(pp.x - r.pos.x, pp.z - r.pos.z) < 3.4 && Math.abs(pp.y - Y) < 2) ctx.offer('🚪 Vào lớp: ' + r.name, () => ctx.mg && ctx.mg.start(r.key, { x: r.pos.x, z: r.pos.z, n: r.name }), 8);
      },
    };
    return built;
  }
  function unbuild() { if (!built) return; for (const t of built.T) magic.removeTarget(t); ctx.scene.remove(built.g); built.g.traverse(o => o.geometry && o.geometry.dispose()); built = null; }
  return { build, unbuild, update(dt, t) { built && built.update(dt, t); } };
}
