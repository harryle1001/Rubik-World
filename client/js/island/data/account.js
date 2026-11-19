// account.js — Tài khoản người chơi của đảo 3D: đăng ký / đăng nhập / khách, "Lưu đăng nhập", xu & vật phẩm.
// ONLINE (server có /api): tài khoản trên server (mật khẩu băm scrypt ở server, đăng nhập bằng token), tiến độ đồng bộ lên server:
//   hồ sơ (xu, cấp, nhà Tứ Linh, đồ) + mọi khoá localStorage island./academy./mg./rs. (nhân vật, nhiệm vụ, vườn, nhà xây…).
// OFFLINE (app không có mạng / server cũ): như trước, lưu trên máy ở localStorage 'island.accounts'.
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
// ---------- đồng bộ server ----------
const API = (window.ISLAND_SERVER || '') + '/api', TOK = 'island.token', TOKN = 'island.tokenName';
const NOSYNC = /^island\.(accounts|guest|migrated|sound|bright|stats|mapOpts|rememberName|token|tokenName|name|tut|cloud\..*|lockDay)$/;
const SYNC = k => /^(island|academy|mg|rs)\./.test(k) && !NOSYNC.test(k);
export const getToken = () => { try { return sessionStorage.getItem(TOK) || localStorage.getItem(TOK) || ''; } catch (e) { return ''; } };
function setToken(t, name, remember) { try { for (const S of [localStorage, sessionStorage]) { S.removeItem(TOK); S.removeItem(TOKN); } if (t) { const S = remember ? localStorage : sessionStorage; S.setItem(TOK, t); S.setItem(TOKN, name); } } catch (e) {} }
const tokenName = () => { try { return sessionStorage.getItem(TOKN) || localStorage.getItem(TOKN) || ''; } catch (e) { return ''; } };
async function call(path, body, method) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(API + path, { method: method || (body ? 'POST' : 'GET'), signal: ctl.signal, headers: Object.assign({ 'Content-Type': 'application/json' }, getToken() ? { Authorization: 'Bearer ' + getToken() } : {}), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({})); return Object.assign(j, { status: r.status });
  } catch (e) { return { status: 0, error: 'Không kết nối được máy chủ.' }; } finally { clearTimeout(to); }
}
export const api = call;
const snapshot = () => { const ls = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SYNC(k)) ls[k] = localStorage.getItem(k); } } catch (e) {} return ls; };
function restore(ls) {   // tiến độ trên server → máy này; trả về true nếu có thay đổi (cần tải lại trang để các phần đọc lại)
  let changed = false; try {
    for (const k of Object.keys(snapshot())) if (!(k in ls)) { localStorage.removeItem(k); changed = true; }
    for (const [k, v] of Object.entries(ls)) if (SYNC(k) && localStorage.getItem(k) !== v) { localStorage.setItem(k, v); changed = true; }
  } catch (e) {}
  return changed;
}
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
  const acc = { name: null, guest: false, profile: null, migrated, cloud: false, online: null, user: null };
  acc.ready = call('/health').then(r => (acc.online = r.status === 200 && !!r.ok)).catch(() => (acc.online = false));
  const cacheK = n => 'island.cloud.' + n;
  let pushT = 0, lastAt = 0;
  const push = keep => { if (!acc.cloud || !getToken()) return; const body = { profile: acc.profile, ls: snapshot(), at: lastAt = Date.now() }; store(cacheK(acc.name) + '.at', lastAt);
    if (keep) { try { fetch(API + '/progress', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() }, body: JSON.stringify(body) }); } catch (e) {} return; }
    call('/progress', body, 'PUT').then(r => { if (r.status === 401) acc.expired(); }); };
  acc.sync = () => { clearTimeout(pushT); pushT = setTimeout(push, 8000); };
  acc.api = call;
  // vào bằng tài khoản server: áp tiến độ của server (nếu có) rồi tải lại trang 1 lần để mọi phần đọc dữ liệu mới
  function enterCloud(u, remember, token) {
    if (token) setToken(token, u.name, remember);
    acc.user = u; acc.cloud = true; const pr = u.progress;
    let reload = false; if (pr && pr.ls) reload = restore(pr.ls); if (pr) store(cacheK(u.name) + '.at', pr.at);
    if (pr && pr.ls && pr.ls['island.hue']) { try { localStorage.setItem('island.hue', pr.ls['island.hue']); } catch (e) {} }
    const prof = Object.assign(newProfile(u.name), (pr && pr.profile) || load(cacheK(u.name)) || {}, { name: u.name });
    enter(u.name, prof); if (!pr) push();
    if (reload && !sessionStorage.getItem('island.restored')) { try { sessionStorage.setItem('island.restored', '1'); } catch (e) {} setTimeout(() => location.reload(), 900); return 'reload'; }
    return null;
  }
  acc.expired = () => { setToken(null); acc.cloud = false; acc.user = null; acc.name = null; acc.profile = null; emit(); };
  const emit = () => { for (const f of subs) try { f(acc); } catch (e) {} };
  acc.onChange = f => { subs.add(f); return () => subs.delete(f); };
  acc.save = () => {
    if (!acc.profile) return;
    if (acc.guest) { store(GUEST, acc.profile); return; }
    if (acc.cloud) { store(cacheK(acc.name), acc.profile); acc.sync(); return; }
    const a = all(); if (a.users[acc.name]) { a.users[acc.name].profile = acc.profile; a.last = acc.name; store(KEY, a); }
  };
  const enter = (name, profile, guest = false) => { acc.name = name; acc.guest = guest; acc.profile = profile; acc.save(); emit(); };
  acc.register = async (name, pass, remember = true) => {
    name = String(name || '').trim();
    if (await acc.ready) {
      const g = acc.guest ? acc.profile : null, prog = { profile: g ? Object.assign(newProfile(name), { money: g.money, inv: g.inv, exp: g.exp, level: g.level, house: g.house }) : null, ls: snapshot() };
      const r = await call('/auth/register', { name, pass, progress: prog }); if (r.error) return r.error;
      enterCloud(r.user, remember, r.token); return null;
    } if (!/^[\p{L}\p{N}_.\- ]{3,20}$/u.test(name)) return 'Tên đăng nhập cần 3–20 ký tự (chữ, số, dấu cách, _ . -).';
    if (String(pass || '').length < 4) return 'Mật khẩu cần ít nhất 4 ký tự.';
    const a = all(); if (a.users[name]) return 'Tên này đã có người dùng trên máy này. Hãy chọn tên khác hoặc đăng nhập.';
    const salt = newSalt(), g = load(GUEST), prof = newProfile(name);
    if (g && acc.guest) { prof.money = Math.max(prof.money, g.money || 0); Object.assign(prof.inv, g.inv || {}); }   // đang chơi khách → giữ xu & đồ đã kiếm
    a.users[name] = { salt, hash: await passHash(pass, salt), profile: prof }; a.last = name; a.remember = remember ? name : null; store(KEY, a);
    enter(name, prof); return null;
  };
  acc.login = async (name, pass, remember = true) => {
    name = String(name || '').trim(); const a = all(), u = a.users[name];
    if (await acc.ready) {
      const r = await call('/auth/login', { name, pass });
      if (r.status === 404 && u && await passHash(String(pass || ''), u.salt) === u.hash) {   // tài khoản cũ chỉ có trên máy này → chuyển lên server, giữ nguyên tiến độ
        if (String(pass).length < 6) return 'Tài khoản cũ cần đổi mật khẩu dài hơn: hãy "Tạo tài khoản" mới với mật khẩu ≥ 6 ký tự.';
        const g = await call('/auth/register', { name, pass, progress: { profile: u.profile, ls: snapshot() } }); if (g.error) return g.error;
        enterCloud(g.user, remember, g.token); return null;
      }
      if (r.error) return r.error; return enterCloud(r.user, remember, r.token);
    }
    if (!u) return 'Không tìm thấy tài khoản này. Hãy bấm "Tạo tài khoản".';
    if (await passHash(String(pass || ''), u.salt) !== u.hash) return 'Sai mật khẩu.';
    a.last = name; a.remember = remember ? name : null; store(KEY, a);
    enter(name, Object.assign(newProfile(name), u.profile || {})); return null;
  };
  acc.playGuest = () => enter('Khách', Object.assign(newProfile('Khách'), load(GUEST) || {}, { name: 'Khách' }), true);
  acc.logout = () => { if (acc.cloud) { push(true); call('/auth/logout', {}); setToken(null); acc.cloud = false; acc.user = null; acc.name = null; acc.profile = null; emit(); return; } const a = all(); if (a.remember) { a.remember = null; store(KEY, a); } acc.save(); acc.name = null; acc.guest = false; acc.profile = null; emit(); };
  acc.resume = () => {
    const tn = getToken() && tokenName();
    if (tn) {   // đã lưu đăng nhập server: vào ngay bằng bản lưu trên máy, kiểm tra token & lấy tiến độ mới ở nền
      acc.cloud = true; enter(tn, Object.assign(newProfile(tn), load(cacheK(tn)) || {}, { name: tn }));
      call('/me').then(r => { if (r.status === 401) { acc.expired(); acc.onExpired && acc.onExpired(); } else if (r.user) { acc.user = r.user; const pr = r.user.progress; if (pr && pr.at > (load(cacheK(tn) + '.at') || 0) && pr.at > lastAt) { enterCloud(r.user, true); } emit(); } });
      return true;
    }
    const a = all(), u = a.remember && a.users[a.remember]; if (!u) return false; enter(a.remember, Object.assign(newProfile(a.remember), u.profile || {})); return true; };   // "Lưu đăng nhập": vào thẳng
  // "Nhớ tên đăng nhập": lưu riêng tên (không lưu mật khẩu) → lần sau ô tên đã điền sẵn
  const NK = 'island.rememberName';
  acc.lastName = () => { try { const v = localStorage.getItem(NK); return v != null ? v : (all().last || ''); } catch (e) { return ''; } };
  acc.rememberName = (name, on) => { try { localStorage.setItem(NK, on ? String(name || '').trim() : ''); } catch (e) {} };
  acc.nameRemembered = () => { try { return localStorage.getItem(NK) !== ''; } catch (e) { return true; } };
  // xu & vật phẩm
  Object.defineProperty(acc, 'coins', { get: () => acc.profile ? acc.profile.money | 0 : 0 });
  acc.addCoins = n => { if (!acc.profile) return false; if (acc.profile.money + n < 0) return false; acc.profile.money += n; acc.save(); emit(); return true; };
  acc.addExp = n => { const p = acc.profile; if (!p) return; p.exp += n; while (p.exp >= needExp(p.level)) { p.exp -= needExp(p.level); p.level++; } acc.save(); emit(); };
  acc.addItem = id => { if (!acc.profile || acc.profile.inv[id]) return; acc.profile.inv[id] = Date.now(); acc.save(); emit(); };   // như 2D: inv[id] = lúc nhận
  acc.hasItem = id => !!(acc.profile && acc.profile.inv[id]);
  acc.needExp = needExp;
  // Nhà Tứ Linh (academy/houses.js): profile.house = { id, at, changes, pts (tuần), week, total, daily }; đổi nhà được 1 lần
  Object.defineProperty(acc, 'house', { get: () => acc.profile && acc.profile.house && acc.profile.house.id || null });
  acc.setHouse = id => {
    const p = acc.profile; if (!p) return false; const h = p.house;
    if (h && h.id) { if (h.id === id || (h.changes | 0) >= 1) return false; h.changes = (h.changes | 0) + 1; h.id = id; h.pts = 0; }
    else p.house = { id, at: Date.now(), changes: 0, pts: 0, week: 0, total: 0, daily: null };
    acc.save(); emit(); return true;
  };
  setInterval(() => acc.save(), 30000);
  addEventListener('pagehide', () => { acc.save(); if (acc.cloud) { clearTimeout(pushT); push(true); } });
  // hằng ngày từ server (sự kiện): thưởng xu + điểm nhà Tứ Linh (cùng cách tính tuần với academy/houses.js)
  acc.addHousePts = n => { const h = acc.profile && acc.profile.house; if (!h || !h.id) return; const w = Math.floor((Date.now() + 4 * 864e5) / (7 * 864e5)); if (h.week !== w) { h.week = w; h.pts = 0; } h.pts = (h.pts | 0) + n; h.total = (h.total | 0) + n; acc.save(); emit(); };
  return acc;
}
