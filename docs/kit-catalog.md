# Kho model CC0 — `client/assets/models/kit/`

Dùng: `placeKit(scene, name, [[x,y,z,scale,rotY],…])` (instancing, `client/js/island/kit.js`). Kích thước là hộp bao gốc (X×Y×Z, đơn vị model ≈ m) trước khi scale; nhà Kenney rất nhỏ (≈1 đơn vị) → cần `scale` 5–8. Cột "Gợi ý" là scale tham khảo.
Tất cả CC0 (nguồn: `client/assets/CREDITS.txt`). Đã nén meshopt, gộp mesh/vật liệu, texture bảng màu ≤128 px (Kenney) / ≤512 px. Bảng mẫu: `docs/shots/assets/catalog.png` (tạo lại: mở `/tools/kit-preview.html`, `?filter=house_` để lọc).

**Tổng: 238 model · 6.0 MB.** Ngân sách: công trình nhỏ < 1.500 tam giác, cây/đá < 300 (⚠ = vượt, chỉ dùng ít/xa).

## Nhà & công trình (38)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `building_a` | 0.88×1.29×0.94 | 1252 | 27.7 | Nhà phố/cửa hàng A (Kenney Commercial) | scale ≈ 8.5 → rộng ~8 m |
| `building_b` | 0.97×1.29×0.94 | 1276 | 28 | Cửa hàng B | scale ≈ 8.2 → rộng ~8 m |
| `building_c` | 0.88×0.89×1.09 | 1195 | 26.8 | Cửa hàng C | scale ≈ 7.3 → rộng ~8 m |
| `building_d` | 0.84×1.29×0.9 | 1100 | 25.7 | Cửa hàng D | scale ≈ 8.9 → rộng ~8 m |
| `building_e` | 1.64×0.89×1.01 | 1509 ⚠ | 31.4 | Cửa hàng E | scale ≈ 4.9 → rộng ~8 m |
| `building_f` | 0.84×1.69×1.03 | 1794 ⚠ | 33.1 | Cửa hàng F | scale ≈ 7.8 → rộng ~8 m |
| `building_g` | 0.97×1.69×0.92 | 2006 ⚠ | 36.3 | Cửa hàng G | scale ≈ 8.2 → rộng ~8 m |
| `building_h` | 0.88×1.29×1.01 | 1512 ⚠ | 30.2 | Cửa hàng H | scale ≈ 7.9 → rộng ~8 m |
| `house_shop_i` | 1.24×1.68×1.3 | 2544 ⚠ | 50.6 | Cửa hàng I | scale ≈ 6.2 → rộng ~8 m |
| `house_shop_j` | 2.08×1.69×1.34 | 5246 ⚠ | 89.6 | Cửa hàng J | scale ≈ 3.8 → rộng ~8 m |
| `house_shop_k` | 2.08×1.47×0.94 | 2960 ⚠ | 56.9 | Cửa hàng K | scale ≈ 3.8 → rộng ~8 m |
| `house_shop_l` | 1.37×2.27×1.4 | 3512 ⚠ | 62.5 | Cửa hàng L | scale ≈ 5.7 → rộng ~8 m |
| `house_shop_m` | 1.24×3.15×1.24 | 3740 ⚠ | 63.4 | Cửa hàng M | scale ≈ 6.5 → rộng ~8 m |
| `house_shop_n` | 2.32×2.48×1.82 | 4350 ⚠ | 70.5 | Cửa hàng N | scale ≈ 3.4 → rộng ~8 m |
| `house_suburb_a` | 1.3×0.83×1.03 | 1174 | 32.7 | Nhà phố/biệt thự ngoại ô A | scale ≈ 6.2 → rộng ~8 m |
| `house_suburb_b` | 1.83×1.14×1.14 | 1748 ⚠ | 40.9 | Nhà ngoại ô B | scale ≈ 4.4 → rộng ~8 m |
| `house_suburb_c` | 1.29×1.03×1.03 | 1196 | 32.1 | Nhà ngoại ô C | scale ≈ 6.2 → rộng ~8 m |
| `house_suburb_d` | 1.76×1.24×1.03 | 1757 ⚠ | 41 | Nhà ngoại ô D | scale ≈ 4.5 → rộng ~8 m |
| `house_suburb_e` | 1.3×1.14×1.03 | 1731 ⚠ | 40.2 | Nhà ngoại ô E | scale ≈ 6.2 → rộng ~8 m |
| `house_suburb_f` | 1.43×1.14×1.41 | 1616 ⚠ | 40.1 | Nhà ngoại ô F | scale ≈ 5.6 → rộng ~8 m |
| `house_suburb_g` | 1.45×0.77×1.18 | 1067 | 32.2 | Nhà ngoại ô G | scale ≈ 5.5 → rộng ~8 m |
| `house_suburb_h` | 1.3×0.74×0.92 | 770 | 26.5 | Nhà ngoại ô H | scale ≈ 6.2 → rộng ~8 m |
| `house_suburb_i` | 1.29×0.74×1.03 | 800 | 27.2 | Nhà ngoại ô I | scale ≈ 6.2 → rộng ~8 m |
| `house_suburb_j` | 1.37×1.04×0.92 | 1210 | 32.4 | Nhà ngoại ô J | scale ≈ 5.8 → rộng ~8 m |
| `house_suburb_k` | 0.92×1.15×1.02 | 1024 | 29.8 | Nhà ngoại ô K | scale ≈ 7.8 → rộng ~8 m |
| `house_suburb_l` | 1.03×1.05×1.02 | 1310 | 34.2 | Nhà ngoại ô L | scale ≈ 7.8 → rộng ~8 m |
| `house_suburb_m` | 1.43×0.74×1.43 | 1112 | 32.1 | Nhà ngoại ô M | scale ≈ 5.6 → rộng ~8 m |
| `house_suburb_n` | 1.78×1.14×1.38 | 1612 ⚠ | 39.1 | Nhà ngoại ô N | scale ≈ 4.5 → rộng ~8 m |
| `house_suburb_o` | 1.27×1.14×1.03 | 1326 | 35.7 | Nhà ngoại ô O | scale ≈ 6.3 → rộng ~8 m |
| `house_suburb_p` | 1.24×0.92×0.99 | 1282 | 33.5 | Nhà ngoại ô P | scale ≈ 6.5 → rộng ~8 m |
| `house_suburb_q` | 1.24×0.92×0.89 | 1140 | 31 | Nhà ngoại ô Q | scale ≈ 6.5 → rộng ~8 m |
| `house_suburb_r` | 1.03×1.14×1.02 | 1030 | 30.9 | Nhà ngoại ô R | scale ≈ 7.8 → rộng ~8 m |
| `house_suburb_s` | 1.41×1.14×1.09 | 1212 | 33.3 | Nhà ngoại ô S | scale ≈ 5.7 → rộng ~8 m |
| `house_suburb_t` | 1.31×1.16×1.41 | 2062 ⚠ | 44.4 | Nhà ngoại ô T | scale ≈ 5.7 → rộng ~8 m |
| `house_suburb_u` | 1.43×1.14×1.09 | 1332 | 36.7 | Nhà ngoại ô U | scale ≈ 5.6 → rộng ~8 m |
| `house_tower_a` | 1.36×2.88×1.36 | 1292 | 32.9 | Toà nhà cao A |  |
| `house_tower_b` | 1.36×4.48×1.36 | 1592 ⚠ | 37 | Toà nhà cao B |  |
| `house_watchtower` | 3.05×2.78×3.05 | 248 | 16.1 | Chòi canh/cứu hộ |  |

