// library.js — THƯ VIỆN HOÀNG GIA 3D (key 'library'; cửa thư viện, đọc sách, thư viện hoàng gia).
// Sảnh tròn mái vòm, giá sách cao 13 m (Fibonacci) xếp vòng R = 13, sàn khảm xoắn ốc vàng (hình vuông Fibonacci).
//  • Chạm một ngăn giá → bước tới gần; chạm sách thật (gáy sáng) → sách bay ra bàn đọc, mở trang, lật trang;
//    trên trang sách hiện một cảnh 3D nhỏ minh hoạ câu chuyện (dựng bằng khối low-poly).
//  • 🔎 Truy tìm sách: thủ thư đọc câu đố gợi ý, bé tìm đúng cuốn trên giá (sai 2 lần → ngăn đúng sáng lên).
// Nội dung sách lấy nguyên từ trường 2D (client/school/js/games/reader-books*.js, data/books-text.js) qua iframe.
import * as THREE from 'three';
import { loadBooks, bookText } from './books.js';
import { createStage, mesh, T, play, labelSprite, textTex, store, PHI } from './stage.js';

// Câu đố truy tìm (tự viết) — theo tên sách
const CLUES = {
  'Con Rồng cháu Tiên': 'Mẹ Âu Cơ sinh ra bọc trăm trứng — câu chuyện về nguồn gốc người Việt.',
  'Bánh chưng bánh giầy': 'Lang Liêu dâng vua cha thứ bánh vuông tượng trưng cho đất.',
  'Thánh Gióng': 'Cậu bé lên ba vươn vai thành tráng sĩ, cưỡi ngựa sắt đánh giặc.',
  'Sơn Tinh, Thủy Tinh': 'Hai vị thần cầu hôn Mị Nương: một người dâng núi, một người dâng nước.',
  'Sự tích Hồ Gươm': 'Rùa Vàng nổi lên giữa hồ xin lại thanh gươm thần.',
  'Tấm Cám': 'Cô gái hiền hoá thành chim vàng anh, rồi bước ra từ quả thị thơm.',
  'Cây khế': 'Chim lớn ăn khế trả vàng — nhớ may túi ba gang!',
  'Sọ Dừa': 'Chàng trai hình dáng như quả dừa mà tài giỏi, cưới được cô Út.',
  'Thạch Sanh': 'Chàng tiều phu diệt chằn tinh, có cây đàn thần và niêu cơm ăn mãi không hết.',
  'Sự tích cây vú sữa': 'Mẹ chờ con ham chơi đến hoá thành cây có trái ngọt như dòng sữa.',
  'Sự tích dưa hấu': 'Mai An Tiêm ra đảo hoang, gieo hạt chim thả xuống mà thành trái ruột đỏ.',
  'Chú Cuội cung trăng': 'Ngồi gốc cây đa trên Mặt Trăng, nhìn xuống mỗi đêm rằm.',
  'Cóc kiện trời': 'Con vật nhỏ dẫn ong, cáo, gấu, cọp lên kiện ông Trời để xin mưa.',
  'Trí khôn của ta đây': 'Con hổ đòi xem "trí khôn" của bác nông dân và bị trói vào gốc cây.',
  'Cây tre trăm đốt': '"Khắc nhập, khắc xuất!" — câu thần chú nối trăm đốt tre.',
  'Sự tích trầu cau': 'Hai anh em và người vợ hoá thành tảng đá, cây cau và dây trầu.',
  'Rùa và Thỏ': 'Chậm mà chắc thắng cuộc đua với kẻ chủ quan ngủ quên.',
  'Con cáo và chùm nho': 'Không với tới thì chê "nho còn xanh lắm".',
  'Ve sầu và Kiến': 'Mùa hè chỉ ca hát, mùa đông đói phải đi xin bạn chăm chỉ.',
  'Sư tử và chú chuột nhắt': 'Con vật bé xíu gặm đứt lưới, cứu chúa sơn lâm.',
  'Cậu bé chăn cừu': 'Nói dối "Sói đến!" nhiều lần nên khi sói đến thật không ai tin.',
  'Con quạ thông minh': 'Thả từng viên sỏi vào bình để uống được nước.',
  'Gió và Mặt Trời': 'Thi xem ai làm người đi đường cởi được áo khoác.',
  'Bó đũa': 'Bẻ từng chiếc thì dễ, cả bó thì không — đoàn kết là sức mạnh.',
  'Con ngỗng đẻ trứng vàng': 'Tham lam mổ bụng con vật quý, rốt cuộc chẳng còn gì.',
  'Chuột thành phố và chuột đồng quê': 'Hai anh em họ nhà chuột về thăm nhà nhau, mỗi người một nếp sống.',
  'Cáo và Cò': 'Mời súp trong đĩa nông, bị mời lại bằng bình cổ cao.',
  'Hai người bạn và con gấu': 'Gặp gấu, một người trèo lên cây bỏ mặc bạn.',
};
// Cảnh minh hoạ: đạo cụ theo tên sách
const SCENE = {
  'Con Rồng cháu Tiên': ['mountain', 'water', 'egg'], 'Bánh chưng bánh giầy': ['cake', 'house', 'tree'], 'Thánh Gióng': ['horse', 'bamboo', 'mountain'], 'Sơn Tinh, Thủy Tinh': ['mountain', 'water', 'cloud'],
  'Sự tích Hồ Gươm': ['water', 'turtle', 'sword'], 'Tấm Cám': ['bird', 'tree', 'house'], 'Cây khế': ['tree', 'bird', 'gold'], 'Sọ Dừa': ['coconut', 'house', 'tree'], 'Thạch Sanh': ['tree', 'drum', 'house'],
  'Sự tích cây vú sữa': ['tree', 'house'], 'Sự tích dưa hấu': ['island', 'melon', 'bird'], 'Chú Cuội cung trăng': ['moon', 'tree'], 'Cóc kiện trời': ['frog', 'cloud', 'drum'], 'Trí khôn của ta đây': ['tiger', 'tree', 'house'],
  'Cây tre trăm đốt': ['bamboo', 'house'], 'Sự tích trầu cau': ['palm', 'stone', 'tree'], 'Rùa và Thỏ': ['turtle', 'rabbit', 'tree'], 'Con cáo và chùm nho': ['fox', 'grapes'], 'Ve sầu và Kiến': ['tree', 'ant', 'cloud'],
  'Sư tử và chú chuột nhắt': ['lion', 'mouse'], 'Cậu bé chăn cừu': ['sheep', 'sheep', 'mountain'], 'Con quạ thông minh': ['bird', 'jar', 'stone'], 'Gió và Mặt Trời': ['sun', 'cloud', 'tree'], 'Bó đũa': ['sticks', 'house'],
  'Con ngỗng đẻ trứng vàng': ['bird', 'gold', 'house'], 'Chuột thành phố và chuột đồng quê': ['mouse', 'house', 'tree'], 'Cáo và Cò': ['fox', 'bird', 'jar'], 'Hai người bạn và con gấu': ['bear', 'tree'],
  'Truyện Kiều': ['moon', 'water', 'tree'], 'Lục Vân Tiên': ['horse', 'mountain'], 'Chinh phụ ngâm': ['moon', 'house', 'mountain'],
};
const CAT_COL = { 'Truyện cổ tích': '#d8584a', 'Ngụ ngôn': '#4caf6a', 'Lời dạy yêu thương': '#f2b134', 'Văn học cổ điển Việt Nam': '#9a5ad6', 'Sách kinh điển thế giới (tiếng Anh)': '#3d7bd9' };
const FALLBACK = [{ id: 'x0', t: 'Rùa và Thỏ', cat: 'Ngụ ngôn', text: 'Thỏ chạy nhanh nhưng chủ quan ngủ quên; Rùa chậm mà bền bỉ, về đích trước.' }];

