import test from 'node:test';import assert from 'node:assert/strict';
import {levels,advance} from '../dist/math.js';
import {BW_POLE} from '../dist/breit-wigner.js';
import {BW_CM_POLE} from '../dist/breit-wigner-cm.js';
// Search on a half-unit grid, tracking actual cut maps and active obstacles.
// A final short step reaches non-grid resonance poles exactly.
function reach(start,target,level){
 const queue=[start],seen=new Set([`${start.x},${start.y},${start.label}`]);
 for(let i=0;i<queue.length;i++){
  const current=queue[i];
  if(Math.hypot(current.x-target.x,current.y-target.y)<.76){
   const end={...current};if(advance(end,target,level)&&end.label===target.label)return end;
  }
  for(const [dx,dy] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){
   const next={x:current.x+dx,y:current.y+dy};if(Math.hypot(next.x,next.y)>5.15)continue;
   const state={...current};if(!advance(state,next,level)||Math.abs(state.label)>5)continue;
   const id=`${state.x},${state.y},${state.label}`;if(seen.has(id))continue;seen.add(id);queue.push(state);
  }
 }
 assert.fail(`No safe path to ${JSON.stringify(target)} in ${level.id}`);
}
for(const level of levels)test(`${level.title}: key and chest are off the starting sheet and safely reachable in order`,()=>{
 assert.notEqual(level.keyLabel,level.initialLabel);assert.notEqual(level.chestLabel,level.initialLabel);
 assert.ok(Math.hypot(level.key.x,level.key.y)>4);assert.ok(Math.hypot(level.key.x,level.key.y)<5.15);
 const start={...(level.start??{x:3,y:-2}),label:level.initialLabel};
 const found=reach(start,{...level.key,label:level.keyLabel},level);
 const opened=reach(found,{...level.chest,label:level.chestLabel},level);
 assert.equal(opened.label,level.chestLabel);
});
test('resonance chests remain at the computed poles',()=>{
 assert.equal(levels.find(l=>l.id==='breit-wigner').chest,BW_POLE);
 assert.equal(levels.find(l=>l.id==='breit-wigner-cm').chest,BW_CM_POLE);
});