## Cầu tàu / cầu (9)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `bridge_stone` | 1.04×0.4×1.04 | 252 | 5.8 | Cầu đá |  |
| `bridge_stone_arch` | 1.04×0.45×1.04 | 360 | 6.9 | Cầu đá vòm |  |
| `bridge_wood` | 1.04×0.4×1.04 | 220 | 6.2 | Cầu gỗ thẳng |  |
| `bridge_wood_arch` | 1.04×0.45×1.04 | 336 | 8.3 | Cầu gỗ vòm |  |
| `dock_frame` | 2.5×2.2×2.5 | 276 | 17.2 | Khung chòi gỗ |  |
| `dock_hut` | 3.09×3.4×3.23 | 348 | 18.8 | Chòi gỗ mái |  |
| `dock_planks` | 1.89×0.43×2.7 | 48 | 13.5 | Sàn ván |  |
| `dock_platform` | 2.5×1.31×2.51 | 324 | 18.7 | Cầu tàu gỗ (đoạn) |  |
| `dock_small` | 1.9×1.31×2.51 | 312 | 18.4 | Cầu tàu nhỏ |  |

## Thuyền & xe (25)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `boat_canoe` | 0.3×0.18×1.15 | 200 | 6.2 | Xuồng | scale ≈ 4.3 → dài ~5 m (thuyền nhỏ) |
| `boat_fishing` | 1.78×2.6×3.87 | 237 | 16.2 | Thuyền đánh cá nhỏ | scale ≈ 1.3 → dài ~5 m (thuyền nhỏ) |
| `boat_house_a` | 2.68×2.17×4.64 | 408 | 18.3 | Nhà thuyền A | scale ≈ 1.1 → dài ~5 m (thuyền nhỏ) |
| `boat_house_c` | 2.68×3×5.15 | 452 | 19.2 | Nhà thuyền C | scale ≈ 1.0 → dài ~5 m (thuyền nhỏ) |
| `boat_liner` | 4.76×8.93×15.2 | 1750 ⚠ | 38.7 | Tàu du lịch | scale ≈ 0.3 → dài ~5 m (thuyền nhỏ) |
| `boat_pirate_small` | 4.8×9.96×8.8 | 1461 | 34.8 | Thuyền buồm cổ | scale ≈ 0.6 → dài ~5 m (thuyền nhỏ) |
| `boat_row` | 2.75×0.85×2.85 | 174 | 14.8 | Thuyền chèo lớn | scale ≈ 1.8 → dài ~5 m (thuyền nhỏ) |
| `boat_row_small` | 2.75×0.85×2.37 | 168 | 15.3 | Thuyền chèo nhỏ | scale ≈ 1.8 → dài ~5 m (thuyền nhỏ) |
| `boat_sail_a` | 1.78×4.74×3.77 | 386 | 18 | Thuyền buồm A | scale ≈ 1.3 → dài ~5 m (thuyền nhỏ) |
| `boat_sail_b` | 1.78×4.48×4.07 | 426 | 18.4 | Thuyền buồm B | scale ≈ 1.2 → dài ~5 m (thuyền nhỏ) |
| `boat_ship_small` | 4.8×9.96×10.6 | 1723 ⚠ | 36.9 | Tàu nhỏ | scale ≈ 0.5 → dài ~5 m (thuyền nhỏ) |
| `boat_speed_a` | 1.79×1.5×3.37 | 156 | 15.5 | Ca nô A | scale ≈ 1.5 → dài ~5 m (thuyền nhỏ) |
| `boat_speed_e` | 2×1.46×2.87 | 265 | 16.6 | Ca nô E | scale ≈ 1.7 → dài ~5 m (thuyền nhỏ) |
| `boat_tug` | 1.79×2.24×3.47 | 471 | 20 | Tàu kéo | scale ≈ 1.4 → dài ~5 m (thuyền nhỏ) |
| `delivery_van` | 1.5×1.65×3.25 | 1620 ⚠ | 34.5 | Xe giao hàng |  |
| `sedan` | 1.5×1.3×2.55 | 1368 | 31.3 | Xe con |  |
| `taxi` | 1.5×1.5×2.75 | 1408 | 30.6 | Taxi |  |
| `tractor` | 1.34×1.6×2.2 | 2044 ⚠ | 40.9 | Máy cày |  |
| `van` | 1.5×1.35×2.75 | 1418 | 31.9 | Xe van |  |
| `vehicle_ambulance` | 1.5×1.8×3.25 | 2804 ⚠ | 55.7 | Xe cứu thương |  |
| `vehicle_firetruck` | 1.5×1.7×3.4 | 2767 ⚠ | 55.7 | Xe cứu hoả |  |
| `vehicle_police` | 1.5×1.3×3.1 | 2304 ⚠ | 52.8 | Xe cảnh sát |  |
| `vehicle_train_loco` | 0.67×0.43×0.27 | 740 | 26.2 | Đầu tàu hoả đồ chơi |  |
| `vehicle_train_wagon` | 0.72×0.31×0.21 | 934 | 27.4 | Toa tàu |  |
| `vehicle_truck` | 1.5×1.3×2.95 | 2082 ⚠ | 48.7 | Xe tải |  |