function prop(kind) {
  const g = new THREE.Group(), m = (geo, c, x = 0, y = 0, z = 0) => { const o = mesh(geo, c); o.position.set(x, y, z); g.add(o); return o; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), S = (r, d = 0) => new THREE.IcosahedronGeometry(r, d), C = (r1, r2, h, n = 6) => new THREE.CylinderGeometry(r1, r2, h, n);
  switch (kind) {
    case 'tree': m(C(0.05, 0.07, 0.4), '#7a4a2a', 0, 0.2); m(S(0.25, 1), '#4caf6a', 0, 0.55); break;
    case 'palm': m(C(0.03, 0.05, 0.7), '#a87a4a', 0, 0.35); for (let i = 0; i < 5; i++) { const l = m(B(0.35, 0.02, 0.08), '#4caf6a', 0, 0.7); l.rotation.y = i * 1.256; l.rotation.z = -0.4; l.position.x = Math.cos(i * 1.256) * 0.12; l.position.z = -Math.sin(i * 1.256) * 0.12; } break;
    case 'bamboo': for (let i = 0; i < 3; i++) m(C(0.03, 0.03, 0.8), '#8cc06a', (i - 1) * 0.1, 0.4, (i % 2) * 0.08); break;
    case 'mountain': m(new THREE.ConeGeometry(0.45, 0.7, 5), '#7a9a6a', 0, 0.35); m(new THREE.ConeGeometry(0.15, 0.2, 5), '#f4f8fb', 0, 0.62); break;
    case 'water': { const w = m(C(0.5, 0.5, 0.04, 13), '#5fb3e0', 0, 0.02); w.scale.z = 0.62; break; }
    case 'island': m(C(0.4, 0.45, 0.1, 9), '#f3d6a8', 0, 0.05); break;
    case 'house': m(B(0.4, 0.3, 0.3), '#f3e6cc', 0, 0.15); { const r = m(new THREE.ConeGeometry(0.34, 0.25, 4), '#c8402a', 0, 0.42); r.rotation.y = Math.PI / 4; } break;
    case 'bird': m(S(0.1, 0), '#f2b134', 0, 0.55); m(new THREE.ConeGeometry(0.03, 0.08, 4).rotateZ(-Math.PI / 2), '#e0564a', 0.12, 0.56); m(B(0.25, 0.02, 0.08), '#f2b134', 0, 0.58); break;
    case 'gold': for (let i = 0; i < 4; i++) m(S(0.06, 0), '#ffd23f', (i % 2) * 0.12 - 0.06, 0.06 + (i > 1 ? 0.08 : 0), 0); break;
    case 'egg': for (let i = 0; i < 5; i++) { const e = m(S(0.07, 1), '#fff6df', Math.cos(i * 1.256) * 0.15, 0.07, Math.sin(i * 1.256) * 0.15); e.scale.y = 1.3; } break;
    case 'turtle': { const s = m(S(0.2, 1), '#4a8a4a', 0, 0.1); s.scale.y = 0.5; m(S(0.07, 0), '#8cc06a', 0.25, 0.08); break; }
    case 'rabbit': m(S(0.13, 1), '#f7f7f2', 0, 0.13); m(S(0.08, 1), '#f7f7f2', 0.12, 0.25); m(B(0.03, 0.15, 0.03), '#f7f7f2', 0.12, 0.38, 0.03); m(B(0.03, 0.15, 0.03), '#f7f7f2', 0.12, 0.38, -0.03); break;
    case 'horse': m(B(0.4, 0.18, 0.15), '#5a6070', 0, 0.3); m(B(0.12, 0.25, 0.1), '#5a6070', 0.2, 0.45); for (const [x, z] of [[-0.15, 0.05], [-0.15, -0.05], [0.15, 0.05], [0.15, -0.05]]) m(B(0.05, 0.22, 0.05), '#5a6070', x, 0.11, z); break;
    case 'sword': m(B(0.04, 0.5, 0.01), '#dfe6ee', 0, 0.45); m(B(0.16, 0.03, 0.04), '#d4a52c', 0, 0.22); break;
    case 'cake': m(B(0.3, 0.12, 0.3), '#4caf6a', 0, 0.06); m(C(0.12, 0.12, 0.08, 13), '#f7f7f2', 0.32, 0.04); break;
    case 'coconut': m(S(0.18, 1), '#7a5a3a', 0, 0.18); break;
    case 'melon': { const w = m(S(0.2, 1), '#3a8a3a', 0, 0.18); w.scale.x = 1.3; break; }
    case 'moon': m(S(0.25, 1), '#fff2b0', 0, 0.8); break;
    case 'sun': m(S(0.22, 1), '#ffc93c', 0, 0.85); break;
    case 'cloud': for (let i = 0; i < 3; i++) m(S(0.12, 1), '#ffffff', (i - 1) * 0.13, 0.8 + (i === 1 ? 0.05 : 0)); break;
    case 'drum': m(C(0.15, 0.15, 0.18, 9), '#c8282a', 0, 0.09); break;
    case 'frog': m(S(0.12, 1), '#6aaa3a', 0, 0.1); m(S(0.04, 0), '#fff', 0.06, 0.2, 0.05); m(S(0.04, 0), '#fff', 0.06, 0.2, -0.05); break;
    case 'tiger': m(B(0.35, 0.16, 0.15), '#f28a2b', 0, 0.2); m(B(0.14, 0.14, 0.14), '#f28a2b', 0.22, 0.28); break;
    case 'stone': m(S(0.12, 0), '#9a9aa0', 0, 0.08); break;
    case 'fox': m(B(0.28, 0.12, 0.12), '#e07a2a', 0, 0.15); m(new THREE.ConeGeometry(0.08, 0.16, 4).rotateZ(-Math.PI / 2), '#e07a2a', 0.2, 0.2); m(new THREE.ConeGeometry(0.05, 0.2, 4).rotateZ(Math.PI / 2), '#fff', -0.22, 0.17); break;
    case 'grapes': for (let i = 0; i < 6; i++) m(S(0.04, 0), '#8a3ad6', (i % 3 - 1) * 0.05, 0.7 - Math.floor(i / 3) * 0.06); m(C(0.01, 0.01, 0.7, 4), '#7a4a2a', 0, 0.35); break;
    case 'ant': for (let i = 0; i < 3; i++) m(S(0.04, 0), '#2a2226', i * 0.07, 0.04); break;
    case 'lion': m(B(0.35, 0.18, 0.16), '#e0b46a', 0, 0.2); m(S(0.13, 1), '#a8673a', 0.22, 0.3); break;
    case 'mouse': m(S(0.06, 0), '#9a9aa0', 0, 0.06); break;
    case 'sheep': m(S(0.13, 1), '#f7f7f2', 0, 0.16); m(B(0.06, 0.08, 0.06), '#2a2226', 0.14, 0.2); break;
    case 'jar': m(C(0.07, 0.12, 0.3, 8), '#c8794e', 0, 0.15); break;
    case 'sticks': for (let i = 0; i < 5; i++) { const s = m(C(0.015, 0.015, 0.5, 4), '#c8a882', (i - 2) * 0.03, 0.06); s.rotation.z = Math.PI / 2; } break;
    case 'bear': m(S(0.18, 1), '#6b4226', 0, 0.2); m(S(0.1, 1), '#6b4226', 0.16, 0.38); break;
  }
  return g;
}

