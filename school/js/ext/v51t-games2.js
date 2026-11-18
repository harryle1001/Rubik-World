// ================= v51t · MINI GAME 3: số nhị phân · 4: vẽ pixel theo toạ độ · 5: gõ phím nhanh · 7: an toàn trên mạng =================
// ---------- 3. SỐ NHỊ PHÂN: bật/tắt bóng đèn để tạo số, hoặc tạo màu cho một điểm ảnh ----------
const V51T_BITS = [3, 4, 5, 6, 7, 8];
V51T_GAMES.binary = {icon:'💡', name:'Số nhị phân', en:'Binary Numbers', lv:6, modes:[['🔢', 'Tạo số · Numbers'], ['🎨', 'Tạo màu pixel · Pixel colors']],
  help:['💡 Mỗi bóng đèn là một <b>bit</b>: tắt = 0, bật = 1.', '🔢 Bóng bên phải nhất có giá trị 1, rồi 2, 4, 8… (gấp đôi mỗi bóng).', '👆 Chạm bóng để bật/tắt. Tổng các bóng đang bật phải <b>bằng số mục tiêu</b>.', '🎨 Chế độ màu: mỗi màu Đỏ · Lục · Lam có bit riêng. Bật đúng bit để điểm ảnh ra màu giống mẫu.', '⏱️ Làm 8 câu càng nhanh càng nhiều sao.'],
  start(G){ const S = G.st; S.n = G.mode ? (G.lv <= 3 ? 1 : 2) : V51T_BITS[G.lv - 1]; S.round = 0; S.t = 0; S.miss = 0;
    G.body.innerHTML = '<div class="v51tbin"><div class="v51tbtarget"></div><div class="v51tbulbs"></div><div class="v51tbsum"></div><div class="v51ttip"></div></div>';
    this.next(G); v51tGEvery(G, 100, () => { S.t += .1; this.stat(G); }); },
  stat(G){ const S = G.st; v51tGStat('💡 <b>' + Math.min(8, S.round) + '/8</b> · ⏱️' + S.t.toFixed(1)); },
  next(G){ const S = G.st; S.round++; if(S.round > 8) return this.done(G); const B = G.body;
    if(G.mode){ const n = S.n, lv = (1 << n) - 1; S.bits = new Array(3*n).fill(0); do { S.tg = [0, 0, 0].map(() => Math.floor(Math.random()*(lv + 1))); } while(S.tg.every(v => v === 0));
      const col = v => 'rgb(' + v.map(q => Math.round(q/lv*255)).join(',') + ')'; S.col = col;
      B.querySelector('.v51tbtarget').innerHTML = '<span>🎯 Màu mẫu · <i>Target</i></span><b class="v51tsw" style="background:' + col(S.tg) + '"></b>';
      B.querySelector('.v51ttip').innerHTML = 'Mỗi màu ' + n + ' bit (0–' + lv + '). Bật bit để <b>điểm ảnh</b> giống màu mẫu.';
    } else { const max = (1 << S.n) - 1; let t; do { t = 1 + Math.floor(Math.random()*max); } while(t === S.tg); S.tg = t; S.bits = new Array(S.n).fill(0);
      B.querySelector('.v51tbtarget').innerHTML = '<span>🎯 Số mục tiêu · <i>Target</i></span><b>' + t + '</b>';
      B.querySelector('.v51ttip').innerHTML = 'Giá trị bóng: ' + Array.from({length:S.n}, (_, i) => 1 << (S.n - 1 - i)).join(' · '); }
    this.draw(G); },
  val(G){ const S = G.st; if(G.mode){ const n = S.n; return [0, 1, 2].map(c => { let v = 0; for(let i = 0; i < n; i++) v = v*2 + S.bits[c*n + i]; return v; }); } let v = 0; S.bits.forEach(b => { v = v*2 + b; }); return v; },
  draw(G){ const S = G.st, U = G.body.querySelector('.v51tbulbs'), n = S.n; U.innerHTML = '';
    S.bits.forEach((b, i) => { const ch = G.mode ? Math.floor(i/n) : -1, w = G.mode ? 1 << (n - 1 - i % n) : 1 << (S.n - 1 - i), e = v51tEl('button', 'v51tbulb' + (b ? ' on' : '') + (ch >= 0 ? ' c' + ch : ''), '<i></i><b>' + b + '</b><small>' + w + '</small>'); e.type = 'button';
      e.onclick = () => { if(G.end || G.pause) return; S.bits[i] ^= 1; v51tSnd('tap'); this.draw(G); this.chk(G); }; if(G.mode && i % n === 0 && i){ U.appendChild(v51tEl('span', 'v51tgap', '')); } U.appendChild(e); });
    const v = this.val(G), sum = G.body.querySelector('.v51tbsum');
    sum.innerHTML = G.mode ? '<span>Điểm ảnh của em · <i>Your pixel</i></span><b class="v51tsw" style="background:' + S.col(v) + '"></b><small>R ' + v[0] + ' · G ' + v[1] + ' · B ' + v[2] + '</small>' : '<span>' + S.bits.join('') + '<sub>2</sub> =</span><b>' + v + '</b>'; },
  chk(G){ const S = G.st, v = this.val(G), ok = G.mode ? v.every((q, i) => q === S.tg[i]) : v === S.tg; if(!ok) return; v51tSnd('ok'); G.score += 10; const B = G.body.querySelector('.v51tbsum'); B.classList.add('ok'); setTimeout(() => { B.classList.remove('ok'); if(V51T.game === G && !G.end) this.next(G); }, 450); },
  done(G){ const S = G.st, lim = (G.mode ? 10 : 6) + G.lv*3, st = S.t <= lim ? 3 : S.t <= lim*1.6 ? 2 : 1; v51tGEnd(G, {score:G.score*10 + Math.max(0, Math.round((lim*2 - S.t)*5)), stars:st, title:G.mode ? '🎨 Pha màu nhị phân giỏi!' : '💡 Thành thạo nhị phân!', note:'8 câu trong <b>' + S.t.toFixed(1) + ' giây</b> (3 sao nếu dưới ' + lim + 's). Máy tính lưu mọi thứ bằng 0 và 1!'}); }
};

