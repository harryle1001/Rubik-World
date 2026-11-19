// academy/showcase.js — TỦ KÍNH RUBIK ở Phố Phép Thuật (chân tháp phụ, u −34): trưng khối Rubik 2×2 / 3×3 / 4×4 + Rubik vàng.
// An toàn trẻ em: bấm vào chỉ hiện lời nhắn "Nhờ bố mẹ xem cửa hàng" + mã QR cho phụ huynh quét (KHÔNG mở link, không mua trong game).
// Ô "Nhập mã quà" (mã in trên thẻ trong hộp đồ thật) → server kiểm tra (dùng 1 lần, chống dò) → nhận vật phẩm độc quyền.
// Hình: tủ = hộp kính trong suốt + khung gỗ; khối Rubik dùng rubikCube() chung của dự án. Kích thước theo φ.
import * as THREE from 'three';
import { Batch } from '../decor.js';
import { rubikCube } from '../zone-school.js';
import { toon } from '../style.js';
import { PHI } from '../layout.js';

const W0 = PHI, D0 = 1, H0 = PHI * 1.3;   // tủ rộng φ m, sâu 1 m, kính cao ≈ 2,1 m
export function buildShowcase(g, at, face) {
  const root = new THREE.Group(); root.position.copy(at); root.rotation.y = face; g.add(root);
  const wood = new Batch('showcase-wood'), cubes = new Batch('showcase-cubes');
  wood.box(W0 + 0.13, 0.8, D0 + 0.13, 0, 0, 0, '#6b4a2e');                      // bệ gỗ
  wood.box(W0 + 0.21, 0.08, D0 + 0.21, 0, 0.8 + H0, 0, '#6b4a2e');             // nắp
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) wood.box(0.06, H0, 0.06, sx * W0 / 2, 0.8, sz * D0 / 2, '#d4a72c');   // cột đồng
  wood.box(W0 * 0.95, 0.04, D0 * 0.9, 0, 0.8 + H0 * 0.5, 0, '#e8dcc6');         // kệ giữa
  wood.box(0.89, 0.21, 0.04, 0, 0.3, D0 / 2 + 0.07, '#f3ead8');                 // biển nhỏ "Rubik thật"
  const sizes = [[2, -0.5, 0.82, 0.21], [3, 0, 0.82, 0.29], [4, 0.52, 0.82, 0.34]];
  for (const [, x, y, s] of sizes) rubikCube(cubes, x, y + s / 2, 0, s, 0.4, false, true);
  const gold = new Batch('showcase-gold'); gold.box(0.34, 0.34, 0.34, 0, 0.8 + H0 * 0.5 + 0.06, 0, '#e8b931', 0.6, 0.62, 0.3);
  const mWood = wood.mesh(toon('#ffffff', { vertexColors: true }), true), mCubes = cubes.mesh(toon('#ffffff', { vertexColors: true }), true);
  const mGold = gold.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.3, emissive: '#8a5c00', emissiveIntensity: 0.8 }), true);
  for (const m of [mWood, mCubes, mGold]) if (m) root.add(m);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(W0, H0, D0), new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.26, roughness: 0.05, metalness: 0, depthWrite: false }));
  glass.position.y = 0.8 + H0 / 2; glass.renderOrder = 2; root.add(glass);
  // biển chữ (canvas)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
  c.fillStyle = '#f3ead8'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#3a2a18'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('🧊 Tủ kính Rubik', 128, 42);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.89, 0.21), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sign.position.set(0, 0.405, D0 / 2 + 0.095); root.add(sign);
  return { root, gold: mGold, spin: t => { if (mGold) { mGold.rotation.y = t * 0.6; mGold.position.y = Math.sin(t * 1.3) * 0.03; } } };
}

