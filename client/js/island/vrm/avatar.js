// vrm/avatar.js — Hồ sơ nhân vật anime của người chơi: đọc/ghi (tài khoản data/account.js, khách lưu máy), mặc định theo kiểu chibi cũ.
import { HAIR, EYES } from './vrm-hero.js';
const KEY = 'island.avatar';
const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
// mặc định: suy từ kiểu học sinh chibi (heroKind) để người cũ không bị đổi giới tính/màu bất ngờ
export function defaultAvatar(kind = 'student-male-a') {
  const f = /female/.test(kind), k = hash(kind);
  return { base: f ? (k % 2 ? 'shibu' : 'shino') : 'hair-m', hair: HAIR[k % 4], eye: EYES[k % EYES.length], skin: k % 3, glasses: k % 5 === 0 ? 'round' : 'none', hat: false, house: 'long', mode: 'vrm' };
}
export function loadAvatar(ctx) {
  const a = ctx.account && ctx.account.avatar; if (a) return { ...defaultAvatar(ctx.heroKind), ...a };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { ...defaultAvatar(ctx.heroKind), ...s }; } catch (e) {}
  return defaultAvatar(ctx.heroKind);
}
export function saveAvatar(ctx, a) {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  if (ctx.account && ctx.account.profile) ctx.account.setAvatar(a);
}
// nhà đang mặc: nhà thật (lễ chọn nhà) ưu tiên hơn nhà chọn thử trong trình tạo
export const houseOf = (ctx, a) => (ctx.account && ctx.account.house) || a.house || 'long';
// máy yếu → giữ nhân vật chibi (ít RAM / ít nhân CPU / ?low / chất lượng tự hạ xuống thấp nhất)
export function weakDevice() {
  const q = new URLSearchParams(location.search);
  if (q.has('novrm')) return true; if (q.has('vrm')) return q.get('vrm') === '0';   // ?novrm hoặc ?vrm=0: luôn chibi
  if (q.has('low')) return true;
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  return (mem && mem <= 2) || (cores && cores <= 2);
}
