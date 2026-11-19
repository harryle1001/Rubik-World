// wild/wildlife.js — HỆ SINH THÁI ĐỘNG VẬT THẬT: ~70 loài (bảng species.js) sống đúng sinh cảnh và sinh hoạt theo giờ, mùa, thời tiết.
// HIỆU NĂNG (điện thoại là chính):
//   · mỗi loài 1 model CC0 dùng chung (models/wild/, nén meshopt, tải LƯỜI khi nhóm đầu tiên của loài tới gần người chơi)
//   · chỉ sinh nhóm thú trong bán kính R_ON quanh người chơi, huỷ khi ra xa (R_ON + 13 m); tối đa CAP con có xương cùng lúc
//     (điện thoại 21, tính cả thú của animals.js đang hiện) — nhóm gần nhất được ưu tiên
//   · thú có xương: 1 lưới đã gộp/con; viền + bóng chỉ khi gần (actorLod), animation cập nhật thưa khi xa (stepAnim)
//   · chim nhỏ, côn trùng, đàn cá: InstancedMesh nướng 2 tư thế (flocks.js) → 2 draw call/đàn, không tính xương
// HÀNH VI (máy trạng thái nhẹ, mỗi con 1 trạng thái + 1 đồng hồ):
//   idle · walk · eat (gặm cỏ/mổ) · drink (ra chỗ nước) · mud (tắm bùn) · dig (đào hang/ủi đất) · climb (leo cây) · howl (hú gọi bầy)
//   sleep (đêm hoặc ngày tuỳ loài, có 💤) · flee (nhút nhát) · come (tò mò lại gần) · fed (được cho ăn ❤) · follow (con non theo mẹ, đàn theo đầu đàn)
//   stalk/chase/pant (rượt mồi KHÔNG máu me: con mồi luôn chạy thoát) · burrow (chui hang) · nest (ấp trứng → mớm mồi → chim non rời tổ theo ngày)
// Dùng: const wild = createWildlife(ctx); wild.update(dt). Sổ tay + ống nhòm + nhiệm vụ: naturalist.js (đọc wild.near/targets).
import * as THREE from 'three';
import { loadAnimated, loadModel, animator } from '../models.js';
import { addOutline, isOutlineMat, toon } from '../style.js';
import { actorLod, stepAnim } from '../characters.js';
import { CFG } from '../config.js';
import { TEMPLE_C, ISLAND_R, EXTRA, SPAWN, to3, landDist } from '../layout.js';
import { T, damp, dampAngle } from '../motion.js';
import { SPECIES } from './species.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFlock } from './flocks.js';
import { createCalls } from './calls.js';

const mob = CFG.isMobile, CAP = mob ? 21 : 34, R_ON = mob ? 46 : 60, R_HYS = 13;
const BAD = /tpose|t pose|pose$|die|death|dying|dead|attack|reset|old_|angry|gettingup|fly$|swim|taunt|salute|loony|sing/i;
const clean = n => n.split('|').pop();
// gộp các lưới tĩnh cùng vật liệu trong 1 nhóm đạo cụ thành 1 lưới (ít draw call): giữ nguyên lưới trong `keep`
function mergeStatic(P, keep = []) {
  const byMat = new Map(); for (const o of [...P.children]) { if (!o.isMesh || keep.includes(o)) continue; o.updateMatrix(); const g = o.geometry.clone().applyMatrix4(o.matrix); if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push({ g, cast: o.castShadow }); P.remove(o); }
  for (const [mat, list] of byMat) { const m = new THREE.Mesh(list.length > 1 ? mergeGeometries(list.map(q => q.g.index ? q.g.toNonIndexed() : q.g)) : list[0].g, mat); m.receiveShadow = true; m.castShadow = list.some(q => q.cast); P.add(m); }
}
const rnd = (a, b) => a + Math.random() * (b - a), pickOf = a => a[(Math.random() * a.length) | 0];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Hướng mũi của từng model so với +z (đo bằng wild.lineup(), xem docs/animals/lineup.png) và tên animation khi tự dò không đúng
const HP = Math.PI / 2, RY = { bear: Math.PI, boar: Math.PI, camel: Math.PI, raven: Math.PI, eagle: Math.PI, chick: -HP, duckling: -HP, mallard: -HP, spermwhale: -HP, seal: HP };
const ANIM = {
  rabbit: { idle: 'Sitting.000', walk: 'Jump', run: 'Running', eat: 'Basic' }, elephant: { idle: 'Idle', eat: 'Eating' }, goat: { idle: 'goat_idle', walk: 'goat_walk', run: 'goat_run', eat: 'goat_eat' },
  boar: { idle: 'default', walk: 'walk', run: 'walk' }, lemur: { idle: 'idle', walk: 'run', run: 'run' }, mallard: { walk: 'Waddle', eat: 'Peck', idle: 'Peck' }, duckling: { walk: 'Waddle', eat: 'Peck', idle: 'Peck' },
  rooster: { idle: 'Idle', walk: 'Walking', eat: 'Pecking.001', call: 'Screaming' }, hen: { idle: 'idle', walk: 'walk', eat: 'eat' }, treefrog: { idle: 'idle', walk: 'jump', run: 'jump' },
  crocodile: { idle: 'idle-loop', walk: 'walk-loop' }, penguin: { idle: 'idle', walk: 'walk' }, eagle: { fly: 'Flying', idle: 'Idle' }, raven: { fly: 'fly', idle: 'stand' }, bat: { fly: 'Flying' },
  llama: { borrow: 'cow' }, pig: { borrow: 'cow' }, sheep: { borrow: 'cow' },
};

