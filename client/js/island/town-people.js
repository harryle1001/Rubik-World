// town-people.js — Người trong thị trấn trường (đọc từ mô phỏng 2D qua RS.agents / RS.npcs):
//   - Học sinh: đồng phục áo trắng, khăn quàng đỏ, cặp theo màu của từng bạn.
//   - Thầy cô: áo dài / váy / sơ mi màu riêng, cầm sách; bảo vệ & nhân viên: mũ, bảng kẹp, máy quay…
//   - Người dân, khách du lịch (NPC): đồ thường theo màu shirt/pants của NPC, vật dụng theo việc (cần câu, mũ cói…).
// Pool tối đa POOL người gần nhất; ai gần mới cập nhật animation mỗi khung hình. Đứng gần: quay mặt, gật/vẫy, hiện tên.
import * as THREE from 'three';
import { loadHero, driveHero, emote, setOutline, lookAtTarget } from './characters.js';
import { CFG } from './config.js';

const V = 'abcdef';
const NPC_NAME = { swim: 'Người tắm biển', surf: 'Bạn lướt sóng', sun: 'Khách du lịch', bike: 'Người đạp xe', camp: 'Bạn cắm trại', picnic: 'Gia đình dã ngoại', fishing: 'Bác câu cá', walk: 'Người đi dạo', kite: 'Bạn thả diều' };
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

// Phân loại 1 người → model + trang phục (key: người có cùng key dùng lại được model của nhau)
function lookOf(a) {
  const female = !!(a.long || a.skirt || a.aodai);
  const kind = `student-${female ? 'female' : 'male'}-${V[(a.kind ? a.idx : hash(a.id || a.name)) % 6]}`;
  let look;
  if (a.kind) { // NPC: người dân / khách
    look = { role: 'adult', shirt: a.shirt, pants: a.pants, prop: a.kind === 'fishing' ? 'rod' : null, hat: a.kind === 'sun' || a.kind === 'fishing' || (a.kind === 'walk' && a.idx % 2) ? '#e8c873' : null, glasses: a.kind === 'sun' };
  } else if (a.student !== false) {
    const hs = hash(a.id || a.name), girl = !!a.long, r = hs % 10; // phụ kiện cố định theo từng bạn
    look = { role: 'student', bag: a.bag, acc: girl ? (r < 5 ? 'bow' : r < 7 ? 'clip' : r < 8 ? 'glasses' : null) : (r < 2 ? 'glasses' : null), bowColor: ['#ff5a8a', '#ffd23f', '#7fd1ff', '#ff8a2b', '#b06bff'][hs % 5] };
  } else {
    const teacher = /giáo viên|giám hiệu|văn thư/i.test(a.role || '');
    const prop = { cube: 'book', bolt: 'book', eye: 'book', paper: 'clip', clip: 'clip', camcorder: 'cam' }[a.icon] || null;
    look = { role: teacher ? 'teacher' : 'adult', shirt: a.shirt, pants: a.pants, aodai: !!a.aodai, skirt: !!a.skirt && !a.aodai, cap: a.cap || null, brim: a.brim || null, glasses: !!a.glasses, prop, propColor: a.shirt };
  }
  const h = look.role === 'student' ? 1.25 : a.kind ? 1.5 + (a.idx % 3) * 0.06 : 1.6;
  return { kind, look, h, key: kind + JSON.stringify(look) + h };
}
const nameOf = a => a.kind ? (NPC_NAME[a.kind] || 'Người dân') : a.student !== false ? a.name : `${a.name} · ${String(a.role || '').split(',')[0]}`;

