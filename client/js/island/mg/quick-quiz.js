// mg/quick-quiz.js — CÂU HỎI NHANH lồng vào mini game (dùng chung, không sửa host.js): hiện 1 câu trắc nghiệm trên thẻ .mg-card của host,
// trả về Promise<boolean>. Sai → giải thích ngắn rồi mới đóng. Ngân hàng câu: quiz-data.js (toán tự sinh, khoa học, biển…).
// Dùng: if (await quickQuiz(api, ['toan'], '💡 Trả lời đúng để mở gợi ý')) showHint();
import { pickQuestions } from '../quiz-data.js';

export function quickQuiz(api, subjects = ['toan'], title = '🧠 Câu hỏi nhanh') {
  const card = api.hud.bar.parentElement.querySelector('.mg-card');
  if (!card || !card.hidden) return Promise.resolve(false);
  const q = pickQuestions(subjects, 1)[0];
  return new Promise(res => {
    card.innerHTML = `<h3 style="font-size:17px">${title}</h3><p style="margin:8px 0">${q.icon || ''} ${q.q}</p><div class="qq" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>`;
    const box = card.querySelector('.qq');
    q.choices.forEach((c, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.style.margin = '0';
      b.onclick = () => {
        const ok = i === q.a; dispatchEvent(new CustomEvent('rw-learn', { detail: { s: q.subject || 'Mini game', ok } })); box.querySelectorAll('button').forEach((x, k) => { x.disabled = true; if (k === q.a) x.className = 'pri'; });
        api.sfx(ok ? 'ok' : 'bad');
        const p = document.createElement('p'); p.innerHTML = ok ? '✅ <b>Chính xác!</b>' : `❌ Chưa đúng. ${q.explain || ''}`; card.appendChild(p);
        setTimeout(() => { card.hidden = true; res(ok); }, ok ? 900 : 2600);
      };
      box.appendChild(b);
    });
    card.hidden = false;
  });
}
