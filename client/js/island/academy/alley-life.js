// academy/alley-life.js — PHỐ ĐÔNG VUI: phù thuỷ/học sinh dạo phố ghé tiệm mua bán, mèo lang thang, cú đậu mái & bay lượn,
// chủ tiệm mời chào (bong bóng lời nói 1 sprite dùng chung). Tải khi lại gần: người dạo chỉ nạp khi người chơi vào hẻm (< 55 m),
// hiện/animation trong 34 m (điện thoại 21 m), cú = 1 InstancedMesh (model CC0 OpenGameArt "Animal Figurines"), mèo = Quaternius CC0.
import * as THREE from 'three';
import { loadHero, actorLod, stepAnim, driveHero, STUDENTS } from '../characters.js';
import { loadModel, loadAnimated, animator } from '../models.js';
import { CFG } from '../config.js';
import { dressHero, CAPES, HATS } from './wear.js';
import { SHOP_TALK } from './alley-shops.js';

const CALL = ['Mời vào xem hàng mới!', 'Hôm nay giảm giá cho học sinh chăm!', 'Ghé tiệm đi cháu ơi!', 'Có món hay lắm này!', 'Giải đố đúng là mua được ngay!'];

export function createLife(ctx, { W, gy, vc, hw, U0, U1, PLAZA, keepers }) {
  const g = new THREE.Group(); g.name = 'alley-life';
  const MOB = CFG.isMobile, NW = MOB ? 8 : 13, SEE = MOB ? 21 : 34;
  const walkers = [], cats = [];
  let loaded = false, owls = null, owlData = [], books = null, bookData = [], t = 0;
  const rnd = Math.random;

  function load() {
    loaded = true;
    // ---- người dạo phố: đi dọc hẻm, dừng trước 1 tiệm (quay mặt vào) 3–8 s rồi đi tiếp ----
    for (let i = 0; i < NW; i++) {
      const kid = i % 3 !== 0, kind = STUDENTS[(i * 5) % STUDENTS.length];
      const w = { u: U0 - 4 - rnd() * (U0 - U1 - 10), side: rnd() < 0.5 ? -1 : 1, off: 0.35 + rnd() * 0.45, dir: rnd() < 0.5 ? 1 : -1, sp: 1.1 + rnd() * 0.5, wait: 0, target: null, hero: null, an: {}, face: 0, pos: new THREE.Vector3() };
      walkers.push(w);
      loadHero(kind, kid ? 1.3 + rnd() * 0.2 : 1.62 + rnd() * 0.1, kid ? null : { role: 'adult', shirt: ['#3a3f6b', '#5b3a8e', '#2f6b45', '#7a3a3a'][i % 4], pants: '#2a2433', hat: null }).then(async hero => {
        if (!hero) return; w.hero = hero; hero.npc = true; g.add(hero.model); hero.anim.play(hero.set.idle, 0); hero.model.visible = false;
        if (i % 2 === 0) dressHero(hero, { hat: HATS[i % HATS.length].id, cape: i % 4 === 0 ? CAPES[i % CAPES.length].id : null });
      });
    }
    // ---- mèo: 3 bé mèo quanh quảng trường & quán trà, đi thong thả rồi nằm nghỉ ----
    for (let i = 0; i < 3; i++) loadAnimated('animal-cat', true).then(gl => {
      if (!gl) return; const root = new THREE.Group(), m = gl.scene; root.add(m);
      m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m), k = 0.42 / (b.max.y - b.min.y || 1); m.scale.setScalar(k); m.position.y = -b.min.y * k;
      const anim = animator(m, gl.animations, n => n.split('|').pop()); anim.play('Idle', 0);
      const c = { root, anim, u: PLAZA + (i - 1) * 8, v: 0, goal: null, rest: 2 + rnd() * 5, an: {} }; c.v = vc(c.u) + (rnd() - 0.5) * 2; g.add(root); cats.push(c);
    });
    // ---- sách bay: 13 cuốn lượn vòng trên cửa Tiệm Sách Cũ & Hiệu Sách Bay, lật trang (đập nhẹ) ----
    loadModel('kit/furn_book_set').then(src => {
      if (!src) return; let geo = null, mat = null; src.updateMatrixWorld(true);
      src.traverse(o => { if (o.isMesh && !geo) { geo = o.geometry.clone().applyMatrix4(o.matrixWorld); mat = o.material; } });
      geo.computeBoundingBox(); const bb = geo.boundingBox, s = 0.34 / (bb.max.x - bb.min.x), c = bb.getCenter(new THREE.Vector3()); geo.translate(-c.x, -c.y, -c.z).scale(s, s, s);
      const homes = keepers.filter(k => k.sh.id === 'oldbook' || k.sh.id === 'book').map(k => k.p); if (!homes.length) return;
      books = new THREE.InstancedMesh(geo, mat, 13); books.name = 'alley-flying-books'; books.frustumCulled = false; g.add(books);
      bookData = Array.from({ length: 13 }, (_, i) => ({ c: homes[i % homes.length], r: 1 + Math.random() * 1.6, h: 2.6 + Math.random() * 1.6, w: (0.4 + Math.random() * 0.5) * (i % 2 ? 1 : -1), ph: Math.random() * 6.28 }));
    });
    // ---- cú: đậu trên cần biển/ban công (nhìn quanh), 2 con bay vòng trên hẻm ----
    loadModel('alley/owl').then(src => {
      if (!src) return; let geo = null, mat = null; src.updateMatrixWorld(true);
      src.traverse(o => { if (o.isMesh && !geo) { geo = o.geometry.clone().applyMatrix4(o.matrixWorld); mat = o.material.clone(); } });
      geo.computeBoundingBox(); const bb = geo.boundingBox, s = 1 / (bb.max.y - bb.min.y); geo.translate(0, -bb.min.y, 0).scale(s, s, s);
      mat.color.set('#8a6a48');
      const spots = [];
      for (const k of keepers) if (k.sh.id !== 'bank' && k.sh.id !== 'night' && spots.length < 8) spots.push(k.p.clone().setY(k.p.y + 4.35));
      const N = spots.length + 2; owls = new THREE.InstancedMesh(geo, mat, N); owls.name = 'alley-owls'; owls.frustumCulled = false; g.add(owls);
      owlData = spots.map((p, i) => ({ p, h: 0.36, ph: i * 1.7 })); owlData.push({ fly: 0, h: 0.4, ph: 0 }, { fly: 1, h: 0.36, ph: 3.1 });
    });
  }

  const bub = (() => {                                     // bong bóng mời chào (1 sprite dùng lại)
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true })); s.scale.set(3.2, 0.6, 1); s.visible = false; s.renderOrder = 5; g.add(s);
    return { s, until: 0, show(text, p) { const k = c.getContext('2d'); k.clearRect(0, 0, 512, 96); k.fillStyle = 'rgba(255,248,230,.94)'; k.beginPath(); k.roundRect(8, 8, 496, 70, 30); k.fill(); k.fillStyle = '#3a2a1a'; k.font = 'bold 30px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 44, 470); tex.needsUpdate = true; s.position.copy(p); s.visible = true; this.until = t + 3.4; } };
  })();
  const greeted = new Map();
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

  function update(dt, pp, inAlley) {
    t += dt;
    if (!loaded) { if (inAlley) load(); else return; }
    // người dạo
    for (const w of walkers) {
      if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) w.target = null; }
      else {
        if (!w.target && rnd() < dt * 0.06) { const k = keepers[Math.floor(rnd() * keepers.length)]; if (k && k.sh.id !== 'night' && Math.abs(k.p.z - W(w.u, vc(w.u), 0).z) < 34) w.target = k; }
        if (w.target) {
          const tp = w.target.p, dx = tp.x - w.pos.x, dz = tp.z - w.pos.z, d = Math.hypot(dx, dz);
          if (d < 1.7) { w.wait = 3 + rnd() * 5; w.face = Math.atan2(dx, dz); }
          else { w.u += Math.sign(tp.z - w.pos.z) * w.sp * dt * 0.9; w.side = Math.sign(tp.x - W(w.u, vc(w.u), 0).x) || w.side; w.off = Math.min(0.8, w.off + dt * 0.3); }
        } else {
          w.u += w.dir * w.sp * dt;
          if (w.u > U0 - 2) w.dir = -1; if (w.u < U1 + 5) w.dir = 1;
        }
      }
      const v = vc(w.u) + w.side * hw(w.u) * w.off, prev = w.pos.clone();
      w.pos.copy(W(w.u, v, gy(w.u, v)));
      if (!w.hero) continue;
      const d = w.pos.distanceTo(pp), vis = d < SEE; if (w.hero.model.visible !== vis) w.hero.model.visible = vis;
      if (!vis) continue;
      const mv = prev.distanceTo(w.pos), m = w.hero.model; m.position.copy(w.pos);
      const want = w.wait > 0 ? w.face : mv > 1e-4 ? Math.atan2(w.pos.x - prev.x, w.pos.z - prev.z) : m.rotation.y;
      m.rotation.y += (((want - m.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 5);
      driveHero(w.hero, { speed: w.wait > 0 ? 0 : mv / Math.max(dt, 1e-3), grounded: true }); actorLod(w.hero, m, d); stepAnim(w.hero.anim, w.an, d, dt);
    }
    // mèo
    for (const c of cats) {
      const p = W(c.u, c.v, gy(c.u, c.v)), d = p.distanceTo(pp), vis = d < SEE; c.root.visible = vis; if (!vis) continue;
      if (c.rest > 0) { c.rest -= dt; c.anim.play('Idle', 0.4); if (c.rest <= 0) c.goal = [PLAZA - 13 + rnd() * 26, 0]; }
      else if (c.goal) { const gu = c.goal[0], gv = vc(gu) + (rnd() - 0.5) * 0.1, du = gu - c.u, dv = gv - c.v, L = Math.hypot(du, dv); if (L < 0.3) { c.goal = null; c.rest = 4 + rnd() * 8; } else { c.u += du / L * dt * 0.9; c.v += dv / L * dt * 0.9; c.anim.play('Walk', 0.3); } }
      const p2 = W(c.u, c.v, gy(c.u, c.v)); if (p2.distanceToSquared(c.root.position) > 1e-6) c.root.rotation.y = Math.atan2(p2.x - c.root.position.x, p2.z - c.root.position.z);
      c.root.position.copy(p2); stepAnim(c.anim, c.an, d, dt);
    }
    // cú
    if (owls) {
      owlData.forEach((o, i) => {
        let p, yaw;
        if (o.fly !== undefined) { const u = (U0 + U1) / 2 + Math.sin(t * 0.11 + o.ph) * 50, v = vc(u) + Math.sin(t * 0.37 + o.ph) * 2.2; p = W(u, v, gy(u, vc(u)) + 13 + Math.sin(t * 0.8 + o.ph) * 1.5); yaw = Math.atan2(Math.cos(t * 0.11 + o.ph), 0) + (o.fly ? 0 : Math.PI); }
        else { p = o.p; yaw = Math.sin(t * 0.5 + o.ph) * 1.2 + (Math.sin(t * 0.13 + o.ph) > 0.8 ? 2.4 : 0); }   // đậu: thỉnh thoảng quay đầu ra sau
        SC.setScalar(o.h * (o.fly !== undefined ? 1 + Math.sin(t * 9 + o.ph) * 0.05 : 1)); owls.setMatrixAt(i, M4.compose(p, Q.setFromAxisAngle(up, yaw), SC));
      });
      owls.instanceMatrix.needsUpdate = true;
    }
    if (books) {
      const vis = bookData.some(b => b.c.distanceToSquared(pp) < 34 * 34); books.visible = vis;
      if (vis) { bookData.forEach((b, i) => { const a = t * b.w + b.ph; V.set(b.c.x + Math.cos(a) * b.r, b.c.y + b.h + Math.sin(t * 1.7 + b.ph) * 0.3, b.c.z + Math.sin(a) * b.r); Q.setFromEuler(new THREE.Euler(Math.sin(t * 6 + b.ph) * 0.35, -a, 0.2)); books.setMatrixAt(i, M4.compose(V, Q, SC.setScalar(1))); }); books.instanceMatrix.needsUpdate = true; }
    }
    // chủ tiệm mời chào khi người chơi đi ngang (mỗi tiệm 1 lần / 34 s)
    if (bub.s.visible && t > bub.until) bub.s.visible = false;
    for (const k of keepers) {
      if (!k.hero || !k.hero.model.visible) continue;
      const d = Math.hypot(pp.x - k.p.x, pp.z - k.p.z);
      if (d < 8 && d > 3.4 && t - (greeted.get(k) ?? -99) > 34 && !bub.s.visible) {
        greeted.set(k, t); const T = SHOP_TALK[k.sh.id];
        bub.show(`${T ? T.who : ''}: ${CALL[Math.floor(rnd() * CALL.length)]}`, k.p.clone().setY(k.p.y + 2.25));
        const a = k.hero.anim; if (a.has && a.has('wave')) { a.play('wave', 0.2, true); setTimeout(() => a.play(k.hero.set.idle, 0.3), 1500); }
      }
    }
  }
  return { g, update };
}
