// post.js — Hậu kỳ: tone mapping ACES + MSAA (máy tính 4x, điện thoại 2x) + bloom nhẹ + làm nét thích ứng + tia nắng + chỉnh màu theo giờ + vignette (không dùng SSAO cho nhẹ máy). Tắt bloom được khi máy yếu.
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
  // khử răng cưa MSAA ngay trong render target của hậu kỳ (sắc nét, không nhoè như FXAA)
  const pr = renderer.getPixelRatio(), rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType, samples: Q.msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // bloom tính ở nửa độ phân giải cho nhẹ
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), Q.bloomStrength, Q.bloomRadius, Q.bloomThreshold);
  composer.addPass(bloom);
  // Hậu kỳ cuối: tia nắng xuyên khe (god rays, 12 mẫu về phía mặt trời) + chỉnh màu theo giờ + vignette — gộp 1 pass cho nhẹ
  const grade = {
    tDiffuse: { value: null }, uAmt: { value: Q.vignette },
    uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1 }, uCon: { value: 1 }, uWarm: { value: Q.warmth }, uSat0: { value: Q.saturation },
    uSunUV: { value: new THREE.Vector2(0.5, 0.5) }, uRays: { value: 0 }, uSharp: { value: 0.18 }, uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) }, uRayCol: { value: new THREE.Color('#ffe2a8') }, uAsp: { value: 1 },
  };
  const vignette = new ShaderPass({
    uniforms: grade,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt, uSat, uCon, uRays, uAsp, uWarm, uSat0, uSharp; uniform vec3 uLift, uGain, uRayCol; uniform vec2 uSunUV, uTexel; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        if (uSharp > 0.01) {   // làm nét nhẹ (4 mẫu chữ thập, giới hạn biên độ để không viền sáng): ảnh hết nhoè khi máy hạ độ phân giải
          vec3 n = texture2D(tDiffuse, vUv + vec2(0., uTexel.y)).rgb, s = texture2D(tDiffuse, vUv - vec2(0., uTexel.y)).rgb, e = texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.)).rgb, w = texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.)).rgb;
          vec3 mn = min(c.rgb, min(min(n, s), min(e, w))), mx = max(c.rgb, max(max(n, s), max(e, w)));
          c.rgb = clamp(c.rgb + (4. * c.rgb - n - s - e - w) * uSharp * 0.25, mn, mx);
        }
        if (uRays > 0.003) {   // tia nắng: cộng dồn chỗ sáng (trời) dọc đường về phía mặt trời → vệt sáng lọt qua cây, mái nhà
          vec2 dv = (uSunUV - vUv) / 12.; vec2 q = vUv; float acc = 0., w = 1.;
          for (int i = 0; i < 12; i++) { q += dv; vec3 s = texture2D(tDiffuse, clamp(q, 0., 1.)).rgb; acc += smoothstep(0.78, 1.0, max(s.r, max(s.g, s.b))) * w; w *= 0.9; }
          vec2 o = (vUv - uSunUV) * vec2(uAsp, 1.); float fall = exp(-dot(o, o) * 2.2);
          c.rgb += uRayCol * acc / 7.2 * fall * uRays;
        }
        c.rgb = uLift + c.rgb * uGain;                                         // tông màu theo giờ (sáng ấm, đêm lam)
        float l = dot(c.rgb, vec3(0.299, 0.587, 0.114)); c.rgb = max(mix(vec3(l), c.rgb, uSat * uSat0), 0.);
        c.rgb = max(vec3(0.), (c.rgb - 0.18) * uCon + 0.18);                  // tương phản quanh xám giữa (không gian tuyến tính)
        c.rgb *= vec3(1. + uWarm, 1. + uWarm * 0.35, 1. - uWarm);            // ấm nhẹ (nền cozy)
        vec2 d = vUv - .5; c.rgb *= 1. - uAmt * smoothstep(0.25, 0.8, dot(d, d) * 2.);
        gl_FragColor = c; }`,
  });
  composer.addPass(vignette);
  composer.addPass(new OutputPass());
  bloom.enabled = Q.bloom;
  vignette.uniforms.uTexel.value.set(1 / (innerWidth * pr), 1 / (innerHeight * pr));
  composer.setSize(innerWidth, innerHeight);   // đúng kích thước theo pixelRatio khi tự tạo render target
  return {
    composer, bloom, grade: vignette.uniforms,   // grade: ambience.js chỉnh theo giờ/thời tiết
    // composer giữ pixelRatio riêng (lấy lúc tạo) → phải đồng bộ, nếu không hạ chất lượng không giảm độ phân giải thật
    setSize(w, h) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); const pr = renderer.getPixelRatio(); vignette.uniforms.uTexel.value.set(1 / (w * pr), 1 / (h * pr)); },
    // đổi số mẫu MSAA (0 = tắt) khi máy yếu: cấp phát lại 2 render target ở lần vẽ sau
    setMSAA(n) { for (const t of [composer.renderTarget1, composer.renderTarget2]) if (t.samples !== n) { t.samples = n; t.dispose(); } },
    render() { composer.render(); },
  };
}
