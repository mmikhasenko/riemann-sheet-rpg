# Analytic Continuation RPG

Five playable expeditions: square root, cube root, product of two roots, sum of independent roots, and logarithm.

Run `npm start`, then open http://localhost:4173. Run `npm test` for the float64 mathematics checks. No installation or build step is needed.

WASD / arrows move; holding or dragging on the map also moves toward the pointer. Collect the key at 2+2i on Sheet I, circle the origin across the cut, and open the chest at 2−2i on Sheet II. Crossing |s|=5.5 causes outward drift and HP loss. Restart resets the current expedition, including HP, position, inventory, and run statistics, while keeping earned awards and completed levels.

Top, night, and player-cone views offer Re f, Im f, and magnitude terrain. CPU labels and gameplay use float64; WebGL2 terrain uses float32. Player rays apply the same crossing convention as movement. The exact cut belongs to the upper bank. The origin is protected by a finite obstacle disk, including segment collision checks to prevent tunneling.

The prototype is buildless JavaScript with ES modules, not yet TypeScript. Levels 1–5 are implemented. Levels 6–10 are marked as unavailable in the level menu. The cut intersection routine currently supports horizontal cuts; general segments and other label types belong to the next engine iteration. The player view is a 2D colour/contour graph, not a 3D mesh. Awards and completed levels persist in localStorage; position and in-progress runs do not. If browser storage is unavailable, progress stays in memory and the UI explains that limit. External Google Fonts are cosmetic; system fallbacks work without them.

Before Level 9, resolve the branch convention: principal sqrt(s−threshold)/sqrt(s) has an interior cut. The intended exterior cuts can instead be represented by i*sqrt(threshold−s)/sqrt(s), with a specified boundary convention. No resonance physics is implemented here.

Validation: square-root identities, both-bank continuity, randomized closed-loop comparison against an independent nearest-root tracker, cut endpoint conventions, branch-point collision, and a mission route. Browser QA completed the full mission and checked night/player modes.

## Completion and awards

Opening a chest automatically pauses gameplay and opens a completion dialog with run statistics, awards, Start over, Keep exploring, level selection, and Next level when another playable expedition exists. Closing the dialog resumes exploration; a completed chest does not trigger it again. The Levels & awards button is available during play. Death also offers a restart menu. Dialogs use native modal focus management and Escape dismissal.

Level 2 uses k in Z3: downward crossings map k to k+1 modulo 3, upward crossings map k to k−1 modulo 3. Its key is on k=0 at 2+2i and chest on k=2 at 2−2i. CPU movement and GPU view rays use the same maps.

Awards unlock at 2, 3, 5, 7, and 11 distinct (level, sheet) pairs across the four available expeditions. Initial sheets count as visited. Retracing a path, replaying, or reloading cannot award duplicate discoveries. Two square-root sheets, three cube-root sheets, and two sheets of the two-point surface give seven possible discoveries. The valid sheets and discovery total are derived from level metadata; existing saves and awards retain their meaning.

Validation for this update: 13 tests including all cube-root branches, both-bank continuity, independent three-loop value tracking, unique-sheet award thresholds, persistence, and corrupt/unavailable storage. Browser QA completed both levels using the actual keyboard controls, tested automatic completion dialogs, Next level, Keep exploring without reopening the dialog, replay reset, and persistence after reload.

## Level 3: Between two points

The function is f(s;σ)=σ sqrt(s−a) sqrt(s−b), with principal roots, a=−1.5 and b=1.5. This is a branch of sqrt((s−a)(s−b)) with a single finite cut [a,b]. Taking the principal root of the polynomial directly would introduce a different cut geometry, so it is deliberately not used. The two principal-root jumps cancel for real s<a. Either direction across the finite cut maps σ to −σ. Circling one branch point flips the sheet; circling both does not.

Both branch points have collision disks. The origin is passable and crossing there changes sheets. The key and chest retain their coordinates, on opposite sheets. A sample route is (3,−2) → (3,2) → (2,2) [key] → (0,2) → (0,−2) → (2,−2) [chest].

Rendering now draws the level-defined cuts and branch-point markers. GPU view-ray transport uses the same cut bounds as the CPU. The current GPU supports one real-axis cut per level and explicit evaluator variants; general multi-cut shader transport remains future work. Level 3 participates in next-level progression and the atlas. The new Branch-point voyager award requires seven distinct sheets; prior awards remain at 2, 3 and 5.

Validation: 20 passing tests, including polynomial identities, bank continuity, absence of spurious cuts, independently tracked loops around either/both branch points, both obstacle collisions, mission route, and migration of five-sheet progress to seven. Browser QA completed the Level 3 mission, confirmed the seven-sheet award and completion menu, and inspected top/night/player rendering.

## Player-view counting audit

Viewing-ray transport is pure and does not change the character label or discovery state. Movement alone increments the sheet-transition counter; repeated entries count transitions but not new discoveries. This is correct for all current single-cut levels. Level 3 has two sheets; seven is the total of level/sheet pairs across Levels 1–3 (2+3+2). The local UI now separates saved current-level discoveries, run transitions, and cross-level discoveries explicitly.

