// fish-data.js — 27 loài cá (và mực) theo 4 vùng nước. Mỗi loài: hình dáng, màu, độ hiếm, giờ, thời tiết riêng + thẻ kiến thức sinh học.
//   z: 'ao' ao hồ · 'song' sông suối · 'gan' biển gần bờ · 'xa' biển xa
//   shape: fish (thoi) · deep (thân cao) · long (dài) · eel (như lươn) · flat (dẹt nằm) · ray (cá đuối) · squid (mực) · round (tròn) · sail (vây buồm) · wing (vây cánh)
//   col: [lưng, bụng, điểm nhấn] · pat: hoa văn · len: dài [min, max] cm · min: dưới cỡ này nên thả lại (cá còn nhỏ, chưa kịp sinh sản)
//   rar: 1 thường · 2 khá hiếm · 3 hiếm · 4 huyền thoại · time: any | day | night | dawn (bình minh/hoàng hôn) · wx: any | rain | clear
//   a: hệ số cân nặng (g = a·L³, L tính bằng cm)
export const ZONES = {
  ao: { n: 'Ao hồ', icon: '🪷', c: '#3fa2d4' },
  song: { n: 'Sông suối', icon: '🏞️', c: '#5fc8d8' },
  gan: { n: 'Biển gần bờ', icon: '🏖️', c: '#2f8fc0' },
  xa: { n: 'Biển xa', icon: '🌊', c: '#1d5f95' },
};
export const RARITY = ['', 'Thường gặp', 'Khá hiếm', 'Hiếm', 'Huyền thoại'];
export const RAR_COL = ['', '#7a8a7a', '#3d8fd9', '#9a5ad6', '#f0a23a'];

