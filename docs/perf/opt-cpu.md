# Tối ưu CPU/JS/bộ nhớ đảo 3D (opt-cpu)

Đo: `node tools/perf-opt-cpu.mjs --out=docs/perf/opt-cpu/<bước> --leak` — điện thoại 390×844 (UA iPhone, chất lượng mức 1, 13h),
**CPU chậm 4×**, 8 kịch bản × 60 s, rồi vào/ra 10 lần (sau 5 vòng khởi động). GPU giả lập SwiftShader (vẽ chạy bằng CPU, ~6–10 khung/s)
nên **ms tuyệt đối gồm cả vẽ giả lập** — chỉ so TRƯỚC/SAU. "Logic" = vòng lặp game trừ `post.render` (phần CPU của nhóm này).
TRƯỚC = mã gốc `3998c6b`; SAU = `claude/opt-cpu` (đã ghép cả phần GPU/lỗi của 2 nhóm kia). Cùng công cụ, cùng máy.
Tuỳ chọn: `--alloc` (cấp phát theo hàm) · `--dom` (thay đổi DOM/giây) · `--save-prof` (.cpuprofile) · `--only=a,b` · `--sec=N`.

| Kịch bản | JS/khung TB | p95 | p99 | Logic TB (trừ vẽ) | Logic p99 | Khung >33/>50/>100 ms | GC (lần · ms) | Heap đầu→cuối (MB) |
|---|---|---|---|---|---|---|---|---|
| Đi bộ/chạy quanh thị trấn | 75.4 → **66.7** | 112.3 → **112.7** | 150.3 → **164.8** | 29.8 → **26.2** | 69.5 → **81** | 409/401/41 → **473/369/37** | 108·638 → **106·441** | 217.9→239 · 243.5→295 |
| Đứng quảng trường (NPC/thú) | 72.5 → **63.4** | 107.5 → **95** | 147.9 → **120.4** | 25.7 → **18.6** | 58.3 → **57.4** | 374/367/28 → **419/330/10** | 68·220 → **68·258** | 250.6→255.5 · 267.2→282.3 |
| Học viện Pha Lê | 102.7 → **72.7** | 153.7 → **109.1** | 294.2 → **199.9** | 45.5 → **23.4** | 96 → **68.8** | 354/353/144 → **446/423/29** | 114·515 → **114·440** | 346→360.4 · 351.1→381 |
| Làng chài Vịnh Én | 59.1 → **48.6** | 87.4 → **72.3** | 113.7 → **103.6** | 24.5 → **15.4** | 51.1 → **33.7** | 549/390/14 → **629/211/8** | 393·1298 → **411·1363** | 373.9→307.2 · 408.2→270.6 |
| Bay máy bay | 68.3 → **51.2** | 117.4 → **79.9** | 148.9 → **108.5** | 21.6 → **15.4** | 78.4 → **61.3** | 395/323/36 → **515/216/9** | 122·635 → **166·660** | 309.8→312.9 · 279.4→276.2 |
| Đi phà | 56.4 → **46.2** | 84 → **66.8** | 98.6 → **85** | 19.5 → **14.7** | 42 → **35.6** | 571/345/5 → **634/185/2** | 58·182 → **82·247** | 340.1→344.5 · 271.9→291.9 |
| Mini game (cờ caro) | 65.5 → **48.8** | 104.3 → **73.3** | 130.7 → **91.1** | 17.9 → **13** | 43.2 → **29.2** | 477/388/32 → **598/211/3** | 463·1462 → **64·183** | 406.3→349 · 308.4→331.4 |
| Mở cặp/cửa hàng/bản đồ | 58.3 → **46.1** | 104.6 → **73.6** | 121.1 → **90.9** | 24.3 → **17.2** | 50.9 → **37.2** | 486/373/33 → **558/226/3** | 350·1114 → **293·906** | 357.8→349.8 · 313.6→306.4 |

| Vào/ra 10 lần (sau 5 vòng khởi động) | Heap MB | Lưới GPU | Texture GPU | Listener | setInterval |
|---|---|---|---|---|---|
| Mini game | +30.4 → **-0.4** | -5 → **+2** | +0 → **+6** | +0 → **+0** | +0 → **+0** |
| Học viện ↔ thị trấn | +302 → **+48.2** | +61 → **-42** | +308 → **-18** | +0 → **+0** | +0 → **+0** |
| Xe đạp + phà | -14.8 → **+2.9** | +13 → **+9** | +21 → **+2** | +0 → **+0** | +0 → **+0** |

