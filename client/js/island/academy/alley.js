// academy/alley.js — PHỐ PHÉP THUẬT: con hẻm mua sắm quanh co giữa cánh đông lâu đài và tường thành (thiết kế nguyên bản).
// Khung cắm (index.js): create(ctx, magic, { toWorld, toLocal, L, Y }) → { build(), unbuild(), update(dt, t) }.
// Hình: CHỈ ghép model CC0 Kenney Fantasy Town Kit 2.0 (client/assets/models/alley/, xem CREDITS.txt) — tường/cửa/cửa sổ/mái/ống khói
// từng ô 1×1 đặt bằng instancing (mỗi loại module = 1 InstancedMesh → ~30 draw call cả phố); mặt đường lát đá cuội ambientCG (CC0).
// Code chỉ tính chỗ đặt: nhà phố 1–2 gian × 1–3 gian sâu × 2–4 tầng, mặt tiền bám mép lối cong, nghiêng ngả nhẹ, mái đầu hồi quay ra lối.
// Tỷ lệ φ/Fibonacci: ô module 3,4 m · lối rộng 4,2 m, quảng trường giữa hẻm rộng ~9,4 m · hẻm dài 118 m (u 29 → −89) · uốn chu kỳ 2π·13 m.
import * as THREE from 'three';
import { loadModel } from '../models.js';
import { toon } from '../style.js';
import { heightLocal } from './plan.js';


const S = 3.4;                                                   // 1 ô module Kenney = 3,4 m (cửa ≈ 2 m)
const V_CASTLE = 117, V_WALL = 135.2;                            // mặt ngoài dãy đông lâu đài · mặt trong tường thành
const U0 = 28, U1 = -89;                                         // đầu hẻm (cổng, phía nam) → cuối hẻm (ngân hàng)
const PLAZA = -14;                                               // quảng trường giữa hẻm (đài phun nước)
export const vc = u => 127.4 + 1.6 * Math.sin(u / 13);           // tim lối
export const hw = u => 2.1 + 2.6 * Math.exp(-(((u - PLAZA) / 9) ** 2));   // nửa bề rộng lối (phình ở quảng trường)
const rnd = (s => () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5 | 0) >>> 0) / 4294967296 * 0.5 + ((s = Math.imul(s ^ (s >>> 13), 61 | s)) >>> 0) / 4294967296 * 0.5)(0x9e3779b9);
const pick = a => a[Math.floor(rnd() * a.length)];

// Cửa hàng (nguyên bản): bên (−1 tây/lâu đài, +1 đông/tường thành), vị trí u gần đúng; ngân hàng chắn cuối hẻm
export const SHOPS = [
  { id: 'wand', name: '🪄 Tiệm Đũa Pha Lê', side: -1, u: 20 },
  { id: 'sweet', name: '🍬 Tiệm Bánh Kẹo Phép', side: 1, u: 14 },
  { id: 'book', name: '📚 Hiệu Sách Bay', side: -1, u: 2 },
  { id: 'herb', name: '🌿 Quầy Thảo Dược', side: 1, u: PLAZA, stall: true },
  { id: 'pet', name: '🦉 Tiệm Cú & Thú Cưng', side: -1, u: -48 },
  { id: 'broom', name: '🧹 Xưởng Chổi Bay', side: 1, u: -40 },
  { id: 'robe', name: '🧥 Áo Choàng & Mũ', side: -1, u: -70 },
  { id: 'bank', name: '🏦 Ngân Hàng Kho Báu', side: 0, u: U1 - 3 },
];

const WALL_TINT = [[1, 1, 1], [1, 0.93, 0.8], [1, 0.86, 0.84], [0.9, 0.97, 0.88], [0.94, 0.92, 1]];
const ROOF_TINT = [[1, 1, 1], [1.28, 0.86, 0.74], [0.82, 1.04, 1.02], [0.72, 0.72, 0.84], [1.1, 1, 0.8]];
const STYLE = {
  plaster: { plain: 'wall', door: 'wall-door', doorR: 'wall-doorway-round', win: ['wall-window-glass', 'wall-window-shutters', 'wall-window-round'], side: ['wall', 'wall-side'] },
  wood: { plain: 'wall-wood', door: 'wall-wood-door', doorR: 'wall-wood-doorway-round', win: ['wall-wood-window-glass', 'wall-wood-window-shutters', 'wall-wood-window-round', 'wall-wood-window-small'], side: ['wall-wood', 'wall-wood-detail-cross'] },
};

