// buildings.js — CÁC CÔNG TRÌNH (mỗi khu một phong cách kiến trúc) + MINI GAME HỌC TẬP bên trong.
// - Kích thước/chỗ cửa của từng kiểu nhà: STYLE_INFO
// - Hình dáng từng kiểu nhà: các hàm trong STYLES (nordic, pagoda, castle, greenhouse, observatory, stilt, sundial)
// - Câu hỏi của mini game: GAMES (math, history, english, biology, planets, geo, clock)
// - Phần thưởng: hàm finish() ở cuối file
import * as THREE from 'three';
import { Mesher, prismGeo, wedgeGeo, flatMat, rng } from './utils.js';

// hw/hd: nửa rộng/nửa sâu (m) để tính va chạm và chỗ đặt vòng sáng; flat: bán kính san phẳng nền
export const STYLE_INFO = {
  nordic: { hw: 5, hd: 4.4, flat: 9 },
  pagoda: { hw: 7.4, hd: 7.0, flat: 12, cd: 5.6 },
  castle: { hw: 9.4, hd: 7.6, flat: 14 },
  greenhouse: { hw: 6.4, hd: 5.2, flat: 10 },
  observatory: { hw: 3.8, hd: 3.8, flat: 9 },
  stilt: { hw: 5.4, hd: 5.0, flat: 10, cd: 3.4 },
  sundial: { hw: 0, hd: 3.4, flat: 7 },
  none: { hw: 0, hd: 1.5, flat: 6 },
};

// ---------- Hình khối nhỏ (y = đáy khối) ----------
const box = (m, w, h, d, c, x, y, z, o = {}) => m.add(new THREE.BoxGeometry(w, h, d), c, Object.assign({ p: [x, y + h / 2, z] }, o));
const cyl = (m, rt, rb, h, seg, c, x, y, z, o = {}) => m.add(new THREE.CylinderGeometry(rt, rb, h, seg), c, Object.assign({ p: [x, y + h / 2, z] }, o));
// mái 4 mái (chóp tứ giác) nửa rộng hx, nửa sâu hz, cao h
const hip = (m, hx, hz, h, c, x, y, z, top) => m.add(new THREE.ConeGeometry(1, 1, 4), c, { p: [x, y + h / 2, z], r: [0, Math.PI / 4, 0], s: [hx / 0.7071, h, hz / 0.7071], top });

