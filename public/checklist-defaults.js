/* Caravan Trip Planner — optional, idempotent checklist additions. */
(()=>{'use strict';
const sets={
 arrival:[
 ['Unhitching','Disconnect 13-pin electrical plug'],['Unhitching','Disconnect breakaway cable after unhitching'],['Motor mover','Switch on motor mover isolator in battery compartment'],['Motor mover','Engage motor mover rollers as instructed'],['Motor mover','Position caravan on pitch with motor mover'],['Motor mover','Apply handbrake and secure caravan'],['Motor mover','Disengage motor mover rollers completely'],['Motor mover','Switch off motor mover isolator'],
 ['Levelling','Level caravan side to side before lowering steadies'],['Levelling','Level front to back with jockey wheel'],['Levelling','Lower corner steadies for stability, not lifting'],
 ['Water','Close internal water drain-down valve'],['Water','Fill Aquaroll with fresh water'],['Water','Connect water pump and inlet'],['Water','Close taps, then open one cold tap to prime'],['Water','Switch on water pump and wait for steady flow'],['Water','Prime remaining cold taps and then hot taps'],['Water','Check for leaks; only heat water once system is filled'],
 ['Toilet','Fill separate toilet flush tank with water'],['Toilet','Add pink flush additive per product instructions'],['Toilet','Add blue chemical and required water to cassette'],['Toilet','Check toilet cassette is correctly seated'],
 ['Final checks','Connect electric hook-up following site and equipment instructions'],['Final checks','Check power, fridge and heating settings'],['Final checks','Check toilet flush and water system for leaks']
 ],
 departure:[
 ['Water','Turn off water pump and disconnect Aquaroll'],['Water','Drain water system as appropriate for travel and storage'],['Toilet','Empty and rinse toilet cassette at designated disposal point'],['Toilet','Empty flush tank if required for travel or storage'],['Motor mover','Switch on motor mover isolator before manoeuvring'],['Motor mover','Engage mover rollers only when ready to manoeuvre'],['Motor mover','Disengage motor mover rollers fully before towing'],['Motor mover','Switch off motor mover isolator after positioning'],['Hitching','Reconnect breakaway cable correctly'],['Hitching','Reconnect 13-pin electrical plug and check road lights'],['Final checks','Confirm steadies raised, jockey wheel secured and handbrake released before towing']
 ]};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function choose(templates,kind){const rx=kind==='arrival'?/arrival|setup|pitch|unhitch/i:/departure|hitch|tow|leave/i;return templates.find(t=>rx.test(t.title||'')||rx.test(t.id||''));}
async function run(){const btn=document.getElementById('ct-defaults-import');btn.disabled=true;const status=document.getElementById('ct-defaults-status');try{
 const response=await fetch('/api/checklists');if(!response.ok)throw Error('Unable to load checklist templates');const data=await response.json();
 const targets=Object.entries(sets).map(([kind,entries])=>({kind,entries,template:choose(data.templates||[],kind)}));
 if(targets.some(x=>!x.template))throw Error('Arrival or departure template not found. No changes made.');
 const additions=targets.flatMap(({entries,template})=>entries.filter(([,title])=>!(data.items||[]).some(x=>x.template_id===template.id&&norm(x.title)===norm(title))).map(([section,title])=>({template_id:template.id,title,guidance:section+' — follow the caravan and equipment manuals.'})));
 if(!additions.length){status.textContent='All recommended tasks already exist.';return;}
 if(!confirm(`Add ${additions.length} missing checklist tasks? Existing tasks and completion history will be retained.`)){status.textContent='Cancelled; no changes made.';return;}
 let count=0;for(const task of additions){const r=await fetch('/api/checklists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'item',...task})});if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.error||'Could not add '+task.title)}count++;status.textContent=`Added ${count} of ${additions.length} tasks…`;}
 status.textContent=`Added ${count} tasks. Refresh this page to see them in your checklists.`;
 }catch(e){status.textContent='Import stopped: '+e.message+' (already added tasks will not be duplicated on retry).'}finally{btn.disabled=false;}}

async function pending(){
 const response=await fetch('/api/checklists',{credentials:'same-origin'});
 if(!response.ok)throw Error('Unable to check recommended tasks');
 const data=await response.json();
 const targets=Object.entries(sets).map(([kind,entries])=>({entries,template:choose(data.templates||[],kind)}));
 if(targets.some(x=>!x.template))return null;
 return targets.reduce((count,{entries,template})=>count+entries.filter(([,title])=>!(data.items||[]).some(x=>x.template_id===template.id&&norm(x.title)===norm(title))).length,0);
}
let checking=false, lastCheck=0;
async function syncPanel(force=false){
 const panel=document.querySelector('.ct-defaults-panel');
 if(!panel||checking)return;
 if(!force&&Date.now()-lastCheck<20000)return;
 checking=true;lastCheck=Date.now();
 try{
   const count=await pending();
   panel.hidden=count===0||count===null;
   if(count>0){
     const status=panel.querySelector('#ct-defaults-status');
     if(status)status.textContent=`${count} recommended task${count===1?'':'s'} available to add.`;
   }
 }catch(e){
   // Don't block checklist usage if the recommendations API is unavailable.
   panel.hidden=true;
 }finally{checking=false;}
}
function mount(){
 const root=document.getElementById('phaseLists');
 if(!root||document.getElementById('ct-defaults-import'))return;
 const card=root.querySelector('.phase-card');
 if(!card)return;
 const panel=document.createElement('div');
 panel.className='ct-defaults-panel';
 panel.hidden=true;
 panel.innerHTML='<div><strong>Recommended setup & departure tasks</strong><p>Add motor mover, Aquaroll, toilet and departure checks without replacing your personalised lists.</p><small id="ct-defaults-status" role="status" aria-live="polite"></small></div><button type="button" id="ct-defaults-import" class="secondary">Add missing defaults</button>';
 card.append(panel);
 panel.querySelector('button').addEventListener('click',async()=>{await run();await syncPanel(true)});
 syncPanel(true);
}
function init(){
 mount();
 new MutationObserver(()=>mount()).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPanel(true)});
 window.addEventListener('planner:navigate',e=>{if(e.detail?.page==='checklists')syncPanel(true)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