// ---------- 4. VẼ PIXEL THEO TOẠ ĐỘ: cột chữ (A, B, C…) · hàng số (1, 2, 3…) ----------
// hình mẫu tự vẽ (thiết kế gốc). chữ = màu: r đỏ, y vàng, b lam, g lục, w trắng, o cam, k đen, p hồng, n nâu, c xanh trời
const V51T_PCOL = {r:'#ef4b4b', y:'#ffd23f', b:'#3d7bff', g:'#2fbf71', w:'#f4f4f4', o:'#ff8a2b', k:'#2b2b33', p:'#ff8fc4', n:'#8a5a34', c:'#5ff0ff'};
const V51T_PICS = [
  {n:'Trái tim', en:'Heart', s:6, m:['.rr.rr', 'rrrrrr', 'rrrrrr', '.rrrr.', '..rr..', '......']},
  {n:'Khối Rubik', en:'Rubik cube', s:6, m:['rryybb', 'rryybb', 'ggwwoo', 'ggwwoo', 'bbrryy', 'bbrryy']},
  {n:'Robot', en:'Robot', s:8, m:['...yy...', '..kkkk..', '.kccccck', '.kckkcck', '.kccccck', '..kkkk..', '.bbbbbb.', '.b.bb.b.']},
  {n:'Ngôi nhà', en:'House', s:8, m:['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', '.wwwwww.', '.wbwwbw.', '.wwnnww.', '.wwnnww.']},
  {n:'Con cá', en:'Fish', s:10, m:['..........', '...oo.....', '..oooo..o.', '.oooooooo.', 'ookoooooo.', '.oooooooo.', '..oooo..o.', '...oo.....', '..........', 'cccccccccc']},
  {n:'Tên lửa', en:'Rocket', s:10, m:['....rr....', '...rwwr...', '...wwww...', '...wccw...', '...wccw...', '...wwww...', '..rwwwwr..', '.rr.ww.rr.', '....oo....', '...oyyo...']}
];
const v51tColName = k => ({r:'🔴 đỏ', y:'🟡 vàng', b:'🔵 lam', g:'🟢 lục', w:'⚪ trắng', o:'🟠 cam', k:'⚫ đen', p:'🩷 hồng', n:'🟤 nâu', c:'🩵 xanh trời'})[k] || k;
V51T_GAMES.pixel = {icon:'🎨', name:'Vẽ pixel theo toạ độ', en:'Pixel Grid Art', lv:6, modes:[['📍', 'Theo toạ độ · Coordinates'], ['🖌️', 'Vẽ tự do · Free draw']],
  help:['📍 Mỗi ô có <b>toạ độ</b>: chữ của cột + số của hàng, ví dụ <b>C4</b> = cột C, hàng 4.', '👆 Đọc lệnh ở trên, chạm đúng ô để tô màu.', '🖼️ Tô hết các lệnh sẽ hiện ra một bức tranh bí mật!', '⭐ Ít chạm sai thì nhiều sao.', '🖌️ Chế độ tự do: chọn màu, chạm ô để vẽ, bấm 💾 để lưu tranh.'],
  start(G){ const S = G.st, P = V51T_PICS[G.lv - 1]; S.P = P; S.n = G.mode ? 10 : P.s; S.cells = new Array(S.n*S.n).fill(''); S.miss = 0; S.k = 0; S.cur = 'r';
    S.todo = []; if(!G.mode) P.m.forEach((row, y) => row.split('').forEach((ch, x) => { if(ch !== '.') S.todo.push([x, y, ch]); }));
    S.todo.sort((a, b) => a[2] === b[2] ? (a[1] - b[1] || a[0] - b[0]) : a[2] < b[2] ? -1 : 1);
    G.body.innerHTML = '<div class="v51tpx"><div class="v51tpxi"></div><div class="v51tpxg"></div><div class="v51tpxpal"></div></div>'; this.draw(G); this.stat(G); },
  stat(G){ const S = G.st; v51tGStat(G.mode ? '🖌️ Vẽ tự do' : '📍 <b>' + S.k + '/' + S.todo.length + '</b> · ❌' + S.miss); },
  lab(x, y){ return String.fromCharCode(65 + x) + (y + 1); },
  draw(G){ const S = G.st, n = S.n, grid = G.body.querySelector('.v51tpxg'), I = G.body.querySelector('.v51tpxi'), pal = G.body.querySelector('.v51tpxpal');
    let h = '<i></i>'; for(let x = 0; x < n; x++) h += '<i>' + String.fromCharCode(65 + x) + '</i>';
    for(let y = 0; y < n; y++){ h += '<i>' + (y + 1) + '</i>'; for(let x = 0; x < n; x++){ const c = S.cells[y*n + x]; h += '<button type="button" data-x="' + x + '" data-y="' + y + '"' + (c ? ' style="background:' + V51T_PCOL[c] + '"' : '') + ' aria-label="' + this.lab(x, y) + '"></button>'; } }
    grid.style.setProperty('--n', n + 1); grid.innerHTML = h; grid.querySelectorAll('button').forEach(b => { b.onclick = () => this.tap(G, +b.dataset.x, +b.dataset.y, b); });
    if(G.mode){ I.innerHTML = '🖌️ Chọn màu rồi chạm ô. Chạm lại để xoá.'; pal.innerHTML = Object.keys(V51T_PCOL).map(k => '<button type="button" data-c="' + k + '" class="' + (S.cur === k ? 'on' : '') + '" style="background:' + V51T_PCOL[k] + '" aria-label="' + v51tColName(k) + '"></button>').join('') + '<button type="button" class="v51tbtn v51tsave">💾 Lưu</button>';
      pal.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { S.cur = b.dataset.c; pal.querySelectorAll('[data-c]').forEach(q => q.classList.toggle('on', q === b)); }; });
      pal.querySelector('.v51tsave').onclick = () => { const s = v51tState(); s.art.unshift({n, c:S.cells.map(c => c || '.').join(''), d:v51tToday()}); s.art.length = Math.min(s.art.length, 6); v51tSave(); v51tSnd('win'); v51tSay('💾 Đã lưu tranh vào bộ sưu tập (giữ 6 bức mới nhất).'); };
      return; }
    pal.innerHTML = ''; this.ins(G); },
  ins(G){ const S = G.st, I = G.body.querySelector('.v51tpxi'), t = S.todo[S.k]; if(!t){ I.innerHTML = '🖼️ ' + S.P.n; return; }
    let run = 1; while(S.todo[S.k + run] && S.todo[S.k + run][1] === t[1] && S.todo[S.k + run][2] === t[2] && S.todo[S.k + run][0] === t[0] + run) run++;
    I.innerHTML = 'Tô ô <b>' + this.lab(t[0], t[1]) + '</b>' + (run > 1 ? ' → <b>' + this.lab(t[0] + run - 1, t[1]) + '</b> (' + run + ' ô)' : '') + ' màu <b>' + v51tColName(t[2]) + '</b> <span class="v51tchip" style="background:' + V51T_PCOL[t[2]] + '"></span>'; },
  tap(G, x, y, b){ const S = G.st, n = S.n; if(G.end || G.pause) return;
    if(G.mode){ const i = y*n + x; S.cells[i] = S.cells[i] === S.cur ? '' : S.cur; b.style.background = S.cells[i] ? V51T_PCOL[S.cells[i]] : ''; v51tSnd('tap'); return; }
    const t = S.todo[S.k]; if(!t) return;
    // trong một dải cùng hàng cùng màu, chạm ô nào chưa tô cũng được
    let ok = -1; for(let j = S.k; j < S.todo.length; j++){ const q = S.todo[j]; if(q[1] !== t[1] || q[2] !== t[2] || q[0] !== t[0] + (j - S.k)) break; if(q[0] === x && q[1] === y) { ok = j; break; } }
    if(ok < 0){ S.miss++; v51tSnd('bad'); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 300); this.stat(G); return; }
    const q = S.todo.splice(ok, 1)[0]; S.todo.splice(S.k, 0, q); S.cells[y*n + x] = q[2]; b.style.background = V51T_PCOL[q[2]]; S.k++; v51tSnd('pick'); this.ins(G); this.stat(G);
    if(S.k >= S.todo.length){ const st = S.miss === 0 ? 3 : S.miss <= 3 ? 2 : 1; setTimeout(() => v51tGEnd(G, {score:S.todo.length*5 + Math.max(0, 50 - S.miss*10) + G.lv*10, stars:st, title:'🖼️ ' + S.P.n + ' · ' + S.P.en, note:'Em đã tô ' + S.todo.length + ' ô theo toạ độ, sai ' + S.miss + ' lần. Màn hình máy tính cũng vẽ bằng điểm ảnh (pixel) như vậy!'}), 500); } }
};

