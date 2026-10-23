import test from 'node:test';import assert from 'node:assert/strict';
import { cubeRoot, levels, transport, move } from '../dist/math.js';
const cube=levels[1],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('all cube-root branches cube back to s',()=>{
 for(const x of [-5,-1,0,1,5])for(const y of [-3,-1e-10,0,1e-10,3])for(const k of [0,1,2]){
 const f=cubeRoot({x,y},k);assert.ok(distance({x:f.x**3-3*f.x*f.y**2,y:3*f.x**2*f.y-f.y**3},{x,y})<1e-12);
 }
});
test('cube-root cut continuity and orientation for every label',()=>{
 for(const x of [-5,-1,-.1])for(const k of [0,1,2]){
 const upper={x,y:1e-10},lower={x,y:-1e-10};
 assert.equal(transport(upper,lower,k,cube.cuts),(k+1)%3);
 assert.equal(transport(lower,upper,k,cube.cuts),(k+2)%3);
 assert.ok(distance(cubeRoot(upper,k),cubeRoot(lower,transport(upper,lower,k,cube.cuts)))<1e-8);
 assert.ok(distance(cubeRoot(lower,k),cubeRoot(upper,transport(lower,upper,k,cube.cuts)))<1e-8);
 }
});
test('three loops restore cube-root sheet and independent value tracker agrees',()=>{
 let seed=741;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(const direction of [-1,1])for(let run=0;run<10;run++){
 let a={x:2,y:0},label=0,tracked=cubeRoot(a);
 for(let i=1;i<=1080;i++){
 const theta=direction*i*Math.PI/180,r=.8+random()*2,b={x:r*Math.cos(theta),y:r*Math.sin(theta)};
 label=transport(a,b,label,cube.cuts);
 tracked=[0,1,2].map(k=>cubeRoot(b,k)).sort((x,y)=>distance(tracked,x)-distance(tracked,y))[0];
 assert.ok(distance(tracked,cubeRoot(b,label))<1e-12);a=b;
 }
 assert.equal(label,0);
 }
});
test('cube expedition can visit all three sheets and reach the chest',()=>{
 const s={x:3,y:-2,label:0},visited=new Set([0]);
 const route=[{x:2,y:2},{x:-2,y:2},{x:-2,y:-2},{x:2,y:-2},{x:2,y:2},{x:-2,y:2},{x:-2,y:-2},{x:2,y:-2}];
 for(const p of route){assert.ok(move(s,p,cube));visited.add(s.label);}
 assert.equal(s.label,cube.chestLabel);assert.equal(visited.size,3);
});
