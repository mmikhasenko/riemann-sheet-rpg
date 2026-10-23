import test from 'node:test';import assert from 'node:assert/strict';
import {levels,logarithm,transport,move,rootSum} from '../dist/math.js';
import {readProgress,saveProgress,visitSheet,exploredInLevel,TOTAL_SHEETS} from '../dist/progress.js';
const logLevel=levels.find(l=>l.id==='log'),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('log banks match for large positive and negative sheet labels',()=>{
 for(const n of [-10000,-10,-1,0,1,10,10000])for(const x of [-4,-1,-.3]){
 const u={x,y:1e-10},d={x,y:-1e-10};
 assert.equal(transport(u,d,n,logLevel.cuts),n+1);assert.equal(transport(d,u,n,logLevel.cuts),n-1);
 assert.ok(distance(logarithm(u,n),logarithm(d,n+1))<1e-8);
 }
});
test('log continuation follows independently unwrapped phase for repeated loops',()=>{
 for(const direction of [-1,1]){
 let p={x:2,y:0},n=0,phase=0,previous=0;
 for(let i=1;i<=3600;i++){
 const angle=direction*i*Math.PI/180,q=i===3600?{x:2,y:0}:{x:2*Math.cos(angle),y:2*Math.sin(angle)};
 n=transport(p,q,n,logLevel.cuts);const principal=Math.atan2(q.y,q.x);
 let delta=principal-previous;if(delta>Math.PI)delta-=2*Math.PI;if(delta< -Math.PI)delta+=2*Math.PI;
 phase+=delta;assert.ok(Math.abs(logarithm(q,n).y-phase)<1e-9);p=q;previous=principal;
 }
 assert.equal(n,direction*10);
 }
});
test('log mission reaches n=2 after two downward cut crossings',()=>{
 const s={x:3,y:-2,label:0};
 for(const p of [{x:3,y:2},{x:2,y:2},{x:-2,y:2},{x:-2,y:-2},{x:2,y:-2},{x:2,y:2},{x:-2,y:2},{x:-2,y:-2},{x:2,y:-2}])assert.ok(move(s,p,logLevel));
 assert.equal(s.label,2);
});
test('Level 4 upper-bank convention matches a downward approach on both exterior cuts and the continuous middle interval',()=>{
 const l=levels.find(l=>l.id==='root-sum');
 for(const x of [-3,0,3])for(const k of l.labels){
 const u={x,y:1e-12},axis={x,y:0},d={x,y:-1e-12};
 assert.equal(transport(u,axis,k,l.cuts),k);
 assert.ok(distance(rootSum(u,k),rootSum(axis,k))<1e-9);
 assert.ok(distance(rootSum(axis,k),rootSum(d,transport(axis,d,k,l.cuts)))<1e-9);
 }
});
test('log sheet discoveries are unbounded, distinct and survive reload',()=>{
 const p=readProgress(null);for(let n=-30;n<=30;n++)visitSheet(p,'log',n);
 assert.equal(exploredInLevel(p,logLevel),61);assert.equal(TOTAL_SHEETS,Infinity);
 assert.deepEqual(visitSheet(p,'log',-30),[]);
 let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};saveProgress(storage,p);
 assert.equal(readProgress(storage).visited.size,61);
 saved=JSON.stringify({visited:['log:-10000','log:10000','log:NaN','log:1.2','log:-0','log:01','log:9007199254740992']});
 assert.deepEqual([...readProgress(storage).visited],['log:-10000','log:10000']);
});
