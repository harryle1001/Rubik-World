// lessons.js — THỜI KHOÁ BIỂU 3D: chip nhỏ góc HUD "🕰 08:20 · Tiết 2 · ➗ Toán" (chạm: xem cả ngày),
// chuông nhắc khi vào tiết, và TIẾT HỌC NGAY TRONG PHÒNG 3D: đúng giờ bước vào đúng lớp → bảng nổi trên bục giảng, làm 3–5 câu
// (lớp 1–2: 3 câu, lớp 3+: 5 câu — Fibonacci), vào lớp trong 13 phút đầu được thêm 1 ⭐ đúng giờ. Mỗi tiết học 1 lần.
// Dữ liệu tiết/phòng: data/talk.js (TIMETABLE, PERIODS, LESSON). Giờ: đồng hồ lớp dữ liệu 3D nếu có (ctx.schoolData.clock),
// không thì giờ bầu trời (sky.state.hour — school-town.js đồng bộ theo đồng hồ trường 2D, nút ☀️ khoá giờ).
import * as THREE from 'three';
import { to2, to3, TOWN_Y } from './layout.js';
import { TIMETABLE, PERIODS, BREAKS, LESSON, ROOM_NAME, schoolSource } from './data/talk.js';

const DOWN = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'], DONE = 'island.lessons.done';
const pad = n => String(n).padStart(2, '0'), fmt = m => pad(Math.floor(m / 60) % 24) + ':' + pad(Math.floor(m) % 60);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export function createLessons(ctx) {
  const minutes = () => { const c = ctx.schoolData && ctx.schoolData.clock; if (c) return c.minutes; return ((ctx.sky ? ctx.sky.state.hour : new Date().getHours()) * 60 + 1440) % 1440; };
  const dow = () => (new Date().getDay() + 6) % 7;
  function now() {   // tiết hiện tại: { i, s, e, label, subj } hoặc giờ nghỉ { label }
    const m = minutes(), d = dow(), T = TIMETABLE[d];
    if (T) for (let i = 0; i < PERIODS.length; i++) { const [s, e, label] = PERIODS[i]; if (m >= s && m < e) return { i, s, e, label, subj: T[i], m }; }
    if (d === 6) return { label: 'Chủ nhật: nghỉ học', m }; if (d === 5 && m >= 450 && m < 660) return { label: 'Thứ 7: sự kiện của trường', m };
    for (const [s, e, label] of BREAKS) if (m >= s && m < e) return { label, m };
    return { label: 'Ngoài giờ học', m };
  }
  // ---------- Chip HUD (góc trái, ngay dưới ô nhiệm vụ 📋 — bám theo chiều cao ô đó khi mở rộng/thu gọn) ----------
  const css = document.createElement('style');
  css.textContent = `#lessonChip{position:fixed;z-index:26;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 144px);box-sizing:border-box;max-width:min(233px,calc(100vw - 144px));padding:3px 8px;border-radius:13px;background:#1b1626b8;border:2px solid #fff5;color:#fff;font:700 12px/1.35 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;-webkit-tap-highlight-color:transparent;text-shadow:0 1px 2px #0008}
#lessonChip b{color:#ffd36e}#lessonChip.on{border-color:#ffd36e}body.rs-modal #lessonChip,body.mg-on #lessonChip{display:none}`;
  document.head.appendChild(css);
  const chip = document.createElement('div'); chip.id = 'lessonChip'; chip.title = 'Thời khoá biểu (chạm để xem cả ngày)'; document.body.appendChild(chip);
  // có hàng chip HUD (data/clock.js, account-hud.js): chip giờ học thay chỗ chip đồng hồ (cùng giờ, thêm môn) — không hiện 2 đồng hồ
  const row = document.getElementById('chipRow'), inRow = !!row;
  if (row) { const old = document.getElementById('clockChip'); if (old) old.style.display = 'none'; chip.style.order = 0; row.prepend(chip); css.textContent += '#chipRow #lessonChip{position:static;max-width:62vw;padding:5px 13px;font-size:13px}'; }
  chip.onclick = () => {
    const T = TIMETABLE[dow()];
    const rows = T ? PERIODS.map(([s, e, l], i) => { const L = LESSON[T[i]]; return `${fmt(s)} ${l}: ${L.icon} <b>${L.name}</b>${L.room ? ` · ${ROOM_NAME[L.room]}` : ''}`; }).join('<br>') : 'Hôm nay không có tiết học.';
    ctx.toast(`📅 <b>${DOWN[dow()]}</b> · Thời khoá biểu<br>${rows}<br><small>Đúng giờ vào đúng lớp để học ngay trong phòng.</small>`, 6000); ctx.sfx && ctx.sfx('ui');
  };
  // ---------- Phòng học: khu R của bản đồ trường + điểm bảng (giữa phòng, sát tường trong) ----------
  const roomAt = (x, z) => { const SI = ctx.schoolInterior && ctx.schoolInterior.roomAt(x, z); if (SI !== undefined) return SI; const RS = schoolSource(ctx), q = to2(x, z); if (!RS || !q || !RS.regionAt) return null; try { return RS.regionAt(q[0], q[1]); } catch (e) { return null; } };
  const boardOf = id => { const SI = ctx.schoolInterior && ctx.schoolInterior.boardOf(id); if (SI) return SI; const RS = schoolSource(ctx), r = RS && RS.R && RS.R[id]; if (!r) return null; const [x, z] = to3(r.x + r.w / 2, r.y + r.h * 0.38); return new THREE.Vector3(x, TOWN_Y + 2.6, z); };
  let t = 0, last = '', lastKey = null, inside = false, active = false;
  return {
    update(dt) {
      if ((t -= dt) > 0) return; t = 0.5;
      const c = now(), L = c.subj && LESSON[c.subj], key = c.subj ? `${new Date().toDateString()}#${c.i}` : null;
      const s = L ? `🕰 <b>${fmt(c.m)}</b> · ${c.label} · ${L.icon} ${L.name}` : `🕰 <b>${fmt(c.m)}</b> · ${c.label}`;
      if (s !== last) { chip.innerHTML = s; last = s; chip.classList.toggle('on', !!L); }
      const qh = !inRow && document.getElementById('questHud'); if (qh && qh.offsetParent) chip.style.top = Math.round(qh.getBoundingClientRect().bottom + 5) + 'px';
      // chuông vào tiết
      if (key !== lastKey) { lastKey = key; if (L && L.room && !load(DONE, []).includes(key) && !document.body.classList.contains('rs-modal')) { ctx.sfx && ctx.sfx('open'); ctx.toast(`🔔 <b>${c.label}: ${L.icon} ${L.name}</b> ở <b>${ROOM_NAME[L.room]}</b>.<br>Vào lớp đúng giờ để học và nhận ⭐ nhé!`, 4500); } }
      // vào đúng phòng đúng tiết → tiết học (chỉ khi mới bước vào; đóng giữa chừng thì ra rồi vào lại để học tiếp)
      const p = ctx.player.pos, here = L && L.room && !ctx.player.vehicle && (Math.abs(p.y - TOWN_Y) < 2.6 || ctx.indoor) && roomAt(p.x, p.z) === L.room;
      if (here && !inside && !active && ctx.teacherQuiz && !ctx.teacherQuiz.open() && !load(DONE, []).includes(key)) {
        const at = boardOf(L.room); if (at) {
          active = true; const g = load('island.grade', 0) || 3;
          ctx.teacherQuiz.lesson({ subj: c.subj, n: g <= 2 ? 3 : 5, at, title: L.name, teacher: L.teacher, late: c.m - c.s > 13,
            onDone: () => { const d = load(DONE, []); d.push(key); while (d.length > 34) d.shift(); save(DONE, d); }, onClose: () => { active = false; } });
          const oc = ctx.teacherQuiz; const iv = setInterval(() => { if (!oc.open()) { active = false; clearInterval(iv); } }, 500);
        }
      }
      inside = !!here;
    },
    now, minutes,
  };
}
