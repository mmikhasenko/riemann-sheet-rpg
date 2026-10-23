import {sqrt,divide,multiply} from './complex.js';
export const BW_THRESHOLD=1, BW_MASS_SQUARED=2.5, BW_COUPLING_SQUARED=.8;
// Physical phase space: i sqrt(threshold-s)/sqrt(s). The numerator's
// cut runs rightward; use the upper s-bank even on the exact real axis.
export function physicalRho(z,label=1){
 const w=sqrt({x:BW_THRESHOLD-z.x,y:z.y});
 const rho=divide({x:w.y,y:w.x},sqrt(z));
 return {x:label*rho.x,y:label*rho.y};
}
export function bwDenominator(z,label=1){
 const rho=physicalRho(z,label);
 return {x:BW_MASS_SQUARED-z.x+BW_COUPLING_SQUARED*rho.y,y:-z.y-BW_COUPLING_SQUARED*rho.x};
}
export function breitWigner(z,label=1){
 const d=bwDenominator(z,label);
 if(d.x===0&&d.y===0)return {x:Infinity,y:Infinity};
 return divide({x:1,y:0},d);
}
function resonancePole(){
 let z={x:BW_MASS_SQUARED,y:-BW_COUPLING_SQUARED};
 for(let i=0;i<30;i++){
  const rho=physicalRho(z,-1),d=bwDenominator(z,-1);
  // rho' = threshold/(2 rho s²).
  const den=multiply(rho,multiply(z,z)),dr=divide({x:BW_THRESHOLD/2,y:0},den);
  const derivative={x:-1+BW_COUPLING_SQUARED*dr.y,y:-BW_COUPLING_SQUARED*dr.x};
  const step=divide(d,derivative);z={x:z.x-step.x,y:z.y-step.y};
  if(Math.hypot(step.x,step.y)<1e-14)break;
 }
 if(z.y>=0||Math.hypot(...Object.values(bwDenominator(z,-1)))>1e-12)throw Error('Invalid resonance pole');
 return Object.freeze(z);
}
export const BW_POLE=resonancePole();
export const BW_GLSL=`
vec2 bwRho(vec2 z,float label){
 vec2 w=principalRoot(vec2(1.-z.x,z.y));
 return label*cmDiv(vec2(w.y,w.x),principalRoot(z));
}
vec2 bwValue(vec2 z,float label){
 if(length(z)<1e-5)z=vec2(1e-5,0.);
 vec2 rho=bwRho(z,label),d=vec2(2.5-z.x+.8*rho.y,-z.y-.8*rho.x);
 // Clip only the visual divergence; CPU pole position is not regularized.
 return vec2(d.x,-d.y)/max(dot(d,d),1e-10);
}
`;
