// hall.js — HỘI TRƯỜNG "NGƯỜI THẦY ÁNH SÁNG" (khoá 'reader', cửa "Hội trường / Nghe Người Thầy Ánh Sáng"): sân khấu ngoài trời ngay trong thế giới.
// Thầy kể 1 câu chuyện danh nhân (5 trang, chạm "Tiếp ▶" hoặc tự sang trang), trên màn chiếu hiện hình minh hoạ chữ lớn;
// em ngồi ghế hàng đầu cùng các bạn, nghe xong trả lời 3 câu hỏi hiểu bài. Nội dung tự viết theo sự kiện lịch sử phổ biến.
// Tỷ lệ vàng: sân khấu 13 × 8 m, cao 0,8 m; 3 hàng ghế cách nhau φ² ≈ 2,6 m; mỗi trang 8 s (Fibonacci).
import * as THREE from 'three';
import { PHI, batch, textSprite, pick } from '../sport/kit.js';
import { askBar } from '../quiz.js';

const Q = (q, a, w1, w2) => ({ q, a, choices: [a, w1, w2].sort(() => Math.random() - 0.5), why: `Đáp án: ${a}` });
const STORIES = [
  { who: 'Chu Văn An', icon: '📜', pages: ['Chu Văn An là người thầy nổi tiếng thời nhà Trần, hơn 700 năm trước.', 'Ông mở trường dạy học, học trò rất đông, nhiều người sau này đỗ đạt, làm quan giỏi.', 'Thấy quan nịnh thần làm hại dân, ông dâng “Thất trảm sớ” xin vua chém 7 kẻ nịnh.', 'Vua không nghe, ông từ quan về quê tiếp tục dạy học, sống giản dị.', 'Ông được tôn là “người thầy của muôn đời” — dạy chữ và dạy cả làm người.'],
    qs: [Q('Chu Văn An làm nghề gì?', 'dạy học', 'đánh cá', 'buôn bán'), Q('Ông dâng sớ xin chém mấy nịnh thần?', '7', '3', '10'), Q('Bài học từ thầy Chu Văn An?', 'sống ngay thẳng', 'nói dối cho vui', 'lười học')] },
  { who: 'Lương Thế Vinh', icon: '🐘', pages: ['Lương Thế Vinh đỗ Trạng nguyên năm 1463, rất giỏi toán.', 'Ông viết sách “Đại thành toán pháp” dạy cách tính toán, đo ruộng đất.', 'Có lần sứ giả đố cân con voi. Ông dắt voi xuống thuyền, đánh dấu mực nước.', 'Rồi đưa voi lên, chất đá vào thuyền đến đúng vạch, cân từng hòn đá: ra cân nặng của voi!', 'Toán học giúp giải những bài toán khó trong đời sống thật.'],
    qs: [Q('Lương Thế Vinh giỏi nhất môn gì?', 'toán', 'vẽ', 'hát'), Q('Ông cân voi nhờ vật gì?', 'chiếc thuyền', 'cái cân to', 'sợi dây'), Q('Ông đỗ danh hiệu gì?', 'Trạng nguyên', 'Bảng nhãn', 'Tú tài')] },
  { who: 'Nguyễn Hiền', icon: '🪁', pages: ['Nguyễn Hiền nhà nghèo, không được đến lớp.', 'Cậu đứng ngoài cửa lớp nghe thầy giảng, viết chữ lên lá chuối khô, lấy vỏ trứng thay đèn.', 'Cậu rất thích thả diều nhưng vẫn chăm học, đọc đâu nhớ đó.', 'Năm 13 tuổi, cậu đỗ Trạng nguyên — trạng nguyên nhỏ tuổi nhất nước ta.', 'Chăm chỉ và ham học giúp vượt qua mọi khó khăn.'],
    qs: [Q('Nguyễn Hiền đỗ Trạng nguyên năm bao nhiêu tuổi?', '13', '31', '20'), Q('Cậu viết chữ lên gì?', 'lá chuối khô', 'giấy vàng', 'bảng điện tử'), Q('Cậu bé thích chơi gì?', 'thả diều', 'đá bóng', 'đánh cờ')] },
  { who: 'Marie Curie', icon: '⚗️', pages: ['Marie Curie sinh ở Ba Lan năm 1867, rất ham đọc sách khoa học.', 'Thời đó con gái khó được học đại học, bà sang Pháp học và học rất giỏi.', 'Bà nghiên cứu chất phóng xạ, tìm ra 2 nguyên tố mới: Poloni và Radi.', 'Bà là người phụ nữ đầu tiên đoạt giải Nobel, và đoạt tới 2 giải Nobel!', 'Bà nói: “Không có gì trong cuộc sống đáng sợ, chỉ cần hiểu nó.”'],
    qs: [Q('Marie Curie đoạt mấy giải Nobel?', '2', '1', '5'), Q('Bà tìm ra nguyên tố nào?', 'Radi', 'Sắt', 'Vàng'), Q('Bà sinh ra ở nước nào?', 'Ba Lan', 'Việt Nam', 'Mỹ')] },
  { who: 'Thomas Edison', icon: '💡', pages: ['Thomas Edison hồi nhỏ hay hỏi “Tại sao?”, mẹ dạy cậu học ở nhà.', 'Ông lập phòng thí nghiệm và có hơn 1 000 phát minh.', 'Để làm bóng đèn sáng lâu, ông thử hàng nghìn vật liệu làm dây tóc.', 'Thất bại nhiều lần, ông nói: “Tôi đã tìm ra hàng nghìn cách không thành công.”', 'Kiên trì và không sợ sai là bí quyết của nhà phát minh.'],
    qs: [Q('Edison nổi tiếng với phát minh nào?', 'bóng đèn', 'máy bay', 'điện thoại di động'), Q('Ông có khoảng bao nhiêu phát minh?', 'hơn 1 000', '10', '3'), Q('Bài học từ Edison?', 'kiên trì', 'bỏ cuộc sớm', 'chỉ chơi')] },
];
const PAGE = 8;