export function createTownPeople(ctx, { P, Y_MIN, Y_MAX = 1e9, TOWN_Y, POOL }) { // eslint-disable-line
  POOL = Math.min(POOL, CFG.isMobile ? 20 : 24);   // điện thoại: tối đa 20 người cùng lúc
  const scene = ctx.scene, pool = [], loading = new Set(); ctx.townPeople = pool; // gỡ lỗi: __island.townPeople
  const NEAR_ANIM = 35, OUTLINE = 18;              // animation đầy đủ trong 35 m; viền chỉ trong 18 m
  // Ghế đá trong sân trường (cùng toạ độ 2D với town-buildings.js): người đứng chờ gần ghế sẽ ngồi xuống
  const seats = []; for (const [x2, y2] of [[200, 435], [500, 435], [1100, 435], [870, 700], [1180, 735], [1640, 700]]) { const [x, z] = P(x2, y2); for (const k of [-0.45, 0.45]) seats.push({ x: x + k, z, by: null }); }
  // Bong bóng chào / nói chuyện: vài sprite dùng chung
  const bubbles = Array.from({ length: 4 }, () => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true })); sp.scale.set(1.6, 0.6, 1); sp.visible = false; sp.renderOrder = 6; scene.add(sp); return { sp, c, t: 0, e: null }; });
  const say = (e, text) => {
    const b = bubbles.find(b => b.e === e) || bubbles.find(b => b.t <= 0) || bubbles.reduce((m, b) => b.t < m.t ? b : m); const k = b.c.getContext('2d');
    k.clearRect(0, 0, 256, 96); k.font = 'bold 34px system-ui'; const w = Math.min(248, k.measureText(text).width + 34);
    k.fillStyle = '#fffaf0'; k.strokeStyle = '#3a2a16'; k.lineWidth = 4; k.beginPath(); k.roundRect((256 - w) / 2, 6, w, 62, 26); k.fill(); k.stroke();
    k.beginPath(); k.moveTo(118, 66); k.lineTo(128, 88); k.lineTo(140, 66); k.fill(); k.fillStyle = '#3a2a16'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 128, 38, 230);
    b.sp.material.map.needsUpdate = true; b.t = 2.2; b.e = e; b.sp.visible = true;
  };
  const GREET = { student: ['👋 Chào bạn!', '😊 Hi!', '🧩 Chơi Rubik không?', '✌️ Chào!'], teacher: ['📚 Chào em!', '😊 Học vui nhé!', '👋 Chào em!'], adult: ['👋 Xin chào!', '😊 Chào cháu!', '🌞 Trời đẹp quá!'] };
  const TALK = ['💬', '😄', '🤔', '🎵', '👍'];
  let talkT = 0, perfMs = 0, perfN = 0; ctx.perfPeople = () => perfN ? perfMs / perfN : 0;
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
    const t0 = performance.now(), p = ctx.player.pos;
    const list = []; for (const a of RS.agents) if (a.visible && !a.inSub) list.push(a); for (const n of RS.npcs) if (RS.npcShown(n)) list.push(n);
    const near = list.filter(a => a.y > Y_MIN && a.y < Y_MAX).map(a => { const [x, z] = P(a.x, a.y); return [a, Math.hypot(x - p.x, z - p.z)]; }).filter(q => q[1] < 70).sort((a, b) => a[1] - b[1]).slice(0, POOL).map(q => q[0]);
    const want = new Set(near);
    for (const e of pool) if (e.a && !want.has(e.a)) { e.a = null; e.hero.model.visible = false; if (e.seat) { e.seat.by = null; e.seat = null; } }
    for (const a of near) {
      if (pool.some(e => e.a === a)) continue;
      const L = a._look3d || (a._look3d = lookOf(a));
      let e = pool.find(e => !e.a && e.key === L.key);
      if (!e && pool.length + loading.size >= POOL) { // pool đầy: bỏ 1 model rảnh khác kiểu để nạp kiểu mới
        const i = pool.findIndex(e => !e.a); if (i >= 0) { scene.remove(pool[i].hero.model); pool.splice(i, 1); }
      }
      if (!e && pool.length + loading.size < POOL) {
        const id = Symbol(); loading.add(id);
        loadHero(L.kind, L.h, L.look).then(h => { loading.delete(id); if (!h) return; h.npc = true; h.model.visible = false; scene.add(h.model); pool.push({ hero: h, key: L.key, a: null, st: {}, px: 0, pz: 0, yaw: 0, far: 0, greet: 0, tick: 0, spd: 0 }); });
        continue;
      }
      if (e) { e.a = a; [e.px, e.pz] = P(a.x, a.y); e.yaw = a.dir < 0 ? -Math.PI / 2 : Math.PI / 2; e.hero.model.visible = true; }
    }
    let best = null, bd = 4.5; const now = performance.now(); talkT -= dt;
    const doTalk = talkT <= 0; if (doTalk) talkT = 0.6;
    for (const e of pool) {
      if (!e.a) continue; const a = e.a, [x, z] = P(a.x, a.y), dx = x - e.px, dz = z - e.pz;
      const raw = Math.hypot(dx, dz) / Math.max(dt, 1e-3); e.spd = (e.spd || 0) + (Math.min(raw, 9) - (e.spd || 0)) * Math.min(1, dt * 6); // tốc độ làm mượt (mô phỏng 2D giật)
      const dist = Math.hypot(x - p.x, z - p.z), moving = a.moving && e.spd > 0.2;
      let sit = a.cycling || a.boat || a.kind === 'bike' ? 'drive' : /sun|picnic|camp|fishing/.test(a.kind || '') ? 'sit' : false;
      // ghế đá: đứng yên gần ghế trống → ngồi; đi tiếp → đứng dậy
      if (moving || sit) { if (e.seat) { e.seat.by = null; e.seat = null; } }
      else if (!e.seat && doTalk && !a.kind) { const st = seats.find(q => !q.by && Math.hypot(q.x - x, q.z - z) < 2.2); if (st) { st.by = e; e.seat = st; } }
      let gx = x, gz = z, face = null;
      if (e.seat) { sit = 'sit'; gx = e.seat.x; gz = e.seat.z; face = 0; }
      else if (Math.abs(dx) + Math.abs(dz) > 0.01) face = Math.atan2(dx, dz);
      else if (e.partner && e.partner.a) face = Math.atan2(e.partner.px - x, e.partner.pz - z); // nói chuyện: quay vào nhau
      else if (dist < 4 && !sit) face = Math.atan2(p.x - x, p.z - z); // đứng gần → quay về phía người chơi
      if (face !== null) { let d = face - e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); e.yaw += d * Math.min(1, dt * 5); }
      e.px = x; e.pz = z; const m = e.hero.model, gy = groundY(gx, gz); m.position.set(gx, gy + (e.seat ? 0.12 : 0), gz); m.rotation.y = e.yaw;
      // đứng nói chuyện: 2 người đứng yên cách nhau < 1.8 m (kiểm tra thưa, 0.6 s/lần)
      if (doTalk) {
        e.partner = null;
        if (!moving && !sit && dist < NEAR_ANIM) for (const o of pool) if (o !== e && o.a && !o.seat && Math.hypot(o.px - x, o.pz - z) < 1.8 && !(o.a.moving && o.spd > 0.2)) { e.partner = o; break; }
        if (e.partner && dist < 15 && Math.random() < 0.06) { emote(e.hero, e.st, Math.random() < 0.7 ? 'cheer' : 'no'); if (Math.random() < 0.4) say(e, TALK[(Math.random() * TALK.length) | 0]); } // gật / lắc đầu khi nói chuyện
      }
      // người chơi lại gần (≤3 m) → gật đầu / vẫy tay + bong bóng chào, 25 giây 1 lần
      if (dist < 3 && !moving && !sit && now > e.greet) { const role = a._look3d.look.role; e.greet = now + 25000; emote(e.hero, e.st, 'cheer'); const g = GREET[role] || GREET.adult; say(e, g[(Math.random() * g.length) | 0]); }
      driveHero(e.hero, { speed: moving ? e.spd : 0, grounded: true, walk: 5.5, sitting: sit, oneShot: e.st.oneShot });
      // LOD: < 35 m cập nhật animation mỗi khung hình (+ quay đầu nhìn người chơi khi < 6 m); xa hơn: 1/3 khung hình; viền chỉ < 18 m
      if (dist < NEAR_ANIM) { e.hero.anim.update(dt + (e.far || 0)); e.far = 0; lookAtTarget(e.hero, dist < 6 && !e.seat ? p : (e.partner && dist < 15 ? { x: e.partner.px, z: e.partner.pz } : null), e.st); }
      else { e.far = (e.far || 0) + dt; if (++e.tick % 3 === 0 || !e.tick) { e.hero.anim.update(e.far); e.far = 0; } }
      setOutline(e.hero, dist < OUTLINE);
      if (dist < bd) { bd = dist; best = e; }
    }
    for (const b of bubbles) if (b.t > 0) { b.t -= dt; const e = b.e; if (!e || !e.a) { b.t = 0; } else { b.sp.position.set(e.hero.model.position.x, e.hero.model.position.y + e.a._look3d.h + 0.95 + (2.2 - b.t) * 0.12, e.hero.model.position.z); b.sp.material.opacity = Math.min(1, b.t * 2.5); } if (b.t <= 0) { b.sp.visible = false; b.e = null; } }
    // tên trên đầu người gần nhất
    if (best) {
      if (tagFor !== best.a) { tagFor = best.a; const L = best.a._look3d; drawTag(nameOf(best.a), L.look.role === 'teacher' ? '#ffd23f' : L.look.role === 'student' ? '#ff5a5a' : '#7fd1ff'); }
      tag.position.set(best.px, best.hero.model.position.y + best.a._look3d.h + 0.45, best.pz); tag.visible = true;
    } else { tag.visible = false; tagFor = null; }
    perfMs += performance.now() - t0; perfN++; if (perfN > 600) { perfMs /= 2; perfN /= 2; }
  };
}
