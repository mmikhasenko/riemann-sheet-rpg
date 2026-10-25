export const TOUR_STEPS=[
 {target:'.intro',title:'Explore a many-valued world',text:'The map is the complex s-plane. A position can belong to several Riemann sheets, each with different terrain. Find the key first, then unlock the chest. This quick tour shows you where to look.'},
 {target:'.world-bottom',title:'Move, turn, and restart',text:'Use W A S D or the arrow keys to walk. Hold Q or E to turn your view without moving. You can also press and drag on the map. V cycles views; T cycles terrain; R restarts the expedition. Matching buttons sit below the map.'},
 {target:'.world-top',title:'Watch your sheet',text:'This is your current sheet. Walking across a branch cut changes it. Cuts are hidden in Player view; switch to Top to see them. Branch points are obstacles: walk around them. A full loop can bring you back to the same position on a different sheet.'},
 {target:'.coordinates',title:'Read your position',text:'Your position is s = x + yi: right increases the real part, up increases the imaginary part. Compare this indicator with the objective coordinates. A matching position alone is not enough—you must also reach the required sheet.'},
 {target:'.mission',title:'Find the key, then the chest',text:'Each objective lists its sheet and coordinates. Both are away from your starting sheet. Follow the clues and approach on the correct sheet; the marker appears nearby and collection is automatic. A check mark confirms success. The chest needs the key.'},
 {target:'#views',title:'Choose a perspective',text:'Player is the default: you see a cone ahead, continued along viewing rays. Top shows the whole terrain and cuts. Spot lights a small area around you while keeping cuts visible. Looking onto another sheet does not count as visiting it.'},
 {target:'#scalar',title:'Choose the terrain',text:'Im f is the default colour field. Re f and magnitude |f| show different features of the same function. Use this menu or press T. The field note below explains the current level’s continuation rules.'},
 {target:'.easy-mode',title:'Make the search easier',text:'Tick Easy mode to show key and chest markers from afar on sheets reached by the current view. In Player view, markers appear only in the illuminated area. It does not change their required sheets: you still have to travel there to collect them. Untick it for nearby-only markers.'},
 {target:'.health-label',title:'Stay away from infinity',text:'Watch Stability. Beyond |s| = 5.5, an outward pull drains it. Keep inside the boundary and go around branch points. If an expedition ends, you can restart; saved discoveries remain.'},
 {target:'.discovery',title:'Track your discoveries',text:'This panel counts the distinct sheets your character has entered, plus transitions during this run. Viewing rays never add discoveries. Awards and completed levels are saved in this browser.'},
 {target:'#level-menu',title:'Ready to explore',text:'Open Levels & awards to choose another expedition or see your progress. After opening the chest, continue exploring, restart, or advance. References and Quick tour are always available in the header. Start by reading your key’s sheet and coordinates.'},
];
export function installTour({storage,pause}){
 const dialog=document.getElementById('tour-dialog'),card=document.getElementById('tour-card'),highlight=document.getElementById('tour-highlight');
 const button=document.getElementById('open-tour'),back=document.getElementById('tour-back'),next=document.getElementById('tour-next');
 let index=0,previousScroll=0,frame;
 const seenKey='analytic-rpg-tour-v1';
 function position(){
  if(!dialog.open)return;
  const target=document.querySelector(TOUR_STEPS[index].target),r=target.getBoundingClientRect();
  const w=window.innerWidth,h=window.innerHeight;
  highlight.style.cssText=`left:${Math.max(4,r.left-5)}px;top:${Math.max(4,r.top-5)}px;width:${Math.min(w-8,r.width+10)}px;height:${Math.min(h-8,r.height+10)}px`;
  const ch=card.getBoundingClientRect().height,cw=card.getBoundingClientRect().width;
  let top=r.bottom+16;
  if(top+ch>h-12)top=r.top-ch-16;
  if(top<12)top=r.top+r.height/2>h/2?12:h-ch-12;
  card.style.top=`${Math.max(8,top)}px`;
  card.style.left=`${Math.max(8,Math.min(w-cw-8,r.left+(r.width-cw)/2))}px`;
 }
 function show(){
  const step=TOUR_STEPS[index];
  document.getElementById('tour-progress').textContent=`QUICK TOUR · ${index+1} / ${TOUR_STEPS.length}`;
  document.getElementById('tour-title').textContent=step.title;
  document.getElementById('tour-description').textContent=step.text;
  back.disabled=index===0;next.textContent=index===TOUR_STEPS.length-1?'Start exploring':'Next →';
  document.querySelector(step.target).scrollIntoView({block:'center',behavior:'instant'});
  cancelAnimationFrame(frame);frame=requestAnimationFrame(position);
 }
 function open(){pause();index=0;previousScroll=window.scrollY;dialog.showModal();show();next.focus({preventScroll:true});}
 button.onclick=open;
 back.onclick=()=>{if(index>0){index--;show();}};
 next.onclick=()=>{if(index===TOUR_STEPS.length-1)dialog.close();else{index++;show();}};
 document.getElementById('tour-close').onclick=()=>dialog.close();
 document.getElementById('tour-skip').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);pause();try{storage?.setItem(seenKey,'seen');}catch{}window.scrollTo({top:previousScroll,behavior:'instant'});button.focus({preventScroll:true});});
 window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});
 let seen=false;try{seen=storage?.getItem(seenKey)==='seen';}catch{}
 if(!seen)open();
}
