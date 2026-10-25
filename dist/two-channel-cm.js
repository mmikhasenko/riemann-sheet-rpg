import {createCM,cmGLSL} from './unequal-cm.js';
import {divide} from './complex.js';
export const CHANNELS=[createCM(.75,.25),createCM(1.125,.375)];
export const TWO_CHANNEL_MASS_SQUARED=2.9;
export const TWO_CHANNEL_COUPLINGS=[.35,.65]; // g1², g2²
export const pairLabel=(n1,n2)=>`${n1},${n2}`;
export function sheetPair(label='0,0'){return label.split(',').map(Number);}
export function validPair(label){
 if(typeof label!=='string'||! /^-?\d+,-?\d+$/.test(label))return false;
 const ns=sheetPair(label);return ns.every(Number.isSafeInteger)&&pairLabel(...ns)===label;
}
export function channelMap(label,index,map){const ns=sheetPair(label);ns[index]=map(ns[index]);return pairLabel(...ns);}
export function twoChannelDenominator(z,label='0,0'){
 const ns=sheetPair(label);
 if(z.x===0&&z.y===0&&ns.some(n=>n!==0)){
  const residue=CHANNELS.reduce((r,c,i)=>r+TWO_CHANNEL_COUPLINGS[i]*ns[i]*c.d,0);
  if(residue===0)return {x:TWO_CHANNEL_MASS_SQUARED-CHANNELS.reduce((r,c,i)=>r+TWO_CHANNEL_COUPLINGS[i]*c.atZero,0),y:-2*CHANNELS.reduce((r,c,i)=>r+TWO_CHANNEL_COUPLINGS[i]*ns[i]*c.c/c.d,0)};
 }
 const out={x:TWO_CHANNEL_MASS_SQUARED-z.x,y:-z.y};
 CHANNELS.forEach((c,i)=>{const v=c.evaluate(z,ns[i]);out.x-=TWO_CHANNEL_COUPLINGS[i]*v.x;out.y-=TWO_CHANNEL_COUPLINGS[i]*v.y;});
 return out;
}
export function twoChannelBW(z,label='0,0'){
 const ns=sheetPair(label);
 // A nonzero CM pole residue makes a removable zero of the amplitude.
 const residue=CHANNELS.reduce((r,c,i)=>r+TWO_CHANNEL_COUPLINGS[i]*ns[i]*c.d,0);
 if(z.x===0&&z.y===0&&residue!==0)return {x:0,y:0};
 const d=twoChannelDenominator(z,label);return divide({x:1,y:0},d);
}
export function findTwoChannelPole(start={x:3.2,y:-.6},label='1,1'){
 let z={...start};
 for(let k=0;k<40;k++){
  const d=twoChannelDenominator(z,label),h=1e-5;
  const p=twoChannelDenominator({x:z.x+h,y:z.y},label),m=twoChannelDenominator({x:z.x-h,y:z.y},label);
  const step=divide(d,{x:(p.x-m.x)/(2*h),y:(p.y-m.y)/(2*h)});
  z={x:z.x-step.x,y:z.y-step.y};if(Math.hypot(step.x,step.y)<1e-13)break;
 }
 if(Math.hypot(...Object.values(twoChannelDenominator(z,label)))>1e-10||z.y>=0||z.x<=CHANNELS[1].a)throw Error('Invalid two-channel pole');
 return Object.freeze(z);
}
export const TWO_CHANNEL_POLE=findTwoChannelPole();
export const TWO_CHANNEL_GLSL=CHANNELS.map((c,i)=>cmGLSL(c,`channel${i}`)).join('\n')+`
vec2 twoChannelValue(vec2 z,vec2 ns){
 if(length(z)<1e-5&&abs(${TWO_CHANNEL_COUPLINGS[0]*CHANNELS[0].d}*ns.x+${TWO_CHANNEL_COUPLINGS[1]*CHANNELS[1].d}*ns.y)>1e-6)return vec2(0.);
 vec2 d=vec2(${TWO_CHANNEL_MASS_SQUARED},0.)-z-${TWO_CHANNEL_COUPLINGS[0]}*channel0Value(z,ns.x)-${TWO_CHANNEL_COUPLINGS[1]}*channel1Value(z,ns.y);
 return cmDiv(vec2(1.,0.),d);
}`;
