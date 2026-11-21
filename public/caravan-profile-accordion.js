/* Caravan Profile: accessible, collapsed-by-default sections. */
(()=>{
'use strict';
const rootId='phaseProfileForm';
let openIndex=-1;
let installed=false;
const esc=s=>String(s||'');
function init(){
 const root=document.getElementById(rootId);
 if(!root)return;
 const form=document.getElementById('phaseProfileSave');
 if(!form)return;
 function enhance(){
  const groups=[...root.querySelectorAll(':scope > .ux-profile-group')];
  if(!groups.length)return;
  groups.forEach((group,i)=>{
   if(group.dataset.accordionReady==='1')return;
   group.dataset.accordionReady='1';
   const head=group.querySelector('.ux-profile-group-head');
   const fields=group.querySelector('.ux-profile-fields');
   if(!head||!fields)return;
   const title=head.querySelector('h3')?.textContent||'Caravan details';
   const button=document.createElement('button');
   button.type='button';
   button.className='cpa-toggle';
   button.setAttribute('aria-label','Expand '+title);
   const id='cpa-fields-'+i;
   fields.id=id;
   button.setAttribute('aria-controls',id);
   // Move existing title and description nodes; retain original styling.
   while(head.firstChild)button.append(head.firstChild);
   const chevron=document.createElement('span');
   chevron.className='cpa-chevron';
   chevron.setAttribute('aria-hidden','true');
   chevron.textContent='⌄';
   button.append(chevron);
   head.append(button);
   const actions=document.createElement('div');
   actions.className='cpa-section-actions';
   const save=document.createElement('button');
   save.type='submit';
   save.className='cpa-save';
   save.textContent='Save caravan details';
   actions.append(save);
   group.append(actions);
   group.dataset.open='false';
   button.setAttribute('aria-expanded','false');
   fields.hidden=true;
   actions.hidden=true;
   button.addEventListener('click',()=>{
    const isOpen=group.dataset.open==='true';
    openIndex=isOpen?-1:i;
    sync();
   });
  });
  sync();
 }
 function sync(){
  const groups=[...root.querySelectorAll(':scope > .ux-profile-group')];
  groups.forEach((group,i)=>{
   const expanded=i===openIndex;
   group.dataset.open=String(expanded);
   const button=group.querySelector('.cpa-toggle');
   const fields=group.querySelector('.ux-profile-fields');
   const actions=group.querySelector('.cpa-section-actions');
   if(button){
    button.setAttribute('aria-expanded',String(expanded));
    button.setAttribute('aria-label',(expanded?'Collapse ':'Expand ')+(button.querySelector('h3')?.textContent||'Caravan details'));
   }
   if(fields)fields.hidden=!expanded;
   if(actions)actions.hidden=!expanded;
  });
  const original=form.querySelector(':scope > .phase-actions');
  if(original)original.hidden=true;
 }
 if(!installed){
  installed=true;
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.target===root && r.type==='childList')){
    // Re-render after successful save replaces sections; close by default.
    openIndex=-1;
    enhance();
   }
  });
  observer.observe(root,{childList:true});
 }
 enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
