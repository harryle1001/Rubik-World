// town-people.js — Người trong thị trấn trường (đọc từ mô phỏng 2D qua RS.agents / RS.npcs):
//   - Học sinh: đồng phục áo trắng, khăn quàng đỏ, cặp theo màu của từng bạn.
//   - Thầy cô: áo dài / váy / sơ mi màu riêng, cầm sách; bảo vệ & nhân viên: mũ, bảng kẹp, máy quay…
//   - Người dân, khách du lịch (NPC): đồ thường theo màu shirt/pants của NPC, vật dụng theo việc (cần câu, mũ cói…).
// Pool tối đa POOL người gần nhất; ai gần mới cập nhật animation mỗi khung hình. Đứng gần: quay mặt, gật/vẫy, hiện tên.
import * as THREE from 'three';
import { loadHero, driveHero, emote } from './characters.js';

const V = 'abcdef';
const NPC_NAME = { swim: 'Người tắm biển', surf: 'Bạn lướt sóng', sun: 'Khách du lịch', bike: 'Người đạp xe', camp: 'Bạn cắm trại', picnic: 'Gia đình dã ngoại', fishing: 'Bác câu cá', walk: 'Người đi dạo', kite: 'Bạn thả diều' };
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

// Phân loại 1 người → model + trang phục (key: người có cùng key dùng lại được model của nhau)
function lookOf(a) {
  const female = !!(a.long || a.skirt || a.aodai);
  const kind = `student-${female ? 'female' : 'male'}-${V[(a.kind ? a.idx : hash(a.id || a.name)) % 6]}`;
  let look;
  if (a.kind) { // NPC: người dân / khách
    look = { role: 'adult', shirt: a.shirt, pants: a.pants, prop: a.kind === 'fishing' ? 'rod' : null, hat: a.kind === 'sun' || a.kind === 'fishing' ? '#e8c873' : null };
  } else if (a.student !== false) {
    look = { role: 'student', bag: a.bag };
  } else {
    const teacher = /giáo viên|giám hiệu|văn thư/i.test(a.role || '');
    const prop = { cube: 'book', bolt: 'book', eye: 'book', paper: 'clip', clip: 'clip', camcorder: 'cam' }[a.icon] || null;
    look = { role: teacher ? 'teacher' : 'adult', shirt: a.shirt, pants: a.pants, aodai: !!a.aodai, skirt: !!a.skirt && !a.aodai, cap: a.cap || null, brim: a.brim || null, glasses: !!a.glasses, prop, propColor: a.shirt };
  }
  const h = look.role === 'student' ? 1.25 : a.kind ? 1.5 + (a.idx % 3) * 0.06 : 1.6;
  return { kind, look, h, key: kind + JSON.stringify(look) + h };
}
const nameOf = a => a.kind ? (NPC_NAME[a.kind] || 'Người dân') : a.student !== false ? a.name : `${a.name} · ${String(a.role || '').split(',')[0]}`;

