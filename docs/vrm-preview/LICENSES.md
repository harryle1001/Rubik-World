# Giấy phép các mẫu nhân vật anime (VRM) — bản xem thử

Kiểm tra 2 lớp: (1) trang/README của nguồn, (2) **meta giấy phép nhúng trong chính file VRM** (đọc bằng script, ghi nguyên văn bên dưới).
Không dùng model trích từ Genshin/game khác, MMD nhân vật có bản quyền, hay nguồn không rõ giấy phép.

| id (client/assets/vrm/…) | Mẫu | Tác giả | Giấy phép | Điều khoản chính | Nguồn tải |
|---|---|---|---|---|---|
| shino | Sendagaya Shino | pixiv / VRoid | **CC0** | Từ bỏ bản quyền: dùng, sửa, bán, phân phối lại tự do; không cần ghi tên | [madjin/vrm-samples](https://github.com/madjin/vrm-samples) `vroid/beta/` |
| shibu | Sendagaya Shibu | pixiv / VRoid | **CC0** | như trên | như trên |
| fumiriya | Sakurada Fumiriya | pixiv / VRoid | **CC0** | như trên | như trên |
| hair-f | HairSample_Female | pixiv / VRoid | **CC0** | như trên | như trên |
| hair-m | HairSample_Male | pixiv / VRoid | **CC0** | như trên | như trên |
| vita | Vita | pixiv / VRoid | **CC0** | như trên | như trên |
| vivi | Vivi | pixiv / VRoid | **CC0** | như trên | như trên |
| sample-a | AvatarSample_A | VRoid (pixiv) | Điều khoản mẫu VRoid ("Other") | Meta: Everyone / thương mại Allow; theo README bản sao: "alter, distribute…" nhưng **không từ bỏ bản quyền** — trang gốc bị chặn, cần chủ dự án đọc lại trước khi phát hành | `vroid/stable/` cùng repo |
| seed-san | Seed-san | VirtualCast, Inc. | [VRM Public License 1.0](https://vrm.dev/en/licenses/1.0/) | avatarPermission everyone, commercialUsage **corporation**, allowRedistribution true, modification allowModificationRedistribution, **creditNotation required** (phải ghi "Seed-san model by VirtualCast, Inc.") | [vrm-c/vrm-specification/samples](https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san) |
| olivia | 100Avatars R1 — Olivia | Polygonal Mind | **CC0** | như CC0; phong cách low-poly, không phải anime | [ToxSam/open-source-avatars](https://github.com/ToxSam/open-source-avatars) `data/projects.json` (license CC0) → arweave.net |

Meta nhúng trong file (VRM 0.x, trường `meta`): tất cả mẫu VRoid ở trên ghi `allowedUserName: Everyone, commercialUssageName: Allow, violent/sexual: Allow`;
7 mẫu CC0 ghi `licenseName: "CC0"`; AvatarSample_A ghi `licenseName: "Other"`, author `VRoid`; Olivia ghi `CC0`, author `Polygonal Mind`.
Seed-san (VRM 1.0, `VRMC_vrm.meta`): như bảng. README của bản sao madjin dẫn lại trang chính thức:
"The CC license for these models is CC0 … Copyright is waived" và "AvatarSample_A・B・C … can be used freely, as long as you comply with their conditions of use. While copyright is not waived".

## Mẫu đã xem xét nhưng không đưa vào hàng
- Darkness_Shibu, Victoria_Rubin (CC0, VRoid) — trùng phong cách, để dự phòng.
- AvatarSample_B, C — cùng điều khoản như A.
- VRM1_Constraint_Twist_Sample (pixiv, VRM Public License 1.0, credit không bắt buộc, cấm dùng chống đối xã hội/thù ghét) — mẫu trong repo @pixiv/three-vrm; là mẫu kỹ thuật, dùng được nếu cần.
- fem_vroid / masc_vroid (tác giả "jin", licenseName Other, không có URL điều khoản) — **loại** vì không rõ giấy phép.
- VRoid Hub: phải đăng nhập mới tải → không dùng.

## Host bị chặn / không truy cập được từ môi trường này
- `vroid.pixiv.help` (trang điều khoản chính thức): **403 Cloudflare** → chưa đọc trực tiếp; dựa vào README bản sao + meta trong file. Chủ dự án nên mở trang
  https://vroid.pixiv.help/hc/en-us/articles/4402614652569 để xác nhận lần cuối trước khi phát hành.
- `github.com` trang web (HTML) và `api.github.com`: 403; `git clone` và `raw.githubusercontent.com` vẫn dùng được.
- `booth.pm`: chuyển hướng/đăng nhập → không lấy VRMA Motion Pack; chuyển động đi bộ được viết thủ tục trong trang (xương chuẩn hoá VRM), không dùng file animation ngoài.

## Thư viện
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) 3.5.5 — MIT (nạp qua cdn.jsdelivr.net trong trang xem thử; khi tích hợp sẽ chép vào dự án).
- three.js 0.169 — MIT. meshoptimizer (nén) — MIT.
