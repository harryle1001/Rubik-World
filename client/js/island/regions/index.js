// regions/index.js — NỐI 4 VÙNG MỚI VÀO THẾ GIỚI (gọi sau academy + train: bọc chuỗi heightAt/groundExtra/zoneAt/swimZone).
// - Độ cao giải tích (plan.js) → người, thuyền, máy bay, dù, vật lý đi được ngay cả khi vùng chưa dựng hình.
// - Đường nối: 🌉 cầu (Bắc: Núi Tuyết, Tây: Làng Cổ) · ⛵ thuyền (Nam: San Hô, Đông: Tương Lai) · ✈️ đường băng Tương Lai.
// - Tải theo chunk (khoảng cách tới mép vùng): t1 mặt đất + công trình < 377 m (dỡ > 610) · t2 cây/đồ vật < 144 m (dỡ > 233).
// - Khám phá: mỗi vùng 3 điểm 📖 (bài học + câu đố, ⭐) → huy hiệu vùng; bản đồ M vẽ thêm các vùng (ctx.mapLayers).
import * as THREE from 'three';
import { REGIONS, regionAt, PEAK, FUT_Y, FUT_RW } from './plan.js';
import { BUILDERS, sign } from './build.js';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { loadModel } from '../models.js';
import { KIT, kitSize } from '../kit.js';
import { ISLAND_R, MEADOWS, ACADEMY } from '../layout.js';
import { TOWERS, CASTLE_L, BASE_Y, toWorld as acadW, R_BOUND } from '../academy/plan.js';

const T1_IN = 377, T1_OUT = 610, T2_IN = 144, T2_OUT = 233, SEEN_KEY = 'rs.regions.seen';

