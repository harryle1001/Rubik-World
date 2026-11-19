// tools/wild-doc.mjs — Sinh bảng danh sách loài (docs/animals/species.md) từ client/js/island/wild/species.js. Chạy: node tools/wild-doc.mjs
import fs from 'fs';
import { SPECIES, HAB, CLS, IUCN, WAITLIST } from '../client/js/island/wild/species.js';
const KIND = { w: 'đi bộ', f: 'đàn chim nhỏ', v: 'bay chữ V', p: 'đậu dây điện', r: 'chim săn lượn', b: 'bay đêm', i: 'côn trùng bay', s: 'bơi', sc: 'đàn cá', x: 'có sẵn trong game' };
const sci = new Set(SPECIES.map(S => S.sci)), live = SPECIES.filter(S => S.m), models = new Set(live.map(S => S.m));
for (const S of live) { if (S.mate) models.add(S.mate); if (S.baby) models.add(S.baby); }
const shared = live.length - new Set(live.map(S => S.m)).size;
const byCls = {}; for (const S of SPECIES) byCls[S.cls] = (byCls[S.cls] || 0) + 1;
let md = `# Danh sách loài động vật (tự sinh bằng tools/wild-doc.mjs)\n\n`;
md += `- **${SPECIES.length} trang trong Sổ tay thiên nhiên**, **${sci.size} tên khoa học khác nhau** (${SPECIES.filter(S => S.breed).length} trang là giống chó nhà).\n`;
md += `- ${live.length} loài do hệ \`wild/\` điều khiển bằng **${models.size} model CC0** (${shared} loài dùng chung model với loài khác, phân biệt bằng màu, cỡ và tập tính — trong đó ${live.filter(S => S.var).length} loài ghi rõ "biến thể màu, chờ model riêng"); ${SPECIES.length - live.length} loài đã có sẵn trong game (animals.js, fauna.js, sealife.js, Safari).\n`;
md += `- Theo lớp: ${Object.entries(byCls).map(([k, n]) => `${CLS[k]} ${n}`).join(' · ')}.\n\n`;
for (const [h, [ic, name]] of Object.entries(HAB)) {
  const list = SPECIES.filter(S => S.hab === h); if (!list.length) continue;
  md += `## ${ic} ${name} (${list.length})\n\n| | Tên Việt | Tên khoa học | Lớp | Model | Kiểu | Hoạt động | Tập tính riêng | Bảo tồn |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const S of list) md += `| ${S.ic} | ${S.name} | *${S.sci}* | ${CLS[S.cls]} | ${S.m ? S.m + (S.var ? ' (biến thể màu)' : '') : '—'} | ${KIND[S.k]} | ${S.m ? (S.act === 'n' ? 'đêm' : S.act === 'a' ? 'ngày + đêm' : 'ngày') + (S.mig ? ', theo mùa' : '') + (S.rain ? ', thích mưa' : '') : ''} | ${[...(S.beh || []), S.prey ? 'rượt ' + S.prey.slice(2) : '', S.baby ? 'mẹ dẫn con' : '', S.herd ? 'theo đàn' : '', S.feed ? 'cho ăn: ' + S.feed : '', S.shy < 0 ? 'tò mò' : S.shy > 0 ? 'nhút nhát' : ''].filter(Boolean).join(', ')} | ${S.st} ${IUCN[S.st][0]} |\n`;
  md += '\n';
}
md += `## ⏳ Danh sách chờ (chưa có model CC0 có animation dùng được)\n\n${WAITLIST.join(', ')}.\n`;
fs.mkdirSync('docs/animals', { recursive: true }); fs.writeFileSync('docs/animals/species.md', md);
// bảng hiệu năng trước/sau từ kết quả tools/wild-test.mjs
const rd = f => { try { return JSON.parse(fs.readFileSync('docs/animals/' + f, 'utf8')); } catch (e) { return null; } };
let pm = '# Hiệu năng trước / sau khi thêm hệ động vật (tự sinh)\n\nĐo bằng `tools/wild-test.mjs` (Chromium + SwiftShader, mức chất lượng 1, trung bình ≥ 12 khung sau khi đứng yên ở mỗi sinh cảnh). "Trước" = cùng vị trí với `?nowild`.\n';
for (const [tag, name] of [['m', 'Điện thoại 390×844 (CAP 21 con)'], ['d', 'Máy tính 1280×720 (CAP 34 con)']]) {
  const a = rd(`perf-${tag}.json`), b = rd(`perf-${tag}-before.json`); if (!a) continue; const B = new Map((b || []).map(r => [r.name, r]));
  pm += `\n## ${name}\n\n| Sinh cảnh | Draw call trước | Draw call sau | Δ | Tam giác sau | JS wild (ms/khung) | Thú có xương | Đàn instanced |\n|---|---|---|---|---|---|---|---|\n`;
  let mx = 0; for (const r of a) { const q = B.get(r.name); mx = Math.max(mx, r.calls); pm += `| ${r.name} | ${q ? q.calls : '—'} | **${r.calls}** | ${q ? (r.calls - q.calls >= 0 ? '+' : '') + (r.calls - q.calls) : ''} | ${r.tris} | ${r.wildMs} | ${r.actors} | ${r.flocks} |\n`; }
  pm += `\nDraw call lớn nhất: **${mx}**.\n`;
}
fs.writeFileSync('docs/animals/perf.md', pm);
console.log(`${SPECIES.length} trang · ${sci.size} tên khoa học · ${live.length} loài wild · ${models.size} model · ${live.filter(S => S.var).length} biến thể`);
