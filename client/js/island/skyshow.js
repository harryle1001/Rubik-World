// skyshow.js — Bầu trời sống động & học thiên văn:
//   chòm sao THẬT (toạ độ xích kinh/xích vĩ, xoay theo giờ trong đêm và đổi theo mùa: mỗi ngày game ≈ 1 tháng, vĩ độ Việt Nam 16°B)
//   sao băng lẻ mỗi đêm + MƯA SAO BĂNG định kỳ (báo trước lúc chiều tối, có sao băng lớn kèm đuôi) · ước điều → thành tựu
//   mây ti tầng cao (vệt mảnh, ửng hồng bình minh/hoàng hôn) · mây tích tầng thấp (sky.js) đổi hình chậm
//   CHẾ ĐỘ NGẮM TRỜI (nút ⭐ / phím G): nằm xuống, camera ngửa lên; chạm sao → tên + điều thú vị; ban ngày chạm mây → đoán hình
// Draw call: sao 1 · đường nối chòm 1 · sao băng 1 · sao băng lớn 1 · mây ti 1. Mọi chuyển động trên GPU; CPU chỉ tính lại ~90 sao mỗi 0,5 s.
import * as THREE from 'three';
import { PHI } from './layout.js';

const LAT = 16 * Math.PI / 180, R = 370, NM = 34;
// [tên sao, xích kinh (giờ), xích vĩ (độ), cấp sáng, màu]
const C = {
  bd: { name: 'Bắc Đẩu (chòm Đại Hùng)', fact: '7 sao hình cái gáo. Nối 2 sao ở miệng gáo rồi kéo dài khoảng 5 lần là tới <b>Sao Bắc Cực</b> — cách người xưa tìm hướng Bắc ban đêm.',
    s: [['Thiên Xu (Dubhe)', 11.062, 61.75, 1.8, '#ffe2b0'], ['Thiên Toàn (Merak)', 11.031, 56.38, 2.4], ['Thiên Cơ', 11.897, 53.69, 2.4], ['Thiên Quyền', 12.257, 57.03, 3.3], ['Ngọc Hành', 12.9, 55.96, 1.8], ['Khai Dương (Mizar)', 13.399, 54.93, 2.2], ['Dao Quang', 13.792, 49.31, 1.9]],
    l: [0, 1, 1, 2, 2, 3, 3, 0, 3, 4, 4, 5, 5, 6] },
  th: { name: 'Sao Bắc Cực (chòm Tiểu Hùng)', fact: 'Sao Bắc Cực gần như <b>đứng yên</b> vì nằm gần trục quay của Trái Đất. Độ cao của nó so với chân trời ≈ vĩ độ nơi bạn đứng (Việt Nam: 8°–23°).',
    s: [['Sao Bắc Cực (Polaris)', 2.53, 89.26, 2.0, '#fff4d8'], ['δ Tiểu Hùng', 17.537, 86.59, 4.4], ['ε Tiểu Hùng', 16.766, 82.04, 4.2], ['ζ Tiểu Hùng', 15.734, 77.79, 4.3], ['Kochab', 14.845, 74.16, 2.1, '#ffcf9a'], ['Pherkad', 15.345, 71.83, 3.0], ['η Tiểu Hùng', 16.292, 75.75, 5.0]],
    l: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 3] },
  ca: { name: 'Thiên Hậu (Cassiopeia)', fact: 'Hình chữ <b>W</b>, nằm đối diện Bắc Đẩu qua Sao Bắc Cực: khi Bắc Đẩu lặn, nhìn chữ W để tìm hướng Bắc.',
    s: [['Caph', 0.153, 59.15, 2.3], ['Schedar', 0.675, 56.54, 2.2, '#ffd9a8'], ['γ Thiên Hậu', 0.945, 60.72, 2.2], ['Ruchbah', 1.43, 60.24, 2.7], ['Segin', 1.907, 63.67, 3.4]], l: [0, 1, 1, 2, 2, 3, 3, 4] },
  ly: { name: 'Thiên Cầm (Lyra)', fact: 'Sao sáng nhất là <b>Chức Nữ (Vega)</b>. Chuyện Ngưu Lang – Chức Nữ: hai sao cách nhau dải Ngân Hà, mỗi năm gặp nhau ngày 7 tháng 7 âm lịch — khi ấy hay có mưa ngâu.',
    s: [['Chức Nữ (Vega)', 18.616, 38.78, 0.0, '#dfe8ff'], ['ε Thiên Cầm', 18.739, 39.67, 4.7], ['ζ Thiên Cầm', 18.746, 37.61, 4.3], ['δ Thiên Cầm', 18.908, 36.9, 4.3], ['Sulafat', 18.982, 32.69, 3.3], ['Sheliak', 18.835, 33.36, 3.5]], l: [0, 1, 0, 2, 2, 3, 3, 4, 4, 5, 5, 2] },
  aq: { name: 'Thiên Ưng (Aquila)', fact: 'Sao sáng nhất là <b>Ngưu Lang (Altair)</b>, tự quay rất nhanh — 1 vòng chỉ chừng 9 giờ nên bị dẹt như quả quýt! Ngưu Lang, Chức Nữ, Thiên Tân tạo thành <b>Tam giác mùa hè</b>.',
    s: [['Ngưu Lang (Altair)', 19.846, 8.87, 0.8, '#f4f6ff'], ['Tarazed', 19.771, 10.61, 2.7, '#ffd29a'], ['Alshain', 19.922, 6.41, 3.7], ['ζ Thiên Ưng', 19.09, 13.86, 3.0], ['δ Thiên Ưng', 19.425, 3.11, 3.4], ['θ Thiên Ưng', 20.188, -0.82, 3.2], ['λ Thiên Ưng', 19.104, -4.88, 3.4]], l: [1, 0, 0, 2, 2, 5, 0, 4, 4, 6, 1, 3] },
  cy: { name: 'Thiên Nga (Cygnus)', fact: 'Hình chữ thập bay dọc dải Ngân Hà. Sao <b>Thiên Tân (Deneb)</b> rất xa: ánh sáng bạn thấy đêm nay đã rời nó từ hơn 1.500 năm trước!',
    s: [['Thiên Tân (Deneb)', 20.69, 45.28, 1.3, '#f2f4ff'], ['Sadr', 20.37, 40.26, 2.2], ['Albireo', 19.512, 27.96, 3.1, '#ffd08a'], ['Gienah', 20.77, 33.97, 2.5], ['δ Thiên Nga', 19.75, 45.13, 2.9]], l: [0, 1, 1, 2, 3, 1, 1, 4] },
  sc: { name: 'Thiên Yết – Bọ Cạp (Scorpius)', fact: '<b>Sao Tâm (Antares)</b> đỏ cam là sao siêu khổng lồ — to gấp khoảng 700 lần Mặt Trời. Đuôi Bọ Cạp cong như lưỡi câu.',
    s: [['Sao Tâm (Antares)', 16.49, -26.43, 1.0, '#ff9a6a'], ['Dschubba', 16.006, -22.62, 2.3], ['Acrab', 16.091, -19.81, 2.6], ['π Bọ Cạp', 15.981, -26.11, 2.9], ['σ Bọ Cạp', 16.353, -25.59, 2.9], ['τ Bọ Cạp', 16.598, -28.22, 2.8], ['ε Bọ Cạp', 16.836, -34.29, 2.3], ['μ Bọ Cạp', 16.864, -38.05, 3.0], ['ζ Bọ Cạp', 16.91, -42.36, 3.6], ['η Bọ Cạp', 17.203, -43.24, 3.3], ['θ Bọ Cạp', 17.622, -43.0, 1.9], ['ι Bọ Cạp', 17.793, -40.13, 3.0], ['κ Bọ Cạp', 17.708, -39.03, 2.4], ['Shaula', 17.56, -37.1, 1.6]],
    l: [2, 1, 1, 3, 1, 4, 4, 0, 0, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13] },
  sg: { name: 'Nam Tào – Nam Đẩu (chòm Nhân Mã)', fact: 'Dân gian kể <b>Nam Tào</b> giữ sổ sinh, <b>Bắc Đẩu</b> giữ sổ tử. Sáu sao Nam Đẩu hình cái gáo nhỏ; nhìn về đây là nhìn vào <b>tâm dải Ngân Hà</b> của chúng ta!',
    s: [['μ Nhân Mã', 18.229, -21.06, 3.9], ['λ Nhân Mã', 18.466, -25.42, 2.8], ['φ Nhân Mã', 18.761, -26.99, 3.2], ['Nunki', 18.921, -26.3, 2.0], ['τ Nhân Mã', 19.116, -27.67, 3.3], ['ζ Nhân Mã', 19.044, -29.88, 2.6], ['γ Nhân Mã', 18.097, -30.42, 3.0], ['δ Nhân Mã', 18.35, -29.83, 2.7], ['ε Nhân Mã', 18.403, -34.38, 1.8]],
    l: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 2, 2, 7, 7, 1, 7, 6, 6, 8, 8, 7, 8, 5] },
  or: { name: 'Lạp Hộ – Sao Cày (Orion)', fact: '3 sao thẳng hàng ở giữa là "đai lưng" người thợ săn. Nông dân Việt gọi là <b>Sao Cày</b> vì giống cái cày — sao Cày mọc là mùa làm đất.',
    s: [['Betelgeuse', 5.919, 7.41, 0.5, '#ffa070'], ['Bellatrix', 5.419, 6.35, 1.6, '#dfe8ff'], ['Alnitak', 5.679, -1.94, 1.8], ['Alnilam', 5.604, -1.2, 1.7], ['Mintaka', 5.533, -0.3, 2.2], ['Saiph', 5.796, -9.67, 2.1], ['Rigel', 5.242, -8.2, 0.1, '#cfdcff']],
    l: [0, 1, 0, 2, 1, 4, 4, 3, 3, 2, 2, 5, 4, 6, 5, 6] },
  pl: { name: 'Tua Rua (Thất Tinh – Pleiades)', fact: 'Cụm sao trẻ, mắt thường thấy 6–7 sao. Ca dao: <i>"Tua Rua bằng mặt thì mạ già, ruộng cỏ"</i> — nhà nông xem sao để tính mùa vụ.',
    s: [['Alcyone', 3.791, 24.11, 2.9, '#dfe8ff'], ['Atlas', 3.819, 24.05, 3.6], ['Electra', 3.748, 24.11, 3.7], ['Maia', 3.764, 24.37, 3.9], ['Merope', 3.772, 23.95, 4.2], ['Taygeta', 3.753, 24.47, 4.3]], l: [] },
  one: { name: 'Sao sáng', s: [['Thiên Lang (Sirius)', 6.752, -16.72, -1.4, '#dfe8ff', 'Sao sáng nhất bầu trời đêm, chỉ cách chúng ta khoảng 8,6 năm ánh sáng.'],
    ['Đại Giác (Arcturus)', 14.261, 19.18, -0.05, '#ffcf96', 'Sao cam sáng nhất bầu trời phía Bắc. Kéo dài cán gáo Bắc Đẩu theo đường cong là gặp nó.'],
    ['Ngũ Xa (Capella)', 5.278, 45.99, 0.1, '#fff0c8', 'Thật ra là 4 ngôi sao quay quanh nhau, nhìn từ xa nhập thành 1 chấm sáng.'],
    ['Tất Nguyệt (Aldebaran)', 4.599, 16.51, 0.9, '#ffb07a', '"Mắt con bò" đỏ cam trong chòm Kim Ngưu, gần cụm Tua Rua.'],
    ['Giác (Spica)', 13.42, -11.16, 1.0, '#cfdcff', 'Sao xanh trắng rất nóng — nóng gấp 4 lần Mặt Trời ở bề mặt.'],
    ['Nam Hà (Procyon)', 7.655, 5.22, 0.4, '#fff6e0', 'Cùng Thiên Lang và Betelgeuse tạo thành Tam giác mùa đông.'],
    ['Lão Nhân (Canopus)', 6.399, -52.7, -0.7, '#fffbe8', 'Sao sáng thứ 2 bầu trời đêm, ở thấp phía Nam — miền Nam Việt Nam thấy rõ hơn miền Bắc.']], l: [] },
};
const SHOWERS = [{ name: 'Anh Tiên (Perseids)', ra: 3.1, dec: 58, fact: 'Mưa sao băng Anh Tiên: Trái Đất đi qua dải bụi do <b>sao chổi Swift–Tuttle</b> để lại. Mỗi hạt bụi nhỏ như hạt cát lao vào khí quyển ~60 km/giây và cháy sáng!' },
  { name: 'Song Tử (Geminids)', ra: 7.5, dec: 32, fact: 'Mưa sao băng Song Tử: bụi từ <b>tiểu hành tinh 3200 Phaethon</b>. Đây là trận mưa sao băng nhiều nhất trong năm — có lúc hơn 100 vệt mỗi giờ!' }];
