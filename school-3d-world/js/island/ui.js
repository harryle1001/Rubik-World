// HUD, glass Menu (English + Vietnamese, hold to hear), mini game frame MG, performance panel, toasts, simple synth sounds.
import { store, PLACES } from './util.js';

const $ = s => (window.ISL || document).querySelector(s);
// money, EXP and level are the SAME as in the main game (window.RS bridge); without an account nothing is earned
const RSP = () => window.RS && window.RS.prof;
export const PROF = { get name(){ const p = RSP(); return p ? p.name : 'Bạn'; }, get money(){ const p = RSP(); return p ? p.money : 0; }, set money(v){ const p = RSP(); if(p){ p.money = Math.max(0, Math.round(v)); } }, get exp(){ const p = RSP(); return p ? p.exp : 0; } };
export const level = () => { const p = RSP(); return p ? p.level : 1; };
export function addExp(n){ try { if(window.RS) window.RS.reward(Math.round(n), 0, null, true); } catch(e){} hud(); }
export function saveProf(){ try { window.RS && window.RS.save(); } catch(e){} hud(); }
export function toast(t){ const e = $('#toast'); e.textContent = t; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
// ---------- sound (Web Audio, made in code) ----------
let AC = null; const ac = () => { if(!AC){ try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
export function beep(f = 660, d = .12, type = 'sine', v = .15){ const a = ac(); if(!a || store.get('mute', false)) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = type; o.frequency.setValueAtTime(f*(1 + (Math.random() - .5)*.1), t); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
export const SFX = {tap:() => beep(880, .06, 'triangle', .1), ok:() => { beep(784, .1); setTimeout(() => beep(1175, .12), 70); }, bad:() => beep(220, .18, 'square', .08), coin:() => { beep(1319, .08, 'square', .07); setTimeout(() => beep(1760, .12, 'square', .07), 60); }, bell:() => { beep(2093, .3); setTimeout(() => beep(2637, .35), 130); }};
// ---------- HUD ----------
export const CLOCK = {min:8*60, day:1, speed:10};
export function hud(){ const h = Math.floor(CLOCK.min/60) % 24, m = Math.floor(CLOCK.min % 60); $('#hudName').textContent = PROF.name; $('#hudLv').textContent = 'Level ' + level(); $('#hudMoney').textContent = '$' + PROF.money; $('#hudTime').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ngày ${CLOCK.day}`; }
// ---------- mini game frame ----------
const GAMES = {};
const day = () => new Date().toISOString().slice(0, 10);
export const MG = {
  sfx:k => (SFX[k] || SFX.tap)(),
  register(def){ GAMES[def.id] = def; },
  list:() => Object.values(GAMES),
  money(n){ n = Math.max(1, Math.min(20, Math.round(n))); try { if(window.RS && RSP()) window.RS.reward(0, n, 'Mini game ở Đảo Rubik', true); } catch(e){} hud(); SFX.coin(); return n; },
  start(id){ const G = GAMES[id]; if(!G) return; MG.cur = {G, s:{}, phase:'intro'}; const o = $('#mg'); o.hidden = true; o.hidden = false; document.body.classList.add('mgOn'); MG.intro(); },
  intro(){ const {G} = MG.cur, st = store.get('mg-' + G.id, {best:0, plays:{}}), today = st.plays[day()] || 0;
    $('#mgBody').innerHTML = `<div class="mgIntro"><div class="mgIcon">${G.icon}</div><h2>${G.name}</h2><h3>${G.vi}</h3><p></p><div class="mgSk">${(G.skills || []).map(s => `<span>${s}</span>`).join('')}</div><small>Kỷ lục: ${st.best} · Hôm nay đã chơi ${today} lượt${today >= 10 ? ' (từ lượt 11 thưởng còn một nửa)' : ''}</small><button id="mgGo" class="gold">Bắt đầu ▶</button></div>`;
    $('#mgBody p').textContent = G.howto; $('#mgGo').onclick = () => MG.count(); },
  count(){ let n = 3; $('#mgBody').innerHTML = '<div class="mgCount">3</div>'; const step = () => { n--; if(n <= 0){ MG.play(); return; } $('.mgCount').textContent = n; beep(660, .1); setTimeout(step, 700); }; beep(660, .1); setTimeout(step, 700); },
  play(){ const c = MG.cur; c.phase = 'play'; c.paused = false; $('#mgBody').innerHTML = '<canvas id="mgCv" width="800" height="500"></canvas><button id="mgPause" class="mgPause">❚❚</button>'; const cv = $('#mgCv'), g = cv.getContext('2d'); c.G.init(c.s);
    const pt = (e, t) => { const b = cv.getBoundingClientRect(); c.G.pointer && c.G.pointer(c.s, t, (e.clientX - b.left)*800/b.width, (e.clientY - b.top)*500/b.height); };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pt(e, 'down'); }); cv.addEventListener('pointermove', e => { if(e.buttons || e.pointerType !== 'mouse') pt(e, 'move'); });
    $('#mgPause').onclick = () => { c.paused = !c.paused; $('#mgPause').textContent = c.paused ? '▶' : '❚❚'; };
    let last = performance.now(); const loop = now => { if(MG.cur !== c || c.phase !== 'play') return; const dt = Math.min(.05, (now - last)/1000); last = now; if(!c.paused){ const go = c.G.update(c.s, dt); c.G.draw(c.s, g); if(!go){ MG.finish(c.G.id, {perf:c.G.perf(c.s)}); return; } } requestAnimationFrame(loop); }; requestAnimationFrame(loop); },
  finish(id, {perf}){ const c = MG.cur; c.phase = 'done'; const st = store.get('mg-' + id, {best:0, plays:{}, hist:[]}), d = day(); st.plays[d] = (st.plays[d] || 0) + 1; const score = Math.round(perf*100); const rec = score > st.best; if(rec) st.best = score; st.hist = (st.hist || []).concat([[Date.now(), score]]).slice(-60); store.set('mg-' + id, st);
    let money = 1 + perf*19; if(st.plays[d] > 10) money /= 2; money = MG.money(money); addExp(10 + perf*30);
    const stars = perf >= .85 ? 3 : perf >= .6 ? 2 : perf >= .3 ? 1 : 0, wk = Date.now() - 7*864e5, best = (f) => Math.max(0, ...st.hist.filter(([t]) => f(t)).map(([, s]) => s));
    $('#mgBody').innerHTML = `<div class="mgIntro"><div class="mgStars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><h2>${score} điểm${rec ? ' · Kỷ lục mới!' : ''}</h2><h3>+$${money} · +${Math.round(10 + perf*30)} EXP</h3><div class="mgBoard"><span>Hôm nay<b>${best(t => new Date(t).toISOString().slice(0, 10) === d)}</b></span><span>Tuần<b>${best(t => t > wk)}</b></span><span>Mọi lúc<b>${st.best}</b></span></div><div class="row"><button id="mgAgain" class="gold">Chơi lại</button><button id="mgOut">Về thế giới</button></div></div>`;
    $('#mgAgain').onclick = () => MG.count(); $('#mgOut').onclick = () => MG.close(); SFX.ok(); },
  close(){ MG.cur = null; $('#mg').hidden = true; document.body.classList.remove('mgOn'); },
  key(k){ const c = MG.cur; if(c && c.phase === 'play' && c.G.key) c.G.key(c.s, k); }
};
addEventListener('keydown', e => { if(!MG.cur) return; const k = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', KeyA:'left', KeyD:'right', KeyW:'up', KeyS:'down'}[e.code]; if(k){ MG.key(k); e.preventDefault(); e.stopPropagation(); } if(e.code === 'Escape') MG.close(); }, true);
// ---------- glass menu ----------
let MENU_ITEMS = () => [];
export function setMenu(f){ MENU_ITEMS = f; }
export function openMenu(sub){ const m = $('#menu'); m.hidden = false; renderMenu(sub); SFX.tap(); }
export function closeMenu(){ $('#menu').hidden = true; }
function renderMenu(sub){ const items = MENU_ITEMS(sub), grid = $('#menuGrid'); $('#menuBack').hidden = !sub; grid.innerHTML = ''; $('#menuTitle').textContent = sub ? (items.title || '') : '';
  (items.list || items).forEach(it => { const b = document.createElement('button'); b.className = 'tile' + (it.on ? ' on' : '') + (it.lock ? ' lock' : ''); b.style.setProperty('--ac', it.ac || '#B8C0D8'); b.innerHTML = `<span class="ic">${it.ic}</span><b></b><small></small>`; b.querySelector('b').textContent = it.en; b.querySelector('small').textContent = it.vi + (it.lock ? ` · Level ${it.lock}` : '');
    let hold = 0, held = false; b.onpointerdown = () => { held = false; hold = setTimeout(() => { held = true; speak(it.en); }, 500); }; b.onpointerup = b.onpointerleave = () => clearTimeout(hold); b.oncontextmenu = e => e.preventDefault();
    b.onclick = () => { if(held) return; SFX.tap(); if(it.lock){ toast(`Cần Level ${it.lock} để mở khoá`); return; } if(it.sub){ renderMenu(it.sub); return; } if(!it.stay) closeMenu(); it.f && it.f(); if(it.stay) renderMenu(sub); }; grid.appendChild(b); }); }
function speak(t){ try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} toast(t); }
export function initUI(){ $('#menuBtn').onclick = () => openMenu(); $('#menuClose').onclick = closeMenu; $('#menuBack').onclick = () => renderMenu(); $('#mgClose').onclick = () => MG.close(); hud(); }
// ---------- performance panel ----------
export const PERF = {on:store.get('perf', false), fps:60, frames:0, t:0};
export function perfTick(renderer, dt){ PERF.frames++; PERF.t += dt; if(PERF.t < .5) return; PERF.fps = PERF.frames/PERF.t; PERF.frames = 0; PERF.t = 0; const e = $('#perf'); e.hidden = !PERF.on; if(!PERF.on) return; const i = renderer.info; e.textContent = `FPS ${PERF.fps.toFixed(0)} · lần vẽ ${i.render.calls} · tam giác ${(i.render.triangles/1000).toFixed(0)}k · geo ${i.memory.geometries} · tex ${i.memory.textures}`; }
// ---------- nearby place card ----------
export function placeCard(p, act){ const c = $('#placeCard'); if(!p){ c.hidden = true; c._p = null; return; } if(c._p === p) return; c._p = p; c.hidden = false; c.innerHTML = `<span class="pi">${p.icon || '📍'}</span><div><b></b><small></small></div><button class="gold">${p.game ? 'Chơi' : 'Xem'}</button>`; c.querySelector('b').textContent = `${p.en} · ${p.vi}`; c.querySelector('small').textContent = p.note || 'Tap to play'; c.querySelector('button').onclick = () => act(p); }
export const nearestPlace = (x, z, r = 7) => { let best = null, bd = r; for(const p of PLACES){ if(!p.game) continue; const d = Math.hypot(p.x - x, p.z - z); if(d < bd){ bd = d; best = p; } } return best; };
