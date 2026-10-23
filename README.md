# Analytic Continuation RPG

Two playable expeditions: Level 1 (square root, two sheets) and Level 2 (cube root, three sheets), both with a negative-real-axis cut.

Run `npm start`, then open http://localhost:4173. Run `npm test` for the float64 mathematics checks. No installation or build step is needed.

WASD / arrows move; holding or dragging on the map also moves toward the pointer. Collect the key at 2+2i on Sheet I, circle the origin across the cut, and open the chest at 2−2i on Sheet II. Crossing |s|=5.5 causes outward drift and HP loss. Restart resets the current expedition, including HP, position, inventory, and run statistics, while keeping earned awards and completed levels.

Top, night, and player-cone views offer Re f, Im f, and magnitude terrain. CPU labels and gameplay use float64; WebGL2 terrain uses float32. Player rays apply the same crossing convention as movement. The exact cut belongs to the upper bank. The origin is protected by a finite obstacle disk, including segment collision checks to prevent tunneling.

The prototype is buildless JavaScript with ES modules, not yet TypeScript. Levels 1–2 are implemented. Levels 3–10 are marked as unavailable in the level menu. The cut intersection routine currently supports horizontal cuts; general segments and other label types belong to the next engine iteration. The player view is a 2D colour/contour graph, not a 3D mesh. Awards and completed levels persist in localStorage; position and in-progress runs do not. If browser storage is unavailable, progress stays in memory and the UI explains that limit. External Google Fonts are cosmetic; system fallbacks work without them.

Before Level 9, resolve the branch convention: principal sqrt(s−threshold)/sqrt(s) has an interior cut. The intended exterior cuts can instead be represented by i*sqrt(threshold−s)/sqrt(s), with a specified boundary convention. No resonance physics is implemented here.

Validation: square-root identities, both-bank continuity, randomized closed-loop comparison against an independent nearest-root tracker, cut endpoint conventions, branch-point collision, and a mission route. Browser QA completed the full mission and checked night/player modes.

## Completion and awards

Opening a chest automatically pauses gameplay and opens a completion dialog with run statistics, awards, Start over, Keep exploring, level selection, and Next level when another playable expedition exists. Closing the dialog resumes exploration; a completed chest does not trigger it again. The Levels & awards button is available during play. Death also offers a restart menu. Dialogs use native modal focus management and Escape dismissal.

Level 2 uses k in Z3: downward crossings map k to k+1 modulo 3, upward crossings map k to k−1 modulo 3. Its key is on k=0 at 2+2i and chest on k=2 at 2−2i. CPU movement and GPU view rays use the same maps.

Awards unlock at 2, 3, and 5 distinct (level, sheet) pairs across the two available expeditions. Initial sheets count as visited. Retracing a path, replaying, or reloading cannot award duplicate discoveries. Two square-root sheets plus three cube-root sheets give five possible discoveries.

Validation for this update: 13 tests including all cube-root branches, both-bank continuity, independent three-loop value tracking, unique-sheet award thresholds, persistence, and corrupt/unavailable storage. Browser QA completed both levels using the actual keyboard controls, tested automatic completion dialogs, Next level, Keep exploring without reopening the dialog, replay reset, and persistence after reload.
