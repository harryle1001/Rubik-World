// academy/pho-life.js — KHÁCH DẠO PHỐ (v4): học sinh + người lớn đi mua sắm ở cả Phố Phép Thuật cũ (alley.js — chỉ đọc tim lối vc/hw,
// không sửa file) và Phố Phép Thuật Mới (pho2.js). Đi bộ dọc lối, dừng trước tiệm 3–6 s ngắm hàng, có người đội mũ phù thủy.
// Máy tính 5 + 5 người, điện thoại 2 + 2. Chỉ cập nhật / vẽ khi phố tương ứng đang hiện.
import * as THREE from 'three';
import { loadHero, STUDENTS } from '../characters.js';
import { heightLocal } from './plan.js';
import { vc, hw } from './alley.js';
import { PHO2 } from './pho2.js';
import { dressWizard } from './practice.js';
import { CFG } from '../config.js';

const COL = ['#c8302c', '#3a6fc4', '#3f8a4c', '#7a4fb0', '#c9a24a'];
// tuyến đi (u, v): phố cũ dọc tim lối u 26 → −84 (lệch trái/phải), phố mới hình chữ U
const OLD = side => { const P = []; for (let u = 26; u >= -84; u -= 4) P.push([u, vc(u) + side * (hw(u) - 0.9)]); return [...P, ...P.slice(1, -1).reverse()]; };   // đi tới cuối hẻm rồi quay lại
const NEW = () => { const [a, b] = PHO2.streets, P = []; for (let v = PHO2.v0; v <= PHO2.v1; v += 5) P.push([a, v]); P.push([a, 88], [(a + b) / 2, 92], [b, 88]); for (let v = PHO2.v1; v >= PHO2.v0; v -= 5) P.push([b, v]); P.push([b, 7.5], [a, 7.5]); return P; };   // vòng kín qua đầu phố (v 7,5)

export function createPhoLife(ctx, { Y, toWorld }) {
  const MOB = CFG.isMobile, N = MOB ? 2 : 5;
  let G = null, people = [];
  const gy = (u, v) => { const [x, z] = toWorld(u, v); return heightLocal(u, v, x, z); };
  function build() {
    if (G) return; G = new THREE.Group(); G.name = 'academy-pho-life'; ctx.scene.add(G);
    for (const [street, routes] of [['old', [OLD(-1), OLD(1)]], ['new', [NEW(), NEW().reverse()]]]) for (let i = 0; i < N; i++) {
      const path = routes[i % 2], m = { street, path, k: Math.floor((i / N) * path.length), f: 0, wait: 0, hero: null, pos: new THREE.Vector3(), adult: i % 3 === 1, grnd: street === 'old' };
      people.push(m);
      const kind = STUDENTS[(i * 7 + (street === 'old' ? 1 : 4)) % STUDENTS.length];
      loadHero(kind, m.adult ? 1.66 : 1.36, m.adult ? { role: 'shopper', shirt: COL[i % 5], pants: '#2a2a30', old: i % 2 === 0 } : null).then(h => {
        if (!h || !G) return; h.npc = true; m.hero = h; G.add(h.model); h.anim.play(h.set.walk, 0); m.clip = 'walk';
        if (!MOB && i % 2 === 0) dressWizard(h, COL[(i + 2) % 5], m.adult ? COL[(i + 2) % 5] : null);
      });
    }
  }
  function unbuild() { if (!G) return; ctx.scene.remove(G); G = null; people = []; }
  const play = (m, c) => { if (m.clip !== c) { m.clip = c; m.hero.anim.play(m.hero.set[c] || m.hero.set.idle, 0.3); } };
  let newG = null, findT = 0;   // nhóm phố mới: tìm theo tên 1 lần/s khi chưa có (getObjectByName duyệt cả cảnh — mỗi khung tốn ~2 ms trên điện thoại)
  function update(dt) {
    if (!G) return;
    if ((!newG || !newG.parent) && (findT -= dt) <= 0) { findT = 1; newG = ctx.scene.getObjectByName('academy-pho2') || null; }
    const oldG = ctx.alley && ctx.alley.built && ctx.alley.built.g, vis = { old: !!(oldG && oldG.visible), new: !!(newG && newG.visible) };
    const cam = ctx.camera.position;
    for (const m of people) {
      if (!m.hero) continue; m.hero.model.visible = vis[m.street]; if (!vis[m.street]) continue;
      const a = m.path[m.k], b = m.path[(m.k + 1) % m.path.length];
      if (m.wait > 0) { m.wait -= dt; play(m, 'idle'); }
      else {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; m.f += dt * (m.adult ? 1.15 : 1.35) / L; play(m, 'walk');
        if (m.f >= 1) { m.f = 0; m.k = (m.k + 1) % m.path.length; if (Math.random() < 0.18) m.wait = 3 + Math.random() * 3; if (m.k === 0) m.f = 0; }
      }
      const u = a[0] + (b[0] - a[0]) * m.f, v = a[1] + (b[1] - a[1]) * m.f, [x, z] = toWorld(u, v);
      m.pos.set(x, m.grnd ? gy(u, v) : Y, z); m.hero.model.position.copy(m.pos);
      const [bx, bz] = toWorld(b[0], b[1]); m.hero.model.rotation.y = m.wait > 0 ? Math.atan2(bx - x, bz - z) + (m.k % 2 ? 1.4 : -1.4) : Math.atan2(bx - x, bz - z);   // dừng: quay sang ngắm tiệm
      if (cam.distanceTo(m.pos) < 55) m.hero.anim.update(dt);
    }
  }
  return { build, unbuild, update };
}
