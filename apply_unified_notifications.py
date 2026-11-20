#!/usr/bin/env python3
"""Patch Caravan Trip Planner dashboard notifications. Run once from repo root."""
from pathlib import Path
p=Path('public/ux-dashboard-v2.js')
s=p.read_text()
start=s.find('async function maintenanceCard(){')
end=s.find('function separateProfile(){',start)
if start<0 or end<0:
    raise SystemExit('Expected dashboard code not found. No files changed; do not rerun blindly.')
replacement=r'''// Unified dashboard notifications: local calendar dates, category-specific warning windows.
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
 root.replaceChildren();
 const header=el('div','ux-notification-head');header.append(el('h3','','Notifications & actions'));
 const count=el('span','ux-notification-count',`${unique.length} ${unique.length===1?'action':'actions'}`);header.append(count);root.append(header);
 if(!unique.length){root.append(el('div','ux-notification-empty','✓ You’re all caught up — no upcoming actions.'))}
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
  root.append(list);
 }
 const failed=['maintenance','caravan profile','trips'].filter((_,i)=>sources[i].status==='rejected');
 if(failed.length)root.append(el('p','ux-notification-partial','Some notifications could not be checked ('+failed.join(', ')+'). Refresh to try again.'));
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
'''
s=s[:start]+replacement+s[end:]
# Only write when anchors confirmed.
p.write_text(s)
css=Path('public/unified-notifications.css')
css.write_text('''/* Dashboard notification centre — one priority-ordered source of actions. */
#maintenanceAlerts,#uxMaintenanceCard,#uxCoverCard{display:none!important}
.ux-notification-centre{background:#fff;border:1px solid #dce9e9;border-radius:16px;padding:20px 22px;margin:0 0 18px;color:#153f50}
.ux-notification-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.ux-notification-head h3{font-size:21px;margin:0}.ux-notification-count{font-size:12px;font-weight:700;background:#eaf1f2;border-radius:999px;padding:6px 10px}
.ux-notification-list{display:grid;gap:10px}.ux-notification-item{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 16px;border-radius:11px;border:1px solid transparent;border-left-width:4px}
.ux-notification-critical{background:#fff1f0;border-color:#f2ceca;border-left-color:#c93e35}.ux-notification-warning{background:#fff8eb;border-color:#f0dfbd;border-left-color:#d7942b}
.ux-notification-main{display:grid;gap:5px;min-width:0}.ux-notification-main strong{font-size:15px}.ux-notification-meta{font-size:13px;color:#5b6e75}
.ux-notification-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}.ux-notification-pill{font-size:12px;font-weight:750;border-radius:999px;padding:4px 9px}
.ux-notification-critical .ux-notification-pill{color:#992f2a;background:#fbd9d5}.ux-notification-warning .ux-notification-pill{color:#865309;background:#ffe8bb}
.ux-notification-link{font-size:13px;font-weight:700;color:#155f70;text-decoration:underline}.ux-notification-empty{padding:14px 0;color:#386b5a}.ux-notification-loading,.ux-notification-partial{font-size:13px;color:#6b747a}
@media(max-width:650px){.ux-notification-centre{padding:15px}.ux-notification-item{align-items:flex-start;flex-direction:column}.ux-notification-right{width:100%;flex-direction:row;justify-content:space-between;align-items:center}}
''')
index=Path('public/index.html')
s=index.read_text()
anchor='<link rel="stylesheet" href="/trip-wishlist-cover.css?v=1">'
if s.count(anchor)!=1:
    raise SystemExit('Stylesheet anchor missing; dashboard JS changed, inspect before proceeding.')
s=s.replace(anchor,anchor+'<link rel="stylesheet" href="/unified-notifications.css?v=1">')
js_anchor='<script src="/ux-dashboard-v2.js?v=1" defer></script>'
if s.count(js_anchor)!=1:
    raise SystemExit('Dashboard script anchor missing; inspect before proceeding.')
s=s.replace(js_anchor,'<script src="/ux-dashboard-v2.js?v=2" defer></script>')
index.write_text(s)
print('Updated public/ux-dashboard-v2.js and public/index.html')
print('Created public/unified-notifications.css')
print('No SQL migration required')
