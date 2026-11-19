// races.js — Các trò đua dùng chung đường 3 làn runner.js (mỗi trò 1 cấu hình: mặt đường, vật cản, xe/ván, chủ đề câu hỏi).
import { runner } from './runner.js';

const R = (name, cfg) => ({ name, radius: 13, start: (ctx, { api }) => runner(ctx, api, cfg) });
export const races = {
  skate: R('🛹 Trượt ván phép tính', { topic: 'math', speed: 8, ride: 'sport_skateboard', rideSize: 0.9, rideH: 0.12, ground: '#a7adb5', side: '#86c46e', obst: 'cone', obstColor: '#ff8a3d',
    decor: [['plant_bush_round', 1.3, 8], ['prop_lamppost', 3.4, 17]],
    title: '🛹 Lái vào làn có <b>đáp án đúng</b> · vuốt lên để nhảy qua nón!', fact: 'Ván trượt chạy được lâu vì bánh xe ít ma sát. Khi trượt, luôn đội mũ bảo hiểm và đeo bọc gối nhé!' }),
  patin: R('⛸️ Trượt patin tiếng Anh', { topic: 'vocab', speed: 7.5, ground: '#6fc3c9', side: '#f3d9e6', line: '#fff6c8', obst: 'cone', obstColor: '#ff7aa8',
    decor: [['plant_flower_yellow', 0.9, 5], ['prop_lamppost', 3.4, 17]],
    title: '⛸️ Lái vào làn có <b>nghĩa tiếng Anh đúng</b> · vuốt lên để nhảy!', fact: 'Giày patin có bánh xe nhỏ nên dễ mất thăng bằng: hơi khuỵu gối, người nghiêng về trước và luôn đeo mũ bảo hiểm.' }),
  ski: R('⛷️ Trượt tuyết địa lý', { topic: 'geo', speed: 9, jump: false, ride: 'ski', ground: '#f4f8ff', side: '#e3edf7', line: '#9cc4e8', obst: 'pine', obstColor: '#2f7a4f',
    decor: [['tree_pine', 4.2, 6], ['rock_large', 1.4, 13]],
    title: '⛷️ Lái vào làn có <b>đáp án đúng</b> · né cây thông!', fact: 'Tuyết là nước đóng băng (thể rắn). Ván trượt rộng giúp chia đều sức nặng nên không lún xuống tuyết xốp.' }),
  kart: R('🏎️ Rubik Kart', { topic: 'math', speed: 10, boost: 7, jump: false, sit: true, seat: 0.22, ride: 'kart_a', rivalRides: ['kart_b', 'kart_c'], rideSize: 1.7, skip: /character/, ground: '#4a4f5a', side: '#7fbf6a', line: '#ffd36e', obst: 'tyre', obstColor: '#e8453c',
    decor: [['prop_traffic_cone', 0.7, 5], ['plant_tree_town', 4, 13]],
    title: '🏎️ Lái vào làn có <b>đáp án đúng</b> để lấy “Rubik tăng tốc” · né lốp xe!', fact: 'Xe chạy càng nhanh càng cần quãng đường dài để phanh. Ngồi xe luôn thắt dây an toàn nhé!' }),
};
