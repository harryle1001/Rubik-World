// ================= v70e · LÝ DO QUAY LẠI MỖI NGÀY 3/3: giao diện — 🎉 Lễ hội · 📅 Điểm danh · 🏅 Thành tựu · 🏆 Bảng vàng + mini hoạt động lễ hội =================
// Bảng toàn màn hình, chỉ cần chạm, Nunito ≥ 16px. Thẻ rộng 560 = 346 + 214 (tỷ lệ vàng) ở phần đầu lễ hội.
// ---------- hoạt động lễ hội ----------
const V70E_ACT = {
  banhchung:{type:'order', ic:'🍃', n:'Gói bánh chưng', s:'Xếp đúng 6 bước gói bánh', steps:['Rửa lá dong, xếp vào khuôn', 'Đổ một lớp gạo nếp', 'Thêm đậu xanh và thịt', 'Phủ thêm lớp gạo nếp', 'Gói chặt, buộc lạt', 'Luộc bánh thật lâu'], fact:'Bánh chưng vuông tượng trưng cho đất — món quà biết ơn tổ tiên ngày Tết.'},
  ruocden:  {type:'lap', ic:'⭐', n:'Rước đèn ông sao', s:'Đi qua 4 ngôi sao quanh quảng trường', how:'⭐ Mang đèn ông sao đi qua các ngôi sao vàng quanh quảng trường cổng trường nhé!'},
  trong:    {type:'tap', mode:'beat', ic:'🥁', n:'Đánh trống khai trường', s:'Chạm đúng nhịp trống 6/9 lần'},
  thiep:    {type:'card', ic:'💌', n:'Viết thiệp tặng thầy cô', s:'Chọn thầy cô, hoa và lời chúc'},
  bongbay:  {type:'collect', what:'balloon', ic:'🎈', n:'Nhặt bóng bay', s:'Tìm 5 quả bóng quanh quảng trường', how:'🎈 Có 5 quả bóng bay quanh quảng trường cổng trường — đi tới để nhặt!'},
  quanoel:  {type:'collect', what:'gift', ic:'🎁', n:'Tìm hộp quà Giáng sinh', s:'Tìm 5 hộp quà quanh quảng trường', how:'🎁 Ông già Noel giấu 5 hộp quà quanh quảng trường cổng trường — đi tìm nhé!'},
  nuilua:   {type:'order', ic:'🌋', n:'Thí nghiệm núi lửa', s:'Xếp đúng 5 bước thí nghiệm', steps:['Đeo kính bảo hộ', 'Đặt cốc vào khay', 'Cho muối nở (baking soda) vào cốc', 'Nhỏ vài giọt màu đỏ', 'Rót giấm vào — núi lửa phun trào!'], fact:'Giấm gặp muối nở tạo ra khí CO₂, bọt sủi lên như dung nham. Luôn làm thí nghiệm cùng người lớn nhé!'},
  trongcay: {type:'order', ic:'🌱', n:'Trồng cây con', s:'Xếp đúng 5 bước trồng cây', steps:['Chọn chỗ có nắng', 'Đào hố vừa bầu cây', 'Đặt cây con vào hố', 'Lấp đất, nén nhẹ quanh gốc', 'Tưới nước đẫm'], fact:'Một cây to mỗi năm cho ra lượng ô-xi đủ cho khoảng 2 người thở.'},
  tiepsuc:  {type:'tap', mode:'fast', ic:'🏃', n:'Chạy tiếp sức', s:'Chạm thật nhanh 25 lần trong 6 giây'},
  rubikbuoc:{type:'order', ic:'🧩', n:'Các bước giải Rubik', s:'Xếp đúng 6 bước của cách giải cơ bản', steps:['Dấu cộng trắng', 'Bốn góc trắng (xong tầng 1)', 'Tầng giữa (tầng 2)', 'Dấu cộng vàng', 'Đưa góc vàng về đúng chỗ', 'Xoay góc vàng — xong!'], fact:'Kỷ lục thế giới giải Rubik 3×3 chỉ khoảng 3 giây — nhưng ai cũng bắt đầu từ dấu cộng trắng!'},
  quiz:     {type:'quiz', ic:'❓', n:'Đố vui lễ hội', s:'Trả lời đúng 2/3 câu'}
};
// câu đố (đáp án đúng luôn ở vị trí 0, được xáo khi hiện)
const V70E_QZ = {
  tet:[['Tết Nguyên đán tính theo lịch nào?', ['Âm lịch', 'Dương lịch', 'Lịch tuần']], ['Bánh chưng có hình gì?', ['Hình vuông', 'Hình tròn', 'Hình tam giác']], ['Hoa đặc trưng ngày Tết ở miền Bắc?', ['Hoa đào', 'Hoa sen', 'Hoa hướng dương']], ['Lá dùng để gói bánh chưng?', ['Lá dong', 'Lá bàng', 'Lá sen']], ['Mâm ngũ quả có mấy loại quả?', ['5', '3', '8']]],
  trungthu:[['Tết Trung thu vào ngày nào âm lịch?', ['Rằm tháng 8', 'Mùng 1 tháng Giêng', 'Rằm tháng 7']], ['Đèn ông sao có mấy cánh?', ['5', '4', '6']], ['Chú Cuội ngồi dưới gốc cây gì?', ['Cây đa', 'Cây dừa', 'Cây tre']], ['Đêm rằm Trung thu, trăng thế nào?', ['Tròn và sáng nhất', 'Khuyết một nửa', 'Không có trăng']], ['Bánh nào là bánh Trung thu?', ['Bánh nướng, bánh dẻo', 'Bánh chưng', 'Bánh mì']]],
  khaigiang:[['Lễ khai giảng thường vào ngày nào?', ['5 tháng 9', '20 tháng 11', '1 tháng 6']], ['Ai đánh trống khai trường?', ['Thầy cô Hiệu trưởng', 'Bác bảo vệ', 'Bạn lớp 1']], ['Khăn quàng của đội viên màu gì?', ['Đỏ', 'Xanh', 'Vàng']], ['Một năm học có mấy học kỳ?', ['2', '3', '4']]],
  nhagiao:[['Ngày Nhà giáo Việt Nam là ngày nào?', ['20 tháng 11', '8 tháng 3', '1 tháng 6']], ['Ngày 20/11 được tổ chức lần đầu năm nào?', ['1982', '1945', '2000']], ['"Tôn sư trọng đạo" nghĩa là gì?', ['Kính trọng thầy cô', 'Chăm tập thể dục', 'Yêu thiên nhiên']], ['"Không thầy đố mày làm nên" khuyên em điều gì?', ['Biết ơn thầy cô', 'Không cần học', 'Chỉ chơi game']]],
  thieunhi:[['Tết Thiếu nhi là ngày nào?', ['1 tháng 6', '2 tháng 9', '20 tháng 11']], ['Bóng bay bay lên nhờ khí gì?', ['Khí heli', 'Khí ô-xi', 'Hơi nước']], ['Điều nào là quyền của trẻ em?', ['Được học tập và vui chơi', 'Phải đi làm kiếm tiền', 'Không được nghỉ ngơi']]],
  noel:[['Giáng sinh là ngày nào?', ['25 tháng 12', '1 tháng 1', '30 tháng 4']], ['Ông già Noel đi bằng gì?', ['Xe trượt tuyết tuần lộc kéo', 'Xe đạp', 'Tàu ngầm']], ['Đỉnh cây thông Noel thường gắn gì?', ['Ngôi sao', 'Quả bóng đá', 'Chiếc mũ']], ['Bông tuyết làm từ gì?', ['Nước đóng băng', 'Cát', 'Muối']]],
  khoahoc:[['Cây xanh hấp thụ khí gì để quang hợp?', ['Khí CO₂', 'Khí ô-xi', 'Khí heli']], ['Nam châm hút được vật nào?', ['Cái đinh sắt', 'Cục tẩy', 'Tờ giấy']], ['Nước sôi ở bao nhiêu độ C?', ['100 độ', '50 độ', '0 độ']], ['Hành tinh nào gần Mặt Trời nhất?', ['Sao Thủy', 'Trái Đất', 'Sao Hỏa']], ['Bóng đèn sáng khi mạch điện thế nào?', ['Mạch kín có nguồn điện', 'Mạch hở', 'Chỉ cần dây điện']]],
  caythan:[['Rễ cây có nhiệm vụ gì?', ['Hút nước, giữ cây đứng vững', 'Tạo ra hoa', 'Bay theo gió']], ['Lá cây màu xanh nhờ chất gì?', ['Diệp lục', 'Muối', 'Sắt']], ['Cây cho chúng ta khí gì để thở?', ['Ô-xi', 'CO₂', 'Khói']], ['Hạt nảy mầm cần gì?', ['Nước, không khí, độ ấm', 'Chỉ cần bóng tối', 'Chỉ cần muối']]],
  hoithao:[['Một đội bóng đá có mấy cầu thủ trên sân?', ['11', '5', '9']], ['Trước khi chạy cần làm gì?', ['Khởi động làm nóng cơ thể', 'Ăn thật no', 'Ngủ trưa']], ['Biểu tượng Olympic có mấy vòng tròn?', ['5', '3', '7']], ['Chạy tiếp sức là môn…', ['Đồng đội chuyền gậy cho nhau', 'Một người chạy một mình', 'Bơi lội']]],
  rubik:[['Khối Rubik 3×3 có mấy mặt?', ['6', '4', '8']], ['Mỗi mặt Rubik 3×3 có mấy ô màu?', ['9', '6', '12']], ['Ô ở tâm mỗi mặt có đổi chỗ khi xoay không?', ['Không, luôn cố định', 'Có, chạy lung tung', 'Chỉ ô màu đỏ']], ['Rubik 3×3 có tất cả bao nhiêu ô màu?', ['54', '27', '36']], ['Ai phát minh ra khối Rubik?', ['Ernő Rubik', 'Albert Einstein', 'Isaac Newton']]]
};
function v70eShuf(a, r){ a = a.slice(); r = r || Math.random; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- CSS ----------
function v70eCss(){
  if(document.getElementById('v70eCss')) return; const s = document.createElement('style'); s.id = 'v70eCss';
  s.textContent = `
#v70ePanel[hidden],#v70eAch[hidden],.v70eGo[hidden]{display:none!important}
#v70ePanel{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(12,10,8,.62);font-family:Nunito,'Be Vietnam Pro',sans-serif;color:#2b1a10;touch-action:manipulation}
.v70eCard{position:relative;width:min(560px,100%);max-height:100%;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;border-radius:22px;background:#f6ecd2;border:4px solid #2b1a10;box-shadow:0 0 0 4px #c8913e,0 22px 60px rgba(0,0,0,.55)}
.v70eHead{position:sticky;top:0;z-index:2;background:linear-gradient(#7a1f1f,#5a1414);border-bottom:4px solid #2b1a10;color:#fff6e0}
.v70eTop{display:flex;align-items:center;gap:12px;padding:12px 14px 8px}
.v70eTop .ic{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:28px;background:#ffd23f;border:3px solid #2b1a10;box-shadow:inset 0 -5px 0 #d99a1e}
.v70eTop b{display:block;font-size:22px;font-weight:900;line-height:1.15;text-shadow:0 2px 0 rgba(0,0,0,.3)}.v70eTop span{font-size:16px;opacity:.92}
.v70eX{margin-left:auto;flex:none;width:48px;height:48px;border-radius:50%;border:3px solid #2b1a10;background:#f6ecd2;color:#2b1a10;font:900 22px Nunito,sans-serif;cursor:pointer}
.v70eTabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:0 8px 8px}
.v70eTabs button{min-height:48px;padding:4px 2px;border-radius:12px;border:2px solid #2b1a10;background:#8a3a2a;color:#ffe9c8;font:900 16px Nunito,sans-serif;cursor:pointer;line-height:1.1}
.v70eTabs button.on{background:#ffd23f;color:#2b1a10}
.v70eTabs button i{font-style:normal;display:block;font-size:20px}
.v70eCard section{margin:12px 12px 0;padding:12px 14px 14px;border-radius:16px;background:#fffaf0;border:3px solid #dcb98a}
.v70eCard section:last-child{margin-bottom:12px}
.v70eCard h3{flex-wrap:wrap;margin:0 0 8px;font-size:19px;font-weight:900;color:#5a3418;display:flex;justify-content:space-between;align-items:baseline;gap:8px}.v70eCard h3 small{font-size:16px;font-weight:800;color:#8a6a48}
.v70eCard p{margin:6px 0;font-size:17px;line-height:1.45}
.v70eNote{font-size:16px!important;color:#6a5038;margin:8px 0 0!important}
.v70eHero{display:grid;grid-template-columns:1.618fr 1fr;gap:12px;align-items:center}
.v70eHero .big{font-size:56px;text-align:center;line-height:1;filter:drop-shadow(0 4px 0 rgba(0,0,0,.15))}
.v70eHero b{display:block;font-size:22px;font-weight:900;color:#7a1f1f}
.v70eChip{display:inline-block;margin-top:4px;padding:3px 10px;border-radius:12px;background:#7a1f1f;color:#ffe9a8;font-size:16px;font-weight:900}
.v70eRow{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;width:100%;min-height:58px;padding:6px 10px;margin:0 0 8px;border-radius:14px;border:2px solid #ead7b4;background:#fff;text-align:left;font-family:inherit;color:inherit;cursor:pointer}
.v70eRow:last-child{margin-bottom:0}.v70eRow:hover,.v70eRow:focus{border-color:#c8913e!important;background:#fff!important;color:#2b1a10!important}
.v70eRow .ic{font-size:28px;text-align:center}.v70eRow b{display:block;font-size:17px;font-weight:900}.v70eRow small{display:block;font-size:16px;color:#7a6048;line-height:1.25}
.v70eRow .go{font-size:16px;font-weight:900;padding:6px 12px;border-radius:12px;background:#ffd23f;border:2px solid #2b1a10;white-space:nowrap}.v70eRow .go.ok{background:#7fd17a}
.v70eBar{height:10px;border-radius:6px;background:#efe2c8;margin-top:4px;overflow:hidden}.v70eBar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#ffd23f,#e0a21a)}
.v70eMed{display:flex;gap:4px}.v70eMed span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:16px;border:2px solid #d8c8a8;background:#f2ead8;filter:grayscale(1);opacity:.5}
.v70eMed span.g{filter:none;opacity:1;border-color:#2b1a10}
.v70eBtn{display:block;width:100%;min-height:56px;border-radius:16px;border:3px solid #2b1a10;background:linear-gradient(#ffd23f,#e8a23a);font:900 19px Nunito,sans-serif;color:#2b1a10;cursor:pointer;box-shadow:0 4px 0 #2b1a10;margin-top:10px}
.v70eBtn:active{transform:translateY(3px);box-shadow:0 1px 0 #2b1a10}.v70eBtn:disabled{opacity:.55;box-shadow:none}
.v70eBtn.g{background:linear-gradient(#7fd17a,#3f9a4a);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.25)}.v70eBtn.w{background:#fff}
.v70eCal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.v70eCal div{position:relative;min-height:76px;border-radius:12px;border:2px solid #dcb98a;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:16px;font-weight:900;color:#5a3418;text-align:center;line-height:1.1}
.v70eCal div i{font-style:normal;font-size:24px}.v70eCal div small{font-size:16px;font-weight:800;color:#8a6a48}
.v70eCal div.got{background:#e8f6e2;border-color:#3f9a4a}.v70eCal div.got:after{content:'✓';position:absolute;right:3px;top:1px;color:#3f9a4a;font-size:16px}
.v70eCal div.now{background:#fff3c4;border-color:#e0a21a;box-shadow:0 0 0 3px #ffd23f;animation:v70ePulse 1.6s ease-in-out infinite}
.v70eCal div.big{grid-column:span 1;background:linear-gradient(#fff3c4,#ffe082)}
@keyframes v70ePulse{50%{box-shadow:0 0 0 6px rgba(255,210,63,.45)}}
.v70eStreak{display:grid;grid-template-columns:1fr 1.618fr;gap:12px;align-items:center}.v70eStreak .n{font-size:44px;font-weight:900;color:#e65100;text-align:center;line-height:1}.v70eStreak .n small{display:block;font-size:16px;color:#7a6048}
.v70eTitles{display:flex;flex-wrap:wrap;gap:6px}.v70eTitles button{min-height:44px;padding:4px 12px;border-radius:22px;border:2px solid #dcb98a;background:#fff;font:800 16px Nunito,sans-serif;color:#3a2414;cursor:pointer}.v70eTitles button.on{background:#7a4a0a;color:#ffe9a8;border-color:#2b1a10}
.v70eSeg{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px}.v70eSeg button{min-height:48px;border-radius:12px;border:2px solid #dcb98a;background:#f6ecd2;font:900 16px Nunito,sans-serif;color:#5a3418;cursor:pointer;line-height:1.1;padding:2px}.v70eSeg button.on{background:#5a3418;color:#fff6e0;border-color:#2b1a10}
.v70eRank{list-style:none;margin:0;padding:0}.v70eRank li{display:grid;grid-template-columns:40px 1fr auto;gap:8px;align-items:center;min-height:44px;padding:4px 10px;border-radius:12px;font-size:17px;font-weight:800}.v70eRank li:nth-child(odd){background:#fbf3e2}
.v70eRank li .r{font-size:20px;text-align:center;font-weight:900;color:#8a6a48}.v70eRank li.me{background:#dff3dc!important;outline:2px solid #3f9a4a}.v70eRank li b{font-size:18px;color:#2d6b36}
.v70eOpts{display:grid;gap:8px;margin-top:8px}.v70eOpts button{min-height:52px;padding:8px 12px;border-radius:14px;border:3px solid #dcb98a;background:#fff;font:800 17px Nunito,sans-serif;color:#2b1a10;text-align:left;cursor:pointer}
.v70eOpts button:hover,.v70eOpts button:focus,.v70eTitles button:hover,.v70eTitles button:focus,.v70eSeg button:hover,.v70eSeg button:focus{background:#fff!important;color:#2b1a10!important}.v70eTabs button:hover,.v70eTabs button:focus{background:#8a3a2a!important;color:#ffe9c8!important}.v70eTabs button.on:hover,.v70eTabs button.on:focus{background:#ffd23f!important;color:#2b1a10!important}.v70eTitles button.on:hover,.v70eTitles button.on:focus,.v70eSeg button.on:hover,.v70eSeg button.on:focus{background:#5a3418!important;color:#fff6e0!important}
.v70eOpts button.ok,.v70eOpts button.ok:hover{background:#dff3dc;border-color:#3f9a4a}.v70eOpts button.no,.v70eOpts button.no:hover{background:#fde2e0;border-color:#d84a3a}.v70eOpts button.done{opacity:.55}
.v70eDrum{display:block;margin:10px auto;width:min(220px,62vw);aspect-ratio:1;border-radius:50%;border:6px solid #2b1a10;background:radial-gradient(circle at 50% 45%,#fff3d6 0 52%,#c8913e 53% 60%,#7a1f1f 61%);font:900 26px Nunito,sans-serif;color:#7a1f1f;cursor:pointer;transition:transform .08s}
.v70eDrum:active{transform:scale(.95)}.v70eDrum.beat{box-shadow:0 0 0 10px rgba(255,210,63,.6)}
.v70ePaper{margin-top:10px;padding:14px;border-radius:6px;background:#fff8ec;border:3px dashed #e57399;text-align:center;font-size:18px;font-weight:800;color:#7a1f3a;line-height:1.45}.v70ePaper .fl{font-size:44px;display:block}
#v70eAch{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 70px);z-index:130;transform:translate(-50%,-180%);display:flex;align-items:center;gap:12px;width:min(420px,calc(100% - 32px));padding:10px 14px 10px 10px;border-radius:20px;border:3px solid #2b1a10;background:linear-gradient(110deg,var(--v70eB) 0%,#fffaf0 61.8%);box-shadow:0 0 0 3px var(--v70eA),0 14px 36px rgba(0,0,0,.45);font-family:Nunito,sans-serif;color:#2b1a10;text-align:left;cursor:pointer;transition:transform .42s cubic-bezier(.2,1.4,.4,1);overflow:hidden}
#v70eAch.v70eIn{transform:translate(-50%,0)}
#v70eAch.v70eLow{top:auto;bottom:calc(env(safe-area-inset-bottom) + 18px);transform:translate(-50%,180%)}#v70eAch.v70eLow.v70eIn{transform:translate(-50%,0)}
#v70eAch .m{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--v70eA);border:3px solid #2b1a10;box-shadow:inset 0 -5px 0 rgba(0,0,0,.2)}#v70eAch .m i{font-style:normal;font-size:30px}
#v70eAch .t{display:flex;flex-direction:column;min-width:0}#v70eAch small{font-size:16px;font-weight:900;color:#7a4a0a}#v70eAch b{font-size:19px;font-weight:900;line-height:1.2}#v70eAch em{font-style:normal;font-size:16px;color:#6a5038;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#v70eAch .sp{position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.75) 45%,transparent 60%);transform:translateX(-100%)}#v70eAch.v70eIn .sp{animation:v70eShine 1.4s .3s ease-out}
@keyframes v70eShine{to{transform:translateX(100%)}}
.v70ePfB{display:block;width:100%;min-height:52px;margin-top:10px;border-radius:14px;border:3px solid #2b1a10;background:linear-gradient(#ffe082,#e0a21a);font:900 18px Nunito,sans-serif;color:#2b1a10;cursor:pointer}.v70ePfB small{display:block;font-size:16px;font-weight:800}
.v70eGo{background:linear-gradient(#e0533a,#9a2a1a)!important}
@media (max-width:420px){.v70eTop b{font-size:19px}.v70eHero{grid-template-columns:1fr 84px}.v70eHero .big{font-size:46px}.v70eCal{grid-template-columns:repeat(4,1fr);gap:6px}.v70eCal div{min-height:70px}.v70eCal div.big{grid-column:span 2}.v70eCard section{margin:10px 8px 0;padding:10px}}
@media (max-height:500px){.v70eTop{padding:6px 10px 4px}.v70eTop .ic{width:40px;height:40px;font-size:22px}.v70eTop b{font-size:18px}.v70eTop span{display:none}.v70eX{width:44px;height:44px}.v70eTabs{padding:0 6px 6px}.v70eTabs button{min-height:44px}.v70eTabs button i{display:inline;font-size:18px;margin-right:4px}}
@media (prefers-reduced-motion:reduce){#v70eAch{transition:none}.v70eCal div.now{animation:none}}
`;
  document.head.appendChild(s);
}

// ---------- bảng ----------
function v70eOpen(tab){
  let p = document.getElementById('v70ePanel');
  if(!p){ p = document.createElement('div'); p.id = 'v70ePanel'; p.onclick = e => { if(e.target === p) v70eClose(); }; document.body.appendChild(p); }
  try { if(typeof openModal !== 'undefined' && openModal) hideModal(); } catch(e){}
  V70E.panel = p; if(tab) V70E.tab = tab; V70E.mini = null; p.hidden = false; v70eRender();
  if(V70E.tab === 'board') v70eOnline(false).then(() => { if(!p.hidden && V70E.tab === 'board') v70eRender(); });
}
function v70eClose(){ if(V70E.panel) V70E.panel.hidden = true; V70E.mini = null; clearInterval(V70E.tapI); }
function v70eRender(){
  const p = V70E.panel; if(!p) return; const ev = v70eEvent(), s = v70eState(), tab = V70E.tab;
  const tabs = [['fest', '🎉', 'Lễ hội'], ['ck', '📅', 'Điểm danh'], ['ach', '🏅', 'Thành tựu'], ['board', '🏆', 'Bảng vàng']].map(([k, i, n]) => `<button type="button" data-tab="${k}" class="${tab === k ? 'on' : ''}"><i>${i}</i>${n}</button>`).join('');
  const sub = ev ? `${ev.ic} Đang diễn ra: ${ev.n}` : 'Lễ hội, điểm danh, huy hiệu';
  let body = '';
  try { body = V70E.mini ? v70eMiniHtml() : tab === 'ck' ? v70eCkHtml(s) : tab === 'ach' ? v70eAchHtml(s) : tab === 'board' ? v70eBoardHtml() : v70eFestHtml(ev, s); } catch(e){ console.warn('v70e render', e); body = '<section><p>Có lỗi nhỏ, thử lại nhé.</p></section>'; }
  p.innerHTML = `<div class="v70eCard" role="dialog" aria-label="Lễ hội và thành tựu"><div class="v70eHead"><div class="v70eTop"><span class="ic">🏅</span><div><b>Mỗi ngày ở Trường Rubik</b><span>${v70eEsc(sub)}</span></div><button type="button" class="v70eX" aria-label="Đóng">✕</button></div><div class="v70eTabs">${tabs}</div></div>${body}</div>`;
  p.querySelector('.v70eX').onclick = v70eClose;
  p.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { V70E.tab = b.dataset.tab; V70E.mini = null; clearInterval(V70E.tapI); v70eRender(); if(V70E.tab === 'board') v70eOnline(false).then(() => { if(!p.hidden && V70E.tab === 'board' && !V70E.mini) v70eRender(); }); });
  try { v70eBind(p, ev, s); } catch(e){ console.warn('v70e bind', e); }
}
// ---- 🎉 lễ hội ----
function v70eFestHtml(ev, s){
  if(!ev) return '<section><p>Hôm nay chưa có lễ hội. Quay lại sau nhé!</p></section>';
  const f = v70eFest(ev), d = v70eDay(), when = ev.real ? (ev.left > 0 ? `Còn ${ev.left + 1} ngày · đến ${ev.to.slice(8)}/${ev.to.slice(5, 7)}` : 'Ngày cuối cùng!') : 'Lễ hội theo mùa trong game';
  const acts = ev.acts.map(k => { const A = V70E_ACT[k], today = f.day[k + d], ever = f.a[k];
    return `<button type="button" class="v70eRow" data-act="${k}"><span class="ic">${A.ic}</span><span><b>${A.n}</b><small>${A.s}</small></span><span class="go ${today ? 'ok' : ''}">${today ? '✓ Hôm nay' : ever ? 'Chơi lại' : 'Bắt đầu'}</span></button>`; }).join('');
  const nDone = ev.acts.filter(k => f.a[k]).length;
  const up = v70eUpcoming().map(u => `<li><span class="r">${u.ic}</span><span>${u.n}<br><small style="font-size:16px;color:#8a6a48">${u.main.slice(8)}/${u.main.slice(5, 7)}/${u.main.slice(0, 4)}</small></span><b>${u.df <= 0 ? 'Đang diễn ra' : u.df === 1 ? 'Ngày mai' : 'Còn ' + u.df + ' ngày'}</b></li>`).join('');
  return `<section><div class="v70eHero"><div><b>${v70eEsc(ev.n)}</b><span class="v70eChip">${when}</span><p class="v70eNote">${v70eEsc(ev.d)}</p></div><div class="big" aria-hidden="true">${ev.ic}</div></div>
    <button type="button" class="v70eBtn w" data-goplaza="1">🧭 Tới quảng trường cổng trường</button></section>
    <section><h3>🎯 Hoạt động lễ hội <small>mỗi ngày +30 EXP, +$15</small></h3>${acts}</section>
    <section><h3>🎁 Quà lưu niệm giới hạn <small>${nDone}/${ev.acts.length}</small></h3><div class="v70eBar"><i style="width:${Math.round(nDone/ev.acts.length*100)}%"></i></div>
      <p class="v70eNote">${f.done ? `✅ Em đã nhận <b>${v70eEsc(ev.gift)}</b> và danh hiệu “${v70eEsc(ev.n)}”. Đeo danh hiệu ở thẻ 🏅 Thành tựu nhé!` : `Làm đủ ${ev.acts.length} hoạt động trong dịp lễ để nhận <b>${v70eEsc(ev.gift)}</b> (+$40, đồ trang trí nhà, danh hiệu). Hết lễ là hết quà!`}</p></section>
    <section><h3>📆 Lịch lễ hội sắp tới</h3><ul class="v70eRank">${up}</ul><p class="v70eNote">Ngày thường có lễ hội theo mùa trong game: Xuân — Hội chợ khoa học, Hạ — Lễ hội Cây thần kỳ, Thu — Hội thao, Đông — Hội thi Rubik.</p></section>`;
}
// ---- 📅 điểm danh ----
function v70eCkHtml(s){
  const I = v70eCkInfo(), cells = V70E_CK.map((R, i) => { const got = I.done ? i <= (s.ck.n - 1) % 7 : i < I.idx, now = !I.done && i === I.idx;
    return `<div class="${got ? 'got' : ''} ${now ? 'now' : ''} ${R.big ? 'big' : ''}">Ngày ${i + 1}<i>${R.big ? '🏆' : R.dec ? '🎁' : '🪙'}</i><small>${R.m ? '$' + R.m : 'Đồ'}</small></div>`; }).join('');
  const st = I.done ? s.ck.streak : I.streak;
  return `<section><h3>🎁 Quà điểm danh 7 ngày <small>đã điểm danh ${s.ck.n} lần</small></h3><div class="v70eCal">${cells}</div>
    <button type="button" class="v70eBtn g" id="v70eCkGo" ${I.done ? 'disabled' : ''}>${I.done ? '✅ Hôm nay đã nhận — mai quay lại nhé!' : '🎁 Nhận quà hôm nay'}</button>
    <p class="v70eNote">🎁 = đồ trang trí nhà (vào túi đồ, bày ở 🏠 Nhà tôi). Lỡ một ngày cũng không mất vòng quà — chỉ chuỗi ngày liền tính lại.</p></section>
    <section><div class="v70eStreak"><div class="n">${st}<small>ngày liền</small></div><div><b style="font-size:18px">🔥 Chuỗi ngày chơi</b><p class="v70eNote">Kỷ lục: <b>${s.ck.best}</b> ngày. Chuỗi từ 7 ngày: +$5 mỗi lần điểm danh, từ 30 ngày: +$10.</p></div></div></section>
    <section><p class="v70eNote">💡 Chơi vừa đủ mỗi ngày, nhớ nghỉ ngơi và học bài nhé. Quà là tiền trong game, không cần tiền thật.</p></section>`;
}
// ---- 🏅 thành tựu ----
function v70eAchHtml(s){
  if(!v70eLogged()) return '<section><p>🔑 Đăng nhập để lưu thành tựu và huy hiệu của em nhé!</p></section>';
  const n = v70eGotN(s), T = v70eTitles(), cur = s.title;
  const rows = V70E_TR.map(t => { const v = v70eVal(t, s), i = t.t.findIndex(x => v < x), nx = i < 0 ? t.t[2] : t.t[i], pv = i <= 0 ? 0 : t.t[i - 1], pct = i < 0 ? 100 : Math.round((v - pv)/(nx - pv)*100);
    const med = V70E_TIER.map((x, j) => `<span class="${s.got[t.k + j] ? 'g' : ''}" title="${x[0]}">${x[1]}</span>`).join('');
    return `<div class="v70eRow" style="cursor:default"><span class="ic">${t.ic}</span><span><b>${t.n}</b><small>${t.d} · ${i < 0 ? 'đã đạt bậc vàng!' : `${v}/${nx} để lên ${V70E_TIER[i][0]}`}</small><span class="v70eBar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span></span><span class="v70eMed">${med}</span></div>`; }).join('');
  const tl = T.length ? `<div class="v70eTitles"><button type="button" data-title="" class="${cur ? '' : 'on'}">Không đeo</button>${T.map(x => `<button type="button" data-title="${x.id}" class="${cur === x.id ? 'on' : ''}">${v70eEsc(x.tx)}</button>`).join('')}</div>` : '<p class="v70eNote">Đạt huy hiệu đầu tiên để có danh hiệu đeo dưới tên!</p>';
  return `<section><h3>🏅 Huy hiệu <small>${n}/60 · đồng ${V70E_TR.filter(t => s.got[t.k + 0]).length} · bạc ${V70E_TR.filter(t => s.got[t.k + 1]).length} · vàng ${V70E_TR.filter(t => s.got[t.k + 2]).length}</small></h3><div class="v70eBar" style="height:14px"><i style="width:${Math.round(n/60*100)}%"></i></div></section>
    <section><h3>🎖️ Danh hiệu dưới tên</h3>${tl}</section><section><h3>📋 20 hạng mục × 3 bậc</h3>${rows}</section>`;
}
// ---- 🏆 bảng vàng ----
function v70eBoardHtml(){
  const c = V70E.bc || 'week', C = V70E_BC.find(x => x.k === c), L = v70eRows(c), me = L.findIndex(r => r.me);
  const seg = V70E_BC.map(x => `<button type="button" data-bc="${x.k}" class="${x.k === c ? 'on' : ''}">${x.ic}<br>${x.n.replace('Chăm chỉ tuần', 'Chăm tuần')}</button>`).join('');
  const li = L.slice(0, 10).map((r, i) => `<li class="${r.me ? 'me' : ''}"><span class="r">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span>${v70eEsc(r.u)}${r.on ? ' 🌐' : ''}${r.me ? ' (em)' : ''}</span><b>${r[c]}</b></li>`).join('');
  const unit = {rubik:'lần giải / luyện Rubik', chess:'ván cờ vua', fish:'con cá câu được', week:'điểm chăm chỉ tuần này (mỗi hoạt động +1, điểm danh +3)'}[c];
  return `<section><div class="v70eSeg">${seg}</div><h3>${C.ic} ${C.n} <small>${unit}</small></h3><ol class="v70eRank">${li || '<li>Chưa có ai.</li>'}</ol>
    <p class="v70eNote">${me >= 0 ? (me < 10 ? `🎉 Em đang hạng <b>${me + 1}</b>!` : `Em đang hạng <b>${me + 1}</b> — cố lên để vào top 10!`) : (v70eLogged() ? '🌱 Chơi thêm hoạt động này để có tên trên bảng nhé!' : '🔑 Đăng nhập và chơi để có tên trên bảng.')}</p>
    <p class="v70eNote">Top 3 “Chăm chỉ tuần” được dựng tượng ở bục vinh danh cạnh cổng trường. ${V70E.online && V70E.online.length ? '🌐 = bạn chơi online.' : 'Đang xếp cùng các bạn học sinh trong trường.'}</p></section>`;
}

