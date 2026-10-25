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

## Unequal masses and two channels

`dist/unequal-cm.js` uses separate principal roots,
`rho(s) = sqrt(s-a) * sqrt(s-b) / s`, where `a=(m1+m2)^2` and
`b=(m1-m2)^2`. The physical CM function is subtracted at `a` and normalized
by `Im Sigma(s+i0)=rho(s)` above threshold. It is regular at zero and `b`.
Continuation is `Sigma_n=Sigma_I+2in rho`: `(b,a)` reflects `n`, and crossing
`(a,infinity)` downward increments it. Zero is a simple pole for nonzero `n`,
with residue `-2in |m1²-m2²|`, and has no monodromy.

Separation (06★), immediately after Threshold, uses masses `(1.125, 0.375)`.
Confluence (08) uses channel masses `(0.75, 0.25)` and `(1.125, 0.375)`,
`M²=2.9`, and `(g1²,g2²)=(0.35,0.65)`. Each CM function has its own integer
index; the resonance pole is approximately `3.084654473 - 0.724823347i` on
`(1,1)`. The physical line shape has a cusp at the second threshold `2.25`,
before the larger resonance peak. The CM origin poles generally become a
regular amplitude zero; they are not punctures in Confluence.

Tests compare the unequal-mass formula with an independent subtracted
dispersion integral and differential-equation continuation, check all cut
banks, pole residues, channel-specific singularities, and objective reachability.
The threshold-subtracted expression follows the
[PDG Resonances review, §50.3.3](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-resonances.pdf),
rescaled to the game's phase-space normalization.
