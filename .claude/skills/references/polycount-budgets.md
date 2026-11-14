# Polycount budgets (shared reference)

_Added locally because skills link to this file without shipping it. Numbers are typical current-gen targets; low-poly styles apply a 50–90% reduction (see each style skill)._

| Asset | Typical modern target (tris) | Low-poly after 50–90% cut |
|---|---|---|
| Hero character | 15,000–40,000 | 500–3,000 |
| NPC / creature | 5,000–15,000 | 500–2,000 |
| Small prop | 500–3,000 | 50–500 |
| Large prop / furniture | 2,000–8,000 | 200–1,000 |
| Environment module (wall, floor kit piece) | 1,000–5,000 | 100–800 |
| Tree | 2,000–10,000 | 200–800 |
| Vehicle | 15,000–60,000 | 2,000–8,000 |
| Building exterior | 5,000–30,000 | 500–4,000 |

Mobile web (three.js): keep the visible frame under ~150–300k triangles and ~100 draw calls; use InstancedMesh for repeated props.
