// fishing.js — CÂU CÁ 3D ngay trong thế giới: đứng trên bờ (ao hồ, sông suối, biển) hoặc NGỒI TRÊN THUYỀN (vehicles.js, chỉ đọc trạng thái).
//   Giữ để lấy đà → thả tay quăng cần (dây cong + phao) → chờ cá rỉa (đừng kéo vội!) → phao chìm: chạm ngay → giữ căng dây
//   (giữ = cuộn dây, thả khi dây đỏ) → thẻ cá (tên Việt, tên khoa học, nơi sống, điều thú vị) → Thả về nước 🌱 hoặc Giữ lại.
//   27 loài theo 4 vùng nước, giờ, thời tiết (fish-data.js), cá bơi thật dưới nước, rác nhựa vớt lên. Sổ tay ngư dân lưu localStorage.
// Key: 'fishing' (bờ, tự tìm mép nước gần nhất) · 'fishing-boat' (trên thuyền: biển gần bờ / biển xa theo khoảng cách tới đất liền).
import * as THREE from 'three';
import { PHI, FIB, TAU, clamp, lerp, damp, rnd, pick, store, hud, tapper, sfx, preRender, lockWorld, textSprite } from './kit.js';
import { FISH, ZONES, RARITY, RAR_COL, TRASH, byId, weightKg, rollFish, timeText, wxText } from './fish-data.js';
import { makeFish } from './fish-mesh.js';

const BOOK = 'fishbook';
const POND = new THREE.Color('#3fa2d4'), CREEK = [new THREE.Color('#5fc8d8'), new THREE.Color('#8fe0ea')];

