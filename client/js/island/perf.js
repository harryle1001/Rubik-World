// perf.js — Quản lý hiệu năng chung (không sửa file của khu khác):
//  · Viền toon (outline) trước đây luôn vẽ (frustumCulled = false) → bật lại cắt theo khung hình; viền ở xa > 34 m
//    mỏng dưới 1 điểm ảnh (dày 2,2 cm) nên ẩn hẳn.
//  · Vật nhỏ ở xa: ẩn khi khoảng cách tới camera > max(34, 89·bán kính) (Fibonacci) — vật cỡ 1 m mất ở ~89 m, còn ~13 px.
//    InstancedMesh từ scatterModel mang userData.itemR (bán kính 1 vật) → cả ô 55 m ẩn khi điểm gần nhất của ô đủ xa.
//  · Người/thú có xương (SkinnedMesh, trước luôn vẽ): cắt theo khung hình bằng hình cầu bao nới rộng φ lần.
//  · Vật < 1 m không đổ bóng (bóng đổ của vật nhỏ gần như không thấy, nhưng tốn 1 draw call ở pass bóng);
//    điện thoại: bán kính < 1/φ ≈ 0,62 m (cả InstancedMesh không ghi itemR: lấy cỡ 1 vật từ hình cầu bao lưới × tỉ lệ instance đầu).
// Ẩn bằng layers (không đụng .visible mà file khác đang điều khiển). Quét cảnh tìm vật mới mỗi 2 s, xét khoảng cách mỗi 0,2 s.
//  · Đóng băng ma trận vật đứng yên: ~3 300 Object3D, mỗi khung three tính lại matrix + matrixWorld cho TẤT CẢ (≈ 6 ms/khung khi CPU
//    chậm 4×). Vật không đổi vị trí/góc/tỉ lệ qua 2 lần quét (≥ 2 s) → matrixAutoUpdate = false; mỗi khung so 10 số với ảnh chụp (mỗi khung 1 nửa danh sách),
//    lệch → bật lại (trễ ≤ 1 khung) (file khác vẫn đặt position/rotation như cũ, không cần biết gì về việc này).
import * as THREE from 'three';
import { PHI } from './layout.js';
import { CFG } from './config.js';
import { instancedTwin } from './style.js';

const FAR_K = 89, FAR_MIN = 34, OUTLINE_D = 34, SMALL_R = 1.6;   // ngưỡng Fibonacci; SMALL_R ≈ φ m
const NOSHADOW_R = CFG.isMobile ? 1 / PHI : 0.5;                  // vật nhỏ hơn: không đổ bóng
const _m = new THREE.Matrix4(), _sc = new THREE.Vector3();
const _s = new THREE.Sphere(), _v = new THREE.Vector3();
const DEPTH = new Map();

export function createPerf(ctx) {
  const { scene, camera } = ctx, list = [];
  function register(o) {
    const ud = o.userData; if (ud._pf) return; ud._pf = 1;
    if (!(o.isMesh)) return;
    const g = o.geometry; if (!g || !g.attributes.position) return;
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
    if (!o.frustumCulled) return;   // vật cố ý luôn vẽ (bầu trời, nước, hiệu ứng) — giữ nguyên
    if (o.isInstancedMesh) {
      if (ud.itemR === undefined) {   // InstancedMesh phủ rộng không rõ cỡ từng vật → chỉ xét bóng đổ (điện thoại)
        if (CFG.isMobile && o.castShadow && o.count > 0) { if (!g.boundingSphere) g.computeBoundingSphere(); o.getMatrixAt(0, _m); _sc.setFromMatrixScale(_m); if (g.boundingSphere.radius * Math.max(_sc.x, _sc.y, _sc.z) * o.matrixWorld.getMaxScaleOnAxis() < NOSHADOW_R) o.castShadow = false; }
        return;
      }
      if (ud.itemR < NOSHADOW_R) o.castShadow = false;
      if (ud.itemR < SMALL_R) list.push({ o, kind: 'inst', r: ud.itemR });
      return;
    }
    if (!g.boundingSphere) g.computeBoundingSphere();
    const r = g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis();
    if (r < NOSHADOW_R) o.castShadow = false;
    if (r < SMALL_R && !o.isSprite) list.push({ o, kind: 'small', r });
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
    const id = ++scanId; scene.traverse(o => { o.userData._sc = id; register(o); freezeScan(o); });
    for (let i = frozen.length - 1; i >= 0; i--) if (frozen[i].o.userData._sc !== id) unfreeze(i);   // cả nhánh đã gỡ khỏi cảnh: thả ra, không giữ tham chiếu
    for (const o of cand.keys()) if (o.userData._sc !== id) cand.delete(o);
  };
  const cam = new THREE.Vector3();
  function hide(o, h) {
    const L = o.layers;
    if (h) { if (L.mask !== 0) { o.userData._pm = L.mask; L.mask = 0; } }
    else if (L.mask === 0 && o.userData._pm !== undefined) L.mask = o.userData._pm;
  }
  function near(o) {   // khoảng cách từ camera tới điểm gần nhất của hình cầu bao
    if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); _s.copy(o.boundingSphere); }
    else if (o.isSkinnedMesh && o.boundingSphere) _s.copy(o.boundingSphere);
    else { const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); _s.copy(g.boundingSphere); }
    _s.applyMatrix4(o.matrixWorld); return Math.max(0, _s.center.distanceTo(cam) - _s.radius);
  }
  let tScan = 1.5, tCheck = 0;
  function update(dt) {
    thaw();
    if ((tScan += dt) > 2) { tScan = 0; scan(); }
    if ((tCheck += dt) < 0.2) return; tCheck = 0;
    camera.getWorldPosition(cam);
    const k = (ctx.underwater ? 0.5 : 1) * (ctx.perfScale || 1);   // dưới nước nhìn gần hơn; chất lượng thấp: ẩn sớm hơn
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i], o = e.o;
      if (!o.parent) { hide(o, false); list.splice(i, 1); continue; }   // vật đã bị gỡ khỏi cảnh
      const d = near(o);
      if (e.kind === 'outline') hide(o, d > OUTLINE_D * k);
      else if (e.kind === 'skin') hide(o, d > FAR_K * k);
      else hide(o, d > Math.max(FAR_MIN, FAR_K * e.r) * k);
    }
  }
  return { update, scan, list, frozen };
}
