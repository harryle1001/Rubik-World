// ocean.js — Điểm khởi động Đảo Rubik 3D (kiểu Zelda low-poly). Các phần nằm trong client/js/island/.
import * as THREE from 'three';
import { CFG } from './island/config.js';
import { createSky } from './island/sky.js';
import { createPost } from './island/post.js';
import { createBrightness } from './island/brightness.js';
import { createTerrain } from './island/terrain.js';
import { createPlayer } from './island/player.js';
import { scatterModel } from './island/models.js';
import { createTemples } from './island/temple.js';
import { createAudio } from './island/audio.js';
import { createNet } from './island/net.js';
import { createAnimals } from './island/animals.js';
import { createSchoolTown } from './island/school-town.js';
import { createWorldMap } from './island/world-map.js';
import { createTutorial } from './island/tutorial.js';
import { SPAWN, landDist, blocked, ISLAND_R, TEMPLE_C } from './island/layout.js';
import { createVehicles } from './island/vehicles.js';
import { createAircraft } from './island/aircraft.js';
import { createMounts } from './island/mounts.js';
import { KINDS } from './island/characters.js';
import { loadModel } from './island/models.js';
import { createPhysics } from './island/physics.js';
import { createWeather } from './island/weather.js';
import { createEasterEggs } from './island/easter-eggs.js';
import { zenNoPlant } from './island/zone-zen.js';
import { createDt } from './island/motion.js';
import { createAmbience } from './island/ambience.js';
import { createSealife } from './island/sealife.js';
import { createTreasure } from './island/treasure.js';
import { createLiving } from './island/living.js';
import { createSkyshow } from './island/skyshow.js';
import { createDive } from './island/dive.js';
import { createPerf } from './island/perf.js';
import { createAutoQ, SK } from './island/autoq.js';
import { createMiniGameHost } from './island/mg/host.js';
import { createAccountHud } from './island/account-hud.js';
import { createLoader } from './island/loader.js';
import { createStats } from './island/stats.js';
import { createTeacherQuiz } from './island/teacher-quiz.js';
import { createQuests } from './island/quests.js';
import { createLessons } from './island/lessons.js';
import { createSchoolInterior } from './island/school-interior.js';
import { createSchoolYard } from './island/school-yard.js';
import { createAcademy } from './island/academy/index.js';
import { createTrain } from './island/train/index.js';
// mini game 3D: mỗi nhóm 1 dòng import register (xem mg/host.js)
import { register as regBoard } from './island/mg/board/index.js';
import { register as registerArts } from './island/mg/arts/index.js';
import { register as registerSport } from './island/mg/sport/index.js';

// chỉ báo tải (Rubik xoay góc trái dưới) + màn che lúc vào game: tạo đầu tiên để bắt mọi lượt tải model/âm thanh
const loading = createLoader();
const bootJob = loading.begin('Dựng thế giới');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
let pr = Math.min(devicePixelRatio, CFG.quality.maxPixelRatio); renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.2, 500);
const sky = createSky(scene);
const post = createPost(renderer, scene, camera);