// ---------- gắn sự kiện ----------
function v70eBind(p, ev, s){
  p.querySelectorAll('[data-act]').forEach(b => b.onclick = () => v70eMiniStart(b.dataset.act));
  const gp = p.querySelector('[data-goplaza]'); if(gp) gp.onclick = () => { const G = v70eGeo(); v70eClose(); try { v32Nav(G.g[0] + V46E, G.g[1] + 60, 'Quảng trường cổng trường', true); } catch(e){ toast('Quảng trường ở ngay cổng trường giữa đảo.'); } };
  const ck = p.querySelector('#v70eCkGo'); if(ck) ck.onclick = () => { const R = v70eCheckin(); if(!R){ if(!v70eLogged()) toast('🔑 Đăng nhập để nhận quà điểm danh nhé!'); return; } try { cheerSfx(); } catch(e){}
    v70eRender(); v70eNotify({ic:R.big ? '🏆' : '🎁', n:`Điểm danh ngày ${R.day}/7`, tier:R.big ? 2 : 1, head:`📅 Chuỗi ${R.streak} ngày liền`, d:R.got.join(' · ')}); };
  p.querySelectorAll('[data-title]').forEach(b => b.onclick = () => { s.title = b.dataset.title; v70eSave(); v70eRender(); try { toast(s.title ? '🎖️ Đã đeo danh hiệu: ' + v70eTitleText() : 'Đã bỏ danh hiệu.'); } catch(e){} });
  p.querySelectorAll('[data-bc]').forEach(b => b.onclick = () => { V70E.bc = b.dataset.bc; v70eRender(); });
  if(V70E.mini) v70eMiniBind(p);
}