## Thể thao & vui chơi (7)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `sport_golf_flag` | 0.4×1.02×0.08 | 86 | 13.5 | Cờ lỗ golf |  |
| `sport_golf_windmill` | 1.2×1.56×1 | 282 | 16.2 | Cối xay sân mini golf |  |
| `sport_halfpipe` | 1×0.8×1 | 84 | 15.4 | Dốc trượt ván |  |
| `sport_rail` | 0.11×0.25×1 | 150 | 17.7 | Thanh trượt |  |
| `sport_ramp` | 1×0.31×1 | 104 | 16.7 | Dốc nhảy |  |
| `sport_scooter` | 0.32×0.44×0.69 | 410 | 22.2 | Xe trượt scooter |  |
| `sport_skateboard` | 0.32×0.18×0.69 | 432 | 21.7 | Ván trượt |  |

## Đồ vật đường phố / chợ / trường (79)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `barrel` | 0.2×0.25×0.17 | 56 | 3.6 | Thùng gỗ |  |
| `barrels` | 0.55×0.35×0.5 | 100 | 6.5 | Cụm thùng gỗ |  |
| `camp_bedroll` | 0.31×0.12×0.61 | 144 | 13 | Túi ngủ |  |
| `camp_fire_pit` | 0.28×0.11×0.27 | 305 | 15.7 | Bếp lửa đá |  |
| `camp_fire_stones` | 0.54×0.08×0.52 | 264 | 5.3 | Lửa trại vòng đá |  |
| `camp_tent` | 0.56×0.49×0.56 | 124 | 13.2 | Lều cắm trại |  |
| `camp_tent_canvas` | 0.56×0.49×0.56 | 148 | 13.5 | Lều bạt |  |
| `camp_tent_open` | 0.87×0.56×0.67 | 232 | 5.4 | Lều mở |  |
| `campfire` | 0.54×0.08×0.52 | 264 | 5.3 | Lửa trại |  |
| `chest` | 1.18×0.9×0.82 | 1676 ⚠ | 34.3 | Rương |  |
| `column` | 0.3×1×0.3 | 122 | 5.4 | Cột đá |  |
| `column_broken` | 0.3×0.7×0.3 | 108 | 4.1 | Cột gãy |  |
| `crate` | 0.55×0.37×1 | 628 | 23.2 | Thùng gỗ vuông · 3 anim |  |
| `farm_carrot` | 0.34×0.62×0.34 | 148 | 5.4 | Cà rốt (luống) |  |
| `farm_corn` | 0.44×1.25×0.44 | 300 | 8.3 | Ngô |  |
| `farm_dirt_row` | 1×0.05×0.62 | 44 | 3.4 | Luống đất |  |
| `farm_hay_bale` | 0.61×0.35×0.4 | 180 | 18.3 | Kiện rơm vuông |  |
| `farm_hay_round` | 0.61×0.38×0.43 | 364 | 22.6 | Bó rơm |  |
| `farm_pumpkin` | 0.44×0.33×0.45 | 120 | 5 | Bí ngô (luống) |  |
| `farm_wheat` | 0.54×0.53×0.45 | 360 | 9.2 | Lúa mì |  |
| `log` | 1×0.42×0.55 | 96 | 4.1 | Khúc gỗ |  |
| `obelisk` | 0.31×0.88×0.31 | 38 | 3.4 | Tháp đá |  |
| `prop_awning` | 0.4×0.4×0.15 | 40 | 15.1 | Mái hiên vải |  |
| `prop_awning_wide` | 0.8×0.4×0.15 | 40 | 15.2 | Mái hiên rộng |  |
| `prop_banner_arena` | 0.6×1.02×0.22 | 228 | 15.4 | Cờ sân đấu |  |
| `prop_banner_green` | 0.05×0.84×0.5 | 102 | 17.3 | Cờ treo xanh |  |
| `prop_banner_red` | 0.05×0.84×0.5 | 98 | 17.3 | Cờ treo đỏ |  |
| `prop_bench` | 1.12×0.73×0.63 | 160 | 17.8 | Ghế băng gỗ |  |
| `prop_bench_short` | 0.62×0.73×0.63 | 160 | 17.9 | Ghế băng ngắn |  |
| `prop_box` | 0.25×0.25×0.5 | 124 | 13.8 | Hộp gỗ lớn |  |
| `prop_bucket` | 0.14×0.19×0.14 | 68 | 12.2 | Xô gỗ |  |
| `prop_buoy` | 0.93×1.84×0.93 | 118 | 13.8 | Phao tiêu |  |
| `prop_buoy_flag` | 0.93×2.72×1.29 | 218 | 15.8 | Phao cờ |  |
| `prop_cannon` | 1.4×1.05×1.92 | 232 | 16.3 | Đại bác cổ |  |
| `prop_cart` | 0.89×0.54×1.34 | 608 | 24.1 | Xe đẩy gỗ chợ |  |
| `prop_cart_high` | 0.89×0.86×1.39 | 1028 | 31.2 | Xe đẩy thùng cao |  |
| `prop_column_arena` | 0.6×1×0.6 | 168 | 14.8 | Cột đá |  |
| `prop_container` | 1.38×1.1×2.76 | 160 | 14.8 | Container hàng |  |
| `prop_crate_bottles` | 1.08×1.06×1.31 | 572 | 27 | Thùng chai |  |
| `prop_fire_basket` | 0.42×0.17×0.42 | 196 | 17.5 | Giỏ lửa |  |
| `prop_firewood` | 0.21×0.06×0.09 | 64 | 12.1 | Bó củi |  |
| `prop_fish_large` | 0.31×0.16×0.1 | 233 | 18.6 | Cá lớn (đồ câu) |  |
| `prop_flag` | 1.34×2.1×0.4 | 144 | 15 | Cờ cột |  |
| `prop_fountain` | 2×0.48×2 | 1628 ⚠ | 41.3 | Đài phun nước tròn |  |
| `prop_heart` | 0.12×0.38×0.41 | 50 | 2.6 | Trái tim (vật phẩm) |  |
| `prop_jewel` | 0.33×0.37×0.29 | 12 | 2.2 | Ngọc (vật phẩm) |  |
| `prop_key` | 0.07×0.22×0.41 | 332 | 7.1 | Chìa khoá (vật phẩm) |  |
| `prop_ladder` | 0.08×1×0.38 | 104 | 2.8 | Thang |  |
| `prop_lamppost` | 0.21×1.27×0.46 | 352 | 20.6 | Cột đèn đường |  |
| `prop_lamppost_double` | 0.21×1.27×0.73 | 572 | 23.6 | Cột đèn đôi |  |
| `prop_lantern` | 0.22×1.56×0.22 | 158 | 18.2 | Đèn lồng cột |  |
| `prop_lantern_hanging` | 0.43×0.67×0.42 | 152 | 18.3 | Đèn lồng treo |  |
| `prop_lights` | 1.01×0.32×0.06 | 760 | 34.3 | Dây đèn màu |  |
| `prop_log_stack` | 0.42×0.35×0.71 | 184 | 5 | Đống gỗ |  |
| `prop_parasol_a` | 0.35×0.45×0.4 | 96 | 16 | Dù che quán A |  |
| `prop_parasol_b` | 0.35×0.45×0.4 | 120 | 16.5 | Dù che quán B |  |
| `prop_planter` | 0.4×0.18×0.3 | 204 | 18.4 | Bồn cây |  |
| `prop_pot_large` | 0.56×0.2×0.49 | 68 | 3.7 | Chậu lớn |  |
| `prop_pot_small` | 0.32×0.27×0.28 | 72 | 4.7 | Chậu nhỏ |  |
| `prop_shovel` | 0.07×0.29×0.03 | 124 | 12.6 | Xẻng |  |
| `prop_sign_single` | 0.21×0.46×0.04 | 28 | 11.5 | Biển chỉ 1 hướng |  |
| `prop_sign_wood` | 0.3×0.41×0.07 | 44 | 4.3 | Biển gỗ |  |
| `prop_signpost` | 0.21×0.46×0.04 | 44 | 11.8 | Biển chỉ đường |  |
| `prop_stall` | 0.65×0.37×1 | 106 | 17.4 | Quầy hàng mái vải |  |
| `prop_stall_bench` | 0.26×0.23×0.94 | 180 | 17.9 | Bàn bày hàng |  |
| `prop_stall_green` | 1×1.24×1 | 322 | 19.6 | Quầy hàng mái xanh |  |
| `prop_stall_red` | 1×1.24×1 | 270 | 19.2 | Quầy hàng mái đỏ |  |
| `prop_statue` | 0.7×1.34×0.7 | 549 | 22 | Tượng |  |
| `prop_statue_head` | 0.73×1×0.55 | 196 | 6.3 | Tượng đầu đá |  |
| `prop_stool` | 0.26×0.23×0.26 | 180 | 17.9 | Ghế đẩu gỗ |  |
| `prop_traffic_cone` | 0.48×0.6×0.48 | 172 | 21.1 | Cọc giao thông |  |
| `prop_trophy` | 0.57×0.48×0.45 | 244 | 16.3 | Cúp |  |
| `prop_urn` | 0.26×0.38×0.26 | 230 | 19.3 | Chum/lọ |  |
| `prop_watermill_wheel` | 0.85×1.8×1.8 | 600 | 24.6 | Guồng nước (bánh xe nước) |  |
| `prop_wheel` | 0.24×0.48×0.47 | 192 | 19.1 | Bánh xe gỗ |  |
| `prop_windmill_blades` | 0.47×3.11×3.11 | 732 | 29.2 | Cánh quạt cối xay gió (gắn lên tường/tháp) |  |
| `prop_workbench` | 0.33×0.29×0.3 | 236 | 15 | Bàn thợ mộc |  |
| `target` | 0.1×0.34×0.34 | 84 | 13.3 | Bia tập bắn |  |
| `tent` | 0.87×0.56×0.67 | 232 | 5.4 | Lều |  |

