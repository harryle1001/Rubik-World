// people.js — 21 bạn & thầy cô của trường Rubik + khách (NPC) cho đảo 3D, kèm lịch đi lại theo tiết học.
// Danh sách, màu áo, chỗ ngồi, đường đi qua cửa lớp sao chép từ game 2D (client/school/js/core/state-agents.js, map.js) — KHÔNG import code 2D.
// Mô phỏng gọn: mỗi khi đổi tiết, mỗi người nhận 1 đích (2D px) → đi theo đường planPath; giờ chơi tự đi lang thang quanh khu.
// town-people.js chỉ đọc: x, y, visible, moving, dir, inSub + các trường trang phục.
import { R, GATE, BOOTH, HOUSE, FOREST_GATES, CHESS_T, MUSIC_SPOTS, TENTS, LAKE, POND, TRAIL, PIER_END, regionAt } from './map.js';

export const STAFF_DEF = [
  { id: 'ha', name: 'Cô Hà', role: 'Giáo viên dạy Rubik', shirt: '#8e5bd6', pants: '#4b2f80', hair: '#2a1a12', long: true, skirt: true, icon: 'cube' },
  { id: 'xuan', name: 'Cô Xuân', role: 'Giáo viên dạy lắp ráp điện', shirt: '#1f9e8a', pants: '#1f9e8a', hair: '#22140c', long: true, skirt: true, aodai: true, icon: 'bolt' },
  { id: 'nam', name: 'Nam', role: 'Bảo vệ, canh từng lớp học', shirt: '#2d4a8a', pants: '#1d2c52', hair: '#1b1b1b', cap: '#16213f', icon: 'whistle' },
  { id: 'mic', name: 'Mic', role: 'Điểm danh, canh người đi thiếu và nghỉ học', shirt: '#2fa36b', pants: '#3b3b4f', hair: '#5a3a1a', cap: '#ffd23f', icon: 'clip' },
  { id: 'ngoc', name: 'Cô Ngọc', role: 'Ban giám hiệu, đi dự giờ từng lớp', shirt: '#d23b3b', pants: '#d23b3b', hair: '#1a1010', long: true, skirt: true, aodai: true, icon: 'eye' },
  { id: 'lai', name: 'Cô Lai', role: 'Văn thư, ghi giấy tờ và viết báo cáo', shirt: '#efe4cc', pants: '#5a6a8a', hair: '#3a2418', long: true, glasses: true, icon: 'paper' },
  { id: 'haquan', name: 'Hà Quân', role: 'Quay video theo dõi cả trường và đường về nhà', shirt: '#ff8a2b', pants: '#33334a', hair: '#1a1a1a', cap: '#222222', icon: 'camcorder' },
  { id: 'hung', name: 'Chú Hưng', role: 'Lái tàu ngầm, hướng dẫn an toàn trên biển', shirt: '#f4f4f4', pants: '#1d2c52', hair: '#3a3a3a', cap: '#f4f4f4', brim: '#1d2c52', icon: 'anchor' },
];
export const STU_DEF = [
  { id: 'khang', name: 'Khang', bag: '#ef4b4b', hair: '#1c140f', bike: true, fan: true },
  { id: 'minh', name: 'Minh', bag: '#3d7bff', hair: '#2b1d14' },
  { id: 'quan', name: 'Quân', bag: '#2fbf71', hair: '#120d0a', bike: true, fan: true },
  { id: 'triet', name: 'Triết', bag: '#ff8a2b', hair: '#3a2618', bike: true, saoDo: true },
  { id: 'thinh', name: 'Thịnh', bag: '#ffd23f', hair: '#1a1a1a' },
  { id: 'bminh', name: 'Bách Minh', bag: '#b06bff', hair: '#2a1a10', bike: true },
  { id: 'uyen', name: 'Mỹ Uyên', bag: '#ff6fae', hair: '#1a0f0a', long: true, saoDo: true, leader: true },
  { id: 'thien', name: 'Anh Thiện', bag: '#26c6da', hair: '#22160e', bike: true, saoDo: true },
  { id: 'pbach', name: 'Phạm Bách', bag: '#8d6e63', hair: '#151515', bike: true, fan: true },
  { id: 'hbach', name: 'Hoàng Bách', bag: '#c0ca33', hair: '#2e1e12', bike: true, fan: true },
  { id: 'nminh', name: 'Nhật Minh', bag: '#5c6bc0', hair: '#1d1d1d', fan: true },
  { id: 'binh', name: 'Khải Bình', bag: '#ff7043', hair: '#2a1a12', bike: true, fan: true, saoDo: true },
  { id: 'bich', name: 'Bích', bag: '#4db6ac', hair: '#26170e', long: true, saoDo: true },
];
const SKINS = ['#f2c9a0', '#eab98c', '#f5d1ad', '#e5b183', '#f0c497', '#edbf95'];

