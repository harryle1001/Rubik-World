// Rubik School 3D — boot, renderer, light & time of day, weather, night lamps, quality, the frame loop and the menu.
import * as THREE from 'three';
import { IS_PHONE, heightAt, store, PLACES } from './util.js';
import { buildTerrain, buildSea, buildSky, buildTrees, buildGrass, sky_t } from './terrain.js';
import { buildSchool, buildBrain, buildSports, LAMPS, MOVERS } from './zones.js';
import { buildPlayground, buildFarm } from './zones2.js';
import { buildPeople, updateNPC, drawPeople, PEOPLE } from './people.js';
import { buildAnimals, updateAnimals, buildTraffic, updateTraffic, MOUNTS, BIKES, CARRIAGE } from './creatures.js';
import { P, initPlayer, updatePlayer, mountUp, dismount, toggleFly, nearCarriage, boardCarriage, jump, setOnPlace, setGroundTap, setFloor } from './player.js';
import { buildPhysics, stepPhysics, BUILD, BUILD_COLORS, buildInit, buildPlace, buildUndo, inBuild, buildTop, springUnder } from './physics.js';
import { initUI, hud, toast, MG, PROF, level, saveProf, CLOCK, setMenu, openMenu, closeMenu, perfTick, PERF, placeCard, nearestPlace, SFX } from './ui.js';
import './minigames/farm.js';

