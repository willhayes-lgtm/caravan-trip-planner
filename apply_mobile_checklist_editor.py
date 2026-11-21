#!/usr/bin/env python3
"""One-time mobile checklist toolbar and touch reorder patch."""
from pathlib import Path
p=Path('public/checklists.js'); h=Path('public/index.html')
s=p.read_text(); html=h.read_text()
anchor=" $('#phaseItems').classList.toggle('phase-editmode',edit);"
replacement=""" $('#phaseItems').classList.toggle('phase-editmode',edit);
 // iOS Safari does not support dependable native HTML drag/drop.
 // Reordering on touch devices is handled by pointer events on the grip.
"""
if s.count(anchor)!=1 or 'mce-reorder' in s or 'mobile-checklist-editor.js' in html:
    raise SystemExit('Unexpected version or already patched. No changes made.')
s=s.replace(anchor,replacement)
old='draggable="${edit}"'
if s.count(old)!=1:raise SystemExit('Missing draggable anchor.')
s=s.replace(old,'draggable="${edit && !matchMedia(\'(pointer:coarse)\').matches}"')
anchor2=" $('#phaseProfileSave').onsubmit=async e=>"
if s.count(anchor2)!=1:raise SystemExit('Missing reorder insertion point.')
s=s.replace(anchor2,""" // Mobile pointer-based drag handle requests the same persisted reorder API as arrow buttons.
 $('#phaseItems').addEventListener('mce-reorder',async e=>{
  const {fromId,toId}=e.detail||{};
  const ids=items().map(x=>String(x.id));
  const from=ids.indexOf(String(fromId)),to=ids.indexOf(String(toId));
  if(!edit||from<0||to<0||from===to)return;
  const [moved]=ids.splice(from,1);ids.splice(to,0,moved);
  try{await updateOrder(ids)}catch(err){alertError(err)}
 });
"""+anchor2)
if html.count('</head>')!=1 or html.count('</body>')!=1:raise SystemExit('HTML layout mismatch.')
html=html.replace('</head>','<link rel="stylesheet" href="/mobile-checklist-editor.css?v=20261121-1"></head>')
html=html.replace('</body>','<script src="/mobile-checklist-editor.js?v=20261121-1" defer></script></body>')
Path('public/mobile-checklist-editor.js').write_text(r"""/* Mobile checklist toolbar and touch-friendly reordering. */
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
})();""")
Path('public/mobile-checklist-editor.css').write_text(r"""/* Compact, single-row mobile checklist management and full-width edit cards */
@media(max-width:900px){
 #phaseLists .mcf-actions{display:none!important}
 #phaseLists .mce-toolbar{display:flex;align-items:center;gap:7px;width:100%;margin:4px 0 10px}
 #phaseLists .mce-toolbar-spacer{flex:1;display:none}
 #phaseLists .mce-toolbar button{box-sizing:border-box;min-height:44px!important;border:1px solid #c9dfe0!important;border-radius:11px!important;background:#f1f7f7!important;color:#174858!important;margin:0!important;padding:7px 10px!important;font-size:15px!important;line-height:1.1!important;white-space:nowrap}
 #phaseLists .mce-toolbar #phaseAddToggle{flex:1;min-width:0!important;background:#e2f0f0!important;font-weight:700}
 #phaseLists .mce-action-wrap{flex:0 0 44px;min-width:44px}
 #phaseLists .mce-action-wrap:has(.mce-done-editing){flex:0 0 auto;min-width:0}
 #phaseLists .mce-toolbar .mce-done-editing{width:auto!important;min-width:108px!important;padding:8px 10px!important;background:#164b5b!important;color:#fff!important;font-size:13px!important;font-weight:700!important}
 #phaseLists .mce-action-wrap button{width:44px!important;padding:7px!important;font-size:23px!important}
 #phaseLists .mce-toolbar:has(.mce-done-editing) #phaseAddToggle{font-size:12px!important;padding:7px 5px!important}
 #phaseLists .mce-form-host{width:100%;margin-bottom:8px}
 #phaseLists .mce-form-host #phaseAdd:not([hidden]){display:grid!important;grid-template-columns:1fr!important;gap:8px!important;padding:12px!important;background:#f4f9f9;border:1px solid #d3e4e4;border-radius:12px}
 #phaseLists .mce-form-host #phaseAdd label{min-width:0!important;width:100%}
 #phaseLists .mce-form-host #phaseAdd input{width:100%}
 #phaseLists #phaseItems.phase-editmode .phase-task{display:grid!important;grid-template-columns:26px minmax(0,1fr)!important;gap:8px 10px!important;align-items:start!important;padding:12px!important;min-width:0!important}
 #phaseLists #phaseItems.phase-editmode .phase-task>.phase-drag{grid-column:1;grid-row:1;display:flex;align-items:flex-start;justify-content:center;touch-action:none;min-height:44px!important;padding-top:3px;cursor:grab;user-select:none}
 #phaseLists #phaseItems.phase-editmode .phase-task>input[type=checkbox]{display:none!important}
 #phaseLists #phaseItems.phase-editmode .phase-task>.phase-task-main{grid-column:2;grid-row:1;min-width:0!important;width:100%!important;overflow-wrap:anywhere}
 #phaseLists #phaseItems.phase-editmode .phase-task-title{font-size:15px!important;line-height:1.4!important}
 #phaseLists #phaseItems.phase-editmode .phase-task small{font-size:13px!important;line-height:1.4!important}
 #phaseLists #phaseItems.phase-editmode .phase-task>.phase-task-actions{grid-column:1/-1;grid-row:2;display:flex!important;flex-wrap:nowrap!important;gap:7px!important;justify-content:flex-end!important;border-top:1px solid #e1ebeb;padding-top:9px;width:100%!important}
 #phaseLists #phaseItems.phase-editmode .phase-task-actions button{min-width:44px!important;min-height:42px!important;padding:8px 10px!important;flex:0 0 auto;font-size:13px!important}
 #phaseLists #phaseItems.phase-editmode .phase-task-actions [data-edit]{font-size:0!important}
 #phaseLists #phaseItems.phase-editmode .phase-task-actions [data-edit]::before{content:'✎';font-size:22px}
 #phaseLists #phaseItems.phase-editmode .phase-task-actions [data-delete]{font-size:0!important}
 #phaseLists #phaseItems.phase-editmode .phase-task-actions [data-delete]::before{content:'🗑';font-size:21px}
 #phaseLists #phaseItems.phase-editmode .phase-task.mce-dragging{opacity:.6;background:#e8f4f4!important;box-shadow:0 6px 18px #164b5b22}
 #phaseLists #phaseItems.phase-editmode .phase-task.mce-drop-target{outline:3px solid #238c9a;outline-offset:1px}
}
@media(min-width:901px){#phaseLists .mce-toolbar,#phaseLists .mce-form-host{display:none!important}}
""")
p.write_text(s);h.write_text(html)
print('Patched checklist drag support and installed mobile editor toolbar.')
