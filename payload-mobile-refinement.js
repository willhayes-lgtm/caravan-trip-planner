/* Payload mobile refinement: more-actions menu + payload info toggle. */
(()=>{'use strict';
 function init(){
  const root=document.querySelector('#payloadPage');
  if(!root)return;
  const actions=root.querySelector('.inventory-actions');
  if(actions && !actions.querySelector('.payload-more')){
   const importButton=actions.querySelector('#importInventory');
   const exportButton=actions.querySelector('#exportInventory');
   if(importButton || exportButton){
    const details=document.createElement('details');details.className='payload-more';
    const summary=document.createElement('summary');summary.textContent='⋯';summary.setAttribute('aria-label','Inventory actions');summary.setAttribute('title','Inventory actions');
    const panel=document.createElement('div');panel.className='payload-more-panel';
    [['⬆ Import inventory',importButton],['⬇ Export inventory',exportButton]].forEach(([name,target])=>{
     if(!target)return;
     const button=document.createElement('button');button.type='button';button.textContent=name;
     button.addEventListener('click',()=>{details.open=false;target.click()});panel.append(button)
    });
    details.append(summary,panel);actions.append(details);
    document.addEventListener('click',e=>{if(details.open&&!details.contains(e.target))details.open=false});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')details.open=false});
   }
  }
  const toggle=root.querySelector('#payloadHelpToggle');
  const panel=root.querySelector('#payloadHelpPanel');
  if(toggle && panel && !toggle.dataset.bound){
   toggle.dataset.bound='1';
   toggle.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded', String(!open));
    panel.hidden=open;
   });
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
