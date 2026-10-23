import {chewMandelstam,cmPhysical,CM_THRESHOLD} from './chew-mandelstam.js';
import {BW_MASS_SQUARED,BW_COUPLING_SQUARED} from './breit-wigner.js';
import {divide,multiply} from './complex.js';
// A single real subtraction shared by every sheet preserves all cut maps.
export const CM_SUBTRACTION=cmPhysical({x:CM_THRESHOLD,y:0}).x;
export function subtractedCM(z,n=0){
 const sigma=chewMandelstam(z,n);return {x:sigma.x-CM_SUBTRACTION,y:sigma.y};
}
export function bwCMDenominator(z,n=0){
 const sigma=subtractedCM(z,n);
 return {x:BW_MASS_SQUARED-z.x-BW_COUPLING_SQUARED*sigma.x,y:-z.y-BW_COUPLING_SQUARED*sigma.y};
}
export function breitWignerCM(z,n=0){
 const d=bwCMDenominator(z,n);
 if(d.x===0&&d.y===0)return {x:Infinity,y:Infinity};
 return divide({x:1,y:0},d);
}
function resonancePole(){
 let z={x:BW_MASS_SQUARED,y:-BW_COUPLING_SQUARED};
 for(let i=0;i<40;i++){
  const sigma=chewMandelstam(z,1),d=bwCMDenominator(z,1);
  // Sigma' = threshold*Sigma/[2s(s-threshold)] - 1/(pi*s).
  const product=multiply(z,{x:z.x-CM_THRESHOLD,y:z.y});
  const a=divide({x:CM_THRESHOLD*sigma.x,y:CM_THRESHOLD*sigma.y},{x:2*product.x,y:2*product.y});
  const b=divide({x:1/Math.PI,y:0},z);
  const derivative={x:-1-BW_COUPLING_SQUARED*(a.x-b.x),y:-BW_COUPLING_SQUARED*(a.y-b.y)};
  const step=divide(d,derivative);z={x:z.x-step.x,y:z.y-step.y};
  if(Math.hypot(step.x,step.y)<1e-14)break;
 }
 const d=bwCMDenominator(z,1);
 if(z.y>=0||Math.hypot(d.x,d.y)>1e-12)throw Error('Invalid CM resonance pole');
 return Object.freeze(z);
}
export const BW_CM_POLE=resonancePole();
export const BW_CM_GLSL=`
vec2 bwCMValue(vec2 z,float n){
 vec2 sigma=cmValue(z,n)-vec2(${CM_SUBTRACTION.toFixed(17)},0.);
 vec2 d=vec2(${BW_MASS_SQUARED.toFixed(17)},0.)-z-${BW_COUPLING_SQUARED.toFixed(17)}*sigma;
 return vec2(d.x,-d.y)/max(dot(d,d),1e-10);
}
`;
