// circuit.js — HỌC VIỆN TRÍ TUỆ: LẮP MẠCH ĐIỆN (khoá 'academy', cửa "Học viện trí tuệ / Lắp ráp điện"), chơi ngay trên bàn thí nghiệm giữa thế giới.
// Mạch vòng trên bàn: pin → dây → chỗ hở ⚡ → bóng đèn/quạt. Mỗi chỗ hở chọn 1 vật: vật DẪN ĐIỆN (đinh sắt, dây đồng…) thì nối được,
// vật CÁCH ĐIỆN (que gỗ, cục tẩy…) thì không. Đủ hết chỗ hở → bật công tắc → đèn sáng / quạt quay. 3 mạch, khó dần.
// Tỷ lệ vàng: bàn 8 × 4,9 m (≈ φ), mạch hình chữ nhật 6 × 3,7 m (tỉ số φ), 3 mạch (Fibonacci).
import * as THREE from 'three';
import { PHI, batch, textSprite, pick } from '../sport/kit.js';
import { askBar } from '../quiz.js';
import { tweens } from '../props.js';

const COND = ['đinh sắt', 'dây đồng', 'thìa nhôm', 'đồng xu', 'giấy bạc', 'chìa khoá'];
const INS = ['que gỗ', 'cục tẩy', 'dây chun', 'thước nhựa', 'viên sỏi', 'cốc thuỷ tinh', 'tờ giấy', 'bút chì gỗ'];
const LEVELS = [{ n: '💡 Mạch 1 bóng đèn', gaps: 2, load: ['bulb'] }, { n: '💡💡 Mạch 2 bóng nối tiếp', gaps: 3, load: ['bulb', 'bulb'] }, { n: '🌀 Mạch quạt + đèn', gaps: 3, load: ['fan', 'bulb'] }];
const W = 6, Hh = W / PHI, TY = 1.0;   // mạch: rộng 6, sâu 3,7 (φ), mặt bàn cao 1 m

