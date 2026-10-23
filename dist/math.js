import {createQuadraticCut} from './curved-cut.js';
// All CPU arithmetic uses JavaScript float64 numbers.
import {sqrt} from './complex.js';
export {sqrt} from './complex.js';
import {chewMandelstam, CM_THRESHOLD} from './chew-mandelstam.js';
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
export function cutIntersections(a,b,cuts=level.cuts){
  return cuts.flatMap(cut=>{
    const hits=cut.intersections?cut.intersections(a,b):[crossing(a,b,cut)].filter(Boolean);
    return hits.map(hit=>({cut,hit}));
  }).sort((a,b)=>a.hit.t-b.hit.t);
}
export function transport(a,b,label,cuts=level.cuts){
  for(const {cut,hit} of cutIntersections(a,b,cuts))label=cut.map(label,hit.direction);
  return label;
}
export function segmentDistance(a, b, p) {
  const dx=b.x-a.x,dy=b.y-a.y, d=dx*dx+dy*dy;
  const t=d ? Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)) : 0;
  return Math.hypot(a.x+t*dx-p.x,a.y+t*dy-p.y);
}
export const activeOnSheet=(feature,label)=>!feature.active||feature.active(label);
export function advance(state,next,activeLevel=level){
  // Check each portion on its transported sheet; rejected moves are atomic.
  let label=state.label,previous={x:state.x,y:state.y};const labels=[];
  const blocked=end=>activeLevel.branchPoints.some(p=>activeOnSheet(p,label)&&segmentDistance(previous,end,p)<p.radius);
  for(const {cut,hit} of cutIntersections(state,next,activeLevel.cuts)){
    const point={x:state.x+hit.t*(next.x-state.x),y:state.y+hit.t*(next.y-state.y)};
    if(blocked(point))return null;
    const nextLabel=cut.map(label,hit.direction);
    if(nextLabel!==label)labels.push(nextLabel);
    label=nextLabel;previous=point;
  }
  if(blocked(next))return null;
  state.label=label;state.x=next.x;state.y=next.y;return {labels};
}
export function move(state,next,activeLevel=level){return advance(state,next,activeLevel)!==null;}

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
// Bits encode independent signs: bit 0 negates sqrt(s-a), bit 1 negates sqrt(b-s).
export function rootSum(z, label = 0) {
  const u=sqrt({x:z.x-TWO_POINT_A,y:z.y},label & 1 ? -1 : 1);
  const w=sqrt({x:TWO_POINT_B-z.x,y:z.y},label & 2 ? -1 : 1);
  const v={x:w.x,y:-w.y}; // upper s-bank maps to lower bank of b-s
  return {x:u.x+2*v.x,y:u.y+2*v.y};
}
export function logarithm(z, n = 0) {
  return { x: Math.log(Math.hypot(z.x,z.y)), y: Math.atan2(z.y===0?0:z.y,z.x)+2*Math.PI*n };
}
export const ROTATION_PHI=Math.PI/6;
export const rotatedCut=createQuadraticCut(TWO_POINT_A,TWO_POINT_B,ROTATION_PHI);
export function rotatedRoot(z,label=1){
  const w=sqrt(rotatedCut.value(z)),c=Math.cos(ROTATION_PHI),s=Math.sin(ROTATION_PHI);
  return {x:label*(c*w.x+s*w.y),y:label*(c*w.y-s*w.x)};
}
export const levels = [
  {
    ...level, labels: [1,-1], menuNote: 'two turns to return', id: 'sqrt', number: '01', shader: 0, initialLabel: 1, chestLabel: -1,
    title: 'Discovery', formula: '√s', worlds: 'Two worlds.', sheets: 'TWO SHEETS',
    subtitle: 'Follow the square root beyond its principal branch.',
    note: 'A full turn around zero changes the sign. Two turns bring you home.',
    cutLabel: 'σ ↦ −σ', labelName: label => label === 1 ? 'I' : 'II',
  },
  {
    labels: [0,1,2], menuNote: 'three turns to return', id: 'cube', number: '02', shader: 1, initialLabel: 0, chestLabel: 2,
    evaluate: cubeRoot,
    cuts: [{ a: { x: -1e6, y: 0 }, b: { x: 0, y: 0 }, map: (label, direction) => (label - direction + 3) % 3 }],
    branchPoints: [{ x: 0, y: 0, radius: .24 }],
    title: 'Vortex', formula: '∛s', worlds: 'Three worlds.', sheets: 'THREE SHEETS',
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
    title: 'Maze', formula: '√((s−a)(s−b))', worlds: 'Two branch points.', sheets: 'TWO SHEETS',
    subtitle: 'a = −1.5 · b = 1.5 · A finite cut connects two branch points.',
    note: 'Circle either branch point to change sheets. Circle both and return to the same sheet. Cross the segment between a = −1.5 and b = 1.5 to find the chest.',
    cutLabel: 'σ ↦ −σ', labelName: label => label === 1 ? 'I' : 'II',
  },
  {
    id: 'root-sum', number: '04', shader: 3, initialLabel: 0, chestLabel: 3,
    labels: [0,1,2,3], menuNote: 'two independent root signs',
    evaluate: rootSum,
    // Exterior cuts flip the roots independently; (a,b) has no cut.
    cuts: [
      { a: {x:-1e6,y:0}, b: {x:TWO_POINT_A,y:0}, map: label=>label^1, caption:'flip σa' },
      { a: {x:TWO_POINT_B,y:0}, b: {x:1e6,y:0}, map: label=>label^2, caption:'flip σb' },
    ],
    branchPoints: [
      {x:TWO_POINT_A,y:0,radius:.24,name:'a = −1.5'},
      {x:TWO_POINT_B,y:0,radius:.24,name:'b = 1.5'},
    ],
    title:'Crossroads', formula:'√(s−a) + 2√(b−s)', worlds:'Four sheets.', sheets:'FOUR SHEETS',
    subtitle:'a = −1.5 · b = 1.5 · Each root carries its own sign.',
    note:'Sheets are (σa, σb). Circle a to flip σa; circle b to flip σb. The left cut flips σa, the right cut flips σb; between a and b there is no cut. Find the chest on (−,−).',
    cutLabel:'independent sign flips', labelName:label=>['I (+,+)','II (−,+)','III (+,−)','IV (−,−)'][label],
  },
  {
    id:'log', number:'05', shader:4, initialLabel:0, chestLabel:2,
    labels:null, menuNote:'n ∈ ℤ · each turn changes n',
    evaluate:logarithm, defaultScalar:1, terrainRange:20,
    cuts:[{a:{x:-1e6,y:0},b:{x:0,y:0},map:(n,direction)=>n-direction}],
    branchPoints:[{x:0,y:0,radius:.24}],
    title:'Lost',formula:'log s',worlds:'Endless sheets.',sheets:'INFINITELY MANY SHEETS',
    subtitle:'Every turn adds a new branch. There is no final sheet.',
    note:'log(s;n) = Log(s) + 2πin. Cross the negative real axis downward to add 1, upward to subtract 1. Find the key on n = 0 and the chest on n = 2; keep exploring in either direction.',
    cutLabel:'↓ n+1 · ↑ n−1',labelName:n=>`n = ${n}`,
  },
];

