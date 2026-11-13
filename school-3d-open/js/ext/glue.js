// ================= EXT: GLUE =================
function extUpdate(dtR){ updateTables(dtR); v26Slow('farm', farmUpdate, dtR, R.farm); easelUpdate(dtR); updatePet(dtR); wevUpdate(dtR); npcCustomers(dtR); updateAuto(dtR); if((V26F++ & 3) === 0) doorUpdate(); ambUpdate(dtR); v16Update(dtR); v25Update(dtR); v26Update(); }
function extSprites(sp){ tableSprites(sp); farmSprites(sp); zoneSprites(sp); petSprites(sp); eastSprites(sp); wevSprites(sp); onlineSprites(sp); streetSprites(sp); lightSprites(sp); v16Sprites(sp); librarySprites(sp); v25Sprites(sp); v32Sprites(sp); v33Sprites(sp); v36Sprites(sp); sp.push({y:1e9, f:() => { drawLocks(); drawWevGuide(); drawPing(); drawGuideWorld(); }}); }
const ARC_CODES = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyX','Enter'];
function extKey(e, id, isDown){
  if(id === 'mHouse') return houseKey(e, isDown);
  if(id === 'mMusic') return musicKey(e, isDown);
  if(id === 'mLab') return isDown ? labKey(e) : false;
  if(id === 'mReader') return readerKey(e, isDown);
  if(id === 'mComic') return comicKey(e, isDown);
  if(id === 'mArcade' || id === 'mFishDeep'){ const tg = e.target.tagName; if(tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return false; if(ARC_CODES.includes(e.code)){ e.preventDefault(); ARC.code[e.code] = isDown; return true; } return false; }
  return false;
}
function extClose(id){
  v16Close(id);
  if(id === 'mMusic'){ pgStop(); if(GT.auto) gAutoToggle(); setSustain(false); Object.keys(pActive).forEach(m => releaseNote(+m)); pKeyMap = {}; }
  if(id === 'mArcade'){ ARC.code = {}; kartEngine(false); }
  if(id === 'mZen') zenStop(true);
  if(id === 'mFishDeep') deepClose();
  if(id === 'mLab') labClose();
  if(id === 'mWatch') watchT = -1;
}
function goTo(x, y, z){ followCam = false; cam.x = x; cam.y = y; cam.z = Math.max(fitZ(), z || .8); clampCam(); updatePanel(); }
function openFarm(){ showModal('mFarm'); renderFarm(); }
function renderFarm(){
  if(!FARM || !$('#farmPlots')) return;
  const hungry = FARM.animals.filter(a => a.hunger > .6).length;
  $('#farmSt').textContent = FARM.fed > realT ? 'Các con vật đang chạy tới máng ăn…' : hungry ? `${hungry} con vật đang đói, hãy cho ăn nhé!` : 'Các con vật đều no bụng và vui vẻ.';
  const ul = $('#farmPlots'); ul.innerHTML = '';
  FARM.plots.forEach((p, i) => { const li = el('li'); const st = plotStage(p); li.textContent = `Ô ${i + 1}: ` + (st < 0 ? 'đất trống' : `${FRUITS[p.fruit][0]} · ${STAGES[st]}`); if(st === 5) li.className = 'done'; ul.appendChild(li); });
  updateExtButtons();
}
const XHOT = [
  {r:{x:776, y:90, w:104, h:80}, f:() => openMusic('piano')},
  {r:{x:890, y:170, w:120, h:60}, f:() => openMusic('guitar')},
  {r:{x:750, y:60, w:360, h:240}, f:() => openMusic('piano')},
  {r:R.field, f:() => openArcade('football')},
  {r:R.skate, f:() => openArcade('skate')},
  {r:R.patin, f:() => openArcade('patin')},
  {r:R.basket, f:() => openArcade('basket')},
  {r:R.ski, f:() => openArcade('ski')},
  {r:R.bpad, f:() => openArcade('balloon')},
  {r:R.art, f:() => openPaint()},
  {r:R.farm, f:() => openFarm()}
].concat(TENTS.map(([tx, ty]) => ({r:{x:tx - 26, y:ty - 24, w:76, h:44}, f:() => openArcade('bbq')})));
function openPaint(){ showModal('mPaint'); renderGallery(); }
function extInit(){
  initTables(); if(!FARM) farmInit(); easelInit(); loadGallery();
  try { chessDragInit(); } catch(e){}
  arcInit(); paintInit(); musicInit();
  const cc = $('#caroCv'); cc.width = cc.height = 480; cc.addEventListener('click', caroClick);
  const gc = $('#goCv'); gc.width = gc.height = 480; gc.addEventListener('click', goClick);
  document.querySelectorAll('#caroModes button').forEach(b => b.onclick = () => { CARO.mode = b.dataset.m; document.querySelectorAll('#caroModes button').forEach(x => x.setAttribute('aria-pressed', x === b)); caroNew(); });
  $('#caroNew').onclick = caroNew; $('#caroUndo').onclick = caroUndo; $('#caroBlock').onchange = e => { CARO.block2 = e.target.checked; };
  document.querySelectorAll('#goModes button').forEach(b => b.onclick = () => { GO.mode = b.dataset.m; document.querySelectorAll('#goModes button').forEach(x => x.setAttribute('aria-pressed', x === b)); goNew(); });
  document.querySelectorAll('#goSize button').forEach(b => b.onclick = () => { document.querySelectorAll('#goSize button').forEach(x => x.setAttribute('aria-pressed', x === b)); goNew(+b.dataset.n); });
  $('#goNewB').onclick = () => goNew(); $('#goPass').onclick = () => { if(GO.busy || GO.over) return; goPassMove(); if(GO.mode === 'ai' && !GO.over){ GO.busy = true; setTimeout(() => { GO.busy = false; goAI(); }, 300); } }; $('#goUndo').onclick = goUndo;
  caroNew(); goNew(9);
  const fs = $('#fruitSel'); Object.keys(FRUITS).forEach(k => fs.appendChild(el('option', {value:k}, FRUITS[k][0])));
  $('#ffeed').onclick = farmFeed; $('#fplant').onclick = () => farmPlant(fs.value); $('#fwater').onclick = farmWater; $('#fharvest').onclick = farmHarvest;
  document.querySelectorAll('#frides button').forEach(b => b.onclick = () => mount(b.dataset.a));
  $('#fdismount').onclick = () => { dismount(agents.find(a => a.controlled)); renderFarm(); };
  $('#frace').onclick = () => openArcade('race', +$('#fraceSel').value);
  $('#fgo').onclick = () => { hideModal(); goTo(4720, -300, .9); };
  $('#wtabs').querySelectorAll('button').forEach((b, i) => b.onclick = () => { watchT = i; renderWatch(); });
  $('#wplay').onclick = () => openChess();
  const B = (id, f) => { const b = $('#' + id); if(b) b.onclick = f; };
  B('xFarm', openFarm); B('xCaro', () => { showModal('mCaro'); caroDraw(); }); B('xGo', () => { showModal('mGo'); goDraw(); }); B('xPaint', openPaint);
  B('xPiano', () => openMusic('piano')); B('xGuitar', () => openMusic('guitar')); B('xTables', () => openWatch(0));
  B('xFoot', () => openArcade('football')); B('xBasket', () => openArcade('basket')); B('xSkate', () => openArcade('skate')); B('xPatin', () => openArcade('patin')); B('xSki', () => openArcade('ski'));
  B('xBalloon', () => openArcade('balloon')); B('xBbq', () => openArcade('bbq')); B('xRace', () => openArcade('race'));
  B('boatBtn', boardBoat); B('dismountBtn', () => dismount(agents.find(a => a.controlled)));
  B('xSports', () => goTo(3060, -260, .85));
  setInterval(() => { if(openModal && openModal.id === 'mFarm') renderFarm(); }, 2000);
  updateExtButtons();
}



