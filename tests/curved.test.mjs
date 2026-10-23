import test from 'node:test';import assert from 'node:assert/strict';
import {levels,rotatedRoot,rotatedCut,sqrt,transport,advance,segmentDistance,cutIntersections,twoPointRoot} from '../dist/math.js';
import {createQuadraticCut} from '../dist/curved-cut.js';
import {readProgress,visitSheet,exploredInLevel,saveProgress} from '../dist/progress.js';
const level=levels.find(l=>l.id==='rotated-root'),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('rotated expression squares to the same polynomial as Maze',()=>{
 for(const x of [-4,-1,0,1,4])for(const y of [-4,-.1,0,.1,4])for(const label of [-1,1]){
 const f=rotatedRoot({x,y},label),base=twoPointRoot({x,y});
 assert.ok(dist({x:f.x*f.x-f.y*f.y,y:2*f.x*f.y},{x:x*x-y*y-2.25,y:2*x*y})<1e-12);
 assert.ok(Math.min(dist(f,base),dist(f,{x:-base.x,y:-base.y}))<1e-12);
 }
});
test('every drawn curved-cut sample lies on the negative-real preimage',()=>{
 for(const path of rotatedCut.paths(8))for(const p of path.slice(1)){
 const w=rotatedCut.value(p);assert.ok(Math.abs(w.y)<1e-9);assert.ok(w.x<0);
 }
});
test('banks match across curved cuts and endpoint splitting is consistent',()=>{
 for(const path of rotatedCut.paths(5))for(const p of path.slice(10,80,7)){
 const phi=rotatedCut.phi,normal={x:2*p.x*Math.sin(2*phi)+2*p.y*Math.cos(2*phi),y:-2*p.y*Math.sin(2*phi)+2*p.x*Math.cos(2*phi)};
 const n=Math.hypot(normal.x,normal.y),d={x:normal.x/n*1e-7,y:normal.y/n*1e-7};
 const plus={x:p.x+d.x,y:p.y+d.y},minus={x:p.x-d.x,y:p.y-d.y};
 assert.equal(transport(plus,minus,1,level.cuts),-1);
 assert.ok(dist(rotatedRoot(plus),rotatedRoot(minus,-1))<1e-5);
 const to=transport(plus,p,1,level.cuts),through=transport(p,minus,to,level.cuts);
 assert.equal(through,-1);assert.equal(transport(p,plus,to,level.cuts),1);
 }
});
test('two crossings preserve final label but both transitions and intermediate sheet are recorded',()=>{
 const a={x:-4,y:-4},b={x:2,y:1};assert.equal(cutIntersections(a,b,level.cuts).length,2);
 const s={...a,label:1};const result=advance(s,b,level);assert.deepEqual(result.labels,[-1,1]);assert.equal(s.label,1);
});
test('tangencies and degenerate quadratic lines do not create false crossings',()=>{
 const point=rotatedCut.paths(5)[0][60],phi=rotatedCut.phi;
 const normal={x:2*point.x*Math.sin(2*phi)+2*point.y*Math.cos(2*phi),y:-2*point.y*Math.sin(2*phi)+2*point.x*Math.cos(2*phi)};
 const n=Math.hypot(normal.x,normal.y),d={x:normal.y/n*.1,y:-normal.x/n*.1};
 assert.equal(rotatedCut.intersections({x:point.x+d.x,y:point.y+d.y},{x:point.x-d.x,y:point.y-d.y}).length,0);
 const cross=createQuadraticCut(-1.5,1.5,0);
 assert.equal(transport({x:1,y:1},{x:1,y:-1},1,[cross]),-1);
 assert.equal(transport({x:-1,y:1},{x:1,y:1},1,[cross]),-1);
 assert.equal(transport({x:-1,y:-1},{x:1,y:1},1,[cross]),1);
});
test('random segments agree with independent nearest-root tracking',()=>{
 let seed=551;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(let run=0;run<500;run++){
 const a={x:8*rnd()-4,y:8*rnd()-4},b={x:8*rnd()-4,y:8*rnd()-4};
 if(level.branchPoints.some(p=>segmentDistance(a,b,p)<.3))continue;
 let tracked=rotatedRoot(a);
 for(let i=1;i<=300;i++){
 const t=i/300,z={x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)},p=sqrt({x:z.x*z.x-z.y*z.y-2.25,y:2*z.x*z.y}),m={x:-p.x,y:-p.y};
 tracked=dist(tracked,p)<dist(tracked,m)?p:m;
 }
 assert.ok(dist(tracked,rotatedRoot(b,transport(a,b,1,level.cuts)))<1e-9);
 }
});
test('loops about either branch point flip, enclosing both preserves the sheet',()=>{
 for(const center of [-1.5,1.5,0])for(const direction of [-1,1]){
 const r=center===0?3:.6,start={x:center+r,y:0};let p=start,k=1;
 for(let i=1;i<=720;i++){const theta=i/720*2*Math.PI*direction,q=i===720?start:{x:center+r*Math.cos(theta),y:r*Math.sin(theta)};k=transport(p,q,k,level.cuts);p=q;}
 assert.equal(k,center===0?1:-1);
 }
});
test('Mirage has independent two-sheet discoveries and compatible saves',()=>{
 const p=readProgress(null);visitSheet(p,'two-point',1);visitSheet(p,'two-point',-1);visitSheet(p,level.id,1);visitSheet(p,level.id,-1);
 assert.equal(p.visited.size,4);assert.equal(exploredInLevel(p,level),2);
 let value;const storage={setItem:(k,v)=>value=v,getItem:()=>value};saveProgress(storage,p);assert.equal(readProgress(storage).visited.size,4);
});
