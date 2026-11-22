/* Isolated payload editor controller: survives errors in the main Phase 2 script. */
(()=>{'use strict';
function init(){
 const dialog=document.getElementById('payloadDialog'),form=document.getElementById('payloadForm');
 if(!dialog||!form)return;
 const field=n=>form.elements.namedItem(n);
 const error=message=>{const el=document.getElementById('error');if(el){el.textContent=message;el.hidden=false;el.scrollIntoView({behavior:'smooth',block:'start'})}else alert(message)};
 function open(item){
  form.reset();
  for(const [name,value] of Object.entries({id:item?.id||'',title:item?.title||'',category:item?.category||'Equipment',weight_kg:item?.weight_kg??'',quantity:item?.quantity??1,equipment_type:item?.equipment_type||'trip'})){const el=field(name);if(el)el.value=value}
  field('packed').checked=item?Boolean(item.packed):true;
  field('included_in_miro').checked=item?Boolean(item.included_in_miro):false;
  document.getElementById('payloadFormTitle').textContent=item?'Edit payload item':'Add payload item';
  if(!dialog.open){try{dialog.showModal()}catch(e){error('Unable to open item editor: '+e.message)}}
 }
 document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='newPayload'){
   e.preventDefault();e.stopImmediatePropagation();open();return;
  }
  if(b.hasAttribute('data-payload-edit')){
   e.preventDefault();e.stopImmediatePropagation();
   try{
    const r=await fetch('/api/payload',{credentials:'same-origin',cache:'no-store'});
    if(!r.ok)throw Error('Could not load inventory');
    const data=await r.json(),item=(data.items||[]).find(x=>x.id===b.dataset.payloadEdit);
    if(!item)throw Error('Item not found');open(item);
   }catch(err){error(err.message)}return;
  }
  if(b.dataset.close==='payloadDialog'){
   e.preventDefault();e.stopImmediatePropagation();dialog.close();
  }
 },true);
 form.addEventListener('submit',async e=>{
  e.preventDefault();e.stopImmediatePropagation();
  const button=form.querySelector('[type=submit],button:not([type])');
  if(button)button.disabled=true;
  const v=Object.fromEntries(new FormData(form));
  v.weight_kg=Number(v.weight_kg);v.quantity=Number(v.quantity);
  v.packed=field('packed').checked;v.included_in_miro=field('included_in_miro').checked;
  try{
   const r=await fetch('/api/payload',{method:v.id?'PUT':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)});
   const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Unable to save item');
   dialog.close();location.reload();
  }catch(err){error(err.message)}finally{if(button)button.disabled=false}
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();