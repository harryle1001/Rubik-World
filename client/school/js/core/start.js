// ================= START =================
new ResizeObserver(resize).observe(stage);
resize();
initFeeds();
updateNpcs(0);
newDay(true);
renderMissions();
log('info', 'Chào mừng đến Trường Agent Rubik! Bấm vào một nhân vật để xem từng bước họ làm.');
select(A.mic, false);
renderButtons();
updatePanel();
const boot = () => requestAnimationFrame(t => { tPrev = t; frame(t); });
if(document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();

