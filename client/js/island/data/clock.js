// clock.js — Đồng hồ & giờ học của trường cho đảo 3D (sao chép thời khoá biểu từ game 2D: client/school/js/core/state-agents.js).
// Giờ trong game = giờ thật trên máy (như chế độ "Giờ thật" của 2D). Nút ☀️ khoá Sáng/Trưa/Chiều/Tối (sky.state.lock)
// → đồng hồ trường cũng theo giờ đó, để lịch đi lại của các bạn khớp với bầu trời.
const DOWN = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const FEST_NAME = { xuan: 'Lễ hội múa lân', ha: 'Ngày thăm lớp mùa hè', thu: 'Giải bóng đá mùa thu', dong: 'Lễ hội Giáng sinh' };
const SEASON_NAME = { xuan: 'Xuân', ha: 'Hạ', thu: 'Thu', dong: 'Đông' };

// Thời khoá biểu theo thứ (d: 0 = Thứ 2 … 6 = Chủ nhật), mỗi mục [phút bắt đầu, mã tiết]
export function schedule(d) {
  if (d === 6) return [[0, 'nghi'], [480, 'cnrung'], [870, 'nghi'], [900, 'cnbong'], [1020, 'nghi']];
  if (d === 5) return [[0, 'dem'], [390, 'den'], [435, 'diemdanh'], [450, 'sukien'], [630, 'diemdanhcuoi'], [660, 've'], [700, 'dem']];
  const s = [[0, 'dem'], [390, 'den'], [435, 'diemdanh']];
  if (d === 0) s.push([450, 'chaoco'], [470, 'tiet1']); else s.push([450, 'tiet1']);
  s.push([540, 'rachoi'], [570, 'tiet2'], [660, 'trua'], [780, 'clb'], [870, 'bien'], [960, 'diemdanhcuoi'], [1005, 've'], [1050, 'dem']);
  return s;
}
export const seasonOf = (date = new Date()) => { const m = date.getMonth(); return m >= 1 && m <= 3 ? 'xuan' : m >= 4 && m <= 6 ? 'ha' : m >= 7 && m <= 9 ? 'thu' : 'dong'; };
export function periodName(p, season = seasonOf()) {
  return ({ dem: 'Ngoài giờ học', nghi: 'Chủ nhật: nghỉ học', cnrung: 'Chủ nhật: dã ngoại trong rừng thông', cnbong: 'Chủ nhật: các bạn đá bóng', den: 'Học sinh đến trường', diemdanh: 'Điểm danh buổi sáng', chaoco: 'Chào cờ đầu tuần',
    tiet1: 'Tiết 1: nhóm A học Rubik, nhóm B lắp ráp điện', rachoi: 'Ra chơi', tiet2: 'Tiết 2: nhóm A lắp ráp điện, nhóm B Rubik ở Hội trường', trua: 'Ăn trưa & ngủ trưa',
    clb: 'Câu lạc bộ: cờ vua, Rubik, âm nhạc, bóng đá', bien: 'Giờ ra biển', sukien: FEST_NAME[season], diemdanhcuoi: 'Điểm danh cuối ngày', ve: 'Tan học, về nhà' })[p] || p;
}
const pad2 = n => String(n).padStart(2, '0');
export const fmt = t => pad2(Math.floor(t / 60) % 24) + ':' + pad2(Math.floor(t) % 60);

export function createClock(ctx) {
  const clk = {
    // phút trong ngày (0–1440), có phần lẻ
    get minutes() { const L = ctx.sky && ctx.sky.state.lock; if (L != null) return L * 60; const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; },
    get dow() { return (new Date().getDay() + 6) % 7; },
    get season() { return seasonOf(); },
    period(t = clk.minutes) { const S = schedule(clk.dow); let p = S[0][1]; for (const [s, n] of S) if (t >= s) p = n; return p; },
    periodName(p = clk.period()) { return periodName(p, clk.season); },
    isSchoolHours() { return !/^(dem|nghi)$/.test(clk.period()); },
    label() { return `${DOWN[clk.dow]} · ${fmt(clk.minutes)}`; },
    seasonName() { return SEASON_NAME[clk.season]; },
  };
  // chip đồng hồ trên HUD (bấm: xem tiết đang học)
  const css = document.createElement('style');
  css.textContent = `#clockChip{padding:5px 13px;border-radius:13px;background:#1b1626aa;border:2px solid #fff5;color:#fff;font:700 13px/1.3 system-ui;max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
#clockChip b{color:#ffd36e;font-weight:800}body.rs-modal #clockChip{display:none}`;
  document.head.appendChild(css);
  const row = document.getElementById('chipRow') || (() => { const r = document.createElement('div'); r.id = 'chipRow'; document.body.appendChild(r); const st = document.createElement('style'); st.textContent = `#chipRow{position:fixed;z-index:26;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 47px);display:flex;flex-wrap:wrap;gap:8px;max-width:calc(100vw - 80px);pointer-events:none}#chipRow>*{pointer-events:auto}body.rs-modal #chipRow,body.mg-on #chipRow{display:none}`; document.head.appendChild(st); return r; })();
  const chip = document.createElement('div'); chip.id = 'clockChip'; chip.style.order = 0; chip.title = 'Đồng hồ trường (bấm để xem tiết học)'; row.appendChild(chip);
  chip.onclick = () => ctx.toast && ctx.toast(`🕰 ${clk.label()} · mùa ${clk.seasonName()}<br>${clk.periodName()}`, 4000);
  let t = 0, last = '';
  clk.update = dt => {
    if ((t -= dt) > 0) return; t = 0.5;
    const s = `🕰 <b>${fmt(clk.minutes)}</b> · ${clk.periodName().split(':')[0]}`; if (s !== last) { chip.innerHTML = s; last = s; }
    ctx.schoolHours = clk.isSchoolHours();
  };
  return clk;
}
