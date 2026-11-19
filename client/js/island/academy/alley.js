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
import { loadHero } from '../characters.js';
import { WOODS, CORES } from './magic.js';
import { CAPES, HATS, BROOMS, PETS } from './wear.js';
import { SHOP_TALK } from './alley-shops.js';
import { createBag, FIREWORKS, INSTRUMENTS, GADGETS } from './alley-bag.js';
import { mergeModels } from './alley-merge.js';
import { buildNight } from './alley-night.js';
import { createLife } from './alley-life.js';
import { GATE_RIDDLES } from './alley-shops.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
  { id: 'tea', name: '🍵 Quán Trà Cú Mèo', side: -1, u: -15 },
  { id: 'map', name: '🧭 Bản Đồ & La Bàn', side: -1, u: -59 },
  { id: 'clock', name: '🕰️ Đồng Hồ Thời Gian', side: 1, u: -67 },
  { id: 'fire', name: '🎆 Pháo Hoa Hoá Học', side: 1, u: 7 },
  { id: 'music', name: '🎻 Hiệu Nhạc Cụ Phép', side: 1, u: -27 },
  { id: 'oldbook', name: '📜 Tiệm Sách Cũ', side: 1, u: -53 },
  { id: 'bank', name: '🏦 Ngân Hàng Kho Báu', side: 0, u: U1 - 3 },
];

// biển biểu tượng nhà thường · bảng giá phấn (chữ tiếng Việt, giá tính bằng đồng vàng)
const ICONS = ['🗝️', '🕯️', '✒️', '🧪', '🧵', '🍞', '🔮', '🪶'];
const PRICE = ['Táo đỏ 1🪙 · Cà chua 1🪙\nBí ngô 2🪙 · Dưa hấu 3🪙', 'Hôm nay: Cà rốt tươi!\n3 củ = 1🪙', 'Bình lọ thuỷ tinh\n2🪙 một chiếc', 'Giảm giá cho học sinh\nchăm học ✨'];
const TIME = { value: 0 }, WET = { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, -999, 0)) };
const OWL = new THREE.Color('#8a6a48');
const STARS = '⭐ <b>Bản đồ sao</b>: chòm <b>Bắc Đẩu</b> 7 sao hình cái gáo — kéo dài cạnh gáo ≈ 5 lần tới <b>sao Bắc Cực</b> chỉ hướng Bắc. Mùa hè có “tam giác mùa hè” gồm sao Chức Nữ (chòm Thiên Cầm), Ngưu Lang và Thiên Tân.';
function cageGeo() {                                             // lồng chim nhỏ (không có model CC0): 10 nan + 3 vành + chóp
  const parts = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; parts.push(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 3, 1, true).translate(Math.cos(a) * 0.17, 0.25, Math.sin(a) * 0.17)); }
  for (const y of [0, 0.25, 0.5]) parts.push(new THREE.TorusGeometry(0.17, 0.012, 3, 14).rotateX(Math.PI / 2).translate(0, y, 0));
  parts.push(new THREE.ConeGeometry(0.19, 0.17, 12, 1, true).translate(0, 0.585, 0), new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12).translate(0, 0.01, 0), new THREE.TorusGeometry(0.04, 0.008, 3, 8).translate(0, 0.7, 0));
  const g = mergeGeometries(parts.map(p => (p.index ? p.toNonIndexed() : p))); g.deleteAttribute('uv'); return g;
}
const WALL_TINT = [[1, 1, 1], [1, 0.93, 0.8], [1, 0.86, 0.84], [0.9, 0.97, 0.88], [0.94, 0.92, 1]];
const ROOF_TINT = [[1, 1, 1], [1.28, 0.86, 0.74], [0.82, 1.04, 1.02], [0.72, 0.72, 0.84], [1.1, 1, 0.8]];
const STYLE = {
  plaster: { plain: 'wall', door: 'wall-door', doorR: 'wall-doorway-round', win: ['wall-window-glass', 'wall-window-shutters', 'wall-window-round'], side: ['wall', 'wall-side'] },
  wood: { plain: 'wall-wood', door: 'wall-wood-door', doorR: 'wall-wood-doorway-round', win: ['wall-wood-window-glass', 'wall-wood-window-shutters', 'wall-wood-window-round', 'wall-wood-window-small'], side: ['wall-wood', 'wall-wood-detail-cross'] },
};

