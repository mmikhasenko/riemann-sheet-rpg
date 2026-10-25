import {sqrt,multiply,divide} from './complex.js';
// Threshold-subtracted CM, normalized by Im Sigma(s+i0)=rho(s), not rho/(16 pi).
// The two principal roots MUST remain separate: their left-hand jumps cancel.
export function createCM(m1,m2){
 if(!(m1>0&&m2>0&&m1!==m2))throw Error('Unequal positive masses required');
 const a=(m1+m2)**2,b=(m1-m2)**2,c=m1*m1+m2*m2,d=Math.abs(m1*m1-m2*m2);
 const ell=Math.log(Math.max(m1,m2)/Math.min(m1,m2)),h=2*m1*m2;
 const atZero=(-1-c*ell/d+d*ell/a)/Math.PI;
 const root=z=>multiply(sqrt({x:z.x-a,y:z.y}),sqrt({x:z.x-b,y:z.y}));
 const rho=z=>divide(root(z),z);
 // Taylor coefficients from the Feynman-parameter representation. Gauss-Legendre
 // integration is used only once at construction; evaluation near zero is polynomial.
 const coeff=Array(9).fill(0);
 for(let i=0;i<64;i++){
  let x=Math.cos(Math.PI*(i+.75)/64.5),dp;
  for(let j=0;j<12;j++){
   let p=1,q=0;for(let k=1;k<=64;k++){const r=q;q=p;p=((2*k-1)*x*q-(k-1)*r)/k;}
   dp=64*(x*p-q)/(x*x-1);const step=p/dp;x-=step;if(Math.abs(step)<2e-15)break;
  }
  const t=(1+x)/2,w=1/((1-x*x)*dp*dp),u=t*(1-t)/(m1*m1*t+m2*m2*(1-t));
  let power=1;for(let k=1;k<=8;k++){power*=u;coeff[k]+=w*power/(Math.PI*k);}
 }
 function physical(z){
  if(Math.hypot(z.x,z.y)<.04*a){
   let out={x:coeff[8],y:0};for(let k=7;k>=1;k--){out=multiply(out,z);out.x+=coeff[k];}
   out=multiply(out,z);out.x+=atZero;return out;
  }
  const r=root(z),u={x:c-z.x+r.x,y:-z.y+r.y},v={x:c-z.x-r.x,y:-z.y-r.y};
  // u*v=h². Choose the expression without cancellation at large |s|.
  const arg=Math.hypot(u.x,u.y)>=Math.hypot(v.x,v.y)?{x:u.x/h,y:u.y/h}:divide({x:h,y:0},v);
  const log={x:Math.log(Math.hypot(arg.x,arg.y)),y:Math.atan2(arg.y===0?0:arg.y,arg.x)};
  const value=multiply(divide(r,z),log),term=divide({x:d*ell,y:0},z);
  return {x:(value.x-term.x+d*ell/a)/Math.PI,y:(value.y-term.y)/Math.PI};
 }
 function evaluate(z,n=0){
  const f=physical(z);if(n===0)return f;
  const p=rho(z);return {x:f.x-2*n*p.y,y:f.y+2*n*p.x};
 }
 return {m1,m2,a,b,c,d,ell,h,atZero,coeff,rho,physical,evaluate};
}
export const unequalCM=createCM(1.125,.375);
// Generate matching GLSL constants and Taylor coefficients from the CPU model.
const f=n=>Number(n).toPrecision(17);
export function cmGLSL(model,name){
 const {a,b,c,d,ell,h,atZero,coeff}=model;
 return `
vec2 ${name}Root(vec2 z){return cmMul(principalRoot(z-vec2(${f(a)},0.)),principalRoot(z-vec2(${f(b)},0.)));}
vec2 ${name}Rho(vec2 z){return cmDiv(${name}Root(z),z);}
vec2 ${name}Physical(vec2 z){
 if(length(z)<${f(.04*a)}){vec2 v=vec2(${f(coeff[8])},0.);
 ${[7,6,5,4,3,2,1].map(k=>`v=cmMul(v,z)+vec2(${f(coeff[k])},0.);`).join('\n')}
 return cmMul(v,z)+vec2(${f(atZero)},0.);}
 vec2 r=${name}Root(z),u=vec2(${f(c)},0.)-z+r,v=vec2(${f(c)},0.)-z-r;
 vec2 arg=length(u)>=length(v)?u/${f(h)}:cmDiv(vec2(${f(h)},0.),v);
 float angle=arg.y==0.?(arg.x<0.?3.141592653589793:0.):atan(arg.y,arg.x);
 return (cmMul(cmDiv(r,z),vec2(log(length(arg)),angle))-cmDiv(vec2(${f(d*ell)},0.),z)+vec2(${f(d*ell/a)},0.))/3.141592653589793;
}
vec2 ${name}Value(vec2 z,float n){
 if(n!=0.&&length(z)<1e-5)z=vec2(1e-5,0.);
 vec2 v=${name}Physical(z);if(n==0.)return v;
 vec2 r=${name}Rho(z);return v+2.*n*vec2(-r.y,r.x);
}`;
}
export const UNEQUAL_CM_GLSL=cmGLSL(unequalCM,'unequal');
