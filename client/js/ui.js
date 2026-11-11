// HTML overlays: modal panels (shop, garden, chess, telescope, piano...), toast, inventory, map.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const UI = {
  open:false, onClose:null,
  modal(title, html, onClose){ $('mTitle').textContent = title; $('mBody').innerHTML = html; $('modal').hidden = false; UI.open = true; UI.onClose = onClose || null; },
  close(){ $('modal').hidden = true; UI.open = false; $('mBody').innerHTML = ''; const f = UI.onClose; UI.onClose = null; if(f) f(); },
  toast(t){ const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(UI._tt); UI._tt = setTimeout(() => el.hidden = true, 2600); },
  prompt(t){ const el = $('prompt'); if(!t){ el.hidden = true; return; } el.textContent = 'E · ' + t; el.hidden = false; },
  me(m){ $('hName').textContent = m.name; $('hCoins').textContent = '💰 ' + m.coins + ' xu · ⭐ ' + m.score; },
  zone(n){ $('hZone').textContent = '📍 ' + n; },
  board(list){ $('lb').innerHTML = list.map(r => `<li class="${r.online ? 'on' : ''}" data-zone="${r.zone ? esc(r.zone) : ''}" data-name="${esc(r.name)}" title="${r.online ? 'Bấm để xem đang ở đâu' : 'Đang ngoại tuyến'}">${esc(r.name)} · ${r.score}</li>`).join(''); },
  chat(m){ const el = $('chatLog'); const d = document.createElement('div'); if(m.sys){ d.className = 'sys'; d.textContent = m.text; } else d.innerHTML = `<b>${esc(m.name)}</b> <small>(${esc(m.zone)})</small>: ${esc(m.text)}`; el.appendChild(d); while(el.children.length > 80) el.firstChild.remove(); el.scrollTop = el.scrollHeight; },

  // ---------- lessons ----------
  lesson(){
    const L = [
      ['Đức Phật dạy', 'Hãy tự mình thắp đuốc lên mà đi. Học là để hiểu, không phải để hơn ai.'],
      ['Chúa Jesus dạy', 'Hãy yêu thương người lân cận như chính mình. Giúp bạn mới là bài học đẹp nhất.'],
      ['Ông bà ta dạy', 'Có công mài sắt, có ngày nên kim. Mỗi ngày tiến bộ một chút là đủ.']];
    const q = [['Một khối Rubik 3×3 có bao nhiêu mặt?', ['4', '6', '8', '9'], 1], ['Quân cờ nào đi hình chữ L?', ['Xe', 'Tượng', 'Mã', 'Hậu'], 2], ['Hành tinh lớn nhất hệ Mặt Trời?', ['Sao Thổ', 'Trái Đất', 'Sao Mộc', 'Sao Hải Vương'], 2]][Math.floor(Math.random()*3)];
    UI.modal('Bài giảng của cô giáo', L.map(([a, b]) => `<p><b style="color:var(--y)">${a}:</b> ${b}</p>`).join('') + `<hr><p><b>Câu hỏi nhanh:</b> ${q[0]}</p><div class="row">${q[1].map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div><p id="qRes" class="hint"></p>`);
    $('mBody').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const ok = +b.dataset.i === q[2]; $('qRes').textContent = ok ? 'Chính xác! Giỏi lắm.' : 'Chưa đúng, thử lại nhé. Sai cũng là cách để học.'; if(ok) NET.reward('lesson', 'Trả lời đúng bài giảng'); });
  },

  // ---------- telescope: the whole solar system ----------
  telescope(){
    const P = [['Sao Thủy', '#b0a89c', 3, 'Gần Mặt Trời nhất, một năm chỉ 88 ngày.'], ['Sao Kim', '#e8c27a', 5, 'Nóng nhất hệ Mặt Trời (~465°C) do khí CO₂ dày.'], ['Trái Đất', '#3d7bff', 5.4, 'Ngôi nhà của chúng ta, có nước lỏng và sự sống.'], ['Sao Hỏa', '#d65a35', 4, 'Hành tinh đỏ, có núi lửa Olympus cao nhất hệ.'],
      ['Sao Mộc', '#d9a066', 12, 'Lớn nhất, có Vết Đỏ Lớn là cơn bão khổng lồ.'], ['Sao Thổ', '#e6cf8f', 10, 'Nổi tiếng với vành đai băng đá tuyệt đẹp.'], ['Sao Thiên Vương', '#8fd3e0', 7, 'Quay nghiêng gần 98°, như lăn trên quỹ đạo.'], ['Sao Hải Vương', '#3f5fd6', 7, 'Gió mạnh nhất hệ, tới 2.100 km/h.']];
    UI.modal('Kính viễn vọng · Hệ Mặt Trời', `<canvas id="tsc" class="big" width="900" height="520"></canvas><p id="tInfo" class="hint">Bấm vào một hành tinh để phóng to và tìm hiểu. Đã ngắm: <b id="tCnt">0</b>/8</p>`, () => cancelAnimationFrame(raf));
    const cv = $('tsc'), c = cv.getContext('2d'), seen = new Set(); let raf, t = 0, focus = -1;
    const stars = Array.from({length:200}, () => [Math.random()*900, Math.random()*520, Math.random()*1.5]);
    const pos = i => { const r = 60 + i*48, a = t*(.9/Math.sqrt(i + 1)) + i*1.3; return [450 + Math.cos(a)*r, 260 + Math.sin(a)*r*.42]; };
    const draw = () => { t += .01; c.fillStyle = '#02030a'; c.fillRect(0, 0, 900, 520); stars.forEach(([x, y, r]) => { c.fillStyle = `rgba(255,255,255,${.4 + .6*Math.abs(Math.sin(t*2 + x))})`; c.fillRect(x, y, r, r); });
      if(focus >= 0){ const [n, col, , info] = P[focus]; const g = c.createRadialGradient(400, 230, 20, 450, 260, 170); g.addColorStop(0, shadeHex(col, .4)); g.addColorStop(1, shadeHex(col, -.5)); c.fillStyle = g; c.beginPath(); c.arc(450, 260, 160, 0, 7); c.fill();
        if(focus === 5){ c.strokeStyle = 'rgba(230,207,143,.8)'; c.lineWidth = 14; c.beginPath(); c.ellipse(450, 260, 280, 60, -.2, 0, 7); c.stroke(); }
        if(focus === 4){ c.fillStyle = '#b5523b'; c.beginPath(); c.ellipse(500, 300, 34, 18, 0, 0, 7); c.fill(); for(let k=0;k<6;k++){ c.fillStyle = 'rgba(120,70,30,.25)'; c.fillRect(300, 150 + k*40, 300, 10); } }
        if(focus === 2){ c.fillStyle = '#2fbf71'; [[400, 220, 50, 30], [500, 300, 40, 60], [430, 330, 30, 20]].forEach(([x, y, w, h]) => { c.beginPath(); c.ellipse(x, y, w, h, .3, 0, 7); c.fill(); }); }
        c.fillStyle = '#fff'; c.font = 'bold 26px Segoe UI'; c.fillText(n, 20, 40); c.font = '16px Segoe UI'; c.fillText(info, 20, 70); c.fillText('Bấm để quay lại toàn cảnh', 20, 500); }
      else { const g = c.createRadialGradient(450, 260, 4, 450, 260, 46); g.addColorStop(0, '#fff8c4'); g.addColorStop(.5, '#ffb300'); g.addColorStop(1, 'rgba(255,120,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(450, 260, 46, 0, 7); c.fill();
        P.forEach((p, i) => { const r = 60 + i*48; c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(450, 260, r, r*.42, 0, 0, 7); c.stroke(); const [x, y] = pos(i); c.fillStyle = p[1]; c.beginPath(); c.arc(x, y, p[2], 0, 7); c.fill(); if(i === 5){ c.strokeStyle = '#e6cf8f'; c.beginPath(); c.ellipse(x, y, 18, 5, -.2, 0, 7); c.stroke(); } c.fillStyle = seen.has(i) ? '#ffd23f' : '#cfd8ff'; c.font = '12px Segoe UI'; c.fillText(p[0], x + 8, y - 8); }); }
      raf = requestAnimationFrame(draw); };
    cv.onclick = e => { const b = cv.getBoundingClientRect(), x = (e.clientX - b.left)*900/b.width, y = (e.clientY - b.top)*520/b.height; if(focus >= 0){ focus = -1; return; }
      let best = -1, bd = 30; P.forEach((p, i) => { const [px, py] = pos(i), dd = Math.hypot(px - x, py - y); if(dd < bd){ bd = dd; best = i; } }); if(best < 0) return; focus = best; seen.add(best); $('tCnt').textContent = seen.size; if(seen.size === 8){ NET.reward('planet', 'Ngắm đủ 8 hành tinh'); UI.toast('Bạn đã ngắm đủ 8 hành tinh!'); } };
    draw();
  },

  // ---------- talent classes ----------
  piano(){
    const notes = [['C', 261.6], ['D', 293.7], ['E', 329.6], ['F', 349.2], ['G', 392], ['A', 440], ['B', 493.9], ['C²', 523.3], ['D²', 587.3], ['E²', 659.3]], keys = 'asdfghjkl;';
    let played = 0;
    UI.modal('Lớp đàn piano', `<p class="hint">Bấm phím hoặc gõ A S D F G H J K L ;. Thử bài "Kìa con bướm vàng": C D E C · C D E C · E F G</p><div class="piano">${notes.map((n, i) => `<div class="w" data-i="${i}">${n[0]}<br>${keys[i].toUpperCase()}</div>`).join('')}</div>`, () => document.removeEventListener('keydown', kh));
    const play = i => { Snd.tone(notes[i][1], .8, .25); const el = $('mBody').querySelector(`[data-i="${i}"]`); if(el){ el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 160); } if(++played === 16) NET.reward('music', 'Chơi đàn piano'); };
    $('mBody').querySelectorAll('.w').forEach(k => k.onpointerdown = () => play(+k.dataset.i));
    const kh = e => { const i = keys.indexOf(e.key.toLowerCase()); if(i >= 0){ e.preventDefault(); play(i); } }; document.addEventListener('keydown', kh);
  },
  paint(){
    UI.modal('Lớp hội họa', `<div class="row" id="pCols"></div><canvas id="pc" class="big" width="900" height="460" style="background:#fff;touch-action:none"></canvas><div class="row" style="margin-top:8px"><button id="pClr">Xóa</button><button id="pDone" class="primary">Treo tranh lên tường</button></div>`);
    const cv = $('pc'), c = cv.getContext('2d'); let col = '#ef4b4b', down = false, last = null, strokes = 0;
    ['#ef4b4b','#ff8a2b','#ffd23f','#2fbf71','#3d7bff','#b06bff','#5d4037','#111111'].forEach(k => { const b = document.createElement('button'); b.style.background = k; b.style.width = '36px'; b.setAttribute('aria-label', 'Màu ' + k); b.onclick = () => col = k; $('pCols').appendChild(b); });
    const pt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left)*900/b.width, (e.clientY - b.top)*460/b.height]; };
    cv.onpointerdown = e => { down = true; last = pt(e); strokes++; }; cv.onpointerup = cv.onpointerleave = () => down = false;
    cv.onpointermove = e => { if(!down) return; const p = pt(e); c.strokeStyle = col; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(...last); c.lineTo(...p); c.stroke(); last = p; };
    $('pClr').onclick = () => c.clearRect(0, 0, 900, 460);
    $('pDone').onclick = () => { if(strokes < 5){ UI.toast('Vẽ thêm vài nét nữa nhé!'); return; } NET.reward('paint', 'Hoàn thành bức tranh'); UI.close(); };
  },
  rubikTips(){
    const S = [['Bước 1 · Dấu thập trắng', "Đưa 4 cạnh trắng lên mặt trên sao cho màu bên cạnh khớp tâm. Mẹo: F F đưa cạnh xuống dưới rồi lật lên."], ['Bước 2 · Góc trắng', "Đặt góc dưới vị trí đích, lặp R U R' U' đến khi góc đúng."], ['Bước 3 · Tầng giữa', "Phải: U R U' R' U' F' U F · Trái: U' L' U L U F U' F'"],
      ['Bước 4 · Dấu thập vàng', "F R U R' U' F' (lặp từ chấm → chữ L → thanh → dấu thập)."], ['Bước 5 · Mặt vàng', "R U R' U R U2 R' (Sune) cho đến khi cả mặt vàng."], ['Bước 6 · Hoán vị góc & cạnh', "Góc: U R U' L' U R' U' L · Cạnh: R U' R U R U R U' R' U' R2"]];
    UI.modal('Rubik 3×3 cho người mới', S.map(([a, b], i) => `<p><label style="justify-content:flex-start"><input type="checkbox" data-i="${i}"> <b>${a}</b></label><code>${esc(b)}</code></p>`).join('') + '<p class="hint">Đánh dấu khi bạn làm xong từng bước. "Chậm mà chắc" là cách thầy giỏi nhất dạy.</p>');
    $('mBody').querySelectorAll('input').forEach(x => x.onchange = () => { if([...$('mBody').querySelectorAll('input')].every(y => y.checked)){ NET.reward('rubik', 'Hoàn thành 6 bước Rubik'); UI.toast('Bạn đã hoàn thành cả 6 bước!'); } });
  },
  punch(scene){
    const now = Date.now(); scene.combo = now - (scene.lastPunch || 0) < 900 ? (scene.combo || 0) + 1 : 1; scene.lastPunch = now;
    if(scene.bag) scene.tweens.add({targets:scene.bag, angle:{from:(scene.me.x < scene.bag.x ? 14 : -14), to:0}, duration:400, ease:'Elastic.easeOut'});
    Snd.noise(.12, 600, .5); scene.cameras.main.shake(80, .003);
    UI.toast(`Combo x${scene.combo}${scene.combo >= 10 ? ' · Tuyệt vời!' : ''}`); if(scene.combo === 10) NET.reward('gym', 'Combo 10 cú đấm');
  },

  // ---------- shop with colour picker on the product ----------
  shop(kind){
    const items = SHARED.CATALOG.filter(c => c.kind === kind), title = {bike:'Xe đạp: mỗi mẫu một kiểu dáng riêng', chess:'Bộ cờ vua', hat:'Thời trang', seed:'Hạt giống'}[kind];
    UI.modal(title, `<p class="hint">Chọn màu ngay trên sản phẩm rồi bấm Mua. Bạn đang có <b>${G.me.coins}</b> xu.</p><div class="grid">${items.map(it => `<div class="item"><canvas width="180" height="110" data-id="${it.id}"></canvas><b>${it.name}</b><span class="price">${it.price} xu${kind === 'seed' ? ' / 5 hạt' : ''}</span>${kind === 'seed' ? `<span class="hint">Lớn sau ${SHARED.CROPS[it.crop].grow}s · bán ${SHARED.CROPS[it.crop].sell} xu</span>` : `<label>Màu<input type="color" value="${['#3d7bff','#ef4b4b','#2fbf71','#ffd23f','#b06bff','#ff8a2b'][it.price % 6]}" data-c="${it.id}"></label>`}<button class="primary" data-b="${it.id}">Mua</button></div>`).join('')}</div>`);
    const body = $('mBody'), paint = id => { const cv = body.querySelector(`canvas[data-id="${id}"]`), c = cv.getContext('2d'), it = items.find(i => i.id === id), inp = body.querySelector(`[data-c="${id}"]`), col = inp ? inp.value : '#fff'; c.clearRect(0, 0, 180, 110); UI.preview(CG(c, 90, 96, 3), it, col); };
    items.forEach(it => { paint(it.id); const inp = body.querySelector(`[data-c="${it.id}"]`); if(inp) inp.oninput = () => paint(it.id); });
    body.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const inp = body.querySelector(`[data-c="${b.dataset.b}"]`); NET.socket.emit('buy', {id:b.dataset.b, color:inp ? inp.value : '#ffffff'}); });
  },
  preview(d, it, col){
    if(it.kind === 'bike') drawBike(d, it.design, col, 0);
    else if(it.kind === 'hat'){ drawAvatar(d, G.me.style, {dir:1, hat:it.id + '|' + col}); }
    else if(it.kind === 'chess'){ const glass = it.design === 'glass'; for(let a=0;a<6;a++) for(let b=0;b<3;b++) d.rect((a + b) % 2 ? (glass ? '#90caf9' : '#8d6e4a') : (glass ? '#e3f2fd' : '#e8d4b0'), -18 + a*6, -24 + b*6, 6, 6, glass ? .8 : 1); d.rect(col, -14, -30, 3, 6); d.circ(col, -12.5, -31, 2); d.rect(shadeHex(col, -.6), 8, -30, 3, 6); d.tri(shadeHex(col, -.6), 7, -30, 12, -30, 9.5, -35); }
    else { const C = SHARED.CROPS[it.crop]; d.rect('#6d4c2e', -16, -6, 32, 6); d.line('#2e7d32', 0, -6, 0, -22, 1.5); d.ell('#43a047', -4, -16, 4, 2); d.ell('#43a047', 4, -19, 4, 2); d.circ(C.color, 0, -24, 4); }
  },

  // ---------- garden plots ----------
  garden(i){
    const pl = G.plots[i]; if(!pl) return; const mine = pl.owner === G.me.name, seeds = SHARED.CATALOG.filter(c => c.kind === 'seed' && G.me.inv[c.id] > 0);
    let html = `<p>Chủ: <b>${pl.owner ? esc(pl.owner) : 'chưa có ai'}</b></p>`;
    if(!pl.owner) html += `<button class="primary" data-a="buy">Mua mảnh vườn (${SHARED.PLOT_PRICE} xu)</button>`;
    else if(mine && !pl.crop) html += seeds.length ? `<p>Gieo hạt:</p><div class="row">${seeds.map(s => `<button data-a="plant" data-s="${s.id}">${s.name} (${G.me.inv[s.id]})</button>`).join('')}</div>` : `<p class="hint">Bạn chưa có hạt giống. Mua ở Trung tâm mua sắm → quầy Hạt giống.</p>`;
    else if(pl.crop){ const C = SHARED.CROPS[pl.crop], need = C.grow*1000/(1 + pl.water*.5), pct = Math.min(100, Math.round((Date.now() - pl.plantedAt)/need*100));
      html += `<p>Đang trồng <b>${C.name}</b> · tiến độ ${pct}% · nước ${'💧'.repeat(pl.water)}${'·'.repeat(3 - pl.water)}</p>`; if(mine) html += `<div class="row"><button data-a="water">Tưới nước (lớn nhanh hơn)</button><button class="primary" data-a="harvest" ${pct < 100 ? 'disabled' : ''}>Thu hoạch (+${C.sell} xu)</button></div>`; }
    UI.modal('Mảnh vườn số ' + (i + 1), html);
    $('mBody').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { NET.socket.emit('garden', {plot:i, act:b.dataset.a, seed:b.dataset.s}); if(b.dataset.a === 'water') Snd.noise(.4, 2000, .2); setTimeout(() => UI.open && $('mTitle').textContent.endsWith(' ' + (i + 1)) && UI.garden(i), 250); });
  },

  // ---------- inventory & equip, chess invites anywhere ----------
  inventory(){
    const inv = G.me.inv, eq = G.me.equip || {}, keys = Object.keys(inv).filter(k => inv[k] > 0);
    const name = k => { const [id, col] = k.split('|'); const it = SHARED.CATALOG.find(c => c.id === id); return it ? {it, col} : null; };
    const rows = keys.map(k => { const n = name(k); if(!n) return ''; const {it, col} = n; const on = eq[it.kind] === k;
      return `<div class="item"><canvas width="180" height="90" data-k="${esc(k)}"></canvas><b>${it.name} ${inv[k] > 1 ? '×' + inv[k] : ''}</b>${col ? `<span class="hint">Màu <span style="display:inline-block;width:14px;height:14px;background:${col};border-radius:3px;vertical-align:middle"></span></span>` : ''}${it.kind === 'bike' || it.kind === 'hat' ? `<button data-e="${esc(k)}" data-kind="${it.kind}">${on ? 'Tháo ra' : 'Trang bị'}</button>` : ''}</div>`; }).join('');
    const hasChess = keys.some(k => k.startsWith('chess_')), others = G.scene ? [...G.scene.others.values()] : [];
    const ch = hasChess ? `<h3>Mời thách đấu cờ vua</h3>${others.length ? `<div class="row">${others.map(o => `<button data-ch="${o.id}">♞ ${esc(o.name)}</button>`).join('')}</div>` : '<p class="hint">Chưa có ai cùng khu vực. Bạn có thể mời bất kỳ ai đứng cùng khu với bạn, ở đâu cũng được.</p>'}` : '<p class="hint">Mua một bộ cờ vua để mời người khác thách đấu ở bất kỳ đâu trên bản đồ.</p>';
    UI.modal('Túi đồ', (rows ? `<div class="grid">${rows}</div>` : '<p>Túi đồ trống.</p>') + ch);
    const body = $('mBody'); body.querySelectorAll('canvas[data-k]').forEach(cv => { const n = name(cv.dataset.k); UI.preview(CG(cv.getContext('2d'), 90, 80, 2.4), n.it, n.col || '#fff'); });
    body.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const on = (G.me.equip || {})[b.dataset.kind] === b.dataset.e; NET.socket.emit('equip', {kind:b.dataset.kind, key:on ? null : b.dataset.e}); setTimeout(UI.inventory, 200); });
    body.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { NET.socket.emit('challenge', {to:b.dataset.ch}); UI.toast('Đã gửi lời mời thách đấu!'); UI.close(); });
  },
  map(){
    const Z = SHARED.ZONES, hub = Z.duongchinh;
    UI.modal('Bản đồ Trường Rubik', `<canvas id="mapc" class="big" width="900" height="420"></canvas><p class="hint">Mỗi khu là một trang riêng. Đi theo bảng chỉ dẫn và vùng sáng màu vàng để chuyển khu.</p>`);
    const c = $('mapc').getContext('2d'); c.fillStyle = '#4fa3e0'; c.fillRect(0, 0, 900, 140); c.fillStyle = '#7cb342'; c.fillRect(0, 140, 900, 140); c.fillStyle = '#01579b'; c.fillRect(0, 280, 900, 140);
    c.fillStyle = '#9e9e9e'; c.fillRect(20, 200, 860, 24); c.font = '13px Segoe UI'; c.textAlign = 'center';
    hub.exits.forEach(e => { const x = 20 + (e.x + e.w/2)/hub.w*860, up = e.y < 700, side = e.x > 4000; const bx = side ? 860 : x, by = side ? 212 : up ? 90 : 320; c.strokeStyle = '#d7ccc8'; c.lineWidth = 6; c.beginPath(); c.moveTo(side ? 860 : x, 212); c.lineTo(bx, by); c.stroke();
      c.fillStyle = e.to === G.zone ? '#ffd23f' : '#fff8e1'; c.fillRect(bx - 62, by - 14, 124, 26); c.fillStyle = '#3e2723'; c.fillText(Z[e.to].name, bx, by + 4); });
    c.fillStyle = G.zone === 'duongchinh' ? '#ffd23f' : '#fff'; c.fillText('ĐƯỜNG CHÍNH (bạn đang ở: ' + Z[G.zone].name + ')', 450, 245);
  },

  // ---------- chess: vs computer, or a live match with another player ----------
  chess(scene){
    const others = scene ? [...scene.others.values()] : [];
    UI.modal('Bàn cờ Ikigai', `<p>Chơi với máy hoặc thách đấu người chơi cùng khu.</p><div class="row"><button class="primary" id="cAI">Chơi với máy</button>${others.map(o => `<button data-ch="${o.id}">Thách ${esc(o.name)}</button>`).join('')}</div>`);
    $('cAI').onclick = () => UI.chessGame({ai:true});
    $('mBody').querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { NET.socket.emit('challenge', {to:b.dataset.ch}); UI.toast('Đã gửi lời mời!'); });
  },
  chessGame(o){
    const g = new Chess(), me = o.color || 'w', SYM = {p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚'}; let sel = null, targets = [], over = false;
    UI.chessLive = o.ai ? null : {g, o, render:() => render(), done:() => end()};
    UI.modal(o.ai ? 'Cờ vua với máy' : 'Đấu cờ với ' + o.opp, `<div style="display:flex;gap:14px;flex-wrap:wrap"><div class="cb" id="cb"></div><div><p id="cSt"></p><p class="hint">Bạn cầm quân ${me === 'w' ? 'Trắng' : 'Đen'}. Bấm quân rồi bấm ô đích.</p></div></div>`, () => { UI.chessLive = null; });
    const val = {p:1, n:3, b:3, r:5, q:9, k:0};
    const aiMove = () => { const ms = g.moves({verbose:true}); if(!ms.length) return; let best = [], bs = -1e9; ms.forEach(m => { g.move(m); let s = (m.captured ? val[m.captured]*10 : 0) + (g.in_checkmate() ? 1000 : 0) + (g.in_check() ? 2 : 0) + Math.random(); const rep = g.moves({verbose:true}); let worst = 0; rep.forEach(r => { if(r.captured) worst = Math.max(worst, val[r.captured]*10); }); s -= worst*.8; g.undo(); if(s > bs){ bs = s; best = [m]; } }); g.move(best[0]); };
    const end = () => { if(over) return; over = true; const won = g.in_checkmate() && g.turn() !== me; $('cSt').textContent = g.in_checkmate() ? (won ? 'Chiếu hết! Bạn thắng!' : 'Bạn đã thua, ván sau sẽ tốt hơn.') : 'Hòa cờ.'; if(won){ if(o.ai) NET.reward('chess', 'Thắng máy'); else NET.socket.emit('chessEnd', {won:true}); } };
    const render = () => { const b = g.board(), rows = me === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]; let h = '';
      rows.forEach(r => rows.forEach(cc => { const sq = 'abcdefgh'[cc] + (8 - r), p = b[r][cc]; h += `<button class="${(r + cc) % 2 ? 'd' : 'l'} ${sel === sq ? 's' : ''} ${targets.includes(sq) ? 't' : ''}" data-sq="${sq}" aria-label="${sq}"><span class="${p ? (p.color === 'w' ? 'wp' : 'bp') : ''}">${p ? SYM[p.type] : ''}</span></button>`; }));
      $('cb').innerHTML = h; $('cSt').textContent = over ? $('cSt').textContent : (g.turn() === me ? 'Lượt của bạn' : (o.ai ? 'Máy đang nghĩ…' : 'Chờ đối thủ…')) + (g.in_check() ? ' · Chiếu!' : '');
      $('cb').querySelectorAll('[data-sq]').forEach(bt => bt.onclick = () => click(bt.dataset.sq)); };
    const click = sq => { if(over || g.turn() !== me) return; if(sel && targets.includes(sq)){ const m = g.move({from:sel, to:sq, promotion:'q'}); sel = null; targets = []; if(m){ Snd.tone(220, .1, .2, 'square'); if(!o.ai) NET.socket.emit('chessMove', {to:o.oppId, from:m.from, toSq:m.to, promotion:'q'}); if(g.game_over()) end(); else if(o.ai) setTimeout(() => { aiMove(); if(g.game_over()) end(); render(); }, 450); } render(); return; }
      const p = g.get(sq); if(p && p.color === me){ sel = sq; targets = g.moves({square:sq, verbose:true}).map(m => m.to); } else { sel = null; targets = []; } render(); };
    render();
  },
  remoteChess(m){ const L = UI.chessLive; if(!L) return; L.g.move({from:m.from, to:m.to, promotion:m.promotion || 'q'}); Snd.tone(180, .1, .2, 'square'); if(L.g.game_over()) L.done(); L.render(); },
  invited(d){ const box = document.createElement('div'); box.className = 'card'; Object.assign(box.style, {left:'50%', top:'120px', transform:'translateX(-50%)', zIndex:20}); box.innerHTML = `<p><b>${esc(d.name)}</b> mời bạn đấu cờ vua!</p><div class="row"><button class="primary">Đồng ý</button><button>Từ chối</button></div>`; document.body.appendChild(box);
    const [y, n] = box.querySelectorAll('button'); y.onclick = () => { NET.socket.emit('challengeReply', {to:d.from, ok:true}); box.remove(); }; n.onclick = () => { NET.socket.emit('challengeReply', {to:d.from, ok:false}); box.remove(); }; setTimeout(() => box.remove(), 20000); }
};
