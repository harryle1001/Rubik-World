// destiny-ui.js — Phần DỮ LIỆU + GIAO DIỆN của Rừng Thiên Định (zone-destiny.js dựng hình):
//   · tiến độ lưu máy ('island.destiny') và theo TÀI KHOẢN (profile.destiny): đã tìm ra, lời ước, 8 bí mật, 5 bia đá, số lần tĩnh tâm;
//   · bảng "Lời ước & mục tiêu học tập" (kèm Sổ Thiên Định), bài hít thở 1 phút (hít 5 s – thở 8 s, 5 nhịp = 65 s — Fibonacci),
//     màn sương chuyển cảnh (lạc đường / cổng đá), tấm ảnh chữ (atlas) cho bia đá, la bàn, hình khắc.
// Cỡ chữ / bo góc / khoảng cách theo Fibonacci (8 · 13 · 21 · 34), tỷ lệ khung φ.
import * as THREE from 'three';

const KEY = 'island.destiny', PHI = (1 + Math.sqrt(5)) / 2;
export const TITLE = 'Người tìm đường', TITLE2 = 'Người giữ rừng';
export const QUOTES = [
  ['Có chí thì nên.', 'Tục ngữ Việt Nam'],
  ['Học, học nữa, học mãi.', 'V. I. Lê-nin'],
  ['Học hỏi là một việc phải tiếp tục suốt đời.', 'Chủ tịch Hồ Chí Minh'],
  ['Đường đi khó, không khó vì ngăn sông cách núi, mà khó vì lòng người ngại núi e sông.', 'Nguyễn Bá Học'],
  ['Thiên tài là 1 % cảm hứng và 99 % mồ hôi.', 'Thomas Edison'],
];
// 8 bí mật nhỏ (Fibonacci) — id, biểu tượng, tên, điều học được
export const SECRETS = [
  ['lotus', '🪷', 'Đoá sen phát sáng', 'Lá sen không dính nước nhờ hàng triệu gai sáp li ti — gọi là <b>hiệu ứng lá sen</b>, người ta bắt chước để làm áo mưa, kính tự sạch.'],
  ['nest', '🪺', 'Tổ chim trên cành thấp', 'Chim mẹ ấp trứng để giữ ấm khoảng <b>37–38 °C</b>; trứng chim sẻ nở sau chừng 2 tuần.'],
  ['shroom', '🍄', 'Nấm phát quang trong hang', 'Một số loài nấm tự <b>phát sáng xanh</b> trong đêm (phát quang sinh học) để gọi côn trùng tới mang bào tử đi xa.'],
  ['spiral', '🌀', 'Vòng đá Fibonacci', 'Đếm đá mỗi cụm: 1, 1, 2, 3, 5… Mỗi số bằng <b>tổng hai số trước</b>; chia hai số liền nhau sẽ dần ra φ ≈ 1,618.'],
  ['fall', '💦', 'Hốc đá sau màn thác', 'Nước chảy <b>mài mòn đá</b> từng chút một: thác lùi dần về phía thượng nguồn — thác Niagara lùi khoảng 30 cm mỗi năm.'],
  ['tracks', '🦌', 'Dấu chân hươu trắng', 'Hươu trắng không phải loài riêng: nó thiếu sắc tố ở lông (<b>bạch thể</b>), rất hiếm gặp nên xưa được coi là điềm lành.'],
  ['rings', '🪵', 'Vòng năm của gốc cổ thụ', 'Mỗi năm cây thêm <b>một vòng gỗ</b>: vòng rộng là năm mưa thuận, vòng hẹp là năm khô hạn. Đếm vòng sẽ biết tuổi cây.'],
  ['chime', '🎐', 'Chuông gió cổ', 'Ống chuông <b>ngắn kêu cao, dài kêu trầm</b>: âm thanh là dao động — ống ngắn dao động nhanh hơn nên tần số cao hơn.'],
];
export const SIGN = {
  f1: ['NGÃ BA MẶT TRỜI', 'Mặt Trời mọc ở đâu,\nlối đúng ở đó.\nXem la bàn đá dưới chân:\nkim đỏ chỉ hướng BẮC.'],
  f2: ['NGÃ BA RÊU', 'Rêu ưa bóng râm nên mọc dày\nở mặt BẮC thân cây.\nHãy quay lưng về phía rêu\nmà đi.'],
  carve: 'Hình khắc cổ: mũi tên chỉ hướng <b>BẮC</b>, <b>13 chấm đá</b> nổi trên sóng nước, một tấm rèm dây leo và một cái cây toả sáng.<br><small>Dòng chữ mờ: “Khi đêm xuống, hãy theo đom đóm. Vùng đất này không có trên bản đồ.”</small>',
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Tiến độ: máy + tài khoản ----------
export function createDestinyState(ctx) {
  const fresh = () => ({ found: 0, wish: '', wishAt: 0, secrets: {}, steles: {}, breath: 0, clues: {}, owner: null });
  let S = fresh(); try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const prof = () => ctx.account && ctx.account.profile;
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    const p = prof(); if (p) { p.destiny = JSON.parse(JSON.stringify(S)); delete p.destiny.owner; if (S.found) p.titles = Object.assign(p.titles || {}, { pathfinder: S.found }); ctx.account.save(); }
  };
  // đổi tài khoản: tiến độ đi theo tài khoản (gộp với tiến độ đang có nếu cùng người / lần đầu)
  const sync = () => {
    const p = prof(); if (!p) return; const name = ctx.account.name || 'Khách';
    if (S.owner && S.owner !== name) S = fresh();
    const d = p.destiny;
    if (d) { S.found = S.found || d.found || 0; if ((d.wishAt || 0) > S.wishAt) { S.wish = d.wish || ''; S.wishAt = d.wishAt; } Object.assign(S.secrets, d.secrets); Object.assign(S.steles, d.steles); Object.assign(S.clues, d.clues); S.breath = Math.max(S.breath, d.breath | 0); }
    S.owner = name; save(); api.onSync && api.onSync();
  };
  const api = { get S() { return S; }, save, sync, reset() { S = fresh(); save(); api.onSync && api.onSync(); }, count: () => SECRETS.filter(q => S.secrets[q[0]]).length };
  if (ctx.account && ctx.account.onChange) { ctx.account.onChange(sync); if (prof()) sync(); }
  return api;
}

