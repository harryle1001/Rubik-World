// inventory.js — TÚI ĐỒ dạng ô lưới + ĐỔI GỖ RA KHỐI XÂY DỰNG. Tự lưu vào localStorage.
// - Tên & biểu tượng vật phẩm: ITEMS        - Giá đổi khối: CONFIG.BLOCKS (trong config.js)
// - Số ô tối thiểu của túi: MIN_SLOTS
import { CONFIG } from './config.js';

export const ITEMS = {
  wood: { name: 'Gỗ', icon: '🪵' },
  bamboo: { name: 'Tre', icon: '🎋' },
  coconut: { name: 'Dừa', icon: '🥥' },
  star: { name: 'Sao học tập', icon: '⭐' },
};
for (const b of CONFIG.BLOCKS) ITEMS['block_' + b.id] = { name: b.name, icon: b.icon, block: true };
const MIN_SLOTS = 20;

export function createInventory(ctx) {
  let items = {};
  try { items = JSON.parse(localStorage.getItem(CONFIG.save.inv) || '{}') || {}; } catch (e) {}
  if (!Object.keys(items).length) items = { wood: 8, bamboo: 4 }; // quà khởi đầu
  const save = () => { try { localStorage.setItem(CONFIG.save.inv, JSON.stringify(items)); } catch (e) {} };
  const panel = document.getElementById('inv'), grid = document.getElementById('invGrid'), craft = document.getElementById('invCraft'), info = document.getElementById('invInfo');
  const hudWood = document.getElementById('hWood'), hudStar = document.getElementById('hStar');
  let selected = null;

  const count = id => items[id] || 0;
  const canPay = cost => Object.entries(cost).every(([k, v]) => count(k) >= v);
  const costText = cost => Object.entries(cost).map(([k, v]) => `${v} ${ITEMS[k].icon}`).join(' + ');
  function add(id, n = 1, pop = false) {
    items[id] = Math.max(0, count(id) + n); if (!items[id]) delete items[id];
    save(); refresh();
    if (pop && n > 0) ctx.toast(`+${n} ${ITEMS[id].icon} ${ITEMS[id].name}`, true);
    ctx.onInventory && ctx.onInventory();
  }
  function pay(cost) { if (!canPay(cost)) return false; for (const [k, v] of Object.entries(cost)) items[k] -= v; for (const k in items) if (!items[k]) delete items[k]; save(); refresh(); return true; }

  function refresh() {
    hudWood.textContent = count('wood'); hudStar.textContent = count('star');
    if (panel.hidden) return;
    const ids = Object.keys(ITEMS).filter(id => count(id) > 0);
    const slots = Math.max(MIN_SLOTS, Math.ceil(ids.length / 5) * 5);
    let h = '';
    for (let i = 0; i < slots; i++) { const id = ids[i]; h += id ? `<button class="slot${selected === id ? ' sel' : ''}" data-id="${id}" title="${ITEMS[id].name}"><span>${ITEMS[id].icon}</span><b>${count(id)}</b></button>` : '<div class="slot empty"></div>'; }
    grid.innerHTML = h;
    grid.querySelectorAll('button.slot').forEach(b => b.onclick = () => { selected = b.dataset.id; refresh(); });
    info.textContent = selected && count(selected) ? `${ITEMS[selected].icon} ${ITEMS[selected].name} × ${count(selected)}${ITEMS[selected].block ? ' — vào chế độ Xây để đặt khối này.' : selected === 'wood' ? ' — chặt cây để có thêm, đổi ra khối ở bên dưới.' : selected === 'star' ? ' — nhận được khi trả lời đúng ở các khu học tập.' : ''}` : 'Chọn một ô để xem chi tiết.';
    craft.innerHTML = CONFIG.BLOCKS.map(b => `<div class="recipe"><span class="ri">${b.icon}</span><span class="rn">${b.name}<small>${costText(b.cost)}</small></span><button data-b="${b.id}" data-n="1" ${canPay(b.cost) ? '' : 'disabled'}>Đổi</button><button data-b="${b.id}" data-n="5" ${canPay(Object.fromEntries(Object.entries(b.cost).map(([k, v]) => [k, v * 5]))) ? '' : 'disabled'}>×5</button></div>`).join('');
    craft.querySelectorAll('button').forEach(btn => btn.onclick = () => {
      const b = CONFIG.BLOCKS.find(x => x.id === btn.dataset.b), n = +btn.dataset.n;
      const cost = Object.fromEntries(Object.entries(b.cost).map(([k, v]) => [k, v * n]));
      if (pay(cost)) { add('block_' + b.id, n); ctx.sfx && ctx.sfx('craft'); ctx.toast(`Đã đổi được ${n} ${b.icon} ${b.name}`); }
    });
  }
  const open = () => { panel.hidden = false; refresh(); };
  const close = () => { panel.hidden = true; };
  document.getElementById('invClose').onclick = close;
  refresh();
  return { add, count, pay, canPay, open, close, toggle: () => (panel.hidden ? open() : close()), get isOpen() { return !panel.hidden; }, refresh };
}
