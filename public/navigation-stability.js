/* Navigation reconciliation after legacy page modules have handled clicks. */
(()=>{'use strict';
if(location.pathname!=='/'&&!location.pathname.endsWith('/index.html'))return;
const pageIds={dashboard:'dashboardPage',trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',profile:'checklistsPage',checklists:'checklistsPage'};
const nav=document.querySelector('.main-nav');if(!nav)return;
let current=null,version=0;
const keyFor=b=>b?.matches('[data-ux-profile],[data-uxProfile]')?'profile':b?.dataset.page;
function reconcile(key){if(!pageIds[key])return;current=key;const v=++version;
const apply=()=>{if(v!==version)return;
for(const id of new Set(Object.values(pageIds))){const node=document.getElementById(id);if(node)node.hidden=id!==pageIds[key]}
const cp=document.getElementById('checklistsPage');if(cp){const profile=key==='profile';cp.classList.toggle('ux-profile-view',profile);cp.classList.toggle('ux-checklists-view',key==='checklists');const lists=document.getElementById('phaseLists'),spec=document.getElementById('phaseProfile');if(lists)lists.hidden=profile;if(spec)spec.hidden=!profile;}
nav.querySelectorAll('button,a').forEach(b=>{const active=keyFor(b)===key;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
const pin=document.querySelector('.ux-page-pinbar');if(pin)pin.hidden=key==='dashboard';
};apply();requestAnimationFrame(apply);setTimeout(apply,50);setTimeout(apply,200);
}
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-page],button[data-ux-profile],a[data-ux-profile],a[data-uxProfile]');if(!b)return;const key=keyFor(b);if(pageIds[key])setTimeout(()=>reconcile(key),0)},true);
window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(pageIds[key])reconcile(key)});
setTimeout(()=>{const key=location.hash.slice(1);reconcile(pageIds[key]?key:keyFor(nav.querySelector('.active'))||'dashboard')},1200);
})();
