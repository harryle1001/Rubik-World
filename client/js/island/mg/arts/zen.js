// zen.js — VƯỜN THIỀN (khoá 'zen', cửa "Vườn thiền / Ngồi thiền"): ngồi trên bồ đoàn giữa vườn cát cào, tập thở theo quả cầu sáng.
// Nhịp 4-2-4: HÍT VÀO 4 s (cầu phồng) → GIỮ 2 s → THỞ RA 4 s (cầu xẹp). Giữ ngón tay / phím Space khi hít, thả ra khi thở ra.
// Mỗi hơi thở khớp nhịp ≥ 61,8 % (1/φ) → 1 bông sen nở trên hồ. 6 hơi thở ≈ 1 phút. Kèm mẹo giữ bình tĩnh cho học sinh.
import * as THREE from 'three';
import { PHI, batch } from '../sport/kit.js';
import { prop } from '../props.js';

const IN = 4, HOLD = 2, OUT = 4, CYC = IN + HOLD + OUT, N = 6;
const TIPS = ['Thở chậm và sâu giúp tim đập chậm lại, người thấy nhẹ nhõm hơn.', 'Khi tức giận, hãy dừng lại, hít sâu và đếm chậm đến 10.', 'Hít vào bằng mũi, bụng phình ra như quả bóng; thở ra chậm bằng miệng.', 'Trước giờ kiểm tra, 3 hơi thở sâu giúp đầu óc tỉnh táo.', 'Ngồi thẳng lưng, vai thả lỏng, mắt nhìn xuống nhẹ nhàng.', 'Ngủ đủ giấc và thở đều giúp em học tốt hơn mỗi ngày.'];