export const FISH = [
  // ---- AO HỒ ----
  { id: 'ro-dong', n: 'Cá rô đồng', sci: 'Anabas testudineus', z: 'ao', shape: 'deep', col: ['#5b6b3a', '#c9c08a', '#3a4426'], pat: 'band', len: [8, 20], min: 10, rar: 1, time: 'any', wx: 'rain', a: 0.02,
    home: 'Ao, ruộng, kênh mương nước ngọt khắp Việt Nam', fact: 'Có cơ quan hô hấp phụ trên mang nên sống được lâu ngoài nước ẩm. Mưa to, cá rô còn trườn lên bờ sang ao khác!' },
  { id: 'chep', n: 'Cá chép', sci: 'Cyprinus carpio', z: 'ao', shape: 'fish', col: ['#8a6a2e', '#e8cf8a', '#c28a3a'], pat: null, len: [20, 70], min: 25, rar: 1, time: 'any', wx: 'any', a: 0.017,
    home: 'Ao hồ, sông chảy chậm, đáy bùn', fact: 'Cá chép có hai đôi râu để dò thức ăn dưới bùn. Ngày 23 tháng Chạp, người Việt thả cá chép tiễn ông Công ông Táo về trời.' },
  { id: 'ro-phi', n: 'Cá rô phi', sci: 'Oreochromis niloticus', z: 'ao', shape: 'deep', col: ['#6e7a6e', '#dfe3d6', '#b04a4a'], pat: 'band', len: [12, 40], min: 15, rar: 1, time: 'day', wx: 'any', a: 0.02,
    home: 'Ao nuôi, hồ chứa nước ngọt, chịu được nước lợ', fact: 'Cá mẹ ấp trứng và giữ cá con trong miệng. Khi có nguy hiểm, đàn con bơi vào miệng mẹ để trốn.' },
  { id: 'tre-vang', n: 'Cá trê vàng', sci: 'Clarias macrocephalus', z: 'ao', shape: 'long', col: ['#7a6a3a', '#e6d39a', '#4a3a1a'], pat: null, len: [15, 45], min: 20, rar: 2, time: 'night', wx: 'any', a: 0.008,
    home: 'Ao bùn, ruộng lúa, kênh rạch', fact: 'Da trơn không vảy, có 4 đôi râu cảm nhận mùi vị. Cá trê đớp được không khí nên sống được ở nước ít ô-xy.' },
  { id: 'loc', n: 'Cá lóc', sci: 'Channa striata', z: 'ao', shape: 'long', col: ['#3e4a3a', '#cfd2b8', '#252b22'], pat: 'spot', len: [20, 80], min: 25, rar: 2, time: 'dawn', wx: 'any', a: 0.009,
    home: 'Đồng ruộng, ao hồ có cỏ nước', fact: 'Cá lóc ngoi lên thở khí trời. Cá bố mẹ canh giữ cả đàn con đỏ rực đến khi chúng tự kiếm ăn được.' },
  { id: 'koi', n: 'Cá Koi', sci: 'Cyprinus rubrofuscus (Koi)', z: 'ao', shape: 'fish', col: ['#f4f1ea', '#fffaf0', '#e8453c'], pat: 'koi', len: [25, 75], min: 99, rar: 3, time: 'day', wx: 'clear', a: 0.016,
    home: 'Hồ cảnh, công viên (cá cảnh, luôn thả lại)', fact: 'Koi là cá chép được người lai tạo màu. Nhiều con sống hơn 50 năm và nhận ra người cho ăn!' },
  { id: 'tai-tuong', n: 'Cá tai tượng', sci: 'Osphronemus goramy', z: 'ao', shape: 'deep', col: ['#8a8a6a', '#e9e3c8', '#d24a3a'], pat: null, len: [20, 60], min: 25, rar: 3, time: 'any', wx: 'rain', a: 0.025,
    home: 'Ao hồ, kênh rạch Nam Bộ', fact: 'Có cơ quan "mê lộ" để thở khí trời. Cá bố kết cỏ cây làm tổ cho trứng như một quả bóng nhỏ.' },
  // ---- SÔNG SUỐI ----
  { id: 'tram-co', n: 'Cá trắm cỏ', sci: 'Ctenopharyngodon idella', z: 'song', shape: 'long', col: ['#6a6a4a', '#e2dcc0', '#4a4a32'], pat: null, len: [25, 100], min: 35, rar: 1, time: 'day', wx: 'any', a: 0.012,
    home: 'Sông lớn, hồ chứa có nhiều cỏ nước', fact: 'Ăn cỏ là chính; mỗi ngày có thể ăn lượng cỏ gần bằng cân nặng của mình, nên được thả để làm sạch kênh mương.' },
  { id: 'lang-cham', n: 'Cá lăng chấm', sci: 'Hemibagrus guttatus', z: 'song', shape: 'long', col: ['#6b5a4a', '#e8dccc', '#2e241a'], pat: 'spot', len: [30, 110], min: 45, rar: 3, time: 'night', wx: 'any', a: 0.009,
    home: 'Sông Đà, sông Lô, sông Hồng — nước chảy, đáy đá', fact: 'Da trơn có chấm đen, râu rất dài. Loài quý có tên trong Sách Đỏ Việt Nam — câu được hãy cân nhắc thả lại.' },
  { id: 'bong-tuong', n: 'Cá bống tượng', sci: 'Oxyeleotris marmorata', z: 'song', shape: 'long', col: ['#6a5238', '#d9c49a', '#3a2a1a'], pat: 'spot', len: [15, 50], min: 20, rar: 2, time: 'night', wx: 'any', a: 0.012,
    home: 'Sông, kênh rạch, hồ nước ngọt Nam Bộ', fact: 'Là "thợ săn kiên nhẫn": nằm im dưới đáy, ngụy trang như hòn đá rồi đớp mồi thật nhanh.' },
  { id: 'anh-vu', n: 'Cá anh vũ', sci: 'Semilabeo obscurus', z: 'song', shape: 'fish', col: ['#4a4a40', '#b8b4a0', '#2a2a24'], pat: null, len: [20, 50], min: 30, rar: 4, time: 'dawn', wx: 'rain', a: 0.014,
    home: 'Ghềnh đá sông Lô, sông Đà — nước chảy xiết', fact: 'Xưa là "cá tiến vua". Môi dày như giác hút để bám đá và gặm rêu trong dòng nước xiết. Rất hiếm: hãy thả lại!' },
  { id: 'chach-song', n: 'Cá chạch sông', sci: 'Mastacembelus armatus', z: 'song', shape: 'eel', col: ['#7a5a3a', '#e0c79a', '#3a2614'], pat: 'band', len: [20, 70], min: 25, rar: 2, time: 'night', wx: 'any', a: 0.0035,
    home: 'Sông suối đáy cát sỏi', fact: 'Thân dài như lươn, mõm nhọn như cái vòi. Ban ngày chạch vùi mình trong cát, đêm mới ra kiếm ăn.' },
  { id: 'nganh', n: 'Cá ngạnh', sci: 'Cranoglanis bouderius', z: 'song', shape: 'fish', col: ['#8a8f96', '#eef0f2', '#5a5f66'], pat: null, len: [15, 40], min: 18, rar: 1, time: 'any', wx: 'any', a: 0.011,
    home: 'Sông suối miền Bắc và miền Trung', fact: 'Vây lưng và vây ngực có gai cứng gọi là "ngạnh" — cầm cá phải cẩn thận kẻo đau tay!' },
  // ---- BIỂN GẦN BỜ ----
  { id: 'nuc', n: 'Cá nục', sci: 'Decapterus maruadsi', z: 'gan', shape: 'fish', col: ['#3d6f9a', '#e8eef2', '#f2c14e'], pat: null, len: [10, 25], min: 13, rar: 1, time: 'day', wx: 'any', a: 0.011,
    home: 'Tầng nước gần bờ, đi thành đàn lớn', fact: 'Bơi thành đàn hàng nghìn con để khó bị săn. Là loài cá quen thuộc trong bữa cơm của ngư dân miền Trung.' },
  { id: 'doi', n: 'Cá đối', sci: 'Mugil cephalus', z: 'gan', shape: 'long', col: ['#6a7a8a', '#eef0ea', '#4a5866'], pat: 'stripe', len: [20, 60], min: 25, rar: 1, time: 'any', wx: 'any', a: 0.01,
    home: 'Cửa sông, đầm phá, bãi ven biển', fact: 'Cá đối hay nhảy vọt khỏi mặt nước. Chúng ăn tảo và mùn bã dưới đáy, giúp "dọn dẹp" vùng nước.' },
  { id: 'hong', n: 'Cá hồng', sci: 'Lutjanus erythropterus', z: 'gan', shape: 'deep', col: ['#d2453a', '#f6c2b0', '#a8302a'], pat: null, len: [20, 70], min: 30, rar: 2, time: 'dawn', wx: 'any', a: 0.016,
    home: 'Rạn đá, rạn san hô ven bờ', fact: 'Màu đỏ hồng rực rỡ nhưng ở dưới sâu lại khó thấy, vì ánh sáng đỏ bị nước hấp thụ trước tiên.' },
  { id: 'mu', n: 'Cá mú', sci: 'Epinephelus coioides', z: 'gan', shape: 'deep', col: ['#7a6248', '#e0cfb0', '#b06a3a'], pat: 'spot', len: [25, 100], min: 35, rar: 2, time: 'any', wx: 'any', a: 0.015,
    home: 'Hang hốc trong rạn đá, san hô', fact: 'Cá mú khi nhỏ là cá cái, lớn lên có thể chuyển thành cá đực. Chúng rình mồi ở cửa hang rồi hút mồi vào miệng.' },
  { id: 'he', n: 'Cá hề', sci: 'Amphiprion ocellaris', z: 'gan', shape: 'round', col: ['#ff7a2b', '#ff9a4a', '#ffffff'], pat: 'band', len: [6, 11], min: 99, rar: 3, time: 'day', wx: 'clear', a: 0.02,
    home: 'Rạn san hô, sống trong hải quỳ', fact: 'Lớp nhầy trên da giúp cá hề không bị xúc tu hải quỳ đốt. Hai bên bảo vệ nhau — gọi là cộng sinh. Luôn thả lại!' },
  { id: 'muc-ong', n: 'Mực ống', sci: 'Uroteuthis duvaucelii', z: 'gan', shape: 'squid', col: ['#f2c8c8', '#fbe8e4', '#b05a6a'], pat: 'spot', len: [10, 35], min: 12, rar: 2, time: 'night', wx: 'any', a: 0.006,
    home: 'Vùng biển gần bờ, lên tầng mặt vào ban đêm', fact: 'Mực có 3 quả tim và máu màu xanh lam. Gặp nguy, mực phun mực đen để che mắt kẻ thù rồi phóng đi.' },
  { id: 'bon', n: 'Cá bơn', sci: 'Psettodes erumei', z: 'gan', shape: 'flat', col: ['#8a7a5a', '#f2ece0', '#5a4a32'], pat: 'spot', len: [20, 60], min: 25, rar: 3, time: 'any', wx: 'rain', a: 0.013,
    home: 'Đáy cát, bùn ven biển', fact: 'Cá bơn nằm dẹt dưới đáy. Lúc nhỏ mắt ở hai bên như cá thường, lớn lên một mắt dời dần về phía trên.' },
  // ---- BIỂN XA ----
  { id: 'thu', n: 'Cá thu', sci: 'Scomberomorus commerson', z: 'xa', shape: 'long', col: ['#3a5f8a', '#e6edf2', '#8aa6c0'], pat: 'band', len: [40, 150], min: 50, rar: 1, time: 'day', wx: 'any', a: 0.006,
    home: 'Tầng nước trên ngoài khơi', fact: 'Thân thon như ngư lôi giúp bơi rất nhanh. Cá thu đi săn theo đàn, đuổi bắt cá nhỏ.' },
  { id: 'chuon', n: 'Cá chuồn', sci: 'Cypselurus sp.', z: 'xa', shape: 'wing', col: ['#2f5f9a', '#e8f0f6', '#7fb6e8'], pat: null, len: [15, 35], min: 18, rar: 1, time: 'day', wx: 'clear', a: 0.01,
    home: 'Mặt biển khơi ấm', fact: 'Vây ngực to như đôi cánh: cá chuồn phóng lên khỏi mặt nước và lướt trên không hàng chục mét để thoát cá săn mồi.' },
  { id: 'ngu', n: 'Cá ngừ vây vàng', sci: 'Thunnus albacares', z: 'xa', shape: 'fish', col: ['#1f3f6a', '#e8eef2', '#f2c418'], pat: null, len: [50, 180], min: 70, rar: 2, time: 'dawn', wx: 'any', a: 0.018,
    home: 'Biển khơi nhiệt đới, di cư rất xa', fact: 'Cá ngừ giữ thân ấm hơn nước biển nên cơ bắp khỏe. Chúng bơi hàng nghìn km mỗi năm và không bao giờ ngừng bơi.' },
  { id: 'nuc-heo', n: 'Cá nục heo', sci: 'Coryphaena hippurus', z: 'xa', shape: 'deep', col: ['#2a9a6a', '#f2e04a', '#3d8fd9'], pat: 'spot', len: [40, 130], min: 50, rar: 2, time: 'any', wx: 'any', a: 0.009,
    home: 'Quanh vật trôi nổi ngoài khơi', fact: 'Màu xanh vàng rực rỡ có thể đổi màu rất nhanh. Cá nục heo lớn cực nhanh — chưa đầy 1 năm đã dài cả mét.' },
  { id: 'duoi-o', n: 'Cá đuối ó', sci: 'Aetobatus ocellatus', z: 'xa', shape: 'ray', col: ['#2e3a4a', '#f2f2ea', '#e8e8e0'], pat: 'spot', len: [60, 200], min: 80, rar: 3, time: 'any', wx: 'any', a: 0.004,
    home: 'Biển khơi và vùng rạn ấm', fact: 'Đuối "bay" dưới nước bằng đôi vây ngực như cánh chim. Đuôi có gai độc — luôn thả lại thật nhẹ nhàng.' },
  { id: 'co', n: 'Cá cờ', sci: 'Istiophorus platypterus', z: 'xa', shape: 'sail', col: ['#1f3f7a', '#e6eef6', '#3d6fd0'], pat: 'band', len: [100, 280], min: 150, rar: 3, time: 'day', wx: 'clear', a: 0.0016,
    home: 'Tầng mặt biển khơi nhiệt đới', fact: 'Một trong những loài cá bơi nhanh nhất thế giới. Vây lưng dựng lên như cánh buồm để lùa đàn cá nhỏ.' },
  { id: 'mat-trang', n: 'Cá mặt trăng', sci: 'Mola mola', z: 'xa', shape: 'round', col: ['#8a96a2', '#e6eaee', '#6a7682'], pat: null, len: [100, 300], min: 999, rar: 4, time: 'dawn', wx: 'clear', a: 0.035,
    home: 'Biển khơi, hay nổi phơi nắng trên mặt nước', fact: 'Loài cá xương nặng nhất thế giới, có thể hơn 2 tấn — chủ yếu ăn sứa! Cá mặt trăng nổi nằm nghiêng phơi nắng để sưởi ấm.' },
];
export const TRASH = [
  { n: 'Chai nhựa', t: 'Nhựa phải mất hàng trăm năm mới phân huỷ. Nhặt lên là giúp biển sạch hơn!' },
  { n: 'Túi ni-lông', t: 'Rùa biển hay nhầm túi ni-lông là sứa và ăn phải. Cảm ơn bạn đã vớt lên!' },
  { n: 'Lon nước', t: 'Lon nhôm tái chế được nhiều lần. Bỏ đúng thùng rác tái chế nhé!' },
];
export const byId = Object.fromEntries(FISH.map(f => [f.id, f]));
export const weightKg = (f, L) => +(f.a * L ** 3 / 1000).toFixed(L < 20 ? 2 : 1);
const inTime = (t, h) => t === 'any' || (t === 'day' ? h >= 6 && h < 18 : t === 'night' ? h >= 18 || h < 5 : (h >= 5 && h < 8) || (h >= 16.5 && h < 19));
const inWx = (w, wx) => w === 'any' || (w === 'rain' ? wx === 'rain' || wx === 'storm' : wx === 'clear' || wx === 'cloudy');
// Bốc 1 loài theo vùng, giờ, thời tiết (loài hợp điều kiện nặng ký hơn; độ hiếm giảm xác suất theo φ³)
export function rollFish(z, hour, wx, luck = 0) {
  const PHI = 1.618, list = FISH.filter(f => f.z === z).map(f => {
    let w = 1 / PHI ** ((f.rar - 1) * 3 - luck);
    if (!inTime(f.time, hour)) w *= f.time === 'any' ? 1 : 0.06;
    if (!inWx(f.wx, wx)) w *= 0.15;
    return [f, w];
  });
  let s = list.reduce((a, [, w]) => a + w, 0) * Math.random();
  for (const [f, w] of list) if ((s -= w) <= 0) return f;
  return list[0][0];
}
export const timeText = t => ({ any: 'Mọi lúc', day: 'Ban ngày', night: 'Ban đêm', dawn: 'Bình minh, hoàng hôn' })[t];
export const wxText = w => ({ any: 'Mọi thời tiết', rain: 'Trời mưa', clear: 'Trời quang' })[w];
