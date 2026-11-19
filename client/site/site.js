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
  // hộp đồng ý cookie cho NGƯỜI LỚN (Nghị định 13/2023): im lặng ≠ đồng ý; hai nút ngang nhau; đổi ý bất cứ lúc nào
  function box() {
    if (document.getElementById('consentBox')) return;
    var d = document.createElement('div'); d.className = 'consent'; d.id = 'consentBox'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cài đặt cookie');
    d.innerHTML = '<h2>🍪 Cookie & quảng cáo</h2><p>Trang này dành cho <b>người lớn</b> (bố mẹ, thầy cô). Chúng tôi chỉ lưu lựa chọn của bạn trên máy này. ' +
      (client ? 'Nếu bạn đồng ý, Google AdSense hiển thị <b>quảng cáo không cá nhân hoá</b> ở trang giới thiệu, Góc phụ huynh và trang Phụ huynh (có thể dùng cookie để đếm lượt xem, chống gian lận). <b>Trong game không bao giờ có quảng cáo.</b>' : 'Hiện trang không bật quảng cáo hay cookie bên thứ ba.') +
      ' Xem <a href="/privacy">Chính sách bảo mật</a>.</p><div class="cta"><button class="b ghost" data-c="0" style="color:var(--ink)">Chỉ cần thiết</button>' + (client ? '<button class="b" data-c="1">Đồng ý quảng cáo</button>' : '<button class="b" data-c="0">Đã hiểu</button>') + '</div>';
    d.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-c'); if (v == null) return;
      var was = get(); set(v === '1'); d.remove();
      if (v === '1') loadAds(); else if (was && was.ads) location.reload();   // rút lại đồng ý → tải lại trang, không nạp quảng cáo
    });
    document.body.appendChild(d);
  }
  window.rubikConsent = { get: get, set: set, loadAds: loadAds, open: box };
  var c = get(); if (c && c.ads) loadAds();
  function init() { if (client && !get()) box(); document.querySelectorAll('[data-consent-open]').forEach(function (b) { b.addEventListener('click', box); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
