// races.js — Các trò đua dùng chung đường 3 làn runner.js (mỗi trò 1 cấu hình: mặt đường, vật cản, xe/ván, chủ đề câu hỏi).
import { runner } from './runner.js';

const R = (name, cfg) => ({ name, radius: 34, start: (ctx, { api }) => runner(ctx, api, cfg) });
export const races = {
  skate: R('🛹 Trượt ván phép tính', { topic: 'math', speed: 8, ride: 'sport_skateboard', rideSize: 0.9, rideH: 0.12, ground: '#a7adb5', side: '#86c46e', obst: 'cone', obstColor: '#ff8a3d',
    decor: [['plant_bush_round', 1.3, 8], ['prop_lamppost', 3.4, 17]],
    title: '🛹 Lái vào làn có <b>đáp án đúng</b> · vuốt lên để nhảy qua nón!', fact: 'Ván trượt chạy được lâu vì bánh xe ít ma sát. Khi trượt, luôn đội mũ bảo hiểm và đeo bọc gối nhé!' }),
};
