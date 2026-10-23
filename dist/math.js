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
export const TWO_POINT_A = -1.5;
export const TWO_POINT_B = 1.5;
// Product of principal roots: their jumps cancel to the left of a.
// The remaining cut is [a,b]; do not substitute principal sqrt((s-a)(s-b)).
export function twoPointRoot(z, label = 1) {
  const u = sqrt({ x: z.x - TWO_POINT_A, y: z.y });
  const v = sqrt({ x: z.x - TWO_POINT_B, y: z.y });
  return { x: label * (u.x * v.x - u.y * v.y), y: label * (u.x * v.y + u.y * v.x) };
}
// Bits encode independent signs: bit 0 negates sqrt(s-a), bit 1 negates sqrt(s-b).
export function rootSum(z, label = 0) {
  const u=sqrt({x:z.x-TWO_POINT_A,y:z.y},label & 1 ? -1 : 1);
  const v=sqrt({x:z.x-TWO_POINT_B,y:z.y},label & 2 ? -1 : 1);
  return {x:u.x+2*v.x,y:u.y+2*v.y};
}
export const levels = [
  {
    ...level, labels: [1,-1], menuNote: 'two turns to return', id: 'sqrt', number: '01', shader: 0, initialLabel: 1, chestLabel: -1,
    title: 'The other side', formula: '√s', worlds: 'Two worlds.', sheets: 'TWO SHEETS',
    subtitle: 'Follow the square root beyond its principal branch.',
    note: 'A full turn around zero changes the sign. Two turns bring you home.',
    cutLabel: 'σ ↦ −σ', labelName: label => label === 1 ? 'I' : 'II',
  },
  {
    labels: [0,1,2], menuNote: 'three turns to return', id: 'cube', number: '02', shader: 1, initialLabel: 0, chestLabel: 2,
    evaluate: cubeRoot,
    cuts: [{ a: { x: -1e6, y: 0 }, b: { x: 0, y: 0 }, map: (label, direction) => (label - direction + 3) % 3 }],
    branchPoints: [{ x: 0, y: 0, radius: .24 }],
    title: 'The third world', formula: '∛s', worlds: 'Three worlds.', sheets: 'THREE SHEETS',
    subtitle: 'Discover the three branches of the cube root.',
    note: 'Downward crossings add 1 modulo 3; upward crossings subtract 1. Three turns bring you home.',
    cutLabel: 'k ↦ k ± 1 (mod 3)', labelName: label => ['I (k = 0)', 'II (k = 1)', 'III (k = 2)'][label],
  },
  {
    id: 'two-point', number: '03', shader: 2, initialLabel: 1, chestLabel: -1,
    labels: [1,-1], menuNote: 'circle one point to change sheets',
    evaluate: twoPointRoot,
    cuts: [{ a: { x: TWO_POINT_A, y: 0 }, b: { x: TWO_POINT_B, y: 0 }, map: label => -label }],
    branchPoints: [
      { x: TWO_POINT_A, y: 0, radius: .24, name: 'a = −1.5' },
      { x: TWO_POINT_B, y: 0, radius: .24, name: 'b = 1.5' },
    ],
    title: 'Between two points', formula: '√((s−a)(s−b))', worlds: 'Two branch points.', sheets: 'TWO SHEETS',
    subtitle: 'a = −1.5 · b = 1.5 · A finite cut connects two branch points.',
    note: 'Circle either branch point to change sheets. Circle both and return to the same sheet. Cross the segment between a = −1.5 and b = 1.5 to find the chest.',
    cutLabel: 'σ ↦ −σ', labelName: label => label === 1 ? 'I' : 'II',
  },
  {
    id: 'root-sum', number: '04', shader: 3, initialLabel: 0, chestLabel: 3,
    labels: [0,1,2,3], menuNote: 'two independent root signs',
    evaluate: rootSum,
    // Disjoint intervals combine coincident cuts: a left crossing flips both roots.
    cuts: [
      { a: {x:-1e6,y:0}, b: {x:TWO_POINT_A,y:0}, map: label=>label^3, caption:'flip both signs' },
      { a: {x:TWO_POINT_A,y:0}, b: {x:TWO_POINT_B,y:0}, map: label=>label^2, caption:'flip σb' },
    ],
    branchPoints: [
      {x:TWO_POINT_A,y:0,radius:.24,name:'a = −1.5'},
      {x:TWO_POINT_B,y:0,radius:.24,name:'b = 1.5'},
    ],
    title:'Independent roots', formula:'√(s−a) + 2√(s−b)', worlds:'Four sheets.', sheets:'FOUR SHEETS',
    subtitle:'a = −1.5 · b = 1.5 · Each root carries its own sign.',
    note:'Sheets are (σa, σb). Circle a to flip σa; circle b to flip σb. Left of a, crossing flips both. Find the chest on (−,−).',
    cutLabel:'independent sign flips', labelName:label=>['I (+,+)','II (−,+)','III (+,−)','IV (−,−)'][label],
  },
];
