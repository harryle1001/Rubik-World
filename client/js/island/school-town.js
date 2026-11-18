// school-town.js — THỊ TRẤN TRƯỜNG RUBIK trong thế giới 3D (giai đoạn greybox: khối đơn giản để kiểm tra tỷ lệ, lối đi).
// Toàn bộ trường Rubik (client/school/) chạy ngầm trong 1 iframe: giờ học, 21 bạn & thầy cô, NPC, mọi mini game, cửa hàng,
// Coach Ru, nhiệm vụ… Module này đọc dữ liệu qua window.RS của iframe rồi dựng lại bằng 3D:
//   - Nền theo vùng (sân trường, sân bóng, bãi biển, nông trại…), tường các lớp có chừa cửa, nhà ở → buildGreybox()
//   - Cửa vào (77 cửa): đứng gần bấm E/nút → mở đúng mini game/bảng của trường → doors
//   - Học sinh, thầy cô, khách du lịch đi lại theo thời khóa biểu → updatePeople()
//   - Cầu nối đảo ↔ trường; nút "🏫 Đến trường"; giờ trong ngày theo đồng hồ của trường
// Toạ độ: 2D (x, y) pixel → 3D qua layout.js (bản đồ 2D cắt thành khối, đặt quanh đảo; cổng trường ở giữa thế giới).
import * as THREE from 'three';
import { toon, gradientMap } from './style.js';
import { createTownPeople } from './town-people.js';
import { S, TOWN_Y, BLOCKS, LAND, to3, to2, GATE3, SPAWN, rectDist, setHouses, onFlat, roadDist, ROAD_W, HOUSE_LOTS, lotToWorld, HOUSE_W, HOUSE_D, HOUSE_V1 } from './layout.js';
import { buildTownArchitecture } from './town-buildings.js';
import { doorKey } from './mg/host.js';
export { S, TOWN_Y };
export const Y_MIN = -600, Y_MAX = 1010;                    // phần đất liền của bản đồ 2D (đã cắt thành các khối trong layout.js)
const P = (x, y, hx) => to3(x, y, hx);               // 2D → 3D theo bố cục mới
export const REGION_COL = {   // nền các khu: dịu, ấm (docs/art-style.md) — không xám chết
  yard: '#e8d9bc', road: '#c2b6a4', beach: '#f3d6a8', north: '#8fcf6a', plaza: '#e3d3b4', rubik: '#f3e6cc', chess: '#f3e6cc', music: '#f3e6cc', hall: '#efdcbc', office: '#f3e6cc', elec: '#f3e6cc',
  attend: '#ead8b0', rubikyard: '#e6d2a6', field: '#6fb85a', giantchess: '#f1ead9', rubikpark: '#9fd477', pond: '#9fd477', lake: '#8fcf6a', lotus: '#93cf72',
  flowerfield: '#f6c7c0', bpad: '#bfdc94', skate: '#c7d3de', patin: '#c7d3de', basket: '#d9926a', ski: '#f4f8fb', art: '#ecd2a8', farm: '#b9905e',
  hills: '#7dbf5c', garden: '#f6c7c0', picnic: '#a3d77a', forest: '#5fa04c', dalat: '#d3b58e',
};

