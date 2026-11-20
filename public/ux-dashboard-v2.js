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
function pinControl(){const main=document.querySelector(phase?'.phase-content main':'main');if(!main)return;const bar=el('div','ux-page-pinbar');const b=el('button','secondary','+ Add to my dashboard');b.id='uxPinCurrent';b.type='button';bar.append(b);main.prepend(bar);b.addEventListener('click',()=>{const key=activeKey();if(!names[key])return;pins=pins.includes(key)?pins.filter(x=>x!==key):[...pins,key];save();updatePinButton();renderPins()});updatePinButton();document.addEventListener('click',()=>setTimeout(updatePinButton,90));window.addEventListener('hashchange',()=>setTimeout(updatePinButton,90));}
function renderPins(){const root=document.getElementById('uxPinnedCards');if(!root)return;root.innerHTML='';const title=el('h3','','My dashboard shortcuts');root.append(title);const cards=el('div','ux-pin-grid');if(!pins.length){cards.append(el('p','ux-pin-empty','Use “Add to my dashboard” on any page to save a shortcut here.'))}else for(const key of pins){if(!names[key])continue;const tile=el('div','ux-pin-tile');const a=el('a','ux-pin-card',names[key]+' →');a.href=hrefs[key];const remove=el('button','ux-pin-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+names[key]+' from dashboard');remove.addEventListener('click',()=>{pins=pins.filter(x=>x!==key);save();renderPins();updatePinButton()});tile.append(a,remove);cards.append(tile)}root.append(cards)}
async function maintenanceCard(){
 const root=document.getElementById('uxMaintenanceCard');if(!root)return;
 root.className='ux-maint-status ux-maint-loading';root.textContent='Checking maintenance schedule…';
 try{
  const response=await fetch('/api/maintenance');if(!response.ok)throw Error('Maintenance unavailable');
  const result=await response.json();
  const today=new Date();today.setHours(0,0,0,0);
  const tasks=(result.tasks||[]).filter(t=>t.next_due).map(t=>{
   const parts=String(t.next_due).slice(0,10).split('-').map(Number);
   const due=new Date(parts[0],parts[1]-1,parts[2]);
   return {...t,days:Math.round((due-today)/86400000)};
  }).filter(t=>Number.isFinite(t.days));
  const overdue=tasks.filter(t=>t.days<0).sort((a,b)=>a.days-b.days);
  const todayDue=tasks.filter(t=>t.days===0);
  const soon=tasks.filter(t=>t.days>0&&t.days<=Number(t.warning_days??14)).sort((a,b)=>a.days-b.days);
  const attention=[...overdue,...todayDue,...soon];
  const state=overdue.length?'overdue':todayDue.length?'today':soon.length?'soon':'clear';
  root.className='ux-maint-status ux-maint-'+state;
  root.replaceChildren();
  const icon=el('span','ux-maint-symbol',state==='overdue'?'!':state==='clear'?'✓':'!');icon.setAttribute('aria-hidden','true');
  const content=el('div','ux-maint-status-copy');
  const title=el('strong','',overdue.length?`${overdue.length} overdue maintenance ${overdue.length===1?'task':'tasks'}`:todayDue.length?`${todayDue.length} maintenance ${todayDue.length===1?'task':'tasks'} due today`:soon.length?`${soon.length} maintenance ${soon.length===1?'task':'tasks'} due soon`:'Maintenance up to date');
  const detail=el('span','',attention.length?attention.slice(0,2).map(t=>`${t.title} · ${t.days<0?`${-t.days}d overdue`:t.days===0?'Due today':`In ${t.days}d`}`).join('  •  ')+(attention.length>2?`  •  +${attention.length-2} more`:''):'Nothing due within your configured warning periods.');
  content.append(title,detail);
  const link=el('a','ux-maint-status-link','View maintenance →');link.href='/#maintenance';
  root.append(icon,content,link);
 }catch{
  root.className='ux-maint-status ux-maint-loading';root.replaceChildren(el('span','','Maintenance status unavailable. '));
  const a=el('a','','Open maintenance →');a.href='/#maintenance';root.append(a);
 }
}
async function coverCard(){const root=document.getElementById('uxCoverCard');if(!root)return;try{const r=await fetch('/api/caravan-profile');if(!r.ok)throw Error('Unable to load');const p=await r.json();const today=new Date();today.setHours(0,0,0,0);const alerts=[['Caravan insurance',p.insurance_expiry_date],['Breakdown cover',p.breakdown_expiry_date]].filter(x=>x[1]).map(([name,iso])=>{const v=iso.split('-').map(Number);return {name,days:Math.round((new Date(v[0],v[1]-1,v[2])-today)/86400000)}}).filter(x=>Number.isFinite(x.days)&&x.days<=30).sort((a,b)=>a.days-b.days);root.hidden=!alerts.length;root.replaceChildren();if(!alerts.length)return;root.append(el('h3','','Cover & renewals'));for(const a of alerts){const row=el('div','ux-cover-row');row.append(el('strong','',a.name),el('span','',a.days<0?`${-a.days} days overdue`:a.days===0?'Expires today':`${a.days} days left`));root.append(row)}const link=el('a','','Review in caravan profile →');link.href='/#profile';root.append(link)}catch{root.hidden=false;root.textContent='Unable to check cover renewal dates.'}}
function dashboard(){if(phase)return;const dash=document.getElementById('dashboardPage');if(!dash)return;let widget=document.getElementById('uxMaintenanceCard');if(!widget){widget=el('section','ux-maint-status');widget.id='uxMaintenanceCard';const cards=document.getElementById('uxDashboardCards');cards?.before(widget)}let pinsRoot=document.getElementById('uxPinnedCards');if(!pinsRoot){pinsRoot=el('section','ux-pinned-section');pinsRoot.id='uxPinnedCards';dash.append(pinsRoot)}let cover=document.getElementById('uxCoverCard');if(!cover){cover=el('section','ux-cover-card');cover.id='uxCoverCard';document.getElementById('uxDashboardCards')?.before(cover)}maintenanceCard();coverCard();renderPins();window.addEventListener('planner:navigate',e=>{if(e.detail?.page==='dashboard'){maintenanceCard();coverCard()}});}
function separateProfile(){if(phase)return;const nav=document.querySelector('.main-nav');if(!nav)return;const check=()=>nav.querySelector('[data-page="checklists"]');let profile=nav.querySelector('[data-ux-profile]');if(!profile)profile=nav.querySelector('[data-uxProfile]');if(!profile){profile=el('button','nav-button','▣ Profile');profile.type='button';profile.dataset.uxProfile='1';nav.append(profile)}profile.textContent='▣ Profile';profile.setAttribute('href','/#profile');
const page=()=>document.getElementById('checklistsPage');let internal=false;function select(section){const b=check();if(!b||!page())return;internal=true;b.click();internal=false;const tab=page().querySelector(`[data-section="${section}"]`);tab?.click();page().classList.toggle('ux-profile-view',section==='profile');page().classList.toggle('ux-checklists-view',section!=='profile');const title=page().querySelector('.phase-head h2');if(title)title.textContent=section==='profile'?'Caravan profile':'Checklists';nav.querySelectorAll('.nav-button').forEach(x=>x.classList.toggle('active',section==='profile'?false:x===b));if(section==='profile')profile.classList.add('active');else profile.classList.remove('active');history.replaceState(null,'','#'+(section==='profile'?'profile':'checklists'));updatePinButton()}
profile.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();select('profile')},true);
nav.addEventListener('click',e=>{const b=e.target.closest('[data-page="checklists"]');if(b&&!internal){setTimeout(()=>{if(location.hash!=='#profile')select('lists')},30)}else if(e.target.closest('[data-page]'))profile.classList.remove('active')});
function route(){if(location.hash==='#profile')select('profile');else if(location.hash==='#checklists')select('lists')}
window.addEventListener('hashchange',route);setTimeout(route,1100);
}
function init(){pinControl();dashboard();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
