// academy/interior/index.js — NỘI THẤT LÂU ĐÀI HỌC VIỆN PHA LÊ: 7 tầng đi lại được (−2 kho bí mật … 4 đỉnh tháp chính).
// · Không gian phép cao 1597 m trên đảo (plan.js): cửa phép ở Đại sảnh / cổng chính / ban công tháp thiên văn đưa ra vào (mờ dần 0,3 s).
// · Tải theo tầng: chỉ dựng + vẽ tầng đang đứng ± 1 (lõi giếng/tháp luôn hiện, các tầng xa thay bằng "bóng tầng" 1 mesh).
// · Mặt đi: ctx.groundExtra (sàn theo lưới 1 m, cầu thang, tháp xoắn, nhịp cầu thang bay) · va chạm: ctx.boxes chỉ của tầng đang đứng.
// · Cầu thang bay: chở người theo khi xoay, giữ trong lan can; rơi vào giếng → "phép lông vũ" làm chậm rơi.
// · API cho phần khác: ctx.academy.anchors / ctx.academy.interior (xem cuối file).
import * as THREE from 'three';
import { W, D, FH, OY, LV0, LV1, FLOORS, EXITS, MIRROR, ANCHORS, TOWERS, REG, ZERO } from './plan.js';
import { buildFloor, yOf, cellId, hasSlab, stairY, kindOf, doorsAt } from './build.js';
import { buildCore } from './core.js';
import { furnish } from './furnish.js';
import { placeKit } from '../../kit.js';
import { Batch } from '../geo.js';
import { stoneMaterial, lookChoice } from '../castle.js';

const LS = 'academy.secrets';
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { return []; } };
const save = v => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {} };
const SECRETS = Object.values(FLOORS).flatMap(f => f.secret || []);

