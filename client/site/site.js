// site.js — CHỈ chạy trên trang người lớn (/gioi-thieu, /blog, /parent). Không bao giờ nạp trong game.
// Quảng cáo: chỉ khi server bật (thẻ meta rubik-ads ← biến môi trường ADSENSE_CLIENT) VÀ người lớn đã đồng ý cookie quảng cáo.
// Luôn yêu cầu quảng cáo KHÔNG cá nhân hoá (requestNonPersonalizedAds = 1).
(function () {
  var KEY = 'rubik-consent', VER = 1;
  function get() { try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); return c && c.v === VER ? c : null; } catch (e) { return null; } }
  function set(ads) { try { localStorage.setItem(KEY, JSON.stringify({ v: VER, ads: !!ads, at: Date.now() })); } catch (e) {} }
  var meta = document.querySelector('meta[name="rubik-ads"]'), client = meta && meta.content;
  var loaded = false;
  function loadAds() {
    if (loaded || !client || !document.querySelector('.ad ins')) return; loaded = true;
    document.documentElement.classList.add('ads-on');
    var q = window.adsbygoogle = window.adsbygoogle || []; q.requestNonPersonalizedAds = 1; q.pauseAdRequests = 0;
    var s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(s);
    document.querySelectorAll('.ad ins').forEach(function () { try { q.push({}); } catch (e) {} });
  }
  window.rubikConsent = { get: get, set: set, loadAds: loadAds };
  var c = get(); if (c && c.ads) loadAds();
})();
