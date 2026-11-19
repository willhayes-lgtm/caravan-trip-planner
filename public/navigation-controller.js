/* One navigation authority; other modules remain responsible for loading their own data. */
(()=>{'use strict';
if(location.pathname!=='/'&&!location.pathname.endsWith('/index.html'))return;
const pages=['dashboard','trips','wishlist','shopping','towing','maintenance','profile','checklists'];
const nav=document.querySelector('.main-nav');if(!nav)return;
let current='dashboard',internal=false;
const getCheck=()=>nav.querySelector('[data-page="checklists"]');
const profileLink=()=>nav.querySelector('[data-ux-profile],[data-uxProfile]');
function render(key){if(!pages.includes(key))return;current=key;document.body.dataset.currentPage=key;
 const checkPage=document.getElementById('checklistsPage');if(checkPage){checkPage.classList.toggle('ux-profile-view',key==='profile');checkPage.classList.toggle('ux-checklists-view',key==='checklists');const title=checkPage.querySelector('.phase-head h2');if(title&&['profile','checklists'].includes(key))title.textContent=key==='profile'?'Caravan profile':'Checklists';}
 nav.querySelectorAll('button,a').forEach(item=>{const k=item===profileLink()?'profile':item.dataset.page;const on=k===key;item.classList.toggle('active',on);if(on)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')});
 const bar=document.querySelector('.ux-page-pinbar');if(bar)bar.hidden=key==='dashboard';const btn=document.getElementById('uxPinCurrent');if(btn)btn.hidden=key==='dashboard';
}
function go(key,fromRoute=false){if(!pages.includes(key))return;
 if(['profile','checklists'].includes(key)){const check=getCheck();if(check){internal=true;check.click();internal=false;}
  const tab=document.querySelector('#checklistsPage [data-section="'+(key==='profile'?'profile':'lists')+'"]');if(tab)tab.click();
 }
 render(key);if(!fromRoute)history.replaceState(null,'','#'+key);
}
// Capture the profile link before legacy handlers. Other menu clicks are allowed to run data loaders.
document.addEventListener('click',e=>{if(internal)return;const item=e.target.closest('a,button');if(!item||!nav.contains(item))return;
 if(item===profileLink()){e.preventDefault();e.stopImmediatePropagation();go('profile');return}
 const key=item.dataset.page;if(!pages.includes(key))return;
 if(key==='checklists'){e.preventDefault();e.stopImmediatePropagation();go('checklists');return}
 render(key);if(key==='dashboard')history.replaceState(null,'',location.pathname);
 else history.replaceState(null,'','#'+key);
},true);
// A later legacy handler may mutate hidden or active classes; CSS and the state above win.
window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(pages.includes(key)){if(key==='profile'||key==='checklists')go(key,true);else {const item=nav.querySelector('[data-page="'+key+'"]');if(item){internal=true;item.click();internal=false;}render(key)}}});
function init(){const key=location.hash.slice(1);if(pages.includes(key)){if(key==='profile'||key==='checklists')go(key,true);else {const b=nav.querySelector('[data-page="'+key+'"]');if(b){internal=true;b.click();internal=false;}render(key)}}else render('dashboard')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));else setTimeout(init,700);
})();
