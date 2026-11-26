// gltf-tex.js — Plugin GLTFLoader dùng chung (models.js, vrm/vrm-core.js) cho texture:
//  · GỘP TRÙNG: nhiều model kit dùng chung 1 ảnh atlas (vd. 1 atlas 1024² nằm trong 18 file .glb) → trước đây mỗi file 1 texture
//    riêng trên GPU. Nay băm byte ảnh → cùng nội dung + cùng sampler = 1 THREE.Texture (1 lần giải mã, 1 lần lên GPU).
//  · ĐIỆN THOẠI: ảnh > 512 px thu về ≤ 512 (1024² RGBA + mipmap ≈ 5,6 MB → 1,4 MB GPU); vật nhỏ trên màn 390 px không mất nét thấy được.
import * as THREE from 'three';
import { CFG } from './config.js';

const MAX = CFG.isMobile ? 512 : 4096;
const cache = new Map();
const hash = u8 => { let h = 0x811c9dc5 ^ u8.length; const st = u8.length > 65536 ? 7 : 1; for (let i = 0; i < u8.length; i += st) h = Math.imul(h ^ u8[i], 16777619); return (h >>> 0).toString(36) + ':' + u8.length; };
function shrink(t) {
  const im = t.image, w = im && (im.width || im.videoWidth), h = im && (im.height || im.videoHeight);
  if (!w || Math.max(w, h) <= MAX) return t;
  const k = MAX / Math.max(w, h), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
  const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, cv.width, cv.height);
  if (im.close) im.close();   // ImageBitmap gốc: giải phóng ngay
  t.image = cv; t.needsUpdate = true; return t;
}
export const texPlugin = parser => ({
  name: 'EXT_texture_webp',   // thay chỗ plugin WebP gốc của GLTFLoader (plugin gốc đứng trước sẽ nhận ảnh WebP của VRM trước plugin này)
  loadTexture(ti) {
    const J = parser.json, td = J.textures[ti], ex = td && td.extensions ? Object.keys(td.extensions) : [];
    if (!td || ex.some(k => k !== 'EXT_texture_webp')) return null;   // KTX2/basis…: để plugin gốc xử lý
    const si = ex.length ? td.extensions.EXT_texture_webp.source : td.source; if (si == null) return null;   // VRM (tools/vrm-slim.mjs): ảnh WebP
    const img = J.images[si]; if (!img || img.bufferView == null) return null;
    return parser.getDependency('bufferView', img.bufferView).then(buf => {
      const key = hash(new Uint8Array(buf)) + '|' + JSON.stringify(td.sampler != null ? J.samplers[td.sampler] : 0);
      if (!cache.has(key)) cache.set(key, parser.loadTextureImage(ti, si, parser.textureLoader).then(t => t && shrink(t)));
      return cache.get(key);
    });
  },
});

// Biển chữ/atlas vẽ bằng canvas (điện thoại): ảnh ≥ 2048 px hoặc ≥ 1 triệu điểm ảnh → ½ mỗi chiều (vd. atlas biển thị trấn
// 1024×3072 = 16 MB GPU → 4 MB). File tạo canvas vẫn vẽ lên canvas gốc như cũ: mỗi lần đặt needsUpdate, bản nhỏ được vẽ lại.
const NU = Object.getOwnPropertyDescriptor(THREE.Texture.prototype, 'needsUpdate');
export function shrinkCanvas(t) {
  if (!CFG.isMobile || t.userData._half) return; t.userData._half = 1;
  const src = t.image, w = src && src.width, h = src && src.height;
  if (!w || !h || !(Math.max(w, h) >= 2048 || w * h >= 1 << 20) || !NU) return;
  const cv = document.createElement('canvas'), g = cv.getContext('2d'); cv.width = w >> 1; cv.height = h >> 1; g.imageSmoothingQuality = 'high';
  const draw = () => { if (src.width !== cv.width * 2 || src.height !== cv.height * 2) { cv.width = Math.max(1, src.width >> 1); cv.height = Math.max(1, src.height >> 1); t.dispose(); } else g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, cv.width, cv.height); };
  draw(); t.image = cv; t.dispose();   // đã lên GPU ở cỡ cũ: three không cấp lại bộ nhớ khi đổi cỡ ảnh → bỏ để tạo lại đúng cỡ
  // (giữ thứ tự: dispose trước, needsUpdate sau)
  Object.defineProperty(t, 'needsUpdate', { set(v) { if (v) draw(); NU.set.call(this, v); }, configurable: true });
  t.needsUpdate = true;
}
