import {sqrt,multiply,divide} from './complex.js';
export const CM_THRESHOLD=1; // 4m², with m=1/2
export function rhoPrincipal(z){
 const q=divide({x:CM_THRESHOLD,y:0},z);
 return sqrt({x:1-q.x,y:-q.y});
}
export function cmPhysical(z){
 // The apparent singularity at s=0 is removable on the physical sheet.
 // ΣI = -2/π Σ_{k>=0} (1/ρ²)^k/(2k+1), 1/ρ²=s/(s-threshold).
 if(Math.hypot(z.x,z.y)<.04*CM_THRESHOLD){
   const u=divide(z,{x:z.x-CM_THRESHOLD,y:z.y});let power={x:1,y:0},sum={x:1,y:0};
   for(let k=1;k<=8;k++){power=multiply(power,u);sum.x+=power.x/(2*k+1);sum.y+=power.y/(2*k+1);}
   return {x:-2/Math.PI*sum.x,y:-2/Math.PI*sum.y};
 }
 const rho=rhoPrincipal(z),plus={x:rho.x+1,y:rho.y};
 // (ρ-1)/(ρ+1) = -threshold/[s(ρ+1)²], avoiding subtraction near ρ=1.
 const ratio=divide({x:-CM_THRESHOLD,y:0},multiply(z,multiply(plus,plus)));
 const log={x:Math.log(Math.hypot(ratio.x,ratio.y)),y:Math.atan2(ratio.y===0?0:ratio.y,ratio.x)};
 const value=multiply(rho,log);return {x:value.x/Math.PI,y:value.y/Math.PI};
}
export function chewMandelstam(z,n=0){
 const value=cmPhysical(z);if(n===0)return value;
 const rho=rhoPrincipal(z);return {x:value.x-2*n*rho.y,y:value.y+2*n*rho.x};
}
export const CM_GLSL=`
vec2 cmMul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 cmDiv(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/dot(b,b);}
vec2 cmRho(vec2 z){vec2 q=cmDiv(vec2(1.,0.),z);return principalRoot(vec2(1.-q.x,-q.y));}
vec2 cmPhysical(vec2 z){
 if(length(z)<.04){vec2 u=cmDiv(z,z-vec2(1.,0.)),power=vec2(1.,0.),sum=power;
 for(int k=1;k<=8;k++){power=cmMul(power,u);sum+=power/float(2*k+1);}return -2./3.141592653589793*sum;}
 vec2 rho=cmRho(z),plus=rho+vec2(1.,0.);
 vec2 ratio=cmDiv(vec2(-1.,0.),cmMul(z,cmMul(plus,plus)));
 float angle=ratio.y==0.?(ratio.x<0.?3.141592653589793:0.):atan(ratio.y,ratio.x);
 return cmMul(rho,vec2(log(length(ratio)),angle))/3.141592653589793;
}
vec2 cmValue(vec2 z,float n){
 // Off-sheet origin is excluded from gameplay; cap only the visual singularity.
 if(n!=0.&&length(z)<1e-5)z=vec2(1e-5,0.);
 vec2 value=cmPhysical(z);if(n==0.)return value;
 vec2 rho=cmRho(z);return value+2.*n*vec2(-rho.y,rho.x);
}
`;
