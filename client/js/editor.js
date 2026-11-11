// Edit mode for the game owner only: place / move / delete decorations, rename signposts and zones, change shop prices.
// The server checks the owner key on every edit, so hiding the button is only for comfort, not security.
const PROPS = {
  oak:['Cây bàng', d => { d.ell('#000', 0, 4, 18, 5, .2); d.rect('#5d4037', -3, -18, 6, 22); d.circ('#2e7d32', 0, -34, 20); d.circ('#388e3c', -12, -24, 14); d.circ('#43a047', 12, -26, 14); }],
  pine:['Cây thông', d => { d.ell('#000', 0, 4, 16, 5, .2); d.rect('#5d4037', -3, -12, 6, 16); for(let k=0;k<3;k++) d.tri(['#1b5e20','#2e7d32','#388e3c'][k], -24 + k*5, -8 - k*16, 24 - k*5, -8 - k*16, 0, -40 - k*14); }],
  sakura:['Hoa anh đào', d => { d.rect('#5d4037', -3, -20, 6, 24); [[0, -38, 20], [-16, -28, 14], [16, -28, 14], [-6, -50, 12], [10, -48, 12]].forEach(([a, b, r], i) => d.circ(['#f8bbd0','#f48fb1','#fce4ec'][i % 3], a, b, r)); }],
  palm:['Cây dừa', d => { d.line('#8d6e4a', 0, 0, 6, -50, 5); for(let k=0;k<6;k++){ const a = k*Math.PI/3; d.tri('#2e7d32', 6, -50, 6 + Math.cos(a)*30, -50 + Math.sin(a)*12, 6 + Math.cos(a + .3)*26, -50 + Math.sin(a + .3)*10); } }],
  flowers:['Luống hoa', d => { d.ell('#6d4c2e', 0, 0, 26, 9); for(let k=0;k<9;k++) d.circ(['#ff6f91','#ffd23f','#ffffff','#ba68c8','#ff8a65'][k % 5], -20 + (k % 5)*10, -4 + Math.floor(k/5)*6, 3.5); }],
  bush:['Bụi cây tròn', d => { d.ell('#000', 0, 3, 18, 5, .2); d.circ('#2e7d32', 0, -10, 14); d.circ('#43a047', -8, -6, 9); d.circ('#388e3c', 9, -7, 9); d.circ('#e91e63', 4, -14, 2); }],
  rock:['Tảng đá', d => { d.ell('#000', 0, 3, 18, 5, .2); d.ell('#9e9e9e', 0, -6, 18, 11); d.ell('#bdbdbd', -4, -10, 9, 5); }],
  bench:['Ghế đá', d => { d.rect('#8d6e4a', -22, -12, 44, 6); d.rect('#6d4c2e', -22, -22, 44, 4); d.rect('#3e2723', -20, -6, 4, 8); d.rect('#3e2723', 16, -6, 4, 8); }],
  lamp:['Đèn đường', d => { d.rect('#212121', -2, -44, 4, 44); d.rect('#212121', -7, -50, 14, 4); d.rect('#fff59d', -5, -46, 10, 8); d.circ('#ffe082', 0, -42, 14, .25); }],
  statue:['Tượng đá', d => { d.rect('#cfc6b4', -12, -8, 24, 10); d.rect('#f4f1ea', -5, -36, 10, 28); d.circ('#f4f1ea', 0, -42, 6); }],
  fountain:['Đài phun nước', d => { d.ell('#e6e0d3', 0, 0, 40, 18); d.ell('#4fc3f7', 0, -2, 33, 13); d.rect('#e6e0d3', -4, -26, 8, 24); d.circ('#e1f5fe', 0, -30, 6, .8); }],
  sign:['Bảng gỗ có chữ', d => { d.rect('#5d4037', -3, -40, 6, 42); d.rect('#8d6e4a', -40, -64, 80, 26); }],
  chest:['Rương báu', d => { d.rect('#8d6e4a', -16, -18, 32, 18); d.rect('#6d4c2e', -16, -22, 32, 6); d.rect('#ffd23f', -3, -16, 6, 6); }],
  balloon:['Bóng bay', d => { d.line('#9e9e9e', 0, 0, 0, -30, 1); d.ell('#ef4b4b', -6, -40, 8, 10); d.ell('#3d7bff', 6, -44, 8, 10); d.ell('#ffd23f', 0, -50, 8, 10); }]
};
const EDITOR = {on:false, kind:'oak', sel:null, drag:null, objs:new Map()};
// ---------- props layer (everyone sees it) ----------
function propsRender(scene, list){
  EDITOR.objs.forEach(o => { o.g.destroy(); if(o.t) o.t.destroy(); }); EDITOR.objs.clear();
  (list || []).forEach(p => { const P = PROPS[p.kind]; if(!P) return; const g = scene.add.graphics(); P[1](PG(g, p.x, p.y, 1)); g.setDepth(p.y);
    let t = null; if(p.kind === 'sign' && p.text) t = scene.add.text(p.x, p.y - 51, p.text, {fontFamily:'Segoe UI, Arial', fontSize:'13px', color:'#fff8e1'}).setOrigin(.5).setDepth(p.y + 1);
    EDITOR.objs.set(p.id, {p, g, t}); });
  editorMarks(scene);
}
function editorMarks(scene){
  if(scene.editG) scene.editG.destroy(); scene.editG = null; if(!EDITOR.on) return;
  const g = scene.editG = scene.add.graphics().setDepth(9000); g.lineStyle(2, 0xffd23f, .9);
  EDITOR.objs.forEach(o => { const sel = EDITOR.sel === o.p.id; g.lineStyle(sel ? 3 : 1.5, sel ? 0xef4b4b : 0xffd23f, .9); g.strokeCircle(o.p.x, o.p.y - 18, 30); });
}
const propAt = (x, y) => { let best = null, bd = 34; EDITOR.objs.forEach(o => { const d = Math.hypot(o.p.x - x, o.p.y - 18 - y); if(d < bd){ bd = d; best = o.p; } }); return best; };
// ---------- pointer handling while editing (called from ZoneScene) ----------
function editorPointer(scene, ev, p){
  if(!EDITOR.on || !G.me || !G.me.admin) return false;
  if(ev === 'down'){ const hit = propAt(p.worldX, p.worldY);
    if(hit){ EDITOR.sel = hit.id; EDITOR.drag = {id:hit.id, dx:hit.x - p.worldX, dy:hit.y - p.worldY, moved:false}; editorMarks(scene); edPanel(); return true; }
    let text = ''; if(EDITOR.kind === 'sign'){ text = ($('edSignText').value || '').trim() || 'Chào mừng!'; }
    NET.socket.emit('edit', {op:'addProp', zone:G.zone, kind:EDITOR.kind, x:p.worldX, y:p.worldY, text, color:null}); return true; }
  if(ev === 'move' && EDITOR.drag){ const o = EDITOR.objs.get(EDITOR.drag.id); if(!o) return true; EDITOR.drag.moved = true; o.p.x = Math.round(p.worldX + EDITOR.drag.dx); o.p.y = Math.round(p.worldY + EDITOR.drag.dy); o.g.setPosition(0, 0); o.g.clear(); PROPS[o.p.kind][1](PG(o.g, o.p.x, o.p.y, 1)); o.g.setDepth(o.p.y); if(o.t) o.t.setPosition(o.p.x, o.p.y - 51); editorMarks(scene); return true; }
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
