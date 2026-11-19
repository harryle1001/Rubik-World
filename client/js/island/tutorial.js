// tutorial.js — Hướng dẫn chơi cho học sinh nhỏ tuổi: 3 bước ngắn, chữ to, có thể bỏ qua. KHÔNG tự bật: chỉ mở bằng nút ❓ Hướng dẫn (menu ☰).
// Bước 1 Đi lại (tự sang bước khi em đã đi được 5 m) · Bước 2 Vào lớp học/mini game · Bước 3 Xe, thú cưỡi, bản đồ (nút nhấp nháy để chỉ chỗ).
// Mở lại: ctx.tutorial.show(). Tỷ lệ vàng: thẻ rộng 377 px, chữ 13 → 21 → 34 px (×φ), bo góc 21 px, chuyển cảnh 0,618 s.
const KEY = 'island.tut';
const CSS = `
#tut{position:fixed;left:50%;top:calc(max(12px,env(safe-area-inset-top)) + 89px);transform:translate(-50%,-13px);z-index:28;width:min(92vw,377px);opacity:0;transition:opacity .618s,transform .618s;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
#tut.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
#tut.low{top:auto;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 110px);left:max(12px,env(safe-area-inset-left));width:min(calc(100vw - 89px),377px);transform:translateY(13px)}#tut.low.on{transform:none}   /* bước 3: xuống thấp để không che nút 🗺️ ☀️ ở trên */
#tut .c{background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:13px 21px 13px;border-top:8px solid #f0a23a;box-shadow:0 8px 34px #0006;text-align:center}
#tut .ic{font-size:34px;line-height:1.2;animation:tutB 1.618s ease-in-out infinite}
@keyframes tutB{50%{transform:translateY(-5px) scale(1.06)}}
#tut h3{margin:3px 0 5px;font:900 21px/1.25 system-ui}#tut p{margin:0 0 8px;font:600 15px/1.5 system-ui}#tut p b{color:#c0662a}
#tut .row{display:flex;align-items:center;gap:8px;margin-top:8px}
#tut .dots{display:flex;gap:5px;flex:1}#tut .dots i{width:8px;height:8px;border-radius:50%;background:#e2d3b5}#tut .dots i.on{background:#f0a23a;width:21px;border-radius:5px}
#tut button{min-height:44px;border-radius:13px;border:0;font:800 15px system-ui;cursor:pointer;touch-action:manipulation;white-space:nowrap}
#tut .skip{background:none;color:#8a7458;padding:0 8px}#tut .next{background:#f0a23a;color:#fff;padding:0 13px}
body.rs-modal #tut,body.mg-on #tut{display:none}
.tutGlow{animation:tutG 1.236s ease-in-out infinite!important;border-radius:21px}
@keyframes tutG{0%,100%{box-shadow:0 0 0 0 #ffd36e00}50%{box-shadow:0 0 0 8px #ffd36ecc}}`;

export function createTutorial(ctx) {
  const phone = matchMedia('(pointer:coarse)').matches || innerWidth < 700;
  const STEPS = [
    { ic: phone ? '👆🕹️' : '⌨️🖱️', t: 'Đi dạo quanh đảo',
      p: phone ? 'Đặt ngón tay ở <b>nửa trái</b> màn hình rồi kéo để đi. Vuốt <b>nửa phải</b> để nhìn xung quanh.'
        : 'Bấm <b>W A S D</b> hoặc <b>phím mũi tên</b> để đi, giữ <b>Shift</b> để chạy. Kéo chuột để nhìn xung quanh.',
      hint: 'Thử đi vài bước nào!', glow: phone ? ['#bRun', '#bJump'] : [] },
    { ic: '🏫✨', t: 'Vào lớp học & trò chơi',
      p: `Đi tới gần <b>cửa lớp</b>, thầy cô hay bạn bè. Khi hiện <b>nút cam</b> ở dưới, bấm vào${phone ? '' : ' (hoặc phím <b>E</b>)'} để học và chơi: cờ vua, Rubik, ngắm sao, ném rổ…`,
      glow: ['#bSchool'] },
    { ic: '🚲🎈🗺️', t: 'Xe, thú cưỡi & bản đồ',
      p: `Cột nút bên phải: <b>🚲</b> xe đạp, <b>🎈</b> khinh khí cầu, <b>🎶</b> gọi thú cưỡi. <b>🗺️</b> mở bản đồ${phone ? '' : ' (phím <b>M</b>)'}, <b>☀️</b> chỉnh độ sáng.`,
      glow: ['.vbtns', '#bMap', '#bBright'], low: true },
  ];
  const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
  const el = document.createElement('div'); el.id = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Hướng dẫn chơi');
  document.body.appendChild(el);
  let i = -1, start = null, moved = 0;
  const glowOff = () => document.querySelectorAll('.tutGlow').forEach(e => e.classList.remove('tutGlow'));
  function render() {
    const S = STEPS[i]; glowOff();
    el.innerHTML = `<div class="c"><div class="ic">${S.ic}</div><h3>${S.t}</h3><p>${S.p}</p><div class="row"><div class="dots">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`
      + `<button class="skip" type="button">Bỏ qua</button><button class="next" type="button">${i === STEPS.length - 1 ? 'Chơi thôi! 🎉' : 'Tiếp ➜'}</button></div></div>`;
    el.querySelector('.skip').onclick = () => done();
    el.querySelector('.next').onclick = () => go(i + 1);
    el.classList.toggle('low', !!S.low);
    for (const q of S.glow || []) { const e = document.querySelector(q); if (e) e.classList.add('tutGlow'); }
    ctx.sfx && ctx.sfx('ui');
  }
  function go(k) { if (k >= STEPS.length) return done(); i = k; start = null; moved = 0; render(); el.classList.add('on'); }
  function done() { i = -1; el.classList.remove('on'); glowOff(); try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  return {
    show: () => go(0),
    get open() { return i >= 0; },
    update(dt) {
      if (i < 0) return;
      if (i === 0) {   // bước 1: tự sang bước 2 khi em đã đi được 5 m (Fibonacci)
        const p = ctx.player.pos; if (!start) start = { x: p.x, z: p.z };
        moved = Math.hypot(p.x - start.x, p.z - start.z); if (moved > 5) go(1);
      }
    },
  };
}
