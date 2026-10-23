import {BW_CM_GLSL} from './breit-wigner-cm.js';
import {BW_GLSL} from './breit-wigner.js';
import {QUADRATIC_CUT_GLSL} from './curved-cut.js';
import {CM_GLSL} from './chew-mandelstam.js';
import {levels, transport, advance, activeOnSheet} from './math.js';
import {exploredInLevel, TOTAL_SHEETS, AWARDS, readProgress, saveProgress, visitSheet} from './progress.js';
const $=id=>document.getElementById(id), canvas=$('terrain'), overlay=$('overlay'), ctx=overlay.getContext('2d');
let state, mode='top', scalar=0, heading=Math.PI/2, target=null, last=0, noticeUntil=8, elapsed=0, width=0,height=0,scale=1;
const keys=new Set();
let levelIndex=0, activeLevel=levels[0], key, chest, awardTimeout;
let storage; try { storage=window.localStorage; } catch { storage=null; }
const progress=readProgress(storage), menu=$('expedition-menu');
function persist(){
  const saved=saveProgress(storage,progress);
  $('save-note').textContent=saved?'Saved in this browser · each level’s sheets count separately.':'Progress lasts for this session; browser storage is unavailable.';
}
function awardsMarkup(){return AWARDS.map(a=>{
  const earned=progress.visited.size>=a.count;
  return `<div class="award-row ${earned?'earned':''}"><span class="award-icon">${a.icon}</span><div><b>${a.name}</b><small>${a.description}</small></div><span class="award-status">${earned?'✓':`${progress.visited.size}/${a.count}`}</span></div>`;
}).join('');}
function refreshProgress(){
  $('visited-count').textContent=`${exploredInLevel(progress,activeLevel)} / ${activeLevel.labels?.length??'∞'}`;
  $('level-discovery-label').textContent=`sheets entered · Level ${activeLevel.number} (saved)`;
  $('total-discovery-count').textContent=`Across all ${levels.length} levels: ${progress.visited.size} / ${Number.isFinite(TOTAL_SHEETS)?TOTAL_SHEETS:'∞'} sheets entered`;
  $('movement-count').textContent=`This run: ${state.crossings} player sheet transition${state.crossings===1?'':'s'}`;
  $('award-shelf').innerHTML=AWARDS.map(a=>`<span class="award-mini ${progress.visited.size>=a.count?'earned':''}" title="${a.name}: ${a.description}" aria-label="${a.name}: ${progress.visited.size>=a.count?'earned':`${a.count} sheets needed`}">${a.icon} ${a.count}</span>`).join('');
  $('menu-awards').innerHTML=awardsMarkup();
}
function discover(label=state.label){
  state.visited.add(label);
  const earned=visitSheet(progress,activeLevel.id,label);
  persist();refreshProgress();
  if(earned.length){
    clearTimeout(awardTimeout);$('award-toast').textContent=`${earned[0].icon} Award unlocked: ${earned[0].name} · ${progress.visited.size} sheets entered across levels`;
    $('award-toast').hidden=false;
    awardTimeout=setTimeout(()=>$('award-toast').hidden=true,6000);
  }
}
function reset(index=levelIndex){
  if(menu.open)menu.close();
  levelIndex=index;activeLevel=levels[index];
  key={x:2,y:2,label:activeLevel.initialLabel};chest={...(activeLevel.chest??{x:2,y:-2}),label:activeLevel.chestLabel};
  state={...(activeLevel.start??{x:3,y:-2}),label:activeLevel.initialLabel,hp:100,key:false,won:false,dead:false,crossings:0,visited:new Set()};
  target=null;keys.clear();heading=Math.PI/2;
  clearTimeout(awardTimeout);$('award-toast').hidden=true;
  document.querySelector('.intro h1').innerHTML=`One plane. <em>${activeLevel.worlds}</em>`;
  document.querySelector('.intro p').textContent=activeLevel.subtitle;
  document.querySelector('.intro .eyebrow').textContent=`EXPEDITION ${activeLevel.number}`;
  document.querySelector('.formula').innerHTML=`f(s) = ${activeLevel.formula} <span>LEVEL ${activeLevel.number} · ${activeLevel.sheets}</span>`;
  document.querySelector('.edition b').textContent=`${activeLevel.number} / 10`;
  document.querySelector('.mission h2').textContent=activeLevel.title;
  document.querySelector('#key-objective small').textContent=`Sheet ${activeLevel.labelName(key.label)} · s = 2 + 2i`;
  document.querySelector('#chest-objective small').textContent=`Sheet ${activeLevel.labelName(chest.label)} · s = ${chest.x.toFixed(3)} ${chest.y<0?'−':'+'} ${Math.abs(chest.y).toFixed(3)}i${activeLevel.chest?' · pole':''}`;
  document.querySelector('.insight > span').textContent=`↳ FIELD NOTE ${activeLevel.number}`;
  document.querySelector('.insight p').textContent=activeLevel.note;
  document.querySelector('footer span:last-child').textContent=`FLOAT64 LOGIC · WEBGL2 TERRAIN · ${activeLevel.cutLabel}`;
  notice(`Find the key on Sheet ${activeLevel.labelName(key.label)}, then the chest on Sheet ${activeLevel.labelName(chest.label)}.`,8);
  setTerrain(activeLevel.defaultScalar??0);discover();overlay.focus({preventScroll:true});
}
function showLevelSelection(){
  $('level-selection').hidden=false;
  $('choose-level').hidden=true;
  $('level-list').innerHTML=levels.map((l,i)=>`<button class="level-card" data-level="${i}"><span><b>${l.number} · ${l.title}</b><small>${l.sheets.toLowerCase()}</small></span><span class="level-status">${progress.completed.has(l.id)?'✓ Complete':i===levelIndex?'Current':'Play →'}</span></button>`).join('');
}
function showMenu(kind='levels'){
  keys.clear();target=null;
  const complete=kind==='complete',dead=kind==='dead';
  $('menu-eyebrow').textContent=complete?'EXPEDITION COMPLETE':dead?'EXPEDITION ENDED':'EXPEDITION ATLAS';
  $('menu-emblem').textContent=complete?'✦':dead?'↻':'❖';
  $('menu-title').textContent=complete?'A world beyond the cut.':dead?'Lost to infinity.':'Choose your next world.';
  $('menu-description').textContent=complete?`You opened the chest on Sheet ${activeLevel.labelName(chest.label)}. Your discoveries are recorded. Where to next?`:dead?'Your discoveries are safe. Start a fresh expedition or choose another level.':'Awards count sheets your character enters, including the starting sheet. Viewing rays do not count.';
  $('run-stats').innerHTML=`<span><b>${state.visited.size} / ${activeLevel.labels?.length??'∞'}</b>sheets entered this run<br>Level ${activeLevel.number}</span><span><b>${state.crossings}</b>player sheet transitions<br>this run</span><span><b>${progress.visited.size} / ${Number.isFinite(TOTAL_SHEETS)?TOTAL_SHEETS:'∞'}</b>sheets entered<br>across ${levels.length} levels</span>`;
  $('next-level').hidden=!complete||levelIndex>=levels.length-1;
  $('next-level').textContent=levelIndex<levels.length-1?`Next: ${levels[levelIndex+1].title} →`:'Next level';
  $('explore').hidden=dead;$('explore').textContent=state.won?'Keep exploring':'Resume expedition';
  $('choose-level').hidden=false;$('level-selection').hidden=true;refreshProgress();
  if(kind==='levels'||complete&&levelIndex===levels.length-1)showLevelSelection();
  if(!menu.open)menu.showModal();
}
menu.addEventListener('close',()=>{keys.clear();target=null;overlay.focus({preventScroll:true});});
$('close-menu').onclick=()=>menu.close();
$('replay-level').onclick=()=>reset();
$('next-level').onclick=()=>{if(levelIndex<levels.length-1)reset(levelIndex+1);};
$('explore').onclick=()=>menu.close();
$('choose-level').onclick=showLevelSelection;
$('level-menu').onclick=()=>showMenu();
$('level-list').onclick=e=>{const button=e.target.closest('[data-level]');if(button)reset(Number(button.dataset.level));};
function notice(text,time=4){$('toast').textContent=text;noticeUntil=elapsed+time;}
const gl=canvas.getContext('webgl2',{alpha:false,antialias:false});
let program,uniforms={};
if(gl){
 const vert=`#version 300 es
 in vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
 const frag=`#version 300 es
 precision highp float;out vec4 color;uniform vec2 resolution,player,cutBounds,branchXs;uniform float signSheet,heading,terrainRange,cutPhi;
 ${QUADRATIC_CUT_GLSL}uniform int mode,scalar,functionKind;
 vec2 principalRoot(vec2 z){float r=length(z);float re=z.x>=0.?sqrt((r+z.x)*.5):abs(z.y)/sqrt(2.*(r-z.x));float im=z.x>=0.?(re>0.?z.y/(2.*re):0.):(z.y<0.?-1.:1.)*sqrt((r-z.x)*.5);return vec2(re,im);}
 ${CM_GLSL}
 ${BW_GLSL}
 ${BW_CM_GLSL}
 void main(){vec2 s=(gl_FragCoord.xy/resolution-.5)*vec2(resolution.x/resolution.y*12.,12.);vec2 d=s-player;float label=signSheet;
 if(mode==2 && functionKind==5){if(mod(curvedCrossings(player,s,branchXs,cutPhi),2.)>0.5)label=-label;}
 if(mode==2 && functionKind!=5 && ((player.y<0.)!=(s.y<0.))){float t=-player.y/(s.y-player.y);float x=mix(player.x,s.x,t);if(functionKind==7){if(x<0.||x>=1.)label=-label;}else if(functionKind==6||functionKind==8){if(x>=1.)label+=s.y<player.y?1.:-1.;else if(x>=0.)label=-label;}else if(functionKind==3){if(x>=cutBounds.x && x<branchXs.x)label=float(int(label)^1);else if(x>=branchXs.y && x<1000000.)label=float(int(label)^2);}else if(x>=cutBounds.x && x<cutBounds.y){if(functionKind==1)label=mod(label+(s.y<player.y?1.:-1.)+3.,3.);else if(functionKind==4)label+=s.y<player.y?1.:-1.;else label=-label;}}
 float r=length(s);vec2 root=vec2(sqrt(max(0.,(r+s.x)*.5)),(s.y<0.?-1.:1.)*sqrt(max(0.,(r-s.x)*.5)))*label;
 if(functionKind==1){float angle=(atan(s.y,s.x)+6.28318530718*label)/3.;root=pow(r,1./3.)*vec2(cos(angle),sin(angle));}
 if(functionKind==2){vec2 u=principalRoot(vec2(s.x-branchXs.x,s.y)),w=principalRoot(vec2(s.x-branchXs.y,s.y));root=label*vec2(u.x*w.x-u.y*w.y,u.x*w.y+u.y*w.x);}
 if(functionKind==3){vec2 u=principalRoot(vec2(s.x-branchXs.x,s.y)),w=principalRoot(vec2(branchXs.y-s.x,s.y))*vec2(1.,-1.);int bits=int(label);root=((bits&1)==0?1.:-1.)*u+2.*((bits&2)==0?1.:-1.)*w;}
 if(functionKind==4)root=vec2(log(max(r,1e-20)),atan(s.y,s.x)+6.28318530718*label);
 if(functionKind==5){vec2 w=principalRoot(curvedArgument(s,branchXs,cutPhi));root=label*vec2(cos(cutPhi)*w.x+sin(cutPhi)*w.y,cos(cutPhi)*w.y-sin(cutPhi)*w.x);}
 if(functionKind==6)root=cmValue(s,label);
 if(functionKind==7)root=bwValue(s,label);
 if(functionKind==8)root=bwCMValue(s,label);
 float v=scalar==0?root.x:scalar==1?root.y:length(root);float t=clamp(scalar==2?v/terrainRange:.5+v/(2.*terrainRange),0.,1.);
 vec3 low=vec3(.055,.17,.24),mid=vec3(.19,.39,.39),high=vec3(.69,.72,.44);vec3 c=t<.5?mix(low,mid,t*2.):mix(mid,high,(t-.5)*2.);
 float contour=abs(fract(v*5.+.5)-.5);float line=1.-smoothstep(.015,.015+fwidth(v)*7.,contour);c*=1.-.22*line;
 vec2 grid=abs(fract(s+.5)-.5);vec2 aa=fwidth(s);float gridline=1.-min(smoothstep(0.,aa.x*1.2,grid.x),smoothstep(0.,aa.y*1.2,grid.y));c=mix(c,vec3(.6,.8,.72),gridline*.075);
 float axis=1.-smoothstep(0.,max(aa.x,aa.y)*1.4,min(abs(s.x),abs(s.y)));c=mix(c,vec3(.6,.8,.72),axis*.2);
 float visibility=1.;if(mode==1)visibility=1.-smoothstep(1.35,2.2,length(d));if(mode==2){float facing=dot(normalize(d+vec2(.00001)),vec2(cos(heading),sin(heading)));visibility=(1.-smoothstep(4.5,5.5,length(d)))*smoothstep(.43,.5,facing);visibility=max(visibility,1.-smoothstep(.25,.5,length(d)));}c=mix(vec3(.025,.055,.067),c,visibility);
 float danger=smoothstep(5.5,7.,r);c=mix(c,vec3(.28,.12,.15),danger*.65);color=vec4(c,1.);}`;
 function shader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vert));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 for(const name of ['resolution','player','signSheet','heading','mode','scalar','functionKind','cutBounds','branchXs','terrainRange','cutPhi'])uniforms[name]=gl.getUniformLocation(program,name);
}else{$('view-help').textContent='WebGL2 is unavailable. Map markers and gameplay remain available.';}
function screen(p){return {x:width/2+p.x*scale,y:height/2-p.y*scale};}
function visible(p){if(mode==='top')return true;const d=Math.hypot(p.x-state.x,p.y-state.y);if(mode==='night')return d<2;return d<.45||(d<5&&((p.x-state.x)*Math.cos(heading)+(p.y-state.y)*Math.sin(heading))/d>.5);}
function drawObject(p,type){const label=mode==='player'?transport(state,p,state.label,activeLevel.cuts):state.label;if(p.label!==label||!visible(p)||(type==='key'&&state.key))return;const q=screen(p);ctx.save();ctx.translate(q.x,q.y);ctx.strokeStyle='#f0ce8f';ctx.fillStyle='#17282a';ctx.lineWidth=2;ctx.shadowColor='#d9b76c';ctx.shadowBlur=14;if(type==='key'){ctx.beginPath();ctx.arc(-4,-5,6,0,Math.PI*2);ctx.moveTo(0,0);ctx.lineTo(10,10);ctx.lineTo(15,5);ctx.moveTo(7,7);ctx.lineTo(11,3);ctx.stroke();}else{ctx.fillRect(-12,-8,24,18);ctx.strokeRect(-12,-8,24,18);ctx.beginPath();ctx.moveTo(-12,-1);ctx.lineTo(12,-1);ctx.stroke();ctx.fillStyle='#f0ce8f';ctx.fillRect(-2,-3,4,7);}ctx.shadowBlur=0;ctx.font='9px "DM Sans", sans-serif';ctx.textAlign='center';ctx.fillStyle='#ebd6b2';ctx.fillText(type==='key'?'BRASS KEY':state.won?'CHEST OPENED':'HIDDEN CHEST',0,32);ctx.restore();}
function render(){const rect=overlay.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;scale=height/12;if(overlay.width!==Math.round(width*dpr)||overlay.height!==Math.round(height*dpr)){overlay.width=canvas.width=Math.round(width*dpr);overlay.height=canvas.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform2f(uniforms.player,state.x,state.y);gl.uniform1f(uniforms.signSheet,state.label);gl.uniform1f(uniforms.heading,heading);gl.uniform1i(uniforms.mode,['top','night','player'].indexOf(mode));gl.uniform1i(uniforms.scalar,scalar);gl.uniform1i(uniforms.functionKind,activeLevel.shader);gl.uniform1f(uniforms.terrainRange,activeLevel.terrainRange??3);gl.uniform2f(uniforms.cutBounds,activeLevel.cuts[0].a?.x??0,activeLevel.cuts[0].b?.x??0);gl.uniform1f(uniforms.cutPhi,activeLevel.phi??0);gl.uniform2f(uniforms.branchXs,activeLevel.branchPoints[0].x,activeLevel.branchPoints.at(-1).x);gl.drawArrays(gl.TRIANGLES,0,6);}
 const origin=screen({x:0,y:0});
 ctx.strokeStyle='#d6a56888';ctx.lineWidth=1;ctx.setLineDash([4,7]);
 if(mode!=='player')for(const cut of activeLevel.cuts){
   if(!activeOnSheet(cut,state.label))continue;
   if(cut.paths){
     for(const path of cut.paths(Math.hypot(width/scale,height/scale))){ctx.beginPath();path.forEach((z,i)=>{const p=screen(z);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();}
     continue;
   }
   const start=screen(cut.a),end=screen(cut.b);
   ctx.beginPath();ctx.moveTo(Math.max(0,start.x),start.y);ctx.lineTo(Math.min(width,end.x),end.y);ctx.stroke();
   ctx.font='9px monospace';ctx.fillStyle='#e1bc7b';
   ctx.fillText(cut.caption||activeLevel.cutLabel,Math.max(30,(Math.max(0,start.x)+Math.min(width,end.x))/2-24),start.y-12);
 }
 ctx.setLineDash([]);ctx.strokeStyle='#bc83824a';ctx.beginPath();ctx.arc(origin.x,origin.y,5.5*scale,0,Math.PI*2);ctx.stroke();
 for(const branch of activeLevel.branchPoints)if(visible(branch)&&activeOnSheet(branch,mode==='player'?transport(state,branch,state.label,activeLevel.cuts):state.label)){
   const p=screen(branch);ctx.fillStyle='#0b171d';ctx.strokeStyle='#d4b078';ctx.lineWidth=1.5;
   ctx.beginPath();ctx.arc(p.x,p.y,branch.radius*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.stroke();ctx.font='9px monospace';ctx.fillStyle='#dac494';
   if(activeLevel.branchPoints.length===1)ctx.fillText('0 · BRANCH POINT',p.x+18,p.y+4);
   else {ctx.textAlign='center';ctx.fillText(branch.name,p.x,p.y+28);ctx.textAlign='start';}
 }

 drawObject(key,'key');drawObject(chest,'chest');const p=screen(state);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-heading);ctx.shadowBlur=20;ctx.shadowColor='#bdfcda';ctx.fillStyle='#dcffe6';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-7);ctx.lineTo(-4,0);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#b9e8cf77';ctx.beginPath();ctx.arc(0,0,18,0,2*Math.PI);ctx.stroke();ctx.restore();
 $('sheet').textContent=`SHEET ${activeLevel.labelName(state.label)}`;$('sheet-type').textContent=state.label===activeLevel.initialLabel?'Principal branch':'Continued branch';$('sheet-dot').style.background=state.label===activeLevel.initialLabel?'#aee4c5':'#e7bd77';const f=activeLevel.evaluate(state,state.label),fmt=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(3);$('coordinates').textContent=`s = ${state.x.toFixed(2)} ${fmt(state.y)}i`;$('value').textContent=`f(s) = ${f.x.toFixed(3)} ${fmt(f.y)}i`;$('hp').style.width=state.hp+'%';$('hp-label').textContent=Math.ceil(state.hp)+'%';$('toast').style.opacity=elapsed<noticeUntil?1:0;
 for(const [id,done] of [['key-objective',state.key],['chest-objective',state.won]]){$(id).classList.toggle('done',done);$(id).querySelector('.check').textContent=done?'✓':'○';}
}
function update(dt){if(state.dead||menu.open)return;let dx=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0),dy=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0);if(!dx&&!dy&&target){dx=target.x-state.x;dy=target.y-state.y;if(Math.hypot(dx,dy)<.08){dx=dy=0;target=null;}}let len=Math.hypot(dx,dy);const turning=(keys.has('q')?1:0)-(keys.has('e')?1:0);if(len){dx/=len;dy/=len;if(!turning)heading=Math.atan2(dy,dx);}if(turning)turn(turning*Math.PI*dt);const r=Math.hypot(state.x,state.y),pull=r>5.5?Math.min(3,(r-5.5)*1.2):0;const next={x:state.x+(dx*2+state.x/(r||1)*pull)*dt,y:state.y+(dy*2+state.y/(r||1)*pull)*dt};const result=advance(state,next,activeLevel);if(!result&&len)notice('The branch point is a puncture. Walk around it.',1);if(result?.labels.length){state.crossings+=result.labels.length;for(const label of result.labels)discover(label);notice(`Cut crossed · now on Sheet ${activeLevel.labelName(state.label)}`);}
 if(r>5.5)state.hp=Math.max(0,state.hp-dt*(8+pull*8));if(state.hp<=0){state.dead=true;showMenu('dead');return;}if(!state.key&&state.label===key.label&&Math.hypot(state.x-key.x,state.y-key.y)<.4){state.key=true;notice(`Key found. Find the chest on Sheet ${activeLevel.labelName(chest.label)}.`,6);}if(!state.won&&state.label===chest.label&&Math.hypot(state.x-chest.x,state.y-chest.y)<(activeLevel.chestRadius??.45)){if(state.key){state.won=true;progress.completed.add(activeLevel.id);persist();notice('Chest opened! Your discoveries are recorded.',6);showMenu('complete');}else notice(`The chest is locked. Find the key on Sheet ${activeLevel.labelName(key.label)}.`,2);}}
function frame(t){const dt=Math.min((t-last)/1000||0,.035);last=t;elapsed+=dt;update(dt);render();requestAnimationFrame(frame);}
function turn(angle){heading=Math.atan2(Math.sin(heading+angle),Math.cos(heading+angle));}
function setTerrain(value){
 scalar=value;$('scalar').value=String(scalar);$('scalar-name').textContent=['Re f','Im f','|f|'][scalar];
 const range=activeLevel.terrainRange??3;document.querySelector('.scale-labels span:first-child').textContent=scalar===2?'0':`−${range}`;document.querySelector('.scale-labels span:last-child').textContent=`+${range}`;
 if(scalar===2)notice(activeLevel.magnitudeNote??(activeLevel.id==='log'?'Logarithm magnitudes can differ between sheets. Im f shows the 2π offsets directly.':activeLevel.id==='root-sum'?'Magnitude distinguishes relative signs, but simultaneous sign reversal leaves it unchanged.':`|${activeLevel.formula}| is identical on all sheets. Try Re f to see the difference.`),5);
}
function cycleTerrain(){setTerrain((scalar+1)%3);}
window.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
 const focus=document.activeElement;
 if(focus.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(focus.tagName))return;
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 if(k==='r'){e.preventDefault();if(!e.repeat)reset();return;}
 if(menu.open)return;
 if(k==='t'){e.preventDefault();if(!e.repeat)cycleTerrain();return;}
 if(['w','a','s','d','q','e','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)){
  e.preventDefault();keys.add(k);target=null;
 }
});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>{keys.clear();target=null;});

function point(e){const r=overlay.getBoundingClientRect();target={x:(e.clientX-r.left-width/2)/scale,y:-(e.clientY-r.top-height/2)/scale};}
overlay.addEventListener('pointerdown',e=>{overlay.focus();overlay.setPointerCapture(e.pointerId);point(e);});overlay.addEventListener('pointermove',e=>{if(overlay.hasPointerCapture(e.pointerId))point(e);});overlay.addEventListener('pointerup',()=>target=null);overlay.addEventListener('pointercancel',()=>target=null);
$('reset').onclick=()=>reset();$('views').onclick=e=>{if(!e.target.dataset.view)return;mode=e.target.dataset.view;for(const b of $('views').children)b.classList.toggle('active',b.dataset.view===mode);$('view-help').textContent=mode==='top'?'The entire terrain changes when you cross the cut.':mode==='night'?'Only nearby terrain is visible. Cuts remain visible everywhere.':'Viewing rays continue onto other sheets. Only your character’s movement counts toward discoveries and sheet transitions; cuts are hidden.';document.querySelector('.legend').style.visibility=mode==='player'?'hidden':'visible';};$('scalar').onchange=e=>setTerrain(+e.target.value);
$('terrain-cycle').onclick=()=>{cycleTerrain();overlay.focus({preventScroll:true});};
$('turn-left').onclick=()=>{turn(Math.PI/4);overlay.focus({preventScroll:true});};
$('turn-right').onclick=()=>{turn(-Math.PI/4);overlay.focus({preventScroll:true});};
reset();requestAnimationFrame(frame);
