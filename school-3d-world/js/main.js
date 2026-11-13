function extFinalInit(){ extInit(); ext7Init(); ext8Init(); ext9Init(); ext11Init(); ext12Init(); ext13Init(); ext14Init(); ext15Init(); ext16Init(); ext17Init(); ext18Init(); ext19Init(); v16Init(); v17Init(); v18Init(); v19Init(); v21Init(); v22Init(); v23Init(); try { v24Init(); } catch(e){ console.warn('v24', e); } try { v25Init(); } catch(e){ console.warn('v25', e); } try { v26Init(); } catch(e){ console.warn('v26', e); } try { v27Init(); } catch(e){ console.warn('v27', e); } try { v32Init(); } catch(e){ console.warn('v32', e); } try { v33Init(); } catch(e){ console.warn('v33', e); } try { v34Init(); } catch(e){ console.warn('v34', e); } try { v35Init(); } catch(e){ console.warn('v35', e); } try { v36Init(); } catch(e){ console.warn('v36', e); } try { v37Init(); } catch(e){ console.warn('v37', e); } try { v38Init(); } catch(e){ console.warn('v38', e); } try { v39Init(); } catch(e){ console.warn('v39', e); } try { v40Init(); } catch(e){ console.warn('v40', e); } try { v41Init(); } catch(e){ console.warn('v41', e); } try { v42Init(); } catch(e){ console.warn('v42', e); } setTimeout(onlineInit, 2500); }
extFinalInit();

(function wireWorld(){
  const B = (id, f) => { const b = document.getElementById(id); if(b) b.onclick = f; };
  B('wLib', () => openLibrary('vn')); B('wZen', openZen); B('wOly', openOlympics); B('wKart', () => lvlOK('kart', 'Rubik Kart') && openArcade('kart')); B('wAcad', openAcademy); B('wHall', openHall2p); B('wLobby', openLobby);
  B('wGoEast', () => { if(PLAYER && PLAYER.controlled){ toast('Đi theo con đường lớn về phía đông (bên phải) để tới vùng đất mới.'); } goTo(6400, 300, .55); });
  B('wSea', () => goTo(4000, 3500, .25)); B('hBoat', boardBoat);
  // ---------- 3D World bridge: the same game, drawn by js/three/view3d.js ----------
  window.RS = {
    get PLAYER(){ return PLAYER; }, get agents(){ return agents; }, get npcs(){ return npcs; }, get cars(){ return cars; }, get ships(){ return ships; }, npcShown,
    R, HOUSES, TREES, FOREST_TREES, LIGHTHOUSE, ROOMS:['rubik', 'chess', 'music', 'hall', 'rubikyard', 'office', 'elec'], W, H, NY,
    get cam(){ return cam; }, get clock(){ return clock; }, get season(){ return season; }, get weather(){ return weather; }, get cw(){ return cw; }, get ch(){ return ch; }, get DPR(){ return DPR; },
    covered(){ if(RS.islandOn) return true; try { return v39Covered(); } catch(e){ return false; } },
    get prof(){ return PROF; }, reward(e, m, w, q){ return reward(e, m, w, q); }, save(){ try { saveProfile(); renderProfHud(); } catch(e){} }, toast(t){ toast(t); }, PIER_END,
    extraTiles:[], extraDoors:[], islandOn:false,
    bake(tc, x0, y0, x1, y1, sc){ withCtx(tc, () => { const vb = VB; ctx.setTransform(sc, 0, 0, sc, -x0*sc, -y0*sc); ctx.imageSmoothingEnabled = false; VB = {x0, y0, x1, y1};
      for(const f of [drawGround, () => v20Soft(), drawForestDyn, drawSea, drawBuildings, () => v20Rooms()]) { try { f(); } catch(e){} } VB = vb; }); },
    setProj(tw, ts){ toWorld = tw; toScreen = ts; },
    enable3D(){ const old = render; render = function(dt){ if(RS.covered()) return; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, cw, ch); VB = {x0:cam.x - 2600, x1:cam.x + 2600, y0:cam.y - 2000, y1:cam.y + 2000}; try { RS.hook3D && RS.hook3D(dt); } catch(e){ console.warn('3d', e); } try { drawLabels(); } catch(e){} }; RS.render2D = old; }
  };
  { const mi = v32Items; v32Items = function(){ return mi().concat(RS.extraTiles); }; const vd = v36Doors; v36Doors = function(d){ vd(d); for(const x of RS.extraDoors) d.push(x); }; }
  window.dispatchEvent(new Event('rs-ready'));
})();
