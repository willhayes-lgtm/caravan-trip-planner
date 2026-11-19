/* Single-selection navigation guard. Loaded after the earlier UX scripts. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const phase=location.pathname.includes('phase2.html');
const names=['dashboard','trips','wishlist','shopping','towing','maintenance','checklists','profile'];
const mainPages={dashboard:'dashboardPage',trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',checklists:'checklistsPage',profile:'checklistsPage'};
function pin(key){const bar=$('.ux-page-pinbar');if(bar){bar.hidden=key==='dashboard';bar.style.display=key==='dashboard'?'none':'';}const button=$('#uxPinCurrent');if(button&&key==='dashboard')button.hidden=true;}
function applyMain(key){if(!mainPages[key])return;for(const [name,id] of Object.entries(mainPages)){const p=document.getElementById(id);if(p)p.hidden=(name!==key && !(name==='checklists'&&key==='profile') && !(name==='profile'&&key==='checklists'));}
 const nav=$('.main-nav');if(nav){nav.querySelectorAll('.nav-button,.ux-nav-link,[data-ux-profile]').forEach(b=>{const k=b.dataset.uxProfile?'profile':b.dataset.page;const selected=k===key;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
 const page=$('#checklistsPage');if(page){const isProfile=key==='profile';page.classList.toggle('ux-profile-view',isProfile);page.classList.toggle('ux-checklists-view',key==='checklists');const lists=$('#phaseLists'),profile=$('#phaseProfile');if(lists)lists.hidden=isProfile;if(profile)profile.hidden=!isProfile;const heading=page.querySelector('.phase-head h2');if(heading&&['profile','checklists'].includes(key))heading.textContent=isProfile?'Caravan profile':'Checklists';}
 pin(key);
}
function applyPhase(){const key=location.hash==='#payload'?'payload':'service';const s=$('#serviceTab'),p=$('#payloadTab');if(s)s.hidden=key!=='service';if(p)p.hidden=key!=='payload';document.querySelectorAll('.phase-side-links a').forEach(a=>{const selected=a.getAttribute('href')==='/phase2.html#'+key;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});pin(key);
 const h=$('.phase-content>header');if(h){const eyebrow=h.querySelector('.eyebrow'),title=h.querySelector('h1'),sub=h.querySelector('p');if(eyebrow)eyebrow.textContent='THE HAYES FAMILY';if(title)title.textContent='🚐 Caravan Trip Planner';if(sub)sub.textContent='2027 holidays, bookings & budgets in one place.';}
}
function init(){if(phase){applyPhase();window.addEventListener('hashchange',()=>setTimeout(applyPhase,0));return;}
 const nav=$('.main-nav');if(!nav)return;
 let forwarding=false;
 // Override competing Profile and Checklist click handlers at the navigation boundary.
 nav.addEventListener('click',e=>{const target=e.target.closest('[data-ux-profile],[data-page="checklists"]');if(!target||forwarding)return;
   e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
   const key=target.dataset.page==='checklists'?'checklists':'profile';
   const checklist=nav.querySelector('[data-page="checklists"]');
   if(checklist){forwarding=true;checklist.click();forwarding=false;}
   const finalize=()=>{applyMain(key);history.replaceState(null,'','#'+key)};
   finalize();setTimeout(finalize,0);setTimeout(finalize,120);
 },true);
 // Other sections retain their existing data-loading handlers, but selection is reconciled afterwards.
 nav.addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(!button||forwarding)return;const key=button.dataset.page;if(!mainPages[key]||key==='checklists')return;const sync=()=>applyMain(key);setTimeout(sync,0);setTimeout(sync,100);},false);
 function route(){const key=location.hash.slice(1);if(key==='profile'||key==='checklists'){const target=key==='profile'?nav.querySelector('[data-ux-profile]'):nav.querySelector('[data-page="checklists"]');target?.click();}else if(mainPages[key]){const b=nav.querySelector(`[data-page="${key}"]`);if(b)b.click();else applyMain(key);}else applyMain('dashboard');}
 window.addEventListener('hashchange',route);
 setTimeout(()=>{route();},1350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