export function startZen(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx;
  // vườn cát cào (vòng đồng tâm) + bồ đoàn + hồ sen + lối đá (1 khối gộp)
  { const b = batch(); b.add(new THREE.CircleGeometry(8, 34).rotateX(-Math.PI / 2), '#e9dfc8', 0, 0.03, 0);
    for (let r = 1.6; r < 7.8; r += 0.62) b.add(new THREE.RingGeometry(r, r + 0.07, 34).rotateX(-Math.PI / 2), '#d6c9ad', 0, 0.04, 0);
    b.add(new THREE.CylinderGeometry(0.62, 0.7, 0.22, 16), '#7a2e3a', 0, 0, 0);
    b.add(new THREE.CircleGeometry(2.4, 24).rotateX(-Math.PI / 2), '#3f8fb0', 0, 0.05, -4.4); b.add(new THREE.RingGeometry(2.4, 2.7, 24).rotateX(-Math.PI / 2), '#9b9486', 0, 0.06, -4.4);
    for (let i = 0; i < 8; i++) b.add(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 8), '#b8b0a0', Math.sin(i * 0.5) * 0.6, 0.04, 1.6 + i * 0.9);
    root.add(b.mesh()); }
  prop(root, 'rock_large', { size: 2.2, x: -4.6, z: -1.2, ry: 0.6 }); prop(root, 'rock_wide', { size: 2.6, x: 4.4, z: -2.2, ry: 2 });
  // quả cầu thở + vầng sáng
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 3), new THREE.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.85 })); orb.position.set(0, 1.9, -2.2); root.add(orb);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, side: THREE.DoubleSide })); halo.position.copy(orb.position); root.add(halo);
  // sen nở (InstancedMesh: cánh hoa hình nón dẹt)
  const lotus = new THREE.InstancedMesh(new THREE.ConeGeometry(0.42, 0.34, 8, 1, true).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: '#ff9ec4', side: THREE.DoubleSide }), N); lotus.count = 0; root.add(lotus);
  const LP = Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2 + 0.3; return [Math.cos(a) * 1.5, -4.4 + Math.sin(a) * 1.2]; }), bloom = [];
  me.place(0, 0, Math.PI); me.yaw = Math.PI; me.sit('floor'); me.pos.y = 0.2;
  api.cam.x = 0; api.cam.y = 1.2; api.cam.z = -1.4; api.cam.yaw = 0.5; api.cam.pitch = 0.45; api.cam.dist = innerWidth < innerHeight ? 8.5 : 7.5;
  const S = { t: -3, n: 0, hold: false, good: 0, match: 0, tot: 0, sum: 0, over: false, live: true, phase: '' };
  hud.msg('🧘 Ngồi thẳng lưng. <b>Giữ</b> màn hình (hoặc Space) khi quả cầu phồng — <b>thả</b> khi quả cầu xẹp.', 3400);
  const btn = hud.button('🫁 Giữ để hít vào', () => {}, 'on'); btn.style.minWidth = '233px';
  const set = v => { S.hold = v; btn.classList.toggle('on', !v); btn.textContent = v ? '😮‍💨 Thả ra để thở ra' : '🫁 Giữ để hít vào'; };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); set(true); }); btn.addEventListener('pointerup', () => set(false)); btn.addEventListener('pointerleave', () => S.hold && set(false));
  api.on(window, 'keyup', e => { if (e.code === 'Space') set(false); });
  function breathDone() {
    const m = S.sum / Math.max(S.tot, 1e-3); S.match += m; S.n++; S.sum = S.tot = 0;
    if (m >= 1 / PHI) { S.good++; bloom.push(0); lotus.count = bloom.length; sfx('ok'); hud.msg(`🌸 Hơi thở ${S.n}: khớp ${Math.round(m * 100)}% — sen nở! ${TIPS[(S.n - 1) % TIPS.length]}`, CYC * 1000 - 800); }
    else { sfx('ui'); hud.msg(`🍃 Hơi thở ${S.n}: khớp ${Math.round(m * 100)}% — chậm lại, nhìn quả cầu nhé. ${TIPS[(S.n - 1) % TIPS.length]}`, CYC * 1000 - 800); }
    if (S.n >= N) end();
  }
  function end() {
    S.over = true; hud.clearBar(); me.sit(false); const sc = Math.round(S.match / N * 100);
    api.end({ score: sc, title: S.good >= 5 ? '🪷 Tâm an như hồ sen' : '🧘 Hoàn thành buổi thiền', text: `${S.good}/${N} hơi thở khớp nhịp · điểm thở đều ${sc}/100<br>Mỗi ngày dành 1 phút thở chậm 4-2-4 giúp em bình tĩnh, tập trung học tốt hơn.` });
  }
  const _o = new THREE.Object3D();
  return {
    down() { if (S.over) return false; set(true); return true; },
    up() { set(false); },
    key(e) { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); set(true); } },
    update(dt, t) {
      // sen nở dần
      bloom.forEach((b, i) => { bloom[i] = Math.min(1, b + dt / 1.6); _o.position.set(LP[i][0], 0.12, LP[i][1]); _o.scale.set(bloom[i], bloom[i] * 0.9, bloom[i]); _o.rotation.y = i; _o.updateMatrix(); lotus.setMatrixAt(i, _o.matrix); }); lotus.instanceMatrix.needsUpdate = true;
      api.cam.yaw = 0.5 + Math.sin(t * 0.07) * 0.25;
      if (S.over) return;
      S.t += dt; if (S.t < 0) { orb.scale.setScalar(1); return; }
      const c = S.t % CYC, ph = c < IN ? 'in' : c < IN + HOLD ? 'hold' : 'out';
      const k = ph === 'in' ? c / IN : ph === 'hold' ? 1 : 1 - (c - IN - HOLD) / OUT, e = k * k * (3 - 2 * k);
      orb.scale.setScalar(1 + e * PHI); halo.scale.setScalar(1 + e * PHI * 1.2 + Math.sin(t * 2) * 0.03); halo.material.opacity = 0.25 + e * 0.35;
      if (ph !== S.phase) { S.phase = ph; hud.info(ph === 'in' ? '🫁 Hít vào…' : ph === 'hold' ? '⏸ Giữ hơi…' : '😮‍💨 Thở ra…'); if (ph === 'in' && S.t > CYC - 0.1) breathDone(); }
      const want = ph !== 'out'; S.tot += dt; if (S.hold === want) S.sum += dt;
      orb.material.color.set(S.hold === want ? '#bfe8ff' : '#ffd0c8');
      hud.time(Math.max(0, N * CYC - S.t)); hud.score(S.good);
      if (S.t >= N * CYC && S.n < N) breathDone();
    },
    dispose() { S.live = false; S.over = true; },
  };
}
