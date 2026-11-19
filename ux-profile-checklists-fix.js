/* Profile/checklist navigation authority. Runs after legacy scripts. */
(()=>{'use strict';
if(location.pathname!=='/' && !location.pathname.endsWith('/index.html'))return;
const nav=document.querySelector('.main-nav');if(!nav)return;
const ids=['dashboard','trips','wishlist','shopping','towing','maintenance','checklists'];
const pageIds={dashboard:'dashboardPage',trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',checklists:'checklistsPage',profile:'checklistsPage'};
let bypass=false,chosen='dashboard',serial=0;
const getProfile=()=>nav.querySelector('[data-ux-profile],[data-uxProfile]');
const getCheck=()=>nav.querySelector('[data-page="checklists"]');
function enforce(key){
 const current=++serial;chosen=key;
 function sync(){if(current!==serial)return;
  for(const [k,id] of Object.entries(pageIds)){const p=document.getElementById(id);if(p)p.hidden=id!==pageIds[key]}
  const cp=document.getElementById('checklistsPage');if(cp){const profile=key==='profile';cp.classList.toggle('ux-profile-view',profile);cp.classList.toggle('ux-checklists-view',key==='checklists');const a=cp.querySelector('#phaseLists'),b=cp.querySelector('#phaseProfile');if(a)a.hidden=profile;if(b)b.hidden=!profile;const h=cp.querySelector('.phase-head h2');if(h&&['profile','checklists'].includes(key))h.textContent=profile?'Caravan profile':'Checklists';}
  nav.querySelectorAll('.nav-button,.ux-nav-link,[data-ux-profile],[data-uxProfile]').forEach(el=>{const k=el===getProfile()?'profile':el.dataset.page;const on=k===key;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  const pin=document.getElementById('uxPinCurrent');if(pin)pin.hidden=key==='dashboard';const bar=document.querySelector('.ux-page-pinbar');if(bar)bar.hidden=key==='dashboard';
 }
 sync();requestAnimationFrame(sync);setTimeout(sync,90);setTimeout(sync,350);
}
function go(key){
 const check=getCheck();if(!check)return;
 // Trigger the original checklist module to load data, then take ownership of the visible view.
 bypass=true;try{check.click()}finally{bypass=false}
 enforce(key);history.replaceState(null,'','#'+key);
}
// Capture before any of the legacy navigation listeners; prevent duplicate selection handlers.
document.addEventListener('click',e=>{
 if(bypass)return;
 const target=e.target.closest('[data-page="checklists"],[data-ux-profile],[data-uxProfile]');
 if(!target||!nav.contains(target))return;
 e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
 go(target===getProfile()?'profile':'checklists');
},true);
// Reconcile other menu items after their existing modules load.
nav.addEventListener('click',e=>{if(bypass)return;const b=e.target.closest('[data-page]');if(!b)return;const key=b.dataset.page;if(!pageIds[key]||key==='checklists')return;setTimeout(()=>enforce(key),40)},false);
function route(){const key=location.hash.slice(1);if(key==='profile'||key==='checklists')go(key);else if(pageIds[key]){const b=nav.querySelector('[data-page="'+key+'"]');if(b)b.click();else enforce(key)}}
window.addEventListener('hashchange',route);
setTimeout(route,1000);
})();
