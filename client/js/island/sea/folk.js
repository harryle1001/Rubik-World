// sea/folk.js — NGƯ DÂN & NGƯỜI CÂU CÁ của Làng chài Vịnh Én (nhân vật có sẵn: characters.js loadHero — chỉ gọi API).
//   Nhịp một ngày: chợ cá 5 h – 8 h 30 · vá lưới, phơi cá, cho cá lồng bè ăn ban ngày · kéo lưới trên bãi lúc chiều · tối về nhà sàn.
//   Người câu trên cầu tàu / mỏm đá / thuyền thúng: vung cần → phao nhấp → giật cá → khoe cá. Người chơi nói chuyện (nghề biển,
//   các loài cá, bảo vệ biển, an toàn đi biển), ngồi câu cạnh (mini game câu cá tại chỗ: ctx.mg.start('fishing')) và thi câu 144 s.
//   Hiệu năng: mỗi người 1 draw call (không viền, không bóng khi xa), ẩn ngoài 89 m (điện thoại 55 m), animation theo LOD (stepAnim).
import * as THREE from 'three';
import { loadHero, STUDENTS, setOutline, stepAnim, actorLod } from '../characters.js';
import { loadModel } from '../models.js';
import { CFG } from '../config.js';
import { PHI, BAY, toW, PIER_V, PIER_U1, HEAD_W, HEAD_D, DECK_Y, CAGES, NAME } from './site.js';