## Hàng rào & lối đi (13)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `fence` | 1×0.35×0.07 | 64 | 3.4 | Hàng rào |  |
| `fence_brick_wall` | 1×0.72×0.3 | 192 | 17.2 | Tường gạch |  |
| `fence_iron` | 1×0.88×0.11 | 376 | 22.3 | Rào sắt |  |
| `fence_iron_gate` | 1×0.76×0.22 | 256 | 19.5 | Cổng rào sắt |  |
| `fence_picket` | 0.48×0.27×0.07 | 88 | 15.8 | Rào sân nhà |  |
| `fence_picket_low` | 1.28×0.17×0.84 | 180 | 17.4 | Rào thấp sân nhà |  |
| `fence_planks` | 1×0.35×0.1 | 96 | 2.9 | Rào ván |  |
| `fence_simple` | 1×0.35×0.07 | 64 | 3.4 | Rào gỗ đơn |  |
| `fence_stone_wall` | 1×0.72×0.2 | 60 | 15.3 | Tường đá thấp |  |
| `fence_wood` | 0.07×0.38×1 | 84 | 16.7 | Hàng rào gỗ thị trấn |  |
| `fence_wood_curved` | 1×0.38×1 | 308 | 19.8 | Rào gỗ cong |  |
| `fence_wood_gate` | 0.07×0.38×1 | 560 | 22.3 | Cổng rào gỗ |  |
| `path_stones` | 0.16×0.01×0.36 | 36 | 15.2 | Lối đá lát |  |

