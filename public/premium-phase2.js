(()=>{
'use strict';
function init(){
 const dialog=document.getElementById('editor'),form=document.getElementById('tripForm'),grid=form?.querySelector('.formgrid');
 if(!dialog||!form||!grid||form.dataset.premiumTabs)return;
 form.dataset.premiumTabs='true';
 const specs=[
  ['details','Trip details',['title','location','start_date','end_date','checkin_time','checkout_time']],
  ['booking','Booking',['status','booking_ref','due_date','awning','rating']],
  ['costs','Costs & travel',['cost','paid','diesel','leave_days','mileage']],
  ['extras','Itinerary & notes',['image_url','activities','notes']]
 ];
 const nav=document.createElement('div');nav.className='p2-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Trip editor sections');
 const panels=new Map();
 specs.forEach(([id,label])=>{
  const b=document.createElement('button');b.type='button';b.className='p2-tab';b.dataset.tab=id;b.textContent=label;b.setAttribute('role','tab');b.setAttribute('aria-controls','p2-panel-'+id);
  nav.append(b);
  const panel=document.createElement('section');panel.id='p2-panel-'+id;panel.className='p2-panel formgrid';panel.dataset.panel=id;panel.setAttribute('role','tabpanel');panels.set(id,panel);
 });
 const title=form.querySelector('#formTitle');
 title?.insertAdjacentElement('afterend',nav);
 grid.classList.add('p2-panel-holder');
 for(const [id,label,fields] of specs){
  const panel=panels.get(id);
  fields.forEach(name=>{const input=grid.querySelector('[name="'+name+'"]');const wrapper=input?.closest('label');if(wrapper)panel.append(wrapper)});
  if(id==='extras'){
   const stop=grid.querySelector('.stop-editor');if(stop)panel.prepend(stop);
  }
  grid.append(panel);
 }
 const costPanel=panels.get('costs'),balance=document.createElement('div');balance.className='p2-balance';balance.setAttribute('aria-live','polite');
 costPanel.prepend(balance);
 const format=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'});
 function updateBalance(){
  const cost=Number(form.elements.cost?.value||0),paid=Number(form.elements.paid?.value||0);
  balance.innerHTML='<span>Outstanding booking balance</span><strong>'+format.format(Math.max(0,cost-paid))+'</strong>';
 }
 form.addEventListener('input',e=>{if(['cost','paid'].includes(e.target.name))updateBalance()});
 function show(id,focus=false){
  for(const [key,panel] of panels)panel.hidden=key!==id;
  nav.querySelectorAll('button').forEach(b=>{const active=b.dataset.tab===id;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;b.classList.toggle('active',active)});
  if(focus)nav.querySelector('[data-tab="'+id+'"]')?.focus();
 }
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab)});
 nav.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
  const buttons=[...nav.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);
  if(i<0)return;e.preventDefault();show(buttons[(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].dataset.tab,true);
 });
 // Browser native validation does not focus fields in hidden panels.
 form.addEventListener('invalid',e=>{const p=e.target.closest('.p2-panel');if(p)show(p.dataset.panel)},true);
 dialog.addEventListener('close',()=>show('details'));
 const obs=new MutationObserver(()=>{if(dialog.open){updateBalance();}});
 obs.observe(dialog,{attributes:true,attributeFilter:['open']});
 updateBalance();show('details');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();