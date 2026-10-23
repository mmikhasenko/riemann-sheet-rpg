// Implicit cuts for exp(-iφ) sqrt((s-a)(s-b) exp(2iφ)), a,b real.
// They are the preimage of the negative real axis, not a polyline approximation.
export function quadraticRoots(A,B,C) {
  const eps=32*Number.EPSILON*Math.max(Math.abs(A),Math.abs(B),Math.abs(C),1);
  if(Math.abs(A)<=eps)return Math.abs(B)<=eps?[]:[-C/B];
  const D=B*B-4*A*C;
  if(D<=32*Number.EPSILON*Math.max(B*B,Math.abs(4*A*C),1))return []; // tangent: no crossing
  const q=-.5*(B+(B<0?-1:1)*Math.sqrt(D));
  return [q/A,C/q].sort((a,b)=>a-b);
}
export function createQuadraticCut(a,b,phi) {
  const c=Math.cos(2*phi),s=Math.sin(2*phi);
  const raw=z=>{const re=(z.x-a)*(z.x-b)-z.y*z.y,im=(2*z.x-a-b)*z.y;return {x:c*re-s*im,y:s*re+c*im};};
  const value=z=>{const w=raw(z);if(Math.abs(w.y)<1e-12*Math.max(1,Math.abs(w.x)))w.y=0;return w;};
  return {
    kind:'quadratic',aValue:a,bValue:b,phi,value,map:label=>-label,
    intersections(p,q){
      const dx=q.x-p.x,dy=q.y-p.y;
      if(dx===0&&dy===0)return [];
      const A=s*(dx*dx-dy*dy)+2*c*dx*dy;
      let B=s*((2*p.x-a-b)*dx-2*p.y*dy)+c*((2*p.x-a-b)*dy+2*p.y*dx);
      const C=value(p).y;
      if(value(q).y===0)B=-A-C; // enforce the evaluator’s exact endpoint bank
      const roots=C===0 ? (A!==0?[0,-B/A]:[0]) : value(q).y===0 ? (A!==0?[1,C/A]:[1]) : quadraticRoots(A,B,C),hits=[];
      for(let t of roots){
        if(t< -1e-10||t>1+1e-10)continue;
        t=Math.max(0,Math.min(1,t));
        const slope=2*A*t+B;
        if(Math.abs(slope)<32*Number.EPSILON*Math.max(1,Math.abs(A),Math.abs(B)))continue;
        // The transformed imaginary zero belongs to the upper bank.
        if(t===0&&slope>=0||t===1&&slope<=0)continue;
        const z={x:p.x+t*dx,y:p.y+t*dy};
        if(raw(z).x<0)hits.push({t,direction:slope<0?-1:1});
      }
      return hits;
    },
    // A parametrization for drawing only. Exact intersections above govern gameplay.
    paths(extent){
      const center=(a+b)/2,d=(b-a)/2,paths=[[],[]];
      for(let i=0;i<=400;i++){
        const r=(extent*extent+d*d)*i/400;
        const re=d*d-r*c,im=r*s,mag=Math.hypot(re,im);
        const x=Math.sqrt(Math.max(0,(mag+re)/2));
        const y=(im<0?-1:1)*Math.sqrt(Math.max(0,(mag-re)/2));
        paths[0].push({x:center+x,y});paths[1].push({x:center-x,y:-y});
      }
      return paths;
    },
  };
}
// The same quadratic solve in float32 for shader rays. No per-pixel path stepping.
export const QUADRATIC_CUT_GLSL = `
vec2 curvedArgument(vec2 z,vec2 ab,float phi){
 vec2 p=vec2((z.x-ab.x)*(z.x-ab.y)-z.y*z.y,(2.*z.x-ab.x-ab.y)*z.y);
 float c=cos(2.*phi),s=sin(2.*phi);vec2 w=vec2(c*p.x-s*p.y,s*p.x+c*p.y);
 if(abs(w.y)<2e-6*max(1.,abs(w.x)))w.y=0.;return w;
}
float curvedHit(float t,float A,float B,vec2 p,vec2 d,vec2 ab,float phi){
 if(t<0.||t>1.)return 0.;float slope=2.*A*t+B;
 if(abs(slope)<1e-7)return 0.;
 if((t==0.&&slope>=0.)||(t==1.&&slope<=0.))return 0.;
 return curvedArgument(p+t*d,ab,phi).x<0.?1.:0.;
}
float curvedCrossings(vec2 p,vec2 q,vec2 ab,float phi){
 vec2 d=q-p;float c=cos(2.*phi),s=sin(2.*phi);
 float A=s*(d.x*d.x-d.y*d.y)+2.*c*d.x*d.y;
 float B=s*((2.*p.x-ab.x-ab.y)*d.x-2.*p.y*d.y)+c*((2.*p.x-ab.x-ab.y)*d.y+2.*p.y*d.x);
 float C=curvedArgument(p,ab,phi).y;if(curvedArgument(q,ab,phi).y==0.)B=-A-C;
 float eps=1e-6*max(1.,max(abs(A),max(abs(B),abs(C))));
 if(C==0.){float h=curvedHit(0.,A,B,p,d,ab,phi);if(abs(A)>eps && abs(B)>eps)h+=curvedHit(-B/A,A,B,p,d,ab,phi);return h;}
 if(curvedArgument(q,ab,phi).y==0.){float h=curvedHit(1.,A,B,p,d,ab,phi);if(abs(A)>eps && abs(C/A-1.)>1e-5)h+=curvedHit(C/A,A,B,p,d,ab,phi);return h;}
 if(abs(A)<=eps){if(abs(B)<=eps)return 0.;return curvedHit(-C/B,A,B,p,d,ab,phi);}
 float D=B*B-4.*A*C;if(D<=1e-6*max(1.,max(B*B,abs(4.*A*C))))return 0.;
 float v=-.5*(B+(B<0.?-1.:1.)*sqrt(D));
 return curvedHit(v/A,A,B,p,d,ab,phi)+curvedHit(C/v,A,B,p,d,ab,phi);
}
`;
