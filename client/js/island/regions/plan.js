// regions/plan.js — 4 VÙNG MỚI ngoài khơi đảo chính (số liệu thuần + độ cao giải tích, không dựng hình).
// Mỗi vùng: tâm c, bán kính R (Fibonacci), độ cao h(u, v) theo toạ độ cục bộ (u = x − cx, v = z − cz), đường nối với đảo chính,
// 3 điểm khám phá (bài học + câu đố). Khoảng cách 610–660 m: ngoài tầm sương (296 m) khi đứng ở đảo chính → tải theo chunk khi lại gần.
//   🏔️ Bắc  · Núi Tuyết & Đài khí tượng — cầu dài      · địa lý, thời tiết (núi thu nhỏ 1:100: lên 1 m = lên 100 m thật)
//   🏮 Tây  · Làng Cổ Việt Nam          — cầu đá        · đình, giếng, cây đa, ruộng bậc thang, trống đồng
//   🪸 Nam  · Quần đảo San Hô            — thuyền        · rạn san hô, sinh vật biển, lặn
//   🌆 Đông · Thành phố Tương lai        — thuyền + đường băng · năng lượng gió, mặt trời, tàu đệm từ, tái chế
import { PHI } from '../layout.js';
import { fbm } from '../terrain.js';

const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const SEA_FLOOR = -8;
// bờ: biển sâu → bãi cát (0,6 m) ở mép R → mặt đảo `top` cách mép 8 m vào trong; mép R gợn theo nhiễu
const coast = (d, R, top) => d > R + 21 ? SEA_FLOOR : d > R ? SEA_FLOOR + (0.6 - SEA_FLOOR) * sm(R + 21, R, d) : 0.6 + (top - 0.6) * sm(R, R - 8, d);
const wob = (u, v, R, k = 0.06) => R * (1 + k * (fbm(u * 0.013 + 7, v * 0.013 - 3) - 0.5) * 2);

// ---------- độ cao từng vùng ----------
// Núi tuyết: đồng bằng ven biển 1,6 m → núi nón 55 m (đỉnh phẳng r 8 cho đài khí tượng), gờ núi theo nhiễu; đường tuyết 34 m
export const PEAK = 55, SNOW_Y = 34;
function hSnow(u, v) {
  const d = Math.hypot(u, v), R = wob(u, v, 144), base = coast(d, R, 1.6);
  if (d > R - 8) return base;
  const k = 1 - sm(8, R - 21, d), ridge = (fbm(u * 0.04, v * 0.04) - 0.5) * 8 * k * (1 - k) * 4;
  return Math.max(base, d < 8 ? PEAK : 1.6 + (PEAK - 1.6) * Math.pow(k, 1.25) + ridge);
}
// Làng cổ: đồng bằng phía đông (làng, đình, ao) · đồi ruộng bậc thang phía tây: bậc cao 1 m (≤ bước leo 1,1 m), đỉnh 21 m
export const TERRACE = 1;
function hVillage(u, v) {
  const d = Math.hypot(u, v), R = wob(u, v, 144), base = coast(d, R, 1.6);
  if (d > R - 8) return base;
  const hill = 19.4 * sm(-21, -110, u) * (1 - sm(89, 130, Math.abs(v))), raw = 1.6 + hill;
  let h = hill > 0.3 ? 1.6 + Math.floor(hill / TERRACE) * TERRACE + 0.12 * sm(0.82, 1, (hill / TERRACE) % 1) * TERRACE : raw;
  const pd = Math.hypot(u - 34, v - 34); if (pd < 13) h = Math.min(h, 1.6 - 2.6 * sm(13, 8, pd));   // ao làng r 8 (bờ thoải tới 13)
  return h;
}
// Quần đảo san hô: 5 đảo cát + thềm rạn san hô cạn (−2,1 m) nối các đảo — lặn ngắm san hô
export const ISLETS = [[0, 0, 34, 3.4], [-63, 42, 13, 1.6], [61, -26, 21, 2.1], [39, 64, 13, 1.6], [-42, -61, 13, 1.6]];   // [u, v, r, đỉnh]
export const REEF_Y = -2.1;
function hCoral(u, v) {
  const d = Math.hypot(u, v);
  let h = d > 144 + 34 ? SEA_FLOOR : SEA_FLOOR + (REEF_Y - SEA_FLOOR) * sm(144 + 34, 144, d);
  h += (fbm(u * 0.06, v * 0.06) - 0.5) * 0.8 * sm(178, 120, d);
  for (const [iu, iv, r, top] of ISLETS) { const e = Math.hypot(u - iu, v - iv), rr = wob(u, v, r, 0.1); if (e < rr + 13) h = Math.max(h, e > rr ? REEF_Y + (0.6 - REEF_Y) * sm(rr + 13, rr, e) : 0.6 + (top - 0.6) * sm(rr, rr * 0.38, e)); }
  return h;
}
// Thành phố tương lai: nền phẳng 2,6 m (kè biển) hình vuông bo góc 310 m; đường băng 233 × 13 m ở mép bắc
export const FUT_Y = 2.6, FUT_H = 144, FUT_RW = { v: -116, hl: 116.5, hw: 6.5 };
function hFuture(u, v) {
  const qx = Math.max(0, Math.abs(u) - (FUT_H - 34)), qz = Math.max(0, Math.abs(v) - (FUT_H - 34)), d = Math.hypot(qx, qz) - 34;   // khoảng cách tới mép vuông bo góc (âm = trong)
  return d > 13 ? Math.max(SEA_FLOOR, -1.5 - d * 0.3) : d > 0 ? FUT_Y - 4 * sm(0, 13, d) - 0.1 : FUT_Y;
}

