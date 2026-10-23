# Analytic Continuation RPG

Three playable expeditions: Level 1 (square root), Level 2 (cube root), and Level 3 (square root with two branch points).

Run `npm start`, then open http://localhost:4173. Run `npm test` for the float64 mathematics checks. No installation or build step is needed.

WASD / arrows move; holding or dragging on the map also moves toward the pointer. Collect the key at 2+2i on Sheet I, circle the origin across the cut, and open the chest at 2−2i on Sheet II. Crossing |s|=5.5 causes outward drift and HP loss. Restart resets the current expedition, including HP, position, inventory, and run statistics, while keeping earned awards and completed levels.

Top, night, and player-cone views offer Re f, Im f, and magnitude terrain. CPU labels and gameplay use float64; WebGL2 terrain uses float32. Player rays apply the same crossing convention as movement. The exact cut belongs to the upper bank. The origin is protected by a finite obstacle disk, including segment collision checks to prevent tunneling.

The prototype is buildless JavaScript with ES modules, not yet TypeScript. Levels 1–3 are implemented. Levels 4–10 are marked as unavailable in the level menu. The cut intersection routine currently supports horizontal cuts; general segments and other label types belong to the next engine iteration. The player view is a 2D colour/contour graph, not a 3D mesh. Awards and completed levels persist in localStorage; position and in-progress runs do not. If browser storage is unavailable, progress stays in memory and the UI explains that limit. External Google Fonts are cosmetic; system fallbacks work without them.

Before Level 9, resolve the branch convention: principal sqrt(s−threshold)/sqrt(s) has an interior cut. The intended exterior cuts can instead be represented by i*sqrt(threshold−s)/sqrt(s), with a specified boundary convention. No resonance physics is implemented here.

Validation: square-root identities, both-bank continuity, randomized closed-loop comparison against an independent nearest-root tracker, cut endpoint conventions, branch-point collision, and a mission route. Browser QA completed the full mission and checked night/player modes.

## Completion and awards

Opening a chest automatically pauses gameplay and opens a completion dialog with run statistics, awards, Start over, Keep exploring, level selection, and Next level when another playable expedition exists. Closing the dialog resumes exploration; a completed chest does not trigger it again. The Levels & awards button is available during play. Death also offers a restart menu. Dialogs use native modal focus management and Escape dismissal.

Level 2 uses k in Z3: downward crossings map k to k+1 modulo 3, upward crossings map k to k−1 modulo 3. Its key is on k=0 at 2+2i and chest on k=2 at 2−2i. CPU movement and GPU view rays use the same maps.

Awards unlock at 2, 3, 5, and 7 distinct (level, sheet) pairs across the three available expeditions. Initial sheets count as visited. Retracing a path, replaying, or reloading cannot award duplicate discoveries. Two square-root sheets, three cube-root sheets, and two sheets of the two-point surface give seven possible discoveries. The valid sheets and discovery total are derived from level metadata; existing saves and awards retain their meaning.

Validation for this update: 13 tests including all cube-root branches, both-bank continuity, independent three-loop value tracking, unique-sheet award thresholds, persistence, and corrupt/unavailable storage. Browser QA completed both levels using the actual keyboard controls, tested automatic completion dialogs, Next level, Keep exploring without reopening the dialog, replay reset, and persistence after reload.

## Level 3: Between two points

The function is f(s;σ)=σ sqrt(s−a) sqrt(s−b), with principal roots, a=−1.5 and b=1.5. This is a branch of sqrt((s−a)(s−b)) with a single finite cut [a,b]. Taking the principal root of the polynomial directly would introduce a different cut geometry, so it is deliberately not used. The two principal-root jumps cancel for real s<a. Either direction across the finite cut maps σ to −σ. Circling one branch point flips the sheet; circling both does not.

Both branch points have collision disks. The origin is passable and crossing there changes sheets. The key and chest retain their coordinates, on opposite sheets. A sample route is (3,−2) → (3,2) → (2,2) [key] → (0,2) → (0,−2) → (2,−2) [chest].

Rendering now draws the level-defined cuts and branch-point markers. GPU view-ray transport uses the same cut bounds as the CPU. The current GPU supports one real-axis cut per level and explicit evaluator variants; general multi-cut shader transport remains future work. Level 3 participates in next-level progression and the atlas. The new Branch-point voyager award requires seven distinct sheets; prior awards remain at 2, 3 and 5.

Validation: 20 passing tests, including polynomial identities, bank continuity, absence of spurious cuts, independently tracked loops around either/both branch points, both obstacle collisions, mission route, and migration of five-sheet progress to seven. Browser QA completed the Level 3 mission, confirmed the seven-sheet award and completion menu, and inspected top/night/player rendering.
