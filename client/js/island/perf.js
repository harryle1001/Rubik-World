// perf.js — Quản lý hiệu năng chung (không sửa file của khu khác):
//  · Viền toon (outline) trước đây luôn vẽ (frustumCulled = false) → bật lại cắt theo khung hình; viền ở xa > 34 m
//    mỏng dưới 1 điểm ảnh (dày 2,2 cm) nên ẩn hẳn.
//  · Vật nhỏ ở xa: ẩn khi khoảng cách tới camera > max(34, 89·bán kính) (Fibonacci) — vật cỡ 1 m mất ở ~89 m, còn ~13 px.
//    InstancedMesh từ scatterModel mang userData.itemR (bán kính 1 vật) → cả ô 55 m ẩn khi điểm gần nhất của ô đủ xa.
//  · Người/thú có xương (SkinnedMesh, trước luôn vẽ): cắt theo khung hình bằng hình cầu bao nới rộng φ lần.
//  · Vật < 1 m không đổ bóng (bóng đổ của vật nhỏ gần như không thấy, nhưng tốn 1 draw call ở pass bóng);
//    điện thoại: bán kính < 1/φ ≈ 0,62 m (cả InstancedMesh không ghi itemR: lấy cỡ 1 vật từ hình cầu bao lưới × tỉ lệ instance đầu).
//  · Bay/khinh khí cầu cao (camera cách mặt đất/biển > 21 m, Fibonacci): vật nhỏ ẩn sớm hơn 1/φ lần; điện thoại: sương kéo gần
//    dần còn 1/√φ (296 → 233 m; cây xa, công trình xa tự ẩn theo sương) — từ trên cao thấy nhiều cảnh hơn hẳn, xa hơn chỉ là vệt mờ trong sương.
// Ẩn bằng layers (không đụng .visible mà file khác đang điều khiển). Quét cảnh tìm vật mới mỗi 3 s (chỉ gom, rẻ; lần đầu sau 1,5 s đăng ký hết ngay);
// xét khoảng cách XOAY VÒNG: mỗi khung 1 phần danh sách (60 FPS: 1/12) → mỗi vật ~0,2 s xét 1 lần, không dồn cả danh sách vào 1 khung (hết giật định kỳ).
//  · Đóng băng ma trận vật đứng yên: ~3 300 Object3D, mỗi khung three tính lại matrix + matrixWorld cho TẤT CẢ (≈ 6 ms/khung khi CPU
//    chậm 4×). Vật không đổi vị trí/góc/tỉ lệ qua 2 lần quét (≥ 2 s) → matrixAutoUpdate = false; mỗi khung so 10 số với ảnh chụp (mỗi khung 1 nửa danh sách),
//    lệch → bật lại (trễ ≤ 1 khung) (file khác vẫn đặt position/rotation như cũ, không cần biết gì về việc này).
import * as THREE from 'three';
import { PHI } from './layout.js';
import { CFG } from './config.js';
import { instancedTwin } from './style.js';
import { canSplit, split, check as splitCheck } from './split.js';
import { shrinkCanvas } from './gltf-tex.js';

const HIGH = 21, FOG_HIGH = 1 / Math.sqrt(PHI);   // độ cao coi là "trên cao" (m) · hệ số sương khi bay cao (điện thoại)
const FAR_K = 89, FAR_MIN = 34, OUTLINE_D = 34, SMALL_R = 1.6;   // ngưỡng Fibonacci; SMALL_R ≈ φ m
const NOSHADOW_R = CFG.isMobile ? 1 / PHI : 0.5;                  // vật nhỏ hơn: không đổ bóng
const _m = new THREE.Matrix4(), _sc = new THREE.Vector3();
const _s = new THREE.Sphere(), _v = new THREE.Vector3();
const DEPTH = new Map(), NOSPLIT = /[?&]nosplit/.test(location.search);   // ?nosplit: so sánh khi đo

