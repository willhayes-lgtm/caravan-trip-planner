(()=>{'use strict';
function init(){
 const dialog=document.getElementById('editor'),form=document.getElementById('tripForm');
 const nav=form?.querySelector('.p2-tabs'),progress=form?.querySelector('.mobile-trip-progress');
 const back=form?.querySelector('.mobile-trip-back'),next=form?.querySelector('.mobile-trip-next');
 if(!dialog||!nav||!progress||!back||!next){setTimeout(init,150);return}
 if(form.dataset.mobileStepNav)return;
 form.dataset.mobileStepNav='true';
 const tabs=[...nav.querySelectorAll('[data-tab]')];
 if(tabs.length!==4)return;
 const labels=['Details','Booking','Costs','Itinerary'];
 const mobile=matchMedia('(max-width:900px)');
 const buttons=labels.map((label,i)=>{
  const b=document.createElement('button');b.type='button';
  b.className='mobile-trip-step';b.textContent=label;
  b.setAttribute('aria-label','Go to '+['Trip details','Booking','Costs and travel','Itinerary and notes'][i]);
  b.addEventListener('click',()=>{tabs[i].click();render()});
  return b;
 });
 function selected(){
  const idx=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');
  return idx<0?0:idx;
 }
 function render(){
  if(!mobile.matches)return;
  const idx=selected();
  // Replace the old progress text and decorative dots with real navigation.
  progress.replaceChildren(...buttons);
  buttons.forEach((b,i)=>{
   b.classList.toggle('is-current',i===idx);
   if(i===idx)b.setAttribute('aria-current','step');
   else b.removeAttribute('aria-current');
  });
  back.disabled=idx===0;
  // Keep Continue visible and equal width even on final step.
  next.hidden=false;next.disabled=idx===tabs.length-1;
  next.textContent='Continue';
 }
 // Original sheet script repaints progress after navigation. Run after it.
 nav.addEventListener('click',()=>queueMicrotask(render));
 back.addEventListener('click',()=>queueMicrotask(render));
 next.addEventListener('click',()=>queueMicrotask(render));
 form.addEventListener('invalid',()=>queueMicrotask(render),true);
 dialog.addEventListener('close',()=>{});
 const observer=new MutationObserver(()=>{
  if(!mobile.matches||!dialog.open)return;
  if(progress.querySelectorAll('.mobile-trip-step').length!==4)render();
 });
 observer.observe(progress,{childList:true});
 const openObserver=new MutationObserver(()=>{
  if(dialog.open)setTimeout(render,110);
 });
 openObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
 mobile.addEventListener('change',render);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();