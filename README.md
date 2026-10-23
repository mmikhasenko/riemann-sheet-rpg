# Riemann Sheet RPG

A browser exploration game on the complex plane: cross branch cuts, discover Riemann sheets, and find keys and treasure on other sheets. Includes square roots, logarithms, Chew–Mandelstam functions, and resonance amplitudes.

**[Play](https://mmikhasenko.github.io/riemann-sheet-rpg/)** · [Release notes](NEWS.md) · [MIT license](LICENSE)

## How it was made

Concept and mathematical direction: **Mikhail Mikhasenko**. Implementation: **GPT-6 Astra**, developed interactively in Codex.

Built with HTML, CSS, and vanilla JavaScript ES modules. Gameplay and analytic continuation use float64 arithmetic and per-cut sheet-label maps; WebGL2/GLSL renders the terrain and continued viewing rays. Progress is stored in browser localStorage. Node.js tests check identities, cut continuity, continuation, objectives, and saved progress. GitHub Actions tests and deploys the static `dist/` folder to GitHub Pages; no backend or build step is required.

## Run locally

With Node.js and Python 3 installed:

```sh
npm test
npm start
```

Open http://localhost:4173/. The first-visit quick tour explains the controls and objectives; replay it from the header. References are available there too.