// ---------- chỗ đứng/ngồi (2D px) ----------
const SEAT_RUBIK = i => [130 + (i % 3) * 90, 208 + Math.floor(i / 3) * 68];
const SEAT_ELEC = j => [1730 + (j % 4) * 82, 196 + Math.floor(j / 4) * 76];
const SEAT_HALL = i => [1262 + (i % 4) * 84, 296 + Math.floor(i / 4) * 68];
const PAD = i => i < 7 ? [790 + i * 52, 540] : [816 + (i - 7) * 52, 600];
const CHAOCO = i => [770 + (i % 7) * 36, i < 7 ? 352 : 388];
const RY_SPOTS = [[110, 560], [170, 560], [275, 560], [330, 560], [120, 664], [320, 664]];
const MIC_SPOT = [950, 500];
const BREAK = { rubikyard: [220, 590], chess: [565, 200], music: [930, 200], yard: [700, 420], football: [1920, 515], giantchess: [340, 280 - 560] };
const SUN_ACT = { picnic: [R.picnic.x + 130, R.picnic.y + 90], bike: [2700, 560], camp: [LAKE.cx, LAKE.cy + LAKE.ry + 60], koi: [LAKE.cx - LAKE.rx - 30, LAKE.cy], garden: [R.garden.x + 220, R.garden.y + 120], lotus: [4540, 450], giantchess: [340, -280], pondfish: [POND.cx, POND.cy + POND.ry + 30] };

// ---------- đường đi qua cửa lớp, vòng qua hội trường, theo phố về nhà (sao chép 2D) ----------
const side = x => x >= 1572 ? 'E' : 'W';
const resZ = (x, y) => x > 2190 && x < 2636 && y < 690;
const forZ = (x, y) => x >= 2636 && y < 690;
const gateNear = x => FOREST_GATES.reduce((b, g) => Math.abs(g - x) < Math.abs(b - x) ? g : b);
function crossing(pts, from, to) {
  if (side(from[0]) === side(to[0])) return;
  if (side(from[0]) === 'W') { if (from[1] < 640) pts.push([735, 452], [735, 708]); pts.push([1170, 708], [1600, 708], [1650, 708]); }
  else { pts.push([1650, 708], [1600, 708], [1170, 708]); if (to[1] < 640) pts.push([735, 708], [735, 452]); }
}
function planCore(a, rid, p) {
  const cur = regionAt(a.x, a.y), pts = []; let from = [a.x, a.y];
  const useDoor = (id, other) => R[id] && R[id].din && !R[id].open && !(id === 'beach' && side(other[0]) === 'E' && side(from[0]) === 'E');
  if (resZ(a.x, a.y) && !resZ(p[0], p[1])) { pts.push([2220, a.y], [2220, 708]); from = [2220, 708]; }
  if (forZ(a.x, a.y) && !forZ(p[0], p[1])) { const g = gateNear(a.x); pts.push([g, Math.min(a.y, 586)], [g, 708]); from = [g, 708]; }
  if (cur !== rid) {
    if (useDoor(cur, p)) { pts.push(R[cur].din, R[cur].dout); from = R[cur].dout; }
    const tDoor = R[rid] && R[rid].din && !R[rid].open && !(rid === 'beach' && side(p[0]) === 'E' && side(from[0]) === 'E');
    crossing(pts, from, tDoor ? R[rid].dout : p);
    if (tDoor) pts.push(R[rid].dout, R[rid].din);
  } else crossing(pts, from, p);
  if (resZ(p[0], p[1]) && !resZ(a.x, a.y)) pts.push([2220, 708], [2220, p[1]]);
  if (forZ(p[0], p[1]) && !forZ(a.x, a.y)) { const g = gateNear(p[0]); pts.push([g, 708], [g, Math.min(p[1], 586)]); }
  pts.push(p); return pts.map(q => [q[0], q[1]]);
}
export function planPath(a, p) {
  const rid = regionAt(p[0], p[1]), nA = a.y < 24 && a.x < 2636, nP = p[1] < 24 && p[0] < 2636;   // công viên phía bắc: qua cổng giữa phòng nhạc & hội trường
  if (nP && !nA) return planCore(a, 'yard', [1150, 332]).concat([[1150, 20], [1150, -40], [p[0], p[1]]]);
  if (nA && !nP) return [[1150, -40], [1150, 20], [1150, 332]].concat(planCore({ x: 1150, y: 332 }, rid, p));
  if (nA && nP) return [[p[0], p[1]]];
  return planCore(a, rid, p);
}