// ---------- mini hoạt động ----------
function v70eMiniStart(k){
  const A = V70E_ACT[k], ev = v70eEvent(); if(!A || !ev) return;
  if(A.type === 'lap' || A.type === 'collect'){ v70eStartWorld(k); return; }
  const M = {k, A, ev};
  if(A.type === 'order'){ M.order = v70eShuf(A.steps.map((t, i) => i)); M.pos = 0; M.miss = 0; }
  if(A.type === 'quiz'){ M.qs = v70eShuf(V70E_QZ[ev.k] || V70E_QZ.rubik).slice(0, 3).map(q => ({q:q[0], o:v70eShuf(q[1].map((t, i) => [t, i]))})); M.i = 0; M.ok = 0; M.ans = null; }
  if(A.type === 'tap'){ M.n = 0; M.good = 0; M.t0 = 0; M.end = false; }
  if(A.type === 'card'){ M.who = ''; M.fl = '💐'; M.wish = 0; M.sent = false; }
  V70E.mini = M; v70eRender();
}
function v70eMiniHtml(){
  const M = V70E.mini, A = M.A, back = '<button type="button" class="v70eBtn w" data-back="1">← Quay lại lễ hội</button>';
  let h = `<section><h3>${A.ic} ${A.n} <small>${v70eEsc(M.ev.n)}</small></h3>`;
  if(A.type === 'order'){
    if(M.pos >= A.steps.length) return h + `<p>🎉 Đúng hết các bước!</p><p class="v70eNote">💡 ${A.fact}</p>${M.win ? '' : ''}${back}</section>`;
    h += `<p>Chạm bước <b>số ${M.pos + 1}</b> theo đúng thứ tự:</p><div class="v70eOpts">` + M.order.map(i => `<button type="button" data-st="${i}" class="${i < M.pos ? 'ok done' : ''}" ${i < M.pos ? 'disabled' : ''}>${i < M.pos ? '✓ ' + (i + 1) + '. ' : ''}${v70eEsc(A.steps[i])}</button>`).join('') + `</div><p class="v70eNote">Sai: ${M.miss} lần — không sao, thử lại nhé!</p>`;
  }
  if(A.type === 'quiz'){
    if(M.i >= M.qs.length) return h + `<p>${M.ok >= 2 ? '🎉' : '🙂'} Em trả lời đúng <b>${M.ok}/3</b> câu.</p>${M.ok >= 2 ? '' : '<button type="button" class="v70eBtn" data-again="1">🔁 Làm lại</button>'}${back}</section>`;
    const Q = M.qs[M.i]; h += `<p><b>Câu ${M.i + 1}/3:</b> ${v70eEsc(Q.q)}</p><div class="v70eOpts">` + Q.o.map(([t, j]) => `<button type="button" data-qa="${j}" class="${M.ans == null ? '' : j === 0 ? 'ok' : j === M.ans ? 'no' : 'done'}" ${M.ans == null ? '' : 'disabled'}>${v70eEsc(t)}</button>`).join('') + '</div>' + (M.ans != null ? '<button type="button" class="v70eBtn" data-next="1">Câu tiếp →</button>' : '');
  }
  if(A.type === 'tap'){
    if(A.mode === 'beat'){ h += `<p>Trống “Tùng!” sáng lên theo nhịp — chạm đúng lúc trống sáng. Đúng <b>6/9</b> nhịp là đạt.</p><button type="button" class="v70eDrum" id="v70eDrum">${M.end ? (M.good >= 6 ? '🎉' : '🔁') : M.t0 ? 'TÙNG!' : 'BẮT ĐẦU'}</button><p class="v70eNote" id="v70eTapInfo">Nhịp: ${Math.min(9, M.n)}/9 · đúng: ${M.good}</p>`; }
    else { h += `<p>Chạm thật nhanh vào nút để chạy tiếp sức! <b>25 lần trong 6 giây</b>.</p><button type="button" class="v70eDrum" id="v70eDrum" style="background:radial-gradient(circle,#fff3d6 0 52%,#1e88e5 53%)">${M.end ? (M.good ? '🎉' : '🔁') : M.t0 ? '🏃 ' + M.n : 'BẮT ĐẦU'}</button><p class="v70eNote" id="v70eTapInfo">${M.t0 && !M.end ? 'Chạy!' : 'Sẵn sàng…'}</p>`; }
    if(M.end) h += `<p>${M.good ? '🎉 Tuyệt vời, em đã hoàn thành!' : '🙂 Gần được rồi! Thử lại nhé.'}</p>${M.good ? '' : '<button type="button" class="v70eBtn" data-again="1">🔁 Thử lại</button>'}`;
  }
  if(A.type === 'card'){
    const T = v70eTeachers(), W = ['Con cảm ơn thầy cô đã dạy con thật nhiều điều hay!', 'Chúc thầy cô luôn vui khỏe và hạnh phúc!', 'Con hứa sẽ chăm ngoan, học giỏi!', 'Cảm ơn thầy cô đã luôn kiên nhẫn với con!'];
    if(M.sent) return h + `<div class="v70ePaper"><span class="fl">${M.fl}</span>Gửi ${v70eEsc(M.whoN)}:<br>“${v70eEsc(W[M.wish])}”<br><small>— ${v70eEsc(v70eLogged() ? PROF.name : 'Học sinh')}</small></div><p>💌 ${v70eEsc(M.whoN)} rất vui khi nhận thiệp của em!</p>${back}</section>`;
    h += `<p><b>1.</b> Tặng thầy cô nào?</p><div class="v70eTitles">${T.map(a => `<button type="button" data-who="${a.id}" class="${M.who === a.id ? 'on' : ''}">${v70eEsc(a.name)}</button>`).join('')}</div>
      <p><b>2.</b> Chọn hoa:</p><div class="v70eTitles">${['💐', '🌹', '🌻', '🌷'].map(f => `<button type="button" data-fl="${f}" class="${M.fl === f ? 'on' : ''}" style="font-size:22px">${f}</button>`).join('')}</div>
      <p><b>3.</b> Lời chúc:</p><div class="v70eOpts">${W.map((w, i) => `<button type="button" data-wish="${i}" class="${M.wish === i ? 'ok' : ''}">${v70eEsc(w)}</button>`).join('')}</div>
      <button type="button" class="v70eBtn g" data-send="1" ${M.who ? '' : 'disabled'}>💌 Gửi thiệp</button>`;
  }
  return h + back + '</section>';
}
function v70eTeachers(){ const ids = ['ha', 'xuan', 'ngoc', 'lai']; const L = ids.map(i => (typeof A !== 'undefined' && A[i]) || null).filter(Boolean); return L.length ? L : [{id:'ha', name:'Cô Hà'}]; }
function v70eMiniWin(){ const M = V70E.mini; if(!M || M.win) return; M.win = true; const paid = v70eActDone(M.k); try { cheerSfx(); } catch(e){} try { toast(`🎉 Hoàn thành “${M.A.n}”!` + (paid ? ' +30 EXP, +$15' : ' (hôm nay đã nhận quà rồi)')); } catch(e){} }
function v70eMiniBind(p){
  const M = V70E.mini, A = M.A, R = () => v70eRender();
  const bk = p.querySelector('[data-back]'); if(bk) bk.onclick = () => { V70E.mini = null; clearInterval(V70E.tapI); V70E.tab = 'fest'; R(); };
  const ag = p.querySelector('[data-again]'); if(ag) ag.onclick = () => v70eMiniStart(M.k);
  p.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const i = +b.dataset.st; if(i === M.pos){ M.pos++; try { blipSfx(700 + M.pos*80); } catch(e){} if(M.pos >= A.steps.length) v70eMiniWin(); } else { M.miss++; b.classList.add('no'); try { blipSfx(220); } catch(e){} setTimeout(R, 260); return; } R(); });
  p.querySelectorAll('[data-qa]').forEach(b => b.onclick = () => { if(M.ans != null) return; M.ans = +b.dataset.qa; if(M.ans === 0){ M.ok++; try { blipSfx(1200); } catch(e){} } else try { blipSfx(220); } catch(e){} R(); });
  const nx = p.querySelector('[data-next]'); if(nx) nx.onclick = () => { M.i++; M.ans = null; if(M.i >= M.qs.length && M.ok >= 2) v70eMiniWin(); R(); };
  p.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { M.who = b.dataset.who; R(); });
  p.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => { M.fl = b.dataset.fl; R(); });
  p.querySelectorAll('[data-wish]').forEach(b => b.onclick = () => { M.wish = +b.dataset.wish; R(); });
  const sd = p.querySelector('[data-send]'); if(sd) sd.onclick = () => { const a = v70eTeachers().find(x => x.id === M.who); M.whoN = a ? a.name : 'thầy cô'; M.sent = true;
    try { if(a && a.visible) { say(a, `Cảm ơn ${v70eLogged() ? PROF.name : 'em'} nhé! ${M.fl}`); a.icon = 'gift'; setTimeout(() => { if(a.icon === 'gift') a.icon = null; }, 60000); } } catch(e){}
    try { log('event', `${v70eLogged() ? PROF.name : 'Một bạn'} tặng ${M.fl} và thiệp cho ${M.whoN} nhân ngày Nhà giáo.`); } catch(e){} v70eMiniWin(); R(); };
  const dr = p.querySelector('#v70eDrum'); if(dr) dr.onclick = () => v70eTapHit(dr);
}
// trống: nhịp 0,62 giây (≈ 1/φ); chạm trong ±0,19 giây quanh nhịp là đúng
function v70eTapHit(dr){
  const M = V70E.mini, A = M.A, now = performance.now()/1000;
  if(M.end){ v70eMiniStart(M.k); return; }
  if(!M.t0){ M.t0 = now + .62; M.n = 0; M.good = 0; clearInterval(V70E.tapI);
    if(A.mode === 'beat'){ V70E.tapI = setInterval(() => { const d = document.getElementById('v70eDrum'); if(!d || !V70E.mini){ clearInterval(V70E.tapI); return; } const t = performance.now()/1000 - M.t0, k = Math.round(t/.618); M.n = Math.max(M.n, Math.floor(t/.618) + 1);
      d.classList.toggle('beat', t > -.1 && Math.abs(t - k*.618) < .12); if(Math.abs(t - k*.618) < .03 && k >= 0 && k !== M.lastK){ M.lastK = k; try { tone(AC.currentTime, 110, .12, .2, 'triangle'); } catch(e){} }
      if(t > 9*.618){ clearInterval(V70E.tapI); M.end = true; if(M.good >= 6) v70eMiniWin(); v70eRender(); } }, 30); }
    else { V70E.tapI = setInterval(() => { if(!V70E.mini){ clearInterval(V70E.tapI); return; } if(performance.now()/1000 - M.t0 > 6){ clearInterval(V70E.tapI); M.end = true; M.good = M.n >= 25 ? 1 : 0; if(M.good) v70eMiniWin(); v70eRender(); } }, 50); M.t0 = now; }
    v70eRender(); return; }
  if(A.mode === 'beat'){ const t = now - M.t0, k = Math.round(t/.618); if(k >= 0 && k < 9 && Math.abs(t - k*.618) < .19 && M.hitK !== k){ M.hitK = k; M.good++; try { blipSfx(660); } catch(e){} } const i = document.getElementById('v70eTapInfo'); if(i) i.textContent = `Nhịp: ${Math.min(9, M.n)}/9 · đúng: ${M.good}`; }
  else { M.n++; dr.textContent = '🏃 ' + M.n; const i = document.getElementById('v70eTapInfo'); if(i) i.textContent = `${M.n}/25 · còn ${Math.max(0, 6 - (now - M.t0)).toFixed(1)} giây`; if(M.n >= 25 && !M.end){ clearInterval(V70E.tapI); M.end = true; M.good = 1; v70eMiniWin(); v70eRender(); } }
}
