// scan-plants.js — Quét toàn bản đồ đảo 3D: đếm cây/đá/hoa/dừa mọc trùng nhà, tường, nền công trình, mặt đường, lô đất.
// Chạy: node server/index.js  (cửa sổ khác)  rồi  node scripts/scan-plants.js  → in số vật trùng (mong muốn = 0).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 640, height: 400 } });
  p.on('pageerror', e => console.log('Lỗi trang:', e.message));
  await p.goto('http://localhost:' + (process.env.PORT || 3000) + '/ocean.html');
  await p.waitForFunction(() => window.__island && window.__island.school && window.__island.school.ready, null, { timeout: 150000 });
  const r = await p.evaluate(async () => {
    const L = await import('/js/island/layout.js'), I = window.__island, A = I.school.arch;
    const inBox = (x, z, m) => I.boxes.find(q => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m);
    const inFoot = (x, z, m) => A.foot.find(q => x > q[0] - m && x < q[2] + m && z > q[1] - m && z < q[3] + m) || A.footC.find(([cx, cz, rr]) => Math.hypot(x - cx, z - cz) < rr + m);
    const why = (x, z, m, wild) => inBox(x, z, m) ? 'tường/nhà' : inFoot(x, z, m) ? 'nền công trình' : L.houseAt(x, z, m) ? 'nhà trong lô' : (L.roadDist(x, z) < L.ROAD_W / 2 + m || L.pathDist(x, z) < L.PATH_W / 2 + m) ? 'mặt đường' : (wild && L.lotAt(x, z, m)) ? 'lô đất' : (wild && L.landDist(x, z) <= m) ? 'trong khu' : null;
    const out = { tong: 0, trung: 0, loai: {}, viDu: [] };
    const check = (list, wild) => { for (const [x, z, rr, k] of list) { out.tong++; const w = why(x, z, Math.min(rr, 1.2) * 0.8, wild); if (w) { out.trung++; out.loai[w] = (out.loai[w] || 0) + 1; if (out.viDu.length < 8) out.viDu.push([k, x.toFixed(1), z.toFixed(1), w]); } } };
    check(I.terrain.plants, true);   // cây/thông/đá rải ngẫu nhiên: không được vào khu, lô, đường
    check(A.plants, false);          // cây/dừa/hoa trong thị trấn: không được trùng nhà, tường, đường
    out.nhaTrongLo = L.HOUSE_LOTS.filter(q => q.house).length; out.lo = L.LOTS.length;
    return out;
  });
  console.log(`Đã quét ${r.tong} cây/đá/hoa · ${r.lo} lô đất (${r.nhaTrongLo} có nhà) → TRÙNG CÔNG TRÌNH: ${r.trung}`, r.trung ? r.loai : '', r.viDu.length ? r.viDu : '');
  await b.close(); process.exit(r.trung ? 1 : 0);
})();
