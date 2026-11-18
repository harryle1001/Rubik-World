// account.js — Tài khoản người chơi của đảo 3D: đăng ký / đăng nhập / khách, "Lưu đăng nhập", xu & vật phẩm.
// Lưu trên máy ở localStorage riêng 'island.accounts' (server không có API tài khoản, chỉ Socket.io).
// Mật khẩu băm PBKDF2-SHA256 (120 000 vòng) — cùng cách băm với game 2D nên tài khoản cũ chuyển sang vẫn đăng nhập đúng mật khẩu.
// Lần đầu chạy: tự chép tài khoản từ game 2D ('truong-accounts-v1') nếu có (chỉ đọc, không sửa dữ liệu 2D).
const KEY = 'island.accounts', GUEST = 'island.guest', OLD = 'truong-accounts-v1', MIGRATED = 'island.migrated';
const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const hex = b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
async function passHash(pass, salt) {
  try {
    if (window.crypto && crypto.subtle) {
      const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
      return 'p2:' + hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, k, 256));
    }
  } catch (e) {}
  // trang không an toàn (http qua mạng LAN) không có crypto.subtle → băm dự phòng như 2D
  let h1 = 0x811c9dc5, h2 = 0x1234567; const s = salt + '|' + pass; for (let r = 0; r < 5000; r++) for (let i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0; h2 = Math.imul(h2 ^ (h1 >>> 7), 2246822519) >>> 0; }
  return 'f1:' + h1.toString(16) + h2.toString(16);
}
const newSalt = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return hex(a); };
// hồ sơ cùng dạng với 2D (level, exp, money = xu, inv = vật phẩm, equip) để chuyển qua lại không mất gì
export const newProfile = (name, look = null) => ({ name, look, level: 1, exp: 0, money: 30, inv: { bike1: Date.now() }, equip: { bike: 'bike1' }, books: {}, fish: {}, stats: { games: 0, catches: 0, read: 0, medals: 0 }, created: Date.now(), cdo: {} });
const needExp = L => Math.round(100 * Math.pow(L, 1.75));

function migrate() {
  if (localStorage.getItem(MIGRATED)) return 0;
  const old = load(OLD), cur = load(KEY) || { users: {} }; cur.users = cur.users || {}; let n = 0;
  if (old && old.users) for (const [name, u] of Object.entries(old.users)) if (!cur.users[name] && u && u.salt && u.hash) { cur.users[name] = { salt: u.salt, hash: u.hash, profile: u.profile || null, from2D: true }; n++; }
  if (old && old.remember && cur.users[old.remember] && !cur.remember) cur.remember = old.remember;
  if (old && old.last && !cur.last) cur.last = old.last;
  store(KEY, cur); try { localStorage.setItem(MIGRATED, String(Date.now())); } catch (e) {}
  return n;
}

export function createAccount() {
  let migrated = 0; try { migrated = migrate(); } catch (e) {}
  const all = () => { const a = load(KEY) || {}; a.users = a.users || {}; return a; };
  const subs = new Set();
  const acc = { name: null, guest: false, profile: null, migrated };
  const emit = () => { for (const f of subs) try { f(acc); } catch (e) {} };
  acc.onChange = f => { subs.add(f); return () => subs.delete(f); };
  acc.save = () => {
    if (!acc.profile) return;
    if (acc.guest) { store(GUEST, acc.profile); return; }
    const a = all(); if (a.users[acc.name]) { a.users[acc.name].profile = acc.profile; a.last = acc.name; store(KEY, a); }
  };
  const enter = (name, profile, guest = false) => { acc.name = name; acc.guest = guest; acc.profile = profile; acc.save(); emit(); };
  acc.register = async (name, pass, remember = true) => {
    name = String(name || '').trim(); if (!/^[\p{L}\p{N}_.\- ]{3,20}$/u.test(name)) return 'Tên đăng nhập cần 3–20 ký tự (chữ, số, dấu cách, _ . -).';
    if (String(pass || '').length < 4) return 'Mật khẩu cần ít nhất 4 ký tự.';
    const a = all(); if (a.users[name]) return 'Tên này đã có người dùng trên máy này. Hãy chọn tên khác hoặc đăng nhập.';
    const salt = newSalt(), g = load(GUEST), prof = newProfile(name);
    if (g && acc.guest) { prof.money = Math.max(prof.money, g.money || 0); Object.assign(prof.inv, g.inv || {}); }   // đang chơi khách → giữ xu & đồ đã kiếm
    a.users[name] = { salt, hash: await passHash(pass, salt), profile: prof }; a.last = name; a.remember = remember ? name : null; store(KEY, a);
    enter(name, prof); return null;
  };
  acc.login = async (name, pass, remember = true) => {
    name = String(name || '').trim(); const a = all(), u = a.users[name];
    if (!u) return 'Không tìm thấy tài khoản này. Hãy bấm "Tạo tài khoản".';
    if (await passHash(String(pass || ''), u.salt) !== u.hash) return 'Sai mật khẩu.';
    a.last = name; a.remember = remember ? name : null; store(KEY, a);
    enter(name, Object.assign(newProfile(name), u.profile || {})); return null;
  };
  acc.playGuest = () => enter('Khách', Object.assign(newProfile('Khách'), load(GUEST) || {}, { name: 'Khách' }), true);
  acc.logout = () => { const a = all(); if (a.remember) { a.remember = null; store(KEY, a); } acc.save(); acc.name = null; acc.guest = false; acc.profile = null; emit(); };
  acc.resume = () => { const a = all(), u = a.remember && a.users[a.remember]; if (!u) return false; enter(a.remember, Object.assign(newProfile(a.remember), u.profile || {})); return true; };   // "Lưu đăng nhập": vào thẳng
  acc.lastName = () => all().last || '';
  // xu & vật phẩm
  Object.defineProperty(acc, 'coins', { get: () => acc.profile ? acc.profile.money | 0 : 0 });
  acc.addCoins = n => { if (!acc.profile) return false; if (acc.profile.money + n < 0) return false; acc.profile.money += n; acc.save(); emit(); return true; };
  acc.addExp = n => { const p = acc.profile; if (!p) return; p.exp += n; while (p.exp >= needExp(p.level)) { p.exp -= needExp(p.level); p.level++; } acc.save(); emit(); };
  acc.addItem = id => { if (!acc.profile || acc.profile.inv[id]) return; acc.profile.inv[id] = Date.now(); acc.save(); emit(); };   // như 2D: inv[id] = lúc nhận
  acc.hasItem = id => !!(acc.profile && acc.profile.inv[id]);
  acc.needExp = needExp;
  setInterval(() => acc.save(), 30000);
  addEventListener('pagehide', () => acc.save());
  return acc;
}
