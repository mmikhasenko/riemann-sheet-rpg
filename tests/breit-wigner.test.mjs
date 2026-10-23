import test from 'node:test';import assert from 'node:assert/strict';
import {physicalRho,breitWigner,bwDenominator,BW_POLE} from '../dist/breit-wigner.js';
import {sqrt,multiply,divide} from '../dist/complex.js';
import {levels,transport,advance} from '../dist/math.js';
import {readProgress,visitSheet,saveProgress,exploredInLevel} from '../dist/progress.js';
const level=levels.find(l=>l.id==='breit-wigner'),norm=z=>Math.hypot(z.x,z.y),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function close(a,b,tol=1e-8){assert.ok(distance(a,b)<tol,`${JSON.stringify(a)} != ${JSON.stringify(b)}`);}
test('BW physical rho has the required square and correct physical banks',()=>{
 for(const x of [-4,-.5,.5,1,2,4])for(const y of [-2,-.01,0,.01,2])for(const sign of [-1,1]){
  const z={x,y},rho=physicalRho(z,sign),inv=divide({x:1,y:0},z);
  close(multiply(rho,rho),{x:1-inv.x,y:-inv.y});
  close(multiply(breitWigner(z,sign),bwDenominator(z,sign)),{x:1,y:0});
 }
 close(physicalRho({x:2,y:0}),{x:Math.SQRT1_2,y:0});
 close(physicalRho({x:.5,y:0}),{x:0,y:1});
 close(physicalRho({x:2,y:-1e-10}),{x:-Math.SQRT1_2,y:0});
});
test('BW both exterior cuts are continuous under sign flips; middle is uncut',()=>{
 for(const x of [-4,-.5,.3,.7,1.3,3])for(const sign of [-1,1]){
  const a={x,y:1e-10},b={x,y:-1e-10},axis={x,y:0},expected=x<0||x>=1?-sign:sign;
  assert.equal(transport(a,b,sign,level.cuts),expected);
  assert.equal(transport(b,a,expected,level.cuts),sign);
  assert.equal(transport(a,axis,sign,level.cuts),sign);
  close(breitWigner(a,sign),breitWigner(axis,sign));
  close(breitWigner(a,sign),breitWigner(b,expected));
 }
});
test('BW resonance pole solves the unsquared Sheet II equation and is regular on Sheet I',()=>{
 assert.ok(BW_POLE.y<0);assert.ok(norm(bwDenominator(BW_POLE,-1))<1e-12);
 assert.ok(norm(bwDenominator(BW_POLE,1))>1);
 assert.ok(norm(breitWigner(BW_POLE,1))<1);
 const near={x:BW_POLE.x+1e-5,y:BW_POLE.y};assert.ok(norm(breitWigner(near,-1))>1e4);
});
test('BW independent nearest-root tracker agrees around either branch point and both',()=>{
 for(const center of [0,1,.5])for(const direction of [-1,1]){
  const radius=center===.5?2:.4,phase=.3,start={x:center+radius*Math.cos(phase),y:radius*Math.sin(phase)};
  let z=start,label=1,tracked=physicalRho(start);
  for(let i=1;i<=1440;i++){
   const angle=phase+direction*i*2*Math.PI/1440,q=i===1440?start:{x:center+radius*Math.cos(angle),y:radius*Math.sin(angle)};
   const inv=divide({x:1,y:0},q),root=sqrt({x:1-inv.x,y:-inv.y}),minus={x:-root.x,y:-root.y};
   tracked=distance(root,tracked)<distance(minus,tracked)?root:minus;
   label=transport(z,q,label,level.cuts);close(physicalRho(q,label),tracked);
   const d={x:2.5-q.x+.8*tracked.y,y:-q.y-.8*tracked.x};close(breitWigner(q,label),divide({x:1,y:0},d));z=q;
  }
  assert.equal(label,center===.5?1:-1);
 }
});
test('BW mission crosses the middle safely, takes the key on I and reaches the pole on II',()=>{
 const state={...level.start,label:1};
 for(const p of [{x:.5,y:2},{x:2,y:2}])assert.deepEqual(advance(state,p,level).labels,[]);
 assert.equal(state.label,level.initialLabel);
 assert.deepEqual(advance(state,BW_POLE,level).labels,[-1]);assert.equal(state.label,level.chestLabel);
 for(const x of [0,1]){const blocked={x,y:1,label:1},before={...blocked};assert.equal(advance(blocked,{x,y:-1},level),null);assert.deepEqual(blocked,before);}
});
test('BW has exactly two discoveries, persists completion, and rejects extra labels',()=>{
 const progress=readProgress(null);for(const n of [-1,1,-1,1,0,2,7])visitSheet(progress,level.id,n);
 assert.equal(exploredInLevel(progress,level),2);progress.completed.add(level.id);
 let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};saveProgress(storage,progress);
 assert.deepEqual(readProgress(storage),progress);
});
