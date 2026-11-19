// academy/spells.js — CÁC PHÉP + mục tiêu đặt trong lâu đài.
//  ☀️ Sáng lên (Khoa học – ánh sáng): thắp 5 đèn lồng trong thư viện tối; không có đèn gần → quả cầu sáng theo em 21 s.
//  🪶 Bay lên (Vật lý – trọng lực, đòn bẩy): tính đúng tay đòn để nâng tảng đá 2,6 m ở Sân Luyện Đũa → lộ rương năng lượng.
// Trạng thái lưu localStorage (academy.lit, academy.stone); mục tiêu dựng lại mỗi lần đảo được tải.
import * as THREE from 'three';
import { mat } from '../sample/palette.js';
import { toon } from '../style.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle4 = (ans, wrong) => { const ch = [...new Set([ans, ...wrong])].slice(0, 4); while (ch.length < 4) ch.push(ans + ch.length); ch.sort(() => Math.random() - 0.5); return { choices: ch.map(String), a: ch.indexOf(ans) }; };

const LIGHT_FACTS = [
  'Ánh sáng truyền theo <b>đường thẳng</b> — vì vậy vật chắn sáng tạo ra bóng.',
  'Ánh sáng đi khoảng <b>300 000 km mỗi giây</b>: 1 giây đi gần 8 vòng Trái Đất!',
  'Gương phẳng <b>phản xạ</b> ánh sáng: góc tới bằng góc phản xạ.',
  'Ánh sáng trắng gồm <b>7 màu</b> cầu vồng: đỏ, cam, vàng, lục, lam, chàm, tím.',
  'Ta <b>nhìn thấy</b> một vật khi có ánh sáng từ vật đó truyền vào mắt.',
];
function leverQ() {
  if (Math.random() < 0.25) return { q: 'Khi phép "Bay lên" hết tác dụng, tảng đá sẽ thế nào?', choices: ['Rơi xuống vì trọng lực', 'Bay mãi lên trời', 'Đứng yên giữa không trung', 'Biến mất'], a: 0, explain: '<b>Trọng lực</b> của Trái Đất kéo mọi vật về phía mặt đất.' };
  const F = [10, 15, 20, 30][ri(0, 3)], k = [2, 3, 4][ri(0, 2)], W = F * k;
  return { q: `Tảng đá nặng <b>${W} kg</b>, đặt cách điểm tựa <b>1 m</b>. Em chỉ đẩy được lực bằng <b>${F} kg</b>. Phải đặt tay cách điểm tựa bao nhiêu mét?`, ...shuffle4(k, [k - 1, k + 1, k + 2, 1]), explain: `Đòn bẩy cân bằng khi ${W} × 1 = ${F} × d → d = <b>${k} m</b>. Tay đòn càng dài càng đỡ tốn sức.` };
}

