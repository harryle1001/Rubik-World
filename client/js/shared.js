// Shared data for server (Node) and client (browser): zones, exits, signposts, shop catalog, crops.
(function(root){
  // Each zone is its own Phaser scene load ("trang riêng") so the world stays light.
  // w,h = world size in px. walk = walkable rectangle. exits lead to other zones.
  const ZONES = {
    lophoc:   {name:'Lớp học đầu tiên', w:1400, h:900, spawn:[700, 640], walk:[60, 230, 1340, 860], theme:'class',
               exits:[{x:650, y:850, w:100, h:50, to:'duongchinh', at:[600, 1000], label:'Ra đường chính ↓'}]},
    duongchinh:{name:'Đường chính', w:4200, h:1800, spawn:[600, 1000], walk:[40, 640, 4160, 1160], theme:'hub',
               exits:[
                 {x:540, y:640, w:120, h:40, to:'lophoc', at:[700, 780], label:'Lớp học ↑'},
                 {x:1000, y:640, w:120, h:40, to:'doi', at:[800, 1420], label:'Đồi & đài thiên văn ↑'},
                 {x:1500, y:1120, w:120, h:40, to:'baibien', at:[300, 300], label:'Bãi biển ↓'},
                 {x:1420, y:640, w:120, h:40, to:'nongtrai', at:[900, 1300], label:'Nông trại cộng sinh ↑'},
                 {x:1900, y:640, w:120, h:40, to:'nangkhieu', at:[900, 1100], label:'Lớp năng khiếu ↑'},
                 {x:2300, y:1120, w:120, h:40, to:'thethao', at:[1000, 200], label:'Khu thể thao ↓'},
                 {x:2700, y:640, w:120, h:40, to:'gym', at:[800, 1050], label:'Gym & võ thuật ↑'},
                 {x:3100, y:1120, w:120, h:40, to:'dancu', at:[1200, 250], label:'Khu dân cư ↓'},
                 {x:3400, y:640, w:120, h:40, to:'congvien', at:[1000, 1250], label:'Công viên Ikigai ↑'},
                 {x:3700, y:1120, w:120, h:40, to:'muasam', at:[900, 250], label:'Trung tâm mua sắm ↓'},
                 {x:4120, y:850, w:40, h:120, to:'rung', at:[120, 700], label:'Rừng thông →'},
                 {x:3900, y:640, w:120, h:40, to:'vuon', at:[800, 1100], label:'Khu vườn ↑'}]},
    rung:     {name:'Rừng thông', w:2400, h:1400, spawn:[120, 700], walk:[40, 120, 2360, 1360], theme:'forest',
               exits:[{x:0, y:640, w:40, h:120, to:'duongchinh', at:[4060, 900], label:'← Đường chính'}]},
    baibien:  {name:'Bãi biển & cảng hải quân', w:2600, h:1500, spawn:[300, 300], walk:[40, 160, 2560, 700], theme:'beach',
               exits:[{x:240, y:160, w:120, h:40, to:'duongchinh', at:[1560, 1080], label:'Đường chính ↑'}]},
    doi:      {name:'Đồi & đài thiên văn', w:1600, h:1600, spawn:[800, 1420], walk:[60, 760, 1540, 1540], theme:'hill',
               exits:[{x:740, y:1540, w:120, h:40, to:'duongchinh', at:[1060, 700], label:'Đường chính ↓'}]},
    nongtrai: {name:'Nông trại cộng sinh', w:2400, h:1400, spawn:[900, 1300], walk:[40, 160, 2360, 1360], theme:'farm',
               exits:[{x:840, y:1360, w:120, h:40, to:'duongchinh', at:[1480, 700], label:'Đường chính ↓'}]},
    nangkhieu:{name:'Lớp năng khiếu', w:1800, h:1200, spawn:[900, 1100], walk:[60, 300, 1740, 1160], theme:'talent',
               exits:[{x:840, y:1160, w:120, h:40, to:'duongchinh', at:[1960, 700], label:'Đường chính ↓'}]},
    thethao:  {name:'Khu thể thao', w:2200, h:1400, spawn:[1000, 200], walk:[40, 160, 2160, 1360], theme:'sports',
               exits:[{x:940, y:120, w:120, h:40, to:'duongchinh', at:[2360, 1080], label:'Đường chính ↑'}]},
    gym:      {name:'Gym & võ thuật', w:1600, h:1100, spawn:[800, 1050], walk:[60, 260, 1540, 1060], theme:'gym',
               exits:[{x:740, y:1060, w:120, h:40, to:'duongchinh', at:[2760, 700], label:'Đường chính ↓'}]},
    dancu:    {name:'Khu dân cư', w:2600, h:1400, spawn:[1200, 250], walk:[40, 160, 2560, 1360], theme:'town',
               exits:[{x:1140, y:120, w:120, h:40, to:'duongchinh', at:[3160, 1080], label:'Đường chính ↑'},
                      {x:290, y:720, w:80, h:40, to:'nha_my', at:[600, 640], label:'Nhà kiểu Mỹ'},
                      {x:790, y:720, w:80, h:40, to:'nha_chauau', at:[600, 640], label:'Lâu đài quý tộc'},
                      {x:1290, y:720, w:80, h:40, to:'nha_nhat', at:[600, 640], label:'Nhà Nhật Bản'},
                      {x:1790, y:720, w:80, h:40, to:'nha_y', at:[600, 640], label:'Biệt thự Ý'},
                      {x:2290, y:720, w:80, h:40, to:'nha_vn', at:[600, 640], label:'Nhà Việt ba gian'}]},
    congvien: {name:'Công viên Ikigai', w:2200, h:1400, spawn:[1000, 1250], walk:[40, 120, 2160, 1360], theme:'park',
               exits:[{x:940, y:1360, w:120, h:40, to:'duongchinh', at:[3460, 700], label:'Đường chính ↓'}]},
    muasam:   {name:'Trung tâm mua sắm', w:1800, h:1200, spawn:[900, 250], walk:[60, 200, 1740, 1160], theme:'mall',
               exits:[{x:840, y:160, w:120, h:40, to:'duongchinh', at:[3760, 1080], label:'Đường chính ↑'}]},
    vuon:     {name:'Khu vườn', w:1600, h:1200, spawn:[800, 1100], walk:[60, 200, 1540, 1160], theme:'garden',
               exits:[{x:740, y:1160, w:120, h:40, to:'duongchinh', at:[3960, 700], label:'Đường chính ↓'}]},
    nha_my:    {name:'Nhà kiểu Mỹ', w:1200, h:760, spawn:[600, 640], walk:[60, 220, 1140, 720], theme:'interior', style:'my', exits:[{x:550, y:720, w:100, h:40, to:'dancu', at:[330, 790], label:'Ra ngoài ↓'}]},
    nha_chauau:{name:'Lâu đài quý tộc châu Âu', w:1200, h:760, spawn:[600, 640], walk:[60, 220, 1140, 720], theme:'interior', style:'chauau', exits:[{x:550, y:720, w:100, h:40, to:'dancu', at:[830, 790], label:'Ra ngoài ↓'}]},
    nha_nhat:  {name:'Nhà Nhật Bản', w:1200, h:760, spawn:[600, 640], walk:[60, 220, 1140, 720], theme:'interior', style:'nhat', exits:[{x:550, y:720, w:100, h:40, to:'dancu', at:[1330, 790], label:'Ra ngoài ↓'}]},
    nha_y:     {name:'Biệt thự Ý', w:1200, h:760, spawn:[600, 640], walk:[60, 220, 1140, 720], theme:'interior', style:'y', exits:[{x:550, y:720, w:100, h:40, to:'dancu', at:[1830, 790], label:'Ra ngoài ↓'}]},
    nha_vn:    {name:'Nhà Việt ba gian', w:1200, h:760, spawn:[600, 640], walk:[60, 220, 1140, 720], theme:'interior', style:'vn', exits:[{x:550, y:720, w:100, h:40, to:'dancu', at:[2330, 790], label:'Ra ngoài ↓'}]}
  };
  // Shop catalog: every item has its own design id; buyer picks a colour.
  const CATALOG = [
    {id:'bike_city',  kind:'bike', name:'Xe đạp phố cổ điển', price:120, design:'city'},
    {id:'bike_mtb',   kind:'bike', name:'Xe đạp địa hình', price:220, design:'mtb'},
    {id:'bike_road',  kind:'bike', name:'Xe đạp đua carbon', price:380, design:'road'},
    {id:'bike_bmx',   kind:'bike', name:'Xe BMX biểu diễn', price:260, design:'bmx'},
    {id:'bike_tandem',kind:'bike', name:'Xe đạp đôi', price:300, design:'tandem'},
    {id:'bike_cargo', kind:'bike', name:'Xe đạp chở hàng', price:340, design:'cargo'},
    {id:'bike_fat',   kind:'bike', name:'Xe đạp bánh béo', price:410, design:'fat'},
    {id:'bike_retro', kind:'bike', name:'Xe đạp bánh lớn cổ (penny)', price:520, design:'penny'},
    {id:'chess_wood', kind:'chess', name:'Bộ cờ vua gỗ', price:150, design:'wood'},
    {id:'chess_glass',kind:'chess', name:'Bộ cờ vua pha lê', price:480, design:'glass'},
    {id:'hat_cap',    kind:'hat', name:'Mũ lưỡi trai', price:40, design:'cap'},
    {id:'hat_straw',  kind:'hat', name:'Nón lá Việt Nam', price:60, design:'nonla'},
    {id:'hat_crown',  kind:'hat', name:'Vương miện', price:900, design:'crown'},
    {id:'seed_carrot',kind:'seed', name:'Hạt giống cà rốt', price:8, design:'carrot', crop:'carrot'},
    {id:'seed_tomato',kind:'seed', name:'Hạt giống cà chua', price:12, design:'tomato', crop:'tomato'},
    {id:'seed_corn',  kind:'seed', name:'Hạt giống ngô', price:15, design:'corn', crop:'corn'},
    {id:'seed_sunflower', kind:'seed', name:'Hạt hướng dương', price:20, design:'sunflower', crop:'sunflower'},
    {id:'seed_pumpkin',kind:'seed', name:'Hạt bí ngô', price:30, design:'pumpkin', crop:'pumpkin'}
  ];
  const CROPS = {carrot:{name:'Cà rốt', grow:40, sell:18, color:'#ff8a00'}, tomato:{name:'Cà chua', grow:60, sell:28, color:'#e53935'}, corn:{name:'Ngô', grow:80, sell:36, color:'#fdd835'},
                 sunflower:{name:'Hướng dương', grow:90, sell:45, color:'#ffca28'}, pumpkin:{name:'Bí ngô', grow:140, sell:80, color:'#fb8c00'}};
  const PLOT_PRICE = 100, PLOT_COUNT = 12;
  const API = {ZONES, CATALOG, CROPS, PLOT_PRICE, PLOT_COUNT};
  if(typeof module !== 'undefined' && module.exports) module.exports = API; else root.SHARED = API;
})(typeof window !== 'undefined' ? window : globalThis);