export function createPerf(ctx) {
  const { scene, camera } = ctx, list = [], ins = [], pts = [];
  function register(o) {
    const ud = o.userData; if (ud._pf) return; ud._pf = 1;
    if (o.isPoints && o.geometry && o.geometry.attributes.position) { pts.push({ o, ver: -1, h: false }); return; }
    if (!(o.isMesh)) return;
    const g = o.geometry; if (!g || !g.attributes.position) return;
    if (CFG.isMobile && o.material) for (const m of [].concat(o.material)) if (m.map && m.map.isCanvasTexture) shrinkCanvas(m.map);   // biển chữ canvas lớn: ½ trên điện thoại (gltf-tex.js)
    if (o.isInstancedMesh && !Array.isArray(o.material)) o.material = instancedTwin(o.material);   // vật liệu dùng chung với Mesh thường → bản riêng (style.js)
    // pass bóng đổ: three dùng 1 vật liệu chiều sâu cho mọi vật → đổi chương trình mỗi lần xen kẽ lưới thường/instanced/có xương; mỗi kiểu 1 bản riêng
    //   (bỏ qua vật liệu cắt alpha / displacement: three cần bản chiều sâu riêng theo từng vật liệu để giữ hình lá, hoa…)
    const mt = o.material;
    if ((o.isInstancedMesh || o.isSkinnedMesh) && !o.customDepthMaterial && mt && !Array.isArray(mt) && !(mt.alphaTest > 0) && !mt.alphaMap && !mt.displacementMap) {
      const k = (o.isSkinnedMesh ? 's' : o.instanceColor ? 'c' : 'i') + (mt.map ? 'm' : '');
      o.customDepthMaterial = DEPTH.get(k) || DEPTH.set(k, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })).get(k);   // giống vật liệu mặc định của WebGLShadowMap
    }
    if (o.isSkinnedMesh) {
      if (!o.frustumCulled) {   // hình cầu bao theo tư thế hiện tại, nới rộng φ lần (tay chân vung, chạy nhảy)
        try { o.computeBoundingSphere(); o.boundingSphere.radius *= PHI; o.frustumCulled = true; } catch (e) { return; }
      }
      list.push({ o, kind: ud.outline ? 'outline' : 'skin' }); return;
    }
    if (ud.outline) { o.frustumCulled = true; list.push({ o, kind: 'outline' }); return; }
    // InstancedMesh đang 0 bản sao (đồ tạm ẩn, hiệu ứng chưa chạy…): three vẫn gọi 1 lần vẽ rỗng mỗi khung (+ pass bóng) → ẩn mỗi khung (update)
    const ie = o.isInstancedMesh ? { o, far: false } : null; if (ie) ins.push(ie);
    if (!o.frustumCulled) {   // vật cố ý luôn vẽ (bầu trời, nước, hiệu ứng) — giữ nguyên; bộ bản sao di chuyển (chim, thuyền, người LOD…): ẩn khi bản sao gần nhất > 89 m
      if (ie && o.count <= 4096) list.push(Object.assign(ie, { kind: 'iset', ver: -1, n: -1, P: null, r: 0, min: 89 }));
      return;
    }
    if (o.isInstancedMesh) {
      if (ud.itemR === undefined) {   // InstancedMesh phủ rộng không rõ cỡ từng vật → xét bóng đổ (điện thoại) + ẩn cả bộ khi mọi bản sao đều xa
        if (CFG.isMobile && o.castShadow && o.count > 0) { if (!g.boundingSphere) g.computeBoundingSphere(); o.getMatrixAt(0, _m); _sc.setFromMatrixScale(_m); if (g.boundingSphere.radius * Math.max(_sc.x, _sc.y, _sc.z) * o.matrixWorld.getMaxScaleOnAxis() < NOSHADOW_R) o.castShadow = false; }
        if (o.count <= 4096) list.push(Object.assign(ie, { kind: 'iset', ver: -1, n: -1, P: null, r: 0, min: FAR_MIN }));   // bộ rải khắp đảo (vòng mốc, pha lê, đèn…): khung hình luôn chạm hình cầu bao lớn → 1 lần vẽ mỗi khung dù bản sao gần nhất ở rất xa
        return;
      }
      if (ud.itemR < NOSHADOW_R) o.castShadow = false;
      if (ud.itemR < SMALL_R) list.push(Object.assign(ie, { kind: 'inst', r: ud.itemR }));
      return;
    }
    if (!g.boundingSphere) g.computeBoundingSphere();
    const r = g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis();
    if (r < NOSHADOW_R) o.castShadow = false;
    if (r < SMALL_R && !o.isSprite) list.push({ o, kind: 'small', r });
  }
  // quét: chỉ gom vật CHƯA đăng ký (rẻ); đăng ký (tính hình cầu bao…) tối đa 1,5 ms/khung → không dồn vài chục ms vào 1 khung
  const pending = [];
  // ---- chia khối gộp lớn thành ô (split.js): chạy dần, ≤ 2 ms/khung (lúc màn che vào game: không giới hạn) ----
  const splitQ = []; let job = null, jobO = null, lastDt = 1 / 60;
  function splitStep() {
    const t0 = performance.now(), B = ctx.loading && ctx.loading.veil ? 50 : Math.max(2, lastDt * 100);   // ≤ 1/10 thời gian khung (máy chậm vẫn chia xong trong vài giây)
    while (performance.now() - t0 < B) {
      if (!job) { jobO = splitQ.shift(); if (!jobO) return; if (!jobO.parent || !jobO.userData._fz || !canSplit(jobO)) { jobO.userData._spq = 0; job = null; continue; } job = split(jobO); }
      if (job.next().done) { if (jobO.userData._sp && jobO.userData._sp.g) jobO.userData._sp.g.dispose(); else jobO.userData._spq = 0; job = null; }   // GPU: bỏ bộ đệm của hình học gốc (giữ bản CPU để hoàn lại nếu cần)
    }
  }
  // ---- đóng băng ma trận ----
  const frozen = [], cand = new Map();   // cand: vật → ảnh chụp lần quét trước
  const snap = (o, a) => { const p = o.position, q = o.quaternion, s = o.scale; a[0] = p.x; a[1] = p.y; a[2] = p.z; a[3] = q.x; a[4] = q.y; a[5] = q.z; a[6] = q.w; a[7] = s.x; a[8] = s.y; a[9] = s.z; return a; };
  const same = (o, a) => { const p = o.position, q = o.quaternion, s = o.scale; return p.x === a[0] && p.y === a[1] && p.z === a[2] && q.x === a[3] && q.y === a[4] && q.z === a[5] && q.w === a[6] && s.x === a[7] && s.y === a[8] && s.z === a[9]; };
  // bản cho vòng lặp mỗi khung: giữ sẵn Vector3/Quaternion (một kiểu → JIT nội tuyến được, không tra o.position trên hàng chục kiểu Object3D)
  const still = e => { const p = e.v, q = e.q, s = e.s, a = e.a; return p.x === a[0] && p.y === a[1] && p.z === a[2] && q._x === a[3] && q._y === a[4] && q._z === a[5] && q._w === a[6] && s.x === a[7] && s.y === a[8] && s.z === a[9]; };
  function freezeScan(o) {
    const ud = o.userData; if (ud._fz || !o.matrixAutoUpdate || o.isCamera || o.isBone) return;   // xương: hoạt ảnh đổi liên tục
    const a = cand.get(o);
    if (!a) { cand.set(o, snap(o, new Float64Array(10))); return; }
    if (!same(o, a)) { snap(o, a); return; }
    cand.delete(o); o.updateMatrix(); o.matrixAutoUpdate = false; ud._fz = 1; frozen.push({ o, a, p: o.parent, v: o.position, q: o.quaternion, s: o.scale });
  }
  const unfreeze = (i) => { const o = frozen[i].o; o.matrixAutoUpdate = true; o.matrixWorldNeedsUpdate = true; o.userData._fz = 0; frozen[i] = frozen[frozen.length - 1]; frozen.pop(); };
  let half = 0;
  function thaw() {   // vật đã đóng băng bị dời/xoay/đổi cỡ (hoặc gỡ khỏi cảnh) → trả về tự cập nhật; mỗi khung xét 1 nửa (chẵn/lẻ) → trễ ≤ 1 khung lúc vật bắt đầu chuyển động
    half ^= 1;
    for (let i = frozen.length - 1 - half; i >= 0; i -= 2) {
      const e = frozen[i], o = e.o;
      if (o.parent === e.p && still(e)) continue;   // gắn sang cha khác → tính lại
      unfreeze(i);
    }
  }
  let scanId = 0;
  const scan = () => {
    const id = ++scanId; scene.traverse(o => { const u = o.userData; u._sc = id; if (!u._pf && !u._pq) { u._pq = 1; pending.push(o); } freezeScan(o);
      if (u._sp) { if (u._sp.g) splitCheck(o); } else if (u._fz && !u._spq && o.isMesh && !NOSPLIT && canSplit(o)) { u._spq = 1; splitQ.push(o); } });
    for (let i = frozen.length - 1; i >= 0; i--) if (frozen[i].o.userData._sc !== id) unfreeze(i);   // cả nhánh đã gỡ khỏi cảnh: thả ra, không giữ tham chiếu
    for (const o of cand.keys()) if (o.userData._sc !== id) cand.delete(o);
  };
  const cam = new THREE.Vector3();
  function hide(o, h) {
    const L = o.layers;
    if (h) { if (L.mask !== 0) { o.userData._pm = L.mask; L.mask = 0; } }
    else if (L.mask === 0 && o.userData._pm !== undefined) L.mask = o.userData._pm;
  }
  // bộ InstancedMesh: khoảng cách tới bản sao gần nhất (tâm bản sao lưu sẵn, tính lại khi instanceMatrix đổi); e.r = bán kính bản sao lớn nhất
  function nearInst(e) {
    const o = e.o, n = o.count, im = o.instanceMatrix;
    if (im.version !== e.ver || n !== e.n) {
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const gs = g.boundingSphere, a = im.array, W = o.matrixWorld.elements, ws = o.matrixWorld.getMaxScaleOnAxis();
      if (!e.P || e.P.length < n * 4) e.P = new Float32Array(Math.max(4, n * 4)); let rm = 0;
      for (let i = 0; i < n; i++) { const b = i * 16, cx = gs.center.x, cy = gs.center.y, cz = gs.center.z;
        const x = a[b] * cx + a[b + 4] * cy + a[b + 8] * cz + a[b + 12], y = a[b + 1] * cx + a[b + 5] * cy + a[b + 9] * cz + a[b + 13], z = a[b + 2] * cx + a[b + 6] * cy + a[b + 10] * cz + a[b + 14];
        e.P[i * 4] = W[0] * x + W[4] * y + W[8] * z + W[12]; e.P[i * 4 + 1] = W[1] * x + W[5] * y + W[9] * z + W[13]; e.P[i * 4 + 2] = W[2] * x + W[6] * y + W[10] * z + W[14];
        const r = gs.radius * ws * Math.sqrt(Math.max(a[b] * a[b] + a[b + 1] * a[b + 1] + a[b + 2] * a[b + 2], a[b + 4] * a[b + 4] + a[b + 5] * a[b + 5] + a[b + 6] * a[b + 6], a[b + 8] * a[b + 8] + a[b + 9] * a[b + 9] + a[b + 10] * a[b + 10]));
        e.P[i * 4 + 3] = r; if (r > rm) rm = r; }
      e.ver = im.version; e.n = n; e.r = rm;
    }
    let d = 1e9; for (let i = 0; i < n; i++) { const P = e.P, j = i * 4, dx = P[j] - cam.x, dy = P[j + 1] - cam.y, dz = P[j + 2] - cam.z, q = Math.sqrt(dx * dx + dy * dy + dz * dz) - P[j + 3]; if (q < d) d = q; }
    return Math.max(0, d);
  }
  function near(o) {   // khoảng cách từ camera tới điểm gần nhất của hình cầu bao
    if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); _s.copy(o.boundingSphere); }
    else if (o.isSkinnedMesh && o.boundingSphere) _s.copy(o.boundingSphere);
    else { const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); _s.copy(g.boundingSphere); }
    _s.applyMatrix4(o.matrixWorld); return Math.max(0, _s.center.distanceTo(cam) - _s.radius);
  }
  let tScan = 1.5, cur = 0, first = true, tCheck = 0.2, fogK = 1;
  function fogByAlt(dt) {   // sau weather/dive (ocean.js): weather đặt lại sương mỗi khung → nhân hệ số không bị cộng dồn
    const F = scene.fog; if (!CFG.isMobile || !F || ctx.underwater || document.body.classList.contains('mg-on')) return;
    fogK += ((ctx.high ? FOG_HIGH : 1) - fogK) * Math.min(1, dt * 0.618);   // đổi dần ~1,6 s, không thấy "bật" sương
    if (fogK < 0.999) { F.near *= fogK; F.far *= fogK; }   // mặt cắt xa giữ nguyên: vòm trời (bán kính 400/φ ≈ 247 m) bám người chơi, cắt gần hơn sẽ thủng trời
  }
  function update(dt) {
    thaw();
    if ((tScan += dt) > 3) { tScan = 0; scan(); }
    const t0 = performance.now(), budget = first ? 1e9 : 1.5; if (pending.length) first = false;   // lần quét đầu (đang vào game): đăng ký hết ngay
    while (pending.length && performance.now() - t0 < budget) { const o = pending.pop(); delete o.userData._pq; register(o); }   // ≤ 1,5 ms/khung
    lastDt = dt; if (job || splitQ.length) splitStep();
    camera.getWorldPosition(cam);
    if ((tCheck += dt) >= 0.2) {   // độ cao camera: 0,2 s/lần
      tCheck = 0; const g = ctx.terrain ? Math.max(ctx.terrain.heightAt(cam.x, cam.z), CFG.island.waterLevel) : 0;
      ctx.camAlt = cam.y - g; ctx.high = ctx.camAlt > HIGH && !ctx.underwater;   // terrain.js/vehicles: LOD theo độ cao
    }
    fogByAlt(dt);
    // hạt (Points) đang "cất" dưới đất (mọi điểm y < −50: bụi chân, bọt nước, tia lửa… lúc không dùng) → không vẽ; tính lại khi vị trí đổi
    for (let i = pts.length - 1; i >= 0; i--) { const e = pts[i], o = e.o; if (!o.parent) { pts[i] = pts[pts.length - 1]; pts.pop(); continue; }
      const A = o.geometry.attributes.position; if (!A || A.version === e.ver && !e.dirty) continue; e.ver = A.version;
      const W = o.matrixWorld.elements, n = Math.min(A.count, o.geometry.drawRange.count); let low = n > 0;
      for (let j = 0; j < n && low; j++) if (W[1] * A.getX(j) + W[5] * A.getY(j) + W[9] * A.getZ(j) + W[13] > -50) low = false;
      if (low !== e.h) { e.h = low; hide(o, low); } }
    for (let i = ins.length - 1; i >= 0; i--) { const e = ins[i], o = e.o; if (!o.parent) { ins[i] = ins[ins.length - 1]; ins.pop(); continue; } const h = e.far || o.count === 0; if (h !== e.h) { e.h = h; hide(o, h); } }
    if (!list.length) return;
    const k = (ctx.underwater ? 0.5 : ctx.high ? 1 / PHI : 1) * (ctx.perfScale || 1);   // dưới nước nhìn gần hơn; bay cao/chất lượng thấp: ẩn sớm hơn
    let n = Math.ceil(list.length * Math.min(1, dt / 0.2));   // phần danh sách tỉ lệ thời gian: mỗi vật ~0,2 s xét 1 lần dù FPS cao/thấp
    while (n-- > 0 && list.length) {
      if (cur >= list.length) cur = 0;
      const i = cur++, e = list[i], o = e.o;
      if (!o.parent) { hide(o, false); list.splice(i, 1); cur--; continue; }   // vật đã bị gỡ khỏi cảnh
      if (e.kind === 'iset') { if (o.count) e.far = nearInst(e) > Math.max(e.min, FAR_K * e.r) * k; continue; }
      const d = near(o);
      if (e.kind === 'inst') { e.far = d > Math.max(FAR_MIN, FAR_K * e.r) * k; continue; }
      if (e.kind === 'outline') hide(o, d > OUTLINE_D * k);
      else if (e.kind === 'skin') hide(o, d > FAR_K * k);
      else hide(o, d > Math.max(FAR_MIN, FAR_K * e.r) * k);
    }
  }
  return { update, scan, list, frozen, splitQ };
}
