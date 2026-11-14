// main.js — KHỞI ĐỘNG GAME: tạo renderer/camera, nối các phần lại, vòng lặp khung hình, nút bấm trên màn hình,
// hiệu ứng âm thanh ngắn (sfx) và tự giảm chất lượng khi máy chậm để giữ ~60fps.
// Ít khi cần sửa: muốn đổi thông số hãy mở config.js; muốn đổi từng phần hãy mở đúng file của phần đó.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { U } from './utils.js';
import { createWorld } from './world.js';
import { createBuildings, createAreaScreen } from './buildings.js';
import { createNature } from './nature.js';
import { createProps } from './props.js';
import { createPlayer } from './player.js';
import { createInventory } from './inventory.js';
import { createBuildingSystem } from './building-system.js';
import { createPortals } from './portals.js';

const $ = id => document.getElementById(id);
const ld = $('ldText');
const tick = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

async function boot() {
  const Q = CONFIG.quality;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  let pr = Math.min(devicePixelRatio, Q.pixelRatio); renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  $('game').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, innerWidth / innerHeight, 0.2, Q.farView);

  const ctx = { scene, camera, renderer, colliders: [], isTouch: matchMedia('(pointer: coarse)').matches, buildMode: false };
  ctx.toast = toast; ctx.sfx = sfx;

  ld.textContent = 'Đang tạo đồi núi và dòng sông…'; await tick();
  const world = createWorld(ctx);
  ld.textContent = 'Đang dựng các công trình…'; await tick();
  const buildings = createBuildings(ctx, world);
  const inventory = ctx.inventory = createInventory(ctx);
  ld.textContent = 'Đang trồng cây và hoa…'; await tick();
  const nature = createNature(ctx, world);
  const props = createProps(ctx, world);
  const player = ctx.player = createPlayer(ctx, world);
  const blocks = ctx.blocks = createBuildingSystem(ctx, world);
  const screen = createAreaScreen(ctx);
  const portals = createPortals(ctx, world, screen);
  ctx.world = world; ctx.nature = nature; ctx.props = props; window.__game = ctx; // để gỡ lỗi trong console

  // ---------- Nút bấm ----------
  const bChop = $('bChop'), bBike = $('bBike'), bRun = $('bRun');
  let nearTree = null, nearBike = null;
  const doChop = () => { if (!nearTree || player.frozen) return; player.chopAnim = 0.5; nature.chop(nearTree, player.pos); nearTree = null; bChop.hidden = true; };
  const doBike = () => { if (player.frozen) return; if (player.riding) { player.dismount(); toast('Đã xuống xe'); } else if (nearBike) { player.mount(nearBike); toast('🚲 Đạp xe: đi nhanh gấp ' + CONFIG.player.bikeMul + ' lần!'); } };
  bChop.onclick = doChop; bBike.onclick = doBike;
  const runOn = v => e => { e.preventDefault(); player.input.runBtn = v; bRun.classList.toggle('on', v); };
  bRun.addEventListener('pointerdown', runOn(true)); bRun.addEventListener('pointerup', runOn(false)); bRun.addEventListener('pointerleave', runOn(false)); bRun.addEventListener('pointercancel', runOn(false));
  $('bInv').onclick = () => { blocks.on && blocks.toggle(false); inventory.toggle(); };
  $('bBuild').onclick = () => { inventory.close(); blocks.toggle(); };
  const bSound = $('bSound'); const setSnd = () => { bSound.textContent = world.audio.on ? '🔊' : '🔇'; }; setSnd();
  bSound.onclick = () => { world.audio.toggle(); setSnd(); };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'KeyF') doChop(); else if (e.code === 'KeyB') doBike();
    else if (e.code === 'KeyI') { blocks.on && blocks.toggle(false); inventory.toggle(); }
    else if (e.code === 'KeyX') { inventory.close(); blocks.toggle(); }
    else if (e.code === 'Escape') { inventory.close(); blocks.on && blocks.toggle(false); }
  });
  // âm thanh chỉ được bật sau lần chạm đầu tiên (quy định của trình duyệt)
  const unlock = () => { world.audio.start(); world.audio.ac && world.audio.ac.resume(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

  // ---------- Vòng lặp ----------
  const clock = new THREE.Clock(); let t = 0, uiT = 0, fpsT = 0, frames = 0;
  const hTime = $('hTime');
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05); t += dt; U.uTime.value = t;
    world.update(dt, t);
    player.update(dt, t);
    nature.update(dt, t);
    props.update(dt, t);
    buildings.update(dt, t);
    blocks.update(t);
    portals.update(dt, t);
    renderer.render(scene, camera);

    if ((uiT += dt) > 0.15) {
      uiT = 0;
      nearTree = player.frozen || player.riding || blocks.on ? null : nature.nearestTree(player.pos);
      bChop.hidden = !nearTree;
      nearBike = player.riding ? null : props.nearestBike(player.pos);
      bBike.hidden = !(player.riding || nearBike) || player.frozen;
      bBike.innerHTML = player.riding ? '🚶<small>Xuống xe</small>' : '🚲<small>Lên xe</small>';
      const h = world.state.hour; hTime.textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')} ${world.state.night > 0.5 ? '🌙' : '☀️'}`;
    }
    // tự điều chỉnh chất lượng theo FPS
    frames++; fpsT += dt;
    if (fpsT > 2.5) {
      const fps = frames / fpsT; frames = 0; fpsT = 0;
      if (fps < 42 && pr > 0.75) { pr = Math.max(0.75, pr - 0.15); renderer.setPixelRatio(pr); }
      else if (fps > 58 && pr < Math.min(devicePixelRatio, Q.pixelRatio)) { pr = Math.min(Q.pixelRatio, pr + 0.1); renderer.setPixelRatio(pr); }
      if (fps < 26 && renderer.shadowMap.enabled && pr <= 0.8) { renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }
    }
    requestAnimationFrame(frame);
  }
  renderer.compile(scene, camera);
  $('loading').classList.add('done'); setTimeout(() => $('loading').remove(), 700);
  requestAnimationFrame(frame);
  setTimeout(() => toast(ctx.isTouch ? 'Kéo bên trái để đi · vuốt bên phải để xoay camera' : 'WASD để đi · Shift chạy · kéo chuột xoay camera · F chặt cây · B xe đạp · X xây', false, 5000), 900);
  setTimeout(() => toast('✨ Bước vào vòng sáng trước mỗi công trình để vào khu học tập', false, 5000), 6500);
}

