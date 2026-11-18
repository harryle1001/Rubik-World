// train/index.js — TÀU PHA LÊ: nối tuyến tàu hơi nước vào thế giới (sau academy: cần độ cao đảo Học viện).
// - Độ cao: bọc terrain.heightAt thêm đảo Đồi Thông; mặt đi thêm: sân ga / nền ga (ctx.groundExtra).
// - Dựng 1 lần: tuyến chia khúc 144 m (LOD tà vẹt), 2 ga, đoàn tàu; rừng thông dùng instancing chung.
import { ISLET, ISLET_BOUND, isletHeight, nearest, at, S_A, S_B } from './route.js';
import { buildTrack, plantIslet } from './track.js';
import { buildStations, stationGround } from './stations.js';
import { createConsist } from './consist.js';
import { createRide } from './ride.js';

export function createTrain(ctx) {
  const { terrain, player } = ctx;
  const base = terrain.heightAt, [ix, iz] = ISLET.c, IB2 = ISLET_BOUND * ISLET_BOUND;
  terrain.heightAt = (x, z) => { const dx = x - ix, dz = z - iz; return dx * dx + dz * dz < IB2 ? Math.max(base(x, z), isletHeight(x, z)) : base(x, z); };
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => { const h = prevExtra ? prevExtra(x, z, y) : -99, g = stationGround(x, z); return g === null ? h : Math.max(h, g); };
  const prevZone = ctx.zoneAt;
  ctx.zoneAt = (x, z) => Math.hypot(x - ix, z - iz) < ISLET.r ? 'Đảo Đồi Thông' : prevZone ? prevZone(x, z) : null;
  (ctx.flyZones = ctx.flyZones || []).push((x, z) => Math.hypot(x - ix, z - iz) < ISLET_BOUND + 89);

  const track = buildTrack(ctx, terrain.heightAt);
  plantIslet(ctx, nearest);
  const stations = buildStations(ctx);
  const consist = createConsist(ctx);
  const ride = createRide(ctx, { consist });
  const pA = at(S_A), pB = at(S_B);
  let relT = 0, lastPhase = '';
  function update(dt) {
    ride.update(dt); track.update(); stations.update(dt);
    if (ride.state.phase !== lastPhase) { if (ride.state.phase === 'run') stations.cheer(); lastPhase = ride.state.phase; }   // học sinh trên sân ga vẫy chào
    if ((relT += dt) > 1) {   // tàu về ga gần người chơi (cả 2 ga đều ngoài tầm mắt: ga gần > 200 m, ga xa > 377 m)
      relT = 0; const p = player.pos, dA = Math.hypot(p.x - pA.x, p.z - pA.z), dB = Math.hypot(p.x - pB.x, p.z - pB.z);
      if (Math.min(dA, dB) > 200 && Math.max(dA, dB) > 377) ride.relocate(dA < dB ? 'A' : 'B');
    }
  }
  return { update, ride, consist, track, stations };
}
