// ================= EXT40 (v35): no yellow box on the selected person, names only when near, one icon per season/weather,
// 🎈/🚲 buttons at the top next to ☰, slower + smoother walking, every popup at the top, name/level/money on the phone, more teachings =================
const V35 = {near:150, walk:.82};
function v35Ic(k){ return ({xuan:'🌸', ha:'🌻', thu:'🍂', dong:'☃️', nang:'☀️', mua:'🌧️', gio:'🍃', bao:'🌀', sieubao:'⛈️', loc:'🌪️', samset:'⚡', muada:'🧊', suongmu:'🌫️', dongdat:'🏚️', nangnong:'🥵', muaphun:'🌦️', cauvong:'🌈', tuyet:'❄️', baotuyet:'🌨️', songthan:'🌊', nhatthuc:'🌑', saobang:'🌠'})[k] || ''; }
function v35IcName(n){ for(const k in SEASONS) if(SEASONS[k].name === n) return v35Ic(k); for(const k in WEATHERS) if(WEATHERS[k].name === n) return v35Ic(k); return ''; }
// name pill only for you and people within a few steps of you (everyone when there is no player on the map)
function v35Name(a){ const P = PLAYER; if(!P || !P.visible || a === P) return true; return Math.abs(a.x - P.x) < V35.near && Math.abs(a.y - P.y) < V35.near && Math.hypot(a.x - P.x, a.y - P.y) < V35.near; }
// walking: a bit slower, with a short speed-up when you start so it glides instead of jumping
function v35Sp(c, sp){ const t = performance.now(), gap = t - (c._v35t || 0); if(gap > 120) c._v35r = .35; else c._v35r = Math.min(1, c._v35r + gap/260); c._v35t = t; const e = 1 - Math.pow(1 - c._v35r, 2); return sp * (c.mount || c.cycling ? 1 : V35.walk) * e; }
function v35Btns(){
  const st = $('#stage'); if(!st || $('#v35Fly')) return;
  const add = (id, cls, html, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'v32ic ' + cls; b.innerHTML = html; b.setAttribute('aria-label', label); b.onclick = e => { e.stopPropagation(); fn(); setTimeout(v35BtnSync, 60); }; st.appendChild(b); };
  add('v35Fly', 'v35fly', '🎈', 'Bay lên trời hoặc hạ cánh', () => { try { flyToggle(); } catch(e){} });
  add('v35Bike', 'v35bike', '🚲', 'Đạp xe hoặc xuống xe', () => { try { toggleBike(); } catch(e){} });
  v35BtnSync();
}
function v35BtnSync(){ const P = PLAYER, f = $('#v35Fly'), b = $('#v35Bike'); if(f){ const on = !!(P && P.v16fly); f.textContent = on ? '🪂' : '🎈'; f.setAttribute('aria-pressed', on); } if(b){ const on = !!(P && P.cycling); b.setAttribute('aria-pressed', on); } }
// mini season/weather chips get their own icon too
function v35Chips(){ const c = $('#v32Chips'); if(!c) return; const b = c.querySelectorAll('.v32chip'); if(b[0]) b[0].textContent = `${v35Ic(season)} ${SEASONS[season].name}`; if(b[1]) b[1].textContent = `${v35Ic(weather)} ${WEATHERS[weather].name}`; }
const V35_WISDOM = [
  ['Tâm dẫn đầu các pháp, tâm làm chủ, tâm tạo tác. Nói hay làm với tâm trong sạch, an lạc sẽ theo ta như bóng không rời hình.', 'Kinh Pháp Cú, câu 2'],
  ['Thắng ngàn quân địch không bằng tự thắng chính mình; tự thắng mình mới là chiến thắng lớn nhất.', 'Kinh Pháp Cú, câu 103'],
  ['Như tảng đá kiên cố không bị gió lay động, người trí không dao động trước lời khen hay tiếng chê.', 'Kinh Pháp Cú, câu 81'],
  ['Chớ khinh điều ác nhỏ mà cho rằng không hại gì; giọt nước nhỏ mãi rồi cũng đầy bình.', 'Kinh Pháp Cú, câu 121'],
  ['Chớ khinh điều thiện nhỏ mà cho rằng không đáng; giọt nước nhỏ mãi rồi cũng đầy bình. Người trí tích thiện từng chút một.', 'Kinh Pháp Cú, câu 122'],
  ['Một lời có ý nghĩa, nghe xong được an tịnh, hơn ngàn lời vô ích.', 'Kinh Pháp Cú, câu 100'],
  ['Không làm các điều ác, siêng làm các việc lành, giữ tâm ý trong sạch — đó là lời chư Phật dạy.', 'Kinh Pháp Cú, câu 183'],
  ['Sức khỏe là món lợi lớn nhất, biết đủ là tài sản lớn nhất, lòng tin là người thân tốt nhất, an lạc là hạnh phúc cao nhất.', 'Kinh Pháp Cú, câu 204'],
  ['Người tự mình làm điều ác thì tự mình nhiễm ô; tự mình không làm ác thì tự mình trong sạch. Không ai làm cho ai trong sạch được.', 'Kinh Pháp Cú, câu 165'],
  ['Hãy tự mình thắp đuốc lên mà đi; hãy nương tựa nơi chính mình.', 'Kinh Đại Bát Niết Bàn'],
  ['Như bông hoa đẹp có sắc lại có hương, lời hay mà làm theo được sẽ mang lại quả tốt.', 'Kinh Pháp Cú, câu 52'],
  ['Người ngu nghĩ mình ngu, nhờ vậy thành có trí. Người ngu tưởng mình trí, thật đáng gọi chí ngu.', 'Kinh Pháp Cú, câu 63'],
  ['Như ong đến với hoa, chỉ lấy mật rồi đi, không làm hại sắc hương — bậc hiền đi giữa đời cũng vậy.', 'Kinh Pháp Cú, câu 49'],
  ['Đừng nhìn lỗi người, đừng nhìn việc người làm hay chưa làm; hãy nhìn việc mình đã làm và chưa làm.', 'Kinh Pháp Cú, câu 50'],
  ['Ai trước kia buông lung, sau lại tỉnh thức, người ấy soi sáng thế gian như trăng thoát khỏi mây che.', 'Kinh Pháp Cú, câu 172'],
  ['Không có lửa nào bằng tham, không có cái mất nào bằng sân, không có khổ nào bằng thân năm uẩn, không vui nào bằng tịch tịnh.', 'Kinh Pháp Cú, câu 202'],
  ['Người nói lời ác như cầm búa trong miệng, chém vào chính mình.', 'Kinh Tương Ưng'],
  ['Giận dữ như cầm hòn than nóng định ném vào người khác; chính mình bị bỏng trước tiên.', 'Lời Phật dạy (lưu truyền)'],
  ['Mọi thứ đều thay đổi. Biết vậy, ta bớt khổ khi mất và bớt kiêu khi được.', 'Lời Phật dạy về vô thường'],
  ['Quá khứ đã qua, tương lai chưa đến. Hãy sống trọn vẹn với giây phút hiện tại.', 'Kinh Nhất Dạ Hiền Giả'],
  ['Một ngọn nến thắp được ngàn ngọn nến mà không ngắn đi; hạnh phúc chia sẻ không bao giờ vơi.', 'Lời Phật dạy (lưu truyền)'],
  ['Nước chảy chậm thì ồn ào, biển cả sâu thì lặng lẽ. Người hiểu biết thường nói ít.', 'Kinh Tập'],
  ['Hãy nói lời chân thật, nói lời dịu dàng, nói lời đúng lúc và có ích.', 'Kinh Trung Bộ'],
  ['Từng giọt nước rơi đầy bình; người trí làm việc thiện mỗi ngày một ít mà thành lớn.', 'Kinh Pháp Cú'],
  ['Biết đủ thì nằm đất vẫn thấy an vui; không biết đủ thì ở thiên đường vẫn chưa vừa ý.', 'Kinh Di Giáo'],
  ['Hãy thương yêu muôn loài như mẹ thương đứa con một của mình.', 'Kinh Từ Bi'],
  ['Tất cả đều sợ gươm đao, tất cả đều quý mạng sống. Lấy mình làm ví dụ, đừng giết, đừng bảo người giết.', 'Kinh Pháp Cú, câu 130'],
  ['Ai sống trăm năm mà lười biếng, không bằng sống một ngày tinh tấn.', 'Kinh Pháp Cú, câu 112'],
  ['Thở vào, tôi biết tôi đang thở vào. Thở ra, tôi mỉm cười.', 'Kinh Quán Niệm Hơi Thở'],
  ['Như đất nhận mọi thứ sạch hay dơ mà không giận, hãy tập tâm rộng như đất.', 'Kinh Giáo Giới La Hầu La'],
  ['Không ai cứu ta ngoài chính ta. Không ai có thể và không ai được phép. Ta phải tự bước trên con đường.', 'Kinh Pháp Cú, câu 165 (ý)'],
  ['Kẻ thù gây hại kẻ thù, oán gia hại oán gia, không bằng tâm hướng tà gây ác cho tự thân.', 'Kinh Pháp Cú, câu 42'],
  ['Cha mẹ làm cho con, bà con làm cho con, không bằng tâm hướng chánh làm cho ta tốt hơn.', 'Kinh Pháp Cú, câu 43'],
  ['Ai biết giữ cơn giận như giữ chiếc xe đang lao, ta gọi là người đánh xe giỏi.', 'Kinh Pháp Cú, câu 222'],
  ['Hạnh phúc không đến từ những gì ta có, mà từ cách ta nhìn những gì ta có.', 'Lời Phật dạy (lưu truyền)'],
];
const V35_ADVICE = [
  ['Có công mài sắt, có ngày nên kim.', 'Tục ngữ Việt Nam'], ['Uống nước nhớ nguồn.', 'Tục ngữ Việt Nam'],
  ['Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.', 'Ca dao Việt Nam'], ['Học thầy không tày học bạn.', 'Tục ngữ Việt Nam'],
  ['Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.', 'Ca dao Việt Nam'], ['Thương người như thể thương thân.', 'Tục ngữ Việt Nam'],
  ['Đi một ngày đàng, học một sàng khôn.', 'Tục ngữ Việt Nam'], ['Ăn quả nhớ kẻ trồng cây.', 'Tục ngữ Việt Nam'],
  ['Không có việc gì khó, chỉ sợ lòng không bền. Đào núi và lấp biển, quyết chí ắt làm nên.', 'Hồ Chí Minh'],
  ['Học, học nữa, học mãi.', 'V. I. Lênin'], ['Biết thì thưa thốt, không biết thì dựa cột mà nghe.', 'Tục ngữ Việt Nam'],
  ['Mỗi sáng thức dậy, hãy làm một việc nhỏ cho người khác vui.', 'Lời thầy dặn'],
  ['Sai thì nhận, nhận thì sửa. Người dám sửa sai mới là người mạnh.', 'Lời thầy dặn'],
  ['Đừng so mình với người khác; hãy so mình hôm nay với mình hôm qua.', 'Lời thầy dặn'],
  ['Chậm mà chắc còn hơn nhanh mà ẩu.', 'Lời thầy dặn'], ['Giữ lời hứa dù là lời hứa nhỏ nhất.', 'Lời thầy dặn'],
  ['Khi buồn, hãy đi bộ một vòng, uống ngụm nước và kể cho người mình tin.', 'Lời thầy dặn'],
  ['Biết ơn ba điều mỗi tối trước khi ngủ; lòng sẽ nhẹ như mây.', 'Lời thầy dặn'],
  ['Người giỏi không phải người không bao giờ ngã, mà là người ngã rồi lại đứng lên.', 'Lời thầy dặn'],
  ['Đọc một trang sách mỗi ngày, một năm em sẽ khác hẳn.', 'Lời thầy dặn'],
  ['Lắng nghe nhiều hơn nói; hiểu người rồi mới mong người hiểu mình.', 'Lời thầy dặn'],
  ['Tiết kiệm từng đồng nhỏ, đến lúc cần sẽ có đồng lớn.', 'Lời thầy dặn'],
  ['Hãy tử tế, vì ai em gặp cũng đang mang một nỗi lo mà em không biết.', 'Lời thầy dặn'],
  ['Làm xong việc nhỏ trước, việc lớn sẽ bớt đáng sợ.', 'Lời thầy dặn'],
];
function v35Init(){
  try { WISDOM_DAILY.push(...V35_WISDOM, ...V35_ADVICE); } catch(e){}
  if(window.V32 && V32.phone || document.body.classList.contains('v32phone')) v35Btns();
  const mo = new MutationObserver(() => { if(document.body.classList.contains('v32phone')) v35Btns(); }); mo.observe(document.body, {attributes:true, attributeFilter:['class']});
  setInterval(() => { v35BtnSync(); v35Chips(); }, 700);
}
