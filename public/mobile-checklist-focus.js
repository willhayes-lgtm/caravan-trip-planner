(()=>{'use strict';
function init(){
 const page=document.getElementById('checklistsPage');if(!page)return;
 const heading=page.querySelector(':scope > .phase-head'),card=page.querySelector('#phaseLists>.phase-card');
 const toolbar=document.querySelector('#phaseLists .phase-toolbar'),tabs=document.getElementById('phaseTabs');
 const progress=document.getElementById('phaseProgress');
 if(!heading||!card||!toolbar||!tabs||!progress)return;
 const pin=page.querySelector('.ux-page-pinbar');
 const top=document.createElement('div');top.className='mcf-top';heading.before(top);top.append(heading);if(pin)top.append(pin);
 const headingTitle=heading.querySelector('h2');if(headingTitle)headingTitle.textContent='Checklists';
 const anchor=document.createElement('div');anchor.className='mcf-actions';toolbar.before(anchor);anchor.append(toolbar);
 const manage=document.createElement('details');manage.className='mcf-manage';
 manage.innerHTML='<summary aria-label="Manage checklist">••• <span>Manage</span></summary><div class="mcf-panel"></div>';
 anchor.append(manage);const panel=manage.querySelector('.mcf-panel');
 const add=document.getElementById('phaseAddToggle'),form=document.getElementById('phaseAdd'),actions=toolbar.querySelector('.phase-actions'),safety=document.getElementById('phaseSafetyInfo');
 if(!add||!form||!actions||!safety)return;
 const mobile=matchMedia('(max-width:900px)');
 function place(){
  if(mobile.matches){panel.append(add,form,actions,safety);manage.hidden=false;toolbar.hidden=true;}
  else{manage.open=false;manage.hidden=true;toolbar.hidden=false;toolbar.append(add,form,actions);progress.after(safety)}
  const b=document.getElementById('uxPinCurrent');if(b&&mobile.matches)b.textContent=b.getAttribute('aria-pressed')==='true'?'✓ Dashboard':'+ Dashboard';
 }
 place();mobile.addEventListener('change',place);
 const short=()=>{if(!mobile.matches)return;tabs.querySelectorAll('[data-template]').forEach(b=>{const t=b.textContent.trim();if(!b.dataset.mcfOriginal)b.dataset.mcfOriginal=t;const s=b.dataset.mcfOriginal;b.setAttribute('aria-label',s);b.textContent=/departure.*hitch|safe hitch|^departure/i.test(s)?'Departure':/setup/i.test(s)?'Setup':/pack|leav/i.test(s)?'Pack down':s})};
 new MutationObserver(short).observe(tabs,{childList:true});short();
 // Existing navigation moves the dashboard button; put it back alongside heading.
 window.addEventListener('planner:navigate',()=>requestAnimationFrame(()=>{const b=page.querySelector('.ux-page-pinbar');if(b&&b.parentNode!==top)top.append(b);place()}));
 const pinButton=document.getElementById('uxPinCurrent');if(pinButton)new MutationObserver(()=>{if(!mobile.matches)return;const desired=pinButton.getAttribute('aria-pressed')==='true'?'✓ Dashboard':'+ Dashboard';if(pinButton.textContent!==desired)pinButton.textContent=desired}).observe(pinButton,{childList:true,attributes:true,attributeFilter:['aria-pressed']});
 panel.addEventListener('click',e=>{if(e.target.closest('#phaseSafetyInfo,#phaseEdit,#phaseReset'))manage.open=false});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();