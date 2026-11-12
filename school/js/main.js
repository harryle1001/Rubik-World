function extFinalInit(){ extInit(); ext7Init(); ext8Init(); ext9Init(); ext11Init(); ext12Init(); ext13Init(); ext14Init(); ext15Init(); ext16Init(); ext17Init(); ext18Init(); ext19Init(); v16Init(); v17Init(); v18Init(); v19Init(); v21Init(); v22Init(); v23Init(); try { v24Init(); } catch(e){ console.warn('v24', e); } try { v25Init(); } catch(e){ console.warn('v25', e); } try { v26Init(); } catch(e){ console.warn('v26', e); } try { v27Init(); } catch(e){ console.warn('v27', e); } try { v32Init(); } catch(e){ console.warn('v32', e); } try { v33Init(); } catch(e){ console.warn('v33', e); } try { v34Init(); } catch(e){ console.warn('v34', e); } try { v35Init(); } catch(e){ console.warn('v35', e); } try { v36Init(); } catch(e){ console.warn('v36', e); } try { v37Init(); } catch(e){ console.warn('v37', e); } try { v38Init(); } catch(e){ console.warn('v38', e); } try { v39Init(); } catch(e){ console.warn('v39', e); } setTimeout(onlineInit, 2500); }
extFinalInit();

(function wireWorld(){
  const B = (id, f) => { const b = document.getElementById(id); if(b) b.onclick = f; };
  B('wLib', () => openLibrary('vn')); B('wZen', openZen); B('wOly', openOlympics); B('wKart', () => lvlOK('kart', 'Rubik Kart') && openArcade('kart')); B('wAcad', openAcademy); B('wHall', openHall2p); B('wLobby', openLobby);
  B('wGoEast', () => { if(PLAYER && PLAYER.controlled){ toast('Đi theo con đường lớn về phía đông (bên phải) để tới vùng đất mới.'); } goTo(6400, 300, .55); });
  B('wSea', () => goTo(4000, 3500, .25)); B('hBoat', boardBoat);
})();