// ---------- 5. GÕ PHÍM NHANH: bàn phím ảo, từ Anh – Việt về máy tính ----------
const V51T_WORDS = [
  [['bug', 'con bọ · lỗi'], ['code', 'mã lệnh'], ['loop', 'vòng lặp'], ['byte', 'byte'], ['wifi', 'mạng không dây'], ['data', 'dữ liệu'], ['game', 'trò chơi'], ['file', 'tệp'], ['save', 'lưu'], ['key', 'phím'], ['run', 'chạy'], ['app', 'ứng dụng']],
  [['mouse', 'chuột'], ['robot', 'người máy'], ['pixel', 'điểm ảnh'], ['click', 'bấm chuột'], ['email', 'thư điện tử'], ['input', 'đầu vào'], ['print', 'in'], ['reset', 'đặt lại'], ['cloud', 'đám mây'], ['logic', 'lô-gic'], ['debug', 'tìm lỗi'], ['cable', 'dây cáp']],
  [['screen', 'màn hình'], ['binary', 'nhị phân'], ['coding', 'lập trình'], ['update', 'cập nhật'], ['folder', 'thư mục'], ['delete', 'xoá'], ['memory', 'bộ nhớ'], ['online', 'trực tuyến'], ['camera', 'máy ảnh'], ['repeat', 'lặp lại'], ['sensor', 'cảm biến'], ['laptop', 'máy tính xách tay']],
  [['keyboard', 'bàn phím'], ['computer', 'máy tính'], ['internet', 'mạng internet'], ['password', 'mật khẩu'], ['algorithm', 'thuật toán'], ['download', 'tải về'], ['software', 'phần mềm'], ['hardware', 'phần cứng'], ['website', 'trang web'], ['variable', 'biến số'], ['printer', 'máy in'], ['program', 'chương trình']],
  [['save file', 'lưu tệp'], ['run code', 'chạy mã'], ['fix bug', 'sửa lỗi'], ['turn left', 'quay trái'], ['move forward', 'đi tới'], ['ask an adult', 'hỏi người lớn'], ['stay safe', 'giữ an toàn'], ['log out', 'đăng xuất'], ['be kind', 'tử tế nhé'], ['new robot', 'người máy mới']]
];
// chế độ VI: gõ tiếng Việt không dấu
const V51T_VI = [['may tinh', 'computer'], ['ban phim', 'keyboard'], ['chuot', 'mouse'], ['man hinh', 'screen'], ['lap trinh', 'coding'], ['mat khau', 'password'], ['tim loi', 'debug'], ['vong lap', 'loop'], ['nguoi may', 'robot'], ['du lieu', 'data'], ['diem anh', 'pixel'], ['thu muc', 'folder'], ['tai ve', 'download'], ['an toan', 'safe'], ['nhi phan', 'binary'], ['phan mem', 'software']];
V51T_GAMES.typing = {icon:'⌨️', name:'Gõ phím nhanh', en:'Fast Typing', lv:5, modes:[['🇬🇧', 'Gõ tiếng Anh · English'], ['🇻🇳', 'Gõ tiếng Việt không dấu']],
  help:['⌨️ Nhìn từ ở trên rồi <b>gõ lại</b> bằng bàn phím ảo.', '🇬🇧 Chế độ Anh: thấy nghĩa tiếng Việt, gõ từ tiếng Anh về máy tính.', '🇻🇳 Chế độ Việt: gõ tiếng Việt <b>không dấu</b>, ví dụ "may tinh".', '✅ Gõ đúng hết từ thì sang từ mới. Phím sai sẽ rung đỏ.', '⏱️ Có 60 giây. Gõ được càng nhiều từ càng nhiều sao.'],
  start(G){ const S = G.st; S.time = 60; S.words = 0; S.ok = 0; S.bad = 0; S.cur = null; S.typed = ''; S.goal = [4, 5, 5, 6, 6][G.lv - 1];
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    G.body.innerHTML = '<div class="v51tty"><div class="v51tword"></div><div class="v51ttyped"></div><div class="v51tkb">' + rows.map((r, i) => '<div class="v51tkr">' + r.split('').map(k => '<button type="button" data-k="' + k + '">' + k + '</button>').join('') + (i === 2 ? '<button type="button" data-k="bk" class="wide">⌫</button>' : '') + '</div>').join('') + '<div class="v51tkr"><button type="button" data-k=" " class="space">space · dấu cách</button></div></div></div>';
    G.body.querySelectorAll('.v51tkb button').forEach(b => { b.onpointerdown = e => { e.preventDefault(); this.key(G, b.dataset.k === 'bk' ? 'Backspace' : b.dataset.k, b); }; });
    S.kd = e => { if(V51T.game !== G || G.end || G.pause) return; if(e.key === 'Backspace' || (e.key.length === 1 && /[a-z ]/i.test(e.key))){ e.preventDefault(); this.key(G, e.key.length === 1 ? e.key.toLowerCase() : e.key, G.body.querySelector('[data-k="' + (e.key === ' ' ? ' ' : e.key.toLowerCase()) + '"]')); } };
    addEventListener('keydown', S.kd, true); this.next(G);
    v51tGEvery(G, 100, () => { S.time = Math.max(0, S.time - .1); this.stat(G); if(S.time <= 0) this.done(G); }); },
  stop(G){ if(G.st.kd) removeEventListener('keydown', G.st.kd, true); },
  stat(G){ const S = G.st; v51tGStat('⌨️ <b>' + S.words + '</b> · ⏱️' + Math.ceil(S.time) + ' · ✅' + (S.ok + S.bad ? Math.round(S.ok/(S.ok + S.bad)*100) : 100) + '%'); },
  next(G){ const S = G.st; let w; const pool = G.mode ? V51T_VI.filter(p => p[0].length <= 4 + G.lv*2) : V51T_WORDS[G.lv - 1]; do { w = pool[Math.floor(Math.random()*pool.length)]; } while(S.cur && w[0] === S.cur[0] && pool.length > 1);
    S.cur = w; S.typed = ''; G.body.querySelector('.v51tword').innerHTML = '<small>' + (G.mode ? '🇬🇧 ' + w[1] : '🇻🇳 ' + w[1]) + '</small><b>' + w[0].split('').map(c => '<i>' + (c === ' ' ? '␣' : c) + '</i>').join('') + '</b>'; this.show(G); },
  show(G){ const S = G.st, w = S.cur[0], spans = G.body.querySelectorAll('.v51tword b i'); spans.forEach((s, i) => { s.className = i < S.typed.length ? 'ok' : i === S.typed.length ? 'cur' : ''; }); G.body.querySelector('.v51ttyped').textContent = S.typed + '▏'; },
  key(G, k, btn){ const S = G.st; if(G.end || G.pause || !S.cur) return; const w = S.cur[0];
    if(k === 'Backspace'){ S.typed = S.typed.slice(0, -1); this.show(G); return; }
    if(w[S.typed.length] === k){ S.typed += k; S.ok++; v51tSnd('key'); if(btn){ btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 120); } if(S.typed === w){ S.words++; G.score += w.length*10; v51tSnd('ok'); this.next(G); } else this.show(G); }
    else { S.bad++; v51tSnd('bad'); if(btn){ btn.classList.add('miss'); setTimeout(() => btn.classList.remove('miss'), 220); } }
    this.stat(G); },
  done(G){ const S = G.st, acc = S.ok + S.bad ? S.ok/(S.ok + S.bad) : 1, g = S.goal, st = S.words >= g*2 ? 3 : S.words >= g ? 2 : S.words >= 1 ? 1 : 0;
    v51tGEnd(G, {score:G.score + Math.round(acc*50), stars:st, title:'⌨️ Hết giờ!', note:'Em gõ <b>' + S.words + '</b> từ, chính xác <b>' + Math.round(acc*100) + '%</b>. Mục tiêu: ' + g + ' từ (2 sao) · ' + g*2 + ' từ (3 sao).'}); }
};

