# Đảo Rubik – Mini · Đăng lên cổng game (Poki, CrazyGames, GameDistribution)

Bản rút gọn chơi một mình để có người chơi miễn phí + doanh thu chia sẻ quảng cáo, kéo người chơi về bản đầy đủ.

## 1. Bản Mini có gì
- Khu **Trường Rubik + quảng trường** (vào game đứng trước cổng trường), cả đảo vẫn đi được, xe đạp 🚲, khinh khí cầu 🎈, chổi bay 🧹, phép thuật.
- **Chương 1 · Khối Rubik Tri Thức**: khối Rubik trên quảng trường vỡ thành 7 mảnh → hoàn thành 7 mini game để ghép lại:
  Phòng Rubik 3D · Cờ caro khổng lồ · Cờ vua khổng lồ · Hội trường danh nhân · Lắp mạch điện · Khu vườn của em · Đua khinh khí cầu.
  Mini game khác hiện 🔒 "có trong bản đầy đủ". Đủ 7 mảnh → màn kết thúc (+ nút **Chơi bản đầy đủ** nếu cổng cho phép).
- Không server, không đăng nhập (tự vào chế độ khách); tiến độ lưu `localStorage` (`mini.story`, `island.*`). Không thu dữ liệu người chơi.
- Song ngữ: tiếng Việt + bộ chữ tiếng Anh cơ bản cho HUD/nút/cốt truyện (nút 🌐). Nội dung câu hỏi bài học vẫn tiếng Việt — ghi rõ trong mô tả.
- Điều khiển: chuột + bàn phím (WASD/phím mũi tên, E, Space…) và cảm ứng (cần điều khiển ảo + nút).

Mã: `client/js/island/portal/` — `portal.js` (adapter SDK), `mini.js` (chương 1, khoá game, quảng cáo, âm thanh), `i18n.js` (tiếng Anh).
Bản đầy đủ không nạp các file này; chỉ `scripts/build-portal.sh` vá `ocean.js` để nạp.

## 2. Build
```bash
bash scripts/build-portal.sh                 # → dist/portal/{poki,crazygames,gamedistribution,none}/ + poki.zip, crazygames.zip, gamedistribution.zip
FULL_URL=https://ten-mien-ban-day-du GD_GAME_ID=<id GD> bash scripts/build-portal.sh
```
- Thư mục tĩnh tự chứa: three.js 0.169 (bản min) + addon chép vào `lib/`, đường dẫn tương đối, mở được trong iframe/thư mục con.
- 3 bản chỉ khác dòng `window.PORTAL = { target, gdId, fullUrl }` trong `index.html`. `none/` = chạy thường không SDK (thử máy / web riêng).
- Model `.glb`, âm thanh, VRM để riêng từng file → chỉ tải khi cần (tải lười).

### Số đo (Playwright, Chromium GPU giả lập SwiftShader, máy chủ tĩnh cục bộ, trong iframe)
| | Tải tới lúc vào chơi | Tổng sau 5 s | Thời gian tới lúc vào chơi | Lỗi console của game |
|---|---|---|---|---|
| none (không SDK) | 10,9 MB | 16,4 MB | 14,3 s | 0 |
| poki | 11,3 MB | 19,6 MB | 13,7 s | 0 (1 cảnh báo COOP của SDK vì chạy http) |
| crazygames | 11,0 MB | 16,3 MB | 14,0 s | 0 |
| gamedistribution | 12,9 MB | 19,6 MB | 14,3 s | 0 (1 lỗi `browsingTopics` từ chính SDK GD với id giả) |
| poki · điện thoại (iPhone 13 giả lập) | 11,3 MB | 19,7 MB | 26,6 s | 0 |

Byte chưa nén; CDN của cổng nén gzip/brotli (JS ~¼). Thời gian là GPU phần mềm — máy thật nhanh hơn nhiều.
Cả bản: ~935 file, 79 MB, zip 54 MB (CrazyGames: ≤ 50 MB tải ban đầu, ≤ 250 MB tổng, ≤ 1500 file → đạt).
Poki khuyên tải ban đầu càng nhỏ càng tốt (họ nói người chơi bỏ đi nếu tải > 10 s, game web tốt ≈ 5 MB ban đầu): phần lớn ban đầu là nhân vật `hero-rogue.glb` (1,9 MB) và VRM bạn học gần cổng (~5 MB) — có thể hoãn VRM tới sau khi vào game nếu Poki yêu cầu.

