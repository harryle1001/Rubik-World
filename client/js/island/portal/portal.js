// portal/portal.js — Lớp adapter SDK cổng game cho bản "Đảo Rubik – Mini" (Poki · CrazyGames · GameDistribution · không SDK).
// Cổng đích do scripts/build-portal.sh ghi vào index.html: window.PORTAL = { target: 'poki'|'crazygames'|'gamedistribution'|'none', gdId, fullUrl }.
// Mọi hàm an toàn khi SDK lỗi/bị chặn quảng cáo: không ném lỗi, quảng cáo thất bại = chơi tiếp, thưởng = false.
// Nguồn API (đọc 2026-11): developers.poki.com/guide/sdk-html5 · docs.crazygames.com/sdk/intro, /sdk/video-ads · GD: GD_OPTIONS/gdsdk (xem docs/portals.md).
const CFG = Object.assign({ target: 'none', gdId: '', fullUrl: '' }, window.PORTAL || {});
const SRC = {
  poki: 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js',
  crazygames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js',
  gamedistribution: 'https://html5.api.gamedistribution.com/main.min.js',
};
const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
const pauseSubs = new Set();   // gọi khi quảng cáo chạy: (true) tắt tiếng + dừng, (false) tiếp tục
const adPause = on => { for (const f of pauseSubs) try { f(on); } catch (e) {} };

let target = CFG.target, sdk = null, playing = false, gdReward = null, gdDone = null;
const ready = (async () => {
  if (!SRC[target]) { target = 'none'; return; }
  try {
    if (target === 'gamedistribution') {
      window.GD_OPTIONS = { gameId: CFG.gdId, onEvent: ev => {
        if (ev.name === 'SDK_GAME_PAUSE') adPause(true);
        if (ev.name === 'SDK_GAME_START') { adPause(false); gdDone && gdDone(); gdDone = null; }
        if (ev.name === 'SDK_REWARDED_WATCH_COMPLETE') gdReward = true;
      } };
      await load(SRC[target]); for (let i = 0; i < 50 && !window.gdsdk; i++) await new Promise(r => setTimeout(r, 100));
      sdk = window.gdsdk || null;
    } else {
      await load(SRC[target]);
      if (target === 'poki') { await window.PokiSDK.init(); sdk = window.PokiSDK; }
      else { await window.CrazyGames.SDK.init(); sdk = window.CrazyGames.SDK; if (sdk.environment === 'disabled') sdk = null; }
    }
  } catch (e) { console.warn('[portal] SDK không tải được → chạy không SDK', e && e.message); sdk = null; }
  if (!sdk) target = 'none';
})();
const call = (f) => { try { return f(); } catch (e) { console.warn('[portal]', e && e.message); } };

export const portal = {
  get target() { return target; }, ready,
  get fullUrl() { return CFG.fullUrl; },
  // link ngoài: chỉ Poki cho phép (qua openExternalLink); CrazyGames/GD chặn link ra ngoài → ẩn nút
  get canLink() { return !!CFG.fullUrl && (target === 'poki' || target === 'none'); },
  openFull() { if (!this.canLink) return false; if (target === 'poki') call(() => sdk.openExternalLink(CFG.fullUrl)); else window.open(CFG.fullUrl, '_blank', 'noopener'); return true; },
  onPause(f) { pauseSubs.add(f); },
  async loadingStart() { await ready; if (target === 'crazygames') call(() => sdk.game.loadingStart()); },
  async loadingFinished() { await ready; if (target === 'poki') call(() => sdk.gameLoadingFinished()); if (target === 'crazygames') call(() => sdk.game.loadingStop()); },
  gameplayStart() { if (playing) return; playing = true; if (target === 'poki') call(() => sdk.gameplayStart()); if (target === 'crazygames') call(() => sdk.game.gameplayStart()); },
  gameplayStop() { if (!playing) return; playing = false; if (target === 'poki') call(() => sdk.gameplayStop()); if (target === 'crazygames') call(() => sdk.game.gameplayStop()); },
  get rewardedOk() { return target !== 'none'; },
  // Quảng cáo giữa màn: CHỈ gọi giữa các màn (sau thẻ kết quả mini game), không bao giờ giữa lúc học/chơi. Tần suất do cổng quyết định.
  async commercialBreak() { await ready; if (target === 'none') return; return this._ad('midgame'); },
  // Quảng cáo có thưởng (người chơi tự chọn): trả true nếu xem hết
  async rewardedBreak() { await ready; if (target === 'none') return false; return !!(await this._ad('rewarded')); },
  async _ad(kind) {
    const was = playing; this.gameplayStop();
    let res = false;
    try {
      if (target === 'poki') {
        res = await (kind === 'rewarded' ? sdk.rewardedBreak(() => adPause(true)) : sdk.commercialBreak(() => adPause(true)).then(() => true));
      } else if (target === 'crazygames') {
        res = await new Promise(ok => sdk.ad.requestAd(kind, { adStarted: () => adPause(true), adFinished: () => ok(true), adError: () => ok(false) }));
      } else if (target === 'gamedistribution') {
        gdReward = false;
        res = await new Promise(ok => { gdDone = () => ok(kind === 'rewarded' ? gdReward : true); Promise.resolve(sdk.showAd(kind === 'rewarded' ? 'rewarded' : 'interstitial')).catch(() => { gdDone = null; ok(false); }); setTimeout(() => { if (gdDone) { gdDone = null; ok(false); } }, 90000); });
      }
    } catch (e) { res = false; }
    adPause(false); if (was) this.gameplayStart();
    return !!res;
  },
};
window.__portal = portal;
