// vrm/vrm-outfit.js — Đồng phục "học sinh phù thuỷ" NGUYÊN BẢN của Học viện Pha Lê, dựng bằng code (không có model CC0
// áo choàng/mũ/kính khớp xương VRoid để lấy sẵn) và gắn theo xương VRM:
//   áo choàng dài xẻ trước + mũ trùm (hạ sau gáy) + tay áo loe · khăn quàng sọc Fibonacci (không phải sọc đều) · cà vạt
//   · mũ chóp nhọn · đũa · kính tròn/vuông. Màu theo nhà Tứ Linh: 2 vật liệu MToon, đổi bằng litFactor (material.color).
// Áo choàng: thân trên theo ngực/bụng; vạt trước theo đùi trái/phải; vạt sau treo trên 4 SpringBone (vải đơn giản)
// có va chạm ống chân; tóc dài va chạm với lưng áo. Dáng đo từ chính lưới thân của mẫu (lát cắt theo chiều cao).
// Tỷ lệ φ: gấu áo ở 1/φ từ gối xuống mắt cá, khe cổ chữ V, sọc khăn 5:1:2:1:3, mũ cao = 1/φ³ chiều cao người.
import * as THREE from 'three';
import { MToonMaterial, VRMSpringBoneJoint, VRMSpringBoneCollider, VRMSpringBoneColliderShapeCapsule } from '../../vendor/three-vrm.module.min.js';
import { HOUSES } from '../academy/houses-data.js';