## 3. SDK — `portal.js`
| Việc | Poki | CrazyGames (SDK v3) | GameDistribution |
|---|---|---|---|
| Script | `game-cdn.poki.com/scripts/v2/poki-sdk.js` | `sdk.crazygames.com/crazygames-sdk-v3.js` | `html5.api.gamedistribution.com/main.min.js` |
| Khởi tạo | `PokiSDK.init()` | `CrazyGames.SDK.init()` (environment `disabled` → coi như không SDK) | `window.GD_OPTIONS = { gameId, onEvent }` |
| Bắt đầu tải / tải xong | — / `gameLoadingFinished()` | `game.loadingStart()` / `game.loadingStop()` | — |
| Bắt đầu / dừng chơi | `gameplayStart/Stop()` | `game.gameplayStart/Stop()` | — |
| Quảng cáo giữa màn | `commercialBreak(onStart)` | `ad.requestAd('midgame', {adStarted, adFinished, adError})` | `gdsdk.showAd('interstitial')` + `SDK_GAME_PAUSE/START` |
| Có thưởng | `rewardedBreak(onStart)` → `success` | `ad.requestAd('rewarded', …)` | `gdsdk.showAd('rewarded')` + `SDK_REWARDED_WATCH_COMPLETE` |
| Link ngoài | `PokiSDK.openExternalLink(url)` | ẩn nút | ẩn nút |

Cách dùng trong game:
- Tải xong (màn che mở) → `loadingFinished()` + `gameplayStart()`. Mở bảng chương truyện → `gameplayStop()`; đóng → `gameplayStart()`.
- **Quảng cáo giữa màn chỉ khi bấm "Chơi lại"/"Thoát" ở thẻ kết quả của mini game** — không bao giờ giữa lúc học/chơi. Không tự đếm giờ (cổng tự giới hạn tần suất, theo yêu cầu của Poki/CrazyGames).
- **💡🎬 Gợi ý** (có thưởng, tuỳ chọn) trong 7 mini game: xem hết quảng cáo → mẹo học tập cho game đó. Chặn quảng cáo → không thưởng, game vẫn chơi được, không có thông báo "ad blocked".
- Âm thanh: tự tắt (suspend AudioContext dùng chung) khi quảng cáo chạy, tab bị ẩn, hoặc iframe mất focus; bật lại khi quay về.
- SDK lỗi/bị chặn → tự chuyển "không SDK", game chạy bình thường.

### An toàn trẻ em / COPPA
- Game không thu dữ liệu: không tài khoản, không server, không phân tích bên thứ ba, không link ngoài (trừ nút Poki qua `openExternalLink`). Mọi lưu trữ là `localStorage` trên máy.
- Tài liệu công khai đã đọc **không có cờ SDK riêng cho trẻ em** ở cả 3 cổng; việc đánh dấu "dành cho trẻ em" và quảng cáo không cá nhân hoá được cổng xử lý theo khai báo khi nộp game → khi nộp, chọn đối tượng **trẻ em / gia đình (Kids, Educational)** và khai báo game dành cho học sinh tiểu học–THCS. GD: xử lý sự kiện `SDK_GDPR_TRACKING/TARGETING` là việc của SDK, game không theo dõi gì nên không cần thêm.
- Cần xác nhận lại với từng cổng khi đăng ký (chính sách có thể đổi).

## 4. Đăng ký & nộp game (chủ dự án làm)
### Poki — developers.poki.com
1. Đăng ký tài khoản nhà phát triển (Poki duyệt hồ sơ/giới thiệu game trước; gửi link bản `none/` chạy thử hoặc video).
2. Khi được mời: tạo game trong Poki for Developers, tải `poki.zip`, kiểm tra bằng **Poki Inspector** (inspector.poki.dev).
3. Điền mô tả/ảnh bên dưới, chờ QA kiểm tra theo trang Requirements.
### CrazyGames — developer.crazygames.com
1. Tạo tài khoản → Submit game → tải `crazygames.zip` (HTML5), chọn "Full implementation" (có SDK).
2. Dùng chế độ Preview/QA tool của họ để thử quảng cáo giả. Tải ảnh bìa landscape 1920×1080, portrait 800×1200, square 800×800.
### GameDistribution — gamedistribution.com/developers
1. Tạo tài khoản → Upload game → nhận **Game ID** → build lại với `GD_GAME_ID=<id>` → tải `gamedistribution.zip`.
2. Ảnh: 512×512, 512×384, 200×120 (thu nhỏ từ 512×384). Chờ QA.