## Cây cối & đá (55)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `bush` | 0.4×0.24×0.4 | 32 | 2.5 | Bụi cây |  |
| `bush_large` | 0.37×0.24×0.34 | 60 | 3.1 | Bụi lớn |  |
| `flower_red` | 0.16×0.29×0.18 | 76 | 4 | Hoa đỏ |  |
| `mushroom_red` | 0.12×0.25×0.14 | 48 | 3.5 | Nấm đỏ |  |
| `plant_beach_grass` | 1.11×0.52×1.24 | 144 | 15.7 | Cỏ bãi biển |  |
| `plant_bush_detailed` | 0.6×0.36×0.6 | 104 | 3.9 | Bụi chi tiết |  |
| `plant_bush_round` | 0.37×0.24×0.34 | 60 | 3.1 | Bụi tròn lớn |  |
| `plant_bush_small` | 0.38×0.21×0.34 | 16 | 2.3 | Bụi nhỏ |  |
| `plant_flower_purple` | 0.16×0.24×0.18 | 76 | 4 | Hoa tím |  |
| `plant_flower_red2` | 0.16×0.29×0.18 | 76 | 4 | Hoa đỏ |  |
| `plant_flower_yellow` | 0.16×0.19×0.18 | 76 | 4 | Hoa vàng |  |
| `plant_grass` | 0.41×0.25×0.41 | 224 | 5.8 | Bụi cỏ |  |
| `plant_hedge` | 0.25×0.25×1 | 54 | 16.8 | Bờ giậu thấp |  |
| `plant_hedge_gate` | 0.25×0.25×1 | 76 | 17.1 | Cổng bờ giậu |  |
| `plant_hedge_large` | 0.4×0.6×1 | 90 | 17.4 | Bờ giậu cao |  |
| `plant_lily` | 0.27×0.1×0.31 | 86 | 5.1 | Lá súng |  |
| `plant_mushroom_group` | 0.27×0.25×0.25 | 144 | 5.6 | Cụm nấm |  |
| `plant_palm_bend` | 2.88×4.25×3.22 | 338 ⚠ | 21 | Dừa nghiêng | scale ≈ 1.4 → cao ~6 m |
| `plant_palm_detailed` | 3.22×4.21×3.22 | 482 ⚠ | 24.8 | Dừa chi tiết thẳng | scale ≈ 1.4 → cao ~6 m |
| `plant_palm_detailed_bend` | 2.88×4.25×3.22 | 482 ⚠ | 24.8 | Dừa chi tiết nghiêng | scale ≈ 1.4 → cao ~6 m |
| `plant_palm_short` | 1.03×1.06×1.03 | 190 | 6 | Dừa thấp | scale ≈ 5.7 → cao ~6 m |
| `plant_palm_straight` | 2.49×4.21×2.49 | 338 ⚠ | 21.2 | Dừa thẳng | scale ≈ 1.4 → cao ~6 m |
| `plant_palm_tall` | 1.03×1.36×1.03 | 190 | 6 | Dừa cao | scale ≈ 4.4 → cao ~6 m |
| `plant_palm_tall_detailed` | 1.03×1.42×1.03 | 336 ⚠ | 8.9 | Dừa cao chi tiết | scale ≈ 4.2 → cao ~6 m |
| `plant_pine_round` | 0.62×1.37×0.71 | 204 | 5.4 | Thông tròn |  |
| `plant_sand_patch` | 7.74×0.56×6.04 | 636 ⚠ | 25.8 | Bãi cát có cỏ |  |
| `plant_stump_round` | 0.36×0.21×0.37 | 96 | 4.3 | Gốc cây |  |
| `plant_tree_blocks` | 0.6×1.19×0.6 | 132 | 4.4 | Cây khối | scale ≈ 5.0 → cao ~6 m |
| `plant_tree_cone` | 0.53×1.43×0.53 | 132 | 4.9 | Cây hình nón | scale ≈ 4.2 → cao ~6 m |
| `plant_tree_crooked` | 1.02×2.41×1.02 | 178 | 20.1 | Cây thân cong | scale ≈ 2.5 → cao ~6 m |
| `plant_tree_detailed` | 0.85×1.33×0.76 | 402 ⚠ | 10.7 | Cây chi tiết | scale ≈ 4.5 → cao ~6 m |
| `plant_tree_suburb` | 0.21×0.77×0.24 | 42 | 15.3 | Cây sân vườn lớn | scale ≈ 7.8 → cao ~6 m |
| `plant_tree_suburb_small` | 0.21×0.57×0.24 | 42 | 15.3 | Cây sân vườn nhỏ | scale ≈ 10.5 → cao ~6 m |
| `plant_tree_tall_round` | 1.02×2.75×1.02 | 126 | 18.4 | Cây cao tán tròn | scale ≈ 2.2 → cao ~6 m |
| `plant_tree_town` | 1.02×2.41×1.02 | 168 | 19.6 | Cây tán tròn | scale ≈ 2.5 → cao ~6 m |
| `rock_beach_a` | 5.11×3.21×4.39 | 552 ⚠ | 25 | Đá bãi cát A |  |
| `rock_beach_b` | 4.38×3.71×4.71 | 516 ⚠ | 24.2 | Đá bãi cát B |  |
| `rock_beach_c` | 3.71×2.61×3.72 | 448 ⚠ | 22.8 | Đá bãi cát C |  |
| `rock_large` | 0.78×0.26×1.02 | 80 | 4.2 | Đá lớn |  |
| `rock_nature_large` | 0.78×0.26×1.02 | 80 | 4.2 | Đá lớn |  |
| `rock_nature_tall` | 0.98×1×0.68 | 136 | 5.8 | Đá cao |  |
| `rock_shore_a` | 5.11×2.9×4.39 | 264 | 18.4 | Đá bờ biển A |  |
| `rock_shore_b` | 4.44×3.65×4.7 | 300 | 19.2 | Đá bờ biển B |  |
| `rock_shore_c` | 3.64×2.3×3.67 | 232 | 17.6 | Đá bờ biển C |  |
| `rock_small` | 0.36×0.19×0.36 | 16 | 3.1 | Đá nhỏ |  |
| `rock_tall` | 0.98×1×0.68 | 136 | 5.7 | Đá cao |  |
| `rock_wide` | 1.09×1.02×1.57 | 156 | 18.4 | Đá bẹt rộng |  |
| `stump` | 0.32×0.21×0.37 | 56 | 3.7 | Gốc cây |  |
| `tree_autumn` | 0.75×1.71×0.65 | 228 | 6.2 | Cây mùa thu | scale ≈ 3.5 → cao ~6 m |
| `tree_dark` | 0.75×1.71×0.65 | 114 | 4.6 | Cây lá sẫm | scale ≈ 3.5 → cao ~6 m |
| `tree_fat` | 0.76×1.15×0.65 | 50 | 3.7 | Cây tán to | scale ≈ 5.2 → cao ~6 m |
| `tree_oak` | 0.64×1.23×0.74 | 196 | 5.7 | Cây sồi | scale ≈ 4.9 → cao ~6 m |
| `tree_palm` | 1.03×1.36×1.03 | 190 | 6 | Cây dừa | scale ≈ 4.4 → cao ~6 m |
| `tree_pine` | 0.53×1.55×0.53 | 230 | 6 | Cây thông | scale ≈ 3.9 → cao ~6 m |
| `tree_pine_tall` | 0.39×1.53×0.39 | 134 | 4.9 | Thông cao | scale ≈ 3.9 → cao ~6 m |