const PHI = 1.618033988749895;
const dark = (h, k) => '#' + new THREE.Color(h).multiplyScalar(k).getHexString();
// bảng màu: robe = thân áo, trim = viền/lót/sọc/kính (litFactor); không dùng đen + vàng–đỏ thẫm kiểu trường phù thuỷ trong truyện
export const PALETTE = Object.fromEntries(HOUSES.map(h => [h.id, { robe: dark(h.col, 0.3), trim: dark(h.col2, 0.8), name: h.name, bow: h.col }]));
PALETTE.teacher = { robe: '#2b3352', trim: '#d4b45a', name: 'Thầy cô', bow: '#d4b45a' };
PALETTE.school = { robe: '#d8232a', trim: '#d8232a', name: 'Trường Rubik', bow: '#d8232a' };   // khăn quàng đỏ

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Bộ đệm hình học có trọng số xương (tối đa 4 xương/đỉnh)
class Skin {
  constructor() { this.P = []; this.C = []; this.I = []; this.W = []; this.idx = []; }
  v(x, y, z, w, c = null) { const ks = Object.keys(w).filter(k => w[k] > 1e-4).sort((a, b) => w[b] - w[a]).slice(0, 4), s = ks.reduce((t, k) => t + w[k], 0) || 1; this.P.push(x, y, z); this.C.push(...(c || [1, 1, 1])); for (let i = 0; i < 4; i++) { this.I.push(ks[i] !== undefined ? +ks[i] : 0); this.W.push(ks[i] !== undefined ? w[ks[i]] / s : 0); } return this.P.length / 3 - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  grid(rows, flip = false) { for (let i = 0; i + 1 < rows.length; i++) for (let j = 0; j + 1 < rows[i].length; j++) { const a = rows[i][j], b = rows[i + 1][j], c = rows[i + 1][j + 1], d = rows[i][j + 1]; flip ? this.quad(a, d, c, b) : this.quad(a, b, c, d); } }
  // khối hộp cứng gắn 1 xương (đuôi khăn, cà vạt, kính…) theo 3 trục u, v, n tại tâm o, nửa kích thước a, b, c
  box(o, u, v, n, a, b, c, w, col) {
    const p = (su, sv, sn) => o.clone().addScaledVector(u, su * a).addScaledVector(v, sv * b).addScaledVector(n, sn * c);
    const F = [[[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]];
    for (const f of F) { const ids = f.map(s => { const q = p(...s); return this.v(q.x, q.y, q.z, w, col); }); this.quad(...ids); }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.I, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.W, 4));
    g.setIndex(this.idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
  }
}

function mtoon(color, S, outline, vertexColors = false) {
  const m = new MToonMaterial({ color: new THREE.Color(color), shadeColorFactor: new THREE.Color(color).multiplyScalar(0.62), shadingToonyFactor: 0.88, shadingShiftFactor: -0.05, vertexColors });
  m.name = 'outfit'; m.side = THREE.FrontSide;
  if (!outline) return [m];
  const o = m.clone(); o.name = 'outfit (Outline)'; o.isOutline = true; o.side = THREE.BackSide; o.outlineWidthMode = 'worldCoordinates'; o.outlineWidthFactor = 0.0028 * S; o.outlineColorFactor = new THREE.Color('#2a1e2c'); o.outlineLightingMixFactor = 1; o.vertexColors = vertexColors;
  return [m, o];
}

/**
 * Mặc đồng phục lên 1 VRM (đang ở tư thế nghỉ, model gốc ở toạ độ 0, tỷ lệ 1).
 * opt: { house:'long'|'phung'|'lan'|'quy'|'teacher'|'school', robe, hood, scarf, tie, hat, glasses:'none'|'round'|'square', wand }
 * Trả về { group, mats:{robe,trim}, setHouse(id), parts:{…mesh}, outlines:[vật liệu viền] }
 */
export function dressVrm(vrm, model, opt = {}) {
  const H = vrm.humanoid, raw = n => H.getRawBoneNode(n), V = () => new THREE.Vector3();
  vrm.humanoid.update(); model.updateMatrixWorld(true);
  const wp = n => { const b = raw(n); return b ? b.getWorldPosition(V()) : null; };
  const hips = wp('hips'), spine = wp('spine'), chest = wp('chest'), upper = wp('upperChest') || chest.clone(), neck = wp('neck'), head = wp('head');
  const lArm = wp('leftUpperArm'), lElb = wp('leftLowerArm'), lHand = wp('leftHand'), rArm = wp('rightUpperArm'), rElb = wp('rightLowerArm'), rHand = wp('rightHand');
  const knee = wp('leftLowerLeg'), foot = wp('leftFoot'), S = head.y / 1.38;   // S: tỷ lệ theo người cao ~1,6 m
  const shX = Math.abs(lArm.x);

  // ---- lát cắt thân (đỉnh của da thân, áo, váy ở tư thế nghỉ) → bán kính áo theo chiều cao ----
  const BIN = 0.02 * S, bins = new Map(), v = V(), hairPts = [], facePts = [];
  model.traverse(o => {
    if (!o.isSkinnedMesh) return; const k = o.userData.vrmKind; if (!['skin', 'tops', 'bottoms', 'hair', 'neck'].includes(k)) return;
    const morph = Object.keys(o.geometry.morphAttributes).length, pa = o.geometry.attributes.position, step = pa.count > 6000 ? 2 : 1;
    for (let i = 0; i < pa.count; i += step) {
      v.fromBufferAttribute(pa, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld);
      if (k === 'hair') { hairPts.push(v.clone()); continue; }
      if (morph) { facePts.push(v.clone()); continue; }
      if (o.userData.cutY !== undefined && v.y < o.userData.cutY) continue;   // váy liền đã cắt
      if (v.y > hips.y - 0.05 * S && Math.abs(v.x) > shX * 0.92) continue;   // bỏ tay (T-pose)
      const b = Math.floor(v.y / BIN); let e = bins.get(b); if (!e) bins.set(b, e = { x: 0, z0: 9, z1: -9 });
      e.x = Math.max(e.x, Math.abs(v.x)); e.z0 = Math.min(e.z0, v.z); e.z1 = Math.max(e.z1, v.z);
    }
  });
  const ext = y => { const b = Math.floor(y / BIN), r = { x: 0, z0: 9, z1: -9 }; for (let k = -2; k <= 2; k++) { const e = bins.get(b + k); if (e) { r.x = Math.max(r.x, e.x); r.z0 = Math.min(r.z0, e.z0); r.z1 = Math.max(r.z1, e.z1); } } if (r.x === 0) { r.x = 0.12 * S; r.z0 = -0.1 * S; r.z1 = 0.1 * S; } return r; };

  // ---- dáng áo: các vòng điều khiển (y, rx, z trước, z sau, tâm z) ----
  const collarY = neck.y + 0.012 * S, hemY = lerp(knee.y, foot.y, 1 / PHI), m = 0.03 * S;
  const hipE = ext(hips.y), hip = { rx: hipE.x + m, zf: (hipE.z1 - hipE.z0) / 2 + m, zc: (hipE.z1 + hipE.z0) / 2 };
  hip.zb = hip.zf;
  const ring = y => {
    if (y >= lArm.y) {   // vai → cổ
      const t = smooth(lArm.y, collarY, y), e = ext(collarY - 0.01 * S), zc = (e.z1 + e.z0) / 2, zr = (e.z1 - e.z0) / 2 + m * 0.7, es = ext(lArm.y - 0.04 * S), zcs = (es.z1 + es.z0) / 2, zrs = (es.z1 - es.z0) / 2 + m;
      return { y, rx: lerp(shX * 1.02, e.x + m * 0.8, t), zf: lerp(zrs, zr, t), zb: lerp(zrs, zr, t), zc: lerp(zcs, zc, t) };
    }
    if (y >= hips.y) { const e = ext(y), zc = (e.z1 + e.z0) / 2, zr = (e.z1 - e.z0) / 2; return { y, rx: Math.max(e.x + m, hip.rx * 0.9), zf: zr + m, zb: zr + m, zc }; }
    const t = (hips.y - y) / (hips.y - hemY), e = ext(y), zc = lerp(hip.zc, (e.z1 + e.z0) / 2, 0.5);
    const cap = 9;   // (váy liền đã cắt dưới eo trước khi đo → không cần chặn)
    return { y, rx: Math.min(Math.max(hip.rx, e.x + m), cap) * (1 + 0.146 * t), zf: Math.min(Math.max(hip.zf, e.z1 - zc + m), cap * 0.8) + 0.03 * S * t, zb: Math.min(Math.max(hip.zb, zc - e.z0 + m), cap * 0.8) + 0.045 * S * t, zc };
  };
  // khe xẻ trước (nửa góc, rad): cổ chữ V rộng → khép ở eo → hơi mở ở gấu
  const gapAt = y => y > chest.y ? lerp(0.2, 0.62, smooth(chest.y, collarY, y)) : y > hips.y ? lerp(0.1, 0.2, smooth(hips.y, chest.y, y)) : opt.closed ? lerp(0.1, 0.05, smooth(hips.y, hemY, y)) : lerp(0.1, 0.3, smooth(hips.y, hemY, y));
  const ys = []; { const ctrl = [collarY, lerp(collarY, lArm.y, 0.5), lArm.y, lerp(lArm.y, chest.y, 0.5), chest.y, spine.y, lerp(spine.y, hips.y, 0.5), hips.y]; ys.push(...ctrl); const nL = 7; for (let i = 1; i <= nL; i++) ys.push(lerp(hips.y, hemY, i / nL)); }
  const R = ys.map(ring);
  for (let k = 0; k < 2; k++) for (let i = 1; i + 1 < R.length; i++) for (const p of ['rx', 'zf', 'zb']) if (R[i].y < lArm.y) R[i][p] = Math.max(R[i][p], (R[i - 1][p] + R[i + 1][p]) / 2 * 0.98);   // làm mượt, không lõm
  const surf = (r, th, d = 0) => new THREE.Vector3((r.rx + d) * Math.sin(th), r.y, r.zc + ((Math.cos(th) >= 0 ? r.zf : r.zb) + d) * Math.cos(th));

  // ---- xương ----
  const bones = [], bi = new Map(); const B = (n, o) => { if (!o) return -1; if (!bi.has(n)) { bi.set(n, bones.length); bones.push(o); } return bi.get(n); };
  const iU = B('upper', raw('upperChest') || raw('chest')), iC = B('chest', raw('chest')), iS = B('spine', raw('spine')), iH = B('hips', raw('hips')), iN = B('neck', raw('neck')), iHd = B('head', raw('head'));
  const iLL = B('lleg', raw('leftUpperLeg')), iRL = B('rleg', raw('rightUpperLeg')), iLA = B('larm', raw('leftUpperArm')), iLF = B('lfore', raw('leftLowerArm')), iRA = B('rarm', raw('rightUpperArm')), iRF = B('rfore', raw('rightLowerArm')), iRH = B('rhand', raw('rightHand'));
  // 4 dây SpringBone cho vạt sau (vải): gốc ở hông, đuôi ở gấu
  const CH = 4, chainTh = [...Array(CH)].map((_, i) => Math.PI / 2 + Math.PI * (i + 0.5) / CH), chains = [], ringHip = ring(hips.y - 0.03 * S), ringHem = R[R.length - 1];
  const hipsBone = raw('hips');
  for (let i = 0; i < CH; i++) {
    const b0 = new THREE.Bone(), b1 = new THREE.Bone(); b0.name = 'robe-spring-' + i; b1.name = b0.name + '-tail';
    hipsBone.add(b0); b0.position.copy(hipsBone.worldToLocal(surf(ringHip, chainTh[i], -0.02 * S))); b0.updateMatrixWorld(true);
    b0.add(b1); b1.position.copy(b0.worldToLocal(surf(ringHem, chainTh[i], -0.02 * S))); b1.updateMatrixWorld(true);
    chains.push(B('ch' + i, b0)); chains.b0 = chains.b0 || []; chains.b0.push(b0); chains.b1 = chains.b1 || []; chains.b1.push(b1);
  }
  // trọng số áo theo độ cao + góc quanh thân (θ = 0 phía trước, dương = bên trái)
  const wRobe = (y, th, x) => {
    const w = {};
    if (y >= chest.y) { w[iU] = 1; const a = smooth(lArm.y - 0.1 * S, lArm.y, y) * smooth(shX * 0.55, shX, Math.abs(x)) * 0.4; if (a > 0) { w[x > 0 ? iLA : iRA] = a; w[iU] = 1 - a; } }
    else if (y >= spine.y) { const t = smooth(spine.y, chest.y, y); w[iC] = t; w[iS] = 1 - t; }
    else if (y >= hips.y) { const t = smooth(hips.y, spine.y, y); w[iS] = t; w[iH] = 1 - t; }
    else {
      const t = smooth(hips.y, hemY, y), c = Math.cos(th), s = Math.sin(th);
      if (c >= 0) { const k = 0.5 * smooth(0, 0.618, t) * smooth(0.1, 0.8, c); w[s >= 0 ? iLL : iRL] = k; w[iH] = 1 - k; }   // vạt trước theo đùi (một nửa: vải không cứng như ống quần)
      else {   // vạt sau theo dây vải gần nhất (nội suy 2 dây)
        const k = smooth(0, 0.3, t) * smooth(0, 0.3, -c); let f = ((((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - chainTh[0]) / (Math.PI / CH);
        f = Math.max(0, Math.min(CH - 1, f)); const a = Math.floor(Math.min(f, CH - 1.0001)), u = f - a;
        w[chains[a]] = k * (1 - u); w[chains[Math.min(a + 1, CH - 1)]] = (w[chains[Math.min(a + 1, CH - 1)]] || 0) + k * u; w[iH] = 1 - k;
      }
    }
    return w;
  };

  const A = new Skin(), T = new Skin(), N = new Skin();   // A: thân áo · T: viền/lót/sọc · N: đồ màu cố định (đũa)
  const parts = {};
  const M = 24;
  // ---- áo choàng: vỏ ngoài (A) + lót trong (T) + viền trước & gấu (T) ----
  if (opt.robe !== false) {
    const thetas = r => { const g = gapAt(r.y); return [...Array(M)].map((_, j) => g + (2 * Math.PI - 2 * g) * j / (M - 1)); };
    const shell = (sk, d, flip) => sk.grid(R.map(r => thetas(r).map(th => { const p = surf(r, th, d); return sk.v(p.x, p.y, p.z, wRobe(p.y, th, p.x)); })), flip);
    shell(A, 0, false); shell(A, -0.007 * S, true);   // lót trong cùng màu thân (đỡ 1 vật liệu)
    const band = (y0, y1, th0, th1, d, n = 2) => { const rows = []; for (let i = 0; i < R.length; i++) { const r = R[i]; if (r.y > y0 + 1e-6 || r.y < y1 - 1e-6) continue; rows.push([...Array(n + 1)].map((_, k) => { const th = lerp(th0(r), th1(r), k / n), p = surf(r, th, d); return T.v(p.x, p.y, p.z, wRobe(p.y, th, p.x)); })); } T.grid(rows); };
    const tw = 0.032 * S;   // viền trước rộng ~3 cm (góc ≈ cung / bán kính ngang)
    band(collarY, hemY, r => gapAt(r.y), r => gapAt(r.y) + tw / Math.max(r.rx, 0.05), 0.003 * S);
    band(collarY, hemY, r => -gapAt(r.y) - tw / Math.max(r.rx, 0.05), r => -gapAt(r.y), 0.003 * S);
    // gấu áo: dải 4 cm quanh dưới cùng
    { const r0 = R[R.length - 1], r1 = { ...ring(hemY + 0.045 * S) }; const ths = thetas(r0); const row = (r, d) => ths.map(th => { const p = surf(r, th, d); return T.v(p.x, p.y, p.z, wRobe(p.y, th, p.x)); }); T.grid([row(r1, 0.0035 * S), row(r0, 0.0035 * S)]); }
    // váy xếp ly màu áo (mẫu mặc váy liền: váy gốc đã cắt dưới eo) — trong áo choàng, tới trên gối, 24 nếp
    if (opt.closed) {
      const yT = hips.y + 0.03 * S, yB = lerp(hips.y, knee.y, 1.15), nY = 5, nT = 48, rows = [];
      for (let i = 0; i <= nY; i++) { const t = i / nY, yy = lerp(yT, yB, t), r = ring(yy), k = 0.93 + 0.06 * t;
        rows.push([...Array(nT + 1)].map((_, j) => { const th = 2 * Math.PI * j / nT, pl = 1 + (j % 2 ? 0.035 : -0.01) * t, p = new THREE.Vector3(r.rx * k * pl * Math.sin(th), yy, r.zc + (Math.cos(th) >= 0 ? r.zf : r.zb) * k * pl * Math.cos(th)); return A.v(p.x, p.y, p.z, wRobe(p.y, th, p.x)); })); }
      A.grid(rows); A.grid(rows.map(row => row.map(i => { const q = A.P.slice(i * 3, i * 3 + 3); return A.v(q[0] * 0.985, q[1], q[2] * 0.985, { [iH]: 1 }); })), true);
    }
    // mũ trùm hạ sau gáy: vỏ phồng trên lưng (A) + mép (T)
    if (opt.hood !== false) {
      const y0 = collarY + 0.035 * S, y1 = lArm.y - 0.17 * S, nY = 7, nT = 9, rows = [], rim = [];
      for (let i = 0; i <= nY; i++) {
        const u = i / nY, y = lerp(y0, y1, u), r = ring(y), row = [];
        for (let j = 0; j <= nT; j++) { const s = j / nT, th = Math.PI + lerp(-0.95, 0.95, s) * (0.7 + 0.3 * Math.sin(Math.PI * u)), bulge = 0.006 * S + 0.05 * S * Math.sin(Math.PI * Math.min(1, u * 1.25)) * Math.sin(Math.PI * s); const p = surf(r, th, bulge); row.push(A.v(p.x, p.y + 0.02 * S * Math.sin(Math.PI * s) * (1 - u), p.z, { [iU]: 1 })); if (i === 0) rim.push(p); }
        rows.push(row);
      }
      A.grid(rows);
      for (let j = 0; j + 1 < rim.length; j++) { const a = rim[j], b = rim[j + 1], up = 0.016 * S; const i0 = T.v(a.x, a.y, a.z, { [iU]: 1 }), i1 = T.v(b.x, b.y, b.z, { [iU]: 1 }), i2 = T.v(b.x, b.y + up, b.z * 1.02, { [iU]: 1 }), i3 = T.v(a.x, a.y + up, a.z * 1.02, { [iU]: 1 }); T.quad(i0, i1, i2, i3); T.quad(i0, i3, i2, i1); }
    }
    // tay áo loe (T-pose: tay dọc trục x)
    for (const [P0, P1, P2, iA, iF] of [[lArm, lElb, lHand, iLA, iLF], [rArm, rElb, rHand, iRA, iRF]]) {
      const sx = Math.sign(P0.x), L = P2.x - P0.x, ue = (P1.x - P0.x) / L, us = [-0.12, 0.05, 0.25, ue - 0.06, ue + 0.06, 0.72, 0.9, 1.02], nS = 14;
      const rows = us.map(u => { const cx = P0.x + L * u, cy = lerp(P0.y, P2.y, Math.max(0, u)) - 0.006 * S, r = (u < ue ? lerp(0.084, 0.078, Math.max(0, u) / ue) : lerp(0.078, 0.104, smooth(ue, 1.02, u))) * S;
        const w = u < 0.12 ? { [iU]: 1 - smooth(-0.12, 0.12, u), [iA]: smooth(-0.12, 0.12, u) } : { [iA]: 1 - smooth(ue - 0.08, ue + 0.08, u), [iF]: smooth(ue - 0.08, ue + 0.08, u) };
        return [...Array(nS + 1)].map((_, k) => { const a = 2 * Math.PI * k / nS; return [cx, cy + r * Math.cos(a), P0.z + r * Math.sin(a) * 1.05, w]; }); });
      const flipOuter = sx > 0;
      A.grid(rows.map(row => row.map(([x, y, z, w]) => A.v(x, y, z, w))), flipOuter);
      T.grid(rows.map(row => row.map(([x, y, z, w]) => { const cy = row.reduce((s, q) => s + q[1], 0) / row.length, cz = P0.z; return T.v(x, cy + (y - cy) * 0.93, cz + (z - cz) * 0.93, w); })), !flipOuter);
      // viền cổ tay
      const last = rows[rows.length - 1], prev = rows[rows.length - 2]; T.grid([prev, last].map((row, ri) => row.map(([x, y, z, w]) => { const cy = row.reduce((s, q) => s + q[1], 0) / row.length, k = 1.012 + ri * 0.004; return T.v(ri ? x : lerp(prev[0][0], last[0][0], 0.6), cy + (y - cy) * k, P0.z + (z - P0.z) * k, w); })), flipOuter);
    }
  }
  // ---- khăn quàng sọc (vòng cổ + 2 đuôi) — sọc theo Fibonacci 5:1:2:1:3 (khác sọc đều) ----
  if (opt.scarf) {
    const e = ext(collarY - 0.015 * S), zc = (e.z1 + e.z0) / 2, rx = Math.min(e.x, 0.07 * S) + 0.03 * S, rz = Math.min((e.z1 - e.z0) / 2, 0.07 * S) + 0.03 * S, tr = 0.017 * S, y = collarY - 0.012 * S, nA = 24, nB = 8, rows = [];
    for (let i = 0; i <= nA; i++) { const a = 2 * Math.PI * i / nA, c = new THREE.Vector3(rx * Math.sin(a), y, zc + rz * Math.cos(a)), out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      rows.push([...Array(nB + 1)].map((_, k) => { const b = 2 * Math.PI * k / nB, p = c.clone().addScaledVector(out, tr * Math.cos(b)).add(new THREE.Vector3(0, tr * 1.3 * Math.sin(b), 0)); return T.v(p.x, p.y, p.z, { [iN]: 0.5, [iU]: 0.5 }); })); }
    T.grid(rows);
    // 2 đuôi khăn mềm (ống dẹt elip, ôm theo ngực), sọc Fibonacci 8:1:2:1:5 theo chiều dài; đuôi trái dài, đuôi phải ngắn chồng lên
    const pat = [8, 1, 2, 1, 5], tot = pat.reduce((a, b) => a + b, 0), wR = 0.032 * S, tR = 0.008 * S, nS = 10;
    const zAt = yq => ext(yq).z1 + 0.012 * S;
    for (const [sx, tilt, len, dz] of [[0.035, 0.06, 0.3 * S, 0], [-0.03, -0.1, 0.23 * S, 0.012 * S]]) {
      const nR = 16, rows = [];
      for (let i = 0; i <= nR; i++) { const t = i / nR, yy = y - 0.006 * S - len * t, cx = sx * S + tilt * len * t + 0.01 * S * Math.sin(t * Math.PI), cz = zAt(yy) + tR + dz, w = wR * (1 + 0.15 * t);
        rows.push({ t, pts: [...Array(nS + 1)].map((_, k) => { const a = 2 * Math.PI * k / nS; return new THREE.Vector3(cx + w * Math.cos(a), yy, cz + tR * Math.sin(a)); }) }); }
      const band = t => { let u = t * tot, k = 0; while (k < pat.length - 1 && u > pat[k]) { u -= pat[k]; k++; } return k % 2 ? A : T; };
      for (let i = 0; i < nR; i++) { const sk = band((rows[i].t + rows[i + 1].t) / 2), r0 = rows[i].pts.map(p => sk.v(p.x, p.y, p.z, { [iU]: 1 })), r1 = rows[i + 1].pts.map(p => sk.v(p.x, p.y, p.z, { [iU]: 1 })); sk.grid([r0, r1], true); }
      const last = rows[nR].pts, yy = last[0].y;   // tua rua: 7 sợi mảnh
      for (let f = 0; f < 7; f++) { const p = last[Math.round(f * nS / 2 / 6)]; T.box(new THREE.Vector3(p.x, yy - 0.012 * S, p.z), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), 0.0022 * S, 0.012 * S, 0.0022 * S, { [iU]: 1 }); }
    }
  }
  // ---- cà vạt (thấy qua cổ chữ V) ----
  if (opt.tie) {
    const yk = collarY - 0.045 * S, zk = ext(yk).z1 + 0.008 * S, X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Zv = new THREE.Vector3(0, 0, 1);
    T.box(new THREE.Vector3(0, yk, zk), X, Y, Zv, 0.018 * S, 0.016 * S, 0.008 * S, { [iU]: 1 });
    const yb = chest.y - 0.05 * S, n = 4;
    for (let i = 0; i < n; i++) { const y0 = lerp(yk - 0.014 * S, yb, i / n), y1 = lerp(yk - 0.014 * S, yb, (i + 1) / n), wdt = lerp(0.018, 0.03, (i + 0.5) / n) * S, z = ext((y0 + y1) / 2).z1 + 0.006 * S;
      (i % 2 ? T : A).box(new THREE.Vector3(0, (y0 + y1) / 2, z), X, Y, Zv, wdt, (y0 - y1) / 2 + 0.0004, 0.004 * S, { [y0 > chest.y ? iU : iC]: 1 }); }
  }
  // ---- mũ chóp nhọn (thân A, dải T), gắn xương đầu ----
  let headTop = head.y + 0.2 * S, hx = head.x, hz = head.z;
  if (hairPts.length) { let my = -9, sx = 0, sz = 0, n = 0; for (const p of hairPts) if (Math.abs(p.x - head.x) < 0.12 * S) { my = Math.max(my, p.y); } for (const p of hairPts) if (p.y > my - 0.06 * S) { sx += p.x; sz += p.z; n++; } headTop = my; if (n) { hx = sx / n; hz = sz / n; } }
  if (opt.hat) {
    const y0 = headTop - 0.075 * S, rB = 0.21 * S, rC = 0.118 * S, hC = 1.6 / Math.pow(PHI, 3) * S * 0.9, w = { [iHd]: 1 }, nA = 16;
    const brim = [0, 1].map(k => [...Array(nA + 1)].map((_, i) => { const a = 2 * Math.PI * i / nA, r = k ? rB : rC * 0.98; return A.v(hx + r * Math.sin(a), y0 - (k ? 0.012 * S : 0), hz + r * Math.cos(a), w); }));
    A.grid(brim); A.grid(brim.map(row => row.map(i => { const p = A.P.slice(i * 3, i * 3 + 3); return A.v(p[0], p[1] - 0.008 * S, p[2], w); })), true);
    const nY = 7, cone = [];
    for (let k = 0; k <= nY; k++) { const t = k / nY, r = rC * (1 - t) * (1 - 0.15 * t), bend = 0.09 * S * t * t * t, cy = y0 + hC * t - 0.04 * S * t * t * t;
      cone.push([...Array(nA + 1)].map((_, i) => { const a = 2 * Math.PI * i / nA; return A.v(hx + r * Math.sin(a), cy, hz - bend + r * Math.cos(a), w); })); }
    A.grid(cone, true);
    const band = [0, 1].map(k => [...Array(nA + 1)].map((_, i) => { const a = 2 * Math.PI * i / nA, t = k * 0.07, r = rC * (1 - t) * 1.03; return T.v(hx + r * Math.sin(a), y0 + hC * t, hz + r * Math.cos(a), w); }));
    T.grid(band, true);
    parts.hatY = y0;
  }
  // ---- kính tròn / vuông (gọng màu trim) ----
  if (opt.glasses && opt.glasses !== 'none') {
    const le = wp('leftEye'), re = wp('rightEye'), ey = le && re ? (le.y + re.y) / 2 : head.y + 0.075 * S, ex = le && re ? Math.abs(le.x - re.x) / 2 : 0.032 * S;
    let fz = head.z + 0.09 * S; { let mz = -9; for (const p of facePts) if (Math.abs(p.y - ey) < 0.015 * S && Math.abs(p.x) < ex + 0.03 * S) mz = Math.max(mz, p.z); if (mz > -9) fz = mz; }
    const z = fz + 0.012 * S, w = { [iHd]: 1 }, X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Zv = new THREE.Vector3(0, 0, 1), t = 0.0032 * S, lr = 0.025 * S;
    for (const sx of [-1, 1]) {
      const cx = head.x + sx * ex;
      if (opt.glasses === 'round') { const n = 14; for (let i = 0; i < n; i++) { const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n, p = new THREE.Vector3(cx + lr * Math.cos((a0 + a1) / 2), ey + lr * Math.sin((a0 + a1) / 2), z), u = new THREE.Vector3(-Math.sin((a0 + a1) / 2), Math.cos((a0 + a1) / 2), 0); T.box(p, u, new THREE.Vector3().crossVectors(Zv, u), Zv, lr * Math.PI / n + 0.0005, t, t, w); } }
      else { const a = lr * 1.12, b = lr * 0.78; T.box(new THREE.Vector3(cx, ey + b, z), X, Y, Zv, a + t, t, t, w); T.box(new THREE.Vector3(cx, ey - b, z), X, Y, Zv, a + t, t, t, w); T.box(new THREE.Vector3(cx - a, ey, z), X, Y, Zv, t, b, t, w); T.box(new THREE.Vector3(cx + a, ey, z), X, Y, Zv, t, b, t, w); }
      const ox = cx + sx * (opt.glasses === 'round' ? lr : lr * 1.12); T.box(new THREE.Vector3(ox + sx * 0.004 * S, ey + 0.006 * S, z - 0.045 * S), Zv, Y, X, 0.045 * S, t * 0.8, t * 0.8, w);   // càng kính
    }
    T.box(new THREE.Vector3(head.x, ey + 0.006 * S, z + 0.002 * S), X, Y, Zv, ex - lr * 1.05, t * 0.8, t * 0.8, w);   // cầu kính
  }
  // ---- đũa phép (gỗ, đầu pha lê) trong tay phải ----
  if (opt.wand) {
    const grip = rHand.clone().add(new THREE.Vector3(-0.045 * S, -0.012 * S, 0.012 * S)), dir = new THREE.Vector3(-0.15, 0.12, 1).normalize(), w = { [iRH]: 1 };
    const u = new THREE.Vector3(1, 0, 0).cross(dir).normalize(), vv = new THREE.Vector3().crossVectors(dir, u), Lw = 0.32 * S, wood = [0.42, 0.27, 0.16], hand = [0.25, 0.15, 0.09], tip = [0.75, 0.92, 1];
    const n = 6; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, r0 = lerp(0.0095, 0.005, t0) * S, r1 = lerp(0.0095, 0.005, t1) * S, c = i < 2 ? hand : wood;
      for (let k = 0; k < 6; k++) { const a0 = 2 * Math.PI * k / 6, a1 = 2 * Math.PI * (k + 1) / 6, P = (t, r, a) => grip.clone().addScaledVector(dir, (t - 0.2) * Lw).addScaledVector(u, r * Math.cos(a)).addScaledVector(vv, r * Math.sin(a)); const p = [P(t0, r0, a0), P(t1, r1, a0), P(t1, r1, a1), P(t0, r0, a1)].map(q => N.v(q.x, q.y, q.z, w, c)); N.quad(p[0], p[3], p[2], p[1]); } }
    T.box(grip.clone().addScaledVector(dir, 0.8 * Lw + 0.008 * S), u, vv, dir, 0.006 * S, 0.006 * S, 0.01 * S, w);   // đầu đũa màu viền nhà
  }

  // ---- lưới + vật liệu ----
  const skel = new THREE.Skeleton(bones), group = [];
  const pal = PALETTE[opt.house] || PALETTE.long, matA = mtoon(pal.robe, S, true), matT = mtoon(pal.trim, S, false), matN = mtoon('#6b4528', S, false);   // gỗ đũa
  const mk = (sk, mats, name) => { if (!sk.idx.length) return null; const g = sk.geometry(); if (mats.length > 1) { g.addGroup(0, g.index.count, 0); g.addGroup(0, g.index.count, 1); } const me = new THREE.SkinnedMesh(g, mats.length > 1 ? mats : mats[0]); me.name = name; me.frustumCulled = false; me.castShadow = name === 'robe'; model.add(me); me.updateMatrixWorld(true); me.bind(skel, me.matrixWorld); group.push(me); return me; };
  parts.robe = mk(A, matA, 'robe'); parts.trim = mk(T, matT, 'trim'); parts.wand = mk(N, matN, 'wand');
  const tris = group.reduce((s, me) => s + me.geometry.index.count / 3, 0);

  // ---- SpringBone vạt sau + va chạm chân; tóc va chạm lưng áo ----
  if (opt.robe !== false && vrm.springBoneManager) {
    const SBM = vrm.springBoneManager, cg = { name: 'robe-legs', colliders: [] };
    const cap = (bone, toBone, r) => { const b = raw(bone), t = raw(toBone); if (!b || !t) return; const c = new VRMSpringBoneCollider(new VRMSpringBoneColliderShapeCapsule({ offset: new THREE.Vector3(), tail: b.worldToLocal(t.getWorldPosition(V())), radius: r })); b.add(c); cg.colliders.push(c); };
    cap('leftUpperLeg', 'leftLowerLeg', 0.085 * S); cap('rightUpperLeg', 'rightLowerLeg', 0.085 * S); cap('leftLowerLeg', 'leftFoot', 0.07 * S); cap('rightLowerLeg', 'rightFoot', 0.07 * S);
    chains.b0.forEach((b0, i) => SBM.addJoint(new VRMSpringBoneJoint(b0, chains.b1[i], { stiffness: 0.9, gravityPower: 0.6, dragForce: 0.55, hitRadius: 0.04 * S }, [cg])));
    // lưng áo cho tóc dài (tóc không xuyên vào trong áo)
    const back = { name: 'robe-back', colliders: [] }, sp = raw('spine'), r0 = ring(chest.y), r1 = ring(hips.y), rad = 0.07 * S;
    const c = new VRMSpringBoneCollider(new VRMSpringBoneColliderShapeCapsule({ offset: sp.worldToLocal(new THREE.Vector3(0, chest.y + 0.05 * S, r0.zc - r0.zb + rad)), tail: sp.worldToLocal(new THREE.Vector3(0, hips.y - 0.1 * S, r1.zc - r1.zb + rad)), radius: rad }));
    sp.add(c); back.colliders.push(c);
    for (const j of SBM.joints) if (!j.bone.name.startsWith('robe-spring')) j.colliderGroups = [...j.colliderGroups, back];
  }
  const outlines = [matA[1]].filter(Boolean);
  return {
    group, parts, tris, outlines, S, headTop,
    mats: { robe: matA[0], robeOutline: matA[1], trim: matT[0] },
    setHouse(id) { const p = PALETTE[id] || PALETTE.long; for (const [m, c] of [[matA[0], p.robe], [matT[0], p.trim]]) { m.color.set(c); m.shadeColorFactor.set(c).multiplyScalar(0.62); } },
    setWand(on) { if (parts.wand) parts.wand.visible = !!on; },
  };
}
