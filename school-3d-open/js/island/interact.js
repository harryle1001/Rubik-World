// Touch / left-click actions in the open world: tap an animal to feed it, tap a garden plot to plant / harvest,
// little hearts and leaves float up as feedback. Rewards follow the game rules (small, capped per day).
import * as THREE from 'three';
import { TAP_HOOKS, P, walkTo } from './player.js';
import { ANIMALS } from './creatures.js';
import { GARDEN, gardenTap, gardenStage } from './zones5.js';
import { toast, SFX, hud } from './ui.js';
import { store } from './util.js';
const V = new THREE.Vector3();
const FOOD = {cow:['bò', 'cỏ non', '🌿'], sheep:['cừu', 'cỏ', '🌿'], goat:['dê', 'lá cây', '🍃'], pig:['heo', 'cám', '🥣'], chicken:['gà', 'thóc', '🌾']};
// ---------- floating icons (one small sprite pool) ----------
const POOL = [], TEX = {};
function tex(ch){ if(TEX[ch]) return TEX[ch]; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.font = '48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 36); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return TEX[ch] = t; }
let scene = null;
export function floatIcons(x, y, z, ch, n = 4){ if(!scene) return; for(let k=0;k<n;k++){ let s = POOL.find(q => !q.visible); if(!s){ if(POOL.length > 40) return; s = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, depthWrite:false})); s.scale.set(.8, .8, .8); scene.add(s); POOL.push(s); }
  s.material.map = tex(ch); s.material.needsUpdate = true; s.material.opacity = 1; s.position.set(x + (Math.random() - .5)*1.2, y + Math.random()*.5, z + (Math.random() - .5)*1.2); s.visible = true; s.userData.t = 1.4 + k*.15; } }
export function updateIcons(dt){ for(const s of POOL){ if(!s.visible) continue; s.userData.t -= dt; s.position.y += dt*1.3; s.material.opacity = Math.min(1, s.userData.t); if(s.userData.t <= 0) s.visible = false; } }
// ---------- daily caps ----------
const today = () => new Date().toISOString().slice(0, 10);
function earn(kind, exp, money, why, cap){ const st = store.get('daily-' + kind, {d:'', n:0}); if(st.d !== today()){ st.d = today(); st.n = 0; } st.n++; store.set('daily-' + kind, st);
  const m = st.n <= cap ? money : 0; try { if(window.RS && window.RS.prof) window.RS.reward(exp, m, why, true); } catch(e){} hud(); return m; }
// ---------- picking things on screen ----------
function pick(list, cx, cy, camera, px = 46, far = 60){ let best = -1, bd = px; list.forEach(([x, y, z], i) => { if(Math.hypot(x - P.x, z - P.z) > far) return; V.set(x, y, z).project(camera); if(V.z > 1) return; const sx = (V.x + 1)/2*innerWidth, sy = (1 - V.y)/2*innerHeight, d = Math.hypot(sx - cx, sy - cy); if(d < bd){ bd = d; best = i; } }); return best; }
function feed(a){ const [vi, food, ic] = FOOD[a.k] || ['bạn thú', 'đồ ăn', '🍀']; a.tame = performance.now() + 15000; a.t = null; a.wait = 6;
  floatIcons(a.x, (a.y || 1) + 1.6, a.z, '❤️', 4); floatIcons(a.x, (a.y || 1) + 1, a.z, ic, 2); SFX.ok();
  const m = earn('feed', 2, 1, 'Cho thú ăn', 10); toast(`Bạn cho ${vi} ăn ${food} ${ic}  +2 EXP${m ? ' · +$1' : ''}`); }
function garden(i){ const [x, y, z] = GARDEN.plots[i], r = gardenTap(i);
  if(r === 'plant'){ floatIcons(x, y + 1, z, '🌱', 3); SFX.tap(); const m = earn('plant', 3, 0, 'Trồng cây', 0); toast('Đã trồng một cây con 🌱 · khoảng 2 phút nữa cây ra quả. +3 EXP'); }
  else if(r === 'harvest'){ floatIcons(x, y + 2, z, '🍎', 5); SFX.coin(); const m = earn('harvest', 5, 2, 'Thu hoạch vườn', 8); toast(`Thu hoạch trái cây 🍎  +5 EXP${m ? ' · +$' + m : ''}`); }
  else { const st = gardenStage(i); floatIcons(x, y + 1.5, z, '💧', 3); SFX.tap(); toast(st === 0 ? 'Tưới nước cho cây con 💧 · cây đang lớn…' : 'Cây đang lớn, sắp ra quả rồi! 🌳'); } }
export function initInteract(sc){ scene = sc;
  // animals: tap → walk up → feed
  TAP_HOOKS.push((cx, cy, camera) => { const L = ANIMALS.map(a => [a.x, (a.y || 1) + .8, a.z]), i = pick(L, cx, cy, camera, 44, 50); if(i < 0) return false; const a = ANIMALS[i]; a.tame = performance.now() + 15000; a.t = null; a.wait = 8;
    if(Math.hypot(a.x - P.x, a.z - P.z) < 3.2) feed(a); else walkTo(a.x + 1.6, a.z + 1.6, () => feed(a)); return true; });
  // garden plots: tap → walk up → plant / water / harvest
  TAP_HOOKS.push((cx, cy, camera) => { const i = pick(GARDEN.plots, cx, cy, camera, 40, 70); if(i < 0) return false; const [x, , z] = GARDEN.plots[i];
    if(Math.hypot(x - P.x, z - P.z) < 3.5) garden(i); else walkTo(x, z - 2.4, () => garden(i)); return true; });
}