const terrain = createTerrain(scene);
terrain.state.camera = camera;   // cây/đá chỉ dựng trong hình nón nhìn (terrain.js)
const ctx = { scene, camera, renderer, terrain, colliders: terrain.colliders, loading };
// Nút hành động dùng chung (E hoặc nút giữa màn hình): mỗi khung hình các phần gọi ctx.offer(nhãn, hàm, độ ưu tiên)
{
  // 2 đối tượng dùng luân phiên (không cấp phát mỗi khung: mỗi phần gọi offer mỗi khung)
  const act = document.getElementById('bAct'), slots = [{}, {}]; let best = null, cur = null, si = 0;
  ctx.offer = (label, fn, pri = 0) => { if (!best || pri > best.pri) { best = best || slots[si]; best.label = label; best.fn = fn; best.pri = pri; } };
  ctx.flushOffer = () => { cur = best; best = null; si ^= 1; const h = !cur || ctx.player.frozen; if (act.hidden !== h) act.hidden = h; if (cur && act._l !== cur.label) { act._l = cur.label; act.innerHTML = cur.label; } };   // nhãn có thể chứa biểu tượng SVG
  act.onclick = () => cur && cur.fn();
  addEventListener('keydown', e => { if (e.code === 'KeyE' && cur && !ctx.player.frozen) cur.fn(); });
}
// thông báo ngắn
// đủ lâu cho học sinh lớp 1 đọc (≥ 5 s), luôn có biểu tượng; trên điện thoại "bấm E" → "chạm nút ✋"
const TOUCH = matchMedia('(pointer:coarse)').matches, HAS_ICON = /^\s*(<[^>]+>\s*)*\p{Extended_Pictographic}/u;
const touchText = t => TOUCH ? t.replace(/([Bb])ấm\s*(<b>)?E(<\/b>)?(?![\wÀ-ỹ])/g, (m, b) => (b === 'B' ? 'Chạm' : 'chạm') + ' nút <b>✋</b>').replace(/<b>E<\/b>/g, '<b>✋</b>') : t;
ctx.toast = (t, ms = 3000) => { const el = document.getElementById('info'); t = touchText(String(t)); if (!HAS_ICON.test(t)) t = '💬 ' + t; ms = Math.max(ms, 5000); el.innerHTML = t; el.style.opacity = 1; clearTimeout(ctx._tt); ctx._tt = setTimeout(() => el.style.opacity = 0, ms); };
// tên & màu áo người chơi (lưu trên máy)
ctx.playerName = localStorage.getItem('island.name') || ('Bạn nhỏ ' + Math.floor(100 + Math.random() * 900)); localStorage.setItem('island.name', ctx.playerName);
ctx.hue = +(localStorage.getItem('island.hue') || Math.floor(Math.random() * 360)); localStorage.setItem('island.hue', ctx.hue);
ctx.heroKind = KINDS[Math.floor(ctx.hue / 30) % KINDS.length]; // học sinh (12 kiểu) theo màu đã chọn
const player = ctx.player = createPlayer(ctx);

// Model Blender (.glb): đá (Draco) và rùa (Meshopt) rải trên bãi cát
{
  const beach = [], rocks = [];
  for (let i = 0; i < 1200 && (beach.length < 6 || rocks.length < 24); i++) {
    const a = Math.random() * 6.283, r = ISLAND_R * (0.7 + Math.random() * 0.35), x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.heightAt(x, z);
    if (h > 0.25 && h < 1.2 && !blocked(x, z, 4)) (beach.length < 6 && i % 3 === 0 ? beach : rocks).push([x, h, z, 0.6 + Math.random() * 0.9, Math.random() * 6.28]);
  }
  scatterModel(scene, 'rua', beach, 55); scatterModel(scene, 'da', rocks, 55);
  for (const [x, , z, s] of rocks) ctx.colliders.push({ x, z, r: 0.6 * s });
}