export function createRegions(ctx) {
  const { terrain, scene, player } = ctx, W = 0;
  const base = terrain.heightAt;
  // ---------- độ cao ----------
  terrain.heightAt = (x, z) => { for (const R of REGIONS) { const dx = x - R.c[0], dz = z - R.c[1]; if (dx * dx + dz * dz < (R.span + 21) ** 2) return Math.max(base(x, z), R.h(dx, dz)); } return base(x, z); };
  const H = terrain.heightAt;

  // ---------- đường nối: tìm bờ đảo chính và bờ vùng trên đường thẳng tâm → tâm vùng ----------
  const links = [], decks = [];
  for (const R of REGIONS) {
    const L0 = Math.hypot(...R.c), D = [R.c[0] / L0, R.c[1] / L0], N = [-D[1], D[0]];
    let rA = ISLAND_R + 60; while (rA > 100 && base(D[0] * rA, D[1] * rA) < 1.2) rA -= 0.5;            // bờ đảo chính (từ biển đi vào)
    let rB = 0; while (rB < R.R + 30 && R.h(-D[0] * rB, -D[1] * rB) > 1.2) rB += 0.5;                     // bờ vùng (từ tâm vùng đi ra phía đảo chính)
    const A = [D[0] * rA, D[1] * rA], B = [R.c[0] - D[0] * rB, R.c[1] - D[1] * rB];
    links.push({ R, D, N, A, B, type: R.link });
  }
  // CẦU: mặt cầu cong nhẹ (vồng 5 m giữa nhịp), rộng 5 m, lan can, trụ mỗi 13 m, đèn mỗi 21 m
  const BR_W = 2.5;
  for (const k of links.filter(q => q.type === 'bridge')) {
    const a0 = Math.hypot(...k.A) - 8, a1 = Math.hypot(...k.B) + 8, y0 = H(k.D[0] * a0, k.D[1] * a0) + 0.1, y1 = H(k.D[0] * a1, k.D[1] * a1) + 0.1;
    const deckY = a => { const t = (a - a0) / (a1 - a0); return y0 + (y1 - y0) * t + 5 * Math.sin(Math.PI * t); };
    decks.push({ k, a0, a1, w: BR_W, y: deckY });
    const b = new Batch(), glow = new Batch(), len = a1 - a0;
    for (let s = 0; s < len; s += 8) {
      const e = Math.min(len, s + 8.2), ya = deckY(a0 + s), yb = deckY(a0 + e), ym = (ya + yb) / 2, sl = Math.atan2(yb - ya, e - s);
      b.add(new THREE.BoxGeometry(BR_W * 2, 0.4, e - s), '#bdb2a0', 0, ym - 0.2, (s + e) / 2, 0, -sl);
      for (const sd of [-1, 1]) b.add(new THREE.BoxGeometry(0.15, 0.15, e - s), '#a8744a', sd * (BR_W - 0.1), ym + 1, (s + e) / 2, 0, -sl);
    }
    for (let s = 0; s <= len; s += 13) { const y = deckY(a0 + s); for (const sd of [-1, 1]) b.cyl(sd * (BR_W - 0.1), y - 0.1, s, 0.08, 1.1, '#6e4a30', 5); if (H(k.D[0] * (a0 + s), k.D[1] * (a0 + s)) < 0.5) b.cyl(0, -8, s, 0.9, y + 7.6, '#948a7b', 8); }
    for (let s = 8; s <= len; s += 21) { const y = deckY(a0 + s); b.cyl(BR_W + 0.3, y, s, 0.07, 2.6, '#3a3344', 5); glow.box(BR_W + 0.1, BR_W + 0.5, y + 2.6, y + 3, s - 0.2, s + 0.2, '#ffe3a0'); }
    const g = new THREE.Group(); g.position.set(k.D[0] * a0, 0, k.D[1] * a0); g.rotation.y = Math.atan2(k.D[0], k.D[1]); g.name = 'region-bridge-' + k.R.id;
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true; g.add(m, new THREE.Mesh(glow.build(), mat('lampGlow')));
    const sp = sign(`🌉 Cầu ra ${k.R.name}`); sp.position.set(0, deckY(a0) + 4.2, 3); g.add(sp); scene.add(g);
  }
  // BẾN THUYỀN: cầu tàu ở đảo chính (từ bờ ra 21 m quá chỗ nước sâu) + cầu tàu ở vùng; thuyền CC0 (Kenney) chở khách qua lại
  const PIER_Y = 1.6, PW = 1.5, boats = [];
  for (const k of links.filter(q => q.type === 'boat')) {
    let rs = Math.hypot(...k.A); while (rs < 600 && base(k.D[0] * rs, k.D[1] * rs) > -1.6) rs += 0.5;
    const pa0 = Math.hypot(...k.A) - 3, pa1 = rs + 13, rB = Math.hypot(...k.B), pb0 = rB + 3, pb1 = rB - 21;   // pb: từ bờ vùng ra về phía đảo chính
    decks.push({ k, a0: pa0, a1: pa1, w: PW, y: () => PIER_Y }, { k, a0: pb1, a1: pb0, w: PW, y: () => PIER_Y });
    for (const [s0, s1, lbl] of [[pa0, pa1, `⛵ Bến thuyền ${k.R.name}`], [pb1, pb0, '⛵ Bến thuyền về đảo Rubik']]) {
      const b = new Batch(), len = s1 - s0; b.box(-PW, PW, PIER_Y - 0.25, PIER_Y, 0, len, '#a8744a');
      for (let s = 0; s <= len; s += 5) for (const sd of [-1, 1]) b.cyl(sd * (PW - 0.15), -3, s, 0.16, PIER_Y + 3.9, '#6e4a30', 6);
      for (const sd of [-1, 1]) b.box(sd * PW - 0.06, sd * PW + 0.06, PIER_Y + 0.8, PIER_Y + 0.9, 0, len, '#6e4a30');
      const g = new THREE.Group(); g.position.set(k.D[0] * s0, 0, k.D[1] * s0); g.rotation.y = Math.atan2(k.D[0], k.D[1]); g.name = 'region-pier-' + k.R.id;
      const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true; g.add(m);
      const sp = sign(lbl, 6.5); sp.position.set(0, PIER_Y + 3.4, s1 === pa1 ? 3 : len - 3); g.add(sp); scene.add(g);
    }
    const ends = [[k.D[0] * (pa1 + 4), k.D[1] * (pa1 + 4)], [k.D[0] * (pb1 - 4), k.D[1] * (pb1 - 4)]];
    const bt = { k, ends, at: 0, t: 0, dir: 0, mesh: null, yaw: Math.atan2(k.D[0], k.D[1]), land: [[k.D[0] * (pa1 - 2), k.D[1] * (pa1 - 2)], [k.D[0] * (pb1 + 2), k.D[1] * (pb1 + 2)]], len: Math.hypot(ends[1][0] - ends[0][0], ends[1][1] - ends[0][1]) };
    const name = k.R.id === 'future' ? 'boat_speed_a' : 'boat_sail_a';
    Promise.all([loadModel(KIT + name), kitSize(name)]).then(([m, sz]) => { if (!m) return; const s = 8 / Math.max(sz.x, sz.z); m.scale.setScalar(s); m.rotation.y = sz.x > sz.z ? Math.PI / 2 : 0; const g = new THREE.Group(); g.add(m); g.name = 'region-boat-' + k.R.id; scene.add(g); bt.mesh = g; });
    boats.push(bt);
  }
  // mặt đi thêm: cầu + cầu tàu (chỉ khi chân ở gần mặt cầu: bơi dưới gầm cầu không bị nhấc lên)
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99;
    for (const d of decks) { const a = x * d.k.D[0] + z * d.k.D[1]; if (a < d.a0 || a > d.a1) continue; const n = x * d.k.N[0] + z * d.k.N[1]; if (Math.abs(n) > d.w) continue; const yy = d.y(a); if (y === undefined || y > yy - 2.5) h = Math.max(h, yy); }
    return h;
  };
  // ĐƯỜNG BĂNG Thành phố Tương lai (máy bay cất/hạ ở đây — aircraft.js đọc ctx.runways)
  const FR = REGIONS.find(r => r.id === 'future');
  (ctx.runways = ctx.runways || []).push({ y: FUT_Y + 0.05, start: FR.toWorld(-FUT_RW.hl + 8, FUT_RW.v), yaw: Math.PI / 2, len: FUT_RW.hl * 2 - 13, name: 'đường băng Thành phố Tương lai',
    inside: (x, z) => { const [u, v] = FR.toLocal(x, z); return Math.abs(v - FUT_RW.v) < FUT_RW.hw + 21 && Math.abs(u) < FUT_RW.hl + 13; } });
  // vùng bay, vùng bơi, tên vùng
  (ctx.flyZones = ctx.flyZones || []).push((x, z) => {
    for (const R of REGIONS) { if (Math.hypot(x - R.c[0], z - R.c[1]) < R.R + 233) return true; const t = Math.max(0, Math.min(Math.hypot(...R.c), (x * R.c[0] + z * R.c[1]) / Math.hypot(...R.c))), L = Math.hypot(...R.c); if (Math.hypot(x - R.c[0] / L * t, z - R.c[1] / L * t) < 144) return true; }   // + hành lang bay 288 m
    return false;
  });
  const prevSwim = ctx.swimZone; ctx.swimZone = (x, z) => !!regionAt(x, z, 89) || (prevSwim ? prevSwim(x, z) : false);
  const prevZone = ctx.zoneAt; ctx.zoneAt = (x, z) => { const R = regionAt(x, z, 8); return R ? R.name : prevZone ? prevZone(x, z) : null; };
  // vật cản cao cho máy bay: tháp lâu đài Học viện (không nằm trong ctx.boxes) — aircraft.js nâng trần bay khi bay qua
  { const TW = [...TOWERS.map(([u, v, r, h, roof]) => [...acadW(u, v), r + 3, BASE_Y + h + roof]), [...acadW(CASTLE_L.astro.u, CASTLE_L.astro.v), CASTLE_L.astro.r + 3, BASE_Y + CASTLE_L.astro.h + CASTLE_L.astro.roof]];
    const prevTop = ctx.skyTop, AC = ACADEMY.c, RB = R_BOUND;
    ctx.skyTop = (x, z, m) => { let t = prevTop ? prevTop(x, z, m) : -99; if (Math.hypot(x - AC[0], z - AC[1]) < RB) for (const [tx, tz, r, top] of TW) if (Math.hypot(x - tx, z - tz) < r + m && top > t) t = top; return t; }; }
  // bãi đáp trúng đích khi nhảy khỏi máy bay (glider.js đọc ctx.chuteTargets)
  (ctx.chuteTargets = ctx.chuteTargets || []).push(
    { name: 'sân đình Làng Cổ', p: REGIONS[1].toWorld(34, -10) }, { name: 'quảng trường Thành phố Tương lai', p: FR.toWorld(0, 13) },
    { name: 'đảo San Hô', p: REGIONS[2].toWorld(-4, 4) }, { name: 'chân Núi Tuyết', p: REGIONS[0].toWorld(-21, 120) });
  if (MEADOWS[0]) ctx.chuteTargets.push({ name: 'vườn tròn đảo Rubik', p: [MEADOWS[0].x, MEADOWS[0].z] });

  // ---------- khám phá: điểm bài học + câu đố ----------
  let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} };
  const SP = []; for (const R of REGIONS) R.spots.forEach((s, i) => { const [x, z] = R.toWorld(s.u, s.v); SP.push({ R, s, key: R.id + i, x, z }); });
  const css = document.createElement('style');
  css.textContent = `#regCard{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#0a1a2acc;padding:13px}#regCard[hidden]{display:none}
#regCard .cd{width:min(100%,520px);max-height:calc(100% - 26px);overflow:auto;box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid #3f8a73;font-family:system-ui}
#regCard .tg{margin:0;font:700 13px system-ui;opacity:.62}#regCard h3{margin:5px 0 8px;font-size:21px}#regCard p{font-size:16px;line-height:1.5;margin:8px 0 13px}
#regCard .ch{display:grid;gap:8px}#regCard button{padding:13px;border-radius:13px;border:2px solid transparent;background:#efe3cc;font:700 16px system-ui;color:#3a2a1a;cursor:pointer;text-align:left}
#regCard button.ok{background:#c9efc9;border-color:#3fa36b}#regCard button.bad{background:#ffd0c8;border-color:#d2553f}#regCard .x{margin-top:13px;width:100%;text-align:center;background:#f0a23a}`;
  document.head.appendChild(css);
  const card = document.createElement('div'); card.id = 'regCard'; card.hidden = true; document.body.appendChild(card);
  const close = () => { card.hidden = true; document.body.classList.remove('rs-modal'); player.frozen = false; };
  function openSpot(q) {
    const { R, s } = q, done = R.spots.filter((_, i) => seen[R.id + i]).length;
    const order = s.a.map((t, i) => i).sort(() => Math.random() - 0.5);
    card.innerHTML = `<div class="cd"><p class="tg">${R.icon} ${R.name} · ${R.theme} · khám phá ${done}/3</p><h3>${s.icon} ${s.t}</h3><p>${s.x}</p><p><b>❓ ${s.q}</b></p><div class="ch">${order.map(i => `<button data-i="${i}">${s.a[i]}</button>`).join('')}</div><button class="x">Đóng</button></div>`;
    card.hidden = false; document.body.classList.add('rs-modal'); player.frozen = true; ctx.sfx && ctx.sfx('ui');
    card.querySelector('.x').onclick = close;
    card.querySelectorAll('.ch button').forEach(bt => bt.onclick = () => {
      if (card.dataset.lock === q.key) return; const ok = +bt.dataset.i === s.ok; bt.classList.add(ok ? 'ok' : 'bad');
      if (!ok) { ctx.toast('🤔 Chưa đúng — đọc lại đoạn trên rồi chọn tiếp nhé!', 3000); return; }
      card.dataset.lock = q.key; setTimeout(() => { card.dataset.lock = ''; }, 600);
      const first = !seen[q.key]; seen[q.key] = 1; save();
      const n = R.spots.filter((_, i) => seen[R.id + i]).length;
      if (first) ctx.reward ? ctx.reward(1, `${s.t} (${R.name})`) : null;
      if (first && n === 3) { ctx.reward && ctx.reward(2, `Huy hiệu ${R.name}`); ctx.toast(`🏅 <b>Huy hiệu ${R.icon} ${R.name}</b>! Em đã khám phá đủ 3/3 điểm. ${allDone() ? '<br>🌍 Đã khám phá <b>cả 4 vùng</b> — nhà thám hiểm thực thụ!' : 'Còn ' + (4 - badges()) + ' vùng nữa đang chờ.'}`, 7000); }
      else ctx.toast(`✅ Đúng rồi! ${first ? '+1 ⭐ · ' : ''}Khám phá ${R.icon} ${n}/3`, 3500);
      setTimeout(close, 900);
    });
  }
  const badges = () => REGIONS.filter(R => R.spots.every((_, i) => seen[R.id + i])).length, allDone = () => badges() === 4;

  // ---------- thuyền ----------
  let ride = null; const bv = new THREE.Vector3();
  function startBoat(bt, dir) {   // dir 1: đảo chính → vùng, -1: vùng → đảo chính
    if (ride || player.vehicle) return;
    const from = dir > 0 ? 0 : 1; bt.at = from; ride = { bt, dir, t: 0, dur: Math.max(13, bt.len / 21) };
    player.vehicle = { speed: 0, turn: 0, accel: 4, water: true, waterY: () => bv.y + 0.9, anim: 'sit', seat: 0, seatZ: 0, camAdd: 0, boat: true };
    ctx.toast(`⛵ Thuyền khởi hành ${dir > 0 ? 'tới ' + bt.k.R.icon + ' <b>' + bt.k.R.name + '</b>' : 'về <b>đảo Rubik</b>'} · khoảng ${Math.round(ride.dur)} giây`, 4000);
  }
  function updBoats(dt, t) {
    for (const bt of boats) {
      if (!bt.mesh) continue;
      let k = bt.at, yaw = bt.yaw + (bt.at ? Math.PI : 0);
      if (ride && ride.bt === bt) { ride.t += dt; const e = Math.min(1, ride.t / ride.dur), s = e * e * (3 - 2 * e); k = ride.dir > 0 ? s : 1 - s; yaw = bt.yaw + (ride.dir > 0 ? 0 : Math.PI); }
      const [x0, z0] = bt.ends[0], [x1, z1] = bt.ends[1], x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
      bv.set(x, W + Math.sin(t * 1.7 + x) * 0.12, z); bt.mesh.position.copy(bv); bt.mesh.rotation.set(Math.sin(t * 1.3) * 0.03, yaw, Math.sin(t * 1.1) * 0.04);
      if (ride && ride.bt === bt) {
        player.pos.x = x; player.pos.z = z; player.pos.y = bv.y + 0.9; player.root.position.copy(player.pos); player.setRot && player.setRot(yaw);
        if (ride.t >= ride.dur) { bt.at = ride.dir > 0 ? 1 : 0; const [lx, lz] = bt.land[bt.at]; player.vehicle = null; player.teleport(lx, lz, PIER_Y); ride = null; if (bt.at) greetRegion(bt.k.R, true); else ctx.toast('🏝️ Đã về <b>đảo Rubik</b>!', 3000); }
      }
    }
  }

  // ---------- tải / dỡ theo chunk ----------
  const live = REGIONS.map(R => ({ R, B: BUILDERS[R.id](R), t1: null, t2: null, t2p: null }));
  function dropKit(arr) { arr.then(lists => lists.flat().forEach(im => { im.parent && im.parent.remove(im); im.dispose && im.dispose(); })); }
  function stream() {
    const fly = (ctx.aircraft && ctx.aircraft.flying) || ctx.chute?.active || ride, p = fly ? ctx.camera.position : player.pos;
    for (const L of live) {
      const d = Math.max(0, Math.hypot(p.x - L.R.c[0], p.z - L.R.c[1]) - L.R.R);
      if (!L.t1 && d < T1_IN) { L.t1 = L.B.t1(); L.t1.group.position.set(L.R.c[0], 0, L.R.c[1]); L.t1.group.name = 'region-' + L.R.id; scene.add(L.t1.group); (ctx.boxes = ctx.boxes || []).push(...L.t1.boxes); }
      else if (L.t1 && d > T1_OUT) { scene.remove(L.t1.group); for (const b of L.t1.boxes) { const i = ctx.boxes.indexOf(b); if (i >= 0) ctx.boxes.splice(i, 1); } L.t1.group.traverse(o => { if (o.isMesh && !o.isInstancedMesh) o.geometry.dispose(); if (o.isSprite) o.material.map.dispose(); }); L.t1 = null; if (L.t2p) { dropKit(L.t2p); L.t2p = null; } }
      if (L.t1 && !L.t2p && d < T2_IN) L.t2p = Promise.all(L.B.t2(L.t1.group));
      else if (L.t2p && d > T2_OUT) { dropKit(L.t2p); L.t2p = null; }
    }
  }

  // ---------- chào khi tới vùng + bảng chỉ số (🌡️ núi tuyết, ⚡ thành phố) ----------
  const chip = document.createElement('div'); chip.style.cssText = 'position:fixed;left:50%;top:calc(max(12px,env(safe-area-inset-top)) + 178px);transform:translateX(-50%);z-index:26;max-width:min(89vw,610px);box-sizing:border-box;text-align:center;padding:5px 13px;border-radius:13px;background:#0f1a2acc;color:#f7ecd0;font:700 13px/1.4 system-ui;pointer-events:none;display:none';
  document.body.appendChild(chip);
  let greeted = null;
  function greetRegion(R, force) { if (greeted === R.id && !force) return; greeted = R.id; const n = R.spots.filter((_, i) => seen[R.id + i]).length; ctx.toast(R.greet + `<br>🧭 Khám phá: <b>${n}/3</b> điểm 📖 · ${R.theme}`, 7000); }
  const wind = () => (ctx.weather && ctx.weather.cur ? ctx.weather.cur.w || 0 : 0.3);
  let tick = 0, chipTxt = '';
  function update(dt) {
    const t = performance.now() / 1000;
    if (t - tick > 0.5) { tick = t; stream(); }   // theo đồng hồ thật (máy chậm vẫn tải kịp)
    for (const L of live) if (L.t1) L.t1.update(dt, t, wind());
    updBoats(dt, t);
    const pp = player.pos, inR = regionAt(pp.x, pp.z, 0);
    if (inR && !ctx.aircraft?.flying && !ctx.chute?.active && !ride && pp.y < H(pp.x, pp.z) + 21) greetRegion(inR); else if (!regionAt(pp.x, pp.z, 55)) greeted = null;
    // chip chỉ số
    let txt = '';
    if (inR && inR.id === 'snow') { const m = Math.max(0, pp.y), tC = 25 - m * 0.65; txt = `🌡️ ${tC.toFixed(0)} °C · ⛰ ${Math.round(m * 100).toLocaleString('vi')} m (núi thu nhỏ 1:100) · cứ lên 100 m lạnh đi 0,65 °C`; }
    else if (inR && inR.id === 'future') { const sun = Math.max(0, 1 - (ctx.sky?.state?.night || 0)), w = wind(); txt = `⚡ Gió: ${Math.round(6 * 1.5 * (0.2 + w * 0.8) * 10) / 10} MW · ☀️ Nắng: ${(40 * 0.4 * sun).toFixed(1)} kW${sun < 0.2 ? ' (đêm: dùng pin lưu trữ 🔋)' : ''}`; }
    if (txt !== chipTxt) { chipTxt = txt; chip.textContent = txt; } const showChip = !!chipTxt && !document.body.classList.contains('rs-modal') && !ctx.aircraft?.flying && !ctx.chute?.active; if ((chip.style.display === 'block') !== showChip) chip.style.display = showChip ? 'block' : 'none';
    // nút hành động
    if (player.vehicle || ride || ctx.chute?.active) return;
    for (const q of SP) { if (Math.abs(q.x - pp.x) > 5 || Math.abs(q.z - pp.z) > 5) continue; if (Math.hypot(q.x - pp.x, q.z - pp.z) < 4.2) { ctx.offer(`${q.s.icon} ${seen[q.key] ? '✔ ' : '📖 '}${q.s.t}`, () => openSpot(q), 8); break; } }
    for (const bt of boats) for (let e = 0; e < 2; e++) { const [lx, lz] = bt.land[e]; if (Math.hypot(lx - pp.x, lz - pp.z) < 8 && Math.abs(pp.y - PIER_Y) < 2.5) ctx.offer(e === 0 ? `⛵ Đi thuyền tới ${bt.k.R.icon} ${bt.k.R.name}` : '⛵ Đi thuyền về đảo Rubik', () => startBoat(bt, e === 0 ? 1 : -1), 8); }
    const S = live[0].t1 && live[0].t1.cable; if (S) { const [ax, az] = REGIONS[0].toWorld(...S.A), [tx, tz] = REGIONS[0].toWorld(...S.top);
      if (Math.hypot(ax - pp.x, az - pp.z) < 6) ctx.offer('🚡 Cáp treo lên đỉnh núi (đài khí tượng)', () => { player.teleport(tx, tz, PEAK); ctx.toast('🚡 Lên tới đỉnh <b>5 500 m</b> (thu nhỏ 1:100)! Lạnh quá: −11 °C, tuyết phủ trắng. Ghé 📡 đài khí tượng nhé!', 5000); }, 8);
      else if (Math.hypot(tx - pp.x, tz - pp.z) < 6 && pp.y > PEAK - 2) ctx.offer('🚡 Cáp treo xuống chân núi', () => player.teleport(ax + 4, az + 4), 8); }
  }

  // ---------- bản đồ M: ảnh nền từng vùng (vẽ 1 lần từ độ cao) + tên, điểm khám phá, cầu/đường thuyền ----------
  const thumbs = new Map();
  const thumb = R => { if (thumbs.has(R.id)) return thumbs.get(R.id); const S = R.span * 2, PX = 1, n = Math.round(S / 2 * PX), c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), img = g.createImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = -R.span + (i + 0.5) / n * S, v = -R.span + (j + 0.5) / n * S, h = R.h(u, v), o = (j * n + i) * 4;
      const col = h < -0.3 ? null : h < 1.3 ? [234, 217, 166] : R.id === 'snow' && h > 30 ? [244, 247, 250] : R.id === 'future' ? [205, 210, 216] : h > 13 ? [154, 146, 134] : [134, 194, 92];
      if (col) { img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; } else if (h > -3) { img.data[o] = 92; img.data[o + 1] = 190; img.data[o + 2] = 190; img.data[o + 3] = 200; } }
    g.putImageData(img, 0, 0); thumbs.set(R.id, c); return c; };
  (ctx.mapLayers = ctx.mapLayers || []).push(M => {
    const { g, sx, sy, zoom, text, bubble, icons } = M;
    g.lineWidth = Math.max(2, zoom * 2.5); g.lineCap = 'round';
    for (const k of links) {
      if (k.type === 'bridge') { g.strokeStyle = '#b07f4e'; g.setLineDash([]); g.beginPath(); g.moveTo(sx(k.A[0]), sy(k.A[1])); g.lineTo(sx(k.B[0]), sy(k.B[1])); g.stroke(); }
      else { g.strokeStyle = 'rgba(255,248,224,.85)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(sx(k.A[0]), sy(k.A[1])); g.lineTo(sx(k.B[0]), sy(k.B[1])); g.stroke(); g.setLineDash([]); const X = sx((k.A[0] + k.B[0]) / 2), Y = sy((k.A[1] + k.B[1]) / 2); bubble(X, Y, '⛵', 12); icons.push({ x: X, y: Y, t: `⛵ Thuyền: đảo Rubik ⇄ ${k.R.name}` }); }
    }
    for (const R of REGIONS) {
      const tb = thumb(R), S = R.span * 2; g.imageSmoothingEnabled = true; g.drawImage(tb, sx(R.c[0] - R.span), sy(R.c[1] - R.span), S * zoom, S * zoom);
      const X = sx(R.c[0]), Y = sy(R.c[1] - R.R - 8), fs = Math.round(Math.max(13, Math.min(24, zoom * 9))), n = R.spots.filter((_, i) => seen[R.id + i]).length;
      text(`${R.icon} ${R.name.toUpperCase()}`, X, Y, fs, '#fff3d6'); text(`${R.theme} · ${n}/3 ${n === 3 ? '🏅' : ''}`, X, Y + fs, Math.max(11, fs - 6));
      for (const q of SP.filter(q => q.R === R)) { const qx = sx(q.x), qy = sy(q.z); bubble(qx, qy, seen[q.key] ? '✔️' : q.s.icon, 12, seen[q.key] ? '#3bb54a' : '#e0a030'); icons.push({ x: qx, y: qy, t: `${q.s.icon} ${q.s.t} — ${R.name}${seen[q.key] ? ' ✔ đã khám phá' : ' · chưa khám phá'}` }); }
    }
    const r = ctx.runways ? ctx.runways.find(q => q.name.includes('Tương lai')) : null;
    if (r) { const X = sx(r.start[0] + 108), Y = sy(r.start[1]); bubble(X, Y, '✈️', 12); icons.push({ x: X, y: Y, t: '✈️ Đường băng Thành phố Tương lai' }); }
    { const X = sx(ACADEMY.c[0]), Y = sy(ACADEMY.c[1]); bubble(X, Y, '🏰', 16, '#8a6ad8'); text('HỌC VIỆN PHA LÊ', X, Y + 28, Math.round(Math.max(13, Math.min(24, zoom * 9))), '#fff3d6'); icons.push({ x: X, y: Y, t: '🏰 Học viện Pha Lê — đi thuyền đèn lồng, tàu Pha Lê hoặc máy bay' }); }
  });
  ctx.mapBounds = { x0: -900, x1: 900, z0: -900, z1: 900 };

  return { update, regions: REGIONS, links, boats, live, get riding() { return !!ride; }, open: openSpot, spots: SP, seen: () => seen };
}