const MOB = CFG.isMobile, VIS = MOB ? 55 : 89, SAVE = 'sea.talk';
// Lời thoại: mỗi người một chủ đề; đúng kiến thức, câu ngắn cho học sinh tiểu học
const TALK = {
  tu: { name: 'Bác Tư', icon: '🧓', topic: 'Nghề biển', lines: [
    'Bác đang <b>vá lưới</b>. Mắt lưới phải đủ to để cá con chui ra được, lớn lên rồi mới bắt.',
    'Ghe làng mình <b>ra khơi lúc rạng sáng</b>, khi cá nổi lên ăn, và về bến lúc chiều.',
    '<b>Mắt thuyền</b> vẽ ở mũi ghe để thuyền "nhìn" thấy đường, tránh đá ngầm — tục có từ thời ông bà.',
    '<b>Thuyền thúng</b> đan bằng tre, trét dầu rái cho kín nước. Tròn vậy chứ chèo khéo là đi thẳng băng!',
    'Xem <b>hướng gió</b> và màu mây là biết hôm nay có ra khơi được không. Gió giật, mây đen kéo tới thì ở nhà.'] },
  ba: { name: 'Cô Ba', icon: '👩', topic: 'Các loài cá', lines: [
    'Cá mới về đây! <b>Cá thu, cá nục, cá ngừ</b> là cá biển khơi, bơi nhanh nên thân thuôn như quả ngư lôi.',
    'Cá tươi thì <b>mắt trong, mang đỏ</b>, ấn vào thịt đàn hồi. Con nhớ để đi chợ giúp mẹ nhé.',
    '<b>Mực</b> không phải là cá đâu: nó là động vật thân mềm, phun mực để trốn kẻ thù.',
    'Cá <b>phơi khô</b> để dành ăn lâu: nắng làm nước trong cá bay hơi, vi khuẩn khó sống.',
    'Nước mắm làm từ <b>cá cơm ủ muối</b> cả năm trời trong thùng gỗ — đặc sản làng biển Việt Nam.'] },
  hoa: { name: 'Chị Hoa', icon: '👩‍🌾', topic: 'Nuôi biển', lines: [
    'Chị trồng <b>rong sụn</b> trên dây ngoài kia. Rong biển quang hợp như cây, nhả ô-xi và hút bớt khí CO₂.',
    '<b>Lồng bè</b> nuôi cá mú, cá bớp. Cho ăn vừa đủ thôi, thừa thức ăn là bẩn nước, cá dễ bệnh.',
    'Nước biển mặn khoảng <b>35 gam muối trong 1 lít</b>. Cá nước ngọt thả xuống đây không sống nổi.',
    'Nuôi biển phải xem <b>thuỷ triều</b>: Mặt Trăng hút nước biển, mỗi ngày nước lên xuống.'] },
  sau: { name: 'Chú Sáu', icon: '👨', topic: 'Bảo vệ biển', lines: [
    'Chú không dùng lưới mắt nhỏ, không đánh bằng thuốc nổ. <b>Còn cá con thì mai còn cá</b>.',
    'Gặp <b>rùa biển</b> mắc lưới là gỡ thả ngay. Rùa hay ăn nhầm túi ni-lông vì tưởng là sứa đó con.',
    '<b>Rác nhựa</b> trôi ra biển phải mấy trăm năm mới tan. Con nhặt rác trên bãi là giúp biển nhiều lắm.',
    '<b>San hô</b> là nhà của cá. Thả neo phải tránh rạn, lặn ngắm thì đừng bẻ, đừng giẫm.',
    'Mùa cá đẻ, làng mình <b>nghỉ đánh bắt</b> ở vùng cá con để đàn cá kịp lớn.'] },
  hai: { name: 'Anh Hải', icon: '🧑', topic: 'Kéo lưới', lines: [
    'Một, hai, ba… kéo! <b>Lưới rùng</b> thả vòng ngoài kia, cả xóm kéo hai đầu vào bờ.',
    'Kéo lưới phải <b>đều tay, cùng nhịp</b>, giống kéo co ở trường em vậy đó.',
    'Cá nhỏ quá thì <b>thả lại biển</b>. Chỉ lấy đủ ăn, đủ bán thôi.'] },
  nam: { name: 'Ông Năm', icon: '👴', topic: 'An toàn đi biển', lines: [
    'Xuống thuyền là phải <b>mặc áo phao</b>, bơi giỏi mấy cũng mặc. Biển không đùa được đâu cháu.',
    'Thấy <b>mây đen, gió giật, sóng bạc đầu</b> là quay vào bờ ngay. Ghe làng ông giông tới là về bến hết.',
    'Ban đêm tàu thuyền bật <b>đèn đỏ mạn trái, đèn xanh mạn phải</b>, đèn trắng trên cột để thấy nhau mà tránh.',
    'Hai <b>phao tiêu</b> đỏ – xanh ngoài kia đánh dấu luồng: thuyền từ biển vào đi giữa hai phao.',
    'Bị <b>dòng rút</b> kéo ra xa thì đừng bơi ngược: bơi ngang song song bờ cho thoát rồi mới vào.',
    'Tắm biển phải có <b>người lớn đi cùng</b>, không tắm khi trời giông hay lúc vừa ăn no.'] },
  bay: { name: 'Chú Bảy', icon: '🎣', topic: 'Câu cá', lines: [
    'Suỵt… câu cá cần <b>kiên nhẫn</b>. Phao nhấp nhẹ là cá rỉa, phao chìm hẳn mới giật.',
    'Sáng sớm và chiều mát cá <b>ăn mồi mạnh nhất</b>. Trưa nắng cá lặn sâu cho mát.',
    'Cá nhỏ bằng bàn tay thì chú <b>thả về nước</b>. Ngồi xuống câu chung với chú đi!'] },
  muoi: { name: 'Chị Mười', icon: '🎣', topic: 'Câu cá', lines: [
    'Dây câu căng quá là đứt: cá kéo thì <b>nhả dây</b>, cá mệt mới <b>cuộn vào</b>.',
    'Lưỡi câu sắc lắm, câu xong nhớ <b>cất gọn</b>, đừng vứt dây cước xuống biển kẻo chim, rùa mắc phải.'] },
  da: { name: 'Bác Chín', icon: '🎣', topic: 'Câu cá mỏm đá', lines: [
    'Mỏm đá có <b>cá mú, cá hồng</b> nấp trong hốc. Nhưng đá trơn, phải đi dép có đế bám nghe con.',
    'Sóng to là bác về liền: đứng mỏm đá lúc biển động rất <b>nguy hiểm</b>.'] },
  thung: { name: 'Chú Út', icon: '🛶', topic: 'Thuyền thúng', lines: [
    'Chèo thúng phải <b>lắc mái chèo hình số 8</b> thì thúng mới đi thẳng. Lắc sai là xoay vòng vòng!'] },
};
const NPCS = () => {
  return [
    { id: 'tu', kind: 0, look: { role: 'adult', old: true, shirt: '#8a6a4a', pants: '#3a3a44', hat: '#e8c873', hatStyle: 'nonla' } },
    { id: 'ba', kind: 1, look: { role: 'adult', shirt: '#c9566a', pants: '#2a2a33', hat: '#e8c873', hatStyle: 'nonla' } },
    { id: 'nam', kind: 4, look: { role: 'adult', old: true, shirt: '#e8e2d0', pants: '#4a4a55' } },
    { id: 'bay', kind: 2, look: { role: 'adult', shirt: '#3d7a5a', pants: '#3a3a44', hat: '#e8c873', hatStyle: 'nonla', prop: 'rod' }, angler: { u: PIER_U1 - 2.6, v: PIER_V - HEAD_W / 2 + 0.55, ry: Math.PI / 2 } },
    { id: 'sau', kind: 6, look: { role: 'adult', tee: true, stripe: '#2b6cb0', shirt: '#f4efe2', shorts: true, pants: '#3a4a66' } },
    { id: 'da', kind: 8, look: { role: 'adult', old: true, shirt: '#6a7a8a', pants: '#3a3a44', hat: '#e8c873', hatStyle: 'nonla', prop: 'rod' }, angler: 'rock' },
    { id: 'hai', kind: 10, look: { role: 'adult', tee: true, shirt: '#e8a23a', shorts: true, pants: '#2a4a66' } },
    { id: 'thung', kind: 2, look: { role: 'adult', shirt: '#7a5a8a', pants: '#3a3a44', hat: '#e8c873', hatStyle: 'nonla', prop: 'rod' }, angler: 'thung' },
    { id: 'hoa', kind: 3, look: { role: 'adult', shirt: '#5a9fc9', pants: '#2a2a33', hat: '#e8c873', hatStyle: 'nonla' }, desk: true },
    { id: 'muoi', kind: 5, look: { role: 'adult', shirt: '#d98a5a', pants: '#2a2a33', prop: 'rod' }, angler: { u: PIER_U1 - 1.2, v: PIER_V + HEAD_W / 2 - 0.55, ry: -Math.PI / 2 }, desk: true },
  ].filter(q => !(MOB && q.desk));
};

