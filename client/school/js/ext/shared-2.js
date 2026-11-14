
var PIMG = {};
Object.keys(PIECE_SRC).forEach(k => { const im = new Image(); im.src = PIECE_SRC[k]; PIMG[k] = im; });
const pKey = p => p.color + p.type.toUpperCase();
var sfxOut = null;
function sfx(){ ensureAC(); if(!sfxOut){ sfxOut = AC.createGain(); sfxOut.gain.value = .7; sfxOut.connect(AC.destination); } return sfxOut; }
var noiseBuf = null;
function noise(){ if(!noiseBuf){ const n = AC.sampleRate; noiseBuf = AC.createBuffer(1, n, AC.sampleRate); const d = noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i] = Math.random()*2 - 1; } return noiseBuf; }
function woodKnock(t, f, v, len){
  const out = sfx();
  const s = AC.createBufferSource(); s.buffer = noise(); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 2.2;
  const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + len);
  s.connect(bp); bp.connect(g); g.connect(out); s.start(t, Math.random()*.5); s.stop(t + len + .02);
  const o = AC.createOscillator(), og = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f*.16, t); o.frequency.exponentialRampToValueAtTime(f*.08, t + len);
  og.gain.setValueAtTime(v*.9, t); og.gain.exponentialRampToValueAtTime(.0001, t + len*1.2); o.connect(og); og.connect(out); o.start(t); o.stop(t + len*1.3);
}
function tone(t, f, len, v, type){ const out = sfx(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(g); g.connect(out); o.start(t); o.stop(t + len + .05); }
function chessSfx(kind){
  try {
    sfx(); const t = AC.currentTime + .005;
    if(kind === 'move') woodKnock(t, 1250, .9, .07);
    else if(kind === 'capture'){ woodKnock(t, 1900, 1, .05); woodKnock(t + .035, 900, .9, .09); }
    else if(kind === 'castle'){ woodKnock(t, 1250, .8, .06); woodKnock(t + .11, 1150, .8, .07); }
    else if(kind === 'check'){ woodKnock(t, 1400, .8, .06); tone(t + .02, 1046, .18, .18); tone(t + .02, 1568, .14, .08); }
    else if(kind === 'promote'){ woodKnock(t, 1250, .8, .06); [784, 988, 1175].forEach((f, i) => tone(t + .05 + i*.06, f, .16, .12)); }
    else if(kind === 'end'){ woodKnock(t, 1250, .8, .06); [523, 659, 784, 1046].forEach((f, i) => tone(t + .1 + i*.12, f, .4, .14)); }
    else if(kind === 'illegal') tone(t, 220, .12, .12, 'square');
  } catch(e){}
}
function chessSfxFor(r, g){
  if(!r) return;
  if(g.game_over()) return chessSfx('end');
  if(g.in_check()) return chessSfx('check');
  if(r.flags.includes('p')) return chessSfx('promote');
  if(r.flags.includes('k') || r.flags.includes('q')) return chessSfx('castle');
  if(r.flags.includes('c') || r.flags.includes('e')) return chessSfx('capture');
  chessSfx('move');
}
function kickSfx(v){ try { sfx(); woodKnock(AC.currentTime, 420, v || .8, .09); } catch(e){} }
function whistleSfx(){ try { sfx(); const t = AC.currentTime; tone(t, 2600, .25, .12, 'sine'); tone(t + .28, 2600, .45, .12, 'sine'); } catch(e){} }
function cheerSfx(){ try { const out = sfx(), t = AC.currentTime; const s = AC.createBufferSource(); s.buffer = noise(); s.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = .6; const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .3); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8); s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + 1.9); [523, 659, 784].forEach((f, i) => tone(t + i*.1, f, .3, .1)); } catch(e){} }
function blipSfx(f){ try { sfx(); tone(AC.currentTime, f || 880, .12, .12, 'square'); } catch(e){} }
function lookFor(i){ const l = NPC_LOOKS[i % NPC_LOOKS.length]; return {shirt:l[0], pants:l[1], hair:l[2], skin:SKINS[i % SKINS.length], dir:1, walk:0, moving:false, task:'', long:i%3 === 1, glasses:i%5 === 2}; }
const isDay = () => clock >= 390 && clock <= 1080;
const NPC_NAMES = ['Tùng','Lan','Vy','Phúc','Hân','Duy','Ngân','Long','Thư','Bảo','Trâm','Khoa','My','Nhi','Hưng Em','Quỳnh'];

