// train/camera.js — ĐẠO DIỄN CAMERA cho chuyến tàu (cắt cảnh như phim, mỗi cảnh có chuyển động riêng):
//  depart  · trên sân ga, thấp, nhìn đầu máy phì khói lăn bánh            arrive · sân ga đến, nhìn tàu vào ga
//  window  · trong toa, qua vai bạn nhìn ra cửa sổ (biển, vách lâu đài)    aerial · flycam trên cao bám theo đoàn tàu
//  track   · máy đặt ven đường trong rừng thông, lia theo đầu máy          cab    · trên buồng lái nhìn tới: vào hầm tối → ra hầm,
//  wide    · máy thấp sát mặt biển, cầu cạn vòm đá chạy về phía lâu đài      lâu đài hiện dần trong sương (khoảnh khắc "wow")
// Nút 🎥 đổi: Tự động → Cửa sổ → Trên cao → Buồng lái.
import * as THREE from 'three';
import { T, dampV3 } from '../motion.js';
import { at, nearest, TUNNEL, LEN } from './route.js';
import { FLOOR } from './consist.js';
import { EDGE } from './stations.js';

export const MODES = ['auto', 'window', 'aerial', 'cab'];
export const MODE_NAME = { auto: '🎬 Tự động', window: '🪟 Cửa sổ', aerial: '🚁 Trên cao', cab: '🚂 Buồng lái' };