export function startCircuit(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx, M = api.mat, tw = tweens();
  { const b = batch(); b.box(8, 0.12, 8 / PHI, 0, TY - 0.12, -2, '#c9a46a'); for (const [x, z] of [[-3.7, -3.9], [3.7, -3.9], [-3.7, -0.1], [3.7, -0.1]]) b.box(0.2, TY - 0.12, 0.2, x, 0, z, '#7a5230');
    b.add(new THREE.CircleGeometry(8, 34).rotateX(-Math.PI / 2), '#d8d2c4', 0, 0.03, -1); root.add(b.mesh()); }
  const sign = textSprite('', { size: 0.9, w: 640, font: 'bold 60px system-ui', bg: 'rgba(27,22,38,.88)', color: '#ffd36e' }); sign.position.set(0, 2.7, -4.4); root.add(sign);
  const lvlG = new THREE.Group(); root.add(lvlG);
  let khoa = null; api.actor('student-male-e', { name: 'Anh Khoa', height: 1.6, look: { role: 'teacher', shirt: '#00897b', pants: '#3b3b4f' } }).then(a => { if (!a) return; khoa = a; a.place(4.6, -2, -Math.PI / 2); a.face(0, -2); a.say('Cùng lắp mạch điện nào!', 2400); });
  me.place(0, 0.9, Math.PI); me.face(0, -2);
  api.cam.x = 0; api.cam.y = TY; api.cam.z = -1.6; api.cam.yaw = 0; api.cam.pitch = 0.62; api.cam.dist = innerWidth < innerHeight ? 14.5 : 9.5;
  const S = { lv: 0, gap: 0, right: 0, wrong: 0, score: 0, over: false, live: true, ask: null, phase: 'build', spin: [] };
  let G = null;
  // dây dọc cạnh hình chữ nhật: 4 cạnh, chỗ hở là ô trống phát sáng trên cạnh trước (gần em)
  function build() {
    for (const o of [...lvlG.children]) { lvlG.remove(o); o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material && !m.material.userData.shared) { m.material.map && m.material.map.dispose(); m.material.dispose(); } }); }
    const L = LEVELS[S.lv], z0 = -2 - Hh / 2, z1 = -2 + Hh / 2, y = TY + 0.05, b = batch();
    const gx = Array.from({ length: L.gaps }, (_, i) => -W / 2 + (i + 1) * W / (L.gaps + 1));
    // cạnh sau + 2 cạnh bên: dây liền; cạnh trước: dây đứt ở chỗ hở (mỗi hở rộng 0,8)
    b.box(W, 0.06, 0.08, 0, y, z0, '#d2453a'); b.box(0.08, 0.06, Hh, -W / 2, y, -2, '#d2453a'); b.box(0.08, 0.06, Hh, W / 2, y, -2, '#2b2b33');
    let x = -W / 2; for (const g of [...gx, W / 2 + 0.4]) { const x1 = g - 0.4; if (x1 > x) b.box(x1 - x, 0.06, 0.08, (x + x1) / 2, y, z1, '#2b2b33'); x = g + 0.4; }
    // pin (bên trái, nằm trên cạnh trái): thân + cực
    b.add(new THREE.CylinderGeometry(0.32, 0.32, 1.3, 14).rotateX(Math.PI / 2), '#2b63d9', -W / 2, y + 0.32, -2); b.add(new THREE.CylinderGeometry(0.33, 0.33, 0.3, 14).rotateX(Math.PI / 2), '#f2c14e', -W / 2, y + 0.32, -2 - 0.6);
    b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8).rotateX(Math.PI / 2), '#cfd3d8', -W / 2, y + 0.32, -2 - 0.8);
    // công tắc (cạnh phải)
    b.box(0.6, 0.12, 0.8, W / 2, y, -2 + 0.6, '#3a3150');
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), M('#cfd3d8')); sw.position.set(W / 2, y + 0.2, -2 + 0.6); sw.rotation.x = -0.5; lvlG.add(sw);
    // tải trên cạnh sau: bóng đèn (đế + bóng kính) hoặc quạt
    const loads = L.load.map((k, i) => { const lx = (i - (L.load.length - 1) / 2) * 2.2;
      b.box(0.5, 0.35, 0.5, lx, y, z0, '#5d6b7d');
      if (k === 'bulb') { const g = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), new THREE.MeshToonMaterial({ color: '#d9dde3', emissive: '#000000' })); g.position.set(lx, y + 0.75, z0); lvlG.add(g); return { k, m: g }; }
      b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), '#5d6b7d', lx, y + 0.75, z0); const f = new THREE.Group(); f.position.set(lx, y + 1.2, z0 + 0.1); for (let j = 0; j < 3; j++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.04).translate(0, 0.35, 0), M('#3fa36b')); bl.rotation.z = j * 2.094; f.add(bl); } lvlG.add(f); return { k, m: f };
    });
    lvlG.add(b.mesh());
    const gaps = gx.map(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.5), new THREE.MeshBasicMaterial({ color: '#ffd36e', transparent: true, opacity: 0.6 })); p.position.set(x, y, z1); lvlG.add(p); return { x, p, item: null }; });
    G = { L, gaps, loads, sw, y, z1 }; S.gap = 0; S.phase = 'build'; sign.userData.set(L.n); hud.title && hud.title('🔌 ' + L.n.replace(/^\S+ /, ''));
    next();
  }
  function next() {
    if (S.over) return;
    if (S.gap >= G.gaps.length) { S.phase = 'switch'; hud.clearBar(); hud.msg('✅ Mạch đã kín! Bấm <b>Bật công tắc</b>', 0); hud.button('🔛 Bật công tắc', power, 'on'); return; }
    const c = pick(COND), i1 = pick(INS); let i2 = pick(INS); while (i2 === i1) i2 = pick(INS);
    const Q = { q: `Chỗ hở ${S.gap + 1}: chọn vật DẪN ĐIỆN`, a: c, choices: [c, i1, i2].sort(() => Math.random() - 0.5) };
    hud.msg(`⚡ ${Q.q}`, 0); G.gaps.forEach((g, k) => g.p.material.opacity = k === S.gap ? 0.95 : 0.35);
    S.ask = askBar(api, Q, (ok, pickTxt) => place(ok, pickTxt));
  }
  async function place(ok, item) {
    const g = G.gaps[S.gap]; me.emote('interact');
    const piece = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.16), new THREE.MeshToonMaterial({ color: ok ? '#cfd3d8' : '#b98a52', transparent: true })); piece.position.set(g.x, G.y + 1.2, G.z1); lvlG.add(piece);
    await tw(0.4, k => { piece.position.y = G.y + 1.2 - k * 1.13; }); if (!S.live) return;
    const lab = textSprite(item, { size: 0.42, w: 320, font: 'bold 52px system-ui' }); lab.position.set(g.x, G.y + 0.55, G.z1 + 0.2); lvlG.add(lab);
    if (ok) { S.right++; S.score += 10; S.gap++; g.p.visible = false; sfx('ok'); hud.msg(`✅ <b>${item}</b> làm bằng kim loại → dẫn điện!`, 1600); setTimeout(() => S.live && next(), 1100); }
    else { S.wrong++; sfx('land'); me.emote('no'); if (khoa) khoa.say('Vật này cách điện!', 1600); hud.msg(`❌ <b>${item}</b> là vật CÁCH ĐIỆN — dòng điện không chạy qua được. Thử lại!`, 2400);
      await tw(0.6, k => { piece.position.y = G.y + 0.07 + k * 0.8; piece.material.opacity = 1 - k; }); lvlG.remove(piece); lvlG.remove(lab); piece.geometry.dispose(); setTimeout(() => S.live && next(), 900); }
  }
  async function power() {
    if (S.phase !== 'switch') return; S.phase = 'on'; hud.clearBar(); sfx('ui'); await tw(0.3, k => { G.sw.rotation.x = -0.5 + k * 0.5; }); if (!S.live) return;
    for (const l of G.loads) if (l.k === 'bulb') { l.m.material = new THREE.MeshBasicMaterial({ color: '#fff3a8' }); } else S.spin.push(l.m);
    sfx('win'); me.emote('cheer'); if (khoa) { khoa.emote('cheer'); khoa.say('Tuyệt vời!', 1600); }
    const tip = ['Dòng điện chỉ chạy khi mạch KÍN: từ cực + của pin, qua dây và đèn, về cực −.', 'Mắc NỐI TIẾP: chỉ 1 đường đi — 1 bóng hỏng thì cả 2 bóng cùng tắt.', 'Quạt có động cơ điện: biến điện năng thành chuyển động (cơ năng).'][S.lv];
    hud.msg(`💡 ${tip}`, 4200); S.score += 20;
    await tw(4.4, () => {}); if (!S.live) return; S.spin = [];
    S.lv++; if (S.lv >= LEVELS.length) return end(); build();
  }
  function end() {
    S.over = true; hud.clearBar(); hud.msg('', 0);
    api.end({ score: S.score, title: S.wrong === 0 ? '⚡ Kỹ sư điện nhí!' : '🔌 Lắp xong 3 mạch!', text: `Chọn đúng ${S.right}/${S.right + S.wrong} lần<br>Kim loại (sắt, đồng, nhôm) dẫn điện; gỗ, nhựa, cao su, thuỷ tinh cách điện. ⚠️ Không bao giờ chạm vào ổ điện trong nhà!` });
  }
  hud.msg('🔌 Chọn vật <b>dẫn điện</b> để nối các chỗ hở ⚡ trên mạch!', 2600); setTimeout(() => S.live && build(), 1500);
  return {
    key(e) { if (S.ask && !S.ask.done && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); else if (S.phase === 'switch' && (e.code === 'Space' || e.code === 'Enter')) power(); },
    update(dt) { tw.update(dt); for (const f of S.spin) f.rotation.z += dt * 13; hud.score(S.score); },
    dispose() { S.live = false; S.over = true; tw.clear(); },
  };
}
