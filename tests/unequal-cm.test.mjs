import test from 'node:test';
import assert from 'node:assert/strict';
import {createCM,unequalCM as c} from '../dist/unequal-cm.js';
import {chewMandelstam} from '../dist/chew-mandelstam.js';
import {multiply,divide} from '../dist/complex.js';
import {levels,transport,advance,activeOnSheet} from '../dist/math.js';
const level=levels.find(l=>l.id==='cm-unequal');
const close=(a,b,tol=1e-8)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<tol,`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const add=(a,b,k=1)=>({x:a.x+k*b.x,y:a.y+k*b.y});
// Independent once-subtracted dispersion integral, t=a/(1-u²).
// This has no square-root/log branch convention in common with the closed form.
function dispersion(z,model=c){
 const N=4096,sum={x:0,y:0};
 for(let i=0;i<=N;i++){
  const u=i/N,w=(i===0||i===N?1:i%2?4:2),q=divide({x:2*Math.sqrt(1-model.b/model.a+model.b/model.a*u*u),y:0},{x:model.a-z.x*(1-u*u),y:-z.y*(1-u*u)});
  sum.x+=w*q.x;sum.y+=w*q.y;
 }
 const v=multiply({x:z.x-model.a,y:z.y},sum);return {x:v.x/(3*N*Math.PI),y:v.y/(3*N*Math.PI)};
}
test('unequal CM matches an independent dispersion integral, including zero and pseudothreshold',()=>{
 for(const model of [c,createCM(.25,.75),createCM(.6,.4)])for(const z of [{x:0,y:0},{x:-3,y:.2},{x:model.b,y:0},{x:.5*model.a,y:0},{x:3,y:.7},{x:3,y:-.7}])close(model.physical(z),dispersion(z,model),1e-10);
 close(c.physical({x:c.a,y:0}),{x:0,y:0},1e-14);
 for(const x of [c.a+.001,3,10,1e8])assert.ok(Math.abs(c.physical({x,y:0}).y-c.rho({x,y:0}).x)<1e-12);
 const nearEqual=createCM(.50001,.49999);
 for(const z of [{x:0,y:0},{x:.5,y:.1},{x:2,y:-.3}])close(nearEqual.physical(z),chewMandelstam(z),2e-9);
});
test('separate roots give precisely the finite rho cut, with correct real-axis signs',()=>{
 for(const x of [-3,.1,c.b+.1,1,c.a+.1,10]){
  const z={x,y:.2},r=c.rho(z),squared=multiply(r,r);
  close(squared,divide(multiply({x:x-c.a,y:.2},{x:x-c.b,y:.2}),multiply(z,z)),1e-12);
  const above=c.rho({x,y:1e-10}),below=c.rho({x,y:-1e-10});
  close(above,x>c.b&&x<c.a?{x:-below.x,y:-below.y}:below,1e-7);
 }
 assert.ok(c.rho({x:-1,y:0}).x>0);assert.ok(c.rho({x:.1,y:0}).x<0);
});
test('unequal CM matches transported banks, exact axis, and tiny nonzero arguments',()=>{
 for(const n of [-50,-1,0,1,50])for(const x of [-2,.1,.3,.8,1.5,2.5,4]){
  const above={x,y:1e-12},below={x,y:-1e-12};
  const next=transport(above,below,n,level.cuts);
  assert.equal(next,x<c.b?n:x<c.a?(-n||0):n+1);
  close(c.evaluate(above,n),c.evaluate(below,next),1e-7);
  close(c.evaluate(above,n),c.evaluate({x,y:0},n),1e-7);
 }
 for(const angle of [.2,1,2,4,5]){
  const z=r=>({x:r*Math.cos(angle),y:r*Math.sin(angle)});
  close(c.physical(z(1e-13)),{x:c.atZero,y:0},1e-12);
  close(c.physical(z(.04*c.a-1e-9)),c.physical(z(.04*c.a+1e-9)),1e-8);
 }
});
// Independently integrate the analytic differential equation, without principal
// roots, logarithms, or cut maps in the integrator.
function derivative(z,f){
 const A=add(add(divide({x:.5,y:0},{x:z.x-c.a,y:z.y}),divide({x:.5,y:0},{x:z.x-c.b,y:z.y})),divide({x:1,y:0},z),-1);
 const inv=divide({x:1,y:0},z),correction=add(add(multiply(A,{x:inv.x-1/c.a,y:inv.y}),multiply(inv,inv)),{x:inv.x/(c.d*c.ell),y:inv.y/(c.d*c.ell)},-1);
 return add(multiply(A,f),correction,c.d*c.ell/Math.PI);
}
function rk4(z,q,f){
 const d=add(q,z,-1),mid=add(z,d,.5),k1=multiply(derivative(z,f),d),k2=multiply(derivative(mid,add(f,k1,.5)),d),k3=multiply(derivative(mid,add(f,k2,.5)),d),k4=multiply(derivative(q,add(f,k3)),d);
 return add(f,add(add(add(k1,k2,2),k3,2),k4),1/6);
}
test('loops independently verify both branch points and the origin pole on multiple sheets',()=>{
 for(const [center,radius] of [[0,.2],[c.b,.18],[c.a,.3],[1.1,1.5]])for(const startLabel of [-2,0,1])for(const direction of [-1,1]){
  const start={x:center+radius*Math.cos(.7),y:radius*Math.sin(.7)};
  let z=start,n=startLabel,value=c.evaluate(z,n);
  for(let k=1;k<=1200;k++){
   const angle=.7+direction*2*Math.PI*k/1200,q=k===1200?start:{x:center+radius*Math.cos(angle),y:radius*Math.sin(angle)};
   value=rk4(z,q,value);n=transport(z,q,n,level.cuts);z=q;
   if(k%100===0)close(value,c.evaluate(z,n),3e-8);
  }
  if(center===0)assert.equal(n,startLabel,'origin is a pole, not a branch point');
  if(center===c.b)assert.equal(n,-startLabel||0);
 }
});
test('off-sheet pole residue and pseudothreshold appear only on the intended sheets',()=>{
 for(const n of [-2,0,1]){
  const z={x:1e-9,y:2e-9};close(multiply(z,c.evaluate(z,n)),{x:0,y:-2*n*c.d},2e-8);
  assert.equal(activeOnSheet(level.branchPoints[0],n),n!==0);
  assert.equal(activeOnSheet(level.branchPoints[1],n),n!==0);
  assert.equal(activeOnSheet(level.branchPoints[2],n),true);
  for(const x of [0,c.b,c.a]){
   const state={x:x-.2,y:0,label:n},before={...state},result=advance(state,{x:x+.2,y:0},level);
   if(n!==0||x===c.a){assert.equal(result,null);assert.deepEqual(state,before);}else assert.ok(result);
  }
 }
 assert.equal(levels[levels.indexOf(level)-1].id,'cm');
});