export function createSpells(ctx, magic, { toWorld, L, Y }) {
  const lit = load('academy.lit', []), stone = { lifted: load('academy.stone', false) };
  // ---------- phép ----------
  let orb = null, orbT = 0;
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fffbe8'); r.addColorStop(0.3, '#ffe3a0aa'); r.addColorStop(1, '#ffe3a000'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const halo = (s = 2.6) => { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); h.scale.setScalar(s); return h; };
  magic.addSpell({
    id: 'light', name: 'Sáng lên', icon: '☀️', subjects: ['khoahoc'], learn: 'thắp sáng nơi tối (học về ánh sáng).',
    cast(api) {   // không có đèn gần: quả cầu sáng bay theo 21 s
      if (!orb) { orb = new THREE.Group(); orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('lampGlow')), halo(2.2)); ctx.scene.add(orb); }
      orb.position.copy(api.from); orbT = 21; orb.visible = true;
      api.toast('☀️ <b>Sáng lên!</b> Quả cầu sáng đi theo em 21 giây. ' + LIGHT_FACTS[ri(0, 4)], 4500);
    },
    update(dt) {
      if (!orb || !orb.visible) return; orbT -= dt; const p = ctx.player.pos, t = performance.now() / 1000;
      orb.position.lerp(new THREE.Vector3(p.x + Math.sin(t) * 0.8, p.y + 2.4 + Math.sin(t * 1.7) * 0.2, p.z + Math.cos(t) * 0.8), Math.min(1, dt * 3));
      if (orbT <= 0) orb.visible = false;
    },
  });
  magic.addSpell({ id: 'lift', name: 'Bay lên', icon: '🪶', subjects: ['khoahoc', 'toan'], learn: 'nâng vật nặng nhờ hiểu trọng lực và đòn bẩy.', hint: 'Thử ở tảng đá lớn trong Sân Luyện Đũa.' });

  // ---------- mục tiêu trong lâu đài (dựng khi đảo tải) ----------
  let built = null;
  function build(group) {
    const g = new THREE.Group(); g.name = 'academy-spell-props'; ctx.scene.add(g);   // toạ độ thế giới (không gắn vào nhóm đảo đã dời tới tâm đảo)
    const T = [], boxes = [];
    // 5 đèn lồng trong thư viện
    const Lb = L.library, lu = (Lb.u0 + Lb.u1) / 2 - 1;
    const post = new THREE.CylinderGeometry(0.06, 0.08, 1.9, 6).translate(0, 0.95, 0), cage = new THREE.BoxGeometry(0.42, 0.55, 0.42), dark = toon('#4a4436');
    [60, 66, 72, 78, 84].forEach((v, i) => {
      const [x, z] = toWorld(lu, v), m = new THREE.Mesh(cage, lit.includes(i) ? mat('lampGlow') : dark), p = new THREE.Mesh(post, toon('#3a3344'));
      p.position.set(x, Y, z); m.position.set(x, Y + 2.2, z); g.add(p, m);
      const h = halo(3.4); h.position.copy(m.position); h.visible = lit.includes(i); g.add(h);
      T.push(magic.addTarget({
        spell: 'light', pos: m.position, done: () => lit.includes(i),
        onCast(api) {
          lit.push(i); save('academy.lit', lit); m.material = mat('lampGlow'); h.visible = true; api.burst(m.position, new THREE.Vector3(0, 1, 0), '#ffe3a0', 34, 2, 1);
          api.toast(`☀️ Đèn ${lit.length}/5 sáng lên! ${LIGHT_FACTS[i]}`, 6000);
          if (lit.length === 5) setTimeout(() => { magic.setMana(magic.mana + 55); api.toast('📚 <b>Thư viện bừng sáng!</b> Em nhận +55 năng lượng phép. Bóng tối chỉ là nơi thiếu ánh sáng.', 6000); }, 2600);
        },
      }));
    });
    // tảng đá + rương ở Sân Luyện Đũa
    const su = -50, sv = -95, [sx, sz] = toWorld(su, sv), [ex, ez] = toWorld(su, sv - 8);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0).scale(1, 0.8, 1), toon('#8a857d')); rock.castShadow = true;
    const chest = new THREE.Group(); chest.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7).translate(0, 0.3, 0), toon('#6e4a30')), new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.75).translate(0, 0.62, 0), toon('#d4a24a')));
    chest.position.set(sx, Y, sz); g.add(chest, rock);
    const rest = new THREE.Vector3(sx, Y + 1.25, sz), aside = new THREE.Vector3(ex, Y + 1.25, ez);
    rock.position.copy(stone.lifted ? aside : rest);
    const rbox = { x0: sx - 1.6, x1: sx + 1.6, z0: sz - 1.6, z1: sz + 1.6, top: Y + 2.5 }; if (!stone.lifted) boxes.push(rbox);
    let anim = 0, opened = load('academy.chest', false);
    T.push(magic.addTarget({
      spell: 'lift', pos: rock.position, done: () => stone.lifted,
      onCast(api) {
        api.ask(leverQ(), () => {
          stone.lifted = true; save('academy.stone', true); anim = 0.0001; const k = ctx.boxes.indexOf(rbox); if (k >= 0) ctx.boxes.splice(k, 1);
          api.toast('🪶 <b>Bay lên!</b> Tảng đá bay lên nhẹ như lông chim… dưới đó có một chiếc rương!', 4500);
        }, '🪶 Bay lên — tính đúng mới nâng được đá');
      },
    }));
    ctx.boxes.push(...boxes);
    built = {
      g, T, boxes,
      update(dt) {
        if (anim > 0) {   // bay lên 3 m, dạt sang bên, hạ xuống
          anim += dt; const t = Math.min(1, anim / 3), up = Math.sin(t * Math.PI) * 3;
          rock.position.lerpVectors(rest, aside, t * t * (3 - 2 * t)); rock.position.y += up; rock.rotation.y += dt * 0.8;
          if (t >= 1) anim = 0;
        }
        const p = ctx.player.pos;
        if (stone.lifted && !opened && anim === 0 && Math.hypot(p.x - sx, p.z - sz) < 2.6) ctx.offer('🧰 Mở rương', () => {
          opened = true; save('academy.chest', true); chest.children[1].rotation.x = -1.1; chest.children[1].position.set(0, 0.35, -0.35);
          magic.setMana(magic.mana + 55); magic.burst(new THREE.Vector3(sx, Y + 1, sz), new THREE.Vector3(0, 1, 0), '#ffd34d', 34, 3, 1);
          ctx.toast('🧰 Rương năng lượng: +55! <b>Đòn bẩy</b> có ở khắp nơi: bập bênh, cái kéo, xe cút kít, cái mở nắp chai.', 6000);
        }, 8);
      },
    };
    return built;
  }
  function unbuild() { if (!built) return; ctx.scene.remove(built.g); built.g.traverse(o => o.geometry && o.geometry.dispose()); for (const t of built.T) magic.removeTarget(t); for (const b of built.boxes) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); } built = null; }
  return { build, unbuild, update(dt) { built && built.update(dt); } };
}
