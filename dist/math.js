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
export function move(state, next) {
  if (level.branchPoints.some(p => segmentDistance(state,next,p) < p.radius)) return false;
  state.label=transport(state,next,state.label);state.x=next.x;state.y=next.y;return true;
}
