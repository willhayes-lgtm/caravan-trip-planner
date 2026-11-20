let trips=[],wishlist=[],shopping=[],towing=[];
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
const todayISO=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const tripTotal=t=>Number(t.cost||0)+Number(t.diesel||0);
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
function daysToGo(t){
 const now=new Date();now.setHours(0,0,0,0);
 const start=new Date(t.start_date+'T00:00:00'),end=new Date(t.end_date+'T00:00:00');
 if(now>=end)return 'Trip finished';
 if(now>=start)return 'On holiday!';
 const n=Math.ceil((start-now)/86400000);return `${n} ${n===1?'day':'days'} to go`;
}
function stopsFor(t){try{const v=typeof t.stops==='string'?JSON.parse(t.stops||'[]'):t.stops;return Array.isArray(v)?v:[]}catch{return []}}
function stopTimeline(t){
 const stops=stopsFor(t);if(!stops.length)return '';
 return `<details class="stop-timeline"><summary>🗺️ View itinerary <span>${stops.length} stops</span></summary><ol>${stops.map((s,i)=>`<li><strong>${safe(s.name)}</strong><div class="meta">${s.arrival?date(s.arrival):'Date TBC'}${s.departure?' – '+date(s.departure):''}${s.arrival&&s.departure?' · '+days(s.arrival,s.departure)+' nights':''}</div>${s.reference?`<div class="meta">Booking ref: ${safe(s.reference)}</div>`:''}${s.notes?`<div class="meta">${safe(s.notes)}</div>`:''}</li>`).join('')}</ol></details>`;
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
 const completed=active.filter(t=>t.status==='completed');
 const completedNights=completed.reduce((n,t)=>n+days(t.start_date,t.end_date),0);
 $('#stats').innerHTML=`<div class="stat lifetime-stat"><span>🌙 Nights completed</span><strong>${completedNights}</strong><small>Lifetime total</small></div><div class="stat lifetime-stat"><span>✓ Trips completed</span><strong>${completed.length}</strong><small>Lifetime total</small></div><div class="stat"><span>Upcoming trips</span><strong>${active.filter(t=>t.end_date>=todayISO()).length}</strong></div><div class="stat"><span>Nights across all trips</span><strong>${active.reduce((n,t)=>n+days(t.start_date,t.end_date),0)}</strong></div><div class="stat"><span>Estimated total</span><strong>${money(total)}</strong></div><div class="stat"><span>Outstanding bookings</span><strong>${money(Math.max(0,sum('cost')-sum('paid')))}</strong></div>`;
 countdown();
 const selectedStatuses=new Set([...document.querySelectorAll('[name="tripStatusFilter"]:checked')].map(x=>x.value));
 const showPast=$('#showPastTrips').checked,order=$('#sortTrips').value,today=todayISO();
 const visible=trips.filter(t=>{
  const isPast=t.end_date<today;
  // The past-trip toggle shows historical holidays independently of the upcoming status choices.
  return isPast?showPast:selectedStatuses.has(t.status);
 }).sort((a,b)=>order==='costAsc'?tripTotal(a)-tripTotal(b):order==='costDesc'?tripTotal(b)-tripTotal(a):a.start_date.localeCompare(b.start_date));
 $('#filterCount').textContent=`Showing ${visible.length} of ${trips.length} trips`;
 $('#trips').innerHTML=visible.map(t=>{
  const activities=String(t.activities||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const past=t.end_date<today, balance=Math.max(0,Number(t.cost||0)-Number(t.paid||0));
  const mileage=t.mileage==null||t.mileage===''?null:Number(t.mileage);
  const stops=stopsFor(t),hasCosts=Number(t.cost)>0||Number(t.paid)>0;
  const refs=stops.filter(s=>s.reference).length||(t.booking_ref?String(t.booking_ref).split(/\r?\n/).filter(Boolean).length:0);
  const paymentHighlight=!past&&balance>0&&t.due_date?`<div class="compact-due">💳 Next payment: <strong>${date(t.due_date)}</strong></div>`:'';
  const summaryBits=[`${date(t.start_date)} – ${date(t.end_date)}`,`${days(t.start_date,t.end_date)} nights`,stops.length?`${stops.length} stops`:null].filter(Boolean).join(' · ');
  return `<article class="trip compact-trip">${photo(t)}<div class="trip-body">
    <div class="top"><div><h3>${safe(t.title)}</h3><div class="meta">${summaryBits}</div></div><span class="pill ${safe(t.status)}">${safe(t.status)}</span></div>
    ${past?(Number(t.rating)>0?`<div class="compact-highlight">⭐ Your rating: <strong>${Number(t.rating)}/10</strong></div>`:''):`<div class="trip-countdown" data-trip-id="${safe(t.id)}">${daysToGo(t)}</div>`}
    <div class="glance-finance" aria-label="Trip costs"><div><small>Total cost</small><strong>${hasCosts?money(t.cost):'—'}</strong></div><div><small>Paid</small><strong>${hasCosts?money(t.paid):'—'}</strong></div><div><small>Balance</small><strong>${hasCosts?money(balance):'—'}</strong></div></div>
    <div class="glance-essentials"><div><span>⛺ Awning</span><strong>${safe(t.awning||'Not decided')}</strong></div><div><span>🚙 Towing</span><strong>${mileage===null?'Not entered':`${(mileage*2).toLocaleString('en-GB')} mi return`}</strong></div></div>
    ${paymentHighlight}
    <details class="compact-details"><summary>View trip details <span class="compact-chevron" aria-hidden="true">⌄</span></summary>
      <div class="compact-details-body">
        <div class="compact-facts" ${mileage===null&&Number(t.diesel)<=0&&Number(t.leave_days)<=0?'hidden':''}>
          ${mileage!==null?`<div><small>One-way mileage</small><strong>${mileage.toLocaleString('en-GB')} mi</strong></div>`:''}
          ${Number(t.diesel)>0?`<div><small>Diesel estimate</small><strong>${money(t.diesel)}</strong></div>`:''}
          ${Number(t.leave_days)>0?`<div><small>Annual leave</small><strong>${leaveLabel(Number(t.leave_days))}</strong></div>`:''}
        </div>
        ${stops.length?stopTimeline(t):''}
        ${bookingCard(t)}
        ${activities.length?`<details class="ideas"><summary>🌿 Things to do <span>${activities.length} ideas</span></summary><div class="ideas-content"><ul>${activities.map(a=>`<li>${safe(a)}</li>`).join('')}</ul></div></details>`:''}
        ${t.notes?`<details class="trip-extra"><summary>📝 Additional notes</summary><div class="trip-extra-content">${safe(t.notes)}</div></details>`:''}
        <div class="actions compact-actions"><button class="secondary" data-edit="${safe(t.id)}">✎ Edit trip</button><details class="compact-more"><summary>••• More</summary><div><button class="secondary" data-delete="${safe(t.id)}">Delete trip</button></div></details></div>
      </div>
    </details>
  </div></article>`;
 }).join('')||'<p>No trips match your filters. Adjust the filters or add a trip.</p>';
 // Replace broken external photos with a non-broken placeholder.
 document.querySelectorAll('.trip-image').forEach(img=>img.addEventListener('error',()=>{img.outerHTML=placeholder},{once:true}));
}
async function reload(){try{trips=await api();$('#notice').textContent='';render()}catch(e){$('#notice').textContent=e.message}}
function openEditor(t){renderStops(stopsFor(t||{}));const f=$('#tripForm');f.reset();for(const [k,v]of Object.entries(t||{}))if(f.elements.namedItem(k))f.elements.namedItem(k).value=v??'';f.elements.rating.value=t?.rating??0;$('#ratingField').hidden=!(t&&t.end_date<todayISO());$('#formTitle').textContent=t?'Edit trip':'Add trip';$('#editor').showModal();}
$('#add').onclick=()=>openEditor(null);
$('#cancel').onclick=()=>$('#editor').close();
$('#trips').onclick=async e=>{
 const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(edit)openEditor(trips.find(t=>t.id===edit.dataset.edit));
 if(del&&confirm('Delete this trip permanently?'))try{await api('DELETE',{id:del.dataset.delete});await reload()}catch(err){alert(err.message)}
};
$('#tripForm').onsubmit=async e=>{
 e.preventDefault();const f=e.target,obj=Object.fromEntries(new FormData(f));obj.stops=JSON.stringify(readStops());
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
reload();loadLists();loadTowing();
setInterval(()=>{countdown();document.querySelectorAll('.trip-countdown').forEach(el=>{const t=trips.find(x=>x.id===el.dataset.tripId);if(t)el.textContent=daysToGo(t)})},60000);

// Itinerary editor: each stop is persisted as JSON in the trips.stops column.
function stopRow(t={}){
 const d=document.createElement('div');d.className='stop-row';
 d.innerHTML=`<label>Site / stop<input class="stop-name" maxlength="160" placeholder="Campsite or overnight stop" value="${safe(t.name||'')}"></label><label>Arrival<input class="stop-arrival" type="date" value="${safe(t.arrival||'')}"></label><label>Departure<input class="stop-departure" type="date" value="${safe(t.departure||'')}"></label><label>Booking reference<input class="stop-reference" maxlength="1000" value="${safe(t.reference||'')}"></label><label class="wide">Notes<input class="stop-notes" maxlength="1000" value="${safe(t.notes||'')}"></label><button type="button" class="secondary stop-remove">Remove stop</button>`;
 d.querySelector('.stop-remove').onclick=()=>d.remove();$('#stopRows').append(d);
}
function renderStops(stops){$('#stopRows').innerHTML='';stops.forEach(stopRow)}
function readStops(){return [...document.querySelectorAll('.stop-row')].map(r=>({
 name:r.querySelector('.stop-name').value.trim(),arrival:r.querySelector('.stop-arrival').value,
 departure:r.querySelector('.stop-departure').value,reference:r.querySelector('.stop-reference').value.trim(),
 notes:r.querySelector('.stop-notes').value.trim()
})).filter(s=>s.name)}
$('#addStop').onclick=()=>stopRow();
// Central router owns navigation. This module only loads section data.
window.addEventListener('planner:navigate',e=>{const page=e.detail.page;if(page==='wishlist'||page==='shopping')loadLists();if(page==='towing')loadTowing();});
async function listApi(kind,method='GET',body){
 const r=await fetch('/api/'+kind,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j;
}
async function loadLists(){
 try{[wishlist,shopping]=await Promise.all([listApi('wishlist'),listApi('shopping')]);renderLists()}
 catch(e){$('#notice').textContent=e.message}
}
function renderLists(){
 $('#wishlistItems').innerHTML=wishlist.map(w=>`<article class="list-card"><h3>${safe(w.name)}</h3><p class="meta">${safe(w.location)}</p><span class="pill">${safe(w.status)}</span>${w.url?`<p><a href="${safe(w.url)}" target="_blank" rel="noopener noreferrer">Campsite website</a></p>`:''}${w.notes?`<p>${safe(w.notes)}</p>`:''}<div class="actions"><button class="secondary" data-list-edit="wishlist" data-id="${safe(w.id)}">Edit</button><button class="secondary" data-list-delete="wishlist" data-id="${safe(w.id)}">Delete</button><button data-list-convert="${safe(w.id)}">Plan trip</button></div></article>`).join('')||'<p>No campsites on your wish list yet.</p>';
 const remaining=shopping.filter(x=>!Number(x.purchased)).reduce((n,x)=>n+Number(x.estimated_cost||0),0);
 $('#shoppingSummary').innerHTML=`<p><strong>${shopping.filter(x=>!Number(x.purchased)).length} items to buy</strong> · Estimated remaining cost: ${money(remaining)}</p>`;
 $('#shoppingItems').innerHTML=shopping.map(x=>`<article class="list-card"><h3>${safe(x.name)}</h3><p>${money(x.estimated_cost)} · ${safe(x.priority)} priority</p><p class="meta">${Number(x.purchased)?'✓ Purchased':'Not purchased'}</p>${x.url?`<p><a href="${safe(x.url)}" target="_blank" rel="noopener noreferrer">Product link</a></p>`:''}${x.notes?`<p>${safe(x.notes)}</p>`:''}<div class="actions"><button class="secondary" data-list-edit="shopping" data-id="${safe(x.id)}">Edit</button><button class="secondary" data-list-delete="shopping" data-id="${safe(x.id)}">Delete</button><button data-list-toggle="${safe(x.id)}">${Number(x.purchased)?'Mark unpurchased':'Mark purchased'}</button></div></article>`).join('')||'<p>Your shopping list is empty.</p>';
}
function listEditor(kind,item={}){
 const f=$('#listForm');f.reset();f.elements.id.value=item.id||'';f.elements.kind.value=kind;
 $('#listFormTitle').textContent=(item.id?'Edit ':'Add ')+(kind==='wishlist'?'campsite':'shopping item');
 const input=(name,label,value='',type='text')=>`<label>${label}<input name="${name}" type="${type}" value="${safe(value)}"></label>`;
 const select=(name,label,opts,value)=>`<label>${label}<select name="${name}">${opts.map(o=>`<option value="${safe(o)}" ${o===value?'selected':''}>${safe(o)}</option>`).join('')}</select></label>`;
 $('#listFields').innerHTML=kind==='wishlist'
 ?input('name','Campsite name',item.name)+input('location','Location',item.location)+input('url','Website URL',item.url,'url')+select('status','Status',['Interested','Shortlisted','Ready to book'],item.status||'Interested')+input('notes','Notes',item.notes)
 :input('name','Item name',item.name)+input('estimated_cost','Estimated price (£)',item.estimated_cost||0,'number')+input('url','Product URL',item.url,'url')+select('priority','Priority',['Low','Medium','High'],item.priority||'Medium')+select('purchased','Purchased?',['0','1'],String(Number(item.purchased||0)))+input('notes','Notes',item.notes);
 $('#listEditor').showModal();
}
$('#addWish').onclick=()=>listEditor('wishlist');
$('#addShop').onclick=()=>listEditor('shopping');
$('#listCancel').onclick=()=>$('#listEditor').close();
$('#listForm').onsubmit=async e=>{
 e.preventDefault();const t=Object.fromEntries(new FormData(e.target)),kind=t.kind;delete t.kind;
 try{await listApi(kind,t.id?'PUT':'POST',t);$('#listEditor').close();await loadLists()}catch(err){alert(err.message)}
};
for(const kind of ['wishlist','shopping'])$('#'+(kind==='wishlist'?'wishlistItems':'shoppingItems')).onclick=async e=>{
 const btn=e.target.closest('button');if(!btn)return;
 const id=btn.dataset.id||btn.dataset.listToggle||btn.dataset.listConvert;
 const item=(kind==='wishlist'?wishlist:shopping).find(x=>x.id===id);if(!item)return;
 if(btn.dataset.listEdit)listEditor(kind,item);
 else if(btn.dataset.listDelete&&confirm('Delete this item?'))try{await listApi(kind,'DELETE',{id});await loadLists()}catch(err){alert(err.message)}
 else if(btn.dataset.listToggle)try{await listApi('shopping','PUT',{...item,purchased:Number(item.purchased)?0:1});await loadLists()}catch(err){alert(err.message)}
 else if(btn.dataset.listConvert){
  document.querySelector('[data-page="trips"]').click();
  openEditor({title:item.name,location:item.location,notes:item.notes,start_date:'',end_date:'',status:'planned',cost:0,paid:0,diesel:0,leave_days:0,image_url:'',mileage:'',activities:'',awning:'Not decided',stops:'[]'});
 }
};

// Booking references are presented as structured, scannable data.
function bookingCard(t){
 const stops=stopsFor(t),refs=stops.filter(s=>s.reference).map(s=>({name:s.name,ref:s.reference}));
 if(!refs.length&&t.booking_ref){
  const lines=String(t.booking_ref).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  for(const line of lines){const idx=line.indexOf(': ');refs.push(idx>0?{name:line.slice(0,idx),ref:line.slice(idx+2)}:{name:'Booking reference',ref:line})}
 }
 if(!refs.length&&!t.due_date&&!Number(t.cost))return '';
 const balance=Math.max(0,Number(t.cost||0)-Number(t.paid||0));
 return `<section class="booking-summary"><div class="booking-summary-heading"><strong>Booking & payments</strong><span class="payment-status">${balance?money(balance)+' outstanding':'No balance recorded'}</span></div>${t.due_date?`<div class="payment-due"><span>Next payment deadline</span><strong>${date(t.due_date)}</strong></div>`:''}${refs.length?`<details class="booking-refs-details"><summary>Booking references (${refs.length})</summary><div class="reference-rows">${refs.map(r=>`<div><span>${safe(r.name)}</span><strong>${safe(r.ref)}</strong></div>`).join('')}</div></details>`:''}</section>`;
}
document.querySelectorAll('[name="tripStatusFilter"]').forEach(c=>c.onchange=render);
$('#showPastTrips').onchange=render;
$('#sortTrips').onchange=render;
$('#clearFilters').onclick=()=>{document.querySelectorAll('[name="tripStatusFilter"]').forEach(c=>c.checked=['booked','planned'].includes(c.value));$('#showPastTrips').checked=false;$('#sortTrips').value='date';render()};
async function towingApi(method='GET',body){const r=await fetch('/api/towing',{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to load towing log');return j}
async function loadTowing(){try{towing=await towingApi();renderTowing()}catch(e){$('#towingItems').innerHTML=`<p>${safe(e.message)}</p>`}}
function renderTowing(){
 const total=towing.reduce((n,t)=>n+Number(t.miles||0),0),year=new Date().getFullYear(),yearMiles=towing.filter(t=>t.journey_date.startsWith(String(year))).reduce((n,t)=>n+Number(t.miles||0),0);
 $('#towingStats').innerHTML=`<div class="stat"><span>Total logged towing</span><strong>${total.toLocaleString('en-GB',{maximumFractionDigits:1})} miles</strong></div><div class="stat"><span>${year} towing</span><strong>${yearMiles.toLocaleString('en-GB',{maximumFractionDigits:1})} miles</strong></div><div class="stat"><span>Journey legs logged</span><strong>${towing.length}</strong></div>`;
 $('#towingItems').classList.add('tow-list-view');
 $('#towingItems').innerHTML=towing.map(t=>`<article class="list-card"><div class="top"><div><h3>${safe(t.origin)} → ${safe(t.destination)}</h3><p class="meta">${date(t.journey_date)}${t.trip_id&&trips.find(x=>x.id===t.trip_id)?' · '+safe(trips.find(x=>x.id===t.trip_id).title):''}</p></div><strong class="tow-miles">${Number(t.miles).toLocaleString('en-GB')} mi</strong></div>${t.notes?`<p class="meta">${safe(t.notes)}</p>`:''}<div class="actions"><button type="button" class="secondary tow-icon-btn" data-tow-edit="${safe(t.id)}" aria-label="Edit towing journey" title="Edit journey"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z"/></svg></button><button type="button" class="secondary tow-icon-btn tow-delete-btn" data-tow-delete="${safe(t.id)}" aria-label="Delete towing journey" title="Delete journey"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg></button></div></article>`).join('')||'<p>No towing journeys logged yet. Add each journey leg to build your lifetime towing total.</p>';
}
function towingEditor(t={}){
 const f=$('#towingForm');f.reset();$('#towingTitle').textContent=t.id?'Edit journey':'Log towing journey';
 $('#towTrip').innerHTML='<option value="">No linked trip</option>'+trips.map(x=>`<option value="${safe(x.id)}">${safe(x.title)}</option>`).join('');
 for(const [k,v]of Object.entries(t))if(f.elements.namedItem(k))f.elements.namedItem(k).value=v??'';
 if(!t.id){const now=new Date();f.elements.journey_date.value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')}
 $('#towingEditor').showModal();
}
$('#addTow').onclick=()=>towingEditor();$('#towCancel').onclick=()=>$('#towingEditor').close();
$('#towingForm').onsubmit=async e=>{e.preventDefault();const obj=Object.fromEntries(new FormData(e.target));try{await towingApi(obj.id?'PUT':'POST',obj);$('#towingEditor').close();await loadTowing()}catch(err){alert(err.message)}};
$('#towingItems').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.towEdit||b.dataset.towDelete,t=towing.find(x=>x.id===id);if(!t)return;if(b.dataset.towEdit)towingEditor(t);else if(confirm('Delete this towing journey?'))try{await towingApi('DELETE',{id});await loadTowing()}catch(err){alert(err.message)}};