export function createFolk(ctx, { village, fleet }) {
  const { scene, terrain } = ctx, H = terrain.heightAt, pl = ctx.player;
  const done = (() => { try { return JSON.parse(localStorage.getItem(SAVE) || '{}'); } catch (e) { return {}; } })();
  const groundAt = (x, z) => Math.max(H(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 9) : -99);
  const S = (u, v, ry = 0, act = 'idle', y = null) => { const [x, z] = toW(u, v); return { x, z, y: y ?? groundAt(x, z), ry: BAY.ry + ry, act }; };
  const hut = i => village.hutPos[Math.min(i, village.hutPos.length - 1)];
  const home = (i, act = 'rest') => { const h = hut(i); return S(h.u - 3.1, h.v + (i % 2 ? -1.6 : 1.6), Math.PI, act, 1.3); };
  // mỏm đá phía nam vịnh: tìm chỗ cao 1,3–3 m sát mép nước
  const rock = (() => { for (let v = 34; v < 56; v += 1) { const su = village.shoreU(v); for (let du = -1.5; du > -6; du -= 0.5) { const [x, z] = toW(su + du, v), h = H(x, z); if (h > 1.3 && h < 3.2 && H(...toW(su + 3.5, v)) < -1.5) return { x, z, y: h, ry: BAY.ry, act: 'fish' }; } } return S(village.shoreU(38) - 2, 38, 0, 'fish'); })();

  // ---- lịch trong ngày của từng người: (giờ) → chỗ + việc ----
  const R0 = village.racks[0], R1 = village.racks[1], D0 = village.dry[0], D1 = village.dry[1], ST = village.stalls, M = village.mats;
  const walk = (a, b, period) => ({ walk: [a, b], period });
  const plan = {
    tu: h => h >= 5.5 && h < 18 ? S(R0.u + 1.5, R0.v + 0.8, Math.PI, 'mend') : h < 21.5 && h >= 18 ? home(0) : null,
    ba: h => village.market ? S(ST[0].u - 1.15, ST[0].v, 0, 'sell') : h >= 8.5 && h < 16.5 ? S(D0.u - 1.5, D0.v + 0.5, 0, 'work') : h >= 16.5 && h < 21.5 ? home(3) : null,
    hoa: h => village.market ? S(ST[1].u - 1.15, ST[1].v, 0, 'sell') : h >= 8.5 && h < 16.5 ? S(D1.u - 1.5, D1.v - 0.4, 0, 'work') : h >= 16.5 && h < 21.5 ? home(4) : null,
    sau: h => village.market ? walk(S(26, PIER_V + 0.5, Math.PI), S(M[1].u + 1.6, M[1].v - 0.3, Math.PI), 34) : h >= 8.5 && h < 16.3 ? S(CAGES.u + 1.2, CAGES.v + 0.4, Math.PI / 2, 'work', 0.5) : h >= 16.3 && h < 18.4 ? S(village.shoreU(25.6) - 1.0, 25.6, 0, 'pull') : h < 21.5 && h >= 18.4 ? home(1) : null,
    hai: h => h >= 15.8 && h < 18.4 ? S(village.shoreU(22.6) - 1.0, 22.6, 0, 'pull') : village.market ? S(M[0].u - 1.3, M[0].v, 0, 'sell') : h >= 18.4 && h < 21.5 ? home(2) : null,
    nam: h => h >= 5.2 && h < 19.5 ? S(PIER_U1 - HEAD_D + 1.12, PIER_V + 6.2, 0, 'sit', DECK_Y) : null,
  };
  const anglerHours = h => h >= 5.3 && h < 18.6 && !fleet.stormy;

  // ---- nhân vật ----
  const folk = [];
  for (const q of NPCS()) {
    const f = { ...q, T: TALK[q.id], hero: null, slot: null, an: {}, li: done[q.id] || 0, act: '', t: Math.random() * 5, phase: 0, pos: new THREE.Vector3(), face: 0 };
    folk.push(f);
    loadHero(STUDENTS[q.kind % STUDENTS.length], 1.66 + (q.kind % 3) * 0.05, q.look).then(h => {
      if (!h) return; setOutline(h, false); h.model.visible = false; h.model.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(h.model); f.hero = h; f.hand = h.model.getObjectByName('handr') || h.model.getObjectByName('hand.r') || null;
    });
  }
  // ---- dây câu + phao + cá vừa câu (1 LineSegments + 1 Points cho mọi người câu) ----
  const anglers = folk.filter(f => f.angler), NA = anglers.length;
  const lgeo = new THREE.BufferGeometry(), lpos = new Float32Array(NA * 6); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: '#f4f4f0', transparent: true, opacity: 0.7 })); lines.frustumCulled = false; lines.name = 'sea-fishline'; scene.add(lines);
  const fgeo = new THREE.BufferGeometry(), fpos = new Float32Array(NA * 3); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const floats = new THREE.Points(fgeo, new THREE.PointsMaterial({ color: '#ff5a3a', size: 0.22, sizeAttenuation: true })); floats.frustumCulled = false; scene.add(floats);
  anglers.forEach((f, i) => { f.ai = i; f.cast = 3 + Math.random() * 5; f.bite = 8 + Math.random() * 13; f.show = 0; f.catches = 0; });
  let fishModel = null; loadModel('kit/fish').then(m => { if (!m) return; m.visible = false; m.scale.setScalar(0.75); scene.add(m); fishModel = m; });

  // ---- thi câu ----
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(max(12px,env(safe-area-inset-top)) + ' + (MOB ? 338 : 96) + 'px);z-index:27;padding:6px 13px;border-radius:16px;background:#0f2a3acc;color:#fff3d6;font:700 13px system-ui;white-space:nowrap;display:none;pointer-events:none'; document.body.appendChild(hud);
  const bookN = () => { try { return (JSON.parse(localStorage.getItem('mg.sport.fishbook') || '{}').n) || 0; } catch (e) { return 0; } };
  let contest = null;
  function startContest(f) {
    contest = { f, t: 144, n0: bookN(), npc: 0, next: 21 + Math.random() * 13 }; hud.style.display = 'block';
    ctx.toast(`🏆 <b>Thi câu với ${f.T.name}!</b> 144 giây — ai câu được nhiều cá hơn thì thắng. Quăng cần đi nào!`, 5000); fish(f);
  }
  function endContest() {
    const c = contest, me = bookN() - c.n0; contest = null; hud.style.display = 'none';
    const win = me > c.npc, tie = me === c.npc; if (ctx.reward) ctx.reward(win ? 2 : 1, win ? 'Thắng thi câu ở làng chài' : 'Tham gia thi câu');
    ctx.toast(`${win ? '🏆 <b>Bạn thắng!</b>' : tie ? '🤝 <b>Hoà!</b>' : `🎣 <b>${c.f.T.name} thắng</b>`} Bạn ${me} 🐟 – ${c.npc} 🐟 ${c.f.T.name}. ${win ? '+2 ⭐' : '+1 ⭐'}<br>Cá nhỏ nhớ thả về biển nhé!`, 6000); ctx.sfx && ctx.sfx(win ? 'win' : 'ok');
  }
  const fish = f => { if (ctx.mg && !ctx.mgActive) { // quay mặt ra nước rồi mở mini game câu cá tại chỗ
    pl.setRot && pl.setRot(f.face); ctx.mg.start('fishing'); } };
  function talk(f) {
    const T = f.T, line = T.lines[f.li % T.lines.length]; f.li++;
    let extra = '';
    if (f.li === T.lines.length && !done[f.id + '_r']) { done[f.id + '_r'] = 1; ctx.reward && ctx.reward(1, `Học chuyện ${T.topic.toLowerCase()} với ${T.name}`); extra = `<br><small>⭐ +1 — đã nghe hết chuyện <b>${T.topic}</b>!</small>`; ctx.sfx && ctx.sfx('ok'); }
    done[f.id] = f.li; try { localStorage.setItem(SAVE, JSON.stringify(done)); } catch (e) {}
    ctx.toast(`${T.icon} <b>${T.name}</b> · <small>${T.topic}</small><br>${line}${extra}`, 7000); ctx.sfx && ctx.sfx('ui');
    if (f.hero) { f.hero.anim.play(f.hero.set.cheer, 0.15, true); f.busy = 1.6; f.act = ''; }
    ctx.questEvent && ctx.questEvent('talk');
  }

  // ---- đặt animation theo việc ----
  const ACT = { idle: 'idle', sit: 'sit', rest: 'floor', mend: 'floor', sell: 'idle', work: 'interact', pull: 'pickup', fish: 'idle', walk: 'walk' };
  const setAct = (f, act) => { if (f.act === act || !f.hero) return; f.act = act; const h = f.hero, n = h.set[ACT[act]] || h.set.idle; h.anim.play(n, 0.3); };
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  let selT = 0, near = null;
  function update(dt, t) {
    const hr = ctx.sky.state.hour, p = pl.pos, vd = Math.hypot(p.x - BAY.O[0], p.z - BAY.O[1]);
    if (contest) { contest.t -= dt; if ((contest.next -= dt) <= 0) { contest.next = 21 + Math.random() * 21; contest.npc++; contest.f.forceCatch = true; } const me = bookN() - contest.n0, s = Math.max(0, Math.ceil(contest.t)); hud.textContent = `🏆 Thi câu · Bạn ${me} 🐟 – ${contest.npc} 🐟 ${contest.f.T.name} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (contest.t <= 0) endContest(); }
    if (vd > 233) { if (folk.vis !== false) { folk.vis = false; for (const f of folk) if (f.hero) f.hero.model.visible = false; lines.visible = floats.visible = false; if (fishModel) fishModel.visible = false; } return; }
    folk.vis = true;
    // chọn chỗ theo giờ (0,5 s/lần)
    if ((selT -= dt) <= 0) {
      selT = 0.5;
      for (const f of folk) {
        let s = null;
        if (f.angler) { if (anglerHours(hr)) { if (f.angler === 'rock') s = rock; else if (f.angler === 'thung') { const v = fleet.byKind.thung[2]; s = v && v.working ? { boat: v, act: 'fish' } : null; } else s = S(f.angler.u, f.angler.v, f.angler.ry, 'fish', DECK_Y); } }
        else s = plan[f.id](hr);
        f.slot = s;
      }
    }
    near = null; let nd = 3.2; let anyLine = false, shown = false;
    for (const f of folk) {
      const h = f.hero; if (!h) continue; const s = f.slot;
      if (!s) { if (h.model.visible) h.model.visible = false; if (f.angler) hideLine(f); continue; }
      // vị trí
      let x, y, z, ry, act = s.act;
      if (s.walk) { const k = (t % s.period) / s.period, go = k < 0.5, e = go ? k * 2 : (k - 0.5) * 2, a = s.walk[go ? 0 : 1], b = s.walk[go ? 1 : 0], pause = e > 0.86; const q = Math.min(1, e / 0.86); x = a.x + (b.x - a.x) * q; z = a.z + (b.z - a.z) * q; y = groundAt(x, z); ry = Math.atan2(b.x - a.x, b.z - a.z); act = pause ? 'work' : 'walk'; }
      else if (s.boat) { const v = s.boat; fleet.deckPoint(v, 0, 0.42, -0.1, _v); x = _v.x; y = _v.y; z = _v.z; ry = v.h; }
      else { x = s.x; y = s.y; z = s.z; ry = s.ry; }
      const d = Math.hypot(x - p.x, z - p.z), on = d < VIS;
      if (h.model.visible !== on) h.model.visible = on;
      if (!on) { if (f.angler) hideLine(f); continue; }
      h.model.position.set(x, y, z); f.pos.set(x, y, z); f.face = ry;
      // quay mặt về người chơi khi đứng gần (trừ lúc đang câu / đi)
      const talkable = d < 3.2 && !s.boat;
      let faceTo = ry; if (d < 4.5 && act !== 'walk' && act !== 'fish' && act !== 'pull' && act !== 'mend') faceTo = Math.atan2(p.x - x, p.z - z);
      h.model.rotation.y += Math.atan2(Math.sin(faceTo - h.model.rotation.y), Math.cos(faceTo - h.model.rotation.y)) * Math.min(1, dt * 5);
      if (f.busy > 0) f.busy -= dt; else {
        // việc theo nhịp: bán hàng thỉnh thoảng vẫy; câu: vung cần – giật – khoe cá
        if (act === 'sell') { f.t -= dt; if (f.t <= 0) { f.t = 5 + Math.random() * 8; h.anim.play(h.set[Math.random() < 0.5 ? 'interact' : 'cheer'], 0.2, true); f.busy = 1.5; f.act = ''; } else setAct(f, 'sell'); }
        else if (act === 'fish') {
          setAct(f, 'fish'); f.cast -= dt; f.bite -= dt;
          if (f.show > 0) f.show -= dt;
          if (f.forceCatch || f.bite <= 0) { f.forceCatch = false; f.bite = 21 + Math.random() * 34; f.cast = 4; h.anim.play(h.set.hit, 0.1, true); f.busy = 0.7; f.act = ''; f.show = 3.4; f.catches++; f.dip = 1; if (d < 34) ctx.sfx && ctx.sfx('splash'); f.cheerT = 0.7; }
          else if (f.cast <= 0) { f.cast = 13 + Math.random() * 13; h.anim.play(h.set.use, 0.15, true); f.busy = 1.0; f.act = ''; }
        } else setAct(f, act);
      }
      if (f.cheerT > 0 && (f.cheerT -= dt) <= 0) { h.anim.play(h.set.cheer, 0.15, true); f.busy = 1.8; f.act = ''; }
      actorLod(h, h.model, d * (MOB ? 1.6 : 1)); stepAnim(h.anim, f.an, d, dt);
      // dây câu + phao
      if (f.angler) {
        anyLine = true; const sc = h.model.scale.x, fx = Math.sin(h.model.rotation.y), fz = Math.cos(h.model.rotation.y), rx = fz, rz = -fx;
        if (f.hand) f.hand.getWorldPosition(_v); else _v.set(x, y + 0.9, z);
        const tx = _v.x + (fx * 1.1 - rx * 1.05) * sc * 1.0, ty = _v.y + 0.25, tz = _v.z + (fz * 1.1 - rz * 1.05) * sc * 1.0;   // đầu cần
        const reach = s.boat ? 3.2 : 4.6, wx = x + fx * reach, wz = z + fz * reach; f.dip = Math.max(0, (f.dip || 0) - dt * 1.5);
        const wy = terrain.waveHeight(wx, wz) + 0.05 - f.dip * 0.25 - (f.bite < 2.5 ? Math.max(0, Math.sin(t * 9)) * 0.06 : 0), o = f.ai * 6;
        if (f.show > 2.6) { lpos[o] = tx; lpos[o + 1] = ty; lpos[o + 2] = tz; lpos[o + 3] = tx; lpos[o + 4] = ty - 0.9; lpos[o + 5] = tz; fpos[f.ai * 3 + 1] = -99; }
        else { lpos[o] = tx; lpos[o + 1] = ty; lpos[o + 2] = tz; lpos[o + 3] = wx; lpos[o + 4] = wy; lpos[o + 5] = wz; fpos[f.ai * 3] = wx; fpos[f.ai * 3 + 1] = wy + 0.03; fpos[f.ai * 3 + 2] = wz; }
        if (f.show > 0 && fishModel && !shown && d < 55) { shown = true; fishModel.visible = true; fishModel.position.set(tx, ty - 1.0 + Math.sin(t * 14) * 0.03, tz); fishModel.rotation.set(Math.PI / 2, t * 2, 0); }
      }
      if (talkable && d < nd) { nd = d; near = f; }
    }
    if (fishModel && !shown && fishModel.visible) fishModel.visible = false;
    lines.visible = floats.visible = anyLine; if (anyLine) { lgeo.attributes.position.needsUpdate = true; fgeo.attributes.position.needsUpdate = true; }
    // nút hành động: đứng sát (< 2 m) → nói chuyện (người câu đã kể hết chuyện → mời thi câu); cách 2–5,5 m cạnh người câu → ngồi câu cùng
    if (pl.frozen || pl.vehicle || ctx.mgActive) return;
    if (near) { const f = near, d = Math.hypot(f.pos.x - p.x, f.pos.z - p.z);
      if (!f.angler || d < 2) { if (f.angler && !contest && f.li >= f.T.lines.length) ctx.offer(`🏆 Thi câu với ${f.T.name}`, () => startContest(f), 2.6); else ctx.offer(`💬 ${f.T.name} · ${f.T.topic}`, () => talk(f), 2.5); return; } }
    for (const f of anglers) {
      if (!f.slot || f.slot.boat || !f.hero || !f.hero.model.visible) continue; const d = Math.hypot(f.pos.x - p.x, f.pos.z - p.z);
      if (d < 5.5) { ctx.offer(contest ? '🎣 Quăng cần (đang thi câu)' : `🎣 Ngồi câu cạnh ${f.T.name}`, () => fish(f), 2.4); break; }
    }
  }
  function hideLine(f) { const o = f.ai * 6; lpos[o + 1] = lpos[o + 4] = -99; fpos[f.ai * 3 + 1] = -99; }
  return { update, folk, talk, startContest, get contest() { return contest; }, rock };
}
export { PHI, NAME };