const audio = ctx.audio = createAudio(ctx);
const temples = createTemples(ctx);
const net = ctx.net = createNet(ctx);
const animals = ctx.animals = createAnimals(ctx);
ctx.sky = sky;
const school = createSchoolTown(ctx);
const mg = ctx.mg = createMiniGameHost(ctx); // khung mini game 3D (mg/host.js); mỗi nhóm đăng ký game của mình:
regBoard(ctx);
const worldMap = ctx.worldMap = createWorldMap(ctx); // bản đồ: phím M / nút 🗺️
const vehicles = createVehicles(ctx);
const aircraft = ctx.aircraft = createAircraft(ctx); // sân bay, máy bay cổ điển, đàn chim
const academy = ctx.academy = createAcademy(ctx); // Học viện Pha Lê: đảo riêng, bến thuyền đèn lồng, đường băng, bóng lâu đài trong sương
const train = ctx.train = createTrain(ctx); // Tàu Pha Lê: tàu hơi nước từ ga bờ tây bắc qua đảo Đồi Thông, hầm, cầu cạn vòm đá tới cao nguyên Học viện
const physics = ctx.physics = createPhysics(ctx); // va chạm + đồ vật lăn/đẩy được (bóng, thùng, đá)
const weather = ctx.weather = createWeather(ctx); // nắng, mây, mưa, giông, sương, gió, cầu vồng
const eggs = ctx.eggs = createEasterEggs(ctx); // 21 bí mật: khối Rubik vàng, pháo hoa π, cá voi, Tháp Hà Nội… (📖 Sổ bí mật)
const accountHud = createAccountHud(ctx);
const stats = ctx.stats = createStats(ctx); // nút 📊 FPS (phím P): FPS, ms, draw call, tam giác, bộ nhớ… // 👤 đăng nhập / khách / Lưu đăng nhập, xu & vật phẩm (data/account.js)
const brightness = ctx.brightness = createBrightness(ctx); // nút ☀️ chỉnh độ sáng (phím [ ])
const tutorial = ctx.tutorial = createTutorial(ctx); // hướng dẫn chơi lần đầu: 3 bước, bỏ qua được (tutorial.js)
const dive = createDive(ctx); // bơi & lặn biển, dưỡng khí, góc nhìn dưới nước (ctx.dive, ctx.underwater)
const ambience = ctx.ambience = createAmbience(ctx); // đèn đêm, đom đóm, khói bếp, sương thấp, cá, xe rao, âm thanh theo giờ, chỉnh màu
const sealife = ctx.sealife = createSealife(ctx); // thế giới biển: san hô, đàn cá, sứa, rùa, cá đuối, cá heo, Bách khoa biển
const treasure = ctx.treasure = createTreasure(ctx); // 13 rương kho báu dưới đáy biển + câu đố biển + mảnh bản đồ (HUD 🧰)
const skyshow = ctx.skyshow = createSkyshow(ctx); // chòm sao thật, mưa sao băng, mây ti, chế độ ngắm trời ⭐ (skyshow.js)
const living = ctx.living = createLiving(ctx); // gió giật, cỏ rẽ, cây rung + lá rơi, nước bắn, dấu chân, côn trùng, nhặt rác (living.js)
const quests = ctx.questsMod = createQuests(ctx); // bảng nhiệm vụ hằng ngày 📋: 3 khu · 3 câu đố · 5 pha lê → thưởng (quests.js)
const teacherQuiz = createTeacherQuiz(ctx); // nói chuyện với 21 bạn & thầy cô, nhiệm vụ nhỏ, chủ trò mini game — bong bóng 3D (teacher-quiz.js, data/talk.js)
const schoolInterior = ctx.schoolInterior = createSchoolInterior(ctx); // Toà học tập 3 tầng: vào qua cửa Văn phòng, lớp học/phòng chức năng, tiết học có thầy cô & bạn (school-interior.js)
const schoolYard = createSchoolYard(ctx); // sân trường: vườn rau học sinh trồng (tưới → thu hoạch ⭐), nhà xe đạp (school-yard.js)
const lessons = ctx.lessons = createLessons(ctx); // thời khoá biểu 3D + tiết học ngay trong lớp + chip giờ học góc HUD (lessons.js)
registerArts(ctx); // mini game 3D nhóm Mỹ thuật · Thư viện · Thiên văn (mg/arts/)
registerSport(ctx); // mini game 3D nhóm Thể thao: Olympics, Arcade, Câu cá (mg/sport/)
const mounts = createMounts(ctx);
document.getElementById('bSchool').onclick = () => school.goSchool();
// Vào game: đứng trước cổng trường (giữa thế giới), camera nhìn về phía cổng
player.teleport(SPAWN[0], SPAWN[1]); player.pos.y = Math.max(player.pos.y, 1.2); player.cam.yaw = -Math.PI / 2 + 0.75; player.cam.pitch = 0.3; player.cam.dist = 11; // nhìn chéo φ: tượng Rubik lệch sang bên, cổng + biển tên trọn khung
// menu ☰ (góc phải trên, cạnh 🗺️): Menu trường + ☀️ Ánh sáng; chọn xong hoặc chạm ra ngoài thì tự đóng
{
  const more = document.getElementById('bMore'), menu = document.getElementById('moreMenu');
  const show = on => { menu.hidden = !on; more.setAttribute('aria-expanded', on); };
  more.onclick = () => show(menu.hidden);
  menu.addEventListener('click', e => { if (e.target.closest('button')) show(false); });
  addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== more) show(false); }, true);
}
document.getElementById('bMenu').onclick = () => school.menu();