export function createTownPeople(ctx, { P, Y_MIN, Y_MAX = 1e9, TOWN_Y, POOL }) {
  const scene = ctx.scene, pool = [], loading = new Set(); ctx.townPeople = pool; // gỡ lỗi: __island.townPeople
  // Bảng tên: 1 sprite dùng chung, vẽ lại khi đổi người
  const tc = document.createElement('canvas'); tc.width = 512; tc.height = 80;
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tc), depthWrite: false, transparent: true }));
  tag.scale.set(3.2, 0.5, 1); tag.visible = false; tag.renderOrder = 5; scene.add(tag); let tagFor = null;
  const drawTag = (text, color) => {
    const k = tc.getContext('2d'); k.clearRect(0, 0, 512, 80); k.font = 'bold 38px system-ui'; const w = Math.min(504, k.measureText(text).width + 44);
    k.fillStyle = 'rgba(27,22,38,.78)'; k.beginPath(); k.roundRect((512 - w) / 2, 8, w, 64, 28); k.fill();
    k.fillStyle = color; k.beginPath(); k.arc((512 - w) / 2 + 22, 40, 8, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 262, 41, 440); tag.material.map.needsUpdate = true;
  };
  const groundY = (x, z) => { const g = ctx.groundExtra(x, z, 9); return g > -50 ? g : TOWN_Y; };

  return function updatePeople(dt, RS) {
    const p = ctx.player.pos;
    const list = []; for (const a of RS.agents) if (a.visible && !a.inSub) list.push(a); for (const n of RS.npcs) if (RS.npcShown(n)) list.push(n);
    const near = list.filter(a => a.y > Y_MIN && a.y < Y_MAX).map(a => { const [x, z] = P(a.x, a.y); return [a, Math.hypot(x - p.x, z - p.z)]; }).filter(q => q[1] < 70).sort((a, b) => a[1] - b[1]).slice(0, POOL).map(q => q[0]);
    const want = new Set(near);
    for (const e of pool) if (e.a && !want.has(e.a)) { e.a = null; e.hero.model.visible = false; }
    for (const a of near) {
      if (pool.some(e => e.a === a)) continue;
      const L = a._look3d || (a._look3d = lookOf(a));
      let e = pool.find(e => !e.a && e.key === L.key);
      if (!e && pool.length + loading.size >= POOL) { // pool đầy: bỏ 1 model rảnh khác kiểu để nạp kiểu mới
        const i = pool.findIndex(e => !e.a); if (i >= 0) { scene.remove(pool[i].hero.model); pool.splice(i, 1); }
      }
      if (!e && pool.length + loading.size < POOL) {
        const id = Symbol(); loading.add(id);
        loadHero(L.kind, L.h, L.look).then(h => { loading.delete(id); if (!h) return; h.model.visible = false; scene.add(h.model); pool.push({ hero: h, key: L.key, a: null, st: {}, px: 0, pz: 0, yaw: 0, far: 0, greet: 0 }); });
        continue;
      }
      if (e) { e.a = a; [e.px, e.pz] = P(a.x, a.y); e.yaw = a.dir < 0 ? -Math.PI / 2 : Math.PI / 2; e.hero.model.visible = true; }
    }
    let best = null, bd = 4.5; const now = performance.now();
    for (const e of pool) {
      if (!e.a) continue; const a = e.a, [x, z] = P(a.x, a.y), dx = x - e.px, dz = z - e.pz, sp = Math.hypot(dx, dz) / Math.max(dt, 1e-3);
      const dist = Math.hypot(x - p.x, z - p.z), moving = a.moving && sp > 0.05;
      const sit = a.cycling || a.boat || a.kind === 'bike' ? 'drive' : /sun|picnic|camp|fishing/.test(a.kind || '') ? 'sit' : false;
      let face = null;
      if (Math.abs(dx) + Math.abs(dz) > 0.01) face = Math.atan2(dx, dz);
      else if (dist < 4 && !sit) face = Math.atan2(p.x - x, p.z - z); // đứng gần → quay mặt về người chơi
      if (face !== null) { let d = face - e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); e.yaw += d * Math.min(1, dt * 6); }
      e.px = x; e.pz = z; const m = e.hero.model; m.position.set(x, groundY(x, z), z); m.rotation.y = e.yaw;
      // người chơi lại gần (≤3 m) → gật đầu (học sinh) / vẫy tay (người lớn), 25 giây 1 lần
      if (dist < 3 && !moving && !sit && now > e.greet) { e.greet = now + 25000; emote(e.hero, e.st, a.student !== false && !a.kind ? 'cheer' : 'interact'); }
      driveHero(e.hero, { speed: moving ? Math.max(1.2, Math.min(sp, 8)) : 0, grounded: true, walk: 5.5, sitting: sit, oneShot: e.st.oneShot });
      // animation: người gần (<25 m) mỗi khung hình, người xa 4 khung/lần
      if (dist < 25) e.hero.anim.update(dt); else if ((e.far += dt) > 0.12) { e.hero.anim.update(e.far); e.far = 0; }
      if (dist < bd) { bd = dist; best = e; }
    }
    // tên trên đầu người gần nhất
    if (best) {
      if (tagFor !== best.a) { tagFor = best.a; const L = best.a._look3d; drawTag(nameOf(best.a), L.look.role === 'teacher' ? '#ffd23f' : L.look.role === 'student' ? '#ff5a5a' : '#7fd1ff'); }
      tag.position.set(best.px, best.hero.model.position.y + best.a._look3d.h + 0.45, best.pz); tag.visible = true;
    } else { tag.visible = false; tagFor = null; }
  };
}