Verification: 23 tests pass. In browser Player view on Level 3, looking through the finite cut left run counts at 1/2 sheets and 0 transitions; physically crossing and returning gave 2/2 sheets and 2 transitions. The wording separates current-level and cross-level counts.

## Level 4: Independent roots

The function is σa sqrt(s−a)+2 σb sqrt(s−b), a=−1.5, b=1.5, with principal building-block roots. Four sign vectors are encoded by two bits: 0=(+,+), 1=(−,+), 2=(+,−), 3=(−,−). Circling a flips bit 0, circling b flips bit 1, and circling both flips both bits.

The overlapping real-axis cuts are represented as disjoint segments: (−∞,a) flips both bits (XOR 3), and [a,b) flips only bit 1 (XOR 2). Both directions use the same involution. The exact real axis uses the upper bank, as in the previous levels. CPU movement and GPU viewing rays use these maps. A crossing of the left segment is one player sheet transition, although two root signs change. Viewing rays never award discoveries.

The key is on (+,+) at 2+2i; the chest is on (−,−) at 2−2i. All four sheets can be visited on this route: start → (3,2) → (2,2) [key] → (0,2) → (0,−2) [+,−] → (−3,−2) → (−3,2) [−,+] → (0,2) → (0,−2) [−,−] → (2,−2) [chest].

Unlike the preceding root functions, magnitude can distinguish relative signs here; simultaneously reversing both signs still preserves magnitude. An eleven-sheet award is added while retaining previous milestones. The current-level display is explicitly 4 sheets; 11 is the combined 2+3+2+4 count. The requested Level 4 replaces the originally proposed logarithm at this index; logarithmic levels remain future work.

28 tests pass, including the quartic identity, cut continuity on every sheet, independent per-root loop tracking, both obstacles, the four-sheet mission route, awards and persistence. Browser QA visited all four sheets and completed the mission, including movement in Player view. Level 4 includes the preceding counter-clarification changes.

## Keyboard and on-screen controls

T cycles terrain Re f → Im f → magnitude → Re f. R restarts the current expedition, keeping saved awards. Q/E continuously turn left/right at 180° per second without moving the character; matching buttons turn by 45° per click. WASD/arrows retain world-axis movement. Movement faces its direction unless a turn key is held. Shortcut actions ignore modifier chords and text/select editing; T and turning pause in menus, while R can restart from the menu. T/R ignore key repeat. Turning does not change sheet or discoveries. Browser checks verified the terrain cycle, stationary Q/E turning, button controls, and R restoring position. These controls are included with Level 4 and the counter clarifications.

## Current Level 4 and logarithm Level 5

Level 4 is σa sqrt(s−a)+2σb sqrt(b−s), a=−1.5 and b=1.5, with four sheets. Left of a, only σa flips; right of b, only σb flips; between a and b there is no cut. The exact real s-axis uses its upper bank, which becomes the lower bank for sqrt(b−s). CPU and GPU evaluators implement this via conjugation. This supersedes the earlier Level 4 formula documented above.

Level 5 is Log(s)+2πin, with downward negative-axis crossings incrementing n and upward crossings decrementing n. The key is on n=0 and the chest on n=2. Im f is the default terrain, with colour scale ±20. Only visited integer sheets are stored; counters show ∞. CPU labels are JavaScript safe integers; rendering uses float32. Awards extend to 15 and 25 discoveries.

33 tests cover root identities, cuts, independent continuation, logarithm winding, persistence and counting. Both missions were completed in browser Player view during development.

## Level 3★: Mirage — curved cuts

Mirage uses exp(−iφ) sqrt((s−a)(s−b) exp(2iφ)), with φ=π/6 and the same branch points and two-sheeted surface as Maze. Its principal-branch cuts are the negative-real preimage of the rotated polynomial: Im(exp(2iφ)(s−a)(s−b))=0 with Re<0. These form two hyperbolic arcs. `curved-cut.js` supplies exact quadratic segment intersections; sampled curves are used only for drawing. New cut types can implement `intersections(p,q)` and `paths(extent)`; shader support must also be supplied for Player view.

Movement processes all intersections in order and records intermediate sheets, even when two crossings return to the original label. Viewing rays use the corresponding GLSL calculation and never count as discoveries. Mirage has its own two-sheet discoveries and completion state; existing saved level IDs remain compatible. Menu entries now use short names: Discovery, Vortex, Maze, Mirage, Crossroads, Lost.

41 automated tests cover the existing levels plus curved-cut identities, continuity, endpoint banks, tangencies, double crossings, independent numerical continuation, monodromy and saved discoveries.

## Level 6: Threshold — Chew–Mandelstam

Threshold uses ΣI(s)+2inρp(s), with ρp=√(1−1/s), m=1/2, threshold 4m²=1, and n any integer. The right-hand cut shifts n downward by +1 and upward by −1; the interval (0,1) reflects n→−n. On n=0, the finite cut is invisible, causes no counted transition, and the origin is passable. Off that sheet, the origin becomes an obstacle. Movement validates each segment on its transported label before committing the move; Player-view branch markers likewise use the label transported along their viewing ray.

