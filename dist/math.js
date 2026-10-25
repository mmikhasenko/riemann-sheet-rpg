import {unequalCM} from './unequal-cm.js';
import {CHANNELS,twoChannelBW,TWO_CHANNEL_POLE,sheetPair,channelMap,validPair} from './two-channel-cm.js';
import {breitWignerCM, BW_CM_POLE} from './breit-wigner-cm.js';
import {breitWigner, BW_POLE} from './breit-wigner.js';
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
    note:'log(s;n) = Log(s) + 2πin. Cross the negative real axis downward to add 1, upward to subtract 1. Keep exploring in either direction. Use the objective sheet labels and coordinates to navigate.',
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
 note:'ΣⅠ = (ρₚ/π) Log((ρₚ−1)/(ρₚ+1)), ρₚ = √(1−1/s). Beyond threshold s = 1, crossing downward adds 1 and upward subtracts 1. Between 0 and 1, crossing sends n to −n. This cut and the obstacle at zero disappear on n = 0. Use the objective sheet labels and coordinates to navigate.',
 cutLabel:'shift n ± 1 · reflect n ↦ −n',labelName:n=>n===0?'I (n = 0)':n===1?'II (n = 1)':`n = ${n}`,
 magnitudeNote:'Chew–Mandelstam magnitudes differ between sheets. Im f reveals the physical threshold and continued branches.',
});

levels.push({
 ...levels.find(l=>l.id==='cm'),
 id:'cm-unequal',number:'06★',shader:9,title:'Separation',
 evaluate:unequalCM.evaluate,
 worlds:'A threshold splits.',menuNote:'unequal masses · a hidden pole and pseudothreshold',
 cuts:[
  {a:{x:unequalCM.b,y:0},b:{x:unequalCM.a,y:0},map:n=>n===0?0:-n,active:n=>n!==0,caption:'n ↦ −n'},
  {a:{x:unequalCM.a,y:0},b:{x:1e6,y:0},map:(n,d)=>n-d,caption:'↓ n+1 · ↑ n−1'},
 ],
 branchPoints:[
  {x:0,y:0,radius:.12,name:'0 · POLE',kind:'pole',active:n=>n!==0},
  {x:unequalCM.b,y:0,radius:.12,name:'b = 0.5625',labelOffset:16,active:n=>n!==0},
  {x:unequalCM.a,y:0,radius:.18,name:'a = 2.25'},
 ],
 subtitle:'Unequal-mass CM · m₁ = 1.125 · m₂ = 0.375 · A hidden branch point separates from zero.',
 note:'ρₚ = √(s−a) √(s−b) / s, with a = 2.25 and b = 0.5625. The separate principal roots make a finite cut (b,a). ΣⅠ is regular at b and zero. On n ≠ 0, b becomes a branch point and zero a simple pole. Circling zero alone never changes sheets. Cross the right cut to shift n; cross (b,a) to reflect n.',
});

levels.push({
 id:'breit-wigner',number:'07',shader:7,initialLabel:1,chestLabel:-1,labels:[1,-1],
 title:'First Pole',formula:'1 / (M² − s − ig²ρ(s))',worlds:'A hidden resonance.',sheets:'TWO SHEETS',
 evaluate:breitWigner,defaultScalar:2,terrainRange:4,start:{x:.5,y:-2},chest:BW_POLE,chestRadius:.25,
 cuts:[{a:{x:-1e6,y:0},b:{x:0,y:0},map:n=>-n,caption:'σ ↦ −σ'},
       {a:{x:1,y:0},b:{x:1e6,y:0},map:n=>-n,caption:'σ ↦ −σ'}],
 branchPoints:[{x:0,y:0,radius:.24,name:'0'},{x:1,y:0,radius:.24,name:'4m² = 1'}],
 subtitle:'Breit–Wigner · M² = 2.5 · g² = 0.8 · 4m² = 1 · Find the pole on Sheet II.',
 note:'The physical phase space is ρⅠ(s) = i√(1−s)/√s, positive just above threshold. Each exterior cut flips its sign; the interval (0,1) is continuous. Circle either branch point to change sheets, or both to return. Find the key on Sheet II, then approach the resonance pole on that sheet to open its treasure.',
 cutLabel:'σ ↦ −σ · resonance pole on II',labelName:n=>n===1?'I':'II',
 magnitudeNote:'The amplitude magnitude differs between sheets. Its peak reveals the resonance pole on Sheet II.',
});

