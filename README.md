# Analytic Continuation RPG

Playable Level 1 prototype: square root, two sheets, negative-real-axis cut.

Run `npm start`, then open http://localhost:4173. Run `npm test` for the float64 mathematics checks. No installation or build step is needed.

WASD / arrows move; holding or dragging on the map also moves toward the pointer. Collect the key at 2+2i on Sheet I, circle the origin across the cut, and open the chest at 2−2i on Sheet II. Crossing |s|=5.5 causes outward drift and HP loss. Restart resets the expedition.

Top, night, and player-cone views offer Re f, Im f, and magnitude terrain. CPU labels and gameplay use float64; WebGL2 terrain uses float32. Player rays apply the same crossing convention as movement. The exact cut belongs to the upper bank. The origin is protected by a finite obstacle disk, including segment collision checks to prevent tunneling.

The prototype is buildless JavaScript with ES modules, not yet TypeScript. Only Level 1 is implemented. The cut intersection routine currently supports horizontal cuts; general segments and other label types belong to the next engine iteration. The player view is a 2D colour/contour graph, not a 3D mesh. Gameplay is session-local and has no persistence. External Google Fonts are cosmetic; system fallbacks work without them.

Before Level 9, resolve the branch convention: principal sqrt(s−threshold)/sqrt(s) has an interior cut. The intended exterior cuts can instead be represented by i*sqrt(threshold−s)/sqrt(s), with a specified boundary convention. No resonance physics is implemented here.

Validation: square-root identities, both-bank continuity, randomized closed-loop comparison against an independent nearest-root tracker, cut endpoint conventions, branch-point collision, and a mission route. Browser QA completed the full mission and checked night/player modes.
