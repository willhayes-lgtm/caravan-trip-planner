/* Caravan Trip Planner: sole owner of page selection and sidebar active state. */
(()=>{'use strict';
if(!['/','/index.html'].includes(location.pathname))return;
const pages={dashboard:'dashboardPage',trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',profile:'checklistsPage',checklists:'checklistsPage',service:'servicePage',payload:'payloadPage'};
let current='dashboard';
const nav=()=>document.querySelector('.main-nav');
const keyOf=el=>el?.matches('[data-ux-profile],[data-uxProfile]')?'profile':el?.dataset.page;
function show(key,changeUrl=true){
 if(!pages[key])return;
 current=key;document.body.dataset.currentPage=key;
 const target=pages[key];
 for(const id of new Set(Object.values(pages))){const section=document.getElementById(id);if(section)section.hidden=id!==target;}
 const cp=document.getElementById('checklistsPage');if(cp){
  const profile=key==='profile';cp.classList.toggle('ux-profile-view',profile);cp.classList.toggle('ux-checklists-view',key==='checklists');
  const lists=cp.querySelector('#phaseLists'),details=cp.querySelector('#phaseProfile');
  if(lists)lists.hidden=profile;if(details)details.hidden=!profile;
  const title=cp.querySelector('.phase-head h2');if(title&&['profile','checklists'].includes(key))title.textContent=profile?'Caravan profile':'Checklists';
 }
 nav()?.querySelectorAll('button,a').forEach(item=>{const selected=keyOf(item)===key;item.classList.toggle('active',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')});
 const bar=document.querySelector('.ux-page-pinbar');if(bar){bar.hidden=key==='dashboard';bar.style.display=key==='dashboard'?'none':''}
 const pin=document.getElementById('uxPinCurrent');if(pin)pin.hidden=key==='dashboard';
 if(changeUrl){const next=key==='dashboard'?location.pathname:'#'+key;history.replaceState(null,'',next)}
 window.dispatchEvent(new CustomEvent('planner:navigate',{detail:{page:key}}));
}
function navigate(key,changeUrl=true){show(key,changeUrl)}
function route(){const key=location.hash.slice(1);navigate(pages[key]?key:'dashboard',false)}
function setup(){
 document.addEventListener('click',e=>{
  const item=e.target.closest('.main-nav [data-page],.main-nav [data-ux-profile],.main-nav [data-uxProfile]');
  if(!item)return;const key=keyOf(item);if(!pages[key])return;
  e.preventDefault();e.stopImmediatePropagation();navigate(key);
 },true);
 document.addEventListener('click',e=>{const go=e.target.closest('[data-ux-go]');if(go&&pages[go.dataset.uxGo]){e.preventDefault();navigate(go.dataset.uxGo)}});
 window.addEventListener('hashchange',route);
 // The modules inject their navigation and content during DOMContentLoaded.
 route();
 window.requestAnimationFrame(()=>show(current,false));
 setTimeout(()=>show(current,false),250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