export function startHall(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx;
  // sân khấu + phông + màn chiếu (1 khối gộp)
  { const b = batch(); b.box(13, 0.8, 8, 0, 0, -6, '#8a5a32'); b.box(13.4, 0.12, 8.4, 0, 0.8, -6, '#6b4426'); for (let i = 0; i < 4; i++) b.box(4, 0.2, 0.8, 0, i * 0.2, -1.6 + i * 0.4 - 1.2, '#7a5230');
    b.box(13, 6.5, 0.4, 0, 0.8, -9.8, '#7a2e3a'); for (const s of [-1, 1]) { b.box(0.6, 7.3, 0.6, s * 6.5, 0, -9.6, '#d8b85c'); b.box(1.6, 5.6, 0.25, s * 5.3, 0.9, -9.5, '#a8323f'); }
    b.box(1.1, 1.2, 0.7, 2.6, 0.8, -4.6, '#5d3a1e'); b.box(1.3, 0.12, 0.85, 2.6, 2.0, -4.6, '#d8b85c');
    root.add(b.mesh()); }
  const screen = textSprite('', { size: 2.6, w: 640, h: 256, font: 'bold 120px system-ui', bg: 'rgba(250,246,234,.96)', color: '#3b2a1e' }); screen.position.set(0, 4.4, -8.6); root.add(screen);
  const title = textSprite('🌟 NGƯỜI THẦY ÁNH SÁNG', { size: 0.8, w: 768, font: 'bold 64px system-ui', bg: 'rgba(122,46,58,.9)', color: '#ffd36e' }); title.position.set(0, 7.1, -8.9); root.add(title);
  // 3 hàng ghế (kit, instancing)
  { const b = batch(); for (let r = 0; r < 3; r++) for (const x of [-3.6, 0, 3.6]) { const z = 2.2 + r * PHI * PHI; b.box(3, 0.36, 0.55, x, 0, z, '#9b6b3e'); b.box(3, 0.5, 0.1, x, 0.36, z + 0.3, '#7a5230'); } root.add(b.mesh()); }   // ghế băng gỗ (gộp chung 1 khối)
  const story = pick(STORIES), st = { page: -1, t: 0, phase: 'talk', qi: 0, right: 0, over: false, live: true, ask: null };
  screen.userData.set(story.icon + ' ' + story.who);
  let teacher = null;
  api.actor('student-female-d', { name: 'Cô giáo', height: 1.6, look: { role: 'teacher', shirt: '#f4f1ea', pants: '#3d5a8f' } }).then(a => { if (!a || !st.live) return; teacher = a; a.place(-1.2, -4.4, 0); a.pos.y = 0.92; a.face(0, 6); });
  [['student-male-a', -1.6], ['student-female-b', 1.4]].forEach(([k, x]) => api.actor(k, {}).then(a => { if (!a || !st.live) return; a.place(x, 2.2 + 0.05, 0); a.yaw = Math.PI; a.sit('sit'); }));
  me.place(0.1, 2.2 + 0.05, Math.PI); me.yaw = Math.PI; me.sit('sit');
  api.cam.x = 0; api.cam.y = 2.4; api.cam.z = -2.4; api.cam.yaw = 0.18; api.cam.pitch = 0.3; api.cam.dist = innerWidth < innerHeight ? 17 : 14.5;
  const info = () => hud.info(st.phase === 'talk' ? `📖 Trang ${Math.max(1, st.page + 1)}/${story.pages.length}` : `❓ Câu ${st.qi + 1}/3`);
  function page(i) {
    st.page = i; st.t = 0;
    if (i >= story.pages.length) return quizStart();
    hud.msg(`<b>${story.who}</b> · ${story.pages[i]}`, 0); if (teacher) { teacher.say(i === 0 ? 'Các em nghe cô kể nhé!' : pick(['…', 'Các em có biết không?', 'Hay chưa nào!']), 1800); teacher.emote('interact'); }
    sfx('ui'); info(); hud.clearBar(); hud.button(i < story.pages.length - 1 ? 'Tiếp ▶' : 'Trả lời câu hỏi ▶', () => page(st.page + 1), 'on');
  }
  function quizStart() { st.phase = 'quiz'; st.qi = 0; screen.userData.set('❓ Đố vui'); ask(); }
  function ask() {
    if (st.qi >= story.qs.length) return end();
    const q = story.qs[st.qi]; info(); hud.msg(`❓ ${q.q}`, 0);
    st.ask = askBar(api, q, (ok, c) => { if (ok) { st.right++; sfx('ok'); me.emote('cheer'); hud.msg(`✅ Đúng rồi: ${q.a}!`, 1600); } else { sfx('land'); me.emote('no'); hud.msg(`❌ Chưa đúng — đáp án là <b>${q.a}</b>`, 2200); } st.qi++; setTimeout(() => st.live && ask(), ok ? 1300 : 2000); });
  }
  function end() {
    st.over = true; hud.clearBar(); hud.msg('', 0); if (teacher) teacher.say('Giỏi lắm!', 2000); me.sit(false); me.emote('cheer');
    api.end({ score: st.right * 10, title: st.right === 3 ? '🌟 Nghe hiểu tuyệt vời!' : '📖 Cảm ơn em đã lắng nghe', text: `Đúng ${st.right}/3 câu về <b>${story.who}</b>.<br>Mỗi lần vào hội trường cô kể một câu chuyện khác — hãy quay lại nghe tiếp nhé!` });
  }
  hud.msg(`🎤 Hội trường: cô kể chuyện <b>${story.who}</b> — nghe kỹ để trả lời 3 câu hỏi!`, 2600); setTimeout(() => st.live && page(0), 2400);
  return {
    key(e) { if (st.phase === 'talk' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight')) { e.preventDefault(); page(st.page + 1); } else if (st.ask && /^Digit[123]$/.test(e.code)) st.ask.answer(+e.code.slice(5) - 1); },
    update(dt) { if (st.over || st.phase !== 'talk' || st.page < 0) return; st.t += dt; hud.time(st.t); if (st.t > PAGE + story.pages[st.page].length / 21) page(st.page + 1); },
    dispose() { st.live = false; st.over = true; },
  };
}
