# PS1 aesthetic — techniques (reference for lowpoly-style)

_Added locally because the original skill links to this file without shipping it. Replace with the author's version if you obtain it._

- **Resolution**: render to a 320×240 (or 480×270) target, upscale with nearest filtering.
- **Textures**: 64–256px, nearest-neighbour sampling, no mipmaps, limited palette (15/16-bit colour, optional dithering).
- **Vertex snapping (jitter)**: in the vertex shader snap clip-space xy to a low grid: `pos.xy = floor(pos.xy / pos.w * res) / res * pos.w`.
- **Affine texture mapping**: interpolate UVs without perspective correction (multiply UV by w in VS, divide in FS), most visible on large floor quads.
- **Lighting**: per-vertex (Gouraud) or baked vertex colours; one directional light + ambient; strong distance fog hides draw distance.
- **Geometry**: large quads, no bevels, visible polygon edges are fine.
- **three.js**: `texture.magFilter = texture.minFilter = THREE.NearestFilter`, `renderer.setPixelRatio(0.5)` or a low-res render target, `MeshLambertMaterial` for per-vertex-like shading.
