// portals.js — VÒNG TRÒN ÁNH SÁNG Ở LỐI VÀO mỗi khu.
// Mọi vòng dùng chung 1 hàm makePortal(). Vòng tự đặt trước cửa mỗi khu trong CONFIG.AREAS (config.js),
// nên thêm khu mới chỉ cần thêm 1 dòng ở đó.
// Bước vào vòng → hiện tên khu → màn hình mờ dần → vào khu (mini game). Rời khu → mờ dần → đứng lại ngoài vòng.
// - Màu vòng sáng: COLOR · Bán kính: RADIUS · Thời gian hiện tên trước khi vào: NAME_DELAY
import * as THREE from 'three';
import { U } from './utils.js';

const COLOR = new THREE.Color('#ffd27a'), COLOR2 = new THREE.Color('#9ff3ff');
const RADIUS = 1.9, NAME_DELAY = 1.1, FADE = 0.55, PARTS = 36;

const ringMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: U.uTime, uA: { value: COLOR }, uB: { value: COLOR2 }, uBoost: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform float uTime; uniform vec3 uA, uB; uniform float uBoost; varying vec2 vUv;
    void main(){
      vec2 p = vUv*2.-1.; float r = length(p), a = atan(p.y, p.x);
      float pulse = 0.75 + 0.25*sin(uTime*1.6);
      float ring = smoothstep(0.78, 0.88, r) * (1. - smoothstep(0.9, 1.0, r)) * 2.2;
      float inner = (1. - smoothstep(0.0, 0.92, r)) * 0.35;
      float runes = step(0.5, fract(a*3.8197 + uTime*0.25)) * smoothstep(0.66, 0.7, r) * (1.-smoothstep(0.74, 0.78, r)) * 0.6;
      float glow = (ring*1.4 + inner + runes) * pulse * (1. + uBoost*1.5);
      vec3 c = mix(uA, uB, 0.5 + 0.5*sin(a*2. + uTime*0.8));
      gl_FragColor = vec4(c * glow, glow);
    }`,
});
const beamMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: U.uTime, uA: { value: COLOR }, uBoost: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform float uTime; uniform vec3 uA; uniform float uBoost; varying vec2 vUv;
    void main(){ float f = pow(1. - vUv.y, 2.2) * (0.55 + 0.45*sin(uTime*1.6)) * 0.5 * (1. + uBoost*2.); float s = 0.8 + 0.2*sin(vUv.x*60. + uTime*2.); gl_FragColor = vec4(uA*f*s, f*s); }`,
});
const partMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: U.uTime, uA: { value: COLOR }, uPx: { value: 1 } },
  vertexShader: `attribute vec3 aSeed; uniform float uTime; uniform float uPx; varying float vA;
    void main(){
      float k = fract(uTime*0.22*(0.6+aSeed.z) + aSeed.z*7.);
      float a = aSeed.x + uTime*0.4;
      vec3 p = position + vec3(cos(a)*aSeed.y, k*3.6, sin(a)*aSeed.y);
      vA = sin(k*3.1416) * (0.6 + 0.4*sin(uTime*3. + aSeed.z*20.));
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      gl_PointSize = uPx * (0.07 + aSeed.z*0.08) / -mv.z;
    }`,
  fragmentShader: `uniform vec3 uA; varying float vA; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(mix(uA, vec3(1.), 0.5)*a, a); }`,
});

// Hàm dùng chung cho mọi vòng sáng
export function makePortal(scene, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y + 0.06, z);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(RADIUS * 2.2, RADIUS * 2.2).rotateX(-Math.PI / 2), ringMat); g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS * 0.92, RADIUS * 0.98, 3.2, 28, 1, true).translate(0, 1.6, 0), beamMat); g.add(beam);
  const pos = new Float32Array(PARTS * 3), seed = new Float32Array(PARTS * 3);
  for (let i = 0; i < PARTS; i++) seed.set([Math.random() * 6.283, 0.3 + Math.random() * (RADIUS - 0.4), Math.random()], i * 3);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const pts = new THREE.Points(pg, partMat); pts.frustumCulled = false; g.add(pts);
  ring.renderOrder = beam.renderOrder = pts.renderOrder = 3;
  scene.add(g);
  return g;
}

export function createPortals(ctx, world, screen) {
  const setPx = () => { partMat.uniforms.uPx.value = ctx.renderer.getPixelRatio() * innerHeight / (2 * Math.tan(ctx.camera.fov * Math.PI / 360)); };
  setPx(); addEventListener('resize', setPx);
  const fade = document.getElementById('fade'), label = document.getElementById('areaLabel');
  const list = world.layout.areas.map(a => {
    const y = world.groundAt(a.portal.x, a.portal.z);
    return { area: a, x: a.portal.x, z: a.portal.z, obj: makePortal(ctx.scene, a.portal.x, y, a.portal.z), armed: true };
  });
  let state = 'idle', cur = null, timer = 0;

  const showLabel = a => { label.querySelector('h2').textContent = a.name; label.querySelector('p').textContent = a.sub || ''; label.classList.remove('show'); void label.offsetWidth; label.classList.add('show'); };
  const hideLabel = () => label.classList.remove('show');

  function enter() {
    state = 'fadeout'; timer = 0; fade.classList.add('on'); ctx.player.frozen = true; ctx.sfx && ctx.sfx('whoosh');
    setTimeout(() => {
      hideLabel(); if (ctx.player.riding) ctx.player.dismount();
      screen.open(cur.area, leave);
      fade.classList.remove('on'); state = 'inside';
    }, FADE * 1000);
  }
  function leave() {
    fade.classList.add('on');
    setTimeout(() => {
      const a = cur.area, d = 3.4; ctx.player.teleport(cur.x + a.fx * d, cur.z + a.fz * d, Math.atan2(a.fx, a.fz));
      cur.armed = false; ctx.player.frozen = false; state = 'idle'; cur = null;
      setTimeout(() => fade.classList.remove('on'), 80);
    }, FADE * 1000);
  }

  function update(dt) {
    const p = ctx.player.pos;
    for (const P of list) {
      const d = Math.hypot(p.x - P.x, p.z - P.z);
      if (!P.armed && d > RADIUS + 1.2) P.armed = true;
      P.obj.visible = d < 140;
    }
    if (state === 'idle') {
      for (const P of list) if (P.armed && Math.hypot(p.x - P.x, p.z - P.z) < RADIUS * 0.8) { cur = P; state = 'naming'; timer = 0; showLabel(P.area); ctx.sfx && ctx.sfx('chime'); break; }
    } else if (state === 'naming') {
      timer += dt; ringMat.uniforms.uBoost.value = beamMat.uniforms.uBoost.value = Math.min(1, timer / NAME_DELAY);
      if (Math.hypot(p.x - cur.x, p.z - cur.z) > RADIUS * 1.05) { state = 'idle'; cur = null; hideLabel(); }
      else if (timer >= NAME_DELAY) enter();
    } else ringMat.uniforms.uBoost.value = beamMat.uniforms.uBoost.value *= 0.9;
    if (state === 'idle') ringMat.uniforms.uBoost.value = beamMat.uniforms.uBoost.value = Math.max(0, ringMat.uniforms.uBoost.value - dt * 2);
  }
  return { update, list, get busy() { return state !== 'idle'; } };
}