The float64 evaluator and GLSL share the same conventions. Near zero, the physical value uses the convergent inverse-ρ² series, with limit −2/π, avoiding cancellation and the removable singularity. Away from zero, the log ratio is computed as −1/[s(ρ+1)²] for stability. GPU rendering caps the excluded off-sheet origin within 1e−5; gameplay remains float64. Integer discoveries now persist generically for any infinite-sheet level, retaining existing saves and award milestones.

Mission: start at −2−2i on n=0, reach the key at 2+2i by going left of threshold, then cross the right-hand cut downward to open the chest at 2−2i on n=1. Browser QA completed this in Player view, then crossed (0,1) to reach n=−1: three sheets, two transitions. All 48 tests pass, including independent RK4 integration of f′=f/[2s(s−1)]−1/(πs) around varied closed loops, bank continuity, exact-axis values, series stability, dynamic obstacles and persistence.

Next planned: Level 7, Breit–Wigner with ρ (two sheets); Level 7★, Breit–Wigner with CM (the Level 6 sheet structure). Multichannel resonance amplitudes follow these. They are not yet playable.

## Level 7: First Pole — Breit–Wigner with phase space

Tσ(s)=1/[M²−s−ig²ρσ(s)], with M²=2.5, g²=0.8, threshold 4m²=1. The physical phase space is ρI=i√(1−s)/√s, with principal building-block roots and exact-axis upper-s-bank values. It is positive above threshold on the upper rim and continuous on (0,1). Each exterior cut (−∞,0) and (1,∞) flips σ. There are exactly two sheets, independently counted for awards.

The treasure lies at the lower-half-plane Sheet II pole, s=2.45−0.6304760106459244i, calculated by Newton iteration of the unsquared denominator. The same point is regular on Sheet I. The mission begins at 0.5−2i, passes through the uncut interval to the key at 2+2i, then crosses the right-hand cut to reach the pole. Both branch points remain obstacles; the pole is approachable treasure with a 0.25 collection radius. Generic per-level chest coordinates support later resonance levels. Magnitude is the default terrain; its colour scale runs from 0 to the level's maximum. CPU calculations are unregularized; GLSL clips the visual divergence within denominator magnitude 1e−5 and the excluded origin within |s|<1e−5.

54 tests pass. New checks cover the phase-space square, physical banks, both cut maps, the unsquared pole equation, independent root tracking around each branch point and both, mission completion and two-sheet persistence. Browser QA completed the mission in Player view with two discoveries and one transition. Level 7★ with CM remains the next planned level.

## Level 7★: Echo — Breit–Wigner with CM

Echo evaluates 1/[M²−s−g²Σ̃n(s)], with Σ̃n(s)=Σn(s)−Re ΣI(sth). The subtraction is one real constant shared by all sheets. In the existing CM normalization ΣI(sth)=0, so it is explicitly applied but numerically zero. The Level 7 parameters are retained: M²=2.5, g²=0.8, sth=1. On the physical upper rim above threshold, Im Σ̃I=ρ, so the imaginary denominator matches the rho amplitude. The real dispersive part remains away from threshold; this is not an on-shell subtraction at M².

The cut maps, dynamic origin obstacle and integer labels are shared directly with Level 6. The independently saved Echo discoveries are unbounded. The chest is at the n=1 lower-half-plane pole s≈2.9447195252392−0.754915675216394i, computed with Newton iteration of the unsquared denominator and the analytic CM derivative. At that location the n=0 amplitude is regular. Magnitude terrain defaults to 0–4 with the same visual pole clipping used by Level 7.

All 59 tests pass, covering the subtraction, matching imaginary denominator, cut-bank continuity, shifted pole, dynamic obstacles, mission route, and independent saved progress. Browser QA completed the mission in Player view with two discoveries and one transition; Top view shows the pole and opened chest on n=1. Multichannel resonance levels are next.

## GitHub Pages

Repository: https://github.com/mmikhasenko/riemann-sheet-rpg

Game: https://mmikhasenko.github.io/riemann-sheet-rpg/

Pushes to `main` run the mathematical/gameplay tests, upload only `dist/`, and deploy through GitHub Actions to Pages. Assets use relative paths for project-site hosting. The linked Mikhasenko Group logo is in the top-right corner. Sites hosting remains configured separately; browser progress is stored independently on each origin.

## Exploration defaults and references

Every expedition and restart now begins in Player view with Im f terrain. Keys no longer disclose coordinates and are only drawn within one map unit, subject to the current view and transported sheet; collection still requires the player's own sheet and the existing 0.4 radius. The footer centers Mikhail Mikhasenko's name and a References button. Its accessible modal links to K-matrix day, the 2026 PDG resonance review, and the Scattering Theory encyclopedia entry. Opening it pauses movement and hazards; Escape or the close button restores focus to References. Browser checks confirmed distant/nearby key visibility, defaults, the footer, modal links, and pause behavior. All 59 existing tests pass.
