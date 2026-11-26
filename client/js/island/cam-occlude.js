// cam-occlude.js — Dò đoạn điểm nhìn → camera xem có tường/mái/vòm/cây che không (dùng chung: player.js, mg/host.js).
// Nhẹ cho điện thoại:
// - chỉ giữ vật TĨNH, TO (bán kính bao ≥ 1 m) trong 55 m quanh điểm nhìn; dựng lại danh sách khi đi xa ≥ 13 m (Fibonacci);
// - mỗi mesh tĩnh (kể cả khối gộp trường, nhà… hàng chục nghìn tam giác) được lập cây BVH một lần → mỗi tia chỉ thử vài chục tam giác;
//   cây lập trong toạ độ CỤC BỘ của lưới, tia đổi sang toạ độ cục bộ → vật di chuyển (xe, thuyền, cửa…) không phải lập lại cây mỗi khung;
// - mặt đất/nước bỏ qua (camera đã tự nâng trên mặt đất); vật mỏng (người, cột đèn…) bỏ qua → camera không co giật khi đi ngang.
import * as THREE from 'three';

const R = 55, MOVE = 13, MIN_R = 1, LEAF = 8, SKIP_NAME = /ground|ocean|water|sky/i;

// BVH nhỏ (tam giác toạ độ cục bộ của lưới, chia đôi theo trục dài nhất tại trung bình tâm) — lập 1 lần cho mỗi lưới (đổi geometry → lập lại)
function buildIndex(o) {
  const g = o.geometry, pos = g.attributes.position, idx = g.index, n = ((idx ? idx.count : pos.count) / 3) | 0;
  const P = new Float32Array(n * 9), Cn = new Float32Array(n * 3), ids = new Uint32Array(n), v = new THREE.Vector3();
  for (let t = 0; t < n; t++) {
    ids[t] = t;
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, idx ? idx.getX(t * 3 + k) : t * 3 + k);
      const b = t * 9 + k * 3; P[b] = v.x; P[b + 1] = v.y; P[b + 2] = v.z; Cn[t * 3] += v.x / 3; Cn[t * 3 + 1] += v.y / 3; Cn[t * 3 + 2] += v.z / 3;
    }
  }
  const M = 2 * n + 1, box = new Float32Array(M * 6), L = new Int32Array(M), S0 = new Int32Array(M), N = new Int32Array(M); let nn = 0;
  const build = (s, e) => {
    const id = nn++; let a0 = Infinity, a1 = Infinity, a2 = Infinity, b0 = -Infinity, b1 = -Infinity, b2 = -Infinity, c0 = Infinity, c1 = Infinity, c2 = Infinity, d0 = -Infinity, d1 = -Infinity, d2 = -Infinity;
    for (let i = s; i < e; i++) {
      const t = ids[i];
      for (let k = 0; k < 9; k += 3) { const x = P[t * 9 + k], y = P[t * 9 + k + 1], z = P[t * 9 + k + 2]; if (x < a0) a0 = x; if (x > b0) b0 = x; if (y < a1) a1 = y; if (y > b1) b1 = y; if (z < a2) a2 = z; if (z > b2) b2 = z; }
      const x = Cn[t * 3], y = Cn[t * 3 + 1], z = Cn[t * 3 + 2]; if (x < c0) c0 = x; if (x > d0) d0 = x; if (y < c1) c1 = y; if (y > d1) d1 = y; if (z < c2) c2 = z; if (z > d2) d2 = z;
    }
    box.set([a0, a1, a2, b0, b1, b2], id * 6);
    if (e - s <= LEAF) { L[id] = -1; S0[id] = s; N[id] = e - s; return id; }
    const ax = d0 - c0 >= d1 - c1 && d0 - c0 >= d2 - c2 ? 0 : d1 - c1 >= d2 - c2 ? 1 : 2;
    let sum = 0; for (let i = s; i < e; i++) sum += Cn[ids[i] * 3 + ax]; const mid = sum / (e - s);
    let i = s, j = e - 1; while (i <= j) { if (Cn[ids[i] * 3 + ax] < mid) i++; else { const t = ids[i]; ids[i] = ids[j]; ids[j--] = t; } }
    if (i === s || i === e) i = (s + e) >> 1;   // mọi tâm trùng nhau → chia đôi theo số lượng
    build(s, i); L[id] = build(i, e); return id;   // con trái = id + 1, con phải = L[id]
  };
  build(0, n);
  return { P, ids, box, L, S0, N, stack: new Int32Array(128), g };
}

