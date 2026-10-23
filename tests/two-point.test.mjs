import test from 'node:test';
import assert from 'node:assert/strict';
import {levels, sqrt, twoPointRoot, TWO_POINT_A as a, TWO_POINT_B as b, transport, move} from '../dist/math.js';
const level=levels[2],distance=(u,v)=>Math.hypot(u.x-v.x,u.y-v.y);
const polynomial=z=>({x:(z.x-a)*(z.x-b)-z.y*z.y,y:(2*z.x-a-b)*z.y});
test('two-point branches square to (s-a)(s-b), including the imaginary axis',()=>{
 for(const x of [-4,a,-.2,0,.2,b,4])for(const y of [-3,-1e-12,0,1e-12,3])for(const label of [-1,1]){
  const f=twoPointRoot({x,y},label);
  assert.ok(distance({x:f.x*f.x-f.y*f.y,y:2*f.x*f.y},polynomial({x,y}))<1e-12);
 }
});
test('finite cut has matching continued banks in both directions',()=>{
 for(const x of [-1.49,-1,0,1,1.49])for(const label of [-1,1]){
  const upper={x,y:1e-10},lower={x,y:-1e-10};
  assert.equal(transport(upper,lower,label,level.cuts),-label);
  assert.equal(transport(lower,upper,label,level.cuts),-label);
  assert.ok(distance(twoPointRoot(upper,label),twoPointRoot(lower,-label))<1e-8);
 }
});
test('no spurious cuts outside the finite interval or along the imaginary axis',()=>{
 for(const x of [-4,-2,2,4]){
  const upper={x,y:1e-10},lower={x,y:-1e-10};
  assert.equal(transport(upper,lower,1,level.cuts),1);
  assert.ok(distance(twoPointRoot(upper),twoPointRoot(lower))<1e-8);
 }
 for(const y of [-3,-1,1,3])assert.ok(distance(twoPointRoot({x:-1e-10,y}),twoPointRoot({x:1e-10,y}))<1e-8);
});
test('loops around either point flip; loops around both do not; independent value tracking agrees',()=>{
 let seed=23;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(const center of [a,b,0])for(const direction of [-1,1])for(const initial of [-1,1]){
  const baseRadius=center===0?3:.7;
  let p={x:center+baseRadius,y:0},label=initial,tracked=twoPointRoot(p,label);
  for(let i=1;i<=720;i++){
   const theta=direction*2*Math.PI*i/720,r=baseRadius*(.9+.1*random());
   const q=i===720?{x:center+baseRadius,y:0}:{x:center+r*Math.cos(theta),y:r*Math.sin(theta)};
   label=transport(p,q,label,level.cuts);
   // Independent tracker evaluates the principal root of the polynomial,
   // then chooses whichever root is closest to the previous value.
   const plus=sqrt(polynomial(q)),minus={x:-plus.x,y:-plus.y};
   tracked=distance(tracked,plus)<distance(tracked,minus)?plus:minus;
   assert.ok(distance(tracked,twoPointRoot(q,label))<1e-9);p=q;
  }
  assert.equal(label,center===0?initial:-initial);
 }
});
test('both branch obstacles prevent tunneling; the origin is passable',()=>{
 for(const x of [a,b]){
  const s={x,y:1,label:1};assert.equal(move(s,{x,y:-1},level),false);assert.equal(s.y,1);assert.equal(s.label,1);
 }
 const s={x:0,y:1,label:1};assert.ok(move(s,{x:0,y:-1},level));assert.equal(s.label,-1);
});
test('finite-cut touching uses the upper bank and mission reaches the opposite-sheet chest',()=>{
 let label=transport({x:0,y:1},{x:0,y:0},1,level.cuts);assert.equal(label,1);
 label=transport({x:0,y:0},{x:0,y:-1},label,level.cuts);assert.equal(label,-1);
 const s={x:3,y:-2,label:1};for(const p of [{x:3,y:2},{x:2,y:2},{x:0,y:2},{x:0,y:-2},{x:2,y:-2}])assert.ok(move(s,p,level));
 assert.equal(s.label,level.chestLabel);
});
