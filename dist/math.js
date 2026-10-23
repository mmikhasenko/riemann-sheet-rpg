// All CPU arithmetic uses JavaScript float64 numbers.
export function sqrt(z, label = 1) {
  const r = Math.hypot(z.x, z.y);
  const re = z.x >= 0 ? Math.sqrt((r + z.x) / 2) : Math.abs(z.y) / Math.sqrt(2 * (r - z.x));
  const im = z.x >= 0 ? (re ? z.y / (2 * re) : 0) : (z.y < 0 ? -1 : 1) * Math.sqrt((r - z.x) / 2);
  return { x: label * re, y: label * im };
}
export const level = {
  evaluate: sqrt,
  cuts: [{ a: { x: -1e6, y: 0 }, b: { x: 0, y: 0 }, map: label => -label }],
  branchPoints: [{ x: 0, y: 0, radius: .24 }],
};
export function crossing(a, b, cut) {
  // Half-open convention: y=0 belongs to the upper bank. Touch/return cannot double count.
  if ((a.y < 0) === (b.y < 0)) return null;
  const t = -a.y / (b.y - a.y), x = a.x + t * (b.x - a.x);
  return x >= cut.a.x && x < cut.b.x ? { t, direction: b.y < a.y ? -1 : 1 } : null;
}
export function transport(a, b, label, cuts = level.cuts) {
  const hits = cuts.map(cut => ({ cut, hit: crossing(a, b, cut) })).filter(v => v.hit).sort((a,b) => a.hit.t-b.hit.t);
  for (const {cut,hit} of hits) label = cut.map(label, hit.direction);
  return label;
}
export function segmentDistance(a, b, p) {
  const dx=b.x-a.x,dy=b.y-a.y, d=dx*dx+dy*dy;
  const t=d ? Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)) : 0;
  return Math.hypot(a.x+t*dx-p.x,a.y+t*dy-p.y);
}
export function move(state, next, activeLevel = level) {
  if (activeLevel.branchPoints.some(p => segmentDistance(state,next,p) < p.radius)) return false;
  state.label=transport(state,next,state.label,activeLevel.cuts);state.x=next.x;state.y=next.y;return true;
}

export function cubeRoot(z, label = 0) {
  const radius = Math.cbrt(Math.hypot(z.x, z.y));
  // Match the upper-bank convention even for negative signed zero.
  const angle = (Math.atan2(z.y === 0 ? 0 : z.y, z.x) + 2 * Math.PI * label) / 3;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}
export const levels = [
  {
    ...level, id: 'sqrt', number: '01', shader: 0, initialLabel: 1, chestLabel: -1,
    title: 'The other side', formula: '√s', worlds: 'Two worlds.', sheets: 'TWO SHEETS',
    subtitle: 'Follow the square root beyond its principal branch.',
    note: 'A full turn around zero changes the sign. Two turns bring you home.',
    cutLabel: 'σ ↦ −σ', labelName: label => label === 1 ? 'I' : 'II',
  },
  {
    id: 'cube', number: '02', shader: 1, initialLabel: 0, chestLabel: 2,
    evaluate: cubeRoot,
    cuts: [{ a: { x: -1e6, y: 0 }, b: { x: 0, y: 0 }, map: (label, direction) => (label - direction + 3) % 3 }],
    branchPoints: [{ x: 0, y: 0, radius: .24 }],
    title: 'The third world', formula: '∛s', worlds: 'Three worlds.', sheets: 'THREE SHEETS',
    subtitle: 'Discover the three branches of the cube root.',
    note: 'Downward crossings add 1 modulo 3; upward crossings subtract 1. Three turns bring you home.',
    cutLabel: 'k ↦ k ± 1 (mod 3)', labelName: label => ['I (k = 0)', 'II (k = 1)', 'III (k = 2)'][label],
  },
];
