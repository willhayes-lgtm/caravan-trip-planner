(()=>{'use strict';
const pages={trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',service:'servicePage',payload:'payloadPage',maintenance:'maintenancePage',checklists:'checklistsPage',profile:'checklistsPage'};
const mq=matchMedia('(max-width:900px)');
function init(){
 const pin=document.getElementById('uxPinCurrent');
 if(!pin){setTimeout(init,300);return}
 const bar=pin.closest('.ux-page-pinbar');if(!bar)return;
 let source=null;
 const originalText=()=>pin.getAttribute('aria-pressed')==='true'?'Remove dashboard shortcut':'Add to dashboard';
 const setAppearance=()=>{
  if(mq.matches&&bar.classList.contains('cmh-in-heading')){
   if(pin.textContent!=='▦')pin.textContent='▦';
   pin.title=originalText();
   pin.setAttribute('aria-label',originalText());
  }else{
   pin.removeAttribute('title');
   pin.removeAttribute('aria-label');
   // Original controller updates button text on page navigation/click.
   const label=pin.getAttribute('aria-pressed')==='true'?'✓ Added to my dashboard':'+ Add to my dashboard';
   if(pin.textContent!==label)pin.textContent=label;
  }
 };
 function restore(){
  if(!source||!source.parentNode)return;
  source.parentNode.insertBefore(bar,source);
  source.remove();source=null;
  bar.classList.remove('cmh-in-heading');
 }
 function sync(){
  const key=document.body.dataset.currentPage||'trips';
  const page=document.getElementById(pages[key]);
  const heading=page?.querySelector(':scope > .toolbar, :scope > .section-head, :scope > .phase2 .section-head, :scope > .phase2 #serviceTab .section-head, :scope > .phase2 #payloadTab .section-head');
  if(!mq.matches||!heading){restore();setAppearance();return}
  if(bar.parentElement!==heading){
   restore();
   source=document.createElement('span');source.hidden=true;source.className='cmh-pin-placeholder';
   bar.parentElement?.insertBefore(source,bar);
   heading.append(bar);
  }
  heading.classList.add('cmh-compact-heading');
  bar.classList.add('cmh-in-heading');
  setAppearance();
 }
 // The existing dashboard controller repositions its button on navigation.
 window.addEventListener('planner:navigate',()=>{setTimeout(sync,70);setTimeout(sync,450)});
 window.addEventListener('hashchange',()=>setTimeout(sync,100));
 mq.addEventListener('change',sync);
 pin.addEventListener('click',()=>setTimeout(setAppearance,120));
 // Detect delayed controller reparenting and reapply compact positioning.
 const observer=new MutationObserver(()=>{clearTimeout(init._syncTimer);init._syncTimer=setTimeout(sync,80)});
 observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
 setTimeout(sync,500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();