// ---------- Giao diện ----------
export function createDestinyUI(ctx, st) {
  const css = document.createElement('style');
  css.textContent = `#dstFade{position:fixed;inset:0;z-index:40;pointer-events:none;opacity:0;transition:opacity .382s ease;background:radial-gradient(circle at 50% 55%,#f4fbf6 0%,#dfeee6 61.8%,#c3d9cf 100%)}
#dstFade.on{opacity:1}
.dstBox{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:45;width:min(92vw,510px);max-height:min(88vh,610px);overflow:auto;background:#f7f1dd;border:3px solid #5d7a4a;border-radius:21px;box-shadow:0 8px 0 #3f5a34,0 13px 34px rgba(20,40,20,.35);color:#33402a;font:15px/1.5 system-ui,sans-serif;padding:21px 21px 13px}
.dstBox h2{margin:0 0 5px;font:900 21px/1.25 system-ui;color:#3f6a34}.dstBox h2 small{display:block;font:700 13px system-ui;color:#7a8a5a}
.dstBox p{margin:8px 0}.dstBox textarea{width:100%;box-sizing:border-box;height:89px;border:2px solid #9ab07a;border-radius:13px;padding:8px 13px;font:16px/1.4 system-ui;background:#fffdf4;color:#2c3a24;resize:none}
.dstBox .chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.dstBox .chips button{border:2px solid #b9c79a;background:#eef3da;color:#4a5a34;border-radius:21px;padding:5px 13px;font:700 13px system-ui}
.dstBox .row{display:flex;gap:13px;justify-content:flex-end;margin-top:13px}.dstBox .row button{border:2px solid #3f5a34;border-radius:21px;padding:8px 21px;font:800 15px system-ui;background:#fff3d6;color:#3f5a34;box-shadow:0 3px 0 #3f5a34;min-height:44px}
.dstBox .row button.go{background:#6fae52;color:#fff}.dstBox .cnt{float:right;font:700 12px system-ui;color:#8a9a6a}
.dstBox .jr{border-top:2px dashed #c9d3a8;margin-top:13px;padding-top:8px;font-size:13px}.dstBox .jr b{color:#3f6a34}
.dstBox .sec{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin:8px 0}.dstBox .sec span{aspect-ratio:1;display:grid;place-items:center;border-radius:8px;background:#e6e9cf;font-size:19px;filter:grayscale(1) opacity(.45)}.dstBox .sec span.on{filter:none;background:#dff0c8}
.dstBox .x{position:absolute;right:13px;top:13px;width:44px;height:44px;border-radius:50%;border:2px solid #3f5a34;background:#fff3d6;font:900 16px system-ui;color:#3f5a34}
#dstBreath{position:fixed;inset:0;z-index:44;display:grid;place-items:center;background:radial-gradient(circle at 50% 45%,rgba(18,44,36,.30),rgba(10,26,24,.72));color:#f2fff4;font-family:system-ui,sans-serif;text-align:center}
#dstBreath .ring{width:min(55vw,233px);aspect-ratio:1;border-radius:50%;border:5px solid rgba(214,255,224,.9);box-shadow:0 0 34px rgba(160,255,200,.55),inset 0 0 55px rgba(160,255,200,.35);transform:scale(.618);display:grid;place-items:center}
#dstBreath .ring b{font:900 34px system-ui}#dstBreath .say{font:800 21px/1.3 system-ui;margin-top:21px;text-shadow:0 2px 8px rgba(0,0,0,.5)}#dstBreath .sub{font:600 14px system-ui;opacity:.85;margin-top:5px}
#dstBreath .bar{width:min(61.8vw,233px);height:8px;border-radius:5px;background:rgba(255,255,255,.25);margin:13px auto 0;overflow:hidden}#dstBreath .bar i{display:block;height:100%;width:0;background:#bff5c9}
#dstBreath button{margin-top:21px;border:2px solid #dfffe6;background:rgba(255,255,255,.14);color:#f2fff4;border-radius:21px;padding:8px 21px;font:800 14px system-ui;min-height:44px}`;
  document.head.appendChild(css);
  const fadeEl = document.createElement('div'); fadeEl.id = 'dstFade'; document.body.appendChild(fadeEl);
  const hold = on => { ctx.player.frozen = on; document.body.classList.toggle('rs-modal', on); };
  // màn sương: phủ trắng → gọi fn (dịch chuyển) → tan
  let fading = false;
  function fade(fn, ms = 400) { if (fading) return; fading = true; fadeEl.classList.add('on'); ctx.sfx && ctx.sfx('whoosh'); setTimeout(() => { try { fn(); } finally { setTimeout(() => { fadeEl.classList.remove('on'); fading = false; }, 240); } }, ms); }

  // ----- bảng lời ước + sổ Thiên Định -----
  let box = null;
  const journal = () => { const S = st.S, n = st.count(), sn = QUOTES.filter((q, i) => S.steles[i]).length;
    return `<div class="jr">${S.found ? `🧭 Danh hiệu: <b>${TITLE}</b>${n >= 8 ? ` · 🌳 <b>${TITLE2}</b>` : ''}<br>` : ''}🔎 Bí mật trong rừng: <b>${n}/8</b><div class="sec">${SECRETS.map(q => `<span class="${S.secrets[q[0]] ? 'on' : ''}" title="${S.secrets[q[0]] ? q[2] : '?'}">${q[1]}</span>`).join('')}</div>📖 Bia đá đã đọc: <b>${sn}/5</b> · 🧘 Tĩnh tâm: <b>${S.breath | 0}</b> lần</div>`; };
  function openWish() {
    if (box) return; const S = st.S; hold(true);
    box = document.createElement('div'); box.className = 'dstBox'; box.id = 'dstWish';
    box.innerHTML = `<button class="x" aria-label="Đóng">✕</button><h2>🌟 Cây Thiên Định<small>Gửi lại một lời ước hoặc mục tiêu học tập của em</small></h2>
<p>Viết điều em muốn làm được — cây sẽ giữ giúp em. Lần sau quay lại, hãy xem mình đã tiến gần tới đâu nhé!</p>
<textarea maxlength="144" placeholder="Ví dụ: Mỗi ngày em đọc 13 trang sách…">${esc(S.wish)}</textarea><span class="cnt"></span>
<div class="chips">${['Mỗi ngày đọc 13 trang sách', 'Thuộc hết bảng cửu chương', 'Học 5 từ tiếng Anh mỗi ngày', 'Tự làm bài trước khi hỏi'].map(t => `<button>${t}</button>`).join('')}</div>
<div class="row"><button class="no">Để sau</button><button class="go">🌟 Gửi lời ước</button></div>${journal()}`;
    document.body.appendChild(box);
    const ta = box.querySelector('textarea'), cnt = box.querySelector('.cnt'), upd = () => cnt.textContent = ta.value.length + '/144';
    for (const ev of ['keydown', 'keyup', 'keypress']) ta.addEventListener(ev, e => e.stopPropagation());   // gõ chữ không điều khiển nhân vật
    ta.oninput = upd; upd();
    box.querySelectorAll('.chips button').forEach(b => b.onclick = () => { ta.value = b.textContent; upd(); });
    const close = () => { if (!box) return; box.remove(); box = null; hold(false); };
    box.querySelector('.x').onclick = box.querySelector('.no').onclick = close;
    box.querySelector('.go').onclick = () => {
      const v = ta.value.replace(/\s+/g, ' ').trim(); if (v.length < 3) { ta.focus(); cnt.textContent = 'Hãy viết ít nhất vài chữ nhé!'; return; }
      const first = !S.wish; S.wish = v.slice(0, 144); S.wishAt = Date.now(); st.save(); close();
      ctx.sfx && ctx.sfx('magic'); ui.onWish && ui.onWish(first);
      ctx.toast(`🌟 <b>Cây Thiên Định đã giữ lời ước của em:</b><br>“${esc(S.wish)}”<br><small>Một dải lụa vàng vừa được buộc lên cành. Kiên trì từng ngày nhé!</small>`, 8000);
    };
  }
  function readWish() { const S = st.S; ctx.toast(`📜 <b>Lời ước của em</b> <small>(${new Date(S.wishAt).toLocaleDateString('vi-VN')})</small><br>“${esc(S.wish)}”<br><small>Em đã làm được chưa? Bấm lại vào bệ đá để đổi mục tiêu mới.</small>`, 8000); }

  // ----- hít thở 1 phút: hít 5 s, thở 8 s (5/8 ≈ 1/φ), 5 nhịp = 65 s -----
  let br = null;
  function breathe(done) {
    if (br) return; hold(true); const IN = 5, OUT = 8, N = 5, speed = ui.speed || 1;
    const el = document.createElement('div'); el.id = 'dstBreath';
    el.innerHTML = `<div><div class="ring"><b></b></div><div class="say"></div><div class="sub"></div><div class="bar"><i></i></div><button>✕ Dừng lại</button></div>`;
    document.body.appendChild(el);
    const ring = el.querySelector('.ring'), num = ring.querySelector('b'), say = el.querySelector('.say'), sub = el.querySelector('.sub'), bar = el.querySelector('.bar i');
    br = { t: 0, el, done, end(ok) { el.remove(); br = null; hold(false); if (ok) { st.S.breath = (st.S.breath | 0) + 1; st.save(); } done && done(ok); },
      update(dt) { this.t += dt * speed; const T = IN + OUT, k = Math.floor(this.t / T), u = this.t - k * T;
        if (k >= N) return this.end(true);
        const inh = u < IN, f = inh ? u / IN : 1 - (u - IN) / OUT, e = f * f * (3 - 2 * f);
        ring.style.transform = `scale(${(1 / PHI + (1 - 1 / PHI) * e).toFixed(3)})`; num.textContent = Math.ceil(inh ? IN - u : T - u);
        say.textContent = inh ? 'Hít vào thật sâu…' : 'Thở ra thật chậm…'; sub.textContent = `Nhịp ${k + 1}/${N} · nghe tiếng thác và để vai thả lỏng`; bar.style.width = (this.t / (T * N) * 100).toFixed(1) + '%';
        if (ctx.note && inh && !this.dinged && u < 0.1) { ctx.note(392, 0.06, 1.6); this.dinged = 1; } if (!inh) this.dinged = 0; } };
    el.querySelector('button').onclick = () => br && br.end(false);
    br.update(0);
  }
  const ui = { fade, openWish, readWish, breathe, update(dt) { if (br) br.update(dt); }, get busy() { return !!(box || br || fading); }, get breathing() { return !!br; }, esc };
  return ui;
}