// ---------- bảng thông tin: lời nhắn phụ huynh + QR + nhập mã quà ----------
const CSS = `#rwCase{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;width:min(377px,calc(100vw - 26px));max-height:calc(100vh - 26px);overflow:auto;background:#fffaf1;color:#1d2433;border-radius:21px;padding:21px;box-shadow:0 13px 55px #0008;font:15px/1.5 system-ui,sans-serif;text-align:center}
#rwCase h3{margin:0 0 8px;font-size:21px}#rwCase .qr{width:144px;height:144px;margin:8px auto;background:#fff;border-radius:13px;padding:5px;display:block}
#rwCase .kid{background:#fff3cf;border-radius:13px;padding:8px 13px;margin:8px 0;font-weight:600}#rwCase small{color:#5a6375}
#rwCase input{width:100%;box-sizing:border-box;font:600 19px ui-monospace,monospace;text-align:center;letter-spacing:.08em;padding:10px;border:2px solid #d9cdb5;border-radius:13px;margin:8px 0;text-transform:uppercase}
#rwCase button{border:0;border-radius:999px;padding:10px 21px;font:600 15px system-ui;cursor:pointer;min-height:44px;margin:3px}#rwCase .go{background:#1f3a5f;color:#fff}#rwCase .x{background:#e9e1d2}
#rwCase .msg{min-height:1.5em;font-weight:600}#rwCase .msg.bad{color:#b4372e}#rwCase .msg.ok{color:#2f7a4b}`;
export function createCaseUI(ctx, grant) {
  let el = null, busy = false;
  const close = () => { if (el) { el.remove(); el = null; } };
  const server = () => window.ISLAND_SERVER || '';
  function open() {
    if (el) return;
    if (!document.getElementById('rwCaseCss')) { const s = document.createElement('style'); s.id = 'rwCaseCss'; s.textContent = CSS; document.head.appendChild(s); }
    el = document.createElement('div'); el.id = 'rwCase';
    el.innerHTML = `<h3>🧊 Tủ kính Rubik</h3><p>Khối Rubik 2×2, 3×3, 4×4 này là <b>đồ chơi thật</b> — em có thể cầm xoay ngoài đời!</p>
      <div class="kid">👨‍👩‍👧 Nhờ bố mẹ xem cửa hàng nhé!</div>
      <img class="qr" alt="Mã QR cửa hàng cho phụ huynh" src="${server()}/api/shop/qr.svg"><small>Dành cho bố mẹ: quét mã bằng điện thoại để xem cửa hàng (có cổng xác nhận phụ huynh).</small>
      <hr style="border:0;border-top:1px dashed #d9cdb5;margin:13px 0"><b>🎁 Có thẻ mã quà trong hộp?</b><input id="rwCode" maxlength="16" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Mã quà">
      <div class="msg" id="rwMsg"></div><button class="go" id="rwGo">Nhận quà</button><button class="x" id="rwX">Đóng</button>`;
    document.body.appendChild(el);
    const inp = el.querySelector('#rwCode'), msg = el.querySelector('#rwMsg');
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') submit(); });   // gõ chữ không điều khiển nhân vật
    inp.addEventListener('keyup', e => e.stopPropagation());
    inp.addEventListener('input', () => { const v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); inp.value = v.match(/.{1,4}/g)?.join('-') || ''; });
    el.querySelector('#rwX').onclick = close; el.querySelector('#rwGo').onclick = submit;
    async function submit() {
      if (busy) return; const code = inp.value.replace(/-/g, '');
      if (code.length !== 12) { msg.className = 'msg bad'; msg.textContent = 'Mã gồm 12 chữ và số, như trên thẻ.'; return; }
      busy = true; msg.className = 'msg'; msg.textContent = 'Đang kiểm tra…';
      try {
        const r = await fetch(server() + '/api/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name: ctx.account && ctx.account.name || '' }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) { msg.className = 'msg bad'; msg.textContent = j.err || 'Không kết nối được máy chủ.'; return; }
        grant(j.reward); msg.className = 'msg ok'; msg.textContent = `${j.icon || '🎁'} Nhận được: ${j.name}!`; inp.value = ''; ctx.sfx && ctx.sfx('coin');
      } catch (e) { msg.className = 'msg bad'; msg.textContent = 'Cần kết nối mạng để nhận quà.'; }
      finally { busy = false; }
    }
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  return { open, close, get isOpen() { return !!el; } };
}