// Đồ trang trí (Quaternius/Kenney CC0): khu cắm trại, hoa, nấm, gốc cây, pha lê quanh đền (khu I rừng & đền, layout.js)
{
  const [TX, TZ] = TEMPLE_C, ux = Math.SQRT1_2, uz = Math.SQRT1_2, T = (u, v) => [TX + u * uz + v * ux, TZ - u * ux + v * uz];   // u ngang, v hướng về trường
  const put = (name, x, z, s = 1, ry = 0) => loadModel(name).then(m => { if (!m) return; m.position.set(x, terrain.heightAt(x, z), z); m.scale.setScalar(s); m.rotation.y = ry; scene.add(m); });
  const [cfx, cfz] = T(11, 15), [tnx, tnz] = T(15, 18); put('prop-campfire', cfx, cfz, 1.2); put('prop-tent', tnx, tnz, 2.2, -2.3); put('prop-log', ...T(9.2, 17), 1.2, 0.4); put('prop-log', ...T(12.8, 12.6), 1.2, 1.9);
  ctx.colliders.push({ x: cfx, z: cfz, r: 0.8 }, { x: tnx, z: tnz, r: 1.6 });
  for (const [u, v] of [[-6, 5], [6, 5], [-4.5, -6], [4.5, -6]]) put('prop-crystal', ...T(u, v), 1.4, u);
  const rnd = () => { for (let k = 0; k < 30; k++) { const a = Math.random() * 6.283, r = 18 + Math.random() * 55, x = TX + Math.cos(a) * r, z = TZ + Math.sin(a) * r; if (terrain.heightAt(x, z) > 1.5 && terrain.slopeAt(x, z) < 0.6 && !blocked(x, z, 1) && !zenNoPlant(x, z, 1)) return [x, z]; } return null; };
  const tf = (n, sMin, sMax) => Array.from({ length: n }, rnd).filter(Boolean).map(([x, z]) => [x, terrain.heightAt(x, z), z, sMin + Math.random() * (sMax - sMin), Math.random() * 6.28]);
  scatterModel(scene, 'prop-flower-red', tf(60, 0.6, 1.1), 55); scatterModel(scene, 'prop-mushroom-red', tf(30, 0.5, 0.9), 55);
  const stumps = tf(12, 0.9, 1.3); scatterModel(scene, 'prop-stump', stumps, 55); for (const [x, , z] of stumps) ctx.colliders.push({ x, z, r: 0.5 });
}


addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock(), stepDt = createDt();
function warm() {
  const rt = renderer.getRenderTarget(); renderer.setRenderTarget(post.composer.readBuffer); let pw; try { pw = renderer.compileAsync(scene, camera).catch(() => {}); } catch (e) { pw = Promise.resolve(); } renderer.setRenderTarget(rt);
  // biên dịch với render target hậu kỳ (đúng biến thể shader); tải sẵn texture lên GPU (biển chữ canvas, model): lần đầu vật vào khung hình không phải chờ tải ảnh
  const T = new Set(); scene.traverse(o => { if (o.material) for (const m of [].concat(o.material)) for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.isRenderTargetTexture) T.add(v); } });
  for (const t of T) renderer.initTexture(t);
  return pw;
}
const perf = ctx.perf = createPerf(ctx); // cắt vật nhỏ ở xa, viền, người/thú ngoài khung hình (perf.js)
window.__island = ctx; Object.assign(ctx, { sky, post });
renderer.setAnimationLoop(() => {
  const dt = stepDt(clock.getDelta()); // dt ổn định (motion.js): làm mượt khi FPS dao động, giới hạn bước
  if (!ctx.freeCam) player.update(dt); // freeCam: camera tự do để gỡ lỗi
  physics.update(dt);
  terrain.update(dt, clock.elapsedTime, player.pos);
  temples.update(dt, clock.elapsedTime);
  audio.update(dt, { night: sky.state.night, school: !!ctx.schoolHours });
  net.update(dt);
  animals.update(dt);
  school.update(dt, clock.elapsedTime);
  vehicles.update(dt);
  aircraft.update(dt, clock.elapsedTime);
  mounts.update(dt);
  academy.update(dt);
  train.update(dt);
  sky.update(dt, camera, player.pos);
  weather.update(dt, clock.elapsedTime);
  eggs.update(dt, clock.elapsedTime);
  ambience.update(dt);
  living.update(dt);
  skyshow.update(dt); // sau player/sky: chế độ ngắm trời đặt lại camera
  dive.update(dt); // sau ambience: ghi đè sương/màu khi dưới nước
  mg.update(dt, clock.elapsedTime);
  sealife.update(dt);
  treasure.update(dt);
  teacherQuiz.update(dt);
  schoolInterior.update(dt);
  schoolYard.update(dt);
  lessons.update(dt);
  quests.update(dt);
  ctx.flushOffer();
  brightness.update();
  tutorial.update(dt);
  perf.update(dt);
  unfreezeGuard(dt);
  // biên dịch trước mọi shader của thế giới (song song nếu GPU hỗ trợ KHR_parallel_shader_compile) khi trường dựng xong
  // → không khựng lần đầu khi quay camera/đi tới khu mới (three chỉ biên dịch lúc vật thể lần đầu vào khung hình)
  // làm ngay sau khi trường dựng xong + nhân vật đã nạp, khi màn che còn phủ (người chơi không thấy khựng), rồi mới mở màn che
  // biên dịch ĐÚNG biến thể: cảnh vẽ vào render target hậu kỳ (warm()). Sau đó: mỗi 5 s, nếu cảnh có vật mới (khu/model nạp thêm,
  // đèn đêm bật…) → biên dịch trước phần mới.
  if (!ctx.warmed && school.ready && (player.hero || player.heroFailed) && (ctx.warmT = (ctx.warmT || 0) + dt) > 0.382) { ctx.warmed = true; ctx.warmT = 0; const wj = loading.begin('Chuẩn bị hình ảnh'); loading.end(bootJob); warm().finally(() => { loading.end(wj); requestAnimationFrame(() => requestAnimationFrame(() => loading.lift())); }); setTimeout(() => loading.lift(), 8000); }   // máy chậm: tối đa 8 s rồi mở màn che
  else if (ctx.warmed && (ctx.warmT += dt) > 5) { ctx.warmT = 0; const sig = scene.children.length + ':' + perf.list.length + ':' + (sky.state.night > 0.5); if (sig !== ctx.warmSig) { ctx.warmSig = sig; warm(); } }
  // bóng đổ thưa (điện thoại): vẽ lại bản đồ bóng mỗi 2 khung (cây/nhà đứng yên; người/xe ở 30 Hz vẫn mượt) → pass bóng tốn ½
  if (CFG.isMobile) { renderer.shadowMap.autoUpdate = false; if ((ctx.shF = (ctx.shF || 0) + 1) % 2 === 1) renderer.shadowMap.needsUpdate = true; }
  if (!worldMap.open && !loading.veil) post.render(); // bản đồ / màn che lúc vào game phủ kín → không vẽ 3D (dồn CPU cho nạp nhân vật, dựng thị trấn)
  worldMap.update();
  quality(dt);
  stats.frame();
});

