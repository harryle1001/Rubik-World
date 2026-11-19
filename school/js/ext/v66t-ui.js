// ================= v66t · CÂY THẦN KỲ 4/4: bảng tương tác — ước một điều + quà mỗi ngày, kiến thức về cây, đố vui =================
// Bảng toàn màn hình kiểu các mini game, chạm là dùng được trên điện thoại. Chữ Nunito ≥ 16px, bố cục theo φ.
const V66T_WISH = ['📚 Học thật giỏi', '👨‍👩‍👧 Gia đình luôn khỏe', '🤝 Có thêm nhiều bạn', '🧩 Giải Rubik thật nhanh', '🌏 Đi khắp thế giới', '😊 Ngày nào cũng vui'];
const V66T_FACT = [
  ['☀️ Cây tự nấu ăn', 'Lá cây dùng ánh nắng, nước và khí CO₂ để làm ra đường nuôi cây — gọi là quang hợp. Khi đó cây nhả ra khí ô-xi cho chúng ta thở.', 'Cây nhả ra khí gì khi quang hợp?', ['Ô-xi', 'Khói', 'Hơi muối'], 0],
  ['🪵 Vòng tuổi', 'Cắt ngang thân cây sẽ thấy các vòng tròn. Mỗi năm cây thường thêm một vòng, nên đếm vòng là biết tuổi cây.', 'Đếm cái gì để biết tuổi cây?', ['Số lá', 'Vòng gỗ trong thân', 'Số cành'], 1],
  ['🌱 Rễ uống nước', 'Rễ hút nước và chất khoáng từ đất, đồng thời giữ cây đứng vững trước gió bão.', 'Rễ cây làm nhiệm vụ gì?', ['Hút nước, giữ cây', 'Làm hoa', 'Bắt sâu'], 0],
  ['🍂 Lá đổi màu', 'Mùa thu, cây ngừng làm chất diệp lục màu xanh, nên màu vàng, cam vốn ẩn trong lá mới hiện ra.', 'Chất làm lá có màu xanh tên là gì?', ['Diệp lục', 'Muối', 'Mật hoa'], 0],
  ['🌳 Cây đa Việt Nam', 'Cây đa có rễ phụ mọc từ cành buông xuống đất, lâu dần thành như thêm nhiều thân. Cây đa, giếng nước, sân đình là hình ảnh quen thuộc của làng quê.', 'Rễ phụ của cây đa mọc từ đâu?', ['Từ cành buông xuống', 'Từ lá', 'Từ quả'], 0],
  ['💧 Cây "đổ mồ hôi"', 'Lá có lỗ khí rất nhỏ. Nước bay hơi qua đó giúp cây mát và kéo nước từ rễ lên tận ngọn.', 'Nước bay hơi ra khỏi cây chủ yếu qua đâu?', ['Lỗ khí ở lá', 'Vỏ rễ', 'Hoa'], 0],
  ['🐝 Bạn của hoa', 'Ong và bướm mang phấn hoa từ bông này sang bông khác, giúp cây kết quả và tạo hạt.', 'Con vật nào giúp hoa kết quả?', ['Ong, bướm', 'Cá', 'Mèo'], 0],
  ['🏔️ Cây cao nhất', 'Cây gỗ đỏ ở Mỹ có thể cao hơn 110 mét — gần bằng toà nhà 35 tầng!', 'Cây gỗ đỏ cao nhất cao khoảng bao nhiêu?', ['11 mét', 'Hơn 110 mét', '1 km'], 1],
  ['🌧️ Rừng giữ nước', 'Rễ và lớp lá rụng trong rừng giữ nước mưa, giúp giảm lũ lụt và sạt lở đất.', 'Rừng giúp giảm điều gì?', ['Lũ lụt, sạt lở', 'Ánh nắng', 'Tiếng chim'], 0],
  ['🌀 Tỷ lệ vàng trong cây', 'Nhiều cây xếp lá xoay quanh thân một góc khoảng 137,5° (góc vàng) để lá dưới không bị lá trên che nắng.', 'Góc vàng giúp lá cây được gì?', ['Nhận đủ nắng', 'Rụng nhanh', 'Đổi màu'], 0],
  ['🫘 Hạt đi du lịch', 'Hạt bồ công anh bay theo gió, hạt dừa trôi trên biển, có hạt bám vào lông thú để đi xa.', 'Hạt dừa đi xa bằng cách nào?', ['Trôi trên nước', 'Bay như chim', 'Chạy'], 0],
  ['🍃 Một cây, nhiều ô-xi', 'Một cây lớn mỗi năm tạo ra lượng ô-xi đủ cho khoảng 2 người thở. Trồng cây là tặng không khí sạch!', 'Trồng cây giúp không khí thế nào?', ['Sạch hơn', 'Bẩn hơn', 'Không đổi'], 0]
];
function v66tCss(){
  if(document.getElementById('v66tCss')) return; const s = document.createElement('style'); s.id = 'v66tCss';
  s.textContent = `
#v66tGo{background:linear-gradient(#4fa046,#2d6b36)!important}#v66tGo[hidden],#v66tPanel[hidden]{display:none!important}
#v66tPanel{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(8,14,10,.62);font-family:Nunito,'Be Vietnam Pro',sans-serif;color:#2b1a10;touch-action:manipulation}
#v66tPanel .v66tCard{position:relative;width:min(560px,100%);max-height:100%;overflow:auto;-webkit-overflow-scrolling:touch;border-radius:22px;background:#f6ecd2;border:4px solid #2b1a10;box-shadow:0 0 0 4px #b97a45,0 22px 60px rgba(0,0,0,.55)}
#v66tPanel .v66tHead{display:flex;align-items:center;gap:14px;padding:16px 20px 10px;background:linear-gradient(#3f8a40,#2d6b36);color:#fff6e0;border-bottom:4px solid #2b1a10;position:sticky;top:0;z-index:1}
#v66tPanel .v66tHead canvas{width:62px;height:62px;image-rendering:pixelated;flex:none;background:rgba(255,255,255,.12);border-radius:14px}
#v66tPanel .v66tHead b{display:block;font-size:24px;font-weight:900;line-height:1.15}#v66tPanel .v66tHead span{font-size:16px;opacity:.92}
#v66tPanel .v66tX{margin-left:auto;flex:none;width:48px;height:48px;border-radius:50%;border:3px solid #2b1a10;background:#f6ecd2;color:#2b1a10;font:900 22px Nunito,sans-serif;cursor:pointer}
#v66tPanel section{margin:16px 16px 0;padding:14px 16px 16px;border-radius:16px;background:#fffaf0;border:3px solid #d9b98a}
#v66tPanel section:last-child{margin-bottom:16px}
#v66tPanel h3{margin:0 0 10px;font-size:19px;font-weight:900;color:#5a3418}
#v66tPanel p{margin:6px 0;font-size:17px;line-height:1.5}
#v66tPanel .v66tChips{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#v66tPanel button.v66tC{min-height:48px;padding:8px 10px;border-radius:14px;border:3px solid #d9b98a;background:#fff;font:800 16px Nunito,sans-serif;color:#3a2414;cursor:pointer;text-align:left}
#v66tPanel button.v66tC.on{border-color:#2d6b36;background:#e3f4d6}
#v66tPanel button.v66tC.ok{border-color:#2d6b36;background:#c9efb4}#v66tPanel button.v66tC.no{border-color:#c0392b;background:#ffd9d2}
#v66tPanel .v66tBig{display:block;width:100%;min-height:54px;margin-top:12px;border-radius:16px;border:3px solid #2b1a10;background:linear-gradient(#ffd23f,#e8a23a);font:900 19px Nunito,sans-serif;color:#2b1a10;cursor:pointer}
#v66tPanel .v66tBig:disabled{opacity:.5}
#v66tPanel .v66tGift{margin-top:12px;padding:12px 14px;border-radius:14px;background:#2d6b36;color:#fff6e0;font-size:17px;font-weight:800;text-align:center}
#v66tPanel .v66tLink{min-height:44px;margin-top:8px;padding:6px 14px;border-radius:12px;border:2px solid #b97a45;background:#f6ecd2;font:800 16px Nunito,sans-serif;color:#5a3418;cursor:pointer}
#v66tPanel .v66tFly{position:absolute;left:50%;top:40%;font-size:44px;pointer-events:none;animation:v66tUp 1.6s ease-out forwards}
@keyframes v66tUp{0%{transform:translate(-50%,0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translate(-50%,-180px) scale(1.25) rotate(25deg);opacity:0}}
@media (max-width:420px){#v66tPanel .v66tChips{grid-template-columns:1fr}#v66tPanel .v66tHead b{font-size:21px}}`;
  document.head.appendChild(s);
}
function v66tOpen(){
  if(V66T.panel) return; v66tCss(); const s = v66tState(), today = v66tToday(), fi = (s.n + new Date().getDate()) % V66T_FACT.length;
  let d = document.getElementById('v66tPanel'); if(!d){ d = document.createElement('div'); d.id = 'v66tPanel'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cây thần kỳ'); (document.getElementById('stage') || document.body).appendChild(d); }
  d.innerHTML = '<div class="v66tCard"><div class="v66tHead"><canvas width="62" height="62"></canvas><div><b>🌳 Cây thần kỳ</b><span>Cây cổ thụ khổng lồ giữa đảo</span></div><button type="button" class="v66tX" aria-label="Đóng">✕</button></div>' +
    '<section><h3>🌠 Ước một điều</h3><p>Chọn một điều ước, rồi gửi cho Cây thần kỳ. Mỗi ngày cây tặng bạn một món quà nhỏ!</p><div class="v66tChips">' + V66T_WISH.map((w, i) => '<button type="button" class="v66tC" data-w="' + i + '">' + v66tEsc(w) + '</button>').join('') + '</div>' +
    '<button type="button" class="v66tBig" id="v66tSend" disabled>✨ Gửi điều ước</button><div id="v66tRes"></div></section>' +
    '<section><h3>📖 Kiến thức về cây</h3><div id="v66tFact"></div><button type="button" class="v66tLink" id="v66tNext">Điều thú vị khác ›</button></section>' +
    '<section><h3>❓ Đố vui</h3><div id="v66tQ"></div></section></div>';
  d.hidden = false; V66T.panel = true; v66tBtn(false);
  // ảnh cây nhỏ ở đầu bảng
  try { const c = d.querySelector('.v66tHead canvas'), g = c.getContext('2d'), L = v66tLayers(); g.imageSmoothingEnabled = false; for(const k of ['back', 'body', 'front']) g.drawImage(L[k], 20, 30, 580, 650, 3, 3, 56, 56); } catch(e){}
  let pick = -1, fact = fi;
  const close = () => { d.hidden = true; d.innerHTML = ''; V66T.panel = false; };
  d.querySelector('.v66tX').onclick = close; d.onpointerdown = e => { if(e.target === d) close(); };
  d.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { pick = +b.dataset.w; d.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); d.querySelector('#v66tSend').disabled = false; try { v53cSnd('tap'); } catch(e){} });
  d.querySelector('#v66tSend').onclick = () => {
    if(pick < 0) return; const res = d.querySelector('#v66tRes'), card = d.querySelector('.v66tCard'), f = document.createElement('div'); f.className = 'v66tFly'; f.textContent = v66tSe() === 'xuan' ? '🌸' : v66tSe() === 'thu' ? '🍁' : v66tSe() === 'dong' ? '❄️' : '🍃'; card.appendChild(f); setTimeout(() => f.remove(), 1700);
    s.wish = (s.wish || 0) + 1; let html = '<p>🌳 Cây thần kỳ đã nghe điều ước <b>' + v66tEsc(V66T_WISH[pick]) + '</b>. Hãy cố gắng mỗi ngày để điều ước thành thật nhé!</p>';
    if(s.d !== today){ s.d = today; s.n = (s.n || 0) + 1; const money = 5 + Math.floor(Math.random()*11), exp = 20 + Math.floor(Math.random()*21);
      try { if(typeof PROF !== 'undefined' && PROF) reward(exp, money, 'Quà của Cây thần kỳ', true); } catch(e){}
      html += '<div class="v66tGift">' + (typeof PROF !== 'undefined' && PROF ? '🎁 Quà hôm nay: +$' + money + ' · +' + exp + ' EXP' : '🎁 Đăng nhập để nhận quà mỗi ngày!') + '</div>';
      try { v53cSnd('win'); } catch(e){} }
    else { html += '<div class="v66tGift">🎁 Hôm nay bạn đã nhận quà rồi — mai quay lại nhé!</div>'; try { v53cSnd('chime'); } catch(e){} }
    v66tSave(); res.innerHTML = html; d.querySelector('#v66tSend').disabled = true; };
  const showFact = () => { const F = V66T_FACT[fact]; d.querySelector('#v66tFact').innerHTML = '<p><b>' + v66tEsc(F[0]) + '</b></p><p>' + v66tEsc(F[1]) + '</p>'; s.facts[fact] = 1;
    const Q = d.querySelector('#v66tQ'); Q.innerHTML = '<p>' + v66tEsc(F[2]) + '</p><div class="v66tChips">' + F[3].map((o, i) => '<button type="button" class="v66tC" data-q="' + i + '">' + v66tEsc(o) + '</button>').join('') + '</div><div id="v66tQr"></div>';
    Q.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { if(Q.dataset.done) return; const ok = +b.dataset.q === F[4]; b.classList.add(ok ? 'ok' : 'no');
      if(ok){ Q.dataset.done = 1; let m = '✅ Đúng rồi! Giỏi quá!'; if(s.q !== today){ s.q = today; try { if(typeof PROF !== 'undefined' && PROF){ reward(10, 0, null, true); m += ' +10 EXP'; } } catch(e){} v66tSave(); } Q.querySelector('#v66tQr').innerHTML = '<p>' + m + '</p>'; try { v53cSnd('ok'); } catch(e){} }
      else { Q.querySelector('#v66tQr').innerHTML = '<p>🤔 Chưa đúng, đọc lại phần kiến thức rồi thử lần nữa nhé!</p>'; try { v53cSnd('bad'); } catch(e){} } }); };
  d.querySelector('#v66tNext').onclick = () => { fact = (fact + 1) % V66T_FACT.length; showFact(); };
  showFact();
}
