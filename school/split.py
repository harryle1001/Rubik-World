# Split the single-file game into index.html + css/style.css + many js files.
# The js files are pieces of ONE program: index.html fetches them in order, joins them and runs them as one script,
# so they share every variable exactly like before (no behavior change).
import os, re, sys, shutil
D = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(D, 'truong-agent-rubik.html')
OUT = os.path.join(D, 'game')
s = open(SRC, encoding='utf-8').read()

# ---------- main script ----------
OPEN = "<script>\n(() => {\n'use strict';\n"
a = s.find(OPEN, 100000); assert a > 0
b = s.find('</script>', a); body = s[a + len(OPEN):b]
END = "\n})();\n"
assert body.endswith(END), repr(body[-40:])
body = body[:-len(END)]
lines = body.split('\n')

# split points: (match at line start, file)
PLAN = [
  ('// ================= WORLD =', 'js/core/world.js'),
  ('// ================= STATE =', 'js/core/state-agents.js'),
  ('// ================= EVENTS =', 'js/core/events-brains.js'),
  ('// ================= WEATHER', 'js/core/weather-sim-camera.js'),
  ('// ================= DRAWING =', 'js/map.js'),
  ('// ================= LOOP =', 'js/core/loop.js'),
  ('// ================= UI =', 'js/ui/ui-music-missions.js'),
  ('// ================= CHESS =', 'js/games/chess.js'),
  ('// ================= RUBIK 3D =', 'js/games/rubik3d.js'),
  ('// ================= FISHING =', 'js/games/fishing.js'),
  ('// ================= START =', 'js/core/start.js'),
  ('// ================= EXT: SHARED =', 'js/ext/shared.js'),
  ('const PIANO_B64 = ', 'js/data/piano-samples.js'),
  ('@after', 'js/ext/shared-2.js'),
  ('// ================= EXT: CHESS PIECES', 'js/games/chess-tables.js'),
  ('// ================= EXT: ANIMALS =', 'js/world/farm-zones.js'),
  ('// ================= EXT: CONTROLLED', 'js/player/control-boat-riding.js'),
  ('// ================= EXT: ARCADE', 'js/games/arcade.js'),
  ('// ================= EXT: CARO', 'js/games/caro-go.js'),
  ('// ================= EXT: GENERATIVE', 'js/games/art-music.js'),
  ('// ================= EXT: GLUE =', 'js/ext/glue.js'),
  ('// ================= EXT7:', 'js/shop.js'),
  ('// ================= EXT8:', 'js/world/east-lands.js'),
  ('// ================= EXT9:', 'js/games/library.js'),
  ('// ================= EXT10:', 'js/games/olympics.js'),
  ('// ================= EXT11:', 'js/games/rubik-lab.js'),
  ('// ================= EXT12:', 'js/games/fishing-boat.js'),
  ('// ================= EXT13:', 'js/online.js'),
  ('// ================= EXT14:', 'js/shop-mall-market.js'),
  ('// ================= EXT17:', 'js/player/autowalk.js'),
  ('// ================= EXT18:', 'js/games/reader-books.js'),
  ('const TEXT_GZ = ', 'js/data/books-text.js'),
  ('@after', 'js/games/reader-books-2.js'),
  ('// ================= EXT19:', 'js/world/street-mentors.js'),
  ('// ================= EXT20:', 'js/games/rubik-formula.js'),
  ('// ================= EXT21 (v16)', 'js/ext/v16-world-extras.js'),
  ('// ================= EXT22 (v17)', 'js/ext/v17-sky.js'),
  ('// ================= EXT23 (v18)', 'js/ext/v18-minimap.js'),
  ('// ================= EXT24 (v19)', 'js/ext/v19-royal-library.js'),
  ('// ================= EXT25 (v20)', 'js/ext/v20-round-zones.js'),
  ('// ================= EXT26 (v21)', 'js/ext/v21-settings-time.js'),
  ('// ================= EXT27 (v22)', 'js/ext/v22-owner-console.js'),
  ('// ================= EXT28 (v23)', 'js/ext/v23-mobile.js'),
  ('// ================= EXT29 (v24)', 'js/ext/v24-phone-polish.js'),
  ('// ================= EXT30 (v25)', 'js/ext/v25-night-lights.js'),
  ('// ================= EXT31 (v26)', 'js/ext/v26-performance.js'),
  ('// ================= EXT32 (v27)', 'js/ext/v27-hud.js'),
  ('// ================= EXT37 (v32)', 'js/ext/v32-phone-ui.js'),
  ('// ================= EXT38 (v33)', 'js/ext/v33-observatory.js'),
  ('// ================= EXT39 (v34)', 'js/ext/v34-swipe.js'),
  ('// ================= EXT40 (v35)', 'js/ext/v35-polish.js'),
  ('// ================= EXT41 (v36)', 'js/npc-hosts.js'),
  ('function extFinalInit(){', 'js/main.js'),
]
cuts = []; i = 0
for key, f in PLAN:
    if key == '@after':
        cuts.append((cuts[-1][0] + 1, f)); continue
    while not lines[i].startswith(key): i += 1
    cuts.append((i, f)); i += 1
