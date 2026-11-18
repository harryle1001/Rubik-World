// tools/nan-test.mjs — Kiểm tra chống NaN: chèn 1 tấm phẳng xuất NaN (0/0) trước camera (bloom bật) rồi đo tỉ lệ điểm đen.
// Chạy: node server/index.js &  rồi  node tools/nan-test.mjs   → nan ≈ cỡ tấm phẳng (~2 %) là đạt; ≈ 1 nghĩa là NaN lan cả màn hình.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
await page.waitForTimeout(1500);
const r = await page.evaluate(async () => {
  const c = __island, THREE = await import('three'); c.setQuality(0, true); c.sky.state.lock = 13;
  const meas = () => new Promise(res => { const r0 = c.post.render; c.post.render = function () { r0.call(this); const gl = c.renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, d = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d); let b = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 31) { if (d[i] + d[i + 1] + d[i + 2] < 6) b++; n++; } c.post.render = r0; res(+(b / n).toFixed(3)); }; });
  await new Promise(r => setTimeout(r, 800)); const base = await meas();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.ShaderMaterial({ uniforms: { uZ: { value: 0 } }, vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'uniform float uZ; void main(){ float n = uZ / uZ; gl_FragColor = vec4(vec3(n), 1.); }' }));
  m.frustumCulled = false; c.scene.add(m); const cam = c.camera; m.onBeforeRender = () => { m.position.copy(cam.position).add(new THREE.Vector3(0, 0, -3).applyQuaternion(cam.quaternion)); m.quaternion.copy(cam.quaternion); m.updateMatrixWorld(); };
  await new Promise(r => setTimeout(r, 800)); const nan = await meas();
  return { base, nan, bloom: c.post.bloom.enabled };
});
console.log(JSON.stringify(r), errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
