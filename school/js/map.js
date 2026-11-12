// ================= DRAWING =================
const S = () => SEASONS[season];
function rect(c,x,y,w,h){ ctx.fillStyle = c; ctx.fillRect(x,y,w,h); }
function plate(text, cx, y){ ctx.font = '13px VT323, monospace'; const w = ctx.measureText(text).width + 8; rect('#2a1c10', cx - w/2, y, w, 13); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, y + 7); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
function win(x, y, w, h, c){ rect('#3a2a1a', x-1, y-1, w+2, h+2); rect(c || '#9fd3ff', x, y, w, h); rect('rgba(255,255,255,.45)', x+1, y+1, Math.max(1, w/3), h-2); }
function tri(x1,y1,x2,y2,x3,y3,c){ ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); }
function circ(cx, cy, r, c){ ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); }
function palm(x, y){ rect('#8b6b3a', x-2, y-30, 4, 30); ['#2e8b3a','#3fa043','#2e8b3a','#3fa043'].forEach((c,i) => { const a = i*Math.PI/2 + .4; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + Math.cos(a)*9, y-30 + Math.sin(a)*5, 11, 4, a, 0, Math.PI*2); ctx.fill(); }); }
function drawHouse(h, owner){
  const x = h.x, y = h.y, w = h.w, hh = h.h, cx = x + w/2, snow = season === 'dong', sn = c => snow ? '#f4f8fb' : c;
  rect('rgba(0,0,0,.18)', x+4, y+hh-2, w, 6);
  switch(h.k){
    case 'bietthu':
      rect('#f3e6c8', x, y+30, w, hh-30); tri(x-8, y+32, x+w+8, y+32, cx, y, sn('#b5432f'));
      for(let i=0;i<5;i++) rect('#fffaf0', x+8+i*33, y+34, 6, hh-34);
      for(let i=0;i<4;i++){ win(x+20+i*33, y+40, 10, 14); win(x+20+i*33, y+68, 10, 12); }
      rect('#c8a46a', x+4, y+60, w-8, 3); rect('#6b4226', cx-9, y+hh-24, 18, 24); rect('#ffd23f', cx-1, y+hh-14, 2, 2);
      break;
    case 'nhaong':
      rect('#2bb5a5', x, y+8, w, hh-8); rect('#9e9e9e', x+w-14, y, 10, 8); rect('#e0e0e0', x-2, y+6, w+4, 4);
      for(let f=0;f<3;f++){ const fy = y+14+f*20; win(x+6, fy, 12, 10); win(x+w-18, fy, 12, 10); if(f<2){ rect('#f4f4f4', x-2, fy+12, w+4, 2); rect('#4caf50', x+2, fy+9, 6, 3); rect('#e91e63', x+w-10, fy+9, 4, 3); } }
      rect('#8d8d8d', x+8, y+hh-14, w-16, 14); for(let k=0;k<5;k++) rect('#757575', x+8, y+hh-13+k*3, w-16, 1);
      break;
    case 'nhago':
      rect('#8b5a2b', x, y+26, w, hh-26); ctx.fillStyle = '#6f4520'; for(let yy=y+30; yy<y+hh; yy+=6) ctx.fillRect(x, yy, w, 1);
      tri(x-6, y+28, x+w+6, y+28, cx, y, sn('#4a2c16')); rect('#7a5a4a', x+w-18, y+4, 8, 16);
      win(x+8, y+38, 12, 12, '#ffe0a0'); win(x+w-20, y+38, 12, 12, '#ffe0a0'); rect('#5a3418', cx-7, y+hh-20, 14, 20); rect('#a0703a', x-4, y+hh-4, w+8, 4);
      break;
    case 'nhatron':
      circ(cx, y+hh-30, 30, '#f0d9a8'); ctx.fillStyle = sn('#d63a3a'); ctx.beginPath(); ctx.ellipse(cx, y+hh-50, 38, 28, 0, Math.PI, 0); ctx.fill();
      if(!snow) [[-20,-60],[-4,-70],[14,-62],[26,-54],[-28,-52]].forEach(([a,b]) => circ(cx+a, y+hh+b, 3.5, '#fff'));
      circ(cx-14, y+hh-30, 5, '#9fd3ff'); circ(cx+14, y+hh-30, 5, '#9fd3ff'); ctx.fillStyle = '#6b4226'; ctx.beginPath(); ctx.ellipse(cx, y+hh-8, 8, 12, 0, Math.PI, 0); ctx.fill(); rect('#6b4226', cx-8, y+hh-8, 16, 8);
      break;
    case 'resort':
      rect('#e8d3a8', x, y+18, w, hh-18);
      rect('#1e88c8', x+98, y+40, 100, 56); rect('#3ec6e8', x+101, y+43, 94, 50); ctx.fillStyle = 'rgba(255,255,255,.45)'; for(let i=0;i<5;i++) ctx.fillRect(x+106+i*18, y+52+(i%2)*14, 10, 2);
      rect('#c0c0c0', x+190, y+44, 2, 10); rect('#c0c0c0', x+186, y+46, 8, 1); rect('#c0c0c0', x+186, y+50, 8, 1);
      rect('#fff8e7', x+8, y+46, 82, hh-46); tri(x+2, y+48, x+96, y+48, x+49, y+16, sn('#c8a050')); ctx.fillStyle = 'rgba(120,80,30,.35)'; for(let i=0;i<8;i++) ctx.fillRect(x+14+i*9, y+30+Math.abs(4-i)*2, 2, 16);
      win(x+16, y+62, 14, 12); win(x+60, y+62, 14, 12); rect('#6b4226', x+40, y+hh-22, 14, 22);
      for(let i=0;i<4;i++){ rect('#fff', x+104+i*24, y+100, 16, 6); rect('#e0e0e0', x+104+i*24, y+98, 4, 4); }
      palm(x+100, y+36); palm(x+198, y+110); palm(x+6, y+44);
      plate('RESORT', x+150, y+22);
      break;
    case 'nhat':
      rect('#efe6d2', x+4, y+30, w-8, hh-30); ctx.fillStyle = '#3a2a1a'; for(let i=0;i<5;i++) ctx.fillRect(x+4+i*(w-12)/4, y+30, 3, hh-30); ctx.fillRect(x+4, y+52, w-8, 2);
      ctx.fillStyle = sn('#2e2e3a'); ctx.beginPath(); ctx.moveTo(x-8, y+34); ctx.lineTo(x+w+8, y+34); ctx.lineTo(x+w-6, y+20); ctx.lineTo(x+6, y+20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+2, y+20); ctx.lineTo(x+w-2, y+20); ctx.lineTo(x+w-14, y+6); ctx.lineTo(x+14, y+6); ctx.closePath(); ctx.fill();
      rect(sn('#2e2e3a'), x-10, y+30, 4, 4); rect(sn('#2e2e3a'), x+w+6, y+30, 4, 4);
      rect('#bdbdbd', x+w-6, y+hh-16, 6, 14); rect('#9e9e9e', x+w-8, y+hh-18, 10, 3);
      break;
    case 'laudai':
      rect('#9aa0a8', x+14, y+34, w-28, hh-34); ctx.fillStyle = '#868c94'; for(let yy=y+38; yy<y+hh; yy+=8) for(let xx=x+14+((yy/8)%2)*6; xx<x+w-14; xx+=12) ctx.fillRect(xx, yy, 10, 1);
      rect('#8a9098', x, y+20, 18, hh-20); rect('#8a9098', x+w-18, y+20, 18, hh-20);
      tri(x-3, y+22, x+21, y+22, x+9, y-6, sn('#3d5afe')); tri(x+w-21, y+22, x+w+3, y+22, x+w-9, y-6, sn('#3d5afe'));
      for(let i=0;i<4;i++) rect('#9aa0a8', x+18+i*10, y+28, 6, 6);
      rect('#333', x+w-10, y-16, 2, 12); rect('#ef4b4b', x+w-8, y-16, 8, 5);
      ctx.fillStyle = '#5a3418'; ctx.beginPath(); ctx.ellipse(cx, y+hh-14, 9, 12, 0, Math.PI, 0); ctx.fill(); rect('#5a3418', cx-9, y+hh-14, 18, 14);
      win(x+5, y+40, 7, 10); win(x+w-12, y+40, 7, 10); win(cx-4, y+46, 8, 12);
      break;
    case 'nhasan':
      for(let i=0;i<5;i++) rect('#6b4226', x+4+i*18, y+hh-30, 4, 30);
      rect('#c9a35a', x, y+34, w, hh-64); ctx.fillStyle = '#a8843e'; for(let xx=x+3; xx<x+w; xx+=6) ctx.fillRect(xx, y+34, 1, hh-64);
      tri(x-10, y+38, x+w+10, y+38, cx, y-2, sn('#9c7a3c')); ctx.fillStyle = 'rgba(80,60,20,.3)'; for(let i=0;i<10;i++) ctx.fillRect(x+i*9, y+16+Math.abs(5-i)*3, 1, 18);
      win(x+10, y+42, 12, 10, '#ffe0a0'); win(x+w-22, y+42, 12, 10, '#ffe0a0');
      for(let i=0;i<5;i++) rect('#8b5a2b', x+w-12 + i*2, y+hh-30 + i*6, 12, 2);
      break;
    case 'nhakinh':
      rect('#e0e0e0', x-2, y+8, w+4, 6); rect('#7fd3f7', x, y+14, w, hh-14);
      ctx.fillStyle = '#ffffff'; for(let xx=x; xx<=x+w; xx+=18) ctx.fillRect(xx, y+14, 2, hh-14); ctx.fillRect(x, y+40, w, 2);
      rect('#4caf50', x+6, y+hh-12, 10, 10); rect('#66bb6a', x+w-18, y+20, 10, 14); rect('rgba(255,255,255,.35)', x+4, y+18, 6, 20);
      break;
    case 'diatrunghai':
      rect('#fbfbf7', x, y+30, w, hh-30); ctx.fillStyle = sn('#1e5aa8'); ctx.beginPath(); ctx.arc(cx, y+32, 26, Math.PI, 0); ctx.fill(); rect('#fff', cx-1, y, 2, 8);
      [x+12, x+w-28].forEach(wx => { ctx.fillStyle = '#1e5aa8'; ctx.beginPath(); ctx.arc(wx+8, y+50, 8, Math.PI, 0); ctx.fill(); rect('#1e5aa8', wx, y+50, 16, 14); });
      ctx.fillStyle = '#5c86c4'; ctx.beginPath(); ctx.arc(cx, y+hh-14, 9, Math.PI, 0); ctx.fill(); rect('#5c86c4', cx-9, y+hh-14, 18, 14);
      if(!snow) for(let i=0;i<14;i++) circ(x+2+(i*13)%w, y+30+(i*7)%20, 2.5, '#e91e8c');
      break;
    case 'thai':
      rect('#f4e0c0', x+6, y+40, w-12, hh-40);
      tri(x-6, y+44, x+w+6, y+44, cx, y+18, sn('#c62828')); tri(x+8, y+28, x+w-8, y+28, cx, y+4, sn('#c62828')); rect('#ffd23f', x-6, y+43, w+12, 2); rect('#ffd23f', x+8, y+27, w-16, 2); rect('#ffd23f', cx-1, y-8, 2, 14);
      win(x+14, y+52, 12, 14); win(x+w-26, y+52, 12, 14); rect('#8b1a1a', cx-8, y+hh-22, 16, 22); rect('#ffd23f', cx-1, y+hh-14, 2, 2);
      break;
    case 'container':
      rect('#ef6c00', x, y+32, w, hh-32); ctx.fillStyle = '#d65f00'; for(let xx=x+2; xx<x+w; xx+=5) ctx.fillRect(xx, y+32, 1, hh-32);
      rect('#1565c0', x+12, y+4, w-16, 28); ctx.fillStyle = '#0d4f9c'; for(let xx=x+14; xx<x+w-4; xx+=5) ctx.fillRect(xx, y+4, 1, 28);
      if(snow) rect('#f4f8fb', x+12, y+2, w-16, 4);
      win(x+20, y+10, 24, 12); win(x+8, y+40, 18, 12); rect('#37474f', x+w-24, y+hh-20, 14, 20);
      for(let i=0;i<5;i++) rect('#424242', x+2+i*3, y+30-i*5, 8, 2);
      break;
    case 'villa':
      rect('#f5f5f5', x, y+52, w, hh-52); rect('#90a4ae', x+30, y+14, 112, 40); rect('#cfd8dc', x+26, y+10, 120, 6); rect('#e0e0e0', x-4, y+48, w+8, 6);
      rect(sn('#4caf50'), x+30, y+4, 112, 6); if(!snow) for(let i=0;i<8;i++) circ(x+36+i*14, y+5, 3, '#66bb6a');
      rect('#9fd3ff', x+38, y+20, 96, 28); ctx.fillStyle = '#fff'; for(let xx=x+38; xx<x+134; xx+=24) ctx.fillRect(xx, y+20, 2, 28);
      rect('#9fd3ff', x+10, y+62, 70, 34); rect('#fff', x+44, y+62, 2, 34);
      rect('#3ec6e8', x+100, y+64, 82, 30); rect('#1e88c8', x+100, y+92, 82, 3); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x+108, y+72, 14, 2); ctx.fillRect(x+140, y+82, 14, 2);
      rect('#616161', x+10, y+104, 52, 28); rect('#e53935', x+16, y+118, 40, 10); rect('#1b2533', x+24, y+114, 20, 5); rect('#111', x+20, y+126, 7, 4); rect('#111', x+44, y+126, 7, 4);
      rect('#5d4037', cx+12, y+hh-26, 18, 26); palm(x+w-6, y+60);
      break;
  }
  plate('Nhà ' + owner, cx, y - 15);
}
function drawPlayground(x, y){ rect('#d7c49e', x, y, 66, 62); rect('#ef4b4b', x+6, y+10, 3, 30); rect('#ef4b4b', x+30, y+10, 3, 30); rect('#ef4b4b', x+6, y+10, 27, 3); rect('#333', x+14, y+13, 1, 16); rect('#3d7bff', x+11, y+29, 8, 3); rect('#ffd23f', x+40, y+20, 20, 4); tri(x+40, y+24, x+60, y+24, x+60, y+52, '#2fbf71'); plate('Sân chơi', x+33, y-14); }
function drawDalat(d){
  const {x, y, w, h} = d, cx = x + w/2, top = y + h*.38;
  rect('rgba(0,0,0,.15)', x+3, y+h-2, w, 5);
  rect(d.wall, x, top, w, h - h*.38);
  if(d.style === 1){ ctx.fillStyle = '#5a3a1a'; for(let i=0;i<=3;i++) ctx.fillRect(x + i*(w-3)/3, top, 3, h - h*.38); ctx.fillRect(x, y+h*.62, w, 2); }
  if(d.style === 0 || d.style === 1) tri(x-6, top+2, x+w+6, top+2, cx, y-6, d.roof);
  else if(d.style === 2){ tri(x-6, top+2, x+w*.56, top+2, x+w*.25, y, d.roof); tri(x+w*.4, top+2, x+w+6, top+2, x+w*.73, y+4, d.roof); }
  else { rect(d.roof, x-4, y+h*.18, w+8, h*.22); tri(x-4, y+h*.2, x+w+4, y+h*.2, cx, y-2, d.roof); }
  if(d.chim) rect('#7a5a4a', x+w*.76, y-2, 7, 16);
  if(season === 'dong') tri(x-4, top-1, x+w+4, top-1, cx, y-4, 'rgba(255,255,255,.4)');
  win(x+8, y+h*.5, 10, 12); win(x+w-18, y+h*.5, 10, 12); if(w > 100) win(cx-5, y+h*.5, 10, 12);
  rect('#7a4b2a', cx-6, y+h-18, 12, 18);
  for(let k=0;k<2;k++){ const fx = k ? x+w-20 : x+6; rect('#6b4226', fx, y+h*.5+13, 14, 3); for(let j=0;j<4;j++) rect(['#ff5a8a','#ffd23f','#b06bff','#ff8a2b'][(j+d.idx)%4], fx+1+j*3, y+h*.5+10, 2, 3); }
  if(d.sign) plate(d.sign, cx, top - 6);
}
const FLOWERS = [['Hoa hồng','#e53950'],['Hướng dương','#ffd23f'],['Tulip','#ff6f91'],['Cẩm tú cầu','#7c9cff'],['Oải hương','#a77bd8'],['Cúc họa mi','#ffffff'],['Hoa đào','#ffb3c6'],['Hoa mai','#ffcc00'],['Dã quỳ','#ffb000'],['Hoa lan','#d16ba5'],['Mimosa','#f5e050'],['Cát tường','#c39bd3']];
function drawForestStatic(){
  const dong = season === 'dong';
  rect(dong ? '#dfe8ec' : season === 'thu' ? '#7d8a3a' : '#4f9a3c', 2636, 36, W-2636, 552);
  ctx.fillStyle = dong ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.07)'; for(let i=0;i<1400;i++) ctx.fillRect(2640 + (i*977)%2556, 40 + (i*613)%544, 6, 3);
  ctx.strokeStyle = '#c29a62'; ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.strokeRect(TRAIL.x0, TRAIL.y0, TRAIL.x1-TRAIL.x0, TRAIL.y1-TRAIL.y0);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.setLineDash([12,12]); ctx.strokeRect(TRAIL.x0, TRAIL.y0, TRAIL.x1-TRAIL.x0, TRAIL.y1-TRAIL.y0); ctx.setLineDash([]);
  FOREST_GATES.forEach(g => rect('#c29a62', g-12, TRAIL.y1, 24, 122));
  ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('ĐƯỜNG ĐẠP XE QUANH RỪNG THÔNG', 2780, 56); ctx.fillText('ĐƯỜNG ĐẠP XE QUANH RỪNG THÔNG', 4500, 56);
  const gd = R.garden; rect(dong ? '#e6eef0' : '#86c26a', gd.x, gd.y, gd.w, gd.h);
  FLOWERS.forEach(([nm, col], k) => {
    const bx = gd.x + 10 + (k%4)*110, by = gd.y + 22 + Math.floor(k/4)*78;
    rect('#6d4c2f', bx, by, 100, 50);
    for(let j=0;j<40;j++){ const fx = bx + 4 + (j%10)*10, fy = by + 6 + Math.floor(j/10)*11; rect('#2e7d32', fx+1, fy+3, 2, 6); if(!dong || k === 6 || k === 7){ if(k === 1){ circ(fx+2, fy+2, 3.5, col); circ(fx+2, fy+2, 1.5, '#5a3a1e'); } else rect(col, fx, fy, 4, 4); } }
    ctx.font = '14px VT323, monospace'; ctx.fillStyle = '#1a1206'; ctx.fillText(nm, bx + 2, by + 62);
  });
  plate('VƯỜN HOA ĐÀ LẠT', gd.x + gd.w/2, gd.y - 16);
  const pc = R.picnic; rect(dong ? '#e8f0f2' : '#9ad07a', pc.x, pc.y, pc.w, pc.h);
  for(let k=0;k<6;k++){ const bx = pc.x + 14 + (k%3)*86, by = pc.y + 22 + Math.floor(k/3)*80; for(let i=0;i<6;i++) for(let j=0;j<4;j++) rect((i+j)%2 ? '#fff' : ['#e53935','#1e88e5','#43a047'][k%3], bx + i*9, by + j*9, 9, 9); rect('#a1887f', bx+58, by+12, 12, 10); rect('#6d4c41', bx+60, by+8, 8, 4); }
  plate('KHU PICNIC', pc.x + pc.w/2, pc.y - 16);
  ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.ellipse(LAKE.cx, LAKE.cy, LAKE.rx+8, LAKE.ry+8, 0, 0, Math.PI*2); ctx.fill();
  const lg = ctx.createRadialGradient(LAKE.cx, LAKE.cy, 20, LAKE.cx, LAKE.cy, LAKE.rx); lg.addColorStop(0, dong ? '#cfe8f2' : '#2c8fb3'); lg.addColorStop(1, dong ? '#a9d3e4' : '#1f6f8f');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(LAKE.cx, LAKE.cy, LAKE.rx, LAKE.ry, 0, 0, Math.PI*2); ctx.fill();
  rect('#8d6e4a', LAKE.cx - LAKE.rx - 12, LAKE.cy - 9, 2*LAKE.rx + 24, 18); ctx.fillStyle = '#6d5236'; for(let xx = LAKE.cx - LAKE.rx - 12; xx < LAKE.cx + LAKE.rx + 12; xx += 8) ctx.fillRect(xx, LAKE.cy - 9, 2, 18);
  rect('#5d4037', LAKE.cx - LAKE.rx - 12, LAKE.cy - 11, 2*LAKE.rx + 24, 2); rect('#5d4037', LAKE.cx - LAKE.rx - 12, LAKE.cy + 9, 2*LAKE.rx + 24, 2);
  rect('#efe6d2', LAKE.cx - 22, LAKE.cy - 30, 44, 22); tri(LAKE.cx - 32, LAKE.cy - 28, LAKE.cx + 32, LAKE.cy - 28, LAKE.cx, LAKE.cy - 52, dong ? '#f4f8fb' : '#b71c1c');
  plate('HỒ CÁ KOI · CẦU GỖ', LAKE.cx, LAKE.cy - LAKE.ry - 30);
  ctx.fillStyle = '#7a6a4a'; ctx.beginPath(); ctx.ellipse(LOTUS.cx, LOTUS.cy, LOTUS.rx+6, LOTUS.ry+6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = dong ? '#b9d6cf' : '#4f8f6a'; ctx.beginPath(); ctx.ellipse(LOTUS.cx, LOTUS.cy, LOTUS.rx, LOTUS.ry, 0, 0, Math.PI*2); ctx.fill();
  for(let i=0;i<44;i++){ const a = i*2.4, rr = ((i*37) % 100)/100; const lx = LOTUS.cx + Math.cos(a)*LOTUS.rx*.85*rr, ly = LOTUS.cy + Math.sin(a)*LOTUS.ry*.85*rr; circ(lx, ly, 9, dong ? '#9fbfa8' : '#3e8e41'); rect('rgba(0,0,0,.15)', lx, ly-1, 8, 2); }
  plate('ĐẦM SEN', LOTUS.cx, LOTUS.cy - LOTUS.ry - 26);
  TENTS.forEach(([tx, ty, c], i) => { tri(tx-16, ty+8, tx+16, ty+8, tx, ty-16, c); tri(tx-5, ty+8, tx+5, ty+8, tx, ty-6, 'rgba(0,0,0,.35)'); if(i%2 === 0) for(let k=0;k<6;k++){ const a = k/6*Math.PI*2; circ(tx+30 + Math.cos(a)*7, ty+6 + Math.sin(a)*4, 2.5, '#757575'); } });
  plate('KHU CẮM TRẠI QUANH HỒ', LAKE.cx, LAKE.cy + LAKE.ry + 64);
}
function drawPine(x, y, i){
  const w = WEATHERS[weather].wind, sway = Math.sin(realT*(1.2+w*2) + i)*(.6 + w*2.5);
  rect('rgba(0,0,0,.18)', x-14, y-3, 28, 6); rect('#5a3a1e', x-3, y-18, 6, 18);
  const c = season === 'thu' ? '#2e6b3a' : '#235c34';
  tri(x-18+sway*.3, y-14, x+18+sway*.3, y-14, x+sway, y-46, c);
  tri(x-14+sway*.6, y-34, x+14+sway*.6, y-34, x+sway, y-64, c);
  tri(x-10+sway, y-52, x+10+sway, y-52, x+sway*1.2, y-80, '#2a6e3e');
  if(season === 'dong'){ tri(x-10+sway, y-52, x+10+sway, y-52, x+sway*1.2, y-80, 'rgba(255,255,255,.7)'); rect('rgba(255,255,255,.7)', x-16+sway*.3, y-16, 32, 3); }
}
let groundCache = null, groundSeason = null;
function buildGround(){
  const c = document.createElement('canvas'); c.width = W; c.height = 790;
  const prev = ctx; ctx = c.getContext('2d');
  const se = S();
  rect(se.grass, 0, 0, W, 790);
  ctx.fillStyle = se.grass2;
  for(let y=0; y<790; y+=20) for(let x=(y/20)%2*20; x<W; x+=40) ctx.fillRect(x, y, 20, 20);
  rect('#b9b2a3', 40, 300, 1150, 170);
  ctx.fillStyle = '#aaa294';
  for(let y=300; y<470; y+=16) for(let x=40+((y/16)%2)*16; x<1190; x+=32) ctx.fillRect(x, y, 16, 16);
  rect('#b9b2a3', 712, 470, 46, 320);
  for(let y=470; y<790; y+=16) rect('#aaa294', 712 + ((y/16)%2)*23, y, 23, 16);
  rect('#b9b2a3', 735, 690, 840, 36);
  for(let x=735; x<1575; x+=32) rect('#aaa294', x, 690 + (((x-735)/32)%2)*18, 16, 18);
  const road = (x,y,w,h,vert) => { rect('#d2d0c8', x-4, y-4, w+8, h+8); rect('#5c5f6b', x, y, w, h); ctx.fillStyle = '#e8e2c8'; if(vert){ for(let yy=y+10; yy<y+h; yy+=40) ctx.fillRect(x+w/2-2, yy, 4, 20); } else { for(let xx=x+10; xx<x+w; xx+=40) ctx.fillRect(xx, y+h/2-2, 20, 4); } };
  road(0, 0, 40, 790, true);
  road(1580, 0, 50, 790, true);
  road(1630, 686, W-1630, 44, false);
  road(2198, 36, 44, 650, true);
  ctx.fillStyle = '#f4f4f4'; for(let i=0;i<5;i++) ctx.fillRect(1584 + i*10, 690, 6, 36);
  ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#f4f1e0'; ctx.save(); ctx.translate(1612, 300); ctx.rotate(-Math.PI/2); ctx.fillText('ĐƯỜNG BÌNH PHÀM', 0, 0); ctx.restore();
  ctx.fillText('ĐƯỜNG VỀ NHÀ →', 2260, 714);
  rect('#7a4b2a', 34, 360, 10, 16); rect('#7a4b2a', 34, 426, 10, 16);
  rect('#2d4a8a', 46, 436, 50, 34); rect('#1d2c52', 42, 430, 58, 8); rect('#bfe3ff', 56, 446, 14, 10);
  if(season === 'dong') rect('#ffffff', 42, 428, 58, 4);
  for(let x=40; x<1572; x+=14){ if(x > 1124 && x < 1176) continue; rect('#8a6a4a', x, 22, 4, 18); }
  rect('#8a6a4a', 40, 28, 1086, 4); rect('#8a6a4a', 1176, 28, 396, 4); rect('#5a3a1a', 1122, 16, 8, 24); rect('#5a3a1a', 1170, 16, 8, 24); rect('#b9b2a3', 1130, 0, 40, 60);
  for(let y=30; y<786; y+=14){ if(y > 682 && y < 732) continue; rect('#8a6a4a', 1566, y, 4, 10); }
  rect('#8a6a4a', 1567, 30, 2, 652); rect('#8a6a4a', 1567, 732, 2, 54);
  rect('#5a3a1a', 1562, 680, 12, 10); rect('#5a3a1a', 1562, 728, 12, 10);
  rect('#9aa1b3', 1430, 742, 120, 3); for(let i=0;i<7;i++) rect('#9aa1b3', 1432 + i*19, 734, 2, 12);
  ctx.fillStyle = '#3a3f4f'; ctx.font = '14px VT323, monospace'; ctx.fillText('Bãi xe đạp', 1440, 728);
  const f = R.field;
  for(let i=0;i<8;i++) rect(i%2 ? se.pitch : se.pitch2, f.x + i*60, f.y, 60, f.h);
  ctx.strokeStyle = '#f7f7f0'; ctx.lineWidth = 3;
  ctx.strokeRect(f.x+10, f.y+10, f.w-20, f.h-20);
  ctx.beginPath(); ctx.moveTo(1920, f.y+10); ctx.lineTo(1920, f.y+f.h-10); ctx.stroke();
  ctx.beginPath(); ctx.arc(1920, 515, 46, 0, Math.PI*2); ctx.stroke();
  ctx.strokeRect(f.x+10, 455, 60, 120); ctx.strokeRect(f.x+f.w-70, 455, 60, 120);
  rect('#ffffff', 1676, 477, 14, 3); rect('#ffffff', 1676, 551, 14, 3); rect('#ffffff', 1676, 477, 3, 77);
  rect('#ffffff', 2150, 477, 14, 3); rect('#ffffff', 2150, 551, 14, 3); rect('#ffffff', 2161, 477, 3, 77);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; for(let y=480;y<552;y+=6){ ctx.fillRect(1679,y,10,1); ctx.fillRect(2151,y,10,1); }
  rect('#7a4b2a', 1700, 662, 120, 8); rect('#7a4b2a', 1980, 662, 120, 8);
  HOUSES.forEach((h,i) => drawHouse(h, students[i].name));
  drawPlayground(2560, 546);
  drawForestStatic();
  DALAT.forEach(drawDalat);
  if(season === 'dong'){ ctx.fillStyle = 'rgba(255,255,255,.7)'; for(let i=0;i<90;i++){ const x=(i*373)%(W-40)+20, y=(i*211)%740+30; if(x > 2636 || (regionAt(x,y) === 'road' && (x < 1640 || (y > 680 && y < 735) || (x > 2195 && x < 2245)))) continue; ctx.fillRect(x, y, 18+(i%3)*8, 6); } }
  if(season === 'xuan' || season === 'ha'){ for(let i=0;i<110;i++){ const x=(i*373)%(W-40)+20, y=(i*211)%740+30; const rg = regionAt(x,y); if(rg !== 'yard' && rg !== 'road') continue; if(y > 296 && y < 474 && x < 1192) continue; if(x < 44 || (x > 1576 && x < 1636) || (y > 680 && y < 736 && x > 1600) || (x > 2194 && x < 2246)) continue; rect(i%3 ? '#ffd23f' : season==='xuan' ? '#ff8fc4' : '#ff5a5a', x, y, 4, 4); } }
  drawEastStatic();
  ctx = prev; groundCache = c; groundSeason = season;
}
function drawGround(){
  if(!groundCache || groundSeason !== season) buildGround();
  ctx.drawImage(groundCache, 0, 0);
  if(VB.y0 < NY) drawSky();
  if(VB.y0 < 0){ if(!northCache || northSeason !== season) buildNorth(); ctx.drawImage(northCache, 0, NY); drawNorthDyn(); }
  if(cracks.length){ ctx.strokeStyle = '#2a1e14'; ctx.lineWidth = 3; cracks.forEach(c => { ctx.beginPath(); c.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1])); ctx.stroke(); }); }
}
function drawShip(s){
  const w = WEATHERS[weather].wind;
  ctx.save(); ctx.translate(s.x, s.y + Math.sin(realT*2 + s.x*.01)*(2 + w*3)); ctx.rotate(Math.sin(realT*2 + s.y)*.05*(1 + w*2));
  const d = s.dir;
  if(s.k === 'sail'){
    rect('#7a3e1d', -34, 0, 68, 12); rect('#5a2c12', -28, 12, 56, 6); rect('#e6e0d0', -2, -50, 4, 50);
    ctx.fillStyle = '#ef4b4b'; ctx.beginPath(); ctx.moveTo(4,-48); ctx.lineTo(4 + 34*d, -6); ctx.lineTo(4,-6); ctx.closePath(); ctx.fill();
  } else if(s.k === 'fish'){
    rect('#2e86c1', -26, 0, 52, 10); rect('#1b4f72', -22, 10, 44, 5); rect('#f4f4f4', -8*d - 6, -14, 14, 14); rect('#333', -2, -28, 2, 16);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, -26); ctx.lineTo(30*d, 6); ctx.stroke();
  } else if(s.k === 'cargo'){
    rect('#2c3e50', -80, 0, 160, 18); rect('#1c2833', -74, 18, 148, 6); rect('#f4f4f4', 50*d - 12, -22, 24, 22);
    const cc = ['#ef4b4b','#3d7bff','#2fbf71','#ffd23f','#ff8a2b'];
    for(let i=0;i<5;i++) rect(cc[i], -60 + i*20 - (d > 0 ? 10 : -10), -14, 18, 14);
  } else if(s.k === 'thung'){
    circ(0, 2, 13, '#8d6e3f'); circ(0, 2, 10, '#6d5230'); ctx.strokeStyle = '#a1885a'; ctx.lineWidth = 1; for(let i=-8;i<=8;i+=4){ ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i, 12); ctx.stroke(); }
    rect('#f2c9a0', -3, -10, 6, 6); rect('#c8a050', -6, -12, 12, 3); rect('#3d7bff', -4, -4, 8, 6);
  } else if(s.k === 'speed'){
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-d*22, 4); ctx.lineTo(-d*80, -8); ctx.moveTo(-d*22, 6); ctx.lineTo(-d*80, 20); ctx.stroke();
    rect(s.c, -22, -2, 44, 10); tri(22*d, -2, 32*d, 4, 22*d, 8, s.c); rect('#1b2533', d > 0 ? 2 : -14, -8, 12, 6); rect('#333', d > 0 ? -26 : 22, -2, 4, 10); rect('#f2c9a0', -6, -10, 5, 5);
  } else if(s.k === 'parasail'){
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-d*22, 4); ctx.lineTo(-d*70, -6); ctx.moveTo(-d*22, 6); ctx.lineTo(-d*70, 18); ctx.stroke();
    rect('#f4f4f4', -20, -2, 40, 10); tri(20*d, -2, 28*d, 4, 20*d, 8, '#f4f4f4'); rect('#1b2533', -6, -8, 12, 6);
    const px = -d*110, py = -150 + Math.sin(realT*1.2 + s.x*.01)*8;
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-d*20, -2); ctx.lineTo(px, py + 30); ctx.stroke();
    ctx.fillStyle = s.c; ctx.beginPath(); ctx.ellipse(px, py, 34, 18, 0, Math.PI, 0); ctx.fill(); rect('#fff', px-2, py-18, 4, 18); rect('#fff', px-20, py-12, 4, 12); rect('#fff', px+16, py-12, 4, 12);
    ctx.beginPath(); ctx.moveTo(px-32, py); ctx.lineTo(px-3, py+24); ctx.moveTo(px+32, py); ctx.lineTo(px+3, py+24); ctx.stroke();
    rect('#ff8a2b', px-3, py+22, 6, 8); rect('#f2c9a0', px-2, py+17, 4, 5); rect('#24356b', px-3, py+30, 2, 6); rect('#24356b', px+1, py+30, 2, 6);
  } else if(s.k === 'tour'){
    rect('#f4f4f4', -60, -4, 120, 16); rect('#1e88e5', -60, 8, 120, 4); tri(60*d, -4, 74*d, 4, 60*d, 12, '#f4f4f4');
    rect('#ffffff', -46, -20, 84, 16); rect('#90caf9', -42, -17, 76, 8); rect('#e53935', -50, -26, 96, 6);
    for(let i=0;i<8;i++) rect(SKINS[i%6], -40 + i*10, -15, 5, 5);
    rect('#333', 30*d, -42, 2, 16); rect(['#ffd23f','#ef4b4b','#2fbf71'][Math.floor(s.y)%3], 30*d + 2, -42, 10, 6);
  } else if(s.k === 'navy'){
    rect('#78849a', -86, -2, 172, 16); rect('#5f6b80', -80, 14, 160, 6); tri(86*d, -2, 100*d, -2, 86*d, 14, '#78849a');
    rect('#9aa5b8', -40, -22, 60, 20); rect('#8893a6', -22, -38, 30, 16); rect('#1b2533', -18, -34, 22, 5);
    rect('#5f6b80', 48*d - 8, -10, 16, 8); rect('#5f6b80', d > 0 ? 54 : -74, -8, 20, 3); rect('#5f6b80', -48*d - 8, -10, 16, 8);
    rect('#444', -6, -66, 2, 30); rect('#666', -14 + Math.sin(realT*2)*4, -44, 16, 3);
    drawFlag(s.flag, -4, -66, 24, 15);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-84, -2); ctx.lineTo(-6, -64); ctx.lineTo(84, -2); ctx.stroke();
    const sc = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#f4f4f4'];
    for(let i=1;i<7;i++){ const k = i/7; tri(-84 + 78*k, -2 - 62*k, -84 + 78*k + 6, -2 - 62*k, -84 + 78*k + 3, 4 - 62*k, sc[i%5]); tri(84 - 90*k, -2 - 62*k, 84 - 90*k + 6, -2 - 62*k, 84 - 90*k + 3, 4 - 62*k, sc[(i+2)%5]); }
  } else if(s.k === 'pirate' || s.k === 'pirate2'){
    rect('#3b2412', -46, 0, 92, 16); rect('#2a180a', -40, 16, 80, 6); rect('#3b2412', 40*d - (d>0?0:12), -8, 12, 10);
    rect('#2a1a0e', -14, -64, 4, 64); rect('#2a1a0e', 14, -54, 4, 54);
    rect('#151515', -32, -60, 36, 30); rect('#151515', 2, -50, 30, 26);
    rect('#f4f4f4', -20, -52, 10, 9); rect('#151515', -18, -49, 2, 2); rect('#151515', -13, -49, 2, 2); rect('#f4f4f4', -22, -40, 14, 2);
    rect('#ef4b4b', -12, -74, 16, 8);
    for(let i=0;i<3;i++) rect('#111', -30 + i*22, 4, 6, 6);
  }
  ctx.restore();
}
function drawSub(){
  if(sub.depth > .02) for(let i=0;i<2;i++) if(!FEED && !paused && Math.random() < .3) parts.push({k:'bubble', x:sub.x + rnd(-20,20), y:sub.y - 10, vx:0, vy:-40, life:1.2});
  ctx.save(); ctx.globalAlpha = 1 - sub.depth*.55; ctx.translate(sub.x, sub.y); ctx.scale(sub.dir, 1);
  rect('#ffd23f', -44, -12, 88, 24); rect('#e6b800', -44, 6, 88, 6); rect('#ffd23f', -50, -8, 6, 16); rect('#ffd23f', 44, -8, 6, 16);
  rect('#ffd23f', -10, -24, 26, 12); rect('#888', 6, -36, 3, 12); rect('#888', 6, -36, 9, 3);
  [-26,-6,14].forEach(x => { rect('#1d2c52', x, -6, 10, 10); rect('#9fd3ff', x+2, -4, 6, 6); });
  rect('#555', -58, -10, 6, 20); rect('#777', -60, -12 + Math.sin(realT*20)*4, 3, 8);
  ctx.restore();
}
function drawSea(){
  const se = S(), w = WEATHERS[weather], amp = 4 + w.wind*7;
  const xa = Math.max(0, Math.floor(VB.x0/8)*8 - 16), xb = Math.min(W, VB.x1 + 16);
  rect(se.sand, 0, 790, W, 90);
  ctx.fillStyle = 'rgba(190,170,130,.16)';
  for(let i=0;i<420;i++) ctx.fillRect((i*97)%W, 795 + (i*37)%70, 2, 2);
  const g = ctx.createLinearGradient(0, 870, 0, H);
  g.addColorStop(0, se.sea); g.addColorStop(1, se.sea2);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(xa, H);
  for(let x=xa; x<=xb; x+=8) ctx.lineTo(x, 872 + Math.sin(x*.025 + realT*1.6)*amp*.6 + Math.sin(x*.07 - realT)*2);
  ctx.lineTo(xb, H); ctx.closePath(); ctx.fill();
  for(let i=0;i<60;i++){ const x = 200 + i*82, y = 1696 + (i%3)*18; rect(['#ff6f61','#ffb3c6','#ffd23f','#b06bff'][i%4] + '88', x, y, 10, 18); rect('#1b3a52', x-8, y+16, 26, 6); }
  drawSeaLife();
  drawOceanExt();
  drawSub();
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for(let x=xa; x<xb; x+=8){ const y = 872 + Math.sin(x*.025 + realT*1.6)*amp*.6 + Math.sin(x*.07 - realT)*2; ctx.fillRect(x, y-2, 8, 3); }
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  for(let r=0; r<21; r++){ const yy = 920 + r*42; for(let x=(r*40 + realT*20*(1+w.wind))%80 - 80 + Math.floor(xa/80)*80; x<xb; x+=80) ctx.fillRect(x, yy + Math.sin(x*.05+realT*2+r)*amp*.5, 30, 3); }
  rect('#7a4b2a', 1298, 820, 44, 156); for(let y=822; y<976; y+=10) rect('#5a3418', 1298, y, 44, 2);
  rect('#4a2c16', 1296, 830, 4, 150); rect('#4a2c16', 1340, 830, 4, 150);
  ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('Bến tàu ngầm', 1350, 830);
  ships.forEach(s => { if(s.x > VB.x0 - 200 && s.x < VB.x1 + 200 && s.y > VB.y0 - 60 && s.y < VB.y1 + 200) drawShip(s); });
  drawSeaAbove();
  drawTsunami();
  if(!FEED && !paused && Math.random() < .01 && fish.length < 3) fish.push({x:rnd(100,W-100), y:rnd(930,1200), t:0});
  fish = fish.filter(f => f.t < 1);
  fish.forEach(f => { if(!FEED) f.t += .02; const yy = f.y - Math.sin(f.t*Math.PI)*28; rect('#f2a33a', f.x + f.t*40, yy, 10, 5); rect('#f2a33a', f.x + f.t*40 - 4, yy-1, 4, 7); });
  gulls.forEach(gl => { if(!paused && !FEED) gl.x += gl.v*.016*(1+w.wind); if(gl.x>W+40) gl.x=-40; if(gl.x<-40) gl.x=W+40; const fl = Math.sin(realT*8+gl.y)*4; ctx.fillStyle='#fff'; ctx.fillRect(gl.x-8, gl.y+fl, 8, 3); ctx.fillRect(gl.x, gl.y-fl, 8, 3); ctx.fillRect(gl.x-1, gl.y, 3, 3); });
  rect('#e8e2d0', 772, 806, 4, 26); rect('#e8e2d0', 792, 806, 4, 26); rect('#ef4b4b', 768, 800, 32, 8); rect('#ffd23f', 770, 790, 28, 10);
  drawFlagPlaza();
}
function updateShips(dtR){
  const w = WEATHERS[weather].wind;
  ships.forEach(s => {
    s.x += s.dir * s.v * (1 + w*.6) * dtR;
    if(s.k === 'pirate') return;
    if(s.x > W - 90) s.dir = -1; if(s.x < 90) s.dir = 1;
  });
  if(pirate && pirate.x > W + 160){ ships = ships.filter(s => s !== pirate); pirate = null; log('sea', 'Tàu hải tặc đã đi xa. Mọi người yên tâm chơi tiếp.', 'hung'); students.forEach(s => { if(s.planKey === 'bien-castle') s.planKey = null; }); }
}
function walls(r, color){
  const t = 10, g = 22;
  if(r.fence){
    ctx.fillStyle = '#c8a46a';
    for(let x=r.x; x<=r.x+r.w; x+=12){ if(Math.abs(x - r.dw[0]) < g) continue; ctx.fillRect(x, r.y-4, 4, 10); ctx.fillRect(x, r.y+r.h-4, 4, 10); }
    for(let y=r.y; y<=r.y+r.h; y+=12){ ctx.fillRect(r.x-2, y, 4, 8); ctx.fillRect(r.x+r.w-2, y, 4, 8); }
    rect('#a8844a', r.x, r.y-1, r.dw[0]-g-r.x, 3); rect('#a8844a', r.dw[0]+g, r.y-1, r.x+r.w-r.dw[0]-g, 3);
    rect('#a8844a', r.x, r.y+r.h-1, r.w, 3);
    return;
  }
  ctx.fillStyle = color;
  const top = [r.x-t/2, r.y-t/2, r.w+t, t], bot = [r.x-t/2, r.y+r.h-t/2, r.w+t, t], lef = [r.x-t/2, r.y-t/2, t, r.h+t], rig = [r.x+r.w-t/2, r.y-t/2, t, r.h+t];
  const seg = (s, sd) => {
    if(r.side !== sd){ ctx.fillStyle = color; ctx.fillRect(...s); return; }
    if(sd === 'b' || sd === 't'){ ctx.fillStyle = color; ctx.fillRect(s[0], s[1], r.dw[0]-g-s[0], t); ctx.fillRect(r.dw[0]+g, s[1], s[0]+s[2]-r.dw[0]-g, t); rect('#5a3a1a', r.dw[0]-g, s[1]+t/2-2, 4, 4); }
    else { ctx.fillStyle = color; ctx.fillRect(s[0], s[1], t, r.dw[1]-g-s[1]); ctx.fillRect(s[0], r.dw[1]+g, t, s[1]+s[3]-r.dw[1]-g); }
  };
  seg(top,'t'); seg(bot,'b'); seg(lef,'l'); seg(rig,'r');
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(r.x-t/2, r.y-t/2, r.w+t, 3);
  if(season === 'dong'){ ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(r.x-t/2, r.y-t/2-2, r.w+t, 4); }
}
function floor(r, a, b, size){
  rect(a, r.x, r.y, r.w, r.h);
  ctx.fillStyle = b;
  for(let y=r.y; y<r.y+r.h; y+=size) for(let x=r.x + ((y-r.y)/size%2)*size; x<r.x+r.w; x+=size*2) ctx.fillRect(x, y, size, size);
}
function sign(r, text, col){
  ctx.font = '22px VT323, monospace';
  const w = ctx.measureText(text).width + 18;
  const x = r.x + 4, y = r.y - 30;
  rect('#2a1c10', x, y, w, 22); rect(col, x+2, y+2, w-4, 18);
  ctx.fillStyle = '#1a1206'; ctx.textBaseline = 'middle'; ctx.fillText(text, x+9, y+12); ctx.textBaseline = 'alphabetic';
}
function miniCube(x, y, s){
  const cols = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#f4f4f4','#ff8a2b','#3d7bff','#ef4b4b','#ffd23f'];
  rect('#111', x-1, y-1, s*3+2, s*3+2);
  for(let i=0;i<9;i++) rect(cols[(i + Math.floor(realT*.7)) % 9], x + (i%3)*s, y + Math.floor(i/3)*s, s-1, s-1);
}
function desk(x, y, w, h){ rect('#7a4b2a', x, y, w, h); rect('#9a6438', x, y, w, 3); rect('#5a3418', x+2, y+h, 3, 6); rect('#5a3418', x+w-5, y+h, 3, 6); }
function drawBike(x, y, col, parked){
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x-8, y-5, 5, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x+8, y-5, 5, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x-8, y-5); ctx.lineTo(x-1, y-12); ctx.lineTo(x+6, y-12); ctx.lineTo(x+8, y-5); ctx.moveTo(x-1, y-12); ctx.lineTo(x, y-5); ctx.lineTo(x-8, y-5); ctx.stroke();
  if(!parked){ rect('#222', x+5, y-16, 2, 4); rect('#222', x+3, y-17, 6, 2); }
}
function drawBuildings(){
  ctx.textBaseline = 'alphabetic';
  let r = R.rubik; floor(r, '#d7b98a', '#cdae7d', 20);
  rect('#2e5b3a', r.x+40, r.y+18, 240, 34); rect('#6b4a2a', r.x+36, r.y+14, 248, 4);
  ctx.font = '20px VT323, monospace'; ctx.fillStyle = '#e9f5e9'; ctx.fillText("R U R' U'  ·  Tầng 1 → 2 → 3", r.x+60, r.y+38);
  miniCube(r.x+250, r.y+22, 8);
  desk(196, 116, 48, 14);
  for(let i=0;i<6;i++){ const [x,y] = SEAT_RUBIK(i); desk(x-24, y-32, 48, 16); miniCube(x-6, y-30, 4); }
  walls(r, '#8c5a3c'); sign(r, 'LỚP RUBIK · CÔ HÀ', '#ffd23f');
  r = R.chess; floor(r, '#e8dcc6', '#d9cbb1', 20);
  CHESS_T.forEach(([x,y], i) => drawChessTable(i, x, y));
  walls(r, '#6d5a4a'); sign(r, 'KHU CỜ VUA · 5 BÀN', '#f4f4f4');
  r = R.music; floor(r, '#3f3a63', '#38345a', 20);
  rect('#111', 780, 96, 96, 56); rect('#222', 784, 100, 88, 30);
  for(let i=0;i<14;i++) rect('#fafafa', 784 + i*6.2, 130, 5.4, 18);
  for(let i=0;i<13;i++) if(i%7!==2 && i%7!==6) rect('#111', 788 + i*6.2, 130, 3.4, 10);
  rect('#2a2a2a', 812, 156, 30, 6);
  const gtr = (x,y,c) => { rect(c, x-8, y, 16, 18); rect(c, x-6, y-6, 12, 8); rect('#3a2410', x-2, y-30, 4, 26); rect('#222', x-3, y+6, 6, 5); };
  gtr(1000, 110, '#c9741f'); gtr(1030, 110, '#a03030');
  rect('#555', 1061, 120, 3, 40); rect('#333', 1056, 116, 13, 8); rect('#222', 1052, 158, 20, 4);
  rect('#2a2a2a', 930, 92, 40, 26); rect('#c33', 936, 98, 28, 14);
  rect('#151515', 1084, 92, 16, 36); rect('#444', 1088, 98, 8, 8); rect('#444', 1088, 112, 8, 8);
  walls(r, '#2a2650'); sign(r, 'ÂM NHẠC · PIANO · ĐÀN HÁT', '#b06bff');
  r = R.hall; floor(r, '#c99a62', '#be8f58', 24);
  rect('#7a2a2a', r.x+20, r.y+14, r.w-40, 96); rect('#9c3434', r.x+20, r.y+14, r.w-40, 12);
  for(let x=r.x+24; x<r.x+r.w-24; x+=14) rect('#8a2e2e', x, r.y+26, 6, 84);
  rect('#d9b36a', r.x+20, r.y+108, r.w-40, 8);
  rect('#5a3418', 1362, 122, 26, 22);
  for(let row=0; row<5; row++) for(let c=0; c<4; c++){ const x = 1262 + c*84 - 26, y = 270 + row*68; rect('#6b4226', x, y, 52, 10); rect('#4a2c16', x+3, y+10, 4, 6); rect('#4a2c16', x+45, y+10, 4, 6); }
  for(let y=r.y+150; y<r.y+r.h-20; y+=80){ rect('#bfe3ff', r.x+r.w-6, y, 8, 40); }
  if(concert){
    const lc = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#b06bff'];
    [1305,1375,1445].forEach((x,i) => { ctx.fillStyle = lc[(i + Math.floor(realT*1.5)) % lc.length] + '33'; ctx.beginPath(); ctx.moveTo(x-6, r.y+16); ctx.lineTo(x+6, r.y+16); ctx.lineTo(x+34, r.y+150); ctx.lineTo(x-34, r.y+150); ctx.fill(); });
    rect('#111', 1288, 122, 34, 10); for(let i=0;i<8;i++) rect('#fafafa', 1290+i*4, 124, 3, 6);
    rect('#222', 1216, 120, 18, 28); rect('#444', 1220, 126, 10, 10); rect('#222', 1516, 120, 18, 28); rect('#444', 1520, 126, 10, 10);
    ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.fillText('♪ ' + SONG + ' ♪', 1290, 100);
  }
  walls(r, '#7a4a2e'); sign(r, 'HỘI TRƯỜNG LỚN', '#ff8a2b');
  ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#f7e0b0'; ctx.fillText('Lớp học lớn nhất trường', r.x+30, r.y+r.h-18);
  r = R.rubikyard; floor(r, season==='dong' ? '#d5e0e4' : '#8fc27a', season==='dong' ? '#cad6db' : '#86b971', 20);
  const cx = 220, cy = 610; rect('#555', cx-34, cy-30, 68, 62);
  const cols = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#f4f4f4','#ff8a2b','#2fbf71','#ef4b4b','#ffd23f'];
  for(let i=0;i<9;i++) rect(cols[(i + Math.floor(realT*.35))%9], cx-30+(i%3)*20, cy-26+Math.floor(i/3)*18, 18, 16);
  RY_SPOTS.forEach(([x,y]) => { rect('#7a4b2a', x-16, y-24, 32, 10); });
  walls(r); sign(r, 'KHU CHƠI RUBIK', '#2fbf71');
  r = R.office; floor(r, '#d9d4c7', '#cfc9ba', 16);
  desk(460, 586, 60, 22); desk(612, 586, 60, 22);
  const stack = Math.min(14, reports.length*2 + 2);
  for(let i=0;i<stack;i++) rect(i%2 ? '#ffffff' : '#ece6d6', 650, 590 - i*2, 18, 2);
  rect('#6b7a8a', 680, 500, 24, 60); for(let i=0;i<3;i++) rect('#4b5a6a', 683, 506+i*18, 18, 3);
  rect('#2fbf71', 432, 500, 14, 14); rect('#7a4b2a', 436, 514, 6, 10);
  walls(r, '#5c6475'); sign(r, 'VĂN PHÒNG BGH', '#3d7bff');
  ctx.font = '16px VT323, monospace'; ctx.fillStyle = '#333'; ctx.fillText('Cô Ngọc', 470, 584); ctx.fillText('Cô Lai', 624, 584);
  r = R.elec; floor(r, '#cfd8e3', '#c3cdd9', 20);
  const busy = students.some(s => s.visible && regionAt(s.x,s.y) === 'elec');
  rect('#1e2a3a', r.x+28, r.y+16, 210, 40); rect('#6b4a2a', r.x+24, r.y+12, 218, 4);
  ctx.strokeStyle = '#e8eef5'; ctx.lineWidth = 2; ctx.strokeRect(r.x+44, r.y+26, 120, 20);
  rect('#e8eef5', r.x+40, r.y+30, 8, 12); rect('#e8eef5', r.x+50, r.y+33, 4, 6);
  rect(busy && (realT%1) < .6 ? '#ffd23f' : '#6b6b4a', r.x+150, r.y+30, 12, 12);
  ctx.font = '17px VT323, monospace'; ctx.fillStyle = '#e8eef5'; ctx.fillText('PIN → CÔNG TẮC → ĐÈN', r.x+70, r.y+50);
  desk(1824, 92, 52, 14);
  for(let j=0;j<7;j++){
    const [x,y] = SEAT_ELEC(j); desk(x-26, y-34, 52, 16); rect('#3c9a5f', x-18, y-32, 36, 10);
    for(let k=0;k<3;k++){ const on = busy && ((Math.floor(realT*3) + j + k) % 3 === 0); rect(on ? ['#ff4b4b','#ffd23f','#4bff7a'][k] : '#556', x-12 + k*10, y-30, 4, 4); }
    rect('#c62828', x-16, y-24, 10, 1); rect('#222', x+4, y-24, 10, 1);
  }
  const rx = 1960 + Math.sin(realT*1.2)*28; rect('#7a4b2a', 1925, 98, 80, 16); rect('#3d7bff', rx-8, 92, 16, 9); rect('#111', rx-7, 100, 4, 4); rect('#111', rx+3, 100, 4, 4); rect('#ffd23f', rx+(Math.cos(realT*1.2) > 0 ? 7 : -9), 94, 2, 2);
  walls(r, '#3d4f66'); sign(r, 'LỚP LẮP RÁP ĐIỆN · CÔ XUÂN', '#26c6da');
  rect('#1a1a1a', 1866, 352, 108, 24); ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center'; ctx.fillText(`ĐỎ ${score.L} – ${score.R} XANH`, 1920, 370); ctx.textAlign = 'left';
  r = R.attend;
  rect('rgba(255,255,255,.18)', r.x, r.y, r.w, r.h);
  rect('#2a1c10', r.x+12, r.y+4, 240, 22); rect('#ffd23f', r.x+14, r.y+6, 236, 18);
  ctx.font = '20px VT323, monospace'; ctx.fillStyle = '#1a1206'; ctx.textBaseline = 'middle'; ctx.fillText(`ĐIỂM DANH · ${DOWN[dow()].toUpperCase()}`, r.x+22, r.y+16);
  const stCol = {co:'#2fbf71', muon:'#ffd23f', vang:'#ef4b4b', phep:'#3d7bff', chua:'#8a90a8', thieu:'#ff8a2b', cn:'#555a78'};
  students.forEach((s,i) => {
    const [x,y] = PAD(i);
    rect('#2a2a3a', x-21, y-13, 42, 26); rect(s.bag, x-19, y-11, 38, 22);
    rect(stCol[s.mark.sang] || '#888', x-19, y+11, 38, 4);
    ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(s.name, x, y+22);
    ctx.textAlign = 'left';
  });
  ctx.textBaseline = 'alphabetic';
  const [fx, fy] = FLAG; rect('#ddd', fx, fy-100, 4, 100); rect('#888', fx-6, fy-4, 16, 6);
  const wv = WEATHERS[weather].wind, top = fy - 98 + (1 - flagRaise)*64;
  ctx.fillStyle = '#da251d'; ctx.beginPath();
  for(let i=0;i<=10;i++){ const x = fx+4+i*5, y = top + Math.sin(i*.6 + realT*(3+wv*4))*(1+wv*2); i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
  for(let i=10;i>=0;i--){ const x = fx+4+i*5, y = top + 32 + Math.sin(i*.6 + realT*(3+wv*4))*(1+wv*2); ctx.lineTo(x,y); }
  ctx.fill(); rect('#ffde00', fx+25, top+13, 7, 7);
  LAMPS.forEach(([x,y]) => { rect('#333', x-2, y-34, 4, 34); rect('#ffe9a8', x-5, y-40, 10, 7); });
  const bikers = students.filter(s => s.bike && s.visible && side(s.x) === 'W');
  bikers.slice(0,7).forEach((s,i) => drawBike(1440 + i*19, 752, s.bag, true));
  for(let i=0;i<truck.boxes;i++) rect(i%2 ? '#c8a46a' : '#b48c52', 1640 + (i%3)*16, 640 - Math.floor(i/3)*14, 14, 12);
}
function drawTree(t, i){
  const [x,y] = t, se = S(), w = WEATHERS[weather].wind;
  let sway = Math.sin(realT*(1.2+w*2) + i)*(1 + w*4);
  if(tornado && dist(x,y,tornado.x,tornado.y) < 220) sway += Math.sin(realT*20+i)*7;
  if(shake > 0 && !RM.matches) sway += Math.sin(realT*40+i)*shake*4;
  rect('rgba(0,0,0,.18)', x-20, y-4, 40, 8);
  rect('#6a4022', x-5, y-34, 10, 34);
  if(!se.leaf){
    ctx.fillStyle = '#6a4022'; ctx.fillRect(x-18+sway*.5, y-58, 4, 26); ctx.fillRect(x+12+sway*.5, y-62, 4, 30); ctx.fillRect(x-2+sway, y-74, 4, 42);
    rect('#ffffff', x-20+sway*.5, y-60, 8, 3); rect('#ffffff', x+10+sway*.5, y-64, 8, 3); rect('#ffffff', x-4+sway, y-76, 8, 3);
    return;
  }
  const c1 = (season==='xuan' && i%3===0) ? se.leaf2 : se.leaf, c2 = season==='thu' ? se.leaf2 : 'rgba(0,0,0,.12)';
  ctx.fillStyle = c1;
  ctx.fillRect(x-24+sway, y-70, 48, 36); ctx.fillRect(x-16+sway*1.2, y-86, 32, 18); ctx.fillRect(x-30+sway*.8, y-58, 60, 20);
  ctx.fillStyle = c2; ctx.fillRect(x-24+sway, y-44, 48, 10); ctx.fillRect(x+6+sway, y-80, 10, 10);
  if(season==='ha' && i%4===1){ rect('#ff7a3a', x-10+sway, y-60, 5, 5); rect('#ff7a3a', x+8+sway, y-50, 5, 5); }
}
function drawXmasTree(){
  const x = 900, y = 452;
  rect('rgba(0,0,0,.2)', x-30, y-4, 60, 8); rect('#6a4022', x-5, y-16, 10, 16);
  [[46,0],[38,-22],[30,-42],[20,-60]].forEach(([w,o]) => { ctx.fillStyle = '#1e7a3a'; ctx.beginPath(); ctx.moveTo(x-w, y-14+o); ctx.lineTo(x+w, y-14+o); ctx.lineTo(x, y-48+o); ctx.closePath(); ctx.fill(); });
  rect('#ffd23f', x-5, y-114, 10, 10);
  const lc = ['#ef4b4b','#ffd23f','#3d7bff','#f4f4f4'];
  for(let i=0;i<16;i++){ const on = (Math.floor(realT*3) + i) % 2; rect(on ? lc[i%4] : '#2a5a3a', x - 34 + (i*17)%68, y - 22 - (i*13)%78, 4, 4); }
  if(festival && festival.kind === 'noel') for(let i=0;i<6;i++){ rect(lc[i%4], x - 40 + i*14, y-2, 12, 10); rect('#fff', x - 35 + i*14, y-2, 2, 10); }
}
function drawLighthouse(){
  const [x, y] = LIGHTHOUSE;
  ctx.fillStyle = '#6b6f78'; ctx.beginPath(); ctx.ellipse(x, y, 80, 30, 0, 0, Math.PI*2); ctx.fill();
  rect('#585c66', x-60, y-8, 30, 14); rect('#7d818b', x+20, y-12, 40, 12);
  for(let i=0;i<8;i++){ const yy = y - 16 - i*20, w = 40 - i*2; rect(i%2 ? '#f4f4f4' : '#d32f2f', x - w/2, yy - 20, w, 20); }
  rect('#2a2a2a', x-18, y-196, 36, 6); rect('#ffe9a8', x-12, y-216, 24, 20); rect('#2a2a2a', x-14, y-222, 28, 6); rect('#d32f2f', x-8, y-232, 16, 10);
  rect('#111', x-1, y-244, 2, 12);
  rect('#5a3418', x-6, y-30, 12, 14);
}
function drawTruck(){
  if(truck.state === 'off') return;
  const {x, y} = truck;
  ctx.save(); ctx.translate(x, y);
  rect('rgba(0,0,0,.25)', -34, 6, 68, 8);
  if(truck.vert) ctx.rotate(truck.dir > 0 ? Math.PI/2 : -Math.PI/2); else if(truck.dir < 0) ctx.scale(-1, 1);
  rect('#f4f4f4', -34, -26, 48, 30); rect('#ef4b4b', -34, -14, 48, 6);
  rect('#3d7bff', 14, -18, 20, 22); rect('#9fd3ff', 24, -14, 8, 8);
  rect('#222', -28, 2, 10, 6); rect('#222', 18, 2, 10, 6);
  ctx.restore();
}
function drawBall(){ rect('rgba(0,0,0,.25)', ball.x-4, ball.y+2, 8, 3); rect('#ffffff', ball.x-4, ball.y-6, 8, 8); rect('#111', ball.x-1, ball.y-4, 3, 3); }
function drawLion(a, by){
  const flap = Math.sin(realT*10)*2;
  ctx.fillStyle = '#d32f2f'; ctx.fillRect(-a.dir*24 - 10, -22 + by, 30, 14);
  for(let i=0;i<5;i++) rect(i%2 ? '#ffd23f' : '#f4f4f4', -a.dir*24 - 10 + i*6, -10 + by, 4, 3);
  rect('#ffd23f', a.dir*2 - 14, -40 + by + flap, 28, 22);
  rect('#d32f2f', a.dir*2 - 12, -38 + by + flap, 24, 8);
  rect('#fff', a.dir*2 - 8, -30 + by + flap, 6, 6); rect('#fff', a.dir*2 + 2, -30 + by + flap, 6, 6);
  rect('#111', a.dir*2 - 6, -28 + by + flap, 2, 3); rect('#111', a.dir*2 + 4, -28 + by + flap, 2, 3);
  rect('#f4f4f4', a.dir*2 - 10, -20 + by + flap, 20, 4); rect('#2fbf71', a.dir*2 - 3, -46 + by + flap, 6, 6);
}
function drawBody(a, swim){
  const by = swim ? -6 : 0, st = a.moving ? (Math.floor(a.walk) % 2) : 0;
  if(!swim){
    rect('rgba(0,0,0,.25)', -8, -2, 16, 4);
    if(a.skirt){ rect(a.pants, -6, -12, 12, 9); rect('#222', -5, -3, 4, 3); rect('#222', 1, -3, 4, 3); }
    else { rect(a.pants, -5, -10, 4, 8 - st*2); rect(a.pants, 1, -10, 4, 8 - (a.moving ? (1-st)*2 : 0)); rect('#222', -5, -2 - st*2, 4, 2); rect('#222', 1, -2 - (a.moving ? (1-st)*2 : 0), 4, 2); }
  }
  if(a.lion === 'tail') return;
  if(a.lion === 'head'){ drawLion(a, by); return; }
  const fb = a.planKey && a.planKey.startsWith('fb-');
  rect(a.shirt, -6, -21 + by, 12, 12);
  if(fb) rect(a.team === 'L' ? '#ef4b4b' : '#3d7bff', -6, -17 + by, 12, 5);
  if(a.aodai){ rect(a.shirt, -6, -21 + by, 12, 16); rect('#ffd23f', -1, -20 + by, 2, 6); }
  if(a.student){
    rect(a.bag, a.dir>0 ? -9 : 6, -20 + by, 3, 10);
    ctx.fillStyle = '#e02424'; ctx.beginPath(); ctx.moveTo(-3,-21+by); ctx.lineTo(3,-21+by); ctx.lineTo(0,-15+by); ctx.fill();
    if(a.saoDo){ rect('#c62828', a.dir>0 ? 5 : -8, -19 + by, 3, 5); rect('#ffd23f', a.dir>0 ? 6 : -7, -18 + by, 1, 1); }
  }
  rect(a.skin, -8, -20 + by, 2, 8); rect(a.skin, 6, -20 + by, 2, 8);
  rect(a.skin, -5, -31 + by, 10, 10);
  rect(a.hair, -6, -33 + by, 12, 4);
  if(a.long){ rect(a.hair, -6, -31 + by, 2, 11); rect(a.hair, 4, -31 + by, 2, 11); }
  else rect(a.hair, a.dir>0 ? -6 : 4, -31 + by, 2, 4);
  rect('#1a1a1a', a.dir>0 ? 0 : -3, -27 + by, 2, 2); rect('#1a1a1a', a.dir>0 ? 3 : 0, -27 + by, 2, 2);
  if(a.glasses) rect('#333', -4, -28 + by, 9, 1);
  if(a.id === 'nam' && festival && festival.kind === 'noel'){ rect('#d32f2f', -6, -38 + by, 12, 6); rect('#d32f2f', a.dir*4 - 2, -42 + by, 6, 5); rect('#fff', -6, -33 + by, 12, 2); rect('#fff', a.dir*6 - 1, -44 + by, 3, 3); rect('#fff', -5, -24 + by, 10, 4); }
  else if(a.cap){ rect(a.cap, -6, -35 + by, 12, 4); rect(a.brim || a.cap, a.dir>0 ? 2 : -9, -32 + by, 7, 2); }
  if(a.style) drawStyle(a, by);
  const ic = a.icon || (a.drum ? 'drum' : a.gift ? 'gift' : a.task.includes('Rubik') ? 'cube' : /mạch|điện/.test(a.task) ? 'bolt' : a.task.includes('cờ vua') ? 'chess' : /(piano|đàn|Hát|nhạc)/i.test(a.task) ? 'note' : a.saoDo ? 'star' : null);
  if(ic){
    const ix = a.dir>0 ? 9 : -15, iy = -24 + by;
    if(ic==='cube') miniCube(ix, iy, 2.4);
    else if(ic==='clip'){ rect('#7a4b2a', ix, iy, 7, 9); rect('#fff', ix+1, iy+2, 5, 6); }
    else if(ic==='paper'){ rect('#fff', ix, iy, 7, 9); rect('#999', ix+1, iy+3, 5, 1); rect('#999', ix+1, iy+5, 5, 1); }
    else if(ic==='whistle') rect('#c0c0c0', ix, iy+3, 6, 4);
    else if(ic==='eye'){ rect('#fff', ix, iy+2, 7, 4); rect('#222', ix+2, iy+3, 3, 2); }
    else if(ic==='chess'){ rect('#111', ix+1, iy+2, 5, 7); rect('#111', ix+2, iy, 3, 3); }
    else if(ic==='note'){ rect('#ffd23f', ix, iy+5, 4, 4); rect('#ffd23f', ix+3, iy, 2, 8); }
    else if(ic==='bolt'){ rect('#ffd23f', ix+3, iy, 3, 4); rect('#ffd23f', ix+1, iy+3, 4, 2); rect('#ffd23f', ix, iy+5, 3, 4); }
    else if(ic==='camcorder'){ rect('#222', ix-1, iy+1, 10, 7); rect('#555', ix + (a.dir>0 ? 8 : -3), iy+2, 4, 5); rect('#ef4b4b', ix+1, iy+2, 2, 2); }
    else if(ic==='anchor'){ rect('#1d2c52', ix+3, iy, 2, 9); rect('#1d2c52', ix, iy+7, 8, 2); rect('#1d2c52', ix+1, iy+2, 6, 1); }
    else if(ic==='drum'){ rect('#d32f2f', ix-1, iy+2, 10, 7); rect('#f4f4f4', ix-1, iy+1, 10, 2); }
    else if(ic==='gift'){ rect('#ef4b4b', ix, iy+2, 8, 7); rect('#ffd23f', ix+3, iy+2, 2, 7); }
    else if(ic==='star'){ rect('#c62828', ix, iy+1, 8, 8); rect('#ffd23f', ix+3, iy+2, 2, 6); rect('#ffd23f', ix+1, iy+4, 6, 2); }
  }
}
function drawPerson(a){
  if(a.inSub || !a.visible) return;
  const x = Math.round(a.x), y = Math.round(a.y);
  const lying = down(a) || (a.task.startsWith('Ngủ trưa') && !a.moving);
  if(a.boat && !a.flying){ drawBoatPerson(a); return; }
  if(a.mount && !a.flying && !lying){ drawMountPerson(a); return; }
  if(a.v16fly && !lying){ drawFlyer(a); return; }
  if(a.cycling && !a.flying && !lying){ drawCyclist(a); return; }
  const surfing = a.task.startsWith('Lướt sóng') && a.y > 880 && !lying && !a.flying;
  const swim = !a.flying && !surfing && a.y > 880 && regionAt(a.x,a.y) === 'beach' && !onPier(a.x, a.y);
  const riding = !a.flying && !lying && ((a.bike && regionAt(a.x,a.y) === 'road') || a.task.startsWith('Đạp xe quanh'));
  let jx = 0;
  if(tornado && dist(a.x,a.y,tornado.x,tornado.y) < 140) jx = Math.sin(realT*30)*3;
  if(weather === 'sieubao' && !indoor(a) && !RM.matches) jx += Math.sin(realT*14 + a.idx)*2.5;
  const fighting = fight && (a === fight.a || a === fight.b) && dist(fight.a.x, fight.a.y, fight.b.x, fight.b.y) < 24;
  if(fighting) jx += Math.sin(realT*24 + a.idx)*3;
  ctx.save();
  if(a.flying){
    rect('rgba(0,0,0,.25)', x-8, y-2, 16, 4);
    ctx.translate(x, y - a.lift - 14); ctx.rotate(realT*10); ctx.translate(0, 14);
    drawBody(a, false);
  } else if(a.getUpT && realT - a.getUpT < .6){
    const gk = (realT - a.getUpT)/.6, ge = gk*gk*(3 - 2*gk); ctx.translate(x + jx, y - 4*(1 - ge)); ctx.rotate(-Math.PI/2 * a.dir * (1 - ge)); drawBody(a, false);
  } else if(lying){
    ctx.translate(x + jx, y - 4); ctx.rotate(-Math.PI/2 * a.dir);
    const shock = realT < a.shocked && Math.floor(realT*12) % 2 === 0;
    drawBody(a, false);
    if(shock){ ctx.globalAlpha = .75; rect('#ffe94a', -9, -34, 18, 34); ctx.globalAlpha = 1; rect('#222', -1, -30, 2, 22); rect('#222', -6, -24, 12, 2); rect('#222', -5, -32, 10, 6); }
  } else if(riding){
    ctx.translate(x + jx, y);
    drawBike(0, 0, a.bag || a.shirt, false);
    ctx.translate(-1, -8); drawBody(a, false);
  } else {
    ctx.translate(x + jx, y); if(surfing){ rect('#fff', -15, -3, 30, 6); rect(a.bag || '#ff6f91', -13, -2, 26, 4); ctx.translate(0, -3); } drawBody(a, swim);
    if(swim){ ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-12, -2 + Math.sin(realT*4)*1.5, 24, 3); }
  }
  ctx.restore();
  if(lying && !down(a)){ ctx.font = '14px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('z', x + 8, y - 16 - (realT*8 % 8)); ctx.fillText('Z', x + 14, y - 24 - (realT*6 % 8)); }
  if(fighting && a === fight.a){
    ctx.fillStyle = 'rgba(220,200,170,.7)'; for(let i=0;i<6;i++){ const ang = realT*6 + i; ctx.beginPath(); ctx.arc(x + 9 + Math.cos(ang)*14, y - 14 + Math.sin(ang)*8, 6, 0, Math.PI*2); ctx.fill(); }
    rect('#ef4b4b', x+6, y-56, 4, 10); rect('#ef4b4b', x+6, y-43, 4, 4);
  }
  if(a === selected && false){
    const bob = Math.sin(realT*5)*2, yy = y - (a.flying ? a.lift : 0);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(x-6, yy-52+bob); ctx.lineTo(x+6, yy-52+bob); ctx.lineTo(x, yy-44+bob); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(x-11, yy-38, 22, 40);
  }
}
function drawTornado(dt){
  if(!tornado) return;
  const t = tornado;
  if(weather !== 'loc') t.life -= dt*.4;
  if(t.life <= 0){ tornado = null; return; }
  if(!paused && !FEED){
    t.x += t.vx*dt*Math.max(1, speed)*.5; t.a += dt*10;
    t.y = clamp(t.baseY + Math.sin(realT*.45)*220, 420, 1150);
    if(t.x > W+120){ t.x = -100; t.baseY = rnd(560, 980); }
  }
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, t.life))*.85;
  for(let i=0;i<16;i++){
    const h = i*12, rw = 10 + i*i*.32, off = Math.sin(t.a*.5 + i*.4)*i*1.4;
    ctx.fillStyle = i%2 ? 'rgba(90,95,110,.7)' : 'rgba(140,145,160,.6)';
    ctx.beginPath(); ctx.ellipse(t.x + off, t.y - h, rw, 6 + i*.5, 0, 0, Math.PI*2); ctx.fill();
  }
  for(let i=0;i<14;i++){ const ang = t.a*1.5 + i, rr = 20 + (i*13)%70; rect('#5a4a3a', t.x + Math.cos(ang)*rr, t.y - 30 - (i*17)%140 + Math.sin(ang)*8, 4, 4); }
  ctx.restore();
}
function spawnParticles(dt){
  const se = season, w = weather, wind = WEATHERS[w].wind;
  const vx0 = cam.x - cw/cam.z/2 - 50, vx1 = cam.x + cw/cam.z/2 + 50, vy0 = cam.y - ch/cam.z/2 - 50, vy1 = cam.y + ch/cam.z/2 + 50;
  const rx = () => rnd(Math.max(0,vx0), Math.min(W,vx1)), ry = () => rnd(Math.max(Y0,vy0), Math.min(H,vy1));
  const n = k0 => { const k = (RM.matches ? k0*.3 : k0)*dt*60; return Math.random() < k % 1 ? Math.ceil(k) : Math.floor(k); };
  if(['mua','bao','loc','sieubao','samset'].includes(w)){
    const k = w === 'mua' ? 4 : w === 'sieubao' ? 16 : w === 'samset' ? 6 : 9;
    for(let i=0;i<n(k);i++) parts.push({k: se==='dong' && w==='mua' ? 'snow' : 'rain', x:rx(), y:ry()-40, vx:60 + wind*160, vy:520, life:.28});
  }
  if(w === 'muaphun') for(let i=0;i<n(2);i++) parts.push({k:'rain', x:rx(), y:ry()-20, vx:20, vy:260, life:.2});
  if(w === 'tuyet' || w === 'baotuyet') for(let i=0;i<n(w === 'tuyet' ? 4 : 11);i++) parts.push({k:'snow', x:rx(), y:ry()-30, vx:20 + wind*150, vy:60, life:3});
  if(w === 'saobang' && Math.random() < dt*3) parts.push({k:'meteor', x:rx(), y:Math.max(0, vy0) + rnd(0, 300), vx:rnd(500,800), vy:rnd(250,400), life:.7});
  if(w === 'muada') for(let i=0;i<n(5);i++) parts.push({k:'hail', x:rx(), y:ry()-60, vx:40, vy:420, life:.3});
  if(w === 'sieubao') for(let i=0;i<n(.8);i++) parts.push({k:'debris', x:vx0, y:ry(), vx:700, vy:rnd(-60,60), life:3, c:pick(['#6a4022','#4cae49','#9a8a6a','#e0832d'])});
  if(se==='dong') for(let i=0;i<n(.8 + (w==='gio'?1:0));i++) parts.push({k:'snow', x:rx(), y:ry()-30, vx:20 + wind*90, vy:40, life:4});
  if(se==='xuan') for(let i=0;i<n(.35 + wind*.4);i++) parts.push({k:'petal', x:rx(), y:ry(), vx:30 + wind*120, vy:18, life:3});
  if(se==='thu') for(let i=0;i<n(.4 + wind*.5);i++) parts.push({k:'leaf', x:rx(), y:ry(), vx:25 + wind*140, vy:22, life:3, c: Math.random()<.5 ? '#e0832d' : '#c9502a'});
  if(w==='gio' || w==='bao' || w==='sieubao' || w==='baotuyet') for(let i=0;i<n(.5);i++) parts.push({k:'wind', x:vx0, y:ry(), vx:500 + wind*200, vy:0, life:2.5});
  if(musicOn && Math.random() < dt*2.2) parts.push({k:'note', x:rnd(790,1100), y:rnd(110,230), vx:rnd(-10,10), vy:-25, life:2});
  if(musicOn && concert && Math.random() < dt*4) parts.push({k:'note', x:rnd(1250,1500), y:rnd(110,200), vx:rnd(-12,12), vy:-28, life:2});
  if(parts.length > 1100) parts.splice(0, parts.length - 1100);
}
function drawParticles(dt){
  for(const p of parts){
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(p.k==='rain'){ ctx.strokeStyle = 'rgba(200,220,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*.03, p.y - 16); ctx.stroke(); if(p.life < .03) rect('rgba(220,235,255,.5)', p.x-3, p.y, 6, 2); }
    else if(p.k==='hail'){ rect('#f4f8ff', p.x, p.y, 4, 4); if(p.life < .05) rect('#f4f8ff', p.x+4, p.y-3, 3, 3); }
    else if(p.k==='snow') rect('#ffffff', p.x + Math.sin(p.y*.05)*4, p.y, 3, 3);
    else if(p.k==='petal') rect('#ff9ccf', p.x + Math.sin(p.y*.06)*6, p.y, 4, 3);
    else if(p.k==='leaf') rect(p.c, p.x + Math.sin(p.y*.05)*8, p.y, 5, 4);
    else if(p.k==='debris') rect(p.c, p.x, p.y, 7, 4);
    else if(p.k==='wind'){ ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(p.x, p.y + Math.sin(p.x*.02)*6, 40, 2); }
    else if(p.k==='bubble'){ ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.stroke(); }
    else if(p.k==='meteor'){ ctx.strokeStyle = 'rgba(255,255,230,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*.09, p.y - p.vy*.09); ctx.stroke(); rect('#fff', p.x-1, p.y-1, 3, 3); }
    else if(p.k==='note'){ ctx.globalAlpha = Math.max(0, p.life/2); rect('#ffd23f', p.x, p.y+6, 5, 5); rect('#ffd23f', p.x+4, p.y-2, 2, 10); ctx.globalAlpha = 1; }
  }
  if(dt > 0) parts = parts.filter(p => p.life > 0 && p.x < W+60);
}
function lightLevel(){
  const t = clock; let d;
  if(t < 360) d = .6; else if(t < 420) d = .6*(1-(t-360)/60); else if(t < 1020) d = 0; else if(t < 1080) d = .6*(t-1020)/60; else d = .6;
  return Math.min(.8, d + WEATHERS[weather].dark);
}
function drawLighting(){
  const d = lightLevel();
  if(weather === 'nang' && d < .1 && !RM.matches){
    ctx.fillStyle = S().tint; ctx.fillRect(0,NY,W,H-NY);
    ctx.fillStyle = 'rgba(255,240,180,.06)';
    for(let i=0;i<7;i++){ ctx.beginPath(); const x = ((i*420 + realT*12) % (W+600)) - 300; ctx.moveTo(x,0); ctx.lineTo(x+120,0); ctx.lineTo(x-280,H); ctx.lineTo(x-400,H); ctx.fill(); }
  } else { ctx.fillStyle = S().tint; ctx.fillRect(0,NY,W,H-NY); }
  if(weather === 'nangnong'){ ctx.fillStyle = 'rgba(255,140,40,.12)'; ctx.fillRect(0,NY,W,H-NY); if(!RM.matches){ ctx.fillStyle = 'rgba(255,255,255,.05)'; for(let i=0;i<14;i++) ctx.fillRect(VB.x0, (i*130 + realT*30) % H, VB.x1 - VB.x0, 2); } }
  if(weather === 'tuyet' || weather === 'baotuyet'){ ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(0, 0, W, 790); }
  if(weather === 'cauvong'){ const cx = clamp(cam.x, 600, W - 600); ['#ff0000','#ff8a00','#ffe600','#2fbf71','#3d7bff','#4b0082','#8f00ff'].forEach((c,i) => { ctx.strokeStyle = c; ctx.globalAlpha = .28; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, 1500, 1050 - i*16, Math.PI*1.08, Math.PI*1.92); ctx.stroke(); }); ctx.globalAlpha = 1; }
  if(weather === 'suongmu'){
    ctx.fillStyle = 'rgba(225,230,238,.5)'; ctx.fillRect(0,NY,W,H-NY);
    for(let i=0;i<10;i++){ const x = ((i*330 + realT*14) % (W+400)) - 200, y = 120 + (i*217) % (H-200); const g = ctx.createRadialGradient(x, y, 10, x, y, 220); g.addColorStop(0, 'rgba(240,244,250,.45)'); g.addColorStop(1, 'rgba(240,244,250,0)'); ctx.fillStyle = g; ctx.fillRect(x-220, y-220, 440, 440); }
  }
  if(d > 0 && !v25Dark(d)){ ctx.fillStyle = `rgba(12,18,48,${d})`; ctx.fillRect(0,NY,W,H-NY); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if(d > .2){
    if(!V26ON) LAMPS.forEach(([x,y]) => { const g = ctx.createRadialGradient(x, y-36, 4, x, y-20, 110); g.addColorStop(0, `rgba(255,220,140,${d*.6})`); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(x-120, y-150, 240, 260); });
    students.forEach(s => { if(s.visible) return; const h = s.home; ctx.fillStyle = `rgba(255,214,120,${d*.8})`; ctx.fillRect(h.x + h.w*.18, h.y + h.h*.55, 10, 8); ctx.fillRect(h.x + h.w*.7, h.y + h.h*.55, 10, 8); });
    DALAT.forEach(h => { if(h.x > VB.x1 || h.x + h.w < VB.x0) return; ctx.fillStyle = `rgba(255,214,120,${d*.7})`; ctx.fillRect(h.x+8, h.y+h.h*.5, 10, 12); ctx.fillRect(h.x+h.w-18, h.y+h.h*.5, 10, 12); });
    cars.forEach(c => { const dir = c.lane ? 1 : -1, y = c.lane ? 714 : 694; if(c.x < VB.x0 || c.x > VB.x1) return; const g = ctx.createRadialGradient(c.x + dir*36, y, 2, c.x + dir*60, y, 60); g.addColorStop(0, `rgba(255,250,200,${d*.7})`); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.fillRect(c.x + dir*60 - 60, y - 60, 120, 120); });
    TENTS.forEach(([tx,ty], i) => { if(i%2 || isStorm()) return; const g = ctx.createRadialGradient(tx+30, ty+4, 2, tx+30, ty+4, 70); g.addColorStop(0, `rgba(255,150,60,${d*.8})`); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(tx-40, ty-66, 140, 140); });
  }
  const beamA = Math.max(.07, d*.9, weather === 'suongmu' ? .5 : 0, isStorm() ? .35 : 0);
  const lx = LIGHTHOUSE[0], ly = LIGHTHOUSE[1] - 206;
  if(v26Beam(beamA)) [lhAng, lhAng + Math.PI].forEach((ang, k) => {
    if(k === 1 && pirate) return;
    const L = 1300, sp = .1;
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, L);
    g.addColorStop(0, `rgba(255,240,170,${beamA})`); g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, ly);
    ctx.lineTo(lx + Math.cos(ang-sp)*L, ly + Math.sin(ang-sp)*L*.55); ctx.lineTo(lx + Math.cos(ang+sp)*L, ly + Math.sin(ang+sp)*L*.55); ctx.closePath(); ctx.fill();
  });
  if(v26Beam(beamA)){ const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 40); lg.addColorStop(0, 'rgba(255,240,170,.8)'); lg.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = lg; ctx.fillRect(lx-40, ly-40, 80, 80); }
  ctx.restore();
  if(flash > 0){ ctx.fillStyle = `rgba(235,240,255,${flash*.22})`; ctx.fillRect(0,NY,W,H-NY); }
  if(fade > 0){ ctx.fillStyle = `rgba(5,8,20,${fade})`; ctx.fillRect(0,NY,W,H-NY); }
}
function drawBolts(){
  bolts.forEach(b => {
    ctx.beginPath(); b.seg.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
    ctx.strokeStyle = 'rgba(160,190,255,.5)'; ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,220,.95)'; ctx.lineWidth = 4; ctx.stroke();
    rect('rgba(255,240,150,.6)', b.x-14, b.y-4, 28, 8);
  });
}
function drawLabels(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const small = cam.z < .5;
  const pill = (sx, sy, text, bg, fg) => { ctx.font = (small ? '14px' : '16px') + ' VT323, monospace'; const w = ctx.measureText(text).width + 10; ctx.fillStyle = bg; ctx.fillRect(sx - w/2, sy - 8, w, 16); ctx.fillStyle = fg; ctx.fillText(text, sx, sy); };
  for(const a of agents){
    if(!a.visible || a.inSub) continue;
    const [sx, sy] = toScreen(a.x, a.y - (a.y > 880 ? 44 : 50) - (a.flying ? a.lift : 0));
    if(sx < -60 || sx > cw+60 || sy < -40 || sy > ch+40) continue;
    if(v35Name(a) && (!small || a === selected || !a.student)) pill(sx, sy, a.name + (a.saoDo && !small ? ' ★' : ''), a === PLAYER ? 'rgba(20,90,60,.9)' : a.student ? 'rgba(15,21,48,.85)' : 'rgba(60,20,70,.88)', '#fff');
    if(a.bubble && realT < a.bubbleT){
      ctx.font = '16px VT323, monospace';
      const w = Math.min(230, ctx.measureText(a.bubble).width + 14), by = sy - 24;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - w/2, by - 10, w, 20);
      ctx.beginPath(); ctx.moveTo(sx-5, by+10); ctx.lineTo(sx+5, by+10); ctx.lineTo(sx, by+16); ctx.fill();
      ctx.strokeStyle = '#0f1530'; ctx.lineWidth = 2; ctx.strokeRect(sx - w/2, by - 10, w, 20);
      ctx.fillStyle = '#0f1530'; ctx.fillText(a.bubble, sx, by, w - 8);
    }
  }
  if(!small){
    const [ux, uy] = toScreen(sub.x, sub.y - 34);
    pill(ux, uy, sub.state === 'dock' ? 'Tàu ngầm' : `Tàu ngầm · Chú Hưng${sub.pass.length ? ' + ' + sub.pass.map(s => s.name).join(', ') : ''}`, 'rgba(15,60,90,.9)', '#ffd23f');
    ships.forEach(s => { if(s.k !== 'navy' && s.k !== 'pirate2' && s.k !== 'tour') return; const [lx, ly] = toScreen(s.x, s.y - (s.k === 'navy' ? 80 : s.k === 'tour' ? 50 : 86)); if(lx < -90 || lx > cw + 90 || ly < -20 || ly > ch + 20) return; const pir = s.k === 'pirate2'; pill(lx, ly, s.k === 'navy' ? 'Tàu quân đội · ' + s.nation : s.k === 'tour' ? 'Thuyền du lịch' : 'Tàu hải tặc', pir ? 'rgba(20,20,20,.9)' : 'rgba(40,50,70,.9)', pir ? '#ff7b7b' : '#fff'); });
    SKYCLOUDS.forEach(c => { if(c.t < 1 || c.from === 'cumulus') return; const [lx, ly] = toScreen(c.x, c.y + 62*c.s); if(lx < -80 || lx > cw + 80 || ly < -20 || ly > ch + 20) return; pill(lx, ly, 'Mây hình ' + CLOUD_NAMES[c.from], 'rgba(15,21,48,.6)', '#fff'); });
    if(pirate){ const [px, py] = toScreen(pirate.x, pirate.y - 84); pill(px, py, 'Tàu hải tặc!', 'rgba(20,20,20,.9)', '#ff7b7b'); }
    const [hx, hy] = toScreen(LIGHTHOUSE[0], LIGHTHOUSE[1] - 256); pill(hx, hy, 'Hải đăng', 'rgba(15,21,48,.85)', '#fff');
    if(truck.state !== 'off'){ const [tx, ty] = toScreen(truck.x, truck.y - 40); pill(tx, ty, 'Xe chở hàng sự kiện', 'rgba(15,21,48,.85)', '#fff'); }
  }
  if(weather === 'nhatthuc'){ const ex = cw/2, ey = 92; const g = ctx.createRadialGradient(ex, ey, 18, ex, ey, 46); g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(ex-50, ey-50, 100, 100); ctx.fillStyle = '#05070f'; ctx.beginPath(); ctx.arc(ex, ey, 20, 0, Math.PI*2); ctx.fill(); pill(ex, ey + 40, 'Nhật thực', 'rgba(15,21,48,.85)', '#ffd23f'); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
// ================= VISITORS, FLAGS, CARS, FOREST LIFE =================
function star(cx, cy, r, c){ ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<10;i++){ const rr = i%2 ? r*.42 : r, a = -Math.PI/2 + i*Math.PI/5; ctx.lineTo(cx + Math.cos(a)*rr, cy + Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); }
function drawFlag(code, x, y, w, h){
  const band = (cols, vert) => cols.forEach((col, i) => rect(col, vert ? x + i*w/cols.length : x, vert ? y : y + i*h/cols.length, vert ? w/cols.length + .5 : w, vert ? h : h/cols.length + .5));
  switch(code){
    case 'vn': rect('#da251d', x, y, w, h); star(x+w/2, y+h/2, h*.32, '#ffde00'); break;
    case 'jp': rect('#fff', x, y, w, h); circ(x+w/2, y+h/2, h*.3, '#bc002d'); break;
    case 'us': band(['#b22234','#fff','#b22234','#fff','#b22234','#fff','#b22234']); rect('#3c3b6e', x, y, w*.42, h*.57); break;
    case 'fr': band(['#0055a4','#fff','#ef4135'], true); break;
    case 'it': band(['#009246','#fff','#ce2b37'], true); break;
    case 'mx': band(['#006847','#fff','#ce1126'], true); circ(x+w/2, y+h/2, h*.12, '#8d6e3f'); break;
    case 'de': band(['#000','#dd0000','#ffce00']); break;
    case 'nl': band(['#ae1c28','#fff','#21468b']); break;
    case 'in': band(['#ff9933','#fff','#138808']); circ(x+w/2, y+h/2, h*.13, '#000080'); break;
    case 'id': band(['#ce1126','#fff']); break;
    case 'th': band(['#a51931','#f4f5f8','#2d2a4a','#2d2a4a','#f4f5f8','#a51931']); break;
    case 'es': band(['#aa151b','#f1bf00','#f1bf00','#aa151b']); break;
    case 'ar': band(['#74acdf','#fff','#74acdf']); circ(x+w/2, y+h/2, h*.12, '#f6b40e'); break;
    case 'gb': rect('#012169', x, y, w, h); rect('#fff', x, y+h*.36, w, h*.28); rect('#fff', x+w*.42, y, w*.16, h); rect('#c8102e', x, y+h*.42, w, h*.16); rect('#c8102e', x+w*.46, y, w*.08, h); break;
    case 'kr': rect('#fff', x, y, w, h); circ(x+w/2, y+h/2, h*.26, '#0047a0'); ctx.fillStyle = '#cd2e3a'; ctx.beginPath(); ctx.arc(x+w/2, y+h/2, h*.26, Math.PI, 0); ctx.fill(); rect('#000', x+2, y+2, 3, 1); rect('#000', x+w-5, y+h-3, 3, 1); break;
    case 'au': rect('#012169', x, y, w, h); rect('#fff', x, y+h*.2, w*.45, h*.1); rect('#fff', x+w*.18, y, w*.09, h*.5); star(x+w*.25, y+h*.75, h*.14, '#fff'); star(x+w*.72, y+h*.35, h*.1, '#fff'); star(x+w*.8, y+h*.7, h*.1, '#fff'); break;
    case 'br': rect('#009c3b', x, y, w, h); ctx.fillStyle = '#ffdf00'; ctx.beginPath(); ctx.moveTo(x+w/2, y+1.5); ctx.lineTo(x+w-2, y+h/2); ctx.lineTo(x+w/2, y+h-1.5); ctx.lineTo(x+2, y+h/2); ctx.closePath(); ctx.fill(); circ(x+w/2, y+h/2, h*.24, '#002776'); break;
    case 'ca': band(['#d52b1e','#fff','#fff','#d52b1e'], true); star(x+w/2, y+h/2, h*.28, '#d52b1e'); break;
    case 'se': rect('#006aa7', x, y, w, h); rect('#fecc00', x, y+h*.4, w, h*.2); rect('#fecc00', x+w*.3, y, w*.14, h); break;
    default: rect('#888', x, y, w, h);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
}
function drawFlagPlaza(){
  if(VB.x1 < 1660 || VB.x0 > 2400) return;
  WORLD_FLAGS.forEach(([c], i) => { const x = 1680 + i*35, y = 850; rect('#cfd8dc', x, y-52, 2, 52); rect('#90a4ae', x-3, y-2, 8, 4); drawFlag(c, x+2, y-52 + Math.sin(realT*3 + i)*.6, 22, 14); });
  ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#5a4a2a'; ctx.fillText('QUẢNG TRƯỜNG CỜ CÁC NƯỚC', 1700, 866);
}
function drawTsunami(){
  if(!tsu || tsu.y >= H) return;
  const y = tsu.y, x0 = Math.max(0, VB.x0), x1 = Math.min(W, VB.x1);
  if(y < 872){ ctx.fillStyle = 'rgba(30,110,160,.95)'; ctx.fillRect(x0, y, x1 - x0, 872 - y + 4); }
  const g = ctx.createLinearGradient(0, y, 0, y + 220); g.addColorStop(0, 'rgba(30,110,160,.95)'); g.addColorStop(1, 'rgba(20,70,120,0)');
  ctx.fillStyle = g; ctx.fillRect(x0, Math.max(y, 872), x1 - x0, 220);
  ctx.fillStyle = '#ffffff'; for(let x = Math.floor(x0/10)*10; x < x1; x += 10) ctx.fillRect(x, y - 8 + Math.sin(x*.05 + realT*6)*5, 10, 9);
}
const NPC_LOOKS = [['#ff6f91','#1d2c52','#2a1a12'],['#26c6da','#33334a','#1a1a1a'],['#ffd23f','#5a3a1e','#3a2418'],['#8e24aa','#222222','#120d0a'],['#43a047','#455a64','#5a3a1a'],['#fb8c00','#263238','#1c140f'],['#f4f4f4','#1565c0','#2b1d14'],['#e53935','#37474f','#1a1010']];
function mkNpc(kind, o, i){ const l = NPC_LOOKS[i % NPC_LOOKS.length]; return Object.assign({kind, x:0, y:0, shirt:l[0], pants:l[1], hair:l[2], skin:SKINS[i % SKINS.length], dir:1, walk:0, moving:false, task:'', icon:null, planKey:null, long: i%3 === 0, idx:i, t:0, sp:0}, o); }
const trailPt = (t, r) => { const w = r.x1 - r.x0, h = r.y1 - r.y0, L = 2*(w+h); let s = (((t % 1) + 1) % 1) * L; if(s < w) return [r.x0 + s, r.y0, 1]; s -= w; if(s < h) return [r.x1, r.y0 + s, 1]; s -= h; if(s < w) return [r.x1 - s, r.y1, -1]; s -= w; return [r.x0, r.y1 - s, -1]; };
const npcs = [];
(() => {
  for(let i=0;i<12;i++) npcs.push(mkNpc('swim', {x0:1420 + i*320, y0:918 + (i%3)*24}, i));
  for(let i=0;i<9;i++) npcs.push(mkNpc('surf', {x0:1500 + i*400, board:['#ff6f91','#ffd23f','#26c6da','#f4f4f4','#ff8a2b'][i%5]}, i+3));
  for(let i=0;i<16;i++){ const x = 1400 + i*240 + (i%2)*50; if(x > 1640 && x < 2580) continue; npcs.push(mkNpc('sun', {x, y:834 + (i%3)*14, um:['#ef4b4b','#3d7bff','#ffd23f','#2fbf71','#ff8a2b'][i%5]}, i+1)); }
  for(let i=0;i<8;i++) npcs.push(mkNpc('bike', {t:i/8, sp:.012 + (i%3)*.002}, i+2));
  TENTS.forEach((tn,i) => npcs.push(mkNpc('camp', {x:tn[0] - 18, y:tn[1] + 14}, i+4)));
  for(let i=0;i<6;i++) npcs.push(mkNpc('picnic', {x:R.picnic.x + 30 + (i%3)*86, y:R.picnic.y + 50 + Math.floor(i/3)*80}, i+5));
  for(let i=0;i<5;i++){ const a = .5 + i*1.25; npcs.push(mkNpc('fishing', {x:LAKE.cx + Math.cos(a)*(LAKE.rx+12), y:LAKE.cy + Math.sin(a)*(LAKE.ry+10), a}, i+6)); }
  for(let i=0;i<6;i++) npcs.push(mkNpc('walk', {t:i/6, sp:.006 + (i%2)*.002}, i+7));
  for(let i=0;i<6;i++) npcs.push(mkNpc('kite', {x0:1500 + i*600, kc:['#ff6f91','#ffd23f','#26c6da','#b06bff'][i%4]}, i+2));
  for(let i=0;i<4;i++){ const a = .4 + i*.8; npcs.push(mkNpc('fishing', {x:POND.cx + Math.cos(a)*(POND.rx+12), y:Math.min(-40, POND.cy + Math.sin(a)*(POND.ry+10)), a}, i+3)); }
})();
function npcShown(n){
  const light = clock > 400 && clock < 1080;
  if(n.kind === 'swim' || n.kind === 'surf' || n.kind === 'sun' || n.kind === 'kite') return light && !isWet() && !tsu && season !== 'dong' && weather !== 'suongmu' && weather !== 'muaphun';
  if(n.kind === 'camp') return !isStorm() && weather !== 'tuyet';
  return light && !isWet();
}
function updateNpcs(dtR){
  const gd = R.garden, GR = {x0:gd.x-10, x1:gd.x+gd.w+10, y0:gd.y-8, y1:gd.y+gd.h+8};
  npcs.forEach((n,i) => {
    n.t += dtR*n.sp;
    if(n.kind === 'swim'){ n.x = n.x0 + Math.sin(realT*.3 + i)*40; n.y = n.y0 + Math.sin(realT*1.3 + i)*3; n.dir = Math.cos(realT*.3 + i) > 0 ? 1 : -1; }
    else if(n.kind === 'surf'){ const ph = (realT*.07 + i*.17) % 1; if(ph < .45){ const k = ph/.45; n.y = 1070 - k*170; n.x = n.x0 + k*90; n.riding = true; n.dir = 1; } else { const k = (ph - .45)/.55; n.y = 900 + k*170; n.x = n.x0 + 90 - k*90; n.riding = false; n.dir = -1; } }
    else if(n.kind === 'kite'){ const ph = realT*.05 + i*.3; n.x = n.x0 + Math.sin(ph)*380; n.dir = Math.cos(ph) > 0 ? 1 : -1; n.y = 966 + Math.sin(ph*3)*16; }
    else if(n.kind === 'bike'){ const [x,y,d] = trailPt(n.t, TRAIL); n.x = x; n.y = y; n.dir = d; n.moving = true; n.walk += dtR*8; }
    else if(n.kind === 'walk'){ const [x,y,d] = trailPt(n.t, GR); n.x = x; n.y = y; n.dir = d; n.moving = true; n.walk += dtR*4; }
  });
}
function drawNpc(n){
  ctx.save(); ctx.translate(Math.round(n.x), Math.round(n.y));
  switch(n.kind){
    case 'swim': drawBody(n, true); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-12, -2 + Math.sin(realT*4 + n.idx)*1.5, 24, 3); break;
    case 'surf': rect('#fff', -16, -3, 32, 6); rect(n.board, -14, -2, 28, 4); if(n.riding){ rect('rgba(255,255,255,.75)', -24, 0, 8, 3); ctx.translate(0, -3); drawBody(n, false); } else drawBody(n, true); break;
    case 'sun': rect(n.um === '#ffd23f' ? '#3d7bff' : '#ffd23f', -18, -7, 32, 10); ctx.save(); ctx.translate(-2, -2); ctx.rotate(-Math.PI/2); drawBody(n, false); ctx.restore(); rect('#888', 12, -40, 2, 40); ctx.fillStyle = n.um; ctx.beginPath(); ctx.ellipse(13, -40, 22, 9, 0, Math.PI, 0); ctx.fill(); rect('#fff', 6, -48, 3, 8); rect('#fff', 18, -47, 3, 7); break;
    case 'kite': { rect('#fff', -15, -3, 30, 6); rect(n.kc, -13, -2, 26, 4); rect('rgba(255,255,255,.75)', -n.dir*22 - 4, 0, 8, 3); ctx.save(); ctx.translate(0, -3); drawBody(n, false); ctx.restore(); const kx = -n.dir*70, ky = -130 + Math.sin(realT*2 + n.idx)*8; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(kx - 26, ky + 6); ctx.moveTo(0, -20); ctx.lineTo(kx + 26, ky + 6); ctx.stroke(); ctx.fillStyle = n.kc; ctx.beginPath(); ctx.moveTo(kx - 30, ky + 8); ctx.quadraticCurveTo(kx, ky - 26, kx + 30, ky + 8); ctx.quadraticCurveTo(kx, ky - 10, kx - 30, ky + 8); ctx.fill(); break; }
    case 'bike': drawBike(0, 0, n.shirt, false); ctx.translate(-1, -8); drawBody(n, false); break;
    case 'fishing': { drawBody(n, false); const ux = Math.cos(n.a), uy = Math.sin(n.a); ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, -18); ctx.lineTo(-ux*30, -uy*14 - 26); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-ux*30, -uy*14 - 26); ctx.lineTo(-ux*40, -uy*22 + Math.sin(realT*2)*2); ctx.stroke(); break; }
    default: drawBody(n, false);
  }
  ctx.restore();
}
const KOI = Array.from({length:14}, (_, i) => ({r:.25 + (i%5)*.14, sp:(.15 + (i%4)*.06) * (i%2 ? 1 : -1), ph:i*.9, c:['#ff7043','#ffffff','#e53935','#ffb74d'][i%4]}));
const LOTUS_FL = Array.from({length:16}, (_, i) => { const a = i*2.1, r = ((i*53) % 90)/100; return [LOTUS.cx + Math.cos(a)*LOTUS.rx*.8*r, LOTUS.cy + Math.sin(a)*LOTUS.ry*.8*r]; });
function drawForestDyn(){
  if(VB.x1 < 2636 || VB.y0 > 600) return;
  if(VB.x1 > LAKE.cx - LAKE.rx && VB.x0 < LAKE.cx + LAKE.rx){
    if(season !== 'dong') KOI.forEach(k => { const a = realT*k.sp + k.ph, x = LAKE.cx + Math.cos(a)*LAKE.rx*k.r, y = LAKE.cy + Math.sin(a)*LAKE.ry*k.r*.9; if(Math.abs(y - LAKE.cy) < 13) return; ctx.fillStyle = k.c; ctx.beginPath(); ctx.ellipse(x, y, 7, 3, a + Math.PI/2*Math.sign(k.sp), 0, Math.PI*2); ctx.fill(); if(k.c === '#ffffff') rect('#e53935', x-2, y-1, 3, 2); });
    for(let i=0;i<3;i++){ const a = realT*.08 + i*2.1, x = LAKE.cx + Math.cos(a)*LAKE.rx*.75, y = LAKE.cy + Math.sin(a)*LAKE.ry*.6; if(Math.abs(y - LAKE.cy) < 14) continue; const f = Math.sin(a) > 0 ? -1 : 1; rect('#f4f4f4', x-5, y-3, 10, 6); rect('#2e7d32', x + f*7 - 2, y-6, 4, 4); rect('#ff9800', x + f*9 - 1, y-5, 2, 2); }
  }
  if(VB.x1 > LOTUS.cx - LOTUS.rx && VB.x0 < LOTUS.cx + LOTUS.rx && season !== 'dong') LOTUS_FL.forEach(([x,y], i) => { const s = Math.sin(realT*1.5 + i); circ(x + s, y - 2, 4, '#f48fb1'); circ(x + s, y - 3, 2, '#fce4ec'); rect('#ffd23f', x + s - .5, y - 3.5, 1.5, 1.5); });
  TENTS.forEach(([tx, ty], i) => { if(i%2 || isStorm()) return; const fx = tx + 30, fy = ty + 4; if(!inVB(fx, fy)) return; for(let k=0;k<3;k++){ const hh = 6 + Math.sin(realT*10 + k*2 + i)*3; rect(['#ff5722','#ff9800','#ffeb3b'][k], fx - 3 + k*2, fy - hh, 2 + (k === 1 ? 1 : 0), hh); } });
}
const CAR_COLORS = ['#e53935','#fdd835','#1e88e5','#43a047','#fb8c00','#8e24aa','#212121','#f5f5f5','#00acc1','#d81b60','#ff6f00','#76ff03'];
const cars = CAR_COLORS.map((c,i) => ({x:1700 + i*290, lane:i%2, v:240 + (i*53)%180, c, st:i%3}));
function updateCars(dtR){ cars.forEach(c => { c.x += (c.lane ? 1 : -1)*c.v*dtR; if(c.x > W + 60) c.x = 1650; if(c.x < 1640) c.x = W + 40; }); }
function drawCar(c){
  const dir = c.lane ? 1 : -1, y = c.lane ? 720 : 700;
  ctx.save(); ctx.translate(c.x, y); ctx.scale(dir, 1);
  rect('rgba(0,0,0,.28)', -24, 3, 50, 5);
  rect(c.c, -24, -8, 48, 10); tri(24, -8, 31, 2, 24, 2, c.c);
  rect(c.c, -16, -14, 26, 6); rect('#1b2533', -12, -13, 18, 5); rect('rgba(255,255,255,.4)', -10, -13, 4, 2);
  if(c.st === 0){ rect('#111', -27, -14, 8, 2); rect('#111', -25, -12, 2, 4); }
  if(c.st === 1) rect('rgba(255,255,255,.75)', -20, -5, 40, 2);
  if(c.st === 2) rect('#111', -24, -4, 48, 2);
  rect('#111', -18, 0, 9, 5); rect('#111', 12, 0, 9, 5); rect('#9e9e9e', -16, 1, 4, 3); rect('#9e9e9e', 14, 1, 4, 3);
  rect('#fff59d', 26, -6, 3, 3); rect('#ff1744', -25, -6, 2, 3);
  ctx.restore();
}
// ================= OCEAN LIFE =================
const REEF = [];
(() => { let s = 7; const r = () => (s = (s*16807) % 2147483647) / 2147483647;
  for(let i=0;i<160;i++) REEF.push({x:80 + r()*5040, y:1460 + r()*300, k:['branch','brain','fan','anem','weed'][Math.floor(r()*5)], c:['#ff6f61','#ffb3c6','#ffd23f','#b06bff','#4dd0e1','#ff8a65'][Math.floor(r()*6)], sz:.7 + r()*.8});
  for(let i=0;i<40;i++) REEF.push({x:200 + r()*4800, y:1140 + r()*260, k: r() < .5 ? 'weed' : 'brain', c:'#4caf50', sz:.6 + r()*.5});
})();
const SCHOOLS = Array.from({length:8}, (_, i) => ({cx:600 + i*620, cy:1200 + (i%3)*160, r:160 + (i%2)*80, sp:(.05 + (i%3)*.02)*(i%2 ? 1 : -1), ph:i, n:14, c:['#ffd23f','#7fdcf0','#ff8a2b','#c0c8d0','#b06bff','#5ce1a6','#ff6f91','#fff176'][i]}));
const JELLY = Array.from({length:16}, (_, i) => ({x:300 + i*320, y:1000 + (i*137)%640, ph:i*1.3, c:['#f8bbd0','#b39ddb','#80deea'][i%3]}));
const SQUID = Array.from({length:10}, (_, i) => ({x:500 + i*480, y:1150 + (i*211)%450, ph:i*2.1}));
const TURTLES = Array.from({length:4}, (_, i) => ({x:800 + i*1200, y:1100 + i*120, sp:12 + i*3, dir: i%2 ? 1 : -1}));
const POD = {x:900, dir:1};
const WHALES = [{x:1200, y:1500, dir:1, sp:14, spoutT:0}, {x:4200, y:1620, dir:-1, sp:11, spoutT:.5}];
const isNight = () => clock < 390 || clock > 1075 || weather === 'nhatthuc';
function updateSea(dtR){
  POD.x += POD.dir*85*dtR; if(POD.x > W - 300) POD.dir = -1; if(POD.x < 300) POD.dir = 1;
  TURTLES.forEach(t => { t.x += t.dir*t.sp*dtR; if(t.x > W - 100) t.dir = -1; if(t.x < 100) t.dir = 1; });
  WHALES.forEach(w => { w.x += w.dir*w.sp*dtR; if(w.x > W - 200) w.dir = -1; if(w.x < 200) w.dir = 1; });
  JELLY.forEach((j,i) => { j.x += Math.sin(realT*.2 + i)*4*dtR; j.y += Math.cos(realT*.15 + i)*3*dtR; });
}
function drawSeaLife(){
  if(VB.y1 < 880) return;
  const night = isNight();
  ctx.save();
  REEF.forEach(r => {
    if(!inVB(r.x, r.y)) return; ctx.globalAlpha = .75; const z = r.sz;
    if(r.k === 'branch'){ ctx.strokeStyle = r.c; ctx.lineWidth = 3*z; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y - 18*z); ctx.moveTo(r.x, r.y - 8*z); ctx.lineTo(r.x - 8*z, r.y - 16*z); ctx.moveTo(r.x, r.y - 12*z); ctx.lineTo(r.x + 9*z, r.y - 22*z); ctx.stroke(); }
    else if(r.k === 'brain'){ circ(r.x, r.y, 9*z, r.c); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(r.x, r.y, 5*z, 0, Math.PI*1.5); ctx.stroke(); }
    else if(r.k === 'fan'){ ctx.fillStyle = r.c; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.arc(r.x, r.y, 16*z, Math.PI*1.15, Math.PI*1.85); ctx.closePath(); ctx.fill(); }
    else if(r.k === 'anem'){ ctx.strokeStyle = r.c; ctx.lineWidth = 2; for(let k=0;k<6;k++){ const a = -Math.PI/2 + (k - 2.5)*.35 + Math.sin(realT*1.5 + r.x)*.15; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + Math.cos(a)*12*z, r.y + Math.sin(a)*12*z); ctx.stroke(); } const fx = r.x + Math.sin(realT + r.x)*10; rect('#ff8a2b', fx, r.y - 15, 6, 3); rect('#fff', fx + 2, r.y - 15, 1, 3); }
    else { ctx.strokeStyle = '#3e8e41'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.quadraticCurveTo(r.x + Math.sin(realT + r.y)*8, r.y - 14*z, r.x + Math.sin(realT*1.3 + r.x)*6, r.y - 28*z); ctx.stroke(); }
  });
  SCHOOLS.forEach(s => {
    const a = realT*s.sp + s.ph, cx = s.cx + Math.cos(a)*s.r, cy = s.cy + Math.sin(a*1.3)*s.r*.35; if(!inVB(cx, cy)) return;
    const dir = (-Math.sin(a)*s.sp) > 0 ? 1 : -1; ctx.globalAlpha = .8;
    for(let k=0;k<s.n;k++){ const fx = cx + Math.sin(k*2.3 + realT*.8)*26 + (k%4)*9*dir, fy = cy + Math.cos(k*1.7 + realT)*14 + (k%3)*6; rect(s.c, fx, fy, 7, 3); rect(s.c, dir > 0 ? fx - 3 : fx + 7, fy - 1, 3, 5); }
  });
  TURTLES.forEach(t => {
    if(!inVB(t.x, t.y)) return; ctx.globalAlpha = .85; const f = Math.sin(realT*3)*3;
    rect('#6d8b3a', t.x - 10, t.y - 7 - f, 5, 4); rect('#6d8b3a', t.x - 10, t.y + 4 + f, 5, 4); rect('#6d8b3a', t.x + 5, t.y - 7 + f, 5, 4); rect('#6d8b3a', t.x + 5, t.y + 4 - f, 5, 4);
    ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.ellipse(t.x, t.y, 11, 8, 0, 0, Math.PI*2); ctx.fill(); rect('#8bc34a', t.x - 4, t.y - 3, 3, 3); rect('#8bc34a', t.x + 2, t.y + 1, 3, 3); rect('#7a9a4a', t.x + t.dir*12 - 3, t.y - 3, 6, 6);
  });
  JELLY.forEach(j => {
    if(!inVB(j.x, j.y)) return; const p = 1 + Math.sin(realT*2 + j.ph)*.15;
    if(night){ const g = ctx.createRadialGradient(j.x, j.y, 2, j.x, j.y, 28); g.addColorStop(0, 'rgba(160,220,255,.55)'); g.addColorStop(1, 'rgba(160,220,255,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(j.x - 28, j.y - 28, 56, 56); }
    ctx.globalAlpha = night ? .95 : .6; ctx.fillStyle = night ? '#b3e5fc' : j.c; ctx.beginPath(); ctx.ellipse(j.x, j.y, 9*p, 7/p, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; for(let k=0;k<4;k++){ ctx.beginPath(); ctx.moveTo(j.x - 6 + k*4, j.y); ctx.quadraticCurveTo(j.x - 6 + k*4 + Math.sin(realT*3 + k)*4, j.y + 9, j.x - 6 + k*4, j.y + 18); ctx.stroke(); }
  });
  WHALES.forEach(w => {
    if(!inVB(w.x, w.y)) return; ctx.globalAlpha = .55; ctx.fillStyle = '#2c3e5a'; ctx.beginPath(); ctx.ellipse(w.x, w.y, 90, 26, 0, 0, Math.PI*2); ctx.fill();
    const tx = w.x - w.dir*92, fl = Math.sin(realT*1.5)*8; tri(tx, w.y, tx - w.dir*30, w.y - 22 + fl, tx - w.dir*30, w.y + 22 + fl, '#2c3e5a'); rect('#3d5373', w.x - 10, w.y + 16, 30, 8);
    ctx.fillStyle = '#c8d6e5'; ctx.beginPath(); ctx.ellipse(w.x + w.dir*30, w.y + 10, 40, 8, 0, 0, Math.PI); ctx.fill();
  });
  for(let i=0;i<5;i++){ const jp = (realT*.35 + i*.45) % 2.6; if(jp < .7) continue; const x = POD.x + (i*34 - 70)*POD.dir, y = 1020 + (i%2)*26 + Math.sin(realT*2 + i)*4; if(!inVB(x, y)) continue; ctx.globalAlpha = .7; ctx.fillStyle = '#7f8fa6'; ctx.beginPath(); ctx.ellipse(x, y, 18, 5, 0, 0, Math.PI*2); ctx.fill(); tri(x - POD.dir*18, y, x - POD.dir*26, y - 6, x - POD.dir*26, y + 6, '#7f8fa6'); }
  if(night){
    SQUID.forEach(q => { const x = q.x + Math.sin(realT*.3 + q.ph)*60, y = q.y + Math.cos(realT*.4 + q.ph)*30; if(!inVB(x, y)) return; const g = ctx.createRadialGradient(x, y, 2, x, y, 30); g.addColorStop(0, 'rgba(120,255,220,.45)'); g.addColorStop(1, 'rgba(120,255,220,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - 30, y - 30, 60, 60); ctx.fillStyle = '#e0f7fa'; ctx.beginPath(); ctx.ellipse(x, y, 5, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#80deea'; ctx.lineWidth = 1; for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(x - 4 + k*2, y + 10); ctx.lineTo(x - 6 + k*3 + Math.sin(realT*4 + k)*3, y + 24); ctx.stroke(); } });
    ctx.globalAlpha = 1; for(let i=0;i<260;i++){ const x = (i*733) % W, y = 890 + (i*191) % 820; if(!inVB(x, y)) continue; const tw = (Math.sin(realT*2 + i) + 1)/2; ctx.fillStyle = `rgba(90,220,255,${.25 + tw*.6})`; ctx.fillRect(x, y, 2, 2); }
    for(let i=0;i<24;i++){ const x = ((i*397 + realT*20*(i%2 ? 1 : -1)) % W + W) % W, y = 1250 + (i*137) % 420; if(!inVB(x, y)) continue; rect('#263238', x, y, 8, 4); circ(x + 9, y, 2, '#fff59d'); }
  }
  ctx.restore();
}
function drawSeaAbove(){
  if(VB.y1 < 880) return;
  [[1400,2300],[2700,3500],[3900,5100]].forEach(([x0, x1]) => {
    if(x1 < VB.x0 || x0 > VB.x1) return;
    for(let k=0;k<4;k++){ const ph = (realT*.12 + k/4) % 1, y = 1085 - ph*190, al = Math.sin(ph*Math.PI)*.85;
      ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = 3 + ph*3; ctx.beginPath(); for(let x = Math.max(x0, VB.x0); x <= Math.min(x1, VB.x1); x += 20) ctx.lineTo(x, y + Math.sin(x*.03 + k)*6); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${al*.35})`; for(let x = Math.max(x0, VB.x0); x <= Math.min(x1, VB.x1); x += 26) ctx.fillRect(x, y + 6 + Math.sin(x*.05 + realT*3)*3, 12, 3); }
  });
  for(let i=0;i<5;i++){ const jp = (realT*.35 + i*.45) % 2.6; if(jp >= .7) continue; const k = jp/.7, base = 1020 + (i%2)*26, x = POD.x + (i*34 - 70)*POD.dir + POD.dir*(k - .5)*60, y = base - Math.sin(k*Math.PI)*46; if(!inVB(x, y)) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(POD.dir*(k - .5)*1.6); ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI*2); ctx.fill(); tri(-POD.dir*20, 0, -POD.dir*28, -7, -POD.dir*28, 7, '#90a4ae'); tri(-2, -5, 4, -5, 0, -12, '#78909c'); rect('#eceff1', -8, 2, 16, 2); ctx.restore();
    if(k < .15 || k > .85) rect('rgba(255,255,255,.8)', x - 10, base - 2, 20, 4); }
  WHALES.forEach(w => { const ph = (realT*.12 + w.spoutT) % 1; if(ph > .25 || !inVB(w.x, w.y)) return; const k = ph/.25, sx = w.x + w.dir*40; ctx.fillStyle = `rgba(230,245,255,${1 - k})`; for(let i=0;i<10;i++){ const a = -Math.PI/2 + (i - 4.5)*.12; ctx.fillRect(sx + Math.cos(a)*k*60, w.y - 20 + Math.sin(a)*k*70, 4, 4); } });
}
// ================= SKY: sun, moon, stars, shape-shifting clouds, sea of clouds =================
const SKY_KEYS = [[0,'#050816','#1a1f4a'],[330,'#050816','#1a1f4a'],[372,'#2b2a6b','#f08a9a'],[420,'#4f8ad9','#ffc27a'],[520,'#2f7fd8','#bfe6ff'],[980,'#2f7fd8','#bfe6ff'],[1050,'#3b4f9e','#ff8a4a'],[1100,'#1c1b4a','#a2507a'],[1150,'#050816','#1a1f4a'],[1440,'#050816','#1a1f4a']];
const hex2 = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const lerpA = (A, B, k) => A.map((v,i) => v + (B[i] - v)*k);
const rgb = A => `rgb(${A.map(v => Math.round(v)).join(',')})`;
let SKYST = null, starCache = null;
const SKY_MET = [];
function skyState(){
  const t = clock % 1440; let i = 0; while(i < SKY_KEYS.length - 2 && t >= SKY_KEYS[i+1][0]) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i+1], k = clamp((t - a[0]) / Math.max(1, b[0] - a[0]), 0, 1);
  let top = lerpA(hex2(a[1]), hex2(b[1]), k), hor = lerpA(hex2(a[2]), hex2(b[2]), k);
  const night = t < 345 || t > 1135 ? 1 : t < 420 ? clamp((420 - t)/75, 0, 1) : t > 1060 ? clamp((t - 1060)/75, 0, 1) : 0;
  const dk = WEATHERS[weather].dark;
  if(weather === 'nhatthuc'){ top = lerpA(top, [8,10,26], .85); hor = lerpA(hor, [70,44,56], .7); }
  else if(dk > 0){ const m = Math.min(.85, dk*1.6); top = lerpA(top, lerpA([118,126,140], [30,34,46], night), m); hor = lerpA(hor, lerpA([170,176,186], [40,44,60], night), m); }
  const clear = ['nang','saobang','cauvong','gio','nangnong','nhatthuc','dongdat'].includes(weather);
  return {t, top, hor, night, dk, starA: (weather === 'nhatthuc' ? .8 : night)*(clear ? 1 : .12), sunset: (t > 380 && t < 470) || (t > 1000 && t < 1110)};
}
function cloudColors(st){
  if(st.dk > .25) return {base:'#8a93a3', shade:'#5a6272', hi:'#a3abb8'};
  if(st.night > .6) return {base:'#3a4570', shade:'#232b4d', hi:'#5b6896'};
  if(st.sunset) return {base:'#ffd6c0', shade:'#c98aa6', hi:'#fff1e6'};
  return {base:'#ffffff', shade:'#c9d6e6', hi:'#ffffff'};
}
const CLOUD_SHAPES = {
  cumulus:[[-50,10,18],[-30,0,24],[-8,-10,28],[18,-6,26],[40,6,20],[58,14,14],[-60,18,12],[-20,16,20],[10,16,22],[34,18,18],[0,-24,18],[-26,-14,16],[26,-20,16],[50,-2,14],[-40,-6,14],[16,4,20]],
  rabbit:[[10,14,26],[-10,18,20],[30,18,18],[0,0,22],[24,0,18],[-30,-6,16],[-34,-16,14],[-40,-36,8],[-44,-52,7],[-30,-38,8],[-28,-56,7],[44,12,10],[-14,30,10],[24,32,10],[-46,-4,8],[-22,-20,10]],
  whale:[[-50,0,16],[-34,-4,22],[-12,-6,26],[12,-4,26],[34,0,20],[52,6,12],[64,-4,8],[70,-14,8],[70,8,6],[-12,12,18],[12,12,18],[-36,10,14],[-56,-30,4],[-56,-40,5],[-50,-46,4],[-62,-44,4]],
  dragon:[[-70,0,12],[-58,-12,12],[-44,-16,13],[-30,-10,14],[-16,2,14],[0,8,14],[16,4,14],[30,-8,14],[44,-16,13],[58,-12,12],[70,-2,14],[80,-12,10],[84,4,8],[-80,6,8],[-6,-6,8],[36,6,8]],
  heart:[[-24,-12,20],[24,-12,20],[-36,-2,14],[36,-2,14],[-12,4,20],[12,4,20],[0,-4,16],[-22,12,14],[22,12,14],[-10,22,12],[10,22,12],[0,32,10],[0,16,16],[-30,-24,10],[30,-24,10],[0,40,6]],
  cat:[[0,10,24],[-20,12,18],[20,14,18],[-36,-10,16],[-44,-30,8],[-28,-30,8],[-38,-18,12],[36,4,10],[48,-6,8],[56,-18,7],[60,-30,6],[-10,28,10],[14,28,10],[-24,0,14],[8,-4,16],[-48,-8,8]],
  bird:[[0,0,14],[-14,-4,12],[-28,-12,11],[-42,-20,10],[-56,-26,8],[-68,-30,6],[14,-4,12],[28,-12,11],[42,-20,10],[56,-26,8],[68,-30,6],[0,12,10],[-6,22,7],[6,22,7],[10,-10,8],[-10,-10,8]],
  boat:[[-48,20,10],[-30,24,12],[-10,26,12],[10,26,12],[30,24,12],[48,20,10],[0,14,8],[0,-4,8],[0,-22,8],[0,-40,7],[10,-30,12],[18,-14,14],[24,2,12],[-12,-10,6],[60,12,6],[-60,12,6]],
  mushroom:[[-40,-6,14],[-24,-16,18],[0,-22,20],[24,-16,18],[40,-6,14],[-12,-8,18],[12,-8,18],[0,-34,12],[-30,-26,8],[30,-26,8],[0,8,10],[0,22,10],[0,34,10],[-8,30,8],[8,30,8],[0,44,8]]
};
const CLOUD_NAMES = {cumulus:'mây bông', rabbit:'con thỏ', whale:'cá voi', dragon:'con rồng', heart:'trái tim', cat:'con mèo', bird:'chim bay', boat:'thuyền buồm', mushroom:'cây nấm'};
const SHAPE_KEYS = Object.keys(CLOUD_SHAPES);
const mkCloud = (x, y, s, v, i) => { const k = SHAPE_KEYS[i % SHAPE_KEYS.length]; return {x, y, s, v, from:k, to:k, t:1, hold:4 + (i*7) % 16}; };
const SKYCLOUDS = Array.from({length:13}, (_, i) => mkCloud(150 + i*410, -1330 + (i*137) % 300, 1.3 + (i%4)*.3, 6 + (i%3)*3, i));
const MAPCLOUDS = Array.from({length:14}, (_, i) => mkCloud((i*397) % W, -200 + (i*233) % 1900, 1.8 + (i%3)*.5, 10 + (i%4)*3, i + 3));
const TWINKLE = (() => { let s = 5; const r = () => (s = (s*16807) % 2147483647) / 2147483647; return Array.from({length:420}, () => [r()*W, 10 + r()*(NY - SY0 - 260), r()*6.28, 1 + r()*3]); })();
const CONST = [['Chòm sao Bắc Đẩu', [[600,-1300],[660,-1282],[712,-1268],[764,-1272],[806,-1242],[796,-1200],[858,-1206]]], ['Chòm sao Thợ Săn', [[3000,-1320],[3080,-1300],[3020,-1250],[3040,-1246],[3060,-1242],[2990,-1190],[3090,-1180]]], ['Chòm sao Thiên Hậu', [[4300,-1280],[4340,-1240],[4380,-1270],[4420,-1232],[4460,-1266]]]];
function buildStars(){
  const hgt = NY - SY0, c = document.createElement('canvas'); c.width = W; c.height = hgt; const g = c.getContext('2d');
  let s = 99; const r = () => (s = (s*16807) % 2147483647) / 2147483647;
  for(let i=0;i<14000;i++){ g.fillStyle = `rgba(${200 + r()*55|0},${210 + r()*45|0},255,${.15 + r()*.6})`; g.fillRect(r()*W, r()*hgt, 1, 1); }
  for(let i=0;i<16000;i++){ const t = r(); g.fillStyle = `rgba(220,215,255,${.03 + r()*.08})`; g.fillRect(t*W, hgt*.12 + t*hgt*.45 + (r() + r() + r() - 1.5)*70, 2, 2); }
  for(let i=0;i<500;i++){ g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(r()*W, r()*hgt, 2, 2); }
  starCache = c;
}
function stepCloud(c, dtR, wind){
  c.x += c.v*(1 + wind*1.5)*dtR; if(c.x > W + 220) c.x = -220;
  if(c.t < 1){ c.t = Math.min(1, c.t + dtR/6); if(c.t >= 1){ c.from = c.to; c.hold = 14 + Math.random()*10; } }
  else { c.hold -= dtR; if(c.hold <= 0){ let n; do { n = pick(SHAPE_KEYS); } while(n === c.from); c.to = n; c.t = 0; } }
}
function updateSky(dtR){
  const w = WEATHERS[weather].wind; SKYCLOUDS.forEach(c => stepCloud(c, dtR, w)); MAPCLOUDS.forEach(c => stepCloud(c, dtR, w));
  if(SKYST && SKYST.starA > .3 && Math.random() < dtR*(weather === 'saobang' ? 3 : .35)) SKY_MET.push({x:rnd(0, W), y:rnd(SY0 + 30, SY0 + 420), vx:rnd(500, 900)*(Math.random() < .5 ? 1 : -1), vy:rnd(200, 350), life:rnd(.6, 1.1)});
  for(let i = SKY_MET.length - 1; i >= 0; i--){ const m = SKY_MET[i]; m.x += m.vx*dtR; m.y += m.vy*dtR; m.life -= dtR; if(m.life <= 0) SKY_MET.splice(i, 1); }
}
function cloudPuffs(c){ const A = CLOUD_SHAPES[c.from], B = CLOUD_SHAPES[c.to], e = c.t*c.t*(3 - 2*c.t); return A.map((p, i) => { const q = B[i]; return [c.x + (p[0] + (q[0] - p[0])*e)*c.s + Math.sin(realT*.5 + i)*2, c.y + (p[1] + (q[1] - p[1])*e)*c.s + Math.cos(realT*.4 + i)*2, (p[2] + (q[2] - p[2])*e)*c.s]; }); }
function puffPath(P, ox, oy, k){ ctx.beginPath(); P.forEach(p => { const r = p[2]*k; ctx.moveTo(p[0] + ox + r, p[1] + oy); ctx.arc(p[0] + ox, p[1] + oy, r, 0, Math.PI*2); }); }
function cloudVisible(c, pad){ return !(c.x < VB.x0 - 120*c.s - pad || c.x > VB.x1 + 120*c.s + pad || c.y < VB.y0 - 80*c.s - pad || c.y > VB.y1 + 80*c.s + pad); }
function drawCloud(c, col, alpha){
  const P = cloudPuffs(c); ctx.globalAlpha = alpha;
  ctx.fillStyle = col.shade; puffPath(P, 0, 0, 1); ctx.fill();
  ctx.fillStyle = col.base; puffPath(P, 0, -3*c.s, .92); ctx.fill();
  ctx.fillStyle = col.hi; P.forEach(p => { ctx.beginPath(); ctx.arc(p[0] - p[2]*.25, p[1] - p[2]*.35 - 3*c.s, p[2]*.42, 0, Math.PI*2); ctx.fill(); });
  ctx.globalAlpha = 1;
}
function drawMapClouds(){
  if(!$('#mapClouds').checked || !SKYST) return;
  const cov = {nang:.35, nangnong:.15, cauvong:.45, gio:.6, mua:.9, muaphun:.85, bao:1, sieubao:1, loc:.8, samset:1, muada:.9, suongmu:.7, tuyet:.9, baotuyet:1, songthan:.7, dongdat:.4, nhatthuc:.3, saobang:.15}[weather];
  const n = Math.round((cov == null ? .4 : cov)*MAPCLOUDS.length), col = cloudColors(SKYST);
  for(let i=0;i<n;i++){ const c = MAPCLOUDS[i]; if(c.y < NY + 40 || !cloudVisible(c, 140)) continue; const P = cloudPuffs(c);
    ctx.fillStyle = 'rgba(10,20,30,.08)'; puffPath(P, 70, 110, 1); ctx.fill();
    ctx.globalAlpha = .34; ctx.fillStyle = col.base; puffPath(P, 0, 0, 1); ctx.fill(); ctx.globalAlpha = 1; }
}
function drawSky(){
  const st = SKYST || skyState(), x0 = Math.max(0, VB.x0), x1 = Math.min(W, VB.x1);
  if(x1 <= x0) return;
  const g = ctx.createLinearGradient(0, SY0, 0, NY); g.addColorStop(0, rgb(st.top)); g.addColorStop(1, rgb(st.hor)); ctx.fillStyle = g; ctx.fillRect(x0, SY0, x1 - x0, NY - SY0);
  if(st.starA > .02){
    if(!starCache) buildStars();
    ctx.globalAlpha = st.starA; ctx.drawImage(starCache, x0, 0, x1 - x0, starCache.height, x0, SY0, x1 - x0, starCache.height);
    TWINKLE.forEach(s => { if(s[0] < x0 || s[0] > x1) return; const a = (Math.sin(realT*s[3] + s[2]) + 1)/2; ctx.globalAlpha = st.starA*(.25 + a*.75); rect('#fff', s[0] - 2, SY0 + s[1], 5, 1); rect('#fff', s[0], SY0 + s[1] - 2, 1, 5); });
    ctx.globalAlpha = st.starA*.5; ctx.strokeStyle = '#9fc4ff'; ctx.lineWidth = 1; ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#c8dcff';
    CONST.forEach(([nm, pts]) => { if(pts[0][0] > x1 || pts[pts.length-1][0] < x0) return; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); pts.forEach(p => rect('#fff', p[0] - 2, p[1] - 2, 4, 4)); ctx.fillText(nm, pts[0][0], pts[0][1] - 14); });
    ctx.globalAlpha = 1;
  }
  const t = st.t;
  if(t > 330 && t < 1110){
    const k = (t - 360)/720, sx = 200 + clamp(k, -.05, 1.05)*(W - 400), sy = NY - 330 - Math.sin(clamp(k, 0, 1)*Math.PI)*470, a = 1 - st.dk*.85;
    const gl = ctx.createRadialGradient(sx, sy, 10, sx, sy, 240); gl.addColorStop(0, st.sunset ? `rgba(255,170,90,${.75*a})` : `rgba(255,250,210,${.6*a})`); gl.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = gl; ctx.fillRect(sx - 240, sy - 240, 480, 480);
    ctx.globalAlpha = Math.max(.15, a); circ(sx, sy, 38, st.sunset ? '#ffb347' : '#fff6c4'); ctx.globalAlpha = 1;
    if(weather === 'nhatthuc'){ circ(sx + 3, sy, 37, '#05070f'); ctx.strokeStyle = 'rgba(255,240,200,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 41, 0, Math.PI*2); ctx.stroke(); }
  }
  if(st.night > .05 && weather !== 'nhatthuc'){
    const tm = t >= 1080 ? t - 1080 : t + 360, k = tm/720, mx = 200 + clamp(k, 0, 1)*(W - 400), my = NY - 330 - Math.sin(clamp(k, 0, 1)*Math.PI)*450, a = st.night*(1 - st.dk*.8);
    const gl = ctx.createRadialGradient(mx, my, 6, mx, my, 170); gl.addColorStop(0, `rgba(200,220,255,${.35*a})`); gl.addColorStop(1, 'rgba(200,220,255,0)'); ctx.fillStyle = gl; ctx.fillRect(mx - 170, my - 170, 340, 340);
    ctx.globalAlpha = a; circ(mx, my, 30, '#f4f1de'); circ(mx - 9, my - 6, 6, '#dcd6bd'); circ(mx + 8, my + 9, 4, '#dcd6bd'); circ(mx + 10, my - 10, 3, '#dcd6bd');
    const off = [null, 46, 32, 16, 0, -16, -32, -46][day % 8]; if(off !== null){ ctx.fillStyle = rgb(st.top); ctx.beginPath(); ctx.arc(mx + off, my, 31, 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  SKY_MET.forEach(m => { if(m.x < x0 - 200 || m.x > x1 + 200) return; const tx = m.x - m.vx*.16, ty = m.y - m.vy*.16, gm = ctx.createLinearGradient(m.x, m.y, tx, ty); gm.addColorStop(0, `rgba(255,255,240,${Math.min(1, m.life*1.4)})`); gm.addColorStop(1, 'rgba(255,255,240,0)'); ctx.strokeStyle = gm; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke(); rect('#fff', m.x - 1.5, m.y - 1.5, 3, 3); });
  const col = cloudColors(st); SKYCLOUDS.forEach(c => { if(cloudVisible(c, 0)) drawCloud(c, col, .96); });
  drawCloudSea(st, x0, x1);
}
function drawCloudSea(st, x0, x1){
  const base = NY, mcol = [lerpA(st.hor, [20,30,50], .5), lerpA(st.hor, [20,30,50], .66), lerpA(st.hor, [15,25,40], .8)];
  const seaA = clamp(.5 + (st.t > 330 && st.t < 600 ? .35 : 0) + (weather === 'suongmu' ? .3 : 0), 0, 1);
  const cc = st.night > .6 ? [70,84,128] : st.sunset ? [255,214,196] : st.dk > .25 ? [160,166,178] : [246,248,252];
  [[-220, 200, .0021, 0], [-150, 150, .0034, 1.7], [-80, 100, .0052, 3.1]].forEach(([off, amp, f, ph], li) => {
    ctx.fillStyle = rgb(mcol[li]); ctx.beginPath(); ctx.moveTo(x0, base);
    for(let x = x0; x <= x1 + 20; x += 20) ctx.lineTo(x, base + off - Math.abs(Math.sin(x*f + ph))*amp - Math.sin(x*f*3.7 + ph)*amp*.18);
    ctx.lineTo(x1 + 20, base); ctx.closePath(); ctx.fill();
    const cy = base + off*.5 + 34, drift = realT*(8 + li*6), crest = x => cy - 16 - Math.abs(Math.sin((x + drift)*.012 + li))*24 - Math.sin((x - drift*.7)*.004 + li*2)*18;
    ctx.fillStyle = `rgba(${cc.join(',')},${seaA*(.55 + li*.15)})`; ctx.beginPath(); ctx.moveTo(x0, base);
    for(let x = x0; x <= x1 + 16; x += 16) ctx.lineTo(x, crest(x)); ctx.lineTo(x1 + 16, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(${cc.join(',')},${seaA*.45})`; for(let x = Math.floor(x0/70)*70; x < x1 + 70; x += 70){ const xx = x + (drift % 70); ctx.beginPath(); ctx.arc(xx, crest(xx) + 6, 16 + (x/70 % 3)*6, 0, Math.PI*2); ctx.fill(); }
  });
}
// ================= NORTH PARK =================
let northCache = null, northSeason = null;
const BALLOONS = Array.from({length:5}, (_, i) => ({x:i*1100 + 200, y:-480 + (i%3)*120, v:8 + i*2, c:[['#ef4b4b','#ffd23f'],['#3d7bff','#f4f4f4'],['#2fbf71','#ff8a2b'],['#b06bff','#ffd23f'],['#ff6f91','#26c6da']][i]}));
function buildNorth(){
  const c = document.createElement('canvas'); c.width = W; c.height = -NY;
  const prev = ctx; ctx = c.getContext('2d'); ctx.translate(0, -NY);
  const se = S(), dong = season === 'dong';
  rect(se.grass, 0, NY, W, -NY); ctx.fillStyle = se.grass2; for(let y=NY; y<0; y+=20) for(let x=((y - NY)/20)%2*20; x<2636; x+=40) ctx.fillRect(x, y, 20, 20);
  rect('#b9b2a3', 40, -64, 1540, 40); for(let x=40; x<1580; x+=32) rect('#aaa294', x, -64 + ((x/32)%2)*20, 16, 20);
  rect('#b9b2a3', 1130, -64, 40, 64);
  const g = GBOARD, bw = g.s*8;
  rect('#8d8070', g.x - 26, g.y - 26, bw + 52, bw + 52); rect('#6d6050', g.x - 10, g.y - 10, bw + 20, bw + 20);
  for(let i=0;i<8;i++) for(let j=0;j<8;j++) rect((i + j)%2 ? '#7a5230' : '#f0dcb4', g.x + i*g.s, g.y + j*g.s, g.s, g.s);
  ctx.font = '16px VT323, monospace'; ctx.fillStyle = '#fff'; for(let i=0;i<8;i++){ ctx.fillText('abcdefgh'[i], g.x + i*g.s + 20, g.y + bw + 22); ctx.fillText(String(8 - i), g.x - 22, g.y + i*g.s + 28); }
  plate('QUẢNG TRƯỜNG CỜ VUA KHỔNG LỒ · BẤM ĐỂ CHƠI', g.x + bw/2, g.y - 52);
  for(let i=0;i<4;i++){ rect('#7a4b2a', g.x + bw + 40, g.y + 40 + i*90, 14, 50); }
  rect('#9e9e9e', RMON.x - 80, RMON.y + 64, 160, 40); rect('#bdbdbd', RMON.x - 92, RMON.y + 100, 184, 14);
  for(let i=0;i<10;i++){ rect('#2e7d32', RMON.x - 160 + (i%5)*70, RMON.y - 200 + Math.floor(i/5)*380, 50, 16); }
  plate('TƯỢNG ĐÀI RUBIK · BẤM ĐỂ XOAY', RMON.x, RMON.y + 124);
  ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.ellipse(POND.cx, POND.cy, POND.rx + 8, POND.ry + 8, 0, 0, Math.PI*2); ctx.fill();
  const pg = ctx.createRadialGradient(POND.cx, POND.cy, 10, POND.cx, POND.cy, POND.rx); pg.addColorStop(0, dong ? '#d6ecf3' : '#3aa0b8'); pg.addColorStop(1, dong ? '#b5d8e6' : '#277a92');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(POND.cx, POND.cy, POND.rx, POND.ry, 0, 0, Math.PI*2); ctx.fill();
  rect('#8d6e4a', POND.cx - 14, POND.cy + POND.ry - 40, 28, 80); for(let y = POND.cy + POND.ry - 40; y < POND.cy + POND.ry + 40; y += 8) rect('#6d5236', POND.cx - 14, y, 28, 2);
  if(!dong) for(let i=0;i<14;i++){ const a = i*2.5, rr = .4 + (i%5)*.1; circ(POND.cx + Math.cos(a)*POND.rx*rr, POND.cy + Math.sin(a)*POND.ry*rr, 7, '#4caf50'); }
  plate('HỒ CÂU THƯ GIÃN · BẤM ĐỂ CÂU CÁ', POND.cx, POND.cy - POND.ry - 34);
  const fields = [['#a77bd8','Oải hương'],['#ffd23f','Hướng dương'],['#ff6f91','Tulip'],['#f4f4f4','Cúc trắng'],['#ff8a2b','Cúc vạn thọ'],['#e53950','Hoa hồng'],['#7c9cff','Cẩm tú cầu']];
  fields.forEach(([col, nm], k) => { const y = -540 + k*74; rect(dong ? '#e3ebee' : '#6b8f3a', 1600, y, 1020, 58); if(!dong || k === 3) for(let x=1606; x<2614; x+=10) for(let yy=y+6; yy<y+54; yy+=12) rect(col, x + ((yy/12)%2)*4, yy, 4, 4); ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#1a1206'; ctx.fillText(nm, 1606, y + 70); });
  plate('CÁNH ĐỒNG HOA', 2110, -556 + 2);
  const hc = dong ? ['#cfdadf','#bccad1','#aebcc3'] : season === 'thu' ? ['#7e8a3e','#6d7a36','#5c682e'] : ['#4f8a3c','#427a32','#366a2a'];
  [[2700,-30,520],[3300,-30,620],[4200,-30,560],[4900,-30,480]].forEach(([cx, cy, r], k) => { ctx.fillStyle = hc[k%3]; ctx.beginPath(); ctx.ellipse(cx, cy, r, 380, 0, Math.PI, 0); ctx.fill(); });
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for(let k=0;k<6;k++){ ctx.beginPath(); ctx.ellipse(3300, -30, 560 - k*80, 340 - k*52, 0, Math.PI, 0); ctx.stroke(); }
  for(let i=0;i<160;i++){ const x = 2650 + (i*317) % 2540, y = -540 + (i*211) % 500; if(Math.abs(x - 3920) < 90 || zoneBlock(x, y)) continue; tri(x - 9, y + 10, x + 9, y + 10, x, y - 16, dong ? '#5c7a6a' : '#235c34'); rect('#5a3a1e', x - 1, y + 10, 3, 5); if(dong) rect('rgba(255,255,255,.7)', x - 4, y - 10, 8, 3); }
  rect('#6d6f78', 3850, -540, 140, 250); rect('#8a8d96', 3860, -540, 120, 20);
  ctx.fillStyle = dong ? '#d6ecf3' : '#3aa0b8'; ctx.beginPath(); ctx.ellipse(3920, -250, 90, 36, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = dong ? '#d6ecf3' : '#3aa0b8'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(3920, -220); ctx.quadraticCurveTo(3880, -120, 3930, 36); ctx.stroke();
  plate('THÁC NƯỚC', 3920, -556 + 2); plate('ĐỒI THÔNG', 3000, -556 + 2);
  drawZonesStatic(); drawNorthEastStatic();
  ctx = prev; northCache = c; northSeason = season;
}
const GLYPH = {k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟'};
function drawNorthDyn(){
  const g = GBOARD;
  if(chessGame && VB.x0 < g.x + g.s*8 + 40 && VB.y0 < g.y + g.s*8){
    const bd = chessGame.board(); ctx.font = `${g.s*.86}px 'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for(let r=0;r<8;r++) for(let f=0;f<8;f++){ const p = bd[r][f]; if(!p) continue; const x = g.x + f*g.s, y = g.y + r*g.s, im = PIMG[pKey(p)]; if(im && im.complete && im.naturalWidth){ ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + g.s/2 + 3, y + g.s - 6, g.s*.34, g.s*.1, 0, 0, Math.PI*2); ctx.fill(); ctx.drawImage(im, x + 1, y - 4, g.s - 2, g.s - 2); } else { ctx.fillStyle = p.color === 'w' ? '#fbfbf7' : '#161616'; ctx.fillText(GLYPH[p.type] + '︎', x + g.s/2, y + g.s/2 + 2); } }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  if(VB.x0 < RMON.x + 120 && VB.x1 > RMON.x - 120){
    const cols = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#f4f4f4','#ff8a2b'], s = 26, x0 = RMON.x - 40, y0 = RMON.y - 70, t = Math.floor(realT*.5);
    for(let i=0;i<9;i++) rect(cols[(i + t) % 6], x0 + (i%3)*s, y0 + Math.floor(i/3)*s + 40, s - 2, s - 2);
    for(let i=0;i<9;i++){ const cx = x0 + (i%3)*s + 20 - Math.floor(i/3)*0, cy = y0 + 40 - (Math.floor(i/3) + 1)*13; ctx.fillStyle = cols[(i + t + 2) % 6]; ctx.beginPath(); ctx.moveTo(cx - 20 + Math.floor(i/3)*13, cy + 13); ctx.lineTo(cx + 6 + Math.floor(i/3)*13, cy + 13); ctx.lineTo(cx + 19 + Math.floor(i/3)*13, cy); ctx.lineTo(cx - 7 + Math.floor(i/3)*13, cy); ctx.closePath(); ctx.fill(); }
    for(let i=0;i<9;i++){ const col = i%3, row = Math.floor(i/3), x = x0 + 3*s + col*13, y = y0 + 40 + row*s - col*13; ctx.fillStyle = cols[(i + t + 4) % 6]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y - 12); ctx.lineTo(x + 12, y + s - 14); ctx.lineTo(x, y + s - 2); ctx.closePath(); ctx.fill(); }
  }
  if(VB.x1 > 3800 && VB.x0 < 4050){ ctx.fillStyle = 'rgba(220,240,255,.85)'; for(let i=0;i<14;i++){ const x = 3864 + i*8, y = -520 + ((realT*160 + i*37) % 240); ctx.fillRect(x, y, 3, 18); } ctx.fillStyle = 'rgba(255,255,255,.7)'; for(let i=0;i<6;i++) circ(3880 + i*16, -262 + Math.sin(realT*5 + i)*3, 6, 'rgba(255,255,255,.7)'); }
  BALLOONS.forEach(b => { if(!paused && !FEED) b.x += b.v*.016; if(b.x > W + 60) b.x = -60; const y = b.y + Math.sin(realT*.4 + b.x*.01)*12; if(b.x < VB.x0 - 60 || b.x > VB.x1 + 60) return; ctx.fillStyle = b.c[0]; ctx.beginPath(); ctx.ellipse(b.x, y, 22, 26, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = b.c[1]; ctx.fillRect(b.x - 4, y - 26, 8, 52); rect('#8d6e4a', b.x - 7, y + 34, 14, 10); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x - 14, y + 18); ctx.lineTo(b.x - 6, y + 34); ctx.moveTo(b.x + 14, y + 18); ctx.lineTo(b.x + 6, y + 34); ctx.stroke(); });
}
function drawScene(dt){
  try { drawSkyBand(dt); } catch(e){}
  drawGround(); try { v20Soft(); } catch(e){} drawForestDyn(); drawSea(); drawBuildings(); try { v20Rooms(); } catch(e){} drawCameras();
  const sprites = [];
  TREES.forEach((t,i) => { if(inVB(t[0], t[1])) sprites.push({y:t[1], f:() => drawTree(t,i)}); });
  FOREST_TREES.forEach((t,i) => { if(inVB(t[0], t[1])) sprites.push({y:t[1], f:() => t[2] === 'pine' ? drawPine(t[0], t[1], i) : drawTree(t, i)}); });
  agents.forEach(a => { if(a.visible && !a.inSub && inVB(a.x, a.y)) sprites.push({y:a.y, f:() => drawPerson(a)}); });
  npcs.forEach(n => { if(npcShown(n) && inVB(n.x, n.y)) sprites.push({y:n.y, f:() => drawNpc(n)}); });
  cars.forEach(c => { if(inVB(c.x, 708)) sprites.push({y: c.lane ? 724 : 704, f:() => drawCar(c)}); });
  sprites.push({y:LIGHTHOUSE[1], f:drawLighthouse});
  if(season === 'dong') sprites.push({y:452, f:drawXmasTree});
  sprites.push({y:truck.y + 6, f:drawTruck});
  sprites.push({y:ball.y, f:drawBall});
  extSprites(sprites);
  sprites.sort((p,q) => p.y - q.y).forEach(s => s.f());
  drawTornado(dt);
  drawParticles(dt);
  drawMapClouds();
  try { drawV16Sky(dt); } catch(e){}
  drawLighting();
  drawBolts();
}
function render(dt){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle = '#0a0f22'; ctx.fillRect(0,0,cw,ch);
  const sh = (shake > 0 && !RM.matches) ? shake*7 : 0, ox = rnd(-sh, sh), oy = rnd(-sh, sh);
  ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z + ox)), Math.round(DPR*(ch/2 - cam.y*cam.z + oy)));
  ctx.imageSmoothingEnabled = false;
  VB = {x0: cam.x - cw/cam.z/2 - 140, x1: cam.x + cw/cam.z/2 + 140, y0: cam.y - ch/cam.z/2 - 160, y1: cam.y + ch/cam.z/2 + 180};
  drawScene(dt);
  drawLabels();
}

// ================= CCTV =================
const FEEDS = [
  {n:1, name:'Lớp Rubik',      rid:'rubik',  cx:220,  cy:182, vw:340, mount:[372,64]},
  {n:2, name:'Khu điểm danh',  rid:'attend', cx:950,  cy:552, vw:420, mount:[1134,474]},
  {n:3, name:'Hội trường lớn', rid:'hall',   cx:1375, cy:300, vw:400, mount:[1554,64]},
  {n:4, name:'Khu âm nhạc',    rid:'music',  cx:930,  cy:182, vw:380, mount:[1104,64]},
  {n:5, name:'Bãi biển',       rid:'beach',  cx:820,  cy:880, vw:760, mount:[1588,792]},
  {n:6, name:'Máy quay Hà Quân', dynamic:true, cx:900, cy:500, vw:320},
  {n:7, name:'Hồ cá Koi', rid:'lake', cx:3930, cy:330, vw:760, mount:[4330,104]}
];
let FEED = false, feedI = 0, camsOpen = true, activeFeed = null;
function drawCameras(){
  const led = RM.matches || (realT % 1) < .5;
  FEEDS.forEach(f => {
    if(f.dynamic) return;
    const [mx, my] = f.mount, ang = Math.atan2(f.cy - my, f.cx - mx);
    if(!FEED){
      ctx.fillStyle = f === activeFeed ? 'rgba(255,210,63,.10)' : 'rgba(255,90,90,.05)';
      const L = f.rid === 'beach' ? 420 : 300, sp = .38;
      ctx.beginPath(); ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(ang-sp)*L, my + Math.sin(ang-sp)*L); ctx.lineTo(mx + Math.cos(ang+sp)*L, my + Math.sin(ang+sp)*L);
      ctx.closePath(); ctx.fill();
    }
    if(f.rid === 'beach') rect('#555', mx-2, my-6, 4, 60);
    rect('#3a3f4f', mx-3, my-8, 6, 10);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    rect('#dfe3ec', -2, -5, 18, 10); rect('#9aa1b3', -2, 3, 18, 2); rect('#111', 14, -3, 4, 6);
    ctx.restore();
    rect(led ? '#ff3b3b' : '#5a1a1a', mx-2, my-12, 4, 4);
  });
}
function initFeeds(){
  const grid = document.getElementById('camgrid');
  FEEDS.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'feed';
    b.setAttribute('aria-label', `Camera ${f.n}: ${f.name}. Bấm để xem trên bản đồ lớn`);
    b.innerHTML = `<canvas></canvas><span class="ftop"><span><i class="rec" aria-hidden="true"></i>CAM ${f.n}</span><span class="ft"></span></span><span class="fname"><span class="fn">${f.name}</span><span class="fc"></span></span>`;
    b.onclick = () => {
      activeFeed = activeFeed === f ? null : f;
      FEEDS.forEach(g => g.btn.setAttribute('aria-current', g === activeFeed));
      if(activeFeed){
        if(f.dynamic){ select(A.haquan, false); followCam = true; cam.z = Math.max(cam.z, .9); }
        else { followCam = false; cam.x = f.cx; cam.y = f.cy; cam.z = Math.min(cw / (f.vw*1.5), ch / (f.vw/1.6*1.5)); }
        clampCam(); log('info', `Đang xem Camera ${f.n}: ${f.name}.`);
      }
      updatePanel();
    };
    f.btn = b; f.cv = b.querySelector('canvas'); f.c2 = f.cv.getContext('2d');
    grid.appendChild(b);
  });
  const sizeFeeds = () => FEEDS.forEach(f => {
    const r = f.cv.getBoundingClientRect(); if(!r.width) return;
    f.dpr = Math.min(2, window.devicePixelRatio || 1); f.w = r.width; f.h = r.height;
    f.cv.width = Math.round(r.width*f.dpr); f.cv.height = Math.round(r.height*f.dpr); f.z = f.w / f.vw;
    renderFeed(f);
  });
  new ResizeObserver(sizeFeeds).observe(grid);
  const tg = document.getElementById('camToggle');
  const setOpen = o => { camsOpen = o; grid.hidden = !o; tg.setAttribute('aria-expanded', o); document.getElementById('camArrow').textContent = o ? '▾' : '▸'; if(o) sizeFeeds(); };
  tg.onclick = () => setOpen(!camsOpen);
  if(stage.getBoundingClientRect().width < 700) setOpen(false);
}
function renderFeed(f){
  if(!f.w) return;
  if(f.dynamic){
    const q = A.haquan;
    if(!q.visible){
      f.c2.setTransform(f.dpr,0,0,f.dpr,0,0); f.c2.fillStyle = '#111'; f.c2.fillRect(0,0,f.w,f.h);
      f.c2.fillStyle = '#9ea9d6'; f.c2.font = '15px VT323, monospace'; f.c2.textAlign = 'center'; f.c2.fillText('Hà Quân chưa đến', f.w/2, f.h/2); f.c2.textAlign = 'left';
      return;
    }
    f.cx = q.x + q.dir*60; f.cy = q.y - 20;
  }
  FEED = true; ctx = f.c2;
  ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, f.w, f.h);
  ctx.setTransform(f.dpr*f.z, 0, 0, f.dpr*f.z, f.dpr*(f.w/2 - f.cx*f.z), f.dpr*(f.h/2 - f.cy*f.z));
  ctx.imageSmoothingEnabled = false;
  VB = {x0: f.cx - f.vw/2 - 140, x1: f.cx + f.vw/2 + 140, y0: f.cy - f.vw/3 - 160, y1: f.cy + f.vw/3 + 180};
  drawScene(0);
  ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
  const night = lightLevel() > .3;
  ctx.fillStyle = night ? 'rgba(60,255,140,.16)' : f.dynamic ? 'rgba(255,170,90,.06)' : 'rgba(120,160,255,.06)'; ctx.fillRect(0, 0, f.w, f.h);
  ctx = mainCtx; FEED = false;
}
function renderFeeds(){ if(camsOpen) renderFeed(FEEDS[feedI++ % FEEDS.length]); }
const miniCv = document.getElementById('miniCv'), miniCtx = miniCv.getContext('2d');
let miniTick = 0;
function renderMini(){
  if(++miniTick % 3) return; if(rmRender()) return;
  const r = miniCv.getBoundingClientRect(); if(!r.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(miniCv.width !== Math.round(r.width*dpr)){ miniCv.width = Math.round(r.width*dpr); miniCv.height = Math.round(r.height*dpr); }
  const k = r.width / W, g = miniCtx;
  g.setTransform(dpr*k, 0, 0, dpr*k, 0, -Y0*dpr*k);
  g.fillStyle = S().sea; g.fillRect(0, 0, W, H);
  if(groundCache) g.drawImage(groundCache, 0, 0);
  if(northCache) g.drawImage(northCache, 0, NY);
  if(SKYST){ g.fillStyle = rgb(SKYST.top); g.fillRect(0, Y0, W, (NY - Y0)*.6); g.fillStyle = rgb(SKYST.hor); g.fillRect(0, Y0 + (NY - Y0)*.6, W, (NY - Y0)*.4); }
  g.fillStyle = S().sand; g.fillRect(0, 790, W, 80);
  agents.forEach(a => { if(!a.visible) return; g.fillStyle = a === selected ? '#ffd23f' : a.student ? a.bag : '#ffffff'; g.fillRect(a.x - 14, a.y - 14, 28, 28); });
  miniExtra(g, k);
  g.fillStyle = '#ffd23f'; g.fillRect(sub.x - 20, sub.y - 10, 40, 20);
  g.strokeStyle = '#ffd23f'; g.lineWidth = 2 / k; g.strokeRect(cam.x - cw/cam.z/2, cam.y - ch/cam.z/2, cw/cam.z, ch/cam.z);
}

