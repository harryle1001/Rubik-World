// ================= EXT50 (v44 · Session 3): Coach Ru 2.0 — a clean chat window only (like a pro AI chat app), a funny
// male teacher with a low, warm voice who teases kindly, asks back, answers anything, and pays well for solved riddles =================
const V44C = {RID_EACH:15, RID_DAY:60};
function v44CoachRules(){
  const ctxJ = (() => { try { return v40Ctx(); } catch(e){ return '{}'; } })();
  return `Bạn là "Thầy Ru" (Coach Ru), thầy giáo nam trong game The Rubik School của bạn Hà Quân, nói chuyện với học sinh 6–15 tuổi ở Việt Nam.
TÍNH CÁCH:
- Giọng thầy nam trầm ấm, cực kỳ hài hước, hay trêu đùa nhẹ nhàng cho các em cười (ví dụ gọi vui "cao thủ", "nhà thông thái nhí"), không bao giờ chê bai hay làm các em buồn.
- Dù học sinh nói gì cũng vui vẻ, cười ha ha, khen chỗ hay rồi hỏi lại một câu để các em suy nghĩ thêm.
- Hay đùa rằng mình là "nhà vô địch Olympia số 1 của trường Rubik" (đây là câu đùa của nhân vật, không nói là thành tích có thật).
- Trả lời được mọi câu hỏi: học tập, khoa học, lịch sử, tiếng Anh, Rubik, cờ, đời sống… giải thích dễ hiểu, có ví dụ vui.
- Thỉnh thoảng (khoảng mỗi 3–4 lượt) ra MỘT câu đố vui hoặc câu hỏi Olympia vừa sức. Khi học sinh giải đúng câu đố của thầy, gọi công cụ give_reward với amount ${V44C.RID_EACH} và lý do là tên câu đố; khen thật to.
CÁCH TRẢ LỜI:
- ${V40.en ? 'ENGLISH MODE: simple English, short sentences, gently fix mistakes.' : 'Tiếng Việt tự nhiên, tối đa 5 câu ngắn, có thể kèm 1 từ tiếng Anh như "planet (hành tinh)".'}
- Bài tập: gợi ý từng bước trước, chỉ cho đáp án khi học sinh đã thử 2 lần hoặc xin đáp án.
- Không dùng markdown, tiêu đề hay bảng; có thể dùng 1–2 emoji.
AN TOÀN TRẺ EM (bắt buộc):
- Không hỏi hay ghi lại thông tin cá nhân (tên thật đầy đủ, địa chỉ, trường, số điện thoại, ảnh), không hẹn gặp ngoài đời.
- Không đóng vai bác sĩ. Chuyện buồn, bắt nạt, nguy hiểm, sức khoẻ: an ủi ngắn gọn và khuyên em nói ngay với bố mẹ hoặc thầy cô.
- Nội dung không hợp lứa tuổi: từ chối vui vẻ và đổi sang chủ đề khác.
NGỮ CẢNH GAME (JSON): ${ctxJ}
${V40.summary ? 'TÓM TẮT TRƯỚC ĐÓ: ' + V40.summary : ''}`;
}
// riddle rewards: $15 each, up to $60 a day (other Coach rewards keep their small cap)
function v44Give(amount, reason){ const L = v40Count(0), want = Math.max(0, Math.min(V44C.RID_EACH, Math.round(amount || 0))), left = Math.max(0, V44C.RID_DAY - (L.paid || 0)), g = Math.min(want, left);
  if(g > 0){ L.paid = (L.paid || 0) + g; v40SaveLocal(L); reward(8, g, 'Thầy Ru: ' + String(reason || 'giải đố').slice(0, 60)); try { v39Sfx('reward', .6); } catch(e){} }
  return {given:g, left_today:left - g}; }
// a low, warm male voice: prefer a Vietnamese system voice with a lowered pitch
function v44Voice(){ try { const L = speechSynthesis.getVoices().filter(v => /^vi/i.test(v.lang)); if(!L.length) return null; return L.find(v => /nam|male|minh|an\b|duc|đức|hoang|quang|tuan/i.test(v.name)) || L[0]; } catch(e){ return null; } }
async function v44Say(text){ if(!V40.speak || !text) return; const t = String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').slice(0, 1600);
  if(!V40.en && 'speechSynthesis' in window){ const v = v44Voice(); if(v){ try { const u = new SpeechSynthesisUtterance(t); u.voice = v; u.lang = v.lang; u.pitch = .62; u.rate = .95; speechSynthesis.cancel(); speechSynthesis.speak(u); return; } catch(e){} } }
  if(V40.tts){ try { await V40.tts.speak(t, V40.en ? {language:'en', rate:.85} : {rate:.95}); return; } catch(e){} }
  try { const u = new SpeechSynthesisUtterance(t); u.lang = V40.en ? 'en-US' : 'vi-VN'; u.pitch = .62; u.rate = .95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} }
function v44CoachInit(){
  v40Rules = v44CoachRules; v40Give = v44Give; v40Say = v44Say;
  const vt = v40Tools; v40Tools = function(){ return vt().map(t => t.name === 'give_reward' ? Object.assign({}, t, {description:'Gives the student coins. Use amount ' + V44C.RID_EACH + ' right after they correctly solve one of the riddles or Olympia questions from Thầy Ru (max ' + V44C.RID_EACH + ' per call, ' + V44C.RID_DAY + ' per day). Returns {given, left_today}.', execute:i => v44Give(+i.amount, String(i.reason || ''))}) : t); };
  try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch(e){}
  // the separate Coach button is gone: talk to Coach Ru by walking up to him (or Menu › AI Coach)
  const b = $('#v40Btn'); if(b) b.remove();
  // a cleaner window: name + online dot, chat, input; greeting in the new voice
  const p = $('#v40Coach'); if(p){ p.classList.add('v44chat'); const nm = $('#v40Name'); if(nm) nm.textContent = 'Thầy Ru'; const inp = $('#v40In'); if(inp) inp.placeholder = 'Nhắn cho Thầy Ru… hỏi gì cũng được!'; }
  const op = v40Open; v40Open = async function(){ const fresh = !$('#v40Log') || !$('#v40Log').childElementCount; await op.apply(this, arguments);
    const log = $('#v40Log'); if(fresh && log && log.firstChild && log.firstChild.classList.contains('coach')){ log.firstChild.textContent = 'Ha ha, chào cao thủ nhí! Thầy Ru đây, nhà vô địch Olympia số 1 của trường Rubik (tự phong đấy 😄). Em muốn hỏi gì nào? Giải được câu đố của thầy là có thưởng to nhé!'; }
    const sb = $('#v40Sub'); if(sb) sb.textContent = V40.sample ? '● Đang trực tuyến' : '● Chế độ offline'; };
  const hd = v40Head; v40Head = function(){ hd.apply(this, arguments); const nm = $('#v40Name'); if(nm) nm.textContent = 'Thầy Ru'; const sb = $('#v40Sub'); if(sb) sb.textContent = V40.sample ? '● Đang trực tuyến' : '● Chế độ offline'; };
}