export function createWildlife(ctx) {
  const { scene, terrain } = ctx, calls = createCalls(ctx), v3 = new THREE.Vector3();
  const sites = [], groups = [], actors = [], hides = [], props = new THREE.Group(); props.name = 'wild-props'; scene.add(props);
  const W = { sites, groups, actors, hides, calls, ready: false, season: 0, stats: { actors: 0, flocks: 0, groups: 0 } };
  let seedR = mulberry(20261119);
  if (/[?&]nowild/.test(location.search)) { W.update = () => {}; W.each = () => {}; W.off = true; return W; }   // ?nowild: tắt để đo hiệu năng trước/sau

  // ───────── địa hình: chỗ đứng được ─────────
  const freeAt = (x, z, m = 0.5) => { const c = ctx.grid && ctx.grid.near(x, z); if (!c) return true; for (const b of c.boxes) if (x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m) return false; for (const q of c.cols) if ((x - q.x) ** 2 + (z - q.z) ** 2 < (q.r + m) ** 2) return false; return true; };
  const walkable = (G, x, z) => {
    if (G.floe) { const f = G.floe; return Math.abs(x - f.x) < f.w / 2 - 0.8 && Math.abs(z - f.z) < f.d / 2 - 0.8; }
    const h = terrain.heightAt(x, z), S = G.S;
    if (S.water) return h > -0.7 && freeAt(x, z);
    if (S.hab === 'beach') return h > 0.15 && h < 2.4 && freeAt(x, z);
    return h > 0.45 && terrain.slopeAt(x, z) < 0.95 && freeAt(x, z);
  };
  const groundY = (G, x, z) => G.floe ? G.floe.y : Math.max(terrain.heightAt(x, z), G.S.water ? -G.S.s * 0.16 : -9);

  // ───────── sinh cảnh: các điểm của bản đồ (dựng 1 lần khi thị trấn trường sẵn sàng) ─────────
  const addSite = (hab, x, z, r, tag) => { if (x == null || !isFinite(x)) return; sites.push({ hab, x, z, r, tag }); };
  function buildSites() {
    const R = (ctx.school && ctx.school.RS && ctx.school.RS.R) || {};
    const reg = (k, hab, rMax = 21, tag) => { const r = R[k]; if (!r || !r.w) return false; const q = to3(r.x + r.w / 2, r.y + r.h / 2); if (!q) return false; addSite(hab, q[0], q[1], Math.max(5, Math.min(rMax, Math.min(r.w, r.h) * 0.05 * 0.45)), tag || k); return true; };
    reg('farm', 'farm'); reg('forest', 'grove', 13); reg('hills', 'grove', 13);   // rừng thông / đồi thông TRONG phố: chỉ loài hiền (sóc, chim, bướm)
    reg('lotus', 'wet', 13); reg('pond', 'wet', 13, 'koi'); reg('lake', 'wet', 13, 'koi');
    reg('flowerfield', 'meadow'); reg('garden', 'meadow', 13); reg('picnic', 'meadow', 13);
    reg('dalat', 'town', 13); reg('rubikpark', 'town', 13);
    addSite('forest', TEMPLE_C[0] + 26, TEMPLE_C[1] + 8, 21, 'temple'); addSite('forest', TEMPLE_C[0] - 22, TEMPLE_C[1] - 20, 21, 'temple2');
    // đồi núi & rừng sâu: chỗ đất tự nhiên CAO nhất, xa phố (≥ 55 m tới mọi khu) — sói, gấu, hươu đỏ, hổ… không ở cạnh nông trại
    { const cand = []; for (let x = -280; x <= 280; x += 13) for (let z = -280; z <= 280; z += 13) { const h = terrain.heightAt(x, z); if (h < 2.2 || landDist(x, z) < 55 || Math.hypot(x, z) < 150 || Math.hypot(x - TEMPLE_C[0], z - TEMPLE_C[1]) < 55 || terrain.slopeAt(x, z) > 0.8) continue; cand.push([h, x, z]); }
      cand.sort((a, b) => b[0] - a[0]); const pick = [];
      for (const c of cand) { if (pick.length >= 4) break; if (pick.every(q => Math.hypot(q[1] - c[1], q[2] - c[2]) > 89)) pick.push(c); }
      pick.forEach((c, i) => addSite(i < 2 ? 'hills' : 'forest', c[1], c[2], 21, 'wild' + i));
      if (!sites.some(s => s.hab === 'hills')) addSite('hills', TEMPLE_C[0] - 8, TEMPLE_C[1] + 34, 21, 'temple3'); }
    if (!sites.some(s => s.hab === 'meadow')) addSite('meadow', SPAWN[0] - 13, SPAWN[1] + 8, 8, 'gate');
    addSite('town', SPAWN[0] + 8, SPAWN[1] - 5, 8, 'gate');
    const F = EXTRA.find(e => e.id === 'F'); if (F) { const cx = (F.r[0] + F.r[2]) / 2, cz = (F.r[1] + F.r[3]) / 2;
      addSite('safari', cx - 26, cz - 30, 13, 'savanna'); addSite('safari', cx + 30, cz + 6, 13, 'savanna2'); addSite('safari', cx - 22, cz + 34, 10, 'savanna3');
      addSite('safariW', cx + 34, cz - 30, 6, 'hole'); addSite('wet', cx, cz + 17, 6, 'creek');
      hides.push({ x: cx + 44, z: cz + 26, r: 5, name: 'Chòi quan sát Safari' }); }
    // bãi biển + ngoài khơi: dò theo 8 hướng tới khi gặp mép nước / nước sâu
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.4; let r = ISLAND_R * 0.55, shore = 0, deep = 0;
      for (; r < ISLAND_R + 30; r += 3) { const h = terrain.heightAt(Math.cos(a) * r, Math.sin(a) * r); if (!shore && h < 0.9 && h > 0.2) shore = r; if (h < -3.2) { deep = r; break; } }
      if (shore && i % 2 === 0) addSite('beach', Math.cos(a) * shore, Math.sin(a) * shore, 8, 'beach' + i);
      if (deep) addSite(i % 2 ? 'sea' : 'seaDeep', Math.cos(a) * (deep + (i % 2 ? 6 : 34)), Math.sin(a) * (deep + (i % 2 ? 6 : 34)), 13, 'sea' + i); }
    buildFloes(); buildHides();
    // nhóm thú: mỗi loài 1–2 điểm đúng sinh cảnh (vị trí cố định theo hạt giống → lần chơi nào cũng gặp ở chỗ cũ)
    for (const S of SPECIES) {
      if (S.k === 'x') continue;
      const hab = S.hab === 'safari' && S.water ? 'safariW' : S.hab === 'sea' && S.deep ? 'seaDeep' : S.hab;
      if (hab === 'sky') { groups.push(mkGroup(S, null)); continue; }
      let ss = sites.filter(s => (s.hab === hab || (S.park && s.hab === 'grove')) && (!S.at || S.at.includes(s.tag))); if (!ss.length && hab === 'seaDeep') ss = sites.filter(s => s.hab === 'sea'); if (!ss.length) continue;
      ss = ss.map(s => [seedR(), s]).sort((a, b) => a[0] - b[0]).map(q => q[1]).slice(0, /polar|safari/.test(hab) || S.k === 's' || S.s > 2 ? 1 : 2);
      for (const s of ss) groups.push(mkGroup(S, s));
    }
    W.ready = true; W.stats.groups = groups.length;
  }
  function mkGroup(S, site) {
    const G = { S, site, n: Math.round(S.n[0] + seedR() * (S.n[1] - S.n[0])), members: [], on: false, t: seedR() * 9, shyK: 1, id: groups.length };
    if (mob && G.n > 2) G.n = Math.ceil(G.n * 0.7);
    if (site) {
      G.floe = site.floe || null;
      let x = site.x, z = site.z; for (let k = 0; k < 30; k++) { const a = seedR() * 6.283, r = Math.sqrt(seedR()) * site.r, tx = site.x + Math.cos(a) * r, tz = site.z + Math.sin(a) * r; if (/^sea|safariW/.test(site.hab) || walkable(G, tx, tz)) { x = tx; z = tz; break; } }
      G.hx = x; G.hz = z;
      if (S.k === 'sc') G.depth = S.reef ? 1.6 : 1.1;
    } else { G.hx = 0; G.hz = 0; }
    return G;
  }

  // ───────── vùng lạnh: 2 tảng băng trôi ngoài khơi phía bắc (đi thuyền / bơi ra; đứng lên được) ─────────
  function buildFloes() {
    const mat = toon('#ffffff', { emissive: '#9fc4dc', emissiveIntensity: 0.34 }), mat2 = toon('#bfe3f2', { emissive: '#6fa8c8', emissiveIntensity: 0.21 });
    const mk = (hab, x, z, w, d, name) => {
      let ok = true; for (const [a, b] of [[0, 0], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2]]) if (terrain.heightAt(x + a, z + b) > -1.5) ok = false; if (!ok) return;
      const y = 0.7, g = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2 * 0.86, 1.5, 9).scale(1, 1, d / w), mat); top.position.y = y - 0.75; top.receiveShadow = true; g.add(top);
      const und = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 * 0.8, w / 2 * 0.3, 3, 7).scale(1, 1, d / w), mat2); und.position.y = y - 3; g.add(und);
      for (let i = 0; i < 3; i++) { const s = 1.2 + seedR() * 1.6, c = new THREE.Mesh(new THREE.ConeGeometry(s, s * 2.2, 5), i % 2 ? mat2 : mat); c.position.set((seedR() - 0.5) * w * 0.55, y + s * 0.9, -d * 0.3 + (seedR() - 0.5) * 2); c.rotation.y = seedR() * 3; c.castShadow = true; g.add(c); }
      mergeStatic(g); g.position.set(x, 0, z); props.add(g);
      const floe = { x, z, w, d, y, name }; ctx.decks = ctx.decks || []; ctx.decks.push({ x0: x - w / 2 + 0.6, x1: x + w / 2 - 0.6, z0: z - d / 2 + 0.6, z1: z + d / 2 - 0.6, y });
      sites.push({ hab, x, z: z + d * 0.12, r: Math.min(w, d) * 0.3, tag: hab, floe }); (W.floes = W.floes || []).push(floe);
    };
    // phía bắc đảo: quét tìm chỗ nước sâu gần bờ nhất
    let r = ISLAND_R * 0.7; while (r < ISLAND_R + 40 && terrain.heightAt(-30, -r) > -2.5) r += 4;
    mk('polarS', -34, -(r + 21), 26, 18, 'Băng Nam Cực'); mk('polarN', 34, -(r + 26), 26, 18, 'Băng Bắc Cực');
  }
  // ───────── chòi / lều quan sát: nấp trong chòi thì thú không sợ ─────────
  function buildHides() {
    for (const tag of ['temple', 'lotus', 'wild0']) { const s = sites.find(q => q.tag === tag); if (!s) continue;
      let x = s.x + s.r + 3, z = s.z + 2; for (let k = 0; k < 12 && !(terrain.heightAt(x, z) > 0.6 && freeAt(x, z, 1.5)); k++) { const a = k * 2.4; x = s.x + Math.cos(a) * (s.r + 3); z = s.z + Math.sin(a) * (s.r + 3); }
      const h = { x, z, r: 4.2, name: 'Lều quan sát' }; hides.push(h);
      loadModel('prop-tent').then(m => { if (!m) return; const b = new THREE.Box3().setFromObject(m), k = 2.6 / (b.max.y - b.min.y || 1); m.scale.setScalar(k); m.position.set(x, terrain.heightAt(x, z) - b.min.y * k, z); m.rotation.y = Math.atan2(s.x - x, s.z - z); props.add(m); });
    }
  }

  // ───────── model: nạp lười, đo kích thước, nhuộm màu biến thể, vằn hổ ─────────
  const minfo = new Map(), tintCache = new Map(), stripeGeo = new Map();
  function measure(name, model) {
    if (minfo.has(name)) return minfo.get(name);
    model.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(model), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const I = { max: Math.max(s.x, s.y, s.z) || 1, minY: b.min.y, cx: c.x, cz: c.z, h: s.y, long: s.z >= s.x ? 'z' : 'x', len: Math.max(s.x, s.z) }; minfo.set(name, I); return I;
  }
  function tint(S, model) {
    model.traverse(o => {
      if (!o.isMesh) return; o.userData.wild = S;
      if (S.stripe && o.geometry.attributes.position) {   // vằn hổ: tô màu đỉnh theo dải dọc thân, bụng sáng hơn
        let g = stripeGeo.get(o.geometry.uuid);
        if (!g) { g = o.geometry.clone(); g.computeBoundingBox(); const P = g.attributes.position, bb = g.boundingBox, sz = bb.getSize(new THREE.Vector3()), ax = sz.z >= sz.x && sz.z >= sz.y ? 'z' : sz.x >= sz.y ? 'x' : 'y', up = ax === 'y' ? 'z' : 'y';
          const base = new THREE.Color(S.t), dark = new THREE.Color(S.stripe), white = new THREE.Color('#fff4e0'), c = new THREE.Color(), col = new Float32Array(P.count * 3);
          for (let i = 0; i < P.count; i++) { const u = (P.getComponent(i, ax === 'z' ? 2 : ax === 'x' ? 0 : 1) - bb.min[ax]) / sz[ax], h = (P.getComponent(i, up === 'y' ? 1 : 2) - bb.min[up]) / sz[up];
            c.copy(base); if (h < 0.3) c.lerp(white, 0.55); if (Math.sin(u * 44 + h * 5) > 0.25 && h > 0.22) c.copy(dark); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
          g.setAttribute('color', new THREE.BufferAttribute(col, 3)); stripeGeo.set(o.geometry.uuid, g); }
        o.geometry = g; const k = S.id + '|s'; let m = tintCache.get(k); if (!m) { m = o.material.clone(); m.vertexColors = true; m.color.set('#ffffff'); m.needsUpdate = true; tintCache.set(k, m); } o.material = m; return;
      }
      if (!S.t) return;
      const k = S.id + '|' + o.material.uuid; let m = tintCache.get(k);
      if (!m) { m = o.material.clone(); if (S.flat) { m.vertexColors = false; m.color.set(S.t); } else m.color.multiply(new THREE.Color(S.t)); m.needsUpdate = true; tintCache.set(k, m); }
      o.material = m;
    });
  }
  const borrowed = new Map();   // mượn animation Walk/Run của model cùng bộ xương (lợn, cừu, lạc đà không bướu ← bò)
  async function borrowClips(name, from, model, clips) {
    const key = name + '<' + from; if (borrowed.has(key)) return borrowed.get(key);
    const g = await loadAnimated('wild/' + from, true); const names = new Set(); model.traverse(o => names.add(o.name)); const out = [];
    if (g) for (const c of g.animations) { const nm = clean(c.name); if (!/^(Walk|Run)$/.test(nm) || clips.some(x => clean(x.name) === nm)) continue;
      const tr = c.tracks.filter(t => t.name.endsWith('.quaternion') && names.has(t.name.split('.')[0])); if (tr.length > 6) out.push(new THREE.AnimationClip(c.name, c.duration, tr.map(t => t.clone()))); }
    borrowed.set(key, out); return out;
  }
  async function makeActor(G, modelName, size, tinted = true) {
    const S = G.S, g = await loadAnimated('wild/' + modelName, true); if (!g) return null;
    const root = new THREE.Group(), pivot = new THREE.Group(), model = g.scene, I = measure(modelName, model), k = size / I.max;
    model.scale.multiplyScalar(k); model.position.multiplyScalar(k); model.position.x -= I.cx * k; model.position.z -= I.cz * k; model.position.y -= I.minY * k;
    pivot.rotation.y = RY[modelName] || 0; pivot.add(model); root.add(pivot);
    if (tinted) tint(S, model); else model.traverse(o => { if (o.isMesh) o.userData.wild = S; });
    model.traverse(o => { if (o.isMesh) { o.castShadow = !mob || size >= 1; o.receiveShadow = false; if (o.material.map && !o.material.alphaTest) { o.material.alphaTest = 0.5; o.material.needsUpdate = true; } } });   // texture có vùng trong suốt (lưỡi rắn, màng chân ếch)
    if (!mob) addOutline(model);   // điện thoại: thú wild không vẽ viền, thú nhỏ không đổ bóng (giữ ≤ 233 draw call)
    const outlines = []; model.traverse(o => { if (o.userData.outline && isOutlineMat(o.material)) outlines.push(o); });
    let clips = g.animations; const ov = ANIM[modelName] || {};
    if (ov.borrow) clips = clips.concat(await borrowClips(modelName, ov.borrow, model, clips));
    const anim = animator(model, clips, clean), names = Object.keys(anim.actions), good = names.filter(n => !BAD.test(n));
    const find = re => good.find(n => re.test(n)), has = n => n && anim.actions[n] ? n : null;
    const a = { idle: has(ov.idle) || find(/^idle|stand|default|guard|sit/i), walk: has(ov.walk) || find(/^walk|waddle|walking/i), run: has(ov.run) || find(/run|gallop/i), eat: has(ov.eat) || find(/eat|peck/i), fly: has(ov.fly) || names.find(n => /fly|flying|flap|hover/i.test(n)), swim: names.find(n => /swim/i.test(n)), call: has(ov.call) };
    if (!a.walk && !a.idle && good.length) a.walk = good[0];           // model chỉ có 1 clip (vỗ cánh / bước / quẫy đuôi)
    if (!a.idle) a.idle = a.walk || a.fly || a.swim; if (!a.run) a.run = a.walk;
    const A = { S, G, root, pivot, model, anim, a, size, an: { tick: (Math.random() * 4) | 0 }, kr: { v: 0 }, ks: { v: 0 }, rot: rnd(0, 6.28), sp: 0, st: 'idle', t: rnd(0.5, 4), tx: 0, tz: 0, go: false, outlines, outlineOn: true, ph: Math.random() * 6.28, rigid: !names.length, lift: 0, pitch: 0, roll: 0, sc: 1 };
    if (a.idle) anim.play(a.idle, 0);
    return A;
  }
  // biểu tượng nổi trên đầu (💤 ngủ · ❤ được cho ăn · ❗ giật mình): 1 texture/biểu tượng dùng chung
  const iconTex = {}, iconOf = ch => { if (!iconTex[ch]) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.font = '48px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 32, 36); iconTex[ch] = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }); } return iconTex[ch]; };
  function badge(A, ch) {
    if (!ch) { if (A.badge) A.badge.visible = false; A.badgeCh = null; return; }
    if (A.badgeCh === ch) { A.badge.visible = true; return; }
    if (!A.badge) { A.badge = new THREE.Sprite(iconOf(ch)); A.badge.scale.setScalar(0.55); A.root.add(A.badge); }
    A.badge.material = iconOf(ch); A.badge.position.y = Math.max(0.6, A.size * 0.75) + 0.35; A.badge.visible = true; A.badgeCh = ch;
  }

  // ───────── đạo cụ của nhóm: vũng bùn, cửa hang, tổ + trứng, cột & dây điện ─────────
  const M_CHICK = toon('#f2d16b'), M_MUD = toon('#7a5a3a'), M_DARK = toon('#2e2620'), M_STRAW = toon('#c9a55a'), M_EGG = toon('#f7f1e3'), M_WOOD = toon('#8a6a45');
  const disc = (mat, r, x, y, z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 10).rotateX(-Math.PI / 2), mat); m.position.set(x, y, z); return m; };
  function groupProps(G) {
    if (G.props) { props.add(G.props); return; }
    const S = G.S, P = G.props = new THREE.Group(), beh = S.beh || [], y0 = groundY(G, G.hx, G.hz);
    const near = (r0, r1) => { for (let k = 0; k < 14; k++) { const a = seedR() * 6.283, r = r0 + seedR() * (r1 - r0), x = G.hx + Math.cos(a) * r, z = G.hz + Math.sin(a) * r; if (walkable(G, x, z)) return [x, z]; } return [G.hx, G.hz]; };
    if (beh.includes('mud')) { const [x, z] = S.water ? [G.hx, G.hz] : near(2, 6); G.mud = [x, z]; if (!S.water) P.add(disc(M_MUD, Math.max(1.1, S.s * 0.75), x, groundY(G, x, z) + 0.035, z)); }
    if (beh.includes('dig')) { const [x, z] = near(1.5, 5); G.burrow = [x, z]; const y = groundY(G, x, z); P.add(disc(M_DARK, S.s * 0.45, x, y + 0.04, z)); const md = new THREE.Mesh(new THREE.SphereGeometry(S.s * 0.6, 7, 4, 0, 6.283, 0, 1.2), M_MUD); md.position.set(x - S.s * 0.5, y - S.s * 0.38, z); P.add(md); }
    if (beh.includes('drink') && !G.floe) { let best = null; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; for (let r = 3; r < 34; r += 3) { const x = G.hx + Math.cos(a) * r, z = G.hz + Math.sin(a) * r, h = terrain.heightAt(x, z); if (h < 0.25) { if (!best || r < best[2]) best = [x - Math.cos(a) * 1.6, z - Math.sin(a) * 1.6, r]; break; } if (!freeAt(x, z)) break; } }
      const hole = sites.find(s => s.tag === 'hole' || s.tag === 'creek'); if (!best && hole && Math.hypot(hole.x - G.hx, hole.z - G.hz) < 70) best = [hole.x + 5, hole.z + 3]; G.water = best; }
    if (beh.includes('nest') && S.k !== 'r') {   // tổ: dưới đất (gà, vịt) hoặc trên cọc tổ (chim nhỏ); trứng → chim non theo ngày
      const [x, z] = S.k === 'f' ? near(2, 5) : near(1, 3), up = S.k === 'f' ? 1.5 : 0, y = groundY(G, x, z); G.nest = { x, z, y: y + up };
      if (up) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, up, 5), M_WOOD); post.position.set(x, y + up / 2, z); P.add(post); }
      const bowl = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.08, 5, 9).rotateX(Math.PI / 2), M_STRAW); bowl.position.set(x, y + up + 0.06, z); bowl.scale.setScalar(S.k === 'f' ? 0.9 : 1.5); P.add(bowl);
      G.eggs = new THREE.Mesh(mergeGeometries([0, 1, 2].map(i => new THREE.SphereGeometry(0.055, 6, 5).scale(1, 1.3, 1).translate(Math.cos(i * 2.1) * 0.07, 0.04, Math.sin(i * 2.1) * 0.07))), M_EGG); G.eggs.position.set(x, y + up + 0.06, z); P.add(G.eggs);
    }
    if (S.k === 'r' && beh.includes('nest')) { const y = y0; G.nest = { x: G.hx, z: G.hz, y: y + 4.2 }; const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 4.2, 6), M_WOOD); post.position.set(G.hx, y + 2.1, G.hz); P.add(post); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.4, 8), M_STRAW); bowl.position.set(G.hx, y + 4.3, G.hz); P.add(bowl); }
    if (S.k === 'p') { const a = seedR() * 3.14, L = 4.5, x0 = G.hx - Math.cos(a) * L, z0 = G.hz - Math.sin(a) * L, x1 = G.hx + Math.cos(a) * L, z1 = G.hz + Math.sin(a) * L, yy = y0 + 4.4;
      for (const [x, z] of [[x0, z0], [x1, z1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 4.6, 6), M_WOOD); p.position.set(x, groundY(G, x, z) + 2.3, z); P.add(p); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), M_WOOD); bar.position.set(x, yy + 0.05, z); bar.rotation.y = -a + Math.PI / 2; P.add(bar); }
      const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3(x0 + (x1 - x0) * u, yy - Math.sin(u * Math.PI) * 0.18, z0 + (z1 - z0) * u)); }
      P.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2b2633' }))); G.wire = { x0, z0, x1, z1, y: yy, yaw: Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2 }; }
    mergeStatic(P, G.eggs ? [G.eggs] : []); props.add(P);
  }

  // ───────── bật / tắt nhóm ─────────
  const KIND_R = { s: 34, r: 21, v: 0, b: 8 };   // cộng thêm vào bán kính bật (thú biển, chim săn thấy từ xa)
  const isFlock = S => 'fvpi'.includes(S.k) || S.k === 'sc';
  async function activate(G) {
    G.on = true; G.loading = true; const S = G.S; groupProps(G);
    if (isFlock(S)) { if (!G.flock) G.flock = await makeFlock(ctx, G, RY[S.m]); else G.flock.show(true); G.loading = false; if (!G.on && G.flock) G.flock.show(false); return; }
    if (!G.members.length) {
      const list = [];
      for (let i = 0; i < G.n; i++) list.push(makeActor(G, S.mate && i === G.n - 1 && G.n > 1 ? S.mate : S.m, S.s * (i ? rnd(0.9, 1.05) : 1)));
      if (S.mate && G.n === 1) list.push(makeActor(G, S.mate, S.s * 0.85, false));                    // gà trống + gà mái
      const adults = (await Promise.all(list)).filter(Boolean); if (!adults.length) { G.loading = false; return; }
      const mom = adults[adults.length - 1]; G.members = adults; G.lead = adults[0]; G.broody = mom;
      if (S.baby) { const nb = Math.round(rnd(S.babyN[0], S.babyN[1])) - (mob && S.babyN[1] > 2 ? 1 : 0); const kids = (await Promise.all(Array.from({ length: Math.max(1, nb) }, () => makeActor(G, S.baby, S.babyS, S.baby === S.m)))).filter(Boolean);
        kids.forEach((K, j) => { K.mom = mom; K.kid = j + 1; G.members.push(K); }); }
      G.members.forEach((A, i) => { let x = G.hx, z = G.hz; for (let k = 0; k < 12; k++) { const a = rnd(0, 6.28), r = rnd(0.5, 2 + S.s * 1.6), tx = G.hx + Math.cos(a) * r, tz = G.hz + Math.sin(a) * r; if (S.k !== 'w' || walkable(G, tx, tz)) { x = tx; z = tz; break; } }
        A.root.position.set(x, groundY(G, x, z), z); A.idx = i; A.ph = i * 2.4; });
    }
    for (const A of G.members) { scene.add(A.root); actors.push(A); A.st = 'idle'; A.t = S.k === 'w' ? rnd(0.3, 3) : rnd(13, 34); A.go = false; A.hidden = false; }
    G.loading = false; if (!G.on) deactivate(G);
  }
  function deactivate(G) {
    G.on = false; if (G.loading) return; if (G.props) props.remove(G.props);
    if (G.flock) G.flock.show(false);
    for (const A of G.members) { scene.remove(A.root); const i = actors.indexOf(A); if (i >= 0) actors.splice(i, 1); }
  }
  const awakeNow = (S, night, rain) => S.act === 'a' || (S.rain && rain) || (S.act === 'n' ? night > 0.55 : night < 0.6);
  const inSeason = S => !S.mig || S.mig.includes(W.season);
  let scanT = 0, flyT = 21;
  function scan(p, night, rain) {
    const old = ctx.animals ? ctx.animals.list.reduce((n, A) => n + (A.root.visible ? 1 : 0), 0) : 0; let used = 0; const want = [];
    for (const G of groups) {
      const S = G.S; if (S.k === 'v') continue;
      if (S.hab === 'sky') { G.hx += (p.x - G.hx) * 0.08; G.hz += (p.z - G.hz) * 0.08; }
      const d = Math.hypot(G.hx - p.x, G.hz - p.z), R = R_ON + (KIND_R[S.k] || 0) + (S.s > 3 ? 13 : 0);
      const hiddenKind = isFlock(S) || S.k === 'b' || S.k === 'r';   // loài bay/côn trùng: ngoài giờ hoạt động thì ẩn (về tổ); thú đi bộ thì nằm ngủ tại chỗ
      const ok = inSeason(S) && (!hiddenKind || awakeNow(S, night, rain) || S.k === 'r') && !(rain && S.k === 'i') && d < (G.on ? R + R_HYS : R);
      G.d = d; if (ok) want.push(G); else if (G.on) deactivate(G);
    }
    want.sort((a, b) => a.d - b.d); let nf = 0;
    for (const G of want) {
      const cost = isFlock(G.S) ? 0 : (G.members.length || G.n + (G.S.baby ? G.S.babyN[1] : 0));
      if (isFlock(G.S) ? nf < (mob ? 5 : 8) : used + cost + old <= CAP) { if (isFlock(G.S)) nf++; else used += cost; if (!G.on) activate(G); }
      else if (G.on) deactivate(G);
    }
    W.stats.actors = actors.length; W.stats.flocks = nf;
  }
  // đàn di cư bay chữ V ngang trời (ngỗng trời – mùa thu, đông): sáng sớm / chiều muộn bay nhiều hơn
  function flyover(dt, p, night) {
    const G = groups.find(g => g.S.k === 'v'); if (!G) return;
    if (G.fly) { if (Math.hypot(G.fly.x - p.x, G.fly.z - p.z) > 150) { G.fly = null; if (G.flock) G.flock.show(false); G.on = false; } return; }
    if ((flyT -= dt) > 0 || night > 0.5 || !inSeason(G.S)) return; flyT = rnd(55, 89);
    const south = W.season === 2 ? 1 : W.season === 3 ? 1 : -1, a = rnd(-0.5, 0.5), dx = Math.sin(a), dz = Math.cos(a) * south;
    G.hx = p.x; G.hz = p.z; G.fly = { x: p.x - dx * 120 + rnd(-20, 20), z: p.z - dz * 120, dx, dz, alt: Math.max(0, terrain.heightAt(p.x, p.z)) + 34 }; G.on = true;
    (async () => { if (!G.flock) G.flock = await makeFlock(ctx, G, RY[G.S.m]); if (G.flock) G.flock.show(true); })();
    W.onEvent && W.onEvent('vform', G.S);
  }

  // ───────── hành vi thú đi bộ ─────────
  const say = (S, d, pitch) => { if (S.call && d < 40) calls.play(S.call, d, pitch || (S.s < 0.5 ? 1.25 : S.s > 2.5 ? 0.8 : 1)); };
  const setGo = (A, x, z, st, spK = 1) => { A.tx = x; A.tz = z; A.go = true; A.st = st; A.spK = spK; };
  function wander(A, G, r0 = 2, r1 = 7) {
    const L = G.lead, herd = G.S.herd && L && L !== A && L.go, cx = herd ? L.tx : G.hx, cz = herd ? L.tz : G.hz;
    for (let k = 0; k < 6; k++) { const a = rnd(0, 6.28), r = herd ? rnd(0.8, 3) : rnd(r0, r1 + G.S.s), x = (herd ? cx : A.root.position.x * 0.5 + cx * 0.5) + Math.cos(a) * r, z = (herd ? cz : A.root.position.z * 0.5 + cz * 0.5) + Math.sin(a) * r;
      if (walkable(G, x, z) && Math.hypot(x - G.hx, z - G.hz) < 16 + G.S.s * 2) { setGo(A, x, z, 'walk'); return true; } }
    return false;
  }
  function nextState(A, G, env) {
    const S = G.S, beh = S.beh || [], r = Math.random();
    if (!awakeNow(S, env.night, env.rain)) { A.st = 'sleep'; A.t = rnd(6, 12); return; }
    if (G.nest && G.nestPh === 0 && A === G.broody && !isFlock(S)) return setGo(A, G.nest.x, G.nest.z, 'toNest');   // ấp trứng
    if (env.rain && !S.water && !S.rain && r < 0.6) { A.st = 'idle'; A.t = rnd(4, 8); return; }   // mưa: đứng trú, ít đi lại
    if (r < 0.2 && beh.includes('drink') && G.water) return setGo(A, G.water[0] + rnd(-1.5, 1.5), G.water[1] + rnd(-1.5, 1.5), 'toDrink');
    if (r < 0.34 && beh.includes('mud') && G.mud && env.night < 0.5) return setGo(A, G.mud[0] + rnd(-0.6, 0.6), G.mud[1] + rnd(-0.6, 0.6), 'toMud');
    if (r < 0.3 && beh.includes('dig') && S.id !== 'w-rabbit') { A.st = 'dig'; A.t = rnd(3, 5); return; }
    if (r < 0.3 && beh.includes('climb') && G.tree) return setGo(A, G.tree.x + G.tree.r + A.size * 0.3, G.tree.z, 'toClimb');
    if (r < 0.16 && beh.includes('howl') && env.night > 0.5) { A.st = 'howl'; A.t = 3.2; say(S, env.dOf(A)); G.howl = 0.9; W.onEvent && W.onEvent('howl', S); return; }
    if (r < 0.12 && beh.includes('dust')) { A.st = 'dust'; A.t = rnd(2.5, 4); return; }
    if (r < 0.5 && (A.a.eat || S.cls === 'thu')) { A.st = 'eat'; A.t = rnd(3, 7); return; }
    if (r < 0.9 && wander(A, G)) return;
    A.st = 'idle'; A.t = rnd(2, 6); if (Math.random() < 0.12) say(S, env.dOf(A));
  }
  function stepActor(A, dt, env) {
    const G = A.G, S = A.S, P = A.root.position, p = env.p, d = Math.hypot(P.x - p.x, P.z - p.z), k = S.k; A.d = d;
    if (d > 95) { A.root.visible = false; return; } A.root.visible = !A.hidden;
    actorLod(A, A.root, d);
    if (k === 'r' || k === 'b') return stepFlyer(A, dt, env, d);
    if (k === 's') return stepSwimmer(A, dt, env, d);
    let play = A.a.idle, ts = 1, speed = 0, wantPitch = 0, wantLift = 0, wantRoll = 0, face = null; if (!A.kp) { A.kp = { v: 0 }; A.kl = { v: 0 }; A.kb = { v: 0 }; }
    // con non theo mẹ, nối đuôi nhau
    if (A.mom) {
      if (G.nestPh === 0) { A.root.visible = false; return; }   // trứng chưa nở: chưa có con non
      const Mo = A.mom, back = 0.5 + A.kid * Math.max(0.35, A.size * 1.1), tx = Mo.root.position.x - Math.sin(Mo.rot) * back + Math.sin(A.kid * 2.4) * 0.3, tz = Mo.root.position.z - Math.cos(Mo.rot) * back + Math.cos(A.kid * 2.4) * 0.3, L = Math.hypot(tx - P.x, tz - P.z);
      if (Mo.st === 'sleep' || Mo.st === 'brood') { A.st = 'sleep'; A.go = false; } else if (L > 0.35) { A.st = 'follow'; A.tx = tx; A.tz = tz; A.go = true; A.spK = Math.min(2.6, 0.7 + L * 0.8); } else { A.go = false; A.st = Mo.st === 'eat' || Mo.st === 'fed' ? 'eat' : 'idle'; }
      if (L > 9) { P.x = tx; P.z = tz; }
    } else {
      // phản ứng với người chơi
      const shyR = S.shy > 0 ? S.shy * G.shyK * env.shyK : 0;
      if (shyR && d < shyR && A.st !== 'flee' && A.st !== 'burrow' && A.st !== 'climb' && A.st !== 'fed' && A.st !== 'chase' && A.st !== 'escape') {
        if (A.st === 'sleep') badge(A, null);
        if (G.burrow && S.id === 'w-rabbit') setGo(A, G.burrow[0], G.burrow[1], 'toBurrow', 2.6);
        else if (G.tree && (S.beh || []).includes('climb') && S.s < 1) setGo(A, G.tree.x + G.tree.r + A.size * 0.3, G.tree.z, 'toClimb', 2.4);
        else { let done = false; for (let j = 0; j < 5 && !done; j++) { const a = Math.atan2(P.x - p.x, P.z - p.z) + (j ? rnd(-1.2, 1.2) : 0), x = P.x + Math.sin(a) * 10, z = P.z + Math.cos(a) * 10; if (walkable(G, x, z)) { setGo(A, x, z, 'flee', 2.6); done = true; } } }
        if (!G.alarm || env.time - G.alarm > 6) { G.alarm = env.time; say(S, d, 1.2); }
      } else if (S.shy < 0 && d < 9 && d > 2.6 && (A.st === 'idle' || A.st === 'walk' || A.st === 'eat') && !env.hide && awakeNow(S, env.night, env.rain) && A.idx === (G.curious || 0)) {
        setGo(A, p.x + Math.sin(A.ph) * 2.2, p.z + Math.cos(A.ph) * 2.2, 'come', 1.4);
      } else if (d < Math.max(4, shyR * 1.8) && !A.go && A.st !== 'sleep') face = Math.atan2(p.x - P.x, p.z - P.z);
      // gọi bầy: lạc xa đầu đàn thì kêu và chạy về
      if (S.herd && G.lead && G.lead !== A && !A.go && Math.hypot(P.x - G.lead.root.position.x, P.z - G.lead.root.position.z) > 11 && A.st !== 'sleep') { setGo(A, G.lead.root.position.x + rnd(-2, 2), G.lead.root.position.z + rnd(-2, 2), 'walk', 1.8); say(S, d, 1.15); }
      if (G.howl > 0 && A.st !== 'howl' && A.st !== 'sleep' && (G.howl -= dt) <= 0) { A.st = 'howl'; A.t = 2.8; A.go = false; say(S, d, 1.1); }
    }
    if (A.go) {   // đi tới đích: quay đầu bằng lò xo, chậm lại khi rẽ gắt / sắp tới
      const dx = A.tx - P.x, dz = A.tz - P.z, L = Math.hypot(dx, dz), fast = (A.spK || 1) > 1.6, want = Math.atan2(dx, dz), dr = Math.atan2(Math.sin(want - A.rot), Math.cos(want - A.rot));
      A.rot = dampAngle(A.rot, want, A.kr, fast ? T.quick : T.soft, dt, fast ? 7 : 3.2);
      const base = S.sp * (A.spK || 1) * (A.mom ? 1 : 1), spT = base * Math.max(0.2, Math.cos(dr)) * Math.min(1, 0.3 + L / 1.5);
      A.sp = damp(A.sp, spT, A.ks, T.slow, dt); const nx = P.x + Math.sin(A.rot) * A.sp * dt, nz = P.z + Math.cos(A.rot) * A.sp * dt;
      if (A.mom || A.st === 'flee' || A.st === 'escape' || ((A.fc = (A.fc || 0) + 1) & 3) || walkable(G, nx, nz)) { P.x = nx; P.z = nz; }   // kiểm tra chỗ đứng 1/4 số khung (đỡ tốn heightAt) else { A.go = false; A.st = 'idle'; A.t = 1; }
      speed = A.sp; play = fast && A.a.run ? A.a.run : A.a.walk || A.a.idle; ts = Math.max(0.5, Math.min(2, A.sp / Math.max(0.3, S.sp)));
      if ((A.t2 = (A.t2 || 0) + dt) > 14) { A.t2 = 0; A.go = false; A.st = 'idle'; A.t = 1; }   // kẹt đường: bỏ đích
      if (L < 0.45 + A.size * 0.12) { A.go = false; A.t2 = 0; arrive(A, G, env); }
    } else {
      A.sp = damp(A.sp, 0, A.ks, T.soft, dt); A.t -= dt; A.t2 = 0;
      switch (A.st) {
        case 'eat': case 'fed': play = A.a.eat || A.a.idle; if (!A.a.eat) wantPitch = 0.3; if (A.st === 'fed') badge(A, '❤️'); break;
        case 'drink': play = A.a.eat || A.a.idle; wantPitch = 0.34; break;
        case 'mud': wantLift = -A.size * 0.14; wantRoll = Math.sin(env.time * 2.2 + A.ph) * 0.22; break;        // tắm bùn: nằm rạp, lăn qua lăn lại
        case 'dust': wantLift = -A.size * 0.1; wantRoll = Math.sin(env.time * 13 + A.ph) * 0.3; break;           // tắm bụi: rạp xuống, rũ lông
        case 'dig': wantPitch = 0.4 + Math.sin(env.time * 9) * 0.08; break;                                      // ủi đất tìm củ
        case 'howl': wantPitch = -0.5; break;
        case 'brood': wantLift = -A.size * 0.12; break;                                                         // nằm ấp trứng
        case 'pant': ts = 2.2; break;
        case 'sleep': wantLift = -A.size * (A.rigid ? 0.06 : 0.11); ts = 0.25; badge(A, d < 26 ? '💤' : null); if (awakeNow(S, env.night, env.rain) && A.t < 0) { badge(A, null); A.st = 'idle'; A.t = rnd(1, 3); } break;
        case 'burrow': A.sc = damp(A.sc, 0.02, A.kb || (A.kb = { v: 0 }), T.quick, dt); if (A.t < 0 && d > S.shy * 1.3) { A.st = 'unburrow'; A.t = 1.2; } break;
        case 'unburrow': A.sc = damp(A.sc, 1, A.kb, T.soft, dt); if (A.t < 0) { A.sc = 1; A.st = 'idle'; A.t = 2; } break;
        case 'climb': { const top = G.tree ? Math.min(3, G.tree.h) : 2.2; A.lift = damp(A.lift, top, A.kl || (A.kl = { v: 0 }), T.slow, dt, 2.2); wantPitch = -1.25; play = A.a.walk || A.a.idle; ts = Math.abs(A.lift - top) > 0.1 ? 1.4 : 0.2; if (A.t < 0 && d > Math.max(3, S.shy)) { A.st = 'unclimb'; A.t = 4; } break; }
        case 'unclimb': A.lift = damp(A.lift, 0, A.kl, T.slow, dt, 2.2); wantPitch = 1.1; if (A.lift < 0.06 || A.t < 0) { A.lift = 0; A.st = 'idle'; A.t = 2; } break;
        default: break;
      }
      if (A.st !== 'sleep' && A.st !== 'burrow' && A.st !== 'climb' && A.st !== 'unclimb' && A.st !== 'unburrow' && A.t < 0 && !A.mom) { if (A.st === 'fed') badge(A, null); nextState(A, G, env); }
      if (face != null && A.st !== 'mud' && A.st !== 'climb') A.rot = dampAngle(A.rot, face, A.kr, T.slow, dt, 3);
    }
    if (A.st !== 'climb' && A.st !== 'unclimb') A.lift = damp(A.lift, wantLift, A.kl || (A.kl = { v: 0 }), T.soft, dt);
    A.pitch = damp(A.pitch, wantPitch, A.kp, T.soft, dt, 3); A.roll = wantRoll;
    // model không có animation (gấu, hổ, tê giác…): nhún + lắc theo bước
    let bob = 0; if ((A.rigid || !A.a.walk) && speed > 0.1) { A.ph += dt * (4 + speed * 3); bob = Math.abs(Math.sin(A.ph)) * A.size * 0.035; A.roll += Math.sin(A.ph) * 0.045; }
    P.y = groundY(G, P.x, P.z) + A.lift + bob; A.root.rotation.set(A.pitch, A.rot, A.roll, 'YXZ');
    if (A.sc !== 1 || A.root.scale.x !== 1) A.root.scale.setScalar(A.sc);
    if (play) { const act = A.anim.play(play, 0.3); if (act) act.timeScale = ts; }
    if (!A.rigid) stepAnim(A.anim, A.an, d, dt);
  }
  function arrive(A, G, env) {
    switch (A.st) {
      case 'toNest': A.st = 'brood'; A.t = rnd(13, 21); W.onEvent && W.onEvent('brood', A.S, A); break;
      case 'toDrink': A.st = 'drink'; A.t = rnd(4, 7); W.onEvent && W.onEvent('drink', A.S, A); break;
      case 'toMud': A.st = 'mud'; A.t = rnd(6, 11); W.onEvent && W.onEvent('mud', A.S, A); break;
      case 'toBurrow': A.st = 'burrow'; A.t = 5; W.onEvent && W.onEvent('burrow', A.S, A); break;
      case 'toClimb': A.st = 'climb'; A.t = rnd(5, 8); if (G.tree) A.rot = Math.atan2(G.tree.x - A.root.position.x, G.tree.z - A.root.position.z); W.onEvent && W.onEvent('climb', A.S, A); break;
      case 'come': A.st = 'idle'; A.t = rnd(3, 6); if (Math.random() < 0.5) say(A.S, 3); break;
      case 'flee': case 'escape': A.st = 'idle'; A.t = rnd(2, 4); break;
      case 'stalk': case 'chase': break;
      default: A.st = 'idle'; A.t = rnd(1.5, 5);
    }
  }
  // chim săn mồi (lượn vòng, bổ nhào, về tổ ngủ) và dơi (đêm, bay hình số 8)
  function stepFlyer(A, dt, env, d) {
    const G = A.G, S = A.S, P = A.root.position, bat = S.k === 'b', alt = S.alt || 5.5, gy = Math.max(0, terrain.heightAt(G.hx, G.hz));
    const roost = !bat && env.night > 0.6;
    if (A.st !== 'dive' && A.st !== 'climbUp' && !roost && !bat && S.prey && (A.t -= dt) < 0) { A.t = rnd(34, 55); const Pg = groups.find(g => g.S.id === S.prey && g.on && Math.hypot(g.hx - G.hx, g.hz - G.hz) < 60);   // bổ nhào: con mồi kịp chạy/chui hang
      if (Pg && Pg.members.length) { A.st = 'dive'; A.prey = Pg; const q = Pg.members[0].root.position; A.tx = q.x; A.tz = q.z; W.onEvent && W.onEvent('dive', S, A, Pg.S); for (const B of Pg.members) if (!B.mom) scare(B, Pg, P.x, P.z); } }
    let tx, ty, tz;
    if (A.st === 'dive') { tx = A.tx; tz = A.tz; ty = gy + 2.2; if (Math.hypot(tx - P.x, tz - P.z) < 3) { A.st = 'climbUp'; A.t2 = 3; say(S, d); } }
    else if (roost && G.nest) { tx = G.nest.x; tz = G.nest.z; ty = G.nest.y + 0.3; }
    else { if (A.st === 'climbUp' && (A.t2 -= dt) < 0) A.st = 'idle';
      A.ph += dt * (bat ? 0.9 : 0.42) * (A.idx % 2 ? -1 : 1); const R = bat ? 6 + A.idx * 2 : 13 + A.idx * 5, a = A.ph;
      tx = G.hx + Math.cos(a) * R; tz = G.hz + Math.sin(bat ? a * 2 : a) * R * (bat ? 0.6 : 1); ty = gy + alt + Math.sin(a * 1.7 + A.idx) * (bat ? 1.2 : 2.5); }
    const dx = tx - P.x, dy = ty - P.y, dz = tz - P.z, L = Math.hypot(dx, dz), landed = roost && L < 0.6 && Math.abs(dy) < 0.6;
    if (landed) { P.set(tx, ty, tz); A.root.rotation.set(0, A.rot, 0); badge(A, d < 30 ? '💤' : null); if (A.a.idle) A.anim.play(A.a.idle, 0.4); }
    else { badge(A, null); const sp = S.sp * (A.st === 'dive' ? 2 : 1), want = Math.atan2(dx, dz); A.rot = dampAngle(A.rot, want, A.kr, T.soft, dt, 2.4);
      const turn = Math.atan2(Math.sin(want - A.rot), Math.cos(want - A.rot)); P.x += Math.sin(A.rot) * sp * dt; P.z += Math.cos(A.rot) * sp * dt; P.y += Math.max(-sp, Math.min(sp * 0.6, dy * 1.5)) * dt;
      A.root.rotation.set(Math.max(-0.6, Math.min(0.6, -dy * 0.08)), A.rot, -Math.max(-0.7, Math.min(0.7, turn * 1.4)), 'YXZ');
      const act = A.anim.play(A.a.fly || A.a.idle, 0.3); if (act) act.timeScale = bat ? 1.6 : A.st === 'dive' ? 0.2 : 0.8; }
    if (Math.random() < dt * 0.03) say(S, d);
    stepAnim(A.anim, A.an, d, dt);
  }
  // thú & cá lớn ở biển: bơi vòng chậm quanh điểm nhà; cá voi nhô lưng thở, phun nước (vệt trắng), con non bơi cạnh mẹ; bạch tuộc bò đáy
  function stepSwimmer(A, dt, env, d) {
    const G = A.G, S = A.S, P = A.root.position;
    if (A.mom) { const Mo = A.mom.root.position, a = A.mom.rot; A.rot = A.mom.rot; P.x += (Mo.x - Math.sin(a) * S.s * 0.25 + Math.cos(a) * S.s * 0.3 - P.x) * Math.min(1, dt * 1.5); P.z += (Mo.z - Math.cos(a) * S.s * 0.25 - Math.sin(a) * S.s * 0.3 - P.z) * Math.min(1, dt * 1.5); P.y = Mo.y * 0.8 - 0.2; A.root.rotation.set(A.mom.root.rotation.x, A.rot, 0, 'YXZ'); }
    else {
      A.ph += dt * S.sp / (G.rad || (G.rad = S.bottom ? 3 : 10 + S.s * 1.4)) * (A.idx % 2 ? -1 : 1); const R = G.rad + A.idx * S.s * 0.9, a = A.ph + A.idx * 2.1, x = G.hx + Math.cos(a) * R, z = G.hz + Math.sin(a) * R * 0.75;
      let h = terrain.heightAt(x, z), y; if (!(h < 0)) h = -9;
      if (S.bottom) y = Math.min(-0.6, h + 0.05);
      else { const breach = S.deep ? Math.max(0, Math.sin(a * 3.1 + A.idx)) ** 6 : 0; y = -S.s * (S.cls === 'thu' ? 0.2 : 0.16) + breach * S.s * 0.16 + Math.sin(env.time * 0.6 + A.idx) * 0.12; A.pitch = -Math.cos(a * 3.1 + A.idx) * breach * 0.35;
        if (S.deep && breach > 0.9 && !A.blown) { A.blown = true; W.onEvent && W.onEvent('blow', S, A); say(S, d); } if (breach < 0.2) A.blown = false; y = Math.max(y, Math.min(-0.3, h + S.s * 0.25)); }
      const want = Math.atan2(x - P.x, z - P.z); if (Math.hypot(x - P.x, z - P.z) > 0.05) A.rot = dampAngle(A.rot, want, A.kr, T.soft, dt, 2);
      P.x += (x - P.x) * Math.min(1, dt * 2); P.z += (z - P.z) * Math.min(1, dt * 2); P.y += (y - P.y) * Math.min(1, dt * 1.5);
      A.root.rotation.set(A.pitch || 0, A.rot, A.rigid ? Math.sin(env.time * 2.4 + A.idx) * 0.06 : 0, 'YXZ');
      if (S.prey && (A.t -= dt) < 0) { A.t = rnd(21, 34); const Pg = groups.find(g => g.S.id === S.prey && g.on); if (Pg) { Pg.scare = 5; W.onEvent && W.onEvent('chase', S, A, Pg.S); } }
    }
    if (A.rigid) { A.pivot.rotation.y = (RY[S.m] || 0) + Math.sin(env.time * 2.6 + A.idx) * 0.12; return; }   // model không xương: quẫy cả thân
    const act = A.anim.play(A.a.swim || A.a.walk || A.a.idle, 0.3); if (act) act.timeScale = 0.8; stepAnim(A.anim, A.an, d, dt);
  }
  // ───────── săn mồi kiểu rượt đuổi KHÔNG máu me: rình → rượt → con mồi luôn thoát → thú săn đứng thở ─────────
  function scare(B, Pg, fx, fz) { const P = B.root.position, a = Math.atan2(P.x - fx, P.z - fz) + rnd(-0.5, 0.5); for (let r = 14; r > 3; r -= 3) { const x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (walkable(Pg, x, z)) { badge(B, null); setGo(B, x, z, 'escape', 3.1); return; } } }
  function hunts(dt, env) {
    for (const G of groups) {
      const S = G.S; if (!S.prey || !G.on || S.k !== 'w' || !G.lead || G.loading) continue;
      const H = G.lead, P = H.root.position;
      if (G.hunt) {
        const Pg = G.hunt.Pg, q = Pg.members[0] && Pg.members[0].root.position; G.hunt.t -= dt;
        if (!Pg.on || !q || G.hunt.t < 0) { H.st = 'pant'; H.go = false; H.t = 5; if (G.hunt.ran && env.dOf(H) < 55) W.onEvent && W.onEvent('escaped', S, H, Pg.S); G.hunt = null; continue; }
        const L = Math.hypot(q.x - P.x, q.z - P.z);
        if (!G.hunt.ran) { setGo(H, q.x, q.z, 'stalk', 0.55); H.pitch = 0.12; if (L < 13) { G.hunt.ran = true; G.hunt.t = 7; say(S, env.dOf(H)); for (const B of Pg.members) if (!B.mom) scare(B, Pg, P.x, P.z); W.onEvent && W.onEvent('hunt', S, H, Pg.S); } }
        else { setGo(H, q.x, q.z, 'chase', L < 4 ? 0.8 : 2.3); if (L < 6) for (const B of Pg.members) if (!B.mom && !B.go) scare(B, Pg, P.x, P.z); }   // con mồi luôn nhanh hơn (3,1× so với 2,3×) và được chạy tiếp
      } else if ((G.huntT = (G.huntT ?? rnd(13, 34)) - dt) < 0) {
        G.huntT = rnd(55, 89); if (!awakeNow(S, env.night, env.rain) || H.st === 'sleep') continue;
        const Pg = groups.find(g => g.S.id === S.prey && g.on && !g.loading && g.members.length && Math.hypot(g.hx - G.hx, g.hz - G.hz) < 70);
        if (Pg) G.hunt = { Pg, t: 21, ran: false };
      }
    }
  }
  // cây gần nhất cho loài leo trèo (dò 1 lần khi nhóm bật)
  function findTree(G) { if (G.treeDone) return; G.treeDone = true; let best = null, bd = 1e9; for (const c of ctx.colliders) { if (c.r < 0.25 || c.r > 1.4) continue; const dd = Math.hypot(c.x - G.hx, c.z - G.hz); if (dd < 16 && dd < bd && terrain.heightAt(c.x, c.z) > 0.6) { bd = dd; best = c; } } if (best) G.tree = { x: best.x, z: best.z, r: best.r, h: 2.6 }; }
  // tổ chim: ngày 0 ấp trứng (chim mẹ nằm tổ) · ngày 1 chim non há mỏ, bố mẹ bay đi bay về mớm mồi · ngày 2 chim non rời tổ
  function nests(env) { for (const G of groups) { if (!G.on || !G.nest || !G.eggs) continue; const ph = (env.day + G.id) % 3;
    if (G.nestPh !== ph) { G.nestPh = ph; G.eggs.visible = ph < 2; G.eggs.material = ph === 1 ? M_CHICK : M_EGG; G.eggs.scale.set(1, 1, 1); }
    if (ph === 1) G.eggs.scale.y = 1 + Math.sin(env.time * 8 + G.id) * 0.3; } }

  // ───────── vòng lặp ─────────
  const env = { p: null, night: 0, rain: false, rainSoon: false, time: 0, day: 0, shyK: 1, hide: null, dOf: A => A.d ?? 99, say, fedT: 0 };
  let loadT = 0, perfMs = 0, perfN = 0, evT = 0;
  function update(dt) {
    const t0 = performance.now(), p = ctx.player.pos;
    if (!W.ready) { if ((ctx.school && ctx.school.ready) || (loadT += dt) > 21) buildSites(); return; }
    const st = ctx.sky ? ctx.sky.state : { night: 0, day: 0 }, wt = ctx.weather ? ctx.weather.type : 'clear';
    env.p = p; env.night = st.night; env.day = st.day || 0; env.time += dt; env.rain = wt === 'rain' || wt === 'storm'; env.rainSoon = env.rain || wt === 'cloudy';
    W.season = ((env.day % 4) + 4) % 4;
    env.hide = hides.find(h => Math.hypot(h.x - p.x, h.z - p.z) < h.r) || null;
    const spd = ctx.player.speed || 0; env.shyK = env.hide ? 0.25 : spd > 7 ? 1.35 : spd < 3 ? 0.7 : 1;   // nấp trong chòi / đi rón rén thì thú ít sợ; chạy thì thú sợ từ xa
    if (ctx.player.frozen && ctx.mapOpen) return;
    if ((scanT -= dt) < 0) { scanT = 0.4; scan(p, env.night, env.rain); for (const G of groups) if (G.on && (G.S.beh || []).includes('climb')) findTree(G); }
    nests(env);
    flyover(dt, p, env.night); hunts(dt, env);
    for (let i = 0; i < actors.length; i++) stepActor(actors[i], dt, env);
    for (const G of groups) if (G.on && G.flock && !G.loading) { const F = G.flock; const k0 = env.shyK; env.shyK = k0 * G.shyK; env.fedT = G.fedT > 0 ? 1 : 0; F.update(dt, env.time, env); env.shyK = k0; env.fedT = 0; if (G.fedT > 0) G.fedT -= dt; }
    perfMs += performance.now() - t0; perfN++; if (perfN > 600) { perfMs /= 2; perfN /= 2; }
  }

  // ───────── API cho Sổ tay / ống nhòm / nhiệm vụ ─────────
  // mọi con đang hiện: gọi fn(S, x, y, z, bán kính, nhóm, con)
  W.each = fn => { for (const A of actors) if (A.root.visible) fn(A.S, A.root.position.x, A.root.position.y + A.size * 0.4, A.root.position.z, A.size, A.G, A); for (const G of groups) if (G.on && G.flock && !G.loading && (G.S.k !== 'v' || G.fly)) { const F = G.flock; for (const m of F.members) if (m.wy > -50) fn(G.S, m.x, m.wy, m.z, G.S.s, G, null); } };
  W.feed = (G, A) => { const S = G.S; G.shyK = 0.3; G.fedT = 8; if (A) { A.st = 'fed'; A.go = false; A.t = 5; badge(A, '❤️'); } say(S, 2); };
  W.groupCount = G => G.flock ? G.n : G.members.filter(A => !A.mom).length;
  W.perf = () => perfN ? perfMs / perfN : 0;
  // gỡ lỗi / tài liệu: xếp hàng mọi model trước mặt người chơi (docs/animals/lineup.png) — wild.lineup()
  W.lineup = async (cols = 9, gap = 3.4) => { const p = ctx.player.pos, seen = new Set(), list = []; for (const S of SPECIES) if (S.m && !seen.has(S.id)) { seen.add(S.id); list.push(S); }
    const out = []; for (let i = 0; i < list.length; i++) { const S = list[i], A = await makeActor({ S }, S.m, Math.min(2.4, Math.max(0.7, S.s))); if (!A) continue; const x = p.x + (i % cols - (cols - 1) / 2) * gap, z = p.z - 6 - Math.floor(i / cols) * gap; A.root.position.set(x, Math.max(terrain.heightAt(x, z), 0) + 0.02, z); A.root.rotation.y = 0; scene.add(A.root); A.anim.update(0.3); out.push({ id: S.id, m: S.m, x, z }); }
    return out; };
  W.update = update;
  return W;
}
