import test from 'node:test';import assert from 'node:assert/strict';
import {levels,rootSum,sqrt,transport,move,TWO_POINT_A as a,TWO_POINT_B as b} from '../dist/math.js';
import {readProgress,visitSheet,exploredInLevel,TOTAL_SHEETS,saveProgress} from '../dist/progress.js';
const level=levels.find(l=>l.id==='root-sum'),distance=(u,v)=>Math.hypot(u.x-v.x,u.y-v.y);
test('four branches obey the algebraic equation and have four distinct generic values',()=>{
 // (f²-(s-a)-4(b-s))² = 16(s-a)(b-s)
 const mul=(u,v)=>({x:u.x*v.x-u.y*v.y,y:u.x*v.y+u.y*v.x});
 for(const z of [{x:3,y:2},{x:0,y:1},{x:-3,y:-2}]){
 const values=level.labels.map(k=>rootSum(z,k));
 for(let k=0;k<4;k++){
  for(let j=0;j<k;j++)assert.ok(distance(values[k],values[j])>1e-4);
  const f2=mul(values[k],values[k]),q={x:f2.x+3*z.x+a-4*b,y:f2.y+3*z.y};
  const rhs=mul({x:z.x-a,y:z.y},{x:b-z.x,y:-z.y});
  assert.ok(distance(mul(q,q),{x:16*rhs.x,y:16*rhs.y})<1e-9);
 }
 }
});
test('all four sheets are continuous under both cut maps in both directions',()=>{
 for(const x of [-4,-2,0,1,2,4])for(const k of level.labels){
  const upper={x,y:1e-10},lower={x,y:-1e-10},expected=x<a?k^1:x>=b?k^2:k;
  assert.equal(transport(upper,lower,k,level.cuts),expected);
  assert.equal(transport(lower,upper,k,level.cuts),expected);
  assert.ok(distance(rootSum(upper,k),rootSum(lower,expected))<1e-8);
 }
});
test('loops around a, b, or both flip the correct independent signs',()=>{
 for(const [center,radius,mask] of [[a,.7,1],[b,.7,2],[0,3,3]])for(const direction of [-1,1])for(const initial of level.labels){
  let p={x:center+radius,y:0},label=initial;
  let ua=sqrt({x:p.x-a,y:p.y},initial&1?-1:1),ub=sqrt({x:b-p.x,y:p.y},initial&2?-1:1);ub.y=-ub.y;
  for(let i=1;i<=720;i++){
   const theta=direction*i*Math.PI/360,q=i===720?{x:center+radius,y:0}:{x:center+radius*Math.cos(theta),y:radius*Math.sin(theta)};
   label=transport(p,q,label,level.cuts);
   const follow=(prev,z)=>{const plus=sqrt(z),minus={x:-plus.x,y:-plus.y};return distance(prev,plus)<distance(prev,minus)?plus:minus;};
   ua=follow(ua,{x:q.x-a,y:q.y});ub=follow(ub,{x:b-q.x,y:-q.y});
   assert.ok(distance(rootSum(q,label),{x:ua.x+2*ub.x,y:ua.y+2*ub.y})<1e-9);p=q;
  }
  assert.equal(label,initial^mask);
 }
});
test('Level 4 route visits all signs and reaches the chest; both points block movement',()=>{
 const s={x:3,y:-2,label:0},seen=new Set([0]);
 for(const p of [{x:0,y:-2},{x:0,y:2},{x:2,y:2},{x:3,y:2},{x:3,y:-2},{x:-3,y:-2},{x:-3,y:2},{x:3,y:2},{x:3,y:-2},{x:3,y:2},{x:0,y:2},{x:0,y:-2},{x:2,y:-2}]){
  assert.ok(move(s,p,level));seen.add(s.label);
 }
 assert.equal(seen.size,4);assert.equal(s.label,level.chestLabel);
 for(const x of [a,b])assert.equal(move({x,y:1,label:0},{x,y:-1},level),false);
});
test('existing awards persist; Level 4 adds four discoveries and the eleven-sheet award',()=>{
 const p=readProgress(null);for(const l of levels.slice(0,3))for(const k of l.labels)visitSheet(p,l.id,k);
 for(const k of [0,2,1])assert.deepEqual(visitSheet(p,level.id,k),[]);
 assert.equal(visitSheet(p,level.id,3)[0].count,11);
 assert.deepEqual(visitSheet(p,level.id,3),[]);
 assert.equal(exploredInLevel(p,level),4);assert.equal(TOTAL_SHEETS,Infinity);
 let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};p.completed.add(level.id);saveProgress(storage,p);
 const reloaded=readProgress(storage);assert.equal(reloaded.visited.size,11);assert.ok(reloaded.completed.has(level.id));
});
