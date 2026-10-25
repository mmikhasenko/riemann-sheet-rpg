import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,TWO_CHANNEL_POLE,twoChannelBW,twoChannelDenominator,sheetPair,validPair,TWO_CHANNEL_COUPLINGS} from '../dist/two-channel-cm.js';
import {levels,transport,activeOnSheet} from '../dist/math.js';
import {readProgress,saveProgress,visitSheet} from '../dist/progress.js';
const level=levels.find(l=>l.id==='two-channel-cm');
const close=(a,b,tol=1e-7)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<tol,`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
test('each channel transports independently across overlapping cuts, with continuous amplitude banks',()=>{
 for(const n1 of [-3,0,1,4])for(const n2 of [-2,0,1,3])for(const x of [-1,.1,.4,.7,1.5,2.5,4]){
  const label=`${n1},${n2}`,above={x,y:1e-11},below={x,y:-1e-11};
  const expected=[n1,n2].map((n,i)=>x<CHANNELS[i].b?n:x<CHANNELS[i].a?(-n||0):n+1).join(',');
  assert.equal(transport(above,below,label,level.cuts),expected);
  assert.equal(transport(below,above,expected,level.cuts),label);
  close(twoChannelBW(above,label),twoChannelBW(below,expected));
  close(twoChannelBW(above,label),twoChannelBW({x,y:0},label));
 }
 assert.equal(transport({x:3,y:1},{x:3,y:-1},'0,0',level.cuts),'1,1');
 assert.equal(transport({x:1.5,y:1},{x:1.5,y:-1},'0,0',level.cuts),'1,0');
});
test('pseudothreshold activation depends only on its own channel, with no spurious origin puncture',()=>{
 for(const label of ['0,0','1,0','0,1','1,1']){
  const ns=sheetPair(label);
  CHANNELS.forEach((c,i)=>{
   assert.equal(activeOnSheet(level.branchPoints.find(p=>p.x===c.b),label),ns[i]!==0);
   assert.ok(activeOnSheet(level.branchPoints.find(p=>p.x===c.a),label));
  });
 }
 assert.ok(!level.branchPoints.some(p=>p.x===0));
 for(const label of ['1,0','0,1','1,1','-2,3']){
  close(twoChannelBW({x:0,y:0},label),{x:0,y:0});
  close(twoChannelBW({x:1e-10,y:1e-10},label),{x:0,y:0});
 }
 // Exact cancellation of the CM pole residues leaves a finite nonzero amplitude.
 close(twoChannelBW({x:0,y:0},'117,-28'),twoChannelBW({x:1e-7,y:1e-7},'117,-28'),1e-7);
});
test('pole is above the second threshold on (1,1), not on the physical sheet',()=>{
 assert.ok(TWO_CHANNEL_POLE.x>CHANNELS[1].a&&TWO_CHANNEL_POLE.y<0);
 close(twoChannelDenominator(TWO_CHANNEL_POLE,'1,1'),{x:0,y:0},1e-12);
 assert.ok(Math.hypot(...Object.values(twoChannelDenominator(TWO_CHANNEL_POLE,'0,0')))>.5);

 for(const x of [1.2,2,2.5,4]){
  const width=CHANNELS.reduce((sum,c,i)=>sum+(x>c.a?TWO_CHANNEL_COUPLINGS[i]*c.rho({x,y:0}).x:0),0);
  assert.ok(Math.abs(twoChannelDenominator({x,y:0}).y+width)<1e-12);
 }
});
test('physical magnitude has a resolvable cusp on the rise before the resonance peak',()=>{
 const mag=x=>Math.hypot(...Object.values(twoChannelBW({x,y:0}))),a=CHANNELS[1].a;
 assert.ok(mag(2)>mag(1.8));assert.ok(mag(a)>mag(2));
 assert.ok(mag(a)>mag(a+.01));assert.ok(mag(3.1)>1.3*mag(a));
 const slopes=h=>[(mag(a)-mag(a-h))/h,(mag(a+h)-mag(a))/h];
 const coarse=slopes(1e-3),fine=slopes(1e-5);
 assert.ok(fine[0]>5*coarse[0]);assert.ok(fine[1]<5*coarse[1]);
});
test('independent sheet pairs persist canonically without colliding with single-channel progress',()=>{
 const progress=readProgress(null);
 for(const label of ['0,0','1,0','0,1','1,1','-100,200']){assert.ok(validPair(label));visitSheet(progress,level.id,label);}
 for(const label of ['01,0','-0,1','0,1.5','NaN,0','1','9007199254740992,0']){assert.ok(!validPair(label));visitSheet(progress,level.id,label);}
 visitSheet(progress,'cm-unequal',1);assert.equal(progress.visited.size,6);
 let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};saveProgress(storage,progress);
 assert.deepEqual(readProgress(storage).visited,progress.visited);
});

test('Confluence objectives require distant sheet pairs; the chest is not labeled as a pole',()=>{
 assert.equal(level.keyLabel,'3,4');assert.equal(level.chestLabel,'-2,1');
 assert.equal(level.chestIsPole,false);
 assert.ok(Math.hypot(...Object.values(twoChannelDenominator(level.chest,level.chestLabel)))>.1);
});