levels.splice(3,0,{
 id:'rotated-root',number:'03★',shader:5,initialLabel:1,chestLabel:-1,labels:[1,-1],
 title:'Mirage',formula:'e^(−iφ) √((s−a)(s−b)e^(2iφ))',worlds:'Familiar, yet different.',sheets:'TWO SHEETS',
 menuNote:'Level 3 variant · curved cuts',phi:ROTATION_PHI,evaluate:rotatedRoot,cuts:[rotatedCut],
 branchPoints:[{x:TWO_POINT_A,y:0,radius:.24,name:'a = −1.5'},{x:TWO_POINT_B,y:0,radius:.24,name:'b = 1.5'}],
 subtitle:'Level 3★ · φ = π/6 · Same surface and branch points, different cuts.',
 note:'This is the same two-sheeted surface as Maze. Rotating the argument inside the principal square root bends the cuts into hyperbolic arcs. Crossing an arc flips the label; circling either branch point flips the sheet.',
 cutLabel:'curved cut · σ ↦ −σ',labelName:label=>label===1?'I':'II',
});

levels.push({
 id:'cm',number:'06',shader:6,initialLabel:0,chestLabel:1,labels:null,
 title:'Threshold',formula:'ΣⅠ(s) + 2inρₚ(s)',worlds:'A hidden threshold.',sheets:'INFINITELY MANY SHEETS',
 evaluate:chewMandelstam,defaultScalar:1,terrainRange:4,start:{x:-2,y:-2},
 cuts:[
   {a:{x:0,y:0},b:{x:CM_THRESHOLD,y:0},map:n=>n===0?0:-n,active:n=>n!==0,caption:'n ↦ −n'},
   {a:{x:CM_THRESHOLD,y:0},b:{x:1e6,y:0},map:(n,d)=>n-d,caption:'↓ n+1 · ↑ n−1'},
 ],
 branchPoints:[{x:0,y:0,radius:.24,name:'0',active:n=>n!==0},{x:CM_THRESHOLD,y:0,radius:.24,name:'4m² = 1'}],
 subtitle:'Chew–Mandelstam · m = ½ · The origin is regular on the physical sheet.',
 note:'ΣⅠ = (ρₚ/π) Log((ρₚ−1)/(ρₚ+1)), ρₚ = √(1−1/s). Beyond threshold s = 1, crossing downward adds 1 and upward subtracts 1. Between 0 and 1, crossing sends n to −n. This cut and the obstacle at zero disappear on n = 0. Find the key on n = 0 and the chest on n = 1.',
 cutLabel:'shift n ± 1 · reflect n ↦ −n',labelName:n=>n===0?'I (n = 0)':n===1?'II (n = 1)':`n = ${n}`,
 magnitudeNote:'Chew–Mandelstam magnitudes differ between sheets. Im f reveals the physical threshold and continued branches.',
});