export function create(ctx, magic, { toWorld, toLocal, Y }) {
  const W = (u, v, y) => { const [x, z] = toWorld(u, v); return new THREE.Vector3(x, y, z); };
  const gy = (u, v) => { const [x, z] = toWorld(u, v); return heightLocal(u, v, x, z); };
  let built = null, glowWin = null;

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
        if (side > 0 && u - w * S < -80) { u -= 1.2; continue; }                     // lối vào Hẻm Đêm (cuối hẻm, phía đông)
        const shop = SHOPS.find(s => s.side === side && !s.stall && !shopAt.get(s) && Math.abs(s.u - um) < 5);
        if (shop) w = 2;
        const uc = u - w * S / 2, fv = vc(uc) + side * hw(uc);
        const avail = side < 0 ? fv - V_CASTLE : V_WALL - fv, d = Math.min(3, Math.floor((avail + 0.5) / S));
        if (d < 1) { u -= 1.2; continue; }
        const fl = shop ? pick([3, 3, 4]) : pick([2, 3, 3, 4, 4, 5, 3, 4]);
        const h = { u: uc, v: fv, side, w, d, fl, shop, style: rnd() < 0.5 ? 'plaster' : 'wood', top: rnd() < 0.5 ? 'wood' : 'plaster', tint: pick(WALL_TINT), roof: pick(ROOF_TINT), lean: [(rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.085] };
        // chen chúc: tầng trên nhô dần ra lối (nhà gỗ kiểu "jetty"), ban công, cầu thang ngoài, mái chồng
        h.jet = rnd() < 0.55 ? 0.21 + rnd() * 0.13 : 0;
        h.balc = fl > 2 && rnd() < 0.45 ? 1 + Math.floor(rnd() * (fl - 2)) : 0; h.bi = Math.floor(rnd() * w);
        h.stair = !shop && w === 2 && rnd() < 0.34;
        h.cross = w === 2 && rnd() < 0.5; h.box = rnd() < 0.5;
        if (shop) shopAt.set(shop, h);
        houses.push(h); u -= w * S + 0.12;
      }
    }
    // ngân hàng: 4 gian × 2 sâu × 4 tầng, chắn cuối hẻm, mặt tiền quay về nam (+u)
    const bank = SHOPS.find(s => s.id === 'bank');
    const hb = { u: U1 - 0.4, v: vc(U1) - 1.75, side: 0, w: 4, d: 2, fl: 4, shop: bank, style: 'plaster', top: 'plaster', tint: [1, 0.95, 0.86], roof: [0.82, 1.04, 1.02], lean: [0, 0], bank: true, jet: 0, balc: 0, stair: false, cross: false, box: false };
    houses.push(hb); shopAt.set(bank, hb);
    return houses;
  }

  // ---------- dựng ----------
  function build() {
    const g = new THREE.Group(); g.name = 'academy-alley'; ctx.scene.add(g);
    const inst = new Map(), boxes = [];                                   // tên module → [{ m, c }]
    const put = (name, m, c) => { if (!inst.has(name)) inst.set(name, []); inst.get(name).push({ m, c }); };
    const T = new THREE.Matrix4(), R = new THREE.Matrix4(), Sc = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);
    const houses = layout(), glows = [];   // glows: tấm ánh đèn sau lỗ cửa sổ
    // đồ lẻ CC0 (gộp chung texture, xem alley-merge.js): prop(tên, cao chuẩn hoá m, ma trận, màu)
    const prop = (name, fit, m, c) => { if (!inst.has(name)) { inst.set(name, []); inst.get(name).fit = fit; } inst.get(name).push({ m, c }); };
    const aabb = (pts, pad = 0, top = 2) => boxes.push({ x0: Math.min(...pts.map(p => p.x)) + pad, x1: Math.max(...pts.map(p => p.x)) - pad, z0: Math.min(...pts.map(p => p.z)) + pad, z1: Math.max(...pts.map(p => p.z)) - pad, top });
    const FLOW = ['kit/plant_qt_flowers_a', 'kit/plant_qt_flowers_b', 'kit/plant_qt_bush_flowers'];
    const CLUTTER = [['kit/barrel', 0.89], ['kit/crate', 0.55], ['kit/barrels', 0.75], ['kit/prop_log_stack', 0.5], ['kit/prop_crate_bottles', 0.5]];
    const icons = [], boards = [], steams = [];        // biển hiệu biểu tượng (nhà thường) · bảng giá phấn
    function details(h, base, col, rc, rh) {
      if (h.bank) return;
      const L = (x, y, z, a = 0, sx = 1, sy = sx, sz = sx) => base.clone().multiply(T.makeTranslation(x, y, z)).multiply(R.makeRotationY(a)).multiply(Sc.makeScale(sx, sy, sz));
      const cx = i => (i + 0.5 - h.w / 2) * S, wood = new THREE.Color(0.82, 0.72, 0.64);
      // dầm gỗ đỡ tầng nhô ra lối
      if (h.jet) for (let k = 1; k < h.fl; k++) for (let i = 0; i < h.w; i++) put('overhang', L(cx(i), k * S - 0.3 * S, 0.5 * S - h.jet * k, Math.PI / 2, S, S * 0.9, S), wood);
      // ban công: sàn ván + lan can + 2 chậu hoa
      if (h.balc) {
        const k = h.balc, x = cx(h.bi), z0 = -h.jet * k;
        put('planks', L(x, k * S - 0.05, z0 - 0.55, 0, S * 0.92, S, 1.1), wood);
        put('balcony-wall-fence', L(x, k * S, z0 - 1.1 + 0.5 * S * 0.92, Math.PI / 2, S * 0.92, S * 0.34, S * 0.92), wood);
        put('overhang', L(x, k * S - 0.3 * S, 0.5 * S - h.jet * k - 0.9, Math.PI / 2, S * 0.92, S * 0.9, S * 0.92), wood);
        for (const dx of [-0.9, 0.9]) { prop('kit/prop_pot_small', 0.34, L(x + dx, k * S, z0 - 0.8, rnd() * 6)); prop(pick(FLOW), 0.42, L(x + dx, k * S + 0.26, z0 - 0.8, rnd() * 6)); }
      }
      // bậu cửa sổ trồng hoa (giàn hoa) ở các tầng trên
      if (h.box) for (let k = 1; k < h.fl; k++) for (let i = 0; i < h.w; i++) {
        if (h.balc === k && i === h.bi) continue;
        const z = -h.jet * k - 0.2; prop('kit/prop_planter', 0.28, L(cx(i), k * S + 0.17 * S, z, 0, 1.25, 1, 0.55));
        for (const dx of [-0.36, 0.36]) prop(pick(FLOW), 0.42, L(cx(i) + dx, k * S + 0.17 * S + 0.12, z, rnd() * 6));
      }
      // cầu thang đá ngoài nhà lên cửa tầng 2 (ô bên cạnh cửa chính)
      if (h.stair) {
        const x = cx(1 - h.door0), m = L(x, 0, -0.45, h.door0 ? Math.PI : 0, S, S, 1.8);
        put('stairs-stone', m, new THREE.Color(1, 1, 1));
        put('planks', L(x + (h.door0 ? 1 : -1) * 0.55 * S, S - 0.06, -0.5, 0, S * 0.34, S, 1.0), wood);
        aabb([[-0.5, 0], [0.5, 0], [-0.5, -0.95], [0.5, -0.95]].map(([a, b]) => new THREE.Vector3(x + a * S, 0, b).applyMatrix4(base)), 0.05, h.y0 + 1.2);
      }
      // mái chồng: mái đầu hồi thứ 2 vuông góc trên nửa sau nhà
      if (h.cross) put('roof-high-gable', L(0, h.fl * S - 0.1, h.d * S * 0.66 - h.jet * (h.fl - 1), 0, h.w * S * 0.64, rh * 0.82 / 1.15, Math.max(S * 0.8, h.d * S * 0.46)), rc);
      // thùng gỗ, chum, két chai trước cửa nhà thường
      if (!h.shop && rnd() < 0.55) for (let n = 0, N = 1 + Math.floor(rnd() * 3); n < N; n++) {
        const [nm, ft] = pick(CLUTTER), x = (rnd() < 0.5 ? -1 : 1) * (h.w * S / 2 - 0.45 - n * 0.55), m = L(x, 0, -0.42, rnd() * 6);
        prop(nm, ft * (0.85 + rnd() * 0.3), m); const p = new THREE.Vector3().setFromMatrixPosition(m); ctx.colliders.push({ x: p.x, z: p.z, r: 0.3, alley: true });
      }
      // lồng chim treo dưới tầng nhô, trong có chú cú nhỏ
      if (!h.shop && h.fl > 1 && rnd() < 0.18) { const x = cx(h.w - 1) * 0.6, m = L(x, S - 0.86, -h.jet - 0.42, rnd() * 6); put('geo:cage', m); prop('alley/owl', 0.3, m.clone().multiply(T.makeTranslation(0, 0.05, 0)), OWL); }
      // biển hiệu biểu tượng treo nhô ra (nhà thường, 1/3 số nhà)
      if (!h.shop && h.fl > 1 && rnd() < 0.36) icons.push(h);
    }
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
      const cell = (i, k, j, a, name, c = col) => { const m = base.clone().multiply(T.makeTranslation((i + 0.5 - h.w / 2) * S, k * S, (j + 0.5) * S - h.jet * k)).multiply(R.makeRotationY(a)).multiply(Sc.makeScale(S, S, S)); put(name, m, c); if (/window/.test(name)) glows.push(m.clone().multiply(T.makeTranslation(0.466, 0.52, 0))); };
      for (let k = 0; k < h.fl; k++) {
        const st = STYLE[k === 0 ? h.style : h.top];
        const doorAt = h.bank ? Math.floor(h.w / 2) : (h.w > 1 ? Math.floor(rnd() * h.w) : 0); if (k === 0) h.door0 = doorAt;
        for (let i = 0; i < h.w; i++) {
          let f;                                                                     // mặt tiền
          if (k === 0) f = i === doorAt ? (h.bank ? st.doorR : rnd() < 0.3 ? st.doorR : st.door) : (h.shop ? st.win[0] : pick(st.win));
          else f = h.bank ? st.win[2] : (h.stair && k === 1 && i === 1 - h.door0) ? st.door : pick(st.win);
          cell(i, k, 0, Math.PI / 2, f);
          if (h.side !== -1 || h.bank) cell(i, k, h.d - 1, -Math.PI / 2, st.plain);     // mặt sau (tây: áp lâu đài, bỏ)
        }
        for (let j = 0; j < h.d; j++) { cell(0, k, j, Math.PI, pick(st.side)); cell(h.w - 1, k, j, 0, pick(st.side)); }
      }
      // mái đầu hồi quay ra lối: 1 module roof-high-gable kéo giãn phủ cả nhà
      const rh = S * (0.85 + 0.3 * h.w);
      put('roof-high-gable', base.clone().multiply(T.makeTranslation(0, h.fl * S, h.d * S / 2 - h.jet * (h.fl - 1))).multiply(R.makeRotationY(Math.PI / 2)).multiply(Sc.makeScale(h.d * S, rh / 1.15, h.w * S)), rc);
      if (h.w > 1 && rnd() < 0.6) put('roof-high-window', base.clone().multiply(T.makeTranslation(0, h.fl * S + 0.15 * S, S * 0.55 - h.jet * (h.fl - 1))).multiply(R.makeRotationY(Math.PI / 2)).multiply(Sc.makeScale(S * 0.7, S * 0.7, S * 0.7)), rc);
      if (!h.bank && rnd() < 0.7) {                                              // ống khói
        const cx = (rnd() < 0.5 ? -1 : 1) * (h.w * S / 2 - 0.9), cz = h.d * S * (0.45 + rnd() * 0.3) - h.jet * (h.fl - 1);
        put('chimney', base.clone().multiply(T.makeTranslation(cx - 0.3 * S, h.fl * S - 0.2, cz)).multiply(Sc.makeScale(S, rh * 0.75, S)), col);
        put('chimney-top', base.clone().multiply(T.makeTranslation(cx - 0.3 * S, h.fl * S - 0.2 + rh * 0.75, cz)).multiply(Sc.makeScale(S, S, S)), col);
        h.smoke = new THREE.Vector3(cx - 0.3 * S + 0.34 * S, h.fl * S + rh * 0.75 + 0.6 * S, cz).applyMatrix4(base)
      }
      if (h.fl > 2 && !h.bank && rnd() < 0.4) put(rnd() < 0.5 ? 'banner-red' : 'banner-green', base.clone().multiply(T.makeTranslation((h.w / 2 - 0.5) * S * (rnd() < 0.5 ? -1 : 1), S * (1.2 + rnd() * 0.3), -0.02)).multiply(R.makeRotationY(Math.PI / 2)).multiply(Sc.makeScale(S * 0.8, S * 0.8, S * 0.8)), col);
      details(h, base, col, rc, rh);
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
      // sạp đầy hàng: két rau quả, táo, bí ngô, dưa hấu, bình lọ trên mặt sạp (cao ≈ 0,89 m)
      const S0 = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, -Math.PI / 2), new THREE.Vector3(1, 1, 1));
      const on = (x, z, a = 0) => S0.clone().multiply(T.makeTranslation(x, 0.9, z)).multiply(R.makeRotationY(a));
      const GOODS = [['kit/prop_crate_tomatoes', 0.3], ['kit/prop_crate_carrots', 0.3], ['kit/apple', 0.16], ['kit/pumpkin', 0.3], ['kit/watermelon', 0.3], ['kit/prop_pot_small', 0.3], ['kit/prop_crate_bottles', 0.36]];
      for (let a = -0.85; a <= 0.86; a += 0.42) for (const b of [-0.2, 0.22]) { const [nm, ft] = pick(GOODS); prop(nm, ft, on(b, a, rnd() * 6)); if (nm === 'kit/apple') for (let n = 0; n < 4; n++) prop(nm, ft, on(b + (rnd() - 0.5) * 0.25, a + (rnd() - 0.5) * 0.25, rnd() * 6)); }
      prop('kit/barrel', 0.8, S0.clone().multiply(T.makeTranslation(0.55, 0, 1.45)));
      prop('kit/prop_crate_carrots', 0.32, S0.clone().multiply(T.makeTranslation(-0.95, 0, -0.9)));
      boards.push({ m: S0.clone().multiply(T.makeTranslation(-1.05, 0, 0.9)).multiply(R.makeRotationY(-0.35)), txt: pick(PRICE) });
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
    // ---------- mặt tiền riêng từng tiệm: bàn trà, nhạc cụ, két pháo, sách, bảng phấn ----------
    const clockAt = [];
    for (const h of houses) {
      if (!h.shop || h.bank) continue;
      const F = (x, z, a = 0) => { const p = h.front.clone().addScaledVector(h.X, x).addScaledVector(h.n, -z); const [u, v] = toLocal(p.x, p.z); p.y = gy(u, v); return new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(-h.n.x, -h.n.z) + a), new THREE.Vector3(1, 1, 1)); };
      const col = (m, r = 0.3) => { const p = new THREE.Vector3().setFromMatrixPosition(m); ctx.colliders.push({ x: p.x, z: p.z, r, alley: true }); };
      const id = h.shop.id, sx = -h.side;               // sx: phía cửa (tránh chỗ chủ tiệm đứng)
      if (id === 'tea') for (const [x, z] of [[-2.2, 2.3], [1.4, 2.9]]) {
        const m = F(x, z); prop('kit/furn_table_round_set', 0.95, m); col(m, 0.75);
        prop('kit/prop_pot_small', 0.2, m.clone().multiply(T.makeTranslation(0, 0.78, 0)));
        steams.push(new THREE.Vector3(0, 0.95, 0).applyMatrix4(m));
      }
      if (id === 'music') [['kit/music_drums', 0.8, -1.9, 0.9], ['kit/music_guitar', 0.95, 1.7, 0.55], ['kit/music_trumpet', 0.3, 1.9, 1.2]].forEach(([nm, f, x, z]) => { const m = F(x, z, 0.4); prop(nm, f, m); col(m, 0.4); });
      if (id === 'fire') for (const [x, z] of [[-1.8, 0.6], [-1.3, 0.75], [1.9, 0.6]]) { const m = F(x, z, x); prop('kit/crate', 0.5, m); col(m); prop('kit/prop_crate_bottles', 0.32, m.clone().multiply(T.makeTranslation(0, 0.5, 0))); }
      if (id === 'oldbook' || id === 'book') for (const [x, z] of [[-1.9, 0.5], [1.9, 0.5]]) { const m = F(x, z); prop('kit/furn_bookshelf_small', 1.2, m); col(m); }
      if (id === 'map') { boards.push({ m: F(1.9, 0.7, 0.3), txt: 'Hôm nay học:\nĐông · Tây · Nam · Bắc' }); const m = F(-1.9, 0.6); prop('kit/prop_crate_bottles', 0.5, m); col(m); }
      if (id === 'clock') { boards.push({ m: F(1.9, 0.7, 0.3), txt: '1 giờ = 60 phút\n1 phút = 60 giây' }); clockAt.push(h); }
      if (id === 'sweet') boards.push({ m: F(1.9, 0.7, 0.3), txt: 'Kẹo Nổ 3🪙 · Bánh Mây 5🪙\nSô-cô-la Ếch 8🪙' });
    }
    // cột đèn khí (kit CC0) xen giữa các cột đèn lồng, phía đối diện
    for (let u = U0 - 10.5, k = 0; u > U1 + 4; u -= 13, k++) {
      if (Math.abs(u - PLAZA) < 6) continue;
      const s = k % 2 ? -1 : 1, v = vc(u) + s * (hw(u) - 0.3), p = W(u, v, gy(u, v));
      prop('kit/prop_lamppost', 3.4, new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, s > 0 ? Math.PI / 2 : -Math.PI / 2), new THREE.Vector3(1, 1, 1)));
      lamps.push(p.clone().setY(p.y + 3.15)); ctx.colliders.push({ x: p.x, z: p.z, r: 0.2, alley: true });
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
      // đá ẩm ban đêm: vệt phản chiếu đèn kéo dài về phía camera (như phố mưa), mặt đá sẫm lại — 8 đèn gần nhất (CPU chọn mỗi khung)
      m.material.onBeforeCompile = sh => {
        sh.uniforms.uNight = NIGHT; sh.uniforms.uLamp = WET;
        sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = 'uniform float uNight; uniform vec3 uLamp[8]; varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          if (uNight > 0.01) {
            float lum = dot(diffuseColor.rgb, vec3(0.333)), shine = smoothstep(0.18, 0.55, lum);
            diffuseColor.rgb *= 1.0 - 0.22 * uNight;
            vec2 V = normalize(vWp.xz - cameraPosition.xz + 1e-4), Pn = vec2(-V.y, V.x); float r = 0.0;
            for (int i = 0; i < 8; i++) { vec2 d = vWp.xz - uLamp[i].xz + V * 1.4; float a = dot(d, V), b = dot(d, Pn); r += exp(-b * b * 2.4 - a * a * 0.09) * (0.6 + 0.4 * sin(a * 6.0 + b * 3.0)); }
            totalEmissiveRadiance += vec3(1.0, 0.62, 0.3) * r * (0.35 + shine) * uNight * 1.35;
          }`);
      };
      m.material.customProgramCacheKey = () => 'alley-wet';
    }
    // ---------- biển hiệu: 1 canvas atlas cho cả phố → 1 draw call; biển treo vuông góc mặt tiền, đung đưa theo gió (shader) ----------
    {
      const names = [...SHOPS.map(s => s.name), '✨ Phố Phép Thuật ✨'], N0 = names.length, NI = ICONS.length;
      const slots = [...names, ...ICONS, ...boards.map(b => b.txt)];
      const COLS = 4, RW = 384, RH = 120, c = document.createElement('canvas'); c.width = RW * COLS; c.height = RH * Math.ceil(slots.length / COLS); const k = c.getContext('2d');
      const BG = ['#2c4a3e', '#5a2a3a', '#2a3550', '#3e3a22'];
      k.textAlign = 'center'; k.textBaseline = 'middle';
      slots.forEach((t, i) => {
        const x = (i % COLS) * RW, y = Math.floor(i / COLS) * RH;
        if (i < N0 + NI) {
          k.fillStyle = BG[i % BG.length]; k.fillRect(x + 4, y + 4, RW - 8, RH - 8); k.strokeStyle = '#d4a24a'; k.lineWidth = 6; k.strokeRect(x + 11, y + 11, RW - 22, RH - 22);
          k.fillStyle = '#ffe3a0'; k.font = i < N0 ? 'bold 37px Georgia, serif' : '64px serif'; k.fillText(t, x + RW / 2, y + RH / 2 + 2, RW - 40);
        } else {                                                   // bảng phấn: nền lục đậm, chữ phấn trắng 2 dòng
          k.fillStyle = '#6b4a2e'; k.fillRect(x + 2, y + 2, RW - 4, RH - 4); k.fillStyle = '#23392e'; k.fillRect(x + 12, y + 10, RW - 24, RH - 20);
          k.fillStyle = '#f2efe4'; k.font = 'italic 27px "Comic Sans MS", "Chalkboard SE", cursive'; t.split('\n').forEach((ln, j, A) => k.fillText(ln, x + RW / 2, y + RH / 2 + (j - (A.length - 1) / 2) * 32, RW - 36));
        }
      });
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const pos = [], uv = [], piv = [], axs = [], idx = [];
      const quad = (slot, ctr, ax, ay, hwid, hht, swing = 0, sax = ax, ph = (ctr.x * 1.7 + ctr.z) % 6.28) => {   // ctr: tâm; ax: trục ngang chữ; ay: trục đứng; swing: biên độ đung đưa (rad)
        const u0 = (slot % COLS) / COLS, u1 = u0 + 1 / COLS, v1 = 1 - Math.floor(slot / COLS) * RH / c.height, v0 = v1 - RH / c.height, b = pos.length / 3;
        const top = ctr.clone().addScaledVector(ay, hht + 0.1);
        for (const [sx, sy, tu, tv] of [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) { const p = ctr.clone().addScaledVector(ax, sx * hwid).addScaledVector(ay, sy * hht); pos.push(p.x, p.y, p.z); uv.push(tu, tv); piv.push(top.x, top.y, top.z, ph); axs.push(sax.x * swing, sax.y * swing, sax.z * swing); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      };
      const Yv = new THREE.Vector3(0, 1, 0), bracket = new THREE.Quaternion(), wood = new THREE.Color(0.7, 0.6, 0.55);
      const hang = (h, slot, hwid, hht, y, off) => {               // biển treo nhô ra lối, 2 mặt + cần gỗ
        const n = h.n, X = h.X, p = h.front.clone().addScaledVector(n, -off); p.y = h.y0 + y;
        const ax = n.clone().negate(), ph = (p.x * 1.7 + p.z) % 6.28; quad(slot, p.clone().addScaledVector(X, 0.03), ax, Yv, hwid, hht, 0.11, ax, ph); quad(slot, p.clone().addScaledVector(X, -0.03), ax.clone().negate(), Yv, hwid, hht, 0.11, ax, ph);
        bracket.setFromUnitVectors(Yv, n.clone().negate());
        put('pillar-wood', new THREE.Matrix4().compose(h.front.clone().setY(p.y + hht + 0.1), bracket, new THREE.Vector3(hwid > 0.8 ? 0.9 : 0.6, (off + hwid) * 1.06, hwid > 0.8 ? 0.9 : 0.6)), wood);
      };
      SHOPS.forEach((sh, i) => {
        const h = houses.find(x => x.shop === sh);
        if (h && !h.bank) hang(h, i, 0.98, 0.31, S * 1.12, 0.93);   // nhô ≤ 1,9 m: biển hai bên lối không chạm nhau
        else if (h && h.bank) { const p = h.front.clone().addScaledVector(h.n, -0.12); p.y = h.y0 + S * 1.06; quad(i, p, h.X.clone().negate(), Yv, 2.6, 0.82); }
        else if (sh.stall) { const p = stalls[1].clone().setY(stalls[1].y + 3.05); quad(i, p, new THREE.Vector3(0, 0, 1), Yv, 1.6, 0.5); }
      });
      icons.forEach((h, j) => hang(h, N0 + (j % NI), 0.5, 0.17, S * (1.05 + (j % 3) * 0.06), 0.72));
      boards.forEach((b, j) => {                                   // bảng giá phấn: khung gỗ + mặt chữ
        prop('kit/school_chalkboard', 1.05, b.m.clone().multiply(R.makeRotationX(-0.16)));
        const p = new THREE.Vector3(0, 0.62, -0.09).applyMatrix4(b.m), ax = new THREE.Vector3(-1, 0, 0).transformDirection(b.m), ay = new THREE.Vector3(0, Math.cos(0.16), Math.sin(0.16)).transformDirection(b.m);
        quad(N0 + NI + j, p, ax, ay, 0.5, 0.17);
      });
      { const p = W(U0 + 0.5, vc(U0), gyv + S * 1.45 + 0.35); quad(SHOPS.length, p, new THREE.Vector3(1, 0, 0), Yv, 2.4, 0.75); quad(SHOPS.length, p.clone().add(new THREE.Vector3(0, 0, -0.04)), new THREE.Vector3(-1, 0, 0), Yv, 2.4, 0.75); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setAttribute('piv', new THREE.Float32BufferAttribute(piv, 4)); geo.setAttribute('sax', new THREE.Float32BufferAttribute(axs, 3)); geo.setIndex(idx); geo.computeBoundingSphere();
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false, color: 0xdddddd });
      mat.onBeforeCompile = sh => {                                // xoay quanh cần treo: góc = |sax| · sin(t + pha) (Rodrigues)
        sh.uniforms.uT = TIME;
        sh.vertexShader = 'uniform float uT; attribute vec4 piv; attribute vec3 sax;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          { float A = length(sax); if (A > 0.0) { vec3 k = sax / A; float a = A * sin(uT * 1.3 + piv.w) + A * 0.4 * sin(uT * 2.9 + piv.w * 2.0); vec3 r = transformed - piv.xyz;
            transformed = piv.xyz + r * cos(a) + cross(k, r) * sin(a) + k * dot(k, r) * (1.0 - cos(a)); } }`);
      };
      const m = new THREE.Mesh(geo, mat); m.name = 'alley-signs'; g.add(m);
    }
    // ---------- đồng hồ lớn trước Tiệm Đồng Hồ: mặt số vẽ canvas, kim theo GIỜ TRONG GAME (học xem giờ) ----------
    let clock = null;
    if (clockAt[0]) {
      const h = clockAt[0], c = document.createElement('canvas'); c.width = c.height = 256; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.72, 34), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      const p = h.front.clone().addScaledVector(h.n, -0.12 + h.jet); p.y = h.y0 + S * 1.62; mesh.position.copy(p); mesh.lookAt(p.clone().sub(h.n)); mesh.name = 'alley-clock'; g.add(mesh);
      let last = -1;
      clock = hour => {
        const m = Math.floor(hour * 60) % 720; if (m === last) return; last = m; const k = c.getContext('2d');
        k.fillStyle = '#f3e8cc'; k.beginPath(); k.arc(128, 128, 124, 0, 7); k.fill(); k.lineWidth = 10; k.strokeStyle = '#6b4a2e'; k.stroke();
        k.fillStyle = '#3a2a1a'; k.font = 'bold 30px Georgia'; k.textAlign = 'center'; k.textBaseline = 'middle';
        for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; k.fillText(i, 128 + Math.sin(a) * 95, 128 - Math.cos(a) * 95); }
        for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r0 = i % 5 ? 113 : 106; k.lineWidth = i % 5 ? 2 : 4; k.beginPath(); k.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0); k.lineTo(128 + Math.sin(a) * 119, 128 - Math.cos(a) * 119); k.stroke(); }
        const hand = (a, len, w, col) => { k.strokeStyle = col; k.lineWidth = w; k.lineCap = 'round'; k.beginPath(); k.moveTo(128, 128); k.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len); k.stroke(); };
        hand(m / 720 * Math.PI * 2, 58, 11, '#2a1d16'); hand((m % 60) / 60 * Math.PI * 2, 88, 6, '#8e2433'); k.fillStyle = '#d4a24a'; k.beginPath(); k.arc(128, 128, 9, 0, 7); k.fill();
        tex.needsUpdate = true;
      };
    }
    // ---------- ánh đèn trong nhà: 1 tấm phẳng sau mỗi lỗ cửa sổ (1 draw call) — ngày: nội thất tối, đêm: vàng ấm ----------
    {
      const geo = new THREE.PlaneGeometry(0.62, 0.62).rotateY(Math.PI / 2), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0x2a1d16, toneMapped: false }), glows.length);
      glows.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color().setHSL(0.08 + Math.random() * 0.04, 0.9, 0.45 + Math.random() * 0.2)); });
      im.computeBoundingSphere(); im.name = 'alley-window-light'; g.add(im); glowWin = im;
    }
    // ---------- cờ dây ngang lối: model banner Kenney thu nhỏ treo dọc dây võng (mỗi 21 m một dây) ----------
    for (let u = U0 - 9, n = 0; u > U1 + 6; u -= 10.5, n++) {
      if (Math.abs(u - PLAZA) < 4) continue;
      const a = W(u, vc(u) - hw(u) - 0.4, gy(u, vc(u)) + S * (n % 2 ? 2.7 : 2.15)), b = W(u + 1.5, vc(u + 1.5) + hw(u + 1.5) + 0.4, gy(u, vc(u)) + S * (n % 2 ? 2.7 : 2.15)), N = 8;
      for (let i = 1; i < N; i++) {
        const t = i / N, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * 0.55;
        const q = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2);
        put(i % 2 ? 'banner-red' : 'banner-green', new THREE.Matrix4().compose(p.clone().setY(p.y - 0.62), q, new THREE.Vector3(0.75, 0.75, 0.75)).multiply(T.makeTranslation(-0.42, 0, 0)), new THREE.Color().setHSL(((n * 0.382 + i * 0.13) % 1), 0.5, n % 2 ? 0.62 : 0.5));
      }
      if (n % 2) { const p = a.clone().lerp(b, 0.5); p.y -= 0.55 + 0.62; prop('kit/prop_lantern_hanging', 0.55, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)); lamps.push(p.clone().setY(p.y + 0.2)); }   // đèn lồng treo giữa dây cờ
      put('pillar-wood', new THREE.Matrix4().compose(a.clone().lerp(b, 0.5).setY(a.y + 0.02), new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize()), new THREE.Vector3(0.25, a.distanceTo(b), 0.25)).multiply(T.makeTranslation(0, -0.5, 0)), new THREE.Color(0.5, 0.42, 0.35));
    }
    // ---------- Hẻm Đêm (ngõ nhánh sau ngân hàng) ----------
    const night = buildNight({ ctx, magic, put, prop, boxes, W, gy, g, S, T, R }); lamps.push(...night.lights);
    // ---------- nạp model: đèn lồng → InstancedMesh (kính phát sáng đêm); mọi thứ khác gộp theo texture → vài draw call ----------
    const meshes = [], merged = new Map(), GEO = { 'geo:cage': cageGeo };
    for (const [name, list] of inst) {
      if (name === 'lantern') loadModel('alley/lantern').then(src => {
        if (!src || !built || built.g !== g) return;
        src.updateMatrixWorld(true);
        src.traverse(o => {
          if (!o.isMesh) return;
          const mtl = o.material.clone(); glowMat(mtl, true, o.matrixWorld.clone());
          const im = new THREE.InstancedMesh(o.geometry, mtl, list.length);
          list.forEach((it, i) => { im.setMatrixAt(i, it.m.clone().multiply(o.matrixWorld)); im.setColorAt(i, it.c); });
          im.receiveShadow = true; im.name = 'alley-lantern'; im.computeBoundingSphere(); g.add(im); meshes.push(im);
        });
      });
      else if (GEO[name]) merged.set(name, { geo: GEO[name](), items: list, col: '#3b3431' });
      else merged.set(name.includes('/') ? name : 'alley/' + name, list);
    }
    mergeModels(merged, g, { shadow: n => /^alley\/(wall|roof|chimney$|stairs|balcony|overhang)/.test(n), flatMat: () => toon('#ffffff', { unique: true }) })
      .then(ms => { for (const m of ms) if (m.material.map) { m.material.emissiveMap = m.material.map; m.material.emissive.setRGB(0.2, 0.17, 0.15); }   // ánh sáng dội trong hẻm hẹp: mặt khuất bóng vẫn thấy màu gỗ/vữa
      if (built && built.g === g) meshes.push(...ms); else ms.forEach(m => m.geometry.dispose()); }).catch(e => console.error('alley merge', e));
    // ---------- hạt sáng, khói, quầng đèn ----------
    steams.push(stalls[1].clone().setY(stalls[1].y + 1.05));
    const fx = makeFx(houses.filter(h => h.smoke).map(h => h.smoke), lamps, W, gy, steams);
    g.add(fx.group);
    ctx.boxes.push(...boxes);
    // ---------- chủ tiệm (NPC): đứng trước cửa, quay ra lối ----------
    const keepers = [];
    SHOPS.forEach(sh => {
      const h = houses.find(x => x.shop === sh), T = SHOP_TALK[sh.id];
      let p, face;
      if (h) { p = h.front.clone().addScaledVector(h.n, h.bank ? -1.6 : -0.95); face = Math.atan2(-h.n.x, -h.n.z); if (!h.bank) p.addScaledVector(h.X, h.side * 0.9); }
      else { p = stalls[1].clone().add(new THREE.Vector3(0.95, 0, 0)); face = -Math.PI / 2; }
      const [u, v] = toLocal(p.x, p.z); p.y = gy(u, v);
      const k = { sh, p, face, hero: null, line: 0 }; keepers.push(k);
      loadHero(T.kind, T.h || 1.66, T.look).then(hero => {
        if (!hero || !built || built.g !== g) return;
        hero.npc = true; hero.model.position.copy(p); hero.model.rotation.y = face; g.add(hero.model); hero.anim.play(hero.set.idle, 0); k.hero = hero;
      });
      ctx.colliders.push({ x: p.x, z: p.z, r: 0.35, alley: true });
    });
    { const p = night.keeperAt, k = { sh: { id: 'night', name: '🌙 Hẻm Đêm · Cô Đom Đóm' }, p, face: night.keeperFace, hero: null, line: 0 }; keepers.push(k);
      loadHero(SHOP_TALK.night.kind, 1.66, SHOP_TALK.night.look).then(hero => { if (!hero || !built || built.g !== g) return; hero.npc = true; hero.model.position.copy(p); hero.model.rotation.y = k.face; g.add(hero.model); hero.anim.play(hero.set.idle, 0); k.hero = hero; });
      ctx.colliders.push({ x: p.x, z: p.z, r: 0.35, alley: true }); }
    const life = createLife(ctx, { W, gy, vc, hw, U0, U1, PLAZA, keepers }); g.add(life.g);
    built = { g, boxes, houses, lamps, stalls, meshes, keepers, fx, night, life, clock };
  }

  function unbuild() {
    if (!built) return;
    for (const b of built.boxes) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); }
    for (let i = ctx.colliders.length - 1; i >= 0; i--) if (ctx.colliders[i].alley) ctx.colliders.splice(i, 1);
    shop.close();
    ctx.scene.remove(built.g); built.g.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.isMesh && /merged/.test(o.name)) o.geometry.dispose(); });
    built = null;
  }

  const center = () => W((U0 + U1) / 2, vc(-30), Y);
  const shop = createShop(ctx, magic), bag = (ctx.bag = createBag(ctx, magic));
  function update(dt) {
    bag.update(dt);
    if (!built) return;
    const vis = ctx.camera.position.distanceTo(center()) < 233; built.g.visible = vis; if (!vis) return;
    NIGHT.value = ctx.sky && ctx.sky.state ? Math.min(1, ctx.sky.state.night * 1.4) : 0;
    built.fx.update(dt, NIGHT.value); TIME.value += dt;
    if (NIGHT.value > 0.01) { const cp = ctx.camera.position, L = built.lamps.map(p => [p.distanceToSquared(cp), p]).sort((a, b) => a[0] - b[0]); for (let i = 0; i < 8; i++) WET.value[i].copy(L[i] ? L[i][1] : WET.value[i].set(0, -999, 0)); }
    if (glowWin) glowWin.material.color.setRGB(0.16 + NIGHT.value * 0.84, 0.11 + NIGHT.value * 0.69, 0.08 + NIGHT.value * 0.37);
    const pp = ctx.player.pos;
    built.night.update(dt, pp);
    if (shop.isOpen && shop.cur && Math.hypot(pp.x - shop.cur.p.x, pp.z - shop.cur.p.z) > 6.5) shop.close();   // đi xa thì cất bảng hàng
    if (built.clock && ctx.sky && ctx.sky.state) built.clock(ctx.sky.state.hour);
    { const [u, v] = toLocal(pp.x, pp.z); built.life.update(dt, pp, u < U0 + 21 && u > U1 - 34 && Math.abs(v - vc(u)) < 21); }
    for (const k of built.keepers) {
      if (!k.hero) continue;
      const d = Math.hypot(pp.x - k.p.x, pp.z - k.p.z);
      const near = d < 21; if (k.hero.model.visible !== near) k.hero.model.visible = near;   // LOD: chủ tiệm chỉ hiện khi lại gần
      if (!near) continue;
      k.hero.anim.update(dt);
      const want = d < 5 ? Math.atan2(pp.x - k.p.x, pp.z - k.p.z) : k.face, r = k.hero.model.rotation;
      r.y += (((want - r.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 4);
      if (d < 3.4 && !ctx.player.vehicle && Math.abs(pp.y - k.p.y) < 2) ctx.offer(`🛍️ ${k.sh.name}`, () => shop.open(k), 8);
    }
  }
  return (ctx.alley = { build, unbuild, update, shop, get built() { return built; } });
}

// ---------- HIỆU ỨNG: hạt sáng lơ lửng (89), khói ống khói (13/ống), quầng đèn lồng — Points, 3 draw call ----------
function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), gr = k.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = gr; k.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function makeFx(smokes, lamps, W, gy, steams) {
  const group = new THREE.Group(), tex = dotTex();
  const pts = (n, mat) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const p = new THREE.Points(geo, mat); p.frustumCulled = false; group.add(p); return p; };
  // hạt sáng: vàng-lam, trôi chậm theo xoắn ốc trên lối
  const NS = 89, sp = pts(NS, new THREE.PointsMaterial({ map: tex, size: 0.34, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe3a0, opacity: 0.5 }));
  const seeds = Array.from({ length: NS }, (_, i) => ({ u: U0 - (i / NS) * (U0 - U1), r: Math.random() * 6.28, h: 1.2 + Math.random() * 5.5, w: 0.3 + Math.random() * 0.6 }));
  // khói: mỗi ống 13 cụm bay lên, loang dần
  const NK = 13, sm = pts(Math.max(1, smokes.length * NK), new THREE.PointsMaterial({ map: tex, size: 1.6, transparent: true, depthWrite: false, color: 0xcfc8c0, opacity: 0.2 }));
  // quầng đèn lồng: ban đêm mới hiện
  const lg = pts(Math.max(1, lamps.length), new THREE.PointsMaterial({ map: tex, size: 3.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffc070, opacity: 0 }));
  lamps.forEach((p, i) => lg.geometry.attributes.position.setXYZ(i, p.x, p.y + 0.15, p.z));
  // hơi nước: ấm trà, nồi thuốc — cụm trắng bay lên nhanh, tan sớm
  const NV = 8, sv = pts(Math.max(1, steams.length * NV), new THREE.PointsMaterial({ map: tex, size: 0.55, transparent: true, depthWrite: false, color: 0xffffff, opacity: 0.32 }));
  // lá bay: 34 chiếc vàng cam rơi chậm, đảo theo gió dọc hẻm
  const NL = 34, lv = pts(NL, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.9 }));
  { const c = new Float32Array(NL * 3), col = new THREE.Color(); for (let i = 0; i < NL; i++) { col.setHSL(0.05 + Math.random() * 0.08, 0.75, 0.42 + Math.random() * 0.15); c.set([col.r, col.g, col.b], i * 3); } lv.geometry.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  const leaves = Array.from({ length: NL }, (_, i) => ({ u: U0 - Math.random() * (U0 - U1), f: Math.random(), r: Math.random() * 6.28, sp: 0.06 + Math.random() * 0.05 }));
  // đom đóm ban đêm: bay chập chờn sát mái hiên & bậu hoa, nhấp nháy (chỉ hiện khi tối)
  const NFF = 34, fv = pts(NFF, new THREE.PointsMaterial({ map: tex, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xd8ff6a, opacity: 0 }));
  const flies = Array.from({ length: NFF }, () => ({ u: U0 - Math.random() * (U0 - U1), s: Math.random() < 0.5 ? -1 : 1, h: 0.6 + Math.random() * 4, r: Math.random() * 6.28 }));
  let t = 0;
  function update(dt, night) {
    t += dt;
    fv.visible = night > 0.05;
    if (fv.visible) { const a = fv.geometry.attributes.position; flies.forEach((f, i) => { const u = f.u + Math.sin(t * 0.21 + f.r) * 3, v = vc(u) + f.s * hw(u) * (0.55 + 0.35 * Math.sin(t * 0.4 + f.r * 2)), p = W(u, v, gy(u, vc(u)) + f.h + Math.sin(t * 1.1 + f.r * 3) * 0.35); a.setXYZ(i, p.x, p.y, p.z); }); a.needsUpdate = true; fv.material.opacity = night * (0.6 + 0.4 * Math.sin(t * 2.7)); }
    { const a = sv.geometry.attributes.position; steams.forEach((p, j) => { for (let k = 0; k < NV; k++) { const f = (t * 0.45 + k / NV) % 1; a.setXYZ(j * NV + k, p.x + Math.sin(f * 7 + k) * 0.12 * f, p.y + f * 1.6, p.z + Math.cos(f * 5 + k) * 0.12 * f); } }); a.needsUpdate = true; }
    { const a = lv.geometry.attributes.position; leaves.forEach((l, i) => { l.f += dt * l.sp; if (l.f > 1) { l.f = 0; l.u = U0 - Math.random() * (U0 - U1); } const u = l.u - l.f * 4 + Math.sin(t * 0.7 + l.r) * 0.6, v = vc(u) + Math.sin(t * 1.3 + l.r * 2) * hw(u) * 0.9, p = W(u, v, gy(u, vc(u)) + 11 * (1 - l.f) + Math.sin(t * 3 + l.r) * 0.15); a.setXYZ(i, p.x, p.y, p.z); }); a.needsUpdate = true; }
    const a = sp.geometry.attributes.position;
    seeds.forEach((s, i) => { const u = s.u + Math.sin(t * 0.13 + i) * 2, v = vc(u) + Math.sin(t * s.w + s.r) * hw(u) * 0.8, y = gy(u, vc(u)) + s.h + Math.sin(t * 0.7 + s.r * 3) * 0.5, p = W(u, v, y); a.setXYZ(i, p.x, p.y, p.z); });
    a.needsUpdate = true; sp.material.opacity = 0.35 + night * 0.55; sp.material.size = 0.26 + night * 0.12;
    const b = sm.geometry.attributes.position;
    smokes.forEach((p, j) => { for (let k = 0; k < NK; k++) { const f = ((t * 0.18 + k / NK) % 1); b.setXYZ(j * NK + k, p.x + Math.sin(f * 5 + j) * 0.5 * f + f * 1.6, p.y + f * 5.5, p.z + Math.cos(f * 4 + j) * 0.4 * f); } });
    b.needsUpdate = true; sm.material.opacity = 0.2 * (1 - night * 0.6);
    lg.material.opacity = night;
  }
  return { group, update };
}