function start(ctx, opts = {}) {
  const { scene, terrain, camera } = ctx, pl = ctx.player, S = sfx(ctx), wantBoat = !!opts.boat;
  const quit = () => (opts.onExit || opts.exit || opts.close || (() => self.dispose()))();
  const H = hud('🎣 Câu cá', quit), inp = tapper(document.body), unlock = lockWorld(ctx);
  const book = store.get(BOOK, { f: {}, eco: 0, trash: 0, n: 0 });
  const saveBook = () => store.set(BOOK, book);
  const group = new THREE.Group(); scene.add(group);
  let clock = 0;

  // ---------- Nước: ao hồ (mặt nước của thị trấn), suối (dải màu nước), biển (dưới mực nước 0) ----------
  const sup = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 9) : -99);
  const seaY = (x, z) => -0.02 + Math.sin(clock * 1.6 + x * 0.35) * 0.06 + Math.sin(clock * 1.1 + z * 0.42) * 0.05;   // cùng công thức sóng với vehicles.js
  const cands = [];
  scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes.color || o.parent === group) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox; if (b.max.y - b.min.y < 0.6 && b.max.y < 6) cands.push(o);
  });
  const ray = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3(), _col = new THREE.Color();
  ray.far = 12;
  // trả về { z: vùng, y: mặt nước } hoặc null
  function waterAt(x, z) {
    _o.set(x, 7, z); ray.set(_o, DOWN); const hit = ray.intersectObjects(cands, false)[0];
    if (hit && hit.face) {
      const m = hit.object.material, c = hit.object.geometry.attributes.color;
      if (m && m.transparent && m.color && Math.abs(m.color.r - POND.r) + Math.abs(m.color.g - POND.g) + Math.abs(m.color.b - POND.b) < 0.04) return { z: 'ao', y: hit.point.y + 0.01 };
      _col.fromBufferAttribute(c, hit.face.a);
      if (CREEK.some(k => Math.abs(k.r - _col.r) + Math.abs(k.g - _col.g) + Math.abs(k.b - _col.b) < 0.05)) return { z: 'song', y: hit.point.y + 0.01 };
      if (hit.point.y > 0.3) return null;   // sàn, đường, sân trên mặt nước
    }
    if (sup(x, z) < -0.3) return { z: 'sea', y: null };
    return null;
  }
  const seaZone = (x, z) => { for (const r of [8, 13, 21, 34]) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; if (sup(x + Math.cos(a) * r, z + Math.sin(a) * r) > 0) return 'gan'; } return 'xa'; };

  // ---------- Chọn chỗ câu ----------
  const boat = ctx.vehicles && ctx.vehicles.riding === 'boat';
  let dir = pl.rot, spot = null, zone = 'gan';
  const fwd = a => [Math.sin(a), Math.cos(a)];
  function scan(px, pz, base, maxD = 13) {
    for (const da of [0, 0.3, -0.3, 0.6, -0.6, 0.95, -0.95, 1.35, -1.35, 1.85, -1.85, 2.45, -2.45, Math.PI]) {
      const a = base + da, [fx, fz] = fwd(a);
      for (const d of [2, 3, 5, 8, maxD]) { const w = waterAt(px + fx * d, pz + fz * d); if (w) return { a, d, w }; }
    }
    return null;
  }
  if (boat) { zone = seaZone(pl.pos.x, pl.pos.z); spot = { a: dir, d: 0, w: { z: 'sea' } }; }
  else {
    spot = scan(pl.pos.x, pl.pos.z, dir);
    if (!spot) {   // chưa ở gần nước → tìm mép nước gần nhất (≤ 89 m) rồi đưa bạn tới đó
      let best = null;
      for (let r = 5; r <= 89 && !best; r += 4) for (let i = 0; i < 28 && !best; i++) {
        const a = i / 28 * TAU, x = pl.pos.x + Math.sin(a) * r, z = pl.pos.z + Math.cos(a) * r;
        if (!waterAt(x, z)) continue;
        for (let k = 1; k < 9; k++) { const sx = x - Math.sin(a) * k * 1.2, sz = z - Math.cos(a) * k * 1.2; if (!waterAt(sx, sz) && sup(sx, sz) > 0.05) { best = [sx, sz, a]; break; } }
      }
      if (best) { pl.teleport(best[0], best[1]); pl.setRot && pl.setRot(best[2]); spot = scan(best[0], best[1], best[2]); }
    }
    if (spot) { dir = spot.a; zone = spot.w.z === 'sea' ? seaZone(pl.pos.x + Math.sin(dir) * 8, pl.pos.z + Math.cos(dir) * 8) : spot.w.z; pl.setRot && pl.setRot(dir); }
  }
  if (!spot) { H.panel({ title: 'Không thấy mặt nước', html: '<p>Hãy đi tới gần ao, hồ, suối hoặc bờ biển rồi mở Câu cá nhé!</p>', buttons: [{ label: 'Đóng', cls: 'go', wide: true, fn: quit }] }); }
  const Z = ZONES[zone];
  H.title(`🎣 Câu cá · ${Z.icon} ${boat ? 'Trên thuyền · ' : ''}${Z.n}`);
  if (wantBoat && !boat && spot) H.msg('Lên thuyền ⛵ và chèo ra xa\nđể câu cá biển xa!', 3200);

  // ---------- Cần câu, dây, phao ----------
  const toonM = c => new THREE.MeshToonMaterial({ color: c });
  const rod = new THREE.Group(), segs = [];   // 3 đoạn, uốn cong theo lực căng
  { const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.42, 6).translate(0, 0.05, 0), toonM('#5a3a24')); rod.add(handle);
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10).rotateZ(Math.PI / 2).translate(0.05, 0.12, 0), toonM('#d8d8de')); rod.add(reel);
    let parent = rod, y = 0.26; const L = [0.8, 0.7, 0.6], R = [0.016, 0.011, 0.007];
    L.forEach((l, i) => { const s = new THREE.Group(); s.position.y = y; parent.add(s); const m = new THREE.Mesh(new THREE.CylinderGeometry(R[i] * 0.7, R[i], l, 5).translate(0, l / 2, 0), toonM(i === 2 ? '#f2f2f2' : '#2b4fa8')); s.add(m); segs.push(s); parent = s; y = l; });
    const tip = new THREE.Object3D(); tip.position.y = 0.6; segs[2].add(tip); rod.userData.tip = tip; }
  rod.traverse(o => { if (o.isMesh) o.castShadow = true; }); group.add(rod);
  const N = 34, lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#fbfbf4', transparent: true, opacity: 0.9 })); line.frustumCulled = false; group.add(line);
  const bob = new THREE.Group(); { const a = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6, 0, TAU, 0, Math.PI / 2), toonM('#ff3b2f')), b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6, 0, TAU, Math.PI / 2, Math.PI / 2), toonM('#ffffff')), s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 4).translate(0, 0.16, 0), toonM('#ff3b2f')); bob.add(a, b, s); }
  group.add(bob); bob.visible = false;
  // gợn sóng
  const ripples = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); m.userData.t = 9; group.add(m); return m; });
  let ri = 0; const ripple = (x, y, z, s = 1) => { const m = ripples[ri++ % ripples.length]; m.position.set(x, y + 0.02, z); m.userData.t = 0; m.userData.s = s; };
  const mark = textSprite('!', { size: 0.6, w: 128, h: 128, bg: '#ff3b2fee', font: 'bold 96px system-ui' }); mark.visible = false; group.add(mark);

  // ---------- Cá bơi quanh chỗ câu (loài của vùng, theo giờ & thời tiết) ----------
  const hour = () => (ctx.sky && ctx.sky.state.hour) || 12, wx = () => (ctx.weather && ctx.weather.type) || 'clear';
  const swim = [];
  const target = new THREE.Vector3(), tip = new THREE.Vector3(), bobP = new THREE.Vector3(), handP = new THREE.Vector3();
  const surfY = (x, z) => spot && spot.w.y != null ? spot.w.y : seaY(x, z);
  function spawnSwimmers(cx, cz) {
    for (const f of swim) group.remove(f.m); swim.length = 0;
    for (let i = 0; i < FIB[5]; i++) {   // 5 con
      const sp = rollFish(zone, hour(), wx()), L = rnd(sp.len[0], sp.len[1]) / 100, m = makeFish(sp, clamp(L, 0.22, 1.6));
      const f = { sp, m, a: rnd(0, TAU), r: rnd(1.3, 5), sp0: rnd(0.25, 0.55) * (Math.random() < 0.5 ? -1 : 1), cx, cz, d: rnd(0.22, 0.6) };
      if (waterAt(cx + Math.cos(f.a) * f.r, cz + Math.sin(f.a) * f.r)) { group.add(m); swim.push(f); }
    }
  }

  // ---------- Trạng thái ----------
  // aim → fly → wait (cá rỉa) → bite → fight → show | lost → aim
  let force = null, st = 'aim', t = 0, power = 0, pDir = 1, hooked = null, waitT = 0, nibbles = 0, nibT = 0, tension = 0.3, dist = 8, burst = 0, burstT = 2, slack = 0, lowT = 0, showFish = null, caught = 0;
  let flyFrom = new THREE.Vector3(), flyT = 0, flyDur = 0.8, rodPitch = 0.9, rodBend = 0;
  const powerBar = H.bar('calc(max(10px,env(safe-area-inset-top)) + 52px)', '#3fa36b'); powerBar.show(false);
  const tenBar = H.bar('calc(max(10px,env(safe-area-inset-top)) + 52px)', '#3fa36b'); tenBar.show(false);
  tenBar.el.style.background = 'linear-gradient(90deg,#d2553f99 0 8%,#0006 8% 21%,#3fa36b88 21% 76%,#f2c14e88 76% 86%,#d2553f99 86%)';
  const progBar = H.bar('calc(max(10px,env(safe-area-inset-top)) + 72px)', '#7fd1ff'); progBar.show(false);
  const bookBtn = H.action('📖 Sổ tay', () => openBook());
  const score = () => H.score(`🐟 ${book.n} · 🌱 ${book.eco}`);
  score();
  const aimTip = () => H.tip(`<b>Giữ</b> màn hình (hoặc Space) để lấy đà · <b>thả tay</b> để quăng cần.<br>${Z.icon} ${Z.n} · ${String(Math.floor(hour())).padStart(2, '0')} giờ · ${wx() === 'rain' || wx() === 'storm' ? 'trời mưa 🌧️' : 'trời ' + (wx() === 'clear' ? 'quang ☀️' : 'mây ⛅')}`);
  aimTip();

  function cast() {
    const d = lerp(3.5, boat ? 13 : 11, power), [fx, fz] = fwd(dir); let land = null;
    for (let k = d; k >= 2; k -= 0.5) { const x = pl.pos.x + fx * k, z = pl.pos.z + fz * k; if (boat || waterAt(x, z)) { land = [x, z]; break; } }
    if (!land) { H.msg('Quăng xa hơn chút nữa!', 1200); st = 'aim'; return; }
    target.set(land[0], 0, land[1]); target.y = surfY(land[0], land[1]);
    flyFrom.copy(tip); flyT = 0; flyDur = 0.5 + power * 0.5; st = 'fly'; bob.visible = true; S.tone(900, 0.3, 'sine', 0.05, 300);
    H.tip('Chờ cá cắn câu… Phao <b>nhấp nhô nhẹ</b> là cá đang rỉa — <b>đừng kéo vội!</b>'); powerBar.show(false);
  }
  function startWait() {
    st = 'wait'; waitT = rnd(2.5, 7.5); nibbles = Math.floor(rnd(0, 3)); nibT = 0;
    if (!force && zone !== 'ao' && zone !== 'song' && Math.random() < 0.08) hooked = { trash: pick(TRASH) };
    else { const sp = force ? byId[force] : rollFish(zone, hour(), wx(), book.n > 34 ? 0.5 : 0); force = null; hooked = { sp, L: Math.round(rnd(sp.len[0], sp.len[1]) * (Math.random() < 0.13 ? 1 : rnd(0.6, 1)) ) }; hooked.L = clamp(hooked.L, sp.len[0], sp.len[1]); }
    spawnSwimmers(target.x, target.z);
    // 1 con (loài sẽ cắn) bơi tới phao
    if (hooked.sp) { const m = makeFish(hooked.sp, clamp(hooked.L / 100, 0.25, 1.6)); group.add(m); hooked.m = m; hooked.a = rnd(0, TAU); hooked.r = 4.2; }
  }
  function lose(why) {
    st = 'lost'; t = 0; H.msg(why, 1600); S.bad(); tenBar.show(false); progBar.show(false); bob.visible = false; mark.visible = false;
    if (hooked && hooked.m) { hooked.flee = 1; }
    H.tip('');
  }
  function bite() { st = 'bite'; t = 0; mark.visible = true; S.plop(); ripple(bobP.x, bobP.y, bobP.z, 1.3); try { navigator.vibrate && navigator.vibrate(34); } catch (e) {} H.tip('<b>Chạm ngay!</b> Cá cắn câu rồi!'); }
  function startFight() {
    st = 'fight'; t = 0; mark.visible = false; tension = 0.42; lowT = 0; burst = 0; burstT = rnd(1, 2.5);
    const kg = hooked.sp ? weightKg(hooked.sp, hooked.L) : 0.1;
    hooked.pow = hooked.sp ? clamp(Math.log(kg + 1) * 0.55 + hooked.sp.rar * 0.13, 0.28, 1.7) : 0.15;
    dist = Math.hypot(bobP.x - pl.pos.x, bobP.z - pl.pos.z); hooked.d0 = dist;
    tenBar.show(true); progBar.show(true); S.ok();
    H.tip('<b>Giữ</b> để cuộn dây · <b>thả tay</b> khi vạch sang <span style="color:#ff8a7a">đỏ</span> kẻo đứt dây!');
  }
  function landed() {
    st = 'show'; tenBar.show(false); progBar.show(false); bob.visible = false; S.splash(); S.win(); H.tip('');
    if (hooked.trash) { book.trash++; book.eco += 2; saveBook(); score(); return trashCard(hooked.trash); }
    const sp = hooked.sp, L = hooked.L, kg = weightKg(sp, L), rec = book.f[sp.id] || (book.f[sp.id] = { c: 0, best: 0, rel: 0 }), first = !rec.c;
    rec.c++; book.n++; caught++; const pb = L > rec.best; if (pb) rec.best = L; saveBook(); score();
    if (hooked.m) group.remove(hooked.m);
    showFish = makeFish(sp, sp.shape === 'ray' ? 0.36 : 0.52); group.add(showFish);
    const small = L < sp.min, protect = sp.min >= 99;
    const html = `<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:4px"><span style="background:${RAR_COL[sp.rar]};color:#fff;border-radius:10px;padding:2px 8px;font:800 12px system-ui">${RARITY[sp.rar]}</span>${first ? '<span style="background:#3fa36b;color:#fff;border-radius:10px;padding:2px 8px;font:800 12px system-ui">Loài mới!</span>' : ''}${pb && !first ? '<span style="background:#f0a23a;color:#fff;border-radius:10px;padding:2px 8px;font:800 12px system-ui">Kỷ lục mới!</span>' : ''}</div>
      <p style="margin:0;font-style:italic;opacity:.7">${sp.sci}</p>
      <p style="font:900 18px system-ui;margin:6px 0">${L} cm · ${kg} kg</p>
      <p>🏠 <b>Nơi sống:</b> ${sp.home}<br>🕒 ${timeText(sp.time)} · ${wxText(sp.wx)}</p>
      <p style="background:#fff1d6;border-radius:12px;padding:8px 10px;text-align:left">💡 ${sp.fact}</p>
      ${protect ? '<p style="color:#2f7a4a"><b>Loài cần bảo vệ / cá cảnh — hãy thả lại nhé!</b></p>' : small ? `<p style="color:#2f7a4a"><b>Cá còn nhỏ (dưới ${sp.min} cm): thả lại để cá kịp lớn và đẻ trứng!</b></p>` : `<p style="opacity:.7">Cỡ nên giữ: từ ${sp.min} cm</p>`}`;
    const rel = () => { rec.rel++; book.eco += protect || small ? 3 : sp.rar >= 3 ? 2 : 1; saveBook(); score(); H.closePanel(); releaseAnim(); H.msg(protect || small ? '🌱 Tuyệt vời! Cá đã về nhà' : '🌱 Đã thả cá về nước', 1600); };
    const keep = () => { H.closePanel(); if (showFish) { group.remove(showFish); showFish = null; } H.msg(small ? 'Lần sau thả cá nhỏ nhé 🙂' : '🧺 Đã cho vào giỏ', 1400); toAim(); };
    const p = H.panel({ title: sp.n, html, color: RAR_COL[sp.rar], buttons: protect || small ? [{ label: '🌱 Thả về nước', sub: `+${3} điểm xanh`, cls: 'go wide', fn: rel }, { label: '📖 Sổ tay', fn: () => { rel(); openBook(); } }, { label: 'Giữ lại', sub: small ? 'không khuyến khích' : '', fn: protect ? rel : keep }].slice(0, protect ? 2 : 3) : [{ label: '🌱 Thả về nước', sub: `+${sp.rar >= 3 ? 2 : 1} điểm xanh`, cls: 'go', fn: rel }, { label: '🧺 Giữ lại', fn: keep }, { label: '📖 Sổ tay', wide: true, fn: () => { keep(); openBook(); } }] });
    lowPanel(p);
  }
  const lowPanel = p => { p.style.placeItems = 'end center'; p.style.background = 'linear-gradient(#0000 0 30%,#0a1a2a88)'; p.firstChild.style.maxHeight = '62vh'; };
  function trashCard(tr) {
    showFish = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.26, 8), new THREE.MeshToonMaterial({ color: '#8fd0e8', transparent: true, opacity: 0.85 })); group.add(showFish);
    lowPanel(H.panel({ title: '♻️ ' + tr.n, color: '#3fa36b', html: `<p>${tr.t}</p><p><b>+2 điểm xanh 🌱</b></p>`, buttons: [{ label: 'Bỏ vào thùng rác', cls: 'go wide', fn: () => { H.closePanel(); group.remove(showFish); showFish = null; toAim(); } }] }));
  }
  let relT = -1;
  function releaseAnim() { relT = 0; }
  function toAim() { st = 'aim'; t = 0; hooked = null; bob.visible = false; aimTip(); for (const f of swim) group.remove(f.m); swim.length = 0; }

  // ---------- Sổ tay ngư dân ----------
  function openBook() {
    const got = FISH.filter(f => book.f[f.id]).length;
    let html = `<p>Đã gặp <b>${got}/${FISH.length}</b> loài · bắt ${book.n} lần · 🌱 ${book.eco} điểm xanh · ♻️ ${book.trash} rác đã vớt</p>`;
    for (const [k, Zn] of Object.entries(ZONES)) {
      html += `<h3 style="margin:12px 0 4px;font:900 15px system-ui;text-align:left">${Zn.icon} ${Zn.n}</h3>`;
      for (const f of FISH.filter(f => f.z === k)) {
        const r = book.f[f.id];
        html += r ? `<details style="text-align:left;background:#fff1d6;border-radius:12px;margin:5px 0;padding:7px 10px"><summary style="font:800 14px system-ui;cursor:pointer"><span style="color:${RAR_COL[f.rar]}">●</span> ${f.n} <small style="opacity:.6">×${r.c} · kỷ lục ${r.best} cm${r.rel ? ' · thả ' + r.rel : ''}</small></summary><p style="margin:6px 0 2px;font-style:italic;opacity:.7">${f.sci}</p><p style="margin:2px 0">🏠 ${f.home}</p><p style="margin:2px 0">💡 ${f.fact}</p></details>`
          : `<div style="text-align:left;background:#efe3cc;border-radius:12px;margin:5px 0;padding:7px 10px;font:700 14px system-ui;opacity:.75">❔ ??? <small>· ${RARITY[f.rar]} · ${timeText(f.time)} · ${wxText(f.wx)}</small></div>`;
      }
    }
    const back = st === 'show' ? null : () => H.closePanel();
    H.panel({ title: '📖 Sổ tay ngư dân', html, color: '#3d8fd9', buttons: [{ label: 'Đóng', cls: 'go wide', fn: () => { H.closePanel(); back; } }] });
  }

  // ---------- Camera + cần câu (gọi ngay trước khi vẽ: sau player.update) ----------
  const camP = new THREE.Vector3(), camL = new THREE.Vector3(), camInit = { v: false }, _v = new THREE.Vector3(), _h = new THREE.Vector3(), _q = new THREE.Quaternion();
  const bendQ = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  function frame() {
    const [fx, fz] = fwd(dir), p = pl.pos;
    // vị trí tay phải (xương handr) hoặc ước lượng
    const hero = pl.hero, hand = hero && hero.model.getObjectByName('handr');
    if (hand) hand.getWorldPosition(handP); else handP.set(p.x + Math.cos(dir) * 0.25, p.y + 0.9, p.z - Math.sin(dir) * 0.25);
    if (boat) handP.y = Math.max(handP.y, p.y + 0.55);
    rod.position.copy(handP);
    // hướng cần: chĩa về phía trước, ngóc lên theo rodPitch; uốn cong theo lực
    rod.rotation.set(0, 0, 0); rod.rotateY(dir); rod.rotateZ(-0.32); rod.rotateX(rodPitch);
    const bend = st === 'fight' ? 0.18 + tension * 0.32 : st === 'bite' ? 0.2 : rodBend;
    segs[1].rotation.x = bend * 0.6; segs[2].rotation.x = bend;
    rod.updateMatrixWorld(true); rod.userData.tip.getWorldPosition(tip);
    // camera sau vai, nhìn ra mặt nước (khoảng cách theo φ)
    const lookAt = st === 'aim' || st === 'lost' ? _v.set(p.x + fx * 8, surfY(p.x, p.z) + 0.3, p.z + fz * 8) : _v.copy(bobP).lerp(p, 0.2).setY(bobP.y);
    if (st === 'show' && showFish) lookAt.set(p.x + fx * 2, p.y + 1.3, p.z + fz * 2);
    const back = boat ? 5.2 : 3.4, up = boat ? 3.2 : 2.8;
    const side = 1 / PHI;   // lệch vai phải
    _q.set(0, 0, 0, 1);
    const want = camL.clone(); want.copy(p).addScaledVector({ x: -fx, y: 0, z: -fz }, back); want.y = p.y + up; want.x += Math.cos(dir) * -side; want.z += -Math.sin(dir) * -side;
    // thân cây/nhà chắn giữa đầu nhân vật và camera → kéo camera vào trước vật cản (cam-occlude.js, đồ câu cá không tính)
    if (ctx.camOcc) { _h.set(p.x, p.y + 1.5, p.z); const d = _h.distanceTo(want), c = ctx.camOcc.clear(_h, want, group) - 1 / PHI ** 2; if (c < d) want.sub(_h).multiplyScalar(Math.max(c, 0.8) / d).add(_h); }
    if (!camInit.v) { camP.copy(want); camL.copy(lookAt); camInit.v = true; }
    camP.lerp(want, 1 - Math.exp(-dtLast * 5)); camL.lerp(lookAt, 1 - Math.exp(-dtLast * 4));
    camera.position.copy(camP); camera.lookAt(camL);
    // dây câu: từ đầu cần tới phao, võng xuống theo độ chùng
    const pos = lineGeo.attributes.position; line.visible = st !== 'aim' && st !== 'show' && st !== 'lost';
    if (line.visible) {
      const end = st === 'fly' ? bob.position : bobP, sag = st === 'fight' ? 0.05 + (1 - tension) * 0.4 : st === 'fly' ? 0.1 : 0.55 + slack;
      for (let i = 0; i < N; i++) { const s = i / (N - 1); _v.lerpVectors(tip, end, s); _v.y -= Math.sin(s * Math.PI) * sag * Math.min(1, tip.distanceTo(end) / 6) * (1 - s * 0.35); pos.setXYZ(i, _v.x, _v.y, _v.z); }
      pos.needsUpdate = true;
    }
    // cá đang trưng (trước camera)
    if (showFish) { camera.getWorldDirection(_v); const sp = showFish; sp.position.copy(camera.position).addScaledVector(_v, PHI); sp.position.y += 0.36; sp.rotation.set(0.12, clock * 0.9, 0);
      if (relT >= 0) { relT += dtLast; sp.position.lerp(bobP.set(target.x, target.y - 0.5, target.z), Math.min(1, relT * 1.2)); if (relT > 1) { relT = -1; group.remove(sp); showFish = null; ripple(target.x, target.y, target.z, 1.6); S.splash(); toAim(); } } }
  }
  let dtLast = 1 / 60;
  const unhook = preRender(ctx, frame);

  // ---------- Cập nhật ----------
  function update(dt) {
    dtLast = dt; clock += dt; t += dt; inp.tick(dt);
    const taps = inp.take(), held = inp.held, sw = inp.takeSwipe();
    if (H.open) { inp.held = false; }
    // gợn sóng
    for (const m of ripples) { const u = m.userData; if (u.t > 2) continue; u.t += dt; const k = u.t / 2; m.scale.setScalar((0.15 + k * 1.3) * u.s); m.material.opacity = 0.55 * (1 - k); }
    // cá bơi vòng
    for (const f of swim) {
      f.a += f.sp0 * dt / Math.max(1, f.r * 0.5); const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r;
      f.m.position.set(x, surfY(x, z) - f.d, z); f.m.rotation.y = Math.atan2(-Math.sin(f.a) * Math.sign(f.sp0), Math.cos(f.a) * Math.sign(f.sp0)) + f.m.userData.wag(clock);
    }
    if (st === 'aim') {
      rodPitch = damp(rodPitch, held ? -0.35 - power * 0.5 : 0.75, 10, dt);
      if (held && !H.open) { powerBar.show(true); power += pDir * dt * PHI * 0.8; if (power > 1) { power = 1; pDir = -1; } if (power < 0) { power = 0; pDir = 1; } powerBar.set(power); powerBar.color(power > 0.8 ? '#f0a23a' : '#3fa36b'); }
      else if (sw && power > 0 && !H.open) { rodPitch = 1.15; cast(); }
      else if (!held) { power = 0; pDir = 1; }
    } else if (st === 'fly') {
      flyT += dt; const k = Math.min(1, flyT / flyDur);
      bob.position.lerpVectors(flyFrom, target, k); bob.position.y += Math.sin(k * Math.PI) * (1.5 + power * 2.5) - 0 * k;
      rodPitch = damp(rodPitch, 0.95, 6, dt);
      if (k >= 1) { bobP.copy(target); S.plop(); ripple(target.x, target.y, target.z, 0.8); startWait(); }
    } else if (st === 'wait') {
      bobP.y = surfY(bobP.x, bobP.z) + Math.sin(clock * 2.1) * 0.012; bob.position.copy(bobP); rodPitch = damp(rodPitch, 0.85, 4, dt);
      waitT -= dt; slack = 0.1;
      const hm = hooked.m;
      if (hm) { hooked.r = Math.max(0.35, damp(hooked.r, waitT < 2 ? 0.35 : 2.2, 0.8, dt)); hooked.a += dt * 0.7; const x = bobP.x + Math.cos(hooked.a) * hooked.r, z = bobP.z + Math.sin(hooked.a) * hooked.r; hm.position.set(x, surfY(x, z) - 0.25, z); hm.rotation.y = Math.atan2(bobP.x - x, bobP.z - z) + hm.userData.wag(clock, 0.6); }
      if (nibbles > 0 && waitT < 1.6 + nibbles * 0.9) { nibT += dt; const dip = Math.max(0, Math.sin(nibT * 9)) * 0.04; bob.position.y -= dip; if (nibT > 0.8) { nibT = 0; nibbles--; ripple(bobP.x, bobP.y, bobP.z, 0.5); S.tone(520, 0.05, 'sine', 0.05); } }
      if (taps) { if (nibbles > 0 || waitT > 0.3) { if (waitT < 3) lose('Sớm quá! Cá giật mình bơi mất 🐟'); else H.msg('Kiên nhẫn… chờ phao chìm hẳn', 1300); } }
      else if (waitT <= 0) bite();
    } else if (st === 'bite') {
      const win = 1.1 - (hooked.sp ? hooked.sp.rar * 0.08 : 0);
      bob.position.set(bobP.x, bobP.y - 0.12 - Math.sin(t * 20) * 0.03, bobP.z); mark.position.set(bobP.x, bobP.y + 0.8 + Math.sin(t * 12) * 0.05, bobP.z);
      if (taps || held) startFight(); else if (t > win) lose('Chậm tay mất rồi! Cá nhả mồi 🎣');
    } else if (st === 'fight') {
      const P = hooked.pow;
      burstT -= dt; if (burstT <= 0) { if (burst > 0) { burst = 0; burstT = rnd(1.2, 3.2) / P; } else { burst = rnd(0.5, 1.1) * Math.min(1.4, P); burstT = burst; S.splash(); try { navigator.vibrate && navigator.vibrate(21); } catch (e) {} } }
      const pull = burst > 0 ? 2.4 : 1;
      if (held) { tension += (0.28 + P * 0.36 * pull) * dt; if (tension < 0.9) dist -= (1.6 - (burst > 0 ? 1.1 : 0)) * dt * (1.2 - P * 0.25); S.reel && Math.random() < dt * 21 && S.reel(); }
      else { tension -= (0.5 + (burst > 0 ? -0.3 : 0)) * dt; dist += P * (burst > 0 ? 1.3 : 0.35) * dt; }
      tension = Math.max(0, tension); dist = Math.min(dist, (hooked.d0 || 8) + 5);
      lowT = tension < 0.08 ? lowT + dt : 0;
      tenBar.set(tension); progBar.set(1 - (dist - 1.2) / Math.max(1, (hooked.d0 || 8) - 1.2));
      tenBar.color(tension > 0.86 ? '#d2553f' : tension > 0.76 ? '#f2c14e' : '#3fa36b');
      // cá bị kéo vào: phao/cá di chuyển về phía người câu, giãy khi bung sức
      const [fx, fz] = fwd(dir); const k = Math.max(1.2, dist);
      bobP.set(pl.pos.x + fx * k + Math.sin(clock * 3) * 0.6 * (burst > 0 ? 1.6 : 0.5), 0, pl.pos.z + fz * k + Math.cos(clock * 2.3) * 0.5 * (burst > 0 ? 1.6 : 0.5));
      bobP.y = surfY(bobP.x, bobP.z); bob.position.copy(bobP); bob.position.y -= 0.06;
      if (hooked.m) { const m = hooked.m; m.position.set(bobP.x, bobP.y - 0.15 + (burst > 0 ? Math.abs(Math.sin(clock * 9)) * 0.25 : 0), bobP.z); m.rotation.y = Math.atan2(fx, fz) + Math.PI + m.userData.wag(clock, burst > 0 ? 2.4 : 1.2); }
      if (Math.random() < dt * (burst > 0 ? 8 : 2)) ripple(bobP.x, bobP.y, bobP.z, burst > 0 ? 0.9 : 0.5);
      if (tension >= 1) lose('Đứt dây! Lần sau nhớ thả tay khi dây căng đỏ');
      else if (lowT > 2.6) lose('Dây chùng quá, cá tuột lưỡi câu!');
      else if (dist <= 1.25) landed();
    } else if (st === 'lost') {
      rodPitch = damp(rodPitch, 0.75, 4, dt);
      if (hooked && hooked.m) { const m = hooked.m; m.position.y -= dt * 0.6; m.position.x += Math.sin(m.rotation.y) * dt * 3; m.position.z += Math.cos(m.rotation.y) * dt * 3; if (t > 1.5) group.remove(m); }
      if (t > 1.6) toAim();
    } else if (st === 'show') rodPitch = damp(rodPitch, 0.6, 4, dt);
  }

  const self = {
    update,
    dispose() { unhook(); inp.dispose(); H.dispose(); unlock(); scene.remove(group); group.traverse(o => { if (o.geometry && !o.geometry.userData.keep) { /* hình cá dùng chung cache */ } if (o.material && o.material !== undefined && o.isLine) o.material.dispose(); }); lineGeo.dispose(); },
    get state() { return st; }, get zone() { return zone; }, // gỡ lỗi
    _dbg: { water: waterAt, force: id => force = id, cast: p => { power = p; cast(); }, bite: () => { waitT = 0; nibbles = 0; }, fight: () => startFight(), land: () => { dist = 1; }, book: openBook },
  };
  return self;
}

export const fishing = {
  fishing: { name: 'Câu cá', start: (ctx, o = {}) => start(ctx, o) },
  'fishing-boat': { name: 'Câu cá trên thuyền', start: (ctx, o = {}) => start(ctx, Object.assign({ boat: true }, o)) },
};