export function createDirector(ctx, consist) {
  const { camera, terrain } = ctx;
  const pos = new THREE.Vector3(), look = new THREE.Vector3(), pv = new THREE.Vector3(), lv = new THREE.Vector3();
  const want = new THREE.Vector3(), wlook = new THREE.Vector3(), v = new THREE.Vector3(), p = {}, q = {};
  let shot = null, key = '', fixed = null, fov0 = null;
  // overlay: tối trong hầm + chữ tiêu đề
  const dark = document.createElement('div');
  dark.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:25;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse at 50% 46%,rgba(10,8,14,.15) 0%,rgba(10,8,14,.78) 62%,rgba(6,5,9,.95) 100%)';
  const title = document.createElement('div');
  title.innerHTML = '<div style="font:600 13px system-ui;letter-spacing:.5em;opacity:.8">TỚI</div><div style="font:600 clamp(28px,7vw,55px) Georgia,serif;letter-spacing:.21em;margin:.2em 0">HỌC VIỆN PHA LÊ</div><div style="font:italic 15px Georgia,serif;opacity:.85">lâu đài hiện ra trong sương sớm…</div>';
  title.style.cssText = 'position:fixed;left:0;right:0;top:30%;text-align:center;color:#fff6e3;text-shadow:0 2px 13px #0009;pointer-events:none;z-index:27;opacity:0;transition:opacity 1.6s';
  document.body.append(dark, title);
  let titleT = 0;

  const loco = () => consist.cars[0].o;
  const local = (o, x, y, z, out) => out.set(x, y, z).applyMatrix4(o.matrixWorld);
  const fwdOf = o => v.set(0, 0, 1).applyQuaternion(o.quaternion);
  // vị trí trên tuyến lệch ngang (+ trái theo chiều s tăng), cao y
  const route = (s, lat, y, out) => { at(Math.min(LEN, Math.max(0, s)), p); return out.set(p.x - p.tz * lat, y ?? p.y, p.z + p.tx * lat); };

  function pick(R) {   // R: { s (đầu tàu), dir, t, left (m còn lại), sFrom, sTo, park }
    if (R.mode !== 'auto') return R.mode;
    if (R.t < 10) return 'depart';
    if (R.left < 77) return 'arrive';
    const s = R.s, t0 = TUNNEL.s0, t1 = TUNNEL.s1;
    if (R.dir > 0 ? s > t0 - 34 && s < t1 + 89 : s > t0 - 89 && s < t1 + 34) return 'cab';
    if (s < 185) return 'window';
    if (s < 330) return 'aerial';
    if (s < t0) return 'track';
    if (s < 760) return 'wide';
    if (s < 1000) return 'aerial2';
    return 'window';
  }

  function update(dt, R) {
    const type = pick(R), L = loco(); L.updateMatrixWorld();
    let cut = false;
    if (type !== key) { key = type; cut = true; fixed = null; }
    const seat = consist.cars[R.seatCar].o;
    let inCar = false, fov = 50;
    switch (type) {
      case 'depart': case 'arrive': {   // máy trên sân ga
        const P = type === 'depart' ? R.from : R.to, sEnd = type === 'depart' ? R.sFrom + R.dir * 21 : R.sTo + R.dir * 9;
        route(sEnd, P.side * (EDGE + 2.4), P.top + 1.15, want);
        local(L, 0, 2.2, 1.5, wlook); fov = 46; break;
      }
      case 'window': {   // qua vai nhìn ra cửa sổ bên trái (ngồi ghế cạnh cửa sổ)
        seat.updateMatrixWorld(); local(seat, 0.38, FLOOR + 1.34, 0.55, want); local(seat, -6, FLOOR + 0.7, 3.2, wlook); inCar = true; fov = 58; cut = cut || !fixed; fixed = 1; break;
      }
      case 'cab': {
        local(L, -1.55, 3.3, -2.6, want); local(L, -1.2, 3.1, 55, wlook); fov = 55;   // nghiêng ra mép trái buồng lái: khói không che
        // vừa ra hầm (đi Học viện): ngước lên nhìn lâu đài
        if (R.dir > 0 && R.s > TUNNEL.s1 + 8) { const k = Math.min(1, (R.s - TUNNEL.s1 - 8) / 34); wlook.y += k * 13; }
        break;
      }
      case 'aerial': case 'aerial2': {
        const f = fwdOf(L), sd = type === 'aerial' ? 1 : -1;
        want.copy(L.position).addScaledVector(f, -30).add(v.set(f.z * 21 * sd, 21, -f.x * 21 * sd));
        consist.cars[3].o.getWorldPosition(wlook); wlook.y += 1; fov = 48; break;
      }
      case 'track': {   // máy cố định ven đường ray phía trước, đổi chỗ khi tàu đã qua
        if (!fixed || (R.s - fixed.s) * R.dir > 13) {
          const s = R.s + R.dir * 55; let best = null;
          for (const lat of [10, -10, 14, -14]) { route(s, lat, 0, want); const g = terrain.heightAt(want.x, want.z), yr = at(s).y; if (!best || g < best.g) best = { lat, g, yr }; }
          route(s, best.lat, Math.max(best.g, best.yr - 0.5) + 1.5, want); fixed = { s, p: want.clone() }; cut = true;
        }
        want.copy(fixed.p); local(L, 0, 2.4, 2, wlook); fov = 42; break;
      }
      case 'wide': {   // thấp sát mặt biển, sau–bên đoàn tàu: vòm cầu chạy về phía lâu đài
        if (!fixed || (R.s - fixed.s) * R.dir > 144) {
          const s = R.s + R.dir * 34; route(s, -55, 6, want); fixed = { s, p: want.clone() }; cut = true;
        }
        want.copy(fixed.p); L.getWorldPosition(wlook); wlook.addScaledVector(fwdOf(L), 21); wlook.y += 2; fov = 50; break;
      }
    }
    if (cut || type === 'window' || type === 'cab') { pos.copy(want); look.copy(wlook); pv.set(0, 0, 0); lv.set(0, 0, 0); }
    else { dampV3(pos, want, pv, type.startsWith('aerial') ? T.soft : T.quick, dt); dampV3(look, wlook, lv, T.quick, dt); }
    camera.position.copy(pos); camera.lookAt(look);
    if (innerHeight > innerWidth) fov *= 1.38;   // màn dọc: mở rộng góc (giống player.js)
    if (fov0 === null) fov0 = camera.fov;
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * (cut ? 1 : Math.min(1, dt * 3)); camera.updateProjectionMatrix(); }
    // camera trong hầm → tối; ra hầm đi Học viện → chữ tiêu đề
    const nq = nearest(camera.position.x, camera.position.z, TUNNEL.s0 - 30, TUNNEL.s1 + 30), inTun = nq.s > TUNNEL.s0 + 2 && nq.s < TUNNEL.s1 - 2 && nq.dist < 4 && camera.position.y < nq.y + 6;
    dark.style.opacity = inTun ? 1 : 0;
    if (R.dir > 0 && !R.titled && R.s > TUNNEL.s1 + 13) { R.titled = true; titleT = 6.5; title.style.opacity = 1; }
    if (titleT > 0 && (titleT -= dt) <= 0) title.style.opacity = 0;
    consist.setHideGlow(inCar ? R.seatCar - 2 : -1);
    return { inCar, inTun, type };
  }
  function reset() { key = ''; fixed = null; dark.style.opacity = 0; title.style.opacity = 0; titleT = 0; consist.setHideGlow(-1); if (fov0 !== null) { camera.fov = fov0; camera.updateProjectionMatrix(); fov0 = null; } }
  return { update, reset };
}