// ---------- 7. AN TOÀN TRÊN MẠNG: chọn cách làm đúng (an toàn trẻ em, giọng nhẹ nhàng, tích cực) ----------
const V51T_SAFE = [
  [ // cấp 1: thông tin cá nhân
    {q:'Một người lạ trong game hỏi <b>địa chỉ nhà</b> của em. Em làm gì?', a:['Không trả lời và kể với bố mẹ hoặc thầy cô', 'Nói địa chỉ vì họ có vẻ thân thiện', 'Nói tên trường thay vì địa chỉ'], k:0, e:'Địa chỉ, trường học, số điện thoại là <b>thông tin cá nhân</b>. Chỉ người lớn em tin mới được biết.'},
    {q:'Em có nên đăng ảnh <b>có số nhà và tên đường</b> lên mạng không?', a:['Có, ảnh đẹp mà', 'Không, vì người lạ có thể biết nhà em'], k:1, e:'Ảnh cũng có thể lộ thông tin. Hỏi bố mẹ trước khi đăng nhé.'},
    {q:'Một bạn mới quen trên mạng rủ em <b>gặp mặt riêng</b>. Em nên…', a:['Đi gặp một mình', 'Từ chối và kể ngay với người lớn', 'Giữ bí mật'], k:1, e:'Không bao giờ đi gặp người quen trên mạng một mình. Luôn nói với bố mẹ.'},
    {q:'Thông tin nào <b>được phép</b> chia sẻ trong game?', a:['Biệt danh (nickname) vui', 'Số điện thoại của mẹ', 'Tên thật và lớp học'], k:0, e:'Dùng biệt danh là cách tốt để giữ kín tên thật.'},
    {q:'Ai đó nhắn: "Gửi cho mình ảnh của bạn nhé, giữ bí mật với bố mẹ". Em làm gì?', a:['Gửi ngay', 'Không gửi, kể với bố mẹ hoặc thầy cô', 'Gửi ảnh bạn khác'], k:1, e:'"Giữ bí mật với bố mẹ" là dấu hiệu nguy hiểm. Hãy kể với người lớn ngay.'},
    {q:'Chơi game xong trên máy tính ở thư viện, em nên…', a:['Đăng xuất (log out) tài khoản', 'Để nguyên cho bạn sau chơi tiếp'], k:0, e:'Luôn đăng xuất khi dùng máy chung để người khác không vào tài khoản của em.'}
  ],
  [ // cấp 2: mật khẩu
    {q:'Mật khẩu nào <b>mạnh nhất</b>?', a:['123456', 'tenem2015', 'Ca-Heo-Xanh-27!'], k:2, e:'Mật khẩu mạnh dài, có chữ hoa, chữ thường, số và ký hiệu. Cụm từ vui dễ nhớ mà khó đoán.'},
    {q:'Bạn thân xin <b>mật khẩu</b> game của em. Em nên…', a:['Cho, vì là bạn thân', 'Không cho, mật khẩu chỉ em và bố mẹ biết'], k:1, e:'Mật khẩu giống chìa khoá nhà: không đưa cho ai, kể cả bạn thân.'},
    {q:'Mật khẩu nào <b>dễ bị đoán</b> nhất?', a:['matkhau', 'Tho-Nau-An-Ca-Rot-9', 'Mây!Bay?Cao#3'], k:0, e:'"matkhau", "123456", ngày sinh… là những mật khẩu kẻ xấu thử đầu tiên.'},
    {q:'Một trang web lạ báo "Em trúng thưởng! Nhập mật khẩu để nhận quà". Em làm gì?', a:['Nhập mật khẩu để nhận quà', 'Đóng trang và hỏi người lớn'], k:1, e:'Đây là lừa đảo. Không bao giờ nhập mật khẩu vào trang lạ.'},
    {q:'Em có nên dùng <b>một mật khẩu</b> cho mọi tài khoản?', a:['Có cho dễ nhớ', 'Không, mỗi tài khoản một mật khẩu riêng'], k:1, e:'Nếu một mật khẩu bị lộ, các tài khoản khác vẫn an toàn.'},
    {q:'Nên làm gì để <b>nhớ</b> mật khẩu?', a:['Viết lên bàn học', 'Nhờ bố mẹ giúp ghi lại ở chỗ an toàn', 'Đăng lên mạng'], k:1, e:'Bố mẹ có thể giúp em cất mật khẩu ở nơi an toàn.'}
  ],
  [ // cấp 3: lừa đảo, đường link lạ
    {q:'Tin nhắn: "Bấm vào link này để nhận <b>1000 kim cương miễn phí</b>!" Em làm gì?', a:['Bấm ngay', 'Không bấm, hỏi người lớn', 'Gửi link cho bạn bè'], k:1, e:'Quà "miễn phí" quá hấp dẫn thường là bẫy. Không bấm link lạ.'},
    {q:'Một ứng dụng lạ xin <b>số thẻ ngân hàng</b> của bố mẹ. Em làm gì?', a:['Lấy thẻ của mẹ nhập vào', 'Không nhập, đưa máy cho bố mẹ xem'], k:1, e:'Chỉ người lớn mới quyết định chuyện tiền bạc trên mạng.'},
    {q:'Em thấy một video làm em <b>sợ hãi hoặc khó chịu</b>. Em nên…', a:['Tắt đi và kể với người lớn', 'Xem tiếp một mình', 'Gửi cho bạn xem'], k:0, e:'Em không có lỗi gì cả. Kể với bố mẹ hoặc thầy cô để được giúp.'},
    {q:'Muốn <b>tải</b> một trò chơi mới về máy, em nên…', a:['Tải từ trang lạ cho nhanh', 'Hỏi bố mẹ trước khi tải'], k:1, e:'Trang lạ có thể chứa phần mềm độc hại (virus). Luôn hỏi người lớn.'},
    {q:'Email lạ có <b>tệp đính kèm</b> tên "quà tặng.exe". Em làm gì?', a:['Mở ra xem', 'Không mở, báo người lớn'], k:1, e:'Tệp lạ có thể làm hỏng máy tính. Không mở tệp từ người lạ.'},
    {q:'Một tài khoản giả làm <b>thầy cô</b> nhắn xin mật khẩu. Em làm gì?', a:['Đưa mật khẩu vì là thầy cô', 'Không đưa, hỏi lại trực tiếp thầy cô hoặc bố mẹ'], k:1, e:'Thầy cô thật không bao giờ xin mật khẩu của em.'}
  ],
  [ // cấp 4: tử tế trên mạng, cân bằng thời gian
    {q:'Một bạn bị chê cười trong nhóm chat. Em nên…', a:['Cười theo cho vui', 'Không tham gia, an ủi bạn và kể với người lớn'], k:1, e:'Bắt nạt trên mạng làm bạn buồn thật. Tử tế trên mạng cũng như ngoài đời.'},
    {q:'Trước khi viết bình luận, em nên tự hỏi…', a:['"Lời này có làm ai buồn không?"', '"Lời này có thật ngầu không?"'], k:0, e:'Nghĩ trước khi gõ: nếu là lời em không muốn nghe thì đừng viết.'},
    {q:'Em đã chơi máy tính 2 tiếng liền. Em nên…', a:['Chơi thêm 2 tiếng', 'Nghỉ, vận động, cho mắt nghỉ ngơi'], k:1, e:'Cứ khoảng 20–30 phút hãy nhìn xa cho mắt nghỉ, đứng dậy vận động nhé.'},
    {q:'Bạn gửi em ảnh chế giễu bạn khác. Em làm gì?', a:['Chia sẻ tiếp', 'Không chia sẻ và nói với người lớn'], k:1, e:'Dừng lại ở em: không chia sẻ thứ làm tổn thương người khác.'},
    {q:'Ai đó nhắn tin làm em buồn mãi không thôi. Em có thể…', a:['Chặn (block), lưu tin nhắn và kể với người lớn', 'Giữ bí mật một mình'], k:0, e:'Em luôn có thể nhờ bố mẹ, thầy cô giúp. Chuyện buồn nên được chia sẻ.'},
    {q:'Em thấy thông tin "ăn kẹo thay cơm cho thông minh" trên mạng. Em nên…', a:['Tin ngay', 'Hỏi người lớn, kiểm tra ở nguồn đáng tin'], k:1, e:'Không phải điều gì trên mạng cũng đúng. Hãy kiểm tra với người lớn.'}
  ]
];
V51T_GAMES.safety = {icon:'🛡️', name:'An toàn trên mạng', en:'Online Safety', lv:4,
  help:['🛡️ Đọc tình huống rồi <b>chạm</b> vào cách làm đúng.', '💬 Sau mỗi câu có lời giải thích ngắn.', '👨‍👩‍👧 Nhớ nhé: gặp điều lạ, sợ hay buồn trên mạng thì <b>kể với bố mẹ hoặc thầy cô</b>.', '⭐ Đúng 6/6 câu được 3 sao.'],
  start(G){ const S = G.st; S.Q = V51T_SAFE[G.lv - 1].slice().sort(() => Math.random() - .5); S.i = 0; S.right = 0; G.body.innerHTML = '<div class="v51tsafe"><div class="v51tsq"></div><div class="v51tsa"></div><div class="v51tse"></div></div>'; this.show(G); },
  show(G){ const S = G.st, q = S.Q[S.i]; v51tGStat('🛡️ Câu <b>' + (S.i + 1) + '/' + S.Q.length + '</b> · ✅ ' + S.right); if(!q) return;
    G.body.querySelector('.v51tsq').innerHTML = q.q; G.body.querySelector('.v51tse').innerHTML = ''; const A = G.body.querySelector('.v51tsa'); A.innerHTML = '';
    const ord = q.a.map((t, i) => i).sort(() => Math.random() - .5); ord.forEach(i => { const b = v51tEl('button', 'v51tans', q.a[i]); b.type = 'button'; b.onclick = () => this.pick(G, i, b); A.appendChild(b); }); },
  pick(G, i, b){ const S = G.st, q = S.Q[S.i]; if(S.lock || G.end) return; S.lock = 1; const ok = i === q.k; if(ok){ S.right++; G.score += 20; v51tSnd('ok'); } else v51tSnd('bad');
    G.body.querySelectorAll('.v51tans').forEach(x => { x.disabled = true; if(x.textContent === q.a[q.k]) x.classList.add('ok'); }); if(!ok) b.classList.add('bad');
    const E = G.body.querySelector('.v51tse'); E.innerHTML = (ok ? '✅ <b>Đúng rồi!</b> ' : '💡 <b>Cách đúng là:</b> ' + q.a[q.k] + '. ') + q.e + '<button type="button" class="v51twide">' + (S.i + 1 < S.Q.length ? 'Câu tiếp ▶' : 'Xem kết quả') + '</button>';
    E.querySelector('button').onclick = () => { S.lock = 0; S.i++; if(S.i >= S.Q.length) return this.done(G); this.show(G); }; v51tGStat('🛡️ Câu <b>' + (S.i + 1) + '/' + S.Q.length + '</b> · ✅ ' + S.right); },
  done(G){ const S = G.st, n = S.Q.length, st = S.right >= n ? 3 : S.right >= n - 1 ? 2 : S.right >= Math.ceil(n/2) ? 1 : 0;
    v51tGEnd(G, {score:G.score, stars:st, title:st ? '🛡️ Em là "hiệp sĩ mạng"!' : '🛡️ Cùng ôn lại nhé!', note:'Đúng <b>' + S.right + '/' + n + '</b> câu. Nhớ: gặp điều lạ trên mạng thì <b>hỏi người lớn</b> 👨‍👩‍👧'}); }
};
