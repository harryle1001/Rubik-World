// vrm/vrm-npc.js — Học sinh / thầy cô NPC hiện dạng anime VRM khi ở gần (LOD theo khoảng cách, nhịp Fibonacci):
//   < 5 m: VRM bộ mobile đủ (SpringBone, biểu cảm, chi tiết mắt) · 5–21 m: VRM mobile "lite" (chỉ xương chính, không viền
//   mắt/đũa) · > 21 m: người chibi cũ. Tối đa 5 VRM cùng lúc trên điện thoại (8 trên máy tính), gần nhất trước.
// Không sửa code NPC cũ: loadHero (characters.js) báo mỗi người mới qua setNpcHook; VRM gắn làm con của model chibi,
// chibi ẩn lưới, mọi lệnh animation (play/update) được chép sang VRM → đi/chạy/ngồi/vẫy… khớp nhau.
// Ở Học viện Pha Lê: đồng phục phù thuỷ (màu nhà ngẫu nhiên), thầy cô áo choàng xanh than viền vàng;
// ở Trường Rubik: đồng phục VRoid + khăn quàng đỏ, thầy giáo gile + cà vạt (Fumiriya).
import * as THREE from 'three';
import { CFG } from '../config.js';
import { setNpcHook } from '../characters.js';
import { loadVrmHero, HAIR, EYES } from './vrm-hero.js';
import { prefetch } from './vrm-core.js';
import { weakDevice } from './avatar.js';
import { ACADEMY } from '../layout.js';