export function create(ctx, magic, { toWorld, toLocal, Y }) {
  const W = (u, v, y) => { const [x, z] = toWorld(u, v); return new THREE.Vector3(x, y, z); };
  const gy = (u, v) => { const [x, z] = toWorld(u, v); return heightLocal(u, v, x, z); };
  let built = null;

  // ---------- bố cục (tính 1 lần): danh sách nhà ----------
  function layout() {
    const houses = [], shopAt = new Map(SHOPS.map(s => [s, null]));
    for (const side of [-1, 1]) {
      let u = U0;
      while (u > U1 + 2) {
        let w = rnd() < 0.55 ? 1 : 2;
        const um = u - w * S / 2;
        if (side < 0 && um > -40 && um < -28) { u -= 1.2; continue; }               // chân tháp phụ (u −34): để trống
        if (side > 0 && um > PLAZA - 9 && um < PLAZA + 8) { u -= 1.2; continue; }   // quảng trường: phía đông để sạp hàng
        const shop = SHOPS.find(s => s.side === side && !s.stall && !shopAt.get(s) && Math.abs(s.u - um) < 5);
        if (shop) w = 2;
        const uc = u - w * S / 2, fv = vc(uc) + side * hw(uc);
        const avail = side < 0 ? fv - V_CASTLE : V_WALL - fv, d = Math.min(3, Math.floor((avail + 0.5) / S));
        if (d < 1) { u -= 1.2; continue; }
        const fl = shop ? 3 : pick([2, 3, 3, 4, 2, 3]);
        const h = { u: uc, v: fv, side, w, d, fl, shop, style: rnd() < 0.5 ? 'plaster' : 'wood', top: rnd() < 0.5 ? 'wood' : 'plaster', tint: pick(WALL_TINT), roof: pick(ROOF_TINT), lean: [(rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.05] };
        if (shop) shopAt.set(shop, h);
        houses.push(h); u -= w * S + 0.12;
      }
    }
    // ngân hàng: 4 gian × 2 sâu × 4 tầng, chắn cuối hẻm, mặt tiền quay về nam (+u)
    const bank = SHOPS.find(s => s.id === 'bank');
    const hb = { u: U1 - 0.4, v: vc(U1), side: 0, w: 4, d: 2, fl: 4, shop: bank, style: 'plaster', top: 'plaster', tint: [1, 0.95, 0.86], roof: [0.82, 1.04, 1.02], lean: [0, 0], bank: true };
    houses.push(hb); shopAt.set(bank, hb);
    return houses;
  }

  // ---------- dựng ----------
  function build() {
    const g = new THREE.Group(); g.name = 'academy-alley'; ctx.scene.add(g);
    const inst = new Map(), boxes = [];                                   // tên module → [{ m, c }]
    const put = (name, m, c) => { if (!inst.has(name)) inst.set(name, []); inst.get(name).push({ m, c }); };
    const T = new THREE.Matrix4(), R = new THREE.Matrix4(), Sc = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);
    const houses = layout();
    for (const h of houses) {
      // khung nhà: gốc = giữa mép trước, chân tường; Z = vào sâu (ra xa lối), X = dọc mặt tiền
      let n;                                                                       // thế giới: x = v, z = u
      if (h.bank) n = new THREE.Vector3(0, 0, -1);                                 // ngân hàng: mặt tiền nhìn về +u, sâu về −u
      else { const dv = vc(h.u + 0.5) - vc(h.u - 0.5); n = new THREE.Vector3(h.side, 0, -h.side * dv).normalize(); }   // ⟂ lối, ra xa lối
      const X = new THREE.Vector3().crossVectors(up, n).normalize();
      const fx = W(h.u, h.v, 0);
      let y0 = Infinity;
      for (const a of [-0.5, 0.5]) for (const b of [0, 1]) { const p = fx.clone().addScaledVector(X, a * h.w * S).addScaledVector(n, b * h.d * S); const [u, v] = toLocal(p.x, p.z); y0 = Math.min(y0, heightLocal(u, v, p.x, p.z)); }
      y0 -= 0.25;
      const base = new THREE.Matrix4().makeBasis(X, up, n).setPosition(fx.x, y0, fx.z);
      base.multiply(new THREE.Matrix4().makeRotationX(h.lean[0])).multiply(new THREE.Matrix4().makeRotationZ(h.lean[1]));
      const col = new THREE.Color(...h.tint), rc = new THREE.Color(...h.roof);
      const cell = (i, k, j, a, name, c = col) => { const m = base.clone().multiply(T.makeTranslation((i + 0.5 - h.w / 2) * S, k * S, (j + 0.5) * S)).multiply(R.makeRotationY(a)).multiply(Sc.makeScale(S, S, S)); put(name, m, c); };
      for (let k = 0; k < h.fl; k++) {
        const st = STYLE[k === 0 ? h.style : h.top];
        const doorAt = h.bank ? Math.floor(h.w / 2) : (h.w > 1 ? Math.floor(rnd() * h.w) : 0);
        for (let i = 0; i < h.w; i++) {
          let f;                                                                     // mặt tiền
          if (k === 0) f = i === doorAt ? (h.bank ? st.doorR : rnd() < 0.3 ? st.doorR : st.door) : (h.shop ? st.win[0] : pick(st.win));
          else f = h.bank ? st.win[2] : pick(st.win);
          cell(i, k, 0, Math.PI / 2, f);
          if (h.side !== -1 || h.bank) cell(i, k, h.d - 1, -Math.PI / 2, st.plain);     // mặt sau (tây: áp lâu đài, bỏ)
        }
        for (let j = 0; j < h.d; j++) { cell(0, k, j, Math.PI, pick(st.side)); cell(h.w - 1, k, j, 0, pick(st.side)); }
      }
      // mái đầu hồi quay ra lối: 1 module roof-high-gable kéo giãn phủ cả nhà
      const rh = S * (0.85 + 0.3 * h.w);
      put('roof-high-gable', base.clone().multiply(T.makeTranslation(0, h.fl * S, h.d * S / 2)).multiply(R.makeRotationY(Math.PI / 2)).multiply(Sc.makeScale(h.d * S, rh / 1.15, h.w * S)), rc);
      if (h.w > 1 && rnd() < 0.6) put('roof-high-window', base.clone().multiply(T.makeTranslation(0, h.fl * S + 0.15 * S, S * 0.55)).multiply(R.makeRotationY(Math.PI / 2)).multiply(Sc.makeScale(S * 0.7, S * 0.7, S * 0.7)), rc);
      if (!h.bank && rnd() < 0.7) {                                              // ống khói
        const cx = (rnd() < 0.5 ? -1 : 1) * (h.w * S / 2 - 0.9), cz = h.d * S * (0.45 + rnd() * 0.3);
        put('chimney', base.clone().multiply(T.makeTranslation(cx - 0.3 * S, h.fl * S - 0.2, cz)).multiply(Sc.makeScale(S, rh * 0.75, S)), col);
        put('chimney-top', base.clone().multiply(T.makeTranslation(cx - 0.3 * S, h.fl * S - 0.2 + rh * 0.75, cz)).multiply(Sc.makeScale(S, S, S)), col);
        h.smoke = new THREE.Vector3(cx - 0.3 * S + 0.34 * S, h.fl * S + rh * 0.75 + 0.6 * S, cz).applyMatrix4(base)
      }
      if (h.fl > 2 && !h.bank && rnd() < 0.4) put(rnd() < 0.5 ? 'banner-red' : 'banner-green', base.clone().multiply(T.makeTranslation((h.w / 2 - 0.5) * S * (rnd() < 0.5 ? -1 : 1), S * (1.2 + rnd() * 0.3), -0.02)).multiply(R.makeRotationY(Math.PI / 2)).multiply(Sc.makeScale(S * 0.8, S * 0.8, S * 0.8)), col);
      if (h.bank) for (const i of [-1.5, -0.5, 0.5, 1.5]) put('pillar-stone', base.clone().multiply(T.makeTranslation(i * S * 0.98, 0, -0.9)).multiply(Sc.makeScale(S * 1.3, S * 1.25, S * 1.3)), col);
      h.base = base; h.y0 = y0; h.n = n; h.X = X; h.front = fx;
      // va chạm: hộp thẳng trục bao chân nhà, thu vào 0,3 m
      const cs = [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]].map(([a, b]) => fx.clone().addScaledVector(X, a * h.w * S).addScaledVector(n, b * h.d * S));
      boxes.push({ x0: Math.min(...cs.map(p => p.x)) + 0.3, x1: Math.max(...cs.map(p => p.x)) - 0.3, z0: Math.min(...cs.map(p => p.z)) + 0.3, z1: Math.max(...cs.map(p => p.z)) - 0.3, top: y0 + h.fl * S + rh });
    }
    // ---------- cổng hẻm (đầu nam): 2 cột đá + xà gỗ ----------
    const gw = hw(U0) + 0.6, gyv = gy(U0, vc(U0));
    for (const s of [-1, 1]) { const p = W(U0 + 0.5, vc(U0) + s * gw, gyv); put('pillar-stone', new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(S * 1.6, S * 1.45, S * 1.6)), new THREE.Color(1, 1, 1)); }
    { const p = W(U0 + 0.5, vc(U0), gyv + S * 1.45 - 0.2); put('pillar-wood', new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2), new THREE.Vector3(S * 1.3, gw * 2 + 0.8, S * 1.3)).multiply(T.makeTranslation(0, -0.5, 0)), new THREE.Color(1, 1, 1)); }
    // ---------- quảng trường: đài phun nước + sạp hàng ----------
    put('fountain-round-detail', new THREE.Matrix4().compose(W(PLAZA, vc(PLAZA) - 0.6, gy(PLAZA, vc(PLAZA)) - 0.05), new THREE.Quaternion(), new THREE.Vector3(1.6, 1.6, 1.6)), new THREE.Color(1, 1, 1));
    const stalls = [];
    for (const [du, nm] of [[-6.5, 'stall-green'], [-1.5, 'stall-red'], [3.5, 'stall-green']]) {
      const u = PLAZA + du, v = vc(u) + hw(u) - 1.4, p = W(u, v, gy(u, v));
      put(nm, new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, -Math.PI / 2), new THREE.Vector3(2.4, 2.4, 2.4)), new THREE.Color(1, 1, 1));
      stalls.push(p); boxes.push({ x0: p.x - 0.9, x1: p.x + 0.9, z0: p.z - 1.2, z1: p.z + 1.2, top: p.y + 1.2 });
    }
    { const u = PLAZA + 8.5, v = vc(u) + hw(u) - 1.3; put('cart-high', new THREE.Matrix4().compose(W(u, v, gy(u, v)), new THREE.Quaternion().setFromAxisAngle(up, 0.4), new THREE.Vector3(2.2, 2.2, 2.2)), new THREE.Color(1, 1, 1)); }
    // đèn lồng cột dọc lối (so le hai bên, cách 13 m)
    const lamps = [];
    for (let u = U0 - 4, k = 0; u > U1 + 4; u -= 13, k++) {
      if (Math.abs(u - PLAZA) < 5) continue;
      const s = k % 2 ? 1 : -1, v = vc(u) + s * (hw(u) - 0.35), p = W(u, v, gy(u, v));
      put('lantern', new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(2.1, 2.1, 2.1)), new THREE.Color(1, 1, 1)); lamps.push(p.clone().setY(p.y + 3.1));
      ctx.colliders.push({ x: p.x, z: p.z, r: 0.25, alley: true });
    }
    // ---------- mặt đường đá cuội: dải lưới theo lối (vá cả dưới chân mặt tiền) ----------
    {
      const tex = new THREE.TextureLoader().load('/assets/tex/cobble.jpg'); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const pos = [], uv = [], idx = [], N = 6; let rows = 0;
      for (let u = U0 + 5; u >= U1 - 4; u -= 1, rows++) for (let i = 0; i <= N; i++) {
        const v = vc(u) + (i / N * 2 - 1) * (hw(u) + 1.4), [x, z] = toWorld(u, v);
        pos.push(x, gy(u, v) + 0.05, z); uv.push(v / 2.6, u / 2.6);
      }
      for (let r = 0; r < rows - 1; r++) for (let i = 0; i < N; i++) { const a = r * (N + 1) + i, b = a + N + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, toon('#d8d0c4', { map: tex, unique: true })); m.receiveShadow = true; m.name = 'alley-cobble'; g.add(m);
    }
    // ---------- biển hiệu: 1 canvas atlas cho cả phố → 1 draw call; biển treo vuông góc mặt tiền (đọc được khi đi dọc lối) ----------
    {
      const COLS = 2, RW = 512, RH = 160, c = document.createElement('canvas'); c.width = RW * COLS; c.height = RH * 5; const k = c.getContext('2d');
      const names = [...SHOPS.map(s => s.name), '✨ Phố Phép Thuật ✨'], BG = ['#2c4a3e', '#5a2a3a', '#2a3550', '#3e3a22'];
      names.forEach((t, i) => {
        const x = (i % COLS) * RW, y = Math.floor(i / COLS) * RH;
        k.fillStyle = BG[i % BG.length]; k.fillRect(x + 6, y + 6, RW - 12, RH - 12); k.strokeStyle = '#d4a24a'; k.lineWidth = 8; k.strokeRect(x + 14, y + 14, RW - 28, RH - 28);
        k.fillStyle = '#ffe3a0'; k.font = 'bold 50px Georgia, serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(t, x + RW / 2, y + RH / 2 + 2, RW - 56);
      });
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const pos = [], uv = [], idx = [];
      const quad = (slot, ctr, ax, ay, hwid, hht) => {           // ctr: tâm; ax: trục ngang chữ; ay: trục đứng
        const u0 = (slot % COLS) / COLS, u1 = u0 + 1 / COLS, v1 = 1 - Math.floor(slot / COLS) * RH / c.height, v0 = v1 - RH / c.height, b = pos.length / 3;
        for (const [sx, sy, tu, tv] of [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) { const p = ctr.clone().addScaledVector(ax, sx * hwid).addScaledVector(ay, sy * hht); pos.push(p.x, p.y, p.z); uv.push(tu, tv); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      };
      const Yv = new THREE.Vector3(0, 1, 0), bracket = new THREE.Quaternion();
      SHOPS.forEach((sh, i) => {
        const h = houses.find(x => x.shop === sh);
        if (h && !h.bank) {                                        // biển treo nhô ra lối, 2 mặt
          const n = h.n, X = h.X, sgn = h.side, p = h.front.clone().addScaledVector(X, -sgn * (h.w * S / 2 - 0.9) * 0).addScaledVector(n, -1.25); p.y = h.y0 + S * 1.12;
          const ax = n.clone().negate(); quad(i, p.clone().addScaledVector(X, 0.03), ax, Yv, 1.1, 0.34); quad(i, p.clone().addScaledVector(X, -0.03), ax.clone().negate(), Yv, 1.1, 0.34);
          bracket.setFromUnitVectors(Yv, n.clone().negate());
          put('pillar-wood', new THREE.Matrix4().compose(h.front.clone().setY(h.y0 + S * 1.12 + 0.42), bracket, new THREE.Vector3(1.6, 2.5, 1.6)), new THREE.Color(0.7, 0.6, 0.55));
        } else if (h && h.bank) {                                  // ngân hàng: biển phẳng trên cửa
          const p = h.front.clone().addScaledVector(h.n, -0.12); p.y = h.y0 + S * 1.06; quad(i, p, h.X.clone().negate(), Yv, 2.6, 0.82);
        } else if (sh.stall) {                                     // quầy thảo dược: biển trên sạp giữa
          const p = stalls[1].clone().setY(stalls[1].y + 3.05); quad(i, p, new THREE.Vector3(0, 0, 1), Yv, 1.6, 0.5);
        }
      });
      { const p = W(U0 + 0.5, vc(U0), gyv + S * 1.45 + 0.35); quad(SHOPS.length, p, new THREE.Vector3(1, 0, 0), Yv, 2.4, 0.75); quad(SHOPS.length, p.clone().add(new THREE.Vector3(0, 0, -0.04)), new THREE.Vector3(-1, 0, 0), Yv, 2.4, 0.75); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false, color: 0xdddddd })); m.name = 'alley-signs'; g.add(m);
    }
    // ---------- nạp model + InstancedMesh ----------
    const meshes = [];
    for (const [name, list] of inst) loadModel('alley/' + name).then(src => {
      if (!src || !built || built.g !== g) return;
      src.updateMatrixWorld(true);
      src.traverse(o => {
        if (!o.isMesh) return;
        const im = new THREE.InstancedMesh(o.geometry, o.material, list.length);
        list.forEach((it, i) => { im.setMatrixAt(i, it.m.clone().multiply(o.matrixWorld)); im.setColorAt(i, it.c); });
        im.castShadow = !/^(lantern|banner|chimney-top)/.test(name); im.receiveShadow = true; im.name = 'alley-' + name;
        im.computeBoundingSphere(); g.add(im); meshes.push(im);
      });
    });
    ctx.boxes.push(...boxes);
    built = { g, boxes, houses, lamps, stalls, meshes };
  }

  function unbuild() {
    if (!built) return;
    for (const b of built.boxes) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); }
    for (let i = ctx.colliders.length - 1; i >= 0; i--) if (ctx.colliders[i].alley) ctx.colliders.splice(i, 1);
    ctx.scene.remove(built.g); built.g.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
    built = null;
  }

  const center = () => W((U0 + U1) / 2, vc(-30), Y);
  function update() {
    if (!built) return;
    built.g.visible = ctx.camera.position.distanceTo(center()) < 233;
  }
  return { build, unbuild, update, get built() { return built; } };
}

