// perf.js — Quản lý hiệu năng chung (không sửa file của khu khác):
//  · Viền toon (outline) trước đây luôn vẽ (frustumCulled = false) → bật lại cắt theo khung hình; viền ở xa > 34 m
//    mỏng dưới 1 điểm ảnh (dày 2,2 cm) nên ẩn hẳn.
//  · Vật nhỏ ở xa: ẩn khi khoảng cách tới camera > max(34, 89·bán kính) (Fibonacci) — vật cỡ 1 m mất ở ~89 m, còn ~13 px.
//    InstancedMesh từ scatterModel mang userData.itemR (bán kính 1 vật) → cả ô 55 m ẩn khi điểm gần nhất của ô đủ xa.
//  · Người/thú có xương (SkinnedMesh, trước luôn vẽ): cắt theo khung hình bằng hình cầu bao nới rộng φ lần.
//  · Vật < 1 m không đổ bóng (bóng đổ của vật nhỏ gần như không thấy, nhưng tốn 1 draw call ở pass bóng);
//    điện thoại: bán kính < 1/φ ≈ 0,62 m (cả InstancedMesh không ghi itemR: lấy cỡ 1 vật từ hình cầu bao lưới × tỉ lệ instance đầu).
//  · Bay/khinh khí cầu cao (camera cách mặt đất/biển > 21 m, Fibonacci): vật nhỏ ẩn sớm hơn 1/φ lần; điện thoại: sương + mặt cắt xa
//    kéo gần dần còn 1/√φ (296 → 233 m) — từ trên cao thấy nhiều cảnh hơn hẳn, xa hơn chỉ là vệt mờ trong sương.
// Ẩn bằng layers (không đụng .visible mà file khác đang điều khiển). Quét cảnh tìm vật mới mỗi 2 s, xét khoảng cách mỗi 0,2 s.
import * as THREE from 'three';
import { PHI } from './layout.js';
import { CFG } from './config.js';

const HIGH = 21, FOG_HIGH = 1 / Math.sqrt(PHI);   // độ cao coi là "trên cao" (m) · hệ số sương khi bay cao (điện thoại)
const FAR_K = 89, FAR_MIN = 34, OUTLINE_D = 34, SMALL_R = 1.6;   // ngưỡng Fibonacci; SMALL_R ≈ φ m
const NOSHADOW_R = CFG.isMobile ? 1 / PHI : 0.5;                  // vật nhỏ hơn: không đổ bóng
const _m = new THREE.Matrix4(), _sc = new THREE.Vector3();
const _s = new THREE.Sphere(), _v = new THREE.Vector3();

export function createPerf(ctx) {
  const { scene, camera } = ctx, list = [];
  function register(o) {
    const ud = o.userData; if (ud._pf) return; ud._pf = 1;
    if (!(o.isMesh)) return;
    const g = o.geometry; if (!g || !g.attributes.position) return;
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
  const scan = () => scene.traverse(register);
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
  let tScan = 1.5, tCheck = 0, fogK = 1;
  function fogByAlt(dt) {   // sau weather/dive (ocean.js): weather đặt lại sương mỗi khung → nhân hệ số không bị cộng dồn
    const F = scene.fog; if (!CFG.isMobile || !F || ctx.underwater || document.body.classList.contains('mg-on')) return;
    fogK += ((ctx.high ? FOG_HIGH : 1) - fogK) * Math.min(1, dt * 0.618);   // đổi dần ~1,6 s, không thấy "bật" sương
    if (fogK < 0.999) { F.near *= fogK; F.far *= fogK; }
    const far = fogK < 0.999 ? Math.min(CFG.view.far, Math.ceil(F.far + 8)) : CFG.view.far;
    if (Math.abs(camera.far - far) > 2) { camera.far = far; camera.updateProjectionMatrix(); }
  }
  function update(dt) {
    if ((tScan += dt) > 2) { tScan = 0; scan(); }
    // fogByAlt(dt);
    if ((tCheck += dt) < 0.2) return; tCheck = 0;
    camera.getWorldPosition(cam);
    const g = ctx.terrain ? Math.max(ctx.terrain.heightAt(cam.x, cam.z), CFG.island.waterLevel) : 0;
    ctx.camAlt = cam.y - g; ctx.high = ctx.camAlt > HIGH && !ctx.underwater;   // terrain.js/vehicles: LOD theo độ cao
    const k = (ctx.underwater ? 0.5 : ctx.high ? 1 / PHI : 1) * (ctx.perfScale || 1);   // dưới nước nhìn gần hơn; bay cao/chất lượng thấp: ẩn sớm hơn
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i], o = e.o;
      if (!o.parent) { hide(o, false); list.splice(i, 1); continue; }   // vật đã bị gỡ khỏi cảnh
      const d = near(o);
      if (e.kind === 'outline') hide(o, d > OUTLINE_D * k);
      else if (e.kind === 'skin') hide(o, d > FAR_K * k);
      else hide(o, d > Math.max(FAR_MIN, FAR_K * e.r) * k);
    }
  }
  return { update, scan, list };
}
