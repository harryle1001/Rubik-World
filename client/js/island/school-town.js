// school-town.js — THỊ TRẤN TRƯỜNG RUBIK trong thế giới 3D (giai đoạn greybox: khối đơn giản để kiểm tra tỷ lệ, lối đi).
// Toàn bộ trường Rubik (client/school/) chạy ngầm trong 1 iframe: giờ học, 21 bạn & thầy cô, NPC, mọi mini game, cửa hàng,
// Coach Ru, nhiệm vụ… Module này đọc dữ liệu qua window.RS của iframe rồi dựng lại bằng 3D:
//   - Nền theo vùng (sân trường, sân bóng, bãi biển, nông trại…), tường các lớp có chừa cửa, nhà ở → buildGreybox()
//   - Cửa vào (77 cửa): đứng gần bấm E/nút → mở đúng mini game/bảng của trường → doors
//   - Học sinh, thầy cô, khách du lịch đi lại theo thời khóa biểu → updatePeople()
//   - Cầu nối đảo ↔ trường; nút "🏫 Đến trường"; giờ trong ngày theo đồng hồ của trường
// Toạ độ: 2D (x, y) pixel → 3D (TX + x*S, Y, TZ + y*S). Muốn dời cả thị trấn: sửa TX, TZ.
import * as THREE from 'three';
import { toon, gradientMap } from './style.js';
import { createTownPeople } from './town-people.js';

export const S = 0.05, TX = -40, TZ = -140, TOWN_Y = 1.2;
export const Y_MIN = -620, Y_MAX = 900, X_MAX = 10400;      // phần đất liền của bản đồ 2D
const X3 = x => TX + x * S, Z3 = y => TZ + y * S, X2 = x => (x - TX) / S, Y2 = z => (z - TZ) / S;
export const REGION_COL = {
  yard: '#d8ccb0', road: '#9a948c', beach: '#ecd9a0', north: '#8cc46e', rubik: '#efe2c4', chess: '#efe2c4', music: '#efe2c4', hall: '#e9d8b4', office: '#efe2c4', elec: '#efe2c4',
  attend: '#e2d2a8', rubikyard: '#dcc99a', field: '#4fa64a', giantchess: '#ece6d6', rubikpark: '#9bd26e', pond: '#4aa3c8', lake: '#4aa3c8', lotus: '#5aa8a0',
  flowerfield: '#f0b3c8', bpad: '#b9d68a', skate: '#a5b0bf', patin: '#a5b0bf', basket: '#c98a5a', ski: '#f4f8fb', art: '#e6c79a', farm: '#b08850',
  hills: '#6faa4f', garden: '#f5b6c8', picnic: '#9ad26e', forest: '#4f8f3c', dalat: '#c9a87c',
};
const WALL_COL = { rubik: '#ef8a5a', chess: '#7f9bd6', music: '#d77fc0', hall: '#e2b04a', office: '#9aa7b8', elec: '#6cc0a8', rubikyard: '#f2c14e' };