const STYLES = {
  // Nhà gỗ Bắc Âu: tường đỏ Falu, viền trắng, mái cỏ xanh, ống khói đá
  nordic(m, g) {
    box(m, 8.6, 0.6, 6.6, '#8d8a83', 0, 0, 0);
    box(m, 8, 3.2, 6, '#9c2e2a', 0, 0.6, 0, { top: '#b8443a' });
    for (let i = 1; i < 6; i++) box(m, 8.06, 0.06, 6.06, '#7f2522', 0, 0.6 + i * 0.55, 0);
    for (const x of [-4, 4]) for (const z of [-3, 3]) box(m, 0.32, 3.3, 0.32, '#f3efe6', x, 0.6, z);
    box(m, 1.7, 2.5, 0.1, '#f3efe6', 0, 0.6, 3.02); box(m, 1.3, 2.2, 0.16, '#5a3a22', 0, 0.6, 3.04);
    for (const x of [-2.4, 2.4]) { box(m, 1.4, 1.4, 0.12, '#f3efe6', x, 1.6, 3.03); g.add(new THREE.BoxGeometry(1.05, 1.05, 0.14), '#ffd68a', { p: [x, 2.3, 3.05] }); box(m, 1.5, 0.3, 0.4, '#6b4a2c', x, 1.35, 3.2); for (let k = -1; k <= 1; k++) m.add(new THREE.IcosahedronGeometry(0.17, 0), k ? '#ff6b6b' : '#ffd166', { p: [x + k * 0.45, 1.75, 3.2] }); }
    for (const x of [-4.03, 4.03]) { box(m, 0.12, 1.4, 1.4, '#f3efe6', x, 1.6, 0); g.add(new THREE.BoxGeometry(0.14, 1.05, 1.05), '#ffd68a', { p: [x * 1.002, 2.3, 0] }); }
    m.add(prismGeo(9.6, 3.4, 7.6), '#55702f', { p: [0, 3.8, 0], top: '#86a84e' });
    m.add(prismGeo(9.2, 3.2, 7.65), '#3c3a3e', { p: [0, 3.75, 0] });
    const sl = Math.hypot(4.8, 3.4), an = Math.atan2(3.4, 4.8);
    for (const z of [3.82, -3.82]) for (const s of [-1, 1]) box(m, sl + 0.2, 0.26, 0.2, '#f3efe6', s * 2.4, 3.8 + 1.7 - 0.13, z, { r: [0, 0, -s * an] });
    box(m, 0.9, 2.6, 0.9, '#7d7770', 2.4, 5.0, -1.2, { top: '#958e85' });
    // đống củi bên hông
    for (let i = 0; i < 9; i++) m.add(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 6), i % 2 ? '#9b6a3c' : '#b07a45', { p: [5.0, 0.25 + Math.floor(i / 3) * 0.42, -2 + (i % 3) * 0.46], r: [Math.PI / 2, 0, 0] });
  },

  // Đình làng Việt: nền đá, cột son đỏ, tường vàng, mái ngói 2 tầng cong vút ở góc
  pagoda(m, g) {
    box(m, 14, 0.9, 11, '#9b8f7d', 0, 0, 0, { top: '#b4a993' });
    for (let i = 0; i < 3; i++) box(m, 5, 0.3, 0.7, '#a89c88', 0, 0.9 - (i + 1) * 0.3, 5.85 + i * 0.6);
    box(m, 11, 3.2, 5.6, '#e0b45a', 0, 0.9, -0.4, { top: '#ecc777' });
    box(m, 3.2, 2.7, 0.18, '#7a1f1c', 0, 0.9, 2.42);
    box(m, 2.6, 0.55, 0.12, '#d9a628', 0, 3.45, 2.52);
    for (const x of [-3.6, 3.6]) g.add(new THREE.BoxGeometry(1.2, 1.4, 0.14), '#ffcf7a', { p: [x, 2.3, 2.45] });
    for (const x of [-5.2, -1.9, 1.9, 5.2]) for (const z of [3.4, -3.9]) cyl(m, 0.26, 0.3, 3.4, 8, '#a8262a', x, 0.9, z);
    box(m, 12.4, 0.35, 8.4, '#6e2a20', 0, 4.15, -0.2);
    hip(m, 7.7, 5.6, 2.3, '#7d3b2a', 0, 4.3, -0.2, '#a34e33');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.add(new THREE.ConeGeometry(0.3, 1.7, 4), '#a34e33', { p: [sx * 7.3, 4.75, -0.2 + sz * 5.3], r: [sz * 0.95, 0, -sx * 0.95] });
    box(m, 5.4, 1.5, 3.4, '#e0b45a', 0, 5.5, -0.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(m, 0.14, 0.14, 1.5, 6, '#a8262a', sx * 2.6, 5.5, -0.2 + sz * 1.6);
    hip(m, 4.4, 3.0, 1.9, '#7d3b2a', 0, 6.9, -0.2, '#a34e33');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.add(new THREE.ConeGeometry(0.22, 1.3, 4), '#a34e33', { p: [sx * 4.1, 7.25, -0.2 + sz * 2.8], r: [sz * 0.95, 0, -sx * 0.95] });
    // lưỡng long chầu nguyệt trên nóc
    m.add(new THREE.IcosahedronGeometry(0.42, 0), '#f2c14e', { p: [0, 8.9, -0.2] });
    for (const s of [-1, 1]) m.add(new THREE.TorusGeometry(0.5, 0.12, 4, 8, Math.PI * 1.3), '#5f8f6a', { p: [s * 1.0, 8.75, -0.2], r: [0, 0, s > 0 ? 0.3 : 2.4] });
    // lư hương + đèn lồng
    cyl(m, 0.55, 0.4, 0.7, 8, '#8a6a3a', 0, 0.9, 4.6); cyl(m, 0.6, 0.6, 0.12, 8, '#a8844a', 0, 1.6, 4.6);
    for (const x of [-2.6, 2.6]) { box(m, 0.05, 0.6, 0.05, '#3a2a1a', x, 3.55, 3.5); g.add(new THREE.IcosahedronGeometry(0.34, 1), '#ff4d3a', { p: [x, 3.35, 3.5], s: [1, 1.25, 1] }); }
  },

  // Lâu đài châu Âu: tường đá, 4 tháp tròn mái chóp xanh, cờ đỏ, cổng vòm
  castle(m, g) {
    const st = '#b7ad9c', st2 = '#9c9282', blue = '#3f5c9a', blue2 = '#6584c2';
    for (const x of [-5.1, 5.1]) box(m, 5.8, 5, 1.2, st, x, 0, 6.4, { top: '#c6bdae' });
    box(m, 4.4, 1.6, 1.2, st, 0, 3.4, 6.4);
    box(m, 3.8, 3.4, 0.3, '#3a2f28', 0, 0, 6.1);
    for (let i = -1; i <= 1; i++) box(m, 0.08, 3.3, 0.1, '#6b6b70', i * 0.9, 0, 6.3);
    for (const x of [-7.4, 7.4]) box(m, 1.2, 5, 13, st, x, 0, 0, { top: '#c6bdae' });
    box(m, 16, 5, 1.2, st, 0, 0, -6.4, { top: '#c6bdae' });
    for (let i = -7; i <= 7; i += 1.4) { box(m, 0.75, 0.8, 1.3, st2, i, 5, 6.4); box(m, 0.75, 0.8, 1.3, st2, i, 5, -6.4); }
    for (let i = -6; i <= 6; i += 1.4) { box(m, 1.3, 0.8, 0.75, st2, -7.4, 5, i); box(m, 1.3, 0.8, 0.75, st2, 7.4, 5, i); }
    for (const x of [-7.6, 7.6]) for (const z of [-6.6, 6.6]) {
      cyl(m, 1.9, 2.1, 8, 10, st2, x, 0, z, { top: st });
      m.add(new THREE.ConeGeometry(2.5, 3.8, 10), blue, { p: [x, 9.9, z], top: blue2 });
      box(m, 0.08, 1.8, 0.08, '#4a4a4a', x, 11.6, z); m.add(prismGeo(1.0, 0.7, 0.05), '#c8302c', { p: [x + 0.5, 12.6, z], r: [0, 0, -Math.PI / 2] });
      for (const s of [0, 1, 2, 3]) g.add(new THREE.BoxGeometry(0.4, 0.9, 0.2), '#ffcf7a', { p: [x + Math.sin(s * 1.57) * 2.0, 5.2, z + Math.cos(s * 1.57) * 2.0], r: [0, s * 1.57, 0] });
    }
    box(m, 8, 9.5, 7, '#c4baa8', 0, 0, -1.5, { top: '#d3cab9' });
    for (let i = -3.5; i <= 3.5; i += 1.4) box(m, 0.7, 0.8, 0.7, st2, i, 9.5, 1.8);
    cyl(m, 1.7, 1.8, 14, 10, '#c4baa8', 0, 0, -2.5);
    m.add(new THREE.ConeGeometry(2.3, 4.6, 10), blue, { p: [0, 16.3, -2.5], top: blue2 });
    box(m, 0.1, 2.2, 0.1, '#4a4a4a', 0, 18.5, -2.5); m.add(prismGeo(1.4, 0.9, 0.05), '#f2c14e', { p: [0.7, 19.7, -2.5], r: [0, 0, -Math.PI / 2] });
    for (const x of [-2.4, 0, 2.4]) g.add(new THREE.BoxGeometry(0.6, 1.4, 0.2), '#ffcf7a', { p: [x, 6.8, 2.02] });
    for (const x of [-3.2, 3.2]) { box(m, 1.3, 2.4, 0.1, '#b3262a', x, 1.8, 7.05); box(m, 0.5, 0.5, 0.12, '#f2c14e', x, 2.8, 7.06); }
  },

  // Nhà kính hiện đại: khung trắng, vòm kính trong, cây xanh bên trong, pin mặt trời
  greenhouse(m, g, glass) {
    box(m, 12, 0.8, 8, '#e8e6e0', 0, 0, 0);
    glass.add(new THREE.CylinderGeometry(3.9, 3.9, 11.6, 14, 1, true, 0, Math.PI), '#bfeee6', { p: [0, 0.8, 0], r: [0, 0, Math.PI / 2] });
    for (const x of [-5.8, 5.8]) glass.add(new THREE.CircleGeometry(3.9, 14, 0, Math.PI), '#bfeee6', { p: [x, 0.8, 0], r: [0, Math.PI / 2, 0] });
    for (let x = -5.8; x <= 5.81; x += 1.45) m.add(new THREE.TorusGeometry(3.95, 0.07, 4, 14, Math.PI), '#f6f6f2', { p: [x, 0.8, 0], r: [0, Math.PI / 2, 0] });
    for (let a = 0.35; a < Math.PI; a += 0.6) box(m, 11.7, 0.08, 0.08, '#f6f6f2', 0, 0.8 + Math.sin(a) * 3.95, Math.cos(a) * 3.95);
    glass.add(new THREE.BoxGeometry(2.4, 2.8, 1.6), '#cdf3ec', { p: [0, 2.2, 4.4] });
    box(m, 2.5, 0.12, 1.7, '#f6f6f2', 0, 3.6, 4.4); for (const x of [-1.2, 1.2]) box(m, 0.1, 2.8, 0.1, '#f6f6f2', x, 0.8, 5.2);
    for (const z of [-2, 1.4]) { box(m, 10, 0.6, 1.2, '#8a6a42', 0, 0.8, z); for (let x = -4.5; x <= 4.5; x += 1.1) { const k = Math.round(x * 3 + z * 7) % 3; if (k === 0) m.add(new THREE.ConeGeometry(0.4, 1.4, 6), '#4f8a3c', { p: [x, 2.1, z], top: '#7cb85a' }); else if (k === 1) m.add(new THREE.IcosahedronGeometry(0.5, 0), '#5d9a45', { p: [x, 1.8, z] }); else { cyl(m, 0.05, 0.05, 1.4, 4, '#4f8a3c', x, 1.4, z); m.add(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8), '#ffcf3a', { p: [x, 2.85, z + 0.05], r: [1.3, 0, 0] }); } } }
    // pin mặt trời + bồn nước
    for (const z of [-2.4, 0, 2.4]) { box(m, 0.15, 1.2, 0.15, '#9aa0a8', -7.6 + 0.4, 0, z); m.add(new THREE.BoxGeometry(1.6, 0.06, 2.2), '#2a4a8a', { p: [-7.2, 1.4, z], r: [0, 0, 0.5] }); }
    cyl(m, 0.9, 0.9, 2.2, 10, '#dfe6ea', 7.4, 0, -2.6, { top: '#f5f8fa' });
  },

  // Tháp thiên văn: thân trắng sọc xanh đậm, ban công, mái vòm bạc, kính thiên văn
  observatory(m, g) {
    cyl(m, 3.6, 3.8, 1.4, 8, '#9a9184', 0, 0, 0, { top: '#b0a798' });
    cyl(m, 2.5, 2.8, 9, 12, '#f1ede4', 0, 1.4, 0);
    for (const y of [3.6, 7.0]) cyl(m, 2.72, 2.75, 0.35, 12, '#2d3e6b', 0, y, 0);
    box(m, 1.5, 2.4, 0.4, '#f1ede4', 0, 1.4, 2.6); box(m, 1.2, 2.1, 0.45, '#2d3e6b', 0, 1.4, 2.62);
    for (const y of [5.2, 8.4]) for (let a = 0; a < 4; a++) g.add(new THREE.BoxGeometry(0.5, 0.7, 0.2), '#ffd68a', { p: [Math.sin(a * 1.571 + 0.78) * 2.62, y, Math.cos(a * 1.571 + 0.78) * 2.62], r: [0, a * 1.571 + 0.78, 0] });
    cyl(m, 3.4, 3.4, 0.25, 14, '#cfc8bb', 0, 10.4, 0);
    for (let a = 0; a < 16; a++) box(m, 0.07, 0.9, 0.07, '#2d3e6b', Math.sin(a * 0.3927) * 3.25, 10.65, Math.cos(a * 0.3927) * 3.25);
    m.add(new THREE.TorusGeometry(3.25, 0.06, 4, 16), '#2d3e6b', { p: [0, 11.55, 0], r: [Math.PI / 2, 0, 0] });
    m.add(new THREE.SphereGeometry(2.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#9fb0c9', { p: [0, 10.65, 0], top: '#dfe7f2' });
    box(m, 0.8, 0.12, 2.7, '#2b2f3a', 0, 12.0, 1.0, { r: [-0.75, 0, 0] });
    m.add(new THREE.CylinderGeometry(0.32, 0.4, 3.4, 8), '#6d7a96', { p: [0, 13.1, 1.6], r: [0.75, 0, 0] });
    m.add(new THREE.OctahedronGeometry(0.4, 0), '#f2c14e', { p: [0, 13.5, -0.8] });
  },

  // Nhà sàn Tây Bắc: cột gỗ cao, sàn gỗ, vách tre, mái tranh dốc, khau cút trên nóc, cầu thang
  stilt(m, g) {
    for (const x of [-4, -1.33, 1.33, 4]) for (const z of [-2.6, 0, 2.6]) cyl(m, 0.16, 0.19, 2.45, 6, '#6b4a2c', x, 0, z);
    box(m, 9.4, 0.3, 6.4, '#8a6a42', 0, 2.4, 0);
    box(m, 8.6, 2.2, 5.4, '#cfb57a', 0, 2.7, 0, { top: '#d9c38c' });
    for (let x = -4.1; x <= 4.11; x += 0.55) for (const z of [2.72, -2.72]) box(m, 0.08, 2.2, 0.06, '#b39a5f', x, 2.7, z);
    box(m, 1.3, 1.9, 0.12, '#5a3e24', 0, 2.7, 2.76);
    for (const x of [-2.6, 2.6]) { box(m, 1.3, 0.9, 0.1, '#7a5a34', x, 3.4, 2.75); g.add(new THREE.BoxGeometry(1.0, 0.65, 0.12), '#ffc870', { p: [x, 3.85, 2.77] }); }
    box(m, 4.4, 0.25, 1.8, '#8a6a42', 0, 2.4, 3.9);
    for (const x of [-2.1, 2.1]) cyl(m, 0.12, 0.14, 2.45, 6, '#6b4a2c', x, 0, 4.7);
    for (let x = -2.1; x <= 2.11; x += 0.7) if (Math.abs(x) > 0.7) box(m, 0.08, 0.8, 0.08, '#6b4a2c', x, 2.65, 4.75);
    box(m, 1.5, 0.08, 0.08, '#6b4a2c', -1.45, 3.4, 4.75); box(m, 1.5, 0.08, 0.08, '#6b4a2c', 1.45, 3.4, 4.75);
    for (let i = 0; i < 7; i++) box(m, 1.3, 0.14, 0.42, '#7a5a34', 0, 2.25 - i * 0.34, 5.0 + i * 0.32);
    for (const x of [-0.7, 0.7]) box(m, 0.1, 0.1, 3.1, '#5a3e24', x, 1.2, 5.95, { r: [0.82, 0, 0] });
    m.add(prismGeo(11.2, 4.2, 8.0), '#a8823e', { p: [0, 4.75, 0], top: '#dcbb72' });
    m.add(prismGeo(10.2, 0.7, 8.06), '#8f6c30', { p: [0, 4.7, 0] });
    for (const z of [-4.0, 4.0]) for (const s of [-1, 1]) box(m, 0.14, 1.6, 0.14, '#4a321c', s * 0.3, 8.5, z, { r: [0, 0, s * 0.55] });
    for (const x of [-1.6, 1.6]) g.add(new THREE.IcosahedronGeometry(0.28, 1), '#ff6a3a', { p: [x, 4.15, 4.6], s: [1, 1.3, 1] });
    for (let i = 0; i < 4; i++) m.add(new THREE.ConeGeometry(0.12, 0.5, 5), '#f2c14e', { p: [3.4 + i * 0.18, 4.1, 3.3], r: [Math.PI, 0, 0] });
    cyl(m, 0.45, 0.35, 0.8, 8, '#8a5a3a', 5.2, 0, 2);
  },

  // Đồng hồ mặt trời: mặt đá tròn, 12 cột giờ, kim bóng bằng đồng
  sundial(m) {
    cyl(m, 3.6, 3.8, 0.3, 16, '#bdb19a', 0, 0, 0); cyl(m, 3.1, 3.1, 0.12, 16, '#e4dac4', 0, 0.3, 0);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; box(m, 0.35, i % 3 ? 0.35 : 0.6, 0.35, '#8f8676', Math.sin(a) * 2.7, 0.42, Math.cos(a) * 2.7); }
    m.add(wedgeGeo(0.18, 1.6, 2.4), '#b08a4a', { p: [0, 0.42, 0], r: [0, Math.PI, 0] });
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (Math.abs(Math.sin(a / 2)) < 0.2) continue; m.add(new THREE.IcosahedronGeometry(0.5, 0), '#5f8f3c', { p: [Math.sin(a) * 4.6, 0.35, Math.cos(a) * 4.6], s: [1, 0.8, 1], top: '#7fae4f' }); }
  },

  none(m) { for (const x of [-1.6, 1.6]) box(m, 0.35, 3, 0.35, '#8a5a34', x, 0, 0); box(m, 4, 0.35, 0.5, '#a8262a', 0, 3, 0); },
};