const HOUSE_IDS = ['long', 'phung', 'lan', 'quy'];
export function createVrmNpc(ctx) {
  // điện thoại: mỗi VRM ≈ 12–16 lưới có xương (≈ 16 draw call + pass bóng) → 5 bạn VRM ≈ 80 call, đẩy quảng trường/bay chổi lên 236–266 call
  // → tối đa 2 bạn trong 13 m (Fibonacci); kho VRM giữ 2×MAX bản đã parse (đi qua lại không parse lại → không khựng); nạp thưa ≥ 3 s/lần
  const M = CFG.isMobile, MAX = +(new URLSearchParams(location.search).get('vrmMax') || (M ? 2 : 8)), NEAR = 5, FAR = M ? 13 : 21, HY = 2, POOL = M ? MAX * 2 + 1 : MAX, GAP = M ? 3 : 0;
  let lastLoad = -1e9;
  const st = { on: !weakDevice(), attached: 0, loads: 0, loadMs: 0, n: 0 };
  const reg = []; let seq = 0, loading = false, t = 0;
  const pool = new Map();   // VRM đã tháo, dùng lại theo kiểu (không parse lại)
  setNpcHook((hero, kind, look, height) => {
    const role = (look && look.role) || 'student'; if (role !== 'student' && role !== 'teacher') return;
    const e = { hero, kind, role, height, seed: seq++, vrm: null, key: null, d: 1e9, hidden: [], saved: null };
    const A = hero.anim, play = A.play.bind(A), upd = A.update;
    A.play = (n, fade, once) => { const a = play(n, fade, once); if (e.vrm) e.vrm.anim.play(n, fade, once); return a; };
    A.update = dt => { if (e.parked) { e.parked = false; reg.push(e); } upd(dt); if (e.vrm) sync(e, dt); };   // người được gắn lại vào cảnh (hoạt ảnh chạy tiếp) → vào lại danh sách
    reg.push(e); st.n = reg.length;
  });
  const inScene = o => { for (let p = o; p; p = p.parent) { if (p === ctx.scene) return true; if (!p.visible) return false; } return false; };
  const lookOf = e => {
    const p = e.hero.model.getWorldPosition(new THREE.Vector3()), acad = ctx.zoneAt && ctx.zoneAt(p.x, p.z) === ACADEMY.name, f = /female/.test(e.kind), s = e.seed;
    if (e.role === 'teacher') return { base: f ? 'victoria' : 'fumiriya', hairStyle: f ? ['shino', 'dshibu', 'victoria'][s % 3] : ['fumiriya', 'hair-m'][s % 2], role: 'teacher', robe: acad, hat: acad && s % 2 === 0, glasses: s % 3 ? 'none' : 'square', hair: f ? HAIR[(s + 1) % 3] : HAIR[[0, 1, 7][s % 3]], wand: acad };
    const hs = f ? ['victoria', 'vivi', 'shino', 'shibu', 'dshibu', 'vita'] : ['hair-m', 'fumiriya', 'vita', 'shibu'];
    return { base: f ? ['victoria', 'vivi', 'shino'][s % 3] : 'hair-m', hairStyle: hs[(s * 5 + 2) % hs.length], hScale: 0.94 + (s * 7 % 13) / 100, house: HOUSE_IDS[s % 4], outfit: acad ? 'wizard' : 'school', hair: HAIR[s % 6], eye: EYES[s % 6], skin: s % 3, glasses: s % 5 === 1 ? 'round' : s % 7 === 3 ? 'square' : 'none', hat: acad && s % 3 === 0, wand: acad };
  };
  const keyOf = L => [L.base, L.hairStyle, L.role, L.house, L.outfit, L.robe, L.hat, L.glasses, L.hair, L.skin].join('|');
  function sync(e, dt) {
    const v = e.vrm, ca = e.hero.anim.current; v.happyUntil = e.hero.happyUntil || 0;
    if (ca) { const n = ca.getClip().name, va = v.anim.actions[n]; if (va && v.anim.current !== va) v.anim.play(n, 0.2); if (va) va.timeScale = ca.timeScale; }
    v.anim.update(dt);
  }
  function attach(e, v) {
    const m = e.hero.model; e.hidden = []; m.traverse(o => { if (o.isMesh && o.visible) { e.hidden.push(o); o.visible = false; } });
    v.model.scale.setScalar(1 / (m.scale.x || 1)); v.model.position.set(0, 0, 0); v.model.rotation.set(0, 0, 0); m.add(v.model);
    e.saved = e.hero.outlines; e.hero.outlines = v.outlines; for (const o of v.outlines) o.visible = e.hero.outlineOn !== false; v._ol = undefined;
    v.model.updateMatrixWorld(true); if (v.vrm.springBoneManager) v.vrm.springBoneManager.reset();
    const ca = e.hero.anim.current; if (ca) v.anim.play(ca.getClip().name, 0);
    e.vrm = v; st.attached++;
  }
  function detach(e) {
    const v = e.vrm; if (!v) return; e.vrm = null; st.attached--;
    v.model.removeFromParent(); for (const o of e.hidden) o.visible = true; e.hidden = [];
    if (e.saved) { e.hero.outlines = e.saved; for (const o of e.saved) o.visible = e.hero.outlineOn !== false; e.saved = null; }
    const list = pool.get(e.key) || []; list.push(v); pool.set(e.key, list);
    let n = 0; for (const l of pool.values()) n += l.length; if (n > POOL) { for (const [k, l] of pool) if (l.length) { l.shift().dispose(); break; } }
  }
  async function load(e) {
    loading = true; lastLoad = performance.now(); const L = lookOf(e), k = keyOf(L), t0 = performance.now();
    try {
      let v = (pool.get(k) || []).pop();
      if (!v) { v = await loadVrmHero(L, { set: 'mobile', height: Math.max(1.42, Math.min(1.8, e.height * (e.role === 'teacher' ? 1.05 : 1.16) * (L.hScale || 1))) }); st.loads++; st.loadMs = Math.round(performance.now() - t0); }
      v.npc = true; v.setWand(!!L.wand);
      const ok = st.on && inScene(e.hero.model) && e.d < FAR + HY && st.attached < cap;
      if (ok) { e.key = k; attach(e, v); } else { const l = pool.get(k) || []; l.push(v); pool.set(k, l); }
    } catch (err) { console.warn('VRM NPC', err); e.fail = true; }
    loading = false;
  }
  const P = new THREE.Vector3(), Q = new THREE.Vector3();
  // Điện thoại: số NPC anime tự co theo draw call thật của khung (≤ 233): đo 1 khung mỗi giây, vượt → bớt 1 VRM (về chibi), dư nhiều → thêm lại
  let cap = MAX, capT = 0;
  function budget(dt) {
    if (!M || !ctx.post || (capT += dt) < 1) return; capT = 0;
    const I = ctx.renderer.info, ar = I.autoReset, post = ctx.post, r = post.render;
    post.render = function () { post.render = r; I.autoReset = false; I.reset(); r.call(this); const c = I.render.calls; I.autoReset = ar; if (c > 233 && cap > 0) cap--; else if (c < 178 && cap < MAX) cap++; };
  }
  function update(dt) {
    budget(dt);
    t += dt; if (t < 0.25) { for (const e of reg) if (e.vrm) lod(e); return; } t = 0;
    // người đã rời cảnh hẳn (khu xa dỡ ra): bỏ khỏi danh sách → không giữ cả nhóm khu đã dỡ trong bộ nhớ
    for (let i = reg.length - 1; i >= 0; i--) { const e = reg[i]; let r = e.hero.model; while (r.parent) r = r.parent; if (r === ctx.scene) continue; if (e.vrm) detach(e); e.parked = true; reg[i] = reg[reg.length - 1]; reg.pop(); }
    st.n = reg.length;
    const me = ctx.player && ctx.player.hero; P.copy(ctx.player ? ctx.player.pos : ctx.camera.position);
    for (const e of reg) { e.d = st.on && e.hero !== me && !e.fail && inScene(e.hero.model) ? e.hero.model.getWorldPosition(Q).distanceTo(P) : 1e9; }
    const order = reg.filter(e => e.d < FAR + (e.vrm ? HY : 0)).sort((a, b) => a.d - b.d).slice(0, cap), want = new Set(order);
    for (const e of reg) if (e.vrm && !want.has(e)) detach(e);
    if (!loading && performance.now() - lastLoad > GAP * 1000) { const next = order.find(e => !e.vrm); if (next) load(next); }
    for (const e of reg) if (e.vrm) lod(e);
  }
  function lod(e) {
    const v = e.vrm, near = e.d < NEAR + (v.vrmMode === 'full' ? 1 : 0);
    v.setLod(near ? 'full' : 'lite'); if (v.wandOn !== undefined) v.setWand(v.wandOn);
    if (M) { const ol = near && e.hero.outlineOn !== false; if (v._ol !== ol) { v._ol = ol; for (const o of v.outlines) o.visible = ol; } }   // điện thoại: viền VRM (thêm 1 lưới có xương mỗi phần) chỉ khi ở gần
    const sh = e.d < 13; if (v._sh !== sh) { v._sh = sh; v.model.traverse(o => { if (o.isMesh && o.userData.cast0 === undefined) o.userData.cast0 = o.castShadow; if (o.isMesh) o.castShadow = sh && o.userData.cast0; }); }
  }
  // tải trước file VRM mobile (mạng) 5 s SAU khi màn che mở (trước: lúc còn màn che → 3,8 MB tranh băng thông với model khu đang nạp, 4G vào chơi chậm ~3 s); parse khi cần
  let lift = 0; const iv = setInterval(() => { if (!ctx.warmed || ctx.loading && ctx.loading.veil) { lift = 0; return; } if (++lift < 5) return; clearInterval(iv); const c = navigator.connection; if (st.on && !(c && (c.saveData || /2g|3g/.test(c.effectiveType || '')))) for (const id of ['victoria', 'vivi', 'hair-m']) prefetch(id, 'mobile'); }, 1000);   // mạng yếu / tiết kiệm dữ liệu: chỉ tải khi gặp
  return Object.assign(st, { update, reg, setOn(on) { st.on = on; if (!on) for (const e of reg) detach(e); } });
}