export function createCamOcclude(ctx) {
  const rc = new THREE.Raycaster(), ray = rc.ray, list = [], at = new THREE.Vector3(1e9, 0, 0), sp = new THREE.Sphere(), dir = new THREE.Vector3(), hits = [];
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), hit = new THREE.Vector3(), idxOf = new WeakMap();
  const lray = new THREE.Ray(), inv = new THREE.Matrix4(), _e = new THREE.Vector3();   // tia trong toạ độ cục bộ của lưới
  let n0 = -1, skipRoot = null;
  // mái có thể mờ dần khi vào nhà (transparent nhưng còn đặc) → vẫn tính; nước/hạt/kính mờ (depthWrite tắt hoặc mờ < 0,6) thì bỏ
  const solid = m => m && m.visible !== false && !(m.transparent && (m.depthWrite === false || m.opacity < 0.6));
  // danh sách mục: { o, x, y, z, r (hình cầu bao thế giới), k: 1 mesh thường (qua BVH) · 2 một bản sao của InstancedMesh (i, m) }
  const _m = new THREE.Matrix4(), tmp = new THREE.Mesh();
  function rebuild(c) {
    list.length = 0; at.copy(c); n0 = ctx.scene.children.length;
    const add = (o, k, i, m) => { if (sp.radius >= MIN_R && sp.center.distanceTo(c) < sp.radius + R) list.push({ o, k, i, m, x: sp.center.x, y: sp.center.y, z: sp.center.z, r: sp.radius }); };
    ctx.scene.traverse(o => {   // traverse (không phải traverseVisible): perf.js ẩn/hiện vật theo khung nhìn, vật sau lưng camera vẫn phải tính
      if (!o.isMesh || !o.visible || o.isSkinnedMesh || !o.geometry || SKIP_NAME.test(o.name)) return;
      if (Array.isArray(o.material) ? !o.material.every(solid) : !solid(o.material)) return;
      if (o.isInstancedMesh && o.count > 377) return;   // cỏ/hoa rất nhiều bản sao: bỏ qua
      for (let p = o; p; p = p.parent) if (p === skipRoot || !p.visible || p.userData.noCamOcc) return;   // nhóm cha đang ẩn (vd người dựng bằng khối) → bỏ
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if (o.isInstancedMesh) for (let i = 0; i < o.count; i++) {   // từng cây/đá riêng: lọc bằng hình cầu của chính bản sao
        o.getMatrixAt(i, _m); const m = new THREE.Matrix4().multiplyMatrices(o.matrixWorld, _m); sp.copy(o.geometry.boundingSphere).applyMatrix4(m); add(o, 2, i, m);
      } else { sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); add(o, 1); }
    });
  }
  // tia qua BVH: bỏ nhánh có hộp bao không chạm tia hoặc xa hơn điểm chạm tốt nhất
  //   lray.direction = phần tuyến tính của M⁻¹ nhân hướng thế giới (không chuẩn hoá) → tham số t dọc tia cục bộ = khoảng cách thế giới
  function bvhHit(I, far) {
    const ray = lray, { P, ids, box, L, S0, N, stack } = I, ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z, ix = 1 / ray.direction.x, iy = 1 / ray.direction.y, iz = 1 / ray.direction.z;
    let best = far, sp = 0; stack[sp++] = 0;
    while (sp) {
      const id = stack[--sp], q = id * 6;
      let t0 = (box[q] - ox) * ix, t1 = (box[q + 3] - ox) * ix; if (t0 > t1) { const t = t0; t0 = t1; t1 = t; }
      let u0 = (box[q + 1] - oy) * iy, u1 = (box[q + 4] - oy) * iy; if (u0 > u1) { const t = u0; u0 = u1; u1 = t; }
      if (u0 > t0) t0 = u0; if (u1 < t1) t1 = u1;
      let w0 = (box[q + 2] - oz) * iz, w1 = (box[q + 5] - oz) * iz; if (w0 > w1) { const t = w0; w0 = w1; w1 = t; }
      if (w0 > t0) t0 = w0; if (w1 < t1) t1 = w1;
      if (!(t0 <= t1) || t1 < 0 || t0 > best) continue;
      if (L[id] < 0) {
        for (let i = S0[id], e = i + N[id]; i < e; i++) {
          const b = ids[i] * 9; A.set(P[b], P[b + 1], P[b + 2]); B.set(P[b + 3], P[b + 4], P[b + 5]); C.set(P[b + 6], P[b + 7], P[b + 8]);
          if (ray.intersectTriangle(A, B, C, false, hit)) { const d = hit.sub(ray.origin).dot(ray.direction) / ray.direction.lengthSq(); if (d > rc.near && d < best) best = d; }
        }
      } else if (sp < 126) { stack[sp++] = L[id]; stack[sp++] = id + 1; }
    }
    return best;
  }
  return {
    // khoảng trống từ `from` theo hướng tới `to` (tối đa |to − from|); skip: nhóm không tính (người chơi, khu mini game)
    clear(from, to, skip = null) {
      const d = from.distanceTo(to); if (d < 1e-3) return d;
      if (skip !== skipRoot) { skipRoot = skip; at.x = 1e9; }
      if (at.distanceToSquared(from) > MOVE * MOVE || ctx.scene.children.length !== n0) rebuild(from);
      dir.subVectors(to, from).divideScalar(d); rc.set(from, dir); rc.near = 0.3;
      let best = d; const ox = from.x, oy = from.y, oz = from.z;
      for (const it of list) {
        // đoạn thẳng có chạm hình cầu bao? (chiếu tâm lên tia, kẹp trong [0, best])
        const cx = it.x - ox, cy = it.y - oy, cz = it.z - oz, t = Math.max(0, Math.min(best, cx * dir.x + cy * dir.y + cz * dir.z));
        const ex = cx - dir.x * t, ey = cy - dir.y * t, ez = cz - dir.z * t; if (ex * ex + ey * ey + ez * ez > it.r * it.r) continue;
        const o = it.o; if (!o.visible || !solid(Array.isArray(o.material) ? o.material[0] : o.material)) continue;   // mái đang mờ (người chơi trong nhà)
        if (it.k === 1) {
          let I = idxOf.get(o); if (I && I.g !== o.geometry) I = null;   // đổi lưới → lập lại cây
          if (!I) idxOf.set(o, I = buildIndex(o));
          inv.copy(o.matrixWorld).invert(); lray.origin.copy(from).applyMatrix4(inv); lray.direction.copy(_e.copy(from).add(dir)).applyMatrix4(inv).sub(lray.origin);
          best = bvhHit(I, best); continue;
        }
        let m = o; if (it.k === 2) { tmp.geometry = o.geometry; tmp.material = o.material; tmp.matrixWorld.copy(it.m); m = tmp; }
        hits.length = 0; rc.far = best; m.raycast(rc, hits); for (const h of hits) if (h.distance < best && h.distance > rc.near) best = h.distance;
      }
      return best;
    },
    reset() { at.x = 1e9; },
  };
}
