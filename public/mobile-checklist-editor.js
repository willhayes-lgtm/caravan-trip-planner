/* Mobile checklist toolbar and touch-friendly reordering. */
(()=>{'use strict';
function init(){
 const root=document.getElementById('checklistsPage');
 const list=document.getElementById('phaseItems');
 const toolbar=document.querySelector('#phaseLists .phase-toolbar');
 const manage=document.querySelector('#phaseLists .mcf-manage');
 const anchor=document.querySelector('#phaseLists .mcf-actions');
 const add=document.getElementById('phaseAddToggle'),form=document.getElementById('phaseAdd');
 const edit=document.getElementById('phaseEdit'),reset=document.getElementById('phaseReset');
 const safety=document.getElementById('phaseSafetyInfo');
 if(!root||!list||!toolbar||!manage||!anchor||!add||!form||!edit||!reset||!safety)return;
 const mobile=matchMedia('(max-width:900px)');
 const actions=edit.parentElement;
 const bar=document.createElement('div');bar.className='mce-toolbar';
 bar.innerHTML='<span class="mce-toolbar-spacer"></span>';
 const editWrap=document.createElement('div');editWrap.className='mce-action-wrap';
 const resetWrap=document.createElement('div');resetWrap.className='mce-action-wrap';
 const infoWrap=document.createElement('div');infoWrap.className='mce-action-wrap';
 const formHost=document.createElement('div');formHost.className='mce-form-host';
 const original={addParent:add.parentElement,formParent:form.parentElement,editParent:edit.parentElement,resetParent:reset.parentElement,safetyParent:safety.parentElement};
 anchor.after(bar,formHost);
 bar.append(add,editWrap,resetWrap,infoWrap);
 editWrap.append(edit);resetWrap.append(reset);infoWrap.append(safety);
 const icon=(name)=>({edit:'✎',done:'✓',reset:'↺',info:'ⓘ'}[name]);
 const sync=()=>{
  const isEditing=list.classList.contains('phase-editmode');
  edit.textContent=isEditing?'✓ Done editing':icon('edit');
  edit.classList.toggle('mce-done-editing',isEditing);
  edit.setAttribute('aria-label',isEditing?'Done editing':'Edit checklist');
  edit.title=isEditing?'Done editing':'Edit checklist';
  reset.textContent=icon('reset');reset.setAttribute('aria-label','Reset checklist');reset.title='Reset checklist';
  safety.textContent=icon('info');safety.setAttribute('aria-label','Safety information');safety.title='Safety information';
  add.textContent='+ Add task';
  add.setAttribute('aria-label','Add new checklist task');
  if(mobile.matches){
   // Ensure the creation form is below the controls, not in a narrow popover.
   if(form.parentElement!==formHost)formHost.append(form);
   // Keep a single row with independent controls and a full-width editor below.
   bar.hidden=false;manage.hidden=true;toolbar.hidden=true;
  }else{
   bar.hidden=true;manage.hidden=true;toolbar.hidden=false;
   original.addParent.append(add);
   original.formParent.append(form);
   original.editParent.append(edit);
   original.resetParent.append(reset);
   original.safetyParent.append(safety);
  }
 };
 mobile.addEventListener('change',sync);
 window.addEventListener('planner:navigate',()=>requestAnimationFrame(sync));
 // The checklist rerenders on edits, reorders and completion.
 const observer=new MutationObserver(sync);
 observer.observe(list,{childList:true,attributes:true,attributeFilter:['class']});
 sync();
 // Touch reorder: long-press the six-dot handle, drag onto another row, release.
 // Pointer capture keeps the gesture active as the finger moves.
 let drag=null,timer=0;
 const clear=()=>{
  clearTimeout(timer);timer=0;
  if(drag?.row){drag.row.classList.remove('mce-dragging');}
  list.querySelectorAll('.mce-drop-target').forEach(x=>x.classList.remove('mce-drop-target'));
  drag=null;
 };
 list.addEventListener('pointerdown',e=>{
  const grip=e.target.closest('.phase-drag'),row=grip?.closest('[data-id]');
  if(!mobile.matches||!grip||!row||!list.classList.contains('phase-editmode')||e.button!==0)return;
  drag={row,id:row.dataset.id,pointer:e.pointerId,x:e.clientX,y:e.clientY,started:false,target:null};
  // Touch starts after a short hold; mouse/stylus can begin immediately.
  const begin=()=>{if(!drag)return;drag.started=true;row.classList.add('mce-dragging');grip.setPointerCapture(e.pointerId)};
  if(e.pointerType==='touch')timer=setTimeout(begin,230);else begin();
 });
 list.addEventListener('pointermove',e=>{
  if(!drag||drag.pointer!==e.pointerId)return;
  if(!drag.started){
   if(Math.abs(e.clientY-drag.y)>12||Math.abs(e.clientX-drag.x)>12)clear();
   return;
  }
  e.preventDefault();
  const at=document.elementFromPoint(e.clientX,e.clientY)?.closest('#phaseItems [data-id]');
  list.querySelectorAll('.mce-drop-target').forEach(x=>x.classList.remove('mce-drop-target'));
  if(at&&at!==drag.row){drag.target=at;at.classList.add('mce-drop-target')}else drag.target=null;
  if(e.clientY<75)window.scrollBy(0,-15);
  if(e.clientY>innerHeight-100)window.scrollBy(0,15);
 });
 list.addEventListener('pointerup',e=>{
  if(!drag||drag.pointer!==e.pointerId)return;
  const fromId=drag.id,toId=drag.target?.dataset.id,started=drag.started;
  clear();
  if(started&&toId&&fromId!==toId)list.dispatchEvent(new CustomEvent('mce-reorder',{detail:{fromId,toId}}));
 });
 list.addEventListener('pointercancel',clear);
 window.addEventListener('blur',clear);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,30),{once:true});
else setTimeout(init,30);
})();