// ---------- ÁNH SÁNG ĐÊM: 1 uniform dùng chung cho mọi vật liệu phát sáng của phố ----------
const NIGHT = { value: 0 };
function glowMat(m, lamp, deq) {   // deq: ma trận giải lượng tử meshopt (vị trí gốc → toạ độ module)
  // Cửa sổ/cửa: ô kính lõm sau mặt tường (toạ độ module x ∈ (0,41; 0,49), mặt quay +x, giữa ô) → ánh đèn vàng ấm khi tối.
  // Đèn lồng: chụp kính tím nhạt trong bảng màu Kenney → sáng hẳn.
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = NIGHT; sh.uniforms.uDeq = { value: deq };
    sh.vertexShader = 'uniform mat4 uDeq; varying vec3 vLp; varying vec3 vLn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLp = (uDeq * vec4(position, 1.0)).xyz; vLn = normalize(mat3(uDeq) * normal);');
    sh.fragmentShader = 'uniform float uNight; varying vec3 vLp; varying vec3 vLn;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { vec3 c = diffuseColor.rgb;
        float g = ${lamp ? 'step(0.45, c.b) * step(c.r + 0.15, c.b) * step(1.18, vLp.y) * 2.4' : 'step(0.5, vLn.x) * step(0.38, vLp.x) * step(vLp.x, 0.468) * step(0.1, vLp.y) * step(vLp.y, 0.86) * step(abs(vLp.z), 0.3) * 1.3'};
        float k = uNight * g;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.74, 0.4), min(1.0, k));
        totalEmissiveRadiance += vec3(1.0, 0.6, 0.26) * k; }`);
  };
  m.customProgramCacheKey = () => 'alley-glow' + (lamp ? 'L' : 'W');
}

// ---------- CỬA HÀNG: thẻ hàng hoá, mỗi lần mua trả lời 1 câu đố học tập; trả bằng đồng vàng tài khoản (ctx.account) ----------
const CSS = `#alShop{position:fixed;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 76px);transform:translateX(-50%);z-index:27;width:min(92vw,420px);max-height:min(62vh,520px);overflow:auto;background:#141022f2;color:#f7ecd0;border:1px solid #ffe3a066;border-radius:16px;padding:13px 14px;font:600 14px/1.45 system-ui;box-shadow:0 8px 34px #0007}
#alShop h4{margin:0 0 4px;font:800 16px Georgia,serif;color:#ffe3a0}#alShop .say{font-style:italic;color:#e8dcc0;margin:0 0 8px}#alShop .coin{float:right;font:800 13px system-ui;color:#ffd34d}
#alShop .it{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff14}#alShop .it i{width:21px;height:21px;border-radius:50%;flex:none;border:1px solid #fff6}#alShop .it span{flex:1}
#alShop button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:10px;padding:7px 10px;font:700 13px system-ui;min-height:34px}#alShop button.buy{background:#5a4a2a;border-color:#ffe3a0aa}#alShop button.on{background:#2c6455}
#alShop .ft{display:flex;justify-content:space-between;gap:8px;margin-top:8px}`;