// ---------- Lưới an toàn: nhân vật bị khoá (player.frozen) mà không còn bảng nào mở → mở khoá ----------
// Cờ frozen dùng chung (bảng trường, bản đồ, câu đố đền, sổ bí mật, bảng φ & π); bên này đóng/mở chồng lên bên kia
// (vd. mở bản đồ khi bảng trường đang mở → đóng bản đồ khôi phục frozen = true) làm nhân vật đứng yên mãi.
let frzT = 0;
function unfreezeGuard(dt) {
  if (!player.frozen) { frzT = 0; return; }
  if ((frzT += dt) < 1) return; frzT = 0;
  if (!worldMap.open && !document.body.classList.contains('rs-modal') && !document.querySelector('#quiz:not([hidden]), #eggBook:not([hidden]), #townInfo:not([hidden]), #accBox:not([hidden]), #schoolMenu:not([hidden])')) player.frozen = false;
}

// ---------- Chất lượng tự động: mức (0..3) + độ phân giải động (logic trong autoq.js) ----------
// mức 0: đầy đủ · 1: tắt bloom, giảm độ phân giải · 2: không MSAA, cỏ/cây chi tiết gần hơn, bóng nhỏ · 3: tắt bóng đổ
const AQ = createAutoQ({ low: CFG.quality.lowFps, high: CFG.quality.highFps, prl: [pr, Math.min(pr, 1.15), 1.0, 0.85] }), Q = AQ.q;
let qLock = false, appliedL = -1; const cheapMSAA = renderer.extensions.has('WEBGL_multisampled_render_to_texture');
const base = { grass: terrain.state.grassDist, tree: terrain.state.treeDist };
function applyQuality() {
  const L = Q.level;
  pr = AQ.pr(); renderer.setPixelRatio(pr); post.setSize(innerWidth, innerHeight); ctx.resScale = SK[Q.k];
  post.bloom.enabled = L === 0 && (CFG.quality.bloom || (CFG.isMobile && Q.mode === 'pretty'));   // điện thoại: bloom 1/4 độ phân giải, chỉ ở ✨ Đẹp
  if (L === appliedL) return; appliedL = L;   // dưới đây là phần nặng (dựng lại cỏ/cây, bóng, shader): chỉ khi đổi mức
  // MSAA: điện thoại mức 1 chỉ bật khi GPU có WEBGL_multisampled_render_to_texture (khử răng cưa ngay trong ô nhớ của GPU, gần như miễn phí);
  // không có (iPhone…) thì mẫu phụ ghi ra bộ nhớ + bước gộp → đo: chiếm ~48 % thời gian khung → bỏ, làm nét bù (ambience.js)
  post.setMSAA(L >= 2 || (L === 1 && CFG.isMobile && !cheapMSAA) ? 0 : CFG.quality.msaa);
  terrain.state.grassDist = base.grass * (L >= 2 ? 0.6 : 1); terrain.state.treeDist = base.tree * (L >= 2 ? 0.7 : 1); terrain.state.shadows = L < 3; terrain.state.relayoutAll(player.pos);
  const ss = L >= 2 ? 512 : CFG.quality.shadowSize; if (sky.sun.shadow.mapSize.x !== ss) { sky.sun.shadow.mapSize.set(ss, ss); sky.sun.shadow.map?.dispose(); sky.sun.shadow.map = null; }
  if (renderer.shadowMap.enabled !== (L < 3)) { renderer.shadowMap.enabled = L < 3; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); }
  ctx.qualityLevel = L; terrain.water.setQuality(L);   // máy yếu: ít lớp sóng hơn
  ctx.perfScale = [1, 1, 0.786, 0.618][L];   // perf.js: vật nhỏ ẩn sớm hơn ở mức thấp (1/√φ, 1/φ)
}
// mỗi 0,5 s: FPS = 1000 / trung vị thời gian khung (khung khựng lẻ không làm hạ chất lượng)
let tq = 0, tPrev = 0; const dts = [];
function quality(dt) {
  // lúc vào game (màn che + 2 s sau) FPS tụt do dựng thị trấn/biên dịch shader → không tính, kẻo hạ chất lượng oan rồi biên dịch lại (giật)
  if (loading.veil || (ctx.qHold = (ctx.qHold ?? 2) - dt) > 0) { dts.length = 0; tPrev = 0; tq = 0; return; }
  const now = performance.now(); if (tPrev) dts.push(now - tPrev); tPrev = now;
  if ((tq += dt) < 0.5) return; tq = 0;
  dts.sort((a, b) => a - b); const fps = 1000 / (dts[dts.length >> 1] || 16.7); dts.length = 0; ctx.fps = Math.round(fps);
  if (qLock || worldMap.open || document.hidden) return;
  if (AQ.feed(fps, now / 1000)) applyQuality();
}
// gỡ lỗi/đo: __island.setQuality(L, khoá, k) — khoá = không tự đổi nữa
ctx.setQuality = (L, lock = true, k = 0) => { Q.level = L; Q.k = k; qLock = lock; applyQuality(); };   // k: bậc độ phân giải động (0..8)
// nút ☀️ (brightness.js): 'auto' · 'fast' ⚡ Mượt · 'pretty' ✨ Đẹp
ctx.setQualityMode = m => { qLock = false; AQ.setMode(m, CFG.isMobile ? 1 : 0); ctx.qualityMode = m; applyQuality(); };
ctx.qualityMode = 'auto';
if (new URLSearchParams(location.search).has('low')) Q.level = 2; // ?low: bắt đầu ở chất lượng thấp
else Q.level = CFG.isMobile ? 1 : 0; // điện thoại: bắt đầu ở mức 1 (không bloom, độ phân giải vừa) rồi tự lên/xuống theo FPS
applyQuality();

// ---------- Cache để mở nhanh/offline ----------
// đăng ký SAU khi trường sẵn sàng + 5 s: lúc cài, service worker tải sẵn ~2 MB (trường 2D, thú, âm thanh) — không tranh băng thông lúc vào game
if ('serviceWorker' in navigator && !window.ISLAND_SERVER) { const sw = setInterval(() => { if (!school.ready) return; clearInterval(sw); setTimeout(() => navigator.serviceWorker.register('/sw.js').catch(() => {}), 5000); }, 1000); }