const $ = s => (window.ISL || document).querySelector(s);
// ---------- renderer ----------
const Q = {level:store.get('quality', 'auto'), cur:IS_PHONE ? 1 : 2, low:0};
const renderer = new THREE.WebGLRenderer({canvas:$('#c3d'), antialias:!IS_PHONE, powerPreference:'high-performance'});
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .3, 3000); scene.fog = new THREE.Fog('#cfe9ff', 260, IS_PHONE ? 620 : 900);
function applyQuality(){ const q = Q.level === 'auto' ? Q.cur : {low:0, med:1, high:2}[Q.level]; const pr = Math.min(devicePixelRatio, [1, IS_PHONE ? 1.25 : 1.5, IS_PHONE ? 1.5 : 2][q]); renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false); sun.castShadow = q > 0; sun.shadow.mapSize.set(q > 1 ? 2048 : 1024, q > 1 ? 2048 : 1024); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); }
// ---------- light ----------
const hemi = new THREE.HemisphereLight('#dff2ff', '#7a8f5a', 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.2); sun.shadow.camera.left = sun.shadow.camera.bottom = -45; sun.shadow.camera.right = sun.shadow.camera.top = 45; sun.shadow.camera.far = 400; sun.shadow.bias = -.0006; scene.add(sun, sun.target);
const nightLights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ffcf7a', 0, 22, 1.6); scene.add(l); return l; });
// ---------- world ----------
const terrain = buildTerrain(scene); const {sea, foam} = buildSea(scene); const skyDome = buildSky(scene); buildTrees(scene); const grass = buildGrass(scene);
buildSchool(scene); buildBrain(scene); buildSports(scene); buildPlayground(scene); buildFarm(scene);
const people = buildPeople(scene, 31); buildAnimals(scene); buildTraffic(scene, people); buildPhysics(scene); buildInit(scene);
const me = people[0]; initPlayer(scene, camera, me, terrain); camera.position.set(0, 12, 60);
// night halos for every lamp (one Points draw)
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,170,1)'); gr.addColorStop(.3, 'rgba(255,190,90,.55)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const halo = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(LAMPS.flatMap(l => [l[0], l[1], l[2]]), 3)), new THREE.PointsMaterial({map:haloTex, size:5, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0})); halo.frustumCulled = false; scene.add(halo);
// rain (fixed pool)
const RN = IS_PHONE ? 1200 : 2500, rainPos = new Float32Array(RN*3); for(let i=0;i<RN;i++){ rainPos[i*3] = (Math.random() - .5)*80; rainPos[i*3 + 1] = Math.random()*40; rainPos[i*3 + 2] = (Math.random() - .5)*80; }
const rain = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3)), new THREE.PointsMaterial({color:'#cfe8ff', size:.18, transparent:true, opacity:.7})); rain.frustumCulled = false; rain.visible = false; scene.add(rain);
const WEATHER = {k:'sun', next:0}, WN = {sun:['Sunny', 'Nắng'], cloud:['Cloudy', 'Nhiều mây'], rain:['Rain', 'Mưa']};
// ---------- time of day ----------
const C1 = new THREE.Color(), C2 = new THREE.Color(), dayTop = new THREE.Color('#4c9dff'), dayHor = new THREE.Color('#d3ecff'), duskTop = new THREE.Color('#3b4a8c'), duskHor = new THREE.Color('#ffb47a'), nightTop = new THREE.Color('#050a1f'), nightHor = new THREE.Color('#1b2850');
let night = 0;
function lighting(){ const h = (CLOCK.min/60) % 24, a = (h - 6)/12*Math.PI, el = Math.sin(a), sunUp = Math.max(0, el); night = Math.min(1, Math.max(0, (.15 - el)/.3)); const dusk = Math.max(0, 1 - Math.abs(el)/.35)*(1 - night*.5);
  const dx = Math.cos(a), sx = P.x + dx*120, sy = Math.max(20, el*160), sz = P.z + 60; sun.position.set(sx, sy, sz); sun.target.position.set(P.x, 0, P.z); sun.intensity = 2.4*sunUp*(WEATHER.k === 'sun' ? 1 : .55); sun.color.setHSL(.09, .6, .55 + .4*sunUp);
  hemi.intensity = .35 + .9*(1 - night)*(WEATHER.k === 'rain' ? .8 : 1); C1.copy(dayTop).lerp(duskTop, dusk).lerp(nightTop, night); C2.copy(dayHor).lerp(duskHor, dusk).lerp(nightHor, night); if(WEATHER.k !== 'sun'){ C1.lerp(new THREE.Color('#8a96a8'), .45*(1 - night)); C2.lerp(new THREE.Color('#b8c2cc'), .45*(1 - night)); }
  skyDome.material.uniforms.uTop.value.copy(C1); skyDome.material.uniforms.uHor.value.copy(C2); skyDome.material.uniforms.uSun.value.set(dx, el, .4); skyDome.material.uniforms.uNight.value = night; scene.fog.color.copy(C2); sea.material.uniforms.uSky.value.copy(C2); sea.material.uniforms.uSun.value.set(dx, Math.max(.05, el), .4);
  halo.material.opacity = night; renderer.toneMappingExposure = 1; }