export function createSchoolTown(ctx) {
  const { scene, terrain } = ctx; ctx.boxes = ctx.boxes || [];
  const town = { RS: null, doors: [], ready: false };

  // ---------- Iframe chạy trường Rubik (trong suốt, chỉ hiện khi có bảng mini game) ----------
  const fr = document.createElement('iframe');
  fr.src = '/school/index.html?embed=1'; fr.title = 'Trường Rubik';
  fr.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:25;background:transparent;pointer-events:none;color-scheme:dark';
  fr.setAttribute('allowtransparency', 'true'); document.body.appendChild(fr);
  const waitRS = setInterval(() => { const w = fr.contentWindow; if (w && w.RS && w.RS.doors) { clearInterval(waitRS); town.RS = w.RS; town.win = w; embedCss(w); w.addEventListener('pointerdown', () => ctx.audio && ctx.audio.start()); build(); } }, 300);

  // banner sự kiện của trường (chữ pixel nhỏ, ở top 56 px đè hàng nút) → chữ to dễ đọc, nằm dưới hàng nút + thanh dưỡng khí (89 px)
  function embedCss(w) {
    try {
      const st = w.document.createElement('style');
      st.textContent = `html.rs-embed body #stage #toast.toast{top:calc(max(12px,env(safe-area-inset-top)) + 131px)!important;bottom:auto!important;width:max-content!important;font:700 17px/1.45 system-ui,sans-serif!important;padding:8px 21px!important;border-radius:21px!important;max-width:min(calc(100% - 24px),377px)!important;box-shadow:0 5px 13px #0005}`;
      w.document.head.appendChild(st);
    } catch (e) {}
  }

  // ---------- Mặt đất các khu: cao TOWN_Y (địa hình đã được làm phẳng bên dưới, xem terrain.js) ----------
  ctx.decks = ctx.decks || [];   // sàn gỗ/bến nổi: {x0,x1,z0,z1,y}
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99;
    for (const r of LAND) if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) { h = Math.max(h, TOWN_Y); break; }
    if (h < TOWN_Y && onFlat(x, z)) h = TOWN_Y;   // đường vòng, đường hướng tâm (cả cầu qua hồ), lô đất
    for (const d of ctx.decks) if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) h = Math.max(h, d.y);
    return h;
  };

  // ---------- Dựng greybox từ dữ liệu trường ----------
  const label = (text, x, y, z, scale = 1) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
    k.font = 'bold 44px system-ui'; const w = Math.min(500, k.measureText(text).width + 40);
    k.fillStyle = 'rgba(27,22,38,.75)'; k.beginPath(); k.roundRect((512 - w) / 2, 12, w, 72, 30); k.fill(); k.fillStyle = '#fff'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 49, 480);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(5.3 * scale, 1 * scale, 1); sp.position.set(x, y, z); scene.add(sp); (town.labels = town.labels || []).push(sp); return sp;
  };
  function build() {
    const RS = town.RS, R = RS.R;
    setHouses(RS.HOUSES);   // nhà ở 2D → lô đất có sân vườn trên vòng quanh trường (layout.js)
    // nền có màu theo vùng, mỗi khối 1 tấm
    const c = new THREE.Color(), gmat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
    for (const b of BLOCKS) {
      const [x0, z0, x1, z1] = b.r, W = Math.round((x1 - x0) / 1.5), D = Math.round((z1 - z0) / 1.5), geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, W, D); geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + (x0 + x1) / 2, z = pos.getZ(i) + (z0 + z1) / 2, q = to2(Math.min(x, x1 - 0.01), Math.min(z, z1 - 0.01)) || [0, 0]; let reg = 'north'; try { reg = q[0] < 0 ? 'plaza' : RS.regionAt(q[0], q[1]); } catch (e) {}
        c.set(REGION_COL[reg] || '#d8cdb5'); if (q[1] > 690 && q[1] < 740 && q[0] > 1572) c.set(REGION_COL.road);
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.03); col.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
      const ground = new THREE.Mesh(geo, gmat); ground.position.set((x0 + x1) / 2, TOWN_Y, (z0 + z1) / 2); ground.receiveShadow = true; scene.add(ground);
    }

    // va chạm tường các lớp (chừa cửa ở cạnh có dw) — phần nhìn thấy dựng ở town-buildings.js
    const H = 3.4, T = 0.3, gap = 1.8;
    const wall = (ax, az, bx, bz) => { if (Math.hypot(bx - ax, bz - az) < 0.2) return; ctx.boxes.push({ x0: Math.min(ax, bx) - T / 2, x1: Math.max(ax, bx) + T / 2, z0: Math.min(az, bz) - T / 2, z1: Math.max(az, bz) + T / 2, top: TOWN_Y + H }); };
    for (const [id, r] of Object.entries(R)) {
      if (!r.w || r.y + r.h < Y_MIN || r.y > Y_MAX) continue;
      const hx = r.x + r.w / 2, [ax, az] = P(r.x, r.y, hx), [bx, bz] = P(r.x + r.w, r.y + r.h, hx);
      if (r.walls) {
        const side = r.side || 'b', [dx, dz] = r.dw ? P(r.dw[0], r.dw[1], hx) : [(ax + bx) / 2, (az + bz) / 2];
        for (const s of ['t', 'b', 'l', 'r']) {
          const [px, pz, qx, qz] = s === 't' ? [ax, az, bx, az] : s === 'b' ? [ax, bz, bx, bz] : s === 'l' ? [ax, az, ax, bz] : [bx, az, bx, bz];
          if (s !== side) { wall(px, pz, qx, qz); continue; }
          if (s === 't' || s === 'b') { wall(px, pz, dx - gap, qz); wall(dx + gap, pz, qx, qz); }
          else { wall(px, pz, qx, dz - gap); wall(px, dz + gap, qx, qz); }
        }
      }
      else if (r.name && r.w * S > 6 && r.w * S < 140) label(r.name, (ax + bx) / 2, TOWN_Y + 3, (az + bz) / 2, 0.8);
    }
    // va chạm nhà ở
    // (nhà xoay theo vòng tròn → dùng 2 vòng tròn va chạm phủ nền nhà HOUSE_W × HOUSE_D)
    for (const L of HOUSE_LOTS) if (L.house) for (const u of [-HOUSE_W / 4, HOUSE_W / 4]) { const [x, z] = lotToWorld(L, u, HOUSE_V1 - HOUSE_D / 2); ctx.colliders.push({ x, z, r: HOUSE_W / 4 + 0.2 }); }
    town.gate = GATE3;
    // kiến trúc (lớp học, cổng, nhà, khu mở, 4 khu mới quanh đảo)
    const env = { P, S, Y: TOWN_Y, H, T, gap, Y_MIN, Y_MAX, win: town.win };
    town.arch = buildTownArchitecture(ctx, RS, env); town.info = env.infoBoard;

    // cửa vào: vòng sáng nhỏ (InstancedMesh)
    town.doors = RS.doors().filter(d => d.y > Y_MIN && d.y < Y_MAX && d.x >= -200 && d.x <= 10400).map(d => { const [x, z] = P(d.x, d.y); return { d, x, z }; });
    const ring = new THREE.InstancedMesh(new THREE.RingGeometry(0.7, 0.95, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85, depthWrite: false }), town.doors.length);
    const o = new THREE.Object3D(); town.doors.forEach((q, i) => { o.position.set(q.x, TOWN_Y + 0.05, q.z); o.updateMatrix(); ring.setMatrixAt(i, o.matrix); }); scene.add(ring); town.ring = ring;
    // âm thanh từng khu (chỉ phát khi đến gần)
    const C = r => P(r.x + r.w / 2, r.y + r.h / 2), Z = (file, r, o = {}) => { if (!r || !r.w) return; const [x, z] = C(r); ctx.addSoundZone(Object.assign({ file, x, y: TOWN_Y + 1.5, z, ref: Math.max(4, Math.min(12, r.w * S / 3)), vol: 0.7 }, o)); };
    const Sp = (files, r, o = {}) => { if (!r || !r.w) return; const [x, z] = C(r); ctx.addSoundSpot(Object.assign({ files, x, y: TOWN_Y + 2, z, ref: 8, vol: 0.6 }, o)); };
    // nhạc theo khu của thị trấn trường
    const M = (file, r, o = {}) => { if (!r || !r.w) return; const [x, z] = C(r); ctx.addMusicZone(Object.assign({ file, x, z, r: Math.max(r.w, r.h) * S * 0.6 + 8 }, o)); };
    { const [x, z] = P(1000, 380); ctx.addMusicZone({ file: 'bgm-school', x, z, r: 75 }); }                       // khu trường học
    M('bgm-town', R.dalat, { r: 60 }); M('bgm-market', R.lake); M('bgm-market', R.picnic); M('bgm-garden', R.flowerfield); M('bgm-garden', R.garden);
    M('bgm-farm', R.farm); M('bgm-explore', R.hills, { r: 70 }); M('bgm-explore', R.forest, { r: 70 }); M('bgm-temple', R.zen); M('bgm-home', R.rubikpark);
    Z('music-night', R.music, { vol: 0.5, ref: 5, when: 'day' });                                   // phòng nhạc: tiếng đàn piano
    for (const k of ['rubikyard', 'field', 'attend']) Z('amb-children', R[k], { when: 'school' });   // sân trường giờ ra chơi
    if (RS.GATE) { const [x, z] = P(RS.GATE[0] + 300, RS.GATE[1]); ctx.addSoundZone({ file: 'amb-children', x, y: TOWN_Y + 1.5, z, ref: 8, vol: 0.6, when: 'school' }); }
    Z('amb-crowd', R.hall, { vol: 0.35, when: 'school' }); Z('amb-crowd', R.dalat, { vol: 0.4, when: 'day' }); Z('amb-crowd', R.picnic, { vol: 0.3, when: 'day' });
    for (const k of ['pond', 'lake', 'lotus']) { Z('amb-river', R[k], { vol: 0.6 }); Z('amb-crickets', R[k], { when: 'night' }); }
    if (R.hills) for (let i = 0; i < 4; i++) { const [x, z] = P(R.hills.x + R.hills.w * (i + 0.5) / 4, R.hills.y + R.hills.h / 2); ctx.addSoundZone({ file: i ? 'amb-birds' : 'amb-river', x, y: TOWN_Y + 4, z, ref: 10, vol: 0.8, when: i ? 'day' : undefined }); }
    if (R.forest) for (let i = 0; i < 4; i++) { const [x, z] = P(R.forest.x + R.forest.w * (i + 0.5) / 4, R.forest.y + R.forest.h / 2); ctx.addSoundZone({ file: 'amb-birds2', x, y: TOWN_Y + 5, z, ref: 10, vol: 0.7, when: 'day' }); ctx.addSoundZone({ file: 'amb-crickets', x, y: TOWN_Y + 1, z, ref: 10, vol: 0.6, when: 'night' }); }
    for (const k of ['flowerfield', 'garden']) Sp(['sfx-bee'], R[k], { every: [3, 7], when: 'day', ref: 6, vol: 0.5 });
    Sp(['sfx-sheep'], R.farm, { every: [5, 12] }); Sp(['sfx-dog'], R.farm, { every: [12, 25], vol: 0.5 }); Z('amb-birds', R.farm, { vol: 0.5, when: 'day' });
    Sp(['sfx-chirp'], R.rubikpark, { every: [5, 12], when: 'day' }); Sp(['sfx-chirp'], R.garden, { every: [6, 14], when: 'day' });
    for (let x = 200; x < 2636; x += 600) { const [wx, wz] = P(x, 1000); ctx.addSoundZone({ file: x % 1200 ? 'amb-wave1' : 'amb-wave2', x: wx, y: TOWN_Y, z: wz + 2, ref: 7, vol: 0.9 }); ctx.addSoundSpot({ files: ['sfx-gull1', 'sfx-gull2'], x: wx, y: TOWN_Y + 8, z: wz + 8, ref: 12, vol: 0.45, every: [10, 25], when: 'day' }); }
    // mặt đất dưới chân → tiếng bước chân
    const SURF = { rubik: 'wood', chess: 'wood', music: 'wood', hall: 'wood', office: 'wood', elec: 'wood', yard: 'stone', attend: 'stone', giantchess: 'stone', rubikpark: 'stone', skate: 'stone', patin: 'stone', basket: 'stone', road: 'stone', dalat: 'stone', art: 'stone', beach: 'sand', farm: 'mud', pond: 'mud', lake: 'mud', lotus: 'mud', ski: 'sand', north: 'grass' };
    const prevSurf = ctx.surfaceAt;
    ctx.surfaceAt = (x, z, y) => {
      for (const d of ctx.decks) if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1 && (y == null || y > d.y - 0.3)) return 'wood';
      const q = to2(x, z); if (q && (y == null || y > TOWN_Y - 0.3)) { let r = 'yard'; try { r = q[0] < 0 ? 'yard' : RS.regionAt(q[0], q[1]); } catch (e) {} return SURF[r] || 'grass'; }
      if (LAND.some(r => rectDist(r, x, z) === 0) && (y == null || y > TOWN_Y - 0.3)) return 'stone';
      if (roadDist(x, z) < ROAD_W / 2 && (y == null || y > TOWN_Y - 0.3)) return 'stone';
      return prevSurf(x, z, y);
    };
    town.ready = true; ctx.toast && ctx.toast('🏫 Chào mừng đến Trường Rubik! Các khu vui chơi nằm quanh đảo — đi bộ khám phá nhé');
  }

  // ---------- Mở cửa → bảng mini game của trường (iframe nhận chạm) ----------
  let modalOpen = false, nearDoor = null, nameTag = null, checkT = 0;
  const isModal = () => { try { const doc = fr.contentDocument; return !!doc.querySelector('.modal:not([hidden]), #v32Map:not([hidden]), #v40Quiz:not([hidden]), #v40Rep:not([hidden]), #v43J:not([hidden]), #lvlUp:not([hidden])') || !!(doc.querySelector('#v40Coach') && doc.querySelector('#v40Coach').offsetParent); } catch (e) { return false; } };
  town.enter = q => { if (!town.RS) return; ctx.sfx && ctx.sfx('ok'); const k = doorKey(ctx, q.d); if (k && ctx.mg && ctx.miniGames[k] && ctx.mg.start(k, q)) return; town.RS.enterDoor(q.d); checkT = 0; };   // có bản 3D (mg/host.js) → mở 3D, không thì bảng 2D
  town.menu = () => { if (!town.RS) { ctx.toast('Trường Rubik đang tải…'); return; } town.RS.btn2D('hMenu'); checkT = 0; };
  town.goSchool = () => { ctx.player.teleport(SPAWN[0], SPAWN[1]); ctx.player.pos.y = TOWN_Y; ctx.toast('🏫 Chào mừng đến Trường Rubik!'); };

  // ---------- Học sinh, thầy cô, khách: lấy vị trí từ mô phỏng của trường ----------
  // (trang phục theo vai trò, pool, hoạt ảnh, tên trên đầu → town-people.js)
  const people = createTownPeople(ctx, { P, Y_MIN, Y_MAX, TOWN_Y, POOL: ctx.lowEnd ? 14 : 24 });
  function updatePeople(dt) { if (town.RS) people(dt, town.RS); }

  // ---------- Bảng thông tin tỷ lệ vàng & số π (quảng trường trước cổng) ----------
  let infoEl = null;
  function showInfo() {
    if (!infoEl) { infoEl = document.createElement('div'); infoEl.id = 'townInfo'; infoEl.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:31;max-width:min(92vw,560px);background:#fff6df;color:#3b2a1e;border:4px solid #7a5a2e;border-radius:18px;padding:18px 20px 14px;font:16px/1.5 system-ui;box-shadow:0 8px 30px #0008'; document.body.appendChild(infoEl); }
    infoEl.innerHTML = town.info.html + '<div style="text-align:center;margin-top:12px"><button style="font:800 15px system-ui;padding:8px 22px;border-radius:20px;border:2px solid #7a5a2e;background:#ffd36e">Hiểu rồi!</button></div>';
    infoEl.hidden = false; ctx.player.frozen = true; infoEl.querySelector('button').onclick = () => { infoEl.hidden = true; ctx.player.frozen = false; };
  }

  // ---------- Mỗi khung hình ----------
  const hudSchool = document.getElementById('school');
  function update(dt, t) {
    if (town.ring) town.ring.material.opacity = 0.55 + 0.35 * Math.sin(t * 3);
    if (town.arch) town.arch.update(ctx.player.pos, t, dt);
    if (town.labels) { const p = ctx.player.pos; for (const sp of town.labels) sp.visible = Math.abs(sp.position.x - p.x) + Math.abs(sp.position.z - p.z) < 70; }   // nhãn chữ chỉ hiện khi ở gần
    if (!town.RS) return;
    // giờ trong ngày theo đồng hồ trường (để giờ học, ngày/đêm khớp nhau)
    if (ctx.sky && ctx.sky.state.lock == null && typeof town.RS.clock === 'number') ctx.sky.state.hour = ((town.RS.clock / 60) % 24 + 24) % 24;
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
    if (town.info && Math.abs(town.info.x - p.x) + Math.abs(town.info.z - p.z) < 5) ctx.offer('📜 Đọc bảng φ & π', showInfo, 1);
    if (best !== nearDoor) { nearDoor = best; if (nameTag) { scene.remove(nameTag); town.labels.splice(town.labels.indexOf(nameTag), 1); nameTag = null; } if (best) nameTag = label(best.d.n, best.x, TOWN_Y + 2.6, best.z, 0.8); }
    updatePeople(dt);
  }
  ctx.school = town;
  return Object.assign(town, { update });
}
