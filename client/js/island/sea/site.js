// sea/site.js — BỐ CỤC THẾ GIỚI ĐẠI DƯƠNG (chỉ số liệu, không dựng hình):
//   - Làng chài Vịnh Én ở vịnh cát hướng đông – đông nam (góc 23°, giữa khu Thể thao và Sân bay), hệ toạ độ riêng (u ra khơi, v dọc bờ).
//   - Luồng tàu lớn (tàu du lịch, tàu hàng) vòng nửa đông – nam đảo, cách bờ ~ 89–144 m (Fibonacci) để còn thấy trong sương.
//   - Tuyến phà 3 bến: Làng chài ⇄ Làng nổi ⇄ Resort Biển Xanh. Tránh góc tây bắc (cầu cạn Tàu Pha Lê, thuyền đèn lồng).
import { PHI } from '../layout.js';

export const DEG = Math.PI / 180;
export const polar = (r, deg) => [Math.cos(deg * DEG) * r, Math.sin(deg * DEG) * r];

// ----- Làng chài: gốc O = mép nước trên tia 23°, D hướng ra khơi, T dọc bờ -----
export const BAY_DEG = 23, BAY_R = 258.5;
const D = [Math.cos(BAY_DEG * DEG), Math.sin(BAY_DEG * DEG)], T = [-D[1], D[0]], O = [D[0] * BAY_R, D[1] * BAY_R];
export const BAY = { O, D, T, ry: Math.atan2(D[0], D[1]) };          // ry: xoay để +z cục bộ = hướng ra khơi
export const toW = (u, v) => [O[0] + D[0] * u + T[0] * v, O[1] + D[1] * u + T[1] * v];
export const toL = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * D[0] + dz * D[1], dx * T[0] + dz * T[1]]; };
export const NAME = 'Làng chài Vịnh Én';

// cầu tàu chính (v = PIER_V), đầu chữ T ở u = 34…39 (Fibonacci), mặt ván cao 1,1 m
export const DECK_Y = 1.1, PIER_V = -16, PIER_U0 = -5, PIER_U1 = 39, PIER_W = 3, HEAD_W = 21, HEAD_D = 5;
// sàn đi được (hình chữ nhật trong hệ u, v): [u0, u1, v0, v1, y]
export const HOUSES = [-50, -38, -27, 0, 11].map((v, i) => ({ v, i }));   // 5 nhà sàn (u tính theo mép nước lúc dựng)
export const DECKS = [
  [PIER_U0, PIER_U1, PIER_V - PIER_W / 2, PIER_V + PIER_W / 2, DECK_Y],
  [PIER_U1 - HEAD_D, PIER_U1, PIER_V - HEAD_W / 2, PIER_V + HEAD_W / 2, DECK_Y],
];

// ----- Bến phà: p = chỗ phà đậu (song song mép bến), land = chỗ khách bước lên -----
const A = toW(PIER_U1 + 4.7, PIER_V), aLand = toW(PIER_U1 - 1.6, PIER_V);
export const PONTOON = { x: 254.9, z: 253.9, r: 2, y: 1.1 };
export const RESORT_JETTY = { x0: -335, x1: -301.5, z: 30, w: 3, headW: 21, headD: 5, y: 1.3 };   // cầu phà riêng ở nam Resort (cầu cũ sát cầu cạn tàu hoả)
export const STOPS = [
  { id: 'chai', name: NAME, p: A, land: aLand },
  { id: 'noi', name: 'Làng nổi trên biển', p: [250.6, 249.6], land: [254.9, 253.9] },   // ponton 4 × 4 m nối dài đầu cầu Làng nổi (village.js)
  { id: 'resort', name: 'Resort Biển Xanh', p: [RESORT_JETTY.x0 - 4.7, RESORT_JETTY.z], land: [RESORT_JETTY.x0 + 2, RESORT_JETTY.z] },
];
// đường phà = VÒNG KÍN (phà luôn chạy tới, không quay đầu tại bến): Làng chài → Làng nổi → Resort → (vòng ngoài) → Làng nổi → Làng chài.
// Lượt đi men trong (bán kính 336 m), lượt về men ngoài (358 m); ở bến đầu/cuối có vòng quay giọt nước để cập song song mép bến.
const B = STOPS[1].p, C = STOPS[2].p;
export const FERRY_PATH = [
  A, toW(52, -1), toW(76, 12), [322, 160], [316, 196], [290, 213], [262, 228], B,
  [243, 259.5], [222, 270], ...[56, 70, 86, 102, 118, 134, 150, 164].map(a => polar(336, a)), [-341, 62], C,
  [-341, 6], [-352, -4], [-367, 4], [-372, 30], [-366, 60], ...[166, 150, 134, 118, 102, 86, 70, 58].map(a => polar(358, a)), [226, 282], [243, 259.5], B,
  [262, 228], [292, 212], [332, 196], [344, 152], toW(88, -14), toW(78, -32), toW(60, -37), toW(47, -28),
];
const iB1 = 7, iC = 19, iB2 = iC + 16;
export const FERRY_STOPS = [{ i: 0, stop: 0 }, { i: iB1, stop: 1 }, { i: iC, stop: 2 }, { i: iB2, stop: 1 }];   // thứ tự ghé bến trên vòng

// ----- Luồng tàu lớn: đường hở từ khơi bắc → đông → nam → khơi tây nam (đi 2 chiều, lệch bán kính) -----
const LANE = [[720, 265], [560, 274], [455, 294], [432, 318], [426, 342], [432, 4], [462, 22], [530, 37], [538, 52], [470, 68], [432, 86], [426, 106], [436, 126], [470, 141], [560, 150], [720, 156]];
export const lane = (dr = 0) => LANE.map(([r, a]) => polar(r + dr, a));

// ----- Ngư trường của ghe (ngoài khơi phía đông, bắc tuyến phà) & vòng lượn của thuyền buồm, ca nô -----
export const GROUNDS = [[372, -21], [398, -9], [356, 1], [402, 9], [372, 15]].map(([r, a]) => polar(r, a));
export const BERTHS = [[8, -3.6], [11, 3.6], [18, -3.6], [21, 3.6], [24, -24]].map(([u, dv]) => ({ p: toW(u, PIER_V + dv), u, dv }));   // chỗ neo dọc cầu tàu
export const CHANNEL = toW(72, PIER_V);                                   // cửa luồng trước cầu tàu
export const LOOPS = {
  sailNE: [[352, -66], [384, -46], [392, -26], [350, -29], [338, -50]].map(([r, a]) => polar(r, a)),
  sailS: [[378, 92], [404, 108], [392, 126], [372, 110]].map(([r, a]) => polar(r, a)),
  sailE: [[330, 20], [388, 28], [376, 12], [338, 8]].map(([r, a]) => polar(r, a)),
  speedS: [[366, 76], [362, 100], [368, 128], [354, 128], [351, 100], [353, 76]].map(([r, a]) => polar(r, a)),
  speedV: [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const t = i / 8 * 2 * Math.PI; return [286 + Math.cos(t) * 89, 286 + Math.sin(t) * 76]; }),   // quanh Làng nổi (bán kính 89 m, Fibonacci)
};
export const THUNG_V = [-44, -32.5, -8, 5.5, 19];                                 // chỗ kéo thúng lên bãi (v)
// lồng bè nuôi cá & giàn rong biển (hệ u, v)
export const CAGES = { u: 52, v: -54 }, SEAWEED = { u: 52, v: 36 };
export { PHI };
