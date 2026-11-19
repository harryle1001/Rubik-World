// economy/pickups.js — ✨ NHẶT ĐỒ: vật phẩm lấp lánh rải khắp đảo (vỏ sò ở bãi biển, pha lê/hồng ngọc trên núi, lá thuốc, nấm,
// lông chim, sách cũ, chìa khoá cổ…) và đôi khi một nhúm 🪙 đồng vàng. Đi qua (≤ 1,3 m) hoặc bấm ✋ để nhặt vào 🎒 cặp.
// Mỗi món kèm 1 điều học được (mô tả trong catalog.js). Cặp đầy → nhắc bán bớt / nới cặp.
// Rải theo ô 34 m quanh người chơi (89 m), hạt giống theo ô + ngày → mỗi ngày đổi chỗ, nhặt rồi thì hết trong ngày đó.
// Hình: biểu tượng (sprite canvas, dùng lại theo loại) + đốm sáng cộng màu; tối đa 13 món hiện cùng lúc → nhẹ cho điện thoại.
import * as THREE from 'three';
import { ITEM } from './catalog.js';
import { blocked } from '../layout.js';
import { CFG } from '../config.js';
import { ic } from './wallet.js';

const CELL = 34, RAD = 89, MAXN = 13, WL = CFG.island.waterLevel;
const BEACH = ['shell', 'shell', 'shell', 'conch', 'conch', 'pearl'], HIGH = ['crystal', 'crystal', 'amber', 'ruby', 'stone'];
const LAND = ['herb', 'herb', 'flower', 'flower', 'mushroom', 'feather', 'wood', 'stone', 'gold', 'gold'], RARE = ['book', 'scroll', 'map-piece', 'key-old'];
const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function createPickups(ctx) {
  const { scene, terrain } = ctx, pl = ctx.player, eco = ctx.eco;
  const day = () => Math.floor((Date.now() + 7 * 36e5) / 864e5);
  let got, gotDay = 0; const loadGot = () => { gotDay = day(); try { const s = JSON.parse(localStorage.getItem('island.loot') || 'null'); got = s && s.d === day() ? new Set(s.k) : new Set(); } catch (e) { got = new Set(); } };
  const saveGot = () => { try { localStorage.setItem('island.loot', JSON.stringify({ d: day(), k: [...got].slice(-377) })); } catch (e) {} };
  loadGot();
  // sprite biểu tượng theo loại (canvas 64 px, dùng lại)
  const tex = {};
  const texOf = icon => tex[icon] || (tex[icon] = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.font = '48px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#fff8'; g.shadowBlur = 8; g.fillText(icon, 32, 36); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })());
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff3b080'); r.addColorStop(0.38, '#ffd25a40'); r.addColorStop(1, '#ffd25a00'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pool = Array.from({ length: MAXN }, () => {
    const g = new THREE.Group(), icon = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false })), glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
    icon.scale.setScalar(0.72); glow.scale.setScalar(1.1); icon.renderOrder = 2; glow.renderOrder = 1; g.add(glow, icon); g.visible = false; scene.add(g); return { g, icon, glow, it: null, key: null };
  });
  // ô (i, j) hôm nay có món gì, ở đâu (null = không có)
  function cellLoot(i, j) {
    const d = day(), r = hash(i, j, d); if (r > 0.38) return null;
    const x = (i + 0.15 + hash(i, j, d + 1) * 0.7) * CELL, z = (j + 0.15 + hash(i, j, d + 2) * 0.7) * CELL;
    const h = terrain.heightAt(x, z); if (h < WL - 0.2 || blocked(x, z, 1.3) || (terrain.slopeAt && terrain.slopeAt(x, z) > 0.7)) return null;
    if (ctx.grid) { const N = ctx.grid.near(x, z); if (N.boxes.some(B => x > B.x0 - 1 && x < B.x1 + 1 && z > B.z0 - 1 && z < B.z1 + 1) || N.cols.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 0.8)) return null; }
    const k = hash(i, j, d + 3), L = k < 0.06 ? RARE : h < WL + 1.6 ? BEACH : h > 21 ? HIGH : LAND;
    return { id: L[Math.floor(hash(i, j, d + 4) * L.length)], x, z, y: h, key: `${i},${j}` };
  }
  let scanT = 0, cur = [];
  function scan() {
    const p = pl.pos, i0 = Math.floor((p.x - RAD) / CELL), i1 = Math.floor((p.x + RAD) / CELL), j0 = Math.floor((p.z - RAD) / CELL), j1 = Math.floor((p.z + RAD) / CELL), L = [];
    if (gotDay !== day()) loadGot();   // sang ngày mới: rải lại
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = cellLoot(i, j); if (c && !got.has(c.key)) { const d = Math.hypot(c.x - p.x, c.z - p.z); if (d < RAD) L.push([d, c]); } }
    L.sort((a, b) => a[0] - b[0]); cur = L.slice(0, MAXN).map(e => e[1]);
    pool.forEach((s, k) => {
      const c = cur[k]; s.it = c || null; s.g.visible = !!c; if (!c) return;
      if (s.key !== c.key) { s.key = c.key; const icon = c.id === 'gold' ? '🪙' : ITEM[c.id].icon; s.icon.material.map = texOf(icon); s.icon.material.needsUpdate = true; s.g.position.set(c.x, c.y + 0.62, c.z); }
    });
  }
  function take(s) {
    const c = s.it; if (!c) return;
    if (c.id === 'gold') { const n = 2 + Math.floor(hash(c.x | 0, c.z | 0, day()) * 4); ctx.account.addCoins(n); ctx.toast(`✨ Nhặt được <b>${n}</b> ${ic('gold', 14)} đồng vàng!`, 2200); }
    else {
      const it = ITEM[c.id], k = eco.addLoot(c.id, 1);
      if (!k) { if (performance.now() - (take.full || 0) > 8000) { take.full = performance.now(); ctx.toast(`🎒 Cặp đầy rồi (${eco.bagCount()}/${eco.cap()})! Mở cặp (B) bán bớt hoặc <b>nới cặp</b> bằng đồng vàng nhé.`, 4000); } return; }
      ctx.toast(`✨ +1 ${it.icon} <b>${it.name}</b> vào cặp 🎒<br><small>💡 ${it.desc}</small>`, 4000); ctx.sfx && ctx.sfx('ok'); flyToBag(it.icon);
    }
    got.add(c.key); saveGot(); s.it = null; s.g.visible = false; ctx.vibrate && ctx.vibrate([21]); pl.emote && pl.emote('interact');
    if (ctx.feel && ctx.feel.burst) ctx.feel.burst(s.g.position);
    scanT = 0.3;
  }
  function flyToBag(icon) {
    const b = document.getElementById('bBag'), r = b && b.getBoundingClientRect(); if (!r || !r.width) return;
    const v = pl.pos.clone(); v.y += 1; v.project(ctx.camera); const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight;
    const e = document.createElement('div'); e.className = 'ecoFly'; e.style.fontSize = '28px'; e.textContent = icon; document.body.appendChild(e);
    e.animate([{ transform: `translate(${sx}px,${sy}px) scale(.6)` }, { transform: `translate(${(sx + r.left) / 2}px,${Math.min(sy, r.top) - 55}px) scale(1.3)`, offset: 0.4 }, { transform: `translate(${r.left + 8}px,${r.top + 8}px) scale(.62)` }], { duration: 764, easing: 'ease-in' }).onfinish = () => { e.remove(); b.animate && b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.21)' }, { transform: 'scale(1)' }], { duration: 236 }); };
  }
  let t = 0;
  function update(dt) {
    if (!ctx.account || !ctx.account.profile) return;
    t += dt; scanT -= dt; if (scanT <= 0) { scanT = 1; scan(); }
    const p = pl.pos; let best = null, bd = 3.4;
    for (let k = 0; k < pool.length; k++) {
      const s = pool[k]; if (!s.it) continue;
      s.icon.position.y = Math.sin(t * 2.4 + k) * 0.1; s.glow.material.opacity = 0.62 + Math.sin(t * 4 + k * 1.7) * 0.38; s.glow.material.rotation = t * 0.6;
      const d = Math.hypot(s.it.x - p.x, s.it.z - p.z);
      if (d < 1.3 && Math.abs(s.it.y - p.y) < 2 && !pl.frozen) { take(s); continue; }
      if (d < bd && Math.abs(s.it.y - p.y) < 2.5) { bd = d; best = s; }
    }
    if (best && !pl.frozen) ctx.offer(`✋ Nhặt ${best.it.id === 'gold' ? '🪙 đồng vàng' : ITEM[best.it.id].icon + ' ' + ITEM[best.it.id].name}`, () => take(best), 6);
  }
  // kiểm thử: đặt 1 món ngay cạnh người chơi
  const debugDrop = (id = 'shell') => { const s = pool[0], p = pl.pos; s.it = { id, x: p.x + 2, z: p.z, y: p.y, key: 'test' + Date.now() }; s.key = null; s.icon.material.map = texOf(id === 'gold' ? '🪙' : ITEM[id].icon); s.icon.material.needsUpdate = true; s.g.position.set(p.x + 2, p.y + 0.62, p.z); s.g.visible = true; scanT = 99; return s; };
  return { update, scan, debugDrop, get active() { return pool.filter(s => s.it).length; } };
}
