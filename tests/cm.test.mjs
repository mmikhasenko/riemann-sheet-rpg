import test from 'node:test';
import assert from 'node:assert/strict';
import {chewMandelstam as cm} from '../dist/chew-mandelstam.js';
import {multiply,divide} from '../dist/complex.js';
import {levels,transport,advance,activeOnSheet} from '../dist/math.js';
import {readProgress,saveProgress,visitSheet,exploredInLevel} from '../dist/progress.js';
const level=levels.find(l=>l.id==='cm'),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const close=(a,b,tolerance=1e-8)=>assert.ok(distance(a,b)<tolerance,`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
test('CM physical values and removable origin agree with known real-axis limits',()=>{
 close(cm({x:0,y:0}),{x:-2/Math.PI,y:0},1e-15);
 close(cm({x:1,y:0}),{x:0,y:0},1e-15);
 close(cm({x:.5,y:0}),{x:-.5,y:0},1e-14);
 for(const x of [1.01,2,10,1e8]){
  const rho=Math.sqrt(1-1/x),f=cm({x,y:0});
  assert.ok(Math.abs(f.y-rho)<1e-12);
 }
 for(const x of [-4,-.04,-1e-10,.039,.5,.99])assert.ok(Math.abs(cm({x,y:0}).y)<1e-12);
 for(const angle of [0,.4,2,4,5.8]){
  const z={x:1e-12*Math.cos(angle),y:1e-12*Math.sin(angle)};
  close(cm(z),{x:-2/Math.PI+2*z.x/(3*Math.PI),y:2*z.y/(3*Math.PI)},1e-15);
 }
 for(const angle of [.2,1,3,5]){
  const z=r=>({x:r*Math.cos(angle),y:r*Math.sin(angle)});
  close(cm(z(.04-1e-10)),cm(z(.04+1e-10)),1e-9);
 }
});
test('CM cut banks match for positive, negative and large labels; axis uses upper bank',()=>{
 for(const n of [-1000,-3,-1,0,1,3,1000])for(const x of [-2,.2,.5,.8,1.2,2,4]){
  const above={x,y:1e-12},axis={x,y:0},below={x,y:-1e-12};
  const expected=x<0?n:x<1?(-n||0):n+1;
  assert.equal(transport(above,below,n,level.cuts),expected);
  assert.equal(transport(below,above,expected,level.cuts),n);
  assert.equal(transport(above,axis,n,level.cuts),n);
  close(cm(above,n),cm(axis,n),1e-7);
  close(cm(above,n),cm(below,expected),1e-7);
 }
});
test('CM origin and finite cut exist only off the physical sheet; blocked moves are atomic',()=>{
 for(const n of [-2,0,2]){
  assert.equal(activeOnSheet(level.cuts[0],n),n!==0);
  assert.equal(activeOnSheet(level.branchPoints[0],n),n!==0);
  const state={x:-.5,y:0,label:n},before={...state};
  const result=advance(state,{x:.5,y:0},level);
  if(n===0){assert.deepEqual(result.labels,[]);assert.equal(state.x,.5);}
  else {assert.equal(result,null);assert.deepEqual(state,before);}
 }
 // Cross the right cut first, then approach the newly active origin.
 const state={x:2,y:.1,label:0},before={...state};
 assert.equal(advance(state,{x:0,y:-.05},level),null);assert.deepEqual(state,before);
 // The always-active threshold cannot be tunneled through even on n=0.
 assert.equal(advance({x:.5,y:0,label:0},{x:1.5,y:0},level),null);
});
test('CM reflection counts real sheet changes, not a no-op crossing on n=0',()=>{
 for(const n of [0,1,-3]){
  const state={x:.5,y:1,label:n},result=advance(state,{x:.5,y:-1},level);
  assert.deepEqual(result.labels,n===0?[]:[-n]);assert.equal(state.label,-n||0);
 }
});
// Independent continuation by integrating f' = f/[2s(s-1)] - 1/(πs).
// This does not evaluate principal branches or consult cut tables along the path.
const add=(a,b,scale=1)=>({x:a.x+scale*b.x,y:a.y+scale*b.y});
function derivative(z,f){
 const den=multiply(z,{x:z.x-1,y:z.y}),a=divide(f,{x:2*den.x,y:2*den.y}),b=divide({x:1/Math.PI,y:0},z);
 return add(a,b,-1);
}
function rk4(z,q,f){
 const d={x:q.x-z.x,y:q.y-z.y},mid=add(z,d,.5);
 const k1=multiply(derivative(z,f),d),k2=multiply(derivative(mid,add(f,k1,.5)),d),k3=multiply(derivative(mid,add(f,k2,.5)),d),k4=multiply(derivative(q,add(f,k3)),d);
 return {x:f.x+(k1.x+2*k2.x+2*k3.x+k4.x)/6,y:f.y+(k1.y+2*k2.y+2*k3.y+k4.y)/6};
}
test('CM cut continuation agrees with independent ODE tracking on varied closed loops',()=>{
 let seed=793;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(let run=0;run<24;run++){
  const center=[0,1,.5][run%3],radius=run%3===2?1.3+.4*rnd():.3+.1*rnd(),phase=.3+5*rnd(),direction=run%2?1:-1;
  const start={x:center+radius*Math.cos(phase),y:radius*Math.sin(phase)};
  let z=start,n=run%5-2,value=cm(start,n);
  for(let step=1;step<=1000;step++){
   const angle=phase+direction*2*Math.PI*step/1000,q=step===1000?start:{x:center+radius*Math.cos(angle),y:radius*Math.sin(angle)};
   value=rk4(z,q,value);n=transport(z,q,n,level.cuts);z=q;
   if(step%100===0)close(cm(z,n),value,2e-8);
  }
 }
});
test('Threshold mission reaches the key on n=0 and the chest on n=1',()=>{
 const state={...level.start,label:0};let changes=0;
 for(const point of [{x:-2,y:2},{x:2,y:2}])changes+=advance(state,point,level).labels.length;
 assert.equal(state.label,0);assert.equal(changes,0);
 changes+=advance(state,{x:2,y:-2},level).labels.length;
 assert.equal(state.label,1);assert.equal(changes,1);
});
test('CM integer discoveries persist independently of log and retain existing awards',()=>{
 const progress=readProgress(null);visitSheet(progress,'log',0);
 for(let n=-30;n<=30;n++)visitSheet(progress,'cm',n);
 assert.equal(exploredInLevel(progress,level),61);assert.equal(progress.visited.size,62);
 assert.deepEqual(visitSheet(progress,'cm',1),[]);
 let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};saveProgress(storage,progress);
 assert.deepEqual(readProgress(storage).visited,progress.visited);
 saved=JSON.stringify({visited:['cm:01','cm:-0','cm:1.5','cm:NaN','cm:9007199254740992','cm:-10000','log:4','unknown:3']});
 assert.deepEqual([...readProgress(storage).visited],['cm:-10000','log:4']);
});
