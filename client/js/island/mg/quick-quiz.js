// mg/quick-quiz.js — CÂU HỎI NHANH lồng vào mini game (dùng chung, không sửa host.js): hiện 1 câu trắc nghiệm trên thẻ .mg-card của host,
// trả về Promise<boolean>. Sai → giải thích ngắn rồi mới đóng. Ngân hàng câu: quiz-data.js (toán tự sinh, khoa học, biển…).
// Dùng: if (await quickQuiz(api, ['toan'], '💡 Trả lời đúng để mở gợi ý')) showHint();
import { pickQuestions } from '../quiz-data.js';
import { gradeQ } from './quiz.js';
import { qcard, isOpen } from '../quiz-ui.js';

export function quickQuiz(api, subjects = ['toan'], title = '🧠 Câu hỏi nhanh') {
  const card = api.hud.bar.parentElement.querySelector('.mg-card');
  if (!card || !card.hidden || isOpen()) return Promise.resolve(false);
  const S = { toan: 'toan', kh: 'kh', khoahoc: 'kh', tv: 'tv', lsdl: 'lsdl' }, subj = S[subjects[Math.floor(Math.random() * subjects.length)]], g = subj && Math.random() < 0.62 ? gradeQ(subj) : null;   // câu theo lớp 1–9 (quiz.js QZ)
  const q = g ? (() => { const ch = [g.a, ...g.wrong].sort(() => Math.random() - 0.5); return { q: g.q, choices: ch, a: ch.indexOf(g.a), explain: g.why, icon: `📘 Lớp ${g.g} ·` }; })() : pickQuestions(subjects, 1)[0];
  return qcard({ ava: '🧠', title, chip: q.icon || '', q: q.q, choices: q.choices, a: q.a, explain: q.explain || '', next: false,   // ✕ = bỏ qua câu này (không phạt)
    onPick: ok => { q.done && q.done(ok); api.onQuiz && api.onQuiz(ok); dispatchEvent(new CustomEvent('rw-learn', { detail: { s: q.subject || 'Mini game', ok } })); api.sfx(ok ? 'ok' : 'bad'); } }).then(r => !!(r && r.ok));
}
