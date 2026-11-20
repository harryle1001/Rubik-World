// classes/common.js — ĐỒ DÙNG CHUNG cho các LỚP HỌC PHÉP THUẬT (mỗi lớp = 1 mini game 3–5 phút qua khung mg/host.js).
//  prop()      nạp model CC0 sẵn có (assets/models/kit: KayKit, Kenney, Quaternius) — đánh dấu dùng chung để host không dispose cache.
//  room()      sàn lớp tròn bán kính 8 m (Fibonacci) + bảng đen + bàn học: dựng 1 lần, ít draw call (Batch tô màu đỉnh).
//  teacher()   thầy cô NPC đứng cạnh bảng, nói 2–3 câu (bong bóng + dòng chữ HUD).
//  ask()       câu hỏi 4 lựa chọn nổi phía dưới, chạm được trên điện thoại; trả Promise<boolean>.
//  finish()    thẻ kết quả (api.end) + đồng vàng (ctx.account) + điểm nhà (hook) + ghi vào Sổ học tập.
//  addHousePoints(ctx, n, lý do) — HOOK điểm nhà: nếu hệ thống nhà (ctx.houses.addPoints) có thì gọi, không thì bỏ qua.
import * as THREE from 'three';
import { loadModel } from '../../models.js';
import { Batch } from '../geo.js';
import { matV } from '../../sample/palette.js';
import { qcard, closeQ } from '../../quiz-ui.js';

export const PHI = (1 + Math.sqrt(5)) / 2;
export const ROOM_R = 8;

export async function prop(api, name, x = 0, y = 0, z = 0, s = 1, ry = 0, parent = api.root) {
  const m = await loadModel('kit/' + name); if (!m || !api.root.parent) return null;
  m.traverse(o => { if (o.geometry) o.geometry.userData.shared = true; for (const mm of [].concat(o.material || [])) mm.userData.shared = true; });
  m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = ry; parent.add(m); return m;
}

/** sàn lớp + bảng đen (phía -z) + dãy bàn; trả { board(text lines) } để viết lên bảng */
export function room(api, { floor = '#8d857a', rug = '#6b3b5a', desks = 3, wall = true } = {}) {
  const R = ROOM_R, b = new Batch();
  b.cyl(0, -0.3, 0, R, 0.42, floor, 34);                                        // bục lớp cao 0,12 m
  b.add(new THREE.RingGeometry(R / PHI - 0.4, R / PHI, 34).rotateX(-Math.PI / 2), rug, 0, 0.13, 0);
  if (wall) {                                                                    // tường vòng cung sau bảng: 13 tấm, phủ 1/φ² vòng tròn
    const a0 = Math.PI / (PHI * PHI);
    for (let i = 0; i < 13; i++) { const a = Math.PI - a0 + (i + 0.5) * 2 * a0 / 13; b.add(new THREE.BoxGeometry(2 * R * Math.sin(a0 / 13) + 0.05, 3.4, 0.3), '#7f7a73', R * Math.sin(a), 1.82, R * Math.cos(a), a); }
    b.box(-2.6, 2.6, 0.9, 2.6, -R + 0.32, -R + 0.42, '#4a3424');                 // khung bảng 5,2 × 1,7 m
  }
  const m = new THREE.Mesh(b.build(), matV()); m.receiveShadow = true; api.root.add(m);
  // bảng đen: canvas (viết đề bài)
  const c = document.createElement('canvas'); c.width = 1024; c.height = 335; const k = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.62), new THREE.MeshBasicMaterial({ map: tex })); bd.position.set(0, 1.75, -R + 0.45); api.root.add(bd);
  const board = (...lines) => { k.fillStyle = '#20382c'; k.fillRect(0, 0, 1024, 335); k.fillStyle = '#f3efe6'; k.textAlign = 'center'; k.textBaseline = 'middle';
    lines.forEach((t, i) => { k.font = i ? '600 46px system-ui' : 'bold 58px system-ui'; k.fillText(t, 512, 335 * (i + 1) / (lines.length + 1), 980); }); tex.needsUpdate = true; };
  board('');
  for (let i = 0; i < desks; i++) prop(api, 'school_desk', (i - (desks - 1) / 2) * 2.1, 0.12, R - 1.6, 1, Math.PI);
  return { board, mesh: m };
}

/** thầy cô NPC: look = { shirt, pants, aodai, glasses, hair }; nói lần lượt lines rồi resolve actor */
export async function teacher(api, kind, name, look, lines, at = [-3.4, -R_T]) {
  const a = await api.actor(kind, { name, height: 1.62, look: { role: 'teacher', ...look } }); if (!a) return null;
  a.place(at[0], at[1], 0); a.face(0, 0);
  for (const t of lines) { if (!api.root.parent) break; a.say(t, 3400); api.hud.msg(`<b>${name}:</b> ${t}`, 3400); a.emote('interact'); await wait(3500); }
  return a;
}
const R_T = ROOM_R - 2.2;
export const wait = ms => new Promise(r => setTimeout(r, ms));

/** q = { q, choices, a, explain } → Promise<boolean>; xáo thứ tự lựa chọn */
export function ask(api, q) {
  const order = q.choices.map((_, i) => i).sort(() => Math.random() - 0.5);
  return qcard({ tag: 'class', ava: '🧑‍🏫', title: 'Câu hỏi của thầy cô', q: q.q, choices: order.map(i => q.choices[i]), a: order.indexOf(q.a), explain: q.explain || '', next: false, ms: [1300, 3400],
    onClose: () => api.exit(),   // ✕ = rời lớp học
    onPick: ok => { dispatchEvent(new CustomEvent('rw-learn', { detail: { s: q.subject || 'Học viện', ok } })); api.sfx(ok ? 'win' : 'ui'); } }).then(r => !!(r && r.ok));
}

/** gỡ câu hỏi còn treo (gọi trong dispose của game) */
export const cleanup = () => { document.querySelectorAll('#mgHud .cl-q').forEach(e => e.remove()); closeQ('class'); };

/** HOOK điểm nhà Tứ Linh — để trống khi chưa có hệ thống nhà (nhánh academy-houses). */
export function addHousePoints(ctx, n, reason) { try { if (ctx.houses && ctx.houses.addPoints) return ctx.houses.addPoints(n, reason); } catch (e) { console.warn(e); } return null; }

/** kết thúc lớp: score/max → đồng vàng = 3·số sao (Fibonacci), điểm nhà = 5·số sao */
export function finish(ctx, api, { score, max, title, text = '' }) {
  const stars = score >= max ? 3 : score >= max * 0.618 ? 2 : score > 0 ? 1 : 0, coins = [0, 3, 8, 13][stars], house = [0, 5, 8, 13][stars];
  if (coins && ctx.account && ctx.account.addCoins) ctx.account.addCoins(coins);
  if (house) addHousePoints(ctx, house, title);
  api.end({ score, title: `${title} ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}`, text: `${text}<br>🪙 +${coins} đồng vàng · 🏰 +${house} điểm nhà` });
}

/** sprite chữ nhỏ (nhãn trên vật) */
export function label(text, w = 3.2, col = '#ffe3a0') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
  k.font = 'bold 40px system-ui'; k.fillStyle = 'rgba(27,22,38,.8)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = col; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 49, 460);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); s.scale.set(w, w * 96 / 512, 1); return s;
}
