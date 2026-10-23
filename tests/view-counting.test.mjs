import test from 'node:test';
import assert from 'node:assert/strict';
import {levels, transport, move} from '../dist/math.js';
import {readProgress, visitSheet, exploredInLevel} from '../dist/progress.js';
test('view-ray continuation across every level cut is pure and cannot award a visit',()=>{
 for(const level of levels){
  const x=level.id==='rotated-root'?2:level.id==='two-point'?0:-2;
  const y=level.id==='rotated-root'?4:1;
  const player={x,y,label:level.initialLabel,crossings:0};
  const progress=readProgress(null);visitSheet(progress,level.id,player.label);
  const before=JSON.stringify(player);
  for(let i=0;i<1000;i++){
   const label=transport(player,{x,y:-y},player.label,level.cuts);
   assert.notEqual(label,player.label);
   level.evaluate({x,y:-y},label);
  }
  assert.equal(JSON.stringify(player),before);
  assert.equal(progress.visited.size,1);assert.equal(exploredInLevel(progress,level),1);
 }
});
test('backtracking counts two player transitions but only two distinct Level 3 sheets',()=>{
 const level=levels[2],s={x:0,y:1,label:1,crossings:0},progress=readProgress(null);
 visitSheet(progress,level.id,s.label);
 for(const y of [-1,1,-1,1]){
  const before=s.label;assert.ok(move(s,{x:0,y},level));
  if(before!==s.label){s.crossings++;visitSheet(progress,level.id,s.label);}
  if(s.crossings===2){assert.equal(progress.visited.size,2);assert.equal(s.label,1);}
 }
 assert.equal(s.crossings,4);assert.equal(exploredInLevel(progress,level),2);
});
test('seven cross-level discoveries never become seven sheets in Level 3',()=>{
 const p=readProgress(null);
 for(const level of levels.slice(0,3))for(const label of level.labels)visitSheet(p,level.id,label);
 assert.equal(p.visited.size,7);
 assert.deepEqual(levels.slice(0,3).map(level=>exploredInLevel(p,level)),[2,3,2]);
});
