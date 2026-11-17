// ================= v46 · THẾ GIỚI TRÒN · 1/9 LAYOUT (bảng sơ đồ — sửa tay ở đây) =================
// Toạ độ x,y = TÂM khu trên đảo, tâm đảo = (0,0) (lấy từ SO_DO_THE_GIOI.json).
// src = khung cũ trong game [x, y, w, h] (để trống = lấy R[id]); m = lề cắt quanh khu [trên, phải, dưới, trái].
// Muốn dời khu nào: chỉ sửa x,y của khu đó rồi tải lại trang.
const PHI = 1.618;
const V46L = {
  W: 11200, H: 11200, CX: 5600, CY: 5600,      // thế giới mới: tâm đảo ở (5600,5600)
  ISLAND: 5200, GRASS: 4700,                     // bán kính đảo (hết cát) và vòng cỏ
  GATE: [0, 150],                                // cổng trường (quảng trường giữa đảo)
  zones: {
    rubik:      {x:-399,  y:-977,  m:[70,50,60,20]},
    chess:      {x:-1468, y:-75,   m:[70,50,60,50]},
    music:      {x:-1268, y:-784,  m:[70,50,60,50]},
    hall:       {x:214,   y:-904,  m:[70,12,50,40]},
    rubikyard:  {x:-1476, y:595,   m:[60,50,50,50]},
    office:     {x:-474,  y:-194,  m:[60,50,50,50]},
    attend:     {x:89,    y:-306,  m:[130,50,60,80]},
    elec:       {x:700,   y:-1017, m:[70,50,60,40]},
    field:      {x:1590,  y:915,   m:[40,40,50,40]},
    giantchess: {x:1361,  y:45,    m:[20,30,30,30]},
    rubikpark:  {x:342,   y:551,   m:[20,20,30,20]},
    pond:       {x:1355,  y:-2604, m:[20,20,30,20]},
    flowerfield:{x:-108,  y:-2222, m:[0,0,20,0]},
    bpad:       {x:3753,  y:-708,  m:[20,30,20,30]},
    skate:      {x:3002,  y:635,   m:[20,20,20,20]},
    patin:      {x:3299,  y:1601,  m:[20,20,20,20]},
    basket:     {x:2258,  y:1556,  m:[20,20,20,20]},
    ski:        {x:2622,  y:-3095, m:[20,30,30,30]},
    art:        {x:860,   y:2662,  m:[30,30,30,30]},
    farm:       {x:2160,  y:-1073, m:[20,40,40,40]},
    garden:     {x:-689,  y:1934,  m:[40,30,30,30]},
    picnic:     {x:-2994, y:-1012, m:[30,30,30,30]},
    lotus:      {x:-4041, y:-279,  m:[30,30,30,30]},
    lake:       {x:-2824, y:149,   m:[30,30,30,30]},
    dalat:      {x:-3064, y:-2002, src:[2636, 588, 1200, 96], m:[70,10,0,10]},
    houses:     {x:-2609, y:1625,  src:[2252, 48, 374, 562], m:[40,30,30,8]},
    // v47: "Thế giới mới" xếp theo nhóm quanh vòng đường tỷ lệ vàng (r = 4700/φ):
    //   học tập gần trường (Tây Bắc) · thể thao (Đông Nam, cạnh sân bóng) · thành phố mua sắm (Tây Nam, cạnh khu nhà)
    library:    {x:-1500, y:-1700,  m:[30,30,44,30]},
    zen:        {x:-990, y:1240,  m:[30,30,44,30]},
    stadium:    {x:2660, y:2700,  m:[30,30,40,30]},
    pool:       {x:3900, y:300,   m:[30,30,20,30]},
    archery:    {x:1700, y:2450, m:[20,30,30,30]},
    gym:        {x:3820, y:1430,  m:[30,30,20,30]},
    arena:      {x:1250, y:1750, m:[20,30,40,30]},
    kart:       {x:1370, y:3520,  m:[30,20,30,20]},
    academy:    {x:-2300, y:-930, m:[20,30,40,30]},
    shopst:     {x:-1300, y:2900, m:[20,30,40,30]},
    hall2p:     {x:-1850, y:1580, m:[20,30,40,30]},
    plaza:      {x:-150, y:3300,  m:[20,30,40,30]},
    pstreet:    {x:-2550, y:2700,  m:[20,30,40,30]},
    botanic:    {x:-2230, y:840,   m:[20,40,40,30]}
  },
  // biển: vùng bến tàu cũ (lật dọc để biển nằm phía bắc đảo, gần toạ độ bến tàu trong sơ đồ)
  harbor: {src:[600, 786, 2200, 920], dx:3000, dy:1840, flip:true},
  // đường: vòng trong / vòng ngoài theo tỷ lệ vàng, đường hướng tâm theo góc vàng 137.5°
  roads: {rings:[4700/PHI/PHI, 4700/PHI, 4700 - 4700/PHI/PHI/PHI/PHI], radials:8, width:44, path:28}
};