const CLOUD_SHAPES = ['con thỏ 🐇', 'cá voi 🐋', 'cây kem 🍦', 'con rồng 🐉', 'chiếc thuyền ⛵', 'khủng long 🦕', 'con mèo 🐈', 'bông hoa 🌸', 'ấm trà 🫖', 'con rùa 🐢'];
const FACT = {
  meteor: '🌠 Sao băng không phải ngôi sao! Đó là hạt bụi đá từ vũ trụ cháy sáng ở độ cao khoảng 100 km khi lao vào khí quyển.',
  big: '☄️ Sao băng lớn (cầu lửa): hạt đá to cỡ viên bi trở lên — sáng hơn cả sao Kim, có khi để lại vệt khói sáng.',
  cirrus: '🪶 Mây ti (mây lông chim) ở rất cao, khoảng 8–12 km, gồm toàn tinh thể băng nhỏ — nên trông mảnh như sợi tơ.',
  cumulus: '☁️ Mây tích (mây bông) ở thấp, 1–2 km: không khí ấm bốc lên, nguội đi, hơi nước ngưng tụ thành đám mây trắng phồng.',
  spin: '🌍 Các chòm sao từ từ quay quanh Sao Bắc Cực — thật ra là Trái Đất đang tự quay, mỗi vòng 24 giờ.',
};

