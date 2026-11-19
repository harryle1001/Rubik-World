// academy/wear.js — ĐỒ MUA Ở PHỐ PHÉP THUẬT: áo choàng + mũ (model CC0 KayKit Mage, bám xương chest/head), chổi bay đeo lưng
// (Medieval Tools Pack, CC0), thú cưng đi theo (thú Quaternius CC0 có animation). Lưu localStorage 'academy.wear'.
// Cập nhật mỗi khung ở mọi nơi trên đảo (không phụ thuộc chunk Học viện). Chỉ đặt model + màu, không dựng hình.
import * as THREE from 'three';
import { loadModel, loadAnimated, animator } from '../models.js';

export const CAPES = [
  { id: 'cape-do', name: 'Đỏ thẫm', col: '#9b2335' }, { id: 'cape-lam', name: 'Lam đêm', col: '#24346b' }, { id: 'cape-luc', name: 'Lục rừng', col: '#2f6b45' },
  { id: 'cape-tim', name: 'Tím sao', col: '#5b3a8e' }, { id: 'cape-vang', name: 'Vàng nghệ', col: '#c9962a' }, { id: 'cape-den', name: 'Đen tuyền', col: '#26232b' },
];
export const HATS = [{ id: 'hat-tim', name: 'Mũ tím sao', col: '#6b4aa8' }, { id: 'hat-lam', name: 'Mũ lam đêm', col: '#2a3f7a' }, { id: 'hat-do', name: 'Mũ đỏ thẫm', col: '#8e2433' }];
export const BROOMS = [{ id: 'broom', name: 'Chổi bay gỗ sồi', col: '#9a6a3e', price: 34 }, { id: 'broom-tre', name: 'Chổi Tre Gió Lộng', col: '#9cb85a', price: 44 }, { id: 'broom-vang', name: 'Chổi bay cán vàng', col: '#e0b040', price: 55 }, { id: 'broom-sao', name: 'Chổi Sao Băng', col: '#8a7cff', price: 89 }];   // cưỡi được (brooms.js): 13 · 17 · 21 · 21×2 m/s
export const PETS = [
  { id: 'pet-meo', name: 'Mèo mướp', model: 'animal-cat', size: 0.5, walk: 'Walk', run: 'Run', idle: 'Idle' },
  { id: 'pet-cun', name: 'Cún Shiba', model: 'animal-shiba', size: 0.62, walk: 'Walk', run: 'Gallop', idle: 'Idle' },
  { id: 'pet-cao', name: 'Cáo nhỏ', model: 'animal-fox', size: 0.6, walk: 'Walk', run: 'Gallop', idle: 'Idle' },
  { id: 'pet-ech', name: 'Ếch xanh', model: 'animal-frog', size: 0.32, walk: 'Frog_Jump', run: 'Frog_Jump', idle: 'Frog_Idle' },
  { id: 'pet-cu', name: 'Cú mèo nhỏ', model: 'alley/owl', size: 0.34, fly: true, col: '#8a6a48' },   // cú CC0 (OpenGameArt "Animal Figurines"): bay lượn theo vai

];
const load = () => { try { return JSON.parse(localStorage.getItem('academy.wear')) || null; } catch (e) { return null; } };
const clean = n => n.split('|').pop();

