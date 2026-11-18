// ================= v49 · THỜI TIẾT & MÙA NGẪU NHIÊN: tự đổi, không chọn tay trong menu =================
// Mọi tên toàn cục ở đây có tiền tố v49r / V49R. Bọc hàm cũ, không sửa file cũ.
const V49R = {d:null, s:null};
const V49R_SEASONS = ['xuan', 'ha', 'thu', 'dong'];
// mỗi ngày trong game bốc thăm một mùa (có thể trùng hôm trước)
// v49b: đổi nhanh hơn — mùa bốc thăm lại mỗi 6 giờ trong game (4 lần/ngày), thời tiết mỗi 1 giờ trong game
const V49R_SEASON_MIN = 360, V49R_WEATHER_MIN = 60;
function v49rKey(){ return day*1440/V49R_SEASON_MIN + Math.floor((typeof clock === 'number' ? clock : 0)/V49R_SEASON_MIN); }
function v49rDaySeason(){ const k = v49rKey(); if(V49R.d !== k || !V49R.s){ V49R.d = k; V49R.s = V49R_SEASONS[Math.floor(Math.random()*4)]; } return V49R.s; }
const v49rSS0 = setSeason;
setSeason = function(s, auto){ if(auto) s = v49rDaySeason(); return v49rSS0(s, auto); };
realSeason = function(){ return v49rDaySeason(); };
const v49rND0 = newDay;
newDay = function(first){ const r = v49rND0.apply(this, arguments); try { setSeason(v49rDaySeason(), true); } catch(e){} return r; };
// menu: bỏ mục Mùa & thời tiết
const v49rMI0 = v39MainItems;
v39MainItems = function(){ return v49rMI0().filter(it => it.f !== 'season'); };
// mọi lối mở bảng chọn mùa/thời tiết (ô trên đầu menu…) chỉ báo cho biết, không cho chọn
// (gắn trong init vì menu v39 gán lại v32Sub lúc khởi động)
function v49rInit(){
  const sub0 = v32Sub; v32Sub = function(kind){ if(kind === 'season'){ toast('🌦️ Mùa và thời tiết tự thay đổi ngẫu nhiên mỗi ngày.'); return; } return sub0.apply(this, arguments); };
  autoWeather = true; autoSeason = false;
  if(typeof SETTINGS !== 'undefined'){ SETTINGS.weatherHourly = true; SETTINGS.seasonDaily = true; }
  // ẩn các công tắc chọn tay cũ (thời tiết / mùa) trong cài đặt
  ['autoSeason', 'autoWeather', 'stWeather', 'stSeason'].forEach(id => { const i = document.getElementById(id); const l = i && i.closest('label'); if(l) l.hidden = true; });
  ['seasons', 'weathers'].forEach(id => { const r = document.getElementById(id); if(!r) return; r.hidden = true; const h = r.previousElementSibling; if(h && h.tagName === 'H2') h.hidden = true; });
  setSeason(v49rDaySeason(), true);
  if(typeof V25 !== 'undefined') V25.wslot = -1; weatherUntil = clock;
  // thời tiết: ô thời gian 1 giờ thay vì 3 giờ (giữ bỏ sóng thần/động đất/siêu bão như v25)
  if(typeof v25Weather === 'function') v25Weather = function(){
    if(!SETTINGS.weatherHourly) return; const slot = day*(1440/V49R_WEATHER_MIN) + Math.floor(clock/V49R_WEATHER_MIN); if(slot === V25.wslot) return; V25.wslot = slot;
    const wts = Object.assign({}, W_WEIGHTS[season]); ['songthan', 'dongdat', 'sieubao'].forEach(k => delete wts[k]); let tot = 0; for(const k in wts) tot += wts[k];
    let r = Math.random()*tot, choice = 'nang'; for(const k in wts){ r -= wts[k]; if(r <= 0){ choice = k; break; } } setWeather(choice, false); weatherUntil = 1e9; };
  // mùa: kiểm tra mỗi 2 giây, sang ô 6 giờ mới thì đổi
  setInterval(() => { try { const s = v49rDaySeason(); if(s !== season){ setSeason(s, true); if(typeof V25 !== 'undefined'){ V25.wslot = -1; v25Weather(); } } } catch(e){} }, 2000);
}
