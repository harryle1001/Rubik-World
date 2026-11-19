// academy/bestiary.js — 📖 BÁCH KHOA SINH VẬT: thẻ thông tin thần thoại thật (nguồn gốc, ý nghĩa) + kiến thức động vật thật tương ứng
// (chim, bò sát, thú, cá). Mở thẻ khi gặp sinh vật (ctx.bestiary.see(id)); xem ở ☰ → 📖 Bách khoa sinh vật hoặc phím K (J là gọi chổi).
// Lưu máy 'academy.bestiary'. Bố cục theo φ: thẻ 233 px, chữ 13/21 px, khoảng cách 8/13 px.
const KEY = 'academy.bestiary';
const E = (icon, name, where, group, myth, real, know) => ({ icon, name, where, group, myth, real, know });
export const CARDS = {
  valley: E('🏔️', 'Thung Lũng Rồng', 'Cạnh Rừng Phép Thuật, đảo Học viện', 'Địa điểm',
    'Truyện cổ khắp thế giới kể rồng sống ở núi cao, hang sâu, thung lũng xa người — nơi chúng canh giữ trứng.',
    'Thung lũng hình lòng chảo ngoài đời thường do sông băng hay núi lửa tạo nên; vách đá dựng là nơi đại bàng, chim ưng làm tổ cho an toàn.',
    'Chim ưng peregrine làm tổ trên vách đá và lao xuống bắt mồi nhanh tới hơn 300 km/h — sinh vật nhanh nhất hành tinh.'),
  fire: E('🔥', 'Rồng Lửa', 'Thung Lũng Rồng', 'Bò sát (tưởng tượng)',
    'Rồng phun lửa xuất hiện trong truyện cổ châu Âu và Bắc Âu. Ở Thung Lũng Rồng, hơi thở ấm của Rồng Lửa chỉ để sưởi tổ trứng.',
    'Rồng Komodo (Indonesia) là thằn lằn lớn nhất thế giới, dài tới 3 m, đánh hơi mồi bằng chiếc lưỡi chẻ đôi.',
    'Bò sát là động vật biến nhiệt: thân nhiệt theo môi trường, nên chúng phơi nắng buổi sáng.'),
  water: E('💧', 'Rồng Nước', 'Thung Lũng Rồng', 'Bò sát (tưởng tượng)',
    'Trong văn hoá Việt và Á Đông, rồng là thần nước: làm mây, gọi mưa cho đồng lúa.',
    'Cá rồng biển lá (biển nam nước Úc) có vây như lá rong để ngụy trang. Giống cá ngựa, con bố giữ trứng tới khi nở.',
    'Khoảng 71% bề mặt Trái Đất là nước, phần lớn là nước mặn ở biển và đại dương.'),
  cloud: E('☁️', 'Rồng Mây', 'Thung Lũng Rồng', 'Bò sát (tưởng tượng)',
    'Tranh cổ Á Đông hay vẽ rồng ẩn hiện trong mây — "rồng mây gặp hội" chỉ dịp may lớn.',
    'Thằn lằn bay (chi Draco) sống trong rừng Việt Nam: xoè xương sườn dài có màng da để lượn xa vài chục mét giữa các cây.',
    'Mây là hàng tỉ giọt nước li ti ngưng tụ từ hơi nước; giọt lớn dần rồi rơi xuống thành mưa (vòng tuần hoàn của nước).'),
  rubik: E('🧊', 'Rồng Rubik', 'Thung Lũng Rồng', 'Sinh vật phép thuật',
    'Sinh vật riêng của đảo Rubik: thân ghép từ khối 6 màu, mỗi lần vui lại đổi chỗ các khối như xoay khối Rubik.',
    'Tắc kè hoa đổi màu nhờ lớp tế bào chứa tinh thể nano phản chiếu ánh sáng khác nhau khi giãn ra hay co lại.',
    'Khối Rubik 3×3 có hơn 43 tỉ tỉ cách xáo trộn, nhưng luôn giải được trong tối đa 20 bước xoay.'),
  viet: E('🐉', 'Rồng Ngọc (rồng Việt)', 'Thung Lũng Rồng', 'Thần thoại Việt Nam',
    'Rồng Việt thời Lý thân dài uốn hình sin, không cánh, miệng ngậm ngọc. Người Việt tự hào là "con Rồng cháu Tiên".',
    'Rắn không chân nhưng bò nhanh nhờ uốn thân chữ S và vảy bụng bám đất; rắn "nghe" rung động của mặt đất qua xương hàm.',
    'Rồng (Thìn) là con giáp thứ 5 trong 12 con giáp, và là con vật duy nhất trong đó không có thật.'),
  pegasus: E('🐴', 'Ngựa có cánh (Pegasus)', 'Bãi Thú Bay, cửa Thung Lũng Rồng', 'Thần thoại Hy Lạp',
    'Pegasus là ngựa trắng có cánh trong thần thoại Hy Lạp; chuyện kể nơi móng nó gõ xuống, dòng suối Hippocrene trào lên. Tên chòm sao Phi Mã đặt theo Pegasus.',
    'Ngựa thật là thú ăn cỏ, ngủ được khi đứng nhờ khớp chân "khoá" lại; hai mắt hai bên đầu giúp nhìn gần như quanh mình.',
    'Chòm sao Phi Mã (Pegasus) có "Hình vuông lớn" 4 ngôi sao, dễ thấy trên bầu trời mùa thu.'),
  chimlac: E('🕊️', 'Chim Lạc khổng lồ', 'Bãi Thú Bay, cửa Thung Lũng Rồng', 'Biểu tượng Đông Sơn',
    'Chim Lạc mỏ dài, đuôi dài được khắc bay quanh ngôi sao giữa mặt trống đồng Đông Sơn — biểu tượng của người Lạc Việt hơn 2.000 năm trước.',
    'Nhiều nhà khoa học cho rằng chim Lạc phỏng theo loài chim nước như cò, diệc: chân cao, mỏ dài để bắt cá, tôm.',
    'Chim bay đội hình chữ V để tiết kiệm sức: con sau đón luồng khí nâng từ đầu cánh con trước.'),
  phoenix: E('🔥', 'Phượng Hoàng', 'Bãi Thú Bay · Đền Tri Thức (đảo chính)', 'Tứ linh Việt Nam',
    'Phượng (Phụng) đứng trong Tứ linh Long – Lân – Quy – Phụng, tượng trưng cho điều tốt lành, hoà bình. Sách cổ kể phượng chỉ ăn hạt trúc, uống suối ngọt.',
    'Chim trĩ và công — những loài chim có đuôi dài rực rỡ — được cho là gợi cảm hứng vẽ hình phượng.',
    'Ngày nay chỉ chim mới có lông vũ; lông giúp bay, giữ ấm và khoe màu để tìm bạn.'),
  dragon: E('🐉', 'Rồng Lửa lớn', 'Bãi Thú Bay, cửa Thung Lũng Rồng', 'Bò sát (tưởng tượng)',
    '"Chị cả" hiền hậu của Thung Lũng Rồng, đôi cánh rộng chở được cả một bạn nhỏ bay quanh lâu đài.',
    'Loài bay lớn nhất từng sống là thằn lằn bay Quetzalcoatlus (cách đây 68 triệu năm) — sải cánh khoảng 10–11 m, ngang một máy bay nhỏ.',
    'Thằn lằn bay (pterosaur) không phải khủng long, và cánh của chúng là màng da căng từ một ngón tay rất dài.'),
};
const ORDER = Object.keys(CARDS);