function createShop(ctx, magic) {
  let el = null, cur = null;
  const coins = () => (ctx.account ? ctx.account.coins : 0);
  const close = () => { if (el) { el.remove(); el = null; } cur = null; };
  const dayKey = () => new Date().toISOString().slice(0, 10);
  const bankLeft = () => { try { const b = JSON.parse(localStorage.getItem('academy.bank')) || {}; return b.d === dayKey() ? 8 - b.n : 8; } catch (e) { return 8; } };
  const bankUse = () => { const n = 8 - bankLeft() + 1; try { localStorage.setItem('academy.bank', JSON.stringify({ d: dayKey(), n })); } catch (e) {} };
  const wear = () => ctx.wear;
  // 1 câu đố: câu riêng của tiệm (xen kẽ) hoặc câu theo môn
  let qi = 0;
  const quiz = id => { const T = SHOP_TALK[id]; qi++; return qi % 2 && T.qs.length ? T.qs[(qi >> 1) % T.qs.length] : T.subj; };
  function buy(id, price, label, grant) {
    if (!ctx.account) return ctx.toast('Cần đăng nhập hoặc chơi khách để dùng đồng vàng.', 3000);
    if (coins() < price) return ctx.toast(`🪙 Cần <b>${price} đồng vàng</b> (em có ${coins()}). Ghé <b>🏦 Ngân Hàng Kho Báu</b> cuối phố giải toán để kiếm thêm đồng vàng nhé!`, 5000);
    const k = cur; close();
    magic.ask(quiz(id), () => {
      if (!ctx.account.addCoins(-price)) return ctx.toast('Không đủ đồng vàng.', 2500);
      grant(); ctx.sfx && ctx.sfx('coin'); ctx.toast(`🛍️ Đã mua <b>${label}</b>! −${price} 🪙`, 3500);
      if (k) setTimeout(() => open(k, true), 900);
    }, `🛍️ Trả lời đúng để mua <b>${label}</b> (${price} 🪙)`);
  }
  // danh sách hàng mỗi tiệm: [{ name, col?, price, state: 'buy' | 'own' | 'on' | 'free', act() }]
  function items(id) {
    const W = wear(), eq = W.eq, L = [];
    const gear = (slot, list, price) => list.forEach(x => L.push({ name: x.name, col: x.col, price, state: eq[slot] === x.id ? 'on' : W.own(x.id) ? 'own' : 'buy', act: st => st === 'buy' ? buy(id, price, x.name, () => W.give(slot, x.id)) : (W.equip(slot, eq[slot] === x.id ? null : x.id), open(cur, true)) }));
    const use = (name, price, gain, icon) => L.push({ name: `${icon} ${name} (+${gain} năng lượng phép)`, price, state: 'buy', act: () => buy(id, price, name, () => magic.setMana(magic.mana + gain)) });
    if (id === 'wand') {
      if (!magic.hasWand) L.push({ name: '🪄 Cây đũa đầu tiên của em', price: 0, state: 'free', act: () => { close(); magic.chooseWand(true); } });
      else {
        const w = magic.wand;
        CORES.forEach(c => L.push({ name: `Lõi pha lê ${c.name}`, col: c.col, price: 13, state: w.core === c.id ? 'on' : 'buy', act: st => st === 'buy' && buy(id, 13, `lõi pha lê ${c.name}`, () => magic.setWand(null, c.id)) }));
        WOODS.forEach(x => L.push({ name: `Thân gỗ ${x.name}`, col: x.col, price: 8, state: w.wood === x.id ? 'on' : 'buy', act: st => st === 'buy' && buy(id, 8, `thân đũa gỗ ${x.name}`, () => magic.setWand(x.id, null)) }));
      }
    } else if (id === 'robe') { gear('cape', CAPES, 21); gear('hat', HATS, 13); }
    else if (id === 'pet') gear('pet', PETS, 21);
    else if (id === 'night') {
      L.push({ name: '⭐ Bản đồ sao (Bắc Đẩu, Thiên Cầm, Cung Thiên Bình)', price: 8, state: W.own('starmap') ? 'own' : 'buy', act: st => st === 'buy' ? buy(id, 8, 'Bản đồ sao', () => { W.give('gadget', 'starmap'); setTimeout(() => ctx.toast(STARS, 10000), 1000); }) : ctx.toast(STARS, 10000) });
      const done = (() => { try { return JSON.parse(localStorage.getItem('academy.riddles')) || []; } catch (e) { return []; } })();
      GATE_RIDDLES.forEach((q, i) => L.push({ name: `🌙 Đố mẹo số ${i + 1}${done.includes(i) ? ' ✔' : ' (+2 🪙 lần đầu)'}`, price: 0, state: 'free', act: () => { const k = cur; close(); magic.ask(q, () => { if (!done.includes(i)) { done.push(i); try { localStorage.setItem('academy.riddles', JSON.stringify(done)); } catch (e) {} ctx.account && ctx.account.addCoins(2); ctx.toast('🌙 Giỏi quá! +2 🪙', 2500); } if (k) setTimeout(() => open(k, true), 900); }, '🌙 Đố mẹo Hẻm Đêm'); } }));
    }
    else if (id === 'tea') {
      const T = SHOP_TALK.tea; L.push({ name: '📖 Nghe bà kể chuyện', price: 0, state: 'free', act: () => { const st = T.stories[(cur.story = ((cur.story ?? -1) + 1) % T.stories.length)]; ctx.toast(`🍵 <b>${st[0]}</b><br>${st[1]}`, 10000); ctx.sit && ctx.sit(); } });
      use('Trà sen', 3, 13, '🍵'); use('Trà gừng mật ong', 5, 21, '🫖');
    } else if (id === 'map' || id === 'clock') GADGETS.filter(x => x.shop === id).forEach(x => L.push({ name: x.name, price: x.price, state: W.own(x.id) ? 'own' : 'buy', act: st => st === 'buy' ? buy(id, x.price, x.name, () => W.give('gadget', x.id)) : (close(), ctx.bag && ctx.bag.open()) }));
    else if (id === 'fire') FIREWORKS.forEach(f => L.push({ name: `${f.name} (em có ${W.count(f.id)})`, col: f.col, price: 3, state: 'buy', act: () => buy(id, 3, f.name + ' ×2', () => { W.addItem(f.id, 2); setTimeout(() => ctx.toast('🎆 Mở <b>🎒 Túi đồ</b> để bắn pháo hoa nhé!', 3500), 1200); }) }));
    else if (id === 'music') INSTRUMENTS.forEach(x => L.push({ name: x.name, price: 13, state: W.own(x.id) ? 'own' : 'buy', act: st => st === 'buy' ? buy(id, 13, x.name, () => W.give('ins', x.id)) : (close(), ctx.bag && ctx.bag.open()) }));
    else if (id === 'oldbook') SHOP_TALK.oldbook.books.forEach((b, i) => L.push({ name: `📜 ${b[0]} — ${b[1]}`, price: 5, state: W.own('old' + i) ? 'own' : 'buy', act: st => st === 'buy' ? buy(id, 5, b[0], () => W.give('book', 'old' + i)) : (close(), ctx.bag && ctx.bag.open()) }));
    else if (id === 'broom') BROOMS.forEach(b => gear('broom', [b], b.price));   // đeo lưng + cưỡi bằng nút 🧹 (brooms.js)
    else if (id === 'sweet') { use('Kẹo Nổ Lách Tách', 3, 13, '🍬'); use('Bánh Mây Bồng Bềnh', 5, 21, '🧁'); use('Sô-cô-la Ếch Nhảy', 8, 34, '🍫'); }
    else if (id === 'herb') { use('Trà bạc hà', 3, 13, '🍵'); use('Bình thuốc lá lốt', 5, 21, '🧪'); use('Mật ong rừng U Minh', 8, 34, '🍯'); }
    else if (id === 'book') SHOP_TALK.book.books.forEach((b, i) => { const own = W.own('book' + i); L.push({ name: `📖 ${b[0]}`, price: 5, state: own ? 'own' : 'buy', act: st => st === 'buy' ? buy(id, 5, b[0], () => { W.give('book', 'book' + i); setTimeout(() => ctx.toast(`📖 <b>${b[0]}</b><br>${b[1]}`, 9000), 1000); }) : ctx.toast(`📖 <b>${b[0]}</b><br>${b[1]}`, 9000) }); });
    else if (id === 'bank') {
      const left = bankLeft();
      L.push({ name: `🧮 Thử thách kho báu: giải toán nhận +5 🪙 (còn ${left}/8 lượt hôm nay)`, price: 0, state: left > 0 ? 'free' : 'own', act: () => {
        if (bankLeft() <= 0) return ctx.toast('🏦 Hôm nay hết lượt rồi — mai quay lại nhé!', 3500);
        const k = cur; close();
        magic.ask('toan', () => { bankUse(); ctx.account && ctx.account.addCoins(5); ctx.sfx && ctx.sfx('coin'); ctx.toast(`🏦 Kho báu mở! <b>+5 🪙</b> (còn ${bankLeft()} lượt hôm nay)`, 3500); if (k) setTimeout(() => open(k, true), 900); }, '🏦 Thử thách kho báu — giải đúng để nhận đồng vàng');
      } });
    }
    return L;
  }
  function open(k, again) {
    if (!k) return;
    if (!document.getElementById('alShopCss')) { const st = document.createElement('style'); st.id = 'alShopCss'; st.textContent = CSS; document.head.appendChild(st); }
    close(); cur = k; const T = SHOP_TALK[k.sh.id];
    if (!again) k.line = (k.line + 1) % T.lines.length;
    if (k.hero && !again) { k.hero.happyUntil = performance.now() + 1500; const a = k.hero.anim; if (a.has('wave')) { a.play('wave', 0.2, true); setTimeout(() => a.play(k.hero.set.idle, 0.3), 1500); } }
    const L = items(k.sh.id);
    el = document.createElement('div'); el.id = 'alShop';
    el.innerHTML = `<span class="coin">🪙 ${coins()} đồng vàng</span><h4>${k.sh.name}</h4><p class="say">${T.who}: “${T.lines[k.line]}”</p>` +
      L.map((x, i) => `<div class="it">${x.col ? `<i style="background:${x.col}"></i>` : ''}<span>${x.name}</span><button data-i="${i}" class="${x.state === 'buy' ? 'buy' : x.state === 'on' ? 'on' : ''}">${x.state === 'buy' ? `${x.price} 🪙` : x.state === 'on' ? '✔ Đang dùng' : x.state === 'free' ? 'Nhận' : x.state === 'own' ? (k.sh.id === 'book' ? 'Đọc' : k.sh.id === 'bank' ? 'Hết lượt' : 'Dùng') : ''}</button></div>`).join('') +
      `<div class="ft"><small>Mỗi món: trả lời đúng 1 câu đố 📚</small>${ctx.shop ? '<button data-big>🛒 Cửa hàng lớn</button>' : ''}<button data-x>Đóng</button></div>`;
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x !== undefined) return close(); if (b.dataset.big !== undefined) { close(); return ctx.shop.open(['pet'].includes(k.sh.id) ? 'pet' : k.sh.id === 'broom' ? 'ride' : 'wear'); } const x = L[+b.dataset.i]; if (x) { ctx.sfx && ctx.sfx('ui'); x.act(x.state); } };
    document.body.appendChild(el);
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  return { open, close, get isOpen() { return !!el; }, get cur() { return cur; } };
}
