// Edit mode for the game owner only: place / move / delete decorations, rename signposts and zones, change shop prices.
// The server checks the owner key on every edit, so hiding the button is only for comfort, not security.
const PROPS = {
  oak:['Cây bàng', 'oak'], pine:['Cây thông', 'pine'], sakura:['Hoa anh đào', 'sakura'], palm:['Cây dừa', 'palm'], flowers:['Luống hoa', 'flowers'], bush:['Bụi cây tròn', 'bush'], rock:['Tảng đá', 'rock'],
  bench:['Ghế đá', 'bench'], lamp:['Đèn đường', 'lamp'], statue:['Tượng đá', 'statue'], fountain:['Đài phun nước', 'fountain'], sign:['Bảng gỗ có chữ', null], chest:['Rương báu', 'chest'], balloon:['Bóng bay', null]
};
// builds one decoration as a 3D object at px (x, y)
function prop3D(p){
  const P = PROPS[p.kind]; if(!P) return null;
  if(P[1]) return E3.model(P[1], p.x, p.y, p.kind === 'fountain' ? .7 : .9, 0);
  const g = new THREE.Group(); g.position.set(p.x, 0, p.y); E3.root.add(g);
  if(p.kind === 'sign'){ E3.cyl(0, 0, 4, 3.5, 70, '#5d4037', {seg:6}, g); E3.board(0, 3, 76, p.text || 'Chào mừng!', {size:14, color:'#fff8e1', bg:'#8d6e4a', tilt:-.1}, g); }
  else { ['#ef4b4b', '#3d7bff', '#ffd23f'].forEach((c, k) => { const b = E3.ball((k - 1)*14, 0, 12, c, {z:90 + k*10, flat:false, rough:.3, detail:2}, g); b.scale.y = 1.2; E3.cyl((k - 1)*7, 0, .6, .6, 90 + k*10, '#9e9e9e', {seg:4, cast:false}, g); });
    g.userData.bob = (dt, t) => g.children.forEach((c, i) => { if(c.geometry && c.geometry.type.startsWith('Ico')) c.position.y = 102 + i*3 + Math.sin(t*2 + i)*4; }); E3.ticks.push(g.userData.bob); }
  return g;
}
const EDITOR = {on:false, kind:'oak', sel:null, drag:null, objs:new Map()};
// ---------- props layer (everyone sees it) ----------
function propsRender(scene, list){
  EDITOR.objs.forEach(o => { if(o.g.parent) o.g.parent.remove(o.g); const i = E3.ticks.indexOf(o.g.userData.bob); if(i >= 0) E3.ticks.splice(i, 1); }); EDITOR.objs.clear();
  (list || []).forEach(p => { const g = prop3D(p); if(g) EDITOR.objs.set(p.id, {p, g}); });
  editorMarks(scene);
}
function editorMarks(scene){
  if(scene.editG && scene.editG.parent) scene.editG.parent.remove(scene.editG); scene.editG = null; if(!EDITOR.on || !E3.root) return;
  const g = scene.editG = new THREE.Group(); E3.root.add(g);
  EDITOR.objs.forEach(o => { const sel = EDITOR.sel === o.p.id, r = new THREE.Mesh(new THREE.RingGeometry(28, sel ? 36 : 32, 28), new THREE.MeshBasicMaterial({color:sel ? '#ef4b4b' : '#ffd23f', transparent:true, opacity:.9, depthWrite:false})); r.rotation.x = -Math.PI/2; r.position.set(o.p.x, 3, o.p.y); g.add(r); });
}
const propAt = (x, y) => { let best = null, bd = 34; EDITOR.objs.forEach(o => { const d = Math.hypot(o.p.x - x, o.p.y - y); if(d < bd){ bd = d; best = o.p; } }); return best; };
// ---------- pointer handling while editing (called from the 3D zone with ground px) ----------
function editorPointer(scene, ev, p){
  if(!EDITOR.on || !G.me || !G.me.admin) return false;
  if(ev === 'down'){ const hit = propAt(p.worldX, p.worldY);
    if(hit){ EDITOR.sel = hit.id; EDITOR.drag = {id:hit.id, dx:hit.x - p.worldX, dy:hit.y - p.worldY, moved:false}; editorMarks(scene); edPanel(); return true; }
    let text = ''; if(EDITOR.kind === 'sign'){ text = ($('edSignText').value || '').trim() || 'Chào mừng!'; }
    NET.socket.emit('edit', {op:'addProp', zone:G.zone, kind:EDITOR.kind, x:p.worldX, y:p.worldY, text, color:null}); return true; }
  if(ev === 'move' && EDITOR.drag){ const o = EDITOR.objs.get(EDITOR.drag.id); if(!o) return true; EDITOR.drag.moved = true; o.p.x = Math.round(p.worldX + EDITOR.drag.dx); o.p.y = Math.round(p.worldY + EDITOR.drag.dy); o.g.position.set(o.p.x, 0, o.p.y); editorMarks(scene); return true; }
  if(ev === 'up' && EDITOR.drag){ const dr = EDITOR.drag, o = EDITOR.objs.get(dr.id); EDITOR.drag = null; if(dr.moved && o) NET.socket.emit('edit', {op:'moveProp', zone:G.zone, id:dr.id, x:o.p.x, y:o.p.y}); return true; }
  return false;
}
// ---------- the owner's edit panel ----------
function edToggle(on){ EDITOR.on = on == null ? !EDITOR.on : on; EDITOR.sel = null; document.body.classList.toggle('editing', EDITOR.on); $('edPanel').hidden = !EDITOR.on; $('bEdit').textContent = EDITOR.on ? '✅ Xong sửa' : '✏️ Sửa'; if(EDITOR.on) edPanel(); if(G.scene) editorMarks(G.scene); }
function edPanel(){
  const Z = SHARED.ZONES[G.zone]; if(!Z) return;
  $('edKinds').innerHTML = Object.entries(PROPS).map(([k, v]) => `<button data-k="${k}" class="${EDITOR.kind === k ? 'on' : ''}">${v[0]}</button>`).join('');
  $('edKinds').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { EDITOR.kind = b.dataset.k; edPanel(); });
  $('edSignRow').hidden = EDITOR.kind !== 'sign';
  $('edDel').disabled = !EDITOR.sel;
  $('edZone').value = Z.name;
  $('edSigns').innerHTML = Z.exits.map((e, i) => `<label>Lối ra ${i + 1}<input data-i="${i}" maxlength="40" value="${esc(e.label)}"></label>`).join('');
  $('edPrices').innerHTML = SHARED.CATALOG.map(c => `<label>${esc(c.name)}<input type="number" min="1" max="100000" data-id="${c.id}" value="${c.price}"></label>`).join('');
}
function edInit(){
  $('bEdit').onclick = () => edToggle();
  $('edClose').onclick = () => edToggle(false);
  $('edDel').onclick = () => { if(!EDITOR.sel) return; NET.socket.emit('edit', {op:'delProp', zone:G.zone, id:EDITOR.sel}); EDITOR.sel = null; edPanel(); };
  $('edSaveNames').onclick = () => { if($('edZone').value.trim() !== SHARED.ZONES[G.zone].name) NET.socket.emit('edit', {op:'zoneName', zone:G.zone, name:$('edZone').value.trim() === BASE.names[G.zone] ? '' : $('edZone').value}); $('edSigns').querySelectorAll('input').forEach(i => { const k = G.zone + '|' + i.dataset.i, base = BASE.labels[k]; if(i.value.trim() !== SHARED.ZONES[G.zone].exits[+i.dataset.i].label) NET.socket.emit('edit', {op:'sign', zone:G.zone, idx:+i.dataset.i, label:i.value.trim() === base ? '' : i.value}); }); UI.toast('Đã lưu tên khu và bảng chỉ dẫn cho mọi người.'); };
  $('edSavePrices').onclick = () => { $('edPrices').querySelectorAll('input').forEach(i => { const it = SHARED.CATALOG.find(c => c.id === i.dataset.id); if(it && +i.value !== it.price) NET.socket.emit('edit', {op:'price', id:i.dataset.id, price:+i.value}); }); UI.toast('Đã cập nhật giá cửa hàng.'); };
  $('edTabs').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { $('edTabs').querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); ['place', 'names', 'prices'].forEach(t => $('ed_' + t).hidden = t !== b.dataset.t); });
  document.addEventListener('keydown', e => { if(EDITOR.on && (e.key === 'Delete' || e.key === 'Backspace') && EDITOR.sel && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ $('edDel').click(); e.preventDefault(); } });
}
// ---------- owner overrides that everyone receives (names, signposts, prices) ----------
const BASE = {names:{}, labels:{}, prices:{}};
function applyMeta(meta){
  if(!meta) return; const Zs = SHARED.ZONES;
  Object.keys(Zs).forEach(z => { if(!(z in BASE.names)) BASE.names[z] = Zs[z].name; Zs[z].name = (meta.zoneNames || {})[z] || BASE.names[z];
    Zs[z].exits.forEach((e, i) => { const k = z + '|' + i; if(!(k in BASE.labels)) BASE.labels[k] = e.label; e.label = (meta.signs || {})[k] || BASE.labels[k]; }); });
  SHARED.CATALOG.forEach(c => { if(!(c.id in BASE.prices)) BASE.prices[c.id] = c.price; c.price = (meta.prices || {})[c.id] || BASE.prices[c.id]; });
}
