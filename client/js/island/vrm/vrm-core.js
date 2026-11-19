// vrm/vrm-core.js — Nạp nhân vật anime VRM (CC0, xem docs/vrm-preview/LICENSES.md) + tối ưu cho điện thoại.
// - three-vrm 3.5.5 (MIT) chép vào client/js/vendor/ (không dùng CDN).
// - Gộp primitive cùng vật liệu (mỗi lọn tóc VRoid là 1 primitive: 65–131 → ~15 lần vẽ/người).
// - Đổi màu tóc / mắt / da bằng litFactor (material.color) của MToon: texture tóc + mống mắt được chuyển xám 1 lần / mẫu.
// - File: assets/vrm/full (texture 1024, người chơi) · assets/vrm/mobile (texture 512, ~½ tam giác, NPC).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VRMLoaderPlugin, VRMUtils } from '../../vendor/three-vrm.module.min.js';

export const BASES = {   // mẫu đã duyệt (CC0, pixiv/VRoid) — texture WebP đủ màu (tools/vrm-slim.mjs --hq)
  victoria: { name: 'Nữ tóc buộc', gender: 'f' }, vivi: { name: 'Nữ tóc bob', gender: 'f' }, shino: { name: 'Nữ tóc dài', gender: 'f' },
  'hair-m': { name: 'Nam', gender: 'm' }, fumiriya: { name: 'Thầy giáo', gender: 'm' },
};
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); loader.register(p => new VRMLoaderPlugin(p));
const bufs = new Map();   // ArrayBuffer theo url (tải 1 lần, mỗi nhân vật parse riêng: three-vrm không clone được)
const fetchBuf = url => { if (!bufs.has(url)) bufs.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); })); return bufs.get(url); };
export const prefetch = (id, set = 'mobile') => fetchBuf(`/assets/vrm/${set}/${id}.vrm`).catch(() => null);

// ---------- texture xám (đổi màu bằng litFactor) ----------
const grayCache = new Map();
function grayTex(tex, key) {
  if (grayCache.has(key)) return grayCache.get(key);
  const img = tex.image, w = img.width, h = img.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h), a = d.data;
  let mx = 0; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 8) mx = Math.max(mx, 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]);
  const k = 255 / Math.max(mx, 1);   // sáng nhất → trắng: litFactor quyết định màu
  for (let i = 0; i < a.length; i += 4) { const l = Math.min(255, (0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]) * k); a[i] = a[i + 1] = a[i + 2] = l; }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv); for (const p of ['flipY', 'wrapS', 'wrapT', 'magFilter', 'minFilter', 'colorSpace', 'anisotropy', 'channel']) t[p] = tex[p];
  grayCache.set(key, t); return t;
}
// texture dùng chung giữa các bản sao cùng mẫu (đỡ bộ nhớ GPU): giữ texture của bản đầu tiên
const texShare = new Map();
function shareTextures(id, mats) {
  for (const m of mats) for (const k of ['map', 'shadeMultiplyTexture', 'normalMap', 'emissiveMap', 'matcapTexture', 'rimMultiplyTexture', 'shadingShiftTexture', 'uvAnimationMaskTexture']) {
    const t = m[k]; if (!t || !t.isTexture) continue; const key = id + '|' + m.name + '|' + k;
    if (!texShare.has(key)) texShare.set(key, t); else if (texShare.get(key) !== t) { t.dispose(); m[k] = texShare.get(key); }
  }
}

// ---------- gộp primitive cùng vật liệu ----------
function mergeByMaterial(root) {
  const groups = new Map();
  root.traverse(o => {
    if (!o.isSkinnedMesh || Object.keys(o.geometry.morphAttributes).length) return;
    const mats = [].concat(o.material), key = o.parent.uuid + '|' + mats[0].uuid + '|' + mats.length + '|' + o.skeleton.uuid;   // viền MToon là bản sao riêng mỗi lưới → so vật liệu chính
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(o);
  });
  let saved = 0;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const m0 = list[0], names = Object.keys(m0.geometry.attributes).sort().join();
    if (list.some(m => Object.keys(m.geometry.attributes).sort().join() !== names || !m.matrix.equals(m0.matrix))) continue;
    const geos = list.map(m => { const g = m.geometry.clone(); g.clearGroups(); return g; });
    const geo = mergeGeometries(geos); if (!geo) continue;
    const mats = [].concat(m0.material), n = geo.index ? geo.index.count : geo.attributes.position.count;
    if (mats.length > 1) for (let i = 0; i < mats.length; i++) geo.addGroup(0, n, i);   // MToon viền = vật liệu thứ 2 trên cùng lưới
    const sm = new THREE.SkinnedMesh(geo, m0.material); sm.name = m0.name; sm.bind(m0.skeleton, m0.bindMatrix);
    sm.position.copy(m0.position); sm.quaternion.copy(m0.quaternion); sm.scale.copy(m0.scale); sm.frustumCulled = false;
    m0.parent.add(sm); for (const m of list) { m.parent.remove(m); m.geometry.dispose(); } saved += list.length - 1;
  }
  return saved;
}

