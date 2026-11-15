// sample/palette.js — BẢNG MÀU + VẬT LIỆU CHUẨN của khu mẫu "Cổng trường + Quảng trường" (nhân ra mọi khu khác).
// Dùng:  import { PAL, mat, matV, PHI_GOLD } from './sample/palette.js';
//        new THREE.Mesh(geo, mat('stoneCream'))        // vật liệu toon dùng chung (cache, 1 material / tên)
//        new THREE.Mesh(geo, matV())                   // khối gộp tô màu đỉnh (vertexColors) — gộp nhiều màu vào 1 draw call
//        PAL.roof.hex / PAL.roof.color (THREE.Color)   // tô màu đỉnh cho Batch / mergeGeometries
// Quy tắc (docs/style-guide.md): không pha màu mới ngoài bảng; cần sáng/tối hơn → shade(tên, k) với k = φ^±n.
// Màu chọn cho ánh sáng ACES + toon 4 bậc: không bão hoà quá 0,62 (≈ 1/φ), độ sáng đá kem ≤ 0,92 để không cháy trắng lúc trưa.
import * as THREE from 'three';
import { toon } from '../style.js';

export const PHI = (1 + Math.sqrt(5)) / 2;
export const PHI_GOLD = '#d4a24a';   // vàng φ: điểm nhấn quý (chữ cổng, viền huy hiệu, chóp tượng) — tối đa 1/13 diện tích khung

// [hex, vai trò]. Nhóm theo vật liệu thật; mỗi nhóm có sáng (chính) · tối (phụ, ≈ chính / φ độ sáng) · nhấn.
const DEF = {
  // ĐÁ KEM — tường, cột, vòm cổng (chủ đạo ~61,8 % diện tích công trình = 1/φ)
  stoneCream:  ['#efe3c8', 'tường/cột đá kem chủ đạo'],
  stoneCreamL: ['#f7efdc', 'gờ, phào chỉ, viền cửa (sáng hơn 1 bậc)'],
  stoneCreamD: ['#d9c8a6', 'chân tường, mặt dưới vòm (tối hơn 1 bậc)'],
  // ĐÁ XÁM ẤM — bậc thềm, bệ, lát quảng trường, đế cột (~23,6 % = 1/φ³)
  stoneWarm:   ['#bdb2a0', 'bậc thềm, bệ tượng, đế cột'],
  stoneWarmL:  ['#d6ccbb', 'gạch lát quảng trường'],
  stoneWarmD:  ['#948a7b', 'mạch lát, viền bồn cây, bóng hõm'],
  // NGÓI ĐỎ ĐẤT — mái (~14,6 % = 1/φ⁴)
  roof:        ['#c45a3a', 'ngói mái chính'],
  roofL:       ['#d77352', 'mặt mái hứng nắng / hàng ngói lẻ'],
  roofD:       ['#93402a', 'bờ nóc, diềm mái, mặt dưới'],
  // GỖ
  wood:        ['#a8744a', 'cánh cửa, ghế, khung bảng tin'],
  woodD:       ['#6e4a30', 'nẹp, chân ghế, dầm'],
  // XANH CỬA CHỚP (xanh lục ngọc kiểu Đông Dương)
  shutter:     ['#3f8a73', 'cửa chớp, cánh cửa sổ'],
  shutterD:    ['#2c6455', 'khung chớp, nan tối'],
  glass:       ['#8fb9cc', 'kính cửa sổ (không phát sáng ban ngày)'],
  // CÂY CỎ
  grass:       ['#7fbf5e', 'thảm cỏ cắt'],
  grassD:      ['#5a9a48', 'mép cỏ, cỏ bóng râm'],
  leaf:        ['#4f9a4a', 'tán lá, hàng rào cây'],
  leafD:       ['#357040', 'lá bóng tối, cây bụi thấp'],
  // HOA (điểm nhấn nhỏ, cụm Fibonacci 3·5·8)
  flowerRed:   ['#e0503e', 'hoa đỏ (phượng, hồng)'],
  flowerPink:  ['#ee93a8', 'hoa hồng phấn'],
  flowerYellow:['#f2c443', 'hoa vàng (cúc)'],
  flowerWhite: ['#f6f1e6', 'hoa trắng'],
  // KIM LOẠI ĐÈN / HÀNG RÀO — sắt sơn đen tím (không đen thuần)
  iron:        ['#3a3344', 'cột đèn, hàng rào sắt, tay vịn'],
  ironL:       ['#5a5266', 'mặt sáng cột đèn'],
  brass:       [PHI_GOLD, 'đồng thau: chụp đèn, chữ cổng, huy hiệu'],
  lampGlow:    ['#ffe3a0', 'bóng đèn (phát sáng tự thân)'],
  // RUBIK (tượng quảng trường) — 6 màu chuẩn, đã dịu đi cho ACES
  rubikR:      ['#d8433a', 'Rubik đỏ'],
  rubikG:      ['#3f9f52', 'Rubik xanh lá'],
  rubikB:      ['#3a6fcc', 'Rubik xanh dương'],
  rubikY:      ['#f0c232', 'Rubik vàng'],
  rubikO:      ['#ef8530', 'Rubik cam'],
  rubikW:      ['#f3efe6', 'Rubik trắng'],
  // KHÁC
  plaster:     ['#f3ead6', 'trần, mặt trong hiên'],
  ink:         ['#3d2b3f', 'chữ, viền outline (CFG.outline.color)'],
};

export const PAL = {};
for (const [k, [hex, role]] of Object.entries(DEF)) PAL[k] = { hex, role, color: new THREE.Color(hex) };

// Tham số vật liệu theo nhóm: kim loại & kính hơi bóng nhờ emissive rất nhẹ (toon không có specular)
const OPT = {
  lampGlow: { emissive: '#ffd27a', emissiveIntensity: 1 / PHI },   // > ngưỡng bloom khi đêm, dịu ban ngày
  brass: { emissive: PHI_GOLD, emissiveIntensity: 1 / PHI ** 4 },  // ánh vàng nhẹ, không cháy
  glass: { emissive: '#1d3440', emissiveIntensity: 1 / PHI ** 3 },
};

/** Vật liệu toon dùng chung theo tên trong bảng (cache trong style.js → 1 material/tên, ghép instancing tốt). */
export function mat(name, extra) {
  const p = PAL[name]; if (!p) throw new Error('palette: không có màu ' + name);
  const o = Object.assign({}, OPT[name], extra);
  return toon(p.hex, o);
}
/** Vật liệu toon trắng + vertexColors: dùng cho khối gộp (Batch/mergeGeometries) tô màu đỉnh bằng PAL.x.color. */
export const matV = () => toon('#ffffff', { vertexColors: true });

const _c = new THREE.Color();
/** Màu sáng/tối hơn theo φ: k = 1 giữ nguyên, k > 1 sáng (×φ^… gần trắng), k < 1 tối. Trả về THREE.Color mới. */
export function shade(name, k) {
  const c = PAL[name].color.clone();
  return k >= 1 ? c.lerp(_c.set('#ffffff'), Math.min(1, (k - 1) / PHI)) : c.multiplyScalar(k);
}