assert cuts[0][0] == 0, cuts[0]
files = []
for k, (st, f) in enumerate(cuts):
    en = cuts[k + 1][0] if k + 1 < len(cuts) else len(lines)
    files.append((f, '\n'.join(lines[st:en])))
assert '\n'.join(t for _, t in files) == body

if os.path.isdir(OUT): shutil.rmtree(OUT)
for f, t in files:
    p = os.path.join(OUT, f); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(t + '\n')

# ---------- css ----------
head = s[:a]; tail = s[b + len('</script>'):]
styles = []
def take(m): styles.append(m.group(1)); return '\n<!--css-->' if len(styles) == 1 else ''
head2 = re.sub(r'<style>(.*?)</style>', take, head, flags=re.S)
assert '<style' not in tail
os.makedirs(os.path.join(OUT, 'css'), exist_ok=True)
open(os.path.join(OUT, 'css/style.css'), 'w', encoding='utf-8').write('\n/* ---------- */\n'.join(x.strip('\n') for x in styles) + '\n')
head2 = head2.replace('\n<!--css-->', '\n<link rel="stylesheet" href="css/style.css">', 1)

LIST = ',\n  '.join("'%s'" % f for f, _ in files)
LOADER = """<div id="rsBoot" style="position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#0b1028;color:#ffd23f;font:24px VT323,monospace">Đang tải The Rubik School…</div>
<script>
// Game code lives in the js/ files below (in this order). They are joined and run as ONE program.
// To add a feature: make a new file and put it in the list right BEFORE 'js/main.js'.
(() => {
const FILES = [
  %s
];
const boot = document.getElementById('rsBoot');
Promise.all(FILES.map(f => fetch(f, {cache:'no-cache'}).then(r => { if(!r.ok) throw new Error(f + ' (' + r.status + ')'); return r.text(); })))
  .then(parts => {
    const code = "window.__RS_RAN = 1;\\n(() => {\\n'use strict';\\n" + parts.join('\\n') + "\\n})();\\n//# sourceURL=rubik-school-game.js";
    const sc = document.createElement('script'); sc.textContent = code; document.body.appendChild(sc);
    if(window.__RS_RAN){ boot.remove(); return; }
    // fallback 1: run it from a blob file; fallback 2: eval
    const bl = document.createElement('script'); bl.src = URL.createObjectURL(new Blob([code], {type:'text/javascript'}));
    bl.onload = () => { if(!window.__RS_RAN) (0, eval)(code); boot.remove(); };
    bl.onerror = () => { try { (0, eval)(code); boot.remove(); } catch(e){ boot.textContent = 'Không chạy được game: ' + e.message; } };
    document.body.appendChild(bl);
  })
  .catch(e => { boot.textContent = 'Không tải được game: ' + e.message + '. Hãy tải lại trang.'; console.error(e); });
})();
</script>""" % LIST
html = head2 + LOADER + tail
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print(len(files), 'js files; css', len(styles), 'blocks; index.html', len(html))
for f, t in files: print('%9d  %s' % (len(t), f))