## Khác (thú, đồ ăn, cũ) (12)

| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |
|---|---|---|---|---|---|
| `apple` | 0.2×0.19×0.2 | 136 | 14.2 | Táo |  |
| `carrot` | 0.34×0.72×0.34 | 148 | 14.8 | Cà rốt |  |
| `cat` | 121.43×172.92×200 | 2448 ⚠ | 65 | Mèo (animation) · 8 anim |  |
| `crab` | 200×118.89×109 | 3624 ⚠ | 72 | Cua (animation) · 10 anim |  |
| `deer` | 66.37×194.38×200 | 2096 ⚠ | 372.9 | Hươu (animation) · 26 anim |  |
| `fish` | 0.2×0.32×0.62 | 233 | 16.2 | Cá |  |
| `fox` | 36.09×91×200 | 1848 ⚠ | 411.8 | Cáo (animation) · 24 anim |  |
| `pug` | 82.89×151.56×200 | 644 | 56.2 | Chó pug (animation) · 2 anim |  |
| `pumpkin` | 0.42×0.23×0.42 | 188 | 15.4 | Bí ngô |  |
| `shiba` | 54.26×156.81×200 | 1950 ⚠ | 369.8 | Chó shiba (animation) · 24 anim |  |
| `stag` | 60.63×172.92×200 | 3667 ⚠ | 355.4 | Hươu đực (animation) · 26 anim |  |
| `watermelon` | 0.46×0.48×0.46 | 1376 | 37.9 | Dưa hấu |  |
