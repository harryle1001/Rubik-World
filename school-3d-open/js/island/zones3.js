// Games Plaza (open world): six colourful kiosks around a fountain. Each one opens a group of the 2D game's mini games
// and tools (chess, football, piano, shop, quests, AI Coach…), so every 2D feature lives in the 3D open world too.
import * as THREE from 'three';
import { PAL, heightAt, box, cyl, cone, sphere, torus, meshOf, addCircle, PLACES } from './util.js';
import { sign, LAMPS, MOVERS } from './zones.js';
export const PLAZA = {x:110, z:110, r:20};
export const KIOSKS = [
  ['brain', 'Brain Games', 'Trò chơi trí tuệ', '🧠', '#6E8BFF'], ['sports', 'Sports', 'Thể thao', '⚽', '#3FD4A0'], ['play', 'Fun & Play', 'Vui chơi', '🎡', '#FF8A7A'],
  ['art', 'Music & Art', 'Nhạc & vẽ', '🎹', '#E8C27A'], ['life', 'Life & Shops', 'Cuộc sống', '🛍️', '#5FD3E6'], ['tools', 'School Office', 'Văn phòng trường', '🏫', '#B8C0D8']
];
export function buildPlaza(scene){
  const G = [], {x:cx, z:cz, r} = PLAZA, y0 = heightAt(cx, cz);
  G.push(cyl(r + 6, r + 6, .25, '#e8dcc4', cx, y0 - .1, cz, 28), cyl(r - 4, r - 4, .3, '#d7c7a6', cx, y0 - .08, cz, 24));
  // fountain
  G.push(cyl(5, 5.4, .9, '#cfd8dc', cx, y0, cz, 20), cyl(4.4, 4.4, .95, '#4fc3f7', cx, y0 + .02, cz, 20), cyl(.6, .8, 2.6, '#eceff1', cx, y0, cz, 10), cyl(2, 1.6, .4, '#eceff1', cx, y0 + 2.6, cz, 14));
  addCircle(cx, cz, 5.4);
  const jet = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 10, 1, true), new THREE.MeshBasicMaterial({color:'#b3e5fc', transparent:true, opacity:.65}));
  jet.position.set(cx, y0 + 4, cz); scene.add(jet); MOVERS.push({update(t){ jet.scale.y = 1 + Math.sin(t*4)*.18; jet.rotation.y = t; }});
  KIOSKS.forEach(([k, en, vi, icon, col], i) => {
    const a = i/KIOSKS.length*Math.PI*2, x = cx + Math.cos(a)*r, z = cz + Math.sin(a)*r, y = heightAt(x, z), ry = -a - Math.PI/2;
    // striped awning stall: counter, posts, roof cone, a big floating icon ball in the group colour
    G.push(box(5, 1.2, 3, '#fff8e7', x, y, z, ry), box(5.2, .2, 3.2, col, x, y + 1.2, z, ry));
    for(const [dx, dz] of [[-2.3, -1.3], [2.3, -1.3], [-2.3, 1.3], [2.3, 1.3]]){ const c = Math.cos(ry), s = Math.sin(ry); G.push(cyl(.12, .12, 3.2, '#8d6e63', x + dx*c + dz*s, y, z - dx*s + dz*c)); }
    G.push(cone(4.2, 1.8, col, x, y + 3.2, z, 4, ry + Math.PI/4), cone(4.25, .5, '#ffffff', x, y + 3.15, z, 4, ry + Math.PI/4), sphere(.7, col, x, y + 5.6, z, 1));
    addCircle(x, z, 2.6); LAMPS.push([x, y + 5.6, z]);
    sign(scene, en, vi, x + Math.cos(a)*5, z + Math.sin(a)*5, ry + Math.PI, {icon, game:'2d:' + k, note:'Mini game và tiện ích của trường'});
  });
  sign(scene, 'Games Plaza', 'Quảng trường Trò chơi', cx, cz - r - 9, 0);
  for(let i=0;i<8;i++){ const a = (i + .5)/8*Math.PI*2, x = cx + Math.cos(a)*(r + 5), z = cz + Math.sin(a)*(r + 5), y = heightAt(x, z); G.push(cyl(.12, .16, 4.2, '#37474f', x, y, z), box(.7, .2, .7, '#263238', x, y + 4.2, z)); LAMPS.push([x, y + 4, z]); }
  // bunting between kiosks
  for(let i=0;i<24;i++){ const a = i/24*Math.PI*2, x = cx + Math.cos(a)*(r - 1), z = cz + Math.sin(a)*(r - 1); G.push(cone(.35, .6, [PAL.red, PAL.yellow, PAL.blue, PAL.green][i % 4], x, heightAt(x, z) + 4.4, z, 3)); }
  scene.add(meshOf(G));
}