// ---------- Ảnh chữ (atlas 4 × 4 ô, 1 texture cho mọi bia/biển) ----------
// ô: 0 biển ngã ba 1 · 1 biển ngã ba 2 · 2 la bàn đá · 3 hình khắc · 4–8 bia danh ngôn · 9 bệ lời ước · 10 biển cổng đá
export const CELL = i => [(i % 4) / 4, 1 - (Math.floor(i / 4) + 1) / 4, 0.25, 0.25];   // [u0, v0, du, dv]
export function signAtlas() {
  const N = 1024, C = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
  const wrap = (text, x, y, w, lh) => { for (const para of text.split('\n')) { let line = ''; for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (g.measureText(t).width > w && line) { g.fillText(line, x, y); y += lh; line = word; } else line = t; } g.fillText(line, x, y); y += lh; } return y; };
  const cell = (i, fn) => { g.save(); g.translate((i % 4) * C, Math.floor(i / 4) * C); g.beginPath(); g.rect(0, 0, C, C); g.clip(); fn(); g.restore(); };
  const stone = (c0 = '#b9b3a2', c1 = '#9e9888') => { const gr = g.createLinearGradient(0, 0, C, C); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, C, C);
    for (let k = 0; k < 89; k++) { g.fillStyle = `rgba(${k % 2 ? '70,80,60' : '255,255,240'},${0.05 + (k % 5) * 0.02})`; g.beginPath(); g.arc((k * 97) % C, (k * 53) % C, 2 + (k % 8), 0, 7); g.fill(); }
    g.fillStyle = 'rgba(96,132,72,.35)'; for (let k = 0; k < 13; k++) { g.beginPath(); g.arc((k * 61) % C, k % 2 ? 8 : C - 8, 13 + (k % 3) * 8, 0, 7); g.fill(); } };
  const board = (i, head, body) => cell(i, () => { stone(); g.textAlign = 'center'; g.fillStyle = '#3d382c'; g.font = '900 23px system-ui,sans-serif'; g.fillText(head, C / 2, 44); g.fillRect(55, 55, C - 110, 3); g.font = '700 18px system-ui,sans-serif'; wrap(body, C / 2, 89, C - 34, 26); });
  board(0, SIGN.f1[0], SIGN.f1[1]); board(1, SIGN.f2[0], SIGN.f2[1]);
  cell(2, () => { stone('#c9c3b2', '#aaa491'); g.translate(C / 2, C / 2); g.strokeStyle = '#4a4436'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 110 / PHI, 0, 7); g.stroke();
    for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * Math.PI / 4); g.fillStyle = k === 0 ? '#c8402e' : k % 2 ? '#8a8472' : '#4a4436'; const L = k % 2 ? 55 : 89; g.beginPath(); g.moveTo(0, -L); g.lineTo(k % 2 ? 8 : 13, 0); g.lineTo(k % 2 ? -8 : -13, 0); g.closePath(); g.fill(); g.restore(); }
    g.fillStyle = '#3d382c'; g.font = '900 30px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c8402e'; g.fillText('B', 0, -100 + 4); g.fillStyle = '#3d382c'; g.fillText('N', 0, 98); g.fillText('Đ', 97, 0); g.fillText('T', -97, 0); });
  cell(3, () => { stone('#b3ad9c', '#958f7e'); g.strokeStyle = '#4a4436'; g.fillStyle = '#4a4436'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); for (let a = 0; a < 13; a += 0.1) { const r = 3 * Math.pow(PHI, a / 3.2); g.lineTo(64 + Math.cos(a) * r, 190 + Math.sin(a) * r); } g.stroke();                 // xoắn ốc vàng
    g.beginPath(); g.moveTo(128, 120); g.lineTo(128, 30); g.moveTo(108, 55); g.lineTo(128, 30); g.lineTo(148, 55); g.stroke(); g.font = '900 26px system-ui'; g.textAlign = 'center'; g.fillText('B', 128, 150);   // mũi tên Bắc
    for (let k = 0; k < 13; k++) { g.beginPath(); g.arc(150 + (k % 7) * 15, 190 + Math.floor(k / 7) * 21 + Math.sin(k) * 4, 4.5, 0, 7); g.fill(); }                               // 13 chấm đá
    g.lineWidth = 4; g.beginPath(); g.moveTo(212, 110); g.lineTo(212, 62); g.stroke(); g.beginPath(); g.arc(212, 48, 21, 0, 7); g.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(212 + Math.cos(a) * 26, 48 + Math.sin(a) * 26); g.lineTo(212 + Math.cos(a) * 34, 48 + Math.sin(a) * 34); g.stroke(); } });
  QUOTES.forEach(([q, who], i) => cell(4 + i, () => { stone(); g.textAlign = 'center'; g.fillStyle = '#35301f'; g.font = `800 ${q.length > 60 ? 17 : q.length > 30 ? 21 : 26}px system-ui,sans-serif`; const y = wrap('“' + q + '”', C / 2, q.length > 60 ? 50 : 76, C - 30, q.length > 60 ? 23 : 30); g.font = 'italic 700 15px system-ui'; g.fillStyle = '#5a5340'; wrap('— ' + who, C / 2, Math.min(232, y + 13), C - 30, 19); }));
  cell(9, () => { stone('#cfc8a6', '#b3a984'); g.textAlign = 'center'; g.fillStyle = '#4a3f1c'; g.font = '900 44px system-ui'; g.fillText('🌟', C / 2, 70); g.font = '900 24px system-ui'; g.fillText('THIÊN ĐỊNH', C / 2, 118); g.font = '700 17px system-ui'; wrap('Gửi lại lời ước\nvà mục tiêu học tập', C / 2, 155, C - 30, 24); });
  cell(10, () => { stone(); g.textAlign = 'center'; g.fillStyle = '#35301f'; g.font = '900 26px system-ui'; g.fillText('CỔNG ĐÁ', C / 2, 96); g.font = '700 18px system-ui'; wrap('Lối tắt của\nngười tìm đường', C / 2, 140, C - 30, 26); });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}