const tint = (obj, col) => obj.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(col); o.castShadow = true; } });
// vị trí gắn (đơn vị xương của people-model, đã căn bằng ảnh chụp)
const MOUNT = {
  hat: { bone: 'head', file: 'alley/wiz-hat', p: [0, 0.2, -0.01], s: 0.42, r: [-0.12, 0, 0] },
  cape: { bone: 'chest', file: 'alley/wiz-cape', p: [0, 0.32, -0.3], s: [0.62, 0.46, 0.5], r: [0.1, 0, 0] },
  broom: { bone: 'chest', file: 'alley/broom', p: [0.04, 0.1, -0.42], s: 1, r: [Math.PI / 2, 0, 0.62] },
};
// mặc đồ cho nhân vật bất kỳ (người chơi khác qua mạng, NPC): eq = { cape, hat } → gắn model vào xương; trả về các phần đã gắn
export async function dressHero(hero, eq, old = []) {
  for (const o of old) o.removeFromParent();
  const out = [];
  for (const slot of ['cape', 'hat']) {
    const id = eq && eq[slot], item = id && [...CAPES, ...HATS].find(x => x.id === id); if (!item) continue;
    const M = MOUNT[slot], bone = hero.model.getObjectByName(M.bone), src = await loadModel(M.file); if (!src || !bone) continue;
    const g = new THREE.Group(); g.add(src); g.position.fromArray(M.p); g.rotation.set(...M.r); [].concat(M.s).length > 1 ? g.scale.fromArray(M.s) : g.scale.setScalar(M.s); tint(g, item.col);
    bone.add(g); out.push(g);
  }
  return out;
}