// ---------- hạt ngẫu nhiên cố định theo ngày (mỗi ngày phân CLB/khu ra chơi khác nhau, nhưng tải lại trang vẫn giữ) ----------
function rng(seed) { let s = seed % 2147483647 || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function createPeople(clock) {
  const mk = (d, i, student) => Object.assign({ x: GATE[0], y: GATE[1], path: [], dir: 1, moving: false, visible: false, inSub: false, student, skin: SKINS[i % SKINS.length], idx: i, key: null, wanderAt: 0, shirt: student ? '#f7f7f7' : undefined, pants: student ? '#24356b' : undefined, icon: student ? null : d.icon }, d);
  const staff = STAFF_DEF.map((d, i) => mk(d, i, false));
  const students = STU_DEF.map((d, i) => mk(Object.assign({ role: d.saoDo ? 'Học sinh · Sao đỏ' + (d.leader ? ' (đội trưởng)' : '') : 'Học sinh' }, d), i, true));
  students.forEach(s => { s.home = HOUSE(s.idx).door; s.group = s.idx < 6 ? 'A' : 'B'; });
  const agents = [...staff, ...students], A = Object.fromEntries(agents.map(a => [a.id, a]));
  let dayKey = -1;
  function newDay() {
    const d = new Date(); dayKey = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); const r = rng(dayKey), pick = a => a[(r() * a.length) | 0];
    const clubs = ['chess', 'chess', 'chess', 'chess', 'rubikyard', 'rubikyard', 'rubikyard', 'music', 'music', 'music', 'football', 'football', 'football'].sort(() => r() - 0.5);
    let chessN = 0, musicN = 0, ryN = 0; const roles = Object.keys(MUSIC_SPOTS);
    students.forEach((s, i) => {
      s.club = clubs[i]; s.seat = s.club === 'chess' ? CHESS_T[chessN++ % CHESS_T.length] : s.club === 'music' ? MUSIC_SPOTS[roles[musicN++ % roles.length]] : s.club === 'rubikyard' ? RY_SPOTS[ryN++ % RY_SPOTS.length] : [1760 + (i % 5) * 80, 420 + (i % 3) * 90];
      s.breakZone = pick(Object.keys(BREAK)); s.sun = pick(Object.keys(SUN_ACT)); s.sunOut = r() < 0.85; s.absent = r() < 0.06;
      s.delay = r() * 18; s.beach = [1420 + r() * 1100, 830 + r() * 60];
    });
    staff.forEach(a => { a.delay = r() * 6; });
  }
  // đích theo tiết: [x, y] (2D px), 'home' (về nhà rồi ẩn), 'gate' (ra cổng rồi ẩn) hoặc null (ẩn)
  function targetOf(a, p, t) {
    if (a.student) {
      const i = a.idx, A_ = a.group === 'A', j = A_ ? i : i - 6;
      if (a.absent && p !== 'nghi' && p !== 'cnrung' && p !== 'cnbong') return null;
      switch (p) {
        case 'dem': case 'nghi': case 've': return 'home';
        case 'den': case 'diemdanh': case 'diemdanhcuoi': return PAD(i);
        case 'chaoco': return CHAOCO(i);
        case 'tiet1': return A_ ? SEAT_RUBIK(i) : SEAT_ELEC(j);
        case 'tiet2': return A_ ? SEAT_ELEC(i) : SEAT_HALL(j);
        case 'rachoi': return BREAK[a.breakZone];
        case 'trua': return SEAT_HALL(i);
        case 'clb': return a.seat;
        case 'bien': return a.beach;
        case 'sukien': return [1800 + (i % 5) * 70, 430 + Math.floor(i / 5) * 70];
        case 'cnrung': return a.sunOut ? SUN_ACT[a.sun] : 'home';
        case 'cnbong': return a.fan ? [1760 + (i % 5) * 80, 420 + (i % 3) * 90] : 'home';
      }
      return 'home';
    }
    const off = p === 'dem' || p === 'nghi';
    if (a.id === 'nam') return off ? BOOTH : null;   // bảo vệ: ngoài giờ trực ở chòi cổng; trong giờ đi tuần (wander)
    if (off) return 'gate';
    switch (a.id) {
      case 'ha': return p === 'tiet1' ? [220, 110] : p === 'tiet2' ? [1375, 120] : p === 'trua' ? [1300, 560] : p === 'clb' ? [220, 640] : [560, 420];
      case 'xuan': return p === 'tiet1' || p === 'tiet2' ? [1850, 110] : p === 'trua' ? [1450, 560] : [1880, 360];
      case 'mic': return /diemdanh|den/.test(p) ? MIC_SPOT : p === 'bien' ? [1500, 820] : [1062, 520];
      case 'lai': return [565, 590];
      case 'hung': return p === 'bien' ? [PIER_END[0], PIER_END[1] - 30] : [1320, 830];
      case 'ngoc': case 'haquan': return null;   // đi dự giờ / quay phim: đi vòng (wander)
    }
    return [700, 420];
  }
  const ROUND = { ngoc: [[220, 340], [565, 340], [930, 340], [1160, 400], [1850, 340], [950, 470]], haquan: [[400, 420], [1100, 420], [1660, 700], [2200, 700], [1300, 820], [700, 700]], nam: [[150, 420], [735, 450], [1150, 380], [1660, 360], [735, 700], [60, 420]] };
  const go = (a, p) => { a.path = planPath(a, p); a.goal = p; };
  const placeAt = (a, p) => { a.x = p[0]; a.y = p[1]; a.path = []; a.goal = p; };
  let first = true, lastT = 0;
  function update(dt) {
    const d = new Date(), dk = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); if (dk !== dayKey) newDay();
    const t = clock.minutes, p = clock.period(t), jump = Math.abs(t - lastT) > 20 && !first; lastT = t;   // ☀️ đổi giờ → đặt thẳng tới chỗ mới
    for (const a of agents) {
      const tg = targetOf(a, p, t), key = p + ':' + JSON.stringify(tg);
      const now = performance.now();
      if (a.key !== key && (a.delayUntil == null || first || jump)) a.delayUntil = now + (first || jump ? 0 : a.delay * 1000);   // mỗi người lệch vài giây, không đi cùng lúc
      if (a.key !== key && now >= a.delayUntil) {
        a.key = key; a.delayUntil = null; a.wander = !tg || ['rachoi', 'clb', 'bien', 'cnrung', 'cnbong', 'sukien'].includes(p);
        if (tg === null && !(a.id in ROUND)) { a.visible = false; a.path = []; continue; }
        if (tg === 'home' || tg === 'gate') {
          const dst = tg === 'home' ? a.home : GATE;
          if (!a.visible || first || jump) { a.visible = false; a.path = []; if (a.student) placeAt(a, dst); continue; }
          go(a, dst); a.leaving = true; continue;
        }
        const dst = tg || ROUND[a.id][(Math.random() * ROUND[a.id].length) | 0];
        if (!a.visible) { a.visible = true; a.leaving = false; placeAt(a, first || jump ? dst : a.student && a.home ? a.home : GATE); if (first || jump) continue; }
        a.leaving = false; if (first || jump) placeAt(a, dst); else go(a, dst);
      }
      if (!a.visible) continue;
      // đi theo đường; 1,618 m/s ≈ 32 px/s (S = 0,05 m/px), xe đạp & khu phía đông nhanh hơn φ lần
      a.moving = false;
      if (a.path.length) {
        const q = a.path[0], dx = q[0] - a.x, dy = q[1] - a.y, dd = Math.hypot(dx, dy), sp = 32 * (a.leaving && a.bike || side(a.x) === 'E' ? 1.618 : 1), st = sp * dt;
        if (dd <= st) { a.x = q[0]; a.y = q[1]; a.path.shift(); } else { a.x += dx / dd * st; a.y += dy / dd * st; }
        if (Math.abs(dx) > 0.5) a.dir = dx < 0 ? -1 : 1; a.moving = true;
        if (!a.path.length && a.leaving) { a.visible = false; a.leaving = false; }
        continue;
      }
      // giờ chơi / đi tuần: lang thang quanh đích (bán kính 1/φ của 100 px), nghỉ 8–21 s (Fibonacci)
      if (a.wander && performance.now() > a.wanderAt) {
        a.wanderAt = performance.now() + (8 + Math.random() * 13) * 1000;
        if (a.id in ROUND && !targetOf(a, p, t)) go(a, ROUND[a.id][(Math.random() * ROUND[a.id].length) | 0]);
        else if (a.goal) { const g = a.goal, nx = g[0] + (Math.random() - 0.5) * 124, ny = g[1] + (Math.random() - 0.5) * 124; if (regionAt(nx, ny) === regionAt(g[0], g[1])) a.path = [[nx, ny]]; }
      }
    }
    first = false;
    updateNpcs(dt);
  }

  // ---------- khách / người dân (NPC) ----------
  const NPC_LOOKS = [['#ff6f91', '#1d2c52', '#2a1a12'], ['#26c6da', '#33334a', '#1a1a1a'], ['#ffd23f', '#5a3a1e', '#3a2418'], ['#8e24aa', '#222222', '#120d0a'], ['#43a047', '#455a64', '#5a3a1a'], ['#fb8c00', '#263238', '#1c140f'], ['#f4f4f4', '#1565c0', '#2b1d14'], ['#e53935', '#37474f', '#1a1010']];
  const mkNpc = (kind, o, i) => { const l = NPC_LOOKS[i % NPC_LOOKS.length]; return Object.assign({ kind, x: 0, y: 0, shirt: l[0], pants: l[1], hair: l[2], skin: SKINS[i % SKINS.length], dir: 1, moving: false, long: i % 3 === 0, idx: i, t: 0, sp: 0 }, o); };
  const trailPt = (t, r) => { const w = r.x1 - r.x0, h = r.y1 - r.y0, L = 2 * (w + h); let s = (((t % 1) + 1) % 1) * L; if (s < w) return [r.x0 + s, r.y0, 1]; s -= w; if (s < h) return [r.x1, r.y0 + s, 1]; s -= h; if (s < w) return [r.x1 - s, r.y1, -1]; s -= w; return [r.x0, r.y1 - s, -1]; };
  const npcs = [];
  for (let i = 0; i < 12; i++) npcs.push(mkNpc('swim', { x0: 1420 + i * 320, y0: 918 + (i % 3) * 24 }, i));
  for (let i = 0; i < 9; i++) npcs.push(mkNpc('surf', { x0: 1500 + i * 400 }, i + 3));
  for (let i = 0; i < 16; i++) { const x = 1400 + i * 240 + (i % 2) * 50; if (x > 1640 && x < 2580) continue; npcs.push(mkNpc('sun', { x, y: 834 + (i % 3) * 14 }, i + 1)); }
  for (let i = 0; i < 8; i++) npcs.push(mkNpc('bike', { t: i / 8, sp: 0.012 + (i % 3) * 0.002 }, i + 2));
  TENTS.forEach((tn, i) => npcs.push(mkNpc('camp', { x: tn[0] - 18, y: tn[1] + 14 }, i + 4)));
  for (let i = 0; i < 6; i++) npcs.push(mkNpc('picnic', { x: R.picnic.x + 30 + (i % 3) * 86, y: R.picnic.y + 50 + Math.floor(i / 3) * 80 }, i + 5));
  for (let i = 0; i < 5; i++) { const a = 0.5 + i * 1.25; npcs.push(mkNpc('fishing', { x: LAKE.cx + Math.cos(a) * (LAKE.rx + 12), y: LAKE.cy + Math.sin(a) * (LAKE.ry + 10), a }, i + 6)); }
  for (let i = 0; i < 6; i++) npcs.push(mkNpc('walk', { t: i / 6, sp: 0.006 + (i % 2) * 0.002 }, i + 7));
  for (let i = 0; i < 6; i++) npcs.push(mkNpc('kite', { x0: 1500 + i * 600 }, i + 2));
  for (let i = 0; i < 4; i++) { const a = 0.4 + i * 0.8; npcs.push(mkNpc('fishing', { x: POND.cx + Math.cos(a) * (POND.rx + 12), y: Math.min(-40, POND.cy + Math.sin(a) * (POND.ry + 10)), a }, i + 3)); }
  let realT = 0;
  function updateNpcs(dt) {
    realT += dt; const gd = R.garden, GR = { x0: gd.x - 10, x1: gd.x + gd.w + 10, y0: gd.y - 8, y1: gd.y + gd.h + 8 };
    npcs.forEach((n, i) => {
      n.t += dt * n.sp;
      if (n.kind === 'swim') { n.x = n.x0 + Math.sin(realT * 0.3 + i) * 40; n.y = n.y0 + Math.sin(realT * 1.3 + i) * 3; n.dir = Math.cos(realT * 0.3 + i) > 0 ? 1 : -1; }
      else if (n.kind === 'surf') { const ph = (realT * 0.07 + i * 0.17) % 1; if (ph < 0.45) { const k = ph / 0.45; n.y = 1070 - k * 170; n.x = n.x0 + k * 90; n.dir = 1; } else { const k = (ph - 0.45) / 0.55; n.y = 900 + k * 170; n.x = n.x0 + 90 - k * 90; n.dir = -1; } }
      else if (n.kind === 'kite') { const ph = realT * 0.05 + i * 0.3; n.x = n.x0 + Math.sin(ph) * 380; n.dir = Math.cos(ph) > 0 ? 1 : -1; n.y = 966 + Math.sin(ph * 3) * 16; }
      else if (n.kind === 'bike') { const [x, y, d] = trailPt(n.t, TRAIL); n.x = x; n.y = y; n.dir = d; n.moving = true; }
      else if (n.kind === 'walk') { const [x, y, d] = trailPt(n.t, GR); n.x = x; n.y = y; n.dir = d; n.moving = true; }
    });
  }
  function npcShown(n) {
    const t = clock.minutes, light = t > 400 && t < 1080;
    if (n.kind === 'swim' || n.kind === 'surf' || n.kind === 'sun' || n.kind === 'kite') return light && clock.season !== 'dong';
    if (n.kind === 'camp') return true;
    return light;
  }
  return { agents, staff, students, npcs, npcShown, update, A };
}
