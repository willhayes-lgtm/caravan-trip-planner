/* Final visibility reconciler for legacy navigation modules. */
(()=>{'use strict';
if(location.pathname!=='/'&&!location.pathname.endsWith('/index.html'))return;
const pages={dashboard:'dashboardPage',trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',profile:'checklistsPage',checklists:'checklistsPage'};
let selected=null,version=0;
function reconcile(key){if(!pages[key])return;selected=key;const n=++version;
const sync=()=>{if(n!==version)return;
 for(const id of new Set(Object.values(pages))){const p=document.getElementById(id);if(p)p.hidden=id!==pages[key]}
 const cp=document.getElementById('checklistsPage');if(cp){const isProfile=key==='profile';cp.classList.toggle('ux-profile-view',isProfile);cp.classList.toggle('ux-checklists-view',key==='checklists');const lists=document.getElementById('phaseLists'),profile=document.getElementById('phaseProfile');if(lists)lists.hidden=isProfile;if(profile)profile.hidden=!isProfile;}
 document.querySelectorAll('.main-nav .nav-button,.main-nav .ux-nav-link').forEach(b=>{const isProfile=b.matches('[data-ux-profile],[data-uxProfile]');const active=(isProfile?'profile':b.dataset.page)===key;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 const bar=document.querySelector('.ux-page-pinbar');if(bar)bar.hidden=key==='dashboard';
 };
 sync();requestAnimationFrame(sync);setTimeout(sync,80);setTimeout(sync,350);
}
function fromTarget(t){if(t.matches('[data-ux-profile],[data-uxProfile]'))return 'profile';return t.dataset.page}
document.addEventListener('click',e=>{const nav=e.target.closest('.main-nav');const target=e.target.closest('[data-page],[data-ux-profile],[data-uxProfile]');if(!nav||!target)return;const key=fromTarget(target);if(pages[key])setTimeout(()=>reconcile(key),0)},true);
window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(pages[key])reconcile(key)});
setTimeout(()=>{const key=location.hash.slice(1);const active=document.querySelector('.main-nav .active');reconcile(pages[key]?key:(active?fromTarget(active):'dashboard'))},1500);
})();