export function createWear(ctx) {
  const st = load() || { own: [], eq: {} }; st.bag = st.bag || {};   // bag: đồ tiêu hao { id: số lượng } (pháo hoa phép…)
  const save = () => { try { localStorage.setItem('academy.wear', JSON.stringify(st)); } catch (e) {} };
  const parts = { cape: null, hat: null, broom: null }, ids = { cape: null, hat: null, broom: null };
  let pet = null, petId = null, heroRef = null;

  async function mount(slot, id) {
    const hero = ctx.player.hero; if (!hero) return;
    if (parts[slot]) { parts[slot].removeFromParent(); parts[slot] = null; }
    ids[slot] = id;
    if (hero.isVrm && slot === 'hat') return;   // nhân vật anime: mũ chóp của bộ VRM (look.hat — economy/backpack.js qua ctx.onWearHat)
    if (hero.isVrm && slot === 'cape') { const it = CAPES.find(x => x.id === id) || (ctx.eco && ctx.eco.ITEM[id]); if (hero.fit && hero.fit.setRobe) hero.fit.setRobe(it ? it.col : null); return; }   // nhân vật anime: một áo choàng duy nhất (vrm-outfit.js) đổi màu
    if (!id) return;
    const M = MOUNT[slot], bone = hero.model.getObjectByName(M.bone), src = await loadModel(M.file);
    if (!src || !bone || ids[slot] !== id) return;
    const item = [...CAPES, ...HATS, ...BROOMS].find(x => x.id === id) || (ctx.eco && ctx.eco.ITEM[id]) || { col: '#888' };
    const g = new THREE.Group(); g.add(src); src.position.set(0, 0, 0); src.rotation.set(0, 0, 0); src.scale.setScalar(1);
    g.position.fromArray(M.p); g.rotation.set(...M.r); [].concat(M.s).length > 1 ? g.scale.fromArray(M.s) : g.scale.setScalar(M.s); tint(g, item.col);
    bone.add(g); parts[slot] = g;
  }
  async function spawnPet(id) {
    if (pet) { ctx.scene.remove(pet.root); pet = null; }
    petId = id; if (!id) return;
    const P = PETS.find(x => x.id === id), g = P.fly ? { scene: await loadModel(P.model), animations: [] } : await loadAnimated(P.model, true); if (!g || !g.scene || petId !== id) return;
    const root = new THREE.Group(), model = g.scene; root.add(model); if (P.col) tint(model, P.col);
    model.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(model), h = box.max.y - box.min.y || 1;
    model.scale.setScalar(P.size / h); model.position.y = -box.min.y * P.size / h; model.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const p = ctx.player.pos; root.position.set(p.x - 1, p.y, p.z - 1); ctx.scene.add(root);
    const anim = P.fly ? { play() {}, update() {} } : animator(model, g.animations, clean); anim.play(P.idle, 0);
    pet = { P, root, anim, rot: 0, sp: 0, hop: 0 };
  }
  function equip(slot, id) {
    if (slot === 'pet') { st.eq.pet = id; spawnPet(id); }
    else { st.eq[slot] = id; mount(slot, id); if (slot === 'hat' && ctx.onWearHat) ctx.onWearHat(!!id); }
    save(); if (ctx.net && ctx.net.sendLook) ctx.net.sendLook();
  }
  const own = id => st.own.includes(id);
  function give(slot, id) { if (!own(id)) st.own.push(id); if (MOUNT[slot] || slot === 'pet') equip(slot, id); else save(); }   // sách, nhạc cụ, đồ dùng: chỉ cất vào túi

  const v = new THREE.Vector3();
  function update(dt) {
    const hero = ctx.player.hero;
    if (hero && hero !== heroRef) { heroRef = hero; for (const s of ['cape', 'hat', 'broom']) if (st.eq[s]) mount(s, st.eq[s]); if (ctx.net && ctx.net.sendLook) ctx.net.sendLook(); }
    if (parts.broom) parts.broom.visible = !(ctx.vehicles && ctx.vehicles.riding === 'broom');   // đang cưỡi chổi: chổi sau lưng ẩn
    if (!pet && st.eq.pet && petId !== st.eq.pet) spawnPet(st.eq.pet);
    if (!pet) return;
    const pp = ctx.player.pos, R = pet.root, yaw = ctx.player.cam ? ctx.player.cam.yaw : 0;
    pet.root.visible = !ctx.player.vehicle && !(ctx.ferry && ctx.ferry.riding);
    // điểm đi theo: sau-bên trái người chơi 1,3 m; xa quá 21 m → dịch chuyển tới gần
    v.set(pp.x - Math.sin(yaw) * 1.3 + Math.cos(yaw) * 0.8, 0, pp.z - Math.cos(yaw) * 1.3 - Math.sin(yaw) * 0.8);
    const dx = v.x - R.position.x, dz = v.z - R.position.z, d = Math.hypot(dx, dz);
    if (d > 21) { R.position.set(v.x, pp.y, v.z); return; }
    const want = d > 0.6 ? Math.min(6, d * 2.2) : 0; pet.sp += (want - pet.sp) * Math.min(1, dt * 5);
    if (pet.sp > 0.05) { pet.rot = Math.atan2(dx, dz); R.position.x += Math.sin(pet.rot) * pet.sp * dt; R.position.z += Math.cos(pet.rot) * pet.sp * dt; pet.anim.play(pet.sp > 3 ? pet.P.run : pet.P.walk, 0.25); }
    else pet.anim.play(pet.P.idle, 0.4);
    R.rotation.y += (((pet.rot - R.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 8);
    if (pet.P.fly) {                       // cú: lượn trên vai, nhấp nhô, nghiêng theo hướng bay
      pet.hop += dt; const want = pp.y + 1.75 + Math.sin(pet.hop * 2.4) * 0.12;
      R.position.y += (want - R.position.y) * Math.min(1, dt * 4); R.rotation.z = Math.sin(pet.hop * 1.3) * 0.12 - Math.min(0.3, pet.sp * 0.05);
      return;
    }
    const gy = Math.max(ctx.terrain.heightAt(R.position.x, R.position.z), ctx.groundExtra ? ctx.groundExtra(R.position.x, R.position.z, pp.y + 0.5) : -99);
    R.position.y += (Math.min(gy, pp.y + 0.6) - R.position.y) * Math.min(1, dt * 10);
    pet.anim.update(dt);
  }
  const count = id => st.bag[id] || 0;
  const addItem = (id, n = 1) => { st.bag[id] = Math.max(0, count(id) + n); if (!st.bag[id]) delete st.bag[id]; save(); };
  return { update, give, equip, own, count, addItem, get eq() { return st.eq; }, get owned() { return st.own.slice(); }, get bag() { return { ...st.bag }; } };
}
