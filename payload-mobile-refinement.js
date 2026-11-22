/* Mobile actions menu: proxy existing controls to retain their installed listeners. */
(()=>{'use strict';
 function init(){
  const root=document.querySelector('#payloadPage');
  const actions=root?.querySelector('.inventory-actions');
  if(!actions||actions.querySelector('.payload-more'))return;
  const importButton=actions.querySelector('#importInventory');
  const exportButton=actions.querySelector('#exportInventory');
  if(!importButton&&!exportButton)return;
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
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
