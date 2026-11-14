// characters.js — Nhân vật KayKit (CC0) có 14 animation: đứng, đi, chạy, nhảy, reo mừng, tương tác…
// Dùng cho người chơi và người chơi khác. Đổi bộ đồ: KINDS. Đổi animation theo trạng thái: driveHero().
import * as THREE from 'three';
import { loadAnimated, animator } from './models.js';
import { addOutline } from './style.js';

export const KINDS = ['hero-knight', 'hero-rogue', 'hero-mage', 'hero-barbarian'];
const PREFIX = { 'hero-knight': 'Knight', 'hero-rogue': 'Rogue', 'hero-mage': 'Mage', 'hero-barbarian': 'Barbarian' };
const HEIGHT = 1.8; // chiều cao nhân vật (m)

// Nạp nhân vật, ẩn vũ khí (game cho trẻ em), chỉnh cỡ, thêm viền. Trả về { model, anim } hoặc null nếu thiếu file.
export async function loadHero(kind) {
  const g = await loadAnimated(kind); if (!g) return null;
  const model = g.scene, pre = PREFIX[kind] || '';
  model.traverse(o => { if (o.isMesh && !o.name.startsWith(pre)) o.visible = false; });
  model.updateMatrixWorld(true);
  const box = new THREE.Box3(); model.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
  const h = box.max.y - box.min.y; if (h > 0.1 && h < 50) model.scale.setScalar(HEIGHT / h);
  addOutline(model);
  return { model, anim: animator(model, g.animations) };
}

// Chọn animation theo trạng thái di chuyển (dùng chung cho mình và người khác)
export function driveHero(a, { speed, grounded, walk = 5.5, oneShot }) {
  if (oneShot && oneShot.until > performance.now()) return;
  if (!grounded) { a.play('Jump_Idle', 0.15); return; }
  if (speed > walk * 1.15) { const r = a.play('Running_A', 0.2); if (r) r.timeScale = Math.min(1.5, speed / 8); }
  else if (speed > 0.4) { const w = a.play('Walking_A', 0.2); if (w) w.timeScale = Math.max(0.6, speed / 3.2); }
  else a.play('Idle', 0.3);
}

// Chạy 1 animation một lần (Cheer, Interact, PickUp…) rồi quay lại animation di chuyển
export function emote(a, state, name) {
  const act = a.play(name, 0.15, true); if (!act) return;
  state.oneShot = { until: performance.now() + act.getClip().duration * 1000 / (act.timeScale || 1) - 150 };
}
