# Kho tàng kiến thức thầy cô v62k — schema (1 file JSON / thầy cô)
File: school/tools/teachers-kb/<id>.json  (UTF-8, JSON hợp lệ, không comment)
{
 "id": "<id>",
 "topics": ["Chủ đề 1", ... 6 chủ đề],          // tiếng Việt, ngắn (≤ 22 ký tự)
 "cards": [                                       // ≥ 66 thẻ, mỗi chủ đề ≥ 10 thẻ
   {"tp": 0,            // chỉ số chủ đề trong topics
    "lv": 1,            // 1 = 8–10 tuổi, 2 = 11–12 tuổi, 3 = 13–15 tuổi (mỗi cấp ≥ 18 thẻ)
    "t": "Tiêu đề ngắn",                // ≤ 48 ký tự
    "vi": "Nội dung 2–4 câu ngắn, rõ, chính xác.",   // 120–380 ký tự
    "ex": "Ví dụ / mẹo nhớ 1 câu (tuỳ chọn)",
    "en": ["english keyword", "..."]   // 1–3 từ khoá tiếng Anh đúng chính tả
   }],
 "quiz": [                                        // ≥ 66 câu, mỗi chủ đề ≥ 10, mỗi cấp ≥ 18
   {"tp": 0, "lv": 1,
    "q": "Câu hỏi?",                      // ≤ 160 ký tự
    "a": ["đáp án A", "B", "C", "D"],     // đúng 4 lựa chọn, ngắn (≤ 60 ký tự), không trùng nhau
    "c": 2,                                // chỉ số đáp án đúng (0–3) — PHÂN BỐ ĐỀU 0/1/2/3, không dồn vào 0
    "why": "Giải thích 1–2 câu vì sao đúng.",
    "en": "english keyword"}],
 "stories": [ {"t": "Tiêu đề", "vi": "Câu chuyện khoa học/có thật 4–7 câu, kể vui", "en": ["kw"]} ],   // ≥ 8 chuyện
 "lessons": [ {"t": "Bài học hôm nay: …", "vi": "3–5 câu", "try": "Một việc nhỏ em làm thử được ở nhà, an toàn"} ]  // ≥ 10 bài
}
Quy tắc: kiến thức PHẢI chính xác (theo SGK Việt Nam + kiến thức khoa học chuẩn), phù hợp trẻ 8–15 tuổi,
không bạo lực/ghê sợ, không chính trị gây tranh cãi, không quảng cáo; số liệu chỉ dùng khi chắc chắn (làm tròn và ghi "khoảng").
Thí nghiệm "try" phải an toàn (không lửa, hoá chất mạnh, điện lưới); nếu cần người lớn thì ghi "nhờ bố mẹ".
Tên nhà khoa học/nhân vật lịch sử có thật được phép nhắc trong nội dung kiến thức.