const matsOf = root => { const s = new Set(); root.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) s.add(m); }); return [...s]; };
// phân loại vật liệu VRoid theo tên
export const kindOf = n => /HAIR/.test(n) ? 'hair' : /EyeIris/.test(n) ? 'iris' : /_SKIN/.test(n) ? 'skin' : /EyeExtra/.test(n) ? 'extra' : /AccessoryNeck/.test(n) ? 'neck' : /Tops/.test(n) ? 'tops' : /Bottoms/.test(n) ? 'bottoms' : /Shoes/.test(n) ? 'shoes' : 'face';

// Nạp 1 bản VRM. Trả về { vrm, ms, tris, prims }
export async function loadVrm(id, set = 'mobile') {
  const t0 = performance.now(), url = `/assets/vrm/${set}/${id}.vrm`;
  const buf = await fetchBuf(url);
  const g = await loader.parseAsync(buf.slice(0), '/assets/vrm/');
  const vrm = g.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(g.scene); VRMUtils.combineSkeletons(g.scene); VRMUtils.rotateVRM0(vrm);
  const merged = mergeByMaterial(vrm.scene);
  const mats = matsOf(vrm.scene); shareTextures(id + set, mats);
  for (const m of mats) for (const k of ['map', 'shadeMultiplyTexture']) if (m[k] && m[k].anisotropy < 8) { m[k].anisotropy = 8; m[k].needsUpdate = true; }   // nét khi nhìn xiên
  for (const m of mats) {   // tóc + mống mắt: texture xám → đổi màu bằng litFactor
    const k = kindOf(m.name); if ((k !== 'hair' && k !== 'iris' && k !== 'neck') || !m.map) continue;   // nơ cổ: đổi màu theo nhà
    const src = m.map, gt = grayTex(src, id + set + m.name);
    m.map = gt; if (m.shadeMultiplyTexture === src) m.shadeMultiplyTexture = gt;
    m.userData.base = m.color.clone(); m.userData.shade = m.shadeColorFactor ? m.shadeColorFactor.clone() : null;
  }
  let tris = 0, prims = 0;
  vrm.scene.traverse(o => {
    if (!o.isMesh) return; o.frustumCulled = false;
    const k = kindOf([].concat(o.material)[0].name);
    if (k === 'extra') o.visible = false;
    o.castShadow = k === 'hair' || k === 'skin' && !Object.keys(o.geometry.morphAttributes).length || k === 'tops';   // bóng: chỉ thân + tóc (mặt, mắt không cần)
    o.userData.vrmKind = k; prims++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  });
  return { vrm, ms: Math.round(performance.now() - t0), tris: Math.round(tris), prims, merged };
}

// Màu tóc / mắt / da (litFactor = material.color của MToon; vùng tối = shadeColorFactor)
const _c = new THREE.Color();
export function tint(vrm, { hair, eye, skin, bow } = {}) {
  vrm.scene.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (m.isOutline || !m.color) continue; const k = kindOf(m.name);
      if (k === 'hair' && hair) { m.color.set(hair); if (m.shadeColorFactor) m.shadeColorFactor.copy(_c.set(hair).multiplyScalar(0.618)); }
      else if (k === 'iris' && eye) { m.color.set(eye); if (m.shadeColorFactor) m.shadeColorFactor.set(eye); }
      else if (k === 'neck' && bow) { m.color.set(bow); if (m.shadeColorFactor) m.shadeColorFactor.copy(_c.set(bow).multiplyScalar(0.62)); }
      else if (k === 'skin' && skin) { m.color.set(skin); if (m.shadeColorFactor) { m.userData.sh0 ??= m.shadeColorFactor.clone(); m.shadeColorFactor.copy(m.userData.sh0).multiply(_c.set(skin)); } }
    }
  });
}
// ẩn bớt lưới gốc khi mặc đồng phục phù thuỷ (váy/quần nằm trong áo choàng; nơ cổ thay bằng cà vạt)
// cắt phần váy liền (lưới áo) dưới eo khi mặc áo choàng: váy xoè không đâm xuyên vạt áo
export function cutBelow(vrm, kind, y) {
  vrm.humanoid.update(); vrm.scene.updateMatrixWorld(true); const v = new THREE.Vector3();
  vrm.scene.traverse(o => {
    if (!o.isSkinnedMesh || o.userData.vrmKind !== kind || !o.geometry.index) return;
    o.userData.cutY = y + 0.04;   // vrm-outfit.js: bỏ qua đỉnh dưới mức này khi đo dáng thân
    const g = o.geometry, pa = g.attributes.position, low = new Uint8Array(pa.count);
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); low[i] = v.y < y ? 1 : 0; }
    const I = g.index.array, keep = [];
    for (let t = 0; t < I.length; t += 3) if (!(low[I[t]] && low[I[t + 1]] && low[I[t + 2]])) keep.push(I[t], I[t + 1], I[t + 2]);
    g.setIndex(keep); g.clearGroups(); const n = keep.length, mats = [].concat(o.material); if (mats.length > 1) for (let i = 0; i < mats.length; i++) g.addGroup(0, n, i);
  });
}
export const hasPart = (vrm, kind) => { let f = false; vrm.scene.traverse(o => { if (o.isMesh && o.userData.vrmKind === kind) f = true; }); return f; };
export function hideParts(vrm, kinds) { vrm.scene.traverse(o => { if (o.isMesh && o.userData.vrmKind && kinds.includes(o.userData.vrmKind)) o.visible = false; }); }
export const outlineMats = vrm => matsOf(vrm.scene).filter(m => m.isOutline);