export function createBestiary(ctx) {
  let seen; try { seen = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { seen = new Set(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...seen])); } catch (e) {} };
  const css = document.createElement('style');
  css.textContent = `#bestiary{position:fixed;inset:0;z-index:60;background:rgba(18,14,28,.72);display:flex;align-items:center;justify-content:center;padding:13px;box-sizing:border-box}
#bestiary[hidden]{display:none}#bestiary .bx{background:#fff8ec;color:#2a2233;border-radius:21px;max-width:610px;width:100%;max-height:88vh;overflow:auto;padding:13px 21px 21px;box-shadow:0 8px 34px rgba(0,0,0,.35);font:13px/1.618 system-ui}
#bestiary h3{margin:8px 0 13px;font-size:21px}#bestiary .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(144px,1fr));gap:8px}
#bestiary .c{border:0;border-radius:13px;padding:8px;background:#f1e6d2;text-align:left;font:inherit;color:inherit;cursor:pointer}#bestiary .c b{display:block;font-size:14px}
#bestiary .c i{font-style:normal;font-size:34px;line-height:1.3}#bestiary .c.lk{opacity:.55}#bestiary .d p{margin:8px 0}#bestiary .tag{display:inline-block;background:#2a2233;color:#ffe3a0;border-radius:8px;padding:0 8px;font-size:12px}
#bestiary .x{float:right;border:0;background:#2a2233;color:#fff;border-radius:13px;padding:5px 13px;font:inherit;cursor:pointer}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'bestiary'; el.hidden = true; document.body.appendChild(el);
  const close = () => { el.hidden = true; document.body.classList.remove('rs-modal'); };
  function grid() {
    el.innerHTML = `<div class="bx"><button class="x" data-x>Đóng</button><h3>📖 Bách khoa sinh vật · ${seen.size}/${ORDER.length}</h3><div class="gr">${ORDER.map(id => { const C = CARDS[id], s = seen.has(id);
      return `<button class="c${s ? '' : ' lk'}" data-id="${id}"><i>${s ? C.icon : '❓'}</i><b>${s ? C.name : 'Chưa gặp'}</b><small>${s ? C.group : '📍 ' + C.where}</small></button>`; }).join('')}</div></div>`;
  }
  function card(id) {
    const C = CARDS[id];
    el.innerHTML = `<div class="bx d"><button class="x" data-g>← Danh sách</button><h3>${C.icon} ${C.name}</h3><span class="tag">${C.group}</span> <small>📍 ${C.where}</small>
      <p>📜 <b>Thần thoại / văn hoá:</b> ${C.myth}</p><p>🔬 <b>Động vật thật:</b> ${C.real}</p><p>💡 <b>Em có biết?</b> ${C.know}</p></div>`;
  }
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) { if (e.target === el) close(); return; }
    if (b.dataset.x !== undefined) close(); else if (b.dataset.g !== undefined) grid();
    else if (b.dataset.id) { if (seen.has(b.dataset.id)) card(b.dataset.id); else ctx.toast(`❓ Chưa gặp — hãy tìm ở <b>${CARDS[b.dataset.id].where}</b>.`, 2600); }
  });
  function open(id) { if (id && seen.has(id)) card(id); else grid(); el.hidden = false; document.body.classList.add('rs-modal'); ctx.sfx && ctx.sfx('ui'); }
  function see(id) {
    if (!CARDS[id] || seen.has(id)) return; seen.add(id); save();
    setTimeout(() => ctx.toast(`📖 Thẻ mới trong <b>Bách khoa sinh vật</b> (${seen.size}/${ORDER.length}): ${CARDS[id].icon} <b>${CARDS[id].name}</b><br><small>Mở ở ☰ → 📖 hoặc phím <b>J</b>.</small>`, 4200), 2600);
  }
  // nút trong menu ☰
  { const menu = document.getElementById('moreMenu'); if (menu) { const b = document.createElement('button'); b.id = 'bBestiary'; b.textContent = '📖 Bách khoa sinh vật'; b.onclick = () => open(); menu.appendChild(b); } }
  addEventListener('keydown', e => {
    if (e.repeat || e.target instanceof HTMLInputElement) return;
    if (e.code === 'KeyK') { if (el.hidden) { if (!document.body.classList.contains('rs-modal')) open(); } else close(); }
    else if (e.code === 'Escape' && !el.hidden) close();
  });
  return { see, open, close, seen, CARDS };
}
