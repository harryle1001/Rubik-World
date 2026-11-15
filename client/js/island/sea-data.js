// sea-data.js — Dữ liệu sinh vật biển dùng chung (Bách khoa biển trong sealife.js; phiên câu cá có thể tham khảo).
// Mỗi loài: id, icon, name (tiếng Việt), r (khoảng cách bấm E, m), fact (1 sự thật thú vị, đúng khoa học, hợp lứa tuổi học sinh).
// 13 loài trong Bách khoa biển (r: khoảng cách bấm E)
export const SPECIES = [
  { id: 'cahe', icon: '🐠', name: 'Cá hề', r: 3, fact: 'Cá hề sống chung với hải quỳ: lớp nhớt trên da giúp cá không bị xúc tu đốt, đổi lại cá xua đuổi kẻ thù của hải quỳ.' },
  { id: 'haiquy', icon: '🌺', name: 'Hải quỳ', r: 2.6, fact: 'Hải quỳ trông như bông hoa nhưng là động vật! Xúc tu có tế bào châm để bắt mồi nhỏ.' },
  { id: 'sanho', icon: '🪸', name: 'San hô', r: 2.6, fact: 'San hô là quần thể của hàng nghìn con polyp nhỏ xíu. Rạn san hô chiếm chưa tới 1% đáy biển nhưng là nhà của khoảng 1/4 số loài sinh vật biển.' },
  { id: 'dancan', icon: '🐟', name: 'Đàn cá', r: 5, fact: 'Cá bơi theo đàn để an toàn: cả đàn đổi hướng cùng lúc làm kẻ săn mồi bị rối mắt. Cá thở bằng mang, lọc ô-xi hoà tan trong nước.' },
  { id: 'rua', icon: '🐢', name: 'Rùa biển', r: 4, fact: 'Rùa biển thở bằng phổi và nín thở được rất lâu. Rùa cái quay về đúng bãi biển nơi nó nở ra để đẻ trứng.' },
  { id: 'caduoi', icon: '🪁', name: 'Cá đuối', r: 5, fact: 'Cá đuối manta có sải vây tới 7 m, lượn trong nước như cánh diều và ăn sinh vật phù du nhỏ li ti.' },
  { id: 'caheo', icon: '🐬', name: 'Cá heo', r: 13, fact: 'Cá heo là động vật có vú, thở bằng phổi qua lỗ thở trên đỉnh đầu, "nói chuyện" bằng tiếng huýt và tiếng lách cách.' },
  { id: 'sua', icon: '🪼', name: 'Sứa', r: 3.4, fact: 'Sứa không có não, không có tim, cơ thể khoảng 95% là nước. Nhiều loài tự phát sáng. Gặp sứa: đừng chạm vào!' },
  { id: 'cua', icon: '🦀', name: 'Cua', r: 2.6, fact: 'Cua bò ngang vì khớp chân gập sang hai bên. Bộ xương nằm bên ngoài (vỏ cứng) nên cua phải lột xác để lớn lên.' },
  { id: 'saobien', icon: '⭐', name: 'Sao biển', r: 2.2, fact: 'Sao biển không phải là cá! Mất một cánh, sao biển có thể mọc lại cánh mới.' },
  { id: 'caugai', icon: '🦔', name: 'Cầu gai', r: 2.2, fact: 'Cầu gai (nhím biển) dùng hàng trăm chân ống nhỏ để bò và gặm tảo. Gai rất nhọn — đừng giẫm lên!' },
  { id: 'taobe', icon: '🌿', name: 'Tảo bẹ', r: 3, fact: 'Tảo bẹ có thể dài thêm hơn nửa mét mỗi ngày, tạo thành "rừng dưới biển" che chở cho cá và nhiều sinh vật.' },
  { id: 'cobien', icon: '🌱', name: 'Cỏ biển', r: 2.6, fact: 'Cỏ biển là cây có hoa sống dưới nước: nhả ô-xi, giữ cát và là bãi ăn của rùa biển, bò biển.' },
];
