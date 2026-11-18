let trips=[];
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
const days=(a,b)=>Math.max(0,Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'—';
const WORKING_DAY_HOURS=8;
function leaveLabel(totalDays){
 const mins=Math.round(Math.max(0,totalDays)*WORKING_DAY_HOURS*60),whole=Math.floor(mins/(WORKING_DAY_HOURS*60)),rest=mins-whole*WORKING_DAY_HOURS*60;
 return [whole?`${whole} ${whole===1?'day':'days'}`:'',Math.floor(rest/60)?`${Math.floor(rest/60)}h`:'',rest%60?`${rest%60}m`:''].filter(Boolean).join(' + ')||'0 days';
}
const roundTrip=t=>t.mileage==null||t.mileage===''?null:2*Number(t.mileage);
function nextTrip(){
 const today=new Date();today.setHours(0,0,0,0);
 return trips.filter(t=>t.status!=='cancelled'&&t.end_date&&new Date(t.end_date+'T00:00:00')>today)
 .sort((a,b)=>a.start_date.localeCompare(b.start_date))[0];
}
function countdown(){
 const t=nextTrip(),el=$('#nextTrip');if(!el)return;
 if(!t){el.innerHTML='<div class="next-trip-empty">No upcoming trips scheduled.</div>';return}
 const now=new Date(),start=new Date(t.start_date+'T00:00:00');
 const ms=start-now;
 const duration=Math.max(0,ms);
 const d=Math.floor(duration/86400000),h=Math.floor(duration%86400000/3600000),m=Math.floor(duration%3600000/60000);
 el.innerHTML=`<div class="next-trip-info"><span class="eyebrow">UP NEXT</span><h2>${safe(t.title)}</h2><p>${safe(t.location)} · ${date(t.start_date)} – ${date(t.end_date)}</p><span class="pill ${safe(t.status)}">${safe(t.status)}</span></div><div class="countdown">${ms<=0?'<strong>On your trip!</strong>':`<div><strong>${d}</strong><small>days</small></div><div><strong>${h}</strong><small>hours</small></div><div><strong>${m}</strong><small>mins</small></div>`}</div>`;
}
const placeholder=`<div class="trip-placeholder" aria-label="No photo added">🚐<span>Photo coming soon</span></div>`;
function photo(t){
 if(!t.image_url)return placeholder;
 return `<img class="trip-image" src="${safe(t.image_url)}" alt="Photo of ${safe(t.location||t.title)}" loading="lazy" referrerpolicy="no-referrer">`;
}
async function api(method='GET',body){
 const r=await fetch('/api/trips',{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j;
}
function render(){
 const active=trips.filter(t=>t.status!=='cancelled');
 const sum=k=>active.reduce((n,t)=>n+Number(t[k]||0),0),total=sum('cost')+sum('diesel');
 $('#stats').innerHTML=`<div class="stat"><span>Trips planned</span><strong>${active.length}</strong></div><div class="stat"><span>Nights away</span><strong>${active.reduce((n,t)=>n+days(t.start_date,t.end_date),0)}</strong></div><div class="stat"><span>Estimated total</span><strong>${money(total)}</strong></div><div class="stat"><span>Outstanding bookings</span><strong>${money(Math.max(0,sum('cost')-sum('paid')))}</strong></div><div class="stat"><span>Annual leave planned</span><strong>${leaveLabel(sum('leave_days'))}</strong></div>`;
 countdown();
 $('#trips').innerHTML=trips.map(t=>{
  const activities=String(t.activities||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const miles=t.mileage==null||t.mileage===''?'Not set':`${Number(t.mileage).toLocaleString('en-GB')} miles`;
  const returnMiles=roundTrip(t);
  return `<article class="trip">${photo(t)}<div class="trip-body"><div class="top"><div><h3>${safe(t.title)}</h3><div class="meta">${safe(t.location)} · ${date(t.start_date)} – ${date(t.end_date)} · ${days(t.start_date,t.end_date)} nights</div></div><span class="pill ${safe(t.status)}">${safe(t.status)}</span></div>
  <div class="mileage"><span>🚗 From Lymm Marina</span><strong>${safe(miles)} one way</strong><strong>${returnMiles===null?'Not set':returnMiles.toLocaleString('en-GB')+' miles'} round trip</strong><small>Estimated road distance · return via same route · excludes local excursions</small></div>
  <div class="numbers"><div><small>Bookings</small><strong>${money(t.cost)}</strong></div><div><small>Paid</small><strong>${money(t.paid)}</strong></div><div><small>Balance</small><strong>${money(Math.max(0,t.cost-t.paid))}</strong></div></div>
  <div class="meta">Diesel estimate: ${money(t.diesel)} · Leave: ${leaveLabel(Number(t.leave_days||0))}${t.due_date?' · Due '+date(t.due_date):''}</div>
  <details class="ideas"><summary>🌿 Things to do nearby & on site <span>${activities.length} ideas</span></summary><div class="ideas-content">${activities.length?`<ul>${activities.map(a=>`<li>${safe(a)}</li>`).join('')}</ul>`:'<p>No activities added yet. Edit this trip to add local attractions and on-site ideas.</p>'}</div></details>
  ${t.booking_ref||t.due_date?`<div class="booking-info"><strong>📋 Booking details</strong>${t.booking_ref?`<div class="booking-refs">${safe(t.booking_ref)}</div>`:''}${t.due_date?`<div>Next payment due: <strong>${date(t.due_date)}</strong></div>`:''}</div>`:''}
  ${t.notes?`<p class="trip-notes">${safe(t.notes)}</p>`:''}
  <div class="actions"><button class="secondary" data-edit="${safe(t.id)}">Edit</button><button class="secondary" data-delete="${safe(t.id)}">Delete</button></div></div></article>`;
 }).join('')||'<p>No trips yet. Add a trip or import the starter data.</p>';
 // Replace broken external photos with a non-broken placeholder.
 document.querySelectorAll('.trip-image').forEach(img=>img.addEventListener('error',()=>{img.outerHTML=placeholder},{once:true}));
}
async function reload(){try{trips=await api();$('#notice').textContent='';render()}catch(e){$('#notice').textContent=e.message}}
function openEditor(t){const f=$('#tripForm');f.reset();for(const [k,v]of Object.entries(t||{}))if(f.elements.namedItem(k))f.elements.namedItem(k).value=v??'';$('#formTitle').textContent=t?'Edit trip':'Add trip';$('#editor').showModal();}
$('#add').onclick=()=>openEditor(null);
$('#cancel').onclick=()=>$('#editor').close();
$('#trips').onclick=async e=>{
 const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(edit)openEditor(trips.find(t=>t.id===edit.dataset.edit));
 if(del&&confirm('Delete this trip permanently?'))try{await api('DELETE',{id:del.dataset.delete});await reload()}catch(err){alert(err.message)}
};
$('#tripForm').onsubmit=async e=>{
 e.preventDefault();const f=e.target,obj=Object.fromEntries(new FormData(f));
 try{await api(obj.id?'PUT':'POST',obj);$('#editor').close();await reload()}catch(err){alert(err.message)}
};
$('#export').onclick=()=>{
 const blob=new Blob([JSON.stringify({format:'caravan-planner-v1',exported_at:new Date().toISOString(),trips},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='caravan-planner-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$('#import').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{
 try{const parsed=JSON.parse(await e.target.files[0].text());if(parsed.format!=='caravan-planner-v1'||!Array.isArray(parsed.trips))throw Error('Invalid planner JSON file');
 if(!confirm(`Import ${parsed.trips.length} trips? Existing matching IDs will be updated. Other trips will remain.`))return;
 for(const t of parsed.trips){if(t.id&&trips.some(x=>x.id===t.id))await api('PUT',t);else await api('POST',t)}
 await reload();alert('Import complete')
 }catch(err){alert(err.message)}finally{e.target.value=''}
};
$('#logout').onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.href='/login'};
reload();
setInterval(countdown,60000);
