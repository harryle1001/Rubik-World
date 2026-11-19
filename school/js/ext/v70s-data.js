// ================= v70s · CỐT TRUYỆN 1/3: dữ liệu — "Bí mật Khối Rubik Ánh Sáng" (6 chương, 27 nhiệm vụ) =================
// Truyện gốc, ấm áp, không vũ khí/bạo lực: Khối Rubik Ánh Sáng trên Tượng đài mất 6 màu sau đêm gió lớn.
// Rubi — khối lập phương tí hon biết nói — cùng em đi khắp đảo, giúp mọi người và học điều hay để tìm lại 6 Mảnh Sáng.
// Nhiệm vụ: go = đi tới nơi (tự mở hội thoại, có thể kèm câu đố) · do = làm một hoạt động có sẵn (khớp sự kiện ev) · quiz = câu đố tại chỗ.
// at = nơi dẫn đường (id khu V46 hoặc 'tree' / 'tech' / 'airport'); who = người nói (rubi, me, ha, id thầy cô v62k).
// Mọi tên toàn cục có tiền tố v70s / V70S.
const V70S_PEOPLE = {
  rubi:{n:'Rubi', ic:'🧊', c:'#5ff0ff'},
  me:{n:'Em', ic:'🙂', c:'#ffd23f'},
  ha:{n:'Hà Quân', ic:'🧩', c:'#7dff9a', L:{shirt:'#f4f4f4', pants:'#1f2f5c', skin:'#f1c27d', hair:'#1a1a1a', student:1, bag:'#ef4b4b', saoDo:1}}
};
const V70S_CH = [
  {id:'c1', col:'#f4f4f4', shard:'Trắng', gift:'Tri thức', ic:'⬜', name:'Ngày đầu đến trường', zone:'rubikpark',
    title:'🎒 Học trò Ánh Sáng', decor:'d|bookshelf|bacau|trang', cash:20, exp:120,
    open:[['rubi', 'Đêm qua có một cơn gió lớn thổi qua đảo Rubik… Sáng nay Khối Rubik Ánh Sáng trên Tượng đài bỗng phai hết màu!'], ['rubi', 'Ra Tượng đài gặp mình nhé — mình là Rubi, mình sẽ kể em nghe mọi chuyện.']],
    end:[['rubi', 'Mảnh Sáng Trắng đây rồi! Màu trắng là màu của trang vở mới — của tri thức.'], ['ha', 'Giỏi quá! Mình là Hà Quân, mình mở câu lạc bộ Rubik ở trường. Mình đi cùng các bạn tìm mảnh tiếp theo nhé!'], ['rubi', 'Mảnh kế tiếp màu Xanh lá… mình nghe thấy tiếng hát từ phía vườn hoa đấy!']],
    q:[
      {id:'c1a', type:'go', at:'rubikpark', who:'rubi', t:'Gặp Rubi ở Tượng đài Rubik', d:'Đi theo dấu chân tới Tượng đài Rubik.',
        say:[['rubi', 'Xin chào! Mình là Rubi, một mẩu nhỏ của Khối Rubik Ánh Sáng.'], ['rubi', 'Khối Ánh Sáng giữ cho đảo mình luôn vui và ấm. Gió lớn đêm qua đã thổi 6 Mảnh Sáng bay khắp nơi.'], ['me', 'Vậy mình phải đi tìm lại sao?'], ['rubi', 'Đúng rồi! Mỗi mảnh trốn ở nơi có người cần giúp và có điều hay để học. Mình bắt đầu ở Lớp Rubik nhé!']]},
      {id:'c1b', type:'go', at:'rubik', who:'toan', t:'Gặp Cô Phi Lam ở Lớp Rubik', d:'Cô Phi Lam có một câu hỏi về con số vàng.',
        say:[['toan', 'Chào em! Rubi kể cô nghe rồi. Mảnh Sáng thích những bạn biết quan sát.'], ['toan', 'Trong cánh hoa, vỏ ốc, cả Tháp Rubik đều có một con số đặc biệt. Em đoán thử nhé!']],
        quiz:[{q:'Tỷ lệ vàng φ (phi) xấp xỉ bằng bao nhiêu?', a:['1,618', '3,14', '2,5'], k:0, why:'φ ≈ 1,618 — chiều dài chia chiều rộng của hình chữ nhật vàng.'}]},
      {id:'c1c', type:'do', at:'library', who:'van', t:'Mở Thư viện Tri Thức', d:'Vào thư viện và mở kệ sách (hoặc chọn 📚 Thư viện trong Menu).', ev:/^m:library$/,
        say:[['van', 'Thầy là Nghiên Văn. Sách là chiếc chìa khoá mở mọi cánh cửa đấy em!'], ['rubi', 'Ồ, trong thư viện có ánh sáng trắng le lói… Mảnh Sáng đang ở gần!']]},
      {id:'c1d', type:'do', at:'academy', who:'rubi', t:'Chơi một trò chơi trí tuệ', d:'Lật thẻ nhớ, Sudoku, Toán nhanh, Rubik 3D hoặc cờ — trò nào cũng được.',
        ev:/^m:(memory|sudoku|math|rubik|rubiklab|rubikcoach|go|oaq|chess)$|^r:(Giải|Thắng cờ|Chơi xong một ván|Lật thẻ)/,
        say:[['rubi', 'Đầu óc em sáng quá! Mảnh Sáng vừa nháy một cái ở Khu điểm danh kìa!']]},
      {id:'c1e', type:'go', at:'attend', who:'rubi', t:'Giải câu đố của Rubi', d:'Tới Khu điểm danh, trả lời 3 câu đố để gọi Mảnh Sáng Trắng.',
        say:[['rubi', 'Mảnh Sáng chỉ hiện ra khi em trả lời đúng 3 câu đố của mình. Sẵn sàng chưa?']],
        quiz:[{q:'Khối Rubik 3×3 có bao nhiêu mặt?', a:['4 mặt', '6 mặt', '9 mặt'], k:1, why:'Khối lập phương có 6 mặt, mỗi mặt một màu.'},
          {q:'Mỗi mặt Rubik 3×3 có bao nhiêu ô vuông nhỏ?', a:['9 ô', '6 ô', '12 ô'], k:0, why:'3 hàng × 3 cột = 9 ô.'},
          {q:'Đến lớp muộn, em nên làm gì?', a:['Lặng lẽ ngồi vào chỗ', 'Xin phép thầy cô rồi vào lớp', 'Về nhà luôn'], k:1, why:'Lễ phép xin phép thầy cô là cách cư xử đẹp.'}]}
    ]},
  {id:'c2', col:'#2fbf71', shard:'Xanh lá', gift:'Sự sống', ic:'🟩', name:'Khu vườn biết hát', zone:'garden',
    title:'🌿 Bạn của Cây xanh', decor:'d|plant|nhietdoi|reu', cash:20, exp:130,
    open:[['rubi', 'Nghe kìa… cây cối trong vườn đang hát rất khẽ. Chắc Mảnh Sáng Xanh lá trốn trong lá cây!']],
    end:[['sinh', 'Cây thần kỳ vừa thả xuống một chiếc lá sáng xanh — đó là Mảnh Sáng Xanh lá của em!'], ['rubi', 'Màu xanh lá là màu của sự sống. Cảm ơn em đã chăm cây, chăm cá!'], ['rubi', 'Mảnh tiếp theo màu Đỏ — nó thích chạy nhảy lắm, chắc đang ở sân thể thao!']],
    q:[
      {id:'c2a', type:'go', at:'garden', who:'sinh', t:'Gặp Cô Lục Diệp ở Vườn hoa Đà Lạt', d:'Cô Lục Diệp biết cây cối đang hát bài gì.',
        say:[['sinh', 'Chào em! Cây xanh hát vì chúng đang vui — chúng vừa được nắng chiếu.'], ['sinh', 'Cô đố em một câu về cây nhé!']],
        quiz:[{q:'Cây xanh cần gì để tự làm ra thức ăn (quang hợp)?', a:['Ánh sáng mặt trời', 'Bóng tối', 'Kẹo ngọt'], k:0, why:'Lá cây dùng ánh sáng, nước và khí CO₂ để làm ra thức ăn và nhả ra khí ô-xy.'}]},
      {id:'c2b', type:'do', at:'farm', who:'sinh', t:'Trồng một cây ở Nông trại', d:'Tới Nông trại, chọn một ô đất và gieo hạt.', ev:/^m:plant$/,
        say:[['sinh', 'Hạt giống nhỏ xíu mà sẽ thành cây to. Nhớ tưới nước cho cây nhé!']]},
      {id:'c2c', type:'do', at:'pond', who:'rubi', t:'Câu một chú cá ở Hồ câu', d:'Ra Hồ câu thư giãn, kiên nhẫn chờ phao chìm.', ev:/^m:fish3$|^r:Câu cá/,
        say:[['rubi', 'Chú cá nói thầm: “Mảnh Sáng bay về phía Cây thần kỳ rồi!”'], ['me', 'Cảm ơn cá nhé!']]},
      {id:'c2d', type:'do', at:'tree', who:'rubi', t:'Tới gốc Cây thần kỳ', d:'Cây khổng lồ phía Bắc đảo. Chạm nút 🌳 Cây thần kỳ ở gốc cây.', ev:/^tree$/,
        say:[['rubi', 'Wow, Cây thần kỳ cao hơn cả toà nhà! Lá cây đang rung rinh vì vui đó.']]}
    ]},
  {id:'c3', col:'#ef4b4b', shard:'Đỏ', gift:'Sức khoẻ', ic:'🟥', name:'Ngọn lửa thể thao', zone:'field',
    title:'🔥 Ngọn lửa Thể thao', decor:'d|trophy|hiendai|do', cash:20, exp:140,
    open:[['rubi', 'Mảnh Sáng Đỏ thích vận động! Mình phải chạy nhanh mới theo kịp nó đấy.']],
    end:[['ly', 'Mảnh Sáng Đỏ đây! Nó nói em có trái tim khoẻ mạnh và tinh thần thể thao.'], ['ha', 'Lần sau mình đá bóng cùng nhau nhé!'], ['rubi', 'Mảnh Cam đang ở khu phố — nơi có âm nhạc, tranh vẽ và những người chăm chỉ làm việc.']],
    q:[
      {id:'c3a', type:'go', at:'field', who:'ly', t:'Gặp Thầy Lực Quang ở Sân bóng đá', d:'Thầy Lực Quang hiểu vì sao quả bóng lăn.',
        say:[['ly', 'Chào em! Thầy thấy một đốm đỏ lăn qua sân bóng rồi dừng lại. Em biết vì sao nó dừng không?']],
        quiz:[{q:'Vì sao quả bóng lăn trên cỏ chậm dần rồi dừng lại?', a:['Vì bóng mệt', 'Vì lực ma sát của mặt cỏ', 'Vì gió thổi ngược'], k:1, why:'Ma sát giữa bóng và mặt cỏ cản chuyển động, nên bóng chậm dần.'}]},
      {id:'c3b', type:'do', who:'rubi', t:'Đạp xe dạo một vòng', d:'Bấm 🚲 Đạp xe (cột nút bên trái) rồi đi khắp đảo.', ev:/^m:cycle$/,
        say:[['rubi', 'Gió mát quá! Đạp xe giúp chân khoẻ, tim khoẻ.']]},
      {id:'c3c', type:'do', at:'stadium', who:'ly', t:'Chơi một môn thể thao', d:'Bóng đá, bóng rổ, trượt ván, chạy, bơi, bắn cung… môn nào cũng được.',
        ev:/^m:(football|skate|patin|ski|olympic|medal|race)$|^r:(Bóng|Trượt|Chạy|Nhảy|Ném|Đẩy|Cử|Bơi|Thể dục|Bắn cung|Rubik Kart|Khúc côn cầu|Đua)/,
        say:[['ly', 'Tuyệt lắm! Thể thao dạy ta cố gắng, đồng đội và biết thua — thắng đều vui.']]},
      {id:'c3d', type:'go', at:'stadium', who:'rubi', t:'Câu đố ở Sân vận động Olympic', d:'Trả lời câu đố sức khoẻ để Mảnh Đỏ hiện ra.',
        say:[['rubi', 'Mảnh Đỏ đang trốn sau khán đài. Nó muốn biết em có biết giữ sức khoẻ không!']],
        quiz:[{q:'Trước khi chơi thể thao em nên làm gì?', a:['Khởi động nhẹ nhàng', 'Ăn thật no', 'Chạy thật nhanh ngay'], k:0, why:'Khởi động giúp cơ thể sẵn sàng và tránh bị đau.'},
          {q:'Học sinh tiểu học nên ngủ khoảng bao lâu mỗi đêm?', a:['4–5 giờ', '9–11 giờ', '15 giờ'], k:1, why:'Ngủ đủ 9–11 giờ giúp em lớn nhanh và học tốt.'}]}
    ]},
  {id:'c4', col:'#ff8a2b', shard:'Cam', gift:'Sáng tạo', ic:'🟧', name:'Phố vui nhộn', zone:'art',
    title:'🎨 Nghệ sĩ Phố Rubik', decor:'d|painting|codien|cam', cash:20, exp:150,
    open:[['rubi', 'Khu phố hôm nay náo nhiệt quá! Mảnh Sáng Cam là màu của sáng tạo và chăm chỉ.']],
    end:[['nghe', 'Một ngọn đèn lồng màu cam bay từ sân khấu xuống tay em — Mảnh Sáng Cam đó!'], ['rubi', 'Em vừa vẽ, vừa hát, vừa giúp thầy cô. Sáng tạo và chăm chỉ luôn đi cùng nhau.'], ['rubi', 'Mảnh Xanh dương nằm dưới biển… Mình cùng ra Bến cảng nhé!']],
    q:[
      {id:'c4a', type:'go', at:'art', who:'nghe', t:'Gặp Cô Cầm Hoạ ở Góc hoạ sĩ', d:'Cô Cầm Hoạ đang pha màu.',
        say:[['nghe', 'Chào em! Cô đang thiếu đúng một màu để vẽ hoàng hôn. Em giúp cô pha nhé!']],
        quiz:[{q:'Pha màu đỏ với màu vàng sẽ được màu gì?', a:['Màu tím', 'Màu xanh lá', 'Màu cam'], k:2, why:'Đỏ + vàng = cam — đúng màu của Mảnh Sáng mình đang tìm!'}]},
      {id:'c4b', type:'do', at:'hall', who:'nghe', t:'Diễn một tiết mục văn nghệ', d:'Tới Hội trường lớn, bấm 🎤 Diễn văn nghệ.', ev:/^r:Diễn văn nghệ|^stage$/,
        say:[['nghe', 'Cả hội trường vỗ tay rồi! Âm nhạc làm ai cũng vui.']]},
      {id:'c4c', type:'do', at:'tech', who:'tin', t:'Ghé Trường Tin học', d:'Tới cửa kính Trường Tin học và bấm 💻 Vào học.', ev:/^tech$|^r:(Trường Tin học|Sửa máy phòng tin học|Gõ phím)/,
        say:[['tin', 'Chào em! Máy tính chỉ hiểu 0 và 1, nhưng nhờ đó mà làm được bao điều kỳ diệu.']]},
      {id:'c4d', type:'do', who:'rubi', t:'Làm một việc tốt để nhận lương', d:'Giúp thầy cô mang đồ (bong bóng 📦), sửa máy phòng tin học… (mục 💼 Lương của em).', ev:/^job$|^r:(Giúp thầy cô mang đồ|Sửa máy phòng tin học)/,
        say:[['rubi', 'Việc tốt nhỏ thôi mà ai cũng cười. Đó chính là ánh sáng!']]},
      {id:'c4e', type:'go', at:'shopst', who:'ha', t:'Gặp Hà Quân ở Phố mua sắm', d:'Hà Quân đã thấy ánh cam trên phố.',
        say:[['ha', 'Mình thấy một đốm cam bay quanh các cửa hàng! Chắc nó chờ cậu tới đấy.']]}
    ]},
  {id:'c5', col:'#3d7bff', shard:'Xanh dương', gift:'Bao la', ic:'🟦', name:'Biển xanh thì thầm', zone:'harbor',
    title:'🌊 Người bạn Đại dương', decor:'d|aquarium|hiendai|bien', cash:20, exp:160,
    open:[['rubi', 'Sóng biển đang thì thầm gọi tên em đó. Mảnh Sáng Xanh dương ở ngoài khơi xa!']],
    end:[['dia', 'Một chú cá heo vừa tung Mảnh Sáng Xanh dương lên thuyền của em!'], ['rubi', 'Biển bao la dạy ta biết yêu thương và giữ gìn thiên nhiên.'], ['rubi', 'Chỉ còn mảnh Vàng thôi! Nó bay cao lắm — tận trên bầu trời.']],
    q:[
      {id:'c5a', type:'go', at:'harbor', who:'dia', t:'Gặp Cô Hải Đồ ở Bến cảng', d:'Cô Hải Đồ có tấm bản đồ đại dương.',
        say:[['dia', 'Chào em! Trái Đất có tới 5 đại dương. Mảnh Sáng đang trôi trên đại dương lớn nhất đấy.']],
        quiz:[{q:'Đại dương lớn nhất Trái Đất là gì?', a:['Đại Tây Dương', 'Thái Bình Dương', 'Bắc Băng Dương'], k:1, why:'Thái Bình Dương rộng nhất — Biển Đông của Việt Nam nối với nó.'}]},
      {id:'c5b', type:'do', at:'harbor', who:'dia', t:'Lên thuyền ra biển', d:'Tới bến, lên thuyền rồi chèo ra vịnh.', ev:/^m:boat$|^r:Dạo vịnh/,
        say:[['dia', 'Gió biển thơm mùi muối! Nhớ mặc áo phao mỗi khi đi thuyền nhé.']]},
      {id:'c5c', type:'do', who:'rubi', t:'Câu cá ngoài khơi', d:'Đang trên thuyền, thả neo ở chỗ có chim hải âu bay vòng rồi câu cá.', ev:/^r:Câu cá ngoài khơi|^m:(bigfish|deepfish|squid|whale|dolphin)$|^m:fish3$/, boat:1,
        say:[['rubi', 'Cá ngoài khơi to quá! Mình chỉ câu vừa đủ thôi để biển luôn có nhiều cá.']]},
      {id:'c5d', type:'quiz', who:'dia', t:'Lời hứa với biển', d:'Trả lời câu hỏi của Cô Hải Đồ để Mảnh Xanh dương hiện ra.',
        say:[['dia', 'Biển đang buồn vì rác. Em có biết cách giúp biển không?']],
        quiz:[{q:'Đi biển chơi, em nên làm gì với vỏ chai nhựa?', a:['Ném xuống biển', 'Vùi vào cát', 'Mang về bỏ đúng thùng rác'], k:2, why:'Rác nhựa có thể làm rùa biển và cá bị thương. Mang rác về là em đã cứu biển rồi!'}]}
    ]},
  {id:'c6', col:'#ffd23f', shard:'Vàng', gift:'Ước mơ', ic:'🟨', name:'Bầu trời Rubik', zone:'bpad',
    title:'🌟 Người giữ Ánh Sáng', decor:'d|statue|vutru|vangchanh', cash:20, exp:200,
    open:[['rubi', 'Mảnh cuối cùng màu Vàng — màu của ước mơ. Nó bay cao, cao mãi… Mình lên trời thôi!']],
    end:[['rubi', 'Cả 6 Mảnh Sáng đã về! Khối Rubik Ánh Sáng sáng rực trở lại rồi!'], ['ha', 'Cả trường đều thấy! Cảm ơn cậu nhiều lắm!'], ['toan', 'Em đã học, đã giúp đỡ và đã dám mơ. Cô rất tự hào về em.'], ['rubi', 'Từ nay em là Người giữ Ánh Sáng. Đảo Rubik còn bao điều thú vị — cứ tự do khám phá nhé!']],
    q:[
      {id:'c6a', type:'go', at:'bpad', who:'ly', t:'Tới Khu khinh khí cầu', d:'Thầy Lực Quang đang chuẩn bị bay.',
        say:[['ly', 'Muốn lên trời tìm Mảnh Vàng, mình đi bằng khinh khí cầu! Nhưng trước hết…']],
        quiz:[{q:'Vì sao khinh khí cầu bay lên được?', a:['Vì không khí nóng bên trong nhẹ hơn không khí bên ngoài', 'Vì có cánh vỗ', 'Vì nam châm kéo lên'], k:0, why:'Không khí nóng nở ra, nhẹ hơn không khí lạnh xung quanh nên đẩy khinh khí cầu bay lên.'}]},
      {id:'c6b', type:'do', who:'rubi', t:'Bay lên bầu trời', d:'Chơi Bay khinh khí cầu, hoặc bấm 🎈 Bay lên trời.', ev:/^m:(sky|balloon)$|^r:Bay khinh khí cầu/,
        say:[['rubi', 'Nhìn kìa, cả đảo Rubik nhỏ xíu dưới chân mình! Mảnh Vàng vừa lướt qua phía sân bay.']]},
      {id:'c6c', type:'go', at:'airport', who:'tin', t:'Tới Sân bay Quốc tế Rubik', d:'Sân bay nằm ở phía Tây đảo.',
        say:[['tin', 'Chào em! Tháp điều khiển của thầy vừa thấy một vệt vàng trên màn hình ra-đa.'], ['tin', 'Nó bay vòng quanh hành tinh! Thử nhìn đảo mình từ thật xa xem.']]},
      {id:'c6d', type:'do', who:'rubi', t:'Ngắm đảo từ vũ trụ', d:'Bấm 🌍 Hành tinh (cột nút trái) hoặc thu nhỏ bản đồ thật xa.', ev:/^planet$|^r:Ngắm đủ 8 hành tinh/,
        say:[['rubi', 'Đảo mình là một hành tinh xanh tí hon! Mảnh Vàng đang bay về Tượng đài rồi — về thôi!']]},
      {id:'c6e', type:'go', at:'rubikpark', who:'rubi', t:'Thắp sáng Khối Rubik Ánh Sáng', d:'Mang 6 Mảnh Sáng về Tượng đài Rubik.',
        say:[['rubi', 'Em đặt từng Mảnh Sáng vào Khối Ánh Sáng nhé: Trắng, Xanh lá, Đỏ, Cam, Xanh dương… và Vàng!']]}
    ]}
];