export function createSchoolTown(ctx) {
  const { scene, terrain } = ctx; ctx.boxes = ctx.boxes || [];
  const town = { RS: null, doors: [], ready: false };

  // ---------- Iframe chạy trường Rubik (trong suốt, chỉ hiện khi có bảng mini game) ----------
  const fr = document.createElement('iframe');
  fr.src = '/school/index.html?embed=1'; fr.title = 'Trường Rubik';
  fr.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:25;background:transparent;pointer-events:none;color-scheme:dark';
  fr.setAttribute('allowtransparency', 'true'); document.body.appendChild(fr);
  const waitRS = setInterval(() => { const w = fr.contentWindow; if (w && w.RS && w.RS.doors) { clearInterval(waitRS); town.RS = w.RS; town.win = w; w.addEventListener('pointerdown', () => ctx.audio && ctx.audio.start()); build(); } }, 300);

  // ---------- Nền thị trấn (nối với đảo bằng cầu) ----------
  const x0 = X3(0), x1 = X3(X_MAX), z0 = Z3(Y_MIN), z1 = Z3(Y_MAX);
  let shoreZ = -30; while (shoreZ > -110 && terrain.heightAt(0, shoreZ) > 0.6) shoreZ -= 1; // bờ bắc của đảo
  const bridge = { x: 0, za: shoreZ + 3, zb: z1 + 1.5, ya: terrain.heightAt(0, shoreZ + 3), w: 1.9 };
  town.bridge = bridge; town.bounds = { x0, x1, z0, z1 }; // cho bản đồ (world-map.js)
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99;
    if (x > x0 && x < x1 && z > z0 && z < z1) h = Math.max(h, TOWN_Y);
    if (Math.abs(x - bridge.x) < bridge.w && z < bridge.za && z > bridge.zb) { const t = (bridge.za - z) / (bridge.za - bridge.zb); h = Math.max(h, bridge.ya + (TOWN_Y - bridge.ya) * t + Math.sin(t * Math.PI) * 0.6); }
    return h;
  };
  {
    const g = new THREE.Group(); scene.add(g);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 2, TOWN_Y + 3, z1 - z0 + 2), toon('#cdb98a')); slab.position.set((x0 + x1) / 2, (TOWN_Y - 3) / 2 - 0.02, (z0 + z1) / 2); slab.receiveShadow = true; g.add(slab);
    // cầu gỗ
    const L = bridge.za - bridge.zb, n = Math.ceil(L / 0.6);
    for (let i = 0; i < n; i++) { const z = bridge.za - (i + 0.5) * L / n, y = ctx.groundExtra(0, z, 0); const p = new THREE.Mesh(new THREE.BoxGeometry(bridge.w * 2, 0.15, 0.55), toon(i % 2 ? '#a87445' : '#8a5a34')); p.position.set(bridge.x, y - 0.07, z); p.castShadow = p.receiveShadow = true; g.add(p); if (i % 4 === 0) for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 0.15), toon('#6b4a2b')); post.position.set(bridge.x + s * bridge.w, y + 0.5, z); g.add(post); } }
    town.signGroup = g;
  }

  // ---------- Dựng greybox từ dữ liệu trường ----------
  const label = (text, x, y, z, scale = 1) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
    k.font = 'bold 44px system-ui'; const w = Math.min(500, k.measureText(text).width + 40);
    k.fillStyle = 'rgba(27,22,38,.75)'; k.beginPath(); k.roundRect((512 - w) / 2, 12, w, 72, 30); k.fill(); k.fillStyle = '#fff'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 49, 480);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(5.3 * scale, 1 * scale, 1); sp.position.set(x, y, z); scene.add(sp); return sp;
  };
  function build() {
    const RS = town.RS, R = RS.R;
    // nền có màu theo vùng
    const W = Math.round(x1 - x0), D = Math.round(z1 - z0), geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, W, D); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + (x0 + x1) / 2, z = pos.getZ(i) + (z0 + z1) / 2; let reg = 'north'; try { reg = RS.regionAt(X2(x), Y2(z)); } catch (e) {}
      c.set(REGION_COL[reg] || '#d8cdb5'); if (Y2(z) > 690 && Y2(z) < 740 && X2(x) > 1572) c.set(REGION_COL.road);
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.03); col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap })); ground.position.set((x0 + x1) / 2, TOWN_Y, (z0 + z1) / 2); ground.receiveShadow = true; scene.add(ground);

    // tường các lớp học (chừa cửa ở cạnh có dw)
    const walls = new THREE.Group(); scene.add(walls); const H = 3.4, T = 0.3;
    const wall = (ax, az, bx, bz, color) => {
      const len = Math.hypot(bx - ax, bz - az); if (len < 0.2) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(bx - ax) || T, H, Math.abs(bz - az) || T), toon(color)); m.position.set((ax + bx) / 2, TOWN_Y + H / 2, (az + bz) / 2); m.castShadow = m.receiveShadow = true; walls.add(m);
      ctx.boxes.push({ x0: Math.min(ax, bx) - T / 2, x1: Math.max(ax, bx) + T / 2, z0: Math.min(az, bz) - T / 2, z1: Math.max(az, bz) + T / 2, top: TOWN_Y + H });
    };
    for (const [id, r] of Object.entries(R)) {
      if (!r.w || r.y + r.h < Y_MIN || r.y > Y_MAX) continue;
      const ax = X3(r.x), az = Z3(r.y), bx = X3(r.x + r.w), bz = Z3(r.y + r.h);
      if (r.walls) {
        const color = WALL_COL[id] || '#c9b99a', gap = 1.8, side = r.side || 'b', dx = r.dw ? X3(r.dw[0]) : (ax + bx) / 2, dz = r.dw ? Z3(r.dw[1]) : (az + bz) / 2;
        for (const s of ['t', 'b', 'l', 'r']) {
          const [px, pz, qx, qz] = s === 't' ? [ax, az, bx, az] : s === 'b' ? [ax, bz, bx, bz] : s === 'l' ? [ax, az, ax, bz] : [bx, az, bx, bz];
          if (s !== side) { wall(px, pz, qx, qz, color); continue; }
          if (s === 't' || s === 'b') { wall(px, pz, dx - gap, qz, color); wall(dx + gap, pz, qx, qz, color); }
          else { wall(px, pz, qx, dz - gap, color); wall(px, dz + gap, qx, qz, color); }
        }
      }
      if (r.name && r.w * S > 6) label(r.name, (ax + bx) / 2, TOWN_Y + (r.walls ? 5 : 3), (az + bz) / 2, r.walls ? 1 : 0.8);
    }
    // nhà ở (hộp + mái)
    for (const h of RS.HOUSES || []) {
      const ax = X3(h.x), az = Z3(h.y), w = h.w * S, d = h.h * S, hh = Math.max(2.4, Math.min(5, d * 0.6));
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), toon('#f3e7cf')); body.position.set(ax + w / 2, TOWN_Y + hh / 2, az + d / 2); body.castShadow = body.receiveShadow = true; walls.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, 1.6, 4), toon('#c0504d')); roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); roof.position.set(ax + w / 2, TOWN_Y + hh + 0.8, az + d / 2); walls.add(roof);
      ctx.boxes.push({ x0: ax, x1: ax + w, z0: az, z1: az + d, top: TOWN_Y + hh });
    }
    // cổng trường
    if (RS.GATE) { const gx = X3(RS.GATE[0]), gz = Z3(RS.GATE[1]); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4, 0.6), toon('#d8332a')); p.position.set(gx + s * 2.2, TOWN_Y + 2, gz); p.castShadow = true; scene.add(p); } const top = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.7, 0.7), toon('#f2c14e')); top.position.set(gx, TOWN_Y + 4.2, gz); scene.add(top); label('TRƯỜNG RUBIK', gx, TOWN_Y + 5.4, gz, 1.2); town.gate = [gx, gz]; }

    // cửa vào: vòng sáng nhỏ (InstancedMesh)
    town.doors = RS.doors().filter(d => d.y > Y_MIN && d.y < Y_MAX && d.x >= 0 && d.x <= X_MAX).map(d => ({ d, x: X3(d.x), z: Z3(d.y) }));
    const ring = new THREE.InstancedMesh(new THREE.RingGeometry(0.7, 0.95, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85, depthWrite: false }), town.doors.length);
    const o = new THREE.Object3D(); town.doors.forEach((q, i) => { o.position.set(q.x, TOWN_Y + 0.05, q.z); o.updateMatrix(); ring.setMatrixAt(i, o.matrix); }); scene.add(ring); town.ring = ring;
    // âm thanh từng khu (chỉ phát khi đến gần)
    const C = r => [X3(r.x + r.w / 2), Z3(r.y + r.h / 2)], Z = (file, r, o = {}) => { if (!r || !r.w) return; const [x, z] = C(r); ctx.addSoundZone(Object.assign({ file, x, y: TOWN_Y + 1.5, z, ref: Math.max(4, Math.min(12, r.w * S / 3)), vol: 0.7 }, o)); };
    const Sp = (files, r, o = {}) => { if (!r || !r.w) return; const [x, z] = C(r); ctx.addSoundSpot(Object.assign({ files, x, y: TOWN_Y + 2, z, ref: 8, vol: 0.6 }, o)); };
    // nhạc theo khu của thị trấn trường
    const M = (file, r, o = {}) => { if (!r || !r.w) return; const [x, z] = C(r); ctx.addMusicZone(Object.assign({ file, x, z, r: Math.max(r.w, r.h) * S * 0.6 + 8 }, o)); };
    ctx.addMusicZone({ file: 'bgm-school', x: X3(1000), z: Z3(380), r: 75 });                       // khu trường học
    M('bgm-town', R.dalat, { r: 60 }); M('bgm-market', R.lake); M('bgm-market', R.picnic); M('bgm-garden', R.flowerfield); M('bgm-garden', R.garden);
    M('bgm-farm', R.farm); M('bgm-explore', R.hills, { r: 70 }); M('bgm-explore', R.forest, { r: 70 }); M('bgm-temple', R.zen); M('bgm-home', R.rubikpark);
    Z('music-night', R.music, { vol: 0.5, ref: 5, when: 'day' });                                   // phòng nhạc: tiếng đàn piano
    for (const k of ['rubikyard', 'field', 'attend']) Z('amb-children', R[k], { when: 'school' });   // sân trường giờ ra chơi
    if (RS.GATE) ctx.addSoundZone({ file: 'amb-children', x: X3(RS.GATE[0] + 300), y: TOWN_Y + 1.5, z: Z3(RS.GATE[1]), ref: 8, vol: 0.6, when: 'school' });
    Z('amb-crowd', R.hall, { vol: 0.35, when: 'school' }); Z('amb-crowd', R.dalat, { vol: 0.4, when: 'day' }); Z('amb-crowd', R.picnic, { vol: 0.3, when: 'day' });
    for (const k of ['pond', 'lake', 'lotus']) { Z('amb-river', R[k], { vol: 0.6 }); Z('amb-crickets', R[k], { when: 'night' }); }
    if (R.hills) for (let i = 0; i < 4; i++) ctx.addSoundZone({ file: i ? 'amb-birds' : 'amb-river', x: X3(R.hills.x + R.hills.w * (i + 0.5) / 4), y: TOWN_Y + 4, z: Z3(R.hills.y + R.hills.h / 2), ref: 10, vol: 0.8, when: i ? 'day' : undefined });
    if (R.forest) for (let i = 0; i < 4; i++) { const x = X3(R.forest.x + R.forest.w * (i + 0.5) / 4), z = Z3(R.forest.y + R.forest.h / 2); ctx.addSoundZone({ file: 'amb-birds2', x, y: TOWN_Y + 5, z, ref: 10, vol: 0.7, when: 'day' }); ctx.addSoundZone({ file: 'amb-crickets', x, y: TOWN_Y + 1, z, ref: 10, vol: 0.6, when: 'night' }); }
    for (const k of ['flowerfield', 'garden']) Sp(['sfx-bee'], R[k], { every: [3, 7], when: 'day', ref: 6, vol: 0.5 });
    Sp(['sfx-sheep'], R.farm, { every: [5, 12] }); Sp(['sfx-dog'], R.farm, { every: [12, 25], vol: 0.5 }); Z('amb-birds', R.farm, { vol: 0.5, when: 'day' });
    Sp(['sfx-chirp'], R.rubikpark, { every: [5, 12], when: 'day' }); Sp(['sfx-chirp'], R.garden, { every: [6, 14], when: 'day' });
    for (let x = 200; x < X_MAX; x += 1200) { ctx.addSoundZone({ file: x % 2400 ? 'amb-wave1' : 'amb-wave2', x: X3(x), y: TOWN_Y, z: Z3(Y_MAX) + 1, ref: 7, vol: 0.9 }); ctx.addSoundSpot({ files: ['sfx-gull1', 'sfx-gull2'], x: X3(x), y: TOWN_Y + 8, z: Z3(Y_MAX) + 6, ref: 12, vol: 0.45, every: [10, 25], when: 'day' }); }
    ctx.addSoundZone({ file: 'amb-river', x: bridge.x, y: 0, z: (bridge.za + bridge.zb) / 2, ref: 6, vol: 0.7 });   // nước chảy dưới cầu
    // mặt đất dưới chân → tiếng bước chân
    const SURF = { rubik: 'wood', chess: 'wood', music: 'wood', hall: 'wood', office: 'wood', elec: 'wood', yard: 'stone', attend: 'stone', giantchess: 'stone', rubikpark: 'stone', skate: 'stone', patin: 'stone', basket: 'stone', road: 'stone', dalat: 'stone', art: 'stone', beach: 'sand', farm: 'mud', pond: 'mud', lake: 'mud', lotus: 'mud', ski: 'sand', north: 'grass' };
    const prevSurf = ctx.surfaceAt;
    ctx.surfaceAt = (x, z, y) => {
      if (Math.abs(x - bridge.x) < bridge.w && z < bridge.za && z > bridge.zb) return 'wood';
      if (x > x0 && x < x1 && z > z0 && z < z1 && (y == null || y > TOWN_Y - 0.3)) { let r = 'yard'; try { r = RS.regionAt(X2(x), Y2(z)); } catch (e) {} return SURF[r] || 'grass'; }
      if (Math.hypot(x, z + 6) < 6.5) return 'stone'; // nền đền
      return prevSurf(x, z, y);
    };
    town.ready = true; ctx.toast && ctx.toast('🏫 Trường Rubik đã sẵn sàng ở phía bắc đảo — đi qua cầu hoặc bấm "Đến trường"');
  }

  // ---------- Mở cửa → bảng mini game của trường (iframe nhận chạm) ----------
  let modalOpen = false, nearDoor = null, nameTag = null, checkT = 0;
  const isModal = () => { try { const doc = fr.contentDocument; return !!doc.querySelector('.modal:not([hidden]), #v32Map:not([hidden]), #v40Quiz:not([hidden]), #v40Rep:not([hidden]), #v43J:not([hidden]), #lvlUp:not([hidden])') || !!(doc.querySelector('#v40Coach') && doc.querySelector('#v40Coach').offsetParent); } catch (e) { return false; } };
  town.enter = q => { if (!town.RS) return; ctx.sfx && ctx.sfx('ok'); town.RS.enterDoor(q.d); checkT = 0; };
  town.menu = () => { if (!town.RS) { ctx.toast('Trường Rubik đang tải…'); return; } town.RS.btn2D('hMenu'); checkT = 0; };
  town.goSchool = () => { if (!town.gate) { ctx.toast('Trường Rubik đang tải…'); return; } ctx.player.teleport(town.gate[0], town.gate[1] + 6); ctx.player.pos.y = TOWN_Y; ctx.toast('🏫 Chào mừng đến Trường Rubik!'); };

  // ---------- Học sinh, thầy cô, khách: lấy vị trí từ mô phỏng của trường ----------
  // (trang phục theo vai trò, pool, hoạt ảnh, tên trên đầu → town-people.js)
  const people = createTownPeople(ctx, { X3, Z3, Y_MIN, TOWN_Y, POOL: ctx.lowEnd ? 14 : 24 });
  function updatePeople(dt) { if (town.RS) people(dt, town.RS); }

  // ---------- Mỗi khung hình ----------
  const hudSchool = document.getElementById('school');
  function update(dt, t) {
    if (town.ring) town.ring.material.opacity = 0.55 + 0.35 * Math.sin(t * 3);
    if (!town.RS) return;
    // giờ trong ngày theo đồng hồ trường (để giờ học, ngày/đêm khớp nhau)
    if (ctx.sky && typeof town.RS.clock === 'number') ctx.sky.state.hour = ((town.RS.clock / 60) % 24 + 24) % 24;
    // bảng mini game đang mở? → iframe nhận chạm, nhân vật đứng yên
    if ((checkT -= dt) <= 0) {
      checkT = 0.25; const m = isModal();
      if (m !== modalOpen) { modalOpen = m; fr.style.pointerEvents = m ? 'auto' : 'none'; ctx.player.frozen = m; document.body.classList.toggle('rs-modal', m); if (!m) { fr.blur(); window.focus(); } }
      try { const d = fr.contentDocument, per = d.getElementById('hudPeriod').textContent; ctx.schoolHours = !/Ngoài giờ|Nghỉ|Tối|Đêm/i.test(per); if (hudSchool) hudSchool.textContent = `${d.getElementById('hudClock').textContent} · ${per}`; } catch (e) {}
    }
    // cửa gần nhất
    const p = ctx.player.pos; let best = null, bd = 2.2;
    for (const q of town.doors) { const d = Math.abs(q.x - p.x) + Math.abs(q.z - p.z); if (d < bd) { bd = d; best = q; } }
    if (best) ctx.offer('🚪 ' + best.d.n.split('·')[0].trim(), () => town.enter(best), 2);
    if (best !== nearDoor) { nearDoor = best; if (nameTag) { scene.remove(nameTag); nameTag = null; } if (best) nameTag = label(best.d.n, best.x, TOWN_Y + 2.6, best.z, 0.8); }
    updatePeople(dt);
  }
  ctx.school = town;
  return Object.assign(town, { update });
}
