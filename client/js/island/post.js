// post.js — Hậu kỳ: bloom nhẹ + tia nắng + chỉnh màu theo giờ + vignette (không dùng SSAO cho nhẹ máy). Tắt bloom được khi máy yếu.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CFG } from './config.js';

export function createPost(renderer, scene, camera) {
  const Q = CFG.quality;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // bloom tính ở nửa độ phân giải cho nhẹ
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), Q.bloomStrength, Q.bloomRadius, Q.bloomThreshold);
  composer.addPass(bloom);
  // Hậu kỳ cuối: tia nắng xuyên khe (god rays, 12 mẫu về phía mặt trời) + chỉnh màu theo giờ + vignette — gộp 1 pass cho nhẹ
  const grade = {
    tDiffuse: { value: null }, uAmt: { value: Q.vignette },
    uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1 }, uCon: { value: 1 },
    uSunUV: { value: new THREE.Vector2(0.5, 0.5) }, uRays: { value: 0 }, uRayCol: { value: new THREE.Color('#ffe2a8') }, uAsp: { value: 1 },
  };
  const vignette = new ShaderPass({
    uniforms: grade,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt, uSat, uCon, uRays, uAsp; uniform vec3 uLift, uGain, uRayCol; uniform vec2 uSunUV; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        if (uRays > 0.003) {   // tia nắng: cộng dồn chỗ sáng (trời) dọc đường về phía mặt trời → vệt sáng lọt qua cây, mái nhà
          vec2 dv = (uSunUV - vUv) / 12.; vec2 q = vUv; float acc = 0., w = 1.;
          for (int i = 0; i < 12; i++) { q += dv; vec3 s = texture2D(tDiffuse, clamp(q, 0., 1.)).rgb; acc += smoothstep(0.78, 1.0, max(s.r, max(s.g, s.b))) * w; w *= 0.9; }
          vec2 o = (vUv - uSunUV) * vec2(uAsp, 1.); float fall = exp(-dot(o, o) * 2.2);
          c.rgb += uRayCol * acc / 7.2 * fall * uRays;
        }
        c.rgb = uLift + c.rgb * uGain;                                         // tông màu theo giờ (sáng ấm, đêm lam)
        float l = dot(c.rgb, vec3(0.299, 0.587, 0.114)); c.rgb = mix(vec3(l), c.rgb, uSat);
        c.rgb = max(vec3(0.), (c.rgb - 0.18) * uCon + 0.18);                  // tương phản quanh xám giữa (không gian tuyến tính)
        vec2 d = vUv - .5; c.rgb *= 1. - uAmt * smoothstep(0.25, 0.8, dot(d, d) * 2.);
        gl_FragColor = c; }`,
  });
  composer.addPass(vignette);
  composer.addPass(new OutputPass());
  bloom.enabled = Q.bloom;
  return {
    composer, bloom, grade: vignette.uniforms,   // grade: ambience.js chỉnh theo giờ/thời tiết
    setSize(w, h) { composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); },
    render() { composer.render(); },
  };
}
