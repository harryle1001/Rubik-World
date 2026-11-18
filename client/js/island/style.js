// style.js — Phong cách vẽ kiểu Zelda: MeshToonMaterial 4 bậc sáng mềm + viền mảnh nâu tím (inverted hull).
import * as THREE from 'three';
import { CFG } from './config.js';

// Dải sáng nhiều bậc (CFG.toon.steps), lọc Nearest để ra các mảng màu rõ ràng
const steps = CFG.toon.steps.map(v => Math.round(v * 255));
export const gradientMap = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.RedFormat);
gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter; gradientMap.needsUpdate = true;

// ===== PHONG CÁCH VẼ TAY (kiểu Zelda/Genshin) — áp cho MỌI MeshToonMaterial một lần, không tốn draw call =====
// 1) vân cọ vẽ tay theo toạ độ thế giới (mảng màu lớn + nét cọ nhỏ) → hết cảm giác "nhựa phẳng"
// 2) bóng ngả lam tím, sáng ngả vàng ấm (như tranh màu nước)  3) viền sáng mép (rim) mềm
if (!THREE.ShaderLib.toon.__painted) {
  const L = THREE.ShaderLib.toon;
  L.vertexShader = L.vertexShader
    .replace('void main() {', 'varying highp vec3 vPaintW;\nvoid main() {')
    .replace('#include <project_vertex>', `#include <project_vertex>
  { vec4 pw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    pw = instanceMatrix * pw;
  #endif
    vPaintW = (modelMatrix * pw).xyz; }`);
  L.fragmentShader = L.fragmentShader
    .replace('void main() {', `varying highp vec3 vPaintW;
// hash nhỏ gọn (số luôn < ~40) để điện thoại chạy mediump không tràn số → NaN → màn hình đen
bool pBad(float x){ return (floatBitsToUint(x) & 0x7f800000u) == 0x7f800000u; }   // NaN/inf (kiểm tra bit: fast-math không bỏ qua)
float pH(highp vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 19.19); return fract((p.x + p.y) * p.z); }
float pN(highp vec3 x){ x = mod(x, 289.0); vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(pH(i), pH(i + vec3(1,0,0)), f.x), mix(pH(i + vec3(0,1,0)), pH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(pH(i + vec3(0,0,1)), pH(i + vec3(1,0,1)), f.x), mix(pH(i + vec3(0,1,1)), pH(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main() {`)
    .replace('#include <color_fragment>', `#include <color_fragment>
  { float big = pN(vPaintW * 0.21), mid = pN(vPaintW * 0.9 + 7.3), fine = pN(vPaintW * vec3(3.4, 6.8, 3.4));
    diffuseColor.rgb *= 0.8 + 0.24 * big + 0.1 * mid + 0.08 * fine;                       // mảng màu + nét cọ
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.04, 1.0, 0.95), big * 0.5);
    // giữ cỏ/lá trong bảng màu: xanh lá quá gắt → hạ bão hoà, mảng lớn ngả vàng ấm / lam mát (không phẳng một màu)
    float gm = smoothstep(0.02, 0.14, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));
    vec3 gry = vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)));
    diffuseColor.rgb = mix(diffuseColor.rgb, gry, gm * 0.16);
    diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(0.9, 0.97, 1.06), vec3(1.07, 1.01, 0.84), big), gm * 0.6); }`)
    .replace('#include <opaque_fragment>', `{ float lum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
    vec3 cool = outgoingLight * vec3(0.84, 0.88, 1.10), warm = outgoingLight * vec3(1.05, 1.0, 0.92);
    outgoingLight = mix(cool, warm, smoothstep(0.18, 0.62, lum));                             // bóng lam, sáng ấm
    float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
    outgoingLight += rim * 0.10 * diffuseColor.rgb;
    outgoingLight = max(outgoingLight, vec3(0.0));                                          // viền sáng mép
    if (pBad(outgoingLight.r) || pBad(outgoingLight.g) || pBad(outgoingLight.b)) outgoingLight = diffuseColor.rgb * 0.5; }   // chặn NaN: không để 1 vật lỗi làm đen màn hình
#include <opaque_fragment>`);
  L.__painted = true;
}

const cache = new Map();
// Vật liệu toon dùng chung theo màu (đỡ tạo nhiều vật liệu)
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.unique && cache.has(key)) return cache.get(key);
  const o = Object.assign({ color, gradientMap }, opts); delete o.unique;
  const m = new THREE.MeshToonMaterial(o); cache.set(key, m); if (!opts.unique) m.userData.shared = true; return m;
}
// Bản sao cho InstancedMesh của vật liệu dùng chung (toon theo màu, viền): cùng 1 vật liệu vừa cho Mesh vừa cho InstancedMesh
// → three đổi chương trình shader mỗi lần vẽ xen kẽ (getProgram mỗi lần đổi). perf.js gán tự động khi quét cảnh.
const instTwins = new Map();
export function instancedTwin(m) {
  if (m === outlineMat) return outlineInstMat;
  if (!m.userData.shared) return m;
  let t = instTwins.get(m); if (!t) { t = m.clone(); t.userData = { shared: true, twinOf: m }; instTwins.set(m, t); } return t;
}

// Viền: vẽ lại mặt sau, đẩy đỉnh theo pháp tuyến ra ngoài
export const outlineMat = new THREE.MeshBasicMaterial({ color: CFG.outline.color, side: THREE.BackSide });
// độ dày theo khoảng cách tới camera (chuẩn CFG.outline.ref m): gần không thô, xa không mất nét; kẹp trong [1/φ, φ²]
outlineMat.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float oD = -(modelViewMatrix * vec4(transformed, 1.)).z;
    transformed += normalize(normal) * ${CFG.outline.thickness.toFixed(3)} * clamp(oD / ${CFG.outline.ref.toFixed(1)}, 0.618, 2.618);`);
};
// bản riêng cho lưới có xương / InstancedMesh: 1 vật liệu dùng chung cho cả 3 kiểu lưới làm three đổi chương trình shader
// mỗi lần vẽ xen kẽ (getProgram + dựng khoá cache mỗi lần → CPU + rác cho GC), dù không phải biên dịch lại
export const outlineSkinMat = outlineMat.clone(), outlineInstMat = outlineMat.clone();
outlineSkinMat.onBeforeCompile = outlineInstMat.onBeforeCompile = outlineMat.onBeforeCompile;
export const isOutlineMat = m => m === outlineMat || m === outlineSkinMat || m === outlineInstMat;
export function addOutline(root) {
  const list = []; root.traverse(o => { if (o.isMesh && !o.userData.outline) list.push(o); });
  for (const o of list) {
    if (!o.visible) continue;
    let e;
    if (o.isSkinnedMesh) { e = new THREE.SkinnedMesh(o.geometry, outlineSkinMat); e.bind(o.skeleton, o.bindMatrix); e.position.copy(o.position); e.quaternion.copy(o.quaternion); e.scale.copy(o.scale); o.parent.add(e); } // nhân vật có xương: viền cùng chuyển động
    else { e = new THREE.Mesh(o.geometry, outlineMat); o.add(e); }
    e.userData.outline = true; e.castShadow = false; e.frustumCulled = false; e.raycast = () => {};
  }
}

// Chuyển mọi vật liệu của model (GLTF) sang toon, giữ màu/texture gốc
export function toonify(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material; o.material = new THREE.MeshToonMaterial({ name: m.name, color: m.color || 0xffffff, map: m.map || null, gradientMap, vertexColors: !!o.geometry.attributes.color });
    o.castShadow = o.receiveShadow = true;
  });
  return root;
}