export function startLibrary(ctx, opts = {}) {
  const S = createStage(ctx, { title: '📚 Thư viện Hoàng gia', bg: '#2a1f2e', fov: 58, fog: ['#3a2a30', 18, 46], onExit: opts.onExit, api: opts.api });
  const { scene, camera } = S; S.hemi.intensity = 1.1; S.sun.position.set(0, 21, 0);
  const lamp = new THREE.PointLight('#ffd9a0', 30, 30, 1.6); lamp.position.set(0, 8, 0); scene.add(lamp);
  const prog = store.get('library', { found: [], read: {}, pos: {} }), save = () => store.set('library', prog);
  const scoreTxt = () => S.setScore(`🔎 ${prog.found.length} sách đã tìm · 📖 ${Object.keys(prog.read).length} đã đọc`); scoreTxt();

  // ---------- Sảnh tròn ----------
  const R = 13, H = 13, SECT = 13, rowH = H / 8;   // 13 ngăn, 8 tầng (mỗi tầng 1,625 m ≈ φ)
  // sàn: xoắn ốc vàng vẽ bằng các hình vuông Fibonacci
  { const c = document.createElement('canvas'); c.width = c.height = 1024; const k = c.getContext('2d'); k.fillStyle = '#e8dcc4'; k.fillRect(0, 0, 1024, 1024);
    // xoắn ốc vàng r = a·φ^(2θ/π): mỗi 1/4 vòng bán kính nhân φ; vòng tròn đồng tâm bán kính theo Fibonacci
    k.strokeStyle = '#b8860b'; k.lineWidth = 7; for (const f of [55, 89, 144, 233, 377]) { k.beginPath(); k.arc(512, 512, f * 1.3, 0, Math.PI * 2); k.stroke(); }
    k.strokeStyle = '#7a3a1a'; k.lineWidth = 9; for (const rot of [0, Math.PI]) { k.beginPath(); for (let th = 0; th < Math.PI * 5; th += 0.04) { const r = 4 * Math.pow(PHI, th * 2 / Math.PI); if (r > 480) break; k.lineTo(512 + Math.cos(th + rot) * r, 512 + Math.sin(th + rot) * r); } k.stroke(); }
    k.setTransform(1, 0, 0, 1, 0, 0); k.strokeStyle = '#7a5a2e'; k.lineWidth = 10; k.beginPath(); k.arc(512, 512, 500, 0, Math.PI * 2); k.stroke();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const fl = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 34).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ map: tx })); fl.material.userData.own = true; scene.add(fl); }
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1, R + 1, H + 1, 34, 1, true), T('#5a3a2a', { side: THREE.BackSide })); wall.position.y = (H + 1) / 2; scene.add(wall);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R + 1, 21, 8, 0, Math.PI * 2, 0, Math.PI / 2), T('#3d4a7a', { side: THREE.BackSide })); dome.position.y = H + 1; scene.add(dome);
  const oculus = new THREE.Mesh(new THREE.CircleGeometry(R / PHI / PHI, 21).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff6c8' })); oculus.material.userData.own = true; oculus.position.y = H + 1 + (R + 1) * 0.97; scene.add(oculus);
  for (const y of [0.1, H + 0.9]) { const ring = mesh(new THREE.TorusGeometry(R + 0.5, 0.15, 4, 34).rotateX(Math.PI / 2), '#d4a52c', { outline: false }); ring.position.y = y; scene.add(ring); }
  // bàn đọc giữa sảnh + đèn chùm
  const table = mesh(new THREE.CylinderGeometry(1.6, 1.3, 0.12, 13), '#7a4a2a'); table.position.y = 1.0; scene.add(table);
  const leg = mesh(new THREE.CylinderGeometry(0.25, 0.4, 1.0, 8), '#5a3420'); leg.position.y = 0.5; scene.add(leg);
  const chand = new THREE.Group(); chand.position.y = H - 1; scene.add(chand);
  chand.add(mesh(new THREE.TorusGeometry(1.3, 0.06, 4, 13).rotateX(Math.PI / 2), '#d4a52c', { outline: false }));
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: '#ffe9a8' })); c.material.userData.own = true; c.position.set(Math.cos(i * Math.PI / 4) * 1.3, 0.15, Math.sin(i * Math.PI / 4) * 1.3); chand.add(c); }

  // ---------- Giá sách: cột gỗ + tấm ngăn (InstancedMesh) ----------
  const secA = i => (i + 0.5) / SECT * Math.PI * 2, secW = 2 * Math.PI * (R - 0.4) / SECT;
  const o = new THREE.Object3D();
  const boards = new THREE.InstancedMesh(new THREE.BoxGeometry(secW, 0.08, 0.7), T('#6b4226'), SECT * 9), posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, H, 0.8), T('#4a2c1a'), SECT);
  for (let s = 0; s < SECT; s++) { const a = secA(s); for (let r = 0; r < 9; r++) { o.position.set(Math.cos(a) * (R - 0.4), r * rowH + 0.04, Math.sin(a) * (R - 0.4)); o.rotation.set(0, -a - Math.PI / 2, 0); o.updateMatrix(); boards.setMatrixAt(s * 9 + r, o.matrix); }
    const pa = (s + 1) / SECT * Math.PI * 2; o.position.set(Math.cos(pa) * (R - 0.4), H / 2, Math.sin(pa) * (R - 0.4)); o.rotation.set(0, -pa - Math.PI / 2, 0); o.updateMatrix(); posts.setMatrixAt(s, o.matrix); }
  scene.add(boards, posts);
  // vị trí 1 cuốn trên ngăn s, tầng r, độ lệch u (m) dọc ngăn
  const slot = (s, r, u, h) => { const a = secA(s) + u / (R - 0.55); return { p: new THREE.Vector3(Math.cos(a) * (R - 0.55), r * rowH + 0.08 + h / 2, Math.sin(a) * (R - 0.55)), ry: -a - Math.PI / 2 }; };
  // sách trang trí (không chạm được) — 1 lần vẽ
  const PAL = ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#7a5a2a', '#5a2a5a', '#2a5a5a', '#9a6a2a', '#4a2a2a'].map(c => new THREE.Color(c));
  const deco = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), T('#ffffff'), SECT * 8 * 11);
  let di = 0;
  // sách thật: nạp nội dung sách của trường (books.js) rồi xếp lên giá
  let books = [], cats = [], realM = null; const real = [], secCat = [], signs = [], col = new THREE.Color();
  function populate(list) {
    books = (list && list.length ? list : FALLBACK); cats = [...new Set(books.map(b => b.cat))];
    // mỗi thể loại một ngăn (thể loại nhiều sách chiếm 2 ngăn), sách thật ở tầng 1–3 (tầm với)
    let sec = 0;
    for (const c of cats) { const lst = books.filter(b => b.cat === c); const need = Math.ceil(lst.length / 12); for (let k = 0; k < need && sec < SECT; k++) { secCat[sec] = c; lst.slice(k * 12, k * 12 + 12).forEach((b, i) => { const r = 1 + Math.floor(i / 4), u = (i % 4 - 1.5) * 0.5 + (r % 2 ? 0.12 : -0.12); real.push({ b, s: sec, r, u }); }); sec++; } }
    realM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 1, 0.62), T('#ffffff'), real.length);
    real.forEach((q, i) => { const h = 0.95, { p, ry } = slot(q.s, q.r, q.u, h); q.p = p; q.ry = ry; q.h = h; o.position.copy(p).multiplyScalar((R - 0.75) / (R - 0.55)).setY(p.y); o.rotation.set(0, ry, 0); o.scale.set(1, h, 1); o.updateMatrix(); realM.setMatrixAt(i, o.matrix); realM.setColorAt(i, col.set(CAT_COL[q.b.cat] || '#d4a52c').offsetHSL(0, 0, (i % 3) * 0.06)); q.m = o.matrix.clone(); });
    for (let s = 0; s < SECT; s++) for (let r = 0; r < 8; r++) {
      let u = -secW / 2 + 0.15; while (u < secW / 2 - 0.3 && di < deco.count) {
        const w = 0.12 + Math.random() * 0.14, h = rowH * (0.55 + Math.random() * 0.3); u += w / 2;
        if (!real.some(q => q.s === s && q.r === r && Math.abs(q.u - u) < 0.32)) { const { p, ry } = slot(s, r, u, h); o.position.copy(p); o.rotation.set(0, ry, (Math.random() < 0.08) ? 0.2 : 0); o.scale.set(w, h, 0.5); o.updateMatrix(); deco.setMatrixAt(di, o.matrix); deco.setColorAt(di++, PAL[(Math.random() * PAL.length) | 0]); }
        u += w / 2 + 0.015;
      }
    }
    deco.count = di; scene.add(deco, realM);
    // biển tên thể loại trên mỗi ngăn
    for (let s = 0; s < SECT; s++) { const a = secA(s), c = secCat[s]; const sp = labelSprite(c ? c.replace(' (tiếng Anh)', ' 🇬🇧') : ['📜 Sách cổ', '🗺️ Bản đồ', '🌍 Địa lý', '🔭 Thiên văn', '🎨 Mỹ thuật'][s % 5], { size: 0.55, bg: c ? 'rgba(122,74,42,.92)' : 'rgba(27,22,38,.7)' }); sp.position.set(Math.cos(a) * (R - 1.2), 4 * rowH + 0.5, Math.sin(a) * (R - 1.2)); scene.add(sp); signs[s] = sp; }
    bar(); if (opts.book) { const i = real.findIndex(q => q.b.id === opts.book); if (i >= 0) take(i); }
  }
  loadBooks().then(l => { if (!S.disposed) populate(l); });

  // ---------- Camera: đứng giữa sảnh, kéo để quay / ngước nhìn; chạm ngăn → bước tới ----------
  const cam = { pos: new THREE.Vector3(0, 1.6, 0), yaw: 0, pitch: 0.12, goal: new THREE.Vector3(0, 1.6, 0), gyaw: 0, gpitch: 0.12 }, fwd = new THREE.Vector3();
  let near = -1;   // ngăn đang đứng trước
  function walkTo(s) { near = s; const a = secA(s); cam.goal.set(Math.cos(a) * (R - 5.5), 1.6, Math.sin(a) * (R - 5.5)); cam.gyaw = Math.atan2(Math.sin(a), Math.cos(a)); cam.gpitch = 0.05; S.tip(`📚 Ngăn <b>${secCat[s] || 'sách cổ'}</b> — chạm sách có gáy sáng màu để lấy`, 2600); bar(); }
  function center() { near = -1; cam.goal.set(0, 1.6, 0); cam.gpitch = 0.12; bar(); }
  const ang2 = a => Math.atan2(Math.sin(a), Math.cos(a));

  // ---------- Đọc sách: sách bay ra, mở trang, cảnh 3D minh hoạ ----------
  const desk = new THREE.Group(); desk.position.set(0, 1.08, 0); scene.add(desk);
  const PW = 0.9, PH = 0.9 * PHI;   // trang sách tỉ lệ φ
  const cover = mesh(new THREE.BoxGeometry(PW * 2 + 0.1, 0.05, PH + 0.1), '#8a2a2a'); cover.position.y = 0.02;
  const mkPage = side => { const m = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH).rotateX(-Math.PI / 2).translate(side * PW / 2, 0, 0), new THREE.MeshBasicMaterial({ color: '#fff' })); m.material.userData.own = true; m.position.y = 0.06; return m; };
  const pageL = mkPage(-1), pageR = mkPage(1), flip = mkPage(1); flip.material = flip.material.clone(); flip.material.side = THREE.DoubleSide; flip.material.userData.own = true; flip.visible = false;
  const openBook = new THREE.Group(); openBook.add(cover, pageL, pageR, flip); openBook.visible = false; desk.add(openBook);
  const dio = new THREE.Group(); dio.position.set(0, 0.6, -PH * 0.7); desk.add(dio);
  const flyer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.95, 0.62), T('#d4a52c', { unique: true })); flyer.material.userData.own = true; flyer.visible = false; scene.add(flyer);
  const RD = { q: null, pages: [], p: 0, fly: 0, from: null, flipT: 0 };
  function paginate(text) { const out = []; const paras = String(text).replace(/\r/g, '').split(/\n+/).map(s => s.trim()).filter(Boolean); let cur = ''; for (const pa of paras) { if ((cur + pa).length > 520 && cur) { out.push(cur); cur = ''; } if (pa.length > 640) { let s = pa; while (s.length > 520) { let k = s.lastIndexOf(' ', 520); if (k < 300) k = 520; out.push(s.slice(0, k)); s = s.slice(k).trim(); } cur = s; } else cur += (cur ? '\n' : '') + pa; } if (cur) out.push(cur); return out.length ? out : ['(Trang trống)']; }
  const pageTex = (i) => { const t = RD.pages[i]; if (t == null) return textTex(i === RD.pages.length ? ['— Hết —', 'Chúc mừng em đã đọc xong cuốn sách! 🌟'] : [''], { w: 512, h: 828, size: 30, align: 'center', pad: 60, bg: '#fbf3df' });
    return textTex(t.split('\n'), { w: 512, h: 828, size: 25, pad: 34, bg: '#fbf3df', title: i === 0 ? RD.q.b.t : null, font: 'Georgia, serif' }); };
  const setTex = (m, tx, mir) => { if (mir) { tx.wrapS = THREE.RepeatWrapping; tx.repeat.x = -1; } if (m.material.map) m.material.map.dispose(); m.material.map = tx; m.material.needsUpdate = true; };
  function showPages() { setTex(pageL, pageTex(RD.p)); setTex(pageR, pageTex(RD.p + 1)); prog.pos[RD.q.b.id] = RD.p; if (RD.p + 2 >= RD.pages.length && !prog.read[RD.q.b.id]) { prog.read[RD.q.b.id] = 1; scoreTxt(); play('ok'); } save(); S.setTitle(`📖 ${RD.q.b.t} · trang ${RD.p + 1}–${Math.min(RD.p + 2, RD.pages.length)}/${RD.pages.length}`); }
  function buildDiorama(title) {
    while (dio.children.length) dio.remove(dio.children[0]);
    const base = mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.08, 13), '#8cc06a'); dio.add(base);
    const kinds = SCENE[title] || ['tree', 'house']; kinds.forEach((k, i) => { const p = prop(k), a = i / kinds.length * Math.PI * 2 + 0.6, r = kinds.length > 1 ? 0.32 : 0; p.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r); p.rotation.y = -a; dio.add(p); });
    dio.scale.setScalar(0.01); dio.userData.t = 0;
  }
  async function take(i) {
    const q = real[i]; RD.q = q; RD.from = q; RD.fly = 0.001; S.closeCard();
    o.position.set(0, -99, 0); o.scale.setScalar(0); o.updateMatrix(); realM.setMatrixAt(i, o.matrix); realM.instanceMatrix.needsUpdate = true;
    flyer.material.color.set(CAT_COL[q.b.cat] || '#d4a52c'); flyer.visible = true; flyer.position.copy(q.p); openBook.visible = false; play('whoosh');
    cam.goal.set(0, 2.6, 2.6); cam.gyaw = -Math.PI / 2; cam.gpitch = -0.62; near = -2; bar();
    let text = null; try { text = await bookText(q.b); } catch (e) {}
    RD.pages = paginate(text || 'Cuốn sách này chưa tải được nội dung. Em hãy thử lại sau nhé!'); RD.p = Math.min(prog.pos[q.b.id] || 0, Math.max(0, RD.pages.length - 2)); RD.p -= RD.p % 2;
  }
  function putBack() { if (!RD.q) return; const i = real.indexOf(RD.q); realM.setMatrixAt(i, RD.q.m); realM.instanceMatrix.needsUpdate = true; RD.q = null; openBook.visible = false; flyer.visible = false; dio.scale.setScalar(0.01); S.setTitle('📚 Thư viện Hoàng gia'); center(); }
  function turn(d) { if (!RD.q || RD.flipT > 0) return; const np = RD.p + d * 2; if (np < 0 || np >= RD.pages.length) return; RD.flipD = d; RD.flipT = 0.0001; flip.visible = true; setTex(flip, pageTex(d > 0 ? RD.p + 1 : RD.p), d < 0); flip.rotation.z = d > 0 ? 0 : Math.PI; if (d > 0) setTex(pageR, pageTex(np + 1)); else setTex(pageL, pageTex(np)); RD.p = np; play('whoosh', 0, 0.3, 0.3); }

  // ---------- Truy tìm sách ----------
  const hunt = { on: false, i: -1, miss: 0 };
  function newHunt() {
    const pool = real.map((q, i) => i).filter(i => CLUES[real[i].b.t]), left = pool.filter(i => !prog.found.includes(real[i].b.id)), list = left.length ? left : pool; if (!list.length) return;
    hunt.on = true; hunt.i = list[(Math.random() * list.length) | 0]; hunt.miss = 0; if (RD.q) putBack();
    S.card(`<h3>🔎 Thủ thư đố em</h3><p style="font-size:17px"><i>"${CLUES[real[hunt.i].b.t]}"</i></p><p style="font-size:13px;opacity:.8">Đi đến ngăn đúng thể loại rồi chạm cuốn sách em đoán.</p>`, [{ label: '🚶 Đi tìm!' }]);
  }
  function tapBook(i) {
    const q = real[i];
    if (hunt.on) {
      if (i === hunt.i) { hunt.on = false; if (!prog.found.includes(q.b.id)) prog.found.push(q.b.id); save(); scoreTxt(); play('ok'); S.tip(`🎉 Đúng rồi! <b>${q.b.t}</b> bay ra cho em đọc`, 3000); take(i); return; }
      hunt.miss++; play('bad'); wiggle = { i, t: 0.5 };
      S.tip(`Chưa đúng — đây là <b>${q.b.t}</b>.${hunt.miss >= 2 ? ' Gợi ý: ngăn đúng đang sáng lên ✨' : ' Đọc lại câu đố nhé!'}`, 3000); return;
    }
    take(i);
  }
  let wiggle = null;

  // ---------- Chạm & kéo ----------
  let downX = 0, downY = 0, moved = 0;
  S.onDown = e => { downX = e.clientX; downY = e.clientY; moved = 0; };
  S.onDrag = (dx, dy) => { moved += Math.abs(dx) + Math.abs(dy); if (RD.q) return; cam.gyaw -= dx * 0.005; cam.gpitch = Math.max(-0.5, Math.min(1.0, cam.gpitch + dy * 0.004)); };
  S.onUp = e => {
    if (moved > 13) { if (RD.q && Math.abs(e.clientX - downX) > 55) turn(e.clientX < downX ? 1 : -1); return; }
    if (RD.q) { const h = S.pick([pageL, pageR], e); if (h) turn(h.object === pageR ? 1 : -1); return; }
    if (!realM) return; const hb = S.pick([realM], e); if (hb && hb.instanceId != null && (near >= 0 || hb.distance < 9)) { tapBook(hb.instanceId); return; }
    const hs = S.pick([boards, posts, deco, realM], e); if (hs) { const p = S.local(hs.point.clone()), a = Math.atan2(p.z, p.x), s = ((Math.floor((a < 0 ? a + Math.PI * 2 : a) / (Math.PI * 2) * SECT)) % SECT + SECT) % SECT; walkTo(s); }
  };
  S.onKey = e => { if (RD.q && (e.code === 'ArrowRight' || e.code === 'KeyD')) turn(1); if (RD.q && (e.code === 'ArrowLeft' || e.code === 'KeyA')) turn(-1); };

  // ---------- Mỗi khung hình ----------
  S.onTick(dt => {
    const k = 1 - Math.exp(-dt * 3.2); cam.pos.lerp(cam.goal, k); let dy = ang2(cam.gyaw - cam.yaw); cam.yaw += dy * k; cam.pitch += (cam.gpitch - cam.pitch) * k;
    camera.position.copy(cam.pos); fwd.set(Math.cos(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.sin(cam.yaw) * Math.cos(cam.pitch)); camera.lookAt(fwd.add(cam.pos));
    camera.fov = 58 * Math.min(1.35, S.fit()); camera.updateProjectionMatrix();
    chand.rotation.y += dt * 0.1;
    // sách bay: cung parabol từ giá → bàn đọc (1,618 s), xoay tròn
    if (RD.fly > 0) {
      RD.fly = Math.min(1, RD.fly + dt / PHI); const t = RD.fly, e = t * t * (3 - 2 * t), q = RD.from;
      flyer.position.lerpVectors(q.p, desk.position, e).y += Math.sin(t * Math.PI) * 2.6; flyer.rotation.set(t * Math.PI * 2, q.ry * (1 - e), 0);
      if (t >= 1) { RD.fly = 0; flyer.visible = false; openBook.visible = true; openBook.scale.setScalar(0.01); cover.material = T(CAT_COL[q.b.cat] || '#8a2a2a'); buildDiorama(q.b.t); RD.open = 0.0001; play('bell', 880, 0.5); }
    }
    if (RD.open > 0) { RD.open = Math.min(1, RD.open + dt * 2.2); openBook.scale.setScalar(RD.open); if (RD.open >= 1) { RD.open = 0; if (RD.pages.length) showPages(); } }
    if (RD.q && !RD.fly && dio.scale.x < 1) dio.scale.setScalar(Math.min(1, dio.scale.x + dt * 1.6));
    dio.rotation.y += dt * 0.35;
    if (RD.flipT > 0) {
      RD.flipT = Math.min(1, RD.flipT + dt * 2.6); const e = RD.flipT; flip.rotation.z = RD.flipD > 0 ? e * Math.PI : (1 - e) * Math.PI; flip.position.y = 0.07 + Math.sin(e * Math.PI) * 0.05;
      if (e > 0.5 && !RD.half) { RD.half = true; setTex(flip, pageTex(RD.flipD > 0 ? RD.p : RD.p + 1), RD.flipD > 0); }
      if (e >= 1) { RD.flipT = 0; RD.half = false; flip.visible = false; showPages(); }
    }
    if (hunt.on && hunt.miss >= 2 && signs[real[hunt.i].s]) { const s = real[hunt.i].s; signs[s].scale.setScalar(1 + Math.sin(performance.now() / 160) * 0.08); signs[s].scale.x *= 5.33 * 0.55; signs[s].scale.y *= 0.55; }
    if (wiggle) { wiggle.t -= dt; const q = real[wiggle.i]; o.matrix.copy(q.m); o.matrix.decompose(o.position, o.quaternion, o.scale); o.rotateZ(Math.sin(wiggle.t * 40) * 0.08 * (wiggle.t > 0 ? 1 : 0)); o.updateMatrix(); realM.setMatrixAt(wiggle.i, o.matrix); realM.instanceMatrix.needsUpdate = true; if (wiggle.t <= 0) wiggle = null; }
  });

  // ---------- Nút ----------
  function bar() {
    S.clearBar();
    if (RD.q) { S.button('◀ Trang trước', () => turn(-1)); S.button('Trang sau ▶', () => turn(1)); S.button('📚 Cất sách', putBack); return; }
    S.button('🔎 Truy tìm sách', newHunt);
    if (near >= 0) { S.button('◀', () => walkTo((near + SECT - 1) % SECT)); S.button('▶', () => walkTo((near + 1) % SECT)); S.button('⬅ Ra giữa sảnh', center); }
    S.button('📜 Danh mục', () => S.card(`<h3>Danh mục</h3>` + cats.map(c => `<p><b style="color:${CAT_COL[c] || '#7a5a2e'}">■</b> ${c}: ${books.filter(b => b.cat === c).length} cuốn</p>`).join('') + `<p style="font-size:13px">Em đã đọc xong ${Object.keys(prog.read).length} cuốn, tìm được ${prog.found.length}/${Object.keys(CLUES).length} câu đố.</p>`, cats.map(c => ({ label: '→ ' + c, fn: () => walkTo(secCat.indexOf(c)) }))));
  }
  bar(); S.tip('Kéo để nhìn quanh và ngước lên giá sách cao 13 m · chạm vào một ngăn để bước tới', 4200);
  return { update: S.update, dispose: S.dispose, _dbg: { S, real, get realM() { return realM; }, take, walkTo, newHunt, tapBook, hunt, turn } };
}