**Module tốn nhất (TRƯỚC, ms/khung CPU 4×):**
- Đi bộ/chạy quanh thị trấn: school 4.13 · perf 3.95 · treasure 2.16 · collide 1.79 · eggs 0.86 · wild 0.55 · ambience 0.51 · academy 0.44
- Đứng quảng trường (NPC/thú): treasure 3.00 · perf 2.95 · ambience 2.19 · school 1.82 · collide 1.74 · academy 0.41 · train 0.35 · sea 0.33
- Học viện Pha Lê: academy 16.50 · perf 6.25 · treasure 3.43 · academyCreatures 1.97 · collide 1.87 · forest 1.16 · academyLife 1.16 · school 0.87
- Làng chài Vịnh Én: treasure 2.92 · perf 2.48 · sea 1.56 · collide 1.36 · school 0.76 · wild 0.66 · story 0.42 · academy 0.35
- Bay máy bay: perf 3.57 · collide 1.99 · treasure 1.81 · school 1.75 · wild 0.91 · aircraft 0.82 · eggs 0.53 · sea 0.44
- Đi phà: treasure 3.22 · perf 2.99 · sea 1.14 · lighthouse 0.96 · school 0.86 · collide 0.80 · story 0.42 · academy 0.41
- Mini game (cờ caro): mg 4.41 · perf 3.45 · treasure 1.66 · collide 1.64 · school 0.91 · academy 0.46 · train 0.44 · sea 0.39
- Mở cặp/cửa hàng/bản đồ: perf 3.27 · treasure 2.88 · worldMap 2.05 · sea 1.32 · school 0.90 · wild 0.81 · collide 0.59 · academy 0.49

**Module tốn nhất (SAU, ms/khung CPU 4×):**
- Đi bộ/chạy quanh thị trấn: perf 5.33 · collide 3.14 · school 3.07 · ambience 0.61 · wild 0.50 · academy 0.46 · eggs 0.40 · train 0.39
- Đứng quảng trường (NPC/thú): perf 3.80 · ambience 2.01 · collide 1.92 · school 1.71 · train 0.40 · academy 0.39 · wild 0.37 · eggs 0.32
- Học viện Pha Lê: perf 5.73 · academy 4.91 · collide 1.70 · academyCreatures 1.02 · academyLife 0.91 · alley 0.79 · school 0.79 · forest 0.60
- Làng chài Vịnh Én: perf 2.99 · sea 1.45 · school 0.72 · collide 0.70 · wild 0.62 · story 0.41 · academy 0.36 · train 0.34
- Bay máy bay: perf 3.37 · school 1.38 · aircraft 0.75 · wild 0.71 · terrain 0.42 · eggs 0.39 · train 0.39 · academy 0.36
- Đi phà: perf 3.31 · sea 1.01 · lighthouse 0.88 · school 0.75 · collide 0.51 · questsMod 0.39 · story 0.38 · academy 0.36
- Mini game (cờ caro): mg 3.56 · perf 3.32 · school 0.82 · collide 0.50 · sea 0.40 · academy 0.37 · eggs 0.37 · train 0.36
- Mở cặp/cửa hàng/bản đồ: perf 3.35 · worldMap 2.04 · sea 1.54 · school 0.80 · wild 0.61 · collide 0.46 · academy 0.36 · vehicles 0.36

**TOP 15 hàm self time — Quảng trường (TRƯỚC):**

| Hàm | ms/khung | % |
|---|---|---|
| `updateMatrixWorld three/build/three.module.js:7772` | 11.73 | 6.6 |
| `multiplyMatrices three/build/three.module.js:6262` | 4.67 | 2.6 |
| `projectObject three/build/three.module.js:30038` | 4.05 | 2.3 |
| `update island/treasure.js:172` | 2.88 | 1.6 |
| `applyMatrix4 three/build/three.module.js:4168` | 2.17 | 1.2 |
| `build island/cam-occlude.js:22` | 1.81 | 1 |
| `renderObject three/build/three.module.js:22551` | 1.45 | 0.8 |
| `WebGLRenderer.renderBufferDirect three/build/three.module.js:29463` | 1.2 | 0.7 |
| `setProgram three/build/three.module.js:30501` | 1.15 | 0.6 |
| `update three/build/three.module.js:33064` | 1.04 | 0.6 |
| `still island/perf.js:71` | 1.02 | 0.6 |
| `bindVertexArray :0` | 0.95 | 0.5 |
| `update three/build/three.module.js:18021` | 0.89 | 0.5 |
| `upload three/build/three.module.js:19283` | 0.84 | 0.5 |
| `intersectsObject three/build/three.module.js:13401` | 0.73 | 0.4 |