// ---------- 4 vùng ----------
export const REGIONS = [
  {
    id: 'snow', name: 'Núi Tuyết & Đài khí tượng', icon: '🏔️', theme: 'Địa lý · Thời tiết', c: [0, -650], R: 144, h: hSnow, link: 'bridge',
    greet: '🏔️ <b>Núi Tuyết & Đài khí tượng</b> — núi thu nhỏ <b>1:100</b>: lên 1 m ở đây = lên 100 m thật. Leo lên đỉnh xem nhiệt độ giảm dần nhé!',
    spots: [
      { u: 0, v: -3, icon: '📡', t: 'Đài khí tượng trên đỉnh núi', x: 'Đài khí tượng đo <b>nhiệt độ</b> (nhiệt kế trong lều chớp trắng), <b>gió</b> (chong chóng đo gió + cánh hướng gió), <b>mưa</b> (thùng đo mưa) và <b>độ ẩm</b>. Số đo gửi về trung tâm để dự báo thời tiết.',
        q: 'Dụng cụ nào dùng để đo <b>tốc độ gió</b>?', a: ['Phong kế (chong chóng đo gió)', 'Nhiệt kế', 'Thùng đo mưa'], ok: 0 },
      { u: 21, v: 120, icon: '🌡️', t: 'Càng lên cao càng lạnh', x: 'Cứ lên cao <b>100 m</b>, nhiệt độ giảm khoảng <b>0,6 °C</b>. Chân núi 25 °C, đỉnh núi thật cao 5 500 m chỉ còn khoảng −8 °C → hơi nước đóng băng thành <b>tuyết</b>. Vì thế đỉnh núi cao có tuyết quanh năm.',
        q: 'Lên cao 1 000 m, nhiệt độ giảm khoảng bao nhiêu?', a: ['Khoảng 6 °C', 'Khoảng 60 °C', 'Không đổi'], ok: 0 },
      { u: -55, v: 55, icon: '☁️', t: 'Vòng tuần hoàn của nước', x: 'Nắng làm nước biển <b>bốc hơi</b> → hơi nước bay lên cao, gặp lạnh <b>ngưng tụ</b> thành mây → mây nặng rơi xuống thành <b>mưa</b> hoặc <b>tuyết</b> → nước chảy theo sông về biển. Vòng này lặp lại mãi.',
        q: 'Hơi nước gặp lạnh trên cao tạo thành gì?', a: ['Mây', 'Cát', 'Gió'], ok: 0 },
    ],
  },
  {
    id: 'village', name: 'Làng Cổ Việt Nam', icon: '🏮', theme: 'Lịch sử · Văn hoá', c: [-660, 140], R: 144, h: hVillage, link: 'bridge',
    greet: '🏮 <b>Làng Cổ Việt Nam</b> — "cây đa, bến nước, sân đình". Thăm đình làng, giếng làng và ruộng bậc thang trên đồi nhé!',
    spots: [
      { u: 34, v: -21, icon: '⛩️', t: 'Đình làng', x: 'Đình là ngôi nhà chung của cả làng: nơi thờ <b>Thành hoàng</b> (vị thần bảo hộ làng), nơi họp việc làng và mở <b>hội làng</b>. Mái đình cong vút, lợp ngói, cột gỗ lim to.',
        q: 'Đình làng thờ ai?', a: ['Thành hoàng làng', 'Thần Mặt Trời', 'Vua Hùng'], ok: 0 },
      { u: 62, v: 10, icon: '🥁', t: 'Trống đồng Đông Sơn', x: 'Trống đồng của người Việt cổ thời <b>Văn Lang</b> (khoảng 2 500 năm trước). Mặt trống có ngôi sao ở giữa, chim Lạc bay quanh, người giã gạo, nhà sàn — kể lại cuộc sống ngày xưa.',
        q: 'Giữa mặt trống đồng Đông Sơn có hình gì?', a: ['Ngôi sao (Mặt Trời)', 'Con rồng', 'Bông sen'], ok: 0 },
      { u: -55, v: 0, icon: '🌾', t: 'Ruộng bậc thang', x: 'Người dân vùng núi (như <b>Mù Cang Chải</b>, Yên Bái) đắp ruộng thành từng bậc theo sườn đồi: nước chảy từ bậc trên xuống bậc dưới, đất không bị xói mòn, trồng được lúa nước trên núi.',
        q: 'Vì sao làm ruộng thành bậc thang trên đồi?', a: ['Giữ nước, chống xói mòn đất', 'Cho đẹp thôi', 'Để trâu leo'], ok: 0 },
    ],
  },
  {
    id: 'coral', name: 'Quần đảo San Hô', icon: '🪸', theme: 'Sinh vật biển · Lặn', c: [60, 660], R: 144, h: hCoral, link: 'boat',
    greet: '🪸 <b>Quần đảo San Hô</b> — 5 đảo cát giữa rạn san hô cạn. Bơi ra rạn, bấm 🤿 Lặn để ngắm san hô và đàn cá!',
    spots: [
      { u: 8, v: 21, icon: '🔬', t: 'Trạm nghiên cứu biển', x: 'San hô trông như cây đá nhưng là <b>động vật</b>! Mỗi cành san hô là hàng nghìn con <b>polyp</b> tí hon sống chung, tiết ra đá vôi làm nhà. Tảo sống trong polyp cho san hô màu sắc và thức ăn.',
        q: 'San hô là gì?', a: ['Động vật (polyp)', 'Cây dưới nước', 'Đá'], ok: 0 },
      { u: 30, v: -58, icon: '🐠', t: 'Cá hề và hải quỳ', x: 'Cá hề sống giữa các xúc tu có độc của <b>hải quỳ</b> mà không bị đốt nhờ lớp nhớt bảo vệ. Hải quỳ che chở cá hề, cá hề dọn thức ăn thừa cho hải quỳ — hai bên cùng có lợi gọi là <b>cộng sinh</b>.',
        q: 'Cá hề và hải quỳ giúp nhau sống gọi là gì?', a: ['Cộng sinh', 'Ăn thịt', 'Ngủ đông'], ok: 0 },
      { u: -60, v: 30, icon: '🐢', t: 'Rùa biển và rác nhựa', x: 'Rùa biển ăn sứa. Túi ni-lông trôi trên biển trông giống sứa nên rùa ăn nhầm và bị bệnh. Mang theo túi vải, nhặt rác ở bãi biển là em đã cứu rùa biển rồi đó!',
        q: 'Vì sao rùa biển hay ăn nhầm túi ni-lông?', a: ['Túi trông giống con sứa', 'Túi có vị ngọt', 'Rùa thích màu trắng'], ok: 0 },
    ],
  },
  {
    id: 'future', name: 'Thành phố Tương lai', icon: '🌆', theme: 'Năng lượng sạch · Khoa học', c: [660, -60], R: 155, h: hFuture, link: 'boat',
    greet: '🌆 <b>Thành phố Tương lai</b> — điện từ gió và Mặt Trời, tàu đệm từ không khói. Xem bảng điện ⚡ ở quảng trường nhé!',
    spots: [
      { u: 0, v: 34, icon: '⚡', t: 'Trạm điều khiển năng lượng', x: 'Cả thành phố chạy bằng <b>năng lượng tái tạo</b>: tuabin gió quay máy phát điện, tấm pin mặt trời biến ánh nắng thành điện. Ban đêm dùng điện đã cất trong <b>pin lưu trữ</b>.',
        q: 'Tấm pin mặt trời biến gì thành điện?', a: ['Ánh nắng', 'Tiếng ồn', 'Nước mưa'], ok: 0 },
      { u: 89, v: 55, icon: '🚝', t: 'Tàu đệm từ', x: 'Nam châm cùng cực thì <b>đẩy nhau</b>: tàu đệm từ được nam châm nâng lơ lửng trên đường ray, không chạm bánh → chạy rất êm, nhanh tới 600 km/h và không xả khói.',
        q: 'Tàu đệm từ lơ lửng được là nhờ gì?', a: ['Lực đẩy của nam châm', 'Bóng bay', 'Cánh quạt'], ok: 0 },
      { u: -76, v: 47, icon: '♻️', t: 'Nhà máy tái chế', x: 'Rác được phân loại: <b>giấy</b> làm lại thành giấy, <b>nhựa</b> làm thành áo, ghế, <b>rác hữu cơ</b> (vỏ rau, cơm thừa) ủ thành phân bón cho cây. Phân loại rác tại nhà giúp tái chế dễ hơn.',
        q: 'Vỏ rau, cơm thừa nên được làm thành gì?', a: ['Phân bón cho cây', 'Áo mưa', 'Giấy viết'], ok: 0 },
    ],
  },
];
for (const R of REGIONS) { R.toWorld = (u, v) => [R.c[0] + u, R.c[1] + v]; R.toLocal = (x, z) => [x - R.c[0], z - R.c[1]]; R.span = R.R + 34; R.hw = (x, z) => R.h(x - R.c[0], z - R.c[1]); }
export const regionAt = (x, z, m = 0) => REGIONS.find(R => Math.hypot(x - R.c[0], z - R.c[1]) < R.R + m);
export { PHI };
