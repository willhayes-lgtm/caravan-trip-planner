/* Non-destructive layout/UX layer: existing modules and D1 endpoints stay unchanged. */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const phase=location.pathname.includes('phase2.html');
const nav=phase?$('.phase2-site-nav'):$('.main-nav');
if(!nav)return;
const shell=document.createElement('div');shell.className='ux-shell';
const sidebar=document.createElement('aside');sidebar.className='ux-sidebar';sidebar.id='uxSidebar';
const brand=document.createElement('div');brand.className='ux-brand';brand.innerHTML='<span class="ux-brand-icon">🚐</span><div><strong>Caravan Planner</strong><small>Our adventures</small></div>';
const mobile=document.createElement('button');mobile.className='ux-menu-toggle secondary';mobile.type='button';mobile.textContent='☰ Menu';mobile.setAttribute('aria-controls','uxSidebar');mobile.setAttribute('aria-expanded','false');
const backdrop=document.createElement('button');backdrop.className='ux-backdrop';backdrop.type='button';backdrop.setAttribute('aria-label','Close navigation');
const content=document.createElement('div');content.className='ux-content';
const parent=nav.parentNode;parent.insertBefore(mobile,nav);parent.insertBefore(shell,nav);shell.append(sidebar,content);sidebar.append(brand,nav);content.append(document.querySelector('main'));
document.body.append(backdrop);
function closeMenu(){document.body.classList.remove('ux-menu-open');mobile.setAttribute('aria-expanded','false')}
mobile.addEventListener('click',()=>{const open=document.body.classList.toggle('ux-menu-open');mobile.setAttribute('aria-expanded',String(open))});backdrop.addEventListener('click',closeMenu);nav.addEventListener('click',closeMenu);
function link(label,href,icon){const a=document.createElement('a');a.className='ux-nav-link';a.href=href;a.textContent=icon+' '+label;return a}
function group(label){const el=document.createElement('div');el.className='ux-nav-group';el.textContent=label;return el}
function place(el,groupName){if(groupName)nav.append(group(groupName));nav.append(el)}
nav.classList.add('ux-nav');
if(!phase){
 const dash=document.createElement('button');dash.type='button';dash.className='nav-button ux-dash-button';dash.dataset.page='dashboard';dash.textContent='⌂ Dashboard';nav.prepend(dash);
 const trips=nav.querySelector('[data-page="trips"]');if(trips)trips.textContent='▦ My Trips';
 nav.append(group('MY CARAVAN'));
 const checklist=()=>nav.querySelector('[data-page="checklists"]');
 const profile=link('Caravan Profile','/#profile','🚐');profile.dataset.uxProfile='1';
 const maintenance=()=>nav.querySelector('[data-page="maintenance"]');
 const move=()=>{if(checklist()){nav.append(profile);nav.append(checklist())}if(maintenance())nav.append(maintenance());};
 move();const observer=new MutationObserver(()=>{if(checklist()&&!nav.contains(profile))move();if(checklist()&&profile.nextElementSibling!==checklist())move()});observer.observe(nav,{childList:true});
 profile.addEventListener('click',e=>{e.preventDefault();openProfile()});
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;if(b.dataset.page==='dashboard'){e.stopImmediatePropagation();showDashboard()}else{hideDashboard();updateActiveSoon()}},true);
 window.addEventListener('hashchange',routeHash);
 setTimeout(()=>{if(location.hash==='#profile'||location.hash==='#checklists'||location.hash==='#maintenance')routeHash();else showDashboard()},450);
 loadDashboard();
 function hideDashboard(){const d=$('#dashboardPage');if(d)d.hidden=true}
 function showDashboard(){const d=$('#dashboardPage');if(!d)return;$$('main > section, main > div[id$="Page"]').forEach(el=>{if(el!==d)el.hidden=true});d.hidden=false;nav.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.page==='dashboard'));history.replaceState(null,'',location.pathname);}
 function updateActiveSoon(){setTimeout(()=>nav.querySelector('.ux-dash-button')?.classList.remove('active'),0)}
 function openProfile(){const b=checklist();if(!b){setTimeout(openProfile,200);return}b.click();setTimeout(()=>{const p=$('#checklistsPage [data-section="profile"]');if(p)p.click();history.replaceState(null,'','#profile')},70)}
 function routeHash(){if(location.hash==='#profile'){openProfile()}else if(location.hash==='#checklists'){checklist()?.click();setTimeout(()=>$('#checklistsPage [data-section="lists"]')?.click(),50)}else if(location.hash==='#maintenance'){maintenance()?.click()}}
 async function loadDashboard(){const root=$('#uxDashboardCards');if(!root)return;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));try{const response=await fetch('/api/trips');if(!response.ok)throw Error('Unable to load trips');const json=await response.json();const trips=Array.isArray(json)?json:(json.trips||[]);const today=new Date().toISOString().slice(0,10);const upcoming=trips.filter(t=>t.end_date>=today&&t.status!=='cancelled').sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date)));const next=upcoming[0];root.innerHTML=`<article class="ux-summary-card ux-next"><span class="ux-kicker">NEXT ADVENTURE</span><h3>${next?esc(next.title):'Your next adventure awaits'}</h3><p>${next?esc(next.location||'Destination to be confirmed')+' · '+esc(next.start_date):'Add a trip to get started.'}</p><button type="button" class="ux-action" data-ux-go="trips">View my trips →</button></article><article class="ux-summary-card"><span class="ux-kicker">YOUR PLANS</span><h3>${upcoming.length} upcoming ${upcoming.length===1?'trip':'trips'}</h3><p>Keep bookings, dates and budgets together.</p><button type="button" class="secondary" data-ux-go="trips">Manage trips</button></article><article class="ux-summary-card"><span class="ux-kicker">BEFORE YOU GO</span><h3>Departure checklists</h3><p>Work through your safety checks before towing.</p><button type="button" class="secondary" data-ux-go="checklists">Open checklists</button></article><article class="ux-summary-card"><span class="ux-kicker">MY CARAVAN</span><h3>Maintenance & payload</h3><p>Keep your caravan ready for the road.</p><a class="ux-action-link" href="/phase2.html#payload">View payload calculator →</a></article>`}catch(e){root.innerHTML='<article class="ux-summary-card"><h3>Welcome to your planner</h3><p>Open My Trips to see your bookings and plans.</p><button class="secondary" data-ux-go="trips">View my trips</button></article>'}}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-ux-go]');if(!b)return;nav.querySelector(`[data-page="${b.dataset.uxGo}"]`)?.click()});
}else{
 const links=[...nav.querySelectorAll('a')];links.forEach(a=>{if(a.textContent.includes('Checklists'))a.href='/#profile'});
 nav.prepend(link('Dashboard','/','⌂'));
 const payload=$('#payloadSummary');if(payload){payload.addEventListener('click',e=>{const target=e.target.closest('.stat');if(target&&/Set in profile/i.test(target.textContent))location.href='/#profile'})}
 const tabs=$('.tabs');if(tabs)tabs.hidden=true;
 const setActive=()=>{const hash=location.hash==='#payload'?'payload':'service';links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='/phase2.html#'+hash))};window.addEventListener('hashchange',setActive);setActive();
}
// Checklist rows are click targets, except when editing or using an action control.
document.addEventListener('click',e=>{const row=e.target.closest('.phase-task');if(!row||e.target.closest('input,button,a,select,textarea')||row.closest('.phase-editmode'))return;const box=row.querySelector('input[data-check]');if(box&&!box.disabled)box.click()});
})();