**TOP 15 hàm self time — Quảng trường (SAU):**

| Hàm | ms/khung | % |
|---|---|---|
| `updateMatrixWorld three/build/three.module.js:7772` | 11.96 | 7.6 |
| `multiplyMatrices three/build/three.module.js:6262` | 4.64 | 3 |
| `projectObject three/build/three.module.js:30038` | 3.78 | 2.4 |
| `renderObject three/build/three.module.js:22551` | 1.34 | 0.9 |
| `update three/build/three.module.js:33064` | 1.27 | 0.8 |
| `WebGLRenderer.renderBufferDirect three/build/three.module.js:29463` | 1.25 | 0.8 |
| `still island/perf.js:93` | 1.09 | 0.7 |
| `applyMatrix4 three/build/three.module.js:4168` | 1.03 | 0.7 |
| `setProgram three/build/three.module.js:30501` | 0.96 | 0.6 |
| `bindVertexArray :0` | 0.94 | 0.6 |
| `update three/build/three.module.js:18021` | 0.87 | 0.6 |
| `update island/perf.js:152` | 0.79 | 0.5 |
| `upload three/build/three.module.js:19283` | 0.69 | 0.4 |
| `arraysEqual three/build/three.module.js:18261` | 0.61 | 0.4 |
| `renderObject three/build/three.module.js:30323` | 0.6 | 0.4 |


## Đã sửa (mỗi mục 1 commit)
1. **cam-occlude.js**: cây BVH lập trong toạ độ cục bộ, tia đổi sang cục bộ → vật di chuyển không lập lại cây mỗi khung (~4,7 ms/khung CPU 4×).
2. **Ép tính bố cục**: `treasure`/`easter-eggs` đọc `innerHeight` mỗi khung → dùng `renderer.domElement.height` (treasure 3 → ~0 ms).
3. **pho-life.js**: `scene.getObjectByName` duyệt cả cảnh mỗi khung (9 ms ở Học viện) → tìm 1 lần/s khi chưa có.
4. **Rò rỉ khi dỡ khu** (`free.js` mới): Học viện/vùng dỡ ra giờ trả lưới + texture + texture xương; bỏ tham chiếu giữ khu đã dỡ
   (perf.js danh sách → WeakMap + quét lại, collide hàng chờ, vrm-npc `reg`, toon `unique` không vào bộ đệm, practice/alley biến module).
   Lưới/texture bộ đệm model + gradientMap đánh dấu `userData.shared` (không bị dispose).
5. Bản đồ không dựng lại nền mỗi lần mở (account.onChange gọi lại liên tục) · VRM người chơi: lò xo tóc/áo 30 Hz trên điện thoại · ẩn tab dừng AudioContext.
6. perf.js: hình cầu bao SkinnedMesh tính 1 lần mỗi lưới dùng chung (trước: biến đổi xương từng đỉnh mỗi người mới) · collide nghỉ khi bay cao ·
   creatures Học viện dùng lưới ô `ctx.grid` · thoát mini game xoá thanh nút (onclick giữ cả khu chơi).

## Còn lại / chưa đạt
- Mục tiêu JS ≤ 6 ms TB, p99 ≤ 16 ms (CPU 4×) **chưa đạt** trên máy đo: ~65 % khung là `post.render` (vẽ giả lập + draw call, phần nhóm GPU);
  logic còn ~13–26 ms (CPU 4×) ≈ 3–6 ms máy thật. Khung > 100 ms giảm mạnh (Học viện 144 → 29, mini game 32 → 3) nhưng chưa về 0: còn lúc nạp model/VRM, dựng người mới (`buildPerson`), biên dịch shader.
- perf.js là module tốn nhất sau khi ghép phần chia khối (`splitStep`) và `thaw` (~3 ms CPU 4×); collide lập chỉ mục nền (ngân sách theo thời gian thật của nhóm lỗi).
- Pool VRM NPC (5 trên điện thoại) đầy dần khi đổi khu — có giới hạn, không phải rò. Heap ~250–380 MB gồm cả iframe trường 2D (ngoài phạm vi).
- Một vòng lặp chính duy nhất đã có (ocean.js), 2 setInterval sống, net.js gửi 10 Hz cố định.