// the 4 lamps nearest to the player become real lights at night
let lampT = 0; function nearLamps(){ if(night < .2){ nightLights.forEach(l => l.intensity = 0); return; } const s = LAMPS.map(l => [l, (l[0] - P.x)**2 + (l[2] - P.z)**2]).sort((a, b) => a[1] - b[1]).slice(0, 4); s.forEach(([l], i) => { nightLights[i].position.set(l[0], l[1] - .3, l[2]); nightLights[i].intensity = 18*night; }); }
// ---------- menu ----------
const AC = {brain:'#6E8BFF', sports:'#3FD4A0', play:'#FF8A7A', world:'#5FD3E6', system:'#B8C0D8'};
setMenu(sub => {
  if(sub === 'mounts') return {title:'Mounts · Thú cưỡi', list:Object.entries(MOUNTS).map(([k, M]) => ({ic:{horse:'🐎', pony:'🐴', ostrich:'🦤', deer:'🦌', phoenix:'🔥', dragon:'🐉', pegasus:'🦄', turtle:'🐢'}[k], en:M.en, vi:M.vi + (M.fly ? ' · bay' : ''), ac:M.fly ? AC.play : AC.world, lock:level() < M.lvl ? M.lvl : 0, on:P.mount === k, f:() => { mountUp(k); toast(`${M.vi}${M.fly ? ': bấm "Bay" để cất cánh' : ''}`); syncButtons(); }})).concat([{ic:'⬇️', en:'Get off', vi:'Xuống', ac:AC.system, f:() => { dismount(); syncButtons(); }}])};
  if(sub === 'games') return {title:'Farm Games · Trò chơi nông trại', list:MG.list().map(G => ({ic:G.icon, en:G.name, vi:G.vi, ac:AC.world, f:() => { const p = PLACES.find(q => q.game === G.id); if(p) toast(`Mini game ở ${p.vi}. Bạn cũng có thể chơi ngay.`); MG.start(G.id); }}))};
  if(sub === 'time') return {title:'Time · Thời gian', list:[['🌅', 'Morning', 'Sáng 7:00', 420], ['☀️', 'Noon', 'Trưa 12:00', 720], ['🌇', 'Afternoon', 'Chiều 16:30', 990], ['🌙', 'Evening', 'Tối 20:00', 1200]].map(([ic, en, vi, m]) => ({ic, en, vi, ac:AC.system, f:() => { CLOCK.min = m; lighting(); hud(); }})).concat([{ic:'⏩', en:'+30 min', vi:'Tua 30 phút', ac:AC.system, stay:true, f:() => { CLOCK.min += 30; }}, {ic:'⏩', en:'+60 min', vi:'Tua 60 phút', ac:AC.system, stay:true, f:() => { CLOCK.min += 60; }}, {ic:'☔', en:'Weather', vi:WN[WEATHER.k][1], ac:AC.world, stay:true, f:() => setWeather({sun:'cloud', cloud:'rain', rain:'sun'}[WEATHER.k])}])};
  if(sub === 'settings') return {title:'Settings · Cài đặt', list:[['auto', 'Auto', 'Tự động'], ['low', 'Low', 'Thấp'], ['med', 'Medium', 'Vừa'], ['high', 'High', 'Cao']].map(([k, en, vi]) => ({ic:'🎚️', en:'Quality ' + en, vi:'Chất lượng ' + vi, ac:AC.system, on:Q.level === k, stay:true, f:() => { Q.level = k; store.set('quality', k); applyQuality(); }})).concat([{ic:'📊', en:'Performance', vi:PERF.on ? 'Đang hiện' : 'Đang ẩn', ac:AC.system, stay:true, f:() => { PERF.on = !PERF.on; store.set('perf', PERF.on); }}, {ic:store.get('mute', false) ? '🔇' : '🔊', en:'Sound', vi:store.get('mute', false) ? 'Đang tắt' : 'Đang bật', ac:AC.system, stay:true, f:() => store.set('mute', !store.get('mute', false))}])};
  return [{ic:'🐎', en:'Mounts', vi:'Thú cưỡi', ac:AC.world, sub:'mounts'}, {ic:'🌾', en:'Farm Games', vi:'Trò chơi nông trại', ac:AC.world, sub:'games'}, {ic:'🕒', en:'Time', vi:'Thời gian', ac:AC.system, sub:'time'},
    {ic:'🧱', en:'Build Zone', vi:'Khu sáng tạo', ac:AC.play, f:() => goPlace('build')}, {ic:'⚽', en:'Stadium', vi:'Sân vận động', ac:AC.sports, f:() => goPlace('kick')}, {ic:'🚃', en:'Carriage', vi:'Xe ngựa quanh đảo', ac:AC.world, f:() => toast('Xe ngựa chạy vòng quanh đảo, dừng 8 giây ở 4 trạm. Đứng gần trạm và bấm "Lên xe".')},
    {ic:'🏫', en:'School', vi:'Về trường', ac:AC.brain, f:() => { P.target = [0, 30]; }}, {ic:'⚙️', en:'Settings', vi:'Cài đặt', ac:AC.system, sub:'settings'}, {ic:'⛵', en:'Back to School', vi:'Về trường (bản đồ chính)', ac:AC.world, f:() => window.RS && window.RS.leaveIsland()}];
});
function goPlace(game){ const p = PLACES.find(q => q.game === game); if(p){ P.target = [p.x, p.z + 3]; P.onArrive = () => usePlace(p); toast(`Đang đi tới ${p.vi}…`); } }
function usePlace(p){ if(p.game === 'turtle'){ mountUp('turtle'); syncButtons(); toast('Cưỡi rùa biển: dùng joystick để bơi.'); return; } if(p.game === 'kick'){ toast('Chạy vào quả bóng để sút! Bóng và thùng gỗ có vật lý thật.'); return; } if(p.game === 'build'){ BUILD.on = !BUILD.on; syncButtons(); toast(BUILD.on ? 'Chế độ Sáng tạo: chạm sàn trong khu để đặt khối.' : 'Đã tắt chế độ Sáng tạo.'); return; } MG.start(p.game); }
setOnPlace(usePlace);
setGroundTap(pt => { if(!BUILD.on || !inBuild(pt.x, pt.z)) return false; buildPlace(pt.x, pt.z, P.camYaw); SFX.tap(); return true; });
setFloor((x, z, y) => { const t = buildTop(x, z); if(t > -1e8 && y > t - .6){ if(springUnder(x, z, t) && P.vy <= 0 && y - t < .05){ P.vy = 13; SFX.ok(); } return t; } return -1e9; });
// ---------- contextual buttons ----------
function syncButtons(){ const M = P.mount ? MOUNTS[P.mount] : null; $('#bFly').hidden = !(M && M.fly); $('#bFly').classList.toggle('on', P.fly); $('#bUp').hidden = $('#bDown').hidden = !P.fly; $('#bMount').classList.toggle('on', !!P.mount); $('#buildBar').hidden = !BUILD.on; }
function bindButtons(){
  $('#bMount').onclick = () => openMenu('mounts'); $('#bFly').onclick = () => { const f = toggleFly(); toast(f ? 'Cất cánh! Giữ ▲ ▼ để lên xuống.' : 'Hạ cánh.'); syncButtons(); }; $('#bJump').onclick = () => jump();
  const hold = (el, v) => { el.onpointerdown = () => { P.up = v; }; el.onpointerup = el.onpointerleave = el.onpointercancel = () => { P.up = 0; }; }; hold($('#bUp'), 1); hold($('#bDown'), -1);
  $('#bCar').onclick = () => { if(P.ride){ boardCarriage(false); toast('Đã xuống xe ngựa.'); } else if(nearCarriage()){ boardCarriage(true); toast('Lên xe ngựa! Ngồi ngắm cảnh quanh đảo.'); } };
  const kinds = $('#bKinds'); ['cube', 'plank', 'ramp', 'spring', 'lamp'].forEach(k => { const b = document.createElement('button'); b.textContent = {cube:'🧊', plank:'🪵', ramp:'📐', spring:'🌀', lamp:'💡'}[k]; b.title = k; b.onclick = () => { BUILD.kind = k; [...kinds.children].forEach(x => x.classList.toggle('on', x === b)); }; kinds.appendChild(b); }); kinds.firstChild.classList.add('on');
  const cols = $('#bCols'); BUILD_COLORS.forEach((c, i) => { const b = document.createElement('button'); b.style.background = c; b.onclick = () => { BUILD.color = i; [...cols.children].forEach(x => x.classList.toggle('on', x === b)); }; cols.appendChild(b); }); cols.firstChild.classList.add('on');
  $('#bUndo').onclick = () => buildUndo(); $('#bDone').onclick = () => { BUILD.on = false; syncButtons(); }; $('#bShot').onclick = () => { renderer.render(scene, camera); const a = document.createElement('a'); a.href = renderer.domElement.toDataURL('image/png'); a.download = 'rubik-build.png'; a.click(); };
}
function setWeather(k){ WEATHER.k = k; rain.visible = k === 'rain'; toast(`Thời tiết: ${WN[k][1]} (${WN[k][0]})`); }
// ---------- loop ----------
initUI(); bindButtons(); applyQuality(); addEventListener('resize', applyQuality); lighting(); syncButtons();
const savedMount = store.get('mount', null); if(savedMount && MOUNTS[savedMount] && !MOUNTS[savedMount].sea && level() >= MOUNTS[savedMount].lvl) mountUp(savedMount);
let last = performance.now(), t = 0, slow = 0, hudT = 0;
function frame(now){
  requestAnimationFrame(frame); const dt = Math.min(.05, (now - last)/1000); last = now; if(document.hidden || MG.cur || !window.ISL_ON) return; t += dt;
  CLOCK.min += dt*CLOCK.speed/60*60/60; if(CLOCK.min >= 1440){ CLOCK.min -= 1440; CLOCK.day++; } if(t > WEATHER.next){ WEATHER.next = t + 360; if(Math.random() < .4) setWeather(['sun', 'sun', 'cloud', 'rain'][Math.floor(Math.random()*4)]); }
  const hour = (CLOCK.min/60) % 24; updatePlayer(dt, t);
  for(const p of people) if(p.npc && !p.ride) { const d = Math.abs(p.x - P.x) + Math.abs(p.z - P.z); if(d < 220 || (Math.floor(t*4) !== Math.floor((t - dt)*4))) updateNPC(p, d < 220 ? dt : .25, hour); p.lantern = night > .4; }
  me.lantern = night > .4; updateAnimals(dt, P.x, P.z); updateTraffic(dt, t); stepPhysics(dt, P.x, P.z, P.vx, P.vz); for(const m of MOVERS) m.update(t, dt);
  for(const b of BIKES){ if(now - b.lastBell > 9000 && Math.hypot(b.m.position.x - P.x, b.m.position.z - P.z) < 10){ b.lastBell = now; SFX.bell(); } }
  drawPeople(camera.position, t, night > .4); grass.update(P.x, P.z);
  sky_t.uT.value = t; sea.material.uniforms.uT.value = t; foam.material.uniforms.uT.value = t; skyDome.position.copy(camera.position);
  if(rain.visible){ const a = rain.geometry.attributes.position.array; for(let i=0;i<RN;i++){ a[i*3 + 1] -= dt*30; if(a[i*3 + 1] < 0){ a[i*3 + 1] = 40; a[i*3] = (Math.random() - .5)*80; a[i*3 + 2] = (Math.random() - .5)*80; } } rain.geometry.attributes.position.needsUpdate = true; rain.position.set(P.x, Math.max(0, P.y - 5), P.z); }
  lampT -= dt; if(lampT <= 0){ lampT = .5; lighting(); nearLamps(); }
  hudT -= dt; if(hudT <= 0){ hudT = .25; hud(); placeCard(nearestPlace(P.x, P.z), usePlace); $('#bCar').hidden = !(P.ride || nearCarriage()); $('#bCar').textContent = P.ride ? '🚃 Xuống xe' : '🚃 Lên xe'; if(BUILD.on && !inBuild(P.x, P.z) && Math.hypot(P.x - BUILD.cx, P.z - BUILD.cz) > 40){ BUILD.on = false; syncButtons(); } }
  renderer.render(scene, camera); perfTick(renderer, dt);
  if(Q.level === 'auto'){ if(PERF.fps < 40 && t > 5){ slow += dt; if(slow > 3 && Q.cur > 0){ Q.cur--; slow = 0; applyQuality(); } } else slow = 0; }
}
requestAnimationFrame(frame);
window.__dbg3 = {P, CLOCK, renderer, scene, camera, MG, PEOPLE, mountUp, toggleFly, lighting, BUILD, buildPlace, setWeather, CARRIAGE, boardCarriage, PERF};
const bt = $('#boot'); if(bt) bt.remove(); window.dispatchEvent(new Event('isl-ready'));