/** opt: { OX, OZ (toạ độ thế giới của điểm (0, 0) mặt bằng), exitTo(id) → [x, z, y, yaw] } */
export function createInterior(ctx, opt) {
  const { player, scene } = ctx, { OX, OZ } = opt;
  const root = new THREE.Group(); root.name = 'academy-interior'; root.position.set(OX, 0, OZ);
  let stoneMat = null, glowMat = null, core = null, live = false;
  const floors = new Map(), attached = new Map(), builtCbs = [];
  const _occ = new THREE.Object3D(); let _flip = false;
  let cur = null, active = [], dummy = null, found = load(), warned = 0, feather = 0, lastIn = 0;
  const toLocal = (x, z) => [x - OX, z - OZ], toWorld = (x, z) => [x + OX, z + OZ];

  // ---------- điểm neo ----------
  const op = {}; for (let k = LV0; k <= LV1; k++) op[k] = doorsAt(k);
  const blockedByDoor = a => { if (a.kind !== 'painting') return false; const [w] = a.size || [2.6]; const m = op[a.k];
    const onX = Math.abs(a.z - Math.round(a.z)) < 0.5 && Math.abs(Math.sin(a.face)) < 0.5, L = Math.round(onX ? a.z : a.x), c = onX ? a.x : a.z;
    for (let i = Math.floor(c - w / 2 - 0.5); i < c + w / 2 + 0.5; i++) if (m.get(onX ? `x:${L}:${i}` : `z:${L}:${i}`)) return true; return false; };
  const anchors = ANCHORS.filter(a => FLOORS[a.k] && !blockedByDoor(a)).map(a => {
    const [x, z] = toWorld(a.x, a.z), y = yOf(a.k) + (a.kind === 'painting' ? 3.0 : 0);
    return Object.freeze({ ...a, level: a.k, floorName: FLOORS[a.k].name, roomName: (REG[a.room] || {}).name || a.room, pos: [x, y, z], local: [a.x, a.z] });
  });

  // ---------- dựng ----------
  // ánh sáng trong nhà: cộng thêm màu × uLift (đèn nến/đuốc khắp lâu đài) → ban đêm vẫn rõ, ban ngày bớt tối góc khuất
  const LIFT = { value: 0.2 };
  const lifted = (m, key) => { const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); sh.uniforms.uLift = LIFT; sh.fragmentShader = 'uniform float uLift;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * uLift;'); }; m.customProgramCacheKey = () => 'academy-int-' + key; m.needsUpdate = true; return m; };
  function ensureMats() { if (stoneMat) return; const look = lookChoice(); stoneMat = lifted(stoneMaterial(look), 'stone-' + look); glowMat = new THREE.MeshBasicMaterial({ vertexColors: true }); }
  const kitMats = new Map(), kitMat = m => { if (!kitMats.has(m)) kitMats.set(m, lifted(m.clone(), 'kit')); return kitMats.get(m); };
  function buildCoreOnce() {
    if (core) return; ensureMats();
    core = buildCore({ stoneMat, glowMat }); root.add(core.group); scene.add(root); live = true;
    root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  }
  function buildLevel(k) {
    if (floors.has(k)) return floors.get(k);
    const F = buildFloor(k, { stoneMat, glowMat }), B = { stone: new Batch(), glow: new Batch() }, y = yOf(k);
    const { kit } = furnish(k, y, B);
    const m1 = new THREE.Mesh(B.stone.build(), stoneMat), m2 = new THREE.Mesh(B.glow.build(), glowMat);
    for (const m of [m1, m2]) { m.matrixAutoUpdate = false; F.group.add(m); }
    for (const [name, list] of Object.entries(kit)) placeKit(F.group, name, list, { shadow: false }).then(ims => { for (const im of ims) { im.receiveShadow = false; im.userData.noCamOcc = true; if (!Array.isArray(im.material)) im.material = kitMat(im.material); } });
    F.group.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    for (const s of F.secrets) if (found.includes(s.def.id)) openSecret(s, true);
    F.group.visible = false; root.add(F.group); floors.set(k, F);
    for (const [id, obj] of attached) { const a = anchors.find(q => q.id === id); if (a && a.k === k) F.group.add(place(obj, a)); }
    for (const cb of builtCbs) try { cb(k, F.group, toLocalGroup); } catch (e) { console.warn(e); }
    return F;
  }
  const toLocalGroup = (x, z) => [x - OX, z - OZ];   // nhóm tầng nằm trong root (gốc = điểm (0,0) mặt bằng) → toạ độ con = toạ độ mặt bằng
  function place(obj, a) { obj.position.set(a.x, yOf(a.k) + (a.kind === 'painting' ? 3.0 : 0), a.z); obj.rotation.y = a.face; return obj; }
  function disposeAll() {
    for (const F of floors.values()) { F.group.traverse(o => { if (o.isMesh && !o.isInstancedMesh) o.geometry.dispose(); }); root.remove(F.group); }
    floors.clear(); setActive([]);
    if (core) { core.group.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); root.remove(core.group); core = null; }
    scene.remove(root); live = false; cur = null;
  }

  // ---------- va chạm theo tầng ----------
  function setActive(list) {
    const B = ctx.boxes = ctx.boxes || [];
    for (const b of active) { const i = B.indexOf(b); if (i >= 0) B.splice(i, 1); }
    if (dummy) { const i = B.indexOf(dummy); if (i >= 0) B.splice(i, 1); dummy = null; }
    const n0 = B.length + active.length;
    active = list.map(b => { const [x0, z0] = toWorld(b.x0, b.z0), [x1, z1] = toWorld(b.x1, b.z1); const w = { x0, x1, z0, z1, top: b.top, src: b }; return w; });
    B.push(...active);
    if (B.length === n0 && active.length) { dummy = { x0: 1e7, x1: 1e7 + 1, z0: 1e7, z1: 1e7 + 1, top: -1e9 }; B.push(dummy); }   // đổi số hộp → lưới va chạm (physics.js) dựng lại
  }
  const syncTops = () => { for (const w of active) w.top = w.src.top; };   // cổng phép / cửa bí mật đổi top tại chỗ

  // ---------- mặt đi ----------
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    const h0 = prevExtra ? prevExtra(x, z, y) : -99;
    if (!live || y === undefined || y < OY - 30) return h0;
    const [lx, lz] = toLocal(x, z); if (lx < -1 || lz < -1 || lx > W + 1 || lz > D + 1) return h0;
    const lim = y + 1.0, ix = Math.floor(lx), iz = Math.floor(lz); let best = -99;
    for (let k = Math.min(LV1, Math.floor((lim - OY) / FH)); k >= LV0; k--) if (yOf(k) <= lim && hasSlab(k, ix, iz)) { best = yOf(k); break; }
    for (let k = LV0; k <= LV1; k++) for (const s of FLOORS[k].stairs || []) { const h = stairY(s, lx, lz); if (h !== null && h <= lim && h > best) best = h; }
    const c = core && core.support(lx, lz, y); if (c !== null && c !== undefined && c > best) best = c;
    return Math.max(h0, best);
  };

  // ---------- cửa bí mật ----------
  function openSecret(s, instant) {
    if (s.open) return; s.open = true; s.box.top = -1e9; syncTops();
    if (!found.includes(s.def.id)) { found.push(s.def.id); save(found); }
    const shelf = s.def.type === 'shelf', p = s.pivot, r0 = p.rotation.y, y0 = p.position.y;
    if (instant) { if (shelf) p.rotation.y = r0 - Math.PI / 2 * 0.92; else p.position.y = y0 - 4.7; return; }
    const t0 = performance.now(); (function step() { const t = Math.min(1, (performance.now() - t0) / 1400), e = t * t * (3 - 2 * t); if (shelf) p.rotation.y = r0 - Math.PI / 2 * 0.92 * e; else p.position.y = y0 - 4.7 * e; if (t < 1) requestAnimationFrame(step); })();
    ctx.sfx && ctx.sfx('magic'); ctx.toast(`${s.def.toast} <br>🗝️ Đã tìm <b>${found.length}/${SECRETS.length}</b> lối bí mật.`, 6000);
  }

  // ---------- vào / ra ----------
  let fadeEl = null;
  function fade(fn) {
    if (!fadeEl) { fadeEl = document.createElement('div'); Object.assign(fadeEl.style, { position: 'fixed', inset: 0, background: '#0d0a14', opacity: 0, pointerEvents: 'none', transition: 'opacity .3s', zIndex: 40 }); document.body.appendChild(fadeEl); }
    fadeEl.style.opacity = 1; setTimeout(() => { fn(); setTimeout(() => { fadeEl.style.opacity = 0; }, 120); }, 300);
  }
  function go(k, x, z, face, yOff = 0) {
    buildCoreOnce(); for (const q of [k - 1, k, k + 1]) if (FLOORS[q]) buildLevel(q);
    const [wx, wz] = toWorld(x, z); player.teleport(wx, wz, yOf(k) + yOff); player.cam.yaw = face + Math.PI; player.snapCamera && player.snapCamera();
    stream(true);
  }
  const enter = (where = 'hall') => fade(() => { const e = EXITS.find(q => q.id === where) || EXITS[0]; const [x, z] = e.at; go(e.k, x + Math.sin(e.face) * 4.2, z + Math.cos(e.face) * 4.2, e.face); ctx.toast(`🏰 <b>${FLOORS[e.k].name}</b> · ${where === 'balcony' ? 'Tháp Chính — cầu thang xoắn xuống các tầng' : 'Sảnh trong lâu đài'}. Tìm <b>giếng cầu thang xoay</b> ở giữa và ${SECRETS.length} lối bí mật nhé!`, 6000); });
  const leave = id => fade(() => { const t = opt.exitTo(id); if (!t) return; player.teleport(t[0], t[1], t[2]); player.cam.yaw = t[3]; player.snapCamera && player.snapCamera(); setActive([]); cur = null; for (const F of floors.values()) F.group.visible = false; });

  // ---------- tải tầng theo vị trí ----------
  function stream(force) {
    const p = player.pos, [lx, lz] = toLocal(p.x, p.z), inside = live && p.y > OY - 30 && lx > -2 && lz > -2 && lx < W + 2 && lz < D + 2;
    if (!inside) { if (cur !== null) { setActive([]); cur = null; for (const F of floors.values()) F.group.visible = false; } return false; }
    const k = Math.max(LV0, Math.min(LV1, Math.round((p.y - OY) / FH)));
    if (k === cur && !force) return true;
    cur = k; const want = new Set([k - 1, k, k + 1].filter(q => FLOORS[q]));
    for (const q of want) buildLevel(q);
    for (const [q, F] of floors) F.group.visible = want.has(q);
    for (const [q, m] of Object.entries(core.proxies)) m.visible = !want.has(+q);
    setActive([...floors.get(k).boxes, ...(core.boxesK[k] || [])]);
    if (_flip) scene.remove(_occ); else scene.add(_occ); _flip = !_flip;   // đổi số con của scene → cam-occlude.js dựng lại danh sách vật che (tầng vừa ẩn/hiện)
    return true;
  }

  // ---------- mỗi khung hình ----------
  const lp = { x: 0, y: 0, z: 0 };
  function update(dt) {
    if (!live) return;
    const T = Date.now() / 1000, st = core.update(T); syncTops();
    LIFT.value = 0.18 + 0.34 * (ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0);
    const inside = stream(false);
    if (!inside) { if (performance.now() - lastIn > 60000 && !player.vehicle) disposeAll(); return; }
    lastIn = performance.now();
    if (ctx.weather && ctx.weather.cur) { const w = ctx.weather.cur; w.r = 0; w.f = 0; }   // trong nhà: không mưa, không sương (weather.js tự lerp lại khi ra ngoài)
    const p = player.pos, [lx, lz] = toLocal(p.x, p.z); lp.x = lx; lp.y = p.y; lp.z = lz;
    // chở theo nhịp cầu thang + giữ trong lan can
    if (core.carry(lp, d => { player.cam.yaw += d; })) { const [wx, wz] = toWorld(lp.x, lp.z); p.x = wx; p.z = wz; }
    // phép lông vũ: rơi trong giếng / tháp → chậm lại
    const inTw = TOWERS.some(t => lx > t.rect[0] && lx < t.rect[2] && lz > t.rect[1] && lz < t.rect[3]);
    if ((core.inShaft(lx, lz) || inTw) && player.vy < -6.5) { player.vy = -6.5; if (!feather++) ctx.toast('🪶 <b>Phép Lông Vũ</b> của lâu đài đỡ em — rơi trong giếng cầu thang không sao đâu!', 4000); }
    if (p.y < OY - 40) { go(0, 44.5, 49, Math.PI); return; }   // lọt khỏi lâu đài → về sảnh đón
    // báo trước khi cầu thang xoay
    const nearShaft = Math.abs(lx - ZERO[0]) < 18 && Math.abs(lz - ZERO[1]) < 18;
    if (nearShaft && st.docked && st.ph > st.still - 2 && st.ph < st.still - 1.9 && warned < 3) { warned++; ctx.sfx && ctx.sfx('bell'); ctx.toast('🔔 <b>Cầu thang sắp xoay!</b> Đứng trên bậc sẽ được chở theo an toàn — đầu cầu thang có thể dẫn tới hành lang khác.', 4000); }
    if (player.vehicle) return;
    // cửa bí mật
    const F = floors.get(cur);
    if (F) for (const s of F.secrets) {
      if (s.open) continue; const m = (s.s0 + s.s1) / 2, [sx, sz] = s.ax === 'z' ? [s.L, m] : [m, s.L];
      if (Math.hypot(lx - sx, lz - sz) < 2.6 && Math.abs(p.y - yOf(cur)) < 1.5) ctx.offer(s.def.hint, () => openSecret(s), 8);
    }
    // gương phép, cửa ra
    if (cur === MIRROR.k && Math.hypot(lx - MIRROR.at[0], lz - MIRROR.at[1]) < 2.4) ctx.offer(MIRROR.label, () => fade(() => { ctx.sfx && ctx.sfx('magic'); go(MIRROR.to.k, MIRROR.to.at[0], MIRROR.to.at[1], Math.PI); ctx.toast('🪞 Vèo! Em đã ở <b>Tầng lửng Thư viện</b> (tầng 2).', 3500); }), 8);
    for (const e of EXITS) if (e.k === cur && Math.hypot(lx - e.at[0], lz - e.at[1]) < 2.8) ctx.offer(e.label, () => leave(e.id), 8);
  }

  // tên vùng trên HUD: phòng đang đứng
  const prevZone = ctx.zoneAt;
  ctx.zoneAt = (x, z) => {
    if (live && cur !== null) { const [lx, lz] = toLocal(x, z), id = cellId(cur, Math.floor(lx), Math.floor(lz)); if (id !== 'void') { const r = REG[id]; return `Học viện Pha Lê · ${FLOORS[cur].name}${r && r.name ? ' · ' + r.name : ''}`; } }
    return prevZone ? prevZone(x, z) : null;
  };

  // ---------- API ----------
  const api = {
    enter, leave, update, anchors,
    get inside() { return cur !== null; }, get level() { return cur; }, get loaded() { return live; },
    floorsInfo: () => Object.entries(FLOORS).map(([k, f]) => ({ k: +k, name: f.name, rooms: [...new Set(f.paint.map(p => p[0]))].filter(id => REG[id] && REG[id].name && kindOf(id) !== 'hole').map(id => REG[id].name) })),
    /** điểm neo theo id / loại / tầng */
    anchor: id => anchors.find(a => a.id === id), byKind: (kind, k) => anchors.filter(a => a.kind === kind && (k === undefined || a.k === k)),
    /** gắn vật vào điểm neo (vật tự ẩn/hiện, tự dựng lại theo tầng). obj: THREE.Object3D, toạ độ con: gốc tại điểm neo, +z = hướng nhìn vào phòng */
    attach(id, obj) { attached.set(id, obj); const a = anchors.find(q => q.id === id); const F = a && floors.get(a.k); if (F) F.group.add(place(obj, a)); return obj; },
    detach(id) { const o = attached.get(id); if (o && o.parent) o.parent.remove(o); attached.delete(id); },
    /** gọi lại mỗi khi 1 tầng được dựng: fn(k, groupTầng) — groupTầng dùng toạ độ mặt bằng (x 0..89, z 0..55, y tuyệt đối) */
    onFloorBuilt(fn) { builtCbs.push(fn); for (const [k, F] of floors) fn(k, F.group, toLocalGroup); },
    /** toạ độ mặt bằng → thế giới */
    toWorld: (x, z, k = 0) => { const [wx, wz] = toWorld(x, z); return [wx, yOf(k), wz]; },
    secrets: () => SECRETS.map(s => ({ id: s.id, found: found.includes(s.id) })),
    get shaft() { return core && core.state; },
  };
  return api;
}
