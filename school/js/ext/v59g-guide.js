// ================= v59g · CHỈ ĐƯỜNG NHẸ NHÀNG: dấu chân + làn gió thay cho đường kẻ vàng, mũi tên đỏ, bảng tên =================
// Tên toàn cục tiền tố v59g. Vẽ trên lộ trình v46GuideRoute() (toạ độ đảo mới). Dấu chân hiện dần từ nhân vật tới đích, mờ dần theo khoảng cách;
// vài làn gió trắng mảnh trôi về phía đích; ở đích chỉ có một quầng sáng nhẹ.
const V59G = {STEP:42, MAX:46};
function v59gWalk(pts, step, f){ let acc = 0, i = 0, n = 0; for(let k = 1; k < pts.length && n < V59G.MAX*3; k++){ const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], L = Math.hypot(x1 - x0, y1 - y0); if(!L) continue; const ux = (x1 - x0)/L, uy = (y1 - y0)/L;
  while(acc <= L){ f(x0 + ux*acc, y0 + uy*acc, ux, uy, i++); n++; acc += step; } acc -= L; } }
function v59gPrint(x, y, ux, uy, side, a, s){
  const nx = -uy, ny = ux, cx = x + nx*side*6*s, cy = y + ny*side*6*s, ang = Math.atan2(uy, ux);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = season === 'dong' ? 'rgba(120,140,160,.75)' : 'rgba(92,64,38,.8)';
  ctx.beginPath(); ctx.ellipse(1.5*s, 0, 4.6*s, 2.9*s, 0, 0, 7); ctx.fill();            // bàn chân
  ctx.beginPath(); ctx.ellipse(-4.6*s, 0, 2.2*s, 2.1*s, 0, 0, 7); ctx.fill();           // gót
  ctx.restore();
}
function v59gWind(pts, s){
  // 4 làn gió: đường cong mảnh trôi dọc lộ trình trong khoảng 0..700 đơn vị phía trước nhân vật
  const segs = []; let tot = 0; for(let k = 1; k < pts.length; k++){ const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push([pts[k - 1], pts[k], L, tot]); tot += L; }
  const at = d => { for(const [a, b, L, t0] of segs){ if(d <= t0 + L){ const u = L ? (d - t0)/L : 0; return [a[0] + (b[0] - a[0])*u, a[1] + (b[1] - a[1])*u, (b[0] - a[0])/(L || 1), (b[1] - a[1])/(L || 1)]; } } return null; };
  const span = Math.min(700, tot); if(span < 60) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.4, 1.6*s);
  for(let w = 0; w < 4; w++){ const ph = (realT*.22 + w*.25) % 1, d0 = ph*span, p = at(d0); if(!p) continue; const a = Math.sin(ph*Math.PI)*.42;
    const [x, y, ux, uy] = p, nx = -uy, ny = ux, off = (w % 2 ? 1 : -1)*(10 + w*5)*s, len = 46*s;
    ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x + nx*off - ux*len, y + ny*off - uy*len);
    ctx.quadraticCurveTo(x + nx*(off + 8*s), y + ny*(off + 8*s), x + nx*off + ux*len*.6, y + ny*off + uy*len*.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + nx*off + ux*len*.6 + nx*4*s, y + ny*off + uy*len*.6 + ny*4*s, 4*s, Math.PI, Math.PI*1.8); ctx.stroke(); }
  ctx.restore();
}
function v59gGlow(x, y, s){ const p = 1 + .12*Math.sin(realT*2.4); ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, 30*s*p); g.addColorStop(0, 'rgba(255,244,210,.55)'); g.addColorStop(1, 'rgba(255,244,210,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 30*s*p, 14*s*p, 0, 0, 7); ctx.fill(); ctx.restore(); }
function v59gDraw(){
  const pts = v46GuideRoute(); if(!pts || pts.length < 2) return; const s = Math.max(1, .85/Math.max(.2, cam.z)), to = pts[pts.length - 1];
  // dấu chân hiện dần như có người đi trước: sóng sáng chạy từ nhân vật ra xa rồi lặp lại
  const wave = (realT*5) % (V59G.MAX + 14);
  v59gWalk(pts, V59G.STEP*Math.min(1.6, s), (x, y, ux, uy, i) => { if(i === 0 || i > V59G.MAX) return; const fade = 1 - i/V59G.MAX, lit = Math.max(0, 1 - Math.abs(i - wave)/7);
    v59gPrint(x, y, ux, uy, i % 2 ? 1 : -1, .42*fade + .5*lit*fade, s*1.35); });
  v59gWind(pts, s); v59gGlow(to[0], to[1], s);
}
function v59gInit(){
  // v58 bọc v46DrawGuide để ẩn khi đi bằng chạm vào cửa; giữ ẩn trường hợp đó (chỉ quầng sáng), còn lại vẽ dấu chân + gió
  v46DrawGuide = function(){ if(typeof V58T !== 'undefined' && V58T.tap){ if(GUIDE){ const p = v46ToNew(GUIDE.x, GUIDE.y); v59gGlow(p[0], p[1], Math.max(1, .85/Math.max(.2, cam.z))); } return; } try { v59gDraw(); } catch(e){} };
}
