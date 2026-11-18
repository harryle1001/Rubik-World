// index.js — Lớp dữ liệu riêng của đảo 3D (thay cho window.RS của iframe game 2D trước đây).
// createSchoolData(ctx) trả về đối tượng cùng hình dạng các trường RS mà module dựng 3D đang dùng
// (R, regionAt, doors(), GATE, HOUSES, hằng số bản đồ, agents/npcs/npcShown, clock) nhưng chỉ đọc từ data/.
import * as MAP from './map.js';
import { createClock } from './clock.js';
import { createPeople } from './people.js';
export { MAP };

export function createSchoolData(ctx) {
  const clock = createClock(ctx), people = createPeople(clock);
  const RS = Object.assign({}, MAP, {
    doors: () => MAP.DOORS,
    agents: people.agents, npcs: people.npcs, npcShown: people.npcShown,
    get clock() { return clock.minutes; },
  });
  return { RS, clock, people, update(dt) { clock.update(dt); people.update(dt); } };
}
