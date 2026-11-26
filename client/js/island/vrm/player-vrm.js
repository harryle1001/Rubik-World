// vrm/player-vrm.js — Người chơi dùng nhân vật anime VRM bộ "full" (texture 1024, SpringBone tóc/áo bật); điện thoại: bộ "mobile"
//   (½ tam giác, file nhỏ hơn ~20 %, dùng chung bộ đệm tải với bạn NPC) — nhân vật cao ~¼ màn hình nên không thấy khác.
// Nạp SAU khi màn che vào game đã mở (lazy, không làm chậm lúc vào); máy yếu hoặc chọn "Chibi" → giữ người chibi cũ.
// Đổi nhân vật trong trình tạo (creator.js) → ctx.onAvatar → nạp lại; đổi nhà (lễ chọn nhà) → đổi màu áo tại chỗ.
import { loadVrmHero } from './vrm-hero.js';
import { CFG } from '../config.js';
import { loadAvatar, houseOf, weakDevice } from './avatar.js';

export function createPlayerVrm(ctx) {
  const P = ctx.player; let chibi = null, cur = null, busy = false, want = null, lastHouse = null;
  const st = { loadMs: 0, active: false, weak: weakDevice() };
  async function apply(L) {
    want = L; if (busy) return; busy = true;
    try {
      while (want) {
        const look = want; want = null;
        if (!chibi && P.hero && !P.hero.isVrm) chibi = P.hero;
        if (look.mode === 'chibi' || st.weak) { if (cur && chibi) { P.setHero(chibi); cur.dispose(); cur = null; st.active = false; } continue; }
        const t0 = performance.now();
        const h = await loadVrmHero({ ...look, house: houseOf(ctx, look), wand: false }, { set: CFG.isMobile ? 'mobile' : 'full', height: look.base === 'hair-m' ? 1.66 : 1.58 }).catch(e => { console.warn('VRM người chơi', e); return null; });
        if (!h) continue;
        st.loadMs = Math.round(performance.now() - t0);
        h.model.traverse(o => { if (o.isMesh && o.castShadow) o.receiveShadow = true; });
        const old = cur; P.setHero(h); cur = h; st.active = true; lastHouse = houseOf(ctx, look); if (old) old.dispose();
      }
    } finally { busy = false; }
  }
  ctx.onAvatar = L => apply(L);
  // vào game xong (màn che đã mở hẳn) → nạp nhân vật anime
  const iv = setInterval(() => { if (!ctx.warmed || !P.hero || ctx.loading && ctx.loading.veil) return; clearInterval(iv); setTimeout(() => apply(loadAvatar(ctx)), 600); }, 300);
  // đăng nhập tài khoản khác / lễ chọn nhà xong
  if (ctx.account) ctx.account.onChange(() => {
    const L = loadAvatar(ctx), h = houseOf(ctx, L);
    if (cur && cur.look.base !== L.base) apply(L); else if (cur && h !== lastHouse) { cur.setHouse(h); lastHouse = h; }
  });
  return st;
}
