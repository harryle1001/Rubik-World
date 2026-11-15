// post.js — Hậu kỳ: tone mapping ACES + chỉnh màu (ấm, tươi nhẹ) + vignette gộp 1 pass, bloom nhẹ (tắt trên điện thoại).
// Không dùng SSAO (đắt trên điện thoại). Máy tính: khử răng cưa MSAA 4x trong render target.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CFG } from './config.js';

export function createPost(renderer, scene, camera) {
  const Q = CFG.quality;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = Q.exposure;   // OutputPass áp dụng
  const pr = renderer.getPixelRatio();
  const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType, samples: Q.msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // bloom tính ở nửa độ phân giải cho nhẹ
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), Q.bloomStrength, Q.bloomRadius, Q.bloomThreshold);
  composer.addPass(bloom);
  // chỉnh màu + vignette trong 1 pass (trước tone mapping, màu tuyến tính)
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAmt: { value: Q.vignette }, uSat: { value: Q.saturation }, uCon: { value: Q.contrast }, uWarm: { value: Q.warmth } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt, uSat, uCon, uWarm; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
        c.rgb = max(mix(vec3(l), c.rgb, uSat), 0.);                       // độ tươi
        c.rgb = pow(c.rgb / 0.18, vec3(uCon)) * 0.18;                     // tương phản quanh xám trung tính
        c.rgb *= vec3(1. + uWarm, 1. + uWarm * 0.35, 1. - uWarm);          // ấm nhẹ
        vec2 d = vUv - .5; c.rgb *= 1. - uAmt * smoothstep(0.2, 0.85, dot(d, d) * 2.);
        gl_FragColor = c; }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());
  bloom.enabled = Q.bloom;
  composer.setSize(innerWidth, innerHeight);   // kích thước đúng theo pixelRatio (khi tự tạo render target)
  return {
    composer, bloom, grade,
    setSize(w, h) { composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); },
    render() { composer.render(); },
  };
}
