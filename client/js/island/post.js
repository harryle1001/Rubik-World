// post.js — Hậu kỳ: bloom nhẹ + vignette (không dùng SSAO cho nhẹ máy). Tắt bloom được khi máy yếu.
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
  const vignette = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAmt: { value: Q.vignette } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float uAmt; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; c.rgb *= 1. - uAmt * smoothstep(0.25, 0.8, dot(d, d) * 2.); gl_FragColor = c; }',
  });
  composer.addPass(vignette);
  composer.addPass(new OutputPass());
  bloom.enabled = Q.bloom;
  return {
    composer, bloom,
    setSize(w, h) { composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); },
    render() { composer.render(); },
  };
}
