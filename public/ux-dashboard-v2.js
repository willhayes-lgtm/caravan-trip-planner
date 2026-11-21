/* UX update: distinct profile/checklist views, dashboard maintenance, user-selected dashboard shortcuts. */
(()=>{'use strict';
const phase=location.pathname.includes('phase2.html');
const names={trips:'My Trips',wishlist:'Wish List',towing:'Towing Log',shopping:'Shopping List',profile:'Caravan Profile',checklists:'Checklists',maintenance:'Maintenance',service:'Service History',payload:'Payload Calculator'};
const hrefs={trips:'/#trips',wishlist:'/#wishlist',towing:'/#towing',shopping:'/#shopping',profile:'/#profile',checklists:'/#checklists',maintenance:'/#maintenance',service:'/#service',payload:'/#payload'};
const store='caravan-dashboard-pins-v1';let pins=[];try{pins=JSON.parse(localStorage.getItem(store)||'[]');if(!Array.isArray(pins))pins=[]}catch{pins=[]}
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e};
function save(){localStorage.setItem(store,JSON.stringify(pins))}
function activeKey(){if(phase)return location.hash==='#payload'?'payload':'service';const h=location.hash.slice(1);if(names[h])return h;const b=document.querySelector('.main-nav .nav-button.active');return b?.dataset.page==='dashboard'?'dashboard':b?.dataset.page||'dashboard'}
function updatePinButton(){const btn=document.getElementById('uxPinCurrent');if(!btn)return;const key=activeKey();btn.hidden=key==='dashboard'||!names[key];btn.textContent=pins.includes(key)?'✓ Added to my dashboard':'+ Add to my dashboard';btn.setAttribute('aria-pressed',String(pins.includes(key)))}
function pinControl(){const main=document.querySelector(phase?'.phase-content main':'main');if(!main)return;const bar=el('div','ux-page-pinbar');const b=el('button','secondary','+ Add to my dashboard');b.id='uxPinCurrent';b.type='button';bar.append(b);main.prepend(bar);const positionPin=()=>{const page=document.querySelector('body[data-current-page] #'+({trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',checklists:'checklistsPage',profile:'checklistsPage',service:'servicePage',payload:'payloadPage'}[activeKey()]||''));if(!page)return;const head=page.querySelector(':scope > .phase-head, :scope > .toolbar, :scope > .section-head, :scope > .phase2 .section-head, :scope > .phase2 #serviceTab .section-head, :scope > .phase2 #payloadTab .section-head');if(head)head.insertAdjacentElement('afterend',bar);else page.prepend(bar);};window.addEventListener('planner:navigate',()=>requestAnimationFrame(positionPin));setTimeout(positionPin,400);b.addEventListener('click',()=>{const key=activeKey();if(!names[key])return;pins=pins.includes(key)?pins.filter(x=>x!==key):[...pins,key];save();updatePinButton();renderPins()});updatePinButton();document.addEventListener('click',()=>setTimeout(updatePinButton,90));window.addEventListener('hashchange',()=>setTimeout(updatePinButton,90));}
function renderPins(){const root=document.getElementById('uxPinnedCards');if(!root)return;root.innerHTML='';const title=el('h3','','My dashboard shortcuts');root.append(title);const cards=el('div','ux-pin-grid');if(!pins.length){cards.append(el('p','ux-pin-empty','Use “Add to my dashboard” on any page to save a shortcut here.'))}else for(const key of pins){if(!names[key])continue;const tile=el('div','ux-pin-tile');const a=el('a','ux-pin-card',names[key]+' →');a.href=hrefs[key];const remove=el('button','ux-pin-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+names[key]+' from dashboard');remove.addEventListener('click',()=>{pins=pins.filter(x=>x!==key);save();renderPins();updatePinButton()});tile.append(a,remove);cards.append(tile)}root.append(cards)}
// Unified dashboard notifications: local calendar dates, category-specific warning windows.
const notificationWindows={insurance:30,breakdown:30,maintenance:30,payment:14,trip:7};
const localISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function daysUntil(iso){
 if(typeof iso!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(iso.slice(0,10)))return null;
 const [y,m,d]=iso.slice(0,10).split('-').map(Number);
 const utc=Date.UTC(y,m-1,d);
 if(new Date(utc).toISOString().slice(0,10)!==iso.slice(0,10))return null;
 const [ty,tm,td]=localISO().split('-').map(Number);
 return Math.round((utc-Date.UTC(ty,tm-1,td))/86400000);
}
async function fetchNotifications(path){const r=await fetch('/api/'+path,{cache:'no-store'});if(!r.ok)throw Error(path+' unavailable');return r.json()}
function notificationText(n){
 if(n.days<0)return n.expiry?`Expired ${-n.days} ${-n.days===1?'day':'days'} ago`:`${-n.days} ${-n.days===1?'day':'days'} overdue`;
 if(n.days===0)return n.expiry?'Expires today':'Due today';
 return n.expiry?`Expires in ${n.days} ${n.days===1?'day':'days'}`:`Due in ${n.days} ${n.days===1?'day':'days'}`;
}
let notificationRequest=0;
async function notificationCentre(){
 const root=document.getElementById('uxNotificationCentre');if(!root)return;
 const request=++notificationRequest;
 root.replaceChildren(el('p','ux-notification-loading','Checking upcoming actions…'));
 const sources=await Promise.allSettled(['maintenance','caravan-profile','trips'].map(fetchNotifications));
 if(request!==notificationRequest)return;
 const [maint,profile,trips]=sources.map(x=>x.status==='fulfilled'?x.value:null);
 const notices=[];
 const add=(item)=>{if(item.days!==null&&Number.isFinite(item.days))notices.push({...item,severity:item.days<0?'critical':'warning'})};
 if(maint){
  for(const task of maint.tasks||[]){
   // Pre-departure maintenance is covered by the trip-preparation reminder below.
   if(task.interval_unit==='before_trip')continue;
   const days=daysUntil(task.next_due);
   if(days!==null&&days<=notificationWindows.maintenance)add({key:'maintenance:'+task.id,title:task.title||'Maintenance task',category:'Maintenance',days,href:'/#maintenance',action:'View maintenance',expiry:false});
  }
 }
 if(profile){
  for(const [key,title,field] of [['insurance','Caravan insurance','insurance_expiry_date'],['breakdown','Breakdown cover','breakdown_expiry_date']]){
   const days=daysUntil(profile[field]);
   if(days!==null&&days<=notificationWindows[key])add({key:'cover:'+key,title,category:'Caravan profile',days,href:'/#profile',action:'Review cover',expiry:true});
  }
 }
 if(Array.isArray(trips)){
  for(const trip of trips){
   if(trip.status==='cancelled')continue;
   const outstanding=Math.max(0,Number(trip.cost||0)-Number(trip.paid||0));
   const paymentDays=daysUntil(trip.due_date);
   if(outstanding>0.005&&paymentDays!==null&&paymentDays<=notificationWindows.payment){
    const pounds=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(outstanding);
    add({key:'payment:'+trip.id,title:`${trip.title||'Trip'} · ${pounds} outstanding`,category:'Campsite payment',days:paymentDays,href:'/#trips',action:'Review booking',expiry:false});
   }
   const departureDays=daysUntil(trip.start_date);
   if(departureDays!==null&&departureDays>=0&&departureDays<=notificationWindows.trip&&trip.status!=='completed'){
    add({key:'trip:'+trip.id,title:`Prepare for ${trip.title||'your trip'}`,category:'Trip preparation',days:departureDays,href:'/#checklists',action:'Open checklists',expiry:false});
   }
  }
 }
 // Critical first, then earliest deadline. One entry per underlying source record.
 const unique=[...new Map(notices.map(n=>[n.key,n])).values()].sort((a,b)=>(a.severity==='critical'?0:1)-(b.severity==='critical'?0:1)||a.days-b.days||a.title.localeCompare(b.title));
 // Preserve a user's open/closed choice during background refreshes.
 // A fresh page load always starts collapsed.
 const wasOpen=root.querySelector('#uxNotificationDetails')?.open===true;
 root.replaceChildren();
 const details=el('details','ux-notification-details');
 details.id='uxNotificationDetails';
 details.open=wasOpen;
 const summary=el('summary','ux-notification-summary');
 const heading=el('span','ux-notification-summary-title','Notifications & actions');
 const badges=el('span','ux-notification-summary-badges');
 const overdue=unique.filter(n=>n.severity==='critical').length;
 const soon=unique.length-overdue;
 if(overdue)badges.append(el('span','ux-notification-summary-badge ux-notification-summary-critical',`${overdue} overdue / expired`));
 if(soon)badges.append(el('span','ux-notification-summary-badge ux-notification-summary-warning',`${soon} due soon`));
 if(!unique.length)badges.append(el('span','ux-notification-summary-badge ux-notification-summary-clear','All caught up'));
 const chevron=el('span','ux-notification-chevron','⌄');
 chevron.setAttribute('aria-hidden','true');
 summary.append(heading,badges,chevron);
 details.append(summary);
 const content=el('div','ux-notification-content');
 if(!unique.length){content.append(el('div','ux-notification-empty','✓ You’re all caught up — no upcoming actions.'))}
 else{
  const list=el('div','ux-notification-list');
  for(const n of unique){
   const row=el('div','ux-notification-item ux-notification-'+n.severity);
   const main=el('div','ux-notification-main');main.append(el('strong','',n.title));
   main.append(el('span','ux-notification-meta',n.category+' · '+notificationText(n)));
   const right=el('div','ux-notification-right');
   right.append(el('span','ux-notification-pill',n.severity==='critical'?(n.expiry?'Expired':'Overdue'):'Due soon'));
   const link=el('a','ux-notification-link',n.action+' →');link.href=n.href;right.append(link);
   row.append(main,right);list.append(row);
  }
  content.append(list);
 }
 const failed=['maintenance','caravan profile','trips'].filter((_,i)=>sources[i].status==='rejected');
 if(failed.length){
  // Show incomplete-data warnings even when the details are collapsed.
  const warning=el('p','ux-notification-partial','Some notifications could not be checked ('+failed.join(', ')+'). Refresh to try again.');
  root.append(details,warning);
 }else root.append(details);
 details.append(content);
}
function dashboard(){
 if(phase)return;
 const dash=document.getElementById('dashboardPage');if(!dash)return;
 // Remove obsolete individual panels; all sources are now rendered together.
 document.getElementById('uxMaintenanceCard')?.remove();
 document.getElementById('uxCoverCard')?.remove();
 let centre=document.getElementById('uxNotificationCentre');
 if(!centre){centre=el('section','ux-notification-centre');centre.id='uxNotificationCentre';centre.setAttribute('aria-label','Notifications and actions');const cards=document.getElementById('uxDashboardCards');if(cards)cards.before(centre);else dash.append(centre)}
 let pinsRoot=document.getElementById('uxPinnedCards');
 if(!pinsRoot){pinsRoot=el('section','ux-pinned-section');pinsRoot.id='uxPinnedCards';dash.append(pinsRoot)}
 notificationCentre();renderPins();
 window.addEventListener('planner:navigate',e=>{if(e.detail?.page==='dashboard')notificationCentre()});
 window.addEventListener('focus',()=>{if(!dash.hidden)notificationCentre()});
}
function separateProfile(){if(phase)return;const nav=document.querySelector('.main-nav');if(!nav)return;const check=()=>nav.querySelector('[data-page="checklists"]');let profile=nav.querySelector('[data-ux-profile]');if(!profile)profile=nav.querySelector('[data-uxProfile]');if(!profile){profile=el('button','nav-button','▣ Profile');profile.type='button';profile.dataset.uxProfile='1';nav.append(profile)}profile.textContent='▣ Profile';profile.setAttribute('href','/#profile');
const page=()=>document.getElementById('checklistsPage');let internal=false;function select(section){const b=check();if(!b||!page())return;internal=true;b.click();internal=false;const tab=page().querySelector(`[data-section="${section}"]`);tab?.click();page().classList.toggle('ux-profile-view',section==='profile');page().classList.toggle('ux-checklists-view',section!=='profile');const title=page().querySelector('.phase-head h2');if(title)title.textContent=section==='profile'?'Caravan profile':'Checklists';nav.querySelectorAll('.nav-button').forEach(x=>x.classList.toggle('active',section==='profile'?false:x===b));if(section==='profile')profile.classList.add('active');else profile.classList.remove('active');history.replaceState(null,'','#'+(section==='profile'?'profile':'checklists'));updatePinButton()}
// Profile navigation is handled centrally by navigation-controller.js.
nav.addEventListener('click',e=>{const b=e.target.closest('[data-page="checklists"]');if(b&&!internal){setTimeout(()=>{if(location.hash!=='#profile')select('lists')},30)}else if(e.target.closest('[data-page]'))profile.classList.remove('active')});
function route(){if(location.hash==='#profile')select('profile');else if(location.hash==='#checklists')select('lists')}
window.addEventListener('hashchange',route);setTimeout(route,1100);
}
function init(){pinControl();dashboard();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
