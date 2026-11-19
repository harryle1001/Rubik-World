// sea/index.js — THẾ GIỚI ĐẠI DƯƠNG: ghép các phần.
//   site.js    số liệu bố cục (làng chài, luồng tàu, tuyến phà — theo φ / Fibonacci)
//   fleet.js   đội tàu thuyền chạy tuyến: thúng, ghe có mắt, buồm, ca nô, tàu hàng, tàu du lịch, phà, phao tiêu; bọt đuôi, đèn đêm, còi
//   village.js Làng chài Vịnh Én: cầu tàu, nhà sàn, lưới phơi, cá khô, chợ cá sáng, lồng bè, giàn rong, cầu phà Resort
//   folk.js    ngư dân theo giờ + người câu cá, nói chuyện, ngồi câu cạnh, thi câu
//   pilot.js   người chơi lái thuyền buồm theo gió / ca nô, đi nhờ phà
//   wild.js    cá heo theo thuyền, cá voi phun nước, hải âu theo ghe, rùa, sương sớm, sóng giông
// Gỡ lỗi: __island.sea (fleet.vessels, fleet.ferry, pilot.boats, wild.debug.whale(), folk.folk…)
import { createFleet } from './fleet.js';
import { createVillage } from './village.js';
import { createFolk } from './folk.js';
import { createPilot } from './pilot.js';
import { createWild } from './wild.js';
import { BAY, NAME, STOPS, FERRY_PATH, toW, PIER_V, PIER_U0, PIER_U1, CAGES, SEAWEED, RESORT_JETTY } from './site.js';

export function createSea(ctx) {
  const village = createVillage(ctx);
  const fleet = createFleet(ctx);
  const folk = createFolk(ctx, { village, fleet });
  const pilot = createPilot(ctx, { fleet });
  const wild = createWild(ctx, { fleet, pilot, village });

  // ----- bản đồ: địa danh + tuyến phà + tàu đang chạy (world-map.js đọc ctx.mapPlaces / ctx.mapLayers) -----
  (ctx.mapPlaces = ctx.mapPlaces || []).push(
    { n: NAME, x: BAY.O[0] - BAY.D[0] * 8, z: BAY.O[1] - BAY.D[1] * 8, ic: '⚓' },
    { n: 'Bến phà Làng chài', x: STOPS[0].land[0], z: STOPS[0].land[1], ic: '⛴️' },
    { n: 'Bến phà Làng nổi', x: STOPS[1].land[0], z: STOPS[1].land[1], ic: '⛴️' },
    { n: 'Bến phà Resort', x: STOPS[2].land[0], z: STOPS[2].land[1], ic: '⛴️' },
    { n: 'Lồng bè nuôi cá', x: toW(CAGES.u, CAGES.v)[0], z: toW(CAGES.u, CAGES.v)[1], ic: '🐟' });
  const ICON = { liner: '🛳️', cargo: '🚢', ferry: '⛴️', sailA: '⛵', sailB: '⛵', speed: '🚤', ghe: '🛥️', thung: '🛶' };
  (ctx.mapLayers = ctx.mapLayers || []).push((g, sx, sy, zoom) => {
    // cầu tàu làng chài + cầu phà Resort
    g.strokeStyle = '#8a5a34'; g.lineCap = 'butt'; g.lineWidth = Math.max(2, 3 * zoom);
    const seg = (a, b) => { g.beginPath(); g.moveTo(sx(a[0]), sy(a[1])); g.lineTo(sx(b[0]), sy(b[1])); g.stroke(); };
    seg(toW(PIER_U0, PIER_V), toW(PIER_U1, PIER_V)); seg(toW(PIER_U1 - 2.5, PIER_V - 10.5), toW(PIER_U1 - 2.5, PIER_V + 10.5));
    seg([RESORT_JETTY.x1, RESORT_JETTY.z], [RESORT_JETTY.x0, RESORT_JETTY.z]); seg([RESORT_JETTY.x0 + 2.5, RESORT_JETTY.z - 10.5], [RESORT_JETTY.x0 + 2.5, RESORT_JETTY.z + 10.5]);
    // tuyến phà (nét đứt)
    g.setLineDash([6, 6]); g.lineWidth = 2; g.strokeStyle = 'rgba(255,243,214,.85)'; g.beginPath(); const q = [0, 0], P = fleet.ferry.path;
    for (let s = 0; s <= P.L; s += 13) { P.at(s, q); if (s === 0) g.moveTo(sx(q[0]), sy(q[1])); else g.lineTo(sx(q[0]), sy(q[1])); } g.closePath(); g.stroke(); g.setLineDash([]);
    // tàu thuyền
    g.font = `${Math.round(Math.max(13, Math.min(21, 5 * zoom)))}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const v of fleet.vessels) { const ic = ICON[v.kind]; if (ic && !(v.kind === 'thung' && zoom < 3)) g.fillText(ic, sx(v.x), sy(v.z)); }
  });

  // ----- chào khi tới làng chài lần đầu trong phiên -----
  let greeted = false;
  function update(dt, t) {
    fleet.update(dt, t);
    village.update(dt, t);
    pilot.update(dt, t);
    folk.update(dt, t);
    wild.update(dt, t);
    if (!greeted) { const p = ctx.player.pos; if (Math.hypot(p.x - BAY.O[0], p.z - BAY.O[1]) < 55 && ctx.school && ctx.school.ready) { greeted = true; ctx.toast(`⚓ <b>${NAME}</b> — làng của ngư dân: chợ cá họp lúc rạng sáng, ghe ra khơi sớm và về bến buổi chiều. Ra cầu tàu đi <b>phà</b>, lái <b>thuyền buồm</b> hay ngồi <b>câu cá</b> nhé!`, 7000); } }
  }
  return { update, fleet, village, folk, pilot, wild };
}
void FERRY_PATH; void SEAWEED;