export function createSkyshow(ctx) {
  const { scene, camera, sky, renderer } = ctx, pl = ctx.player, told = new Set();
  const fact = (k, ms = 6000) => { if (told.has(k) || !ctx.toast) return; told.add(k); ctx.toast(FACT[k], ms); };
  const st = { lst: 0, sunRA: 0, gaze: false, sel: -1, rate: 0, shower: null, showerDay: -1, announced: -1, wishT: 0, wishes: +(localStorage.getItem('island.wish') || 0), force: false, look: { yaw: 0, pitch: 0.9 } };

  // ---------- Sao & chòm sao ----------
  const stars = []; const cons = Object.entries(C);
  cons.forEach(([id, c], ci) => c.s.forEach(([n, ra, dec, mag, col, f]) => stars.push({ n, ra, dec, mag, col: new THREE.Color(col || '#fff8ec'), ci, f, dir: new THREE.Vector3() })));
  const base = []; { let o = 0; for (const [, c] of cons) { base.push(o); o += c.s.length; } }
  const NS = stars.length, sp = new Float32Array(NS * 3), sa = new Float32Array(NS * 4);
  stars.forEach((s, i) => sa.set([s.col.r, s.col.g, s.col.b, s.mag], i * 4));
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('a', new THREE.BufferAttribute(sa, 4));
  sg.setAttribute('cid', new THREE.BufferAttribute(new Float32Array(stars.map(s => s.ci)), 1));
  const SU = { uN: { value: 0 }, uT: { value: 0 }, uSel: { value: -1 }, uGaze: { value: 0 }, uCam: { value: new THREE.Vector3() }, uDpr: { value: 1 } };
  const starPts = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: SU, transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uN, uT, uSel, uGaze, uDpr; uniform vec3 uCam; attribute vec4 a; attribute float cid; varying vec4 vC;
      void main(){ vec3 d = normalize(position); float up = smoothstep(-.02, .12, d.y), sel = 1. - step(.5, abs(cid - uSel));
        float tw = .8 + .2 * sin(uT * (2. + fract(a.w * 7.) * 5.) + position.x);
        float b = clamp(1.3 - a.w * .26, .25, 1.6) * tw * (1. + uGaze * .35 + sel * .6);
        vC = vec4(a.rgb * b, uN * up);
        gl_Position = projectionMatrix * viewMatrix * vec4(uCam + d * ${R}., 1.); gl_PointSize = uDpr * (clamp(10. - a.w * 2., 2.5, 13.) + sel * 3.) * (1. + uGaze * .3); }`,
    fragmentShader: 'varying vec4 vC; void main(){ vec2 p = gl_PointCoord - .5; float d = dot(p, p) * 4.; if (d > 1.) discard; float c = exp(-d * 9.) * 1.6 + max(0., 1. - abs(p.x * p.y) * 260.) * (1. - d) * .35; gl_FragColor = vec4(vC.rgb * c, vC.a); }',
  }));
  starPts.frustumCulled = false; starPts.renderOrder = -0.5; scene.add(starPts);
  // đường nối chòm sao (chỉ hiện khi ngắm trời; chòm đang chọn sáng hơn)
  const li = []; cons.forEach(([, c], ci) => { for (let k = 0; k < c.l.length; k++) li.push(base[ci] + c.l[k]); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', sg.attributes.position); lg.setAttribute('cid', sg.attributes.cid); lg.setIndex(li);
  const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
    uniforms: SU, transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uN, uSel, uGaze; uniform vec3 uCam; attribute float cid; varying float vA;
      void main(){ vec3 d = normalize(position); float sel = 1. - step(.5, abs(cid - uSel)); vA = uN * uGaze * (.38 + sel * .62) * smoothstep(-.02, .1, d.y);
        gl_Position = projectionMatrix * viewMatrix * vec4(uCam + d * ${R - 1}., 1.); }`,
    fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(vec3(.55, .7, 1.) * vA, vA); }',
  }));
  lines.frustumCulled = false; lines.renderOrder = -0.5; scene.add(lines);

  // xích kinh/xích vĩ → hướng trên trời (x đông · y lên · z nam), theo giờ sao địa phương LST
  const toDir = (ra, dec, out) => {
    const H = (st.lst - ra) * Math.PI / 12, d = dec * Math.PI / 180, sA = Math.sin(d) * Math.sin(LAT) + Math.cos(d) * Math.cos(LAT) * Math.cos(H), alt = Math.asin(sA);
    const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(LAT) * Math.sin(d) - Math.sin(LAT) * Math.cos(d) * Math.cos(H));
    return out.set(Math.cos(alt) * Math.sin(az), sA, -Math.cos(alt) * Math.cos(az));
  };
  function placeStars() {
    const h = sky.state.hour; st.sunRA = (8 + (sky.state.day - 4) * 2 + 2400) % 24;   // ngày game thứ 4 ≈ cuối tháng 7: tối có Tam giác mùa hè, nửa đêm có Bọ Cạp
    st.lst = (st.sunRA + h - 12 + 48) % 24;
    stars.forEach((s, i) => { toDir(s.ra, s.dec, s.dir); sp.set([s.dir.x, s.dir.y, s.dir.z], i * 3); });
    sg.attributes.position.needsUpdate = true;
  }

  // ---------- Sao băng: CPU sinh (biết lúc nào có để ước), GPU vẽ vệt chạy ----------
  const mS = new Float32Array(NM * 2 * 4), mM = new Float32Array(NM * 2 * 4), mE = new Float32Array(NM * 2);
  for (let i = 0; i < NM; i++) { mE[i * 2 + 1] = 1; mS[i * 8 + 3] = mS[i * 8 + 7] = -99; mM[i * 8 + 3] = mM[i * 8 + 7] = 1; }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NM * 6), 3));
  const MS = new THREE.BufferAttribute(mS, 4), MM = new THREE.BufferAttribute(mM, 4); mg.setAttribute('aS', MS); mg.setAttribute('aM', MM); mg.setAttribute('aE', new THREE.BufferAttribute(mE, 1));
  const meteors = new THREE.LineSegments(mg, new THREE.ShaderMaterial({
    uniforms: SU, transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uT; uniform vec3 uCam; attribute vec4 aS, aM; attribute float aE; varying float vA;
      void main(){ float e = (uT - aS.w) / aM.w, p = clamp(e, 0., 1.);
        vec3 h = normalize(aS.xyz + aM.xyz * p), t = normalize(aS.xyz + aM.xyz * max(0., p - .3));
        vA = (1. - aE) * step(0., e) * step(e, 1.) * sin(p * 3.1416) * smoothstep(-.02, .08, h.y);
        gl_Position = projectionMatrix * viewMatrix * vec4(uCam + mix(h, t, aE) * ${R - 4}., 1.); }`,
    fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(mix(vec3(.6, .75, 1.), vec3(1., .98, .9), vA) * vA * 1.6, vA); }',
  }));
  meteors.frustumCulled = false; meteors.renderOrder = -0.4; scene.add(meteors);
  // sao băng lớn: tấm hình que hướng theo vệt, đầu sáng xanh lục–trắng, đuôi dài mờ dần (CPU đặt mỗi khung, chỉ 1 cái)
  const FB = { uA: { value: 0 } };
  const fire = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: FB, transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uA; varying vec2 vU; void main(){ float x = vU.x, y = abs(vU.y - .5) * 2.;
        float tail = pow(x, 1.6) * (1. - smoothstep(.0, .35 + .65 * x, y)), head = exp(-((1. - x) * (1. - x) * 90. + y * y * 5.)) * 2.;
        vec3 c = mix(vec3(1., .65, .3), vec3(.75, 1., .85), x) * tail + vec3(1.) * head;
        gl_FragColor = vec4(c * uA, 1.); }`,
  }));
  fire.frustumCulled = false; fire.visible = false; fire.renderOrder = -0.3; scene.add(fire);
  const big = { on: false, t: 0, dur: 2.6, s: new THREE.Vector3(), m: new THREE.Vector3() };
  let mi = 0; const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  function spawn(isBig) {
    // điểm xuất phát: trên trời (cao ≥ 15°); mưa sao băng → vệt chạy ra xa điểm phát xạ (radiant)
    for (let k = 0; k < 13; k++) {
      _a.set(Math.random() * 2 - 1, 0.25 + Math.random() * 0.75, Math.random() * 2 - 1).normalize(); if (_a.y < 0.26) continue;
      if (st.shower) { toDir(st.shower.ra, st.shower.dec, _c); const cs = _a.dot(_c); if (cs > 0.985 || cs < 0.2) continue; _b.copy(_a).addScaledVector(_c, -cs).normalize(); }
      else _b.set(Math.random() - 0.5, -Math.random() * 0.6, Math.random() - 0.5).cross(_a).normalize();
      const L = isBig ? 0.55 : 0.12 + Math.random() * 0.22, dur = isBig ? big.dur : 0.45 + Math.random() * 0.6, t = SU.uT.value;
      if (isBig) { big.on = true; big.t = t; big.s.copy(_a); big.m.copy(_b).multiplyScalar(L); fact('big', 6500); }
      else { const i = mi++ % NM; for (let v = 0; v < 2; v++) { mS.set([_a.x, _a.y, _a.z, t], (i * 2 + v) * 4); mM.set([_b.x * L, _b.y * L, _b.z * L, dur], (i * 2 + v) * 4); } MS.needsUpdate = MM.needsUpdate = true; }
      st.lastDir = _a.clone(); st.wishT = isBig ? 4.2 : 2.6;
      if (st.gaze || isBig) fact('meteor');
      return true;
    }
    return false;
  }
  const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
  function drawBig(t, cam) {
    const e = (t - big.t) / big.dur; if (e > 1) { big.on = false; fire.visible = false; return; }
    const p = e, h = _a.copy(big.s).addScaledVector(big.m, p).normalize(), tl = _b.copy(big.s).addScaledVector(big.m, Math.max(0, p - 0.35)).normalize();
    h.multiplyScalar(R - 6).add(cam); tl.multiplyScalar(R - 6).add(cam);
    _x.subVectors(h, tl); const len = _x.length(); _x.divideScalar(len || 1); _z.subVectors(cam, h).normalize(); _y.crossVectors(_z, _x).normalize(); _z.crossVectors(_x, _y);
    _m.makeBasis(_x, _y, _z); fire.quaternion.setFromRotationMatrix(_m); fire.position.addVectors(h, tl).multiplyScalar(0.5); fire.scale.set(Math.max(len, 1), 3.4, 1);
    FB.uA.value = Math.sin(Math.min(1, e * 1.2) * Math.PI) * (e > 0.82 && e < 0.88 ? 1.8 : 1) * Math.max(0.3, sky.state.night); fire.visible = true;   // lóe sáng trước khi tắt
  }

  // ---------- Mây ti tầng cao: 1 tấm lớn trên đầu, vệt mảnh trôi theo gió, ửng hồng khi mặt trời thấp ----------
  const CU = { uT: SU.uT, uA: { value: 0.4 }, uCol: { value: new THREE.Color() }, uOff: { value: new THREE.Vector2() } };
  const cirrus = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: CU, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uT, uA; uniform vec3 uCol; uniform vec2 uOff; varying vec2 vP;
      void main(){ vec2 q = (vP + uOff) * .006; q = vec2(q.x * 1.618 + q.y * .5, q.y - q.x * .3);
        float n = sin(q.x * 2.1 + sin(q.y * 3.3 + uT * .02) * 1.7) * sin(q.y * 9.7 + sin(q.x * 1.3) * 2.6);
        float s = smoothstep(.35, .95, n) * (.6 + .4 * sin(q.x * 13. + q.y * 2.)) * smoothstep(.1, .55, sin(q.x * .7 + 1.3) * sin(q.y * .9 - .4) + .3);
        float edge = 1. - smoothstep(330., 640., length(vP));
        gl_FragColor = vec4(uCol, s * edge * uA); }`,
  }));
  cirrus.frustumCulled = false; cirrus.renderOrder = -0.6; scene.add(cirrus);
  // mây tích (sky.js) đổi hình chậm: phồng/xẹp theo sóng trên bề mặt
  if (sky.cloudMat && sky.cloudMat.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) {
    sky.cloudMat.onBeforeCompile = sh => {
      sh.uniforms.uMT = SU.uT;
      sh.vertexShader = 'uniform float uMT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 cw = (modelMatrix * vec4(0., 0., 0., 1.)).xyz * .07;
        transformed += normal * (sin(position.x * .55 + uMT * .11 + cw.x) * sin(position.z * .7 - uMT * .083 + cw.z) * .9 + sin(position.y * 1.3 + uMT * .17) * .35) * (.6 + .4 * max(normal.y, 0.));`);
    };
    sky.cloudMat.customProgramCacheKey = () => 'cloudMorph'; sky.cloudMat.needsUpdate = true;
  }

  // ---------- Chế độ ngắm trời ----------
  const btn = document.createElement('button'); btn.id = 'bGaze'; btn.title = 'Ngắm trời (G)'; btn.textContent = '⭐';
  (document.querySelector('.vbtns') || document.body).appendChild(btn);
  const savedFov = camera.fov; let fadeIn = 0;
  function gaze(on = !st.gaze) {
    if (on === st.gaze) return;
    if (on && (pl.vehicle || pl.frozen || !pl.grounded)) { ctx.toast && ctx.toast('⭐ Hãy xuống xe và đứng trên mặt đất để nằm ngắm trời nhé!', 3000); return; }
    st.gaze = on; pl.frozen = on; btn.style.background = on ? '#f0a23acc' : ''; st.sel = -1; SU.uSel.value = -1;
    const r = pl.root;
    if (on) {
      st.look.pitch0 = pl.cam.pitch; st.look.pitch = 1.05; r.rotation.order = 'YXZ'; fadeIn = 0;
      const night = sky.state.night > 0.5;
      ctx.toast(night ? '🌌 Nằm ngắm sao: kéo màn hình để nhìn quanh, <b>chạm vào ngôi sao</b> để biết tên. Nhìn thấy sao băng thì bấm <b>Ước điều</b>!'
        : '☁️ Nằm ngắm mây: chạm vào một đám mây xem nó giống gì! (Ban đêm quay lại để ngắm sao)', 6500);
    } else {
      r.rotation.x = 0; r.rotation.order = 'XYZ'; camera.fov = savedFov; camera.updateProjectionMatrix(); pl.cam.pitch = st.look.pitch0 ?? 0.6;
    }
  }
  btn.onclick = () => gaze(); addEventListener('keydown', e => { if (e.code === 'KeyG' && !e.repeat) gaze(); else if (st.gaze && /^(Key[WASD]|Arrow)/.test(e.code)) gaze(false); });
  // chạm sao / mây
  const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  el.addEventListener('pointerdown', e => { down = st.gaze ? { x: e.clientX, y: e.clientY, py: e.clientY } : null; });
  el.addEventListener('pointermove', e => { if (!st.gaze || !down) return; st.look.pitch = Math.min(1.5, Math.max(0.2, st.look.pitch + (e.clientY - down.py) * 0.005)); down.py = e.clientY; });
  el.addEventListener('pointerup', e => {
    if (!st.gaze || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(ndc, camera); const d = ray.ray.direction;
    if (sky.state.night > 0.45) {
      let best = -1, bs = -1e9; stars.forEach((s, i) => { if (s.dir.y < 0) return; const ang = Math.acos(Math.min(1, s.dir.dot(d))); const sc = -ang * 57.3 - s.mag * 0.4; if (ang < 0.07 && sc > bs) { bs = sc; best = i; } });
      if (best < 0) { ctx.toast('✨ Chỗ đó chỉ có những ngôi sao mờ. Thử chạm vào sao <b>sáng hơn</b> nhé!', 2500); return; }
      const s = stars[best], c = cons[s.ci][1]; st.sel = s.ci; SU.uSel.value = s.ci; ctx.sfx && ctx.sfx('coin');
      ctx.toast(c.fact ? `⭐ <b>${s.n}</b> · chòm <b>${c.name}</b><br><small>${c.fact}</small>` : `⭐ <b>${s.n}</b><br><small>${s.f}</small>`, 9000);
      seen.add(s.ci); if (seen.size === 5 && !st.astro) { st.astro = true; setTimeout(() => ctx.toast('🏆 <b>Thành tựu: Nhà thiên văn nhí</b> — đã tìm ra 5 chòm sao! (5 là số Fibonacci 🌀)', 6000), 9200); }
      fact('spin');
    } else {
      const hit = ray.intersectObjects(sky.clouds.children.filter(c => c.visible), false)[0];
      if (!hit) { fact(sky.state.hour > 12 ? 'cirrus' : 'cumulus'); return; }
      const k = sky.clouds.children.indexOf(hit.object); ctx.toast(`☁️ Đám mây này trông giống <b>${CLOUD_SHAPES[(k + Math.floor(SU.uT.value / 21)) % CLOUD_SHAPES.length]}</b>!<br><small>${FACT.cumulus}</small>`, 6000);
    }
  });
  const seen = new Set();
  function wish() {
    st.wishT = 0; st.wishes++; localStorage.setItem('island.wish', st.wishes); ctx.sfx && ctx.sfx('coin');
    ctx.toast(st.wishes === 1 ? '🌠 <b>Thành tựu: Người ước sao</b> — điều ước đã gửi lên trời! Chăm học thì điều ước sẽ thành thật nhé 💫'
      : `🌠 Đã ước ${st.wishes} điều. ${st.wishes === 13 ? '🏆 <b>13 điều ước</b> — 13 là số Fibonacci!' : 'Sao băng thật ra là hạt bụi vũ trụ cháy sáng — nhưng ước thì cứ ước!'}`, 5000);
  }

  // ---------- Mỗi khung hình (gọi sau player/sky/weather) ----------
  let placeT = 0, spT = 3;
  const tmp = new THREE.Vector3(), WHITE = new THREE.Color(1, 1, 1);
  function update(dt) {
    const t = (SU.uT.value += dt), S = sky.state, h = S.hour, W = ctx.weather ? ctx.weather.cur : { c: 0, r: 0, w: 0 }, q = ctx.qualityLevel || 0, cam = camera.position;
    if ((placeT -= dt) <= 0) { placeT = 0.5; placeStars(); }
    const clear = (1 - W.c * 0.85) * (1 - W.r);
    SU.uN.value = S.night * clear; SU.uCam.value.copy(cam); SU.uDpr.value = renderer.getPixelRatio();
    starPts.visible = lines.visible = meteors.visible = S.night > 0.05;

    // mưa sao băng: 1/3 số đêm (ngày game chia 3 dư 1) — báo trước lúc chiều tối, rộ nhất từ 21 giờ tới gần sáng
    const eve = h < 12 ? S.day - 1 : S.day, showerNight = st.force || eve % 3 === 1;
    if (showerNight && h > 17.2 && h < 20.5 && st.announced !== eve) {
      st.announced = eve; st.shower = SHOWERS[st.sunRA >= 5 && st.sunRA < 14 ? 0 : 1];
      ctx.toast(`🌠 <b>Đêm nay có mưa sao băng ${st.shower.name}!</b><br><small>Từ 21 giờ, nằm xuống bãi cỏ (nút ⭐ hoặc phím G) để ngắm và ước điều.</small>`, 8000);
    }
    const peak = showerNight && (h > 20.8 || h < 4.6);
    if (peak && !st.shower) st.shower = SHOWERS[st.sunRA >= 5 && st.sunRA < 14 ? 0 : 1];
    if (peak && st.showerDay !== eve && h > 20.8) { st.showerDay = eve; ctx.toast(`🌠 Mưa sao băng bắt đầu! <small>${st.shower.fact}</small>`, 9000); }
    if (!peak && h > 6 && h < 17) st.shower = null;
    st.rate = S.night > 0.7 && clear > 0.3 ? (peak ? 1 / (q >= 2 ? 2.6 : PHI) : 1 / 21) * clear : 0;   // vệt/giây
    if (st.rate > 0 && (spT -= dt) <= 0) { spT = -Math.log(1 - Math.random()) / st.rate; spawn(!big.on && Math.random() < (peak ? 1 / 13 : 1 / 34)); }
    if (big.on) drawBig(t, cam);

    // mây ti
    const wa = ctx.living ? ctx.living.wind.ang : 0.38; CU.uOff.value.x += Math.cos(wa) * (2 + W.w * 6) * dt; CU.uOff.value.y += Math.sin(wa) * (2 + W.w * 6) * dt;
    cirrus.visible = q < 2; cirrus.position.set(cam.x, cam.y + 140, cam.z);
    CU.uA.value = (0.32 + W.c * 0.3) * (1 - W.r * 0.8) * (0.25 + 0.75 * (1 - S.night * 0.7));
    CU.uCol.value.copy(S.cloudTint).lerp(WHITE, 0.2 * (1 - S.low))   // Color.lerp cần Color (Vector3 → NaN → bloom đen màn hình)
     .multiplyScalar(0.6 + 0.4 * (1 - S.night));
    if (S.low > 0.5 && W.c < 0.5) fact('cirrus', 6500);

    // ngắm trời: nằm ngửa, camera ngửa lên
    if (st.gaze) {
      if (pl.input && (Math.hypot(pl.input.x || 0, pl.input.z || 0) > 0.5 || pl.input.jump)) { gaze(false); return; }
      ctx.offer('🧍 Đứng dậy', () => gaze(false), 5);
      if (st.wishT > 0) ctx.offer('🌠 Ước điều!', wish, 9);
      fadeIn = Math.min(1, fadeIn + dt * 1.2); const k = fadeIn * fadeIn * (3 - 2 * fadeIn);
      const r = pl.root; r.rotation.x = -Math.PI / 2 * k; r.position.y += 0.12 * k;
      const yaw = pl.cam.yaw, pitch = 0.2 + (st.look.pitch - 0.2) * k;
      const head = tmp.set(pl.pos.x - Math.sin(yaw) * 0.2, pl.pos.y + 0.55, pl.pos.z - Math.cos(yaw) * 0.2);
      camera.position.lerp(head, k); camera.fov += (70 - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
      camera.lookAt(head.x - Math.sin(yaw) * Math.cos(pitch) * 10, head.y + Math.sin(pitch) * 10, head.z - Math.cos(yaw) * Math.cos(pitch) * 10);
      SU.uGaze.value = Math.min(1, SU.uGaze.value + dt);
    } else SU.uGaze.value = Math.max(0, SU.uGaze.value - dt);
    if (st.wishT > 0) { st.wishT -= dt; if (!st.gaze && S.night > 0.7 && st.lastDir && camera.getWorldDirection(tmp).dot(st.lastDir) > 0.55) ctx.offer('🌠 Ước điều!', wish, 9); }
  }
  return { update, gaze, spawn, stars, state: st, shower: on => { st.force = on; st.announced = -1; st.showerDay = -1; }, meteor: b => spawn(!!b), get on() { return st.gaze; } };
}