### Ảnh (thư mục `docs/portals/`)
- Bìa (tiếng Anh + Việt): `cover-1920x1080-*.jpg`, `cover-1280x720-*`, `cover-800x1200-*`, `cover-800x800-*`, `cover-512x512-*`, `cover-512x384-*`. Nguồn: `cover.html` (nền = cảnh thật `cover-scene.jpg`); render lại bằng Playwright mở `cover.html?lang=en` ở kích thước cần.
- 5 ảnh chụp 1280×720 (tiếng Anh): `shot-1-plaza.jpg`, `shot-2-chapter.jpg`, `shot-3-chess.jpg`, `shot-4-rubik.jpg`, `shot-5-caro.jpg`; điện thoại: `shot-mobile.jpg`.

### Mô tả
**EN — Rubik Island Mini**
> A cozy 3D open-world school island where you learn by playing! A great wind has shattered the Rubik Cube of Knowledge into 7 pieces. Explore Rubik School by bike, hot-air balloon or flying broom, and win back every piece in 7 brain challenges: solve a 3D Rubik's cube, play giant chess and tic-tac-toe, build an electric circuit, grow a garden, race balloons and meet great people in the Hall. Made for kids — no account, no chat. Quiz content is in Vietnamese with basic English UI.
>
> Controls: WASD / arrows to move, mouse to look, E to interact, Space to jump · Touch: joystick + buttons.

**VI — Đảo Rubik Mini**
> Hòn đảo trường học 3D thế giới mở — vừa học vừa chơi! Một cơn gió lớn làm Khối Rubik Tri Thức vỡ thành 7 mảnh. Hãy khám phá Trường Rubik bằng xe đạp, khinh khí cầu hay chổi bay, và giành lại từng mảnh qua 7 thử thách trí tuệ: giải Rubik 3D, cờ vua và cờ caro khổng lồ, lắp mạch điện, chăm vườn, đua khinh khí cầu, nghe chuyện danh nhân. Dành cho học sinh — không cần tài khoản, không chat.
>
> Điều khiển: WASD / mũi tên để đi, chuột để nhìn, E tương tác, Space nhảy · Cảm ứng: cần điều khiển + nút.

Thể loại gợi ý: Educational · Puzzle · Adventure/3D. Tag: kids, school, rubik, chess, learning, open world.

## 5. Nguồn tài liệu (đọc 2026-11-19)
- Poki SDK HTML5: https://developers.poki.com/guide/sdk-html5 · Requirements: https://developers.poki.com/guide/requirements-quality · Engine/kích thước: https://developers.poki.com/guide/web-engine
- CrazyGames SDK: https://docs.crazygames.com/sdk/intro/ · Video ads: https://docs.crazygames.com/sdk/video-ads/ · Requirements: https://docs.crazygames.com/requirements/intro · Ads: https://docs.crazygames.com/requirements/ads/
- GameDistribution: https://github.com/GameDistribution/GD-HTML5 · https://gamedistribution.com/developers/faq/ (trang SDK của GD dựng bằng JS, không đọc được nội dung; API `GD_OPTIONS`/sự kiện lấy từ hướng dẫn tích hợp công khai https://developer.yes2games.com/docs/gamedistribution — nên đối chiếu lại trong bảng điều khiển GD).

## 6. Kiểm tra lại
```bash
bash scripts/build-portal.sh
cd dist/portal/none && python3 -m http.server 8080   # mở http://localhost:8080 (hoặc nhúng iframe)
```
Danh sách: vào game < 20 MB · không lỗi console · bảng 🧩 mở được, 7 thử thách dịch chuyển tới đúng cửa · game khác 🔒 · thẻ kết quả → mảnh +1 · Chơi lại/Thoát → quảng cáo (bản cổng) · đổi 🌐 EN/VI · chuyển tab → im tiếng.