// ---------- Dựng công trình vào thế giới ----------
export function createBuildings(ctx, world) {
  const mat = flatMat({ side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const glassMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  for (const a of world.layout.areas) {
    const m = new Mesher(), g = new Mesher(), glass = new Mesher();
    (STYLES[a.style] || STYLES.none)(m, g, glass);
    const grp = new THREE.Group(); grp.position.set(a.x, a.h, a.z); grp.rotation.y = a.rot;
    const body = new THREE.Mesh(m.geometry(), mat); body.castShadow = body.receiveShadow = true; grp.add(body);
    if (!g.empty) grp.add(new THREE.Mesh(g.geometry(), glowMat));
    if (!glass.empty) { const gm = new THREE.Mesh(glass.geometry(), glassMat); gm.renderOrder = 2; grp.add(gm); }
    ctx.scene.add(grp);
    const info = a.info;
    if (info.hw > 0) ctx.colliders.push({ x: a.x, z: a.z, hw: info.hw, hd: info.cd || info.hd, rot: a.rot });
    else if (a.style === 'sundial') ctx.colliders.push({ x: a.x, z: a.z, r: 1.2 });
  }
  return { update() { const n = world.state.night; glowMat.color.setScalar(0.5 + n * 0.9); } };
}

// =====================================================================
//                      MINI GAME HỌC TẬP
// Mỗi game trả về danh sách câu hỏi: { q, choices, a (đáp án đúng), explain, art? } hoặc { type:'order', q, items }
// =====================================================================
const R = Math.random, pick = arr => arr[Math.floor(R() * arr.length)], shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const numChoices = (ans, spread = 4) => { const s = new Set([ans]); let k = 0; while (s.size < 4 && k++ < 50) { const v = ans + ri(-spread, spread); if (v > 0) s.add(v); } let v = ans + 1; while (s.size < 4) s.add(v++); return shuffle([...s]).map(String); };
const bank = list => shuffle(list).slice(0, 5).map(([q, a, wrong, explain]) => ({ q, a, choices: shuffle([a, ...wrong]), explain }));

const GAMES = {
  math: {
    emoji: '🪵', color: '#b8443a', intro: 'Bác thợ mộc cần bạn tính giúp số gỗ để đóng đồ. Làm đúng hết sẽ được tặng gỗ để tự xây nhà!',
    make() {
      const T = [
        () => { const a = ri(3, 9), b = ri(4, 9); return { q: `Bác thợ có ${a} bó gỗ, mỗi bó ${b} khúc. Có tất cả bao nhiêu khúc gỗ?`, ans: a * b, explain: `${a} × ${b} = ${a * b} khúc gỗ.` }; },
        () => { const a = ri(30, 95), b = ri(8, a - 5); return { q: `Xưởng có ${a} tấm ván, đã dùng ${b} tấm để đóng ghế. Còn lại bao nhiêu tấm?`, ans: a - b, explain: `${a} − ${b} = ${a - b} tấm ván.` }; },
        () => { const a = ri(2, 9), b = ri(3, 9); return { q: `Có ${a * b} khúc gỗ chia đều cho ${a} bạn. Mỗi bạn được mấy khúc?`, ans: b, explain: `${a * b} : ${a} = ${b} khúc.` }; },
        () => { const a = ri(4, 12), b = ri(2, a - 1); return { q: `Tấm sàn hình chữ nhật dài ${a} m, rộng ${b} m. Chu vi tấm sàn là bao nhiêu mét?`, ans: 2 * (a + b), explain: `Chu vi = (dài + rộng) × 2 = (${a} + ${b}) × 2 = ${2 * (a + b)} m.` }; },
        () => { const a = ri(3, 9), b = ri(2, 8); return { q: `Sàn nhà dài ${a} m, rộng ${b} m. Cần bao nhiêu tấm sàn 1 m² để lát kín?`, ans: a * b, explain: `Diện tích = dài × rộng = ${a} × ${b} = ${a * b} m², nên cần ${a * b} tấm.` }; },
        () => { const k = ri(3, 12) * 4; return { q: `Khúc gỗ dài ${k} cm, bác cưa đi 1/4 khúc. Phần cưa đi dài bao nhiêu cm?`, ans: k / 4, explain: `1/4 của ${k} là ${k} : 4 = ${k / 4} cm.` }; },
        () => { const p = ri(2, 6), n = ri(3, 8); return { q: `Mỗi chiếc ghế cần ${p} khúc gỗ. Đóng ${n} chiếc ghế cần bao nhiêu khúc?`, ans: p * n, explain: `${p} × ${n} = ${p * n} khúc.` }; },
      ];
      return shuffle(T).slice(0, 5).map(f => { const r = f(); return { q: r.q, a: String(r.ans), choices: numChoices(r.ans, Math.max(3, Math.round(r.ans * 0.2))), explain: r.explain }; });
    },
  },
  history: {
    emoji: '🏮', color: '#a8262a', intro: 'Ông từ giữ đình kể chuyện lịch sử nước ta. Nghe kỹ và trả lời nhé!',
    make: () => bank([
      ['Nhà nước đầu tiên của nước ta do các Vua Hùng lập ra tên là gì?', 'Văn Lang', ['Âu Lạc', 'Đại Việt', 'Đại Cồ Việt'], 'Nhà nước Văn Lang do các Vua Hùng dựng nên, kinh đô ở Phong Châu.'],
      ['Thành Cổ Loa hình xoắn ốc gắn với vị vua nào?', 'An Dương Vương', ['Vua Hùng', 'Lý Thái Tổ', 'Gia Long'], 'An Dương Vương xây thành Cổ Loa, kinh đô nước Âu Lạc.'],
      ['Hai Bà Trưng khởi nghĩa năm 40 để chống lại ai?', 'Quân Đông Hán', ['Quân Nguyên Mông', 'Quân Minh', 'Quân Thanh'], 'Năm 40, Hai Bà Trưng đánh đuổi quân Đông Hán, giành lại 65 thành.'],
      ['Chiến thắng Bạch Đằng năm 938 gắn với tên tuổi của ai?', 'Ngô Quyền', ['Lý Thái Tổ', 'Lê Lợi', 'Đinh Bộ Lĩnh'], 'Ngô Quyền dùng cọc gỗ cắm dưới sông Bạch Đằng, đánh tan quân Nam Hán, mở ra thời kỳ độc lập lâu dài.'],
      ['Năm 1010, vua Lý Thái Tổ dời đô từ Hoa Lư về đâu?', 'Thăng Long', ['Cổ Loa', 'Huế', 'Phong Châu'], 'Thăng Long nghĩa là "rồng bay lên", nay là Hà Nội.'],
      ['Văn Miếu – Quốc Tử Giám (lập năm 1076) được xem là gì?', 'Trường đại học đầu tiên của nước ta', ['Cung điện của vua', 'Một pháo đài', 'Chợ lớn nhất'], 'Quốc Tử Giám là nơi dạy học cho con vua quan và người học giỏi.'],
      ['Ai lãnh đạo nhà Trần ba lần đánh thắng quân Nguyên Mông?', 'Hưng Đạo Vương Trần Quốc Tuấn', ['Lê Lợi', 'Quang Trung', 'Ngô Quyền'], 'Nhà Trần ba lần thắng quân Nguyên Mông (1258, 1285, 1288) với tinh thần "Sát Thát".'],
      ['Cuộc khởi nghĩa Lam Sơn do ai lãnh đạo?', 'Lê Lợi', ['Nguyễn Huệ', 'Trần Hưng Đạo', 'Lý Thường Kiệt'], 'Lê Lợi cùng nghĩa quân Lam Sơn kháng chiến 10 năm (1418–1427) đuổi quân Minh.'],
      ['Vua Quang Trung đại phá quân Thanh vào dịp nào?', 'Tết Kỷ Dậu năm 1789', ['Năm 938', 'Năm 1010', 'Năm 1945'], 'Trận Ngọc Hồi – Đống Đa diễn ra đúng dịp Tết, quân Tây Sơn tiến vào Thăng Long.'],
      ['Đình làng thường dùng để làm gì?', 'Thờ Thành Hoàng và họp việc làng', ['Bán hàng như chợ', 'Làm cung điện cho vua', 'Canh gác biên giới'], 'Đình là trung tâm sinh hoạt của làng: thờ cúng, hội họp, mở hội.'],
      ['Ngày Quốc khánh nước Việt Nam là ngày nào?', 'Ngày 2 tháng 9', ['Ngày 30 tháng 4', 'Ngày 1 tháng 5', 'Ngày 19 tháng 8'], 'Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại quảng trường Ba Đình.'],
      ['"Nam quốc sơn hà" được xem là gì?', 'Bản tuyên ngôn độc lập đầu tiên', ['Một bài hát ru', 'Một bộ luật', 'Tên một con sông'], 'Bài thơ gắn với Lý Thường Kiệt khẳng định chủ quyền nước Nam.'],
    ]),
  },
  english: {
    emoji: '🛡️', color: '#3f5c9a', intro: 'Hiệp sĩ gác cổng chỉ mở cửa cho người biết tiếng Anh. Bấm 🔊 để nghe cách đọc!',
    make() {
      const W = [['🍎', 'apple', 'quả táo'], ['🐘', 'elephant', 'con voi'], ['🏰', 'castle', 'lâu đài'], ['📚', 'book', 'quyển sách'], ['🌳', 'tree', 'cái cây'], ['🐟', 'fish', 'con cá'], ['☀️', 'sun', 'mặt trời'], ['🚲', 'bicycle', 'xe đạp'], ['🌧️', 'rain', 'mưa'], ['🐱', 'cat', 'con mèo'], ['🦋', 'butterfly', 'con bướm'], ['🌙', 'moon', 'mặt trăng'], ['🏠', 'house', 'ngôi nhà'], ['✏️', 'pencil', 'bút chì'], ['🍌', 'banana', 'quả chuối'], ['🌸', 'flower', 'bông hoa'], ['🦁', 'lion', 'sư tử'], ['🚪', 'door', 'cái cửa'], ['🐦', 'bird', 'con chim'], ['⭐', 'star', 'ngôi sao']];
      const S = [['I ride my ___ to school.', 'bicycle', '🚲'], ['The ___ is shining in the sky.', 'sun', '☀️'], ['A ___ can swim in the river.', 'fish', '🐟'], ['I read a ___ every night.', 'book', '📚'], ['The ___ is singing in the tree.', 'bird', '🐦'], ['Please open the ___.', 'door', '🚪']];
      const qs = [];
      for (const w of shuffle(W).slice(0, 2)) qs.push({ q: `"${w[2]}" trong tiếng Anh là gì?`, art: w[0], a: w[1], choices: shuffle([w[1], ...shuffle(W.filter(x => x !== w)).slice(0, 3).map(x => x[1])]), explain: `${w[1]} = ${w[2]}`, say: w[1] });
      for (const w of shuffle(W).slice(0, 2)) qs.push({ q: `Từ "${w[1]}" nghĩa là gì?`, art: '🔊', a: w[2], choices: shuffle([w[2], ...shuffle(W.filter(x => x !== w)).slice(0, 3).map(x => x[2])]), explain: `${w[1]} ${w[0]} = ${w[2]}`, say: w[1] });
      const s = pick(S); qs.push({ q: `Điền từ: "${s[0]}"`, art: s[2], a: s[1], choices: shuffle([s[1], ...shuffle(W.map(x => x[1]).filter(x => x !== s[1])).slice(0, 3)]), explain: s[0].replace('___', s[1]), say: s[0].replace('___', s[1]) });
      return qs;
    },
  },
  biology: {
    emoji: '🌱', color: '#3f8f5a', intro: 'Cô kỹ sư nông nghiệp đang chăm cây trong nhà kính. Cùng tìm hiểu cây sống thế nào nhé!',
    make: () => bank([
      ['Cây xanh cần gì để quang hợp (tự làm ra chất dinh dưỡng)?', 'Ánh sáng, nước và khí cacbonic', ['Chỉ cần đất', 'Bóng tối và muối', 'Đường và sữa'], 'Lá dùng ánh sáng mặt trời biến nước và khí CO₂ thành chất dinh dưỡng, đồng thời nhả ra khí ôxi.'],
      ['Bộ phận nào của cây hút nước và muối khoáng?', 'Rễ', ['Lá', 'Hoa', 'Quả'], 'Rễ có nhiều lông hút, hút nước và muối khoáng trong đất.'],
      ['Khi quang hợp, cây nhả ra khí gì giúp chúng ta thở?', 'Khí ôxi', ['Khí cacbonic', 'Khí nitơ', 'Hơi nước muối'], 'Vì vậy cây xanh được gọi là "lá phổi" của Trái Đất.'],
      ['Lá cây có màu xanh nhờ chất gì?', 'Chất diệp lục', ['Chất béo', 'Muối khoáng', 'Tinh bột'], 'Diệp lục giúp lá hấp thụ ánh sáng để quang hợp.'],
      ['Hạt đậu nảy mầm cần những điều kiện nào?', 'Nước, không khí và nhiệt độ thích hợp', ['Chỉ cần ánh đèn', 'Để trong tủ đá', 'Không cần nước'], 'Thiếu nước hoặc quá lạnh, hạt sẽ không nảy mầm.'],
      ['Con ong giúp gì cho cây có hoa?', 'Giúp hoa thụ phấn để tạo quả', ['Ăn hết lá cây', 'Làm cây héo', 'Không giúp gì'], 'Ong mang phấn hoa từ bông này sang bông khác.'],
      ['Quả do bộ phận nào của hoa phát triển thành?', 'Bầu nhụy', ['Cánh hoa', 'Đài hoa', 'Cuống lá'], 'Sau khi thụ phấn, bầu nhụy lớn dần thành quả, bên trong có hạt.'],
      ['Xương rồng ở sa mạc có lá biến thành gai để làm gì?', 'Giảm mất nước', ['Để bay', 'Để hút ánh sáng nhiều hơn', 'Để mọc nhanh'], 'Gai làm hơi nước ít thoát ra, giúp cây sống nơi khô hạn.'],
      ['Thân cây có nhiệm vụ chính là gì?', 'Nâng đỡ cây và vận chuyển nước, chất dinh dưỡng', ['Làm ra hạt', 'Hút ánh sáng', 'Giữ cho rễ ấm'], 'Thân như "đường ống" nối rễ với lá.'],
      ['Vì sao nên trồng nhiều cây xanh?', 'Cho bóng mát, lọc không khí, giữ đất', ['Để che hết ánh nắng', 'Để đường hẹp lại', 'Không có lợi ích gì'], 'Cây còn là nhà của chim, bướm và nhiều loài vật.'],
    ]),
  },
  planets: {
    emoji: '🔭', color: '#2d3e6b', intro: 'Nhà thiên văn mời bạn lên tháp ngắm bầu trời. Xếp đúng các hành tinh rồi trả lời câu đố!',
    make() {
      const order = { type: 'order', q: 'Bấm lần lượt các hành tinh từ GẦN đến XA Mặt Trời ☀️', items: ['☿ Sao Thủy', '♀ Sao Kim', '🌍 Trái Đất', '🔴 Sao Hỏa', '🟠 Sao Mộc', '🪐 Sao Thổ', '🔵 Sao Thiên Vương', '🌀 Sao Hải Vương'], explain: 'Mẹo nhớ: Thủy – Kim – Địa (Trái Đất) – Hỏa – Mộc – Thổ – Thiên Vương – Hải Vương.' };
      return [order, ...bank([
        ['Hành tinh nào lớn nhất Hệ Mặt Trời?', 'Sao Mộc', ['Trái Đất', 'Sao Hỏa', 'Sao Thủy'], 'Sao Mộc lớn tới mức chứa được hơn 1.000 Trái Đất.'],
        ['Hành tinh nào có vành đai đẹp, dễ nhìn thấy nhất?', 'Sao Thổ', ['Sao Kim', 'Sao Hỏa', 'Trái Đất'], 'Vành đai Sao Thổ gồm vô số mảnh băng và đá.'],
        ['Hành tinh nào được gọi là "Hành tinh Đỏ"?', 'Sao Hỏa', ['Sao Mộc', 'Sao Hải Vương', 'Sao Kim'], 'Đất đá Sao Hỏa chứa nhiều gỉ sắt nên có màu đỏ.'],
        ['Mặt Trăng là gì của Trái Đất?', 'Vệ tinh tự nhiên', ['Một ngôi sao', 'Một hành tinh', 'Một sao chổi'], 'Mặt Trăng quay quanh Trái Đất khoảng 27 ngày một vòng.'],
        ['Trái Đất quay một vòng quanh Mặt Trời mất khoảng bao lâu?', 'Khoảng 365 ngày (1 năm)', ['1 ngày', '1 tháng', '10 năm'], 'Đó là lý do một năm có 365 ngày.'],
        ['Vì sao có ngày và đêm?', 'Vì Trái Đất tự quay quanh trục', ['Vì Mặt Trời tắt', 'Vì mây che', 'Vì Mặt Trăng che'], 'Nửa quay về phía Mặt Trời là ngày, nửa kia là đêm.'],
        ['Hành tinh nào nóng nhất Hệ Mặt Trời?', 'Sao Kim', ['Sao Thủy', 'Trái Đất', 'Sao Thổ'], 'Sao Kim có lớp khí dày giữ nhiệt, nóng hơn cả Sao Thủy dù xa Mặt Trời hơn.'],
      ]).slice(0, 4)];
    },
  },
  geo: {
    emoji: '🏞️', color: '#8f6c30', intro: 'Bà cụ người Thái mời bạn lên nhà sàn uống nước và kể về đất nước Việt Nam.',
    make: () => bank([
      ['Vì sao nhà sàn được dựng trên những cột cao?', 'Để tránh thú dữ, ẩm thấp và lũ', ['Để trang trí cho đẹp', 'Để gần mây hơn', 'Vì thiếu đất'], 'Nhà sàn của người Thái, Tày, Mường, Ê Đê… rất hợp với vùng núi nhiều mưa.'],
      ['Đỉnh núi cao nhất Việt Nam là đỉnh nào?', 'Phan Xi Păng', ['Bà Đen', 'Lang Biang', 'Ba Vì'], 'Phan Xi Păng cao khoảng 3.143 m, được gọi là "nóc nhà Đông Dương".'],
      ['Lãnh thổ Việt Nam có hình dạng giống chữ cái nào?', 'Chữ S', ['Chữ O', 'Chữ L', 'Chữ V'], 'Đất liền Việt Nam cong mềm như chữ S, trải dài từ Bắc vào Nam.'],
      ['Thủ đô của Việt Nam là thành phố nào?', 'Hà Nội', ['Huế', 'Đà Nẵng', 'Cần Thơ'], 'Hà Nội nằm bên bờ sông Hồng.'],
      ['Vịnh nào nổi tiếng với hàng nghìn đảo đá vôi, là Di sản thiên nhiên thế giới?', 'Vịnh Hạ Long', ['Vịnh Cam Ranh', 'Vịnh Vân Phong', 'Vịnh Thái Lan'], 'Vịnh Hạ Long ở Quảng Ninh có gần 2.000 hòn đảo.'],
      ['Đồng bằng lớn nhất Việt Nam là?', 'Đồng bằng sông Cửu Long', ['Đồng bằng sông Hồng', 'Cao nguyên Mộc Châu', 'Đồng bằng ven biển miền Trung'], 'Đây là vựa lúa và trái cây lớn nhất cả nước.'],
      ['Dãy núi dài nhất Việt Nam là dãy nào?', 'Trường Sơn', ['Hoàng Liên Sơn', 'Bạch Mã', 'Tam Đảo'], 'Dãy Trường Sơn dài hơn 1.000 km dọc theo miền Trung.'],
      ['Hai quần đảo xa bờ của Việt Nam là?', 'Hoàng Sa và Trường Sa', ['Côn Đảo và Phú Quốc', 'Cát Bà và Lý Sơn', 'Cô Tô và Bạch Long Vĩ'], 'Hoàng Sa và Trường Sa là một phần lãnh thổ thiêng liêng của Tổ quốc.'],
      ['Hang động lớn nhất thế giới nằm ở Việt Nam tên là gì?', 'Hang Sơn Đoòng', ['Động Phong Nha', 'Hang Múa', 'Động Thiên Cung'], 'Sơn Đoòng lớn đến mức bên trong có cả rừng cây và mây riêng.'],
      ['Con sông nào chảy qua Hà Nội?', 'Sông Hồng', ['Sông Hương', 'Sông Hàn', 'Sông Sài Gòn'], 'Sông Hồng mang phù sa màu đỏ nâu, bồi đắp đồng bằng Bắc Bộ.'],
    ]),
  },
  clock: {
    emoji: '🕰️', color: '#b08a4a', intro: 'Ngày xưa người ta xem giờ bằng bóng nắng. Hôm nay mình học xem đồng hồ kim nhé!',
    make() {
      const fmt = (h, m) => `${h} giờ${m ? ' ' + m + ' phút' : ''}`;
      const qs = [];
      for (let i = 0; i < 5; i++) {
        const h = ri(1, 12), m = pick([0, 15, 30, 45, 5, 10, 20, 25, 35, 40, 50, 55].slice(0, i < 2 ? 4 : 12));
        const later = i === 4;
        const add = 30; let h2 = h, m2 = m + add; if (m2 >= 60) { m2 -= 60; h2 = h2 % 12 + 1; }
        const ans = later ? fmt(h2, m2) : fmt(h, m);
        const wrong = new Set(); while (wrong.size < 3) { const wh = ri(1, 12), wm = pick([0, 15, 30, 45, m, (m + 30) % 60]); const s = fmt(wh, wm); if (s !== ans) wrong.add(s); }
        if (!later) wrong.delete(fmt(m / 5 || 12, h * 5 % 60)); // tránh nhầm do đọc ngược kim
        while (wrong.size < 3) wrong.add(fmt(ri(1, 12), 0));
        qs.push({ q: later ? 'Đồng hồ đang chỉ giờ như hình. 30 phút nữa là mấy giờ?' : 'Đồng hồ chỉ mấy giờ?', clock: [h, m], a: ans, choices: shuffle([ans, ...[...wrong].slice(0, 3)]), explain: `Kim ngắn (kim giờ) chỉ gần số ${h}, kim dài (kim phút) chỉ số ${m / 5 || 12} → ${fmt(h, m)}.` + (later ? ` Thêm 30 phút là ${ans}.` : '') });
      }
      return qs;
    },
  },
};

function clockSVG(h, m) {
  const a = (m / 60) * 360, b = ((h % 12) / 12) * 360 + (m / 60) * 30;
  let ticks = ''; for (let i = 1; i <= 12; i++) { const t = (i / 12) * Math.PI * 2; ticks += `<text x="${50 + Math.sin(t) * 37}" y="${54 + -Math.cos(t) * 37}" font-size="9" text-anchor="middle" fill="#5a4630" font-weight="700">${i}</text>`; }
  return `<svg viewBox="0 0 100 100" class="clock"><circle cx="50" cy="50" r="47" fill="#fff8e8" stroke="#b08a4a" stroke-width="4"/>${ticks}
    <line x1="50" y1="50" x2="${50 + Math.sin(b * Math.PI / 180) * 22}" y2="${50 - Math.cos(b * Math.PI / 180) * 22}" stroke="#3a2a1a" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${50 + Math.sin(a * Math.PI / 180) * 33}" y2="${50 - Math.cos(a * Math.PI / 180) * 33}" stroke="#b3262a" stroke-width="2.6" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="#3a2a1a"/></svg>`;
}

// ---------- Màn hình khu vực (mở sau khi bước vào vòng sáng) ----------
export function createAreaScreen(ctx) {
  const el = document.getElementById('area'), body = document.getElementById('areaBody');
  let cur = null, onClose = null;
  const say = t => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
  const best = (() => { try { return JSON.parse(localStorage.getItem('game3d.best') || '{}'); } catch (e) { return {}; } })();

  function open(area, cb) {
    const G = GAMES[area.game] || GAMES.math; cur = { area, G }; onClose = cb;
    el.style.setProperty('--accent', G.color);
    document.getElementById('areaTitle').textContent = area.name;
    document.getElementById('areaSub').textContent = area.sub || '';
    body.innerHTML = `<div class="intro"><div class="big">${G.emoji}</div><p>${G.intro}</p>${best[area.id] != null ? `<p class="muted">Kỷ lục của bạn: ${best[area.id]}/5 ⭐</p>` : ''}<button class="primary" id="gStart">Bắt đầu</button></div>`;
    el.hidden = false;
    document.getElementById('gStart').onclick = () => start();
  }
  function start() {
    const qs = cur.G.make(); let i = 0, score = 0;
    const show = () => {
      if (i >= qs.length) return finish(score, qs.length);
      const q = qs[i];
      const head = `<div class="qhead"><span>Câu ${i + 1}/${qs.length}</span><span>⭐ ${score}</span></div>`;
      if (q.type === 'order') {
        const items = shuffle(q.items); let next = 0, errors = 0;
        body.innerHTML = head + `<p class="q">${q.q}</p><div class="choices order">${items.map(t => `<button>${t}</button>`).join('')}</div><div class="fb" id="fb"></div>`;
        body.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
          if (b.disabled) return;
          if (b.textContent === q.items[next]) { b.disabled = true; b.classList.add('ok'); b.dataset.n = ++next; if (next === q.items.length) { if (errors <= 1) score++; feedback(errors <= 1, (errors <= 1 ? 'Giỏi lắm! ' : `Bạn chọn nhầm ${errors} lần. `) + q.explain); } }
          else { errors++; b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450); ctx.sfx && ctx.sfx('bad'); }
        });
        return;
      }
      body.innerHTML = head + `${q.clock ? clockSVG(...q.clock) : q.art ? `<div class="art">${q.art}</div>` : ''}<p class="q">${q.q}${q.say ? ' <button class="say" aria-label="Nghe">🔊</button>' : ''}</p><div class="choices">${q.choices.map(c => `<button>${c}</button>`).join('')}</div><div class="fb" id="fb"></div>`;
      const sb = body.querySelector('.say'); if (sb) sb.onclick = () => say(q.say);
      body.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
        const ok = b.textContent === q.a; if (ok) score++;
        body.querySelectorAll('.choices button').forEach(x => { x.disabled = true; if (x.textContent === q.a) x.classList.add('ok'); });
        if (!ok) b.classList.add('bad');
        if (q.say) say(q.say);
        feedback(ok, q.explain);
      });
    };
    const feedback = (ok, text) => {
      ctx.sfx && ctx.sfx(ok ? 'good' : 'bad');
      const fb = document.getElementById('fb');
      fb.innerHTML = `<b>${ok ? '✅ Chính xác!' : '💡 Chưa đúng rồi.'}</b> ${text}<br><button class="primary" id="gNext">${i + 1 < qs.length ? 'Câu tiếp' : 'Xem kết quả'}</button>`;
      document.getElementById('gNext').onclick = () => { i++; show(); };
    };
    show();
  }
  // Phần thưởng: mỗi câu đúng +1 sao; đúng hết thì được tặng thêm gỗ
  function finish(score, total) {
    const inv = ctx.inventory; inv.add('star', score);
    const perfect = score === total; if (perfect) inv.add('wood', 6);
    best[cur.area.id] = Math.max(best[cur.area.id] || 0, score); try { localStorage.setItem('game3d.best', JSON.stringify(best)); } catch (e) {}
    body.innerHTML = `<div class="intro"><div class="big">${perfect ? '🏆' : score >= 3 ? '🌟' : '💪'}</div><h3>${score}/${total} câu đúng</h3><p>Bạn nhận được ⭐ × ${score}${perfect ? ' và 🪵 Gỗ × 6 để xây nhà!' : '.'}</p><p class="muted">${perfect ? 'Tuyệt vời! Hãy thử khu khác nhé.' : 'Chơi lại để đạt điểm tuyệt đối nha!'}</p><div class="row"><button id="gAgain">Chơi lại</button><button class="primary" id="gLeave">Rời khu</button></div></div>`;
    document.getElementById('gAgain').onclick = () => start();
    document.getElementById('gLeave').onclick = close;
    ctx.sfx && ctx.sfx(perfect ? 'win' : 'good');
  }
  function close() { if (!cur) return; el.hidden = true; cur = null; const cb = onClose; onClose = null; cb && cb(); }
  document.getElementById('areaClose').onclick = close;
  return { open, close, get isOpen() { return !!cur; } };
}
