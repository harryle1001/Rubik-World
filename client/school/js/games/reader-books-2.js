
var TEXTS = null, TEXTS_P = null;
function loadTexts(){
  if(TEXTS) return Promise.resolve(TEXTS); if(TEXTS_P) return TEXTS_P;
  TEXTS_P = (async () => { try { const bin = atob(TEXT_GZ), u = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
    const ds = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip')); TEXTS = JSON.parse(await new Response(ds).text()); } catch(e){ TEXTS = {}; } return TEXTS; })();
  return TEXTS_P;
}
// local (inline) Vietnamese books
const VNB = [];
VN_TALES.forEach(([t, x], i) => VNB.push({id:'vt' + i, t, a:'Truyện cổ tích Việt Nam · kể lại cho thiếu nhi', cat:'Truyện cổ tích', text:x, comic:true}));
VN_FABLES.forEach(([t, x], i) => VNB.push({id:'vf' + i, t, a:'Ngụ ngôn Aesop · bản kể tiếng Việt', cat:'Ngụ ngôn', text:x, comic:true}));
VN_WISDOM.forEach(([t, x], i) => VNB.push({id:'vw' + i, t, a:'Sách đạo đức cho thiếu nhi', cat:'Lời dạy yêu thương', text:x, comic:i < 2}));
TEXT_META.forEach(m => VNB.push({id:m.id, t:m.t, a:m.a, cat:m.cat, big:true, lang:m.lang}));
const vnBook = id => VNB.find(b => b.id === id);
async function bookText(id){ const b = vnBook(id); if(b && b.text) return b.text; const T = await loadTexts(); return T[id] || null; }
// ---------- reader ----------
var RD = {id:null, b:null, pages:[], p:0, fs:19};
function paginate(text, size){ const out = [], paras = text.replace(/\r/g, '').split(/\n{2,}/); let cur = '';
  paras.forEach(pa => { pa = pa.replace(/\n(?!\n)/g, pa.length < 2000 && /\n.{0,60}\n/.test(pa) ? '\n' : ' ').trim(); if(!pa) return; if(cur.length + pa.length > size && cur){ out.push(cur); cur = ''; } const sh = pa.length < 90; if(pa.length > size*1.4){ let s = pa; while(s.length > size){ let k = s.lastIndexOf('. ', size); if(k < size*.5) k = s.lastIndexOf(' ', size); out.push((cur ? cur + '\n\n' : '') + s.slice(0, k + 1)); cur = ''; s = s.slice(k + 1).trim(); } cur = s; } else { cur += (cur ? (sh && paginate.ls ? '\n' : '\n\n') : '') + pa; } paginate.ls = sh; });
  if(cur) out.push(cur); return out; }
async function openReader(id, meta){
  showModal('mReader'); $('#rdTitle').textContent = 'Đang mở sách…'; $('#rdText').textContent = ''; $('#rdAuthor').textContent = '';
  let b = vnBook(id) || meta, text = await bookText(id);
  if(!text && /^pg\d+$/.test(id)){ $('#rdText').textContent = 'Đang tải toàn văn từ Project Gutenberg…'; try { const r = await fetch(`https://www.gutenberg.org/cache/epub/${id.slice(2)}/pg${id.slice(2)}.txt`); if(r.ok){ text = cleanPG(await r.text()); } } catch(e){} }
  if(!text){ $('#rdTitle').textContent = b ? b.t : 'Sách'; $('#rdText').textContent = 'Trang này chưa tải được toàn văn cuốn sách này ngay trong game. Bấm "Mở trên Gutenberg" để đọc trực tuyến trong tab mới. Các sách có nhãn "Đọc ngay trong game" luôn đọc được trọn vẹn.'; $('#rdExt').hidden = !(id && id.startsWith('pg')); $('#rdExt').href = id ? bookUrl(id.slice(2)) : '#'; return; }
  RD.id = id; RD.b = b || {t:'Sách', a:''}; RD.pages = paginate(text, 1500); PROF && (PROF.readPos = PROF.readPos || {}); RD.p = Math.min(RD.pages.length - 1, (PROF && PROF.readPos[id]) || 0);
  $('#rdTitle').textContent = RD.b.t; $('#rdAuthor').textContent = RD.b.a || ''; $('#rdExt').hidden = !id.startsWith('pg'); $('#rdExt').href = id.startsWith('pg') ? bookUrl(id.slice(2)) : '#';
  rdShow(); mprog('readstart'); mentorSay('library');
}
function cleanPG(t){ const a = t.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i), b = t.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i); return t.slice(a >= 0 ? t.indexOf('\n', a) + 1 : 0, b > 0 ? b : t.length).trim(); }
function rdShow(){
  const tx = $('#rdText'); tx.textContent = RD.pages[RD.p] || ''; tx.style.fontSize = RD.fs + 'px'; tx.scrollTop = 0; tx.classList.remove('flip'); void tx.offsetWidth; tx.classList.add('flip');
  $('#rdPage').textContent = `Trang ${RD.p + 1} / ${RD.pages.length}`; $('#rdBar').style.width = ((RD.p + 1)/RD.pages.length*100) + '%';
  $('#rdPrev').disabled = RD.p === 0; $('#rdNext').disabled = RD.p >= RD.pages.length - 1;
  if(PROF){ PROF.readPos = PROF.readPos || {}; PROF.readPos[RD.id] = RD.p; if(RD.p >= RD.pages.length - 1){ PROF.finished = PROF.finished || {}; if(!PROF.finished[RD.id]){ PROF.finished[RD.id] = Date.now(); reward(Math.min(120, 20 + RD.pages.length*2), 0, `Đọc hết "${RD.b.t}"`); mprog('readall'); toast('Bạn đã đọc hết cuốn sách! Làm bài kiểm tra để nhận thưởng.'); } } saveProfileSoon(); }
}
var spT = null; function saveProfileSoon(){ clearTimeout(spT); spT = setTimeout(saveProfile, 1500); }
function rdGo(d){ const n = RD.p + d; if(n < 0 || n >= RD.pages.length) return; RD.p = n; rdShow(); try { sfx(); const s = AC.createBufferSource(); s.buffer = noise(); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2500; const g = AC.createGain(); const t = AC.currentTime; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .25); s.connect(f); f.connect(g); g.connect(sfx()); s.start(t); s.stop(t + .3); } catch(e){} }
var TTS = null;
async function rdSpeak(){ try { if(!TTS) TTS = window.claude && claude.use ? await claude.use('tts') : null; if(!TTS){ toast('Nghe đọc cần mở trang trên claude.ai (trình duyệt Chrome).'); return; } if($('#rdSpeak').dataset.on === '1'){ TTS.stop(); $('#rdSpeak').dataset.on = '0'; $('#rdSpeak').textContent = 'Nghe đọc'; return; } $('#rdSpeak').dataset.on = '1'; $('#rdSpeak').textContent = 'Dừng đọc'; const vi = !RD.b.lang || RD.b.lang === 'vi'; await TTS.speak((RD.pages[RD.p] || '').slice(0, 2000), vi ? {language:'vi'} : {}).catch(() => {}); $('#rdSpeak').dataset.on = '0'; $('#rdSpeak').textContent = 'Nghe đọc'; } catch(e){} }
// ---------- quizzes for in-game books ----------
async function startTextQuiz(id){
  if(!PROF){ openLogin(); return; } const b = vnBook(id); const text = await bookText(id); if(!text) return;
  const cd = PROF.cdo['bq' + id]; if(cd && Date.now() - cd < 5*60000){ toast('Bạn vừa làm bài này. Đọc lại và thử lại sau ít phút.'); return; }
  showModal('mBookQuiz'); $('#bqTitle').textContent = b.t; $('#bqBody').innerHTML = ''; $('#bqMsg').textContent = 'Đang soạn 10 câu hỏi từ chính nội dung cuốn sách…';
  let qs = null;
  try { const sample = window.claude && claude.use ? await claude.use('sample') : null; if(sample){ const n = text.length, chunk = n <= 24000 ? text : [0, 1, 2, 3, 4, 5].map(k => text.slice(Math.floor(k*n/6), Math.floor(k*n/6) + 4000)).join('\n…\n');
      const res = await sample.json(`Dựa HOÀN TOÀN vào nội dung sách dưới đây, soạn 10 câu hỏi trắc nghiệm tiếng Việt kiểm tra học sinh đã đọc kỹ (nhân vật, sự kiện, chi tiết, bài học). Mỗi câu 4 lựa chọn ngắn, một đáp án đúng.\nTrả về JSON {"questions":[{"q":"...","options":["..","..","..",".."],"answer":0}]}.\nSÁCH: "${b.t}"\n${chunk}`, {modelTier:'default'});
      if(res && Array.isArray(res.questions)) qs = res.questions.filter(x => x && Array.isArray(x.options) && x.options.length === 4 && x.answer >= 0 && x.answer < 4).slice(0, 10); } } catch(e){}
  if(!qs || qs.length < 10){ qs = clozeQuiz(text); $('#bqMsg').textContent = 'Bài kiểm tra điền từ: chọn từ đúng để hoàn thành câu trích trong sách.'; }
  const pages = Math.round(text.length/1500); BQ = {id, t:b.t, pages, i:0, right:0, qs:qs.map(x => { const order = [0,1,2,3].sort(() => Math.random() - .5); return {q:x.q, options:order.map(k => x.options[k]), answer:order.indexOf(x.answer)}; })};
  if(!$('#bqMsg').textContent.startsWith('Bài kiểm tra điền')) $('#bqMsg').textContent = `Khoảng ${pages} trang · đúng 10/10 câu được ${pages >= 100 ? '$100' : '$10'}.`;
  bqShow();
}
function clozeQuiz(text){
  const sents = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 40 && s.length < 220);
  const words = [...new Set(text.toLowerCase().match(/[a-zà-ỹđ]{4,}/gi) || [])];
  const qs = []; const used = new Set();
  for(let tries = 0; qs.length < 10 && tries < 400; tries++){ const s = sents[Math.floor(Math.random()*sents.length)]; if(!s || used.has(s)) continue; const ws = s.match(/[A-Za-zÀ-ỹĐđ]{4,}/g) || []; if(ws.length < 4) continue; const w = ws[Math.floor(Math.random()*ws.length)];
    const opts = new Set([w.toLowerCase()]); let g = 0; while(opts.size < 4 && g++ < 50) opts.add(words[Math.floor(Math.random()*words.length)]); if(opts.size < 4) continue; used.add(s);
    const arr = [...opts]; qs.push({q:'Điền từ còn thiếu: "' + s.replace(w, '_____') + '"', options:arr, answer:0}); }
  return qs;
}
// ---------- comic books (illustrated from the story text) ----------
var CB = {id:null, panels:[], page:0};
function comicPanels(text){ const ps = []; text.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(pa => { if(/^[A-ZĐÀ-Ỹ0-9 .,:]+$/.test(pa) && pa.length < 60){ ps.push({cap:pa, title:true}); return; } if(pa.length <= 260){ ps.push({cap:pa}); return; } const ss = pa.split(/(?<=[.!?…"])\s+/); let cur = ''; ss.forEach(s => { if((cur + ' ' + s).length > 240 && cur){ ps.push({cap:cur}); cur = s; } else cur = cur ? cur + ' ' + s : s; }); if(cur) ps.push({cap:cur}); }); return ps; }
function openComic(id){ const b = vnBook(id); if(!b) return; CB.id = id; CB.b = b; CB.panels = comicPanels(b.text); CB.page = 0; showModal('mComic'); $('#cbTitle').textContent = b.t; cbDraw(); mprog('comicread'); }
function cbDraw(){
  const cv = $('#cbCv'), c = cv.getContext('2d'), per = 4, pages = Math.ceil(CB.panels.length/per); cv.width = 960; cv.height = 640;
  c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 960, 640);
  CB.panels.slice(CB.page*per, CB.page*per + per).forEach((P, k) => { const x = 12 + (k % 2)*474, y = 12 + Math.floor(k/2)*314; drawPanel(c, P, x, y, 462, 302, CB.page*per + k); });
  $('#cbPage').textContent = `Trang ${CB.page + 1} / ${pages}`; $('#cbPrev').disabled = CB.page === 0; $('#cbNext').disabled = CB.page >= pages - 1;
  if(CB.page >= pages - 1 && PROF){ PROF.finished = PROF.finished || {}; if(!PROF.finished['c' + CB.id]){ PROF.finished['c' + CB.id] = 1; reward(25, 0, `Đọc hết truyện tranh "${CB.b.t}"`); } }
}
const SCENES = [[/biển|sông|nước|hồ|đảo|thuyền|cá /i, 'sea'], [/núi|rừng|cây|tre|hang/i, 'forest'], [/vua|cung|thần|trời|tiên|thiên/i, 'palace'], [/đêm|trăng|sao/i, 'night'], [/nhà|làng|quán|chợ/i, 'village'], [/ruộng|đồng|lúa|vườn|dưa/i, 'field']];
function drawPanel(c, P, x, y, w, h, n){
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const sc = (SCENES.find(([re]) => re.test(P.cap)) || [0, 'field'])[1], ch = h - 112;
  const sky = c.createLinearGradient(0, y, 0, y + ch); const SK = {sea:['#8fd3ff','#e0f4ff'], forest:['#b2dfdb','#e8f5e9'], palace:['#ffe082','#fff8e1'], night:['#0d1b4c','#3949ab'], village:['#ffccbc','#fff3e0'], field:['#bbdefb','#f1f8e9']}[sc]; sky.addColorStop(0, SK[0]); sky.addColorStop(1, SK[1]); c.fillStyle = sky; c.fillRect(x, y, w, ch);
  if(sc === 'night'){ c.fillStyle = '#fff59d'; c.beginPath(); c.arc(x + w - 60, y + 40, 22, 0, 7); c.fill(); c.fillStyle = '#fff'; for(let i=0;i<20;i++) c.fillRect(x + (i*53 + n*17) % w, y + (i*29) % (ch*.6), 2, 2); }
  else { c.fillStyle = '#fff59d'; c.beginPath(); c.arc(x + w - 50, y + 36, 16, 0, 7); c.fill(); }
  const gy = y + ch - 50;
  if(sc === 'sea'){ c.fillStyle = '#29b6f6'; c.fillRect(x, gy - 10, w, 70); c.fillStyle = 'rgba(255,255,255,.5)'; for(let i=0;i<8;i++) c.fillRect(x + i*60 + (n*13) % 40, gy + (i%3)*12, 28, 3); c.fillStyle = '#ffe0a3'; c.fillRect(x, gy + 30, w, 40); }
  else if(sc === 'forest'){ c.fillStyle = '#81c784'; c.fillRect(x, gy, w, 60); for(let i=0;i<7;i++){ c.fillStyle = ['#2e7d32','#388e3c','#1b5e20'][i%3]; c.beginPath(); c.moveTo(x + i*70 - 10, gy + 10); c.lineTo(x + i*70 + 25, gy - 80 - (i%2)*30); c.lineTo(x + i*70 + 60, gy + 10); c.fill(); } }
  else if(sc === 'palace'){ c.fillStyle = '#e0c068'; c.fillRect(x, gy, w, 60); c.fillStyle = '#c62828'; c.fillRect(x + w*.2, gy - 90, w*.6, 90); c.fillStyle = '#8e0000'; c.beginPath(); c.moveTo(x + w*.15, gy - 90); c.lineTo(x + w*.5, gy - 140); c.lineTo(x + w*.85, gy - 90); c.fill(); c.fillStyle = '#ffd23f'; for(let i=0;i<5;i++) c.fillRect(x + w*.25 + i*w*.1, gy - 70, 12, 60); }
  else if(sc === 'village'){ c.fillStyle = '#a5d6a7'; c.fillRect(x, gy, w, 60); [[.15, '#8d6e63'], [.55, '#a1887f']].forEach(([f, col]) => { c.fillStyle = col; c.fillRect(x + w*f, gy - 50, 110, 50); c.fillStyle = '#5d4037'; c.beginPath(); c.moveTo(x + w*f - 12, gy - 50); c.lineTo(x + w*f + 55, gy - 90); c.lineTo(x + w*f + 122, gy - 50); c.fill(); c.fillStyle = '#fff59d'; c.fillRect(x + w*f + 40, gy - 34, 22, 20); }); }
  else if(sc === 'night'){ c.fillStyle = '#1b2a4a'; c.fillRect(x, gy, w, 60); }
  else { c.fillStyle = '#9ccc65'; c.fillRect(x, gy, w, 60); c.strokeStyle = '#7cb342'; for(let i=0;i<12;i++){ c.beginPath(); c.moveTo(x + i*40, gy + 8); c.lineTo(x + i*40 + 6, gy - 6); c.stroke(); } }
  const t = P.cap.toLowerCase(), actors = [];
  [['vua', 'king'], ['hoàng', 'king'], ['thần', 'god'], ['tiên', 'fairy'], ['bụt', 'god'], ['phật', 'monk'], ['chúa', 'teacher'], ['mẹ', 'mom'], ['cha', 'dad'], ['công chúa', 'fairy'], ['tráng sĩ', 'hero'], ['gióng', 'hero'], ['chàng', 'hero'], ['cô ', 'girl'], ['nàng', 'girl'], ['cậu bé', 'boy'], ['em ', 'boy'], ['ông', 'old'], ['bà ', 'oldw'], ['người', 'man']].forEach(([k, r]) => { if(t.includes(k) && !actors.includes(r) && actors.length < 3) actors.push(r); });
  const animals = []; [['hổ', 'tiger'], ['trâu', 'buffalo'], ['ngựa', 'horse'], ['thỏ', 'rabbit'], ['cáo', 'fox'], ['chim', 'bird'], ['rùa', 'turtle'], ['sư tử', 'lion'], ['chuột', 'mouse'], ['cò', 'bird'], ['gà', 'chicken'], ['khỉ', 'monkey'], ['quạ', 'crow'], ['ngỗng', 'goose'], ['rồng', 'dragon'], ['cá ', 'fish'], ['gấu', 'bear'], ['cừu', 'sheep'], ['sói', 'wolf'], ['kiến', 'ant'], ['ve', 'cicada'], ['cóc', 'toad'], ['dê', 'goat'], ['chó', 'dog']].forEach(([k, a]) => { if(t.includes(k) && animals.length < 2 && !animals.includes(a)) animals.push(a); });
  if(!actors.length && !animals.length) actors.push(n % 2 ? 'boy' : 'girl');
  const total = actors.length + animals.length; let idx = 0;
  const posX = () => x + w*(idx + 1)/(total + 1) + (idx++ % 2 ? 6 : -6);
  actors.forEach((r, k) => { const px = posX(); withCtx(c, () => { ctx.save(); ctx.translate(px, gy + 30); ctx.scale(3, 3); const f = lookFor(k*5 + n); f.dir = k % 2 ? -1 : 1; if(r === 'king'){ f.style = {acc:[], hat:'crown', outfit:'royal'}; f.shirt = '#6a1b9a'; } else if(r === 'god' || r === 'monk'){ f.shirt = r === 'monk' ? '#ff8f00' : '#fafafa'; f.hair = r === 'monk' ? f.skin : '#eeeeee'; f.long = r !== 'monk'; f.style = {outfit:'wizard', acc:['aura']}; } else if(r === 'teacher'){ f.shirt = '#fafafa'; f.long = true; f.hair = '#5d4037'; f.style = {outfit:'wizard', acc:['aura']}; } else if(r === 'fairy' || r === 'girl' || r === 'mom'){ f.long = true; f.skirt = true; f.shirt = ['#f48fb1','#fff176','#ce93d8'][k % 3]; if(r === 'fairy') f.style = {outfit:'princess', acc:['wings']}; } else if(r === 'hero'){ f.shirt = '#8d6e63'; f.style = {outfit:'knight'}; } else if(r === 'old' || r === 'oldw'){ f.hair = '#e0e0e0'; f.long = r === 'oldw'; f.shirt = '#795548'; } drawBody(f, false); ctx.restore(); }); });
  animals.forEach(a => { const px = posX(); withCtx(c, () => { ctx.save(); ctx.translate(px, gy + 30); ctx.scale(3, 3);
    if(['buffalo','horse','camel','goat','chicken'].includes(a)) drawAnimal(a === 'goat' ? 'goat' : a, 0, 0, -1, realT, false);
    else if(['rabbit','fox','dog','cat','dragon'].includes(a)) drawPet(a, 0, 0, -1, realT, false);
    else if(a === 'tiger' || a === 'lion'){ rect('#ff9800', -12, -14, 24, 10); rect('#ff9800', 9, -18, 9, 9); for(let i=0;i<4;i++) if(a === 'tiger') rect('#3e2723', -10 + i*6, -14, 2, 9); if(a === 'lion') { circ(13, -14, 8, '#8d4a00'); rect('#ffb74d', 9, -18, 9, 9); } rect('#111', 14, -16, 2, 2); rect('#ff9800', -10, -4, 3, 4); rect('#ff9800', 6, -4, 3, 4); }
    else if(a === 'turtle' || a === 'toad'){ ctx.fillStyle = a === 'turtle' ? '#2e7d32' : '#827717'; ctx.beginPath(); ctx.ellipse(0, -6, 12, 7, 0, 0, 7); ctx.fill(); rect(a === 'turtle' ? '#81c784' : '#9e9d24', 10, -8, 6, 5); rect('#111', 13, -7, 1, 1); }
    else if(a === 'fish'){ ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.ellipse(0, -8, 10, 5, 0, 0, 7); ctx.fill(); }
    else if(a === 'monkey' || a === 'bear' || a === 'wolf' || a === 'sheep' || a === 'mouse'){ const col = {monkey:'#8d6e63', bear:'#5d4037', wolf:'#9e9e9e', sheep:'#fafafa', mouse:'#bdbdbd'}[a], s2 = a === 'mouse' ? .5 : 1; rect(col, -8*s2, -14*s2, 16*s2, 12*s2); rect(col, 6*s2, -18*s2, 8*s2, 8*s2); rect('#111', 10*s2, -15*s2, 1.5, 1.5); }
    else { const col = a === 'crow' ? '#212121' : a === 'goose' ? '#fafafa' : a === 'ant' ? '#3e2723' : a === 'cicada' ? '#689f38' : '#ffd23f'; rect(col, -5, -26, 10, 7); rect(col, 3, -30, 5, 5); rect('#ff9800', 8, -28, 3, 2); rect(col, -9, -26 + Math.sin(realT*8)*2, 5, 3); } ctx.restore(); }); });
  c.restore();
  c.fillStyle = '#fff'; c.fillRect(x, y + h - 112, w, 112); c.strokeStyle = '#111'; c.lineWidth = 3; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x, y + h - 112); c.lineTo(x + w, y + h - 112); c.stroke();
  c.fillStyle = '#111'; c.font = (P.title ? 'bold 18px' : '15px') + ' "Segoe UI", Arial, sans-serif'; const words = P.cap.split(' '); let line = '', ly = y + h - 92;
  words.forEach(wd => { if(c.measureText(line + wd).width > w - 20){ c.fillText(line, x + 10, ly); line = ''; ly += 18; } line += wd + ' '; }); if(ly < y + h - 4) c.fillText(line, x + 10, ly);
  c.fillStyle = '#ef4b4b'; c.font = '12px Bungee, sans-serif'; c.fillText(String(n + 1), x + w - 24, y + 18);
}
function renderVnBooks(box, filter){
  const q = LIB.q.trim().toLowerCase(); const list = VNB.filter(b => (!filter || filter(b)) && (!q || (b.t + ' ' + b.a + ' ' + b.cat).toLowerCase().includes(q)));
  $('#libCount').textContent = `${list.length} cuốn đọc trọn vẹn ngay trong game`;
  const cats = [...new Set(list.map(b => b.cat))];
  cats.forEach(cat => { const h = el('h3', {className:'libcat'}); h.textContent = cat; box.appendChild(h);
    list.filter(b => b.cat === cat).forEach((b, i) => { const done = PROF && PROF.books[b.id], fin = PROF && PROF.finished && PROF.finished[b.id], pos = PROF && PROF.readPos && PROF.readPos[b.id];
      const card = el('div', {className:'book' + (done ? ' done' : '')}); card.style.animationDelay = Math.min(i, 20)*25 + 'ms';
      const h0 = [...b.id].reduce((a, ch) => a*31 + ch.charCodeAt(0), 7); const [c1, c2] = coverColor(Math.abs(h0) % 997); const cov = el('div', {className:'cover'}); cov.style.background = `linear-gradient(135deg, ${c1}, ${c2})`; cov.textContent = b.t; card.appendChild(cov);
      const info = el('div', {className:'binfo'}); const t = el('b'); t.textContent = b.t; info.appendChild(t); const au = el('span'); au.textContent = `${b.a}${fin ? ' · đã đọc hết' : pos ? ` · đang đọc trang ${pos + 1}` : ''}`; info.appendChild(au);
      const row = el('div', {className:'row'}); const rd = el('button', {type:'button', className:'primary'}); rd.textContent = pos ? 'Đọc tiếp' : 'Đọc ngay trong game'; rd.onclick = () => openReader(b.id); row.appendChild(rd);
      if(b.comic){ const cb = el('button', {type:'button'}); cb.textContent = 'Truyện tranh'; cb.onclick = () => openComic(b.id); row.appendChild(cb); }
      const qb = el('button', {type:'button'}); qb.textContent = done ? 'Đã hoàn thành ✓' : 'Kiểm tra 10 câu'; qb.disabled = !!done; qb.onclick = () => startTextQuiz(b.id); row.appendChild(qb);
      info.appendChild(row); card.appendChild(info); box.appendChild(card); }); });
}
function ext18Init(){
  $('#rdPrev').onclick = () => rdGo(-1); $('#rdNext').onclick = () => rdGo(1); $('#rdSmall').onclick = () => { RD.fs = Math.max(14, RD.fs - 2); rdShow(); }; $('#rdBig').onclick = () => { RD.fs = Math.min(30, RD.fs + 2); rdShow(); };
  $('#rdSpeak').onclick = rdSpeak; $('#rdQuiz').onclick = () => { const id = RD.id; if(!id) return; if(QBOOKS[+id.replace('pg', '')] && id.startsWith('pg')) startBookQuiz(+id.slice(2), RD.b.t, RD.b.a); else startTextQuiz(id); };
  $('#cbPrev').onclick = () => { CB.page--; cbDraw(); }; $('#cbNext').onclick = () => { CB.page++; cbDraw(); };
  $('#rdText').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); if(e.clientX > r.left + r.width*.7) rdGo(1); else if(e.clientX < r.left + r.width*.3) rdGo(-1); });
}
function readerKey(e, isDown){ if(!isDown) return false; if(e.code === 'ArrowRight' || e.code === 'PageDown'){ rdGo(1); e.preventDefault(); return true; } if(e.code === 'ArrowLeft' || e.code === 'PageUp'){ rdGo(-1); e.preventDefault(); return true; } return false; }
function comicKey(e, isDown){ if(!isDown) return false; const pages = Math.ceil(CB.panels.length/4); if(e.code === 'ArrowRight' && CB.page < pages - 1){ CB.page++; cbDraw(); return true; } if(e.code === 'ArrowLeft' && CB.page > 0){ CB.page--; cbDraw(); return true; } return false; }

