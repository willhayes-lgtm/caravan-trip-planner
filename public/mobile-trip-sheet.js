(()=>{'use strict';
const mq=matchMedia('(max-width:900px)');
function init(){
 const dialog=document.getElementById('editor'),form=document.getElementById('tripForm');
 if(!dialog||!form||form.dataset.mobileSheet)return;
 const title=form.querySelector('#formTitle'),nav=form.querySelector('.p2-tabs'),holder=form.querySelector('.p2-panel-holder'),footer=form.querySelector(':scope > .actions');
 if(!title||!nav||!holder||!footer){setTimeout(init,180);return}
 form.dataset.mobileSheet='true';
 const tabs=[...nav.querySelectorAll('[data-tab]')];
 const names=tabs.map(t=>t.textContent.trim());
 const head=document.createElement('div');head.className='mobile-trip-head';
 const wrap=document.createElement('div');wrap.className='mobile-trip-title';
 const handle=document.createElement('div');handle.className='mobile-trip-handle';handle.setAttribute('aria-hidden','true');
 title.before(head);head.append(wrap);wrap.append(handle,title);
 const close=document.createElement('button');close.type='button';close.className='mobile-trip-close';close.textContent='×';close.setAttribute('aria-label','Close trip editor');head.append(close);
 const progress=document.createElement('div');progress.className='mobile-trip-progress';progress.setAttribute('aria-live','polite');
 head.after(progress);
 const back=document.createElement('button');back.type='button';back.className='mobile-trip-back';back.textContent='Back';
 const next=document.createElement('button');next.type='button';next.className='mobile-trip-next';next.textContent='Continue';
 footer.prepend(back,next);
 let active=0,baseline='',ready=false,closing=false;
 const signature=()=>JSON.stringify([...new FormData(form).entries()].filter(([k])=>k!=='id'));
 function changed(){return ready&&signature()!==baseline}
 function requestClose(){
  if(changed()&&!window.confirm('Discard your unsaved trip changes?'))return;
  closing=true;dialog.close();closing=false;
 }
 close.addEventListener('click',requestClose);
 // Capture existing Cancel handler, allowing the confirmation to run first.
 form.querySelector('#cancel')?.addEventListener('click',e=>{
  if(!mq.matches)return;
  if(changed()&&!window.confirm('Discard your unsaved trip changes?')){e.preventDefault();e.stopImmediatePropagation()}
 },true);
 dialog.addEventListener('cancel',e=>{
  if(!mq.matches||!changed())return;
  e.preventDefault();requestClose();
 });
 function paint(){
  const current=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');
  if(current>=0)active=current;
  progress.innerHTML='';
  const label=document.createElement('strong');label.textContent=names[active]||'Trip details';
  const count=document.createElement('span');count.textContent=`Step ${active+1} of ${tabs.length}`;
  const dots=document.createElement('div');dots.className='mobile-trip-dots';dots.setAttribute('aria-hidden','true');
  tabs.forEach((_,i)=>{const dot=document.createElement('i');dot.className='mobile-trip-dot'+(i===active?' is-current':'');dots.append(dot)});
  progress.append(label,count,dots);
  back.disabled=active===0;
  next.hidden=active===tabs.length-1;
  holder.scrollTop=0;
 }
 function goto(i){
  if(i<0||i>=tabs.length)return;
  tabs[i].click();
  active=i;paint();
 }
 back.addEventListener('click',()=>goto(active-1));
 next.addEventListener('click',()=>goto(active+1));
 nav.addEventListener('click',()=>queueMicrotask(paint));
 form.addEventListener('invalid',()=>queueMicrotask(paint),true);
 dialog.addEventListener('close',()=>{ready=false;active=0});
 // Capture a new baseline after the app has populated the form for Add or Edit.
 const obs=new MutationObserver(()=>{
  if(dialog.open){
   ready=false;active=0;
   setTimeout(()=>{if(dialog.open){baseline=signature();ready=true;paint()}},80);
  }
 });
 obs.observe(dialog,{attributes:true,attributeFilter:['open']});
 mq.addEventListener('change',()=>{if(dialog.open)paint()});
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();