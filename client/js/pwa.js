// Web app (PWA): offline shell via service worker + "install to home screen" helpers (Android/desktop prompt, iPhone instructions).
(function(){
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  let deferred = null; const btns = () => [document.getElementById('bInstall'), document.getElementById('lInstall')].filter(Boolean);
  const show = on => btns().forEach(b => b.hidden = !on || standalone);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; show(true); });
  window.addEventListener('appinstalled', () => { deferred = null; show(false); });
  if(iOS && !standalone) show(true);
  const install = async () => {
    if(deferred){ deferred.prompt(); try { await deferred.userChoice; } catch(e){} deferred = null; show(false); return; }
    UI.modal('Cài Trường Rubik lên iPhone', '<ol class="steps"><li>Mở trang này bằng <b>Safari</b>.</li><li>Bấm nút <b>Chia sẻ</b> (hình vuông có mũi tên lên) ở thanh dưới.</li><li>Chọn <b>"Thêm vào Màn hình chính"</b> rồi bấm <b>Thêm</b>.</li><li>Mở icon <b>Trường Rubik</b> trên màn hình chính: game chạy toàn màn hình như một app.</li></ol><p class="hint">Cần có mạng để chơi cùng mọi người. Khi mất mạng, app hiện trang chờ và tự vào lại khi có mạng.</p>');
  };
  btns().forEach(b => b.onclick = install);
})();