levels.push({
 ...levels.find(level=>level.id==='cm'),
 id:'breit-wigner-cm',number:'07★',shader:8,title:'Echo',
 formula:'1 / (M² − s − g²Σ̃ₙ(s))',worlds:'A resonance, continued.',
 evaluate:breitWignerCM,defaultScalar:2,terrainRange:4,start:{x:.5,y:-2},chest:BW_CM_POLE,chestRadius:.25,
 subtitle:'Breit–Wigner with CM · M² = 2.5 · g² = 0.8 · 4m² = 1 · Subtracted at threshold.',
 note:'Σ̃ₙ(s) = Σₙ(s) − Re ΣⅠ(1). The subtraction is zero in this CM convention. Above threshold Im Σ̃Ⅰ = ρ, as in Level 7; the real part shifts the pole. The cuts and integer sheets are those of Threshold: shift n on the right cut, reflect n on (0,1). Zero is regular on n = 0. Find the key on n = −1, then the pole treasure on n = 1.',
 cutLabel:'CM sheet maps · resonance pole on n = 1',
 magnitudeNote:'The magnitude reveals the CM resonance pole. Its position differs from Level 7 because the real part of CM remains away from threshold.',
});

levels.push({
 id:'two-channel-cm',number:'08',shader:10,title:'Confluence',
 initialLabel:'0,0',chestLabel:'-2,1',labels:null,validLabel:validPair,
 formula:'1 / (M² − s − g₁²Σ₁ − g₂²Σ₂)',worlds:'Two channels meet.',sheets:'INFINITELY MANY SHEET PAIRS',
 evaluate:twoChannelBW,defaultScalar:2,terrainRange:3,start:{x:-2,y:-2},chest:TWO_CHANNEL_POLE,chestRadius:.25,
 cuts:CHANNELS.flatMap((c,i)=>[
  {a:{x:c.b,y:0},b:{x:c.a,y:0},map:label=>channelMap(label,i,n=>n===0?0:-n),active:label=>sheetPair(label)[i]!==0,caption:`reflect n${i+1}`,captionOffset:i*14},
  {a:{x:c.a,y:0},b:{x:1e6,y:0},map:(label,d)=>channelMap(label,i,n=>n-d),caption:`shift n${i+1}`,captionOffset:i*14},
 ]),
 branchPoints:CHANNELS.flatMap((c,i)=>[
  {x:c.b,y:0,radius:.10,name:`b${i+1} = ${c.b}`,labelOffset:i*16,active:label=>sheetPair(label)[i]!==0},
  {x:c.a,y:0,radius:.15,name:`a${i+1} = ${c.a}`,labelOffset:i===0?32:0},
 ]),
 subtitle:'Two unequal-mass channels · thresholds 1 and 2.25 · M² = 2.9 · g₁² = 0.35 · g₂² = 0.65.',
 note:'Each channel has its own CM index (n₁,n₂). Crossing above both thresholds shifts both indices; between thresholds only channel 1 shifts, while channel 2 can reflect. Each pseudothreshold is hidden when its own index is zero. The physical |f| has a cusp at 2.25 before the resonance peak. Find the key on (3,4), then the chest on (−2,1). Combine threshold crossings and pseudothreshold loops to reach both sheet pairs. The CM poles at zero generally become an amplitude zero, not a pole.',
 cutLabel:'independent CM indices (n₁,n₂)',labelName:label=>`(${sheetPair(label).join(', ')})`,
 magnitudeNote:'On (0,0), |f| shows the second-threshold cusp at s = 2.25 on the rise toward the resonance. The resonance pole is on (1,1); the chest is on (−2,1).',
});

// Objective coordinates are explicit navigation clues, inside the infinity hazard.
// Two-sheet levels necessarily put both objectives on the same non-starting sheet.
const objectiveLocations={
 'sqrt':{key:{x:-3.5,y:-3},keyLabel:-1,chest:{x:3.5,y:3}},
 'cube':{key:{x:-4,y:2.5},keyLabel:1,chest:{x:3.5,y:-3}},
 'two-point':{key:{x:3.5,y:-3},keyLabel:-1,chest:{x:-3.5,y:3}},
 'rotated-root':{key:{x:3.5,y:3},keyLabel:-1,chest:{x:-3.5,y:-3}},
 'root-sum':{key:{x:-3.5,y:3},keyLabel:1,chest:{x:3.5,y:-3}},
 'log':{key:{x:-3.5,y:-3},keyLabel:1,chest:{x:3.5,y:3}},
 'cm-unequal':{key:{x:-3.5,y:3},keyLabel:-1,chest:{x:3.5,y:-3}},
 'two-channel-cm':{key:{x:-3.5,y:3},keyLabel:'3,4'},
 'cm':{key:{x:-3.5,y:3},keyLabel:-1,chest:{x:3.5,y:-3}},
 'breit-wigner':{key:{x:-3.5,y:3},keyLabel:-1},
 'breit-wigner-cm':{key:{x:-3.5,y:3},keyLabel:-1},
};
for(const level of levels){
 level.chestIsPole=['breit-wigner','breit-wigner-cm'].includes(level.id);
 Object.assign(level,objectiveLocations[level.id]);
}
