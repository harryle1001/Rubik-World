# Bộ kiểm tra tự động (v74q)

Một lệnh kiểm toàn bộ game 2D, xuất báo cáo tiếng Việt `tools/qa/report.html`.

## Chạy

```bash
cd school
node tools/qa/check.js              # bản từng file (js/…)
node tools/qa/check.js --bundle     # bản gói dist/ (?bundle) — chạy sau `cd tools/build && npm i && node build.js`
```

Tự bật máy chủ `tools/build/serve.js` ở cổng 8792 (nếu chưa chạy) và Playwright (Chromium có sẵn).
Một lượt đủ 3 cỡ màn hình (74 khu × 69 mini game) mất khoảng 35–40 phút; `--quick` khoảng 4 phút mỗi cỡ.

Tuỳ chọn:

| Tuỳ chọn | Ý nghĩa |
|---|---|
| `--vp=phone,land,desk` | chọn cỡ: điện thoại dọc 390×844 (chạm), ngang 844×390 (chạm), máy tính 1440×900 |
| `--quick` | chỉ ¼ số khu, ⅓ số mini game (vẫn đủ các bảng chính) — thử nhanh ~3 phút |
| `--only=zones,games,save,fps` | chỉ chạy phần đã chọn (phần tải + HUD luôn chạy) |
| `--soak=150` | số giây đứng yên trước khi đo lại FPS (mặc định 150 trên máy tính, 0 khi `--quick`) |
| `--update` | ghi lại ảnh chuẩn của các khu (sau khi chủ game duyệt thay đổi hình) |
| `--report-only` | chỉ dựng lại report.html từ kết quả đã có |
| `--port=8792` | đổi cổng máy chủ |

Mã thoát = 1 nếu có lỗi **Nặng** (dùng được trong CI).

## Kiểm những gì

1. **Kiểm tĩnh**: file trong `FILES` có tồn tại; `const/let/class` trùng tên toàn cục (sập game); hàm khai báo 2 lần (bản sau đè lặng lẽ); hàm bị bọc nhiều lớp nhất; module trong `js/` không còn trong `FILES` (chỉ liệt kê, không xoá).
2. **Tải trang**: lỗi console / `pageerror`, thời gian tải; **từng init trong `extFinalInit()`** có ném lỗi không và chạy bao lâu (bộ kiểm chèn bộ đếm vào *bản sao* `js/main.js` / bundle lúc trình duyệt tải — không sửa code game).
3. **Màn hình chính**: chữ `undefined` / `NaN` / `null`, chữ < 16px trên điện thoại, nút < 36px, nút bị phần tử khác che, trang cuộn ngang.
4. **Từng khu** (lấy từ `v54qPlaces()` = bản đồ + `V46.Z`): dịch chuyển tới, chụp ảnh, so với ảnh chuẩn `v74q/base/` (cho phép khác ≤ 18% vì NPC/mây/nước luôn động), thử đi 4 hướng để phát hiện nhân vật kẹt.
5. **Mini game & bảng** (`v54qGames()` + Lương, Cây thần kỳ, Thành tựu, Hành trình, Hangar, Đường bay Tia Lửa, TTTM): mở → quét chữ/nút → đóng (Esc, nút ✕, ép đóng); đếm `setInterval` và listener trên window/document còn sót sau 3 lần mở/đóng (rò rỉ).
6. **FPS** đứng yên, đi bộ, và **sau 150 giây chơi** (máy tính; `--soak=giây` để đổi) — bắt lỗi tích tụ làm game chậm dần.
7. **Lưu / tải hồ sơ**: ghi tiền, đồ, công lương, tiến độ truyện, cây thần kỳ → `saveProfile()` → tải lại trang, đăng nhập lại → so toàn bộ `PROF`.

## Kết quả

- `tools/qa/report.html` — báo cáo (mở bằng trình duyệt).
- `tools/qa/v74q/last.json`, `last-bundle.json` — dữ liệu thô.
- `tools/qa/v74q/out/` — ảnh nhỏ từng khu / mini game; `tools/qa/v74q/base/` — ảnh chuẩn.

Ghi chú tay (đã sửa / cần chủ game quyết / có thể dọn) nằm ở `v74q/notes.json`, được chèn vào đầu báo cáo.

## Thêm mục kiểm

Mini game mới: thêm một dòng `g('tên', () => hàmMở())` trong `games()` của chuỗi `HELP` trong `check.js`.
Bảng mới có id riêng: thêm id vào mảng `EX` (để nhận biết đang mở) và hàm đóng vào `close()`.