// ---------- Thông báo nhỏ ----------
function toast(text, small = false, ms = 2200) {
  const box = $('toasts'), el = document.createElement('div'); el.className = 'toast' + (small ? ' small' : ''); el.textContent = text;
  box.appendChild(el); while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
}

// ---------- Hiệu ứng âm thanh ngắn tạo bằng WebAudio ----------
let sfxAc = null;
function sfx(kind) {
  try {
    if (localStorage.getItem(CONFIG.save.sound) === '0') return;
    sfxAc = sfxAc || new (window.AudioContext || window.webkitAudioContext)();
    const ac = sfxAc, t = ac.currentTime, out = ac.createGain(); out.gain.value = 0.25; out.connect(ac.destination);
    const tone = (f, s, d, type = 'sine', v = 0.6, f2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + s); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + s + d); g.gain.setValueAtTime(0, t + s); g.gain.linearRampToValueAtTime(v, t + s + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + s + d); o.connect(g).connect(out); o.start(t + s); o.stop(t + s + d + 0.05); };
    const noise = (s, d, f, v = 0.8) => { const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), c = b.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / c.length) ** 2; const src = ac.createBufferSource(); src.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; const g = ac.createGain(); g.gain.value = v; src.connect(fl).connect(g).connect(out); src.start(t + s); };
    ({
      chop: () => { noise(0, 0.12, 900); noise(0.18, 0.12, 800); noise(0.36, 0.12, 850); },
      thud: () => { tone(110, 0, 0.35, 'sine', 0.9, 50); noise(0, 0.3, 300, 1); },
      good: () => { tone(660, 0, 0.15); tone(990, 0.1, 0.25); },
      bad: () => tone(220, 0, 0.3, 'triangle', 0.5, 160),
      win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.3)),
      craft: () => { noise(0, 0.08, 1500); tone(880, 0.05, 0.15, 'triangle'); },
      place: () => { noise(0, 0.06, 600, 1); tone(300, 0, 0.08, 'triangle', 0.5); },
      pop: () => tone(500, 0, 0.12, 'sine', 0.6, 900),
      bell: () => { tone(1568, 0, 0.5, 'sine', 0.4); tone(1568, 0.18, 0.6, 'sine', 0.4); },
      chime: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.09, 0.6, 'sine', 0.35)),
      whoosh: () => noise(0, 0.5, 500, 0.6),
    })[kind]?.();
  } catch (e) {}
}

boot().catch(err => { console.error(err); ld.textContent = 'Không khởi động được game: ' + err.message; });
