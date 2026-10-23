import test from 'node:test';import assert from 'node:assert/strict';
import {CM_SUBTRACTION,subtractedCM,bwCMDenominator,breitWignerCM,BW_CM_POLE} from '../dist/breit-wigner-cm.js';
import {bwDenominator,BW_POLE} from '../dist/breit-wigner.js';
import {levels,transport,advance} from '../dist/math.js';
import {readProgress,saveProgress,visitSheet,exploredInLevel} from '../dist/progress.js';
const level=levels.find(l=>l.id==='breit-wigner-cm'),cm=levels.find(l=>l.id==='cm');
const norm=z=>Math.hypot(z.x,z.y),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function close(a,b,tol=1e-8){assert.ok(distance(a,b)<tol,`${JSON.stringify(a)} != ${JSON.stringify(b)}`);}
test('CM resonance threshold subtraction is real and matches rho width above threshold',()=>{
 assert.equal(CM_SUBTRACTION,0);close(subtractedCM({x:1,y:0}),{x:0,y:0});
 close(bwCMDenominator({x:1,y:0}),bwDenominator({x:1,y:0}));
 for(const x of [1.001,1.1,2,2.5,4,10]){
  const z={x,y:0},a=bwCMDenominator(z),b=bwDenominator(z),sigma=subtractedCM(z);
  assert.ok(Math.abs(a.y-b.y)<1e-12);
  assert.ok(Math.abs(a.x-b.x+.8*sigma.x)<1e-12);
 }
 close(breitWignerCM({x:0,y:0}),{x:1/(2.5+1.6/Math.PI),y:0});
});
test('CM resonance inherits all CM cut maps and preserves continuity on every tested sheet',()=>{
 assert.equal(level.cuts,cm.cuts);assert.equal(level.branchPoints,cm.branchPoints);
 for(const n of [-20,-3,-1,0,1,3,20])for(const x of [-2,.2,.5,.8,1.2,2,4]){
  const a={x,y:1e-10},b={x,y:-1e-10},axis={x,y:0},label=transport(a,b,n,level.cuts);
  close(breitWignerCM(a,n),breitWignerCM(axis,n));
  close(breitWignerCM(a,n),breitWignerCM(b,label));
 }
});
test('CM resonance pole belongs to n=1 and shifts from the rho resonance',()=>{
 assert.ok(BW_CM_POLE.y<0);assert.ok(norm(bwCMDenominator(BW_CM_POLE,1))<1e-12);
 assert.ok(norm(bwCMDenominator(BW_CM_POLE,0))>1);
 assert.ok(distance(BW_POLE,BW_CM_POLE)>.4);
 assert.ok(norm(breitWignerCM({x:BW_CM_POLE.x+1e-5,y:BW_CM_POLE.y},1))>1e4);
 assert.ok(norm(breitWignerCM(BW_CM_POLE,0))<1);
});
test('CM resonance mission and origin obstacles use transported integer sheets',()=>{
 const state={...level.start,label:0};
 for(const p of [{x:.5,y:2},{x:2,y:2}])assert.deepEqual(advance(state,p,level).labels,[]);
 assert.deepEqual(advance(state,BW_CM_POLE,level).labels,[1]);
 assert.equal(state.label,level.chestLabel);
 assert.ok(advance({x:-.5,y:0,label:0},{x:.5,y:0},level));
 assert.equal(advance({x:-.5,y:0,label:1},{x:.5,y:0},level),null);
 const reflected={x:.5,y:1,label:1};assert.deepEqual(advance(reflected,{x:.5,y:-1},level).labels,[-1]);
});
test('CM resonance discoveries are unbounded and separate from Threshold and First Pole',()=>{
 const progress=readProgress(null);for(let n=-30;n<=30;n++)visitSheet(progress,level.id,n);
 visitSheet(progress,'cm',1);visitSheet(progress,'breit-wigner',1);
 assert.equal(exploredInLevel(progress,level),61);assert.equal(progress.visited.size,63);
 progress.completed.add(level.id);let saved;
 const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};saveProgress(storage,progress);assert.deepEqual(readProgress(storage),progress);
});
